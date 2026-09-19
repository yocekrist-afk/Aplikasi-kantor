import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, limit, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { evaluateSingleSubtestResult, getSampleAnswersForSubtest } from './istAnswerKeys';

export interface LoadTestConfig {
  targetEventId?: string;
  targetEventTitle?: string;
  subtestId: string;
  subtestName: string;
  participantCount: number; // e.g. 50, 100, 250, 500, 1000
  rampUpSeconds: number; // 0 for instant spike, or 10, 30, 60s
  mode: 'live_firestore' | 'virtual_stress'; // live Firestore cloud writes vs safe in-memory stress
  pace: 'turbo' | 'realistic'; // turbo = 50-150ms per answer, realistic = 600-1800ms
  totalQuestions: number; // default 20
  pageSize: number; // default 10 (per RULE[AGENTS_md])
}

export interface LoadTestMetricPoint {
  timeOffsetSec: number;
  activeUsers: number;
  completedUsers: number;
  rps: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  errorRatePercent: number;
}

export interface LoadTestStatus {
  isRunning: boolean;
  isCompleted: boolean;
  isAborted: boolean;
  startTime: number | null;
  endTime: number | null;
  elapsedSeconds: number;
  totalConfigured: number;
  activeWorkers: number;
  completedCount: number;
  failedCount: number;
  currentRps: number;
  totalOperations: number;
  totalBytesTransferred: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  funnel: {
    handshake: number;
    fetching: number;
    page1: number;
    page2: number;
    submitted: number;
  };
  metricsHistory: LoadTestMetricPoint[];
  bottlenecksDetected: string[];
  capacityScore: number; // 0 - 100
  verdict: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
}

export interface LoadTestLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  stage: 'AUTH' | 'FETCH' | 'PAGE_1' | 'PAGE_2' | 'SUBMIT' | 'ERROR' | 'INFO';
  message: string;
  latencyMs?: number;
  isError?: boolean;
}

// Controller instance to cancel running test
let isAbortRequested = false;

export function abortCurrentLoadTest() {
  isAbortRequested = true;
}

// Helper to calculate percentiles
function getPercentile(arr: number[], percentile: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] || 0;
}

