import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export async function logActivity(action: string, description: string, target?: string) {
  try {
    const user = auth.currentUser;
    const performedBy = user?.email || 'System';
    
    await addDoc(collection(db, 'activity_logs'), {
      action,
      description,
      performedBy,
      target: target || '-',
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp() // for compatibility with useFirestore ordering
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
