import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationHeader } from './components/NavigationHeader';
import { StepHome } from './components/StepHome';
import { StepBriefing } from './components/StepBriefing';
import { StepDashboard } from './components/StepDashboard';
import { StepOfficers } from './components/StepOfficers';
import { StepInspectionForm } from './components/StepInspectionForm';
import { CartoonModal } from './components/CartoonModal';
import { SpreadsheetModal } from './components/SpreadsheetModal';
import { WhatsAppPreviewModal } from './components/WhatsAppPreviewModal';
import { InspectionData, LocationType, ShiftType, UnitConfig, UnitStatus } from './types';
import { MASTER_UNITS } from './data/constants';
import { 
  clearOfflineRecords, 
  getLocalDashboardState, 
  getLocalUnitData, 
  getOfflineRecords, 
  getStoredOfficers,
  saveLocalDashboardState, 
  saveLocalUnitData, 
  saveOfflineRecord,
  saveStoredOfficers 
} from './utils/storage';
import { 
  fetchSpreadsheetProgress, 
  isSpreadsheetConfigured, 
  saveSpreadsheetInspection 
} from './utils/spreadsheetApi';
import { generateLaporanWA } from './utils/reportFormatter';

type StepType = 'HOME' | 'BRIEFING' | 'DASHBOARD' | 'OFFICERS' | 'INSPECTION';

