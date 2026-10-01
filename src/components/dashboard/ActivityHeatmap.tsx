'use client';

import React, { useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import { DailyActivity } from '@/types';
import { ClashFlame } from '@/components/ui/ClashFlame';

interface ActivityHeatmapProps {
  activityMap: Record<string, DailyActivity>;
  currentStreak: number;
  longestStreak?: number;
  totalLessonsCompleted?: number;
}

interface DayCell {
  date: string;
  dayOfMonth: number;
  dayOfWeek: number;
  activity?: DailyActivity;
  isFuture: boolean;
}

interface WeekColumn {
  weekIndex: number;
  monthLabel?: string;
  days: (DayCell | null)[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  activityMap,
  currentStreak = 0,
  longestStreak = 0,
  totalLessonsCompleted,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    dayOfMonth: number;
    activity?: DailyActivity;
    x: number;
    y: number;
  } | null>(null);

  // Compute 53-week continuous calendar timeline (Codeforces Flow: from 1 year ago to now)
  const weeks = useMemo<WeekColumn[]>(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Current week ends on Saturday
    const currentDayOfWeek = today.getDay();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - currentDayOfWeek));

    // Start 52 weeks (364 days) before the end date's Sunday
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (52 * 7 + 6));

    const result: WeekColumn[] = [];
    let lastLabeledMonth = -1;
    const cursor = new Date(startDate);

    for (let w = 0; w < 53; w++) {
      const days: (DayCell | null)[] = [];
      let monthLabel: string | undefined = undefined;

      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().split('T')[0];
        const month = cursor.getMonth();
        const dayOfMonth = cursor.getDate();
        const isFuture = dateStr > todayStr;

        // Label month on first appearance or when dayOfMonth is in the first week of the month
        if (month !== lastLabeledMonth && dayOfMonth <= 7 && !monthLabel) {
          monthLabel = MONTH_NAMES[month];
          lastLabeledMonth = month;
        }

        days.push({
          date: dateStr,
          dayOfMonth,
          dayOfWeek: d,
          activity: activityMap[dateStr],
          isFuture,
        });

        cursor.setDate(cursor.getDate() + 1);
      }

      result.push({
        weekIndex: w,
        monthLabel,
        days,
      });
    }

    return result;
  }, [activityMap]);

  // Dynamic statistics for Codeforces 3-column stats
  const totalLessonsAllTime = useMemo(() => {
    if (typeof totalLessonsCompleted === 'number') return totalLessonsCompleted;
    return Object.values(activityMap).reduce((acc, curr) => acc + (curr.verifiedCount || 0), 0);
  }, [activityMap, totalLessonsCompleted]);

  const yearStats = useMemo(() => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

    let lessons = 0;
    let minutes = 0;
    Object.values(activityMap).forEach(a => {
      if (a.date >= oneYearAgoStr) {
        lessons += (a.verifiedCount || 0);
        minutes += (a.minutesWatched || 0);
      }
    });

    return {
      lessons,
      hours: (minutes / 60).toFixed(1),
    };
  }, [activityMap]);

  const monthStats = useMemo(() => {
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    let lessons = 0;
    let minutes = 0;
    Object.values(activityMap).forEach(a => {
      if (a.date.startsWith(currentYearMonth)) {
        lessons += (a.verifiedCount || 0);
        minutes += (a.minutesWatched || 0);
      }
    });

    return { lessons, minutes };
  }, [activityMap]);

  // Exact 5-Tier Color & Video Mapping:
  // Level 0: 0 videos (< 10 mins) -> Blank Inactive
  // Level 1: 1 video verified -> Lightest Mint Green
  // Level 2: 2 videos verified -> Light-Medium Green
  // Level 3: 3 videos verified -> Medium-Deep Emerald
  // Level 4: 4 videos verified -> Deep Dark Emerald
  // Level 5: 5+ videos verified -> Deep Forest Green + Clash of Clans Roaring Flame (NO YELLOW!)
  const getCellDetails = (cell: DayCell | null) => {
    if (!cell) return { isVisible: false, className: '', hasFlame: false, level: 0 };

    if (cell.isFuture) {
      return {
        isVisible: true,
        className: 'bg-[var(--bg-surface-subtle)]/30 border border-dashed border-[var(--border-subtle)]/40 opacity-30 cursor-default',
        hasFlame: false,
        level: 0,
      };
    }

    const activity = cell.activity;
    const mins = activity?.minutesWatched || 0;
    const verified = activity?.verifiedCount || 0;

    // Level 0: Blank Inactive day (0 videos verified and < 10 mins watched)
    if (verified === 0 && mins < 10) {
      return {
        isVisible: true,
        className: 'bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)]',
        hasFlame: false,
        level: 0,
      };
    }

    // Level 5: 5+ videos verified (or >= 120 mins) — Clash of Clans Roaring Flame
    if (verified >= 5 || (verified >= 4 && mins >= 120)) {
      return {
        isVisible: true,
        className: 'bg-[#047857] dark:bg-[#064e3b] border border-[#065f46] dark:border-[#047857] hover:scale-120 text-white shadow-xs relative overflow-visible',
        hasFlame: true,
        level: 5,
      };
    }

    // Level 4: 4 videos verified (or >= 90 mins) — Deep Dark Emerald
    if (verified >= 4 || mins >= 90) {
      return {
        isVisible: true,
        className: 'bg-[#059669] dark:bg-[#064e3b] border border-[#047857] dark:border-[#059669] hover:scale-115 text-white',
        hasFlame: false,
        level: 4,
      };
    }

    // Level 3: 3 videos verified (or >= 60 mins) — Medium-Deep Emerald
    if (verified >= 3 || mins >= 60) {
      return {
        isVisible: true,
        className: 'bg-[#10b981] dark:bg-[#047857] border border-[#059669] dark:border-[#10b981] hover:scale-115 text-white',
        hasFlame: false,
        level: 3,
      };
    }

    // Level 2: 2 videos verified (or >= 30 mins) — Light-Medium Green
    if (verified >= 2 || mins >= 30) {
      return {
        isVisible: true,
        className: 'bg-[#4ade80] dark:bg-[#059669] border border-[#22c55e] dark:border-[#10b981] hover:scale-115 text-white',
        hasFlame: false,
        level: 2,
      };
    }

    // Level 1: 1 video verified (or >= 10 mins) — Lightest Mint Green
    return {
      isVisible: true,
      className: 'bg-[#bbf7d0] dark:bg-[#064e3b] border border-[#86efac] dark:border-[#065f46] hover:scale-115 text-zinc-800 dark:text-white',
      hasFlame: false,
      level: 1,
    };
  };

  const formatDateDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-xs relative transition-colors duration-200">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-bold tracking-tight text-[var(--text-primary)]">
            Activity & Consistency Momentum
          </span>
          <div className="group relative flex items-center">
            <Info className="h-4 w-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-52 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-[11px] text-[var(--text-secondary)] shadow-xl z-50 pointer-events-none">
              Daily study volume & proof-of-focus verification log over the past 52 weeks.
            </div>
          </div>
        </div>

        {/* Right Filter & Streak */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span>Filter:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-500">
            <ClashFlame size={14} />
            <span>{currentStreak} Days</span>
          </div>
        </div>
      </div>

      {/* Codeforces-Style Continuous Heatmap Grid (Left to Right timeline) */}
      <div className="overflow-x-auto pb-3 pt-1 scrollbar-thin">
        <div className="min-w-[780px] select-none">
          {/* Top Month Labels aligned with weeks */}
          <div className="flex ml-7 sm:ml-8 gap-1 sm:gap-1.25 text-[11px] font-medium text-[var(--text-muted)] h-5 mb-1 select-none">
            {weeks.map((week, idx) => (
              <div key={idx} className="w-3 sm:w-3.5 flex-shrink-0 relative">
                {week.monthLabel && (
                  <span className="absolute left-0 top-0 text-[10px] font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                    {week.monthLabel}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Grid with Weekday Labels on Left (Mon, Wed, Fri) */}
          <div className="flex items-start">
            {/* Weekday Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col gap-1 sm:gap-1.25 w-7 text-[9px] font-mono text-[var(--text-muted)] pt-0.5 pr-1 text-right select-none">
              <span className="h-3 sm:h-3.5 leading-3"></span>
              <span className="h-3 sm:h-3.5 leading-3">Mon</span>
              <span className="h-3 sm:h-3.5 leading-3"></span>
              <span className="h-3 sm:h-3.5 leading-3">Wed</span>
              <span className="h-3 sm:h-3.5 leading-3"></span>
              <span className="h-3 sm:h-3.5 leading-3">Fri</span>
              <span className="h-3 sm:h-3.5 leading-3"></span>
            </div>

            {/* 53 Columns of Weeks (7 rows each) */}
            <div className="flex gap-1 sm:gap-1.25">
              {weeks.map((week) => (
                <div key={week.weekIndex} className="flex flex-col gap-1 sm:gap-1.25 flex-shrink-0">
                  {week.days.map((cell, dayIdx) => {
                    const details = getCellDetails(cell);

                    return (
                      <div
                        key={dayIdx}
                        onMouseEnter={(e) => {
                          if (!cell || cell.isFuture) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            date: cell.date,
                            dayOfMonth: cell.dayOfMonth,
                            activity: cell.activity,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] transition-all duration-150 flex items-center justify-center relative cursor-pointer ${details.className}`}
                      >
                        {details.hasFlame && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <ClashFlame size={13} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Codeforces Iconic 3-Column Statistics Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-5 mt-3 border-t border-[var(--border-subtle)]">
        {/* Column 1: All Time */}
        <div className="space-y-3">
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {totalLessonsAllTime} lessons
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              verified for all time
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {longestStreak} days
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              in a row max streak
            </div>
          </div>
        </div>

        {/* Column 2: Last Year */}
        <div className="space-y-3">
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {yearStats.lessons} lessons
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              verified for the last year
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {longestStreak} days
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              in a row for the last year
            </div>
          </div>
        </div>

        {/* Column 3: Current Month & Live Streak */}
        <div className="space-y-3">
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {monthStats.lessons} lessons
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              verified for the last month
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
              <span>{currentStreak} days</span>
              <ClashFlame size={20} />
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              in a row for the last month
            </div>
          </div>
        </div>
      </div>

      {/* Legend (Exact Video Count Mapping + Clash of Clans Roaring Fire) */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] select-none">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {/* Level 0: 0 videos */}
          <div
            title="Level 0: 0 videos (<10 mins)"
            className="w-2.5 h-2.5 rounded-[2px] bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] cursor-help transition-transform hover:scale-125"
          />
          {/* Level 1: 1 video */}
          <div
            title="Level 1: 1 video verified"
            className="w-2.5 h-2.5 rounded-[2px] bg-[#bbf7d0] dark:bg-[#064e3b] border border-[#86efac] dark:border-[#065f46] cursor-help transition-transform hover:scale-125"
          />
          {/* Level 2: 2 videos */}
          <div
            title="Level 2: 2 videos verified"
            className="w-2.5 h-2.5 rounded-[2px] bg-[#4ade80] dark:bg-[#059669] border border-[#22c55e] dark:border-[#10b981] cursor-help transition-transform hover:scale-125"
          />
          {/* Level 3: 3 videos */}
          <div
            title="Level 3: 3 videos verified"
            className="w-2.5 h-2.5 rounded-[2px] bg-[#10b981] dark:bg-[#047857] border border-[#059669] dark:border-[#10b981] cursor-help transition-transform hover:scale-125"
          />
          {/* Level 4: 4 videos */}
          <div
            title="Level 4: 4 videos verified"
            className="w-2.5 h-2.5 rounded-[2px] bg-[#059669] dark:bg-[#064e3b] border border-[#047857] dark:border-[#064e3b] cursor-help transition-transform hover:scale-125"
          />
          {/* Level 5: 5+ videos + Clash of Clans Roaring Fire */}
          <div
            title="Level 5: 5+ videos verified — Clash of Clans Roaring Fire 🔥"
            className="w-2.5 h-2.5 rounded-[2px] bg-[#047857] dark:bg-[#064e3b] border border-[#065f46] dark:border-[#047857] flex items-center justify-center cursor-help transition-transform hover:scale-125 overflow-visible"
          >
            <ClashFlame size={9} />
          </div>
        </div>
        <span>More</span>
      </div>

      {/* Interactive Tooltip Card */}
      {hoveredCell && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y - 10}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 pointer-events-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md px-3 py-2 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-100 min-w-[170px]"
        >
          <p className="font-bold text-[var(--text-primary)] mb-0.5">
            {formatDateDisplay(hoveredCell.date)}
          </p>
          {hoveredCell.activity && (hoveredCell.activity.minutesWatched > 0 || hoveredCell.activity.verifiedCount > 0) ? (
            <div className="space-y-0.5 text-[11px] text-[var(--text-secondary)]">
              <p>⏱️ {Math.round(hoveredCell.activity.minutesWatched)} mins focused study</p>
              <p>✓ {hoveredCell.activity.verifiedCount} lessons verified</p>
              {hoveredCell.activity.xpEarned > 0 && (
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  +{hoveredCell.activity.xpEarned} XP earned
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--text-muted)]">No study activity recorded</p>
          )}
        </div>
      )}
    </div>
  );
};
