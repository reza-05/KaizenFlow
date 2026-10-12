'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Star, 
  X, 
  Lock, 
  CheckCircle2, 
  Award, 
  MessageSquare, 
  Loader2, 
  Edit3,
  Check,
  ChevronRight
} from 'lucide-react';
import { Playlist, PlaylistReview, PlaylistReviewsSummary, UserProfile, VideoProgress } from '@/types';
import { calculatePlaylistCompletion } from '@/lib/playlistRating';
import { saveUserProfile } from '@/lib/storage';

interface PlaylistReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist | null;
  progressMap: Record<string, VideoProgress>;
  userProfile?: UserProfile;
  onReviewSubmitted?: () => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'সন্তোষজনক নয় (Needs Improvement)',
  2: 'চলনসই / গড়পড়তা (Fair)',
  3: 'ভালো কোর্স (Good)',
  4: 'খুব ভালো ও কার্যকরী (Very Good)',
  5: 'অসাধারণ ও শিক্ষণীয় (Masterpiece)',
};

export const PlaylistReviewModal: React.FC<PlaylistReviewModalProps> = ({
  isOpen,
  onClose,
  playlist,
  progressMap,
  userProfile,
  onReviewSubmitted,
}) => {
  const [summary, setSummary] = useState<PlaylistReviewsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewerName, setReviewerName] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(false);

  // Completion calculation
  const completion = calculatePlaylistCompletion(playlist, progressMap);

  // Load reviews whenever modal opens or playlist changes
  useEffect(() => {
    if (!isOpen || !playlist) return;

    // Prepopulate reviewer name
    if (userProfile?.name && userProfile.name.trim() !== 'Learner') {
      setReviewerName(userProfile.name);
    } else if (!reviewerName) {
      setReviewerName('');
    }

    fetchReviews();
  }, [isOpen, playlist?.id]);

  const fetchReviews = async () => {
    if (!playlist) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/playlist/reviews?playlistId=${encodeURIComponent(playlist.id)}`);
      if (res.ok) {
        const data: PlaylistReviewsSummary = await res.json();
        setSummary(data);

        // Check if current user already left a review
        const currentUserId = userProfile?.id || 'usr_local';
        const myReview = data.reviews.find(
          r => r.userId === currentUserId || (userProfile?.name && r.userName.toLowerCase() === userProfile.name.toLowerCase())
        );

        if (myReview) {
          setRating(myReview.rating);
          setFeedback(myReview.feedback);
          setReviewerName(myReview.userName);
          setIsEditingExisting(true);
        } else {
          setIsEditingExisting(false);
          setRating(5);
          setFeedback('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !playlist) return null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!reviewerName.trim() || reviewerName.trim().length < 2) {
      setErrorMsg('অনুগ্রহ করে আপনার সঠিক নাম প্রদান করুন (অন্তত ২ অক্ষর)।');
      return;
    }

    if (!feedback.trim() || feedback.trim().length < 10) {
      setErrorMsg('অনুগ্রহ করে অন্তত ১০ অক্ষরে আপনার বাস্তব মতামত ও পরামর্শ লিখুন।');
      return;
    }

    if (!completion.canReview) {
      setErrorMsg('রিভিউ দেওয়ার জন্য এই প্লেলিস্টের অন্তত ৬০% ভিডিও দেখা সম্পন্ন করতে হবে।');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/playlist/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId: playlist.id,
          userId: userProfile?.id || 'usr_local',
          userName: reviewerName.trim(),
          rating,
          feedback: feedback.trim(),
          completionPercentage: completion.completionPercentage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'রিভিউ সাবমিট করতে সমস্যা হয়েছে।');
      } else {
        setSuccessMsg(isEditingExisting ? 'আপনার রিভিউ সফলভাবে আপডেট হয়েছে!' : 'আপনার ভেরিফাইড রিভিউ সফলভাবে যোগ হয়েছে!');
        setIsEditingExisting(true);
        if (data.summary) {
          setSummary(data.summary);
        }

        // Persist name into user profile if updated
        if (userProfile && reviewerName.trim() !== userProfile.name) {
          const updatedProfile = { ...userProfile, name: reviewerName.trim() };
          saveUserProfile(updatedProfile);
        }

        onReviewSubmitted?.();
      }
    } catch (err) {
      console.error('Submit review error:', err);
      setErrorMsg('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStar = hoverRating || rating;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 shrink-0">
              <Star className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] line-clamp-1">
                {playlist.customTitle}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                <span className="font-bold text-amber-500">
                  ★ {summary?.averageRating ? summary.averageRating.toFixed(1) : 'নতুন'}
                </span>
                <span>&bull;</span>
                <span>{summary?.totalReviews || 0}টি ভেরিফাইড রিভিউ</span>
                <span>&bull;</span>
                <span>মোট {playlist.videos.length}টি ভিডিও</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SECTION 1: Rating Summary Card */}
          {summary && summary.totalReviews > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 text-xs">
              {/* Score Box */}
              <div className="flex flex-col items-center justify-center text-center sm:border-r border-[var(--border-subtle)] sm:pr-4">
                <span className="text-3xl font-black text-amber-500 tracking-tight">
                  {summary.averageRating.toFixed(1)}
                </span>
                <div className="flex items-center gap-0.5 my-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map(st => (
                    <Star
                      key={st}
                      className={`h-3.5 w-3.5 ${
                        st <= Math.round(summary.averageRating) ? 'fill-current' : 'text-zinc-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {summary.totalReviews} জন শিক্ষার্থীর রেটিং
                </span>
              </div>

              {/* Star Distribution */}
              <div className="sm:col-span-2 space-y-1.5 justify-center flex flex-col">
                {[5, 4, 3, 2, 1].map(starNum => {
                  const count = summary.distribution[starNum] || 0;
                  const pct = summary.totalReviews > 0 ? Math.round((count / summary.totalReviews) * 100) : 0;
                  return (
                    <div key={starNum} className="flex items-center gap-2 text-[11px]">
                      <span className="w-6 text-[var(--text-secondary)] font-mono">{starNum} ★</span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono text-[var(--text-muted)]">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: Review Form OR Locked Card */}
          {!completion.canReview ? (
            /* LOCKED STATE (< 60%) */
            <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                    রিভিউ অপশন লক করা রয়েছে (Proof of Completion Required)
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    সৎ এবং নির্ভেজাল শিক্ষার্থী রিভিউ নিশ্চিত করতে, এই কোর্সের অন্তত <span className="font-bold text-amber-500">৬০% ভিডিও</span> দেখা সম্পন্ন করতে হবে।
                  </p>
                </div>
              </div>

              {/* Conditions Box */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-[11.5px] space-y-1.5 text-[var(--text-secondary)]">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>শর্ত ১: ভিডিওটি দেখা সম্পন্ন হয়ে চেকমার্ক থাকতে হবে।</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>শর্ত ২: প্রতিটি ভিডিওর অন্তত ৫০% ওয়াচটাইম পূর্ণ হতে হবে।</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[var(--text-primary)]">
                    আপনার অগ্রগতি: {completion.completedCount} / {playlist.videos.length} ভিডিও
                  </span>
                  <span className="font-mono text-amber-500 font-bold">
                    {completion.completionPercentage}% / ৬০%
                  </span>
                </div>
                <div className="h-2 w-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((completion.completionPercentage / 60) * 100))}%` }}
                  />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] text-right">
                  আর মাত্র {completion.remainingCount}টি ভিডিও সম্পন্ন করলেই রিভিউ অপশন আনলক হবে!
                </p>
              </div>
            </div>
          ) : (
            /* UNLOCKED REVIEW FORM (>= 60%) */
            <form onSubmit={handleSubmitReview} className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Award className="h-4 w-4" />
                  <span>
                    {isEditingExisting ? 'আপনার পূর্ববর্তী রিভিউ এডিট করুন' : 'ভেরিফাইড শিক্ষার্থী হিসেবে রিভিউ দিন'}
                  </span>
                </div>
                <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-mono font-bold">
                  {completion.completionPercentage}% সম্পন্ন
                </span>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-500 font-medium">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-500 font-medium flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Reviewer Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  আপনার নাম (Reviewer Name):
                </label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={e => setReviewerName(e.target.value)}
                  placeholder="যেমন: তানভীর আহমেদ বা Sadman Sakib"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Star Rating Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  আপনার রেটিং নির্বাচন করুন:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setRating(st)}
                        onMouseEnter={() => setHoverRating(st)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-lg text-amber-500 hover:scale-115 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`h-6 w-6 ${st <= activeStar ? 'fill-current' : 'text-zinc-600'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-amber-500 ml-2">
                    {RATING_DESCRIPTIONS[activeStar] || ''}
                  </span>
                </div>
              </div>

              {/* Feedback Textarea */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  আপনার অভিজ্ঞতা ও পরামর্শ:
                </label>
                <textarea
                  rows={3}
                  required
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="কোর্সটি কেমন লেগেছে? শিক্ষকের বোঝানোর ভঙ্গি, কনসেপ্টের গভীরতা এবং নতুন শিক্ষার্থীদের জন্য কোনো পরামর্শ থাকলে লিখুন (মিনিমাম ১০ অক্ষর)..."
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>কমপক্ষে ১০ অক্ষর আবশ্যক</span>
                  <span>{feedback.length} অক্ষর</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span>সাবমিট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4" />
                    <span>{isEditingExisting ? 'রিভিউ আপডেট করুন' : 'ভেরিফাইড রিভিউ সাবমিট করুন'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* SECTION 3: List of Verified Student Reviews */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 text-xs font-bold text-[var(--text-primary)]">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-500" />
                <span>শিক্ষার্থীদের মতামত ({summary?.totalReviews || 0})</span>
              </div>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                <span>রিভিউ লোড হচ্ছে...</span>
              </div>
            ) : !summary || summary.reviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
                <p>এখনো কোনো শিক্ষার্থী রিভিউ দেননি।</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                  কোর্সের ৬০% সম্পন্ন করে আপনিই প্রথম ভেরিফাইড রিভিউ দিন!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.reviews.map(rev => (
                  <div
                    key={rev.id}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 space-y-2 text-xs shadow-2xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)]">
                          {rev.userName}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Verified Learner ({rev.completionPercentage}%)</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map(st => (
                          <Star
                            key={st}
                            className={`h-3 w-3 ${st <= rev.rating ? 'fill-current' : 'text-zinc-600'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                      {rev.feedback}
                    </p>

                    <div className="text-[10px] text-[var(--text-muted)] text-right">
                      {new Date(rev.createdAt).toLocaleDateString('bn-BD', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
