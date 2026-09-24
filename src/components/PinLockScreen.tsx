import React, { useState } from 'react';
import { Lock, Delete, ShieldCheck, AlertCircle, Crown } from 'lucide-react';
import { useKhata } from '../context/KhataContext';
import { getTranslation } from '../utils/translations';

export function PinLockScreen() {
  const { unlockApp, profile, settings } = useKhata();
  const t = getTranslation(settings.language);

  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  const handleDigit = (digit: string) => {
    if (enteredPin.length >= 6) return;
    const next = enteredPin + digit;
    setEnteredPin(next);
    setErrorMsg('');

    // Check automatically when at least 4 digits entered
    if (next.length >= 4) {
      const success = unlockApp(next);
      if (success) {
        setEnteredPin('');
        setErrorMsg('');
      } else if (next.length === 6) {
        triggerError();
      }
    }
  };

  const triggerError = () => {
    setErrorMsg(t.wrongPin);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setEnteredPin('');
    }, 600);
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg('');
  };

  const handleManualSubmit = () => {
    if (!enteredPin) return;
    const success = unlockApp(enteredPin);
    if (!success) {
      triggerError();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-white select-none relative overflow-hidden">
      {/* Luxury Ambient Glow */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6 relative z-10">
        {/* App Icon & Header */}
        <div className="space-y-2">
          <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-amber-500 via-emerald-600 to-teal-400 p-[1px] shadow-[0_0_35px_rgba(245,158,11,0.3)] mx-auto">
            <div className="w-full h-full bg-slate-950 rounded-[23px] flex items-center justify-center">
              <Crown className="w-9 h-9 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            </div>
          </div>
          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              VIP SECURE LOCK
            </span>
            <h1 className="text-xl font-black tracking-tight text-white mt-1">
              {profile.shopName || 'Z.Z KHATA'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{t.enterPinToUnlock}</p>
          </div>
        </div>

        {/* PIN Dots Display */}
        <div className="space-y-2">
          <div
            className={`flex items-center justify-center gap-3.5 py-2 ${
              shake ? 'animate-bounce text-rose-500' : ''
            }`}
          >
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const filled = idx < enteredPin.length;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    filled
                      ? 'bg-gradient-to-r from-amber-400 to-emerald-400 scale-125 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'bg-slate-900 border border-white/15'
                  }`}
                />
              );
            })}
          </div>

          {errorMsg ? (
            <p className="text-xs text-rose-400 font-bold flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 font-medium">4 to 6 digit security PIN</p>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-850 active:scale-95 border border-white/10 hover:border-amber-400/40 text-xl font-black text-white flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(0,0,0,0.4)]"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-900/50 hover:bg-slate-800 text-xs font-black text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-all border border-white/5"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-850 active:scale-95 border border-white/10 hover:border-amber-400/40 text-xl font-black text-white flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(0,0,0,0.4)]"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-all border border-white/5"
            aria-label="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {enteredPin.length >= 4 && (
          <button
            type="button"
            onClick={handleManualSubmit}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all active:scale-95 border border-amber-400/40"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Unlock Z.Z KHATA</span>
          </button>
        )}
      </div>
    </div>
  );
}
