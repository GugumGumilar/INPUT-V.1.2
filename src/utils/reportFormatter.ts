import { InspectionData, ShiftType, UnitStatus } from '../types';
import { getStoredOfficers, hitungKonversiMenit, getLocalUnitData } from './storage';

export function formatTanggalIndonesia(date = new Date()): string {
  const bulanIndo = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];
  return `${date.getDate()} ${bulanIndo[date.getMonth()]} ${date.getFullYear()}`;
}

function formatJam(jam?: string): string {
  if (!jam || jam === '-') {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm} WIB`;
  }
  const clean = jam.trim();
  return clean.toUpperCase().endsWith('WIB') ? clean : `${clean} WIB`;
}

function getBackupHoursMinutes(data?: InspectionData): { jam: number; menit: number } {
  if (!data) return { jam: 0, menit: 0 };
  if (data.Backup_Hours !== undefined && data.Backup_Minutes !== undefined) {
    return { jam: Number(data.Backup_Hours) || 0, menit: Number(data.Backup_Minutes) || 0 };
  }
  const conv = hitungKonversiMenit(data.Backup_Total_Minutes || 0);
  return { jam: conv.jam, menit: conv.menit };
}

function isAlarmActive(alarmValue?: string): boolean {
  if (!alarmValue) return false;
  const upper = alarmValue.trim().toUpperCase();
  return upper === 'ALARM' || upper === 'TIDAK NORMAL' || upper === 'TRIP';
}

function getUnitDataWithFallback(
  unitId: string,
  dataMap: Record<string, InspectionData>,
  shift?: ShiftType
): InspectionData {
  if (dataMap[unitId] && Object.keys(dataMap[unitId]).length > 0) {
    return dataMap[unitId];
  }
  const local = getLocalUnitData(unitId, shift);
  return local || {};
}

export function generateLaporanWA(
  shift: ShiftType,
  dashboardState: Record<string, UnitStatus>,
  dataMap: Record<string, InspectionData> = {}
): string {
  const tanggalFormatted = formatTanggalIndonesia(new Date());

  // Petugas & Jam Wapres
  const officersWapresList = getStoredOfficers('WAPRES', shift);
  const wapresOfficersStr = officersWapresList.length > 0
    ? officersWapresList.map((o) => o.toUpperCase()).join(' , ')
    : (dataMap['Wapres_Gardu_D126']?.Nama_Petugas || 'PETUGAS PIKET WAPRES').toUpperCase();

  const jamWapresRaw = dashboardState['Wapres_Gardu_D126']?.jam
    || dashboardState['Wapres_UPS_30']?.jam
    || dashboardState['Wapres_UPS_40']?.jam
    || dashboardState['Wapres_UPS_60']?.jam;
  const jamWapres = formatJam(jamWapresRaw);

  // Petugas & Jam Rumdin
  const officersRumdinList = getStoredOfficers('RUMDIN', shift);
  const rumdinOfficersStr = officersRumdinList.length > 0
    ? officersRumdinList.map((o) => o.toUpperCase()).join(' , ')
    : (dataMap['Rumdin_Situbondo']?.Nama_Petugas || 'PETUGAS PIKET RUMDIN').toUpperCase();

  const jamRumdinRaw = dashboardState['Rumdin_Situbondo']?.jam
    || dashboardState['Rumdin_Dipo']?.jam
    || dashboardState['Rumdin_UPS_40']?.jam
    || dashboardState['Rumdin_UPS_100']?.jam;
  const jamRumdin = formatJam(jamRumdinRaw);

  // Unit Datasets
  const uWapres30 = getUnitDataWithFallback('Wapres_UPS_30', dataMap, shift);
  const uWapres40 = getUnitDataWithFallback('Wapres_UPS_40', dataMap, shift);
  const uWapres60 = getUnitDataWithFallback('Wapres_UPS_60', dataMap, shift);
  const uWapresGardu = getUnitDataWithFallback('Wapres_Gardu_D126', dataMap, shift);

  const uRumdinDipo = getUnitDataWithFallback('Rumdin_Dipo', dataMap, shift);
  const uRumdinST12 = getUnitDataWithFallback('Rumdin_Situbondo', dataMap, shift);
  const uRumdinUPS40 = getUnitDataWithFallback('Rumdin_UPS_40', dataMap, shift);
  const uRumdinUPS100 = getUnitDataWithFallback('Rumdin_UPS_100', dataMap, shift);

  // Backup times
  const bk30 = getBackupHoursMinutes(uWapres30);
  const bk40 = getBackupHoursMinutes(uWapres40);
  const bk60 = getBackupHoursMinutes(uWapres60);
  const bkRumdin40 = getBackupHoursMinutes(uRumdinUPS40);
  const bkRumdin100 = getBackupHoursMinutes(uRumdinUPS100);

  const lines: string[] = [];

  // Header Title
  lines.push(`*LAPORAN MONITORING SHIFT ${shift.toUpperCase()}*`);
  lines.push('');

  // 1. Wapres Overview
  lines.push('======================');
  lines.push('*_Pantauan UPS Dan ACO TM Gardu D 126 SetWapres_*');
  lines.push('======================');
  lines.push('Nama petugas : ');
  lines.push(wapresOfficersStr);
  lines.push('Tanggal : ');
  lines.push(tanggalFormatted);
  lines.push('Jam Inspeksi : ');
  lines.push(jamWapres);
  lines.push('');

  // 2. Pantauan Beban UPS 30 KVA
  lines.push('======================');
  lines.push('*_Pantauan Beban UPS 30 KVA_*');
  lines.push('======================');
  lines.push('BEBAN UPS 30 KVA :');
  lines.push(`R  : ${uWapres30.Arus_R || '-'} A`);
  lines.push(`S  : ${uWapres30.Arus_S || '-'} A`);
  lines.push(`T  : ${uWapres30.Arus_T || '-'} A`);
  lines.push('');
  lines.push('Tegangan UPS (V) :');
  lines.push(`R-N: ${uWapres30.Volt_RN || '-'} V`);
  lines.push(`S-N: ${uWapres30.Volt_SN || '-'} V`);
  lines.push(`T-N: ${uWapres30.Volt_TN || '-'} V`);
  lines.push('');
  lines.push(`R-S: ${uWapres30.Volt_RS || '-'} V`);
  lines.push(`R-T: ${uWapres30.Volt_RT || '-'} V`);
  lines.push(`S-T: ${uWapres30.Volt_ST || '-'} V`);
  lines.push('');
  lines.push('Temperatur UPS : ');
  lines.push(`${uWapres30.Temperatur_UPS || '-'} °C`);
  lines.push('');
  lines.push('Alarm UPS : ');
  lines.push(uWapres30.Alarm_UPS || 'NORMAL');
  lines.push('');
  lines.push('Back Up Time UPS : ');
  lines.push(`Hours  : ${bk30.jam} Jam`);
  lines.push(`Minutes: ${bk30.menit} Menit`);
  lines.push('');
  lines.push('Keterangan : ');
  lines.push(uWapres30.Keterangan || '-');
  lines.push('');

  // 3. Pantauan Beban UPS 40 KVA (Wapres)
  lines.push('======================');
  lines.push('*_Pantauan Beban UPS 40 KVA_*');
  lines.push('======================');
  lines.push('BEBAN UPS 40 KVA :');
  lines.push(`R  : ${uWapres40.Arus_R || '-'} A`);
  lines.push(`S  : ${uWapres40.Arus_S || '-'} A`);
  lines.push(`T  : ${uWapres40.Arus_T || '-'} A`);
  lines.push('');
  lines.push('Tegangan UPS (V) :');
  lines.push(`R-N: ${uWapres40.Volt_RN || '-'} V`);
  lines.push(`S-N: ${uWapres40.Volt_SN || '-'} V`);
  lines.push(`T-N: ${uWapres40.Volt_TN || '-'} V`);
  lines.push('');
  lines.push(`R-S: ${uWapres40.Volt_RS || '-'} V`);
  lines.push(`R-T: ${uWapres40.Volt_RT || '-'} V`);
  lines.push(`S-T: ${uWapres40.Volt_ST || '-'} V`);
  lines.push('');
  lines.push('Temperatur UPS : ');
  lines.push(`${uWapres40.Temperatur_UPS || '-'} °C`);
  lines.push('');
  lines.push('Alarm UPS : ');
  lines.push(uWapres40.Alarm_UPS || 'NORMAL');
  lines.push('');
  lines.push('Back Up Time UPS : ');
  lines.push(`Hours  : ${bk40.jam} Jam`);
  lines.push(`Minutes: ${bk40.menit} Menit`);
  lines.push('');
  lines.push('Keterangan : ');
  lines.push(uWapres40.Keterangan || '-');
  lines.push('');

  // 4. Pantauan Beban UPS 60 KVA (Wapres)
  lines.push('======================');
  lines.push('*_Pantauan Beban UPS 60 KVA_*');
  lines.push('======================');
  lines.push('BEBAN UPS 60 KVA :');
  lines.push(`R  : ${uWapres60.Arus_R || '-'} A`);
  lines.push(`S  : ${uWapres60.Arus_S || '-'} A`);
  lines.push(`T  : ${uWapres60.Arus_T || '-'} A`);
  lines.push('');
  lines.push('Tegangan UPS (V) :');
  lines.push(`R-N: ${uWapres60.Volt_RN || '-'} V`);
  lines.push(`S-N: ${uWapres60.Volt_SN || '-'} V`);
  lines.push(`T-N: ${uWapres60.Volt_TN || '-'} V`);
  lines.push('');
  lines.push(`R-S: ${uWapres60.Volt_RS || '-'} V`);
  lines.push(`R-T: ${uWapres60.Volt_RT || '-'} V`);
  lines.push(`S-T: ${uWapres60.Volt_ST || '-'} V`);
  lines.push('');
  lines.push('Temperatur UPS : ');
  lines.push(`${uWapres60.Temperatur_UPS || '-'} °C`);
  lines.push('');
  lines.push('Alarm UPS : ');
  lines.push(uWapres60.Alarm_UPS || 'NORMAL');
  lines.push('');
  lines.push('Back Up Time UPS : ');
  lines.push(`Hours  : ${bk60.jam} Jam`);
  lines.push(`Minutes: ${bk60.menit} Menit`);
  lines.push('');
  lines.push('Keterangan : ');
  lines.push(uWapres60.Keterangan || '-');
  lines.push('');

  // 5. Pantauan ACO TM Gardu D 126 SetWapres
  lines.push('======================');
  lines.push('*_Pantauan ACO TM Gardu D 126 SetWapres_*');
  lines.push('======================');
  lines.push('Status Penyulang : ');
  lines.push(`ClOSE ( // ) : ${uWapresGardu.Status_Penyulang_CLOSE || 'P HAYAM WURUK GI GAMBIR LAMA'}`);
  lines.push(`OPEN ( # ) : ${uWapresGardu.Status_Penyulang_OPEN || 'KOPEL ACO (GH41 P HONGKONG GI BUDI KEMULIAAN)'}`);
  lines.push('');
  lines.push('Alarm Status : ');
  lines.push(`ALARM  : ${isAlarmActive(uWapresGardu.Global_Alarm) ? 'ALARM' : '-'}`);
  lines.push(`NORMAL : ${isAlarmActive(uWapresGardu.Global_Alarm) ? '-' : 'NORMAL'}`);
  lines.push('');
  lines.push('Power ACO :');
  lines.push(`ON  : ${uWapresGardu.Global_Power === 'OFF' ? '-' : 'ON'}`);
  lines.push(`OFF : ${uWapresGardu.Global_Power === 'OFF' ? 'OFF' : '-'}`);
  lines.push('');
  lines.push('Status Charging Kubikel :');
  lines.push(`Ya    : ${uWapresGardu.Global_Charging === 'TIDAK' ? '-' : 'YA'}`);
  lines.push(`Tidak : ${uWapresGardu.Global_Charging === 'TIDAK' ? 'TIDAK' : '-'}`);
  lines.push('');
  lines.push('Status Remote Kubikel :');
  lines.push(`Local  : ${uWapresGardu.Global_Remote === 'LOCAL' ? 'LOCAL' : '-'}`);
  lines.push(`Auto   : ${uWapresGardu.Global_Remote === 'LOCAL' ? '-' : 'AUTO'}`);
  lines.push('');
  lines.push('Lampu Indikator :');
  lines.push(`On   : ${uWapresGardu.Global_Lampu === 'OFF' ? '-' : 'ON'}`);
  lines.push(`Off  : ${uWapresGardu.Global_Lampu === 'OFF' ? 'OFF' : '-'}`);
  lines.push('');
  lines.push('Keterangan : ');
  lines.push(uWapresGardu.Keterangan || '-');
  lines.push('');

  // 6. Rumdin Overview
  lines.push('=========================');
  lines.push('*_Pantauan UPS Dan ACO TR Rumdin Wapres_* ');
  lines.push('=========================');
  lines.push('Nama Petugas : ');
  lines.push(rumdinOfficersStr);
  lines.push('Tanggal : ');
  lines.push(tanggalFormatted);
  lines.push('Jam Inspeksi : ');
  lines.push(jamRumdin);
  lines.push('');

  // 7. Pantauan UPS Dan ACO TR Rumdin Wapres (Dipo)
  lines.push('=========================');
  lines.push('*_Pantauan UPS Dan ACO TR Rumdin Wapres (Dipo)_*');
  lines.push('=========================');
  lines.push('Status ACO TR :');
  lines.push('Gardu T135 ');
  lines.push(`Close ( // )/Open ( # ) : ${uRumdinDipo.Status_T135 || 'OPEN'}`);
  lines.push('Gardu T15N ');
  lines.push(`Close ( // ) /Open ( # ) : ${uRumdinDipo.Status_T15N || 'CLOSE'}`);
  lines.push('');
  lines.push('Alarm Status :');
  lines.push(`Alarm  : ${isAlarmActive(uRumdinDipo.Global_Alarm) ? 'ALARM' : '-'}`);
  lines.push(`Normal : ${isAlarmActive(uRumdinDipo.Global_Alarm) ? '-' : 'NORMAL'}`);
  lines.push('');
  lines.push('Status Power ACO TR (Dipo) :');
  lines.push(`On   : ${uRumdinDipo.Global_Power === 'OFF' ? '-' : 'ON'}`);
  lines.push(`OFF  : ${uRumdinDipo.Global_Power === 'OFF' ? 'OFF' : '-'}`);
  lines.push('');
  lines.push('Lampu Indikator :');
  lines.push(`On   : ${uRumdinDipo.Global_Lampu === 'OFF' ? '-' : 'ON'}`);
  lines.push(`Off  : ${uRumdinDipo.Global_Lampu === 'OFF' ? 'OFF' : '-'}`);
  lines.push('');
  lines.push('Keterangan : ');
  lines.push(uRumdinDipo.Keterangan || '-');
  lines.push('');

  // 8. Pantauan Inpeksi ACO TR Rumdin Wapres (ST12)
  lines.push('=========================');
  lines.push('*_Pantauan Inpeksi ACO TR Rumdin Wapres (ST12)_*');
  lines.push('=========================');
  lines.push('Status ACO TR :');
  lines.push(`Close ( // ) : ${uRumdinST12.Status_Sumber_CLOSE || 'GARDU T93'}`);
  lines.push(`Open ( # )  : ${uRumdinST12.Status_Sumber_OPEN || 'GARDU T10B'}`);
  lines.push('');
  lines.push('Alarm Status :');
  lines.push(`Alarm  : ${isAlarmActive(uRumdinST12.Global_Alarm) ? 'ALARM' : '-'}`);
  lines.push(`Normal : ${isAlarmActive(uRumdinST12.Global_Alarm) ? '-' : 'NORMAL'}`);
  lines.push('');
  lines.push('Status Power ACO TR ST 12 :');
  lines.push(`On  : ${uRumdinST12.Global_Power === 'OFF' ? '-' : 'ON'}`);
  lines.push(`Off : ${uRumdinST12.Global_Power === 'OFF' ? 'OFF' : '-'}`);
  lines.push('');
  lines.push('Lampu Indikator :');
  lines.push(`On  : ${uRumdinST12.Global_Lampu === 'OFF' ? '-' : 'ON'}`);
  lines.push(`Off : ${uRumdinST12.Global_Lampu === 'OFF' ? 'OFF' : '-'}`);
  lines.push('');
  lines.push('Keterangan : ');
  lines.push(uRumdinST12.Keterangan || '-');
  lines.push('');

  // 9. Pantauan Beban UPS 40 KVA RUMDIN (Dipo)
  lines.push('======================');
  lines.push('*_Pantauan Beban UPS 40 KVA RUMDIN (Dipo)_*');
  lines.push('======================');
  lines.push('BEBAN UPS 40 KVA RUMDIN (Dipo) :');
  lines.push(`R: ${uRumdinUPS40.Arus_R || '-'} A`);
  lines.push(`S: ${uRumdinUPS40.Arus_S || '-'} A`);
  lines.push(`T: ${uRumdinUPS40.Arus_T || '-'} A`);
  lines.push('');
  lines.push('Tegangan UPS (V) :');
  lines.push(`R-N: ${uRumdinUPS40.Volt_RN || '-'} V`);
  lines.push(`S-N: ${uRumdinUPS40.Volt_SN || '-'} V`);
  lines.push(`T-N: ${uRumdinUPS40.Volt_TN || '-'} V`);
  lines.push('');
  lines.push(`R-S: ${uRumdinUPS40.Volt_RS || '-'} V`);
  lines.push(`R-T: ${uRumdinUPS40.Volt_RT || '-'} V`);
  lines.push(`S-T: ${uRumdinUPS40.Volt_ST || '-'} V`);
  lines.push('');
  lines.push('Temperatur UPS : ');
  lines.push(`${uRumdinUPS40.Temperatur_UPS || '-'} °C`);
  lines.push('');
  lines.push('Alarm UPS : ');
  lines.push(uRumdinUPS40.Alarm_UPS || 'NORMAL');
  lines.push('');
  lines.push('Back Up Time UPS : ');
  lines.push(`Hours  : ${bkRumdin40.jam} Jam`);
  lines.push(`Minutes: ${bkRumdin40.menit} Menit`);
  lines.push('');
  lines.push('Keterangan : ');
  lines.push(uRumdinUPS40.Keterangan || '-');
  lines.push('');

  // 10. Pantauan Beban UPS 100 KVA RUMDIN (ST12)
  lines.push('======================');
  lines.push('*_Pantauan Beban UPS 100 KVA RUMDIN (ST12)_*');
  lines.push('======================');
  lines.push('BEBAN UPS 100 KVA RUMDIN (ST12) :');
  lines.push(`R: ${uRumdinUPS100.Arus_R || '-'} A`);
  lines.push(`S: ${uRumdinUPS100.Arus_S || '-'} A`);
  lines.push(`T: ${uRumdinUPS100.Arus_T || '-'} A`);
  lines.push('');
  lines.push('Tegangan UPS (V) :');
  lines.push(`R-N: ${uRumdinUPS100.Volt_RN || '-'} V`);
  lines.push(`S-N: ${uRumdinUPS100.Volt_SN || '-'} V`);
  lines.push(`T-N: ${uRumdinUPS100.Volt_TN || '-'} V`);
  lines.push('');
  lines.push(`R-S: ${uRumdinUPS100.Volt_RS || '-'} V`);
  lines.push(`R-T: ${uRumdinUPS100.Volt_RT || '-'} V`);
  lines.push(`S-T: ${uRumdinUPS100.Volt_ST || '-'} V`);
  lines.push('');
  lines.push('Temperatur UPS : ');
  lines.push(`${uRumdinUPS100.Temperatur_UPS || '-'} °C`);
  lines.push('');
  lines.push('Alarm UPS : ');
  lines.push(uRumdinUPS100.Alarm_UPS || 'NORMAL');
  lines.push('');
  lines.push('Back Up Time UPS : ');
  lines.push(`Hours  : ${bkRumdin100.jam} Jam`);
  lines.push(`Minutes: ${bkRumdin100.menit} Menit`);
  lines.push('');
  lines.push('Keterangan : ');
  lines.push(uRumdinUPS100.Keterangan || '-');
  lines.push('');

  // Footer
  lines.push('*_Terimakasih_*');

  return lines.join('\n');
}
