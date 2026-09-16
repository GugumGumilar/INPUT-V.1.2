import { InspectionData, LocationType, ShiftType, UnitStatus } from '../types';

export const DEFAULT_SPREADSHEET_URL = 'https://script.google.com/macros/s/AKfycbzRvLt9G6ryW53gWu-VNzVsaU_3JOYM3VZ7jWsiELHTQJCS7itls6R-p1Ot8eHSIbys0g/exec';

const STORAGE_KEY_SPREADSHEET_URL = 'pln_spreadsheet_webapp_url';

export function getSpreadsheetUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SPREADSHEET_URL);
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }
  } catch (e) {
    console.error(e);
  }
  return (import.meta as any).env?.VITE_SPREADSHEET_URL || DEFAULT_SPREADSHEET_URL;
}

export function setSpreadsheetUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SPREADSHEET_URL, url.trim());
  } catch (e) {
    console.error(e);
  }
}

export function isSpreadsheetConfigured(): boolean {
  const url = getSpreadsheetUrl();
  return url.startsWith('https://script.google.com/macros/s/');
}

export async function testSpreadsheetConnection(url?: string): Promise<{ success: boolean; message: string }> {
  const targetUrl = url || getSpreadsheetUrl();
  if (!targetUrl || !targetUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: 'Format URL tidak valid. Harus diawali dengan https://script.google.com/macros/s/.../exec'
    };
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'ping'
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: data.message || 'Koneksi ke Google Spreadsheet berhasil!'
      };
    } else {
      return {
        success: false,
        message: `Server merespon dengan status ${res.status}`
      };
    }
  } catch (e: any) {
    // Note: Apps Script redirect with CORS might throw TypeError in standard browser fetch if not configured with ContentService
    return {
      success: false,
      message: e?.message || 'Gagal menghubungi Google Apps Script. Pastikan Web App di-deploy dengan akses "Anyone" (Siapa saja).'
    };
  }
}

export async function fetchSpreadsheetProgress(shift: ShiftType): Promise<{
  dashboard?: Record<string, UnitStatus>;
  dataLengkap?: Record<string, InspectionData>;
  tglOperasional?: string;
  jamSekarang?: number;
} | null> {
  const url = getSpreadsheetUrl();
  if (!url) return null;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'ambilProgresHarian',
        shift: shift
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let json = await res.json();
    if (typeof json === 'string') {
      try {
        json = JSON.parse(json);
      } catch (err) {
        console.error('Failed to parse inner JSON string', err);
      }
    }
    return json;
  } catch (e) {
    console.warn('Gagal memuat progres dari Google Spreadsheet, menggunakan penyimpanan lokal', e);
    return null;
  }
}

