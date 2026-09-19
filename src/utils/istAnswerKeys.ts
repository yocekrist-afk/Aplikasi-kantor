import { RawScores, SubtestCode } from '../types/ist';
import { convertRawToStandardScoreByAge } from '../data/istAgeNorms';

/**
 * ============================================================================
 * KUNCI JAWABAN RESMI & KRITERIA PENILAIAN IST (INTELLIGENZ STRUKTUR TEST)
 * Berdasarkan Buku Manual & Norma IST Resmi (Subtes 1 s.d. Subtes 9 / Soal 1-176)
 * ============================================================================
 */

// Helper pembersih teks
function normalizeText(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeNumber(val: any): string {
  if (val === null || val === undefined) return '';
  const s = String(val).trim().toLowerCase();
  // Hilangkan karakter non-digit selain minus (misal: "Rp", "rupiah", "km", "jam", spasi)
  return s.replace(/[^0-9-]/g, '');
}

// ----------------------------------------------------------------------------
// 1. SUBTES 1 (SE: Melengkapi Kalimat) - 20 Soal (No. 1 - 20)
// Penyekoran: 0 - 1. Skor Mentah (RS/RW) = total jawaban benar (Maks 20)
// ----------------------------------------------------------------------------
export interface MultipleChoiceKey {
  no: number;
  letter: 'a' | 'b' | 'c' | 'd' | 'e';
  text: string;
}

export const SUBTEST1_SE_KEYS: MultipleChoiceKey[] = [
  { no: 1, letter: 'b', text: 'kewibawaan' },
  { no: 2, letter: 'e', text: 'boros' },
  { no: 3, letter: 'c', text: 'gempa bumi' },
  { no: 4, letter: 'c', text: 'khianat' },
  { no: 5, letter: 'e', text: 'kuku' },
  { no: 6, letter: 'd', text: 'biasanya' },
  { no: 7, letter: 'a', text: 'lemak' },
  { no: 8, letter: 'a', text: 'lawan' },
  { no: 9, letter: 'd', text: 'hipotesis' },
  { no: 10, letter: 'a', text: 'sol' },
  { no: 11, letter: 'c', text: 'kotak pppk' },
  { no: 12, letter: 'd', text: '25' },
  { no: 13, letter: 'a', text: 'konservatif' },
  { no: 14, letter: 'e', text: 'selalu' },
  { no: 15, letter: 'c', text: '800' },
  { no: 16, letter: 'd', text: 'ayunan' },
  { no: 17, letter: 'b', text: 'biasanya' },
  { no: 18, letter: 'e', text: 'bandung' },
  { no: 19, letter: 'c', text: 'kemungkinan menang' },
  { no: 20, letter: 'd', text: '130' },
];

// ----------------------------------------------------------------------------
// 2. SUBTES 2 (WA: Persamaan Kata / Mencari Kata Berbeda) - 20 Soal (No. 21 - 40)
// Penyekoran: 0 - 1. Skor Mentah (RS/RW) = total jawaban benar (Maks 20)
// ----------------------------------------------------------------------------
export const SUBTEST2_WA_KEYS: MultipleChoiceKey[] = [
  { no: 21, letter: 'a', text: 'panah' },
  { no: 22, letter: 'd', text: 'memaki' },
  { no: 23, letter: 'c', text: 'isi' },
  { no: 24, letter: 'e', text: 'melepaskan' },
  { no: 25, letter: 'd', text: 'perjalanan' },
  { no: 26, letter: 'b', text: 'tugas' },
  { no: 27, letter: 'a', text: 'payung' },
  { no: 28, letter: 'e', text: 'kasar' },
  { no: 29, letter: 'a', text: 'sepeda' },
  { no: 30, letter: 'c', text: 'biola' },
  { no: 31, letter: 'b', text: 'lurus' },
  { no: 32, letter: 'a', text: 'jam' },
  { no: 33, letter: 'e', text: 'kebijaksanaan' },
  { no: 34, letter: 'e', text: 'berjalan' },
  { no: 35, letter: 'b', text: 'potret' },
  { no: 36, letter: 'c', text: 'panjang' },
  { no: 37, letter: 'a', text: 'gunting' },
  { no: 38, letter: 'b', text: 'masyarakat' },
  { no: 39, letter: 'e', text: 'memahat' },
  { no: 40, letter: 'd', text: 'bulu' },
];

// ----------------------------------------------------------------------------
// 3. SUBTES 3 (AN: Analogi Verbal) - 20 Soal (No. 41 - 60)
// Penyekoran: 0 - 1. Skor Mentah (RS/RW) = total jawaban benar (Maks 20)
// ----------------------------------------------------------------------------
export const SUBTEST3_AN_KEYS: MultipleChoiceKey[] = [
  { no: 41, letter: 'd', text: 'melupakan' },
  { no: 42, letter: 'b', text: 'sangkar' },
  { no: 43, letter: 'a', text: 'jalan raya' },
  { no: 44, letter: 'b', text: 'gelang' },
  { no: 45, letter: 'e', text: 'kubus' },
  { no: 46, letter: 'a', text: 'menentukan' },
  { no: 47, letter: 'a', text: 'tengik' },
  { no: 48, letter: 'c', text: 'sungai' },
  { no: 49, letter: 'b', text: 'pelindung' },
  { no: 50, letter: 'd', text: 'tukang emas' },
  { no: 51, letter: 'e', text: 'nada' },
  { no: 52, letter: 'e', text: 'kelakar' },
  { no: 53, letter: 'b', text: 'suasana hati' },
  { no: 54, letter: 'a', text: 'sutera' },
  { no: 55, letter: 'c', text: 'panjang senar' },
  { no: 56, letter: 'd', text: 'mutasi' },
  { no: 57, letter: 'b', text: 'es' },
  { no: 58, letter: 'a', text: 'ditempa' },
  { no: 59, letter: 'c', text: 'mikroskop' },
  { no: 60, letter: 'd', text: 'lautan api' },
];

// ----------------------------------------------------------------------------
// 4. SUBTES 4 (GE: Sifat yang Sama) - 16 Soal (No. 61 - 76)
// Penyekoran Butir: 0 - 1 - 2 (Tabel 2)
// Skor Total: Jumlah poin 16 soal (0 - 32)
// Skor Mentah (RS): Konversi Skor Total ke RS menggunakan TABEL 3 (Maks 20)
// ----------------------------------------------------------------------------
export interface GeQuestionCriteria {
  no: number;
  words: [string, string];
  score2Keywords: string[];
  score1Keywords: string[];
  score0Keywords?: string[];
}

export const DEFAULT_SUBTEST4_GE_KEYS: GeQuestionCriteria[] = [
  {
    no: 61,
    words: ['mawar', 'melati'],
    score2Keywords: ['bunga', 'kembang', 'perdu'],
    score1Keywords: ['tumbuh-tumbuhan', 'tumbuhan', 'tanaman', 'tangkai', 'harum', 'wangi'],
    score0Keywords: ['pohon'],
  },
  {
    no: 62,
    words: ['mata', 'telinga'],
    score2Keywords: ['alat indera', 'alat indra', 'indera', 'indra', 'panca indera', 'pancaindera', 'panca indra'],
    score1Keywords: ['organ', 'organ tubuh', 'alat tubuh', 'bagian tubuh', 'indra manusia'],
    score0Keywords: ['kepala', 'alat'],
  },
  {
    no: 63,
    words: ['gula', 'intan'],
    score2Keywords: ['hablur', 'kristal', 'zat arang/karbon', 'zat arang', 'zat karbon', 'karbon', 'arang'],
    score1Keywords: ['berkilauan', 'kilau', 'mengkilat', 'mengkilap', 'bening', 'putih', 'padat'],
    score0Keywords: ['mahal', 'permata'],
  },
  {
    no: 64,
    words: ['hujan', 'salju'],
    score2Keywords: ['cuaca', 'iklim'],
    score1Keywords: ['air/basah', 'air', 'basah', 'gejala alam', 'fenomena alam', 'presipitasi', 'endapan air'],
    score0Keywords: ['musim dingin'],
  },
  {
    no: 65,
    words: ['pengantar surat', 'telepon'],
    score2Keywords: ['pembawa berita', 'alat perhubungan', 'alat penghubung', 'perantara berita'],
    score1Keywords: ['pos', 'telekomunikasi', 'perhubungan', 'komunikasi', 'media komunikasi', 'penyampai pesan'],
    score0Keywords: [],
  },
  {
    no: 66,
    words: ['kamera', 'kacamata'],
    score2Keywords: ['alat optik', 'optik', 'alat optis'],
    score1Keywords: ['lensa', 'kaca'],
    score0Keywords: ['melihat', 'alat penglihatan'],
  },
  {
    no: 67,
    words: ['lambung', 'usus'],
    score2Keywords: ['alat pencernaan', 'sistem pencernaan', 'organ pencernaan'],
    score1Keywords: ['jalan makanan', 'perut/isi perut', 'perut', 'isi perut', 'pencernaan makanan', 'organ dalam'],
    score0Keywords: ['makanan'],
  },
  {
    no: 68,
    words: ['banyak', 'sedikit'],
    score2Keywords: ['penyebut jumlah', 'pengertian jumlah', 'jumlah', 'kuantitas'],
    score1Keywords: ['mengukur', 'ukuran', 'kadar', 'takaran', 'volume'],
    score0Keywords: ['uang'],
  },
  {
    no: 69,
    words: ['telur', 'benih'],
    score2Keywords: ['bibit', 'alat pembiak', 'permulaan', 'penghidupan', 'cikal bakal', 'bakal kehidupan'],
    score1Keywords: ['sel', 'pembiakan', 'perkembangbiakan', 'bakal'],
    score0Keywords: ['pertanian', 'keturunan'],
  },
  {
    no: 70,
    words: ['bendera', 'lencana'],
    score2Keywords: ['simbol', 'lambang', 'tanda'],
    score1Keywords: ['nama', 'tanda pengenal', 'identitas', 'atribut'],
    score0Keywords: ['warna'],
  },
  {
    no: 71,
    words: ['rumput', 'gajah'],
    score2Keywords: ['makhluk', 'makhluk hidup', 'organisme'],
    score1Keywords: ['tumbuh hidup', 'biologi', 'ilmu hayati', 'ciptaan tuhan'],
    score0Keywords: ['hutan'],
  },
  {
    no: 72,
    words: ['ember', 'kantong'],
    score2Keywords: ['wadah', 'tempat pengisi', 'tempat penyimpan', 'tempat penyimpanan', 'penampung', 'tempat menaruh'],
    score1Keywords: ['alat', 'tempat sesuatu', 'tempat', 'benda', 'barang'],
    score0Keywords: ['lumbung'],
  },
  {
    no: 73,
    words: ['awal', 'akhir'],
    score2Keywords: ['pengertian waktu', 'batas', 'batasan', 'terminasi'],
    score1Keywords: ['waktu/masa', 'waktu', 'masa', 'lamanya', 'durasi', 'fase'],
    score0Keywords: ['buku'],
  },
  {
    no: 74,
    words: ['kikir', 'boros'],
    score2Keywords: ['watak', 'karakter', 'kepribadian'],
    score1Keywords: ['sifat', 'sikap', 'perilaku', 'tabiat'],
    score0Keywords: ['uang'],
  },
  {
    no: 75,
    words: ['penawaran', 'permintaan'],
    score2Keywords: ['regulator harga', 'pengertian ekonomi', 'konsep ekonomi', 'istilah ekonomi', 'hukum ekonomi'],
    score1Keywords: ['dagang/niaga', 'dagang', 'niaga', 'penjualan/pembelian', 'jual beli', 'transaksi', 'pasar'],
    score0Keywords: ['lawan kata'],
  },
  {
    no: 76,
    words: ['atas', 'bawah'],
    score2Keywords: ['pengertian ruang', 'penyebut ruang', 'konsep ruang'],
    score1Keywords: ['arah/letak', 'arah', 'letak', 'penentuan daerah', 'tempat/ruang', 'tempat', 'ruang', 'penunjuk tempat', 'posisi', 'kedudukan'],
    score0Keywords: ['daerah', 'tingkatan', 'ruangan'],
  },
];

// Inisialisasi kamus dari memori lokal jika sudah pernah dikalibrasi
function loadInitialGeKeys(): GeQuestionCriteria[] {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('ist_custom_ge_keys');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 16) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat kamus custom GE dari storage:', e);
    }
  }
  return JSON.parse(JSON.stringify(DEFAULT_SUBTEST4_GE_KEYS));
}

