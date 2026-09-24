import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Download,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Bell,
} from 'lucide-react';
import { Customer, Transaction, UserProfile } from '../types/khata';
import { cleanPhoneForWhatsApp, formatPKR, formatDateFriendly } from '../utils/formatters';
import { generateReminderCardImage } from '../utils/reminderCardGenerator';
import { requestNotificationPermission } from '../utils/permissionManager';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  currentBalance: number;
  profile: UserProfile;
  transaction?: Transaction;
}

export function WhatsAppReminderModal({
  isOpen,
  onClose,
  customer,
  currentBalance,
  profile,
  transaction,
}: WhatsAppReminderModalProps) {
  const shopName = profile.shopName || 'Z.Z KHATA';

  // Default reminder text tailored for either an entry or overall balance
  const defaultMessage = (() => {
    const absBal = formatPKR(currentBalance);
    if (transaction) {
      const isMile = transaction.type === 'AP_KO_MILE';
      return `Assalam-o-Alaikum ${customer.name},\n\n*${shopName}* ki taraf se entry reminder:\n*Entry:* ${
        isMile ? '🟢 AP KO MILE (Payment Received)' : '🔴 AP NE DIYE (Payment Given / Credit)'
      }\n*Amount:* ${formatPKR(transaction.amount)}\n*Date:* ${formatDateFriendly(transaction.date)} ${
        transaction.time || ''
      }\n${transaction.note ? `*Note:* ${transaction.note}\n` : ''}*Current Balance:* ${absBal} (${
        currentBalance > 0 ? 'Ap Ne Lene Hain' : currentBalance < 0 ? 'Advance Jama' : 'Clear'
      })\n\nShukriya!`;
    }

    if (currentBalance > 0) {
      return `Assalam-o-Alaikum ${customer.name}, aap ke ${shopName} account ka current balance ${absBal} hai (Ap Ne Lene Hain). Meharbani farma kar payment ka khayal rakhein. Shukriya.`;
    } else if (currentBalance < 0) {
      return `Assalam-o-Alaikum ${customer.name}, aap ka advance balance ${shopName} par ${absBal} jama hai. Shukriya.`;
    } else {
      return `Assalam-o-Alaikum ${customer.name}, aap ke ${shopName} account ka khata mukammal barabar / clear hai. Shukriya.`;
    }
  })();

  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [cardDataUrl, setCardDataUrl] = useState<string>('');
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMessage(defaultMessage);

    // On-demand notification permission request when activating Reminder
    requestNotificationPermission().catch(() => {});
  }, [isOpen, customer.id, currentBalance, transaction]);

  // Generate reminder card image whenever message or balance changes
  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;
    setGenerating(true);

    const timer = setTimeout(async () => {
      try {
        const { dataUrl, blob } = await generateReminderCardImage({
          customer,
          currentBalance,
          reminderMessage: message,
          profile,
          transaction,
        });
        if (isCurrent) {
          setCardDataUrl(dataUrl);
          setCardBlob(blob);
          setGenerating(false);
        }
      } catch (err) {
        console.error('Failed to generate reminder card image:', err);
        if (isCurrent) setGenerating(false);
      }
    }, 250);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [isOpen, message, customer, currentBalance, profile, transaction]);

  if (!isOpen) return null;

  const cleanPhone = cleanPhoneForWhatsApp(customer.phone);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadCard = () => {
    if (!cardDataUrl) return;
    const a = document.createElement('a');
    a.href = cardDataUrl;
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `ZZ_KHATA_Reminder_${safeName}_${dateStr}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleSendWhatsApp = async () => {
    // Check if navigator.share with files is supported (e.g. mobile Chrome / Safari)
    if (
      cardBlob &&
      typeof navigator !== 'undefined' &&
      'share' in navigator &&
      'canShare' in navigator
    ) {
      try {
        const file = new File([cardBlob], `ZZ_KHATA_Reminder_${customer.name}.jpg`, {
          type: 'image/jpeg',
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${shopName} - Reminder for ${customer.name}`,
            text: message,
            files: [file],
          });
          onClose();
          return;
        }
      } catch (err) {
        // User cancelled or not supported, fall back to wa.me
      }
    }

    // Open WhatsApp Web / App directly with confirmed review message
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-slate-900 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/15 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* VIP Header */}
        <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-white/10 relative">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          <div className="flex items-center gap-3">
            {customer.photo ? (
              <img
                src={customer.photo}
                alt={customer.name}
                className="w-10 h-10 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)] shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  WHATSAPP REMINDER
                </span>
                {transaction?.photo && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    📷 Photo Attached
                  </span>
                )}
              </div>
              <h2 className="text-base font-black tracking-tight text-white mt-0.5">
                {customer.name}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {customer.phone}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Current Balance Alert Badge */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Current Balance</p>
              <p className="text-lg font-black text-white">{formatPKR(currentBalance)}</p>
            </div>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                currentBalance > 0
                  ? 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                  : currentBalance < 0
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-white/10 text-slate-300'
              }`}
            >
              {currentBalance > 0
                ? 'Ap Ne Lene Hain'
                : currentBalance < 0
                ? 'Ap Ne Dene Hain'
                : 'Hisab Barabar'}
            </span>
          </div>

          {/* Editable Reminder Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Review Reminder Message</span>
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter reminder text to send on WhatsApp..."
              className="w-full p-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Reminder Card Preview Image with Watermark */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Khata Card Attachment (with Z.Z KHATA Watermark)</span>
              </label>
              {cardDataUrl && (
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Card</span>
                </button>
              )}
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center min-h-[220px]">
              {generating ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                  <p className="text-xs">Generating Luxury Reminder Card...</p>
                </div>
              ) : cardDataUrl ? (
                <div className="w-full flex flex-col items-center p-2">
                  <img
                    src={cardDataUrl}
                    alt="Reminder Card Preview"
                    className="max-h-[300px] w-auto object-contain rounded-xl shadow-2xl border border-white/10"
                  />
                  <p className="text-[10px] text-slate-500 mt-2 font-medium">
                    ✦ Includes subtle "Z.Z KHATA" watermark at the bottom ✦
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Preview not available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-3 rounded-2xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDownloadCard}
            disabled={!cardDataUrl}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5"
            title="Download Card"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Save Image</span>
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex-[2] py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all active:scale-95 border border-emerald-400/40"
          >
            <Send className="w-4 h-4" />
            <span>Open WhatsApp / Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
