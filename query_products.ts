import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Fetching products...");
  const querySnapshot = await getDocs(collection(db, 'products'));
  const products: any[] = [];
  querySnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() });
  });
  console.log(JSON.stringify(products.map(p => ({ id: p.id, name: p.name, category: p.category, models: p.models?.map((m: any) => m.name) })), null, 2));
}

run().catch(console.error);
