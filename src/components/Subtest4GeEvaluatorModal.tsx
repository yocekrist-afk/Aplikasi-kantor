import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  Sliders,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  getGeCriteriaList,
  updateGeCriteriaList,
  resetGeCriteriaToDefault,
  testGeWordDetailed,
  GeQuestionCriteria,
  GeDetailedEvaluation,
  GE_TABLE_3_ENTRIES,
} from '../utils/istAnswerKeys';

interface Subtest4GeEvaluatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Subtest4GeEvaluatorModal({ isOpen, onClose }: Subtest4GeEvaluatorModalProps) {
  const [activeTab, setActiveTab] = useState<'simulator' | 'dictionary' | 'manual'>('simulator');
  const [criteriaList, setCriteriaList] = useState<GeQuestionCriteria[]>(() => getGeCriteriaList());
  
  // Simulator states
  const [selectedQuestionNo, setSelectedQuestionNo] = useState<number>(64); // default: Hujan - Salju
  const [simInput, setSimInput] = useState<string>('cuca');
  const [simResult, setSimResult] = useState<GeDetailedEvaluation | null>(() =>
    testGeWordDetailed(64, 'cuca')
  );

  // Search in dictionary
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add keyword inline states
  const [addingToNo, setAddingToNo] = useState<number | null>(null);
  const [newKeywordType, setNewKeywordType] = useState<'score2' | 'score1' | 'score0'>('score2');
  const [newKeywordValue, setNewKeywordValue] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Run simulator
  const handleSimulate = (wordToTest?: string) => {
    const text = wordToTest !== undefined ? wordToTest : simInput;
    const res = testGeWordDetailed(selectedQuestionNo, text);
    setSimResult(res);
  };

  const handleSelectQuestion = (qNo: number) => {
    setSelectedQuestionNo(qNo);
    const currCriteria = criteriaList.find((c) => c.no === qNo) || criteriaList[0];
    // Pick an appropriate default sample for testing
    let sample = 'cuca';
    if (qNo === 61) sample = 'bungaa';
    else if (qNo === 62) sample = 'pancaindra';
    else if (qNo === 63) sample = 'kristl';
    else if (qNo === 66) sample = 'alat optk';
    else if (currCriteria.score2Keywords[0]) sample = currCriteria.score2Keywords[0];

    setSimInput(sample);
    const res = testGeWordDetailed(qNo, sample);
    setSimResult(res);
  };

  // Add new keyword
  const handleAddKeyword = (qNo: number) => {
    const trimmed = newKeywordValue.trim().toLowerCase();
    if (!trimmed) return;

    const updated = criteriaList.map((item) => {
      if (item.no !== qNo) return item;

      const score2 = [...item.score2Keywords];
      const score1 = [...item.score1Keywords];
      const score0 = [...(item.score0Keywords || [])];

      if (newKeywordType === 'score2') {
        if (!score2.includes(trimmed)) score2.push(trimmed);
      } else if (newKeywordType === 'score1') {
        if (!score1.includes(trimmed)) score1.push(trimmed);
      } else {
        if (!score0.includes(trimmed)) score0.push(trimmed);
      }

      return {
        ...item,
        score2Keywords: score2,
        score1Keywords: score1,
        score0Keywords: score0,
      };
    });

    setCriteriaList(updated);
    updateGeCriteriaList(updated);
    setNewKeywordValue('');
    setAddingToNo(null);
    showToast(`Kata kunci "${trimmed}" berhasil ditambahkan ke Soal No. ${qNo}!`);
    // Re-run simulation if currently on this question
    if (selectedQuestionNo === qNo) {
      setSimResult(testGeWordDetailed(qNo, simInput));
    }
  };

  // Remove keyword
  const handleRemoveKeyword = (qNo: number, type: 'score2' | 'score1' | 'score0', keyword: string) => {
    const updated = criteriaList.map((item) => {
      if (item.no !== qNo) return item;

      return {
        ...item,
        score2Keywords:
          type === 'score2' ? item.score2Keywords.filter((k) => k !== keyword) : item.score2Keywords,
        score1Keywords:
          type === 'score1' ? item.score1Keywords.filter((k) => k !== keyword) : item.score1Keywords,
        score0Keywords:
          type === 'score0'
            ? (item.score0Keywords || []).filter((k) => k !== keyword)
            : item.score0Keywords,
      };
    });

    setCriteriaList(updated);
    updateGeCriteriaList(updated);
    showToast(`Kata kunci "${keyword}" dihapus dari Soal No. ${qNo}.`);
    if (selectedQuestionNo === qNo) {
      setSimResult(testGeWordDetailed(qNo, simInput));
    }
  };

