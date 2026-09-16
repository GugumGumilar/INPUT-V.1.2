import { MASTER_UNITS } from '../data/constants';
import { InspectionData, LocationType, OfflineRecord, ShiftType, UnitStatus } from '../types';

const STORAGE_KEY_OFFLINE = 'ups_offline_storage';
const STORAGE_KEY_DASHBOARD = 'pln_wapres_dashboard_state';
const STORAGE_KEY_DATA = 'pln_wapres_data_lengkap';

export function hitungKonversiMenit(m: number | string): { jam: number; menit: number; teks: string } {
  const num = typeof m === 'number' ? m : parseInt(m, 10);
  if (isNaN(num) || num < 0) {
    return { jam: 0, menit: 0, teks: '0 Jam 0 Menit' };
  }
  const jam = Math.floor(num / 60);
  const menit = num % 60;
  return {
    jam,
    menit,
    teks: `${jam} Jam ${menit} Menit`
  };
}

export function getOfflineRecords(): OfflineRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading offline storage', e);
    return [];
  }
}

export function saveOfflineRecord(record: Omit<OfflineRecord, 'id' | 'timestamp'>): OfflineRecord[] {
  const current = getOfflineRecords();
  const newRecord: OfflineRecord = {
    ...record,
    id: 'offline_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now()
  };
  const updated = [...current, newRecord];
  try {
    localStorage.setItem(STORAGE_KEY_OFFLINE, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving offline record', e);
  }
  return updated;
}

export function clearOfflineRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_OFFLINE);
  } catch (e) {
    console.error('Error clearing offline records', e);
  }
}

// Local simulation fallback for dashboard data
export function getLocalDashboardState(shift: ShiftType): Record<string, UnitStatus> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_DASHBOARD}_${shift}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading dashboard state', e);
  }

  // Default state: all units start as BELUM
  const defaultState: Record<string, UnitStatus> = {};
  MASTER_UNITS.forEach((unit) => {
    defaultState[unit.id] = {
      status: 'BELUM',
      jam: '-'
    };
  });

  saveLocalDashboardState(shift, defaultState);
  return defaultState;
}

export function getStoredOfficers(location: LocationType, shift: ShiftType): string[] {
  try {
    const raw = localStorage.getItem(`pln_officers_${location}_${shift}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredOfficers(location: LocationType, shift: ShiftType, officers: string[]): void {
  try {
    localStorage.setItem(`pln_officers_${location}_${shift}`, JSON.stringify(officers));
  } catch (e) {
    console.error('Error saving officers', e);
  }
}

export function saveLocalDashboardState(shift: ShiftType, state: Record<string, UnitStatus>): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_DASHBOARD}_${shift}`, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving dashboard state', e);
  }
}

export function getLocalUnitData(unitId: string, shift?: ShiftType): InspectionData | null {
  try {
    if (shift) {
      const rawShift = localStorage.getItem(`${STORAGE_KEY_DATA}_${shift}_${unitId}`);
      if (rawShift) return JSON.parse(rawShift);
    }
    const raw = localStorage.getItem(`${STORAGE_KEY_DATA}_${unitId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveLocalUnitData(unitId: string, data: InspectionData, shift?: ShiftType): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_DATA}_${unitId}`, JSON.stringify(data));
    if (shift) {
      localStorage.setItem(`${STORAGE_KEY_DATA}_${shift}_${unitId}`, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Error saving unit data', e);
  }
}
