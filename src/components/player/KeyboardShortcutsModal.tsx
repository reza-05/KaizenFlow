'use client';

import React, { useEffect } from 'react';
import { X, Keyboard, Play, RotateCcw, RotateCw, SkipForward, RectangleHorizontal, Maximize, VolumeX, Subtitles, HelpCircle } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const playbackShortcuts: ShortcutItem[] = [
    {
      keys: ['Space', 'K'],
      label: 'Play / Pause',
      description: 'ভিডিও চালু বা থামানো',
      icon: <Play className="h-4 w-4" />,
    },
    {
      keys: ['J', '←'],
      label: 'Rewind 10s',
      description: '১০ সেকেন্ড পেছনে যাওয়া',
      icon: <RotateCcw className="h-4 w-4" />,
    },
    {
      keys: ['L', '→'],
      label: 'Forward 10s',
      description: '১০ সেকেন্ড সামনে যাওয়া',
      icon: <RotateCw className="h-4 w-4" />,
    },
    {
      keys: ['Shift', 'N'],
      label: 'Next Lecture',
      description: 'পরের লেকচারে যাওয়া',
      icon: <SkipForward className="h-4 w-4" />,
    },
  ];

  const displayShortcuts: ShortcutItem[] = [
    {
      keys: ['T'],
      label: 'Theater Mode',
      description: 'ওয়াইড স্ক্রিন / থিয়েটার ভিউ',
      icon: <RectangleHorizontal className="h-4 w-4" />,
    },
    {
      keys: ['F'],
      label: 'Fullscreen',
      description: 'পিওর ফুলস্ক্রিন (ভিডিও অনলি)',
      icon: <Maximize className="h-4 w-4" />,
    },
    {
      keys: ['M'],
      label: 'Mute / Unmute',
      description: 'শব্দ বন্ধ বা চালু করা',
      icon: <VolumeX className="h-4 w-4" />,
    },
    {
      keys: ['C'],
      label: 'Subtitles (CC)',
      description: 'সাবটাইটেল চালু বা বন্ধ করা',
      icon: <Subtitles className="h-4 w-4" />,
    },
    {
      keys: ['?'],
      label: 'Shortcuts Guide',
      description: 'এই শর্টকাট গাইড ওপেন করা',
      icon: <HelpCircle className="h-4 w-4" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] shadow-2xs">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                কীবোর্ড শর্টকাটস
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                ভিডিও দেখার গতি বাড়াতে শর্টকাটগুলো ব্যবহার করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
            title="বন্ধ করুন (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Lists */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Section 1: Playback */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              প্লেব্যাক কন্ট্রোল (Playback)
            </h4>
            <div className="grid grid-cols-1 gap-1.5">
              {playbackShortcuts.map((sc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/40 hover:bg-[var(--bg-surface-subtle)] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[var(--text-secondary)]">{sc.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{sc.label}</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">{sc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {sc.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        {kIdx > 0 && sc.keys.length > 2 && <span className="text-xs text-[var(--text-muted)]">+</span>}
                        {kIdx > 0 && sc.keys.length === 2 && sc.keys[0] === 'Shift' ? (
                          <span className="text-xs text-[var(--text-muted)] font-mono">+</span>
                        ) : kIdx > 0 ? (
                          <span className="text-xs text-[var(--text-muted)] px-0.5">বা</span>
                        ) : null}
                        <kbd className="min-w-6 px-2 py-1 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-strong)] font-mono text-[11px] font-bold text-[var(--text-primary)] text-center shadow-xs">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Display & Audio */}
          <div className="space-y-2 pt-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              ডিসপ্লে ও অডিও (Display & Audio)
            </h4>
            <div className="grid grid-cols-1 gap-1.5">
              {displayShortcuts.map((sc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/40 hover:bg-[var(--bg-surface-subtle)] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[var(--text-secondary)]">{sc.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{sc.label}</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">{sc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {sc.keys.map((k, kIdx) => (
                      <kbd
                        key={kIdx}
                        className="min-w-6 px-2 py-1 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-strong)] font-mono text-[11px] font-bold text-[var(--text-primary)] text-center shadow-xs"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] text-xs">
          <p className="text-[11px] text-[var(--text-secondary)]">
            যেকোনো সময় কীবোর্ডে <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] font-mono font-bold text-[var(--text-primary)]">?</kbd> চাপলে এই গাইড আসবে।
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            বুঝেছি
          </button>
        </div>
      </div>
    </div>
  );
};
