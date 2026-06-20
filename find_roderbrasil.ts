import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { getFirestore } from 'firebase-admin/firestore';

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));

let credential: admin.credential.Credential | undefined;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const saStr = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    const sa = saStr.startsWith('{') ? JSON.parse(saStr) : JSON.parse(Buffer.from(saStr, 'base64').toString('ascii'));
    credential = admin.credential.cert(sa);
  } catch (e) {}
}

let adminApp: admin.app.App;
if (admin.apps.length === 0) {
  adminApp = admin.initializeApp({
    projectId: config.projectId,
    credential
  });
} else {
  adminApp = admin.app();
}

const db = getFirestore(adminApp, config.firestoreDatabaseId || '(default)');

async function findRoder() {
  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(doc => {
    const data = doc.data();
    if (data.email?.toLowerCase().includes('roderbrasil@gmail.com')) {
      console.log("Found User:", JSON.stringify({ id: doc.id, ...data }, null, 2));
    }
  });
}

findRoder();
