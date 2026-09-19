import { confirmAction } from './utils/confirmAction';
import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Administrator } from './pages/Administrator';
import { Peserta } from './pages/Peserta';
import { SoalGayaBelajar } from './pages/SoalGayaBelajar';
import { Event } from './pages/Event';
import { Faq } from './pages/Faq';
import { Instruksi } from './pages/Instruksi';
import { Simbol } from './pages/Simbol';
import { Client } from './pages/Client';
import { KategoriSoal } from './pages/KategoriSoal';
import { ProgramStudy } from './pages/ProgramStudy';
import { SoalIntelegensi } from './pages/SoalIntelegensi';
import { SoalMbti } from './pages/SoalMbti';
import { SoalPapiKostick } from './pages/SoalPapiKostick';
import { SoalRmib } from './pages/SoalRmib';
import { SoalSimulasi } from './pages/SoalSimulasi';
import { Pengaturan } from './pages/Pengaturan';
import { PengaturanAset } from './pages/PengaturanAset';
import { PengaturanDurasi } from './pages/PengaturanDurasi';
import { TabulasiPenilaian } from './pages/TabulasiPenilaian';
import { UjiBeban } from './pages/UjiBeban';
import { ParticipantPortal } from './pages/ParticipantPortal';
import { Login } from './pages/Login';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useFirestore } from './hooks/useFirestore';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BackupPrompt } from './components/BackupPrompt';

