import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const snapshotProducts = await getDocs(collection(db, 'products'));
    console.log('=== ALL PRODUCTS & TECHNICAL SPECS ===');
    snapshotProducts.forEach(doc => {
      const data = doc.data();
      console.log(`\n========================================`);
      console.log(`PROD ID: ${doc.id}`);
      console.log(`NAME: "${data.name}"`);
      console.log(`CATEGORY: "${data.category}"`);
      console.log(`DESCRIPTION: "${data.description}"`);
      if (data.models && Array.isArray(data.models)) {
        console.log(`MODELS (${data.models.length}):`);
        data.models.forEach((m: any) => {
          console.log(`  * Model: "${m.name}" (ID: ${m.id}) | Base Value: ${m.base_value}`);
          console.log(`    Technical Specs:`, JSON.stringify(m.technical_specs || {}));
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
