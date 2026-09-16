import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Save, 
  Clock, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Thermometer, 
  BatteryCharging, 
  Activity, 
  Check, 
  ChevronRight,
  Send,
  Users,
  Building2,
  Home,
  CheckCheck,
  Edit2
} from 'lucide-react';
import { InspectionData, LocationType, ShiftType, UnitConfig, UnitStatus } from '../types';
import { DROPS, MASTER_UNITS, PETUGAS, SARAN_KETERANGAN } from '../data/constants';
import { hitungKonversiMenit } from '../utils/storage';

interface StepInspectionFormProps {
  location: LocationType;
  shift: ShiftType;
  officers: string;
  selectedOfficers: string[];
  onUpdateOfficers: (officers: string[]) => void;
  selectedUnitId: string;
  locationUnits: UnitConfig[];
  dashboardState: Record<string, UnitStatus>;
  dataLengkap: Record<string, InspectionData>;
  onSelectUnit: (unitId: string) => void;
  onSave: (unitId: string, data: InspectionData, officersOverride?: string) => Promise<{ success: boolean; message: string; jam: string }>;
  onBack: () => void;
  onGenerateWA?: () => void;
  isSaving: boolean;
}

const getDefaultDataForUnit = (unit?: UnitConfig): InspectionData => {
  if (!unit) return {};
  if (unit.type === 'UPS') {
    return {
      Arus_R: '',
      Arus_S: '',
      Arus_T: '',
      Volt_RN: '220',
      Volt_SN: '220',
      Volt_TN: '220',
      Volt_RS: '380',
      Volt_RT: '380',
      Volt_ST: '380',
      Temperatur_UPS: '24',
      Alarm_UPS: 'NORMAL',
      Backup_Total_Minutes: '120',
      Keterangan: 'AMAN TERKENDALI'
    };
  }

  // Non-UPS / Gardu & ACO
  return {
    Status_Sumber_CLOSE: 'GARDU T93',
    Status_Sumber_OPEN: 'GARDU T10B',
    Status_Penyulang_CLOSE: 'P HAYAM WURUK GI GAMBIR LAMA',
    Status_Penyulang_OPEN: 'KOPEL ACO (GH41 P HONGKONG GI BUDI KEMULIAAN)',
    Status_T135: 'OPEN',
    Status_T15N: 'CLOSE',
    Global_Alarm: 'NORMAL',
    Global_Power: 'ON',
    Global_Charging: 'YA',
    Global_Remote: 'AUTO',
    Global_Lampu: 'ON',
    Keterangan: 'AMAN TERKENDALI'
  };
};

