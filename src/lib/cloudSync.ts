import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  getInitialUserProfile,
  saveUserProfile,
  getPlaylists,
  savePlaylists,
  getVideoProgressList,
  saveAllVideoProgress,
  getDailyActivityMap,
  saveDailyActivityMap,
  getDownloadedCertificateIds,
  recordCertificateDownload,
  calculateStreaksFromActivity,
} from './storage';
import { UserProfile, Playlist, VideoProgress, DailyActivity } from '@/types';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

let lastHeartbeatTime = 0;
const MIN_HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 seconds minimum between periodic background cloud writes

/**
 * Push all local study stats to Firestore in a single atomic batch write.
 * Protects Firestore quotas by consolidating profile, courses, and heatmap into 1 network batch.
 */
export async function syncLocalDataToCloud(uid: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db || !uid) return false;

  try {
    const profile = getInitialUserProfile();
    const playlists = getPlaylists();
    const progressList = getVideoProgressList();
    const activityMap = getDailyActivityMap();
    const certificates = getDownloadedCertificateIds();
    const now = new Date().toISOString();

    const batch = writeBatch(db);

    // 1. User Profile Document: users/{uid}
    const userDocRef = doc(db, 'users', uid);
    batch.set(
      userDocRef,
      {
        id: uid,
        name: profile.name,
        email: profile.email,
        totalXP: profile.totalXP,
        currentStreak: profile.currentStreak,
        longestStreak: profile.longestStreak,
        lastStudyDate: profile.lastStudyDate,
        activePlaylistsCount: playlists.length,
        downloadedCertificates: certificates,
        lastSyncedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    // 2. Activity Document: users/{uid}/data/activity (Entire year's heatmap in 1 document)
    const activityDocRef = doc(db, 'users', uid, 'data', 'activity');
    batch.set(
      activityDocRef,
      {
        activityMap,
        updatedAt: now,
      },
      { merge: true }
    );

    // 3. Courses Document: users/{uid}/data/courses (All courses + video progress in 1 document)
    const coursesDocRef = doc(db, 'users', uid, 'data', 'courses');
    batch.set(
      coursesDocRef,
      {
        playlists,
        progressList,
        updatedAt: now,
      },
      { merge: true }
    );

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Firestore batch sync error:', error);
    return false;
  }
}

/**
 * Load cloud data into local storage on login.
 * Executes exactly 3 document reads, merges with local state, and caches locally.
 */
export async function loadCloudDataToLocal(
  uid: string,
  userEmail?: string | null,
  displayName?: string | null
): Promise<{ success: boolean; profile: UserProfile }> {
  const localProfile = getInitialUserProfile();

  if (!isFirebaseConfigured || !db || !uid) {
    return { success: false, profile: localProfile };
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const activityDocRef = doc(db, 'users', uid, 'data', 'activity');
    const coursesDocRef = doc(db, 'users', uid, 'data', 'courses');

    // Fetch all 3 aggregated documents in parallel (total 3 reads)
    const [userSnap, activitySnap, coursesSnap] = await Promise.all([
      getDoc(userDocRef),
      getDoc(activityDocRef),
      getDoc(coursesDocRef),
    ]);

    let mergedProfile = { ...localProfile };
    let needsPushBack = false;

    // 1. Process Profile
    if (userSnap.exists()) {
      const data = userSnap.data();
      mergedProfile = {
        id: uid,
        name: displayName || data.name || localProfile.name || 'Scholar',
        email: userEmail || data.email || localProfile.email,
        totalXP: Math.max(data.totalXP || 0, localProfile.totalXP || 0),
        currentStreak: Math.max(data.currentStreak || 0, localProfile.currentStreak || 0),
        longestStreak: Math.max(data.longestStreak || 0, localProfile.longestStreak || 0),
        lastStudyDate: data.lastStudyDate || localProfile.lastStudyDate,
        activePlaylistsCount: data.activePlaylistsCount || localProfile.activePlaylistsCount,
        createdAt: data.createdAt || localProfile.createdAt,
      };

      // Merge certificates
      if (Array.isArray(data.downloadedCertificates)) {
        data.downloadedCertificates.forEach((certId: string) => {
          recordCertificateDownload(certId);
        });
      }
    } else {
      // First-time cloud user: seed with current local progress
      mergedProfile.id = uid;
      if (displayName) mergedProfile.name = displayName;
      if (userEmail) mergedProfile.email = userEmail;
      needsPushBack = true;
    }

    // 2. Process Activity Map (Heatmap)
    if (activitySnap.exists()) {
      const cloudActivity = (activitySnap.data().activityMap || {}) as Record<string, DailyActivity>;
      const localActivity = getDailyActivityMap();
      const mergedActivity: Record<string, DailyActivity> = { ...localActivity };

      Object.entries(cloudActivity).forEach(([date, act]) => {
        if (!mergedActivity[date]) {
          mergedActivity[date] = act;
        } else {
          mergedActivity[date] = {
            date,
            minutesWatched: Math.max(mergedActivity[date].minutesWatched, act.minutesWatched || 0),
            verifiedCount: Math.max(mergedActivity[date].verifiedCount, act.verifiedCount || 0),
            xpEarned: Math.max(mergedActivity[date].xpEarned, act.xpEarned || 0),
          };
        }
      });

      saveDailyActivityMap(mergedActivity);
      const recalculatedStreaks = calculateStreaksFromActivity(mergedActivity);
      mergedProfile.currentStreak = recalculatedStreaks.currentStreak;
      mergedProfile.longestStreak = Math.max(mergedProfile.longestStreak, recalculatedStreaks.longestStreak);
    } else {
      needsPushBack = true;
    }

    // 3. Process Playlists & Progress
    if (coursesSnap.exists()) {
      const cloudPlaylists = (coursesSnap.data().playlists || []) as Playlist[];
      const cloudProgress = (coursesSnap.data().progressList || {}) as Record<string, VideoProgress>;
      const localPlaylists = getPlaylists();
      const localProgress = getVideoProgressList();

      // Merge playlists: keep unique playlists by id
      const playlistMap = new Map<string, Playlist>();
      cloudPlaylists.forEach(p => playlistMap.set(p.id, p));
      localPlaylists.forEach(p => {
        if (!playlistMap.has(p.id)) playlistMap.set(p.id, p);
      });
      const mergedPlaylists = Array.from(playlistMap.values());
      savePlaylists(mergedPlaylists);
      mergedProfile.activePlaylistsCount = mergedPlaylists.length;

      // Merge video progress
      const mergedProgress = { ...localProgress };
      Object.entries(cloudProgress).forEach(([key, prog]) => {
        const localP = mergedProgress[key];
        if (!localP || (prog.isVerified && !localP.isVerified) || (prog.watchedSeconds > (localP.watchedSeconds || 0))) {
          mergedProgress[key] = prog;
        }
      });
      saveAllVideoProgress(mergedProgress);
    } else {
      needsPushBack = true;
    }

    saveUserProfile(mergedProfile);

    // If local had unsynced progress, push the unified merged state to Firestore in 1 atomic batch
    if (needsPushBack) {
      await syncLocalDataToCloud(uid);
    }

    return { success: true, profile: mergedProfile };
  } catch (error) {
    console.error('Error loading cloud data:', error);
    return { success: false, profile: localProfile };
  }
}

/**
 * Throttled periodic heartbeat sync.
 * Guarantees that active video watchers sync at most ONCE every 60 seconds.
 */
export async function debouncedHeartbeatSync(uid: string): Promise<void> {
  const now = Date.now();
  if (now - lastHeartbeatTime < MIN_HEARTBEAT_INTERVAL_MS) {
    return; // Skip write to save quota
  }
  lastHeartbeatTime = now;
  await syncLocalDataToCloud(uid);
}
