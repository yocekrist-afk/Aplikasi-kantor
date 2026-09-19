import React, { useState } from 'react';
import { 
  X, CheckCircle2, XCircle, AlertCircle, Sparkles, RefreshCw, 
  ArrowRight, Award, Clock, HelpCircle, Layers, FileCheck2, Filter
} from 'lucide-react';
import { SingleSubtestEvaluation } from '../utils/istAnswerKeys';

interface SimulationScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: SingleSubtestEvaluation | null;
  timeSpentSeconds?: number;
  onRetry?: () => void;
  onChangeSubtest?: () => void;
}

export function SimulationScorecardModal({
  isOpen,
  onClose,
  evaluation,
  timeSpentSeconds,
  onRetry,
  onChangeSubtest
}: SimulationScorecardModalProps) {
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect'>('all');

  if (!isOpen || !evaluation) return null;

  const formatDuration = (sec?: number) => {
    if (!sec && sec !== 0) return '-';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const filteredItems = evaluation.itemScores.filter(item => {
    if (filterType === 'correct') return item.isCorrect || item.score > 0;
    if (filterType === 'incorrect') return !item.isCorrect && item.score === 0;
    return true;
  });

  const isGE = evaluation.subtestCode === 'GE';

  // Hitung jumlah jawaban bertoleransi typo (jika ada)
  const typoMatchedCount = evaluation.itemScores.filter(item => item.matchType === 'fuzzy').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#8BC34A]/20 border border-[#8BC34A]/40 flex items-center justify-center text-[#8BC34A] shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#8BC34A] text-gray-900">
                  Hasil Simulasi
                </span>
                <span className="text-xs text-gray-300 font-mono">
                  {evaluation.subtestCode !== 'TRIAL' ? `IST Resmi - ${evaluation.subtestCode}` : 'Trial IST'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {evaluation.subtestName}
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
          
          {/* Main Score KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-slate-50 dark:bg-gray-800/60 p-4 rounded-xl border border-slate-200 dark:border-gray-700 flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Skor Mentah (RW / RS)
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {evaluation.rw}
                </span>
                <span className="text-sm font-medium text-gray-400">
                  / {evaluation.maxRw}
                </span>
              </div>
              <span className="text-[11px] text-gray-500 mt-1">
                {isGE ? 'Telah dikonversi via Tabel 3' : 'Jumlah jawaban benar'}
              </span>
            </div>

            <div className="bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                Standar Skor (SW)
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-blue-700 dark:text-blue-300">
                  {evaluation.sw}
                </span>
                <span className="text-xs text-blue-500 font-semibold">
                  (Norma Usia 21-25)
                </span>
              </div>
              <span className="text-[11px] font-bold text-blue-800 dark:text-blue-200 mt-1">
                {evaluation.category}
              </span>
            </div>

            {isGE ? (
              <div className="bg-purple-50/70 dark:bg-purple-950/30 p-4 rounded-xl border border-purple-200 dark:border-purple-800/50 flex flex-col justify-between">
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  Total Poin Subtes 4
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-purple-700 dark:text-purple-300">
                    {evaluation.geTotalPoints ?? 0}
                  </span>
                  <span className="text-sm font-medium text-purple-400">
                    / 32 Poin
                  </span>
                </div>
                <span className="text-[11px] text-purple-800 dark:text-purple-200 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  {typoMatchedCount > 0 ? `${typoMatchedCount} kata typo tertoleransi` : 'Evaluasi fuzzy aktif'}
                </span>
              </div>
            ) : (
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex flex-col justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                  Tingkat Keberhasilan
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {Math.round((evaluation.rw / evaluation.maxRw) * 100)}%
                  </span>
                </div>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-200 mt-1">
                  {evaluation.rw} dari {evaluation.maxRw} soal tepat
                </span>
              </div>
            )}

            <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Waktu Digunakan</span>
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                  {formatDuration(timeSpentSeconds)}
                </span>
              </div>
              <span className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                {evaluation.totalAnswered} terjawab • {evaluation.totalUnanswered} kosong
              </span>
            </div>
          </div>

          {/* Subtest 4 GE Note if applicable */}
          {isGE && (
            <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl p-4 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <p className="font-bold">
                  Kaidah Penilaian Subtes 4 (GE) dengan Toleransi Typo Cerdas:
                </p>
                <p>
                  Sistem mengevaluasi jawaban peserta berdasarkan 3 jenjang poin (Skor 2: Konsep Esensial / Genus Proximum; Skor 1: Sifat Fungsional / Spesifik; Skor 0: Salah / Blacklist). Typo hingga jarak edit Levenshtein 1-2 huruf (misal: <em>"cuca"</em> atau <em>"cusca"</em> untuk <em>"cuaca"</em>) otomatis dikenali dan diberikan poin penuh sesuai kaidah baku psikotes.
                </p>
              </div>
            </div>
          )}

          {/* Items Breakdown Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-gray-500" />
                <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">
                  Rincian Koreksi Per Butir Soal ({filteredItems.length} butir)
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-md transition ${filterType === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Semua ({evaluation.itemScores.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('correct')}
                  className={`px-3 py-1 rounded-md transition ${filterType === 'correct' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Benar ({evaluation.itemScores.filter(i => i.isCorrect || i.score > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('incorrect')}
                  className={`px-3 py-1 rounded-md transition ${filterType === 'incorrect' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Salah / 0 Poin ({evaluation.itemScores.filter(i => !i.isCorrect && i.score === 0).length})
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
              <div className="max-h-[340px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 font-bold sticky top-0 border-b border-gray-200 dark:border-gray-700 z-10">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">No</th>
                      <th className="py-2.5 px-3">Soal / Stimulus</th>
                      <th className="py-2.5 px-3">Jawaban Peserta</th>
                      <th className="py-2.5 px-3">Kunci Resmi</th>
                      <th className="py-2.5 px-3 text-center w-24">Skor</th>
                      <th className="py-2.5 px-3">Analisis Koreksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                    {filteredItems.map((item) => {
                      const isPerfect = item.score === 2 || (item.score === 1 && !isGE);
                      const isPartial = isGE && item.score === 1;

                      return (
                        <tr key={item.no} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-gray-500">
                            {item.no}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white max-w-[180px] truncate" title={item.questionTitle}>
                            {item.questionTitle}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded font-mono text-[11px] ${
                              isPerfect
                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : isPartial
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}>
                              {String(item.userAnswer || '-')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300 max-w-[180px] truncate" title={item.keyDisplay}>
                            {item.keyDisplay}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isPerfect ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" />
                                {isGE ? 'Skor 2' : 'Benar (1)'}
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                <AlertCircle className="w-3 h-3" />
                                Skor 1
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                                <XCircle className="w-3 h-3" />
                                {isGE ? 'Skor 0' : 'Salah (0)'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 text-[11px] leading-tight">
                            {item.explanation || '-'}
                            {item.matchType === 'fuzzy' && (
                              <span className="block text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                                ★ Typo tertoleransi (Dist: {item.editDistance})
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
          </div>

        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#8BC34A]"></span>
            <span>Simulasi Uji Coba Selesai. Hasil ini tidak mempengaruhi database peserta resmi.</span>
          </div>

          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ulangi Subtes Ini</span>
              </button>
            )}

            {onChangeSubtest && (
              <button
                type="button"
                onClick={onChangeSubtest}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Layers className="w-3.5 h-3.5 text-[#8BC34A]" />
                <span>Pilih Subtes Lain</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#8BC34A] hover:bg-[#7cb342] text-gray-950 font-bold rounded-lg text-xs transition shadow-sm cursor-pointer"
            >
              Selesai &amp; Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
