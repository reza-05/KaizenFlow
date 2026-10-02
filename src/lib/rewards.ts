'use client';

import { BadgeDefinition, EvaluatedBadge, LevelInfo, BadgeCategory } from '@/types';
import { getVideoProgressList, getPlaylists } from '@/lib/storage';

// 1. Level Config: 6 Ranks of Academic Focus
export const LEVEL_CONFIG = [
  { level: 1, minXP: 0, nextXP: 250, title: 'Novice Scholar', bengaliTitle: 'শিক্ষানবিস', statusBadge: 'Rank I' },
  { level: 2, minXP: 250, nextXP: 750, title: 'Focused Apprentice', bengaliTitle: 'মনোযোগী সাধক', statusBadge: 'Rank II' },
  { level: 3, minXP: 750, nextXP: 1750, title: 'Disciplined Practitioner', bengaliTitle: 'অনুশীলক', statusBadge: 'Rank III' },
  { level: 4, minXP: 1750, nextXP: 3500, title: 'Dedicated Scholar', bengaliTitle: 'উৎসর্গীকৃত পণ্ডিত', statusBadge: 'Rank IV' },
  { level: 5, minXP: 3500, nextXP: 7000, title: 'Deep Work Virtuoso', bengaliTitle: 'একনিষ্ঠ সাধক', statusBadge: 'Rank V' },
  { level: 6, minXP: 7000, nextXP: 15000, title: 'Kaizen Grandmaster', bengaliTitle: 'কাইজেন গ্র্যান্ডমাস্টার', statusBadge: 'Master' },
];

export function calculateLevelFromXP(totalXP: number): LevelInfo {
  const safeXP = Math.max(0, totalXP || 0);

  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    const tier = LEVEL_CONFIG[i];
    if (safeXP >= tier.minXP) {
      const isMaxLevel = i === LEVEL_CONFIG.length - 1;
      const span = tier.nextXP - tier.minXP;
      const progressInTier = safeXP - tier.minXP;
      const progressPercent = isMaxLevel ? 100 : Math.min(100, Math.round((progressInTier / span) * 100));

      return {
        level: tier.level,
        title: tier.title,
        bengaliTitle: tier.bengaliTitle,
        currentXP: safeXP,
        minXP: tier.minXP,
        nextLevelXP: tier.nextXP,
        progressPercent,
        statusBadge: tier.statusBadge,
      };
    }
  }

  const first = LEVEL_CONFIG[0];
  return {
    level: 1,
    title: first.title,
    bengaliTitle: first.bengaliTitle,
    currentXP: 0,
    minXP: 0,
    nextLevelXP: first.nextXP,
    progressPercent: 0,
    statusBadge: first.statusBadge,
  };
}

