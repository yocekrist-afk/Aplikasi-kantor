import React, { useEffect, useState } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { Loader2 } from 'lucide-react';
import { ParticipantRegister } from './participant/ParticipantRegister';
import { ParticipantLogin } from './participant/ParticipantLogin';
import { ParticipantDashboard } from './participant/ParticipantDashboard';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

type ViewState = 'register' | 'login' | 'dashboard';

export function ParticipantPortal({ eventId }: { eventId: string }) {
  const { data: events, loading: eventsLoading } = useFirestore('events');
  const [eventData, setEventData] = useState<any>(null);
  const [view, setView] = useState<ViewState>('register');
  const [user, setUser] = useState<User | any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 1. Resolve eventData dari URL param (baik ID dokumen maupun Slug)
  useEffect(() => {
    if (!eventsLoading && events) {
      const foundEvent = events.find(e => e.id === eventId || e.slug === eventId);
      setEventData(foundEvent || null);
    }
  }, [events, eventId, eventsLoading]);

  // 2. Cek sesi peserta setelah eventData siap
  useEffect(() => {
    if (!eventData && !eventsLoading) {
      setAuthLoading(false);
      return;
    }
    if (!eventData) return;

    let unsubscribe = () => {};

    const checkSession = async () => {
      // Periksa apakah ada sesi lokal yang cocok dengan event ini
      const rawSession = localStorage.getItem('participant_session');
      if (rawSession) {
        try {
          const session = JSON.parse(rawSession);
          // 1 Akun hanya untuk 1 Event saja:
          if (session && (session.eventId === eventData.id || session.eventId === eventData.slug || session.eventId === eventId)) {
            setUser({
              uid: session.uid,
              docId: session.docId,
              email: session.email,
              displayName: session.namaPeserta
            });
            setView('dashboard');
            setAuthLoading(false);
            return;
          } else {
            // Sesi milik event lain, hapus agar peserta registrasi / login di event ini
            localStorage.removeItem('participant_session');
            localStorage.removeItem('participantSessionId');
          }
        } catch (e) {
          localStorage.removeItem('participant_session');
        }
      }

      // Periksa auth state Firebase (Google SSO)
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          try {
            const q = query(
              collection(db, 'participants'), 
              where('uid', '==', currentUser.uid)
            );
            const snap = await getDocs(q);
            
            const matchingDoc = snap.docs.find(d => {
              const data = d.data();
              return data.eventId === eventData.id || data.eventId === eventData.slug || data.eventId === eventId;
            });

            if (matchingDoc) {
              const pData = matchingDoc.data();
              setUser({
                ...currentUser,
                docId: matchingDoc.id,
                noPeserta: pData.noPeserta,
                namaPeserta: pData.namaPeserta || currentUser.displayName
              });
              setView('dashboard');
            } else {
              // Terdaftar di Firebase akun Google, tapi belum terdaftar di EVENT INI
              // Jangan signOut paksa agar tidak mengganggu, arahkan ke register
              setUser(null);
              setView('register');
            }
          } catch (error) {
            console.error("Error checking participant registration:", error);
            setUser(null);
            setView('login');
          }
        } else {
          // Tidak ada user Google
          setUser(null);
          // Biarkan tampilan di register atau login
        }
        setAuthLoading(false);
      });
    };

    checkSession();

    return () => {
      unsubscribe();
    };
  }, [eventData, eventsLoading, eventId]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('participant_session');
      localStorage.removeItem('participantSessionId');
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setView('login');
    }
  };

  if (eventsLoading || (authLoading && !eventData)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#8BC34A] animate-spin" />
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Event Tidak Ditemukan</h1>
        <p className="text-gray-600 mb-6 text-center">Maaf, event yang Anda cari tidak ditemukan atau URL tidak valid.</p>
        <button 
          onClick={() => window.location.href = '/'} 
          className="bg-[#8BC34A] hover:bg-[#7cb342] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <ParticipantRegister 
        onGoToLogin={() => setView('login')} 
        onSuccess={(sessionUser) => {
          setUser({
            uid: sessionUser.uid,
            docId: sessionUser.docId,
            email: sessionUser.email,
            displayName: sessionUser.namaPeserta
          });
          setView('dashboard');
        }}
        eventData={eventData} 
      />
    );
  }

  if (view === 'login') {
    return (
      <ParticipantLogin 
        onLogin={(sessionUser) => {
          if (sessionUser) {
            setUser({
              uid: sessionUser.uid,
              docId: sessionUser.docId,
              email: sessionUser.email,
              displayName: sessionUser.namaPeserta
            });
          }
          setView('dashboard');
        }} 
        onGoToRegister={() => setView('register')}
        eventData={eventData} 
      />
    );
  }

  if (view === 'dashboard') {
    return <ParticipantDashboard eventData={eventData} onLogout={handleLogout} user={user} />;
  }

  return null;
}
