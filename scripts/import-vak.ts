import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const seedData = JSON.parse(fs.readFileSync('./src/data/soalGayaBelajar.json', 'utf-8'));

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
const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

async function run() {
  const colRef = collection(db, 'soal_gaya_belajar');
  console.log('Inserting', seedData.length, 'records');
  for (const item of seedData) {
    await addDoc(colRef, {
      soal: item.soal,
      pilihan: item.pilihan,
      jawaban: '-',
      subtest: 'Gaya Belajar',
      jenisSoal: 'PG',
      createdAt: new Date().toISOString()
    });
  }
  console.log('Done');
  process.exit(0);
}

run().catch(console.error);
