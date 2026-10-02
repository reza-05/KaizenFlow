'use client';

import React, { useState } from 'react';
import { 
  Award, 
  X, 
  Flame, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Download, 
  ShieldCheck, 
  Trophy, 
  Zap, 
  Compass, 
  Layers, 
  Shield, 
  Crown, 
  Medal,
  TrendingUp
} from 'lucide-react';
import { UserProfile, EvaluatedBadge, LevelInfo, BadgeCategory } from '@/types';
import { calculateLevelFromXP, evaluateUserBadges, getTotalWatchTimeStats } from '@/lib/rewards';

interface RewardsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  completedCoursesCount: number;
  onSelectBadgeForExport: (badge: EvaluatedBadge) => void;
}

// Icon mapper for badge definitions
function getBadgeIcon(iconName: string, className: string) {
  switch (iconName) {
    case 'Compass': return <Compass className={className} />;
    case 'Layers': return <Layers className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Crown': return <Crown className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'Medal': return <Medal className={className} />;
    case 'Award': return <Award className={className} />;
    case 'CheckCircle2': return <CheckCircle2 className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Trophy': return <Trophy className={className} />;
    default: return <Award className={className} />;
  }
}

// Color theme helper
function getColorClasses(scheme: string, isUnlocked: boolean) {
  if (!isUnlocked) {
    return {
      border: 'border-zinc-800 bg-zinc-900/40 opacity-75',
      iconBg: 'bg-zinc-800/80 text-zinc-500',
      badge: 'bg-zinc-800 text-zinc-400',
      bar: 'bg-zinc-700',
    };
  }

  switch (scheme) {
    case 'emerald':
      return {
        border: 'border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/50',
        iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        badge: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
        bar: 'bg-emerald-500',
      };
    case 'gold':
      return {
        border: 'border-amber-500/30 bg-amber-950/20 hover:border-amber-500/50',
        iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        badge: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
        bar: 'bg-amber-500',
      };
    case 'platinum':
    case 'silver':
      return {
        border: 'border-sky-500/30 bg-sky-950/20 hover:border-sky-500/50',
        iconBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
        badge: 'bg-sky-500/10 text-sky-300 border border-sky-500/30',
        bar: 'bg-sky-500',
      };
    case 'obsidian':
      return {
        border: 'border-purple-500/30 bg-purple-950/20 hover:border-purple-500/50',
        iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
        badge: 'bg-purple-500/10 text-purple-300 border border-purple-500/30',
        bar: 'bg-purple-500',
      };
    case 'bronze':
    default:
      return {
        border: 'border-amber-700/30 bg-amber-950/15 hover:border-amber-700/50',
        iconBg: 'bg-amber-700/10 text-amber-500 border border-amber-700/30',
        badge: 'bg-amber-700/10 text-amber-400 border border-amber-700/30',
        bar: 'bg-amber-600',
      };
  }
}

