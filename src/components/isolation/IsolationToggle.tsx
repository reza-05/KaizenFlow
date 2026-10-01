'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Sliders } from 'lucide-react';
import {
  getIsolationEnabled,
  setIsolationEnabled,
  subscribeToIsolation,
  IsolationStatus,
} from '@/lib/isolation';
import { IsolationModal } from './IsolationModal';

export const IsolationToggle: React.FC = () => {
  const [status, setStatus] = useState<IsolationStatus>({
    enabled: false,
    extensionInstalled: false,
    distractionAttempts: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToIsolation((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !status.enabled;
    setIsolationEnabled(nextState);

    // If enabling for the first time without extension, open modal once
    if (nextState && !status.extensionInstalled) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Clean Tactile Pill Switch */}
        <button
          type="button"
          onClick={handleToggle}
          title={
            status.enabled
              ? 'Isolation Shield is active. Distraction sites blocked across all browser tabs.'
              : 'Turn ON Isolation Shield to suspend social media tabs during study.'
          }
          className={`group h-8 px-2.5 rounded-full border text-xs transition-all duration-200 flex items-center gap-2 select-none cursor-pointer bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] ${
            status.enabled
              ? 'border-emerald-600/50 dark:border-emerald-500/50 text-[var(--text-primary)] shadow-xs ring-1 ring-emerald-500/20'
              : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Shield
            className={`h-3.5 w-3.5 shrink-0 transition-colors ${
              status.enabled
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
            }`}
          />
          <span className="text-xs font-semibold tracking-tight text-[var(--text-primary)]">
            {status.enabled ? 'Shield Active' : 'Shield'}
          </span>
          <div
            className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors ${
              status.enabled
                ? 'bg-emerald-600 dark:bg-emerald-500 justify-end'
                : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
          </div>
        </button>

        {/* Shield Rules & Settings Trigger */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          title="Shield Configuration & Blocked Networks"
          className="h-8 w-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-subtle)] transition-all flex items-center justify-center cursor-pointer"
        >
          <Sliders className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Isolation Management Modal */}
      <IsolationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
