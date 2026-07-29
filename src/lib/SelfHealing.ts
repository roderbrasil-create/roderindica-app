import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';

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
    const desbastadorDoc = data.find(p => p.id === 'npECpZNNE9CGENLjGwSP' || p.name === 'Desbastador Florestal FAE para Escavadeiras e Retroescavadeira' || p.name?.toLowerCase().includes('desbastador florestal fae'));
    if (desbastadorDoc && desbastadorDoc.models) {
      const bl0Model = desbastadorDoc.models.find((m: any) => m.id === 'fae-bl0-ex');
      const needsSpecsHealing = desbastadorDoc.models.some((m: any) => !m.technical_specs || !m.technical_specs.peso_do_equipamento || !m.technical_specs.diametro_max_trituracao);
      const needsImagesHealing = bl0Model && (!bl0Model.images || !bl0Model.images.some((img: string) => img.startsWith('db-file://')));

      if (needsSpecsHealing || needsImagesHealing) {
        console.log('[Healing] Restoring Desbastador Florestal FAE technical_specs & images...');
        const defaultFaeSpecs: Record<string, any> = {
          'fae-bl0-ex': { peso_do_equipamento: '290 a 325 kg', maquina_base: '2 a 4 Ton.', pressao: '180 a 250 bar', vazao: '50 a 90 L/min', diametro_max_trituracao: '80 mm (8 cm)', tipo_dente: 'Mini BL (Bite Limiter) / Lâmina ou Martelo Vídea (Fixo)' },
          'fae-pml-ex': { peso_do_equipamento: '190 a 210 kg', maquina_base: '1.5 a 5.5 Ton.', pressao: '150 a 220 bar', vazao: '20 a 90 L/min', diametro_max_trituracao: '50 mm (5 cm)', tipo_dente: 'Mini PML Lâminas Y ou Martelos PML' },
          'fae-bl1-ex-vt': { peso_do_equipamento: '350 a 410 kg', maquina_base: '4 a 8 Ton.', pressao: '180 a 350 bar', vazao: '50 a 140 L/min', diametro_max_trituracao: '120 mm (12 cm)', tipo_dente: 'Mini BL (Bite Limiter) dentes fixos planos com Vídea' },
          'fae-dml-hy': { peso_do_equipamento: '490 a 590 kg', maquina_base: '5 a 13 Ton.', pressao: '200 a 350 bar', vazao: '50 a 160 L/min', diametro_max_trituracao: '120 mm (12 cm)', tipo_dente: 'Dentes cilíndricos tipo E com Vídea' },
          'fae-bl2-ex-vt': { peso_do_equipamento: '645 a 750 kg', maquina_base: '8 a 14 Ton.', pressao: '200 a 350 bar', vazao: '80 a 150 L/min', diametro_max_trituracao: '150 mm (15 cm)', tipo_dente: 'Dentes fixos planos de Vídea com tecnologia Bite Limiter' },
          'fae-bl3-ex-vt': { peso_do_equipamento: '1050 a 1250 kg', maquina_base: '14 a 20 Ton.', pressao: '220 a 350 bar', vazao: '100 a 200 L/min', diametro_max_trituracao: '200 mm (20 cm)', tipo_dente: 'Dentes fixos BL3 de Vídea tipo plano com limitador' },
          'fae-uml-ex-vt': { peso_do_equipamento: '1100 a 1350 kg', maquina_base: '14 a 20 Ton.', pressao: '220 a 350 bar', vazao: '110 a 220 L/min', diametro_max_trituracao: '200 mm (20 cm)', tipo_dente: 'Dentes C/3/HD planos com Vídea' },
          'fae-uml-s-ex-vt': { peso_do_equipamento: '1350 a 1600 kg', maquina_base: '18 a 25 Ton.', pressao: '220 a 350 bar', vazao: '120 a 250 L/min', diametro_max_trituracao: '250 mm (25 cm)', tipo_dente: 'Dentes fixos de Vídea tipo C/3/HD ou dentes planos F' },
          'fae-umm-ex-vt': { peso_do_equipamento: '1700 a 1950 kg', maquina_base: '20 a 30 Ton.', pressao: '220 a 350 bar', vazao: '150 a 300 L/min', diametro_max_trituracao: '300 mm (30 cm)', tipo_dente: 'Dentes fixos reforçados tipo UMM/HD com Vídea' }
        };

        const updatedModels = desbastadorDoc.models.map((m: any) => {
          const specFallback = defaultFaeSpecs[m.id] || {};
          const mergedSpecs = { ...specFallback, ...(m.technical_specs || {}) };
          // Ensure peso_do_equipamento and diametro_max_trituracao are present
          if (specFallback.peso_do_equipamento && !m.technical_specs?.peso_do_equipamento) {
            mergedSpecs.peso_do_equipamento = specFallback.peso_do_equipamento;
          }
          if (specFallback.diametro_max_trituracao && !m.technical_specs?.diametro_max_trituracao) {
            mergedSpecs.diametro_max_trituracao = specFallback.diametro_max_trituracao;
          }

          let newImages = m.images;
          if (needsImagesHealing) {
            if (m.id === 'fae-bl0-ex') newImages = ['db-file://tpaBKAFko6LXkBTbjYBr', 'db-file://YyvWLpsskmBHVznLiSSC', 'db-file://eavAWBFBYBssN8fmaCCd'];
            if (m.id === 'fae-pml-ex') newImages = ['db-file://o250muUq0PnA7fQR5nCR', 'db-file://QsxxAqUDFJRo40oMtXpt', 'db-file://uigCh3oqg876krXWU0qa'];
            if (m.id === 'fae-bl1-ex-vt') newImages = ['db-file://KxCghJ5QsKPTfZaoAR7R', 'db-file://4y38tfNrliO7S3VXj9nT', 'db-file://sS0Iavw9T0X4n0GDW4az', 'db-file://65MBZrx9KoO7oJ947rgS'];
            if (m.id === 'fae-dml-hy') newImages = ['db-file://8h8pALZN9iG5fd4Q9Snb', 'db-file://mhymO2tQOxcvGSqUS4h4', 'db-file://ohgeHtitPErHqIgDMHI7'];
            if (m.id === 'fae-bl2-ex-vt') newImages = ['db-file://US9zYchyK8uPhI2ymmd0', 'db-file://hM1qTk09k1O977KpPSSV'];
            if (m.id === 'fae-bl3-ex-vt') newImages = ['db-file://8tiM6rH16NMur1q4xqOv', 'db-file://jw4WyK6lEiyBgjIYErPd', 'db-file://2Cj5FikMsYfxGC7kObpG'];
            if (m.id === 'fae-uml-ex-vt') newImages = ['db-file://xH5C0o7qHCXgbPllI8hv', 'db-file://qtpHqn2BHOj2zaCRycbm', 'db-file://dxqB2PrQ4wcl6eUie2Zp', 'db-file://GuwOnI3DutvvG4fZn1h5', 'db-file://L8gy9gjs9CSUcIf2M6mA', 'db-file://Dwtp2CuoZNYB5bBIUzG4'];
            if (m.id === 'fae-uml-s-ex-vt') newImages = ['db-file://YMeLIo2amVNuUgto0c3G', 'db-file://rorAafjsU30y9P9W2g9o', 'db-file://EueQzUxvKuDIiEwQmdpK'];
            if (m.id === 'fae-umm-ex-vt') newImages = ['db-file://SLdlo717yZP2smStzcnJ', 'db-file://En5ZqIOVmzb1uoBm9JCn', 'db-file://tvABksEedUjzZdNWqzcr'];
          }

          return { ...m, images: newImages, technical_specs: mergedSpecs };
        });
        await updateDoc(doc(db, 'products', desbastadorDoc.id), { models: updatedModels });
      }
    }

    // 9. FRESA FAE SSH (HEALING TECHNICAL SPECS)
    const fresaSshDoc = data.find(p => p.name === 'FRESA FAE SSH');
    if (fresaSshDoc && fresaSshDoc.models) {
      const ssh150 = fresaSshDoc.models.find((m: any) => m.id === 'fae-ssh-150' || m.id === 'ssh-150');
      if (ssh150 && (!ssh150.technical_specs || !ssh150.technical_specs.trator_hp)) {
        console.log('[Healing] Restoring FRESA FAE SSH technical_specs...');
        const updatedModels = [
          {
            id: 'fae-ssh-150',
            name: 'SSH 150',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/09/CATALOGO-TRATORES-compactado.pdf',
            video_url: 'https://youtu.be/1nEPwzt8K4k',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg'
            ],
            technical_specs: {
              trator_hp: '160 - 280 HP (CVT)',
              pto_rpm: '1000 rpm',
              largura_de_trabalho_mm: '1600 mm',
              largura_total_mm: '1980 mm',
              peso_kg: '3690 kg',
              diametro_do_rotor_mm: '900 mm',
              diametro_max_de_trituracao_mm: '700 mm (70 cm)',
              profundidade_max_de_trabalho_mm: '500 mm (50 cm)',
              numero_de_dentes: '58 + 4'
            }
          },
          {
            id: 'fae-ssh-200',
            name: 'SSH 200',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/09/CATALOGO-TRATORES-compactado.pdf',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg'
            ],
            technical_specs: {
              trator_hp: '200 - 360 (400) HP (CVT)',
              pto_rpm: '1000 rpm',
              largura_de_trabalho_mm: '2080 mm',
              largura_total_mm: '2472 mm',
              peso_kg: '4850 kg',
              diametro_do_rotor_mm: '900 mm',
              diametro_max_de_trituracao_mm: '700 mm (70 cm)',
              profundidade_max_de_trabalho_mm: '500 mm (50 cm)',
              numero_de_dentes: '78 + 4'
            }
          },
          {
            id: 'fae-ssh-225',
            name: 'SSH 225',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/09/CATALOGO-TRATORES-compactado.pdf',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg'
            ],
            technical_specs: {
              trator_hp: '200 - 360 (400) HP (CVT)',
              pto_rpm: '1000 rpm',
              largura_de_trabalho_mm: '2320 mm',
              largura_total_mm: '2712 mm',
              peso_kg: '5200 kg',
              diametro_do_rotor_mm: '900 mm',
              diametro_max_de_trituracao_mm: '700 mm (70 cm)',
              profundidade_max_de_trabalho_mm: '500 mm (50 cm)',
              numero_de_dentes: '88 + 4'
            }
          },
          {
            id: 'fae-ssh-250',
            name: 'SSH 250',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/09/CATALOGO-TRATORES-compactado.pdf',
            video_url: 'https://www.youtube.com/watch?v=na5Z2tLWMgA',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg'
            ],
            technical_specs: {
              trator_hp: '240 - 360 (400) HP (CVT)',
              pto_rpm: '1000 rpm',
              largura_de_trabalho_mm: '2560 mm',
              largura_total_mm: '2950 mm',
              peso_kg: '5600 kg',
              diametro_do_rotor_mm: '900 mm',
              diametro_max_de_trituracao_mm: '700 mm (70 cm)',
              profundidade_max_de_trabalho_mm: '500 mm (50 cm)',
              numero_de_dentes: '98 + 4'
            }
          }
        ];
        await updateDoc(doc(db, 'products', fresaSshDoc.id), { models: updatedModels });
      }
    }

    // 9. SACADOR DE ÁRVORES SAC 500
    const sacadorDoc = data.find(p => 
      p.name?.toLowerCase().includes('sacador') || 
      p.models?.some((m: any) => m.id === 'sac-500' || m.name?.toLowerCase().includes('sac 500'))
    );

    if (!sacadorDoc && db) {
      console.log('[Healing] Seeding Sacador de Árvores SAC 500 product...');
      const sacadorData = {
        name: 'Sacador de Árvores SAC 500',
        category: 'Equipamentos Florestais',
        description: 'O Sacador Florestal SAC 500 Roder/Ibiguarim é o equipamento desenvolvido para extração completa de árvores inteiras com toco e sistema radicular (raízes). Equipado com 2 cilindros hidráulicos pesados, sapata de apoio e duas placas frontais intercambiáveis (Placa Dentada para seringueira/teca e Placa em V para eucalipto), garante limpeza total do solo para preparo agrícola ou florestal com alta produtividade.',
        image_url: '',
        video_url: 'https://youtu.be/KzvgjsCeRf0?si=9l9Wf29rVg9NQ7db',
        pdf_url: 'sacador-sac-500',
        is_blocked: false,
        created_at: new Date().toISOString(),
        models: [
          {
            id: 'sac-500',
            name: 'SAC 500',
            base_value: 0,
            images: [],
            technical_specs: {
              maquina_base: 'Escavadeira de 20 a 30 t',
              peso: '1.850 kg (~2.160 kg)',
              dimensoes: '1.904 mm (A) x 1.600 mm (L) x 1.555 mm (P)',
              capacidade_diametro: 'Até 45 cm (Seringueira) | 12 a 35 cm (Eucalipto)',
              pressao_bar: '320 a 350 bar',
              vazao_lmin: '180 a 250 L/min',
              cilindros: '2 Cilindros',
              acumulador: 'Não possui'
            }
          }
        ]
      };
      await addDoc(collection(db, 'products'), sacadorData);
    }
  } catch (err) {
    console.error('Self healing failed:', err);
  }
}
