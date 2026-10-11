import { Playlist, VideoItem } from '@/types';

// Helper to clean HTML entities from YouTube titles
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Helper to extract playlist ID from any YouTube URL or raw ID format
export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Raw Playlist ID: PL..., OLAK5uy_..., UU..., FL..., RD..., TL...
  if (/^(?:PL|OLAK5uy_|UU|FL|RD|TL)[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. URL parsing (handling http, https, protocol-relative, or domain-first)
  try {
    const normalized = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed.replace(/^\/\//, '')}`;
    const url = new URL(normalized);
    const listParam = url.searchParams.get('list');
    if (listParam) return listParam.trim();
  } catch {}

  // 3. Fallback regex search for list parameter anywhere in input
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) return match[1].trim();

  return null;
}

// Helper to extract single video ID from any format (standard, mobile, shorts, live, embed, youtu.be)
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Raw 11-char YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. URL parsing
  try {
    const normalized = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed.replace(/^\/\//, '')}`;
    const url = new URL(normalized);

    // youtu.be/VIDEO_ID
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.slice(1).split('/')[0].split('?')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    // ?v=VIDEO_ID
    const vParam = url.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

    // /shorts/VIDEO_ID
    if (url.pathname.includes('/shorts/')) {
      const id = url.pathname.split('/shorts/')[1].split('/')[0].split('?')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    // /live/VIDEO_ID
    if (url.pathname.includes('/live/')) {
      const id = url.pathname.split('/live/')[1].split('/')[0].split('?')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    // /embed/VIDEO_ID
    if (url.pathname.includes('/embed/')) {
      const id = url.pathname.split('/embed/')[1].split('/')[0].split('?')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
  } catch {}

  // 3. Regex fallback
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) return match[1];

  return null;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) {
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

// Curated master courses ready out-of-the-box
export const CURATED_STARTER_COURSES: Playlist[] = [
  {
    id: 'starter-dsa-striver',
    userId: 'guest',
    ytPlaylistId: 'PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_st8',
    customTitle: 'Data Structures & Algorithms (SDE Sheet)',
    originalTitle: 'Take U Forward - Striver A2Z DSA Course',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    totalVideos: 6,
    completedVideos: 0,
    sourceType: 'youtube_playlist',
    languagePreference: 'en',
    lastSyncedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    videos: [
      {
        id: 'dsa-1',
        ytVideoId: 'EAR7De6Goz4',
        title: 'Introduction to Asymptotic Complexity & Big-O Notation',
        durationSeconds: 1240,
        durationFormatted: '20:40',
        thumbnailUrl: 'https://img.youtube.com/vi/EAR7De6Goz4/hqdefault.jpg',
      },
      {
        id: 'dsa-2',
        ytVideoId: 'V9wG42I5x4M',
        title: 'Arrays & Dynamic Vectors: Memory Architecture Explained',
        durationSeconds: 1820,
        durationFormatted: '30:20',
        thumbnailUrl: 'https://img.youtube.com/vi/V9wG42I5x4M/hqdefault.jpg',
      },
      {
        id: 'dsa-3',
        ytVideoId: 'crgE_oH9q-w',
        title: 'Singly Linked List Implementation & Pointer Traversal',
        durationSeconds: 2100,
        durationFormatted: '35:00',
        thumbnailUrl: 'https://img.youtube.com/vi/crgE_oH9q-w/hqdefault.jpg',
      },
      {
        id: 'dsa-4',
        ytVideoId: '7mUKGifs8S4',
        title: 'Stack & Queue: LIFO vs FIFO Real-World Engineering Patterns',
        durationSeconds: 1560,
        durationFormatted: '26:00',
        thumbnailUrl: 'https://img.youtube.com/vi/7mUKGifs8S4/hqdefault.jpg',
      },
      {
        id: 'dsa-5',
        ytVideoId: 'g_SaxX48mTU',
        title: 'Recursion Trees & Backtracking: Fundamentals to Mastery',
        durationSeconds: 2450,
        durationFormatted: '40:50',
        thumbnailUrl: 'https://img.youtube.com/vi/g_SaxX48mTU/hqdefault.jpg',
      },
      {
        id: 'dsa-6',
        ytVideoId: '8hly31xKli0',
        title: 'Binary Search Algorithm: Optimal Divide and Conquer Strategy',
        durationSeconds: 1980,
        durationFormatted: '33:00',
        thumbnailUrl: 'https://img.youtube.com/vi/8hly31xKli0/hqdefault.jpg',
      },
    ],
  },
  {
    id: 'starter-bangla-python',
    userId: 'guest',
    ytPlaylistId: 'PLgH5QX0i9K3q0ZKeXhLvdffpBC6k_6aPk',
    customTitle: 'Python Programming Masterclass (বাংলা)',
    originalTitle: 'Python Complete Roadmap for University & Careers (Bangla)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    totalVideos: 5,
    completedVideos: 0,
    sourceType: 'youtube_playlist',
    languagePreference: 'bn',
    lastSyncedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    videos: [
      {
        id: 'py-1',
        ytVideoId: 'kqtD5dpn9C8',
        title: 'Python Introduction & Environment Setup (Mac, Windows, Linux)',
        durationSeconds: 1420,
        durationFormatted: '23:40',
        thumbnailUrl: 'https://img.youtube.com/vi/kqtD5dpn9C8/hqdefault.jpg',
      },
      {
        id: 'py-2',
        ytVideoId: 'rfscVS0vtbw',
        title: 'Variables, Memory Allocation & Data Types in Depth',
        durationSeconds: 1890,
        durationFormatted: '31:30',
        thumbnailUrl: 'https://img.youtube.com/vi/rfscVS0vtbw/hqdefault.jpg',
      },
      {
        id: 'py-3',
        ytVideoId: '6iF8Xb7Z3wQ',
        title: 'Conditional Statements, Loops & Logical Execution Control',
        durationSeconds: 1650,
        durationFormatted: '27:30',
        thumbnailUrl: 'https://img.youtube.com/vi/6iF8Xb7Z3wQ/hqdefault.jpg',
      },
      {
        id: 'py-4',
        ytVideoId: '8ext9G7xspg',
        title: 'Functions, Scope, Closures & Arguments Parsing',
        durationSeconds: 2210,
        durationFormatted: '36:50',
        thumbnailUrl: 'https://img.youtube.com/vi/8ext9G7xspg/hqdefault.jpg',
      },
      {
        id: 'py-5',
        ytVideoId: 'HGOBQPFzWKo',
        title: 'Object-Oriented Programming (OOP): Classes, Objects & Inheritance',
        durationSeconds: 2780,
        durationFormatted: '46:20',
        thumbnailUrl: 'https://img.youtube.com/vi/HGOBQPFzWKo/hqdefault.jpg',
      },
    ],
  },
];

// Parser that generates a structured KaizenFlow course from any YouTube playlist or video URL
export async function parseYouTubePlaylist(urlOrId: string, customName?: string): Promise<Playlist> {
  const trimmed = urlOrId.trim();

  // 1. Fetch real playlist or video metadata via our server-side API route
  try {
    const res = await fetch('/api/youtube', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmed, customName }),
    });

    if (res.ok) {
      const course: Playlist = await res.json();
      return course;
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        throw new Error(errData.error);
      }
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
    console.error('API route failed:', err);
  }

  // 2. Curated starter course match as local fallback
  const playlistId = extractPlaylistId(trimmed);
  if (playlistId) {
    const matched = CURATED_STARTER_COURSES.find(c => c.ytPlaylistId === playlistId);
    if (matched) {
      return {
        ...matched,
        id: 'pl_' + Date.now().toString(36),
        customTitle: customName?.trim() || matched.customTitle,
        createdAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
      };
    }
  }

  // 3. Client-side oEmbed fallback for single videos if server route was unavailable
  const singleVidId = extractVideoId(trimmed);
  if (singleVidId) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${singleVidId}&format=json`);
      let title = customName?.trim() || `Lecture: ${singleVidId}`;
      let author = 'YouTube Instructor';
      let thumb = `https://img.youtube.com/vi/${singleVidId}/hqdefault.jpg`;

      if (oembedRes.ok) {
        const odata = await oembedRes.json();
        if (odata.title) title = customName?.trim() || decodeHtmlEntities(odata.title);
        if (odata.author_name) author = decodeHtmlEntities(odata.author_name);
        if (odata.thumbnail_url) thumb = odata.thumbnail_url;
      }

      return {
        id: 'pl_' + Date.now().toString(36),
        userId: 'user_active',
        ytPlaylistId: `pl_${singleVidId}`,
        customTitle: title,
        originalTitle: `${title} (${author})`,
        thumbnailUrl: thumb,
        totalVideos: 1,
        completedVideos: 0,
        videos: [
          {
            id: `vid_${singleVidId}`,
            ytVideoId: singleVidId,
            title,
            durationSeconds: 1800,
            durationFormatted: 'Dynamic',
            thumbnailUrl: thumb,
          },
        ],
        sourceType: 'youtube_playlist',
        lastSyncedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    } catch {}
  }

  throw new Error('Could not find videos in this YouTube link or query. Please verify the URL is public or unlisted.');
}
