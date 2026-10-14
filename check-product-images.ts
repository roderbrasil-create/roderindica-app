import admin from "firebase-admin";
import { getFirestore } from 'firebase-admin/firestore';
import fs from "fs";
import path from "path";

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: config.projectId,
    credential: admin.credential.applicationDefault()
  });
}

const db = getFirestore(admin.app(), config.firestoreDatabaseId || '(default)');

async function checkImages() {
  console.log("Checking product images...");
  const snap = await db.collection('products').get();
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`Product: ${data.name}`);
    console.log(`  Main Image: ${data.image_url}`);
    if (data.models) {
      data.models.forEach((m: any) => {
        console.log(`    Model: ${m.name}`);
        console.log(`      Images: ${JSON.stringify(m.images)}`);
      });
    }
    console.log("---");
  });
}

checkImages().catch(console.error);
