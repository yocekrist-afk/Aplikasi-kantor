import React, { useState } from 'react';
import { Clock, Save, Info, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function PengaturanDurasi() {
  const { data: pengaturanRaw } = useFirestore('app_settings');
  const durasiSettings = pengaturanRaw.find((s: any) => s.id === 'durasi_tes') || {};

  const defaultIst = [
    { id: 'ist_1', label: 'IST - Subtest 1 (SE)', soal: 20, waktu: 6 },
    { id: 'ist_2', label: 'IST - Subtest 2 (WA)', soal: 20, waktu: 6 },
    { id: 'ist_3', label: 'IST - Subtest 3 (AN)', soal: 20, waktu: 7 },
    { id: 'ist_4', label: 'IST - Subtest 4 (GE)', soal: 16, waktu: 8 },
    { id: 'ist_5', label: 'IST - Subtest 5 (RA)', soal: 20, waktu: 10 },
    { id: 'ist_6', label: 'IST - Subtest 6 (ZR)', soal: 20, waktu: 10 },
    { id: 'ist_7', label: 'IST - Subtest 7 (FA)', soal: 20, waktu: 7 },
    { id: 'ist_8', label: 'IST - Subtest 8 (WU)', soal: 20, waktu: 9 },
    { id: 'ist_9', label: 'IST - Subtest 9 (ME)', soal: 20, waktu: 9 }
  ];

  const defaultOthers = [
    { id: 'papi_kostick', label: 'Papi Kostick', soal: 90, waktu: 45 },
    { id: 'sikap_kerja', label: 'Sikap Kerja (Kraepelin)', soal: 40, waktu: 20 },
    { id: 'kecerdasan', label: 'Kecerdasan Majemuk', soal: 50, waktu: 30 },
    { id: 'gaya_belajar', label: 'Gaya Belajar', soal: 30, waktu: 20 },
    { id: 'rmib', label: 'RMIB', soal: 9, waktu: 20 },
  ];

  const [formData, setFormData] = useState(() => {
    const state: any = {};
    defaultIst.forEach(item => {
      state[`${item.id}_soal`] = durasiSettings[`${item.id}_soal`] ?? item.soal;
      state[`${item.id}_waktu`] = durasiSettings[`${item.id}_waktu`] ?? item.waktu;
    });
    defaultOthers.forEach(item => {
      state[`${item.id}_soal`] = durasiSettings[`${item.id}_soal`] ?? item.soal;
      state[`${item.id}_waktu`] = durasiSettings[`${item.id}_waktu`] ?? item.waktu;
    });
    return state;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [istExpanded, setIstExpanded] = useState(true);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'app_settings', 'durasi_tes'), formData, { merge: true });
      alert('Pengaturan durasi berhasil disimpan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Clock className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pengaturan Durasi Tes</h2>
          <p className="text-gray-500 text-sm">Atur batas waktu dan jumlah soal spesifik untuk setiap subtes.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start space-x-3 text-sm text-blue-800">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <strong>Catatan Penting:</strong> Perubahan durasi ini akan langsung berpengaruh (tersinkronisasi) ke timer yang berjalan di aplikasi peserta (Participant Portal) untuk sesi tes yang baru dimulai.
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header Table */}
        <div className="grid grid-cols-12 gap-4 bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold uppercase text-xs px-6 py-4">
           <div className="col-span-6">Alat Tes / Subtes</div>
           <div className="col-span-3">Jumlah Soal</div>
           <div className="col-span-3">Durasi (Menit)</div>
        </div>

        {/* IST Section */}
        <div className="border-b border-gray-100">
          <div 
            className="flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 cursor-pointer"
            onClick={() => setIstExpanded(!istExpanded)}
          >
            <div className="font-bold text-gray-900 flex items-center">
              <span>Intelegensi (IST)</span>
              <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">9 Subtes</span>
            </div>
            {istExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </div>
          
          {istExpanded && (
            <div className="bg-gray-50/50 divide-y divide-gray-100">
              {defaultIst.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center px-6 py-3 pl-10">
                  <div className="col-span-6 font-medium text-gray-700 text-sm">{item.label}</div>
                  <div className="col-span-3">
                    <input 
                      type="number" 
                      name={`${item.id}_soal`}
                      value={formData[`${item.id}_soal`]} 
                      onChange={handleChange}
                      className="w-full max-w-[120px] border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <div className="relative max-w-[120px]">
                      <input 
                        type="number" 
                        name={`${item.id}_waktu`}
                        value={formData[`${item.id}_waktu`]} 
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md pl-3 pr-10 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-xs">Mnt</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Others Section */}
        <div className="divide-y divide-gray-100">
          {defaultOthers.map(item => (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-gray-50/50">
              <div className="col-span-6 font-medium text-gray-900">{item.label}</div>
              <div className="col-span-3">
                <input 
                  type="number" 
                  name={`${item.id}_soal`}
                  value={formData[`${item.id}_soal`]} 
                  onChange={handleChange}
                  className="w-full max-w-[120px] border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="col-span-3">
                <div className="relative max-w-[120px]">
                  <input 
                    type="number" 
                    name={`${item.id}_waktu`}
                    value={formData[`${item.id}_waktu`]} 
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md pl-3 pr-10 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-xs">Mnt</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="p-6 bg-gray-50 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
