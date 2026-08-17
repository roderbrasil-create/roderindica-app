import { Product } from '../types';

export interface TechnicalManualHtmlData {
  products?: Product[];
  guidelines?: Array<{ title?: string; text?: string; category?: string }>;
  version?: string;
  generatedBy?: string;
}

export function generateTechnicalManualHtml({
  products = [],
  guidelines = [],
  version = '2.2.0',
  generatedBy = 'RODER Brasil'
}: TechnicalManualHtmlData = {}): string {
  const brandOrange = '#ea580c';
  const slateDark = '#0f172a';
  const slateGray = '#475569';
  const lightBg = '#f8fafc';
  const amberBg = '#fef3c7';
  const borderColor = '#cbd5e1';

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

  const formattedProducts = products.length > 0
    ? products.map(p => {
        const anyP = p as any;
        const code = anyP.code || (p.models && p.models.length > 0 ? p.models[0].name : 'RODER');
        const priceVal = anyP.price || (p.models && p.models.length > 0 && p.models[0].base_value ? p.models[0].base_value : undefined);
        const priceStr = priceVal ? `R$ ${Number(priceVal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sob Consulta';
        const desc = p.description || 'Equipamento florestal e de movimentação de carga Roder';
        return [code, p.name || 'Equipamento', p.category || 'Geral', priceStr, desc];
      })
    : [
        ['R280', 'Garra Florestal R280', 'Garras', 'Sob Consulta', 'Garra 0.28m³ ideal para escavadeiras de 7-8t e gruas'],
        ['CMF 500', 'Cabeçote Multifuncional CMF 500', 'Cabeçotes', 'Sob Consulta', 'Cabeçote para escavadeiras 8-14t com traçador e desgalhador'],
        ['CMF 600', 'Cabeçote Multifuncional CMF 600', 'Cabeçotes', 'Sob Consulta', 'Cabeçote reforçado com corrente 3/4" ideal para rebrota e 14-22t'],
        ['GT 600', 'Garra Traçadora GT 600', 'Garras Traçadoras', 'Sob Consulta', 'Garra traçadora 0.60m² para alto rendimento de traçamento'],
        ['GPR 4500', 'Garfo Paleteiro GPR 4500', 'Garfos Paleteiros', 'Sob Consulta', 'Garfo paleteiro para pás carregadeiras de 6 a 9t'],
        ['GPR 7000', 'Garfo Paleteiro GPR 7000', 'Garfos Paleteiros', 'Sob Consulta', 'Garfo paleteiro reforçado para pás carregadeiras de 8 a 12t'],
        ['CFTA 50', 'Feller Tesoura CFTA 50', 'Fellers', 'Sob Consulta', 'Feller tesoura para corte e acúmulo de árvores em escavadeiras 12-20t'],
        ['CFTA 60', 'Feller Tesoura CFTA 60', 'Fellers', 'Sob Consulta', 'Feller tesoura reforçado para escavadeiras 20-22t']
      ];

  const html = `
  <div style="font-family: Calibri, Arial, sans-serif; color: ${slateDark}; line-height: 1.5; max-width: 900px; margin: 0 auto;">
    <div style="border-bottom: 3px solid ${brandOrange}; padding-bottom: 12px; margin-bottom: 20px;">
      <p style="color: ${brandOrange}; font-size: 11pt; font-weight: bold; margin: 0; text-transform: uppercase;">
        RODER BRASIL • TECNOLOGIA FLORESTAL & EQUIPAMENTOS HIDRÁULICOS
      </p>
      <h1 style="color: ${slateDark}; font-size: 20pt; font-weight: bold; margin: 6px 0 0 0;">
        MANUAL TÉCNICO DE ENGENHARIA & BASE DE CONHECIMENTO IA
      </h1>
    </div>

    <div style="background-color: ${lightBg}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 10pt;">
        <strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} &nbsp;|&nbsp; 
        <strong>Versão:</strong> ${version}<br/>
        <strong>Mentor e Diretor Técnico:</strong> JEFERSON RODER (Fundador, Mentor e Criador de toda a tecnologia)<br/>
        <strong>Gerência Comercial:</strong> Gislene &nbsp;|&nbsp; <strong>Triagem de Leads:</strong> Luana Camargo<br/>
        <strong>Emitido por:</strong> ${generatedBy}
      </p>
    </div>

    <!-- 1. REGRAS -->
    <h2 style="color: ${brandOrange}; font-size: 14pt; border-bottom: 1px solid ${borderColor}; padding-bottom: 4px; margin-top: 24px;">
      1. Estrutura Corporativa & Regras Comerciais
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 9.5pt;">
      <thead>
        <tr style="background-color: ${slateDark}; color: #ffffff;">
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 25%;">Item / Parâmetro</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 25%;">Responsável / Regra</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 50%;">Detalhamento e Diretriz Obrigatória</th>
        </tr>
      </thead>
      <tbody>
        ${regRulesData.map((row, i) => `
          <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : lightBg};">
            <td style="padding: 8px 10px; border: 1px solid ${borderColor}; font-weight: bold;">${row[0]}</td>
            <td style="padding: 8px 10px; border: 1px solid ${borderColor}; font-weight: bold;">${row[1]}</td>
            <td style="padding: 8px 10px; border: 1px solid ${borderColor};">${row[2]}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- 2. COMPATIBILIDADE -->
    <h2 style="color: ${brandOrange}; font-size: 14pt; border-bottom: 1px solid ${borderColor}; padding-bottom: 4px; margin-top: 24px;">
      2. Matriz de Compatibilidade & Dimensionamento por Máquina Base
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 9.5pt;">
      <thead>
        <tr style="background-color: ${slateDark}; color: #ffffff;">
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 22%;">Equipamento Roder</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 28%;">Faixa de Aplicação Ideal</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 50%;">Regras Críticas & Restrições de Operação</th>
        </tr>
      </thead>
      <tbody>
        ${compatData.map((row, i) => `
          <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : lightBg};">
            <td style="padding: 8px 10px; border: 1px solid ${borderColor}; font-weight: bold;">${row[0]}</td>
            <td style="padding: 8px 10px; border: 1px solid ${borderColor}; font-weight: bold;">${row[1]}</td>
            <td style="padding: 8px 10px; border: 1px solid ${borderColor};">${row[2]}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- 3. PRODUTIVIDADE -->
    <h2 style="color: ${brandOrange}; font-size: 14pt; border-bottom: 1px solid ${borderColor}; padding-bottom: 4px; margin-top: 24px;">
      3. Tabela de Produtividade & Rendimento Operacional em Campo (80% Eficiência - 176h/mês)
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 9.5pt;">
      <thead>
        <tr style="background-color: ${brandOrange}; color: #ffffff;">
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 30%;">Equipamento / Modelo</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 24%;">Comprimento / Operação</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 22%;">Produção Média (m³/h ou árv/h)</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 24%;">Produção Estimada Mensal</th>
        </tr>
      </thead>
      <tbody>
        ${prodData.map((row, i) => `
          <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : amberBg};">
            <td style="padding: 8px 10px; border: 1px solid ${borderColor}; font-weight: bold;">${row[0]}</td>
            <td style="padding: 8px 10px; border: 1px solid ${borderColor}; font-weight: bold;">${row[1]}</td>
            <td style="padding: 8px 10px; border: 1px solid ${borderColor};">${row[2]}</td>
            <td style="padding: 8px 10px; border: 1px solid ${borderColor}; font-weight: bold;">${row[3]}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- 4. HIDRÁULICA -->
    <h2 style="color: ${brandOrange}; font-size: 14pt; border-bottom: 1px solid ${borderColor}; padding-bottom: 4px; margin-top: 24px;">
      4. Diretrizes Hidráulicas, Instalação & Retrofit
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 9.5pt;">
      <thead>
        <tr style="background-color: ${slateDark}; color: #ffffff;">
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 32%;">Tema Hidráulico / Configuração</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 68%;">Detalhamento Técnico e Requisito de Instalação</th>
        </tr>
      </thead>
      <tbody>
        ${hydraData.map((row, i) => `
          <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : lightBg};">
            <td style="padding: 8px 10px; border: 1px solid ${borderColor}; font-weight: bold;">${row[0]}</td>
            <td style="padding: 8px 10px; border: 1px solid ${borderColor};">${row[1]}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- 5. CATÁLOGO -->
    <h2 style="color: ${brandOrange}; font-size: 14pt; border-bottom: 1px solid ${borderColor}; padding-bottom: 4px; margin-top: 24px;">
      5. Catálogo Oficial de Equipamentos Roder (Sincronizado)
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 9.5pt;">
      <thead>
        <tr style="background-color: ${brandOrange}; color: #ffffff;">
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 14%;">Código</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 26%;">Equipamento</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 16%;">Categoria</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 16%;">Preço Base</th>
          <th style="padding: 8px 10px; text-align: left; border: 1px solid ${borderColor}; width: 28%;">Descrição</th>
        </tr>
      </thead>
      <tbody>
        ${formattedProducts.map((row, i) => `
          <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : amberBg};">
            <td style="padding: 8px 10px; border: 1px solid ${borderColor}; font-weight: bold;">${row[0]}</td>
            <td style="padding: 8px 10px; border: 1px solid ${borderColor}; font-weight: bold;">${row[1]}</td>
            <td style="padding: 8px 10px; border: 1px solid ${borderColor};">${row[2]}</td>
            <td style="padding: 8px 10px; border: 1px solid ${borderColor};">${row[3]}</td>
            <td style="padding: 8px 10px; border: 1px solid ${borderColor}; font-size: 8.5pt;">${row[4]}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 32px; padding-top: 12px; border-top: 1px solid ${borderColor}; font-size: 8.5pt; color: ${slateGray};">
      <em>Documento Oficial • RODER BRASIL EQUIPAMENTOS HIDRÁULICOS LTDA • Todos os direitos reservados.</em>
    </div>
  </div>
  `;

  return html;
}

export async function copyFormattedTextToClipboard(htmlContent: string, plainText: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const typeHtml = 'text/html';
      const typeText = 'text/plain';
      const blobHtml = new Blob([htmlContent], { type: typeHtml });
      const blobText = new Blob([plainText], { type: typeText });
      const data = [new ClipboardItem({ [typeHtml]: blobHtml, [typeText]: blobText })];
      await navigator.clipboard.write(data);
      return true;
    } else {
      // Fallback
      await navigator.clipboard.writeText(plainText);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard write failed, fallback to plain text:', err);
    try {
      await navigator.clipboard.writeText(plainText);
      return true;
    } catch (_) {
      return false;
    }
  }
}
