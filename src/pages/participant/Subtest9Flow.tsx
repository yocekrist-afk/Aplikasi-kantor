import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, BookOpen, ChevronLeft, ChevronRight, Check, CheckCircle2, 
  AlertTriangle, Eye, ArrowRight, ShieldAlert, Sparkles, Camera,
  XCircle, HelpCircle, Zap, X, Loader2
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  evaluateSingleSubtestResult, 
  getSampleAnswersForSubtest, 
  SingleSubtestEvaluation 
} from '../../utils/istAnswerKeys';
import { SimulationScorecardModal } from '../../components/SimulationScorecardModal';

interface Subtest9FlowProps {
  participantId: string;
  subtestId: string;
  subtestName: string;
  totalQuestions?: number;
  timeLimitMinutes?: number; // total standard is 9 (3 mins memorize + 6 mins exam)
  onFinish: () => void;
  onCancel: () => void;
  isSimulation?: boolean;
  disableAntiCheat?: boolean;
  autoFillSampleAnswers?: boolean;
  onSimulationFinish?: (evaluation: SingleSubtestEvaluation, timeSpentSeconds: number) => void;
}

// 25 Kata Hafalan Resmi Subtes 9 (IST ME - Manual dan Norma IST)
const MEMORY_CATEGORIES = [
  {
    category: "KESENIAN",
    color: "from-purple-500 to-indigo-600",
    badgeBg: "bg-purple-100 text-purple-800 border-purple-200",
    words: [
      { initial: "Q", word: "Quintet" },
      { initial: "A", word: "Arca" },
      { initial: "O", word: "Opera" },
      { initial: "G", word: "Gamelan" },
      { initial: "U", word: "Ukiran" },
    ]
  },
  {
    category: "BINATANG",
    color: "from-emerald-500 to-teal-600",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    words: [
      { initial: "M", word: "Musang" },
      { initial: "R", word: "Rusa" },
      { initial: "B", word: "Beruang" },
      { initial: "Z", word: "Zebra" },
      { initial: "H", word: "Harimau" },
    ]
  },
  {
    category: "PERKAKAS",
    color: "from-amber-500 to-orange-600",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
    words: [
      { initial: "W", word: "Wajan" },
      { initial: "J", word: "Jarum" },
      { initial: "K", word: "Kikir" },
      { initial: "C", word: "Cangkul" },
      { initial: "P", word: "Palu" },
    ]
  },
  {
    category: "BURUNG",
    color: "from-sky-500 to-blue-600",
    badgeBg: "bg-sky-100 text-sky-800 border-sky-200",
    words: [
      { initial: "I", word: "Itik" },
      { initial: "E", word: "Elang" },
      { initial: "W", word: "Walet" },
      { initial: "T", word: "Tekukur" },
      { initial: "N", word: "Nuri" },
    ]
  },
  {
    category: "BUNGA",
    color: "from-rose-500 to-pink-600",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
    words: [
      { initial: "S", word: "Soka" },
      { initial: "L", word: "Larat" },
      { initial: "F", word: "Flamboyan" },
      { initial: "Y", word: "Yasmin" },
      { initial: "D", word: "Dahlia" },
    ]
  }
];

// Opsi Jawaban Baku (Sesuai lembar jawaban manual: a. Kesenian, b. Binatang, c. Perkakas, d. Burung, e. Bunga)
const SUBTEST9_OPTIONS = [
  { key: 'a', label: 'kesenian' },
  { key: 'b', label: 'binatang' },
  { key: 'c', label: 'perkakas' },
  { key: 'd', label: 'burung' },
  { key: 'e', label: 'bunga' },
];

