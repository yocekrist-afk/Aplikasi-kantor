import React, { useState } from 'react';
import { 
  X, Play, Sparkles, Clock, ShieldCheck, CheckCircle2, 
  HelpCircle, Eye, Calculator, Type, Grid3X3, Box, BrainCircuit,
  Zap, Layers, Award, AlertTriangle
} from 'lucide-react';

export interface SimulationConfig {
  subtestId: string;
  subtestName: string;
  subtestNumber: number;
  durationMinutes: number;
  antiCheatEnabled: boolean;
  autoFillSampleAnswers: boolean;
}

interface ParticipantSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSimulation: (config: SimulationConfig) => void;
}

export const SIMULATION_SUBTEST_OPTIONS = [
  {
    id: 'trial',
    number: 0,
    code: 'TRIAL',
    name: 'Pemanasan & Simulasi Singkat (Trial IST)',
    description: '5 Soal campuran representatif untuk menguji adaptasi tampilan CBT peserta.',
    defaultDuration: 3,
    questionCount: 5,
    icon: Sparkles,
    badgeColor: 'bg-emerald-500 text-white',
    cardBorder: 'hover:border-emerald-500',
    type: 'mixed',
  },
  {
    id: 'ist_1',
    number: 1,
    code: 'SE',
    name: 'Subtes 1: SE (Melengkapi Kalimat)',
    description: '20 Soal pilihan ganda melengkapi kalimat rumpang dengan nalar akal sehat.',
    defaultDuration: 6,
    questionCount: 20,
    icon: Type,
    badgeColor: 'bg-blue-600 text-white',
    cardBorder: 'hover:border-blue-500',
    type: 'mc',
  },
  {
    id: 'ist_2',
    number: 2,
    code: 'WA',
    name: 'Subtes 2: WA (Mencari Kata Berbeda)',
    description: '20 Soal memilih 1 dari 5 kata yang tidak sekelompok / tidak sesuai kategori.',
    defaultDuration: 6,
    questionCount: 20,
    icon: Layers,
    badgeColor: 'bg-indigo-600 text-white',
    cardBorder: 'hover:border-indigo-500',
    type: 'mc',
  },
  {
    id: 'ist_3',
    number: 3,
    code: 'AN',
    name: 'Subtes 3: AN (Hubungan Analogi Kata)',
    description: '20 Soal hubungan analogi perbandingan konsep kata (A : B = C : ?).',
    defaultDuration: 7,
    questionCount: 20,
    icon: BrainCircuit,
    badgeColor: 'bg-violet-600 text-white',
    cardBorder: 'hover:border-violet-500',
    type: 'mc',
  },
  {
    id: 'ist_4',
    number: 4,
    code: 'GE',
    name: 'Subtes 4: GE (Persamaan Kata / Konsep)',
    description: '16 Soal isian teks menemukan genus proximum dua konsep (Toleransi Typo Levenshtein).',
    defaultDuration: 8,
    questionCount: 16,
    icon: Sparkles,
    badgeColor: 'bg-purple-600 text-white',
    cardBorder: 'hover:border-purple-500',
    type: 'text',
    isSpecial: true,
  },
  {
    id: 'ist_5',
    number: 5,
    code: 'RA',
    name: 'Subtes 5: RA (Berhitung Praktis)',
    description: '20 Soal cerita aritmetika praktis menggunakan keypad angka digital atau keyboard.',
    defaultDuration: 10,
    questionCount: 20,
    icon: Calculator,
    badgeColor: 'bg-cyan-600 text-white',
    cardBorder: 'hover:border-cyan-500',
    type: 'numeric',
  },
  {
    id: 'ist_6',
    number: 6,
    code: 'ZR',
    name: 'Subtes 6: ZR (Deret Angka)',
    description: '20 Soal menentukan angka berikutnya dalam urutan deret matematis.',
    defaultDuration: 10,
    questionCount: 20,
    icon: Grid3X3,
    badgeColor: 'bg-teal-600 text-white',
    cardBorder: 'hover:border-teal-500',
    type: 'numeric',
  },
  {
    id: 'ist_7',
    number: 7,
    code: 'FA',
    name: 'Subtes 7: FA (Menyusun Potongan Bentuk)',
    description: '20 Soal memadukan potongan visual 2D menjadi bentuk utuh (Acuan Bagian 1 & 2).',
    defaultDuration: 7,
    questionCount: 20,
    icon: Eye,
    badgeColor: 'bg-amber-600 text-white',
    cardBorder: 'hover:border-amber-500',
    type: 'spatial_fa',
  },
  {
    id: 'ist_8',
    number: 8,
    code: 'WU',
    name: 'Subtes 8: WU (Memutar Kubus 3D)',
    description: '20 Soal membayangkan rotasi ruang kubus 3 dimensi berdasarkan 5 kubus acuan.',
    defaultDuration: 9,
    questionCount: 20,
    icon: Box,
    badgeColor: 'bg-orange-600 text-white',
    cardBorder: 'hover:border-orange-500',
    type: 'spatial_wu',
  },
  {
    id: 'ist_9',
    number: 9,
    code: 'ME',
    name: 'Subtes 9: ME (Mengingat Kata & Ujian)',
    description: 'Alur khusus 4-tahap: Instruksi, Fase Hafalan 3 Menit, Persiapan, dan Ujian 20 Soal.',
    defaultDuration: 9,
    questionCount: 20,
    icon: Award,
    badgeColor: 'bg-rose-600 text-white',
    cardBorder: 'hover:border-rose-500',
    type: 'memory',
  },
];

