import { NextRequest, NextResponse } from 'next/server';
import { getPlaylistReviewsSummary, saveOrUpdatePlaylistReview } from '@/lib/playlistReviewsServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playlistId = searchParams.get('playlistId');

    if (!playlistId) {
      return NextResponse.json({ error: 'playlistId is required' }, { status: 400 });
    }

    const summary = getPlaylistReviewsSummary(playlistId);
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('Error fetching playlist reviews:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playlistId, userId, userName, rating, feedback, completionPercentage } = body;

    if (!playlistId) {
      return NextResponse.json({ error: 'playlistId is required' }, { status: 400 });
    }

    if (!userName || typeof userName !== 'string' || userName.trim().length < 2) {
      return NextResponse.json({ error: 'অনুগ্রহ করে আপনার নাম প্রদান করুন (অন্তত ২ অক্ষর)' }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'রেটিং অবশ্যই ১ থেকে ৫ স্টারের মধ্যে হতে হবে' }, { status: 400 });
    }

    if (!feedback || typeof feedback !== 'string' || feedback.trim().length < 10) {
      return NextResponse.json({ error: 'অনুগ্রহ করে অন্তত ১০ অক্ষরে আপনার বাস্তব অভিজ্ঞতা লিখুন' }, { status: 400 });
    }

    const compPercent = Number(completionPercentage) || 0;
    if (compPercent < 60) {
      return NextResponse.json(
        { error: 'রিভিউ দেওয়ার জন্য এই প্লেলিস্টের অন্তত ৬০% ভিডিও দেখা সম্পন্ন করতে হবে' },
        { status: 403 }
      );
    }

    const review = saveOrUpdatePlaylistReview({
      playlistId,
      userId: userId || 'user_guest',
      userName: userName.trim(),
      rating: numericRating,
      feedback: feedback.trim(),
      completionPercentage: compPercent,
    });

    const summary = getPlaylistReviewsSummary(playlistId);

    return NextResponse.json({
      success: true,
      review,
      summary,
    });
  } catch (err: any) {
    console.error('Error saving playlist review:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
