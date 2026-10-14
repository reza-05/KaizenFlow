'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Plus, Flame, Award, BookOpen, Layers, CheckCircle2, Compass, ArrowRight, ListVideo, HelpCircle, FileText, Star, Play, Check } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { AddCourseModal } from '@/components/dashboard/AddCourseModal';
import { CompletionBadgeModal } from '@/components/dashboard/CompletionBadgeModal';
import { getFeaturedPreviewCourses, CuratedCourse } from '@/lib/curatedCatalog';
import { parseYouTubePlaylist } from '@/lib/youtube';
import { CinemaPlayer } from '@/components/player/CinemaPlayer';
import { StudySidebar } from '@/components/player/StudySidebar';
import { LessonQuizSection } from '@/components/player/LessonQuizSection';
import { PlaylistReviewModal } from '@/components/player/PlaylistReviewModal';
import { 
  getPlaylists, 
  savePlaylists, 
  addPlaylist, 
  deletePlaylist, 
  renamePlaylist, 
  getInitialUserProfile, 
  getVideoProgressList, 
  markVideoVerified, 
  getDailyActivityMap,
  getNotes,
  addNote,
  addNotes,
  deleteNote
} from '@/lib/storage';
import { Playlist, VideoItem, UserProfile, StudyNote } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function KaizenFlowApp() {
  const { user, userProfile: authProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeCourse, setActiveCourse] = useState<Playlist | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBadgeCourse, setSelectedBadgeCourse] = useState<Playlist | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [rawProgressMap, setRawProgressMap] = useState<Record<string, any>>({});
  const [activityMap, setActivityMap] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [activeTimestampSeconds, setActiveTimestampSeconds] = useState(0);
  const [focusWarning, setFocusWarning] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'queue' | 'ai_notes' | 'quiz' | 'notes'>('queue');
  const [enrollingPreviewId, setEnrollingPreviewId] = useState<string | null>(null);

  useEffect(() => {
    const handleFocusReturn = (e: Event) => {
      const customEvt = e as CustomEvent<{ distractionCount: number }>;
      const count = customEvt.detail?.distractionCount || 1;
      setFocusWarning(`⚠️ Isolation Alert: Tab switch detected! Stay focused on your study (${count} distraction attempts logged).`);
      setTimeout(() => setFocusWarning(null), 6000);
    };

    const handleCustomTabSwitch = (e: Event) => {
      const customEvt = e as CustomEvent<{ tab: 'queue' | 'ai_notes' | 'quiz' | 'notes' }>;
      if (customEvt.detail?.tab) {
        setMobileTab(customEvt.detail.tab);
      }
    };

    window.addEventListener('kaizenflow-focus-return', handleFocusReturn);
    window.addEventListener('kaizenflow-switch-tab', handleCustomTabSwitch);
    return () => {
      window.removeEventListener('kaizenflow-focus-return', handleFocusReturn);
      window.removeEventListener('kaizenflow-switch-tab', handleCustomTabSwitch);
    };
  }, []);

  // Reload user data whenever auth user changes
  useEffect(() => {
    setMounted(true);
    const cleanActivity = getDailyActivityMap();
    setActivityMap(cleanActivity);
    const profile = user ? authProfile : getInitialUserProfile();
    setUserProfile(profile);

    const loadedPlaylists = getPlaylists();
    setPlaylists(loadedPlaylists);

    const allProgress = getVideoProgressList();
    setRawProgressMap(allProgress);
    const verifiedStatus: Record<string, boolean> = {};
    Object.values(allProgress).forEach(p => {
      if (p.isVerified || p.isCompleted) {
        verifiedStatus[`${p.playlistId}_${p.ytVideoId}`] = true;
      }
    });
    setProgressMap(verifiedStatus);

    // Auto-open course if requested from course catalog or external link
    const pendingCourseId = typeof window !== 'undefined' ? localStorage.getItem('kaizenflow_pending_open_course') : null;
    if (pendingCourseId) {
      localStorage.removeItem('kaizenflow_pending_open_course');
      const target = loadedPlaylists.find(p => p.id === pendingCourseId || p.ytPlaylistId === pendingCourseId);
      if (target) {
        setActiveCourse(target);
        setMobileTab('queue');
        const unwatched = target.videos.find(v => !verifiedStatus[`${target.id}_${v.ytVideoId}`]);
        setActiveVideo(unwatched || target.videos[0]);
      }
    }
  }, [user?.uid, authProfile]);

  // Sync notes when active video changes
  useEffect(() => {
    if (activeVideo) {
      setNotes(getNotes(activeVideo.ytVideoId));
    }
  }, [activeVideo?.ytVideoId]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-canvas)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-primary)] border-t-transparent" />
      </div>
    );
  }

  const handleOpenCourse = (course: Playlist) => {
    setActiveCourse(course);
    setMobileTab('queue');
    // Select first unwatched video in this course, or first video
    const unwatched = course.videos.find(v => !progressMap[`${course.id}_${v.ytVideoId}`]);
    setActiveVideo(unwatched || course.videos[0]);
  };

  const handleBackToDashboard = () => {
    setActiveCourse(null);
    setActiveVideo(null);
    // Refresh playlists and profile state
    setPlaylists(getPlaylists());
    setUserProfile(getInitialUserProfile());
  };

  const handleAddCourse = (newCourse: Playlist) => {
    const res = addPlaylist(newCourse);
    if (res.success) {
      setPlaylists(getPlaylists());
      if (userProfile) {
        setUserProfile({ ...userProfile, activePlaylistsCount: playlists.length + 1 });
      }
    }
    return res;
  };

  const handleQuickEnrollOrOpen = async (course: CuratedCourse) => {
    // 1. If already in library, open directly
    const existing = playlists.find(p => p.ytPlaylistId === course.ytPlaylistId);
    if (existing) {
      handleOpenCourse(existing);
      return;
    }

    // 2. Check quota
    if (playlists.length >= 10) {
      alert('You have reached the limit of 10 active courses. Please remove an existing course to add a new one.');
      return;
    }

    setEnrollingPreviewId(course.id);
    try {
      const parsed = await parseYouTubePlaylist(course.ytPlaylistId, course.title);
      const res = handleAddCourse(parsed);
      if (res.success) {
        confetti({ particleCount: 65, spread: 55, origin: { y: 0.6 } });
        handleOpenCourse(parsed);
      } else {
        alert(res.error || 'Failed to add course.');
      }
    } catch (err: any) {
      alert(err?.message || 'Could not load course. Please try again.');
    } finally {
      setEnrollingPreviewId(null);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    deletePlaylist(courseId);
    setPlaylists(getPlaylists());
    if (userProfile) {
      setUserProfile({ ...userProfile, activePlaylistsCount: Math.max(0, playlists.length - 1) });
    }
  };

  const handleRenameCourse = (courseId: string, newTitle: string) => {
    renamePlaylist(courseId, newTitle);
    setPlaylists(getPlaylists());
  };

  const handleVerifyVideo = (playlistId: string, videoId: string, title: string) => {
    const { xpEarned, newStreak } = markVideoVerified(playlistId, videoId, title);
    
    // Update local verified state
    const updatedProgress = { ...progressMap, [`${playlistId}_${videoId}`]: true };
    setProgressMap(updatedProgress);
    
    // Refresh user profile and activity heatmap
    setActivityMap(getDailyActivityMap());
    setUserProfile(getInitialUserProfile());
    const updatedPlaylists = getPlaylists();
    setPlaylists(updatedPlaylists);

    // Detect if this verification completed 100% of the course!
    const targetCourse = updatedPlaylists.find(p => p.id === playlistId);
    if (targetCourse && targetCourse.videos.length > 0) {
      const isCourseCompleted = targetCourse.videos.every(
        v => updatedProgress[`${playlistId}_${v.ytVideoId}`]
      );
      if (isCourseCompleted) {
        // Celebratory confetti burst
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#38bdf8', '#ffffff'],
        });

        // Automatically present Completion Badge & Certificate modal
        setTimeout(() => {
          setSelectedBadgeCourse(targetCourse);
        }, 600);
      }
    }
  };

  const handleNextVideo = () => {
    if (!activeCourse || !activeVideo) return;
    const currentIndex = activeCourse.videos.findIndex(v => v.ytVideoId === activeVideo.ytVideoId);
    if (currentIndex >= 0 && currentIndex < activeCourse.videos.length - 1) {
      setActiveVideo(activeCourse.videos[currentIndex + 1]);
    }
  };

  const handleAddStudyNote = (content: string, timestampSeconds: number) => {
    if (!activeVideo || !activeCourse) return;
    const mins = Math.floor(timestampSeconds / 60);
    const secs = timestampSeconds % 60;

    const newNote: StudyNote = {
      id: `note_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
      playlistId: activeCourse.id,
      videoId: activeVideo.ytVideoId,
      timestampSeconds,
      timestampFormatted: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
      content,
      createdAt: new Date().toISOString(),
    };

    const updated = addNote(newNote);
    setNotes(updated);
  };

  const handleAddStudyNotesBulk = (items: { content: string; timestampSeconds: number }[]) => {
    if (!activeVideo || !activeCourse || items.length === 0) return;
    const now = Date.now().toString(36);
    const newNotes: StudyNote[] = items.map((item, idx) => {
      const mins = Math.floor(item.timestampSeconds / 60);
      const secs = item.timestampSeconds % 60;
      return {
        id: `note_${now}_${idx}_${Math.random().toString(36).substring(2, 8)}`,
        playlistId: activeCourse.id,
        videoId: activeVideo.ytVideoId,
        timestampSeconds: item.timestampSeconds,
        timestampFormatted: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
        content: item.content,
        createdAt: new Date().toISOString(),
      };
    });

    const updated = addNotes(newNotes);
    setNotes(updated);
  };

  const handleDeleteStudyNote = (noteId: string) => {
    if (!activeVideo) return;
    const updated = deleteNote(activeVideo.ytVideoId, noteId);
    setNotes(updated);
  };

  const currentVideoIndex = activeCourse && activeVideo
    ? activeCourse.videos.findIndex(v => v.ytVideoId === activeVideo.ytVideoId)
    : -1;
  const hasNextVideo = Boolean(
    activeCourse && currentVideoIndex >= 0 && currentVideoIndex < activeCourse.videos.length - 1
  );

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        userProfile={userProfile || undefined}
        activeCourseTitle={activeCourse?.customTitle}
        onBackToDashboard={activeCourse ? handleBackToDashboard : undefined}
      />

      {/* Floating Dynamic Island HUD Pill (Zero layout-shift, high-end feel) */}
      {focusWarning && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3 rounded-full border border-zinc-800/80 bg-zinc-950/95 px-4 py-2 text-xs text-zinc-200 shadow-2xl backdrop-blur-md">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
            </span>
            <span className="truncate">{focusWarning}</span>
            <button
              onClick={() => setFocusWarning(null)}
              className="ml-auto rounded-full p-1 text-zinc-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main View: Study Room vs Dashboard */}
      {activeCourse && activeVideo ? (
        /* STUDY ROOM / CINEMA FOCUS PLAYER VIEW */
        <main className={`w-full max-w-full min-w-0 mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6 transition-all duration-300 overflow-x-hidden ${
          isTheaterMode ? 'max-w-[1600px]' : 'max-w-7xl'
        }`}>
          {isTheaterMode ? (
            /* THEATER / WIDE CINEMA VIEW: Video at 100% width on top, Quiz & Sidebar flowing underneath */
            <div className="flex flex-col gap-6">
              {/* Top Full-Width Cinema Video Player */}
              <div className="w-full">
                <CinemaPlayer
                  video={activeVideo}
                  playlistId={activeCourse.id}
                  isVerified={Boolean(progressMap[`${activeCourse.id}_${activeVideo.ytVideoId}`])}
                  onVerify={handleVerifyVideo}
                  onNextVideo={handleNextVideo}
                  hasNextVideo={hasNextVideo}
                  onTimestampCapture={sec => setActiveTimestampSeconds(sec)}
                  onOpenReviews={() => {
                    setRawProgressMap(getVideoProgressList());
                    setIsReviewModalOpen(true);
                  }}
                  isTheaterMode={isTheaterMode}
                  onToggleTheater={() => setIsTheaterMode(prev => !prev)}
                />
              </div>

              {/* Directly Underneath: Video MCQ Quiz on Left, Queue & Notes on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <LessonQuizSection
                    video={activeVideo}
                    courseTitle={activeCourse.customTitle}
                  />
                </div>

                <div className="lg:col-span-4 min-h-[440px] lg:min-h-0 lg:h-[calc(100vh-7.5rem)] lg:sticky top-20">
                  <StudySidebar
                    playlistId={activeCourse.id}
                    videos={activeCourse.videos}
                    currentVideoId={activeVideo.ytVideoId}
                    onSelectVideo={video => setActiveVideo(video)}
                    verifiedMap={progressMap}
                    notes={notes}
                    onAddNote={handleAddStudyNote}
                    onAddNotesBulk={handleAddStudyNotesBulk}
                    onDeleteNote={handleDeleteStudyNote}
                    activeTimestampSeconds={activeTimestampSeconds}
                    courseTitle={activeCourse.customTitle}
                    videoTitle={activeVideo.title}
                    onOpenReviews={() => {
                      setRawProgressMap(getVideoProgressList());
                      setIsReviewModalOpen(true);
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* DEFAULT VIEW: Standard 8-Col Player + MCQ below player & 4-Col Sidebar on Desktop, Unified Tabbed on Mobile/Tablet */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Cinema Player Area (8 cols on desktop, full width on mobile) */}
              <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
                <CinemaPlayer
                  video={activeVideo}
                  playlistId={activeCourse.id}
                  isVerified={Boolean(progressMap[`${activeCourse.id}_${activeVideo.ytVideoId}`])}
                  onVerify={handleVerifyVideo}
                  onNextVideo={handleNextVideo}
                  hasNextVideo={hasNextVideo}
                  onTimestampCapture={sec => setActiveTimestampSeconds(sec)}
                  onOpenReviews={() => {
                    setRawProgressMap(getVideoProgressList());
                    setIsReviewModalOpen(true);
                  }}
                  isTheaterMode={isTheaterMode}
                  onToggleTheater={() => setIsTheaterMode(prev => !prev)}
                />

                {/* MOBILE / TABLET UNIFIED TABBED VIEW (< lg screens) */}
                <div className="block lg:hidden space-y-3.5">
                  {/* Segmented Control Bar */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] overflow-x-auto scrollbar-none shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setMobileTab('queue')}
                      className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        mobileTab === 'queue'
                          ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <ListVideo className="h-3.5 w-3.5" />
                      <span>কিউ ({activeCourse.videos.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMobileTab('ai_notes')}
                      className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        mobileTab === 'ai_notes'
                          ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                      <span>এআই নোটস</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMobileTab('quiz')}
                      className={`flex-1 min-w-[65px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        mobileTab === 'quiz'
                          ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>কুইজ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMobileTab('notes')}
                      className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        mobileTab === 'notes'
                          ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>নোটস ({notes.length})</span>
                    </button>
                  </div>

                  {/* Active Content on Mobile */}
                  {mobileTab === 'quiz' ? (
                    <LessonQuizSection
                      video={activeVideo}
                      courseTitle={activeCourse.customTitle}
                    />
                  ) : (
                    <div className="h-[520px] sm:h-[600px] flex flex-col">
                      <StudySidebar
                        playlistId={activeCourse.id}
                        videos={activeCourse.videos}
                        currentVideoId={activeVideo.ytVideoId}
                        onSelectVideo={video => setActiveVideo(video)}
                        verifiedMap={progressMap}
                        notes={notes}
                        onAddNote={handleAddStudyNote}
                        onAddNotesBulk={handleAddStudyNotesBulk}
                        onDeleteNote={handleDeleteStudyNote}
                        activeTimestampSeconds={activeTimestampSeconds}
                        courseTitle={activeCourse.customTitle}
                        videoTitle={activeVideo.title}
                        externalActiveTab={mobileTab}
                        onExternalTabChange={tab => setMobileTab(tab)}
                        onOpenReviews={() => {
                          setRawProgressMap(getVideoProgressList());
                          setIsReviewModalOpen(true);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* DESKTOP ONLY: Video Active Recall MCQ Quiz directly below player (>= lg) */}
                <div className="hidden lg:block">
                  <LessonQuizSection
                    video={activeVideo}
                    courseTitle={activeCourse.customTitle}
                  />
                </div>
              </div>

              {/* DESKTOP ONLY: Right Sidebar (4 cols on large screens, >= lg) */}
              <div className="hidden lg:block lg:col-span-4 min-h-[440px] lg:min-h-0 lg:h-[calc(100vh-7.5rem)] lg:sticky top-20">
                <StudySidebar
                  playlistId={activeCourse.id}
                  videos={activeCourse.videos}
                  currentVideoId={activeVideo.ytVideoId}
                  onSelectVideo={video => setActiveVideo(video)}
                  verifiedMap={progressMap}
                  notes={notes}
                  onAddNote={handleAddStudyNote}
                  onAddNotesBulk={handleAddStudyNotesBulk}
                  onDeleteNote={handleDeleteStudyNote}
                  activeTimestampSeconds={activeTimestampSeconds}
                  courseTitle={activeCourse.customTitle}
                  videoTitle={activeVideo.title}
                  onOpenReviews={() => {
                    setRawProgressMap(getVideoProgressList());
                    setIsReviewModalOpen(true);
                  }}
                />
              </div>
            </div>
          )}
        </main>
      ) : (
        /* DASHBOARD / LIBRARY VIEW */
        <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 w-full max-w-full overflow-x-hidden min-w-0">
          {/* Consistency Heatmap */}
          <ActivityHeatmap
            activityMap={activityMap}
            currentStreak={userProfile?.currentStreak || 0}
            longestStreak={userProfile?.longestStreak || userProfile?.currentStreak || 0}
            totalLessonsCompleted={Object.values(progressMap).filter(Boolean).length}
          />

          {/* Active Courses Section */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--text-secondary)]" />
                <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                  My Active Courses ({playlists.length}/10 slots used)
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] px-3.5 py-2 text-xs font-semibold hover:opacity-90 shadow-xs transition-opacity cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Import Course / Syllabus</span>
              </button>
            </div>

            {/* Courses Grid or Empty State */}
            {playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/40 p-12 text-center my-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] mb-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Welcome to your study library!
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md mt-1.5 mb-6 leading-relaxed">
                  You have no active courses yet. Import any YouTube playlist URL or search a topic to lock in and begin your learning journey.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] px-5 py-2.5 text-xs font-semibold hover:opacity-90 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Import Your First Course</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onOpenCourse={handleOpenCourse}
                    onDeleteCourse={handleDeleteCourse}
                    onRenameCourse={handleRenameCourse}
                    onViewBadge={c => setSelectedBadgeCourse(c)}
                  />
                ))}

                {/* Add New Course Placeholder Card (if under 10) */}
                {playlists.length < 10 && (
                  <div
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/40 p-8 text-center cursor-pointer hover:border-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]/70 transition-all duration-200 min-h-[260px] group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:scale-105 transition-all">
                      <Plus className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] mt-3">
                      Add Another Course
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] max-w-xs mt-1">
                      Paste YouTube playlist URL or map your exam syllabus ({10 - playlists.length} slots left)
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Curated Top Courses Shelf */}
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-7 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-blue-500" />
                  <h2 className="text-sm sm:text-base font-bold tracking-tight text-[var(--text-primary)]">
                    Featured Deep-Dive Playlists (জনপ্রিয় সিলেক্টেড কোর্সসমূহ)
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Handpicked courses by Chinmoy Saha, Kazi Rakibul, Learn with Hemel, Saikat Abdullah, CodeWithHarry, Apna College, and more.
                </p>
              </div>

              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] transition-all shrink-0 cursor-pointer shadow-2xs group"
              >
                <span>View All Courses (সবগুলো দেখুন)</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Grid of 4 top featured courses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getFeaturedPreviewCourses().slice(0, 4).map(course => {
                const isEnrolled = playlists.some(p => p.ytPlaylistId === course.ytPlaylistId);
                const isEnrolling = enrollingPreviewId === course.id;

                return (
                  <div
                    key={course.id}
                    className="group flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/30 hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)] transition-all duration-200 overflow-hidden shadow-2xs"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div className="relative aspect-video w-full overflow-hidden bg-black/10">
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                        
                        <div className="absolute top-2 left-2 rounded-full bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                          {course.categoryNameBn}
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/90">
                          <span className="flex items-center gap-1">
                            <ListVideo className="h-2.5 w-2.5" />
                            <span>~{course.totalVideosApprox} Lessons</span>
                          </span>
                          <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            <span>{course.rating.toFixed(1)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3.5 space-y-2">
                        <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                          <span className="font-semibold text-[var(--text-primary)] truncate">
                            {course.instructor}
                          </span>
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                        </div>

                        <h3 className="text-xs font-bold text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-blue-500 transition-colors">
                          {course.title}
                        </h3>

                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer Button */}
                    <div className="p-3.5 pt-0">
                      <button
                        onClick={() => handleQuickEnrollOrOpen(course)}
                        disabled={isEnrolling}
                        className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
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
                            <Check className="h-3 w-3" />
                            <span>Resume</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current" />
                            <span>Start Course</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {/* Add Course Modal */}
      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCourse={handleAddCourse}
        currentCount={playlists.length}
      />

      {/* Course Completion Badge & Certificate Modal */}
      <CompletionBadgeModal
        isOpen={Boolean(selectedBadgeCourse)}
        onClose={() => setSelectedBadgeCourse(null)}
        course={selectedBadgeCourse}
        userProfile={userProfile}
      />

      {/* Course Verified Student Reviews & Rating Modal */}
      <PlaylistReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        playlist={activeCourse}
        progressMap={rawProgressMap}
        userProfile={userProfile || undefined}
        onReviewSubmitted={() => {
          setRawProgressMap(getVideoProgressList());
        }}
      />
    </div>
  );
}
