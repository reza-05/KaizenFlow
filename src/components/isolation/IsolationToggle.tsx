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
              ? 'Isolation Shield is ARMED. Distraction sites blocked across all browser tabs.'
              : 'Turn ON Isolation Shield to suspend Facebook, Instagram & WhatsApp across all tabs.'
          }
          className={`group h-8 px-2.5 rounded-lg border text-xs font-medium transition-all duration-200 flex items-center gap-2 select-none cursor-pointer ${
            status.enabled
              ? 'bg-zinc-950 dark:bg-zinc-900 border-zinc-800 dark:border-zinc-700 text-white shadow-xs hover:border-zinc-600'
              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-subtle)]'
          }`}
        >
          {status.enabled ? (
            <>
              {/* Precision Glowing Status Light */}
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              </span>
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-[11px] tracking-wider uppercase font-semibold text-zinc-100">
                Shield
              </span>
              <span className="text-[10px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ON
              </span>
              {/* Precision Micro Slider */}
              <div className="w-5 h-2.5 rounded-full bg-emerald-500 p-0.5 ml-0.5 flex items-center justify-end">
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
              </div>
            </>
          ) : (
            <>
              <Shield className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors shrink-0" />
              <span className="text-[11px] font-medium tracking-tight">
                Shield
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                OFF
              </span>
              {/* Precision Micro Slider Standby */}
              <div className="w-5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 p-0.5 ml-0.5 flex items-center justify-start transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-300 shadow-xs" />
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
