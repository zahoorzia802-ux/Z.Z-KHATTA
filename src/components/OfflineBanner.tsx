import React from 'react';
import { WifiOff, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function OfflineBanner() {
  const { isOffline, syncStatus } = useAuth();

  if (!isOffline && syncStatus !== 'offline') return null;

  return (
    <div className="bg-amber-950/70 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-amber-200">
      <div className="flex items-center gap-2">
        <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-medium">
          Offline Mode Active — Working locally without internet
        </span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-amber-300 font-mono bg-amber-900/60 px-1.5 py-0.5 rounded border border-amber-500/30">
        <Database className="w-2.5 h-2.5" />
        <span>Local DB</span>
      </div>
    </div>
  );
}
