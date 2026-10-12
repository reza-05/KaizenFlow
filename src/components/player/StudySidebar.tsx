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
  AlertCircle
} from 'lucide-react';
import { VideoItem, StudyNote, AILectureNotes, LectureNoteChapter } from '@/types';
import { exportNotesToPDF } from '@/lib/pdfExport';

interface StudySidebarProps {
  playlistId: string;
  videos: VideoItem[];
  currentVideoId: string;
  onSelectVideo: (video: VideoItem) => void;
  verifiedMap: Record<string, boolean>;
  notes: StudyNote[];
  onAddNote: (content: string, timestampSeconds: number) => void;
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

  // Custom API Key Modal State
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [customKey, setCustomKey] = useState<string>('');
  const [customProvider, setCustomProvider] = useState<'groq' | 'gemini'>('groq');

  // Load custom key from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('kaizenflow_custom_ai_key') || '';
      const savedProvider = (localStorage.getItem('kaizenflow_custom_ai_provider') as 'groq' | 'gemini') || 'groq';
      setCustomKey(savedKey);
      setCustomProvider(savedProvider);
    }
  }, []);

  // Load cached AI notes when video or language changes
  useEffect(() => {
    setAiError(null);
    if (typeof window !== 'undefined' && currentVideoId) {
      const cacheKey = `kaizenflow_ai_notes_${currentVideoId}_${aiLanguage}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setAiNotes(JSON.parse(cached));
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
    aiNotes.chapters.forEach(ch => {
      const cleanExp = (ch.explanation || '').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
      let content = `**${ch.title}**\n${cleanExp}`;
      if (ch.codeSnippet) {
        const cleanSnippet = ch.codeSnippet.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
        content += `\n\`\`\`${ch.codeLanguage || ''}\n${cleanSnippet}\n\`\`\``;
      }
      onAddNote(content, ch.seconds);
    });
    setCopiedAllNotes(true);
    setTimeout(() => setCopiedAllNotes(false), 2500);
    setActiveTab('notes');
  };

  // Generate Real Lecture Notes from backend
  const handleGenerateAINotes = async () => {
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
          customApiKey: customKey.trim() || undefined,
          customProvider,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate lecture notes');
      }

      const generated: AILectureNotes = await res.json();
      setAiNotes(generated);

      // Save to local cache
      if (typeof window !== 'undefined') {
        const cacheKey = `kaizenflow_ai_notes_${currentVideoId}_${aiLanguage}`;
        localStorage.setItem(cacheKey, JSON.stringify(generated));
      }
    } catch (err: any) {
      console.error('AI Notes Generation error:', err);
      setAiError(err.message || 'Could not process lecture notes for this video.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save custom key to localStorage
  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaizenflow_custom_ai_key', customKey.trim());
      localStorage.setItem('kaizenflow_custom_ai_provider', customProvider);
    }
    setShowKeyModal(false);
  };

  const currentMins = Math.floor(activeTimestampSeconds / 60);
  const currentSecs = activeTimestampSeconds % 60;
  const currentTimestampFormatted = `${currentMins}:${currentSecs < 10 ? '0' : ''}${currentSecs}`;

  // Helper to format inline bold **bold**
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-[var(--text-primary)]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Helper to render markdown bold, inline code, and code blocks inside personal notes
  const renderNoteCardContent = (content: string, noteId: string) => {
    const clean = (content || '')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '');

    // Split by code block regex: ```lang\ncode```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(clean)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = clean.slice(lastIndex, match.index);
        elements.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed text-xs text-[var(--text-primary)]">
            {renderInlineFormatting(textBefore)}
          </div>
        );
      }

      const lang = match[1] || 'code';
      const code = match[2].trim();
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
    }

    if (lastIndex < clean.length) {
      const remaining = clean.slice(lastIndex);
      elements.push(
        <div key={`text-end`} className="whitespace-pre-wrap leading-relaxed text-xs text-[var(--text-primary)]">
          {renderInlineFormatting(remaining)}
        </div>
      );
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

            {/* Actions / API Key settings */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                title="Configure custom Groq / Gemini AI key"
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
              >
                <KeyRound className="h-3.5 w-3.5" />
              </button>

              {aiNotes && (
                <>
                  <button
                    type="button"
                    onClick={handleImportAIToMyNotes}
                    title="Add all notes to personal notes tab"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-surface-subtle)] text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
                  >
                    {copiedAllNotes ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedAllNotes ? 'Added!' : 'Save All'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAINotes}
                    disabled={isGeneratingAI}
                    title="Regenerate lecture notes"
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
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
                  onClick={handleGenerateAINotes}
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

            {/* STATE 3: Notes Ready & Displayed */}
            {aiNotes && !isGeneratingAI && (
              <div className="space-y-4">
                {/* Executive Summary Card */}
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)] mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Lecture Overview</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {aiNotes.summary}
                  </p>
                  {aiNotes.isRealTranscriptGrounded && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 pt-2 border-t border-[var(--border-subtle)]">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Grounded in verbatim video speech (Zero Hallucination)</span>
                    </div>
                  )}
                </div>

                {/* Chapter-by-Chapter Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider text-[10px] text-[var(--text-muted)]">
                    Timestamped Breakdown ({aiNotes.chapters.length} Topics)
                  </h4>

                  {aiNotes.chapters.map(ch => (
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
                        {ch.title}
                      </h5>

                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                        {ch.explanation}
                      </p>

                      {/* Code Snippet Box (if instructor wrote code) */}
                      {ch.codeSnippet && (
                        <div className="relative rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-100 overflow-x-auto mt-2">
                          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-zinc-800 text-[10px] text-zinc-400">
                            <span className="uppercase font-bold tracking-wider">{ch.codeLanguage || 'code'}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(ch.codeSnippet!, ch.id)}
                              className="flex items-center gap-1 hover:text-white transition-colors"
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
                              <span>{kp}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

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
                          <span>{kt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
              notes.map(note => (
                <div
                  key={note.id}
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

      {/* Custom API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-bold text-[var(--text-primary)]">
                  Custom AI Key (Optional)
                </h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomKey} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-primary)] mb-1">
                  AI Provider
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCustomProvider('groq')}
                    className={`py-1.5 px-3 rounded-lg border text-center transition-colors font-semibold ${
                      customProvider === 'groq'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    Groq (Ultra-Fast)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomProvider('gemini')}
                    className={`py-1.5 px-3 rounded-lg border text-center transition-colors font-semibold ${
                      customProvider === 'gemini'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    Google Gemini
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-primary)] mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="gsk_... or AIza..."
                  value={customKey}
                  onChange={e => setCustomKey(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)]"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Saved securely in your local browser storage. Leave empty to use server default.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] text-xs font-semibold hover:opacity-90"
                >
                  Save Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
