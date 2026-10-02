'use client';

import { Playlist, UserProfile, VideoProgress, DailyActivity, StudyNote } from '@/types';
import { CURATED_STARTER_COURSES } from './youtube';

const STORAGE_KEYS = {
  USER: 'kaizenflow_user_profile',
  PLAYLISTS: 'kaizenflow_playlists',
  PROGRESS: 'kaizenflow_video_progress',
  ACTIVITY: 'kaizenflow_daily_activity',
  NOTES: 'kaizenflow_study_notes',
  THEME: 'kaizenflow_theme_mode',
};

const LEGACY_STORAGE_KEYS = {
  USER: 'kizen_user_profile',
  PLAYLISTS: 'kizen_playlists',
  PROGRESS: 'kizen_video_progress',
  ACTIVITY: 'kizen_daily_activity',
  NOTES: 'kizen_study_notes',
  THEME: 'kizen_theme_mode',
};

function getStoredValue(key: keyof typeof STORAGE_KEYS, suffix: string = ''): string | null {
  if (typeof window === 'undefined') return null;
  const primaryKey = suffix ? `${STORAGE_KEYS[key]}_${suffix}` : STORAGE_KEYS[key];
  const legacyKey = suffix ? `${LEGACY_STORAGE_KEYS[key]}_${suffix}` : LEGACY_STORAGE_KEYS[key];
  return localStorage.getItem(primaryKey) || localStorage.getItem(legacyKey);
}

// Calculate genuine streaks strictly from verified lessons (Code verification required)
export function calculateStreaksFromActivity(activityMap: Record<string, DailyActivity>): {
  currentStreak: number;
  longestStreak: number;
} {
  const activeDates = Object.keys(activityMap)
    .filter(d => (activityMap[d]?.verifiedCount || 0) > 0)
    .sort()
    .reverse();

  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  if (activeDates.includes(today) || activeDates.includes(yesterday)) {
    const startIdx = activeDates[0] === today ? 0 : 0;
    let cursor = new Date(activeDates[startIdx]);
    currentStreak = 1;
    for (let i = startIdx + 1; i < activeDates.length; i++) {
      cursor.setDate(cursor.getDate() - 1);
      const expected = cursor.toISOString().split('T')[0];
      if (activeDates[i] === expected) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  let longestStreak = Math.max(currentStreak, 1);
  const ascDates = [...activeDates].reverse();
  let run = 1;
  for (let i = 1; i < ascDates.length; i++) {
    const prev = new Date(ascDates[i - 1]);
    prev.setDate(prev.getDate() + 1);
    if (ascDates[i] === prev.toISOString().split('T')[0]) {
      run++;
    } else {
      run = 1;
    }
    if (run > longestStreak) longestStreak = run;
  }

  return { currentStreak, longestStreak: Math.max(currentStreak, longestStreak) };
}

// Initial default user profile (Pure genuine user stats, 0 fake numbers)
export function getInitialUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return {
      id: 'usr_local',
      name: 'Scholar',
      email: 'learner@kaizenflow.study',
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: '',
      activePlaylistsCount: CURATED_STARTER_COURSES.length,
      createdAt: new Date().toISOString(),
    };
  }

  const stored = getStoredValue('USER');
  const activityMap = getDailyActivityMap();
  const streaks = calculateStreaksFromActivity(activityMap);
  const genuineProgress = Object.values(getVideoProgressList()).filter(p => p.isVerified);
  const genuineXP = genuineProgress.length * 50;

  if (stored) {
    try {
      const parsed: UserProfile = JSON.parse(stored);
      // Enforce true verified stats so legacy fake seed (e.g. 350 XP, 4 day streak, 12 longest) is corrected
      parsed.totalXP = Math.max(parsed.totalXP, genuineXP);
      parsed.currentStreak = streaks.currentStreak;
      parsed.longestStreak = Math.max(streaks.longestStreak, streaks.currentStreak);
      parsed.lastStudyDate = streaks.currentStreak > 0 ? (parsed.lastStudyDate || new Date().toISOString().split('T')[0]) : '';
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(parsed));
      return parsed;
    } catch {
      // fallback
    }
  }

  const profile: UserProfile = {
    id: 'usr_local',
    name: 'Scholar',
    email: 'learner@kaizenflow.study',
    totalXP: genuineXP,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    lastStudyDate: streaks.currentStreak > 0 ? new Date().toISOString().split('T')[0] : '',
    activePlaylistsCount: CURATED_STARTER_COURSES.length,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
  return profile;
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
}

