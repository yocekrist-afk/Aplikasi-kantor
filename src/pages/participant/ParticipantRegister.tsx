import React, { useState } from 'react';
import { Loader2, Camera, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { WebcamCapture } from './WebcamCapture';

interface ParticipantRegisterProps {
  onGoToLogin: () => void;
  onSuccess?: (user: any) => void;
  eventData: any;
}

export function ParticipantRegister({ onGoToLogin, onSuccess, eventData }: ParticipantRegisterProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [requireWebcam, setRequireWebcam] = React.useState(true);

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, 'app_settings'), (snapshot) => {
      if (!snapshot.empty) {
        const config = snapshot.docs[0].data();
        if (config.requireWebcam !== undefined) setRequireWebcam(config.requireWebcam);
      }
    });
    return () => unsub();
  }, []);
  
  const [formData, setFormData] = useState({
    programStudi: '',
    nik: '',
    tanggalLahir: '',
    noPeserta: '',
    namaPeserta: '',
    jenisKelamin: '',
    nomorPonsel: '',
    photoBase64: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.programStudi || !formData.nik || !formData.tanggalLahir || !formData.noPeserta || !formData.namaPeserta || !formData.jenisKelamin || !formData.nomorPonsel) {
      setError('Mohon lengkapi seluruh kolom data diri yang berbintang (*).');
      return false;
    }

    if (formData.nomorPonsel.length < 8) {
      setError('Nomor ponsel tidak valid (minimal 8 angka).');
      return false;
    }

    if (requireWebcam && !formData.photoBase64) {
      setError('Wajib mengambil foto profil dari kamera secara langsung (Real-time).');
      return false;
    }

    return true;
  };

  // 1. REGISTRASI LANGSUNG (Sangat Cepat & Tanpa Kendala Pop-up Google)
  const handleDirectRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    if (!eventData?.id) {
      setError('Data event belum siap atau tidak valid. Silakan muat ulang halaman.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const cleanNoPeserta = formData.noPeserta.trim();
      const cleanNik = formData.nik.trim();
      const cleanNomorPonsel = formData.nomorPonsel.trim();

      // Cek apakah No Peserta atau NIK sudah terdaftar di event ini
      const q = query(
        collection(db, 'participants'), 
        where('eventId', '==', eventData.id),
        where('noPeserta', '==', cleanNoPeserta)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError(`Nomor Peserta ${cleanNoPeserta} sudah terdaftar pada event ini. Silakan langsung login.`);
        setLoading(false);
        return;
      }

      // Buat UID unik untuk peserta ini
      const participantUid = `p_${eventData.id}_${cleanNoPeserta}_${Date.now()}`;

      const docRef = await addDoc(collection(db, 'participants'), {
        uid: participantUid,
        eventId: eventData.id,
        eventSlug: eventData.slug || '',
        programStudi: formData.programStudi,
        nik: cleanNik,
        tanggalLahir: formData.tanggalLahir,
        email: `${cleanNoPeserta.toLowerCase()}@peserta.lpp`,
        noPeserta: cleanNoPeserta,
        namaPeserta: formData.namaPeserta.trim(),
        jenisKelamin: formData.jenisKelamin,
        nomorPonsel: cleanNomorPonsel,
        photoBase64: formData.photoBase64 || '',
        photoVerifiedAt: new Date().toISOString(),
        status: 'Account Active',
        hasLock: true,
        createdAt: serverTimestamp()
      });

      try {
        await addDoc(collection(db, 'activity_logs'), {
          type: 'participant',
          message: `Peserta baru (${formData.namaPeserta.trim()}) berhasil registrasi`,
          timestamp: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
      } catch(e) {}

      // Simpan sesi lokal peserta
      const sessionUser = {
        uid: participantUid,
        docId: docRef.id,
        eventId: eventData.id,
        noPeserta: cleanNoPeserta,
        namaPeserta: formData.namaPeserta.trim(),
        email: `${cleanNoPeserta.toLowerCase()}@peserta.lpp`
      };
      localStorage.setItem('participant_session', JSON.stringify(sessionUser));

      alert('Registrasi berhasil! Anda akan langsung masuk ke beranda tes.');
      if (onSuccess) {
        onSuccess(sessionUser);
      } else {
        onGoToLogin();
      }
    } catch (err: any) {
      console.error('Direct register error:', err);
      setError(err.message || 'Terjadi kesalahan saat registrasi. Silakan periksa koneksi dan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // 2. REGISTRASI DENGAN GOOGLE SSO (Dengan Timeout & Anti-Stuck)
  const handleGoogleRegister = async () => {
    if (!validateForm()) return;

    if (!eventData?.id) {
      setError('Data event belum siap atau tidak valid. Silakan muat ulang halaman.');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 25000)
      );

      let userCredential: any;
      try {
        userCredential = await Promise.race([
          signInWithPopup(auth, provider),
          timeoutPromise
        ]);
      } catch (popupErr: any) {
        if (popupErr.message === 'TIMEOUT') {
          setError('Waktu autentikasi Google habis atau pop-up tidak merespon. Silakan gunakan tombol "Daftar Sekarang (Langsung)" berwarna hijau.');
          setLoading(false);
          return;
        }
        if (popupErr.code === 'auth/popup-closed-by-user' || popupErr.code === 'auth/cancelled-popup-request') {
          setError('Jendela masuk Google ditutup sebelum selesai. Anda bisa coba lagi atau gunakan tombol "Daftar Sekarang (Langsung)".');
          setLoading(false);
          return;
        }
        if (popupErr.code === 'auth/popup-blocked') {
          setError('Jendela pop-up Google diblokir oleh browser. Harap izinkan pop-up atau klik tombol "Daftar Sekarang (Langsung)".');
          setLoading(false);
          return;
        }
        throw popupErr;
      }

      if (!userCredential?.user) {
        setError('Gagal menghubungkan akun Google. Silakan gunakan tombol "Daftar Sekarang (Langsung)".');
        setLoading(false);
        return;
      }

      const googleUser = userCredential.user;
      const cleanNoPeserta = formData.noPeserta.trim();
      const cleanNik = formData.nik.trim();
      const cleanNomorPonsel = formData.nomorPonsel.trim();

      // Cek apakah peserta sudah terdaftar untuk event ini
      const q = query(
        collection(db, 'participants'), 
        where('uid', '==', googleUser.uid), 
        where('eventId', '==', eventData.id)
      );
      const querySnapshot = await getDocs(q);

      let pDocId = '';
      if (querySnapshot.empty) {
        const docRef = await addDoc(collection(db, 'participants'), {
          uid: googleUser.uid,
          eventId: eventData.id,
          eventSlug: eventData.slug || '',
          programStudi: formData.programStudi,
          nik: cleanNik,
          tanggalLahir: formData.tanggalLahir,
          email: googleUser.email || '',
          noPeserta: cleanNoPeserta,
          namaPeserta: formData.namaPeserta.trim(),
          jenisKelamin: formData.jenisKelamin,
          nomorPonsel: cleanNomorPonsel,
          photoBase64: formData.photoBase64 || '',
          photoVerifiedAt: new Date().toISOString(),
          status: 'Account Active',
          hasLock: true,
          createdAt: serverTimestamp()
        });
        pDocId = docRef.id;
        
        try {
          await addDoc(collection(db, 'activity_logs'), {
            type: 'participant',
            message: `Peserta baru (${formData.namaPeserta}) berhasil registrasi via Google`,
            timestamp: new Date().toISOString(),
            createdAt: serverTimestamp()
          });
        } catch(e) {}
      } else {
        pDocId = querySnapshot.docs[0].id;
      }

      const sessionUser = {
        uid: googleUser.uid,
        docId: pDocId,
        eventId: eventData.id,
        noPeserta: cleanNoPeserta,
        namaPeserta: formData.namaPeserta.trim(),
        email: googleUser.email
      };
      localStorage.setItem('participant_session', JSON.stringify(sessionUser));
      
      alert('Registrasi berhasil dengan akun Google Anda!');
      if (onSuccess) {
        onSuccess(sessionUser);
      } else {
        onGoToLogin();
      }
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Gagal registrasi dengan Google. Silakan gunakan tombol "Daftar Sekarang (Langsung)".');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {showCamera && (
        <WebcamCapture
          title="Ambil Foto Profil"
          description="Foto ini akan digunakan sebagai foto profil dan verifikasi Anda."
          onCapture={(base64) => {
            setFormData({ ...formData, photoBase64: base64 });
            setShowCamera(false);
          }}
          onCancel={() => setShowCamera(false)}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden w-full max-w-6xl min-h-[600px]">
        {/* Form Section */}
        <div className="w-full lg:w-3/5 p-8 lg:p-12">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Sign Up</h1>
          <p className="text-gray-600 mb-6 font-medium">
            Silahkan <span className="font-bold">registrasi</span> untuk mengikuti <span className="font-bold text-[#8BC34A]">{eventData?.title || 'Tes Assessment'}</span>
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3.5 rounded-lg text-sm mb-6 border border-red-200 flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleDirectRegister}>
            {/* Foto Realtime Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {requireWebcam ? 'Foto Diri (Real-time Webcam) *' : 'Foto Diri (Real-time Webcam) - Opsional'}
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-gray-300 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                  {formData.photoBase64 ? (
                    <img src={formData.photoBase64} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-7 h-7 text-gray-400" />
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                      formData.photoBase64 
                        ? 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100' 
                        : 'border-[#8BC34A] text-[#689f38] bg-white hover:bg-[#8BC34A]/10'
                    }`}
                  >
                    {formData.photoBase64 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> Ambil Ulang Foto
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" /> Ambil Foto Sekarang
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-1.5">
                    {requireWebcam ? 'Wajib diambil secara langsung melalui kamera web perangkat Anda.' : 'Direkomendasikan untuk verifikasi identitas.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1.5">Program Studi *</label>
                  <select 
                    name="programStudi" 
                    required 
                    value={formData.programStudi} 
                    onChange={handleChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A] bg-white text-gray-700"
                  >
                    <option value="">-- Pilih Program Studi --</option>
                    <option value="psikologi">Psikologi</option>
                    <option value="kedokteran">Kedokteran</option>
                    <option value="manajemen">Manajemen</option>
                    <option value="teknik">Teknik</option>
                    <option value="hukum">Hukum</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1.5">NIK (KTP) *</label>
                  <input 
                    type="text" 
                    name="nik" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="16 digit NIK"
                    required 
                    value={formData.nik} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({...formData, nik: val});
                    }} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" 
                  />
                  <span className="text-[11px] text-gray-400">Hanya angka (0-9)</span>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1.5">Tanggal Lahir *</label>
                  <input 
                    type="date" 
                    name="tanggalLahir" 
                    required 
                    value={formData.tanggalLahir} 
                    onChange={handleChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A] text-gray-700" 
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1.5">No Peserta *</label>
                  <input 
                    type="text" 
                    name="noPeserta" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Contoh: 026596965"
                    required 
                    value={formData.noPeserta} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({...formData, noPeserta: val});
                    }} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" 
                  />
                  <span className="text-[11px] text-gray-400">Hanya angka (0-9)</span>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1.5">Nama Lengkap Peserta *</label>
                  <input 
                    type="text" 
                    name="namaPeserta" 
                    placeholder="Nama lengkap sesuai KTP"
                    required 
                    value={formData.namaPeserta} 
                    onChange={handleChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1.5">Jenis Kelamin *</label>
                  <select 
                    name="jenisKelamin" 
                    required 
                    value={formData.jenisKelamin} 
                    onChange={handleChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A] bg-white text-gray-700"
                  >
                    <option value="">-- Pilih Jenis Kelamin --</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1.5">Nomor Ponsel (WhatsApp) *</label>
                  <input 
                    type="tel" 
                    name="nomorPonsel" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Contoh: 081234567890"
                    required 
                    value={formData.nomorPonsel} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({...formData, nomorPonsel: val});
                    }} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]" 
                  />
                  <span className="text-[11px] text-gray-400">Hanya angka yang boleh dimasukkan</span>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              {/* Primary Direct Register Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center bg-[#8BC34A] hover:bg-[#7cb342] text-white font-bold py-3.5 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserCheck className="w-5 h-5 mr-2" />
                    DAFTAR SEKARANG (REGISTRASI LANGSUNG)
                  </>
                )}
              </button>

              <div className="flex items-center my-2">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-3 text-xs text-gray-400 font-medium uppercase">Atau Daftar Lewat Google</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Google SSO Button */}
              <button 
                type="button"
                onClick={handleGoogleRegister}
                disabled={loading}
                className="w-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    SIGN UP DENGAN GOOGLE
                  </>
                )}
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mt-4 text-center">
              Sudah pernah mendaftar di event ini?{' '}
              <button type="button" onClick={onGoToLogin} className="text-[#8BC34A] font-bold hover:underline">
                Klik Login di sini
              </button>
            </p>
          </form>
        </div>

        {/* Illustration Section */}
        <div className="hidden lg:flex w-2/5 bg-gray-50 items-center justify-center p-8 border-l border-gray-100">
          <img 
            src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Registration Illustration" 
            className="max-w-full h-auto object-cover rounded-2xl shadow-md aspect-[3/4]"
          />
        </div>
      </div>
    </div>
  );
}
