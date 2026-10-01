'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, X, Laptop } from 'lucide-react';
import {
  getIsolationEnabled,
  setIsolationEnabled,
  checkExtensionInstalled,
  subscribeToIsolation,
  IsolationStatus,
} from '@/lib/isolation';

interface IsolationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IsolationModal: React.FC<IsolationModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<IsolationStatus>({
    enabled: false,
    extensionInstalled: false,
    distractionAttempts: 0,
  });
  const [isPinging, setIsPinging] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToIsolation((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    setIsolationEnabled(!status.enabled);
  };

  const handlePingExtension = () => {
    setIsPinging(true);
    if (typeof window !== 'undefined') {
      window.postMessage({ type: 'KAIZENFLOW_PING' }, '*');
    }
    setTimeout(() => {
      setIsPinging(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
              status.enabled
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-500'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {status.enabled ? <ShieldAlert className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Isolation Mode (Distraction Shield)
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Shuts down social media & blocks browsing distractions across all tabs.
            </p>
          </div>
        </div>

        {/* Big Main Toggle Banner */}
        <div
          className={`flex items-center justify-between p-4 rounded-xl border mb-5 transition-all ${
            status.enabled
              ? 'bg-rose-500/10 border-rose-500/30'
              : 'bg-[var(--bg-surface-subtle)] border-[var(--border-subtle)]'
          }`}
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {status.enabled ? 'SHIELD ARMED (ACTIVE)' : 'Shield Disarmed'}
              </span>
              {status.enabled && (
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {status.enabled
                ? 'Facebook, Instagram, WhatsApp & social media are disabled in this browser.'
                : 'Click to engage lock-in mode and suspend distracting websites.'}
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            type="button"
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              status.enabled ? 'bg-rose-600' : 'bg-zinc-600'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                status.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Extension Connection Status Pill */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5 mb-5 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="font-semibold text-[var(--text-primary)]">
                Browser Network Defense Status:
              </span>
            </div>
            <button
              onClick={handlePingExtension}
              disabled={isPinging}
              className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Checking...' : 'Check Status'}</span>
            </button>
          </div>

          {status.extensionInstalled ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>KaizenFlow Shield Extension is connected. Rules active across all tabs!</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-500 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>In-App Focus Guard active. To shut down external tabs, load our extension:</span>
              </div>
              <div className="rounded-lg bg-[var(--bg-surface)] p-2.5 border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] space-y-1">
                <p>
                  1. In Chrome, open <code className="bg-[var(--bg-canvas)] px-1 py-0.5 rounded text-[var(--text-primary)] font-mono">chrome://extensions</code>
                </p>
                <p>2. Enable <strong>Developer mode</strong> (top right)</p>
                <p>
                  3. Click <strong>Load unpacked</strong> & select the <code className="bg-[var(--bg-canvas)] px-1 py-0.5 rounded text-[var(--text-primary)] font-mono">kizen/extension</code> folder in your project!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Targeted Sites Grid */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Sites Restricted in Isolation Mode:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { name: 'Facebook', domain: 'facebook.com', icon: '🌐' },
              { name: 'Instagram', domain: 'instagram.com', icon: '📸' },
              { name: 'WhatsApp Web', domain: 'whatsapp.com', icon: '💬' },
              { name: 'X / Twitter', domain: 'x.com', icon: '🐦' },
              { name: 'TikTok', domain: 'tiktok.com', icon: '🎵' },
              { name: 'Reddit', domain: 'reddit.com', icon: '🤖' },
            ].map((target) => (
              <div
                key={target.domain}
                className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
              >
                <span>{target.icon}</span>
                <span className="truncate font-medium">{target.name}</span>
                {status.enabled && (
                  <span className="ml-auto text-[9px] font-mono text-rose-500 font-bold">
                    DOWN
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div className="text-[11px] text-[var(--text-muted)]">
            {status.distractionAttempts > 0
              ? `⚠️ ${status.distractionAttempts} tab switch attempts logged`
              : 'Zero distractions logged this session'}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
