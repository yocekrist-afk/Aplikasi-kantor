import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Compass,
  ArrowUpDown,
  DownloadCloud,
  FileSpreadsheet,
  UserPlus,
  RotateCcw,
  School,
  Users,
  CheckSquare,
  SlidersHorizontal,
  Columns3,
  Check,
  X,
  Calendar,
} from 'lucide-react';
import { Gender, Participant } from '../types/ist';

export type ColumnId =
  | 'no'
  | 'nomorTes'
  | 'nama'
  | 'asalSekolah'
  | 'genderAge'
  | 'pendidikan'
  | 'tanggalTes'
  | 'rawScores'
  | 'totalSS'
  | 'totalIQ'
  | 'iqCategory'
  | 'stream'
  | 'actions';

export interface ColumnDefinition {
  id: ColumnId;
  label: string;
  shortLabel: string;
  category: 'identitas' | 'skor' | 'hasil' | 'aksi';
  description: string;
  defaultVisible: boolean;
}

export const TABLE_COLUMNS: ColumnDefinition[] = [
  {
    id: 'no',
    label: 'Nomor Urut',
    shortLabel: 'No',
    category: 'identitas',
    description: 'Nomor urutan baris data peserta',
    defaultVisible: true,
  },
  {
    id: 'nomorTes',
    label: 'Nomor Tes Peserta',
    shortLabel: 'No. Tes',
    category: 'identitas',
    description: 'Nomor unik kartu peserta / asesmen',
    defaultVisible: true,
  },
  {
    id: 'nama',
    label: 'Nama Lengkap Peserta',
    shortLabel: 'Nama Peserta',
    category: 'identitas',
    description: 'Nama lengkap peserta tes',
    defaultVisible: true,
  },
  {
    id: 'asalSekolah',
    label: 'Asal Sekolah / Institusi',
    shortLabel: 'Asal Sekolah',
    category: 'identitas',
    description: 'Nama sekolah, perguruan tinggi, atau institusi asal',
    defaultVisible: true,
  },
  {
    id: 'pendidikan',
    label: 'Pendidikan / Jenjang',
    shortLabel: 'Pendidikan',
    category: 'identitas',
    description: 'Tingkat jenjang pendidikan (SMA, SMK, S1, dll)',
    defaultVisible: true,
  },
  {
    id: 'genderAge',
    label: 'Jenis Kelamin & Usia',
    shortLabel: 'JK / Usia',
    category: 'identitas',
    description: 'Jenis kelamin (L/P) dan umur peserta dalam tahun',
    defaultVisible: true,
  },
  {
    id: 'tanggalTes',
    label: 'Tanggal Pelaksanaan Tes',
    shortLabel: 'Tanggal Tes',
    category: 'identitas',
    description: 'Tanggal saat asesmen IST diselenggarakan',
    defaultVisible: false,
  },
  {
    id: 'rawScores',
    label: 'Skor Mentah Subtes (RW)',
    shortLabel: 'Skor Mentah (RW)',
    category: 'skor',
    description: 'Nilai mentah 9 subtes (SE, WA, AN, GE, RA, ZR, FA, WU, ME)',
    defaultVisible: true,
  },
  {
    id: 'totalSS',
    label: 'Total Skor Standar (SS / SW)',
    shortLabel: 'Total SS',
    category: 'skor',
    description: 'Jumlah bobot nilai standar IST (Standard Weighted)',
    defaultVisible: false,
  },
  {
    id: 'totalIQ',
    label: 'Nilai IQ Total',
    shortLabel: 'IQ Total',
    category: 'hasil',
    description: 'Skor IQ total hasil konversi norma tes IST',
    defaultVisible: true,
  },
  {
    id: 'iqCategory',
    label: 'Kategori Klasifikasi IQ',
    shortLabel: 'Kategori IQ',
    category: 'hasil',
    description: 'Tingkat intelegensi umum (Sangat Superior, Superior, dll)',
    defaultVisible: true,
  },
  {
    id: 'stream',
    label: 'Arah Peminatan (IPA / IPS)',
    shortLabel: 'Peminatan',
    category: 'hasil',
    description: 'Rekomendasi kecenderungan studi IPA, IPS, atau Seimbang',
    defaultVisible: true,
  },
  {
    id: 'actions',
    label: 'Menu Tombol Aksi',
    shortLabel: 'Aksi',
    category: 'aksi',
    description: 'Tombol cetak PDF, koreksi/edit data, dan hapus peserta',
    defaultVisible: true,
  },
];

