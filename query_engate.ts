import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  const q = query(collection(db, 'products'), where('name', '==', 'Engate Rápido para Pá Carregadeiras'));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.log("No product found with name 'Engate Rápido para Pá Carregadeiras'");
  } else {
    console.log(JSON.stringify(snap.docs[0].data(), null, 2));
  }
}

run().catch(console.error);
