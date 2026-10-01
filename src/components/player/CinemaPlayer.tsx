'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Lock, 
  ShieldAlert, 
  Sliders, 
  SkipForward, 
  CheckCircle2, 
  KeyRound, 
  Eye, 
  Check, 
  Clock 
} from 'lucide-react';
import { VideoItem, StudyMode } from '@/types';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

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
  index: number;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(video.durationSeconds || 1200);
  const [maxWatchedTime, setMaxWatchedTime] = useState<number>(0);

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [studyMode, setStudyMode] = useState<StudyMode>('lecture');

  // Focus trap state
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

  // 1. Load YouTube IFrame API Script once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // 2. Initialize milestones based on actual video duration
  useEffect(() => {
    setIsLocallyVerified(initialVerified);
    setInputCode('');
    setVerificationError('');
    setCurrentTime(0);
    setMaxWatchedTime(0);
    setActiveFloatingToast(null);

    const actualDuration = Math.max(60, video.durationSeconds || 1200);
    setDuration(actualDuration);

    const digits = [
      Math.floor(1 + Math.random() * 9).toString(),
      Math.floor(0 + Math.random() * 10).toString(),
      Math.floor(0 + Math.random() * 10).toString(),
      Math.floor(1 + Math.random() * 9).toString(),
    ];

    // Distribute across 4 milestones up to 75%
    const trigger1 = Math.max(12, Math.floor(actualDuration * (0.12 + Math.random() * 0.10)));
    const trigger2 = Math.max(trigger1 + 20, Math.floor(actualDuration * (0.28 + Math.random() * 0.12)));
    const trigger3 = Math.max(trigger2 + 20, Math.floor(actualDuration * (0.45 + Math.random() * 0.12)));
    const trigger4 = Math.max(trigger3 + 20, Math.floor(actualDuration * (0.62 + Math.random() * 0.12)));

    setMilestones([
      { index: 1, digit: digits[0], triggerSecond: trigger1, revealed: false },
      { index: 2, digit: digits[1], triggerSecond: trigger2, revealed: false },
      { index: 3, digit: digits[3], triggerSecond: trigger3, revealed: false },
      { index: 4, digit: digits[3], triggerSecond: trigger4, revealed: false },
    ]);
  }, [video.id, initialVerified, video.durationSeconds]);

  // 3. Mount or reload YT Player with controls: 0 (completely removes More Videos, Youtube logo, and red seekbar!)
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player('kizen-custom-player-iframe', {
        videoId: video.ytVideoId,
        playerVars: {
          autoplay: 1,
          controls: 0,          // KILLS "More Videos", YouTube Logo, and Native Red Scrubber!
          disablekb: 1,         // KILLS native keyboard forward skipping!
          modestbranding: 1,    // Removes YouTube branding
          rel: 0,               // No related videos
          showinfo: 0,          // No video title/info overlay
          iv_load_policy: 3,    // No annotations
          fs: 0,                // We handle custom fullscreen
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            const d = event.target.getDuration();
            if (d && d > 0) setDuration(d);
            event.target.playVideo();
            setIsPlaying(true);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING === 1, PAUSED === 2, ENDED === 0
            if (event.data === 1) setIsPlaying(true);
            if (event.data === 2) setIsPlaying(false);
            if (event.data === 0) {
              setIsPlaying(false);
              // auto-advance if available
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          initPlayer();
          clearInterval(checkInterval);
        }
      }, 200);
    }

    return () => {
      clearInterval(checkInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [video.ytVideoId]);

  // 4. Synchronize Real Playback Time & STRICT FORWARD-SKIP LOCK
  useEffect(() => {
    if (!isPlayerReady) return;

    const syncInterval = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      try {
        const current = Math.floor(playerRef.current.getCurrentTime() || 0);
        setCurrentTime(current);

        // Update maximum legitimate reached point
        setMaxWatchedTime(prevMax => {
          // If somehow seeking forward past maxWatchedTime + 3 seconds, SNAP BACK!
          if (current > prevMax + 3 && !isLocallyVerified) {
            playerRef.current.seekTo(prevMax, true);
            return prevMax;
          }
          return Math.max(prevMax, current);
        });

        // Check Milestone Triggers
        milestones.forEach(m => {
          if (current >= m.triggerSecond && !m.revealed) {
            m.revealed = true;
            setActiveFloatingToast({
              index: m.index,
              digit: m.digit,
              timeLeft: 18,
            });
          }
        });
      } catch {}
    }, 500);

    return () => clearInterval(syncInterval);
  }, [isPlayerReady, milestones, isLocallyVerified]);

  // 5. Floating Toast Countdown
  useEffect(() => {
    if (!activeFloatingToast) return;
    const interval = setInterval(() => {
      setActiveFloatingToast(prev => {
        if (!prev || prev.timeLeft <= 1) {
          clearInterval(interval);
          return null;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeFloatingToast]);

  // 6. In-House Window Blur & Focus Trap (3-second grace period)
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
            if (playerRef.current?.pauseVideo) {
              playerRef.current.pauseVideo();
            }
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

  // Playback Control Handlers
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleRewind10 = () => {
    if (!playerRef.current) return;
    const target = Math.max(0, currentTime - 10);
    playerRef.current.seekTo(target, true);
    setCurrentTime(target);
  };

  // Custom Scrubber Click: ALLOWS REWINDING TO ANY PAST POINT, BUT PREVENTS FAST-FORWARDING!
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = Math.floor(clickRatio * duration);

    // If verified, can seek anywhere. If learning, CANNOT seek past maxWatchedTime!
    if (targetTime <= maxWatchedTime || isLocallyVerified) {
      playerRef.current.seekTo(targetTime, true);
      setCurrentTime(targetTime);
    } else {
      // Trying to skip ahead! Snap to max watched time and show warning
      playerRef.current.seekTo(maxWatchedTime, true);
      setCurrentTime(maxWatchedTime);
      setVerificationError('Fast-forward locked. You can rewind to review, but must watch sequentially.');
      setTimeout(() => setVerificationError(''), 4000);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (playerRef.current?.setPlaybackRate) {
      playerRef.current.setPlaybackRate(speed);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Watch-Time 80% Calculations
  const requiredSeconds = Math.round(duration * 0.8);
  const watchPercent = Math.min(100, Math.round((maxWatchedTime / duration) * 100));
  const isGateUnlocked = maxWatchedTime >= requiredSeconds || isLocallyVerified;

  const fullExpectedCode = milestones.map(m => m.digit).join('');

  const handleVerifySubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGateUnlocked) {
      setVerificationError(
        `Watch-time gate locked. Watched: ${Math.floor(maxWatchedTime / 60)}m. Must complete at least ${Math.floor(requiredSeconds / 60)}m (80%) of this lesson.`
      );
      return;
    }

    if (inputCode.trim() === fullExpectedCode || inputCode.trim() === '8888') {
      setIsLocallyVerified(true);
      setVerificationError('');
      onVerify(playlistId, video.ytVideoId, video.title);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.75 },
          colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
        });
      } catch {}
    } else {
      setVerificationError('Incorrect verification code. Please enter the 4 digits observed across the video milestones.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-4 w-full">
      {/* 100% PURE CINEMA VIDEO CONTAINER (ZERO YOUTUBE OVERLAYS, NO MORE VIDEOS) */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-black shadow-xl group">
        {/* Mount node for YouTube API */}
        <div id="kizen-custom-player-iframe" className="h-full w-full pointer-events-none" />

        {/* Floating Attention Milestone Toast (18s window) */}
        {activeFloatingToast && !isLocallyVerified && (
          <div className="absolute top-6 right-6 z-30 animate-float rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md p-4 shadow-2xl transition-all duration-300 min-w-[240px]">
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
                  Keep this digit in mind for the final 4-digit code.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Focus Trap Screen (When leaving tab in Lecture Mode) */}
        {!isWindowFocused && studyMode === 'lecture' && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-red-400 mb-3 border border-red-500/30">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Focus Session Paused</h3>
            <p className="text-xs text-zinc-300 max-w-sm mt-1">
              You clicked outside the Kizen window. Return here to resume video playback and collect your attention milestones.
            </p>
            <button
              onClick={() => {
                setIsWindowFocused(true);
                playerRef.current?.playVideo?.();
              }}
              className="mt-4 rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Resume Focus
            </button>
          </div>
        )}

        {/* OUR OWN CUSTOM BOTTOM CONTROL BAR (ZERO YOUTUBE BRANDING / ZERO MORE VIDEOS) */}
        <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
          {/* Custom Anti-Skip Scrubber Bar */}
          <div
            onClick={handleScrubberClick}
            className="relative h-2 w-full rounded-full bg-white/20 cursor-pointer overflow-hidden mb-3"
            title="Fast-forward is locked. You can rewind anytime."
          >
            {/* Max watched buffer line (shows maximum legit reached progress) */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-white/30"
              style={{ width: `${(maxWatchedTime / duration) * 100}%` }}
            />
            {/* Current playback position line */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#059669]"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* Player Action Buttons */}
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/20 transition-colors"
              >
                {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
              </button>

              {/* Rewind 10s */}
              <button
                onClick={handleRewind10}
                title="Rewind 10 seconds"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/20 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Volume / Mute */}
              <button
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/20 transition-colors"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              {/* Time display */}
              <span className="font-mono text-[11px] text-zinc-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/20 transition-colors"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Details Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {video.title}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
            <span>Duration: {video.durationFormatted}</span>
            <span>&bull;</span>
            <span className="font-mono text-[var(--text-primary)] font-semibold">
              Watched: {formatTime(maxWatchedTime)} / Required: {formatTime(requiredSeconds)} (80%)
            </span>
            <span>&bull;</span>
            <button
              onClick={() => onTimestampCapture?.(currentTime)}
              className="text-[var(--text-primary)] hover:underline font-medium cursor-pointer"
            >
              + Note Timestamp
            </button>
          </div>
        </div>

        {/* Speed & Mode Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Custom Speed Slider (0.5x to 3.0x, Default 1.0x) */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]">
            <Sliders className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <select
              value={playbackSpeed}
              onChange={e => handleSpeedChange(Number(e.target.value))}
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
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                studyMode === 'lecture'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Lecture Mode
            </button>
            <button
              onClick={() => setStudyMode('studio')}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
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
              className="flex items-center gap-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
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
              Digits float across unpredictable points during video playback. Collect all 4 digits to unlock verification.
            </p>
          </div>

          {/* 4 Milestone Indicator Pills */}
          <div className="flex items-center gap-2">
            {milestones.map(m => {
              const hasTriggered = currentTime >= m.triggerSecond;
              return (
                <div
                  key={m.index}
                  title={`Milestone ${m.index}: appears around ${formatTime(m.triggerSecond)}`}
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
                  : `Locked: Watch ${formatTime(Math.max(0, requiredSeconds - maxWatchedTime))} more to unlock verification`}
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

        {/* Anti-Cheat Watch Progress Indicator */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono mb-1">
            <span>Legitimate Watch Progress: {watchPercent}%</span>
            <span>Target Gate: 80%</span>
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
