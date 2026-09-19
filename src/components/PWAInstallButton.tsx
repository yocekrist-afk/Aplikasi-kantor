import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Monitor, Smartphone, CheckCircle, ExternalLink, Info, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Jika sudah terinstal sebagai aplikasi mandiri
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg">
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        <span>Aplikasi Sudah Terpasang di Perangkat Ini</span>
      </div>
    );
  }

  // Jika browser mendukung pemicu instalasi otomatis langsung (Chromium/Android)
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-2 bg-[#8BC34A] hover:bg-[#7cb342] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer"
        title="Instal Aplikasi Sekarang"
      >
        <Download className="w-4 h-4" />
        <span>Instal Aplikasi Sekarang</span>
      </button>
    );
  }

  // Fallback tombol dengan panduan visual untuk Desktop/Mobile
  return (
    <>
      <button
        onClick={() => setShowGuideModal(true)}
        className="inline-flex items-center gap-2 bg-[#8BC34A] hover:bg-[#7cb342] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer"
        title="Petunjuk Pasang Aplikasi"
      >
        <Download className="w-4 h-4" />
        <span>Pasang ke Laptop / PC / HP</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#8BC34A]/10 text-[#8BC34A] rounded-lg">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Cara Memasang Aplikasi (PWA)</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Jalankan seperti program Windows / Mac / HP mandiri</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              {/* Petunjuk Desktop */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100 mb-2">
                  <Monitor className="w-4 h-4 text-[#8BC34A]" />
                  <span>Di Laptop / PC (Google Chrome atau Microsoft Edge):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-gray-600 dark:text-gray-300">
                  <li>
                    Lihat <strong>bilah alamat URL</strong> (tempat mengetik link web di atas).
                  </li>
                  <li>
                    Di sebelah kanan ikon bintang (Bookmark), klik ikon <strong>Instal / Monitor Komputer</strong> atau simbol <strong>+</strong>.
                  </li>
                  <li>
                    Atau klik menu titik tiga (<strong>⋮</strong>) di pojok kanan atas browser &gt; pilih <strong>Simpan dan bagikan</strong> &gt; klik <strong>Instal Perspective...</strong>
                  </li>
                </ol>
              </div>

              {/* Petunjuk Mobile */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100 mb-2">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span>Di HP / Tablet (Android atau iOS):</span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  <li>
                    <strong>Android (Chrome):</strong> Tekan menu titik tiga (⋮) di kanan atas &gt; pilih <strong>Instal aplikasi</strong> atau <em>Tambahkan ke Layar Utama</em>.
                  </li>
                  <li>
                    <strong>iPhone/iPad (Safari):</strong> Tekan tombol <strong>Share</strong> (kotak dengan panah ke atas) &gt; geser ke bawah dan pilih <strong>Tambahkan ke Layar Utama</strong>.
                  </li>
                </ul>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800 text-xs">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Tips:</strong> Jika saat ini Anda sedang membuka melalui tampilan pratinjau (iframe), pastikan membuka web ini di tab baru terlebih dahulu agar browser dapat menampilkan tombol instalasi bawaan.
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => {
                  window.open(window.location.href, '_blank');
                  setShowGuideModal(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Tab Baru</span>
              </button>

              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
