import { OfficerBriefing, UnitConfig } from '../types';

export const PETUGAS: string[] = [
  "ASEP",
  "DAMAR",
  "WINDHU",
  "JULIANTO",
  "M. HILAL",
  "SUTRA",
  "YUDHY",
  "PARID",
  "IYAN",
  "KRISTYANTO",
  "GUGUM",
  "INDRO",
  "HENDRI",
  "SENDI",
  "ISMANTO",
  "HALIM",
  "FAJAR",
  "AGEL"
];

export const SARAN_KETERANGAN: string[] = [
  "-",
  "AMAN TERKENDALI",
  "NORMAL",
  "Backup time ups tidak terbaca (harus di padamkan terlebih dahulu)",
  "PERLU PENGECEKAN LANJUT",
  "DALAM PERBAIKAN",
  "SUDAH DIPADAMKAN"
];

export const DROPS: Record<string, string[]> = {
  Status_Penyulang_CLOSE: [
    "P HAYAM WURUK GI GAMBIR LAMA",
    "KOPEL ACO (GH41 P HONGKONG GI BUDI KEMULIAAN)",
    "KOPEL ACO (KS19 P KALINGGA GI GAMBIR LAMA)",
    "KOPEL ACO (KS3A P REKANAN GI KEBON SIRIH)",
    "-"
  ],
  Status_Penyulang_OPEN: [
    "KOPEL ACO (GH41 P HONGKONG GI BUDI KEMULIAAN)",
    "P HAYAM WURUK GI GAMBIR LAMA",
    "KOPEL ACO (KS19 P KALINGGA GI GAMBIR LAMA)",
    "KOPEL ACO (KS3A P REKANAN GI KEBON SIRIH)",
    "-"
  ],
  Status_Sumber_CLOSE: ["GARDU T93", "GARDU T10B"],
  Status_Sumber_OPEN: ["GARDU T10B", "GARDU T93"],
  Status_T135: ["OPEN", "CLOSE"],
  Status_T15N: ["CLOSE", "OPEN"]
};

export const DATA_PETUGAS_BRIEFING: OfficerBriefing[] = [
  { nama: "Asep K", hp: "089669477147" },
  { nama: "Damar S Y", hp: "081389063562" },
  { nama: "Hendri P", hp: "082113118412" },
  { nama: "Sendi", hp: "089654800157" },
  { nama: "Gugum G", hp: "08892146641" },
  { nama: "Indro P", hp: "085729968119" },
  { nama: "Julianto L N", hp: "085794556859" },
  { nama: "Windhu W", hp: "089503918722" }
];

export const MASTER_UNITS: UnitConfig[] = [
  // Rumdin
  {
    id: "Rumdin_Situbondo",
    name: "Rumdin Situbondo",
    type: "GARDU",
    location: "RUMDIN",
    description: "Gardu Distribusi Situbondo Rumdin Wapres"
  },
  {
    id: "Rumdin_Dipo",
    name: "Rumdin Dipo",
    type: "GARDU",
    location: "RUMDIN",
    description: "Gardu Trafo & ATS Dipo Rumdin Wapres"
  },
  {
    id: "Rumdin_UPS_40",
    name: "Rumdin UPS 40 kVA",
    type: "UPS",
    location: "RUMDIN",
    capacity: "40 kVA",
    description: "Catu Daya Cadangan UPS 40 kVA Rumdin"
  },
  {
    id: "Rumdin_UPS_100",
    name: "Rumdin UPS 100 kVA",
    type: "UPS",
    location: "RUMDIN",
    capacity: "100 kVA",
    description: "Catu Daya Cadangan UPS 100 kVA Rumdin"
  },

  // Wapres
  {
    id: "Wapres_Gardu_D126",
    name: "Wapres Gardu D126",
    type: "GARDU",
    location: "WAPRES",
    description: "Gardu Hubung D126 Istana Wakil Presiden"
  },
  {
    id: "Wapres_UPS_30",
    name: "Wapres UPS 30 kVA",
    type: "UPS",
    location: "WAPRES",
    capacity: "30 kVA",
    description: "Sistem UPS 30 kVA Istana Wakil Presiden"
  },
  {
    id: "Wapres_UPS_40",
    name: "Wapres UPS 40 kVA",
    type: "UPS",
    location: "WAPRES",
    capacity: "40 kVA",
    description: "Sistem UPS 40 kVA Istana Wakil Presiden"
  },
  {
    id: "Wapres_UPS_60",
    name: "Wapres UPS 60 kVA",
    type: "UPS",
    location: "WAPRES",
    capacity: "60 kVA",
    description: "Sistem UPS 60 kVA Istana Wakil Presiden"
  }
];

export const HEADERS_CONFIG: Record<string, string[]> = {
  UPS: [
    "Arus_R", "Arus_S", "Arus_T",
    "Volt_RN", "Volt_SN", "Volt_TN",
    "Volt_RS", "Volt_RT", "Volt_ST",
    "Temperatur_UPS", "Alarm_UPS", "Backup_Total_Minutes",
    "Keterangan"
  ],
  GARDU_RUMDIN: [
    "Status_Sumber_CLOSE",
    "Status_Sumber_OPEN",
    "Status_Penyulang_CLOSE",
    "Status_Penyulang_OPEN",
    "Status_T135",
    "Status_T15N",
    "Global_Alarm",
    "Global_Power",
    "Keterangan"
  ],
  GARDU_WAPRES: [
    "Status_Sumber_CLOSE",
    "Status_Sumber_OPEN",
    "Status_Penyulang_CLOSE",
    "Status_Penyulang_OPEN",
    "Status_T135",
    "Status_T15N",
    "Global_Alarm",
    "Global_Power",
    "Global_Charging",
    "Global_Remote",
    "Keterangan"
  ]
};
