import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  const snap = await getDocs(collection(db, 'settings'));
  console.log("--- SETTINGS DOCUMENTS ---");
  snap.forEach(doc => {
    console.log(`ID: ${doc.id} =>`, JSON.stringify(doc.data(), null, 2));
  });
}

run().catch(console.error);
