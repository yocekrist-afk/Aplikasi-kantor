import { confirmAction } from '../utils/confirmAction';
import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/layout/DataTable';
import { Modal } from '../components/layout/Modal';
import { Trash2, ImageIcon, Upload, X, Loader2, Database, Sparkles, MonitorPlay } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { Subtest4GeEvaluatorModal } from '../components/Subtest4GeEvaluatorModal';
import { ParticipantSimulationModal, SimulationConfig } from '../components/ParticipantSimulationModal';
import { TestEngine } from './participant/TestEngine';
import { Subtest9Flow } from './participant/Subtest9Flow';

const SUBTESTS = [
  { id: '1', name: 'Subtest 1 (SE) - Melengkapi Kalimat' },
  { id: '2', name: 'Subtest 2 (WA) - Mencari Kata Berbeda' },
  { id: '3', name: 'Subtest 3 (AN) - Analogi Kata' },
  { id: '4', name: 'Subtest 4 (GE) - Persamaan Kata' },
  { id: '5', name: 'Subtest 5 (RA) - Aritmatika' },
  { id: '6', name: 'Subtest 6 (ZR) - Deret Angka' },
  { id: '7', name: 'Subtest 7 (FA) - Melengkapi Bentuk' },
  { id: '8', name: 'Subtest 8 (WU) - Memutar Kubus' },
  { id: '9', name: 'Subtest 9 (ME) - Mengingat Kata' },
];

interface SoalIntelegensiProps {
  initialSubtest?: string;
  onSubtestChange?: (subtest: string) => void;
}

