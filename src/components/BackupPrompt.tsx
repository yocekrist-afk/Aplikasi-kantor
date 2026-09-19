import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Download, X } from 'lucide-react';

// Defines the collections we want to backup
const BACKUP_COLLECTIONS = [
  'events',
  'participants',
  'clients',
  'administrators',
  'faqs',
  'soal_intelegensi',
  'kategori_soal',
  'app_settings'
];

const BACKUP_INTERVAL_DAYS = 7; // Prompt every 7 days

export const BackupPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    // Check local storage for last backup date
    const lastBackup = localStorage.getItem('lastBackupDate');
    if (!lastBackup) {
      setShowPrompt(true);
    } else {
      const lastBackupDate = new Date(lastBackup);
      const diffTime = Math.abs(new Date().getTime() - lastBackupDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays >= BACKUP_INTERVAL_DAYS) {
        setShowPrompt(true);
      }
    }
  }, []);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const backupData: Record<string, any[]> = {};
      
      // Fetch all documents from each collection
      for (const colName of BACKUP_COLLECTIONS) {
        const querySnapshot = await getDocs(collection(db, colName));
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        backupData[colName] = docs;
      }

      // Create JSON blob
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `backup_db_ist_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save backup date to local storage
      localStorage.setItem('lastBackupDate', new Date().toISOString());
      setShowPrompt(false);
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Gagal melakukan backup database. Periksa koneksi internet Anda.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Optionally: if dismissed without backing up, we might prompt them again next reload, 
    // or we can set the timer to tomorrow by updating the lastBackupDate with a past date (6 days ago).
    // For safety, let's not update localStorage so it prompts again next time they log in.
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-sm bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden z-50 animate-fade-in">
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
        <div className="flex items-center text-blue-800 font-semibold text-sm">
          <Download className="w-4 h-4 mr-2" />
          Peringatan Keamanan Data
        </div>
        <button onClick={handleDismiss} className="text-blue-400 hover:text-blue-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Sistem mendeteksi bahwa Anda belum melakukan pencadangan (backup) database baru-baru ini. Unduh salinan data seluruh sistem secara lokal untuk mencegah kehilangan data tak terduga.
        </p>
        <div className="flex justify-end space-x-2">
          <button 
            onClick={handleDismiss}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Nanti Saja
          </button>
          <button 
            onClick={handleBackup}
            disabled={isBackingUp}
            className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isBackingUp ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              'Unduh Backup'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