export let SUBTEST4_GE_KEYS: GeQuestionCriteria[] = loadInitialGeKeys();

/**
 * Mengambil daftar kriteria Subtes 4 saat ini (aktif)
 */
export function getGeCriteriaList(): GeQuestionCriteria[] {
  return SUBTEST4_GE_KEYS;
}

/**
 * Menyimpan pembaruan kriteria Subtes 4 ke memori aktif & localStorage
 */
export function updateGeCriteriaList(newList: GeQuestionCriteria[]): void {
  SUBTEST4_GE_KEYS = newList;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ist_custom_ge_keys', JSON.stringify(newList));
    } catch (e) {
      console.warn('Gagal menyimpan kamus custom GE ke storage:', e);
    }
  }
}

/**
 * Mengembalikan seluruh kriteria Subtes 4 ke Norma Baku IST Resmi
 */
export function resetGeCriteriaToDefault(): GeQuestionCriteria[] {
  SUBTEST4_GE_KEYS = JSON.parse(JSON.stringify(DEFAULT_SUBTEST4_GE_KEYS));
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('ist_custom_ge_keys');
    } catch (e) {
      console.warn('Gagal mereset kamus custom GE di storage:', e);
    }
  }
  return SUBTEST4_GE_KEYS;
}

/**
 * TABEL 3: Konversi Skor Total Subtes 4 (GE) ke Skor Mentah (RS / RW)
 * Berlaku untuk semua usia (Sesuai Halaman 22 Manual IST Resmi)
 */
export const GE_TABLE_3_ENTRIES = [
  { pointsRange: '0 - 1', min: 0, max: 1, rs: 1 },
  { pointsRange: '2', min: 2, max: 2, rs: 2 },
  { pointsRange: '3', min: 3, max: 3, rs: 3 },
  { pointsRange: '4', min: 4, max: 4, rs: 4 },
  { pointsRange: '5 - 6', min: 5, max: 6, rs: 5 },
  { pointsRange: '7 - 8', min: 7, max: 8, rs: 6 },
  { pointsRange: '9 - 10', min: 9, max: 10, rs: 7 },
  { pointsRange: '11 - 12', min: 11, max: 12, rs: 8 },
  { pointsRange: '13 - 14', min: 13, max: 14, rs: 9 },
  { pointsRange: '15 - 16', min: 15, max: 16, rs: 10 },
  { pointsRange: '17 - 18', min: 17, max: 18, rs: 11 },
  { pointsRange: '19 - 20', min: 19, max: 20, rs: 12 },
  { pointsRange: '21 - 22', min: 21, max: 22, rs: 13 },
  { pointsRange: '23 - 24', min: 23, max: 24, rs: 14 },
  { pointsRange: '25 - 26', min: 25, max: 26, rs: 15 },
  { pointsRange: '27', min: 27, max: 27, rs: 16 },
  { pointsRange: '28', min: 28, max: 28, rs: 17 },
  { pointsRange: '29', min: 29, max: 29, rs: 18 },
  { pointsRange: '30', min: 30, max: 30, rs: 19 },
  { pointsRange: '31 - 32', min: 31, max: 32, rs: 20 },
];

export function convertGeTotalToRS(totalGePoints: number): number {
  if (totalGePoints <= 0) return 0;
  if (totalGePoints <= 1) return 1; // 0 - 1 = 1
  if (totalGePoints === 2) return 2;
  if (totalGePoints === 3) return 3;
  if (totalGePoints === 4) return 4;
  if (totalGePoints <= 6) return 5;  // 5 - 6 = 5
  if (totalGePoints <= 8) return 6;  // 7 - 8 = 6
  if (totalGePoints <= 10) return 7; // 9 - 10 = 7
  if (totalGePoints <= 12) return 8; // 11 - 12 = 8
  if (totalGePoints <= 14) return 9; // 13 - 14 = 9
  if (totalGePoints <= 16) return 10; // 15 - 16 = 10
  if (totalGePoints <= 18) return 11; // 17 - 18 = 11
  if (totalGePoints <= 20) return 12; // 19 - 20 = 12
  if (totalGePoints <= 22) return 13; // 21 - 22 = 13
  if (totalGePoints <= 24) return 14; // 23 - 24 = 14
  if (totalGePoints <= 26) return 15; // 25 - 26 = 15
  if (totalGePoints === 27) return 16;
  if (totalGePoints === 28) return 17;
  if (totalGePoints === 29) return 18;
  if (totalGePoints === 30) return 19;
  return 20; // > 30 (31 - 32) = 20
}

