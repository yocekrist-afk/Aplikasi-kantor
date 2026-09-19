import {
  DomainSummary,
  Participant,
  RawScores,
  StreamAnalysis,
  StudyRecommendation,
  SubtestCode,
  SubtestScoreDetail,
} from '../types/ist';
import { convertGeTotalToRS } from './istAnswerKeys';
import {
  getAgeNormTable,
  convertRawToStandardScoreByAge,
  convertGesamtToIqByAge,
  AgeNormTable,
} from '../data/istAgeNorms';

export { convertGeTotalToRS } from './istAnswerKeys';
export { getAgeNormTable, convertRawToStandardScoreByAge, convertGesamtToIqByAge };
export type { AgeNormTable };

export const SUBTEST_INFO: Record<
  SubtestCode,
  { name: string; aspect: string; domain: 'verbal' | 'numerik' | 'spasial' | 'memori' }
> = {
  SE: {
    name: 'Satzergänzung (Melengkapi Kalimat)',
    aspect: 'Berpikir konkrit praktis, akal sehat',
    domain: 'verbal',
  },
  WA: {
    name: 'Wortauswahl (Mencari Kata Berbeda)',
    aspect: 'Rasa bahasa, berpikir verbal, empati',
    domain: 'verbal',
  },
  AN: {
    name: 'Analogien (Mencari Hubungan Kata)',
    aspect: 'Daya kombinasi, fleksibilitas berpikir',
    domain: 'verbal',
  },
  GE: {
    name: 'Gemeinsamkeiten (Dua Pengertian)',
    aspect: 'Daya abstraksi verbal, pembentukan konsep',
    domain: 'verbal',
  },
  RA: {
    name: 'Rechenaufgaben (Hitungan Sederhana)',
    aspect: 'Berpikir praktis hitungan, berpikir logis objektif',
    domain: 'numerik',
  },
  ZR: {
    name: 'Zahlenreihen (Deret Angka)',
    aspect: 'Berpikir teoritis berhitung, induktif angka',
    domain: 'numerik',
  },
  FA: {
    name: 'Figurenauswahl (Menyusun Bentuk)',
    aspect: 'Kemampuan membayangkan, mengamati, utuh menyeluruh',
    domain: 'spasial',
  },
  WU: {
    name: 'Würfelaufgaben (Kubus)',
    aspect: 'Daya bayang ruang, konstruktif teknis, analitis',
    domain: 'spasial',
  },
  ME: {
    name: 'Merkaufgaben (Mengingat Kata)',
    aspect: 'Atensi, memori jangka pendek & konsentrasi',
    domain: 'memori',
  },
};

/**
 * NORMA PENILAIAN IST (INTELLIGENZ STRUKTUR TEST)
 * Konversi Raw Score (RW / RS) ke Standard Score (SS / SW) berdasarkan Tabel Norma Usia Resmi IST.
 * Catatan penting untuk Subtes 4 (GE):
 * Jika skor mentah di atas 20 (masih berupa skor total butir 0-32),
 * harus dikonversi terlebih dahulu ke RS (0-20) sesuai Tabel 3 Norma IST Resmi.
 */
export function rawScoreToStandardScore(
  subtest: SubtestCode,
  rw: number,
  age?: string | number | null
): number {
  let effectiveRw = rw;

  // Konversi skor total Subtes 4 (GE) ke RS jika belum dikonversi (rw > 20)
  if (subtest === 'GE' && rw > 20) {
    effectiveRw = convertGeTotalToRS(rw);
  }

  // Gunakan tabel norma usia resmi IST (Tabel 7 - 11)
  const { ss } = convertRawToStandardScoreByAge(subtest, effectiveRw, age);
  return ss;
}

/**
 * Konversi Standard Score ke IQ Subtes
 */
export function standardScoreToIQ(ss: number): number {
  // Dalam konvensi psikometri IST, standard score dan deviasi IQ linear
  return ss;
}

/**
 * Konversi IQ/Standard Score ke Persentil (1 - 99)
 * Menggunakan estimasi kurva normal baku (Mean = 100, SD = 15)
 */
export function iqToPercentile(iq: number): number {
  const z = (iq - 100) / 15;
  // Pendekatan fungsi error Gauss untuk CDF normal
  const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) {
    p = 1.0 - p;
  }
  const percentile = Math.round(p * 100);
  return Math.max(1, Math.min(99, percentile));
}

/**
 * Klasifikasi kategori skor subtes
 */
