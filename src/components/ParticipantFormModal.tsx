import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Calculator,
  Brain,
  Sparkles,
  Save,
  CheckCircle2,
  Compass,
  FileCheck,
  Loader2,
} from 'lucide-react';
import { Gender, Participant, RawScores } from '../types/ist';
import { processParticipantScores, convertGeTotalToRS } from '../utils/istScoring';

interface ParticipantFormModalProps {
  initialData?: Participant | null; // If null, mode is ADD, if set, mode is EDIT
  onSave: (participant: Participant) => void;
  onClose: () => void;
}

const SUBTEST_LIMITS: Record<keyof RawScores, { max: number; label: string; indo: string }> = {
  SE: { max: 20, label: 'Satzergänzung', indo: 'Melengkapi Kalimat' },
  WA: { max: 20, label: 'Wortauswahl', indo: 'Mencari Kata Berbeda' },
  AN: { max: 20, label: 'Analogien', indo: 'Analogi Verbal' },
  GE: { max: 32, label: 'Gemeinsamkeiten', indo: 'Persamaan Konsep (Max 32)' },
  RA: { max: 20, label: 'Rechenaufgaben', indo: 'Hitungan Praktis' },
  ZR: { max: 20, label: 'Zahlenreihen', indo: 'Deret Angka' },
  FA: { max: 20, label: 'Figurenauswahl', indo: 'Potongan Gambar' },
  WU: { max: 20, label: 'Würfelaufgaben', indo: 'Rotasi Kubus' },
  ME: { max: 20, label: 'Merkaufgaben', indo: 'Mengingat Kata' },
};

