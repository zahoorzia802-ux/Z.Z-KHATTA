import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  FileText,
  Check,
  Delete as BackspaceIcon,
  RotateCcw,
  Equal,
  Crown,
  Camera,
  Upload,
  Trash2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { Customer, Transaction, TransactionType } from '../types/khata';
import { getTodayDateString, getCurrentTimeString, formatPKR } from '../utils/formatters';
import { useKhata } from '../context/KhataContext';
import { getTranslation } from '../utils/translations';
import { optimizeTransactionPhoto } from '../utils/imageOptimizer';
import { requestCameraPermission, requestFilePermission, PermissionType, PermissionStateResult } from '../utils/permissionManager';
import { PermissionModal } from './PermissionModal';

interface TransactionModalProps {
  customer: Customer;
  type: TransactionType;
  existingTransaction?: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    customerId: string;
    type: TransactionType;
    amount: number;
    date: string;
    time: string;
    note?: string;
    photo?: string;
  }) => void;
}

export function TransactionModal({
  customer,
  type: initialType,
  existingTransaction,
  isOpen,
  onClose,
  onSave,
}: TransactionModalProps) {
  const { settings } = useKhata();
  const t = getTranslation(settings.language);

  const [selectedType, setSelectedType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [photo, setPhoto] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [permissionModalInfo, setPermissionModalInfo] = useState<{
    type: PermissionType;
    status: PermissionStateResult;
  } | null>(null);

  const handleCameraClick = async () => {
    const res = await requestCameraPermission();
    if (res.status === 'granted') {
      cameraInputRef.current?.click();
    } else {
      setPermissionModalInfo({ type: 'camera', status: res.status });
    }
  };

  const handleGalleryClick = async () => {
    const res = await requestFilePermission();
    if (res.status === 'granted') {
      galleryInputRef.current?.click();
    } else {
      setPermissionModalInfo({ type: 'files', status: res.status });
    }
  };

  // Built-in Calculator State
  const [calcDisplay, setCalcDisplay] = useState<string>('');
  const [calcFeedback, setCalcFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (existingTransaction) {
        setSelectedType(existingTransaction.type);
        setAmount(String(existingTransaction.amount));
        setDate(existingTransaction.date);
        setTime(existingTransaction.time || getCurrentTimeString());
        setNote(existingTransaction.note || '');
        setPhoto(existingTransaction.photo || '');
        setCalcDisplay(String(existingTransaction.amount));
      } else {
        setSelectedType(initialType);
        setAmount('');
        setDate(getTodayDateString());
        setTime(getCurrentTimeString());
        setNote('');
        setPhoto('');
        setCalcDisplay('');
      }
      setPhotoError('');
      setCalcFeedback(null);
    }
  }, [isOpen, existingTransaction, initialType]);

  if (!isOpen) return null;

  // Handle Photo selection from Camera or Gallery for Entry
  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoError('');
      const optimized = await optimizeTransactionPhoto(file);
      setPhoto(optimized);
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      e.target.value = '';
    }
  };

  // Safe arithmetic evaluator
  const evaluateCalc = (expr: string): number | null => {
    try {
      const sanitized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/[^0-9+\-*/.]/g, '');

      if (!sanitized) return null;

      const trimmed = sanitized.replace(/[+\-*/]+$/, '');
      if (!trimmed) return null;

      // Safe evaluation
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${trimmed})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.round(result * 100) / 100;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Calculator button click handler
  const handleCalcClick = (val: string) => {
    setCalcFeedback(null);

    if (val === 'Clear') {
      setCalcDisplay('');
      setAmount('');
      return;
    }

    if (val === 'Backspace') {
      const updated = calcDisplay.slice(0, -1);
      setCalcDisplay(updated);
      const evalResult = evaluateCalc(updated);
      if (evalResult !== null && evalResult > 0) {
        setAmount(String(evalResult));
      } else if (!updated) {
        setAmount('');
      }
      return;
    }

    if (val === '=') {
      const evalResult = evaluateCalc(calcDisplay);
      if (evalResult !== null) {
        setCalcDisplay(String(evalResult));
        setAmount(String(evalResult));
        setCalcFeedback(`= Rs. ${evalResult.toLocaleString()}`);
      } else {
        setCalcFeedback('Invalid expression');
      }
      return;
    }

    // Append digit or operator
    const lastChar = calcDisplay.slice(-1);
    const isOperator = ['+', '−', '×', '÷'].includes(val);
    const lastIsOperator = ['+', '−', '×', '÷'].includes(lastChar);

    if (isOperator && lastIsOperator) {
      const replaced = calcDisplay.slice(0, -1) + val;
      setCalcDisplay(replaced);
      return;
    }

    if (isOperator && !calcDisplay) {
      if (val === '−') {
        setCalcDisplay('−');
      }
      return;
    }

    const nextExpr = calcDisplay + val;
    setCalcDisplay(nextExpr);

    // Auto-update amount field if valid number or expression
    if (!isOperator) {
      const evalResult = evaluateCalc(nextExpr);
      if (evalResult !== null && evalResult > 0) {
        setAmount(String(evalResult));
      }
    }
  };

  // Direct typing into amount field syncs with calculator
  const handleDirectAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    setCalcDisplay(val);
    setCalcFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      const evalResult = evaluateCalc(calcDisplay);
      if (evalResult && evalResult > 0) {
        finalAmount = evalResult;
      } else {
        alert('Please enter a valid amount greater than 0');
        return;
      }
    }

    onSave({
      customerId: customer.id,
      type: selectedType,
      amount: finalAmount,
      date: date || getTodayDateString(),
      time: time || getCurrentTimeString(),
      note: note.trim(),
      photo: photo || undefined,
    });

    onClose();
  };

  const isMile = selectedType === 'AP_KO_MILE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-slate-900 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/15 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* VIP Header with Type Selector */}
        <div
          className={`px-5 py-4 text-white flex items-center justify-between border-b transition-colors relative overflow-hidden ${
            isMile
              ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border-emerald-500/30'
              : 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 border-rose-500/30'
          }`}
        >
          {/* Subtle top gold highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight uppercase text-white">
                {isMile ? '🟢 AP KO MILE' : '🔴 AP NE DIYE'}
              </span>
              <span className="text-xs bg-black/40 px-2.5 py-0.5 rounded-full font-bold border border-white/10 text-slate-300">
                {isMile ? '(Vasooli / Received)' : '(Udhaar / Debit)'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Customer: <span className="font-bold text-amber-300">{customer.name}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Transaction Type Toggle: strictly AP KO MILE and AP NE DIYE */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setSelectedType('AP_KO_MILE')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black tracking-tight transition-all flex items-center justify-center gap-1.5 ${
                selectedType === 'AP_KO_MILE'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] border border-emerald-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🟢 AP KO MILE</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('AP_NE_DIYE')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black tracking-tight transition-all flex items-center justify-center gap-1.5 ${
                selectedType === 'AP_NE_DIYE'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.35)] border border-rose-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🔴 AP NE DIYE</span>
            </button>
          </div>

          {/* Amount Display & Direct Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                {t.amount} (Rs.) *
              </label>
              {calcDisplay && (
                <span className="text-xs font-mono text-amber-400 font-bold">
                  Calc: {calcDisplay}
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-3 text-lg font-black text-slate-400">
                Rs.
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={handleDirectAmountChange}
                required
                className={`w-full pl-14 pr-4 py-3 bg-slate-950 border rounded-2xl text-2xl font-black text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 tabular-nums transition-all ${
                  isMile
                    ? 'border-emerald-500/30 focus:ring-emerald-500'
                    : 'border-rose-500/30 focus:ring-rose-500'
                }`}
              />
            </div>
          </div>

          {/* ============================================================
              BUILT-IN CALCULATOR DIRECTLY ON THE SAME SCREEN
              Buttons: 0 1 2 3 4 5 6 7 8 9 + − × ÷ = . Clear Backspace
              ============================================================ */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <span>🧮 Built-in Calculator</span>
              </span>
              {calcFeedback && (
                <span className="text-amber-400 font-mono font-bold animate-pulse">
                  {calcFeedback}
                </span>
              )}
            </div>

            {/* Calculator Grid: 0–9, +, −, ×, ÷, =, ., Clear, Backspace */}
            <div className="grid grid-cols-4 gap-1.5 select-none font-mono">
              {/* Row 1 */}
              <button
                type="button"
                onClick={() => handleCalcClick('Clear')}
                className="h-10 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-rose-400 text-xs font-black transition-all active:scale-95 border border-white/5"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('÷')}
                className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-base font-black transition-all active:scale-95 border border-white/5"
              >
                ÷
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('×')}
                className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-base font-black transition-all active:scale-95 border border-white/5"
              >
                ×
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('Backspace')}
                className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all active:scale-95 border border-white/5"
                aria-label="Backspace"
              >
                <BackspaceIcon className="w-4 h-4" />
              </button>

              {/* Row 2 */}
              <button
                type="button"
                onClick={() => handleCalcClick('7')}
                className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-base font-black text-white shadow-xs active:scale-95 transition-all"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('8')}
                className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-base font-black text-white shadow-xs active:scale-95 transition-all"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('9')}
                className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-base font-black text-white shadow-xs active:scale-95 transition-all"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('−')}
                className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-base font-black transition-all active:scale-95 border border-white/5"
              >
                −
              </button>

              {/* Row 3 */}
              <button
                type="button"
                onClick={() => handleCalcClick('4')}
                className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-base font-black text-white shadow-xs active:scale-95 transition-all"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('5')}
                className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-base font-black text-white shadow-xs active:scale-95 transition-all"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('6')}
                className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-base font-black text-white shadow-xs active:scale-95 transition-all"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('+')}
                className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-base font-black transition-all active:scale-95 border border-white/5"
              >
                +
              </button>

              {/* Row 4 */}
              <button
                type="button"
                onClick={() => handleCalcClick('1')}
                className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-base font-black text-white shadow-xs active:scale-95 transition-all"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('2')}
                className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-base font-black text-white shadow-xs active:scale-95 transition-all"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('3')}
                className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-base font-black text-white shadow-xs active:scale-95 transition-all"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('=')}
                className="h-10 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 text-base font-black transition-all active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center justify-center"
              >
                <Equal className="w-4 h-4 stroke-[3]" />
              </button>

              {/* Row 5 */}
              <button
                type="button"
                onClick={() => handleCalcClick('0')}
                className="col-span-2 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-base font-black text-white shadow-xs active:scale-95 transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('.')}
                className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-base font-black text-white shadow-xs active:scale-95 transition-all"
              >
                .
              </button>
            </div>
          </div>

          {/* Date & Time fields */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.date}</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.time}</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Note / Details field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.note} (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 5 bags cement, cash payment, bill # 402"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Quick preset notes */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {['Cash Payment', 'Udhaar', 'Bank Transfer', 'Discount', 'Full Payment'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setNote((prev) => (prev ? `${prev}, ${tag}` : tag))}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-white/5"
              >
                + {tag}
              </button>
            ))}
          </div>

          {/* 📷 Entry Photo Attachment (Camera + File / Gallery) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Entry Photo / Receipt (Optional)</span>
              </label>
              {photo && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Photo Attached</span>
                </span>
              )}
            </div>

            {/* Hidden native inputs for Camera and File / Gallery */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageFile}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFile}
              className="hidden"
            />

            {photo ? (
              /* Photo Preview with Change/Remove */
              <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-xl border border-white/10">
                <div className="relative group">
                  <img
                    src={photo}
                    alt="Entry receipt"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                  />
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <p className="text-xs font-bold text-slate-200">Transaction Photo Attached</p>
                  <p className="text-[10px] text-slate-400 truncate">Saved permanently with this entry</p>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleCameraClick}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-white/10 flex items-center gap-1 transition-all"
                    >
                      <Camera className="w-3 h-3 text-amber-400" />
                      <span>Retake</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGalleryClick}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-white/10 flex items-center gap-1 transition-all"
                    >
                      <Upload className="w-3 h-3 text-emerald-400" />
                      <span>Change</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoto('')}
                      className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-[11px] font-bold border border-rose-500/30 flex items-center gap-1 transition-all"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Two Prominent Options: 📷 Camera & 📁 File / Gallery */
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCameraClick}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm group"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <span>📷 Camera</span>
                </button>

                <button
                  type="button"
                  onClick={handleGalleryClick}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm group"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                  <span>📁 File / Gallery</span>
                </button>
              </div>
            )}

            {photoError && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{photoError}</span>
              </p>
            )}
          </div>

          {/* Submit & Cancel Buttons */}
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
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs text-white transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                isMile
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-600/30 border border-emerald-400/30'
                  : 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 shadow-rose-600/30 border border-rose-400/30'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{existingTransaction ? 'Update Entry' : 'Save Transaction'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* On-Demand Device Permission Modal */}
      {permissionModalInfo && (
        <PermissionModal
          isOpen={!!permissionModalInfo}
          onClose={() => setPermissionModalInfo(null)}
          permissionType={permissionModalInfo.type}
          status={permissionModalInfo.status}
          onRetry={() => {
            if (permissionModalInfo.type === 'camera') handleCameraClick();
            if (permissionModalInfo.type === 'files') handleGalleryClick();
          }}
        />
      )}
    </div>
  );
}
