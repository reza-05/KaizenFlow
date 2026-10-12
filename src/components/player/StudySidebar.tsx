'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Play, 
  ListVideo, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  Clock,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code2,
  KeyRound,
  Settings,
  X,
  AlertCircle,
  Search,
  Brain,
  RotateCcw,
  CheckCircle,
  XCircle,
  Music,
  Tv,
  Crown,
  Zap
} from 'lucide-react';
import { VideoItem, StudyNote, AILectureNotes, LectureNoteChapter, LectureQuizQuestion } from '@/types';
import { exportNotesToPDF } from '@/lib/pdfExport';
import { humanizeBengaliText, humanizeLectureNotes } from '@/lib/bengaliHumanizer';
import { 
  getAiNotesQuotaStatus, 
  consumeAiNotesQuota, 
  setSubscriptionTier, 
  AiNotesQuotaStatus 
} from '@/lib/storage';
import { BkashNagadCheckoutModal } from '@/components/payment/BkashNagadCheckoutModal';

interface StudySidebarProps {
  playlistId: string;
  videos: VideoItem[];
  currentVideoId: string;
  onSelectVideo: (video: VideoItem) => void;
  verifiedMap: Record<string, boolean>;
  notes: StudyNote[];
  onAddNote: (content: string, timestampSeconds: number) => void;
  onAddNotesBulk?: (items: { content: string; timestampSeconds: number }[]) => void;
  onDeleteNote: (noteId: string) => void;
  activeTimestampSeconds: number;
  courseTitle?: string;
  videoTitle?: string;
}

