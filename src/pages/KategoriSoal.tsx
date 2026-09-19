import { confirmAction } from '../utils/confirmAction';
import React, { useState } from 'react';
import { DataTable } from '../components/layout/DataTable';
import { Modal } from '../components/layout/Modal';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';

export function KategoriSoal() {
  const { data, addData, updateData, deleteData } = useFirestore('kategori_soal');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ id: '', kategori: '' });

  const columns = [
    { key: 'no', label: 'NO' },
    { key: 'kategori', label: 'KATEGORI SOAL' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!formData.id) {
        await addData({ kategori: formData.kategori });
      } else {
        await updateData(formData.id, { kategori: formData.kategori });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (row: any) => {
    if (await confirmAction(`Hapus kategori ${row.kategori}?`)) {
      try {
        await deleteData(row.id);
      } catch (error) {
        console.error(error);
        alert('Gagal menghapus data');
      }
    }
  };

  const handleEdit = async (row: any) => {
    setFormData({ id: row.id, kategori: row.kategori });
    setIsModalOpen(true);
  };

  return (
    <>
      <DataTable 
        title="Data Kategori Soal" 
        columns={columns} 
        data={data} 
        onAdd={() => { setFormData({ id: '', kategori: '' }); setIsModalOpen(true); }} 
        addLabel="+ Add Kategori Soal" 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={!formData.id ? "Tambah Kategori Soal" : "Edit Kategori Soal"} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Nama Kategori</label>
            <input type="text" value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
          </div>
          <div className="pt-4 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-[#1C1C1C] hover:bg-black text-white px-8 py-2.5 rounded-full text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSaving ? 'Menyimpan...' : 'SAVE DATA'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
