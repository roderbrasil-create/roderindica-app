import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const snapshotProducts = await getDocs(collection(db, 'products'));
    console.log('=== PRODUCTS IN COLLECTION ===');
    snapshotProducts.forEach(doc => {
      const data = doc.data();
      console.log(`\nPRODUCT ID: ${doc.id} | NAME: "${data.name}" | CATEGORY: "${data.category}"`);
      if (data.models && Array.isArray(data.models)) {
        console.log(`Models count: ${data.models.length}`);
        data.models.forEach((m: any) => {
          console.log(`  - Model ID: "${m.id}" | Name: "${m.name}"`);
          console.log(`    Images:`, m.images);
        });
      } else {
        console.log(`  No models array.`);
      }
    });
    process.exit(0);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
}
run();