export function getSubtestCategory(iq: number): SubtestScoreDetail['category'] {
  if (iq >= 125) return 'Sangat Tinggi';
  if (iq >= 115) return 'Tinggi';
  if (iq >= 105) return 'Rata-rata Atas';
  if (iq >= 95) return 'Rata-rata';
  if (iq >= 85) return 'Rata-rata Bawah';
  if (iq >= 75) return 'Rendah';
  return 'Sangat Rendah';
}

/**
 * Klasifikasi Kategori IQ Wechsler Total
 */
export function getIqCategory(iq: number): string {
  if (iq >= 130) return 'Sangat Superior (Very Superior)';
  if (iq >= 120) return 'Superior (Cerdas)';
  if (iq >= 110) return 'Rata-rata Atas (High Average)';
  if (iq >= 90) return 'Rata-rata (Average)';
  if (iq >= 80) return 'Rata-rata Bawah (Low Average)';
  if (iq >= 70) return 'Batas Rendah (Borderline)';
  return 'Defective / Sangat Rendah';
}

/**
 * Kategori ringkas untuk ranah domain
 */
export function getDomainCategoryName(avgIq: number): string {
  if (avgIq >= 120) return 'Sangat Baik';
  if (avgIq >= 110) return 'Baik';
  if (avgIq >= 95) return 'Cukup / Rata-rata';
  if (avgIq >= 85) return 'Kurang';
  return 'Sangat Kurang';
}

/**
 * Analisis kualitatif penjurusan IPA vs IPS
 * Aturan:
 * - IPA: RA, ZR, FA, WU
 * - IPS: SE, WA, GE, ME
 */
export function analyzeStreamPreference(details: SubtestScoreDetail[]): StreamAnalysis {
  const scoreMap = new Map<SubtestCode, number>();
  details.forEach((d) => scoreMap.set(d.code, d.iq));

  const ra = scoreMap.get('RA') || 100;
  const zr = scoreMap.get('ZR') || 100;
  const fa = scoreMap.get('FA') || 100;
  const wu = scoreMap.get('WU') || 100;

  const se = scoreMap.get('SE') || 100;
  const wa = scoreMap.get('WA') || 100;
  const ge = scoreMap.get('GE') || 100;
  const me = scoreMap.get('ME') || 100;

  const ipaAvg = Math.round((ra + zr + fa + wu) / 4);
  const ipsAvg = Math.round((se + wa + ge + me) / 4);
  const diff = ipaAvg - ipsAvg;

  let preference: 'IPA' | 'IPS' | 'Seimbang' = 'Seimbang';
  let description = '';
  const highlightAspects: string[] = [];

  if (diff >= 4) {
    preference = 'IPA';
    description =
      'Berdasarkan profil struktur inteligensi, subjek menunjukkan potensi yang lebih dominan pada kelompok subtes eksakta (RA, ZR, FA, WU). Subjek memiliki penalaran logika angka yang tajam, daya abstraksi ruang/spasial yang kuat, serta kemampuan analisis pola struktural yang menunjang keberhasilan pada bidang Sains, Teknologi, dan Eksakta.';
    if (ra >= 105) highlightAspects.push('Logika hitung praktis & penalaran matematis');
    if (zr >= 105) highlightAspects.push('Daya abstraksi pola deret & berpikir induktif');
    if (fa >= 105) highlightAspects.push('Kemampuan pengamatan visual & sintesis bentuk');
    if (wu >= 105) highlightAspects.push('Daya bayang ruang 3D & konstruksi teknis');
  } else if (diff <= -4) {
    preference = 'IPS';
    description =
      'Berdasarkan profil struktur inteligensi, subjek menunjukkan potensi yang lebih menonjol pada kelompok subtes sosial-humaniora (SE, WA, GE, ME). Subjek unggul dalam pengolahan gagasan verbal, pemahaman konsep abstrak, kepekaan bahasa, serta daya retensi memori asosiatif yang relevan untuk studi Sosial, Hukum, Komunikasi, dan Bisnis.';
    if (se >= 105) highlightAspects.push('Pemikiran konkrit-praktis & penalaran umum');
    if (wa >= 105) highlightAspects.push('Kekayaan kosa kata & kepekaan rasa bahasa');
    if (ge >= 105) highlightAspects.push('Kemampuan abstraksi & konseptualisasi verbal');
    if (me >= 105) highlightAspects.push('Kapasitas memori kata & konsentrasi mental');
  } else {
    preference = 'Seimbang';
    description =
      'Profil potensi intelektual subjek menunjukkan keseimbangan yang selaras antara ranah eksakta (IPA) dan ranah sosial-verbal (IPS). Subjek memiliki fleksibilitas kognitif yang memungkinkannya beradaptasi secara optimal pada bidang multidisiplin, seperti Teknik Industri, Manajemen Informatika, Psikologi, Arsitektur, maupun Ekonomi Bisnis.';
    highlightAspects.push('Keseimbangan penalaran logis-analitis dan pemahaman verbal');
    highlightAspects.push('Fleksibilitas dalam mengolah data kuantitatif maupun wacana kualitatif');
  }

  if (highlightAspects.length === 0) {
    highlightAspects.push('Kemampuan penalaran umum yang berimbang di berbagai situasi tugas');
  }

  return {
    preference,
    description,
    ipaScore: ipaAvg,
    ipsScore: ipsAvg,
    highlightAspects,
  };
}

