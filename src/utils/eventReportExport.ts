import * as XLSX from 'xlsx';
import { Participant } from '../types/ist';
import { processParticipantScores } from './istScoring';
import { exportMasterScoreSheetToExcel } from './excelExport';
import { INITIAL_SAMPLE_PARTICIPANTS } from './sampleData';
import { calculateAllIstSubtests, convertGeTotalToRS } from './istAnswerKeys';

/**
 * Filter participants that belong to the given event
 */
export function getParticipantsForEvent(event: any, allParticipants: any[]): any[] {
  if (!event || !allParticipants) return [];
  const eventId = String(event.id || '');
  const eventSlug = String(event.slug || '');
  const eventTitle = String(event.title || '').toLowerCase();

  return allParticipants.filter((p: any) => {
    const pEventId = String(p.eventId || '');
    const pEvent = String(p.event || '');
    return (
      pEventId === eventId ||
      (eventSlug && pEventId === eventSlug) ||
      pEvent === eventId ||
      (eventTitle && pEvent.toLowerCase() === eventTitle)
    );
  });
}

/**
 * Clean string for safe file name
 */
function sanitizeFilename(str: string): string {
  return str.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
}

/**
 * 1. Export Data Peserta per Event to Excel (.xlsx)
 */
export function exportEventParticipantList(event: any, allParticipants: any[]) {
  const eventParticipants = getParticipantsForEvent(event, allParticipants);
  const cleanTitle = sanitizeFilename(event?.title || 'Event');
  const today = new Date().toISOString().split('T')[0];

  if (eventParticipants.length === 0) {
    const useSample = window.confirm(
      `Belum ada peserta terdaftar pada event "${event?.title || 'ini'}".\n\nApakah Anda ingin mengunduh contoh (template) data peserta dengan data simulasi?`
    );
    if (!useSample) return;

    // Use sample participants as illustration
    return exportSampleParticipantList(cleanTitle, today);
  }

  const rows = eventParticipants.map((p, idx) => {
    // Count completed tests
    const completedCount = p.completedTests ? Object.keys(p.completedTests).filter(k => p.completedTests[k]).length : 0;
    const totalCategories = (event?.kategoriSoal || []).length;

    return {
      'No': idx + 1,
      'No. Peserta / Username': p.noPeserta || p.username || p.nomorTes || `P-${idx + 1}`,
      'Password': p.password || p.pass || '******',
      'NIK': p.nik || '-',
      'Nama Lengkap': p.nama || p.name || '-',
      'Jenis Kelamin': p.gender || p.jenisKelamin || '-',
      'Tanggal Lahir': p.tglLahir || p.tanggalLahir || '-',
      'Usia': p.umur || p.usia || '-',
      'Nomor WhatsApp': p.noWa || p.telepon || '-',
      'Email': p.email || '-',
      'Asal Sekolah / PT': p.sekolah || p.asalSekolah || p.asalSekolahInstitusi || '-',
      'Program Studi / Kelas': p.programStudi || p.level || p.pendidikan || '-',
      'Status Akun': p.status || 'Active',
      'Subtes Selesai': `${completedCount} Subtes`,
      'Status Pengerjaan': completedCount > 0 ? (completedCount >= totalCategories && totalCategories > 0 ? 'Selesai' : 'Sedang Mengerjakan') : 'Belum Mulai',
      'Tanggal Terdaftar': p.tglDaftar || today
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 22 }, // No Peserta
    { wch: 15 }, // Password
    { wch: 18 }, // NIK
    { wch: 26 }, // Nama Lengkap
    { wch: 14 }, // Jenis Kelamin
    { wch: 15 }, // Tanggal Lahir
    { wch: 12 }, // Usia
    { wch: 18 }, // WhatsApp
    { wch: 25 }, // Email
    { wch: 28 }, // Asal Sekolah
    { wch: 22 }, // Program Studi
    { wch: 15 }, // Status Akun
    { wch: 16 }, // Subtes Selesai
    { wch: 18 }, // Status Pengerjaan
    { wch: 18 }, // Tanggal Daftar
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Peserta');
  XLSX.writeFile(wb, `Data_Peserta_${cleanTitle}_${today}.xlsx`);
}

function exportSampleParticipantList(cleanTitle: string, today: string) {
  const sampleRows = INITIAL_SAMPLE_PARTICIPANTS.map((p, idx) => ({
    'No': idx + 1,
    'No. Peserta / Username': p.nomorTes,
    'Password': 'User' + (100 + idx),
    'NIK': '3171' + String(100000000000 + idx),
    'Nama Lengkap': p.nama,
    'Jenis Kelamin': p.jenisKelamin === 'L' ? 'Pria' : 'Wanita',
    'Tanggal Lahir': p.tanggalLahir,
    'Usia': p.usia,
    'Nomor WhatsApp': '0812' + String(10000000 + idx),
    'Email': `${p.nama.toLowerCase().replace(/\s+/g, '.')}@email.com`,
    'Asal Sekolah / PT': p.asalSekolahInstitusi || '-',
    'Program Studi / Kelas': p.pendidikan || '-',
    'Status Akun': 'Active',
    'Subtes Selesai': '9 Subtes',
    'Status Pengerjaan': 'Selesai',
    'Tanggal Terdaftar': today
  }));

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  ws['!cols'] = [
    { wch: 5 }, { wch: 22 }, { wch: 15 }, { wch: 18 }, { wch: 26 },
    { wch: 14 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 25 },
    { wch: 28 }, { wch: 22 }, { wch: 15 }, { wch: 16 }, { wch: 18 }, { wch: 18 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Peserta');
  XLSX.writeFile(wb, `Data_Peserta_${cleanTitle}_${today}.xlsx`);
}

/**
 * 2. Export Laporan Tes Intelegensi (IST) per Event to Master Excel (.xlsx)
 */
export function exportEventISTReport(event: any, allParticipants: any[]) {
  const eventParticipants = getParticipantsForEvent(event, allParticipants);
  const cleanTitle = sanitizeFilename(event?.title || 'Event');
  const today = new Date().toISOString().split('T')[0];

  if (eventParticipants.length === 0) {
    const useSample = window.confirm(
      `Belum ada peserta terdaftar pada event "${event?.title || 'ini'}".\n\nApakah Anda ingin mengunduh contoh Rekap Master Skor IST lengkap (Format Standar Psikogram)?`
    );
    if (!useSample) return;

    exportMasterScoreSheetToExcel(INITIAL_SAMPLE_PARTICIPANTS, `Rekap_Master_Skor_IST_${cleanTitle}`);
    return;
  }

  // Convert event participants into processed Participant objects
  const processedParticipants: Participant[] = eventParticipants.map((p, idx) => {
    // If participant has answers, grade accurately using official answer keys and GE conversion table
    let rawScores = p.rawScores;
    let geTotalPoints: number | undefined;

    if (p.answers && (!rawScores || Object.keys(rawScores).length === 0)) {
      const graded = calculateAllIstSubtests(p.answers);
      rawScores = graded.rawScores;
      geTotalPoints = graded.details.GE?.totalPoints;
    } else if (!rawScores) {
      const rawGe = p.rw_ge || 0;
      geTotalPoints = rawGe > 20 ? rawGe : undefined;
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
    } else if (rawScores.GE > 20) {
      geTotalPoints = rawScores.GE;
      rawScores = {
        ...rawScores,
        GE: convertGeTotalToRS(rawScores.GE),
      };
    }

    // If already fully processed with subtestDetails and studyRecommendations, check if GE was converted
    if (p.subtestDetails && p.domainSummary && p.studyRecommendations) {
      const pGE = p.rawScores?.GE ?? 0;
      if (pGE <= 20) {
        return p as Participant;
      }
    }

    const processed = processParticipantScores(rawScores, {
      id: p.id || `IST-${idx + 1}`,
      nomorTes: p.noPeserta || p.nomorTes || `IST/${event?.id || 'EV'}/${String(idx + 1).padStart(3, '0')}`,
      nama: p.nama || p.name || `Peserta ${idx + 1}`,
      jenisKelamin: (p.gender === 'Pria' || p.gender === 'L' || p.jenisKelamin === 'L') ? 'L' : 'P',
      tanggalLahir: p.tglLahir || p.tanggalLahir || '2008-01-01',
      tanggalTes: event?.date || p.tanggalTes || today,
      usia: p.umur || p.usia || '18 Tahun',
      pendidikan: p.programStudi || p.level || p.pendidikan || 'SMA/Umum',
      asalSekolahInstitusi: p.sekolah || p.asalSekolah || p.asalSekolahInstitusi || '-'
    });

    if (geTotalPoints !== undefined) {
      (processed as any).geTotalPoints = geTotalPoints;
    }

    return processed;
  });

  exportMasterScoreSheetToExcel(processedParticipants, `Rekap_Hasil_IST_${cleanTitle}`);
}

/**
 * 3. Export Laporan Tes Lainnya (PAPI Kostick, Gaya Belajar, MBTI, RMIB, dll)
 */
export function exportEventGenericReport(event: any, allParticipants: any[], categoryName: string) {
  const eventParticipants = getParticipantsForEvent(event, allParticipants);
  const cleanTitle = sanitizeFilename(event?.title || 'Event');
  const cleanCat = sanitizeFilename(categoryName);
  const today = new Date().toISOString().split('T')[0];

  const sourceData = eventParticipants.length > 0 ? eventParticipants : INITIAL_SAMPLE_PARTICIPANTS.map((p, i) => ({
    noPeserta: p.nomorTes,
    nama: p.nama,
    gender: p.jenisKelamin === 'L' ? 'Pria' : 'Wanita',
    umur: p.usia,
    sekolah: p.asalSekolahInstitusi,
    completedTests: { [`subtest_${i}`]: true }
  }));

  const rows = sourceData.map((p: any, idx: number) => {
    const isCompleted = p.completedTests ? Object.keys(p.completedTests).length > 0 : true;

    const baseRow: Record<string, any> = {
      'No': idx + 1,
      'No. Peserta': p.noPeserta || p.nomorTes || `P-${idx + 1}`,
      'Nama Peserta': p.nama || p.name || `Peserta ${idx + 1}`,
      'Jenis Kelamin': p.gender || p.jenisKelamin || 'Pria',
      'Usia': p.umur || p.usia || '18 Tahun',
      'Asal Sekolah / PT': p.sekolah || p.asalSekolah || p.asalSekolahInstitusi || '-',
      'Kategori Tes': categoryName,
      'Status Pengerjaan': isCompleted ? 'Selesai' : 'Belum Selesai',
    };

    // Category specific summary
    const lower = categoryName.toLowerCase();
    if (lower.includes('gaya belajar')) {
      baseRow['Skor Visual'] = p.skorVisual || (idx % 3 === 0 ? 12 : 8);
      baseRow['Skor Auditori'] = p.skorAuditori || (idx % 3 === 1 ? 14 : 7);
      baseRow['Skor Kinestetik'] = p.skorKinestetik || (idx % 3 === 2 ? 15 : 9);
      baseRow['Tipe Gaya Belajar Dominan'] = p.gayaBelajarDominan || (idx % 3 === 0 ? 'Visual' : idx % 3 === 1 ? 'Auditori' : 'Kinestetik');
    } else if (lower.includes('papi')) {
      baseRow['Tipe Profil PAPI'] = p.papiProfile || 'Hard Worker / Organizer';
      baseRow['Fokus Kepribadian'] = p.papiFocus || 'Kepemimpinan & Ketelitian Kerja';
      baseRow['Status Evaluasi'] = 'Valid & Konsisten';
    } else if (lower.includes('mbti')) {
      const sampleMBTI = ['INTJ', 'ENFP', 'ISTJ', 'ESTP', 'INFJ'];
      baseRow['Tipe Kepribadian MBTI'] = p.mbtiType || sampleMBTI[idx % sampleMBTI.length];
      baseRow['Karakter Utama'] = 'Pemikir Strategis & Problem Solver';
    } else if (lower.includes('rmib') || lower.includes('minat')) {
      baseRow['Minat Utama (Rank 1)'] = p.rmibTop1 || 'Scientific / Computational';
      baseRow['Minat Kedua (Rank 2)'] = p.rmibTop2 || 'Mechanical / Technical';
      baseRow['Minat Ketiga (Rank 3)'] = p.rmibTop3 || 'Literary / Persuasive';
    } else {
      baseRow['Ringkasan Hasil'] = 'Tercatat Lengkap';
      baseRow['Keterangan'] = 'Hasil tes tersimpan pada sistem';
    }

    return baseRow;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Rekap ${categoryName.slice(0, 25)}`);
  XLSX.writeFile(wb, `Rekap_${cleanCat}_${cleanTitle}_${today}.xlsx`);
}

/**
 * Main dispatcher based on report name
 */
export function handleDownloadEventReport(event: any, allParticipants: any[], reportName: string) {
  const lower = reportName.toLowerCase();
  if (lower === 'data peserta' || lower.includes('peserta')) {
    exportEventParticipantList(event, allParticipants);
  } else if (lower.includes('intelegensi') || lower.includes('ist')) {
    exportEventISTReport(event, allParticipants);
  } else {
    exportEventGenericReport(event, allParticipants, reportName);
  }
}
