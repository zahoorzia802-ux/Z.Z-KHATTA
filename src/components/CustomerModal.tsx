import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Check,
  AlertCircle,
  Crown,
  ChevronDown,
  Globe,
  Search,
} from 'lucide-react';
import { Customer } from '../types/khata';
import { useKhata } from '../context/KhataContext';
import { getTranslation } from '../utils/translations';
import {
  Country,
  COUNTRIES,
  DEFAULT_COUNTRY,
  detectCountryFromPhone,
  validateAndNormalizePhone,
} from '../utils/countries';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCustomer?: Customer;
  onSaved?: (customer: Customer) => void;
}

export function CustomerModal({
  isOpen,
  onClose,
  existingCustomer,
  onSaved,
}: CustomerModalProps) {
  const { addCustomer, updateCustomer, settings } = useKhata();
  const t = getTranslation(settings.language);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [balanceType, setBalanceType] = useState<'LENE_HAIN' | 'DENE_HAIN'>('LENE_HAIN');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (existingCustomer) {
      setName(existingCustomer.name);
      setPhone(existingCustomer.phone);
      const detected = detectCountryFromPhone(existingCustomer.phone, existingCustomer.countryIso || 'PK');
      setSelectedCountry(detected);

      setAddress(existingCustomer.address || '');
      const rawBal = existingCustomer.openingBalance || 0;
      setOpeningBalance(rawBal === 0 ? '0' : String(Math.abs(rawBal)));
      setBalanceType(rawBal < 0 ? 'DENE_HAIN' : 'LENE_HAIN');
      setNotes(existingCustomer.notes || '');
      setTouchedPhone(true);
    } else {
      setName('');
      setPhone('');
      setSelectedCountry(DEFAULT_COUNTRY);
      setAddress('');
      setOpeningBalance('0');
      setBalanceType('LENE_HAIN');
      setNotes('');
      setTouchedPhone(false);
    }
    setSubmitted(false);
    setErrors({});
    setShowCountryPicker(false);
    setCountrySearch('');
  }, [existingCustomer, isOpen]);

  if (!isOpen) return null;

  // Real-time phone validation and normalization
  const phoneValidation = validateAndNormalizePhone(phone, selectedCountry);
  const isNameValid = name.trim().length > 0;
  const isPhoneValid = phoneValidation.isValid;
  const isFormValid = isNameValid && isPhoneValid;
  const showPhoneFeedback = touchedPhone || submitted || phone.length > 0;

  // Error message for phone field
  const phoneErrorMessage =
    selectedCountry.iso === 'PK'
      ? '❌ Invalid mobile number. Please enter a valid Pakistani mobile number.'
      : '❌ Invalid mobile number. Please enter a valid number.';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTouchedPhone(true);

    const newErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Customer name is required';
    }
    if (!isPhoneValid) {
      newErrors.phone = phoneErrorMessage;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const numBal = parseFloat(openingBalance.replace(/[^0-9.]/g, '')) || 0;
    const finalOpening = balanceType === 'DENE_HAIN' ? -numBal : numBal;
    const finalNormalizedPhone = phoneValidation.normalized;

    if (existingCustomer) {
      const updatedData: Partial<Customer> = {
        name: name.trim(),
        phone: finalNormalizedPhone,
        countryCode: selectedCountry.code,
        countryIso: selectedCountry.iso,
        address: address.trim(),
        openingBalance: finalOpening,
        notes: notes.trim(),
      };

      updateCustomer(existingCustomer.id, updatedData);
      if (onSaved) {
        onSaved({
          ...existingCustomer,
          ...updatedData,
        } as Customer);
      }
    } else {
      const saved = addCustomer({
        name: name.trim(),
        phone: finalNormalizedPhone,
        countryCode: selectedCountry.code,
        countryIso: selectedCountry.iso,
        address: address.trim(),
        openingBalance: finalOpening,
        notes: notes.trim(),
      });
      if (onSaved) {
        onSaved(saved);
      }
    }

    onClose();
  };

  // Filter countries for the selector
  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch) ||
      c.iso.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in select-none">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/15 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* VIP Modal Header */}
        <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-white/10 relative">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                VIP CUSTOMER
              </span>
            </div>
            <h2 className="text-base font-black tracking-tight text-white mt-1">
              {existingCustomer ? t.updateCustomer : t.addCustomer}
            </h2>
            <p className="text-xs text-slate-400">
              {existingCustomer ? 'Edit customer profile' : 'Add new customer to your khata'}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.customerName} *</span>
            </label>
            <input
              type="text"
              placeholder={t.customerNamePlaceholder}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                errors.name ? 'border-rose-500' : 'border-white/10'
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Country Selector + Mobile Number */}
          <div className="space-y-1 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.mobileNumber} *</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {selectedCountry.formatHint}
              </span>
            </div>

            {/* Country Selector Button & Input Group */}
            <div className="flex items-center gap-2">
              {/* Country Selector Button */}
              <button
                type="button"
                onClick={() => setShowCountryPicker(!showCountryPicker)}
                className="h-[42px] px-3 bg-slate-950 hover:bg-slate-800 border border-white/10 rounded-2xl text-xs font-bold text-white flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span className="text-base leading-none">{selectedCountry.flag}</span>
                <span className="font-mono text-emerald-400">{selectedCountry.code}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Mobile Number Input */}
              <input
                type="tel"
                placeholder={selectedCountry.placeholder}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setTouchedPhone(true);
                  if (errors.phone) {
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                  }
                }}
                onBlur={() => setTouchedPhone(true)}
                className={`flex-1 h-[42px] px-3.5 bg-slate-950 border rounded-2xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                  showPhoneFeedback
                    ? isPhoneValid
                      ? 'border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/40'
                      : 'border-rose-500 focus:ring-2 focus:ring-rose-500/40'
                    : 'border-white/10 focus:ring-2 focus:ring-amber-500/50'
                }`}
              />
            </div>

            {/* Country Picker Dropdown Modal */}
            {showCountryPicker && (
              <div className="absolute top-[70px] left-0 right-0 z-30 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search country or code..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    autoFocus
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {filteredCountries.map((c) => (
                    <button
                      key={c.iso + c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c);
                        setShowCountryPicker(false);
                        setCountrySearch('');
                        setTouchedPhone(true);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        selectedCountry.iso === c.iso
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span>{c.name}</span>
                      </div>
                      <span className="font-mono text-slate-400">{c.code}</span>
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <p className="text-center text-xs text-slate-500 py-3">No matching country</p>
                  )}
                </div>
              </div>
            )}

            {/* Validation Feedback Message */}
            {showPhoneFeedback && (
              <div className="pt-0.5">
                {isPhoneValid ? (
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                    <span>✓ Valid mobile number</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Saved as: {phoneValidation.normalized}
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
                    <span>{phoneErrorMessage}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.address} (Optional)</span>
            </label>
            <input
              type="text"
              placeholder={t.addressPlaceholder}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            />
          </div>

          {/* Opening Balance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.openingBalance}</span>
              </label>
              <span className="text-[10px] text-slate-500">Default: 0</span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">
                Rs.
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-sm font-black text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 tabular-nums transition-all"
              />
            </div>

            {/* Opening Balance Direction: Ap Ne Lene Hain vs Ap Ne Dene Hain */}
            {parseFloat(openingBalance) > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBalanceType('LENE_HAIN')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    balanceType === 'LENE_HAIN'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border border-white/5'
                  }`}
                >
                  Ap Ne Lene Hain (Debit)
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceType('DENE_HAIN')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    balanceType === 'DENE_HAIN'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border border-white/5'
                  }`}
                >
                  Ap Ne Dene Hain (Advance)
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.notes} (Optional)</span>
            </label>
            <input
              type="text"
              placeholder={t.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            />
          </div>

          {/* Save & Cancel Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
                isFormValid
                  ? 'bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 border-amber-400/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border-white/5 cursor-not-allowed opacity-50 shadow-none'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{existingCustomer ? t.updateCustomer : t.saveCustomer}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
