import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const snapshotFiles = await getDocs(collection(db, 'app_files'));
    const files: any[] = [];
    snapshotFiles.forEach(doc => {
      const data = doc.data();
      files.push({ id: doc.id, ...data });
    });
    
    files.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    
    console.log('=== EXACT RECENT UPLOADS MAP ===');
    const modelImages: Record<string, string[]> = {};
    
    files.forEach(f => {
      if (f.name && f.name.toLowerCase().startsWith('img-triturador-debastador-')) {
        // Extract model id
        // Format: img-triturador-debastador-fae-bl0-ex.jpg.webp or img-triturador-debastador-fae-bl0-ex-01.jpg.webp
        const modelIdPart = f.name.toLowerCase().replace('img-triturador-debastador-', '');
        // We find the model ID by matching prefixes of defSpecs
        const knownModelIds = [
          'fae-bl0-ex', 'fae-pml-ex', 'fae-bl1-ex-vt', 'fae-dml-hy',
          'fae-bl2-ex-vt', 'fae-bl3-ex-vt', 'fae-uml-ex-vt', 'fae-uml-s-ex-vt',
          'fae-umm-ex-vt'
        ];
        
        const matchedId = knownModelIds.find(id => modelIdPart.startsWith(id));
        if (matchedId) {
          if (!modelImages[matchedId]) modelImages[matchedId] = [];
          modelImages[matchedId].push(`db-file://${f.id}`);
        }
      }
    });
    
    console.log(JSON.stringify(modelImages, null, 2));
    process.exit(0);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
}
run();
