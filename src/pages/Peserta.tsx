import { confirmAction } from '../utils/confirmAction';
import React, { useState, useMemo } from 'react';
import { DataTable } from '../components/layout/DataTable';
import { Modal } from '../components/layout/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { ParticipantDetail } from '../components/ParticipantDetail';
import { TabulasiPenilaian } from './TabulasiPenilaian';
import { Calculator, Users as UsersIcon, Loader2, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { DeleteParticipantModal, DeletionType } from '../components/DeleteParticipantModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Peserta() {
  const { data: pesertasRaw, addData, updateData, deleteData } = useFirestore('participants');
  const { data: events } = useFirestore('events');
  
  // Loading states for async operations
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isBatchRestoring, setIsBatchRestoring] = useState(false);
  const [isBatchEmptying, setIsBatchEmptying] = useState(false);

  // Tab & View States
  const [pesertaTab, setPesertaTab] = useState<'daftar' | 'tabulasi'>('daftar');
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

  // Modal dialog konfirmasi penghapusan dengan verifikasi ketik 'DELETE'
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    participant: any | null;
    type: DeletionType;
    trashCount?: number;
  }>({
    isOpen: false,
    participant: null,
    type: 'soft',
    trashCount: 0
  });

  // Filter hanya event aktif (bukan event di tempat sampah / isDeleted)
  const activeEvents = (events || []).filter((e: any) => !e.isDeleted);
  const activeEventIds = new Set(activeEvents.map((e: any) => e.id));

  // Event lookup map
  const eventMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (events) {
      events.forEach((evt: any) => {
        if (evt.id) map[evt.id] = evt.title || evt.name || evt.id;
        if (evt.slug) map[evt.slug] = evt.title || evt.name || evt.slug;
      });
    }
    return map;
  }, [events]);

  const [data] = useState([
    { id: '1', avatar: 'https://i.pravatar.cc/100?img=1', noPeserta: '026596965', nik: '05248979', nama: 'jasmine', gender: 'Wanita', email: 'jasmine@gmail.com', noWa: '085893790842', tglLahir: 'Jan 14, 2012', umur: '14 Tahun', tglDaftar: 'Feb 08, 2026', status: 'Account Active', hasLock: true },
    { id: '2', avatar: 'https://i.pravatar.cc/100?img=2', noPeserta: '224857487', nik: '12164575', nama: 'lili', gender: 'Wanita', email: 'lili@gmail.com', noWa: '0214548748551545', tglLahir: 'Jun 13, 2009', umur: '17 Tahun', tglDaftar: 'Jan 13, 2026', status: 'Account Active', hasLock: true },
    { id: '3', avatar: 'https://i.pravatar.cc/100?img=3', noPeserta: '0854515454', nik: '84545185454', nama: 'lala', gender: 'Wanita', email: 'lala@gmail.com', noWa: '052121854546454', tglLahir: 'Jul 02, 2000', umur: '26 Tahun', tglDaftar: 'Jan 13, 2026', status: 'Account Active', hasLock: true },
  ]);

  // Pisahkan peserta aktif vs peserta di tempat sampah
  const activePesertasRaw = (pesertasRaw || []).filter((p: any) => {
    if (p.isDeleted) return false;
    if (!p.eventId) return false;
    return activeEventIds.has(p.eventId);
  });

  const trashedPesertasRaw = (pesertasRaw || []).filter((p: any) => {
    return p.isDeleted === true;
  });

  // Mapper function
  const mapParticipant = (p: any) => {
    let parsedTglDaftar = p.tglDaftar || '-';
    if (p.createdAt) {
      try {
        const dateObj = typeof p.createdAt === 'string' ? new Date(p.createdAt) : (p.createdAt.toDate ? p.createdAt.toDate() : new Date());
        parsedTglDaftar = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch(e) {}
    }

    let parsedDeletedAt = '-';
    if (p.deletedAt) {
      try {
        const dObj = typeof p.deletedAt === 'string' ? new Date(p.deletedAt) : (p.deletedAt.toDate ? p.deletedAt.toDate() : new Date(p.deletedAt));
        parsedDeletedAt = dObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
      } catch(e) {}
    }

    let calculatedUmur = p.umur || '-';
    const birthDateStr = p.tanggalLahir || p.tglLahir;
    if (birthDateStr && birthDateStr !== '-') {
      try {
        const birthDate = new Date(birthDateStr);
        if (!isNaN(birthDate.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          calculatedUmur = `${age} Tahun`;
        }
      } catch (e) {}
    }

    const eventName = eventMap[p.eventId] || p.event || 'Tanpa Event';

    return {
      ...p,
      nama: p.namaPeserta || p.nama || '-',
      gender: p.jenisKelamin || p.gender || '-',
      noWa: p.nomorPonsel || p.noWa || '-',
      tglLahir: birthDateStr || '-',
      umur: calculatedUmur,
      tglDaftar: parsedTglDaftar,
      deletedAtFormatted: parsedDeletedAt,
      eventTitle: eventName,
      avatar: p.photoBase64 && p.photoBase64 !== 'verified' ? p.photoBase64 : (p.avatar || 'https://i.pravatar.cc/100'),
      status: p.isDeleted ? 'Di Tempat Sampah' : 'Account Active',
    };
  };

  // Filtered lists
  let activePesertas = activePesertasRaw.map(mapParticipant);
  if (selectedEventId !== 'all') {
    if (activeEventIds.has(selectedEventId)) {
      activePesertas = activePesertas.filter(p => p.eventId === selectedEventId);
    }
  }

  let trashedPesertas = trashedPesertasRaw.map(mapParticipant);
  if (selectedEventId !== 'all') {
    trashedPesertas = trashedPesertas.filter(p => p.eventId === selectedEventId);
  }

  const [formData, setFormData] = useState({ 
    id: '', event: '', passwordMode: 'Acak', nik: '', nama: '', tglLahir: '', 
    gender: 'Pria', agama: '', suku: '', provinsi: '', level: '', sekolah: '', 
    fakultas: '', prodi: '', prodi2: '', alamat: '' 
  });

  // State to track which columns are visible
  const [visibleColumns, setVisibleColumns] = useState({
    'NO PESERTA': true,
    'NIK': true,
    'NAMA': true,
    'GENDER': true,
    'EMAIL': true,
    'NO WA': true,
    'TGL LAHIR': true,
    'UMUR': true,
    'TGL DAFTAR': true,
    'STATUS': true
  });

  const handleColumnToggle = async (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };

  const columns = [
    { 
      key: 'avatar', 
      label: 'AVATAR',
      render: (val: string) => <img src={val} alt="Avatar" className="w-8 h-8 rounded-full" />
    },
    { key: 'noPeserta', label: 'NO PESERTA' },
    { key: 'nik', label: 'NIK' },
    { key: 'nama', label: 'NAMA' },
    { key: 'gender', label: 'GENDER' },
    { key: 'email', label: 'EMAIL' },
    { key: 'noWa', label: 'NO WA' },
    { key: 'tglLahir', label: 'TGL LAHIR' },
    { key: 'umur', label: 'UMUR' },
    { key: 'tglDaftar', label: 'TGL DAFTAR' },
    { 
      key: 'status', 
      label: 'STATUS',
      render: (val: string) => (
        <span className="px-2 py-1 bg-[#8BC34A] text-white text-[10px] font-semibold rounded whitespace-nowrap">{val}</span>
      )
    },
  ];

  // Kolom khusus saat melihat tab Tempat Sampah
  const trashColumns = [
    { 
      key: 'avatar', 
      label: 'AVATAR',
      render: (val: string) => <img src={val} alt="Avatar" className="w-8 h-8 rounded-full opacity-60" />
    },
    { key: 'noPeserta', label: 'NO PESERTA' },
    { key: 'nik', label: 'NIK' },
    { key: 'nama', label: 'NAMA' },
    { key: 'eventTitle', label: 'EVENT' },
    { key: 'gender', label: 'GENDER' },
    { key: 'email', label: 'EMAIL' },
    { key: 'noWa', label: 'NO WA' },
    { 
      key: 'deletedAtFormatted', 
      label: 'TGL DIHAPUS',
      render: (val: string) => (
        <span className="text-xs text-red-600 font-semibold whitespace-nowrap">{val}</span>
      )
    },
    { 
      key: 'status', 
      label: 'STATUS',
      render: () => (
        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded whitespace-nowrap">
          Di Tempat Sampah
        </span>
      )
    },
  ];

  // Filter columns based on visibleColumns state for active view
  const activeColumns = columns.filter(col => {
    if (col.key === 'avatar') return true; // always show avatar
    return visibleColumns[col.label as keyof typeof visibleColumns] !== false;
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!formData.id) {
        await addData({ 
          ...formData,
          avatar: `https://i.pravatar.cc/100?img=${Math.floor(Math.random()*70)}`,
          noPeserta: Math.floor(Math.random()*1000000000).toString(),
          email: formData.nama.toLowerCase().replace(/\s/g, '') + '@gmail.com',
          noWa: '08' + Math.floor(Math.random()*1000000000).toString(),
          umur: '20 Tahun',
          tglDaftar: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          status: 'Account Active',
          hasLock: true,
          isDeleted: false
        });
      } else {
        await updateData(formData.id, formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data');
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Pindahkan peserta ke Tempat Sampah (Soft Delete via Modal 'DELETE')
  const handleOpenSoftDelete = (row: any) => {
    setDeleteModalConfig({
      isOpen: true,
      participant: row,
      type: 'soft'
    });
  };

  // 2. Pulihkan peserta dari Tempat Sampah (Restore)
  const handleRestore = async (row: any) => {
    if (await confirmAction(`Pulihkan data peserta "${row.nama}" (${row.noPeserta || '-'}) kembali ke daftar peserta aktif?`)) {
      try {
        await updateData(row.id, {
          isDeleted: false,
          deletedAt: null
        });
      } catch (error) {
        console.error(error);
        alert('Gagal memulihkan peserta');
      }
    }
  };

  // 3. Hapus Permanen dari Database (Permanent Delete via Modal 'DELETE')
  const handleOpenPermanentDelete = (row: any) => {
    setDeleteModalConfig({
      isOpen: true,
      participant: row,
      type: 'permanent'
    });
  };

  // 4. Pulihkan Semua peserta di Tempat Sampah
  const handleRestoreAll = async () => {
    if (trashedPesertas.length === 0) return;
    if (await confirmAction(`Pulihkan SEMUA (${trashedPesertas.length}) peserta dari tempat sampah kembali ke daftar peserta aktif?`)) {
      setIsBatchRestoring(true);
      try {
        for (const p of trashedPesertas) {
          await updateData(p.id, { isDeleted: false, deletedAt: null });
        }
      } catch (error) {
        console.error(error);
        alert('Terjadi kendala saat memulihkan beberapa peserta');
      } finally {
        setIsBatchRestoring(false);
      }
    }
  };

  // 5. Kosongkan Tempat Sampah (Hapus permanen semua peserta via Modal 'DELETE')
  const handleOpenEmptyTrash = () => {
    if (trashedPesertas.length === 0) return;
    setDeleteModalConfig({
      isOpen: true,
      participant: null,
      type: 'empty_trash',
      trashCount: trashedPesertas.length
    });
  };

  // 6. Eksekusi Penghapusan Terkonfirmasi (setelah mengetik 'DELETE')
  const handleConfirmDelete = async () => {
    const { type, participant } = deleteModalConfig;
    if (type === 'soft' && participant) {
      await updateData(participant.id, {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
    } else if (type === 'permanent' && participant) {
      await deleteData(participant.id);
    } else if (type === 'empty_trash') {
      for (const p of trashedPesertas) {
        await deleteData(p.id);
      }
    }
  };

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const exportData = activePesertas.length > 0 ? activePesertas : data;
      if (exportData.length === 0) {
        alert("Tidak ada data untuk diekspor");
        return;
      }

      const exportColumns = columns.filter(col => col.key !== 'avatar' && col.key !== 'status' && col.key !== 'action');

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += exportColumns.map(col => col.label).join(",") + "\n";
      
      exportData.forEach(row => {
        const rowData = exportColumns.map(col => {
          let cellData = row[col.key as keyof typeof row] || "";
          cellData = String(cellData).replace(/,/g, " ").replace(/\n/g, " ");
          return cellData;
        });
        csvContent += rowData.join(",") + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Data_Peserta_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const exportData = activePesertas.length > 0 ? activePesertas : data;
      if (exportData.length === 0) {
        alert("Tidak ada data untuk diekspor");
        return;
      }

      const exportColumns = columns.filter(col => col.key !== 'avatar' && col.key !== 'status' && col.key !== 'action');
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(14);
      doc.text("Data Peserta", 14, 15);

      const tableColumn = exportColumns.map(col => col.label);
      const tableRows = exportData.map(row => {
        return exportColumns.map(col => {
          let cellData = row[col.key as keyof typeof row] || "-";
          return String(cellData);
        });
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 195, 74] } // #8BC34A
      });

      doc.save(`Data_Peserta_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (selectedParticipant) {
    return <ParticipantDetail participant={selectedParticipant} onClose={() => setSelectedParticipant(null)} />
  }

  return (
    <div className="space-y-4">
      {/* View Switcher: Daftar Akun vs Tabulasi Penilaian */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setPesertaTab('daftar')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition cursor-pointer ${
              pesertaTab === 'daftar'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UsersIcon className="w-4 h-4 text-[#8BC34A]" />
            <span>Daftar Akun Peserta</span>
          </button>
          <button
            onClick={() => setPesertaTab('tabulasi')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition cursor-pointer ${
              pesertaTab === 'tabulasi'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calculator className="w-4 h-4 text-[#8BC34A]" />
            <span>Tabulasi Penilaian & Skoring Otomatis</span>
          </button>
        </div>

        {/* Sub-Switch: Peserta Aktif vs Tempat Sampah (hanya tampil di tab daftar) */}
        {pesertaTab === 'daftar' && (
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg self-end sm:self-auto">
            <button
              onClick={() => setViewMode('active')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === 'active'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Peserta Aktif</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                {activePesertas.length}
              </span>
            </button>
            <button
              onClick={() => setViewMode('trash')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === 'trash'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Tempat Sampah</span>
              {trashedPesertas.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  viewMode === 'trash' ? 'bg-white text-red-600' : 'bg-red-100 text-red-700'
                }`}>
                  {trashedPesertas.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {pesertaTab === 'tabulasi' ? (
        <TabulasiPenilaian
          onSelectParticipant={(p) => setSelectedParticipant(p)}
          preselectedEventId={selectedEventId}
        />
      ) : (
        <>
          {/* Event Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
             <div className="flex items-center space-x-4">
               <div className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Filter Event:</div>
               <select 
                 value={selectedEventId}
                 onChange={(e) => setSelectedEventId(e.target.value)}
                 className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8BC34A] focus:border-[#8BC34A] text-gray-700 font-medium min-w-[250px] bg-gray-50"
               >
                 <option value="all">Semua Lintas Event Aktif</option>
                 {activeEvents.map((evt: any) => (
                   <option key={evt.id} value={evt.id}>{evt.title || evt.name || evt.id}</option>
                 ))}
               </select>
             </div>
             <div className="text-gray-600 font-medium bg-gray-50 px-5 py-2.5 rounded-lg border border-gray-200 text-sm flex items-center shadow-sm">
               {viewMode === 'active' ? 'Total Peserta Terdaftar:' : 'Peserta di Tempat Sampah:'} 
               <span className={`ml-2 font-bold text-lg ${viewMode === 'active' ? 'text-[#8BC34A]' : 'text-red-600'}`}>
                 {viewMode === 'active' ? (activePesertas.length > 0 ? activePesertas.length : data.length) : trashedPesertas.length}
               </span>
             </div>
          </div>

          {/* VIEW MODE: TRASH / TEMPAT SAMPAH */}
          {viewMode === 'trash' ? (
            <div className="space-y-4">
              {/* Informational Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <div className="font-bold">Tempat Sampah Peserta (Soft Delete & Restore)</div>
                  <div className="mt-0.5 text-xs text-amber-700 leading-relaxed">
                    Data peserta di bawah ini sebelumnya dipindahkan ke tempat sampah. Klik tombol <strong>Pulihkan</strong> untuk mengembalikan peserta beserta akun login dan riwayat ujiannya ke daftar aktif. Jika Anda yakin ingin memusnahkan data selamanya dari server, klik <strong>Hapus Permanen</strong>.
                  </div>
                </div>
              </div>

              {/* Trash DataTable */}
              <DataTable 
                title={`Tempat Sampah Peserta (${trashedPesertas.length})`}
                columns={trashColumns}
                data={trashedPesertas}
                onRestore={handleRestore}
                onPermanentDelete={handleOpenPermanentDelete}
                onRowClick={(row) => setSelectedParticipant(row)}
                onView={(row) => setSelectedParticipant(row)}
                headerActions={
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleRestoreAll}
                      disabled={trashedPesertas.length === 0 || isBatchRestoring}
                      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-md font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                      title="Pulihkan Semua Peserta di Tempat Sampah"
                    >
                      {isBatchRestoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      <span>{isBatchRestoring ? 'Memulihkan...' : `Pulihkan Semua (${trashedPesertas.length})`}</span>
                    </button>
                    <button 
                      onClick={handleOpenEmptyTrash}
                      disabled={trashedPesertas.length === 0 || isBatchEmptying}
                      className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 px-3 py-1.5 rounded-md font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                      title="Kosongkan Semua Peserta di Tempat Sampah"
                    >
                      {isBatchEmptying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>{isBatchEmptying ? 'Mengosongkan...' : 'Kosongkan Tempat Sampah'}</span>
                    </button>
                  </div>
                }
              />
            </div>
          ) : (
            /* VIEW MODE: ACTIVE PESERTA */
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-sm font-medium">
                <div className="mb-2 text-gray-700">FILTER FIELDS</div>
                <div className="flex flex-wrap gap-4 text-gray-600">
                   {Object.keys(visibleColumns).map(field => (
                     <label key={field} className="flex items-center space-x-1.5 cursor-pointer text-xs">
                       <input 
                         type="checkbox" 
                         checked={visibleColumns[field as keyof typeof visibleColumns]} 
                         onChange={() => handleColumnToggle(field)}
                         className="rounded border-gray-300 text-[#8BC34A] focus:ring-[#8BC34A]" 
                       />
                       <span>{field}</span>
                     </label>
                   ))}
                </div>
              </div>
              
              <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Tip: Menghapus peserta kini dilengkapi verifikasi ketik <strong>'DELETE'</strong> demi mencegah klik yang tidak disengaja.</span>
                </span>
              </div>

              <DataTable 
                title="Peserta"
                columns={activeColumns}
                data={activePesertas.length > 0 ? activePesertas : data}
                onAdd={() => { setFormData({ id: '', event: '', passwordMode: 'Acak', nik: '', nama: '', tglLahir: '', gender: 'Pria', agama: '', suku: '', provinsi: '', level: '', sekolah: '', fakultas: '', prodi: '', prodi2: '', alamat: '' }); setIsModalOpen(true); }}
                addLabel="+ Add Peserta"
                onEdit={(row) => { setFormData({...formData, ...row}); setIsModalOpen(true); }}
                onDelete={handleOpenSoftDelete}
                onRowClick={(row) => setSelectedParticipant(row)}
                onView={(row) => setSelectedParticipant(row)}
                headerActions={
                  <div className="flex gap-2">
                    <button 
                      onClick={handleExportCSV}
                      disabled={isExportingCSV}
                      className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isExportingCSV ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                      <span>{isExportingCSV ? 'Mengekspor...' : 'Export CSV'}</span>
                    </button>
                    <button 
                      onClick={handleExportPDF}
                      disabled={isExportingPDF}
                      className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isExportingPDF ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                      <span>{isExportingPDF ? 'Mengekspor...' : 'Export PDF'}</span>
                    </button>
                  </div>
                }
              />
            </div>
          )}

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={!formData.id ? "Tambah Peserta" : "Edit Peserta"} maxWidth="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-4">
                <div><label className="block text-sm text-gray-600 mb-1">Pilih Event</label><select value={formData.event} onChange={e => setFormData({...formData, event: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#8BC34A] focus:outline-none">{activeEvents.map(e => <option key={e.id} value={e.id}>{e.title || e.id}</option>)}</select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Password</label><select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#8BC34A] focus:outline-none"><option>Acak (Otomatis)</option></select></div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">NIK</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.nik} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({...formData, nik: val});
                    }} 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#8BC34A] focus:outline-none" 
                  />
                </div>
                <div><label className="block text-sm text-gray-600 mb-1">Nama Lengkap</label><input type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#8BC34A] focus:outline-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm text-gray-600 mb-1">Tanggal Lahir</label><input type="date" value={formData.tglLahir} onChange={e => setFormData({...formData, tglLahir: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#8BC34A] focus:outline-none" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Jenis Kelamin</label><select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#8BC34A] focus:outline-none bg-white"><option>Pria</option><option>Wanita</option></select></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm text-gray-600 mb-1">Level</label><select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#8BC34A] focus:outline-none"><option>SMA</option></select></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Nama Sekolah/PT</label><input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#8BC34A] focus:outline-none" /></div>
                </div>
                <div><label className="block text-sm text-gray-600 mb-1">Fakultas</label><input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#8BC34A] focus:outline-none" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Prodi 1</label><select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#8BC34A] focus:outline-none"><option>Teknik Informatika</option></select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Alamat Tinggal</label><textarea rows={3} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#8BC34A] focus:outline-none" /></div>
              </div>
            </div>
            <div className="pt-6 flex justify-end">
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-[#1C1C1C] hover:bg-black text-white px-10 py-3 rounded-full text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isSaving ? 'Menyimpan...' : 'SAVE DATA'}</span>
              </button>
            </div>
          </Modal>

          {/* Modal Konfirmasi Penghapusan Peserta (Verifikasi Ketik 'DELETE') */}
          <DeleteParticipantModal
            isOpen={deleteModalConfig.isOpen}
            onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
            participant={deleteModalConfig.participant}
            type={deleteModalConfig.type}
            trashCount={deleteModalConfig.trashCount}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}
    </div>
  );
}
