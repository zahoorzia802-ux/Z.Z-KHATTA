export type TransactionType = 'AP_KO_MILE' | 'AP_NE_DIYE';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  openingBalance: number; // positive = customer owes shopkeeper, negative = advance given
  notes?: string;
  photo?: string; // base64 data url for customer photo
  countryCode?: string; // e.g. '+92', '+971'
  countryIso?: string; // e.g. 'PK', 'AE'
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType; // AP_KO_MILE | AP_NE_DIYE
  amount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note?: string;
  photo?: string; // base64 data url for entry receipt/bill photo
  createdAt: string;
}

export interface UserProfile {
  shopName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
}

export type AppThemeMode = 'light' | 'dark' | 'system';
export type AppLanguage = 'english' | 'urdu';

export interface AppSettings {
  themeMode: AppThemeMode;
  language: AppLanguage;
  pinLockEnabled: boolean;
  pinHash: string; // Hashed/obfuscated PIN
}

export interface CustomerBalanceSummary {
  currentBalance: number; // positive = owes shopkeeper, negative = advance
  totalGiven: number; // total AP NE DIYE
  totalReceived: number; // total AP KO MILE
  transactionCount: number;
}
