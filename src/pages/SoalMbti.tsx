import { confirmAction } from '../utils/confirmAction';
import React, { useState } from 'react';
import { DataTable } from '../components/layout/DataTable';
import { Modal } from '../components/layout/Modal';
import { Trash2, Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';

export function SoalMbti() {
  const { data: firestoreData, addData, updateData, deleteData, loading } = useFirestore('soal_mbti');
  
  const data = firestoreData?.map((item, index) => ({
    ...item,
    no: String(index + 1)
  })) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [choices, setChoices] = useState(['', '']);
  const [formData, setFormData] = useState({ id: '', subtest: 'MBTI', soal: 'Apakah Anda .......?', jawaban: '' });

  const columns = [
    { key: 'no', label: 'NO' },
    { key: 'jenisSoal', label: 'JENIS SOAL', render: (val: string) => <div className="flex justify-center"><span className="w-7 h-7 rounded-full bg-[#4285F4] text-white flex items-center justify-center text-[11px] font-bold shadow-sm">{val || 'PG'}</span></div> },
    { key: 'subtest', label: 'SUBTEST' },
    { key: 'soal', label: 'SOAL', className: 'min-w-[250px] whitespace-normal leading-relaxed', render: (val: string) => <div>{val}</div> },
    { 
      key: 'pilihan', 
      label: 'PILIHAN',
      className: 'min-w-[400px] whitespace-normal',
      render: (choices: string[]) => (
        <div className="flex flex-col space-y-1.5 py-1">
          {choices && choices.map((choice, idx) => (
            <div key={idx} className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">{String.fromCharCode(97 + idx)}.</span>
              <span className="text-gray-700 text-sm">{choice}</span>
            </div>
          ))}
        </div>
      )
    },
    { key: 'jawaban', label: 'JAWABAN', render: (val: string) => <div className="flex justify-center items-center h-full pt-2"><div className="w-8 h-8 rounded-full bg-[#475569] text-white flex items-center justify-center text-xs font-bold">{val || '-'}</div></div> },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        soal: formData.soal || 'Apakah Anda .......?',
        pilihan: choices,
        jawaban: formData.jawaban || '-',
        subtest: formData.subtest || 'MBTI',
        jenisSoal: 'PG',
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
      alert('Gagal menyimpan soal MBTI');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (row: any) => {
    if (await confirmAction(`Hapus soal ini?`)) {
      await deleteData(row.id);
    }
  };

  const handleEdit = async (row: any) => {
    setFormData(row);
    setChoices(row.pilihan || ['', '']);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <>
      <DataTable 
        title="Soal MBTI" columns={columns} data={data} 
        onAdd={() => { setFormData({ id: '', subtest: 'MBTI', soal: 'Apakah Anda .......?', jawaban: '' }); setChoices(['', '']); setIsModalOpen(true); }} addLabel="+ Add Soal" 
        onEdit={handleEdit} onDelete={handleDelete}
      />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={!formData.id ? "Tambah Soal MBTI" : "Edit Soal MBTI"} maxWidth="max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Pilih Subtest</label>
            <select value={formData.subtest} onChange={e => setFormData({...formData, subtest: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A] bg-white">
              <option>MBTI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Pertanyaan</label>
            <textarea rows={2} value={formData.soal} onChange={e => setFormData({...formData, soal: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Jawaban Benar (MBTI tidak ada jawaban benar/salah)</label>
            <input type="text" value={formData.jawaban} onChange={e => setFormData({...formData, jawaban: e.target.value})} placeholder="-" className="w-48 border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
          </div>
          <div>
            <button onClick={() => setChoices([...choices, ''])} className="flex items-center space-x-1.5 bg-[#334155] hover:bg-[#1e293b] text-white px-4 py-2 rounded-full text-xs font-medium transition-colors">
              <span>+ Pilihan Jawaban</span>
            </button>
          </div>
          <div className="space-y-3">
            {choices.map((choice, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 w-5 text-center">{String.fromCharCode(97 + idx)}.</span>
                <input type="text" value={choice} onChange={(e) => { const newChoices = [...choices]; newChoices[idx] = e.target.value; setChoices(newChoices); }} className="flex-1 border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
                <button onClick={() => setChoices(choices.filter((_, i) => i !== idx))} className="p-2.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <div className="pt-6 pb-2 flex justify-end md:justify-center relative"> 
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-[#1C1C1C] hover:bg-black text-white px-10 py-3 rounded-full text-sm font-bold transition-colors w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isSaving ? 'Menyimpan...' : 'SAVE DATA'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
