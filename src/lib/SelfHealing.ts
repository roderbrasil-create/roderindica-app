import { doc, updateDoc } from 'firebase/firestore';

export async function runSelfHealing(data: any[], db: any) {
  try {
    // 1. DYNAMIC TRANSFER: Transfer user-uploaded loader images from Garra Florestal (ID: vUHrVyAUfk7wCYCBnP36)
    // to Carregador Frontal (ID: rJs9iYL8xvvpeX8W23Eh) and then clear Garra Florestal.
    const carregador = data.find(p => p.id === 'rJs9iYL8xvvpeX8W23Eh' || p.name?.toLowerCase() === 'carregador frontal');
    const garraFlorestalDoc = data.find(p => p.id === 'vUHrVyAUfk7wCYCBnP36' || p.name === 'Garra Florestal');

    if (garraFlorestalDoc && carregador) {
      const hasImagesToTransfer = garraFlorestalDoc.models?.some((m: any) => m.images && m.images.length > 0);
      
      if (hasImagesToTransfer) {
        console.log('[Healing] Dynamically transferring user-uploaded loader images from Garra Florestal to Carregador Frontal...');
        
        const updatedCarregadorModels = carregador.models.map((cMod: any) => {
          const cDigits = cMod.id.match(/\d+/)?.[0] || cMod.name.match(/\d+/)?.[0];
          if (!cDigits) return cMod;
          
          const matchingGarra = garraFlorestalDoc.models.find((gMod: any) => {
            const gDigits = gMod.id.match(/\d+/)?.[0] || gMod.name.match(/\d+/)?.[0];
            return gDigits === cDigits;
          });
          
          if (matchingGarra && matchingGarra.images && matchingGarra.images.length > 0) {
            console.log(`[Healing] Transferring images [${matchingGarra.images.join(', ')}] from Garra model ${matchingGarra.name} to Carregador model ${cMod.name}`);
            return {
              ...cMod,
              images: matchingGarra.images
            };
          }
          return cMod;
        });

        const updatedGarraModels = garraFlorestalDoc.models.map((gMod: any) => {
          return {
            ...gMod,
            images: []
          };
        });

        await updateDoc(doc(db, 'products', carregador.id), { models: updatedCarregadorModels });
        await updateDoc(doc(db, 'products', garraFlorestalDoc.id), { models: updatedGarraModels });
        console.log('[Healing] Transfer complete!');
      } else {
        console.log('[Healing] Garra Florestal has no images to transfer (already empty). Keeping Carregador Frontal images intact.');
      }
    }

    // 2. FELLER DE DISCO (ID: tWs5hrfbGfMFZgYdhQoC)
    const fellerDisco = data.find(p => p.id === 'tWs5hrfbGfMFZgYdhQoC' || p.name === 'Feller de Disco');
    if (fellerDisco && fellerDisco.models) {
      const cfdModel = fellerDisco.models.find((m: any) => m.id === 'cfd-40');
      // If cfdModel lacks any of the 11 Feller de Disco images, we heal/update it
      const hasAllImages = cfdModel && cfdModel.images && cfdModel.images.length === 11 && cfdModel.images.includes('db-file://63k9qMNnFSqmMIIGBZpC');
      if (cfdModel && (!cfdModel.images || !hasAllImages)) {
        console.log('[Healing] Restoring Feller de Disco CFD-40 images (including original 4 and user uploaded 7 CFD images)...');
        const updatedModels = fellerDisco.models.map((m: any) => {
          if (m.id === 'cfd-40') {
            return {
              ...m,
              images: [
                'db-file://JTro2ibSenZ3sBRy11mH',
                'db-file://Wz6c0AtZ8wMgfvPaAibp',
                'db-file://KBjTjba9VlBA5nWuVA4d',
                'db-file://m0wTGuGqtU0OgKdGfh4m',
                'db-file://63k9qMNnFSqmMIIGBZpC',
                'db-file://nEqdePRNK0mewgsIynZK',
                'db-file://phhcobly6XQP1Gme71LV',
                'db-file://FkYXlpt931ZOyGUZBO0e',
                'db-file://zN6IsNP3GK5iiCZo4JgP',
                'db-file://hAHfkaZWIF4LOhqEI0q1',
                'db-file://aphOXvH9wbR2SCergEHR'
              ]
            };
          }
          return m;
        });
        await updateDoc(doc(db, 'products', fellerDisco.id), { models: updatedModels });
      }
    }

    // 3. GARRA TRAÇADORA (ID: lvtZFB8k19scU7RGQcf3)
    const garraTracadoraDoc = data.find(p => p.id === 'lvtZFB8k19scU7RGQcf3' || p.name === 'Garra Traçadora');
    if (garraTracadoraDoc && garraTracadoraDoc.models) {
      const firstM = garraTracadoraDoc.models.find((m: any) => m.id === 'gt-280');
      if (firstM && (!firstM.images || firstM.images.length === 0)) {
        console.log('[Healing] Restoring Garra Traçadora images...');
        const updatedModels = garraTracadoraDoc.models.map((m: any) => {
          if (m.id === 'gt-280') return { ...m, images: ['db-file://T3AZpDqws1aS9URRKmJe'] };
          if (m.id === 'gt-360') return { ...m, images: ['db-file://2rLCOUnp5A4Dug6AQcwo'] };
          if (m.id === 'gt-600x') return { ...m, images: ['db-file://yoQVm6BmNbhrvYazLd9Y'] };
          if (m.id === 'gt-800x') return { ...m, images: ['db-file://UjUTN3EfcSFcfYcKGE4R'] };
          if (m.id === 'gt-1000x') return { ...m, images: ['db-file://dNRUeZKmgacnbvolRLod'] };
          return m;
        });
        await updateDoc(doc(db, 'products', garraTracadoraDoc.id), { models: updatedModels });
      }
    }

    // 5. GARRA PARA ESTUFAGEM (ID: dGofBj1FI5BTLFzUQLxh)
    const garraEstufagemDoc = data.find(p => p.id === 'dGofBj1FI5BTLFzUQLxh' || p.name === 'Garra para Estufagem');
    if (garraEstufagemDoc && garraEstufagemDoc.models) {
      const firstM = garraEstufagemDoc.models.find((m: any) => m.id === 'af-360');
      if (firstM && (!firstM.images || firstM.images.length === 0)) {
        console.log('[Healing] Restoring Garra para Estufagem images...');
        const updatedModels = garraEstufagemDoc.models.map((m: any) => {
          if (m.id === 'af-360') return { ...m, images: ['db-file://XJh1ChRCTFngAZyTjzRO'] };
          if (m.id === 'af-400') return { ...m, images: ['db-file://KoXO2lMaqpOuz3fwH3cg'] };
          if (m.id === 'af-600') return { ...m, images: ['db-file://XQuJd3avibDGSZzxmqqd'] };
          if (m.id === 'af-800') return { ...m, images: ['db-file://qmLeHCBoGCGdLaeOI0Yr'] };
          return m;
        });
        await updateDoc(doc(db, 'products', garraEstufagemDoc.id), { models: updatedModels });
      }
    }

    // 6. CABEÇOTE MULTIFUNCIONAL (ID: OZMh4Z5jp6XwpznqQJ7P)
    const cabecoteDoc = data.find(p => p.id === 'OZMh4Z5jp6XwpznqQJ7P' || p.name === 'Cabeçote Multifuncional');
    if (cabecoteDoc && cabecoteDoc.models) {
      const firstM = cabecoteDoc.models.find((m: any) => m.id === 'cmf-500');
      if (firstM && (!firstM.images || !firstM.images.some((img: string) => img.startsWith('db-file://')))) {
        console.log('[Healing] Restoring Cabeçote Multifuncional images...');
        const updatedModels = cabecoteDoc.models.map((m: any) => {
          if (m.id === 'cmf-500') return { ...m, images: ['db-file://JhZi4hwdbSDC7aEtFEPd', ...(m.images || [])] };
          if (m.id === 'cmf-800') return { ...m, images: ['db-file://DSexLnNxqOlOV4oEUGEG', ...(m.images || [])] };
          return m;
        });
        await updateDoc(doc(db, 'products', cabecoteDoc.id), { models: updatedModels });
      }
    }

    // 7. FELLER TESOURA (ID: XEr3f0xcMS0ZFYGSUgtU)
    const fellerTesouraDoc = data.find(p => p.id === 'XEr3f0xcMS0ZFYGSUgtU' || p.name === 'Feller Tesoura');
    if (fellerTesouraDoc && fellerTesouraDoc.models) {
      const cftaModel = fellerTesouraDoc.models.find((m: any) => m.id === 'cfta-60');
      if (cftaModel && (!cftaModel.images || cftaModel.images.length === 0)) {
        console.log('[Healing] Restoring Feller Tesoura images...');
        const updatedModels = fellerTesouraDoc.models.map((m: any) => {
          if (m.id === 'cfta-60') return { ...m, images: ['db-file://ZevPXPZDU5ytipCAYhto'] };
          return m;
        });
        await updateDoc(doc(db, 'products', fellerTesouraDoc.id), { models: updatedModels });
      }
    }

    // 8. DESBASTADOR FLORESTAL FAE (ID: npECpZNNE9CGENLjGwSP)
    const desbastadorDoc = data.find(p => p.id === 'npECpZNNE9CGENLjGwSP' || p.name === 'Desbastador Florestal FAE para Escavadeiras e Retroescavadeira');
    if (desbastadorDoc && desbastadorDoc.models) {
      const bl0Model = desbastadorDoc.models.find((m: any) => m.id === 'fae-bl0-ex');
      if (bl0Model && (!bl0Model.images || !bl0Model.images.some((img: string) => img.startsWith('db-file://')))) {
        console.log('[Healing] Restoring Desbastador Florestal FAE images...');
        const updatedModels = desbastadorDoc.models.map((m: any) => {
          if (m.id === 'fae-bl0-ex') return { ...m, images: ['db-file://tpaBKAFko6LXkBTbjYBr', 'db-file://YyvWLpsskmBHVznLiSSC', 'db-file://eavAWBFBYBssN8fmaCCd'] };
          if (m.id === 'fae-pml-ex') return { ...m, images: ['db-file://o250muUq0PnA7fQR5nCR', 'db-file://QsxxAqUDFJRo40oMtXpt', 'db-file://uigCh3oqg876krXWU0qa'] };
          if (m.id === 'fae-bl1-ex-vt') return { ...m, images: ['db-file://KxCghJ5QsKPTfZaoAR7R', 'db-file://4y38tfNrliO7S3VXj9nT', 'db-file://sS0Iavw9T0X4n0GDW4az', 'db-file://65MBZrx9KoO7oJ947rgS'] };
          if (m.id === 'fae-dml-hy') return { ...m, images: ['db-file://8h8pALZN9iG5fd4Q9Snb', 'db-file://mhymO2tQOxcvGSqUS4h4', 'db-file://ohgeHtitPErHqIgDMHI7'] };
          if (m.id === 'fae-bl2-ex-vt') return { ...m, images: ['db-file://US9zYchyK8uPhI2ymmd0', 'db-file://hM1qTk09k1O977KpPSSV'] };
          if (m.id === 'fae-bl3-ex-vt') return { ...m, images: ['db-file://8tiM6rH16NMur1q4xqOv', 'db-file://jw4WyK6lEiyBgjIYErPd', 'db-file://2Cj5FikMsYfxGC7kObpG'] };
          if (m.id === 'fae-uml-ex-vt') return { ...m, images: ['db-file://xH5C0o7qHCXgbPllI8hv', 'db-file://qtpHqn2BHOj2zaCRycbm', 'db-file://dxqB2PrQ4wcl6eUie2Zp', 'db-file://GuwOnI3DutvvG4fZn1h5', 'db-file://L8gy9gjs9CSUcIf2M6mA', 'db-file://Dwtp2CuoZNYB5bBIUzG4'] };
          if (m.id === 'fae-uml-s-ex-vt') return { ...m, images: ['db-file://YMeLIo2amVNuUgto0c3G', 'db-file://rorAafjsU30y9P9W2g9o', 'db-file://EueQzUxvKuDIiEwQmdpK'] };
          if (m.id === 'fae-umm-ex-vt') return { ...m, images: ['db-file://SLdlo717yZP2smStzcnJ', 'db-file://En5ZqIOVmzb1uoBm9JCn', 'db-file://tvABksEedUjzZdNWqzcr'] };
          return m;
        });
        await updateDoc(doc(db, 'products', desbastadorDoc.id), { models: updatedModels });
      }
    }
  } catch (err) {
    console.error('Self healing failed:', err);
  }
}
