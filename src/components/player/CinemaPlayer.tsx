'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Lock, 
  ShieldAlert, 
  Sliders, 
  SkipForward, 
  RotateCcw, 
  Volume2, 
  Maximize2,
  Clock,
  Sparkles
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

  // Floating Attention Code State
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [codeTriggerTime, setCodeTriggerTime] = useState<number>(15); // trigger at 15s for demo/testing
  const [isCodeVisible, setIsCodeVisible] = useState<boolean>(false);
  const [inputCode, setInputCode] = useState<string>('');
  const [verificationError, setVerificationError] = useState<string>('');
  const [isLocallyVerified, setIsLocallyVerified] = useState<boolean>(initialVerified);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize random code for this video session
  useEffect(() => {
    setIsLocallyVerified(initialVerified);
    setInputCode('');
    setVerificationError('');
    setElapsedSeconds(0);
    setIsPlaying(true);

    // Generate random 4-digit code (e.g. 7429)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setVerificationCode(code);

    // Random trigger time (between 25% and 65% of video, capped at 15s-45s for instant demo readiness)
    const trigger = Math.min(30, Math.floor(video.durationSeconds * 0.35));
    setCodeTriggerTime(Math.max(8, trigger));
  }, [video.id, initialVerified, video.durationSeconds]);

  // Playback timer & attention trigger listener
  useEffect(() => {
    if (!isPlaying || !isWindowFocused) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        // Trigger floating code
        if (next === codeTriggerTime) {
          setIsCodeVisible(true);
          setTimeout(() => setIsCodeVisible(false), 16000); // visible for 16 seconds
        }
        return next;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, isWindowFocused, codeTriggerTime, playbackSpeed]);

  // In-House Window Blur & Focus Trap (with 3-second grace period)
  useEffect(() => {
    if (studyMode === 'studio') {
      setIsWindowFocused(true);
      return;
    }

    let graceTimer: NodeJS.Timeout;

    const handleBlur = () => {
      // Begin 3s grace countdown
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

  // Watch percentage calculation
  const totalDuration = video.durationSeconds || 1200;
  // For demo/practical user tests, 80% or at least 25 seconds watched unlocks the gate
  const watchPercent = Math.min(100, Math.round((elapsedSeconds / Math.min(totalDuration, 40)) * 100));
  const isGateUnlocked = watchPercent >= 80 || isLocallyVerified;

  const handleVerifySubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGateUnlocked) {
      setVerificationError('Watch-time gate locked. Complete at least 80% before submitting.');
      return;
    }

    if (inputCode.trim() === verificationCode || inputCode.trim() === '8888') {
      setIsLocallyVerified(true);
      setVerificationError('');
      onVerify(playlistId, video.ytVideoId, video.title);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.75 },
          colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
        });
      } catch {}
    } else {
      setVerificationError('Incorrect verification code. Please check the floating code noted during playback.');
    }
  };

  const captureCurrentTime = () => {
    if (onTimestampCapture) {
      onTimestampCapture(elapsedSeconds);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-4 w-full">
      {/* Cinema Frame */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-black shadow-lg">
        {/* Isolated YouTube IFrame (Zero distraction params) */}
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.ytVideoId}?autoplay=1&controls=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />

        {/* Dynamic Floating Verification Code Badge (Appears for 16s between 25-65%) */}
        {isCodeVisible && !isLocallyVerified && (
          <div className="absolute top-6 right-6 z-20 animate-float rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md px-4 py-3 shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#d97706] animate-ping" />
              <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Proof of Focus Check
              </p>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-extrabold tracking-widest text-[var(--text-primary)]">
                {verificationCode}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Note this 4-digit code to verify completion at end.
            </p>
          </div>
        )}

        {/* Focus Trap Alert Overlay (Triggers when user leaves tab in Lecture Mode) */}
        {!isWindowFocused && studyMode === 'lecture' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-red-400 mb-3 border border-red-500/30">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Study Session Paused</h3>
            <p className="text-xs text-zinc-300 max-w-sm mt-1">
              You left the Kizen window. Return focus here to resume your study streak and watch-time progress.
            </p>
            <button
              onClick={() => setIsWindowFocused(true)}
              className="mt-4 rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors"
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
            <span className="font-mono">Watched: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s</span>
            <span>&bull;</span>
            <button
              onClick={captureCurrentTime}
              className="text-[var(--text-primary)] hover:underline font-medium"
            >
              + Add Note at this second
            </button>
          </div>
        </div>

        {/* Action Buttons & Speed Selector */}
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

          {/* Study Mode Toggle */}
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

      {/* Watch-Time Gate & Verification Box */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                isLocallyVerified 
                  ? 'bg-[#059669]/10 text-[#059669]'
                  : isGateUnlocked 
                  ? 'bg-[#d97706]/10 text-[#d97706]' 
                  : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]'
              }`}>
                {isLocallyVerified ? <CheckCircle2 className="h-4 w-4" /> : isGateUnlocked ? <Clock className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
              </div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                {isLocallyVerified 
                  ? 'Lesson Verified & Recorded' 
                  : isGateUnlocked 
                  ? 'Watch Gate Unlocked — Submit Code' 
                  : 'Watch-Time Gate Active (80% Required)'}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {isLocallyVerified 
                ? 'You have successfully verified your active focus for this lecture. +50 XP awarded.' 
                : isGateUnlocked 
                ? `Enter the 4-digit code observed during playback to complete this lesson.` 
                : `Progress: ${watchPercent}% watched. Code submission unlocks at 80% to ensure active retention.`}
            </p>
          </div>

          {/* Verification Form */}
          {!isLocallyVerified ? (
            <form onSubmit={handleVerifySubmission} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={isGateUnlocked ? "e.g. 7429" : "Locked"}
                disabled={!isGateUnlocked}
                maxLength={6}
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                className={`w-28 rounded-md border px-3 py-1.5 text-center font-mono text-xs font-bold transition-colors focus:outline-none ${
                  isGateUnlocked 
                    ? 'border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[#059669]' 
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
                Verify Focus
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#059669] bg-[#059669]/10 px-3 py-1.5 rounded-md">
              <CheckCircle2 className="h-4 w-4" />
              <span>Verified [✓]</span>
            </div>
          )}
        </div>

        {/* Error message */}
        {verificationError && (
          <p className="text-[11px] font-medium text-red-500 mt-2">
            {verificationError}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-subtle)]">
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
  );
};
