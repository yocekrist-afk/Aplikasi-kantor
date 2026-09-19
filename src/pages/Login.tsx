import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Lock, Mail, Eye, EyeOff, Zap, ShieldCheck } from 'lucide-react';
import { logActivity } from '../utils/activityLogger';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleBypass = () => {
    localStorage.setItem('require_admin_login', 'false');
    onLogin();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        await logActivity('REGISTER', 'Admin mendaftar menggunakan Email/Password', email);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        await logActivity('LOGIN', 'Admin login menggunakan Email/Password', email);
      }
      onLogin();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await logActivity('LOGIN', 'Admin login menggunakan Google SSO', result.user.email || 'Unknown');
      onLogin();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">LPP v.1 {isRegistering ? 'Register' : 'Login'}</h1>
          <p className="text-sm text-gray-500 mt-2">
            {isRegistering ? 'Buat akun administrator baru' : 'Masuk ke dasbor administrator'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {/* Quick Bypass / Masuk Cepat Tanpa Kode */}
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-500" />
              Akses Cepat (Tanpa Kode/HP)
            </span>
            <span className="text-[10px] bg-emerald-200/80 text-emerald-800 font-semibold px-2 py-0.5 rounded">
              Bypass Login
            </span>
          </div>
          <p className="text-xs text-emerald-700 leading-relaxed mb-3">
            Malas ambil HP untuk input kode verifikasi? Masuk langsung ke dasbor administrator tanpa login.
          </p>
          <button
            type="button"
            onClick={handleBypass}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Masuk Langsung Sekarang</span>
          </button>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-3 mb-6 disabled:opacity-50 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {isRegistering ? 'Daftar dengan Google' : 'Masuk dengan Google'}
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-gray-300 w-full absolute"></div>
          <span className="bg-white px-3 text-sm text-gray-500 relative">atau dengan email</span>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A] focus:ring-1 focus:ring-[#8BC34A]"
                placeholder="admin@example.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#8BC34A] focus:ring-1 focus:ring-[#8BC34A]"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8BC34A] hover:bg-[#7CB342] text-white font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Memproses...' : (isRegistering ? 'Daftar' : 'Masuk')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            type="button" 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            {isRegistering ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
          </button>
        </div>
      </div>
    </div>
  );
}
