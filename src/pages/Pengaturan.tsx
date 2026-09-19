import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Paintbrush, Save, Loader2, Upload, X, Database, Download, AlertTriangle, FileCode, Smartphone, Laptop, Check, Flame, Activity } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { FirebaseQuotaView } from '../components/FirebaseQuotaView';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { storage } from '../lib/firebase';

export function Pengaturan() {
  const [activeTab, setActiveTab] = useState('umum');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [appName, setAppName] = useState('LPP V.1');
  const [adminEmail, setAdminEmail] = useState('admin@lpp.com');
  const [adminName, setAdminName] = useState('Admin Demo');
  const [adminAvatarUrl, setAdminAvatarUrl] = useState('');
  const [adminAvatarInputType, setAdminAvatarInputType] = useState<'upload' | 'url'>('upload');
  const [adminAvatarUrlInput, setAdminAvatarUrlInput] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [appDescription, setAppDescription] = useState('Sistem Informasi Psikologi Perspective');
  const [footerText, setFooterText] = useState('© Psikologi Perspective is Proudly Owned by ZK-Themes');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoInputType, setLogoInputType] = useState<'upload' | 'url'>('upload');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [requireWebcam, setRequireWebcam] = useState(true);
  const [requireAntiCheat, setRequireAntiCheat] = useState(true);
  const [antiCapture, setAntiCapture] = useState(true);
  const [tabSwitchDetect, setTabSwitchDetect] = useState(true);
  const [randomizeChoices, setRandomizeChoices] = useState(true);
  const [requireAdminLogin, setRequireAdminLogin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('require_admin_login');
      if (stored !== null) return stored === 'true';
    }
    return false; // Default login dipostpone / dinonaktifkan
  });
  
  const [isRestoring, setIsRestoring] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isDownloadingSource, setIsDownloadingSource] = useState(false);
  const BACKUP_COLLECTIONS = ['events', 'participants', 'clients', 'administrators', 'faqs', 'soal_intelegensi', 'kategori_soal', 'app_settings'];

  
  const { data: settingsData, addData, updateData } = useFirestore('app_settings');
  

  const handleDownloadSourceCode = async () => {
    setIsDownloadingSource(true);
    try {
      window.location.href = '/api/export-source';
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsDownloadingSource(false);
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      const backupData: Record<string, any[]> = {};
      for (const colName of BACKUP_COLLECTIONS) {
        const querySnapshot = await getDocs(collection(db, colName));
        backupData[colName] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_db_ist_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      localStorage.setItem('lastBackupDate', new Date().toISOString());
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Gagal melakukan backup database.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm('PERINGATAN KRITIS: Melakukan restore akan menimpa/memperbarui data saat ini dengan data dari file backup. Apakah Anda sangat yakin ingin melanjutkan?')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          setIsRestoring(true);
          const backupData = JSON.parse(e.target?.result as string);
          
          let totalRestored = 0;
          for (const colName of Object.keys(backupData)) {
            const docs = backupData[colName];
            for (const docData of docs) {
              const id = docData.id;
              const data = { ...docData };
              delete data.id; // Remove id from payload
              
              await setDoc(doc(db, colName, id), data);
              totalRestored++;
            }
          }
          alert(`Berhasil me-restore ${totalRestored} dokumen dari backup.`);
        } catch(err) {
          console.error('Restore Error:', err);
          alert('Gagal me-restore database. Pastikan file backup valid.');
        } finally {
          setIsRestoring(false);
          if (e.target) (e.target as any).value = null; // reset input
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    if (settingsData && settingsData.length > 0) {
      const config = settingsData.find(d => d.id !== 'durasi_tes') || settingsData[0];
      if (config.appName) setAppName(config.appName);
      if (config.adminEmail) setAdminEmail(config.adminEmail);
      if (config.adminName) setAdminName(config.adminName);
      if (config.adminAvatarUrl) setAdminAvatarUrl(config.adminAvatarUrl);
      if (config.appDescription) setAppDescription(config.appDescription);
      if (config.footerText) setFooterText(config.footerText);
      if (config.logoUrl) setLogoUrl(config.logoUrl);
      if (config.requireWebcam !== undefined) setRequireWebcam(config.requireWebcam);
      if (config.requireAntiCheat !== undefined) setRequireAntiCheat(config.requireAntiCheat);
      if (config.antiCapture !== undefined) setAntiCapture(config.antiCapture);
      if (config.tabSwitchDetect !== undefined) setTabSwitchDetect(config.tabSwitchDetect);
      if (config.randomizeChoices !== undefined) setRandomizeChoices(config.randomizeChoices);
      if (config.requireAdminLogin !== undefined) {
        setRequireAdminLogin(config.requireAdminLogin);
        localStorage.setItem('require_admin_login', String(config.requireAdminLogin));
      }
    }
  }, [settingsData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileRef = ref(storage, `settings/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setLogoUrl(url);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Gagal mengupload logo');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const fileRef = ref(storage, `admin_avatars/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setAdminAvatarUrl(url);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Gagal mengunggah foto profil admin');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { 
        appName, 
        adminEmail, 
        adminName,
        adminAvatarUrl,
        appDescription, 
        footerText, 
        logoUrl, 
        requireWebcam, 
        requireAntiCheat, 
        antiCapture, 
        tabSwitchDetect,
        randomizeChoices,
        requireAdminLogin
      };
      localStorage.setItem('require_admin_login', String(requireAdminLogin));
      if (settingsData && settingsData.length > 0) {
        const configDoc = settingsData.find(d => d.id !== 'durasi_tes');
        if (configDoc) {
          await updateData(configDoc.id, payload);
      } else {
        await addData(payload);
      }
      
      // Tampilkan notifikasi berhasil
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 font-bold transition-all duration-300 animate-in fade-in slide-in-from-top-4';
      successMsg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> <span>Pengaturan berhasil disimpan!</span>';
      document.body.appendChild(successMsg);
      
      setTimeout(() => {
        successMsg.style.opacity = '0';
        successMsg.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if(document.body.contains(successMsg)) document.body.removeChild(successMsg);
        }, 300);
      }, 3000);
      } else {
        await addData(payload);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between mb-2">
         <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Nav Settings */}
        <div className="w-full md:w-64 bg-gray-50/50 border-r border-gray-100 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('umum')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'umum' ? 'bg-[#8BC34A]/10 text-[#8BC34A]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <User className="w-4 h-4" /> <span>Profil & Umum</span>
          </button>
          <button 
            onClick={() => setActiveTab('keamanan')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'keamanan' ? 'bg-[#8BC34A]/10 text-[#8BC34A]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Shield className="w-4 h-4" /> <span>Keamanan</span>
          </button>
          <button 
            onClick={() => setActiveTab('notifikasi')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifikasi' ? 'bg-[#8BC34A]/10 text-[#8BC34A]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Bell className="w-4 h-4" /> <span>Notifikasi</span>
          </button>
                    <button 
            onClick={() => setActiveTab('tampilan')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tampilan' ? 'bg-[#8BC34A]/10 text-[#8BC34A]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Paintbrush className="w-4 h-4" /> <span>Tampilan</span>
          </button>
                    <button 
            onClick={() => setActiveTab('database')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'database' ? 'bg-[#8BC34A]/10 text-[#8BC34A]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Database className="w-4 h-4" /> <span>Database</span>
          </button>
          <button 
            onClick={() => setActiveTab('kuota')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'kuota' ? 'bg-[#8BC34A]/10 text-[#8BC34A]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Flame className="w-4 h-4 text-amber-500" /> <span>Kuota Firebase</span>
          </button>
          <button 
            onClick={() => setActiveTab('pwa')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pwa' ? 'bg-[#8BC34A]/10 text-[#8BC34A]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Laptop className="w-4 h-4" /> <span>Aplikasi Desktop / PC</span>
          </button>
        </div>

        {/* Content Settings */}
        <div className="flex-1 p-6 sm:p-8">
          {activeTab === 'umum' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Informasi Aplikasi</h2>
                <p className="text-sm text-gray-500 mb-6">Atur nama dan informasi dasar sistem LPP.</p>
                
                <div className="space-y-4">
                  {/* Profil Admin Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-emerald-50/30 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">Profil Administrator (Header Bar)</h3>
                        <p className="text-xs text-gray-500">Mengatur foto avatar dan nama yang muncul pada pill "Welcome : ..." di bilah atas.</p>
                      </div>
                      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-xs">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-500 shrink-0">
                          <img 
                            src={adminAvatarUrl || 'https://i.pravatar.cc/100?img=11'} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Welcome : {adminName || 'Admin Demo'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Tampilan Admin</label>
                        <input 
                          type="text" 
                          value={adminName} 
                          onChange={(e) => setAdminName(e.target.value)} 
                          placeholder="Contoh: Admin Demo / Joni Waluyo"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#8BC34A]" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Foto Profil Admin</label>
                        <div className="flex border-b border-gray-200 mb-2">
                          <button
                            type="button"
                            onClick={() => setAdminAvatarInputType('upload')}
                            className={`px-3 py-1 text-xs font-medium border-b-2 transition-colors ${adminAvatarInputType === 'upload' ? 'border-[#8BC34A] text-[#8BC34A]' : 'border-transparent text-gray-500'}`}
                          >
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminAvatarInputType('url')}
                            className={`px-3 py-1 text-xs font-medium border-b-2 transition-colors ${adminAvatarInputType === 'url' ? 'border-[#8BC34A] text-[#8BC34A]' : 'border-transparent text-gray-500'}`}
                          >
                            Input URL
                          </button>
                        </div>

                        {adminAvatarInputType === 'upload' ? (
                          <div className="flex items-center space-x-2">
                            <label className={`inline-flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium bg-white text-gray-700 hover:bg-gray-50 cursor-pointer ${isUploadingAvatar ? 'opacity-60' : ''}`}>
                              {isUploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              <span>{isUploadingAvatar ? 'Mengunggah...' : 'Upload Foto Baru'}</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                            </label>
                            {adminAvatarUrl && (
                              <button 
                                type="button" 
                                onClick={() => setAdminAvatarUrl('')} 
                                className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                              >
                                Reset Default
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <input 
                              type="url" 
                              value={adminAvatarUrlInput} 
                              onChange={(e) => setAdminAvatarUrlInput(e.target.value)}
                              placeholder="https://..." 
                              className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-500"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                if (adminAvatarUrlInput) {
                                  setAdminAvatarUrl(adminAvatarUrlInput);
                                  setAdminAvatarUrlInput('');
                                }
                              }}
                              className="px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100"
                            >
                              Terapkan
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo Aplikasi</label>
                    
                    <div className="flex border-b border-gray-200 mb-3">
                      <button
                        type="button"
                        onClick={() => setLogoInputType('upload')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${logoInputType === 'upload' ? 'border-[#8BC34A] text-[#8BC34A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoInputType('url')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${logoInputType === 'url' ? 'border-[#8BC34A] text-[#8BC34A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      >
                        Input URL
                      </button>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-2xl text-gray-400 font-bold">Ψ</span>
                        )}
                      </div>
                      <div className="flex-1">
                        {logoInputType === 'upload' ? (
                          <div>
                            <label className={`inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${isUploading ? 'bg-gray-50 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}`}>
                              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                              <span>{isUploading ? 'Mengunggah...' : 'Upload Logo Baru'}</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                            </label>
                            {logoUrl && (
                              <button onClick={() => setLogoUrl('')} className="ml-3 text-sm text-red-500 hover:text-red-700">Hapus</button>
                            )}
                            <p className="mt-1.5 text-xs text-gray-500">Rekomendasi: PNG transparan, ukuran maks 1MB.</p>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <input 
                              type="url" 
                              value={logoUrlInput} 
                              onChange={(e) => setLogoUrlInput(e.target.value)}
                              placeholder="https://example.com/logo.png" 
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                if (logoUrlInput) {
                                  setLogoUrl(logoUrlInput);
                                  setLogoUrlInput('');
                                }
                              }}
                              className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                            >
                              Terapkan
                            </button>
                            {logoUrl && (
                              <button type="button" onClick={() => setLogoUrl('')} className="px-3 py-2 text-sm text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg">Hapus</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Aplikasi</label>
                    <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#8BC34A]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Administrator</label>
                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#8BC34A]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi / Slogan</label>
                    <textarea rows={3} value={appDescription} onChange={(e) => setAppDescription(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#8BC34A]"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Teks Copyright / Footer</label>
                    <input 
                      type="text" 
                      value={footerText} 
                      onChange={(e) => setFooterText(e.target.value)} 
                      placeholder="Contoh: © Psikologi Perspective is Proudly Owned by ZK-Themes"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#8BC34A]" 
                    />
                    <p className="mt-1 text-xs text-gray-500">Teks ini akan muncul di bagian bawah (footer) seluruh halaman aplikasi.</p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 my-8" />

              <div className="flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-[#8BC34A] hover:bg-[#7cb342] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'keamanan' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Ganti Password</h2>
                <p className="text-sm text-gray-500 mb-6">Pastikan akun administrator Anda tetap aman.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Lama</label>
                    <input type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#8BC34A]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
                    <input type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#8BC34A]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
                    <input type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#8BC34A]" />
                  </div>
                </div>
              </div>


              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Verifikasi Peserta (Anti-Kecurangan)</h2>
                <p className="text-sm text-gray-500 mb-4">Atur apakah peserta diwajibkan untuk melakukan selfie (foto wajah realtime) sebelum tes dan saat registrasi.</p>
                
                <div className="space-y-4">
                  <label className="flex items-center cursor-pointer p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={requireWebcam} onChange={(e) => setRequireWebcam(e.target.checked)} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${requireWebcam ? 'bg-[#8BC34A]' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${requireWebcam ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-800 text-sm">Wajib Selfie (Webcam)</div>
                      <div className="text-xs text-gray-500">{requireWebcam ? 'Aktif. Peserta wajib foto wajah langsung.' : 'Nonaktif. Peserta bisa mendaftar & tes tanpa kamera.'}</div>
                    </div>
                  </label>

                  <label className="flex items-center cursor-pointer p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={antiCapture} onChange={(e) => setAntiCapture(e.target.checked)} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${antiCapture ? 'bg-[#8BC34A]' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${antiCapture ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-800 text-sm">Anti Capture / Print Screen</div>
                      <div className="text-xs text-gray-500">{antiCapture ? 'Aktif. Sistem mencegah tangkapan layar/shortcut keyboard saat tes.' : 'Nonaktif. Tangkapan layar diperbolehkan.'}</div>
                    </div>
                  </label>

                  <label className="flex items-center cursor-pointer p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={tabSwitchDetect} onChange={(e) => setTabSwitchDetect(e.target.checked)} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${tabSwitchDetect ? 'bg-[#8BC34A]' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${tabSwitchDetect ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-800 text-sm">Notifikasi Pindah Tab</div>
                      <div className="text-xs text-gray-500">{tabSwitchDetect ? 'Aktif. Peringatan akan muncul jika peserta berpindah tab/layar.' : 'Nonaktif. Peserta bebas berpindah tab/layar.'}</div>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={randomizeChoices} onChange={(e) => setRandomizeChoices(e.target.checked)} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${randomizeChoices ? 'bg-[#8BC34A]' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${randomizeChoices ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-800 text-sm">Acak Pilihan Jawaban</div>
                      <div className="text-xs text-gray-500">{randomizeChoices ? 'Aktif. Urutan pilihan jawaban (A, B, C, dst.) akan diacak untuk tiap peserta.' : 'Nonaktif. Urutan pilihan jawaban sesuai urutan aslinya.'}</div>
                    </div>
                  </label>

                  <label className="flex items-center cursor-pointer p-4 border border-blue-200/80 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={requireAdminLogin} 
                        onChange={(e) => {
                          setRequireAdminLogin(e.target.checked);
                          localStorage.setItem('require_admin_login', String(e.target.checked));
                        }} 
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${requireAdminLogin ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${requireAdminLogin ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                        <span>Wajib Login Administrator</span>
                        {!requireAdminLogin && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Bypass Aktif (Tanpa Login)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {requireAdminLogin 
                          ? 'Aktif. Akses dasbor wajib menggunakan akun email/sandi atau Google SSO.' 
                          : 'Nonaktif (Dipostpone). Langsung masuk ke dasbor tanpa perlu verifikasi login atau memasukkan kode OTP dari HP.'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-[#1C1C1C] hover:bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Keamanan'}</span>
                </button>
              </div>
            </div>
          )}

          
          {activeTab === 'database' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Manajemen Database</h2>
                <p className="text-sm text-gray-500 mb-6">Cadangkan data secara rutin dan pulihkan data dari file backup jika diperlukan.</p>
                
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-amber-950 mb-1 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                      Status & Kuota Firebase Firestore
                    </h3>
                    <p className="text-xs text-amber-800 leading-relaxed max-w-lg">
                      Pantau batas operasi harian (50.000 Reads, 20.000 Writes, 1 GiB Storage) dan cek jumlah dokumen aktif secara real-time.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('kuota')}
                    className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    Lihat Kuota Firebase →
                  </button>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 mb-6">
                  <h3 className="font-semibold text-emerald-900 mb-2 flex items-center">
                    <FileCode className="w-4 h-4 mr-2" />
                    Unduh Kode Sumber (Aplikasi)
                  </h3>
                  <p className="text-sm text-emerald-700 mb-4 leading-relaxed">
                    Unduh seluruh source code aplikasi sistem Anda saat ini (React, Vite, Node) dalam format .zip. Berguna jika Anda ingin mencadangkan bentuk aplikasi seutuhnya dan kode programnya.
                  </p>
                  <button 
                    onClick={handleDownloadSourceCode}
                    disabled={isDownloadingSource}
                    className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70 cursor-pointer"
                  >
                    {isDownloadingSource ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    <span>{isDownloadingSource ? 'Menyiapkan ZIP...' : 'Unduh Source Code (.zip)'}</span>
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Unduh Database (Backup)
                  </h3>
                  <p className="text-sm text-blue-700 mb-4 leading-relaxed">
                    Unduh semua dokumen krusial dari database Anda ke dalam satu file .json. Sangat disarankan untuk melakukan backup secara rutin untuk menghindari kehilangan data.
                  </p>
                  <button 
                    onClick={handleBackupNow}
                    disabled={isBackingUp}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70"
                  >
                    {isBackingUp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    {isBackingUp ? 'Memproses...' : 'Unduh Backup Sekarang'}
                  </button>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Pulihkan Database (Restore)
                  </h3>
                  <p className="text-sm text-red-700 mb-4 leading-relaxed">
                    <strong>Peringatan!</strong> Mengunggah file backup akan menimpa dan memodifikasi data yang ada di database Anda saat ini dengan data dari file backup. Lakukan dengan hati-hati.
                  </p>
                  <label className="inline-flex items-center px-4 py-2 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-70">
                    {isRestoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {isRestoring ? 'Memulihkan...' : 'Pilih File Backup (.json)'}
                    <input type="file" accept=".json" className="hidden" onChange={handleRestore} disabled={isRestoring} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kuota' && (
            <FirebaseQuotaView />
          )}

          {activeTab === 'tampilan' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Pengaturan Tampilan & Footer</h2>
                <p className="text-sm text-gray-500 mb-6">Atur teks footer copyright dan estetika tampilan sistem.</p>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Teks Copyright / Footer Bawah</label>
                    <input 
                      type="text" 
                      value={footerText} 
                      onChange={(e) => setFooterText(e.target.value)} 
                      placeholder="Contoh: © Psikologi Perspective is Proudly Owned by ZK-Themes"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#8BC34A]" 
                    />
                    <p className="mt-1 text-xs text-gray-500">Teks ini akan tampil di bagian footer paling bawah aplikasi admin & pengawas.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pratinjau (Preview) Footer</label>
                    <div className="bg-[#1C1C1C] text-white py-3 px-6 text-center text-sm font-medium rounded-lg border-t-4 border-[#111111]">
                      {footerText || '© Psikologi Perspective is Proudly Owned by ZK-Themes'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-[#8BC34A] hover:bg-[#7cb342] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Tampilan'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aplikasi Desktop & PC Mandiri</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Jalankan platform Perspective sebagai program komputer (Windows / macOS) atau aplikasi smartphone tanpa bilah navigasi browser.</p>
                
                <div className="bg-gradient-to-br from-emerald-50/70 via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800/80 border border-emerald-200/80 dark:border-gray-700 rounded-2xl p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Laptop className="w-5 h-5 text-[#8BC34A]" />
                        <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Pasang ke Laptop atau Komputer</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
                        Nikmati pengalaman aplikasi desktop dengan ikon pintasan di Desktop & Start Menu, tampilan layar penuh bebas distraksi, dan stabilitas pengerjaan tes.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <PWAInstallButton />
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-200/70 dark:border-gray-700/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-full bg-[#8BC34A]/20 text-[#8BC34A] mt-0.5 shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Jendela Mandiri (Tanpa Tab/URL Bar)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-full bg-[#8BC34A]/20 text-[#8BC34A] mt-0.5 shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Pintasan di Desktop & Taskbar</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-full bg-[#8BC34A]/20 text-[#8BC34A] mt-0.5 shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Mendukung Windows, Mac & HP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifikasi' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 py-20">
               <Bell className="w-12 h-12 opacity-20" />
               <p className="text-sm">Pengaturan notifikasi akan segera hadir.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
