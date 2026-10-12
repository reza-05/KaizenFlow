import fs from 'fs';
import path from 'path';

export interface SubscriptionOrder {
  id: string; // e.g. "KF-ORD-xxxx"
  method: 'bkash' | 'nagad';
  senderPhone: string;
  trxId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  userId?: string;
  userEmail?: string;
  createdAt: string;
  approvedAt?: string;
  expiresAt?: string; // 30 days from approval
}

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'subscriptions.json');

// Ensure data file exists
function ensureFile(): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring subscriptions file:', err);
  }
}

export function getAllSubscriptions(): SubscriptionOrder[] {
  ensureFile();
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content) as SubscriptionOrder[];
  } catch (err) {
    console.error('Error reading subscriptions:', err);
    return [];
  }
}

export function saveAllSubscriptions(orders: SubscriptionOrder[]): void {
  ensureFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing subscriptions:', err);
  }
}

export function createSubscriptionRequest(data: {
  method: 'bkash' | 'nagad';
  senderPhone: string;
  trxId: string;
  amount?: number;
  userId?: string;
  userEmail?: string;
}): { success: boolean; order: SubscriptionOrder; error?: string } {
  const cleanTrx = data.trxId.trim().toUpperCase();
  const orders = getAllSubscriptions();

  // Check if TrxID already exists in our system (Anti-duplicate fraud)
  const existing = orders.find(o => o.trxId === cleanTrx);
  if (existing) {
    if (existing.status === 'approved') {
      return { success: false, order: existing, error: 'এই TrxID টি ইতিমধ্যে একবার ব্যবহার ও অনুমোদিত হয়েছে।' };
    }
    if (existing.status === 'pending') {
      return { success: false, order: existing, error: 'এই TrxID টির জন্য একটি রিকোয়েস্ট ইতিমধ্যে প্রক্রিয়াধীন রয়েছে।' };
    }
  }

  const orderId = `KF-ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const newOrder: SubscriptionOrder = {
    id: orderId,
    method: data.method,
    senderPhone: data.senderPhone,
    trxId: cleanTrx,
    amount: data.amount || 99,
    status: 'pending',
    userId: data.userId,
    userEmail: data.userEmail,
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  saveAllSubscriptions(orders);

  return { success: true, order: newOrder };
}

export function verifyAdminSecret(secret: string): boolean {
  const configured = process.env.ADMIN_SECRET || 'kaizenadmin2026';
  return secret === configured;
}

export function approveSubscriptionOrder(orderId: string): { success: boolean; order?: SubscriptionOrder; error?: string } {
  const orders = getAllSubscriptions();
  const order = orders.find(o => o.id === orderId || o.trxId === orderId.toUpperCase());

  if (!order) {
    return { success: false, error: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' };
  }

  const now = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30); // 30 days access

  order.status = 'approved';
  order.approvedAt = now.toISOString();
  order.expiresAt = expiryDate.toISOString();

  saveAllSubscriptions(orders);
  return { success: true, order };
}

export function rejectSubscriptionOrder(orderId: string): { success: boolean; order?: SubscriptionOrder; error?: string } {
  const orders = getAllSubscriptions();
  const order = orders.find(o => o.id === orderId || o.trxId === orderId.toUpperCase());

  if (!order) {
    return { success: false, error: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' };
  }

  order.status = 'rejected';
  saveAllSubscriptions(orders);
  return { success: true, order };
}

export function getSubscriptionByTrxId(trxId: string): SubscriptionOrder | null {
  const cleanTrx = trxId.trim().toUpperCase();
  const orders = getAllSubscriptions();
  return orders.find(o => o.trxId === cleanTrx) || null;
}
