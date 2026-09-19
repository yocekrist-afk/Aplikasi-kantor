import React, { useState, useEffect } from 'react';
import { 
  Menu, X, LayoutDashboard, UserCog, Users, CalendarDays, 
  MessageCircleQuestion, FolderKanban, FileQuestion, PenTool,
  Shapes, Building2, LayoutList, GraduationCap, ChevronDown, ChevronRight, LogOut, Settings as SettingsIcon, Clock, Image as ImageIcon,
  Calculator, Zap
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useFirestore } from '../../hooks/useFirestore';
import { getConfirmState } from '../../utils/confirmAction';
import { Modal } from './Modal';
import { ThemeToggle } from '../ThemeToggle';

interface AppLayoutProps {
  children: React.ReactNode;
  activeMenu: string;
  activeSubtest?: string;
  onNavigate: (menu: string, subtest?: string) => void;
}


export function AppLayout({ children, activeMenu, activeSubtest, onNavigate }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMasterOpen, setIsMasterOpen] = useState(true);
  const [isSoalOpen, setIsSoalOpen] = useState(true);
  const [isIntelegensiOpen, setIsIntelegensiOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Custom Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  useEffect(() => {
    const handleShowConfirm = () => {
      const state = getConfirmState();
      setConfirmMessage(state.message);
      setConfirmOpen(true);
    };
    window.addEventListener('show-confirm-modal', handleShowConfirm);
    return () => window.removeEventListener('show-confirm-modal', handleShowConfirm);
  }, []);

  const handleConfirmResult = (result: boolean) => {
    setConfirmOpen(false);
    getConfirmState().resolve(result);
  };
  
  const { data: settingsData } = useFirestore('app_settings');
  const { data: adminsData } = useFirestore('administrators');
  
  const effectiveEmail = auth.currentUser?.email || (typeof window !== 'undefined' && localStorage.getItem('require_admin_login') === 'true' ? '' : 'joniwaluyo48@gmail.com');
  const currentAdmin = adminsData?.find(a => a.username?.toLowerCase() === effectiveEmail.toLowerCase());
  const isOwner = effectiveEmail.toLowerCase() === 'joniwaluyo48@gmail.com'.toLowerCase();
  
  const ALL_PERMS = ['dashboard', 'event', 'peserta', 'tabulasi_penilaian', 'faq', 'instruksi', 'simbol', 'client', 'kategori_soal', 'program_study', 'soal_gaya_belajar', 'soal_mbti', 'soal_papi_kostick', 'soal_rmib', 'soal_intelegensi', 'soal_simulasi', 'administrator', 'pengaturan', 'pengaturan_aset', 'pengaturan_durasi', 'uji_beban', 'legacy'];
  const BASIC_PERMS = ['dashboard', 'event', 'peserta', 'tabulasi_penilaian', 'faq'];
  
  const userPerms = isOwner ? ALL_PERMS : (currentAdmin?.permissions || (currentAdmin?.role === 'super_admin' ? ALL_PERMS : BASIC_PERMS));
  const hasAccess = (menuId: string) => userPerms.includes(menuId);
  
  const appSettings = settingsData?.find(d => d.id !== 'durasi_tes') || settingsData?.[0] || {};
  const displayAppName = appSettings.appName || 'LPP V.1';
  const displayAdminName = appSettings.adminName || 'Admin Demo';
  const displayAdminAvatar = appSettings.adminAvatarUrl || 'https://i.pravatar.cc/100?img=11';
  // Split app name and version if it matches the pattern "Name V.X"
  const nameParts = displayAppName.split(' ');
  let mainName = displayAppName;
  let subName = '';
  if (nameParts.length > 1 && nameParts[nameParts.length - 1].toLowerCase().startsWith('v.')) {
    subName = nameParts.pop() || '';
    mainName = nameParts.join(' ');
  }

  const handleNav = (id: string, subtest?: string) => {
    onNavigate(id, subtest);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      localStorage.setItem('require_admin_login', 'true');
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = [
    ...(hasAccess('dashboard') ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    ...(hasAccess('administrator') ? [{ id: 'administrator', label: 'Administrator', icon: UserCog }] : []),
    ...(hasAccess('peserta') ? [{ id: 'peserta', label: 'Peserta', icon: Users }] : []),
    ...(hasAccess('tabulasi_penilaian') ? [{ id: 'tabulasi_penilaian', label: 'Tabulasi Penilaian', icon: Calculator }] : []),
    ...(hasAccess('event') ? [{ id: 'event', label: 'Event', icon: CalendarDays }] : []),
    ...(hasAccess('uji_beban') ? [{ id: 'uji_beban', label: 'Uji Beban (CBT)', icon: Zap }] : []),
    ...(hasAccess('faq') ? [{ id: 'faq', label: 'Faq', icon: MessageCircleQuestion }] : []),
    ...(hasAccess('pengaturan') ? [{ id: 'pengaturan', label: 'Pengaturan', icon: SettingsIcon }] : []),
    ...(hasAccess('pengaturan_aset') ? [{ id: 'pengaturan_aset', label: 'Pengaturan Aset', icon: ImageIcon }] : []),
  ];

  const masterItems = [
    ...(hasAccess('instruksi') ? [{ id: 'instruksi', label: 'Instruksi', icon: PenTool }] : []),
    ...(hasAccess('simbol') ? [{ id: 'simbol', label: 'Simbol', icon: Shapes }] : []),
    ...(hasAccess('client') ? [{ id: 'client', label: 'Client', icon: Building2 }] : []),
    ...(hasAccess('kategori_soal') ? [{ id: 'kategori_soal', label: 'Kategori Soal', icon: LayoutList }] : []),
    ...(hasAccess('program_study') ? [{ id: 'program_study', label: 'Program Study', icon: GraduationCap }] : []),
    ...(hasAccess('pengaturan_durasi') ? [{ id: 'pengaturan_durasi', label: 'Pengaturan Durasi', icon: Clock }] : []),
  ];

  const hasAnyMaster = masterItems.length > 0 || hasAccess('soal_gaya_belajar') || hasAccess('soal_mbti') || hasAccess('soal_papi_kostick') || hasAccess('soal_rmib') || hasAccess('soal_intelegensi') || hasAccess('soal_simulasi') || hasAccess('legacy');
  const hasAnySoal = hasAccess('soal_gaya_belajar') || hasAccess('soal_mbti') || hasAccess('soal_papi_kostick') || hasAccess('soal_rmib') || hasAccess('soal_intelegensi') || hasAccess('soal_simulasi');

  const soalItems = [
    { id: 'soal_gaya_belajar', label: 'Gaya Belajar' },
    { id: 'soal_mbti', label: 'MBTI' },
    { id: 'soal_papi_kostick', label: 'Papi Kostick' },
    { id: 'soal_rmib', label: 'RMIB' },
    { id: 'soal_intelegensi', label: 'Intelegensi' },
    { id: 'soal_simulasi', label: 'Soal Simulasi' },
  ];

  const intelegensiSubtests = [
    { id: '1', label: 'Subtest 1' },
    { id: '2', label: 'Subtest 2' },
    { id: '3', label: 'Subtest 3' },
    { id: '4', label: 'Subtest 4' },
    { id: '5', label: 'Subtest 5' },
    { id: '6', label: 'Subtest 6' },
    { id: '7', label: 'Subtest 7' },
    { id: '8', label: 'Subtest 8' },
    { id: '9', label: 'Subtest 9' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-gray-900 flex font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] dark:bg-gray-950 text-white transform transition-transform duration-300 
        ${isSidebarVisible ? 'md:sticky md:top-0 md:h-screen' : 'md:hidden'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            {appSettings.logoUrl ? (
              <img src={appSettings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center border border-indigo-700/50">
                 <span className="text-indigo-400 font-bold text-sm">Ψ</span>
              </div>
            )}
            <div className="flex items-baseline space-x-1 truncate max-w-[150px]">
              <span className="text-xl font-bold tracking-wide truncate">{mainName}</span>
              {subName && <span className="text-[10px] text-gray-400">{subName}</span>}
            </div>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <div className="h-[calc(100vh-4rem)] overflow-y-auto py-4">
          <div className="px-4 mb-2">
            <span className="text-xs font-semibold text-[#8BC34A] tracking-wider">— MENU</span>
          </div>
          
          <ul className="space-y-1 px-2">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${activeMenu === item.id ? 'bg-[#8BC34A]/10 text-[#8BC34A]' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {hasAnyMaster && (
            <>
              <div className="px-4 mt-6 mb-2">
                <span className="text-xs font-semibold text-[#8BC34A] tracking-wider">— MASTER</span>
              </div>

              <ul className="space-y-1 px-2">
                {hasAnySoal && (
                <li>
                  <button
                    onClick={() => setIsSoalOpen(!isSoalOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <FileQuestion className="w-4 h-4 text-[#8BC34A]" />
                      <span className="text-sm font-medium text-[#8BC34A]">Soal</span>
                    </div>
                    {isSoalOpen ? <ChevronDown className="w-4 h-4 text-[#8BC34A]" /> : <ChevronRight className="w-4 h-4 text-[#8BC34A]" />}
                  </button>
                  
                  {isSoalOpen && (
                    <ul className="mt-1 space-y-1 pl-8 pr-2 pb-2">
                      {/* Gaya Belajar */}
                      {hasAccess('soal_gaya_belajar') && (
                      <li>
                        <button
                          onClick={() => handleNav('soal_gaya_belajar')}
                          className={`w-full flex items-center space-x-2.5 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                            activeMenu === 'soal_gaya_belajar' ? 'text-white font-medium bg-gray-800/50' : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-[#8BC34A] shrink-0"></div>
                          <span className="leading-tight">Gaya Belajar</span>
                        </button>
                      </li>
                      )}

                      {/* MBTI */}
                      {hasAccess('soal_mbti') && (
                      <li>
                        <button
                          onClick={() => handleNav('soal_mbti')}
                          className={`w-full flex items-center space-x-2.5 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                            activeMenu === 'soal_mbti' ? 'text-white font-medium bg-gray-800/50' : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-[#8BC34A] shrink-0"></div>
                          <span className="leading-tight">MBTI</span>
                        </button>
                      </li>
                      )}

                      {/* Papi Kostick */}
                      {hasAccess('soal_papi_kostick') && (
                      <li>
                        <button
                          onClick={() => handleNav('soal_papi_kostick')}
                          className={`w-full flex items-center space-x-2.5 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                            activeMenu === 'soal_papi_kostick' ? 'text-white font-medium bg-gray-800/50' : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-[#8BC34A] shrink-0"></div>
                          <span className="leading-tight">Papi Kostick</span>
                        </button>
                      </li>
                      )}

                      {/* RMIB */}
                      {hasAccess('soal_rmib') && (
                      <li>
                        <button
                          onClick={() => handleNav('soal_rmib')}
                          className={`w-full flex items-center space-x-2.5 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                            activeMenu === 'soal_rmib' ? 'text-white font-medium bg-gray-800/50' : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-[#8BC34A] shrink-0"></div>
                          <span className="leading-tight">RMIB</span>
                        </button>
                      </li>
                      )}

                      {/* Intelegensi (with Expandable Subtests) */}
                      {hasAccess('soal_intelegensi') && (
                      <li>
                        <div className="flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-gray-800/40 group">
                          <button
                            onClick={() => handleNav('soal_intelegensi', 'all')}
                            className={`flex items-center space-x-2.5 flex-1 text-left ${
                              activeMenu === 'soal_intelegensi' ? 'text-white font-semibold' : 'text-gray-200 hover:text-white'
                            }`}
                          >
                            <div className="w-2 h-2 rounded-full bg-white shrink-0"></div>
                            <span className="leading-tight">Intelegensi</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsIntelegensiOpen(!isIntelegensiOpen);
                            }}
                            className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                            title={isIntelegensiOpen ? "Tutup Subtest" : "Buka Subtest"}
                          >
                            {isIntelegensiOpen ? (
                              <ChevronDown className="w-4 h-4 text-white" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>

                        {/* Subtests 1 - 9 */}
                        {isIntelegensiOpen && (
                          <ul className="mt-1 space-y-1 pl-6">
                            {intelegensiSubtests.map((sub) => {
                              const isSubActive = activeMenu === 'soal_intelegensi' && activeSubtest === sub.id;
                              return (
                                <li key={sub.id}>
                                  <button
                                    onClick={() => handleNav('soal_intelegensi', sub.id)}
                                    className={`w-full flex items-center space-x-2.5 px-2 py-1 rounded-md text-sm transition-colors text-left ${
                                      isSubActive
                                        ? 'text-[#8BC34A] font-semibold bg-[#8BC34A]/10'
                                        : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                                    }`}
                                  >
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        isSubActive ? 'bg-[#8BC34A]' : 'bg-gray-400'
                                      }`}
                                    ></div>
                                    <span className="leading-tight">{sub.label}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                      )}

                      {/* Soal Simulasi */}
                      {hasAccess('soal_simulasi') && (
                      <li>
                        <button
                          onClick={() => handleNav('soal_simulasi')}
                          className={`w-full flex items-center space-x-2.5 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                            activeMenu === 'soal_simulasi' ? 'text-white font-medium bg-gray-800/50' : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8BC34A]/50 shrink-0"></div>
                          <span className="leading-tight">Soal Simulasi</span>
                        </button>
                      </li>
                      )}

                      <li className="pt-2 mt-2 border-t border-gray-800/50">
                        <button
                          onClick={() => alert('Fitur Tambah Alat Tes akan segera hadir')}
                          className="w-full flex items-center justify-center space-x-2 px-2 py-1.5 rounded-md text-sm text-[#8BC34A] border border-[#8BC34A]/30 hover:bg-[#8BC34A]/10 transition-colors border-dashed"
                        >
                          <span className="text-lg leading-none">+</span>
                          <span className="font-medium">Tambah Alat Tes</span>
                        </button>
                      </li>
                    </ul>
                  )}
                </li>
                )}

                {masterItems.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${activeMenu === item.id ? 'bg-[#8BC34A]/10 text-[#8BC34A]' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  </li>
                ))}
                
                {hasAccess('legacy') && (
                <li className="pt-4 border-t border-gray-800 mt-4">
                   <button
                      onClick={() => handleNav('legacy')}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-blue-400 hover:bg-gray-800`}
                    >
                      <FolderKanban className="w-4 h-4" />
                      <span className="text-sm font-medium">Legacy IST App</span>
                    </button>
                </li>
                )}
              </ul>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sticky top-0 z-30 transition-colors duration-300">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden mr-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              className="hidden md:flex mr-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleNav('pengaturan')}
              title="Klik untuk mengubah foto profil & nama admin di menu Pengaturan"
              className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-600 transition-colors text-left group cursor-pointer"
            >
               <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-white dark:border-gray-800 shadow-xs">
                  <img 
                    src={displayAdminAvatar} 
                    alt="Admin" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
               </div>
               <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-[#8BC34A] transition-colors">
                 Welcome : {displayAdminName}
               </span>
               <div className="hidden sm:block h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
               <span className="hidden sm:block text-sm font-bold text-[#8BC34A] tracking-wider">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button onClick={handleLogout} className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
              <span>Logout</span>
              <LogOut className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {/* Breadcrumbs */}
          <div className="flex justify-end items-center mb-6 text-sm">
            <div className="flex items-center space-x-2 text-gray-500">
              <LayoutDashboard className="w-4 h-4 text-[#8BC34A]" />
              
              {(() => {
                let paths: { label: string, isLast: boolean }[] = [];
                
                if (activeMenu === 'dashboard') {
                  paths = [
                    { label: 'Menu', isLast: false },
                    { label: 'Dashboard', isLast: true }
                  ];
                } else {
                  const inNav = navItems.find(i => i.id === activeMenu);
                  if (inNav) {
                    paths = [
                      { label: 'Menu', isLast: false },
                      { label: inNav.label, isLast: true }
                    ];
                  } else {
                    const inMaster = masterItems.find(i => i.id === activeMenu);
                    if (inMaster) {
                      paths = [
                        { label: 'Master', isLast: false },
                        { label: inMaster.label, isLast: true }
                      ];
                    } else {
                      const inSoal = soalItems.find(i => i.id === activeMenu);
                      if (inSoal) {
                        paths = [
                          { label: 'Master', isLast: false },
                          { label: 'Soal', isLast: false },
                          { label: inSoal.label, isLast: true }
                        ];
                      } else {
                        paths = [
                          { label: 'Menu', isLast: false },
                          { label: activeMenu.replace(/_/g, ' '), isLast: true }
                        ];
                      }
                    }
                  }
                }

                return paths.map((path, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-gray-400">•</span>}
                    <span className={path.isLast ? "text-gray-700 font-medium capitalize" : ""}>
                      {path.label}
                    </span>
                  </React.Fragment>
                ));
              })()}
            </div>
          </div>
          
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-[#1C1C1C] text-white py-3 px-6 text-center text-sm font-medium border-t-4 border-[#111111]">
          {appSettings.footerText ? (
            <span>{appSettings.footerText}</span>
          ) : (
            <>© Psikologi Perspective is Proudly Owned by <span className="text-[#8BC34A]">ZK-Themes</span></>
          )}
        </footer>
      </div>

      <Modal isOpen={confirmOpen} onClose={() => handleConfirmResult(false)} title="Konfirmasi" maxWidth="max-w-md">
        <div className="p-2">
          <p className="text-gray-700 mb-6">{confirmMessage}</p>
          <div className="flex justify-end space-x-3">
            <button 
              onClick={() => handleConfirmResult(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={() => handleConfirmResult(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
