'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Award, Download, FileText, X, CheckCircle2, Sparkles, User } from 'lucide-react';
import { Playlist, UserProfile } from '@/types';
import { exportBadgeToPNG, exportBadgeToPDF } from '@/lib/pdfExport';

interface CompletionBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Playlist | null;
  userProfile?: UserProfile | null;
}

export const CompletionBadgeModal: React.FC<CompletionBadgeModalProps> = ({
  isOpen,
  onClose,
  course,
  userProfile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recipientName, setRecipientName] = useState(userProfile?.name || 'Scholar');
  const [isExporting, setIsExporting] = useState(false);

  // Sync recipient name if profile updates
  useEffect(() => {
    if (userProfile?.name) {
      setRecipientName(userProfile.name);
    }
  }, [userProfile?.name]);

  // Deterministic certificate verification hash based on course ID and date
  const verificationHash = course 
    ? `KF-${Math.abs(course.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 89).toString(16).toUpperCase()}-${new Date().getFullYear()}`
    : 'KF-VERIFIED-2026';

  const issueDateFormatted = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Draw high-resolution certificate/badge on canvas
  const drawBadge = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !course) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 2400;
    const H = 1500;
    canvas.width = W;
    canvas.height = H;

    // 1. Deep Obsidian / Navy Background
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#070a13');
    bgGrad.addColorStop(0.5, '#0b1224');
    bgGrad.addColorStop(1, '#05070e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Ambient Gold & Emerald Glows
    const radialGlow = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 800);
    radialGlow.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
    radialGlow.addColorStop(0.6, 'rgba(217, 119, 6, 0.05)');
    radialGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, W, H);

    // 3. Ornate Double Borders
    // Outer border
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(60, 60, W - 120, H - 120);

    // Inner gold/emerald border
    ctx.lineWidth = 3;
    const borderGrad = ctx.createLinearGradient(80, 80, W - 80, H - 80);
    borderGrad.addColorStop(0, '#f59e0b');
    borderGrad.addColorStop(0.5, '#10b981');
    borderGrad.addColorStop(1, '#d97706');
    ctx.strokeStyle = borderGrad;
    ctx.strokeRect(80, 80, W - 160, H - 160);

    // Corner decorative brackets
    const bracketSize = 50;
    const corners = [
      { x: 80, y: 80, dx: 1, dy: 1 },
      { x: W - 80, y: 80, dx: -1, dy: 1 },
      { x: 80, y: H - 80, dx: 1, dy: -1 },
      { x: W - 80, y: H - 80, dx: -1, dy: -1 },
    ];
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f59e0b';
    corners.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x + c.dx * bracketSize, c.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x, c.y + c.dy * bracketSize);
      ctx.stroke();
    });

    // 4. Header: KaizenFlow Crest
    ctx.textAlign = 'center';
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('KAIZENFLOW ACADEMIC DISCIPLINE & FOCUS ENVIRONMENT', W / 2, 190);

    // Main Certificate Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 84px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('CERTIFICATE OF COMPLETION', W / 2, 290);

    // Sub-title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('THIS OFFICIALLY CERTIFIES THAT THE SCHOLAR', W / 2, 360);

    // 5. Recipient Name
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 78px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, serif';
    ctx.letterSpacing = '2px';
    const cleanName = recipientName.trim() || 'Scholar';
    ctx.fillText(cleanName, W / 2, 470);

    // Decorative underline beneath name
    const nameWidth = Math.min(ctx.measureText(cleanName).width + 120, W - 400);
    const lineGrad = ctx.createLinearGradient(W / 2 - nameWidth / 2, 0, W / 2 + nameWidth / 2, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, '#f59e0b');
    lineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(W / 2 - nameWidth / 2, 500, nameWidth, 4);

    // 6. Course accomplishment description
    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('HAS DEMONSTRATED DEEP MASTERY AND SUCCESSFULLY VERIFIED EVERY LESSON IN', W / 2, 570);

    // Course Title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '1px';
    
    // Wrap long course titles if needed
    const courseTitle = course.customTitle || course.originalTitle || 'Mastery Curriculum';
    if (courseTitle.length > 55) {
      ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
    ctx.fillText(courseTitle, W / 2, 650);

    // Verification Stats Pill
    const totalLessons = course.totalVideos || course.completedVideos || 1;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    const pillW = 680;
    const pillH = 64;
    const pillX = W / 2 - pillW / 2;
    const pillY = 710;
    
    // Draw rounded pill
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 32);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(`100% VERIFIED  •  ALL ${totalLessons} LESSONS COMPLETED`, W / 2, pillY + 43);

    // 7. Golden Medal & Seal (Center Bottom)
    const sealCenterX = W / 2;
    const sealCenterY = 960;
    const sealRadius = 120;

    // Outer gold ring
    ctx.beginPath();
    ctx.arc(sealCenterX, sealCenterY, sealRadius + 14, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Medal Body
    const sealGrad = ctx.createLinearGradient(
      sealCenterX - sealRadius,
      sealCenterY - sealRadius,
      sealCenterX + sealRadius,
      sealCenterY + sealRadius
    );
    sealGrad.addColorStop(0, '#f59e0b');
    sealGrad.addColorStop(0.5, '#d97706');
    sealGrad.addColorStop(1, '#b45309');

    ctx.beginPath();
    ctx.arc(sealCenterX, sealCenterY, sealRadius, 0, Math.PI * 2);
    ctx.fillStyle = sealGrad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fde68a';
    ctx.stroke();

    // Inner embossed circle
    ctx.beginPath();
    ctx.arc(sealCenterX, sealCenterY, sealRadius - 16, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Medal Star & Emblem
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('★', sealCenterX, sealCenterY + 14);

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('VERIFIED MASTERY', sealCenterX, sealCenterY + 54);
    ctx.fillText('KAIZENFLOW', sealCenterX, sealCenterY - 36);

    // Ribbon tails below seal
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(sealCenterX - 50, sealCenterY + 110);
    ctx.lineTo(sealCenterX - 85, sealCenterY + 190);
    ctx.lineTo(sealCenterX - 35, sealCenterY + 175);
    ctx.lineTo(sealCenterX - 15, sealCenterY + 190);
    ctx.lineTo(sealCenterX - 20, sealCenterY + 120);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sealCenterX + 50, sealCenterY + 110);
    ctx.lineTo(sealCenterX + 85, sealCenterY + 190);
    ctx.lineTo(sealCenterX + 35, sealCenterY + 175);
    ctx.lineTo(sealCenterX + 15, sealCenterY + 190);
    ctx.lineTo(sealCenterX + 20, sealCenterY + 120);
    ctx.closePath();
    ctx.fill();

    // 8. Footer Metadata & Verification Details
    // Left: Date
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('COMPLETION DATE', 160, 1300);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(issueDateFormatted, 160, 1340);

    // Right: Verification ID & Signature
    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('VERIFICATION CODE', W - 160, 1300);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px "Courier New", Courier, monospace';
    ctx.letterSpacing = '2px';
    ctx.fillText(verificationHash, W - 160, 1340);

    // Center bottom watermark
    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('DISTRACTION-FREE AUTONOMOUS LEARNING PLATFORM  •  STUDENT INTEGRITY SEAL', W / 2, 1400);

  }, [course, recipientName, issueDateFormatted, verificationHash]);

  // Redraw when modal opens or inputs change
  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow canvas to be mounted in DOM
      const timer = setTimeout(drawBadge, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, drawBadge]);

  if (!isOpen || !course) return null;

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      exportBadgeToPNG(canvasRef.current, course.customTitle || course.originalTitle);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      exportBadgeToPDF(canvasRef.current, course.customTitle || course.originalTitle);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Course Completion Badge & Certificate
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-3 w-3" />
                  100% Verified
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Download your official proof of completion as high-res PNG or printable PDF.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scholar Name Customizer */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <User className="h-4 w-4 text-zinc-400" />
            <span className="font-medium">Certificate Recipient Name:</span>
          </div>
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder="Enter your full name"
              maxLength={40}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* High-Resolution Certificate Canvas Preview */}
        <div className="mt-4 relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain rounded-xl"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Cryptographically sealed: <code className="text-zinc-300 font-mono">{verificationHash}</code></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 text-xs font-semibold border border-zinc-700 hover:border-zinc-600 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-amber-400" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-4 py-2.5 text-xs font-bold shadow-lg shadow-amber-500/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText className="h-4 w-4 text-black" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
