'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Award, BookOpen, Sun, Moon, ArrowLeft, Trophy, LogIn, LogOut, Check, RefreshCw, User } from 'lucide-react';
import { UserProfile } from '@/types';
import { ClashFlame } from '@/components/ui/ClashFlame';
import { IsolationToggle } from '@/components/isolation/IsolationToggle';
import { calculateLevelFromXP } from '@/lib/rewards';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  userProfile?: UserProfile;
  activeCourseTitle?: string;
  onBackToDashboard?: () => void;
  onOpenRewardsHub?: () => void;
  isRewardsPage?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  activeCourseTitle,
  onBackToDashboard,
  onOpenRewardsHub,
  isRewardsPage = false,
}) => {
  const { user, signOut, syncStatus, syncNow, userProfile: authProfile } = useAuth();
  const currentProfile = userProfile || authProfile;

  const [isDark, setIsDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check initial theme from document class
    if (typeof window !== 'undefined') {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    }
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

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

  const levelInfo = calculateLevelFromXP(currentProfile?.totalXP || 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-sm transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {onBackToDashboard ? (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline">Back to Library</span>
              <span className="xs:hidden">Back</span>
            </button>
          ) : isRewardsPage ? (
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] transition-colors shrink-0 border border-[var(--border-subtle)]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Library</span>
            </Link>
          ) : (
            <Link href="/" className="flex items-baseline gap-2 group shrink-0">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
                KaizenFlow
              </span>
              <span className="hidden md:inline-block text-xs font-medium text-[var(--text-secondary)] border-l border-[var(--border-subtle)] pl-2.5">
                Lock In & Learn
              </span>
            </Link>
          )}

          {activeCourseTitle && (
            <div className="hidden md:flex items-center gap-2 border-l border-[var(--border-subtle)] pl-4 min-w-0">
              <span className="max-w-[180px] lg:max-w-xs truncate text-xs font-semibold text-[var(--text-primary)]">
                {activeCourseTitle}
              </span>
            </div>
          )}
        </div>

        {/* Right Action & Stats Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Level & Rank Pill (Links to /rewards page) */}
          <Link
            href="/rewards"
            title={`Scholar Level ${levelInfo.level}: ${levelInfo.title} • View Levels & Badges`}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] hover:bg-[var(--border-subtle)]/70 px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span>Lvl {levelInfo.level}</span>
            <span className="hidden md:inline text-[var(--text-secondary)] font-normal text-[11px] truncate max-w-[130px]">
              • {levelInfo.title}
            </span>
          </Link>

          {/* Daily Streak Counter */}
          <Link
            href="/rewards"
            title="Daily Study Streak • View Badges & Streaks"
            className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] px-2 sm:px-3 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-xs transition-colors cursor-pointer"
          >
            <ClashFlame size={14} />
            <span>{userProfile?.currentStreak || 0}</span>
            <span className="hidden sm:inline text-[var(--text-secondary)] font-normal text-[11px]">Streak</span>
          </Link>

          {/* XP Badge */}
          <Link
            href="/rewards"
            title="Total Earned XP • View Level Progression"
            className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] px-2 sm:px-3 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-xs transition-colors cursor-pointer"
          >
            <Award className="h-3.5 w-3.5 text-[#059669]" />
            <span>{userProfile?.totalXP || 0}</span>
            <span className="hidden sm:inline text-[var(--text-secondary)] font-normal text-[11px]">XP</span>
          </Link>

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

          {/* Isolation Mode Distraction Shield Toggle */}
          <IsolationToggle />

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title={user.email || 'User Account'}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span>
                    {(user.displayName || user.email || 'S')[0].toUpperCase()}
                  </span>
                )}
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* User info */}
                  <div className="pb-2.5 mb-2.5 border-b border-[var(--border-subtle)]">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {user.displayName || 'Scholar'}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">
                      {user.email}
                    </p>

                    {/* Sync Status Badge */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium">
                        {syncStatus === 'syncing' ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
                            <span className="text-amber-500">Syncing...</span>
                          </>
                        ) : syncStatus === 'synced' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500 font-semibold">Cloud Synced</span>
                          </>
                        ) : syncStatus === 'error' ? (
                          <span className="text-rose-500">Sync Error</span>
                        ) : (
                          <span className="text-[var(--text-muted)]">Offline Cache</span>
                        )}
                      </div>

                      <button
                        onClick={syncNow}
                        disabled={syncStatus === 'syncing'}
                        title="Force sync local data with cloud"
                        className="text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer hover:underline disabled:opacity-50"
                      >
                        Sync Now
                      </button>
                    </div>
                  </div>

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer shadow-2xs"
            >
              <LogIn className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden xs:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
