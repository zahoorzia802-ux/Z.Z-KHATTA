export interface AuthUser {
  id: string; // Unique UID
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  provider: 'google' | 'password' | 'local';
  isOfflineGuest?: boolean;
  createdAt: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

