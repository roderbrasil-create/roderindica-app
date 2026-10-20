export interface AccessoryData {
  brand: string;
  model: string;
  pin: string;
  ponteira_biela_4?: string;
  ponteira_biela_6?: string;
  suporte_destocador?: string;
  suporte_triturador?: string;
  link_garra_biela_6?: string;
  link_garra_biela_4?: string;
  photo_urls?: {
    ponteira?: string;
    suporte?: string;
    link?: string;
  };
}

export const ACCESSORIES_DATA: AccessoryData[] = [
  { brand: 'CASE', model: 'CX180C/CX200', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'CASE', model: 'CX130', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'CATERPILLAR', model: '320D/320FM', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_6: '1000.0000.0171', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'CATERPILLAR', model: '315/318D2L', pin: 'PINO Ø70', ponteira_biela_4: '1000.0000.0071', suporte_triturador: '1000.1325.0000', link_garra_biela_4: '1000.0000.0178' },
  { brand: 'CATERPILLAR', model: '312D/313', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'DOOSAN', model: 'DX140LC', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'FIATALLIS', model: 'FX215LC', pin: 'PINO Ø70', ponteira_biela_4: '1000.0000.0100', suporte_triturador: '1000.1325.0000', link_garra_biela_4: '1000.0000.0178' },
  { brand: 'FIATALLIS', model: 'FH150B', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'HYUNDAI', model: '260LC9', pin: 'PINO Ø90', ponteira_biela_4: '1000.0000.0056', suporte_destocador: '1000.1260.0000' },
  { brand: 'HYUNDAI', model: '210/R225', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'HYUNDAI', model: '160/180/200G', pin: 'PINO Ø70', ponteira_biela_4: '1000.0000.0071', suporte_destocador: '1000.1204.0000', suporte_triturador: '1000.1325.0000', link_garra_biela_4: '1000.0000.0178' },
  { brand: 'HYUNDAI', model: '140/150', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'JCB', model: 'JS200', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'JCB', model: '130LC', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'JOHN DEERE', model: '160LC/200G/210G-P', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'JOHN DEERE', model: '130G', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'KOMATSU', model: 'PC200', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'KOMATSU', model: 'PC160', pin: 'PINO Ø70', ponteira_biela_4: '1000.0000.0071', suporte_destocador: '1000.1204.0000', suporte_triturador: '1000.1325.0000', link_garra_biela_4: '1000.0000.0178' },
  { brand: 'KOMATSU', model: 'PC130', pin: 'PINO Ø60', ponteira_biela_4: '1000.0000.0098', ponteira_biela_6: '1000.0000.0063', suporte_destocador: '1000.1263.0000', suporte_triturador: '1000.1420.0000', link_garra_biela_6: '1000.0000.0091', link_garra_biela_4: '1000.0000.0167' },
  { brand: 'LINK BELT', model: '180/210', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'LIUGONG', model: 'LG915', pin: 'PINO Ø60', ponteira_biela_4: '1000.0000.0098', ponteira_biela_6: '1000.0000.0063', suporte_destocador: '1000.1263.0000', suporte_triturador: '1000.1420.0000', link_garra_biela_6: '1000.0000.0091', link_garra_biela_4: '1000.0000.0167' },
  { brand: 'LIUGONG', model: '908', pin: 'PINO Ø50', ponteira_biela_4: '1000.0000.0144', ponteira_biela_6: '1000.0000.0070', suporte_triturador: '1000.1399.0100', photo_urls: { ponteira: '/uploads/ponteira_1000_0000_0144.svg', suporte: '/uploads/suporte_1000_1399_0100.svg' } },
  { brand: 'LONKING', model: '6225/6235', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0060', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'LONKING', model: '6150', pin: 'PINO Ø60', ponteira_biela_4: '1000.0000.0016', suporte_triturador: '1000.1420.0000' },
  { brand: 'NEW HOLLAND', model: 'E210/E215B', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'NEW HOLLAND', model: 'E175B', pin: 'PINO Ø70', ponteira_biela_4: '1000.0000.0071', suporte_destocador: '1000.1204.0000', suporte_triturador: '1000.1325.0000', link_garra_biela_4: '1000.0000.0178' },
  { brand: 'NEW HOLLAND', model: 'E145/E135B', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'SANY', model: '215C', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'SANY', model: '155', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'SANY', model: '135/155H', pin: 'PINO Ø60', ponteira_biela_4: '1000.0000.0098', ponteira_biela_6: '1000.0000.0063', suporte_destocador: '1000.1263.0000', suporte_triturador: '1000.1420.0000', link_garra_biela_6: '1000.0000.0091' },
  { brand: 'SDLG', model: '6150/150', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'VOLVO', model: 'EC210B', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'VOLVO', model: 'EC140B', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'VOLVO', model: '250', pin: 'PINO Ø90', ponteira_biela_4: '1000.0000.0056' },
  { brand: 'XCMG', model: 'XE215BR', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'XCMG', model: 'XE150D', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
];

/**
 * Utility function to deduplicate accessories array by Brand + Model.
 * Merges missing fields from duplicates so no codes or info are lost.
 */
export function deduplicateAccessories(items: AccessoryData[]): AccessoryData[] {
  const map = new Map<string, AccessoryData>();

  for (const item of items) {
    if (!item.brand || !item.model) continue;
    const brandClean = item.brand.trim().toUpperCase();
    const modelClean = item.model.trim().toUpperCase();
    const key = `${brandClean}__${modelClean}`;

    if (!map.has(key)) {
      map.set(key, { 
        ...item, 
        brand: brandClean, 
        model: modelClean 
      });
    } else {
      const existing = map.get(key)!;
      if (!existing.pin && item.pin) existing.pin = item.pin;
      if (!existing.ponteira_biela_4 && item.ponteira_biela_4) existing.ponteira_biela_4 = item.ponteira_biela_4;
      if (!existing.ponteira_biela_6 && item.ponteira_biela_6) existing.ponteira_biela_6 = item.ponteira_biela_6;
      if (!existing.suporte_destocador && item.suporte_destocador) existing.suporte_destocador = item.suporte_destocador;
      if (!existing.suporte_triturador && item.suporte_triturador) existing.suporte_triturador = item.suporte_triturador;
      if (!existing.link_garra_biela_4 && item.link_garra_biela_4) existing.link_garra_biela_4 = item.link_garra_biela_4;
      if (!existing.link_garra_biela_6 && item.link_garra_biela_6) existing.link_garra_biela_6 = item.link_garra_biela_6;
      
      if (item.photo_urls) {
        existing.photo_urls = {
          ...existing.photo_urls,
          ...item.photo_urls
        };
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const bComp = a.brand.localeCompare(b.brand);
    if (bComp !== 0) return bComp;
    return a.model.localeCompare(b.model);
  });
}

export interface InstallationKit {
  code: string;
  description: string;
  items: {
    code: string;
    quantity: number;
    description: string;
    unit?: string; // só quando não é UN (MT, PC, PAR)
  }[];
}

// Fonte: PDF do ERP "KITS_DE_INSTALACOES_ATUALIZADO_08-26" (relatório de estruturas, 10/08/2026): 58 kits, itens e quantidades exatos, em ordem de código.
export const INSTALLATION_KITS: InstallationKit[] = [
  {
    code: '9000.9000.9000',
    description: 'KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA)',
    items: [
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 10 },
      { code: '1000.1040.5600', description: 'ABRACADEIRA CONJUNTO SIMPLES Ø27', quantity: 4 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '5000.1001.0039', description: 'PEDAL ACIONAMENTO 10A 250V 1REV MINI TFS-100 - COM CABO 1METRO', quantity: 2 },
      { code: '3000.5003.0075', description: 'Valvula esfera 2 vias 3/4BSP', quantity: 2 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 2 },
      { code: '2000.1000.2847', description: 'CHAPA PERFIL L ADAPTADOR PAINEL 7/8', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '4000.5000.0019', description: 'ABRACADEIRA NYLON 4,8 X 400MM', quantity: 10 }
    ]
  },
  {
    code: '9000.9000.9001',
    description: 'KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - ( MAQUINA COM LINHA ROMPEDOR)',
    items: [
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 1 },
      { code: '2000.1000.2847', description: 'CHAPA PERFIL L ADAPTADOR PAINEL 7/8', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '5000.1001.0039', description: 'PEDAL ACIONAMENTO 10A 250V 1REV MINI TFS-100 - COM CABO 1METRO', quantity: 2 },
      { code: '4000.5000.0019', description: 'ABRACADEIRA NYLON 4,8 X 400MM', quantity: 10 }
    ]
  },
  {
    code: '9000.9000.9002',
    description: 'KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA "ACIONADA" SEM LINHA)',
    items: [
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 10 },
      { code: '1000.1040.5600', description: 'ABRACADEIRA CONJUNTO SIMPLES Ø27', quantity: 4 },
      { code: '3000.5003.0075', description: 'Valvula esfera 2 vias 3/4BSP', quantity: 2 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 2 },
      { code: '1000.1040.1107', description: 'ADAPTADOR PARA SOLDA 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '2000.1000.2847', description: 'CHAPA PERFIL L ADAPTADOR PAINEL 7/8', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9003',
    description: 'KIT BAIXA PRESSAO 1 SECCAO DUPLA CAT320GC/NG 24V ( 80L/ 190BAR )',
    items: [
      { code: '5000.1001.0058', description: 'CAIXA ELETRICA 02 FUNCOES 24V', quantity: 1 },
      { code: '3000.5003.0152', description: 'COMANDO ELETRICO 80LTS - 01 SECC24V', quantity: 1 },
      { code: '3000.5000.0287', description: 'Adaptador macho/macho 7/8 UNF x 7/8 JIC', quantity: 2 },
      { code: '3000.5000.0284', description: 'Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC', quantity: 2 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '5000.1001.0057', description: 'CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619', quantity: 2 },
      { code: '3000.5000.0428', description: 'Adaptador macho/macho 7/8 UNF X 1.1/16 JIC', quantity: 1 },
      { code: '3000.5002.0093', description: 'BOMBA ENGRENAGEM 48 CC - EIXO 25 X 15 DENTES (ROTACAO HORARIO)', quantity: 1 },
      { code: '3000.5000.0281', description: 'Adaptador macho/macho 1.5/16 UNF x 1.5/16 JIC', quantity: 1 },
      { code: '3000.5000.0284', description: 'Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC', quantity: 1 },
      { code: '5000.1001.0043', description: 'BOTAO PULSANTE 12MM P9 900016054489 + CAPA P9 C401245-25-1', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9004',
    description: 'KIT INSTALACAO CMF500/600 + LINCK EM ESCAVADEIRA - ( MAQUINA COM LINHA ROMPEDOR)',
    items: [
      { code: '5000.1001.0061', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA CMF500/600', quantity: 1 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '3000.5001.1083', description: '3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1110', description: '1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL', quantity: 3 },
      { code: '3000.5001.1042', description: '3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1134', description: '3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL', quantity: 2 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.2705', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT', quantity: 2 },
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 2 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5003.0146', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP', quantity: 1 },
      { code: '3000.5000.0491', description: 'ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 4 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.1004.0018', description: 'Arruela de pressão M6', quantity: 2 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '3000.5000.0396', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0336', description: 'BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0366', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC', quantity: 3 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 2 },
      { code: '3000.5000.0379', description: 'Adaptador Painel 1.1/16 JIC', quantity: 2 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5000.0359', description: 'ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2', quantity: 3 },
      { code: '3000.5000.0360', description: 'ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2', quantity: 3 },
      { code: '3000.5000.0395', description: 'ADAPTADOR MACHO/FEMEA 1/2 NPT X 7/8 JIC', quantity: 3 },
      { code: '3000.5003.0188', description: 'VALVULA CONTROLE FLUXO BI-DIRECIONAL 3/4 BSP', quantity: 2 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0361', description: 'ENGATE RAPIDO FEMEA FACE PLANA 9/16 UNF-14 - CORPO 1/4', quantity: 1 },
      { code: '3000.5000.0362', description: 'ENGATE RAPIDO MACHO FACE PLANA 9/16 UNF-14 - CORPO 1/4', quantity: 1 },
      { code: '3000.5000.0399', description: 'Adaptador macho/femea 9/16 UNF X 9/16 JIC', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9005',
    description: 'KIT INSTALACAO LINHA EXTRA PADRAO ESCAVADEIRA - ( MAQUINA CAT320 GC COM FATIA EXTRA "ACIONADA" SEM LINHA)',
    items: [
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 10 },
      { code: '1000.1040.5600', description: 'ABRACADEIRA CONJUNTO SIMPLES Ø27', quantity: 4 },
      { code: '3000.5003.0075', description: 'Valvula esfera 2 vias 3/4BSP', quantity: 2 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 2 },
      { code: '1000.1040.1107', description: 'ADAPTADOR PARA SOLDA 1.1/16 JIC', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9006',
    description: 'KIT INSTALACAO GT COM BLOCO 3 VIAS - ( MAQUINA COM LINHA)',
    items: [
      { code: '3000.5003.0085', description: 'BLOCO COMANDO VALVULA DIRECIONAL PILOTADA', quantity: 1 },
      { code: '3000.5000.0307', description: 'Adaptador macho/macho 1.5/16 UNF x 1.1/16 JIC', quantity: 6 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 5 },
      { code: '5000.1001.0042', description: 'MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '5000.1001.0051', description: 'CAIXA ELETRICA 01 FUNCAO 12/24V', quantity: 1 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1004.0018', description: 'Arruela de pressão M6', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9007',
    description: 'KIT INSTALACAO TRITURADOR EM ESCAVADEIRA - ( MAQUINA COM LINHA)',
    items: [
      { code: '3000.5000.0366', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC', quantity: 1 },
      { code: '3000.5000.0396', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '1000.1040.4700', description: 'FIXACAO MANGUEIRAS DESTOCADOR', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 1 },
      { code: '2000.1000.2847', description: 'CHAPA PERFIL L ADAPTADOR PAINEL 7/8', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '4000.5000.0019', description: 'ABRACADEIRA NYLON 4,8 X 400MM', quantity: 10 },
      { code: '2000.1000.3510', description: 'CHAPA DO CHICOTE ELETRICO FAE', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9008',
    description: 'KIT INSTALACAO LINHA EXTRA PADRAO ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA)',
    items: [
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 10 },
      { code: '1000.1040.5600', description: 'ABRACADEIRA CONJUNTO SIMPLES Ø27', quantity: 4 },
      { code: '5000.1001.0039', description: 'PEDAL ACIONAMENTO 10A 250V 1REV MINI TFS-100 - COM CABO 1METRO', quantity: 2 },
      { code: '3000.5003.0075', description: 'Valvula esfera 2 vias 3/4BSP', quantity: 2 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 2 },
      { code: '1000.1040.1107', description: 'ADAPTADOR PARA SOLDA 1.1/16 JIC', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9009',
    description: 'KIT INSTALACAO GT600/800 ROTATOR SEM PASSAGEM EXTRA EM ESCAVADEIRA 20TON - (MAQUINA COM LINHA DE GARRA)',
    items: [
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 14 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0017', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GT600-GT800 SEM PASSAGEM EXTRA', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 6 },
      { code: '3000.5003.0008', description: 'BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)', quantity: 1 },
      { code: '3000.5003.0009', description: 'VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER', quantity: 1 },
      { code: '3000.5000.0301', description: 'Adaptador macho/macho 3/4 UNF x 9/16 JIC', quantity: 3 },
      { code: '1000.1040.4101', description: 'ABRACADEIRA SUPERIOR FERRO DUPLA PARA TUBO 27MM', quantity: 4 },
      { code: '1000.1040.2711', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 7/8JIC', quantity: 2 },
      { code: '1000.1040.2333', description: 'KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR', quantity: 1 },
      { code: '3000.5001.1147', description: '3/8 R2 - 3000MM X FG 7/8 JIC X FG 3/4 JIC', quantity: 1 },
      { code: '3000.5001.1084', description: '1/2 R2 - 3000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1035', description: '3/4 R12 - 3000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1038', description: '3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.1004.0018', description: 'Arruela de pressão M6', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9010',
    description: 'KIT INSTALACAO FELLER TESOURA EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA )',
    items: [
      { code: '3000.5003.0100', description: 'COMANDO HIDRAULICO ELETRICO SDS180/2 - AC(XG-180) /18EI3L/18EI3L/RV-KE2R3-24CDV', quantity: 1 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 24 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '3000.5001.1175', description: '3/4 R12 - 2300 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 3 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 4 },
      { code: '3000.5000.0381', description: 'Adaptador macho/macho 1/2 BSP x 9/16 JIC', quantity: 2 },
      { code: '3000.5000.0284', description: 'Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC', quantity: 4 },
      { code: '3000.5000.0307', description: 'Adaptador macho/macho 1.5/16 UNF x 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0276', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC', quantity: 6 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '5000.1001.0053', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR', quantity: 1 },
      { code: '5000.1001.0018', description: 'MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL', quantity: 1 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 8 },
      { code: '3000.5001.1180', description: '3/4R12 - 1000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '3000.5000.0333', description: 'ADAPTADOR TEE MACHO/FEMEA LATERAL 9/16 JIC', quantity: 2 },
      { code: '3000.5001.1081', description: '1/4 R17 - 1000 MM X FG 9/16 JIC X FG 90° 9/16 JIC', quantity: 2 },
      { code: '3000.5001.1006', description: '1/4 R17 - 1800 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 4 },
      { code: '3000.5001.1008', description: '1/2 R2 - 2300 MM X FG 7/8 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1138', description: '3/4R12 - 1000 MM X FG 1.1/16 JIC X FG 90° 1.1/16 JIC', quantity: 4 },
      { code: '3000.5001.1009', description: '3/4 R2 - 1300 MM X FG 1.1/16 JIC X FG 90° 1.1/16 JIC', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9011',
    description: 'KIT INSTALACAO CMF500/600 + LANCA EXTENSORA EM ESCAVADEIRA - ( MAQUINA SEM FATIA EXTRA )',
    items: [
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 6 },
      { code: '1000.1040.2707', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC', quantity: 2 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.2333', description: 'KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR', quantity: 1 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 14 },
      { code: '1000.1040.2709', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '3000.5001.1007', description: '1/2 R2 - 1600 MM X FG 7/8 JIC X FG 45° 7/8 JIC', quantity: 3 },
      { code: '3000.5001.1043', description: '3/8 R2 - 1600 MM X FG 9/16 JIC X FG 45° 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 2 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5003.0146', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP', quantity: 1 },
      { code: '3000.5000.0291', description: 'ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0491', description: 'ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '3000.5003.0086', description: 'REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN', quantity: 1 },
      { code: '3000.5003.0008', description: 'BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)', quantity: 1 },
      { code: '3000.5003.0009', description: 'VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER', quantity: 1 },
      { code: '3000.5000.0301', description: 'Adaptador macho/macho 3/4 UNF x 9/16 JIC', quantity: 3 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 2 },
      { code: '3000.5000.0396', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0336', description: 'BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0366', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC', quantity: 3 },
      { code: '3000.5001.1002', description: '1/2 R2 - 1200mm x FG 7/8 JIC x FG 45° 7/8JIC', quantity: 3 },
      { code: '3000.5001.1177', description: '3/8 R2 - 1170 MM X FG 9/16 JIC X FG 45° 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1172', description: '3/4 R12 - 1160 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0379', description: 'Adaptador Painel 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1083', description: '3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9012',
    description: 'KIT INSTALACAO CMF500/600 + LANCA EXTENSORA EM ESCAVADEIRA - ( MAQUINA COM LINHA DE GARRA)',
    items: [
      { code: '1000.1040.2707', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC', quantity: 2 },
      { code: '1000.1040.2709', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 2 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5003.0146', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP', quantity: 1 },
      { code: '3000.5000.0291', description: 'ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 3 },
      { code: '3000.5000.0491', description: 'ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '3000.5001.1043', description: '3/8 R2 - 1600 MM X FG 9/16 JIC X FG 45° 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1007', description: '1/2 R2 - 1600 MM X FG 7/8 JIC X FG 45° 7/8 JIC', quantity: 3 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '3000.5003.0086', description: 'REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN', quantity: 1 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 4 },
      { code: '3000.5000.0396', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0366', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC', quantity: 3 },
      { code: '3000.5000.0336', description: 'BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 2 },
      { code: '3000.5001.1002', description: '1/2 R2 - 1200mm x FG 7/8 JIC x FG 45° 7/8JIC', quantity: 3 },
      { code: '3000.5001.1177', description: '3/8 R2 - 1170 MM X FG 9/16 JIC X FG 45° 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1172', description: '3/4 R12 - 1160 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0379', description: 'Adaptador Painel 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1083', description: '3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9013',
    description: 'KIT INSTALACAO CMF500/600 + LANCA EXTENSORA EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA)',
    items: [
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 6 },
      { code: '1000.1040.2707', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC', quantity: 2 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 14 },
      { code: '1000.1040.2709', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '3000.5001.1007', description: '1/2 R2 - 1600 MM X FG 7/8 JIC X FG 45° 7/8 JIC', quantity: 3 },
      { code: '3000.5001.1043', description: '3/8 R2 - 1600 MM X FG 9/16 JIC X FG 45° 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 2 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5003.0146', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP', quantity: 1 },
      { code: '3000.5000.0291', description: 'ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 4 },
      { code: '3000.5000.0491', description: 'ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '3000.5003.0086', description: 'REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN', quantity: 1 },
      { code: '3000.5000.0396', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0336', description: 'BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0366', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC', quantity: 3 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 2 },
      { code: '3000.5001.1002', description: '1/2 R2 - 1200mm x FG 7/8 JIC x FG 45° 7/8JIC', quantity: 3 },
      { code: '3000.5001.1177', description: '3/8 R2 - 1170 MM X FG 9/16 JIC X FG 45° 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1172', description: '3/4 R12 - 1160 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0379', description: 'Adaptador Painel 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1083', description: '3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1040', description: '3/4R12 - 700 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0321', description: 'ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC', quantity: 1 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9014',
    description: 'KIT INSTALACAO GARRA + LANCA EXTENSORA EM ESCAVADEIRA - ( MAQUINA COM LINHA ROMPEDOR )',
    items: [
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 4 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '1000.1040.2705', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT', quantity: 2 },
      { code: '5000.1001.0042', description: 'MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5000.0359', description: 'ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2', quantity: 2 },
      { code: '3000.5000.0360', description: 'ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2', quantity: 2 },
      { code: '3000.5000.0336', description: 'BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0396', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1046', description: '1/2 R2 - 1800 MM X FG 7/8 JIC X MF 1/2 NPT', quantity: 2 },
      { code: '3000.5001.1045', description: '1/2 R2 - 1800 MM X FG 7/8 JIC X FG 1.1/16 JIC', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9015',
    description: 'KIT INSTALACAO GARRA + LANCA EXTENSORA EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA )',
    items: [
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 14 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.2705', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT', quantity: 2 },
      { code: '5000.1001.0042', description: 'MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5000.0359', description: 'ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2', quantity: 2 },
      { code: '3000.5000.0360', description: 'ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2', quantity: 2 },
      { code: '3000.5000.0396', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0336', description: 'BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1046', description: '1/2 R2 - 1800 MM X FG 7/8 JIC X MF 1/2 NPT', quantity: 2 },
      { code: '3000.5001.1045', description: '1/2 R2 - 1800 MM X FG 7/8 JIC X FG 1.1/16 JIC', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9016',
    description: 'KIT INSTALACAO GARRA EM ESCAVADEIRA - ( MAQUINA SEM FATIA EXTRA)',
    items: [
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 10 },
      { code: '1000.1040.2333', description: 'KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR', quantity: 1 },
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.2701', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC', quantity: 4 },
      { code: '5000.1001.0042', description: 'MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5003.0008', description: 'BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)', quantity: 1 },
      { code: '3000.5003.0009', description: 'VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER', quantity: 1 },
      { code: '3000.5000.0301', description: 'Adaptador macho/macho 3/4 UNF x 9/16 JIC', quantity: 3 }
    ]
  },
  {
    code: '9000.9000.9017',
    description: 'KIT INSTALACAO GARRA EM ESCAVADEIRA - ( MAQUINA COM LINHA ROMPEDOR)',
    items: [
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '1000.1040.2701', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC', quantity: 4 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9018',
    description: 'KIT INSTALACAO GARRA EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA)',
    items: [
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 10 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.2701', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC', quantity: 4 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5000.0276', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC', quantity: 4 }
    ]
  },
  {
    code: '9000.9000.9019',
    description: 'KIT INSTALACAO GT600/800 ROTATOR COM PASSAGEM EXTRA EM ESCAVADEIRA 20TON - ( MAQUINA COM FATIA EXTRA SEM LINHA)',
    items: [
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2701', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 6 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 10 },
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '3000.5001.1134', description: '3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL', quantity: 2 },
      { code: '3000.5001.1136', description: '1/2 R2 - 2000 MM X FG 7/8 JIC X FG 90° 1/2 BOL', quantity: 3 },
      { code: '3000.5001.1223', description: '3/8 R2 - 2000 MM X FG 9/16 JIC X FG 90° 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '3000.5003.0006', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 1/4 BSP', quantity: 1, unit: 'PC' },
      { code: '3000.5000.0291', description: 'ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0321', description: 'ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 3 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 2 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1038', description: '3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.1004.0018', description: 'Arruela de pressão M6', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9020',
    description: 'KIT INSTALACAO GT600/800 ROTATOR SEM PASSAGEM EXTRA EM ESCAVADEIRA 20TON - ( MAQUINA COM FATIA EXTRA SEM LINHA)',
    items: [
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 20 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0017', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GT600-GT800 SEM PASSAGEM EXTRA', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 8 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 10 },
      { code: '3000.5003.0008', description: 'BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)', quantity: 1 },
      { code: '3000.5003.0009', description: 'VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER', quantity: 1 },
      { code: '3000.5000.0330', description: 'ADAPTADOR TEE MACHO/FEMEA LATERAL 3/4 JIC', quantity: 2 },
      { code: '3000.5000.0301', description: 'Adaptador macho/macho 3/4 UNF x 9/16 JIC', quantity: 3 },
      { code: '1000.1040.4101', description: 'ABRACADEIRA SUPERIOR FERRO DUPLA PARA TUBO 27MM', quantity: 4 },
      { code: '1000.1040.2701', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC', quantity: 4 },
      { code: '3000.5001.1146', description: '5/8 R12 - 1900 MM X FG 7/8 JIC X FG 90° 7/8 JIC', quantity: 4 },
      { code: '1000.1040.2711', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 7/8JIC', quantity: 2 },
      { code: '1000.1040.2333', description: 'KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR', quantity: 1 },
      { code: '3000.5001.1147', description: '3/8 R2 - 3000MM X FG 7/8 JIC X FG 3/4 JIC', quantity: 1 },
      { code: '3000.5001.1084', description: '1/2 R2 - 3000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1035', description: '3/4 R12 - 3000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1038', description: '3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.1004.0018', description: 'Arruela de pressão M6', quantity: 2 },
      { code: '5000.1001.0018', description: 'MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5001.1018', description: '3/8 R2 - 900MM X FG 3/4 JIC X FG 9/16 JIC', quantity: 2 },
      { code: '3000.5000.0276', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC', quantity: 6 },
      { code: '3000.5000.0277', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 7/8 JIC X 7/8 JIC', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9021',
    description: 'KIT INSTALACAO GARRA + LINCK EM ESCAVADEIRA - ( MAQUINA SEM FATIA )',
    items: [
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '1000.1040.2333', description: 'KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 6 },
      { code: '3000.5001.1110', description: '1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL', quantity: 4 },
      { code: '1000.1040.2705', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT', quantity: 4 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 8 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 24 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5000.0359', description: 'ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2', quantity: 4 },
      { code: '3000.5000.0360', description: 'ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2', quantity: 4 },
      { code: '3000.5000.0308', description: 'Adaptador macho/macho 1/2 NPT x 7/8 JIC', quantity: 4 },
      { code: '3000.5003.0008', description: 'BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)', quantity: 1 },
      { code: '3000.5003.0009', description: 'VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER', quantity: 1 },
      { code: '3000.5000.0282', description: 'Adaptador macho/macho 3/4 UNF x 3/4 JIC', quantity: 3 },
      { code: '3000.5001.1067', description: '1/2 R2 - 1100 MM X FG 1.1/16 JIC X FG 3/4 JIC', quantity: 2 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.1004.0018', description: 'Arruela de pressão M6', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9022',
    description: 'KIT INSTALACAO CMF500/600 EM ESCAVADEIRA - ( MAQUINA COM LINHA ROMPEDOR )',
    items: [
      { code: '1000.1040.2707', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC', quantity: 2 },
      { code: '1000.1040.2709', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5003.0146', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP', quantity: 1 },
      { code: '3000.5000.0291', description: 'ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 3 },
      { code: '3000.5000.0491', description: 'ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '3000.5001.1042', description: '3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1110', description: '1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL', quantity: 3 },
      { code: '3000.5001.1134', description: '3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL', quantity: 2 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '3000.5003.0086', description: 'REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN', quantity: 1 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 2 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1083', description: '3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '5000.1001.0061', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA CMF500/600', quantity: 1 },
      { code: '3000.5000.0321', description: 'ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 3 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9023',
    description: 'KIT INSTALACAO CMF500/600 EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA)',
    items: [
      { code: '5000.1001.0061', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA CMF500/600', quantity: 1 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1083', description: '3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1134', description: '3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL', quantity: 2 },
      { code: '3000.5001.1110', description: '1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL', quantity: 3 },
      { code: '3000.5001.1042', description: '3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '1000.1040.2707', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC', quantity: 2 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.2709', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 10 },
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5003.0146', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP', quantity: 1 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 2 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0491', description: 'ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC', quantity: 1 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 3 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9024',
    description: 'KIT HIDRAULICO PARA INSTALACAO SEGUNDA VELOCIDADE DESTOCADOR',
    items: [
      { code: '3000.5001.1165', description: '1/4 R17 - 600 MM X FG 9/16 JIC X FG 90° 9/16 JIC', quantity: 1 },
      { code: '3000.5003.0008', description: 'BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)', quantity: 1 },
      { code: '3000.5003.0009', description: 'VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER', quantity: 1 },
      { code: '3000.5000.0301', description: 'Adaptador macho/macho 3/4 UNF x 9/16 JIC', quantity: 3 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0321', description: 'ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9025',
    description: 'KIT INSTALACAO CMF500/600 EM ESCAVADEIRA - ( MAQUINA COM LINHA DE GARRA)',
    items: [
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.2707', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC', quantity: 2 },
      { code: '1000.1040.2709', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5003.0146', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP', quantity: 1 },
      { code: '3000.5000.0491', description: 'ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '3000.5001.1042', description: '3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1110', description: '1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL', quantity: 3 },
      { code: '3000.5001.1134', description: '3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL', quantity: 2 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 2 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1083', description: '3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 },
      { code: '5000.1001.0061', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA CMF500/600', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 3 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9026',
    description: 'KIT INSTALACAO CMF500/600 EM ESCAVADEIRA - ( MAQUINA SEM FATIA EXTRA )',
    items: [
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2707', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC', quantity: 2 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.2333', description: 'KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR', quantity: 1 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 10 },
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.2709', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '3000.5001.1134', description: '3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL', quantity: 2 },
      { code: '3000.5001.1110', description: '1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL', quantity: 3 },
      { code: '3000.5001.1042', description: '3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5003.0006', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 1/4 BSP', quantity: 1, unit: 'PC' },
      { code: '3000.5000.0291', description: 'ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 4 },
      { code: '3000.5000.0321', description: 'ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC', quantity: 2 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '3000.5003.0086', description: 'REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN', quantity: 1 },
      { code: '3000.5003.0008', description: 'BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)', quantity: 1 },
      { code: '3000.5003.0009', description: 'VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER', quantity: 1 },
      { code: '3000.5000.0301', description: 'Adaptador macho/macho 3/4 UNF x 9/16 JIC', quantity: 3 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 2 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1083', description: '3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9027',
    description: 'KIT ELETRO HIDRAULICO PA CARREGADEIRA PARA INSTALACAO DE 3ª E 4ª FUNCAO 24V',
    items: [
      { code: '5000.1001.0058', description: 'CAIXA ELETRICA 02 FUNCOES 24V', quantity: 1 },
      { code: '3000.5000.0288', description: 'Adaptador macho/macho 1/2 BSP x 1.1/16 JIC', quantity: 4 },
      { code: '3000.5000.0283', description: 'ADAPTADOR MACHO/MACHO 1/2 BSPP PARALELO COM ANEL VEDACAO ED X 7/8 JIC', quantity: 4 },
      { code: '2000.1000.0743', description: 'SUPORTE VALVULA 6 VIAS', quantity: 1 },
      { code: '3000.1001.0068', description: 'Parafuso Allen 12.9-M8 x 90', quantity: 2 },
      { code: '3000.1001.0069', description: 'PARAFUSO ALLEN 12.9-M8 X 160', quantity: 4 },
      { code: '3000.1003.0005', description: 'Porca M8 parlock', quantity: 6 },
      { code: '3000.2001.0338', description: 'Oring D.I. 26,70 x 1,78 - NBR-90sh - ref. Parker 2023', quantity: 2 },
      { code: '3000.5003.0092', description: 'VALVULA SOLENOIDE DVS90-6-G1/2- 6 VIAS PADRAO G1/2, VAZAO HIDRAULICA MAX. DE 90 LPM COM BOBINA DE ACIONAMENTO 12 OU 24 VDC, UTILIZADA PARA ACIONAMENTO DE MOVIMENTOS HIDRAULICOS EM EQUIPAMENTOS_NCM:8481.80.92', quantity: 2, unit: 'PC' },
      { code: '3000.5000.0364', description: 'ABRACADEIRA DUPLA TUBO 25MM P/ SOLDAR', quantity: 4 },
      { code: '3000.5000.0276', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC', quantity: 2 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5000.0277', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 7/8 JIC X 7/8 JIC', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9028',
    description: 'KIT ELETRO HIDRAULICO PA CARREGADEIRA PARA INSTALACAO DE 3ª FUNCAO 24V',
    items: [
      { code: '5000.1001.0051', description: 'CAIXA ELETRICA 01 FUNCAO 12/24V', quantity: 1 },
      { code: '3000.5003.0092', description: 'VALVULA SOLENOIDE DVS90-6-G1/2- 6 VIAS PADRAO G1/2, VAZAO HIDRAULICA MAX. DE 90 LPM COM BOBINA DE ACIONAMENTO 12 OU 24 VDC, UTILIZADA PARA ACIONAMENTO DE MOVIMENTOS HIDRAULICOS EM EQUIPAMENTOS_NCM:8481.80.92', quantity: 1, unit: 'PC' },
      { code: '3000.5000.0288', description: 'Adaptador macho/macho 1/2 BSP x 1.1/16 JIC', quantity: 4 },
      { code: '3000.5000.0283', description: 'ADAPTADOR MACHO/MACHO 1/2 BSPP PARALELO COM ANEL VEDACAO ED X 7/8 JIC', quantity: 2 },
      { code: '2000.1000.0743', description: 'SUPORTE VALVULA 6 VIAS', quantity: 1 },
      { code: '3000.1001.0068', description: 'Parafuso Allen 12.9-M8 x 90', quantity: 2 },
      { code: '3000.1003.0005', description: 'Porca M8 parlock', quantity: 2 },
      { code: '3000.5000.0364', description: 'ABRACADEIRA DUPLA TUBO 25MM P/ SOLDAR', quantity: 2 },
      { code: '5000.1001.0043', description: 'BOTAO PULSANTE 12MM P9 900016054489 + CAPA P9 C401245-25-1', quantity: 2 },
      { code: '3000.5000.0276', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0277', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 7/8 JIC X 7/8 JIC', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9029',
    description: 'KIT ELETRO HIDRAULICO COMANDO 2 SECCAO 24V PA CARREGADEIRA BOMBA ENGRENAGEM ( 120L/ 250BAR )',
    items: [
      { code: '5000.1001.0053', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR', quantity: 1 },
      { code: '3000.5003.0147', description: 'COMANDO ELETRICO 80LTS - 02 SECC24V', quantity: 1 },
      { code: '3000.5000.0287', description: 'Adaptador macho/macho 7/8 UNF x 7/8 JIC', quantity: 4 },
      { code: '3000.5000.0292', description: 'Adaptador macho/macho 1/8 NPT x 7/16 JIC', quantity: 1 },
      { code: '5000.1001.0018', description: 'MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5000.0428', description: 'Adaptador macho/macho 7/8 UNF X 1.1/16 JIC', quantity: 3 },
      { code: '5000.1001.0057', description: 'CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619', quantity: 4 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '3000.5003.0157', description: 'BLOCO REGULADOR DE FLUXO 3 VIAS 12V 3/4 BSP ( 200L/MIM)', quantity: 1 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 3 }
    ]
  },
  {
    code: '9000.9000.9030',
    description: 'KIT COMANDO ELETRO HIDRAULICO PA CARREGADEIRA 2 FUNCOES LS 24V ( MAQUINA BOMBA PISTAO )',
    items: [
      { code: '3000.5003.0100', description: 'COMANDO HIDRAULICO ELETRICO SDS180/2 - AC(XG-180) /18EI3L/18EI3L/RV-KE2R3-24CDV', quantity: 1 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 3 },
      { code: '5000.1001.0053', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR', quantity: 1 },
      { code: '3000.5000.0284', description: 'Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC', quantity: 4 },
      { code: '3000.5000.0307', description: 'Adaptador macho/macho 1.5/16 UNF x 1.1/16 JIC', quantity: 3 },
      { code: '1000.1040.5200', description: 'TEE 1.1/16 USINADO', quantity: 1 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0491', description: 'ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1167', description: '1/4 R17 - 1000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9031',
    description: 'KIT ELETRO HIDRAULICO COMANDO 1 SECCAO 12V ( 120L/ 250BAR )',
    items: [
      { code: '5000.1001.0050', description: 'CAIXA ELETRICA 02 FUNCOES 12V', quantity: 1 },
      { code: '3000.5003.0091', description: 'COMANDO 1 FUNCAO - CH100 - 1CE - ELETRICO - 12VOLTS', quantity: 1 },
      { code: '3000.5000.0287', description: 'Adaptador macho/macho 7/8 UNF x 7/8 JIC', quantity: 2 },
      { code: '3000.5000.0428', description: 'Adaptador macho/macho 7/8 UNF X 1.1/16 JIC', quantity: 3 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '5000.1001.0057', description: 'CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619', quantity: 2 },
      { code: '3000.5000.0428', description: 'Adaptador macho/macho 7/8 UNF X 1.1/16 JIC', quantity: 1 },
      { code: '3000.5003.0174', description: 'VALVULA ALIVIO VSD8 - (COMANDO 90LTS VH)', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9032',
    description: 'KIT INSTALACAO VIA HIDRAULICA EXTRA MANUAL PARA IMPLEMENTO',
    items: [
      { code: '3000.5003.0039', description: 'REGISTRO VALVULA ESFERA 3 VIAS 1/2 BSP', quantity: 2 },
      { code: '3000.5000.0395', description: 'ADAPTADOR MACHO/FEMEA 1/2 NPT X 7/8 JIC', quantity: 4 },
      { code: '3000.5000.0283', description: 'ADAPTADOR MACHO/MACHO 1/2 BSPP PARALELO COM ANEL VEDACAO ED X 7/8 JIC', quantity: 2 },
      { code: '3000.5000.0358', description: 'PINO ENGATE HID. RAPIDO ROSCA FEMEA 1/2 NPT- (AGRICOLA)', quantity: 2 },
      { code: '3000.5000.0357', description: 'Engate rápido 1/2 NPT fêmea (agrícola)', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9033',
    description: 'KIT ELETRO HIDRAULICO COMANDO 1 SECCAO 24V ( 120L/ 250BAR )',
    items: [
      { code: '5000.1001.0058', description: 'CAIXA ELETRICA 02 FUNCOES 24V', quantity: 1 },
      { code: '3000.5003.0152', description: 'COMANDO ELETRICO 80LTS - 01 SECC24V', quantity: 1 },
      { code: '3000.5000.0287', description: 'Adaptador macho/macho 7/8 UNF x 7/8 JIC', quantity: 2 },
      { code: '3000.5000.0284', description: 'Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC', quantity: 2 },
      { code: '5000.1001.0042', description: 'MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '5000.1001.0057', description: 'CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619', quantity: 2 },
      { code: '3000.5003.0149', description: 'CONECTOR PASSAGEM PRESSAO P80', quantity: 1 },
      { code: '3000.5000.0428', description: 'Adaptador macho/macho 7/8 UNF X 1.1/16 JIC', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9034',
    description: 'KIT ELETRO HIDRAULICO COMANDO 2 SECCAO 12V ( 120L/ 250BAR )',
    items: [
      { code: '5000.1001.0052', description: 'CAIXA ELETRICA 04 FUNCOES 12V ( 4 RELES )', quantity: 1 },
      { code: '3000.5003.0161', description: 'COMANDO ELETRICO 100LTS - 02 SECC12V - (V027C100-0001-12VDC)', quantity: 1 },
      { code: '3000.5000.0287', description: 'Adaptador macho/macho 7/8 UNF x 7/8 JIC', quantity: 4 },
      { code: '5000.1001.0018', description: 'MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5000.0428', description: 'Adaptador macho/macho 7/8 UNF X 1.1/16 JIC', quantity: 3 },
      { code: '3000.5000.0337', description: 'BUJAO MACHO SEXTAVADO INTERNO 3/8 BSP', quantity: 1 },
      { code: '5000.1001.0057', description: 'CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619', quantity: 4 }
    ]
  },
  {
    code: '9000.9000.9035',
    description: 'KIT INSTALACAO CMF500/600 EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA "ACIONADA" SEM LINHA)',
    items: [
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2707', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC', quantity: 2 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 10 },
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.2709', description: 'TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '3000.5001.1134', description: '3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL', quantity: 2 },
      { code: '3000.5001.1110', description: '1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL', quantity: 3 },
      { code: '3000.5001.1042', description: '3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5003.0006', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 1/4 BSP', quantity: 1, unit: 'PC' },
      { code: '3000.5000.0291', description: 'ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 4 },
      { code: '3000.5000.0321', description: 'ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '3000.5003.0086', description: 'REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN', quantity: 1 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 2 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1083', description: '3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9037',
    description: 'KIT INSTALACAO CMF500/600 EM ESCAVADEIRA - ( MAQUINA COM LINHA DE HARVESTER)',
    items: [
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '3000.5001.1134', description: '3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL', quantity: 2 },
      { code: '3000.5001.1110', description: '1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL', quantity: 3 },
      { code: '3000.5001.1042', description: '3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5003.0146', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP', quantity: 1 },
      { code: '3000.5000.0291', description: 'ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 3 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '3000.5003.0086', description: 'REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN', quantity: 1 },
      { code: '3000.5001.1083', description: '3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0491', description: 'ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC', quantity: 1 },
      { code: '5000.1001.0042', description: 'MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9038',
    description: 'KIT INSTALACAO GT600/800 ROTATOR SEM PASSAGEM EXTRA EM ESCAVADEIRA ( MAQUINA COM LINHA DE HARVESTER)',
    items: [
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 10 },
      { code: '1000.1040.2333', description: 'KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR', quantity: 1 },
      { code: '1000.1040.4101', description: 'ABRACADEIRA SUPERIOR FERRO DUPLA PARA TUBO 27MM', quantity: 4 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0017', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GT600-GT800 SEM PASSAGEM EXTRA', quantity: 1 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1146', description: '5/8 R12 - 1900 MM X FG 7/8 JIC X FG 90° 7/8 JIC', quantity: 4 },
      { code: '3000.5001.1147', description: '3/8 R2 - 3000MM X FG 7/8 JIC X FG 3/4 JIC', quantity: 1 },
      { code: '3000.5001.1084', description: '1/2 R2 - 3000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1035', description: '3/4 R12 - 3000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1038', description: '3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0301', description: 'Adaptador macho/macho 3/4 UNF x 9/16 JIC', quantity: 3 },
      { code: '3000.5003.0008', description: 'BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)', quantity: 1 },
      { code: '3000.5003.0009', description: 'VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER', quantity: 1 },
      { code: '3000.5000.0330', description: 'ADAPTADOR TEE MACHO/FEMEA LATERAL 3/4 JIC', quantity: 2 },
      { code: '5000.1001.0042', description: 'MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '5000.1001.0018', description: 'MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL', quantity: 1 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.1004.0018', description: 'Arruela de pressão M6', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9039',
    description: 'KIT INSTALACAO GT600/800/360 ROTATOR SEM PASSAGEM EXTRA EM ESCAVADEIRA ( MAQUINA COM LINHA DE ROMPEDOR)',
    items: [
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 12 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0017', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GT600-GT800 SEM PASSAGEM EXTRA', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 8 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 6 },
      { code: '3000.5003.0008', description: 'BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)', quantity: 1 },
      { code: '3000.5003.0009', description: 'VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER', quantity: 1 },
      { code: '3000.5000.0330', description: 'ADAPTADOR TEE MACHO/FEMEA LATERAL 3/4 JIC', quantity: 2 },
      { code: '3000.5000.0301', description: 'Adaptador macho/macho 3/4 UNF x 9/16 JIC', quantity: 3 },
      { code: '1000.1040.4101', description: 'ABRACADEIRA SUPERIOR FERRO DUPLA PARA TUBO 27MM', quantity: 4 },
      { code: '1000.1040.2701', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC', quantity: 4 },
      { code: '3000.5001.1146', description: '5/8 R12 - 1900 MM X FG 7/8 JIC X FG 90° 7/8 JIC', quantity: 4 },
      { code: '1000.1040.2711', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 7/8JIC', quantity: 2 },
      { code: '1000.1040.2333', description: 'KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR', quantity: 1 },
      { code: '3000.5001.1147', description: '3/8 R2 - 3000MM X FG 7/8 JIC X FG 3/4 JIC', quantity: 1 },
      { code: '3000.5001.1084', description: '1/2 R2 - 3000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1035', description: '3/4 R12 - 3000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1038', description: '3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.1004.0018', description: 'Arruela de pressão M6', quantity: 2 },
      { code: '5000.1001.0018', description: 'MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5001.1018', description: '3/8 R2 - 900MM X FG 3/4 JIC X FG 9/16 JIC', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9040',
    description: 'KIT ELETRO HIDRAULICO COMANDO COM CONTROLE DE ACIONAMENTO GARRA KL2500T EM EMPILHADEIRA',
    items: [
      { code: '3000.5003.0170', description: 'VALVULA SELETORA 6 VIAS HSV06-/-A-1-P6-S1 -12V-50L/250BAR', quantity: 2 },
      { code: '3000.5000.0282', description: 'Adaptador macho/macho 3/4 UNF x 3/4 JIC', quantity: 2 },
      { code: '3000.5000.0320', description: 'Adaptador macho/fêmea 3/4 UNF x 3/4 JIC', quantity: 2 },
      { code: '3000.5000.0502', description: 'ADAPTADOR MACHO/MACHO 3/4UNF X M16 X 1,5 DKO T10', quantity: 6 },
      { code: '3000.5000.0503', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS M16X1,5 TB10 X M16X1,5 DKO TB10', quantity: 6 },
      { code: '3000.1001.0056', description: 'Parafuso Allen 12.9-M8 x 25', quantity: 6 },
      { code: '3000.1004.0003', description: 'Arruela lisa M6', quantity: 2 },
      { code: '3000.5000.0301', description: 'Adaptador macho/macho 3/4 UNF x 9/16 JIC', quantity: 2 },
      { code: '3000.5000.0362', description: 'ENGATE RAPIDO MACHO FACE PLANA 9/16 UNF-14 - CORPO 1/4', quantity: 2 },
      { code: '3000.5000.0361', description: 'ENGATE RAPIDO FEMEA FACE PLANA 9/16 UNF-14 - CORPO 1/4', quantity: 2 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 4 },
      { code: '3000.5000.0119', description: 'FEMEA GIRATORIA M16 X 1,5 T10 X 3/8', quantity: 2 },
      { code: '3000.5001.1194', description: '3/8 R2 - 900 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 2 },
      { code: '5000.1001.0007', description: 'Porta Fusível Baioneta Fio 1,5mm ETE 719', quantity: 1 },
      { code: '5000.1001.0027', description: 'Conector para Reles com 5 Vias', quantity: 2 },
      { code: '3000.1002.0046', description: 'PARAFUSO 4,2 X 13MM FLANGEADO CROMADO PONTA AGULHA', quantity: 2 },
      { code: '5000.1001.0038', description: 'Caixa PVC 154 x 110 x 70mm S.SX.161 LIGHT IP55 - STECK', quantity: 1 },
      { code: '5000.1001.0030', description: 'Cabo PP 3 x 1,00mm PT', quantity: 2.5, unit: 'MT' },
      { code: '5000.1001.0005', description: 'Rele Auxiliar 4 pinos 12 Volts c/ Suporte 40A', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9041',
    description: 'KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - ( MAQUINA COM LINHA DE GARRA)',
    items: [
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.5600', description: 'ABRACADEIRA CONJUNTO SIMPLES Ø27', quantity: 4 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '5000.1001.0039', description: 'PEDAL ACIONAMENTO 10A 250V 1REV MINI TFS-100 - COM CABO 1METRO', quantity: 2 },
      { code: '3000.5003.0075', description: 'Valvula esfera 2 vias 3/4BSP', quantity: 2 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 2 },
      { code: '2000.1000.2847', description: 'CHAPA PERFIL L ADAPTADOR PAINEL 7/8', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '4000.5000.0019', description: 'ABRACADEIRA NYLON 4,8 X 400MM', quantity: 10 }
    ]
  },
  {
    code: '9000.9000.9042',
    description: 'KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - ( MAQUINA COM LINHA HARVESTER)',
    items: [
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0039', description: 'PEDAL ACIONAMENTO 10A 250V 1REV MINI TFS-100 - COM CABO 1METRO', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9043',
    description: 'KIT INSTALACAO GT600/800 + LANCA EXTENSORA ROTATOR SEM PASSAGEM EXTRA EM ESCAVADEIRA 20TON - ( MAQUINA COM FATIA EXTRA SEM LINHA)',
    items: [
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 28 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 8 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 8 },
      { code: '3000.5003.0008', description: 'BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)', quantity: 1 },
      { code: '3000.5003.0009', description: 'VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER', quantity: 1 },
      { code: '3000.5000.0301', description: 'Adaptador macho/macho 3/4 UNF x 9/16 JIC', quantity: 3 },
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.4101', description: 'ABRACADEIRA SUPERIOR FERRO DUPLA PARA TUBO 27MM', quantity: 4 },
      { code: '1000.1040.2705', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT', quantity: 4 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '3000.5000.0330', description: 'ADAPTADOR TEE MACHO/FEMEA LATERAL 3/4 JIC', quantity: 2 },
      { code: '1000.1040.2333', description: 'KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR', quantity: 1 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1038', description: '3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.1004.0018', description: 'Arruela de pressão M6', quantity: 2 },
      { code: '5000.1001.0018', description: 'MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5001.1018', description: '3/8 R2 - 900MM X FG 3/4 JIC X FG 9/16 JIC', quantity: 2 },
      { code: '1000.1040.2712', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 7/8JIC', quantity: 2 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0379', description: 'Adaptador Painel 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1002', description: '1/2 R2 - 1200mm x FG 7/8 JIC x FG 45° 7/8JIC', quantity: 4 },
      { code: '3000.5001.1046', description: '1/2 R2 - 1800 MM X FG 7/8 JIC X MF 1/2 NPT', quantity: 4 },
      { code: '3000.5001.1134', description: '3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL', quantity: 4 },
      { code: '3000.5000.0359', description: 'ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2', quantity: 4 },
      { code: '3000.5000.0360', description: 'ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2', quantity: 4 },
      { code: '3000.5000.0480', description: 'ENGATE RAPIDO FEMEA PLT4 FACE PLANA 3/4 BSP-14 - CORPO 3/4', quantity: 2 },
      { code: '3000.5000.0479', description: 'ENGATE RAPIDO MACHO PLT4 FACE PLANA 3/4 BSP-14 - CORPO 3/4', quantity: 2 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1212', description: '1/2 R2 - 1800 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1213', description: '3/8 R2 - 1800 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1214', description: '3/8 R2 - 1800 MM X FG 7/8 JIC X FG 9/16 JIC', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9044',
    description: 'KIT INSTALACAO CMF500/600 + LINCK ESCAVADEIRA CAT 320GC - ( MAQUINA COM FATIA EXTRA SEM LINHA)',
    items: [
      { code: '3000.5003.0100', description: 'COMANDO HIDRAULICO ELETRICO SDS180/2 - AC(XG-180) /18EI3L/18EI3L/RV-KE2R3-24CDV', quantity: 1 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 38 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 10 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 3 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 4 },
      { code: '3000.5000.0284', description: 'Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC', quantity: 4 },
      { code: '3000.5000.0307', description: 'Adaptador macho/macho 1.5/16 UNF x 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0276', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC', quantity: 8 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 4 },
      { code: '5000.1001.0053', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR', quantity: 1 },
      { code: '5000.1001.0018', description: 'MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL', quantity: 1 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 12 },
      { code: '3000.5001.1180', description: '3/4R12 - 1000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '3000.5000.0333', description: 'ADAPTADOR TEE MACHO/FEMEA LATERAL 9/16 JIC', quantity: 1 },
      { code: '1000.1040.2705', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT', quantity: 2 },
      { code: '1000.1040.2712', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 7/8JIC', quantity: 2 },
      { code: '3000.5000.0359', description: 'ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2', quantity: 2 },
      { code: '3000.5000.0360', description: 'ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2', quantity: 2 },
      { code: '3000.5000.0480', description: 'ENGATE RAPIDO FEMEA PLT4 FACE PLANA 3/4 BSP-14 - CORPO 3/4', quantity: 2 },
      { code: '3000.5000.0479', description: 'ENGATE RAPIDO MACHO PLT4 FACE PLANA 3/4 BSP-14 - CORPO 3/4', quantity: 2 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1134', description: '3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL', quantity: 2 },
      { code: '3000.5001.1110', description: '1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL', quantity: 3 },
      { code: '3000.5001.1042', description: '3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0395', description: 'ADAPTADOR MACHO/FEMEA 1/2 NPT X 7/8 JIC', quantity: 2 },
      { code: '3000.5001.1214', description: '3/8 R2 - 1800 MM X FG 7/8 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5003.0146', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP', quantity: 1 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0491', description: 'ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9045',
    description: 'KIT INSTALACAO CMF500 + PONTEIRA PARA RETRO (MAQUINA COM LINHA EXTRA BI-DIRECIONAL)',
    items: [
      { code: '3000.5003.0008', description: 'BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)', quantity: 1 },
      { code: '3000.5003.0009', description: 'VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER', quantity: 1 },
      { code: '3000.5000.0301', description: 'Adaptador macho/macho 3/4 UNF x 9/16 JIC', quantity: 3 }
    ]
  },
  {
    code: '9000.9000.9046',
    description: 'KIT INSTALACAO GARRA EM ESCAVADEIRA - (MAQUINA COM LINHA EXTRA BI-DIRECIONAL)',
    items: [
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.2701', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC', quantity: 4 },
      { code: '3000.5001.1161', description: '1/2 R2 - 1650 mm x FG 7/8 JIC x FG 90° 7/8 JIC', quantity: 4 }
    ]
  },
  {
    code: '9000.9000.9047',
    description: 'KIT INSTALACAO GT280/360 EM GRUA - ( MAQUINA COM FATIA EXTRA )',
    items: [
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 2 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9048',
    description: 'KIT INSTALACAO CMF500/600 + LINCK EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA)',
    items: [
      { code: '5000.1001.0061', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA CMF500/600', quantity: 1 },
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1083', description: '3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 8 },
      { code: '3000.5001.1134', description: '3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL', quantity: 2 },
      { code: '3000.5001.1042', description: '3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1110', description: '1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL', quantity: 3 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.2705', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT', quantity: 2 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5003.0146', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP', quantity: 1 },
      { code: '3000.5000.0291', description: 'ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 2 },
      { code: '3000.5000.0491', description: 'ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '3000.5000.0396', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0336', description: 'BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0366', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC', quantity: 3 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 2 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0321', description: 'ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC', quantity: 1 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5003.0075', description: 'Valvula esfera 2 vias 3/4BSP', quantity: 2 },
      { code: '3000.5000.0359', description: 'ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2', quantity: 3 },
      { code: '3000.5000.0360', description: 'ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2', quantity: 3 },
      { code: '3000.5000.0308', description: 'Adaptador macho/macho 1/2 NPT x 7/8 JIC', quantity: 2 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 6 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 4 },
      { code: '3000.5000.0361', description: 'ENGATE RAPIDO FEMEA FACE PLANA 9/16 UNF-14 - CORPO 1/4', quantity: 1 },
      { code: '3000.5000.0362', description: 'ENGATE RAPIDO MACHO FACE PLANA 9/16 UNF-14 - CORPO 1/4', quantity: 1 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 4 },
      { code: '3000.5003.0188', description: 'VALVULA CONTROLE FLUXO BI-DIRECIONAL 3/4 BSP', quantity: 2 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '3000.5000.0399', description: 'Adaptador macho/femea 9/16 UNF X 9/16 JIC', quantity: 1 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 14 }
    ]
  },
  {
    code: '9000.9000.9049',
    description: 'KIT INSTALACAO CMF500/600 + LINCK EM ESCAVADEIRA - ( MAQUINA COM LINHA DE GARRA)',
    items: [
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1083', description: '3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '3000.5001.1134', description: '3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL', quantity: 2 },
      { code: '3000.5001.1042', description: '3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1110', description: '1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL', quantity: 3 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 2 },
      { code: '1000.1040.2705', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT', quantity: 2 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 14 },
      { code: '3000.5000.0318', description: 'Adaptador Painel 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5003.0146', description: 'VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP', quantity: 1 },
      { code: '3000.5000.0291', description: 'ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 2 },
      { code: '3000.5000.0491', description: 'ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '2000.1000.3147', description: 'CHAPA PAINEL 9/16 -7/8 INSTALACAO', quantity: 1 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5000.0396', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0336', description: 'BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0366', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC', quantity: 3 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 2 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 1 },
      { code: '3000.5000.0321', description: 'ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC', quantity: 1 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5003.0075', description: 'Valvula esfera 2 vias 3/4BSP', quantity: 2 },
      { code: '3000.5000.0359', description: 'ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2', quantity: 2 },
      { code: '3000.5000.0360', description: 'ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2', quantity: 2 },
      { code: '3000.5000.0308', description: 'Adaptador macho/macho 1/2 NPT x 7/8 JIC', quantity: 2 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 6 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 4 },
      { code: '3000.5000.0361', description: 'ENGATE RAPIDO FEMEA FACE PLANA 9/16 UNF-14 - CORPO 1/4', quantity: 1 },
      { code: '3000.5000.0362', description: 'ENGATE RAPIDO MACHO FACE PLANA 9/16 UNF-14 - CORPO 1/4', quantity: 1 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 4 },
      { code: '3000.5003.0182', description: 'REGISTRO VALVULA ESFERA 3 VIAS 3/4BSP', quantity: 2 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '3000.5000.0399', description: 'Adaptador macho/femea 9/16 UNF X 9/16 JIC', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9050',
    description: 'KIT COMANDO ELETRO HIDRAULICO PA CARREGADEIRA 1 FUNCAO LS 24V (MAQUINA BOMBA PISTAO)',
    items: [
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 3 },
      { code: '1000.1040.2333', description: 'KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR', quantity: 1 },
      { code: '5000.1001.0053', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR', quantity: 1 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '5000.1001.0043', description: 'BOTAO PULSANTE 12MM P9 900016054489 + CAPA P9 C401245-25-1', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9051',
    description: 'KIT INSTALACAO FELLER TESOURA EM ESCAVADEIRA - ( MAQUINA COM LINHA DE GARRA )',
    items: [
      { code: '3000.5003.0100', description: 'COMANDO HIDRAULICO ELETRICO SDS180/2 - AC(XG-180) /18EI3L/18EI3L/RV-KE2R3-24CDV', quantity: 1 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 24 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1175', description: '3/4 R12 - 2300 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0311', description: 'ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 4 },
      { code: '3000.5000.0381', description: 'Adaptador macho/macho 1/2 BSP x 9/16 JIC', quantity: 2 },
      { code: '3000.5000.0284', description: 'Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC', quantity: 4 },
      { code: '3000.5000.0307', description: 'Adaptador macho/macho 1.5/16 UNF x 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0276', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC', quantity: 6 },
      { code: '3000.5000.0274', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC', quantity: 2 },
      { code: '5000.1001.0053', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR', quantity: 1 },
      { code: '5000.1001.0018', description: 'MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL', quantity: 1 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '3000.5001.1180', description: '3/4R12 - 1000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '3000.5000.0333', description: 'ADAPTADOR TEE MACHO/FEMEA LATERAL 9/16 JIC', quantity: 2 },
      { code: '3000.5001.1008', description: '1/2 R2 - 2300 MM X FG 7/8 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1138', description: '3/4R12 - 1000 MM X FG 1.1/16 JIC X FG 90° 1.1/16 JIC', quantity: 4 },
      { code: '3000.5001.1009', description: '3/4 R2 - 1300 MM X FG 1.1/16 JIC X FG 90° 1.1/16 JIC', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9052',
    description: 'ACIONAMENTO ELETRO HIDRAULICO PARA GARRA FLORESTAL NA ESCAVADEIRA - EXPORTACAO',
    items: [
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR', quantity: 1 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9053',
    description: 'ACIONAMENTO ELETRO HIDRAULICO PARA CABECOTE MULTIFUNCIONAL NA ESCAVADEIRA - EXPORTACAO',
    items: [
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0061', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA CMF500/600', quantity: 1 },
      { code: '5000.1001.0059', description: 'MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 3 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.1004.0018', description: 'Arruela de pressão M6', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9054',
    description: 'ACIONAMENTO ELETRO HIDRAULICO PARA GARRA TRACADORA NA ESCAVADEIRA - EXPORTACAO',
    items: [
      { code: '1000.1040.2305', description: 'KIT ACIONAMENTO FATIA AUXILIAR 24V', quantity: 1 },
      { code: '5000.1001.0017', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GT600-GT800 SEM PASSAGEM EXTRA', quantity: 1 },
      { code: '5000.1001.0018', description: 'MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5003.0008', description: 'BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)', quantity: 1 },
      { code: '3000.5003.0009', description: 'VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER', quantity: 1 },
      { code: '3000.5000.0330', description: 'ADAPTADOR TEE MACHO/FEMEA LATERAL 3/4 JIC', quantity: 2 },
      { code: '3000.5000.0301', description: 'Adaptador macho/macho 3/4 UNF x 9/16 JIC', quantity: 3 },
      { code: '2000.1000.3181', description: 'CHAPA SUPORTE VALVULA PILOTO SIMPLES', quantity: 1 },
      { code: '3000.1000.0076', description: 'Parafuso Sextavado 8.8-M6 x 45', quantity: 2 },
      { code: '3000.1003.0073', description: 'Porca M6 parlock', quantity: 2 },
      { code: '3000.1004.0018', description: 'Arruela de pressão M6', quantity: 2 },
      { code: '1000.1040.2333', description: 'KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR', quantity: 1 }
    ]
  },
  {
    code: '9000.9000.9056',
    description: 'KIT INSTALACAO FELLER DISCO EM ESCAVADEIRA CAT 320 GC- ( MAQUINA COM FATIA EXTRA "ACIONADA" COM LINHA EXTRA)',
    items: [
      { code: '1000.1040.5700', description: 'FLANGE 1.3/4 (44,5) X COM ROSCA 3/4 BSP', quantity: 1 },
      { code: '3000.2001.0349', description: 'Oring W 3,53 x D.I. 32,92 - ref. Parker 2219', quantity: 1 },
      { code: '3000.5000.0307', description: 'Adaptador macho/macho 1.5/16 UNF x 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0276', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC', quantity: 1 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 1 },
      { code: '3000.5000.0287', description: 'Adaptador macho/macho 7/8 UNF x 7/8 JIC', quantity: 1 },
      { code: '3000.1001.0016', description: 'Parafuso Allen 12.9-M10 x 40', quantity: 4 },
      { code: '5000.1001.0012', description: 'Plug Conector 24V', quantity: 1 },
      { code: '3000.5000.0376', description: 'Adaptador macho/macho 7/16 UNF x 9/16 JIC', quantity: 1 },
      { code: '3000.5003.0190', description: 'BOBINA 24V 20W -( VALVULA 2/2 OD1533175A000000 VEI 016 NC 1)', quantity: 1 },
      { code: '3000.5002.0090', description: 'BOMBA PISTAO A10VO72 DRS/3R VSC12K52 - (EIXO 1" X 15DENTES) 105 L/MIN', quantity: 1 },
      { code: '3000.5003.0191', description: 'BLOCO SDC16-2-S16S- 1.5/16 UNF', quantity: 1 },
      { code: '3000.5003.0192', description: 'VALVULA 2/2 OD1533175A000000 VEI 016 NC 1 - (2VIAS PARA BLOCO SDC16)', quantity: 1 },
      { code: '1000.2039.0101', description: 'Adaptador usinado 9/16 JIC', quantity: 1 },
      { code: '5000.1001.0053', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR', quantity: 1 },
      { code: '3000.5003.0158', description: 'COMANDO ELETRICO 100L 02 SECC24V COM VALVULAS DE ALIVIO NAS FATIAS + BUJAO PASSAGEM PRESSAO', quantity: 1 },
      { code: '5000.1001.0057', description: 'CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619', quantity: 4 },
      { code: '3000.5000.0287', description: 'Adaptador macho/macho 7/8 UNF x 7/8 JIC', quantity: 7 },
      { code: '3000.5000.0366', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC', quantity: 1 },
      { code: '3000.5000.0426', description: 'ABRACADEIRA MANGOTE PESADO 32MM MSA 54-62 (PARA MANGUEIRA SUCCAO 2)', quantity: 2 },
      { code: '3000.5001.0029', description: 'MANGUEIRA HIDRAULICA R4 2 (SUCCAO)', quantity: 0.8, unit: 'MT' },
      { code: '3000.5000.0436', description: 'MACHO FIXO 2 NPT X 2 (MANGUEIRA DE 2")', quantity: 1 },
      { code: '3000.5000.0516', description: 'FLANGE BIPARTIDA 2 (PARA FLANGE Ø71,4)', quantity: 1, unit: 'PAR' },
      { code: '3000.5000.0517', description: 'FLANGE RETA 71,4MM X 2"', quantity: 1 },
      { code: '3000.5001.1179', description: '1/4 R17 - 550 MM X FG 9/16 JIC X FG 90° 9/16 JIC', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 12 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 6 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 12 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 36 },
      { code: '3000.5003.0075', description: 'Valvula esfera 2 vias 3/4BSP', quantity: 6 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 6 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 6 },
      { code: '1000.1040.1107', description: 'ADAPTADOR PARA SOLDA 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '2000.1000.2847', description: 'CHAPA PERFIL L ADAPTADOR PAINEL 7/8', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '4000.5000.0019', description: 'ABRACADEIRA NYLON 4,8 X 400MM', quantity: 30 }
    ]
  },
  {
    code: '9000.9000.9057',
    description: 'KIT INSTALACAO GARRA EM ESCAVADEIRA CAT 320GC COM FATIA DUPLA ACIONADA',
    items: [
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 10 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 4 },
      { code: '1000.1040.2701', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC', quantity: 4 },
      { code: '3000.5000.0276', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC', quantity: 4 }
    ]
  },
  {
    code: '9000.9000.9059',
    description: 'KIT INSTALACAO GT600/800 ROTATOR SEM PASSAGEM EXTRA EM ESCAVADEIRA CAT 320 GC/NG- ( MAQUINA COM FATIA EXTRA "ACIONADA" SEM LINHA EXTRA)',
    items: [
      { code: '1000.1040.4200', description: 'ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 2 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 20 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 8 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 10 },
      { code: '1000.1040.4101', description: 'ABRACADEIRA SUPERIOR FERRO DUPLA PARA TUBO 27MM', quantity: 4 },
      { code: '1000.1040.2701', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC', quantity: 4 },
      { code: '3000.5001.1146', description: '5/8 R12 - 1900 MM X FG 7/8 JIC X FG 90° 7/8 JIC', quantity: 4 },
      { code: '1000.1040.2711', description: 'TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 7/8JIC', quantity: 2 },
      { code: '3000.5001.1147', description: '3/8 R2 - 3000MM X FG 7/8 JIC X FG 3/4 JIC', quantity: 1 },
      { code: '3000.5001.1084', description: '1/2 R2 - 3000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1035', description: '3/4 R12 - 3000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '1000.1040.1102', description: 'ADAPTADOR PARA SOLDA 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1038', description: '3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC', quantity: 1 },
      { code: '5000.1001.0018', description: 'MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL', quantity: 1 },
      { code: '3000.5000.0276', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC', quantity: 6 },
      { code: '3000.5000.0277', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 7/8 JIC X 7/8 JIC', quantity: 2 }
    ]
  },
  {
    code: '9000.9000.9060',
    description: 'KIT INSTALACAO FELLER DISCO EM ESCAVADEIRA- ( MAQUINA COM FATIA EXTRA SEM LINHA EXTRA)',
    items: [
      { code: '3000.5003.0198', description: 'BLOCO DE COMANDO FELLER DISCO (HYDRAFORCE 187761-26)', quantity: 1 },
      { code: '1000.1040.5700', description: 'FLANGE 1.3/4 (44,5) X COM ROSCA 3/4 BSP', quantity: 1 },
      { code: '3000.2001.0349', description: 'Oring W 3,53 x D.I. 32,92 - ref. Parker 2219', quantity: 2 },
      { code: '3000.5000.0276', description: 'ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC', quantity: 8 },
      { code: '3000.5000.0324', description: 'ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC', quantity: 1 },
      { code: '3000.5000.0287', description: 'Adaptador macho/macho 7/8 UNF x 7/8 JIC', quantity: 4 },
      { code: '3000.1001.0016', description: 'Parafuso Allen 12.9-M10 x 40', quantity: 4 },
      { code: '5000.1001.0053', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR', quantity: 1 },
      { code: '5000.1001.0057', description: 'CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619', quantity: 5 },
      { code: '3000.5000.0366', description: 'BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1188', description: '3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 12 },
      { code: '1000.1040.2703', description: 'TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC', quantity: 6 },
      { code: '1000.1040.2702', description: 'TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC', quantity: 12 },
      { code: '1000.1040.4100', description: 'ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA', quantity: 36 },
      { code: '3000.5000.0294', description: 'Adaptador macho/macho 3/4 BSP x 1.1/16 JIC', quantity: 2 },
      { code: '1000.1040.1107', description: 'ADAPTADOR PARA SOLDA 1.1/16 JIC', quantity: 2 },
      { code: '3000.5000.0317', description: 'Adaptador Painel 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1142', description: '5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '4000.5000.0019', description: 'ABRACADEIRA NYLON 4,8 X 400MM', quantity: 30 },
      { code: '3000.5003.0003', description: 'VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)', quantity: 1 },
      { code: '3000.5003.0004', description: 'BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF', quantity: 1 },
      { code: '3000.5003.0084', description: 'BOBINA M13-24D-20W-DN/FL - SOLENOIDE', quantity: 1 },
      { code: '3000.5000.0398', description: 'Adaptador macho/macho 9/16 UNF X 9/16 JIC', quantity: 3 },
      { code: '3000.5001.1180', description: '3/4R12 - 1000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 1 },
      { code: '3000.5001.1175', description: '3/4 R12 - 2300 MM X FG 1.1/16 JIC X FG 1.1/16 JIC', quantity: 2 },
      { code: '3000.5001.1045', description: '1/2 R2 - 1800 MM X FG 7/8 JIC X FG 1.1/16 JIC', quantity: 4 },
      { code: '3000.5001.1010', description: '1/2 R2 - 2500 MM X FG 7/8 JIC X FG 7/8 JIC', quantity: 1 },
      { code: '3000.5001.1228', description: '5/8 R12 - 1000 MM x FG 7/8 JIC x FG 1.1/16 JIC', quantity: 4 }
    ]
  }
];
