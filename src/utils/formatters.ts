import { Customer, Transaction, CustomerBalanceSummary, UserProfile } from '../types/khata';

/**
 * Format numbers with Pakistani Rupee prefix and thousand commas
 */
export function formatPKR(amount: number): string {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
  }).format(absAmount);
  return `Rs. ${formatted}`;
}

/**
 * Format raw numbers cleanly without currency
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Validate Pakistani mobile number according to Z.Z KHATA rules:
 * - Local format: 03XXXXXXXXX (starts with 03, exactly 11 digits)
 * - International format: +923XXXXXXXXX, +92 3XXXXXXXXX, 923XXXXXXXXX, 00923XXXXXXXXX
 * - Removes unnecessary spaces and hyphens before validation
 * - Rejects letters, symbols, incomplete or overlong numbers
 */
export function isValidPakistaniMobile(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;

  // Do NOT allow letters
  if (/[a-zA-Z]/.test(phone)) return false;

  // Remove unnecessary spaces and hyphens
  const stripped = phone.trim().replace(/[\s-]/g, '');

  // Must match either:
  // 1. 03XXXXXXXXX: starts with 03, exactly 11 digits
  // 2. +923XXXXXXXXX: starts with +923, exactly 9 digits after +923
  // 3. 923XXXXXXXXX: starts with 923, exactly 9 digits after 923
  // 4. 00923XXXXXXXXX: starts with 00923, exactly 9 digits after 00923
  return /^(03\d{9}|\+923\d{9}|923\d{9}|00923\d{9})$/.test(stripped);
}

/**
 * Normalize phone numbers for WhatsApp API (wa.me)
 * Accepts local or international formatted numbers:
 * e.g., '+923001234567' -> '923001234567'
 *       '0300 1234567' -> '923001234567'
 *       '+971501234567' -> '971501234567'
 */
export function cleanPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '92' + cleaned.slice(1);
  } else if (!cleaned.startsWith('92') && cleaned.length === 10 && phone.includes('+92')) {
    cleaned = '92' + cleaned;
  }
  return cleaned;
}

/**
 * Format phone number for readable display
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('03')) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  return phone;
}

/**
 * Get current date string in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time string in HH:mm
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format date for friendly display (e.g. 23 Sep 2026)
 */
export function formatDateFriendly(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generate formatted WhatsApp reminder message
 * As requested in Requirement 10:
 * "Assalam-o-Alaikum, aap ke Z.Z KHATA account ka current balance Rs. {BALANCE} hai. Meharbani farma kar payment ka khayal rakhein. Shukriya."
 */
export function generateWhatsAppReminderMessage(
  customer: Customer,
  balance: number,
  profile: UserProfile
): string {
  const formattedBalance = new Intl.NumberFormat('en-PK').format(Math.abs(balance));
  const shopName = profile.shopName || 'Z.Z KHATA';

  if (balance > 0) {
    return `Assalam-o-Alaikum ${customer.name}, aap ke ${shopName} account ka current balance Rs. ${formattedBalance} hai (Ap Ne Lene Hain). Meharbani farma kar payment ka khayal rakhein. Shukriya.`;
  } else if (balance < 0) {
    return `Assalam-o-Alaikum ${customer.name}, aap ka advance balance ${shopName} par Rs. ${formattedBalance} jama hai. Shukriya.`;
  } else {
    return `Assalam-o-Alaikum ${customer.name}, aap ke ${shopName} account ka khata mukammal barabar / clear hai. Shukriya.`;
  }
}

/**
 * Generate complete Khata statement text for sharing
 * Exactly matches Requirement 12:
 * Z.Z KHATA
 * Customer Name
 * Mobile Number
 * Current Balance
 * Transaction History:
 * - Date
 * - Time
 * - AP KO MILE / AP NE DIYE
 * - Amount
 * - Note
 * - Running Balance
 */
export function generateKhataStatementText(
  customer: Customer,
  transactions: Transaction[],
  summary: CustomerBalanceSummary,
  profile: UserProfile
): string {
  const shopName = profile.shopName || 'Z.Z KHATA';
  const balanceText =
    summary.currentBalance === 0
      ? 'Rs. 0 (Barabar)'
      : `Rs. ${new Intl.NumberFormat('en-PK').format(Math.abs(summary.currentBalance))} (${
          summary.currentBalance > 0 ? 'Ap Ne Lene Hain' : 'Ap Ne Dene Hain'
        })`;

  // Calculate chronological running balances
  const sortedAsc = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return a.createdAt.localeCompare(b.createdAt);
  });

  let running = customer.openingBalance || 0;
  const runningMap = new Map<string, number>();
  sortedAsc.forEach((t) => {
    if (t.type === 'AP_NE_DIYE') {
      running += t.amount;
    } else {
      running -= t.amount;
    }
    runningMap.set(t.id, running);
  });

  // Sort newest first for presentation
  const newestFirst = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    if (a.time && b.time) return b.time.localeCompare(a.time);
    return b.createdAt.localeCompare(a.createdAt);
  });

  let text = `*${shopName.toUpperCase()}*\n\n`;
  text += `Customer Name: *${customer.name}*\n`;
  text += `Mobile Number: ${customer.phone}\n`;
  if (customer.address) text += `Address: ${customer.address}\n`;
  text += `Current Balance: *${balanceText}*\n\n`;

  text += `*Transaction History:*\n`;
  if (customer.openingBalance !== 0) {
    text += `• Opening Balance: Rs. ${new Intl.NumberFormat('en-PK').format(
      Math.abs(customer.openingBalance)
    )} (${customer.openingBalance > 0 ? 'Ap Ne Diye' : 'Ap Ko Mile'})\n`;
  }

  if (newestFirst.length === 0) {
    text += `No transactions recorded yet.\n`;
  } else {
    newestFirst.forEach((t, i) => {
      const typeStr = t.type === 'AP_KO_MILE' ? 'AP KO MILE' : 'AP NE DIYE';
      const rBal = runningMap.get(t.id) ?? 0;
      text += `-------------------------\n`;
      text += `${i + 1}. Date: ${formatDateFriendly(t.date)}\n`;
      text += `   Time: ${t.time || '--'}\n`;
      text += `   Type: *${typeStr}*\n`;
      text += `   Amount: Rs. ${new Intl.NumberFormat('en-PK').format(t.amount)}\n`;
      if (t.note) text += `   Note: ${t.note}\n`;
      text += `   Running Balance: Rs. ${new Intl.NumberFormat('en-PK').format(rBal)}\n`;
    });
  }

  text += `=========================\n`;
  text += `✦ Z.Z KHATA • DIGITAL LEDGER ✦\n`;
  text += `Secure • Verified • Official\n`;
  return text;
}
