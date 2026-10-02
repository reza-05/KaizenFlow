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

export interface VideoMilestone {
  index: number;
  digit: string;
  triggerSecond: number;
  revealed: boolean;
}

export interface VideoProgress {
  userId: string;
  playlistId: string;
  ytVideoId: string;
  watchedSeconds: number;
  maxWatchedSeconds?: number;
  lastPositionSeconds?: number;
  isCompleted: boolean;
  isVerified: boolean;
  completedAt?: string;
  savedMilestones?: VideoMilestone[];
  updatedAt?: string;
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

export type BadgeCategory = 'watchtime' | 'streak' | 'course' | 'discipline' | 'scholarship';

export interface BadgeDefinition {
  id: string;
  category: BadgeCategory;
  tier: number;
  title: string;
  description: string;
  targetValue: number;
  unit: string;
  iconName: string;
  colorScheme: 'bronze' | 'silver' | 'gold' | 'platinum' | 'obsidian' | 'emerald';
}

export interface EvaluatedBadge extends BadgeDefinition {
  isUnlocked: boolean;
  currentValue: number;
  progressPercent: number;
  unlockedAt?: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  currentXP: number;
  minXP: number;
  nextLevelXP: number;
  progressPercent: number;
  statusBadge: string;
}
