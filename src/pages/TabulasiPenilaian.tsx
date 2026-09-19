import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calculator, 
  Award, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Zap, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  TrendingUp, 
  Brain, 
  Users, 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft,
  BarChart3, 
  X, 
  FileSpreadsheet, 
  FileText,
  HelpCircle,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  FileEdit,
  SlidersHorizontal,
  Loader2
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { generatePsikogramPdf } from '../utils/psikogramGenerator';
import { 
  scoreParticipant,
  batchSyncParticipantScores, 
  exportTabulasiToExcel, 
  exportTabulasiToPdf, 
  ScoredParticipantResult 
} from '../utils/scoringEngine';
import { SubtestCode } from '../types/ist';
import { NormGuideView } from '../components/NormGuideView';
import { Subtest4GeEvaluatorModal } from '../components/Subtest4GeEvaluatorModal';
import { ManualCorrectionModal } from '../components/ManualCorrectionModal';

interface TabulasiPenilaianProps {
  onSelectParticipant?: (participant: any) => void;
  preselectedEventId?: string;
}

export function TabulasiPenilaian({ onSelectParticipant, preselectedEventId }: TabulasiPenilaianProps) {
  const { data: participantsData, loading: loadingParticipants } = useFirestore('participants');
  const { data: eventsData } = useFirestore('events');

  // Filter states
  const [selectedEventId, setSelectedEventId] = useState<string>(preselectedEventId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'progress' | 'unscored'>('all');
  const [activeTab, setActiveTab] = useState<'ist' | 'non_cognitive'>('ist');
  const [sortField, setSortField] = useState<'iq' | 'nama' | 'nomorTes' | 'totalRaw'>('iq');
  const [sortAsc, setSortAsc] = useState(false);

  // Batch scoring sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: number; error: number } | null>(null);

  // Detail Modal State
  const [inspectParticipant, setInspectParticipant] = useState<ScoredParticipantResult | null>(null);

  // IST Norms Catalog Modal State (Tabel 7 s/d 22)
  const [showNormModal, setShowNormModal] = useState(false);

  // Subtest 4 GE Evaluator & Dictionary Modal State
  const [showGeEvaluatorModal, setShowGeEvaluatorModal] = useState(false);
  const [showManualCorrectionModal, setShowManualCorrectionModal] = useState(false);

  // Floating Bottom Quick-Scroll Bar State
  const [showFloatingScroll, setShowFloatingScroll] = useState(true);
  const [currentScrollLeft, setCurrentScrollLeft] = useState(0);
  const [maxScrollLeft, setMaxScrollLeft] = useState(1000);

  // Loading states for export and sync operations
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [syncingParticipantId, setSyncingParticipantId] = useState<string | null>(null);
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);

  // Event ID to Name Map
  const eventMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (eventsData) {
      eventsData.forEach((evt: any) => {
        map[evt.id] = evt.title || evt.name || evt.id;
        if (evt.slug) map[evt.slug] = evt.title || evt.name || evt.slug;
      });
    }
    return map;
  }, [eventsData]);

  // Score all participants using the Scoring Engine
  const scoredParticipants: ScoredParticipantResult[] = useMemo(() => {
    if (!participantsData || participantsData.length === 0) return [];

    return participantsData
      .filter((p: any) => !p.isDeleted)
      .map((p: any) => {
        return scoreParticipant(p, eventMap);
      });
  }, [participantsData, eventMap]);

  // Filtered and Sorted participants
  const filteredParticipants = useMemo(() => {
    let list = scoredParticipants;

    // 1. Filter by event
    if (selectedEventId !== 'all') {
      list = list.filter((p) => {
        const orig = p.originalParticipant;
        const pEvtId = String(p.eventId || orig.eventId || '');
        const pEvt = String(orig.event || '');
        return (
          pEvtId === selectedEventId ||
          pEvt === selectedEventId ||
          eventMap[pEvtId] === eventMap[selectedEventId]
        );
      });
    }

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) ||
          p.nomorTes.toLowerCase().includes(q) ||
          p.sekolah.toLowerCase().includes(q) ||
          String(p.originalParticipant?.nik || '').includes(q)
      );
    }

    // 3. Filter by status
    if (statusFilter === 'completed') {
      list = list.filter((p) => p.isCompletedAllIST);
    } else if (statusFilter === 'progress') {
      list = list.filter((p) => !p.isCompletedAllIST && p.hasAnswers);
    } else if (statusFilter === 'unscored') {
      list = list.filter((p) => !p.isSyncedToDb);
    }

    // 4. Sort
    return list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'iq') {
        valA = a.totalIQ;
        valB = b.totalIQ;
      }

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [scoredParticipants, selectedEventId, searchQuery, statusFilter, sortField, sortAsc, eventMap]);

  // Aggregate statistics for active view
  const stats = useMemo(() => {
    const total = filteredParticipants.length;
    if (total === 0) {
      return { total: 0, completed: 0, avgIq: 0, ipaCount: 0, ipsCount: 0, seimbangCount: 0, syncedCount: 0 };
    }

    const completed = filteredParticipants.filter((p) => p.isCompletedAllIST).length;
    const syncedCount = filteredParticipants.filter((p) => p.isSyncedToDb).length;
    const validIqParticipants = filteredParticipants.filter((p) => p.hasAnswers || p.totalIQ > 70);
    const avgIq = validIqParticipants.length > 0
      ? Math.round(validIqParticipants.reduce((acc, curr) => acc + curr.totalIQ, 0) / validIqParticipants.length)
      : 100;

    const ipaCount = filteredParticipants.filter((p) => p.streamPreference === 'IPA').length;
    const ipsCount = filteredParticipants.filter((p) => p.streamPreference === 'IPS').length;
    const seimbangCount = filteredParticipants.filter((p) => p.streamPreference === 'Seimbang').length;

    return { total, completed, avgIq, ipaCount, ipsCount, seimbangCount, syncedCount };
  }, [filteredParticipants]);

  // Horizontal Scroll & Navigation Refs for Tabulation Tables
  const istTableRef = useRef<HTMLDivElement>(null);
  const istTopScrollRef = useRef<HTMLDivElement>(null);
  const nonCogTableRef = useRef<HTMLDivElement>(null);
  const nonCogTopScrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const isSyncingScroll = useRef(false);

  // Sync scroll metrics dynamically
  useEffect(() => {
    const updateMetrics = () => {
      const activeRef = activeTab === 'ist' ? istTableRef.current : nonCogTableRef.current;
      if (activeRef) {
        setScrollWidth(activeRef.scrollWidth);
        setMaxScrollLeft(Math.max(1, activeRef.scrollWidth - activeRef.clientWidth));
        setCurrentScrollLeft(activeRef.scrollLeft);
      }
    };
    updateMetrics();
    const timer = setTimeout(updateMetrics, 150);
    window.addEventListener('resize', updateMetrics);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateMetrics);
    };
  }, [filteredParticipants, activeTab]);

  const handleTopScroll = (isIst: boolean) => {
    if (isSyncingScroll.current) return;
    const topEl = isIst ? istTopScrollRef.current : nonCogTopScrollRef.current;
    const tableEl = isIst ? istTableRef.current : nonCogTableRef.current;
    if (topEl && tableEl) {
      isSyncingScroll.current = true;
      tableEl.scrollLeft = topEl.scrollLeft;
      setCurrentScrollLeft(topEl.scrollLeft);
      requestAnimationFrame(() => { isSyncingScroll.current = false; });
    }
  };

  const handleTableScroll = (isIst: boolean) => {
    if (isSyncingScroll.current) return;
    const topEl = isIst ? istTopScrollRef.current : nonCogTopScrollRef.current;
    const tableEl = isIst ? istTableRef.current : nonCogTableRef.current;
    if (topEl && tableEl) {
      isSyncingScroll.current = true;
      topEl.scrollLeft = tableEl.scrollLeft;
      setCurrentScrollLeft(tableEl.scrollLeft);
      requestAnimationFrame(() => { isSyncingScroll.current = false; });
    }
  };

  const scrollToPosition = (left: number) => {
    const activeRef = activeTab === 'ist' ? istTableRef.current : nonCogTableRef.current;
    const topRef = activeTab === 'ist' ? istTopScrollRef.current : nonCogTopScrollRef.current;
    if (activeRef) {
      activeRef.scrollTo({ left, behavior: 'smooth' });
      setCurrentScrollLeft(left);
    }
    if (topRef) {
      topRef.scrollTo({ left, behavior: 'smooth' });
    }
  };

  const scrollByDelta = (delta: number) => {
    const activeRef = activeTab === 'ist' ? istTableRef.current : nonCogTableRef.current;
    const topRef = activeTab === 'ist' ? istTopScrollRef.current : nonCogTopScrollRef.current;
    if (activeRef) {
      activeRef.scrollBy({ left: delta, behavior: 'smooth' });
      setCurrentScrollLeft(activeRef.scrollLeft + delta);
    }
    if (topRef) {
      topRef.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  // Batch sync handler
  const handleBatchSync = async () => {
    if (filteredParticipants.length === 0) {
      alert('Tidak ada data peserta yang dapat diproses pada filter saat ini.');
      return;
    }

    const confirmed = window.confirm(
      `Jalankan Scoring Engine Otomatis untuk ${filteredParticipants.length} peserta?\n\nSistem akan menghitung skor 9 subtes IST, menerapkan konversi Tabel 3 Subtes 4 GE, Standard Score (SW), Total IQ, dan arah peminatan ke database Firebase.`
    );
    if (!confirmed) return;

    try {
      setIsSyncing(true);
      setSyncResult(null);

      const result = await batchSyncParticipantScores(
        filteredParticipants,
        (current, total, name) => {
          setSyncProgress({ current, total, name });
        }
      );

      setSyncResult({ success: result.successCount, error: result.errorCount });
      alert(`Scoring Engine selesai!\n\nBerhasil memproses & menyinkronkan: ${result.successCount} peserta.\nGagal: ${result.errorCount} peserta.`);
    } catch (error: any) {
      console.error(error);
      alert('Terjadi kesalahan saat menjalankan Scoring Engine: ' + (error?.message || error));
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  // Single participant sync handler
  const handleSingleSync = async (participant: ScoredParticipantResult) => {
    setSyncingParticipantId(participant.participantId);
    try {
      const res = await batchSyncParticipantScores([participant]);
      if (res.successCount > 0) {
        alert(`Skor untuk ${participant.nama} berhasil disinkronkan ke database!`);
      } else {
        alert(`Gagal menyimpan skor: ${res.errors.join(', ')}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSyncingParticipantId(null);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const eventName = selectedEventId === 'all' ? 'Semua_Event' : eventMap[selectedEventId] || 'Event';
      exportTabulasiToExcel(filteredParticipants, eventName);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor data ke Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const eventName = selectedEventId === 'all' ? 'Semua Event' : eventMap[selectedEventId] || 'Event';
      exportTabulasiToPdf(filteredParticipants, eventName);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor data ke PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintPsikogram = async (participant: ScoredParticipantResult) => {
    setIsPrintingPdf(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      generatePsikogramPdf(participant);
    } catch (err) {
      console.error(err);
      alert('Gagal mencetak PDF Psikogram');
    } finally {
      setIsPrintingPdf(false);
    }
  };

  const toggleSort = (field: 'iq' | 'nama' | 'nomorTes' | 'totalRaw') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getIqBadgeColor = (iq: number) => {
    if (iq >= 130) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (iq >= 120) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (iq >= 110) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (iq >= 90) return 'bg-slate-100 text-slate-800 border-slate-200';
    if (iq >= 80) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & BADGES */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-[#8BC34A]/10 text-[#8BC34A] rounded-xl">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  Tabulasi Penilaian & Skoring Otomatis
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Engine Aktif
                  </span>
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Tabulasi matriks nilai peserta, skoring otomatis IST 9 subtes (Tabel 3 Konversi GE), estimasi IQ total, dan analisis peminatan.
                </p>
              </div>
            </div>
            {/* Standard Badges */}
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              <button
                type="button"
                onClick={() => setShowNormModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer shadow-xs"
                title="Buka Buku Norma Resmi IST Lengkap (Tabel 7 s/d 22)"
              >
                <BookOpen className="w-3.5 h-3.5 text-white" />
                <span>Buku Norma IST (Tabel 7 - 22)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGeEvaluatorModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold transition cursor-pointer shadow-xs"
                title="Buka Evaluator & Kamus Typo Kunci Jawaban Subtes 4 (GE)"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Evaluator &amp; Kamus GE</span>
              </button>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                <Brain className="w-3.5 h-3.5" />
                Norma Resmi IST-70
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100 font-medium">
                <GraduationCap className="w-3.5 h-3.5" />
                Konversi Tabel 3 Subtes 4 (GE)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Auto-Compute Real-Time
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleBatchSync}
              disabled={isSyncing || filteredParticipants.length === 0}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#8BC34A] hover:bg-[#7CB342] text-white rounded-lg text-sm font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Hitung dan simpan hasil skoring semua peserta ke database"
            >
              <Zap className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Memproses...' : 'Jalankan Scoring Engine'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel || filteredParticipants.length === 0}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Unduh Tabulasi Lengkap ke Excel (.xlsx)"
            >
              {isExportingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>{isExportingExcel ? 'Mengekspor...' : 'Export Excel'}</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf || filteredParticipants.length === 0}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Unduh Tabulasi ke PDF"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? 'Mengekspor...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Peserta</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {stats.total}{' '}
              <span className="text-xs font-medium text-emerald-600">
                ({stats.completed} lengkap)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rata-rata IQ Kelompok</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {stats.avgIq}{' '}
              <span className="text-xs font-medium text-gray-500">
                {stats.avgIq >= 110 ? 'Di Atas Rata-rata' : stats.avgIq >= 90 ? 'Rata-rata' : 'Rata-rata Bawah'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dominasi Peminatan</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {stats.ipaCount >= stats.ipsCount ? 'IPA (Eksakta)' : 'IPS (Sosial)'}
            </div>
            <div className="text-xs text-gray-500">
              IPA: {stats.ipaCount} | IPS: {stats.ipsCount} | Seimbang: {stats.seimbangCount}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Sinkronisasi DB</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {stats.syncedCount} / {stats.total}
            </div>
            <div className="text-xs text-emerald-600 font-medium">
              {stats.syncedCount === stats.total ? 'Semua tersimpan ke DB' : `${stats.total - stats.syncedCount} dihitung realtime`}
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTER CONTROLS & TAB SWITCHER */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Tab Switcher: IST vs Non-Cognitive */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit shrink-0">
            <button
              onClick={() => setActiveTab('ist')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeTab === 'ist'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Matriks IST (9 Subtes)</span>
            </button>
            <button
              onClick={() => setActiveTab('non_cognitive')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeTab === 'non_cognitive'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Tes Pendukung (Gaya Belajar, MBTI, RMIB, PAPI)</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, no peserta, NIK, atau sekolah..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#8BC34A] focus:border-[#8BC34A] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Second row: Event Filter & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-700 uppercase">Event:</span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white text-gray-700 font-medium focus:ring-1 focus:ring-[#8BC34A] focus:outline-none"
              >
                <option value="all">Semua Lintas Event Aktif</option>
                {eventsData &&
                  eventsData.map((evt: any) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title || evt.name || evt.id}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-700 uppercase">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white text-gray-700 font-medium focus:ring-1 focus:ring-[#8BC34A] focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="completed">Lengkap (9 Subtes Selesai)</option>
                <option value="progress">Sedang Pengerjaan (Belum Lengkap)</option>
                <option value="unscored">Belum Tersinkron ke DB</option>
              </select>
            </div>
          </div>

          <div className="text-gray-500 font-medium">
            Menampilkan <span className="font-bold text-gray-900">{filteredParticipants.length}</span> dari {scoredParticipants.length} total peserta
          </div>
        </div>
      </div>

      {/* 4. MAIN TABULATION TABLE */}
      {activeTab === 'ist' ? (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          {/* Quick Subtest Jump & Horizontal Scroll Control Bar */}
          <div className="bg-gray-50/90 border-b border-gray-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-gray-700">
              <span className="font-semibold text-gray-600 flex items-center gap-1.5">
                <span>Lompat Kolom:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => scrollToPosition(0)}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md font-medium transition cursor-pointer shadow-2xs"
                  title="Geser ke No & Nama Peserta"
                >
                  ⏮ Awal
                </button>
                <button
                  type="button"
                  onClick={() => scrollToPosition(260)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-medium transition cursor-pointer shadow-2xs"
                  title="Geser ke Subtes Verbal (SE, WA, AN, GE)"
                >
                  Verbal (SE • WA • AN • GE)
                </button>
                <button
                  type="button"
                  onClick={() => scrollToPosition(660)}
                  className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-medium transition cursor-pointer shadow-2xs"
                  title="Geser ke Subtes Numerik & Spasial (RA, ZR, FA, WU, ME)"
                >
                  Numerik & Spasial (RA • ZR • FA • WU • ME)
                </button>
                <button
                  type="button"
                  onClick={() => scrollToPosition(istTableRef.current?.scrollWidth || 2000)}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md font-bold transition cursor-pointer shadow-2xs"
                  title="Geser ke Total Skor, IQ, & Peminatan"
                >
                  Skor Total & IQ ⏭
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">Geser Tabel:</span>
              <button
                type="button"
                onClick={() => scrollByDelta(-320)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-md text-gray-700 font-medium transition cursor-pointer shadow-2xs"
                title="Geser ke kiri"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[11px]">Kiri</span>
              </button>
              <button
                type="button"
                onClick={() => scrollByDelta(320)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-md text-gray-700 font-medium transition cursor-pointer shadow-2xs"
                title="Geser ke kanan"
              >
                <span className="text-[11px]">Kanan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* DUAL-SYNC TOP HORIZONTAL SCROLLBAR */}
          <div 
            ref={istTopScrollRef} 
            onScroll={() => handleTopScroll(true)}
            className="overflow-x-auto overflow-y-hidden border-b border-gray-200 bg-gray-100/80 custom-horizontal-scrollbar"
            style={{ height: '14px' }}
            title="Batang geser horizontal atas (tersinkronisasi)"
          >
            <div style={{ width: `${scrollWidth}px`, height: '1px' }} />
          </div>

          {/* TABLE CONTAINER - NATURAL HEIGHT (NO INNER VERTICAL SCROLLBAR) */}
          <div 
            ref={istTableRef} 
            onScroll={() => handleTableScroll(true)}
            className="overflow-x-auto overflow-y-hidden custom-horizontal-scrollbar"
          >
            <table className="w-full text-xs text-left text-gray-700 border-collapse">
              <thead className="text-[11px] uppercase bg-gray-50 text-gray-700 sticky top-0 z-20 border-b border-gray-200 shadow-xs">
                <tr>
                  <th className="sticky left-0 top-0 z-30 bg-gray-50 py-3 px-3 text-center w-12 min-w-[48px] max-w-[48px] font-bold border-r border-gray-200">No</th>
                  <th className="sticky left-[48px] top-0 z-30 bg-gray-50 py-3 px-3 w-32 min-w-[128px] max-w-[128px] font-bold border-r border-gray-200 cursor-pointer" onClick={() => toggleSort('nomorTes')}>
                    <div className="flex items-center gap-1">
                      No. Peserta
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="sticky left-[176px] top-0 z-30 bg-gray-50 py-3 px-3 min-w-[180px] max-w-[220px] font-bold border-r-2 border-gray-300 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)] cursor-pointer" onClick={() => toggleSort('nama')}>
                    <div className="flex items-center gap-1">
                      Nama Peserta
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 min-w-[140px] font-bold border-r border-gray-200">Sekolah / PT</th>
                  <th className="py-3 px-3 text-center min-w-[100px] font-bold border-r border-gray-200">Status</th>
                  
                  {/* 9 IST Subtests Columns */}
                  <th className="py-3 px-2 text-center w-14 border-r border-gray-200" title="Subtes 1: SE (Melengkapi Kalimat) - Max 20">
                    <div className="font-bold">SE</div>
                    <div className="text-[9px] text-gray-500 font-normal">RS/SW</div>
                  </th>
                  <th className="py-3 px-2 text-center w-14 border-r border-gray-200" title="Subtes 2: WA (Persamaan Kata) - Max 20">
                    <div className="font-bold">WA</div>
                    <div className="text-[9px] text-gray-500 font-normal">RS/SW</div>
                  </th>
                  <th className="py-3 px-2 text-center w-14 border-r border-gray-200" title="Subtes 3: AN (Analogi Kata) - Max 20">
                    <div className="font-bold">AN</div>
                    <div className="text-[9px] text-gray-500 font-normal">RS/SW</div>
                  </th>
                  <th className="py-3 px-2 text-center min-w-[70px] bg-purple-50/70 border-r border-purple-200" title="Subtes 4: GE (Sifat yang Sama) - Dikonversi Tabel 3 ke RS (0-20)">
                    <div className="font-bold text-purple-900">GE*</div>
                    <div className="text-[9px] text-purple-700 font-normal">Tabel 3</div>
                  </th>
                  <th className="py-3 px-2 text-center w-14 border-r border-gray-200" title="Subtes 5: RA (Hitungan) - Max 20">
                    <div className="font-bold">RA</div>
                    <div className="text-[9px] text-gray-500 font-normal">RS/SW</div>
                  </th>
                  <th className="py-3 px-2 text-center w-14 border-r border-gray-200" title="Subtes 6: ZR (Deret Angka) - Max 20">
                    <div className="font-bold">ZR</div>
                    <div className="text-[9px] text-gray-500 font-normal">RS/SW</div>
                  </th>
                  <th className="py-3 px-2 text-center w-14 border-r border-gray-200" title="Subtes 7: FA (Menyusun Bentuk) - Max 20">
                    <div className="font-bold">FA</div>
                    <div className="text-[9px] text-gray-500 font-normal">RS/SW</div>
                  </th>
                  <th className="py-3 px-2 text-center w-14 border-r border-gray-200" title="Subtes 8: WU (Kubus) - Max 20">
                    <div className="font-bold">WU</div>
                    <div className="text-[9px] text-gray-500 font-normal">RS/SW</div>
                  </th>
                  <th className="py-3 px-2 text-center w-14 border-r border-gray-200" title="Subtes 9: ME (Mengingat Kata) - Max 20">
                    <div className="font-bold">ME</div>
                    <div className="text-[9px] text-gray-500 font-normal">RS/SW</div>
                  </th>

                  {/* Summary Totals & IQ */}
                  <th className="py-3 px-2.5 text-center min-w-[75px] font-bold border-r border-gray-200 cursor-pointer" onClick={() => toggleSort('totalRaw')}>
                    <div className="flex items-center justify-center gap-1">
                      RS Tot
                      <ArrowUpDown className="w-2.5 h-2.5 text-gray-400" />
                    </div>
                    <div className="text-[9px] text-gray-500 font-normal">/ 180</div>
                  </th>
                  <th className="py-3 px-2.5 text-center min-w-[65px] font-bold border-r border-gray-200">
                    <div>SW Tot</div>
                  </th>
                  <th className="py-3 px-3 text-center min-w-[85px] font-bold bg-emerald-50/70 border-r border-emerald-200 cursor-pointer" onClick={() => toggleSort('iq')}>
                    <div className="flex items-center justify-center gap-1 text-emerald-900 font-extrabold">
                      IQ TOTAL
                      <ArrowUpDown className="w-3 h-3 text-emerald-600" />
                    </div>
                  </th>
                  <th className="py-3 px-3 min-w-[150px] font-bold border-r border-gray-200">Klasifikasi IQ</th>
                  <th className="py-3 px-3 text-center min-w-[100px] font-bold border-r border-gray-200">Peminatan</th>
                  <th className="py-3 px-3 text-center min-w-[110px] font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={20} className="py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                        <p className="font-semibold text-sm">Tidak ada data peserta yang cocok.</p>
                        <p className="text-xs text-gray-400">Silakan sesuaikan filter event atau kata kunci pencarian Anda.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p, idx) => {
                    const swMap: Record<string, number> = {};
                    const rwMap: Record<string, number> = {};
                    p.subtestDetails.forEach((s) => {
                      swMap[s.code] = s.ss;
                      rwMap[s.code] = s.rw;
                    });

                    return (
                      <tr key={p.participantId || idx} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 py-2.5 px-3 text-center text-gray-500 font-medium border-r border-gray-100 w-12 min-w-[48px] max-w-[48px]">
                          {idx + 1}
                        </td>
                        <td className="sticky left-[48px] z-10 bg-white group-hover:bg-gray-50 py-2.5 px-3 font-mono font-medium text-gray-900 border-r border-gray-100 whitespace-nowrap w-32 min-w-[128px] max-w-[128px]">
                          {p.nomorTes}
                        </td>
                        <td className="sticky left-[176px] z-10 bg-white group-hover:bg-gray-50 py-2.5 px-3 border-r-2 border-gray-300 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)] min-w-[180px] max-w-[220px]">
                          <div className="font-semibold text-gray-900 truncate">{p.nama}</div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-1.5 flex-wrap">
                            <span>{p.gender === 'Pria' || p.gender === 'L' ? 'L' : 'P'}</span>
                            <span>•</span>
                            <span>{p.usia}</span>
                            {p.normApplied && (
                              <span
                                className="text-[9px] px-1 py-0.2 rounded bg-blue-50 text-blue-700 font-mono font-medium"
                                title={p.normApplied}
                              >
                                {p.normApplied.split('.')[0] || 'Norma'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 border-r border-gray-100 max-w-[180px] truncate" title={p.sekolah}>
                          {p.sekolah}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-gray-100">
                          {p.isCompletedAllIST ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              9/9 Selesai
                            </span>
                          ) : p.completedCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              {p.completedCount}/9 Subtes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                              Belum Tes
                            </span>
                          )}
                        </td>

                        {/* 9 IST Subtests */}
                        {(['SE', 'WA', 'AN'] as SubtestCode[]).map((code) => (
                          <td key={code} className="py-2.5 px-1.5 text-center border-r border-gray-100">
                            <span className="font-bold text-gray-900">{rwMap[code] ?? 0}</span>
                            <span className="text-[10px] text-gray-400 block">{swMap[code] ?? '-'}</span>
                          </td>
                        ))}

                        {/* GE with Table 3 indication */}
                        <td className="py-2.5 px-1.5 text-center bg-purple-50/40 border-r border-purple-100" title={`Subtes 4 GE: Poin Butir Asli: ${p.geTotalPoints}, RS Konversi Tabel 3: ${rwMap['GE']}`}>
                          <span className="font-bold text-purple-900">{rwMap['GE'] ?? 0}</span>
                          {p.geTotalPoints > 0 && (
                            <span className="text-[9px] text-purple-600 block">({p.geTotalPoints}p)</span>
                          )}
                          <span className="text-[10px] text-gray-400 block">{swMap['GE'] ?? '-'}</span>
                        </td>

                        {(['RA', 'ZR', 'FA', 'WU', 'ME'] as SubtestCode[]).map((code) => (
                          <td key={code} className="py-2.5 px-1.5 text-center border-r border-gray-100">
                            <span className="font-bold text-gray-900">{rwMap[code] ?? 0}</span>
                            <span className="text-[10px] text-gray-400 block">{swMap[code] ?? '-'}</span>
                          </td>
                        ))}

                        {/* Total RS */}
                        <td className="py-2.5 px-2.5 text-center font-bold text-gray-900 border-r border-gray-100 bg-gray-50/50">
                          {p.totalRaw}
                        </td>
                        {/* Total SW */}
                        <td className="py-2.5 px-2.5 text-center font-bold text-gray-700 border-r border-gray-100 bg-gray-50/50">
                          {p.totalSS}
                        </td>
                        {/* IQ Total */}
                        <td className="py-2.5 px-3 text-center border-r border-emerald-100 bg-emerald-50/40">
                          <span className={`inline-block px-2.5 py-1 rounded-md font-extrabold text-sm border shadow-2xs ${getIqBadgeColor(p.totalIQ)}`}>
                            {p.totalIQ}
                          </span>
                        </td>
                        {/* IQ Category */}
                        <td className="py-2.5 px-3 border-r border-gray-100 whitespace-nowrap">
                          <span className="font-medium text-gray-800 text-xs">{p.iqCategory}</span>
                        </td>
                        {/* Peminatan */}
                        <td className="py-2.5 px-3 text-center border-r border-gray-100">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              p.streamPreference === 'IPA'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : p.streamPreference === 'IPS'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {p.streamPreference}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => setInspectParticipant(p)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                              title="Lihat Psikogram & Butir"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {onSelectParticipant && (
                              <button
                                onClick={() => onSelectParticipant(p.originalParticipant)}
                                className="p-1.5 text-[#8BC34A] hover:bg-lime-50 rounded-md transition cursor-pointer"
                                title="Buka Rapor Lengkap Peserta"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}

                            {!p.isSyncedToDb && (
                              <button
                                onClick={() => handleSingleSync(p)}
                                disabled={syncingParticipantId === p.participantId}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition cursor-pointer disabled:opacity-50"
                                title="Simpan skor hasil hitungan ke database"
                              >
                                {syncingParticipantId === p.participantId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Zap className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* NON-COGNITIVE TESTS TAB (Gaya Belajar, MBTI, RMIB, PAPI) */
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          {/* Quick Subtest Jump & Horizontal Scroll Control Bar */}
          <div className="bg-gray-50/90 border-b border-gray-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-gray-700">
              <span className="font-semibold text-gray-600 flex items-center gap-1.5">
                <span>Lompat Kolom:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => scrollToPosition(0)}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md font-medium transition cursor-pointer shadow-2xs"
                  title="Geser ke No & Nama Peserta"
                >
                  ⏮ Awal
                </button>
                <button
                  type="button"
                  onClick={() => scrollToPosition(260)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-medium transition cursor-pointer shadow-2xs"
                  title="Geser ke Gaya Belajar (V, A, K)"
                >
                  Gaya Belajar (V • A • K)
                </button>
                <button
                  type="button"
                  onClick={() => scrollToPosition(520)}
                  className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-medium transition cursor-pointer shadow-2xs"
                  title="Geser ke MBTI & PAPI Kostick"
                >
                  MBTI & PAPI Kostick
                </button>
                <button
                  type="button"
                  onClick={() => scrollToPosition(nonCogTableRef.current?.scrollWidth || 2000)}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-md font-bold transition cursor-pointer shadow-2xs"
                  title="Geser ke Minat RMIB"
                >
                  Minat RMIB (Top 1-3) ⏭
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">Geser Tabel:</span>
              <button
                type="button"
                onClick={() => scrollByDelta(-320)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-md text-gray-700 font-medium transition cursor-pointer shadow-2xs"
                title="Geser ke kiri"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[11px]">Kiri</span>
              </button>
              <button
                type="button"
                onClick={() => scrollByDelta(320)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-md text-gray-700 font-medium transition cursor-pointer shadow-2xs"
                title="Geser ke kanan"
              >
                <span className="text-[11px]">Kanan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* DUAL-SYNC TOP HORIZONTAL SCROLLBAR */}
          <div 
            ref={nonCogTopScrollRef} 
            onScroll={() => handleTopScroll(false)}
            className="overflow-x-auto overflow-y-hidden border-b border-gray-200 bg-gray-100/80 custom-horizontal-scrollbar"
            style={{ height: '14px' }}
            title="Batang geser horizontal atas (tersinkronisasi)"
          >
            <div style={{ width: `${scrollWidth}px`, height: '1px' }} />
          </div>

          {/* TABLE CONTAINER - NATURAL HEIGHT (NO INNER VERTICAL SCROLLBAR) */}
          <div 
            ref={nonCogTableRef} 
            onScroll={() => handleTableScroll(false)}
            className="overflow-x-auto overflow-y-hidden custom-horizontal-scrollbar"
          >
            <table className="w-full text-xs text-left text-gray-700 border-collapse">
              <thead className="text-[11px] uppercase bg-gray-50 text-gray-700 sticky top-0 z-20 border-b border-gray-200 shadow-xs">
                <tr>
                  <th className="sticky left-0 top-0 z-30 bg-gray-50 py-3 px-3 text-center w-12 min-w-[48px] max-w-[48px] font-bold border-r border-gray-200">No</th>
                  <th className="sticky left-[48px] top-0 z-30 bg-gray-50 py-3 px-3 w-32 min-w-[128px] max-w-[128px] font-bold border-r border-gray-200">No. Peserta</th>
                  <th className="sticky left-[176px] top-0 z-30 bg-gray-50 py-3 px-3 min-w-[180px] max-w-[220px] font-bold border-r-2 border-gray-300 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)]">Nama Peserta</th>
                  <th className="py-3 px-3 min-w-[140px] font-bold border-r border-gray-200">Event</th>
                  
                  {/* Gaya Belajar */}
                  <th className="py-3 px-3 min-w-[180px] bg-blue-50/60 font-bold border-r border-blue-200 text-blue-900">
                    Gaya Belajar (V / A / K)
                  </th>
                  <th className="py-3 px-3 min-w-[120px] bg-blue-50/60 font-bold border-r border-blue-200 text-blue-900 text-center">
                    Dominan
                  </th>

                  {/* MBTI */}
                  <th className="py-3 px-3 min-w-[130px] font-bold border-r border-gray-200">MBTI</th>

                  {/* PAPI Kostick */}
                  <th className="py-3 px-3 min-w-[160px] font-bold border-r border-gray-200">PAPI Kostick</th>

                  {/* RMIB */}
                  <th className="py-3 px-3 min-w-[180px] font-bold border-r border-gray-200">Minat RMIB (Top 1-3)</th>

                  <th className="py-3 px-3 text-center min-w-[80px] font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-500">
                      Tidak ada data peserta yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p, idx) => (
                    <tr key={p.participantId || idx} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 py-2.5 px-3 text-center text-gray-500 font-medium border-r border-gray-100 w-12 min-w-[48px] max-w-[48px]">
                        {idx + 1}
                      </td>
                      <td className="sticky left-[48px] z-10 bg-white group-hover:bg-gray-50 py-2.5 px-3 font-mono font-medium text-gray-900 border-r border-gray-100 whitespace-nowrap w-32 min-w-[128px] max-w-[128px]">
                        {p.nomorTes}
                      </td>
                      <td className="sticky left-[176px] z-10 bg-white group-hover:bg-gray-50 py-2.5 px-3 border-r-2 border-gray-300 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)] min-w-[180px] max-w-[220px]">
                        <div className="font-semibold text-gray-900 truncate">{p.nama}</div>
                        <div className="text-[10px] text-gray-500">{p.sekolah}</div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 border-r border-gray-100">
                        {p.eventName}
                      </td>

                      {/* Gaya Belajar Scores */}
                      <td className="py-2.5 px-3 bg-blue-50/30 border-r border-blue-100">
                        {p.gayaBelajar ? (
                          <div className="flex items-center space-x-2 text-[11px]">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                              V: {p.gayaBelajar.visual}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              A: {p.gayaBelajar.auditori}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                              K: {p.gayaBelajar.kinestetik}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Belum Mengikuti</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center bg-blue-50/30 border-r border-blue-100">
                        {p.gayaBelajar?.dominant && p.gayaBelajar.dominant !== '-' ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                            {p.gayaBelajar.dominant}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* MBTI */}
                      <td className="py-2.5 px-3 border-r border-gray-100">
                        {p.mbti ? (
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px]">
                              {p.mbti.type}
                            </span>
                            <div className="text-[10px] text-gray-500 mt-0.5">{p.mbti.role}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Belum Mengikuti</span>
                        )}
                      </td>

                      {/* PAPI Kostick */}
                      <td className="py-2.5 px-3 border-r border-gray-100">
                        {p.papi ? (
                          <div>
                            <div className="font-semibold text-gray-800">{p.papi.profile}</div>
                            <div className="text-[10px] text-gray-500">{p.papi.focus}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Belum Mengikuti</span>
                        )}
                      </td>

                      {/* RMIB */}
                      <td className="py-2.5 px-3 border-r border-gray-100">
                        {p.rmib ? (
                          <div className="space-y-0.5 text-[10px]">
                            <div>1. <span className="font-semibold text-gray-800">{p.rmib.top1}</span></div>
                            <div>2. <span>{p.rmib.top2}</span></div>
                            <div>3. <span>{p.rmib.top3}</span></div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Belum Mengikuti</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 px-3 text-center">
                        {onSelectParticipant && (
                          <button
                            onClick={() => onSelectParticipant(p.originalParticipant)}
                            className="p-1.5 text-[#8BC34A] hover:bg-lime-50 rounded-md transition cursor-pointer"
                            title="Buka Detail Peserta"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODAL DETAIL SKOR & PSIKOGRAM */}
      {inspectParticipant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    {inspectParticipant.nama}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getIqBadgeColor(inspectParticipant.totalIQ)}`}>
                      IQ {inspectParticipant.totalIQ}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    {inspectParticipant.nomorTes} • {inspectParticipant.sekolah} • Peminatan {inspectParticipant.streamPreference}
                  </p>
                </div>
              </div>
                                          <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintPsikogram(inspectParticipant)}
                  disabled={isPrintingPdf}
                  className="px-3 py-1.5 text-sm font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg flex items-center gap-2 disabled:opacity-50"
                  title="Unduh PDF Psikogram"
                >
                  {isPrintingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isPrintingPdf ? 'Menyiapkan...' : 'Cetak PDF'}</span>
                </button>
                <button
                  onClick={() => setShowManualCorrectionModal(true)}
                  className="px-3 py-1.5 text-sm font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg flex items-center gap-2"
                  title="Panel Koreksi Manual"
                >
                  <FileEdit className="w-4 h-4" />
                  <span className="hidden sm:inline">Koreksi Manual</span>
                </button>
                <button
                  onClick={() => setInspectParticipant(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Summary Cards in Modal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] uppercase text-gray-500 font-semibold">Skor Mentah Total</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{inspectParticipant.totalRaw} <span className="text-xs text-gray-500">/ 180</span></div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] uppercase text-gray-500 font-semibold">Standard Score</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{inspectParticipant.totalSS}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-[10px] uppercase text-emerald-700 font-semibold">Estimasi IQ IST</div>
                  <div className="text-xl font-extrabold text-emerald-800 mt-1">{inspectParticipant.totalIQ}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="text-[10px] uppercase text-purple-700 font-semibold">Peminatan</div>
                  <div className="text-xl font-bold text-purple-800 mt-1">{inspectParticipant.streamPreference}</div>
                </div>
              </div>

              {/* 9 Subtest Breakdown */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  Rincian 9 Subtes IST (Norma Standar & Konversi Tabel 3)
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3">Kode</th>
                        <th className="py-2 px-3">Nama Subtes</th>
                        <th className="py-2 px-3 text-center">RS (Mentah)</th>
                        <th className="py-2 px-3 text-center">SW (Standar)</th>
                        <th className="py-2 px-3 text-center">IQ Subtes</th>
                        <th className="py-2 px-3">Kategori Kemampuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inspectParticipant.subtestDetails.map((sub) => {
                        const isGE = sub.code === 'GE';
                        return (
                          <tr key={sub.code} className={isGE ? 'bg-purple-50/40' : ''}>
                            <td className="py-2 px-3 font-bold font-mono text-gray-900">
                              {sub.code}
                              {isGE && <span className="ml-1 text-purple-700">*</span>}
                            </td>
                            <td className="py-2 px-3 text-gray-800">
                              {sub.name}
                              {isGE && inspectParticipant.geTotalPoints > 0 && (
                                <span className="block text-[10px] text-purple-700">
                                  Poin butir: {inspectParticipant.geTotalPoints} (Dikonversi Tabel 3 ke RS: {sub.rw})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-gray-900">
                              {sub.rw}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-600">
                              {sub.ss}
                            </td>
                            <td className="py-2 px-3 text-center font-semibold text-emerald-700">
                              {sub.iq}
                            </td>
                            <td className="py-2 px-3 text-gray-700 font-medium">
                              {sub.category}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="text-[11px] text-gray-500 mt-2 italic">
                  * Catatan: Subtes 4 (GE) dinilai berdasarkan pembobotan butir 0-2 (total poin 0-32), kemudian dikonversi ke RS (0-20) sesuai Tabel 3 Norma IST Resmi.
                </div>
              </div>

              {/* Stream Analysis Description */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h5 className="font-bold text-xs uppercase text-gray-700 mb-1.5">Deskripsi Potensi & Penjurusan</h5>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {inspectParticipant.streamDescription}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Status DB: {inspectParticipant.isSyncedToDb ? '✅ Sudah tersimpan di Firestore' : '⚠️ Terhitung di memori'}
              </span>
              <div className="flex items-center space-x-2">
                {!inspectParticipant.isSyncedToDb && (
                  <button
                    onClick={() => {
                      handleSingleSync(inspectParticipant);
                      setInspectParticipant(null);
                    }}
                    className="px-4 py-2 bg-[#8BC34A] hover:bg-[#7CB342] text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Simpan Skor ke DB
                  </button>
                )}
                {onSelectParticipant && (
                  <button
                    onClick={() => {
                      onSelectParticipant(inspectParticipant.originalParticipant);
                      setInspectParticipant(null);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Buka Rapor Lengkap
                  </button>
                )}
                <button
                  onClick={() => setInspectParticipant(null)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. BATCH SYNC PROGRESS MODAL */}
      {isSyncing && syncProgress && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#8BC34A]/20 text-[#8BC34A] mx-auto flex items-center justify-center animate-bounce">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Scoring Engine Sedang Berjalan...</h3>
              <p className="text-xs text-gray-500 mt-1">
                Menghitung skor dan menyinkronkan ke database peserta
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-gray-600">
                <span className="truncate max-w-[200px]">{syncProgress.name}</span>
                <span>{syncProgress.current} / {syncProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#8BC34A] h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((syncProgress.current / syncProgress.total) * 100)}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-400">Mohon jangan menutup halaman ini hingga proses selesai.</p>
          </div>
        </div>
      )}

      {/* 7. FLOATING BOTTOM HORIZONTAL NAVIGATION & QUICK-SCROLL BAR */}
      {filteredParticipants.length > 0 && showFloatingScroll && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[94vw] bg-white/95 backdrop-blur-md border border-gray-300 shadow-2xl rounded-2xl p-2.5 sm:px-4 sm:py-3 transition-all animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Left: Indicator & Quick Jumps */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-700 hidden sm:inline-flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#8BC34A]" />
                <span>Geser Cepat:</span>
              </span>

              {activeTab === 'ist' ? (
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => scrollToPosition(0)}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md font-medium transition cursor-pointer"
                    title="Geser ke No & Nama Peserta"
                  >
                    ⏮ Awal
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToPosition(260)}
                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium transition cursor-pointer"
                    title="Geser ke Subtes Verbal (SE, WA, AN, GE)"
                  >
                    Verbal
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToPosition(660)}
                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md font-medium transition cursor-pointer"
                    title="Geser ke Subtes Numerik & Spasial (RA, ZR, FA, WU, ME)"
                  >
                    Numerik & Spasial
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToPosition(istTableRef.current?.scrollWidth || 2000)}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md font-bold transition cursor-pointer"
                    title="Geser ke Total Skor, IQ, & Peminatan"
                  >
                    Total & IQ ⏭
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => scrollToPosition(0)}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md font-medium transition cursor-pointer"
                  >
                    ⏮ Awal
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToPosition(200)}
                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium transition cursor-pointer"
                  >
                    Gaya Belajar
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToPosition(500)}
                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md font-medium transition cursor-pointer"
                  >
                    MBTI
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToPosition(800)}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md font-medium transition cursor-pointer"
                  >
                    Papi Kostick
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToPosition(1200)}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md font-medium transition cursor-pointer"
                  >
                    RMIB ⏭
                  </button>
                </div>
              )}
            </div>

            {/* Center: Live Scroll Slider */}
            <div className="flex items-center gap-2 flex-1 max-w-xs min-w-[140px] px-2">
              <button
                type="button"
                onClick={() => scrollByDelta(-240)}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 transition cursor-pointer"
                title="Geser sedikit ke kiri"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={0}
                max={maxScrollLeft}
                value={currentScrollLeft}
                onChange={(e) => scrollToPosition(Number(e.target.value))}
                className="w-full accent-[#8BC34A] cursor-pointer h-2 bg-gray-200 rounded-lg"
                title="Geser tabel secara horizontal"
              />
              <button
                type="button"
                onClick={() => scrollByDelta(240)}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 transition cursor-pointer"
                title="Geser sedikit ke kanan"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Quick Tools & Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNormModal(true)}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-medium transition cursor-pointer"
                title="Lihat Buku Norma IST Lengkap"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Norma IST</span>
              </button>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition cursor-pointer"
                title="Kembali ke atas halaman"
              >
                Top ⬆
              </button>
              <button
                type="button"
                onClick={() => setShowFloatingScroll(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition cursor-pointer"
                title="Tutup bilah geser melayang ini"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle re-open if closed */}
      {!showFloatingScroll && filteredParticipants.length > 0 && (
        <button
          type="button"
          onClick={() => setShowFloatingScroll(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-full shadow-lg hover:bg-black text-xs font-semibold transition cursor-pointer"
          title="Buka kembali bilah kontrol geser tabel"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#8BC34A]" />
          <span>Navigasi Kolom</span>
        </button>
      )}

      {/* 8. MODAL: BUKU NORMA RESMI IST (TABEL 7 - 22) */}
      {showNormModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Buku Norma Resmi IST Lengkap (Tabel 7 s/d 22)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Katalog tabel norma usia (12 s/d 60 tahun), konversi Gesamt IQ, dan Tabel 22 Wechsler universal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNormModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
              <NormGuideView />
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: EVALUATOR & KAMUS SUBTES 4 (GE) */}
      <Subtest4GeEvaluatorModal
        isOpen={showGeEvaluatorModal}
        onClose={() => setShowGeEvaluatorModal(false)}
      />

      {/* 10. MODAL: MANUAL CORRECTION */}
      {inspectParticipant && (
        <ManualCorrectionModal
          isOpen={showManualCorrectionModal}
          onClose={() => setShowManualCorrectionModal(false)}
          participant={inspectParticipant}
        />
      )}
    </div>
  );
}

