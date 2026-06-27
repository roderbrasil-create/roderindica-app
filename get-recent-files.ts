import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const snapshotFiles = await getDocs(collection(db, 'app_files'));
    const files: any[] = [];
    snapshotFiles.forEach(doc => {
      const data = doc.data();
      files.push({ 
        id: doc.id, 
        name: data.name,
        created_at: data.created_at,
        type: data.type
      });
    });
    
    // Sort chronologically (newest first)
    files.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    
    console.log(`=== RECENT UPLOADED FILES ===`);
    files.slice(0, 15).forEach((f, idx) => {
      console.log(`[${idx}] ID: "${f.id}" | NAME: "${f.name}" | CREATED: "${f.created_at}" | TYPE: "${f.type}"`);
    });

    process.exit(0);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
}
run();
