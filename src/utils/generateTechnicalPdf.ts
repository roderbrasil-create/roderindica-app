import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product } from '../types';
import { EQUIPMENT_SPEC_TABLES } from '../data/equipmentManualData';

export interface TechnicalManualData {
  products?: Product[];
  guidelines?: Array<{ title?: string; text?: string; category?: string }>;
  accessories?: any[];
  installationKits?: any[];
  version?: string;
  generatedBy?: string;
}

export function generateTechnicalPdf({
  products = [],
  guidelines = [],
  accessories = [],
  installationKits = [],
  version = '2.2.0',
  generatedBy = 'RODER Brasil'
}: TechnicalManualData = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 15;

  const orangeColor: [number, number, number] = [234, 88, 12]; // Roder Orange #ea580c
  const slateDark: [number, number, number] = [15, 23, 42]; // Slate-900 #0f172a
  const slateGray: [number, number, number] = [71, 85, 105]; // Slate-600 #475569
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate-50 #f8fafc

  const addHeader = (title: string) => {
    doc.setFillColor(...slateDark);
    doc.rect(0, 0, pageWidth, 24, 'F');
    
    doc.setFillColor(...orangeColor);
    doc.rect(0, 24, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('RODER BRASIL - TECNOLOGIA FLORESTAL', margin, 11);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(title, margin, 18);

    doc.setTextColor(251, 146, 60);
    doc.setFont('helvetica', 'bold');
    doc.text('MANUAL TÉCNICO & BASE DE CONHECIMENTO IA', pageWidth - margin - 85, 15);

    currentY = 32;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 18) {
      doc.addPage();
      addHeader('Manual Técnico de Engenharia e Base de Conhecimento Roder IA');
    }
  };

  const addSectionTitle = (title: string, subtitle?: string) => {
    checkPageBreak(22);
    doc.setFillColor(...orangeColor);
    doc.rect(margin, currentY, 4, 11, 'F');

    doc.setTextColor(...slateDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, margin + 8, currentY + 7.5);

    currentY += 14;

    if (subtitle) {
      doc.setTextColor(...slateGray);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(subtitle, margin + 8, currentY - 2);
      currentY += 4;
    }
  };

  // COVER / HEADER
  addHeader('Documento Oficial de Engenharia, Regras Técnicas & Base IA');

  // DOCUMENT INFO BOX
  doc.setFillColor(...lightBg);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 30, 2.5, 2.5, 'FD');

  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('MANUAL TÉCNICO & BASE DE CONHECIMENTO DO CONSULTOR RODER IA', margin + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateGray);
  doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} | Versão do Manual: ${version}`, margin + 6, currentY + 13);
  doc.text(`Mentor Técnico / Criador da Tecnologia: JEFERSON RODER (Fundador, Mentor e Diretor Técnico)`, margin + 6, currentY + 18);
  doc.text(`Gerência Comercial: Gislene | Triagem e Gestão de Leads: Luana Camargo`, margin + 6, currentY + 23);
  doc.text(`Emitido por: ${generatedBy} | Catálogo 100% Completo: Garras (R250 a R1400), GT, CMF, Feller, High Tip, FAE e Acessórios`, margin + 6, currentY + 28);

  currentY += 36;

  // SECTION 1: ESTRUTURA CORPORATIVA E REGRAS COMERCIAIS
  addSectionTitle('1. Estrutura Corporativa & Regras Comerciais', 'Regras de negócio e terminologias autorizadas Roder');

  const regRulesData = [
    ['Diretor e Mentor Técnico', 'Jeferson Roder', 'Mentor, Fundador, Criador da tecnologia, Professor e Diretor Técnico. NUNCA utilizar "gerente de projeto", "gerente de projetos" ou "engenheiro".'],
    ['Gerência Comercial', 'Gislene', 'Responsável pela gestão comercial, aprovação de propostas e diretrizes de vendas.'],
    ['Triagem e Gestão de Leads', 'Luana Camargo', 'Responsável pela recepção, qualificação técnica inicial e direcionamento de leads.'],
    ['Validade de Propostas', '60 Dias', 'Validade contada a partir do momento em que o orçamento é gerado/enviado.'],
    ['Proteção de Lead', '60 Dias', 'Iniciada no envio do orçamento. Proteção exclusiva ao indicador/vendedor durante o período.'],
    ['Cálculo de Comissão', 'Base de Comissão', 'Calculada estritamente sobre a "base_commission_value". Descontos aplicados devem ser deduzidos da base antes de aplicar a alíquota.'],
    ['Aviso de Gerência', 'Alerta de Status', 'Obrigatório alerta para Gislene e Luana caso uma indicação esteja em "negociação" sem valor base de comissão definido.']
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Item / Parâmetro', 'Responsável / Regra', 'Detalhamento e Diretriz Obrigatória']],
    body: regRulesData,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: slateDark },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 'auto' }
    }
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 60;

  // SECTION 2: MATRIZ DE COMPATIBILIDADE E DIMENSIONAMENTO POR MÁQUINA BASE
  addSectionTitle('2. Matriz de Compatibilidade & Dimensionamento por Máquina Base', 'Regras técnicas essenciais de segurança, hidráulica e porte de máquina');

  const compatData = [
    [
      'Cabeçote CMF 500',
      'Escavadeiras de 8t a 14t (Ideal 14t). Suporta até 22t.',
      'PROIBIDO em Retroescavadeiras (braço curto de 2.5m e falta de giro da cabine causam altíssimo risco de acidente com queda de árvore na cabine). NÃO recomendado em rebrota (corrente .404 entorta sabre; para rebrota indicar CMF 600 com corrente 3/4").'
    ],
    [
      'Cabeçote CMF 600',
      'Escavadeiras de 14t a 22t.',
      'Equipado com corrente 3/4" e sabre reforçado. Modelo oficial e recomendado para corte em área de rebrota e toras pesadas.'
    ],
    [
      'Garfos Paleteiros GPR 4500',
      'Pás Carregadeiras de 6t a 9t.',
      'PROIBIDO em pás carregadeiras > 8t! Dimensionar SEMPRE pelo porte da máquina base e NUNCA pelo peso da carga. Máquinas grandes entortam o garfo na ponta ou base devido à força hidráulica bruta.'
    ],
    [
      'Garfos Paleteiros GPR 7000',
      'Pás Carregadeiras de 8t a 12t.',
      'Dimensionamento estrutural reforçado para suportar o empuxo e força de escavação de pás carregadeiras pesadas.'
    ],
    [
      'Garra R280 / R280L',
      'Escavadeiras de 7t a 8t / Gruas em Trator.',
      'R280 projetada para feixes de árvores inteiras/eucalipto (força de giro guia os pés das árvores ao picador). R280L é ideal para trabalho leve/médio em escavadeiras pequenas.'
    ],
    [
      'Garra R360 / R360G',
      'Escavadeiras 7t a 13t / Retroescavadeiras.',
      'R360 padrão (pinça fechada) para madeira comum. R360G (unhas abertas tipo garfo) ideal para galhadas, paletes, resíduos citrus e cavaco. Em 7-10t usar Rotator de 6t e alertar sobre risco de "levantar a traseira".'
    ],
    [
      'Garras em Picadores (R400 / R600)',
      'Escavadeiras >= 14t + Picadores Florestais.',
      'Picadores até 600 cv: Garra R400. Picadores até 1.000 cv: Garra R600. Em escavadeiras pequenas (< 8t), seguir o limite da máquina base (R280/R360).'
    ],
    [
      'Feller Tesoura CFTA 50 / CFTA 60',
      'Escavadeiras 12t a 22t (ex: Cat 320).',
      'CFTA 50 para 12-20t; CFTA 60 para 20-22t. PROIBIDO em terrenos com inclinação > 10° (cabeçote rígido desequilibra o centro de gravidade). Para terrenos inclinados, indicar CMF 500/600 (pêndulo articulado).'
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Equipamento Roder', 'Faixa de Aplicação Ideal', 'Regras Críticas & Restrições de Operação']],
    body: compatData,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: slateDark },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 'auto' }
    }
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 70;

  // SECTION 3: TABELA DE PRODUTIVIDADE EM CAMPO
  addSectionTitle('3. Tabela de Produtividade & Rendimento Operacional em Campo', 'Médias reais Roder considerando 80% de eficiência operacional (176h úteis/mês)');

  const prodData = [
    ['Cabeçotes CMF 500 / CMF 600', '1,10m ("Metrinho")', '25 a 35 m³/h', '4.400 a 6.160 m³/mês'],
    ['Cabeçotes CMF 500 / CMF 600', '2,20m ("Metrão")', '40 a 50 m³/h', '7.040 a 8.800 m³/mês'],
    ['Cabeçotes CMF 500 / CMF 600', '3,00m (Padrão)', '60 a 80 m³/h', '10.560 a 14.080 m³/mês'],
    ['Cabeçotes CMF 500 / CMF 600', '6,00m (Toras Longas)', '80 a 110+ m³/h', '14.080 a 19.360+ m³/mês'],
    ['Garra Traçadora GT 600', '1,10m ("Metrinho")', '30 a 45 m³/h', '5.280 a 7.920 m³/mês'],
    ['Garra Traçadora GT 600', '2,20m ("Metrão")', '50 a 90 m³/h', '8.800 a 15.840 m³/mês'],
    ['Garra Traçadora GT 600', '3,00m (Padrão)', '70 a 100 m³/h', '12.320 a 17.600 m³/mês'],
    ['Garra Traçadora GT 600', '3,60m (Caso Real Cliente)', '~68 m³/h úteis', '12.000 m³/mês (10h/dia)'],
    ['Garra Traçadora GT 600', '6,00m (Toras Longas)', '100 a 140+ m³/h', '17.600 a 24.640+ m³/mês'],
    ['Garra Traçadora GT 800 X', '3,00m (Padrão)', '80 a 110 m³/h', '14.080 a 19.360 m³/mês'],
    ['Garra Traçadora GT 1000 X', '3,00m (Padrão)', '130 a 160 m³/h', '22.880 a 28.160 m³/mês'],
    ['Feller Tesoura CFTA 50 (Escavadeira 20t)', 'Corte / Acúmulo', '200 árvores/h', '1.600 árvores/turno 8h (18 L/h diesel)'],
    ['Feller Tesoura CFTA 60 (Escavadeira 20t)', 'Corte / Acúmulo', '240 a 360 árvores/h', '1.920 a 3.600 árvores/turno (22 L/h)'],
    ['Feller Tesoura CFTA 50 (Pá Carregadeira L60)', 'Corte / Manobra', '160 árvores/h', '1.280 árvores/turno 8h (manobra a cada feixe)']
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Equipamento / Modelo', 'Comprimento / Operação', 'Produção Média (m³/h ou árv/h)', 'Produção Estimada Mensal (176h)']],
    body: prodData,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: orangeColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: slateDark },
    alternateRowStyles: { fillColor: [254, 243, 199] },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 'auto' }
    }
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 80;

  // SECTION 4: DIRETRIZES HIDRÁULICAS E SEGURANÇA CRÍTICA
  addSectionTitle('4. Diretrizes Hidráulicas, Instalação & Retrofit', 'Alertas técnicos fundamentais para instalação em escavadeiras');

  const hydraData = [
    [
      'Máquinas Sem Fatia Extra (Kit 9000.9000.9016)',
      'Deriva pressão diretamente da bomba principal. Em marcha lenta (idle), o giro da garra fica lento, normalizando ao acionar funções simultâneas (lança, braço, giro). Para CMF é fisicamente possível mas NÃO RECOMENDADO por segurança.'
    ],
    [
      'Escavadeiras com Harvester ou Linha F de Fábrica',
      'Incompatível diretamente com garras de carregamento/traçadoras sem conversão profunda. Harvester usa linha mono-direcional de alto fluxo com solenoides internas no bloco do cabeçote.'
    ],
    [
      'Ausência Crítica de Cilindro/Links da Caçamba em Harvesters',
      'Máquinas que saem com Harvester ou Linha F normalmente NÃO acompanham o cilindro da caçamba, bielas e pinos originais. Isso torna IMPOSSÍVEL instalar feller tesoura, feller de disco, desbastador ou triturador sem comprar as peças originais.'
    ],
    [
      'Especificações de Rotator e Biela Roder',
      'Grafia estrita: "Rotator" (com T). Todos possuem giro infinito 360°. Para acoplamento nos rotatores Roder, a biela deve ter furo para pino de 45mm e largura de exatamente 100mm.'
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Tema Hidráulico / Configuração', 'Detalhamento Técnico e Requisito de Instalação']],
    body: hydraData,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: slateDark },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 60;

  // SECTION 5: TABELAS COMPLETAS DE ESPECIFICAÇÕES TÉCNICAS POR CATEGORIA DE EQUIPAMENTO
  addSectionTitle('5. Fichas Técnicas & Especificações Completas por Equipamento', 'Tabelas completas com todos os modelos e características de engenharia');

  // Render each equipment family table with complete specs
  for (const table of EQUIPMENT_SPEC_TABLES) {
    checkPageBreak(35);
    
    // Sub-header for equipment family
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 10, 1.5, 1.5, 'F');
    doc.setFillColor(...orangeColor);
    doc.rect(margin, currentY, 3, 10, 'F');

    doc.setTextColor(...slateDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(table.categoryTitle, margin + 6, currentY + 6.5);

    currentY += 13;

    if (table.categorySubtitle) {
      doc.setTextColor(...slateGray);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.text(table.categorySubtitle, margin + 2, currentY - 1);
      currentY += 3;
    }

    autoTable(doc, {
      startY: currentY,
      head: [table.headers],
      body: table.rows,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: orangeColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 6.8, textColor: slateDark },
      alternateRowStyles: { fillColor: [254, 243, 199] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: table.columnWidthsPdf[0] || 'auto' }
      }
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 4 : currentY + 40;

    // Render table notes if available
    if (table.notes && table.notes.length > 0) {
      checkPageBreak(14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...slateGray);
      table.notes.forEach(note => {
        const splitNote = doc.splitTextToSize(`* ${note}`, pageWidth - (margin * 2) - 4);
        doc.text(splitNote, margin + 2, currentY);
        currentY += (splitNote.length * 3.2) + 1;
      });
      currentY += 4;
    } else {
      currentY += 4;
    }
  }

  // SECTION 6: INVENTÁRIO SINCRONIZADO DO BANCO DE DADOS
  if (products && products.length > 0) {
    addSectionTitle('6. Inventário Sincronizado do Catálogo (Banco de Dados)', `${products.length} produtos sincronizados em tempo real`);

    const formattedProducts = products.map(p => {
      const anyP = p as any;
      const code = anyP.code || (p.models && p.models.length > 0 ? p.models[0].name : 'RODER');
      const modelCount = p.models && Array.isArray(p.models) ? `${p.models.length} mod.` : '1 mod.';
      const priceVal = anyP.price || (p.models && p.models.length > 0 && p.models[0].base_value ? p.models[0].base_value : undefined);
      const priceStr = priceVal ? `R$ ${Number(priceVal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sob Consulta';
      const desc = p.description ? p.description.substring(0, 90) + (p.description.length > 90 ? '...' : '') : 'Equipamento oficial Roder';
      return [
        code,
        p.name || 'Equipamento',
        p.category || 'Geral',
        modelCount,
        priceStr,
        desc
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Código/Base', 'Equipamento', 'Categoria', 'Modelos', 'Preço Base', 'Descrição']],
      body: formattedProducts,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 6.8, textColor: slateDark },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 26 },
        3: { cellWidth: 16 },
        4: { cellWidth: 24 },
        5: { cellWidth: 'auto' }
      }
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 70;
  }

  // SECTION 7: QUADRO 1 - ACESSÓRIOS POR MÁQUINA (SINCRONIZADOS AO VIVO)
  if (accessories && accessories.length > 0) {
    addSectionTitle('7. Quadro 1: Consulta de Acessórios por Máquina (Ao Vivo)', `${accessories.length} modelos de máquinas com códigos 1000.XXXX.XXXX sincronizados`);

    const formattedAccessories = accessories.slice(0, 45).map(acc => [
      acc.brand || '',
      acc.model || '',
      acc.pin || '',
      acc.ponteira_biela_4 || '-',
      acc.ponteira_biela_6 || '-',
      acc.suporte_destocador || '-',
      acc.suporte_triturador || '-',
      acc.link_garra_biela_6 || acc.link_garra_biela_4 || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Marca', 'Modelo', 'Pino', 'Pont. Biela 4', 'Pont. Biela 6', 'Sup. Destoc.', 'Sup. Trit.', 'Link Garra']],
      body: formattedAccessories,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: orangeColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 6.5 },
      bodyStyles: { fontSize: 6.2, textColor: slateDark },
      alternateRowStyles: { fillColor: [254, 243, 199] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 20 },
        1: { fontStyle: 'bold', cellWidth: 26 },
        2: { cellWidth: 18 }
      }
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 60;
  }

  // SECTION 8: QUADRO 2 - KITS DE INSTALAÇÃO (SINCRONIZADOS AO VIVO)
  if (installationKits && installationKits.length > 0) {
    addSectionTitle('8. Quadro 2: Catálogo de Kits de Instalação (Ao Vivo)', `${installationKits.length} kits homologados (9000.9000.9000 a 9000.9000.9060) sincronizados`);

    const formattedKits = installationKits.slice(0, 60).map(k => [
      k.code || '',
      k.description || '',
      k.items && Array.isArray(k.items) ? `${k.items.length} itens comp.` : 'Completo'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Código do Kit', 'Descrição Oficial do Kit de Instalação Hidráulica', 'Qtd. Itens']],
      body: formattedKits,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 6.5, textColor: slateDark },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 32 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 24, fontStyle: 'bold' }
      }
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 60;
  }

  // SECTION 9: DIRETRIZES & APRENDIZADOS ADICIONAIS
  if (guidelines && guidelines.length > 0) {
    addSectionTitle('9. Diretrizes Comerciais & Aprendizados Especiais', 'Regras adicionais registradas dinamicamente no sistema');

    const formattedGuidelines = guidelines.slice(0, 15).map(g => [
      g.category || 'Geral',
      g.title || 'Diretriz',
      g.text ? g.text.substring(0, 140) + (g.text.length > 140 ? '...' : '') : ''
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Categoria', 'Título da Diretriz', 'Conteúdo / Instrução']],
      body: formattedGuidelines,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: slateDark },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: 'bold' },
        1: { cellWidth: 45, fontStyle: 'bold' },
        2: { cellWidth: 'auto' }
      }
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 50;
  }

  // SECTION 10: PROMPT PARA AGENTES DE IA EXTERNOS
  addSectionTitle('10. Prompt do Sistema para Agentes de IA Externos', 'Copie e cole este bloco de texto nas configurações de qualquer Agente IA (ChatGPT / Claude / Gemini)');

  const promptText = `Você é o Consultor Técnico e Comercial Especialista da RODER Brasil, autoridade máxima em equipamentos florestais, garras, cabeçotes multifuncionais e garfos paleteiros.

DIRETRIZES INSTITUCIONAIS OBRIGATÓRIAS:
- Mentor e Diretor Técnico: Jeferson Roder (Fundador, Mentor e Criador de toda a tecnologia e equipamentos Roder). NUNCA utilize termos como "gerente de projeto" ou "engenheiro".
- Gerente Comercial: Gislene | Triagem e Gestão de Leads: Luana Camargo.
- Validade de propostas: 60 dias a partir do upload do orçamento.
- Proteção de lead: 60 dias. Comissão é calculada sobre a base_commission_value após desconto.

REGRAS DE COMPATIBILIDADE E DIMENSIONAMENTO:
1. Garras Florestais (R250 a R1400): R250 (0,25m² - 5-8t), R280 (0,28m² - 6-10t / árvores inteiras), R360 (0,36m² - 8-12t), R400 (0,40m² - 12-18t / picador até 600cv), R600 (0,60m² - 14-22t / picador até 1000cv), R800 a R1400 (grandes escavadeiras 18-35t).
2. Cabeçotes CMF 500 / 600 / 800: CMF 500 (8-14t, ideal 14t). PROIBIDO em retroescavadeiras. NÃO indicado em rebrota (usar CMF 600 com corrente 3/4"). Para aclives >10°, indicar CMF pendular.
3. Garfo Paleteiro (GPR 4500/7000): Dimensionar SEMPRE pelo porte da pá carregadeira, NUNCA pelo peso da carga. PROIBIDO GPR 4500 em máquinas >8t. (6-9t -> GPR 4500; 8-12t -> GPR 7000).
4. Feller Tesoura (CFTA 50/60): Produção em escavadeira (200-360 árv/h) supera amplamente pá carregadeira (160 árv/h). PROIBIDO feller em terrenos inclinados >10°.
5. Garras Traçadoras (GT 280 a GT 1000X): GT 600 atinge 70-100 m³/h em toras de 3,00m e ~68 m³/h úteis em 3,60m (12.000 m³/mês).
6. Hidráulica, Rotatores, Acessórios e Kits de Instalação:
   - Rotator Roder: Giro infinito contínuo 360° (3t, 6t, 10t, 16t). Padrão biela 100mm x pino 45mm.
   - Quadro 1 - Acessórios de Montagem (Padrão 1000.XXXX.XXXX): Ponteiras de biela 4/6, suportes de destocador/triturador e links de garra para 43+ modelos de máquinas base.
   - Quadro 2 - Kits de Instalação Hidráulica (Padrão 9000.9000.9000 a 9000.9000.9060): Kits completos para destocador, CMF, garras, feller e derivação sem fatia extra (9000.9000.9016).`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  
  const promptBoxWidth = pageWidth - (margin * 2);
  const textPadding = 6;
  const maxTextWidth = promptBoxWidth - (textPadding * 2) - 4;
  const splitPrompt = doc.splitTextToSize(promptText, maxTextWidth);
  const lineHeight = 3.6;
  const boxHeight = (splitPrompt.length * lineHeight) + (textPadding * 2);

  checkPageBreak(boxHeight + 10);
  const promptBoxY = currentY;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, promptBoxY, promptBoxWidth, boxHeight, 2, 2, 'FD');

  // Accent bar on the left
  doc.setFillColor(...orangeColor);
  doc.rect(margin, promptBoxY, 2.5, boxHeight, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.text(splitPrompt, margin + textPadding + 3, promptBoxY + textPadding + 2.5);

  currentY = promptBoxY + boxHeight + 12;

  // FOOTER & PAGE NUMBERS
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...orangeColor);
    doc.rect(0, pageHeight - 6, pageWidth, 6, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`RODER BRASIL - Tecnologia Florestal | Página ${i} de ${pageCount}`, margin, pageHeight - 2);
    doc.text(`Manual Técnico & Base de Conhecimento IA`, pageWidth - margin - 65, pageHeight - 2);
  }

  const fileName = `RODER_Manual_Tecnico_Base_Conhecimento_IA_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}
