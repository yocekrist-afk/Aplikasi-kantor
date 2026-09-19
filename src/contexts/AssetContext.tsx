import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AssetContextType {
  customAssets: Record<string, string>;
  updateAsset: (originalPath: string, base64Data: string) => Promise<void>;
  resetAsset: (originalPath: string) => Promise<void>;
  isLoading: boolean;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customAssets, setCustomAssets] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'assets'), (docSnap) => {
      if (docSnap.exists()) {
        setCustomAssets(docSnap.data() as Record<string, string>);
      } else {
        setCustomAssets({});
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching assets:', error);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const updateAsset = async (originalPath: string, base64Data: string) => {
    try {
      const docRef = doc(db, 'settings', 'assets');
      await setDoc(docRef, { [originalPath]: base64Data }, { merge: true });
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  };

  const resetAsset = async (originalPath: string) => {
    try {
      const docRef = doc(db, 'settings', 'assets');
      const current = { ...customAssets };
      delete current[originalPath];
      await setDoc(docRef, current); // overwrite with deleted key
    } catch (error) {
      console.error('Error resetting asset:', error);
      throw error;
    }
  };

  return (
    <AssetContext.Provider value={{ customAssets, updateAsset, resetAsset, isLoading }}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAsset = () => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAsset must be used within an AssetProvider');
  }
  return context;
};
