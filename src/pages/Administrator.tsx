import { confirmAction } from '../utils/confirmAction';
import React, { useState } from 'react';
import { DataTable } from '../components/layout/DataTable';
import { Modal } from '../components/layout/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { logActivity } from '../utils/activityLogger';
import { Loader2 } from 'lucide-react';

const ALL_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard', group: 'Utama' },
  { id: 'event', label: 'Event', group: 'Utama' },
  { id: 'peserta', label: 'Peserta', group: 'Utama' },
  { id: 'tabulasi_penilaian', label: 'Tabulasi Penilaian', group: 'Utama' },
  { id: 'faq', label: 'FAQ', group: 'Utama' },
  
  { id: 'instruksi', label: 'Instruksi', group: 'Master Data' },
  { id: 'simbol', label: 'Simbol', group: 'Master Data' },
  { id: 'client', label: 'Client', group: 'Master Data' },
  { id: 'kategori_soal', label: 'Kategori Soal', group: 'Master Data' },
  { id: 'program_study', label: 'Program Studi', group: 'Master Data' },
  
  { id: 'soal_gaya_belajar', label: 'Soal Gaya Belajar', group: 'Master Soal' },
  { id: 'soal_mbti', label: 'Soal MBTI', group: 'Master Soal' },
  { id: 'soal_papi_kostick', label: 'Soal Papi Kostick', group: 'Master Soal' },
  { id: 'soal_rmib', label: 'Soal RMIB', group: 'Master Soal' },
  { id: 'soal_intelegensi', label: 'Soal Intelegensi', group: 'Master Soal' },
  { id: 'soal_simulasi', label: 'Soal Simulasi', group: 'Master Soal' },
  
  { id: 'administrator', label: 'Administrator', group: 'Sistem' },
  { id: 'pengaturan', label: 'Pengaturan', group: 'Sistem' },
  { id: 'pengaturan_aset', label: 'Pengaturan Aset', group: 'Sistem' },
  { id: 'pengaturan_durasi', label: 'Pengaturan Durasi', group: 'Sistem' },
  { id: 'uji_beban', label: 'Uji Beban (CBT)', group: 'Sistem' },
  { id: 'legacy', label: 'Legacy IST App', group: 'Sistem' }
];

