import { Playlist, VideoProgress } from '@/types';

export interface PlaylistCompletionStatus {
  totalVideos: number;
  completedCount: number;
  completionPercentage: number;
  canReview: boolean;
  requiredCount: number;
  remainingCount: number;
}

/**
 * Calculates whether a playlist is eligible for a student review.
 * Rule: At least 60% of playlist videos must be completed.
 * A video is eligible only if:
 * 1. It is marked completed / verified (Checkmark)
 * 2. The student watched at least 50% of the video's total duration.
 */
export function calculatePlaylistCompletion(
  playlist: Playlist | null | undefined,
  progressMap: Record<string, VideoProgress>
): PlaylistCompletionStatus {
  if (!playlist || !playlist.videos || playlist.videos.length === 0) {
    return {
      totalVideos: 0,
      completedCount: 0,
      completionPercentage: 0,
      canReview: false,
      requiredCount: 0,
      remainingCount: 0,
    };
  }

  const totalVideos = playlist.videos.length;
  const requiredCount = Math.ceil(totalVideos * 0.6);

  let completedCount = 0;

  for (const video of playlist.videos) {
    const key = `${playlist.id}_${video.ytVideoId}`;
    const progress = progressMap[key];

    // Condition 1: Checkmark verified or marked completed
    const isChecked = Boolean(progress?.isCompleted || progress?.isVerified);

    // Condition 2: Watched at least 50% of duration (if duration is known)
    const duration = video.durationSeconds || 0;
    const maxWatched = progress?.maxWatchedSeconds || progress?.watchedSeconds || 0;
    const hasWatchedHalf = duration > 0 ? maxWatched >= duration * 0.5 : isChecked;

    if (isChecked && hasWatchedHalf) {
      completedCount++;
    }
  }

  const completionPercentage = Math.round((completedCount / totalVideos) * 100);
  const canReview = completionPercentage >= 60;
  const remainingCount = Math.max(0, requiredCount - completedCount);

  return {
    totalVideos,
    completedCount,
    completionPercentage,
    canReview,
    requiredCount,
    remainingCount,
  };
}
