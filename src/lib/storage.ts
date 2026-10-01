'use client';

import { Playlist, UserProfile, VideoProgress, DailyActivity, StudyNote } from '@/types';
import { CURATED_STARTER_COURSES } from './youtube';

const STORAGE_KEYS = {
  USER: 'kizen_user_profile',
  PLAYLISTS: 'kizen_playlists',
  PROGRESS: 'kizen_video_progress',
  ACTIVITY: 'kizen_daily_activity',
  NOTES: 'kizen_study_notes',
  THEME: 'kizen_theme_mode',
};

// Initial default user profile
export function getInitialUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return {
      id: 'usr_local',
      name: 'Scholar',
      email: 'learner@kizen.study',
      totalXP: 350,
      currentStreak: 4,
      longestStreak: 12,
      lastStudyDate: new Date().toISOString().split('T')[0],
      activePlaylistsCount: 2,
      createdAt: new Date().toISOString(),
    };
  }

  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  const profile: UserProfile = {
    id: 'usr_local',
    name: 'Scholar',
    email: 'learner@kizen.study',
    totalXP: 350,
    currentStreak: 4,
    longestStreak: 12,
    lastStudyDate: new Date().toISOString().split('T')[0],
    activePlaylistsCount: 2,
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
  const stored = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
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
  const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
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

// 365-Day Activity Log for Heatmap
export function getDailyActivityMap(): Record<string, DailyActivity> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }

  // Seed sample past activity for a realistic heatmap out-of-the-box
  const sampleMap: Record<string, DailyActivity> = {};
  const today = new Date();
  for (let i = 0; i < 45; i++) {
    if (i % 3 === 0 || i % 5 === 0) {
      const d = new Date(today.getTime() - i * 86400000).toISOString().split('T')[0];
      sampleMap[d] = {
        date: d,
        minutesWatched: 35 + (i % 4) * 20,
        verifiedCount: 1 + (i % 2),
        xpEarned: 50 + (i % 3) * 50,
      };
    }
  }
  return sampleMap;
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

// Notes Storage
export function getNotes(videoId: string): StudyNote[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(`${STORAGE_KEYS.NOTES}_${videoId}`);
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
