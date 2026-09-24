import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Share2,
  Download,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileText,
  Wallet,
  MapPin,
  Crown,
} from 'lucide-react';
import { Customer, Transaction, TransactionType } from '../types/khata';
import { useKhata } from '../context/KhataContext';
import {
  formatPKR,
  formatDateFriendly,
  formatPhoneDisplay,
  cleanPhoneForWhatsApp,
  generateWhatsAppReminderMessage,
} from '../utils/formatters';
import { generateCustomerPdf } from '../utils/pdfGenerator';
import { TransactionModal } from './TransactionModal';
import { ShareStatementModal } from './ShareStatementModal';
import { TransactionReceiptModal } from './TransactionReceiptModal';
import { ConfirmDialog } from './ConfirmDialog';
import { SyncBadge } from './SyncBadge';
import { WhatsAppReminderModal } from './WhatsAppReminderModal';
import { getTranslation } from '../utils/translations';

interface CustomerKhataViewProps {
  customer: Customer;
  onBack: () => void;
  onEditCustomer: (customer: Customer) => void;
}

export function CustomerKhataView({
  customer,
  onBack,
  onEditCustomer,
}: CustomerKhataViewProps) {
  const {
    getCustomerBalance,
    getCustomerTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteCustomer,
    profile,
    settings,
  } = useKhata();

  const t = getTranslation(settings.language);

  const [activeTxType, setActiveTxType] = useState<TransactionType | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedReminderTx, setSelectedReminderTx] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'AP_KO_MILE' | 'AP_NE_DIYE'>('ALL');

  // Customer and Transaction Deletion dialog state
  const [showDeleteCustomerDialog, setShowDeleteCustomerDialog] = useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<string | null>(null);

  // Receipt state for newly saved or clicked transaction
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  const summary = getCustomerBalance(customer.id);
  const transactions = getCustomerTransactions(customer.id);

  const cleanPhone = cleanPhoneForWhatsApp(customer.phone);
  const reminderMessage = generateWhatsAppReminderMessage(customer, summary.currentBalance, profile);
  const waReminderUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderMessage)}`;

  // Delete Customer Handler
  const handleConfirmDeleteCustomer = () => {
    deleteCustomer(customer.id);
    setShowDeleteCustomerDialog(false);
    onBack();
  };

  // Delete Individual Transaction Handler
  const handleConfirmDeleteTransaction = () => {
    if (transactionToDeleteId) {
      deleteTransaction(transactionToDeleteId);
      setTransactionToDeleteId(null);
    }
  };

  // Calculate chronological running balances
  const sortedAsc = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return a.createdAt.localeCompare(b.createdAt);
  });

  let running = customer.openingBalance || 0;
  const runningBalanceMap = new Map<string, number>();

  sortedAsc.forEach((tx) => {
    if (tx.type === 'AP_NE_DIYE') {
      running += tx.amount;
    } else if (tx.type === 'AP_KO_MILE') {
      running -= tx.amount;
    }
    runningBalanceMap.set(tx.id, running);
  });

  // Filter transactions (newest first)
  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  const handleSaveTransaction = (data: {
    customerId: string;
    type: TransactionType;
    amount: number;
    date: string;
    time: string;
    note?: string;
    photo?: string;
  }) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
    } else {
      const newTx = addTransaction(data);
      setReceiptTx(newTx);
    }
    setActiveTxType(null);
  };

  const handleDownloadPdf = () => {
    generateCustomerPdf(customer, transactions, summary, profile);
  };

  const isOwed = summary.currentBalance > 0;
  const isAdvance = summary.currentBalance < 0;

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-slate-950 text-slate-100 transition-colors">
      {/* VIP Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-2xl border-b border-white/10 px-4 py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-between gap-3">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-2xl bg-slate-900 border border-white/10 hover:border-amber-500/40 active:scale-95 flex items-center justify-center transition-all text-slate-200 shrink-0 shadow-md"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-black tracking-tight leading-tight truncate text-white">
              {customer.name}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {formatPhoneDisplay(customer.phone)}
            </p>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <SyncBadge />
          <button
            onClick={() => onEditCustomer(customer)}
            className="w-9 h-9 rounded-2xl bg-slate-900 border border-white/10 hover:border-amber-500/40 active:scale-95 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteCustomerDialog(true)}
            className="w-9 h-9 rounded-2xl bg-slate-900 border border-white/10 hover:border-rose-500/40 active:scale-95 flex items-center justify-center text-rose-400 hover:text-rose-300 transition-all shadow-md"
            title="Delete Customer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4 max-w-2xl mx-auto w-full">
        {/* ============================================================
            LUXURY BALANCE HEADER
            Customer Name, Mobile Number, Current Balance
            ============================================================ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950 p-5 sm:p-6 border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.65)] space-y-4">
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
              isOwed
                ? 'bg-rose-500/20'
                : isAdvance
                ? 'bg-emerald-500/20'
                : 'bg-amber-500/15'
            }`}
          />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              {customer.photo ? (
                <img
                  src={customer.photo}
                  alt={customer.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black text-xl shrink-0 shadow-inner">
                  {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                </div>
              )}

              <div className="space-y-1">
                {/* Customer Name & VIP Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black text-white">
                    {customer.name}
                  </span>
                  <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    KHATA
                  </span>
                </div>

                {/* Mobile Number */}
                <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatPhoneDisplay(customer.phone)}</span>
                </div>

                {/* Current Balance Label & Amount */}
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    {t.currentBalance}
                  </span>
                  <div
                    className={`text-3xl sm:text-4xl font-black tracking-tight tabular-nums mt-0.5 ${
                      isOwed
                        ? 'text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.45)]'
                        : isAdvance
                        ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.45)]'
                        : 'text-white'
                    }`}
                  >
                    {summary.currentBalance === 0 ? 'Rs. 0' : formatPKR(summary.currentBalance)}
                  </div>

                  <div className="mt-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-xl border ${
                        isOwed
                          ? 'bg-rose-950/70 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                          : isAdvance
                          ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                          : 'bg-slate-800 border-white/10 text-slate-300'
                      }`}
                    >
                      {isOwed ? t.apNeLeneHain : isAdvance ? t.apNeDeneHain : t.settled}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right text-xs space-y-1.5">
              {customer.openingBalance !== 0 && (
                <div className="text-slate-400 font-mono text-[11px] bg-slate-800/80 border border-white/10 px-2.5 py-1 rounded-xl">
                  Opening: <span className="font-bold text-slate-200">{formatPKR(customer.openingBalance)}</span>
                </div>
              )}
              {customer.address && (
                <div className="text-slate-400 text-xs truncate max-w-[160px] flex items-center justify-end gap-1">
                  <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Communication & Sharing Actions */}
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/10">
            {/* 📞 Call */}
            <a
              href={`tel:${customer.phone}`}
              className="py-2.5 px-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>{t.call}</span>
            </a>

            {/* 🟢 WhatsApp Reminder */}
            <button
              type="button"
              onClick={() => setShowReminderModal(true)}
              className="py-2.5 px-2 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>{t.whatsApp}</span>
            </button>

            {/* Share Khata Text */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="py-2.5 px-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Share2 className="w-4 h-4 text-blue-400" />
              <span>Share</span>
            </button>

            {/* Download/Share PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="py-2.5 px-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            TWO LARGE & PREMIUM TRANSACTION BUTTONS
            🟢 AP KO MILE
            🔴 AP NE DIYE
            (DO NOT RENAME THESE BUTTONS)
            ============================================================ */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {/* 🟢 AP KO MILE */}
          <button
            type="button"
            onClick={() => {
              setEditingTransaction(null);
              setActiveTxType('AP_KO_MILE');
            }}
            className="relative overflow-hidden py-4 sm:py-5 px-3 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-sm sm:text-base flex flex-col items-center justify-center gap-1.5 shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all group border border-emerald-400/40"
          >
            <div className="w-10 h-10 rounded-2xl bg-black/25 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
              <ArrowDownLeft className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <span className="tracking-wide">🟢 AP KO MILE</span>
            <span className="text-[10px] text-emerald-100 font-medium">
              (Raqam Wasool Hui / +)
            </span>
          </button>

          {/* 🔴 AP NE DIYE */}
          <button
            type="button"
            onClick={() => {
              setEditingTransaction(null);
              setActiveTxType('AP_NE_DIYE');
            }}
            className="relative overflow-hidden py-4 sm:py-5 px-3 rounded-3xl bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white font-black text-sm sm:text-base flex flex-col items-center justify-center gap-1.5 shadow-[0_0_30px_rgba(244,63,94,0.35)] transition-all group border border-rose-400/40"
          >
            <div className="w-10 h-10 rounded-2xl bg-black/25 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
              <ArrowUpRight className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <span className="tracking-wide">🔴 AP NE DIYE</span>
            <span className="text-[10px] text-rose-100 font-medium">
              (Udhar / Mal Diya / −)
            </span>
          </button>
        </div>

        {/* ============================================================
            TRANSACTION HISTORY: PREMIUM TIMELINE / CARD DESIGN
            Amount, Date, Time, Note, Running Balance, Actions (✏️ Edit, 🗑 Delete)
            ============================================================ */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
              <span>{t.history}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-white/10">
                {transactions.length} entries
              </span>
            </h2>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-900 border border-white/10 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'ALL'
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('AP_KO_MILE')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'AP_KO_MILE'
                    ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                Mile
              </button>
              <button
                type="button"
                onClick={() => setFilterType('AP_NE_DIYE')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'AP_NE_DIYE'
                    ? 'bg-rose-950 border border-rose-500/40 text-rose-300 font-bold'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                Diye
              </button>
            </div>
          </div>

          {/* Transactions List */}
          {transactions.length === 0 ? (
            <div className="rounded-3xl bg-slate-900/80 p-8 border border-white/10 text-center space-y-2.5 shadow-md my-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-inner border border-white/10">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-base font-black text-white">
                {t.noTransactionsYet}
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {t.noTransactionsSubtext}
              </p>
            </div>
          ) : (
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-800 before:pointer-events-none">
              {filteredTransactions.map((tx) => {
                const isMile = tx.type === 'AP_KO_MILE';
                const runningBal = runningBalanceMap.get(tx.id) ?? 0;

                return (
                  <div
                    key={tx.id}
                    className="relative overflow-hidden rounded-3xl bg-slate-900/85 backdrop-blur-xl p-4 sm:p-5 border border-white/10 hover:border-amber-500/30 shadow-[0_6px_20px_rgba(0,0,0,0.4)] transition-all space-y-3"
                  >
                    {/* Top Row: Type, Date, Time, and Amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border ${
                            isMile
                              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.25)]'
                              : 'bg-rose-950/70 border-rose-500/40 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.25)]'
                          }`}
                        >
                          {isMile ? '🟢 AP KO MILE' : '🔴 AP NE DIYE'}
                        </span>

                        <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{formatDateFriendly(tx.date)}</span>
                          </span>
                          {tx.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{tx.time}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Transaction Amount & Running Balance */}
                      <div className="text-right">
                        <div
                          className={`text-lg sm:text-xl font-black tabular-nums tracking-tight ${
                            isMile
                              ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.35)]'
                              : 'text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.35)]'
                          }`}
                        >
                          {isMile ? '+' : '−'} {formatPKR(tx.amount)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-bold tabular-nums">
                          Bal: {formatPKR(runningBal)}
                        </div>
                      </div>
                    </div>

                    {/* Note row */}
                    {tx.note && (
                      <div className="bg-slate-800/80 px-3.5 py-2 rounded-2xl text-xs text-slate-200 font-medium border border-white/5">
                        {tx.note}
                      </div>
                    )}

                    {/* Entry Photo Thumbnail (if attached) */}
                    {tx.photo && (
                      <div className="flex items-center gap-2.5 p-2 bg-slate-950/80 rounded-xl border border-white/10">
                        <img
                          src={tx.photo}
                          alt="Entry receipt"
                          className="w-12 h-12 rounded-lg object-cover border border-amber-500/40 shadow-sm shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                            <span>📷 Entry Receipt Photo Attached</span>
                          </p>
                          <p className="text-[10px] text-slate-400">Attached to ledger entry</p>
                        </div>
                      </div>
                    )}

                    {/* Bottom Actions: Receipt, Reminder, ✏️ Edit, 🗑 Delete */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setReceiptTx(tx)}
                          className="py-1 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1.5 transition-colors border border-white/10"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{t.receipt}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReminderTx(tx);
                            setShowReminderModal(true);
                          }}
                          className="py-1 px-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1 transition-colors"
                          title="WhatsApp Reminder for this Entry"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-400" />
                          <span>Reminder</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* ✏️ Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTransaction(tx);
                            setActiveTxType(tx.type);
                          }}
                          className="py-1 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1.5 transition-colors border border-white/10"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{t.edit}</span>
                        </button>

                        {/* 🗑 Delete */}
                        <button
                          type="button"
                          onClick={() => setTransactionToDeleteId(tx.id)}
                          className="py-1 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-400 font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.delete}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TRANSACTION ENTRY / EDIT MODAL WITH CALCULATOR */}
      {activeTxType && (
        <TransactionModal
          customer={customer}
          type={activeTxType}
          existingTransaction={editingTransaction || undefined}
          isOpen={!!activeTxType}
          onClose={() => {
            setActiveTxType(null);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
        />
      )}

      {/* CONFIRM DELETE CUSTOMER MODAL */}
      <ConfirmDialog
        isOpen={showDeleteCustomerDialog}
        title="Delete Customer"
        message="Are you sure you want to delete this customer and all of this customer's transactions?"
        confirmText="DELETE"
        cancelText="CANCEL"
        isDestructive={true}
        onConfirm={handleConfirmDeleteCustomer}
        onCancel={() => setShowDeleteCustomerDialog(false)}
      />

      {/* CONFIRM DELETE TRANSACTION MODAL */}
      <ConfirmDialog
        isOpen={!!transactionToDeleteId}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
        confirmText="DELETE"
        cancelText="CANCEL"
        isDestructive={true}
        onConfirm={handleConfirmDeleteTransaction}
        onCancel={() => setTransactionToDeleteId(null)}
      />

      {/* Share Statement Modal */}
      {showShareModal && (
        <ShareStatementModal
          isOpen={showShareModal}
          customer={customer}
          transactions={transactions}
          summary={summary}
          profile={profile}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Transaction Receipt Modal */}
      {receiptTx && (
        <TransactionReceiptModal
          isOpen={!!receiptTx}
          customer={customer}
          transaction={receiptTx}
          profile={profile}
          currentBalance={runningBalanceMap.get(receiptTx.id) ?? summary.currentBalance}
          onClose={() => setReceiptTx(null)}
        />
      )}

      {/* WhatsApp Reminder Modal with Photo Preview and Z.Z KHATA Watermark */}
      <WhatsAppReminderModal
        isOpen={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setSelectedReminderTx(null);
        }}
        customer={customer}
        currentBalance={summary.currentBalance}
        profile={profile}
        transaction={selectedReminderTx || undefined}
      />
    </div>
  );
}
