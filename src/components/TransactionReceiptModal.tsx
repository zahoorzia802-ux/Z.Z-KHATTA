import React from 'react';
import { X, CheckCircle2, MessageSquare, Printer, ArrowRight, Crown } from 'lucide-react';
import { Customer, Transaction, UserProfile } from '../types/khata';
import { formatPKR, formatDateFriendly, cleanPhoneForWhatsApp } from '../utils/formatters';

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  transaction: Transaction;
  currentBalance: number;
  profile: UserProfile;
}

export function TransactionReceiptModal({
  isOpen,
  onClose,
  customer,
  transaction,
  currentBalance,
  profile,
}: TransactionReceiptModalProps) {
  if (!isOpen) return null;

  const isMile = transaction.type === 'AP_KO_MILE';
  const shopName = profile.shopName || 'Z.Z KHATA';
  const cleanPhone = cleanPhoneForWhatsApp(customer.phone);

  const receiptMessage = `Assalam-o-Alaikum ${customer.name},\n\nYeh transaction receipt hai *${shopName}* ki taraf se:\n\n*Transaction:* ${
    isMile ? 'AP KO MILE (Payment Received)' : 'AP NE DIYE (Udhaar / Debit)'
  }\n*Amount:* Rs. ${new Intl.NumberFormat('en-PK').format(transaction.amount)}\n*Date & Time:* ${formatDateFriendly(transaction.date)} ${transaction.time || ''}\n${
    transaction.note ? `*Note:* ${transaction.note}\n` : ''
  }\n*Current Balance:* Rs. ${new Intl.NumberFormat('en-PK').format(
    Math.abs(currentBalance)
  )} (${currentBalance > 0 ? 'Ap Ne Lene Hain' : currentBalance < 0 ? 'Ap Ne Dene Hain' : 'Barabar'})\n\nShukriya!\n*${shopName}*`;

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(receiptMessage)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in select-none">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/15 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Top VIP Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30 px-5 py-4 text-white text-center space-y-1 relative">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-white">Transaction Saved!</h2>
          <p className="text-xs text-slate-400">VIP Khata ledger updated successfully</p>
        </div>

        {/* Receipt Slip */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-dashed border-white/15 space-y-3 font-sans text-xs">
            <div className="text-center pb-2 border-b border-white/10 space-y-0.5">
              <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
                DIGITAL RECEIPT
              </span>
              <h3 className="font-black text-sm tracking-tight text-white uppercase">
                {shopName}
              </h3>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Customer:</span>
              <span className="font-bold text-white">{customer.name}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Mobile:</span>
              <span className="font-mono text-slate-200">{customer.phone}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Type:</span>
              <span
                className={`font-black uppercase px-2 py-0.5 rounded-lg text-[10px] border ${
                  isMile
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-950 text-rose-300 border-rose-500/40'
                }`}
              >
                {isMile ? 'AP KO MILE' : 'AP NE DIYE'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Amount:</span>
              <span
                className={`text-base font-black tabular-nums ${
                  isMile ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatPKR(transaction.amount)}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Date & Time:</span>
              <span className="text-slate-200">
                {formatDateFriendly(transaction.date)} {transaction.time || ''}
              </span>
            </div>

            {transaction.note && (
              <div className="flex justify-between items-start text-slate-400">
                <span>Note:</span>
                <span className="text-right text-slate-200 max-w-[150px] truncate">
                  {transaction.note}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-white/10 flex justify-between items-center font-bold">
              <span className="text-white">New Balance:</span>
              <span
                className={`tabular-nums ${
                  currentBalance > 0
                    ? 'text-rose-400'
                    : currentBalance < 0
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                {currentBalance === 0 ? 'Rs. 0' : formatPKR(currentBalance)}
              </span>
            </div>

            {/* Subtle Clean Z.Z KHATA Watermark */}
            <div className="pt-3 mt-1 border-t border-dashed border-white/10 text-center select-none">
              <p className="text-[10px] font-black text-amber-500/40 uppercase tracking-widest flex items-center justify-center gap-1">
                <span>✦ Z.Z KHATA • OFFICIAL RECEIPT ✦</span>
              </p>
              <p className="text-[9px] text-slate-600">Verified Digital Ledger</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all border border-emerald-400/30"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send WhatsApp Receipt</span>
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 px-3 rounded-2xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 border border-white/10"
              >
                <span>Done</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
