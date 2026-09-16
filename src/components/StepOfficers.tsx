import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, ArrowLeft, ArrowRight, Check, UserCheck, Plus, UserPlus } from 'lucide-react';
import { PETUGAS } from '../data/constants';
import { LocationType } from '../types';

interface StepOfficersProps {
  location: LocationType;
  selectedOfficers: string[];
  onToggleOfficer: (name: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onShowAlert: (msg: string, icon?: string) => void;
}

export const StepOfficers: React.FC<StepOfficersProps> = ({
  location,
  selectedOfficers = [],
  onToggleOfficer,
  onContinue,
  onBack,
  onShowAlert
}) => {
  const safeSelected = selectedOfficers || [];
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [showAddCustom, setShowAddCustom] = useState<boolean>(false);
  const [customOfficersList, setCustomOfficersList] = useState<string[]>([]);

  const allAvailableOfficers = Array.from(new Set([...customOfficersList, ...(PETUGAS || [])]));

  const filtered = allAvailableOfficers.filter((p) =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customName.trim().toUpperCase();
    if (!clean) return;
    if (!customOfficersList.includes(clean) && !(PETUGAS || []).includes(clean)) {
      setCustomOfficersList((prev) => [clean, ...prev]);
    }
    if (!safeSelected.includes(clean)) {
      onToggleOfficer(clean);
    }
    setCustomName('');
    setShowAddCustom(false);
  };

  const handleProceed = () => {
    if (safeSelected.length === 0) {
      onShowAlert('Silakan pilih minimal 1 petugas piket sebelum melanjutkan inspeksi!', '⚠️');
      return;
    }
    onContinue();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.96, x: -20 }}
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
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Personel Bertugas
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                location === 'RUMDIN' 
                  ? 'bg-sky-100 text-sky-800' 
                  : 'bg-indigo-100 text-indigo-800'
              }`}>
                Tim {location === 'RUMDIN' ? 'Rumah Dinas' : 'Istana Wapres'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Pilih personel yang menginput data untuk unit {location === 'RUMDIN' ? 'Rumah Dinas' : 'Istana Wapres'}
            </p>
          </div>
        </div>

        {/* Selected count pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold">
          <UserCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>{selectedOfficers.length} Dipilih</span>
        </div>
      </div>

      {/* Team Independence Banner */}
      <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs text-sky-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-700 shrink-0" />
          <span>
            Input form ini terisolasi untuk <strong>{location === 'RUMDIN' ? 'Rumah Dinas' : 'Istana Wapres'}</strong>. Tim di lokasi lain dapat mengisi unit mereka secara bersamaan tanpa saling mengganggu.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="shrink-0 text-[11px] font-bold text-sky-700 hover:text-sky-900 underline flex items-center gap-1"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{showAddCustom ? 'Tutup' : '+ Nama Baru'}</span>
        </button>
      </div>

      {/* Add Custom Officer Form */}
      {showAddCustom && (
        <form onSubmit={handleAddCustom} className="p-3 bg-white border border-sky-200 rounded-2xl shadow-sm flex items-center gap-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Ketik Nama Personel / Mitra..."
            className="flex-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:border-sky-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama personel piket..."
          className="w-full text-xs font-medium bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold absolute right-3.5 top-1/2 -translate-y-1/2"
          >
            Hapus
          </button>
        )}
      </div>

      {/* Officers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto p-1">
        {filtered.map((name) => {
          const isSelected = safeSelected.includes(name);
          return (
            <motion.button
              key={name}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onToggleOfficer(name)}
              className={`p-3 rounded-2xl text-left border text-xs font-bold transition-all flex items-center justify-between gap-2 select-none ${
                isSelected
                  ? 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-300 text-sky-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="truncate">{name}</span>
              <motion.div
                animate={{ scale: isSelected ? 1 : 0.8, opacity: isSelected ? 1 : 0.3 }}
                className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : null}
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="pt-2 flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleProceed}
          className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-sm shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all"
        >
          <span>Lanjutkan ke Formulir Unit</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
        >
          Batal
        </motion.button>
      </div>
    </motion.div>
  );
};
