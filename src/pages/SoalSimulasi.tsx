import { confirmAction } from '../utils/confirmAction';
import React, { useState } from 'react';
import { DataTable } from '../components/layout/DataTable';
import { Modal } from '../components/layout/Modal';
import { Trash2, Loader2, Plus, Minus } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';

export function SoalSimulasi() {
  const { data: firestoreData, addData, updateData, deleteData, loading } = useFirestore('soal_simulasi');
  
  const data = firestoreData?.map((item, index) => ({
    ...item,
    no: String(index + 1)
  })) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [choices, setChoices] = useState(['', '', '', '', '']);
  const [formData, setFormData] = useState({ id: '', subtest: 'Simulasi', soal: '', jawaban: '' });

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
    { key: 'jawaban', label: 'JAWABAN', render: (val: string) => <div className="flex justify-center items-center h-full pt-2"><div className="w-8 h-8 rounded-full bg-[#475569] text-white flex items-center justify-center text-xs font-bold uppercase">{val || '-'}</div></div> },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        soal: formData.soal,
        pilihan: choices,
        jawaban: formData.jawaban || '-',
        subtest: formData.subtest || 'Simulasi',
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
      alert('Gagal menyimpan soal simulasi');
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
    setChoices(row.pilihan || ['', '', '', '', '']);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <>
      <DataTable 
        title="Soal Simulasi" columns={columns} data={data} 
        onAdd={() => { setFormData({ id: '', subtest: 'Simulasi', soal: '', jawaban: '' }); setChoices(['', '', '', '', '']); setIsModalOpen(true); }} addLabel="+ Add Soal" 
        onEdit={handleEdit} onDelete={handleDelete}
      />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={!formData.id ? "Tambah Soal Simulasi" : "Edit Soal Simulasi"} maxWidth="max-w-3xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Pilih Subtest</label>
            <select value={formData.subtest} onChange={e => setFormData({...formData, subtest: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A] bg-white">
              <option value="Simulasi">Simulasi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Pertanyaan</label>
            <textarea rows={3} value={formData.soal} onChange={e => setFormData({...formData, soal: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" placeholder="Ketik pertanyaan di sini..." />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-600">Pilihan Jawaban (A - E)</label>
              <div className="flex space-x-2">
                <button onClick={() => setChoices(choices.slice(0, -1))} disabled={choices.length <= 2} className="p-1 rounded bg-red-100 text-red-600 disabled:opacity-50 hover:bg-red-200"><Minus className="w-4 h-4" /></button>
                <button onClick={() => setChoices([...choices, ''])} className="p-1 rounded bg-[#8BC34A]/20 text-[#8BC34A] hover:bg-[#8BC34A]/30"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="space-y-3">
              {choices.map((choice, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0 uppercase">{String.fromCharCode(97 + index)}</span>
                  <input type="text" value={choice} onChange={(e) => {
                    const newChoices = [...choices];
                    newChoices[index] = e.target.value;
                    setChoices(newChoices);
                  }} className="flex-1 border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" placeholder={`Pilihan ${String.fromCharCode(97 + index).toUpperCase()}`} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Jawaban Benar (a, b, c, dll)</label>
            <input type="text" value={formData.jawaban} onChange={e => setFormData({...formData, jawaban: e.target.value.toLowerCase()})} placeholder="Contoh: a" className="w-32 border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A] uppercase" />
          </div>
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button 
              onClick={() => setIsModalOpen(false)} 
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors cursor-pointer disabled:opacity-60"
            >
              Batal
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-[#8BC34A] hover:bg-[#7cb342] text-white px-6 py-2.5 rounded-md font-medium text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Soal'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
