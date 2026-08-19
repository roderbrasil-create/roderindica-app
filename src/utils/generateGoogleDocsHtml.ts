import { Product } from '../types';
import { EQUIPMENT_SPEC_TABLES } from '../data/equipmentManualData';

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

  // Build HTML string
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>RODER Brasil - Manual Técnico & Base de Conhecimento IA</title>
  <style>
    body {
      font-family: Arial, Calibri, sans-serif;
      line-height: 1.5;
      color: ${slateDark};
      background: #ffffff;
      padding: 30px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header-banner {
      background: ${slateDark};
      color: #ffffff;
      padding: 24px;
      border-radius: 8px;
      border-bottom: 4px solid ${brandOrange};
      margin-bottom: 24px;
    }
    .header-banner h1 {
      margin: 0 0 6px 0;
      font-size: 22px;
      color: #ffffff;
    }
    .header-banner p {
      margin: 0;
      font-size: 13px;
      color: #94a3b8;
    }
    .meta-box {
      background: ${lightBg};
      border: 1px solid ${borderColor};
      padding: 16px;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 30px;
    }
    .meta-box strong {
      color: ${brandOrange};
    }
    h2 {
      color: ${brandOrange};
      font-size: 16px;
      border-bottom: 2px solid ${borderColor};
      padding-bottom: 6px;
      margin-top: 36px;
      margin-bottom: 12px;
    }
    h3 {
      color: ${slateDark};
      font-size: 14px;
      margin-top: 24px;
      margin-bottom: 8px;
    }
    p.subtitle {
      color: ${slateGray};
      font-size: 12px;
      font-style: italic;
      margin-top: -8px;
      margin-bottom: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11.5px;
    }
    th {
      background: ${slateDark};
      color: #ffffff;
      padding: 8px 10px;
      text-align: left;
      font-weight: bold;
      border: 1px solid ${slateDark};
    }
    th.orange-th {
      background: ${brandOrange};
      border: 1px solid ${brandOrange};
    }
    td {
      padding: 8px 10px;
      border: 1px solid ${borderColor};
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: ${lightBg};
    }
    tr.amber-row td {
      background: ${amberBg};
    }
    .notes-box {
      font-size: 11px;
      color: ${slateGray};
      margin-top: -12px;
      margin-bottom: 20px;
      padding-left: 8px;
    }
    .prompt-box {
      background: ${lightBg};
      border-left: 4px solid ${brandOrange};
      padding: 16px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      white-space: pre-wrap;
      margin-top: 14px;
      border-radius: 4px;
      line-height: 1.4;
    }
    .footer-note {
      text-align: center;
      font-size: 11px;
      color: ${slateGray};
      margin-top: 50px;
      border-top: 1px solid ${borderColor};
      padding-top: 16px;
    }
  </style>
</head>
<body>

  <div class="header-banner">
    <h1>RODER BRASIL • TECNOLOGIA FLORESTAL</h1>
    <p>Manual Técnico de Engenharia, Regras Comerciais & Base de Conhecimento IA (Versão ${version})</p>
  </div>

  <div class="meta-box">
    <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} | <strong>Versão:</strong> ${version}</p>
    <p><strong>Mentor e Diretor Técnico:</strong> JEFERSON RODER (Fundador, Mentor e Criador de toda a tecnologia e equipamentos Roder)</p>
    <p><strong>Gerência Comercial:</strong> Gislene | <strong>Triagem e Gestão de Leads:</strong> Luana Camargo</p>
    <p><strong>Emitido por:</strong> ${generatedBy} | Tabelas Completas de Todos os Equipamentos Roder (Garras R250 a R1400, GT, CMF, Fellers, High Tip, FAE e Acessórios)</p>
  </div>

  <h2>1. Estrutura Corporativa & Regras Comerciais</h2>
  <p class="subtitle">Regras de negócio e terminologias institucionais autorizadas Roder</p>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Item / Parâmetro</th>
        <th style="width: 25%;">Responsável / Regra</th>
        <th style="width: 50%;">Detalhamento e Diretriz Obrigatória</th>
      </tr>
    </thead>
    <tbody>
      ${regRulesData.map(r => `
        <tr>
          <td><strong>${r[0]}</strong></td>
          <td><strong>${r[1]}</strong></td>
          <td>${r[2]}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>2. Matriz de Compatibilidade & Dimensionamento por Máquina Base</h2>
  <p class="subtitle">Regras técnicas essenciais de segurança, hidráulica e porte de máquina</p>
  <table>
    <thead>
      <tr>
        <th style="width: 24%;">Equipamento Roder</th>
        <th style="width: 26%;">Faixa de Aplicação Ideal</th>
        <th style="width: 50%;">Regras Críticas & Restrições de Operação</th>
      </tr>
    </thead>
    <tbody>
      ${compatData.map(c => `
        <tr>
          <td><strong>${c[0]}</strong></td>
          <td><strong>${c[1]}</strong></td>
          <td>${c[2]}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>3. Tabela de Produtividade & Rendimento Operacional em Campo</h2>
  <p class="subtitle">Médias reais Roder considerando 80% de eficiência operacional (176h úteis/mês)</p>
  <table>
    <thead>
      <tr>
        <th class="orange-th" style="width: 30%;">Equipamento / Modelo</th>
        <th class="orange-th" style="width: 24%;">Comprimento / Operação</th>
        <th class="orange-th" style="width: 22%;">Produção Horária</th>
        <th class="orange-th" style="width: 24%;">Produção Estimada Mensal (176h)</th>
      </tr>
    </thead>
    <tbody>
      ${prodData.map(p => `
        <tr>
          <td><strong>${p[0]}</strong></td>
          <td><strong>${p[1]}</strong></td>
          <td>${p[2]}</td>
          <td><strong>${p[3]}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>4. Diretrizes Hidráulicas, Instalação & Retrofit</h2>
  <p class="subtitle">Alertas técnicos fundamentais para instalação em escavadeiras</p>
  <table>
    <thead>
      <tr>
        <th style="width: 32%;">Tema Hidráulico / Configuração</th>
        <th style="width: 68%;">Detalhamento Técnico e Requisito de Instalação</th>
      </tr>
    </thead>
    <tbody>
      ${hydraData.map(h => `
        <tr>
          <td><strong>${h[0]}</strong></td>
          <td>${h[1]}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>5. Fichas Técnicas & Especificações Completas por Equipamento</h2>
  <p class="subtitle">Tabelas detalhadas com todos os modelos e características de engenharia</p>

  ${EQUIPMENT_SPEC_TABLES.map(spec => `
    <h3>${spec.categoryTitle}</h3>
    <p class="subtitle">${spec.categorySubtitle}</p>
    <table>
      <thead>
        <tr>
          ${spec.headers.map(h => `<th class="orange-th">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${spec.rows.map(row => `
          <tr>
            ${row.map((cell, idx) => idx === 0 ? `<td><strong>${cell}</strong></td>` : `<td>${cell}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${spec.notes && spec.notes.length > 0 ? `
      <div class="notes-box">
        ${spec.notes.map(n => `<p>• ${n}</p>`).join('')}
      </div>
    ` : ''}
  `).join('')}

  ${products && products.length > 0 ? `
    <h2>6. Inventário Sincronizado do Catálogo (Banco de Dados)</h2>
    <p class="subtitle">${products.length} equipamentos conectados em tempo real</p>
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Equipamento</th>
          <th>Categoria</th>
          <th>Modelos</th>
          <th>Descrição</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(p => `
          <tr>
            <td><strong>${(p as any).code || (p.models && p.models[0]?.name) || 'RODER'}</strong></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.category || 'Geral'}</td>
            <td>${p.models?.length || 1} mod.</td>
            <td>${p.description || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <h2>${products && products.length > 0 ? '7' : '6'}. Prompt do Sistema para Agentes de IA Externos</h2>
  <p class="subtitle">Copie e cole este bloco de texto nas configurações de qualquer Agente IA</p>
  <div class="prompt-box">${promptText}</div>

  <div class="footer-note">
    Documento Oficial • RODER BRASIL EQUIPAMENTOS HIDRÁULICOS LTDA • Todos os direitos reservados.
  </div>

</body>
</html>`;
}

export async function copyFormattedTextToClipboard(htmlContent: string, plainText: string): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      const data = [new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })];
      await navigator.clipboard.write(data);
      return true;
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(plainText);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('ClipboardItem failed, trying plain text fallback:', err);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(plainText);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }
}
