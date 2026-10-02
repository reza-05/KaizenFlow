'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Flame, Award, BookOpen, Layers, CheckCircle2, Compass, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { AddCourseModal } from '@/components/dashboard/AddCourseModal';
import { CompletionBadgeModal } from '@/components/dashboard/CompletionBadgeModal';
import { RewardsHubModal } from '@/components/dashboard/RewardsHubModal';
import { CinemaPlayer } from '@/components/player/CinemaPlayer';
import { StudySidebar } from '@/components/player/StudySidebar';
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
  deleteNote
} from '@/lib/storage';
import { Playlist, VideoItem, UserProfile, StudyNote, EvaluatedBadge } from '@/types';

export default function KaizenFlowApp() {
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeCourse, setActiveCourse] = useState<Playlist | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBadgeCourse, setSelectedBadgeCourse] = useState<Playlist | null>(null);
  const [isRewardsHubOpen, setIsRewardsHubOpen] = useState(false);
  const [selectedExportBadge, setSelectedExportBadge] = useState<EvaluatedBadge | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [activityMap, setActivityMap] = useState(getDailyActivityMap());
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [activeTimestampSeconds, setActiveTimestampSeconds] = useState(0);
  const [focusWarning, setFocusWarning] = useState<string | null>(null);

  useEffect(() => {
    const handleFocusReturn = (e: Event) => {
      const customEvt = e as CustomEvent<{ distractionCount: number }>;
      const count = customEvt.detail?.distractionCount || 1;
      setFocusWarning(`⚠️ Isolation Alert: Tab switch detected! Stay focused on your study (${count} distraction attempts logged).`);
      setTimeout(() => setFocusWarning(null), 6000);
    };

    window.addEventListener('kaizenflow-focus-return', handleFocusReturn);
    return () => window.removeEventListener('kaizenflow-focus-return', handleFocusReturn);
  }, []);

  useEffect(() => {
    setMounted(true);
    const cleanActivity = getDailyActivityMap();
    setActivityMap(cleanActivity);
    const profile = getInitialUserProfile();
    setUserProfile(profile);

    const loadedPlaylists = getPlaylists();
    setPlaylists(loadedPlaylists);

    const allProgress = getVideoProgressList();
    const verifiedStatus: Record<string, boolean> = {};
    Object.values(allProgress).forEach(p => {
      if (p.isVerified) {
        verifiedStatus[`${p.playlistId}_${p.ytVideoId}`] = true;
      }
    });
    setProgressMap(verifiedStatus);
  }, []);

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
      id: 'note_' + Date.now().toString(36),
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
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        userProfile={userProfile || undefined}
        activeCourseTitle={activeCourse?.customTitle}
        onBackToDashboard={activeCourse ? handleBackToDashboard : undefined}
        onOpenRewardsHub={() => setIsRewardsHubOpen(true)}
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
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Cinema Player Area (8 cols on large screens) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <CinemaPlayer
                video={activeVideo}
                playlistId={activeCourse.id}
                isVerified={Boolean(progressMap[`${activeCourse.id}_${activeVideo.ytVideoId}`])}
                onVerify={handleVerifyVideo}
                onNextVideo={handleNextVideo}
                hasNextVideo={hasNextVideo}
                onTimestampCapture={sec => setActiveTimestampSeconds(sec)}
              />
            </div>

            {/* Right Sidebar: Queue & Notes (4 cols on large screens, scrollable on mobile) */}
            <div className="lg:col-span-4 min-h-[440px] lg:min-h-0 lg:h-[calc(100vh-7.5rem)] lg:sticky top-20">
              <StudySidebar
                playlistId={activeCourse.id}
                videos={activeCourse.videos}
                currentVideoId={activeVideo.ytVideoId}
                onSelectVideo={video => setActiveVideo(video)}
                verifiedMap={progressMap}
                notes={notes}
                onAddNote={handleAddStudyNote}
                onDeleteNote={handleDeleteStudyNote}
                activeTimestampSeconds={activeTimestampSeconds}
                courseTitle={activeCourse.customTitle}
                videoTitle={activeVideo.title}
              />
            </div>
          </div>
        </main>
      ) : (
        /* DASHBOARD / LIBRARY VIEW */
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Consistency Heatmap */}
          <ActivityHeatmap
            activityMap={activityMap}
            currentStreak={userProfile?.currentStreak || 0}
            longestStreak={userProfile?.longestStreak || userProfile?.currentStreak || 0}
            totalLessonsCompleted={Object.values(progressMap).filter(Boolean).length}
          />

          {/* Active Courses Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
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

            {/* Courses Grid */}
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

      {/* Academic Levels & Badges Hub Modal */}
      <RewardsHubModal
        isOpen={isRewardsHubOpen}
        onClose={() => setIsRewardsHubOpen(false)}
        userProfile={userProfile}
        completedCoursesCount={playlists.filter(p => p.totalVideos > 0 && p.completedVideos >= p.totalVideos).length}
        onSelectBadgeForExport={b => setSelectedExportBadge(b)}
      />

      {/* Course Completion & Milestone Badge Certificate Modal */}
      <CompletionBadgeModal
        isOpen={Boolean(selectedBadgeCourse || selectedExportBadge)}
        onClose={() => {
          setSelectedBadgeCourse(null);
          setSelectedExportBadge(null);
        }}
        course={selectedBadgeCourse}
        badge={selectedExportBadge}
        userProfile={userProfile}
      />
    </div>
  );
}
