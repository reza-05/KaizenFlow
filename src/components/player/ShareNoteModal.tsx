'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Share2, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Globe,
  MessageCircle,
  Send
} from 'lucide-react';

interface ShareNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  videoTitle: string;
}

export const ShareNoteModal: React.FC<ShareNoteModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  videoTitle,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out these AI lecture notes for "${videoTitle}":\n${shareUrl}`
  )}`;

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
    `AI Lecture Notes: ${videoTitle}`
  )}`;

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return createPortal(
    <div 
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-[var(--bg-surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4 my-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                লেকচার নোট শেয়ার করুন
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                বন্ধুরা লগইন ছাড়াই পুরো নোট ও কুইজ পড়তে পারবে
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Note Preview Box */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 text-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-0.5">
            Public Study Sheet
          </p>
          <p className="font-semibold text-[var(--text-primary)] line-clamp-1">
            {videoTitle}
          </p>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-[var(--text-secondary)]">
            শেয়ারেবল লিংক (Share Link):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-mono text-xs text-[var(--text-primary)] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-black" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 1-Click Social Sharing */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-[11px] font-bold text-[var(--text-secondary)]">
            সরাসরি বন্ধুদের মেসেজ পাঠান:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold text-xs hover:bg-emerald-500/20 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>

            {/* Telegram */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 font-semibold text-xs hover:bg-sky-500/20 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Telegram</span>
            </a>

            {/* Facebook */}
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 font-semibold text-xs hover:bg-blue-500/20 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Facebook</span>
            </a>
          </div>
        </div>

        {/* Open Public Page CTA */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-semibold text-[var(--text-primary)] hover:border-amber-500/50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-amber-500" />
            <span>পাবলিক পেজ প্রিভিউ দেখুন (Open Live Note)</span>
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
};
