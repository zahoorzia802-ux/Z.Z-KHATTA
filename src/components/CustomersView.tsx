import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  MessageSquare,
  Eye,
  Edit2,
  Trash2,
  X,
  Users,
  Share2,
  MapPin,
  Crown,
} from 'lucide-react';
import { Customer } from '../types/khata';
import { useKhata } from '../context/KhataContext';
import {
  formatPKR,
  formatPhoneDisplay,
  cleanPhoneForWhatsApp,
  generateWhatsAppReminderMessage,
} from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { ConfirmDialog } from './ConfirmDialog';
import { ShareStatementModal } from './ShareStatementModal';
import { SyncBadge } from './SyncBadge';
import { WhatsAppReminderModal } from './WhatsAppReminderModal';

interface CustomersViewProps {
  onOpenKhata: (customer: Customer) => void;
  onAddNewCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
}

export function CustomersView({
  onOpenKhata,
  onAddNewCustomer,
  onEditCustomer,
}: CustomersViewProps) {
  const {
    customers,
    getCustomerBalance,
    getCustomerTransactions,
    deleteCustomer,
    profile,
    settings,
  } = useKhata();
  const t = getTranslation(settings.language);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'LENE_HAIN' | 'DENE_HAIN' | 'SETTLED'>('ALL');

  // Customer Delete Confirmation state
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Share Statement state
  const [customerToShare, setCustomerToShare] = useState<Customer | null>(null);

  // WhatsApp Reminder Modal state
  const [reminderCustomer, setReminderCustomer] = useState<Customer | null>(null);

  // Instant search by name, phone number, and address
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cust.name.toLowerCase().includes(q) ||
        cust.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, '')) ||
        (cust.address && cust.address.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterMode === 'ALL') return true;

      const balance = getCustomerBalance(cust.id).currentBalance;
      if (filterMode === 'LENE_HAIN') return balance > 0;
      if (filterMode === 'DENE_HAIN') return balance < 0;
      if (filterMode === 'SETTLED') return balance === 0;

      return true;
    });
  }, [customers, searchQuery, filterMode, getCustomerBalance]);

  // Permanently delete customer & all transactions
  const handleConfirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-slate-950 text-slate-100 transition-colors">
      {/* VIP Sticky Header with Search and Add Customer Button */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-2xl border-b border-white/10 px-5 pt-4 pb-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] space-y-3">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest text-amber-300 uppercase bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>VIP PRO</span>
              </span>
              <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/50 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                Z.Z KHATA
              </span>
              <SyncBadge />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2 mt-1">
              <Users className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <span>{t.navCustomers}</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {customers.length === 1 ? '1 registered customer' : `${customers.length} registered customers`}
            </p>
          </div>

          {/* Stylish ＋ ADD CUSTOMER Button */}
          <button
            onClick={onAddNewCustomer}
            type="button"
            className="group py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 active:scale-95 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all shrink-0 border border-amber-400/40"
          >
            <span className="text-base font-black leading-none">＋</span>
            <span className="tracking-tight">ADD CUSTOMER</span>
          </button>
        </div>

        {/* VIP Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search customer by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/40 shadow-inner transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              type="button"
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Segmented Control */}
        {customers.length > 0 && (
          <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-white/10 rounded-2xl overflow-x-auto no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                filterMode === 'ALL'
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('LENE_HAIN')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                filterMode === 'LENE_HAIN'
                  ? 'bg-rose-950 border border-rose-500/40 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ap Ne Lene Hain
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('DENE_HAIN')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                filterMode === 'DENE_HAIN'
                  ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ap Ne Dene Hain
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('SETTLED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                filterMode === 'SETTLED'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Settled / 0
            </button>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 max-w-2xl mx-auto w-full space-y-3">
        {/* ============================================================
            EMPTY SCREEN:
            When there are no customers:
            No Customers Yet
            Add your first customer to start your khata.
            Button: ＋ ADD CUSTOMER
            ============================================================ */}
        {customers.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 p-8 sm:p-10 border border-white/10 text-center space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] my-6">
            <div className="absolute inset-0 bg-radial-at-c from-amber-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="w-18 h-18 rounded-3xl bg-slate-900 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Users className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-white">
                No Customers Yet
              </h2>
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
        ) : filteredCustomers.length === 0 ? (
          /* Search found no results */
          <div className="rounded-3xl bg-slate-900/80 p-8 border border-white/10 text-center space-y-3 shadow-md my-4">
            <Search className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-slate-200">
              No matching customers found
            </p>
            <p className="text-xs text-slate-400">
              Try searching with another name or phone number.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterMode('ALL');
              }}
              type="button"
              className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* Premium Customer List */
          <div className="space-y-3">
            {filteredCustomers.map((customer) => {
              const balanceSummary = getCustomerBalance(customer.id);
              const balance = balanceSummary.currentBalance;
              const cleanPhone = cleanPhoneForWhatsApp(customer.phone);
              const waMessage = generateWhatsAppReminderMessage(customer, balance, profile);
              const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

              const isOwed = balance > 0;
              const isAdvance = balance < 0;

              return (
                <div
                  key={customer.id}
                  onClick={() => onOpenKhata(customer)}
                  className="relative overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 border border-white/10 hover:border-amber-500/40 shadow-[0_8px_20px_rgba(0,0,0,0.4)] transition-all cursor-pointer space-y-3.5 group active:scale-[0.99]"
                >
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent group-hover:via-amber-400/50 transition-all" />

                  {/* Customer Card Header: 👤 Name, 📱 Phone, 💰 Current Balance */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {customer.photo ? (
                        <img
                          src={customer.photo}
                          alt={customer.name}
                          className="w-11 h-11 rounded-2xl object-cover border border-amber-400/50 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/10 text-amber-300 font-black text-sm flex items-center justify-center shrink-0 shadow-inner group-hover:border-amber-400/50 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="space-y-0.5 min-w-0">
                        {/* 👤 Customer Name */}
                        <h3 className="text-base font-black text-white truncate group-hover:text-amber-200 transition-colors">
                          {customer.name}
                        </h3>

                        {/* 📱 Mobile Number */}
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{formatPhoneDisplay(customer.phone)}</span>
                        </div>

                        {customer.address && (
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 💰 Current Balance */}
                    <div className="text-right shrink-0">
                      <div
                        className={`text-lg sm:text-xl font-black tabular-nums tracking-tight ${
                          isOwed
                            ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                            : isAdvance
                            ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                            : 'text-slate-400'
                        }`}
                      >
                        {balance === 0 ? 'Rs. 0' : formatPKR(balance)}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {isOwed ? t.apNeLeneHain : isAdvance ? t.apNeDeneHain : t.settled}
                      </div>
                    </div>
                  </div>

                  {/* Customer Quick Actions Toolbar: 📞 Call, 🟢 WhatsApp, 👁 View Khata */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                    {/* Primary actions: 📞 Call, 🟢 WhatsApp, 👁 View Khata */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 📞 Call */}
                      <a
                        href={`tel:${customer.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 font-bold flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.call}</span>
                      </a>

                      {/* 🟢 WhatsApp */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReminderCustomer(customer);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.whatsApp}</span>
                      </button>

                      {/* 👁 View Khata */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenKhata(customer);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95 transition-all border border-emerald-400/30"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.viewKhata}</span>
                      </button>
                    </div>

                    {/* Secondary Actions: Share, Edit, Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomerToShare(customer);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Share Khata Statement"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCustomer(customer);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-950/50 transition-colors"
                        title="Edit Customer Profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomerToDelete(customer);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIRM DELETE CUSTOMER MODAL */}
      <ConfirmDialog
        isOpen={!!customerToDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer and all of this customer's transactions?"
        confirmText="DELETE"
        cancelText="CANCEL"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCustomerToDelete(null)}
      />

      {/* Share Khata Statement Modal */}
      {customerToShare && (
        <ShareStatementModal
          isOpen={!!customerToShare}
          customer={customerToShare}
          transactions={getCustomerTransactions(customerToShare.id)}
          summary={getCustomerBalance(customerToShare.id)}
          profile={profile}
          onClose={() => setCustomerToShare(null)}
        />
      )}

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
