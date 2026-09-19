import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFirestore<T = any>(collectionName: string) {
  const [data, setData] = useState<(T & { id: string; no: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc, idx) => ({
        id: doc.id,
        no: String(idx + 1),
        ...doc.data()
      })) as (T & { id: string; no: string })[];
      setData(items);
      setLoading(false);
    }, (error) => {
      // Fallback if index is missing
      if (error.message.includes('index')) {
        const fallbackQ = collection(db, collectionName);
        onSnapshot(fallbackQ, (fallbackSnapshot) => {
           const items = fallbackSnapshot.docs.map((doc, idx) => ({
             id: doc.id,
             no: String(idx + 1),
             ...doc.data()
           })) as (T & { id: string; no: string })[];
           setData(items);
           setLoading(false);
        });
      } else {
        console.error(`Error fetching ${collectionName}:`, error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [collectionName]);

  const addData = async (payload: Partial<T>) => {
    return addDoc(collection(db, collectionName), {
      ...payload,
      createdAt: serverTimestamp()
    });
  };

  const updateData = async (id: string, payload: Partial<T>) => {
    return updateDoc(doc(db, collectionName, id), payload as any);
  };

  const deleteData = async (id: string) => {
    return deleteDoc(doc(db, collectionName, id));
  };

  return { data, loading, addData, updateData, deleteData };
}