export default function App() {
  const [step, setStep] = useState<StepType>('HOME');
  const [shift, setShift] = useState<ShiftType>('PAGI');
  const [location, setLocation] = useState<LocationType>('RUMDIN');
  const [selectedOfficers, setSelectedOfficers] = useState<string[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [availableUnits, setAvailableUnits] = useState<UnitConfig[]>([]);
  const [dashboardState, setDashboardState] = useState<Record<string, UnitStatus>>({});
  const [dataLengkap, setDataLengkap] = useState<Record<string, InspectionData>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState<boolean>(false);
  const [isSpreadsheetConnected, setIsSpreadsheetConnected] = useState<boolean>(isSpreadsheetConfigured());
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);
  const [waReportText, setWaReportText] = useState<string>('');

  // Cartoon alert modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    icon?: string;
  }>({
    isOpen: false,
    message: ''
  });

  const showAlert = (message: string, icon = '⚠️', title?: string) => {
    setModalState({
      isOpen: true,
      title,
      message,
      icon
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Check offline data count on mount and periodically
  const refreshOfflineCount = () => {
    const list = getOfflineRecords();
    setOfflineCount(list.length);
    setIsSpreadsheetConnected(isSpreadsheetConfigured());
  };

  useEffect(() => {
    refreshOfflineCount();
    const interval = setInterval(refreshOfflineCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load dashboard progress for active shift
  const loadDashboard = async (activeShift: ShiftType) => {
    setIsLoading(true);

    // 1. If Google Spreadsheet Web App is configured, fetch from it
    if (isSpreadsheetConfigured()) {
      try {
        const sheetRes = await fetchSpreadsheetProgress(activeShift);
        if (sheetRes && sheetRes.dashboard && Object.keys(sheetRes.dashboard).length > 0) {
          setDashboardState(sheetRes.dashboard);
          setDataLengkap(sheetRes.dataLengkap || {});
          saveLocalDashboardState(activeShift, sheetRes.dashboard);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Fallback to local storage', e);
      }
    }

    // 2. If embedded in Google Apps Script directly
    const win = window as any;
    if (win.google?.script?.run) {
      win.google.script.run
        .withSuccessHandler((jsonStr: string) => {
          setIsLoading(false);
          try {
            const res = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
            setDashboardState(res.dashboard || {});
            setDataLengkap(res.dataLengkap || {});
          } catch (e) {
            console.error(e);
          }
        })
        .withFailureHandler(() => {
          setIsLoading(false);
          const localState = getLocalDashboardState(activeShift);
          setDashboardState(localState);
        })
        .ambilProgresHarian(activeShift);
    } else {
      // 3. Local fallback mode
      setTimeout(() => {
        setIsLoading(false);
        const localState = getLocalDashboardState(activeShift);
        setDashboardState(localState);
        const localDataMap: Record<string, InspectionData> = {};
        MASTER_UNITS.forEach((unit) => {
          const d = getLocalUnitData(unit.id, activeShift);
          if (d) localDataMap[unit.id] = d;
        });
        setDataLengkap(localDataMap);
      }, 350);
    }
  };

  // Step 0: Shift Selection
  const handleSelectShift = (s: ShiftType) => {
    setShift(s);
    setStep('DASHBOARD');
    loadDashboard(s);
  };

  // Step 0: Open Briefing
  const handleOpenBriefing = () => {
    setStep('BRIEFING');
  };

  // Step 1: Mulai Input Location (Rumdin or Wapres)
  const handleMulaiInput = (loc: LocationType) => {
    setLocation(loc);

    // Get all units for this location
    const master = MASTER_UNITS.filter((u) => u.location === loc);
    const pending = master.filter((u) => dashboardState[u.id]?.status !== 'OK');

    setAvailableUnits(master);
    setSelectedUnitId(pending.length > 0 ? pending[0].id : master[0]?.id || '');

    // Load team-isolated officers for this location & shift
    const savedOfficers = getStoredOfficers(loc, shift);
    setSelectedOfficers(savedOfficers);

    setStep('OFFICERS');
  };

  // Step 1: Mulai Edit Existing Completed Unit
  const handleMulaiEdit = (unitId: string) => {
    setIsEditing(true);
    const unit = MASTER_UNITS.find((u) => u.id === unitId);
    if (!unit) return;

    setLocation(unit.location);
    setSelectedUnitId(unitId);
    setAvailableUnits(MASTER_UNITS.filter((u) => u.location === unit.location));

    const existingInfo = dashboardState[unitId];
    if (existingInfo?.petugas) {
      const parts = existingInfo.petugas.split(' , ').map((s) => s.trim());
      setSelectedOfficers(parts);
    } else {
      const savedOfficers = getStoredOfficers(unit.location, shift);
      setSelectedOfficers(savedOfficers);
    }

    setStep('INSPECTION');
  };

  // Step 2: Toggle Officer
  const handleToggleOfficer = (name: string) => {
    setSelectedOfficers((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  // Step 2: Continue to Form
  const handleContinueToForm = () => {
    // Persist team-specific officers
    saveStoredOfficers(location, shift, selectedOfficers);
    setStep('INSPECTION');
  };

  // Step 3: Save Inspection Data (Does NOT kick user out of form)
  const handleSaveInspection = async (
    unitId: string, 
    data: InspectionData
  ): Promise<{ success: boolean; message: string; jam: string }> => {
    setIsSaving(true);
    const officersStr = selectedOfficers.join(' , ');
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Update local dashboard state immediately
    const updatedState = {
      ...dashboardState,
      [unitId]: {
        status: 'OK' as const,
        jam: timeStr,
        petugas: officersStr
      }
    };
    setDashboardState(updatedState);
    saveLocalDashboardState(shift, updatedState);
    saveLocalUnitData(unitId, data, shift);
    setDataLengkap((prev) => ({ ...prev, [unitId]: data }));

    // 1. If offline, save to local queue
    if (!navigator.onLine) {
      saveOfflineRecord({
        unit: unitId,
        data,
        petugas: officersStr,
        lokasi: location,
        shift
      });
      setIsSaving(false);
      refreshOfflineCount();
      return {
        success: true,
        message: 'Koneksi offline. Data tersimpan aman di memori perangkat.',
        jam: timeStr
      };
    }

    // 2. If Google Spreadsheet is configured, save directly to Google Sheets!
    if (isSpreadsheetConfigured()) {
      const sheetRes = await saveSpreadsheetInspection(unitId, data, officersStr, location, shift);
      setIsSaving(false);

      if (sheetRes.success) {
        return {
          success: true,
          message: 'Data berhasil tersimpan ke Google Spreadsheet Posko!',
          jam: timeStr
        };
      } else {
        // Fallback to offline queue
        saveOfflineRecord({
          unit: unitId,
          data,
          petugas: officersStr,
          lokasi: location,
          shift
        });
        refreshOfflineCount();
        return {
          success: false,
          message: `Gagal mengirim ke Spreadsheet (${sheetRes.message}). Data disimpan di memori HP.`,
          jam: timeStr
        };
      }
    }

    // 3. Fallback standard local
    setIsSaving(false);
    return {
      success: true,
      message: 'Data inspeksi tersimpan di memori aplikasi.',
      jam: timeStr
    };
  };

  // Sync all offline records
  const handleSyncOffline = async () => {
    if (!navigator.onLine) {
      showAlert('Perangkat masih offline. Hubungkan ke jaringan internet sebelum menyinkronkan data.', '📶');
      return;
    }

    const records = getOfflineRecords();
    if (records.length === 0) return;

    setIsLoading(true);

    // If Google Spreadsheet configured
    if (isSpreadsheetConfigured()) {
      let synced = 0;
      for (const rec of records) {
        const res = await saveSpreadsheetInspection(rec.unit, rec.data, rec.petugas, rec.lokasi, rec.shift);
        if (res.success) synced++;
      }

      if (synced > 0) {
        clearOfflineRecords();
        refreshOfflineCount();
        setIsLoading(false);
        showAlert(`${synced} data offline berhasil disinkronkan ke Google Spreadsheet!`, '✅', 'Sinkronisasi Berhasil');
        loadDashboard(shift);
        return;
      }
    }

    const win = window as any;
    if (win.google?.script?.run) {
      let synced = 0;
      records.forEach((rec) => {
        win.google.script.run
          .withSuccessHandler(() => {
            synced++;
            if (synced === records.length) {
              clearOfflineRecords();
              refreshOfflineCount();
              setIsLoading(false);
              showAlert('Semua data offline berhasil disinkronkan ke Spreadsheet!', '✅');
              loadDashboard(shift);
            }
          })
          .simpanDataDinamis(rec.unit, rec.data, rec.petugas, rec.lokasi, rec.shift);
      });
    } else {
      // Local sync
      setTimeout(() => {
        records.forEach((rec) => {
          saveLocalUnitData(rec.unit, rec.data);
        });
        clearOfflineRecords();
        refreshOfflineCount();
        setIsLoading(false);
        showAlert('Semua data offline berhasil disinkronkan!', '✅');
        loadDashboard(shift);
      }, 500);
    }
  };

  // Generate WA Report using official requested posko format
  const handleGenerateWA = () => {
    const text = generateLaporanWA(shift, dashboardState, dataLengkap);
    setWaReportText(text);
    setIsWaModalOpen(true);

    try {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (e) {
      console.error('Failed to open WhatsApp window directly', e);
    }
  };

  // Overall stats for home screen
  const completedStats = {
    ok: MASTER_UNITS.filter((u) => dashboardState[u.id]?.status === 'OK').length,
    total: MASTER_UNITS.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-slate-100 flex flex-col justify-between py-6 sm:py-10 px-4 sm:px-6">
      {/* Centered Main Shell */}
      <div className="w-full max-w-3xl mx-auto">
        <NavigationHeader
          offlineCount={offlineCount}
          onSyncOffline={handleSyncOffline}
          isSpreadsheetConnected={isSpreadsheetConnected}
          onOpenSpreadsheetConfig={() => setIsSpreadsheetModalOpen(true)}
        />

        {/* Dynamic Animated Steps with Cartoon Spring Physics */}
        <AnimatePresence mode="wait">
          {step === 'HOME' && (
            <motion.div
              key="step-home"
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -15 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              <StepHome
                onSelectShift={handleSelectShift}
                onOpenBriefing={handleOpenBriefing}
                completedStats={completedStats}
              />
            </motion.div>
          )}

          {step === 'BRIEFING' && (
            <motion.div
              key="step-briefing"
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -15 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              <StepBriefing
                onBack={() => setStep('HOME')}
                onShowAlert={showAlert}
              />
            </motion.div>
          )}

          {step === 'DASHBOARD' && (
            <motion.div
              key="step-dashboard"
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -15 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              <StepDashboard
                shift={shift}
                dashboardState={dashboardState}
                onRefresh={() => loadDashboard(shift)}
                isLoading={isLoading}
                onMulaiInput={handleMulaiInput}
                onMulaiEdit={handleMulaiEdit}
                onGantiShift={() => setStep('HOME')}
                onGenerateWA={handleGenerateWA}
              />
            </motion.div>
          )}

          {step === 'OFFICERS' && (
            <motion.div
              key="step-officers"
              initial={{ opacity: 0, scale: 0.94, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.94, x: -20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              <StepOfficers
                location={location}
                selectedOfficers={selectedOfficers}
                onToggleOfficer={handleToggleOfficer}
                onContinue={handleContinueToForm}
                onBack={() => setStep('DASHBOARD')}
                onShowAlert={showAlert}
              />
            </motion.div>
          )}

          {step === 'INSPECTION' && (
            <motion.div
              key="step-inspection"
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -15 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              <StepInspectionForm
                location={location}
                shift={shift}
                officers={selectedOfficers.join(' , ')}
                selectedOfficers={selectedOfficers}
                onUpdateOfficers={(newOff) => {
                  setSelectedOfficers(newOff);
                  saveStoredOfficers(location, shift, newOff);
                }}
                selectedUnitId={selectedUnitId}
                locationUnits={MASTER_UNITS.filter((u) => u.location === location)}
                dashboardState={dashboardState}
                dataLengkap={dataLengkap}
                onSelectUnit={(id) => setSelectedUnitId(id)}
                onSave={handleSaveInspection}
                onBack={() => {
                  setStep('DASHBOARD');
                  loadDashboard(shift);
                }}
                onGenerateWA={handleGenerateWA}
                isSaving={isSaving}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-center text-xs text-slate-400 font-medium">
        <span>© {new Date().getFullYear()} PLN Posko Siaga Wakil Presiden RI • Sistem Monitoring Operasional Handal</span>
      </footer>

      {/* WhatsApp Report Preview & Action Modal */}
      <WhatsAppPreviewModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        reportText={waReportText}
        shift={shift}
      />

      {/* Google Spreadsheet Setup Modal */}
      <SpreadsheetModal
        isOpen={isSpreadsheetModalOpen}
        onClose={() => setIsSpreadsheetModalOpen(false)}
        onConnectionUpdated={() => {
          setIsSpreadsheetConnected(isSpreadsheetConfigured());
          loadDashboard(shift);
        }}
      />

      {/* Custom Cartoon Modal Alert */}
      <CartoonModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        icon={modalState.icon}
        onClose={closeModal}
      />
    </div>
  );
}

