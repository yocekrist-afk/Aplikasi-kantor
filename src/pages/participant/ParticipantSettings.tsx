import React, { useState, useEffect } from 'react';
import { User, Camera, Mail, Phone, Calendar as CalendarIcon, MapPin, Loader2, CreditCard, Hash } from 'lucide-react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { WebcamCapture } from './WebcamCapture';

interface ParticipantSettingsProps {
  participantData: any;
  onUpdateParticipant: (newData: any) => void;
  user?: any;
  eventData?: any;
}

export function ParticipantSettings({ participantData, onUpdateParticipant, user, eventData }: ParticipantSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [formData, setFormData] = useState({
    namaPeserta: '',
    email: '',
    nomorPonsel: '',
    tanggalLahir: '',
    alamat: '',
    jenisKelamin: '',
    nik: '',
    noPeserta: ''
  });

  useEffect(() => {
    if (participantData) {
      setFormData({
        namaPeserta: participantData.namaPeserta || participantData.nama || '',
        email: participantData.email || '',
        nomorPonsel: participantData.nomorPonsel || participantData.phone || '',
        tanggalLahir: participantData.tanggalLahir || '',
        alamat: participantData.alamat || '',
        jenisKelamin: participantData.jenisKelamin || '',
        nik: participantData.nik || '',
        noPeserta: participantData.noPeserta || ''
      });
    }
  }, [participantData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!participantData?.id) {
        if (!user || !eventData?.id) {
          alert('Gagal: Sesi tidak valid atau Event ID tidak ditemukan.');
          setLoading(false);
          return;
        }
        // Create new participant document
        const newDocRef = await addDoc(collection(db, 'participants'), {
          uid: user.uid,
          eventId: eventData.id,
          namaPeserta: formData.namaPeserta,
          email: formData.email,
          nomorPonsel: formData.nomorPonsel,
          tanggalLahir: formData.tanggalLahir,
          alamat: formData.alamat,
          jenisKelamin: formData.jenisKelamin,
          nik: formData.nik,
          noPeserta: formData.noPeserta,
          createdAt: serverTimestamp()
        });
        onUpdateParticipant({ ...formData, id: newDocRef.id });
      } else {
        // Update existing participant document
        const docRef = doc(db, 'participants', participantData.id);
        await updateDoc(docRef, {
          namaPeserta: formData.namaPeserta,
          email: formData.email,
          nomorPonsel: formData.nomorPonsel,
          tanggalLahir: formData.tanggalLahir,
          alamat: formData.alamat,
          jenisKelamin: formData.jenisKelamin,
          nik: formData.nik,
          noPeserta: formData.noPeserta
        });
        onUpdateParticipant(formData);
      }
      alert('Data berhasil disimpan!');
    } catch (error) {
      console.error('Error updating participant:', error);
      alert('Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {showCamera && (
        <WebcamCapture
          participantId={participantData?.id}
          title="Perbarui Foto Profil"
          description="Silakan ambil swafoto (selfie) terbaru dari kamera perangkat Anda."
          onVerified={() => {
            alert('Foto profil berhasil diperbarui!');
            setShowCamera(false);
            // Simulate participantData refresh or handle state locally
            onUpdateParticipant({ ...formData, photoVerifiedAt: new Date().toISOString() });
          }}
          onCancel={() => setShowCamera(false)}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column: Photo & Brief Info */}
            <div className="w-full md:w-1/3 flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 bg-gray-100">
                  <img src={participantData?.photoBase64 || "https://i.pravatar.cc/150?img=11"} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={() => {
                    if (!participantData?.id) {
                      alert('Silakan lengkapi profil dan klik Simpan terlebih dahulu.');
                      return;
                    }
                    setShowCamera(true);
                  }}
                  className="absolute bottom-0 right-0 p-2.5 bg-[#8BC34A] text-white rounded-full shadow-lg hover:bg-[#7cb342] transition-colors"
                  title="Perbarui Foto Profil (Kamera)"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">{formData.namaPeserta || 'Peserta'}</h3>
                <p className="text-sm text-gray-500">Peserta Ujian</p>
              </div>
            </div>

            {/* Right Column: Edit Form */}
            <div className="w-full md:w-2/3">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Pengaturan Profil</h2>
              
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        value={formData.namaPeserta}
                        onChange={(e) => setFormData({...formData, namaPeserta: e.target.value})}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8BC34A]/20 focus:border-[#8BC34A] transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-gray-400" />
                      </div>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8BC34A]/20 focus:border-[#8BC34A] transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">NIK (KTP)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.nik}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setFormData({...formData, nik: val});
                        }}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8BC34A]/20 focus:border-[#8BC34A] transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">No. Peserta</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="w-4 h-4 text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.noPeserta}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setFormData({...formData, noPeserta: val});
                        }}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8BC34A]/20 focus:border-[#8BC34A] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">No. Telepon</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="w-4 h-4 text-gray-400" />
                      </div>
                      <input 
                        type="tel" 
                        value={formData.nomorPonsel}
                        onChange={(e) => setFormData({...formData, nomorPonsel: e.target.value})}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8BC34A]/20 focus:border-[#8BC34A] transition-all"
                        placeholder="08123456789"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <input 
                        type="date" 
                        value={formData.tanggalLahir}
                        onChange={(e) => setFormData({...formData, tanggalLahir: e.target.value})}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8BC34A]/20 focus:border-[#8BC34A] transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
                    <select 
                      value={formData.jenisKelamin}
                      onChange={(e) => setFormData({...formData, jenisKelamin: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8BC34A]/20 focus:border-[#8BC34A] transition-all bg-white"
                    >
                      <option value="">Pilih Jenis Kelamin</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Alamat</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                    <textarea 
                      rows={3}
                      value={formData.alamat}
                      onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                      className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8BC34A]/20 focus:border-[#8BC34A] transition-all"
                      placeholder="Alamat lengkap..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-[#1C1C1C] hover:bg-black text-white px-8 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm w-full md:w-auto flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
