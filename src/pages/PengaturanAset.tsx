import React, { useRef, useState } from 'react';
import { useAsset } from '../contexts/AssetContext';
import { Upload, Trash2, Save, Image as ImageIcon, Loader2 } from 'lucide-react';

const ASSET_ITEMS = [
  { path: '/assets/ist/subtes7_options_part1.webp', label: 'Subtes 7 - Acuan Pilihan Bagian 1' },
  { path: '/assets/ist/subtes7_options_part2.webp', label: 'Subtes 7 - Acuan Pilihan Bagian 2' },
  { path: '/assets/ist/subtes7_tutorial_reference.webp', label: 'Subtes 7 - Acuan Tutorial' },
  { path: '/assets/ist/subtes8_reference_cubes.webp', label: 'Subtes 8 - 5 Kubus Acuan Utama' },
  { path: '/assets/ist/subtes8_opt_a.webp', label: 'Subtes 8 - Kubus Pilihan A' },
  { path: '/assets/ist/subtes8_opt_b.webp', label: 'Subtes 8 - Kubus Pilihan B' },
  { path: '/assets/ist/subtes8_opt_c.webp', label: 'Subtes 8 - Kubus Pilihan C' },
  { path: '/assets/ist/subtes8_opt_d.webp', label: 'Subtes 8 - Kubus Pilihan D' },
  { path: '/assets/ist/subtes8_opt_e.webp', label: 'Subtes 8 - Kubus Pilihan E' }
];

export function PengaturanAset() {
  const { customAssets, updateAsset, resetAsset, isLoading } = useAsset();
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [resettingPath, setResettingPath] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetPath, setTargetPath] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetPath) return;

    setUploadingFor(targetPath);
    try {
      const base64 = await convertFileToBase64(file);
      await updateAsset(targetPath, base64);
    } catch (error) {
      console.error(error);
      alert('Gagal mengunggah gambar. Pastikan ukuran file tidak terlalu besar.');
    } finally {
      setUploadingFor(null);
      setTargetPath('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const onSelectUpload = (path: string) => {
    setTargetPath(path);
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Memuat pengaturan aset...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Aset Visual</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola dan ganti gambar-gambar acuan soal secara dinamis tanpa mengubah file sistem.</p>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-700">Daftar Aset Kustom</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {ASSET_ITEMS.map((item) => {
            const hasCustom = !!customAssets[item.path];
            const currentSrc = customAssets[item.path] || item.path;

            return (
              <div key={item.path} className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 space-y-1">
                  <h3 className="font-medium text-slate-800">{item.label}</h3>
                  <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded inline-block">{item.path}</p>
                  
                  <div className="mt-2 flex items-center gap-2">
                    {hasCustom ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        <CheckIcon className="w-3 h-3" />
                        Kustom
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        Bawaan Sistem
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-48 h-32 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center relative group shrink-0">
                  <div className="absolute inset-0 bg-slate-900/10 mix-blend-multiply pointer-events-none"></div>
                  <img src={currentSrc} alt={item.label} className="max-w-full max-h-full object-contain p-2" />
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => onSelectUpload(item.path)}
                    disabled={uploadingFor === item.path || resettingPath === item.path}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingFor === item.path ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Ganti Gambar</span>
                      </>
                    )}
                  </button>
                  
                  {hasCustom && (
                    <button
                      onClick={async () => {
                        setResettingPath(item.path);
                        try {
                          await resetAsset(item.path);
                        } finally {
                          setResettingPath(null);
                        }
                      }}
                      disabled={uploadingFor === item.path || resettingPath === item.path}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {resettingPath === item.path ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mereset...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Hapus Kustom</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