export const StudySidebar: React.FC<StudySidebarProps> = ({
  playlistId,
  videos,
  currentVideoId,
  onSelectVideo,
  verifiedMap,
  notes,
  onAddNote,
  onAddNotesBulk,
  onDeleteNote,
  activeTimestampSeconds,
  courseTitle,
  videoTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'ai_notes' | 'notes'>('queue');
  const [newNoteContent, setNewNoteContent] = useState<string>('');

  // AI Notes State
  const [aiNotes, setAiNotes] = useState<AILectureNotes | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiLanguage, setAiLanguage] = useState<'en' | 'bn' | 'hi' | 'mixed'>('bn');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedAllNotes, setCopiedAllNotes] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // In-Note Search & Active Recall Quiz State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);

  // Subscription & Daily Quota State
  const [quota, setQuota] = useState<AiNotesQuotaStatus>({
    used: 0,
    max: 3,
    remaining: 3,
    isPro: false,
    canGenerate: true,
  });
  const [showPaywallModal, setShowPaywallModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // Load quota status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQuota(getAiNotesQuotaStatus());
    }
  }, []);

  // Load cached AI notes when video or language changes
  useEffect(() => {
    setAiError(null);
    setSearchQuery('');
    setQuizAnswers({});
    setIsQuizSubmitted(false);

    if (typeof window !== 'undefined' && currentVideoId) {
      const cacheKey = `kaizenflow_ai_notes_${currentVideoId}_${aiLanguage}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const humanized = (aiLanguage === 'bn' || aiLanguage === 'mixed')
            ? humanizeLectureNotes(parsed)
            : parsed;
          setAiNotes(humanized);
          return;
        } catch {}
      }
      setAiNotes(null);
    }
  }, [currentVideoId, aiLanguage]);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    onAddNote(newNoteContent.trim(), activeTimestampSeconds);
    setNewNoteContent('');
  };

  const handleExportNotes = () => {
    if (notes.length === 0) return;
    const currentVideo = videos.find(v => v.ytVideoId === currentVideoId);
    exportNotesToPDF({
      courseTitle: courseTitle || 'Course Study Notes',
      videoTitle: videoTitle || currentVideo?.title || 'Lesson Notes',
      notes,
    });
  };

  // Trigger seek on player when timestamp is clicked
  const handleSeek = (seconds: number) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kaizenflow-seek-to', { detail: { seconds } }));
    }
  };

  // Copy code to clipboard with visual feedback
  const handleCopyCode = (code: string, id: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }
  };

  // Copy entire AI notes into My Notes tab
  const handleImportAIToMyNotes = () => {
    if (!aiNotes) return;
    const items = aiNotes.chapters.map(ch => {
      const cleanExp = (ch.explanation || '').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
      let content = `**${ch.title}**\n${cleanExp}`;
      if (ch.codeSnippet) {
        const cleanSnippet = ch.codeSnippet.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
        content += `\n\`\`\`${ch.codeLanguage || ''}\n${cleanSnippet}\n\`\`\``;
      }
      return { content, timestampSeconds: ch.seconds };
    });

    if (onAddNotesBulk) {
      onAddNotesBulk(items);
    } else {
      items.forEach(it => onAddNote(it.content, it.timestampSeconds));
    }

    setCopiedAllNotes(true);
    setTimeout(() => setCopiedAllNotes(false), 2500);
    setActiveTab('notes');
  };

  // Generate Real Lecture Notes from backend (with optional user force override)
  const handleGenerateAINotes = async (force: boolean = false) => {
    // Check if daily quota is available (unless user is Pro)
    const currentQuota = getAiNotesQuotaStatus();
    if (!currentQuota.canGenerate) {
      setShowPaywallModal(true);
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);

    const currentVideo = videos.find(v => v.ytVideoId === currentVideoId);
    const targetTitle = videoTitle || currentVideo?.title || 'Video Lecture';

    try {
      const res = await fetch('/api/lecture-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: currentVideoId,
          videoTitle: targetTitle,
          courseTitle: courseTitle || '',
          language: aiLanguage,
          forceGenerate: force,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate lecture notes');
      }

      const generated: AILectureNotes = await res.json();
      const humanized = (aiLanguage === 'bn' || aiLanguage === 'mixed')
        ? humanizeLectureNotes(generated)
        : generated;
      setAiNotes(humanized);

      // Consume 1 quota credit upon successful note creation
      consumeAiNotesQuota();
      setQuota(getAiNotesQuotaStatus());

      // Save to local cache
      if (typeof window !== 'undefined') {
        const cacheKey = `kaizenflow_ai_notes_${currentVideoId}_${aiLanguage}`;
        localStorage.setItem(cacheKey, JSON.stringify(humanized));
      }
    } catch (err: any) {
      console.error('AI Notes Generation error:', err);
      setAiError(err.message || 'Could not process lecture notes for this video.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Upgrade user to KaizenFlow Pro
  const handleUpgradeToPro = () => {
    setSubscriptionTier('pro');
    setQuota(getAiNotesQuotaStatus());
    setShowPaywallModal(false);
  };

  // Downgrade to Free plan (For developer/testing quota limits)
  const handleDowngradeToFree = () => {
    setSubscriptionTier('free');
    setQuota(getAiNotesQuotaStatus());
  };

  const currentMins = Math.floor(activeTimestampSeconds / 60);
  const currentSecs = activeTimestampSeconds % 60;
  const currentTimestampFormatted = `${currentMins}:${currentSecs < 10 ? '0' : ''}${currentSecs}`;

  // Procedural active recall quiz generator fallback if backend didn't supply one
  const getOrGenerateQuiz = (notes: AILectureNotes): LectureQuizQuestion[] => {
    if (notes.quiz && notes.quiz.length >= 2) {
      return notes.quiz;
    }

    const questions: LectureQuizQuestion[] = [];
    const chapters = notes.chapters || [];
    const takeaways = notes.keyTakeaways || [];

    if (chapters.length > 0) {
      const ch0 = chapters[0];
      questions.push({
        question: humanizeBengaliText(`লেকচারের শুরুতে [${ch0.timestamp}] কোন মূল বিষয়ে আলোচনা করা হয়েছে?`),
        options: [
          humanizeBengaliText(ch0.title),
          humanizeBengaliText(chapters[1]?.title || 'কোর্স ওভারভিউ ও প্রাথমিক ধারণা'),
          'অ্যাডভান্সড সিস্টেম আর্কিটেকচার',
          'এক্সটার্নাল ডিপেনডেন্সি সেটআপ'
        ],
        answerIndex: 0,
        explanation: humanizeBengaliText(`লেকচারের শুরুতেই [${ch0.timestamp}] "${ch0.title}" নিয়ে বিস্তারিত ধারণা দেওয়া হয়েছে।`)
      });
    }

    if (takeaways.length > 0) {
      const t0 = takeaways[0];
      questions.push({
        question: humanizeBengaliText('এই ক্লাসের অন্যতম গুরুত্বপূর্ণ মূল নিয়ম বা পরীক্ষা সতর্কতা কোনটি?'),
        options: [
          'সব ক্ষেত্রে ডিফল্ট অপশন অপরিবর্তিত রাখা',
          humanizeBengaliText(t0),
          'কনসেপ্ট না বুঝে কেবল আউটপুট মুখস্থ করা',
          'তাত্ত্বিক ভিত্তি বাদ দিয়ে সমাপ্ত করা'
        ],
        answerIndex: 1,
        explanation: humanizeBengaliText(`লেকচারের মূল টেকঅ্যাওয়ে হলো: "${t0}"`)
      });
    }

    if (chapters.length > 1) {
      const chLast = chapters[chapters.length - 1];
      questions.push({
        question: humanizeBengaliText(`লেকচারের পরবর্তী অংশে [${chLast.timestamp}] "${chLast.title}" বিষয়ে কী বোঝানো হয়েছে?`),
        options: [
          'কোনো সমাধান ছাড়াই ক্লাস শেষ করা',
          'পূর্বের সব নিয়ম পরিবর্তন করে নতুন শুরু করা',
          humanizeBengaliText(chLast.explanation.slice(0, 65) + (chLast.explanation.length > 65 ? '...' : '')),
          'পরবর্তী ক্লাসে একই প্রাথমিক বিষয় পুনরাবৃত্তি'
        ],
        answerIndex: 2,
        explanation: humanizeBengaliText(`অধ্যায়ে "${chLast.title}" নিয়ে বাস্তব প্রয়োগ ও সহজ সমাধান তুলে ধরা হয়েছে।`)
      });
    }

    return questions;
  };

  // Helper to convert LaTeX / chemical / scientific sub & sup notation
  const toScientificString = (text: string): string => {
    if (!text) return '';
    let s = (aiLanguage === 'bn' || aiLanguage === 'mixed') ? humanizeBengaliText(text) : text;

    // 1. Math symbols & LaTeX macros
    s = s.replace(/\\times/g, '×')
         .replace(/\\div/g, '÷')
         .replace(/\\pm/g, '±')
         .replace(/\\approx/g, '≈')
         .replace(/\\neq/g, '≠')
         .replace(/\\leq?/g, '≤')
         .replace(/\\geq?/g, '≥')
         .replace(/\\(?:rightarrow|to)/g, '→')
         .replace(/\\(?:leftarrow)/g, '←')
         .replace(/\\(?:leftrightarrow|iff)/g, '↔')
         .replace(/\\(?:Rightarrow|implies)/g, '⇒')
         .replace(/\\alpha/g, 'α')
         .replace(/\\beta/g, 'β')
         .replace(/\\gamma/g, 'γ')
         .replace(/\\Delta/g, 'Δ')
         .replace(/\\delta/g, 'δ')
         .replace(/\\lambda/g, 'λ')
         .replace(/\\pi/g, 'π')
         .replace(/\\sigma/g, 'σ')
         .replace(/\\mu/g, 'μ')
         .replace(/\\theta/g, 'θ')
         .replace(/\\infty/g, '∞')
         .replace(/\\degree/g, '°');

    // Strip math delimiters: $...$, \(...\), \[...\]
    s = s.replace(/\\\[([\s\S]*?)\\\]/g, '$1')
         .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
         .replace(/\$([^\$]+)\$/g, '$1');

    const parseSuper = (str: string): string => {
      let res = str.replace(/\^{([^}]+)}/g, '<sup>$1</sup>');
      res = res.replace(/\^([+-]?[0-9]+|[a-zA-Z]+)/g, '<sup>$1</sup>');
      return res;
    };

    // 2. Subscript with braces: _{...} (with nested superscripts supported e.g. d_{x^2-y^2})
    s = s.replace(/_\{([^}]+)\}/g, (_, inner) => '<sub>' + parseSuper(inner) + '</sub>');

    // 3. Superscript with braces: ^{...}
    s = s.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');

    // 4. Subscript without braces: _([0-9]+|[a-z]+) e.g. d_xy, d_yz, d_zx, H_2O, v_0
    s = s.replace(/_([0-9]+|[a-z]+)/g, '<sub>$1</sub>');

    // 5. Superscript without braces: ^([+-]?[0-9]+|[a-zA-Z]+) e.g. x^2, z^2
    s = s.replace(/\^([+-]?[0-9]+|[a-zA-Z]+)/g, '<sup>$1</sup>');

    // 6. Common chemical formulas without underscores: e.g. H2O, CO2, CaCO3, H2SO4
    s = s.replace(/([A-Z][a-z]?)([0-9]+)(?=[A-Z\s,()+\-।|]|$)/g, (m, el, num) => {
      const skip = ['UTF', 'MP', 'SHA', 'RGB', 'IP'];
      if (skip.includes(el)) return m;
      return el + '<sub>' + num + '</sub>';
    });

    return s;
  };

  interface MathNode {
    type: 'text' | 'sub' | 'sup';
    content?: string;
    children?: MathNode[];
  }

  const parseMathToNodes = (html: string): MathNode[] => {
    const tagRegex = /<(sub|sup)>([\s\S]*?)<\/\1>/g;
    const nodes: MathNode[] = [];
    let lastIdx = 0;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      if (match.index > lastIdx) {
        nodes.push({ type: 'text', content: html.slice(lastIdx, match.index) });
      }
      nodes.push({
        type: match[1] as 'sub' | 'sup',
        children: parseMathToNodes(match[2]),
      });
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < html.length) {
      nodes.push({ type: 'text', content: html.slice(lastIdx) });
    }

    return nodes;
  };

  const renderMathNodes = (nodes: MathNode[], keyPrefix = 'sci'): React.ReactNode[] => {
    return nodes.map((node, i) => {
      const key = `${keyPrefix}-${i}`;
      if (node.type === 'sub') {
        return (
          <sub key={key} className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 align-sub leading-none">
            {renderMathNodes(node.children || [], `${key}-sub`)}
          </sub>
        );
      }
      if (node.type === 'sup') {
        return (
          <sup key={key} className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 align-super leading-none">
            {renderMathNodes(node.children || [], `${key}-sup`)}
          </sup>
        );
      }
      return node.content || '';
    });
  };

  const renderScientificText = (text: string): React.ReactNode => {
    if (!text) return null;
    const html = toScientificString(text);
    const nodes = parseMathToNodes(html);
    return renderMathNodes(nodes);
  };

  // Helper to format inline bold **bold**, inline code `code`, and scientific superscripts/subscripts
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-[var(--text-primary)]">
            {renderScientificText(part.slice(2, -2))}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] font-mono text-[10.5px] text-amber-500 font-medium">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={i}>{renderScientificText(part)}</React.Fragment>;
    });
  };

  const renderTextParagraphs = (text: string, prefixKey: string) => {
    const lines = text.split('\n');
    return (
      <div key={prefixKey} className="space-y-1.5 text-xs text-[var(--text-secondary)]">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-0.5" />;

          // Heading line (e.g. **Topic Title**)
          if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
            return (
              <h5 key={idx} className="text-xs font-bold text-[var(--text-primary)] pt-1 pb-0.5 border-b border-[var(--border-subtle)]/60">
                {trimmed.slice(2, -2)}
              </h5>
            );
          }

          // Bullet item
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
            const bulletText = trimmed.replace(/^[-•*]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 leading-relaxed">
                <span className="text-amber-500 font-bold shrink-0 mt-0.5">&bull;</span>
                <span>{renderInlineFormatting(bulletText)}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="leading-relaxed whitespace-pre-wrap">
              {renderInlineFormatting(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper to render markdown bold, inline code, bullets, and code blocks inside personal notes
  const renderNoteCardContent = (content: string, noteId: string) => {
    const clean = (content || '')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '');

    // Split by code block regex: ```lang\ncode``` (handles loose syntax and missing trailing backticks)
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)[^\n]*\r?\n([\s\S]*?)(?:```|$)/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(clean)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = clean.slice(lastIndex, match.index);
        elements.push(renderTextParagraphs(textBefore, `text-${noteId}-${lastIndex}`));
      }

      const lang = match[1] || 'code';
      const rawCode = match[2] || '';
      const code = rawCode.replace(/\\n/g, '\n').replace(/\\t/g, '  ').trim();
      const codeKey = `${noteId}-code-${match.index}`;

      elements.push(
        <div key={codeKey} className="relative rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-[11px] text-zinc-100 overflow-x-auto my-2 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800/80 text-[10px] text-zinc-400">
            <span className="uppercase font-bold tracking-wider">{lang}</span>
            <button
              type="button"
              onClick={() => handleCopyCode(code, codeKey)}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              {copiedCodeId === codeKey ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedCodeId === codeKey ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="leading-relaxed"><code>{code}</code></pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
      if (match[0].length === 0) break;
    }

    if (lastIndex < clean.length) {
      const remaining = clean.slice(lastIndex);
      elements.push(renderTextParagraphs(remaining, `text-${noteId}-end`));
    }

    return elements;
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xs overflow-hidden">
      {/* 3-Tab Header Switcher */}
      <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/50">
        {/* Tab 1: Queue */}
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${
            activeTab === 'queue'
              ? 'border-b-2 border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ListVideo className="h-3.5 w-3.5" />
          <span>Queue ({videos.length})</span>
        </button>

        {/* Tab 2: AI Notes */}
        <button
          onClick={() => setActiveTab('ai_notes')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors relative ${
            activeTab === 'ai_notes'
              ? 'border-b-2 border-amber-500 bg-[var(--bg-surface)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>AI Notes</span>
          {aiNotes && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 absolute top-2 right-2" />
          )}
        </button>

        {/* Tab 3: My Notes */}
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${
            activeTab === 'notes'
              ? 'border-b-2 border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>My Notes ({notes.length})</span>
        </button>
      </div>

      {/* TAB 1: Course Queue */}
      {activeTab === 'queue' && (
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
          {videos.map((vid, idx) => {
            const isPlaying = vid.ytVideoId === currentVideoId;
            const isVerified = Boolean(verifiedMap[`${playlistId}_${vid.ytVideoId}`] || verifiedMap[vid.ytVideoId]);

            return (
              <button
                key={vid.id || idx}
                onClick={() => onSelectVideo(vid)}
                className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                  isPlaying 
                    ? 'bg-[var(--bg-surface-subtle)] font-medium' 
                    : 'hover:bg-[var(--bg-surface-subtle)]/50'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                  ) : isPlaying ? (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)]">
                      <Play className="h-2.5 w-2.5 fill-current" />
                    </div>
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center font-mono text-[10px] text-[var(--text-muted)]">
                      {idx + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug truncate ${
                    isPlaying ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  }`}>
                    {vid.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)] font-mono">
                    <span>{vid.durationFormatted}</span>
                    {isVerified && <span className="text-[#059669] font-medium font-sans">&bull; Verified</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 2: AI Smart Lecture Notes */}
      {activeTab === 'ai_notes' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-canvas)]">
          {/* Subheader Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[var(--text-muted)]">Language:</span>
              <select
                value={aiLanguage}
                onChange={e => setAiLanguage(e.target.value as any)}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1 text-[11px] text-[var(--text-primary)] focus:outline-none font-medium"
              >
                <option value="bn">বাংলা (Bengali - Default)</option>
                <option value="en">English (ইংরেজি)</option>
                <option value="mixed">Mixed (বাংলা + English Terms)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>

            {/* Actions & Quota / Pro Badge */}
            <div className="flex items-center gap-1.5">
              {quota.isPro ? (
                <button
                  type="button"
                  onClick={() => setShowPaywallModal(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-[10.5px] cursor-pointer hover:opacity-90"
                  title="KaizenFlow Pro Active - Unlimited AI Notes"
                >
                  <Crown className="h-3 w-3 fill-current text-amber-500" />
                  <span>PRO{quota.daysRemaining ? ` (${quota.daysRemaining}d)` : ''}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPaywallModal(true)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10.5px] font-semibold transition-colors cursor-pointer ${
                    quota.remaining === 0
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 animate-pulse'
                      : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]/40'
                  }`}
                  title="Click to view KaizenFlow Pro plans"
                >
                  <Zap className="h-3 w-3 text-amber-500 fill-amber-500/40" />
                  <span>{quota.remaining}/{quota.max} Left</span>
                </button>
              )}

              {aiNotes && (
                <>
                  {aiNotes.isEducational !== false && (
                    <button
                      type="button"
                      onClick={handleImportAIToMyNotes}
                      title="Add all notes to personal notes tab"
                      className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-surface-subtle)] text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
                    >
                      {copiedAllNotes ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedAllNotes ? 'Added!' : 'Save All'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleGenerateAINotes(false)}
                    disabled={isGeneratingAI}
                    title="Regenerate lecture notes"
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* AI Notes Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* Error Message */}
            {aiError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{aiError}</p>
              </div>
            )}

            {/* STATE 1: Empty / Not Generated Yet */}
            {!aiNotes && !isGeneratingAI && (
              <div className="flex flex-col items-center justify-center text-center p-6 my-4 border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-3">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)]">
                  Instant AI Lecture Notes
                </h4>
                <p className="text-[11px] text-[var(--text-muted)] max-w-xs mt-1 mb-4 leading-relaxed">
                  Extracted directly from the instructor&apos;s verbatim speech with clickable timestamps, code snippets, and core formulas.
                </p>
                <button
                  type="button"
                  onClick={() => handleGenerateAINotes(false)}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] px-4 py-2 text-xs font-semibold hover:opacity-90 shadow-xs transition-opacity cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Generate Real Lecture Notes</span>
                </button>
              </div>
            )}

            {/* STATE 2: Loading / Generating Shimmer */}
            {isGeneratingAI && (
              <div className="space-y-3 py-6 text-center">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 animate-spin mb-2">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] animate-pulse">
                  Extracting Lecture Ground Truth...
                </h4>
                <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto">
                  Parsing verbatim transcript, matching official chapters, and structuring code blocks.
                </p>
                <div className="space-y-2 mt-4 max-w-xs mx-auto">
                  <div className="h-3 bg-[var(--bg-surface-subtle)] rounded animate-pulse w-3/4 mx-auto" />
                  <div className="h-3 bg-[var(--bg-surface-subtle)] rounded animate-pulse w-1/2 mx-auto" />
                </div>
              </div>
            )}

            {/* STATE 3: Non-Educational Content Warning Card */}
            {aiNotes && !isGeneratingAI && aiNotes.isEducational === false && (
              <div className="flex flex-col items-center justify-center text-center p-6 my-4 border border-amber-500/30 rounded-xl bg-amber-500/5 space-y-3.5 shadow-2xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30 mb-1">
                  {aiNotes.contentType === 'music_entertainment' ? <Music className="h-6 w-6" /> : <Tv className="h-6 w-6" />}
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">
                    নন-এডুকেশনাল কনটেন্ট শনাক্ত হয়েছে
                  </h4>
                  <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
                    {renderInlineFormatting(aiNotes.nonEducationalReason || aiNotes.summary)}
                  </p>
                </div>

                <div className="w-full max-w-xs pt-1 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateAINotes(true)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] px-3.5 py-2 text-xs font-semibold hover:opacity-90 shadow-xs transition-opacity cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>Force Generate Notes Anyway</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('notes')}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Take Personal Notes Instead</span>
                  </button>
                </div>
              </div>
            )}

            {/* STATE 4: Educational Notes Ready & Displayed */}
            {aiNotes && !isGeneratingAI && aiNotes.isEducational !== false && (
              <div className="space-y-4">
                {/* Executive Summary Card */}
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)] mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Lecture Overview</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {renderInlineFormatting(aiNotes.summary)}
                  </p>
                  {aiNotes.isRealTranscriptGrounded && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 pt-2 border-t border-[var(--border-subtle)]">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Grounded in verbatim video speech (Zero Hallucination)</span>
                    </div>
                  )}
                </div>

                {/* In-Note Topic Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search topics, formulas, code..."
                    className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-8 pr-7 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-amber-500 focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Chapter-by-Chapter Breakdown */}
                {(() => {
                  const filteredChapters = (aiNotes.chapters || []).filter(ch => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      ch.title.toLowerCase().includes(q) ||
                      ch.explanation.toLowerCase().includes(q) ||
                      (ch.codeSnippet && ch.codeSnippet.toLowerCase().includes(q)) ||
                      (ch.keyPoints && ch.keyPoints.some(kp => kp.toLowerCase().includes(q)))
                    );
                  });

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                        <span>Timestamped Breakdown</span>
                        <span>{filteredChapters.length} / {aiNotes.chapters.length} Topics</span>
                      </div>

                      {filteredChapters.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-[var(--border-subtle)] rounded-lg">
                          <p className="text-xs text-[var(--text-muted)]">No sections found matching &ldquo;{searchQuery}&rdquo;</p>
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="mt-2 text-xs text-amber-500 hover:underline font-semibold cursor-pointer"
                          >
                            Clear search filter
                          </button>
                        </div>
                      ) : (
                        filteredChapters.map(ch => (
                          <div
                            key={ch.id}
                            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-2xs space-y-2 hover:border-[var(--text-primary)]/40 transition-colors"
                          >
                            {/* Chapter Header & Jump Timestamp */}
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleSeek(ch.seconds)}
                                className="flex items-center gap-1 font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                title="Click to jump video to this second"
                              >
                                <Play className="h-2.5 w-2.5 fill-current" />
                                <span>[{ch.timestamp}]</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const cleanExp = (ch.explanation || '').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
                                  let noteText = `**${ch.title}**\n${cleanExp}`;
                                  if (ch.codeSnippet) {
                                    const cleanSnippet = ch.codeSnippet.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
                                    noteText += `\n\`\`\`${ch.codeLanguage || ''}\n${cleanSnippet}\n\`\`\``;
                                  }
                                  onAddNote(noteText, ch.seconds);
                                }}
                                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Save this specific chapter to My Notes"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Add to My Notes</span>
                              </button>
                            </div>

                            <h5 className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                              {renderInlineFormatting(ch.title)}
                            </h5>

                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                              {renderInlineFormatting(ch.explanation)}
                            </p>

                            {/* Code Snippet Box (if instructor wrote code) */}
                            {ch.codeSnippet && (
                              <div className="relative rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-100 overflow-x-auto mt-2">
                                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-zinc-800 text-[10px] text-zinc-400">
                                  <span className="uppercase font-bold tracking-wider">{ch.codeLanguage || 'code'}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(ch.codeSnippet!, ch.id)}
                                    className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {copiedCodeId === ch.id ? (
                                      <Check className="h-3 w-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                    <span>{copiedCodeId === ch.id ? 'Copied' : 'Copy'}</span>
                                  </button>
                                </div>
                                <pre className="leading-relaxed">
                                  <code>{ch.codeSnippet}</code>
                                </pre>
                              </div>
                            )}

                            {/* Key Points */}
                            {ch.keyPoints && ch.keyPoints.length > 0 && (
                              <ul className="space-y-1 pt-1">
                                {ch.keyPoints.map((kp, kIdx) => (
                                  <li key={kIdx} className="text-[11px] text-[var(--text-secondary)] flex items-start gap-1.5">
                                    <span className="text-amber-500 font-bold">&bull;</span>
                                    <span>{renderInlineFormatting(kp)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}

                {/* Key Takeaways & Traps */}
                {aiNotes.keyTakeaways && aiNotes.keyTakeaways.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                    <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <span>💡 Core Insights & Exam Traps</span>
                    </h5>
                    <ul className="space-y-1.5">
                      {aiNotes.keyTakeaways.map((kt, idx) => (
                        <li key={idx} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">✓</span>
                          <span>{renderInlineFormatting(kt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Active Recall 3-Question Mini Quiz */}
                {(() => {
                  const quizQuestions = getOrGenerateQuiz(aiNotes);
                  if (quizQuestions.length === 0) return null;

                  return (
                    <div className="rounded-xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-3.5 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Brain className="h-4 w-4 text-indigo-500" />
                          <h5 className="text-xs font-bold text-[var(--text-primary)]">
                            Active Recall Check ({quizQuestions.length} Questions)
                          </h5>
                        </div>
                        {isQuizSubmitted ? (
                          <button
                            type="button"
                            onClick={() => {
                              setQuizAnswers({});
                              setIsQuizSubmitted(false);
                            }}
                            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-500 hover:underline cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Retake</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {Object.keys(quizAnswers).length}/{quizQuestions.length} Answered
                          </span>
                        )}
                      </div>

                      {/* Question List */}
                      <div className="space-y-3">
                        {quizQuestions.map((q, qIdx) => {
                          const selectedOpt = quizAnswers[qIdx];
                          const isAnswered = selectedOpt !== undefined;
                          const isCorrect = isAnswered && selectedOpt === q.answerIndex;

                          return (
                            <div key={qIdx} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 space-y-2">
                              <div className="flex items-start gap-1.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 shrink-0">
                                  Q{qIdx + 1}
                                </span>
                                <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">
                                  {renderInlineFormatting(q.question)}
                                </p>
                              </div>

                              {/* Options */}
                              <div className="grid grid-cols-1 gap-1.5 pt-1">
                                {q.options.map((opt, optIdx) => {
                                  const isThisSelected = selectedOpt === optIdx;
                                  const isThisCorrect = optIdx === q.answerIndex;

                                  let optStyle = 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-indigo-400 text-[var(--text-secondary)]';
                                  if (isAnswered) {
                                    if (isThisCorrect) {
                                      optStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold';
                                    } else if (isThisSelected) {
                                      optStyle = 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 line-through';
                                    } else {
                                      optStyle = 'border-[var(--border-subtle)]/50 opacity-60 text-[var(--text-muted)]';
                                    }
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      type="button"
                                      disabled={isAnswered}
                                      onClick={() => {
                                        const updated = { ...quizAnswers, [qIdx]: optIdx };
                                        setQuizAnswers(updated);
                                        if (Object.keys(updated).length === quizQuestions.length) {
                                          setIsQuizSubmitted(true);
                                        }
                                      }}
                                      className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-md border text-xs transition-colors cursor-pointer disabled:cursor-default ${optStyle}`}
                                    >
                                      <span>{renderInlineFormatting(opt)}</span>
                                      {isAnswered && isThisCorrect && (
                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-1.5" />
                                      )}
                                      {isAnswered && isThisSelected && !isThisCorrect && (
                                        <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 ml-1.5" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Explanation */}
                              {isAnswered && (
                                <div className={`p-2 rounded text-[11px] leading-relaxed mt-1.5 ${
                                  isCorrect ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-800 dark:text-amber-200'
                                }`}>
                                  <span className="font-bold">{isCorrect ? '✓ সঠিক উত্তর: ' : '💡 ব্যাখ্যা: '}</span>
                                  {renderInlineFormatting(q.explanation)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Score Result */}
                      {isQuizSubmitted && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            🎯 স্কোর: {Object.entries(quizAnswers).filter(([idx, ans]) => quizQuestions[Number(idx)]?.answerIndex === ans).length} / {quizQuestions.length}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            কনসেপ্ট ধারণক্ষমতা যাচাই সম্পন্ন!
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Personal Notes */}
      {activeTab === 'notes' && (
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          {/* Note Input */}
          <form onSubmit={handleCreateNote} className="flex flex-col gap-2 mb-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="h-3 w-3" />
                <span>At [{currentTimestampFormatted}]</span>
              </span>
              {notes.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportNotes}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-primary)] hover:underline cursor-pointer"
                  title="Export study notes as PDF"
                >
                  <Download className="h-3 w-3" />
                  <span>Export PDF</span>
                </button>
              )}
            </div>

            <textarea
              rows={2}
              placeholder="Capture key concepts or formula..."
              value={newNoteContent}
              onChange={e => setNewNoteContent(e.target.value)}
              className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none resize-none"
            />

            <button
              type="submit"
              disabled={!newNoteContent.trim()}
              className="flex items-center justify-center gap-1.5 rounded-md bg-[var(--text-primary)] text-[var(--bg-canvas)] py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Save Note</span>
            </button>
          </form>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 text-center text-[var(--text-muted)]">
                <FileText className="h-6 w-6 stroke-1 mb-1" />
                <p className="text-xs">No personal notes captured yet.</p>
                <p className="text-[10px] mt-0.5">Switch to &ldquo;✨ AI Notes&rdquo; to view instant lecture sheets.</p>
              </div>
            ) : (
              notes.map((note, idx) => (
                <div
                  key={`${note.id}_${idx}`}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-2.5 shadow-2xs group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <button
                      type="button"
                      onClick={() => handleSeek(note.timestampSeconds)}
                      className="font-mono text-[10px] font-bold text-[var(--text-primary)] bg-[var(--bg-surface-subtle)] hover:bg-[var(--border-subtle)] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      title="Jump video to timestamp"
                    >
                      [{note.timestampFormatted}]
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {renderNoteCardContent(note.content, note.id)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* KaizenFlow Pro Subscription Modal */}
      {showPaywallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-[var(--bg-surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
                  <Crown className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <span>KaizenFlow Pro</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 uppercase tracking-wider">
                      Premium
                    </span>
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {quota.isPro 
                      ? 'আপনার প্রো সাবস্ক্রিপশন সক্রিয় রয়েছে' 
                      : quota.remaining === 0 
                        ? 'আজকের ৩টি ফ্রি এআই নোটের কোটা শেষ' 
                        : `আজকের ফ্রি কোটা: ${quota.remaining}/${quota.max} অবশিষ্ট`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPaywallModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Feature Checklist */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5 space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[var(--text-primary)]">আনলিমিটেড এআই লেকচার নোট</p>
                  <p className="text-[11px] text-[var(--text-muted)]">যেকোনো ইউটিউব প্লেলিস্টের শত শত ভিডিওর ইনস্ট্যান্ট স্টাডি শিট</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[var(--text-primary)]">স্মার্ট অ্যাক্টিভ রিকল কুইজ</p>
                  <p className="text-[11px] text-[var(--text-muted)]">প্রতিটি লেকচারের ৩-প্রশ্নের ইন্টারঅ্যাক্টিভ পরীক্ষা ও তাৎক্ষণিক ব্যাখ্যা</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[var(--text-primary)]">হাই-রেজোলিউশন PDF আনলিমিটেড এক্সপোর্ট</p>
                  <p className="text-[11px] text-[var(--text-muted)]">বাংলা ইউনিকোড ফন্ট ও ডার্ক কোড কার্ডসহ যেকোনো সময় প্রিন্ট করুন</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[var(--text-primary)]">প্রায়োরিটি হাই-স্পিড এআই ইঞ্জিন</p>
                  <p className="text-[11px] text-[var(--text-muted)]">জিরো কিউ ও ফাস্টেস্ট মডেল রেসপন্স রেট</p>
                </div>
              </div>
            </div>

            {/* Monthly Plan Card (Only for Free Users) */}
            {!quota.isPro ? (
              <div className="space-y-3.5">
                <div className="relative rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-orange-500/10 p-4 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-extrabold uppercase tracking-wide">
                        <Sparkles className="h-3 w-3 fill-current" />
                        <span>১ মাস ফুল এক্সেস</span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        মাসিক প্রো সাবস্ক্রিপশন
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        আনলিমিটেড এআই নোট, কুইজ ও ফুল এক্সেস
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-amber-500 tracking-tight">৳৯৯</div>
                      <div className="text-[10px] font-semibold text-[var(--text-muted)]">/ ১ মাস (৩০ দিন)</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-between text-[10.5px] text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ কোনো অটো-কাট নেই
                    </span>
                    <span className="text-[var(--text-muted)] font-medium">
                      bKash • Nagad • Card
                    </span>
                  </div>
                </div>

                {/* Primary Upgrade CTA */}
                <button
                  type="button"
                  onClick={() => {
                    setShowPaywallModal(false);
                    setShowPaymentModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 hover:opacity-95 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <Crown className="h-4 w-4 fill-current" />
                  <span>৳৯৯ দিয়ে বিকাশ / নগদে প্রো আনলক করুন</span>
                </button>

                <p className="text-center text-[10.5px] text-[var(--text-muted)]">
                  ⚡ ফ্রি ইউজারদের জন্য প্রতিদিন ৩টি ফ্রি এআই নোট স্বয়ংক্রিয়ভাবে রিফিল হয়।
                </p>
              </div>
            ) : (
              /* Already Pro status */
              <div className="space-y-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  ✓ আপনার অ্যাকাউন্টে KaizenFlow Pro সক্রিয় রয়েছে। আপনি আনলিমিটেড এআই নোট তৈরি করতে পারছেন।
                </div>

                {/* Developer / Testing button to toggle back to free quota for testing */}
                <button
                  type="button"
                  onClick={handleDowngradeToFree}
                  className="text-[11px] text-[var(--text-muted)] hover:text-amber-500 underline cursor-pointer"
                >
                  (Testing mode) Switch to Free plan to test daily quota limit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* bKash & Nagad Checkout Modal */}
      <BkashNagadCheckoutModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setQuota(getAiNotesQuotaStatus());
        }}
      />
    </div>
  );
};