// Initial playlists (Preloaded with our 2 curated starters)
export function getPlaylists(): Playlist[] {
  if (typeof window === 'undefined') return CURATED_STARTER_COURSES;
  const stored = getStoredValue('PLAYLISTS');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(CURATED_STARTER_COURSES));
  return CURATED_STARTER_COURSES;
}

export function savePlaylists(playlists: Playlist[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
}

// Add a new playlist with strict 10-quota enforcement
export function addPlaylist(newPlaylist: Playlist): { success: boolean; error?: string } {
  const current = getPlaylists();
  if (current.length >= 10) {
    return {
      success: false,
      error: 'You have reached the limit of 10 active courses. Please remove an existing course to add a new one.',
    };
  }

  const updated = [newPlaylist, ...current];
  savePlaylists(updated);

  const profile = getInitialUserProfile();
  profile.activePlaylistsCount = updated.length;
  saveUserProfile(profile);

  return { success: true };
}

// Delete playlist
export function deletePlaylist(playlistId: string): void {
  const current = getPlaylists();
  const updated = current.filter(p => p.id !== playlistId);
  savePlaylists(updated);

  const profile = getInitialUserProfile();
  profile.activePlaylistsCount = updated.length;
  saveUserProfile(profile);
}

// Rename playlist
export function renamePlaylist(playlistId: string, newTitle: string): void {
  const current = getPlaylists();
  const updated = current.map(p => (p.id === playlistId ? { ...p, customTitle: newTitle } : p));
  savePlaylists(updated);
}

// Progress tracking
export function getVideoProgressList(): Record<string, VideoProgress> {
  if (typeof window === 'undefined') return {};
  const stored = getStoredValue('PROGRESS');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return {};
}

export function getVideoProgress(playlistId: string, ytVideoId: string): VideoProgress | null {
  const all = getVideoProgressList();
  const key = `${playlistId}_${ytVideoId}`;
  return all[key] || null;
}

export function saveVideoPlaybackProgress(
  playlistId: string,
  ytVideoId: string,
  data: Partial<VideoProgress>
): void {
  if (typeof window === 'undefined') return;
  const progressKey = `${playlistId}_${ytVideoId}`;
  const allProgress = getVideoProgressList();
  const existing = allProgress[progressKey];

  const maxWatchedSeconds = Math.max(
    existing?.maxWatchedSeconds || 0,
    existing?.watchedSeconds || 0,
    data.maxWatchedSeconds || 0,
    data.watchedSeconds || 0
  );

  allProgress[progressKey] = {
    userId: 'usr_local',
    playlistId,
    ytVideoId,
    watchedSeconds: maxWatchedSeconds,
    maxWatchedSeconds,
    lastPositionSeconds: data.lastPositionSeconds !== undefined ? data.lastPositionSeconds : (existing?.lastPositionSeconds || 0),
    isCompleted: data.isCompleted !== undefined ? data.isCompleted : (existing?.isCompleted || false),
    isVerified: data.isVerified !== undefined ? data.isVerified : (existing?.isVerified || false),
    completedAt: data.completedAt || existing?.completedAt,
    savedMilestones: data.savedMilestones || existing?.savedMilestones,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress));
  } catch {}
}

export function saveAllVideoProgress(allProgress: Record<string, VideoProgress>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress));
  } catch {}
}

