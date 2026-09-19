import React, { useState } from 'react';
import { 
  Award, 
  Brain, 
  Calculator, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Save, 
  HelpCircle, 
  Table, 
  ChevronRight, 
  FileText, 
  Sparkles,
  RefreshCw,
  ExternalLink,
  Box
} from 'lucide-react';
import { 
  GE_TABLE_3_ENTRIES, 
  SUBTEST4_GE_KEYS,
  SUBTEST1_SE_KEYS,
  SUBTEST2_WA_KEYS,
  SUBTEST3_AN_KEYS,
  SUBTEST5_RA_KEYS,
  SUBTEST6_ZR_KEYS,
  SUBTEST7_FA_KEYS,
  SUBTEST8_WU_KEYS,
  SUBTEST9_ME_KEYS,
  convertGeTotalToRS,
  scoreGeItem
} from '../utils/istAnswerKeys';
import { Participant, SubtestCode } from '../types/ist';

interface ParticipantScoringTabProps {
  pData: any;
  scoringData: {
    graded: any;
    processed: Participant;
    gePoints: number | null;
  };
  onSaveScores: () => Promise<void>;
  isSaving: boolean;
}

export function ParticipantScoringTab({
  pData,
  scoringData,
  onSaveScores,
  isSaving
}: ParticipantScoringTabProps) {
  const [selectedSubtest, setSelectedSubtest] = useState<SubtestCode>('GE');
  const [showTabel3Modal, setShowTabel3Modal] = useState(false);

  const { processed, graded, gePoints } = scoringData;
  const rawScores = processed.rawScores;
  const subtestDetails = processed.subtestDetails;

  // Question keys mapping
  const subtestKeyMap: Record<SubtestCode, any[]> = {
    SE: SUBTEST1_SE_KEYS,
    WA: SUBTEST2_WA_KEYS,
    AN: SUBTEST3_AN_KEYS,
    GE: SUBTEST4_GE_KEYS,
    RA: SUBTEST5_RA_KEYS,
    ZR: SUBTEST6_ZR_KEYS,
    FA: SUBTEST7_FA_KEYS,
    WU: SUBTEST8_WU_KEYS,
    ME: SUBTEST9_ME_KEYS,
  };

  const getSubtestAnswers = (code: SubtestCode): Record<string, any> => {
    if (!pData?.answers) return {};
    
    // Find answers matching subtest code
    for (const [key, val] of Object.entries(pData.answers)) {
      const lower = key.toLowerCase();
      if (
        (code === 'SE' && (lower.includes('1') || lower.includes('se'))) ||
        (code === 'WA' && (lower.includes('2') || lower.includes('wa'))) ||
        (code === 'AN' && (lower.includes('3') || lower.includes('an'))) ||
        (code === 'GE' && (lower.includes('4') || lower.includes('ge'))) ||
        (code === 'RA' && (lower.includes('5') || lower.includes('ra'))) ||
        (code === 'ZR' && (lower.includes('6') || lower.includes('zr'))) ||
        (code === 'FA' && (lower.includes('7') || lower.includes('fa'))) ||
        (code === 'WU' && (lower.includes('8') || lower.includes('wu'))) ||
        (code === 'ME' && (lower.includes('9') || lower.includes('me')))
      ) {
        return (val as Record<string, any>) || {};
      }
    }
    return {};
  };

  const activeAnswers = getSubtestAnswers(selectedSubtest);
  const activeKeys = subtestKeyMap[selectedSubtest] || [];
  const activeDetail = subtestDetails.find((s) => s.code === selectedSubtest);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-blue-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              Sistem Penilaian Otomatis Norma IST-70 Resmi
            </span>
          </div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Kalkulasi Skor & Kunci Jawaban Resmi IST</span>
          </h3>
          <p className="text-xs text-blue-200/80 mt-1 max-w-2xl leading-relaxed">
            Skor dihitung otomatis dari lembar jawaban peserta menggunakan kunci jawaban baku 9 subtes IST.
            Khusus Subtes 4 (GE), skor butir 0–32 dikonversi ke RS (0–20) sesuai <strong>Tabel 3 Norma IST Halaman 22</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={onSaveScores}
          disabled={isSaving}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan / Sinkronkan Skor</span>
            </>
          )}
        </button>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total IQ */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 pointer-events-none" />
          <div className="relative z-10">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-blue-600" />
              <span>Estimasi IQ Total</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-gray-900 font-mono tracking-tight">
              {processed.totalIQ}
            </div>
            <div className="mt-2 inline-block px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-md text-xs font-bold">
              {processed.iqCategory}
            </div>
          </div>
        </div>

        {/* Card 2: Total Skor Mentah (RS) */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Total Skor Mentah (RS)</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono tracking-tight">
              {processed.totalRaw}
              <span className="text-sm font-normal text-gray-400 ml-1.5">/ 180</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Jumlah 9 subtes (GE terkonversi Tabel 3)
            </div>
          </div>
        </div>

        {/* Card 3: Total Skor Standar (SW/SS) */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Total Skor Standar (SW)</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-indigo-700 font-mono tracking-tight">
              {processed.totalSS}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Rerata SW: {(processed.totalSS / 9).toFixed(1)}
            </div>
          </div>
        </div>

        {/* Card 4: Orientasi Peminatan */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Orientasi Peminatan</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 truncate">
              {processed.streamAnalysis.preference}
            </div>
            <div className="mt-2 text-xs text-gray-500 truncate">
              IPA ({processed.streamAnalysis.ipaScore}) vs IPS ({processed.streamAnalysis.ipsScore})
            </div>
          </div>
        </div>
      </div>

      {/* SPECIAL CALLOUT: SUBTEST 4 (GE) CONVERSION SPOTLIGHT */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-emerald-200/60">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-base text-emerald-950">
                  Subtes 4 (GE: Gemeinsamkeiten) — Aturan Konversi Tabel 3
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                  Wajib Konversi
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1 max-w-2xl leading-relaxed">
                Subtes 4 terdiri atas 16 butir soal dengan skor 0, 1, atau 2 (total maksimal 32 poin).
                Sesuai <strong>Manual IST Halaman 22</strong>, total poin butir ini harus dikonversi terlebih dahulu ke Skor Mentah Standar RS (rentang 0–20) sebelum dikonversi ke SW / IQ.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTabel3Modal(true)}
            className="px-3.5 py-1.5 bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <Table className="w-3.5 h-3.5 text-emerald-700" />
            <span>Lihat Tabel 3 Lengkap</span>
          </button>
        </div>

        {/* Current Participant GE Conversion Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-white/80 border border-emerald-200 rounded-xl p-3 text-center">
            <span className="text-[11px] text-gray-500 block font-medium">1. Skor Butir Mentah (16 Butir)</span>
            <div className="text-2xl font-black text-gray-900 font-mono mt-0.5">
              {gePoints !== null ? gePoints : (rawScores.GE > 20 ? rawScores.GE : '-')}
              <span className="text-xs text-gray-400 font-normal ml-1">/ 32 Poin</span>
            </div>
            <span className="text-[10px] text-gray-500 block mt-0.5">Dinilai 0, 1, atau 2 per butir</span>
          </div>

          <div className="bg-emerald-600 text-white rounded-xl p-3 text-center shadow-xs">
            <span className="text-[11px] text-emerald-100 block font-medium">2. Konversi ke Skor Mentah (RS)</span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {rawScores.GE}
              <span className="text-xs text-emerald-200 font-normal ml-1">/ 20</span>
            </div>
            <span className="text-[10px] text-emerald-100 block mt-0.5">Hasil lookup Tabel 3 resmi</span>
          </div>

          <div className="bg-white/80 border border-emerald-200 rounded-xl p-3 text-center">
            <span className="text-[11px] text-gray-500 block font-medium">3. Skor Standar & IQ GE</span>
            <div className="text-2xl font-black text-indigo-700 font-mono mt-0.5">
              SW {subtestDetails.find(s => s.code === 'GE')?.ss ?? '-'}
              <span className="text-xs text-gray-500 font-normal ml-1">
                (IQ {subtestDetails.find(s => s.code === 'GE')?.iq ?? '-'})
              </span>
            </div>
            <span className="text-[10px] text-gray-500 block mt-0.5">
              Kategori: {subtestDetails.find(s => s.code === 'GE')?.category ?? '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 9 SUBTESTS SCORE TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-gray-900 text-base">Rekap Hasil 9 Subtes IST</h4>
            <p className="text-xs text-gray-500">Skor Mentah (RS), Skor Standar (SW), Nilai IQ, dan Klasifikasi</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-gray-200 text-gray-700 rounded-md font-mono font-medium">
            9 Subtes Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100/75 text-gray-700 text-xs uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Subtes</th>
                <th className="py-3 px-4">Aspek yang Diukur</th>
                <th className="py-3 px-4 text-center">Skor Mentah (RS)</th>
                <th className="py-3 px-4 text-center">Skor Standar (SW)</th>
                <th className="py-3 px-4 text-center">IQ Subtes</th>
                <th className="py-3 px-4 text-center">Persentil</th>
                <th className="py-3 px-4 text-center">Klasifikasi</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subtestDetails.map((sub) => {
                const isSelected = selectedSubtest === sub.code;
                const isGE = sub.code === 'GE';

                return (
                  <tr 
                    key={sub.code} 
                    className={`hover:bg-blue-50/40 transition-colors ${isSelected ? 'bg-blue-50/70 font-semibold' : ''}`}
                  >
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-mono font-bold text-gray-700">
                          {sub.code}
                        </span>
                        <div>
                          <div>{sub.name}</div>
                          {isGE && (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              Tabel 3 Aktif
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {sub.measuredAspect}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-gray-900">
                      {isGE ? (
                        <div>
                          <span className="text-emerald-700 text-base">{sub.rw}</span>
                          <span className="text-gray-400 text-xs"> / 20</span>
                          {gePoints !== null && (
                            <div className="text-[10px] font-normal text-gray-500">
                              (dari {gePoints} poin)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span>{sub.rw}</span>
                          <span className="text-gray-400 text-xs"> / 20</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-indigo-700">
                      {sub.ss}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-900">
                      {sub.iq}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-gray-600 text-xs">
                      {sub.percentile}%
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        sub.category.includes('Tinggi') 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : sub.category.includes('Rata-rata') 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sub.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSubtest(sub.code)}
                        className={`px-3 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-600 text-white shadow-xs' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isSelected ? 'Melihat Detail' : 'Periksa Lembar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL LEMBAR JAWABAN PESERTA VS KUNCI JAWABAN */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Detail Lembar Jawaban & Kunci Jawaban: Subtes {selectedSubtest}</span>
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Pemeriksaan butir per butir jawaban peserta dibandingkan kunci jawaban resmi
            </p>
          </div>

          {/* Subtest Switcher Tabs */}
          <div className="flex flex-wrap gap-1">
            {(['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'] as SubtestCode[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedSubtest(code)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedSubtest === code
                    ? 'bg-[#8BC34A] text-white shadow-xs'
                    : 'bg-gray-200/80 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* GE Special Sheet */}
        {selectedSubtest === 'GE' ? (
          <div className="p-5">
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Panduan Penilaian Subtes 4 (GE):</strong> Setiap butir dinilai 2 (abstraksi tinggi / kategori tepat), 1 (konkret / fungsional), atau 0 (salah / kata terlarang).
                Total poin dihitung dari ke-16 butir lalu dikonversi dengan <strong>Tabel 3</strong> menjadi RS <strong>{rawScores.GE}</strong>.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">No.</th>
                    <th className="py-2.5 px-3">Pasangan Kata</th>
                    <th className="py-2.5 px-3">Jawaban Peserta</th>
                    <th className="py-2.5 px-3">Kriteria Skor 2 (Penuh)</th>
                    <th className="py-2.5 px-3">Kriteria Skor 1 (Sebagian)</th>
                    <th className="py-2.5 px-3 text-center w-20">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {SUBTEST4_GE_KEYS.map((item, idx) => {
                    const userAns = activeAnswers[idx] ?? activeAnswers[String(idx)] ?? activeAnswers[String(item.no)] ?? '';
                    const awardedScore = scoreGeItem(idx, userAns);

                    return (
                      <tr key={item.no} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-600">
                          {item.no}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          {item.words[0]} - {item.words[1]}
                        </td>
                        <td className="py-2.5 px-3">
                          {userAns ? (
                            <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                              {userAns}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Tidak dijawab</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-800">
                          {item.score2Keywords.slice(0, 3).join(', ')}
                        </td>
                        <td className="py-2.5 px-3 text-amber-800">
                          {item.score1Keywords.slice(0, 3).join(', ')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold font-mono text-xs ${
                            awardedScore === 2
                              ? 'bg-emerald-100 text-emerald-800'
                              : awardedScore === 1
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {awardedScore} Poin
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* General Multiple Choice / Math Subtests Sheet */
          <div className="p-5">
            {/* Visual reference for Subtest 8 (WU: Kubus) */}
            {selectedSubtest === 'WU' && (
              <div className="mb-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-blue-700" />
                    <div>
                      <h5 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                        5 Kubus Acuan Utama Subtes 8 (A, B, C, D, E) & Kunci Resmi IST
                      </h5>
                      <p className="text-[11px] text-blue-700">
                        Setiap butir soal (No. 137–156) adalah salah satu dari kelima kubus ini yang diputar/digulingkan.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-blue-200 self-start sm:self-auto shadow-2xs">
                    Kunci No. 138: D
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-blue-100 flex justify-center items-center shadow-2xs mb-3">
                  <img 
                    src="/assets/ist/subtes8_reference_cubes.webp" 
                    alt="5 Kubus Acuan Subtes 8 IST (A, B, C, D, E)" 
                    className="max-h-24 object-contain"
                  />
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100 text-[11px] text-blue-900 font-mono leading-relaxed">
                  <span className="font-bold text-blue-950 block mb-1">Daftar Kunci Jawaban Resmi Subtes 8 (20 Butir No. 137–156):</span>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-1 text-center font-bold">
                    <span className="bg-blue-100/60 p-1 rounded">137: E</span>
                    <span className="bg-emerald-100 text-emerald-800 p-1 rounded border border-emerald-300">138: D</span>
                    <span className="bg-blue-100/60 p-1 rounded">139: B</span>
                    <span className="bg-blue-100/60 p-1 rounded">140: C</span>
                    <span className="bg-blue-100/60 p-1 rounded">141: E</span>
                    <span className="bg-blue-100/60 p-1 rounded">142: D</span>
                    <span className="bg-blue-100/60 p-1 rounded">143: B</span>
                    <span className="bg-blue-100/60 p-1 rounded">144: D</span>
                    <span className="bg-blue-100/60 p-1 rounded">145: C</span>
                    <span className="bg-blue-100/60 p-1 rounded">146: E</span>
                    <span className="bg-blue-100/60 p-1 rounded">147: A</span>
                    <span className="bg-blue-100/60 p-1 rounded">148: B</span>
                    <span className="bg-blue-100/60 p-1 rounded">149: C</span>
                    <span className="bg-blue-100/60 p-1 rounded">150: A</span>
                    <span className="bg-blue-100/60 p-1 rounded">151: B</span>
                    <span className="bg-blue-100/60 p-1 rounded">152: A</span>
                    <span className="bg-blue-100/60 p-1 rounded">153: E</span>
                    <span className="bg-blue-100/60 p-1 rounded">154: C</span>
                    <span className="bg-blue-100/60 p-1 rounded">155: A</span>
                    <span className="bg-blue-100/60 p-1 rounded">156: D</span>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-14">No.</th>
                    <th className="py-2.5 px-3">Jawaban Peserta</th>
                    <th className="py-2.5 px-3">Kunci Jawaban Resmi</th>
                    <th className="py-2.5 px-3 text-center w-24">Hasil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {graded?.details?.[selectedSubtest]?.itemScores ? (
                    graded.details[selectedSubtest].itemScores.map((item) => (
                      <tr 
                        key={item.no} 
                        className={`transition-colors ${
                          item.no === 138 
                            ? 'bg-amber-50/70 hover:bg-amber-100/60 font-medium' 
                            : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-600">
                          {item.no}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          {item.userAnswer && item.userAnswer !== '-' ? (
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                              {String(item.userAnswer)}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Tidak dijawab</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-blue-900">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mr-2">
                            {item.keyDisplay}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Benar (1)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Salah (0)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    activeKeys.map((keyItem: any, idx: number) => {
                      const userAns = activeAnswers[idx] ?? activeAnswers[String(idx)] ?? activeAnswers[String(keyItem.no)] ?? '';
                      
                      let isCorrect = false;
                      const ansStr = String(userAns || '').trim().toLowerCase();
                      if (keyItem.letter) {
                        const keyLetter = String(keyItem.letter).toLowerCase();
                        const keyText = String(keyItem.text || '').toLowerCase();
                        isCorrect = (ansStr === keyLetter || (keyText && keyText.length > 1 && ansStr.includes(keyText)));
                      } else if (keyItem.answer !== undefined) {
                        isCorrect = String(keyItem.answer).trim() === ansStr;
                      } else if (keyItem.expectedValue !== undefined) {
                        isCorrect = String(keyItem.expectedValue).trim() === ansStr;
                      }

                      return (
                        <tr key={keyItem.no || idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-600">
                            {keyItem.no || idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-gray-900">
                            {userAns ? (
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                                {String(userAns)}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Tidak dijawab</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-blue-900">
                            {keyItem.letter ? (
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mr-2">
                                {keyItem.letter.toUpperCase()}
                              </span>
                            ) : null}
                            {keyItem.text && keyItem.text.length > 1 ? <span>({keyItem.text})</span> : null}
                            {keyItem.answer !== undefined ? (
                              <span className="font-mono font-bold text-blue-700">{keyItem.answer}</span>
                            ) : null}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Benar (1)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Salah (0)</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: TABEL 3 KONVERSI RESMI IST */}
      {showTabel3Modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-emerald-700 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Tabel 3 Norma IST Resmi (Halaman 22)</h3>
                <p className="text-xs text-emerald-100">
                  Konversi Skor Total Butir Subtes 4 (GE) ke Skor Mentah (RS) untuk Semua Usia
                </p>
              </div>
              <button
                onClick={() => setShowTabel3Modal(false)}
                className="text-white hover:bg-emerald-800 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 leading-relaxed">
                <strong>Ketentuan Manual IST:</strong> Jumlah poin dari 16 butir GE (rentang 0 s.d. 32) dikelompokkan ke dalam 20 interval Skor Mentah (RS 1 s.d. 20). Nilai RS inilah yang digunakan untuk penghitungan SW dan IQ IST.
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 font-bold text-gray-700 uppercase text-xs border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-4">Rentang Skor Total Butir (0 - 32)</th>
                      <th className="py-2.5 px-4 text-center">Skor Mentah (RS / RW)</th>
                      <th className="py-2.5 px-4 text-center">Status Peserta Ini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs font-mono">
                    {GE_TABLE_3_ENTRIES.map((entry) => {
                      const participantPoints = gePoints ?? (rawScores.GE > 20 ? rawScores.GE : 0);
                      const isCurrent = participantPoints >= entry.min && participantPoints <= entry.max;

                      return (
                        <tr 
                          key={entry.pointsRange} 
                          className={`hover:bg-gray-50 transition-colors ${
                            isCurrent ? 'bg-emerald-100 font-bold text-emerald-900' : ''
                          }`}
                        >
                          <td className="py-2 px-4 font-semibold">
                            {entry.pointsRange} poin
                          </td>
                          <td className="py-2 px-4 text-center font-bold text-emerald-800 text-sm">
                            {entry.rs}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {isCurrent && (
                              <span className="inline-block px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                                Nilai Peserta Ini ({participantPoints} Poin)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTabel3Modal(false)}
                className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
