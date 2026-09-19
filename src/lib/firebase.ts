import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  measurementId: config.measurementId,
};

const app = initializeApp(firebaseConfig);

// Specify the custom databaseId if it is present
export const db = getFirestore(app, config.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const storage = getStorage(app);
