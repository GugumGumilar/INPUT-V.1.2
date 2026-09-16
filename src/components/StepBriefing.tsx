import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Send, 
  Users, 
  Building2, 
  Home, 
  Clock, 
  Copy, 
  Check, 
  Sparkles, 
  CalendarDays 
} from 'lucide-react';
import { DATA_PETUGAS_BRIEFING } from '../data/constants';

interface StepBriefingProps {
  onBack: () => void;
  onShowAlert: (msg: string, icon?: string) => void;
}

export const StepBriefing: React.FC<StepBriefingProps> = ({ onBack, onShowAlert }) => {
  const [hari, setHari] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>('');
  const [shift, setShift] = useState<string>('');

  const [istana1, setIstana1] = useState<string>('');
  const [istana2, setIstana2] = useState<string>('');
  const [rumdin1, setRumdin1] = useState<string>('');
  const [rumdin2, setRumdin2] = useState<string>('');

  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const now = new Date();
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const currentDay = days[now.getDay()];
    const currentDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    const hours = now.getHours();
    const currentShift = (hours >= 7 && hours < 14) ? "Pagi" : (hours >= 14 && hours < 21) ? "Siang" : "Malam";

    setHari(currentDay);
    setTanggal(currentDate);
    setShift(currentShift);

    // Pre-select first 2 for Istana and next 2 for Rumdin as smart defaults if available
    if (DATA_PETUGAS_BRIEFING.length >= 4) {
      setIstana1(`${DATA_PETUGAS_BRIEFING[0].nama}|${DATA_PETUGAS_BRIEFING[0].hp}`);
      setIstana2(`${DATA_PETUGAS_BRIEFING[1].nama}|${DATA_PETUGAS_BRIEFING[1].hp}`);
      setRumdin1(`${DATA_PETUGAS_BRIEFING[2].nama}|${DATA_PETUGAS_BRIEFING[2].hp}`);
      setRumdin2(`${DATA_PETUGAS_BRIEFING[3].nama}|${DATA_PETUGAS_BRIEFING[3].hp}`);
    }
  }, []);

  const formatBaris = (val: string) => {
    if (!val) return "[ Belum Dipilih ]";
    const parts = val.split("|");
    return `${parts[0]} / ${parts[1] || ''}`;
  };

  const generateWhatsAppText = () => {
    return `*LAPORAN PETUGAS PIKET*
*POSKO ISTANA WAKIL PRESIDEN DAN RUMAH DINAS WAKIL PRESIDEN / VVIP*
==============================

*Hari* : ${hari}
*Tanggal* : ${tanggal}
*Shift* : ${shift}

*Istana Wakil Presiden* :
1. ${formatBaris(istana1)}
2. ${formatBaris(istana2)}

*Rumah Dinas Wakil Presiden dan VVIP* :
1. ${formatBaris(rumdin1)}
2. ${formatBaris(rumdin2)}

==============================
*FOKUS BEKERJA*

*Semoga Jaringan Aman dan Handal*
*Amiiin* 🤲`;
  };

  const previewText = generateWhatsAppText();

  const handleCopy = () => {
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKirimWA = () => {
    if (!istana1 || !istana2 || !rumdin1 || !rumdin2) {
      onShowAlert('Mohon lengkapi pilihan petugas untuk Istana dan Rumah Dinas terlebih dahulu!', '⚠️');
      return;
    }
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(previewText)}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -15 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="space-y-5"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Shift Briefing Petugas Piket
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Konfigurasi pembagian penugasan personel jaga
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Format Resmi WhatsApp</span>
        </div>
      </div>

      {/* Real-time Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50 to-blue-50 border border-sky-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-sky-600" />
          <span>Hari & Tanggal: <strong className="text-slate-900 font-bold">{hari}, {tanggal}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600" />
          <span>Shift Terdeteksi: <strong className="text-sky-700 font-bold uppercase">{shift}</strong></span>
        </div>
      </div>

      {/* Grid: Istana vs Rumdin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Istana Wapres Panel */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-sky-800">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-sky-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Istana Wakil Presiden</h3>
              <span className="text-[11px] text-slate-500 font-medium">Pilih 2 Personel Piket</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Petugas 1:
              </label>
              <select
                value={istana1}
                onChange={(e) => setIstana1(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none transition-all"
              >
                <option value="">-- Pilih Nama Petugas --</option>
                {DATA_PETUGAS_BRIEFING.map((p) => (
                  <option key={'istana1_' + p.nama} value={`${p.nama}|${p.hp}`}>
                    {p.nama} ({p.hp})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Petugas 2:
              </label>
              <select
                value={istana2}
                onChange={(e) => setIstana2(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none transition-all"
              >
                <option value="">-- Pilih Nama Petugas --</option>
                {DATA_PETUGAS_BRIEFING.map((p) => (
                  <option key={'istana2_' + p.nama} value={`${p.nama}|${p.hp}`}>
                    {p.nama} ({p.hp})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Rumdin Wapres Panel */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-teal-800">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Home className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Rumah Dinas Wapres & VVIP</h3>
              <span className="text-[11px] text-slate-500 font-medium">Pilih 2 Personel Piket</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Petugas 1:
              </label>
              <select
                value={rumdin1}
                onChange={(e) => setRumdin1(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-teal-500 focus:bg-white focus:outline-none transition-all"
              >
                <option value="">-- Pilih Nama Petugas --</option>
                {DATA_PETUGAS_BRIEFING.map((p) => (
                  <option key={'rumdin1_' + p.nama} value={`${p.nama}|${p.hp}`}>
                    {p.nama} ({p.hp})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Petugas 2:
              </label>
              <select
                value={rumdin2}
                onChange={(e) => setRumdin2(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-teal-500 focus:bg-white focus:outline-none transition-all"
              >
                <option value="">-- Pilih Nama Petugas --</option>
                {DATA_PETUGAS_BRIEFING.map((p) => (
                  <option key={'rumdin2_' + p.nama} value={`${p.nama}|${p.hp}`}>
                    {p.nama} ({p.hp})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Preview Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Preview Pesan WhatsApp
          </label>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 font-semibold transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Teks</span>
              </>
            )}
          </button>
        </div>

        <textarea
          value={previewText}
          readOnly
          rows={10}
          className="w-full font-mono text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none leading-relaxed resize-none selection:bg-sky-200"
        />

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.95, rotate: -0.5 }}
            onClick={handleKirimWA}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cartoon-pulse"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Briefing ke WhatsApp</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
          >
            Kembali ke Menu
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
