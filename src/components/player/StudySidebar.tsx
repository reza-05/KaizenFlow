'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Play, 
  ListVideo, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  Clock 
} from 'lucide-react';
import { VideoItem, StudyNote } from '@/types';

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
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'notes'>('queue');
  const [newNoteContent, setNewNoteContent] = useState<string>('');

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    onAddNote(newNoteContent.trim(), activeTimestampSeconds);
    setNewNoteContent('');
  };

  const handleExportNotes = () => {
    if (notes.length === 0) return;
    const markdownContent = notes
      .map(n => `### [${n.timestampFormatted}]\n${n.content}\n\n*Created: ${new Date(n.createdAt).toLocaleDateString()}*\n`)
      .join('\n---\n\n');

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kizen_notes_${currentVideoId}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentMins = Math.floor(activeTimestampSeconds / 60);
  const currentSecs = activeTimestampSeconds % 60;
  const currentTimestampFormatted = `${currentMins}:${currentSecs < 10 ? '0' : ''}${currentSecs}`;

  return (
    <div className="flex flex-col h-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xs overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/50">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors ${
            activeTab === 'queue'
              ? 'border-b-2 border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ListVideo className="h-3.5 w-3.5" />
          <span>Course Queue ({videos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors ${
            activeTab === 'notes'
              ? 'border-b-2 border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Notes ({notes.length})</span>
        </button>
      </div>

      {/* Tab Content: Course Queue */}
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

      {/* Tab Content: Notes */}
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
                  className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-primary)] hover:underline"
                >
                  <Download className="h-3 w-3" />
                  <span>Export</span>
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
                <p className="text-xs">No notes captured yet for this video.</p>
                <p className="text-[10px] mt-0.5">Type above to save timestamped thoughts.</p>
              </div>
            ) : (
              notes.map(note => (
                <div
                  key={note.id}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-2.5 shadow-2xs group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-[var(--text-primary)] bg-[var(--bg-surface-subtle)] px-1.5 py-0.5 rounded">
                      [{note.timestampFormatted}]
                    </span>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