// Legacy Imports
import { FileText, BarChart3, BookOpen, Code2, Download, Sparkles, Menu, X, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';
import { Participant } from './types/ist';
import { AppSettings, getStoredSettings, saveStoredSettings } from './types/settings';
import { INITIAL_SAMPLE_PARTICIPANTS, downloadExcelTemplate } from './utils/sampleData';
import { exportMasterScoreSheetToExcel } from './utils/excelExport';
import { FileUploadSection } from './components/FileUploadSection';
import { ParticipantTable } from './components/ParticipantTable';
import { ReportPreview } from './components/ReportPreview';
import { AnalyticsView } from './components/AnalyticsView';
import { NormGuideView } from './components/NormGuideView';
import { PythonCodeViewer } from './components/PythonCodeViewer';
import { SettingsModal } from './components/SettingsModal';
import { ParticipantFormModal } from './components/ParticipantFormModal';
import { BatchExportModal } from './components/BatchExportModal';
import { DataProfilingView } from './components/DataProfilingView';

export default function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [activeSubtest, setActiveSubtest] = useState<string>('all');
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/p/')) {
      const eventId = path.split('/')[2];
      if (eventId) {
        setActiveEventId(eventId);
        setActiveMenu('participant_portal');
      }
    }
  }, []);

  const handleNavigate = async (menu: string, subtest?: string) => {
    setActiveMenu(menu);
    if (menu === 'soal_intelegensi') {
      setActiveSubtest(subtest || 'all');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  // -- Legacy State (Kept for "legacy" view) --
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_SAMPLE_PARTICIPANTS);
  const [activeTab, setActiveTab] = useState<'data' | 'profiling' | 'analytics' | 'guide' | 'python'>('data');
  const [selectedParticipantForReport, setSelectedParticipantForReport] = useState<Participant | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => getStoredSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isParticipantFormOpen, setIsParticipantFormOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);
  const [batchExportTargets, setBatchExportTargets] = useState<Participant[]>([]);
  
  const [bypassAuth, setBypassAuth] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('require_admin_login');
      // Default: login dipostpone / bypass aktif (tidak perlu login)
      return stored !== 'true';
    }
    return true;
  });

  const { data: adminsData } = useFirestore('administrators');
  const { data: settingsData } = useFirestore('app_settings');

  const appConfig = settingsData?.find(d => d.id !== 'durasi_tes') || settingsData?.[0];

  useEffect(() => {
    if (appConfig?.requireAdminLogin !== undefined) {
      localStorage.setItem('require_admin_login', String(appConfig.requireAdminLogin));
      setBypassAuth(!appConfig.requireAdminLogin);
    }
  }, [appConfig?.requireAdminLogin]);

  const isRequireLogin = !bypassAuth && (appConfig?.requireAdminLogin ?? false);
  const effectiveEmail = user?.email || auth.currentUser?.email || (bypassAuth ? 'joniwaluyo48@gmail.com' : '');
  const currentAdmin = adminsData?.find(a => a.username?.toLowerCase() === effectiveEmail.toLowerCase());
  const isOwner = effectiveEmail.toLowerCase() === 'joniwaluyo48@gmail.com'.toLowerCase();
  
  const ALL_PERMS = ['dashboard', 'event', 'peserta', 'tabulasi_penilaian', 'faq', 'instruksi', 'simbol', 'client', 'kategori_soal', 'program_study', 'soal_gaya_belajar', 'soal_mbti', 'soal_papi_kostick', 'soal_rmib', 'soal_intelegensi', 'soal_simulasi', 'administrator', 'pengaturan', 'pengaturan_aset', 'pengaturan_durasi', 'uji_beban', 'legacy'];
  const BASIC_PERMS = ['dashboard', 'event', 'peserta', 'tabulasi_penilaian', 'faq'];
  
  const userPerms = isOwner ? ALL_PERMS : (currentAdmin?.permissions || (currentAdmin?.role === 'super_admin' ? ALL_PERMS : BASIC_PERMS));
  const hasAccess = (menuId: string) => userPerms.includes(menuId);
  
  // -- Legacy Handlers --
  const handleDataLoaded = async (newParticipants: Participant[]) => setParticipants(newParticipants);
  const handleAppendData = async (newParticipants: Participant[]) => setParticipants((prev) => [...prev, ...newParticipants]);
  const handleDeleteParticipant = async (id: string) => setParticipants((prev) => prev.filter((p) => p.id !== id));
  const handleClearAll = async () => { if (await confirmAction('Hapus semua?')) setParticipants([]); };
  const handleSaveSettings = async (newSettings: AppSettings) => { setAppSettings(newSettings); saveStoredSettings(newSettings); };
  const handleAddNewParticipant = async () => { setEditingParticipant(null); setIsParticipantFormOpen(true); };
  const handleEditParticipant = async (p: Participant) => { setEditingParticipant(p); setIsParticipantFormOpen(true); };
  const handleSaveParticipant = async (participant: Participant) => {
    setParticipants((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === participant.id);
      if (existsIndex >= 0) { const next = [...prev]; next[existsIndex] = participant; return next; }
      return [participant, ...prev];
    });
    if (selectedParticipantForReport && selectedParticipantForReport.id === participant.id) {
      setSelectedParticipantForReport(participant);
    }
  };
  const handleOpenBatchExport = async (selectedParticipants: Participant[]) => {
    const targets = selectedParticipants.length > 0 ? selectedParticipants : participants;
    if (targets.length === 0) return alert('Kosong');
    setBatchExportTargets(targets); setIsBatchExportOpen(true);
  };
  const handleExportExcel = async (selectedParticipants: Participant[]) => {
    const targets = selectedParticipants.length > 0 ? selectedParticipants : participants;
    if (targets.length === 0) return alert('Kosong');
    exportMasterScoreSheetToExcel(targets);
  };

  // Render Page Content based on route
  const renderContent = () => {
    switch(activeMenu) {
      case 'dashboard': return hasAccess('dashboard') ? <Dashboard /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'administrator': return hasAccess('administrator') ? <Administrator /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'peserta': return hasAccess('peserta') ? <Peserta /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'tabulasi_penilaian': return hasAccess('tabulasi_penilaian') ? <TabulasiPenilaian /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'uji_beban': return hasAccess('uji_beban') ? <UjiBeban /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'event': return hasAccess('event') ? <Event onNavigateToLoadTest={hasAccess('uji_beban') ? () => handleNavigate('uji_beban') : undefined} /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'faq': return hasAccess('faq') ? <Faq /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'instruksi': return hasAccess('instruksi') ? <Instruksi /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'simbol': return hasAccess('simbol') ? <Simbol /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'client': return hasAccess('client') ? <Client /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'kategori_soal': return hasAccess('kategori_soal') ? <KategoriSoal /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'program_study': return hasAccess('program_study') ? <ProgramStudy /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'soal_gaya_belajar': return hasAccess('soal_gaya_belajar') ? <SoalGayaBelajar /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'soal_mbti': return hasAccess('soal_mbti') ? <SoalMbti /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'soal_papi_kostick': return hasAccess('soal_papi_kostick') ? <SoalPapiKostick /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'soal_rmib': return hasAccess('soal_rmib') ? <SoalRmib /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'soal_simulasi': return hasAccess('soal_simulasi') ? <SoalSimulasi /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'soal_intelegensi': 
        return hasAccess('soal_intelegensi') ? (
          <SoalIntelegensi 
            initialSubtest={activeSubtest} 
            onSubtestChange={(sub) => setActiveSubtest(sub)} 
          />
        ) : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'pengaturan': return hasAccess('pengaturan') ? <Pengaturan /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'pengaturan_aset': return hasAccess('pengaturan_aset') ? <PengaturanAset /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'pengaturan_durasi': return hasAccess('pengaturan_durasi') ? <PengaturanDurasi /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'legacy': return hasAccess('legacy') ? renderLegacyApp() : <div className="p-8 text-center text-red-500">Access Denied</div>;
      default: return <div className="p-8 text-center text-gray-500">{activeMenu} View - Work in Progress</div>;
    }
  };

  const renderLegacyApp = () => {
    return (
       <div className="flex flex-col h-[calc(100vh-10rem)] border border-gray-200 rounded-lg overflow-hidden relative">
          {/* Legacy App Wrapper */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 relative">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div>
                  <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">PsychIST Pro Legacy</h1>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                 <button onClick={() => setIsSettingsOpen(true)} className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs sm:text-sm font-medium transition cursor-pointer">
                   <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
                   <span className="hidden sm:inline">Pengaturan</span>
                 </button>
                 <button onClick={() => setParticipants(INITIAL_SAMPLE_PARTICIPANTS)} className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs sm:text-sm font-medium shadow-xs transition cursor-pointer">
                   <Sparkles className="w-3.5 h-3.5" />
                   <span>Data Demo</span>
                 </button>
              </div>
            </header>
            
            {/* Legacy Tabs */}
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex gap-2 overflow-x-auto">
               {['data', 'profiling', 'analytics', 'guide', 'python'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${activeTab === t ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                     {t}
                  </button>
               ))}
            </div>

            <div className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto pb-32">
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <FileUploadSection onDataLoaded={handleDataLoaded} onAppendData={handleAppendData} totalParticipants={participants.length} />
                  <ParticipantTable participants={participants} onSelectParticipant={setSelectedParticipantForReport} onDeleteParticipant={handleDeleteParticipant} onEditParticipant={handleEditParticipant} onAddNewParticipant={handleAddNewParticipant} onBatchExportPDF={handleOpenBatchExport} onExportExcel={handleExportExcel} onClearAll={handleClearAll} />
                </div>
              )}
              {activeTab === 'profiling' && <DataProfilingView participants={participants} />}
              {activeTab === 'analytics' && <AnalyticsView participants={participants} />}
              {activeTab === 'guide' && <NormGuideView />}
              {activeTab === 'python' && <PythonCodeViewer />}
            </div>
          </div>
          
          {/* Legacy Modals */}
          {selectedParticipantForReport && <ReportPreview participant={selectedParticipantForReport} participantsList={participants} settings={appSettings} onSelectParticipant={setSelectedParticipantForReport} onClose={() => setSelectedParticipantForReport(null)} />}
          {isSettingsOpen && <SettingsModal settings={appSettings} onSave={handleSaveSettings} onClose={() => setIsSettingsOpen(false)} />}
          {isParticipantFormOpen && <ParticipantFormModal initialData={editingParticipant} onSave={handleSaveParticipant} onClose={() => { setIsParticipantFormOpen(false); setEditingParticipant(null); }} />}
          {isBatchExportOpen && <BatchExportModal participants={batchExportTargets} settings={appSettings} onClose={() => setIsBatchExportOpen(false)} />}
       </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  if (!user && isRequireLogin) return <Login onLogin={() => setBypassAuth(true)} />;

  if (activeMenu === 'participant_portal' && activeEventId) {
    return (
      <>
        <OfflineIndicator />
        <ParticipantPortal eventId={activeEventId} />
      </>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <BackupPrompt />
      <AppLayout activeMenu={activeMenu} activeSubtest={activeSubtest} onNavigate={handleNavigate}>
        {renderContent()}
      </AppLayout>
    </>
  );
}
