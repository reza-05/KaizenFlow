import fs from 'fs';
import path from 'path';
import { AILectureNotes } from '@/types';

export interface SharedNoteRecord {
  id: string; // e.g. "note_ytVideoId" or short id
  videoId: string;
  videoTitle: string;
  courseTitle?: string;
  language: string;
  notes: AILectureNotes;
  createdAt: string;
  viewsCount: number;
}

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'shared_notes.json');

const memoryCache: Record<string, SharedNoteRecord> = {};

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

export function getAllSharedNotes(): Record<string, SharedNoteRecord> {
  ensureFile();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content) as Record<string, SharedNoteRecord>;
      return { ...memoryCache, ...parsed };
    }
  } catch (err) {
    console.error('Error reading shared notes:', err);
  }
  return { ...memoryCache };
}

export function saveSharedNotes(data: Record<string, SharedNoteRecord>): void {
  Object.assign(memoryCache, data);
  ensureFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem fallback
  }
}

export function getSharedNote(id: string): SharedNoteRecord | null {
  const all = getAllSharedNotes();
  const note = all[id];
  if (note) {
    // Increment view count
    note.viewsCount = (note.viewsCount || 0) + 1;
    saveSharedNotes(all);
    return note;
  }
  return null;
}

export function createOrUpdateSharedNote(data: {
  videoId: string;
  videoTitle: string;
  courseTitle?: string;
  language: string;
  notes: AILectureNotes;
}): SharedNoteRecord {
  const all = getAllSharedNotes();
  // Use videoId as canonical share key or custom id
  const shareId = data.videoId;

  const record: SharedNoteRecord = {
    id: shareId,
    videoId: data.videoId,
    videoTitle: data.videoTitle,
    courseTitle: data.courseTitle,
    language: data.language,
    notes: data.notes,
    createdAt: all[shareId]?.createdAt || new Date().toISOString(),
    viewsCount: all[shareId]?.viewsCount || 0,
  };

  all[shareId] = record;
  saveSharedNotes(all);
  return record;
}