const STORAGE_KEY = 'psikoedu_visible_columns_v2';

interface ParticipantTableProps {
  participants: Participant[];
  onSelectParticipant: (participant: Participant) => void;
  onDeleteParticipant: (id: string) => void;
  onEditParticipant: (participant: Participant) => void;
  onAddNewParticipant: () => void;
  onBatchExportPDF: (selectedParticipants: Participant[]) => void;
  onExportExcel: (participantsToExport: Participant[]) => void;
  onClearAll: () => void;
}

export const ParticipantTable: React.FC<ParticipantTableProps> = ({
  participants,
  onSelectParticipant,
  onDeleteParticipant,
  onEditParticipant,
  onAddNewParticipant,
  onBatchExportPDF,
  onExportExcel,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState<'ALL' | 'IPA' | 'IPS' | 'Seimbang'>('ALL');
  const [iqFilter, setIqFilter] = useState<string>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [schoolFilter, setSchoolFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'nomorTes' | 'nama' | 'totalIQ' | 'stream'>('totalIQ');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  // Column visibility state with persistent localStorage support
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnId, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          const result: Record<string, boolean> = {};
          TABLE_COLUMNS.forEach((col) => {
            result[col.id] = parsed[col.id] !== undefined ? Boolean(parsed[col.id]) : col.defaultVisible;
          });
          return result as Record<ColumnId, boolean>;
        }
      }
    } catch (e) {
      console.error('Gagal memuat pengaturan kolom:', e);
    }
    const defaultState: Record<string, boolean> = {};
    TABLE_COLUMNS.forEach((col) => {
      defaultState[col.id] = col.defaultVisible;
    });
    return defaultState as Record<ColumnId, boolean>;
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = async (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    };
    if (isColumnMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColumnMenuOpen]);

  const updateVisibleColumn = (id: ColumnId, isVisible: boolean) => {
    const next = { ...visibleColumns, [id]: isVisible };
    // Ensure at least 1 column remains visible
    if (Object.values(next).filter(Boolean).length === 0) return;
    setVisibleColumns(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  const showAllColumns = () => {
    const next: Record<string, boolean> = {};
    TABLE_COLUMNS.forEach((c) => {
      next[c.id] = true;
    });
    setVisibleColumns(next as Record<ColumnId, boolean>);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {}
  };

  const resetToDefaultColumns = () => {
    const next: Record<string, boolean> = {};
    TABLE_COLUMNS.forEach((c) => {
      next[c.id] = c.defaultVisible;
    });
    setVisibleColumns(next as Record<ColumnId, boolean>);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {}
  };

  const applyCompactPreset = () => {
    const next: Record<string, boolean> = {};
    TABLE_COLUMNS.forEach((c) => {
      next[c.id] = ['no', 'nomorTes', 'nama', 'totalIQ', 'iqCategory', 'actions'].includes(c.id);
    });
    setVisibleColumns(next as Record<ColumnId, boolean>);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {}
  };

  const activeColumnCount = useMemo(() => {
    return TABLE_COLUMNS.filter((col) => visibleColumns[col.id]).length;
  }, [visibleColumns]);

  const hiddenColumnsList = useMemo(() => {
    return TABLE_COLUMNS.filter((col) => !visibleColumns[col.id]);
  }, [visibleColumns]);

  const totalVisibleColSpan = 1 + activeColumnCount; // 1 for selection checkbox

  // Distinct school list
  const distinctDates = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.tanggalTes && p.tanggalTes.trim() !== '-' && p.tanggalTes.trim() !== '') {
        set.add(p.tanggalTes.trim());
      }
    });
    return Array.from(set).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [participants]);

  const distinctSchools = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.asalSekolahInstitusi && p.asalSekolahInstitusi.trim() !== '-' && p.asalSekolahInstitusi.trim() !== '') {
        set.add(p.asalSekolahInstitusi.trim());
      }
    });
    return Array.from(set).sort();
  }, [participants]);

  const hasActiveFilters =
    searchTerm !== '' ||
    streamFilter !== 'ALL' ||
    iqFilter !== 'ALL' ||
    genderFilter !== 'ALL' ||
    schoolFilter !== 'ALL' ||
    dateFilter !== 'ALL';

  const resetFilters = () => {
    setSearchTerm('');
    setStreamFilter('ALL');
    setIqFilter('ALL');
    setGenderFilter('ALL');
    setSchoolFilter('ALL');
    setDateFilter('ALL');
  };

  // Filter & Sort Logic
  const filteredParticipants = useMemo(() => {
    return participants
      .filter((p) => {
        const matchesSearch =
          p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.nomorTes.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.pendidikan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.asalSekolahInstitusi && p.asalSekolahInstitusi.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStream = streamFilter === 'ALL' || p.streamAnalysis.preference === streamFilter;

        const matchesGender = genderFilter === 'ALL' || p.jenisKelamin === genderFilter;

        const matchesSchool = schoolFilter === 'ALL' || p.asalSekolahInstitusi === schoolFilter;
        const matchesDate = dateFilter === 'ALL' || p.tanggalTes === dateFilter;

        const matchesIq =
          iqFilter === 'ALL' ||
          (iqFilter === 'SANGAT_SUPERIOR' && p.totalIQ >= 130) ||
          (iqFilter === 'SUPERIOR' && p.totalIQ >= 120 && p.totalIQ <= 129) ||
          (iqFilter === 'RATA_ATAS' && p.totalIQ >= 110 && p.totalIQ <= 119) ||
          (iqFilter === 'RATA_RATA' && p.totalIQ >= 90 && p.totalIQ <= 109) ||
          (iqFilter === 'RATA_BAWAH' && p.totalIQ >= 80 && p.totalIQ <= 89) ||
          (iqFilter === 'BATAS_RENDAH' && p.totalIQ < 80);

        return matchesSearch && matchesStream && matchesGender && matchesSchool && matchesIq && matchesDate;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'totalIQ') {
          comp = a.totalIQ - b.totalIQ;
        } else if (sortField === 'nama') {
          comp = a.nama.localeCompare(b.nama);
        } else if (sortField === 'nomorTes') {
          comp = a.nomorTes.localeCompare(b.nomorTes);
        } else if (sortField === 'stream') {
          comp = a.streamAnalysis.preference.localeCompare(b.streamAnalysis.preference);
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [participants, searchTerm, streamFilter, iqFilter, genderFilter, schoolFilter, sortField, sortOrder]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSelectAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredParticipants.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectId = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const getSelectedParticipants = (): Participant[] => {
    if (selectedIds.size === 0) return filteredParticipants;
    return participants.filter((p) => selectedIds.has(p.id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Action Bar */}
      <div className="p-5 border-b border-slate-100 bg-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Tabel Data Peserta & Hasil Pemeriksaan IST
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredParticipants.length} dari total {participants.length} peserta terdaftar.
            </p>
          </div>

          {/* Action buttons: Add, Excel, PDF Massal */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onAddNewParticipant}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Input peserta tes baru secara langsung"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Peserta</span>
            </button>

            <button
              onClick={() => onExportExcel(getSelectedParticipants())}
              disabled={participants.length === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Ekspor seluruh nilai lengkap (RW, SS, IQ, Peminatan) ke format Microsoft Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Rekap Excel</span>
            </button>

            <button
              onClick={() => onBatchExportPDF(getSelectedParticipants())}
              disabled={participants.length === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Unduh seluruh laporan PDF peserta dalam format arsip .ZIP"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>
                Unduh PDF Massal (ZIP)
                {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </span>
            </button>

            {participants.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer"
                title="Hapus semua data peserta"
              >
                Reset Semua
              </button>
            )}
          </div>
        </div>

        {/* Smart Filters & Table Settings Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search input */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, no tes, sekolah, kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* IQ category filter */}
            <div className="flex items-center space-x-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={iqFilter}
                onChange={(e) => setIqFilter(e.target.value)}
                className="bg-transparent text-slate-700 focus:outline-none text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Semua Kategori IQ</option>
                <option value="SANGAT_SUPERIOR">Sangat Superior (≥130)</option>
                <option value="SUPERIOR">Superior (120-129)</option>
                <option value="RATA_ATAS">Rata-rata Atas (110-119)</option>
                <option value="RATA_RATA">Rata-rata (90-109)</option>
                <option value="RATA_BAWAH">Rata-rata Bawah (80-89)</option>
                <option value="BATAS_RENDAH">Batas Rendah (&lt;80)</option>
              </select>
            </div>

            {/* Peminatan filter */}
            <div className="flex items-center space-x-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value as any)}
                className="bg-transparent text-slate-700 focus:outline-none text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Semua Peminatan</option>
                <option value="IPA">Peminatan IPA</option>
                <option value="IPS">Peminatan IPS</option>
                <option value="Seimbang">Peminatan Seimbang</option>
              </select>
            </div>

            {/* JK Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as any)}
                className="bg-transparent text-slate-700 focus:outline-none text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Semua JK</option>
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            {/* School filter */}
            {distinctSchools.length > 1 && (
              <div className="flex items-center space-x-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 max-w-[200px]">
                <School className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="bg-transparent text-slate-700 focus:outline-none text-xs font-medium cursor-pointer truncate"
                >
                  <option value="ALL">Semua Asal Sekolah</option>
                  {distinctSchools.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            
            {/* Date filter */}
            {distinctDates.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 max-w-[200px]">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent text-slate-700 focus:outline-none text-xs font-medium cursor-pointer truncate"
                >
                  <option value="ALL">Semua Tanggal Event</option>
                  {distinctDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition cursor-pointer"
                title="Kembalikan semua filter pencarian"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Atur Kolom Popover Menu */}
          <div className="relative shrink-0" ref={columnMenuRef}>
            <button
              onClick={() => setIsColumnMenuOpen((prev) => !prev)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shadow-2xs ${
                hiddenColumnsList.length > 0
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : isColumnMenuOpen
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Pilih dan atur judul kolom tabel yang ingin dimunculkan atau disembunyikan"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <span>Atur Kolom</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  hiddenColumnsList.length > 0
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {activeColumnCount}/{TABLE_COLUMNS.length}
              </span>
            </button>

            {/* Dropdown Menu Modal/Popover */}
            {isColumnMenuOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 text-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Columns3 className="w-4 h-4 text-blue-600" />
                      Pilihan Kolom Tabel Data Hasil Tes
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Centang judul tabel yang ingin ditampilkan atau disembunyikan
                    </p>
                  </div>
                  <button
                    onClick={() => setIsColumnMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 py-2 border-b border-slate-100 text-[11px]">
                  <span className="text-slate-400 font-medium text-[10px]">Preset Cepat:</span>
                  <button
                    onClick={showAllColumns}
                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition cursor-pointer"
                  >
                    Semua ({TABLE_COLUMNS.length})
                  </button>
                  <button
                    onClick={resetToDefaultColumns}
                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition cursor-pointer"
                  >
                    Bawaan
                  </button>
                  <button
                    onClick={applyCompactPreset}
                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition cursor-pointer"
                  >
                    Ringkas (Inti)
                  </button>
                </div>

                {/* Columns List Grouped */}
                <div className="max-h-72 overflow-y-auto py-1 space-y-2.5 pr-1 divide-y divide-slate-100">
                  {/* Category: Identitas Peserta */}
                  <div className="pt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1 flex items-center justify-between">
                      <span>Identitas & Profil Peserta</span>
                      <span className="text-[9px] font-normal text-slate-400 lowercase">
                        {TABLE_COLUMNS.filter((c) => c.category === 'identitas' && visibleColumns[c.id]).length}/
                        {TABLE_COLUMNS.filter((c) => c.category === 'identitas').length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {TABLE_COLUMNS.filter((c) => c.category === 'identitas').map((col) => {
                        const isChecked = Boolean(visibleColumns[col.id]);
                        return (
                          <label
                            key={col.id}
                            className={`flex items-start justify-between p-1.5 rounded-lg text-xs cursor-pointer transition select-none ${
                              isChecked ? 'bg-slate-50 hover:bg-blue-50/50' : 'hover:bg-slate-100 opacity-60'
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => updateVisibleColumn(col.id, e.target.checked)}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <div>
                                <span className={`font-semibold block text-[11.5px] ${isChecked ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                                  {col.label}
                                </span>
                                <span className="text-[10px] text-slate-400 block leading-tight">
                                  {col.description}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                                isChecked ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isChecked ? 'Tampil' : 'Sembunyi'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category: Skor IST */}
                  <div className="pt-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1 flex items-center justify-between">
                      <span>Skor & Subtes IST</span>
                      <span className="text-[9px] font-normal text-slate-400 lowercase">
                        {TABLE_COLUMNS.filter((c) => c.category === 'skor' && visibleColumns[c.id]).length}/
                        {TABLE_COLUMNS.filter((c) => c.category === 'skor').length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {TABLE_COLUMNS.filter((c) => c.category === 'skor').map((col) => {
                        const isChecked = Boolean(visibleColumns[col.id]);
                        return (
                          <label
                            key={col.id}
                            className={`flex items-start justify-between p-1.5 rounded-lg text-xs cursor-pointer transition select-none ${
                              isChecked ? 'bg-slate-50 hover:bg-blue-50/50' : 'hover:bg-slate-100 opacity-60'
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => updateVisibleColumn(col.id, e.target.checked)}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <div>
                                <span className={`font-semibold block text-[11.5px] ${isChecked ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                                  {col.label}
                                </span>
                                <span className="text-[10px] text-slate-400 block leading-tight">
                                  {col.description}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                                isChecked ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isChecked ? 'Tampil' : 'Sembunyi'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category: Hasil & Analisis */}
                  <div className="pt-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1 flex items-center justify-between">
                      <span>Hasil Analisis & Klasifikasi</span>
                      <span className="text-[9px] font-normal text-slate-400 lowercase">
                        {TABLE_COLUMNS.filter((c) => c.category === 'hasil' && visibleColumns[c.id]).length}/
                        {TABLE_COLUMNS.filter((c) => c.category === 'hasil').length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {TABLE_COLUMNS.filter((c) => c.category === 'hasil').map((col) => {
                        const isChecked = Boolean(visibleColumns[col.id]);
                        return (
                          <label
                            key={col.id}
                            className={`flex items-start justify-between p-1.5 rounded-lg text-xs cursor-pointer transition select-none ${
                              isChecked ? 'bg-slate-50 hover:bg-blue-50/50' : 'hover:bg-slate-100 opacity-60'
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => updateVisibleColumn(col.id, e.target.checked)}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <div>
                                <span className={`font-semibold block text-[11.5px] ${isChecked ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                                  {col.label}
                                </span>
                                <span className="text-[10px] text-slate-400 block leading-tight">
                                  {col.description}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                                isChecked ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isChecked ? 'Tampil' : 'Sembunyi'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category: Operasional / Aksi */}
                  <div className="pt-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1 flex items-center justify-between">
                      <span>Operasional</span>
                      <span className="text-[9px] font-normal text-slate-400 lowercase">
                        {TABLE_COLUMNS.filter((c) => c.category === 'aksi' && visibleColumns[c.id]).length}/
                        {TABLE_COLUMNS.filter((c) => c.category === 'aksi').length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {TABLE_COLUMNS.filter((c) => c.category === 'aksi').map((col) => {
                        const isChecked = Boolean(visibleColumns[col.id]);
                        return (
                          <label
                            key={col.id}
                            className={`flex items-start justify-between p-1.5 rounded-lg text-xs cursor-pointer transition select-none ${
                              isChecked ? 'bg-slate-50 hover:bg-blue-50/50' : 'hover:bg-slate-100 opacity-60'
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => updateVisibleColumn(col.id, e.target.checked)}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <div>
                                <span className={`font-semibold block text-[11.5px] ${isChecked ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                                  {col.label}
                                </span>
                                <span className="text-[10px] text-slate-400 block leading-tight">
                                  {col.description}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                                isChecked ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isChecked ? 'Tampil' : 'Sembunyi'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    <strong>{activeColumnCount}</strong> kolom ditampilkan
                  </span>
                  <button
                    onClick={() => setIsColumnMenuOpen(false)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden Columns Alert Banner */}
        {hiddenColumnsList.length > 0 && (
          <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/90 rounded-lg px-3 py-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 flex-wrap">
              <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">{hiddenColumnsList.length} kolom disembunyikan:</span>
              <span className="text-amber-800">
                {hiddenColumnsList.map((c) => c.shortLabel).join(', ')}
              </span>
            </div>
            <button
              onClick={showAllColumns}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline ml-2 whitespace-nowrap cursor-pointer hover:opacity-80"
              title="Tampilkan kembali seluruh kolom tabel"
            >
              Tampilkan Semua Kolom
            </button>
          </div>
        )}
      </div>

      {/* Selected Items Floating/Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2 font-medium">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>
              <strong>{selectedIds.size}</strong> peserta terpilih dari total {filteredParticipants.length} data.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBatchExportPDF(getSelectedParticipants())}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-2xs transition cursor-pointer"
            >
              Unduh PDF Terpilih ({selectedIds.size})
            </button>
            <button
              onClick={() => onExportExcel(getSelectedParticipants())}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium shadow-2xs transition cursor-pointer"
            >
              Ekspor Excel Terpilih ({selectedIds.size})
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Batal Pilih
            </button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <th className="py-3 px-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={
                    filteredParticipants.length > 0 &&
                    selectedIds.size === filteredParticipants.length
                  }
                  onChange={handleSelectAll}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
              </th>

              {visibleColumns.no && (
                <th className="py-3 px-2 text-center w-8">No</th>
              )}

              {visibleColumns.nomorTes && (
                <th
                  onClick={() => toggleSort('nomorTes')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition select-none w-32"
                >
                  <div className="flex items-center space-x-1">
                    <span>No. Tes</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}

              {visibleColumns.nama && (
                <th
                  onClick={() => toggleSort('nama')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition select-none min-w-[170px]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Nama Peserta</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}

              {visibleColumns.asalSekolah && (
                <th className="py-3 px-3 min-w-[140px]">Asal Sekolah / Institusi</th>
              )}

              {visibleColumns.pendidikan && (
                <th className="py-3 px-3 min-w-[110px]">Pendidikan / Jenjang</th>
              )}

              {visibleColumns.genderAge && (
                <th className="py-3 px-2 text-center w-14">JK / Usia</th>
              )}

              {visibleColumns.tanggalTes && (
                <th className="py-3 px-3 text-center min-w-[95px]">Tanggal Tes</th>
              )}

              {visibleColumns.rawScores && (
                <th className="py-3 px-2 text-center min-w-[200px]">
                  <span title="Raw Score: SE, WA, AN, GE, RA, ZR, FA, WU, ME">Skor Mentah Subtes (RW)</span>
                </th>
              )}

              {visibleColumns.totalSS && (
                <th className="py-3 px-3 text-center w-24">
                  <span title="Total Bobot Skor Standar IST (Standard Weighted)">Total SS</span>
                </th>
              )}

              {visibleColumns.totalIQ && (
                <th
                  onClick={() => toggleSort('totalIQ')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 transition select-none w-24"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>IQ Total</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}

              {visibleColumns.iqCategory && (
                <th className="py-3 px-3 text-center w-36">Kategori IQ</th>
              )}

              {visibleColumns.stream && (
                <th
                  onClick={() => toggleSort('stream')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 transition select-none w-28"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Peminatan</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}

              {visibleColumns.actions && (
                <th className="py-3 px-3 text-center w-40">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredParticipants.length === 0 ? (
              <tr>
                <td colSpan={totalVisibleColSpan} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Tidak ada data peserta yang cocok.</p>
                    <p className="text-xs text-slate-400">
                      Silakan sesuaikan filter pencarian atau gunakan tombol "+ Tambah Peserta".
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold hover:bg-blue-100 transition"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredParticipants.map((p, idx) => {
                const isSelected = selectedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectId(p.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {visibleColumns.no && (
                      <td className="py-3 px-2 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                    )}

                    {visibleColumns.nomorTes && (
                      <td className="py-3 px-3 font-mono font-medium text-slate-800 text-[11px]">
                        {p.nomorTes}
                      </td>
                    )}

                    {visibleColumns.nama && (
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 text-xs">{p.nama}</div>
                      </td>
                    )}

                    {visibleColumns.asalSekolah && (
                      <td className="py-3 px-3 text-slate-700 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <School className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{p.asalSekolahInstitusi || '-'}</span>
                        </div>
                      </td>
                    )}

                    {visibleColumns.pendidikan && (
                      <td className="py-3 px-3 text-slate-700 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {p.pendidikan || '-'}
                        </span>
                      </td>
                    )}

                    {visibleColumns.genderAge && (
                      <td className="py-3 px-2 text-center text-[11px] text-slate-600">
                        <span className="font-medium text-slate-800">{p.jenisKelamin}</span>
                        <span className="text-[10px] text-slate-400 block">{p.usia} thn</span>
                      </td>
                    )}

                    {visibleColumns.tanggalTes && (
                      <td className="py-3 px-3 text-center text-slate-600 text-[11px] font-mono">
                        {p.tanggalTes || '-'}
                      </td>
                    )}

                    {visibleColumns.rawScores && (
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center gap-0.5 bg-slate-100 px-2 py-1 rounded-md text-[9.5px] font-mono text-slate-600">
                          <span title="SE">{p.rawScores.SE}</span>•
                          <span title="WA">{p.rawScores.WA}</span>•
                          <span title="AN">{p.rawScores.AN}</span>•
                          <span title="GE">{p.rawScores.GE}</span>•
                          <span title="RA" className="font-bold text-blue-600">{p.rawScores.RA}</span>•
                          <span title="ZR" className="font-bold text-blue-600">{p.rawScores.ZR}</span>•
                          <span title="FA" className="font-bold text-indigo-600">{p.rawScores.FA}</span>•
                          <span title="WU" className="font-bold text-indigo-600">{p.rawScores.WU}</span>•
                          <span title="ME">{p.rawScores.ME}</span>
                        </div>
                      </td>
                    )}

                    {visibleColumns.totalSS && (
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-semibold text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {p.totalSS} SW
                        </span>
                      </td>
                    )}

                    {visibleColumns.totalIQ && (
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-slate-900 text-white shadow-xs">
                          {p.totalIQ}
                        </span>
                      </td>
                    )}

                    {visibleColumns.iqCategory && (
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-medium ${
                            p.totalIQ >= 130
                              ? 'bg-purple-100 text-purple-800'
                              : p.totalIQ >= 120
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.totalIQ >= 110
                              ? 'bg-blue-100 text-blue-800'
                              : p.totalIQ >= 90
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.iqCategory.split(' (')[0]}
                        </span>
                      </td>
                    )}

                    {visibleColumns.stream && (
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium ${
                            p.streamAnalysis.preference === 'IPA'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : p.streamAnalysis.preference === 'IPS'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {p.streamAnalysis.preference}
                        </span>
                      </td>
                    )}

                    {visibleColumns.actions && (
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onSelectParticipant(p)}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-2xs transition cursor-pointer"
                            title="Lihat & Cetak Laporan PDF"
                          >
                            <FileText className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => onEditParticipant(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                            title="Koreksi data atau skor peserta"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteParticipant(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Hapus peserta ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div>
          {selectedIds.size > 0 ? (
            <span className="text-blue-600 font-medium">
              {selectedIds.size} peserta dipilih dari {filteredParticipants.length} data.
            </span>
          ) : (
            <span>Klik "PDF" untuk melihat laporan perorangan, atau "Unduh PDF Massal" untuk mengunduh semua berkas.</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {selectedIds.size > 0 && (
            <button
              onClick={() => {
                const firstSelected = participants.find((p) => selectedIds.has(p.id));
                if (firstSelected) onSelectParticipant(firstSelected);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Buka Laporan Terpilih ({selectedIds.size})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