  // Reset to default IST manual
  const handleResetToDefault = () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin mengembalikan seluruh kamus Subtes 4 (GE) ke Norma Baku IST Resmi bawaan buku manual?'
      )
    ) {
      const def = resetGeCriteriaToDefault();
      setCriteriaList(def);
      showToast('Kamus kata kunci berhasil dikembalikan ke Norma Baku IST Resmi!');
      setSimResult(testGeWordDetailed(selectedQuestionNo, simInput));
    }
  };

  // Filtered dictionary
  const filteredCriteria = useMemo(() => {
    if (!searchQuery.trim()) return criteriaList;
    const q = searchQuery.toLowerCase();
    return criteriaList.filter((item) => {
      const wordsMatch = item.words.some((w) => w.toLowerCase().includes(q));
      const score2Match = item.score2Keywords.some((k) => k.toLowerCase().includes(q));
      const score1Match = item.score1Keywords.some((k) => k.toLowerCase().includes(q));
      const score0Match = (item.score0Keywords || []).some((k) => k.toLowerCase().includes(q));
      const noMatch = String(item.no).includes(q);
      return wordsMatch || score2Match || score1Match || score0Match || noMatch;
    });
  }, [criteriaList, searchQuery]);

  // Current question criteria for simulator
  const activeSimCriteria = useMemo(() => {
    return criteriaList.find((c) => c.no === selectedQuestionNo) || criteriaList[0];
  }, [criteriaList, selectedQuestionNo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Evaluator & Kamus Kata Kunci Subtes 4 (GE)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                  Fuzzy Matching Aktif
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Simulasi toleransi typo cerdas (*Levenshtein distance*), kalibrasi kata kunci baku, dan penjamin mutu psikometrik.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-6">
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'simulator'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Simulator Uji Typo & Kata (Live Sandbox)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dictionary')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'dictionary'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tabel Kamus Kunci 16 Soal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'manual'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Pedoman Psikometri & Tabel 3</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: SIMULATOR LIVE SANDBOX */}
          {activeTab === 'simulator' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Question Selection Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  1. Pilih Soal Subtes 4 yang Ingin Diuji:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <select
                      value={selectedQuestionNo}
                      onChange={(e) => handleSelectQuestion(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                    >
                      {criteriaList.map((item) => (
                        <option key={item.no} value={item.no}>
                          Soal No. {item.no} : {item.words[0].toUpperCase()} – {item.words[1].toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-purple-50/70 border border-purple-200 rounded-lg px-3 py-2 text-xs text-purple-800">
                    <span className="font-bold text-purple-900">Pasangan Kata:</span>
                    <span className="font-extrabold text-sm text-purple-950 uppercase">
                      "{activeSimCriteria.words[0]}" &amp; "{activeSimCriteria.words[1]}"
                    </span>
                  </div>
                </div>

                {/* Target Keywords Preview */}
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-md p-2">
                    <span className="font-bold text-emerald-800 block text-[11px] mb-1">
                      Kunci Skor 2 (Esensial / Genus Proximum):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {activeSimCriteria.score2Keywords.map((k) => (
                        <span key={k} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded font-medium text-[11px]">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-200 rounded-md p-2">
                    <span className="font-bold text-amber-800 block text-[11px] mb-1">
                      Kunci Skor 1 (Fungsional / Deskriptif):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {activeSimCriteria.score1Keywords.slice(0, 6).map((k) => (
                        <span key={k} className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-medium text-[11px]">
                          {k}
                        </span>
                      ))}
                      {activeSimCriteria.score1Keywords.length > 6 && (
                        <span className="text-[10px] text-amber-700 font-semibold self-center">
                          +{activeSimCriteria.score1Keywords.length - 6} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-rose-50/70 border border-rose-200 rounded-md p-2">
                    <span className="font-bold text-rose-800 block text-[11px] mb-1">
                      Kata Terlarang Skor 0 (Blacklist):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(activeSimCriteria.score0Keywords || []).length > 0 ? (
                        activeSimCriteria.score0Keywords?.map((k) => (
                          <span key={k} className="px-1.5 py-0.5 bg-rose-100 text-rose-900 rounded font-medium text-[11px]">
                            {k}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Tidak ada kata terlarang khusus</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Input Sandbox */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  2. Ketik Kata Jawaban Peserta untuk Diuji:
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={simInput}
                      onChange={(e) => {
                        setSimInput(e.target.value);
                        handleSimulate(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSimulate();
                      }}
                      placeholder="Coba ketik 'cuca', 'cusca', 'bungaa', 'kristl', 'organ tbuh'..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-none pr-10"
                    />
                    {simInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setSimInput('');
                          handleSimulate('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSimulate()}
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <span>Uji Kata</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets for Current Question */}
                <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                  <span className="text-gray-500 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Contoh Uji Cepat:</span>
                  </span>

                  {selectedQuestionNo === 64 ? (
                    <>
                      {['cuca', 'cusca', 'cuaca', 'iklim', 'air', 'basah', 'musim dingin', 'batu'].map((sample) => (
                        <button
                          key={sample}
                          type="button"
                          onClick={() => {
                            setSimInput(sample);
                            handleSimulate(sample);
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer border ${
                            simInput.toLowerCase() === sample.toLowerCase()
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                          }`}
                        >
                          "{sample}"
                        </button>
                      ))}
                    </>
                  ) : selectedQuestionNo === 61 ? (
                    <>
                      {['bunga', 'bungaa', 'bng', 'kembang', 'tanaman', 'tumbuh-tumbuhan', 'pohon', 'batu'].map((sample) => (
                        <button
                          key={sample}
                          type="button"
                          onClick={() => {
                            setSimInput(sample);
                            handleSimulate(sample);
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer border ${
                            simInput.toLowerCase() === sample.toLowerCase()
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                          }`}
                        >
                          "{sample}"
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {activeSimCriteria.score2Keywords.slice(0, 3).map((sample) => (
                        <button
                          key={sample}
                          type="button"
                          onClick={() => {
                            setSimInput(sample);
                            handleSimulate(sample);
                          }}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-semibold transition cursor-pointer border border-gray-200"
                        >
                          "{sample}"
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Simulation Result Card */}
              {simResult && (
                <div
                  className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 shadow-md ${
                    simResult.score === 2
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : simResult.score === 1
                      ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                      : 'bg-rose-50/80 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-4 border-current/15">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-md ${
                          simResult.score === 2
                            ? 'bg-emerald-600'
                            : simResult.score === 1
                            ? 'bg-amber-500'
                            : 'bg-rose-600'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider">SKOR</span>
                        <span className="text-2xl leading-none">{simResult.score}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-extrabold">
                            {simResult.score === 2
                              ? 'SKOR 2 (Abstraksi Tinggi / Genus Proximum)'
                              : simResult.score === 1
                              ? 'SKOR 1 (Abstraksi Fungsional / Parsial)'
                              : 'SKOR 0 (Tidak Memenuhi / Terlarang)'}
                          </span>
                        </div>
                        <p className="text-xs opacity-80 mt-0.5">
                          Kata yang diuji: <span className="font-bold underline">"{simInput || '(kosong)'}"</span> pada Soal No. {simResult.questionNo} ({simResult.words.join(' – ')})
                        </p>
                      </div>
                    </div>

                    {/* Match Type Badge */}
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-xs ${
                          simResult.matchType === 'exact'
                            ? 'bg-emerald-200 text-emerald-900'
                            : simResult.matchType === 'fuzzy'
                            ? 'bg-purple-200 text-purple-900 ring-2 ring-purple-400'
                            : simResult.matchType === 'blacklist'
                            ? 'bg-rose-200 text-rose-900'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {simResult.matchType === 'exact' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {simResult.matchType === 'fuzzy' && <Sparkles className="w-3.5 h-3.5 text-purple-700" />}
                        {simResult.matchType === 'blacklist' && <XCircle className="w-3.5 h-3.5 text-rose-700" />}
                        {simResult.matchType === 'none' && <AlertTriangle className="w-3.5 h-3.5 text-gray-700" />}
                        <span>
                          {simResult.matchType === 'exact'
                            ? 'Pencocokan Persis (Exact)'
                            : simResult.matchType === 'fuzzy'
                            ? 'Toleransi Typo (Fuzzy Match)'
                            : simResult.matchType === 'blacklist'
                            ? 'Kata Terlarang (Blacklist)'
                            : 'Tidak Ditemukan Kesamaan'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="bg-white/80 rounded-xl p-3.5 border border-current/10 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gray-700 min-w-[130px]">Penjelasan Sistem:</span>
                        <span className="font-medium text-gray-900">{simResult.explanation}</span>
                      </div>

                      {simResult.matchedKeyword && (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-700 min-w-[130px]">Kata Kunci Target:</span>
                          <span className="px-2 py-0.5 bg-gray-900 text-white rounded font-bold text-xs">
                            "{simResult.matchedKeyword}"
                          </span>
                          {simResult.matchedWordInAnswer && (
                            <span className="text-gray-600 text-xs">
                              (dari kata <span className="font-semibold underline">"{simResult.matchedWordInAnswer}"</span> dalam jawaban)
                            </span>
                          )}
                        </div>
                      )}

                      {simResult.editDistance !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-700 min-w-[130px]">Jarak Levenshtein:</span>
                          <span className="font-mono font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                            {simResult.editDistance} karakter
                          </span>
                          <span className="text-gray-500 text-xs">
                            {simResult.editDistance === 0
                              ? '(Sama persis)'
                              : simResult.editDistance === 1
                              ? '(Beda 1 huruf / slip tuts keyboard)'
                              : '(Beda 2 huruf)'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DICTIONARY TABLE & MANAGEMENT */}
          {activeTab === 'dictionary' && (
            <div className="space-y-4">
              {/* Filter & Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nomor soal, kata, atau kata kunci..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Kembalikan semua kata ke buku manual IST"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
                    <span>Reset ke Norma Baku IST</span>
                  </button>
                </div>
              </div>

              {/* 16 Questions Cards */}
              <div className="space-y-3">
                {filteredCriteria.map((item) => (
                  <div key={item.no} className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center">
                          {item.no}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 uppercase">
                            {item.words[0]} – {item.words[1]}
                          </h4>
                          <span className="text-[11px] text-gray-500">
                            Subtes 4 (GE) Butir ke-{item.no - 60} dari 16 Soal
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuestionNo(item.no);
                          setActiveTab('simulator');
                          handleSimulate(item.score2Keywords[0] || 'cuca');
                        }}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Uji di Simulator</span>
                      </button>
                    </div>

                    {/* Keywords Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* Score 2 */}
                      <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-emerald-900 flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                              2
                            </span>
                            <span>Skor 2 (Esensial):</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingToNo(item.no);
                              setNewKeywordType('score2');
                              setNewKeywordValue('');
                            }}
                            className="text-emerald-700 hover:text-emerald-900 text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Tambah</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.score2Keywords.map((kw) => (
                            <span
                              key={kw}
                              className="group inline-flex items-center gap-1 px-2 py-1 bg-white border border-emerald-200 text-emerald-900 rounded-md font-medium text-xs shadow-2xs"
                            >
                              <span>{kw}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveKeyword(item.no, 'score2', kw)}
                                className="text-gray-400 hover:text-rose-600 opacity-60 group-hover:opacity-100 transition p-0.5"
                                title="Hapus kata ini"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Score 1 */}
                      <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-amber-900 flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                              1
                            </span>
                            <span>Skor 1 (Fungsional):</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingToNo(item.no);
                              setNewKeywordType('score1');
                              setNewKeywordValue('');
                            }}
                            className="text-amber-700 hover:text-amber-900 text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Tambah</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.score1Keywords.map((kw) => (
                            <span
                              key={kw}
                              className="group inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-200 text-amber-900 rounded-md font-medium text-xs shadow-2xs"
                            >
                              <span>{kw}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveKeyword(item.no, 'score1', kw)}
                                className="text-gray-400 hover:text-rose-600 opacity-60 group-hover:opacity-100 transition p-0.5"
                                title="Hapus kata ini"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Score 0 */}
                      <div className="bg-rose-50/50 rounded-lg p-3 border border-rose-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-rose-900 flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">
                              0
                            </span>
                            <span>Skor 0 (Terlarang):</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingToNo(item.no);
                              setNewKeywordType('score0');
                              setNewKeywordValue('');
                            }}
                            className="text-rose-700 hover:text-rose-900 text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Tambah</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(item.score0Keywords || []).length > 0 ? (
                            item.score0Keywords?.map((kw) => (
                              <span
                                key={kw}
                                className="group inline-flex items-center gap-1 px-2 py-1 bg-white border border-rose-200 text-rose-900 rounded-md font-medium text-xs shadow-2xs"
                              >
                                <span>{kw}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveKeyword(item.no, 'score0', kw)}
                                  className="text-gray-400 hover:text-rose-600 opacity-60 group-hover:opacity-100 transition p-0.5"
                                  title="Hapus kata ini"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Tidak ada kata khusus</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inline Add Modal Form */}
                    {addingToNo === item.no && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-wrap items-center gap-2 text-xs animate-in fade-in duration-150">
                        <span className="font-semibold text-gray-700">
                          Tambah Kata ke{' '}
                          <span className="font-bold text-purple-700">
                            {newKeywordType === 'score2'
                              ? 'Skor 2'
                              : newKeywordType === 'score1'
                              ? 'Skor 1'
                              : 'Kata Terlarang (Skor 0)'}
                          </span>
                          :
                        </span>
                        <input
                          type="text"
                          value={newKeywordValue}
                          onChange={(e) => setNewKeywordValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddKeyword(item.no);
                          }}
                          placeholder="Masukkan kata baru..."
                          className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[200px]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleAddKeyword(item.no)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-md transition cursor-pointer"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingToNo(null)}
                          className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md transition cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PEDOMAN PSIKOMETRI & TABEL 3 IST */}
          {activeTab === 'manual' && (
            <div className="space-y-6 max-w-4xl mx-auto text-xs sm:text-sm">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b pb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-base text-gray-900">
                    Kaidah Standarisasi Penilaian Subtes 4 (GE)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-3.5 border border-emerald-200">
                    <h5 className="font-extrabold text-emerald-900 mb-1">Skor 2 (Genus Proximum)</h5>
                    <p className="text-emerald-800 text-xs leading-relaxed">
                      Diberikan jika jawaban merujuk pada <strong>konsep esensial / kategori tingkat tinggi</strong> yang mencakup kedua objek secara tepat dan tidak berlebihan.
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3.5 border border-amber-200">
                    <h5 className="font-extrabold text-amber-900 mb-1">Skor 1 (Fungsional / Parsial)</h5>
                    <p className="text-amber-800 text-xs leading-relaxed">
                      Diberikan jika jawaban menyatakan kesamaan yang <strong>fungsional, fisik, atau kategori yang terlalu umum</strong> (misal: "tumbuhan" untuk mawar-melati).
                    </p>
                  </div>
                  <div className="bg-rose-50 rounded-lg p-3.5 border border-rose-200">
                    <h5 className="font-extrabold text-rose-900 mb-1">Skor 0 (Keliru / Terlarang)</h5>
                    <p className="text-rose-800 text-xs leading-relaxed">
                      Diberikan jika jawaban salah, tidak ada kesamaan esensial, hanya menyebutkan salah satu objek, atau menonjolkan perbedaan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabel 3 Official Conversion */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
                <h4 className="font-bold text-base text-gray-900">
                  Tabel 3 Manual IST Resmi (Konversi Poin Butir 0–32 ke Raw Score 0–20)
                </h4>
                <p className="text-xs text-gray-500">
                  Sesuai Halaman 22 Buku Manual Resmi IST (Berlaku seragam untuk seluruh rentang usia).
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse border border-gray-200">
                    <thead className="bg-gray-100 text-gray-700 font-bold">
                      <tr>
                        <th className="border border-gray-200 px-2 py-1.5">Poin Butir (0-32)</th>
                        <th className="border border-gray-200 px-2 py-1.5 bg-purple-50 text-purple-900">RS (0-20)</th>
                        <th className="border border-gray-200 px-2 py-1.5">Poin Butir (0-32)</th>
                        <th className="border border-gray-200 px-2 py-1.5 bg-purple-50 text-purple-900">RS (0-20)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 10 }).map((_, idx) => {
                        const left = GE_TABLE_3_ENTRIES[idx];
                        const right = GE_TABLE_3_ENTRIES[idx + 10];
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-2 py-1.5 font-medium">{left.pointsRange}</td>
                            <td className="border border-gray-200 px-2 py-1.5 font-bold bg-purple-50/50 text-purple-800">
                              {left.rs}
                            </td>
                            <td className="border border-gray-200 px-2 py-1.5 font-medium">{right.pointsRange}</td>
                            <td className="border border-gray-200 px-2 py-1.5 font-bold bg-purple-50/50 text-purple-800">
                              {right.rs}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Kamus Aktif Terhubung Otomatis ke Seluruh Skoring Tabulasi Penilaian</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            Selesai &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
