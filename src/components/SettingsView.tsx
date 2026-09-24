import React, { useState } from 'react';
import {
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Moon,
  Sun,
  Laptop,
  Globe,
  Lock,
  Unlock,
  KeyRound,
  Download,
  Upload,
  Trash2,
  Check,
  AlertCircle,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Info,
  Crown,
  Cloud,
  Smartphone,
  WifiOff,
  Database,
  Bell,
} from 'lucide-react';
import { useKhata } from '../context/KhataContext';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../utils/translations';
import { verifyPin } from '../utils/security';
import { ConfirmDialog } from './ConfirmDialog';
import { SyncBadge } from './SyncBadge';

export function SettingsView() {
  const {
    profile,
    updateProfile,
    settings,
    setThemeMode,
    setLanguage,
    setPinLock,
    disablePinLock,
    lockApp,
    exportBackup,
    importBackup,
    clearAllData,
  } = useKhata();

  const { currentUser, signOut, deleteAccount, triggerSync } = useAuth();
  const t = getTranslation(settings.language);

  // Profile Form State
  const [shopName, setShopName] = useState(profile.shopName || '');
  const [ownerName, setOwnerName] = useState(profile.ownerName || '');
  const [shopPhone, setShopPhone] = useState(profile.phone || '');
  const [shopEmail, setShopEmail] = useState(profile.email || currentUser?.email || '');
  const [shopAddress, setShopAddress] = useState(profile.address || '');
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  // App Lock PIN Management State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinMode, setPinMode] = useState<'ENABLE' | 'CHANGE' | 'DISABLE'>('ENABLE');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Dialog states
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);

  // Backup & Restore State
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      shopName: shopName.trim() || 'Z.Z KHATA',
      ownerName: ownerName.trim(),
      phone: shopPhone.trim(),
      email: shopEmail.trim(),
      address: shopAddress.trim(),
    });
    setProfileSavedFeedback(true);
    setTimeout(() => setProfileSavedFeedback(false), 3000);
  };

  const handleOpenPinModal = (mode: 'ENABLE' | 'CHANGE' | 'DISABLE') => {
    setPinMode(mode);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinError('');
    setPinSuccess('');
    setIsPinModalOpen(true);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (pinMode === 'DISABLE') {
      if (!currentPinInput) {
        setPinError('Please enter your current PIN');
        return;
      }
      const ok = disablePinLock(currentPinInput);
      if (ok) {
        setPinSuccess('PIN Lock has been disabled.');
        setTimeout(() => setIsPinModalOpen(false), 1500);
      } else {
        setPinError('Incorrect current PIN! Please try again.');
      }
      return;
    }

    if (pinMode === 'CHANGE') {
      if (!verifyPin(currentPinInput, settings.pinHash)) {
        setPinError('Incorrect current PIN! Please try again.');
        return;
      }
    }

    if (newPinInput.length < 4 || newPinInput.length > 6) {
      setPinError('PIN must be 4 to 6 digits long.');
      return;
    }

    if (!/^\d+$/.test(newPinInput)) {
      setPinError('PIN must contain only numbers (0-9).');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinError(t.pinMismatch);
      return;
    }

    setPinLock(newPinInput);
    setPinSuccess(pinMode === 'CHANGE' ? 'PIN changed successfully!' : 'PIN Lock enabled successfully!');
    setTimeout(() => setIsPinModalOpen(false), 1500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingRestoreFile(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreFile) return;
    const result = await importBackup(pendingRestoreFile);
    if (result.success) {
      setImportStatus({ type: 'success', message: result.message });
    } else {
      setImportStatus({ type: 'error', message: result.message });
    }
    setPendingRestoreFile(null);
    setTimeout(() => setImportStatus(null), 5000);
  };

  const handleConfirmClearData = () => {
    clearAllData();
    setShowClearDataConfirm(false);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
  };

  const handleConfirmDeleteAccount = async () => {
    setShowDeleteAccountConfirm(false);
    await deleteAccount();
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-slate-950 text-slate-100 transition-colors">
      {/* Sticky VIP Header */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-2xl border-b border-white/10 px-5 pt-4 pb-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-between gap-3">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest text-amber-300 uppercase bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>VIP PRO</span>
            </span>
            <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/50 border border-emerald-500/25 px-2 py-0.5 rounded-full">
              Z.Z KHATA
            </span>
            <SyncBadge />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            {t.navSettings}
          </h1>
          <p className="text-xs text-slate-400">
            Account, Backup & Preferences
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4 max-w-2xl mx-auto w-full">
        {/* ============================================================
            1. AUTHENTICATED USER & CLOUD ACCOUNT CARD
            ============================================================ */}
        {currentUser && (
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-xl p-5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-600 to-teal-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'Z'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-base font-black text-white truncate">
                      {currentUser.displayName || 'Khata User'}
                    </h2>
                    {currentUser.provider === 'google' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-950/80 text-blue-400 border border-blue-900">
                        Google Account
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {/* Log Out button */}
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="py-2 px-3 rounded-xl border border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>LOG OUT</span>
              </button>
            </div>

            {/* Cloud Sync info bar */}
            <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">☁️ Partition:</span>
                <span>Isolated & Secure</span>
              </div>
              <button
                type="button"
                onClick={triggerSync}
                className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync Now</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            2. PROFILE (SHOP / BUSINESS DETAILS)
            ============================================================ */}
        <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl p-5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-black text-white">
                  👤 {t.profileTitle}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Visible on Home, statements, and WhatsApp messages
                </p>
              </div>
            </div>
            {profileSavedFeedback && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.shopNameLabel}</span>
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Z.Z General Store"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.ownerNameLabel}</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Zahoor Zia"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.shopPhoneLabel}</span>
              </label>
              <input
                type="tel"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={shopEmail}
                onChange={(e) => setShopEmail(e.target.value)}
                placeholder="shop@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.shopAddressLabel}</span>
              </label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="e.g. Main Bazar, Lahore"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 active:scale-95 text-slate-950 text-xs font-black rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all border border-amber-400/40"
            >
              {t.saveProfile}
            </button>
          </form>
        </div>

        {/* ============================================================
            3. APP LOCK
            ============================================================ */}
        <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl p-5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-black text-white">
                  🔐 {t.appLockTitle}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Secure khata entries with a 4 to 6 digit security code
                </p>
              </div>
            </div>
            {settings.pinLockEnabled ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                ACTIVE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-400 border border-white/10">
                OFF
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-white/5 space-y-2">
            {!settings.pinLockEnabled ? (
              <button
                type="button"
                onClick={() => handleOpenPinModal('ENABLE')}
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:from-emerald-500 hover:to-teal-500 transition-colors shadow-md"
              >
                <Lock className="w-4 h-4" />
                <span>{t.enablePin}</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={lockApp}
                  className="py-2 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lock Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPinModal('CHANGE')}
                  className="py-2 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t.changePin}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPinModal('DISABLE')}
                  className="py-2 px-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-rose-500/40"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{t.disablePin}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            4. LANGUAGE
            ============================================================ */}
        <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl p-5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-black text-white">
                🌐 {t.languageTitle}
              </h2>
              <p className="text-[11px] text-slate-400">
                Select your preferred app language
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setLanguage('english')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                settings.language === 'english'
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-black shadow-md border-amber-400/40'
                  : 'bg-slate-950 text-slate-300 border-white/10 hover:border-white/20'
              }`}
            >
              <span>English (Default)</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('urdu')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all font-urdu ${
                settings.language === 'urdu'
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-black shadow-md border-amber-400/40'
                  : 'bg-slate-950 text-slate-300 border-white/10 hover:border-white/20'
              }`}
            >
              <span>اردو (Urdu)</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            5. DARK MODE & THEME
            ============================================================ */}
        <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl p-5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-black text-white">
                🌙 {t.darkModeTitle}
              </h2>
              <p className="text-[11px] text-slate-400">
                Choose light, dark, or system appearance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                settings.themeMode === 'light'
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-black shadow-md'
                  : 'bg-slate-950 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>{t.modeLight}</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                settings.themeMode === 'dark'
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-black shadow-md'
                  : 'bg-slate-950 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{t.modeDark}</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode('system')}
              className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                settings.themeMode === 'system'
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-black shadow-md'
                  : 'bg-slate-950 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>{t.modeSystem}</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            6. BACKUP & RESTORE
            ============================================================ */}
        <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl p-5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-black text-white">
                ☁️ {t.backupTitle}
              </h2>
              <p className="text-[11px] text-slate-400">
                Manual export and restore file option
              </p>
            </div>
          </div>

          {importStatus && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                importStatus.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
              }`}
            >
              {importStatus.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={exportBackup}
              className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.backupBtn}</span>
            </button>

            <label className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-white/10">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.restoreBtn}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* ============================================================
            6.5 ANDROID OFFLINE ARCHITECTURE & RELEASE APK
            ============================================================ */}
        <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl p-5 border border-amber-500/25 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-black text-white">
                  📱 Android Offline App (Release APK)
                </h2>
                <p className="text-[11px] text-slate-400">
                  Full standalone Android architecture & offline database
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Offline First
            </span>
          </div>

          {/* Architecture Status Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Database className="w-3.5 h-3.5" />
                <span>Local DB Active</span>
              </div>
              <p className="text-[10px] text-slate-400">
                IndexedDB / SQLite storage saves all Mila/Diya and photos locally on phone.
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Bell className="w-3.5 h-3.5" />
                <span>Offline Alarms</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Reminders trigger notifications & vibrations even without internet.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Target Platform: Android 7.0 - 14.0+ (API 24 - 34)
              </span>
              <span className="text-[10px] font-mono text-emerald-400">ARM64 & x86_64</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Configured for release APK building with on-demand camera & file permissions, offline caching, and high-performance hardware acceleration.
            </p>
          </div>

          {/* Download Android Studio / APK Build Project */}
          <a
            href="/downloads/ZZ_KHATA_Android_Release_Project.zip"
            download="ZZ_KHATA_Android_Release_Project.zip"
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:from-amber-400 hover:to-emerald-500 active:scale-[0.98] text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg group"
          >
            <Download className="w-4 h-4 text-slate-950 group-hover:translate-y-0.5 transition-transform" />
            <span>DOWNLOAD ANDROID RELEASE PROJECT (ZIP)</span>
          </a>

          <div className="text-[10px] text-slate-500 font-mono bg-slate-950/90 p-2.5 rounded-xl border border-white/5 text-center">
            Build Command: <span className="text-amber-300">./gradlew assembleRelease</span> → <span className="text-emerald-400">app-release.apk</span>
          </div>
        </div>

        {/* ============================================================
            7. ABOUT
            ============================================================ */}
        <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl p-5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-2 text-center">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-white">
            ℹ️ {t.aboutTitle}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {t.aboutText}
          </p>
          <p className="text-[11px] font-mono text-slate-500 pt-1">
            {t.version} • VIP PRO Edition
          </p>
        </div>

        {/* ============================================================
            8. LOG OUT & DANGER ZONE
            ============================================================ */}
        <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl p-5 border border-rose-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-400" />
            <div>
              <h2 className="text-sm font-black text-white">
                🚪 Account & Data Management
              </h2>
              <p className="text-[11px] text-slate-400">
                Log out, clear data records, or permanently delete account
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            {/* LOG OUT BUTTON */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>LOG OUT</span>
            </button>

            {/* Clear All Customer Data */}
            <button
              type="button"
              onClick={() => setShowClearDataConfirm(true)}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Clear All Khata Records (Reset)</span>
            </button>

            {/* DELETE ACCOUNT */}
            <button
              type="button"
              onClick={() => setShowDeleteAccountConfirm(true)}
              className="w-full py-2.5 px-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-black flex items-center justify-center gap-1.5 transition-colors border border-rose-500/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>DELETE ACCOUNT</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOGS */}
      {/* 1. Log Out Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log Out of Z.Z KHATA"
        message="Are you sure you want to log out? Your cloud data remains safely saved in your account."
        confirmText="LOG OUT"
        cancelText="CANCEL"
        isDestructive={false}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* 2. Delete Account Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteAccountConfirm}
        title="Delete Account"
        message="Delete your account and all cloud data permanently?"
        confirmText="DELETE ACCOUNT"
        cancelText="CANCEL"
        isDestructive={true}
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setShowDeleteAccountConfirm(false)}
      />

      {/* 3. Clear All Khata Records Confirmation */}
      <ConfirmDialog
        isOpen={showClearDataConfirm}
        title="Clear All Khata Records"
        message="Are you sure you want to delete all customers and all khata transactions? This action cannot be undone."
        confirmText="CLEAR ALL"
        cancelText="CANCEL"
        isDestructive={true}
        onConfirm={handleConfirmClearData}
        onCancel={() => setShowClearDataConfirm(false)}
      />

      {/* 4. Restore File Confirmation */}
      <ConfirmDialog
        isOpen={!!pendingRestoreFile}
        title="Restore Backup"
        message={`Restoring will import customers and transactions from "${pendingRestoreFile?.name}". Do you want to proceed?`}
        confirmText="RESTORE"
        cancelText="CANCEL"
        isDestructive={false}
        onConfirm={handleConfirmRestore}
        onCancel={() => setPendingRestoreFile(null)}
      />

      {/* PIN Setup / Change Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl w-full max-w-xs p-5 shadow-2xl border border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">
                {pinMode === 'ENABLE' ? t.enablePin : pinMode === 'CHANGE' ? t.changePin : t.disablePin}
              </h3>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-2xl bg-rose-950/80 text-rose-300 text-xs flex items-center gap-1.5 border border-rose-500/40">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {pinSuccess && (
              <div className="p-2.5 rounded-2xl bg-emerald-950/80 text-emerald-300 text-xs flex items-center gap-1.5 border border-emerald-500/40">
                <Check className="w-4 h-4 shrink-0" />
                <span>{pinSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePinSubmit} className="space-y-3">
              {(pinMode === 'CHANGE' || pinMode === 'DISABLE') && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Current PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    inputMode="numeric"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    placeholder="Enter current PIN"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                </div>
              )}

              {pinMode !== 'DISABLE' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      {t.setNewPin}
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      inputMode="numeric"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      placeholder="4 to 6 digits"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      {t.confirmNewPin}
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      inputMode="numeric"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value)}
                      placeholder="Repeat new PIN"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      required
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-2xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 text-xs font-black shadow-md transition-all active:scale-95"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
