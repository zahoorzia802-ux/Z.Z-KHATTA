import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Check,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  KeyRound,
  Crown,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginView() {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    continueOffline,
    savedAccounts,
  } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');

  // Google account picker modal state
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Google Sign-In handler
  const handleGoogleSignIn = async (email?: string, name?: string) => {
    clearMessages();
    setIsLoading(true);
    try {
      await signInWithGoogle(email, name);
      setShowGooglePicker(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password Login handler
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithEmail(loginEmail.trim(), loginPassword);
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create Account handler
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match. Please recheck.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUpWithEmail({
        fullName: fullName.trim(),
        phone: phoneNumber.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to create account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendPasswordReset(forgotEmail.trim());
      if (result.success) {
        setSuccessMessage('Password reset link sent to your email. Check inbox & spam folder.');
        setTimeout(() => {
          setMode('LOGIN');
          clearMessages();
        }, 4000);
      } else {
        setErrorMessage(result.error || 'Failed to send password reset email.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-hidden select-none">
      {/* Luxury Ambient Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-sm relative z-10 space-y-5">
        {/* VIP Top Branding */}
        <div className="text-center space-y-2">
          {/* Logo / Crown Avatar */}
          <div className="relative inline-block">
            <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-amber-500 via-emerald-600 to-teal-400 p-[1px] shadow-[0_0_35px_rgba(245,158,11,0.3)] mx-auto">
              <div className="w-full h-full bg-slate-950 rounded-[23px] flex items-center justify-center">
                <Crown className="w-9 h-9 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black tracking-widest shadow-md">
              PRO
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mt-1">
              <span className="bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                Z.Z KHATA
              </span>
            </h1>
            <p className="text-[11px] font-black tracking-widest uppercase text-amber-400 mt-0.5">
              YOUR DIGITAL CUSTOMER KHATA
            </p>
          </div>
        </div>

        {/* VIP Glassmorphic Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.7)] space-y-5 relative">
          {/* Subtle Top Ambient Gold Line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ============================================================
              ⚡ OFFLINE MODE (CORE FEATURE - NO INTERNET OR LOGIN REQUIRED)
              ============================================================ */}
          <button
            type="button"
            onClick={continueOffline}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 active:scale-[0.98] border border-amber-500/40 rounded-2xl text-amber-300 text-xs font-black flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md group"
          >
            <WifiOff className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="tracking-wide">CONTINUE IN OFFLINE MODE (NO LOGIN)</span>
          </button>

          {/* ============================================================
              🔵 CONTINUE WITH GOOGLE BUTTON (PRIMARY HERO ACTION)
              ============================================================ */}
          <button
            type="button"
            onClick={() => setShowGooglePicker(true)}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-slate-900/95 hover:bg-slate-850 active:scale-[0.98] border border-white/15 hover:border-amber-400/50 rounded-2xl text-white text-xs font-black flex items-center justify-center gap-3 transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.4)] group relative overflow-hidden"
          >
            {/* Ambient hover glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-amber-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Authentic Google "G" Icon */}
            <svg className="w-4 h-4 shrink-0 relative z-10" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="tracking-wide relative z-10">CONTINUE WITH GOOGLE</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] font-black uppercase text-slate-400 absolute tracking-widest">
              OR LOGIN WITH EMAIL
            </span>
          </div>

          {/* Tab Switcher: SIGN IN / CREATE ACCOUNT */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                clearMessages();
              }}
              className={`flex-1 py-2 text-center rounded-xl font-bold transition-all ${
                mode === 'LOGIN'
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('SIGNUP');
                clearMessages();
              }}
              className={`flex-1 py-2 text-center rounded-xl font-bold transition-all ${
                mode === 'SIGNUP'
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* ============================================================
              TAB 1: SIGN IN
              ============================================================ */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('FORGOT');
                      clearMessages();
                    }}
                    className="text-[11px] text-amber-400 hover:underline font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white text-xs font-black rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 border border-emerald-400/30"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>SIGN IN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============================================================
              TAB 2: CREATE ACCOUNT
              ============================================================ */}
          {mode === 'SIGNUP' && (
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Zahoor Zia"
                    required
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="03001234567"
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 active:scale-95 text-slate-950 text-xs font-black rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 border border-amber-400/40"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>CREATE ACCOUNT</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============================================================
              TAB 3: FORGOT PASSWORD
              ============================================================ */}
          {mode === 'FORGOT' && (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white">Reset Password</h3>
                <p className="text-[11px] text-slate-400">
                  Enter your registered email address and we'll send you a password reset link.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    clearMessages();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-2xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-600 active:scale-95 text-slate-950 text-xs font-black shadow-md transition-all"
                >
                  {isLoading ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Footer Note */}
        <div className="text-center text-[11px] text-slate-500 font-medium">
          🔒 End-to-end encrypted ledger • Isolated Cloud Storage
        </div>
      </div>

      {/* ============================================================
          GOOGLE ACCOUNT SELECTOR MODAL
          ============================================================ */}
      {showGooglePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl p-5 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3 className="font-black text-sm text-white">Choose Google Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGooglePicker(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select your Google Account to sign in to Z.Z KHATA:
            </p>

            {/* List of available Google Accounts */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {/* Primary User Account */}
              <div
                onClick={() => handleGoogleSignIn('zahoorzia802@gmail.com', 'Zahoor Zia')}
                className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-white/10 hover:border-amber-400/40 cursor-pointer flex items-center gap-3 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                  Z
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white truncate">Zahoor Zia</p>
                    <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded-full">
                      Owner
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">zahoorzia802@gmail.com</p>
                </div>
              </div>

              {savedAccounts
                .filter((acc) => acc.email !== 'zahoorzia802@gmail.com')
                .map((acc) => (
                  <div
                    key={acc.email}
                    onClick={() => handleGoogleSignIn(acc.email, acc.name)}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-white/10 hover:border-amber-400/40 cursor-pointer flex items-center gap-3 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                      {acc.name ? acc.name.charAt(0) : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{acc.name || 'Google User'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{acc.email}</p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Custom Google account option */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <p className="text-[11px] font-bold text-slate-300">Or use another Google account:</p>
              <input
                type="email"
                placeholder="name@gmail.com"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
              <input
                type="text"
                placeholder="Your Name (Optional)"
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
              <button
                type="button"
                onClick={() => {
                  if (customGoogleEmail.trim()) {
                    handleGoogleSignIn(customGoogleEmail.trim(), customGoogleName.trim() || undefined);
                  }
                }}
                disabled={!customGoogleEmail.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-emerald-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all"
              >
                Sign In With This Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
