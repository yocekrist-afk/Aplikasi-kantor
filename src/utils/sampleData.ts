import * as XLSX from 'xlsx';
import { Participant, RawScores } from '../types/ist';
import { processParticipantScores } from './istScoring';

export const INITIAL_SAMPLE_PARTICIPANTS: Participant[] = [
  processParticipantScores(
    { SE: 12, WA: 11, AN: 14, GE: 16, RA: 17, ZR: 18, FA: 16, WU: 17, ME: 13 },
    {
      id: 'IST-001',
      nomorTes: 'IST/2026/001',
      nama: 'Muhammad Arya Pratama',
      jenisKelamin: 'L',
      tanggalLahir: '2008-04-15',
      tanggalTes: '2026-08-20',
      usia: '18 Tahun 4 Bulan',
      pendidikan: 'SMA Kelas XII - IPA 1',
      asalSekolahInstitusi: 'SMAN 1 Teladan Jakarta',
    }
  ),
  processParticipantScores(
    { SE: 17, WA: 18, AN: 16, GE: 24, RA: 11, ZR: 10, FA: 11, WU: 9, ME: 18 },
    {
      id: 'IST-002',
      nomorTes: 'IST/2026/002',
      nama: 'Anindya Kirana Putri',
      jenisKelamin: 'P',
      tanggalLahir: '2008-09-10',
      tanggalTes: '2026-08-20',
      usia: '17 Tahun 11 Bulan',
      pendidikan: 'SMA Kelas XII - IPS 1',
      asalSekolahInstitusi: 'SMAN 3 Bandung',
    }
  ),
  processParticipantScores(
    { SE: 15, WA: 14, AN: 15, GE: 20, RA: 15, ZR: 14, FA: 14, WU: 15, ME: 14 },
    {
      id: 'IST-003',
      nomorTes: 'IST/2026/003',
      nama: 'Farhan Rizki Ramadhan',
      jenisKelamin: 'L',
      tanggalLahir: '2008-02-28',
      tanggalTes: '2026-08-20',
      usia: '18 Tahun 5 Bulan',
      pendidikan: 'SMA Kelas XII - Umum',
      asalSekolahInstitusi: 'SMA Labschool Rawamangun',
    }
  ),
  processParticipantScores(
    { SE: 18, WA: 17, AN: 18, GE: 27, RA: 18, ZR: 19, FA: 18, WU: 18, ME: 17 },
    {
      id: 'IST-004',
      nomorTes: 'IST/2026/004',
      nama: 'Jessica Clarissa Tan',
      jenisKelamin: 'P',
      tanggalLahir: '2008-11-05',
      tanggalTes: '2026-08-21',
      usia: '17 Tahun 9 Bulan',
      pendidikan: 'SMA Kelas XII - Unggulan',
      asalSekolahInstitusi: 'SMA Santa Ursula Jakarta',
    }
  ),
  processParticipantScores(
    { SE: 10, WA: 9, AN: 11, GE: 14, RA: 9, ZR: 8, FA: 10, WU: 9, ME: 11 },
    {
      id: 'IST-005',
      nomorTes: 'IST/2026/005',
      nama: 'Bagus Dwi Wicaksono',
      jenisKelamin: 'L',
      tanggalLahir: '2008-07-22',
      tanggalTes: '2026-08-21',
      usia: '18 Tahun 1 Bulan',
      pendidikan: 'SMK Kelas XII - Multimedia',
      asalSekolahInstitusi: 'SMKN 2 Yogyakarta',
    }
  ),
];

/**
 * Generate dan trigger unduh file Template Excel / CSV
 */
