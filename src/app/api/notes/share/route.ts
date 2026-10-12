import { NextRequest, NextResponse } from 'next/server';
import { getSharedNote, createOrUpdateSharedNote } from '@/lib/sharedNotesServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const noteRecord = getSharedNote(id);
    if (!noteRecord) {
      return NextResponse.json({ error: 'Shared note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, note: noteRecord });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { videoId, videoTitle, courseTitle, language = 'bn', notes } = body;

    if (!videoId || !notes) {
      return NextResponse.json({ error: 'videoId and notes are required' }, { status: 400 });
    }

    const record = createOrUpdateSharedNote({
      videoId,
      videoTitle: videoTitle || 'Lecture Notes',
      courseTitle: courseTitle || '',
      language,
      notes,
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const shareUrl = `${protocol}://${host}/notes/${record.id}`;

    return NextResponse.json({
      success: true,
      shareId: record.id,
      shareUrl,
      record,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to share notes' }, { status: 500 });
  }
}
