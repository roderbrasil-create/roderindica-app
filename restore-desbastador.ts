import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const defSpecs: Record<string, any> = {
  'fae-bl0-ex': {
    peso_do_equipamento: '290 a 325',
    maquina_base: '2 a 4 Ton.',
    pressao: '180 a 250',
    vazao: '50 a 90',
    diametro_max_trituracao: '80 mm (8 cm)',
    tipo_dente: 'Mini BL (Bite Limiter) / Lâmina ou Martelo Vídea (Fixo)'
  },
  'fae-pml-ex': {
    peso_do_equipamento: '190 a 210',
    maquina_base: '1.5 a 5.5 Ton.',
    pressao: '150 a 220',
    vazao: '20 a 90',
    diametro_max_trituracao: '50 mm (5 cm)',
    tipo_dente: 'Mini PML Lâminas Y ou Martelos PML'
  },
  'fae-bl1-ex-vt': {
    peso_do_equipamento: '350 a 410',
    maquina_base: '4 a 8 Ton.',
    pressao: '180 a 350',
    vazao: '50 a 140',
    diametro_max_trituracao: '120 mm (12 cm)',
    tipo_dente: 'Mini BL (Bite Limiter) dentes fixos planos com Vídea'
  },
  'fae-dml-hy': {
    peso_do_equipamento: '490 a 590',
    maquina_base: '5 a 13 Ton.',
    pressao: '200 a 350',
    vazao: '50 a 160',
    diametro_max_trituracao: '120 mm (12 cm)',
    tipo_dente: 'Dentes cilíndricos tipo E com Vídea'
  },
  'fae-bl2-ex-vt': {
    peso_do_equipamento: '645 a 750',
    maquina_base: '8 a 14 Ton.',
    pressao: '200 a 350',
    vazao: '80 a 150',
    diametro_max_trituracao: '150 mm (15 cm)',
    tipo_dente: 'Dentes fixos planos de Vídea com tecnologia Bite Limiter'
  },
  'fae-bl3-ex-vt': {
    peso_do_equipamento: '1050 a 1250',
    maquina_base: '14 a 20 Ton.',
    pressao: '220 a 350',
    vazao: '100 a 200',
    diametro_max_trituracao: '200 mm (20 cm)',
    tipo_dente: 'Dentes fixos BL3 de Vídea tipo plano com limitador'
  },
  'fae-uml-ex-vt': {
    peso_do_equipamento: '1100 a 1350',
    maquina_base: '14 a 20 Ton.',
    pressao: '220 a 350',
    vazao: '110 a 220',
    diametro_max_trituracao: '200 mm (20 cm)',
    tipo_dente: 'Dentes fixos de Vídea tipo C/3 ou dente Blade C/3/W'
  },
  'fae-uml-s-ex-vt': {
    peso_do_equipamento: '1340 a 1580',
    maquina_base: '18 a 25 Ton.',
    pressao: '220 a 350',
    vazao: '120 a 250',
    diametro_max_trituracao: '250 mm (25 cm)',
    tipo_dente: 'Dentes fixos de Vídea tipo C/3 ou dente Blade C/3/W'
  },
  'fae-umm-ex-vt': {
    peso_do_equipamento: '1550 a 1880',
    maquina_base: '20 a 30 Ton.',
    pressao: '220 a 350',
    vazao: '150 a 300',
    diametro_max_trituracao: '300 mm (30 cm)',
    tipo_dente: 'Dentes fixos de Vídea tipo C/3 ou dente HD'
  }
};

async function run() {
  try {
    // 1. Get all file docs
    const snapshotFiles = await getDocs(collection(db, 'app_files'));
    const files: any[] = [];
    snapshotFiles.forEach(doc => {
      const data = doc.data();
      files.push({ id: doc.id, ...data });
    });
    
    // Sort by created_at descending so we process most recent ones first
    files.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    
    // 2. Fetch the products collection to find the target product
    const snapshotProducts = await getDocs(collection(db, 'products'));
    let desbastadorDocId: string | null = null;
    let desbastadorData: any = null;
    
    snapshotProducts.forEach(doc => {
      const data = doc.data();
      if (data.name && data.name.includes('Desbastador Florestal FAE')) {
        desbastadorDocId = doc.id;
        desbastadorData = data;
      }
    });
    
    if (!desbastadorDocId || !desbastadorData) {
      console.error('Target product not found in products collection!');
      process.exit(1);
    }
    
    console.log(`Found Desbastador Product Document ID: ${desbastadorDocId}`);
    
    // 3. For each of the models, find corresponding uploads and assign them
    const updatedModels = desbastadorData.models.map((model: any) => {
      const mId = model.id;
      console.log(`\nProcessing model: ${mId} (${model.name})`);
      
      const prefix = `img-triturador-debastador-${mId}`;
      const matchedUploads = files.filter(f => f.name && f.name.toLowerCase().startsWith(prefix));
      
      let imagesList: string[] = [];
      if (matchedUploads.length > 0) {
        console.log(`Found ${matchedUploads.length} uploaded images in app_files for ${mId}`);
        // Map them to the db-file URL format
        imagesList = matchedUploads.map(f => `db-file://${f.id}`);
      } else {
        console.log(`No uploads found in app_files for ${mId}, keeping existing or default images.`);
        imagesList = model.images || [];
      }
      
      // Restore specifications
      const restoredSpecs = {
        ...(model.technical_specs || {}),
        ...(defSpecs[mId] || {})
      };
      
      return {
        ...model,
        images: imagesList,
        technical_specs: restoredSpecs
      };
    });
    
    // 4. Update core product with recovered models
    const updatedProduct = {
      ...desbastadorData,
      models: updatedModels
    };
    
    await updateDoc(doc(db, 'products', desbastadorDocId), updatedProduct);
    console.log(`\nSUCCESSFULLY RESTORED ALL IMAGES AND TECHNICAL SPECS FOR ALL DESBASTADOR MODELS!`);
    
    process.exit(0);
  } catch (err: any) {
    console.error('Error during restoration script:', err);
    process.exit(1);
  }
}
run();
