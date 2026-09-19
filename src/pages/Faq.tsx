import { confirmAction } from '../utils/confirmAction';
import React, { useState } from 'react';
import { DataTable } from '../components/layout/DataTable';
import { Modal } from '../components/layout/Modal';
import { Play, Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';

export function Faq() {
  const { data: faqData, addData, updateData, deleteData } = useFirestore('faqs');
  
  // Convert firestore data to match the table format
  const data = faqData?.map((item, index) => ({
    ...item,
    no: String(index + 1)
  })) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', pertanyaan: '', jawaban: '', cover: '', youtubeUrl: '' });

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const columns = [
    { key: 'no', label: 'NO' },
    { 
      key: 'cover', 
      label: 'COVER',
      render: (val: string, row: any) => (
        <div className="relative w-24 h-14 rounded overflow-hidden shadow-sm border border-gray-200 group bg-gray-100 flex items-center justify-center">
          {val ? (
            <img src={val} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-gray-400">No Image</span>
          )}
          {row.youtubeUrl && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white">
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              </div>
            </div>
          )}
        </div>
      )
    },
    { key: 'pertanyaan', label: 'JUDUL', className: 'min-w-[200px] font-medium' },
    { 
      key: 'date', 
      label: 'DATE',
      render: (val: string) => val ? new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'
    },
    { 
      key: 'status', 
      label: 'STATUS',
      render: (val: string) => (
        <span className="px-3 py-1 bg-[#8BC34A] text-white text-xs rounded shadow-sm">
          {val || 'Active'}
        </span>
      )
    }
  ];

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.pertanyaan) {
      alert("Judul tidak boleh kosong!");
      return;
    }

    setIsLoading(true);
    try {
      let coverUrl = formData.cover;
      
      // Automatically extract thumbnail if youtube URL is provided
      if (formData.youtubeUrl) {
        const videoId = getYoutubeId(formData.youtubeUrl);
        if (videoId) {
          coverUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      } else if (!coverUrl) {
         coverUrl = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80';
      }

      const payload = {
        pertanyaan: formData.pertanyaan,
        jawaban: formData.jawaban || '',
        cover: coverUrl,
        youtubeUrl: formData.youtubeUrl || '',
        status: 'Active',
        date: new Date().toISOString()
      };

      if (!formData.id) {
        await addData(payload);
      } else {
        await updateData(formData.id, payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Gagal menyimpan data. Pastikan koneksi internet stabil.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (row: any) => {
    if (await confirmAction(`Hapus FAQ ini?`)) {
      await deleteData(row.id);
    }
  };

  return (
    <>
      <DataTable 
        title="Data FAQ" columns={columns} data={data} 
        onAdd={() => { setFormData({ id: '', pertanyaan: '', jawaban: '', cover: '', youtubeUrl: '' }); setIsModalOpen(true); }} addLabel="+ Add Data" 
        onEdit={(row) => { setFormData({ ...row, youtubeUrl: row.youtubeUrl || '' }); setIsModalOpen(true); }} onDelete={handleDelete}
      />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={!formData.id ? "Tambah FAQ" : "Edit FAQ"} maxWidth="max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Judul (Pertanyaan)</label>
            <input type="text" value={formData.pertanyaan} onChange={e => setFormData({...formData, pertanyaan: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Deskripsi (Jawaban)</label>
            <textarea rows={4} value={formData.jawaban} onChange={e => setFormData({...formData, jawaban: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Link YouTube URL</label>
            <input type="text" placeholder="https://youtube.com/watch?v=..." value={formData.youtubeUrl} onChange={e => setFormData({...formData, youtubeUrl: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" />
            <p className="text-xs text-gray-400 mt-1">Thumbnail akan otomatis diambil dari video YouTube.</p>
          </div>
          <div className="pt-4 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={isLoading}
              className="bg-[#1C1C1C] hover:bg-black text-white px-8 py-2.5 rounded-full text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'MENYIMPAN...' : 'SAVE DATA'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
