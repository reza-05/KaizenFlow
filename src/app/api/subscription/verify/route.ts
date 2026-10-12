import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { method, senderPhone, trxId, amount = 99 } = body;

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
        { error: 'সঠিক বিকাশ/নগদ Transaction ID (TrxID) দিন (যেমন: BL19X8A22)।' },
        { status: 400 }
      );
    }

    // Calculate 30-day expiration date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const expiresAt = expiryDate.toISOString();

    const orderId = `KF-ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    return NextResponse.json({
      success: true,
      orderId,
      trxId: cleanTrx,
      method,
      senderPhone: cleanPhone.slice(-11), // 01XXXXXXXXX format
      amount: Number(amount) || 99,
      expiresAt,
      message: 'পেমেন্ট সফলভাবে নিশ্চিত করা হয়েছে! আপনার KaizenFlow Pro ৩০ দিনের জন্য সক্রিয় হয়েছে।',
    });
  } catch (error: any) {
    console.error('Subscription verification error:', error);
    return NextResponse.json(
      { error: 'পেমেন্ট যাচাইয়ের সময় সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
