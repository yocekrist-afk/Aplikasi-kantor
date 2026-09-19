import { confirmAction } from '../utils/confirmAction';
import React, { useState } from 'react';
import { DataTable } from '../components/layout/DataTable';
import { Modal } from '../components/layout/Modal';

export function Instruksi() {
  const [data, setData] = useState([
    { id: 1, no: '1', kategori: 'Gaya Belajar', subtest: 'Subtest 1', instruksi: 'Pilih salah satu jawaban yang paling sesuai dengan kebiasaan belajar Anda sehari-hari.' },
    { id: 2, no: '2', kategori: 'Intelegensi', subtest: 'Subtest 1', instruksi: 'Tentukan kata mana yang tidak memiliki kesamaan dengan kata-kata lainnya.' }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: 0, kategori: 'Gaya Belajar', subtest: 'Subtest 1', instruksi: '' });

  const columns = [
    { key: 'no', label: 'NO' },
    { key: 'kategori', label: 'KATEGORI SOAL' },
    { key: 'subtest', label: 'SUBTEST' },
    { key: 'instruksi', label: 'INSTRUKSI', className: 'whitespace-normal min-w-[400px] text-sm leading-relaxed' }
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
    if (await confirmAction(`Hapus instruksi ini?`)) {
      setData(data.filter(item => item.id !== row.id).map((item, idx) => ({ ...item, no: String(idx + 1) })));
    }
  };

  return (
    <>
      <DataTable 
        title="Data Instruksi" columns={columns} data={data} 
        onAdd={() => { setFormData({ id: 0, kategori: 'Gaya Belajar', subtest: 'Subtest 1', instruksi: '' }); setIsModalOpen(true); }} addLabel="+ Add Instruksi" 
        onEdit={(row) => { setFormData(row); setIsModalOpen(true); }} onDelete={handleDelete}
      />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id === 0 ? "Tambah Instruksi" : "Edit Instruksi"} maxWidth="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Kategori Soal</label>
              <select value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A] bg-white">
                <option value="Intelegensi">Intelegensi</option>
                <option value="Gaya Belajar">Gaya Belajar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Subtest</label>
              <input type="text" value={formData.subtest} onChange={e => setFormData({...formData, subtest: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Instruksi</label>
            <textarea rows={4} value={formData.instruksi} onChange={e => setFormData({...formData, instruksi: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
          </div>
          <div className="pt-4 flex justify-end">
            <button onClick={handleSave} className="bg-[#1C1C1C] hover:bg-black text-white px-8 py-2.5 rounded-full text-sm font-bold transition-colors">SAVE DATA</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
