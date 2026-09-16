export type ShiftType = 'PAGI' | 'SIANG' | 'MALAM';

export type LocationType = 'RUMDIN' | 'WAPRES';

export interface UnitStatus {
  status: 'OK' | 'BELUM' | 'PENDING';
  jam: string;
  petugas?: string;
}

export interface UnitConfig {
  id: string;
  name: string;
  type: 'UPS' | 'GARDU';
  location: LocationType;
  description: string;
  capacity?: string;
}

export interface OfficerBriefing {
  nama: string;
  hp: string;
}

export interface InspectionData {
  // UPS fields
  Arus_R?: string;
  Arus_S?: string;
  Arus_T?: string;
  Volt_RN?: string;
  Volt_SN?: string;
  Volt_TN?: string;
  Volt_RS?: string;
  Volt_RT?: string;
  Volt_ST?: string;
  Temperatur_UPS?: string;
  Alarm_UPS?: string;
  Backup_Total_Minutes?: string;
  Backup_Hours?: number;
  Backup_Minutes?: number;

  // Non-UPS fields
  Status_Sumber_CLOSE?: string;
  Status_Sumber_OPEN?: string;
  Status_Penyulang_CLOSE?: string;
  Status_Penyulang_OPEN?: string;
  Status_T135?: string;
  Status_T15N?: string;
  Global_Alarm?: string;
  Global_Power?: string;
  Global_Charging?: string;
  Global_Remote?: string;
  Global_Lampu?: string;

  // Common
  Keterangan?: string;
  Nama_Petugas?: string;
  Waktu_Input?: string;
  [key: string]: any;
}

export interface OfflineRecord {
  id: string;
  unit: string;
  data: InspectionData;
  petugas: string;
  lokasi: LocationType;
  shift: ShiftType;
  timestamp: number;
}
