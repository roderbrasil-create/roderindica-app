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

async function check() {
  const emailSettings = await db.collection('settings').doc('email').get();
  console.log("Email Settings Exists:", emailSettings.exists);
  if (emailSettings.exists) {
    console.log("Email Settings Data:", JSON.stringify(emailSettings.data(), null, 2));
  }

  const notifSettings = await db.collection('settings').doc('notifications').get();
  console.log("Notification Settings Exists:", notifSettings.exists);
  if (notifSettings.exists) {
    console.log("Notification Settings Data:", JSON.stringify(notifSettings.data(), null, 2));
  }
}

check().catch(console.error);
