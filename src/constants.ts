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
  { brand: 'LONKING', model: '6225/6235', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0060', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'LONKING', model: '6150', pin: 'PINO Ø60', ponteira_biela_4: '1000.0000.0016', suporte_triturador: '1000.1420.0000' },
  { brand: 'NEW HOLLAND', model: 'E210/E215B', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'NEW HOLLAND', model: 'E175B', pin: 'PINO Ø70', ponteira_biela_4: '1000.0000.0071', suporte_destocador: '1000.1204.0000', suporte_triturador: '1000.1325.0000', link_garra_biela_4: '1000.0000.0178' },
  { brand: 'NEW HOLLAND', model: 'E145/E315B', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'SANY', model: '215C', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'SANY', model: '155', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'SANY', model: '135/155H', pin: 'PINO Ø60', ponteira_biela_4: '1000.0000.0098', ponteira_biela_6: '1000.0000.0063', suporte_destocador: '1000.1263.0000', suporte_triturador: '1000.1420.0000', link_garra_biela_6: '1000.0000.0091' },
  { brand: 'SDLG', model: '6150/150 VERIFICAR', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'VOLVO', model: 'EC210B', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'VOLVO', model: 'EC140B', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
  { brand: 'VOLVO', model: '250', pin: 'PINO Ø90', ponteira_biela_4: '1000.0000.0056' },
  { brand: 'XCMG', model: 'XE215BR', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', suporte_destocador: '1000.1191.0000', suporte_triturador: '1000.1295.0000', link_garra_biela_4: '1000.0000.0120' },
  { brand: 'XCMG', model: 'XE150D', pin: 'PINO Ø65', ponteira_biela_4: '1000.0000.0072', ponteira_biela_6: '1000.0000.0102', suporte_destocador: '1000.1256.0000', suporte_triturador: '1000.1400.0000', link_garra_biela_6: '1000.0000.0139', link_garra_biela_4: '1000.0000.0123' },
];

export interface InstallationKit {
  code: string;
  description: string;
  items: {
    code: string;
    quantity: number;
    description: string;
  }[];
}

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
  }
];
