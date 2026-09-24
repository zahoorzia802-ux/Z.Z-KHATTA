import React, { useState } from 'react';
import { Camera, Folder, Bell, X, Settings2, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { PermissionType, PermissionStateResult } from '../utils/permissionManager';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissionType: PermissionType;
  status: PermissionStateResult;
  onRetry: () => void;
}

export function PermissionModal({
  isOpen,
  onClose,
  permissionType,
  status,
  onRetry,
}: PermissionModalProps) {
  const [showSettingsGuide, setShowSettingsGuide] = useState(false);

  if (!isOpen) return null;

  const isPermanent = status === 'permanently_denied';

  const details = {
    camera: {
      title: 'Camera Permission Needed',
      icon: Camera,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      description:
        'Z.Z KHATA uses your device camera solely to photograph physical receipts, invoices, and vouchers when saving a transaction entry.',
      whyNeeded: 'This allows you to attach receipt proofs to customer ledgers.',
    },
    files: {
      title: 'Photos & Files Permission Needed',
      icon: Folder,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      description:
        'Z.Z KHATA needs access to your gallery or files to attach existing bill photos to this transaction.',
      whyNeeded: 'Allows selecting receipt images already stored on your phone.',
    },
    notifications: {
      title: 'Reminder Alerts Permission',
      icon: Bell,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      description:
        'Z.Z KHATA uses notifications to alert you when a customer payment or due date reminder is scheduled.',
      whyNeeded: 'Ensures you never miss a pending balance or payment collection.',
    },
  }[permissionType];

  const Icon = details.icon;

  const handleOpenSettings = () => {
    setShowSettingsGuide(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/15 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* VIP Header Banner */}
        <div className="p-5 text-center relative bg-gradient-to-b from-slate-950 to-slate-900 border-b border-white/10">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors border border-white/10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div
            className={`w-14 h-14 rounded-2xl ${details.bgColor} border ${details.borderColor} flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(0,0,0,0.5)]`}
          >
            <Icon className={`w-7 h-7 ${details.iconColor}`} />
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            DEVICE PERMISSION
          </span>

          <h2 className="text-base font-black text-white">{details.title}</h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed px-2">
            {details.description}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5">
          {/* Status Message */}
          <div
            className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
              isPermanent
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {isPermanent
                  ? 'Permission blocked in device settings'
                  : 'Permission was not granted'}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                The app will continue working normally. This permission is needed only when using this specific feature.
              </p>
            </div>
          </div>

          {/* Settings Guide for Permanent Denials */}
          {showSettingsGuide && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 text-xs space-y-2 animate-in fade-in">
              <p className="font-bold text-slate-200 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                <span>How to enable in Android / Chrome:</span>
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                <li>Tap the 🔒 <strong>Lock icon</strong> or ⚙️ <strong>Site Settings</strong> in the top address bar.</li>
                <li>Find <strong>Permissions</strong> (Camera, Files, or Notifications).</li>
                <li>Tap <strong>Reset</strong> or toggle to <strong>Allow</strong>.</li>
                <li>Return here and tap <strong>Try Again</strong>.</li>
              </ol>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {isPermanent ? (
              <button
                type="button"
                onClick={handleOpenSettings}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95 border border-amber-300/40"
              >
                <Settings2 className="w-4 h-4" />
                <span>Open Settings Guide</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRetry();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 border border-emerald-400/40"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-bold text-xs transition-colors border border-white/10"
            >
              Continue Without Permission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
