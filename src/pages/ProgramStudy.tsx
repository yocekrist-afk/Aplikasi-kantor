import { confirmAction } from '../utils/confirmAction';
import React, { useState } from 'react';
import { DataTable } from '../components/layout/DataTable';
import { Modal } from '../components/layout/Modal';

export function ProgramStudy() {
  const [data, setData] = useState([
    { id: 1, no: '1', program: 'Teknik Informatika' }, 
    { id: 2, no: '2', program: 'Sistem Informasi' },
    { id: 3, no: '3', program: 'Psikologi' },
    { id: 4, no: '4', program: 'Manajemen Bisnis' }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: 0, program: '' });

  const columns = [
    { key: 'no', label: 'NO' },
    { key: 'program', label: 'PROGRAM STUDY' },
  ];

  const handleSave = async () => {
    if (formData.id === 0) {
      setData([...data, { ...formData, id: Date.now(), no: String(data.length + 1) }]);
    } else {
      setData(data.map(item => item.id === formData.id ? { ...item, program: formData.program } : item));
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (row: any) => {
    if (await confirmAction(`Hapus program ${row.program}?`)) {
      setData(data.filter(item => item.id !== row.id).map((item, idx) => ({ ...item, no: String(idx + 1) })));
    }
  };

  return (
    <>
      <DataTable 
        title="Data Program Study" columns={columns} data={data} 
        onAdd={() => { setFormData({ id: 0, program: '' }); setIsModalOpen(true); }} addLabel="+ Add Program Study" 
        onEdit={(row) => { setFormData(row); setIsModalOpen(true); }} onDelete={handleDelete}
      />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id === 0 ? "Tambah Program Study" : "Edit Program Study"} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Nama Program Study</label>
            <input type="text" value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
          </div>
          <div className="pt-4 flex justify-end">
            <button onClick={handleSave} className="bg-[#1C1C1C] hover:bg-black text-white px-8 py-2.5 rounded-full text-sm font-bold transition-colors">SAVE DATA</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
