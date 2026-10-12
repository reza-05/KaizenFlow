'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  HelpCircle, 
  Award,
  Loader2,
  Play,
  ArrowRight
} from 'lucide-react';
import { VideoItem, LectureQuizQuestion } from '@/types';
import { 
  fetchAiQuizForVideo, 
  getStoredQuizQuestions, 
  getStoredQuizState, 
  saveStoredQuizState, 
  clearStoredQuizState,
  clearAllQuizDataForVideo
} from '@/lib/quizGenerator';

interface LessonQuizSectionProps {
  video: VideoItem;
  courseTitle?: string;
}

export const LessonQuizSection: React.FC<LessonQuizSectionProps> = ({
  video,
  courseTitle,
}) => {
  const [questions, setQuestions] = useState<LectureQuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false);
  const [hasStartedQuiz, setHasStartedQuiz] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load existing questions and saved user answers whenever video changes
  useEffect(() => {
    setErrorMessage(null);
    setActiveQuestionIndex(0);

    const existingQuestions = getStoredQuizQuestions(video.ytVideoId);
    const savedState = getStoredQuizState(video.ytVideoId);

    if (existingQuestions && existingQuestions.length >= 3) {
      setQuestions(existingQuestions);
      setAnswers(savedState.answers || {});
      setIsSubmitted(savedState.isSubmitted || false);
      // If user had already started or answered before, show quiz view
      setHasStartedQuiz(Boolean(savedState.isSubmitted || Object.keys(savedState.answers || {}).length > 0));
    } else {
      setQuestions([]);
      setAnswers({});
      setIsSubmitted(false);
      setHasStartedQuiz(false);
    }
  }, [video.ytVideoId]);

  // Handle "Take Quiz" click: fetch real AI questions
  const handleTakeQuiz = async (forceFresh: boolean = false) => {
    setIsLoadingQuiz(true);
    setErrorMessage(null);

    try {
      if (forceFresh) {
        clearAllQuizDataForVideo(video.ytVideoId);
        setAnswers({});
        setIsSubmitted(false);
      }

      const freshQuestions = await fetchAiQuizForVideo(video, courseTitle, forceFresh);
      if (freshQuestions && freshQuestions.length >= 3) {
        setQuestions(freshQuestions);
        setHasStartedQuiz(true);
        setActiveQuestionIndex(0);
      } else {
        setErrorMessage('কুইজ প্রশ্ন লোড করা সম্ভব হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'প্রশ্ন তৈরিতে সমস্যা হয়েছে।');
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = questions.length > 0 && answeredCount === questions.length;
  const score = Object.entries(answers).filter(
    ([idx, ans]) => questions[Number(idx)]?.answerIndex === ans
  ).length;
  const scorePercentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

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
      // Auto-advance to next question after small delay
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-2xs">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                ভিডিও কনসেপ্ট কুইজ (AI Active Recall)
              </h3>
              <span className="rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] px-2.5 py-0.5 text-[11px] font-mono font-semibold text-[var(--text-secondary)]">
                5 Questions
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              এই ভিডিওর মূল বিষয়ের ওপর ভিত্তি করে এআই দিয়ে ৫টি প্রাসঙ্গিক কনসেপচুয়াল প্রশ্ন তৈরি করে প্রস্তুতি যাচাই করুন।
            </p>
          </div>
        </div>

        {/* Action Controls / Score Badge */}
        {hasStartedQuiz && questions.length > 0 && (
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
                <span className="h-2 w-2 rounded-full bg-[var(--text-primary)] animate-pulse" />
                <span>{answeredCount} of {questions.length} Answered</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STATE 1: INITIAL UNSTARTED "TAKE QUIZ" CTA */}
      {!hasStartedQuiz && !isLoadingQuiz && (
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/50 p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs">
            <BookOpen className="h-6 w-6" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
              ভিডিওর ওপর এআই দিয়ে ৫টি কনসেপচুয়াল প্রশ্ন তৈরি করুন
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              ভিডিওতে শেখানো মূল সিনট্যাক্স, লজিক বা নিয়মের ওপর ভিত্তি করে এআই প্রাসঙ্গিক ৫টি প্রশ্ন তৈরি করবে।
            </p>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-500 font-medium">
              {errorMessage}
            </p>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleTakeQuiz(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Take Quiz (কুইজ শুরু করুন)</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: LOADING SPINNER */}
      {isLoadingQuiz && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/40 p-10 text-center space-y-3">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[var(--text-primary)]" />
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            ভিডিওর মূল কনসেপ্ট বিশ্লেষণ করে এআই দিয়ে ৫টি প্রশ্ন তৈরি হচ্ছে...
          </p>
          <p className="text-[11px] text-[var(--text-secondary)]">
            কয়েক সেকেন্ড সময় লাগতে পারে, অনুগ্রহ করে অপেক্ষা করুন।
          </p>
        </div>
      )}

      {/* STATE 3: ACTIVE 5-QUESTION QUIZ VIEW */}
      {hasStartedQuiz && !isLoadingQuiz && questions.length > 0 && (
        <div className="space-y-5 animate-in fade-in duration-200">
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

          {/* Active Question Card */}
          {questions[activeQuestionIndex] && (() => {
            const qIndex = activeQuestionIndex;
            const currentQ = questions[qIndex];
            const selectedOpt = answers[qIndex];
            const isAnswered = selectedOpt !== undefined;

            return (
              <div className="space-y-4">
                {/* Question Title */}
                <div className="rounded-xl bg-[var(--bg-surface-subtle)]/70 border border-[var(--border-subtle)] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] text-xs font-bold font-mono mt-0.5">
                      {qIndex + 1}
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
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
                        <span className="flex-1 leading-relaxed pt-0.5 whitespace-pre-line">
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

                {/* Explanation Box */}
                {isAnswered && (
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>কনসেপ্ট ও ব্যাখ্যা</span>
                    </div>
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed pl-5 whitespace-pre-line">
                      {currentQ.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Completion Summary Card */}
          {isAllAnswered && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    কুইজ সম্পন্ন হয়েছে! ({score}/{questions.length} সঠিক - {scorePercentage}%)
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {score === questions.length
                      ? 'অসাধারণ! আপনি এই ভিডিওর সম্পূর্ণ মূল ধারণা পরিষ্কারভাবে বুঝতে পেরেছেন।'
                      : 'বেশ ভালো প্রস্তুতি! ভুল হওয়া প্রশ্নগুলোর ব্যাখ্যা রিভিশন দিয়ে আরও স্পষ্ট করে নিন।'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  পুনরায় দিন
                </button>
                <button
                  type="button"
                  onClick={() => handleTakeQuiz(true)}
                  className="px-3.5 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 text-xs font-bold transition-all cursor-pointer"
                >
                  নতুন ৫টি প্রশ্ন জেনারেট করুন
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
