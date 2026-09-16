import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Send, 
  Home, 
  Building2, 
  ChevronRight, 
  ArrowLeft, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { LocationType, ShiftType, UnitStatus } from '../types';
import { MASTER_UNITS } from '../data/constants';

interface StepDashboardProps {
  shift: ShiftType;
  dashboardState: Record<string, UnitStatus>;
  onRefresh: () => void;
  isLoading: boolean;
  onMulaiInput: (lokasi: LocationType) => void;
  onMulaiEdit: (unitId: string) => void;
  onGantiShift: () => void;
  onGenerateWA: () => void;
}

export const StepDashboard: React.FC<StepDashboardProps> = ({
  shift,
  dashboardState,
  onRefresh,
  isLoading,
  onMulaiInput,
  onMulaiEdit,
  onGantiShift,
  onGenerateWA
}) => {
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  // Calculate statistics per team
  const rumdinUnits = MASTER_UNITS.filter((u) => u.location === 'RUMDIN');
  const wapresUnits = MASTER_UNITS.filter((u) => u.location === 'WAPRES');

  const rumdinOkCount = rumdinUnits.filter((u) => dashboardState[u.id]?.status === 'OK').length;
  const wapresOkCount = wapresUnits.filter((u) => dashboardState[u.id]?.status === 'OK').length;

  const isRumdinCompleted = rumdinUnits.length > 0 && rumdinOkCount === rumdinUnits.length;
  const isWapresCompleted = wapresUnits.length > 0 && wapresOkCount === wapresUnits.length;

  // Syarat mutlak: Tombol Kirim WA hanya muncul ketika status inputan KEDUA TIM sudah OKE semua
  const isBothTeamsCompleted = isRumdinCompleted && isWapresCompleted;

  const totalUnits = MASTER_UNITS.length;
  const okUnits = rumdinOkCount + wapresOkCount;

  const now = new Date();
  const isNightAlert = shift === 'MALAM' && now.getHours() < 8 && !isBothTeamsCompleted;

  const handleManualRefresh = () => {
    setIsSpinning(true);
    onRefresh();
    setTimeout(() => setIsSpinning(false), 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -12 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="space-y-5"
    >
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Monitoring Progres
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                SHIFT {shift}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Status Inspeksi Catu Daya
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all disabled:opacity-50"
            title="Muat Ulang Progres"
          >
            <RefreshCw className={`w-4 h-4 ${isSpinning || isLoading ? 'animate-spin text-sky-600' : ''}`} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onGantiShift}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ganti Shift</span>
          </motion.button>
        </div>
      </div>

      {/* Night shift reminder alert */}
      {isNightAlert && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs leading-relaxed"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-sm mb-0.5">Peringatan Shift Malam!</strong>
            Masih ada data inspeksi yang belum diinput. Mohon segera lengkapi seluruh laporan operasional sebelum pukul 08:00 WIB.
          </div>
        </motion.div>
      )}

      {/* Progress Metric Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white shadow-md flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-medium text-slate-400 block">
            PENCAPAIAN MONITORING
          </span>
          <div className="text-xl font-extrabold tracking-tight mt-0.5 flex items-center gap-2">
            <span>{okUnits} dari {totalUnits} Unit Selesai</span>
            {isBothTeamsCompleted && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                Lengkap 100%
              </span>
            )}
          </div>
        </div>

        <div className="w-28 sm:w-40 bg-slate-700/60 rounded-full h-3 overflow-hidden p-0.5 border border-slate-600">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(okUnits / (totalUnits || 1)) * 100}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 18 }}
            className={`h-full rounded-full ${
              isBothTeamsCompleted ? 'bg-gradient-to-r from-emerald-400 to-teal-300' : 'bg-gradient-to-r from-sky-400 to-cyan-300'
            }`}
          />
        </div>
      </div>

      {/* WhatsApp All-Completed Action Banner - ONLY appears when BOTH teams are completely OK */}
      {isBothTeamsCompleted ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 border border-emerald-400/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                  KEDUA TIM OK (100%)
                </span>
              </div>
              <h4 className="text-sm font-extrabold mt-0.5">Semua Unit Telah Terinspeksi!</h4>
              <p className="text-xs text-emerald-100 font-medium">
                Data shift {shift} (Rumah Dinas & Istana Wapres) siap dikirim ke WhatsApp koordinasi.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGenerateWA}
            className="w-full sm:w-auto px-5 py-2.5 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all whitespace-nowrap"
          >
            <Send className="w-4 h-4 text-emerald-700" />
            <span>Kirim Laporan ke WA</span>
          </motion.button>
        </motion.div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-700">Status Kedua Tim: </span>
              {isRumdinCompleted && !isWapresCompleted ? (
                <span>
                  <strong className="text-emerald-600 font-bold">Rumdin Selesai ({rumdinOkCount}/{rumdinUnits.length})</strong>
                  {' • '}
                  <span className="text-amber-600 font-bold">Menunggu Istana Wapres ({wapresOkCount}/{wapresUnits.length})</span>
                </span>
              ) : !isRumdinCompleted && isWapresCompleted ? (
                <span>
                  <strong className="text-emerald-600 font-bold">Istana Wapres Selesai ({wapresOkCount}/{wapresUnits.length})</strong>
                  {' • '}
                  <span className="text-amber-600 font-bold">Menunggu Rumdin ({rumdinOkCount}/{rumdinUnits.length})</span>
                </span>
              ) : (
                <span className="text-slate-500">
                  Rumdin ({rumdinOkCount}/{rumdinUnits.length}) • Istana Wapres ({wapresOkCount}/{wapresUnits.length})
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 font-medium whitespace-nowrap">
            Tombol Kirim WA aktif saat <strong>kedua tim</strong> sudah OK
          </span>
        </div>
      )}

      {/* Units Split Grid: Rumdin vs Wapres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rumdin Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Home className="w-4 h-4 text-sky-600" />
              <span>Rumah Dinas Wapres ({rumdinUnits.filter(u => dashboardState[u.id]?.status === 'OK').length}/{rumdinUnits.length})</span>
            </div>
          </div>

          <div className="space-y-2">
            {rumdinUnits.map((unit) => {
              const info = dashboardState[unit.id] || { status: 'BELUM', jam: '-' };
              const isOk = info.status === 'OK';

              return (
                <div
                  key={unit.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between gap-3 hover:border-sky-300 transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {unit.name}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {unit.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {isOk && info.petugas ? `Petugas: ${info.petugas}` : unit.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isOk ? (
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>OK ({info.jam})</span>
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onMulaiEdit(unit.id)}
                          className="w-7 h-7 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 flex items-center justify-center transition-colors"
                          title="Edit Data Inspeksi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                        <Clock className="w-3 h-3" />
                        <span>Belum</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wapres Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Istana Wapres ({wapresUnits.filter(u => dashboardState[u.id]?.status === 'OK').length}/{wapresUnits.length})</span>
            </div>
          </div>

          <div className="space-y-2">
            {wapresUnits.map((unit) => {
              const info = dashboardState[unit.id] || { status: 'BELUM', jam: '-' };
              const isOk = info.status === 'OK';

              return (
                <div
                  key={unit.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between gap-3 hover:border-indigo-300 transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {unit.name}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {unit.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {isOk && info.petugas ? `Petugas: ${info.petugas}` : unit.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isOk ? (
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>OK ({info.jam})</span>
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onMulaiEdit(unit.id)}
                          className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors"
                          title="Edit Data Inspeksi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                        <Clock className="w-3 h-3" />
                        <span>Belum</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Start Inspection Buttons */}
      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onMulaiInput('RUMDIN')}
          className="p-4 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-sm shadow-md shadow-sky-600/20 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block text-sm">Inspeksi Rumah Dinas</span>
              <span className="text-[11px] font-normal text-sky-100">Situbondo, Dipo & UPS</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onMulaiInput('WAPRES')}
          className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-slate-800 hover:from-indigo-700 hover:to-slate-900 text-white font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block text-sm">Inspeksi Istana Wapres</span>
              <span className="text-[11px] font-normal text-indigo-100">Gardu D126 & UPS Catu Daya</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80" />
        </motion.button>
      </div>
    </motion.div>
  );
};
