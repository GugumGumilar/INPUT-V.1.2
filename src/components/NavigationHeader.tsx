import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Wifi, WifiOff, RefreshCw, Clock, Calendar, FileSpreadsheet } from 'lucide-react';

interface NavigationHeaderProps {
  offlineCount: number;
  onSyncOffline: () => void;
  isSpreadsheetConnected: boolean;
  onOpenSpreadsheetConfig: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  offlineCount,
  onSyncOffline,
  isSpreadsheetConnected,
  onOpenSpreadsheetConfig
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="relative z-10 w-full mb-6">
      {/* Top Bar with Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20"
          >
            <Zap className="w-5 h-5 fill-sky-200 text-white" />
          </motion.div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-sky-700 uppercase block font-mono">
              PLN UP3 CEMPAKA PUTIH
            </span>
            <span className="text-xs font-semibold text-slate-700">
              Posko Siaga VVIP
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Google Spreadsheet Status Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenSpreadsheetConfig}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isSpreadsheetConnected
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
            }`}
            title="Pengaturan Koneksi Google Spreadsheet"
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${isSpreadsheetConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span>{isSpreadsheetConnected ? 'Spreadsheet Terhubung' : 'Koneksi Spreadsheet'}</span>
          </motion.button>

          {/* Offline Sync Banner Button */}
          {offlineCount > 0 && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSyncOffline}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              title="Klik untuk menyinkronkan data offline"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{offlineCount} Data Offline</span>
            </motion.button>
          )}

          {/* Network Status Pill */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3 h-3" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Live Clock Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-medium">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{currentTime || '--:--'}</span>
          </div>
        </div>
      </div>

      {/* Main Title Header */}
      <div className="mt-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
        >
          POSKO WAKIL PRESIDEN
        </motion.h1>
        <div className="flex items-center justify-center gap-2 mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          <span>{currentDate || 'Memuat tanggal...'}</span>
        </div>
      </div>
    </header>
  );
};
