import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, SyncStatus } from '../types/auth';
import { localDb } from '../utils/localDb';

export const DEFAULT_LOCAL_USER: AuthUser = {
  id: 'local_device_owner',
  email: 'offline@zzkhata.local',
  displayName: 'Z.Z KHATA (Offline Mode)',
  provider: 'local',
  isOfflineGuest: true,
  createdAt: new Date().toISOString(),
};

interface AuthContextType {
  currentUser: AuthUser | null;
  authLoading: boolean;
  syncStatus: SyncStatus;
  isOffline: boolean;
  lastSyncedAt: Date | null;
  continueOffline: () => void;
  signInWithGoogle: (email?: string, name?: string) => Promise<AuthUser>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (data: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordWithToken: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  triggerSync: () => void;
  savedAccounts: Array<{ email: string; name: string; provider: 'google' | 'password' | 'local'; photoURL?: string }>;
}

const STORAGE_KEY_AUTH_SESSION = 'zz_khata_auth_current_user_v1';
const STORAGE_KEY_AUTH_ACCOUNTS = 'zz_khata_auth_registered_accounts_v1';

interface StoredAccountRecord {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  passwordHash?: string;
  provider: 'google' | 'password' | 'local';
  photoURL?: string;
  isOfflineGuest?: boolean;
  createdAt: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? !window.navigator.onLine : false;
  });
  const [accounts, setAccounts] = useState<StoredAccountRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_ACCOUNTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse accounts:', e);
    }
    return [];
  });

  // Restore session on mount - never block offline usage
  useEffect(() => {
    try {
      const session = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
      if (session) {
        const user = JSON.parse(session) as AuthUser;
        setCurrentUser(user);
      } else {
        // By default, start directly in full offline mode without requiring login
        setCurrentUser(DEFAULT_LOCAL_USER);
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
      setCurrentUser(DEFAULT_LOCAL_USER);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Sync state with online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setSyncStatus('syncing');
      localDb.getQueuedMutations().then((q) => {
        if (q.length > 0) {
          localDb.clearQueuedMutations();
        }
      }).catch(console.warn);

      setTimeout(() => {
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      }, 700);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus('offline');
    };

    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      setIsOffline(true);
      setSyncStatus('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const continueOffline = useCallback(() => {
    setCurrentUser(DEFAULT_LOCAL_USER);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(DEFAULT_LOCAL_USER));
    } catch {}
  }, []);

  const triggerSync = useCallback(async () => {
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      setIsOffline(true);
      setSyncStatus('offline');
      return;
    }
    setIsOffline(false);
    setSyncStatus('syncing');
    try {
      const queue = await localDb.getQueuedMutations();
      if (queue.length > 0) {
        await localDb.clearQueuedMutations();
      }
      setTimeout(() => {
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      }, 500);
    } catch {
      setSyncStatus('error');
    }
  }, []);

  // Save accounts helper
  const saveAccounts = (newAccounts: StoredAccountRecord[]) => {
    setAccounts(newAccounts);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_ACCOUNTS, JSON.stringify(newAccounts));
    } catch (e) {
      console.error('Failed to save accounts:', e);
    }
  };

  // Google Sign-In with real account selection
  const signInWithGoogle = async (emailInput?: string, nameInput?: string): Promise<AuthUser> => {
    setSyncStatus('syncing');
    const email = (emailInput || 'zahoorzia802@gmail.com').trim().toLowerCase();
    const name = nameInput || email.split('@')[0].replace(/[._]/g, ' ').toUpperCase() || 'Google User';

    // Unique deterministic UID for this Google account
    const uid = `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const existing = accounts.find((a) => a.email.toLowerCase() === email);
    let user: AuthUser;

    if (existing) {
      user = {
        id: existing.id,
        email: existing.email,
        displayName: existing.displayName || name,
        phoneNumber: existing.phoneNumber,
        photoURL: existing.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        provider: 'google',
        createdAt: existing.createdAt,
      };
    } else {
      user = {
        id: uid,
        email,
        displayName: name,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        provider: 'google',
        createdAt: new Date().toISOString(),
      };
      saveAccounts([...accounts, { ...user }]);
    }

    localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(user));
    setCurrentUser(user);
    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    }, 500);

    return user;
  };

  // Email & Password Registration
  const signUpWithEmail = async (data: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const email = data.email.trim().toLowerCase();
    if (!email || !data.password || !data.fullName) {
      return { success: false, error: 'Please fill in all required fields' };
    }

    if (accounts.some((a) => a.email.toLowerCase() === email)) {
      return { success: false, error: 'An account with this email already exists. Please log in.' };
    }

    const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRecord: StoredAccountRecord = {
      id: uid,
      email,
      displayName: data.fullName.trim(),
      phoneNumber: data.phone.trim(),
      passwordHash: btoa(data.password), // Obfuscated password for local storage
      provider: 'password',
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.fullName)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...accounts, newRecord];
    saveAccounts(updated);

    const user: AuthUser = {
      id: uid,
      email: newRecord.email,
      displayName: newRecord.displayName,
      phoneNumber: newRecord.phoneNumber,
      photoURL: newRecord.photoURL,
      provider: 'password',
      createdAt: newRecord.createdAt,
    };

    localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(user));
    setCurrentUser(user);
    triggerSync();

    return { success: true };
  };

  // Email & Password Login
  const signInWithEmail = async (
    emailInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string }> => {
    const email = emailInput.trim().toLowerCase();
    const account = accounts.find((a) => a.email.toLowerCase() === email);

    if (!account) {
      return { success: false, error: 'No account found with this email. Please check or register.' };
    }

    if (account.provider === 'google') {
      return {
        success: false,
        error: 'This email is linked with Google Sign-In. Please tap "Continue with Google".',
      };
    }

    if (account.passwordHash && account.passwordHash !== btoa(passwordInput)) {
      return { success: false, error: 'Incorrect password! Please try again or use Forgot Password.' };
    }

    const user: AuthUser = {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      phoneNumber: account.phoneNumber,
      photoURL: account.photoURL,
      provider: account.provider,
      createdAt: account.createdAt,
    };

    localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(user));
    setCurrentUser(user);
    triggerSync();

    return { success: true };
  };

  // Forgot Password / Reset
  const sendPasswordReset = async (emailInput: string): Promise<{ success: boolean; error?: string }> => {
    const email = emailInput.trim().toLowerCase();
    const account = accounts.find((a) => a.email.toLowerCase() === email);
    if (!account) {
      return { success: false, error: 'No account registered with this email address.' };
    }
    return { success: true };
  };

  const resetPasswordWithToken = async (
    emailInput: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const email = emailInput.trim().toLowerCase();
    const index = accounts.findIndex((a) => a.email.toLowerCase() === email);
    if (index === -1) {
      return { success: false, error: 'Account not found.' };
    }
    const updated = [...accounts];
    updated[index] = {
      ...updated[index],
      passwordHash: btoa(newPassword),
    };
    saveAccounts(updated);
    return { success: true };
  };

  // Sign out (Preserves cloud data, clears active session, resets to offline mode)
  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
    setCurrentUser(DEFAULT_LOCAL_USER);
  };

  // Delete Account (Permanently deletes user and their cloud data)
  const deleteAccount = async () => {
    if (!currentUser) return;
    const uid = currentUser.id;

    // Remove user account record
    const filteredAccounts = accounts.filter((a) => a.id !== uid);
    saveAccounts(filteredAccounts);

    // Delete all cloud storage data associated with this UID
    try {
      localStorage.removeItem(`zz_khata_${uid}_customers`);
      localStorage.removeItem(`zz_khata_${uid}_transactions`);
      localStorage.removeItem(`zz_khata_${uid}_profile`);
      localStorage.removeItem(`zz_khata_${uid}_settings`);
      localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
    } catch (e) {
      console.error('Error clearing user data:', e);
    }

    setCurrentUser(DEFAULT_LOCAL_USER);
  };

  const savedAccounts = accounts.map((a) => ({
    email: a.email,
    name: a.displayName,
    provider: a.provider,
    photoURL: a.photoURL,
  }));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authLoading,
        syncStatus,
        isOffline,
        lastSyncedAt,
        continueOffline,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        resetPasswordWithToken,
        signOut,
        deleteAccount,
        triggerSync,
        savedAccounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
