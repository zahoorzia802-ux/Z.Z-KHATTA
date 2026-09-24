import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'DELETE',
  cancelText = 'CANCEL',
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div
        className="w-full max-w-sm bg-slate-900 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/15 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 text-center">
          <div
            className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3.5 border shadow-inner ${
              isDestructive
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-amber-950/80 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
            }`}
          >
            {isDestructive ? (
              <Trash2 className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>

          <h3 className="text-base font-black text-white mb-2">
            {title}
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line px-2">
            {message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 bg-slate-950 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 px-4 rounded-xl border border-white/10 bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 active:scale-95 transition-all"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-black shadow-md active:scale-95 transition-all ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-black shadow-amber-500/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
