import { confirmAction } from '../utils/confirmAction';
import React, { useState } from 'react';
import { DataTable } from '../components/layout/DataTable';
import { Modal } from '../components/layout/Modal';
import { Circle, Square, Triangle, Hexagon, Star } from 'lucide-react';

export function Simbol() {
  const [data, setData] = useState([
    { id: 1, no: '1', subtest: 'Subtest 1' },
    { id: 2, no: '2', subtest: 'Subtest 2' }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: 0, subtest: '' });

  const columns = [
    { key: 'no', label: 'NO' },
    { key: 'subtest', label: 'SUBTEST' },
    { 
      key: 'simbol', 
      label: 'SIMBOL',
      render: () => (
        <div className="flex items-center space-x-4 py-2">
          <div className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded shadow-sm"><Circle className="w-5 h-5 text-gray-700" /></div>
          <div className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded shadow-sm"><Square className="w-5 h-5 text-gray-700" /></div>
          <div className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded shadow-sm"><Triangle className="w-5 h-5 text-gray-700" /></div>
          <div className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded shadow-sm"><Hexagon className="w-5 h-5 text-gray-700" /></div>
          <div className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded shadow-sm"><Star className="w-5 h-5 text-gray-700" /></div>
        </div>
      )
    }
  ];

  const handleSave = async () => {
    if (formData.id === 0) {
      setData([...data, { ...formData, id: Date.now(), no: String(data.length + 1) }]);
    } else {
      setData(data.map(item => item.id === formData.id ? { ...item, ...formData } : item));
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (row: any) => {
    if (await confirmAction(`Hapus simbol ini?`)) {
      setData(data.filter(item => item.id !== row.id).map((item, idx) => ({ ...item, no: String(idx + 1) })));
    }
  };

  return (
    <>
      <DataTable 
        title="Data Simbol" columns={columns} data={data} 
        onAdd={() => { setFormData({ id: 0, subtest: '' }); setIsModalOpen(true); }} addLabel="+ Add Simbol" 
        onEdit={(row) => { setFormData(row); setIsModalOpen(true); }} onDelete={handleDelete}
      />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id === 0 ? "Tambah Simbol" : "Edit Simbol"} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Pilih Subtest</label>
            <select value={formData.subtest} onChange={e => setFormData({...formData, subtest: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A] bg-white">
              <option value="">Pilih Subtest...</option>
              <option value="Subtest 1">Subtest 1</option>
              <option value="Subtest 2">Subtest 2</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end">
            <button onClick={handleSave} className="bg-[#1C1C1C] hover:bg-black text-white px-8 py-2.5 rounded-full text-sm font-bold transition-colors">SAVE DATA</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