// 20 Butir Soal Baku IST ME (Nomor 157 s.d. 176)
const ME_QUESTIONS = [
  { no: 157, letter: "A", prompt: "Kata yang mempunyai huruf permulaan — A — adalah suatu ...", answer: "a" }, // Arca -> Kesenian
  { no: 158, letter: "B", prompt: "Kata yang mempunyai huruf permulaan — B — adalah suatu ...", answer: "b" }, // Beruang -> Binatang
  { no: 159, letter: "C", prompt: "Kata yang mempunyai huruf permulaan — C — adalah suatu ...", answer: "c" }, // Cangkul -> Perkakas
  { no: 160, letter: "D", prompt: "Kata yang mempunyai huruf permulaan — D — adalah suatu ...", answer: "e" }, // Dahlia -> Bunga
  { no: 161, letter: "E", prompt: "Kata yang mempunyai huruf permulaan — E — adalah suatu ...", answer: "d" }, // Elang -> Burung
  { no: 162, letter: "F", prompt: "Kata yang mempunyai huruf permulaan — F — adalah suatu ...", answer: "e" }, // Flamboyan -> Bunga
  { no: 163, letter: "G", prompt: "Kata yang mempunyai huruf permulaan — G — adalah suatu ...", answer: "a" }, // Gamelan -> Kesenian
  { no: 164, letter: "H", prompt: "Kata yang mempunyai huruf permulaan — H — adalah suatu ...", answer: "b" }, // Harimau -> Binatang
  { no: 165, letter: "I", prompt: "Kata yang mempunyai huruf permulaan — I — adalah suatu ...", answer: "d" }, // Itik -> Burung
  { no: 166, letter: "J", prompt: "Kata yang mempunyai huruf permulaan — J — adalah suatu ...", answer: "c" }, // Jarum -> Perkakas
  { no: 167, letter: "K", prompt: "Kata yang mempunyai huruf permulaan — K — adalah suatu ...", answer: "c" }, // Kikir -> Perkakas
  { no: 168, letter: "L", prompt: "Kata yang mempunyai huruf permulaan — L — adalah suatu ...", answer: "e" }, // Larat -> Bunga
  { no: 169, letter: "M", prompt: "Kata yang mempunyai huruf permulaan — M — adalah suatu ...", answer: "b" }, // Musang -> Binatang
  { no: 170, letter: "N", prompt: "Kata yang mempunyai huruf permulaan — N — adalah suatu ...", answer: "d" }, // Nuri -> Burung
  { no: 171, letter: "O", prompt: "Kata yang mempunyai huruf permulaan — O — adalah suatu ...", answer: "a" }, // Opera -> Kesenian
  { no: 172, letter: "P", prompt: "Kata yang mempunyai huruf permulaan — P — adalah suatu ...", answer: "c" }, // Palu -> Perkakas
  { no: 173, letter: "R", prompt: "Kata yang mempunyai huruf permulaan — R — adalah suatu ...", answer: "b" }, // Rusa -> Binatang
  { no: 174, letter: "S", prompt: "Kata yang mempunyai huruf permulaan — S — adalah suatu ...", answer: "e" }, // Soka -> Bunga
  { no: 175, letter: "T", prompt: "Kata yang mempunyai huruf permulaan — T — adalah suatu ...", answer: "d" }, // Tekukur -> Burung
  { no: 176, letter: "U", prompt: "Kata yang mempunyai huruf permulaan — U — adalah suatu ...", answer: "a" }, // Ukiran -> Kesenian
];

type FlowStage = 'instruction_1' | 'memorizing' | 'instruction_2' | 'exam';

