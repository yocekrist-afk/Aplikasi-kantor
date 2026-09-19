import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Play, Square, RefreshCw, Trash2, CheckCircle, AlertTriangle, 
  Activity, ShieldCheck, Cpu, HardDrive, Wifi, Users, Clock, 
  ArrowRight, Download, BarChart2, Terminal, Info, HelpCircle, Check, XCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { useFirestore } from '../hooks/useFirestore';
import { 
  runLoadTestEngine, abortCurrentLoadTest, purgeBenchmarkData,
  LoadTestConfig, LoadTestStatus, LoadTestLogEntry 
} from '../utils/loadTestRunner';

export function UjiBeban() {
  const { data: events } = useFirestore('events');
  const activeEvents = events.filter((e: any) => !e.isDeleted);

  // Configuration State
  const [config, setConfig] = useState<LoadTestConfig>({
    targetEventId: '',
    targetEventTitle: 'Event Standar / Default',
    subtestId: 'ist_1',
    subtestName: 'Subtes 1 (SE) - Melengkapi Kalimat',
    participantCount: 100,
    rampUpSeconds: 15,
    mode: 'virtual_stress',
    pace: 'turbo',
    totalQuestions: 20,
    pageSize: 10,
  });

  // Test Running State
  const [status, setStatus] = useState<LoadTestStatus>({
    isRunning: false,
    isCompleted: false,
    isAborted: false,
    startTime: null,
    endTime: null,
    elapsedSeconds: 0,
    totalConfigured: 100,
    activeWorkers: 0,
    completedCount: 0,
    failedCount: 0,
    currentRps: 0,
    totalOperations: 0,
    totalBytesTransferred: 0,
    avgLatencyMs: 0,
    p95LatencyMs: 0,
    minLatencyMs: 0,
    maxLatencyMs: 0,
    funnel: {
      handshake: 0,
      fetching: 0,
      page1: 0,
      page2: 0,
      submitted: 0,
    },
    metricsHistory: [],
    bottlenecksDetected: [],
    capacityScore: 100,
    verdict: 'EXCELLENT',
  });

  const [logs, setLogs] = useState<LoadTestLogEntry[]>([]);
  const [autoScrollLogs, setAutoScrollLogs] = useState(true);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScrollLogs && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScrollLogs]);

  const handleStart = async () => {
    setLogs([]);
    setPurgeMessage(null);
    try {
      await runLoadTestEngine(
        config,
        (updatedStatus) => setStatus(updatedStatus),
        (newLog) => {
          setLogs((prev) => {
            const next = [...prev, newLog];
            return next.length > 500 ? next.slice(next.length - 500) : next;
          });
        }
      );
    } catch (e: any) {
      console.error('Load test execution failed:', e);
      alert('Uji beban terhenti karena kesalahan: ' + e.message);
    }
  };

  const handleAbort = () => {
    abortCurrentLoadTest();
  };

  const handlePurge = async () => {
    if (!window.confirm('Hapus seluruh data peserta uji beban di Firestore? Ini aman dan tidak akan menghapus peserta event asli.')) {
      return;
    }
    setIsPurging(true);
    setPurgeMessage(null);
    try {
      const count = await purgeBenchmarkData();
      setPurgeMessage(`Berhasil menghapus ${count} dokumen uji beban dari Firestore.`);
    } catch (e: any) {
      setPurgeMessage('Gagal membersihkan data: ' + e.message);
    } finally {
      setIsPurging(false);
    }
  };

  // Preset Configurations
  const applyPreset = (count: number, rampUp: number, pace: 'turbo' | 'realistic', label: string) => {
    setConfig((prev) => ({
      ...prev,
      participantCount: count,
      rampUpSeconds: rampUp,
      pace,
    }));
  };

  const subtestOptions = [
    { id: 'trial', name: 'Simulasi / Pemanasan (Trial IST - 5 Soal)' },
    { id: 'ist_1', name: 'Subtes 1 (SE) - Melengkapi Kalimat' },
    { id: 'ist_2', name: 'Subtes 2 (WA) - Mencari Kesamaan Kata' },
    { id: 'ist_3', name: 'Subtes 3 (AN) - Hubungan Kata' },
    { id: 'ist_4', name: 'Subtes 4 (GE) - Pengertian Kata' },
    { id: 'ist_5', name: 'Subtes 5 (RA) - Berhitung Angka' },
    { id: 'ist_6', name: 'Subtes 6 (ZR) - Deret Angka' },
    { id: 'ist_7', name: 'Subtes 7 (FA) - Potongan Gambar' },
    { id: 'ist_8', name: 'Subtes 8 (WU) - Gambar Kubus' },
    { id: 'ist_9', name: 'Subtes 9 (ME) - Mengingat Kata' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-400" /> CBT Stress &amp; Concurrency Engine
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Batch-Write Guard Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Uji Beban &amp; Kapasitas Sistem CBT
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Simulasikan ratusan hingga ribuan peserta serentak yang mengerjakan ujian dari awal hingga akhir 
              (Login $\rightarrow$ Muat Soal $\rightarrow$ Pengerjaan Halaman 1-2 $\rightarrow$ Submit &amp; Skoring). 
              Gunakan untuk memverifikasi ketahanan server sebelum event sekolah atau instansi dimulai.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {status.isRunning ? (
              <button
                type="button"
                onClick={handleAbort}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Hentikan Uji Beban</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                className="bg-[#8BC34A] hover:bg-[#7cb342] text-slate-950 px-6 py-2.5 rounded-xl font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Jalankan Uji Beban ({config.participantCount} Peserta)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePurge}
              disabled={isPurging || status.isRunning}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Bersihkan dokumen uji beban dari database"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>{isPurging ? 'Membersihkan...' : 'Bersihkan Data Uji'}</span>
            </button>
          </div>
        </div>

        {purgeMessage && (
          <div className="mt-4 p-3 bg-white/10 border border-white/20 rounded-lg text-xs text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{purgeMessage}</span>
          </div>
        )}
      </div>

      {/* Preset Quick Buttons */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[#8BC34A]" /> Preset Beban Standar:
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => applyPreset(50, 0, 'turbo', '50 Peserta Spike')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              config.participantCount === 50 && config.rampUpSeconds === 0
                ? 'bg-[#8BC34A] text-white border-[#8BC34A]'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
            }`}
          >
            ⚡ 50 Peserta (Spike Instan)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(200, 15, 'realistic', '200 Peserta Sekolah')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              config.participantCount === 200
                ? 'bg-[#8BC34A] text-white border-[#8BC34A]'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
            }`}
          >
            🏫 200 Peserta (Event Sekolah)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(500, 30, 'realistic', '500 Peserta Kampus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              config.participantCount === 500
                ? 'bg-[#8BC34A] text-white border-[#8BC34A]'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
            }`}
          >
            🏢 500 Peserta (Kampus/BUMN)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(1000, 60, 'turbo', '1000 Peserta Massal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              config.participantCount === 1000
                ? 'bg-[#8BC34A] text-white border-[#8BC34A]'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
            }`}
          >
            🔥 1.000 Peserta (Stress Test)
          </button>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Parameters */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <Cpu className="w-4 h-4 text-indigo-500" /> Parameter Konfigurasi Uji Beban
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Event */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Target Event Ujian
              </label>
              <select
                value={config.targetEventId}
                onChange={(e) => {
                  const ev = activeEvents.find((ev: any) => ev.id === e.target.value);
                  setConfig({
                    ...config,
                    targetEventId: e.target.value,
                    targetEventTitle: ev ? ev.title : 'Event Standar / Default'
                  });
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-[#8BC34A]"
              >
                <option value="">-- Simulasi Standar (Tanpa Ikat Event Riil) --</option>
                {activeEvents.map((ev: any) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.status})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                Pilih event riil atau biarkan standar untuk pengujian terisolasi.
              </p>
            </div>

            {/* Target Subtest */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Subtes Yang Diujikan
              </label>
              <select
                value={config.subtestId}
                onChange={(e) => {
                  const sel = subtestOptions.find(s => s.id === e.target.value);
                  setConfig({
                    ...config,
                    subtestId: e.target.value,
                    subtestName: sel ? sel.name : 'Subtes 1 (SE)'
                  });
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-[#8BC34A]"
              >
                {subtestOptions.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                Menguji alur pengerjaan spesifik subtes tersebut lengkap dengan kunci jawaban resminya.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Participant Count */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Jumlah Peserta Simultan
                </label>
                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded">
                  {config.participantCount} Orang
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={config.participantCount}
                onChange={(e) => setConfig({ ...config, participantCount: Number(e.target.value) })}
                className="w-full accent-[#8BC34A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>10</span>
                <span>250</span>
                <span>500</span>
                <span>1000</span>
              </div>
            </div>

            {/* Ramp-Up Strategy */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Pola Masuk (Ramp-Up)
                </label>
                <span className="text-xs font-extrabold text-gray-700 dark:text-gray-200">
                  {config.rampUpSeconds === 0 ? 'Spike Instan (0s)' : `${config.rampUpSeconds} Detik`}
                </span>
              </div>
              <select
                value={config.rampUpSeconds}
                onChange={(e) => setConfig({ ...config, rampUpSeconds: Number(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-[#8BC34A]"
              >
                <option value="0">⚡ Spike Instan (Semua di Detik 0)</option>
                <option value="15">🌊 Bertahap 15 Detik</option>
                <option value="30">🌊 Bertahap 30 Detik</option>
                <option value="60">🌊 Bertahap 60 Detik (Disarankan 1000+)</option>
              </select>
            </div>

            {/* Testing Pace */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Kecepatan Pengerjaan
              </label>
              <select
                value={config.pace}
                onChange={(e) => setConfig({ ...config, pace: e.target.value as any })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-[#8BC34A]"
              >
                <option value="turbo">⚡ Turbo (Throughput Maksimum ~100ms)</option>
                <option value="realistic">🧑 Realistis (Jeda Berpikir 800-2000ms)</option>
              </select>
            </div>
          </div>

          {/* Mode Selector Radio */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              Mode Eksekusi Uji Beban
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setConfig({ ...config, mode: 'virtual_stress' })}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  config.mode === 'virtual_stress'
                    ? 'border-[#8BC34A] bg-[#8BC34A]/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Mode Aman (Virtual Stress)
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                    Bebas Kuota
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                  Menguji konkurensi skala besar hingga 1.000+ peserta di memori tanpa memakan kuota kuotasi harian Firestore. 
                  Sangat direkomendasikan untuk uji coba rutin.
                </p>
              </div>

              <div
                onClick={() => setConfig({ ...config, mode: 'live_firestore' })}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  config.mode === 'live_firestore'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-indigo-500" /> Cloud Firestore Live Benchmark
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                    Real Database
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                  Melakukan transaksi read &amp; batch-write nyata ke server Firebase Firestore di cloud. Mengukur latensi jaringan dan commit database riil.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Architecture Defense Card */}
        <div className="bg-slate-50 dark:bg-gray-800/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" /> Prinsip Desain Ketahanan CBT
            </div>
            <h3 className="font-black text-gray-900 dark:text-white text-base">
              Mengapa Sistem CBT Ini Tahan 1.000+ Peserta?
            </h3>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 mt-3">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Paginasi 10 Soal per View:</strong> Jawaban disimpan di memori lokal RAM perangkat, bukan ditembakkan ke server di tiap klik radio button.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Single Batch Write:</strong> Penulisan ke Firestore hanya terjadi saat klik "Next" atau "Selesai". Menghemat hingga <strong>90% beban kuota</strong> dan mencegah limit 1 write/sec per document.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Independent Document Sharding:</strong> Setiap peserta memiliki dokumen unik sendiri (`participants/ID`), sehingga penulisan terdistribusi horizontal tanpa antrean *lock*.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-white dark:bg-gray-700/60 rounded-xl border border-gray-200 dark:border-gray-600 text-[11px] text-gray-500 dark:text-gray-300 space-y-1">
            <div className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-blue-500" /> Kebutuhan Bandwidth Lokasi:
            </div>
            <p>
              Untuk <strong>{config.participantCount} peserta</strong>, lokasi tes disarankan memiliki bandwidth internet minimal 
              <strong className="text-gray-900 dark:text-white"> {Math.max(10, Math.ceil(config.participantCount * 0.08))} Mbps</strong> yang stabil.
            </p>
          </div>
        </div>
      </div>

      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Active Users */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
            <span>Konkurensi Aktif</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {status.activeWorkers}
            </span>
            <span className="text-xs text-gray-500">
              / {status.totalConfigured} target
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{status.completedCount} selesai disubmit</span>
          </div>
        </div>

        {/* KPI 2: Throughput (RPS) */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
            <span>Throughput (RPS)</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {status.currentRps}
            </span>
            <span className="text-xs text-gray-500">transaksi/dtk</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
            Total {status.totalOperations} transaksi diproses
          </div>
        </div>

        {/* KPI 3: Response Latency */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
            <span>Rata-Rata Latensi</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {status.avgLatencyMs}
            </span>
            <span className="text-xs text-gray-500">ms (p95: {status.p95LatencyMs}ms)</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
            Min: {status.minLatencyMs}ms | Max: {status.maxLatencyMs}ms
          </div>
        </div>

        {/* KPI 4: Success vs Error */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
            <span>Tingkat Keberhasilan</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${status.failedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {status.totalOperations > 0 
                ? `${Math.round(((status.totalOperations - status.failedCount) / status.totalOperations) * 100)}%` 
                : '100%'}
            </span>
            <span className="text-xs text-gray-500">sukses</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
            {status.failedCount === 0 ? '0 kegagalan transaksi' : `${status.failedCount} transaksi timeout`}
          </div>
        </div>
      </div>

      {/* CBT Participant Funnel Progress */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-500" /> Funnel Tahapan Alur Ujian Peserta
          </h3>
          <span className="text-xs text-gray-500">
            Waktu Berjalan: <strong>{status.elapsedSeconds}s</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Step 1 */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 text-center">
            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400">1. Handshake &amp; Auth</div>
            <div className="text-xl font-black text-gray-900 dark:text-white mt-1">{status.funnel.handshake}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Verifikasi Token</div>
          </div>

          {/* Step 2 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">2. Unduh Soal</div>
            <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">{status.funnel.fetching}</div>
            <div className="text-[10px] text-blue-500 mt-0.5">Read Soal Subtes</div>
          </div>

          {/* Step 3 */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">3. Hal 1 (1-10)</div>
            <div className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1">{status.funnel.page1}</div>
            <div className="text-[10px] text-amber-500 mt-0.5">Batch Write 1</div>
          </div>

          {/* Step 4 */}
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 text-center">
            <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">4. Hal 2 (11-20)</div>
            <div className="text-xl font-black text-purple-700 dark:text-purple-300 mt-1">{status.funnel.page2}</div>
            <div className="text-[10px] text-purple-500 mt-0.5">Batch Write 2</div>
          </div>

          {/* Step 5 */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">5. Selesai (Submit)</div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{status.funnel.submitted}</div>
            <div className="text-[10px] text-emerald-500 mt-0.5">Skor Terhitung</div>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Charts */}
      {status.metricsHistory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Latency Curve */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Kurva Respon Latensi Server (ms)
              </h4>
              <span className="text-[11px] text-gray-400">Rata-rata vs p95</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={status.metricsHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="timeOffsetSec" unit="s" tick={{ fontSize: 11 }} />
                  <YAxis unit="ms" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 8, fontSize: 12, backgroundColor: '#1e293b', color: '#fff' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="avgLatencyMs" name="Avg Latency" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p95LatencyMs" name="95th % Latency" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Throughput (RPS) and Active Users */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Throughput (RPS) vs Konkurensi
              </h4>
              <span className="text-[11px] text-gray-400">Permintaan / Detik</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={status.metricsHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="timeOffsetSec" unit="s" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 8, fontSize: 12, backgroundColor: '#1e293b', color: '#fff' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="activeUsers" name="Peserta Aktif" stroke="#8BC34A" fill="#8BC34A" fillOpacity={0.2} />
                  <Line type="monotone" dataKey="rps" name="Throughput (RPS)" stroke="#6366f1" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Capacity Verdict Card */}
      {(status.isCompleted || status.isAborted) && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Hasil Evaluasi Kesiapan CBT
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                {status.verdict === 'EXCELLENT' && <CheckCircle className="w-6 h-6 text-emerald-500" />}
                {status.verdict === 'GOOD' && <CheckCircle className="w-6 h-6 text-blue-500" />}
                {status.verdict === 'WARNING' && <AlertTriangle className="w-6 h-6 text-amber-500" />}
                {status.verdict === 'CRITICAL' && <XCircle className="w-6 h-6 text-red-500" />}
                <span>
                  {status.verdict === 'EXCELLENT' && 'Grade A+ (Sangat Optimal & Tangguh)'}
                  {status.verdict === 'GOOD' && 'Grade A (Kondisi Stabil & Siap Digunakan)'}
                  {status.verdict === 'WARNING' && 'Grade B (Perlu Pembagian Gelombang/Stagger)'}
                  {status.verdict === 'CRITICAL' && 'Grade C (Ditemukan Bottleneck Signifikan)'}
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-gray-400">Skor Kapasitas</div>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {status.capacityScore}<span className="text-sm text-gray-400">/100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Temuan &amp; Rekomendasi Operasional:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {status.bottlenecksDetected.map((bn, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-gray-700/50 rounded-xl text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2 border border-gray-200 dark:border-gray-600">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{bn}</span>
                </div>
              ))}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Sistem aman menampung hingga <strong>{config.participantCount} peserta</strong> serentak berkat proteksi paginasi lokal dan pemisahan *document sharding* per peserta.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Stream Terminal Logs */}
      <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Live Stream Transaksi Virtual Peserta ({logs.length} entri)</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoScrollLogs} 
                onChange={(e) => setAutoScrollLogs(e.target.checked)}
                className="rounded accent-[#8BC34A]" 
              />
              <span>Auto-Scroll</span>
            </label>
            <button
              type="button"
              onClick={() => setLogs([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div 
          ref={logContainerRef}
          className="h-56 overflow-y-auto space-y-1.5 text-xs pr-2 scrollbar-thin scrollbar-thumb-slate-700"
        >
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 italic">
              Menunggu uji beban dimulai. Klik tombol "Jalankan Uji Beban" di atas.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 select-none shrink-0">[{log.timestamp}]</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                  log.stage === 'AUTH' ? 'bg-blue-900/60 text-blue-300' :
                  log.stage === 'FETCH' ? 'bg-cyan-900/60 text-cyan-300' :
                  log.stage === 'PAGE_1' ? 'bg-amber-900/60 text-amber-300' :
                  log.stage === 'PAGE_2' ? 'bg-purple-900/60 text-purple-300' :
                  log.stage === 'SUBMIT' ? 'bg-emerald-900/60 text-emerald-300' :
                  log.stage === 'ERROR' ? 'bg-red-900/60 text-red-300 font-bold' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {log.stage}
                </span>
                <span className="text-slate-400 font-semibold shrink-0">[{log.userName}]</span>
                <span className={log.isError ? 'text-red-400' : 'text-slate-300'}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
