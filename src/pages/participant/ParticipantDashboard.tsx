import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Calendar, LayoutDashboard, HelpCircle, Menu, LogOut, FileText, CheckSquare, Clock, Users, Settings, MonitorPlay, Sparkles } from 'lucide-react';
import { ParticipantFaq } from './ParticipantFaq';
import { ParticipantSettings } from './ParticipantSettings';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PWAInstallButton } from '../../components/PWAInstallButton';
import { TestEngine } from './TestEngine';
import { Subtest9Flow } from './Subtest9Flow';
import { WebcamCapture } from './WebcamCapture';
import { PreTestTutorial } from './PreTestTutorial';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useFirestore } from '../../hooks/useFirestore';
import { ParticipantSimulationModal, SimulationConfig } from '../../components/ParticipantSimulationModal';

interface ParticipantDashboardProps {
  eventData: any;
  onLogout: () => void;
  user: any;
}

export function ParticipantDashboard({ eventData, onLogout, user }: ParticipantDashboardProps) {
  const { data: settingsData } = useFirestore('app_settings');
  const appSettings = settingsData?.[0] || {};
  const displayAppName = appSettings.appName || 'LPP V.1';
  const nameParts = displayAppName.split(' ');
  let mainName = displayAppName;
  let subName = '';
  if (nameParts.length > 1 && nameParts[nameParts.length - 1].toLowerCase().startsWith('v.')) {
    subName = nameParts.pop() || '';
    mainName = nameParts.join(' ');
  }

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [currentView, setCurrentView] = useState<'overview' | 'detail' | 'faq' | 'settings' | 'test_engine' | 'tutorial'>('overview');
  const [showWebcam, setShowWebcam] = useState(false);
  const [tabSwitchActive, setTabSwitchActive] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isEventStarted, setIsEventStarted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkTime = () => {
      if (!eventData?.date) {
        setIsEventStarted(false);
        return;
      }
      const now = new Date();
      const startTime = eventData?.startTime || '00:00';
      const endTime = eventData?.endTime || '23:59';
      const startDate = new Date(`${eventData.date}T${startTime}:00`);
      const endDate = new Date(`${eventData.date}T${endTime}:00`);
      setIsEventStarted(now >= startDate && now <= endDate);
    };

    checkTime(); // check immediately
    const interval = setInterval(checkTime, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [eventData]);

  const [completedTests, setCompletedTests] = useState<string[]>([]);
  const [participantData, setParticipantData] = useState<any>(null);
  const [clientLogo, setClientLogo] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [isSimulasiMode, setIsSimulasiMode] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simDisableAntiCheat, setSimDisableAntiCheat] = useState(false);
  const [simAutoFill, setSimAutoFill] = useState(false);
  const [requireWebcam, setRequireWebcam] = useState(true);
  const [activeTestInfo, setActiveTestInfo] = useState<{ id: string, name: string, total: number, limit: number } | null>(null);
  const [durasiSettings, setDurasiSettings] = useState<any>({});

  const handleStartSimulation = (config: SimulationConfig) => {
    setShowSimulationModal(false);
    setSimDisableAntiCheat(!config.antiCheatEnabled);
    setSimAutoFill(config.autoFillSampleAnswers);
    setActiveTestInfo({
      id: config.subtestId,
      name: config.subtestName,
      total: config.subtestId === 'trial' ? 5 : 20,
      limit: config.durationMinutes
    });
    setIsSimulasiMode(true);
    setCurrentView('test_engine');
  };

  useEffect(() => {
    let unsubscribe = () => {};
    let unsubscribeDurasi = () => {};
    let unsubscribeApp = () => {};

    const initSession = async () => {
      try {
        if (eventData?.clientId) {
          try {
            
            const clientRef = doc(db, 'clients', eventData.clientId);
            getDoc(clientRef).then((snap: any) => {
              if (snap.exists()) {
                if (snap.data().logo) setClientLogo(snap.data().logo);
                if (snap.data().nama) setClientName(snap.data().nama);
              }
            });
          } catch(e) {}
        }
        unsubscribeApp = onSnapshot(collection(db, 'app_settings'), (snapshot) => {
          if (!snapshot.empty) {
            const configDocs = snapshot.docs.filter(d => d.id !== 'durasi_tes');
            if (configDocs.length > 0) {
              const config = configDocs[0].data();
              if (config.requireWebcam !== undefined) setRequireWebcam(config.requireWebcam);
              if (config.tabSwitchDetect !== undefined) {
                setTabSwitchActive(config.tabSwitchDetect);
              } else if (config.requireAntiCheat !== undefined) {
                setTabSwitchActive(config.requireAntiCheat); // legacy fallback
              }
            }
          }
        });
        
        const durasiRef = doc(db, "app_settings", "durasi_tes");
        unsubscribeDurasi = onSnapshot(durasiRef, (docSnap) => {
          if (docSnap.exists()) {
            setDurasiSettings(docSnap.data());
          }
        });
      } catch(e) {}
      if (user && eventData?.id) {
        // 1. Dapatkan atau buat session ID lokal
        let localSessionId = localStorage.getItem('participantSessionId');
        if (!localSessionId) {
          localSessionId = Math.random().toString(36).substring(2, 15);
          localStorage.setItem('participantSessionId', localSessionId);
        }

        let pDoc: any = null;
        let pId = user.docId || '';

        if (pId) {
          try {
            const directSnap = await getDoc(doc(db, 'participants', pId));
            if (directSnap.exists()) {
              pDoc = directSnap;
            }
          } catch(e) {}
        }

        if (!pDoc) {
          const q = query(collection(db, 'participants'), where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const found = querySnapshot.docs.find(d => {
            const data = d.data();
            return data.eventId === eventData.id || data.eventId === eventData.slug;
          });
          if (found) {
            pDoc = found;
            pId = found.id;
          }
        }
        
        if (pDoc) {
          const pData = pDoc.data();
          
          setParticipantData({ id: pId, ...pData });
          
          // 3. Update session ID di Firestore
          await updateDoc(doc(db, 'participants', pId), {
             sessionId: localSessionId
          });

          // 4. Dengarkan perubahan secara real-time
          unsubscribe = onSnapshot(doc(db, 'participants', pId), (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              if (data.sessionId && data.sessionId !== localSessionId) {
                // Sesi diambil alih oleh perangkat lain!
                alert("Perhatian: Akun Anda telah masuk (login) di perangkat atau browser lain. Sesi di layar ini akan ditutup otomatis demi keamanan.");
                onLogout();
                return;
              }
              
              // Simpan data peserta terbaru secara real-time
              setParticipantData({ id: pId, ...data });

              const completed = data.completedTests 
                ? Object.keys(data.completedTests).filter(key => data.completedTests[key] === true)
                : [];
              setCompletedTests(completed);
            }
          });
        }
      }
    };

    initSession();
    return () => { unsubscribe(); unsubscribeDurasi(); unsubscribeApp(); };
  }, [user, eventData]);

  useEffect(() => {
    if (!tabSwitchActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab changed or minimized
        alert("PERINGATAN SISTEM ANTI-KECURANGAN 🚨\n\nSistem mendeteksi Anda berpindah layar, membuka tab baru, atau meminimalkan browser.\nAktivitas Anda diawasi. Pelanggaran berulang dapat menyebabkan ujian dibatalkan otomatis.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [tabSwitchActive]);

  const getCategoryMeta = (kategori: string) => {
    const lower = kategori.toLowerCase();
    if (lower.includes('intelegensi')) return { subtes: 9, soal: durasiSettings.intelegensi_soal || 175, waktu: durasiSettings.intelegensi_waktu || 72, icon: '🧩' };
    if (lower.includes('kepribadian')) return { subtes: 1, soal: durasiSettings.karakteristik_soal || 90, waktu: durasiSettings.karakteristik_waktu || 20, icon: '👥' };
    if (lower.includes('papi')) return { subtes: 1, soal: durasiSettings.papi_kostick_soal || 90, waktu: durasiSettings.papi_kostick_waktu || 20, icon: '📋' };
    if (lower.includes('sikap kerja')) return { subtes: 1, soal: durasiSettings.sikap_kerja_soal || 40, waktu: durasiSettings.sikap_kerja_waktu || 20, icon: '💼' };
    if (lower.includes('kecerdasan')) return { subtes: 1, soal: durasiSettings.kecerdasan_soal || 50, waktu: durasiSettings.kecerdasan_waktu || 30, icon: '🧠' };
    if (lower.includes('gaya belajar')) return { subtes: 1, soal: durasiSettings.gaya_belajar_soal || 30, waktu: durasiSettings.gaya_belajar_waktu || 20, icon: '👨‍🏫' };
    if (lower.includes('minat') || lower.includes('rmib')) return { subtes: 9, soal: durasiSettings.rmib_soal || 9, waktu: durasiSettings.rmib_waktu || 20, icon: '🎯' };
    return { subtes: 1, soal: 50, waktu: 30, icon: '📝' };
  };


  const getExpandedCategories = () => {
    if (!eventData?.kategoriSoal) return [];
    
    let expanded: any[] = [];
    eventData.kategoriSoal.forEach((kat: string, idx: number) => {
      const lower = kat.toLowerCase();
      if (lower.includes('intelegensi')) {
        const istNames = ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'];
        istNames.forEach((istName, istIdx) => {
          expanded.push({
            id: `subtest_${idx}_ist_${istIdx + 1}`,
            originalName: kat,
            displayName: `${kat} (Subtes ${istIdx + 1} - ${istName})`,
            soal: durasiSettings[`ist_${istIdx + 1}_soal`] || 20,
            waktu: durasiSettings[`ist_${istIdx + 1}_waktu`] || 8,
            subtes: 1,
            icon: '🧩'
          });
        });
      } else {
        const meta = getCategoryMeta(kat);
        expanded.push({
          id: `subtest_${idx}`,
          originalName: kat,
          displayName: kat,
          soal: meta.soal,
          waktu: meta.waktu,
          subtes: meta.subtes,
          icon: meta.icon
        });
      }
    });
    return expanded;
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Left Column */}
      <div className="space-y-6">
        {/* Event Card */}
        <div className="bg-[#8BC34A] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
          <div className="flex flex-col h-full relative z-10">
            <div className="flex items-center space-x-2 text-sm font-semibold opacity-90 mb-4">
              <LayoutDashboard className="w-4 h-4" />
              <span>{clientName || 'CLIENT NAME'}</span>
            </div>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-white rounded-full p-2 flex items-center justify-center flex-shrink-0">
                {clientLogo ? (
                  <img src={clientLogo} alt="Client Logo" className="w-full h-full object-contain rounded-full" />
                ) : (
                  <div className="w-full h-full rounded-full border-2 border-blue-600 flex items-center justify-center">
                    <div className="w-1/2 h-1/2 bg-yellow-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold">{eventData?.title || 'Tes Nia'}</h2>
            </div>
            
            <div className="flex items-center space-x-2 text-sm opacity-90 mb-6">
              <Calendar className="w-4 h-4" />
              <span>
                {eventData?.date ? new Date(eventData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 13, 2026'} 
                {' '} @ {eventData?.startTime || '10:00'} - {eventData?.endTime || '22:57'} WIB
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-auto relative z-10">
              <button 
                type="button"
                onClick={() => setShowSimulationModal(true)}
                className="bg-white/20 hover:bg-white/30 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/30 backdrop-blur-xs"
                title="Buka simulasi pengerjaan CBT, uji coba timer dan dapatkan evaluasi skor instan"
              >
                <MonitorPlay className="w-4 h-4 text-white" />
                <span>Simulasi Ujian (CBT)</span>
              </button>

              <button 
                onClick={() => setCurrentView('detail')}
                disabled={!isEventStarted}
                className={`${isEventStarted ? 'bg-[#FF9800] hover:bg-[#F57C00] text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer`}
              >
                {isEventStarted 
                  ? (getExpandedCategories().some((item: any) => {
                      const isDone = completedTests.includes(item.id) || Boolean(participantData?.completedTests?.[item.id]);
                      const started = Boolean(participantData?.testTimers?.[item.id] || participantData?.subtestLogs?.[item.id]?.startedAt);
                      return started && !isDone;
                    }) ? 'Lanjutkan Tes' : 'Mulai Tes')
                  : 'Belum Dimulai'}
              </button>
            </div>
          </div>
          {/* Decorative background element */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Rules Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <ol className="space-y-4 text-sm text-gray-600 list-decimal list-inside leading-relaxed">
            <li>Pastikan Anda memahami tata cara menjawab pertanyaan-pertanyaan tes yang akan diberikan.</li>
            <li>Pastikan Anda memahami batas waktu yang diberikan untuk melaksanakan tes, setiap bagian tes memiliki batas waktu yang berbeda-beda.</li>
            <li>Sistem akan mencatat setiap aksi yang Anda lakukan dalam tes.</li>
            <li>Anda baru dapat mengakses soal pada tanggal dan jam yang sudah dijadwalkan.</li>
            <li>Pada saat mengerjakan tes, Anda tidak diperkenankan membuka aplikasi lain dan halaman browser selain yang digunakan untuk tes ini. Karena aktivitas Anda selama menjalani tes akan direkam oleh sistem.</li>
          </ol>
        </div>
      </div>

      {/* Right Column */}
      <div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
          <p className="text-sm text-gray-600 mb-6">
            Untuk dapat melakukan tes dengan baik, harap menggunakan spesifikasi perangkat lunak berikut ini:
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 px-4 font-semibold text-gray-700 bg-gray-50/50 rounded-tl-lg"></th>
                  <th className="py-3 px-4 font-semibold text-gray-700 bg-gray-50/50">Disarankan</th>
                  <th className="py-3 px-4 font-semibold text-gray-700 bg-gray-50/50">Perangkat Anda</th>
                  <th className="py-3 px-4 bg-gray-50/50 rounded-tr-lg"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-4 px-4 font-medium text-gray-700">Browser</td>
                  <td className="py-4 px-4 text-gray-600">Google Chrome</td>
                  <td className="py-4 px-4 text-gray-600">Google Chrome or Chromium</td>
                  <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-gray-700">Cookie</td>
                  <td className="py-4 px-4 text-gray-600">Aktif</td>
                  <td className="py-4 px-4 text-gray-600">Aktif</td>
                  <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-gray-700">Perangkat</td>
                  <td className="py-4 px-4 text-gray-600">Desktop / Smartphone</td>
                  <td className="py-4 px-4 text-gray-600">
                    {typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Smartphone / Mobile' : 'Desktop / PC'}
                  </td>
                  <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-gray-700">Akses Kamera</td>
                  <td className="py-4 px-4 text-gray-600">Diizinkan</td>
                  <td className="py-4 px-4 text-gray-600">
                    <span className="text-red-500">Tidak diizinkan / tidak ada</span>
                    <p className="text-xs text-gray-400 mt-1 max-w-[150px]">Untuk mengizinkan harap ubah setting permission kamera pada konfigurasi browser Anda</p>
                  </td>
                  <td className="py-4 px-4 text-center align-top pt-5">
                    <div className="w-5 h-5 flex items-center justify-center mx-auto text-gray-300">-</div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-gray-700">Resolusi Layar</td>
                  <td className="py-4 px-4 text-gray-600">Minimum 1024 x 768</td>
                  <td className="py-4 px-4 text-gray-600">1440 x 900</td>
                  <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );

  const renderDetail = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-[#8BC34A] rounded-2xl p-8 text-white text-center shadow-sm relative overflow-hidden">
        <div className="flex justify-center mb-4 relative z-10">
          <div className="w-20 h-20 bg-white rounded-full p-2 flex items-center justify-center shadow-sm">
             <div className="w-full h-full rounded-full border-2 border-blue-600 flex items-center justify-center">
               <div className="w-1/2 h-1/2 bg-yellow-400 rounded-full"></div>
             </div>
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4 relative z-10">{eventData?.title || 'Tes Nia'}</h2>
        
        <div className="flex items-center justify-center space-x-2 text-sm font-semibold opacity-90 mb-2 relative z-10">
           <LayoutDashboard className="w-4 h-4" />
           <span>{clientName || 'CLIENT NAME'}</span>
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm opacity-90 relative z-10">
           <Calendar className="w-4 h-4" />
           <span>
             {eventData?.date ? new Date(eventData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 13, 2026'} 
             {' '} @ {eventData?.startTime || '10:00'} - {eventData?.endTime || '22:57'} WIB
           </span>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-10 -bottom-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <h3 className="text-center text-lg font-bold text-gray-800">Soal tes yang harus Anda selesaikan :</h3>

      {/* Grid of Tests */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {getExpandedCategories().length > 0 ? (
          getExpandedCategories().map((item: any) => {
            const { id, displayName: kat, soal, waktu, subtes, icon } = item;
            const meta = { soal, waktu, subtes, icon };
            const idx = id;

            const isCompleted = completedTests.includes(id) || Boolean(participantData?.completedTests?.[id]);
            const isSub9 = id.includes('ist_9') || kat.toLowerCase().includes('subtes 9') || kat.toLowerCase().includes('- me');
            const testStartTime = participantData?.testTimers?.[id] || 
                                  participantData?.testTimers?.[`${id}_memorize`] || 
                                  participantData?.subtestLogs?.[id]?.startedAt ||
                                  participantData?.subtestLogs?.[id]?.memorizeStartedAt;
            const hasStarted = !isCompleted && Boolean(testStartTime);
            
            const limitMinutes = meta.waktu || (isSub9 ? 9 : 8);
            const examStartTime = participantData?.testTimers?.[id] || participantData?.subtestLogs?.[id]?.examStartedAt;
            const isTimeExpired = hasStarted && (
              isSub9
                ? Boolean(examStartTime && (Date.now() - examStartTime >= (limitMinutes - 3) * 60 * 1000))
                : Boolean(testStartTime && (Date.now() - testStartTime >= limitMinutes * 60 * 1000))
            );

            return (
              <div 
                key={idx} 
                className={`bg-white rounded-2xl p-6 shadow-sm border flex flex-col items-center text-center transition-all ${
                  hasStarted && !isTimeExpired 
                    ? 'border-blue-400 ring-2 ring-blue-100 shadow-md' 
                    : 'border-gray-100 hover:shadow-md'
                }`}
              >
                <h4 className="font-bold text-gray-800 uppercase text-sm mb-4 h-10 flex items-center justify-center">{kat}</h4>
                <div className="flex items-center justify-center space-x-3 text-[11px] text-gray-500 mb-4 bg-gray-50 px-3 py-1.5 rounded-full">
                   <span className="flex items-center"><FileText className="w-3.5 h-3.5 mr-1 text-gray-400"/>{meta.subtes} subtes</span>
                   <span className="flex items-center"><CheckSquare className="w-3.5 h-3.5 mr-1 text-gray-400"/>{meta.soal} soal</span>
                   <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-gray-400"/>{meta.waktu} menit</span>
                </div>

                <div className="w-24 h-24 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 text-5xl relative">
                   {meta.icon}
                   {hasStarted && !isTimeExpired && (
                     <span className="absolute -top-1 -right-1 flex h-4 w-4" title="Ujian sedang berjalan">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600"></span>
                     </span>
                   )}
                </div>

                {isCompleted ? (
                  <button className="w-full bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold py-3 rounded-full text-sm transition-colors mt-auto cursor-default flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Tugas Selesai</span>
                  </button>
                ) : isTimeExpired ? (
                  <button 
                    onClick={() => handleStartOrResumeTest(item, true)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-full text-sm transition-colors mt-auto flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    title="Waktu pengerjaan subtes telah habis, klik untuk mengumpulkan"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Waktu Habis (Kumpulkan)</span>
                  </button>
                ) : hasStarted ? (
                  <button 
                    onClick={() => handleStartOrResumeTest(item, true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full text-sm transition-all mt-auto flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    title="Klik untuk melanjutkan pengerjaan subtes (langsung ke lembar soal)"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shrink-0"></span>
                    <span>Sedang Dikerjakan</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => handleStartOrResumeTest(item, false)}
                    disabled={!isEventStarted}
                    className={`w-full ${isEventStarted ? 'bg-[#1A1A1A] hover:bg-black text-white cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} font-bold py-3 rounded-full text-sm transition-colors mt-auto`}
                  >
                    {isEventStarted ? 'Mulai Test' : 'Belum Tersedia'}
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-10 text-gray-500">
            Belum ada kategori soal yang ditambahkan pada event ini.
          </div>
        )}
      </div>
    </div>
  );

  const handleStartOrResumeTest = (item: any, isResume: boolean) => {
    setActiveTestInfo({
      id: item.id,
      name: item.displayName,
      total: item.soal,
      limit: item.waktu
    });

    if (isResume) {
      // Jika status timer sudah berjalan / tes sedang dikerjakan:
      // Peserta TIDAK PERLU membaca instruksi kembali, langsung menuju ke TestEngine
      setCurrentView('test_engine');
    } else {
      // Pertama kali memulai subtes:
      if (requireWebcam && !participantData?.photoBase64) {
        setShowWebcam(true);
      } else {
        setCurrentView('tutorial');
      }
    }
  };

  const isSubtest9 = (info: any) => {
    if (!info) return false;
    const name = (info.name || info.displayName || '').toLowerCase();
    const id = (info.id || '').toLowerCase();
    return name.includes('subtes 9') || name.includes('ist_9') || name.includes('ist 9') || name.includes('- me') || name.includes('(me)') || id.includes('ist_9');
  };

  if (isSimulasiMode && activeTestInfo) {
    if (isSubtest9(activeTestInfo)) {
      return (
        <Subtest9Flow 
          participantId={participantData?.id || 'trial-user'}
          subtestId={activeTestInfo.id}
          subtestName={activeTestInfo.name}
          totalQuestions={20}
          timeLimitMinutes={activeTestInfo.limit || 9}
          isSimulation={true}
          disableAntiCheat={simDisableAntiCheat}
          autoFillSampleAnswers={simAutoFill}
          onFinish={() => {
            setIsSimulasiMode(false);
            setCurrentView('overview');
            setActiveTestInfo(null);
          }}
          onCancel={() => {
            setIsSimulasiMode(false);
            setCurrentView('overview');
            setActiveTestInfo(null);
          }}
        />
      );
    }

    return (
      <TestEngine 
        participantId={participantData?.id || 'trial-user'}
        subtestId={activeTestInfo.id}
        subtestName={activeTestInfo.name}
        totalQuestions={activeTestInfo.total}
        timeLimitMinutes={activeTestInfo.limit}
        isSimulation={true}
        disableAntiCheat={simDisableAntiCheat}
        autoFillSampleAnswers={simAutoFill}
        onFinish={() => {
          setIsSimulasiMode(false);
          setCurrentView('overview');
          setActiveTestInfo(null);
        }}
        onCancel={() => {
          setIsSimulasiMode(false);
          setCurrentView('overview');
          setActiveTestInfo(null);
        }}
      />
    );
  }

  // Subtes 9 (ME: Ingatan) memiliki 4 tahapan alur khusus (2 Instruksi + 2 Halaman Kerja)
  if ((currentView === 'tutorial' || currentView === 'test_engine') && activeTestInfo && participantData && isSubtest9(activeTestInfo)) {
    const dynamicLimit = getExpandedCategories().find(c => c.id === activeTestInfo.id)?.waktu || activeTestInfo.limit || 9;
    return (
      <Subtest9Flow 
        participantId={participantData.id}
        subtestId={activeTestInfo.id}
        subtestName={activeTestInfo.name}
        totalQuestions={20}
        timeLimitMinutes={dynamicLimit}
        onFinish={() => {
          setCurrentView('detail');
          setActiveTestInfo(null);
        }}
        onCancel={() => {
          setCurrentView('detail');
          setActiveTestInfo(null);
        }}
      />
    );
  }

  if (currentView === 'tutorial' && activeTestInfo && participantData) {
    return (
      <PreTestTutorial 
        subtestName={activeTestInfo.name}
        onStartTest={() => {
          // Optimistically update testTimers so UI immediately reflects 'in_progress'
          const now = Date.now();
          setParticipantData((prev: any) => ({
            ...prev,
            testTimers: {
              ...(prev?.testTimers || {}),
              [activeTestInfo.id]: now
            },
            subtestLogs: {
              ...(prev?.subtestLogs || {}),
              [activeTestInfo.id]: {
                ...(prev?.subtestLogs?.[activeTestInfo.id] || {}),
                startedAt: now,
                status: 'in_progress'
              }
            }
          }));
          setCurrentView('test_engine');
        }}
        onCancel={() => {
          setCurrentView('detail');
          setActiveTestInfo(null);
        }}
      />
    );
  }

  if (currentView === 'test_engine' && activeTestInfo && participantData) {
    const dynamicLimit = getExpandedCategories().find(c => c.id === activeTestInfo.id)?.waktu || activeTestInfo.limit;
    return (
      <TestEngine 
        participantId={participantData.id}
        subtestId={activeTestInfo.id}
        subtestName={activeTestInfo.name}
        totalQuestions={activeTestInfo.total}
        timeLimitMinutes={dynamicLimit}
        onFinish={() => {
          setCurrentView('detail');
          setActiveTestInfo(null);
        }}
        onCancel={() => {
          setCurrentView('detail');
          setActiveTestInfo(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#111] dark:bg-gray-950 text-white flex flex-col h-screen shadow-2xl transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0 lg:shadow-xl lg:z-[100] lg:shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}
      `}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            {appSettings.logoUrl ? (
              <img src={appSettings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center border border-purple-700/50">
                <span className="text-purple-400 font-bold text-sm">Ψ</span>
              </div>
            )}
            <div className="flex items-baseline space-x-1 truncate max-w-[150px]">
              <span className="text-xl font-bold tracking-wide truncate">{mainName}</span>
              {subName && <span className="text-[10px] text-gray-400">{subName}</span>}
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-[#8BC34A] mb-4 uppercase tracking-wider">Menu</div>
          <nav className="space-y-1">
            <button 
              onClick={() => {
                setIsSimulasiMode(false);
                setCurrentView('overview');
                if (typeof window !== 'undefined' && window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'overview' && !isSimulasiMode ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard className={`w-4 h-4 ${currentView === 'overview' && !isSimulasiMode ? 'text-[#8BC34A]' : ''}`} />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => {
                setIsSimulasiMode(false);
                setCurrentView('settings');
                if (typeof window !== 'undefined' && window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'settings' && !isSimulasiMode ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Settings className={`w-4 h-4 ${currentView === 'settings' && !isSimulasiMode ? 'text-[#8BC34A]' : ''}`} />
              <span>Pengaturan</span>
            </button>
            <div className="relative z-[100] isolate">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSimulationModal(true);
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer pointer-events-auto ${showSimulationModal || isSimulasiMode ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <MonitorPlay className={`w-4 h-4 ${showSimulationModal || isSimulasiMode ? 'text-[#8BC34A]' : ''}`} />
                <span>Simulasi Alur CBT</span>
              </button>
            </div>
            <button 
              onClick={() => {
                setIsSimulasiMode(false);
                setCurrentView('faq');
                if (typeof window !== 'undefined' && window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'faq' && !isSimulasiMode ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <HelpCircle className={`w-4 h-4 ${currentView === 'faq' && !isSimulasiMode ? 'text-[#8BC34A]' : ''}`} />
              <span>FAQ</span>
            </button>
          </nav>
          <div className="mt-6 px-3">
            <PWAInstallButton />
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-3 py-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shrink-0">
                {currentView === 'faq' ? <HelpCircle className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
              </div>
              <span className="font-semibold capitalize text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{currentView === 'detail' ? 'Detail Event' : currentView}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="hidden sm:inline text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-wider bg-indigo-50 dark:bg-indigo-900/30 px-2.5 sm:px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</span>
            <div className="hidden sm:block h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
            <ThemeToggle />
            <div className="hidden sm:block h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:inline">Selamat datang, <span className="font-semibold">{participantData?.namaPeserta || participantData?.nama || user?.displayName || 'Peserta'}</span></span>
            <div className="relative cursor-pointer shrink-0" onClick={() => setCurrentView('settings')}>
              <img src={participantData?.photoBase64 || "https://i.pravatar.cc/150?img=11"} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            <button onClick={onLogout} className="text-gray-500 hover:text-red-500 lg:hidden p-1.5 rounded-lg" title="Keluar">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full relative">
          
          {showWebcam && participantData && (
            <WebcamCapture 
              participantId={participantData.id}
              onVerified={() => {
                setShowWebcam(false);
                setParticipantData({ ...participantData, photoBase64: 'verified' }); // Optimistic update
                setCurrentView('tutorial');
              }}
              onCancel={() => {
                setShowWebcam(false);
                setActiveTestInfo(null);
              }}
            />
          )}

          {currentView === 'overview' && renderOverview()}
          {currentView === 'detail' && renderDetail()}
          {currentView === 'faq' && <ParticipantFaq />}
          {currentView === 'settings' && <ParticipantSettings participantData={participantData} onUpdateParticipant={(newData) => setParticipantData({...participantData, ...newData})} user={user} eventData={eventData} />}
        </div>
      </div>

      {/* Participant CBT Simulation Modal */}
      <ParticipantSimulationModal
        isOpen={showSimulationModal}
        onClose={() => setShowSimulationModal(false)}
        onStartSimulation={handleStartSimulation}
      />
    </div>
  );
}
