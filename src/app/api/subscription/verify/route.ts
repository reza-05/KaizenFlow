import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionRequest, getSubscriptionByTrxId } from '@/lib/subscriptionsServer';

// GET: Check status of a submitted TrxID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trxId = searchParams.get('trxId');

    if (!trxId) {
      return NextResponse.json({ error: 'TrxID is required' }, { status: 400 });
    }

    const order = getSubscriptionByTrxId(trxId);
    if (!order) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order,
      isApproved: order.status === 'approved',
      isPending: order.status === 'pending',
      isRejected: order.status === 'rejected',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST: Submit a real bKash/Nagad payment for verification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { method, senderPhone, trxId, amount = 99, userId, userEmail } = body;

    // Validate payment method
    if (method !== 'bkash' && method !== 'nagad') {
      return NextResponse.json(
        { error: 'Invalid payment method. Only bKash and Nagad are supported.' },
        { status: 400 }
      );
    }

    // Validate phone number (Bangladesh mobile format: 013-019)
    const cleanPhone = (senderPhone || '').replace(/\s+/g, '').replace(/[-+]/g, '');
    const phoneRegex = /^(?:88)?01[3-9]\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX বা 019XXXXXXXX)।' },
        { status: 400 }
      );
    }

    // Validate TrxID (Alphanumeric 7-14 chars, e.g. "BL19X8A22", "9K2LX81P")
    const cleanTrx = (trxId || '').trim().toUpperCase();
    const trxRegex = /^[A-Z0-9]{7,14}$/;
    if (!trxRegex.test(cleanTrx)) {
      return NextResponse.json(
        { error: 'সঠিক বিকাশ/নগদ Transaction ID (TrxID) দিন (কমপক্ষে ৭-১৪ অক্ষরের কোড, যেমন: BL19X8A22)।' },
        { status: 400 }
      );
    }

    // Submit for real admin verification
    const result = createSubscriptionRequest({
      method,
      senderPhone: cleanPhone.slice(-11),
      trxId: cleanTrx,
      amount: Number(amount) || 99,
      userId,
      userEmail,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'এই TrxID দিয়ে সাবমিশন সম্পন্ন করা সম্ভব হয়নি।' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      status: 'pending',
      order: result.order,
      message: 'পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে! আমাদের অ্যাডমিন 01832-622658 নম্বরে টাকা আসার পর যাচাই করে Pro সক্রিয় করে দেবে।',
    });
  } catch (error: any) {
    console.error('Subscription verification error:', error);
    return NextResponse.json(
      { error: 'পেমেন্ট যাচাইয়ের সময় সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
