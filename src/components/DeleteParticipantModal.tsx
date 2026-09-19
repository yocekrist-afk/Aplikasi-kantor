import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

export type DeletionType = 'soft' | 'permanent' | 'empty_trash';

interface DeleteParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant?: any | null;
  type: DeletionType;
  trashCount?: number;
  onConfirm: () => Promise<void>;
}

export function DeleteParticipantModal({
  isOpen,
  onClose,
  participant,
  type,
  trashCount = 0,
  onConfirm
}: DeleteParticipantModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset text and error whenever modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setIsDeleting(false);
      setError(null);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const isMatch = confirmText.trim() === 'DELETE';

  const handleExecute = async () => {
    if (!isMatch || isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      console.error('Error during deletion:', err);
      setError(err?.message || 'Terjadi kesalahan saat menghapus data. Silakan coba lagi.');
      setIsDeleting(false);
    }
  };

  const getTitle = () => {
    if (type === 'soft') return 'Pindahkan Peserta ke Tempat Sampah';
    if (type === 'permanent') return 'Hapus Peserta Secara Permanen';
    return 'Kosongkan Tempat Sampah';
  };

  const getConfirmButtonLabel = () => {
    if (isDeleting) return 'Memproses...';
    if (type === 'soft') return 'Pindahkan ke Sampah';
    if (type === 'permanent') return 'Hapus Permanen';
    return `Hapus Semua (${trashCount})`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        onClick={() => {
          if (!isDeleting) onClose();
        }} 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with warning accent */}
        <div className="bg-red-50/80 border-b border-red-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-xs">
              {type === 'soft' ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                {getTitle()}
              </h2>
              <p className="text-xs text-red-600 font-medium">
                Konfirmasi keamanan penghapusan data
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-red-100/50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[calc(85vh-130px)] overflow-y-auto">
          {/* Participant Information Card */}
          {participant && type !== 'empty_trash' && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-center gap-3">
              <img 
                src={participant.avatar || 'https://i.pravatar.cc/100'} 
                alt={participant.nama || 'Peserta'} 
                className="w-11 h-11 rounded-full object-cover border border-gray-300 shrink-0 bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://i.pravatar.cc/100';
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gray-900 truncate">
                  {participant.nama || participant.namaPeserta || 'Tanpa Nama'}
                </div>
                <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  <span>No: <strong className="text-gray-700 font-semibold">{participant.noPeserta || '-'}</strong></span>
                  {participant.nik && (
                    <>
                      <span>•</span>
                      <span>NIK: <strong className="text-gray-700 font-semibold">{participant.nik}</strong></span>
                    </>
                  )}
                </div>
                {participant.eventTitle && (
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">
                    Event: <span className="font-medium text-gray-700">{participant.eventTitle}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty Trash Summary Card */}
          {type === 'empty_trash' && (
            <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-red-600">{trashCount}</div>
              <div className="text-xs font-semibold text-red-800 mt-0.5">
                Peserta di Tempat Sampah yang Akan Dihapus Selamanya
              </div>
            </div>
          )}

          {/* Detailed Impact Explanation */}
          <div className="rounded-xl p-3.5 bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Dampak Tindakan:</span>
            </div>
            {type === 'soft' && (
              <p className="text-amber-800 leading-relaxed">
                Peserta ini akan dipindahkan ke <strong>Tempat Sampah</strong>. Akses login ujian peserta akan dinonaktifkan sementara dan tidak muncul di tabulasi penilaian aktif. Data dan riwayat ujian <strong>tetap aman</strong> dan dapat dipulihkan kapan saja.
              </p>
            )}
            {type === 'permanent' && (
              <p className="text-red-800 leading-relaxed font-medium">
                PERINGATAN: Tindakan ini <strong>tidak dapat dibatalkan</strong>. Semua data profil peserta, akun login ujian, dan seluruh riwayat hasil pengerjaan tes akan <strong>dihapus permanen selamanya</strong> dari server database.
              </p>
            )}
            {type === 'empty_trash' && (
              <p className="text-red-800 leading-relaxed font-medium">
                PERINGATAN TINGKAT TINGGI: Tindakan ini <strong>tidak dapat dibatalkan</strong>. Semua ({trashCount}) peserta di tempat sampah beserta hasil tesnya akan <strong>dimusnahkan permanen</strong> dari server database.
              </p>
            )}
          </div>

          {/* Confirmation Input Section */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-gray-700">
              Untuk mengonfirmasi penghapusan, ketik{' '}
              <span className="inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-mono font-bold text-xs border border-red-200 tracking-wider">
                DELETE
              </span>{' '}
              pada kolom di bawah:
            </label>

            <div className="relative">
              <input
                type="text"
                autoFocus
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isMatch && !isDeleting) {
                    e.preventDefault();
                    handleExecute();
                  }
                }}
                disabled={isDeleting}
                placeholder="Ketik DELETE untuk konfirmasi"
                className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-lg border transition-all focus:outline-none ${
                  isMatch
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 text-gray-900'
                    : confirmText.length > 0
                    ? 'border-amber-400 ring-2 ring-amber-400/20 bg-white text-gray-900'
                    : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-white text-gray-900'
                }`}
              />

              {isMatch && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Validation Feedback Status */}
            <div className="text-[11px] min-h-[18px]">
              {isMatch ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  ✓ Kata kunci terverifikasi. Tombol konfirmasi telah diaktifkan.
                </span>
              ) : confirmText.length > 0 ? (
                <span className="text-amber-700 font-medium">
                  Teks belum cocok. Harap ketik persis <strong>DELETE</strong> (huruf kapital).
                </span>
              ) : (
                <span className="text-gray-400">
                  Ketik <strong>DELETE</strong> untuk membuka proteksi tombol konfirmasi.
                </span>
              )}
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="p-3 bg-red-100/80 border border-red-300 rounded-lg text-xs text-red-800 font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={!isMatch || isDeleting}
            className={`flex items-center justify-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-150 ${
              isMatch && !isDeleting
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow cursor-pointer'
                : 'bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{getConfirmButtonLabel()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
