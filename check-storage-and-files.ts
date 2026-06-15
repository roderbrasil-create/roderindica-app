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
      files.push({ id: doc.id, ...data });
    });
    
    files.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    
    console.log('--- RECENT UPLOADS SUMMARY ---');
    files.slice(0, 45).forEach((f, idx) => {
      console.log(`\n[${idx}] NAME: "${f.name}" | CREATED: ${f.created_at}`);
      console.log(`      Download URL or Data type:`);
      
      // Look for fields that might contain URLs or data
      const candidates = ['url', 'downloadUrl', 'filePath', 'path', 'data', 'base64', 'fileUrl'];
      candidates.forEach(key => {
        if (f[key] !== undefined) {
          const val = String(f[key]);
          const displayLen = val.length;
          console.log(`      - key "${key}": length ${displayLen}, start: "${val.slice(0, 120)}..."`);
        }
      });
    });

    process.exit(0);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
}
run();
