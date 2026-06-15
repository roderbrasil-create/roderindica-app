import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    // 1. Fetch all products and their model image references
    const snapshotProducts = await getDocs(collection(db, 'products'));
    const referencedFileIds = new Set<string>();
    
    snapshotProducts.forEach(doc => {
      const data = doc.data();
      // Add product level image
      if (data.image_url && data.image_url.startsWith('db-file://')) {
        referencedFileIds.add(data.image_url.replace('db-file://', ''));
      }
      if (data.models && Array.isArray(data.models)) {
        data.models.forEach((m: any) => {
          if (m.images && Array.isArray(m.images)) {
            m.images.forEach((img: string) => {
              if (img && img.startsWith('db-file://')) {
                referencedFileIds.add(img.replace('db-file://', ''));
              }
            });
          }
        });
      }
    });

    console.log(`Currently active db-file references inside products:`, Array.from(referencedFileIds));

    // 2. Fetch all files from app_files
    const snapshotFiles = await getDocs(collection(db, 'app_files'));
    const allFiles: any[] = [];
    snapshotFiles.forEach(doc => {
      const data = doc.data();
      allFiles.push({
        id: doc.id,
        name: data.name,
        created_at: data.created_at,
        type: data.type
      });
    });

    // Sort newest first
    allFiles.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    console.log(`\n=== ORPHANED IMAGE FILES (Not currently referenced in any product) ===`);
    let orphanedCount = 0;
    allFiles.forEach(f => {
      if (!referencedFileIds.has(f.id) && f.type.startsWith('image/')) {
        orphanedCount++;
        console.log(`ID: "${f.id}" | NAME: "${f.name}" | CREATED: "${f.created_at}" | TYPE: "${f.type}"`);
      }
    });

    console.log(`\nTotal orphaned images found: ${orphanedCount}`);
    process.exit(0);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
}
run();