// 2. Comprehensive Badge Definitions
export const ALL_BADGE_DEFINITIONS: BadgeDefinition[] = [
  // --- A. Watchtime Badges (10h to 500h) ---
  {
    id: 'wt_10h',
    category: 'watchtime',
    tier: 1,
    title: 'Focus Foundation',
    bengaliTitle: 'ভিত্তিপ্রস্তর',
    description: 'Completed 10 cumulative hours of uninterrupted deep study.',
    targetValue: 10,
    unit: 'hours',
    iconName: 'Compass',
    colorScheme: 'bronze',
  },
  {
    id: 'wt_25h',
    category: 'watchtime',
    tier: 2,
    title: 'Deep Dive Scholar',
    bengaliTitle: 'গভীর অন্বেষণ',
    description: 'Surpassed 25 hours of focused learning (1 full university course equivalent).',
    targetValue: 25,
    unit: 'hours',
    iconName: 'Layers',
    colorScheme: 'silver',
  },
  {
    id: 'wt_50h',
    category: 'watchtime',
    tier: 3,
    title: 'Endurance Virtuoso',
    bengaliTitle: '৫০ ঘণ্টার সাধক',
    description: 'Accumulated 50 hours of verified deep lecture immersion across curriculums.',
    targetValue: 50,
    unit: 'hours',
    iconName: 'Zap',
    colorScheme: 'gold',
  },
  {
    id: 'wt_100h',
    category: 'watchtime',
    tier: 4,
    title: 'Centurion of Focus',
    bengaliTitle: 'শতঘণ্টার সংকল্প',
    description: 'Joined the elite triple-digit club: 100 verified deep focus study hours.',
    targetValue: 100,
    unit: 'hours',
    iconName: 'Shield',
    colorScheme: 'platinum',
  },
  {
    id: 'wt_250h',
    category: 'watchtime',
    tier: 5,
    title: 'Polymath Sovereign',
    bengaliTitle: 'মহাপণ্ডিত',
    description: 'Mastered 250 hours of deep work, demonstrating polymath-level devotion.',
    targetValue: 250,
    unit: 'hours',
    iconName: 'Crown',
    colorScheme: 'obsidian',
  },
  {
    id: 'wt_500h',
    category: 'watchtime',
    tier: 6,
    title: 'Kaizen Legend',
    bengaliTitle: 'কাইজেন কিংবদন্তি',
    description: 'The monumental summit: 500 verified hours of uncompromised academic discipline.',
    targetValue: 500,
    unit: 'hours',
    iconName: 'Sparkles',
    colorScheme: 'emerald',
  },

  // --- B. Streak Badges (3d to 100d) ---
  {
    id: 'st_3d',
    category: 'streak',
    tier: 1,
    title: 'Ignition Spark',
    bengaliTitle: 'সূচনা স্ফুলিঙ্গ',
    description: 'Built study momentum with 3 consecutive days of verified learning.',
    targetValue: 3,
    unit: 'days',
    iconName: 'Flame',
    colorScheme: 'bronze',
  },
  {
    id: 'st_7d',
    category: 'streak',
    tier: 2,
    title: 'Iron Discipline',
    bengaliTitle: 'লৌহ শৃঙ্খলা',
    description: 'Completed 1 full unbroken week (7 days) without skipping a single study session.',
    targetValue: 7,
    unit: 'days',
    iconName: 'ShieldCheck',
    colorScheme: 'silver',
  },
  {
    id: 'st_14d',
    category: 'streak',
    tier: 3,
    title: 'Fortitude Crest',
    bengaliTitle: 'ধৈর্য ও নিষ্ঠা',
    description: 'Demonstrated enduring habit formation: 14 consecutive study days.',
    targetValue: 14,
    unit: 'days',
    iconName: 'Clock',
    colorScheme: 'gold',
  },
  {
    id: 'st_30d',
    category: 'streak',
    tier: 4,
    title: 'Unstoppable Momentum',
    bengaliTitle: 'অপ্রতিরোধ্য গতি',
    description: 'A full calendar month (30 days) of unbroken daily learning habit.',
    targetValue: 30,
    unit: 'days',
    iconName: 'Medal',
    colorScheme: 'platinum',
  },
  {
    id: 'st_100d',
    category: 'streak',
    tier: 5,
    title: 'Kaizen Centurion',
    bengaliTitle: 'শতদিনের সংকল্প',
    description: 'Legendary 100-day unbroken streak of daily verified improvement.',
    targetValue: 100,
    unit: 'days',
    iconName: 'Award',
    colorScheme: 'obsidian',
  },

  // --- C. Course Mastery Badges (1, 3, 5 Courses) ---
  {
    id: 'cm_1c',
    category: 'course',
    tier: 1,
    title: 'First Syllabus Conquered',
    bengaliTitle: 'প্রথম মাইলফলক',
    description: '100% verified completion of your first full academic course or roadmap.',
    targetValue: 1,
    unit: 'courses',
    iconName: 'CheckCircle2',
    colorScheme: 'bronze',
  },
  {
    id: 'cm_3c',
    category: 'course',
    tier: 2,
    title: 'Multi-Domain Scholar',
    bengaliTitle: 'বহুশাস্ত্রদর্শী',
    description: 'Successfully finished and verified 3 complete courses.',
    targetValue: 3,
    unit: 'courses',
    iconName: 'BookOpen',
    colorScheme: 'gold',
  },
  {
    id: 'cm_5c',
    category: 'course',
    tier: 3,
    title: 'Master of Curriculums',
    bengaliTitle: 'জ্ঞানযোগী',
    description: 'Conquered 5 comprehensive playlists with 100% verified code checks.',
    targetValue: 5,
    unit: 'courses',
    iconName: 'Trophy',
    colorScheme: 'emerald',
  },
];

// 3. Aggregate Total Watch Time across user progress
export function getTotalWatchTimeStats(): {
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  formatted: string;
} {
  if (typeof window === 'undefined') {
    return { totalSeconds: 0, totalMinutes: 0, totalHours: 0, formatted: '0h 0m' };
  }

  const progressList = Object.values(getVideoProgressList());
  const totalSeconds = progressList.reduce((acc, p) => {
    return acc + Math.max(p.watchedSeconds || 0, p.maxWatchedSeconds || 0);
  }, 0);

  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Number((totalSeconds / 3600).toFixed(1));

  const displayHours = Math.floor(totalSeconds / 3600);
  const displayMins = Math.floor((totalSeconds % 3600) / 60);

  return {
    totalSeconds,
    totalMinutes,
    totalHours,
    formatted: displayHours > 0 ? `${displayHours}h ${displayMins}m` : `${displayMins}m`,
  };
}

// 4. Evaluate all badges for current user
export function evaluateUserBadges(stats: {
  totalWatchHours: number;
  currentStreak: number;
  longestStreak: number;
  completedCoursesCount: number;
}): EvaluatedBadge[] {
  const maxStreak = Math.max(stats.currentStreak, stats.longestStreak);

  return ALL_BADGE_DEFINITIONS.map(badge => {
    let currentValue = 0;

    if (badge.category === 'watchtime') {
      currentValue = stats.totalWatchHours;
    } else if (badge.category === 'streak') {
      currentValue = maxStreak;
    } else if (badge.category === 'course') {
      currentValue = stats.completedCoursesCount;
    }

    const isUnlocked = currentValue >= badge.targetValue;
    const progressPercent = Math.min(100, Math.round((currentValue / badge.targetValue) * 100));

    return {
      ...badge,
      isUnlocked,
      currentValue,
      progressPercent,
    };
  });
}
