import { confirmAction } from '../utils/confirmAction';
import React, { useState } from 'react';
import {
  X,
  Building2,
  UserCheck,
  FileCheck,
  RotateCcw,
  Save,
  Check,
  Sparkles,
  Palette,
  Loader2,
} from 'lucide-react';
import { AppSettings, DEFAULT_APP_SETTINGS, REPORT_THEMES, ReportThemeId } from '../types/settings';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await Promise.resolve(onSave(formData));
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 600);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (await confirmAction('Kembalikan pengaturan identitas lembaga dan psikolog ke format bawaan?')) {
      setFormData({ ...DEFAULT_APP_SETTINGS });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Pengaturan Lembaga & Psikolog
              </h2>
              <p className="text-xs text-slate-300">
                Kustomisasi kop surat, legalitas pemeriksa, dan format laporan psikotes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-slate-700">
          
          {/* Section 1: Profil Lembaga / Biro */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-sm">
                Profil Lembaga / Biro Psikologi
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lembaga / Biro Psikologi
                </label>
                <input
                  type="text"
                  required
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  placeholder="Contoh: Biro Layanan Psikologi Terapan Insan Cendekia"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ditampilkan pada bagian atas kop surat laporan Halaman 1 & 2.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagline / Keterangan Lembaga
                  </label>
                  <input
                    type="text"
                    value={formData.institutionTagline}
                    onChange={(e) => setFormData({ ...formData, institutionTagline: e.target.value })}
                    placeholder="Contoh: Standar Baku Norma IST-70 • Terakreditasi HIMPSI"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kota Penerbitan Laporan
                  </label>
                  <input
                    type="text"
                    value={formData.institutionCity}
                    onChange={(e) => setFormData({ ...formData, institutionCity: e.target.value })}
                    placeholder="Contoh: Jakarta, Bandung, Surabaya"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Profil Psikolog Penanggung Jawab */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-sm">
                Psikolog Penanggung Jawab & Asesor
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Beserta Gelar
                </label>
                <input
                  type="text"
                  required
                  value={formData.psychologistName}
                  onChange={(e) => setFormData({ ...formData, psychologistName: e.target.value })}
                  placeholder="Contoh: Dra. R. Wahyuningrum, M.Psi., Psikolog"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan / Peran
                  </label>
                  <input
                    type="text"
                    value={formData.psychologistTitle}
                    onChange={(e) => setFormData({ ...formData, psychologistTitle: e.target.value })}
                    placeholder="Contoh: Psikolog Penanggung Jawab / Asesor Utama"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor SIPP / SIKIP / STR
                  </label>
                  <input
                    type="text"
                    value={formData.psychologistSipp}
                    onChange={(e) => setFormData({ ...formData, psychologistSipp: e.target.value })}
                    placeholder="Contoh: SIPP: 19840315-200902-2-004"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Format Laporan & Validasi */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-sm">
                Format Laporan & Otentikasi
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sub-Judul Dokumen Laporan
                </label>
                <input
                  type="text"
                  value={formData.reportSubtitle}
                  onChange={(e) => setFormData({ ...formData, reportSubtitle: e.target.value })}
                  placeholder="Contoh: Intelligenz Struktur Test (IST-70) • Profil Bakat & Kognitif"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="enableStamp"
                  checked={formData.enableSignatureStamp}
                  onChange={(e) => setFormData({ ...formData, enableSignatureStamp: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="enableStamp" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Tampilkan Segel / Stempel Otentikasi Psikometri pada lembar legalitas Halaman 2
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Tema Warna Dokumen Laporan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Tema Warna Dokumen Laporan IST
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Pilih palet warna resmi untuk PDF &amp; HTML
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(Object.keys(REPORT_THEMES) as ReportThemeId[]).map((themeKey) => {
                const themeItem = REPORT_THEMES[themeKey];
                const isSelected = (formData.reportTheme || 'navy') === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setFormData({ ...formData, reportTheme: themeKey })}
                    className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center -space-x-1.5">
                          {themeItem.previewColors.map((color, i) => (
                            <span
                              key={i}
                              className="w-4 h-4 rounded-full border border-white shadow-xs"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs text-slate-900 mb-0.5">
                        {themeItem.name}
                      </div>
                      <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-tight">
                        {themeItem.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: themeItem.primaryDark }}
                      />
                      <span className="text-[10px] font-mono text-slate-600">
                        {themeItem.primaryDark}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Bawaan</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaved || isSaving}
                className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer disabled:opacity-80"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Menyimpan...' : isSaved ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
