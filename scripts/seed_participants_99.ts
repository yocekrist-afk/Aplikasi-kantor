import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { 
  SUBTEST1_SE_KEYS, SUBTEST2_WA_KEYS, SUBTEST3_AN_KEYS, SUBTEST4_GE_KEYS,
  SUBTEST5_RA_KEYS, SUBTEST6_ZR_KEYS, SUBTEST7_FA_KEYS, SUBTEST8_WU_KEYS,
  SUBTEST9_ME_KEYS, calculateAllIstSubtests, convertGeTotalToRS
} from '../src/utils/istAnswerKeys';
import { processParticipantScores } from '../src/utils/istScoring';
import config from '../firebase-applet-config.json';

const app = initializeApp({
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
});
const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

const EVENT_ID = 'OX3nspupwL426qzqGRkV'; // Event 9.9
const EVENT_NAME = '9.9';

interface ParticipantSeedSpec {
  id: string;
  noPeserta: string;
  nik: string;
  nama: string;
  gender: 'Pria' | 'Wanita';
  tglLahir: string;
  umur: string;
  sekolah: string;
  level: string;
  fakultas: string;
  prodi: string;
  alamat: string;
  email: string;
  nomorPonsel: string;
  avatar: string;
  
  // Target raw scores (IST)
  targetRaw: {
    SE: number; // max 20
    WA: number; // max 20
    AN: number; // max 20
    GE_points: number; // points in GE (0-32), which converts to RS 0-20
    RA: number; // max 20
    ZR: number; // max 20
    FA: number; // max 20
    WU: number; // max 20
    ME: number; // max 20
  };

  // Non-Cognitive
  gayaBelajar: {
    visual: number;
    auditori: number;
    kinestetik: number;
    dominant: 'Visual' | 'Auditori' | 'Kinestetik';
  };
  papi: {
    profile: string;
    focus: string;
  };
  rmib: {
    top1: string;
    top2: string;
    top3: string;
  };
}

