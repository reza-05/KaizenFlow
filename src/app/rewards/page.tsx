'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Award, 
  Flame, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  Shield, 
  Zap, 
  Compass, 
  Layers, 
  Crown, 
  Medal, 
  FileText, 
  Eye, 
  ArrowLeft 
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { CompletionBadgeModal } from '@/components/dashboard/CompletionBadgeModal';
import { BadgeEmblem } from '@/components/rewards/BadgeEmblem';
import { 
  getInitialUserProfile, 
  getPlaylists, 
  getVideoProgressList 
} from '@/lib/storage';
import { 
  calculateLevelFromXP, 
  evaluateUserBadges, 
  getTotalWatchTimeStats, 
  getTotalNotesCount 
} from '@/lib/rewards';
import { UserProfile, Playlist, EvaluatedBadge, BadgeCategory, LevelInfo } from '@/types';

export default function RewardsPage() {
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | BadgeCategory>('all');
  const [selectedBadge, setSelectedBadge] = useState<EvaluatedBadge | null>(null);

  useEffect(() => {
    setMounted(true);
    setUserProfile(getInitialUserProfile());
    setPlaylists(getPlaylists());
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-canvas)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-primary)] border-t-transparent" />
      </div>
    );
  }

  const totalXP = userProfile?.totalXP || 0;
  const levelInfo: LevelInfo = calculateLevelFromXP(totalXP);
  const watchStats = getTotalWatchTimeStats();
  const notesCount = getTotalNotesCount();
  const verifiedCount = Math.floor(totalXP / 50);
  const completedCoursesCount = playlists.filter(p => p.totalVideos > 0 && p.completedVideos >= p.totalVideos).length;

  const evaluatedBadges = evaluateUserBadges({
    totalWatchHours: watchStats.totalHours,
    currentStreak: userProfile?.currentStreak || 0,
    longestStreak: userProfile?.longestStreak || userProfile?.currentStreak || 0,
    completedCoursesCount,
    verifiedLessonsCount: verifiedCount,
    notesCount,
  });

  const filteredBadges = activeTab === 'all'
    ? evaluatedBadges
    : evaluatedBadges.filter(b => b.category === activeTab);

  const totalUnlocked = evaluatedBadges.filter(b => b.isUnlocked).length;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar userProfile={userProfile || undefined} isRewardsPage={true} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>STUDY MILESTONES & ACHIEVEMENTS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
              Levels & Milestone Badges
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              Earn badges by building consistent learning habits — tracked across your cumulative watch hours, daily streaks, and completed courses.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-2xs">
              {totalUnlocked} of {evaluatedBadges.length} Badges Unlocked
            </span>
          </div>
        </div>

        {/* Level Progression Hero Card */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {levelInfo.statusBadge}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Scholar Level {levelInfo.level} of 6
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] mt-1.5">
                {levelInfo.title}
              </h2>
            </div>

            <div className="sm:text-right">
              <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                {totalXP} <span className="text-xs font-sans font-normal text-[var(--text-secondary)]">XP</span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                {levelInfo.level < 6 
                  ? `${levelInfo.nextLevelXP - totalXP} XP until Level ${levelInfo.level + 1}`
                  : 'Pinnacle Academic Rank Achieved'}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-[var(--text-secondary)]">
              <span>Tier Progress ({levelInfo.progressPercent}%)</span>
              <span>{totalXP} / {levelInfo.nextLevelXP} XP</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden">
              <div 
                className="h-full bg-[var(--text-primary)] rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lifetime Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Clock className="h-3.5 w-3.5 text-sky-500" />
              <span>Deep Watch Time</span>
            </div>
            <div className="mt-3 text-xl font-bold font-mono text-[var(--text-primary)]">
              {watchStats.formatted}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {watchStats.totalHours} Total Hours
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span>Current Streak</span>
            </div>
            <div className="mt-3 text-xl font-bold font-mono text-[var(--text-primary)]">
              {userProfile?.currentStreak || 0} <span className="text-xs font-sans text-[var(--text-secondary)]">Days</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Longest: {userProfile?.longestStreak || userProfile?.currentStreak || 0} Days
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Award className="h-3.5 w-3.5 text-[#059669]" />
              <span>Earned XP</span>
            </div>
            <div className="mt-3 text-xl font-bold font-mono text-[var(--text-primary)]">
              {totalXP} <span className="text-xs font-sans text-[var(--text-secondary)]">XP</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              50 XP per completed lesson
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
              <span>Completed Courses</span>
            </div>
            <div className="mt-3 text-xl font-bold font-mono text-[var(--text-primary)]">
              {completedCoursesCount} <span className="text-xs font-sans text-[var(--text-secondary)]">Done</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              All lessons finished
            </div>
          </div>
        </div>

        {/* Badges Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            All Badges ({evaluatedBadges.length})
          </button>
          <button
            onClick={() => setActiveTab('watchtime')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'watchtime'
                ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-sky-500" />
            <span>Watchtime (10h–500h)</span>
          </button>
          <button
            onClick={() => setActiveTab('streak')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'streak'
                ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span>Daily Streaks (3d–100d)</span>
          </button>
          <button
            onClick={() => setActiveTab('course')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'course'
                ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
            <span>Course Mastery (1–10)</span>
          </button>
          <button
            onClick={() => setActiveTab('discipline')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'discipline'
                ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
            <span>Focus Shield</span>
          </button>
          <button
            onClick={() => setActiveTab('scholarship')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'scholarship'
                ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-amber-500" />
            <span>Notes & Scribe</span>
          </button>
        </div>

        {/* Badges Grid (Clean KaizenFlow Card Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBadges.map(badge => {
            const isUnlocked = badge.isUnlocked;

            return (
              <div
                key={badge.id}
                className={`rounded-xl border bg-[var(--bg-surface)] p-5 shadow-xs transition-all duration-200 flex flex-col justify-between ${
                  isUnlocked 
                    ? 'border-[var(--border-strong)] hover:shadow-md' 
                    : 'border-[var(--border-subtle)] opacity-90'
                }`}
              >
                <div>
                  {/* Top Bar with Custom Handcrafted Emblem & Target */}
                  <div className="flex items-start justify-between gap-3">
                    <BadgeEmblem badgeId={badge.id} isUnlocked={isUnlocked} size={56} />

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 rounded-md border border-[var(--border-subtle)]">
                        {badge.targetValue} {badge.unit}
                      </span>
                      {!isUnlocked && (
                        <span title="Locked milestone" className="p-1 rounded bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                          <Lock className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tier & Title */}
                  <div className="mt-3.5 flex items-center gap-2">
                    <span className={`text-[10px] font-bold font-mono uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                      badge.colorScheme === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                      badge.colorScheme === 'gold' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                      badge.colorScheme === 'platinum' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                      badge.colorScheme === 'obsidian' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                      badge.colorScheme === 'silver' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' :
                      'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                    }`}>
                      Tier {badge.tier}
                    </span>
                    <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)] truncate">
                      {badge.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {/* Footer Progress & Action */}
                <div className="mt-5 pt-3 border-t border-[var(--border-subtle)]">
                  {isUnlocked ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#059669]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Unlocked</span>
                      </div>

                      <button
                        onClick={() => setSelectedBadge(badge)}
                        className="flex items-center gap-1 rounded-md bg-[var(--bg-surface-subtle)] hover:bg-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer border border-[var(--border-subtle)] shadow-2xs"
                      >
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                        <span>View & Export</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-[var(--text-secondary)]">
                          {badge.currentValue} / {badge.targetValue} {badge.unit}
                        </span>
                        <button
                          onClick={() => setSelectedBadge(badge)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Preview</span>
                        </button>
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--text-primary)] rounded-full transition-all duration-300"
                          style={{ width: `${badge.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Universal Certificate & Badge Export Modal */}
      <CompletionBadgeModal
        isOpen={Boolean(selectedBadge)}
        onClose={() => setSelectedBadge(null)}
        badge={selectedBadge}
        userProfile={userProfile}
      />
    </div>
  );
}
