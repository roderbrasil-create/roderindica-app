import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 3D CAD Render SVG representation of Garra Traçadora GT 400X (Roder yellow and dark steel)
const svgImage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1200" height="600">
  <rect width="1200" height="600" fill="#ffffff"/>
  
  <g transform="translate(150, 40) scale(0.85)">
    <!-- Main Frame Body -->
    <path d="M 450 150 L 680 150 L 720 220 L 880 250 L 920 380 L 880 480 L 750 510 L 650 440 L 520 420 L 420 320 Z" fill="#2c3036" stroke="#1a1d20" stroke-width="4"/>
    
    <!-- Top Mounting Flange -->
    <rect x="480" y="90" width="220" height="60" rx="8" fill="#3a3f47" stroke="#1a1d20" stroke-width="4"/>
    <circle cx="590" cy="120" r="22" fill="#ffd700" stroke="#1a1d20" stroke-width="3"/>
    <circle cx="530" cy="110" r="6" fill="#1a1d20"/>
    <circle cx="650" cy="110" r="6" fill="#1a1d20"/>
    <circle cx="530" cy="130" r="6" fill="#1a1d20"/>
    <circle cx="650" cy="130" r="6" fill="#1a1d20"/>

    <!-- Grapple Arms (Pinças) Left -->
    <path d="M 420 320 C 350 350 280 440 320 520 C 350 570 480 580 580 530 C 530 510 440 480 410 430 C 390 390 410 350 420 320 Z" fill="#22252a" stroke="#111315" stroke-width="4"/>
    <path d="M 400 360 C 340 400 320 480 370 530 C 440 500 480 450 430 400 Z" fill="#181a1d"/>
    
    <!-- Inner Teeth Profile -->
    <path d="M 390 440 L 410 450 L 400 465 L 420 475 L 410 490 L 430 500 L 420 515 L 450 525" fill="none" stroke="#ffd700" stroke-width="4"/>

    <!-- Roder Brand Yellow Badge -->
    <g transform="translate(390, 420) rotate(-12)">
      <rect x="0" y="0" width="130" height="42" rx="4" fill="#111315" stroke="#ffd700" stroke-width="3"/>
      <text x="12" y="29" font-family="'Arial Black', sans-serif" font-weight="900" font-size="24" fill="#ffd700" font-style="italic">Roder</text>
    </g>

    <!-- Hydraulic Cylinder Arms -->
    <rect x="480" y="260" width="180" height="35" rx="6" fill="#4a505a" stroke="#1a1d20" stroke-width="3" transform="rotate(15 480 260)"/>
    <rect x="520" y="270" width="190" height="18" fill="#d0d5dd" stroke="#4a505a" stroke-width="2" transform="rotate(15 480 260)"/>

    <!-- Saw Housing (Caixa do Traçador / Sabre) Right -->
    <path d="M 680 220 L 920 250 L 960 360 L 890 460 L 760 480 Z" fill="#383d45" stroke="#1a1d20" stroke-width="4"/>
    
    <!-- Yellow Protection Shield (Proteção Amarela da Serra) -->
    <path d="M 850 380 L 960 360 L 980 440 L 860 480 Z" fill="#ffcc00" stroke="#d4a000" stroke-width="4"/>
    <path d="M 860 390 L 950 375 L 965 430 L 870 465 Z" fill="#ffd700"/>

    <!-- Hydraulic Motor Parker (Motor de Pistão Parker 60cc) -->
    <rect x="780" y="320" width="70" height="90" rx="8" fill="#1f2328" stroke="#111315" stroke-width="3"/>
    <circle cx="815" cy="350" r="18" fill="#383d45"/>
    <path d="M 760 340 L 780 340 M 760 360 L 780 360 M 760 380 L 780 380" stroke="#ffcc00" stroke-width="5" stroke-linecap="round"/>

    <!-- Hydraulic Valve Block & Hoses -->
    <rect x="740" y="240" width="90" height="50" rx="4" fill="#2a2e34" stroke="#1a1d20" stroke-width="2"/>
    <path d="M 750 250 Q 720 280 780 320" fill="none" stroke="#111315" stroke-width="6"/>
    <path d="M 770 250 Q 740 290 800 320" fill="none" stroke="#111315" stroke-width="6"/>
    <path d="M 790 250 Q 760 300 820 320" fill="none" stroke="#111315" stroke-width="6"/>

    <!-- Saw Bar (Sabre 45") Slot Preview -->
    <path d="M 880 450 L 1020 520 L 1000 535 L 860 465 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
    <circle cx="1005" cy="525" r="8" fill="#64748b"/>

    <!-- GT 400X Model Label -->
    <g transform="translate(620, 180)">
      <rect x="0" y="0" width="160" height="36" rx="6" fill="#ffcc00" stroke="#111315" stroke-width="2"/>
      <text x="80" y="24" font-family="'Arial Black', sans-serif" font-weight="900" font-size="20" fill="#111315" text-anchor="middle">GT 400X</text>
    </g>
  </g>
</svg>`;

const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgImage)}`;

async function run() {
  try {
    const fileId = 'gt400x_cad_render_file';
    console.log('1. Creating app_files document for GT 400X image...');
    await setDoc(doc(db, 'app_files', fileId), {
      name: 'GT_400X_CAD_Render.svg',
      type: 'image/svg+xml',
      data: dataUrl,
      created_at: new Date().toISOString()
    });
    console.log('Created app_files/', fileId);

    console.log('2. Updating Garra Traçadora product document in Firestore...');
    const productRef = doc(db, 'products', 'lvtZFB8k19scU7RGQcf3');
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const pData = productSnap.data();
      let models = pData.models || [];
      
      const gt400Model = {
        id: 'gt-400x',
        name: 'GT 400X',
        base_value: 0,
        pdf_url: 'https://drive.google.com/file/d/1x4DAQf12IwUtdqBAVjE03EWJomex7OmJ/view?usp=drive_link',
        video_url: 'https://youtube.com/shorts/Z7-3cheDGSI?si=jh-RMEaw5F_WZcLm',
        parts_manual_url: '',
        image_zoom: 1,
        images: [`db-file://${fileId}`],
        technical_specs: {
          maquina_base: '10 a 22 ton',
          peso: '825 kg',
          pressao: '240 bar',
          vazao: '125 a 210 L/min',
          area_carga: '0,40',
          corrente: '3/4"',
          motor: 'Pistão Parker 60cc',
          sabre: '45"',
          abertura_maxima: '',
          diametro_corte: '',
          diametro_minimo: '',
          peso_operacional: '',
          pressao_trabalho: ''
        }
      };

      // Replace or insert GT 400X
      const existingIdx = models.findIndex((m: any) => m.id === 'gt-400x' || m.name === 'GT 400X');
      if (existingIdx !== -1) {
        models[existingIdx] = gt400Model;
      } else {
        // Insert after GT 360
        const gt360Idx = models.findIndex((m: any) => m.id === 'gt-360');
        if (gt360Idx !== -1) {
          models.splice(gt360Idx + 1, 0, gt400Model);
        } else {
          models.push(gt400Model);
        }
      }

      await updateDoc(productRef, { models, updated_at: new Date().toISOString() });
      console.log('Successfully updated Garra Traçadora models in Firestore! Current models:', models.map((m: any) => m.name));
    } else {
      console.error('Product Garra Traçadora not found in Firestore');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error running script:', err);
    process.exit(1);
  }
}

run();
