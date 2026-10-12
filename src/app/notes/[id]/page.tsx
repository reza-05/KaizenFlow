'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Download, 
  Share2, 
  CheckCircle2, 
  Copy, 
  Check, 
  Play, 
  Brain, 
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { AILectureNotes, LectureQuizQuestion, StudyNote } from '@/types';
import { exportNotesToPDF } from '@/lib/pdfExport';

export default function SharedNotePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteData, setNoteData] = useState<{
    videoId: string;
    videoTitle: string;
    courseTitle?: string;
    language: string;
    notes: AILectureNotes;
    viewsCount?: number;
  } | null>(null);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<{ [qIndex: number]: number }>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchNote = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/notes/share?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'নোটটি খুঁজে পাওয়া যায়নি।');
        }
        setNoteData(data.note);
      } catch (err: any) {
        setError(err.message || 'নোট লোড করতে সমস্যা হয়েছে।');
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleExportPDF = () => {
    if (!noteData) return;
    const { videoId, videoTitle, courseTitle, notes } = noteData;
    const studyNotes: StudyNote[] = [
      {
        id: 'overview',
        playlistId: 'shared',
        videoId,
        timestampSeconds: 0,
        timestampFormatted: '00:00',
        content: `**সারসংক্ষেপ (Overview)**\n${notes.summary}`,
        createdAt: new Date().toISOString(),
      },
      ...notes.keyTakeaways.map((takeaway, i) => ({
        id: `takeaway-${i}`,
        playlistId: 'shared',
        videoId,
        timestampSeconds: 0,
        timestampFormatted: 'Key Point',
        content: `• ${takeaway}`,
        createdAt: new Date().toISOString(),
      })),
      ...notes.chapters.map(c => ({
        id: `chap-${c.seconds}`,
        playlistId: 'shared',
        videoId,
        timestampSeconds: c.seconds,
        timestampFormatted: c.timestamp,
        content: `**${c.title}**\n${c.explanation}`,
        createdAt: new Date().toISOString(),
      })),
    ];

    exportNotesToPDF({
      courseTitle: courseTitle || 'KaizenFlow AI Study Notes',
      videoTitle,
      notes: studyNotes,
    });
  };

  // Helper for rendering scientific sub/superscripts
  const renderScientificText = (str: string) => {
    const parts = str.split(/(\$[^\$]+\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const content = part.slice(1, -1);
        const subSuperRegex = /([A-Za-z0-9\(\)]+)(?:_\{([^}]+)\}|_([0-9A-Za-z+-]+))?(?:\^\{([^}]+)\}|\^([0-9A-Za-z+-]+))?/g;
        const subParts: React.ReactNode[] = [];
        let m;
        let lastIdx = 0;

        while ((m = subSuperRegex.exec(content)) !== null) {
          if (m.index > lastIdx) {
            subParts.push(content.slice(lastIdx, m.index));
          }
          const base = m[1];
          const sub = m[2] || m[3];
          const sup = m[4] || m[5];

          subParts.push(
            <span key={m.index} className="inline-flex items-baseline font-mono text-[13px] font-semibold text-amber-500 mx-0.5">
              <span>{base}</span>
              {sub && <sub className="text-[10px] text-amber-600 dark:text-amber-400 font-bold -bottom-0.5">{sub}</sub>}
              {sup && <sup className="text-[10px] text-amber-600 dark:text-amber-400 font-bold -top-1">{sup}</sup>}
            </span>
          );
          lastIdx = m.index + m[0].length;
          if (m[0].length === 0) break;
        }

        if (lastIdx < content.length) {
          subParts.push(content.slice(lastIdx));
        }

        return <span key={i}>{subParts.length > 0 ? subParts : content}</span>;
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
        <p className="text-xs text-[var(--text-muted)] font-medium">লেকচার নোটস লোড করা হচ্ছে...</p>
      </div>
    );
  }

  if (error || !noteData) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center p-4 text-center">
        <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-3">
          <BookOpen className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-[var(--text-primary)]">নোট খুঁজে পাওয়া যায়নি</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
          {error || 'লিংকটি সঠিক নয় অথবা নোটটি রিমুভ করা হয়েছে।'}
        </p>
        <Link
          href="/"
          className="mt-4 px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] text-xs font-bold hover:opacity-90 transition-opacity"
        >
          KaizenFlow হোমে যান
        </Link>
      </div>
    );
  }

  const { videoId, videoTitle, courseTitle, notes } = noteData;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">হোম</span>
          </Link>
          <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-tight">KaizenFlow AI Study Sheet</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-500 font-extrabold uppercase">
                Verified Notes
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-semibold hover:border-[var(--text-primary)]/40 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-semibold hover:border-[var(--text-primary)]/40 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <Link
            href={`/?v=${videoId}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold shadow-md shadow-amber-500/20 hover:opacity-95 transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>সিনেমা প্লেয়ারে খুলুন</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {/* Banner Title */}
        <div className="space-y-2 border-b border-[var(--border-subtle)] pb-6">
          {courseTitle && (
            <p className="text-xs font-mono font-semibold text-amber-500 uppercase tracking-wider">
              {courseTitle}
            </p>
          )}
          <h1 className="text-xl sm:text-2xl font-black leading-tight text-[var(--text-primary)]">
            {videoTitle}
          </h1>
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] pt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>{notes.chapters.length} টি টাইমস্ট্যাম্প চ্যাপ্টার</span>
            </span>
            <span>&bull;</span>
            <span>৩টি অ্যাক্টিভ রিকল কুইজ</span>
            <span>&bull;</span>
            <span className="text-emerald-500 font-semibold">✓ হিউম্যানাইজড স্টাডি নোট</span>
          </div>
        </div>

        {/* Video Embed */}
        <div className="rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-black shadow-xl aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={videoTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* SECTION 1: Summary */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
            <BookOpen className="h-4 w-4" />
            <span>লেকচার সারসংক্ষেপ (Overview)</span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
            {renderScientificText(notes.summary)}
          </p>
        </div>

        {/* SECTION 2: Key Takeaways */}
        {notes.keyTakeaways && notes.keyTakeaways.length > 0 && (
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
              <BookOpen className="h-4 w-4" />
              <span>মূল শিক্ষণীয় বিষয় (Key Takeaways)</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {notes.keyTakeaways.map((takeaway, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs leading-relaxed"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 font-bold text-[11px]">
                    {idx + 1}
                  </span>
                  <div className="text-[var(--text-secondary)] font-medium">
                    {renderScientificText(takeaway)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: Timeline Chapters */}
        {notes.chapters && notes.chapters.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>চ্যাপ্টারওয়াইজ বিস্তারিত লেকচার নোটস</span>
              </h2>
            </div>

            <div className="space-y-3">
              {notes.chapters.map((chap, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-xs space-y-2 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {chap.title}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-amber-500 font-semibold">
                      {chap.timestamp}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                    {renderScientificText(chap.explanation)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: Active Recall Quiz */}
        {notes.quiz && notes.quiz.length > 0 && (
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-transparent to-amber-500/5 p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  অ্যাক্টিভ রিকল কুইজ (Active Recall Self-Test)
                </h3>
              </div>
              {isQuizSubmitted && (
                <button
                  type="button"
                  onClick={() => { setQuizAnswers({}); setIsQuizSubmitted(false); }}
                  className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-amber-500 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>পুনরায় দিন</span>
                </button>
              )}
            </div>

            <div className="space-y-5">
              {notes.quiz.map((q: LectureQuizQuestion, qIdx: number) => {
                const userSelected = quizAnswers[qIdx];
                const hasSelected = userSelected !== undefined;
                const isCorrect = userSelected === q.answerIndex;

                return (
                  <div key={qIdx} className="space-y-2.5">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      <span className="text-indigo-400 font-bold mr-1.5">{qIdx + 1}.</span>
                      {q.question}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((option: string, optIdx: number) => {
                        let btnStyle = 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]/40';

                        if (isQuizSubmitted) {
                          if (optIdx === q.answerIndex) {
                            btnStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold';
                          } else if (userSelected === optIdx) {
                            btnStyle = 'border-red-500 bg-red-500/15 text-red-400';
                          }
                        } else if (userSelected === optIdx) {
                          btnStyle = 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isQuizSubmitted}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                          >
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>

                    {isQuizSubmitted && (
                      <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/10 border-red-500/20 text-red-300'
                      }`}>
                        <span className="font-bold mr-1">
                          {isCorrect ? '✓ সঠিক উত্তর!' : '✗ ভুল উত্তর।'}
                        </span>
                        <span>{q.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!isQuizSubmitted && (
              <button
                type="button"
                disabled={Object.keys(quizAnswers).length === 0}
                onClick={() => setIsQuizSubmitted(true)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-40 transition-all cursor-pointer"
              >
                উত্তর সাবমিট করুন ও ফলাফল দেখুন
              </button>
            )}
          </div>
        )}

        {/* Viral Bottom Footer CTA */}
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-6 text-center space-y-3 shadow-lg">
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-amber-500 text-black">
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            যেকোনো ইউটিউব প্লেলিস্টের নোট বানাতে চান?
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            KaizenFlow-তে যেকোনো ইউটিউব ভিডিওর লিংক পেস্ট করে সম্পূর্ণ বিনামূল্যে ডিস্ট্রাকশন-ফ্রি প্লেয়ার ও এআই লেকচার শিট পান।
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 hover:opacity-95 transition-all"
            >
              <span>ফ্রি স্টাডি শুরু করুন (Try KaizenFlow Free)</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
