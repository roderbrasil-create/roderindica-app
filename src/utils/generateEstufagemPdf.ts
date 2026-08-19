import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RODER_LOGO_BASE64 } from '../components/catalog/RoderLogo';

export interface EstufagemModelData {
  id: string;
  name: string;
  specs: {
    maquina_base: string;
    peso_operacional: string;
    area_da_garra: string;
    peso: string;
    capacidade_de_carga: string;
    giro_360?: string;
  };
  tag?: string;
}

interface GenerateEstufagemPdfOptions {
  selectedModel: EstufagemModelData;
  allModels: EstufagemModelData[];
  mainImageUrl?: string | null;
}

// Convert image URL or Data URL to Base64 with natural aspect ratio dimensions and balanced zoom
async function getLoadedImage(url: string, zoomFactor = 1.28): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (!url) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const nw = img.naturalWidth || img.width || 1200;
        const nh = img.naturalHeight || img.height || 800;
        
        // Create canvas with calibrated zoom (scale 1.28) cropped to the center to fill frame completely without cutting off edges
        const canvas = document.createElement('canvas');
        canvas.width = nw;
        canvas.height = nh;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, nw, nh);
          
          // Center zoom: crop 1/zoomFactor from center and scale back to nw, nh
          const cropW = nw / zoomFactor;
          const cropH = nh / zoomFactor;
          const srcX = (nw - cropW) / 2;
          const srcY = (nh - cropH) / 2;

          ctx.drawImage(img, srcX, srcY, cropW, cropH, 0, 0, nw, nh);
          
          resolve({
            dataUrl: canvas.toDataURL('image/jpeg', 0.95),
            width: nw,
            height: nh
          });
        } else {
          resolve(null);
        }
      } catch (err) {
        console.warn('Canvas conversion with zoom failed for PDF embed, fallbacking to direct image:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('Image load error for PDF generation:', url);
      resolve(null);
    };
    img.src = url;
  });
}

