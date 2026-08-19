import { AccessoryData, InstallationKit, deduplicateAccessories } from '../constants';
import { Product } from '../types';
import { EQUIPMENT_SPEC_TABLES } from '../data/equipmentManualData';

export function getTabPlainText(
  tab: 'overview' | 'compatibility' | 'productivity' | 'hydraulics' | 'specs' | 'accessories_kits' | 'catalog' | 'guidelines' | 'prompt',
  data: {
    products: Product[];
    accessories: AccessoryData[];
    kits: InstallationKit[];
    guidelines: any[];
    systemPromptText: string;
  }
): string {
  const { products, accessories, kits, guidelines, systemPromptText } = data;
  const uniqueAccs = deduplicateAccessories(accessories);

  switch (tab) {
    case 'overview':
      return `RODER BRASIL - ESTRUTURA ORGANIZACIONAL & DIRETRIZES COMERCIAIS OBRIGATÓRIAS

1. DIRETORIA & MENTOR TÉCNICO
   - Jeferson Roder: Mentor, Fundador, Criador de toda a tecnologia e equipamentos Roder, Professor e Diretor Técnico.
   - ATENÇÃO CRÍTICA: NUNCA se referir como "gerente de projetos", "gerente de projeto" ou "engenheiro".

2. GESTÃO COMERCIAL & TRIAGEM DE LEADS
   - Gislene: Gerente Comercial responsável pela gestão, autorizações e negociações.
   - Luana Camargo: Responsável pela recepção, qualificação técnica inicial e gestão de leads.

3. VALIDADE DE PROPOSTAS & PROTEÇÃO DE LEAD
   - Validade de propostas: 60 dias a contar do upload do orçamento.
   - Proteção de lead: 60 dias para o indicador a contar do envio do orçamento.

4. REGRAS DE CÁLCULO DE COMISSÃO
   - A comissão é calculada sobre o "base_commission_value".
   - Descontos concedidos devem ser deduzidos desse valor base antes da aplicação da alíquota.
   - Alerta aos gestores caso uma indicação em "negociação" não possua valor base de comissão.`;

    case 'compatibility':
      return `RODER BRASIL - MATRIZ DE COMPATIBILIDADE E DIMENSIONAMENTO POR MÁQUINA BASE

1. CABEÇOTE CMF 500:
   - Porte Ideal: Escavadeiras de 8t a 14t (melhor performance em 14t). Suporta até 22t com cuidado operacional.
   - PROIBIDO EM RETROESCAVADEIRAS: Operacionalmente inviável (braço de apenas 2,5m e falta de giro 360° da cabine criam altíssimo risco de acidente fatal com queda de árvore na cabine).
   - Rebrota: NÃO recomendado (corrente .404 entorta sabre com múltiplos fustes). Para rebrota indicar CMF 600 com corrente 3/4".

2. CABEÇOTE CMF 600:
   - Porte Ideal: Escavadeiras de 14t a 22t.
   - Equipado com sabre reforçado e corrente 3/4", ideal para corte de rebrota e madeira grossa/pesada.

3. GARFO PALETEIRO (GPR 4500 / GPR 7000):
   - REGRA DE OURO: Dimensionar SEMPRE pelo peso/porte da pá carregadeira, NUNCA pelo peso da carga.
   - PROIBIDO GPR 4500 EM MÁQUINAS ACIMA DE 8 TONELADAS: O empuxo hidráulico da pá carregadeira pesada entorta os garfos facilmente.
   - Recomendações: 6t a 9t -> GPR 4500 | 8t a 12t -> GPR 7000.

4. GARRAS R280 / R280L / R360 / R360G:
   - Gruas e Tratores: R280 e R280L.
   - Escavadeiras < 8t: R280L (mais leve e estruturada).
   - Escavadeiras 7t a 13t: R360 (madeira geral) e R360G (unhas abertas para resíduos/galhadas/citrus).
   - Arrasto de Feixes/Eucalipto ao Picador: Indicar R280 (força de giro guia os pés das árvores).

5. DIMENSIONAMENTO DE GARRAS EM PICADORES:
   - Picador até 600 cv: Garra R400 (em escavadeiras ≥ 14t).
   - Picador até 1.000 cv: Garra R600 (em escavadeiras ≥ 14t).

6. FELLER TESOURA (CFTA 50 / CFTA 60):
   - Escavadeiras de 12t a 22t. Rendimento (200-360 árvores/h) supera amplamente pá carregadeira (160 árvores/h).
   - PROIBIDO EM ACLIVES > 10°: Em terrenos inclinados, utilizar Cabeçote Multifuncional (CMF) devido ao seu pêndulo auto-alinhante.`;

    case 'productivity':
      return `RODER BRASIL - TABELA DE PRODUTIVIDADE E RENDIMENTO OPERACIONAL EM CAMPO
(Médias de campo calculadas com 80% de eficiência operacional = 176h úteis/mês em 1 turno de 10h/dia x 22 dias)

1. CABEÇOTES MULTIFUNCIONAIS (CMF 500 / CMF 600):
   - 1,10m ("Metrinho"): 25 a 35 m³/h (4.400 a 6.160 m³/mês)
   - 2,20m ("Metrão"): 40 a 50 m³/h (7.040 a 8.800 m³/mês)
   - 3,00m (Padrão): 60 a 80 m³/h (10.560 a 14.080 m³/mês)
   - 6,00m (Toras Longas): 80 a 110+ m³/h (14.080 a 19.360+ m³/mês)

2. GARRA TRAÇADORA GT 600 (0.60 m²):
   - 1,10m ("Metrinho"): 30 a 45 m³/h
   - 2,20m ("Metrão"): 50 a 90 m³/h (8.800 a 15.840 m³/mês)
   - 3,00m (Padrão): 70 a 100 m³/h (12.320 a 17.600 m³/mês)
   - 3,60m (Caso Real Cliente): ~68 m³/h úteis contínuos (12.000 m³/mês)
   - 6,00m (Toras Longas): 100 a 140+ m³/h (17.600 a 24.640+ m³/mês)

3. GARRA TRAÇADORA GT 800 X (0.80 m²):
   - 3,00m: 80 a 110 m³/h (14.080 a 19.360 m³/mês)
   - 2,20m: 65 a 95 m³/h
   - 6,00m: 120 a 160+ m³/h

4. GARRA TRAÇADORA GT 1000 X (1.00 m²):
   - 3,00m: 130 a 160 m³/h (22.880 a 28.160 m³/mês)
   - 2,20m: 110 a 130 m³/h
   - 6,00m: 160 a 220+ m³/h

5. FELLER TESOURA CFTA 50 / CFTA 60:
   - CFTA 50 (Escavadeira 20t): 200 árvores/h | ~1.600 árvores/turno (Consumo: 18 L/h)
   - CFTA 60 (Escavadeira 20t): 240 a 360 árvores/h | 1.920 a 3.600 árvores/turno (Consumo: 22 L/h)
   - CFTA 50 (Pá Carregadeira L60): 160 árvores/h | ~1.280 árvores/turno`;

    case 'hydraulics':
      return `RODER BRASIL - DIRETRIZES HIDRÁULICAS, INSTALAÇÃO & RETROFIT

1. KIT PARA MÁQUINAS SEM FATIA EXTRA (CÓDIGO 9000.9000.9016):
   - Derivação direta da bomba principal para válvula de duas solenoides de baixo fluxo.
   - Em marcha lenta e sem mover o braço/lança, o giro fica lento por projeto (bomba em deslocamento mínimo). A rotação normaliza ao acionar qualquer outra função da escavadeira.

2. ROTATOR RODER - PADRÃO DIMENSIONAL & GIRO INFINITO:
   - Grafia correta: "Rotator" (com T).
   - Giro 360° infinito e ilimitado contínuo em todos os modelos.
   - Padrão de acoplamento da biela Roder: furo para pino de 45 mm com largura de biela de 100 mm.

3. INCOMPATIBILIDADE DE ESCAVADEIRAS HARVESTER OU LINHA F:
   - Usam linha de alto fluxo uni-direcional com comando no cabeçote.
   - Para instalar garra de carregamento, exige conversão profunda e irreversível (remoção da elétrica original, linhas bidirecionais no comando e botões no joystick).
   - ATENÇÃO: Escavadeiras com Harvester NÃO vêm com cilindro de caçamba e links originais, impedindo montagem direta de Feller ou caçamba sem reposição dessas peças de fábrica.`;

    case 'specs': {
      let text = `RODER BRASIL - TABELAS COMPLETAS DE ESPECIFICAÇÕES TÉCNICAS (MODELOS RODER)\n\n`;
      for (const table of EQUIPMENT_SPEC_TABLES) {
        text += `=====================================================\n`;
        text += `${table.categoryTitle}\n`;
        text += `${table.categorySubtitle}\n`;
        text += `-----------------------------------------------------\n`;
        text += `${table.headers.join(' | ')}\n`;
        text += `-----------------------------------------------------\n`;
        for (const row of table.rows) {
          text += `${row.join(' | ')}\n`;
        }
        if (table.notes && table.notes.length > 0) {
          text += `Notas: ${table.notes.join('; ')}\n`;
        }
        text += `\n`;
      }
      return text;
    }

    case 'accessories_kits': {
      let text = `RODER BRASIL - QUADRO 1 (ACESSÓRIOS 1000.XXXX) & QUADRO 2 (KITS HIDRÁULICOS 9000.9000.XXXX)\n\n`;
      text += `--- QUADRO 1: ACESSÓRIOS DE MONTAGEM POR MÁQUINA (${uniqueAccs.length} MODELOS DESDUPLICADOS) ---\n`;
      for (const acc of uniqueAccs) {
        text += `• ${acc.brand} - ${acc.model} (${acc.pin || 'Pino Padrão'})\n`;
        if (acc.ponteira_biela_4) text += `  - Ponteira Biela 4: ${acc.ponteira_biela_4}\n`;
        if (acc.ponteira_biela_6) text += `  - Ponteira Biela 6: ${acc.ponteira_biela_6}\n`;
        if (acc.suporte_destocador) text += `  - Suporte Destocador: ${acc.suporte_destocador}\n`;
        if (acc.suporte_triturador) text += `  - Suporte Triturador: ${acc.suporte_triturador}\n`;
        if (acc.link_garra_biela_4) text += `  - Link Garra Biela 4: ${acc.link_garra_biela_4}\n`;
        if (acc.link_garra_biela_6) text += `  - Link Garra Biela 6: ${acc.link_garra_biela_6}\n`;
      }
      text += `\n--- QUADRO 2: KITS DE INSTALAÇÃO HIDRÁULICA (${kits.length} KITS CADASTRADOS) ---\n`;
      for (const kit of kits) {
        text += `• Código: ${kit.code} - ${kit.description}\n`;
        if (kit.items && kit.items.length > 0) {
          text += `  Componentes: ${kit.items.map(i => `${i.quantity || 1}x ${i.description} (${i.code})`).join('; ')}\n`;
        }
      }
      return text;
    }

    case 'catalog': {
      let text = `RODER BRASIL - CATÁLOGO DINÂMICO DE EQUIPAMENTOS (${products.length} ITENS CONECTADOS)\n\n`;
      for (const p of products) {
        const anyP = p as any;
        const code = anyP.code || (p.models && p.models[0]?.name) || 'RODER';
        const price = anyP.price || (p.models && p.models[0]?.base_value) || 0;
        const priceStr = price ? `R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sob Consulta';
        text += `• ${code} | ${p.name} | Categoria: ${p.category || 'Geral'} | Valor: ${priceStr}\n`;
        if (p.description) text += `  Descrição: ${p.description}\n`;
      }
      return text;
    }

    case 'guidelines': {
      let text = `RODER BRASIL - DIRETRIZES TÉCNICAS & APRENDIZADOS SALVOS (${guidelines.length} ITENS)\n\n`;
      for (const g of guidelines) {
        text += `• [${g.category || 'Ensino Técnico'}] ${g.title || 'Instrução'}\n`;
        text += `  ${g.text || g.content || g.description || ''}\n\n`;
      }
      return text;
    }

    case 'prompt':
      return systemPromptText;

    default:
      return '';
  }
}