export async function saveSpreadsheetInspection(
  unit: string,
  data: InspectionData,
  petugas: string,
  lokasi: LocationType,
  shift: ShiftType
): Promise<{ success: boolean; message: string }> {
  const url = getSpreadsheetUrl();
  if (!url) {
    return { success: false, message: 'URL Spreadsheet belum dikonfigurasi' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'simpanDataDinamis',
        unit: unit,
        data: data,
        petugas: petugas,
        lokasi: lokasi,
        shift: shift
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    return {
      success: result.status === 'BERHASIL' || result.success === true,
      message: result.message || (result === 'BERHASIL' ? 'Berhasil' : 'Tersimpan')
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || 'Gagal mengirim data ke Google Spreadsheet.'
    };
  }
}

/**
 * Potongan fungsi doPost yang tinggal ditempelkan ke Apps Script yang sudah ada
 */
export const GOOGLE_APPS_SCRIPT_DOPOST_SNIPPET = `// ============================================================
// TEMPELKAN KODE INI KE DALAM APPS SCRIPT ANDA (DI PALING BAWAH)
// ============================================================
function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : "{}";
    var payload = JSON.parse(contents);
    var action = payload.action;

    if (action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "OK",
        message: "Koneksi Google Spreadsheet Berhasil dan Siap Digunakan!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "ambilProgresHarian") {
      var shift = payload.shift || "PAGI";
      var res = ambilProgresHarian(shift);
      return ContentService.createTextOutput(typeof res === "string" ? res : JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "simpanDataDinamis") {
      var status = simpanDataDinamis(
        payload.unit,
        payload.data,
        payload.petugas,
        payload.lokasi,
        payload.shift
      );
      return ContentService.createTextOutput(JSON.stringify({
        status: status,
        success: status === "BERHASIL",
        message: status
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "ERROR", message: "Aksi tidak dikenal: " + action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "ERROR", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * Script Google Apps Script resmi yang disesuaikan 100% dengan sheet LAPORAN_CETAK dan LAPORAN_CETAK_UPS pengguna
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * ============================================================
 * SCRIPT GOOGLE APPS SCRIPT: PLN POSKO WAKIL PRESIDEN
 * ============================================================
 * CARA MENGHUBUNGKAN:
 * 1. Buka Google Spreadsheet posko Anda.
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
 * 3. Anda cukup menambahkan fungsi "doPost(e)" dan "doGet(e)" di bawah ini
 *    ke dalam script Anda yang sudah ada, atau ganti seluruh isinya dengan script ini.
 * 4. Klik tombol "Simpan" (ikon disket).
 * 5. Klik "Terapkan" (Deploy) -> "Kelola penerapan" (Manage deployments)
 *    atau "Penerapan baru" (New deployment) -> Pilih jenis "Aplikasi Web" (Web App).
 *    - Jalankan sebagai: "Saya" (Me)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone) -> Wajib agar HP bisa kirim data!
 * 6. Salin URL Aplikasi Web (akhiran /exec) dan tempel ke aplikasi ini!
 */

// --- JEMBATAN API WEB (doPost & doGet) ---
function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : "{}";
    var payload = JSON.parse(contents);
    var action = payload.action;

    if (action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "OK",
        message: "Koneksi Google Spreadsheet Berhasil dan Siap Digunakan!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "ambilProgresHarian") {
      var shift = payload.shift || "PAGI";
      var res = ambilProgresHarian(shift);
      return ContentService.createTextOutput(typeof res === "string" ? res : JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "simpanDataDinamis") {
      var status = simpanDataDinamis(
        payload.unit,
        payload.data,
        payload.petugas,
        payload.lokasi,
        payload.shift
      );
      return ContentService.createTextOutput(JSON.stringify({
        status: status,
        success: status === "BERHASIL",
        message: status
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "ERROR", message: "Aksi tidak dikenal: " + action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "ERROR", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "OK",
    message: "Web App PLN Posko Wakil Presiden berjalan aktif!"
  })).setMimeType(ContentService.MimeType.JSON);
}

// 1. PENGGANTI SHEET UNIT (KAMUS PERTANYAAN FORM)
function getHeaders(namaUnit) {
  var headers = [];
  
  if (namaUnit.includes("UPS")) {
    headers = [
      "Arus_R", "Arus_S", "Arus_T", 
      "Volt_RN", "Volt_SN", "Volt_TN", 
      "Volt_RS", "Volt_RT", "Volt_ST", 
      "Temperatur_UPS", "Alarm_UPS", 
      "Backup_Hours", "Backup_Minutes", "Keterangan"
    ];
  } 
  else if (namaUnit === "Wapres_Gardu_D126") {
    headers = ["Status_Penyulang_CLOSE", "Status_Penyulang_OPEN", "Keterangan"];
  } 
  else if (namaUnit === "Rumdin_Situbondo") {
    headers = ["Status_Sumber_CLOSE", "Status_Sumber_OPEN", "Keterangan"];
  } 
  else if (namaUnit === "Rumdin_Dipo") {
    headers = ["Status_T135", "Status_T15N", "Keterangan"];
  }
  
  return headers;
}

// 2. FUNGSI SIMPAN (FOKUS KE LAPORAN CETAK SAJA)
function simpanDataDinamis(namaUnit, dataObj, namaPetugas, lokasi, shiftSesi) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sekarang = new Date();
    var jamSekarang = sekarang.getHours();
    
    // Logika Tanggal Operasional: Jika shift malam sebelum jam 8 pagi, hitung tanggal kemarin
    var tglOperasional = new Date();
    if (shiftSesi.toUpperCase() === "MALAM" && jamSekarang < 8) {
      tglOperasional.setDate(sekarang.getDate() - 1);
    }
    
    var jamSimpan = Utilities.formatDate(sekarang, "GMT+7", "HH:mm");

    // Langsung arahkan ke mapping laporan cetak
    if (namaUnit.toLowerCase().includes("ups")) {
      updateLaporanUPS(namaUnit, dataObj, namaPetugas, jamSimpan, shiftSesi, tglOperasional);
    } else {
      updateLaporanACO(namaUnit, dataObj, namaPetugas, jamSimpan, shiftSesi, tglOperasional);
    }

    return "BERHASIL";
  } catch (e) { 
    return "Error Server: " + e.toString(); 
  }
}

// 3. MAPPING KE LAPORAN_CETAK_UPS
function updateLaporanUPS(namaUnit, data, petugas, jam, shift, tglObj) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cetak = ss.getSheetByName("LAPORAN_CETAK_UPS");
  if (!cetak) return;

  var hariIni = tglObj.getDate(); 
  var shiftOffset = (shift.toUpperCase() === "SIANG") ? 1 : (shift.toUpperCase() === "MALAM" ? 2 : 0);
  var barisTarget = 0;

  if (namaUnit === "Wapres_UPS_30") barisTarget = 7 + ((hariIni - 1) * 3) + shiftOffset;
  else if (namaUnit === "Wapres_UPS_40") barisTarget = 107 + ((hariIni - 1) * 3) + shiftOffset;
  else if (namaUnit === "Wapres_UPS_60") barisTarget = 207 + ((hariIni - 1) * 3) + shiftOffset;
  else if (namaUnit === "Rumdin_UPS_40") barisTarget = 307 + ((hariIni - 1) * 3) + shiftOffset;
  else if (namaUnit === "Rumdin_UPS_100") barisTarget = 407 + ((hariIni - 1) * 3) + shiftOffset;

  if (barisTarget > 0) {
    cetak.getRange(barisTarget, 2).setValue(petugas);
    cetak.getRange(barisTarget, 4).setValue(jam + " WIB");
    cetak.getRange(barisTarget, 5, 1, 3).setValues([[data.Arus_R || 0, data.Arus_S || 0, data.Arus_T || 0]]).setNumberFormat('0.0" A"');
    cetak.getRange(barisTarget, 8, 1, 6).setValues([[data.Volt_RN || 0, data.Volt_SN || 0, data.Volt_TN || 0, data.Volt_RS || 0, data.Volt_RT || 0, data.Volt_ST || 0]]).setNumberFormat('0" V"');
    cetak.getRange(barisTarget, 14).setValue(data.Temperatur_UPS || 0).setNumberFormat('0" °C"');
    cetak.getRange(barisTarget, 15).setValue(data.Alarm_UPS || "NORMAL");
    cetak.getRange(barisTarget, 16).setValue(data.Backup_Hours || 0).setNumberFormat('0" Jam"');
    cetak.getRange(barisTarget, 17).setValue(data.Backup_Minutes || 0).setNumberFormat('0" Menit"');
    cetak.getRange(barisTarget, 18).setValue(data.Keterangan || "-");
  }
}

// 4. MAPPING KE LAPORAN_CETAK
function updateLaporanACO(namaUnit, data, petugas, jam, shift, tglObj) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cetak = ss.getSheetByName("LAPORAN_CETAK");
  if (!cetak) return;

  var hariIni = tglObj.getDate(); 
  var shiftOffset = (shift.toUpperCase() === "SIANG") ? 1 : (shift.toUpperCase() === "MALAM" ? 2 : 0);
  var barisTarget = 0;

  if (namaUnit.includes("Gardu") || namaUnit.includes("D126")) barisTarget = 6 + ((hariIni - 1) * 3) + shiftOffset;
  else if (namaUnit.includes("Situbondo")) barisTarget = 105 + ((hariIni - 1) * 3) + shiftOffset;
  else if (namaUnit.includes("Dipo")) barisTarget = 204 + ((hariIni - 1) * 3) + shiftOffset;

  if (barisTarget > 0) {
    cetak.getRange(barisTarget, 2).setValue(petugas);
    cetak.getRange(barisTarget, 4).setValue(jam + " WIB");

    var closeVal = data.Status_Penyulang_CLOSE || data.Status_Sumber_CLOSE || data.Status_T15N || "-";
    var openVal = data.Status_Penyulang_OPEN || data.Status_Sumber_OPEN || data.Status_T135 || "-";
    cetak.getRange(barisTarget, 5).setValue(closeVal);
    cetak.getRange(barisTarget, 6).setValue(openVal);

    // Pemetaan data gabungan ke kolom Excel Cetak
    cetak.getRange(barisTarget, 7).setValue(data.Global_Alarm === "TIDAK NORMAL" ? "ALARM" : "-");
    cetak.getRange(barisTarget, 8).setValue(data.Global_Alarm === "NORMAL" ? "NORMAL" : "-");
    cetak.getRange(barisTarget, 9).setValue(data.Global_Power === "ON" ? "ON" : "-");
    cetak.getRange(barisTarget, 10).setValue(data.Global_Power === "OFF" ? "OFF" : "-");
    cetak.getRange(barisTarget, 11).setValue(data.Global_Charging === "YA" ? "YA" : "-");
    cetak.getRange(barisTarget, 12).setValue(data.Global_Charging === "TIDAK" ? "TIDAK" : "-");
    cetak.getRange(barisTarget, 13).setValue(data.Global_Remote === "LOCAL" ? "LOCAL" : "-");
    cetak.getRange(barisTarget, 14).setValue(data.Global_Remote === "AUTO" ? "AUTO" : "-");
    cetak.getRange(barisTarget, 15).setValue(data.Global_Lampu === "ON" ? "ON" : "-");
    cetak.getRange(barisTarget, 16).setValue(data.Global_Lampu === "OFF" ? "OFF" : "-");

    cetak.getRange(barisTarget, 17).setValue(data.Keterangan || "-");
  }
}

// 5. DASHBOARD & PROGRES
function ambilProgresHarian(shiftTerpilih) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sekarang = new Date();
  var jamSekarang = sekarang.getHours();
  if (shiftTerpilih.toUpperCase() === "MALAM" && jamSekarang < 8) sekarang.setDate(sekarang.getDate() - 1);
  
  var hariIni = sekarang.getDate(); 
  var shiftOffset = (shiftTerpilih.toUpperCase() === "SIANG") ? 1 : (shiftTerpilih.toUpperCase() === "MALAM" ? 2 : 0);

  var mappingUnit = [
    { id: "Rumdin_Situbondo",  sheet: "LAPORAN_CETAK", start: 105 },
    { id: "Rumdin_Dipo",       sheet: "LAPORAN_CETAK", start: 204 },
    { id: "Rumdin_UPS_40",     sheet: "LAPORAN_CETAK_UPS", start: 307 },
    { id: "Rumdin_UPS_100",    sheet: "LAPORAN_CETAK_UPS", start: 407 },
    { id: "Wapres_Gardu_D126", sheet: "LAPORAN_CETAK", start: 6 },
    { id: "Wapres_UPS_30",     sheet: "LAPORAN_CETAK_UPS", start: 7 },
    { id: "Wapres_UPS_40",     sheet: "LAPORAN_CETAK_UPS", start: 107 },
    { id: "Wapres_UPS_60",     sheet: "LAPORAN_CETAK_UPS", start: 207 }
  ];

  var dashboard = {};
  var dataLengkap = {};

  mappingUnit.forEach(function(unit) {
    var sh = ss.getSheetByName(unit.sheet);
    if (!sh) return;
    var barisTarget = unit.start + ((hariIni - 1) * 3) + shiftOffset;
    var namaPetugas = sh.getRange(barisTarget, 2).getValue();
    var jamInspeksi = sh.getRange(barisTarget, 4).getValue();

    if (namaPetugas && namaPetugas.toString().trim() !== "" && namaPetugas.toString().trim() !== "-") {
      dashboard[unit.id] = { status: "OK", jam: jamInspeksi ? jamInspeksi.toString().replace(" WIB", "") : "-" };
      dataLengkap[unit.id] = ambilDataDariSheetCetak(unit, hariIni, shiftOffset, unit.id);
    } else {
      dashboard[unit.id] = { status: "BELUM", jam: "-" };
      dataLengkap[unit.id] = {};
    }
  });

  return JSON.stringify({ dashboard: dashboard, dataLengkap: dataLengkap });
}

function ambilDataDariSheetCetak(unitObj, hari, shiftOffset, namaUnit) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(unitObj.sheet);
  if (!sh) return {};
  var barisTarget = unitObj.start + ((hari - 1) * 3) + shiftOffset;
  var dataBaris = sh.getRange(barisTarget, 1, 1, 20).getValues()[0];
  var barisTgl = unitObj.start + ((hari - 1) * 3);
  var tglAsli = sh.getRange(barisTgl, 3).getValue();

  var obj = { Nama_Petugas: dataBaris[1], Tanggal: tglAsli, Jam_Inspeksi: dataBaris[3] };
  
  if (namaUnit.includes("UPS")) {
    obj["Arus_R"] = dataBaris[4]; obj["Arus_S"] = dataBaris[5]; obj["Arus_T"] = dataBaris[6];
    obj["Volt_RN"] = dataBaris[7]; obj["Volt_SN"] = dataBaris[8]; obj["Volt_TN"] = dataBaris[9];
    obj["Volt_RS"] = dataBaris[10]; obj["Volt_RT"] = dataBaris[11]; obj["Volt_ST"] = dataBaris[12];
    obj["Temperatur_UPS"] = dataBaris[13]; obj["Alarm_UPS"] = dataBaris[14];
    obj["Backup_Hours"] = dataBaris[15]; obj["Backup_Minutes"] = dataBaris[16];
    obj["Keterangan"] = dataBaris[17];
  } else {
    obj["Status_Penyulang_CLOSE"] = dataBaris[4]; obj["Status_Sumber_CLOSE"] = dataBaris[4]; obj["Status_T15N"] = dataBaris[4];
    obj["Status_Penyulang_OPEN"] = dataBaris[5]; obj["Status_Sumber_OPEN"] = dataBaris[5]; obj["Status_T135"] = dataBaris[5];
    obj["Alarm_Status_Tidak_Normal"] = dataBaris[6]; obj["Alarm_Status_Normal"] = dataBaris[7];
    obj["Status_Power_ACO_ON"] = dataBaris[8]; obj["Status_Power_ACO_OFF"] = dataBaris[9];
    obj["Status_Charging_Kubikel_YA"] = dataBaris[10]; obj["Status_Charging_Kubikel_TIDAK"] = dataBaris[11];
    obj["Status_Remote_Kubikel_LOCAL"] = dataBaris[12]; obj["Status_Remote_Kubikel_AUTO"] = dataBaris[13];
    obj["Lampu_Indikator_ON"] = dataBaris[14]; obj["Lampu_Indikator_OFF"] = dataBaris[15];
    obj["Keterangan"] = dataBaris[16];
  }
  return obj;
}
`;