export async function generateEstufagemPdfDirect({
  selectedModel,
  allModels,
  mainImageUrl
}: GenerateEstufagemPdfOptions) {
  // Strict Single-Page A4: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // 190mm

  // Official Colors
  const redRoder: [number, number, number] = [220, 38, 38]; // #dc2626
  const slateDark: [number, number, number] = [15, 23, 42]; // #0f172a
  const slateMuted: [number, number, number] = [71, 85, 105]; // #475569
  const slateLight: [number, number, number] = [248, 250, 252]; // #f8fafc
  const white: [number, number, number] = [255, 255, 255];

  // Load the single official image with calibrated ~28% zoom (reduced by ~15% from 1.50)
  const mainImageObj = mainImageUrl ? await getLoadedImage(mainImageUrl, 1.28) : null;

  // =========================================================================
  // HEADER OFICIAL RODER BRASIL
  // =========================================================================
  doc.setFillColor(...slateDark);
  doc.rect(0, 0, pageWidth, 20, 'F');

  doc.setFillColor(...redRoder);
  doc.rect(0, 20, pageWidth, 1.6, 'F');

  // Logo Roder
  try {
    doc.addImage(RODER_LOGO_BASE64, 'PNG', margin, 3.2, 36, 14, undefined, 'FAST');
  } catch (e) {
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('RODER BRASIL', margin, 13);
  }

  // Header Right Details
  doc.setTextColor(254, 202, 202);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FICHA TÉCNICA COMERCIAL OFICIAL', pageWidth - margin, 7.5, { align: 'right' });

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}  •  Validade Comercial: 60 Dias`, pageWidth - margin, 12, { align: 'right' });
  doc.text('Ref: FT-EST-2026  •  Página Única (1/1)  •  100% Tecnologia Nacional', pageWidth - margin, 16.5, { align: 'right' });

  let currentY = 25.5;

  // =========================================================================
  // TÍTULO DO EQUIPAMENTO & MODELO ATIVO
  // =========================================================================
  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('GARRA PARA ESTUFAGEM E VAGÕES', margin, currentY);

  currentY += 4.2;
  doc.setTextColor(...redRoder);
  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'bold');
  doc.text(`SÉRIE ESPECIAL AF (FIXA) & AFG (GIRATÓRIA 360°)  |  MODELO: ${selectedModel.name}`, margin, currentY);

  currentY += 5;

  // =========================================================================
  // BLOCO SUPERIOR: IMAGEM OFICIAL COM ENQUADRAMENTO HARMONIOSO + ESPECIFICAÇÕES
  // =========================================================================
  const leftColW = 84;
  const rightColW = contentWidth - leftColW - 4; // 102mm
  const topBlockHeight = 60; // Generous height for highlighted photo

  // Left: Official Image Frame
  doc.setFillColor(...slateLight);
  doc.roundedRect(margin, currentY, leftColW, topBlockHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, leftColW, topBlockHeight, 1.5, 1.5, 'D');

  if (mainImageObj) {
    try {
      // Fit calibrated zoomed image filling the frame area nicely without exceeding borders
      const maxW = leftColW - 4;
      const maxH = topBlockHeight - 8;
      const imgRatio = mainImageObj.width / mainImageObj.height;
      let renderW = maxW;
      let renderH = maxW / imgRatio;

      if (renderH > maxH) {
        renderH = maxH;
        renderW = maxH * imgRatio;
      }

      const imgX = margin + 2 + (maxW - renderW) / 2;
      const imgY = currentY + 2 + (maxH - renderH) / 2;

      doc.addImage(mainImageObj.dataUrl, 'JPEG', imgX, imgY, renderW, renderH, undefined, 'FAST');
    } catch (e) {
      console.warn('Error embedding main image in PDF:', e);
    }
  }

  // Label under main photo
  doc.setFillColor(...slateDark);
  doc.roundedRect(margin + 3, currentY + topBlockHeight - 6.5, leftColW - 6, 4.8, 1, 1, 'F');
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.text('FOTO OFICIAL • ENGENHARIA RODER BRASIL', margin + leftColW / 2, currentY + topBlockHeight - 3.4, { align: 'center' });

  // Right Column: Application & Specific Specs
  const rightX = margin + leftColW + 4;

  // Box 1: Aplicação Operacional
  const appBoxH = 19;
  doc.setFillColor(254, 242, 242); // red-50
  doc.roundedRect(rightX, currentY, rightColW, appBoxH, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(rightX, currentY, rightColW, appBoxH, 1.5, 1.5, 'D');

  doc.setTextColor(...redRoder);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('APLICAÇÃO & OPERAÇÃO DE ALTA PERFORMANCE', rightX + 3, currentY + 4);

  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  const appText = 'Projetada para movimentação severa de toras no carregamento e estufagem de containers marítimos fechados e vagões ferroviários. O perfil compacto e mandíbulas de alta penetração maximizam a cubagem nos cantos internos com total agilidade.';
  const splitApp = doc.splitTextToSize(appText, rightColW - 6);
  doc.text(splitApp, rightX + 3, currentY + 8);

  // Box 2: Especificações Técnicas do Modelo Selecionado
  const specsY = currentY + appBoxH + 2.5;
  const specsHeight = topBlockHeight - appBoxH - 2.5;

  doc.setFillColor(...slateLight);
  doc.roundedRect(rightX, specsY, rightColW, specsHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(rightX, specsY, rightColW, specsHeight, 1.5, 1.5, 'D');

  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text(`ESPECIFICAÇÕES TÉCNICAS: ${selectedModel.name}`, rightX + 3, specsY + 4.2);

  // Grid with 6 items
  const cellW = (rightColW - 6) / 3;
  const cellH = 14;
  const specItems = [
    { label: 'MÁQUINA BASE', val: selectedModel.specs.maquina_base },
    { label: 'PESO MÁQUINA', val: selectedModel.specs.peso_operacional },
    { label: 'ÁREA ÚTIL', val: selectedModel.specs.area_da_garra },
    { label: 'PESO GARRA', val: selectedModel.specs.peso },
    { label: 'CAPACIDADE', val: selectedModel.specs.capacidade_de_carga },
    { label: 'SISTEMA GIRO', val: selectedModel.specs.giro_360?.includes('Sim') ? '360° Contínuo' : 'Fixo' }
  ];

  specItems.forEach((item, idx) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const itemX = rightX + 3 + col * cellW;
    const itemY = specsY + 6 + row * (cellH + 1.2);

    doc.setFillColor(...white);
    doc.roundedRect(itemX, itemY, cellW - 1, cellH, 0.8, 0.8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(itemX, itemY, cellW - 1, cellH, 0.8, 0.8, 'D');

    doc.setTextColor(...slateMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.2);
    doc.text(item.label, itemX + (cellW - 1) / 2, itemY + 3.2, { align: 'center' });

    doc.setTextColor(idx === 2 || idx === 5 ? redRoder[0] : slateDark[0], idx === 2 || idx === 5 ? redRoder[1] : slateDark[1], idx === 2 || idx === 5 ? redRoder[2] : slateDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    const splitVal = doc.splitTextToSize(item.val, cellW - 2);
    doc.text(splitVal, itemX + (cellW - 1) / 2, itemY + 7.8, { align: 'center' });
  });

  currentY += topBlockHeight + 4.5;

  // =========================================================================
  // SEÇÃO: MATRIZ COMPARATIVA COMPLETA (TODOS OS MODELOS AF & AFG)
  // =========================================================================
  doc.setFillColor(...slateDark);
  doc.roundedRect(margin, currentY, contentWidth, 5.2, 0.8, 0.8, 'F');
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('MATRIZ COMPARATIVA DA LINHA DE GARRAS DE ESTUFAGEM (SÉRIE AF & AFG)', margin + 3, currentY + 3.6);

  currentY += 6.5;

  const tableRows = allModels.map((m) => {
    const isSelected = m.id === selectedModel.id;
    return [
      isSelected ? `${m.name} *` : m.name,
      m.specs.maquina_base,
      m.specs.peso_operacional,
      m.specs.area_da_garra,
      m.specs.peso,
      m.specs.capacidade_de_carga,
      m.specs.giro_360?.includes('Sim') ? 'SIM (360°)' : 'FIXO'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Modelo', 'Máquina Indicada', 'Peso Mín. Máquina', 'Área Útil', 'Peso Próprio', 'Capacidade Carga', 'Giro 360°']],
    body: tableRows,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: slateDark,
      textColor: white,
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'center',
      cellPadding: 1.6
    },
    bodyStyles: {
      fontSize: 6.2,
      textColor: slateDark,
      cellPadding: 1.6,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 26 },
      1: { halign: 'left', cellWidth: 48 },
      2: { cellWidth: 24 },
      3: { fontStyle: 'bold', textColor: redRoder, cellWidth: 20 },
      4: { cellWidth: 22 },
      5: { fontStyle: 'bold', cellWidth: 25 },
      6: { fontStyle: 'bold', cellWidth: 25 }
    },
    didParseCell: (data) => {
      const rowIndex = data.row.index;
      if (data.section === 'body' && allModels[rowIndex]?.id === selectedModel.id) {
        data.cell.styles.fillColor = [254, 226, 226]; // red-100 highlight
        data.cell.styles.textColor = [15, 23, 42];
        if (data.column.index === 0) {
          data.cell.styles.textColor = redRoder;
        }
      }
    }
  });

  const lastTableY = (doc as any).lastAutoTable?.finalY || currentY + 38;
  currentY = lastTableY + 3.5;

  // =========================================================================
  // SEÇÃO: INSTALAÇÃO HIDRÁULICA & DIRETRIZ CRÍTICA DE DIMENSIONAMENTO
  // =========================================================================
  const textColW = (contentWidth - 4) / 2; // 93mm
  const textBlockH = 43;

  // Box Left: Instalação Hidráulica
  doc.setFillColor(...slateLight);
  doc.roundedRect(margin, currentY, textColW, textBlockH, 1.2, 1.2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, textColW, textBlockH, 1.2, 1.2, 'D');

  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('REQUISITOS DE INSTALAÇÃO HIDRÁULICA', margin + 3.5, currentY + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(...slateDark);
  const hydraIntro = 'A máquina base (Empilhadeira ou Pá Carregadeira) deve possuir linhas hidráulicas proporcionais à função da garra:';
  doc.text(doc.splitTextToSize(hydraIntro, textColW - 7), margin + 3.5, currentY + 8.5);

  // Sub item AF
  doc.setFillColor(...white);
  doc.roundedRect(margin + 3.5, currentY + 14.5, textColW - 7, 11, 0.8, 0.8, 'F');
  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.text('• Garras Fixas (Série AF): 3ª Função Padrão (2 vias)', margin + 5, currentY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.3);
  doc.text('Aciona abertura e fechamento. Indicada para movimentação e estufagem linear.', margin + 5, currentY + 22.5);

  // Sub item AFG
  doc.setFillColor(...white);
  doc.roundedRect(margin + 3.5, currentY + 27, textColW - 7, 13.5, 0.8, 0.8, 'F');
  doc.setTextColor(...redRoder);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.text('• Garras Giratórias (Série AFG): 3ª e 4ª Funções (4 vias)', margin + 5, currentY + 31);
  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.3);
  const afgText = 'A 3ª função aciona o abre/fecha e a 4ª função aciona o rotator 360° contínuo para manobras de alinhamento em espaços reduzidos.';
  doc.text(doc.splitTextToSize(afgText, textColW - 10), margin + 5, currentY + 35.5);

  // Box Right: Diretriz Crítica de Dimensionamento
  const textRightX = margin + textColW + 4;

  doc.setFillColor(254, 242, 242);
  doc.roundedRect(textRightX, currentY, textColW, textBlockH, 1.2, 1.2, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(textRightX, currentY, textColW, textBlockH, 1.2, 1.2, 'D');

  doc.setTextColor(...redRoder);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('DIRETRIZ CRÍTICA DE DIMENSIONAMENTO & SEGURANÇA', textRightX + 3.5, currentY + 4.2);

  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  const sizingText = 'O modelo AF-360 é calibrado sob medida para Empilhadeiras de 2,4t a 4,0t, mantendo a estabilidade dinâmica do centro de gravidade e evitando tombamentos no pátio.\n\nPara Pás Carregadeiras e pátios de alto volume, os modelos AF-600, AFG-600 e AFG-800 garantem robustez e máxima produtividade em operação de 3 turnos.';
  doc.text(doc.splitTextToSize(sizingText, textColW - 7), textRightX + 3.5, currentY + 9);

  // Roder Kit Box
  doc.setFillColor(...white);
  doc.roundedRect(textRightX + 3.5, currentY + 28, textColW - 7, 12.5, 0.8, 0.8, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(textRightX + 3.5, currentY + 28, textColW - 7, 12.5, 0.8, 0.8, 'D');

  doc.setTextColor(...redRoder);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.text('Kit de Instalação Hidráulica Roder Brasil:', textRightX + 5, currentY + 32.5);
  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.3);
  doc.text('Fornecemos blocos, chicotes elétricos e joystick para todas as marcas de máquinas.', textRightX + 5, currentY + 37);

  currentY += textBlockH + 3.5;

  // =========================================================================
  // SEÇÃO: PILARES DE ENGENHARIA & QUALIDADE CONSTRUTIVA
  // =========================================================================
  const qualColW = (contentWidth - 6) / 4;
  const qualItems = [
    { title: 'Aço de Alta Resistência', desc: 'Estrutura blindada contra fadiga e torção contínua de feixes de toras.' },
    { title: 'Pinos Termotratados', desc: 'Buchas de alta durabilidade com graxeiras de fácil acesso para engraxe.' },
    { title: 'Cilindros Blindados', desc: 'Hastes protegidas contra impactos mecânicos diretos de toras soltas.' },
    { title: 'Engenharia & Suporte 100%', desc: 'Garantia de fábrica e pronta entrega de componentes em todo o Brasil.' }
  ];

  qualItems.forEach((item, idx) => {
    const qX = margin + idx * (qualColW + 2);
    doc.setFillColor(...white);
    doc.roundedRect(qX, currentY, qualColW, 14, 0.8, 0.8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(qX, currentY, qualColW, 14, 0.8, 0.8, 'D');

    doc.setTextColor(22, 163, 74);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('✓', qX + 2.5, currentY + 4.5);

    doc.setTextColor(...slateDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(item.title, qX + 6.5, currentY + 4.5);

    doc.setTextColor(...slateMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.9);
    const splitDesc = doc.splitTextToSize(item.desc, qualColW - 5);
    doc.text(splitDesc, qX + 2.5, currentY + 8);
  });

  // =========================================================================
  // RODAPÉ OFICIAL (PÁGINA ÚNICA)
  // =========================================================================
  const footerY = pageHeight - 9;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setTextColor(...slateMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.text('RODER BRASIL INDUSTRIAL LTDA  •  www.roderbrasil.com.br  •  comercial@roderbrasil.com.br  •  (15) 3524-1111', margin, footerY + 1.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Ficha Técnica Oficial Ref: FT-EST-2026  •  Página 1 de 1', pageWidth - margin, footerY + 1.5, { align: 'right' });

  // Save the single-page PDF directly
  const cleanModelName = selectedModel.name.replace(/\s+/g, '_');
  doc.save(`Ficha_Tecnica_Garra_Estufagem_${cleanModelName}.pdf`);
}
