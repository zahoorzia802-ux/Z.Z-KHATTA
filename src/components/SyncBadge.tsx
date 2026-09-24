import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SyncBadge() {
  const { syncStatus, triggerSync, isOffline, lastSyncedAt } = useAuth();

  if (syncStatus === 'syncing') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold animate-pulse shadow-sm">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (syncStatus === 'offline' || isOffline) {
    return (
      <div
        onClick={triggerSync}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs font-semibold cursor-pointer hover:bg-amber-900/50 transition-colors shadow-sm"
        title="Offline Mode: All customer entries and balances are saved safely on your device (IndexedDB)."
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
        <WifiOff className="w-3 h-3 text-amber-400" />
        <span>Offline Mode</span>
      </div>
    );
  }

  if (syncStatus === 'error') {
    return (
      <button
        type="button"
        onClick={triggerSync}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer hover:bg-rose-900/50 transition-colors active:scale-95 shadow-sm"
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        <span>Offline Saved</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={triggerSync}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all active:scale-95 shadow-sm"
      title={`Online & Synced. Last sync: ${lastSyncedAt ? lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}`}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
      <Wifi className="w-3 h-3 text-emerald-400" />
      <span className="text-slate-200">Online</span>
    </button>
  );
}
