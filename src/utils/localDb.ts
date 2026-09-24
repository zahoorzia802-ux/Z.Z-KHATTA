/**
 * Z.Z KHATA - Robust Offline-First IndexedDB Local Database
 * Ensures all Customers, Transactions (Mila/Diya), Photos, Settings, and Notes
 * are persisted locally on the device even when offline, phone restarted, or app closed.
 */

import { Customer, Transaction, UserProfile, AppSettings } from '../types/khata';

const DB_NAME = 'ZZ_KHATA_LOCAL_DB_V1';
const DB_VERSION = 1;

export interface OfflineMutation {
  id?: number;
  entity: 'customer' | 'transaction' | 'profile' | 'settings';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: string;
}

class LocalDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return reject(new Error('IndexedDB not supported in this environment'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store: customers
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('name', 'name', { unique: false });
          customerStore.createIndex('phone', 'phone', { unique: false });
        }

        // Store: transactions (Mila / Diya)
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('customerId', 'customerId', { unique: false });
          txStore.createIndex('date', 'date', { unique: false });
          txStore.createIndex('type', 'type', { unique: false });
        }

        // Store: offline sync queue
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }

        // Store: meta (profile, settings, backup)
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        console.warn('IndexedDB open error, falling back to localStorage:', request.error);
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  // -------------------------------------------------------------
  // CUSTOMERS
  // -------------------------------------------------------------
  async getAllCustomers(): Promise<Customer[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('customers', 'readonly');
        const store = tx.objectStore('customers');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(this.getFallbackCustomers());
      });
    } catch {
      return this.getFallbackCustomers();
    }
  }

  async saveCustomers(customers: Customer[]): Promise<void> {
    // 1. Dual-write to localStorage for instant synchronous fallback
    try {
      localStorage.setItem('zz_khata_offline_customers_v1', JSON.stringify(customers));
    } catch (e) {
      console.warn('localStorage save warning:', e);
    }

    // 2. Write to IndexedDB
    try {
      const db = await this.getDB();
      const tx = db.transaction('customers', 'readwrite');
      const store = tx.objectStore('customers');
      store.clear();
      for (const c of customers) {
        store.put(c);
      }
    } catch (e) {
      console.warn('IndexedDB saveCustomers error:', e);
    }
  }

  private getFallbackCustomers(): Customer[] {
    try {
      const raw = localStorage.getItem('zz_khata_offline_customers_v1');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  }

  // -------------------------------------------------------------
  // TRANSACTIONS (Mila / Diya)
  // -------------------------------------------------------------
  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(this.getFallbackTransactions());
      });
    } catch {
      return this.getFallbackTransactions();
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    // 1. Dual-write to localStorage for instant fallback
    try {
      localStorage.setItem('zz_khata_offline_transactions_v1', JSON.stringify(transactions));
    } catch (e) {
      console.warn('localStorage save warning:', e);
    }

    // 2. Write to IndexedDB
    try {
      const db = await this.getDB();
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      store.clear();
      for (const t of transactions) {
        store.put(t);
      }
    } catch (e) {
      console.warn('IndexedDB saveTransactions error:', e);
    }
  }

  private getFallbackTransactions(): Transaction[] {
    try {
      const raw = localStorage.getItem('zz_khata_offline_transactions_v1');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  }

  // -------------------------------------------------------------
  // META (Profile & Settings)
  // -------------------------------------------------------------
  async getMeta<T>(key: string, fallback: T): Promise<T> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('meta', 'readonly');
        const store = tx.objectStore('meta');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.value : fallback);
        req.onerror = () => resolve(fallback);
      });
    } catch {
      try {
        const local = localStorage.getItem(`zz_khata_meta_${key}`);
        if (local) return JSON.parse(local);
      } catch {}
      return fallback;
    }
  }

  async setMeta<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(`zz_khata_meta_${key}`, JSON.stringify(value));
    } catch {}

    try {
      const db = await this.getDB();
      const tx = db.transaction('meta', 'readwrite');
      tx.objectStore('meta').put({ key, value });
    } catch {}
  }

  // -------------------------------------------------------------
  // OFFLINE MUTATION QUEUE (For background sync when back online)
  // -------------------------------------------------------------
  async queueMutation(mutation: Omit<OfflineMutation, 'id'>): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('syncQueue', 'readwrite');
      tx.objectStore('syncQueue').add(mutation);
    } catch {
      // Fallback queue in localStorage
      try {
        const q = JSON.parse(localStorage.getItem('zz_khata_sync_queue') || '[]');
        q.push(mutation);
        localStorage.setItem('zz_khata_sync_queue', JSON.stringify(q));
      } catch {}
    }
  }

  async getQueuedMutations(): Promise<OfflineMutation[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('syncQueue', 'readonly');
        const req = tx.objectStore('syncQueue').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      try {
        return JSON.parse(localStorage.getItem('zz_khata_sync_queue') || '[]');
      } catch {
        return [];
      }
    }
  }

  async clearQueuedMutations(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('syncQueue', 'readwrite');
      tx.objectStore('syncQueue').clear();
    } catch {}
    localStorage.removeItem('zz_khata_sync_queue');
  }

  // -------------------------------------------------------------
  // BACKUP & RESTORE
  // -------------------------------------------------------------
  async exportFullBackup(): Promise<string> {
    const customers = await this.getAllCustomers();
    const transactions = await this.getAllTransactions();
    const profile = await this.getMeta<UserProfile | null>('profile', null);
    const settings = await this.getMeta<AppSettings | null>('settings', null);

    const payload = {
      app: 'Z.Z KHATA',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        customers,
        transactions,
        profile,
        settings,
      },
    };

    return JSON.stringify(payload, null, 2);
  }

  async importFullBackup(jsonString: string): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data || !Array.isArray(parsed.data.customers)) {
        return { success: false, message: 'Invalid Z.Z KHATA backup file format.' };
      }

      const importedCustomers = parsed.data.customers as Customer[];
      const importedTransactions = (parsed.data.transactions || []) as Transaction[];

      await this.saveCustomers(importedCustomers);
      await this.saveTransactions(importedTransactions);

      if (parsed.data.profile) {
        await this.setMeta('profile', parsed.data.profile);
      }
      if (parsed.data.settings) {
        await this.setMeta('settings', parsed.data.settings);
      }

      return {
        success: true,
        message: `Restored ${importedCustomers.length} customers and ${importedTransactions.length} entries successfully.`,
        count: importedCustomers.length,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to parse backup file.',
      };
    }
  }
}

export const localDb = new LocalDatabase();
