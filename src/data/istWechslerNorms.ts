/**
 * TABEL 22 & PENGGOLONGAN IQ WECHSLER RESMI IST
 * Berdasarkan Norma Konversi Standard Score (SS) IST ke IQ Wechsler dan Persentil (Semua Usia)
 */

export interface WechslerConversionItem {
  ss: number;
  iq: number;
  percentile: number;
}

export interface WechslerClassification {
  ssMin: number;
  ssMax: number;
  iqMin: number;
  iqMax: number;
  percentileMin: number;
  percentileMax: number;
  category: string;
  categoryAlt?: string;
  description: string;
}

/**
 * Tabel 22: Konversi Standard Score (SS) IST ke IQ Wechsler dan Persentil (Semua Usia)
 */
export const TABEL_22_WECHSLER_MAP: Record<number, { iq: number; percentile: number }> = {
  140: { iq: 160, percentile: 100 },
  139: { iq: 158, percentile: 100 },
  138: { iq: 157, percentile: 100 },
  137: { iq: 155, percentile: 100 },
  136: { iq: 154, percentile: 100 },
  135: { iq: 152, percentile: 100 },
  134: { iq: 151, percentile: 100 },
  133: { iq: 149, percentile: 100 },
  132: { iq: 145, percentile: 100 },
  131: { iq: 146, percentile: 100 },
  130: { iq: 145, percentile: 100 },
  129: { iq: 143, percentile: 100 },
  128: { iq: 142, percentile: 100 },
  127: { iq: 140, percentile: 100 },
  126: { iq: 139, percentile: 100 },
  125: { iq: 137, percentile: 99 },
  124: { iq: 136, percentile: 99 },
  123: { iq: 134, percentile: 99 },
  122: { iq: 133, percentile: 99 },
  121: { iq: 131, percentile: 98 },
  120: { iq: 130, percentile: 98 },
  119: { iq: 128, percentile: 97 },
  118: { iq: 127, percentile: 96 },
  117: { iq: 125, percentile: 95 },
  116: { iq: 124, percentile: 95 },
  115: { iq: 122, percentile: 93 },
  114: { iq: 121, percentile: 92 },
  113: { iq: 120, percentile: 90 },
  112: { iq: 118, percentile: 88 },
  111: { iq: 116, percentile: 86 },
  110: { iq: 115, percentile: 84 },
  109: { iq: 113, percentile: 81 },
  108: { iq: 112, percentile: 79 },
  107: { iq: 110, percentile: 76 },
  106: { iq: 109, percentile: 73 },
  105: { iq: 107, percentile: 70 },
  104: { iq: 106, percentile: 66 },
  103: { iq: 104, percentile: 62 },
  102: { iq: 103, percentile: 58 },
  101: { iq: 101, percentile: 54 },
  100: { iq: 100, percentile: 50 },
  99: { iq: 98, percentile: 46 },
  98: { iq: 97, percentile: 42 },
  97: { iq: 96, percentile: 38 },
  96: { iq: 94, percentile: 34 },
  95: { iq: 92, percentile: 30 },
  94: { iq: 91, percentile: 27 },
  93: { iq: 90, percentile: 24 },
  92: { iq: 88, percentile: 21 },
  91: { iq: 87, percentile: 18 },
  90: { iq: 85, percentile: 15 },
  89: { iq: 84, percentile: 14 },
  88: { iq: 82, percentile: 12 },
  87: { iq: 81, percentile: 10 },
  86: { iq: 79, percentile: 8 },
  85: { iq: 78, percentile: 7 },
  84: { iq: 76, percentile: 5 },
  83: { iq: 75, percentile: 4 },
  82: { iq: 73, percentile: 3 },
  81: { iq: 71, percentile: 2 },
  80: { iq: 70, percentile: 2 },
  79: { iq: 68, percentile: 1 },
  78: { iq: 67, percentile: 1 },
  77: { iq: 66, percentile: 1 },
  76: { iq: 64, percentile: 1 },
  75: { iq: 62, percentile: 0 },
  74: { iq: 61, percentile: 0 },
  73: { iq: 59, percentile: 0 },
  72: { iq: 58, percentile: 0 },
  71: { iq: 56, percentile: 0 },
  70: { iq: 55, percentile: 0 },
  69: { iq: 53, percentile: 0 },
  68: { iq: 52, percentile: 0 },
  67: { iq: 50, percentile: 0 },
  66: { iq: 49, percentile: 0 },
  65: { iq: 47, percentile: 0 },
  64: { iq: 46, percentile: 0 },
  63: { iq: 44, percentile: 0 },
  62: { iq: 43, percentile: 0 },
  61: { iq: 41, percentile: 0 },
  60: { iq: 40, percentile: 0 },
  59: { iq: 39, percentile: 0 },
  58: { iq: 37, percentile: 0 },
};

/**
 * Matriks Penggolongan IQ Berdasarkan Wechsler Resmi IST
 */
