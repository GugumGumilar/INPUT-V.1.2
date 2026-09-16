import React from 'react';
import { motion } from 'motion/react';
import { Sun, CloudSun, Moon, ClipboardCheck, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { ShiftType } from '../types';

interface StepHomeProps {
  onSelectShift: (shift: ShiftType) => void;
  onOpenBriefing: () => void;
  completedStats: { ok: number; total: number };
}

export const StepHome: React.FC<StepHomeProps> = ({
  onSelectShift,
  onOpenBriefing,
  completedStats
}) => {
  const shifts: Array<{
    id: ShiftType;
    title: string;
    hours: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    textColor: string;
    badgeColor: string;
    bgGradient: string;
    borderHover: string;
  }> = [
    {
      id: 'PAGI',
      title: 'Shift Pagi',
      hours: '07:00 — 15:00 WIB',
      icon: Sun,
      accentColor: 'from-amber-400 to-amber-500',
      textColor: 'text-amber-700',
      badgeColor: 'bg-amber-100 text-amber-800',
      bgGradient: 'hover:bg-gradient-to-br hover:from-amber-50/50 hover:to-orange-50/50',
      borderHover: 'hover:border-amber-300'
    },
    {
      id: 'SIANG',
      title: 'Shift Siang',
      hours: '15:00 — 23:00 WIB',
      icon: CloudSun,
      accentColor: 'from-sky-400 to-blue-500',
      textColor: 'text-sky-700',
      badgeColor: 'bg-sky-100 text-sky-800',
      bgGradient: 'hover:bg-gradient-to-br hover:from-sky-50/50 hover:to-blue-50/50',
      borderHover: 'hover:border-sky-300'
    },
    {
      id: 'MALAM',
      title: 'Shift Malam',
      hours: '23:00 — 07:00 WIB',
      icon: Moon,
      accentColor: 'from-indigo-500 to-slate-800',
      textColor: 'text-indigo-700',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      bgGradient: 'hover:bg-gradient-to-br hover:from-indigo-50/50 hover:to-slate-50/50',
      borderHover: 'hover:border-indigo-300'
    }
  ];

  return (
    <div className="space-y-5">
      {/* Featured Feature Card: Shift Briefing */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white p-6 shadow-xl shadow-emerald-900/10"
      >
        {/* Decorative background glow circles */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -top-6 w-28 h-28 bg-teal-300/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/40 text-emerald-100 text-[11px] font-bold tracking-wide uppercase border border-emerald-300/20">
              <Sparkles className="w-3 h-3 text-emerald-200" />
              <span>Fitur Baru Petugas Piket</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-300" />
              Shift Briefing Posko
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm font-medium leading-relaxed">
              Pilih personel jaga Istana & Rumah Dinas Wapres, generate otomatis format laporan WhatsApp siap kirim.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94, rotate: -1 }}
            onClick={onOpenBriefing}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-emerald-800 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group whitespace-nowrap"
          >
            <span>Buka Shift Briefing</span>
            <ArrowRight className="w-4 h-4 text-emerald-600 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>
      </motion.div>

      {/* Section Title: Shift Selection */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Pilih Shift Kerja
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Akses monitoring & inspeksi unit catu daya sesuai jadwal
            </p>
          </div>
          {completedStats.total > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>{completedStats.ok}/{completedStats.total} Unit Terpantau</span>
            </div>
          )}
        </div>

        {/* Shift Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {shifts.map((shift, idx) => {
            const Icon = shift.icon;
            return (
              <motion.button
                key={shift.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 24,
                  delay: idx * 0.08
                }}
                whileHover={{
                  scale: 1.03,
                  y: -3,
                  transition: { type: 'spring', stiffness: 400, damping: 15 }
                }}
                whileTap={{
                  scale: 0.95,
                  rotate: idx === 1 ? 0.5 : idx === 2 ? -0.5 : 0
                }}
                onClick={() => onSelectShift(shift.id)}
                className={`group relative text-left p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm transition-all ${shift.bgGradient} ${shift.borderHover}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${shift.accentColor} flex items-center justify-center text-white shadow-md shadow-slate-200 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${shift.badgeColor}`}>
                    {shift.id}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {shift.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {shift.hours}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 group-hover:text-sky-600 transition-colors">
                  <span>Masuk Shift</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
