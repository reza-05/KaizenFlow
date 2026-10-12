import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllSubscriptions, 
  verifyAdminSecret, 
  approveSubscriptionOrder, 
  rejectSubscriptionOrder 
} from '@/lib/subscriptionsServer';

// GET: List all subscription orders (Requires adminSecret)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('adminSecret') || '';

    if (!verifyAdminSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid admin secret key' }, { status: 401 });
    }

    const orders = getAllSubscriptions();
    return NextResponse.json({
      success: true,
      orders,
      pendingCount: orders.filter(o => o.status === 'pending').length,
      approvedCount: orders.filter(o => o.status === 'approved').length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST: Approve or Reject a subscription order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { adminSecret = '', action, orderId } = body;

    if (!verifyAdminSecret(adminSecret)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid admin secret key' }, { status: 401 });
    }

    if (!orderId || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { error: 'Invalid parameters. action must be "approve" or "reject", orderId is required.' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const res = approveSubscriptionOrder(orderId);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to approve' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Order ${orderId} has been APPROVED! 30-day Pro access is now active.`,
        order: res.order,
      });
    }

    if (action === 'reject') {
      const res = rejectSubscriptionOrder(orderId);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to reject' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Order ${orderId} has been REJECTED.`,
        order: res.order,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
