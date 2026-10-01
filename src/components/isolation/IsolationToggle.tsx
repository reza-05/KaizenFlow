'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Sliders } from 'lucide-react';
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
        {/* Sleek Tactile Toggle Button */}
        <button
          type="button"
          onClick={handleToggle}
          title={
            status.enabled
              ? 'Isolation Shield is active. Distraction sites blocked across all browser tabs.'
              : 'Turn ON Isolation Shield to suspend social media tabs during study.'
          }
          className={`group h-8 px-2 sm:px-2.5 rounded-lg border text-xs font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 select-none cursor-pointer ${
            status.enabled
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 shadow-xs'
              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-subtle)]'
          }`}
        >
          {status.enabled ? (
            <>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden xs:inline text-[11px] font-semibold text-[var(--text-primary)]">
                Shield
              </span>
              <span className="text-[10px] font-semibold px-1 rounded bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
                ON
              </span>
              <div className="w-5 h-2.5 rounded-full bg-emerald-600 p-0.5 ml-0.5 flex items-center justify-end">
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
              </div>
            </>
          ) : (
            <>
              <Shield className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors shrink-0" />
              <span className="hidden xs:inline text-[11px] font-medium tracking-tight">
                Shield
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                OFF
              </span>
              <div className="w-5 h-2.5 rounded-full bg-[var(--border-strong)] p-0.5 ml-0.5 flex items-center justify-start transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
              </div>
            </>
          )}
        </button>

        {/* Small Discreet Settings Trigger */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          title="Shield Configuration & Target Rules"
          className="h-8 w-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-subtle)] transition-colors flex items-center justify-center cursor-pointer"
        >
          <Sliders className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Modal Dialog */}
      <IsolationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
