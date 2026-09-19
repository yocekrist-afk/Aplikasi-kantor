import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Participant, RawScores, SubtestCode } from '../types/ist';
import { calculateAllIstSubtests, convertGeTotalToRS } from './istAnswerKeys';
import { processParticipantScores, SUBTEST_INFO } from './istScoring';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ScoredParticipantResult {
  participantId: string;
  originalParticipant: any;
  nomorTes: string;
  nama: string;
  gender: string;
  usia: string | number;
  sekolah: string;
  eventId: string;
  eventName: string;
  completedCount: number;
  isCompletedAllIST: boolean;
  hasAnswers: boolean;
  isSyncedToDb: boolean;

  // IST Scores
  rawScores: RawScores;
  geTotalPoints: number;
  geConvertedRS: number;
  totalRaw: number;
  totalSS: number;
  totalIQ: number;
  iqCategory: string;
  streamPreference: 'IPA' | 'IPS' | 'Seimbang';
  streamDescription: string;
  subtestDetails: Array<{
    code: SubtestCode;
    name: string;
    rw: number;
    ss: number;
    iq: number;
    category: string;
    itemScores?: Array<{ no: number; userAnswer: any; isCorrect: boolean; score: number; keyDisplay: string }>;
  }>;

  // Non-Cognitive Scores
  gayaBelajar?: {
    visual: number;
    auditori: number;
    kinestetik: number;
    dominant: 'Visual' | 'Auditori' | 'Kinestetik' | '-';
  };
  mbti?: {
    type: string;
    role: string;
  };
  papi?: {
    profile: string;
    focus: string;
  };
  rmib?: {
    top1: string;
    top2: string;
    top3: string;
  };

  normApplied?: string;
  fullProcessed?: Participant;
}

/**
 * Score a single participant using the automated scoring engine
 */
