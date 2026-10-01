'use client';

import React, { useState } from 'react';
import { X, Video, BookOpen, AlertCircle, Check, Globe } from 'lucide-react';
import { parseYouTubePlaylist } from '@/lib/youtube';
import { generateRoadmapFromSyllabus } from '@/lib/syllabus';
import { Playlist } from '@/types';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCourse: (newCourse: Playlist) => { success: boolean; error?: string };
  currentCount: number;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  isOpen,
  onClose,
  onAddCourse,
  currentCount,
}) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'syllabus'>('youtube');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // YouTube tab state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [customCourseTitle, setCustomCourseTitle] = useState('');

  // Syllabus tab state
  const [syllabusCourseName, setSyllabusCourseName] = useState('');
  const [syllabusText, setSyllabusText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'bn' | 'en' | 'hi'>('bn');

  if (!isOpen) return null;

  const isQuotaReached = currentCount >= 10;

  const handleYouTubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    if (isQuotaReached) {
      setErrorMessage('You have reached the maximum limit of 10 active courses. Please remove an existing course first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const course = await parseYouTubePlaylist(youtubeUrl, customCourseTitle);
      const res = onAddCourse(course);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to add course.');
      } else {
        setYoutubeUrl('');
        setCustomCourseTitle('');
        onClose();
      }
    } catch {
      setErrorMessage('Could not process YouTube playlist. Please check the URL format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyllabusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusText.trim()) return;

    if (isQuotaReached) {
      setErrorMessage('You have reached the maximum limit of 10 active courses. Please remove an existing course first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const course = generateRoadmapFromSyllabus(
        syllabusCourseName.trim() || 'Exam Preparation Course',
        syllabusText,
        selectedLanguage
      );
      const res = onAddCourse(course);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to add roadmap.');
      } else {
        setSyllabusCourseName('');
        setSyllabusText('');
        onClose();
      }
    } catch {
      setErrorMessage('Could not parse syllabus. Please check the text format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
              Add New Learning Course
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Slot capacity: <span className="font-semibold text-[var(--text-primary)]">{currentCount}/10 used</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quota Warning if 10 reached */}
        {isQuotaReached && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-950 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              You have reached your 10 active course capacity limit. Remove or archive an existing course to create a new slot.
            </p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="mt-4 grid grid-cols-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('youtube'); setErrorMessage(''); }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              activeTab === 'youtube'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Video className="h-4 w-4 text-red-500" />
            <span>YouTube Playlist</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('syllabus'); setErrorMessage(''); }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              activeTab === 'syllabus'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpen className="h-4 w-4 text-[#059669]" />
            <span>Syllabus Matcher</span>
          </button>
        </div>

        {/* YouTube Import Form */}
        {activeTab === 'youtube' && (
          <form onSubmit={handleYouTubeSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                YouTube Video or Playlist Link <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=... or playlist link"
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Custom Course Name <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 🎯 My 30-Day Python Mastery"
                value={customCourseTitle}
                onChange={e => setCustomCourseTitle(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-500 font-medium">{errorMessage}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isQuotaReached}
                className="rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] px-4 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {isSubmitting ? 'Fetching...' : 'Import to Kizen'}
              </button>
            </div>
          </form>
        )}

        {/* Flagship: Syllabus-to-Roadmap Form */}
        {activeTab === 'syllabus' && (
          <form onSubmit={handleSyllabusSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Course or Exam Name
              </label>
              <input
                type="text"
                placeholder="e.g. CSE220: Data Structures Midterm"
                value={syllabusCourseName}
                onChange={e => setSyllabusCourseName(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Preferred Video Language
                </label>
                <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                  <Globe className="h-3 w-3" />
                  <span>Curates top lectures in this language</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bn', label: '🇧🇩 বাংলা' },
                  { id: 'en', label: '🇬🇧 English' },
                  { id: 'hi', label: '🇮🇳 Hindi' },
                ].map(lang => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.id as any)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-all ${
                      selectedLanguage === lang.id
                        ? 'border-[#059669] bg-[#059669]/10 text-[#059669]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {selectedLanguage === lang.id && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Paste Course Syllabus or Topic Outline <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder={`Unit 1: Time & Space Complexity\nUnit 2: Singly & Doubly Linked Lists\nUnit 3: Stack & Queue Applications\nUnit 4: Binary Trees & BST`}
                value={syllabusText}
                onChange={e => setSyllabusText(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none resize-none font-mono"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-500 font-medium">{errorMessage}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isQuotaReached}
                className="rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] px-4 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {isSubmitting ? 'Curating Videos...' : 'Generate Exam Roadmap'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
