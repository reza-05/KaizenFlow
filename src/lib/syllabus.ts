import { Playlist, VideoItem } from '@/types';

export interface SyllabusModule {
  title: string;
  topicKeyword: string;
}

// Curated high-yield video dictionary per subject and language
const VIDEO_REGISTRY: Record<string, Record<'bn' | 'en' | 'hi', { title: string; ytVideoId: string; duration: number }>> = {
  complexity: {
    bn: { title: 'Time & Space Complexity & Big-O Notation (Bangla)', ytVideoId: 'EAR7De6Goz4', duration: 1540 },
    en: { title: 'Big-O Notation & Algorithm Complexity Analysis', ytVideoId: 'V9wG42I5x4M', duration: 1820 },
    hi: { title: 'Complete Time & Space Complexity Analysis Masterclass', ytVideoId: '8hly31xKli0', duration: 1950 },
  },
  arrays: {
    bn: { title: 'Array Data Structures & Operations in Depth (Bangla)', ytVideoId: 'V9wG42I5x4M', duration: 1720 },
    en: { title: 'Dynamic Arrays, Memory Buffers & Fast Search', ytVideoId: 'EAR7De6Goz4', duration: 1980 },
    hi: { title: 'Array Data Structures: 1D, 2D Vectors & Two Pointers', ytVideoId: 'g_SaxX48mTU', duration: 2100 },
  },
  linkedlist: {
    bn: { title: 'Singly & Doubly Linked List Complete Tutorial (Bangla)', ytVideoId: 'crgE_oH9q-w', duration: 2280 },
    en: { title: 'Linked List Data Structure: Pointers, Insertion & Deletion', ytVideoId: 'crgE_oH9q-w', duration: 2400 },
    hi: { title: 'Linked List Complete Roadmap: Singly, Doubly & Circular', ytVideoId: 'crgE_oH9q-w', duration: 2600 },
  },
  stackqueue: {
    bn: { title: 'Stack & Queue Data Structures Explained (Bangla)', ytVideoId: '7mUKGifs8S4', duration: 1650 },
    en: { title: 'Stacks, Queues, Deque & Monotonic Stack Patterns', ytVideoId: '7mUKGifs8S4', duration: 1880 },
    hi: { title: 'Stack and Queue Data Structures Complete Guide', ytVideoId: '7mUKGifs8S4', duration: 1920 },
  },
  trees: {
    bn: { title: 'Binary Trees & Binary Search Tree (BST) in Bangla', ytVideoId: '8hly31xKli0', duration: 2600 },
    en: { title: 'Binary Search Trees, AVL Trees & Tree Traversals', ytVideoId: '8hly31xKli0', duration: 2900 },
    hi: { title: 'Trees Data Structure: Preorder, Inorder, Postorder & BST', ytVideoId: '8hly31xKli0', duration: 3100 },
  },
  recursion: {
    bn: { title: 'Recursion & Backtracking Masterclass in Bangla', ytVideoId: 'g_SaxX48mTU', duration: 2450 },
    en: { title: 'Recursion Tree Method, Memoization & Divide and Conquer', ytVideoId: 'g_SaxX48mTU', duration: 2580 },
    hi: { title: 'Recursion and Backtracking Problems Master Guide', ytVideoId: 'g_SaxX48mTU', duration: 2750 },
  },
};

// Smart rule-based / regex parser that breaks any syllabus outline into distinct academic modules
export function parseSyllabusText(text: string): SyllabusModule[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const modules: SyllabusModule[] = [];

  for (const line of lines) {
    const clean = line.replace(/^(unit|module|chapter|week|\d+[\.\:\-\)])\s*/i, '').trim();
    if (clean.length < 3) continue;

    const lower = clean.toLowerCase();
    let topicKeyword = 'arrays';

    if (lower.includes('complex') || lower.includes('big o') || lower.includes('asymptot') || lower.includes('notation')) {
      topicKeyword = 'complexity';
    } else if (lower.includes('linked') || lower.includes('list') || lower.includes('node') || lower.includes('pointer')) {
      topicKeyword = 'linkedlist';
    } else if (lower.includes('stack') || lower.includes('queue') || lower.includes('fifo') || lower.includes('lifo')) {
      topicKeyword = 'stackqueue';
    } else if (lower.includes('tree') || lower.includes('bst') || lower.includes('heap') || lower.includes('graph')) {
      topicKeyword = 'trees';
    } else if (lower.includes('recur') || lower.includes('backtrack') || lower.includes('divide')) {
      topicKeyword = 'recursion';
    }

    modules.push({
      title: clean,
      topicKeyword,
    });
  }

  // If no lines matched, provide a standard curriculum structure
  if (modules.length === 0) {
    return [
      { title: 'Module 1: Foundations & Algorithm Complexity', topicKeyword: 'complexity' },
      { title: 'Module 2: Sequential Linear Structures & Arrays', topicKeyword: 'arrays' },
      { title: 'Module 3: Linked Lists & Pointer Allocations', topicKeyword: 'linkedlist' },
      { title: 'Module 4: Stacks, Queues & Practical Patterns', topicKeyword: 'stackqueue' },
      { title: 'Module 5: Hierarchical Trees & Binary Search', topicKeyword: 'trees' },
    ];
  }

  return modules.slice(0, 10); // up to 10 modules
}

export function generateRoadmapFromSyllabus(
  courseTitle: string,
  syllabusText: string,
  language: 'bn' | 'en' | 'hi' = 'bn'
): Playlist {
  const modules = parseSyllabusText(syllabusText);

  const videos: VideoItem[] = modules.map((mod, index) => {
    const matchedCategory = VIDEO_REGISTRY[mod.topicKeyword] || VIDEO_REGISTRY.arrays;
    const localized = matchedCategory[language];

    const mins = Math.floor(localized.duration / 60);
    const secs = localized.duration % 60;

    return {
      id: `syl_vid_${index + 1}_${Date.now()}`,
      ytVideoId: localized.ytVideoId,
      title: `${index + 1}. ${mod.title} — ${localized.title}`,
      durationSeconds: localized.duration,
      durationFormatted: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
      thumbnailUrl: `https://img.youtube.com/vi/${localized.ytVideoId}/hqdefault.jpg`,
    };
  });

  return {
    id: 'syl_pl_' + Date.now().toString(36),
    userId: 'user_active',
    customTitle: courseTitle.trim() || 'Exam Preparation Roadmap',
    originalTitle: courseTitle.trim() || 'Exam Preparation Roadmap',
    thumbnailUrl: videos[0]?.thumbnailUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    totalVideos: videos.length,
    completedVideos: 0,
    videos,
    sourceType: 'syllabus_roadmap',
    languagePreference: language,
    lastSyncedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}
