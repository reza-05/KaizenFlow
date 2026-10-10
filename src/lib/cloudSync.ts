import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  setActiveUserScope,
  getInitialUserProfile,
  saveUserProfile,
  getPlaylists,
  savePlaylists,
  getVideoProgressList,
  saveAllVideoProgress,
  getDailyActivityMap,
  saveDailyActivityMap,
  getDownloadedCertificateIds,
  saveDownloadedCertificateIds,
} from './storage';
import { UserProfile, Playlist, VideoProgress, DailyActivity } from '@/types';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

let lastHeartbeatTime = 0;
const MIN_HEARTBEAT_INTERVAL_MS = 60 * 1000;

/**
 * Push all local study stats to Firestore in a single atomic batch write.
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

    // 2. Activity Document: users/{uid}/data/activity (Entire year's heatmap)
    const activityDocRef = doc(db, 'users', uid, 'data', 'activity');
    batch.set(
      activityDocRef,
      {
        activityMap,
        updatedAt: now,
      },
      { merge: true }
    );

    // 3. Courses Document: users/{uid}/data/courses (All courses + video progress)
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
 * For returning users: loads ONLY their own cloud data.
 * For new users: starts 100% clean and fresh (0 playlists, 0 progress, 0 streak, 0 XP).
 */
export async function loadCloudDataToLocal(
  uid: string,
  userEmail?: string | null,
  displayName?: string | null
): Promise<{ success: boolean; profile: UserProfile }> {
  // Set storage isolation scope strictly to this user's UID
  setActiveUserScope(uid);

  if (!isFirebaseConfigured || !db || !uid) {
    const fallbackProfile: UserProfile = {
      id: uid,
      name: displayName || 'Scholar',
      email: userEmail || 'learner@kaizenflow.study',
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: '',
      activePlaylistsCount: 0,
      createdAt: new Date().toISOString(),
    };
    saveUserProfile(fallbackProfile);
    return { success: false, profile: fallbackProfile };
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const activityDocRef = doc(db, 'users', uid, 'data', 'activity');
    const coursesDocRef = doc(db, 'users', uid, 'data', 'courses');

    const [userSnap, activitySnap, coursesSnap] = await Promise.all([
      getDoc(userDocRef),
      getDoc(activityDocRef),
      getDoc(coursesDocRef),
    ]);

    if (userSnap.exists()) {
      // EXISTING USER: Load THEIR own cloud records cleanly
      const userData = userSnap.data();
      const activityData = activitySnap.exists()
        ? ((activitySnap.data().activityMap || {}) as Record<string, DailyActivity>)
        : {};
      const coursesData = coursesSnap.exists()
        ? ((coursesSnap.data().playlists || []) as Playlist[])
        : [];
      const progressData = coursesSnap.exists()
        ? ((coursesSnap.data().progressList || {}) as Record<string, VideoProgress>)
        : {};
      const certsData = Array.isArray(userData.downloadedCertificates)
        ? userData.downloadedCertificates
        : [];

      const profile: UserProfile = {
        id: uid,
        name: displayName || userData.name || 'Scholar',
        email: userEmail || userData.email || 'learner@kaizenflow.study',
        totalXP: userData.totalXP || 0,
        currentStreak: userData.currentStreak || 0,
        longestStreak: userData.longestStreak || 0,
        lastStudyDate: userData.lastStudyDate || '',
        activePlaylistsCount: coursesData.length,
        createdAt: userData.createdAt || new Date().toISOString(),
      };

      saveUserProfile(profile);
      savePlaylists(coursesData);
      saveAllVideoProgress(progressData);
      saveDailyActivityMap(activityData);
      saveDownloadedCertificateIds(certsData);

      return { success: true, profile };
    } else {
      // BRAND NEW USER: Starts 100% fresh with NO courses and 0 progress!
      const freshProfile: UserProfile = {
        id: uid,
        name: displayName || 'Scholar',
        email: userEmail || 'learner@kaizenflow.study',
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: '',
        activePlaylistsCount: 0,
        createdAt: new Date().toISOString(),
      };

      saveUserProfile(freshProfile);
      savePlaylists([]);
      saveAllVideoProgress({});
      saveDailyActivityMap({});
      saveDownloadedCertificateIds([]);

      // Create pristine cloud records for this new user in Firestore
      await syncLocalDataToCloud(uid);

      return { success: true, profile: freshProfile };
    }
  } catch (error) {
    console.error('Error loading cloud data:', error);
    const p = getInitialUserProfile();
    return { success: false, profile: p };
  }
}

/**
 * Throttled periodic heartbeat sync (max 1 write per 60s).
 */
export async function debouncedHeartbeatSync(uid: string): Promise<void> {
  const now = Date.now();
  if (now - lastHeartbeatTime < MIN_HEARTBEAT_INTERVAL_MS) {
    return;
  }
  lastHeartbeatTime = now;
  await syncLocalDataToCloud(uid);
}