export const WECHSLER_CLASSIFICATIONS: WechslerClassification[] = [
  {
    ssMin: 120,
    ssMax: 200,
    iqMin: 130,
    iqMax: 200,
    percentileMin: 99,
    percentileMax: 100,
    category: 'Sangat Superior',
    description: 'Kapasitas intelektual istimewa, daya nalar sangat tinggi dan pemahaman komprehensif prima.',
  },
  {
    ssMin: 113,
    ssMax: 119,
    iqMin: 120,
    iqMax: 129,
    percentileMin: 90,
    percentileMax: 98,
    category: 'Superior',
    description: 'Kapasitas intelektual tinggi di atas sebagian besar populasi sebayanya, penalaran analitis kuat.',
  },
  {
    ssMin: 107,
    ssMax: 112,
    iqMin: 110,
    iqMax: 119,
    percentileMin: 76,
    percentileMax: 89,
    category: 'Di atas rata-rata',
    categoryAlt: 'Rata-rata Atas (Bright Normal)',
    description: 'Kapasitas intelektual di atas rata-rata umum, kemampuan adaptasi akademis sangat baik.',
  },
  {
    ssMin: 93,
    ssMax: 106,
    iqMin: 90,
    iqMax: 109,
    percentileMin: 24,
    percentileMax: 73,
    category: 'Rata - rata',
    categoryAlt: 'Rata-rata (Average)',
    description: 'Kapasitas intelektual berada pada rentang rata-rata populasi, memadai untuk tuntutan akademis standar.',
  },
  {
    ssMin: 87,
    ssMax: 92,
    iqMin: 80,
    iqMax: 89,
    percentileMin: 9,
    percentileMax: 23,
    category: 'Di bawah rata-rata',
    categoryAlt: 'Rata-rata Bawah (Dull Normal)',
    description: 'Kapasitas intelektual sedikit di bawah rata-rata, memerlukan bimbingan belajar bertahap.',
  },
  {
    ssMin: 80,
    ssMax: 86,
    iqMin: 70,
    iqMax: 79,
    percentileMin: 2,
    percentileMax: 8,
    category: 'Borderline',
    categoryAlt: 'Garis Batas (Borderline)',
    description: 'Kapasitas intelektual pada batas ambang, memerlukan pendampingan terstruktur khusus.',
  },
  {
    ssMin: 0,
    ssMax: 79,
    iqMin: 0,
    iqMax: 69,
    percentileMin: 0,
    percentileMax: 2,
    category: 'Intellectual Deficient',
    categoryAlt: 'Intelectual Deficient / Keterbelakangan',
    description: 'Kapasitas intelektual sangat terbatas, memerlukan program edukasi individual intensif.',
  },
];

/**
 * Konversi Standard Score IST ke IQ Wechsler, Persentil, dan Kategori Klasifikasi
 */
export function convertSsToWechsler(ssInput: number): {
  ss: number;
  iq: number;
  percentile: number;
  category: string;
  categoryAlt?: string;
  description: string;
} {
  const roundedSs = Math.round(ssInput);

  let iq = 100;
  let percentile = 50;

  if (roundedSs in TABEL_22_WECHSLER_MAP) {
    const item = TABEL_22_WECHSLER_MAP[roundedSs];
    iq = item.iq;
    percentile = item.percentile;
  } else if (roundedSs > 140) {
    // Di atas 140
    iq = 160;
    percentile = 100;
  } else if (roundedSs < 58) {
    // Di bawah 58
    iq = Math.max(30, 37 - (58 - roundedSs) * 1.5);
    percentile = 0;
  }

  // Tentukan kategori dari matriks Wechsler
  for (const item of WECHSLER_CLASSIFICATIONS) {
    if (roundedSs >= item.ssMin && roundedSs <= item.ssMax) {
      return {
        ss: roundedSs,
        iq,
        percentile,
        category: item.category,
        categoryAlt: item.categoryAlt,
        description: item.description,
      };
    }
  }

  // Fallback berdasarkan IQ jika di luar rentang SS
  if (iq >= 130) {
    return { ss: roundedSs, iq, percentile, category: 'Sangat Superior', description: WECHSLER_CLASSIFICATIONS[0].description };
  }
  if (iq >= 120) {
    return { ss: roundedSs, iq, percentile, category: 'Superior', description: WECHSLER_CLASSIFICATIONS[1].description };
  }
  if (iq >= 110) {
    return { ss: roundedSs, iq, percentile, category: 'Di atas rata-rata', description: WECHSLER_CLASSIFICATIONS[2].description };
  }
  if (iq >= 90) {
    return { ss: roundedSs, iq, percentile, category: 'Rata - rata', description: WECHSLER_CLASSIFICATIONS[3].description };
  }
  if (iq >= 80) {
    return { ss: roundedSs, iq, percentile, category: 'Di bawah rata-rata', description: WECHSLER_CLASSIFICATIONS[4].description };
  }
  if (iq >= 70) {
    return { ss: roundedSs, iq, percentile, category: 'Borderline', description: WECHSLER_CLASSIFICATIONS[5].description };
  }
  return { ss: roundedSs, iq, percentile, category: 'Intellectual Deficient', description: WECHSLER_CLASSIFICATIONS[6].description };
}

// Alias for ease of use
export const convertSsToWechslerIq = convertSsToWechsler;

