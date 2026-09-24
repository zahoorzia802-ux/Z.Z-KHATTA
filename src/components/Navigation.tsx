import React from 'react';
import { Home, Users, Settings, Sparkles } from 'lucide-react';
import { useKhata } from '../context/KhataContext';
import { getTranslation } from '../utils/translations';

export type TabType = 'home' | 'customers' | 'settings';

interface NavigationProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export function Navigation({ currentTab, onChangeTab }: NavigationProps) {
  const { totalCustomers, settings } = useKhata();
  const t = getTranslation(settings.language);

  const navItems: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'customers', label: t.navCustomers, icon: Users, badge: totalCustomers },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none select-none">
      {/* Floating VIP Glassmorphic Pill */}
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="relative bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-2xl border border-white/10 dark:border-amber-500/20 rounded-3xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_20px_rgba(16,185,129,0.1)] flex items-center justify-around">
          {/* Subtle Ambient Gold/Emerald top highlight */}
          <div className="absolute -top-[1px] left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`relative flex-1 py-2 px-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 active:scale-95 group ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Active Glowing VIP Pill Background */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/30 via-slate-800/80 to-amber-500/20 border border-emerald-500/30 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.25)] animate-in fade-in zoom-in-95 duration-200" />
                )}

                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      isActive
                        ? 'text-emerald-400 stroke-[2.3] scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                        : 'stroke-[1.8] group-hover:scale-105'
                    }`}
                  />

                  {/* Customer Badge with VIP Gold/Emerald Accent */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-3.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black text-[10px] rounded-full min-w-4 text-center leading-none shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`relative text-[11px] tracking-tight mt-1 leading-none font-bold transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                >
                  {item.label}
                </span>

                {/* Micro Gold Dot for Active Tab */}
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
