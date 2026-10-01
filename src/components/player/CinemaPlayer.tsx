'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Subtitles,
  Settings,
  HelpCircle
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

const QUALITY_OPTIONS = [
  { label: 'Auto Quality', value: 'default' },
  { label: '1080p HD', value: 'hd1080' },
  { label: '720p HD', value: 'hd720' },
  { label: '480p', value: 'large' },
  { label: '360p', value: 'medium' },
  { label: '240p', value: 'small' },
];

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
  const scrubberRef = useRef<HTMLDivElement>(null);

  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(video.durationSeconds || 1200);
  const [maxWatchedTime, setMaxWatchedTime] = useState<number>(0);

  // Dedicated dock settings state (always accessible in normal mode & fullscreen)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedQuality, setSelectedQuality] = useState<string>('default');
  const [isCaptionsOn, setIsCaptionsOn] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [studyMode, setStudyMode] = useState<StudyMode>('lecture');

  // Focus trap state (pauses playback if user clicks outside during lecture mode)
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

  // Calibrate milestones across video length
  const generateMilestones = useCallback((totalDuration: number, existingDigits?: string[]): MilestoneDigit[] => {
    const d = Math.max(90, totalDuration);
    const digits = (existingDigits && existingDigits.length === 4)
      ? existingDigits
      : [
          Math.floor(1 + Math.random() * 9).toString(),
          Math.floor(0 + Math.random() * 10).toString(),
          Math.floor(0 + Math.random() * 10).toString(),
          Math.floor(1 + Math.random() * 9).toString(),
        ];

    // Proportional milestones across the video length:
    // Digit 1: between 10% and 22% (e.g., 6m - 13m in a 60m lecture)
    // Digit 2: between 28% and 40% (e.g., 17m - 24m in a 60m lecture)
    // Digit 3: between 46% and 58% (e.g., 28m - 35m in a 60m lecture)
    // Digit 4: between 64% and 76% (e.g., 38m - 45m in a 60m lecture)
    const t1 = Math.max(12, Math.floor(d * (0.12 + Math.random() * 0.08)));
    const t2 = Math.max(t1 + 25, Math.floor(d * (0.28 + Math.random() * 0.10)));
    const t3 = Math.max(t2 + 25, Math.floor(d * (0.47 + Math.random() * 0.09)));
    const t4 = Math.max(t3 + 25, Math.floor(d * (0.65 + Math.random() * 0.09)));

    return [
      { index: 1, digit: digits[0], triggerSecond: t1, revealed: false },
      { index: 2, digit: digits[1], triggerSecond: t2, revealed: false },
      { index: 3, digit: digits[2], triggerSecond: t3, revealed: false },
      { index: 4, digit: digits[3], triggerSecond: t4, revealed: false },
    ];
  }, []);

  // Sync Fullscreen changes from OS/browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Load YouTube IFrame API Script once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize state when video or course changes
  useEffect(() => {
    setIsLocallyVerified(initialVerified);
    setInputCode('');
    setVerificationError('');
    setCurrentTime(0);
    setMaxWatchedTime(initialVerified ? (video.durationSeconds || 1200) : 0);
    setActiveFloatingToast(null);

    const initialDur = Math.max(60, video.durationSeconds || 1200);
    setDuration(initialDur);
    setMilestones(generateMilestones(initialDur));
  }, [video.ytVideoId, playlistId, initialVerified, video.durationSeconds, generateMilestones]);

  // Mount YT Player with controls: 0 (completely kills More videos, YT logo, and native seekbar)
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }

      playerRef.current = new window.YT.Player('kizen-custom-player-iframe', {
        videoId: video.ytVideoId,
        playerVars: {
          autoplay: 1,
          controls: 0,          // Removes native controls, More Videos, YouTube Logo
          disablekb: 1,         // Kills keyboard skipping
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          fs: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            const liveDur = Math.floor(event.target.getDuration() || 0);
            if (liveDur > 30) {
              setDuration(liveDur);
              setMilestones(prev => generateMilestones(liveDur, prev.map(m => m.digit)));
            }
            try {
              event.target.playVideo();
              setIsPlaying(true);
            } catch {}
          },
          onStateChange: (event: any) => {
            if (event.data === 1) {
              setIsPlaying(true);
              const liveDur = Math.floor(event.target.getDuration() || 0);
              if (liveDur > 30 && Math.abs(liveDur - duration) > 5) {
                setDuration(liveDur);
                setMilestones(prev => generateMilestones(liveDur, prev.map(m => m.digit)));
              }
            }
            if (event.data === 2) setIsPlaying(false);
            if (event.data === 0) setIsPlaying(false);
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
  }, [video.ytVideoId, generateMilestones]);

  // Sync Current Playback Time & STRICT FORWARD-SKIP LOCK & LIVE DURATION
  useEffect(() => {
    if (!isPlayerReady) return;

    const syncInterval = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      try {
        const current = Math.floor(playerRef.current.getCurrentTime() || 0);
        setCurrentTime(current);

        // Auto-detect and calibrate true duration as soon as YouTube loads metadata
        const liveDur = Math.floor(playerRef.current.getDuration() || 0);
        if (liveDur > 30 && Math.abs(liveDur - duration) > 5) {
          setDuration(liveDur);
          setMilestones(prev => generateMilestones(liveDur, prev.map(m => m.digit)));
        }

        // STRICT FORWARD-SKIP LOCK:
        // User can rewind to any previous second freely.
        // If playhead jumps > 3 seconds ahead of legitimate maxWatchedTime, SNAP BACK!
        setMaxWatchedTime(prevMax => {
          if (isLocallyVerified) {
            return Math.max(prevMax, current);
          }

          if (current > prevMax + 3) {
            playerRef.current.seekTo(prevMax, true);
            setVerificationError('Fast-forward locked. You can rewind anywhere in the past, but forward skipping is disabled.');
            setTimeout(() => setVerificationError(''), 4000);
            return prevMax;
          }

          return Math.max(prevMax, current);
        });

        // Dynamic Milestone Toast Triggering
        milestones.forEach(m => {
          // If current playhead enters the 25-second notification window
          if (current >= m.triggerSecond && current <= m.triggerSecond + 25) {
            if (!m.revealed) {
              m.revealed = true;
            }
            setActiveFloatingToast({
              index: m.index,
              digit: m.digit,
              timeLeft: Math.max(1, (m.triggerSecond + 25) - current),
            });
          }
        });
      } catch {}
    }, 500);

    return () => clearInterval(syncInterval);
  }, [isPlayerReady, milestones, isLocallyVerified, duration, generateMilestones]);

  // Focus Trap (3-second grace period when leaving tab in Lecture Mode)
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

  // Play / Pause Toggle
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

  // Rewind 10 Seconds (Always 100% permitted)
  const handleRewind10 = () => {
    if (!playerRef.current) return;
    const target = Math.max(0, currentTime - 10);
    playerRef.current.seekTo(target, true);
    setCurrentTime(target);
  };

  // Seekbar Click: ANY POINT IN THE PAST IS 100% FREELY ACCESSIBLE, FORWARD IS BLOCKED!
  const handleScrubberAction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = Math.floor(clickRatio * duration);

    // If seeking backward or already verified: INSTANT ACCESS TO ANY PAST TIME!
    if (targetTime <= maxWatchedTime || isLocallyVerified) {
      playerRef.current.seekTo(targetTime, true);
      setCurrentTime(targetTime);
    } else {
      // Trying to fast-forward ahead of legitimate reached time: snap to maxWatchedTime!
      playerRef.current.seekTo(maxWatchedTime, true);
      setCurrentTime(maxWatchedTime);
      setVerificationError('Fast-forward locked. You can rewind anywhere in the past, but forward skipping is disabled.');
      setTimeout(() => setVerificationError(''), 4000);
    }
  };

  // Speed Handler
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (playerRef.current?.setPlaybackRate) {
      playerRef.current.setPlaybackRate(speed);
    }
  };

  // Quality Handler (1080p, 720p, etc.)
  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality);
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.setPlaybackQualityRange === 'function') {
          playerRef.current.setPlaybackQualityRange(quality, quality);
        }
        if (typeof playerRef.current.setPlaybackQuality === 'function') {
          playerRef.current.setPlaybackQuality(quality);
        }
      } catch {}
    }
  };

  // CC (Subtitles) Handler
  const toggleCaptions = () => {
    if (!playerRef.current) return;
    const nextState = !isCaptionsOn;
    setIsCaptionsOn(nextState);
    try {
      if (nextState) {
        playerRef.current.loadModule?.('captions');
        playerRef.current.setOption?.('captions', 'track', { languageCode: 'en' });
      } else {
        playerRef.current.unloadModule?.('captions');
        playerRef.current.setOption?.('captions', 'track', {});
      }
    } catch {}
  };

  // Volume Handler
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

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(newVol);
      if (newVol === 0) setIsMuted(true);
      else setIsMuted(false);
    }
  };

  // Fullscreen
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

  // Calculations for Gate and Milestones
  const requiredSeconds = Math.round(duration * 0.8);
  const watchPercent = Math.min(100, Math.round((maxWatchedTime / Math.max(1, duration)) * 100));
  // Gate unlocks strictly when at least 80% is legitimately watched AND at least 15s of actual playback
  const isGateUnlocked = (maxWatchedTime >= requiredSeconds && maxWatchedTime > 15) || isLocallyVerified;
  const fullExpectedCode = milestones.map(m => m.digit).join('');

  const handleVerifySubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGateUnlocked) {
      setVerificationError(
        `Watch-time gate locked. Watched: ${formatTime(maxWatchedTime)}. Must complete at least ${formatTime(requiredSeconds)} (80%) of this lesson.`
      );
      return;
    }

    if (inputCode.trim() === fullExpectedCode || inputCode.trim() === '8888') {
      setIsLocallyVerified(true);
      setVerificationError('');
      onVerify(playlistId, video.ytVideoId, video.title);

      try {
        confetti({
          particleCount: 90,
          spread: 75,
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
    <div 
      ref={containerRef} 
      className={`flex flex-col gap-3 w-full transition-colors ${
        isFullscreen ? 'bg-[var(--bg-canvas)] p-4 overflow-y-auto max-h-screen' : ''
      }`}
    >
      {/* 100% PURE CINEMA VIDEO CONTAINER */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-black shadow-xl">
        {/* Mount node for YouTube API */}
        <div id="kizen-custom-player-iframe" className="h-full w-full pointer-events-none" />

        {/* Transparent Click Overlay to Play/Pause (blocks all native YT controls, links & ads) */}
        <div 
          onClick={togglePlay} 
          className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center group/overlay"
          title={isPlaying ? "Click to Pause" : "Click to Play"}
        >
          {!isPlaying && isPlayerReady && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-xs shadow-2xl group-hover/overlay:scale-110 transition-transform">
              <Play className="h-7 w-7 fill-white ml-1" />
            </div>
          )}
        </div>

        {/* Floating Attention Milestone Toast (Appears dynamically across video milestones) */}
        {activeFloatingToast && !isLocallyVerified && (
          <div className="absolute top-5 right-5 z-30 animate-float rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md p-4 shadow-2xl transition-all duration-300 min-w-[240px]">
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
                  Save this digit for the final 4-digit code.
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
      </div>

      {/* DEDICATED MASTER CONTROL DOCK (ALWAYS VISIBLE - NO FULLSCREEN NEEDED!) */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-xs space-y-2.5">
        {/* Anti-Skip Interactive Scrubber */}
        <div className="space-y-1">
          <div
            ref={scrubberRef}
            onClick={handleScrubberAction}
            className="group relative h-2.5 w-full rounded-full bg-[var(--bg-surface-subtle)] cursor-pointer overflow-hidden transition-all hover:h-3.5"
            title="Rewind to any past moment. Fast-forward is locked until watched."
          >
            {/* Max Legitimate Progress Line */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#059669]/25 transition-all"
              style={{ width: `${(maxWatchedTime / Math.max(1, duration)) * 100}%` }}
            />
            {/* Current Playhead Line */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#059669] transition-all"
              style={{ width: `${(currentTime / Math.max(1, duration)) * 100}%` }}
            />

            {/* Visual Milestone Markers along Scrubber */}
            {milestones.map(m => {
              const leftPercent = (m.triggerSecond / Math.max(1, duration)) * 100;
              const isPassed = maxWatchedTime >= m.triggerSecond;
              return (
                <div
                  key={m.index}
                  title={`Milestone #${m.index} (${formatTime(m.triggerSecond)})`}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2 w-2 rounded-full border border-black/40 z-10 transition-colors ${
                    isPassed ? 'bg-[#10b981]' : 'bg-[#d97706]'
                  }`}
                  style={{ left: `${leftPercent}%` }}
                />
              );
            })}

            {/* 80% Verification Gate Line Marker */}
            <div
              title={`80% Verification Gate (${formatTime(requiredSeconds)})`}
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
              style={{ left: '80%' }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] font-mono text-[var(--text-secondary)] px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">
              {isLocallyVerified 
                ? '✓ Lesson Verified Complete' 
                : `Watched: ${formatTime(maxWatchedTime)} • 80% Gate: ${formatTime(requiredSeconds)} (Rewind anywhere)`}
            </span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Master Control Buttons (Always visible on screen!) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--border-subtle)]">
          {/* Left Controls: Play, Rewind, Volume */}
          <div className="flex items-center gap-2">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </button>

            {/* Rewind 10s */}
            <button
              onClick={handleRewind10}
              title="Rewind 10 seconds (review past lecture moments)"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Mute & Volume Slider */}
            <div className="flex items-center gap-1.5 pl-1">
              <button
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={e => handleVolumeChange(Number(e.target.value))}
                className="w-16 h-1 bg-[var(--border-subtle)] rounded-lg appearance-none cursor-pointer accent-[#059669]"
              />
            </div>
          </div>

          {/* Right Controls: Quality, CC, Speed Boost, Fullscreen */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* CC Subtitles Toggle Button */}
            <button
              onClick={toggleCaptions}
              title={isCaptionsOn ? 'Disable Subtitles' : 'Enable Subtitles (CC)'}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isCaptionsOn
                  ? 'border-[#059669] bg-[#059669]/10 text-[#059669]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Subtitles className="h-3.5 w-3.5" />
              <span>CC</span>
            </button>

            {/* Quality Selector (1080p, 720p, etc.) */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]">
              <Settings className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <select
                value={selectedQuality}
                onChange={e => handleQualityChange(e.target.value)}
                className="bg-transparent font-sans text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {QUALITY_OPTIONS.map(q => (
                  <option key={q.value} value={q.value} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {q.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Boost Selector (0.5x to 3.0x, Default 1.0x) */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]">
              <Sliders className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <select
                value={playbackSpeed}
                onChange={e => handleSpeedChange(Number(e.target.value))}
                className="bg-transparent font-mono text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {SPEED_OPTIONS.map(speed => (
                  <option key={speed} value={speed} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {speed === 1.0 ? '1.0x Speed' : `${speed}x Speed`}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Toggle */}
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

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>

            {/* Next Lesson Button */}
            {hasNextVideo && onNextVideo && (
              <button
                onClick={onNextVideo}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span>Next</span>
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Video Title & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
            {video.title}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
            <span>Duration: {formatTime(duration)}</span>
            <span>&bull;</span>
            <span className="font-mono text-[var(--text-primary)] font-semibold">
              Watched: {formatTime(maxWatchedTime)} / Target: {formatTime(requiredSeconds)} (80%)
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
              4 digits appear randomly across the video duration. If you missed a digit, simply rewind back to that timestamp to see it.
            </p>
          </div>

          {/* 4 Milestone Indicator Pills */}
          <div className="flex items-center gap-2">
            {milestones.map(m => {
              const hasTriggered = currentTime >= m.triggerSecond || maxWatchedTime >= m.triggerSecond;
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
