'use client';

import { Playlist, UserProfile, VideoProgress, DailyActivity, StudyNote } from '@/types';
import { CURATED_STARTER_COURSES } from './youtube';

const STORAGE_KEYS = {
  USER: 'user_profile',
  PLAYLISTS: 'playlists',
  PROGRESS: 'video_progress',
  ACTIVITY: 'daily_activity',
  NOTES: 'study_notes',
  THEME: 'theme_mode',
  CERTIFICATES: 'downloaded_certificates',
};

const LEGACY_STORAGE_KEYS = {
  USER: 'kizen_user_profile',
  PLAYLISTS: 'kizen_playlists',
  PROGRESS: 'kizen_video_progress',
  ACTIVITY: 'kizen_daily_activity',
  NOTES: 'kizen_study_notes',
  THEME: 'kizen_theme_mode',
  CERTIFICATES: 'kaizenflow_downloaded_certificates',
};

let inMemoryActiveScope: string | null = null;

export function setActiveUserScope(uid: string | null): void {
  inMemoryActiveScope = uid || null;
  if (typeof window !== 'undefined') {
    if (uid) {
      localStorage.setItem('kaizenflow_active_uid', uid);
    } else {
      localStorage.removeItem('kaizenflow_active_uid');
    }
  }
}

export function getActiveUserScope(): string | null {
  if (inMemoryActiveScope) return inMemoryActiveScope;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('kaizenflow_active_uid') || null;
  }
  return null;
}

function resolveStorageKey(key: keyof typeof STORAGE_KEYS, suffix: string = ''): string {
  const scope = getActiveUserScope();
  if (scope) {
    const base = `kaizenflow_u_${scope}_${STORAGE_KEYS[key]}`;
    return suffix ? `${base}_${suffix}` : base;
  }
  const base = `kaizenflow_${STORAGE_KEYS[key]}`;
  return suffix ? `${base}_${suffix}` : base;
}

export function getStoredValue(key: keyof typeof STORAGE_KEYS, suffix: string = ''): string | null {
  if (typeof window === 'undefined') return null;
  const primaryKey = resolveStorageKey(key, suffix);
  const val = localStorage.getItem(primaryKey);
  if (val) return val;

  // Only check legacy / un-scoped guest fallback if NO authenticated user scope is active
  if (!getActiveUserScope()) {
    const legacyKey = suffix ? `${LEGACY_STORAGE_KEYS[key]}_${suffix}` : LEGACY_STORAGE_KEYS[key];
    const unPrefixed = suffix ? `kaizenflow_${STORAGE_KEYS[key]}_${suffix}` : `kaizenflow_${STORAGE_KEYS[key]}`;
    return localStorage.getItem(unPrefixed) || localStorage.getItem(legacyKey);
  }
  return null;
}

export function setStoredValue(key: keyof typeof STORAGE_KEYS, value: string, suffix: string = ''): void {
  if (typeof window === 'undefined') return;
  const primaryKey = resolveStorageKey(key, suffix);
  localStorage.setItem(primaryKey, value);
}

