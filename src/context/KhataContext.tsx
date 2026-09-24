import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  Customer,
  Transaction,
  CustomerBalanceSummary,
  UserProfile,
  AppSettings,
  AppThemeMode,
  AppLanguage,
  TransactionType,
} from '../types/khata';
import { getTodayDateString } from '../utils/formatters';
import { hashPin, verifyPin } from '../utils/security';
import { useAuth } from './AuthContext';
import { localDb } from '../utils/localDb';

interface KhataContextType {
  customers: Customer[];
  transactions: Transaction[];
  profile: UserProfile;
  settings: AppSettings;
  isLocked: boolean;
  isOffline: boolean;
  unlockApp: (enteredPin: string) => boolean;
  setPinLock: (newPin: string) => void;
  disablePinLock: (currentPin: string) => boolean;
  lockApp: () => void;
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;
  getCustomerTransactions: (customerId: string) => Transaction[];
  getCustomerBalance: (customerId: string) => CustomerBalanceSummary;
  // Dashboard Totals
  totalCustomers: number;
  totalApNeDiye: number; // AP NE DIYE — ALL TOTAL
  totalApKoMile: number; // AP KO MILE — ALL TOTAL
  totalBalance: number; // TOTAL BALANCE (Net ledger balance across all customers)
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setThemeMode: (mode: AppThemeMode) => void;
  setLanguage: (lang: AppLanguage) => void;
  exportBackup: () => void;
  importBackup: (file: File) => Promise<{ success: boolean; message: string }>;
  clearAllData: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  shopName: 'Z.Z KHATA',
  ownerName: '',
  phone: '',
  address: '',
};

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'dark',
  language: 'english',
  pinLockEnabled: false,
  pinHash: '',
};

const KhataContext = createContext<KhataContextType | null>(null);

