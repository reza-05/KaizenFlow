'use client';

import React, { useState } from 'react';
import { X, Download, Copy, Check, ChevronRight, ChevronLeft, HelpCircle, ShieldCheck, ExternalLink } from 'lucide-react';

interface SetupManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepItem {
  title: string;
  badge: string;
  desc: string;
  images?: { src: string; caption?: string }[];
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
      title: 'Download & Unzip Extension Package',
      badge: 'Step 1',
      desc: 'Download the official KaizenFlow Shield extension .zip archive to your computer. Then double-click (or right-click → Extract) to unzip it into a regular folder.',
      action: (
        <a
          href="/downloads/kaizenflow-shield.zip"
          download="kaizenflow-shield.zip"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-semibold shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Download kaizenflow-shield.zip</span>
        </a>
      ),
      note: 'After unzipping, keep the folder inside your Downloads or Documents folder. You will select this folder in Step 4.',
    },
    {
      title: 'Open Extension Manager in Chrome',
      badge: 'Step 2',
      desc: 'In Google Chrome (or Edge / Brave), click the 3-dot menu (⋮) in the top-right corner, navigate to Extensions, and select "Manage extensions". Alternatively, copy and paste chrome://extensions into your URL bar.',
      images: [
        {
          src: '/guide/step1-menu.png',
          caption: '1. Click Chrome 3-dot menu (⋮) → Extensions',
        },
        {
          src: '/guide/step2-manage.png',
          caption: '2. Click "Manage extensions"',
        },
      ],
      action: (
        <button
          onClick={copyUrl}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer"
        >
          {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copiedLink ? 'Copied URL to Clipboard!' : 'Copy: chrome://extensions'}</span>
        </button>
      ),
    },
    {
      title: 'Enable Developer Mode',
      badge: 'Step 3',
      desc: 'On the chrome://extensions page, look at the top-right corner and turn the "Developer mode" toggle switch ON. This unlocks the ability to load unpacked local extensions.',
      images: [
        {
          src: '/guide/step3-devmode.png',
          caption: 'Toggle switch located at the top-right corner of chrome://extensions',
        },
      ],
      note: 'Developer mode is a standard native feature of all Chromium browsers and does not require any developer license or payment.',
    },
    {
      title: 'Click "Load unpacked" & Select Extension Folder',
      badge: 'Step 4',
      desc: 'Click the blue "Load unpacked" button in the top-left toolbar. In the file picker, select your unzipped "kaizenflow-shield" folder and click the "Select" button.',
      images: [
        {
          src: '/guide/step4-loadunpacked.png',
          caption: '1. Click the "Load unpacked" button in the top-left',
        },
        {
          src: '/guide/step5-selectfolder.png',
          caption: '2. Select the unzipped "kaizenflow-shield" folder',
        },
        {
          src: '/guide/step6-selectbtn.png',
          caption: '3. Click the "Select" button to complete loading',
        },
      ],
      note: 'Important: Select the directory folder itself (the folder containing manifest.json), not the .zip archive.',
    },
    {
      title: 'Setup Complete — Lifetime Permanent Protection',
      badge: 'Step 5',
      desc: 'That’s it! KaizenFlow Shield is now registered with your browser. This is a one-time setup: even if you reboot your PC or restart Chrome, it remains permanently connected.',
      action: (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-emerald-300 flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-white">How to use during your study sessions:</p>
            <p className="text-zinc-300 leading-relaxed">
              Whenever you enter a Focus Session in KaizenFlow, just flip the <span className="font-semibold text-emerald-400">Shield toggle ON</span>.
              All distracting tabs (Facebook, Instagram, WhatsApp, TikTok, X, Reddit) across your entire browser will immediately show as offline (503 Service Unavailable) until you switch it off.
            </p>
          </div>
        </div>
      ),
      note: 'Zero tracking or external network requests. The extension only inspects local navigation URLs when you turn the shield on.',
    },
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7 shadow-2xl text-zinc-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
                How to Setup KaizenFlow Shield?
              </h2>
              <p className="text-xs text-zinc-400">
                Visual step-by-step manual for Google Chrome, Brave, Edge & Chromium
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-5 gap-1.5 mb-4 shrink-0">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                activeStep === idx
                  ? 'bg-zinc-900 border-emerald-500/50 text-white ring-1 ring-emerald-500/20'
                  : 'bg-zinc-950 border-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="text-[9px] font-mono uppercase tracking-wider font-semibold">
                {s.badge}
              </div>
              <div className="text-[11px] font-medium truncate mt-0.5">
                {idx === 0 ? 'Download' : idx === 1 ? 'Extensions' : idx === 2 ? 'Dev Mode' : idx === 3 ? 'Load Folder' : 'Done'}
              </div>
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-widest">
              {steps[activeStep].badge} OF 5
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {steps[activeStep].title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {steps[activeStep].desc}
            </p>
          </div>

          {/* Action button if present */}
          {steps[activeStep].action && (
            <div className="pt-0.5 pb-1">
              {steps[activeStep].action}
            </div>
          )}

          {/* Screenshots Display */}
          {steps[activeStep].images && steps[activeStep].images!.length > 0 && (
            <div className="space-y-3 pt-1">
              {steps[activeStep].images!.map((img, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 sm:p-2.5 overflow-hidden shadow-sm"
                >
                  <div className="relative w-full rounded-lg overflow-hidden border border-zinc-700/80 bg-zinc-950">
                    <img
                      src={img.src}
                      alt={img.caption || ''}
                      className="w-full h-auto object-contain max-h-[280px] mx-auto rounded-lg"
                    />
                  </div>
                  {img.caption && (
                    <div className="mt-2 text-center text-[11px] font-medium text-zinc-400">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Special Note */}
          {steps[activeStep].note && (
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-3 text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5">
              <span className="text-base shrink-0">💡</span>
              <span>{steps[activeStep].note}</span>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-zinc-800/80 shrink-0">
          <button
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <div className="text-[11px] font-mono text-zinc-500">
            Step {activeStep + 1} of {steps.length}
          </div>

          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Got it, close manual</span>
              <Check className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