// Clear all local data associated with a specific user
export function clearActiveUserStorage(targetUid?: string): void {
  if (typeof window === 'undefined') return;
  const uid = targetUid || getActiveUserScope();
  if (!uid) return;

  const prefix = `kaizenflow_u_${uid}_`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
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
  const scope = getActiveUserScope();
  const defaultProfile: UserProfile = {
    id: scope || 'usr_guest',
    name: scope ? 'Scholar' : 'Guest Scholar',
    email: scope ? 'scholar@kaizenflow.study' : 'guest@kaizenflow.study',
    totalXP: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: '',
    activePlaylistsCount: 0,
    createdAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return defaultProfile;

  const stored = getStoredValue('USER');
  const activityMap = getDailyActivityMap();
  const streaks = calculateStreaksFromActivity(activityMap);
  const genuineProgress = Object.values(getVideoProgressList()).filter(p => p.isVerified);
  const genuineXP = genuineProgress.length * 50;

  if (stored) {
    try {
      const parsed: UserProfile = JSON.parse(stored);
      parsed.totalXP = Math.max(parsed.totalXP || 0, genuineXP);
      parsed.currentStreak = streaks.currentStreak;
      parsed.longestStreak = Math.max(streaks.longestStreak, streaks.currentStreak);
      parsed.lastStudyDate = streaks.currentStreak > 0 ? (parsed.lastStudyDate || new Date().toISOString().split('T')[0]) : '';
      setStoredValue('USER', JSON.stringify(parsed));
      return parsed;
    } catch {
      // fallback
    }
  }

  const profile: UserProfile = {
    id: scope || 'usr_guest',
    name: scope ? 'Scholar' : 'Guest Scholar',
    email: scope ? 'scholar@kaizenflow.study' : 'guest@kaizenflow.study',
    totalXP: genuineXP,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    lastStudyDate: streaks.currentStreak > 0 ? new Date().toISOString().split('T')[0] : '',
    activePlaylistsCount: scope ? 0 : CURATED_STARTER_COURSES.length,
    createdAt: new Date().toISOString(),
  };
  setStoredValue('USER', JSON.stringify(profile));
  return profile;
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  setStoredValue('USER', JSON.stringify(profile));
}

export const DAILY_FREE_AI_NOTES_LIMIT = 3;

export interface AiNotesQuotaStatus {
  used: number;
  max: number;
  remaining: number;
  isPro: boolean;
  canGenerate: boolean;
}

export function getAiNotesQuotaStatus(): AiNotesQuotaStatus {
  const profile = getInitialUserProfile();
  const isPro = profile.subscriptionTier === 'pro';
  if (isPro) {
    return { used: 0, max: Infinity, remaining: Infinity, isPro: true, canGenerate: true };
  }

  const today = new Date().toISOString().split('T')[0];
  let used = profile.dailyAiNotesUsed || 0;
  if (profile.dailyAiNotesDate !== today) {
    used = 0;
    profile.dailyAiNotesDate = today;
    profile.dailyAiNotesUsed = 0;
    saveUserProfile(profile);
  }

  const remaining = Math.max(0, DAILY_FREE_AI_NOTES_LIMIT - used);
  return {
    used,
    max: DAILY_FREE_AI_NOTES_LIMIT,
    remaining,
    isPro: false,
    canGenerate: remaining > 0,
  };
}

export function consumeAiNotesQuota(): boolean {
  const status = getAiNotesQuotaStatus();
  if (status.isPro) return true;
  if (!status.canGenerate) return false;

  const profile = getInitialUserProfile();
  const today = new Date().toISOString().split('T')[0];
  profile.dailyAiNotesDate = today;
  profile.dailyAiNotesUsed = (profile.dailyAiNotesUsed || 0) + 1;
  saveUserProfile(profile);
  return true;
}

export function setSubscriptionTier(tier: 'free' | 'pro'): UserProfile {
  const profile = getInitialUserProfile();
  profile.subscriptionTier = tier;
  saveUserProfile(profile);
  return profile;
}

// Playlists retrieval:
// For logged-in users, defaults to [] (completely empty, 0 starter courses)
// For unauthenticated guests, provides starter courses to preview
export function getPlaylists(): Playlist[] {
  const scope = getActiveUserScope();
  if (typeof window === 'undefined') return scope ? [] : CURATED_STARTER_COURSES;

  const stored = getStoredValue('PLAYLISTS');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  // Authenticated user starts completely empty!
  if (scope) {
    return [];
  }

  // Guest preview mode
  setStoredValue('PLAYLISTS', JSON.stringify(CURATED_STARTER_COURSES));
  return CURATED_STARTER_COURSES;
}

export function savePlaylists(playlists: Playlist[]): void {
  if (typeof window === 'undefined') return;
  setStoredValue('PLAYLISTS', JSON.stringify(playlists));
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
    userId: getActiveUserScope() || 'usr_local',
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

  setStoredValue('PROGRESS', JSON.stringify(allProgress));
}

export function saveAllVideoProgress(allProgress: Record<string, VideoProgress>): void {
  if (typeof window === 'undefined') return;
  setStoredValue('PROGRESS', JSON.stringify(allProgress));
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
    userId: getActiveUserScope() || 'usr_local',
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

  setStoredValue('PROGRESS', JSON.stringify(allProgress));

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
        profile.currentStreak = 1;
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

// 365-Day Activity Log for Heatmap (strictly genuine verified lessons)
export function getDailyActivityMap(): Record<string, DailyActivity> {
  if (typeof window === 'undefined') return {};
  const stored = getStoredValue('ACTIVITY');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return {};
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

  setStoredValue('ACTIVITY', JSON.stringify(current));
}

export function saveDailyActivityMap(map: Record<string, DailyActivity>): void {
  if (typeof window === 'undefined') return;
  setStoredValue('ACTIVITY', JSON.stringify(map));
}

export function getNotes(videoId: string): StudyNote[] {
  if (typeof window === 'undefined') return [];
  const stored = getStoredValue('NOTES', videoId);
  if (stored) {
    try {
      const parsed: StudyNote[] = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const seen = new Set<string>();
        let modified = false;
        const sanitized = parsed.map((n, idx) => {
          if (!n.id || seen.has(n.id)) {
            modified = true;
            return {
              ...n,
              id: `note_${Date.now().toString(36)}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
            };
          }
          seen.add(n.id);
          return n;
        });
        if (modified) {
          setStoredValue('NOTES', JSON.stringify(sanitized), videoId);
        }
        return sanitized;
      }
    } catch {}
  }
  return [];
}

export function addNote(note: StudyNote): StudyNote[] {
  const current = getNotes(note.videoId);
  const updated = [note, ...current];
  setStoredValue('NOTES', JSON.stringify(updated), note.videoId);
  return updated;
}

export function addNotes(notesToAdd: StudyNote[]): StudyNote[] {
  if (notesToAdd.length === 0) return [];
  const videoId = notesToAdd[0].videoId;
  const current = getNotes(videoId);
  const updated = [...notesToAdd, ...current];
  setStoredValue('NOTES', JSON.stringify(updated), videoId);
  return updated;
}

export function deleteNote(videoId: string, noteId: string): StudyNote[] {
  const current = getNotes(videoId);
  const updated = current.filter(n => n.id !== noteId);
  setStoredValue('NOTES', JSON.stringify(updated), videoId);
  return updated;
}

// 1-Time Certificate Download Registry (Isolated by user)
export function getDownloadedCertificateIds(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = getStoredValue('CERTIFICATES');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return [];
}

export function saveDownloadedCertificateIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  setStoredValue('CERTIFICATES', JSON.stringify(ids));
}

export function recordCertificateDownload(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const list = getDownloadedCertificateIds();
    if (!list.includes(id)) {
      list.push(id);
      saveDownloadedCertificateIds(list);
    }
  } catch {}
}

export function isCertificateDownloaded(id: string): boolean {
  if (typeof window === 'undefined' || !id) return false;
  return getDownloadedCertificateIds().includes(id);
}
