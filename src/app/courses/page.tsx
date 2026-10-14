'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { 
  LayoutGrid, 
  Search, 
  BookOpen, 
  CheckCircle2, 
  ArrowLeft, 
  Play, 
  GraduationCap, 
  ListVideo, 
  Languages, 
  SlidersHorizontal, 
  AlertCircle,
  ExternalLink,
  Star,
  Check,
  Cpu,
  Code,
  Compass,
  Clock
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { 
  CURATED_COURSES, 
  COURSE_CATEGORIES, 
  ACADEMIC_LEVELS,
  CuratedCourse, 
  AcademicLevel,
  CourseCategoryId
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
  const [selectedLevel, setSelectedLevel] = useState<AcademicLevel>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | CourseCategoryId>('all');
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
    const map = new Map<string, string>();
    enrolledPlaylists.forEach(p => {
      if (p.ytPlaylistId) {
        map.set(p.ytPlaylistId, p.id);
      }
    });
    return map;
  }, [enrolledPlaylists]);

  // Categories visible under the selected academic level
  const visibleCategories = useMemo(() => {
    if (selectedLevel === 'all') {
      return COURSE_CATEGORIES;
    }
    return [
      COURSE_CATEGORIES[0], // 'all'
      ...COURSE_CATEGORIES.filter(c => c.academicLevel === selectedLevel)
    ];
  }, [selectedLevel]);

  // Handle switching academic level
  const handleLevelChange = (lvl: AcademicLevel) => {
    setSelectedLevel(lvl);
    setSelectedCategory('all');
  };

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    return CURATED_COURSES.filter(course => {
      if (selectedLevel !== 'all' && course.academicLevel !== selectedLevel) {
        return false;
      }

      if (selectedCategory !== 'all' && course.category !== selectedCategory) {
        return false;
      }
      
      if (selectedLanguage !== 'all' && course.language !== selectedLanguage) {
        return false;
      }

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
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.rating - a.rating;
    });
  }, [selectedLevel, selectedCategory, selectedLanguage, searchQuery, sortBy]);

  // Academic level counts
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: CURATED_COURSES.length };
    CURATED_COURSES.forEach(course => {
      counts[course.academicLevel] = (counts[course.academicLevel] || 0) + 1;
    });
    return counts;
  }, []);

  // Category counts within the selected academic level
  const categoryCounts = useMemo(() => {
    const relevantCourses = selectedLevel === 'all'
      ? CURATED_COURSES 
      : CURATED_COURSES.filter(c => c.academicLevel === selectedLevel);
    
    const counts: Record<string, number> = { all: relevantCourses.length };
    relevantCourses.forEach(course => {
      counts[course.category] = (counts[course.category] || 0) + 1;
    });
    return counts;
  }, [selectedLevel]);

  const handleEnrollOrResume = async (course: CuratedCourse) => {
    const existingPlaylistId = enrolledYtIds.get(course.ytPlaylistId);
    if (existingPlaylistId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('kaizenflow_pending_open_course', existingPlaylistId);
      }
      router.push('/');
      return;
    }

    if (enrolledPlaylists.length >= 10) {
      setStatusMessage({
        type: 'error',
        text: 'Library limit reached (10 courses). Please complete or remove a course to add another.',
      });
      return;
    }

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

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
      });

      setStatusMessage({
        type: 'success',
        text: `Enrolled in "${course.title}". Opening your study desk...`,
      });

      setEnrolledPlaylists(getPlaylists());
      if (typeof window !== 'undefined') {
        localStorage.setItem('kaizenflow_pending_open_course', parsedCourse.id);
      }

      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Could not fetch playlist. Please check your connection.',
      });
      setEnrollingId(null);
    }
  };

  const getLevelIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="h-3.5 w-3.5" />;
      case 'GraduationCap':
        return <GraduationCap className="h-3.5 w-3.5" />;
      case 'Cpu':
        return <Cpu className="h-3.5 w-3.5" />;
      case 'Code':
        return <Code className="h-3.5 w-3.5" />;
      default:
        return <LayoutGrid className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryBadgeStyle = (academicLevel: AcademicLevel) => {
    switch (academicLevel) {
      case 'hsc':
        return {
          badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
          dot: 'bg-emerald-500',
        };
      case 'ssc':
        return {
          badge: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/25',
          dot: 'bg-cyan-500',
        };
      case 'university':
        return {
          badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25',
          dot: 'bg-indigo-500',
        };
      case 'skills':
        return {
          badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
          dot: 'bg-blue-500',
        };
      default:
        return {
          badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/25',
          dot: 'bg-violet-500',
        };
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-canvas)]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans relative">
      {/* Subtle top ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-gradient-to-b from-blue-500/12 via-indigo-500/5 to-transparent blur-3xl opacity-80 dark:opacity-40" />
      </div>

      <Navbar userProfile={userProfile || undefined} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* Minimal Breadcrumb & Counter */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Study Desk</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] px-3 py-1 rounded-full border border-[var(--border-subtle)] shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active in Library: <strong className="text-[var(--text-primary)] font-semibold">{enrolledPlaylists.length}/10</strong>
          </span>
        </div>

        {/* Clean, Polished Hero Header */}
        <div className="relative mb-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-xs p-6 sm:p-8 overflow-hidden shadow-xs">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-3">
                <Compass className="h-3.5 w-3.5" />
                <span>Curated Academic & Engineering Library</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
                Course Catalog
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                বাছাইকৃত অ্যাকাডেমিক ও ইঞ্জিনিয়ারিং প্লেলিস্ট — ডিস্ট্র্যাকশন ছাড়া পড়ার জন্য সম্পূর্ণ ফ্রি ও সুন্দরভাবে সাজানো।
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <div className="flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/70 px-4 py-2.5 min-w-[96px] text-center">
                <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                  {CURATED_COURSES.length}+
                </span>
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">Playlists</span>
              </div>
              <div className="flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/70 px-4 py-2.5 min-w-[96px] text-center">
                <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  100%
                </span>
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">Free Access</span>
              </div>
              <div className="flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/70 px-4 py-2.5 min-w-[96px] text-center">
                <span className="text-lg sm:text-xl font-bold text-amber-500">
                  4.9★
                </span>
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">Avg Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Notification Banner */}
        {statusMessage && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl border p-3.5 text-xs font-medium shadow-xs ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400'
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

        {/* Segmented Track Switcher (Tabs) */}
        <div className="border-b border-[var(--border-subtle)] mb-6">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-px scrollbar-none" role="tablist">
            {ACADEMIC_LEVELS.map(lvl => {
              const isActive = selectedLevel === lvl.id;
              const count = levelCounts[lvl.id] || 0;
              return (
                <button
                  key={lvl.id}
                  onClick={() => handleLevelChange(lvl.id)}
                  role="tab"
                  aria-selected={isActive}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
                  }`}
                >
                  <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)]'}>
                    {getLevelIcon(lvl.iconName)}
                  </span>
                  <span>{lvl.nameBn}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                      isActive
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Bar: Search & Language & Sort */}
        <div className="mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search by topic, instructor, or subject..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-9 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[var(--text-secondary)] hover:text-blue-500 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Filter */}
            <div className="flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 text-xs shadow-2xs">
              {(['all', 'Bangla', 'English', 'Hindi'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`rounded-lg px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedLanguage === lang
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {lang === 'all' ? 'All' : lang === 'Bangla' ? 'বাংলা' : lang}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs shadow-2xs">
              <span className="text-[11px] font-medium text-[var(--text-secondary)] mr-1.5">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-[11px] font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="popular">Popular</option>
                <option value="rating">Top Rated</option>
                <option value="lessons">Most Lessons</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subcategories Horizontal Scroll Chips */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {visibleCategories.map(category => {
            const isSelected = selectedCategory === category.id;
            const count = categoryCounts[category.id] || 0;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs shadow-blue-500/25'
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/40 hover:bg-blue-500/5'
                }`}
              >
                <span>{category.nameBn}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Counter / Filter status */}
        <div className="mb-4 flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <p>
            Showing <strong className="text-[var(--text-primary)] font-semibold">{filteredCourses.length}</strong> courses
            {searchQuery && ` matching "${searchQuery}"`}
          </p>

          {(selectedLevel !== 'all' || selectedCategory !== 'all' || selectedLanguage !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedLevel('all');
                setSelectedCategory('all');
                setSelectedLanguage('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] p-12 text-center">
            <BookOpen className="h-8 w-8 text-[var(--text-secondary)] mb-2.5 opacity-40" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              No matching courses found
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
              Try adjusting your search terms or clearing selected category filters.
            </p>
            <button
              onClick={() => {
                setSelectedLevel('all');
                setSelectedCategory('all');
                setSelectedLanguage('all');
                setSearchQuery('');
              }}
              className="rounded-lg bg-[var(--text-primary)] px-3 py-1.5 text-xs font-medium text-[var(--bg-surface)] cursor-pointer"
            >
              Show All Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map(course => {
              const isEnrolled = enrolledYtIds.has(course.ytPlaylistId);
              const isEnrolling = enrollingId === course.id;
              const catStyle = getCategoryBadgeStyle(course.academicLevel);

              return (
                <div
                  key={course.id}
                  className="group flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden hover:border-blue-500/40 dark:hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Clean 16:9 Thumbnail with quiet single pill */}
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
                      className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

                    {/* Smooth Play Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                      <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Standard YouTube-style Lesson Count Pill */}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md border border-white/10 shadow-xs">
                      <ListVideo className="h-3.5 w-3.5 text-blue-400" />
                      <span>~{course.totalVideosApprox} Lessons</span>
                    </div>

                    {/* Subtle Featured Marker */}
                    {course.featured && (
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md shadow-xs">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        <span>Featured</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col p-4 justify-between">
                    <div>
                      {/* Category & Language Header */}
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${catStyle.badge} truncate`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${catStyle.dot} shrink-0`} />
                          <span className="truncate">{course.categoryNameBn}</span>
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] shrink-0 px-2 py-0.5 rounded bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                          {course.language === 'Bangla' ? 'বাংলা' : course.language}
                        </span>
                      </div>

                      {/* Course Title */}
                      <h3 className="text-sm sm:text-[15px] font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1.5">
                        {course.title}
                      </h3>

                      {/* Instructor & Channel */}
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-2.5">
                        <span className="font-semibold text-[var(--text-primary)] truncate">
                          {course.instructor}
                        </span>
                        <span>·</span>
                        <span className="truncate flex items-center gap-1">
                          {course.channelName}
                          <CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0 inline" />
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-4">
                        {course.description}
                      </p>
                    </div>

                    {/* Clean Footer Actions */}
                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <span className="text-amber-500 font-bold flex items-center gap-0.5">
                          ★ {course.rating.toFixed(1)}
                        </span>
                        <span>·</span>
                        <span>{course.reviewCount}</span>
                        {course.estimatedHours && (
                          <>
                            <span>·</span>
                            <span className="text-[11px] font-medium">{course.estimatedHours}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://www.youtube.com/playlist?list=${course.ytPlaylistId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Preview original playlist on YouTube"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>

                        <button
                          onClick={() => handleEnrollOrResume(course)}
                          disabled={isEnrolling}
                          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 ${
                            isEnrolled
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
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
                              <span>Resume</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>Start</span>
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
