import * as XLSX from 'xlsx';
import { Participant } from '../types/ist';
import { convertGeTotalToRS } from './istAnswerKeys';

export function exportMasterScoreSheetToExcel(
  participants: Participant[],
  filenamePrefix = 'Rekap_Master_Skor_IST'
): void {
  if (!participants || participants.length === 0) {
    alert('Tidak ada data peserta untuk diekspor.');
    return;
  }

  // Format data baris per peserta
  const dataRows = participants.map((p, index) => {
    // Find subtest scores
    const sub = (code: string) => p.subtestDetails.find((s) => s.code === code);

    // Ensure GE raw score is converted if needed
    const geRaw = p.rawScores.GE;
    const geConverted = geRaw > 20 ? convertGeTotalToRS(geRaw) : geRaw;
    const geTotalPoints = (p as any).geTotalPoints || (geRaw > 20 ? geRaw : '-');

    // Top 3 faculty recommendations
    const topRecs = p.studyRecommendations
      .slice(0, 3)
      .map((r, i) => `#${i + 1} ${r.faculty} (${r.matchScore})`)
      .join('; ');

    return {
      No: index + 1,
      'No. Tes': p.nomorTes,
      'Nama Peserta': p.nama,
      'Jenis Kelamin': p.jenisKelamin,
      Usia: p.usia,
      'Tanggal Lahir': p.tanggalLahir,
      'Tanggal Tes': p.tanggalTes,
      'Pendidikan / Kelas': p.pendidikan,
      'Asal Sekolah / Institusi': p.asalSekolahInstitusi || '-',

      // Skor Mentah (RW)
      RW_SE: p.rawScores.SE,
      RW_WA: p.rawScores.WA,
      RW_AN: p.rawScores.AN,
      'GE_Total_Poin (0-32)': geTotalPoints,
      'RW_GE (Konversi Tabel 3)': geConverted,
      RW_RA: p.rawScores.RA,
      RW_ZR: p.rawScores.ZR,
      RW_FA: p.rawScores.FA,
      RW_WU: p.rawScores.WU,
      RW_ME: p.rawScores.ME,
      Total_RW: p.totalRaw,

      // Skor Standar (SW/SS)
      SW_SE: sub('SE')?.ss ?? 0,
      SW_WA: sub('WA')?.ss ?? 0,
      SW_AN: sub('AN')?.ss ?? 0,
      SW_GE: sub('GE')?.ss ?? 0,
      SW_RA: sub('RA')?.ss ?? 0,
      SW_ZR: sub('ZR')?.ss ?? 0,
      SW_FA: sub('FA')?.ss ?? 0,
      SW_WU: sub('WU')?.ss ?? 0,
      SW_ME: sub('ME')?.ss ?? 0,
      Total_SW: p.totalSS,

      // Nilai IQ Subtes
      IQ_SE: sub('SE')?.iq ?? 0,
      IQ_WA: sub('WA')?.iq ?? 0,
      IQ_AN: sub('AN')?.iq ?? 0,
      IQ_GE: sub('GE')?.iq ?? 0,
      IQ_RA: sub('RA')?.iq ?? 0,
      IQ_ZR: sub('ZR')?.iq ?? 0,
      IQ_FA: sub('FA')?.iq ?? 0,
      IQ_WU: sub('WU')?.iq ?? 0,
      IQ_ME: sub('ME')?.iq ?? 0,

      // Nilai TIU Total
      Total_IQ: p.totalIQ,
      'Kategori Taraf Inteligensi': p.iqCategory,

      // 4 Ranah Pokok
      'Rerata Verbal': p.domainSummary.verbal.averageIq,
      'Kategori Verbal': p.domainSummary.verbal.category,
      'Rerata Numerik': p.domainSummary.numerik.averageIq,
      'Kategori Numerik': p.domainSummary.numerik.category,
      'Rerata Spasial': p.domainSummary.spasial.averageIq,
      'Kategori Spasial': p.domainSummary.spasial.category,
      'Rerata Memori': p.domainSummary.memori.averageIq,
      'Kategori Memori': p.domainSummary.memori.category,

      // Analisis Peminatan IPA/IPS
      'Skor IPA': p.streamAnalysis.ipaScore,
      'Skor IPS': p.streamAnalysis.ipsScore,
      'Arah Peminatan': p.streamAnalysis.preference,

      // Rekomendasi Fakultas
      'Rekomendasi Program Studi / Fakultas': topRecs,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Auto-width columns
  const colWidths = [
    { wch: 5 },  // No
    { wch: 15 }, // No. Tes
    { wch: 28 }, // Nama
    { wch: 8 },  // JK
    { wch: 16 }, // Usia
    { wch: 13 }, // Tanggal Lahir
    { wch: 13 }, // Tanggal Tes
    { wch: 20 }, // Pendidikan
    { wch: 26 }, // Asal Sekolah
    // Subtests RW
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 },
    // Subtests SW
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 },
    // Subtests IQ
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    // TIU
    { wch: 10 }, { wch: 22 },
    // Domains
    { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
    // Peminatan
    { wch: 10 }, { wch: 10 }, { wch: 16 },
    // Rekomendasi
    { wch: 50 },
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekapitulasi Skor IST');

  const today = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${today}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