export function SoalIntelegensi({ initialSubtest = 'all', onSubtestChange }: SoalIntelegensiProps = {}) {
  const { data: soals, addData, updateData, deleteData } = useFirestore('soal_intelegensi');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeEvaluatorOpen, setIsGeEvaluatorOpen] = useState(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [activeSimulationConfig, setActiveSimulationConfig] = useState<SimulationConfig | null>(null);
  const [selectedSubtest, setSelectedSubtest] = useState<string>(initialSubtest);

  useEffect(() => {
    if (initialSubtest !== undefined) {
      setSelectedSubtest(initialSubtest);
    }
  }, [initialSubtest]);

  const handleSubtestSelect = async (subtestId: string) => {
    setSelectedSubtest(subtestId);
    onSubtestChange?.(subtestId);
  };
  const [formData, setFormData] = useState({ 
    id: '', no: '', subtest: '1', jenisSoal: 'PG', gambarSoal: '', soal: '', pilihan: ['', ''], jawaban: '' 
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isPilihan?: boolean, pilihanIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileRef = ref(storage, `soal_intelegensi/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      if (isPilihan && pilihanIndex !== undefined) {
        const newChoices = [...formData.pilihan];
        newChoices[pilihanIndex] = url;
        setFormData({ ...formData, pilihan: newChoices });
      } else {
        setFormData({ ...formData, gambarSoal: url });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Gagal mengupload gambar');
    } finally {
      setIsUploading(false);
      // Reset input value so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const columns = [
    { key: 'no', label: 'NO', render: (val: string, row: any) => <div className="font-bold text-center">{val}</div> },
    { 
      key: 'jenisSoal', 
      label: 'JENIS SOAL', 
      render: (val: string) => {
        const initial = val ? val.charAt(0).toUpperCase() : '-';
        let bgColor = 'bg-gray-500';
        if (val === 'SIMBOL') bgColor = 'bg-[#673AB7]';
        else if (val === 'PILIHAN GANDA' || val === 'PG' || val === 'PG_GAMBAR') bgColor = 'bg-blue-600';
        else if (val === 'ESAI' || val === 'ESAI DENGAN NILAI' || val === 'ISIAN') bgColor = 'bg-amber-600';
        else if (val === 'MATEMATIKA') bgColor = 'bg-emerald-600';
        return (
          <div className="flex justify-center">
            <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold ${bgColor}`}>
              {initial}
            </div>
          </div>
        );
      } 
    },
    { key: 'subtest', label: 'SUBTEST', render: (val: string) => <div className="whitespace-nowrap text-center">Subtest {val}</div> },
    { 
      key: 'soal', 
      label: 'SOAL', 
      className: 'min-w-[250px] whitespace-normal leading-relaxed text-center', 
      render: (val: string, row: any) => (
        <div className="flex flex-col items-center justify-center space-y-2">
          {row.gambarSoal && <img src={row.gambarSoal} alt="Soal" className="max-h-16 object-contain rounded border border-gray-200" />}
          {val && <div>{val}</div>}
        </div>
      ) 
    },
    { 
      key: 'jawaban', 
      label: 'JAWABAN', 
      render: (val: string) => (
        <div className="flex justify-center">
          {val && val.length === 1 ? (
             <div className="w-7 h-7 rounded-full bg-slate-500 text-white flex items-center justify-center text-xs font-bold">
               {val}
             </div>
          ) : (
             <span className="font-bold text-slate-600">{val}</span>
          )}
        </div>
      ) 
    },
  ];

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.jenisSoal) {
        alert('Mohon pilih Jenis Soal terlebih dahulu.');
        return;
      }
      if (!formData.no || formData.no.trim() === '') {
        alert('Mohon isi Nomor Soal.');
        return;
      }
      if (!formData.soal.trim() && !formData.gambarSoal) {
        alert('Mohon isi teks Pertanyaan/Pernyataan atau unggah Gambar Soal.');
        return;
      }
      
      const requiresPilihan = ['PILIHAN GANDA', 'SIMBOL', 'PG_GAMBAR', 'PG'].includes(formData.jenisSoal);
      if (requiresPilihan) {
        if (!formData.pilihan || formData.pilihan.length === 0) {
          alert('Mohon tambahkan minimal satu pilihan jawaban.');
          return;
        }
        const hasEmptyChoice = formData.pilihan.some(p => !p || p.trim() === '');
        if (hasEmptyChoice) {
          alert('Terdapat pilihan jawaban yang masih kosong. Mohon isi atau hapus pilihan tersebut.');
          return;
        }
      }

      if (!formData.jawaban || formData.jawaban.trim() === '') {
        alert('Mohon isi Kunci Jawaban Benar.');
        return;
      }

      setIsSaving(true);
      const payload = {
        no: formData.no,
        subtest: formData.subtest,
        jenisSoal: formData.jenisSoal,
        gambarSoal: formData.gambarSoal,
        soal: formData.soal,
        pilihan: ['ESAI', 'ESAI DENGAN NILAI', 'MATEMATIKA', 'ISIAN'].includes(formData.jenisSoal) ? [] : formData.pilihan,
        jawaban: formData.jawaban
      };

      if (!formData.id) {
        await addData(payload);
      } else {
        await updateData(formData.id, payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan soal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (row: any) => {
    if (await confirmAction(`Hapus soal ini?`)) {
      try {
        await deleteData(row.id);
      } catch (error) {
        console.error(error);
        alert('Gagal menghapus soal');
      }
    }
  };

  const handleEdit = async (row: any) => {
    setFormData({
      id: row.id,
      no: row.no || '',
      subtest: row.subtest || '1',
      jenisSoal: row.jenisSoal || 'PG',
      gambarSoal: row.gambarSoal || '',
      soal: row.soal || '',
      pilihan: row.pilihan || ['', ''],
      jawaban: row.jawaban || ''
    });
    setIsModalOpen(true);
  };

  // Basic dummy data if Firestore is empty to show the structure
  const rawData = soals.length > 0 ? soals : [
    { id: 'dummy1', no: '01', subtest: '1', jenisSoal: 'PG', soal: 'Pengaruh seseorang terhadap orang lain seharusnya bergantung pada...', pilihan: ['kekuasaan', 'bujukan', 'kekayaan', 'keberanian', 'kewibawaan'], jawaban: 'E' },
    { id: 'dummy2', no: '61', subtest: '4', jenisSoal: 'ISIAN', soal: 'mawar - melati', pilihan: [], jawaban: 'bunga' },
    { id: 'dummy3', no: '97', subtest: '6', jenisSoal: 'ISIAN', soal: '6  9  12  15  18  21  24  ?', pilihan: [], jawaban: '27' },
  ];

  const filteredData = (selectedSubtest === 'all'
    ? rawData
    : rawData.filter(d => String(d.subtest) === selectedSubtest)
  ).sort((a,b) => Number(a.subtest) - Number(b.subtest) || Number(a.no) - Number(b.no));

  if (activeSimulationConfig) {
    if (activeSimulationConfig.subtestId === 'ist_9') {
      return (
        <div className="fixed inset-0 z-[200] bg-white overflow-auto flex flex-col">
          <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shrink-0">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">ADMIN SIMULATION</span>
              <span>{activeSimulationConfig.subtestName}</span>
            </div>
            <button
              onClick={() => setActiveSimulationConfig(null)}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup Simulasi</span>
            </button>
          </div>
          <div className="flex-1">
            <Subtest9Flow
              participantId="trial-user"
              subtestId={activeSimulationConfig.subtestId}
              subtestName={activeSimulationConfig.subtestName}
              totalQuestions={20}
              timeLimitMinutes={activeSimulationConfig.durationMinutes}
              isSimulation={true}
              disableAntiCheat={!activeSimulationConfig.antiCheatEnabled}
              autoFillSampleAnswers={activeSimulationConfig.autoFillSampleAnswers}
              onFinish={() => setActiveSimulationConfig(null)}
              onCancel={() => setActiveSimulationConfig(null)}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[200] bg-white overflow-auto flex flex-col">
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">ADMIN SIMULATION</span>
            <span>{activeSimulationConfig.subtestName}</span>
          </div>
          <button
            onClick={() => setActiveSimulationConfig(null)}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tutup Simulasi</span>
          </button>
        </div>
        <div className="flex-1">
          <TestEngine
            participantId="trial-user"
            subtestId={activeSimulationConfig.subtestId}
            subtestName={activeSimulationConfig.subtestName}
            totalQuestions={activeSimulationConfig.subtestId === 'trial' ? 5 : 20}
            timeLimitMinutes={activeSimulationConfig.durationMinutes}
            isSimulation={true}
            disableAntiCheat={!activeSimulationConfig.antiCheatEnabled}
            autoFillSampleAnswers={activeSimulationConfig.autoFillSampleAnswers}
            onFinish={() => setActiveSimulationConfig(null)}
            onCancel={() => setActiveSimulationConfig(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSubtestSelect('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              selectedSubtest === 'all'
                ? 'bg-[#1C1C1C] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Semua Subtest ({rawData.length})
          </button>
          {SUBTESTS.map(st => {
            const count = rawData.filter(s => String(s.subtest) === st.id).length;
            return (
              <button
                key={st.id}
                onClick={() => handleSubtestSelect(st.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  selectedSubtest === st.id
                    ? 'bg-[#8BC34A] text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {st.name.split(' - ')[0]} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSimulationModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            title="Buka Simulator Alur Peserta CBT dengan Evaluasi Nilai Instan"
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span>Simulasi Alur Peserta (CBT)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGeEvaluatorOpen(true)}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            title="Buka Evaluator & Kamus Typo Kunci Jawaban Subtes 4 (GE)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Evaluator &amp; Kamus Subtes 4 (GE)</span>
          </button>
        </div>
      </div>

      {selectedSubtest === '4' && (
        <div className="mb-4 bg-purple-50/80 border border-purple-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
              GE
            </div>
            <div>
              <h4 className="font-bold text-purple-950">Subtes 4 (GE) - Persamaan Kata</h4>
              <p className="text-purple-700">
                Penyekoran 3 tingkat (Skor 2, 1, 0) dengan toleransi typo cerdas (*Fuzzy Matching*) dan konversi Tabel 3 IST Resmi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsGeEvaluatorOpen(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Buka Simulator Typo &amp; Kamus Kunci</span>
          </button>
        </div>
      )}

      <DataTable 
        title={selectedSubtest === 'all' ? "Master Soal Intelegensi (IST)" : `Master Soal - ${SUBTESTS.find(s => s.id === selectedSubtest)?.name}`} 
        columns={columns} 
        data={filteredData} 
        onAdd={() => { 
          const initialSub = selectedSubtest === 'all' ? '1' : selectedSubtest;
          const isEsaiDefault = ['4', '5', '6'].includes(initialSub);
          setFormData({ 
            id: '', 
            no: '', 
            subtest: initialSub, 
            jenisSoal: isEsaiDefault ? 'ESAI' : 'PILIHAN GANDA', 
            gambarSoal: '', 
            soal: '', 
            pilihan: isEsaiDefault ? [] : ['', '', '', '', ''], 
            jawaban: '' 
          }); 
          setIsModalOpen(true); 
        }} 
        addLabel="+ Tambah Soal" 
        onEdit={handleEdit} 
        onDelete={handleDelete}
      />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={!formData.id ? "Tambah Soal Intelegensi" : "Edit Soal Intelegensi"} maxWidth="max-w-2xl">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Subtest IST</label>
              <select value={formData.subtest} onChange={e => setFormData({...formData, subtest: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A] bg-white">
                {SUBTESTS.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Jenis Soal</label>
              <select value={formData.jenisSoal} onChange={e => setFormData({...formData, jenisSoal: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A] bg-white">
                <option value="">-- Pilih Jenis Soal --</option>
                <option value="ESAI">ESAI</option>
                <option value="ESAI DENGAN NILAI">ESAI DENGAN NILAI</option>
                <option value="MATEMATIKA">MATEMATIKA</option>
                <option value="PILIHAN GANDA">PILIHAN GANDA</option>
                <option value="SIMBOL">SIMBOL</option>
                <option value="KLIK ANGKA">KLIK ANGKA</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm text-gray-600 mb-2">No. Soal</label>
              <input type="text" value={formData.no} onChange={e => setFormData({...formData, no: e.target.value})} placeholder="Contoh: 01" className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
            </div>
            <div className="col-span-3">
              <label className="block text-sm text-gray-600 mb-2">Gambar Soal (Opsional)</label>
              <div className="relative">
                 {formData.gambarSoal ? (
                   <div className="flex items-center space-x-3 border border-gray-300 rounded-md p-2 bg-white">
                      <img src={formData.gambarSoal} alt="Preview" className="h-10 w-10 object-contain rounded border border-gray-200 bg-gray-50" />
                      <span className="text-xs text-gray-500 truncate flex-1">{formData.gambarSoal}</span>
                      <button onClick={() => setFormData({...formData, gambarSoal: ''})} className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"><X className="w-4 h-4" /></button>
                   </div>
                 ) : (
                   <label className={`flex items-center justify-center w-full border border-gray-300 border-dashed rounded-md px-4 py-2.5 text-sm transition-colors ${isUploading ? 'bg-gray-50 text-gray-400' : 'text-gray-500 hover:bg-[#8BC34A]/5 hover:border-[#8BC34A]/50 hover:text-[#8BC34A] cursor-pointer'}`}>
                     {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                     <span className="font-medium">{isUploading ? 'Mengunggah...' : 'Pilih Gambar...'}</span>
                     <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e)} disabled={isUploading} />
                   </label>
                 )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Pertanyaan / Pernyataan</label>
            <textarea value={formData.soal} onChange={e => setFormData({...formData, soal: e.target.value})} rows={3} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
          </div>

          {(formData.jenisSoal === 'PILIHAN GANDA' || formData.jenisSoal === 'SIMBOL' || formData.jenisSoal === 'PG_GAMBAR' || formData.jenisSoal === 'PG') && (
            <div className="border border-gray-200 p-4 rounded-md bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                 <label className="block text-sm font-bold text-gray-700">Pilihan Jawaban</label>
                 <button onClick={() => setFormData({...formData, pilihan: [...formData.pilihan, '']})} className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded shadow-sm hover:bg-gray-100 font-medium">+ Tambah Pilihan</button>
              </div>
              <div className="space-y-3">
                {formData.pilihan.map((choice, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-gray-700 w-5 text-center">{String.fromCharCode(65 + idx)}</span>
                    
                    {(formData.jenisSoal === 'SIMBOL' || formData.jenisSoal === 'PG_GAMBAR') ? (
                      <div className="flex-1">
                        {choice ? (
                          <div className="flex items-center space-x-2 border border-gray-300 rounded-md p-1.5 bg-white">
                            <img src={choice} alt={`Pilihan ${idx}`} className="h-8 w-8 object-contain rounded border border-gray-200 bg-gray-50" />
                            <span className="text-xs text-gray-500 truncate flex-1">{choice}</span>
                            <button onClick={() => {
                              const newChoices = [...formData.pilihan];
                              newChoices[idx] = '';
                              setFormData({...formData, pilihan: newChoices});
                            }} className="p-1 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <label className={`flex items-center justify-center w-full border border-gray-300 border-dashed rounded-md px-4 py-2 text-sm transition-colors ${isUploading ? 'bg-gray-50 text-gray-400' : 'text-gray-500 hover:bg-[#8BC34A]/5 hover:border-[#8BC34A]/50 hover:text-[#8BC34A] cursor-pointer'}`}>
                            {isUploading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-2" />}
                            <span className="font-medium">{isUploading ? 'Mengunggah...' : 'Unggah Gambar Pilihan'}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, true, idx)} disabled={isUploading} />
                          </label>
                        )}
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        value={choice} 
                        placeholder="Teks pilihan..."
                        onChange={(e) => { 
                          const newChoices = [...formData.pilihan]; 
                          newChoices[idx] = e.target.value; 
                          setFormData({...formData, pilihan: newChoices}); 
                        }} 
                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#8BC34A]" 
                      />
                    )}
                    
                    <button onClick={() => setFormData({...formData, pilihan: formData.pilihan.filter((_, i) => i !== idx)})} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">Kunci Jawaban Benar</label>
             <input 
               type="text" 
               value={formData.jawaban} 
               onChange={e => setFormData({...formData, jawaban: e.target.value})} 
               placeholder={['ESAI', 'ESAI DENGAN NILAI', 'MATEMATIKA'].includes(formData.jenisSoal) ? "Contoh: Bunga, atau 27" : "Contoh: A, B, C, D, E"} 
               className="w-full border-2 border-[#8BC34A] rounded-md px-4 py-3 text-sm focus:outline-none bg-[#8BC34A]/5 font-bold uppercase" 
             />
             <p className="text-xs text-gray-500 mt-2">
               * Untuk Isian Singkat/Matematika, ketik kata/angka yang menjadi kunci jawaban. Untuk Pilihan Ganda/Simbol, cukup ketik hurufnya (A/B/C/D/E).
             </p>
          </div>

          <div className="pt-6 pb-2 flex justify-end md:justify-center relative">
             <button 
               onClick={handleSave} 
               disabled={isSaving}
               className="bg-[#1C1C1C] hover:bg-black text-white px-10 py-3 rounded-full text-sm font-bold transition-colors w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
             >
               {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
               <span>{isSaving ? 'Menyimpan...' : 'SAVE SOAL'}</span>
             </button>
          </div>
        </div>
      </Modal>

      {/* Subtest 4 GE Evaluator & Dictionary Modal */}
      <Subtest4GeEvaluatorModal
        isOpen={isGeEvaluatorOpen}
        onClose={() => setIsGeEvaluatorOpen(false)}
      />

      {/* Participant CBT Simulation Modal for Admin Preview */}
      <ParticipantSimulationModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        onStartSimulation={(config) => {
          setIsSimulationModalOpen(false);
          setActiveSimulationConfig(config);
        }}
      />
    </>
  );
}