/**
 * Aturan Potensi Bidang Studi / Matriks Kecocokan (11 Jurusan)
 */
export const STUDY_FACULTIES: {
  faculty: string;
  requiredSubtests: SubtestCode[];
  benchmark: number;
}[] = [
  { faculty: 'Hukum', requiredSubtests: ['SE', 'AN', 'GE', 'ME'], benchmark: 100 },
  { faculty: 'Ekonomi / Bisnis', requiredSubtests: ['SE', 'AN', 'RA', 'ZR'], benchmark: 100 },
  { faculty: 'Sastra & Bahasa', requiredSubtests: ['WA', 'AN', 'GE', 'ME'], benchmark: 98 },
  { faculty: 'Ilmu Komunikasi (Fikom)', requiredSubtests: ['SE', 'WA', 'AN', 'ME'], benchmark: 98 },
  { faculty: 'Psikologi', requiredSubtests: ['SE', 'WA', 'AN', 'GE', 'ME'], benchmark: 100 },
  { faculty: 'Kedokteran & Kesehatan', requiredSubtests: ['SE', 'AN', 'GE', 'FA', 'WU'], benchmark: 105 },
  { faculty: 'Pertanian & Agroteknologi', requiredSubtests: ['AN', 'GE', 'FA', 'WU'], benchmark: 98 },
  { faculty: 'Peternakan & Hayati', requiredSubtests: ['AN', 'FA', 'WU'], benchmark: 95 },
  { faculty: 'Seni Rupa & Desain', requiredSubtests: ['AN', 'ZR', 'FA', 'WU'], benchmark: 100 },
  { faculty: 'Teknik / Rekayasa', requiredSubtests: ['SE', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU'], benchmark: 102 },
  { faculty: 'MIPA / Sains Murni', requiredSubtests: ['AN', 'GE', 'RA', 'ZR', 'FA', 'WU'], benchmark: 102 },
];

export function evaluateStudyRecommendations(details: SubtestScoreDetail[]): StudyRecommendation[] {
  const scoreMap = new Map<SubtestCode, number>();
  details.forEach((d) => scoreMap.set(d.code, d.iq));

  return STUDY_FACULTIES.map((item) => {
    const scores = item.requiredSubtests.map((sub) => scoreMap.get(sub) || 100);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);

    // Evaluasi kecocokan
    const isMatch = avgScore >= item.benchmark && minScore >= 90;
    let suitability: StudyRecommendation['suitability'] = 'Cukup';

    if (avgScore >= item.benchmark + 8 && minScore >= 100) {
      suitability = 'Sangat Sesuai';
    } else if (isMatch) {
      suitability = 'Sesuai';
    } else if (avgScore >= item.benchmark - 5) {
      suitability = 'Cukup';
    } else {
      suitability = 'Kurang';
    }

    return {
      faculty: item.faculty,
      requiredSubtests: item.requiredSubtests,
      isMatch,
      matchScore: Math.round(avgScore),
      suitability,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Ringkasan Ranah Kemampuan
 */
export function calculateDomainSummary(details: SubtestScoreDetail[]): DomainSummary {
  const getAvg = (codes: SubtestCode[]) => {
    const items = details.filter((d) => codes.includes(d.code));
    if (items.length === 0) return 100;
    const sum = items.reduce((acc, curr) => acc + curr.iq, 0);
    return Math.round(sum / items.length);
  };

  const verbalIq = getAvg(['SE', 'WA', 'AN', 'GE']);
  const numerikIq = getAvg(['RA', 'ZR']);
  const spasialIq = getAvg(['FA', 'WU']);
  const memoriIq = getAvg(['ME']);

  return {
    verbal: {
      averageIq: verbalIq,
      category: getDomainCategoryName(verbalIq),
      subtests: ['SE', 'WA', 'AN', 'GE'],
      description:
        'Mengukur kapasitas daya tangkap verbal, pemahaman bahasa, kemampuan analogi kosa kata, dan pembentukan konsep ide.',
    },
    numerik: {
      averageIq: numerikIq,
      category: getDomainCategoryName(numerikIq),
      subtests: ['RA', 'ZR'],
      description:
        'Mengukur daya nalar praktis angka, pemecahan masalah hitungan aritmatika, dan penalaran induktif pola deret.',
    },
    spasial: {
      averageIq: spasialIq,
      category: getDomainCategoryName(spasialIq),
      subtests: ['FA', 'WU'],
      description:
        'Mengukur persepsi visual-spasial, daya rotasi objek kubus ruang 3D, dan kemampuan rekonstruksi bentuk utuh.',
    },
    memori: {
      averageIq: memoriIq,
      category: getDomainCategoryName(memoriIq),
      subtests: ['ME'],
      description:
        'Mengukur konsentrasi perhatian mental, daya retensi asosiatif jangka pendek terhadap stimulus kata dan informasi.',
    },
  };
}

/**
 * Paragraf Gambaran Umum Otomatis
 */
export function generateGeneralDescription(
  name: string,
  totalIq: number,
  iqCat: string,
  domain: DomainSummary,
  stream: StreamAnalysis
): string {
  const levelText =
    totalIq >= 120
      ? 'memiliki kapasitas taraf kecerdasan umum yang berada pada taraf prima dan sangat memadai'
      : totalIq >= 110
      ? 'menunjukkan potensi taraf kecerdasan di atas rata-rata populasi sebayanya'
      : totalIq >= 90
      ? 'berada pada taraf kecerdasan rata-rata (normal) yang cukup stabil untuk menuntaskan tuntutan akademis'
      : 'menunjukkan taraf kemampuan umum yang memerlukan pembinaan terstruktur dan pembiasaan belajar berkala';

  return `Berdasarkan hasil asesmen tes IST (Intelligenz Struktur Test), Saudara/i ${name} memperoleh estimasi IQ Total sebesar ${totalIq} yang terklasifikasi dalam kategori ${iqCat}. Secara umum, subjek ${levelText}. Pola profil kognitif menunjukkan ranah ${domain.verbal.category.toLowerCase()} pada pemahaman verbal (${domain.verbal.averageIq}), ranah ${domain.numerik.category.toLowerCase()} pada daya nalar numerik (${domain.numerik.averageIq}), ranah ${domain.spasial.category.toLowerCase()} pada kemampuan spasial-figural (${domain.spasial.averageIq}), serta daya retensi memori (${domain.memori.averageIq}). Dari segi orientasi bakat akademis, subjek cenderung condong ke arah peminatan ${stream.preference}.`;
}

/**
 * Rekomendasi & Strategi Belajar
 */
export function generateActionableAdvice(
  strengths: SubtestScoreDetail[],
  devAreas: SubtestScoreDetail[],
  preference: 'IPA' | 'IPS' | 'Seimbang'
): { recommendations: string[]; learningStrategies: string[] } {
  const recs: string[] = [];
  const strCodes = strengths.map((s) => s.code);
  const devCodes = devAreas.map((d) => d.code);

  recs.push(
    `Optimalkan keunggulan utama pada aspek ${strengths.map((s) => s.code).join(' & ')} (${strengths.map((s) => s.name.split(' ')[0]).join(', ')}) sebagai daya dorong utama dalam pemilihan tugas mandiri dan ekstrakurikuler.`
  );

  if (devCodes.includes('RA') || devCodes.includes('ZR')) {
    recs.push(
      'Tingkatkan latihan pemecahan soal berhitung bergradasi dari yang konkrit menuju pemahaman rumus abstrak untuk memperkuat fleksibilitas numerik.'
    );
  }
  if (devCodes.includes('SE') || devCodes.includes('WA') || devCodes.includes('GE')) {
    recs.push(
      'Perkaya literasi dengan membaca wacana analitis, menyusun ringkasan mandiri, dan berdiskusi secara aktif guna melatih kelancaran artikulasi verbal.'
    );
  }
  if (devCodes.includes('FA') || devCodes.includes('WU')) {
    recs.push(
      'Latihlah persepsi spasial dengan bantuan sketsa diagram, visualisasi grafik, atau simulasi model 3 dimensi saat mempelajari materi struktural.'
    );
  }
  if (devCodes.includes('ME')) {
    recs.push(
      'Gunakan metode jembatan keledai (mnemonik), peta pikiran (mind mapping), serta teknik jeda berkala (spaced repetition) saat menyerap materi hafalan.'
    );
  }
  if (recs.length < 3) {
    recs.push(
      'Rancang jadwal belajar yang proporsional dengan mengombinasikan sesi latihan intensif dan istirahat teratur untuk menjaga konsistensi stamina belajar.'
    );
  }

  const learningStrategies: string[] = [
    preference === 'IPA'
      ? 'Gunakan pendekatan deduktif-sistematis: pahami konsep inti, turunkan rumus secara logis, dan uji pemahaman lewat studi kasus berbasis problem solving.'
      : preference === 'IPS'
      ? 'Gunakan pendekatan komparatif-diskursif: hubungkan konsep materi dengan fenomena sosial kontekstual serta lakukan elaborasi makna secara mendalam.'
      : 'Gunakan pendekatan terpadu: padukan analisis data kuantitatif dengan penyajian narasi yang jelas untuk memperkuat pemahaman holistik.',
    'Terapkan teknik pembelajaran active recall dengan menguji diri sendiri (self-quiz) minimal 15 menit setelah mempelajari topik baru.',
    'Bagi materi yang kompleks menjadi sub-topik terstruktur guna mencegah kejenuhan kognitif dan mempertahankan retensi memori jangka panjang.',
  ];

  return { recommendations: recs.slice(0, 3), learningStrategies: learningStrategies.slice(0, 3) };
}

/**
 * Memproses seluruh data mentah peserta menjadi data laporan komprehensif
 */
export function processParticipantScores(
  raw: RawScores,
  demographics: {
    id: string;
    nomorTes: string;
    nama: string;
    jenisKelamin: 'L' | 'P';
    tanggalLahir: string;
    tanggalTes: string;
    usia: string | number;
    pendidikan: string;
    asalSekolahInstitusi?: string;
  }
): Participant {
  const subtestCodes: SubtestCode[] = ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'];
  const ageNorm = getAgeNormTable(demographics.usia);

  // Normalisasi skor mentah (khusus GE dikonversi via Tabel 3 jika rw > 20)
  const normalizedRaw: RawScores = {
    ...raw,
    GE: raw.GE > 20 ? convertGeTotalToRS(raw.GE) : (raw.GE ?? 0),
  };

  const subtestDetails: SubtestScoreDetail[] = subtestCodes.map((code) => {
    const rw = normalizedRaw[code] ?? 0;
    const ss = rawScoreToStandardScore(code, rw, demographics.usia);
    const iq = standardScoreToIQ(ss);
    const percentile = iqToPercentile(iq);
    const category = getSubtestCategory(iq);
    const info = SUBTEST_INFO[code];

    return {
      code,
      name: info.name,
      measuredAspect: info.aspect,
      rw,
      ss,
      iq,
      percentile,
      category,
    };
  });

  const totalRaw = subtestDetails.reduce((acc, curr) => acc + curr.rw, 0);
  const totalSS = subtestDetails.reduce((acc, curr) => acc + curr.ss, 0);

  // Konversi GESAMT (Total Raw RS 0-180) ke Total IQ resmi berdasarkan Norma Usia IST
  const { totalIQ } = convertGesamtToIqByAge(totalRaw, demographics.usia);
  const iqCategory = getIqCategory(totalIQ);

  const domainSummary = calculateDomainSummary(subtestDetails);
  const streamAnalysis = analyzeStreamPreference(subtestDetails);
  const studyRecommendations = evaluateStudyRecommendations(subtestDetails);

  // Cari 2 kekuatan tertinggi dan 2 area pengembangan terendah
  const sortedByIQ = [...subtestDetails].sort((a, b) => b.iq - a.iq);
  const strengths = [sortedByIQ[0], sortedByIQ[1]];
  const developmentAreas = [sortedByIQ[sortedByIQ.length - 1], sortedByIQ[sortedByIQ.length - 2]];

  const generalDescription = generateGeneralDescription(
    demographics.nama,
    totalIQ,
    iqCategory,
    domainSummary,
    streamAnalysis
  );

  const { recommendations, learningStrategies } = generateActionableAdvice(
    strengths,
    developmentAreas,
    streamAnalysis.preference
  );

  return {
    ...demographics,
    rawScores: normalizedRaw,
    subtestDetails,
    totalRaw,
    totalSS,
    totalIQ,
    iqCategory,
    domainSummary,
    streamAnalysis,
    studyRecommendations,
    strengths,
    developmentAreas,
    generalDescription,
    recommendations,
    learningStrategies,
    normApplied: ageNorm.tableName,
  };
}