export function downloadExcelTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const templateData = [
    {
      Nomor_Tes: 'IST/2026/001',
      Nama: 'Contoh Peserta 1 (Eksakta)',
      Jenis_Kelamin: 'L',
      Tanggal_Lahir: '2008-05-14',
      Tanggal_Tes: '2026-08-25',
      Usia: '18 Tahun',
      Pendidikan: 'SMA Kelas XII',
      Asal_Sekolah: 'SMAN 1 Jakarta',
      SE: 12,
      WA: 11,
      AN: 14,
      GE: 16,
      RA: 17,
      ZR: 18,
      FA: 16,
      WU: 17,
      ME: 13,
    },
    {
      Nomor_Tes: 'IST/2026/002',
      Nama: 'Contoh Peserta 2 (Sosio-Verbal)',
      Jenis_Kelamin: 'P',
      Tanggal_Lahir: '2008-10-20',
      Tanggal_Tes: '2026-08-25',
      Usia: '17 Tahun 10 Bulan',
      Pendidikan: 'SMA Kelas XII',
      Asal_Sekolah: 'SMAN 3 Bandung',
      SE: 17,
      WA: 18,
      AN: 16,
      GE: 24,
      RA: 10,
      ZR: 11,
      FA: 11,
      WU: 9,
      ME: 18,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Peserta_IST');

  // Atur lebar kolom
  worksheet['!cols'] = [
    { wch: 15 }, // Nomor_Tes
    { wch: 25 }, // Nama
    { wch: 14 }, // Jenis_Kelamin
    { wch: 14 }, // Tanggal_Lahir
    { wch: 14 }, // Tanggal_Tes
    { wch: 15 }, // Usia
    { wch: 18 }, // Pendidikan
    { wch: 20 }, // Asal_Sekolah
    { wch: 6 },  // SE
    { wch: 6 },  // WA
    { wch: 6 },  // AN
    { wch: 6 },  // GE
    { wch: 6 },  // RA
    { wch: 6 },  // ZR
    { wch: 6 },  // FA
    { wch: 6 },  // WU
    { wch: 6 },  // ME
  ];

  if (format === 'csv') {
    XLSX.writeFile(workbook, 'Template_Input_IST.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, 'Template_Input_IST.xlsx', { bookType: 'xlsx' });
  }
}

/**
 * Parser file Excel / CSV yang diupload pengguna
 */
export async function parseUploadedFile(file: File): Promise<Participant[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

        if (!rawJson || rawJson.length === 0) {
          throw new Error('File kosong atau tidak memiliki data baris peserta.');
        }

        // --- SKEMA VALIDASI ---
        const firstRowKeys = Object.keys(rawJson[0] || {}).map(k => k.trim().toLowerCase());
        
        // Definisikan kolom yang wajib ada beserta variasi penamaannya
        const requiredColumns = [
          { name: 'Nama', aliases: ['nama', 'nama_peserta', 'name'] },
          { name: 'Jenis Kelamin', aliases: ['jenis_kelamin', 'jk', 'gender', 'sex'] },
          { name: 'Tanggal Lahir', aliases: ['tanggal_lahir', 'tgl_lahir', 'dob'] },
          { name: 'Subtes SE', aliases: ['se', 'subtes_se', 'rw_se'] },
          { name: 'Subtes WA', aliases: ['wa', 'subtes_wa', 'rw_wa'] },
          { name: 'Subtes AN', aliases: ['an', 'subtes_an', 'rw_an'] },
          { name: 'Subtes GE', aliases: ['ge', 'subtes_ge', 'rw_ge'] },
          { name: 'Subtes RA', aliases: ['ra', 'subtes_ra', 'rw_ra'] },
          { name: 'Subtes ZR', aliases: ['zr', 'subtes_zr', 'rw_zr'] },
          { name: 'Subtes FA', aliases: ['fa', 'subtes_fa', 'rw_fa'] },
          { name: 'Subtes WU', aliases: ['wu', 'subtes_wu', 'rw_wu'] },
          { name: 'Subtes ME', aliases: ['me', 'subtes_me', 'rw_me'] },
        ];

        const missingColumns: string[] = [];
        for (const req of requiredColumns) {
          const hasCol = req.aliases.some(alias => firstRowKeys.includes(alias));
          if (!hasCol) {
            missingColumns.push(req.name);
          }
        }

        if (missingColumns.length > 0) {
          throw new Error(`Format Excel/CSV tidak valid. File Anda kehilangan kolom wajib berikut:\n- ${missingColumns.join(', ')}\n\nPastikan Anda menggunakan Template yang disediakan.`);
        }
        // ----------------------

        const participants: Participant[] = rawJson.map((row, index) => {
          // Helper pencarian key case-insensitive
          const getVal = (possibleKeys: string[], defaultVal = '') => {
            for (const key of possibleKeys) {
              for (const rowKey of Object.keys(row)) {
                if (rowKey.trim().toLowerCase() === key.toLowerCase()) {
                  return row[rowKey];
                }
              }
            }
            return defaultVal;
          };

          const getNum = (possibleKeys: string[], defaultNum = 0) => {
            const val = getVal(possibleKeys, String(defaultNum));
            const parsed = Number(val);
            return isNaN(parsed) ? defaultNum : parsed;
          };

          const rawScores: RawScores = {
            SE: getNum(['SE', 'Subtes_SE', 'RW_SE']),
            WA: getNum(['WA', 'Subtes_WA', 'RW_WA']),
            AN: getNum(['AN', 'Subtes_AN', 'RW_AN']),
            GE: getNum(['GE', 'Subtes_GE', 'RW_GE']),
            RA: getNum(['RA', 'Subtes_RA', 'RW_RA']),
            ZR: getNum(['ZR', 'Subtes_ZR', 'RW_ZR']),
            FA: getNum(['FA', 'Subtes_FA', 'RW_FA']),
            WU: getNum(['WU', 'Subtes_WU', 'RW_WU']),
            ME: getNum(['ME', 'Subtes_ME', 'RW_ME']),
          };

          const nama = String(getVal(['Nama', 'Nama_Peserta', 'Name'], `Peserta ${index + 1}`));
          const rawGender = String(getVal(['Jenis_Kelamin', 'JK', 'Gender', 'Sex'], 'L')).trim().toUpperCase();
          const jenisKelamin = rawGender.startsWith('P') || rawGender === 'WANITA' || rawGender === 'FEMALE' ? 'P' : 'L';
          const nomorTes = String(getVal(['Nomor_Tes', 'No_Tes', 'ID'], `IST-2026-${String(index + 1).padStart(3, '0')}`));
          const tanggalLahir = String(getVal(['Tanggal_Lahir', 'Tgl_Lahir', 'DOB'], '2008-01-01'));
          const tanggalTes = String(getVal(['Tanggal_Tes', 'Tgl_Tes', 'Test_Date'], new Date().toISOString().split('T')[0]));
          const usia = String(getVal(['Usia', 'Umur', 'Age'], '17 Tahun'));
          const pendidikan = String(getVal(['Pendidikan', 'Kelas', 'Tingkat'], 'SMA Kelas XII'));
          const asalSekolahInstitusi = String(getVal(['Asal_Sekolah', 'Sekolah', 'Institusi', 'Instansi'], '-'));

          return processParticipantScores(rawScores, {
            id: `p-${Date.now()}-${index}`,
            nomorTes,
            nama,
            jenisKelamin,
            tanggalLahir,
            tanggalTes,
            usia,
            pendidikan,
            asalSekolahInstitusi,
          });
        });

        resolve(participants);
      } catch (err: any) {
        reject(new Error(err.message || 'Gagal membaca format file. Pastikan format kolom sesuai template.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Terjadi kesalahan saat membaca file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
