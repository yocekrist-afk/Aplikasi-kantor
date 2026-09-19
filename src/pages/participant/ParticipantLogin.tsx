import React, { useState } from 'react';
import { Loader2, LogIn, ShieldAlert } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface ParticipantLoginProps {
  onLogin: (user?: any) => void;
  onGoToRegister?: () => void;
  eventData: any;
}

export function ParticipantLogin({ onLogin, onGoToRegister, eventData }: ParticipantLoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noPeserta, setNoPeserta] = useState('');
  const [nomorPonsel, setNomorPonsel] = useState('');

  // 1. LOGIN LANGSUNG DENGAN NO PESERTA & NOMOR PONSEL
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noPeserta.trim() || !nomorPonsel.trim()) {
      setError('Mohon masukkan Nomor Peserta dan Nomor Ponsel Anda.');
      return;
    }

    if (!eventData?.id) {
      setError('Data event belum siap atau tidak valid. Silakan muat ulang halaman.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const cleanNoPeserta = noPeserta.trim();
      const cleanNomorPonsel = nomorPonsel.trim();

      // Cari data peserta pada event ini
      const q = query(
        collection(db, 'participants'),
        where('eventId', '==', eventData.id),
        where('noPeserta', '==', cleanNoPeserta)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError(`Nomor Peserta ${cleanNoPeserta} belum terdaftar untuk event ini. Pastikan nomor sudah benar atau silakan klik registrasi.`);
        setLoading(false);
        return;
      }

      const pDoc = querySnapshot.docs[0];
      const pData = pDoc.data();

      // Cek apakah akun peserta sedang di tempat sampah
      if (pData.isDeleted) {
        setError('Akun peserta ini sedang dinonaktifkan atau berada di tempat sampah. Silakan hubungi Administrator/Pengawas ujian untuk memulihkan akun Anda.');
        setLoading(false);
        return;
      }

      // Verifikasi nomor ponsel
      const savedPhone = (pData.nomorPonsel || pData.noWa || '').replace(/[^0-9]/g, '');
      const inputPhone = cleanNomorPonsel.replace(/[^0-9]/g, '');

      if (savedPhone && inputPhone && savedPhone !== inputPhone) {
        setError('Nomor ponsel yang dimasukkan tidak sesuai dengan data terdaftar.');
        setLoading(false);
        return;
      }

      // Berhasil login
      const sessionUser = {
        uid: pData.uid || `p_${eventData.id}_${cleanNoPeserta}`,
        docId: pDoc.id,
        eventId: eventData.id,
        noPeserta: cleanNoPeserta,
        namaPeserta: pData.namaPeserta || cleanNoPeserta,
        email: pData.email || `${cleanNoPeserta.toLowerCase()}@peserta.lpp`
      };

      localStorage.setItem('participant_session', JSON.stringify(sessionUser));
      onLogin(sessionUser);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Terjadi kesalahan saat masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // 2. LOGIN DENGAN GOOGLE
  const handleGoogleLogin = async () => {
    if (!eventData?.id) {
      setError('Data event belum siap atau tidak valid. Silakan muat ulang halaman.');
      return;
    }

    setLoading(true);
    setError('');
    
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
          setError('Waktu autentikasi Google habis atau pop-up tidak merespon. Silakan masuk menggunakan Nomor Peserta & Nomor Ponsel di atas.');
          setLoading(false);
          return;
        }
        if (popupErr.code === 'auth/popup-closed-by-user' || popupErr.code === 'auth/cancelled-popup-request') {
          setError('Jendela masuk Google ditutup sebelum selesai.');
          setLoading(false);
          return;
        }
        if (popupErr.code === 'auth/popup-blocked') {
          setError('Pop-up Google diblokir oleh peramban Anda. Silakan masuk menggunakan Nomor Peserta & Nomor Ponsel.');
          setLoading(false);
          return;
        }
        throw popupErr;
      }

      if (!userCredential?.user) {
        setError('Gagal masuk dengan Google.');
        setLoading(false);
        return;
      }

      const googleUser = userCredential.user;

      // Cek apakah user Google ini terdaftar di event ini
      const q = query(
        collection(db, 'participants'),
        where('uid', '==', googleUser.uid),
        where('eventId', '==', eventData.id)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setError('Akun Google ini belum terdaftar untuk event ini. Silakan klik Registrasi Akun terlebih dahulu.');
        setLoading(false);
        return;
      }

      const pDoc = snap.docs[0];
      const pData = pDoc.data();

      if (pData.isDeleted) {
        setError('Akun peserta ini sedang dinonaktifkan atau berada di tempat sampah. Silakan hubungi Administrator/Pengawas ujian untuk memulihkan akun Anda.');
        setLoading(false);
        return;
      }

      const sessionUser = {
        uid: googleUser.uid,
        docId: pDoc.id,
        eventId: eventData.id,
        noPeserta: pData.noPeserta || '',
        namaPeserta: pData.namaPeserta || googleUser.displayName || 'Peserta',
        email: googleUser.email
      };

      localStorage.setItem('participant_session', JSON.stringify(sessionUser));
      onLogin(sessionUser);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Gagal login dengan Google. Silakan masuk dengan Nomor Peserta & Nomor Ponsel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row overflow-hidden w-full max-w-5xl min-h-[500px]">
        {/* Illustration Section */}
        <div className="hidden md:flex w-1/2 bg-gray-50 items-center justify-center p-8 border-r border-gray-100">
          <img 
            src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Login Illustration" 
            className="max-w-full h-auto object-cover rounded-2xl shadow-md aspect-square"
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Sign In</h1>
          <p className="text-gray-600 mb-6 font-medium">
            Lembaga Psikologi Perspective Online Assessment <span className="font-bold text-[#8BC34A]">{eventData?.title || 'Tes Assessment'}</span>
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3.5 rounded-lg text-sm mb-6 border border-red-200 flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleDirectLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Peserta</label>
              <input 
                type="text" 
                name="noPeserta"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Masukkan Nomor Peserta"
                required
                value={noPeserta}
                onChange={(e) => setNoPeserta(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]"
              />
              <span className="text-[11px] text-gray-400">Hanya angka (0-9)</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Ponsel (WhatsApp)</label>
              <input 
                type="tel" 
                name="nomorPonsel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Masukkan Nomor Ponsel"
                required
                value={nomorPonsel}
                onChange={(e) => setNomorPonsel(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A]"
              />
              <span className="text-[11px] text-gray-400">Nomor ponsel yang didaftarkan</span>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center bg-[#8BC34A] hover:bg-[#7cb342] text-white font-bold py-3.5 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    MASUK KE RUANG TES
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-xs text-gray-400 font-medium uppercase">Atau Masuk Lewat Google</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <div>
            <button 
              type="button"
              onClick={handleGoogleLogin}
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
                  SIGN IN DENGAN GOOGLE
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-6 text-center">
            Belum memiliki akun untuk event ini?{' '}
            <button 
              type="button" 
              onClick={onGoToRegister} 
              className="text-[#8BC34A] font-bold hover:underline"
            >
              Registrasi di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
