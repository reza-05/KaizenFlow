'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Crown, 
  X, 
  Check, 
  Copy, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Clock, 
  RefreshCw,
  KeyRound
} from 'lucide-react';
import { activateProSubscription } from '@/lib/storage';
import { AdminSubscriptionModal } from './AdminSubscriptionModal';

interface BkashNagadCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BkashNagadCheckoutModal: React.FC<BkashNagadCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [senderPhone, setSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Pending submission state
  const [submittedOrder, setSubmittedOrder] = useState<{
    id: string;
    trxId: string;
    method: 'bkash' | 'nagad';
    senderPhone: string;
    amount: number;
    createdAt: string;
  } | null>(null);

  // Success approved state
  const [approvedReceipt, setApprovedReceipt] = useState<{
    orderId: string;
    trxId: string;
    method: 'bkash' | 'nagad';
    amount: number;
    expiresAt: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Real official user bKash number
  const receptionNumber = '01832-622658';
  const cleanReceptionNumber = receptionNumber.replace(/[-]/g, '');

  const handleCopyNumber = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(cleanReceptionNumber);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusNotice(null);

    // Validate Bangladesh mobile format
    const cleanPhone = senderPhone.replace(/\s+/g, '').replace(/[-+]/g, '');
    if (!/^(?:88)?01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMessage('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX বা 019XXXXXXXX)');
      return;
    }

    // Validate TrxID (7-14 alphanumeric)
    const cleanTrx = trxId.trim().toUpperCase();
    if (!/^[A-Z0-9]{7,14}$/.test(cleanTrx)) {
      setErrorMessage('সঠিক Transaction ID (TrxID) দিন (কমপক্ষে ৭-১৪ অক্ষরের কোড, যেমন: BL19X8A22)');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/subscription/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          senderPhone: cleanPhone,
          trxId: cleanTrx,
          amount: 99,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'পেমেন্ট সাবমিশনে সমস্যা হয়েছে।');
      }

      setSubmittedOrder({
        id: data.order.id,
        trxId: cleanTrx,
        method,
        senderPhone: cleanPhone.slice(-11),
        amount: 99,
        createdAt: data.order.createdAt,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'নেটওয়ার্ক বা পেমেন্ট সাবমিশন ব্যর্থ হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if admin has approved this pending TrxID
  const handleCheckStatus = async () => {
    if (!submittedOrder) return;
    setIsCheckingStatus(true);
    setStatusNotice(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/subscription/verify?trxId=${submittedOrder.trxId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'স্ট্যাটাস চেক করা যায়নি।');
      }

      if (data.isApproved && data.order?.expiresAt) {
        // Officially approved by admin! Activate in storage!
        activateProSubscription({
          method: submittedOrder.method,
          senderPhone: submittedOrder.senderPhone,
          trxId: submittedOrder.trxId,
          amount: 99,
        });

        setApprovedReceipt({
          orderId: data.order.id,
          trxId: submittedOrder.trxId,
          method: submittedOrder.method,
          amount: 99,
          expiresAt: data.order.expiresAt,
        });
        setSubmittedOrder(null);
        onSuccess();
      } else if (data.isRejected) {
        setErrorMessage('দুঃখিত, এই TrxID টি অ্যাডমিন কর্তৃক প্রত্যাখ্যাত হয়েছে। সঠিক বিকাশ নম্বরে টাকা পাঠিয়ে সঠিক TrxID দিন।');
      } else {
        setStatusNotice('আপনার পেমেন্টটি এখনো পর্যালোচনায় রয়েছে। অ্যাডমিন ভেরিফাই করা মাত্রই Pro চালু হয়ে যাবে।');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'স্ট্যাটাস চেক করার সময় সমস্যা হয়েছে।');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return createPortal(
    <div 
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-[var(--bg-surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto my-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {approvedReceipt ? (
          /* State 1: Officially Approved & Active */
          <div className="text-center space-y-4 py-2 animate-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
                Payment Verified & Approved
              </span>
              <h3 className="text-lg font-black text-[var(--text-primary)]">
                স্বাগতম KaizenFlow Pro-তে! 🎉
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto mt-1">
                আপনার ৳৯৯ পেমেন্ট অনুমোদিত হয়েছে। আপনার অ্যাকাউন্ট এখন ৩০ দিনের জন্য KaizenFlow Pro-তে আপগ্রেড করা হয়েছে।
              </p>
            </div>

            {/* Digital Invoice Card */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">Order ID:</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">{approvedReceipt.orderId}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">Payment Method:</span>
                <span className="font-bold uppercase text-[var(--text-primary)]">
                  {approvedReceipt.method === 'bkash' ? 'bKash (বিকাশ)' : 'Nagad (নগদ)'}
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">Transaction ID:</span>
                <span className="font-mono font-bold text-amber-500">{approvedReceipt.trxId}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">Amount Paid:</span>
                <span className="font-extrabold text-emerald-500">৳৯৯ BDT</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-[var(--text-muted)]">Valid Until (৩০ দিন):</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {new Date(approvedReceipt.expiresAt).toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>আনলিমিটেড পড়া শুরু করুন (Continue to Notes)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : submittedOrder ? (
          /* State 2: Submitted / Pending Real Verification */
          <div className="space-y-4 text-center py-2 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 shadow-md">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
                Verification Pending (যাচাই চলছে)
              </span>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1 leading-relaxed">
                আপনার দেওয়া ট্রানজ্যাকশন আইডি যাচাই করা হচ্ছে। বিকাশ নম্বরে (<strong className="text-[var(--text-primary)]">{receptionNumber}</strong>) টাকা জমা নিশ্চিত হওয়া মাত্রই আপনার Pro অ্যাকাউন্ট সক্রিয় হয়ে যাবে।
              </p>
            </div>

            {/* Submitted Details Box */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Order ID:</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">{submittedOrder.id}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Transaction ID:</span>
                <span className="font-mono font-bold text-amber-500">{submittedOrder.trxId}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
                <span className="text-[var(--text-muted)]">Sender Number:</span>
                <span className="font-mono text-[var(--text-primary)]">{submittedOrder.senderPhone}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-[var(--text-muted)]">Amount:</span>
                <span className="font-extrabold text-emerald-500">৳৯৯ BDT</span>
              </div>
            </div>

            {/* Status Notice / Error */}
            {statusNotice && (
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs">
                {statusNotice}
              </div>
            )}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Check Status Button */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isCheckingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>ভেরিফিকেশন স্ট্যাটাস চেক করুন (Check Status)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSubmittedOrder(null)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                ভুল TrxID দিয়ে থাকলে পুনরায় ফর্ম খুলুন
              </button>
            </div>
          </div>
        ) : (
          /* State 3: Checkout Form */
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
                <Crown className="h-5 w-5 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>KaizenFlow Pro অ্যাক্টিভেশন</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500 text-black uppercase">
                    ৳৯৯ / ১ মাস
                  </span>
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  বিকাশ বা নগদ দিয়ে সহজে পেমেন্ট নিশ্চিত করুন
                </p>
              </div>
            </div>

            {/* Method Tabs (bKash vs Nagad) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* bKash */}
              <button
                type="button"
                onClick={() => { setMethod('bkash'); setErrorMessage(null); }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                  method === 'bkash'
                    ? 'border-[#E2136E] bg-[#E2136E]/10 text-[#E2136E] ring-1 ring-[#E2136E]/40 shadow-xs'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:border-[var(--text-primary)]/30'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#E2136E]" />
                <span>bKash (বিকাশ)</span>
              </button>

              {/* Nagad */}
              <button
                type="button"
                onClick={() => { setMethod('nagad'); setErrorMessage(null); }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                  method === 'nagad'
                    ? 'border-[#F7931E] bg-[#F7931E]/10 text-[#F7931E] ring-1 ring-[#F7931E]/40 shadow-xs'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:border-[var(--text-primary)]/30'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#F7931E]" />
                <span>Nagad (নগদ)</span>
              </button>
            </div>

            {/* Instruction Steps Box */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  {method === 'bkash' ? 'বিকাশ নম্বর:' : 'নগদ নম্বর:'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                    {receptionNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    {copiedNumber ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
                <p className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-500">১.</span>
                  <span>{method === 'bkash' ? 'বিকাশ' : 'নগদ'} অ্যাপে গিয়ে <strong className="text-[var(--text-primary)]">Send Money</strong> করে <strong className="text-amber-500 font-mono">{receptionNumber}</strong> নম্বরে ঠিক <strong className="text-amber-500">৳৯৯</strong> পাঠান।</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-500">২.</span>
                  <span>রেফারেন্স বক্সে লিখুন: <strong className="text-[var(--text-primary)]">KF-PRO</strong></span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-500">৩.</span>
                  <span>সফল ট্রানজ্যাকশনের পর মেসেজ থেকে পাওয়া <strong className="text-[var(--text-primary)]">TrxID</strong> এবং আপনার মোবাইল নম্বর নিচের ফর্মে দিয়ে সাবমিট করুন।</span>
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                  যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Phone):
                </label>
                <input
                  type="text"
                  required
                  placeholder="01XXXXXXXXX"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                  ট্রানজ্যাকশন আইডি (Transaction ID / TrxID):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BL19X8A22"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-mono text-xs uppercase text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-0.5">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>রিয়েল ভেরিফিকেশন ও ৩০ দিনের মেয়াদের প্রো এক্সেস</span>
                </span>

                {/* Admin Access Button */}
                <button
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="flex items-center gap-1 text-[10.5px] text-[var(--text-muted)] hover:text-amber-500 transition-colors cursor-pointer"
                  title="এডমিন প্যানেলে ঢুকে TrxID অনুমোদন করুন"
                >
                  <KeyRound className="h-3 w-3" />
                  <span>Admin Panel</span>
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>জমা দেওয়া হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 fill-current" />
                    <span>পেমেন্ট রিকোয়েস্ট সাবমিট করুন</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Admin Verification Modal */}
        <AdminSubscriptionModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onOrderApproved={() => {
            if (submittedOrder) {
              handleCheckStatus();
            }
          }}
        />
      </div>
    </div>,
    document.body
  );
};
