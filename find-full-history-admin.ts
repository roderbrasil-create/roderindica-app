import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const databaseId = firebaseConfig.firestoreDatabaseId;

admin.initializeApp({
  projectId: firebaseConfig.projectId
});

// Correct way to initialize Firestore with custom databaseId in firebase-admin SDK
const db = new admin.firestore.Firestore({
  projectId: firebaseConfig.projectId,
  databaseId: databaseId
});

async function run() {
  try {
    console.log('--- ADMIN QUERY START ---');
    console.log(`Using Database ID: ${databaseId || '(default)'}`);

    // Let's query recent audit_logs
    const auditLogsRef = db.collection('audit_logs');
    const qLogs = await auditLogsRef.orderBy('timestamp', 'desc').limit(250).get();
    
    console.log(`Found ${qLogs.size} logs.`);
    
    for (const doc of qLogs.docs) {
      const data = doc.data();
      const str = JSON.stringify(data).toLowerCase();
      if (
        str.includes('carregador') || 
        str.includes('cfr') || 
        str.includes('crf') || 
        str.includes('fae') || 
        str.includes('feller') ||
        str.includes('disco')
      ) {
        console.log('==================================================');
        console.log(`LOG ID: ${doc.id}`);
        console.log(`ACTION: ${data.action}`);
        console.log(`DETAILS: ${data.details}`);
        console.log(`TIMESTAMP: ${data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp) : 'N/A'}`);
        if (data.metadata) {
          console.log('METADATA:', JSON.stringify(data.metadata, null, 2));
        }
      }
    }

    // Let's also check product_approval_requests which might hold a copy
    const reqRef = db.collection('product_approval_requests');
    const qReq = await reqRef.get();
    console.log(`Found ${qReq.size} approval requests.`);
    for (const doc of qReq.docs) {
      const data = doc.data();
      const str = JSON.stringify(data).toLowerCase();
      if (
        str.includes('carregador') || 
        str.includes('cfr') || 
        str.includes('crf') || 
        str.includes('fae') || 
        str.includes('feller') ||
        str.includes('disco')
      ) {
        console.log('================= APPROVAL REQUEST =================');
        console.log(`REQUEST ID: ${doc.id}`);
        console.log(`STATUS: ${data.is_pending ? 'PENDING' : 'APPROVED/REJECTED'}`);
        console.log(`SUBMITTED BY: ${data.submitted_by_name}`);
        console.log(`DATA:`, JSON.stringify(data, null, 2));
      }
    }

    console.log('--- ADMIN QUERY END ---');
    process.exit(0);
  } catch (err: any) {
    console.error('Error querying admin database:', err);
    process.exit(1);
  }
}

run();
