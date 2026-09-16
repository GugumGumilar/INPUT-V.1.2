import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  HelpCircle, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Link2 
} from 'lucide-react';
import { 
  getSpreadsheetUrl, 
  setSpreadsheetUrl, 
  testSpreadsheetConnection, 
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  GOOGLE_APPS_SCRIPT_DOPOST_SNIPPET
} from '../utils/spreadsheetApi';

interface SpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionUpdated: () => void;
}

export const SpreadsheetModal: React.FC<SpreadsheetModalProps> = ({
  isOpen,
  onClose,
  onConnectionUpdated
}) => {
  const [url, setUrl] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedType, setCopiedType] = useState<'snippet' | 'full' | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setUrl(getSpreadsheetUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_DOPOST_SNIPPET);
    setCopiedType('snippet');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopyFullCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedType('full');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestResult({
        success: false,
        message: 'Masukkan URL Web App Google Apps Script terlebih dahulu.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    const res = await testSpreadsheetConnection(url.trim());
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    setSpreadsheetUrl(url.trim());
    onConnectionUpdated();
    onClose();
  };

  const isConfigured = url.trim().startsWith('https://script.google.com/macros/s/');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Koneksi Google Spreadsheet
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Sinkronisasi data inspeksi langsung ke Google Sheets tim
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Status Pill */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
              isConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center gap-2">
                {isConfigured ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>
                  {isConfigured
                    ? 'URL Google Spreadsheet sudah terpasang'
                    : 'Belum terhubung ke Spreadsheet (Data tersimpan di memori HP)'}
                </span>
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>URL Web App Google Apps Script</span>
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500">
                Didapat dari menu <strong>Terapkan (Deploy) &rarr; Aplikasi Web</strong> di Google Spreadsheet Anda.
              </p>
            </div>

            {/* Test Connection Action & Result */}
            <div className="flex flex-wrap items-center gap-2.5">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                disabled={isTesting}
                onClick={handleTestConnection}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-600' : ''}`} />
                <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
              </motion.button>

              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 transition-colors ml-auto"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showGuide ? 'Sembunyikan Panduan' : 'Lihat Cara Pasang (1 Menit)'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs font-medium border flex items-start gap-2 ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Step-by-step Setup Guide */}
            {showGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 text-xs text-slate-700 leading-relaxed"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Hubungkan Script Apps Script Posko Anda:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySnippet}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] shadow-sm transition-all"
                      title="Salin fungsi doPost untuk ditempel ke script yang sudah Anda miliki"
                    >
                      {copiedType === 'snippet' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === 'snippet' ? 'Tersalin!' : 'Salin doPost (Tambahan)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyFullCode}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all"
                      title="Salin seluruh script lengkap (termasuk LAPORAN_CETAK & LAPORAN_CETAK_UPS)"
                    >
                      {copiedType === 'full' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === 'full' ? 'Tersalin!' : 'Salin Script Lengkap'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <p className="font-bold text-slate-800">
                    💡 Anda sudah punya script Google Apps Script di Spreadsheet Posko?
                  </p>
                  <p className="text-slate-600">
                    Cukup klik <strong>"Salin doPost (Tambahan)"</strong> di atas, lalu tempelkan di baris paling bawah Apps Script Anda. Fungsi ini menjadi jembatan agar form web bisa berkomunikasi dengan fungsi <code>simpanDataDinamis</code> dan <code>ambilProgresHarian</code> yang sudah Anda buat!
                  </p>
                </div>

                <ol className="list-decimal pl-4 space-y-2 font-medium">
                  <li>
                    Buka Google Spreadsheet posko Anda di komputer/laptop &rarr; klik <strong>Ekstensi</strong> &rarr; <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Tempelkan kode <strong>doPost</strong> di paling bawah (atau ganti dengan <strong>Script Lengkap</strong>).
                  </li>
                  <li>
                    Klik <strong>Simpan</strong> (ikon disket), lalu klik tombol biru <strong>Terapkan (Deploy)</strong> di kanan atas &rarr; pilih <strong>Kelola penerapan (Manage deployments)</strong> atau <strong>Penerapan baru (New deployment)</strong>.
                  </li>
                  <li>
                    Pilih jenis <strong>Aplikasi Web (Web App)</strong>:
                    <ul className="list-disc pl-4 mt-1 text-slate-600">
                      <li>Jalankan sebagai: <strong>Saya (Me)</strong></li>
                      <li>Siapa yang memiliki akses: <strong className="text-emerald-700">Siapa saja (Anyone)</strong> *(Wajib agar HP petugas bisa kirim data tanpa login)*</li>
                    </ul>
                  </li>
                  <li>
                    Klik <strong>Terapkan</strong>, lalu salin <strong>URL Aplikasi Web</strong> (berakhiran <code>/exec</code>) dan tempelkan ke kotak URL di atas, lalu klik <strong>Uji Koneksi</strong> &rarr; <strong>Simpan Konfigurasi</strong>!
                  </li>
                </ol>
              </motion.div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Batal
              </button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
              >
                Simpan Konfigurasi
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
