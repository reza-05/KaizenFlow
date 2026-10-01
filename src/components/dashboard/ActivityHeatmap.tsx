'use client';

import React from 'react';
import { DailyActivity } from '@/types';

interface ActivityHeatmapProps {
  activityMap: Record<string, DailyActivity>;
  currentStreak: number;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  activityMap,
  currentStreak,
}) => {
  // Generate the last 112 days (16 weeks x 7 days)
  const days: { date: string; activity?: DailyActivity }[] = [];
  const today = new Date();

  for (let i = 111; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      activity: activityMap[dateStr],
    });
  }

  // Calculate stats
  const totalDaysActive = Object.keys(activityMap).length;
  const totalMinutes = Object.values(activityMap).reduce((acc, curr) => acc + curr.minutesWatched, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const getCellColor = (activity?: DailyActivity) => {
    if (!activity || activity.minutesWatched === 0) {
      return 'bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]';
    }
    if (activity.minutesWatched < 30) {
      return 'bg-[#a7f3d0] dark:bg-[#064e3b] border border-[#6ee7b7] dark:border-[#047857]';
    }
    if (activity.minutesWatched < 60) {
      return 'bg-[#34d399] dark:bg-[#059669] border border-[#10b981]';
    }
    return 'bg-[#059669] dark:bg-[#10b981] border border-[#047857]';
  };

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
            Consistency & Activity Log
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            16-week study momentum. Every green square represents a focused day.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
          <div>
            <span className="text-[var(--text-primary)] font-bold">{totalHours}</span> hrs focused
          </div>
          <div>
            <span className="text-[var(--text-primary)] font-bold">{totalDaysActive}</span> active days
          </div>
          <div>
            <span className="text-[#d97706] font-bold">🔥 {currentStreak}</span> day streak
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-rows-7 grid-flow-col gap-1.5 min-w-[580px]">
          {days.map((item, idx) => {
            const label = `${item.date}: ${item.activity?.minutesWatched || 0} mins studied, ${item.activity?.verifiedCount || 0} lessons verified`;
            return (
              <div
                key={idx}
                title={label}
                className={`h-3 w-3 rounded-xs transition-colors cursor-pointer hover:ring-2 hover:ring-[var(--text-primary)] ${getCellColor(
                  item.activity
                )}`}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 text-[11px] text-[var(--text-muted)]">
        <span>Less</span>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-xs bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]" />
          <div className="h-2.5 w-2.5 rounded-xs bg-[#a7f3d0] dark:bg-[#064e3b]" />
          <div className="h-2.5 w-2.5 rounded-xs bg-[#34d399] dark:bg-[#059669]" />
          <div className="h-2.5 w-2.5 rounded-xs bg-[#059669] dark:bg-[#10b981]" />
        </div>
        <span>More focus</span>
      </div>
    </div>
  );
};