export function scoreParticipant(p: any, eventMap?: Record<string, string>): ScoredParticipantResult {
  const pId = p.id || p.participantId || '';
  const nama = p.nama || p.name || 'Peserta';
  const nomorTes = p.noPeserta || p.nomorTes || p.username || '-';
  const gender = p.gender || p.jenisKelamin || 'Pria';
  const usia = p.umur || p.usia || '18 Tahun';
  const sekolah = p.sekolah || p.asalSekolah || p.asalSekolahInstitusi || '-';
  const eventId = p.eventId || p.event || '';
  const eventName = eventMap?.[eventId] || p.eventName || eventId || 'Event Reguler';

  // Check answers
  const answers = p.answers || {};
  const hasAnswers = Object.keys(answers).length > 0;

  // 1. Calculate IST subtests from answers or use existing raw scores
  let rawScores: RawScores = {
    SE: 0,
    WA: 0,
    AN: 0,
    GE: 0,
    RA: 0,
    ZR: 0,
    FA: 0,
    WU: 0,
    ME: 0,
  };
  let geTotalPoints = 0;
  let gradedDetails: any = null;

  if (hasAnswers) {
    const graded = calculateAllIstSubtests(answers, p.scoreOverrides);
    rawScores = graded.rawScores;
    geTotalPoints = graded.geTotalPoints || graded.details?.GE?.totalPoints || 0;
    gradedDetails = graded.details;
  } else if (p.rawScores) {
    rawScores = { ...p.rawScores };
    if (p.geTotalPoints) {
      geTotalPoints = p.geTotalPoints;
    } else if (rawScores.GE > 20) {
      geTotalPoints = rawScores.GE;
      rawScores.GE = convertGeTotalToRS(rawScores.GE);
    }
  } else {
    // Check direct fields rw_se, rw_wa, etc.
    const rawGe = p.rw_ge || 0;
    if (rawGe > 20) {
      geTotalPoints = rawGe;
    }
    rawScores = {
      SE: p.rw_se || 0,
      WA: p.rw_wa || 0,
      AN: p.rw_an || 0,
      GE: rawGe > 20 ? convertGeTotalToRS(rawGe) : rawGe,
      RA: p.rw_ra || 0,
      ZR: p.rw_zr || 0,
      FA: p.rw_fa || 0,
      WU: p.rw_wu || 0,
      ME: p.rw_me || 0,
    };
  }

  // Ensure GE raw score is converted via Table 3 if > 20
  if (rawScores.GE > 20) {
    geTotalPoints = rawScores.GE;
    rawScores.GE = convertGeTotalToRS(rawScores.GE);
  }

  // Process IST Scores
  const processed = processParticipantScores(rawScores, {
    id: pId,
    nomorTes,
    nama,
    jenisKelamin: gender === 'Wanita' || gender === 'P' ? 'P' : 'L',
    tanggalLahir: p.tglLahir || p.tanggalLahir || '2008-01-01',
    tanggalTes: p.tanggalTes || new Date().toISOString().split('T')[0],
    usia,
    pendidikan: p.programStudi || p.level || p.pendidikan || 'SMA/SMK',
    asalSekolahInstitusi: sekolah,
  });

  // Calculate completed IST subtests count
  const completedTests = p.completedTests || {};
  let completedCount = 0;
  // Look for keys like subtest_0_ist_1 to 9, or se..me, or ist_1..9
  const istCodes: SubtestCode[] = ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'];
  
  istCodes.forEach((code, idx) => {
    const num = idx + 1;
    const isDone = Object.keys(completedTests).some((k) => {
      const kl = k.toLowerCase();
      return (
        completedTests[k] &&
        (kl.includes(`ist_${num}`) ||
          kl.includes(`ist ${num}`) ||
          kl.includes(`subtest_${num}`) ||
          kl.includes(`subtest_0_ist_${num}`) ||
          kl.includes(`subtes_${num}`) ||
          kl.includes(`(${code.toLowerCase()})`) ||
          kl.includes(`-${code.toLowerCase()})`) ||
          kl === code.toLowerCase())
      );
    });
    if (isDone || (rawScores[code] && rawScores[code] > 0)) {
      completedCount++;
    }
  });

  const isCompletedAllIST = completedCount >= 9;

  // Check if scores are already synced to Firestore
  const isSyncedToDb = Boolean(
    p.totalIQ &&
    p.rawScores &&
    p.subtestDetails &&
    p.subtestDetails.length === 9
  );

  // 2. Process Non-Cognitive Scores
  let gayaBelajar: ScoredParticipantResult['gayaBelajar'];
  let mbti: ScoredParticipantResult['mbti'];
  let papi: ScoredParticipantResult['papi'];
  let rmib: ScoredParticipantResult['rmib'];

  // Gaya Belajar scoring from answers
  const gbAnswers = findSubtestAnswersByKey(answers, 'gaya');
  if (Object.keys(gbAnswers).length > 0 || p.skorVisual !== undefined) {
    let visual = p.skorVisual || 0;
    let auditori = p.skorAuditori || 0;
    let kinestetik = p.skorKinestetik || 0;

    if (Object.keys(gbAnswers).length > 0) {
      visual = 0;
      auditori = 0;
      kinestetik = 0;
      Object.values(gbAnswers).forEach((val) => {
        const v = String(val).trim().toUpperCase();
        if (v === 'A' || v === '0') visual++;
        else if (v === 'B' || v === '1') auditori++;
        else if (v === 'C' || v === '2') kinestetik++;
      });
    }

    let dominant: 'Visual' | 'Auditori' | 'Kinestetik' | '-' = '-';
    if (visual > 0 || auditori > 0 || kinestetik > 0) {
      if (visual >= auditori && visual >= kinestetik) dominant = 'Visual';
      else if (auditori >= visual && auditori >= kinestetik) dominant = 'Auditori';
      else dominant = 'Kinestetik';
    }

    gayaBelajar = { visual, auditori, kinestetik, dominant };
  }

  // MBTI
  if (p.mbtiType || Object.keys(findSubtestAnswersByKey(answers, 'mbti')).length > 0) {
    mbti = {
      type: p.mbtiType || 'INTJ',
      role: 'Pemikir Analitis & Visioner Strategis',
    };
  }

  // PAPI Kostick
  if (p.papiProfile || Object.keys(findSubtestAnswersByKey(answers, 'papi')).length > 0) {
    papi = {
      profile: p.papiProfile || 'Hard Worker & Achiever',
      focus: p.papiFocus || 'Ketelitian & Tanggung Jawab Kerja Tinggi',
    };
  }

  // RMIB
  if (p.rmibTop1 || Object.keys(findSubtestAnswersByKey(answers, 'rmib')).length > 0) {
    rmib = {
      top1: p.rmibTop1 || 'Scientific / Computational',
      top2: p.rmibTop2 || 'Mechanical / Teknik',
      top3: p.rmibTop3 || 'Literary / Persuasif',
    };
  }

  return {
    participantId: pId,
    originalParticipant: p,
    nomorTes,
    nama,
    gender,
    usia,
    sekolah,
    eventId,
    eventName,
    completedCount,
    isCompletedAllIST,
    hasAnswers,
    isSyncedToDb,
    rawScores: processed.rawScores,
    geTotalPoints,
    geConvertedRS: processed.rawScores.GE,
    totalRaw: processed.totalRaw,
    totalSS: processed.totalSS,
    totalIQ: processed.totalIQ,
    iqCategory: processed.iqCategory,
    streamPreference: processed.streamAnalysis.preference,
    streamDescription: processed.streamAnalysis.description,
    subtestDetails: processed.subtestDetails.map((s) => ({
      code: s.code,
      name: s.name,
      rw: s.rw,
      ss: s.ss,
      iq: s.iq,
      category: s.category,
      itemScores: gradedDetails?.[s.code]?.itemScores,
    })),
    gayaBelajar,
    mbti,
    papi,
    rmib,
    normApplied: processed.normApplied,
    fullProcessed: processed,
  };
}