/**
 * Menghitung jarak Levenshtein antara dua string untuk toleransi typo
 */
function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Memeriksa apakah kata/frasa pengguna cocok secara fuzzy dengan kata kunci
 * Mendukung typo 1 karakter pada kata pendek (misal: "cuca", "cusca" -> "cuaca")
 */
function isFuzzyKeywordMatch(userText: string, keyword: string): boolean {
  if (!userText || !keyword) return false;

  const cleanUser = userText.trim().toLowerCase();
  const cleanKw = keyword.trim().toLowerCase();

  // 1. Exact match atau direct substring match
  if (cleanUser === cleanKw || cleanUser.includes(cleanKw)) {
    return true;
  }

  // Jika kata kunci terdiri dari banyak kata (frasa, misal "alat optik")
  if (cleanKw.includes(' ')) {
    // Jika panjang frasa berdekatan, toleransi beda 1-2 huruf
    if (Math.abs(cleanUser.length - cleanKw.length) <= 2) {
      const dist = levenshteinDistance(cleanUser, cleanKw);
      if (dist <= 2) return true;
    }
    return false;
  }

  // Jika kata kunci berupa 1 kata (misal "cuaca", "bunga", "kristal", "iklim")
  // Pisahkan input pengguna menjadi kata-kata (token)
  const userWords = cleanUser.split(/[\s,./-]+/).filter(Boolean);

  for (const w of userWords) {
    if (w === cleanKw) return true;

    const maxLen = Math.max(w.length, cleanKw.length);
    const dist = levenshteinDistance(w, cleanKw);

    // Kata sangat pendek (<= 3 huruf) tidak boleh typo agar tidak ambigu
    if (maxLen <= 3) {
      if (dist === 0) return true;
      continue;
    }

    // Kata panjang 4 - 6 huruf (seperti "cuaca", "bunga", "wadah", "iklim"):
    // Toleransi edit distance <= 1 (misal "cuca" dist 1, "cusca" dist 1, "cuac" dist 1)
    if (maxLen <= 6) {
      if (dist <= 1) return true;
    } else {
      // Kata panjang >= 7 huruf (seperti "kristal", "organisme"):
      // Toleransi edit distance <= 2 jika rasio kemiripan >= 75%
      if (dist <= 2 && (maxLen - dist) / maxLen >= 0.75) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Menilai satu jawaban peserta untuk Subtes 4 (GE)
 * Mengembalikan skor 2, 1, atau 0 dengan toleransi typo cerdas (Fuzzy Matching)
 */
export function scoreGeItem(questionIndex: number, userAnswer: any): number {
  const normAns = normalizeText(userAnswer);
  if (!normAns) return 0;

  const criteria = SUBTEST4_GE_KEYS[questionIndex];
  if (!criteria) return 0;

  // 1. Cek apakah jawaban peserta memuat kata kunci skor 0 yang dilarang
  if (criteria.score0Keywords && criteria.score0Keywords.some((w) => normAns.includes(w))) {
    return 0;
  }

  // 2. Cek kata kunci Skor 2 (abstraksi tinggi / kategori tepat)
  // Termasuk toleransi typo cerdas (misal: "cuca", "cusca" -> "cuaca")
  for (const kw of criteria.score2Keywords) {
    if (isFuzzyKeywordMatch(normAns, kw)) {
      return 2;
    }
  }

  // 3. Cek kata kunci Skor 1 (abstraksi fungsional / sebagian)
  for (const kw of criteria.score1Keywords) {
    if (isFuzzyKeywordMatch(normAns, kw)) {
      return 1;
    }
  }

  return 0;
}

export interface GeDetailedEvaluation {
  score: 0 | 1 | 2;
  matchType: 'exact' | 'fuzzy' | 'blacklist' | 'none';
  matchedKeyword?: string;
  matchedWordInAnswer?: string;
  editDistance?: number;
  explanation: string;
  questionNo: number;
  words: [string, string];
}

/**
 * Simulator & Validator Kata Subtes 4 (GE)
 * Menampilkan detail lengkap analisis pencocokan kata, jarak edit (Levenshtein),
 * dan alasan penilaian untuk keperluan evaluasi psikometrik.
 */
export function testGeWordDetailed(questionNoOrIndex: number, userAnswer: string): GeDetailedEvaluation {
  const normAns = normalizeText(userAnswer);
  
  // Cari kriteria berdasarkan nomor soal (61-76) atau indeks (0-15)
  let criteria = SUBTEST4_GE_KEYS.find((c) => c.no === questionNoOrIndex);
  if (!criteria && questionNoOrIndex >= 0 && questionNoOrIndex < SUBTEST4_GE_KEYS.length) {
    criteria = SUBTEST4_GE_KEYS[questionNoOrIndex];
  }
  if (!criteria) {
    criteria = SUBTEST4_GE_KEYS[0];
  }

  const resultBase: GeDetailedEvaluation = {
    score: 0,
    matchType: 'none',
    explanation: 'Jawaban tidak memenuhi konsep kesamaan esensial maupun fungsional.',
    questionNo: criteria.no,
    words: criteria.words,
  };

  if (!normAns) {
    resultBase.explanation = 'Jawaban kosong / belum diisi.';
    return resultBase;
  }

  // 1. Cek Blacklist (Skor 0)
  if (criteria.score0Keywords && criteria.score0Keywords.length > 0) {
    for (const kw of criteria.score0Keywords) {
      if (normAns.includes(kw) || isFuzzyKeywordMatch(normAns, kw)) {
        return {
          ...resultBase,
          score: 0,
          matchType: 'blacklist',
          matchedKeyword: kw,
          explanation: `Memuat kata terlarang / konsep salah: "${kw}" (Kaidah Baku IST memberi Skor 0).`,
        };
      }
    }
  }

  // 2. Cek Skor 2 (Exact match terlebih dahulu)
  for (const kw of criteria.score2Keywords) {
    const cleanKw = kw.toLowerCase().trim();
    if (normAns === cleanKw || normAns.includes(cleanKw)) {
      return {
        ...resultBase,
        score: 2,
        matchType: 'exact',
        matchedKeyword: kw,
        editDistance: 0,
        explanation: `Pencocokan persis (Exact Match) dengan konsep esensial / genus proximum: "${kw}".`,
      };
    }
  }

  // 3. Cek Skor 2 (Fuzzy Typo Tolerated)
  const userWords = normAns.split(/[\s,./-]+/).filter(Boolean);
  for (const kw of criteria.score2Keywords) {
    const cleanKw = kw.toLowerCase().trim();
    if (cleanKw.includes(' ')) {
      const dist = levenshteinDistance(normAns, cleanKw);
      if (dist <= 2) {
        return {
          ...resultBase,
          score: 2,
          matchType: 'fuzzy',
          matchedKeyword: kw,
          editDistance: dist,
          explanation: `Toleransi typo pada frasa esensial "${kw}" (Jarak Levenshtein = ${dist}).`,
        };
      }
    } else {
      for (const w of userWords) {
        const dist = levenshteinDistance(w, cleanKw);
        const maxLen = Math.max(w.length, cleanKw.length);
        if (
          maxLen > 3 &&
          ((maxLen <= 6 && dist <= 1) || (maxLen > 6 && dist <= 2 && (maxLen - dist) / maxLen >= 0.75))
        ) {
          return {
            ...resultBase,
            score: 2,
            matchType: 'fuzzy',
            matchedKeyword: kw,
            matchedWordInAnswer: w,
            editDistance: dist,
            explanation: `Toleransi typo cerdas: Kata "${w}" dikenali sebagai variasi kata kunci esensial "${kw}" (Jarak Levenshtein = ${dist}).`,
          };
        }
      }
    }
  }

  // 4. Cek Skor 1 (Exact match)
  for (const kw of criteria.score1Keywords) {
    const cleanKw = kw.toLowerCase().trim();
    if (normAns === cleanKw || normAns.includes(cleanKw)) {
      return {
        ...resultBase,
        score: 1,
        matchType: 'exact',
        matchedKeyword: kw,
        editDistance: 0,
        explanation: `Pencocokan persis (Exact Match) dengan konsep fungsional / parsial: "${kw}".`,
      };
    }
  }

  // 5. Cek Skor 1 (Fuzzy Typo Tolerated)
  for (const kw of criteria.score1Keywords) {
    const cleanKw = kw.toLowerCase().trim();
    if (cleanKw.includes(' ')) {
      const dist = levenshteinDistance(normAns, cleanKw);
      if (dist <= 2) {
        return {
          ...resultBase,
          score: 1,
          matchType: 'fuzzy',
          matchedKeyword: kw,
          editDistance: dist,
          explanation: `Toleransi typo pada frasa fungsional "${kw}" (Jarak Levenshtein = ${dist}).`,
        };
      }
    } else {
      for (const w of userWords) {
        const dist = levenshteinDistance(w, cleanKw);
        const maxLen = Math.max(w.length, cleanKw.length);
        if (
          maxLen > 3 &&
          ((maxLen <= 6 && dist <= 1) || (maxLen > 6 && dist <= 2 && (maxLen - dist) / maxLen >= 0.75))
        ) {
          return {
            ...resultBase,
            score: 1,
            matchType: 'fuzzy',
            matchedKeyword: kw,
            matchedWordInAnswer: w,
            editDistance: dist,
            explanation: `Toleransi typo cerdas: Kata "${w}" dikenali sebagai variasi fungsional dari "${kw}" (Jarak Levenshtein = ${dist}).`,
          };
        }
      }
    }
  }

  return resultBase;
}

// ----------------------------------------------------------------------------
// 5. SUBTES 5 (RA: Berhitung) - 20 Soal (No. 77 - 96)
// Penyekoran: 0 - 1. Skor Mentah (RS/RW) = total jawaban benar (Maks 20)
// ----------------------------------------------------------------------------
export interface NumericKey {
  no: number;
  answer: number;
}

export const SUBTEST5_RA_KEYS: NumericKey[] = [
  { no: 77, answer: 35 },
  { no: 78, answer: 560 },
  { no: 79, answer: 205 },
  { no: 80, answer: 30 },
  { no: 81, answer: 26 },
  { no: 82, answer: 45 },
  { no: 83, answer: 70 },
  { no: 84, answer: 50 },
  { no: 85, answer: 48 },
  { no: 86, answer: 19 },
  { no: 87, answer: 78 },
  { no: 88, answer: 6 },
  { no: 89, answer: 750 },
  { no: 90, answer: 90 },
  { no: 91, answer: 120 },
  { no: 92, answer: 17 },
  { no: 93, answer: 24 },
  { no: 94, answer: 5 },
  { no: 95, answer: 48 },
  { no: 96, answer: 3 },
];

// ----------------------------------------------------------------------------
// 6. SUBTES 6 (ZR: Deret Angka) - 20 Soal (No. 97 - 116)
// Penyekoran: 0 - 1. Skor Mentah (RS/RW) = total jawaban benar (Maks 20)
// ----------------------------------------------------------------------------
export const SUBTEST6_ZR_KEYS: NumericKey[] = [
  { no: 97, answer: 27 },
  { no: 98, answer: 25 },
  { no: 99, answer: 27 },
  { no: 100, answer: 15 },
  { no: 101, answer: 46 },
  { no: 102, answer: 10 },
  { no: 103, answer: 24 },
  { no: 104, answer: 7 },
  { no: 105, answer: 5 },
  { no: 106, answer: 14 },
  { no: 107, answer: 8 },
  { no: 108, answer: 14 },
  { no: 109, answer: 45 },
  { no: 110, answer: 36 },
  { no: 111, answer: 12 },
  { no: 112, answer: 80 },
  { no: 113, answer: 14 },
  { no: 114, answer: 12 },
  { no: 115, answer: 36 },
  { no: 116, answer: 10 },
];

// ----------------------------------------------------------------------------
// 7. SUBTES 7 (FA: Memilih Gambar / Potongan Bidang) - 20 Soal (No. 117 - 136)
// Penyekoran: 0 - 1. Skor Mentah (RS/RW) = total jawaban benar (Maks 20)
// ----------------------------------------------------------------------------
export const SUBTEST7_FA_KEYS: MultipleChoiceKey[] = [
  { no: 117, letter: 'b', text: 'B' },
  { no: 118, letter: 'a', text: 'A' },
  { no: 119, letter: 'd', text: 'D' },
  { no: 120, letter: 'b', text: 'B' },
  { no: 121, letter: 'e', text: 'E' },
  { no: 122, letter: 'd', text: 'D' },
  { no: 123, letter: 'a', text: 'A' },
  { no: 124, letter: 'c', text: 'C' },
  { no: 125, letter: 'c', text: 'C' },
  { no: 126, letter: 'e', text: 'E' },
  { no: 127, letter: 'c', text: 'C' },
  { no: 128, letter: 'd', text: 'D' },
  { no: 129, letter: 'a', text: 'A' },
  { no: 130, letter: 'e', text: 'E' },
  { no: 131, letter: 'b', text: 'B' },
  { no: 132, letter: 'c', text: 'C' },
  { no: 133, letter: 'b', text: 'B' },
  { no: 134, letter: 'a', text: 'A' },
  { no: 135, letter: 'e', text: 'E' },
  { no: 136, letter: 'e', text: 'E' },
];

// ----------------------------------------------------------------------------
// 8. SUBTES 8 (WU: Kubus) - 20 Soal (No. 137 - 156)
// Penyekoran: 0 - 1. Skor Mentah (RS/RW) = total jawaban benar (Maks 20)
// ----------------------------------------------------------------------------
export const SUBTEST8_WU_KEYS: MultipleChoiceKey[] = [
  { no: 137, letter: 'e', text: 'E' },
  { no: 138, letter: 'd', text: 'D' },
  { no: 139, letter: 'b', text: 'B' },
  { no: 140, letter: 'c', text: 'C' },
  { no: 141, letter: 'e', text: 'E' },
  { no: 142, letter: 'd', text: 'D' },
  { no: 143, letter: 'b', text: 'B' },
  { no: 144, letter: 'd', text: 'D' },
  { no: 145, letter: 'c', text: 'C' },
  { no: 146, letter: 'e', text: 'E' },
  { no: 147, letter: 'a', text: 'A' },
  { no: 148, letter: 'b', text: 'B' },
  { no: 149, letter: 'c', text: 'C' },
  { no: 150, letter: 'a', text: 'A' },
  { no: 151, letter: 'b', text: 'B' },
  { no: 152, letter: 'a', text: 'A' },
  { no: 153, letter: 'e', text: 'E' },
  { no: 154, letter: 'c', text: 'C' },
  { no: 155, letter: 'a', text: 'A' },
  { no: 156, letter: 'd', text: 'D' },
];

// ----------------------------------------------------------------------------
// 9. SUBTES 9 (ME: Ingatan) - 20 Soal (No. 157 - 176)
// Penyekoran: 0 - 1. Skor Mentah (RS/RW) = total jawaban benar (Maks 20)
// ----------------------------------------------------------------------------
export const SUBTEST9_ME_KEYS: MultipleChoiceKey[] = [
  { no: 157, letter: 'a', text: 'kesenian' },
  { no: 158, letter: 'b', text: 'binatang' },
  { no: 159, letter: 'c', text: 'perkakas' },
  { no: 160, letter: 'e', text: 'bunga' },
  { no: 161, letter: 'd', text: 'burung' },
  { no: 162, letter: 'e', text: 'bunga' },
  { no: 163, letter: 'a', text: 'kesenian' },
  { no: 164, letter: 'b', text: 'binatang' },
  { no: 165, letter: 'd', text: 'burung' },
  { no: 166, letter: 'c', text: 'perkakas' },
  { no: 167, letter: 'c', text: 'perkakas' },
  { no: 168, letter: 'e', text: 'bunga' },
  { no: 169, letter: 'b', text: 'binatang' },
  { no: 170, letter: 'd', text: 'burung' },
  { no: 171, letter: 'a', text: 'kesenian' },
  { no: 172, letter: 'c', text: 'perkakas' },
  { no: 173, letter: 'b', text: 'binatang' },
  { no: 174, letter: 'e', text: 'bunga' },
  { no: 175, letter: 'd', text: 'burung' },
  { no: 176, letter: 'a', text: 'kesenian' },
];

// ----------------------------------------------------------------------------
// EVALUASI & PENYEKORAN OTOMATIS
// ----------------------------------------------------------------------------

/**
 * Mencocokkan jawaban pilihan ganda (toleran terhadap huruf a-e, teks opsi, atau format "b. kata")
 */
export function matchMultipleChoice(userAns: any, key: MultipleChoiceKey): boolean {
  if (userAns === null || userAns === undefined) return false;
  const raw = String(userAns).trim().toLowerCase();
  if (!raw) return false;

  const targetLetter = key.letter.toLowerCase();

  // 1. Jika jawaban persis huruf ('a', 'b', 'c', 'd', 'e')
  if (raw === targetLetter) return true;

  // Toleransi khusus soal No. 16 (Subtes 1 SE): baik 'd' (ayunan) maupun 'b' (kekuatan) diterima
  if (key.no === 16 && (raw === 'd' || raw === 'b' || raw.includes('ayunan') || raw.includes('kekuatan'))) {
    return true;
  }

  // Toleransi khusus soal No. 6 (Subtes 1 SE): baik 'd' (biasanya) maupun 'e' (selalu) diterima
  if (key.no === 6 && (raw === 'd' || raw === 'e' || raw.includes('biasanya') || raw.includes('selalu'))) {
    return true;
  }

  // 2. Format awalan dengan tanda baca (misal: "d. ", "d)", "d:")
  if (
    raw.startsWith(`${targetLetter}.`) || 
    raw.startsWith(`${targetLetter})`) || 
    raw.startsWith(`${targetLetter}:`) ||
    raw.startsWith(`${targetLetter} -`)
  ) return true;

  // 3. Format awalan label sistem (misal: "kubus d", "pilihan d", "opsi d", "bentuk d")
  if (
    raw === `kubus ${targetLetter}` ||
    raw === `pilihan ${targetLetter}` ||
    raw === `bentuk ${targetLetter}` ||
    raw === `opsi ${targetLetter}`
  ) return true;

  // 4. Jika jawaban memuat teks opsi kunci kata/frasa lengkap (panjang > 1 karakter dan bukan huruf itu sendiri)
  const keyTextNorm = normalizeText(key.text);
  if (keyTextNorm && keyTextNorm.length > 1 && keyTextNorm !== targetLetter) {
    if (raw === keyTextNorm || raw.includes(keyTextNorm)) return true;
  }

  // 5. Jika string hanya 1 karakter
  if (raw.length === 1 && raw === targetLetter) return true;

  return false;
}

/**
 * Mencocokkan jawaban numerik (RA dan ZR)
 */
export function matchNumeric(userAns: any, correctNum: number): boolean {
  if (userAns === null || userAns === undefined) return false;
  const rawClean = normalizeNumber(userAns);
  if (!rawClean) return false;
  const num = parseInt(rawClean, 10);
  if (!isNaN(num) && num === correctNum) return true;

  // Cek jika digit yang dipilih sama persis (sesuai kaidah lembar strip angka IST manual)
  // Misal jawaban 35 -> digit '3' dan '5'. Jika peserta menekan '35' atau '53', strip angkanya sama persis.
  const userDigits = rawClean.split('').sort().join('');
  const correctDigits = String(Math.abs(correctNum)).split('').sort().join('');
  if (userDigits === correctDigits) return true;

  return false;
}

// ----------------------------------------------------------------------------
// 10. TRIAL / SIMULASI PEMANASAN (5 Butir Soal Representatif IST)
// ----------------------------------------------------------------------------
export interface TrialQuestionKey {
  no: number;
  type: 'mc' | 'text' | 'number';
  answer: string | number;
  text?: string;
  keywords?: string[];
  questionPrompt: string;
}

export const SUBTEST_TRIAL_KEYS: TrialQuestionKey[] = [
  { no: 1, type: 'mc', answer: 'a', text: 'Sayap', questionPrompt: 'Burung memiliki...' },
  { no: 2, type: 'mc', answer: 'e', text: 'Lemari', questionPrompt: 'Manakah satu kata yang tidak memiliki kesamaan dengan keempat kata lainnya?' },
  { no: 3, type: 'mc', answer: 'b', text: 'Kamar', questionPrompt: 'Buku : Halaman = Rumah : ?' },
  { no: 4, type: 'text', answer: 'bunga', keywords: ['bunga', 'kembang', 'tanaman hias', 'flora'], questionPrompt: 'Carilah satu kata yang mencakup pengertian: mawar - melati' },
  { no: 5, type: 'number', answer: 12, questionPrompt: '2 4 6 8 10 ?' }
];

export interface SingleSubtestEvaluation {
  subtestId: string;
  subtestName: string;
  subtestCode: SubtestCode | 'TRIAL' | 'CUSTOM';
  rw: number;
  maxRw: number;
  sw: number;
  category: string;
  geTotalPoints?: number;
  totalAnswered: number;
  totalUnanswered: number;
  itemScores: Array<{
    no: number;
    questionTitle: string;
    userAnswer: any;
    isCorrect: boolean;
    score: number; // 0, 1, or 2
    keyDisplay: string;
    explanation?: string;
    matchType?: 'exact' | 'fuzzy' | 'blacklist' | 'none';
    editDistance?: number;
  }>;
}

/**
 * Evaluasi instan satu subtes untuk keperluan Simulasi Alur Peserta & CBT
 */
export function evaluateSingleSubtestResult(
  subtestId: string,
  subtestName: string,
  answers: Record<number, any>,
  age: number = 21
): SingleSubtestEvaluation {
  const rawId = (subtestId || '').toLowerCase();
  const rawName = (subtestName || '').toLowerCase();
  const combined = `${rawId} ${rawName}`;

  // 1. Cek Trial / Simulasi Pemanasan
  if (combined.includes('trial') || combined.includes('pemanasan') || combined.includes('simulasi')) {
    let rw = 0;
    const itemScores = SUBTEST_TRIAL_KEYS.map((k, idx) => {
      const u = answers[idx];
      let isCorrect = false;
      let explanation = '';
      let score = 0;

      if (k.type === 'mc') {
        const uStr = String(u || '').trim().toLowerCase();
        isCorrect = uStr === String(k.answer).toLowerCase() || uStr.startsWith(String(k.answer).toLowerCase());
        score = isCorrect ? 1 : 0;
        explanation = isCorrect ? `Jawaban Anda (${uStr.toUpperCase()}) sesuai dengan kunci jawaban (${String(k.answer).toUpperCase()}).` : `Kunci jawaban yang benar adalah ${String(k.answer).toUpperCase()} (${k.text}).`;
      } else if (k.type === 'text') {
        const uText = normalizeText(u);
        const matched = (k.keywords || []).some(kw => isFuzzyKeywordMatch(uText, kw));
        isCorrect = matched;
        score = isCorrect ? 1 : 0;
        explanation = isCorrect ? `Konsep kata "${uText}" dikenali sebagai kategori tanaman bunga yang tepat.` : `Kunci konsep yang diharapkan adalah kelompok bunga / tanaman hias.`;
      } else if (k.type === 'number') {
        isCorrect = matchNumeric(u, Number(k.answer));
        score = isCorrect ? 1 : 0;
        explanation = isCorrect ? `Jawaban angka ${u} benar.` : `Deret bertambah 2: 2, 4, 6, 8, 10, maka angka selanjutnya adalah 12.`;
      }

      if (isCorrect) rw++;

      return {
        no: k.no,
        questionTitle: k.questionPrompt,
        userAnswer: u ?? '-',
        isCorrect,
        score,
        keyDisplay: String(k.answer).toUpperCase(),
        explanation,
      };
    });

    const totalAnswered = Object.values(answers).filter(v => v !== undefined && v !== null && v !== '').length;

    return {
      subtestId,
      subtestName: 'Simulasi / Pemanasan (Trial IST)',
      subtestCode: 'TRIAL',
      rw,
      maxRw: 5,
      sw: Math.round((rw / 5) * 100 + 50),
      category: rw >= 4 ? 'Sangat Baik' : rw >= 3 ? 'Baik / Rata-rata' : 'Perlu Latihan',
      totalAnswered,
      totalUnanswered: 5 - totalAnswered,
      itemScores,
    };
  }

  // 2. Deteksi Kode Subtes IST Resmi
  let code: SubtestCode = 'SE';
  if (combined.includes('subtes 2') || combined.includes('ist_2') || combined.includes('wa')) code = 'WA';
  else if (combined.includes('subtes 3') || combined.includes('ist_3') || combined.includes('an')) code = 'AN';
  else if (combined.includes('subtes 4') || combined.includes('ist_4') || combined.includes('ge')) code = 'GE';
  else if (combined.includes('subtes 5') || combined.includes('ist_5') || combined.includes('ra')) code = 'RA';
  else if (combined.includes('subtes 6') || combined.includes('ist_6') || combined.includes('zr')) code = 'ZR';
  else if (combined.includes('subtes 7') || combined.includes('ist_7') || combined.includes('fa')) code = 'FA';
  else if (combined.includes('subtes 8') || combined.includes('ist_8') || combined.includes('wu')) code = 'WU';
  else if (combined.includes('subtes 9') || combined.includes('ist_9') || combined.includes('me')) code = 'ME';

  let rw = 0;
  let maxRw = 20;
  let geTotalPoints: number | undefined = undefined;
  let itemScores: SingleSubtestEvaluation['itemScores'] = [];

  if (code === 'SE') {
    itemScores = SUBTEST1_SE_KEYS.map((k, idx) => {
      const u = answers[idx] ?? answers[k.no];
      const isCorrect = matchMultipleChoice(u, k);
      if (isCorrect) rw++;
      return {
        no: k.no,
        questionTitle: `Soal ${k.no}`,
        userAnswer: u ?? '-',
        isCorrect,
        score: isCorrect ? 1 : 0,
        keyDisplay: `${k.letter.toUpperCase()} (${k.text})`,
        explanation: isCorrect ? `Jawaban benar.` : `Kunci resmi: ${k.letter.toUpperCase()} (${k.text})`,
      };
    });
  } else if (code === 'WA') {
    itemScores = SUBTEST2_WA_KEYS.map((k, idx) => {
      const u = answers[idx] ?? answers[k.no];
      const isCorrect = matchMultipleChoice(u, k);
      if (isCorrect) rw++;
      return {
        no: k.no,
        questionTitle: `Soal ${k.no}`,
        userAnswer: u ?? '-',
        isCorrect,
        score: isCorrect ? 1 : 0,
        keyDisplay: `${k.letter.toUpperCase()} (${k.text})`,
        explanation: isCorrect ? `Jawaban benar.` : `Kunci kata yang berbeda: ${k.letter.toUpperCase()} (${k.text})`,
      };
    });
  } else if (code === 'AN') {
    itemScores = SUBTEST3_AN_KEYS.map((k, idx) => {
      const u = answers[idx] ?? answers[k.no];
      const isCorrect = matchMultipleChoice(u, k);
      if (isCorrect) rw++;
      return {
        no: k.no,
        questionTitle: `Soal ${k.no}`,
        userAnswer: u ?? '-',
        isCorrect,
        score: isCorrect ? 1 : 0,
        keyDisplay: `${k.letter.toUpperCase()} (${k.text})`,
        explanation: isCorrect ? `Jawaban benar.` : `Kunci hubungan analogi: ${k.letter.toUpperCase()} (${k.text})`,
      };
    });
  } else if (code === 'GE') {
    maxRw = 20; // 16 butir soal -> poin 0-32 -> dikonversi via Tabel 3 ke RS 0-20
    let points = 0;
    itemScores = SUBTEST4_GE_KEYS.map((k, idx) => {
      const u = answers[idx] ?? answers[k.no];
      const detail = testGeWordDetailed(idx, String(u || ''));
      points += detail.score;
      return {
        no: k.no,
        questionTitle: `${k.words[0]} – ${k.words[1]}`,
        userAnswer: u ?? '-',
        isCorrect: detail.score > 0,
        score: detail.score,
        keyDisplay: `Skor 2: [${k.score2Keywords.slice(0, 3).join(', ')}] | Skor 1: [${k.score1Keywords.slice(0, 3).join(', ')}]`,
        explanation: detail.explanation,
        matchType: detail.matchType,
        editDistance: detail.editDistance,
      };
    });
    geTotalPoints = points;
    rw = convertGeTotalToRS(points);
  } else if (code === 'RA') {
    itemScores = SUBTEST5_RA_KEYS.map((k, idx) => {
      const u = answers[idx] ?? answers[k.no];
      const isCorrect = matchNumeric(u, k.answer);
      if (isCorrect) rw++;
      return {
        no: k.no,
        questionTitle: `Soal Hitungan ${k.no}`,
        userAnswer: u ?? '-',
        isCorrect,
        score: isCorrect ? 1 : 0,
        keyDisplay: String(k.answer),
        explanation: isCorrect ? `Perhitungan tepat (${k.answer}).` : `Hasil hitungan yang benar: ${k.answer}`,
      };
    });
  } else if (code === 'ZR') {
    itemScores = SUBTEST6_ZR_KEYS.map((k, idx) => {
      const u = answers[idx] ?? answers[k.no];
      const isCorrect = matchNumeric(u, k.answer);
      if (isCorrect) rw++;
      return {
        no: k.no,
        questionTitle: `Soal Deret ${k.no}`,
        userAnswer: u ?? '-',
        isCorrect,
        score: isCorrect ? 1 : 0,
        keyDisplay: String(k.answer),
        explanation: isCorrect ? `Pola deret angka tepat (${k.answer}).` : `Angka kelanjutan deret yang benar: ${k.answer}`,
      };
    });
  } else if (code === 'FA') {
    itemScores = SUBTEST7_FA_KEYS.map((k, idx) => {
      const u = answers[idx] ?? answers[k.no];
      const isCorrect = matchMultipleChoice(u, k);
      if (isCorrect) rw++;
      return {
        no: k.no,
        questionTitle: `Soal ${k.no} (${idx < 12 ? 'Acuan Bagian 1' : 'Acuan Bagian 2'})`,
        userAnswer: u ?? '-',
        isCorrect,
        score: isCorrect ? 1 : 0,
        keyDisplay: k.letter.toUpperCase(),
        explanation: isCorrect ? `Susunan bentuk gambar benar.` : `Bentuk utuh yang sesuai: ${k.letter.toUpperCase()}`,
      };
    });
  } else if (code === 'WU') {
    itemScores = SUBTEST8_WU_KEYS.map((k, idx) => {
      const u = answers[idx] ?? answers[k.no];
      const isCorrect = matchMultipleChoice(u, k);
      if (isCorrect) rw++;
      return {
        no: k.no,
        questionTitle: `Soal Kubus ${k.no}`,
        userAnswer: u ?? '-',
        isCorrect,
        score: isCorrect ? 1 : 0,
        keyDisplay: k.letter.toUpperCase(),
        explanation: isCorrect ? `Identifikasi kubus putar benar.` : `Kubus acuan yang identik: ${k.letter.toUpperCase()}`,
      };
    });
  } else if (code === 'ME') {
    itemScores = SUBTEST9_ME_KEYS.map((k, idx) => {
      const u = answers[idx] ?? answers[k.no];
      const isCorrect = matchMultipleChoice(u, k);
      if (isCorrect) rw++;
      return {
        no: k.no,
        questionTitle: `Soal Mengingat ${k.no}`,
        userAnswer: u ?? '-',
        isCorrect,
        score: isCorrect ? 1 : 0,
        keyDisplay: `${k.letter.toUpperCase()} (${k.text})`,
        explanation: isCorrect ? `Kategori hafalan tepat.` : `Kategori kata yang benar: ${k.letter.toUpperCase()} (${k.text})`,
      };
    });
  }

  // Perhitungan Standar Skor (SW) via Tabel Norma Usia IST
  let sw = 100;
  try {
    const res = convertRawToStandardScoreByAge(code, rw, age);
    sw = res.ss;
  } catch (e) {
    // Fallback formula jika impor terhambat
    sw = Math.round(70 + (rw / maxRw) * 60);
  }

  // Kategori Kognitif Standar IST / Wechsler
  let category = 'Sedang (Rata-rata)';
  if (sw >= 120) category = 'Sangat Tinggi (Superior)';
  else if (sw >= 110) category = 'Tinggi (Diatas Rata-rata)';
  else if (sw >= 90) category = 'Sedang (Rata-rata)';
  else if (sw >= 80) category = 'Rendah (Dibawah Rata-rata)';
  else category = 'Sangat Rendah (Inferior)';

  const totalAnswered = Object.values(answers).filter(v => v !== undefined && v !== null && v !== '').length;

  return {
    subtestId,
    subtestName,
    subtestCode: code,
    rw,
    maxRw,
    sw,
    category,
    geTotalPoints,
    totalAnswered,
    totalUnanswered: itemScores.length - totalAnswered,
    itemScores,
  };
}

/**
 * Generator Jawaban Contoh Cepat (Realistic Sample Answers) untuk mode simulasi
 */
export function getSampleAnswersForSubtest(subtestId: string, subtestName: string): Record<number, string> {
  const combined = `${subtestId} ${subtestName}`.toLowerCase();
  const sample: Record<number, string> = {};

  if (combined.includes('trial') || combined.includes('pemanasan') || combined.includes('simulasi')) {
    sample[0] = 'a'; // Sayap
    sample[1] = 'e'; // Lemari
    sample[2] = 'b'; // Kamar
    sample[3] = 'cuca'; // Typo dari cuaca / bunga -> uji coba evaluasi
    sample[4] = '12';
    return sample;
  }

  if (combined.includes('subtes 1') || combined.includes('se')) {
    SUBTEST1_SE_KEYS.forEach((k, idx) => {
      // 80% benar, 20% variasi
      sample[idx] = idx % 5 === 4 ? 'a' : k.letter;
    });
  } else if (combined.includes('subtes 2') || combined.includes('wa')) {
    SUBTEST2_WA_KEYS.forEach((k, idx) => {
      sample[idx] = idx % 5 === 3 ? 'b' : k.letter;
    });
  } else if (combined.includes('subtes 3') || combined.includes('an')) {
    SUBTEST3_AN_KEYS.forEach((k, idx) => {
      sample[idx] = idx % 5 === 2 ? 'c' : k.letter;
    });
  } else if (combined.includes('subtes 4') || combined.includes('ge')) {
    const sampleGeAnswers = [
      'bunga mawar melati', // Q61 -> bunga (Skor 2)
      'panca indera',        // Q62 -> indera (Skor 2)
      'batu permata',        // Q63 -> mineral/benda padat (Skor 2/1)
      'cuca',                // Q64 -> cuaca dengan typo 'cuca' (Skor 2 via Levenshtein!)
      'alat komunikasi',     // Q65 -> perhubungan (Skor 2)
      'alat optik',          // Q66 -> optik (Skor 2)
      'alat pencernaan',     // Q67 -> organ pencernaan (Skor 2)
      'jumlah',              // Q68 -> kuantitas / takaran (Skor 2)
      'bibit makhluk',       // Q69 -> awal kehidupan (Skor 2)
      'tanda jasa lambang',  // Q70 -> simbol / tanda pengenal (Skor 2)
      'makhluk hidup',       // Q71 -> organisme (Skor 2)
      'wadah tempat benda',  // Q72 -> tempat penyimpan (Skor 2)
      'titik batas waktu',   // Q73 -> waktu / batas (Skor 2)
      'sifat manusia',       // Q74 -> perilaku / tabiat (Skor 1)
      'hukum ekonomi pasar', // Q75 -> konsep ekonomi (Skor 2)
      'arah ruang posisi'    // Q76 -> petunjuk ruang (Skor 2)
    ];
    sampleGeAnswers.forEach((ans, idx) => {
      sample[idx] = ans;
    });
  } else if (combined.includes('subtes 5') || combined.includes('ra')) {
    SUBTEST5_RA_KEYS.forEach((k, idx) => {
      sample[idx] = idx % 5 === 4 ? '99' : String(k.answer);
    });
  } else if (combined.includes('subtes 6') || combined.includes('zr')) {
    SUBTEST6_ZR_KEYS.forEach((k, idx) => {
      sample[idx] = idx % 5 === 4 ? '88' : String(k.answer);
    });
  } else if (combined.includes('subtes 7') || combined.includes('fa')) {
    SUBTEST7_FA_KEYS.forEach((k, idx) => {
      sample[idx] = idx % 5 === 3 ? 'b' : k.letter;
    });
  } else if (combined.includes('subtes 8') || combined.includes('wu')) {
    SUBTEST8_WU_KEYS.forEach((k, idx) => {
      sample[idx] = idx % 5 === 2 ? 'c' : k.letter;
    });
  } else if (combined.includes('subtes 9') || combined.includes('me')) {
    SUBTEST9_ME_KEYS.forEach((k, idx) => {
      sample[idx] = idx % 5 === 1 ? 'd' : k.letter;
    });
  }

  return sample;
}

/**
 * Menghitung skor mentah (RS / RW) untuk seluruh lembar jawaban peserta
 * @param answers Map jawaban peserta dari Firestore (berisi per subtestId atau subtest code)
 */
export function calculateAllIstSubtests(answersMap: Record<string, any>, overrides?: Record<string, Record<number, number>>): {
  rawScores: RawScores;
  geTotalPoints: number;
  details: Record<
    SubtestCode,
    {
      rw: number;
      maxRw: number;
      totalPoints?: number;
      itemScores: Array<{ no: number; userAnswer: any; isCorrect: boolean; score: number; keyDisplay: string }>;
    }
  >;
} {
  // Helper pencari jawaban subtes dari berbagai variasi penamaan ID (ist_1, subtest_0_ist_1, se, SE, dll)
  const findSubtestAnswers = (code: SubtestCode, num: number): Record<string | number, any> => {
    if (!answersMap || typeof answersMap !== 'object') return {};

    const codeLower = code.toLowerCase();
    for (const [k, v] of Object.entries(answersMap)) {
      if (!v || typeof v !== 'object') continue;
      const kLower = k.toLowerCase();
      if (
        kLower === codeLower ||
        kLower === String(num) ||
        kLower.includes(`ist_${num}`) ||
        kLower.includes(`ist ${num}`) ||
        kLower.includes(`ist${num}`) ||
        kLower.includes(`subtes ${num}`) ||
        kLower.includes(`subtest ${num}`) ||
        kLower.includes(`subtest_${num}`) ||
        kLower.includes(`subtes_${num}`) ||
        kLower.includes(`subtes${num}`) ||
        kLower.includes(`subtest${num}`) ||
        kLower.includes(`-${codeLower})`) ||
        kLower.includes(`(${codeLower})`) ||
        (codeLower === 'wu' && (kLower.includes('kubus') || kLower.includes('wu'))) ||
        (codeLower === 'fa' && (kLower.includes('bentuk') || kLower.includes('potongan') || kLower.includes('fa'))) ||
        (codeLower === 'ge' && (kLower.includes('persamaan') || kLower.includes('ge'))) ||
        (codeLower === 'ra' && (kLower.includes('aritmatika') || kLower.includes('berhitung') || kLower.includes('ra'))) ||
        (codeLower === 'zr' && (kLower.includes('deret') || kLower.includes('zr'))) ||
        (codeLower === 'me' && (kLower.includes('ingatan') || kLower.includes('mengingat') || kLower.includes('me'))) ||
        (codeLower === 'se' && (kLower.includes('kalimat') || kLower.includes('se'))) ||
        (codeLower === 'wa' && (kLower.includes('berbeda') || kLower.includes('wa'))) ||
        (codeLower === 'an' && (kLower.includes('analogi') || kLower.includes('an')))
      ) {
        return v as Record<string | number, any>;
      }
    }
    return {};
  };

  // 1. SE (Melengkapi Kalimat)
  const seAns = findSubtestAnswers('SE', 1);
  let seRw = 0;
  const seDetails = SUBTEST1_SE_KEYS.map((k, idx) => {
    const u = seAns[idx] ?? seAns[String(idx)] ?? seAns[k.no];
    const isCorrect = matchMultipleChoice(u, k);
    let finalScore = isCorrect ? 1 : 0;
    if (overrides && overrides['SE'] && overrides['SE'][k.no] !== undefined) {
      finalScore = overrides['SE'][k.no];
    }
    seRw += finalScore;
    return {
      no: k.no,
      userAnswer: u ?? '-',
      isCorrect: finalScore > 0,
      score: finalScore,
      keyDisplay: `${k.letter.toUpperCase()} (${k.text})`,
    };
  });

  // 2. WA (Persamaan Kata)
  const waAns = findSubtestAnswers('WA', 2);
  let waRw = 0;
  const waDetails = SUBTEST2_WA_KEYS.map((k, idx) => {
    const u = waAns[idx] ?? waAns[String(idx)] ?? waAns[k.no];
    const isCorrect = matchMultipleChoice(u, k);
    let finalScore = isCorrect ? 1 : 0;
    if (overrides && overrides['WA'] && overrides['WA'][k.no] !== undefined) {
      finalScore = overrides['WA'][k.no];
    }
    waRw += finalScore;
    return {
      no: k.no,
      userAnswer: u ?? '-',
      isCorrect: finalScore > 0,
      score: finalScore,
      keyDisplay: `${k.letter.toUpperCase()} (${k.text})`,
    };
  });

  // 3. AN (Analogi Verbal)
  const anAns = findSubtestAnswers('AN', 3);
  let anRw = 0;
  const anDetails = SUBTEST3_AN_KEYS.map((k, idx) => {
    const u = anAns[idx] ?? anAns[String(idx)] ?? anAns[k.no];
    const isCorrect = matchMultipleChoice(u, k);
    let finalScore = isCorrect ? 1 : 0;
    if (overrides && overrides['AN'] && overrides['AN'][k.no] !== undefined) {
      finalScore = overrides['AN'][k.no];
    }
    anRw += finalScore;
    return {
      no: k.no,
      userAnswer: u ?? '-',
      isCorrect: finalScore > 0,
      score: finalScore,
      keyDisplay: `${k.letter.toUpperCase()} (${k.text})`,
    };
  });

  // 4. GE (Sifat yang Sama) -> Hitung poin 0-32 lalu konversi ke RS 0-20 via Tabel 3
  const geAns = findSubtestAnswers('GE', 4);
  let geTotalPoints = 0;
  const geDetails = SUBTEST4_GE_KEYS.map((k, idx) => {
    const u = geAns[idx] ?? geAns[String(idx)] ?? geAns[k.no];
    let score = scoreGeItem(idx, u);
    if (overrides && overrides['GE'] && overrides['GE'][k.no] !== undefined) {
      score = overrides['GE'][k.no];
    }
    geTotalPoints += score;
    return {
      no: k.no,
      userAnswer: u ?? '-',
      isCorrect: score > 0,
      score,
      keyDisplay: `Skor 2: [${k.score2Keywords.slice(0, 2).join(', ')}], Skor 1: [${k.score1Keywords.slice(0, 2).join(', ')}]`,
    };
  });
  const geRw = convertGeTotalToRS(geTotalPoints);

  // 5. RA (Hitungan)
  const raAns = findSubtestAnswers('RA', 5);
  let raRw = 0;
  const raDetails = SUBTEST5_RA_KEYS.map((k, idx) => {
    const u = raAns[idx] ?? raAns[String(idx)] ?? raAns[k.no];
    const isCorrect = matchNumeric(u, k.answer);
    let finalScore = isCorrect ? 1 : 0;
    if (overrides && overrides['RA'] && overrides['RA'][k.no] !== undefined) {
      finalScore = overrides['RA'][k.no];
    }
    raRw += finalScore;
    return {
      no: k.no,
      userAnswer: u ?? '-',
      isCorrect: finalScore > 0,
      score: finalScore,
      keyDisplay: String(k.answer),
    };
  });

  // 6. ZR (Deret Angka)
  const zrAns = findSubtestAnswers('ZR', 6);
  let zrRw = 0;
  const zrDetails = SUBTEST6_ZR_KEYS.map((k, idx) => {
    const u = zrAns[idx] ?? zrAns[String(idx)] ?? zrAns[k.no];
    const isCorrect = matchNumeric(u, k.answer);
    let finalScore = isCorrect ? 1 : 0;
    if (overrides && overrides['ZR'] && overrides['ZR'][k.no] !== undefined) {
      finalScore = overrides['ZR'][k.no];
    }
    zrRw += finalScore;
    return {
      no: k.no,
      userAnswer: u ?? '-',
      isCorrect: finalScore > 0,
      score: finalScore,
      keyDisplay: String(k.answer),
    };
  });

  // 7. FA (Potongan Gambar)
  const faAns = findSubtestAnswers('FA', 7);
  let faRw = 0;
  const faDetails = SUBTEST7_FA_KEYS.map((k, idx) => {
    const u = faAns[idx] ?? faAns[String(idx)] ?? faAns[k.no];
    const isCorrect = matchMultipleChoice(u, k);
    let finalScore = isCorrect ? 1 : 0;
    if (overrides && overrides['FA'] && overrides['FA'][k.no] !== undefined) {
      finalScore = overrides['FA'][k.no];
    }
    faRw += finalScore;
    return {
      no: k.no,
      userAnswer: u ?? '-',
      isCorrect: finalScore > 0,
      score: finalScore,
      keyDisplay: k.letter.toUpperCase(),
    };
  });

  // 8. WU (Kubus)
  const wuAns = findSubtestAnswers('WU', 8);
  let wuRw = 0;
  const wuDetails = SUBTEST8_WU_KEYS.map((k, idx) => {
    const u = wuAns[idx] ?? wuAns[String(idx)] ?? wuAns[k.no];
    const isCorrect = matchMultipleChoice(u, k);
    let finalScore = isCorrect ? 1 : 0;
    if (overrides && overrides['WU'] && overrides['WU'][k.no] !== undefined) {
      finalScore = overrides['WU'][k.no];
    }
    wuRw += finalScore;
    return {
      no: k.no,
      userAnswer: u ?? '-',
      isCorrect: finalScore > 0,
      score: finalScore,
      keyDisplay: k.letter.toUpperCase(),
    };
  });

  // 9. ME (Ingatan)
  const meAns = findSubtestAnswers('ME', 9);
  let meRw = 0;
  const meDetails = SUBTEST9_ME_KEYS.map((k, idx) => {
    const u = meAns[idx] ?? meAns[String(idx)] ?? meAns[k.no];
    const isCorrect = matchMultipleChoice(u, k);
    let finalScore = isCorrect ? 1 : 0;
    if (overrides && overrides['ME'] && overrides['ME'][k.no] !== undefined) {
      finalScore = overrides['ME'][k.no];
    }
    meRw += finalScore;
    return {
      no: k.no,
      userAnswer: u ?? '-',
      isCorrect: finalScore > 0,
      score: finalScore,
      keyDisplay: `${k.letter.toUpperCase()} (${k.text})`,
    };
  });

  const rawScores: RawScores = {
    SE: seRw,
    WA: waRw,
    AN: anRw,
    GE: geRw, // Sudah melalui Tabel 3
    RA: raRw,
    ZR: zrRw,
    FA: faRw,
    WU: wuRw,
    ME: meRw,
  };

  return {
    rawScores,
    geTotalPoints,
    details: {
      SE: { rw: seRw, maxRw: 20, itemScores: seDetails },
      WA: { rw: waRw, maxRw: 20, itemScores: waDetails },
      AN: { rw: anRw, maxRw: 20, itemScores: anDetails },
      GE: { rw: geRw, maxRw: 20, totalPoints: geTotalPoints, itemScores: geDetails },
      RA: { rw: raRw, maxRw: 20, itemScores: raDetails },
      ZR: { rw: zrRw, maxRw: 20, itemScores: zrDetails },
      FA: { rw: faRw, maxRw: 20, itemScores: faDetails },
      WU: { rw: wuRw, maxRw: 20, itemScores: wuDetails },
      ME: { rw: meRw, maxRw: 20, itemScores: meDetails },
    },
  };
}
