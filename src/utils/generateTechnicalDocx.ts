import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  convertInchesToTwip
} from 'docx';
import { saveAs } from 'file-saver';
import { Product } from '../types';
import { EQUIPMENT_SPEC_TABLES } from '../data/equipmentManualData';

export interface TechnicalManualDocxData {
  products?: Product[];
  guidelines?: Array<{ title?: string; text?: string; category?: string }>;
  version?: string;
  generatedBy?: string;
}

export async function generateTechnicalDocx({
  products = [],
  guidelines = [],
  version = '2.2.0',
  generatedBy = 'RODER Brasil'
}: TechnicalManualDocxData = {}) {
  const brandOrange = 'EA580C';
  const slateDark = '0F172A';
  const slateGray = '475569';
  const lightBg = 'F8FAFC';
  const amberBg = 'FEF3C7';

  const createCell = (
    text: string,
    options: {
      bold?: boolean;
      color?: string;
      bgColor?: string;
      widthPercent?: number;
      fontSize?: number;
      align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    } = {}
  ) => {
    return new TableCell({
      width: options.widthPercent ? { size: options.widthPercent * 100, type: WidthType.PERCENTAGE } : undefined,
      shading: options.bgColor ? { fill: options.bgColor, type: ShadingType.CLEAR } : undefined,
      margins: {
        top: convertInchesToTwip(0.08),
        bottom: convertInchesToTwip(0.08),
        left: convertInchesToTwip(0.12),
        right: convertInchesToTwip(0.12),
      },
      children: [
        new Paragraph({
          alignment: options.align || AlignmentType.LEFT,
          children: [
            new TextRun({
              text,
              bold: options.bold || false,
              color: options.color || slateDark,
              size: options.fontSize || 18, // 18 half-pts = 9pt
              font: 'Calibri'
            })
          ]
        })
      ]
    });
  };

  const createHeaderCell = (text: string, widthPercent?: number) => {
    return createCell(text, {
      bold: true,
      color: 'FFFFFF',
      bgColor: slateDark,
      widthPercent,
      fontSize: 19
    });
  };

  const createOrangeHeaderCell = (text: string, widthPercent?: number) => {
    return createCell(text, {
      bold: true,
      color: 'FFFFFF',
      bgColor: brandOrange,
      widthPercent,
      fontSize: 19
    });
  };

  const createSectionHeader = (numberAndTitle: string, subtitle?: string) => {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        spacing: { before: 360, after: 80 },
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: numberAndTitle,
            bold: true,
            size: 26, // 13pt
            color: brandOrange,
            font: 'Calibri'
          })
        ]
      })
    ];

    if (subtitle) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 0, after: 180 },
          children: [
            new TextRun({
              text: subtitle,
              italics: true,
              size: 19, // 9.5pt
              color: slateGray,
              font: 'Calibri'
            })
          ]
        })
      );
    }

    return paragraphs;
  };

  // 1. Data arrays
  const regRulesData = [
    ['Diretor e Mentor Técnico', 'Jeferson Roder', 'Mentor, Fundador, Criador da tecnologia, Professor e Diretor Técnico. NUNCA utilizar "gerente de projeto", "gerente de projetos" ou "engenheiro".'],
    ['Gerência Comercial', 'Gislene', 'Responsável pela gestão comercial, aprovação de propostas e diretrizes de vendas.'],
    ['Triagem e Gestão de Leads', 'Luana Camargo', 'Responsável pela recepção, qualificação técnica inicial e direcionamento de leads.'],
    ['Validade de Propostas', '60 Dias', 'Validade contada a partir do momento em que o orçamento é gerado/enviado.'],
    ['Proteção de Lead', '60 Dias', 'Iniciada no envio do orçamento. Proteção exclusiva ao indicador/vendedor durante o período.'],
    ['Cálculo de Comissão', 'Base de Comissão', 'Calculada estritamente sobre a "base_commission_value". Descontos aplicados devem ser deduzidos da base antes de aplicar a alíquota.'],
    ['Aviso de Gerência', 'Alerta de Status', 'Obrigatório alerta para Gislene e Luana caso uma indicação esteja em "negociação" sem valor base de comissão definido.']
  ];

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

  // Dynamic spec tables for docx
  const equipmentSpecDocxTables = EQUIPMENT_SPEC_TABLES.map(specTable => {
    const headerCols = specTable.headers.map(h => createOrangeHeaderCell(h));
    const dataRows = specTable.rows.map((row, idx) => {
      const isEven = idx % 2 === 0;
      return new TableRow({
        children: row.map((cellText, cellIdx) =>
          createCell(cellText, {
            bold: cellIdx === 0,
            bgColor: isEven ? 'FFFFFF' : amberBg,
            fontSize: 17
          })
        )
      });
    });

    const tableElements: (Paragraph | Table)[] = [
      new Paragraph({
        spacing: { before: 240, after: 60 },
        children: [
          new TextRun({
            text: specTable.categoryTitle,
            bold: true,
            size: 22,
            color: slateDark,
            font: 'Calibri'
          })
        ]
      }),
      new Paragraph({
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({
            text: specTable.categorySubtitle,
            italics: true,
            size: 18,
            color: slateGray,
            font: 'Calibri'
          })
        ]
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: headerCols }),
          ...dataRows
        ]
      })
    ];

    if (specTable.notes && specTable.notes.length > 0) {
      specTable.notes.forEach(note => {
        tableElements.push(
          new Paragraph({
            spacing: { before: 60, after: 40 },
            children: [
              new TextRun({
                text: `• ${note}`,
                size: 16,
                italics: true,
                color: slateGray,
                font: 'Calibri'
              })
            ]
          })
        );
      });
    }

    return tableElements;
  }).flat();

  const formattedProducts = products.length > 0
    ? products.map(p => {
        const anyP = p as any;
        const code = anyP.code || (p.models && p.models.length > 0 ? p.models[0].name : 'RODER');
        const priceVal = anyP.price || (p.models && p.models.length > 0 && p.models[0].base_value ? p.models[0].base_value : undefined);
        const priceStr = priceVal ? `R$ ${Number(priceVal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sob Consulta';
        const desc = p.description || 'Equipamento florestal e de movimentação de carga Roder';
        return [
          code,
          p.name || 'Equipamento',
          p.category || 'Geral',
          priceStr,
          desc
        ];
      })
    : [];

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
6. Hidráulica: Rotator tem giro infinito 360° (pino 45mm, biela 100mm). Máquinas sem fatia extra usam kit 9000.9000.9016. Escavadeiras com Harvester de fábrica exigem conversão hidráulica e não possuem cilindro da caçamba.`;

  // Build document sections
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 20, // 10pt
            color: slateDark
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8)
            }
          }
        },
        children: [
          // TITLE HERO BANNER
          new Paragraph({
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({
                text: 'RODER BRASIL • TECNOLOGIA FLORESTAL & EQUIPAMENTOS HIDRÁULICOS',
                bold: true,
                size: 18,
                color: brandOrange,
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 0, after: 180 },
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: 'MANUAL TÉCNICO DE ENGENHARIA & BASE DE CONHECIMENTO IA',
                bold: true,
                size: 32, // 16pt
                color: slateDark,
                font: 'Calibri'
              })
            ]
          }),

          // INFO METADATA CARD (Table)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: lightBg, type: ShadingType.CLEAR },
                    margins: {
                      top: convertInchesToTwip(0.12),
                      bottom: convertInchesToTwip(0.12),
                      left: convertInchesToTwip(0.16),
                      right: convertInchesToTwip(0.16)
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Data de Emissão: ', bold: true, size: 18 }),
                          new TextRun({ text: `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}  |  `, size: 18 }),
                          new TextRun({ text: 'Versão do Manual: ', bold: true, size: 18 }),
                          new TextRun({ text: `${version}\n`, size: 18 }),
                          new TextRun({ text: 'Mentor e Diretor Técnico: ', bold: true, size: 18 }),
                          new TextRun({ text: 'JEFERSON RODER (Fundador, Mentor e Criador de toda a tecnologia)\n', size: 18 }),
                          new TextRun({ text: 'Gerência Comercial: ', bold: true, size: 18 }),
                          new TextRun({ text: 'Gislene  |  ', size: 18 }),
                          new TextRun({ text: 'Triagem e Gestão de Leads: ', bold: true, size: 18 }),
                          new TextRun({ text: 'Luana Camargo\n', size: 18 }),
                          new TextRun({ text: 'Emitido por: ', bold: true, size: 18 }),
                          new TextRun({ text: `${generatedBy} (Tabelas Completas de Todos os Equipamentos Roder)`, size: 18 })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // SECTION 1
          ...createSectionHeader('1. Estrutura Corporativa & Regras Comerciais', 'Regras de negócio e terminologias institucionais obrigatórias Roder'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Item / Parâmetro', 25),
                  createHeaderCell('Responsável / Regra', 25),
                  createHeaderCell('Detalhamento e Diretriz Obrigatória', 50)
                ]
              }),
              ...regRulesData.map((row, idx) => new TableRow({
                children: [
                  createCell(row[0], { bold: true, widthPercent: 25, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg }),
                  createCell(row[1], { bold: true, widthPercent: 25, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg }),
                  createCell(row[2], { widthPercent: 50, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg })
                ]
              }))
            ]
          }),

          // SECTION 2
          ...createSectionHeader('2. Matriz de Compatibilidade & Dimensionamento por Máquina Base', 'Regras técnicas essenciais de segurança, hidráulica e porte de máquina'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Equipamento Roder', 22),
                  createHeaderCell('Faixa de Aplicação Ideal', 28),
                  createHeaderCell('Regras Críticas & Restrições de Operação', 50)
                ]
              }),
              ...compatData.map((row, idx) => new TableRow({
                children: [
                  createCell(row[0], { bold: true, widthPercent: 22, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg }),
                  createCell(row[1], { bold: true, widthPercent: 28, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg }),
                  createCell(row[2], { widthPercent: 50, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg })
                ]
              }))
            ]
          }),

          // SECTION 3
          ...createSectionHeader('3. Tabela de Produtividade & Rendimento Operacional em Campo', 'Médias reais Roder considerando 80% de eficiência operacional (176h úteis/mês)'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createOrangeHeaderCell('Equipamento / Modelo', 30),
                  createOrangeHeaderCell('Comprimento / Operação', 24),
                  createOrangeHeaderCell('Produção Média (m³/h ou árv/h)', 22),
                  createOrangeHeaderCell('Produção Estimada Mensal (176h)', 24)
                ]
              }),
              ...prodData.map((row, idx) => new TableRow({
                children: [
                  createCell(row[0], { bold: true, widthPercent: 30, bgColor: idx % 2 === 0 ? 'FFFFFF' : amberBg }),
                  createCell(row[1], { bold: true, widthPercent: 24, bgColor: idx % 2 === 0 ? 'FFFFFF' : amberBg }),
                  createCell(row[2], { widthPercent: 22, bgColor: idx % 2 === 0 ? 'FFFFFF' : amberBg }),
                  createCell(row[3], { bold: true, widthPercent: 24, bgColor: idx % 2 === 0 ? 'FFFFFF' : amberBg })
                ]
              }))
            ]
          }),

          // SECTION 4
          ...createSectionHeader('4. Diretrizes Hidráulicas, Instalação & Retrofit', 'Alertas técnicos fundamentais para instalação em escavadeiras'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Tema Hidráulico / Configuração', 32),
                  createHeaderCell('Detalhamento Técnico e Requisito de Instalação', 68)
                ]
              }),
              ...hydraData.map((row, idx) => new TableRow({
                children: [
                  createCell(row[0], { bold: true, widthPercent: 32, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg }),
                  createCell(row[1], { widthPercent: 68, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg })
                ]
              }))
            ]
          }),

          // SECTION 5: TODAS AS TABELAS ESPECÍFICAS DE EQUIPAMENTOS
          ...createSectionHeader('5. Fichas Técnicas & Especificações Completas por Equipamento', 'Tabelas detalhadas de todas as categorias e modelos Roder (R250 a R1400, GT, CMF, Fellers, High Tip, etc.)'),
          ...equipmentSpecDocxTables,

          // SECTION 6 (Inventário do Banco de Dados se houver)
          ...(formattedProducts.length > 0 ? [
            ...createSectionHeader('6. Catálogo Dinâmico do Sistema (Banco de Dados)', 'Inventário conectado em tempo real'),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    createHeaderCell('Código', 14),
                    createHeaderCell('Equipamento', 26),
                    createHeaderCell('Categoria', 16),
                    createHeaderCell('Preço Base', 16),
                    createHeaderCell('Descrição', 28)
                  ]
                }),
                ...formattedProducts.map((row, idx) => new TableRow({
                  children: [
                    createCell(row[0], { bold: true, widthPercent: 14, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg }),
                    createCell(row[1], { bold: true, widthPercent: 26, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg }),
                    createCell(row[2], { widthPercent: 16, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg }),
                    createCell(row[3], { widthPercent: 16, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg }),
                    createCell(row[4], { widthPercent: 28, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg })
                  ]
                }))
              ]
            })
          ] : []),

          // SECTION 7 (if guidelines exist)
          ...(guidelines && guidelines.length > 0 ? [
            ...createSectionHeader('7. Diretrizes Comerciais & Aprendizados Especiais', 'Regras adicionais registradas dinamicamente no sistema'),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    createHeaderCell('Categoria', 20),
                    createHeaderCell('Título da Diretriz', 30),
                    createHeaderCell('Conteúdo / Instrução', 50)
                  ]
                }),
                ...guidelines.slice(0, 30).map((g, idx) => new TableRow({
                  children: [
                    createCell(g.category || 'Geral', { bold: true, widthPercent: 20, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg }),
                    createCell(g.title || 'Diretriz', { bold: true, widthPercent: 30, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg }),
                    createCell(g.text || '', { widthPercent: 50, bgColor: idx % 2 === 0 ? 'FFFFFF' : lightBg })
                  ]
                }))
              ]
            })
          ] : []),

          // SECTION 8: PROMPT
          ...createSectionHeader('8. Prompt do Sistema para Agentes de IA Externos', 'Copie ou importe este bloco de texto diretamente para ChatGPT, Claude, Gemini ou Google Docs'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: lightBg, type: ShadingType.CLEAR },
                    margins: {
                      top: convertInchesToTwip(0.12),
                      bottom: convertInchesToTwip(0.12),
                      left: convertInchesToTwip(0.16),
                      right: convertInchesToTwip(0.16)
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: promptText,
                            size: 18,
                            font: 'Courier New',
                            color: '1E293B'
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // FOOTER NOTE
          new Paragraph({
            spacing: { before: 360, after: 0 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Documento Oficial • RODER BRASIL EQUIPAMENTOS HIDRÁULICOS LTDA • Todos os direitos reservados.',
                italics: true,
                size: 16,
                color: slateGray
              })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `RODER_Manual_Tecnico_Base_Conhecimento_IA_${new Date().toISOString().slice(0, 10)}.docx`;
  saveAs(blob, fileName);
  return fileName;
}
