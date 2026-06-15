import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.name && data.name.toLowerCase().includes('desbastador')) {
        console.log(`=== FOUND DOCUMENT: ${doc.id} ===`);
        console.log(`NAME: "${data.name}"`);
        console.log(`IMAGE_URL: "${data.image_url}"`);
        console.log(`MODELS COUNT: ${data.models?.length}`);
        data.models?.forEach((m: any, idx: number) => {
          console.log(`\nModel [${idx}]: "${m.name}"`);
          console.log(`  Images:`, m.images);
          console.log(`  Specs:`, m.technical_specs);
        });
      }
    });
    process.exit(0);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
}
run();
