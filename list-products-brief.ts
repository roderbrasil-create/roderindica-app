import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const snap = await getDocs(collection(db, 'products'));
  console.log(`Total Products: ${snap.size}`);
  snap.forEach(doc => {
    const d = doc.data();
    const modelNames = (d.models || []).map((m: any) => m.name).join(', ');
    console.log(`- [${d.category}] "${d.name}" (${(d.models || []).length} modelos): ${modelNames || 'Nenhum'}`);
  });
  process.exit(0);
}
run();
