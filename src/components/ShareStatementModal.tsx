import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare, FileDown, Printer, Crown } from 'lucide-react';
import { Customer, Transaction, CustomerBalanceSummary, UserProfile } from '../types/khata';
import { cleanPhoneForWhatsApp, generateKhataStatementText } from '../utils/formatters';
import { generateCustomerPdf } from '../utils/pdfGenerator';

interface ShareStatementModalProps {
  customer: Customer;
  transactions: Transaction[];
  summary: CustomerBalanceSummary;
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareStatementModal({
  customer,
  transactions,
  summary,
  profile,
  isOpen,
  onClose,
}: ShareStatementModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const statementText = generateKhataStatementText(customer, transactions, summary, profile);
  const cleanPhone = cleanPhoneForWhatsApp(customer.phone);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(statementText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(statementText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Copied to clipboard!');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `Z.Z KHATA - ${customer.name}`,
          text: statementText,
        });
      } catch {
        // Ignored or cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handlePdf = () => {
    generateCustomerPdf(customer, transactions, summary, profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in select-none">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/15 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* VIP Header */}
        <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-white/10 relative">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                VIP STATEMENT
              </span>
            </div>
            <h2 className="text-base font-black tracking-tight text-white mt-1">
              Share Khata Statement
            </h2>
            <p className="text-xs text-slate-400">
              Customer: <span className="font-bold text-slate-200">{customer.name}</span>
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

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Statement preview */}
          <div className="relative">
            <textarea
              readOnly
              rows={8}
              value={statementText}
              className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-xs font-mono text-slate-300 focus:outline-none resize-none leading-relaxed select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-3 top-3 py-1 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-white/10 shadow-sm transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all border border-emerald-400/30"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-white/10"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Share / SMS</span>
              </button>

              <button
                type="button"
                onClick={handlePdf}
                className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-white/10"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