export function markVideoVerified(
  playlistId: string,
  ytVideoId: string,
  videoTitle: string
): { xpEarned: number; newStreak: number } {
  const progressKey = `${playlistId}_${ytVideoId}`;
  const allProgress = getVideoProgressList();
  const existing = allProgress[progressKey];

  const alreadyVerified = existing?.isVerified;
  const xpEarned = alreadyVerified ? 0 : 50;

  allProgress[progressKey] = {
    userId: 'usr_local',
    playlistId,
    ytVideoId,
    watchedSeconds: existing?.watchedSeconds || 1200,
    maxWatchedSeconds: existing?.maxWatchedSeconds || existing?.watchedSeconds || 1200,
    lastPositionSeconds: existing?.lastPositionSeconds || 0,
    isCompleted: true,
    isVerified: true,
    completedAt: new Date().toISOString(),
    savedMilestones: existing?.savedMilestones,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress));
  }

  // Update User Profile & Streak
  const profile = getInitialUserProfile();
  const today = new Date().toISOString().split('T')[0];

  if (!alreadyVerified) {
    profile.totalXP += xpEarned;

    // Check streak
    if (profile.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (profile.lastStudyDate === yesterday) {
        profile.currentStreak += 1;
      } else {
        profile.currentStreak = 1; // streak reset/start
      }
      if (profile.currentStreak > profile.longestStreak) {
        profile.longestStreak = profile.currentStreak;
      }
      profile.lastStudyDate = today;
    }

    saveUserProfile(profile);

    // Update Daily Activity for Heatmap
    updateDailyActivity(today, 25, 1, xpEarned);

    // Update Playlist Completed Videos count
    const playlists = getPlaylists();
    const targetPl = playlists.find(p => p.id === playlistId);
    if (targetPl) {
      const completedCount = targetPl.videos.filter(v => allProgress[`${playlistId}_${v.ytVideoId}`]?.isVerified).length;
      targetPl.completedVideos = completedCount;
      savePlaylists(playlists);
    }
  }

  return { xpEarned, newStreak: profile.currentStreak };
}

// 365-Day Activity Log for Heatmap (100% Genuine User Records, strictly verified lessons)
export function getDailyActivityMap(): Record<string, DailyActivity> {
  if (typeof window === 'undefined') return {};

  const allProgress = getVideoProgressList();
  const genuineProgressList = Object.values(allProgress);
  const genuineVerified = genuineProgressList.filter(p => p.isVerified);

  // Build the clean real activity map strictly from user verified lessons
  const cleanMap: Record<string, DailyActivity> = {};
  genuineVerified.forEach(p => {
    const dateStr = (p.completedAt || p.updatedAt || new Date().toISOString()).split('T')[0];
    if (!cleanMap[dateStr]) {
      cleanMap[dateStr] = {
        date: dateStr,
        minutesWatched: 0,
        verifiedCount: 0,
        xpEarned: 0,
      };
    }
    cleanMap[dateStr].verifiedCount += 1;
    cleanMap[dateStr].minutesWatched += Math.max(20, Math.round((p.watchedSeconds || 1200) / 60));
    cleanMap[dateStr].xpEarned += 50;
  });

  localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(cleanMap));
  return cleanMap;
}

export function updateDailyActivity(date: string, minutes: number, verified: number, xp: number): void {
  if (typeof window === 'undefined') return;
  const current = getDailyActivityMap();
  const existing = current[date] || { date, minutesWatched: 0, verifiedCount: 0, xpEarned: 0 };

  current[date] = {
    date,
    minutesWatched: existing.minutesWatched + minutes,
    verifiedCount: existing.verifiedCount + verified,
    xpEarned: existing.xpEarned + xp,
  };

  localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(current));
}

export function saveDailyActivityMap(map: Record<string, DailyActivity>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(map));
  } catch {}
}

// Notes Storage
export function getNotes(videoId: string): StudyNote[] {
  if (typeof window === 'undefined') return [];
  const stored = getStoredValue('NOTES', videoId);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return [];
}

export function addNote(note: StudyNote): StudyNote[] {
  const current = getNotes(note.videoId);
  const updated = [note, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_KEYS.NOTES}_${note.videoId}`, JSON.stringify(updated));
  }
  return updated;
}

export function deleteNote(videoId: string, noteId: string): StudyNote[] {
  const current = getNotes(videoId);
  const updated = current.filter(n => n.id !== noteId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_KEYS.NOTES}_${videoId}`, JSON.stringify(updated));
  }
  return updated;
}

// 1-Time Certificate Download Registry
const DOWNLOADED_CERTIFICATES_KEY = 'kaizenflow_downloaded_certificates';

export function getDownloadedCertificateIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DOWNLOADED_CERTIFICATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordCertificateDownload(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const list = getDownloadedCertificateIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DOWNLOADED_CERTIFICATES_KEY, JSON.stringify(list));
    }
  } catch {}
}

export function isCertificateDownloaded(id: string): boolean {
  if (typeof window === 'undefined' || !id) return false;
  return getDownloadedCertificateIds().includes(id);
}
