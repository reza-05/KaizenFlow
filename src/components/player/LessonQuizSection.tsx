'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Brain, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  HelpCircle, 
  Award,
  ChevronRight,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { VideoItem, LectureQuizQuestion } from '@/types';
import { 
  getOrGenerateQuizForVideo, 
  getStoredQuizState, 
  saveStoredQuizState, 
  clearStoredQuizState 
} from '@/lib/quizGenerator';

interface LessonQuizSectionProps {
  video: VideoItem;
  courseTitle?: string;
  onJumpToVideoNotes?: () => void;
}

export const LessonQuizSection: React.FC<LessonQuizSectionProps> = ({
  video,
  courseTitle,
  onJumpToVideoNotes,
}) => {
  const [questions, setQuestions] = useState<LectureQuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // Load questions and saved progress whenever active video changes
  useEffect(() => {
    const loadedQuestions = getOrGenerateQuizForVideo(video, courseTitle);
    setQuestions(loadedQuestions);

    const saved = getStoredQuizState(video.ytVideoId);
    setAnswers(saved.answers || {});
    setIsSubmitted(saved.isSubmitted || false);
    setActiveQuestionIndex(0);
  }, [video.ytVideoId, video.title, courseTitle]);

  // Listen for AI notes updates (e.g., if user generates AI notes in sidebar, update quiz)
  useEffect(() => {
    const handleNotesUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ videoId: string }>;
      if (customEvt.detail?.videoId === video.ytVideoId) {
        const fresh = getOrGenerateQuizForVideo(video, courseTitle);
        setQuestions(fresh);
      }
    };

    window.addEventListener('kaizenflow-notes-updated', handleNotesUpdate);
    return () => window.removeEventListener('kaizenflow-notes-updated', handleNotesUpdate);
  }, [video.ytVideoId, video.title, courseTitle]);

  if (!questions || questions.length === 0) {
    return null;
  }

  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = answeredCount === questions.length;
  const score = Object.entries(answers).filter(
    ([idx, ans]) => questions[Number(idx)]?.answerIndex === ans
  ).length;
  const scorePercentage = Math.round((score / questions.length) * 100);

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (answers[questionIndex] !== undefined) return; // Already answered

    const updated = { ...answers, [questionIndex]: optionIndex };
    setAnswers(updated);

    const allDone = Object.keys(updated).length === questions.length;
    if (allDone) {
      setIsSubmitted(true);
      const finalScore = Object.entries(updated).filter(
        ([idx, ans]) => questions[Number(idx)]?.answerIndex === ans
      ).length;

      saveStoredQuizState(video.ytVideoId, updated, true, finalScore);

      if (finalScore === questions.length) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.8 },
            colors: ['#10b981', '#3b82f6', '#f59e0b'],
          });
        } catch {}
      }
    } else {
      saveStoredQuizState(video.ytVideoId, updated, false);
      // Auto advance to next unanswered question after short delay
      if (questionIndex < questions.length - 1) {
        setTimeout(() => {
          setActiveQuestionIndex(questionIndex + 1);
        }, 450);
      }
    }
  };

  const handleRetake = () => {
    clearStoredQuizState(video.ytVideoId);
    setAnswers({});
    setIsSubmitted(false);
    setActiveQuestionIndex(0);
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-sm space-y-5 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-2xs">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                ভিডিও কুইজ ও কনসেপ্ট যাচাই
              </h3>
              <span className="rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] px-2.5 py-0.5 text-[11px] font-mono font-semibold text-[var(--text-secondary)]">
                {questions.length} Questions
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              লেকচার দেখা শেষে তাৎক্ষণিক অ্যাক্টিভ রিকল (Active Recall) এর মাধ্যমে প্রস্তুতি পরীক্ষা করুন।
            </p>
          </div>
        </div>

        {/* Action Controls / Score Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {isAllAnswered ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Award className="h-3.5 w-3.5" />
                <span>স্কোর: {score}/{questions.length} ({scorePercentage}%)</span>
              </span>
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] hover:bg-[var(--border-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
                title="পুনরায় পরীক্ষা দিন"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>পুনরায় দিন</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>{answeredCount} of {questions.length} Answered</span>
            </div>
          )}
        </div>
      </div>

      {/* Question Stepper Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {questions.map((q, idx) => {
          const isAnswered = answers[idx] !== undefined;
          const isCorrect = isAnswered && answers[idx] === q.answerIndex;
          const isActive = activeQuestionIndex === idx;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveQuestionIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                isActive
                  ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-canvas)] shadow-xs'
                  : isAnswered
                  ? isCorrect
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>প্রশ্ন {idx + 1}</span>
              {isAnswered && (
                isCorrect ? (
                  <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                ) : (
                  <XCircle className="h-3 w-3 stroke-[2.5]" />
                )
              )}
            </button>
          );
        })}
      </div>

      {/* Active Question Display */}
      {questions[activeQuestionIndex] && (() => {
        const qIndex = activeQuestionIndex;
        const currentQ = questions[qIndex];
        const selectedOpt = answers[qIndex];
        const isAnswered = selectedOpt !== undefined;

        return (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Question Title */}
            <div className="rounded-xl bg-[var(--bg-surface-subtle)]/60 border border-[var(--border-subtle)] p-4">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-500 text-xs font-bold font-mono mt-0.5">
                  {qIndex + 1}
                </span>
                <p className="text-sm font-semibold text-[var(--text-primary)] leading-relaxed">
                  {currentQ.question}
                </p>
              </div>
            </div>

            {/* 4 Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQ.options.map((optionText, optIdx) => {
                const isSelected = selectedOpt === optIdx;
                const isCorrectOpt = optIdx === currentQ.answerIndex;

                let optCardStyle = 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)]';
                let letterBadgeStyle = 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]';

                if (isAnswered) {
                  if (isCorrectOpt) {
                    optCardStyle = 'border-emerald-500/80 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium shadow-xs';
                    letterBadgeStyle = 'bg-emerald-500 text-white border-emerald-500';
                  } else if (isSelected && !isCorrectOpt) {
                    optCardStyle = 'border-red-500/80 bg-red-500/10 text-red-800 dark:text-red-300 shadow-xs';
                    letterBadgeStyle = 'bg-red-500 text-white border-red-500';
                  } else {
                    optCardStyle = 'opacity-40 border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(qIndex, optIdx)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer disabled:cursor-default ${optCardStyle}`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold font-mono transition-colors ${letterBadgeStyle}`}>
                      {optionLetters[optIdx]}
                    </span>
                    <span className="flex-1 leading-relaxed pt-0.5">
                      {optionText}
                    </span>
                    {isAnswered && isCorrectOpt && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    )}
                    {isAnswered && isSelected && !isCorrectOpt && (
                      <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation Box */}
            {isAnswered && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>ব্যাখ্যা ও সঠিক উত্তর</span>
                </div>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed pl-5">
                  {currentQ.explanation}
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Completion Summary Card */}
      {isAllAnswered && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                কুইজ সম্পন্ন হয়েছে! ({score}/{questions.length} সঠিক)
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                {score === questions.length
                  ? 'অসাধারণ! আপনি এই ভিডিওর সম্পূর্ণ মূল ধারণা পরিষ্কারভাবে বুঝতে পেরেছেন।'
                  : 'বেশ ভালো প্রচেষ্টা! ভুল হওয়া অংশগুলো পুনরায় যাচাই করে আরও দক্ষ হয়ে উঠুন।'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRetake}
              className="px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              পুনরায় কুইজ দিন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