export const ParticipantFormModal: React.FC<ParticipantFormModalProps> = ({
  initialData,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialData);
  const [isSaving, setIsSaving] = useState(false);

  // Demographics state
  const [nama, setNama] = useState(initialData?.nama || '');
  const [nomorTes, setNomorTes] = useState(
    initialData?.nomorTes || `IST/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [jenisKelamin, setJenisKelamin] = useState<Gender>(initialData?.jenisKelamin || 'L');
  const [tanggalLahir, setTanggalLahir] = useState(initialData?.tanggalLahir || '2008-05-12');
  const [tanggalTes, setTanggalTes] = useState(
    initialData?.tanggalTes || new Date().toISOString().split('T')[0]
  );
  const [usia, setUsia] = useState<string>(initialData?.usia ? String(initialData.usia) : '17 Tahun 8 Bulan');
  const [pendidikan, setPendidikan] = useState(initialData?.pendidikan || 'SMA Kelas XII - IPA 1');
  const [asalSekolahInstitusi, setAsalSekolahInstitusi] = useState(
    initialData?.asalSekolahInstitusi || 'SMA Negeri 1 Jakarta'
  );

  // Raw Scores state
  const [rawScores, setRawScores] = useState<RawScores>(
    initialData?.rawScores || {
      SE: 14,
      WA: 13,
      AN: 15,
      GE: 18,
      RA: 16,
      ZR: 16,
      FA: 15,
      WU: 16,
      ME: 14,
    }
  );

  const handleScoreChange = async (subtest: keyof RawScores, val: string) => {
    const num = parseInt(val, 10);
    const max = SUBTEST_LIMITS[subtest].max;
    const clamped = isNaN(num) ? 0 : Math.min(max, Math.max(0, num));
    setRawScores((prev) => ({ ...prev, [subtest]: clamped }));
  };

  // Preset generators for quick testing
  const applyPreset = (preset: 'IPA' | 'IPS' | 'SUPERIOR' | 'RERATA') => {
    if (preset === 'IPA') {
      setRawScores({ SE: 12, WA: 11, AN: 14, GE: 16, RA: 18, ZR: 19, FA: 17, WU: 18, ME: 13 });
    } else if (preset === 'IPS') {
      setRawScores({ SE: 17, WA: 18, AN: 17, GE: 26, RA: 11, ZR: 10, FA: 11, WU: 10, ME: 17 });
    } else if (preset === 'SUPERIOR') {
      setRawScores({ SE: 18, WA: 18, AN: 19, GE: 28, RA: 19, ZR: 19, FA: 18, WU: 18, ME: 18 });
    } else {
      setRawScores({ SE: 12, WA: 12, AN: 12, GE: 15, RA: 12, ZR: 12, FA: 12, WU: 12, ME: 12 });
    }
  };

  // Live real-time scoring calculation
  const calculatedParticipant = useMemo(() => {
    const id = initialData?.id || `p-${Date.now()}`;
    return processParticipantScores(rawScores, {
      id,
      nomorTes,
      nama: nama || 'Nama Belum Diisi',
      jenisKelamin,
      tanggalLahir,
      tanggalTes,
      usia,
      pendidikan,
      asalSekolahInstitusi,
    });
  }, [
    rawScores,
    initialData,
    nomorTes,
    nama,
    jenisKelamin,
    tanggalLahir,
    tanggalTes,
    usia,
    pendidikan,
    asalSekolahInstitusi,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Mohon isi nama lengkap peserta.');
      return;
    }
    if (!nomorTes.trim()) {
      alert('Mohon isi nomor tes peserta.');
      return;
    }
    setIsSaving(true);
    try {
      await Promise.resolve(onSave(calculatedParticipant));
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              {isEditing ? <FileCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                {isEditing ? 'Edit Data & Skor Peserta' : 'Tambah Peserta Tes Baru'}
              </h2>
              <p className="text-xs text-slate-300">
                {isEditing
                  ? `Mengoreksi data dan skor mentah untuk ${initialData?.nama}`
                  : 'Input data identitas & skor mentah 9 subtes dengan kalkulasi instan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Grid: Left Form, Right Real-time Preview */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* LEFT 7 COLS: FORM INPUTS */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Box 1: Identitas Peserta */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-950 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Identitas Peserta
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nama Lengkap Peserta *
                    </label>
                    <input
                      type="text"
                      required
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Contoh: Muhammad Bintang Pratama"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nomor Peserta / Tes *
                    </label>
                    <input
                      type="text"
                      required
                      value={nomorTes}
                      onChange={(e) => setNomorTes(e.target.value)}
                      placeholder="IST/2026/001"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={jenisKelamin}
                      onChange={(e) => setJenisKelamin(e.target.value as Gender)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={tanggalLahir}
                      onChange={(e) => setTanggalLahir(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Usia Saat Tes
                    </label>
                    <input
                      type="text"
                      value={usia}
                      onChange={(e) => setUsia(e.target.value)}
                      placeholder="Contoh: 17 Tahun 6 Bulan"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Pendidikan / Kelas
                    </label>
                    <input
                      type="text"
                      value={pendidikan}
                      onChange={(e) => setPendidikan(e.target.value)}
                      placeholder="Contoh: SMA Kelas XII - IPA"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Asal Sekolah / Institusi
                    </label>
                    <input
                      type="text"
                      value={asalSekolahInstitusi}
                      onChange={(e) => setAsalSekolahInstitusi(e.target.value)}
                      placeholder="Contoh: SMAN 1 Jakarta"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tanggal Pelaksanaan Tes
                    </label>
                    <input
                      type="date"
                      value={tanggalTes}
                      onChange={(e) => setTanggalTes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Box 2: Skor Mentah (RW) 9 Subtes */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-blue-600" />
                    Skor Mentah 9 Subtes (RW)
                  </div>
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-slate-400 hidden sm:inline">Preset:</span>
                    <button
                      type="button"
                      onClick={() => applyPreset('IPA')}
                      className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition font-medium cursor-pointer"
                    >
                      IPA
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('IPS')}
                      className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 transition font-medium cursor-pointer"
                    >
                      IPS
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('SUPERIOR')}
                      className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 hover:bg-purple-200 transition font-medium cursor-pointer"
                    >
                      Superior
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {(Object.keys(SUBTEST_LIMITS) as (keyof RawScores)[]).map((sub) => {
                    const info = SUBTEST_LIMITS[sub];
                    return (
                      <div key={sub} className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-blue-950">{sub}</span>
                          <span className="text-[9px] text-slate-400">Max {info.max}</span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={info.max}
                          value={rawScores[sub]}
                          onChange={(e) => handleScoreChange(sub, e.target.value)}
                          className="w-full text-center font-mono font-bold text-sm text-slate-900 border border-slate-200 rounded py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className="text-[8px] text-slate-500 truncate mt-0.5 text-center" title={info.label}>
                          {info.label}
                        </div>
                        {sub === 'GE' && (
                          <div className="text-[8px] font-semibold text-emerald-700 bg-emerald-50 rounded px-1 py-0.5 mt-1 text-center" title="Konversi Tabel 3 Norma IST Resmi">
                            {rawScores.GE > 20 
                              ? `RS: ${convertGeTotalToRS(rawScores.GE)}/20 (Tabel 3)` 
                              : `RS: ${rawScores.GE}/20`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT 5 COLS: REAL-TIME SCORE CARD PREVIEW */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-xl p-4 shadow-lg border border-blue-800/60 space-y-4 sticky top-2">
              
              <div className="flex items-center justify-between pb-2 border-b border-blue-800/80">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Kalkulasi Instan Real-time
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                  Norma IST-70
                </span>
              </div>

              {/* Big IQ Card */}
              <div className="text-center py-2 bg-white/5 rounded-lg border border-white/10">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block">
                  Taraf Inteligensi Umum (TIU)
                </span>
                <div className="flex items-baseline justify-center gap-1.5 my-1">
                  <span className="text-4xl font-black font-mono tracking-tight text-white leading-none">
                    {calculatedParticipant.totalIQ}
                  </span>
                  <span className="text-xs text-blue-300 font-bold uppercase">IQ IST</span>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/30 text-white font-bold text-xs border border-blue-400/40">
                  {calculatedParticipant.iqCategory}
                </div>
                <div className="mt-2 text-[10px] text-blue-200 flex justify-around border-t border-white/10 pt-1.5">
                  <span>Total RW: <strong>{calculatedParticipant.totalRaw}</strong></span>
                  <span>•</span>
                  <span>Total SS: <strong>{calculatedParticipant.totalSS}</strong></span>
                </div>
              </div>

              {/* 4 Ranah Pokok */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                  4 Ranah Kemampuan
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 p-2 rounded border border-white/10 flex justify-between items-center">
                    <span className="text-slate-300 text-[11px]">Verbal</span>
                    <strong className="font-mono text-blue-300">{calculatedParticipant.domainSummary.verbal.averageIq}</strong>
                  </div>
                  <div className="bg-white/5 p-2 rounded border border-white/10 flex justify-between items-center">
                    <span className="text-slate-300 text-[11px]">Numerik</span>
                    <strong className="font-mono text-blue-300">{calculatedParticipant.domainSummary.numerik.averageIq}</strong>
                  </div>
                  <div className="bg-white/5 p-2 rounded border border-white/10 flex justify-between items-center">
                    <span className="text-slate-300 text-[11px]">Spasial</span>
                    <strong className="font-mono text-blue-300">{calculatedParticipant.domainSummary.spasial.averageIq}</strong>
                  </div>
                  <div className="bg-white/5 p-2 rounded border border-white/10 flex justify-between items-center">
                    <span className="text-slate-300 text-[11px]">Memori</span>
                    <strong className="font-mono text-blue-300">{calculatedParticipant.domainSummary.memori.averageIq}</strong>
                  </div>
                </div>
              </div>

              {/* Analisis Peminatan */}
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-bold text-blue-300 uppercase flex items-center gap-1">
                    <Compass className="w-3 h-3 text-blue-400" />
                    Arah Peminatan
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">
                    {calculatedParticipant.streamAnalysis.preference}
                  </span>
                </div>
                <div className="text-[10px] text-blue-100 flex justify-between">
                  <span>Skor IPA: <strong>{calculatedParticipant.streamAnalysis.ipaScore}</strong></span>
                  <span>Skor IPS: <strong>{calculatedParticipant.streamAnalysis.ipsScore}</strong></span>
                </div>
              </div>

              {/* Top 2 Fakultas */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                  Top Rekomendasi Fakultas
                </span>
                {calculatedParticipant.studyRecommendations.slice(0, 2).map((st, i) => (
                  <div key={i} className="bg-white/5 px-2.5 py-1.5 rounded border border-white/10 flex justify-between items-center text-[11px]">
                    <span className="truncate mr-2 font-medium">#{i + 1} {st.faculty}</span>
                    <span className="font-mono text-emerald-300 font-bold shrink-0">{st.matchScore}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambahkan Peserta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