export function KhataProvider({ children }: { children: ReactNode }) {
  const { currentUser, triggerSync } = useAuth();

  // Storage key generator based on current user UID
  const getKeys = (userId?: string) => {
    const id = userId || currentUser?.id || 'guest';
    return {
      customers: `zz_khata_user_${id}_customers_v4`,
      transactions: `zz_khata_user_${id}_transactions_v4`,
      profile: `zz_khata_user_${id}_profile_v4`,
      settings: `zz_khata_user_${id}_settings_v4`,
    };
  };

  const [activeUserId, setActiveUserId] = useState<string | null>(currentUser?.id || null);

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const keys = getKeys(currentUser?.id);
    try {
      const saved = localStorage.getItem(keys.customers);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      // Check legacy migration if available for first user
      const legacy = localStorage.getItem('zz_khata_customers_v3');
      if (legacy && currentUser) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(keys.customers, legacy);
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading customers:', e);
    }
    return [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const keys = getKeys(currentUser?.id);
    try {
      const saved = localStorage.getItem(keys.transactions);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      const legacy = localStorage.getItem('zz_khata_transactions_v3');
      if (legacy && currentUser) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(keys.transactions, legacy);
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading transactions:', e);
    }
    return [];
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const keys = getKeys(currentUser?.id);
    try {
      const saved = localStorage.getItem(keys.profile);
      if (saved) return JSON.parse(saved);
      const legacy = localStorage.getItem('zz_khata_profile_v3');
      if (legacy) return JSON.parse(legacy);
    } catch (e) {
      console.error('Error loading profile:', e);
    }
    return {
      ...DEFAULT_PROFILE,
      ownerName: currentUser?.displayName || '',
      phone: currentUser?.phoneNumber || '',
    };
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const keys = getKeys(currentUser?.id);
    try {
      const saved = localStorage.getItem(keys.settings);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          themeMode: parsed.themeMode || 'dark',
          language: parsed.language === 'urdu' ? 'urdu' : 'english',
          pinLockEnabled: !!parsed.pinLockEnabled,
          pinHash: parsed.pinHash || '',
        };
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isLocked, setIsLocked] = useState<boolean>(false);

  // When user switches / logs in or out, load their specific isolated data
  useEffect(() => {
    const currentId = currentUser?.id || null;
    if (currentId !== activeUserId) {
      setActiveUserId(currentId);
      const keys = getKeys(currentId || undefined);

      try {
        const savedCust = localStorage.getItem(keys.customers);
        setCustomers(savedCust ? JSON.parse(savedCust) : []);

        const savedTx = localStorage.getItem(keys.transactions);
        setTransactions(savedTx ? JSON.parse(savedTx) : []);

        const savedProf = localStorage.getItem(keys.profile);
        setProfile(
          savedProf
            ? JSON.parse(savedProf)
            : {
                ...DEFAULT_PROFILE,
                ownerName: currentUser?.displayName || '',
                phone: currentUser?.phoneNumber || '',
              }
        );

        const savedSet = localStorage.getItem(keys.settings);
        if (savedSet) {
          const parsed = JSON.parse(savedSet);
          setSettings({
            themeMode: parsed.themeMode || 'light',
            language: parsed.language === 'urdu' ? 'urdu' : 'english',
            pinLockEnabled: !!parsed.pinLockEnabled,
            pinHash: parsed.pinHash || '',
          });
          setIsLocked(!!parsed.pinLockEnabled && !!parsed.pinHash);
        } else {
          setSettings(DEFAULT_SETTINGS);
          setIsLocked(false);
        }
      } catch (e) {
        console.error('Error switching user data:', e);
      }
    }
  }, [currentUser, activeUserId]);

  // Sync to local storage for current user
  useEffect(() => {
    if (!currentUser) return;
    const keys = getKeys(currentUser.id);
    try {
      localStorage.setItem(keys.customers, JSON.stringify(customers));
    } catch (e) {
      console.error('Error saving customers:', e);
    }
    localDb.saveCustomers(customers).catch(console.warn);
  }, [customers, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const keys = getKeys(currentUser.id);
    try {
      localStorage.setItem(keys.transactions, JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions:', e);
    }
    localDb.saveTransactions(transactions).catch(console.warn);
  }, [transactions, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const keys = getKeys(currentUser.id);
    try {
      localStorage.setItem(keys.profile, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving profile:', e);
    }
    localDb.setMeta('profile', profile).catch(console.warn);
  }, [profile, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const keys = getKeys(currentUser.id);
    try {
      localStorage.setItem(keys.settings, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
    localDb.setMeta('settings', settings).catch(console.warn);
  }, [settings, currentUser]);

  // Initial load from IndexedDB to ensure robust offline persistence across restarts
  useEffect(() => {
    localDb.getAllCustomers().then((stored) => {
      if (stored && stored.length > 0) {
        setCustomers((prev) => {
          if (prev.length === 0) return stored;
          const map = new Map(prev.map((c) => [c.id, c]));
          for (const s of stored) {
            if (!map.has(s.id)) map.set(s.id, s);
          }
          return Array.from(map.values());
        });
      }
    }).catch(console.warn);

    localDb.getAllTransactions().then((stored) => {
      if (stored && stored.length > 0) {
        setTransactions((prev) => {
          if (prev.length === 0) return stored;
          const map = new Map(prev.map((t) => [t.id, t]));
          for (const s of stored) {
            if (!map.has(s.id)) map.set(s.id, s);
          }
          return Array.from(map.values());
        });
      }
    }).catch(console.warn);
  }, []);

  // Manage Dark Mode & Language Direction
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      if (settings.themeMode === 'dark') {
        root.classList.add('dark');
      } else if (settings.themeMode === 'light') {
        root.classList.remove('dark');
      } else {
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    let mediaQuery: MediaQueryList | null = null;
    const handleSystemChange = () => {
      if (settings.themeMode === 'system') applyTheme();
    };

    if (window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleSystemChange);
    }

    if (settings.language === 'urdu') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ur';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }

    return () => {
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      }
    };
  }, [settings]);

  // App Lock Pin Handlers
  const unlockApp = (enteredPin: string): boolean => {
    if (!settings.pinLockEnabled || !settings.pinHash) {
      setIsLocked(false);
      return true;
    }
    const valid = verifyPin(enteredPin, settings.pinHash);
    if (valid) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const setPinLock = (newPin: string) => {
    const hash = hashPin(newPin);
    setSettings((prev) => ({
      ...prev,
      pinLockEnabled: true,
      pinHash: hash,
    }));
    setIsLocked(false);
    triggerSync();
  };

  const disablePinLock = (currentPin: string): boolean => {
    if (!settings.pinHash || verifyPin(currentPin, settings.pinHash)) {
      setSettings((prev) => ({
        ...prev,
        pinLockEnabled: false,
        pinHash: '',
      }));
      setIsLocked(false);
      triggerSync();
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (settings.pinLockEnabled) {
      setIsLocked(true);
    }
  };

  // Customers Management (100% real CRUD, instant sync, synchronous local writes)
  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCustomers((prev) => {
      const updated = [newCustomer, ...prev];
      if (currentUser) {
        try {
          localStorage.setItem(getKeys(currentUser.id).customers, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    triggerSync();
    return newCustomer;
  };

  const updateCustomer = (id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setCustomers((prev) => {
      const updated = prev.map((c) =>
        c.id === id
          ? {
              ...c,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : c
      );
      if (currentUser) {
        try {
          localStorage.setItem(getKeys(currentUser.id).customers, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    triggerSync();
  };

  // Permanently delete customer and all associated transactions with immediate persistence
  const deleteCustomer = (id: string) => {
    setCustomers((prev) => {
      const updatedCust = prev.filter((c) => c.id !== id);
      if (currentUser) {
        try {
          localStorage.setItem(getKeys(currentUser.id).customers, JSON.stringify(updatedCust));
        } catch (e) {
          console.error(e);
        }
      }
      return updatedCust;
    });

    setTransactions((prev) => {
      const updatedTx = prev.filter((t) => t.customerId !== id);
      if (currentUser) {
        try {
          localStorage.setItem(getKeys(currentUser.id).transactions, JSON.stringify(updatedTx));
        } catch (e) {
          console.error(e);
        }
      }
      return updatedTx;
    });

    triggerSync();
  };

  const getCustomer = (id: string) => {
    return customers.find((c) => c.id === id);
  };

  // Transactions Management (100% real CRUD, instant sync, synchronous local writes)
  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => {
      const updatedTx = [newTx, ...prev];
      if (currentUser) {
        try {
          localStorage.setItem(getKeys(currentUser.id).transactions, JSON.stringify(updatedTx));
        } catch (e) {
          console.error(e);
        }
      }
      return updatedTx;
    });

    setCustomers((prev) =>
      prev.map((c) => (c.id === data.customerId ? { ...c, updatedAt: new Date().toISOString() } : c))
    );

    triggerSync();
    return newTx;
  };

  const updateTransaction = (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    setTransactions((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...data } : t));
      if (currentUser) {
        try {
          localStorage.setItem(getKeys(currentUser.id).transactions, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    triggerSync();
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      if (currentUser) {
        try {
          localStorage.setItem(getKeys(currentUser.id).transactions, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    triggerSync();
  };

  const getCustomerTransactions = (customerId: string): Transaction[] => {
    return transactions
      .filter((t) => t.customerId === customerId)
      .sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        if (a.time && b.time) {
          return b.time.localeCompare(a.time);
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  };

  const getCustomerBalance = (customerId: string): CustomerBalanceSummary => {
    const customer = customers.find((c) => c.id === customerId);
    const opening = customer?.openingBalance || 0;
    const custTransactions = transactions.filter((t) => t.customerId === customerId);

    let totalGiven = 0; // AP NE DIYE
    let totalReceived = 0; // AP KO MILE

    custTransactions.forEach((t) => {
      if (t.type === 'AP_NE_DIYE') {
        totalGiven += t.amount;
      } else if (t.type === 'AP_KO_MILE') {
        totalReceived += t.amount;
      }
    });

    const currentBalance = opening + totalGiven - totalReceived;

    return {
      currentBalance,
      totalGiven: (opening > 0 ? opening : 0) + totalGiven,
      totalReceived: (opening < 0 ? Math.abs(opening) : 0) + totalReceived,
      transactionCount: custTransactions.length,
    };
  };

  // Dynamic Dashboard Calculations - 100% computed from real user data
  const totalCustomers = customers.length;

  const totalApNeDiye = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'AP_NE_DIYE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalApKoMile = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'AP_KO_MILE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalBalance = useMemo(() => {
    return customers.reduce((acc, c) => {
      return acc + getCustomerBalance(c.id).currentBalance;
    }, 0);
  }, [customers, transactions]);

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...newProfile };
      if (currentUser) {
        try {
          localStorage.setItem(getKeys(currentUser.id).profile, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    triggerSync();
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (currentUser) {
        try {
          localStorage.setItem(getKeys(currentUser.id).settings, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    triggerSync();
  };

  const setThemeMode = (mode: AppThemeMode) => {
    updateSettings({ themeMode: mode });
  };

  const setLanguage = (lang: AppLanguage) => {
    updateSettings({ language: lang });
  };

  const exportBackup = () => {
    const backupData = {
      appName: 'Z.Z KHATA',
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      user: currentUser ? { email: currentUser.email, name: currentUser.displayName } : null,
      profile,
      settings: {
        themeMode: settings.themeMode,
        language: settings.language,
      },
      customers,
      transactions,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const dateStr = getTodayDateString();
    downloadAnchor.setAttribute('download', `ZZ_KHATA_BACKUP_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importBackup = async (file: File): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);

          if (!parsed.customers || !Array.isArray(parsed.customers)) {
            resolve({ success: false, message: 'Invalid backup file: customers data missing.' });
            return;
          }

          setCustomers(parsed.customers);
          if (Array.isArray(parsed.transactions)) {
            setTransactions(parsed.transactions);
          }
          if (parsed.profile) {
            setProfile(parsed.profile);
          }

          if (currentUser) {
            const keys = getKeys(currentUser.id);
            localStorage.setItem(keys.customers, JSON.stringify(parsed.customers));
            if (Array.isArray(parsed.transactions)) {
              localStorage.setItem(keys.transactions, JSON.stringify(parsed.transactions));
            }
            if (parsed.profile) {
              localStorage.setItem(keys.profile, JSON.stringify(parsed.profile));
            }
          }

          triggerSync();
          resolve({
            success: true,
            message: `Restored ${parsed.customers.length} customers & ${parsed.transactions?.length || 0} transactions!`,
          });
        } catch (err) {
          resolve({ success: false, message: 'Could not read file. Please ensure it is valid JSON.' });
        }
      };
      reader.readAsText(file);
    });
  };

  const clearAllData = () => {
    setCustomers([]);
    setTransactions([]);
    if (currentUser) {
      const keys = getKeys(currentUser.id);
      localStorage.removeItem(keys.customers);
      localStorage.removeItem(keys.transactions);
    }
    triggerSync();
  };

  return (
    <KhataContext.Provider
      value={{
        customers,
        transactions,
        profile,
        settings,
        isLocked,
        isOffline: typeof window !== 'undefined' ? !window.navigator.onLine : false,
        unlockApp,
        setPinLock,
        disablePinLock,
        lockApp,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomer,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getCustomerTransactions,
        getCustomerBalance,
        totalCustomers,
        totalApNeDiye,
        totalApKoMile,
        totalBalance,
        updateProfile,
        updateSettings,
        setThemeMode,
        setLanguage,
        exportBackup,
        importBackup,
        clearAllData,
      }}
    >
      {children}
    </KhataContext.Provider>
  );
}

export function useKhata() {
  const context = useContext(KhataContext);
  if (!context) {
    throw new Error('useKhata must be used within a KhataProvider');
  }
  return context;
}
