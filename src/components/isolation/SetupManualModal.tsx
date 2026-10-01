'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Copy, Check, ChevronRight, ChevronLeft, HelpCircle, ShieldCheck, FolderArchive, MousePointerClick } from 'lucide-react';

interface SetupManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TargetHighlight {
  top: string;
  left: string;
  width: string;
  height: string;
  label: string;
  badgePlacement?: 'top' | 'bottom';
}

interface StepImage {
  src: string;
  caption?: string;
  highlight?: TargetHighlight;
}

interface StepItem {
  title: string;
  badge: string;
  desc: string;
  images?: StepImage[];
  action?: React.ReactNode;
}

export const SetupManualModal: React.FC<SetupManualModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen || !mounted) return null;

  const steps: StepItem[] = [
    {
      title: 'Download & Extract Extension Package',
      badge: 'Step 1',
      desc: 'Download the official KaizenFlow Shield extension archive (.zip) and extract it on your computer. You will load this unzipped folder into your browser.',
      action: (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <a
            href="/downloads/kaizenflow-shield.zip"
            download="kaizenflow-shield.zip"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-surface)] hover:opacity-90 px-4 py-2.5 text-xs font-semibold shadow-xs transition-opacity cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Download kaizenflow-shield.zip</span>
          </a>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] px-3 py-2 rounded-xl">
            <FolderArchive className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Folder name: <strong>kaizenflow-shield</strong></span>
          </div>
        </div>
      ),
    },
    {
      title: 'Open Extension Manager in Chrome',
      badge: 'Step 2',
      desc: 'In Chrome, click the three dots menu (⋮) → Extensions → Manage extensions, or copy the direct address below.',
      action: (
        <button
          onClick={copyUrl}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer"
        >
          {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copiedLink ? 'Copied to clipboard' : 'Copy: chrome://extensions'}</span>
        </button>
      ),
      images: [
        {
          src: '/guide/step1-menu.png',
          caption: '1. Click menu (⋮) → Extensions',
          highlight: {
            top: '71%',
            left: '2%',
            width: '96%',
            height: '14%',
            label: 'Click Extensions',
            badgePlacement: 'top',
          },
        },
        {
          src: '/guide/step2-manage.png',
          caption: '2. Click "Manage extensions"',
          highlight: {
            top: '10%',
            left: '2.5%',
            width: '37%',
            height: '38%',
            label: 'Click Manage extensions',
            badgePlacement: 'top',
          },
        },
      ],
    },
    {
      title: 'Enable Developer Mode in Top-Right Corner',
      badge: 'Step 3',
      desc: 'On the extensions page, toggle "Developer mode" ON at the top-right corner to reveal the load button.',
      images: [
        {
          src: '/guide/step3-devmode.png',
          caption: 'Turn the switch ON (top-right corner)',
          highlight: {
            top: '11%',
            left: '67%',
            width: '30%',
            height: '20%',
            label: 'Turn Switch ON',
            badgePlacement: 'bottom',
          },
        },
      ],
    },
    {
      title: 'Click "Load unpacked" & Select Folder',
      badge: 'Step 4',
      desc: 'Click "Load unpacked" on the top left, choose the unzipped "kaizenflow-shield" folder, and click "Select Folder" (or "Open").',
      images: [
        {
          src: '/guide/step4-loadunpacked.png',
          caption: '1. Click "Load unpacked"',
          highlight: {
            top: '34%',
            left: '2.8%',
            width: '28.5%',
            height: '21%',
            label: 'Click Load unpacked',
            badgePlacement: 'bottom',
          },
        },
        {
          src: '/guide/step5-selectfolder.png',
          caption: '2. Select "kaizenflow-shield" & click Select / Open',
          highlight: {
            top: '52%',
            left: '18%',
            width: '29%',
            height: '21%',
            label: 'Select folder',
            badgePlacement: 'bottom',
          },
        },
      ],
    },
    {
      title: 'Setup Complete — Lifetime Protection',
      badge: 'Step 5',
      desc: 'KaizenFlow Shield is now linked to your browser. You only do this once — it stays connected even after restarting Chrome or rebooting your computer.',
      images: [
        {
          src: '/guide/step7-extension-popup.png',
          caption: 'Extension active in Chrome',
        },
        {
          src: '/guide/step8-navbar-toggle.png',
          caption: 'Daily study: Toggle Shield in KaizenFlow navbar',
          highlight: {
            top: '12%',
            left: '5%',
            width: '90%',
            height: '76%',
            label: 'Shield Switch',
            badgePlacement: 'top',
          },
        },
      ],
      action: (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 text-xs text-[var(--text-primary)] space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Ready for Daily Focus Sessions</span>
          </div>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Chrome saves unpacked extensions permanently in your local user profile. When studying, simply flip the <strong>Shield</strong> toggle in the top bar to block social media across all tabs.
          </p>
        </div>
      ),
    },
  ];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[110] overflow-y-auto bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-5 pt-14 sm:pt-16 pb-10 text-center">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-7 shadow-2xl text-[var(--text-primary)] text-left my-auto flex flex-col max-h-[92vh] overflow-hidden"
        >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-[var(--border-subtle)] mb-3 sm:mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-2xs">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] font-sans">
                KaizenFlow Shield Setup Guide
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                One-time manual for Google Chrome, Brave, Edge & Chromium
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

        {/* Step Navigation Tabs */}
        <div className="grid grid-cols-5 gap-2 mb-4 shrink-0">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`p-2 sm:p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                activeStep === idx
                  ? 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-primary)] shadow-xs ring-1 ring-[var(--border-strong)]'
                  : 'bg-[var(--bg-surface-subtle)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                {s.badge}
              </div>
              <div className="text-xs font-semibold truncate mt-0.5">
                {idx === 0 ? 'Download' : idx === 1 ? 'Extensions' : idx === 2 ? 'Dev Mode' : idx === 3 ? 'Load Folder' : 'Complete'}
              </div>
            </button>
          ))}
        </div>

        {/* Step Content Area (Spacious & Compact Image View) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {steps[activeStep].badge} OF 5
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
              {steps[activeStep].title}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {steps[activeStep].desc}
            </p>
          </div>

          {/* Action button if present */}
          {steps[activeStep].action && (
            <div>
              {steps[activeStep].action}
            </div>
          )}

          {/* Compact Screenshots Grid */}
          {steps[activeStep].images && steps[activeStep].images!.length > 0 && (
            <div
              className={`grid gap-3 pt-1 ${
                steps[activeStep].images!.length === 3
                  ? 'grid-cols-1 sm:grid-cols-3'
                  : steps[activeStep].images!.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 max-w-xl mx-auto'
              }`}
            >
              {steps[activeStep].images!.map((img, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-2 overflow-hidden shadow-2xs flex flex-col justify-between"
                >
                  <div className="relative w-full rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-zinc-950 flex items-center justify-center min-h-[130px] max-h-[170px]">
                    <img
                      src={img.src}
                      alt={img.caption || ''}
                      className="w-full h-auto max-h-[170px] object-contain block mx-auto rounded-lg"
                    />

                    {/* Visual Focus Spotlight Highlight */}
                    {img.highlight && (
                      <div
                        style={{
                          top: img.highlight.top,
                          left: img.highlight.left,
                          width: img.highlight.width,
                          height: img.highlight.height,
                        }}
                        className="absolute pointer-events-none rounded-lg border-2 border-amber-500 bg-amber-500/20 ring-4 ring-amber-500/30 shadow-[0_0_24px_rgba(245,158,11,0.65)] animate-pulse"
                      >
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-zinc-950 font-bold text-[9px] sm:text-[10px] px-2 py-0.5 rounded shadow-lg flex items-center gap-1 z-30 ${
                            img.highlight.badgePlacement === 'bottom'
                              ? '-bottom-6'
                              : '-top-6'
                          }`}
                        >
                          <MousePointerClick className="h-3 w-3" />
                          <span>{img.highlight.label}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {img.caption && (
                    <div className="mt-2 text-center text-[11px] font-medium text-[var(--text-secondary)] flex items-center justify-center gap-1">
                      <span>{img.caption}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-[var(--border-subtle)] shrink-0">
          <button
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <div className="text-xs text-[var(--text-muted)] font-mono">
            Step {activeStep + 1} of {steps.length}
          </div>

          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-surface)] hover:opacity-90 text-xs font-semibold shadow-xs transition-opacity cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Got it, close guide</span>
              <Check className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  </div>,
  document.body
);
};
