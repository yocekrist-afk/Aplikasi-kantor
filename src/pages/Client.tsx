import { confirmAction } from '../utils/confirmAction';
import React, { useState } from 'react';
import { DataTable } from '../components/layout/DataTable';
import { Modal } from '../components/layout/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { Loader2 } from 'lucide-react';

export function Client() {
  const { data, addData, updateData, deleteData } = useFirestore('clients');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ id: '', logo: '', nama: '' });
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for firestore document
        alert('File size must be less than 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const columns = [
    { key: 'no', label: 'NO' },
    { 
      key: 'logo', 
      label: 'LOGO',
      render: (val: string) => <img src={val} alt="Logo" className="w-12 h-12 object-contain bg-gray-50 p-1 rounded border border-gray-200" />
    },
    { key: 'nama', label: 'NAMA CLIENT', className: 'font-medium' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    const logoUrl = formData.logo || 'https://via.placeholder.com/150?text=Logo';
    try {
      if (!formData.id) {
        await addData({ logo: logoUrl, nama: formData.nama });
      } else {
        await updateData(formData.id, { logo: logoUrl, nama: formData.nama });
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
    if (await confirmAction(`Hapus client ${row.nama}?`)) {
      try {
        await deleteData(row.id);
      } catch (error) {
        console.error(error);
        alert('Gagal menghapus data');
      }
    }
  };

  return (
    <>
      <DataTable 
        title="Data Client" columns={columns} data={data} 
        onAdd={() => { setFormData({ id: '', logo: '', nama: '' }); setIsModalOpen(true); }} addLabel="+ Add Client" 
        onEdit={(row) => { setFormData({ id: row.id, logo: row.logo, nama: row.nama }); setIsModalOpen(true); }} onDelete={handleDelete}
      />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={!formData.id ? "Tambah Client" : "Edit Client"} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Nama Client</label>
            <input type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
          </div>
          <div>
            <div className="flex gap-4 mb-3 border-b border-gray-200">
              <button 
                className={`pb-2 text-sm font-medium ${uploadMode === 'file' ? 'text-[#8BC34A] border-b-2 border-[#8BC34A]' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setUploadMode('file')}
              >
                Upload File
              </button>
              <button 
                className={`pb-2 text-sm font-medium ${uploadMode === 'url' ? 'text-[#8BC34A] border-b-2 border-[#8BC34A]' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setUploadMode('url')}
              >
                Input URL
              </button>
            </div>
            {uploadMode === 'file' ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#8BC34A] transition-colors relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {formData.logo && formData.logo.startsWith('data:image') ? (
                  <div className="flex flex-col items-center">
                    <img src={formData.logo} alt="Preview" className="w-16 h-16 object-contain mb-2 rounded" />
                    <span className="text-xs text-gray-500">Klik untuk mengganti gambar</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-600">Klik untuk upload (Max 1MB)</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input type="text" placeholder="https://..." value={formData.logo} onChange={e => setFormData({...formData, logo: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
                {formData.logo && formData.logo.startsWith('http') && (
                   <img src={formData.logo} alt="Preview" className="w-16 h-16 object-contain mt-3 rounded border border-gray-200 p-1" />
                )}
              </div>
            )}
          </div>
          <div className="pt-4 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-[#1C1C1C] hover:bg-black text-white px-8 py-2.5 rounded-full text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
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
