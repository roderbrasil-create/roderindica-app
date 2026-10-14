import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Testing connection to Firestore (Public Collection: products)...");
  try {
    const q = query(collection(db, 'products'), limit(1));
    const snap = await getDocs(q);
    console.log("--- CONNECTION SUCCESS ---");
    console.log(`Found ${snap.size} product(s).`);
    snap.forEach(doc => {
      console.log(`ID: ${doc.id} => Name: ${doc.data().name}`);
    });
  } catch (error) {
    console.error("--- CONNECTION FAILED ---");
    console.error(error);
    process.exit(1);
  }
}

run().catch(console.error);