export const StepInspectionForm: React.FC<StepInspectionFormProps> = ({
  location,
  shift,
  officers,
  selectedOfficers,
  onUpdateOfficers,
  selectedUnitId,
  locationUnits,
  dashboardState,
  dataLengkap,
  onSelectUnit,
  onSave,
  onBack,
  onGenerateWA,
  isSaving
}) => {
  // In-memory drafts for all units so switching tabs never loses un-saved input
  const [unitDrafts, setUnitDrafts] = useState<Record<string, InspectionData>>({});
  const [unitOfficerOverrides, setUnitOfficerOverrides] = useState<Record<string, string[]>>({});
  const [showOfficerModal, setShowOfficerModal] = useState<boolean>(false);
  const [saveBanner, setSaveBanner] = useState<{ type: 'success' | 'error'; message: string; unitName: string } | null>(null);

  const activeUnit = locationUnits.find((u) => u.id === selectedUnitId) || locationUnits[0];
  const isUPS = activeUnit?.type === 'UPS';

  // Menentukan petugas yang ditampilkan untuk unit aktif:
  // JIKA SUDAH MEMILIH PETUGAS dan Data ingin di EDIT KEMBALI,
  // maka yang di TAMPILKAN PETUGAS YG DI AWAL INPUT DATA,
  // KECUALI MEREKA INGIN RUBAH PETUGAS TINGGAL KLIK GANTI PETUGAS
  const activeOfficers: string[] = React.useMemo(() => {
    if (!activeUnit) return selectedOfficers || [];

    // 1. Jika user telah merubah petugas secara spesifik via tombol "Ganti Petugas" pada sesi ini
    if (unitOfficerOverrides[activeUnit.id] && unitOfficerOverrides[activeUnit.id].length > 0) {
      return unitOfficerOverrides[activeUnit.id];
    }

    // 2. Jika data sudah pernah diinput sebelumnya (tersimpan di dashboardState atau dataLengkap):
    // Tampilkan petugas yang di awal input data
    const initialPetugasStr = dashboardState[activeUnit.id]?.petugas || dataLengkap[activeUnit.id]?.Nama_Petugas;
    if (initialPetugasStr && typeof initialPetugasStr === 'string' && initialPetugasStr.trim() !== '' && initialPetugasStr.trim() !== '-') {
      const parts = initialPetugasStr.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        return parts;
      }
    }

    // 3. Petugas tim dari StepOfficers / selectedOfficers
    return selectedOfficers && selectedOfficers.length > 0 ? selectedOfficers : [];
  }, [activeUnit?.id, unitOfficerOverrides, dashboardState, dataLengkap, selectedOfficers]);

  const displayedOfficersText = activeOfficers.length > 0 ? activeOfficers.join(' , ') : (officers || 'Belum dipilih');

  // Get active unit's form data with guaranteed fallback defaults
  const currentFormData: InspectionData = React.useMemo(() => {
    if (!activeUnit) return {};
    const defaults = getDefaultDataForUnit(activeUnit);
    const saved = (activeUnit && dataLengkap[activeUnit.id]) || {};
    const draft = (activeUnit && unitDrafts[activeUnit.id]) || {};

    // Filter out invalid/empty/dash values so they never overwrite healthy defaults
    const cleanSaved: InspectionData = {};
    Object.entries(saved).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-') {
        cleanSaved[k] = v;
      }
    });

    const cleanDraft: InspectionData = {};
    Object.entries(draft).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-') {
        cleanDraft[k] = v;
      }
    });

    return {
      ...defaults,
      ...cleanSaved,
      ...cleanDraft
    };
  }, [activeUnit, dataLengkap, unitDrafts]);

  const handleChange = (field: string, value: string) => {
    if (!activeUnit) return;
    setUnitDrafts((prev) => ({
      ...prev,
      [activeUnit.id]: {
        ...(prev[activeUnit.id] || currentFormData),
        [field]: value
      }
    }));
  };

  const backupConverted = hitungKonversiMenit(currentFormData.Backup_Total_Minutes || '0');

  // Stats for this location
  const completedInLocation = locationUnits.filter(
    (u) => dashboardState[u.id]?.status === 'OK'
  ).length;
  const progressPercent = locationUnits.length > 0 ? Math.round((completedInLocation / locationUnits.length) * 100) : 0;

  // Handle saving the current unit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUnit) return;

    const defaults = getDefaultDataForUnit(activeUnit);
    const finalData: InspectionData = {
      ...defaults,
      ...currentFormData
    };

    if (isUPS) {
      finalData.Backup_Hours = backupConverted.jam;
      finalData.Backup_Minutes = backupConverted.menit;
    } else {
      // Penanganan khusus unit-unit ACO agar data tersimpan presisi dan tidak pernah '-'
      if (activeUnit.id === 'Rumdin_Situbondo') {
        const closeVal = (!finalData.Status_Sumber_CLOSE || finalData.Status_Sumber_CLOSE === '-') 
          ? 'GARDU T93' 
          : finalData.Status_Sumber_CLOSE;
        const openVal = (!finalData.Status_Sumber_OPEN || finalData.Status_Sumber_OPEN === '-') 
          ? 'GARDU T10B' 
          : finalData.Status_Sumber_OPEN;
        finalData.Status_Sumber_CLOSE = closeVal;
        finalData.Status_Sumber_OPEN = openVal;
        finalData.Status_Penyulang_CLOSE = closeVal;
        finalData.Status_Penyulang_OPEN = openVal;
      } else if (activeUnit.id === 'Rumdin_Dipo') {
        const t135Val = (!finalData.Status_T135 || finalData.Status_T135 === '-') 
          ? 'OPEN' 
          : finalData.Status_T135;
        const t15nVal = (!finalData.Status_T15N || finalData.Status_T15N === '-') 
          ? 'CLOSE' 
          : finalData.Status_T15N;
        finalData.Status_T135 = t135Val;
        finalData.Status_T15N = t15nVal;
        // Alias agar dibaca oleh berbagai script lama / baru
        finalData.Status_Sumber_CLOSE = t135Val;
        finalData.Status_Sumber_OPEN = t15nVal;
        finalData.Status_Penyulang_CLOSE = t135Val;
        finalData.Status_Penyulang_OPEN = t15nVal;
      } else if (activeUnit.id === 'Wapres_Gardu_D126') {
        const closeVal = (!finalData.Status_Penyulang_CLOSE || finalData.Status_Penyulang_CLOSE === '-') 
          ? 'P HAYAM WURUK GI GAMBIR LAMA' 
          : finalData.Status_Penyulang_CLOSE;
        const openVal = (!finalData.Status_Penyulang_OPEN || finalData.Status_Penyulang_OPEN === '-') 
          ? 'KOPEL ACO (GH41 P HONGKONG GI BUDI KEMULIAAN)' 
          : finalData.Status_Penyulang_OPEN;
        finalData.Status_Penyulang_CLOSE = closeVal;
        finalData.Status_Penyulang_OPEN = openVal;
        finalData.Status_Sumber_CLOSE = closeVal;
        finalData.Status_Sumber_OPEN = openVal;
      }

      // Pastikan semua parameter status ACO terisi dengan tegas & valid
      const alarmVal = (!finalData.Global_Alarm || finalData.Global_Alarm === '-') ? 'NORMAL' : finalData.Global_Alarm;
      const powerVal = (!finalData.Global_Power || finalData.Global_Power === '-') ? 'ON' : finalData.Global_Power;
      const chargingVal = (!finalData.Global_Charging || finalData.Global_Charging === '-') ? 'YA' : finalData.Global_Charging;
      const remoteVal = (!finalData.Global_Remote || finalData.Global_Remote === '-') ? 'AUTO' : finalData.Global_Remote;
      const lampuVal = (!finalData.Global_Lampu || finalData.Global_Lampu === '-') ? 'ON' : finalData.Global_Lampu;
      const ketVal = (!finalData.Keterangan || finalData.Keterangan === '-') ? 'AMAN TERKENDALI' : finalData.Keterangan;

      finalData.Global_Alarm = alarmVal;
      finalData.Global_Power = powerVal;
      finalData.Global_Charging = chargingVal;
      finalData.Global_Remote = remoteVal;
      finalData.Global_Lampu = lampuVal;
      finalData.Keterangan = ketVal;

      // Sediakan alias multi-key agar script Google Apps Script (baik versi baru maupun versi lama) langsung membacanya
      finalData.Alarm = alarmVal;
      finalData.Alarm_Status = alarmVal;
      finalData.Status_Alarm = alarmVal;

      finalData.Power_ACO = powerVal;
      finalData.Status_Power_ACO = powerVal;
      finalData.Status_Power = powerVal;

      finalData.Charging_Kubikel = chargingVal;
      finalData.Status_Charging_Kubikel = chargingVal;
      finalData.Status_Charging = chargingVal;

      finalData.Remote_Kubikel = remoteVal;
      finalData.Status_Remote_Kubikel = remoteVal;
      finalData.Status_Remote = remoteVal;

      finalData.Lampu_Indikator = lampuVal;
      finalData.Status_Lampu_Indikator = lampuVal;
      finalData.Status_Lampu = lampuVal;
    }

    const officersForSave = activeOfficers.length > 0 ? activeOfficers.join(' , ') : officers;
    const res = await onSave(activeUnit.id, finalData, officersForSave);

    if (res.success) {
      setSaveBanner({
        type: 'success',
        unitName: activeUnit.name,
        message: `${res.message} (Waktu: ${res.jam} WIB)`
      });

      // Clear draft for this unit since it's saved
      setUnitDrafts((prev) => {
        const next = { ...prev };
        delete next[activeUnit.id];
        return next;
      });

      // Find next pending unit in this location if any
      const pendingUnits = locationUnits.filter(
        (u) => u.id !== activeUnit.id && dashboardState[u.id]?.status !== 'OK'
      );

      if (pendingUnits.length > 0) {
        // Automatically switch to the next uncompleted unit after short delay
        setTimeout(() => {
          onSelectUnit(pendingUnits[0].id);
        }, 500);
      }
      // Jika semua unit sudah selesai atau sedang edit, user tetap di form tanpa pop-up pengalihan
    } else {
      setSaveBanner({
        type: 'error',
        unitName: activeUnit.name,
        message: res.message
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -15 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="space-y-4"
    >
      {/* Top Banner Session Details */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white shadow-lg border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.08, x: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            type="button"
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </motion.button>

          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold tracking-wide uppercase ${
                location === 'RUMDIN' 
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30' 
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
              }`}>
                {location === 'RUMDIN' ? 'Tim Rumah Dinas' : 'Tim Istana Wapres'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                SHIFT {shift}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs text-slate-300 font-medium">
                Petugas: <strong className="text-white">{displayedOfficersText}</strong>
              </p>
              <button
                type="button"
                onClick={() => setShowOfficerModal(true)}
                className="px-2.5 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-white text-[11px] font-bold transition-all flex items-center gap-1.5 border border-sky-400/30 shadow-xs active:scale-95"
                title="Klik untuk mengganti personel petugas unit ini"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ganti Petugas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
              Progres Lokasi
            </span>
            <span className="text-xs font-mono font-extrabold text-white">
              {completedInLocation} / {locationUnits.length} Selesai
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xs text-sky-400">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Officer Switcher Modal */}
      {showOfficerModal && (
        <div className="p-4 rounded-2xl bg-white border border-sky-300 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Ganti Petugas — {activeUnit?.name}</span>
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Pilih atau rubah personel petugas piket untuk unit ini
              </p>
            </div>
            <button
              onClick={() => setShowOfficerModal(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              Tutup
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
            {(PETUGAS || []).map((name) => {
              const isSelected = activeOfficers.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    const next = isSelected 
                      ? activeOfficers.filter((o) => o !== name) 
                      : [...activeOfficers, name];
                    if (activeUnit) {
                      setUnitOfficerOverrides((prev) => ({
                        ...prev,
                        [activeUnit.id]: next
                      }));
                    }
                    onUpdateOfficers(next);
                  }}
                  className={`p-2 rounded-xl text-left text-[11px] font-bold border transition-all flex items-center justify-between ${
                    isSelected 
                      ? 'bg-sky-50 border-sky-400 text-sky-900' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">
              {activeOfficers.length > 0 ? `${activeOfficers.length} personel dipilih` : 'Belum ada petugas'}
            </span>
            <button
              type="button"
              onClick={() => setShowOfficerModal(false)}
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm"
            >
              Selesai Ganti Petugas
            </button>
          </div>
        </div>
      )}

      {/* Location Unit Tabs Navigator */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Daftar Unit Catu Daya {location === 'RUMDIN' ? 'Rumah Dinas' : 'Istana Wapres'}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Klik unit untuk mengisi atau meninjau
          </span>
        </div>

        {/* Units Grid Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(locationUnits || []).map((u) => {
            const isSelected = u.id === activeUnit?.id;
            const statusInfo = dashboardState[u.id];
            const isDone = statusInfo?.status === 'OK';
            const hasDraft = !!unitDrafts[u.id];

            return (
              <motion.button
                key={u.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectUnit(u.id)}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[76px] ${
                  isSelected
                    ? 'bg-gradient-to-br from-sky-500 to-blue-700 text-white border-transparent shadow-md shadow-sky-500/20 ring-2 ring-sky-400/40'
                    : isDone
                    ? 'bg-emerald-50/60 border-emerald-200 text-slate-800 hover:bg-emerald-50'
                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] font-bold font-mono uppercase px-1.5 py-0.2 rounded ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-200/70 text-slate-600'
                    }`}>
                      {u.type}{u.capacity ? ` • ${u.capacity}` : ''}
                    </span>
                    {hasDraft && !isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" title="Ada draf belum disimpan" />
                    )}
                  </div>
                  <h4 className={`text-xs font-extrabold mt-1.5 line-clamp-1 ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}>
                    {u.name}
                  </h4>
                </div>

                {/* Status indicator pill */}
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  {isDone ? (
                    <span className={`flex items-center gap-1 font-bold ${
                      isSelected ? 'text-emerald-200' : 'text-emerald-700'
                    }`}>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>Selesai ({statusInfo.jam})</span>
                    </span>
                  ) : (
                    <span className={`flex items-center gap-1 font-medium ${
                      isSelected ? 'text-sky-100' : 'text-slate-400'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span>Belum diisi</span>
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-sky-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      {/* Auto-redirect overlay when all units for this team are finished */}
      <AnimatePresence>
        {isAutoRedirecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono">
                  Input Selesai 100%
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Seluruh Unit {location === 'RUMDIN' ? 'Rumah Dinas' : 'Istana Wapres'} Lengkap!
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Data berhasil disimpan. Mengalihkan otomatis ke Dashboard...
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2.5 px-4 rounded-2xl border border-emerald-100">
                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>Menuju Dashboard</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dynamic Inspection Form */}
      {activeUnit ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            {/* Header of Active Unit Form */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm ${
                  isUPS ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                }`}>
                  {isUPS ? <BatteryCharging className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Formulir Parameter {activeUnit.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                      {activeUnit.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isUPS ? 'Pengukuran Tegangan, Arus Beban & Estimasi Backup' : 'Pemeriksaan Posisi Gardu, Kubikel & Indikator'}
                  </p>
                </div>
              </div>

              {dashboardState[activeUnit.id]?.status === 'OK' && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersimpan ({dashboardState[activeUnit.id].jam})</span>
                </span>
              )}
            </div>

            {/* If UPS */}
            {isUPS ? (
              <div className="space-y-4">
                {/* Current (Arus) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Arus Beban (Ampere)
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">Fasa R</span>
                      <input
                        type="number"
                        step="any"
                        required
                        value={currentFormData.Arus_R || ''}
                        onChange={(e) => handleChange('Arus_R', e.target.value)}
                        placeholder="0.0"
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">Fasa S</span>
                      <input
                        type="number"
                        step="any"
                        required
                        value={currentFormData.Arus_S || ''}
                        onChange={(e) => handleChange('Arus_S', e.target.value)}
                        placeholder="0.0"
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">Fasa T</span>
                      <input
                        type="number"
                        step="any"
                        required
                        value={currentFormData.Arus_T || ''}
                        onChange={(e) => handleChange('Arus_T', e.target.value)}
                        placeholder="0.0"
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Voltage Phase-Neutral (Volt R-N, S-N, T-N) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Tegangan Fasa - Netral (Volt)
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">Volt R-N</span>
                      <input
                        type="number"
                        required
                        value={currentFormData.Volt_RN || ''}
                        onChange={(e) => handleChange('Volt_RN', e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">Volt S-N</span>
                      <input
                        type="number"
                        required
                        value={currentFormData.Volt_SN || ''}
                        onChange={(e) => handleChange('Volt_SN', e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">Volt T-N</span>
                      <input
                        type="number"
                        required
                        value={currentFormData.Volt_TN || ''}
                        onChange={(e) => handleChange('Volt_TN', e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Voltage Phase-Phase (Volt R-S, R-T, S-T) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Tegangan Antar Fasa (Volt)
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">Volt R-S</span>
                      <input
                        type="number"
                        required
                        value={currentFormData.Volt_RS || ''}
                        onChange={(e) => handleChange('Volt_RS', e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">Volt R-T</span>
                      <input
                        type="number"
                        required
                        value={currentFormData.Volt_RT || ''}
                        onChange={(e) => handleChange('Volt_RT', e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">Volt S-T</span>
                      <input
                        type="number"
                        required
                        value={currentFormData.Volt_ST || ''}
                        onChange={(e) => handleChange('Volt_ST', e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Temperature & Alarm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                      <span>Temperatur (°C)</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={currentFormData.Temperatur_UPS || ''}
                      onChange={(e) => handleChange('Temperatur_UPS', e.target.value)}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      <span>Alarm UPS</span>
                    </label>
                    <select
                      value={currentFormData.Alarm_UPS || 'NORMAL'}
                      onChange={(e) => handleChange('Alarm_UPS', e.target.value)}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="ALARM">ALARM</option>
                    </select>
                  </div>
                </div>

                {/* Backup Time (Total Minutes with live conversion) */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Estimasi Backup Catu Daya (Total Menit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={currentFormData.Backup_Total_Minutes || ''}
                    onChange={(e) => handleChange('Backup_Total_Minutes', e.target.value)}
                    placeholder="Contoh: 120"
                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-800 bg-sky-50 p-2 rounded-lg border border-sky-200">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span>Konversi Sheet: <strong>{backupConverted.teks}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              /* Non-UPS / Gardu & ACO Form */
              <div className="space-y-4">
                {activeUnit.id === 'Wapres_Gardu_D126' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Penyulang CLOSE
                      </label>
                      <select
                        value={currentFormData.Status_Penyulang_CLOSE || 'P HAYAM WURUK GI GAMBIR LAMA'}
                        onChange={(e) => handleChange('Status_Penyulang_CLOSE', e.target.value)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      >
                        {(DROPS.Status_Penyulang_CLOSE || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Penyulang OPEN
                      </label>
                      <select
                        value={currentFormData.Status_Penyulang_OPEN || 'KOPEL ACO (GH41 P HONGKONG GI BUDI KEMULIAAN)'}
                        onChange={(e) => handleChange('Status_Penyulang_OPEN', e.target.value)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      >
                        {(DROPS.Status_Penyulang_OPEN || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {activeUnit.id === 'Rumdin_Situbondo' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Sumber CLOSE
                      </label>
                      <select
                        value={currentFormData.Status_Sumber_CLOSE || 'GARDU T93'}
                        onChange={(e) => handleChange('Status_Sumber_CLOSE', e.target.value)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      >
                        {(DROPS.Status_Sumber_CLOSE || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Sumber OPEN
                      </label>
                      <select
                        value={currentFormData.Status_Sumber_OPEN || 'GARDU T10B'}
                        onChange={(e) => handleChange('Status_Sumber_OPEN', e.target.value)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      >
                        {(DROPS.Status_Sumber_OPEN || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {activeUnit.id === 'Rumdin_Dipo' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Status T135
                      </label>
                      <select
                        value={currentFormData.Status_T135 || 'OPEN'}
                        onChange={(e) => handleChange('Status_T135', e.target.value)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      >
                        {(DROPS.Status_T135 || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Status T15N
                      </label>
                      <select
                        value={currentFormData.Status_T15N || 'CLOSE'}
                        onChange={(e) => handleChange('Status_T15N', e.target.value)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                      >
                        {(DROPS.Status_T15N || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Status Settings for ACO / Gardu */}
                <div className={`grid gap-3 pt-2 ${activeUnit.id === 'Wapres_Gardu_D126' ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3'}`}>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Alarm
                    </label>
                    <select
                      value={currentFormData.Global_Alarm || 'NORMAL'}
                      onChange={(e) => handleChange('Global_Alarm', e.target.value)}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="TIDAK NORMAL">TIDAK NORMAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Power ACO
                    </label>
                    <select
                      value={currentFormData.Global_Power || 'ON'}
                      onChange={(e) => handleChange('Global_Power', e.target.value)}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                    >
                      <option value="ON">ON</option>
                      <option value="OFF">OFF</option>
                    </select>
                  </div>

                  {activeUnit.id === 'Wapres_Gardu_D126' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Charging Kubikel
                        </label>
                        <select
                          value={currentFormData.Global_Charging || 'YA'}
                          onChange={(e) => handleChange('Global_Charging', e.target.value)}
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                        >
                          <option value="YA">YA</option>
                          <option value="TIDAK">TIDAK</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Remote Kubikel
                        </label>
                        <select
                          value={currentFormData.Global_Remote || 'AUTO'}
                          onChange={(e) => handleChange('Global_Remote', e.target.value)}
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                        >
                          <option value="AUTO">AUTO</option>
                          <option value="LOCAL">LOCAL</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Lampu Indikator
                    </label>
                    <select
                      value={currentFormData.Global_Lampu || 'ON'}
                      onChange={(e) => handleChange('Global_Lampu', e.target.value)}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-sky-500 focus:bg-white focus:outline-none"
                    >
                      <option value="ON">ON</option>
                      <option value="OFF">OFF</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Keterangan & Suggestions */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Catatan / Keterangan Tambahan
              </label>
              <input
                type="text"
                value={currentFormData.Keterangan || ''}
                onChange={(e) => handleChange('Keterangan', e.target.value)}
                placeholder="Contoh: AMAN TERKENDALI"
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 focus:border-sky-500 focus:bg-white focus:outline-none"
              />

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SARAN_KETERANGAN.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleChange('Keterangan', sug)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-100 hover:text-sky-800 text-slate-600 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Persistent Form Actions Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Unit {locationUnits.findIndex((u) => u.id === activeUnit.id) + 1} dari {locationUnits.length} • Periksa data sebelum disimpan</span>
            </div>

            <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
              <motion.button
                type="submit"
                disabled={isSaving}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSaving 
                    ? 'Menyimpan Data...' 
                    : `Simpan Data ${activeUnit.name}`}
                </span>
              </motion.button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs font-medium">
          Silakan pilih salah satu unit di atas untuk memuat formulir parameter inspeksi.
        </div>
      )}
    </motion.div>
  );
};
