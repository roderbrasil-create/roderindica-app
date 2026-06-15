import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    console.log('--- FETCHING RECENT AUDIT LOGS ---');
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(150));
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} logs.`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const str = JSON.stringify(data);
      if (str.toLowerCase().includes('desbastador') || str.toLowerCase().includes('fae')) {
        console.log(`LOG_ID: ${doc.id} | ACTION: "${data.action}" | DETAILS: "${data.details}" | TIMESTAMP: ${data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp}`);
        if (data.metadata) {
          console.log('METADATA:', JSON.stringify(data.metadata));
        }
      }
    });

    process.exit(0);
  } catch (err: any) {
    console.error('Error in script:', err);
    process.exit(1);
  }
}

run();
