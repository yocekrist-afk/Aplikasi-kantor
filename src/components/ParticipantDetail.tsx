import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { confirmAction } from '../utils/confirmAction';
import { doc, updateDoc, deleteField, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  RefreshCw, 
  Clock, 
  Timer, 
  User, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  BarChart2, 
  ShieldCheck, 
  ArrowLeft, 
  Hourglass, 
  Zap,
  Info,
  Check,
  Award,
  ChevronDown,
  ChevronUp,
  FileText,
  XCircle,
  Save,
  Layers,
  Sparkles,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { 
  calculateAllIstSubtests, 
  convertGeTotalToRS, 
  GE_TABLE_3_ENTRIES, 
  SUBTEST4_GE_KEYS,
  SUBTEST1_SE_KEYS,
  SUBTEST2_WA_KEYS,
  SUBTEST3_AN_KEYS,
  SUBTEST5_RA_KEYS,
  SUBTEST6_ZR_KEYS,
  SUBTEST7_FA_KEYS,
  SUBTEST8_WU_KEYS,
  SUBTEST9_ME_KEYS
} from '../utils/istAnswerKeys';
import { processParticipantScores } from '../utils/istScoring';
import { ParticipantScoringTab } from './ParticipantScoringTab';

export function ParticipantDetail({ participant, onClose }: { participant: any, onClose: () => void }) {
  const { data: events } = useFirestore('events');
  const [activeTab, setActiveTab] = useState<'profile' | 'timeLogs' | 'scoring'>('profile');
  const [liveParticipant, setLiveParticipant] = useState<any>(participant);
  const [selectedSubtestDetail, setSelectedSubtestDetail] = useState<string>('GE');
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [showGeTableModal, setShowGeTableModal] = useState(false);

  // Sync participant updates in real-time
  useEffect(() => {
    if (!participant?.id) return;
    const unsub = onSnapshot(doc(db, 'participants', participant.id), (snap) => {
      if (snap.exists()) {
        setLiveParticipant({ id: snap.id, ...snap.data() });
      }
    }, (err) => {
      console.error("Error listening to participant:", err);
    });
    return () => unsub();
  }, [participant?.id]);

  const pData = liveParticipant || participant;

  // Real-time IST scoring computation from participant answers and normative keys
  const scoringData = useMemo(() => {
    if (!pData) return null;
    const graded = pData.answers ? calculateAllIstSubtests(pData.answers) : null;

    let raw = graded?.rawScores || pData.rawScores;
    if (!raw) {
      const rawGe = pData.rw_ge || 0;
      raw = {
        SE: pData.rw_se || 0,
        WA: pData.rw_wa || 0,
        AN: pData.rw_an || 0,
        GE: rawGe > 20 ? convertGeTotalToRS(rawGe) : rawGe,
        RA: pData.rw_ra || 0,
        ZR: pData.rw_zr || 0,
        FA: pData.rw_fa || 0,
        WU: pData.rw_wu || 0,
        ME: pData.rw_me || 0,
      };
    } else if (raw.GE > 20) {
      raw = {
        ...raw,
        GE: convertGeTotalToRS(raw.GE),
      };
    }

    const processed = processParticipantScores(raw, {
      id: pData.id || 'P-1',
      nomorTes: pData.noPeserta || pData.nomorTes || 'IST-001',
      nama: pData.nama || 'Peserta',
      jenisKelamin: (pData.gender === 'Pria' || pData.gender === 'L' || pData.jenisKelamin === 'L') ? 'L' : 'P',
      tanggalLahir: pData.tglLahir || pData.tanggalLahir || '2008-01-01',
      tanggalTes: pData.tanggalTes || new Date().toISOString().split('T')[0],
      usia: pData.umur || pData.usia || '18 Tahun',
      pendidikan: pData.programStudi || pData.level || pData.pendidikan || 'SMA/Umum',
      asalSekolahInstitusi: pData.sekolah || pData.asalSekolah || pData.asalSekolahInstitusi || '-'
    });

    const gePoints = graded?.details.GE?.totalPoints ?? (pData.rw_ge > 20 ? pData.rw_ge : pData.geTotalPoints ?? null);

    return {
      graded,
      processed,
      gePoints
    };
  }, [pData]);
  if (!pData) return null;

  const participantEvent = events.find((e: any) => e.id === pData.eventId);

  const handleResetTest = async (subtestId: string, subtestName: string) => {
    const isSub9 = subtestId.includes('ist_9') || 
                   subtestId.includes('subtest_9') || 
                   subtestName.toLowerCase().includes('subtes 9') || 
                   subtestName.toLowerCase().includes('me');

    const confirmMessage = isSub9
      ? `Yakin ingin me-reset tes "${subtestName}" untuk peserta ini?\n\nPERHATIAN: Sesi hafalan kata (Tahap 1 & 2), timer hafalan 3 menit, instruksi contoh soal, jawaban, serta seluruh timer ujian akan di-reset total.\n\nPeserta akan mengulang benar-benar dari awal (dari fase menghafal kata 3 menit).`
      : `Yakin ingin me-reset tes "${subtestName}" untuk peserta ini?\n\nSemua jawaban, log waktu, dan timer untuk subtes ini akan dihapus permanen, dan peserta bisa mengulangnya dari awal.`;

    if (await confirmAction(confirmMessage)) {
      try {
        const pRef = doc(db, 'participants', pData.id);
        const updates: Record<string, any> = {
          [`completedTests.${subtestId}`]: deleteField(),
          [`answers.${subtestId}`]: deleteField(),
          [`testTimers.${subtestId}`]: deleteField(),
          [`testTimers.${subtestId}_memorize`]: deleteField(),
          [`testTimers.${subtestId}_mem`]: deleteField(),
          [`subtestLogs.${subtestId}`]: deleteField(),
        };

        await updateDoc(pRef, updates);
        alert(isSub9 
          ? `Subtes 9 (${subtestName}) berhasil direset total. Sesi hafalan kata, timer, dan jawaban telah dikembalikan ke awal.` 
          : `Tes "${subtestName}" berhasil direset. Peserta sekarang bisa mengakses tes ini kembali.`
        );
      } catch (error) {
        console.error(error);
        alert('Gagal mereset tes. Pastikan koneksi internet stabil.');
      }
    }
  };

  const handleResetAllTests = async () => {
    if (await confirmAction(`PERINGATAN: Yakin ingin me-reset SELURUH SUBTES untuk peserta ini?\n\nSeluruh status pengerjaan, jawaban, log audit, dan timer (termasuk sesi hafalan kata Subtes 9) akan dihapus permanen. Peserta akan mengulang seluruh rangkaian tes dari awal.`)) {
      try {
        const pRef = doc(db, 'participants', pData.id);
        await updateDoc(pRef, {
          completedTests: deleteField(),
          answers: deleteField(),
          testTimers: deleteField(),
          subtestLogs: deleteField(),
        });
        alert('Seluruh subtes berhasil direset ke kondisi awal. Peserta dapat memulai kembali tes dari awal.');
      } catch (error) {
        console.error(error);
        alert('Gagal mereset seluruh subtes. Pastikan koneksi internet stabil.');
      }
    }
  };

  const handleSaveCalculatedScores = async () => {
    if (!pData?.id || !scoringData) return;
    try {
      setIsSavingScores(true);
      const pRef = doc(db, 'participants', pData.id);
      const { processed, gePoints } = scoringData;
      await updateDoc(pRef, {
        rawScores: processed.rawScores,
        rw_se: processed.rawScores.SE,
        rw_wa: processed.rawScores.WA,
        rw_an: processed.rawScores.AN,
        rw_ge: processed.rawScores.GE,
        rw_ra: processed.rawScores.RA,
        rw_zr: processed.rawScores.ZR,
        rw_fa: processed.rawScores.FA,
        rw_wu: processed.rawScores.WU,
        rw_me: processed.rawScores.ME,
        geTotalPoints: gePoints ?? processed.rawScores.GE,
        totalRaw: processed.totalRaw,
        totalSS: processed.totalSS,
        totalIQ: processed.totalIQ,
        iqCategory: processed.iqCategory,
        subtestDetails: processed.subtestDetails,
        domainSummary: processed.domainSummary,
        streamAnalysis: processed.streamAnalysis,
        studyRecommendations: processed.studyRecommendations,
        strengths: processed.strengths,
        developmentAreas: processed.developmentAreas,
        generalDescription: processed.generalDescription,
        recommendations: processed.recommendations,
        learningStrategies: processed.learningStrategies,
      });
      alert('Skor hasil penilaian IST (beserta konversi Subtes 4 GE) berhasil disimpan ke database peserta!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan skor ke database.');
    } finally {
      setIsSavingScores(false);
    }
  };

  // Expand subtests list from event categories
  const subtestItems = useMemo(() => {
    const items: Array<{ id: string; name: string; shortName: string; defaultLimitMin: number }> = [];
    if (!participantEvent?.kategoriSoal) return items;

    // Default IST duration mapping in minutes
    const istLimits: Record<number, number> = {
      1: 6, // SE
      2: 6, // WA
      3: 7, // AN
      4: 8, // GE
      5: 10, // RA
      6: 10, // ZR
      7: 7, // FA
      8: 9, // WU
      9: 8  // ME
    };

    participantEvent.kategoriSoal.forEach((kat: string, idx: number) => {
      const lower = kat.toLowerCase();
      if (lower.includes('intelegensi')) {
        const istNames = ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'];
        istNames.forEach((istName, istIdx) => {
          items.push({
            id: `subtest_${idx}_ist_${istIdx + 1}`,
            name: `${kat} (Subtes ${istIdx + 1} - ${istName})`,
            shortName: `Subtes ${istIdx + 1} - ${istName}`,
            defaultLimitMin: istLimits[istIdx + 1] || 6
          });
        });
      } else {
        items.push({
          id: `subtest_${idx}`,
          name: kat,
          shortName: kat,
          defaultLimitMin: 15
        });
      }
    });

    return items;
  }, [participantEvent]);

  // Aggregate subtest time logs and behavioral metrics
  const behavioralAnalysis = useMemo(() => {
    const logs = pData.subtestLogs || {};
    const timers = pData.testTimers || {};
    const completed = pData.completedTests || {};

    let totalDurationSeconds = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let rushCount = 0; // finished very fast (< 35% time limit)
    let autoSubmitCount = 0; // finished due to time_up
    let thoroughCount = 0; // used > 80% time limit

    const processedLogs = subtestItems.map((item) => {
      const log = logs[item.id];
      const timerStart = timers[item.id] || timers[`${item.id}_memorize`];
      const isCompleted = !!completed[item.id];
      const hasStarted = !!timerStart || !!log?.startedAt || !!log?.memorizeStartedAt;

      // Extract timestamps
      const startedAt = log?.startedAt || log?.memorizeStartedAt || timerStart || null;
      const finishedAt = log?.finishedAt || (isCompleted && startedAt ? startedAt + (item.defaultLimitMin * 60 * 1000) : null);
      
      const timeLimitMin = log?.timeLimitMinutes || item.defaultLimitMin || 6;
      const timeLimitSec = timeLimitMin * 60;

      let durationSec = log?.durationSeconds;
      if (durationSec === undefined && isCompleted && startedAt && finishedAt) {
        durationSec = Math.max(1, Math.round((finishedAt - startedAt) / 1000));
      }

      let finishReason = log?.finishReason || (isCompleted ? 'manual_submit' : null);

      if (isCompleted && durationSec) {
        totalDurationSeconds += durationSec;
        completedCount++;

        const ratio = durationSec / timeLimitSec;
        if (finishReason === 'time_up' || ratio >= 1) {
          autoSubmitCount++;
        } else if (ratio < 0.35) {
          rushCount++;
        } else if (ratio >= 0.8) {
          thoroughCount++;
        }
      } else if (hasStarted && !isCompleted) {
        inProgressCount++;
      }

      return {
        ...item,
        startedAt,
        finishedAt,
        durationSec,
        timeLimitMin,
        timeLimitSec,
        isCompleted,
        hasStarted,
        finishReason,
        usageRatio: durationSec ? Math.min(100, Math.round((durationSec / timeLimitSec) * 100)) : 0
      };
    });

    const avgDuration = completedCount > 0 ? Math.round(totalDurationSeconds / completedCount) : 0;

    return {
      subtestRows: processedLogs,
      completedCount,
      inProgressCount,
      totalDurationSeconds,
      avgDuration,
      rushCount,
      autoSubmitCount,
      thoroughCount
    };
  }, [pData, subtestItems]);

  const formatDateTime = (timestamp: number | string | null | undefined) => {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB';
  };

  const formatDuration = (seconds: number | undefined) => {
    if (seconds === undefined || seconds === null || seconds < 0) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s} detik`;
    if (s === 0) return `${m} menit`;
    return `${m}m ${s}s`;
  };

  const getPacingTag = (durationSec: number | undefined, limitSec: number, finishReason?: string | null) => {
    if (!durationSec) return null;
    const ratio = durationSec / limitSec;

    if (finishReason === 'time_up' || ratio >= 0.98) {
      return {
        label: 'Waktu Maksimal (Auto-Submit)',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        desc: 'Peserta mengerjakan sampai batas waktu habis.'
      };
    }
    if (ratio < 0.35) {
      return {
        label: 'Sangat Cepat / Impulsif',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        desc: 'Durasi < 35% kuota waktu. Potensi menebak atau menyelesaikan tanpa verifikasi.'
      };
    }
    if (ratio >= 0.8) {
      return {
        label: 'Teliti & Hati-hati',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        desc: 'Peserta memanfaatkan mayoritas waktu untuk meninjau opsi jawaban.'
      };
    }
    return {
      label: 'Optimal & Percaya Diri',
      color: 'bg-green-50 text-green-700 border-green-200',
      desc: 'Kecepatan pengerjaan stabil, selesai secara mandiri sebelum waktu habis.'
    };
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div 
        className="flex items-center space-x-2 text-sm text-blue-600 cursor-pointer hover:underline font-medium w-fit" 
        onClick={onClose}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke daftar peserta</span>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-5 w-full sm:w-auto">
          <img 
            src={pData.avatar || pData.photoBase64 || "https://i.pravatar.cc/150?img=11"} 
            alt={pData.nama} 
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-md object-cover shrink-0" 
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900 capitalize">{pData.nama}</h2>
              {pData.nik && (
                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-mono font-medium">
                  NIK: {pData.nik}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{pData.email || 'Email belum diisi'}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                {pData.programStudi || 'Umum'}
              </span>
              <span>•</span>
              <span className="text-gray-500">{pData.gender || 'L/P'}</span>
              <span>•</span>
              <span className="text-gray-500">WA: {pData.noWa || '-'}</span>
            </div>
          </div>
        </div>

        {/* Quick Badge */}
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 text-right w-full sm:w-auto justify-between sm:justify-end">
          <div>
            <div className="text-xs text-gray-500 font-medium">Status Pengerjaan</div>
            <div className="text-sm font-bold text-gray-800">
              {behavioralAnalysis.completedCount} dari {subtestItems.length} Subtes Selesai
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#8BC34A]/20 flex items-center justify-center text-[#689F38] font-bold">
            <Timer className="w-5 h-5" />
          </div>
        </div>
      </div>

      {pData.isDeleted && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-red-800 flex items-center gap-2">
                <span>Peserta Berada di Tempat Sampah</span>
                <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-semibold">Nonaktif</span>
              </div>
              <div className="text-xs text-red-600 mt-0.5">
                Akun ini telah dipindahkan ke tempat sampah. Klik tombol pulihkan untuk mengaktifkan kembali akun dan hasil tesnya ke daftar utama.
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              if (await confirmAction(`Pulihkan data peserta "${pData.namaPeserta || pData.nama}" kembali ke daftar peserta aktif?`)) {
                try {
                  await updateDoc(doc(db, 'participants', participant.id), { isDeleted: false, deletedAt: null });
                } catch (e) {
                  console.error(e);
                  alert('Gagal memulihkan peserta');
                }
              }
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Pulihkan Peserta</span>
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 flex space-x-8">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'border-[#8BC34A] text-[#689F38]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil & Event</span>
        </button>

        <button
          onClick={() => setActiveTab('timeLogs')}
          className={`pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'timeLogs'
              ? 'border-[#8BC34A] text-[#689F38]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>Log Waktu & Analisis Perilaku Subtes</span>
          {behavioralAnalysis.completedCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-[#8BC34A]/20 text-[#689F38] rounded-full font-bold">
              {behavioralAnalysis.completedCount} Selesai
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('scoring')}
          className={`pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'scoring'
              ? 'border-[#8BC34A] text-[#689F38]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Skor & Kunci Jawaban Resmi IST</span>
          <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 rounded-full font-bold">
            9 Subtes
          </span>
        </button>
      </div>

      {/* TAB 1: Profil & Event */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              <span>Informasi Biodata Peserta</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 block text-xs mb-1">Nomor Induk Kependudukan (NIK)</span>
                <span className="font-semibold text-gray-900">{pData.nik || '-'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 block text-xs mb-1">Nama Lengkap</span>
                <span className="font-semibold text-gray-900 capitalize">{pData.nama || '-'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 block text-xs mb-1">Tanggal Lahir</span>
                <span className="font-semibold text-gray-900">{pData.tglLahir || '-'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 block text-xs mb-1">Jenis Kelamin</span>
                <span className="font-semibold text-gray-900">{pData.gender || '-'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 block text-xs mb-1">Nomor WhatsApp / Ponsel</span>
                <span className="font-semibold text-gray-900">{pData.noWa || '-'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 block text-xs mb-1">Program Studi / Instansi</span>
                <span className="font-semibold text-gray-900">{pData.programStudi || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span>Event yang Diikuti</span>
            </h3>
            {participantEvent ? (
              <div className="flex items-start space-x-4 border border-gray-100 p-5 rounded-xl bg-gray-50 flex-col sm:flex-row gap-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center font-bold text-blue-900 shadow-sm shrink-0 text-lg">
                  {participantEvent.title?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 w-full">
                  <div className="flex items-center space-x-3 mb-1 flex-wrap gap-2">
                    <h4 className="font-bold text-gray-900 text-base">{participantEvent.title}</h4>
                    <span className={`px-2.5 py-0.5 text-xs text-white rounded-full font-bold ${participantEvent.status === 'Active' ? 'bg-[#8BC34A]' : 'bg-gray-400'}`}>
                      {participantEvent.status === 'Active' ? 'Event Aktif' : 'Event Selesai / Tidak Aktif'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap items-center gap-4 mb-4 mt-2">
                    <span className="flex items-center space-x-1"><span>📅</span><span>{participantEvent.date}</span></span>
                    <span className="flex items-center space-x-1"><span>🕒</span><span>{participantEvent.startTime} - {participantEvent.endTime} WIB</span></span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                      <div>
                        <span className="font-bold text-gray-800 text-sm">Daftar Subtes & Kontrol Reset :</span>
                        <p className="text-[11px] text-gray-500">Reset subtes akan menghapus jawaban, timer (termasuk sesi hafalan Subtes 9), dan log agar peserta dapat mengulang.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">{subtestItems.length} subtes</span>
                        <button
                          onClick={handleResetAllTests}
                          className="text-xs flex items-center space-x-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors font-semibold cursor-pointer shadow-xs"
                          title="Reset semua subtes sekaligus untuk peserta ini"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset Semua Subtes</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {subtestItems.map((item, idx) => {
                        const isCompleted = pData.completedTests && pData.completedTests[item.id];
                        const hasStarted = (pData.testTimers && (pData.testTimers[item.id] || pData.testTimers[`${item.id}_memorize`])) || 
                                           (pData.subtestLogs && (pData.subtestLogs[item.id]?.startedAt || pData.subtestLogs[item.id]?.memorizeStartedAt));

                        return (
                          <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl shadow-sm hover:border-gray-300 transition-colors">
                            <div className="min-w-0 pr-2">
                              <span className="text-xs font-semibold text-gray-800 block truncate">{item.name}</span>
                              <div className="text-[11px] mt-0.5">
                                {isCompleted ? (
                                  <span className="text-green-600 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                                  </span>
                                ) : hasStarted ? (
                                  <span className="text-blue-600 font-bold flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 animate-spin" /> Sedang Dikerjakan
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Belum Mulai</span>
                                )}
                              </div>
                            </div>
                            {(isCompleted || hasStarted) && (
                              <button 
                                onClick={() => handleResetTest(item.id, item.name)}
                                className="text-xs flex items-center space-x-1 bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium shrink-0 cursor-pointer"
                                title="Reset hasil, timer, dan log untuk subtes ini"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Tidak ada data event atau event telah dihapus.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Log Waktu & Analisis Perilaku Subtes */}
      {activeTab === 'timeLogs' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Security & Anti-Capture Audit Alert if attempts exist */}
          {pData.captureAttempts && pData.captureAttempts > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5 flex items-start gap-4 text-red-900">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-red-900">
                    Peringatan Audit Keamanan: Upaya Tangkapan Layar Terdeteksi ({pData.captureAttempts}x)
                  </h4>
                </div>
                <p className="text-sm text-red-700 mt-1 leading-relaxed">
                  Sistem anti-cheat mencatat bahwa peserta pernah memicu tombol PrintScreen, shortcut snipping tool, screenshot, atau berpindah jendela saat ujian berlangsung.
                </p>
                <div className="mt-2 text-xs font-semibold text-red-800 bg-red-100/70 px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
                  <span>Waktu Terakhir: {formatDateTime(pData.lastCaptureAttempt)}</span>
                  {pData.lastCaptureReason && <span>• Alasan: {pData.lastCaptureReason}</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Integritas Ujian Terjaga:</strong> Tidak ada riwayat tangkapan layar atau pelanggaran shortcut terdeteksi selama pengerjaan.
              </span>
            </div>
          )}

          {/* Behavioral Overview Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Durasi Riil</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">
                {formatDuration(behavioralAnalysis.totalDurationSeconds)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Akumulasi waktu yang dihabiskan pada seluruh subtes
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Rata-rata per Subtes</span>
                <Timer className="w-4 h-4 text-[#8BC34A]" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">
                {behavioralAnalysis.completedCount > 0 
                  ? formatDuration(behavioralAnalysis.avgDuration) 
                  : '-'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Dari {behavioralAnalysis.completedCount} subtes yang telah selesai
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Karakteristik Pacing</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                {behavioralAnalysis.completedCount === 0 ? (
                  <span className="text-sm text-gray-400 font-medium">Belum ada data pengerjaan</span>
                ) : behavioralAnalysis.rushCount > behavioralAnalysis.thoroughCount ? (
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md">
                      Cenderung Cepat / Impulsif
                    </span>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {behavioralAnalysis.rushCount} subtes selesai &lt; 35% batas waktu
                    </p>
                  </div>
                ) : behavioralAnalysis.autoSubmitCount > 0 ? (
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-md">
                      Batas Waktu Maksimal
                    </span>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {behavioralAnalysis.autoSubmitCount} subtes selesai otomatis karena waktu habis
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-md">
                      Pacing Terkendali & Optimal
                    </span>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Menyelesaikan dengan alokasi waktu ideal
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Progress Ujian</span>
                <Activity className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">
                {Math.round((behavioralAnalysis.completedCount / Math.max(1, subtestItems.length)) * 100)}%
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-[#8BC34A] h-full transition-all duration-300"
                  style={{ width: `${(behavioralAnalysis.completedCount / Math.max(1, subtestItems.length)) * 100}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {behavioralAnalysis.completedCount} selesai, {behavioralAnalysis.inProgressCount} sedang berjalan
              </p>
            </div>
          </div>

          {/* Detailed Subtest Logs Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#8BC34A]" />
                  <span>Log Waktu & Detail Pengerjaan Per Subtes</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mencatat jam mulai, jam selesai, durasi pengerjaan, dan rasio pemakaian batas waktu per subtes.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Subtes</th>
                    <th className="py-3 px-4">Waktu Mulai</th>
                    <th className="py-3 px-4">Waktu Selesai</th>
                    <th className="py-3 px-4">Durasi Riil</th>
                    <th className="py-3 px-4">Batas Waktu</th>
                    <th className="py-3 px-4">Efisiensi & Pemakaian Waktu</th>
                    <th className="py-3 px-4">Status & Analisis Pacing</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {behavioralAnalysis.subtestRows.map((row, idx) => {
                    const pacingTag = getPacingTag(row.durationSec, row.timeLimitSec, row.finishReason);

                    return (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        {/* Subtest Name */}
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          <div>{row.name}</div>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {row.id}</span>
                        </td>

                        {/* Started At */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {row.startedAt ? (
                            <span className="font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                              {formatDateTime(row.startedAt)}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Belum dimulai</span>
                          )}
                        </td>

                        {/* Finished At */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {row.isCompleted && row.finishedAt ? (
                            <span className="font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                              {formatDateTime(row.finishedAt)}
                            </span>
                          ) : row.hasStarted ? (
                            <span className="text-blue-600 font-medium animate-pulse flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Sedang berjalan...
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>

                        {/* Real Duration */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {row.durationSec !== undefined ? (
                            <span className="font-bold text-gray-900 text-sm">
                              {formatDuration(row.durationSec)}
                            </span>
                          ) : row.hasStarted && !row.isCompleted ? (
                            <span className="text-blue-600 font-semibold text-xs">Berjalan</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* Time Limit */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-gray-600">
                          {row.timeLimitMin} Menit
                        </td>

                        {/* Usage Ratio & Progress Bar */}
                        <td className="py-3.5 px-4 min-w-[160px]">
                          {row.durationSec !== undefined ? (
                            <div>
                              <div className="flex justify-between items-center text-[11px] mb-1">
                                <span className="font-semibold text-gray-700">{row.usageRatio}%</span>
                                <span className="text-gray-400 text-[10px]">dari batas</span>
                              </div>
                              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    row.usageRatio < 35 
                                      ? 'bg-amber-500' 
                                      : row.usageRatio >= 95 
                                      ? 'bg-purple-600' 
                                      : 'bg-[#8BC34A]'
                                  }`}
                                  style={{ width: `${Math.min(100, row.usageRatio)}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Pacing / Status */}
                        <td className="py-3.5 px-4">
                          {row.isCompleted ? (
                            <div className="space-y-1">
                              {pacingTag && (
                                <span 
                                  className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${pacingTag.color}`}
                                  title={pacingTag.desc}
                                >
                                  {pacingTag.label}
                                </span>
                              )}
                              <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Check className="w-3 h-3 text-green-600" />
                                {row.finishReason === 'time_up' 
                                  ? 'Disubmit Otomatis (Waktu Habis)' 
                                  : 'Diserahkan Sendiri oleh Peserta'}
                              </div>
                            </div>
                          ) : row.hasStarted ? (
                            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200">
                              Sedang Dikerjakan
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">Belum Dimulai</span>
                          )}
                        </td>

                        {/* Reset Action */}
                        <td className="py-3.5 px-4 text-center">
                          {(row.isCompleted || row.hasStarted) && (
                            <button
                              onClick={() => handleResetTest(row.id, row.name)}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium"
                              title="Reset subtes ini"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Reset</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {behavioralAnalysis.subtestRows.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                Belum ada data subtes pada event ini.
              </div>
            )}
          </div>

          {/* Assessor Interpretation Guidance Note */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 text-gray-600 text-xs space-y-2">
            <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Pedoman Interpretasi Perilaku Waktu Subtes (Assessor Guide):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600 leading-relaxed">
              <li>
                <strong>Sangat Cepat (&lt; 35% kuota waktu):</strong> Indikasi peserta mengerjakan secara terburu-buru, memilih jawaban acak (guessing), atau memiliki tingkat penguasaan soal yang sangat luar biasa. Bandingkan dengan skor kebenaran jawaban pada laporan hasil.
              </li>
              <li>
                <strong>Optimal (35% - 85% kuota waktu):</strong> Menunjukkan pemahaman materi yang memadai, ritme kerja mandiri yang stabil, dan efisiensi pengambilan keputusan tanpa menunggu waktu habis.
              </li>
              <li>
                <strong>Waktu Maksimal (Auto-Submit):</strong> Peserta mengalami kesulitan dalam alokasi waktu atau sangat berhati-hati memeriksa kembali hingga batas waktu sistem habis.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: Skor & Kunci Jawaban Resmi IST */}
      {activeTab === 'scoring' && scoringData && (
        <ParticipantScoringTab
          pData={pData}
          scoringData={scoringData}
          onSaveScores={handleSaveCalculatedScores}
          isSaving={isSavingScores}
        />
      )}
    </div>
  );
}
