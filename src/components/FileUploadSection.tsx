import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Check,
  AlertCircle,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Participant } from '../types/ist';
import { downloadExcelTemplate, parseUploadedFile, INITIAL_SAMPLE_PARTICIPANTS } from '../utils/sampleData';

interface FileUploadSectionProps {
  onDataLoaded: (participants: Participant[]) => void;
  onAppendData: (participants: Participant[]) => void;
  totalParticipants: number;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onDataLoaded,
  onAppendData,
  totalParticipants,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMessage('Format file tidak didukung. Harap unggah file .xlsx atau .csv.');
      setIsLoading(false);
      return;
    }

    try {
      const parsed = await parseUploadedFile(file);
      onDataLoaded(parsed);
      setSuccessMessage(`Berhasil memuat ${parsed.length} data peserta dari file "${file.name}".`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses file Excel.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleLoadSample = async () => {
    onDataLoaded(INITIAL_SAMPLE_PARTICIPANTS);
    setSuccessMessage(`Berhasil memuat ${INITIAL_SAMPLE_PARTICIPANTS.length} data contoh peserta IST.`);
    setErrorMessage(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" />
            Unggah Data Massal Hasil Tes IST
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah file Excel (.xlsx) atau CSV berisi identitas demografi dan 9 kolom Raw Score (RW) subtes IST.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => downloadExcelTemplate('xlsx')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition cursor-pointer"
            title="Download Template Format Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh Template .xlsx</span>
          </button>

          <button
            onClick={() => downloadExcelTemplate('csv')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition cursor-pointer"
            title="Download Template Format CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh Template .csv</span>
          </button>

          <button
            onClick={handleLoadSample}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-medium transition cursor-pointer"
            title="Muat contoh data simulasi"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Muat Data Contoh Demo</span>
          </button>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-600 bg-blue-50/70'
            : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileProcess(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            )}
          </div>

          <div>
            <span className="font-semibold text-slate-900 text-sm">
              {isLoading ? 'Sedang memproses berkas...' : 'Klik untuk pilih file atau seret & lepas di sini'}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Mendukung file berekstensi <span className="font-mono text-slate-700 font-medium">.xlsx</span> atau{' '}
              <span className="font-mono text-slate-700 font-medium">.csv</span>
            </p>
          </div>

          {/* Subtest indicators */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-500">
            <span className="font-medium text-slate-600">Kolom 9 Subtes Wajib:</span>
            {['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'].map((sub) => (
              <span key={sub} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono font-semibold text-[10px]">
                {sub}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Information strip */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Data saat ini: <strong className="text-slate-800">{totalParticipants} Peserta</strong> terdaftar dalam sistem.
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          *Skor mentah (RW) otomatis dikonversi ke Standar Score, IQ Total, Persentil, dan Rekomendasi Studi.
        </span>
      </div>
    </div>
  );
};
