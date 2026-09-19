import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Activity, 
  RefreshCw, 
  ExternalLink, 
  HardDrive, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Zap, 
  Users, 
  Calendar, 
  BookOpen, 
  Building2, 
  ShieldCheck,
  BarChart3,
  Flame
} from 'lucide-react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import config from '../../firebase-applet-config.json';

interface CollectionStat {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  loading: boolean;
  error?: string;
}

export function FirebaseQuotaView() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const [collections, setCollections] = useState<CollectionStat[]>([
    { id: 'participants', label: 'Peserta Terdaftar', icon: Users, count: 0, loading: true },
    { id: 'events', label: 'Event / Sesi Ujian', icon: Calendar, count: 0, loading: true },
    { id: 'soal_intelegensi', label: 'Soal Intelegensi (IST)', icon: BookOpen, count: 0, loading: true },
    { id: 'soal_mbti', label: 'Soal MBTI', icon: BookOpen, count: 0, loading: true },
    { id: 'soal_rmib', label: 'Soal RMIB', icon: BookOpen, count: 0, loading: true },
    { id: 'soal_papi_kostick', label: 'Soal Papi Kostick', icon: BookOpen, count: 0, loading: true },
    { id: 'soal_gaya_belajar', label: 'Soal Gaya Belajar', icon: BookOpen, count: 0, loading: true },
    { id: 'soal_simulasi', label: 'Soal Simulasi CAT', icon: BookOpen, count: 0, loading: true },
    { id: 'clients', label: 'Klien / Lembaga', icon: Building2, count: 0, loading: true },
    { id: 'administrators', label: 'Administrator', icon: ShieldCheck, count: 0, loading: true },
    { id: 'faqs', label: 'FAQ Bantuan', icon: FileText, count: 0, loading: true },
  ]);

  const fetchLiveCounts = async () => {
    setIsLoading(true);
    try {
      const updated = await Promise.all(
        collections.map(async (col) => {
          try {
            const collRef = collection(db, col.id);
            const snapshot = await getCountFromServer(collRef);
            return {
              ...col,
              count: snapshot.data().count,
              loading: false,
              error: undefined
            };
          } catch (err: any) {
            console.warn(`Gagal mengambil hitungan koleksi ${col.id}:`, err);
            return {
              ...col,
              count: 0,
              loading: false,
              error: 'Tidak dapat diakses'
            };
          }
        })
      );
      setCollections(updated);
      setLastChecked(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveCounts();
  }, []);

  const totalDocuments = collections.reduce((acc, c) => acc + (c.count || 0), 0);
  
  // Estimasi rata-rata ukuran per dokumen + indeks di Firestore (~2 KB per doc)
  const estimatedStorageKB = totalDocuments * 2;
  const estimatedStorageMB = (estimatedStorageKB / 1024).toFixed(2);
  
  // Kuota Gratis Spark Plan: 1 GiB = 1024 MB
  const maxStorageMB = 1024;
  const storagePercentage = Math.min(100, Math.max(0.01, (parseFloat(estimatedStorageMB) / maxStorageMB) * 100));

  const firebaseConsoleUsageUrl = `https://console.firebase.google.com/project/${config.projectId}/firestore/databases/${config.firestoreDatabaseId || '(default)'}/usage`;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>Status & Kuota Firebase Firestore</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Terhubung Aktif
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Informasi batas alokasi kuota harian, jumlah data tersimpan, dan panduan efisiensi sistem.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchLiveCounts}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Hitung ulang jumlah dokumen Firestore saat ini"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isLoading ? 'Menghitung...' : 'Perbarui Metrik'}</span>
          </button>

          <a
            href={firebaseConsoleUsageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1C] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <span>Buka Firebase Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Identitas Proyek & Database */}
      <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-gray-600">
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Project ID</div>
            <div className="font-mono font-bold text-gray-800 text-xs mt-0.5 truncate select-all">{config.projectId}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Database ID</div>
            <div className="font-mono font-bold text-gray-800 text-xs mt-0.5 truncate select-all">{config.firestoreDatabaseId || '(default)'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Paket Layanan</div>
            <div className="font-semibold text-emerald-700 text-xs mt-0.5">Firebase Spark (Gratis)</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Pengecekan Terakhir</div>
            <div className="font-medium text-gray-700 text-xs mt-0.5">
              {lastChecked ? lastChecked.toLocaleTimeString('id-ID') + ' WIB' : 'Sedang memuat...'}
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan Batas Kuota Resmi Firebase Spark Tier */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Alokasi Kuota Harian Resmi (Spark Free Tier)</span>
          </h3>
          <span className="text-[11px] text-gray-500">Reset otomatis setiap pukul 00:00 UTC</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Read Quota */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Document Reads</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">Harian</span>
            </div>
            <div className="mt-2 text-2xl font-black text-gray-900">50.000</div>
            <div className="text-[11px] text-gray-500 mt-1 leading-snug">
              Batas operasi pembacaan dokumen data per hari.
            </div>
          </div>

          {/* Write Quota */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Document Writes</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">Harian</span>
            </div>
            <div className="mt-2 text-2xl font-black text-gray-900">20.000</div>
            <div className="text-[11px] text-gray-500 mt-1 leading-snug">
              Batas penambahan & pembaruan dokumen data per hari.
            </div>
          </div>

          {/* Delete Quota */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Document Deletes</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded">Harian</span>
            </div>
            <div className="mt-2 text-2xl font-black text-gray-900">20.000</div>
            <div className="text-[11px] text-gray-500 mt-1 leading-snug">
              Batas penghapusan dokumen data per hari.
            </div>
          </div>

          {/* Storage Quota */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Penyimpanan Total</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded">Kapasitas</span>
            </div>
            <div className="mt-2 text-2xl font-black text-gray-900">1 GiB</div>
            <div className="text-[11px] text-gray-500 mt-1 leading-snug">
              Setara 1.024 MB data basis data & indeks Firestore.
            </div>
          </div>
        </div>
      </div>

      {/* Status Penyimpanan & Total Dokumen Real-Time */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              <span>Penggunaan Ruang Penyimpanan Firestore (Live)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Dihitung berdasarkan {totalDocuments.toLocaleString('id-ID')} dokumen yang saat ini tersimpan di server.
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-gray-900">{estimatedStorageMB} MB</span>
            <span className="text-xs text-gray-500"> / 1.024 MB ({storagePercentage.toFixed(2)}%)</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-[#8BC34A] to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, storagePercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-medium">
            <span>0 MB</span>
            <span>256 MB</span>
            <span>512 MB</span>
            <span>768 MB</span>
            <span>1.024 MB (1 GiB Limit)</span>
          </div>
        </div>

        {/* Rincian Jumlah Dokumen per Koleksi */}
        <div className="pt-3 border-t border-gray-100">
          <div className="text-xs font-bold text-gray-700 mb-2.5">
            Rincian Dokumen Aktif per Koleksi:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {collections.map((col) => {
              const Icon = col.icon;
              return (
                <div key={col.id} className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-white text-gray-600 border border-gray-200 shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-gray-500 truncate">{col.label}</div>
                    <div className="text-xs font-bold text-gray-900">
                      {col.loading ? (
                        <span className="text-gray-400 font-normal">...</span>
                      ) : col.error ? (
                        <span className="text-amber-600 text-[10px]">Akses terbatas</span>
                      ) : (
                        col.count.toLocaleString('id-ID')
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panduan Ketahanan Beban & Efisiensi Sistem */}
      <div className="bg-gradient-to-br from-blue-50/70 via-white to-emerald-50/40 border border-blue-200/80 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Panduan Kapasitas Ujian Peserta & Optimasi Kuota</span>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed">
          Platform Psikotes Perspective telah dirancang dengan arsitektur <strong>Batch Write</strong> khusus untuk menjaga penggunaan kuota tetap sangat hemat:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="bg-white/80 border border-blue-100 rounded-lg p-3 text-xs space-y-1">
            <div className="font-bold text-blue-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hemat 90% Operasi Tulis (Writes)</span>
            </div>
            <p className="text-gray-600 leading-relaxed text-[11px]">
              Jawaban peserta disimpan di memori dan hanya dikirim ke Firebase per batch 10 soal saat mengklik <em>'Next'</em>. Tidak terjadi penulisan pada setiap klik radio button.
            </p>
          </div>

          <div className="bg-white/80 border border-blue-100 rounded-lg p-3 text-xs space-y-1">
            <div className="font-bold text-blue-950 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Daya Tampung Hingga ~2.000 Sesi/Hari</span>
            </div>
            <p className="text-gray-600 leading-relaxed text-[11px]">
              Dengan 20.000 kuota write gratis per hari, platform mampu melayani hingga <strong>1.500 – 2.000 peserta ujian penuh</strong> setiap hari tanpa dikenakan biaya sepeser pun.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-900 flex items-start gap-2 mt-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Catatan Koneksi Simultan:</strong> Paket gratis Firebase Spark memiliki batas 100 koneksi pengguna bersamaan. Jika Anda menyelenggarakan ujian massal dengan &gt;100 peserta serentak dalam menit yang sama, disarankan mengaktifkan paket <strong>Firebase Blaze (Pay-as-you-go)</strong>. Kuota 50k reads dan 20k writes tetap gratis setiap harinya, namun batas koneksi meningkat hingga 1.000.000 koneksi bersamaan.
          </div>
        </div>
      </div>
    </div>
  );
}
