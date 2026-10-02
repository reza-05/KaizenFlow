'use client';

import React, { useState } from 'react';
import { Play, MoreVertical, Trash2, Edit2, CheckCircle2, BookOpen, Check, Award } from 'lucide-react';
import { Playlist } from '@/types';

interface CourseCardProps {
  course: Playlist;
  onOpenCourse: (course: Playlist) => void;
  onDeleteCourse: (courseId: string) => void;
  onRenameCourse: (courseId: string, newTitle: string) => void;
  onViewBadge?: (course: Playlist) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onOpenCourse,
  onDeleteCourse,
  onRenameCourse,
  onViewBadge,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(course.customTitle);
  const [showMenu, setShowMenu] = useState(false);

  const percent = course.totalVideos > 0 
    ? Math.round((course.completedVideos / course.totalVideos) * 100) 
    : 0;

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedTitle.trim()) {
      onRenameCourse(course.id, editedTitle.trim());
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="group relative flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-xs hover:shadow-md hover:border-[var(--border-strong)] transition-all duration-200">
      {/* Thumbnail Header */}
      <div 
        onClick={() => onOpenCourse(course)}
        className="relative aspect-video w-full overflow-hidden bg-[var(--bg-surface-subtle)] cursor-pointer"
      >
        <img
          src={course.thumbnailUrl}
          alt={course.customTitle}
          className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

        {/* Source Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-semibold text-white">
          <BookOpen className="h-3 w-3" />
          <span>
            {course.sourceType === 'syllabus_roadmap'
              ? `Syllabus (${course.languagePreference?.toUpperCase() || 'EN'})`
              : 'YouTube Playlist'}
          </span>
        </div>

        {/* Play Overlay Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-lg transform group-hover:scale-105 transition-transform">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Course Info */}
      <div className="flex flex-1 flex-col p-4 justify-between">
        <div>
          {/* Title or Inline Edit */}
          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} className="flex items-center gap-1.5 mb-2">
              <input
                type="text"
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                autoFocus
                className="w-full rounded border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
              />
              <button
                type="submit"
                className="p-1 rounded bg-[var(--text-primary)] text-[var(--bg-canvas)]"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 
                onClick={() => onOpenCourse(course)}
                className="text-sm font-bold tracking-tight text-[var(--text-primary)] line-clamp-2 hover:underline cursor-pointer"
              >
                {course.customTitle}
              </h4>

              {/* Action Menu */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-6 z-30 w-44 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-1 shadow-lg text-xs">
                    {percent === 100 && onViewBadge && (
                      <button
                        onClick={() => { onViewBadge(course); setShowMenu(false); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-amber-500 hover:bg-[var(--bg-surface-subtle)] font-medium"
                      >
                        <Award className="h-3.5 w-3.5" />
                        <span>View Badge & Cert</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setIsEditingTitle(true); setShowMenu(false); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)]"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={() => { onDeleteCourse(course.id); setShowMenu(false); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lessons count */}
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mt-1">
            <span>{course.completedVideos} of {course.totalVideos} lessons completed</span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">{percent}%</span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-subtle)]">
            <div
              className={`h-full transition-all duration-300 ${
                percent === 100 ? 'bg-[#059669]' : 'bg-[var(--text-primary)]'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Card Footer Button */}
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
          <button
            onClick={() => onOpenCourse(course)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] hover:underline cursor-pointer"
          >
            <span>{percent === 100 ? 'Review Course' : course.completedVideos > 0 ? 'Resume Lesson' : 'Start Course'}</span>
            <Play className="h-3 w-3 fill-current" />
          </button>

          {percent === 100 && (
            <div className="flex items-center gap-2">
              {onViewBadge && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewBadge(course);
                  }}
                  className="flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-500 hover:bg-amber-500/20 transition-all cursor-pointer shadow-2xs"
                  title="View and download completion badge and certificate"
                >
                  <Award className="h-3 w-3" />
                  <span>Badge</span>
                </button>
              )}
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#059669]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Complete</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
