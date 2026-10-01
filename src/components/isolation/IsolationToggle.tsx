'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert } from 'lucide-react';
import {
  getIsolationEnabled,
  setIsolationEnabled,
  checkExtensionInstalled,
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

    // If user is turning it ON for the first time and extension is not installed, open modal to inform them
    if (nextState && !status.extensionInstalled) {
      setIsModalOpen(true);
    }
  };

  const handleOpenSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center">
        {status.enabled ? (
          /* ACTIVE / ARMED STATE */
          <div
            onClick={handleOpenSettings}
            className="group relative flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-500 shadow-xs cursor-pointer hover:bg-rose-500/15 transition-all"
            title="Isolation Mode ACTIVE — Facebook, Instagram & WhatsApp blocked across browser tabs. Click for settings."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
            <span className="tracking-tight">ISOLATION</span>
            <span className="hidden sm:inline text-[10px] font-mono px-1 rounded bg-rose-500/20 text-rose-400">
              ON
            </span>

            {/* Quick Toggle switch inside badge */}
            <button
              onClick={handleToggle}
              className="ml-1 rounded-full p-0.5 hover:bg-rose-500/30 text-rose-300 transition-colors"
              title="Turn Isolation OFF"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-rose-600 flex items-center justify-center text-[8px] text-white">
                ✕
              </div>
            </button>
          </div>
        ) : (
          /* INACTIVE / DISARMED STATE */
          <div
            onClick={handleToggle}
            className="group relative flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] shadow-xs cursor-pointer transition-all"
            title="Turn ON Isolation Mode to shut down Facebook, Instagram & WhatsApp across browser tabs."
          >
            <Shield className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors" />
            <span className="text-[11px] font-medium tracking-tight">Isolation</span>
            <span className="hidden sm:inline text-[10px] font-mono text-[var(--text-muted)]">
              OFF
            </span>

            {/* Mini toggle switch */}
            <div className="w-6 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700 relative p-0.5 ml-0.5 transition-colors">
              <div className="w-2 h-2 rounded-full bg-white transition-transform" />
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <IsolationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
