'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Sun, Moon, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, isConfigured, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);

  const [isDark, setIsDark] = useState(false);

  // Theme Sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleTheme = () => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsDark(false);
      localStorage.setItem('kizen_theme', 'light');
    } else {
      root.classList.add('dark');
      setIsDark(true);
      localStorage.setItem('kizen_theme', 'dark');
    }
  };

  // If already logged in, redirect to library
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Real-time password validation criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain not authorized in Firebase Console. Add localhost to Authorized Domains.');
      } else {
        setErrorMsg(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isResetMode) {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      setIsSubmitting(true);
      try {
        await resetPassword(email.trim());
        setSuccessMsg('Password reset link sent! Please check your email inbox.');
        setIsResetMode(false);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to send password reset email.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (activeTab === 'signup') {
      if (!isPasswordValid) {
        setErrorMsg('Please satisfy all password security requirements.');
        return;
      }
      if (!passwordsMatch) {
        setErrorMsg('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      try {
        await signUpWithEmail(email.trim(), password, displayName.trim() || undefined);
        router.push('/');
      } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/email-already-in-use') {
          setErrorMsg('An account with this email already exists. Please log in.');
        } else if (err.code === 'auth/invalid-email') {
          setErrorMsg('Please enter a valid email address.');
        } else if (err.code === 'auth/weak-password') {
          setErrorMsg('Password is too weak.');
        } else {
          setErrorMsg(err.message || 'Failed to create account.');
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Log In
      setIsSubmitting(true);
      try {
        await signInWithEmail(email.trim(), password);
        router.push('/');
      } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setErrorMsg('Incorrect email or password. Please try again.');
        } else if (err.code === 'auth/too-many-requests') {
          setErrorMsg('Too many failed attempts. Please try again later or reset password.');
        } else {
          setErrorMsg(err.message || 'Failed to log in.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              KaizenFlow
            </span>
            <span className="hidden sm:inline-block text-xs font-medium text-[var(--text-secondary)] border-l border-[var(--border-subtle)] pl-2.5">
              Lock In & Learn
            </span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Library</span>
            </Link>

            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-[440px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-xs transition-colors">
          {/* Card Header */}
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[var(--text-primary)]">
              {isResetMode
                ? 'Reset your password'
                : activeTab === 'signup'
                ? 'Create your KaizenFlow account'
                : 'Log in to KaizenFlow'}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {isResetMode
                ? 'Enter your email to receive a password reset link.'
                : activeTab === 'signup'
                ? 'Create your account with email and password or Google.'
                : 'Continue with Google or use your email and password.'}
            </p>
          </div>

          {!isResetMode && (
            <>
              {/* Segmented Tab Selector (Sign Up | Log In) */}
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-[var(--bg-surface-subtle)] p-1 border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'signup'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Log In
                </button>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)] shadow-2xs transition-all cursor-pointer disabled:opacity-60"
              >
                {/* Official Crisp Google 'G' SVG */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="w-full border-t border-[var(--border-subtle)]" />
                <span className="absolute bg-[var(--bg-surface)] px-3 text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  or with email
                </span>
              </div>
            </>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name (Only in Sign Up) */}
            {activeTab === 'signup' && !isResetMode && (
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Rahman"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Password Field */}
            {!isResetMode && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Password
                  </label>
                  {activeTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-medium text-[var(--text-secondary)] hover:text-emerald-500 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8+ chars with A-z, 0-9, symbol"
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Criteria Checklist (on Sign Up) */}
                {activeTab === 'signup' && password.length > 0 && (
                  <div className="mt-2.5 p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/50 space-y-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                      <span>{hasMinLength ? '✓' : '○'}</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase && hasLowercase ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                      <span>{hasUppercase && hasLowercase ? '✓' : '○'}</span>
                      <span>Uppercase & lowercase letters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                      <span>{hasNumber ? '✓' : '○'}</span>
                      <span>At least one number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                      <span>{hasSpecial ? '✓' : '○'}</span>
                      <span>At least one special character (!@#$)</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password (Only in Sign Up) */}
            {activeTab === 'signup' && !isResetMode && (
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Confirm Password
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retype the same password"
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-1 text-[11px] text-rose-500">Passwords do not match.</p>
                )}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] px-4 py-3 text-xs sm:text-sm font-semibold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isResetMode ? (
                <>
                  <span>Send Reset Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : activeTab === 'signup' ? (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {isResetMode && (
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setErrorMsg(null);
                }}
                className="w-full py-1 text-xs text-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                ← Back to Log In
              </button>
            )}
          </form>

          {/* Guest / Offline Mode Note */}
          <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-emerald-500 font-medium transition-colors cursor-pointer"
            >
              <span>Continue as Guest (Local Offline Mode)</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
