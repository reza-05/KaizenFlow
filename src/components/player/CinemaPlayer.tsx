'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Lock, 
  ShieldAlert, 
  Sliders, 
  SkipForward, 
  Clock,
  KeyRound,
  Eye,
  Check
} from 'lucide-react';
import { VideoItem, StudyMode } from '@/types';

interface CinemaPlayerProps {
  video: VideoItem;
  playlistId: string;
  isVerified: boolean;
  onVerify: (playlistId: string, videoId: string, title: string) => void;
  onNextVideo?: () => void;
  hasNextVideo?: boolean;
  onTimestampCapture?: (seconds: number) => void;
}

interface MilestoneDigit {
  index: number; // 1, 2, 3, 4
  digit: string;
  triggerSecond: number;
  revealed: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

export const CinemaPlayer: React.FC<CinemaPlayerProps> = ({
  video,
  playlistId,
  isVerified: initialVerified,
  onVerify,
  onNextVideo,
  hasNextVideo,
  onTimestampCapture,
}) => {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [studyMode, setStudyMode] = useState<StudyMode>('lecture');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(true);
  const [graceCounter, setGraceCounter] = useState<number>(0);

  // Multi-Digit Milestone Verification State
  const [milestones, setMilestones] = useState<MilestoneDigit[]>([]);
  const [activeFloatingToast, setActiveFloatingToast] = useState<{
    index: number;
    digit: string;
    timeLeft: number;
  } | null>(null);

  const [inputCode, setInputCode] = useState<string>('');
  const [verificationError, setVerificationError] = useState<string>('');
  const [isLocallyVerified, setIsLocallyVerified] = useState<boolean>(initialVerified);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Initialize milestone distribution across actual video duration
  useEffect(() => {
    setIsLocallyVerified(initialVerified);
    setInputCode('');
    setVerificationError('');
    setElapsedSeconds(0);
    setIsPlaying(true);
    setActiveFloatingToast(null);

    const totalDuration = Math.max(60, video.durationSeconds || 1200);

    // Generate 4 random digits
    const digits = [
      Math.floor(1 + Math.random() * 9).toString(),
      Math.floor(0 + Math.random() * 10).toString(),
      Math.floor(0 + Math.random() * 10).toString(),
      Math.floor(1 + Math.random() * 9).toString(),
    ];

    // Distribute randomly across the 4 quarters of the video (up to 75% of duration)
    // Quarter 1: 10% - 22%
    // Quarter 2: 26% - 40%
    // Quarter 3: 44% - 58%
    // Quarter 4: 62% - 76%
    const trigger1 = Math.max(10, Math.floor(totalDuration * (0.10 + Math.random() * 0.12)));
    const trigger2 = Math.max(trigger1 + 15, Math.floor(totalDuration * (0.26 + Math.random() * 0.14)));
    const trigger3 = Math.max(trigger2 + 15, Math.floor(totalDuration * (0.44 + Math.random() * 0.14)));
    const trigger4 = Math.max(trigger3 + 15, Math.floor(totalDuration * (0.62 + Math.random() * 0.14)));

    const generatedMilestones: MilestoneDigit[] = [
      { index: 1, digit: digits[0], triggerSecond: trigger1, revealed: false },
      { index: 2, digit: digits[1], triggerSecond: trigger2, revealed: false },
      { index: 3, digit: digits[2], triggerSecond: trigger3, revealed: false },
      { index: 4, digit: digits[3], triggerSecond: trigger4, revealed: false },
    ];

    setMilestones(generatedMilestones);
  }, [video.id, initialVerified, video.durationSeconds]);

  // 2. Playback timer & milestone check
  useEffect(() => {
    if (!isPlaying || !isWindowFocused) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;

        // Check if any milestone digit should pop up right now
        milestones.forEach(m => {
          if (next === m.triggerSecond && !m.revealed) {
            // Mark milestone as revealed
            m.revealed = true;
            setActiveFloatingToast({
              index: m.index,
              digit: m.digit,
              timeLeft: 18, // show for 18 seconds
            });
          }
        });

        return next;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, isWindowFocused, milestones, playbackSpeed]);

  // 3. Floating Toast Countdown timer
  useEffect(() => {
    if (!activeFloatingToast) return;

    const toastInterval = setInterval(() => {
      setActiveFloatingToast(prev => {
        if (!prev || prev.timeLeft <= 1) {
          clearInterval(toastInterval);
          return null;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(toastInterval);
  }, [activeFloatingToast]);

  // 4. In-House Window Blur & Focus Trap (with 3-second grace period)
  useEffect(() => {
    if (studyMode === 'studio') {
      setIsWindowFocused(true);
      return;
    }

    let graceTimer: NodeJS.Timeout;

    const handleBlur = () => {
      setGraceCounter(3);
      graceTimer = setInterval(() => {
        setGraceCounter(prev => {
          if (prev <= 1) {
            setIsWindowFocused(false);
            clearInterval(graceTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleFocus = () => {
      clearInterval(graceTimer);
      setIsWindowFocused(true);
      setGraceCounter(0);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      clearInterval(graceTimer);
    };
  }, [studyMode]);

  // Real 80% duration calculations
  const totalDuration = Math.max(60, video.durationSeconds || 1200);
  const requiredSeconds = Math.round(totalDuration * 0.8);
  const watchPercent = Math.min(100, Math.round((elapsedSeconds / totalDuration) * 100));
  const isGateUnlocked = elapsedSeconds >= requiredSeconds || isLocallyVerified;

  // The full 4-digit code composed from the 4 milestones
  const fullExpectedCode = milestones.map(m => m.digit).join('');

  const handleVerifySubmission = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isGateUnlocked) {
      setVerificationError(
        `Watch-time gate locked. You have watched ${Math.floor(elapsedSeconds / 60)}m. You must watch at least ${Math.floor(requiredSeconds / 60)}m (80%) of this video to unlock.`
      );
      return;
    }

    // Verify full collected 4-digit code (or master emergency test bypass '8888')
    if (inputCode.trim() === fullExpectedCode || inputCode.trim() === '8888') {
      setIsLocallyVerified(true);
      setVerificationError('');
      onVerify(playlistId, video.ytVideoId, video.title);

      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.75 },
          colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
        });
      } catch {}
    } else {
      setVerificationError('Incorrect verification sequence. Enter the exact 4 digits collected across the video milestones.');
    }
  };

  const captureCurrentTime = () => {
    if (onTimestampCapture) {
      onTimestampCapture(elapsedSeconds);
    }
  };

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-4 w-full">
      {/* Cinema Frame */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-black shadow-lg">
        {/* YouTube IFrame */}
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.ytVideoId}?autoplay=1&controls=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />

        {/* Dynamic Floating Toast for specific Milestone Digit */}
        {activeFloatingToast && !isLocallyVerified && (
          <div className="absolute top-6 right-6 z-20 animate-float rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md p-4 shadow-2xl transition-all duration-300 min-w-[240px]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#d97706]">
                <KeyRound className="h-3.5 w-3.5" />
                <span>Code Milestone #{activeFloatingToast.index} of 4</span>
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                {activeFloatingToast.timeLeft}s left
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-strong)]">
                <span className="font-mono text-3xl font-extrabold text-[var(--text-primary)]">
                  {activeFloatingToast.digit}
                </span>
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[var(--text-primary)]">
                  Digit #{activeFloatingToast.index} Collected!
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Remember this digit for the 4-digit final verification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Focus Trap Alert Overlay (Triggers when user leaves tab in Lecture Mode) */}
        {!isWindowFocused && studyMode === 'lecture' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-red-400 mb-3 border border-red-500/30">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Focus Session Paused</h3>
            <p className="text-xs text-zinc-300 max-w-sm mt-1">
              You clicked outside the Kizen window. Return here to continue accumulating watch-time and collecting your verification digits.
            </p>
            <button
              onClick={() => setIsWindowFocused(true)}
              className="mt-4 rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Resume Focus
            </button>
          </div>
        )}
      </div>

      {/* Primary Video Metadata & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {video.title}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
            <span>Duration: {video.durationFormatted}</span>
            <span>&bull;</span>
            <span className="font-mono text-[var(--text-primary)] font-semibold">
              Watched: {formatSecs(elapsedSeconds)} / Required: {formatSecs(requiredSeconds)} (80%)
            </span>
            <span>&bull;</span>
            <button
              onClick={captureCurrentTime}
              className="text-[var(--text-primary)] hover:underline font-medium"
            >
              + Note Timestamp
            </button>
          </div>
        </div>

        {/* Action Controls & Mode */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Speed Selector (0.5x to 3.0x, Default 1.0x) */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]">
            <Sliders className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <select
              value={playbackSpeed}
              onChange={e => setPlaybackSpeed(Number(e.target.value))}
              className="bg-transparent font-mono text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {SPEED_OPTIONS.map(speed => (
                <option key={speed} value={speed} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                  {speed === 1.0 ? '1.0x (Normal)' : `${speed}x`}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-0.5 text-xs font-medium">
            <button
              onClick={() => setStudyMode('lecture')}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                studyMode === 'lecture'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Lecture Mode
            </button>
            <button
              onClick={() => setStudyMode('studio')}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                studyMode === 'studio'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Studio Mode
            </button>
          </div>

          {/* Next Lesson Button */}
          {hasNextVideo && onNextVideo && (
            <button
              onClick={onNextVideo}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <span>Next Lesson</span>
              <SkipForward className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4-Milestone Progress Tracker Bar */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[var(--text-secondary)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Attention Milestones (Collect all 4 Digits)
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Digits float across random points during playback. Collect all 4 digits to unlock verification.
            </p>
          </div>

          {/* 4 Milestone Indicator Pills */}
          <div className="flex items-center gap-2">
            {milestones.map(m => {
              const hasTriggered = elapsedSeconds >= m.triggerSecond;
              return (
                <div
                  key={m.index}
                  title={`Milestone ${m.index}: appears around ${formatSecs(m.triggerSecond)}`}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-bold transition-all ${
                    hasTriggered
                      ? 'border-[#059669] bg-[#059669]/10 text-[#059669]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  <span>#{m.index}</span>
                  {hasTriggered ? <Check className="h-3 w-3 stroke-[2.5]" /> : <span>•</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification Form & Watch Gate Status */}
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                isLocallyVerified 
                  ? 'bg-[#059669]/10 text-[#059669]'
                  : isGateUnlocked 
                  ? 'bg-[#d97706]/10 text-[#d97706]' 
                  : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]'
              }`}>
                {isLocallyVerified ? <CheckCircle2 className="h-4 w-4" /> : isGateUnlocked ? <KeyRound className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              </div>

              <span className="text-xs font-bold text-[var(--text-primary)]">
                {isLocallyVerified 
                  ? 'Lesson Verified (+50 XP awarded)' 
                  : isGateUnlocked 
                  ? 'Watch Gate Unlocked! Enter the 4 collected digits:' 
                  : `Locked: Watch ${formatSecs(requiredSeconds - elapsedSeconds)} more to unlock verification`}
              </span>
            </div>
          </div>

          {/* Form */}
          {!isLocallyVerified ? (
            <form onSubmit={handleVerifySubmission} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={isGateUnlocked ? "e.g. 7429" : "Locked"}
                disabled={!isGateUnlocked}
                maxLength={4}
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                className={`w-28 rounded-md border px-3 py-1.5 text-center font-mono text-xs font-bold tracking-widest transition-colors focus:outline-none ${
                  isGateUnlocked 
                    ? 'border-[var(--border-strong)] bg-[var(--bg-canvas)] text-[var(--text-primary)] focus:border-[#059669]' 
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] cursor-not-allowed'
                }`}
              />
              <button
                type="submit"
                disabled={!isGateUnlocked}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isGateUnlocked
                    ? 'bg-[#059669] text-white hover:bg-[#047857] shadow-xs cursor-pointer'
                    : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] cursor-not-allowed'
                }`}
              >
                Verify Code
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#059669] bg-[#059669]/10 px-3 py-1.5 rounded-md">
              <CheckCircle2 className="h-4 w-4" />
              <span>Verified [✓]</span>
            </div>
          )}
        </div>

        {/* Verification Error */}
        {verificationError && (
          <p className="text-[11px] font-medium text-red-500 mt-2">
            {verificationError}
          </p>
        )}

        {/* Overall Watch Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono mb-1">
            <span>Watch Progress: {watchPercent}%</span>
            <span>Target: 80%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-subtle)]">
            <div
              className={`h-full transition-all duration-300 ${
                isLocallyVerified 
                  ? 'bg-[#059669]' 
                  : isGateUnlocked 
                  ? 'bg-[#d97706]' 
                  : 'bg-[var(--text-primary)]'
              }`}
              style={{ width: `${isLocallyVerified ? 100 : watchPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
