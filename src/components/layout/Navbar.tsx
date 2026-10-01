'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Award, BookOpen, Sun, Moon, ArrowLeft } from 'lucide-react';
import { UserProfile } from '@/types';

interface NavbarProps {
  userProfile?: UserProfile;
  activeCourseTitle?: string;
  onBackToDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  activeCourseTitle,
  onBackToDashboard,
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme from document class
    if (typeof window !== 'undefined') {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    }
  }, []);

  const toggleTheme = () => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsDark(false);
      localStorage.setItem('kizen_theme', 'light');
    } else {
      root.classList.add('dark');
      setIsDark(true);
      localStorage.setItem('kizen_theme', 'dark');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-sm transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center gap-4">
          {onBackToDashboard ? (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Library</span>
            </button>
          ) : (
            <Link href="/" className="flex items-baseline gap-2.5 group">
              <span className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
                KaizenFlow
              </span>
              <span className="hidden sm:inline-block text-xs font-medium text-[var(--text-secondary)] border-l border-[var(--border-subtle)] pl-2.5">
                Lock In & Learn
              </span>
            </Link>
          )}

          {activeCourseTitle && (
            <div className="hidden md:flex items-center gap-2 border-l border-[var(--border-subtle)] pl-4">
              <span className="max-w-xs truncate text-xs font-semibold text-[var(--text-primary)]">
                {activeCourseTitle}
              </span>
            </div>
          )}
        </div>

        {/* Right Action & Stats Bar */}
        <div className="flex items-center gap-3">
          {/* Daily Streak Counter */}
          <div
            title="Daily Study Streak"
            className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-xs"
          >
            <span className="flame-burn text-xs leading-none select-none">🔥</span>
            <span>{userProfile?.currentStreak || 0}</span>
            <span className="hidden sm:inline text-[var(--text-secondary)] font-normal">Day Streak</span>
          </div>

          {/* XP Badge */}
          <div
            title="Total Earned XP"
            className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-xs"
          >
            <Award className="h-3.5 w-3.5 text-[#059669]" />
            <span>{userProfile?.totalXP || 0}</span>
            <span className="hidden sm:inline text-[var(--text-secondary)] font-normal">XP</span>
          </div>

          {/* Quota Badge */}
          {userProfile && (
            <div
              title="Active Playlist Slots"
              className="hidden lg:flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]"
            >
              <BookOpen className="h-3 w-3" />
              <span>{userProfile.activePlaylistsCount || 0}/10 Courses</span>
            </div>
          )}

          {/* Theme Switcher (No AI Cliché, pure clean icon) */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
