'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, X, ArrowRight, BookOpen } from 'lucide-react';
import {
  setIsolationEnabled,
  subscribeToIsolation,
  IsolationStatus,
} from '@/lib/isolation';
import { SetupManualModal } from './SetupManualModal';

interface IsolationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Authentic brand icons with official brand colors
const BRAND_LOGOS = {
  facebook: (
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1877F2] text-white shrink-0 shadow-2xs">
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    </div>
  ),
  instagram: (
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shrink-0 shadow-2xs">
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    </div>
  ),
  whatsapp: (
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#25D366] text-white shrink-0 shadow-2xs">
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
    </div>
  ),
  x: (
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shrink-0 shadow-2xs">
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    </div>
  ),
  tiktok: (
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-black text-white shrink-0 shadow-2xs">
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    </div>
  ),
  reddit: (
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FF4500] text-white shrink-0 shadow-2xs">
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
      </svg>
    </div>
  ),
};

const RESTRICTED_DOMAINS = [
  { id: 'facebook', name: 'Meta / Facebook', domain: 'facebook.com', icon: BRAND_LOGOS.facebook },
  { id: 'instagram', name: 'Instagram', domain: 'instagram.com', icon: BRAND_LOGOS.instagram },
  { id: 'whatsapp', name: 'WhatsApp Web', domain: 'web.whatsapp.com', icon: BRAND_LOGOS.whatsapp },
  { id: 'x', name: 'X / Twitter', domain: 'x.com', icon: BRAND_LOGOS.x },
  { id: 'tiktok', name: 'TikTok', domain: 'tiktok.com', icon: BRAND_LOGOS.tiktok },
  { id: 'reddit', name: 'Reddit', domain: 'reddit.com', icon: BRAND_LOGOS.reddit },
];

export const IsolationModal: React.FC<IsolationModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<IsolationStatus>({
    enabled: false,
    extensionInstalled: false,
    distractionAttempts: 0,
  });
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToIsolation((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    setIsolationEnabled(!status.enabled);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-5 pt-16 sm:pt-20 pb-12 text-center">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-2xl text-[var(--text-primary)] text-left my-auto"
        >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] shadow-2xs">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                Isolation Shield
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Block social media & distracting feeds across all browser tabs while studying.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Master Switch Card */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] mb-4">
          <div className="space-y-0.5 pr-3">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {status.enabled ? 'Shield is Active' : 'Shield is Inactive'}
            </span>
            <p className="text-xs text-[var(--text-secondary)]">
              {status.enabled
                ? 'Social media tabs are blocked and routed to the Focus Screen.'
                : 'Turn ON to eliminate tab hopping during your focus session.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            aria-label="Toggle isolation shield"
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              status.enabled ? 'bg-emerald-600' : 'bg-[var(--border-strong)]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                status.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Targeted Sites Matrix with Real Authentic Logos */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Protected Social Networks
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RESTRICTED_DOMAINS.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-2 text-xs transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.icon}
                  <span className="truncate font-medium text-[var(--text-primary)] text-xs">{item.name}</span>
                </div>
                {status.enabled ? (
                  <span className="font-bold text-[10px] text-white bg-red-600 px-2 py-0.5 rounded-md shadow-xs tracking-wider uppercase shrink-0">
                    Blocked
                  </span>
                ) : (
                  <span className="font-medium text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md shrink-0">
                    Idle
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Eye-catching Visual Setup Guide Banner */}
        <button
          type="button"
          onClick={() => setIsManualOpen(true)}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all cursor-pointer group text-left shadow-xs mt-6 mb-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                How to Setup Shield?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                Step-by-step visual tutorial to enable cross-tab blocking
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 rounded-lg bg-emerald-600 group-hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 shadow-xs transition-colors ml-3">
            <span>View Guide</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
          <span>
            {status.distractionAttempts > 0
              ? `${status.distractionAttempts} attempts prevented`
              : 'Zero distraction intrusions'}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-[var(--text-primary)] text-[var(--bg-surface)] hover:opacity-90 px-4 py-1.5 font-medium transition-opacity cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>

    {/* Visual Step-by-Step Setup Manual Modal */}
    <SetupManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
  </div>,
  document.body
);
};