const PARTICIPANTS: ParticipantSeedSpec[] = [
  {
    id: 'participant_99_01',
    noPeserta: '9901',
    nik: '3171011504080001',
    nama: 'Muhammad Farhan Pratama',
    gender: 'Pria',
    tglLahir: '2008-04-15',
    umur: '18 Tahun',
    sekolah: 'SMAN 8 Jakarta',
    level: 'SMA',
    fakultas: 'MIPA',
    prodi: 'Teknik Elektro / Informatika',
    alamat: 'Jl. Tebet Barat Dalam No. 14, Jakarta Selatan',
    email: 'm.farhan.pratama@gmail.com',
    nomorPonsel: '081298451101',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    targetRaw: { SE: 18, WA: 17, AN: 18, GE_points: 26, RA: 19, ZR: 18, FA: 17, WU: 18, ME: 16 },
    gayaBelajar: { visual: 18, auditori: 10, kinestetik: 8, dominant: 'Visual' },
    papi: { profile: 'Leader & High Achiever', focus: 'Kepemimpinan Strategis & Orientasi Hasil' },
    rmib: { top1: 'Computational', top2: 'Scientific', top3: 'Mechanical' },
  },
  {
    id: 'participant_99_02',
    noPeserta: '9902',
    nik: '3174025208090002',
    nama: 'Clarissa Aurelia Putri',
    gender: 'Wanita',
    tglLahir: '2009-08-12',
    umur: '17 Tahun',
    sekolah: 'SMA Labschool Kebayoran',
    level: 'SMA',
    fakultas: 'Kedokteran',
    prodi: 'Pendidikan Dokter',
    alamat: 'Jl. KH Ahmad Dahlan No. 22, Kebayoran Baru, Jakarta Selatan',
    email: 'clarissa.aurelia@gmail.com',
    nomorPonsel: '081387652202',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    targetRaw: { SE: 19, WA: 18, AN: 19, GE_points: 29, RA: 19, ZR: 19, FA: 18, WU: 18, ME: 19 },
    gayaBelajar: { visual: 12, auditori: 18, kinestetik: 6, dominant: 'Auditori' },
    papi: { profile: 'Systematic & Perfectionist', focus: 'Ketelitian Tinggi & Kepatuhan Prosedur' },
    rmib: { top1: 'Medical', top2: 'Scientific', top3: 'Social Service' },
  },
  {
    id: 'participant_99_03',
    noPeserta: '9903',
    nik: '3374011002080003',
    nama: 'Dimas Arya Wicaksono',
    gender: 'Pria',
    tglLahir: '2008-02-10',
    umur: '18 Tahun',
    sekolah: 'SMAN 3 Semarang',
    level: 'SMA',
    fakultas: 'Hukum',
    prodi: 'Ilmu Hukum / Hubungan Internasional',
    alamat: 'Jl. Pemuda No. 88, Pandansari, Semarang',
    email: 'dimas.arya.w@gmail.com',
    nomorPonsel: '085712349903',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    targetRaw: { SE: 16, WA: 17, AN: 15, GE_points: 20, RA: 11, ZR: 10, FA: 12, WU: 11, ME: 15 },
    gayaBelajar: { visual: 8, auditori: 11, kinestetik: 17, dominant: 'Kinestetik' },
    papi: { profile: 'Social & Persuasive', focus: 'Komunikasi Luwes & Negosiasi Aktif' },
    rmib: { top1: 'Persuasive', top2: 'Literary', top3: 'Social Service' },
  },
  {
    id: 'participant_99_04',
    noPeserta: '9904',
    nik: '3273034903080004',
    nama: 'Siti Nurhaliza Azzahra',
    gender: 'Wanita',
    tglLahir: '2008-03-19',
    umur: '18 Tahun',
    sekolah: 'SMAN 1 Bandung',
    level: 'SMA',
    fakultas: 'Ekonomi & Bisnis',
    prodi: 'Akuntansi & Keuangan',
    alamat: 'Jl. Ir. H. Juanda (Dago) No. 45, Bandung',
    email: 'siti.azzahra@gmail.com',
    nomorPonsel: '081223349904',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    targetRaw: { SE: 16, WA: 16, AN: 16, GE_points: 23, RA: 15, ZR: 15, FA: 14, WU: 14, ME: 16 },
    gayaBelajar: { visual: 17, auditori: 12, kinestetik: 7, dominant: 'Visual' },
    papi: { profile: 'Cooperative & Harmonizer', focus: 'Stabilitas Kerja Tim & Keandalan Administrasi' },
    rmib: { top1: 'Computational', top2: 'Clerical', top3: 'Scientific' },
  },
  {
    id: 'participant_99_05',
    noPeserta: '9905',
    nik: '3171052109090005',
    nama: 'Kevin Jonathan Tan',
    gender: 'Pria',
    tglLahir: '2009-09-21',
    umur: '17 Tahun',
    sekolah: 'SMA Kolese Kanisius',
    level: 'SMA',
    fakultas: 'Teknik',
    prodi: 'Teknik Mesin / Manufaktur',
    alamat: 'Jl. Menteng Raya No. 64, Jakarta Pusat',
    email: 'kevin.tan@gmail.com',
    nomorPonsel: '081198769905',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    targetRaw: { SE: 17, WA: 16, AN: 17, GE_points: 24, RA: 18, ZR: 17, FA: 17, WU: 17, ME: 14 },
    gayaBelajar: { visual: 12, auditori: 8, kinestetik: 16, dominant: 'Kinestetik' },
    papi: { profile: 'Decisive & Fast Paced', focus: 'Kecepatan Tanggap & Pemecahan Masalah Teknis' },
    rmib: { top1: 'Mechanical', top2: 'Computational', top3: 'Scientific' },
  },
  {
    id: 'participant_99_06',
    noPeserta: '9906',
    nik: '3578046011080006',
    nama: 'Nadia Syifa Rahmadani',
    gender: 'Wanita',
    tglLahir: '2008-11-20',
    umur: '18 Tahun',
    sekolah: 'SMAN 5 Surabaya',
    level: 'SMA',
    fakultas: 'Ilmu Komunikasi',
    prodi: 'Hubungan Masyarakat / Jurnalistik',
    alamat: 'Jl. Kusuma Bangsa No. 21, Surabaya',
    email: 'nadia.syifa.r@gmail.com',
    nomorPonsel: '085645679906',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    targetRaw: { SE: 15, WA: 16, AN: 14, GE_points: 21, RA: 9, ZR: 10, FA: 10, WU: 9, ME: 14 },
    gayaBelajar: { visual: 9, auditori: 19, kinestetik: 8, dominant: 'Auditori' },
    papi: { profile: 'Communicator & Diplomat', focus: 'Kecakapan Verbal & Keterbukaan Sosial' },
    rmib: { top1: 'Literary', top2: 'Artistic', top3: 'Social Service' },
  },
  {
    id: 'participant_99_07',
    noPeserta: '9907',
    nik: '3471021406080007',
    nama: 'Bagas Aditya Nugroho',
    gender: 'Pria',
    tglLahir: '2008-06-14',
    umur: '18 Tahun',
    sekolah: 'SMAN 1 Yogyakarta',
    level: 'SMA',
    fakultas: 'Pertanian',
    prodi: 'Agroteknologi & Kehutanan',
    alamat: 'Jl. Cik Di Tiro No. 1, Gondokusuman, Yogyakarta',
    email: 'bagas.aditya.n@gmail.com',
    nomorPonsel: '087788999907',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    targetRaw: { SE: 12, WA: 13, AN: 12, GE_points: 15, RA: 11, ZR: 11, FA: 11, WU: 10, ME: 12 },
    gayaBelajar: { visual: 15, auditori: 11, kinestetik: 10, dominant: 'Visual' },
    papi: { profile: 'Stable & Diligent', focus: 'Ketahanan Kerja Rutin & Disiplin Lingkungan' },
    rmib: { top1: 'Practical', top2: 'Mechanical', top3: 'Clerical' },
  },
  {
    id: 'participant_99_08',
    noPeserta: '9908',
    nik: '3578024501090008',
    nama: 'Jessica Amanda Widjaja',
    gender: 'Wanita',
    tglLahir: '2009-01-05',
    umur: '17 Tahun',
    sekolah: 'SMA Katolik St. Louis 1 Surabaya',
    level: 'SMA',
    fakultas: 'Psikologi',
    prodi: 'Psikologi & Riset Perilaku',
    alamat: 'Jl. Polisi Istimewa No. 7, Surabaya',
    email: 'jessica.amanda.w@gmail.com',
    nomorPonsel: '081233449908',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    targetRaw: { SE: 18, WA: 19, AN: 18, GE_points: 27, RA: 18, ZR: 17, FA: 17, WU: 17, ME: 18 },
    gayaBelajar: { visual: 19, auditori: 11, kinestetik: 6, dominant: 'Visual' },
    papi: { profile: 'Strategic Planner & Analyst', focus: 'Daya Konseptual & Pola Pikir Komprehensif' },
    rmib: { top1: 'Scientific', top2: 'Literary', top3: 'Computational' },
  },
  {
    id: 'participant_99_09',
    noPeserta: '9909',
    nik: '1371011807080009',
    nama: 'Rizky Fajar Ramadhan',
    gender: 'Pria',
    tglLahir: '2008-07-18',
    umur: '18 Tahun',
    sekolah: 'SMAN 2 Padang',
    level: 'SMA',
    fakultas: 'Teknik Sipil & Perencanaan',
    prodi: 'Teknik Sipil & Arsitektur',
    alamat: 'Jl. Jenderal Sudirman No. 34, Padang',
    email: 'rizky.fajar.r@gmail.com',
    nomorPonsel: '082169879909',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    targetRaw: { SE: 15, WA: 14, AN: 15, GE_points: 21, RA: 16, ZR: 16, FA: 15, WU: 15, ME: 13 },
    gayaBelajar: { visual: 10, auditori: 9, kinestetik: 17, dominant: 'Kinestetik' },
    papi: { profile: 'Energetic & Action-Oriented', focus: 'Ketahanan Fisik & Eksekusi Lapangan' },
    rmib: { top1: 'Mechanical', top2: 'Practical', top3: 'Outdoor' },
  },
  {
    id: 'participant_99_10',
    noPeserta: '9910',
    nik: '3573016310080010',
    nama: 'Tiara Maharani Kusuma',
    gender: 'Wanita',
    tglLahir: '2008-10-23',
    umur: '18 Tahun',
    sekolah: 'SMAN 3 Malang',
    level: 'SMA',
    fakultas: 'Ilmu Sosial & Politik',
    prodi: 'Sosiologi & Pengembangan Komunitas',
    alamat: 'Jl. Sultan Agung No. 7, Klojen, Malang',
    email: 'tiara.maharani.k@gmail.com',
    nomorPonsel: '083856789910',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&auto=format&fit=crop&q=80',
    targetRaw: { SE: 14, WA: 15, AN: 13, GE_points: 19, RA: 10, ZR: 9, FA: 11, WU: 10, ME: 13 },
    gayaBelajar: { visual: 11, auditori: 18, kinestetik: 7, dominant: 'Auditori' },
    papi: { profile: 'Empathetic & Supportive', focus: 'Pelayanan Sosial & Keterbukaan Empati' },
    rmib: { top1: 'Social Service', top2: 'Clerical', top3: 'Persuasive' },
  },
];

