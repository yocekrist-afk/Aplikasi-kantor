import { confirmAction } from '../utils/confirmAction';
import React, { useState } from 'react';
import { DataTable } from '../components/layout/DataTable';
import { Modal } from '../components/layout/Modal';
import { Trash2, Loader2, Plus } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';

export function SoalRmib() {
  const { data: firestoreData, addData, updateData, deleteData, loading } = useFirestore('soal_rmib');
  
  const data = firestoreData?.map((item, index) => ({
    ...item,
    no: String(index + 1)
  })) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [choicesLaki, setChoicesLaki] = useState<string[]>([]);
  const [choicesWanita, setChoicesWanita] = useState<string[]>([]);
  const [formData, setFormData] = useState({ id: '', subtest: 'Kelompok A', soal: 'Urutkan kelompok pekerjaan berikut dari yang paling disukai (1) hingga paling tidak disukai (12)', jawaban: 'Ranking' });

  const columns = [
    { key: 'no', label: 'NO' },
    { key: 'jenisSoal', label: 'JENIS SOAL', render: (val: string) => <div className="flex justify-center"><span className="w-16 h-7 rounded-full bg-[#4285F4] text-white flex items-center justify-center text-[11px] font-bold shadow-sm">{val || 'Ranking'}</span></div> },
    { key: 'subtest', label: 'KELOMPOK' },
    { 
      key: 'pilihanLaki', 
      label: 'PILIHAN (LAKI-LAKI)',
      className: 'min-w-[250px] whitespace-normal',
      render: (choices: string[]) => (
        <div className="flex flex-col space-y-1.5 py-1">
          {choices && choices.slice(0, 3).map((choice, idx) => (
            <div key={idx} className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx + 1}</span>
              <span className="text-gray-700 text-xs">{choice}</span>
            </div>
          ))}
          {choices && choices.length > 3 && <div className="text-xs text-gray-500 italic ml-7">+{choices.length - 3} pekerjaan lainnya...</div>}
        </div>
      )
    },
    { 
      key: 'pilihanWanita', 
      label: 'PILIHAN (WANITA)',
      className: 'min-w-[250px] whitespace-normal',
      render: (choices: string[]) => (
        <div className="flex flex-col space-y-1.5 py-1">
          {choices && choices.slice(0, 3).map((choice, idx) => (
            <div key={idx} className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx + 1}</span>
              <span className="text-gray-700 text-xs">{choice}</span>
            </div>
          ))}
          {choices && choices.length > 3 && <div className="text-xs text-gray-500 italic ml-7">+{choices.length - 3} pekerjaan lainnya...</div>}
        </div>
      )
    }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        soal: formData.soal,
        pilihanLaki: choicesLaki,
        pilihanWanita: choicesWanita,
        jawaban: 'Ranking',
        subtest: formData.subtest,
        jenisSoal: 'Ranking',
        createdAt: new Date().toISOString()
      };

      if (!formData.id) {
        await addData(payload);
      } else {
        await updateData(formData.id, payload);
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan kelompok RMIB');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (row: any) => {
    if (await confirmAction(`Hapus kelompok pekerjaan ini?`)) {
      await deleteData(row.id);
    }
  };

  const handleEdit = async (row: any) => {
    setFormData(row);
    setChoicesLaki(row.pilihanLaki || []);
    setChoicesWanita(row.pilihanWanita || []);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <>
      <DataTable 
        title="Soal RMIB" columns={columns} data={data} 
        onAdd={() => { 
          setFormData({ id: '', subtest: 'Kelompok A', soal: 'Urutkan kelompok pekerjaan berikut dari yang paling disukai (1) hingga paling tidak disukai (12)', jawaban: 'Ranking' }); 
          setChoicesLaki(Array(12).fill('')); 
          setChoicesWanita(Array(12).fill('')); 
          setIsModalOpen(true); 
        }} 
        addLabel="+ Add Kelompok" 
        onEdit={handleEdit} onDelete={handleDelete}
      />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={!formData.id ? "Tambah Kelompok RMIB" : "Edit Kelompok RMIB"} maxWidth="max-w-4xl">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Nama Kelompok</label>
              <input type="text" value={formData.subtest} onChange={e => setFormData({...formData, subtest: e.target.value})} placeholder="Misal: Kelompok A" className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Instruksi Soal</label>
            <textarea rows={2} value={formData.soal} onChange={e => setFormData({...formData, soal: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
            {/* Laki-laki */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-blue-700 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Daftar Pekerjaan Laki-laki</span>
                </h4>
                <button onClick={() => setChoicesLaki([...choicesLaki, ''])} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-full flex items-center space-x-1">
                  <Plus className="w-3 h-3" /> <span>Tambah</span>
                </button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {choicesLaki.map((choice, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-400 w-5 text-center">{idx + 1}.</span>
                    <input type="text" value={choice} onChange={(e) => { const newChoices = [...choicesLaki]; newChoices[idx] = e.target.value; setChoicesLaki(newChoices); }} className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-gray-50 focus:bg-white" placeholder="Nama pekerjaan..." />
                    <button onClick={() => setChoicesLaki(choicesLaki.filter((_, i) => i !== idx))} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Wanita */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-pink-700 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                  <span>Daftar Pekerjaan Wanita</span>
                </h4>
                <button onClick={() => setChoicesWanita([...choicesWanita, ''])} className="text-xs bg-pink-50 text-pink-600 hover:bg-pink-100 px-3 py-1.5 rounded-full flex items-center space-x-1">
                  <Plus className="w-3 h-3" /> <span>Tambah</span>
                </button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {choicesWanita.map((choice, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-400 w-5 text-center">{idx + 1}.</span>
                    <input type="text" value={choice} onChange={(e) => { const newChoices = [...choicesWanita]; newChoices[idx] = e.target.value; setChoicesWanita(newChoices); }} className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-pink-400 bg-gray-50 focus:bg-white" placeholder="Nama pekerjaan..." />
                    <button onClick={() => setChoicesWanita(choicesWanita.filter((_, i) => i !== idx))} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 pb-2 flex justify-end md:justify-center relative"> 
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-[#1C1C1C] hover:bg-black text-white px-10 py-3 rounded-full text-sm font-bold transition-colors w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isSaving ? 'Menyimpan...' : 'SAVE KELOMPOK'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