export function Subtest9Flow({
  participantId,
  subtestId,
  subtestName,
  timeLimitMinutes = 9,
  onFinish,
  onCancel,
  isSimulation = false,
  disableAntiCheat = false,
  autoFillSampleAnswers = false,
  onSimulationFinish,
}: Subtest9FlowProps) {
  // Alokasi Durasi (Menit): 3 menit Menghafal, sisanya untuk Pengerjaan Soal (standar 6 menit)
  const memorizeDurationMs = 3 * 60 * 1000;
  const examDurationMinutes = Math.max(timeLimitMinutes - 3, 6);
  const examDurationMs = examDurationMinutes * 60 * 1000;

  // State Tahapan Alur
  const [stage, setStage] = useState<FlowStage>('instruction_1');
  const [isLoading, setIsLoading] = useState(true);

  // Timers
  const [memorizeTimeLeft, setMemorizeTimeLeft] = useState<number | null>(null);
  const [examTimeLeft, setExamTimeLeft] = useState<number | null>(null);
  const memorizeStartTimeRef = useRef<number | null>(null);
  const examStartTimeRef = useRef<number | null>(null);

  // Pengerjaan Soal (Exam State)
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState(0); // 0: Soal 157-166, 1: Soal 167-176
  const [isSaving, setIsSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isTimeUpModal, setIsTimeUpModal] = useState(false);

  // Simulation Evaluation State
  const [simulationEvaluation, setSimulationEvaluation] = useState<SingleSubtestEvaluation | null>(null);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [simTimeSpent, setSimTimeSpent] = useState<number>(0);

  // Auto-fill sample answers if requested
  useEffect(() => {
    if (autoFillSampleAnswers) {
      const sample = getSampleAnswersForSubtest('ist_9', subtestName);
      setAnswers(sample);
    }
  }, [autoFillSampleAnswers, subtestName]);

  // State Interaktif Contoh Soal di Instruksi 2
  const [example1Answer, setExample1Answer] = useState<string | null>(null);
  const [example2Answer, setExample2Answer] = useState<string | null>(null);

  // Anti-Cheat
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  // Pengawasan Kamera (Proctoring saat Menghafal)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const setVideoRef = (node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
    }
  };

  // 1. Inisialisasi Data & Pulihkan Status Terakhir Peserta
  useEffect(() => {
    let isMounted = true;

    const initSubtest9 = async () => {
      try {
        if (participantId === 'trial-user') {
          setIsLoading(false);
          return;
        }

        const pRef = doc(db, 'participants', participantId);
        const pSnap = await getDoc(pRef);

        if (pSnap.exists() && isMounted) {
          const data = pSnap.data();
          const testTimers = data.testTimers || {};
          const subtestLog = data.subtestLogs?.[subtestId] || {};
          const savedAnswers = data.answers?.[subtestId] || {};

          // Hybrid Auto-Save: Load from localStorage
          const localKey = `nia_answers_${participantId}_${subtestId}`;
          let localAnswers = {};
          try {
            const stored = localStorage.getItem(localKey);
            if (stored) {
              localAnswers = JSON.parse(stored);
            }
          } catch (e) {}

          const mergedAnswers = { ...(savedAnswers || {}), ...localAnswers };
          setAnswers(mergedAnswers);

          if (subtestLog.lastPage !== undefined) {
            setCurrentPage(subtestLog.lastPage);
          } else {
            setCurrentPage(0);
          }

          const memStart = testTimers[`${subtestId}_memorize`] || subtestLog.memorizeStartedAt;
          const exStart = testTimers[subtestId] || subtestLog.examStartedAt;

          // Cek apakah sudah pernah masuk tahap Ujian (Exam)
          if (exStart) {
            examStartTimeRef.current = exStart;
            const elapsed = Date.now() - exStart;
            const remaining = examDurationMs - elapsed;

            if (remaining <= 0) {
              setExamTimeLeft(0);
              setIsTimeUpModal(true);
              setStage('exam');
            } else {
              setExamTimeLeft(Math.floor(remaining / 1000));
              setStage('exam');
            }
          } 
          // Cek apakah sudah lewat tahap Instruksi 2 atau Menghafal sudah selesai
          else if (subtestLog.stage === 'instruction_2' || (memStart && Date.now() - memStart >= memorizeDurationMs)) {
            setStage('instruction_2');
          } 
          // Cek apakah sedang dalam tahap Menghafal
          else if (memStart) {
            memorizeStartTimeRef.current = memStart;
            const elapsed = Date.now() - memStart;
            const remaining = memorizeDurationMs - elapsed;

            if (remaining <= 0) {
              // Waktu menghafal sudah habis saat peserta kembali
              setStage('instruction_2');
            } else {
              setMemorizeTimeLeft(Math.floor(remaining / 1000));
              setStage('memorizing');
            }
          } else {
            // Belum pernah mulai sama sekali atau baru di-reset oleh admin
            setStage('instruction_1');
            memorizeStartTimeRef.current = null;
            examStartTimeRef.current = null;
            setMemorizeTimeLeft(null);
            setExamTimeLeft(null);
            setAnswers({});
            setCurrentPage(0);
          }
        }
      } catch (err) {
        console.error("Gagal menginisialisasi Subtes 9:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initSubtest9();

    return () => {
      isMounted = false;
    };
  }, [participantId, subtestId, examDurationMs, memorizeDurationMs]);

  // 2. Timer Loop untuk Fase Menghafal (3 Menit)
  useEffect(() => {
    if (stage !== 'memorizing' || !memorizeStartTimeRef.current) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - (memorizeStartTimeRef.current || 0);
      const remaining = memorizeDurationMs - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        setMemorizeTimeLeft(0);
        handleFinishMemorizing();
      } else {
        setMemorizeTimeLeft(Math.ceil(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, memorizeDurationMs]);

  // 3. Timer Loop untuk Fase Pengerjaan Soal (6 Menit)
  useEffect(() => {
    if (stage !== 'exam' || !examStartTimeRef.current) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - (examStartTimeRef.current || 0);
      const remaining = examDurationMs - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        setExamTimeLeft(0);
        setIsTimeUpModal(true);
        forceFinishExam();
      } else {
        setExamTimeLeft(Math.ceil(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, examDurationMs]);

  // 4. Anti-Cheat: Deteksi Pergantian Tab / Jendela
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
      } else {
        setIsWindowBlurred(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Efek Pengawasan Kamera Aktif selama Fase Menghafal (Mencegah Memfoto / Mencatat)
  useEffect(() => {
    let isMounted = true;

    if (stage === 'memorizing') {
      const startProctorCamera = async () => {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            if (!isMounted) {
              stream.getTracks().forEach(t => t.stop());
              return;
            }
            streamRef.current = stream;
            setCameraActive(true);
            setCameraError('');
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } else {
            if (isMounted) setCameraError('Browser tidak mendukung akses kamera.');
          }
        } catch (err: any) {
          console.warn("Proctor camera warning:", err);
          if (isMounted) {
            setCameraActive(false);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              setCameraError('Akses kamera ditolak. Harap izinkan kamera pada browser.');
            } else {
              setCameraError('Kamera tidak terdeteksi.');
            }
          }
        }
      };

      startProctorCamera();
    } else {
      // Matikan kamera jika tidak di fase menghafal
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setCameraActive(false);
      }
    }

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [stage]);

  // Format Waktu MM:SS
  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // AKSI: Mulai Menghafal (Pindah ke Tahap 2)
  const handleStartMemorizing = async () => {
    const now = Date.now();
    memorizeStartTimeRef.current = now;
    setMemorizeTimeLeft(Math.floor(memorizeDurationMs / 1000));
    setStage('memorizing');

    if (participantId !== 'trial-user') {
      try {
        const pRef = doc(db, 'participants', participantId);
        await updateDoc(pRef, {
          [`testTimers.${subtestId}_memorize`]: now,
          [`subtestLogs.${subtestId}.startedAt`]: now,
          [`subtestLogs.${subtestId}.memorizeStartedAt`]: now,
          [`subtestLogs.${subtestId}.stage`]: 'memorizing',
          [`subtestLogs.${subtestId}.status`]: 'in_progress',
          [`subtestLogs.${subtestId}.subtestName`]: subtestName,
        });
      } catch (e) {
        console.error("Gagal mencatat timer menghafal:", e);
      }
    }
  };

  // AKSI: Selesai Menghafal (Pindah ke Tahap 3: Instruksi 2 & Contoh Soal)
  const handleFinishMemorizing = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
    setStage('instruction_2');

    if (participantId !== 'trial-user') {
      try {
        const pRef = doc(db, 'participants', participantId);
        await updateDoc(pRef, {
          [`subtestLogs.${subtestId}.stage`]: 'instruction_2',
          [`subtestLogs.${subtestId}.memorizeFinishedAt`]: Date.now(),
        });
      } catch (e) {
        console.error("Gagal mengupdate tahap instruksi 2:", e);
      }
    }
  };

  // AKSI: Mulai Mengerjakan Soal (Pindah ke Tahap 4: Soal Ujian)
  const handleStartExam = async () => {
    const now = Date.now();
    examStartTimeRef.current = now;
    setExamTimeLeft(Math.floor(examDurationMs / 1000));
    setStage('exam');

    if (participantId !== 'trial-user') {
      try {
        const pRef = doc(db, 'participants', participantId);
        await updateDoc(pRef, {
          [`testTimers.${subtestId}`]: now,
          [`subtestLogs.${subtestId}.examStartedAt`]: now,
          [`subtestLogs.${subtestId}.stage`]: 'exam',
          [`subtestLogs.${subtestId}.timeLimitMinutes`]: examDurationMinutes,
        });
      } catch (e) {
        console.error("Gagal mencatat timer ujian:", e);
      }
    }
  };

  // Simpan Jawaban Halaman Saat Ini (Batch Write ke Firestore sesuai aturan)
  const saveCurrentPageAnswers = async (targetPage = currentPage) => {
    if (participantId === 'trial-user') return;

    setIsSaving(true);
    try {
      const startIdx = targetPage * 10;
      const endIdx = Math.min(startIdx + 10, ME_QUESTIONS.length);

      const updates: Record<string, any> = {};
      for (let i = startIdx; i < endIdx; i++) {
        if (answers[i]) {
          updates[`answers.${subtestId}.${i}`] = answers[i];
        }
      }
      updates[`subtestLogs.${subtestId}.lastPage`] = targetPage;

      if (Object.keys(updates).length > 0) {
        const pRef = doc(db, 'participants', participantId);
        await updateDoc(pRef, updates);
      }
    } catch (err) {
      console.error("Gagal menyimpan jawaban halaman:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Navigasi Paginasi Halaman (10 soal per halaman)
  const handleNextPage = async () => {
    await saveCurrentPageAnswers(currentPage);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = async () => {
    await saveCurrentPageAnswers(currentPage);
    setCurrentPage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pemilihan Jawaban Soal
  const handleSelectAnswer = (questionIdx: number, optionKey: string) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionIdx]: optionKey };
      try {
        localStorage.setItem(`nia_answers_${participantId}_${subtestId}`, JSON.stringify(newAnswers));
      } catch (e) {}
      return newAnswers;
    });
  };

  const clearLocalAnswers = () => {
    try {
      localStorage.removeItem(`nia_answers_${participantId}_${subtestId}`);
    } catch (e) {}
  };

  // Pengumpulan Ujian Selesai
  const handleSubmitExam = async () => {
    setIsSaving(true);
    try {
      if (isSimulation || participantId === 'trial-user') {
        const elapsedSeconds = Math.max(1, (examDurationMinutes * 60) - (examTimeLeft || 0));
        const evalResult = evaluateSingleSubtestResult('ist_9', subtestName || 'Subtes 9 (ME) - Mengingat Kata', answers, 21);
        setSimulationEvaluation(evalResult);
        setSimTimeSpent(elapsedSeconds);
        setShowScorecardModal(true);
        setShowSubmitModal(false);
        if (onSimulationFinish) {
          onSimulationFinish(evalResult, elapsedSeconds);
        }
        return;
      }

      if (participantId !== 'trial-user') {
        const updates: Record<string, any> = {
          [`completedTests.${subtestId}`]: true,
          [`subtestLogs.${subtestId}.status`]: 'completed',
          [`subtestLogs.${subtestId}.stage`]: 'completed',
          [`subtestLogs.${subtestId}.finishedAt`]: Date.now(),
          [`subtestLogs.${subtestId}.finishReason`]: 'submitted_by_user',
        };

        // Simpan semua jawaban yang ada
        Object.entries(answers).forEach(([idx, val]) => {
          updates[`answers.${subtestId}.${idx}`] = val;
        });

        const pRef = doc(db, 'participants', participantId);
        await updateDoc(pRef, updates);
      }
      setShowSubmitModal(false);
      clearLocalAnswers();
      onFinish();
    } catch (err) {
      console.error("Gagal mengirim jawaban:", err);
      alert("Terjadi kendala jaringan saat menyimpan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  // Waktu Ujian Habis (Auto Submit)
  const forceFinishExam = async () => {
    if (isSimulation || participantId === 'trial-user') {
      const elapsedSeconds = examDurationMinutes * 60;
      const evalResult = evaluateSingleSubtestResult('ist_9', subtestName || 'Subtes 9 (ME) - Mengingat Kata', answers, 21);
      setSimulationEvaluation(evalResult);
      setSimTimeSpent(elapsedSeconds);
      setShowScorecardModal(true);
      setShowSubmitModal(false);
      setIsTimeUpModal(false);
      if (onSimulationFinish) {
        onSimulationFinish(evalResult, elapsedSeconds);
      }
      return;
    }

    if (participantId !== 'trial-user') {
      try {
        const updates: Record<string, any> = {
          [`completedTests.${subtestId}`]: true,
          [`subtestLogs.${subtestId}.status`]: 'completed',
          [`subtestLogs.${subtestId}.stage`]: 'completed',
          [`subtestLogs.${subtestId}.finishedAt`]: Date.now(),
          [`subtestLogs.${subtestId}.finishReason`]: 'time_out',
        };

        Object.entries(answers).forEach(([idx, val]) => {
          updates[`answers.${subtestId}.${idx}`] = val;
        });

        const pRef = doc(db, 'participants', participantId);
        await updateDoc(pRef, updates);
      } catch (err) {
        console.error("Gagal auto-submit:", err);
      }
    }
  };

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showMemorizeConfirm, setShowMemorizeConfirm] = useState(false);

  // Keluar ke Dashboard (Waktu tetap berjalan di latar belakang)
  const handleExitToDashboard = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = async () => {
    setShowExitConfirm(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
    if (stage === 'exam') {
      await saveCurrentPageAnswers(currentPage);
    }
    onCancel();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat Subtes 9 (ME: Ingatan)...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TAHAP 1: INSTRUKSI PERTAMA (Instruksi Menghafal)
  // =========================================================================
  if (stage === 'instruction_1') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-10 select-none">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 sm:p-8 text-white relative">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              <span className="text-amber-400 font-semibold text-xs tracking-wider uppercase">Bagian 1: Instruksi Menghafal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">{subtestName}</h2>
            <p className="text-gray-300 text-sm mt-1">Tes Daya Ingatan / Memori (ME: Merkaufgaben)</p>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="font-bold text-amber-900 text-base mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                Petunjuk Penting Menghafal:
              </h3>
              <p className="text-amber-900 text-sm leading-relaxed mb-3">
                <strong>Disediakan waktu 3 menit</strong> untuk menghafalkan kata-kata yang akan ditampilkan pada lembar berikutnya.
              </p>
              <ul className="text-amber-800 text-xs sm:text-sm list-disc list-inside space-y-2 font-medium">
                <li>Peserta boleh mengingat dengan cara apa pun, <strong>namun dilarang keras menulis, mencatat, ataupun memotret</strong> kata-kata tersebut.</li>
                <li>Hafalkan kata-kata tersebut dengan sebaik-baiknya.</li>
              </ul>
            </div>

            {/* Peringatan Pengawasan Kamera */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs sm:text-sm text-rose-900 flex items-start gap-3">
              <div className="p-2 bg-rose-100 rounded-lg shrink-0 mt-0.5">
                <Camera className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="font-bold text-rose-950 mb-0.5">Pengawasan Kamera Aktif:</p>
                <p className="text-rose-800 leading-relaxed">
                  Pada lembar menghafal, <strong>kamera pengawas akan menyala secara langsung</strong> untuk memantau integritas ujian. Dilarang keras membuka buku catatan, menggunakan alat tulis, atau mengarahkan kamera ponsel ke layar monitor.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs sm:text-sm text-blue-900">
              <p className="font-semibold mb-1">ℹ️ Alur Pengerjaan:</p>
              <p>Setelah Anda menekan tombol di bawah, Anda akan masuk ke <strong>Lembar Menghafal</strong> dan timer 3 menit langsung berjalan. Begitu waktu 3 menit habis, lembar kata akan ditutup secara otomatis dan Anda tidak dapat melihatnya lagi.</p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={onCancel}
                className="w-full sm:w-1/3 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm cursor-pointer"
              >
                Kembali ke Dashboard
              </button>
              <button
                onClick={handleStartMemorizing}
                className="w-full sm:w-2/3 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <span>Mulai Menghafal (3 Menit)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TAHAP 2: LEMBAR MENGHAFAL KATA (Halaman Kerja 1 - Timer 3 Menit)
  // =========================================================================
  if (stage === 'memorizing') {
    return (
      <div 
        className={`min-h-screen bg-gray-50 flex flex-col select-none transition-all ${
          isWindowBlurred ? 'filter blur-md pointer-events-none' : ''
        }`}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Sticky Header with Timer */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExitToDashboard}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer"
              title="Keluar ke Dashboard (Waktu tetap berjalan)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Fase Menghafal Kata (Subtes 9)</h2>
              </div>
              <p className="text-xs text-gray-500">Hafalkan 25 kata beserta kategorinya di bawah ini</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {cameraActive && (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1.5 rounded-full text-xs font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                <span className="hidden sm:inline">Kamera Aktif</span>
                <span className="sm:hidden">Live</span>
              </div>
            )}
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-base sm:text-lg ${
              memorizeTimeLeft !== null && memorizeTimeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-amber-100 text-amber-800'
            }`}>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{formatTime(memorizeTimeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-rose-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-inner">
          <Eye className="w-4 h-4 shrink-0" />
          <span>Disediakan waktu 3 menit untuk menghafal. Dilarang keras memotret atau mencatat kata-kata! Kamera pengawas aktif memantau Anda.</span>
        </div>

        {/* Daftar Kata Hafalan (Grid 5 Kategori) */}
        <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MEMORY_CATEGORIES.map((cat, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Accent Top Bar */}
                <div className={`h-2 w-full bg-gradient-to-r ${cat.color} absolute top-0 left-0`}></div>

                {/* Category Title */}
                <div className="flex items-center justify-between mb-4 mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wider ${cat.badgeBg}`}>
                    {cat.category}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">5 Kata</span>
                </div>

                {/* Word List */}
                <div className="space-y-2">
                  {cat.words.map((w, wIdx) => (
                    <div 
                      key={wIdx}
                      className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-100/70 transition-colors"
                    >
                      <span className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        {w.initial}
                      </span>
                      <span className="text-gray-900 font-bold text-base tracking-wide">
                        {w.word}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Live Camera Proctoring Card */}
            <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl p-5 text-white flex flex-col justify-between shadow-md border border-gray-800 relative overflow-hidden">
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-rose-400 tracking-wide uppercase">Kamera Pengawas Aktif</span>
                  </div>
                  <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                    LIVE PROCTORING
                  </span>
                </div>

                {/* Video Feed Box */}
                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-700/80 shadow-inner flex items-center justify-center mb-3">
                  {cameraActive ? (
                    <>
                      <video 
                        ref={setVideoRef}
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        LIVE FEED
                      </div>
                      <div className="absolute bottom-2 right-2 text-[10px] bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-gray-300 font-mono">
                        MONITORING
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Camera className="w-8 h-8 text-gray-500 mx-auto mb-2 animate-pulse" />
                      <p className="text-[11px] text-gray-400 leading-tight">
                        {cameraError || 'Mengaktifkan kamera pengawas...'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Anti-Cheat Warning */}
                <div className="bg-rose-950/50 border border-rose-800/60 rounded-xl p-3 text-xs text-rose-200">
                  <p className="font-bold text-rose-300 flex items-center gap-1.5 mb-1 text-[12px]">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    Peringatan Anti-Kecurangan:
                  </p>
                  <p className="text-[11px] leading-relaxed text-rose-200/90">
                    Dilarang <strong>memotret layar</strong> menggunakan ponsel atau <strong>mencatat</strong> kata-kata. Gerak-gerik dan pandangan mata Anda diawasi langsung oleh sistem.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 mt-3 border-t border-gray-800">
                <button
                  onClick={() => setShowMemorizeConfirm(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs sm:text-sm transition-all shadow cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Saya Sudah Selesai Menghafal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TAHAP 3: INSTRUKSI KEDUA (Instruksi Pengerjaan Soal & Contoh)
  // Kata-kata hafalan SUDAH DITUTUP TOTAL dan TIDAK DITAMPILKAN LAGI
  // =========================================================================
  if (stage === 'instruction_2') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-10 select-none">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 sm:p-8 text-white relative">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-300" />
              <span className="text-emerald-300 font-semibold text-xs tracking-wider uppercase">Bagian 2: Instruksi Pengerjaan Soal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">SELESAI MENGHAFAL</h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              Waktu menghafal telah selesai. Daftar kata telah ditutup dan tidak dapat dilihat lagi.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 text-gray-800 text-xs sm:text-sm leading-relaxed">
              <p className="font-semibold text-gray-900 mb-2">
                Petunjuk Pengerjaan:
              </p>
              <p className="mb-2">
                Pada bagian ini, terdapat <strong>20 pertanyaan</strong> mengenai kata-kata yang telah saudara hafalkan tadi.
                Pilihlah salah satu dari 5 kelompok kategori di belakang nomor soal yang sesuai dengan huruf permulaan kata tersebut:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3 text-center font-bold text-xs sm:text-sm">
                <span className="bg-purple-100 text-purple-800 py-1.5 px-2 rounded-lg border border-purple-200">a. Kesenian</span>
                <span className="bg-emerald-100 text-emerald-800 py-1.5 px-2 rounded-lg border border-emerald-200">b. Binatang</span>
                <span className="bg-amber-100 text-amber-800 py-1.5 px-2 rounded-lg border border-amber-200">c. Perkakas</span>
                <span className="bg-sky-100 text-sky-800 py-1.5 px-2 rounded-lg border border-sky-200">d. Burung</span>
                <span className="bg-rose-100 text-rose-800 py-1.5 px-2 rounded-lg border border-rose-200">e. Bunga</span>
              </div>
            </div>

            {/* Contoh 01 */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-3 bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <span className="bg-gray-900 text-white text-xs font-bold px-2 py-0.5 rounded">Contoh 01</span>
                <span className="text-sm font-bold text-gray-800">Huruf Permulaan — Q</span>
              </div>
              <p className="text-sm text-gray-700">
                01. Kata yang mempunyai huruf permulaan — <strong>Q</strong> — adalah suatu ...
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SUBTEST9_OPTIONS.map(opt => {
                  const isSelected = example1Answer === opt.key;
                  const isCorrectAnswer = opt.key === 'a';
                  let btnStyle = 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-emerald-400';
                  
                  if (example1Answer !== null) {
                    if (isSelected && isCorrectAnswer) {
                      btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs';
                    } else if (isSelected && !isCorrectAnswer) {
                      btnStyle = 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs';
                    } else if (!isSelected && isCorrectAnswer) {
                      btnStyle = 'bg-emerald-50 text-emerald-800 border-emerald-400 font-semibold';
                    } else {
                      btnStyle = 'bg-gray-50/60 border-gray-200 text-gray-400';
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setExample1Answer(opt.key)}
                      className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold border transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${btnStyle}`}
                    >
                      {example1Answer !== null && isSelected && isCorrectAnswer && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                      {example1Answer !== null && isSelected && !isCorrectAnswer && (
                        <XCircle className="w-3.5 h-3.5 text-white" />
                      )}
                      <span>{opt.key}. {opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {example1Answer === null ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 py-2.5 px-3 rounded-lg border border-dashed border-gray-300">
                  <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Silakan coba klik salah satu pilihan di atas untuk menjawab dan melihat pembahasannya.</span>
                </div>
              ) : example1Answer === 'a' ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-xs sm:text-sm text-emerald-950 animate-in fade-in slide-in-from-top-2 duration-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Jawaban Anda Benar! (a. kesenian)</span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed pl-5.5">
                    <strong>Penjelasan Contoh 01:</strong> Kata yang berawalan <strong>Q</strong> pada daftar hafalan tadi adalah <em>Quintet</em>, yang termasuk dalam jenis <strong>Kesenian</strong>. Sehingga jawaban yang tepat adalah <strong>a (kesenian)</strong>.
                  </p>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs sm:text-sm text-rose-950 animate-in fade-in slide-in-from-top-2 duration-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Pilihan Anda Belum Tepat ({example1Answer}. {SUBTEST9_OPTIONS.find(o => o.key === example1Answer)?.label})</span>
                  </div>
                  <p className="text-rose-900 leading-relaxed pl-5.5">
                    <strong>Penjelasan Contoh 01:</strong> Kata yang berawalan <strong>Q</strong> pada daftar hafalan tadi adalah <em>Quintet</em>, yang termasuk dalam jenis <strong>Kesenian</strong>. Jawaban yang benar adalah <strong>a (kesenian)</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Contoh 02 */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-3 bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <span className="bg-gray-900 text-white text-xs font-bold px-2 py-0.5 rounded">Contoh 02</span>
                <span className="text-sm font-bold text-gray-800">Huruf Permulaan — Z</span>
              </div>
              <p className="text-sm text-gray-700">
                02. Kata yang mempunyai huruf permulaan — <strong>Z</strong> — adalah suatu ...
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SUBTEST9_OPTIONS.map(opt => {
                  const isSelected = example2Answer === opt.key;
                  const isCorrectAnswer = opt.key === 'b';
                  let btnStyle = 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-emerald-400';
                  
                  if (example2Answer !== null) {
                    if (isSelected && isCorrectAnswer) {
                      btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs';
                    } else if (isSelected && !isCorrectAnswer) {
                      btnStyle = 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs';
                    } else if (!isSelected && isCorrectAnswer) {
                      btnStyle = 'bg-emerald-50 text-emerald-800 border-emerald-400 font-semibold';
                    } else {
                      btnStyle = 'bg-gray-50/60 border-gray-200 text-gray-400';
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setExample2Answer(opt.key)}
                      className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold border transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${btnStyle}`}
                    >
                      {example2Answer !== null && isSelected && isCorrectAnswer && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                      {example2Answer !== null && isSelected && !isCorrectAnswer && (
                        <XCircle className="w-3.5 h-3.5 text-white" />
                      )}
                      <span>{opt.key}. {opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {example2Answer === null ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 py-2.5 px-3 rounded-lg border border-dashed border-gray-300">
                  <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Silakan coba klik salah satu pilihan di atas untuk menjawab dan melihat pembahasannya.</span>
                </div>
              ) : example2Answer === 'b' ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-xs sm:text-sm text-emerald-950 animate-in fade-in slide-in-from-top-2 duration-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Jawaban Anda Benar! (b. binatang)</span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed pl-5.5">
                    <strong>Penjelasan Contoh 02:</strong> Kata yang berawalan <strong>Z</strong> pada daftar hafalan tadi adalah <em>Zebra</em>, yang termasuk dalam jenis <strong>Binatang</strong>. Sehingga jawaban yang tepat adalah <strong>b (binatang)</strong>.
                  </p>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs sm:text-sm text-rose-950 animate-in fade-in slide-in-from-top-2 duration-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Pilihan Anda Belum Tepat ({example2Answer}. {SUBTEST9_OPTIONS.find(o => o.key === example2Answer)?.label})</span>
                  </div>
                  <p className="text-rose-900 leading-relaxed pl-5.5">
                    <strong>Penjelasan Contoh 02:</strong> Kata yang berawalan <strong>Z</strong> pada daftar hafalan tadi adalah <em>Zebra</em>, yang termasuk dalam jenis <strong>Binatang</strong>. Jawaban yang benar adalah <strong>b (binatang)</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Tombol Mulai Pengerjaan Soal */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button
                onClick={onCancel}
                className="w-full sm:w-1/3 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm cursor-pointer"
              >
                Ke Dashboard
              </button>
              <button
                onClick={handleStartExam}
                className="w-full sm:w-2/3 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <span>Mulai Mengerjakan Soal ({examDurationMinutes} Menit)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TAHAP 4: LEMBAR SOAL UJIAN (Halaman Kerja 2 - 20 Soal dengan Timer 6 Menit)
  // Paginasi: 10 soal per halaman (Hal 1: 157-166, Hal 2: 167-176)
  // =========================================================================
  const startIdx = currentPage * 10;
  const endIdx = Math.min(startIdx + 10, ME_QUESTIONS.length);
  const currentQuestions = ME_QUESTIONS.slice(startIdx, endIdx);
  const answeredCount = Object.keys(answers).length;

  return (
    <div 
      className={`min-h-screen bg-gray-50 flex flex-col select-none transition-all ${
        isWindowBlurred ? 'filter blur-md pointer-events-none' : ''
      }`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Sticky Header with Timer */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExitToDashboard}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer"
            title="Keluar ke Dashboard (Waktu tetap berjalan)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">{subtestName}</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Soal {startIdx + 1} - {endIdx} dari 20 (Terjawab: {answeredCount}/20)
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${
          examTimeLeft !== null && examTimeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-800'
        }`}>
          <Clock className="w-5 h-5" />
          <span>{formatTime(examTimeLeft)}</span>
        </div>
      </div>

      {/* Main Questions Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-24">
        {/* Status Tab Navigation */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm">
          <span className="font-bold text-gray-700">
            Halaman {currentPage + 1} dari 2
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (currentPage === 1) handlePrevPage();
              }}
              className={`px-3 py-1 rounded-lg font-semibold text-xs border ${
                currentPage === 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Soal 157 - 166
            </button>
            <button
              onClick={() => {
                if (currentPage === 0) handleNextPage();
              }}
              className={`px-3 py-1 rounded-lg font-semibold text-xs border ${
                currentPage === 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Soal 167 - 176
            </button>
          </div>
        </div>

        {/* Question Cards */}
        <div className="space-y-4">
          {currentQuestions.map((q, localIdx) => {
            const globalIdx = startIdx + localIdx;
            const selectedOpt = answers[globalIdx];

            return (
              <div 
                key={q.no}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-sm hover:border-gray-300 transition-all space-y-4"
              >
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-100">
                    {q.no}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium text-sm sm:text-base">
                      Kata yang mempunyai huruf permulaan — <strong className="text-blue-600 text-lg font-bold">{q.letter}</strong> — adalah suatu ...
                    </p>
                  </div>
                </div>

                                {/* Option Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
                  {SUBTEST9_OPTIONS.map((opt) => {
                    const isSelected = selectedOpt === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectAnswer(globalIdx, opt.key)}
                        className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200' 
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {opt.key.toUpperCase()}
                        </span>
                        <span className="capitalize">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation (Batch Save on Turn / Submit) */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center justify-between mt-6">
          {currentPage === 0 ? (
            <div></div>
          ) : (
            <button
              onClick={handlePrevPage}
              disabled={isSaving}
              className="py-2.5 px-5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isSaving ? "Menyimpan..." : "Halaman Sebelumnya"}</span>
            </button>
          )}

          {currentPage === 0 ? (
            <button
              onClick={handleNextPage}
              disabled={isSaving}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all text-sm flex items-center gap-2 shadow cursor-pointer ml-auto disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isSaving ? "Menyimpan..." : "Halaman Selanjutnya"}</span>
              {!isSaving && <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={isSaving}
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-sm flex items-center gap-2 shadow cursor-pointer ml-auto disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isSaving ? "Menyimpan..." : "Kumpulkan Ujian"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Kumpulkan */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Konfirmasi Selesai Ujian
            </h3>
            <p className="text-gray-600 text-sm">
              Anda telah menjawab <strong>{answeredCount}</strong> dari <strong>20</strong> soal.
              Apakah Anda yakin ingin mengumpulkan lembar jawaban Subtes 9 sekarang?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 text-sm cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitExam}
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isSaving ? "Menyimpan..." : "Ya, Kumpulkan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Waktu Habis */}
      {isTimeUpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Waktu Ujian Telah Habis!</h3>
            <p className="text-gray-600 text-sm">
              Waktu pengerjaan Subtes 9 telah selesai. Seluruh jawaban yang telah Anda pilih tersimpan secara otomatis.
            </p>
            <button
              onClick={() => {
                setIsTimeUpModal(false);
                onFinish();
              }}
              className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow cursor-pointer"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirm Exit Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Keluar ke Dashboard?</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Yakin ingin keluar ke dashboard? Waktu subtes akan terus berjalan di latar belakang.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Memorize Modal */}
      {showMemorizeConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Selesai Menghafal?</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Apakah Anda sudah yakin hafal seluruh kata dan ingin mengakhiri sesi menghafal lebih awal?<br/><br/>
              (Perhatian: Daftar kata akan ditutup dan tidak dapat dibuka kembali!)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMemorizeConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowMemorizeConfirm(false);
                  handleFinishMemorizing();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-[#8BC34A] hover:bg-[#7cb342] transition-colors"
              >
                Ya, Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Scorecard Modal */}
      {showScorecardModal && (
        <SimulationScorecardModal
          isOpen={showScorecardModal}
          onClose={() => {
            setShowScorecardModal(false);
            clearLocalAnswers();
            onFinish();
          }}
          evaluation={simulationEvaluation}
          timeSpentSeconds={simTimeSpent}
          onRetry={() => {
            setShowScorecardModal(false);
            setAnswers({});
            setCurrentPage(0);
            setStage('instruction_1');
          }}
          onChangeSubtest={() => {
            setShowScorecardModal(false);
            clearLocalAnswers();
            onCancel();
          }}
        />
      )}
    </div>
  );
}