// Helper to construct answers that yield exact target raw scores
function generateAnswersForSpec(spec: ParticipantSeedSpec) {
  const answers: Record<string, Record<string, any>> = {};

  // 1. SE
  const seAns: Record<string, string> = {};
  SUBTEST1_SE_KEYS.forEach((k, idx) => {
    if (idx < spec.targetRaw.SE) {
      seAns[String(idx)] = k.letter.toUpperCase();
    } else {
      // Wrong answer
      seAns[String(idx)] = k.letter === 'a' ? 'B' : 'A';
    }
  });
  answers['subtest_0_ist_1'] = seAns;

  // 2. WA
  const waAns: Record<string, string> = {};
  SUBTEST2_WA_KEYS.forEach((k, idx) => {
    if (idx < spec.targetRaw.WA) {
      waAns[String(idx)] = k.letter.toUpperCase();
    } else {
      waAns[String(idx)] = k.letter === 'a' ? 'B' : 'A';
    }
  });
  answers['subtest_0_ist_2'] = waAns;

  // 3. AN
  const anAns: Record<string, string> = {};
  SUBTEST3_AN_KEYS.forEach((k, idx) => {
    if (idx < spec.targetRaw.AN) {
      anAns[String(idx)] = k.letter.toUpperCase();
    } else {
      anAns[String(idx)] = k.letter === 'a' ? 'B' : 'A';
    }
  });
  answers['subtest_0_ist_3'] = anAns;

  // 4. GE (points target)
  const geAns: Record<string, string> = {};
  let remainingPoints = spec.targetRaw.GE_points;
  SUBTEST4_GE_KEYS.forEach((k, idx) => {
    if (remainingPoints >= 2) {
      geAns[String(idx)] = k.score2Keywords[0] || 'alat';
      remainingPoints -= 2;
    } else if (remainingPoints === 1) {
      geAns[String(idx)] = k.score1Keywords[0] || 'bagian';
      remainingPoints -= 1;
    } else {
      geAns[String(idx)] = 'bukan';
    }
  });
  answers['subtest_0_ist_4'] = geAns;

  // 5. RA
  const raAns: Record<string, string> = {};
  SUBTEST5_RA_KEYS.forEach((k, idx) => {
    if (idx < spec.targetRaw.RA) {
      raAns[String(idx)] = String(k.answer);
    } else {
      raAns[String(idx)] = String(k.answer + 7);
    }
  });
  answers['subtest_0_ist_5'] = raAns;

  // 6. ZR
  const zrAns: Record<string, string> = {};
  SUBTEST6_ZR_KEYS.forEach((k, idx) => {
    if (idx < spec.targetRaw.ZR) {
      zrAns[String(idx)] = String(k.answer);
    } else {
      zrAns[String(idx)] = String(k.answer + 5);
    }
  });
  answers['subtest_0_ist_6'] = zrAns;

  // 7. FA
  const faAns: Record<string, string> = {};
  SUBTEST7_FA_KEYS.forEach((k, idx) => {
    if (idx < spec.targetRaw.FA) {
      faAns[String(idx)] = k.letter.toUpperCase();
    } else {
      faAns[String(idx)] = k.letter === 'a' ? 'B' : 'A';
    }
  });
  answers['subtest_0_ist_7'] = faAns;

  // 8. WU
  const wuAns: Record<string, string> = {};
  SUBTEST8_WU_KEYS.forEach((k, idx) => {
    if (idx < spec.targetRaw.WU) {
      wuAns[String(idx)] = k.letter.toUpperCase();
    } else {
      wuAns[String(idx)] = k.letter === 'a' ? 'B' : 'A';
    }
  });
  answers['subtest_0_ist_8'] = wuAns;

  // 9. ME
  const meAns: Record<string, string> = {};
  SUBTEST9_ME_KEYS.forEach((k, idx) => {
    if (idx < spec.targetRaw.ME) {
      meAns[String(idx)] = k.letter.toUpperCase();
    } else {
      meAns[String(idx)] = k.letter === 'a' ? 'B' : 'A';
    }
  });
  answers['subtest_0_ist_9'] = meAns;

  // Gaya Belajar (36 items)
  const gbAns: Record<string, string> = {};
  for (let i = 0; i < 36; i++) {
    if (i < spec.gayaBelajar.visual) {
      gbAns[String(i)] = 'A';
    } else if (i < spec.gayaBelajar.visual + spec.gayaBelajar.auditori) {
      gbAns[String(i)] = 'B';
    } else {
      gbAns[String(i)] = 'C';
    }
  }
  answers['subtest_4'] = gbAns;

  // PAPI Kostick (90 items)
  const papiAns: Record<string, string> = {};
  for (let i = 0; i < 90; i++) {
    papiAns[String(i)] = i % 2 === 0 ? 'A' : 'B';
  }
  answers['subtest_2'] = papiAns;

  // RMIB
  answers['subtest_1'] = {
    '0': `${spec.rmib.top1},${spec.rmib.top2},${spec.rmib.top3}`,
    '1': `${spec.rmib.top1},${spec.rmib.top2}`,
  };

  return answers;
}

