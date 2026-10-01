'use client';

import React, { useState } from 'react';
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
  warningNote?: string;
  images?: StepImage[];
  action?: React.ReactNode;
  note?: string;
}

export const SetupManualModal: React.FC<SetupManualModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  const steps: StepItem[] = [
    {
      title: 'Download & Extract Extension Package',
      badge: 'Step 1',
      desc: 'Download the official KaizenFlow Shield extension .zip file to your computer. Then double-click (or right-click → Extract) to unzip it into a regular folder.',
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
            <span>Extracts into folder: <strong>kaizenflow-shield</strong></span>
          </div>
        </div>
      ),
      note: 'After unzipping, keep the folder in your Downloads or Documents folder. You will select this folder in Step 4.',
    },
    {
      title: 'Open Extensions in Google Chrome',
      badge: 'Step 2',
      desc: 'In Google Chrome, click the 3-dot menu (⋮) at the top-right corner → Extensions → Manage extensions. Or copy and open chrome://extensions in a new tab.',
      images: [
        {
          src: '/guide/step1-menu.png',
          caption: '1. In Chrome menu, click "Extensions"',
          highlight: {
            top: '71%',
            left: '2%',
            width: '96%',
            height: '14%',
            label: 'Click "Extensions"',
            badgePlacement: 'top',
          },
        },
        {
          src: '/guide/step2-manage.png',
          caption: '2. In the sub-menu, click "Manage extensions"',
          highlight: {
            top: '10%',
            left: '2.5%',
            width: '37%',
            height: '38%',
            label: 'Click "Manage extensions"',
            badgePlacement: 'top',
          },
        },
      ],
      action: (
        <button
          onClick={copyUrl}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer"
        >
          {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copiedLink ? 'Copied URL to Clipboard' : 'Copy URL: chrome://extensions'}</span>
        </button>
      ),
    },
    {
      title: 'Enable Developer Mode in Top-Right Corner',
      badge: 'Step 3',
      desc: 'On the chrome://extensions page, look at the top-right corner and turn the "Developer mode" toggle switch ON. This unlocks the "Load unpacked" button.',
      warningNote: 'Notice: Ignore the search bar in the top-center of Chrome. Look specifically at the top-right corner toggle switch highlighted below.',
      images: [
        {
          src: '/guide/step3-devmode.png',
          caption: 'Toggle the "Developer mode" switch to ON (top-right corner)',
          highlight: {
            top: '11%',
            left: '67%',
            width: '30%',
            height: '20%',
            label: 'Turn this Switch ON',
            badgePlacement: 'bottom',
          },
        },
      ],
      note: 'Developer mode is a standard built-in feature of Google Chrome and Chromium browsers. It does not require any developer account or fee.',
    },
    {
      title: 'Click "Load unpacked" & Select Extension Folder',
      badge: 'Step 4',
      desc: 'Click the blue "Load unpacked" button in the top-left toolbar. In the file window, select your unzipped "kaizenflow-shield" folder and click "Select".',
      warningNote: 'Notice: Ignore the search bar at the top. Only click the highlighted "Load unpacked" button on the left.',
      images: [
        {
          src: '/guide/step4-loadunpacked.png',
          caption: '1. Click the blue "Load unpacked" button (top-left)',
          highlight: {
            top: '34%',
            left: '2.8%',
            width: '28.5%',
            height: '21%',
            label: 'Click "Load unpacked"',
            badgePlacement: 'bottom',
          },
        },
        {
          src: '/guide/step5-selectfolder.png',
          caption: '2. Click the unzipped "kaizenflow-shield" folder to select it',
          highlight: {
            top: '52%',
            left: '18%',
            width: '29%',
            height: '21%',
            label: 'Select "kaizenflow-shield"',
            badgePlacement: 'bottom',
          },
        },
        {
          src: '/guide/step6-selectbtn.png',
          caption: '3. Click the blue "Select" button to complete loading',
          highlight: {
            top: '23%',
            left: '59%',
            width: '31%',
            height: '48%',
            label: 'Click "Select"',
            badgePlacement: 'top',
          },
        },
      ],
      note: 'Important: Select the directory folder itself (the folder containing manifest.json), not the .zip archive.',
    },
    {
      title: 'Lifetime Permanent Protection (Zero Re-Setup Needed)',
      badge: 'Step 5',
      desc: 'KaizenFlow Shield is now permanently connected to your browser! You only do this setup once. Even after restarting Chrome or rebooting your computer, it stays active forever.',
      images: [
        {
          src: '/guide/step7-extension-popup.png',
          caption: 'Extension is now installed in Chrome and ready to protect your study sessions',
        },
        {
          src: '/guide/step8-navbar-toggle.png',
          caption: 'Daily Use: Simply flip the Shield toggle ON/OFF in KaizenFlow’s top bar',
          highlight: {
            top: '12%',
            left: '5%',
            width: '90%',
            height: '76%',
            label: 'Shield Toggle in KaizenFlow',
            badgePlacement: 'top',
          },
        },
      ],
      action: (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 text-xs text-[var(--text-primary)] space-y-2">
          <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>Frequently Asked Question:</span>
          </div>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            <strong>Do I have to do this every time?</strong><br />
            <strong>NO! Never again.</strong> Chrome saves unpacked extensions permanently in your local user profile.
            Whenever you sit down to study, simply click the <strong>Shield</strong> toggle in KaizenFlow’s top bar to turn focus mode ON or OFF!
          </p>
        </div>
      ),
      note: 'Zero network tracking. The extension runs 100% locally on your machine and only blocks distracting tabs when the Shield is active.',
    },
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-6 shadow-2xl text-[var(--text-primary)] flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-[var(--border-subtle)] mb-3 sm:mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-emerald-600 dark:text-emerald-400 shrink-0">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-[var(--text-primary)] font-sans">
                How to Setup KaizenFlow Shield?
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-secondary)]">
                Step-by-step visual guide for Chrome, Brave, Edge & Chromium
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

        {/* Step Navigation Tabs (Horizontal Scrollable on Mobile) */}
        <div className="flex sm:grid sm:grid-cols-5 gap-1.5 mb-3 sm:mb-4 shrink-0 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`min-w-[85px] sm:min-w-0 p-2 rounded-xl text-left border transition-all cursor-pointer shrink-0 ${
                activeStep === idx
                  ? 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-primary)] shadow-xs ring-1 ring-[var(--border-strong)]'
                  : 'bg-[var(--bg-surface-subtle)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
              }`}
            >
              <div className="text-[9px] uppercase tracking-wider font-semibold opacity-70">
                {s.badge}
              </div>
              <div className="text-[11px] font-medium truncate mt-0.5">
                {idx === 0 ? 'Download' : idx === 1 ? 'Extensions' : idx === 2 ? 'Dev Mode' : idx === 3 ? 'Load Folder' : 'Complete'}
              </div>
            </button>
          ))}
        </div>

        {/* Step Content Box */}
        <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1 scrollbar-thin">
          <div className="space-y-1">
            <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
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

          {/* Warning / Focus Notice if search bar or confusion might happen */}
          {steps[activeStep].warningNote && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 sm:p-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2.5">
              <span className="text-sm shrink-0">🎯</span>
              <span className="font-medium">{steps[activeStep].warningNote}</span>
            </div>
          )}

          {/* Screenshots with Target Focus Highlights */}
          {steps[activeStep].images && steps[activeStep].images!.length > 0 && (
            <div className="space-y-3 pt-1">
              {steps[activeStep].images!.map((img, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-2 sm:p-2.5 overflow-hidden shadow-xs"
                >
                  <div className="relative w-full rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-zinc-950">
                    <img
                      src={img.src}
                      alt={img.caption || ''}
                      className="w-full h-auto object-contain block mx-auto rounded-lg"
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
                          className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-zinc-950 font-bold text-[9px] sm:text-[11px] px-2 py-0.5 rounded shadow-lg flex items-center gap-1 z-30 ${
                            img.highlight.badgePlacement === 'bottom'
                              ? '-bottom-6 sm:-bottom-7'
                              : '-top-6 sm:-top-7'
                          }`}
                        >
                          <MousePointerClick className="h-3 w-3" />
                          <span>{img.highlight.label}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {img.caption && (
                    <div className="mt-2 text-center text-xs font-medium text-[var(--text-secondary)] flex items-center justify-center gap-1.5">
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">•</span>
                      <span>{img.caption}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Special Note */}
          {steps[activeStep].note && (
            <div className="rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2.5">
              <span className="text-base shrink-0">💡</span>
              <span>{steps[activeStep].note}</span>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 sm:pt-4 mt-2 sm:mt-3 border-t border-[var(--border-subtle)] shrink-0">
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
  );
};
