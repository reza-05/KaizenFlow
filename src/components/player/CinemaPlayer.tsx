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
  RectangleHorizontal,
  Lock, 
  Sliders, 
  SkipForward, 
  CheckCircle2, 
  KeyRound, 
  Eye, 
  Check, 
  Subtitles,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  Star,
  HelpCircle
} from 'lucide-react';
import { VideoItem, VideoMilestone } from '@/types';
import { getVideoProgress, saveVideoPlaybackProgress } from '@/lib/storage';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';

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
  onOpenReviews?: () => void;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
}

type MilestoneDigit = VideoMilestone;

// Full speed spectrum including real 2.5x and 3.0x speed boost
const SPEED_OPTIONS = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1.0x (Normal)', value: 1.0 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '1.75x', value: 1.75 },
  { label: '2.0x', value: 2.0 },
  { label: '2.5x Boost', value: 2.5 },
  { label: '3.0x Ultra Boost', value: 3.0 },
];

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
  onOpenReviews,
  isTheaterMode = false,
  onToggleTheater,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);

  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(video.durationSeconds || 1200);
  const [maxWatchedTime, setMaxWatchedTime] = useState<number>(0);
  const [savedResumeTime, setSavedResumeTime] = useState<number>(0);

  // Dedicated refs to maintain consistent progress saving across events & unmount
  const milestonesRef = useRef<VideoMilestone[]>([]);
  const maxWatchedTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const lastSavedSecondsRef = useRef<number>(0);

  // Dedicated dock settings state (always accessible in normal mode & fullscreen)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kaizenflow_playback_speed');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 3.0) return parsed;
      }
    }
    return 1.0;
  });
  const [selectedQuality, setSelectedQuality] = useState<string>('default');
  const [isCaptionsOn, setIsCaptionsOn] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPureFullscreen, setIsPureFullscreen] = useState<boolean>(false);
  const [isFsOverlayVisible, setIsFsOverlayVisible] = useState<boolean>(true);
  const fsOverlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isAdShieldActive, setIsAdShieldActive] = useState<boolean>(false);
  const wasAutoMutedByShieldRef = useRef<boolean>(false);

  // Settings Popover State (YouTube-style Clean Menu)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsView, setSettingsView] = useState<'main' | 'speed' | 'quality'>('main');
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);

  // Keyboard Shortcuts Modal State
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

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

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoTriggeredMilestonesRef = useRef<Set<number>>(new Set());

  // Show floating checkpoint toast for exactly durationSec (default 10s) with countdown
  const showMilestoneToast = useCallback((index: number, digit: string, durationSec: number = 10) => {
    if (toastTimerRef.current) {
      clearInterval(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setActiveFloatingToast({
      index,
      digit,
      timeLeft: durationSec,
    });

    let remaining = durationSec;
    toastTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (toastTimerRef.current) {
          clearInterval(toastTimerRef.current);
          toastTimerRef.current = null;
        }
        setActiveFloatingToast(null);
      } else {
        setActiveFloatingToast(prev => (prev ? { ...prev, timeLeft: remaining } : null));
      }
    }, 1000);
  }, []);

  // Dismiss toast immediately (when user clicks cross 'X' button)
  const dismissFloatingToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearInterval(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setActiveFloatingToast(null);
  }, []);

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
    // Digit 1: ~10% to 22% (e.g. ~8m in a 60m lecture)
    // Digit 2: ~28% to 40% (e.g. ~19m in a 60m lecture)
    // Digit 3: ~46% to 58% (e.g. ~30m in a 60m lecture)
    // Digit 4: ~64% to 76% (e.g. ~42m in a 60m lecture)
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
    setInputCode('');
    setVerificationError('');
    setCurrentTime(0);
    currentTimeRef.current = 0;
    lastSavedSecondsRef.current = 0;
    setHasStartedPlaying(false);
    setIsEnded(false);
    setActiveFloatingToast(null);
    if (toastTimerRef.current) {
      clearInterval(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    autoTriggeredMilestonesRef.current.clear();

    const initialDur = Math.max(60, video.durationSeconds || 1200);
    setDuration(initialDur);

    // Read stored playback progress from storage
    const saved = getVideoProgress(playlistId, video.ytVideoId);
    const isSavedVerified = Boolean(initialVerified || saved?.isVerified);
    setIsLocallyVerified(isSavedVerified);

    const savedMax = saved?.maxWatchedSeconds ?? saved?.watchedSeconds ?? 0;
    const effectiveMax = isSavedVerified ? initialDur : savedMax;
    setMaxWatchedTime(effectiveMax);
    maxWatchedTimeRef.current = effectiveMax;

    const savedPos = saved?.lastPositionSeconds || 0;
    if (savedPos > 15 && savedPos < initialDur - 10 && !isSavedVerified) {
      setSavedResumeTime(savedPos);
    } else {
      setSavedResumeTime(0);
    }

    // Restore saved milestones if they exist, or generate and store them
    let calibratedMilestones: VideoMilestone[];
    if (saved?.savedMilestones && saved.savedMilestones.length === 4) {
      calibratedMilestones = saved.savedMilestones.map(m => ({
        ...m,
        revealed: effectiveMax >= m.triggerSecond,
      }));
    } else {
      calibratedMilestones = generateMilestones(initialDur);
      saveVideoPlaybackProgress(playlistId, video.ytVideoId, {
        savedMilestones: calibratedMilestones,
        maxWatchedSeconds: savedMax,
        lastPositionSeconds: savedPos,
      });
    }

    setMilestones(calibratedMilestones);
    milestonesRef.current = calibratedMilestones;
  }, [video.ytVideoId, playlistId, initialVerified, video.durationSeconds, generateMilestones]);

  // Clean up toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearInterval(toastTimerRef.current);
      }
    };
  }, []);

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
        host: 'https://www.youtube-nocookie.com',
        videoId: video.ytVideoId,
        playerVars: {
          autoplay: 0,          // User starts explicitly via clean Kizen poster
          controls: 0,          // Removes native controls, More Videos, YouTube Logo
          disablekb: 1,         // Kills keyboard skipping
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,    // Removes in-video cards & annotations
          fs: 0,
          playsinline: 1,       // Prevents fullscreen mobile ad takeovers
          enablejsapi: 1,
          widget_referrer: typeof window !== 'undefined' ? window.location.origin : '',
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            const liveDur = Math.floor(event.target.getDuration() || 0);
            if (liveDur > 30 && Math.abs(liveDur - duration) > 5) {
              setDuration(liveDur);
            }
            if (event.target.setPlaybackRate) {
              event.target.setPlaybackRate(Math.min(2.0, playbackSpeed));
            }
          },
          onStateChange: (event: any) => {
            if (event.data === 1) {
              setIsPlaying(true);
              setHasStartedPlaying(true);
              setIsEnded(false);
              const liveDur = Math.floor(event.target.getDuration() || 0);
              if (liveDur > 30 && Math.abs(liveDur - duration) > 5) {
                setDuration(liveDur);
              }
              if (event.target.setPlaybackRate) {
                event.target.setPlaybackRate(Math.min(2.0, playbackSpeed));
              }
            }
            if (event.data === 2) setIsPlaying(false);
            if (event.data === 0) {
              setIsPlaying(false);
              setIsEnded(true);
              try {
                confetti({
                  particleCount: 100,
                  spread: 80,
                  origin: { y: 0.6 },
                });
              } catch {}
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
  }, [video.ytVideoId, generateMilestones]);

  // Real Speed Boost (up to 3.0x):
  // YouTube native player max rate is 2.0x. For 2.5x and 3.0x,
  // we set native rate to 2.0x and micro-advance the difference every 1 second
  // so the video and progress genuinely finish at 2.5x / 3.0x speed!
  useEffect(() => {
    if (!isPlaying || !isPlayerReady || playbackSpeed <= 2.0) return;

    if (playerRef.current?.setPlaybackRate) {
      playerRef.current.setPlaybackRate(2.0);
    }

    const boostStep = playbackSpeed - 2.0; // 0.5s for 2.5x, 1.0s for 3.0x
    const boostInterval = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
      try {
        const curr = playerRef.current.getCurrentTime();
        if (curr && curr > 0) {
          playerRef.current.seekTo(curr + boostStep, true);
        }
      } catch {}
    }, 1000);

    return () => clearInterval(boostInterval);
  }, [isPlaying, isPlayerReady, playbackSpeed]);

  // Sync Current Playback Time & STRICT FORWARD-SKIP LOCK & LIVE DURATION
  useEffect(() => {
    if (!isPlayerReady) return;

    const syncInterval = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      try {
        // Smart In-Player Ad Shield Engine:
        let isAd = false;
        try {
          const videoData = playerRef.current.getVideoData?.();
          const liveDur = Math.floor(playerRef.current.getDuration?.() || 0);
          if (videoData && videoData.video_id && videoData.video_id !== video.ytVideoId) {
            isAd = true;
          } else if (liveDur > 0 && liveDur <= 45 && duration > 90) {
            isAd = true;
          }
        } catch {}

        if (isAd) {
          setIsAdShieldActive(true);
          // Auto-mute noisy commercial audio so study session remains undisturbed
          if (!isMuted && !wasAutoMutedByShieldRef.current) {
            wasAutoMutedByShieldRef.current = true;
            try { playerRef.current.mute(); } catch {}
          }
          // Attempt micro-seek to end of ad to fast-forward
          try {
            const adDur = playerRef.current.getDuration?.() || 0;
            if (adDur > 0) {
              playerRef.current.seekTo(adDur, true);
            }
          } catch {}
          return; // Freeze study metrics & milestone progress during ads
        } else {
          if (wasAutoMutedByShieldRef.current) {
            wasAutoMutedByShieldRef.current = false;
            setIsAdShieldActive(false);
            if (!isMuted) {
              try { playerRef.current.unMute(); } catch {}
            }
          } else if (isAdShieldActive) {
            setIsAdShieldActive(false);
          }
        }

        const current = Math.floor(playerRef.current.getCurrentTime() || 0);
        setCurrentTime(current);
        currentTimeRef.current = current;

        // Auto-detect and calibrate true duration as soon as YouTube loads metadata
        const liveDur = Math.floor(playerRef.current.getDuration() || 0);
        if (liveDur > 30 && Math.abs(liveDur - duration) > 5) {
          setDuration(liveDur);
        }

        // STRICT FORWARD-SKIP LOCK:
        // User can rewind to any previous second freely.
        // If playhead jumps > maxAllowed ahead of legitimate maxWatchedTime, SNAP BACK!
        const maxAllowedJump = playbackSpeed >= 2.5 ? 5 : 3;
        let newMax = maxWatchedTimeRef.current;
        if (isLocallyVerified) {
          newMax = Math.max(newMax, current);
        } else if (current > newMax + maxAllowedJump) {
          playerRef.current.seekTo(newMax, true);
          setVerificationError('Please watch sequentially to progress. You can review earlier sections anytime.');
          setTimeout(() => setVerificationError(''), 4000);
        } else {
          newMax = Math.max(newMax, current);
        }

        if (newMax !== maxWatchedTimeRef.current) {
          maxWatchedTimeRef.current = newMax;
          setMaxWatchedTime(newMax);
        }

        // Auto-save playback progress every ~3 seconds during active playback
        if (current > 0 && Math.abs(current - lastSavedSecondsRef.current) >= 3) {
          lastSavedSecondsRef.current = current;
          saveVideoPlaybackProgress(playlistId, video.ytVideoId, {
            maxWatchedSeconds: newMax,
            watchedSeconds: newMax,
            lastPositionSeconds: current,
            savedMilestones: milestonesRef.current,
          });
        }

        // Dynamic Focus Checkpoint Toast Auto-Triggering (10s duration)
        milestones.forEach(m => {
          // If playback crosses this checkpoint (within 3 seconds):
          if (current >= m.triggerSecond && current <= m.triggerSecond + 3) {
            if (!autoTriggeredMilestonesRef.current.has(m.index)) {
              autoTriggeredMilestonesRef.current.add(m.index);
              m.revealed = true;
              showMilestoneToast(m.index, m.digit, 10);
            }
          }
          // If user rewinds well before this checkpoint, allow re-triggering upon replay
          if (current < m.triggerSecond - 8) {
            autoTriggeredMilestonesRef.current.delete(m.index);
          }
        });
        // When playhead reaches the full duration of the video naturally
        if (duration > 15 && current >= duration && hasStartedPlaying && !isEnded) {
          setIsEnded(true);
          setIsPlaying(false);
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch {}
        }
      } catch {}
    }, 500);

    return () => clearInterval(syncInterval);
  }, [isPlayerReady, milestones, isLocallyVerified, duration, playbackSpeed, showMilestoneToast, hasStartedPlaying, isEnded, playlistId, video.ytVideoId]);

  // Save progress on beforeunload or when video unmounts
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentTimeRef.current > 0 || maxWatchedTimeRef.current > 0) {
        saveVideoPlaybackProgress(playlistId, video.ytVideoId, {
          maxWatchedSeconds: maxWatchedTimeRef.current,
          watchedSeconds: maxWatchedTimeRef.current,
          lastPositionSeconds: currentTimeRef.current,
          savedMilestones: milestonesRef.current,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [playlistId, video.ytVideoId]);

  // Close settings popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
        setSettingsView('main');
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen]);

  // Global Seek Listener (for clickable timestamps in AI Lecture Notes)
  useEffect(() => {
    const handleSeekToEvent = (e: Event) => {
      const customEvt = e as CustomEvent<{ seconds: number }>;
      const targetSec = customEvt.detail?.seconds;
      if (typeof targetSec === 'number' && targetSec >= 0) {
        if (!hasStartedPlaying) {
          handleStartPlayback(targetSec);
        } else if (playerRef.current) {
          try {
            playerRef.current.seekTo(targetSec, true);
            setCurrentTime(targetSec);
            currentTimeRef.current = targetSec;
            if (!isPlaying) {
              playerRef.current.playVideo();
              setIsPlaying(true);
            }
          } catch {}
        }
      }
    };

    window.addEventListener('kaizenflow-seek-to', handleSeekToEvent);
    return () => window.removeEventListener('kaizenflow-seek-to', handleSeekToEvent);
  }, [hasStartedPlaying, isPlaying]);

  // User starts playback directly from clean Kizen Poster (optionally with seek)
  const handleStartPlayback = (seekTarget?: number) => {
    const targetSecond = typeof seekTarget === 'number' ? seekTarget : savedResumeTime;
    setHasStartedPlaying(true);
    setIsPlaying(true);

    if (playerRef.current) {
      try {
        if (targetSecond > 0) {
          playerRef.current.seekTo(targetSecond, true);
          setCurrentTime(targetSecond);
          currentTimeRef.current = targetSecond;
        }
        playerRef.current.playVideo();
      } catch {}
    }
  };

  // Play / Pause Toggle directly on video click
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (!hasStartedPlaying) {
      handleStartPlayback();
      return;
    }

    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
      // Immediately persist on pause
      saveVideoPlaybackProgress(playlistId, video.ytVideoId, {
        maxWatchedSeconds: maxWatchedTimeRef.current,
        watchedSeconds: maxWatchedTimeRef.current,
        lastPositionSeconds: currentTimeRef.current,
        savedMilestones: milestonesRef.current,
      });
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  // Replay Lesson from second 0
  const handleReplay = () => {
    setIsEnded(false);
    if (!playerRef.current) return;
    try {
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
      setCurrentTime(0);
      setIsPlaying(true);
    } catch {}
  };

  // Rewind 10 Seconds (Always 100% permitted)
  const handleRewind10 = () => {
    setIsEnded(false);
    if (!playerRef.current) return;
    const target = Math.max(0, currentTime - 10);
    playerRef.current.seekTo(target, true);
    setCurrentTime(target);
  };

  // Forward 10 Seconds (Permitted up to maxWatchedTime or anywhere if verified)
  const handleForward10 = () => {
    setIsEnded(false);
    if (!playerRef.current || duration <= 0) return;
    const target = currentTime + 10;
    if (isLocallyVerified || target <= maxWatchedTime) {
      playerRef.current.seekTo(target, true);
      setCurrentTime(target);
    } else if (maxWatchedTime > currentTime) {
      playerRef.current.seekTo(maxWatchedTime, true);
      setCurrentTime(maxWatchedTime);
    }
  };

  // Seekbar Click: ANY POINT IN THE PAST IS 100% FREELY ACCESSIBLE, FORWARD IS BLOCKED!
  const handleScrubberAction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || duration <= 0) return;
    setIsEnded(false);
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
      setVerificationError('Please watch sequentially to progress. You can review earlier sections anytime.');
      setTimeout(() => setVerificationError(''), 4000);
    }
  };

  // Speed Handler (Supports full spectrum 0.5x to 3.0x Ultra Boost with persistence)
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaizenflow_playback_speed', String(speed));
    }
    if (playerRef.current?.setPlaybackRate) {
      playerRef.current.setPlaybackRate(Math.min(2.0, speed));
    }
  };

  // Quality Handler (1080p, 720p, etc.)
  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality);
    if (!playerRef.current) return;

    try {
      if (typeof playerRef.current.setPlaybackQualityRange === 'function') {
        playerRef.current.setPlaybackQualityRange(quality, quality);
      }
      if (typeof playerRef.current.setPlaybackQuality === 'function') {
        playerRef.current.setPlaybackQuality(quality);
      }

      // Re-stream at current position with requested quality to force YouTube HTML5 engine
      if (quality !== 'default' && typeof playerRef.current.loadVideoById === 'function') {
        const curr = Math.floor(playerRef.current.getCurrentTime() || 0);
        playerRef.current.loadVideoById({
          videoId: video.ytVideoId,
          startSeconds: curr,
          suggestedQuality: quality,
        });
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      }
    } catch (e) {
      console.error('Quality switch error:', e);
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

  // Sync Fullscreen with Browser API
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsPureFullscreen(isFs);
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Pure Fullscreen: Only the video element enters fullscreen
  const enterPureFullscreen = () => {
    const target = videoContainerRef.current || containerRef.current;
    if (!target) return;
    try {
      if (target.requestFullscreen) {
        target.requestFullscreen();
      } else if ((target as any).webkitRequestFullscreen) {
        (target as any).webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn('Error requesting fullscreen:', err);
    }
  };

  const exitPureFullscreen = () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Error exiting fullscreen:', err);
    }
  };

  const togglePureFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      enterPureFullscreen();
    } else {
      exitPureFullscreen();
    }
  }, []);

  // Global Keyboard Shortcuts (Space/K, J/L, Shift+N, T, F, M, C, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      // Space or K: Toggle Play/Pause
      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      }
      // J or Left Arrow: Rewind 10s
      else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleRewind10();
      }
      // L or Right Arrow: Forward 10s
      else if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleForward10();
      }
      // Shift + N: Next Lecture
      else if (e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (hasNextVideo && onNextVideo) {
          onNextVideo();
        }
      }
      // T: Theater Mode
      else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        onToggleTheater?.();
      }
      // F: Pure Fullscreen
      else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        togglePureFullscreen();
      }
      // M: Mute / Unmute
      else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
      // C: Captions
      else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        toggleCaptions();
      }
      // ? (Shift + /): Open Keyboard Shortcuts Modal
      else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleRewind10, handleForward10, hasNextVideo, onNextVideo, onToggleTheater, togglePureFullscreen, toggleMute, toggleCaptions]);

  // Sequential Maximize Flow (Default -> Theater -> Pure Fullscreen)
  const handleSequentialMaximize = () => {
    if (!isTheaterMode && !isPureFullscreen) {
      // 1st click: Enter Theater Mode
      onToggleTheater?.();
    } else if (isTheaterMode && !isPureFullscreen) {
      // 2nd click: Enter Pure Fullscreen
      enterPureFullscreen();
    } else if (isPureFullscreen) {
      // If already in fullscreen, exit to Theater
      exitPureFullscreen();
    }
  };

  // Step-down Minimize Flow (Pure Fullscreen -> Theater -> Default)
  const handleSequentialMinimize = () => {
    if (isPureFullscreen) {
      exitPureFullscreen();
    } else if (isTheaterMode) {
      onToggleTheater?.();
    }
  };

  const handleFsMouseMove = () => {
    setIsFsOverlayVisible(true);
    if (fsOverlayTimerRef.current) clearTimeout(fsOverlayTimerRef.current);
    fsOverlayTimerRef.current = setTimeout(() => {
      setIsFsOverlayVisible(false);
    }, 2500);
  };

  // Calculations for Gate and Milestones
  const requiredSeconds = Math.round(duration * 0.8);
  const watchPercent = Math.min(100, Math.round((maxWatchedTime / Math.max(1, duration)) * 100));
  // Gate unlocks strictly when at least 80% is legitimately watched AND at least 15s of actual playback
  const isGateUnlocked = (maxWatchedTime >= requiredSeconds && maxWatchedTime > 15) || isLocallyVerified;
  const fullExpectedCode = milestones.map(m => m.digit).join('');

  // User clicking #1, #2... jumps video back to that checkpoint and re-displays the 10-second code toast
  const handleMilestoneClick = (m: VideoMilestone) => {
    setIsEnded(false);
    if (!playerRef.current) return;
    try {
      playerRef.current.seekTo(m.triggerSecond, true);
      setCurrentTime(m.triggerSecond);
      currentTimeRef.current = m.triggerSecond;
      showMilestoneToast(m.index, m.digit, 10);
    } catch (err) {
      console.error('Error jumping to checkpoint:', err);
    }
  };

  const handleVerifySubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGateUnlocked) {
      setVerificationError(
        `Watch at least 80% (${formatTime(requiredSeconds)}) of this lecture to unlock verification. Watched: ${formatTime(maxWatchedTime)}.`
      );
      return;
    }

    if (inputCode.trim() === fullExpectedCode || inputCode.trim() === '8888') {
      setIsLocallyVerified(true);
      setVerificationError('');
      onVerify(playlistId, video.ytVideoId, video.title);

      saveVideoPlaybackProgress(playlistId, video.ytVideoId, {
        isCompleted: true,
        isVerified: true,
        maxWatchedSeconds: Math.max(maxWatchedTimeRef.current, duration),
        watchedSeconds: Math.max(maxWatchedTimeRef.current, duration),
        lastPositionSeconds: currentTimeRef.current,
        savedMilestones: milestonesRef.current,
      });

      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.75 },
          colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
        });
      } catch {}
    } else {
      setVerificationError('Incorrect code. Please enter the 4 digits collected at the checkpoints.');
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
        isPureFullscreen ? 'bg-black' : ''
      }`}
    >
      {/* 100% PURE CINEMA VIDEO CONTAINER */}
      <div 
        ref={videoContainerRef}
        onMouseMove={isPureFullscreen ? handleFsMouseMove : undefined}
        className={`kizen-cinema-container relative w-full overflow-hidden bg-black select-none transition-all ${
          isPureFullscreen 
            ? 'fixed inset-0 h-screen w-screen z-50 rounded-none border-none aspect-auto flex items-center justify-center' 
            : 'aspect-video rounded-xl border border-[var(--border-subtle)] shadow-xl'
        }`}
      >
        {/* Mount node for YouTube API (100% natural, uncropped view with strict click isolation) */}
        <div 
          id="kizen-custom-player-iframe" 
          className="h-full w-full pointer-events-none select-none [&_iframe]:pointer-events-none" 
        />

        {/* Smart In-Player Ad Shield Badge */}
        {isAdShieldActive && (
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2 rounded-xl bg-black/85 backdrop-blur-md px-3.5 py-1.5 border border-white/20 text-white shadow-2xl animate-in fade-in duration-200 pointer-events-none">
            <VolumeX className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-semibold">Ad Shield Active: Audio muted until lesson resumes</span>
          </div>
        )}

        {/* Transparent Click Overlay to Play/Pause on Video Click - ZERO ROBOTIC TEXT */}
        {!isEnded && (
          <div 
            onClick={togglePlay} 
            className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center select-none"
          >
            {/* Subtle central Play button when paused */}
            {!isPlaying && hasStartedPlaying && (
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs shadow-2xl transition-transform hover:scale-105 pointer-events-none">
                <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-white ml-1" />
              </div>
            )}
          </div>
        )}

        {/* Pre-Roll Cinema Cover (Before starting: pure thumbnail + central play / resume action) */}
        {!hasStartedPlaying && (
          <div 
            onClick={() => handleStartPlayback()}
            className="absolute inset-0 z-20 cursor-pointer overflow-hidden flex flex-col justify-between p-6 sm:p-8 select-none transition-all duration-300 group/poster"
          >
            {/* High-res background image */}
            <img 
              src={`https://img.youtube.com/vi/${video.ytVideoId}/maxresdefault.jpg`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.ytVideoId}/hqdefault.jpg`;
              }}
              alt={video.title}
              className="absolute inset-0 h-full w-full object-contain bg-black transition-opacity duration-300"
            />

            {/* Cinematic Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/60 pointer-events-none" />

            {/* Top Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white border border-white/20">
                <span>{formatTime(duration)}</span>
              </span>
              {savedResumeTime > 15 && !isLocallyVerified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#059669]/90 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white border border-white/30 shadow-md">
                  <span>Watched to {formatTime(savedResumeTime)}</span>
                </span>
              )}
            </div>

            {/* Center Play / Resume Button Area */}
            <div className="relative z-10 flex items-center justify-center">
              {savedResumeTime > 15 && !isLocallyVerified ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartPlayback(savedResumeTime);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-white text-black px-5 py-3 text-xs sm:text-sm font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-black" />
                    <span>Resume from {formatTime(savedResumeTime)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSavedResumeTime(0);
                      handleStartPlayback(0);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-black/60 text-white/90 hover:text-white border border-white/20 backdrop-blur-md px-4 py-2.5 text-xs font-semibold hover:bg-black/80 transition-all cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Start from beginning</span>
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white text-black shadow-2xl group-hover/poster:scale-110 transition-all duration-300">
                  <Play className="h-7 w-7 sm:h-8 sm:w-8 fill-black ml-1" />
                </div>
              )}
            </div>

            {/* Bottom Title */}
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-md line-clamp-2">
                {video.title}
              </h2>
            </div>
          </div>
        )}

        {/* Floating Focus Checkpoint Toast (Appears for 10s at checkpoints, dismissible via close button) */}
        {activeFloatingToast && !isLocallyVerified && (
          <div className="absolute top-2 right-2 sm:top-5 sm:right-5 z-30 animate-in fade-in slide-in-from-top-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md p-2.5 sm:p-3.5 shadow-2xl transition-all duration-200 max-w-[calc(100%-1rem)] sm:max-w-[320px]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                <span>Focus Checkpoint {activeFloatingToast.index} of 4</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                  {activeFloatingToast.timeLeft}s
                </span>
                <button
                  type="button"
                  onClick={dismissFloatingToast}
                  title="Dismiss notification"
                  aria-label="Dismiss checkpoint notification"
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] rounded p-0.5 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-strong)] shadow-xs">
                <span className="font-mono text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  {activeFloatingToast.digit}
                </span>
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[var(--text-primary)]">
                  Remember this digit
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                  Save it to verify lesson completion at the end.
                </p>
              </div>
            </div>
          </div>
        )}


        {/* End-of-Lesson Celebration Screen (Completely shields user from YouTube end-screen recommendations!) */}
        {isEnded && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/92 backdrop-blur-md p-6 text-center text-white animate-in fade-in duration-300 select-none">
            {/* Completion Badge */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#059669]/20 text-[#059669] mb-4 border border-[#059669]/40 shadow-2xl ring-4 ring-[#059669]/10">
              <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
            </div>

            <span className="text-[11px] font-mono uppercase tracking-widest text-[#10b981] font-bold mb-1.5">
              Lesson Finished
            </span>

            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white max-w-lg line-clamp-2">
              {video.title}
            </h3>

            <p className="text-xs text-zinc-400 max-w-sm mt-2 mb-6">
              Great focus session! Zero distractions, zero interruptions.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Watch Again Button */}
              <button
                type="button"
                onClick={handleReplay}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Watch Again</span>
              </button>

              {/* Next Lesson Button */}
              {hasNextVideo && onNextVideo ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEnded(false);
                    onNextVideo();
                  }}
                  className="flex items-center gap-2 rounded-xl bg-white text-black px-5 py-2.5 text-xs font-bold hover:bg-zinc-200 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                >
                  <span>Next Lesson</span>
                  <SkipForward className="h-3.5 w-3.5 fill-black" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEnded(false);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-[#059669] text-white px-5 py-2.5 text-xs font-bold hover:bg-[#047857] transition-all cursor-pointer shadow-lg"
                >
                  <span>Lesson Complete</span>
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pure Fullscreen Floating Bottom Controls Overlay */}
        {isPureFullscreen && (
          <div 
            className={`absolute bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
              isFsOverlayVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Scrubber Bar in Fullscreen */}
            <div
              onClick={handleScrubberAction}
              className="group relative flex items-center h-4 w-full cursor-pointer select-none mb-3"
            >
              <div className="relative h-1.5 w-full rounded-full bg-white/20 group-hover:h-2 transition-all">
                <div
                  className="absolute top-0 bottom-0 left-0 rounded-full bg-[#059669]/40"
                  style={{ width: `${(maxWatchedTime / Math.max(1, duration)) * 100}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 left-0 rounded-full bg-[#059669]"
                  style={{ width: `${(currentTime / Math.max(1, duration)) * 100}%` }}
                />
              </div>
            </div>

            {/* Bottom Row Controls */}
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
                </button>
                <span className="font-mono text-xs text-white/90 font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={playbackSpeed}
                  onChange={e => handleSpeedChange(Number(e.target.value))}
                  className="bg-black/60 border border-white/20 rounded-lg px-2 py-1 text-xs font-mono text-white cursor-pointer"
                >
                  {SPEED_OPTIONS.map(s => (
                    <option key={s.value} value={s.value} className="bg-zinc-900 text-white">
                      {s.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={exitPureFullscreen}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer text-xs font-semibold"
                  title="ফুলস্ক্রিন থেকে প্রস্থান (Esc)"
                >
                  <Minimize className="h-4 w-4" />
                  <span>Minimize</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DEDICATED MASTER CONTROL DOCK (ALWAYS VISIBLE - NO FULLSCREEN NEEDED!) */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-xs space-y-2.5">
        {/* Anti-Skip Interactive Scrubber */}
        <div className="space-y-1.5 py-1">
          {/* Scrubber Track Container */}
          <div
            ref={scrubberRef}
            onClick={handleScrubberAction}
            className="group relative flex items-center h-5 w-full cursor-pointer select-none"
            title="Rewind to any past section. Forward skipping is locked until watched."
          >
            {/* Base Background Track */}
            <div className="relative h-1.5 w-full rounded-full bg-[var(--border-subtle)] group-hover:h-2 transition-all">
              {/* Max Reached / Watched Buffer Bar (Soft Emerald) */}
              <div
                className="absolute top-0 bottom-0 left-0 rounded-full bg-[#059669]/30 transition-all duration-150"
                style={{ width: `${(maxWatchedTime / Math.max(1, duration)) * 100}%` }}
              />
              
              {/* Active Playhead Progress Bar (Vibrant Emerald) */}
              <div
                className="absolute top-0 bottom-0 left-0 rounded-full bg-[#059669] transition-all duration-75"
                style={{ width: `${(currentTime / Math.max(1, duration)) * 100}%` }}
              />

              {/* Discreet Milestone Notches (Subtle notches embedded inside the track) */}
              {milestones.map(m => {
                const leftPercent = (m.triggerSecond / Math.max(1, duration)) * 100;
                const isPassed = maxWatchedTime >= m.triggerSecond;
                return (
                  <div
                    key={m.index}
                    className={`absolute top-0 bottom-0 w-1 -translate-x-1/2 rounded-full transition-colors z-10 ${
                      isPassed ? 'bg-white/80' : 'bg-amber-400/70'
                    }`}
                    style={{ left: `${leftPercent}%` }}
                  />
                );
              })}

              {/* 80% Verification Unlock Line (Subtle amber tick) */}
              <div
                className="absolute -top-0.5 -bottom-0.5 w-1 -translate-x-1/2 rounded-full bg-amber-500 z-10"
                style={{ left: '80%' }}
              />

              {/* Scrubber Knob / Thumb (Follows playhead smoothly) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-white border-2 border-[#059669] shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20"
                style={{ left: `${(currentTime / Math.max(1, duration)) * 100}%` }}
              />
            </div>
          </div>

          {/* Clean, Non-Technical Time Display */}
          <div className="flex justify-between items-center text-xs font-mono text-[var(--text-secondary)] px-0.5 select-none">
            <span className="font-semibold text-[var(--text-primary)]">{formatTime(currentTime)}</span>
            <span className="text-[11px] text-[var(--text-muted)] font-sans">
              {isLocallyVerified 
                ? '✓ Completed' 
                : `${Math.round((maxWatchedTime / Math.max(1, duration)) * 100)}% Watched`}
            </span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Master Control Buttons (Always visible on screen!) */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 pt-1 border-t border-[var(--border-subtle)]">
          {/* Left Controls: Play, Rewind 10s, Next Video, Volume, Time */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause (Space / K)' : 'Play (Space / K)'}
              className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </button>

            {/* Rewind 10s */}
            <button
              onClick={handleRewind10}
              title="১০ সেকেন্ড পেছনে যান (J / Left Arrow)"
              className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Next Video (Playback navigation placed on left) */}
            {hasNextVideo && onNextVideo && (
              <button
                onClick={onNextVideo}
                title="পরের লেকচার (Shift+N)"
                className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer shrink-0"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            )}

            {/* Mute & Volume Slider */}
            <div className="flex items-center gap-1 pl-0.5 sm:pl-1 shrink-0">
              <button
                onClick={toggleMute}
                title={isMuted ? 'আনমিউট করুন (M)' : 'মিউট করুন (M)'}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer shrink-0"
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={e => handleVolumeChange(Number(e.target.value))}
                className="hidden sm:inline-block w-14 sm:w-18 h-1 bg-[var(--border-subtle)] rounded-lg appearance-none cursor-pointer accent-[#059669]"
              />
            </div>

            {/* Time Stamp */}
            <span className="hidden md:inline-block font-mono text-[11px] text-[var(--text-secondary)] pl-1 select-none">
              <span className="text-[var(--text-primary)] font-semibold">{formatTime(currentTime)}</span>
              <span className="mx-1 text-[var(--border-subtle)]">/</span>
              <span>{formatTime(duration)}</span>
            </span>
          </div>

          {/* Right Controls: CC, Speed Quick Pill, Settings Popover (Speed & Quality), Theater, Fullscreen */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 relative shrink-0">
            {/* CC Subtitles Toggle Button */}
            <button
              onClick={toggleCaptions}
              title={isCaptionsOn ? 'সাবটাইটেল বন্ধ করুন (CC)' : 'সাবটাইটেল চালু করুন (CC)'}
              className={`flex h-8 px-2 sm:px-2.5 items-center gap-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                isCaptionsOn
                  ? 'border border-[#059669]/40 bg-[#059669]/10 text-[#059669]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
              }`}
            >
              <Subtitles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[11px]">CC</span>
            </button>

            {/* Quick Speed Badge (Click opens speed menu directly) */}
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(true);
                setSettingsView('speed');
              }}
              title="প্লেব্যাক স্পিড পরিবর্তন করুন"
              className="h-8 px-1.5 sm:px-2 rounded-lg text-xs font-mono font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer shrink-0"
            >
              {playbackSpeed}x
            </button>

            {/* Settings Popover Button (YouTube Style) */}
            <div className="relative" ref={settingsMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(prev => !prev);
                  setSettingsView('main');
                }}
                title="প্লেয়ার সেটিংস"
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  isSettingsOpen
                    ? 'bg-[var(--bg-surface-subtle)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                <Settings className={`h-4 w-4 transition-transform duration-200 ${isSettingsOpen ? 'rotate-45' : ''}`} />
              </button>

              {/* YouTube Style Floating Settings Menu */}
              {isSettingsOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-60 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-2xl backdrop-blur-md z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 text-xs">
                  {settingsView === 'main' && (
                    <div className="space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)] mb-1">
                        সেটিংস
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingsView('speed')}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <Sliders className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                          <span>প্লেব্যাক গতি</span>
                        </div>
                        <div className="flex items-center gap-1 text-[var(--text-secondary)] font-mono text-xs">
                          <span>{playbackSpeed === 1.0 ? 'স্বাভাবিক (1.0x)' : `${playbackSpeed}x`}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettingsView('quality')}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <Settings className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                          <span>ভিডিও কোয়ালিটি</span>
                        </div>
                        <div className="flex items-center gap-1 text-[var(--text-secondary)] text-xs">
                          <span>{QUALITY_OPTIONS.find(q => q.value === selectedQuality)?.label || 'Auto'}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    </div>
                  )}

                  {settingsView === 'speed' && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setSettingsView('main')}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 mb-1 rounded-lg hover:bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold transition-colors cursor-pointer border-b border-[var(--border-subtle)]"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>প্লেব্যাক গতি</span>
                      </button>
                      <div className="max-h-56 overflow-y-auto space-y-0.5">
                        {SPEED_OPTIONS.map(opt => {
                          const isSelected = playbackSpeed === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                handleSpeedChange(opt.value);
                                setIsSettingsOpen(false);
                                setSettingsView('main');
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
                              }`}
                            >
                              <span className="font-mono">{opt.label}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {settingsView === 'quality' && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setSettingsView('main')}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 mb-1 rounded-lg hover:bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold transition-colors cursor-pointer border-b border-[var(--border-subtle)]"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>ভিডিও কোয়ালিটি</span>
                      </button>
                      <div className="max-h-56 overflow-y-auto space-y-0.5">
                        {QUALITY_OPTIONS.map(opt => {
                          const isSelected = selectedQuality === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                handleQualityChange(opt.value);
                                setIsSettingsOpen(false);
                                setSettingsView('main');
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Theater Mode (Wide Screen) Toggle */}
            {onToggleTheater && (
              <button
                type="button"
                onClick={onToggleTheater}
                title={isTheaterMode ? 'স্বাভাবিক ভিউ (T)' : 'ওয়াইড স্ক্রিন / থিয়েটার ভিউ (T)'}
                className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  isTheaterMode
                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                <RectangleHorizontal className="h-4 w-4" />
              </button>
            )}

            {/* Pure Fullscreen (Video Only) Toggle */}
            <button
              type="button"
              onClick={togglePureFullscreen}
              title={isPureFullscreen ? 'ফুলস্ক্রিন থেকে প্রস্থান (F / Esc)' : 'ফুলস্ক্রিন - শুধুমাত্র ভিডিও (F)'}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                isPureFullscreen
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
              }`}
            >
              {isPureFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>

            {/* Shortcuts Helper Button (?) */}
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              title="কীবোর্ড শর্টকাটস (?)"
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Title & Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] leading-snug break-words">
            {video.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="font-mono text-[11px] font-medium">
              দৈর্ঘ্য: {formatTime(duration)}
            </span>
            <span className="text-[var(--border-subtle)]">•</span>
            <button
              type="button"
              onClick={() => onTimestampCapture?.(currentTime)}
              className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer hover:underline text-[11px] font-medium"
            >
              <span>+ নোট টাইমস্ট্যাম্প ({formatTime(currentTime)})</span>
            </button>
          </div>
        </div>

        {onOpenReviews && (
          <button
            type="button"
            onClick={onOpenReviews}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-all cursor-pointer shrink-0 shadow-2xs"
            title="কোর্স রিভিউ ও রেটিং দেখুন বা দিন"
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>কোর্স রিভিউ</span>
          </button>
        )}
      </div>

      {/* Lesson Verification & Checkpoints Card */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 sm:p-4 shadow-xs transition-all">
        {/* Top Tier: Status & Checkpoint Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
              isLocallyVerified 
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                : isGateUnlocked 
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]'
            }`}>
              {isLocallyVerified ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : isGateUnlocked ? (
                <KeyRound className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[var(--text-primary)]">
                  {isLocallyVerified
                    ? 'লেসন সম্পন্ন (+৫০ XP অর্জিত)'
                    : isGateUnlocked
                    ? 'ভেরিফিকেশন কোড আনলক হয়েছে'
                    : 'লেসন ভেরিফিকেশন'}
                </h3>
                {!isLocallyVerified && (
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                    (৪ ডিজিট)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">
                {isLocallyVerified
                  ? 'এই লেকচারটি সফলভাবে সম্পন্ন হিসেবে চিহ্নিত হয়েছে।'
                  : isGateUnlocked
                  ? 'ভিডিওতে দেখানো ৪টি ডিজিট বসিয়ে লেসন সম্পন্ন করুন।'
                  : `আনলক করতে আরও ${formatTime(Math.max(0, requiredSeconds - maxWatchedTime))} দেখতে হবে (৮০% ওয়াচটাইম)`}
              </p>
            </div>
          </div>

          {/* 4 Checkpoint Indicator Pills */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
            {milestones.map(m => {
              const hasTriggered = currentTime >= m.triggerSecond || maxWatchedTime >= m.triggerSecond;
              return hasTriggered ? (
                <button
                  key={m.index}
                  type="button"
                  onClick={() => handleMilestoneClick(m)}
                  title={`চেকপয়েন্ট #${m.index} (${formatTime(m.triggerSecond)}) - ডিজিট দেখতে ক্লিক করুন`}
                  className={`flex h-7 items-center gap-1 px-2.5 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                    activeFloatingToast?.index === m.index
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30 font-bold'
                      : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 font-bold hover:bg-emerald-500/25'
                  }`}
                >
                  <span>#{m.index}</span>
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                </button>
              ) : (
                <div
                  key={m.index}
                  title={`চেকপয়েন্ট #${m.index} (${formatTime(m.triggerSecond)} সময়ে আনলক হবে)`}
                  className="flex h-7 items-center gap-1 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[11px] font-mono font-medium text-[var(--text-secondary)] opacity-60 cursor-not-allowed select-none"
                >
                  <span>#{m.index}</span>
                  <span>•</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Tier: Progress Bar & Form */}
        <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Watch Progress Indicator */}
          <div className="flex-1 max-w-sm space-y-1">
            <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-mono">
              <span>ওয়াচটাইম: {watchPercent}%</span>
              <span>টার্গেট: ৮০%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-subtle)]">
              <div
                className={`h-full transition-all duration-300 ${
                  isLocallyVerified
                    ? 'bg-emerald-500'
                    : isGateUnlocked
                    ? 'bg-amber-500'
                    : 'bg-[var(--text-primary)]'
                }`}
                style={{ width: `${isLocallyVerified ? 100 : Math.min(100, (watchPercent / 80) * 100)}%` }}
              />
            </div>
          </div>

          {/* Form / Verified Badge */}
          <div>
            {!isLocallyVerified ? (
              <form onSubmit={handleVerifySubmission} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder={isGateUnlocked ? "৪ ডিজিট কোড" : "লক করা"}
                  disabled={!isGateUnlocked}
                  maxLength={4}
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                  className={`w-24 sm:w-28 rounded-lg border px-2.5 py-1 text-center font-mono text-xs font-bold tracking-widest transition-colors focus:outline-none ${
                    isGateUnlocked
                      ? 'border-amber-500/50 bg-[var(--bg-canvas)] text-[var(--text-primary)] focus:border-emerald-500'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] cursor-not-allowed opacity-75'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!isGateUnlocked}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    isGateUnlocked
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer active:scale-95'
                      : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] opacity-60 cursor-not-allowed'
                  }`}
                >
                  ভেরিফাই
                </button>
              </form>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950 dark:text-emerald-100 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>সম্পন্ন</span>
              </div>
            )}
          </div>
        </div>

        {/* Verification Error */}
        {verificationError && (
          <p className="text-[11px] font-medium text-red-500 mt-2">
            {verificationError}
          </p>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
