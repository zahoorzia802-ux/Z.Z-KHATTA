import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Phone,
  MessageSquare,
  Wallet,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Eye,
  Crown,
} from 'lucide-react';
import { Customer } from '../types/khata';
import { useKhata } from '../context/KhataContext';
import {
  formatPKR,
  formatDateFriendly,
  formatPhoneDisplay,
  cleanPhoneForWhatsApp,
  generateWhatsAppReminderMessage,
} from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { SyncBadge } from './SyncBadge';
import { WhatsAppReminderModal } from './WhatsAppReminderModal';

interface HomeViewProps {
  onOpenKhata: (customer: Customer) => void;
  onAddNewCustomer: () => void;
  onViewAllCustomers: () => void;
}

export function HomeView({
  onOpenKhata,
  onAddNewCustomer,
  onViewAllCustomers,
}: HomeViewProps) {
  const {
    customers,
    transactions,
    totalCustomers,
    totalApNeDiye,
    totalApKoMile,
    totalBalance,
    getCustomerBalance,
    profile,
    settings,
  } = useKhata();

  const [reminderCustomer, setReminderCustomer] = useState<Customer | null>(null);

  const t = getTranslation(settings.language);

  // Recent transactions sorted newest first
  const recentTransactions = [...transactions]
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      if (a.time && b.time) return b.time.localeCompare(a.time);
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 5);

  // Recent customers sorted by activity
  const recentCustomers = [...customers]
    .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
    .slice(0, 4);

  const isBalanceOwed = totalBalance > 0;
  const isBalanceAdvance = totalBalance < 0;

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-slate-950 text-slate-100 transition-colors">
      {/* ============================================================
          VIP TOP BRANDING & WELCOME SECTION
          ============================================================ */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-2xl border-b border-white/10 px-5 pt-4 pb-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        {/* Subtle Ambient Gold Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest text-amber-300 uppercase bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>VIP PRO</span>
              </span>
              <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/50 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                Z.Z KHATA
              </span>
              <SyncBadge />
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                Assalam-o-Alaikum
              </span>
              <span className="inline-block animate-pulse">👋</span>
            </h1>

            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {profile.shopName || profile.ownerName
                ? `${profile.shopName || profile.ownerName} • `
                : ''}
              {t.tagline}
            </p>
          </div>

          {/* Stylish ＋ ADD CUSTOMER Button */}
          <button
            onClick={onAddNewCustomer}
            type="button"
            className="group py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 active:scale-95 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all duration-200 shrink-0 border border-amber-400/40"
          >
            <span className="text-base font-black leading-none">＋</span>
            <span className="tracking-tight">ADD CUSTOMER</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5 max-w-2xl mx-auto w-full">
        {/* ============================================================
            4 LUXURY DASHBOARD CARDS WITH SUBTLE GLOW/GRADIENTS
            1. 👥 TOTAL CUSTOMERS
            2. 💰 TOTAL BALANCE
            3. 🔴 AP NE DIYE — ALL TOTAL
            4. 🟢 AP KO MILE — ALL TOTAL
            ============================================================ */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {/* Card 1: 👥 TOTAL CUSTOMERS */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-4 sm:p-5 border border-white/10 hover:border-amber-500/30 shadow-[0_8px_25px_rgba(0,0,0,0.5)] transition-all group space-y-2">
            {/* Top ambient highlight */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                <span>👥</span>
                <span>{t.totalCustomers}</span>
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-white/10 text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
              {totalCustomers}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span>{totalCustomers === 1 ? '1 active customer' : `${totalCustomers} active customers`}</span>
            </div>
          </div>

          {/* Card 4: 💰 TOTAL BALANCE (Net ledger balance) */}
          <div
            className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 border shadow-[0_8px_25px_rgba(0,0,0,0.5)] transition-all group space-y-2 ${
              isBalanceOwed
                ? 'bg-gradient-to-br from-rose-950/40 via-slate-900/80 to-slate-950 border-rose-500/30 hover:border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                : isBalanceAdvance
                ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border-white/10 hover:border-white/20'
            }`}
          >
            {/* Ambient corner glow */}
            <div
              className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-all ${
                isBalanceOwed
                  ? 'bg-rose-500/15 group-hover:bg-rose-500/25'
                  : isBalanceAdvance
                  ? 'bg-emerald-500/15 group-hover:bg-emerald-500/25'
                  : 'bg-amber-500/10'
              }`}
            />

            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 ${
                  isBalanceOwed
                    ? 'text-rose-400'
                    : isBalanceAdvance
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                <span>💰</span>
                <span>{t.totalBalance}</span>
              </span>
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner ${
                  isBalanceOwed
                    ? 'bg-rose-950/60 border-rose-500/30 text-rose-400'
                    : isBalanceAdvance
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800/80 border-white/10 text-amber-400'
                }`}
              >
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div
              className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${
                isBalanceOwed
                  ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                  : isBalanceAdvance
                  ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                  : 'text-white'
              }`}
            >
              {totalBalance === 0 ? 'Rs. 0' : formatPKR(totalBalance)}
            </div>

            <p className="text-[11px] font-black uppercase tracking-wider">
              {isBalanceOwed ? (
                <span className="text-rose-400">{t.apNeLeneHain}</span>
              ) : isBalanceAdvance ? (
                <span className="text-emerald-400">{t.apNeDeneHain}</span>
              ) : (
                <span className="text-slate-400">{t.settled}</span>
              )}
            </p>
          </div>

          {/* Card 2: 🔴 AP NE DIYE — ALL TOTAL */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950/20 via-slate-900/80 to-slate-950 p-4 sm:p-5 border border-rose-500/20 hover:border-rose-500/40 shadow-[0_8px_25px_rgba(0,0,0,0.5)] transition-all group space-y-2">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-wider uppercase text-rose-400 flex items-center gap-1.5">
                <span>🔴</span>
                <span>{t.apNeDiyeTotal}</span>
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-400 flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>

            <div className="text-xl sm:text-2xl font-black text-rose-400 tabular-nums tracking-tight">
              {formatPKR(totalApNeDiye)}
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Total Udhaar / Given
            </p>
          </div>

          {/* Card 3: 🟢 AP KO MILE — ALL TOTAL */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/20 via-slate-900/80 to-slate-950 p-4 sm:p-5 border border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_8px_25px_rgba(0,0,0,0.5)] transition-all group space-y-2">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
                <span>🟢</span>
                <span>{t.apKoMileTotal}</span>
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums tracking-tight">
              {formatPKR(totalApKoMile)}
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Total Vasooli / Received
            </p>
          </div>
        </div>

        {/* ============================================================
            RECENT CUSTOMERS SECTION
            ============================================================ */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                <span>{t.recentCustomers}</span>
                <span className="text-[10px] text-amber-400 font-extrabold uppercase bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  VIP LEDGER
                </span>
              </h2>
              {totalCustomers > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-[10px] font-bold text-slate-300">
                  {totalCustomers}
                </span>
              )}
            </div>

            {totalCustomers > 0 && (
              <button
                onClick={onViewAllCustomers}
                type="button"
                className="text-xs font-black text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <span>{t.viewAll}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ============================================================
              EMPTY STATE: No Customers Yet
              Add your first customer to start your khata.
              Button: ＋ ADD CUSTOMER
              ============================================================ */}
          {recentCustomers.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 p-8 sm:p-10 border border-white/10 text-center space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] my-4">
              <div className="absolute inset-0 bg-radial-at-c from-amber-500/10 via-transparent to-transparent pointer-events-none" />

              <div className="w-18 h-18 rounded-3xl bg-slate-900 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <Users className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white">
                  No Customers Yet
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Add your first customer to start your khata.
                </p>
              </div>

              <button
                onClick={onAddNewCustomer}
                type="button"
                className="py-3 px-6 bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 active:scale-95 text-slate-950 text-xs font-black rounded-2xl inline-flex items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all border border-amber-400/40"
              >
                <span className="text-base font-black leading-none">＋</span>
                <span>ADD CUSTOMER</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCustomers.map((cust) => {
                const bal = getCustomerBalance(cust.id).currentBalance;
                const cleanPhone = cleanPhoneForWhatsApp(cust.phone);
                const waMessage = generateWhatsAppReminderMessage(cust, bal, profile);
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

                const isOwed = bal > 0;
                const isAdvance = bal < 0;

                return (
                  <div
                    key={cust.id}
                    onClick={() => onOpenKhata(cust)}
                    className="relative overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 border border-white/10 hover:border-amber-500/40 shadow-[0_8px_20px_rgba(0,0,0,0.4)] transition-all cursor-pointer space-y-3.5 group active:scale-[0.99]"
                  >
                    {/* Top ambient hover line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent group-hover:via-amber-400/50 transition-all" />

                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          {cust.photo ? (
                            <img
                              src={cust.photo}
                              alt={cust.name}
                              className="w-10 h-10 rounded-2xl object-cover border border-amber-400/50 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/10 text-amber-300 font-black text-sm flex items-center justify-center shrink-0 shadow-inner group-hover:border-amber-400/50 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all">
                              {cust.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            {/* 👤 Customer Name */}
                            <h3 className="text-base font-black text-white truncate group-hover:text-amber-200 transition-colors">
                              {cust.name}
                            </h3>
                            {/* 📱 Mobile Number */}
                            <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{formatPhoneDisplay(cust.phone)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 💰 Current Balance */}
                      <div className="text-right shrink-0">
                        <div
                          className={`text-base sm:text-lg font-black tabular-nums tracking-tight ${
                            isOwed
                              ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                              : isAdvance
                              ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                              : 'text-slate-400'
                          }`}
                        >
                          {bal === 0 ? 'Rs. 0' : formatPKR(bal)}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {isOwed ? t.apNeLeneHain : isAdvance ? t.apNeDeneHain : t.settled}
                        </div>
                      </div>
                    </div>

                    {/* Quick VIP Action Buttons: 📞 Call, 🟢 WhatsApp, 👁 View Khata */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                      <div className="flex items-center gap-2">
                        {/* 📞 Call */}
                        <a
                          href={`tel:${cust.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 font-bold flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t.call}</span>
                        </a>

                        {/* 🟢 WhatsApp Reminder */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReminderCustomer(cust);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t.whatsApp}</span>
                        </button>
                      </div>

                      {/* 👁 View Khata */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenKhata(cust);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95 transition-all border border-emerald-400/30"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.viewKhata}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================
            RECENT TRANSACTIONS SECTION
            ============================================================ */}
        {recentTransactions.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
              <span>{t.recentTransactions}</span>
            </h2>

            <div className="space-y-2.5">
              {recentTransactions.map((tx) => {
                const cust = customers.find((c) => c.id === tx.customerId);
                const isMile = tx.type === 'AP_KO_MILE';

                return (
                  <div
                    key={tx.id}
                    onClick={() => {
                      if (cust) onOpenKhata(cust);
                    }}
                    className="rounded-2xl bg-slate-900/70 backdrop-blur-xl p-3.5 border border-white/10 hover:border-amber-500/30 shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-inner ${
                          isMile
                            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                            : 'bg-rose-950/80 border border-rose-500/40 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                        }`}
                      >
                        {isMile ? '↓' : '↑'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-sm text-white truncate">
                          {cust ? cust.name : 'Unknown Customer'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {formatDateFriendly(tx.date)} {tx.time ? `• ${tx.time}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-black text-sm sm:text-base tabular-nums ${
                          isMile
                            ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                            : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                        }`}
                      >
                        {isMile ? '+' : '−'} {formatPKR(tx.amount)}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        {isMile ? 'AP KO MILE' : 'AP NE DIYE'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Reminder Modal */}
      {reminderCustomer && (
        <WhatsAppReminderModal
          isOpen={!!reminderCustomer}
          onClose={() => setReminderCustomer(null)}
          customer={reminderCustomer}
          currentBalance={getCustomerBalance(reminderCustomer.id).currentBalance}
          profile={profile}
        />
      )}
    </div>
  );
}
