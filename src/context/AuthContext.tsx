'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { loadCloudDataToLocal, syncLocalDataToCloud, SyncStatus } from '@/lib/cloudSync';
import { getInitialUserProfile, saveUserProfile } from '@/lib/storage';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile;
  loading: boolean;
  syncStatus: SyncStatus;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  syncNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(getInitialUserProfile());
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  // Listen to Auth State
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Local Guest mode
      setUserProfile(getInitialUserProfile());
      setLoading(false);
      setSyncStatus('offline');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setSyncStatus('syncing');
        try {
          const { profile } = await loadCloudDataToLocal(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.displayName
          );
          setUserProfile(profile);
          setSyncStatus('synced');
        } catch (err) {
          console.error('Failed to sync on auth state change:', err);
          setSyncStatus('error');
        }
      } else {
        setUserProfile(getInitialUserProfile());
        setSyncStatus('idle');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not yet configured. Please set your credentials in .env.local.');
    }
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        setSyncStatus('syncing');
        const { profile } = await loadCloudDataToLocal(res.user.uid, res.user.email, res.user.displayName);
        setUserProfile(profile);
        setSyncStatus('synced');
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not yet configured. Please set your credentials in .env.local.');
    }
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        setSyncStatus('syncing');
        const { profile } = await loadCloudDataToLocal(res.user.uid, res.user.email, res.user.displayName);
        setUserProfile(profile);
        setSyncStatus('synced');
      }
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not yet configured. Please set your credentials in .env.local.');
    }
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && res.user) {
        await updateProfile(res.user, { displayName: name });
      }
      if (res.user) {
        setSyncStatus('syncing');
        const { profile } = await loadCloudDataToLocal(res.user.uid, res.user.email, name || res.user.displayName);
        setUserProfile(profile);
        setSyncStatus('synced');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    const guest = getInitialUserProfile();
    setUserProfile(guest);
    saveUserProfile(guest);
    setSyncStatus('idle');
  };

  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not yet configured. Please set your credentials in .env.local.');
    }
    await sendPasswordResetEmail(auth, email);
  };

  const syncNow = async () => {
    if (!user) return;
    setSyncStatus('syncing');
    const ok = await syncLocalDataToCloud(user.uid);
    setSyncStatus(ok ? 'synced' : 'error');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        syncStatus,
        isConfigured: isFirebaseConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPassword,
        syncNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