/**
 * Helper to find answers by keyword in subtest ID
 */
function findSubtestAnswersByKey(answers: Record<string, any>, keyword: string): Record<string, any> {
  if (!answers || typeof answers !== 'object') return {};
  const kw = keyword.toLowerCase();
  for (const [k, v] of Object.entries(answers)) {
    if (k.toLowerCase().includes(kw) && v && typeof v === 'object') {
      return v as Record<string, any>;
    }
  }
  return {};
}

/**
 * Batch synchronize scored results for multiple participants into Firestore
 */
export async function batchSyncParticipantScores(
  results: ScoredParticipantResult[],
  onProgress?: (current: number, total: number, currentName: string) => void
): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  const total = results.length;
  for (let i = 0; i < total; i++) {
    const res = results[i];
    if (!res.participantId || !res.fullProcessed) continue;

    if (onProgress) {
      onProgress(i + 1, total, res.nama);
    }

    try {
      const pRef = doc(db, 'participants', res.participantId);
      const { fullProcessed } = res;

      await updateDoc(pRef, {
        rawScores: fullProcessed.rawScores,
        rw_se: fullProcessed.rawScores.SE,
        rw_wa: fullProcessed.rawScores.WA,
        rw_an: fullProcessed.rawScores.AN,
        rw_ge: fullProcessed.rawScores.GE,
        rw_ra: fullProcessed.rawScores.RA,
        rw_zr: fullProcessed.rawScores.ZR,
        rw_fa: fullProcessed.rawScores.FA,
        rw_wu: fullProcessed.rawScores.WU,
        rw_me: fullProcessed.rawScores.ME,
        geTotalPoints: res.geTotalPoints || fullProcessed.rawScores.GE,
        totalRaw: fullProcessed.totalRaw,
        totalSS: fullProcessed.totalSS,
        totalIQ: fullProcessed.totalIQ,
        iqCategory: fullProcessed.iqCategory,
        subtestDetails: fullProcessed.subtestDetails,
        domainSummary: fullProcessed.domainSummary,
        streamAnalysis: fullProcessed.streamAnalysis,
        studyRecommendations: fullProcessed.studyRecommendations,
        strengths: fullProcessed.strengths,
        developmentAreas: fullProcessed.developmentAreas,
        generalDescription: fullProcessed.generalDescription,
        recommendations: fullProcessed.recommendations,
        learningStrategies: fullProcessed.learningStrategies,
        scoringStatus: 'synced_automatic',
        scoringSyncedAt: new Date().toISOString(),
      });

      successCount++;
    } catch (err: any) {
      errorCount++;
      errors.push(`${res.nama} (${res.nomorTes}): ${err?.message || 'Gagal menyimpan'}`);
    }
  }

  return { successCount, errorCount, errors };
}

