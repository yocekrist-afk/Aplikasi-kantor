import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, ChevronRight, ChevronLeft, CheckCircle2, ShieldAlert, EyeOff, ShieldCheck, Info, Delete, RotateCcw, Check, Sparkles, Play, Grid, Zap, X, CheckCheck, Loader2 } from 'lucide-react';
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { preloadMultipleImages } from '../../utils/imagePreloader';
import { AssetImage } from '../../components/AssetImage';
import { evaluateSingleSubtestResult, getSampleAnswersForSubtest, SingleSubtestEvaluation } from '../../utils/istAnswerKeys';
import { SimulationScorecardModal } from '../../components/SimulationScorecardModal';
import { getTrueTime } from '../../utils/timeServer';

export interface TestEngineProps {
  participantId: string;
  subtestId: string;
  subtestName: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  onFinish: () => void;
  onCancel: () => void;
  isSimulation?: boolean;
  disableAntiCheat?: boolean;
  autoFillSampleAnswers?: boolean;
  onSimulationFinish?: (evaluation: SingleSubtestEvaluation, timeSpentSeconds: number) => void;
}

const PAGE_SIZE = 10;

export function TestEngine({
  participantId,
  subtestId,
  subtestName,
  totalQuestions,
  timeLimitMinutes,
  onFinish,
  onCancel,
  isSimulation = false,
  disableAntiCheat = false,
  autoFillSampleAnswers = false,
  onSimulationFinish
}: TestEngineProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Simulation Scorecard States
  const [simulationEvaluation, setSimulationEvaluation] = useState<SingleSubtestEvaluation | null>(null);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [simTimeSpent, setSimTimeSpent] = useState<number>(0);
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const subtestStartTimeRef = useRef<number | null>(null);

  const rawName = (subtestName || '').toLowerCase();
  const rawId = (subtestId || '').toLowerCase();
  const name = (rawName + ' ' + rawId).replace(/subtest/g, 'subtes');
  const isRMIB = name.includes('rmib') || name.includes('minat');
  const isSubtest7 = name.includes('subtes 7') || name.includes('ist_7') || name.includes('ist 7') || name.includes('fa)') || name.includes('(fa)') || name.includes('potongan');
  const isSubtest8 = name.includes('subtes 8') || name.includes('ist_8') || name.includes('ist 8') || name.includes('wu') || name.includes('kubus');

  // Subtest 7: Halaman 1 = 12 soal (117-128, acuan bagian 1), Halaman 2 = 8 soal (129-136, acuan bagian 2)
  const totalPages = isSubtest7 ? 2 : Math.max(1, Math.ceil(totalQuestions / PAGE_SIZE));

  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>([]);
  const [isFetchingDynamic, setIsFetchingDynamic] = useState(false);
  const [optionShuffleMap, setOptionShuffleMap] = useState<Record<number, number[]>>({});

  useEffect(() => {
    const shuffleMap: Record<number, number[]> = {};
    for (let i = 0; i < totalQuestions; i++) {
        const indices = [0, 1, 2, 3, 4];
        let seed = (participantId ? participantId.length : 0) + i * 7; // Deterministic seed
        for (let j = 4; j > 0; j--) {
            seed = (seed * 9301 + 49297) % 233280;
            const rand = seed / 233280;
            const k = Math.floor(rand * (j + 1));
            [indices[j], indices[k]] = [indices[k], indices[j]];
        }
        shuffleMap[i] = indices;
    }
    setOptionShuffleMap(shuffleMap);
  }, [totalQuestions, participantId]);

  useEffect(() => {
    const fetchDynamic = async () => {
      const rawNameLower = (subtestName || '').toLowerCase();
      let colName = '';
      if (rawNameLower.includes('papi')) colName = 'soal_papi_kostick';
      else if (rawNameLower.includes('gaya belajar')) colName = 'soal_gaya_belajar';
      else if (rawNameLower.includes('sikap kerja')) colName = 'soal_sikap_kerja';
      else if (rawNameLower.includes('karakteristik') || rawNameLower.includes('kepribadian')) colName = 'soal_karakteristik';
      else if (rawNameLower.includes('kecerdasan')) colName = 'soal_kecerdasan';
      
      if (colName) {
        setIsFetchingDynamic(true);
        try {
          // Fallback to fetch without ordering if index is missing to avoid crash
          try {
            const q = query(collection(db, colName), orderBy('createdAt', 'asc'));
            const snapshot = await getDocs(q);
            setDynamicQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          } catch (err) {
            const snapshot = await getDocs(collection(db, colName));
            setDynamicQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        } catch (e) {
          console.error("Error fetching dynamic questions", e);
        }
        setIsFetchingDynamic(false);
      }
    };
    fetchDynamic();
  }, [subtestName]);


  // Anti-Capture & Security States
  const [antiCaptureActive, setAntiCaptureActive] = useState(!disableAntiCheat);
  const [tabSwitchActive, setTabSwitchActive] = useState(!disableAntiCheat);
  const [isRandomizeChoices, setIsRandomizeChoices] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningCount, setWarningCount] = useState(0);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  // Trigger security warning and log to Firestore
  const triggerCaptureWarning = (reason: string) => {
    if (disableAntiCheat) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('');
      }
    } catch (err) {}

    setWarningCount(prev => {
      const nextCount = prev + 1;
      if (participantId && participantId !== 'trial-user' && !isSimulation) {
        try {
          const pRef = doc(db, 'participants', participantId);
          updateDoc(pRef, {
            captureAttempts: nextCount,
            lastCaptureAttempt: serverTimestamp(),
            lastCaptureReason: reason
          }).catch(() => {});
        } catch (e) {}
      }
      return nextCount;
    });

    setWarningMessage(reason);
    setShowWarningModal(true);
  };

  // Sync with Admin App Settings
  useEffect(() => {
    if (disableAntiCheat) {
      setAntiCaptureActive(false);
      setTabSwitchActive(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'app_settings'), (snapshot) => {
      if (!snapshot.empty) {
        const configDocs = snapshot.docs.filter(d => d.id !== 'durasi_tes');
        if (configDocs.length > 0) {
          const config = configDocs[0].data();
          if (config.antiCapture !== undefined) {
            setAntiCaptureActive(config.antiCapture);
          } else if (config.requireAntiCheat !== undefined) {
            setAntiCaptureActive(config.requireAntiCheat); // legacy fallback
          }
          if (config.tabSwitchDetect !== undefined) {
            setTabSwitchActive(config.tabSwitchDetect);
          } else if (config.requireAntiCheat !== undefined) {
            setTabSwitchActive(config.requireAntiCheat); // legacy fallback
          }
          if (config.randomizeChoices !== undefined) {
            setIsRandomizeChoices(config.randomizeChoices);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [disableAntiCheat]);

  // Listeners for Screenshot shortcuts (PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5), Right Click, Copy, and Window Blur
  useEffect(() => {
    // 1. Right Click (Context Menu)
    const handleContextMenu = (e: MouseEvent) => {
      if (!antiCaptureActive) return;
      e.preventDefault();
      triggerCaptureWarning('Klik kanan (Context Menu) dilarang selama pengerjaan tes.');
    };

    // 2. Prevent Copy/Cut/Select
    const handleCopyPaste = (e: ClipboardEvent) => {
      if (!antiCaptureActive) return;
      e.preventDefault();
      triggerCaptureWarning('Menyalin (Copy) atau memotong (Cut) teks soal dilarang.');
    };

    // 3. Prevent Screenshot Shortcuts on KeyDown
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!antiCaptureActive) return;
      const key = e.key ? e.key.toLowerCase() : '';

      // PrintScreen key
      if (e.key === 'PrintScreen' || key === 'printscreen') {
        e.preventDefault();
        triggerCaptureWarning('Tombol PrintScreen terdeteksi! Tangkapan layar dilarang keras.');
        return;
      }

      // Windows Snipping Tool: Win + Shift + S or Ctrl + Shift + S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (key === 's' || e.code === 'KeyS')) {
        e.preventDefault();
        triggerCaptureWarning('Pintasan screenshot (Win+Shift+S / Ctrl+Shift+S) terdeteksi! Tindakan ini dilarang.');
        return;
      }

      // macOS Screenshot shortcuts: Cmd + Shift + 3 / 4 / 5
      if (e.metaKey && e.shiftKey && ['3', '4', '5', '$', '#', '%'].includes(e.key)) {
        e.preventDefault();
        triggerCaptureWarning('Pintasan tangkapan layar macOS (Cmd+Shift+3/4/5) dilarang!');
        return;
      }

      // Print page: Ctrl + P / Cmd + P
      if ((e.ctrlKey || e.metaKey) && (key === 'p' || e.code === 'KeyP')) {
        e.preventDefault();
        triggerCaptureWarning('Mencetak atau menyimpan halaman (Ctrl+P) dilarang selama tes.');
        return;
      }

      // Save page: Ctrl + S / Cmd + S
      if ((e.ctrlKey || e.metaKey) && (key === 's' || e.code === 'KeyS')) {
        e.preventDefault();
        triggerCaptureWarning('Menyimpan halaman web dilarang.');
        return;
      }

      // Developer Tools: F12, Ctrl + Shift + I/J/C
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key))
      ) {
        e.preventDefault();
        triggerCaptureWarning('Developer Tools & inspeksi elemen dilarang selama ujian.');
        return;
      }
    };

    // 4. Also listen on KeyUp for PrintScreen (Windows browsers often only register PrintScreen on keyup)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!antiCaptureActive) return;
      if (e.key === 'PrintScreen' || (e.key && e.key.toLowerCase() === 'printscreen')) {
        e.preventDefault();
        triggerCaptureWarning('Tombol PrintScreen terdeteksi! Tangkapan layar dilarang keras.');
      }
    };

    // 5. Window Blur & Visibility (obfuscates content if participant switches window or triggers Snipping tool)
    const handleWindowBlur = () => {
      if (tabSwitchActive) {
        setIsWindowBlurred(true);
        if (participantId && participantId !== 'trial-user') {
          addDoc(collection(db, 'activity_logs'), {
            action: 'VIOLATION_TAB_SWITCH',
            description: `Peserta meninggalkan tab/jendela (Blur) saat mengerjakan subtes ${subtestName}`,
            performedBy: participantId,
            target: subtestName,
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
          }).catch(console.error);
        }
      }
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (tabSwitchActive && document.hidden) {
        setIsWindowBlurred(true);
        if (participantId && participantId !== 'trial-user') {
          addDoc(collection(db, 'activity_logs'), {
            action: 'VIOLATION_TAB_HIDDEN',
            description: `Peserta menyembunyikan tab browser (Hidden) saat mengerjakan subtes ${subtestName}`,
            performedBy: participantId,
            target: subtestName,
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
          }).catch(console.error);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // CSS print blocking
    const style = document.createElement('style');
    if (antiCaptureActive) {
      style.innerHTML = `
        @media print {
          body * { display: none !important; }
          body:after {
            content: 'Peringatan: Mencetak dan mengambil tangkapan layar soal dilarang keras!';
            font-size: 20pt;
            font-weight: bold;
            color: red;
            text-align: center;
            padding-top: 100px;
            display: block !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [antiCaptureActive, tabSwitchActive]);

  
  // Load initial session / answers
  useEffect(() => {
    let interval: any;

    const initializeTest = async () => {
      try {
        if (participantId === 'trial-user' || isSimulation) {
          const startTime = await getTrueTime();
          subtestStartTimeRef.current = startTime;
          const limitMs = timeLimitMinutes * 60 * 1000;
          setTimeLeft(Math.floor(limitMs / 1000));

          if (autoFillSampleAnswers) {
            const sample = getSampleAnswersForSubtest(subtestId, subtestName);
            setAnswers(sample);
          }

          interval = setInterval(async () => {
            const now = await getTrueTime();
            const currentRemaining = limitMs - (now - startTime);
            if (currentRemaining <= 0) {
              clearInterval(interval);
              setTimeLeft(0);
              setIsTimeUp(true);
            } else {
              setTimeLeft(Math.floor(currentRemaining / 1000));
            }
          }, 1000);
          return;
        }

        const pRef = doc(db, 'participants', participantId);
        const pSnap = await getDoc(pRef);
        
        if (pSnap.exists()) {
          const data = pSnap.data();
          
          // Load previous answers from server
          const serverAnswers = (data.answers && data.answers[subtestId]) || {};
          
          // Hybrid Auto-Save: Load from localStorage
          const localKey = `nia_answers_${participantId}_${subtestId}`;
          let localAnswers = {};
          try {
            const stored = localStorage.getItem(localKey);
            if (stored) {
              localAnswers = JSON.parse(stored);
            }
          } catch (e) {
            console.error('Failed to parse local answers', e);
          }

          // Local answers override server answers if there's any newer un-synced data
          setAnswers({ ...serverAnswers, ...localAnswers });

          // Restore last viewed page if available
          if (data.subtestLogs?.[subtestId]?.lastPage !== undefined) {
            setCurrentPage(data.subtestLogs[subtestId].lastPage);
          }

          // Handle server-based timer
          const testTimers = data.testTimers || {};
          let startTime = testTimers[subtestId];
          const currentTime = await getTrueTime();
          
          if (!startTime) {
            // First time starting this subtest
            startTime = currentTime;
            if (participantId !== 'trial-user') {
              await updateDoc(pRef, {
                [`testTimers.${subtestId}`]: startTime,
                [`subtestLogs.${subtestId}.startedAt`]: startTime,
                [`subtestLogs.${subtestId}.subtestId`]: subtestId,
                [`subtestLogs.${subtestId}.subtestName`]: subtestName,
                [`subtestLogs.${subtestId}.timeLimitMinutes`]: timeLimitMinutes,
                [`subtestLogs.${subtestId}.status`]: 'in_progress'
              });
            }
          }
          subtestStartTimeRef.current = startTime;

          const limitMs = timeLimitMinutes * 60 * 1000;
          const remainingMs = limitMs - (currentTime - startTime);

          if (remainingMs <= 0) {
            setTimeLeft(0);
            setIsTimeUp(true);
          } else {
            setTimeLeft(Math.floor(remainingMs / 1000));
            // Update time left every second based on robust performance.now()
            interval = setInterval(async () => {
              const now = await getTrueTime();
              const currentRemaining = limitMs - (now - startTime);
              if (currentRemaining <= 0) {
                clearInterval(interval);
                setTimeLeft(0);
                setIsTimeUp(true);
              } else {
                setTimeLeft(Math.floor(currentRemaining / 1000));
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Error initializing test:", error);
      }
    };

    initializeTest();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [participantId, subtestId, timeLimitMinutes]);

  const handleOptionSelect = (qIndex: number, option: string) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev, [qIndex]: option };
      // Hybrid Auto-Save: Sync to localStorage instantly
      try {
        localStorage.setItem(`nia_answers_${participantId}_${subtestId}`, JSON.stringify(newAnswers));
      } catch (e) {
        console.warn('Failed to save to localStorage', e);
      }
      return newAnswers;
    });
  };

  const clearLocalAnswers = () => {
    try {
      localStorage.removeItem(`nia_answers_${participantId}_${subtestId}`);
    } catch (e) {}
  };

  const saveCurrentPage = async () => {
    setIsSaving(true);
    try {
      // Determine questions on current page (Khusus Subtes 7: Hal 1 = 12 soal [0-11], Hal 2 = 8 soal [12-19])
      let startIdx = currentPage * PAGE_SIZE;
      let endIdx = Math.min(startIdx + PAGE_SIZE, totalQuestions);
      if (isSubtest7) {
        if (currentPage === 0) {
          startIdx = 0;
          endIdx = 12;
        } else {
          startIdx = 12;
          endIdx = Math.min(20, totalQuestions);
        }
      }
      
      const updates: Record<string, any> = {};
      for (let i = startIdx; i < endIdx; i++) {
        if (answers[i]) {
          updates[`answers.${subtestId}.${i}`] = answers[i];
        }
      }
      // Save last active page
      updates[`subtestLogs.${subtestId}.lastPage`] = currentPage;

      if (Object.keys(updates).length > 0) {
        if (participantId === 'trial-user' || isSimulation) {
          console.log('Simulasi mode: jawaban tidak disimpan ke server (page turn)');
        } else {
          // Batch write to Firebase ONLY on page turn
          const pRef = doc(db, 'participants', participantId);
          await updateDoc(pRef, updates);
        }
      }
    } catch (error) {
      console.error("Gagal menyimpan jawaban:", error);
      alert("Koneksi tidak stabil, jawaban disimpan di perangkat. Pastikan internet Anda aktif.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextPage = async () => {
    await saveCurrentPage();
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = async () => {
    await saveCurrentPage();
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = () => {
    setShowConfirmFinish(true);
  };

  const handleConfirmFinish = async () => {
    setShowConfirmFinish(false);
    await saveCurrentPage();
    
    const finishTime = await getTrueTime();
    const effectiveStart = subtestStartTimeRef.current || (finishTime - (timeLimitMinutes * 60 - (timeLeft || 0)) * 1000);
    const elapsedSeconds = Math.max(1, Math.round((finishTime - effectiveStart) / 1000));

    if (isSimulation || participantId === 'trial-user') {
      const evalResult = evaluateSingleSubtestResult(subtestId, subtestName, answers, 21);
      setSimulationEvaluation(evalResult);
      setSimTimeSpent(elapsedSeconds);
      setShowScorecardModal(true);
      if (onSimulationFinish) {
        onSimulationFinish(evalResult, elapsedSeconds);
      }
      return;
    }

    // Mark as completed
    if (participantId !== 'trial-user') {
      const pRef = doc(db, 'participants', participantId);
      const updates: Record<string, any> = {
        [`completedTests.${subtestId}`]: true,
        [`subtestLogs.${subtestId}.startedAt`]: effectiveStart,
        [`subtestLogs.${subtestId}.finishedAt`]: finishTime,
        [`subtestLogs.${subtestId}.durationSeconds`]: elapsedSeconds,
        [`subtestLogs.${subtestId}.subtestId`]: subtestId,
        [`subtestLogs.${subtestId}.subtestName`]: subtestName,
        [`subtestLogs.${subtestId}.timeLimitMinutes`]: timeLimitMinutes,
        [`subtestLogs.${subtestId}.status`]: 'completed',
        [`subtestLogs.${subtestId}.finishReason`]: 'manual_submit'
      };
      Object.entries(answers).forEach(([idx, val]) => {
        if (val !== undefined && val !== null) {
          updates[`answers.${subtestId}.${idx}`] = val;
        }
      });
      await updateDoc(pRef, updates);
    }
    
    try {
      if (participantId !== 'trial-user') {
        const durationFormatted = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`;
        await addDoc(collection(db, 'activity_logs'), {
          type: 'participant',
          message: `Peserta menyelesaikan subtes ${subtestName} (durasi: ${durationFormatted})`,
          timestamp: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {}
    
    clearLocalAnswers();
    onFinish();
  };

  // Force finish if time is up
  useEffect(() => {
    if (isTimeUp) {
      const forceFinish = async () => {
        await saveCurrentPage();
        
        const finishTime = await getTrueTime();
        const effectiveStart = subtestStartTimeRef.current || (finishTime - timeLimitMinutes * 60 * 1000);
        const elapsedSeconds = timeLimitMinutes * 60;

        if (isSimulation || participantId === 'trial-user') {
          const evalResult = evaluateSingleSubtestResult(subtestId, subtestName, answers, 21);
          setSimulationEvaluation(evalResult);
          setSimTimeSpent(elapsedSeconds);
          setShowScorecardModal(true);
          if (onSimulationFinish) {
            onSimulationFinish(evalResult, elapsedSeconds);
          }
          return;
        }

        if (participantId !== 'trial-user') {
          const pRef = doc(db, 'participants', participantId);
          const updates: Record<string, any> = {
            [`completedTests.${subtestId}`]: true,
            [`subtestLogs.${subtestId}.startedAt`]: effectiveStart,
            [`subtestLogs.${subtestId}.finishedAt`]: finishTime,
            [`subtestLogs.${subtestId}.durationSeconds`]: elapsedSeconds,
            [`subtestLogs.${subtestId}.subtestId`]: subtestId,
            [`subtestLogs.${subtestId}.subtestName`]: subtestName,
            [`subtestLogs.${subtestId}.timeLimitMinutes`]: timeLimitMinutes,
            [`subtestLogs.${subtestId}.status`]: 'completed',
            [`subtestLogs.${subtestId}.finishReason`]: 'time_up'
          };
          Object.entries(answers).forEach(([idx, val]) => {
            if (val !== undefined && val !== null) {
              updates[`answers.${subtestId}.${idx}`] = val;
            }
          });
          await updateDoc(pRef, updates);
        }
        
        try {
          if (participantId !== 'trial-user') {
            await addDoc(collection(db, 'activity_logs'), {
              type: 'participant',
              message: `Waktu habis! Peserta otomatis menyelesaikan subtes ${subtestName} (${timeLimitMinutes} menit)`,
              timestamp: new Date().toISOString(),
              createdAt: serverTimestamp()
            });
          }
        } catch (e) {}
        
        alert("Waktu habis! Jawaban Anda telah disubmit otomatis.");
        clearLocalAnswers();
        onFinish();
      };
      forceFinish();
    }
  }, [isTimeUp]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };


  // Generate Questions for Current Page (Khusus Subtes 7: Hal 1 = 12 soal [0-11], Hal 2 = 8 soal [12-19])
  let startIdx = currentPage * PAGE_SIZE;
  let endIdx = Math.min(startIdx + PAGE_SIZE, totalQuestions);
  if (isSubtest7) {
    if (currentPage === 0) {
      startIdx = 0;
      endIdx = 12;
    } else {
      startIdx = 12;
      endIdx = Math.min(20, totalQuestions);
    }
  }

  const currentQuestions = [];
  for (let i = startIdx; i < endIdx; i++) {
    currentQuestions.push(i);
  }

  // Preload subtest 7 & 8 assets in background
  useEffect(() => {
    let imagesToPreload: string[] = [];
    if (isSubtest7) {
      const options = ['a', 'b', 'c', 'd', 'e'].flatMap(opt => [
        `/assets/ist/subtes7_opt_p1_${opt}.webp`,
        `/assets/ist/subtes7_opt_p2_${opt}.webp`
      ]);
      const questions = Array.from({ length: 20 }, (_, i) => `/assets/ist/subtes7_q${i + 1}.webp`);
      imagesToPreload = [...options, ...questions, '/assets/ist/subtes7_options_part1.webp', '/assets/ist/subtes7_options_part2.webp'];
    } else if (isSubtest8) {
      const options = ['a', 'b', 'c', 'd', 'e'].map(opt => `/assets/ist/subtes8_opt_${opt}.webp`);
      const questions = Array.from({ length: 20 }, (_, i) => `/assets/ist/subtes8_q${i + 1}.webp`);
      imagesToPreload = [...options, ...questions, '/assets/ist/subtes8_reference_cubes.webp'];
    }
    if (imagesToPreload.length > 0) {
      preloadMultipleImages(imagesToPreload);
    }
  }, [isSubtest7, isSubtest8]);
  
  const checkIsISTInput = (qIndex: number) => {
    if (name.includes('trial') || name.includes('pemanasan') || name.includes('simulasi')) return qIndex === 3;
    return name.includes('subtes 4') || name.includes('ist_4') || name.includes('- ge)');
  };
  const checkIsISTNumber = (qIndex: number) => {
    if (name.includes('trial') || name.includes('pemanasan') || name.includes('simulasi')) return qIndex === 4;
    return name.includes('subtes 5') || name.includes('ist_5') || name.includes('- ra)') || 
           name.includes('subtes 6') || name.includes('ist_6') || name.includes('- zr)');
  };


  const getQuestionText = (index: number) => {
    if (dynamicQuestions && dynamicQuestions.length > index) {
      return `${dynamicQuestions[index].no || index + 1}. ${dynamicQuestions[index].soal || ''}`;
    }
    if (name.includes('trial') || name.includes('pemanasan') || name.includes('simulasi')) {
      const trialQuestions = [
        "Burung memiliki...",
        "Manakah satu kata yang tidak memiliki kesamaan dengan keempat kata lainnya?",
        "Buku : Halaman = Rumah : ?",
        "Carilah satu kata yang mencakup pengertian kedua kata berikut: mawar - melati",
        "2 4 6 8 10 ?"
      ];
      return `Trial ${index + 1}. ${trialQuestions[index % trialQuestions.length]}`;
    }
    if (name.includes('subtes 1') || name.includes('ist_1') || name.includes('- se)')) {
      const seQuestions = [
        "Pengaruh seseorang terhadap orang lain seharusnya bergantung pada .....",
        "Lawannya \"hemat\" ialah ....",
        "...... tidak termasuk cuaca.",
        "Lawannya \"setia\" ialah ......",
        "Seekor kuda selalu mempunyai ......",
        "Seorang paman ...... lebih tua dari keponakannya.",
        "Pada jumlah yang sama, nilai kalori tertinggi ada pada ......",
        "Pada suatu pertandingan selalu terdapat ......",
        "Suatu pernyataan yang belum dipastikan dikatakan sebagai pernyataan yang ......",
        "Pada sepatu selalu terdapat ......",
        "...... tidak berkaitan dengan pencegahan kecelakaan.",
        "Mata uang logam Rp 500 mempunyai garis tengah ...... mm.",
        "Seseorang yang bersikap menyangsikan setiap kemajuan ialah seorang yang ......",
        "Lawannya \"tidak pernah\" ialah ......",
        "Jarak antara Jakarta – Surabaya kira-kira ...... km.",
        "Untuk dapat membuat nada yang rendah dan mendalam, kita memerlukan banyak ......",
        "Ayah ...... lebih berpengalaman daripada anaknya.",
        "Di antara kota-kota berikut ini, maka kota ...... letaknya paling selatan.",
        "Jika kita mengetahui jumlah persentase nomor-nomor undian yang tidak menang, maka kita dapat menghitung ......",
        "Seorang anak yang berumur 10 tahun tingginya rata-rata ...... cm."
      ];
      return `${(index + 1).toString().padStart(2, '0')}. ${seQuestions[index % seQuestions.length]}`;
    }
    if (name.includes('subtes 2') || name.includes('ist_2') || name.includes('- wa)')) {
      return `${(index + 21).toString().padStart(2, '0')}. Manakah satu kata yang tidak memiliki kesamaan dengan keempat kata lainnya?`;
    }
    if (name.includes('subtes 3') || name.includes('ist_3') || name.includes('- an)')) {
      const anQuestions = [
        "menemukan : menghilangkan = mengingatkan : ......",
        "bunga : jambangan = burung : ......",
        "kereta api : rel = bis : ......",
        "perak : emas = cincin : ......",
        "lingkaran : bola = bujur sangkar : ......",
        "saran : keputusan = merundingkan : ......",
        "lidah : asam = hidung : ......",
        "darah : pembuluh = air : ......",
        "saraf : penyalur = pupil : ......",
        "pengantar surat : pengantar telegram = pandai besi : ......",
        "buta : warna = tuli : ......",
        "makanan : bumbu = ceramah : ......",
        "marah : emosi = duka cita : ......",
        "mantel : jubah = wool : ......",
        "ketinggian puncak : tekanan udara = ketinggian nada : ......",
        "Negara : revolusi = hidup : ......",
        "kekurangan : penemuan = panas : ......",
        "kayu : diketam = besi : ......",
        "olahragawan : lembing = cendekiawan : ......",
        "keledai : kuda pacuan = pembakaran : ......"
      ];
      return `${index + 41}. ${anQuestions[index % anQuestions.length]}`;
    }
    if (name.includes('subtes 9') || name.includes('ist_9') || name.includes('- me)')) {
      const meQuestions = [
        "Kata yang mempunyai huruf permulaan - A - adalah .......",
        "Kata yang mempunyai huruf permulaan - B - adalah .......",
        "Kata yang mempunyai huruf permulaan - C - adalah .......",
        "Kata yang mempunyai huruf permulaan - D - adalah .......",
        "Kata yang mempunyai huruf permulaan - E - adalah .......",
        "Kata yang mempunyai huruf permulaan - F - adalah .......",
        "Kata yang mempunyai huruf permulaan - G - adalah .......",
        "Kata yang mempunyai huruf permulaan - H - adalah .......",
        "Kata yang mempunyai huruf permulaan - I - adalah .......",
        "Kata yang mempunyai huruf permulaan - J - adalah .......",
        "Kata yang mempunyai huruf permulaan - K - adalah .......",
        "Kata yang mempunyai huruf permulaan - L - adalah .......",
        "Kata yang mempunyai huruf permulaan - M - adalah .......",
        "Kata yang mempunyai huruf permulaan - N - adalah .......",
        "Kata yang mempunyai huruf permulaan - O - adalah .......",
        "Kata yang mempunyai huruf permulaan - P - adalah .......",
        "Kata yang mempunyai huruf permulaan - R - adalah .......",
        "Kata yang mempunyai huruf permulaan - S - adalah .......",
        "Kata yang mempunyai huruf permulaan - T - adalah .......",
        "Kata yang mempunyai huruf permulaan - U - adalah ......."
      ];
      return `${index + 157}. ${meQuestions[index % meQuestions.length]}`;
    }
    if (name.includes('subtes 4') || name.includes('ist_4') || name.includes('- ge)')) {
      const geQuestions = [
        ['Mawar', 'Melati'],
        ['Mata', 'Telinga'],
        ['Gula', 'Intan'],
        ['Hujan', 'Salju'],
        ['Pengantar Surat', 'Telepon'],
        ['Kamera', 'Kacamata'],
        ['Lambung', 'Usus'],
        ['Banyak', 'Sedikit'],
        ['Telur', 'Benih'],
        ['Bendera', 'Lencana'],
        ['Rumput', 'Gajah'],
        ['Ember', 'Kantong'],
        ['Awal', 'Akhir'],
        ['Kikir', 'Boros'],
        ['Penawaran', 'Permintaan'],
        ['Atas', 'Bawah']
      ];
      const p = geQuestions[index % geQuestions.length];
      return `${index + 61}. ${p[0]} - ${p[1]}`;
    }
    if (name.includes('subtes 5') || name.includes('ist_5') || name.includes('- ra)')) {
      const raQuestions = [
        "Jika seorang anak memiliki 50 rupiah dan memberikan 15 rupiah kepada orang lain, berapa rupiahkah yang masih tinggal padanya?",
        "Berapa km-kah yang dapat ditempuh oleh kereta api dalam waktu 7 jam, jika kecepatannya 80 km/jam?",
        "15 peti buah-buahan beratnya 250 kg dan setiap peti kosong beratnya 3 kg, berapa kg-kah berat buah-buahan itu?",
        "3 buah buku harganya Rp. 500. Berapa bukukah yang dapat kita beli dengan Rp. 5000 ?",
        "Seseorang mempunyai persediaan rumput yang cukup untuk 7 ekor kuda selama 78 hari. Berapa harikah persediaan itu cukup untuk 21 ekor kuda?",
        "Jika sebuah batu terletak 15 m di sebelah selatan dari sebatang pohon dan pohon itu berada 30 m di sebelah selatan dari sebuah rumah, berapa meterkah jarak antara batu dan rumah itu?",
        "Seseorang dapat berjalan 1,75 m dalam waktu 1/4 detik. Berapa meterkah yang dapat ia tempuh dalam waktu 10 detik?",
        "Jika 4½ m pipa harganya Rp. 90,. Berapa rupiahkah harganya jika 2½ m?",
        "4 orang dapat menyelesaikan sesuatu pekerjaan dalam 6 hari. Berapa orangkah yang diperlukan untuk menyelesaikan pekerjaan itu dalam setengah hari?",
        "Suatu pabrik dapat menghasilkan 304 batang pensil dalam waktu 8 jam. Berapa batangkah dihasilkan dalam waktu setengah jam?",
        "Karena dipanaskan, kawat yang panjangnya 48 cm akan memuai menjadi 52 cm. Setelah pemanasan, berapa panjangnya kawat yang berukuran 72 cm?",
        "Untuk suatu campuran diperlukan 2 bagian perak dan 3 bagian timah. Berapa gramkah perak yang diperlukan untuk mendapatkan campuran itu yang beratnya 15 gram?",
        "Untuk setiap Rp. 30 yang dimiliki Didik, Somad memiliki Rp. 50. Jika mereka bersama mempunyai Rp.1200 berapa rupiahkah yang dimiliki Somad?",
        "Mesin A menenun 60 m kain, sedangkan mesin B menenun 40 m. Berapa meterkah yang ditenun mesin A, jika mesin B menenun 60 m?",
        "Seseorang membelikan 1/10 dari uangnya untuk perangko dan 4 kali jumlah itu untuk alat tulis. Sisa uangnya masih Rp. 60,-. Berapa rupiahkah uangnya semula?",
        "Di dalam dua peti terdapat 43 buah piring. Di dalam peti A terdapat 9 buah piring lebih banyak daripada di dalam peti B. Berapa buah piring terdapat di dalam peti B?",
        "Sepotong kain yang panjangnya 60 cm harus dibagi sedemikian rupa sehingga panjangnya satu bagian ialah 2/3 dari bagian yang lain. Berapa panjangnya bagian yang terpendek?",
        "Suatu perusahaan mengekspor ¾ dari hasil produksinya dan menjual 4/5 dari sisa itu di dalam negeri. Berapa % kah hasil produksi yang masih tersisa ?",
        "Jika satu botol berisi anggur hanya 7/8 bagian berharga Rp. 84,-, berapakah harganya jika botol itu hanya terisi ½ penuh?",
        "Di dalam suatu keluarga setiap anak perempuan mempunyai jumlah saudara laki-laki yang sama dengan jumlah saudara perempuan dan setiap anak laki-laki mempunyai dua kali lebih banyak saudara perempuan daripada saudara laki-laki. Berapa anak laki-laki yang terdapat di dalam keluarga itu?"
      ];
      const q = raQuestions[index % raQuestions.length];
      return `${index + 77}. ${q}`;
    }
    if (name.includes('subtes 6') || name.includes('ist_6') || name.includes('- zr)')) {
      const zrQuestions = [
        "6    9    12    15    18    21    24    ......",
        "15    16    18    19    21    22    24    ......",
        "19    18    22    21    25    24    28    ......",
        "16    12    17    13    18    14    19    ......",
        "2    4    8    10    20    22    44    ......",
        "15    13    16    12    17    11    18    ......",
        "25    22    11    33    30    15    45    ......",
        "49    51    54    27    9    11    14    ......",
        "2    3    1    3    4    2    4    ......",
        "19    17    20    16    21    15    22    ......",
        "94    92    46    44    22    20    10    ......",
        "5    8    9    8    11    12    11    ......",
        "12    15    19    23    28    33    39    ......",
        "7    5    10    7    21    17    68    ......",
        "11    15    18    9    13    16    8    ......",
        "3    8    15    24    35    48    63    ......",
        "4    5    7    4    8    13    7    ......",
        "8    5    15    18    6    3    9    ......",
        "15    6    18    10    30    23    69    ......",
        "5    35    28    4    11    77    70    ......"
      ];
      const q = zrQuestions[index % zrQuestions.length];
      return `${index + 97}. ${q}`;
    }
    if (name.includes('subtes 7') || name.includes('ist_7') || name.includes('ist 7') || name.includes('fa)') || name.includes('(fa)') || name.includes('potongan')) {
      const qNum = (index % 20) + 1;
      const globalNum = (index % 20) + 117;
      return `Soal No. ${globalNum} (${qNum}). Tentukan bentuk acuan mana (A, B, C, D, atau E) yang merupakan susunan utuh dari potongan gambar di bawah:`;
    }
    if (name.includes('subtes 8') || name.includes('ist_8') || name.includes('ist 8') || name.includes('wu') || name.includes('kubus')) {
      const qNum = (index % 20) + 1;
      const globalNum = (index % 20) + 137;
      return `Soal No. ${globalNum} (${qNum}). Tentukan kubus acuan mana (A, B, C, D, atau E) yang identik dengan kubus soal di bawah:`;
    }
    return `${index + 1}. Pilih jawaban yang paling tepat untuk soal nomor ${index + 1}. `;
  };

  const options = ['A', 'B', 'C', 'D', 'E'];

  const getQuestionOptions = (index: number) => {
    if (dynamicQuestions && dynamicQuestions.length > index && dynamicQuestions[index].pilihan) {
      return dynamicQuestions[index].pilihan;
    }
    if (name.includes('trial') || name.includes('pemanasan') || name.includes('simulasi')) {
      const trialOptions = [
        ["Sayap", "Rumah", "Ban", "Buku", "Air"], // Q1: SE type
        ["Sapi", "Kuda", "Kambing", "Harimau", "Lemari"], // Q2: WA type
        ["Pintu", "Kamar", "Atap", "Jendela", "Halaman"], // Q3: AN type
      ];
      if (index < trialOptions.length) {
        return trialOptions[index];
      }
      return []; // GE, RA, ZR usually are inputs
    }
    if (name.includes('subtes 1') || name.includes('ist_1') || name.includes('- se)')) {
      const seOptions = [
        ["bujukan", "kewibawaan", "kekayaan", "keberanian", "kekuasaan"],
        ["bernilai", "kikir", "kaya", "murah", "boros"],
        ["salju", "angin puyuh", "gempa bumi", "kabut", "halilintar"],
        ["permusuhan", "persahabatan", "khianat", "benci", "cinta"],
        ["pelana", "kandang", "surai", "ladam", "kuku"],
        ["tidak pernah", "kadang-kadang", "jarang", "biasanya", "selalu"],
        ["lemak", "sayuran", "tahu", "ikan", "daging"],
        ["lawan", "wasit", "penonton", "sorak", "kemenangan"],
        ["memiliki arti rangkap", "tergesa-gesa", "menyesatkan", "hipotesis", "paradoks"],
        ["sol", "kulit", "gesper", "lidah", "tali sepatu"],
        ["kacamata pelindung", "lampu lalu lintas", "kotak PPPK", "tanda peringatan", "palang kereta api"],
        ["12", "15", "20", "25", "30"],
        ["konservatif", "radikal", "demokratis", "anarkis", "liberal"],
        ["kadang-kadang", "jarang", "kerap kali", "sering", "selalu"],
        ["600", "650", "800", "950", "1000"],
        ["suara", "kekuatan", "peranan", "ayunan", "berat"],
        ["pada dasarnya", "biasanya", "selalu", "jauh", "jarang"],
        ["Semarang", "Cirebon", "Surabaya", "Jakarta", "Bandung"],
        ["tinggi keuntungan", "jumlah peserta", "kemungkinan menang", "jumlah nomor yang menang", "pajak undian"],
        ["105", "110", "115", "130", "150"]
      ];
      return seOptions[index % seOptions.length];
    }
    if (name.includes('subtes 2') || name.includes('ist_2') || name.includes('- wa)')) {
      const waOptions = [
        ["panah", "elips", "lengkungan", "lingkaran", "busur"],
        ["menjahit", "menggergaji", "mengetuk", "memaki", "memukul"],
        ["panjang", "lebar", "isi", "keliling", "luas"],
        ["melekatkan", "mengikat", "menyatukan", "mengaitkan", "melepaskan"],
        ["timur", "selatan", "tujuan", "perjalanan", "arah"],
        ["perceraian", "tugas", "jarak", "perpisahan", "batas"],
        ["payung", "jala", "ayakan", "saringan", "kelambu"],
        ["pucat", "putih", "berkilauan", "buram", "kasar"],
        ["sepeda", "pesawat terbang", "bis", "kapal api", "sepeda motor"],
        ["seruling", "saksofon", "biola", "klarinet", "terompet"],
        ["licin", "lurus", "berduri", "kasar", "bergelombang"],
        ["jam", "bintang pari", "penunjuk jalan", "kompas", "arah"],
        ["perencanaan", "penempatan", "pengerahan", "pendidikan", "kebijaksanaan"],
        ["bermotor", "bersepeda", "berlayar", "berkuda", "berjalan"],
        ["ukiran", "potret", "gambar", "patung", "lukisan"],
        ["lonjong", "bersudut", "panjang", "runcing", "bulat"],
        ["gunting", "obeng", "kunci", "palang pintu", "gerendel"],
        ["perkawinan", "masyarakat", "atas", "jembatan", "pagar"],
        ["melicinkan", "mengetam", "menggosok", "mengasah", "memahat"],
        ["baja", "karet", "batu", "bulu", "kayu"]
      ];
      return waOptions[index % waOptions.length];
    }
    if (name.includes('subtes 3') || name.includes('ist_3') || name.includes('- an)')) {
      const anOptions = [
        ["berpikir", "memimpikan", "menghapal", "melupakan", "mengenai"],
        ["langit", "sangkar", "pohon", "sarang", "pagar"],
        ["jalan raya", "poros", "kecepatan", "ban", "roda"],
        ["permata", "gelang", "berlian", "arloji", "platina"],
        ["segi empat", "gambar", "bentuk", "piramida", "kubus"],
        ["menentukan", "merenungkan", "menawarkan", "menimbang", "menilai"],
        ["tengik", "mengecap", "asin", "mencium", "bernapas"],
        ["talang", "pintu air", "sungai", "hujan", "ember"],
        ["cahaya", "pelindung", "melihat", "mata", "penyinaran"],
        ["pedagang besi", "api", "palu godam", "tukang emas", "besi tempa"],
        ["pendengaran", "kata", "mendengar", "telinga", "nada"],
        ["kesan", "pidato", "penghinaan", "ayat", "kelakar"],
        ["sakit hati", "suasana hati", "rindu", "suka cita", "sedih"],
        ["sutera", "tekstil", "domba", "jas", "bahan sandang"],
        ["nyanyian", "sopran", "panjang senar", "garpu tala", "suara"],
        ["ilmu hewan", "seleksi", "keturunan", "mutasi", "biologi"],
        ["matahari", "es", "dingin", "haus", "khatulistiwa"],
        ["ditempa", "digergaji", "dituang", "dipalu", "dikikir"],
        ["perpustakaan", "karya", "mikroskop", "studi", "penelitian"],
        ["pemadam api", "korek api", "obor", "lautan api", "letupan"]
      ];
      return anOptions[index % anOptions.length];
    }
    if (name.includes('subtes 9') || name.includes('ist_9') || name.includes('- me)')) {
      return ["kesenian", "binatang", "perkakas", "burung", "bunga"];
    }
    return null;
  };


  
  const handleExitTest = () => {
    setShowConfirmCancel(true);
  };

  const handleConfirmExit = async () => {
    setShowConfirmCancel(false);
    try {
      await saveCurrentPage();
    } catch (err) {
      console.error("Gagal menyimpan sebelum keluar:", err);
    }
    onCancel();
  };

  // Standar 9 Grup Profesi RMIB (A-I)
  const rmibGroups = [
    ["Petani", "Insinyur Sipil", "Akuntan", "Ilmuwan", "Seniman", "Wartawan", "Pianis", "Pekerja Sosial", "Direktur Perusahaan", "Sekretaris Pribadi", "Tukang Kayu", "Dokter"], // A
    ["Ahli Pertanian", "Arsitek", "Kasir", "Ahli Geologi", "Pematung", "Penulis", "Penyanyi", "Pekerja Panti Asuhan", "Manajer Penjualan", "Juru Tik", "Tukang Ledeng", "Ahli Bedah"], // B
    ["Penyuluh Pertanian", "Ahli Listrik", "Pegawai Bank", "Ahli Kimia", "Pelukis", "Editor", "Penata Musik", "Guru Anak Tuna Grahita", "Politikus", "Pegawai Arsip", "Pembuat Mesin", "Dokter Gigi"], // C
    ["Petugas Kehutanan", "Ahli Mesin", "Petugas Pajak", "Ahli Fisika", "Desainer Pakaian", "Penerjemah", "Konduktor Orkestra", "Konselor", "Manajer Pemasaran", "Operator Telepon", "Tukang Las", "Dokter Hewan"], // D
    ["Peternak", "Insinyur Pertambangan", "Pemeriksa Keuangan", "Ahli Botani", "Desainer Interior", "Kritikus Buku", "Kritikus Musik", "Psikolog", "Manajer Personalia", "Pencatat Waktu", "Tukang Batu", "Perawat"], // E
    ["Pengawas Hutan", "Ahli Pesawat Terbang", "Petugas Asuransi", "Ahli Astronomi", "Penata Jendela Toko", "Penyiar Radio", "Penggubah Lagu", "Pegawai Palang Merah", "Anggota Parlemen", "Petugas Resepsionis", "Tukang Cat", "Apoteker"], // F
    ["Penjaga Taman", "Ahli Elektronika", "Agen Real Estate", "Ahli Zoologi", "Fotografer", "Penulis Naskah TV", "Pemain Biola", "Pekerja Sosial Medis", "Manajer Pabrik", "Pegawai Pos", "Montir Mobil", "Ahli Kacamata"], // G
    ["Ahli Perkebunan", "Ahli Telekomunikasi", "Petugas Statistik", "Ahli Meteorologi", "Penata Rias", "Pewawancara", "Pemain Cello", "Pembimbing Pramuka", "Manajer Iklan", "Penyortir Surat", "Tukang Sepatu", "Ahli Gizi"], // H
    ["Nelayan", "Ahli Metalurgi", "Petugas Bea Cukai", "Ahli Biologi", "Kritikus Seni", "Wartawan Olahraga", "Guru Musik", "Pembimbing Rohani", "Pemimpin Serikat Kerja", "Pegawai Perpustakaan", "Tukang Kaca", "Terapis Fisik"] // I
  ];

  const answeredCount = Object.values(answers).filter(v => v !== undefined && v !== null && String(v).trim() !== '').length;

  return (
    <div className="relative min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Simulation Banner */}
      {isSimulation && (
        <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white px-4 py-2.5 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#8BC34A] text-gray-950 font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-gray-950" />
              Mode Simulasi Peserta (CBT)
            </span>
            <span className="hidden sm:inline text-gray-400">|</span>
            <span className="text-gray-300 hidden sm:inline">
              Uji coba alur ujian, pengerjaan, dan skoring instan tanpa merusak data peserta.
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const sample = getSampleAnswersForSubtest(subtestId, subtestName);
                setAnswers(prev => ({ ...prev, ...sample }));
              }}
              className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
              title="Isi contoh jawaban otomatis untuk memeriksa kartu skor"
            >
              <Zap className="w-3 h-3" />
              <span>Isi Jawaban Contoh</span>
            </button>

            <button
              type="button"
              onClick={handleFinish}
              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
              title="Selesaikan tes dan lihat evaluasi skor"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Selesai &amp; Cek Skor</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold flex items-center gap-1 cursor-pointer transition"
              title="Keluar dari simulasi"
            >
              <X className="w-3 h-3" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container with CSS user-select: none and pointer-events */}
      <div 
        className={`min-h-screen bg-gray-50 flex flex-col select-none transition-all duration-200 ${
          ((tabSwitchActive && isWindowBlurred) || (antiCaptureActive && showWarningModal))
            ? 'pointer-events-none filter blur-md select-none' 
            : 'pointer-events-auto'
        }`}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onDragStart={(e) => e.preventDefault()}
      >
      {/* Sticky Header with Timer */}
      <div className={`sticky ${isSimulation ? 'top-10' : 'top-0'} z-40 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-4 flex justify-between items-center`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExitTest}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer"
            title="Keluar ke Dashboard (Waktu tetap berjalan)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">{subtestName}</h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <span>{isRMIB ? `Grup ${startIdx + 1} - ${endIdx}` : `Soal ${startIdx + 1} - ${endIdx}`} dari {totalQuestions}</span>
              <span>•</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Terjawab: {answeredCount}/{totalQuestions}
              </span>
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${timeLeft !== null && timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-800'}`}>
          <Clock className="w-5 h-5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Main Form */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-10">
        {/* Question Grid Navigator */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-[#689F38]" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Navigasi Soal
              </span>
              <span className="text-xs text-gray-500 font-medium">
                ({answeredCount} dari {totalQuestions} terjawab)
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#8BC34A] inline-block"></span>
                <span>Terjawab</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-gray-100 border border-gray-300 inline-block"></span>
                <span>Belum</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md border-2 border-blue-500 inline-block"></span>
                <span>Halaman Ini</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-36 overflow-y-auto p-1">
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const isAnswered = answers[idx] !== undefined && answers[idx] !== null && String(answers[idx]).trim() !== '';
              const isCurrentPage = isSubtest7
                ? (currentPage === 0 ? idx < 12 : idx >= 12)
                : Math.floor(idx / PAGE_SIZE) === currentPage;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const targetPage = isSubtest7 ? (idx < 12 ? 0 : 1) : Math.floor(idx / PAGE_SIZE);
                    if (targetPage !== currentPage) {
                      setCurrentPage(targetPage);
                    }
                    setTimeout(() => {
                      const el = document.getElementById(`q-card-${idx}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 80);
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isAnswered
                      ? 'bg-[#8BC34A] text-white shadow-xs hover:bg-[#7cb342]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  } ${isCurrentPage ? 'ring-2 ring-blue-500 ring-offset-1 font-extrabold' : ''}`}
                  title={`Soal ${idx + 1} ${isAnswered ? '(Sudah dijawab)' : '(Belum dijawab)'}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              {isRMIB 
                ? "Urutkan daftar pekerjaan berikut dari yang PALING Anda sukai (Ranking 1) hingga yang PALING TIDAK Anda sukai (Ranking 12). Klik pada pekerjaan untuk memindahkannya ke daftar pilihan."
                : "Pilih jawaban yang paling tepat. Jawaban akan disimpan otomatis saat Anda berpindah halaman. Jangan merefresh browser."}
            </p>
          </div>
        </div>

        {/* Reference Sheet for Subtest 7 (FA) */}
        {isSubtest7 && (
          <div className="mb-8 bg-white border-2 border-blue-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${currentPage === 0 ? 'bg-blue-600' : 'bg-indigo-600'}`}></span>
                  {currentPage === 0 
                    ? 'Bentuk Acuan Pilihan Jawaban A – E (Bagian 1: Soal 1 – 12 / No. 117 – 128)' 
                    : 'Bentuk Acuan Pilihan Jawaban A – E (Bagian 2: Soal 13 – 20 / No. 129 – 136)'}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentPage === 0
                    ? 'Acuan Bagian 1 untuk Soal 117 – 128. Susun potongan-potongan soal menjadi salah satu bentuk A, B, C, D, atau E berikut:'
                    : 'Acuan Baru Bagian 2 untuk Soal 129 – 136. Susun potongan-potongan soal menjadi salah satu bentuk A, B, C, D, atau E berikut:'}
                </p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 self-start sm:self-auto ${
                currentPage === 0
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {currentPage === 0 ? 'Acuan Bagian 1 (117–128)' : 'Acuan Bagian 2 (129–136)'}
              </span>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 flex items-center justify-center overflow-x-auto relative">
              <div className="overflow-hidden relative flex justify-center w-full">
                <AssetImage 
                  src={currentPage === 0 ? '/assets/ist/subtes7_options_part1.webp' : '/assets/ist/subtes7_options_part2.webp'} 
                  alt={currentPage === 0 ? 'Pilihan Bentuk Acuan Bagian 1 (Soal 117–128)' : 'Pilihan Bentuk Acuan Bagian 2 (Soal 129–136)'} 
                  className="mx-auto mix-blend-multiply"
                  style={{ maxHeight: '12rem', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Reference Sheet for Subtest 8 (WU) */}
        {isSubtest8 && (
          <div className="mb-8 bg-white border-2 border-indigo-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  5 Kubus Acuan Utama (Pilihan A, B, C, D, E)
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Setiap soal memperlihatkan salah satu kubus acuan dalam posisi terputar/berubah kedudukan. Tentukan kubus yang identik:
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 self-start sm:self-auto">
                Kubus Acuan A – E
              </span>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 flex items-center justify-center overflow-x-auto">
              <AssetImage 
                src="/assets/ist/subtes8_reference_cubes.webp" 
                alt="5 Kubus Acuan" 
                className="max-h-28 sm:max-h-36 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/ist/subtes8_reference_cubes.png';
                }}
              />
            </div>
          </div>
        )}

        <div className="space-y-8">
          {isFetchingDynamic ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-200">
              <div className="w-8 h-8 border-4 border-[#8BC34A] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Memuat Soal...</p>
            </div>
          ) : currentQuestions.map((qIndex) => {
            if (isRMIB) {
              const currentAnswerStr = answers[qIndex] || "";
              const rankedJobs = currentAnswerStr ? currentAnswerStr.split(',') : [];
              const groupJobs = rmibGroups[qIndex % 9] || rmibGroups[0];
              const unrankedJobs = groupJobs.filter(j => !rankedJobs.includes(j));

              return (
                <div key={qIndex} className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                   <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-6">
                     Grup {String.fromCharCode(65 + qIndex)}. Urutkan 12 pekerjaan berikut sesuai minat Anda.
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500 uppercase mb-3 flex items-center justify-between">
                          <span>Daftar Pekerjaan</span>
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{unrankedJobs.length} tersisa</span>
                        </h4>
                        <div className="space-y-2">
                           {unrankedJobs.map(job => (
                              <button
                                key={job}
                                onClick={() => handleOptionSelect(qIndex, [...rankedJobs, job].join(','))}
                                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm font-medium transition-colors text-gray-700"
                              >
                                + {job}
                              </button>
                           ))}
                           {unrankedJobs.length === 0 && (
                              <div className="p-4 text-center text-sm text-gray-400 bg-green-50 rounded-lg border border-dashed border-green-200 flex flex-col items-center">
                                <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
                                Semua pekerjaan telah diurutkan
                              </div>
                           )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500 uppercase mb-3">Urutan Pilihan Anda</h4>
                        <div className="space-y-2">
                           {rankedJobs.map((job, idx) => (
                              <button
                                key={job}
                                onClick={() => handleOptionSelect(qIndex, rankedJobs.filter(j => j !== job).join(','))}
                                className="w-full flex items-center px-4 py-3 bg-blue-50 border border-blue-200 hover:border-red-300 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors group text-blue-900"
                              >
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mr-3 group-hover:hidden shadow-sm">{idx + 1}</span>
                                <span className="w-6 h-6 rounded-full bg-red-500 text-white items-center justify-center text-xs font-bold mr-3 hidden group-hover:flex shadow-sm">✕</span>
                                {job}
                              </button>
                           ))}
                           {rankedJobs.length === 0 && (
                              <div className="p-4 text-center text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200 h-32 flex items-center justify-center">
                                Belum ada yang dipilih.<br/>Klik pekerjaan di sebelah kiri.
                              </div>
                           )}
                        </div>
                      </div>
                   </div>
                </div>
              );
            }

            return (
              <div key={qIndex} id={`q-card-${qIndex}`} className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm scroll-mt-28">
                
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                  {getQuestionText(qIndex)}
                </h3>
                
                {/* Image Display for Subtest 7 & 8 */}
                {isSubtest7 && (
                  <div className="mb-6 flex flex-col items-center">
                    <div className="mb-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
                        qIndex < 12 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {qIndex < 12 ? 'Menggunakan Acuan Bagian 1 (Soal 117–128)' : 'Menggunakan Acuan Baru Bagian 2 (Soal 129–136)'}
                      </span>
                    </div>
                    <div className="border-2 border-blue-100 rounded-xl p-4 bg-slate-50/60 w-full max-w-sm flex flex-col items-center justify-center shadow-xs">
                      <div className="w-full h-36 sm:h-44 flex items-center justify-center">
                        <AssetImage 
                          src={`/assets/ist/subtes7_q${(qIndex % 20) + 1}.webp`} 
                          alt={`Soal ${(qIndex % 20) + 1}`} 
                          className="max-w-full max-h-full object-contain drop-shadow-sm" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.endsWith('.webp')) {
                              target.src = target.src.replace('.webp', '.png');
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {isSubtest8 && (
                  <div className="mb-6 flex justify-center">
                    <div className="border-2 border-indigo-200 rounded-xl p-4 bg-white w-full max-w-sm flex flex-col items-center justify-center shadow-xs">
                      <div className="w-full h-36 sm:h-44 flex items-center justify-center bg-slate-50/50 rounded-lg p-2">
                        <AssetImage 
                          src={`/assets/ist/subtes8_q${(qIndex % 20) + 1}.webp`} 
                          alt={`Soal ${(qIndex % 20) + 1}`} 
                          className="max-w-full max-h-full object-contain drop-shadow-sm" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.endsWith('.webp')) {
                              target.src = target.src.replace('.webp', '.png');
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                
                {checkIsISTNumber(qIndex) ? (
                  <div className="flex flex-col gap-4 items-center max-w-sm mx-auto">
                    <div className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-center text-3xl font-bold text-gray-800 tracking-[0.25em] min-h-[80px] flex items-center justify-center">
                      {answers[qIndex] || <span className="text-gray-400 font-normal text-sm tracking-normal">Jawaban...</span>}
                    </div>

                    <div className="text-xs text-gray-500 flex items-center gap-1.5 -mt-2">
                      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Setiap angka hanya dapat dipilih 1 kali</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => {
                        const currentVal = String(answers[qIndex] || '');
                        const numStr = String(num);
                        const isSelected = currentVal.includes(numStr);

                        return (
                          <button
                            key={num}
                            type="button"
                            disabled={isSelected}
                            onClick={() => {
                              if (!isSelected) {
                                handleOptionSelect(qIndex, currentVal + numStr);
                              }
                            }}
                            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 font-bold text-xl transition-all flex items-center justify-center shadow-sm ${
                              isSelected
                                ? 'border-[#8BC34A] bg-[#8BC34A] text-white cursor-not-allowed opacity-90 shadow-inner'
                                : 'border-gray-300 bg-white text-gray-800 hover:border-[#8BC34A] hover:text-[#8BC34A] hover:bg-[#f1f8e9] cursor-pointer'
                            }`}
                            title={isSelected ? `Angka ${num} sudah dipilih` : `Pilih angka ${num}`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 w-full">
                      <button 
                        type="button"
                        onClick={() => handleOptionSelect(qIndex, (answers[qIndex] || '').slice(0, -1))}
                        disabled={!answers[qIndex]}
                        className="flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg py-2.5 sm:py-3 font-bold text-sm hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Delete className="w-4 h-4" />
                        <span>Hapus</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleOptionSelect(qIndex, '')}
                        disabled={!answers[qIndex]}
                        className="px-4 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg py-2.5 sm:py-3 font-bold text-sm hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Kosongkan jawaban"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                ) : checkIsISTInput(qIndex) ? (
                  <div>
                    <input 
                      type="text"
                      value={answers[qIndex] || ''}
                      onChange={(e) => handleOptionSelect(qIndex, e.target.value)}
                      placeholder="Ketik jawaban Anda di sini..."
                      className="w-full border border-gray-300 rounded-lg p-3 sm:p-4 text-base focus:ring-2 focus:ring-[#8BC34A] focus:border-[#8BC34A] outline-none transition-colors"
                    />
                  </div>
                ) : (isSubtest7 || isSubtest8) ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-3">
                      {isSubtest7 
                        ? `Pilih salah satu bentuk acuan ${(qIndex % 20) < 12 ? 'Bagian 1' : 'Bagian 2 (Acuan Baru)'} (A – E):` 
                        : 'Pilih salah satu kubus jawaban (A – E):'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {options.map((displayOpt, displayIndex) => {
                        const originalIndex = (isRandomizeChoices && optionShuffleMap[qIndex]) ? optionShuffleMap[qIndex][displayIndex] : displayIndex;
                        const originalOpt = options[originalIndex];
                        const isSelected = answers[qIndex] === originalOpt;
                        let optImg = '';
                        let optLabel = '';
                        if (isSubtest7) {
                          const part = (qIndex % 20) < 12 ? 'p1' : 'p2';
                          optImg = `/assets/ist/subtes7_opt_${part}_${originalOpt.toLowerCase()}.webp`;
                          optLabel = `Pilihan ${displayOpt}`;
                        } else {
                          optImg = `/assets/ist/subtes8_opt_${originalOpt.toLowerCase()}.webp`;
                          optLabel = `Kubus ${displayOpt}`;
                        }

                        return (
                          <button
                            key={displayOpt}
                            type="button"
                            onClick={() => handleOptionSelect(qIndex, originalOpt)}
                            className={`group relative p-3 rounded-xl border-2 flex flex-col items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#8BC34A] bg-[#f1f8e9] shadow-sm ring-2 ring-[#8BC34A]/30'
                                : 'border-gray-200 bg-white hover:border-[#8BC34A]/60 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-full flex items-center justify-between mb-1.5">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                                isSelected ? 'border-[#8BC34A] bg-[#8BC34A] text-white' : 'border-gray-300 text-gray-600 bg-gray-50 group-hover:border-[#8BC34A]/50'
                              }`}>
                                {displayOpt}
                              </div>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-[#689F38]" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-transparent" />
                              )}
                            </div>
                            
                            <div className="w-full h-16 sm:h-20 flex items-center justify-center p-1 my-1">
                              {optImg ? (
                                <AssetImage 
                                  src={optImg} 
                                  alt={optLabel} 
                                  className="max-h-full max-w-full object-contain drop-shadow-xs" 
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (isSubtest8 && !target.src.includes(`subtes8_opt_${originalOpt.toLowerCase()}`)) {
                                      target.src = `/assets/ist/subtes8_opt_${originalOpt.toLowerCase()}.webp`;
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-3xl font-bold text-gray-300">{originalOpt}</span>
                              )}
                            </div>
                            
                            <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-[#689F38]' : 'text-gray-500 group-hover:text-gray-700'}`}>
                              {optLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {options.map((displayOpt, displayIndex) => {
                      const originalIndex = (isRandomizeChoices && optionShuffleMap[qIndex]) ? optionShuffleMap[qIndex][displayIndex] : displayIndex;
                      const originalOpt = options[originalIndex];
                      
                      const customOptions = getQuestionOptions(qIndex);
                      if (customOptions && customOptions.length > 0 && originalIndex >= customOptions.length) return null;
                      
                      const displayLabel = customOptions ? customOptions[originalIndex] : `Pilihan ${originalOpt}`;
                      
                      return (
                        <label 
                          key={displayOpt} 
                          onClick={() => handleOptionSelect(qIndex, originalOpt)}
                          className={`flex items-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                            answers[qIndex] === originalOpt 
                              ? 'border-[#8BC34A] bg-[#f1f8e9]' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center mr-3 ${
                            answers[qIndex] === originalOpt 
                              ? 'border-[#8BC34A] bg-[#8BC34A]' 
                              : 'border-gray-300'
                          }`}>
                            {answers[qIndex] === originalOpt && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                          </div>
                          <span className="font-medium text-gray-700"><span className="font-bold mr-2">{displayOpt}.</span> {displayLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="mt-8 flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0 || isSaving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors ${
              currentPage === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Sebelumnya
          </button>
          
          <div className="hidden sm:block text-sm font-medium text-gray-500">
            Halaman {currentPage + 1} dari {totalPages}
            {isSubtest7 && (
              <span className="text-xs text-gray-400 ml-2">
                ({currentPage === 0 ? 'Soal 1–12 / No. 117–128' : 'Soal 13–20 / No. 129–136'})
              </span>
            )}
          </div>

          {currentPage === totalPages - 1 ? (
            <button
              onClick={handleFinish}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm bg-[#8BC34A] text-white hover:bg-[#7cb342] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{isSaving ? 'Menyimpan...' : 'Selesai & Kumpulkan'}</span>
            </button>
          ) : (
            <button
              onClick={handleNextPage}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm bg-[#1A1A1A] text-white hover:bg-black transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isSaving ? 'Menyimpan...' : 'Selanjutnya'}</span>
              {!isSaving && <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      </div>

      {/* Obfuscation Overlay when window loses focus / backgrounded during anti-cheat */}
      {tabSwitchActive && isWindowBlurred && !showWarningModal && (
        <div 
          onClick={() => setIsWindowBlurred(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center cursor-pointer pointer-events-auto"
        >
          <div className="bg-white/10 p-6 rounded-2xl border border-white/20 max-w-md w-full text-white space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
              <EyeOff className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">Layar Disamarkan</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Jendela ujian terdeteksi kehilangan fokus atau beralih aplikasi. Untuk mencegah kecurangan dan perekaman layar, soal disamarkan sementara.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => setIsWindowBlurred(false)}
                className="w-full py-3 bg-[#8BC34A] hover:bg-[#7cb342] text-white font-bold rounded-xl text-sm transition-colors shadow-lg cursor-pointer"
              >
                Klik di Sini untuk Kembali ke Tes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security / Anti-Capture Warning Modal */}
      {antiCaptureActive && showWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-red-500/50 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-5 ring-8 ring-red-50">
              <ShieldAlert className="w-9 h-9" />
            </div>
            
            <div className="text-center space-y-2">
              <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider">
                Peringatan Keamanan Ujian (Ke-{warningCount})
              </span>
              <h3 className="text-xl font-extrabold text-gray-900">
                Upaya Tangkapan Layar Terdeteksi!
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed pt-1">
                {warningMessage || 'Pengambilan screenshot, perekaman layar, atau penggunaan pintasan tombol dilarang keras.'}
              </p>
            </div>

            <div className="my-5 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Ketentuan Kerahasiaan Soal:</span>
              </div>
              <p>
                Seluruh materi tes dilindungi hak cipta. Sistem telah mencatat aktivitas ini beserta waktu kejadian ke sistem pengawas ujian.
              </p>
            </div>

            <button
              onClick={() => {
                setShowWarningModal(false);
                setIsWindowBlurred(false);
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Saya Mengerti & Lanjutkan Pengerjaan</span>
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirm Finish Modal */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Selesai & Kumpulkan?</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menyelesaikan subtes ini? Jawaban tidak dapat diubah lagi setelah dikumpulkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmFinish}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-[#8BC34A] hover:bg-[#7cb342] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isSaving ? 'Menyimpan...' : 'Ya, Kumpulkan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Cancel Modal */}
      {showConfirmCancel && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Keluar ke Dashboard?</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Yakin ingin keluar ke dashboard? Waktu subtes akan terus berjalan di latar belakang.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmCancel(false)}
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
          onRetry={async () => {
            setShowScorecardModal(false);
            setAnswers({});
            setCurrentPage(0);
            setTimeLeft(timeLimitMinutes * 60);
            setIsTimeUp(false);
            subtestStartTimeRef.current = await getTrueTime();
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