export function Administrator() {
  const [activeTab, setActiveTab] = useState<'admin_data' | 'activity_log'>('admin_data');
  const { data: admins, addData, updateData, deleteData } = useFirestore('administrators');
  const { data: logs } = useFirestore('activity_logs');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<{ id: string, nama: string, username: string, status: string, avatar: string, role: string, permissions: string[] }>({ id: '', nama: '', username: '', status: 'Active', avatar: '', role: 'operator', permissions: [] });

  const adminColumns = [
    { key: 'no', label: 'NO', render: (_: any, __: any, index: number) => index + 1 },
    { 
      key: 'avatar', 
      label: 'AVATAR',
      render: (val: string) => (
        <img src={val || 'https://ui-avatars.com/api/?name=Admin&background=random'} alt="Avatar" className="w-8 h-8 rounded-full" />
      )
    },
    { key: 'nama', label: 'NAMA' },
    { key: 'username', label: 'EMAIL (USERNAME)' },
    { 
      key: 'permissions', 
      label: 'HAK AKSES',
      render: (_: any, row: any) => {
        const perms = row.permissions || [];
        const isSuperAdmin = row.role === 'super_admin' || perms.length === ALL_PERMISSIONS.length;
        if (isSuperAdmin) {
          return <span className="px-2 py-1 text-white text-xs font-semibold rounded bg-purple-500">Super Admin (Penuh)</span>;
        }
        return <span className="px-2 py-1 text-white text-xs font-semibold rounded bg-blue-500">{perms.length} Akses Menu</span>;
      }
    },
    { key: 'date', label: 'DATE' },
    { 
      key: 'status', 
      label: 'STATUS',
      render: (val: string) => (
        <span className={`px-2 py-1 text-white text-xs font-semibold rounded ${val === 'Active' ? 'bg-[#8BC34A]' : 'bg-gray-400'}`}>
          {val}
        </span>
      )
    },
  ];

  const logColumns = [
    { key: 'no', label: 'NO', render: (_: any, __: any, index: number) => index + 1 },
    { 
      key: 'timestamp', 
      label: 'WAKTU',
      render: (val: any) => {
        if (!val) return '-';
        const date = val.toDate ? val.toDate() : new Date(val);
        return date.toLocaleString('id-ID');
      }
    },
    { key: 'action', label: 'AKSI' },
    { key: 'description', label: 'DESKRIPSI' },
    { key: 'performedBy', label: 'DILAKUKAN OLEH' },
    { key: 'target', label: 'TARGET (EMAIL)' }
  ];

  const handleEdit = async (row: any) => {
    setFormData({
      id: row.id,
      nama: row.nama || '',
      username: row.username || '',
      status: row.status || 'Active',
      avatar: row.avatar || '',
      role: row.role || 'operator',
      permissions: row.permissions || (row.role === 'super_admin' ? ALL_PERMISSIONS.map(p => p.id) : ['dashboard', 'event', 'peserta', 'tabulasi_penilaian', 'faq'])
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (row: any) => {
    if (await confirmAction(`Hapus admin ${row.nama}?`)) {
      await deleteData(row.id);
      await logActivity('DELETE_ADMIN', `Menghapus admin ${row.nama}`, row.username);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (formData.id) {
        await updateData(formData.id, {
          nama: formData.nama,
          username: formData.username,
          status: formData.status,
          role: formData.role,
          permissions: formData.permissions,
        });
        await logActivity('UPDATE_PERMISSIONS', `Memperbarui data dan hak akses admin ${formData.nama}`, formData.username);
      } else {
        await addData({
          nama: formData.nama,
          username: formData.username,
          status: formData.status,
          role: formData.role,
          permissions: formData.permissions,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.nama)}&background=random`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
        await logActivity('CREATE_ADMIN', `Membuat admin baru ${formData.nama}`, formData.username);
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan data admin');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (id: string) => {
    setFormData(prev => {
      const newPerms = prev.permissions.includes(id) 
        ? prev.permissions.filter(p => p !== id)
        : [...prev.permissions, id];
      
      const newRole = newPerms.length === ALL_PERMISSIONS.length ? 'super_admin' : 'operator';
      return { ...prev, permissions: newPerms, role: newRole };
    });
  };

  const handleResetPassword = async (row: any) => {
    if (!row.username) {
      alert("Pengguna ini tidak memiliki email yang valid.");
      return;
    }
    if (await confirmAction(`Kirim email reset password ke ${row.username}?`)) {
      try {
        const { sendPasswordResetEmail } = await import('firebase/auth');
        const { auth } = await import('../lib/firebase');
        await sendPasswordResetEmail(auth, row.username);
        await logActivity('RESET_PASSWORD', `Mengirimkan link reset password`, row.username);
        alert(`Email reset password berhasil dikirim ke ${row.username}`);
      } catch (error: any) {
        console.error("Error sending reset password email:", error);
        alert(`Gagal mengirim email reset password: ${error.message}`);
      }
    }
  };

  const groupedPermissions = ALL_PERMISSIONS.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    acc[curr.group].push(curr);
    return acc;
  }, {} as Record<string, typeof ALL_PERMISSIONS>);

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('admin_data')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'admin_data'
                ? 'border-b-2 border-[#8BC34A] text-[#8BC34A]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Data Administrator
          </button>
          <button
            onClick={() => setActiveTab('activity_log')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'activity_log'
                ? 'border-b-2 border-[#8BC34A] text-[#8BC34A]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Log Aktivitas
          </button>
        </div>
      </div>

      {activeTab === 'admin_data' ? (
        <DataTable 
          title="Data Administrator"
          columns={adminColumns}
          data={admins}
          onAdd={() => {
            setFormData({ 
              id: '', nama: '', username: '', status: 'Active', avatar: '', role: 'operator', 
              permissions: ['dashboard', 'event', 'peserta', 'tabulasi_penilaian', 'faq'] 
            });
            setIsModalOpen(true);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onResetPassword={handleResetPassword}
        />
      ) : (
        <DataTable 
          title="Log Aktivitas Sistem"
          columns={logColumns}
          data={[...logs].reverse()}
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? "Edit Administrator" : "Tambah Administrator"}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              value={formData.nama} 
              onChange={e => setFormData({...formData, nama: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#8BC34A]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Username Login)</label>
            <input 
              type="text" 
              value={formData.username} 
              onChange={e => setFormData({...formData, username: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#8BC34A]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#8BC34A] bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          
          <div className="pt-2 border-t mt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold text-gray-800">Hak Akses Menu</label>
              <button 
                type="button" 
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  permissions: prev.permissions.length === ALL_PERMISSIONS.length ? [] : ALL_PERMISSIONS.map(p => p.id),
                  role: prev.permissions.length === ALL_PERMISSIONS.length ? 'operator' : 'super_admin'
                }))}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {formData.permissions.length === ALL_PERMISSIONS.length ? 'Batalkan Semua' : 'Pilih Semua'}
              </button>
            </div>
            
            <div className="space-y-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              {Object.entries(groupedPermissions).map(([group, perms]) => (
                <div key={group}>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map(p => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-md border border-gray-200 hover:border-[#8BC34A] transition-colors">
                        <input 
                          type="checkbox" 
                          checked={formData.permissions.includes(p.id)}
                          onChange={() => togglePermission(p.id)}
                          className="w-4 h-4 text-[#8BC34A] rounded focus:ring-[#8BC34A]"
                        />
                        <span className="text-sm text-gray-700">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium bg-[#8BC34A] text-white rounded hover:bg-[#7cb342] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