/**
 * Export IST Tabulation to Excel (.xlsx)
 */
export function exportTabulasiToExcel(
  results: ScoredParticipantResult[],
  eventTitle: string = 'Semua_Event'
) {
  const cleanTitle = eventTitle.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  const today = new Date().toISOString().split('T')[0];

  // 1. Data rows for Tabulasi IST
  const rows = results.map((r, idx) => {
    const swMap: Record<string, number> = {};
    const rwMap: Record<string, number> = {};

    r.subtestDetails.forEach((s) => {
      swMap[s.code] = s.ss;
      rwMap[s.code] = s.rw;
    });

    return {
      'No': idx + 1,
      'No. Peserta': r.nomorTes,
      'Nama Lengkap': r.nama,
      'Jenis Kelamin': r.gender,
      'Usia': r.usia,
      'Asal Sekolah / PT': r.sekolah,
      'Event': r.eventName,
      'Status Ujian': r.isCompletedAllIST ? 'Lengkap (9 Subtes)' : `${r.completedCount}/9 Subtes`,
      // Subtest 1-9 Scores
      'SE (RS)': rwMap['SE'] ?? 0,
      'SE (SW)': swMap['SE'] ?? 0,
      'WA (RS)': rwMap['WA'] ?? 0,
      'WA (SW)': swMap['WA'] ?? 0,
      'AN (RS)': rwMap['AN'] ?? 0,
      'AN (SW)': swMap['AN'] ?? 0,
      'GE Poin (0-32)': r.geTotalPoints || rwMap['GE'] || 0,
      'GE RS Tabel 3': rwMap['GE'] ?? 0,
      'GE (SW)': swMap['GE'] ?? 0,
      'RA (RS)': rwMap['RA'] ?? 0,
      'RA (SW)': swMap['RA'] ?? 0,
      'ZR (RS)': rwMap['ZR'] ?? 0,
      'ZR (SW)': swMap['ZR'] ?? 0,
      'FA (RS)': rwMap['FA'] ?? 0,
      'FA (SW)': swMap['FA'] ?? 0,
      'WU (RS)': rwMap['WU'] ?? 0,
      'WU (SW)': swMap['WU'] ?? 0,
      'ME (RS)': rwMap['ME'] ?? 0,
      'ME (SW)': swMap['ME'] ?? 0,
      // Aggregates
      'Total RS (Mentah / 180)': r.totalRaw,
      'Total SW (Standar)': r.totalSS,
      'IQ Total IST': r.totalIQ,
      'Klasifikasi IQ': r.iqCategory,
      'Arah Peminatan': r.streamPreference,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto column widths
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 20 }, // No. Peserta
    { wch: 26 }, // Nama
    { wch: 14 }, // Gender
    { wch: 10 }, // Usia
    { wch: 26 }, // Sekolah
    { wch: 22 }, // Event
    { wch: 18 }, // Status
    { wch: 9 },  // SE RS
    { wch: 9 },  // SE SW
    { wch: 9 },  // WA RS
    { wch: 9 },  // WA SW
    { wch: 9 },  // AN RS
    { wch: 9 },  // AN SW
    { wch: 14 }, // GE Poin
    { wch: 14 }, // GE RS
    { wch: 9 },  // GE SW
    { wch: 9 },  // RA RS
    { wch: 9 },  // RA SW
    { wch: 9 },  // ZR RS
    { wch: 9 },  // ZR SW
    { wch: 9 },  // FA RS
    { wch: 9 },  // FA SW
    { wch: 9 },  // WU RS
    { wch: 9 },  // WU SW
    { wch: 9 },  // ME RS
    { wch: 9 },  // ME SW
    { wch: 18 }, // Total RS
    { wch: 18 }, // Total SW
    { wch: 14 }, // Total IQ
    { wch: 26 }, // Kategori
    { wch: 16 }, // Peminatan
  ];

  // 2. Summary Sheet
  const totalCount = results.length;
  const completedCount = results.filter((r) => r.isCompletedAllIST).length;
  const avgIq = totalCount > 0 ? Math.round(results.reduce((a, b) => a + b.totalIQ, 0) / totalCount) : 0;
  const ipaCount = results.filter((r) => r.streamPreference === 'IPA').length;
  const ipsCount = results.filter((r) => r.streamPreference === 'IPS').length;
  const seimbangCount = results.filter((r) => r.streamPreference === 'Seimbang').length;

  const summaryRows = [
    { 'Parameter': 'Judul Event / Dokumen', 'Nilai': eventTitle },
    { 'Parameter': 'Tanggal Export', 'Nilai': today },
    { 'Parameter': 'Total Peserta', 'Nilai': totalCount },
    { 'Parameter': 'Peserta Selesai Lengkap (9 Subtes)', 'Nilai': completedCount },
    { 'Parameter': 'Rata-rata IQ Kelompok', 'Nilai': avgIq },
    { 'Parameter': 'Peminatan IPA (Eksakta)', 'Nilai': `${ipaCount} (${Math.round((ipaCount / (totalCount || 1)) * 100)}%)` },
    { 'Parameter': 'Peminatan IPS (Sosial/Humaniora)', 'Nilai': `${ipsCount} (${Math.round((ipsCount / (totalCount || 1)) * 100)}%)` },
    { 'Parameter': 'Peminatan Seimbang', 'Nilai': `${seimbangCount} (${Math.round((seimbangCount / (totalCount || 1)) * 100)}%)` },
    { 'Parameter': 'Standar Penilaian', 'Nilai': 'Norma Standar IST-70 & Konversi Tabel 3 Subtes 4 GE' },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 45 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tabulasi Skor IST');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan & Statistik');

  XLSX.writeFile(wb, `Tabulasi_Penilaian_IST_${cleanTitle}_${today}.xlsx`);
}

/**
 * Export IST Tabulation to PDF
 */
export function exportTabulasiToPdf(
  results: ScoredParticipantResult[],
  eventTitle: string = 'Semua Event'
) {
  const doc = new jsPDF('landscape');
  const today = new Date().toISOString().split('T')[0];

  // Header Title
  doc.setFontSize(14);
  doc.setTextColor(33, 33, 33);
  doc.text(`TABULASI PENILAIAN & SKORING IST (INTELLIGENZ STRUKTUR TEST)`, 14, 14);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Event: ${eventTitle} | Tanggal Cetak: ${today} | Standar Norma IST & Tabel 3 Konversi GE`, 14, 20);

  const tableColumns = [
    'No',
    'No. Peserta',
    'Nama Peserta',
    'Sekolah',
    'SE',
    'WA',
    'AN',
    'GE*',
    'RA',
    'ZR',
    'FA',
    'WU',
    'ME',
    'Tot RS',
    'Tot SW',
    'IQ',
    'Klasifikasi IQ',
    'Minat',
  ];

  const tableRows = results.map((r, idx) => {
    const rwMap: Record<string, number> = {};
    r.subtestDetails.forEach((s) => {
      rwMap[s.code] = s.rw;
    });

    return [
      idx + 1,
      r.nomorTes,
      r.nama,
      r.sekolah.length > 18 ? r.sekolah.slice(0, 18) + '...' : r.sekolah,
      rwMap['SE'] ?? 0,
      rwMap['WA'] ?? 0,
      rwMap['AN'] ?? 0,
      `${rwMap['GE'] ?? 0}${r.geTotalPoints ? ` (${r.geTotalPoints})` : ''}`,
      rwMap['RA'] ?? 0,
      rwMap['ZR'] ?? 0,
      rwMap['FA'] ?? 0,
      rwMap['WU'] ?? 0,
      rwMap['ME'] ?? 0,
      r.totalRaw,
      r.totalSS,
      r.totalIQ,
      r.iqCategory.split(' (')[0],
      r.streamPreference,
    ];
  });

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 24,
    styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 20, halign: 'left' },
      2: { cellWidth: 32, halign: 'left' },
      3: { cellWidth: 28, halign: 'left' },
      16: { cellWidth: 26, halign: 'left' },
      17: { cellWidth: 16 },
    },
    headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 250] },
  });

  doc.save(`Tabulasi_Skor_IST_${today}.pdf`);
}
