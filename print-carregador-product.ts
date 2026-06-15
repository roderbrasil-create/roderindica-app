import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const snapshotProducts = await getDocs(collection(db, 'products'));
    let carregadorData: any = null;
    let carregadorId: string | null = null;
    snapshotProducts.forEach(doc => {
      const data = doc.data();
      if (data.name && data.name.toLowerCase().includes('carregador frontal')) {
        carregadorData = data;
        carregadorId = doc.id;
      }
    });

    if (carregadorData) {
      console.log(`Found Carregador Frontal Product Document ID: ${carregadorId}`);
      console.log(JSON.stringify(carregadorData, null, 2));
    } else {
      console.log('Carregador Frontal product not found!');
    }
    process.exit(0);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
}
run();