async function runSeed() {
  console.log(`Starting to seed 10 completed dummy participants for Event 9.9 (${EVENT_ID})...`);

  for (const spec of PARTICIPANTS) {
    const answers = generateAnswersForSpec(spec);
    const graded = calculateAllIstSubtests(answers);

    // Compute full processed psychometrics
    const processed = processParticipantScores(graded.rawScores, {
      id: spec.id,
      nomorTes: spec.noPeserta,
      nama: spec.nama,
      jenisKelamin: spec.gender === 'Wanita' ? 'P' : 'L',
      tanggalLahir: spec.tglLahir,
      tanggalTes: '2026-09-11',
      usia: spec.umur,
      pendidikan: spec.level,
      asalSekolahInstitusi: spec.sekolah,
    });

    const completedTests = {
      subtest_0_ist_1: true,
      subtest_0_ist_2: true,
      subtest_0_ist_3: true,
      subtest_0_ist_4: true,
      subtest_0_ist_5: true,
      subtest_0_ist_6: true,
      subtest_0_ist_7: true,
      subtest_0_ist_8: true,
      subtest_0_ist_9: true,
      subtest_1: true,
      subtest_2: true,
      subtest_4: true,
    };

    const subtestLogs = {
      subtest_0_ist_1: { status: 'completed', subtestName: 'Intelegensi (Subtes 1 - SE)', durationSeconds: 320, finishReason: 'manual_submit' },
      subtest_0_ist_2: { status: 'completed', subtestName: 'Intelegensi (Subtes 2 - WA)', durationSeconds: 310, finishReason: 'manual_submit' },
      subtest_0_ist_3: { status: 'completed', subtestName: 'Intelegensi (Subtes 3 - AN)', durationSeconds: 330, finishReason: 'manual_submit' },
      subtest_0_ist_4: { status: 'completed', subtestName: 'Intelegensi (Subtes 4 - GE)', durationSeconds: 410, finishReason: 'manual_submit' },
      subtest_0_ist_5: { status: 'completed', subtestName: 'Intelegensi (Subtes 5 - RA)', durationSeconds: 460, finishReason: 'manual_submit' },
      subtest_0_ist_6: { status: 'completed', subtestName: 'Intelegensi (Subtes 6 - ZR)', durationSeconds: 470, finishReason: 'manual_submit' },
      subtest_0_ist_7: { status: 'completed', subtestName: 'Intelegensi (Subtes 7 - FA)', durationSeconds: 380, finishReason: 'manual_submit' },
      subtest_0_ist_8: { status: 'completed', subtestName: 'Intelegensi (Subtes 8 - WU)', durationSeconds: 410, finishReason: 'manual_submit' },
      subtest_0_ist_9: { status: 'completed', subtestName: 'Intelegensi (Subtes 9 - ME)', durationSeconds: 300, finishReason: 'manual_submit' },
      subtest_1: { status: 'completed', subtestName: 'RMIB', durationSeconds: 650, finishReason: 'manual_submit' },
      subtest_2: { status: 'completed', subtestName: 'Papi Kostick', durationSeconds: 720, finishReason: 'manual_submit' },
      subtest_4: { status: 'completed', subtestName: 'Gaya Belajar', durationSeconds: 450, finishReason: 'manual_submit' },
    };

    const docPayload = {
      id: spec.id,
      noPeserta: spec.noPeserta,
      nik: spec.nik,
      nama: spec.nama,
      namaPeserta: spec.nama,
      gender: spec.gender,
      jenisKelamin: spec.gender === 'Pria' ? 'L' : 'P',
      email: spec.email,
      nomorPonsel: spec.nomorPonsel,
      noWa: spec.nomorPonsel,
      tglLahir: spec.tglLahir,
      tanggalLahir: spec.tglLahir,
      umur: spec.umur,
      usia: spec.umur,
      level: spec.level,
      sekolah: spec.sekolah,
      asalSekolah: spec.sekolah,
      asalSekolahInstitusi: spec.sekolah,
      fakultas: spec.fakultas,
      prodi: spec.prodi,
      programStudi: spec.prodi,
      alamat: spec.alamat,
      avatar: spec.avatar,
      status: 'Account Active',
      hasLock: true,
      event: EVENT_ID,
      eventId: EVENT_ID,
      eventName: EVENT_NAME,
      tglDaftar: '11 Sep 2026',
      createdAt: new Date('2026-09-11T08:30:00Z'),

      // Full test completion
      completedTests,
      subtestLogs,
      answers,

      // Calculated Scores (already synced)
      rawScores: processed.rawScores,
      geTotalPoints: graded.geTotalPoints || spec.targetRaw.GE_points,
      geConvertedRS: processed.rawScores.GE,
      totalRaw: processed.totalRaw,
      totalSS: processed.totalSS,
      totalIQ: processed.totalIQ,
      iqCategory: processed.iqCategory,
      streamPreference: processed.streamAnalysis.preference,
      streamDescription: processed.streamAnalysis.description,
      subtestDetails: processed.subtestDetails.map(s => ({
        code: s.code,
        name: s.name,
        rw: s.rw,
        ss: s.ss,
        iq: s.iq,
        category: s.category,
      })),

      // Non-Cognitive
      gayaBelajar: spec.gayaBelajar,
      skorVisual: spec.gayaBelajar.visual,
      skorAuditori: spec.gayaBelajar.auditori,
      skorKinestetik: spec.gayaBelajar.kinestetik,
      papi: spec.papi,
      papiProfile: spec.papi.profile,
      papiFocus: spec.papi.focus,
      rmib: spec.rmib,
      rmibTop1: spec.rmib.top1,
      rmibTop2: spec.rmib.top2,
      rmibTop3: spec.rmib.top3,
      mbti: {
        type: spec.gender === 'Pria' ? 'ENTJ' : 'INFJ',
        role: spec.gender === 'Pria' ? 'Komandan & Pengatur Strategi' : 'Advokat Visioner & Pengayom',
      },
    };

    await setDoc(doc(db, 'participants', spec.id), docPayload, { merge: true });
    console.log(`✓ Inserted: ${spec.noPeserta} - ${spec.nama} (IQ: ${processed.totalIQ} ${processed.iqCategory}, ${processed.streamAnalysis.preference})`);
  }

  console.log('\nSeeding successfully finished! All 10 participants are active and stored in Firestore.');
}

runSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