export function ParticipantSimulationModal({
  isOpen,
  onClose,
  onStartSimulation,
}: ParticipantSimulationModalProps) {
  const [selectedSubtestId, setSelectedSubtestId] = useState<string>('trial');
  const [durationMode, setDurationMode] = useState<'standard' | 'quick'>('quick');
  const [antiCheatEnabled, setAntiCheatEnabled] = useState<boolean>(false);
  const [autoFillSampleAnswers, setAutoFillSampleAnswers] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentOption = SIMULATION_SUBTEST_OPTIONS.find(o => o.id === selectedSubtestId) || SIMULATION_SUBTEST_OPTIONS[0];

  const handleLaunch = () => {
    const duration = durationMode === 'standard' ? currentOption.defaultDuration : 2; // 2 Menit untuk fast eval
    onStartSimulation({
      subtestId: currentOption.id,
      subtestName: currentOption.name,
      subtestNumber: currentOption.number,
      durationMinutes: duration,
      antiCheatEnabled,
      autoFillSampleAnswers,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#8BC34A]/20 border border-[#8BC34A]/40 flex items-center justify-center text-[#8BC34A] shadow-inner">
              <Play className="w-5 h-5 fill-[#8BC34A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#8BC34A] text-gray-950">
                  Simulasi Ujian Peserta
                </span>
                <span className="text-xs text-gray-300 font-mono">
                  CBT Test Engine IST
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Pilih Subtes &amp; Konfigurasi Simulasi
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800 dark:text-gray-200">
          
          {/* Instructions banner */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <p className="font-bold">
                Uji Coba Alur Pengerjaan Peserta Secara Nyata:
              </p>
              <p>
                Anda akan masuk ke antarmuka yang dilihat oleh peserta tes. Fitur paginasi 10 soal per halaman, penyimpanan lokal (RAM) sebelum Next/Submit, timer countdown, dan keypad responsif aktif secara penuh. Hasil simulasi langsung dievaluasi dengan kartu skor instan.
              </p>
            </div>
          </div>

          {/* Subtest Selection Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                1. Pilih Subtes yang Ingin Disimulasikan:
              </label>
              <span className="text-xs font-semibold text-gray-500">
                10 Modul Tersedia
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SIMULATION_SUBTEST_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedSubtestId === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedSubtestId(opt.id)}
                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'border-[#8BC34A] bg-[#8BC34A]/5 ring-2 ring-[#8BC34A]/40 shadow-xs' 
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 bg-white dark:bg-gray-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${opt.badgeColor}`}>
                          {opt.code}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {opt.questionCount} Soal • {opt.defaultDuration} mnt
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-[#8BC34A] text-gray-950' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-gray-900 dark:text-white leading-tight">
                            {opt.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-tight">
                            {opt.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {opt.isSpecial && (
                      <div className="mt-2.5 pt-2 border-t border-purple-100 dark:border-purple-900/30 flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                        <Sparkles className="w-3 h-3" />
                        <span>Mendukung Typo Matching ("cuca" = 2 poin)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulation Settings */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
              2. Konfigurasi Simulasi:
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Duration mode */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Durasi Ujian</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="durationMode"
                      checked={durationMode === 'quick'}
                      onChange={() => setDurationMode('quick')}
                      className="accent-[#8BC34A]"
                    />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">Uji Cepat (2 Menit)</span>
                      <p className="text-[11px] text-gray-500">Ideal untuk tes alur dan submit cepat</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="durationMode"
                      checked={durationMode === 'standard'}
                      onChange={() => setDurationMode('standard')}
                      className="accent-[#8BC34A]"
                    />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">Durasi Penuh ({currentOption.defaultDuration} Menit)</span>
                      <p className="text-[11px] text-gray-500">Sesuai standar manual IST</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Anti-cheat mode */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Anti-Cheat / Proteksi</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="antiCheat"
                      checked={!antiCheatEnabled}
                      onChange={() => setAntiCheatEnabled(false)}
                      className="accent-[#8BC34A]"
                    />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">Santai / Uji Coba</span>
                      <p className="text-[11px] text-gray-500">Bebas ganti tab &amp; buka developer tools</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="antiCheat"
                      checked={antiCheatEnabled}
                      onChange={() => setAntiCheatEnabled(true)}
                      className="accent-[#8BC34A]"
                    />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">Ketat (Full Proctor)</span>
                      <p className="text-[11px] text-gray-500">Peringatan tab switch &amp; blokir copy</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Auto-fill sample option */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span>Bantuan Pengujian</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-start gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoFillSampleAnswers}
                      onChange={(e) => setAutoFillSampleAnswers(e.target.checked)}
                      className="mt-0.5 accent-[#8BC34A]"
                    />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">Auto-Isi Jawaban Contoh</span>
                      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                        Mengisi 80% jawaban benar (termasuk uji typo "cuca") saat tes terbuka agar langsung bisa submit.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">{currentOption.name}</span>
            <span>• {durationMode === 'standard' ? `${currentOption.defaultDuration} Menit` : '2 Menit'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleLaunch}
              className="px-6 py-2 bg-[#8BC34A] hover:bg-[#7cb342] text-gray-950 font-bold rounded-lg text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-gray-950" />
              <span>Mulai Simulasi Peserta</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