export const RewardsHubModal: React.FC<RewardsHubModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  completedCoursesCount,
  onSelectBadgeForExport,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | BadgeCategory>('all');

  if (!isOpen) return null;

  const totalXP = userProfile?.totalXP || 0;
  const levelInfo: LevelInfo = calculateLevelFromXP(totalXP);
  const watchStats = getTotalWatchTimeStats();

  const evaluatedBadges = evaluateUserBadges({
    totalWatchHours: watchStats.totalHours,
    currentStreak: userProfile?.currentStreak || 0,
    longestStreak: userProfile?.longestStreak || userProfile?.currentStreak || 0,
    completedCoursesCount,
  });

  const filteredBadges = activeTab === 'all'
    ? evaluatedBadges
    : evaluatedBadges.filter(b => b.category === activeTab);

  const totalUnlocked = evaluatedBadges.filter(b => b.isUnlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden text-zinc-100">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Academic Levels & Badges Hub
                </h2>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                  {totalUnlocked}/{evaluatedBadges.length} Badges Unlocked
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Earned strictly through verified deep watch time, daily study streaks, and curriculum mastery.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Level Progression Hero Card */}
          <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 shadow-lg relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                    {levelInfo.statusBadge}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">
                    Scholar Level {levelInfo.level} of 6
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white mt-1 tracking-tight flex items-baseline gap-2">
                  <span>{levelInfo.title}</span>
                  <span className="text-sm font-normal text-zinc-400 font-sans">
                    ({levelInfo.bengaliTitle})
                  </span>
                </h3>
              </div>

              <div className="text-right sm:text-right">
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {totalXP} <span className="text-xs font-sans font-semibold text-zinc-400">XP</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  {levelInfo.level < 6 
                    ? `${levelInfo.nextLevelXP - totalXP} XP until Level ${levelInfo.level + 1}`
                    : 'Pinnacle Level Achieved'}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>Tier Progress ({levelInfo.progressPercent}%)</span>
                <span>{totalXP} / {levelInfo.nextLevelXP} XP</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Lifetime Verified Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Clock className="h-3.5 w-3.5 text-sky-400" />
                <span>Deep Watch Time</span>
              </div>
              <div className="mt-2 text-lg font-bold font-mono text-white">
                {watchStats.formatted}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                {watchStats.totalHours} Total Hours
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span>Current Streak</span>
              </div>
              <div className="mt-2 text-lg font-bold font-mono text-white">
                {userProfile?.currentStreak || 0} <span className="text-xs font-sans text-zinc-400">Days</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                Best: {userProfile?.longestStreak || userProfile?.currentStreak || 0} Days
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Award className="h-3.5 w-3.5 text-amber-400" />
                <span>Verified XP</span>
              </div>
              <div className="mt-2 text-lg font-bold font-mono text-white">
                {totalXP} <span className="text-xs font-sans text-zinc-400">XP</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                +50 XP per lesson
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                <span>Mastered Courses</span>
              </div>
              <div className="mt-2 text-lg font-bold font-mono text-white">
                {completedCoursesCount} <span className="text-xs font-sans text-zinc-400">Done</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                100% Verified
              </div>
            </div>
          </div>

          {/* Badges Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeTab === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              All Badges ({evaluatedBadges.length})
            </button>
            <button
              onClick={() => setActiveTab('watchtime')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeTab === 'watchtime'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Clock className="h-3 w-3 text-sky-400" />
              <span>Watchtime (10h–500h)</span>
            </button>
            <button
              onClick={() => setActiveTab('streak')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeTab === 'streak'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Flame className="h-3 w-3 text-orange-400" />
              <span>Streaks (3d–100d)</span>
            </button>
            <button
              onClick={() => setActiveTab('course')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeTab === 'course'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <BookOpen className="h-3 w-3 text-emerald-400" />
              <span>Course Mastery</span>
            </button>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBadges.map(badge => {
              const colors = getColorClasses(badge.colorScheme, badge.isUnlocked);

              return (
                <div
                  key={badge.id}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 ${colors.border}`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Badge Icon */}
                    <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.iconBg}`}>
                      {getBadgeIcon(badge.iconName, 'h-6 w-6')}
                      {!badge.isUnlocked && (
                        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400">
                          <Lock className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Badge Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {badge.title}
                        </h4>
                        <span className="text-[10px] font-mono font-semibold text-zinc-400 shrink-0">
                          {badge.targetValue} {badge.unit}
                        </span>
                      </div>
                      
                      <div className="text-[11px] font-medium text-amber-400/90 font-sans">
                        {badge.bengaliTitle}
                      </div>

                      <p className="text-xs text-zinc-400 mt-1 leading-snug">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Progress or Action */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                    {badge.isUnlocked ? (
                      <>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Unlocked & Verified</span>
                        </div>

                        <button
                          onClick={() => onSelectBadgeForExport(badge)}
                          className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 text-xs font-semibold border border-zinc-700 hover:border-zinc-600 transition-all cursor-pointer shadow-xs"
                          title="View badge and download high-res PNG or PDF certificate"
                        >
                          <Award className="h-3.5 w-3.5 text-amber-400" />
                          <span>View & Export</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                          <span>Progress: {badge.currentValue} / {badge.targetValue} {badge.unit}</span>
                          <span>{badge.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
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

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Anti-Cheat Protected: Lessons require video completion and code verification.</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
