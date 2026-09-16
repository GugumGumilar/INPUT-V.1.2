import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Copy, Check, X, ShieldCheck } from 'lucide-react';
import { ShiftType } from '../types';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportText: string;
  shift: ShiftType;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  onClose,
  reportText,
  shift
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = reportText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWA = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(reportText)}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100 font-mono">
                  Format Laporan WhatsApp Resmi
                </span>
                <h3 className="text-base font-extrabold flex items-center gap-2 text-white">
                  <span>Monitoring Shift {shift}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-bold">
                    Lengkap 100%
                  </span>
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 bg-emerald-50/70 border border-emerald-100/80 px-3.5 py-2 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Format disesuaikan dengan standar pantauan Posko VVIP</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase font-mono">
                Gardu D126 & Rumdin
              </span>
            </div>

            {/* Scrollable preview */}
            <div className="relative">
              <pre className="w-full bg-slate-900 text-emerald-300 font-mono text-[11px] sm:text-xs p-4 rounded-2xl overflow-x-auto max-h-[50vh] overflow-y-auto leading-relaxed whitespace-pre-wrap select-all border border-slate-800 shadow-inner">
                {reportText}
              </pre>
            </div>
          </div>

          {/* Footer Action buttons */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Teks Berhasil Disalin!' : 'Salin Teks Laporan'}</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSendWA}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Langsung ke WhatsApp</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
