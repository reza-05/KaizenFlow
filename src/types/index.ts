export interface UserProfile {
  id: string;
  name: string;
  email: string;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string; // "YYYY-MM-DD"
  activePlaylistsCount: number; // max 10
  createdAt: string;
}

export interface VideoItem {
  id: string;
  ytVideoId: string;
  title: string;
  durationSeconds: number;
  durationFormatted: string;
  thumbnailUrl: string;
}

export interface Playlist {
  id: string;
  userId: string;
  ytPlaylistId?: string;
  customTitle: string;
  originalTitle: string;
  thumbnailUrl: string;
  totalVideos: number;
  completedVideos: number;
  videos: VideoItem[];
  sourceType: 'youtube_playlist' | 'syllabus_roadmap' | 'custom_collection';
  languagePreference?: 'bn' | 'en' | 'hi';
  lastSyncedAt: string;
  createdAt: string;
}

export interface VideoProgress {
  userId: string;
  playlistId: string;
  ytVideoId: string;
  watchedSeconds: number;
  isCompleted: boolean;
  isVerified: boolean;
  completedAt?: string;
}

export interface DailyActivity {
  date: string; // "YYYY-MM-DD"
  minutesWatched: number;
  verifiedCount: number;
  xpEarned: number;
}

export interface StudyNote {
  id: string;
  playlistId: string;
  videoId: string;
  timestampSeconds: number;
  timestampFormatted: string;
  content: string;
  createdAt: string;
}

export type StudyMode = 'lecture' | 'studio';
