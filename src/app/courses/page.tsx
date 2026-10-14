'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { 
  Compass, 
  Search, 
  BookOpen, 
  Award, 
  Flame, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  GraduationCap, 
  Clock, 
  ListVideo, 
  Languages, 
  SlidersHorizontal, 
  AlertCircle,
  ExternalLink,
  Star,
  Check
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { 
  CURATED_COURSES, 
  COURSE_CATEGORIES, 
  CuratedCourse, 
  CourseCategory 
} from '@/lib/curatedCatalog';
import { getPlaylists, addPlaylist, getInitialUserProfile } from '@/lib/storage';
import { parseYouTubePlaylist } from '@/lib/youtube';
import { Playlist, UserProfile } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function CoursesCatalogPage() {
  const router = useRouter();
  const { user, userProfile: authProfile } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [enrolledPlaylists, setEnrolledPlaylists] = useState<Playlist[]>([]);
  
  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | CuratedCourse['category']>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'Bangla' | 'English' | 'Hindi'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'lessons'>('popular');
  
  // Enrollment state
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    const profile = user ? authProfile : getInitialUserProfile();
    setUserProfile(profile);
    setEnrolledPlaylists(getPlaylists());
  }, [user?.uid, authProfile]);

  // Map of enrolled playlist IDs for instant lookup
  const enrolledYtIds = useMemo(() => {
    const map = new Map<string, string>(); // ytPlaylistId -> playlistId
    enrolledPlaylists.forEach(p => {
      if (p.ytPlaylistId) {
        map.set(p.ytPlaylistId, p.id);
      }
    });
    return map;
  }, [enrolledPlaylists]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    return CURATED_COURSES.filter(course => {
      // Category filter
      if (selectedCategory !== 'all' && course.category !== selectedCategory) {
        return false;
      }
      
      // Language filter
      if (selectedLanguage !== 'all' && course.language !== selectedLanguage) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = course.title.toLowerCase().includes(query);
        const matchTitleBn = course.titleBn?.toLowerCase().includes(query) || false;
        const matchInstructor = course.instructor.toLowerCase().includes(query);
        const matchChannel = course.channelName.toLowerCase().includes(query);
        const matchDesc = course.description.toLowerCase().includes(query);
        const matchTags = course.tags.some(t => t.toLowerCase().includes(query));
        
        if (!matchTitle && !matchTitleBn && !matchInstructor && !matchChannel && !matchDesc && !matchTags) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'lessons') {
        return b.totalVideosApprox - a.totalVideosApprox;
      }
      // Default: featured first, then review count
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.rating - a.rating;
    });
  }, [selectedCategory, selectedLanguage, searchQuery, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: CURATED_COURSES.length };
    CURATED_COURSES.forEach(course => {
      counts[course.category] = (counts[course.category] || 0) + 1;
    });
    return counts;
  }, []);

  const handleEnrollOrResume = async (course: CuratedCourse) => {
    // 1. If already enrolled, jump directly to study desk
    const existingPlaylistId = enrolledYtIds.get(course.ytPlaylistId);
    if (existingPlaylistId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('kaizenflow_pending_open_course', existingPlaylistId);
      }
      router.push('/');
      return;
    }

    // 2. Check quota limit
    if (enrolledPlaylists.length >= 10) {
      setStatusMessage({
        type: 'error',
        text: 'You have reached the maximum of 10 active courses in your library. Please remove one from your dashboard before enrolling in a new course.',
      });
      return;
    }

    // 3. Enroll course
    setEnrollingId(course.id);
    setStatusMessage(null);

    try {
      const parsedCourse = await parseYouTubePlaylist(course.ytPlaylistId, course.title);
      const res = addPlaylist(parsedCourse);
      
      if (!res.success) {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Failed to add course to library.',
        });
        setEnrollingId(null);
        return;
      }

      // Celebrate enrollment
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });

      setStatusMessage({
        type: 'success',
        text: `Enrolled in "${course.title}"! Setting up your study desk...`,
      });

      // Update local state
      setEnrolledPlaylists(getPlaylists());
      if (typeof window !== 'undefined') {
        localStorage.setItem('kaizenflow_pending_open_course', parsedCourse.id);
      }

      setTimeout(() => {
        router.push('/');
      }, 700);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Could not fetch course videos. Please verify your connection.',
      });
      setEnrollingId(null);
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-canvas)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col">
      <Navbar userProfile={userProfile || undefined} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Breadcrumb & Return Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Study Desk (ড্যাশবোর্ড)</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <BookOpen className="h-3.5 w-3.5 text-blue-500" />
            <span>
              Active in Library: <strong className="text-[var(--text-primary)]">{enrolledPlaylists.length}/10</strong>
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-10 mb-8 shadow-xs">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-4">
              <Compass className="h-3.5 w-3.5" />
              <span>Curated Video Roadmaps • 100% Free & Distraction-Free</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] mb-3">
              Explore High-Value Courses <br className="hidden sm:inline" />
              <span className="text-[var(--text-secondary)] font-medium text-xl sm:text-2xl">
                শীর্ষস্থানীয় শিক্ষকদের সেরা ইউটিউব প্লেলিস্টসমূহ
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mb-6">
              আমরা ইউটিউবের অগভীর ও বিভ্রান্তিকর ভিডিও বাদ দিয়ে শুধুমাত্র শীর্ষ মেন্টরদের দীর্ঘমেয়াদী, গভীর ও পরীক্ষিত প্লেলিস্টগুলো একত্রিত করেছি। বিজ্ঞাপনবিহীন লার্নিং, চ্যাপ্টার ট্র্যাকিং, অটো-কুইজ ও কনসেপ্ট নোট সহ শিখুন।
            </p>

            {/* Quick Feature Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{CURATED_COURSES.length}+</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Deep-Dive Courses</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">8</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Distinct Tracks</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">100% Free</p>
                <p className="text-[11px] text-[var(--text-secondary)]">No Paywalls</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-500">Zero Ads</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Isolation Mode</p>
              </div>
            </div>
          </div>
        </section>

        {/* Global Notification Banner */}
        {statusMessage && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl border p-4 text-xs font-medium ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs underline hover:opacity-80 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Controls Bar: Search & Language & Sort */}
        <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search by topic, instructor, or language (e.g. Chinmoy, C++, DSA, React, ফিজিক্স)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:border-[var(--text-primary)] focus:outline-none transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters: Language and Sort */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language filter */}
            <div className="flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 text-xs shadow-2xs">
              <span className="px-2 py-1 text-[11px] text-[var(--text-secondary)] font-medium flex items-center gap-1">
                <Languages className="h-3 w-3" />
                Lang:
              </span>
              {(['all', 'Bangla', 'English', 'Hindi'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    selectedLanguage === lang
                      ? 'bg-[var(--text-primary)] text-[var(--bg-surface)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {lang === 'all' ? 'All' : lang === 'Bangla' ? 'বাংলা' : lang}
                </button>
              ))}
            </div>

            {/* Sort filter */}
            <div className="flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 text-xs shadow-2xs">
              <span className="px-2 py-1 text-[11px] text-[var(--text-secondary)] font-medium flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer pr-1"
              >
                <option value="popular">Popular</option>
                <option value="rating">Top Rated</option>
                <option value="lessons">Most Lessons</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {COURSE_CATEGORIES.map(category => {
            const isSelected = selectedCategory === category.id;
            const count = categoryCounts[category.id] || 0;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-xs'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{category.nameBn}</span>
                <span className="hidden md:inline opacity-70">({category.nameEn})</span>
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isSelected
                      ? 'bg-[var(--bg-surface)]/20 text-[var(--bg-surface)]'
                      : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Counter */}
        <div className="mb-4 flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <p>
            Showing <strong className="text-[var(--text-primary)]">{filteredCourses.length}</strong> curated courses
            {selectedCategory !== 'all' && ` in "${COURSE_CATEGORIES.find(c => c.id === selectedCategory)?.nameBn}"`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>

          {(selectedCategory !== 'all' || selectedLanguage !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedLanguage('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-blue-500 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] p-12 text-center">
            <BookOpen className="h-10 w-10 text-[var(--text-secondary)] mb-3 opacity-40" />
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              No matching courses found
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
              We couldn’t find any playlists matching your current search or category filters. Try searching for a broader term like &quot;Physics&quot; or &quot;C++&quot;.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedLanguage('all');
                setSearchQuery('');
              }}
              className="rounded-lg bg-[var(--text-primary)] px-4 py-2 text-xs font-semibold text-[var(--bg-surface)] cursor-pointer"
            >
              Show All Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => {
              const isEnrolled = enrolledYtIds.has(course.ytPlaylistId);
              const isEnrolling = enrollingId === course.id;

              return (
                <div
                  key={course.id}
                  className="group flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-xs hover:border-[var(--border-strong)] hover:shadow-md transition-all duration-200"
                >
                  {/* Thumbnail Banner with badges */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[var(--bg-surface-subtle)]">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      loading="lazy"
                      onError={e => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';
                      }}
                      className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-black/70 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        {course.categoryNameBn}
                      </span>
                      {course.badge && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-black">
                          <Flame className="h-2.5 w-2.5 fill-current" />
                          <span>{course.badge}</span>
                        </span>
                      )}
                    </div>

                    {/* Top Right Language Badge */}
                    <div className="absolute top-3 right-3 rounded-full bg-black/75 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white">
                      {course.language === 'Bangla' ? 'বাংলা' : course.language}
                    </div>

                    {/* Bottom Metadata Overlay */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <ListVideo className="h-3 w-3" />
                          <span>~{course.totalVideosApprox} Lessons</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{course.estimatedHours}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{course.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col p-5 justify-between">
                    <div>
                      {/* Instructor & Channel */}
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-2">
                        <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="font-semibold text-[var(--text-primary)] truncate">
                          {course.instructor}
                        </span>
                        <span>•</span>
                        <span className="truncate flex items-center gap-1">
                          {course.channelName}
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 inline shrink-0" />
                        </span>
                      </div>

                      {/* Course Title */}
                      <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug group-hover:text-blue-500 transition-colors mb-2 line-clamp-2">
                        {course.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4 line-clamp-2">
                        {course.description}
                      </p>

                      {/* Highlights */}
                      <div className="mb-4 rounded-xl bg-[var(--bg-surface-subtle)] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                          Key Syllabus Highlights:
                        </p>
                        <ul className="space-y-1 text-[11px] text-[var(--text-secondary)]">
                          {course.highlights.slice(0, 3).map((hl, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span className="line-clamp-1">{hl}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        <span>{course.reviewCount}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Preview on YouTube Link */}
                        <a
                          href={`https://www.youtube.com/playlist?list=${course.ytPlaylistId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Preview original playlist on YouTube"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>

                        {/* Start or Resume Button */}
                        <button
                          onClick={() => handleEnrollOrResume(course)}
                          disabled={isEnrolling}
                          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            isEnrolled
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-surface)]'
                          } disabled:opacity-50`}
                        >
                          {isEnrolling ? (
                            <>
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              <span>Enrolling...</span>
                            </>
                          ) : isEnrolled ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Resume Study</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 fill-current" />
                              <span>Start Learning</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
