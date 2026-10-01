'use client';

import React, { useState, useMemo } from 'react';
import { Flame, Info } from 'lucide-react';
import { DailyActivity } from '@/types';

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

interface MonthBlock {
  name: string;
  year: number;
  monthIndex: number;
  isCurrent: boolean;
  weeks: (DayCell | null)[][];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  activityMap,
  currentStreak,
  longestStreak = 42,
  totalLessonsCompleted,
}) => {
  // Default to 'recent' (Recent Month First: Oct -> Nov)
  const [orderMode, setOrderMode] = useState<'recent' | 'oldest'>('recent');
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    dayOfMonth: number;
    activity?: DailyActivity;
    x: number;
    y: number;
  } | null>(null);

  // Compute 12-Month Calendar Blocks dynamically based on today's real date
  const months = useMemo<MonthBlock[]>(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const rawMonths: MonthBlock[] = [];

    // Calculate 12 consecutive months ending with current month
    for (let i = 0; i < 12; i++) {
      const monthOffset = orderMode === 'recent' ? i : (11 - i);
      const monthDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
      const year = monthDate.getFullYear();
      const monthIndex = monthDate.getMonth();
      const monthName = MONTH_NAMES[monthIndex];
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const isCurrent = monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth();

      const weeks: (DayCell | null)[][] = [];
      let currentWeek: (DayCell | null)[] = new Array(7).fill(null);

      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, monthIndex, day);
        const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
        const monthNum = String(monthIndex + 1).padStart(2, '0');
        const dayNum = String(day).padStart(2, '0');
        const dateStr = `${year}-${monthNum}-${dayNum}`;

        const isFuture = dateStr > todayStr;
        const cell: DayCell = {
          date: dateStr,
          dayOfMonth: day,
          dayOfWeek,
          activity: activityMap[dateStr],
          isFuture,
        };

        currentWeek[dayOfWeek] = cell;

        // Saturday (6) or last day of month closes the week column
        if (dayOfWeek === 6 || day === daysInMonth) {
          weeks.push(currentWeek);
          currentWeek = new Array(7).fill(null);
        }
      }

      rawMonths.push({
        name: monthName,
        year,
        monthIndex,
        isCurrent,
        weeks,
      });
    }

    return rawMonths;
  }, [activityMap, orderMode]);

  // Dynamic statistics
  const activeDaysCount = useMemo(() => {
    return Object.values(activityMap).filter(
      a => (a.minutesWatched && a.minutesWatched > 0) || (a.verifiedCount && a.verifiedCount > 0)
    ).length;
  }, [activityMap]);

  const totalLessons = useMemo(() => {
    if (typeof totalLessonsCompleted === 'number') return totalLessonsCompleted;
    return Object.values(activityMap).reduce((acc, curr) => acc + (curr.verifiedCount || 0), 0);
  }, [activityMap, totalLessonsCompleted]);

  // Determine cell visual style (Seamless Light Mode & Dark Mode with CSS Variables)
  const getCellDetails = (cell: DayCell | null) => {
    if (!cell) return { isVisible: false, className: '', hasFlame: false };

    // Future days in current month (subtle dashed outline, not harsh black!)
    if (cell.isFuture) {
      return {
        isVisible: true,
        className: 'bg-[var(--bg-surface-subtle)]/40 border border-dashed border-[var(--border-subtle)]/50 opacity-40 cursor-default',
        hasFlame: false,
      };
    }

    const activity = cell.activity;
    const mins = activity?.minutesWatched || 0;
    const verified = activity?.verifiedCount || 0;

    // Inactive day (Soft adaptive ivory/gray in Light Mode, dark graphite in Dark Mode)
    if (mins === 0 && verified === 0) {
      return {
        isVisible: true,
        className: 'bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:ring-1 hover:ring-[var(--text-primary)]',
        hasFlame: false,
      };
    }

    // High intensity day with flame icon (>= 60 mins or verified >= 2)
    if (mins >= 60 || verified >= 2 || (mins >= 35 && verified >= 1 && (cell.dayOfMonth % 3 === 0))) {
      return {
        isVisible: true,
        className: 'bg-[#059669] dark:bg-[#10b981] border-2 border-amber-400 shadow-2xs hover:scale-115 ring-1 ring-amber-400/40 text-white',
        hasFlame: true,
      };
    }

    // Level 3 (45-59 mins or 1 verified lesson)
    if (mins >= 45 || verified >= 1) {
      return {
        isVisible: true,
        className: 'bg-[#059669] dark:bg-[#10b981] border border-[#047857] hover:scale-115 text-white',
        hasFlame: false,
      };
    }

    // Level 2 (25-44 mins)
    if (mins >= 25) {
      return {
        isVisible: true,
        className: 'bg-[#34d399] dark:bg-[#059669] border border-[#10b981] hover:scale-115 text-white',
        hasFlame: false,
      };
    }

    // Level 1 (< 25 mins)
    return {
      isVisible: true,
      className: 'bg-[#a7f3d0] dark:bg-[#064e3b] border border-[#6ee7b7] dark:border-[#047857] hover:scale-115 text-white',
      hasFlame: false,
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
      {/* Top Header Row (Matches LeetCode header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--border-subtle)]">
        {/* Left: Active Days Count & Info Tooltip */}
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
            {activeDaysCount} Active days
          </span>
          <div className="group relative flex items-center">
            <Info className="h-4 w-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-[11px] text-[var(--text-secondary)] shadow-xl z-50 pointer-events-none">
              Active days represent days with verified lessons or recorded focus watch time.
            </div>
          </div>
        </div>

        {/* Right: Dropdown Order Selector & Streak Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Order Selector (Recent First vs Chronological) */}
          <div className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 text-xs">
            <select
              value={orderMode}
              onChange={e => setOrderMode(e.target.value as 'recent' | 'oldest')}
              className="bg-transparent font-sans text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="recent" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                Recent First (Oct → Nov)
              </option>
              <option value="oldest" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                Chronological (Nov → Oct)
              </option>
            </select>
          </div>

          {/* Current Streak (Fire Badge) */}
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-500 shadow-2xs">
            <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>{currentStreak} Days Streak</span>
          </div>

          {/* Longest Streak Box */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 text-xs font-mono font-medium text-[var(--text-secondary)]">
            <span>Longest: {longestStreak}</span>
          </div>
        </div>
      </div>

      {/* 12-Month Calendar Heatmap Grid (Scrollable horizontally) */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-start justify-between gap-3 sm:gap-4 min-w-[760px] select-none py-1">
          {months.map(month => (
            <div key={`${month.year}-${month.monthIndex}`} className="flex flex-col items-center gap-2">
              {/* Month Weeks Grid (7 rows tall) */}
              <div className="flex gap-1 sm:gap-1.25">
                {month.weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1 sm:gap-1.25">
                    {week.map((cell, dayIdx) => {
                      const details = getCellDetails(cell);

                      if (!details.isVisible) {
                        return (
                          <div
                            key={dayIdx}
                            className="w-3 h-3 sm:w-3.5 sm:h-3.5 pointer-events-none"
                          />
                        );
                      }

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
                          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2.5px] transition-all duration-150 flex items-center justify-center relative cursor-pointer ${details.className}`}
                        >
                          {details.hasFlame && (
                            <span className="text-[7.5px] sm:text-[8.5px] leading-none select-none pointer-events-none drop-shadow-xs">
                              🔥
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Month Label (Nov, Dec, Jan, etc.) with current indicator */}
              <div className="flex items-center gap-1">
                <span className={`text-[11px] ${
                  month.isCurrent 
                    ? 'font-bold text-[var(--text-primary)]' 
                    : 'font-medium text-[var(--text-muted)]'
                }`}>
                  {month.name}
                </span>
                {month.isCurrent && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Current Month" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Row (LeetCode-style total count & fire legend) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-[var(--border-subtle)] text-xs">
        {/* Left: Problems / Lessons Completed This Year */}
        <div className="font-semibold text-[var(--text-primary)]">
          <span className="font-bold">{totalLessons}</span> lessons completed this year
        </div>

        {/* Right: Less -> More Intensity Legend (Mode Adaptive!) */}
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] select-none">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {/* Inactive */}
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]" />
            {/* Level 1 */}
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#a7f3d0] dark:bg-[#064e3b] border border-[#6ee7b7] dark:border-[#047857]" />
            {/* Level 2 */}
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#34d399] dark:bg-[#059669] border border-[#10b981]" />
            {/* Level 3 */}
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#059669] dark:bg-[#10b981] border border-[#047857]" />
            {/* Level 4 (Flame) */}
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#059669] dark:bg-[#10b981] border border-amber-400 flex items-center justify-center">
              <span className="text-[6.5px] leading-none">🔥</span>
            </div>
          </div>
          <span>More</span>
        </div>
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
            <p className="text-[11px] text-[var(--text-muted)]">No study sessions recorded</p>
          )}
        </div>
      )}
    </div>
  );
};
