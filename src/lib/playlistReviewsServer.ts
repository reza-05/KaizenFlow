import fs from 'fs';
import path from 'path';
import { PlaylistReview, PlaylistReviewsSummary } from '@/types';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'playlist_reviews.json');

// Resilient memory cache
const memoryCache: Record<string, PlaylistReview[]> = {};

function ensureFile(): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2), 'utf-8');
    }
  } catch {
    // Read-only filesystem fallback
  }
}

export function getAllStoredReviews(): Record<string, PlaylistReview[]> {
  ensureFile();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content) as Record<string, PlaylistReview[]>;
      return { ...memoryCache, ...parsed };
    }
  } catch (err) {
    console.error('Error reading playlist reviews:', err);
  }
  return { ...memoryCache };
}

export function saveAllStoredReviews(data: Record<string, PlaylistReview[]>): void {
  Object.assign(memoryCache, data);
  ensureFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem fallback
  }
}

export function getPlaylistReviewsSummary(playlistId: string): PlaylistReviewsSummary {
  const all = getAllStoredReviews();
  const reviews = all[playlistId] || [];

  const totalReviews = reviews.length;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  reviews.forEach(r => {
    sum += r.rating;
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    distribution[star] = (distribution[star] || 0) + 1;
  });

  const averageRating = totalReviews > 0 ? parseFloat((sum / totalReviews).toFixed(1)) : 0;

  return {
    playlistId,
    reviews,
    averageRating,
    totalReviews,
    distribution,
  };
}

export function saveOrUpdatePlaylistReview(data: {
  playlistId: string;
  userId: string;
  userName: string;
  rating: number;
  feedback: string;
  completionPercentage: number;
}): PlaylistReview {
  const all = getAllStoredReviews();
  const list = all[data.playlistId] || [];

  const existingIdx = list.findIndex(r => r.userId === data.userId || (r.userName.trim().toLowerCase() === data.userName.trim().toLowerCase() && r.userId === data.userId));

  const now = new Date().toISOString();
  let savedRecord: PlaylistReview;

  if (existingIdx >= 0) {
    // Update existing review
    savedRecord = {
      ...list[existingIdx],
      userName: data.userName.trim(),
      rating: Math.min(5, Math.max(1, data.rating)),
      feedback: data.feedback.trim(),
      completionPercentage: data.completionPercentage,
      updatedAt: now,
    };
    list[existingIdx] = savedRecord;
  } else {
    // New review
    savedRecord = {
      id: `rev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      playlistId: data.playlistId,
      userId: data.userId,
      userName: data.userName.trim(),
      rating: Math.min(5, Math.max(1, data.rating)),
      feedback: data.feedback.trim(),
      completionPercentage: data.completionPercentage,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(savedRecord);
  }

  all[data.playlistId] = list;
  saveAllStoredReviews(all);

  return savedRecord;
}