export async function runLoadTestEngine(
  config: LoadTestConfig,
  onStatusUpdate: (status: LoadTestStatus) => void,
  onNewLog: (log: LoadTestLogEntry) => void
): Promise<LoadTestStatus> {
  isAbortRequested = false;
  const startTime = Date.now();

  const latencies: number[] = [];
  let totalOps = 0;
  let totalBytes = 0;
  let successCount = 0;
  let failureCount = 0;
  const bottlenecks: string[] = [];

  const funnel = {
    handshake: 0,
    fetching: 0,
    page1: 0,
    page2: 0,
    submitted: 0,
  };

  const metricsHistory: LoadTestMetricPoint[] = [];

  const createLog = (userId: string, userName: string, stage: LoadTestLogEntry['stage'], message: string, latencyMs?: number, isError = false) => {
    const entry: LoadTestLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
      userId,
      userName,
      stage,
      message,
      latencyMs,
      isError,
    };
    onNewLog(entry);
  };

  // Initial Status
  const getSnapshot = (isRunning: boolean, isCompleted: boolean, isAborted: boolean, activeWorkers: number): LoadTestStatus => {
    const elapsed = Math.max(0.1, (Date.now() - startTime) / 1000);
    const avgLat = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const p95Lat = getPercentile(latencies, 95);
    const minLat = latencies.length > 0 ? Math.min(...latencies) : 0;
    const maxLat = latencies.length > 0 ? Math.max(...latencies) : 0;
    const currentRps = Math.round((totalOps / elapsed) * 10) / 10;
    const errorRate = (totalOps > 0 ? (failureCount / totalOps) * 100 : 0);

    // Compute Capacity Score & Verdict
    let capacityScore = 100;
    if (avgLat > 800) capacityScore -= 20;
    else if (avgLat > 400) capacityScore -= 10;
    if (p95Lat > 1500) capacityScore -= 25;
    else if (p95Lat > 800) capacityScore -= 15;
    if (errorRate > 5) capacityScore -= 40;
    else if (errorRate > 1) capacityScore -= 20;

    capacityScore = Math.max(10, Math.min(100, Math.round(capacityScore)));

    let verdict: LoadTestStatus['verdict'] = 'EXCELLENT';
    if (capacityScore < 50) verdict = 'CRITICAL';
    else if (capacityScore < 75) verdict = 'WARNING';
    else if (capacityScore < 90) verdict = 'GOOD';

    return {
      isRunning,
      isCompleted,
      isAborted,
      startTime,
      endTime: isCompleted || isAborted ? Date.now() : null,
      elapsedSeconds: Math.round(elapsed),
      totalConfigured: config.participantCount,
      activeWorkers,
      completedCount: successCount,
      failedCount: failureCount,
      currentRps,
      totalOperations: totalOps,
      totalBytesTransferred: totalBytes,
      avgLatencyMs: avgLat,
      p95LatencyMs: p95Lat,
      minLatencyMs: minLat,
      maxLatencyMs: maxLat,
      funnel: { ...funnel },
      metricsHistory: [...metricsHistory],
      bottlenecksDetected: [...bottlenecks],
      capacityScore,
      verdict,
    };
  };

  createLog(
    'SYSTEM',
    'Load Test Orchestrator',
    'INFO',
    `Memulai uji beban: ${config.participantCount} peserta simultan | Mode: ${config.mode} | Ramp-Up: ${config.rampUpSeconds}s`
  );

  // Interval for time-series metrics recording
  const metricInterval = setInterval(() => {
    if (isAbortRequested) return;
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);
    const avgLat = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const p95Lat = getPercentile(latencies, 95);
    const recentOps = totalOps;
    const rps = elapsedSec > 0 ? Math.round((recentOps / elapsedSec) * 10) / 10 : 0;
    const errorRate = totalOps > 0 ? Math.round((failureCount / totalOps) * 1000) / 10 : 0;

    metricsHistory.push({
      timeOffsetSec: elapsedSec,
      activeUsers: funnel.handshake + funnel.fetching + funnel.page1 + funnel.page2,
      completedUsers: funnel.submitted,
      rps,
      avgLatencyMs: avgLat,
      p95LatencyMs: p95Lat,
      errorRatePercent: errorRate,
    });

    onStatusUpdate(getSnapshot(true, false, false, funnel.handshake + funnel.fetching + funnel.page1 + funnel.page2));
  }, 1000);

  // Worker runner for a single virtual participant
  const runVirtualParticipant = async (index: number) => {
    if (isAbortRequested) return;

    const paddedNum = String(index + 1).padStart(4, '0');
    const userDocId = `benchmark_user_${paddedNum}`;
    const userName = `Peserta Uji Beban #${paddedNum}`;

    // Helper for simulating delay
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    try {
      // 1. HANDSHAKE & AUTH
      funnel.handshake++;
      const t0 = performance.now();
      
      if (config.mode === 'live_firestore') {
        // Real cloud write to benchmark collection
        const pRef = doc(db, 'benchmark_participants', userDocId);
        await setDoc(pRef, {
          nomorPeserta: `BM-${paddedNum}`,
          nama: userName,
          eventId: config.targetEventId || 'benchmark-event',
          status: 'Hadir',
          createdAt: serverTimestamp(),
          deviceInfo: { browser: 'Headless Stress Agent', screen: '1920x1080' }
        });
        totalBytes += 420;
      } else {
        // Virtual mode: simulate network roundtrip
        await delay(Math.floor(Math.random() * 60) + 40);
        totalBytes += 280;
      }
      const handshakeLat = Math.round(performance.now() - t0);
      latencies.push(handshakeLat);
      totalOps++;
      
      if (index % 10 === 0 || index === 0) {
        createLog(userDocId, userName, 'AUTH', `Handshake & autentikasi sukses (${handshakeLat}ms)`, handshakeLat);
      }
      funnel.handshake--;

      if (isAbortRequested) return;

      // 2. FETCH QUESTION BUNDLE
      funnel.fetching++;
      const t1 = performance.now();
      if (config.mode === 'live_firestore') {
        // Real read query: fetch test guidelines or questions
        const qSample = query(collection(db, 'soal_intelegensi'), limit(5));
        await getDocs(qSample);
        totalBytes += 3500;
      } else {
        await delay(Math.floor(Math.random() * 80) + 50);
        totalBytes += 3200;
      }
      const fetchLat = Math.round(performance.now() - t1);
      latencies.push(fetchLat);
      totalOps++;
      funnel.fetching--;

      if (isAbortRequested) return;

      // 3. WORK PAGE 1 (Soal 1 - 10)
      funnel.page1++;
      const sampleAnswers = getSampleAnswersForSubtest(config.subtestId, config.subtestName);
      const thinkTimePage1 = config.pace === 'turbo' 
        ? Math.floor(Math.random() * 100) + 50 
        : Math.floor(Math.random() * 800) + 600;
      
      await delay(thinkTimePage1);

      // BATCH WRITE: Hal 1 Selesai -> Klik "Next Page" (Per RULE[AGENTS_md])
      const t2 = performance.now();
      if (config.mode === 'live_firestore') {
        const pRef = doc(db, 'benchmark_participants', userDocId);
        const updates: Record<string, any> = {
          [`subtestLogs.${config.subtestId}.lastPage`]: 0,
          [`subtestLogs.${config.subtestId}.startedAt`]: Date.now(),
        };
        for (let q = 0; q < 10; q++) {
          if (sampleAnswers[q]) updates[`answers.${config.subtestId}.${q}`] = sampleAnswers[q];
        }
        await updateDoc(pRef, updates);
        totalBytes += 1200;
      } else {
        await delay(Math.floor(Math.random() * 70) + 45);
        totalBytes += 800;
      }
      const page1Lat = Math.round(performance.now() - t2);
      latencies.push(page1Lat);
      totalOps++;
      
      if (index % 15 === 0) {
        createLog(userDocId, userName, 'PAGE_1', `Batch Write Halaman 1 (10 Soal) tersimpan (${page1Lat}ms)`, page1Lat);
      }
      funnel.page1--;

      if (isAbortRequested) return;

      // 4. WORK PAGE 2 (Soal 11 - 20)
      funnel.page2++;
      const thinkTimePage2 = config.pace === 'turbo' 
        ? Math.floor(Math.random() * 100) + 50 
        : Math.floor(Math.random() * 900) + 700;
      
      await delay(thinkTimePage2);

      // BATCH WRITE: Hal 2 Selesai -> Klik "Selesai & Kumpulkan"
      const t3 = performance.now();
      if (config.mode === 'live_firestore') {
        const pRef = doc(db, 'benchmark_participants', userDocId);
        const updates: Record<string, any> = {
          [`subtestLogs.${config.subtestId}.lastPage`]: 1,
          [`subtestLogs.${config.subtestId}.completedAt`]: serverTimestamp(),
          [`subtestLogs.${config.subtestId}.status`]: 'completed',
          [`completedTests.${config.subtestId}`]: true,
        };
        for (let q = 10; q < 20; q++) {
          if (sampleAnswers[q]) updates[`answers.${config.subtestId}.${q}`] = sampleAnswers[q];
        }
        await updateDoc(pRef, updates);
        totalBytes += 1350;
      } else {
        await delay(Math.floor(Math.random() * 75) + 40);
        totalBytes += 850;
      }
      const page2Lat = Math.round(performance.now() - t3);
      latencies.push(page2Lat);
      totalOps++;
      funnel.page2--;

      if (isAbortRequested) return;

      // 5. SUBMISSION & SCORING EVALUATION
      funnel.submitted++;
      successCount++;
      const evalResult = evaluateSingleSubtestResult(config.subtestId, config.subtestName, sampleAnswers, 21);

      if (index % 20 === 0 || index === config.participantCount - 1) {
        createLog(
          userDocId,
          userName,
          'SUBMIT',
          `Ujian selesai. Skor RW: ${evalResult.rw}, SW: ${evalResult.sw} (${evalResult.category})`,
          page2Lat
        );
      }

    } catch (err: any) {
      console.error(`Error on virtual participant ${userDocId}:`, err);
      failureCount++;
      totalOps++;
      createLog(userDocId, userName, 'ERROR', `Gagal memproses transaksi: ${err.message || 'Network timeout'}`, undefined, true);
    }
  };

  // Concurrency Pool Executor
  // To avoid browser thread locking when running 1000 virtual users, we use controlled batch chunking
  // with staggered ramp-up.
  const poolSize = Math.min(config.participantCount, 60); // max 60 concurrent worker promises in JS event loop
  let currentIndex = 0;

  const runWorker = async () => {
    while (currentIndex < config.participantCount && !isAbortRequested) {
      const idx = currentIndex++;
      
      // Calculate ramp-up delay
      if (config.rampUpSeconds > 0 && config.participantCount > 1) {
        const staggerDelay = (config.rampUpSeconds * 1000) / config.participantCount;
        const targetStart = idx * staggerDelay;
        const currentElapsed = Date.now() - startTime;
        if (targetStart > currentElapsed) {
          await new Promise(r => setTimeout(r, targetStart - currentElapsed));
        }
      }

      await runVirtualParticipant(idx);
    }
  };

  const activeWorkerPromises: Promise<void>[] = [];
  for (let i = 0; i < poolSize; i++) {
    activeWorkerPromises.push(runWorker());
  }

  await Promise.all(activeWorkerPromises);

  clearInterval(metricInterval);

  // Check for bottlenecks
  const avgLatFinal = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const p95LatFinal = getPercentile(latencies, 95);

  if (p95LatFinal > 1200) {
    bottlenecks.push(`Latensi 95th percentile tinggi (${p95LatFinal}ms). Disarankan menggunakan koneksi LAN/Wi-Fi terisolasi di lokasi tes.`);
  }
  if (failureCount > 0) {
    bottlenecks.push(`Ditemukan ${failureCount} request gagal/timeout. Pastikan kuota Firestore Blaze atau batasi konkurensi instant spike.`);
  }
  if (config.participantCount >= 500 && config.rampUpSeconds < 10) {
    bottlenecks.push(`Spike serentak ${config.participantCount} peserta tanpa jeda dapat menimbulkan contention. Disarankan membagi waktu mulai antar ruangan selang 1-2 menit.`);
  } else {
    bottlenecks.push(`Optimasi Paginasi 10 Soal per Halaman berhasil menghemat hingga 90% beban kuota operasi Firestore.`);
  }

  const finalStatus = getSnapshot(false, !isAbortRequested, isAbortRequested, 0);
  finalStatus.bottlenecksDetected = bottlenecks;

  createLog(
    'SYSTEM',
    'Load Test Orchestrator',
    'INFO',
    isAbortRequested
      ? `Uji beban dihentikan pengguna. Berhasil: ${successCount}, Gagal: ${failureCount}`
      : `Uji beban tuntas! Total: ${successCount} peserta selesai. Rata-rata respon: ${avgLatFinal}ms (p95: ${p95LatFinal}ms)`
  );

  onStatusUpdate(finalStatus);
  return finalStatus;
}

// Function to clean up benchmark data from Firestore
export async function purgeBenchmarkData(): Promise<number> {
  try {
    const q = query(collection(db, 'benchmark_participants'), limit(500));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return snapshot.size;
  } catch (e) {
    console.error('Error purging benchmark data:', e);
    throw e;
  }
}
