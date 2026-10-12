'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, X, Check, CheckCircle2, XCircle, Clock, Loader2, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { SubscriptionOrder } from '@/lib/subscriptionsServer';

interface AdminSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderApproved?: () => void;
}

export const AdminSubscriptionModal: React.FC<AdminSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onOrderApproved,
}) => {
  const [mounted, setMounted] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrders = async (key: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/subscription/admin?adminSecret=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ভুল অ্যাডমিন পাসকোড।');
      }
      setOrders(data.orders || []);
      setIsAuthenticated(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'অর্ডার ফেচ করতে সমস্যা হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) return;
    fetchOrders(adminKey.trim());
  };

  const handleAction = async (orderId: string, action: 'approve' | 'reject') => {
    setProcessingId(orderId);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/subscription/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminSecret: adminKey.trim(),
          action,
          orderId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'অ্যাকশন সম্পন্ন করতে সমস্যা হয়েছে।');
      }
      // Refresh list
      await fetchOrders(adminKey.trim());
      if (action === 'approve' && onOrderApproved) {
        onOrderApproved();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'অ্যাকশন ফেইল করেছে।');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[var(--bg-surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto my-auto space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                KaizenFlow Subscription Admin Panel
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                বিকাশ (01832-622658) পেমেন্ট ও TrxID অনুমোদন প্যানেল
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!isAuthenticated ? (
          /* Login View */
          <form onSubmit={handleLogin} className="space-y-3 py-4 max-w-sm mx-auto text-center">
            <div className="flex justify-center mb-2">
              <Key className="h-8 w-8 text-amber-500" />
            </div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">
              অ্যাডমিন পাসকোড দিন (Admin Key Required)
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              ডিফল্ট অ্যাডমিন পাসকোড: <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-500">kaizenadmin2026</code>
            </p>
            <input
              type="password"
              placeholder="Enter Admin Secret..."
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500 text-center font-mono"
            />
            <button
              type="submit"
              disabled={isLoading || !adminKey.trim()}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>লগইন করুন</span>}
            </button>
          </form>
        ) : (
          /* Orders Table View */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30">
                  পেন্ডিং: {orders.filter(o => o.status === 'pending').length}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 font-bold border border-emerald-500/30">
                  অনুমোদিত: {orders.filter(o => o.status === 'approved').length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => fetchOrders(adminKey)}
                disabled={isLoading}
                className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>রিফ্রেশ</span>
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
                কোনো সাবস্ক্রিপশন রিকোয়েস্ট পাওয়া যায়নি।
              </div>
            ) : (
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-500 text-sm">
                          {order.trxId}
                        </span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : order.status === 'rejected'
                              ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                              : 'bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse'
                        }`}>
                          {order.status}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                          {order.method} • ৳{order.amount}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] font-mono">
                        <span>Sender: {order.senderPhone}</span>
                        <span>Time: {new Date(order.createdAt).toLocaleTimeString('bn-BD')}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {order.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            disabled={processingId === order.id}
                            onClick={() => handleAction(order.id, 'approve')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {processingId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            disabled={processingId === order.id}
                            onClick={() => handleAction(order.id, 'reject')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <X className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : order.status === 'approved' ? (
                        <span className="flex items-center gap-1 text-emerald-500 font-bold text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approved</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 font-bold text-[11px]">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
