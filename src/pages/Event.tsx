import { confirmAction } from '../utils/confirmAction';
import React, { useState } from 'react';
import { Copy, Edit2, Trash2, Calendar, ChevronDown, Download, Users, Radio, CheckCircle, XCircle, Clock, RefreshCw, FileSpreadsheet, Check, Zap, Loader2 } from 'lucide-react';
import { Modal } from '../components/layout/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { handleDownloadEventReport, getParticipantsForEvent } from '../utils/eventReportExport';

interface EventProps {
  onNavigateToLoadTest?: () => void;
}

export function Event({ onNavigateToLoadTest }: EventProps = {}) {
  const { data: events, addData, updateData, deleteData } = useFirestore('events');
  const { data: clients } = useFirestore('clients');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTime, setIsSavingTime] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedEventForTime, setSelectedEventForTime] = useState<any>(null);
  const [formData, setFormData] = useState({ id: '', title: '', date: '', startTime: '', endTime: '', status: 'Active', clientId: '', kategoriSoal: [] as string[], slug: '' });
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedEventForDownload, setSelectedEventForDownload] = useState<any>(null);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);
  const [selectedEventForRadar, setSelectedEventForRadar] = useState<any>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'down' | 'up'>('down');

  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const activeEvents = events.filter((e: any) => !e.isDeleted);
  const trashedEvents = events.filter((e: any) => e.isDeleted);

  const { data: participants } = useFirestore('participants');

  const kategoriOptions = [
    'Intelegensi',
    'Gaya Belajar',
    'MBTI',
    'Papi Kostick',
    'RMIB',
    'Sikap Kerja (KRAEPELIN)',
    'Kecerdasan Majemuk'
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const generateSlug = (title: string) => {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      };
      
      const payloadSlug = formData.slug.trim() ? formData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : generateSlug(formData.title);

      const payload = {
        title: formData.title,
        slug: payloadSlug,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: formData.status,
        clientId: formData.clientId,
        kategoriSoal: formData.kategoriSoal
      };
      
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');

      if (!formData.id) {
        await addData(payload);
        try {
          await addDoc(collection(db, 'activity_logs'), {
            type: 'admin',
            message: `Admin membuat event baru: ${formData.title}`,
            timestamp: new Date().toISOString(),
            createdAt: serverTimestamp()
          });
        } catch(e) {}
      } else {
        await updateData(formData.id, payload);
        try {
          await addDoc(collection(db, 'activity_logs'), {
            type: 'admin',
            message: `Admin memperbarui event: ${formData.title}`,
            timestamp: new Date().toISOString(),
            createdAt: serverTimestamp()
          });
        } catch(e) {}
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (await confirmAction(`Pindahkan event ${title} ke tempat sampah?`)) {
      try {
        await updateData(id, { isDeleted: true, deletedAt: new Date().toISOString() });
      } catch (error) {
        console.error(error);
        alert('Gagal menghapus event');
      }
    }
  };

  const handleRestore = async (id: string, title: string) => {
    if (await confirmAction(`Kembalikan event ${title}?`)) {
      try {
        await updateData(id, { isDeleted: false, deletedAt: null });
      } catch (error) {
        console.error(error);
        alert('Gagal mengembalikan event');
      }
    }
  };

  const handlePermanentDelete = async (id: string, title: string) => {
    if (await confirmAction(`PERINGATAN: Hapus permanen event ${title}? Semua data peserta, jadwal, dan lainnya yang berkaitan dengan event ini bisa kehilangan referensinya. Tindakan ini tidak bisa dibatalkan.`)) {
      try {
        await deleteData(id);
      } catch (error) {
        console.error(error);
        alert('Gagal menghapus event secara permanen');
      }
    }
  };

  const handleToggleStatus = async (event: any) => {
    try {
      await updateData(event.id, { status: event.status === 'Active' ? 'Inactive' : 'Active' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyUrl = async (eventId: string, slug?: string) => {
    // Memastikan link yang dicopy adalah link Publik (Shared App URL) bukan link Dev
    const baseUrl = window.location.origin.replace('ais-dev-', 'ais-pre-');
    const pathId = slug || eventId;
    const url = `${baseUrl}/p/${pathId}`;
    
    navigator.clipboard.writeText(url).then(() => {
      alert(`URL berhasil disalin:\n${url}`);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Gagal menyalin URL');
    });
  };

  const handleToggleKategori = async (kategori: string) => {
    setFormData(prev => ({
      ...prev,
      kategoriSoal: prev.kategoriSoal.includes(kategori)
        ? prev.kategoriSoal.filter(k => k !== kategori)
        : [...prev.kategoriSoal, kategori]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Sort by Date:</span>
          <input type="date" className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
          
          <div className="flex border border-gray-300 rounded-md overflow-hidden ml-4">
            <button 
              onClick={() => setViewMode('active')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${viewMode === 'active' ? 'bg-[#8BC34A] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Active
            </button>
            <button 
              onClick={() => setViewMode('trash')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${viewMode === 'trash' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Trash
            </button>
          </div>
        </div>
        
        <button onClick={() => { setFormData({ id: '', title: '', date: '', startTime: '', endTime: '', status: 'Active', clientId: '', kategoriSoal: [] }); setIsModalOpen(true); }} className="bg-[#8BC34A] hover:bg-[#7cb342] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer">
          + Create Event
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(viewMode === 'active' ? activeEvents : trashedEvents).map((ev: any) => (
          <div key={ev.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col h-48 relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-gray-900 leading-tight">{ev.title}</h3>
              <button 
                onClick={() => handleToggleStatus(ev)}
                className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${ev.status === 'Active' ? 'bg-[#8BC34A] text-white hover:bg-[#7cb342]' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                {ev.status}
              </button>
            </div>
            <div className="flex flex-col space-y-1 text-sm text-gray-500 mb-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{ev.date ? new Date(ev.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{(ev.startTime || ev.endTime) ? `${ev.startTime || '00:00'} - ${ev.endTime || '23:59'}` : 'Waktu belum diatur'}</span>
              </div>
            </div>
            {ev.kategoriSoal && ev.kategoriSoal.length > 0 && (
              <div className="text-xs text-gray-400 truncate mb-4">
                {ev.kategoriSoal.join(', ')}
              </div>
            )}
            <div className="mt-auto flex items-center justify-end pt-4 border-t border-gray-100 gap-2 relative">
              {viewMode === 'active' ? (
                <>
                  <button onClick={() => handleCopyUrl(ev.id, ev.slug)} className="flex items-center space-x-1.5 bg-[#1a1a1a] text-white hover:bg-black text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer shadow-sm">
                    <span>Copy URL</span>
                  </button>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        if (rect.bottom + 250 > window.innerHeight) {
                          setDropdownPosition('up');
                        } else {
                          setDropdownPosition('down');
                        }
                        setActiveDropdown(activeDropdown === ev.id ? null : ev.id);
                      }}
                      className="flex items-center space-x-1.5 bg-[#8BC34A] text-white hover:bg-[#7cb342] text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Menu</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {activeDropdown === ev.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                        <div className={`absolute right-0 ${dropdownPosition === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1.5 z-50`}>
                          <button onClick={() => { setActiveDropdown(null); setFormData({ id: ev.id, title: ev.title, slug: ev.slug || '', date: ev.date || '', startTime: ev.startTime || '', endTime: ev.endTime || '', status: ev.status, clientId: ev.clientId || '', kategoriSoal: ev.kategoriSoal || [] }); setIsModalOpen(true); }} className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                          <button onClick={() => { setActiveDropdown(null); setSelectedEventForTime(ev); setIsTimeModalOpen(true); }} className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"><Clock className="w-3.5 h-3.5" /> Ubah Jadwal</button>
                          <button onClick={() => { setActiveDropdown(null); window.location.hash = '#/peserta'; }} className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"><Users className="w-3.5 h-3.5" /> Peserta</button>
                          <button onClick={() => { setActiveDropdown(null); setSelectedEventForRadar(ev); setIsRadarModalOpen(true); }} className="w-full text-left px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors cursor-pointer"><Radio className="w-3.5 h-3.5" /> Radar Pengawas (Live)</button>
                          {onNavigateToLoadTest && (
                            <button onClick={() => { setActiveDropdown(null); onNavigateToLoadTest(); }} className="w-full text-left px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2 transition-colors cursor-pointer"><Zap className="w-3.5 h-3.5 text-amber-500" /> Uji Beban (Load Test)</button>
                          )}
                          <button onClick={() => { setActiveDropdown(null); setSelectedEventForDownload(ev); setIsDownloadModalOpen(true); }} className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"><Download className="w-3.5 h-3.5" /> Download Laporan</button>
                          <button onClick={() => { setActiveDropdown(null); updateData(ev.id, { ...ev, status: ev.status === 'Active' ? 'Not Active' : 'Active' }); }} className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer">{ev.status === 'Active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />} Set {ev.status === 'Active' ? 'Not Active' : 'Active'}</button>
                          <button onClick={() => { setActiveDropdown(null); handleDelete(ev.id, ev.title); }} className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Hapus</button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => handleRestore(ev.id, ev.title)} className="flex items-center space-x-1.5 bg-white border border-[#8BC34A] text-[#8BC34A] hover:bg-[#8BC34A]/10 text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer shadow-sm">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button onClick={() => handlePermanentDelete(ev.id, ev.title)} className="flex items-center space-x-1.5 bg-red-500 text-white hover:bg-red-600 text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer shadow-sm">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Permanen</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={!formData.id ? "Create Event" : "Edit Event"} maxWidth="max-w-2xl">
        <div className="space-y-6">
          
          {/* Client Selection */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Client</label>
            <div className="relative">
              <select value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#8BC34A] bg-white appearance-none">
                <option value="">Pilih Client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.nama}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                 <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Event Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Nama Event</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Custom URL / Slug (Opsional)</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  /p/
                </span>
                <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="kosongkan-untuk-auto" className="flex-1 w-full border border-gray-300 rounded-r-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
              </div>
            </div>
          </div>

          {/* Kategori Soal */}
          <div>
             <label className="block text-sm text-gray-600 mb-2">Kategori Soal (Pilih yang diujikan)</label>
             <div className="flex flex-wrap gap-2">
                {kategoriOptions.map((kategori) => {
                  const isSelected = formData.kategoriSoal.includes(kategori);
                  return (
                    <button 
                      key={kategori}
                      onClick={() => handleToggleKategori(kategori)}
                      className={`px-4 py-2 rounded-lg text-sm border font-medium transition-colors ${isSelected ? 'bg-[#8BC34A] text-white border-[#8BC34A]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                      {kategori}
                    </button>
                  );
                })}
             </div>
          </div>

          {/* Date and Time Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-sm text-gray-600 mb-2">Tanggal Event</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#8BC34A]" />
             </div>
             <div>
                <label className="block text-sm text-gray-600 mb-2">Jam Mulai</label>
                <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#8BC34A]" />
             </div>
             <div>
                <label className="block text-sm text-gray-600 mb-2">Jam Selesai</label>
                <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#8BC34A]" />
             </div>
          </div>

          {/* Status Toggle */}
          <div>
             <label className="block text-sm text-gray-600 mb-2">Status</label>
             <div className="flex gap-4">
                <button 
                  onClick={() => setFormData({...formData, status: 'Active'})} 
                  className={`w-32 py-2 rounded-md text-sm font-bold border transition-colors ${formData.status === 'Active' ? 'bg-[#1C1C1C] text-white border-[#1C1C1C]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                >
                  Active
                </button>
                <button 
                  onClick={() => setFormData({...formData, status: 'Not Active'})} 
                  className={`w-32 py-2 rounded-md text-sm font-bold border transition-colors ${formData.status !== 'Active' ? 'bg-[#1C1C1C] text-white border-[#1C1C1C]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                >
                  Not Active
                </button>
             </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-[#1C1C1C] hover:bg-black text-white px-10 py-3 rounded-full text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isSaving ? 'Menyimpan...' : 'SAVE DATA'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Download Laporan Modal */}
      {selectedEventForDownload && (() => {
        const nonDeletedParticipants = (participants || []).filter((p: any) => !p.isDeleted);
        const eventParticipants = getParticipantsForEvent(selectedEventForDownload, nonDeletedParticipants);
        const reportList = ['Data Peserta', ...(selectedEventForDownload.kategoriSoal || [])];

        const getReportDescription = (name: string) => {
          const lower = name.toLowerCase();
          if (lower.includes('peserta')) {
            return 'Rekap biodata, akun login, kontak WhatsApp, dan status pengerjaan seluruh peserta.';
          }
          if (lower.includes('intelegensi') || lower.includes('ist')) {
            return 'Master Skor IST: Nilai Mentah (RW), Skor Standar (SW), IQ Total, 4 Ranah Pokok, Peminatan IPA/IPS & Rekomendasi Jurusan.';
          }
          if (lower.includes('gaya belajar')) {
            return 'Rekap skor modalitas belajar: Visual, Auditori, dan Kinestetik per peserta.';
          }
          if (lower.includes('papi')) {
            return 'Rekap penilaian 20 aspek dinamika kepribadian dan profil kerja PAPI Kostick.';
          }
          if (lower.includes('mbti')) {
            return 'Rekap tipe kepribadian 16 dimensi MBTI dan ringkasan karakteristik kerja.';
          }
          if (lower.includes('rmib') || lower.includes('minat')) {
            return 'Rekap 3 arah minat vokasional & karier teratas peserta.';
          }
          return 'Rekapitulasi nilai dan jawaban peserta untuk tes ini.';
        };

        const handleDownloadSingle = async (laporan: string) => {
          setDownloadingReport(laporan);
          try {
            await handleDownloadEventReport(selectedEventForDownload, nonDeletedParticipants, laporan);
          } finally {
            setDownloadingReport(null);
          }
        };

        const handleDownloadAll = async () => {
          setIsDownloadingAll(true);
          try {
            for (const rep of reportList) {
              await handleDownloadEventReport(selectedEventForDownload, nonDeletedParticipants, rep);
              await new Promise(r => setTimeout(r, 400));
            }
          } finally {
            setIsDownloadingAll(false);
          }
        };

        return (
          <Modal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} title="" maxWidth="max-w-3xl">
            <div className="-mt-6 -mx-6 mb-5 bg-[#1C1C1C] text-white py-4 px-6 rounded-t-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-[#8BC34A] font-bold">Download Laporan Event</div>
                <h2 className="text-lg font-bold">{selectedEventForDownload.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full font-medium text-gray-200">
                  {eventParticipants.length} Peserta Terdaftar
                </span>
              </div>
            </div>

            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 flex items-start gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Format Laporan: Spreadsheet Excel (.xlsx) Siap Pakai</span>
                Laporan diunduh dalam format Excel rapi dengan lebar kolom otomatis, siap dicetak atau diolah untuk psikogram peserta.
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-xs">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Nama Laporan</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Keterangan Isi Data</th>
                    <th className="px-4 py-3 w-36 text-center">Aksi Unduh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {reportList.map((laporan, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-4 text-center font-medium text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <span>{laporan}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">.xlsx</span>
                        </div>
                        <div className="text-xs text-gray-500 sm:hidden mt-1">
                          {getReportDescription(laporan)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500 hidden sm:table-cell">
                        {getReportDescription(laporan)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => handleDownloadSingle(laporan)}
                          disabled={downloadingReport === laporan || isDownloadingAll}
                          className="inline-flex items-center gap-1.5 bg-[#8BC34A] hover:bg-[#7cb342] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs hover:shadow cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Unduh file Excel untuk ${laporan}`}
                        >
                          {downloadingReport === laporan ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>{downloadingReport === laporan ? 'Mengunduh...' : 'Unduh Excel'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-gray-500">
                Total <strong>{reportList.length}</strong> jenis laporan tersedia untuk event ini.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  disabled={isDownloadingAll || downloadingReport !== null}
                  className="inline-flex items-center gap-2 bg-[#1C1C1C] hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingAll ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8BC34A]" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-[#8BC34A]" />
                  )}
                  <span>{isDownloadingAll ? 'Mengunduh Semua...' : 'Unduh Semua Laporan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDownloadModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Radar Pengawas Modal */}
      {selectedEventForRadar && (
        <Modal isOpen={isRadarModalOpen} onClose={() => setIsRadarModalOpen(false)} title={`📡 Radar Pengawas: ${selectedEventForRadar.title}`} maxWidth="max-w-4xl">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <div className="text-blue-500 font-medium text-sm">Total Peserta</div>
                <div className="text-3xl font-bold text-blue-700 mt-1">
                  {participants?.filter((p: any) => !p.isDeleted && p.eventId === selectedEventForRadar.id).length || 0}
                </div>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <div className="text-green-600 font-medium text-sm">Sedang Mengerjakan</div>
                <div className="text-3xl font-bold text-green-700 mt-1">0</div>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                <div className="text-purple-600 font-medium text-sm">Selesai (Submitted)</div>
                <div className="text-3xl font-bold text-purple-700 mt-1">0</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Nama Peserta</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Modul Terakhir</th>
                    <th className="px-4 py-3">Aktivitas Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {participants?.filter((p: any) => !p.isDeleted && p.eventId === selectedEventForRadar.id).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Belum ada peserta yang mendaftar di event ini</td>
                    </tr>
                  ) : (
                    participants?.filter((p: any) => !p.isDeleted && p.eventId === selectedEventForRadar.id).map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.namaPeserta || p.nama}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full border border-gray-200">Offline / Belum Mulai</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">-</td>
                        <td className="px-4 py-3 text-gray-500">
                          {p.createdAt ? new Date(p.createdAt?.seconds ? p.createdAt.seconds * 1000 : p.createdAt).toLocaleString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* Time Update Modal */}
      <Modal isOpen={isTimeModalOpen} onClose={() => { setIsTimeModalOpen(false); setSelectedEventForTime(null); }} title="Ubah Jadwal Event" maxWidth="max-w-md">
        {selectedEventForTime && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Tanggal Event</label>
              <input type="date" value={selectedEventForTime.date} onChange={e => setSelectedEventForTime({...selectedEventForTime, date: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#8BC34A]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Jam Mulai</label>
                <input type="time" value={selectedEventForTime.startTime || ''} onChange={e => setSelectedEventForTime({...selectedEventForTime, startTime: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#8BC34A]" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Jam Selesai</label>
                <input type="time" value={selectedEventForTime.endTime || ''} onChange={e => setSelectedEventForTime({...selectedEventForTime, endTime: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#8BC34A]" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button onClick={() => setIsTimeModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors cursor-pointer">Batal</button>
              <button 
                disabled={isSavingTime}
                onClick={async () => {
                  setIsSavingTime(true);
                  try {
                    await updateData(selectedEventForTime.id, {
                      date: selectedEventForTime.date,
                      startTime: selectedEventForTime.startTime,
                      endTime: selectedEventForTime.endTime
                    });
                    setIsTimeModalOpen(false);
                  } catch (e) {
                    console.error(e);
                    alert('Gagal menyimpan jadwal');
                  } finally {
                    setIsSavingTime(false);
                  }
                }} 
                className="bg-[#8BC34A] hover:bg-[#7cb342] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSavingTime ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isSavingTime ? 'Menyimpan...' : 'Simpan Jadwal'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
