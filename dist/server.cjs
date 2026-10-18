var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_fs = __toESM(require("fs"), 1);
var import_resend = require("resend");
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_node_cron = __toESM(require("node-cron"), 1);
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_module = require("module");
var import_cors = __toESM(require("cors"), 1);
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var import_firestore = require("firebase-admin/firestore");
var import_storage = require("firebase-admin/storage");

// src/constants.ts
var ACCESSORIES_DATA = [
  { brand: "CASE", model: "CX180C/CX200", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0019", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_4: "1000.0000.0120" },
  { brand: "CASE", model: "CX130", pin: "PINO \xD865", ponteira_biela_4: "1000.0000.0072", ponteira_biela_6: "1000.0000.0102", suporte_destocador: "1000.1256.0000", suporte_triturador: "1000.1400.0000", link_garra_biela_6: "1000.0000.0139", link_garra_biela_4: "1000.0000.0123" },
  { brand: "CATERPILLAR", model: "320D/320FM", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0019", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_6: "1000.0000.0171", link_garra_biela_4: "1000.0000.0120" },
  { brand: "CATERPILLAR", model: "315/318D2L", pin: "PINO \xD870", ponteira_biela_4: "1000.0000.0071", suporte_triturador: "1000.1325.0000", link_garra_biela_4: "1000.0000.0178" },
  { brand: "CATERPILLAR", model: "312D/313", pin: "PINO \xD865", ponteira_biela_4: "1000.0000.0072", ponteira_biela_6: "1000.0000.0102", suporte_destocador: "1000.1256.0000", suporte_triturador: "1000.1400.0000", link_garra_biela_6: "1000.0000.0139", link_garra_biela_4: "1000.0000.0123" },
  { brand: "DOOSAN", model: "DX140LC", pin: "PINO \xD865", ponteira_biela_4: "1000.0000.0072", ponteira_biela_6: "1000.0000.0102", suporte_destocador: "1000.1256.0000", suporte_triturador: "1000.1400.0000", link_garra_biela_6: "1000.0000.0139", link_garra_biela_4: "1000.0000.0123" },
  { brand: "FIATALLIS", model: "FX215LC", pin: "PINO \xD870", ponteira_biela_4: "1000.0000.0100", suporte_triturador: "1000.1325.0000", link_garra_biela_4: "1000.0000.0178" },
  { brand: "FIATALLIS", model: "FH150B", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0019", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_4: "1000.0000.0120" },
  { brand: "HYUNDAI", model: "260LC9", pin: "PINO \xD890", ponteira_biela_4: "1000.0000.0056", suporte_destocador: "1000.1260.0000" },
  { brand: "HYUNDAI", model: "210/R225", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0019", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_4: "1000.0000.0120" },
  { brand: "HYUNDAI", model: "160/180/200G", pin: "PINO \xD870", ponteira_biela_4: "1000.0000.0071", suporte_destocador: "1000.1204.0000", suporte_triturador: "1000.1325.0000", link_garra_biela_4: "1000.0000.0178" },
  { brand: "HYUNDAI", model: "140/150", pin: "PINO \xD865", ponteira_biela_4: "1000.0000.0072", ponteira_biela_6: "1000.0000.0102", suporte_destocador: "1000.1256.0000", suporte_triturador: "1000.1400.0000", link_garra_biela_6: "1000.0000.0139", link_garra_biela_4: "1000.0000.0123" },
  { brand: "JCB", model: "JS200", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0019", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_4: "1000.0000.0120" },
  { brand: "JCB", model: "130LC", pin: "PINO \xD865", ponteira_biela_4: "1000.0000.0072", ponteira_biela_6: "1000.0000.0102", suporte_destocador: "1000.1256.0000", suporte_triturador: "1000.1400.0000", link_garra_biela_6: "1000.0000.0139", link_garra_biela_4: "1000.0000.0123" },
  { brand: "JOHN DEERE", model: "160LC/200G/210G-P", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0019", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_4: "1000.0000.0120" },
  { brand: "JOHN DEERE", model: "130G", pin: "PINO \xD865", ponteira_biela_4: "1000.0000.0072", ponteira_biela_6: "1000.0000.0102", suporte_destocador: "1000.1256.0000", suporte_triturador: "1000.1400.0000", link_garra_biela_6: "1000.0000.0139", link_garra_biela_4: "1000.0000.0123" },
  { brand: "KOMATSU", model: "PC200", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0019", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_4: "1000.0000.0120" },
  { brand: "KOMATSU", model: "PC160", pin: "PINO \xD870", ponteira_biela_4: "1000.0000.0071", suporte_destocador: "1000.1204.0000", suporte_triturador: "1000.1325.0000", link_garra_biela_4: "1000.0000.0178" },
  { brand: "KOMATSU", model: "PC130", pin: "PINO \xD860", ponteira_biela_4: "1000.0000.0098", ponteira_biela_6: "1000.0000.0063", suporte_destocador: "1000.1263.0000", suporte_triturador: "1000.1420.0000", link_garra_biela_6: "1000.0000.0091", link_garra_biela_4: "1000.0000.0167" },
  { brand: "LINK BELT", model: "180/210", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0019", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_4: "1000.0000.0120" },
  { brand: "LIUGONG", model: "LG915", pin: "PINO \xD860", ponteira_biela_4: "1000.0000.0098", ponteira_biela_6: "1000.0000.0063", suporte_destocador: "1000.1263.0000", suporte_triturador: "1000.1420.0000", link_garra_biela_6: "1000.0000.0091", link_garra_biela_4: "1000.0000.0167" },
  { brand: "LIUGONG", model: "908", pin: "PINO \xD850", ponteira_biela_4: "1000.0000.0144", ponteira_biela_6: "1000.0000.0070", suporte_triturador: "1000.1399.0100", photo_urls: { ponteira: "/uploads/ponteira_1000_0000_0144.svg", suporte: "/uploads/suporte_1000_1399_0100.svg" } },
  { brand: "LONKING", model: "6225/6235", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0060", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_4: "1000.0000.0120" },
  { brand: "LONKING", model: "6150", pin: "PINO \xD860", ponteira_biela_4: "1000.0000.0016", suporte_triturador: "1000.1420.0000" },
  { brand: "NEW HOLLAND", model: "E210/E215B", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0019", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_4: "1000.0000.0120" },
  { brand: "NEW HOLLAND", model: "E175B", pin: "PINO \xD870", ponteira_biela_4: "1000.0000.0071", suporte_destocador: "1000.1204.0000", suporte_triturador: "1000.1325.0000", link_garra_biela_4: "1000.0000.0178" },
  { brand: "NEW HOLLAND", model: "E145/E135B", pin: "PINO \xD865", ponteira_biela_4: "1000.0000.0072", ponteira_biela_6: "1000.0000.0102", suporte_destocador: "1000.1256.0000", suporte_triturador: "1000.1400.0000", link_garra_biela_6: "1000.0000.0139", link_garra_biela_4: "1000.0000.0123" },
  { brand: "SANY", model: "215C", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0019", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_4: "1000.0000.0120" },
  { brand: "SANY", model: "155", pin: "PINO \xD865", ponteira_biela_4: "1000.0000.0072", ponteira_biela_6: "1000.0000.0102", suporte_destocador: "1000.1256.0000", suporte_triturador: "1000.1400.0000", link_garra_biela_6: "1000.0000.0139", link_garra_biela_4: "1000.0000.0123" },
  { brand: "SANY", model: "135/155H", pin: "PINO \xD860", ponteira_biela_4: "1000.0000.0098", ponteira_biela_6: "1000.0000.0063", suporte_destocador: "1000.1263.0000", suporte_triturador: "1000.1420.0000", link_garra_biela_6: "1000.0000.0091" },
  { brand: "SDLG", model: "6150/150", pin: "PINO \xD865", ponteira_biela_4: "1000.0000.0072", ponteira_biela_6: "1000.0000.0102", suporte_destocador: "1000.1256.0000", suporte_triturador: "1000.1400.0000", link_garra_biela_6: "1000.0000.0139", link_garra_biela_4: "1000.0000.0123" },
  { brand: "VOLVO", model: "EC210B", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0019", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_4: "1000.0000.0120" },
  { brand: "VOLVO", model: "EC140B", pin: "PINO \xD865", ponteira_biela_4: "1000.0000.0072", ponteira_biela_6: "1000.0000.0102", suporte_destocador: "1000.1256.0000", suporte_triturador: "1000.1400.0000", link_garra_biela_6: "1000.0000.0139", link_garra_biela_4: "1000.0000.0123" },
  { brand: "VOLVO", model: "250", pin: "PINO \xD890", ponteira_biela_4: "1000.0000.0056" },
  { brand: "XCMG", model: "XE215BR", pin: "PINO \xD880", ponteira_biela_4: "1000.0000.0019", suporte_destocador: "1000.1191.0000", suporte_triturador: "1000.1295.0000", link_garra_biela_4: "1000.0000.0120" },
  { brand: "XCMG", model: "XE150D", pin: "PINO \xD865", ponteira_biela_4: "1000.0000.0072", ponteira_biela_6: "1000.0000.0102", suporte_destocador: "1000.1256.0000", suporte_triturador: "1000.1400.0000", link_garra_biela_6: "1000.0000.0139", link_garra_biela_4: "1000.0000.0123" }
];
var INSTALLATION_KITS = [
  {
    code: "9000.9000.9000",
    description: "KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA)",
    items: [
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 10 },
      { code: "1000.1040.5600", description: "ABRACADEIRA CONJUNTO SIMPLES \xD827", quantity: 4 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "5000.1001.0039", description: "PEDAL ACIONAMENTO 10A 250V 1REV MINI TFS-100 - COM CABO 1METRO", quantity: 2 },
      { code: "3000.5003.0075", description: "Valvula esfera 2 vias 3/4BSP", quantity: 2 },
      { code: "3000.5000.0294", description: "Adaptador macho/macho 3/4 BSP x 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0324", description: "ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC", quantity: 2 },
      { code: "2000.1000.2847", description: "CHAPA PERFIL L ADAPTADOR PAINEL 7/8", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "4000.5000.0019", description: "ABRACADEIRA NYLON 4,8 X 400MM", quantity: 10 }
    ]
  },
  {
    code: "9000.9000.9001",
    description: "KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - ( MAQUINA COM LINHA ROMPEDOR)",
    items: [
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 1 },
      { code: "2000.1000.2847", description: "CHAPA PERFIL L ADAPTADOR PAINEL 7/8", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "5000.1001.0039", description: "PEDAL ACIONAMENTO 10A 250V 1REV MINI TFS-100 - COM CABO 1METRO", quantity: 2 },
      { code: "4000.5000.0019", description: "ABRACADEIRA NYLON 4,8 X 400MM", quantity: 10 }
    ]
  },
  {
    code: "9000.9000.9002",
    description: 'KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA "ACIONADA" SEM LINHA)',
    items: [
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 10 },
      { code: "1000.1040.5600", description: "ABRACADEIRA CONJUNTO SIMPLES \xD827", quantity: 4 },
      { code: "3000.5003.0075", description: "Valvula esfera 2 vias 3/4BSP", quantity: 2 },
      { code: "3000.5000.0294", description: "Adaptador macho/macho 3/4 BSP x 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0324", description: "ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC", quantity: 2 },
      { code: "1000.1040.1107", description: "ADAPTADOR PARA SOLDA 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "2000.1000.2847", description: "CHAPA PERFIL L ADAPTADOR PAINEL 7/8", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9003",
    description: "KIT BAIXA PRESSAO 1 SECCAO DUPLA CAT320GC/NG 24V ( 80L/ 190BAR )",
    items: [
      { code: "5000.1001.0058", description: "CAIXA ELETRICA 02 FUNCOES 24V", quantity: 1 },
      { code: "3000.5003.0152", description: "COMANDO ELETRICO 80LTS - 01 SECC24V", quantity: 1 },
      { code: "3000.5000.0287", description: "Adaptador macho/macho 7/8 UNF x 7/8 JIC", quantity: 2 },
      { code: "3000.5000.0284", description: "Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC", quantity: 2 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "5000.1001.0057", description: "CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619", quantity: 2 },
      { code: "3000.5000.0428", description: "Adaptador macho/macho 7/8 UNF X 1.1/16 JIC", quantity: 1 },
      { code: "3000.5002.0093", description: "BOMBA ENGRENAGEM 48 CC - EIXO 25 X 15 DENTES (ROTACAO HORARIO)", quantity: 1 },
      { code: "3000.5000.0281", description: "Adaptador macho/macho 1.5/16 UNF x 1.5/16 JIC", quantity: 1 },
      { code: "3000.5000.0284", description: "Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC", quantity: 1 },
      { code: "5000.1001.0043", description: "BOTAO PULSANTE 12MM P9 900016054489 + CAPA P9 C401245-25-1", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9015",
    description: "KIT INSTALACAO GARRA + LINK EM ESCAVADEIRA - (MAQUINA COM FATIA EXTRA SEM LINHA)",
    items: [
      { code: "1000.0000.0120", description: "Link Garra Biela 4 para maquinas pino 80mm", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9004",
    description: "KIT INSTALACAO CMF500/600 + LINCK EM ESCAVADEIRA - (MAQUINA COM LINHA ROMPEDOR)",
    items: [
      { code: "3000.5001.1188", description: "MANGUEIRAS DE ALTA VAZAO 3/4 R12 X 1.1/16 JIC", quantity: 2 },
      { code: "5000.1001.0016", description: "CHICOTE DE COMANDO ELETRO-HIDRAULICO 24V", quantity: 1 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "3000.5001.1142", description: "MANGUEIRA DE DRENO 5/8 R2 X 7/8 JIC", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9016",
    description: "KIT INSTALACAO DE GARRA EM ESCAVADEIRA SEM FATIA EXTRA (DERIVACAO DA BOMBA)",
    items: [
      { code: "3000.5003.0152", description: "BLOCO MANIFOLD 2 SOLENOIDES BAIXO FLUXO 24V PARA ROTATOR", quantity: 1 },
      { code: "3000.5001.1142", description: "MANGUEIRAS DERIVACAO DA BOMBA PRINCIPAL", quantity: 2 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK COM 2 BOTOES PULSANTES", quantity: 1 },
      { code: "5000.1001.0016", description: "CHICOTE ELETRICO DE COMANDO 24V", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9027",
    description: "KIT 3\xAA E 4\xAA FUNCAO 24V PARA PA CARREGADEIRA",
    items: [
      { code: "3000.5003.0152", description: "VALVULA DIRECIONAL 3\xAA E 4\xAA FUNCAO 24V", quantity: 1 },
      { code: "5000.1001.0059", description: "JOYSTICK ELETRONICO 24V", quantity: 1 },
      { code: "3000.5001.1188", description: "MANGUEIRAS E CONEXOES DE ALTA PRESSAO", quantity: 4 }
    ]
  }
];

// server.ts
var import_meta = {};
var customRequire;
if (typeof require !== "undefined") {
  customRequire = require;
} else {
  try {
    customRequire = (0, import_module.createRequire)(import_meta.url);
  } catch (err) {
    customRequire = (moduleName) => {
      console.warn("Could not load module dynamically in ESM", moduleName);
      return {};
    };
  }
}
var { PDFParse } = customRequire("pdf-parse");
import_dotenv.default.config();
var __currentDir;
try {
  __currentDir = import_path.default.dirname((0, import_url.fileURLToPath)(import_meta.url));
} catch (e) {
  __currentDir = process.cwd();
}
var __appDir = __currentDir;
var config = {};
try {
  const saConfigPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(saConfigPath)) {
    config = JSON.parse(import_fs.default.readFileSync(saConfigPath, "utf8"));
  }
} catch (e) {
  console.warn("[FIREBASE-ADMIN] Could not load firebase-applet-config.json:", e.message);
}
function fixConsultantImages(text, index) {
  const norm = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const STOP = /* @__PURE__ */ new Set(["de", "da", "do", "das", "dos", "para", "com", "e", "o", "a", "roder", "modelo", "equipamento", "foto", "imagem"]);
  const tokens = (v) => norm(v).split(/[^a-z0-9]+/).filter((t) => t.length >= 2 && !STOP.has(t));
  const knownUrls = new Set(index.map((i) => i.url));
  let shown = 0;
  const used = /* @__PURE__ */ new Set();
  return text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt, url) => {
    const altTokens = tokens(alt);
    let best = null;
    for (const entry of index) {
      const lt = new Set(tokens(entry.label));
      let score = 0;
      for (const t of altTokens) if (lt.has(t)) score += /\d/.test(t) ? 3 : 1;
      if (score > 0 && (!best || score > best.score)) best = { url: entry.url, score };
    }
    const finalUrl = best ? best.url : knownUrls.has(url) ? url : "";
    if (!finalUrl || used.has(finalUrl) || shown >= 1) return "";
    used.add(finalUrl);
    shown++;
    return `![${alt}](${finalUrl})`;
  }).replace(/\n{3,}/g, "\n\n");
}
var adminApp;
if (import_firebase_admin.default.apps.length === 0) {
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const saStr = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      let sa;
      if (saStr.startsWith("{")) {
        sa = JSON.parse(saStr);
      } else {
        sa = JSON.parse(Buffer.from(saStr, "base64").toString("ascii"));
      }
      credential = import_firebase_admin.default.credential.cert(sa);
      console.log("[FIREBASE-ADMIN] Initialized using FIREBASE_SERVICE_ACCOUNT environment variable.");
    } catch (e) {
      console.error("[FIREBASE-ADMIN] Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:", e.message);
    }
  }
  if (!credential) {
    const saPath = import_path.default.join(process.cwd(), "firebase-service-account.json");
    if (import_fs.default.existsSync(saPath)) {
      try {
        const sa = JSON.parse(import_fs.default.readFileSync(saPath, "utf8"));
        credential = import_firebase_admin.default.credential.cert(sa);
        console.log("[FIREBASE-ADMIN] Initialized using firebase-service-account.json file.");
      } catch (e) {
        console.error("[FIREBASE-ADMIN] Failed to parse firebase-service-account.json file:", e.message);
      }
    }
  }
  const initConfig = {
    projectId: config.projectId || process.env.FIREBASE_PROJECT_ID || "ai-studio-e7c58188-6deb-4a73-b6a5-1858f8dce981"
  };
  if (credential) {
    initConfig.credential = credential;
  }
  adminApp = import_firebase_admin.default.initializeApp(initConfig);
} else {
  adminApp = import_firebase_admin.default.app();
}
var db = (0, import_firestore.getFirestore)(adminApp, config.firestoreDatabaseId || process.env.FIRESTORE_DATABASE_ID || "(default)");
function getTodayLocalDate() {
  const d = /* @__PURE__ */ new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getLocalDateString(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString.split("T")[0];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
var genAI = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in the server environment!");
      return null;
    }
    console.log(`[AI] Initializing with key length: ${apiKey.length}`);
    genAI = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "user-agent": "aistudio-build"
        }
      }
    });
  }
  return genAI;
}
async function generateContentWithRetry(ai, params) {
  const modelToUse = params.defaultModel || "gemini-3.5-flash";
  const maxAttempts = 2;
  let delay = 800;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model: modelToUse,
        contents: params.contents,
        config: params.config
      });
    } catch (error) {
      console.warn(`Error on attempt ${attempt}/${maxAttempts} with model ${modelToUse}:`, error);
      const errorStr = (error.message || "").toLowerCase();
      const statusCode = error.status || error.statusCode || 0;
      const isRetryable = statusCode === 429 || statusCode === 503 || statusCode === 500 || errorStr.includes("429") || errorStr.includes("503") || errorStr.includes("500") || errorStr.includes("quota") || errorStr.includes("exhausted") || errorStr.includes("rate limit") || errorStr.includes("unavailable") || errorStr.includes("high demand") || errorStr.includes("overloaded") || errorStr.includes("temporary") || errorStr.includes("temp") || errorStr.includes("busy");
      if (isRetryable && attempt < maxAttempts) {
        console.warn(`Retryable error detected. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      const fallbacks = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
      for (const fallbackModel of fallbacks) {
        if (modelToUse !== fallbackModel) {
          console.warn(`[AI-FALLBACK] Attempting fallback to stable model '${fallbackModel}'...`);
          try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            return await ai.models.generateContent({
              model: fallbackModel,
              contents: params.contents,
              config: params.config
            });
          } catch (fallbackErr) {
            console.error(`[AI-FALLBACK] Fallback model '${fallbackModel}' failed:`, fallbackErr.message || fallbackErr);
          }
        }
      }
      throw error;
    }
  }
}
async function classifyQuestionTopic(ai, question) {
  const lower = question.toLowerCase();
  if (lower.includes("compativ") || lower.includes("compat\xEDb") || lower.includes("peso") || lower.includes("tonelada") || lower.includes("escavadeira") || lower.includes("trator") || lower.includes("indica") || lower.includes("pc")) return "Compatibilidade";
  if (lower.includes("produtiv") || lower.includes("ciclo") || lower.includes("t/h") || lower.includes("f\xF3rmula") || lower.includes("madeira") || lower.includes("calcul") || lower.includes("produz")) return "Produtividade de Garra";
  if (lower.includes("estoque") || lower.includes("pronta entrega") || lower.includes("disponiv") || lower.includes("temos") || lower.includes("disponibilidade") || lower.includes("tem no estoque")) return "Estoque/Disponibilidade";
  if (lower.includes("ca\xE7amba") || lower.includes("high tip") || lower.includes("p\xE1 carregadeira") || lower.includes("descarga") || lower.includes("capacidade")) return "Ca\xE7amba High Tip";
  return "D\xFAvida Geral";
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = process.env.PORT || 3e3;
  app.use((0, import_cors.default)({
    origin: function(origin, callback) {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cache-Control", "Pragma"]
  }));
  app.use(import_express.default.json({ limit: "50mb" }));
  const uploadsDir = import_path.default.join(process.cwd(), "uploads");
  if (!import_fs.default.existsSync(uploadsDir)) {
    import_fs.default.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", import_express.default.static(uploadsDir));
  const RELEASE_LABEL = "2026-10-17m video-galeria";
  const SERVER_STARTED_AT = (/* @__PURE__ */ new Date()).toISOString();
  app.get("/api/version", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ release: RELEASE_LABEL, started_at: SERVER_STARTED_AT });
  });
  app.get("/api/health", async (req, res) => {
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const hasServiceAccount = !!(process.env.FIREBASE_SERVICE_ACCOUNT || import_fs.default.existsSync(import_path.default.join(process.cwd(), "firebase-service-account.json")));
    if (!hasGeminiKey || !hasServiceAccount) {
      console.warn(`[HEALTHCHECK] Server is not fully credentialed! hasGeminiKey: ${hasGeminiKey}, hasServiceAccount: ${hasServiceAccount}`);
      return res.status(200).json({
        status: "partially_configured",
        message: "Missing environment variables or credentials.",
        hasGeminiKey,
        hasServiceAccount
      });
    }
    try {
      const testPromise = db.collection("settings").doc("email").get();
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Firestore check timed out")), 3e3)
      );
      await Promise.race([testPromise, timeoutPromise]);
      res.json({
        status: "ok",
        hasGeminiKey: true,
        hasServiceAccount: true,
        env: process.env.NODE_ENV,
        forceViteDev: process.env.FORCE_VITE_DEV
      });
    } catch (dbErr) {
      console.error("[HEALTHCHECK] Firestore connectivity check failed:", dbErr.message);
      return res.status(200).json({
        status: "degraded",
        message: "Firestore check failed: " + dbErr.message,
        hasGeminiKey,
        hasServiceAccount
      });
    }
  });
  async function validateRoderApiKey(req, requiredPermission) {
    const rawKey = req.headers["x-api-key"] || req.headers["authorization"] || req.query.api_key;
    if (!rawKey) {
      return { valid: false, status: 401, error: "Chave de API n\xE3o fornecida. Envie via cabe\xE7alho x-api-key ou Authorization: Bearer <chave>." };
    }
    const token = typeof rawKey === "string" && rawKey.startsWith("Bearer ") ? rawKey.slice(7).trim() : String(rawKey).trim();
    try {
      const keysQuery = await db.collection("api_keys").where("key", "==", token).where("active", "==", true).limit(1).get();
      if (keysQuery.empty) {
        return { valid: false, status: 403, error: "Chave de API inv\xE1lida, inativa ou revogada." };
      }
      const keyDoc = keysQuery.docs[0];
      const keyData = keyDoc.data();
      if (requiredPermission && keyData.permissions && keyData.permissions[requiredPermission] === false) {
        return { valid: false, status: 403, error: `Esta chave de API n\xE3o possui permiss\xE3o para acessar o m\xF3dulo: ${requiredPermission}.` };
      }
      keyDoc.ref.update({
        last_used_at: (/* @__PURE__ */ new Date()).toISOString()
      }).catch((err) => console.warn("[API-KEY] Error updating last_used_at:", err.message));
      return { valid: true, keyData: { id: keyDoc.id, ...keyData } };
    } catch (err) {
      console.error("[API-KEY] Error validating API key:", err.message);
      return { valid: false, status: 500, error: "Falha ao autenticar chave de API no servidor.", keyData: null };
    }
  }
  app.get("/api/v1/stock", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-api-key, Authorization");
    const authCheck = await validateRoderApiKey(req, "stock");
    if (!authCheck.valid) {
      return res.status(authCheck.status || 401).json({
        success: false,
        error: authCheck.error
      });
    }
    try {
      const branchFilter = String(req.query.branch || "all").toLowerCase();
      const stockSnap = await db.collection("stock_items").get();
      const rawStockItems = stockSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const resSnap = await db.collection("stock_reservations").where("status", "==", "active").get();
      const activeReservations = resSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const faeSnap = await db.collection("stock_imports_fae").get();
      const faeImports = faeSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const processedItems = rawStockItems.map((item) => {
        const itemReservations = activeReservations.filter((r) => r.stock_item_id === item.id);
        const reservedCount = itemReservations.reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
        const physicalQty = Number(item.quantity) || 0;
        const availableQty = Math.max(0, physicalQty - reservedCount);
        const itemBranch = (item.branch || "").toLowerCase() === "sinop" ? "sinop" : "fabrica";
        return {
          id: item.id,
          code: item.code || "",
          description: item.description || "",
          physical_quantity: physicalQty,
          available_quantity: availableQty,
          reserved_quantity: reservedCount,
          reservations_count: itemReservations.length,
          branch: itemBranch,
          branch_name: itemBranch === "sinop" ? "Sinop (MT)" : "F\xE1brica (Matriz)",
          source: item.source || "roder",
          updated_at: item.updated_at || null
        };
      });
      const filteredItems = processedItems.filter((item) => {
        if (branchFilter === "fabrica") return item.branch === "fabrica";
        if (branchFilter === "sinop") return item.branch === "sinop";
        return true;
      });
      const fabricaItems = processedItems.filter((i) => i.branch === "fabrica");
      const sinopItems = processedItems.filter((i) => i.branch === "sinop");
      const faeProcessed = faeImports.map((f) => ({
        id: f.id,
        code: f.code || "",
        description: f.description || "",
        quantity: Number(f.quantity) || 0,
        embarque: f.embarque || "",
        chegada: f.chegada || "",
        created_at: f.created_at || null,
        updated_at: f.updated_at || null
      }));
      return res.json({
        success: true,
        company: "RODER Brasil",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        app_name: authCheck.keyData?.name || "External App",
        summary: {
          total_fabrica_items: fabricaItems.length,
          total_sinop_items: sinopItems.length,
          total_fae_imports: faeProcessed.length,
          total_active_reservations: activeReservations.length
        },
        data: {
          fabrica: fabricaItems,
          sinop: sinopItems,
          fae_imports: faeProcessed,
          all_items: filteredItems
        }
      });
    } catch (err) {
      console.error("[API-STOCK] Error reading stock data:", err.message);
      return res.status(500).json({
        success: false,
        error: "Erro interno ao processar dados de estoque."
      });
    }
  });
  app.post("/api/v1/api-keys/generate", async (req, res) => {
    try {
      const { name, permissions, created_by } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ success: false, error: "O nome do aplicativo ou destino \xE9 obrigat\xF3rio." });
      }
      const randomHex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const apiKey = `rod_live_${randomHex}`;
      const keyDoc = {
        name: name.trim(),
        key: apiKey,
        active: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        created_by: created_by || "Admin",
        last_used_at: null,
        permissions: {
          stock: permissions?.stock !== false,
          catalog: !!permissions?.catalog,
          leads: !!permissions?.leads
        }
      };
      const docRef = await db.collection("api_keys").add(keyDoc);
      return res.json({
        success: true,
        key: {
          id: docRef.id,
          ...keyDoc
        }
      });
    } catch (err) {
      console.error("[API-KEYS] Error generating API key:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/v1/api-keys", async (req, res) => {
    try {
      const snap = await db.collection("api_keys").orderBy("created_at", "desc").get();
      const keys = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      return res.json({ success: true, keys });
    } catch (err) {
      console.error("[API-KEYS] Error listing API keys:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.patch("/api/v1/api-keys/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { active, permissions } = req.body;
      const keyRef = db.collection("api_keys").doc(id);
      const updateData = {};
      if (typeof active === "boolean") updateData.active = active;
      if (permissions) updateData.permissions = permissions;
      await keyRef.update(updateData);
      return res.json({ success: true });
    } catch (err) {
      console.error("[API-KEYS] Error updating API key:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.delete("/api/v1/api-keys/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection("api_keys").doc(id).delete();
      return res.json({ success: true });
    } catch (err) {
      console.error("[API-KEYS] Error deleting API key:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/parse-kits-pdf", async (req, res) => {
    try {
      const { fileBase64, rawText } = req.body;
      let text = rawText || "";
      if (fileBase64) {
        try {
          const { PDFParse: PDFParse2 } = customRequire("pdf-parse");
          if (PDFParse2) {
            const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, "");
            const buffer = Buffer.from(cleanBase64, "base64");
            const parser = new PDFParse2({ data: buffer });
            const pdfData = await parser.getText();
            text = pdfData?.text || "";
          }
        } catch (pdfErr) {
          console.error("[PARSE-PDF] Error parsing PDF buffer with pdf-parse:", pdfErr.message);
        }
        if (!text || text.trim().length < 20) {
          try {
            const ai = getGenAI();
            if (ai) {
              console.log("[PARSE-PDF] Triggering Gemini 2.5 Flash direct PDF multimodal parser...");
              const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, "");
              const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        inlineData: {
                          mimeType: "application/pdf",
                          data: cleanBase64
                        }
                      },
                      {
                        text: `Voc\xEA \xE9 um extrator especialista de relat\xF3rios DBCorp PCR de kits de instala\xE7\xE3o de m\xE1quinas florestais da Roder M\xE1quinas.
Analise com m\xE1xima precis\xE3o este documento PDF e extraia todos os Kits de Instala\xE7\xE3o e seus respectivos itens componentes.

Cada kit possui:
- code: c\xF3digo oficial do kit (formato XXXX.XXXX.XXXX, por exemplo 9000.9000.9000 at\xE9 9000.9000.9060 ou similar)
- description: descri\xE7\xE3o do kit de instala\xE7\xE3o
- items: lista de pe\xE7as/itens contidos no kit, com:
  - code: c\xF3digo da pe\xE7a (XXXX.XXXX.XXXX)
  - description: descri\xE7\xE3o da pe\xE7a
  - quantity: quantidade num\xE9rica (ex: 1, 2, 4)

Retorne estritamente um array JSON com os kits encontrados:
[
  {
    "code": "9000.9000.9000",
    "description": "KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA...",
    "items": [
      { "code": "5000.1001.0016", "description": "CAIXA ELETRICA...", "quantity": 1 }
    ]
  }
]`
                      }
                    ]
                  }
                ],
                config: {
                  responseMimeType: "application/json"
                }
              });
              const aiJson = response.text?.trim();
              if (aiJson) {
                const parsedAiKits = JSON.parse(aiJson);
                if (Array.isArray(parsedAiKits) && parsedAiKits.length > 0) {
                  console.log(`[PARSE-PDF] Gemini successfully extracted ${parsedAiKits.length} kits directly from PDF!`);
                  return res.json({
                    success: true,
                    count: parsedAiKits.length,
                    kits: parsedAiKits
                  });
                }
              }
            }
          } catch (geminiPdfErr) {
            console.error("[PARSE-PDF] Gemini direct PDF parse error:", geminiPdfErr.message);
          }
        }
      }
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: "Nenhum texto ou arquivo PDF leg\xEDvel recebido. Voc\xEA tamb\xE9m pode colar o texto do relat\xF3rio diretamente." });
      }
      const kitsMap = /* @__PURE__ */ new Map();
      const lines = text.split(/\r?\n/);
      let currentKitCode = null;
      let pendingItem = null;
      const flushPendingItem = () => {
        if (pendingItem && currentKitCode && kitsMap.has(currentKitCode)) {
          const itemCode = pendingItem.code;
          const cleanDesc = pendingItem.descParts.join(" ").replace(/\s+/g, " ").trim();
          const qty = pendingItem.qty !== void 0 && !isNaN(pendingItem.qty) ? pendingItem.qty : 1;
          const currentKit = kitsMap.get(currentKitCode);
          const existingIdx = currentKit.items.findIndex((it) => it.code === itemCode);
          if (existingIdx >= 0) {
            currentKit.items[existingIdx] = { code: itemCode, description: cleanDesc || currentKit.items[existingIdx].description, quantity: qty };
          } else {
            currentKit.items.push({ code: itemCode, description: cleanDesc, quantity: qty });
          }
        }
        pendingItem = null;
      };
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        if (line.startsWith("Roder M\xE1quinas") || line.startsWith("Quant. Item Pai") || line.includes("DBCorp PCR") || line.startsWith("N\xEDvel N\xBA Item") || line.startsWith("Filtros:") || line.includes("Relat\xF3rio de Estruturas") || line === "Item" || line === "Item UN Vers\xE3o" || line === "UN" || line === "Vers\xE3o") {
          continue;
        }
        const kitMatch = line.match(/(9000\.\d{4}\.\d{4}|\d{4}\.\d{4}\.\d{4})\s*(.*)/i);
        const isChildItem = line.match(/\d{4}\.\d{4}\.\d{4}\s+.+?\s+(UN|PC|MT|PAR)\s+[\d,]+/i) || line.match(/^\d+\s+\d+\s+\d{4}\.\d{4}\.\d{4}/);
        if (kitMatch && !isChildItem) {
          flushPendingItem();
          const code = kitMatch[1].trim();
          let desc = (kitMatch[2] || "").trim();
          desc = desc.replace(/^Item\s+UN\s+Versão\s+/i, "").replace(/\s+UN\s*\d*$/i, "").trim();
          let nextLineIdx = i + 1;
          while (nextLineIdx < lines.length) {
            const nextL = lines[nextLineIdx].trim();
            if (!nextL) {
              nextLineIdx++;
              continue;
            }
            if (nextL.match(/^Nível/i) || nextL.match(/^\d+\s+\d+\s+\d{4}\.\d{4}\.\d{4}/) || nextL.match(/^(?:9000|\d{4})\.\d{4}\.\d{4}/)) {
              break;
            }
            if (!nextL.match(/DBCorp|Roder|Quant\.|Filtros/i)) {
              const cleanNext = nextL.replace(/\s+UN\s*\d*$/i, "").replace(/^UN\s*\d*$/i, "").trim();
              if (cleanNext && cleanNext !== "1" && cleanNext !== "UN") {
                desc = (desc + " " + cleanNext).trim();
              }
            }
            i = nextLineIdx;
            nextLineIdx++;
            break;
          }
          currentKitCode = code;
          if (!kitsMap.has(code)) {
            kitsMap.set(code, { code, description: desc, items: [] });
          } else if (desc) {
            kitsMap.get(code).description = desc;
          }
          continue;
        }
        const itemStartMatch = line.match(/(?:^|\s)(\d{4}\.\d{4}\.\d{4})\s*(.*)/);
        if (itemStartMatch && currentKitCode) {
          const itemCode = itemStartMatch[1].trim();
          if (itemCode === currentKitCode) continue;
          flushPendingItem();
          let rest = itemStartMatch[2].trim();
          let qty;
          const unitQtyMatch = rest.match(/(.*?)\s+(UN|PC|MT|PAR)\s+([\d]+(?:[,\.]\d+)?)/i);
          if (unitQtyMatch) {
            const descPart = unitQtyMatch[1].trim();
            qty = parseFloat(unitQtyMatch[3].replace(",", "."));
            pendingItem = { code: itemCode, descParts: descPart ? [descPart] : [], qty };
            flushPendingItem();
          } else {
            pendingItem = { code: itemCode, descParts: rest ? [rest] : [] };
          }
          continue;
        }
        if (pendingItem) {
          const unitQtyMatch = line.match(/(.*?)\s*(?:UN|PC|MT|PAR)\s+([\d]+(?:[,\.]\d+)?)/i);
          if (unitQtyMatch) {
            const descPart = unitQtyMatch[1].trim();
            if (descPart) pendingItem.descParts.push(descPart);
            pendingItem.qty = parseFloat(unitQtyMatch[2].replace(",", "."));
            flushPendingItem();
          } else if (!line.match(/^\d+\/\d+\/\d{4}$/) && !line.match(/^[\d\s]+$/)) {
            pendingItem.descParts.push(line);
          }
        }
      }
      flushPendingItem();
      let parsedKits = Array.from(kitsMap.values());
      console.log(`[PARSE-PDF] Local regex extracted ${parsedKits.length} kits from text.`);
      if (parsedKits.length === 0 && text.trim().length > 30) {
        try {
          const ai = getGenAI();
          if (ai) {
            console.log("[PARSE-PDF] Local regex found 0 kits. Running Gemini text structuring...");
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `Abaixo est\xE1 o texto de um relat\xF3rio de kits de instala\xE7\xE3o da Roder M\xE1quinas (DBCorp PCR).
Identifique e extraia todos os Kits de Instala\xE7\xE3o e suas respectivas pe\xE7as/itens componentes.

Texto do relat\xF3rio:
${text.slice(0, 8e4)}

Retorne um array JSON no formato exato:
[
  {
    "code": "9000.9000.9000",
    "description": "KIT INSTALACAO...",
    "items": [
      { "code": "5000.1001.0016", "description": "CAIXA ELETRICA...", "quantity": 1 }
    ]
  }
]`
                    }
                  ]
                }
              ],
              config: {
                responseMimeType: "application/json"
              }
            });
            const aiJson = response.text?.trim();
            if (aiJson) {
              const aiKits = JSON.parse(aiJson);
              if (Array.isArray(aiKits) && aiKits.length > 0) {
                console.log(`[PARSE-PDF] Gemini successfully extracted ${aiKits.length} kits from text!`);
                parsedKits = aiKits;
              }
            }
          }
        } catch (aiTextErr) {
          console.error("[PARSE-PDF] Gemini text structuring error:", aiTextErr.message);
        }
      }
      res.json({
        success: true,
        count: parsedKits.length,
        kits: parsedKits
      });
    } catch (err) {
      console.error("[PARSE-PDF] Error processing PDF request:", err);
      res.status(500).json({ error: err.message || "Erro ao processar o arquivo PDF." });
    }
  });
  app.post("/api/reassign-export-lead", async (req, res) => {
    try {
      const docRef = db.collection("indications").doc("lBMjE4xQ1tImzmGT1NTK");
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "Indica\xE7\xE3o n\xE3o encontrada" });
      }
      const yuryUid = "QfWBeRvpreTskZZGQxmr8cK6BIR2";
      const yuryName = "Yury Mello";
      const currentData = docSnap.data() || {};
      const history = currentData.negotiation_history || [];
      history.push({
        id: Math.random().toString(36).substring(2, 11),
        type: "system",
        author_name: "Sistema (Exporta\xE7\xE3o)",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        content: `\u{1F30E} Reclassificado como LEAD DE EXPORTA\xC7\xC3O (Argentina). Atendimento transferido automaticamente para ${yuryName}.`,
        attachments: []
      });
      await docRef.update({
        internal_seller_uid: yuryUid,
        internal_seller_name: yuryName,
        is_export: true,
        export_country: "Argentina",
        client_location: "Eldorado, Misiones (Argentina)",
        negotiation_history: history,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      console.log("[EXPORT-REASSIGN] Successfully assigned lBMjE4xQ1tImzmGT1NTK to Yury Mello.");
      res.json({ success: true, message: "Lead transferido com sucesso para Yury Mello" });
    } catch (err) {
      console.error("[EXPORT-REASSIGN] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/sync-liugong-908", async (req, res) => {
    try {
      console.log("[SYNC-LIUGONG] Starting LIUGONG 908 syncing...");
      const colRef = db.collection("accessories");
      const snap = await colRef.where("brand", "==", "LIUGONG").where("model", "==", "908").get();
      const accessoryData = {
        brand: "LIUGONG",
        model: "908",
        pin: "PINO \xD850",
        ponteira_biela_4: "1000.0000.0144",
        ponteira_biela_6: "1000.0000.0070",
        suporte_triturador: "1000.1399.0100",
        photo_urls: {
          ponteira: "/uploads/ponteira_1000_0000_0144.svg",
          suporte: "/uploads/suporte_1000_1399_0100.svg"
        },
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!snap.empty) {
        console.log(`[SYNC-LIUGONG] Found ${snap.size} existing LIUGONG 908 docs, deleting them first to ensure clean sync...`);
        for (const doc of snap.docs) {
          await doc.ref.delete();
        }
      }
      const docRef = await colRef.add(accessoryData);
      console.log(`[SYNC-LIUGONG] Successfully synced LIUGONG 908 with doc ID: ${docRef.id}`);
      res.json({ success: true, docId: docRef.id, data: accessoryData });
    } catch (err) {
      console.error("[SYNC-LIUGONG] Error syncing LIUGONG 908:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/clean-accessories-duplicates", async (req, res) => {
    try {
      const colRef = db.collection("accessories");
      const snap = await colRef.get();
      console.log(`[CLEAN-ACC] Total documents in accessories collection: ${snap.size}`);
      const grouped = /* @__PURE__ */ new Map();
      snap.docs.forEach((doc) => {
        const data = doc.data();
        const brandClean = (data.brand || "").trim().toUpperCase();
        const modelClean = (data.model || "").trim().toUpperCase();
        const key = `${brandClean}__${modelClean}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key).push({ id: doc.id, ...data });
      });
      let removedCount = 0;
      const duplicatesDetail = [];
      for (const [key, items] of grouped.entries()) {
        if (items.length > 1) {
          items.sort((a, b) => {
            const aHasPhoto = a.photo_urls && Object.values(a.photo_urls).some(Boolean) ? 1 : 0;
            const bHasPhoto = b.photo_urls && Object.values(b.photo_urls).some(Boolean) ? 1 : 0;
            if (bHasPhoto !== aHasPhoto) return bHasPhoto - aHasPhoto;
            const aKeys = Object.keys(a).filter((k) => a[k]).length;
            const bKeys = Object.keys(b).filter((k) => b[k]).length;
            if (bKeys !== aKeys) return bKeys - aKeys;
            return (b.created_at || "").localeCompare(a.created_at || "");
          });
          const keep = items[0];
          const toDelete = items.slice(1);
          duplicatesDetail.push({
            key,
            keptId: keep.id,
            deletedCount: toDelete.length,
            deletedIds: toDelete.map((d) => d.id)
          });
          for (const item of toDelete) {
            await colRef.doc(item.id).delete();
            removedCount++;
          }
        }
      }
      return res.json({
        success: true,
        totalDocsBefore: snap.size,
        totalDocsAfter: snap.size - removedCount,
        removedCount,
        duplicatesDetail
      });
    } catch (err) {
      console.error("[CLEAN-ACC] Error cleaning accessories duplicates:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/list-accessories", async (req, res) => {
    try {
      const colRef = db.collection("accessories");
      const snap = await colRef.get();
      const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.json({ total: docs.length, docs });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/dump-history", async (req, res) => {
    try {
      console.log("[AdminFix] Starting manual database restoration from server side...");
      const colRef = db.collection("products");
      const snap = await colRef.get();
      let restoredCount = 0;
      for (const doc of snap.docs) {
        const data = doc.data();
        const docId = doc.id;
        const nameLower = (data.name || "").toLowerCase();
        if (nameLower === "carregador frontal") {
          console.log(`[AdminFix] Found Carregador Frontal product doc id: ${docId}, updating models...`);
          const originalModels = data.models || [];
          const updatedModels = originalModels.map((m) => {
            if (m.id === "cfr-280") {
              return {
                ...m,
                images: ["db-file://uHCqKU8ggrCpIiqPZFKs", "db-file://r6hzijMO4b6qvyg7OqmQ"]
              };
            }
            if (m.id === "cfr-400") {
              return {
                ...m,
                images: ["db-file://lznr9kOHOqNo553Pgw5i", "db-file://fIaZVONv3pblJICufdwx"]
              };
            }
            if (m.id === "crf-600") {
              return {
                ...m,
                images: ["db-file://tGk9zNiABdCrjA1w9gvc"]
              };
            }
            if (m.id === "cfr-800") {
              return {
                ...m,
                images: ["db-file://IhqHVgVwQ7jsX62eo7o2"]
              };
            }
            if (m.id === "crf-1000") {
              return {
                ...m,
                images: ["db-file://wqAqO7ytRj1j99hp7MBT"]
              };
            }
            if (m.id === "crf-1200") {
              return {
                ...m,
                images: ["db-file://pp43FwKiUdz9nMu2onUu"]
              };
            }
            if (m.id === "cfr-1500") {
              return {
                ...m,
                images: ["db-file://Amd8PnY8DuJsxBK9M8kz"]
              };
            }
            return m;
          });
          await colRef.doc(docId).update({ models: updatedModels });
          restoredCount++;
        }
        if (nameLower === "feller de disco") {
          console.log(`[AdminFix] Found Feller de Disco product doc id: ${docId}, updating models...`);
          const originalModels = data.models || [];
          const updatedModels = originalModels.map((m) => {
            if (m.id === "cfd-40") {
              return {
                ...m,
                images: [
                  "db-file://JTro2ibSenZ3sBRy11mH",
                  "db-file://Wz6c0AtZ8wMgfvPaAibp",
                  "db-file://KBjTjba9VlBA5nWuVA4d",
                  "db-file://m0wTGuGqtU0OgKdGfh4m",
                  "db-file://63k9qMNnFSqmMIIGBZpC",
                  "db-file://nEqdePRNK0mewgsIynZK",
                  "db-file://phhcobly6XQP1Gme71LV",
                  "db-file://FkYXlpt931ZOyGUZBO0e",
                  "db-file://zN6IsNP3GK5iiCZo4JgP",
                  "db-file://hAHfkaZWIF4LOhqEI0q1",
                  "db-file://aphOXvH9wbR2SCergEHR"
                ]
              };
            }
            return m;
          });
          await colRef.doc(docId).update({ models: updatedModels });
          restoredCount++;
        }
        if (nameLower === "garra florestal") {
          console.log(`[AdminFix] Found Garra Florestal product doc id: ${docId}, clearing images...`);
          const originalModels = data.models || [];
          const updatedModels = originalModels.map((m) => {
            return {
              ...m,
              images: []
            };
          });
          await colRef.doc(docId).update({ models: updatedModels });
          restoredCount++;
        }
        if (nameLower.includes("desbastador florestal fae")) {
          console.log(`[AdminFix] Found Desbastador Florestal product doc id: ${docId}, updating models...`);
          const originalModels = data.models || [];
          const updatedModels = originalModels.map((m) => {
            if (m.id === "fae-bl0-ex") return { ...m, images: ["db-file://tpaBKAFko6LXkBTbjYBr", "db-file://YyvWLpsskmBHVznLiSSC", "db-file://eavAWBFBYBssN8fmaCCd"] };
            if (m.id === "fae-pml-ex") return { ...m, images: ["db-file://o250muUq0PnA7fQR5nCR", "db-file://QsxxAqUDFJRo40oMtXpt", "db-file://uigCh3oqg876krXWU0qa"] };
            if (m.id === "fae-bl1-ex-vt") return { ...m, images: ["db-file://KxCghJ5QsKPTfZaoAR7R", "db-file://4y38tfNrliO7S3VXj9nT", "db-file://sS0Iavw9T0X4n0GDW4az", "db-file://65MBZrx9KoO7oJ947rgS"] };
            if (m.id === "fae-dml-hy") return { ...m, images: ["db-file://8h8pALZN9iG5fd4Q9Snb", "db-file://mhymO2tQOxcvGSqUS4h4", "db-file://ohgeHtitPErHqIgDMHI7"] };
            if (m.id === "fae-bl2-ex-vt") return { ...m, images: ["db-file://US9zYchyK8uPhI2ymmd0", "db-file://hM1qTk09k1O977KpPSSV"] };
            if (m.id === "fae-bl3-ex-vt") return { ...m, images: ["db-file://8tiM6rH16NMur1q4xqOv", "db-file://jw4WyK6lEiyBgjIYErPd", "db-file://2Cj5FikMsYfxGC7kObpG"] };
            if (m.id === "fae-uml-ex-vt") return { ...m, images: ["db-file://xH5C0o7qHCXgbPllI8hv", "db-file://qtpHqn2BHOj2zaCRycbm", "db-file://dxqB2PrQ4wcl6eUie2Zp", "db-file://GuwOnI3DutvvG4fZn1h5", "db-file://L8gy9gjs9CSUcIf2M6mA", "db-file://Dwtp2CuoZNYB5bBIUzG4"] };
            if (m.id === "fae-uml-s-ex-vt") return { ...m, images: ["db-file://YMeLIo2amVNuUgto0c3G", "db-file://rorAafjsU30y9P9W2g9o", "db-file://EueQzUxvKuDIiEwQmdpK"] };
            if (m.id === "fae-umm-ex-vt") return { ...m, images: ["db-file://SLdlo717yZP2smStzcnJ", "db-file://En5ZqIOVmzb1uoBm9JCn", "db-file://tvABksEedUjzZdNWqzcr"] };
            return m;
          });
          await colRef.doc(docId).update({ models: updatedModels });
          restoredCount++;
        }
      }
      res.json({ success: true, message: `Manual Restoration Complete! Restored ${restoredCount} products.` });
    } catch (err) {
      console.error("[AdminFix] Error running fix:", err);
      res.status(500).json({ error: err.message });
    }
  });
  let gcsDisabled = false;
  app.get("/api/diagnostico/armazenamento", async (_req, res) => {
    const resultado = [];
    for (const nome of [config.storageBucket, `${config.projectId}.appspot.com`].filter(Boolean)) {
      try {
        const [existe] = await Promise.race([
          (0, import_storage.getStorage)(adminApp).bucket(nome).exists(),
          new Promise((_, rej) => setTimeout(() => rej(new Error("sem resposta em 8 s")), 8e3))
        ]);
        resultado.push({ bucket: nome, existe });
      } catch (e) {
        resultado.push({ bucket: nome, erro: String(e?.message || e).slice(0, 160) });
      }
    }
    res.setHeader("Cache-Control", "no-store");
    res.json({ resultado });
  });
  app.post("/api/upload-image", async (req, res) => {
    try {
      const { fileBase64, fileName, contentType, folder = "installation_kits", docName } = req.body;
      if (!fileBase64 || !fileName) {
        return res.status(400).json({ error: "Faltando base64 ou nome de arquivo." });
      }
      let cleanBase64 = fileBase64;
      if (fileBase64.includes(";base64,")) {
        cleanBase64 = fileBase64.split(";base64,")[1];
      }
      const buffer = Buffer.from(cleanBase64, "base64");
      const cleanedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filenameWithTimestamp = `${Date.now()}__${cleanedFileName}`;
      const saveToFirestoreSettings = async (url) => {
        if (docName) {
          try {
            await db.collection("settings").doc(docName).set({
              image_url: url,
              image_data: fileBase64 || url,
              // Store full base64 data URL if available
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            });
            console.log(`[STORAGE-UPLOAD] Documento de settings '${docName}' salvo via Admin SDK no servidor com sucesso! URL: ${url}`);
          } catch (dbErr) {
            console.error(`[STORAGE-UPLOAD] Falha ao salvar no Firestore via Admin SDK no servidor:`, dbErr.message);
          }
        }
      };
      try {
        if (gcsDisabled) {
          throw new Error("GCS previously timed out or failed. Bypassing directly to local fallback.");
        }
        const bucketName = config.storageBucket || `${config.projectId}.appspot.com`;
        console.log(`[STORAGE-UPLOAD] Tentando enviar para o primeiro bucket GCS: ${bucketName}...`);
        const storageInstance = (0, import_storage.getStorage)(adminApp);
        let bucket = storageInstance.bucket(bucketName);
        let file = bucket.file(`${folder}/${filenameWithTimestamp}`);
        const uploadToGcs = async () => {
          try {
            await file.save(buffer, {
              contentType: contentType || "image/jpeg",
              metadata: { cacheControl: "public, max-age=31536000" }
            });
          } catch (saveErr) {
            const appspotBucket = `${config.projectId}.appspot.com`;
            if (bucketName !== appspotBucket) {
              console.warn(`[STORAGE-UPLOAD] Falha no primeiro bucket. Tentando fallback para ${appspotBucket}...`, saveErr.message);
              bucket = storageInstance.bucket(appspotBucket);
              file = bucket.file(`${folder}/${filenameWithTimestamp}`);
              await file.save(buffer, {
                contentType: contentType || "image/jpeg",
                metadata: { cacheControl: "public, max-age=31536000" }
              });
            } else {
              throw saveErr;
            }
          }
          try {
            await file.makePublic();
          } catch (pubErr) {
            console.warn("[STORAGE-UPLOAD] makePublic falhou (Uniform Bucket Access?).", pubErr.message);
          }
        };
        await Promise.race([
          uploadToGcs(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("GCS Upload Timeout")), 1500))
        ]);
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
        console.log(`[STORAGE-UPLOAD] Upload GCS bem-sucedido! URL: ${downloadUrl}`);
        saveToFirestoreSettings(downloadUrl).catch((dbErr) => {
          console.error("[STORAGE-UPLOAD] Background settings save error:", dbErr);
        });
        return res.json({
          success: true,
          url: downloadUrl
        });
      } catch (gcsErr) {
        console.warn("[STORAGE-UPLOAD] GCS upload falhou ou atingiu timeout. Usando fallback de armazenamento local no servidor...", gcsErr.message);
        gcsDisabled = true;
        const localFilePath = import_path.default.join(uploadsDir, filenameWithTimestamp);
        await import_fs.default.promises.writeFile(localFilePath, buffer);
        const localDownloadUrl = `/uploads/${filenameWithTimestamp}`;
        console.log(`[STORAGE-UPLOAD] Fallback local completo! Carregado em: ${localDownloadUrl}`);
        saveToFirestoreSettings(localDownloadUrl).catch((dbErr) => {
          console.error("[STORAGE-UPLOAD] Background settings save error:", dbErr);
        });
        return res.json({
          success: true,
          url: localDownloadUrl,
          isLocalFallback: true
        });
      }
    } catch (err) {
      console.error("[STORAGE-UPLOAD] Erro fatal no upload geral:", err);
      return res.status(500).json({ error: "Erro interno no upload via backend.", details: err.message });
    }
  });
  app.get("/api/settings/:docName", async (req, res) => {
    try {
      const { docName } = req.params;
      if (!docName) {
        return res.status(400).json({ error: "Nome do documento n\xE3o fornecido." });
      }
      const docRef = db.collection("settings").doc(docName);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.json({ success: true, exists: false, data: null });
      }
      return res.json({ success: true, exists: true, data: docSnap.data() });
    } catch (err) {
      console.error(`[API-SETTINGS] Erro ao obter settings/${req.params.docName}:`, err.message);
      return res.status(500).json({ error: "Erro interno ao obter configura\xE7\xF5es.", details: err.message });
    }
  });
  app.post("/api/settings/:docName", async (req, res) => {
    try {
      const { docName } = req.params;
      const data = req.body;
      if (!docName) {
        return res.status(400).json({ error: "Nome do documento n\xE3o fornecido." });
      }
      const docRef = db.collection("settings").doc(docName);
      await docRef.set({
        ...data,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }, { merge: true });
      console.log(`[API-SETTINGS] Documento '${docName}' salvo via POST API com sucesso!`);
      return res.json({ success: true, message: `Configura\xE7\xF5es de '${docName}' salvas com sucesso!` });
    } catch (err) {
      console.error(`[API-SETTINGS] Erro ao salvar settings/${req.params.docName}:`, err.message);
      return res.status(500).json({ error: "Erro interno ao salvar configura\xE7\xF5es.", details: err.message });
    }
  });
  app.get("/api/proxy-image", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    try {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        return res.status(400).send("Faltando URL do arquivo.");
      }
      console.log(`[PROXY-IMAGE] Solicitada proxy de imagem para: ${url}`);
      if (url.startsWith("https://firebasestorage.googleapis.com")) {
        const match = url.match(/\/b\/([^\/]+)\/o\/([^?#]+)/);
        if (match) {
          const bucketName = decodeURIComponent(match[1]);
          const filePath = decodeURIComponent(match[2]);
          console.log(`[PROXY-IMAGE] Baixando do GCS: bucket=${bucketName}, path=${filePath}`);
          const storageInstance = (0, import_storage.getStorage)(adminApp);
          const bucket = storageInstance.bucket(bucketName);
          const file = bucket.file(filePath);
          const [exists] = await file.exists();
          if (!exists) {
            console.warn(`[PROXY-IMAGE] Arquivo no caminho ${filePath} n\xE3o existe no GCS!`);
            return res.status(404).send("Arquivo n\xE3o encontrado no GCS.");
          }
          const [metadata] = await file.getMetadata();
          res.setHeader("Content-Type", metadata.contentType || "image/jpeg");
          res.setHeader("Cache-Control", "public, max-age=31536000");
          file.createReadStream().on("error", (streamErr) => {
            console.error("[PROXY-IMAGE] Erro durante o stream da imagem:", streamErr);
            if (!res.headersSent) {
              res.status(500).send("Erro ao obter stream da imagem.");
            }
          }).pipe(res);
          return;
        }
      }
      if (url.startsWith("http://localhost") || url.includes("/uploads/")) {
        const parts = url.split("/uploads/");
        if (parts.length > 1) {
          const localFile = import_path.default.join(uploadsDir, parts[1]);
          if (import_fs.default.existsSync(localFile)) {
            res.setHeader("Cache-Control", "public, max-age=31536000");
            return res.sendFile(localFile);
          }
        }
      }
      try {
        let refererUrl = "";
        try {
          refererUrl = new URL(url).origin + "/";
        } catch (_) {
        }
        const previousRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        const headers = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        };
        if (refererUrl) {
          headers["Referer"] = refererUrl;
          headers["Origin"] = refererUrl.replace(/\/$/, "");
        }
        const response = await fetch(url, { headers });
        if (previousRejectUnauthorized !== void 0) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousRejectUnauthorized;
        } else {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        }
        if (response.ok) {
          const contentType = response.headers.get("content-type") || "image/jpeg";
          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "public, max-age=31536000");
          const arrayBuffer = await response.arrayBuffer();
          return res.send(Buffer.from(arrayBuffer));
        } else {
          console.warn(`[PROXY-IMAGE] Falha ao buscar imagem externa via fetch (${response.status}). Fazendo redirect.`);
          return res.redirect(url);
        }
      } catch (fetchErr) {
        console.error(`[PROXY-IMAGE] Erro ao buscar imagem externa via fetch: ${fetchErr.message}. Fazendo redirect.`);
        return res.redirect(url);
      }
    } catch (error) {
      console.error("[PROXY-IMAGE] Erro fatal ao servir proxy da imagem:", error);
      return res.status(500).send(`Erro interno ao processar proxy de imagem: ${error.message}`);
    }
  });
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html, replyTo, fromName, settings: bodySettings, attachments } = req.body;
    console.log(`[EMAIL-API] Recebida solicita\xE7\xE3o de envio para: ${to} | Assunto: ${subject}`);
    try {
      let settings = bodySettings;
      if (!settings) {
        try {
          const settingsSnap = await db.collection("settings").doc("email").get();
          if (settingsSnap.exists) {
            settings = settingsSnap.data();
          }
        } catch (dbErr) {
          console.warn("Could not read email settings from DB, and no settings provided in request body.");
        }
      }
      if (!settings && process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log("[EMAIL-API] No body or DB email settings found, using local server SMTP environment variables fallback.");
        settings = {
          provider: process.env.SMTP_PROVIDER || "gmail",
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
          senderEmail: process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER
        };
      }
      if (!settings) {
        return res.status(400).json({
          error: "Configura\xE7\xF5es de e-mail n\xE3o encontradas no sistema.",
          details: "O servidor n\xE3o conseguiu ler o banco de dados e nenhuma configura\xE7\xE3o de SMTP local (env) foi definida."
        });
      }
      const formattedAttachments = attachments && Array.isArray(attachments) ? attachments.map((att) => {
        let cleanBase64 = att.content;
        if (att.content && att.content.includes(";base64,")) {
          cleanBase64 = att.content.split(";base64,")[1];
        }
        return {
          filename: att.filename,
          content: Buffer.from(cleanBase64, "base64"),
          contentType: att.contentType || "application/pdf"
        };
      }) : [];
      if (settings.provider === "resend") {
        if (!settings.apiKey) return res.status(400).json({ error: "API Key do Resend n\xE3o configurada." });
        const resend = new import_resend.Resend(settings.apiKey);
        const fromEmail = settings.senderEmail || "vendas@roderbrasil.com.br";
        const toArray = typeof to === "string" ? to.split(",").map((e) => e.trim()).filter((e) => e !== "") : Array.isArray(to) ? to : [to];
        const { data, error } = await resend.emails.send({
          from: fromName ? `${fromName} <${fromEmail}>` : `RODER Indica <${fromEmail}>`,
          to: toArray,
          subject,
          html,
          replyTo: replyTo || fromEmail,
          attachments: formattedAttachments.map((att) => ({
            filename: att.filename,
            content: att.content
          }))
        });
        if (error) {
          console.error("Resend error:", error);
          return res.status(400).json({ error: error.message });
        }
        return res.json({ success: true, data });
      } else if (settings.provider === "gmail") {
        if (!settings.user || !settings.pass) {
          return res.status(400).json({ error: "Credenciais do Gmail (usu\xE1rio ou senha de app) n\xE3o configuradas." });
        }
        const transporter = import_nodemailer.default.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          // use TLS
          auth: {
            user: settings.user,
            // ex: roderindica@gmail.com
            pass: settings.pass.replace(/\s/g, "")
            // remove spaces just in case
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        const footer = `
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>Este \xE9 um e-mail autom\xE1tico da <strong>Roder M\xE1quinas e Equipamentos</strong>.</p>
            <p>Para responder este atendimento, por favor, responda diretamente a este e-mail.</p>
          </div>
        `;
        const mailOptions = {
          from: fromName ? `"${fromName}" <${settings.user}>` : `"RODER Indica" <${settings.user}>`,
          to,
          subject,
          html: `${html}${footer}`,
          replyTo: replyTo || settings.user,
          attachments: formattedAttachments
        };
        const result = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL-API] E-mail enviado com sucesso via Gmail para ${to}. ID: ${result.messageId}`);
        return res.json({ success: true, data: result });
      } else {
        return res.status(400).json({ error: "Provedor de e-mail n\xE3o suportado ou n\xE3o configurado." });
      }
    } catch (err) {
      console.error("Server email error:", err);
      res.status(500).json({
        error: "Erro ao enviar e-mail.",
        details: err.message,
        code: err.code
      });
    }
  });
  app.get("/api/proxy-drive", async (req, res) => {
    const { fileId } = req.query;
    if (!fileId) {
      return res.status(400).send("Missing fileId");
    }
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Drive responded with ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).send("Failed to fetch from Drive");
    }
  });
  app.get("/api/proxy-thumbnail", async (req, res) => {
    const { fileId } = req.query;
    if (!fileId) {
      return res.status(400).send("Missing fileId");
    }
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
    try {
      const response = await fetch(thumbnailUrl);
      if (!response.ok) {
        throw new Error(`Drive responded with ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error("Thumbnail proxy error:", error);
      res.status(500).send("Failed to fetch thumbnail from Drive");
    }
  });
  app.post("/api/gemini/execute", async (req, res) => {
    const sanitizeRotatorText = (text) => {
      if (!text) return "";
      return text.replace(/rotadores/gi, (match) => match[0] === "R" ? "Rotatores" : "rotatores").replace(/rotador/gi, (match) => match[0] === "R" ? "Rotator" : "rotator").replace(/\b(rodder|hoder|hodder|roderr|róder|róderr)\b/gi, "Roder").replace(/\b(fai|fay|faé|faê|fae)\b/gi, "FAE");
    };
    try {
      const { action, args } = req.body;
      if (!action) {
        return res.status(400).json({ error: "No action specified" });
      }
      const ai = getGenAI();
      if (!ai) {
        return res.status(500).json({ error: "O cliente da API Gemini n\xE3o foi inicializado no servidor. Por favor, adicione a sua chave 'GEMINI_API_KEY' na aba Settings > Secrets (ou Configura\xE7\xF5es > Segredos) do seu painel do AI Studio para que as chamadas funcionem." });
      }
      let result;
      switch (action) {
        case "transcribeAudio": {
          const { audioBase64, mimeType, mode } = args;
          let prompt = `Voc\xEA \xE9 um assistente da Roder Brasil, focado em ajudar vendedores a estruturar informa\xE7\xF5es.
            Sua tarefa \xE9 transcrever e REGISTRAR DE FORMA ESTRUTURADA o \xE1udio deste vendedor.

            O \xE1udio cont\xE9m detalhes sobre uma inten\xE7\xE3o de compra de garras florestais, trituradores ou acess\xF3rios.

            ESTRUTURA DESEJADA:
            - PERFIL DO CLIENTE/OPERA\xC7\xC3O: (Descreva o que o cliente faz e onde est\xE1)
            - NECESSIDADE T\xC9CNICA: (O que ele precisa resolver ou qual equipamento busca)
            - M\xC1QUINA BASE: (Detalhes da escavadeira ou trator que ele j\xE1 possui)
            - OBSERVA\xC7\xD5ES ADICIONAIS: (Prazos, urg\xEAncia, ou detalhes espec\xEDficos da negocia\xE7\xE3o)

            REGRAS:
            1. Organize as informa\xE7\xF5es nos t\xF3picos acima.
            2. Caso o \xE1udio seja muito vago, fa\xE7a uma transcri\xE7\xE3o limpa e direta sem os t\xF3picos.
            3. Melhore a gram\xE1tica mantendo o vocabul\xE1rio t\xE9cnico (ex: garras, kit hidr\xE1ulico).
            4. Retorne APENAS o texto estruturado, pronto para ser lido por um vendedor interno.
            5. ATEN\xC7\xC3O M\xC1XIMA AO VOCABUL\xC1RIO T\xC9CNICO: O termo correto para o componente de rota\xE7\xE3o \xE9 "rotator" (no singular) ou "rotatores" (no plural). NUNCA escreva "rotador" ou "rotadores" com a letra "d". Se voc\xEA ouvir algo parecido com "rotador", transcreva obrigatoriamente como "rotator" ou "rotatores".`;
          if (mode === "chat") {
            prompt = `Voc\xEA \xE9 um transcritor de \xE1udio altamente preciso e profissional especializado no ecossistema Roder Brasil.
              Sua \xFAnica tarefa \xE9 transcrever verbatim (palavra por palavra) o \xE1udio enviado pelo usu\xE1rio, que \xE9 um parceiro indicador, vendedor ou cliente.
              Retorne APENAS a transcri\xE7\xE3o direta e limpa do \xE1udio, sem adicionar coment\xE1rios, explica\xE7\xF5es, sauda\xE7\xF5es ou formata\xE7\xE3o de t\xF3picos desnecess\xE1ria.
              
              ATEN\xC7\xC3O M\xC1XIMA AO VOCABUL\xC1RIO T\xC9CNICO: O termo correto para o componente de rota\xE7\xE3o \xE9 "rotator" (no singular) ou "rotatores" (no plural). NUNCA escreva "rotador" ou "rotadores" com a letra "d". Se voc\xEA ouvir algo parecido com "rotador", transcreva obrigatoriamente como "rotator" ou "rotatores".`;
          }
          const safeMimeType = (mimeType || "audio/webm").split(";")[0] || "audio/webm";
          const response = await generateContentWithRetry(ai, {
            contents: [
              { text: prompt },
              { inlineData: { data: audioBase64, mimeType: safeMimeType } }
            ]
          });
          const originalText = response.text || "N\xE3o foi poss\xEDvel transcrever o \xE1udio.";
          result = sanitizeRotatorText(originalText);
          break;
        }
        case "structureDossierAudio": {
          const { audioBase64, mimeType, currentDossierText, currentCompatibilityNotes, currentChoiceReason, currentProductivityInfo, productName, modelName } = args;
          const prompt = `Voc\xEA \xE9 um engenheiro de intelig\xEAncia artificial especializado na Roder Brasil.
            Sua miss\xE3o \xE9 ouvir o \xE1udio enviado pelo consultor t\xE9cnico referente ao equipamento "${productName}" - Modelo "${modelName}".
            
            Sua tarefa consiste em:
            1. Transcrever detalhadamente e com extrema precis\xE3o t\xE9cnica o \xE1udio gravado em portugu\xEAs brasileiro.
            2. Analisar o conte\xFAdo da fala e classificar/distribuir os trechos para as 4 categorias do Dossi\xEA T\xE9cnico:
               - Relat\xF3rio do Dossi\xEA Geral (dossier_text)
               - Compatibilidade com m\xE1quina base e acoplamento (compatibility_notes)
               - Motivo da Escolha e diferenciais (choice_reason)
               - Dados de Produtividade e rendimento (productivity_info)
            3. ENRIQUECER os textos atuais que est\xE3o abaixo. Ao enriquecer, NUNCA apague ou remova especifica\xE7\xF5es t\xE9cnicas, compatibilidades ou medidas que j\xE1 est\xE3o presentes nos textos originais! Preserve integralmente a riqueza dos dados t\xE9cnicos originais, integrando e anexando o novo conhecimento do \xE1udio de forma coerente e profissional no final do par\xE1grafo correspondente ou em um novo par\xE1grafo.
            4. Se o \xE1udio n\xE3o mencionar novos detalhes sobre uma categoria espec\xEDfica, mantenha o texto original correspondente intacto.

            --- TEXTOS ORIGINAIS ATUAIS DO EQUIPAMENTO ---
            - Relat\xF3rio Atual (dossier_text): "${currentDossierText || ""}"
            - Compatibilidade Atual (compatibility_notes): "${currentCompatibilityNotes || ""}"
            - Motivo da Escolha Atual (choice_reason): "${currentChoiceReason || ""}"
            - Produtividade Atual (productivity_info): "${currentProductivityInfo || ""}"
            -------------------------------------------------

            Retorne a resposta estruturada estritamente no formato JSON definido no schema.`;
          const safeMimeType = (mimeType || "audio/webm").split(";")[0] || "audio/webm";
          const response = await generateContentWithRetry(ai, {
            defaultModel: "gemini-3.5-flash",
            contents: [
              { text: prompt },
              { inlineData: { data: audioBase64, mimeType: safeMimeType } }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  transcription: {
                    type: import_genai.Type.STRING,
                    description: "Transcri\xE7\xE3o fiel e completa do \xE1udio t\xE9cnico gravado."
                  },
                  dossier_text: {
                    type: import_genai.Type.STRING,
                    description: "Relat\xF3rio t\xE9cnico geral enriquecido ou o texto original mantido intacto se sem altera\xE7\xF5es."
                  },
                  compatibility_notes: {
                    type: import_genai.Type.STRING,
                    description: "Especifica\xE7\xF5es de compatibilidade enriquecidas ou o texto original mantido intacto."
                  },
                  choice_reason: {
                    type: import_genai.Type.STRING,
                    description: "Motivos da escolha e diferenciais enriquecidos ou o texto original mantido intacto."
                  },
                  productivity_info: {
                    type: import_genai.Type.STRING,
                    description: "M\xE9tricas de produtividade enriquecidas ou o texto original mantido intacto."
                  }
                },
                required: ["transcription", "dossier_text", "compatibility_notes", "choice_reason", "productivity_info"]
              }
            }
          });
          const rawText = response.text || "{}";
          try {
            const parsed = JSON.parse(rawText);
            if (parsed) {
              if (parsed.transcription) parsed.transcription = sanitizeRotatorText(parsed.transcription);
              if (parsed.dossier_text) parsed.dossier_text = sanitizeRotatorText(parsed.dossier_text);
              if (parsed.compatibility_notes) parsed.compatibility_notes = sanitizeRotatorText(parsed.compatibility_notes);
              if (parsed.choice_reason) parsed.choice_reason = sanitizeRotatorText(parsed.choice_reason);
              if (parsed.productivity_info) parsed.productivity_info = sanitizeRotatorText(parsed.productivity_info);
            }
            result = parsed;
          } catch (e) {
            console.error("Failed to parse dossier structuring JSON response", rawText);
            throw new Error("Resposta da IA retornou um JSON inv\xE1lido para a estrutura\xE7\xE3o do dossi\xEA.");
          }
          break;
        }
        case "analyzeAndEnrichProductDossier": {
          const { question, improvedAnswer } = args;
          let productsList = [];
          try {
            const colRef = db.collection("products");
            const snap = await colRef.get();
            snap.forEach((doc) => {
              const data = doc.data();
              const models = (data.models || []).map((m) => ({
                id: m.id,
                name: m.name
              }));
              productsList.push({
                id: doc.id,
                name: data.name,
                category: data.category,
                models
              });
            });
          } catch (err) {
            console.error("Error loading products for enrichment matching:", err);
          }
          const matchPrompt = `Voc\xEA \xE9 um Engenheiro de IA especializado na Roder Brasil.
            Sua tarefa \xE9 analisar o novo conhecimento fornecido (pergunta e explica\xE7\xE3o t\xE9cnica) e identificar se ele se refere ou aplica-se de forma espec\xEDfica a um produto e modelo do nosso cat\xE1logo.
            
            Se a informa\xE7\xE3o for geral ou abstrata (n\xE3o aplic\xE1vel a nenhum produto espec\xEDfico), retorne matched: false.
            Se a informa\xE7\xE3o referir-se a uma m\xE1quina portadora gen\xE9rica sem focar no nosso equipamento, retorne matched: false.
            Se a informa\xE7\xE3o descrever caracter\xEDsticas, compatibilidade, produtividade ou motivos de escolha de um modelo ou equipamento Roder do cat\xE1logo, retorne matched: true e identifique o productId e o modelId correspondentes da lista fornecida abaixo.
            
            --- NOVO CONHECIMENTO ---
            T\xEDtulo/Pergunta: "${question}"
            Explica\xE7\xE3o T\xE9cnica: "${improvedAnswer}"
            
            --- LISTA DE PRODUTOS E MODELOS DO CAT\xC1LOGO ---
            ${JSON.stringify(productsList, null, 2)}
            
            Retorne estritamente um JSON no seguinte formato:
            {
              "matched": true ou false,
              "productId": "id_do_produto_se_matched_for_true",
              "productName": "nome_do_produto_se_matched_for_true",
              "modelId": "id_do_modelo_se_matched_for_true",
              "modelName": "nome_do_modelo_se_matched_for_true",
              "classifiedField": "compatibility_notes" | "choice_reason" | "productivity_info" | "dossier_text"
            }
            
            Descri\xE7\xE3o dos campos de dossi\xEA para classifica\xE7\xE3o:
            - "compatibility_notes": se falar sobre m\xE1quinas base compat\xEDveis, engates, pinos, acoplamento, vaz\xE3o, press\xE3o, mangueiras, suportes.
            - "choice_reason": se falar sobre motivos de escolha, vantagens de mercado, indica\xE7\xF5es ideais por opera\xE7\xE3o, recomenda\xE7\xF5es por tipo de trabalho, diferencial do produto.
            - "productivity_info": se falar sobre rendimento, velocidade, metros c\xFAbicos, toneladas por hora, dados de ciclos operacionais.
            - "dossier_text": se for descri\xE7\xE3o t\xE9cnica geral ou detalhes estruturais gerais do equipamento.
          `;
          const matchResponse = await generateContentWithRetry(ai, {
            defaultModel: "gemini-3.5-flash",
            contents: [{ text: matchPrompt }],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  matched: { type: import_genai.Type.BOOLEAN },
                  productId: { type: import_genai.Type.STRING },
                  productName: { type: import_genai.Type.STRING },
                  modelId: { type: import_genai.Type.STRING },
                  modelName: { type: import_genai.Type.STRING },
                  classifiedField: { type: import_genai.Type.STRING }
                },
                required: ["matched"]
              }
            }
          });
          const rawMatchText = matchResponse.text || "{}";
          let parsedMatch;
          try {
            parsedMatch = JSON.parse(rawMatchText);
          } catch (e) {
            console.error("Failed to parse match result JSON", rawMatchText);
            parsedMatch = { matched: false };
          }
          if (parsedMatch && parsedMatch.matched && parsedMatch.productId && parsedMatch.modelId && parsedMatch.classifiedField) {
            const { productId, productName, modelId, modelName, classifiedField } = parsedMatch;
            const dossierId = `${productId}_${modelId}`;
            const dossierRef = db.collection("equipment_dossiers").doc(dossierId);
            const docSnap = await dossierRef.get();
            let currentFieldText = "";
            let dossierData = {
              id: dossierId,
              productId,
              productName: productName || "",
              modelId,
              modelName: modelName || "",
              dossier_text: "",
              compatibility_notes: "",
              choice_reason: "",
              productivity_info: "",
              attachments: [],
              audios: [],
              created_at: (/* @__PURE__ */ new Date()).toISOString(),
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            if (docSnap.exists) {
              const data = docSnap.data();
              dossierData = { ...dossierData, ...data };
              currentFieldText = data[classifiedField] || "";
            }
            const enrichPrompt = `Voc\xEA \xE9 um Engenheiro de IA especialista da Roder Brasil.
              Sua tarefa \xE9 enriquecer um campo do Dossi\xEA T\xE9cnico do equipamento "${productName}" - Modelo "${modelName}".
              
              Voc\xEA deve enriquecer o texto atual integrando o novo conhecimento t\xE9cnico que foi ensinado pelo administrador.
              
              DIRETRIZES DE ENRIQUECIMENTO:
              1. NUNCA apague ou remova especifica\xE7\xF5es t\xE9cnicas, compatibilidades, pinos, medidas ou dados que j\xE1 existem no texto atual!
              2. Integre o novo conhecimento de forma fluida, coerente e com reda\xE7\xE3o de alto padr\xE3o t\xE9cnico em portugu\xEAs brasileiro.
              3. Se o texto atual estiver vazio, redija uma excelente explica\xE7\xE3o baseando-se estritamente na nova informa\xE7\xE3o.
              
              REGRAS DE GRAFIA E CORRE\xC7\xD5ES CR\xCDTICAS (APLIQUE SEMPRE):
              - O termo correto para o componente de rota\xE7\xE3o \xE9 "Rotator" (singular) ou "Rotatores" (plural). NUNCA escreva "rotador" ou "rotadores".
              - O sobrenome do fundador \xE9 "Roder". Corrija qualquer varia\xE7\xE3o incorreta (como "Rodder", "Hoder", "Hodder", "Roderr") para "Roder".
              - O nome do equipamento de tritura\xE7\xE3o italiano representado pela Roder \xE9 "FAE". Corrija varia\xE7\xF5es incorretas (como "Fai", "Fay", "Fa\xE9", "fa\xEA", "fae") para "FAE" (em mai\xFAsculas).
              
              --- TEXTO ATUAL DO CAMPO (${classifiedField}) ---
              "${currentFieldText}"
              
              --- NOVO CONHECIMENTO A INTEGRAR ---
              T\xEDtulo do T\xF3pico: "${question}"
              Nova Informa\xE7\xE3o: "${improvedAnswer}"
              
              Retorne APENAS o novo texto final enriquecido e unificado, sem explica\xE7\xF5es, introdu\xE7\xF5es ou notas de autor. O texto deve estar pronto para ser salvo e lido no dossi\xEA do produto.
            `;
            const enrichResponse = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: [{ text: enrichPrompt }],
              config: {
                temperature: 0.3
              }
            });
            let finalEnrichedText = enrichResponse.text || improvedAnswer;
            finalEnrichedText = sanitizeRotatorText(finalEnrichedText).trim();
            dossierData[classifiedField] = finalEnrichedText;
            dossierData.updated_at = (/* @__PURE__ */ new Date()).toISOString();
            await dossierRef.set(dossierData);
            console.log(`[Auto-Dossier-Enrich] Enriched ${classifiedField} for ${dossierId} with new teaching.`);
            result = {
              success: true,
              matched: true,
              productId,
              productName,
              modelId,
              modelName,
              classifiedField,
              enrichedText: finalEnrichedText
            };
          } else {
            console.log(`[Auto-Dossier-Enrich] No specific product matched for teaching: "${question}"`);
            result = {
              success: true,
              matched: false
            };
          }
          break;
        }
        case "engineerHelper": {
          const { question, chatHistory } = args;
          let improvedKnowledgeContext = "";
          let productsContext = "";
          const catalogImageIndex = [];
          let stockContext = "";
          let accessoriesContext = "";
          let kitsContext = "";
          try {
            const [
              improvedSnapResult,
              productsSnapResult,
              stockSnapResult,
              accessoriesSnapResult,
              kitsSnapResult
            ] = await Promise.allSettled([
              db.collection("roder_ai_questions").where("isImproved", "==", true).limit(30).get(),
              db.collection("products").get(),
              db.collection("stock_items").get(),
              db.collection("accessories").get(),
              db.collection("installation_kits").get()
            ]);
            if (improvedSnapResult.status === "fulfilled") {
              const improvedSnap = improvedSnapResult.value;
              if (!improvedSnap.empty) {
                const items = [];
                improvedSnap.forEach((doc) => {
                  const qData = doc.data();
                  items.push(`- Pergunta Similar: "${qData.question}"
  Resposta Correta/Aprimorada a ser usada: "${qData.improvedAnswer}"`);
                });
                improvedKnowledgeContext = `

11. BASE DE CONHECIMENTO ADICIONAL (CORRE\xC7\xD5ES APROVADAS PELA GER\xCANCIA/ADMINISTRA\xC7\xC3O):
Use as orienta\xE7\xF5es abaixo se a pergunta do usu\xE1rio for similar a estas d\xFAvidas mapeadas de forma priorit\xE1ria para dar a resposta correta:
${items.join("\n")}`;
              }
            } else {
              console.warn("Could not load improved questions context:", improvedSnapResult.reason);
            }
            if (productsSnapResult.status === "fulfilled") {
              const snap = productsSnapResult.value;
              const productsList = [];
              const FALLBACK_PRODUCT_IMAGES = {
                "Cabe\xE7ote Multifuncional": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-cabecote-multifuncional.jpg.webp",
                "CMF 600": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-cabecote-multifuncional.jpg.webp",
                "CMF 500": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-cabecote-multifuncional.jpg.webp",
                "CMF 800": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-cabecote-multifuncional.jpg.webp",
                "Garra Florestal": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-florestal-1.jpg.webp",
                "Gavras Florestais": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-florestal-1.jpg.webp",
                "Garra de Carregamento": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-florestal-1.jpg.webp",
                "Feller de Disco": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-feller-de-disco.jpg.webp",
                "Destocador Tipo Broca": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/destocador.jpg.webp",
                "Feller Tesoura": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Feller-Tesoura.jpg.webp",
                "Garra Tra\xE7adora": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-garra-tracadora.jpg.webp",
                "Mini Skidder": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-mini-skidder.jpg.webp",
                "Carregador frontal": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-carregador-frontal.jpg.webp",
                "Ca\xE7amba High Tip": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Cacamba-High-Tip.jpg.webp",
                "Garra Frontal": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-Frontal.jpg.webp",
                "Garra para Estufagem": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-para-Estufagem-giratoria.jpg.webp",
                "Desbastador Florestal": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-desbastador-florestal.jpg.webp"
              };
              snap.forEach((doc) => {
                const data = doc.data();
                const productImg = data.image_url || FALLBACK_PRODUCT_IMAGES[data.name] || "";
                const modelsList = (data.models || []).map((m) => {
                  const specs = m.technical_specs || {};
                  const specStr = Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(", ");
                  const modelImg = m.images && m.images.length > 0 ? m.images[0] : productImg || FALLBACK_PRODUCT_IMAGES[m.name] || "";
                  if (modelImg) catalogImageIndex.push({ label: `${data.name || ""} ${m.name || ""}`, url: modelImg });
                  return `- Modelo: ${m.name || "S/N"} (ID: ${m.id || "S/I"})${m.productivity_text ? ` | Produtividade: ${m.productivity_text}` : ""}${modelImg ? ` | Imagem: ${modelImg}` : ""} | Specs: [${specStr}]`;
                }).join("\n  ");
                if (productImg) catalogImageIndex.push({ label: String(data.name || ""), url: productImg });
                productsList.push(`Equipamento: ${data.name}
Categoria: ${data.category}
Descri\xE7\xE3o: ${data.description}${productImg ? `
Imagem Principal do Equipamento: ${productImg}` : ""}
Modelos:
  ${modelsList || "Nenhum modelo cadastrado"}`);
              });
              productsContext = productsList.join("\n\n");
            } else {
              console.error("[engineerHelper] Erro ao buscar produtos para o contexto da IA:", productsSnapResult.reason);
              productsContext = "N\xE3o foi poss\xEDvel carregar os produtos do cat\xE1logo neste momento.";
            }
            if (stockSnapResult.status === "fulfilled") {
              const stockSnap = stockSnapResult.value;
              const stockList = [];
              stockSnap.forEach((doc) => {
                const data = doc.data();
                if (data.quantity > 0) {
                  stockList.push(`- C\xF3digo: ${data.code || "S/C"} | ${data.description} | Qtd em Estoque: ${data.quantity} | Filial: ${data.branch || "Matriz"}`);
                }
              });
              stockContext = stockList.join("\n");
            } else {
              console.error("[engineerHelper] Erro ao buscar estoque:", stockSnapResult.reason);
              stockContext = "N\xE3o foi poss\xEDvel carregar os itens em estoque no momento.";
            }
            if (accessoriesSnapResult.status === "fulfilled") {
              const accSnap = accessoriesSnapResult.value;
              const accList = [];
              if (!accSnap.empty) {
                accSnap.forEach((doc) => {
                  const d = doc.data();
                  accList.push(d);
                });
              } else {
                accList.push(...ACCESSORIES_DATA);
              }
              accessoriesContext = accList.map((item) => {
                return `Marca: ${item.brand} | Modelo: ${item.model} | Pino: ${item.pin || "S/N"} | Ponteira Biela 4": ${item.ponteira_biela_4 || "N\xE3o possui"} | Ponteira Biela 6": ${item.ponteira_biela_6 || "N\xE3o possui"} | Suporte Destocador: ${item.suporte_destocador || "N\xE3o possui"} | Suporte Triturador: ${item.suporte_triturador || "N\xE3o possui"} | Link Garra Biela 6": ${item.link_garra_biela_6 || "N\xE3o possui"} | Link Garra Biela 4": ${item.link_garra_biela_4 || "N\xE3o possui"}`;
              }).join("\n");
            } else {
              console.error("[engineerHelper] Erro ao buscar acess\xF3rios:", accessoriesSnapResult.reason);
              accessoriesContext = ACCESSORIES_DATA.map((item) => {
                return `Marca: ${item.brand} | Modelo: ${item.model} | Pino: ${item.pin || "S/N"} | Ponteira Biela 4": ${item.ponteira_biela_4 || "N\xE3o possui"} | Ponteira Biela 6": ${item.ponteira_biela_6 || "N\xE3o possui"} | Suporte Destocador: ${item.suporte_destocador || "N\xE3o possui"} | Suporte Triturador: ${item.suporte_triturador || "N\xE3o possui"} | Link Garra Biela 6": ${item.link_garra_biela_6 || "N\xE3o possui"} | Link Garra Biela 4": ${item.link_garra_biela_4 || "N\xE3o possui"}`;
              }).join("\n");
            }
            if (kitsSnapResult.status === "fulfilled") {
              const kitsSnap = kitsSnapResult.value;
              const kitsList = [];
              if (!kitsSnap.empty) {
                kitsSnap.forEach((doc) => {
                  const d = doc.data();
                  kitsList.push(d);
                });
              } else {
                kitsList.push(...INSTALLATION_KITS);
              }
              kitsContext = kitsList.map((kit) => {
                const itemLines = (kit.items || []).map((it) => `  - C\xF3digo Item: ${it.code} | Descri\xE7\xE3o: ${it.description} | Qtd: ${it.quantity}`).join("\n");
                return `Kit C\xF3digo: ${kit.code} | Descri\xE7\xE3o: ${kit.description}
Itens:
${itemLines || "  (Nenhum item)"}`;
              }).join("\n\n");
            } else {
              console.error("[engineerHelper] Erro ao buscar kits de instala\xE7\xE3o:", kitsSnapResult.reason);
              kitsContext = INSTALLATION_KITS.map((kit) => {
                const itemLines = (kit.items || []).map((it) => `  - C\xF3digo Item: ${it.code} | Descri\xE7\xE3o: ${it.description} | Qtd: ${it.quantity}`).join("\n");
                return `Kit C\xF3digo: ${kit.code} | Descri\xE7\xE3o: ${kit.description}
Itens:
${itemLines || "  (Nenhum item)"}`;
              }).join("\n\n");
            }
          } catch (promiseAllErr) {
            console.error("[engineerHelper] Ocorreu um erro no Promise.all de carregamento:", promiseAllErr);
          }
          const contents = [];
          const PRIORITY_RULES = `REGRAS PRIORIT\xC1RIAS DE ATENDIMENTO (valem ACIMA de qualquer outra regra deste texto, inclusive regras que pedem respostas completas):
A. SEJA CURTO E DIRETO: no chat, responda em at\xE9 120 palavras. Primeiro a resposta (o modelo indicado), depois no m\xE1ximo 3 a 5 t\xF3picos curtos com o essencial. N\xE3o use t\xEDtulos com "#", n\xE3o repita a pergunta, n\xE3o fa\xE7a introdu\xE7\xF5es. S\xF3 escreva relat\xF3rio completo, ficha detalhada ou proposta quando o usu\xE1rio pedir explicitamente ("relat\xF3rio", "detalhe", "ficha completa", "explique mais").
B. PERGUNTE QUANDO FALTAR INFORMA\xC7\xC3O: se faltar um dado que muda a recomenda\xE7\xE3o, N\xC3O adivinhe. Fa\xE7a de 1 a 2 perguntas curtas e objetivas e espere a resposta. Exemplos de dados essenciais:
   - Cabe\xE7ote multifuncional (CMF): porte/modelo da escavadeira, aplica\xE7\xE3o (derrubada, tra\xE7amento, rebrota) e di\xE2metro das \xE1rvores (eucalipto/pinus de reflorestamento ou \xE1rvores grandes/mata nativa).
   - Garra florestal: tipo e porte da m\xE1quina base, aplica\xE7\xE3o (carregamento de toras, alimenta\xE7\xE3o de picador, p\xE1tio) e se a m\xE1quina j\xE1 tem linha hidr\xE1ulica extra.
   - Triturador/desbastador: tipo da m\xE1quina (escavadeira, trator ou p\xE1 carregadeira), porte ou pot\xEAncia, vaz\xE3o hidr\xE1ulica se souber, e di\xE2metro do material.
   - Engate r\xE1pido, ca\xE7amba High Tip, garra frontal, garfo: marca e modelo exato da p\xE1 carregadeira.
   Quando j\xE1 houver um padr\xE3o seguro (ex.: escavadeira de 13 a 22 t para eucalipto = CMF 600), indique o padr\xE3o em uma frase E fa\xE7a a pergunta de confirma\xE7\xE3o que pode mudar a indica\xE7\xE3o (ex.: "Para 16 t o indicado \xE9 o CMF 600. As \xE1rvores s\xE3o de reflorestamento (at\xE9 ~60 cm)? Se forem maiores, avaliamos o CMF 800.").
B2. OP\xC7\xD5ES PARA TOCAR: sempre que fizer uma pergunta com respostas previs\xEDveis (porte da m\xE1quina, tipo de m\xE1quina, aplica\xE7\xE3o, di\xE2metro), termine a mensagem com UMA linha exatamente neste formato, com 2 a 5 op\xE7\xF5es curtas (m\xE1ximo 4 palavras cada):
   [[OPCOES: op\xE7\xE3o 1 | op\xE7\xE3o 2 | op\xE7\xE3o 3]]
   Exemplo para garra tra\xE7adora sem o porte da escavadeira:
   "Para indicar a garra tra\xE7adora certa, preciso do porte da escavadeira do cliente. Qual \xE9?
   [[OPCOES: 8 a 14 t | 16 a 22 t | 20 a 30 t | 25 a 35 t]]"
   Quando estiver perguntando, N\xC3O liste todos os modelos, N\xC3O mostre foto e N\xC3O cite estoque: s\xF3 a pergunta curta e as op\xE7\xF5es. O usu\xE1rio toca na op\xE7\xE3o e voc\xEA responde com o modelo certo.
B3. FORMATO NO CHAT: nunca use t\xEDtulos com "#", nem linhas separadoras, nem tabelas (a n\xE3o ser que pe\xE7am compara\xE7\xE3o). Use frases curtas e, se precisar, t\xF3picos com "- ". Negrito s\xF3 no nome do modelo. It\xE1lico n\xE3o.
C. FOTO: mostre no m\xE1ximo 1 foto, somente do equipamento que voc\xEA est\xE1 recomendando, e s\xF3 quando recomendar um modelo espec\xEDfico. Use exatamente a URL do campo "Imagem" daquele mesmo modelo (ou a "Imagem Principal do Equipamento" daquele mesmo produto). No texto alternativo da imagem escreva o nome exato do equipamento/modelo. Nunca use foto de outro equipamento. Se estiver s\xF3 fazendo perguntas, n\xE3o mostre foto.
D. N\xE3o ofere\xE7a listas de outros equipamentos que o usu\xE1rio n\xE3o pediu.
E. ROTATOR DE GARRA FLORESTAL (orienta\xE7\xE3o do Jeferson): garra R600 ou maior em escavadeira acima de 20 t = sempre com Rotator IR10 (garra CA), para trabalho pesado. Garra R400 a R600 em escavadeira de 12 a 16 t = Rotator de 12 t ou 16 t (preferir 16 t). Nunca indique rotator de 16 t para garra R800/R1000 em m\xE1quina acima de 20 t.
F. INSTALA\xC7\xC3O (o que entra na venda, orienta\xE7\xE3o do Jeferson). 95% das vendas s\xE3o completas: equipamento, frete, instala\xE7\xE3o pelo t\xE9cnico Roder na cidade do cliente, regulagem e orienta\xE7\xE3o ao operador. Nunca prometa instala\xE7\xE3o onde ela n\xE3o existe:
   - ESCAVADEIRA (garras florestais e tra\xE7adoras, garra rachadora, Clamshell, cabe\xE7otes CMF, feller tesoura e de disco, destocador, sacador, trituradores FAE de escavadeira): instala\xE7\xE3o hidr\xE1ulica completa, adequa\xE7\xE3o e regulagem de press\xE3o. O vendedor pede marca, modelo e fotos do comando para confirmar se a m\xE1quina tem fatia extra e v\xE1lvula de regulagem de press\xE3o na fatia extra.
   - P\xC1 CARREGADEIRA: Engate R\xE1pido hidr\xE1ulico precisa da 3\xAA fun\xE7\xE3o (linha extra) para engatar e desengatar; vendemos junto o adaptador para a concha original do cliente. Garra Frontal / Top Clamp, Triturador FAE p/ p\xE1 e Carregador Frontal CFR precisam de 3\xAA e 4\xAA fun\xE7\xE3o (CFR: giro hor\xE1rio/anti-hor\xE1rio do rotator e abre/fecha da garra = 4 mangueiras).
   - Ca\xE7amba High Tip e Prolongador com Concha: precisam de uma linha extra bidirecional (3\xAA fun\xE7\xE3o) para o basculante. Se a p\xE1 N\xC3O tem engate r\xE1pido nem linha extra, a Roder instala engate + 3\xAA fun\xE7\xE3o (com 3\xAA e 4\xAA fun\xE7\xE3o o operador n\xE3o precisa trocar a fun\xE7\xE3o entre engate e basculante). Se a p\xE1 J\xC1 tem engate r\xE1pido original e linha extra bidirecional, n\xE3o precisa de instala\xE7\xE3o: a Roder fabrica o equipamento com o gancho traseiro na medida do engate original.
   - Garfo Paleteiro GPR 4500 / GPR 7000: s\xF3 mec\xE2nico, sem instala\xE7\xE3o (vai no lugar dos pinos). Normalmente \xE9 vendido com o engate r\xE1pido, e o garfo j\xE1 vai com o gancho do engate para o operador trocar entre concha e garfo sem descer da m\xE1quina.
   - TRATOR: Mini Skidder MSR 600 / MSR 1000, carreta de arrasto e Clambank: sem instala\xE7\xE3o, o cliente acopla e liga as mangueiras que j\xE1 v\xE3o prontas. Fresa FAE SSH e trituradores FAE de trator (TDP): a Roder entrega, acompanha a primeira instala\xE7\xE3o no trator e orienta o operador no in\xEDcio, porque \xE9 um equipamento mais t\xE9cnico.
   - GUINDASTE: Cabe\xE7ote GMT 035 vai em guindaste (Munck), grua em caminh\xE3o ou grua florestal em trator, N\xC3O em escavadeira. Cabe\xE7ote de Poda GP 150 vai SOMENTE em cesto a\xE9reo (bra\xE7o isolado em caminh\xE3o): tira o cesto de fibra e parafusa o cabe\xE7ote no lugar; o cesto a\xE9reo precisa vir preparado pelo pr\xF3prio fornecedor com 3 linhas bidirecionais (6 mangueiras), normalmente j\xE1 no controle remoto do bra\xE7o.

`;
          const systemInstruction = PRIORITY_RULES + `Voc\xEA \xE9 o "Consultor T\xE9cnico RODER" (ou simplesmente "Roder"). Voc\xEA \xE9 o consultor t\xE9cnico oficial da Roder M\xE1quinas e Equipamentos.

Voc\xEA \xE9, simbolicamente, o "filho" e pupilo do seu criador e mentor, Jeferson Roder (professor, mentor, fundador da empresa, criador de toda a tecnologia e equipamentos Roder, diretor t\xE9cnico e mentor t\xE9cnico, carinhosamente conhecido tamb\xE9m como "Jeff Roder" ou simplesmente "Jeff" por vendedores e parceiros mais pr\xF3ximos). Jeferson Roder lhe ensinou tudo o que voc\xEA sabe sobre os produtos e o desenvolvimento t\xE9cnico da Roder, e \xE9 com ele que voc\xEA continua aprendendo e evoluindo constantemente a cada dia. Mesmo quando ele n\xE3o puder responder diretamente aos vendedores em campo, voc\xEA est\xE1 aqui para responder e falar por ele com total precis\xE3o e dedica\xE7\xE3o t\xE9cnica. **ATEN\xC7\xC3O CR\xCDTICA**: Nunca se refira a Jeferson Roder como "gerente de projeto", "gerente de projetos" ou "engenheiro" (ele prefere e deve ser chamado estritamente de Mentor, Fundador, Criador, Professor, Diretor T\xE9cnico ou Mentor T\xE9cnico).

ATEN\xC7\xC3O CR\xCDTICA \xC0 ORTOGRAFIA E PRON\xDANCIA (REGRAS DE OURO):
1. O nome da empresa e o seu sobrenome \xE9 estritamente "Roder", escrito com apenas uma letra "D". Cuidado para nunca escrever "Rodder" ou duplicar o "D" na transcri\xE7\xE3o ou gera\xE7\xE3o de texto.
2. O nome do seu criador e mentor \xE9 "Jeferson" (Jeferson Roder), escrito com apenas uma letra "F". Nunca escreva "Jefferson" ou com "FF". Dependendo da conversa, principalmente com pessoas conhecidas, parceiros, vendedores ou t\xE9cnicos que j\xE1 o conhecem de longa data, voc\xEA pode cham\xE1-lo de forma mais pr\xF3xima e abreviada como "Jeff" ou "Jeff Roder".
3. Sob nenhuma hip\xF3tese o seu nome \xE9 "Rodolfo" ou qualquer varia\xE7\xE3o semelhante. Voc\xEA \xE9 o Roder.

Sua miss\xE3o \xE9 ajudar vendedores, parceiros e indicadores com d\xFAvidas t\xE9cnicas sobre garras, ca\xE7ambas, cabe\xE7otes, trituradores e a compatibilidade ideal com m\xE1quinas base (com foco total em escavadeiras e p\xE1s carregadeiras, que s\xE3o as nossas principais linhas) com base em seu peso operacional (toneladas) ou modelo. N\xE3o cite ou sugira o uso com tratores de forma ativa ou nas indica\xE7\xF5es padr\xE3o de m\xE1quinas base.

Regras de Neg\xF3cio e Diretrizes de Engenharia Roder:
0. REGRA OBRIGAT\xD3RIA DE T\xCDTULO E FORMATO GEN\xC9RICO PARA RELAT\xD3RIOS T\xC9CNICOS:
   - Sempre que gerar um relat\xF3rio t\xE9cnico ou recomenda\xE7\xE3o formal sobre qualquer equipamento, voc\xEA DEVE colocar no in\xEDcio do texto o t\xEDtulo referente ao equipamento.
   - Formato obrigat\xF3rio de t\xEDtulo: '# [Nome do Equipamento]: Especifica\xE7\xF5es T\xE9cnicas e Recomenda\xE7\xF5es'
   - Exemplo para o Sacador SAC 500: '# Sacador SAC 500: Especifica\xE7\xF5es T\xE9cnicas e Recomenda\xE7\xF5es'
   - **MUITO IMPORTANTE (SEM SAUDA\xC7\xD5ES PESSOAIS NOS RELAT\xD3RIOS)**: NUNCA inicie relat\xF3rios t\xE9cnicos ou pareceres de dimensionamento com sauda\xE7\xF5es pessoais ou informais direcionadas a 'Jeff', 'Grande Jeff', 'Jeferson', ou frases como 'Como voc\xEA sempre me ensinou'. Todos os relat\xF3rios t\xE9cnicos e estudos devem ser 100% GEN\xC9RICOS, PROFISSIONAIS e FORMAIS (sem citar nomes de destinat\xE1rios na introdu\xE7\xE3o), para que o vendedor ou usu\xE1rio possa copiar, salvar em PDF ou compartilhar diretamente no WhatsApp com qualquer cliente final! Comece o texto do relat\xF3rio diretamente com uma introdu\xE7\xE3o t\xE9cnica formal e objetiva.

1. PESQUISA E ESTIMATIVA DE MODELOS DE M\xC1QUINAS BASE:
   - Se o usu\xE1rio informar o modelo de uma escavadeira/m\xE1quina base mas n\xE3o souber o peso operacional (ex: "Komatsu PC 220", "Komatsu PC 210", "CAT 320", "Caterpillar 320D", "Hyundai 210", "Hyundai 155"), use seu conhecimento de engenharia para identificar o peso operacional aproximado (em toneladas).
     - Exemplo: Hyundai 155 possui cerca de 15 a 16 toneladas. Komatsu PC 200 / PC 210 / PC 220 ou Caterpillar 320 possuem cerca de 20 a 24 toneladas. John Deere 130G possui cerca de 13 toneladas.
     - Forne\xE7a brevemente essa especifica\xE7\xE3o ao usu\xE1rio para mostrar autoridade t\xE9cnica e prossiga indicando os modelos Roder compat\xEDveis.

2. FLUXO DE RESPOSTA DIRECIONADO E CURTO (PRIMEIRO O EQUIPAMENTO DE INTERESSE):
   - Se o vendedor iniciou a conversa mencionando um equipamento ou categoria de interesse (ex: "Cabe\xE7ote Multifuncional", "Desbastador Florestal", "Garra", "Triturador") ou se h\xE1 esse contexto nas mensagens anteriores do hist\xF3rico de chat, e depois inseriu ou perguntou sobre uma m\xE1quina base (como "Hyundai 155" ou outra escavadeira):
     - Sua resposta DEVE focar de forma priorit\xE1ria em responder especificamente sobre o equipamento em que o vendedor iniciou a conversa!
     - Exemplo de in\xEDcio: "Perfeito! Para esta escavadeira Hyundai 155 (cerca de 15.5t), n\xF3s temos o Cabe\xE7ote Multifuncional modelo [modelo], que \xE9 o ideal e compat\xEDvel..." ou "Para a Hyundai 155, o Desbastador Florestal ideal \xE9 o [modelo]...".
     - Diga claramente se temos este equipamento de interesse dispon\xEDvel em estoque hoje (consulte a lista de estoque real) ou se h\xE1 outra op\xE7\xE3o compat\xEDvel para esse mesmo tipo de equipamento.
     - N\xC3O liste ou despeje todos os outros equipamentos de outras categorias compat\xEDveis (como garras, ca\xE7ambas, trituradores, etc.) na primeira resposta para evitar respostas excessivamente longas e polu\xEDdas.
     - No final da resposta, d\xEA a op\xE7\xE3o ou pergunte educadamente se o usu\xE1rio gostaria de conhecer outros equipamentos compat\xEDveis para essa m\xE1quina base. Exemplo: "Voc\xEA gostaria de saber quais outros equipamentos compat\xEDveis (como garras ou ca\xE7ambas) temos para a Hyundai 155? Se sim, me pergunte que eu trago todas as outras linhas dispon\xEDveis!"

3. REQUISITO CR\xCDTICO DE OR\xC7AMENTO E ACESS\xD3RIOS (REGRA DE NEG\xD3CIO):
   - Sempre mencione claramente ao usu\xE1rio (mesmo se o equipamento indicado estiver dispon\xEDvel no estoque hoje) que:
     "\xC9 necess\xE1rio que o vendedor interno realize o or\xE7amento oficial completo, verificando a disponibilidade de acess\xF3rios essenciais como ponteiras, dentes, suportes de acoplamento ou kits de instala\xE7\xE3o (mangueiras, comandos, conex\xF5es)."
   - Explique que normalmente, mesmo havendo o equipamento principal em estoque, \xE9 necess\xE1rio consultar a disponibilidade t\xE9cnica dos acess\xF3rios e kits de instala\xE7\xE3o para poder realizar o agendamento correto da entrega do produto, a montagem f\xEDsica/instala\xE7\xE3o do equipamento na m\xE1quina do cliente, e a entrega t\xE9cnica especializada em campo.
   - Reforce sempre a import\xE2ncia de que a montagem f\xEDsica, instala\xE7\xE3o e entrega t\xE9cnica do equipamento Roder sejam contratadas e realizadas diretamente por t\xE9cnicos da pr\xF3pria Roder ou t\xE9cnicos credenciados/autorizados. Explique que isso assegura o perfeito funcionamento, m\xE1xima durabilidade do equipamento e garante o benef\xEDcio da cobertura de garantia de f\xE1brica, evitando falhas de funcionamento decorrentes de m\xE1 instala\xE7\xE3o por conta pr\xF3pria.

4. VERIFICA\xC7\xC3O DE ESTOQUE E DIRECIONAMENTO (MUITO IMPORTANTE):
   - O consultor deve sempre ler atentamente a lista de estoque real (fornecida abaixo), diferenciando o estoque dispon\xEDvel da f\xE1brica e do vendedor/parceiro, e ativamente orientar o usu\xE1rio sobre os modelos dispon\xEDveis para entrega imediata (pronta entrega) no momento.
   - Ao receber uma solicita\xE7\xE3o de garra (gripper) ou qualquer outro equipamento para uma m\xE1quina base de tamanho espec\xEDfico (ex: escavadeira de 16 toneladas, que comporta os modelos R400 e R600), verifique quais dessas varia\xE7\xF5es e modelos compat\xEDveis n\xF3s temos de fato em estoque hoje.
   - Mostre as op\xE7\xF5es de pronta entrega dispon\xEDveis e incentive o vendedor dizendo: "Temos o modelo [Modelo] dispon\xEDvel em estoque hoje. Voc\xEA pode escolher este modelo e ir diretamente para realizar a indica\xE7\xE3o!"
   - Caso o equipamento ou modelo espec\xEDfico n\xE3o esteja dispon\xEDvel em estoque hoje, oriente o vendedor de que ser\xE1 necess\xE1rio solicitar um or\xE7amento interno ("or\xE7amento interno do vendedor") para que possamos passar o prazo de entrega correto do pedido sob encomenda.

5. COMPATIBILIDADE GERAL POR M\xC1QUINA BASE (CR\xCDTICO - PORTF\xD3LIO E CAT\xC1LOGO OFICIAL):
   - SEMPRE verifique o modelo e o peso operacional da m\xE1quina base do cliente antes de indicar qualquer equipamento.
   - S\xD3 INDIQUE equipamentos que fa\xE7am parte do cat\xE1logo oficial de produtos da Roder (nunca crie ou sugira modelos inexistentes, como a "R200" ou outros que n\xE3o estejam no cat\xE1logo).
   - Esta regra se aplica estritamente a todo e qualquer equipamento: escavadeiras hidr\xE1ulicas, mini carregadeiras (skid steers), tratores, e mini carregadeiras de trator (mini skid steers).
   - Escavadeiras: Equipamentos como cabe\xE7otes multifuncionais, trituradores FAE (ex: FAE PML/EX, BL0/EX, BL1/EX, UML/EX, UMM/EX) e garras s\xE3o indicados estritamente pela faixa de peso (toneladas) da escavadeira.
     \u2022 Escavadeiras de 1 a 3 t: FAE PML/EX, BL0/EX
     \u2022 Escavadeiras de 4 a 7.5 t: FAE PML/EX, DML/HY, BL1/EX-VT
     \u2022 Escavadeiras de 8 a 13 t: FAE BL2/EX-VT, UML/EX-VT
     \u2022 Escavadeiras de 14 a 20 t: FAE UML/S/EX-VT, UMM/EX-VT, ou Ca\xE7ambas/Garras adequadas como R400 e R600
     \u2022 Escavadeiras de 21 a 35 t: FAE UMM/EX-VT, BL3/EX-VT
   - Garras Florestais por Escavadeira (REGRAS CR\xCDTICAS DE PORTF\xD3LIO E ESTABILIDADE):
     \u2022 NUNCA indique garras inexistentes como R200 (ela N\xC3O faz parte do cat\xE1logo Roder e n\xE3o existe!). S\xF3 indique garras do cat\xE1logo oficial Roder.
     \u2022 Para escavadeiras de cerca de 7 a 8 toneladas: Normalmente, \xE9 indicada a garra R280 para fazer o carregamento convencional.
     \u2022 Para alimenta\xE7\xE3o de picador em m\xE1quinas de 7 a 8 toneladas (ou na faixa de 7 at\xE9 13 toneladas): \xC9 poss\xEDvel indicar a garra R360 ou a garra R280, dependendo do tipo de material:
       - **Alimenta\xE7\xE3o de Picador com \xC1rvores Inteiras (Eucalipto)**: A melhor e mais recomendada indica\xE7\xE3o \xE9 a **R280**. Ela foi projetada para conseguir pegar os feixes de \xE1rvores e arrast\xE1-las usando a for\xE7a de giro da m\xE1quina base para guiar os p\xE9s das \xE1rvores at\xE9 a boca do picador. Por causa desse grande esfor\xE7o de arrastar as \xE1rvores inteiras, a **R280** \xE9 a escolha ideal.
       - **Alimenta\xE7\xE3o de Picador com Res\xEDduos e Madeiras Tran\xE7adas**: \xC9 poss\xEDvel e indicado recomendar a garra **R360**. Pode ser a **R360 Padr\xE3o** (com pin\xE7a fechada) para manuseio comum de madeira, ou a **R360G** (com unha tipo garfo, aberta), que \xE9 excelente para pegar res\xEDduos, paletes, galhadas (como galhos e restos de p\xE9 de laranja) e res\xEDduos florestais em geral para alimentar o picador.
     \u2022 Cat\xE1logo de Garras Florestais Roder Oficiais: R250 (5-8t), R280 (6-10t), R360 (8-12t), R400 (12-18t), R600 (14-22t), R800 (18-25t), R1000 (22-30t), R1200 (24-35t), R1400 (25-35t).
      \u2022 DIRETRIZ CR\xCDTICA DE DIMENSIONAMENTO PARA ESCAVADEIRAS DE 16 TONELADAS (como John Deere 160) - RECOMENDE GARRAS R400, R600 E R800:
        Se a m\xE1quina base for uma escavadeira de cerca de 16 toneladas (por exemplo, John Deere 160 LC ou similar), siga rigorosamente as seguintes indica\xE7\xF5es t\xE9cnicas estabelecidas por Jeff Roder:
        - Apresente e compare detalhadamente a Garra R400 e a Garra R600 como os modelos principais compat\xEDveis para esta m\xE1quina base, e explique que a Garra R800 tamb\xE9m \xE9 vi\xE1vel sob condi\xE7\xF5es de opera\xE7\xE3o espec\xEDficas.
        - Quando citar qualquer uma dessas garras (R400, R600, R800) em suas respostas ou relat\xF3rios, voc\xEA \xE9 OBRIGADO a exibir as especifica\xE7\xF5es t\xE9cnicas completas de cada modelo presentes no cat\xE1logo (especificando peso, abertura m\xE1xima, \xE1rea de carga, di\xE2metro m\xEDnimo de tora e press\xE3o de trabalho).
        - Voc\xEA DEVE obrigatoriamente incluir a imagem correspondente da garra florestal Roder no texto e no relat\xF3rio usando a sintaxe Markdown:
          
          ![Garra Florestal Roder](https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-florestal-1.jpg.webp)
          
          (Insira a imagem em sua pr\xF3pria linha, com uma quebra de linha antes e depois, para renderizar perfeitamente no chat e no relat\xF3rio).
        - **Indica\xE7\xE3o da Garra R800**: Explique que para este porte de m\xE1quina (16 toneladas), tamb\xE9m \xE9 poss\xEDvel colocar a Garra R800. Destaque que alguns clientes utilizam a Garra R800 especificamente para realizar o carregamento de madeira curta de no m\xE1ximo 3 metros de comprimento.
        - **Indica\xE7\xE3o da Garra R600**: Destaque que para madeiras mais longas, como por exemplo madeira de 6 metros de comprimento, a Garra R600 \xE9 uma excelente escolha t\xE9cnica para a opera\xE7\xE3o de carregamento, pois garante melhor equil\xEDbrio da carga e \xF3tima estabilidade para a m\xE1quina base de 16t.
        - **Indica\xE7\xE3o da Garra R400**: Destaque que a Garra R400, por ser um pouco menor e mais leve, \xE9 a mais indicada para realizar o abastecimento e alimenta\xE7\xE3o de picadores de biomassa/madeira. Explique que o volume de madeira n\xE3o pode ser excessivo para a boca de alimenta\xE7\xE3o do picador, e a garra R400 por n\xE3o ser t\xE3o grande trabalha de forma mais \xE1gil e vers\xE1til, evitando bater ou colidir fisicamente com a boca/calha de alimenta\xE7\xE3o do picador durante as manobras.
    - DIRETRIZ CR\xCDTICA DE ROTATOR HIDR\xC1ULICO PARA GARRAS FLORESTAIS:
      \u2022 Quando falar ou indicar garras florestais, voc\xEA deve sempre lembrar e destacar no texto que a Roder indica e dimensiona o **Rotator hidr\xE1ulico** (o mecanismo que realiza o giro de 360\xB0 da garra) de acordo com o tamanho/peso operacional da M\xC1QUINA BASE que ser\xE1 utilizada.
      \u2022 **CAPACIDADES E ERRO COMUM**: **N\xC3O existe rotor de 15 t**.
      \u2022 **REGRA DO JEFERSON (vale acima das outras)**: garras R600 at\xE9 as maiores (R800, R1000, R1200, R1400) em escavadeiras ACIMA de 20 toneladas: orientar sempre garra com **Rotator IR10** (garra CA, cabe\xE7ote alto), para aguentar o trabalho pesado. Garras R400 at\xE9 R600 em escavadeiras de 12 a 16 toneladas: pode ser **Rotator de 12 t ou 16 t** (garra CB), dando prefer\xEAncia ao de 16 t, que tem o mesmo pre\xE7o e costuma ter estoque.
      \u2022 **Rotatores para Garras Tra\xE7adoras (Porte M\xE9dio e Grande)**: H\xE1 duas op\xE7\xF5es principais: 1) **Rotator IR10**; ou 2) **Rotor de giro livre RR550-7** (Capacidade 55t, swivel 7 passagens, giro livre ilimitado).
      \u2022 **COMPATIBILIDADE RR550-7**: O Rotator RR550-7 \xE9 indicado estritamente para as garras **GT 600X e modelos acima**.
      \u2022 ATEN\xC7\xC3O \xC0 GRAFIA: O termo correto \xE9 estritamente **Rotator** (com "t"). NUNCA use o termo "Rotador" sob nenhuma hip\xF3tese.
   - DIRETRIZ CR\xCDTICA PARA INSTALA\xC7\xC3O DE GARRA EM ESCAVADEIRAS SEM FATIA EXTRA DE COMANDO (MUITO IMPORTANTE):
      \u2022 Se o vendedor perguntar sobre a instala\xE7\xE3o de garras em escavadeiras que **N\xC3O** possuem a fatia extra de comando original (como Komatsu PC200, Komatsu PC210, Volvo 200 ou qualquer outro modelo sem fatia extra original):
        - **Solu\xE7\xE3o T\xE9cnico-Oficial**: Explique que a instala\xE7\xE3o da garra \xE9 totalmente vi\xE1vel utilizando o **Kit de Instala\xE7\xE3o de Garra para M\xE1quinas sem Fatia Extra - C\xF3digo 9000.9000.9016**.
        - **Como Funciona o Kit 9000.9000.9016**: Este kit deriva a press\xE3o hidr\xE1ulica diretamente da bomba principal da escavadeira para alimentar uma v\xE1lvula com duas solenoides. Como opera com baixo fluxo, ele \xE9 utilizado exclusivamente para fazer a rota\xE7\xE3o do rotator de forma independente, sem necessitar de uma fatia extra no comando principal.
        - **Condi\xE7\xE3o Cr\xEDtica/Defici\xEAncia que o Cliente DEVE Saber**: Como a vaz\xE3o \xE9 derivada diretamente da bomba principal, quando a escavadeira est\xE1 est\xE1tica (ou seja, quando o operador n\xE3o est\xE1 executando nenhuma outra fun\xE7\xE3o como levantar o bra\xE7o, fechar a lan\xE7a ou girar a cabine), a bomba trabalha no deslocamento m\xEDnimo. Consequentemente, se o operador acionar apenas os bot\xF5es de rota\xE7\xE3o do rotator sem realizar nenhuma outra opera\xE7\xE3o, o giro da garra ser\xE1 **extremamente lento** ("fluxo muito lento / rota\xE7\xE3o lenta").
        - **Normaliza\xE7\xE3o da Velocidade**: No entanto, quando o operador est\xE1 executando qualquer outra fun\xE7\xE3o simultaneamente (por exemplo, durante a opera\xE7\xE3o florestal em que ele move o bra\xE7o, levanta a lan\xE7a ou gira a cabine ao mesmo tempo em que rotaciona a garra), o fluxo da bomba aumenta e a rota\xE7\xE3o do rotator \xE9 **normalizada**. Essa oscila\xE7\xE3o \xE9 uma caracter\xEDstica normal do projeto para m\xE1quinas sem fatia extra original e n\xE3o um defeito.
        - **Como Evitar essa Defici\xEAncia**: Se o cliente preferir que o funcionamento seja 100% perfeito e constante sem essa oscila\xE7\xE3o de velocidade:
          1. O cliente deve adquirir e mandar instalar uma fatia/se\xE7\xE3o extra de comando original na escavadeira.
          2. Ou deve utilizar outra m\xE1quina que j\xE1 possua uma fatia extra dispon\xEDvel no comando principal para que a Roder possa instalar a linha extra padr\xE3o (puxando diretamente do comando).

    - DIRETRIZ CR\xCDTICA PARA INSTALA\xC7\xC3O DE CABE\xC7OTE MULTIFUNCIONAL EM ESCAVADEIRAS SEM FATIA EXTRA DE COMANDO:
       \u2022 Se algum vendedor ou cliente perguntar sobre a possibilidade de instalar ou operar um cabe\xE7ote multifuncional (como o CMF 500) em uma escavadeira que n\xE3o possui fatia extra de comando original de f\xE1brica:
         - **Viabilidade de Instala\xE7\xE3o**: Explique que \xE9 perfeitamente vi\xE1vel realizar a instala\xE7\xE3o hidr\xE1ulica das linhas em uma escavadeira sem fatia extra original. Essa instala\xE7\xE3o retira a press\xE3o hidr\xE1ulica diretamente da bomba principal (comportando-se de forma id\xEAntica \xE0 instala\xE7\xE3o de um bra\xE7o de carregamento / garra carregadora) e serve funcionalmente para a opera\xE7\xE3o b\xE1sica do cabe\xE7ote multifuncional.
         - **Risco de Seguran\xE7a (Altamente Perigoso)**: No entanto, para as opera\xE7\xF5es reais de colheita florestal (harvesting), a falta da fatia extra original de comando torna toda a atividade extremamente perigosa operacionalmente.
         - **Recomenda\xE7\xE3o Oficial (N\xC3O RECOMENDADO)**: Portanto, para o cabe\xE7ote multifuncional, a Roder **N\xC3O recomenda** de forma alguma realizar a instala\xE7\xE3o em m\xE1quinas sem fatia extra original. O correto e estritamente indicado \xE9 que a m\xE1quina possua a fatia extra de comando original para garantir a seguran\xE7a no corte e derrubada de \xE1rvores, al\xE9m do fluxo de pot\xEAncia adequado para a colheita florestal. \xC9 fisicamente vi\xE1vel de instalar, mas altamente contraindicado devido aos severos riscos de seguran\xE7a operacional.

    - RECOMENDA\xC7\xC3O CR\xCDTICA DE CABE\xC7OTE MULTIFUNCIONAL CMF 500 EM RETROESCAVADEIRA:
     \u2022 Se algum vendedor perguntar ou sugerir instalar ou trabalhar com o cabe\xE7ote multifuncional CMF 500 em uma retroescavadeira:
       - **Sua Recomenda\xE7\xE3o Oficial**: Explique que a Roder opta por **N\xC3O instalar** cabe\xE7ote multifuncional em retroescavadeiras.
       - **Por que n\xE3o? (Justificativa T\xE9cnica e de Seguran\xE7a)**:
         1. *Parte Hidr\xE1ulica (Compat\xEDvel)*: Hidraulicamente, o conjunto at\xE9 funciona, pois o fluxo e a press\xE3o fornecidos pela retroescavadeira s\xE3o compat\xEDveis com o CMF 500.
         2. *Parte Operacional (Invi\xE1vel)*: O conjunto fica totalmente deficiente na produ\xE7\xE3o. O alcance do bra\xE7o da retroescavadeira \xE9 extremamente limitado (curso de apenas 2,5 metros entre o limite dobrado e o m\xE1ximo esticado). Al\xE9m disso, a retroescavadeira n\xE3o possui giro de cabine (como as escavadeiras de esteira); o bra\xE7o \xE9 fixado em um pino traseiro girat\xF3rio, girando apenas o pr\xF3prio bra\xE7o. Isso torna os movimentos muito r\xFAsticos e inadequados para a \xE1rea florestal.
         3. *Seguran\xE7a (Cr\xEDtico)*: Se uma \xE1rvore for cortada e, por erro operacional ou vento contra, iniciar a queda em dire\xE7\xE3o \xE0 cabine da m\xE1quina, o operador da retroescavadeira n\xE3o tem op\xE7\xF5es \xE1geis de escape al\xE9m de apenas girar o bra\xE7o (o que \xE9 insuficiente). J\xE1 em uma escavadeira de esteira, o giro central sob a cabine permite ao operador desviar a m\xE1quina com facilidade e rapidez, direcionando a queda da \xE1rvore com seguran\xE7a.
       - **Alternativa Oficial Recomendada**: Indique ao cliente adquirir uma **escavadeira de esteira pequena (porte de 7 a 8 toneladas)**. A Roder j\xE1 tem v\xE1rios clientes trabalhando com escavadeiras desse porte e est\xE3o extremamente satisfeitos com o desempenho e, principalmente, com o baix\xEDssimo custo de combust\xEDvel por hora de trabalho. Escavadeiras de 7 a 8t s\xE3o \xE1geis, f\xE1ceis de transportar, e possuem alcance, movimentos e efici\xEAncia operacional muito superiores a qualquer retroescavadeira.
   - Carregadores Frontais: Ex CFR-280, CFR-400, CFR-600, CFR-800, CFR-1000, CFR-1200, CFR-1500 s\xE3o indicados de acordo com o tamanho e capacidade operacional da p\xE1 carregadeira.
   - Ca\xE7ambas High Tip (Despejo Alto):
     \u2022 \xC9 necess\xE1rio que o vendedor informe o tipo de material carregado (ex: adubo org\xE2nico, biomassa de cavaco leve, silagem, gr\xE3os) para dimensionar o modelo correto.
     \u2022 **MARGEM DE SEGURAN\xC7A OPERACIONAL (REGRA DOS 85%)**:
       - A capacidade operacional segura de uma p\xE1 carregadeira operando com Ca\xE7amba High Tip \xE9 de **at\xE9 85%** do limite seguro de tombamento da m\xE1quina (calculado com o desconto do avan\xE7o do mecanismo de despejo alto).
       - **Classifica\xE7\xE3o de Seguran\xE7a**:
         * **At\xE9 75%**: Totalmente Recomendada (Opera\xE7\xE3o 100% Segura e Est\xE1vel em qualquer terreno).
         * **75,1% a 85%**: **RECOMENDADA (Op\xE7\xE3o Vi\xE1vel de Alta Produtividade / Limite Operacional Seguro)**. Exemplo real: Uma p\xE1 carregadeira Volvo L90 operando com Ca\xE7amba High Tip de 8.0 m\xB3 em adubo org\xE2nico (densidade 400 kg/m\xB3) atinge 5.900 kg de peso total (ca\xE7amba 2.700 kg + material 3.200 kg) contra um limite seguro de 7.200 kg, resultando em **81,9% (~82%) de utiliza\xE7\xE3o**. Esta configura\xE7\xE3o \xE9 **TOTALMENTE RECOMENDADA E VI\xC1VEL**, pois maximiza a produtividade do cliente mantendo-se dentro do limite seguro de 85%, exigindo apenas opera\xE7\xE3o padr\xE3o em terreno plano e sem manobras com ester\xE7amento brusco.
         * **85,1% a 90%**: Uso Restrito com Alerta (Apenas para piso 100% plano e operadores experientes).
         * **Acima de 90%**: N\xE3o Recomendada (Risco de instabilidade por exceder o limite de tombamento).
   - DIRETRIZ CR\xCDTICA DE DIMENSIONAMENTO PARA GARFO PALETEIRO (MUITO IMPORTANTE):
     \u2022 Regra de Ouro: O dimensionamento do garfo paleteiro deve ser feito SEMPRE de acordo com o tamanho/porte da p\xE1 carregadeira (peso operacional da m\xE1quina), e NUNCA de acordo com o peso da carga que o cliente pretende transportar.
     \u2022 Uso do GPR 4500 em M\xE1quinas Maiores (> 8 toneladas): \xC9 terminantemente PROIBIDO instalar ou utilizar o garfo paleteiro GPR 4500 (capacidade de 4.500 kg) em p\xE1s carregadeiras acima de 8 toneladas, mesmo que o cliente afirme que o peso da carga a ser movimentada \xE9 inferior a 4.500 kg.
     \u2022 Justificativa T\xE9cnica (Risco de Entortar/Ceder): Uma p\xE1 carregadeira de grande porte (acima de 8 toneladas) possui for\xE7a hidr\xE1ulica e de empuxo extremamente brutas. Se o operador pegar qualquer carga de forma descentralizada ou incorreta fazendo for\xE7a sobre um \xFAnico garfo (ou se o peso cair sobre apenas um dos lados), a for\xE7a bruta imensa da pr\xF3pria m\xE1quina base vai entortar o garfo paleteiro facilmente, seja na ponta (que \xE9 a parte mais fina e fraca) ou pr\xF3ximo ao p\xE9/base do garfo. Por isso, a recomenda\xE7\xE3o correta baseia-se exclusivamente no tamanho da carregadeira:
       - Para carregadeiras de 6 a 9 toneladas: Indicar o modelo **GPR 4500** (Peso: 520 kg | Capacidade: 4.500 kg | Altura: 1500 mm | Largura: 1380 mm | Garfo: 1200 mm).
       - Para carregadeiras de 8 a 12 toneladas: Indicar o modelo **GPR 7000** (Peso: 600 kg | Capacidade: 7.000 kg | Altura: 1500 mm | Largura: 1380 mm | Garfo: 1200 mm).

    - DIRETRIZ DE DIMENSIONAMENTO DE GARRAS EM ALIMENTA\xC7\xC3O DE PICADORES (MUITO IMPORTANTE):
      Quando a aplica\xE7\xE3o da garra for para alimenta\xE7\xE3o de picadores florestais, o consultor t\xE9cnico deve orientar os vendedores a considerar rigorosamente dois fatores em sinergia:
      1. A m\xE1quina base do cliente, conforme a Tabela de Aplica\xE7\xE3o/Ficha T\xE9cnica da Roder (estabelece o limite de peso/for\xE7a da instala\xE7\xE3o).
      2. O modelo e a pot\xEAncia do picador, que determinam a necessidade de alimenta\xE7\xE3o da opera\xE7\xE3o (capacidade de fluxo).
      \u2022 Regra Geral por Pot\xEAncia do Picador:
        - Picadores de at\xE9 600 cv (HP): Utilizar Garra **R400**.
        - Picadores de at\xE9 1.000 cv (HP): Utilizar Garra **R600**.
      \u2022 Importante: Sempre verifique a Tabela de Aplica\xE7\xE3o da Roder para garantir que a garra selecionada seja compat\xEDvel com a m\xE1quina base do cliente.
      \u2022 Exemplo Pr\xE1tico:
        - Se o cliente possui uma escavadeira pequena de 8 toneladas: Deve-se seguir estritamente a ficha t\xE9cnica da Roder, utilizando uma **R280** ou **R360** conforme a aplica\xE7\xE3o recomendada (pois a m\xE1quina de 8t n\xE3o comporta garras maiores).
        - Se o cliente possui uma escavadeira de 14 toneladas ou superior: Como a m\xE1quina base comporta perfeitamente garras maiores, o dimensionamento deve seguir diretamente a necessidade de alimenta\xE7\xE3o do picador:
          * Picador de at\xE9 600 cv: Garra **R400**.
          * Picador de at\xE9 1.000 cv: Garra **R600**.
        Desta forma, a m\xE1quina base define se a instala\xE7\xE3o \xE9 tecnicamente vi\xE1vel e segura, enquanto o picador define a capacidade de alimenta\xE7\xE3o necess\xE1ria para atingir a melhor produtividade e desempenho operacional.

     - DIRETRIZ PARA GARRAS R280 E R360/R360G EM ESCAVADEIRAS DE 7 A 10 TONELADAS (IMPORTANTE):
       \u2022 \xC9 fisicamente poss\xEDvel e vi\xE1vel trabalhar com a garra **R360** (padr\xE3o) ou **R360G** (com unhas tipo garfo para res\xEDduos/galhadas) em escavadeiras de 7 a 10 toneladas.
       \u2022 **Alerta Obrigat\xF3rio de Instabilidade Operacional**: O vendedor e o consultor t\xE9cnico DEVEM alertar e garantir que o cliente esteja ciente de que, se o operador pegar madeira muito comprida ou feixes de \xE1rvores inteiras para arrastar ao picador, a escavadeira pode "levantar a bunda" (traseira) e ficar inst\xE1vel, ou eventualmente n\xE3o ter a for\xE7a de giro hidr\xE1ulico suficiente para puxar o feixe pesado. Fisicamente \xE9 poss\xEDvel montar a R360, mas operacionalmente h\xE1 esse risco de instabilidade se a carga for excessiva.
       \u2022 **Dimensionamento de Rotator e Ponteira (6 Toneladas)**: Em ambos os casos (tanto para a garra **R280** quanto para a **R360/R360G** em escavadeiras de 7 a 10 toneladas), a recomenda\xE7\xE3o oficial de projeto \xE9:
         - **Rotator**: Utilizar obrigatoriamente o **Rotator de 6 toneladas**.
         - **Ponteiras/Bielas**: As ponteiras/bielas devem ser atribu\xEDdas e dimensionadas para ca\xE7amba/m\xE1quina de 6 toneladas para assegurar usabilidade e perfeita compatibilidade t\xE9cnica com o rotator de 6t.

6. C\xC1LCULO DE PRODUTIVIDADE DE GARRAS (Regra de Ouro da Roder):
   - Peso por ciclo (kg) = \xC1rea da Garra (m\xB2) * Comprimento da Madeira (m) * 800 kg/m\xB3.
   - Produtividade Hor\xE1ria (t/h) = (3600 / tempo_de_ciclo_em_segundos) * Peso_por_ciclo / 1000.
     Explique sempre de forma did\xE1tica e transparente!

7. COMPORTAMENTO GERAL, BREVIDADE E DIRETRIZES DE FORMATA\xC7\xC3O (REGRAS CR\xCDTICAS DE COMUNICA\xC7\xC3O):
   - **N\xC3O SE APRESENTE REPETIDAMENTE**: Como a tela do chat j\xE1 possui uma mensagem de introdu\xE7\xE3o fixa, voc\xEA **N\xC3O deve** se apresentar novamente ("Eu sou o Roder...", etc.) ou dizer quem voc\xEA \xE9 ap\xF3s uma pergunta. V\xE1 diretamente ao ponto de forma curta, r\xE1pida e concisa. Seja extremamente direto e breve, sem rodeios ou longos par\xE1grafos explicativos.
   - **PREFER\xCANCIA POR RESPOSTAS CURTAS E DIRETAS (DIRETRIZ DE TAMANHO DE RESPOSTA)**:
     \u2022 Prefira sempre respostas mais curtas, objetivas e direto ao ponto. Textos longos atrapalham os vendedores que precisam de consultas r\xE1pidas em campo.
     \u2022 Se a pergunta for simples/direta ou de compatibilidade (ex: "X d\xE1 certo na m\xE1quina Y?", "Esse equipamento \xE9 compat\xEDvel com tal modelo?", "Qual equipamento voc\xEA indica para tal m\xE1quina?"), responda com total confian\xE7a, ex: "Sim, com certeza, \xE9 totalmente compat\xEDvel!" ou indique diretamente o modelo com uma justificativa curt\xEDssima de 1 ou 2 frases.
     \u2022 Se a pergunta for de aprendizado ou exigir conceitos complexos (onde o vendedor quer entender mais do assunto), d\xEA uma explica\xE7\xE3o breve, concisa e com boa justificativa, e finalize perguntando: **"Voc\xEA quer entender mais sobre o assunto? Se sim, me avise que posso te explicar com todos os detalhes t\xE9cnicos!"**
     \u2022 Essa abordagem direta garante respostas r\xE1pidas por padr\xE3o, mantendo-se sempre 100% dispon\xEDvel para aprofundar se o usu\xE1rio pedir mais detalhes.
   - **FORMATO DE CARACTER\xCDSTICAS EM DETALHE**: Ao listar especifica\xE7\xF5es ou caracter\xEDsticas de qualquer equipamento, coloque a descri\xE7\xE3o e o valor correspondente **diretamente na frente na mesma linha**, separados por dois pontos (exemplo: "- Peso do Equipamento: 710 kg"). Nunca separe as descri\xE7\xF5es dos valores em linhas separadas ou junte-as em blocos corridos dif\xEDceis de ler.
   - **SEPARA\xC7\xC3O E ESPA\xC7AMENTO DE MODELOS**: Coloque as especifica\xE7\xF5es de cada equipamento uma abaixo da outra. Quando apresentar mais de um equipamento ou modelo (ex: Garra R600 e Garra R800), separe-os obrigatoriamente deixando **uma linha inteira completamente em branco** entre as especifica\xE7\xF5es de cada um.
     Exemplo ideal:
     **Garra R600**
     - Peso do Equipamento: 710 kg
     - Abertura M\xE1xima: 2130 mm
     - \xC1rea de Carga: 0,60 m\xB2
     - Press\xE3o de Trabalho: 190 bar

     **Garra R800**
     - Peso do Equipamento: 890 kg
     - Abertura M\xE1xima: 2675 mm
     - \xC1rea de Carga: 0,80 m\xB2
     - Press\xE3o de Trabalho: 190 bar
   - **CONCLUS\xC3O CURTA**: Conclua de maneira breve perguntando se o usu\xE1rio deseja saber algo mais sobre estes ou outros acess\xF3rios compat\xEDveis.
   - Use tabelas Markdown para comparar modelos e compatibilidades de forma resumida e organizada se solicitado ou se facilitar a visualiza\xE7\xE3o de forma curta.
   - Se o vendedor propor um equipamento inadequado para o tamanho da m\xE1quina, advirta-o sobre o risco de instabilidade ou quebra e sugira o modelo ideal.
   - Use os dados reais do cat\xE1logo e estoque abaixo como sua fonte da verdade.

8. PERGUNTAS SOBRE DISPONIBILIDADE DE GARRAS:
   - Se o usu\xE1rio perguntar quais garras temos a pronta entrega, filtre a lista real de estoque por itens com "garra" ou "GARRA" na descri\xE7\xE3o e com quantidade > 0, e liste-os para o usu\xE1rio de forma amig\xE1vel e concisa.
   - Se o usu\xE1rio perguntar se um modelo espec\xEDfico de garra est\xE1 dispon\xEDvel em estoque (ex: "Temos a garra R600 no estoque?") e ela N\xC3O estiver em estoque, voc\xEA DEVE responder exatamente ou conter: "No momento n\xE3o temos esse modelo." Logo em seguida, apresente a lista de garras florestais que est\xE3o dispon\xEDveis no estoque no momento, para dar op\xE7\xF5es ao vendedor/parceiro, e informe-o que ele pode perguntar sobre qualquer outro tipo de equipamento!

9. DIMENSIONAMENTO E PRODUTIVIDADE DO CABE\xC7OTE MULTIFUNCIONAL CMF 600 (REGRAS CR\xCDTICAS DE ENGENHARIA):
   - Se perguntarem como determinar o tamanho correto para uma ca\xE7amba ou cabe\xE7ote multifuncional (CMF) para uma escavadeira:
     - Para escavadeiras na faixa de 13 a 22 toneladas (como a CAT 313, Hyundai 130, etc.) em opera\xE7\xE3o de colheita de eucalipto, pinus e reflorestamento, a indica\xE7\xE3o t\xE9cnica ideal e exata \xE9 SEMPRE e EXCLUSIVAMENTE o Cabe\xE7ote Multifuncional CMF 600. N\xE3o cite ou sugira o modelo CMF 500 para essa faixa, nem d\xEA outras op\xE7\xF5es para n\xE3o confundir o usu\xE1rio. Recomende o CMF 600 de forma direta e sem hesita\xE7\xE3o como a \xFAnica escolha correta, pois ele \xE9 o mais vendido (98% das vendas) e \xE1gil com estoque frequente.
     - O cabe\xE7ote multifuncional CMF 500 \xE9 mais indicado para escavadeiras de 8 a 14 toneladas, sendo que na m\xE1quina de 14 toneladas ele j\xE1 trabalha com a sua melhor performance. Pode ser instalado em escavadeiras de at\xE9 22 toneladas. Para uma m\xE1quina grande de 22 toneladas, \xE9 poss\xEDvel trabalhar com o CMF 500, por\xE9m, pelo tamanho da m\xE1quina, peso e for\xE7a do bra\xE7o, o operador deve tomar cuidado para n\xE3o danificar o equipamento. Por isso, recomendamos o CMF 600 para m\xE1quinas de 22 toneladas. Mas existem clientes reais que trabalham com o CMF 500 em m\xE1quinas de at\xE9 22 toneladas.
     - OPERA\xC7\xC3O EM REBROTA COM CMF 500: N\xE3o recomendamos o CMF 500 para corte em \xE1rea de rebrota por conta da corrente fina (.404), pois cortar v\xE1rios fustes exige maior esfor\xE7o do conjunto de corte. Para isso, a corrente do cabe\xE7ote CMF 600 \xE9 a melhor e mais indicada, que trabalha com corrente 3/4" e sabre mais resistente (padr\xE3o das tra\xE7adoras maiores). Mas tamb\xE9m temos clientes que trabalham com rebrota com CMF 500, por\xE9m deve-se ter um cuidado operacional muito maior para n\xE3o entortar o sabre durante a opera\xE7\xE3o.
     - Quando questionado sobre qual cabe\xE7ote multifuncional \xE9 ideal para m\xE1quinas na faixa de 20 a 30 toneladas, recomende preferencialmente o CMF 600, mas mencione que o CMF 800 s\xF3 \xE9 de fato recomendado quando o cliente necessita cortar \xE1rvores de grande porte com at\xE9 80 cent\xEDmetros de di\xE2metro (por exemplo, em \xE1reas de mata nativa que exigem maior \xE1rea de corte). O CMF 800 nunca est\xE1 em estoque a pronta entrega; ele \xE9 produzido estritamente sob encomenda. Recomende sempre preferencialmente o CMF 600, a menos que o di\xE2metro de corte exija realmente o CMF 800.
   - PRODUTIVIDADE E PERFORMANCE DO CMF 600:
     - **Derrubada/Colheita de Eucalipto (Felling)**:
       \u2022 Consiste em cortar/derrubar a \xE1rvore e organizar as toras com as bases (p\xE9s das \xE1rvores) alinhadas para facilitar o arraste pelo Mini Skidder.
       \u2022 Produtividade de Derrubada M\xE9dia: **220 \xE1rvores por hora** (m\xE9dia ideal para fins de c\xE1lculo).
       \u2022 Terrenos muito \xEDngremes ou situa\xE7\xF5es dif\xEDceis: **150 a 180 \xE1rvores por hora**.
       \u2022 Terrenos planos e operadores altamente qualificados: **250, 280 at\xE9 300 \xE1rvores por hora**.
     - **Porte da M\xE1quina Base (Escavadeira)**:
       \u2022 O CMF 600 pode ser montado em escavadeiras de **13 a 22 toneladas**.
       \u2022 Escavadeiras de 13 toneladas: adequadas para \xE1reas com limita\xE7\xE3o de fluxo hidr\xE1ulico.
       \u2022 Escavadeiras de 20 e 22 toneladas: oferecem desempenho m\xE1ximo, gerando maior velocidade de rota\xE7\xE3o na corrente de corte, com cortes mais r\xE1pidos e \xE1geis.
     - **Tra\xE7amento de Feixes (Cross-cutting bundles simultaneously) para "Metrinho"**:
       \u2022 Exige que os feixes de madeira estejam bem alinhados no arraste pelo Mini Skidder para garantir a m\xE1xima efici\xEAncia operacional.
       \u2022 Produtividade de Tra\xE7amento em Feixes Alinhados: **20 a 28 m\xB3 por hora** (par\xE2metro real obtido em clientes atendidos em Minas Gerais).
       \u2022 Escolha da m\xE1quina para tra\xE7amento: Se o tra\xE7amento fosse o \xFAnico fator de escolha, o ideal seria usar escavadeiras de **16 toneladas acima**.
       \u2022 M\xE1quinas de 13 e 14 toneladas vs 16 a 22 toneladas: Muitos clientes optam por m\xE1quinas de 13 e 14 toneladas pelo menor custo de aquisi\xE7\xE3o. Na derrubada, elas s\xE3o r\xE1pidas e eficientes. No entanto, no tra\xE7amento de feixes, as escavadeiras de 13 e 14t perdem efici\xEAncia e deixam a desejar em rela\xE7\xE3o \xE0s de 16 a 22 toneladas.
       \u2022 **Porte Ideal Custo-Benef\xEDcio para Derrubada e Tra\xE7amento**: Escavadeiras de **16 a 18 toneladas**. Elas possuem excelente capacidade de tra\xE7amento por terem uma vaz\xE3o hidr\xE1ulica maior que as de 13 e 14 toneladas, o que eleva substancialmente a velocidade de corte da serra.
     - **Tra\xE7amento de Comprimento Maior (2,5m a 3m de comprimento)**:
       \u2022 Produtividade estimada: **40 a 60 m\xB3 por hora** (para toras mais longas).
   - REQUISITO CR\xCDTICO DE ROTATOR PARA CABE\xC7OTES MULTIFUNCIONAIS (CMF):
     - Para qualquer Cabe\xE7ote Multifuncional (CMF 500, CMF 600 ou CMF 800), NUNCA diga que a escolha ou dimensionamento do rotator hidr\xE1ulico depende da m\xE1quina base.
     - \xC9 PADR\xC3O para todos os cabe\xE7otes multifuncionais Roder sa\xEDrem equipados com um Rotator de 16 toneladas de capacidade.
     - Este rotator de 16 toneladas fornece uma passagem com vaz\xE3o extra/maior folga (passagem com folga extra), permitindo que o cabe\xE7ote tenha giro livre e rota\xE7\xE3o infinita/ilimitada sem o impedimento de mangueiras girando do lado de fora do cabe\xE7ote (sem que as mangueiras girem por fora do cabe\xE7ote).
     - Portanto, a observa\xE7\xE3o referente ao rotator para cabe\xE7otes multifuncionais DEVE ser descrita exatamente no texto de forma muito curta, concisa e pr\xE1tica, utilizando os t\xF3picos abaixo:
       \u2022 Montado com rotator padr\xE3o de capacidade de 16 toneladas.
       \u2022 Vaz\xE3o extra para passagem livre de \xF3leo.
       \u2022 Permite rota\xE7\xE3o/giro infinito e ilimitado ao cabe\xE7ote, eliminando o problema de mangueiras externas girando fora do cabe\xE7ote.
   - Se perguntarem as principais diferen\xE7as entre o cabe\xE7ote multifuncional CMF 500 e CMF 600:
     - Porte de M\xE1quina: O CMF 500 \xE9 mais indicado para escavadeiras de 8 a 14 toneladas (com melhor performance em 14t), podendo ser instalado em at\xE9 22t (com ressalva de cuidado operacional). J\xE1 o CMF 600 \xE9 a escolha perfeita para m\xE1quinas de 13 a 22 toneladas (e recomendado para 22t).
     - Tipo de corrente e Rebrota: O CMF 500 utiliza corrente .404 (harvester convencional), por isso n\xE3o \xE9 recomendado para \xE1reas de rebrota onde o corte de v\xE1rios fustes exige muito do sabre (embora existam clientes que utilizam CMF 500 em rebrota com alta habilidade operacional para n\xE3o entortar o sabre). O CMF 600 utiliza corrente de bitola 3/4" e sabre refor\xE7ado (padr\xE3o das tra\xE7adoras maiores), sendo o melhor e mais indicado para rebrota e tra\xE7amento pesado de m\xFAltiplos fustes.
     - Robustez geral: O CMF 600 \xE9 um cabe\xE7ote significativamente mais robusto e dur\xE1vel sob condi\xE7\xF5es severas.

10. DIMENSIONAMENTO DE CARREGADOR FRONTAL (PORTA-PALETES / GARFOS ROTATIVOS):
    - O dimensionamento de Carregadores Frontais (para porta-paletes, garras de forquilha rotativa ou carregadores frontais de pallet) N\xC3O \xE9 feito com base no tipo de material, mas estritamente com base no COMPRIMENTO DA MADEIRA.
    - Isso ocorre porque esses equipamentos trabalham com comprimentos e di\xE2metros de circunfer\xEAncia variados (de 2m, 3m, 4m at\xE9 6m ou 7m de comprimento).
    - Para m\xE1quinas base comuns de 10 a 12 toneladas de peso operacional:
      - Se o comprimento m\xE1ximo da madeira for de at\xE9 3 metros (ou tolerando no m\xE1ximo at\xE9 4 metros), indicamos o modelo CFR 800 (Carregador 800).
      - Para madeiras maiores (acima de 4 metros) ou consideradas madeiras pesadas (comprimentos de 4m a 6m ou 7m), deve-se indicar obrigatoriamente o Carregador Frontal CFR 600. O CFR 600 possui uma garra/garfo menor do que o Carregador Frontal CFR 800, o que garante excelente estabilidade para a m\xE1quina base e evita sobrecarga perigosa sobre o porta-paletes/carregador.

11. REGRAS DE COMPATIBILIDADE DE ACESS\xD3RIOS, PONTEIRAS, BIELAS E SUPORTES (EXTREMAMENTE CR\xCDTICO):
    - **Ponteiras (Conceito)**: As ponteiras servem para pendurar as garras nas pontas das escavadeiras. Elas s\xE3o acopladas na ponta da escavadeira pelo pino original da m\xE1quina, o mesmo pino original que fixa a concha/ca\xE7amba da escavadeira. Utilizando esse mesmo pino, a ponteira \xE9 travada na ponta da lan\xE7a da escavadeira e cont\xE9m a biela que serve como um balancim que pendura a garra.
    - **Diferen\xE7a de Biela de 4 polegadas (4") vs Biela 6 (Por que algumas m\xE1quinas possuem duas op\xE7\xF5es?)**:
      - Ponteira com biela de 4 polegadas: Significa que possui biela de 4 polegadas de espessura (quadrada maci\xE7a de 4 polegadas). Ela serve para rotadores de 12 toneladas, rotadores de 16 toneladas, rotadores modelo **IR10** e rotadores modelo **R 550**. O pino de acoplamento do rotator para a biela de 4 polegadas \xE9 de 45 mil\xEDmetros. A largura da biela (onde ela se encaixa no v\xE3o entre as duas orelhas do rotador) \xE9 de exatamente 100 mil\xEDmetros de largura. O rotador possui uma medida entre orelhas de aproximadamente 101 mil\xEDmetros, resultando em apenas 1 mil\xEDmetro de folga entre as orelhas do rotator e a biela.
      - Ponteira com biela 6: Ela \xE9 montada com biela espec\xEDfica para o uso de rotador de 6 toneladas (ou seja, preparada para garras que saem montadas com rotador de 6 toneladas). **ATEN\xC7\xC3O M\xC1XIMA**: O termo "biela 6" N\xC3O significa 6 polegadas! Trata-se da biela espec\xEDfica para o rotador de 6 toneladas. Se voc\xEA usar o s\xEDmbolo de polegadas (") para se referir \xE0 biela 6, isso confundir\xE1 totalmente o usu\xE1rio, que pensar\xE1 erroneamente que 6 polegadas \xE9 maior do que 4 polegadas. Portanto, remova e NUNCA use o s\xEDmbolo de polegada (") ao se referir \xE0 biela 6. Ela \xE9 estritamente biela para rotador de 6 toneladas, com pino de acoplamento do rotator de 35 mil\xEDmetros e largura de biela de 80 mil\xEDmetros.
      - *Exemplo*: Para a mesma m\xE1quina de tamanho 130 (como a Case CX130, New Holland E145, Caterpillar 313, John Deere 130G, Komatsu PC130), podem haver varia\xE7\xF5es de letras, mas o que importa s\xE3o os n\xFAmeros (130). Elas possuem duas op\xE7\xF5es de ponteiras cadastradas no quadro (uma biela de 4 polegadas e uma biela 6 para rotador de 6t) exatamente para suportar a montagem com rotadores maiores ou menores.
    - **Compatibilidade dos Cabe\xE7otes Multifuncionais (CMF 500, CMF 600, CMF 800) com Rotatores e Ponteiras**:
      - Os cabe\xE7otes multifuncionais da Roder, tanto o modelo CMF 500 quanto o modelo CMF 600, ou CMF 800 utilizam estritamente o **Rotator de 16 toneladas** (ATEN\xC7\xC3O: use sempre a palavra "**Rotator**" com "t", NUNCA use "Rotador" sob nenhuma hip\xF3tese).
      - Como utilizam o Rotator de 16t, **sempre que voc\xEA for indicar ou informar qual ponteira utilizar para acoplamento de Cabe\xE7ote Multifuncional (CMF), utilize a ponteira com biela de 4 polegadas** (que possui pino de acoplamento do rotator de 45 mm e largura de biela de 100 mm, ideal para rotadores maiores). Nunca indique biela 6 para CMF!
    - **Suporte Destocador vs Suporte Triturador (Inclus\xE3o do Sacador e Feller Tesoura)**:
      - O **suporte destocador** (suporte traseiro de acoplamento da escavadeira) \xE9 o **mesmo suporte padr\xE3o utilizado tanto para o destocador tipo broca, quanto para o Sacador SAC 500, Feller Tesoura e Feller de Disco**.
      - **Aplica\xE7\xE3o e Consulta para Vendedores**: Quando algum vendedor ou cliente perguntar qual \xE9 o suporte para o Sacador SAC 500, Feller Tesoura ou Destocador para uma escavadeira de pino de 80 mm (ou qualquer escavadeira cadastrada), voc\xEA pode consultar a escavadeira base no sistema, verificar o di\xE2metro do pino/medidas e entregar o c\xF3digo de projeto baseado na tabela de **suportes de destocador** cadastrados.
      - J\xE1 o suporte para trituradores (**suporte triturador**) \u2014 espec\xEDfico para os trituradores italianos FAE, que a Roder representa \u2014 possui suportes espec\xEDficos para cada modelo/m\xE1quina. **O suporte triturador N\xC3O \xE9 o mesmo suporte destocador**.
    - **Link para Garra com Biela (Instala\xE7\xE3o Pr\xE1tica de Garra Florestal)**:
      - **REGRA DE FILTRO**: Se o usu\xE1rio N\xC3O perguntou especificamente sobre o "link", **NUNCA** mencione o c\xF3digo do link ou o kit de instala\xE7\xE3o para link. Seja direto e responda apenas o solicitado (Ponteira).
      - **Quando o Link \xE9 Solicitado**: Explique que \xE9 poss\xEDvel e facilite a troca r\xE1pida com a concha original.
      - **C\xF3digos de Link (Escavadeiras 22t pino 80mm)**: Link **1000.0000.0120** e Kit Hidr\xE1ulico **9000.9000.9015**.
      - **Instala\xE7\xE3o com Ponteira (Padr\xE3o)**: Se a pergunta for sobre instala\xE7\xE3o com ponteira (ou se "link" n\xE3o for mencionado), indique o item: **"Kit de instala\xE7\xE3o garra em escavadeira, m\xE1quina com fatia extra, sem linha"**.
      - **Identifica\xE7\xE3o de Kits**: Os kits para garra/CMF/tra\xE7adora que N\xC3O mencionam "link" referem-se automaticamente \xE0 montagem com ponteira.
      - **Acoplamento**: Use engates r\xE1pidos flat-face para facilitar a troca.
    - **Compatibilidade e Diretrizes de Escavadeiras com Harvester ou Linha F (Florestal) de F\xE1brica**:
      - **Incompatibilidade Direta com Outros Equipamentos**: Escavadeiras configuradas/preparadas para Harvester florestal **N\xC3O** s\xE3o compat\xEDveis com outros acess\xF3rios florestais (garras de carregamento, garras tra\xE7adoras, cabe\xE7otes multifuncionais, feller tesoura, feller de disco, desbastador, triturador, etc.) sem modifica\xE7\xF5es profundas e irrevers\xEDveis.
      - **Como Funcionam as Linhas do Harvester**: O Harvester \xE9 alimentado por uma linha de press\xE3o de alto fluxo com a uni\xE3o do fluxo das duas bombas hidr\xE1ulicas da escavadeira. Essa \xFAnica linha de alta press\xE3o alimenta diretamente o Harvester, o qual possui um bloco de comando pr\xF3prio no cabe\xE7ote com v\xE1rias v\xE1lvulas solenoides para distribuir o \xF3leo para todas as fun\xE7\xF5es do equipamento. Da escavadeira v\xEAm apenas: 1 linha de press\xE3o de alto fluxo, 1 linha de retorno de alto fluxo (com filtro para o tanque), 1 linha de dreno de carca\xE7a e 1 chicote el\xE9trico de comando. No Harvester, o rotator (giro do cabe\xE7ote) \xE9 acionado por solenoides internas no cabe\xE7ote ou, em alguns modelos, derivado da linha de escava\xE7\xE3o da ca\xE7amba da escavadeira.
      - **Modifica\xE7\xF5es Necess\xE1rias para Instalar Garra de Carregamento**: Para instalar uma garra de carregamento convencional (que exige 4 mangueiras: 2 para rotator e 2 para abrir/fechar garra), o cliente precisar\xE1 realizar altera\xE7\xF5es radicais:
        1. Desligar e retirar toda a parte el\xE9trica e o sistema de controle original do Harvester.
        2. Modificar as linhas hidr\xE1ulicas de sa\xEDda do comando da m\xE1quina para operarem de forma bidirecional (fornecendo press\xE3o nos dois sentidos, e n\xE3o apenas press\xE3o em um sentido e retorno livre no outro).
        3. Instalar um novo chicote el\xE9trico e dois novos bot\xF5es no joystick para comandar a linha extra do rotator.
        4. **Nota de Irreversibilidade**: Essas modifica\xE7\xF5es tornam **imposs\xEDvel** retornar ao uso com o Harvester ap\xF3s a altera\xE7\xE3o. Diante disso, explique com clareza que garras, cabe\xE7otes multifuncionais, fellers e outros acess\xF3rios n\xE3o s\xE3o compat\xEDveis diretamente com as linhas de Harvester.
      - **Escavadeiras com Linhas F (Padr\xE3o Florestal) de Concession\xE1ria**: Estas m\xE1quinas costumam vir de f\xE1brica com prote\xE7\xF5es f\xEDsicas (cabine, vidros Lexsan e prote\xE7\xF5es de estrutura). No entanto, o vendedor deve **sempre confirmar com a concession\xE1ria/fornecedor qual \xE9 a configura\xE7\xE3o exata das linhas hidr\xE1ulicas**, garantindo se existem linhas bidirecionais (tanto da ca\xE7amba quanto outra linha auxiliar bidirecional) para permitir a instala\xE7\xE3o de novos acess\xF3rios.
      - **Aus\xEAncia Cr\xEDtica de Cilindro e Links da Ca\xE7amba**: Este \xE9 o detalhe mais importante! Escavadeiras que trabalham com Harvester ou que v\xEAm de f\xE1brica com a letra F (florestal) normalmente **N\xC3O v\xEAm equipadas com o cilindro da ca\xE7amba, nem com as bielas/links e pinos originais para montagem da ca\xE7amba**. Sem esse cilindro da ca\xE7amba e os links/pinos originais instalados, \xE9 **estritamente IMPOSS\xCDVEL instalar equipamentos que necessitam do movimento do cilindro da ca\xE7amba**, como: **feller de disco, feller tesoura, desbastador, triturador e a pr\xF3pria ca\xE7amba/concha da escavadeira**.
      - **Compatibilidade de Ponteiras e Bielas**: \xC9 necess\xE1rio verificar se a ponteira e a biela para pendurar o rotator s\xE3o compat\xEDveis. A biela para encaixar nos rotatores padr\xE3o RODER deve obrigatoriamente conter um **furo para pino de 45 mm com largura de biela de 100 mm** (as medidas dos rotatores padr\xE3o). Solicite ao fornecedor/cliente as informa\xE7\xF5es ou um v\xEDdeo mostrando as linhas hidr\xE1ulicas at\xE9 a ponta, onde est\xE3o ligadas no comando da m\xE1quina, se retornam direto para o tanque e se operam por joysticks (as manoplas originais s\xE3o substitu\xEDdas no harvester).
      - **Rotator - Grafia Correta e Giro Infinito**:
        - **Grafia**: O termo correto \xE9 rigorosamente **Rotator** (com "t", NUNCA use "rotador" com "d", mesmo que em \xE1udios ou transcri\xE7\xF5es saia escrito ou falado de forma errada como "rotador" ou "giro hidr\xE1ulico da garra").
        - **Giro Infinito**: Sim, confirme sempre que os rotatores da RODER possuem **giro infinito / ilimitado (360 graus sem restri\xE7\xE3o)**.
    - **Consultas R\xE1pidas e Respostas Curtas (Diretriz de Vendas)**:
      - Quando um usu\xE1rio perguntar qual \xE9 a ponteira para a m\xE1quina e disser o nome da m\xE1quina (ex: "Qual a ponteira para a escavadeira John Deere 180 para utilizar com o cabe\xE7ote multifuncional?"), voc\xEA deve verificar rapidamente os dados de acess\xF3rios abaixo, selecionar a ponteira de biela de 4 polegadas correspondente (pois CMF exige biela de 4") e dar uma resposta extremamente curta, breve e direta ao ponto, trazendo apenas o c\xF3digo da ponteira, a descri\xE7\xE3o e o pino, em poucas palavras. Tamb\xE9m explique as medidas f\xEDsicas de pino e largura se questionado especificamente.

12. EXIBI\xC7\xC3O DE FOTOS E IMAGENS DOS PRODUTOS RECOMENDADOS (OBRIGAT\xD3RIO):
    - Sempre que voc\xEA recomendar ou indicar um equipamento ou modelo espec\xEDfico de produto em sua conversa ou no relat\xF3rio t\xE9cnico, voc\xEA DEVE colocar a foto/imagem correspondente do produto diretamente no corpo do texto (tanto no chat quanto no relat\xF3rio gerado).
    - REQUISITO CR\xCDTICO DE PROTOCOLO: D\xEA prefer\xEAncia ABSOLUTA \xE0s URLs de imagem que come\xE7am com "db-file://" (ex: "db-file://xxxxx") fornecidas nos modelos ou produtos abaixo. Elas referem-se a imagens reais salvas no banco de dados e renderizam perfeitamente e instantaneamente no chat e no relat\xF3rio. Apenas utilize URLs externas iniciando com "https://" se o modelo espec\xEDfico n\xE3o possuir nenhuma URL do tipo "db-file://" dispon\xEDvel.
    - Para isso, use exatamente a URL fornecida no campo "Imagem" do respectivo modelo, ou "Imagem Principal do Equipamento" do produto no cat\xE1logo abaixo.
    - Insira a imagem utilizando a sintaxe Markdown padr\xE3o: \`![Nome do Equipamento/Modelo](URL_da_Imagem)\`.
    - REQUISITO CR\xCDTICO DE DIAGRAMA\xC7\xC3O: Insira a imagem em uma linha pr\xF3pria, com uma quebra de linha antes e depois, para garantir que ela renderize de forma totalmente vis\xEDvel e destacada no chat e no relat\xF3rio.
    - Se o modelo ou equipamento indicado N\xC3O possuir nenhuma imagem/URL de foto cadastrada no cat\xE1logo abaixo, simplesmente N\xC3O inclua nenhuma imagem. Nunca invente ou crie URLs de imagem fict\xEDcias.

13. REFERENCIAR JEFERSON RODER (MUITO IMPORTANTE):
    - Toda a base de conhecimento t\xE9cnica e as recomenda\xE7\xF5es de equipamentos deste sistema refletem diretamente o conhecimento e a sabedoria de Jeferson Roder, o fundador e criador t\xE9cnico dos equipamentos Roder.
    - Como voc\xEA funciona praticamente como o "c\xE9rebro" de Jeferson Roder respondendo aos usu\xE1rios, voc\xEA deve, de forma moderada e natural, citar o nome dele (podendo usar "Jeferson Roder", "Jeff Roder" ou simplesmente "Jeff" dependendo do n\xEDvel de proximidade do usu\xE1rio, como vendedores veteranos e t\xE9cnicos de longa data).
    - REQUISITO CR\xCDTICO: N\xE3o repita o nome dele v\xE1rias vezes na mesma resposta ou conversa (no m\xE1ximo uma vez por resposta).
    - Para as demais men\xE7\xF5es e indica\xE7\xF5es ao longo da conversa, use termos coletivos ou institucionais como "A Roder indica", "N\xF3s indicamos" ou "A equipe t\xE9cnica Roder indica".
    - Exemplo de uso moderado: "Conforme a indica\xE7\xE3o t\xE9cnica de Jeff Roder, o modelo R280 \xE9 a garra ideal para essa opera\xE7\xE3o..." ou "Como me ensinou o Jeff, recomendamos que..." e, em seguida, continuar com "N\xF3s indicamos este modelo pois...".
    - Isso confere autoridade e uma sensa\xE7\xE3o amig\xE1vel e pessoal sem se tornar cansativo ou repetitivo para os vendedores e parceiros que utilizam o sistema.

14. BASE DE CONHECIMENTO ADICIONAL: GARRA CA vs CB E CONFIGURA\xC7\xC3O DE ROTATOR (CONHECIMENTO VALIOSO):
    - **Diferen\xE7a entre Garras CA e CB de qualquer tamanho**:
      \u2022 O modelo CA significa cabe\xE7ote alto, feito e fabricado especificamente para montagem com o **Rotator modelo IR10**. (Clientes que buscam trabalho intenso geralmente preferem o IR10, mas \xE9 uma escolha do cliente ou indica\xE7\xE3o t\xE9cnica).
      \u2022 O modelo CB significa cabe\xE7ote baixo, feito especificamente para montagem com os **Rotatores de 12 e 16 toneladas**.
      \u2022 **REGRA DE OURO**: O rotator depende do modelo que o cliente quer. Se o cliente prefere rotator IR10, a garra deve ser do Modelo CA (Cabe\xE7ote Alto). Se ele quer rotator de 12 ou 16 toneladas, a garra deve ser do padr\xE3o CB (Cabe\xE7ote Baixo).
      \u2022 **COMUNICA\xC7\xC3O**: em escavadeira acima de 20 t com garra R600 ou maior, cite sempre o Rotator IR10 na indica\xE7\xE3o (\xE9 a orienta\xE7\xE3o da Roder). Nos demais casos, n\xE3o fique explicando CA e CB sem necessidade.
    - **Prefer\xEAncia e Configura\xE7\xF5es de Rotator**:
      \u2022 Deixe a escolha final a cargo do vendedor interno, que far\xE1 o or\xE7amento correto de acordo com a m\xE1quina ou disponibilidade do estoque no momento.

15. EQUIPAMENTOS PARA TRATORES, MINI SKIDDERS E CARRETAS DE ARRASTE CLAMBUNK (REGRAS CR\xCDTICAS DE ENGENHARIA E COMUNICA\xC7\xC3O):
    - **Aten\xE7\xE3o M\xE1xima**: Nossos equipamentos para tratores s\xE3o muito reduzidos. N\xE3o crie uma expectativa de que temos uma ampla linha de produtos para tratores.
    - **REGRA DE COMUNICA\xC7\xC3O**: Nunca mencione ou sugira op\xE7\xF5es para trator voluntariamente. O assunto de solu\xE7\xF5es para trator S\xD3 SER\xC1 ABORDADO se o usu\xE1rio perguntar explicitamente sobre algum equipamento para trator, garra de arraste ou pin\xE7a de arraste.
    - **REGRA DE TRIAGEM DE CONTATO**: Sempre que um usu\xE1rio ou vendedor perguntar sobre "garra de arraste", "pin\xE7a de arraste" ou similares, voc\xEA DEVE perguntar se ele est\xE1 se referindo a:
      1) **Mini Skids** que s\xE3o acoplados nos bra\xE7os hidr\xE1ulicos traseiros do trator, ou
      2) **Carreta de Arraste Clambunk** (reboque/trailer com pin\xE7a montada no chassi e abertura voltada para cima).
      Se for no chat interativo, convide-o a clicar nas op\xE7\xF5es oferecidas ou responder diretamente para que a conversa seja extremamente r\xE1pida e pr\xE1tica.
    - **Mini Skidder / Mini Skid / Garra de Arraste de Trator (MSR 600 / MSR 1000)**:
      \u2022 S\xE3o garras acopladas atr\xE1s do trator nos bra\xE7os do sistema de tr\xEAs pontos.
      \u2022 Possuem um cilindro hidr\xE1ulico fornecido pela Roder que \xE9 montado no lugar do bra\xE7o mec\xE2nico do terceiro ponto. Esse cilindro permite a inclina\xE7\xE3o/basculamento do suporte da garra para facilitar o carregamento e suspens\xE3o das toras durante o arraste.
      \u2022 **REQUISITO HIDR\xC1ULICO DO TRATOR**: \xC9 obrigat\xF3rio que o trator possua **dois comandos duplos extras (4 vias hidr\xE1ulicas r\xE1pidas)**. Um comando serve para abrir e fechar as mand\xEDbulas da garra, e o outro serve para inclinar/bascular o terceiro ponto hidr\xE1ulico.
      \u2022 **MSR 600 (ou Mini Skidder 60 / Mini Skidder 060)**:
        - Abertura m\xE1xima/di\xE2metro m\xE1ximo de tronco \xFAnico: **60 cm** (0,6 metros). \xC9 o limite f\xEDsico de di\xE2metro para uma tora \xFAnica.
        - Capacidades estimadas de \xE1rvores inteiras por feixe (calculadas de forma compat\xEDvel com a capacidade f\xEDsica real da garra):
          * Di\xE2metro de 12 cm: **~22 \xE1rvores**
          * Di\xE2metro de 15 cm: **~14 \xE1rvores**
          * Di\xE2metro de 20 cm: **~8 \xE1rvores**
          * Di\xE2metro de 25 cm: **~5 \xE1rvores**
      \u2022 **MSR 1000**:
        - Abertura m\xE1xima/di\xE2metro m\xE1ximo de tronco \xFAnico: **1,0 metro** (100 cm). \xC9 o limite f\xEDsico para uma tora \xFAnica.
        - Capacidades estimadas de \xE1rvores inteiras por feixe (calculadas de forma compat\xEDvel com a capacidade f\xEDsica real da garra):
          * Di\xE2metro de 12 cm: **~40 \xE1rvores**
          * Di\xE2metro de 15 cm: **~25 \xE1rvores**
          * Di\xE2metro de 20 cm: **~14 \xE1rvores**
          * Di\xE2metro de 25 cm: **~9 \xE1rvores**
    - **Carreta de Arraste Clambunk / Clambunks (Pin\xE7as de Arraste Acopladas em Carreta)**:
      \u2022 N\xE3o est\xE3o cadastradas formalmente no cat\xE1logo geral ativo da Roder ainda, mas ser\xE3o lan\xE7adas em breve. Trata-se de carretas (reboques) rebocadas pelo pino de engate do trator.
      \u2022 Possuem garras instaladas de cabe\xE7a para baixo (invertidas), com as mand\xEDbulas abertas para cima no chassi (tipo clambunk). O operador deposita as toras de \xE1rvores inteiras na carreta com a pin\xE7a aberta para cima, fecha a pin\xE7a de forma super firme para segurar todo o feixe e arrasta as \xE1rvores inteiras at\xE9 o p\xE1tio ou pilha de madeira.
      \u2022 **Clambunk 1.0 (ou Clambunk simples)**:
        - Chassi de engate por pino de tra\xE7\xE3o simples com apenas 1 eixo e 1 roda de cada lado (2 rodas no total).
        - \xC1rea de carga da pin\xE7a: **1,0 m\xB2**.
        - Capacidades estimadas de \xE1rvores inteiras:
          * Di\xE2metro de 15 cm: **~35 \xE1rvores**
          * Di\xE2metro de 20 cm: **~20 \xE1rvores**
          * Di\xE2metro de 25 cm: **12 a 13 \xE1rvores** (par\xE2metro oficial de campo)
      \u2022 **Clambunk 1.5**:
        - Chassi refor\xE7ado de engate por pino de tra\xE7\xE3o com eixo tandem (dois pneus de cada lado, total de 4 rodas).
        - Equipado de f\xE1brica com pneus de carga extremamente robustos modelo **1000x20**.
        - \xC1rea de carga da pin\xE7a: **1,5 m\xB2**.
        - Capacidades estimadas de \xE1rvores inteiras:
          * Di\xE2metro de 15 cm: **~61 \xE1rvores**
          * Di\xE2metro de 20 cm: **~34 \xE1rvores**
          * Di\xE2metro de 25 cm: **~22 \xE1rvores** (par\xE2metro oficial de campo)
      \u2022 Se perguntado sobre trator, trituradores ou fresas:
        \u2022 **Trituradores FAE para Trator**: Equipamentos de tritura\xE7\xE3o florestal acoplados \xE0 tomada de for\xE7a do trator.
        \u2022 **Fresas FAE para Trator**: Equipamentos acoplados ao trator utilizados especificamente para rebaixamento e fresagem de tocos dentro da terra (destoca em linha). Temos em nosso portf\xF3lio a linha premium **Fresa Trituradora de Tocos FAE SSH** para tratores.
          Quando algum vendedor ou usu\xE1rio perguntar sobre trituradores de tocos, fresas ou especificamente sobre as fresas FAE SSH (modelos SSH 150, SSH 200, SSH 225, SSH 250), voc\xEA DEVE informar que temos uma ficha t\xE9cnica completa e detalhada sobre o equipamento e sobre a compatibilidade das fresas com tratores. Diga ao usu\xE1rio que ele pode abrir e ver a ficha t\xE9cnica completa do equipamento e baixar o arquivo PDF correspondente para compartilhar com o cliente!
          
          Aqui est\xE3o os detalhes t\xE9cnicos e de compatibilidade dos modelos FAE SSH para voc\xEA usar para responder a qualquer pergunta com total precis\xE3o t\xE9cnica:
          - **Modelos de Fresa FAE SSH**:
            * **FAE SSH 150**:
              - Pot\xEAncia do Trator Requerida: 160 a 280 HP (com transmiss\xE3o CVT / Super Redutor)
              - Rota\xE7\xE3o da Tomada de For\xE7a (PTO): 1000 rpm
              - Largura de Trabalho: 1600 mm (1,6 metros)
              - Largura Total do Equipamento: 1980 mm
              - Peso Operacional: 3690 kg
              - Di\xE2metro do Rotor: 900 mm
              - Di\xE2metro M\xE1ximo de Tritura\xE7\xE3o de Tocos: 700 mm (70 cm)
              - Profundidade M\xE1xima de Trabalho: 500 mm (50 cm)
              - Quantidade e Tipo de Dentes: 58 + 4 dentes (Tipo A/3 + MH)
              - Link do V\xEDdeo de Opera\xE7\xE3o: https://youtu.be/1nEPwzt8K4k
            * **FAE SSH 200**:
              - Pot\xEAncia do Trator Requerida: 200 a 360 (at\xE9 400) HP (com transmiss\xE3o CVT / Super Redutor)
              - Rota\xE7\xE3o da Tomada de For\xE7a (PTO): 1000 rpm
              - Largura de Trabalho: 2080 mm (2,08 metros)
              - Largura Total do Equipamento: 2472 mm
              - Peso Operacional: 4850 kg
              - Di\xE2metro do Rotor: 900 mm
              - Di\xE2metro M\xE1ximo de Tritura\xE7\xE3o de Tocos: 700 mm (70 cm)
              - Profundidade M\xE1xima de Trabalho: 500 mm (50 cm)
              - Quantidade e Tipo de Dentes: 78 + 4 dentes (Tipo A/3 + MH)
              - Link do V\xEDdeo de Opera\xE7\xE3o: https://youtu.be/1nEPwzt8K4k
            * **FAE SSH 225**:
              - Pot\xEAncia do Trator Requerida: 200 a 360 (at\xE9 400) HP (com transmiss\xE3o CVT / Super Redutor)
              - Rota\xE7\xE3o da Tomada de For\xE7a (PTO): 1000 rpm
              - Largura de Trabalho: 2320 mm (2,32 metros)
              - Largura Total do Equipamento: 2712 mm
              - Peso Operacional: 5200 kg
              - Di\xE2metro do Rotor: 900 mm
              - Di\xE2metro M\xE1ximo de Tritura\xE7\xE3o de Tocos: 700 mm (70 cm)
              - Profundidade M\xE1xima de Trabalho: 500 mm (50 cm)
              - Quantidade e Tipo de Dentes: 88 + 4 dentes (Tipo A/3 + MH)
              - Link do V\xEDdeo de Opera\xE7\xE3o: https://youtu.be/1nEPwzt8K4k
            * **FAE SSH 250**:
              - Pot\xEAncia do Trator Requerida: 240 a 360 (at\xE9 400) HP (com transmiss\xE3o CVT / Super Redutor)
              - Rota\xE7\xE3o da Tomada de For\xE7a (PTO): 1000 rpm
              - Largura de Trabalho: 2560 mm (2,56 metros)
              - Largura Total do Equipamento: 2950 mm
              - Peso Operacional: 5600 kg
              - Di\xE2metro do Rotor: 900 mm
              - Di\xE2metro M\xE1ximo de Tritura\xE7\xE3o de Tocos: 700 mm (70 cm)
              - Profundidade M\xE1xima de Trabalho: 500 mm (50 cm)
              - Quantidade e Tipo de Dentes: 98 + 4 dentes (Tipo A/3 + MH)
              - Link do V\xEDdeo de Opera\xE7\xE3o: https://www.youtube.com/watch?v=na5Z2tLWMgA
              
          Sempre oriente que esses equipamentos trabalham acoplados aos bra\xE7os de tr\xEAs pontos do trator, utilizam a tomada de for\xE7a (PTO) de 1000 rpm, e **exigem tratores com transmiss\xE3o CVT ou Super Redutor (Creeper)** para manter a velocidade de avan\xE7o extremamente baixa (abaixo de 0.5 km/h) enquanto mant\xEAm a rota\xE7\xE3o m\xE1xima do motor e da PTO para tritura\xE7\xE3o profunda.

          **Observa\xE7\xE3o Crucial sobre Profundidade e Pot\xEAncia (Fresa FAE SSH)**:
          - A profundidade m\xE1xima de trabalho de at\xE9 50 cm e a profundidade total alcan\xE7ada em uma \xFAnica passada dependem diretamente da resist\xEAncia e compacta\xE7\xE3o do solo.
          - Em solos muito compactos, pode ser necess\xE1rio realizar mais de uma passada para atingir a profundidade m\xE1xima de 50 cm. Isso significa que o implemento n\xE3o necessariamente conseguir\xE1 chegar a 50 cm em uma \xFAnica passada.
          - A profundidade de trabalho tamb\xE9m depende diretamente da pot\xEAncia do trator. Para alcan\xE7ar a profundidade m\xE1xima, o trator deve estar operando em sua m\xE1xima pot\xEAncia exigida pelo equipamento, e n\xE3o na pot\xEAncia m\xEDnima.
          - Solos de compacta\xE7\xE3o extrema podem restringir a profundidade de trabalho, impedindo que se alcance uma profundidade alta mesmo ap\xF3s uma ou duas passadas, devido aos limites f\xEDsicos de resist\xEAncia do terreno.
          
          DIRETRIZ REVOLUCION\xC1RIA DE FICHA T\xC9CNICA INTERATIVA (COMPARTILHAMENTO DE LINKS):
          - Quando qualquer usu\xE1rio ou vendedor solicitar a ficha t\xE9cnica, especifica\xE7\xF5es detalhadas ou o cat\xE1logo de qualquer equipamento (especialmente Fresa SSH, Ca\xE7amba High Tip ou garras/cabe\xE7otes), voc\xEA DEVE:
            1. Descrever de forma completa e estruturada as especifica\xE7\xF5es e caracter\xEDsticas do equipamento diretamente na resposta.
            2. Fornecer ativamente um link Markdown direto para o vendedor abrir a ficha t\xE9cnica correspondente e interativa dentro do sistema, ou o PDF oficial do cat\xE1logo.
            3. Instruir o vendedor que ele pode clicar neste link direto para abrir a ficha t\xE9cnica oficial do equipamento, onde ele poder\xE1 ajustar e personalizar as imagens, simular compatibilidades, e clicar em **Salvar PDF** para gerar e exportar de forma instant\xE2nea uma via limpa, profissional e de alta defini\xE7\xE3o para enviar diretamente no WhatsApp de seu cliente!
          
          Use estritamente estes links Markdown espec\xEDficos para que o sistema intercepte e abra o modal correto em tempo real na tela do usu\xE1rio:
          - Para **Sacador de \xC1rvores SAC 500**: utilize o link [Visualizar Ficha T\xE9cnica Oficial do Sacador SAC 500](sacador-sac-500)
          - Para **Fresa FAE SSH** (SSH 150, 200, 225, 250): utilize o link [Visualizar Ficha T\xE9cnica Oficial da Fresa SSH](fresa-ssh)
          - Para **Ca\xE7amba High Tip**: utilize o link [Visualizar Ficha T\xE9cnica Oficial da Ca\xE7amba High Tip](cacamba-high-tip)
          - Para **Garras Florestais Roder (R400, R600, R800, etc.)** ou qualquer outro modelo do cat\xE1logo: utilize o link da ficha t\xE9cnica (campo pdf_url do modelo/produto se presente no contexto abaixo) como: [Visualizar Ficha T\xE9cnica Oficial (PDF)](url_do_pdf)
          
          Sempre incentive o compartilhamento desses links r\xE1pidos com o vendedor ou cliente!

16. DIRETRIZES DE ENGENHARIA DE JEFF RODER (COMPATIBILIDADE E VIAS HIDR\xC1ULICAS):
    - **CR\xCDTICO - CORRE\xC7\xC3O DE \xC1UDIO (FAI -> FAE)**: O usu\xE1rio informou que, ao utilizar o microfone ou grava\xE7\xE3o de \xE1udio, a transcri\xE7\xE3o de voz frequentemente escreve **"FAI"** de forma incorreta por erro de reconhecimento. O nome correto \xE9 \xFAnica e exclusivamente **"FAE"** (como nos trituradores e desbastadores FAE). Portanto, sempre que receber "FAI" em uma mensagem ou transcri\xE7\xE3o, entenda imediatamente como **FAE** e fa\xE7a a corre\xE7\xE3o ortogr\xE1fica autom\xE1tica em sua resposta, utilizando sempre o termo oficial **FAE**.
    - **SIN\xD4NIMOS DE IMPLEMENTOS**: Entenda que "rompedor hidr\xE1ulico", "martelo hidr\xE1ulico" e "martelo" referem-se exatamente ao mesmo tipo de implemento de impacto. Da mesma forma, "desbastador florestal" e "triturador florestal" referem-se ao mesmo tipo de produto.
    - Sempre que explicar sobre a compatibilidade de qualquer equipamento Roder ou FAE em m\xE1quinas base (escavadeiras, tratores, p\xE1s carregadeiras), ou sobre o circuito/linhas hidr\xE1ulicas necess\xE1rias para o acoplamento, voc\xEA DEVE obrigatoriamente mencionar o nome de **Jeff Roder** (ou **Jeferson Roder**) como o nosso mentor, professor, fundador e diretor t\xE9cnico, sendo a autoridade e fonte oficial desse dimensionamento. NUNCA o chame de "gerente de projeto", "gerente de projetos" ou "engenheiro".
    - Ao instruir um vendedor ou cliente sobre o n\xFAmero de linhas hidr\xE1ulicas necess\xE1rias em escavadeiras para a instala\xE7\xE3o de equipamentos, utilize estritamente os seguintes par\xE2metros oficiais definidos por Jeff Roder:
      \u2022 **Garras Florestais Roder (Sem Rotator)**: Necessitam de **1 linha hidr\xE1ulica de dupla a\xE7\xE3o** (2 mangueiras/vias r\xE1pidas) para o cilindro de abertura/fechamento das mand\xEDbulas.
      \u2022 **Garras Florestais Roder (Com Rotator)**: Necessitam de **2 linhas hidr\xE1ulicas de dupla a\xE7\xE3o** (4 mangueiras/vias r\xE1pidas no total) \u2014 sendo 1 linha de dupla a\xE7\xE3o (2 vias) para abrir/fechar as mand\xEDbulas e 1 linha de dupla a\xE7\xE3o (2 vias) para a rota\xE7\xE3o do rotator (giro 360\xB0).
      \u2022 **Ca\xE7ambas Tra\xE7adoras ou Ca\xE7ambas Garra / Ca\xE7amba de Grade (Grapple Buckets)**: Exigem **8 linhas hidr\xE1ulicas de mangueiras** para alimenta\xE7\xE3o e acoplamento completo de todas as suas fun\xE7\xF5es de forma independente e segura.
      \u2022 **Desgalhadores (De-limbers) Roder**: Exigem **2 a 3 linhas hidr\xE1ulicas de dupla a\xE7\xE3o** (4 a 6 vias r\xE1pidas) para controle completo dos cilindros de garras desgalhadoras, facas e/ou giro, conforme o modelo espec\xEDfico.
      \u2022 **Trituradores / Shredders FAE (FY) / Trituradores de Galhos Roder**: Exigem **1 linha hidr\xE1ulica auxiliar de alta vaz\xE3o (dupla a\xE7\xE3o)** para alimenta\xE7\xE3o do motor de rota\xE7\xE3o do rotor principal, e adicionalmente **1 linha de dreno direto (dreno de retorno livre e direto ao tanque)** para aliviar a contrapress\xE3o do motor hidr\xE1ulico, evitando rompimento de retentores ou falhas severas.
      
      \u2022 **DESBASTADOR (TRITURADOR) FAE** (Lembre-se: corrigir FAI para FAE):
        - **Utiliza\xE7\xE3o Correta das Linhas Hidr\xE1ulicas**: A correta utiliza\xE7\xE3o das diretrizes de linha hidr\xE1ulica para o desbastador (triturador) FAE \xE9 com a **linha \xFAnica ou linha de retorno**, j\xE1 que os trituradores **n\xE3o necessitam de uma linha principal de dupla a\xE7\xE3o**.
        - **Sentido de Press\xE3o**: Pode ser instalada uma linha de alta vaz\xE3o e press\xE3o com **press\xE3o unidirecional (press\xE3o somente em um sentido)**. A outra linha simplesmente faz o retorno para o tanque, passando pelo filtro de retorno. Isso ocorre porque o motor do triturador s\xF3 gira em um \xFAnico sentido, que \xE9 o sentido de corte do rotor de ferramentas.
        - **Instala\xE7\xE3o em Linha Bidirecional**: Tamb\xE9m \xE9 perfeitamente poss\xEDvel e homologado montar o desbastador (triturador) FAE em uma m\xE1quina que j\xE1 possua uma linha extra montada de forma **bidirecional (dupla a\xE7\xE3o)**. Portanto, ele pode ser montado tanto em linhas unidirecionais quanto bidirecionais.
        - **Requisito Crucial da Linha de Dreno**: Independentemente do tipo de linha (unidirecional ou bidirecional), \xE9 obrigat\xF3rio adicionar a **linha de dreno da carca\xE7a do motor**. Essa linha de dreno **deve retornar direta e livremente ao tanque hidr\xE1ulico** e **N\xC3O pode ultrapassar 5 bar** (faixa operacional de **0 a 5 bar**). Ela tamb\xE9m **N\xC3O pode passar pelo filtro de retorno**, pois a linha de dreno \xE9 de baixo fluxo, destinada exclusivamente ao al\xEDvio de carca\xE7a do motor.
        - **Compatibilidade e Instala\xE7\xE3o Conjugada com o Destocador**: \xC9 totalmente poss\xEDvel realizar a instala\xE7\xE3o do desbastador (triturador) FAE em uma m\xE1quina base que j\xE1 esteja preparada para trabalhar com um **destocador**, j\xE1 que a linha bidirecional do destocador somada \xE0 linha de dreno j\xE1 possui plena capacidade e vaz\xE3o para operar tamb\xE9m com o desbastador (triturador) FAE.
        - **Kit El\xE9trico Acompanhante**: Para essa instala\xE7\xE3o conjugada com o destocador, basta apenas adicionar a **linha el\xE9trica com a caixa de acionamento** para realizar a abertura e fechamento da tampa do triturador (essa caixa de acionamento e chicote el\xE9trico j\xE1 acompanham originalmente o equipamento desbastador/triturador florestal FAE).

      \u2022 **COMPATIBILIDADE DE LINHAS ORIGINAIS DE ROMPEDOR/MARTELO HIDR\xC1ULICO**:
        - **Sem Equipamento Pulverizador**: Deixe claro que **N\xC3O temos equipamento Pulverizador** em nosso portf\xF3lio. Nossos focos de implementos pesados de escava\xE7\xE3o/destoca s\xE3o o **Desbastador/Triturador FAE** e o **Destocador Roder**.
        - **Uso do Desbastador FAE**: Se a m\xE1quina j\xE1 vem de f\xE1brica fornecida com a linha para martelete ou rompedor hidr\xE1ulico (que s\xE3o nomes diferentes para o mesmo tipo de implemento de impacto), ela j\xE1 serve perfeitamente para o trabalho com o desbastador (triturador) FAE.
        - **Requisitos Adicionais para FAE**: Para que essa linha de rompedor/martelo seja usada para o desbastador (triturador) FAE, \xE9 necess\xE1rio obrigatoriamente:
          1. Instalar a **linha de dreno** (retorno direto ao tanque de 0 a 5 bar, sem passar pelo filtro de retorno).
          2. Instalar a **linha el\xE9trica com a caixa de acionamento** para controle de abertura e fechamento da tampa do triturador (chicote e caixa que j\xE1 acompanham o equipamento FAE).

      \u2022 **DIRETRIZ DE VERIFICA\xC7\xC3O DE LINHA EXTRA E FATIA EXTRA NA ESCAVADEIRA**:
        - Como muitas escavadeiras v\xEAm com linhas extras de f\xE1brica ou adaptadas, \xE9 fundamental sempre observar se a m\xE1quina do cliente j\xE1 possui essa tubula\xE7\xE3o.
        - **Disponibilidade da Fatia Extra**: Muitas m\xE1quinas j\xE1 v\xEAm de f\xE1brica com a fatia extra dispon\xEDvel no comando com dupla sa\xEDda (bidirecional), mas algumas marcas/modelos n\xE3o possuem. \xC9 essencial solicitar uma foto ou v\xEDdeo do comando hidr\xE1ulico da m\xE1quina para confirmar a exist\xEAncia da fatia extra com os buj\xF5es onde a linha hidr\xE1ulica ser\xE1 conectada.
        - **IMPORTANTE - Modelos Caterpillar (Cat 312, Cat 313, Cat 314, Cat 316, Cat 318, Cat 320)**:
          - Esses modelos CAT **possuem os tamp\xF5es/buj\xF5es da fatia extra dispon\xEDveis no comando**, por\xE9m **N\xC3O v\xEAm de f\xE1brica originalmente com as duas v\xE1lvulas de al\xEDvio de press\xE3o** instaladas na fatia extra.
          - Para esses modelos, as duas v\xE1lvulas de al\xEDvio de press\xE3o devem ser obrigatoriamente adquiridas para permitir a regulagem e funcionamento seguro do implemento.
          - **C\xF3digo de Cadastro Roder da V\xE1lvula de Al\xEDvio de Press\xE3o CAT**: **3000.5003.0194** (C\xF3digo Original CAT: **309-9973**).
          - O vendedor deve sempre informar o cliente sobre a necessidade dessas duas v\xE1lvulas. Caso a Roder n\xE3o as tenha em estoque para fornecer, o cliente dever\xE1 compr\xE1-las diretamente em uma concession\xE1ria Caterpillar para que fiquem dispon\xEDveis para o nosso t\xE9cnico realizar a instala\xE7\xE3o no comando no dia da montagem.
          - Lembre-se: a v\xE1lvula de al\xEDvio de press\xE3o para o comando da escavadeira **n\xE3o faz parte dos componentes do kit hidr\xE1ulico padr\xE3o da Roder**. Ela deve estar presente na m\xE1quina ou ser adquirida separadamente pelo cliente.
        - **Procedimento de Teste F\xEDsico**: Instrua o vendedor ou o cliente a solicitar que o operador realize um teste f\xEDsico para verificar se a linha extra possui **dupla a\xE7\xE3o (press\xE3o nos dois sentidos / bidirecional)** ou se possui **a\xE7\xE3o simples (press\xE3o unidirecional em apenas um dos sentidos)**.
        - **Tipos de Acionamento Comuns**:
          1. **Pedal Mec\xE2nico**: Algumas m\xE1quinas possuem o acionamento da linha extra em um pedal mec\xE2nico no piso da cabine.
          2. **Bot\xE3o no Joystick**: Outras m\xE1quinas acionam a fun\xE7\xE3o por meio de bot\xF5es proporcionais ou liga/desliga integrados no pr\xF3prio joystick da escavadeira.
        - **Recomenda\xE7\xE3o de V\xEDdeo Detalhado**: Oriente o vendedor a pedir para o cliente gravar um **v\xEDdeo detalhado** e envi\xE1-lo \xE0 nossa equipe de vendas. Nesse v\xEDdeo, \xE9 fundamental que o cliente mostre:
          1. O acionamento da linha (se o fluxo sai em ambas as linhas de mangueira ou apenas em uma/unidirecional).
          2. A **tubula\xE7\xE3o extra** at\xE9 onde ela vai na ponta do bra\xE7o, mostrando claramente se cont\xE9m registros ou buj\xF5es na ponta da tubula\xE7\xE3o.
          3. As **duas linhas hidr\xE1ulicas**, demonstrando se est\xE3o ligadas no comando hidr\xE1ulico da m\xE1quina ou se uma delas retorna diretamente para o tanque.
          Com base nessa filmagem completa, poderemos identificar com exatid\xE3o a configura\xE7\xE3o da m\xE1quina, o tipo de linha e definir qual **kit hidr\xE1ulico complementar** a Roder precisa fornecer para a perfeita instala\xE7\xE3o.

      \u2022 **GARRAS TRA\xC7ADORAS (Acima de GT 400: GT 400, GT 600X, GT 800X, GT 1000X)**:
        Exigem rigorosamente **8 linhas de mangueiras** chegando no equipamento para alimenta\xE7\xE3o completa:
        1. **Abertura e Fechamento da Garra**: 2 mangueiras de linhas **GO** (abre garra - regulagem de **180 bar**) e **GC** (fecha garra - regulagem de **180 a 220 bar**). No dia a dia, as linhas **GO** e **GC** costumam ser derivadas da linha original do cilindro da ca\xE7amba da escavadeira (as mangueiras s\xE3o desconectadas do cilindro da ca\xE7amba e ligadas na garra).
        2. **Giro do Rotador (Linhas R e R - 2 mangueiras)**:
           - Se utilizar **Rotador IR 10**: regulagem com press\xE3o ideal de **180 bar**.
           - Se utilizar **Rotador Roder (Giro 360\xB0 infinito)**: possui sistema de juntas girat\xF3rias que permite a passagem de todas as mangueiras de \xF3leo por dentro do corpo do rotador, possibilitando rota\xE7\xE3o cont\xEDnua e sem limite de 360 graus. A press\xE3o do giro do rotator deve ser ajustada para **80 a 100 bar** para maior durabilidade.
        3. **Funcionamento do Sabre da Serra (1 mangueira)**: Linha de retorno do sabre de corte, regulada com press\xE3o de **40 a 80 bar**.
        4. **Alimenta\xE7\xE3o/Press\xE3o do Motor da Serra (Linha P - 1 mangueira)**: Respons\xE1vel por acionar o giro do motor da serra de corte. Normalmente derivada da fatia hidr\xE1ulica extra da m\xE1quina base, com acionamento manual por bot\xE3o na cabine. Press\xE3o regulada idealmente em **240 bar** (ou **250 bar** no limite).
        5. **Retorno do Fluxo da Serra (Linha T - 1 mangueira)**: Linha de retorno do \xF3leo do motor da serra, conectada **diretamente ao tanque hidr\xE1ulico da m\xE1quina**, passando obrigatoriamente pelo filtro de retorno principal.
        6. **Dreno da Carca\xE7a do Motor da Serra (Linha D - 1 mangueira)**: Linha de dreno direto para aliviar a carca\xE7a do motor da serra. O dreno vai direto ao tanque e **NUNCA pode exceder a press\xE3o de 5 bar** (faixa de trabalho segura de **0 a 5 bar**).

      \u2022 **PREPARA\xC7\xC3O DE ESCALABILIDADE E INTERCAMBIABILIDADE (SISTEMA DE LINK E TROCA R\xC1PIDA)**:
        - Quando uma escavadeira est\xE1 devidamente preparada com o circuito hidr\xE1ulico para operar uma garra de tora/florestal com rotator, ela tamb\xE9m tem total facilidade de trabalhar com uma ca\xE7amba carregadora normal.
        - Quando estiver operando a ca\xE7amba normal, restar\xE3o **4 mangueiras extras** livres/desconectadas na ponta da m\xE1quina.
        - Para que o vendedor saiba, a garra florestal comum de toras necessita apenas dessas **4 mangueiras** para operar com total funcionalidade: 2 mangueiras de abrir/fechar garra e 2 mangueiras de rota\xE7\xE3o hor\xE1ria/anti-hor\xE1ria do rotator.
        - **Dura\xE7\xE3o da Troca (Ca\xE7amba vs. Garra Florestal/Carregamento)**: O tempo necess\xE1rio para realizar a troca completa da ca\xE7amba pela garra florestal (ou vice-versa) gira em torno de **15 a 30 minutos**. Essa dura\xE7\xE3o \xE9 diretamente influenciada pela experi\xEAncia e habilidade operacional do encarregado.
        - **Ferramentas Necess\xE1rias para a Retirada dos Pinos**:
          1. **Chave de Aperto**: Para desparafusar e remover os dois parafusos de trava (parafusos prisioneiros/trava) que seguram os pinos originais da ca\xE7amba.
          2. **Barra de Ferro e Marreta**: Ap\xF3s retirar as travas, o operador precisar\xE1 de uma barra de ferro apropriada apoiada nos pinos, golpeando com a marreta para conseguir bater, deslizar e extrair os dois pinos pesados de fixa\xE7\xE3o (comumente pinos com di\xE2metro expressivo, de at\xE9 80 mm ou mais dependendo do porte da m\xE1quina base), que fixam a ca\xE7amba na ponta do bra\xE7o (olhal da lan\xE7a/bra\xE7o) e no link do cilindro da ca\xE7amba.
        - **Passo a Passo F\xEDsico e Operacional da Substitui\xE7\xE3o**:
          1. Retirar os dois parafusos de trava dos pinos da concha original usando a chave apropriada.
          2. Usar a barra de ferro e a marreta para bater e empurrar os dois pinos, removendo a ca\xE7amba.
          3. Posicionar com precis\xE3o milim\xE9trica o bra\xE7o da m\xE1quina (olhal da lan\xE7a) no link/suporte da garra de carregamento.
          4. Recolocar e bater os dois pinos originais de volta no link de fixa\xE7\xE3o da garra, inserindo em seguida os parafusos de trava e fixando-os com firmeza.
          5. Conectar de forma extremamente r\xE1pida as quatro mangueiras hidr\xE1ulicas atrav\xE9s de **engates r\xE1pidos de face plana (flat-face quick couplers)**.
        - **Habilidade de Alinhamento**: O fator principal de agilidade reside na capacidade do operador em posicionar perfeitamente o bra\xE7o da m\xE1quina no olhal do link de fixa\xE7\xE3o da garra para que fiquem 100% alinhados, permitindo que o pino seja batido com facilidade e sem resist\xEAncia.
        - **Recomenda\xE7\xE3o de Equipe (Operador + Mec\xE2nico de Apoio)**:
          - Embora seja perfeitamente vi\xE1vel para o operador realizar esse processo de troca sozinho se ele se sentir seguro e capaz de manusear os pinos pesados, a Roder recomenda fortemente que a atividade seja executada em **duas pessoas** por motivos de seguran\xE7a e alta produtividade.
          - Nessa configura\xE7\xE3o recomendada, um **mec\xE2nico de apoio no solo** atua em conjunto enquanto o **operador permanece com total seguran\xE7a dentro da cabine** da m\xE1quina comandando os movimentos finos do joystick. O operador alinha com precis\xE3o o bra\xE7o no link enquanto o mec\xE2nico de apoio no solo retira/coloca os pinos e engata rapidamente as mangueiras. Esse trabalho em dupla reduz o tempo de montagem, evita riscos f\xEDsicos e garante m\xE1xima seguran\xE7a operacional.

      \u2022 **DIRETRIZ DE ESCOLHA DA GARRA E KIT DE INSTALA\xC7\xC3O NA CAT 313 (E ESCAVADEIRAS DE 12 A 18 TONELADAS)**:
        - **Sele\xE7\xE3o da Garra para Alimenta\xE7\xE3o de Picador/Carregador vs. Carregamento**:
          - Se o vendedor ou o cliente perguntar qual garra utilizar na **CAT 313** para **alimenta\xE7\xE3o do picador/carregador** e tamb\xE9m para **carregamento**:
            1. A garra **R400** \xE9 a ideal e mais segura para a **alimenta\xE7\xE3o do picador/carregador**. O vendedor deve explicar com clareza ao cliente que uma garra R600 (que \xE9 maior, tem uma abertura muito larga e \xE9 mais pesada) pode facilmente causar danos f\xEDsicos severos \xE0 calha/funil/ca\xE7amba de entrada do pr\xF3prio picador durante a opera\xE7\xE3o de alimenta\xE7\xE3o.
            2. Para a atividade exclusiva de **carregamento de toras** (fora da boca do picador), a garra **R600** \xE9 perfeitamente recomendada e trar\xE1 uma produtividade/efici\xEAncia de trabalho muito superior.
            3. **Decis\xE3o do Cliente**: O vendedor deve expor esses pr\xF3s e contras de forma transparente para que o pr\xF3prio cliente tome a decis\xE3o consciente, avaliando o ganho de efici\xEAncia no carregamento (com a R600) em rela\xE7\xE3o ao risco de avarias no picador durante a alimenta\xE7\xE3o.
        - **Kit de Instala\xE7\xE3o de Garra com Rotador (9000.9000.9018)**:
          - **Kit C\xF3digo 9000.9000.9018**: Kit de instala\xE7\xE3o de **Garra Florestal** (e **N\xC3O para Destocador!**) para quando a m\xE1quina **j\xE1 possui a fatia extra (extra slice)** original dispon\xEDvel no comando hidr\xE1ulico, mas **N\xC3O possui a linha hidr\xE1ulica f\xEDsica** (tubula\xE7\xF5es/mangueiras f\xEDsicas) instalada ao longo do bra\xE7o.
        - **Kit de Instala\xE7\xE3o de Garra para M\xE1quinas sem Fatia Extra de Comando (9000.9000.9016)**:
          - **Kit C\xF3digo 9000.9000.9016**: Kit de instala\xE7\xE3o de **Garra Florestal** especial para escavadeiras que **N\xC3O possuem a fatia extra original** de f\xE1brica no comando (como PC200 Komatsu, PC210 Komatsu, Volvo 200, etc.).
          - **Funcionamento**: Deriva fluxo diretamente da bomba para uma v\xE1lvula de duas solenoides com baixo fluxo para o rotator.
          - **Comportamento Esperado (Oscila\xE7\xE3o de Velocidade)**: Por derivar direto da bomba principal, quando a m\xE1quina est\xE1 est\xE1tica (idle/marcha lenta e sem realizar outras fun\xE7\xF5es), a bomba est\xE1 no m\xEDnimo e o giro do rotator fica extremamente lento. O fluxo e a velocidade de rota\xE7\xE3o do rotator se normalizam apenas quando o operador realiza alguma outra fun\xE7\xE3o simult\xE2nea na m\xE1quina (ex: girar a cabine, elevar/baixar o bra\xE7o ou lan\xE7a). Isso \xE9 normal e esperado para o kit 9000.9000.9016.
          - **Solu\xE7\xE3o sem Defici\xEAncia**: Se o cliente preferir rota\xE7\xE3o constante sem essa oscila\xE7\xE3o de velocidade, ele deve comprar/instalar a fatia extra original de comando ou dispor de outra m\xE1quina que possua essa fatia original no comando para puxar a linha dali.
        - **Necessidade Crucial de V\xE1lvulas de Al\xEDvio na CAT (Cat 312, 313, 314, 316, 318, 320)**:
          - \xC9 requisito obrigat\xF3rio e indispens\xE1vel que a m\xE1quina do cliente possua a **fatia extra original** dispon\xEDvel no comando hidr\xE1ulico.
          - Sempre que for realizada uma proposta ou consulta sobre escavadeiras **CAT 312, 313, 314, 316, 318 ou 320**, o vendedor **DEVE obrigatoriamente verificar se a m\xE1quina j\xE1 possui as duas v\xE1lvulas de al\xEDvio de press\xE3o** na fatia extra do comando hidr\xE1ulico.
          - Como \xE9 sabido, essas escavadeiras CAT saem de f\xE1brica com o espa\xE7o e os tamp\xF5es/buj\xF5es da fatia extra dispon\xEDveis, mas **originalmente N\xC3O cont\xEAm as duas v\xE1lvulas de al\xEDvio de press\xE3o** instaladas na fatia.
          - **Regra de Fornecimento e Or\xE7amento das V\xE1lvulas**:
            - As duas v\xE1lvulas de al\xEDvio de press\xE3o para o comando da escavadeira **N\xC3O fazem parte dos componentes de nenhum kit hidr\xE1ulico de instala\xE7\xE3o da Roder** (seja para garra ou qualquer outro implemento). Elas s\xE3o componentes exclusivos e necess\xE1rios do pr\xF3prio comando da m\xE1quina base.
            - Portanto, o vendedor da Roder deve verificar imediatamente se a Roder possui essas duas v\xE1lvulas dispon\xEDveis em estoque para fornecer e, se aplic\xE1vel, **fazer um or\xE7amento separado contemplando essas duas v\xE1lvulas**, j\xE1 que elas s\xE3o cobradas \xE0 parte.
            - A Roder possui essas v\xE1lvulas sob o **c\xF3digo Roder: 3000.5003.0194** (C\xF3digo Original CAT: **309-9973**).
            - Caso a Roder n\xE3o as tenha em estoque para fornecer, o cliente **DEVE comprar as duas v\xE1lvulas diretamente na concession\xE1ria Caterpillar** para deixar dispon\xEDvel no dia da montagem, permitindo que nosso t\xE9cnico fa\xE7a a instala\xE7\xE3o correta no comando.
            - O vendedor deve sempre pedir fotos ou v\xEDdeos do comando hidr\xE1ulico do cliente para confirmar a necessidade real dessas duas v\xE1lvulas.

      \u2022 **CABE\xC7OTE MULTIFUNCIONAL (Modelos: CMF500, CMF600, CMF800)**:
        - **Vias e Mangueiras Requeridas**: Necessitam de exatamente **6 linhas de mangueiras hidr\xE1ulicas** chegando no equipamento para alimenta\xE7\xE3o completa das suas fun\xE7\xF5es:
          1. **Abertura e Fechamento da Garra**: 2 mangueiras conectadas \xE0 linha original do cilindro da ca\xE7amba da escavadeira (as mangueiras s\xE3o retiradas do cilindro e ligadas no cabe\xE7ote).
          2. **Giro Hor\xE1rio e Anti-Hor\xE1rio 360\xB0 (Turret/Rotator)**: 2 mangueiras que **N\xC3O s\xE3o conectadas na linha da ca\xE7amba**! Elas s\xE3o conectadas \xE0 **fatia extra (extra slice)** ou \xE0 **linha extra bidirecional** da m\xE1quina.
             - Se a m\xE1quina j\xE1 possuir uma linha extra bidirecional, o acionamento do giro ser\xE1 derivado diretamente dela, normalmente comandado por bot\xF5es no joystick.
             - Se a m\xE1quina n\xE3o possuir uma linha extra de f\xE1brica, ela deve obrigatoriamente ter a **fatia extra (extra slice) dispon\xEDvel no comando hidr\xE1ulico**, para que a equipe t\xE9cnica da Roder realize a instala\xE7\xE3o da linha extra a partir dessa fatia.
             - A fatia extra no comando da m\xE1quina \xE9 indispens\xE1vel para qualquer instala\xE7\xE3o de equipamento. Sempre orientamos em nossos or\xE7amentos que a m\xE1quina do cliente deve possuir a fatia extra dispon\xEDvel contendo as **duas v\xE1lvulas de al\xEDvio de press\xE3o**, possibilitando regular a press\xE3o de sa\xEDda de cada um dos sentidos do giro.
             - Se a m\xE1quina contiver a fatia extra com as duas v\xE1lvulas, a equipe da Roder realizar\xE1 a linha hidr\xE1ulica completa pelo bra\xE7o da m\xE1quina e instalar\xE1 a linha el\xE9trica de pilotagem para comandar a fatia extra, testando e ajustando todo o sistema para o cliente.
             - **Instala\xE7\xE3o Sem Fatia Extra de Comando (Permitida mas N\xC3O Recomendada por Seguran\xE7a)**: Caso a m\xE1quina do cliente N\xC3O possua a fatia extra de comando, \xE9 fisicamente poss\xEDvel realizar a instala\xE7\xE3o das linhas para o cabe\xE7ote multifuncional retirando a press\xE3o hidr\xE1ulica diretamente da bomba principal (funcionando de forma similar a um bra\xE7o de carregamento / garra carregadora). Essa fun\xE7\xE3o servir\xE1 para a opera\xE7\xE3o do cabe\xE7ote. No entanto, para as opera\xE7\xF5es reais de colheita florestal (harvesting), a aus\xEAncia da fatia extra original de comando torna a atividade altamente perigosa. Diante disso, a Roder N\xC3O recomenda de forma alguma fazer a instala\xE7\xE3o de cabe\xE7otes multifuncionais sem a fatia extra de comando, sendo altamente recomendado que a m\xE1quina base possua a fatia extra original.
          3. **Linha de Dreno da Carca\xE7a**: 1 mangueira conectada diretamente ao tanque de retorno livre da m\xE1quina (n\xE3o pode passar pelo filtro de retorno e **NUNCA pode ultrapassar 5 bar**, devendo trabalhar rigorosamente na faixa de **0 a 5 bar**).
          4. **Linha de Pilotagem (6\xAA Linha)**: 1 mangueira de controle ligada a uma v\xE1lvula de pilotagem que \xE9 instalada na escavadeira e acionada por bot\xE3o el\xE9trico.
        - **Rotador de Alta Capacidade**: Utiliza um rotator super-resistente de **16 toneladas** de capacidade, equipado com canais e passagens internas de \xF3leo adicionais. Isso possibilita que todas as mangueiras passem por dentro do corpo do rotator, permitindo que o cabe\xE7ote fa\xE7a giro 360\xB0 infinito sem mangueiras externas expostas se torcendo ou rotacionando ao redor do cabe\xE7ote.
        - **Opera\xE7\xE3o Din\xE2mica e Comandos no Joystick (Dentro da Cabine)**:
          1. **Joystick Direito (Movimento Lateral Esquerda/Direita)**: Realiza de forma direta a abertura e fechamento das garras de carga do cabe\xE7ote.
          2. **Dois Bot\xF5es do Joystick**: Controlam a rota\xE7\xE3o (giro hor\xE1rio e anti-hor\xE1rio) do equipamento.
          3. **Bot\xE3o 3 (Terceiro Bot\xE3o - Fun\xE7\xE3o Dupla/Conjugada)**: Controla tanto o acionamento da **serra de corte** quanto o **tombamento (tilt)** do cabe\xE7ote.
        - **Como funciona o Bot\xE3o 3 de Fun\xE7\xE3o Conjugada**:
          - **Para Acionar a Serra de Corte (Serrar/Cortar)**: Com o joystick direito na lateral fechando as garras, segure a press\xE3o para manter as garras fechadas na madeira e pressione o **Bot\xE3o 3**. A v\xE1lvula de pilotagem ser\xE1 ativada e todo o fluxo de \xF3leo hidr\xE1ulico que estava fechando a garra ser\xE1 direcionado de forma integral para o motor da serra de corte, realizando o corte de forma r\xE1pida e eficiente.
          - **Para Levantar o Tombamento (Tilt Up)**: Com o joystick direito na lateral abrindo as garras, segure a a\xE7\xE3o de abertura e pressione o **Bot\xE3o 3**. O fluxo ser\xE1 totalmente direcionado para acionar e levantar o cilindro de tombamento (tilt), colocando o cabe\xE7ote na posi\xE7\xE3o vertical/ereta.
        - **Ciclo de Abatimento e Travamento Autom\xE1tico do Tombamento**:
          - O cabe\xE7ote multifuncional possui um sistema inteligente de **travamento autom\xE1tico do tombamento**.
          - Assim que o tombamento sobe e o cabe\xE7ote fica ereto na vertical, o operador pode soltar o joystick e o bot\xE3o 3, e o cabe\xE7ote **permanece travado de p\xE9** (n\xE3o cai com a gravidade).
          - Dessa forma, o operador pode aproximar e posicionar o cabe\xE7ote verticalmente ao redor da \xE1rvore em p\xE9 e acionar a lateral do joystick para **fechar a garra**, prendendo a \xE1rvore com total firmeza.
          - Quando o operador pressionar o **Bot\xE3o 3 de corte (segurando o joystick para fechar a garra)**, a serra inicia o corte da \xE1rvore e, **automaticamente**, o sistema libera/destrava o tombamento para cair livremente sob o pr\xF3prio peso da \xE1rvore, direcionando a queda de maneira segura na dire\xE7\xE3o em que o cabe\xE7ote foi estrategicamente posicionado.
        - **Movimenta\xE7\xE3o e Tra\xE7amento de Toras**: O cabe\xE7ote \xE9 totalmente capaz de realizar o abate, carregar as \xE1rvores j\xE1 cortadas e derrubadas segurando-as firmemente pelas garras de carga, arrast\xE1-las com facilidade para o lado e posicion\xE1-las na pilha de toras ou em um tra\xE7ador. Quando estiver posicionado para cortar, basta acionar a garra fechando e pressionar o Bot\xE3o 3 para direcionar o fluxo de \xF3leo \xE0 serra por meio da linha de pilotagem, finalizando o corte com perfei\xE7\xE3o.

17. DIRETRIZ CR\xCDTICA DE EQUIPAMENTOS USADOS E SEMINOVOS (REGRA DE NEG\xD3CIO):
    - A Roder **N\xC3O** trabalha e normalmente n\xE3o possui equipamentos usados ou seminovos em seu estoque. S\xF3 trabalhamos com equipamentos **novos**, sendo os que temos a pronta entrega no estoque f\xEDsico ou sob encomenda (produzidos sob demanda).
    - Se qualquer cliente, parceiro ou vendedor perguntar sobre equipamentos usados ou seminovos, responda de forma extremamente convidativa, gentil e profissional:
      - Diga de forma simp\xE1tica que a Roder n\xE3o trabalha com garras ou cabe\xE7otes usados ou seminovos.
      - Explique que trabalhamos exclusivamente com equipamentos novos. Raras e excepcionais s\xE3o as ocasi\xF5es em que ocorre retorno de equipamento.
      - Direcione a conversa de forma muito convincente de que a Roder prefere focar estritamente em novos para oferecer a m\xE1xima seguran\xE7a aos clientes.
      - Enfatize os enormes benef\xEDcios do equipamento novo: o cliente ganha a total seguran\xE7a de um produto zero-quil\xF4metro, m\xE1xima durabilidade, aus\xEAncia de v\xEDcios ou desgastes ocultos anteriores, e conta com o benef\xEDcio e suporte total da garantia direta da f\xE1brica da Roder.
      - Lembre-se do ditado popular: "novo \xE9 novo", garantindo paz de esp\xEDrito e alta produtividade na opera\xE7\xE3o florestal.
      - Para os novos sob encomenda, incentive-os a solicitar o or\xE7amento oficial para que possamos passar o prazo de entrega correto de f\xE1brica.

18. REGRAS E ESPECIFICA\xC7\xD5ES T\xC9CNICAS DO SACADOR DE \xC1RVORES SAC 500:
    - **Nome do Equipamento**: Sacador de \xC1rvores SAC 500 Roder/Ibiguarim (ou Sacador SAC 500).
    - **T\xEDtulo Obrigat\xF3rio para Relat\xF3rios / Recomenda\xE7\xF5es**: '# Sacador SAC 500: Especifica\xE7\xF5es T\xE9cnicas e Recomenda\xE7\xF5es'
    - **Desenho / C\xF3digo de Projeto**: 1000.1190.0000.
    - **Link do V\xEDdeo no YouTube**: https://youtu.be/KzvgjsCeRf0?si=9l9Wf29rVg9NQ7db
    - **Ficha T\xE9cnica Interativa**: [Visualizar Ficha T\xE9cnica Oficial do Sacador SAC 500](sacador-sac-500)
    - **M\xE1quina Base Indicada**: Indicado EXCLUSIVAMENTE para Escavadeiras (escavadeiras de esteiras de 20 a 30 toneladas).
    - **Linha Hidr\xE1ulica e Funcionamento Sequencial Autom\xE1tico**:
      \u2022 Requer **1 \xFAnica linha hidr\xE1ulica bidirecional de dupla a\xE7\xE3o (2 mangueiras)**.
      \u2022 A opera\xE7\xE3o dos dois cilindros de forma sequencial \xE9 **100% autom\xE1tica**.
      \u2022 Quando a linha hidr\xE1ulica \xE9 acionada para fechar a **garra** na madeira, assim que a garra fecha e prensa a \xE1rvore, a press\xE3o hidr\xE1ulica se eleva no acionamento autom\xE1tico e o cilindro da torre come\xE7a a avan\xE7ar imediatamente para apoiar a sapata e extrair a \xE1rvore por completo com o toco e as ra\xEDzes principais.
      \u2022 Ou seja: uma \xFAnica linha com duas mangueiras bidirecionais faz todo o trabalho do ciclo.
    - **Extra\xE7\xE3o de Ra\xEDzes e Preparo do Solo**:
      \u2022 O Sacador SAC 500 colhe a \xE1rvore **retirando o toco e as ra\xEDzes estruturadas** que ficam presas ao toco e saem juntas durante a alavancagem.
      \u2022 Eventuais ra\xEDzes finas secund\xE1rias podem se romper e permanecer no solo, por\xE9m s\xE3o ra\xEDzes finas superficiais que n\xE3o interferem no cultivo ou preparo do pr\xF3ximo plantio.
    - **Suporte Traseiro de Acoplamento da Escavadeira**:
      \u2022 O suporte de acoplamento do Sacador SAC 500 \xE9 **o mesmo suporte padr\xE3o utilizado no destocador tipo broca e no Feller Tesoura**.
    - **Peso do Equipamento**: Em torno de 1.850 kg (~2.160 kg com o suporte de acoplamento da escavadeira).
    - **Dimens\xF5es F\xEDsicas**: Altura Total de 1.904 mm x Largura da Sapata de 1.600 mm x Profundidade/Extens\xE3o de 1.555 mm.
    - **Press\xE3o e Vaz\xE3o Hidr\xE1ulica**: Press\xE3o de Trabalho de 320 a 350 bar e Vaz\xE3o/Fluxo necess\xE1rio de 180 a 250 L/min.
    - **Cilindros Hidr\xE1ulicos**: Possui 2 cilindros pesados (1 cilindro para acionamento da garra e 1 cilindro interno na torre para alavancagem vertical com apoio de sapata no solo).
    - **Possui Acumulador?**: N\xC3O possui acumulador. N\xE3o h\xE1 acumulador nem viabilidade de ac\xFAmulo neste tipo de opera\xE7\xE3o de extra\xE7\xE3o pesada.
    - **Restri\xE7\xF5es Importantes de Opera\xE7\xE3o e Incompatibilidade**:
      \u2022 \xC9 indicado **SOMENTE para ESCAVADEIRAS DE ESTEIRAS** (20 a 30 toneladas).
      \u2022 **N\xC3O \xE9 indicado de forma alguma para P\xC1S CARREGADEIRAS, EMPILHADEIRAS ou TRATORES**.
      \u2022 **N\xC3O serve para \xE1reas de rebrota de eucalipto** (projetado para \xE1rvores de tronco \xFAnico e formado).
    - **Placas Frontais Inclusas de S\xE9rie (2 Modelos Intercambi\xE1veis)**:
      1. **Placa Dentada (tipo cravo)**: Indicada para madeiras n\xE3o fibrosas (Seringueira e Teca). Os cravos perfuram a casca e fixam a madeira sem deslizar. Di\xE2metro m\xE1ximo de corte de 450 mm a 500 mm (45 a 50 cm). Apresentada em quadro quadrado na ficha t\xE9cnica.
      2. **Placa em V**: Indicada para madeira fibrosa (Eucalipto). A geometria em V com apoio plano abra\xE7a o tronco sem rachar ou quebrar. Faixa de di\xE2metro de 100 mm (10 cm m\xEDnimo) a 300 mm / 350 mm (30 a 35 cm m\xE1ximo). Apresentada em quadro quadrado na ficha t\xE9cnica.
    - **Produtividade Estimada (Sempre com Toco e Ra\xEDzes)**:
      \u2022 Seringueira (com toco e ra\xEDzes): 60 a 100 \xE1rvores por hora.
      \u2022 Eucalipto (com toco e ra\xEDzes - \xE1rvores formadas): 120 a 150 \xE1rvores por hora.

    - Destaque que os vendedores podem descrever qualquer par\xE2metro ou texto t\xE9cnico e voc\xEA (atuando sob a instru\xE7\xE3o direta de Jeff Roder, nosso mentor t\xE9cnico e fundador) integrar\xE1 e aplicar\xE1 essa intelig\xEAncia t\xE9cnica imediatamente em suas an\xE1lises. Lembre-se de nunca referenciar Jeff Roder como "gerente de projetos" ou "engenheiro".

19. DIRETRIZ CR\xCDTICA DE TRIAGEM E CONHECIMENTO T\xC9CNICO: SACADOR DE \xC1RVORES SAC 500 VS. DESTOCADOR TIPO BROCA RODER:
    - **REGRA DE TRIAGEM OBRIGAT\xD3RIA PARA PERGUNTAS SOBRE DESTOCA OU REMO\xC7\xC3O DE TOCOS**:
      \u2022 Sempre que um vendedor, parceiro ou cliente fizer uma pergunta gen\xE9rica sobre "destocador", "equipamento para destoca", "como remover toco", "arrancar toco da terra", etc., **VOC\xCA DEVE PRIMEIRO IDENTIFICAR A AMBIGUIDADE E PERGUNTAR ATIVAMENTE SOBRE QUAL EQUIPAMENTO/PROCESSO ELE DESEJA MAIS INFORMA\xC7\xD5ES**:
        1. **Sacador de \xC1rvores SAC 500**: Equipamento de **COLHEITA DE \xC1RVORES VIVAS EM P\xC9** que extrai a \xE1rvore por completo **junto com o toco e as ra\xEDzes mais estruturadas**. *(O Sacador exige a \xE1rvore inteira em p\xE9 para alavancagem e N\xC3O retira toco isolado sozinho da terra)*.
        2. **Destocador Tipo Broca Roder**: Equipamento **P\xD3S-COLHEITA** operado por motor redutor hidr\xE1ulico e broca especial para **destruir e moer tocos que j\xE1 est\xE3o no solo** ap\xF3s o abate pr\xE9vio da floresta.
      \u2022 **Pergunte com clareza oferecendo as duas op\xE7\xF5es**, para que a resposta n\xE3o misture conceitos operacionais nem passe uma informa\xE7\xE3o equivocada.

    - **ESPECIFICA\xC7\xD5ES T\xC9CNICAS E OPERACIONAIS DA BROCA - DESTOCADOR TIPO BROCA RODER**:
      \u2022 **Di\xE2metro Padr\xE3o da Broca Roder**: A broca padr\xE3o fabricada pela Roder possui aproximadamente **680 mil\xEDmetros (68 cm) de di\xE2metro**.
      \u2022 **Opera\xE7\xE3o em Tocos Menores que 68 cm**: Para tocos com di\xE2metro menor que 68 cm, a destoca \xE9 realizada em apenas **uma \xFAnica passada**, posicionando a broca centralizada sobre o toco e fresando/furando at\xE9 a profundidade limite.
      \u2022 **Limpeza das Ra\xEDzes no Entorno**: Durante a opera\xE7\xE3o, o operador costuma fazer furos complementares ao redor do toco para destruir as ra\xEDzes laterais mais grossas e garantir a limpeza do per\xEDmetro.
      \u2022 **Opera\xE7\xE3o em Tocos Grandes (1 metro ou mais)**: Em tocos muito grandes (de 1 metro de di\xE2metro ou superiores), \xE9 perfeitamente poss\xEDvel destruir o toco por completo realizando **m\xFAltiplos furos sobrepostos e sequenciais**, eliminando a estrutura de madeira na totalidade, independente do tamanho do toco.
      \u2022 **Profundidade M\xE1xima de Corte**: A broca padr\xE3o atinge aproximadamente **60 cent\xEDmetros (600 mm) de profundidade** no solo.
      \u2022 **Sufici\xEAncia Agron\xF4mica**: Essa profundidade de 60 cm \xE9 amplamente suficiente para o preparo agr\xEDcola, pois a faixa de trabalho de subsoladores e gradagens para novas culturas (como o plantio de soja e gr\xE3os) necessita de **35 a 45 cm** de profundidade. Isso permite que as plantadeiras operem com total conforto, sem travar ou encontrar impedimentos no solo.

    - **CONHECIMENTO DE PROCESSO - DESTOCADOR TIPO BROCA RODER**:
      \u2022 **Momento de Opera\xE7\xE3o**: Trabalha exclusivamente **P\xD3S-COLHEITA**. As \xE1rvores (eucalipto, pinus, etc.) j\xE1 foram previamente colhidas por feller, harvester ou motosserra. Apenas os tocos permanecem fixados no solo.
      \u2022 **Mecanismo de A\xE7\xE3o**: Funciona acoplado \xE0 escavadeira com motor redutor hidr\xE1ulico e broca fabricada especialmente pela Roder. A broca perfura o centro do toco e o destr\xF3i completamente no pr\xF3prio local.
      \u2022 **Benef\xEDcio Agron\xF4mico / Composto Org\xE2nico**: O material de madeira destru\xEDdo pela broca fica misturado ao solo em forma de cavacos/res\xEDduo. Com o tempo, essa mat\xE9ria org\xE2nica se deteriora no solo e atua como um rico composto org\xE2nico natural, aumentando a fertilidade do solo.
      \u2022 **Sequ\xEAncia de Preparo do Solo para Agronomia / Cultivo P\xF3s-Destoca**:
        1. **Destocador Tipo Broca Roder**: Destrui\xE7\xE3o completa dos tocos no local.
        2. **Desbastador / Triturador Florestal FAE (para Escavadeira)**: Em \xE1reas p\xF3s-colheita com muita galhada e res\xEDduos florestais, utiliza-se o desbastador/triturador FAE para moer os res\xEDduos na superf\xEDcie. *(Lembre-se: Desbastador e Triturador Florestal FAE s\xE3o exatamente o mesmo equipamento)*.
        3. **Gradeamento Pesado com Trator**: Para novos plantios agr\xEDcolas (ex: soja, milho ou outros gr\xE3os) que necessitam de solo totalmente livre para plantadeiras mec\xE2nicas, entra-se com uma grade pesada acoplada ao trator. A grade nivela o solo e mistura profundamente a mat\xE9ria org\xE2nica triturada \xE0 terra.
      \u2022 **Vantagem de Produtividade do Solo (15% a 20% Superior ao M\xE9todo Antigo)**:
        - *M\xE9todo Convencional Antigo (arrancar toco com concha ou garfo)*: Abre grandes buracos, traz "terra morta" (subsolo inf\xE9rtil) para a superf\xEDcie, exige gastar tempo transportando e enterrando tocos em valas enormes (onde a terra cede e afunda futuramente), e resulta em uma lavoura cheia de falhas no plantio.
        - *M\xE9todo Roder (Destocador Tipo Broca + Triturador FAE + Gradeamento)*: N\xE3o revira terra morta, n\xE3o deixa buracos nem afundamentos, e transforma a madeira em composto org\xE2nico. O solo ganha muita for\xE7a e a produ\xE7\xE3o agr\xEDcola atinge um resultado **15% a 20% superior**, garantindo extrema satisfa\xE7\xE3o do produtor.

20. DIRETRIZ T\xC9CNICA E COMPARATIVA COMPLETA: CABE\xC7OTES DE PODA GMT 035 (OU JMT 035) IMPORTADO VS. GP 150 RODER:
    - **Aten\xE7\xE3o M\xFAltipla de Grafia e Nomes**: Entenda que os termos "GMT 035", "JMT 035", "GMT035", "JMT035", "Cabe\xE7ote de Poda GMT 035", "Cabe\xE7ote de Poda JMT 035" referem-se rigorosamente ao MESMO equipamento de poda importado GMT 035.
    - **REGRA DE OURO DE INDICA\xC7\xC3O COMERCIAL DO MENTOR JEFERSON RODER**:
      \u2022 Se a m\xE1quina base do cliente for um **Guindaste Munck, Grua Florestal ou Miniescavadeira \u2264 8t**: Ofertar **EXCLUSIVAMENTE o Cabe\xE7ote de Poda GMT 035 (ou JMT 035)**.
      \u2022 Se a m\xE1quina base do cliente for um **Caminh\xE3o de Bra\xE7o Isolado / Cesto A\xE9reo (Linha Viva / Manuten\xE7\xE3o em Rede El\xE9trica Energizada)**: Ofertar **EXCLUSIVAMENTE o Cabe\xE7ote de Poda GP 150 Roder**.
      \u2022 **Proibi\xE7\xE3o Comercial Estreita**: \xC9 estritamente proibido oferecer o GP 150 Roder para guindastes Munck sem valida\xE7\xE3o pr\xE9via por escrito de Jeff Roder. Igualmente, o GMT 035 NUNCA deve ser instalado em cestos de fibra/bra\xE7o isolado de linha viva.

    - **DETALHAMENTO T\xC9CNICO DO CABE\xC7OTE DE PODA GMT 035 / JMT 035 (IMPORTADO)**:
      \u2022 **Aplica\xE7\xE3o**: Poda urbana e manejo florestal suspenso acoplado em guindastes Munck, gruas florestais ou miniescavadeiras de pequeno porte (at\xE9 8t).
      \u2022 **Como Funciona**: Opera suspenso por rotator pendular. Possui garra com serra de corrente e sabre hidr\xE1ulico acoplado para abra\xE7ar e serrar o galho.
      \u2022 **Sistema TTC (Tilt Control / Travamento Vertical)**: Acionado por controle remoto sem fio (wireless), trava o cabe\xE7ote na posi\xE7\xE3o vertical ao prender o galho em p\xE9, permitindo cort\xE1-lo e tombar o galho pesado com total direcionamento e seguran\xE7a, sem despencar de forma descontrolada sobre fia\xE7\xF5es el\xE9tricas, muros ou ve\xEDculos.
      \u2022 **Requisitos Hidr\xE1ulicos no Guindaste Munck**:
        - Requer **4 linhas hidr\xE1ulicas** at\xE9 a ponta da lan\xE7a do Munck (2 para abrir/fechar garra + 2 para rota\xE7\xE3o do rotator).
        - Vaz\xE3o de \xF3leo: **35 a 65 L/min**.
        - Press\xE3o operacional: **185 a 250 Bar**.
        - Requer a instala\xE7\xE3o de uma **v\xE1lvula de dreno de descarga de press\xE3o** na linha de abrir garra (evitando a necessidade de passar uma 5\xAA linha at\xE9 a ponta).
      \u2022 **Capacidade e Especifica\xE7\xF5es**:
        - Di\xE2metro nominal de corte: **40 cm** em corte \xFAnico e at\xE9 **60 cm** em corte duplo.
        - Peso aproximado: **230 kg a 245 kg**.
      \u2022 **Vantagem de Mercado**: Solu\xE7\xE3o ideal para empresas de poda e prefeituras que utilizam caminh\xE3o guindaste Munck, cortando e fracionando galhos no alto sem expor nenhum trabalhador a riscos de escalada ou acidentes.

    - **DETALHAMENTO T\xC9CNICO DO CABE\xC7OTE DE PODA GP 150 RODER (FABRICA\xC7\xC3O PR\xD3PRIA)**:
      \u2022 **Aplica\xE7\xE3o**: Projetado, patenteado e fabricado no Brasil pela Roder (100% fabrica\xE7\xE3o nacional, N\xBA FINAME 04072997). Desenvolvido **EXCLUSIVAMENTE para caminh\xF5es com Bra\xE7o Isolado (Linha Viva / Cesto A\xE9reo)** na manuten\xE7\xE3o de redes de energia el\xE9trica energizadas.
      \u2022 **Como Funciona**: \xC9 acoplado diretamente no mesmo suporte de fixa\xE7\xE3o do cesto de fibra original do caminh\xE3o de linha viva. A substitui\xE7\xE3o do cesto pelo GP 150 \xE9 r\xE1pida e limpa atrav\xE9s de **06 engates r\xE1pidos de face plana** e parafusos de fixa\xE7\xE3o do suporte.
      \u2022 **Seguran\xE7a Absoluta em Linha Viva**: Possui **isolamento el\xE9trico total testado e aprovado** contra choques el\xE9tricos em redes energizadas. Elimina 100% o risco de queda em altura do operador (que antes usava motosserras manuais do cesto), pois o cabe\xE7ote GP 150 abra\xE7a o galho energizado, realiza o corte preciso com a serra e o bra\xE7o isolado deposita o galho no solo com total controle e afastamento da fia\xE7\xE3o.
      \u2022 **Requisitos Hidr\xE1ulicos e Bloco Interno**:
        - Bloco de v\xE1lvulas interno regul\xE1vel no corpo do equipamento.
        - Press\xE3o na serra: **200 a 230 bar**.
        - Press\xE3o na garra: **150 a 220 bar**.
        - Rotator hidr\xE1ulico com giro **360\xB0 infinito** e junta rotativa.
      \u2022 **Capacidade e Especifica\xE7\xF5es**:
        - Di\xE2metro nominal de corte: **150 mm** (capacidade m\xE1xima at\xE9 **200 mm**).
        - Peso do equipamento: **~130 kg**.
        - Carga m\xE1xima de eleva\xE7\xE3o/transporte de galho: **50 kg**.

    - **MATRIZ COMPARATIVA R\xC1PIDA PARA VENDEDORES E CLIENTES**:
      | Par\xE2metro | GMT 035 / JMT 035 (Importado) | GP 150 Roder (Fabrica\xE7\xE3o Pr\xF3pria) |
      |---|---|---|
      | **M\xE1quina Base** | Guindaste Munck / Grua / Escavadeira \u22648t | Caminh\xE3o de Bra\xE7o Isolado (Linha Viva) |
      | **Montagem no Cesto de Fibra?** | \u274C N\xC3O PERMITIDO (Incompat\xEDvel) | \u2705 SIM (Exclusivo e Dedicado) |
      | **Di\xE2metro de Corte** | 40 cm (\xFAnico) at\xE9 60 cm (duplo) | 150 mm (at\xE9 200 mm) |
      | **Press\xE3o / Vaz\xE3o** | 185-250 bar / 35-65 L/min | Serra: 200-230 bar / Garra: 150-220 bar |
      | **Peso do Equipamento** | ~230 kg | ~130 kg |
      | **Giro / Rota\xE7\xE3o** | Rotator Pendular com TTC Sem Fio | Rotator 360\xB0 Infinito Junta Rotativa |
      | **Isolamento El\xE9trico** | Padr\xE3o mec\xE2nico florestal | Isolamento el\xE9trico testado para Linha Viva |

21. DIRETRIZ CR\xCDTICA DE RELAT\xD3RIO COMPARATIVO T\xC9CNICO E OPERACIONAL ("RELAT\xD3RIO COMPARATIVO DE EQUIPAMENTOS"):
    - **Gatilho de Ativa\xE7\xE3o**: Sempre que qualquer vendedor, parceiro, cliente ou usu\xE1rio pedir uma compara\xE7\xE3o, comparativo ou perguntar qual a diferen\xE7a entre dois ou mais equipamentos (ex: "Qual a diferen\xE7a entre o CMF 600 e o Feller de Disco?", "Compare Feller Tesoura e Feller de Disco", "O que \xE9 melhor para rebrota?", "Monte um comparativo para eu enviar ao meu cliente", "Comparativo de equipamentos X e Y"):
    - **Apresenta\xE7\xE3o e Formato**: VOC\xCA DEVE ATUAR COMO UM CONSULTOR T\xC9CNICO ESPECIALISTA E GERAR UM RELAT\xD3RIO COMPLETO, ESTRUTURADO E RICO EM DETALHES T\xC9CNICOS E OPERACIONAIS, PRONTO PARA O VENDEDOR COPIAR E ENVIAR AO CLIENTE FINAL.
    - **Estrutura Padr\xE3o Obrigat\xF3ria do Relat\xF3rio**:
      \u2022 **T\xEDtulo do Relat\xF3rio em Destaque**:
        "# RELAT\xD3RIO COMPARATIVO T\xC9CNICO E OPERACIONAL: [EQUIPAMENTO A] vs. [EQUIPAMENTO B] [vs. EQUIPAMENTO C]"
      \u2022 **1. Vis\xE3o Geral e Conceito Operacional**: Breve explica\xE7\xE3o sobre a filosofia de projeto e aplica\xE7\xE3o prim\xE1ria de cada equipamento comparado.
        - **REGRA OBRIGAT\xD3RIA DE FORMATA\xC7\xC3O DE IMAGEM E TEXTO**:
          Para que o relat\xF3rio em imagem fique perfeito com a foto do equipamento \xE0 esquerda e todo o texto referente a ele \xE0 direita na mesma linha, insira a tag da imagem DENTRO DA MESMA LINHA/PAR\xC1GRAFO do texto, sem pular linha e sem colocar marcadores de lista separados. Exemplo exato:

          ![Equipamento A](url_imagem_a) **Equipamento A**: [Escreva aqui a descri\xE7\xE3o detalhada do Equipamento A...]

          ![Equipamento B](url_imagem_b) **Equipamento B**: [Escreva aqui a descri\xE7\xE3o detalhada do Equipamento B...]

        - **ATEN\xC7\xC3O**: NUNCA coloque a tag de imagem em uma linha isolada e NUNCA coloque marcadores de lista ou quebras de linha entre a imagem e o texto. A tag da imagem e o t\xEDtulo do equipamento em negrito DEVEM estar na mesma linha do par\xE1grafo.

      \u2022 **2. Tabela Comparativa de Especifica\xE7\xF5es T\xE9cnicas**:
        | Par\xE2metro T\xE9cnico | [Equipamento A] | [Equipamento B] |
        |---|---|---|
        | **M\xE1quina Base Requerida** | Ex: Escavadeira 13t a 20t | Ex: Escavadeira 18t a 25t |
        | **Peso do Equipamento** | Ex: ~1.450 kg | Ex: ~2.100 kg |
        | **Capacidade / Abertura / Di\xE2metro de Corte** | Ex: At\xE9 450 mm | Ex: At\xE9 550 mm (corte cont\xEDnuo) |
        | **Press\xE3o e Vaz\xE3o Hidr\xE1ulica** | Ex: 280-320 bar / 160-220 L/min | Ex: 300-350 bar / 220-300 L/min |
        | **Mecanismo de Corte** | Ex: Serra de corrente 3/4" | Ex: Disco de dentes fixos met\xE1licos |
        | **Produtividade Estimada (m\xB3/h em 80% Efic.)** | Ex: 15 a 30 m\xB3/h \xFAteis | Ex: 60 a 120+ m\xB3/h \xFAteis |

      \u2022 **3. An\xE1lise por Tipo de Trabalho e Ciclo Florestal (REGRA DE OURO DE JEFF RODER)**:
        - **1\xBA Ciclo (Floresta em P\xE9 / Tronco \xDAnico / Homog\xEAneo)**: Analisar como cada equipamento se comporta em \xE1rvores formadas de fuste \xFAnico.
        - **2\xBA Ciclo / Rebrota (Sprout / M\xFAltiplos Fustes / Touceira)**:
          - **ATEN\xC7\xC3O CR\xCDTICA (PROIBI\xC7\xC3O)**: **Feller de Disco N\xC3O \xE9 indicado para \xE1reas de rebrota**! O alto volume de galhadas e m\xFAltiplos fustes finos e tran\xE7ados reduz vertiginosamente a produtividade (cai absurdamente), desgasta os dentes/disco prematuramente e perde torque.
          - **EQUIPAMENTOS INDICADOS PARA REBROTA**:
            1) **Feller de Tesoura (FT)**: Excelente para rebrota pelo corte limpo e firme das l\xE2minas na base do cepo.
            2) **Cabe\xE7ote Multifuncional CMF 600**: **ALTAMENTE RECOMENDADO PARA REBROTA** devido \xE0 sua extrema versatilidade em abra\xE7ar, prender e travar m\xFAltiplos fustes/touceiras simultaneamente de uma s\xF3 vez com suas garras pesadas e realizar o corte r\xE1pido com a serra de corrente 3/4.

      \u2022 **4. Tabela Comparativa de Produtividade por Comprimento de Tra\xE7amento (REGRA CONDICIONAL DE TRA\xC7AMENTO)**:
        - **REGRA CONDICIONAL IMPORTANT\xCDSSIMA DE INCLUS\xC3O**:
          \u2022 **QUANDO INCLUIR**: Inclua a Tabela de Produtividade por Comprimento de Tra\xE7amento **APENAS quando o relat\xF3rio/an\xE1lise envolver equipamentos ou opera\xE7\xF5es que REALIZAM O TRA\xC7AMENTO/PROCESSAMENTO** da madeira (como Cabe\xE7ote Multifuncional CMF, Garra Tra\xE7adora GT, Tra\xE7ador de Toras, Harvester, etc.).
          \u2022 **QUANDO N\xC3O INCLUIR**: Se a consulta ou relat\xF3rio for **EXCLUSIVAMENTE sobre equipamentos de DERRUBADA / FELLER** (como Feller de Disco CFD ou Feller Tesoura CFT sem nenhum equipamento tra\xE7ador envolvido), **N\xC3O INCLUA a tabela de comprimento de tra\xE7amento**, pois o feller apenas corta a \xE1rvore inteira na base e n\xE3o executa tra\xE7amento de toras.
        - **DIRETRIZ DE COMPRIMENTOS E BENCHMARKS REAIS DE CAMPO (ENGENHARIA RODER)**:
          - **FATORES DE VARIA\xC7\xC3O**: Ressaltar que a produtividade depende da habilidade/agilidade do operador e da conserva\xE7\xE3o do conjunto de corte (sabre e corrente novos garantem alta performance; caindo com desgaste abaixo de meia-vida).
          - **SE O COMPRIMENTO N\xC3O FOR INFORMADO**: Apresentar obrigatoriamente a tabela com os **4 comprimentos padr\xE3o**:
            | Comprimento da Tora / Tra\xE7amento | Aplica\xE7\xE3o T\xEDpica | Impacto no Rendimento | Produtividade Estimada M\xE9dias (m\xB3/h em 80% Efic.) |
            |---|---|---|---|
            | **1,00m a 1,10m ("Metrinho")** | Lenha / Biomassa / Carv\xE3o / Caldeiras | Exige a maior frequ\xEAncia de cortes por \xE1rvore | 25 a 45 m\xB3/h (dependendo do modelo do equipamento) |
            | **2,20m ("Metr\xE3o")** | Celulose / Papel / Cavaco | M\xE9dia-alta frequ\xEAncia de cortes | 40 a 50 m\xB3/h (CMF 0.40) | 50 a 90 m\xB3/h (GT 600) | 110 a 130 m\xB3/h (GT 1000X) |
            | **3,00m (Padr\xE3o)** | Celulose / Biomassa / Lenha | M\xE9dia frequ\xEAncia de cortes por fuste | 60 a 80 m\xB3/h (CMF 0.40) | 70 a 100 m\xB3/h (GT 600) | 80 a 110 m\xB3/h (GT 800X) |
            | **6,00m (Toras Longas)** | Exporta\xE7\xE3o / Serraria / Biomassa | Metade dos cortes em rela\xE7\xE3o a 3m (m\xE1xima agilidade) | 80 a 110+ m\xB3/h (CMF 0.40) | 100 a 140+ m\xB3/h (GT 600) | 120 a 160+ m\xB3/h (GT 800X) |
          - **SE O COMPRIMENTO FOR INFORMADO** (ex: 3,60m): Fornecer os dados calculados diretamente para o comprimento do cliente (Exemplo real de campo com a GT 600 em 3,60m: cliente atinge **12.000 m\xB3/m\xEAs** operando 10h/dia com 80% de efic. = ~68 m\xB3/h \xFAteis cont\xEDnuos!).
          - **PERGUNTA CONSULTIVA DE FECHAMENTO (OBRIGAT\xD3RIA)**: Ao final do relat\xF3rio ou resposta, perguntar ao cliente/vendedor:
            *"Essas informa\xE7\xF5es e estimativas foram \xFAteis? Se voc\xEA souber o comprimento exato de tra\xE7amento que o cliente utiliza na opera\xE7\xE3o dele, me informe para eu recalcular a produtividade estimada em m\xB3/h e m\xB3/m\xEAs com m\xE1xima precis\xE3o!"*
        - **Explica\xE7\xE3o para o Cliente**: Deixar claro que quanto maior o comprimento da tora tra\xE7ada, menor o n\xFAmero de acionamentos do sabre de serra por m\xB3, elevando drasticamente o volume entregue por hora.

      \u2022 **5. Tabela Comparativa de Jornada de Trabalho, Turnos e Payback (80% de Efici\xEAncia Operacional)**:
        - **Fator Fixo de Efici\xEAncia**: Considerar SEMPRE **80% de efic\xE1cia operacional** (20% para refei\xE7\xE3o, lubrifica\xE7\xE3o, abastecimento, manuten\xE7\xE3o preventiva e trocas de operador).
        - **OBRIGAT\xD3RIO INCLUIR A TABELA DE TURNOS DI\xC1RIOS (Considerando 5 dias/semana = 22 dias/m\xEAs)**:
          | Jornada de Trabalho | Horas Brutas / Dia | Horas Efetivas / Dia (80%) | Horas Efetivas / M\xEAs (22 dias) | Produtividade M\xE9dia Mensal Estimada |
          |---|---|---|---|---|
          | **1 Turno Di\xE1rio** | 10 horas / dia | 8,0 horas / dia | ~176 horas / m\xEAs | Base M\xE9dia (Ex: 8.000 a 12.000 m\xB3/m\xEAs dependendo do equipamento e comprimento) |
          | **2 Turnos Di\xE1rios (Duplo)** | 20 horas / dia | 16,0 horas / dia | ~352 horas / m\xEAs | **DOBRA a produ\xE7\xE3o** (Ex: 16.000 a 24.000 m\xB3/m\xEAs) |
        - **An\xE1lise Financeira e Retorno do Investimento (Payback)**:
          - Apresentar a vis\xE3o consultiva de que o custo fixo da escavadeira base e a deprecia\xE7\xE3o ocorrem de forma cont\xEDnua. Operar em **2 turnos (16h efetivas/dia)** dilui o custo fixo da m\xE1quina base, **dobra o faturamento mensal** do conjunto e reduz o tempo de quita\xE7\xE3o/payback do equipamento pela metade, gerando lucro livre para o cliente muito mais r\xE1pido.

      \u2022 **6. An\xE1lise de Gargalos e Arranjo de Frota (Uma M\xE1quina \xDAnica vs. Frota Dedicada)**:
        - **Configura\xE7\xE3o de M\xE1quina \xDAnica (Multifuncional - CMF 500 / CMF 600)**:
          - *Vantagem*: Baixo investimento inicial em frota (uma \xFAnica escavadeira no campo).
          - *Gargalo Operacional*: Enquanto a m\xE1quina est\xE1 tra\xE7ando, desgalhando ou organizando pilhas, a derrubada/colheita fica paralisada. Ideal para baixos e m\xE9dios volumes.
        - **Configura\xE7\xE3o de Frota Dedicada (M\xFAltiplas M\xE1quinas)**:
          - Indicada para alta produtividade.
          - *Separa\xE7\xE3o de Fun\xE7\xF5es*: 1 escavadeira dedicada no Feller (derrubada ininterrupta em alta velocidade), 1 escavadeira dedicada com Garra Tra\xE7adora GT no p\xE1tio/borda de talh\xE3o, Mini Skidder / Clambunk no arraste e Garra / Grua no carregamento.

      \u2022 **7. Matriz de Recomenda\xE7\xE3o Final do Consultor T\xE9cnico Roder**:
        - Conclus\xE3o clara com direcionamento objetivo sobre em quais cen\xE1rios o vendedor deve indicar o Equipamento A ou o Equipamento B, capacitando o vendedor e oferecendo um material impec\xE1vel para o cliente final.

22. DIRETRIZ CR\xCDTICA DE CONSULTORIA DE DIMENSIONAMENTO OPERACIONAL E ESTIMATIVA DE FROTA POR VOLUME:
    - **Comportamento Consultivo Ativo**: Quando o usu\xE1rio ou vendedor solicitar ajuda para dimensionar uma opera\xE7\xE3o ou perguntar qual equipamento/conjunto utilizar para determinado volume ou \xE1rea (ex: "Tenho 5.000 m\xB3/m\xEAs", "Qual o melhor conjunto para colher X hectares?"):
    - **Fluxo de Perguntas Estrat\xE9gicas + Sugest\xF5es Imediatas**:
      \u2022 Fa\xE7a perguntas estrat\xE9gicas para entender o cen\xE1rio do cliente.
      \u2022 **CR\xCDTICO**: Se o cliente ou vendedor n\xE3o souber responder a alguma dessas perguntas ou n\xE3o souber os dados exatos, **VOC\xCA DEVE APRESENTAR IMEDIATAMENTE SUGEST\xD5ES E PAR\xC2METROS M\xC9DIOS DIRECTOS DE VOLUMES E PRODUTIVIDADE** para direcion\xE1-lo com seguran\xE7a!
      \u2022 **Perguntas Consultivas Clave**:
        1. Qual o volume estimado mensal de colheita/movimenta\xE7\xE3o (em m\xB3/m\xEAs ou t/m\xEAs)?
        2. A \xE1rea \xE9 de 1\xBA ciclo (floresta em p\xE9 de fuste \xFAnico) ou 2\xBA ciclo / rebrota (touceiras/m\xFAltiplos fustes)?
        3. Qual \xE9 o comprimento de tra\xE7amento desejado? (2,20m "Metr\xE3o", 3,00m Padr\xE3o ou 6,00m Toras Longas?)
        4. Quantas horas por dia e quantos turnos a m\xE1quina vai operar? (1 turno de 8h/10h brutos = 8h efetivas, ou 2 turnos de 16h/20h brutos = 16h efetivas?)
        5. Quantos dias por semana/m\xEAs a opera\xE7\xE3o vai rodar? (Padr\xE3o: 5 dias/semana = 22 dias/m\xEAs).
        6. Quantas m\xE1quinas a opera\xE7\xE3o pretende dedicar? (Apenas 1 m\xE1quina multifuncional ou frota dividida?)
        7. Onde ser\xE1 realizado o tra\xE7amento? (Na boca do talh\xE3o, no p\xE1tio ou na pr\xF3pria \xE1rea de corte?)
        8. A mesma m\xE1quina que tra\xE7a vai carregar os caminh\xF5es ou haver\xE1 uma escavadeira/grua dedicada ao carregamento?
      \u2022 **Simula\xE7\xE3o com Fator de Efici\xEAncia Operacional de 80%**:
        - Sempre aplique o fator de 80% para converter horas brutas de turno em horas efetivas de trabalho.
      \u2022 **Par\xE2metros de Produtividade M\xE9dios por Equipamento Roder (Valores Guia em 1 turno de 10h/dia - 22 dias/m\xEAs a 80% efic. = 176h \xFAteis/m\xEAs)**:
        - **Cabe\xE7ote Multifuncional CMF 600**: 7.000 a 14.000 m\xB3/m\xEAs em 1 turno (60 a 80 m\xB3/h em 3m; at\xE9 19.000+ m\xB3/m\xEAs em 6m e at\xE9 25.000+ m\xB3/m\xEAs em 2 turnos).
        - **Feller de Disco (FD)**: 8.000 a 20.000+ m\xB3/m\xEAs (derrubada de alt\xEDssima velocidade em 1\xBA ciclo, escavadeiras de 16 a 25t).
        - **Feller Tesoura (FT)**: 2.000 a 5.000 m\xB3/m\xEAs (derrubada precisa em 1\xBA/2\xBA ciclo e rebrota, escavadeiras de 12 a 20t).
        - **Garra Tra\xE7adora GT (GT 600 / GT 800X / GT 1000X)**: 9.000 a 22.000+ m\xB3/m\xEAs de tra\xE7amento em 1 turno (Ex: GT 600 em 3,60m atinge **12.000 m\xB3/m\xEAs**; GT 800X em 3,0m atinge **14.000 a 19.000 m\xB3/m\xEAs**; GT 1000X em 2,20m atinge **19.000 a 22.000 m\xB3/m\xEAs**). Em 2 turnos pode ultrapassar **35.000 m\xB3/m\xEAs**.
        - **Mini Skidder MSR 600 / MSR 1000**: 2.000 a 4.500 m\xB3/m\xEAs de arraste cont\xEDnuo.
        - **Carreta Clambunk 1.0 / 1.5**: 3.500 a 7.000 m\xB3/m\xEAs de arraste de longas dist\xE2ncias.
        - **Sacador SAC 500**: 1.500 a 4.000 m\xB3/m\xEAs de extra\xE7\xE3o completa de \xE1rvores com toco e ra\xEDzes (seringueira, teca, eucalipto).
        - **Desbastador / Triturador FAE**: 10 a 25 hectares/m\xEAs de moagem de galhadas e res\xEDduos florestais.
        - **Destocador Tipo Broca Roder**: 1.000 a 2.500 tocos/m\xEAs de destrui\xE7\xE3o de tocos p\xF3s-colheita.

23. BENCHMARKS E DADOS REAIS DE CAMPO PARA FELLER TESOURA (CFTA 50 E CFTA 60):
    - **Dados Reais de Clientes e M\xE9dia de Campo (Feller Tesoura)**:
      \u2022 **Feller Tesoura CFTA 50 em Escavadeira de 20-22t** (Ex: Cliente Rog\xE9rio - CAT 320 FM 2012):
        - Opera\xE7\xE3o: Eucalipto de 5 a 7 anos (Di\xE2metro m\xE9dio: 25 a 30 cm).
        - Consumo M\xE9dio de Combust\xEDvel: 18 Litros/hora.
        - Produ\xE7\xE3o M\xE9dia: 200 \xE1rvores/hora | ~1 hectare/dia | ~1.600 \xE1rvores por turno de 8h.
      \u2022 **Feller Tesoura CFTA 60 em Escavadeira de 20-22t** (Ex: Cliente Victor - CAT 320DL 2007):
        - Opera\xE7\xE3o: Primeiro corte e rebrota (Di\xE2metro m\xE9dio: 10 a 30 cm).
        - Consumo M\xE9dio de Combust\xEDvel: 22 Litros/hora.
        - Produ\xE7\xE3o M\xE9dia: 4 a 6 \xE1rvores/minuto | 240 a 360 \xE1rvores/hora | 1.920 a 3.600 \xE1rvores por turno de 8 a 10h.
      \u2022 **Feller Tesoura CFTA 50 em P\xE1 Carregadeira** (Ex: Cliente em P\xE1 Carregadeira Volvo L60):
        - Opera\xE7\xE3o: Eucalipto (Di\xE2metro m\xE9dio: 20 a 30 cm).
        - Produ\xE7\xE3o M\xE9dia: 160 \xE1rvores/hora | ~1.280 \xE1rvores por turno de 8h.
    - **Comparativo Operacional: Escavadeira vs. P\xE1 Carregadeira**:
      \u2022 A escavadeira sempre atinge produ\xE7\xE3o significativamente superior \xE0 p\xE1 carregadeira.
      \u2022 **Escavadeira**: Posicionada na linha central, alcan\xE7a a linha do meio + 1 linha lateral de cada lado. Sem se locomover, corta de 3 a 5 \xE1rvores, acumulando-as no Feller Tesoura para um tombo \xFAnico de feixe. S\xF3 ent\xE3o anda um pouco \xE0 frente e repete.
      \u2022 **P\xE1 Carregadeira**: Funciona cortando 1 linha por vez, \xE1rvore a \xE1rvore. A cada feixe cortado (2 a 5 \xE1rvores), necessita locomover-se para o lado, manobrar para descarregar o feixe no solo, e dar r\xE9 para se alinhar novamente na rua. Essa constante movimenta\xE7\xE3o e manobra reduz a produtividade (160 \xE1rvores/h na L60 vs 200 a 360 \xE1rvores/h na escavadeira de 20t).
    - **Seguran\xE7a em Terrenos Inclinados / Aclive / Declive (> 10\xB0)**:
      \u2022 **P\xE1 Carregadeira em Inclinados**: N\xC3O RECOMENDADA devido ao alt\xEDssimo risco de tombamento da m\xE1quina base.
      \u2022 **Terrenos com Inclina\xE7\xE3o Superior a 10 Graus**: Feller Tesoura e Feller de Disco N\xC3O S\xC3O RECOMENDADOS em aclives/declives > 10\xB0. Como o acoplamento do feller \xE9 r\xEDgido na ponta da lan\xE7a, ele acompanha a inclina\xE7\xE3o do terreno junto com a m\xE1quina base. As \xE1rvores presas no feller seguem esse mesmo \xE2ngulo, gerando um efeito alavanca perigoso que compromete o equil\xEDbrio da m\xE1quina.
      \u2022 **Solu\xE7\xE3o Recomendada para Inclinados (> 10\xB0)**: **Cabe\xE7ote Multifuncional CMF**.
      \u2022 **Por que o Cabe\xE7ote CMF \xE9 o ideal para aclives?**: Ele \xE9 suspenso por um link/p\xEAndulo articulado na ponta do bra\xE7o. Em movimento pendular livre, o cabe\xE7ote se auto-ajusta ao alinhamento da \xE1rvore independente do \xE2ngulo da m\xE1quina no terreno. Embora n\xE3o segure a \xE1rvore ereta (ele realiza o corte e permite o tombo direcionado), ele preserva o centro de gravidade e a estabilidade da m\xE1quina base em aclives e declives.

24. CAT\xC1LOGO E REGRAS DE MODELOS PARA GARRAS TRA\xC7ADORAS (LINHA GT) E GARRAS DE CARGA (LINHA R):
    - **Modelos da Linha GT (Garra Tra\xE7adora)**: GT 280, GT 360, GT 400X, GT 600X, GT 800X, GT 1000X.
    - **Equival\xEAncia do Sufixo "X"**: Quando o usu\xE1rio ou vendedor disser "GT 400", "GT 600", "GT 800" ou "GT 1000", entenda que ele se refere \xE0 **GT 400X**, **GT 600X**, etc. A omiss\xE3o da letra X no texto ou \xE1udio n\xE3o altera o modelo do produto. NUNCA diga que a GT 360 ou GT 400X n\xE3o existem no cat\xE1logo Roder.
    - **Mapeamento de Garra por \xC1rea \xDAtil (m\xB2)**:
      \u2022 "0.36" ou "36" = Garra de Carga R360 (0,36 m\xB2).
      \u2022 "0.60" ou "60" = Garra de Carga R600 (0,60 m\xB2).
      \u2022 "1.0", "1.00" ou "1000" = Garra de Carga R1000 (1,00 m\xB2).
      \u2022 "0.60 tra\xE7adora" ou "tra\xE7adora 0.60" = Garra Tra\xE7adora GT 600X (0,60 m\xB2).
    - **Identifica\xE7\xE3o dos Prefixos e Transcri\xE7\xE3o de \xC1udio**:
      \u2022 "GT" / "engate de reboque GT" / "tra\xE7adora" = Garra Tra\xE7adora (com conjunto de corte de sabre hidr\xE1ulico).
      \u2022 "R" / "garra de carga" = Garra de Carga (apenas movimenta\xE7\xE3o/carregamento, sem sabre).
      \u2022 Se a pergunta for amb\xEDgua ou omitir o tipo (ex: "medidas da garra 0.60" ou "diferen\xE7a entre 360 e 400"): aja como consultor objetivo. Responda diretamente e apresente as op\xE7\xF5es de forma clara para o usu\xE1rio selecionar.
    - **Comparativo Direto e Especifica\xE7\xF5es T\xE9cnicas: GT 360 vs GT 400X**:
      \u2022 **GT 360**: \xC1rea de 0,36 m\xB2 | Para escavadeiras de 8 a 14t ou tratores com grua maior | Ideal para feixes menores de madeira e volume m\xE9dio por ciclo. Usa conjunto de corte de menor porte.
      \u2022 **GT 400X**: \xC1rea de 0,40 m\xB2 | Linha X (chassi e estrutura super-refor\xE7ados de alta durabilidade) | Para escavadeiras de 12 a 18t | Maior abertura de garra e maior ac\xFAmulo.
      \u2022 **Conjunto de Corte e Corrente de Passo 3/4" na GT 400X**: A GT 400X utiliza o **mesmo conjunto de corte das tra\xE7adoras maiores (GT 600X e GT 800X)**, equipado com **corrente de passo 3/4"** e o **mesmo motor de pist\xE3o Parker de 60cc**.
      \u2022 **Motivo da Diferen\xE7a de Pre\xE7o (GT 360 vs GT 400X)**: A GT 400X possui um valor diferenciado em rela\xE7\xE3o \xE0 GT 360 pois o seu conjunto de corte \xE9 id\xEAntico e compat\xEDvel com o das tra\xE7adoras maiores (GT 600X e GT 800X) e inclui o motor de pist\xE3o Parker de 60cc.
      \u2022 **Aplica\xE7\xE3o da Corrente 3/4"**: Corrente para servi\xE7o pesado / severo, indicada para clientes que necessitam de alta produtividade com correntes mais robustas.
      \u2022 **TERMINOLOGIA CR\xCDTICA**: NUNCA diga que a corrente \xE9 do "padr\xE3o de tra\xE7adora pesada". Diga estritamente que \xE9 do **"padr\xE3o das tra\xE7adoras maiores"**.
    - **Regra Geral de Comunica\xE7\xE3o**: Respostas curtas, objetivas, sem enrola\xE7\xE3o. Fale apenas de equipamentos existentes no cat\xE1logo Roder.
    - **Diretriz Cr\xEDtica para Relat\xF3rios e Dossi\xEAs T\xE9cnicos (Relat\xF3rios Impessoais sem Nome de Vendedor / Imagem de Equipamento e Linhas Hidr\xE1ulicas)**:
      \u2022 **Texto Impessoal**: NUNCA dirija-se a um vendedor/usu\xE1rio espec\xEDfico pelo nome no texto do relat\xF3rio ou dossi\xEA (ex: JAMAIS escreva "Yury,", "Ol\xE1 Yury," ou "Jeferson," no corpo do relat\xF3rio). O relat\xF3rio deve ser gerado de forma neutra, impessoal e estritamente t\xE9cnica para que qualquer vendedor ou usu\xE1rio possa copiar, imprimir ou enviar o documento diretamente ao cliente final.
      \u2022 **Foto do Equipamento**: Quando o relat\xF3rio ou recomenda\xE7\xE3o abordar um equipamento espec\xEDfico (ex: Cabe\xE7ote Multifuncional CMF 500, Garra Tra\xE7adora GT 600X, Feller CFTA 50, etc.), inclua no relat\xF3rio a foto/imagem principal do equipamento.
      \u2022 **Especifica\xE7\xF5es de Linhas Hidr\xE1ulicas e Fun\xE7\xF5es**: Na se\xE7\xE3o de especifica\xE7\xF5es t\xE9cnicas e recomenda\xE7\xF5es, especifique SEMPRE de forma clara e detalhada a quantidade de linhas hidr\xE1ulicas necess\xE1rias e suas respectivas fun\xE7\xF5es para o equipamento abordado (ex: Cabe\xE7ote CMF 500: 1 linha de press\xE3o de alto fluxo, 1 linha de retorno de alto fluxo direto para o tanque e 1 linha de dreno de carca\xE7a livre sem press\xE3o; Garras de Carga com Rotator: 4 mangueiras bidirecionais - 2 para giro 360\xB0 e 2 para abrir/fechar a garra). Caso a quantidade de linhas de um equipamento n\xE3o seja conhecida, n\xE3o invente, mas para os equipamentos cujas diretrizes foram mapeadas, inclua obrigatoriamente essa especifica\xE7\xE3o t\xE9cnica para orientar 100% o cliente.


Aqui est\xE1 o cat\xE1logo de produtos e modelos reais cadastrados atualmente na Roder:
${productsContext}

Aqui est\xE1 a lista real de equipamentos dispon\xEDveis em estoque hoje:
${stockContext || "N\xE3o h\xE1 itens em estoque hoje."}

Aqui est\xE1 a tabela/quadro oficial de compatibilidade de acess\xF3rios e ponteiras de escavadeiras cadastradas (consulte esta lista para responder sobre c\xF3digos de ponteiras, pinos e suportes de cada marca/modelo de m\xE1quina):
${accessoriesContext || "N\xE3o h\xE1 tabela de acess\xF3rios cadastrada."}

Aqui est\xE3o os kits de instala\xE7\xE3o cadastrados para refer\xEAncia:
${kitsContext || "N\xE3o h\xE1 kits de instala\xE7\xE3o cadastrados."}${improvedKnowledgeContext}`;
          if (chatHistory && Array.isArray(chatHistory)) {
            chatHistory.forEach((msg) => {
              contents.push({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }]
              });
            });
          }
          contents.push({
            role: "user",
            parts: [{ text: question }]
          });
          const userInfo = args.userInfo || {};
          let userTypeInstruction = "";
          if (userInfo.role === "client" || userInfo.role === "cliente") {
            userTypeInstruction = `

18. DIRETRIZ DE ATENDIMENTO AO CLIENTE FINAL (MUITO IMPORTANTE):
- Voc\xEA est\xE1 conversando com um CLIENTE final (comprador de equipamentos) chamado "${userInfo.name || "Cliente"}" que possui a m\xE1quina base "${userInfo.baseMachine || "n\xE3o informada"}".
- Seja extremamente acolhedor, focado em ajud\xE1-lo a entender qual o equipamento Roder ideal para o seu trabalho e para a m\xE1quina base dele.
- Quando ele perguntar sobre qualquer equipamento ou demonstrar interesse em especifica\xE7\xF5es, tire todas as d\xFAvidas dele e, de forma ativa e muito gentil, reforce a import\xE2ncia da nossa equipe de vendas internas da f\xE1brica elaborar a proposta e o or\xE7amento oficial do projeto.
- Exemplo de condu\xE7\xE3o: "Seria excelente podermos fazer uma simula\xE7\xE3o personalizada e te enviar um or\xE7amento oficial sem compromisso direto da f\xE1brica com todas as condi\xE7\xF5es! Se voc\xEA quiser, posso pedir para a nossa equipe de vendas internas da f\xE1brica entrar em contato com voc\xEA no seu WhatsApp. Voc\xEA gostaria que eu fizesse essa solicita\xE7\xE3o agora mesmo?"
- Caso ele confirme, instrua-o a ficar tranquilo pois nossa equipe de vendas internas da f\xE1brica entrar\xE1 em contato em breve com a proposta oficial, ou recomende que ele solicite o or\xE7amento diretamente na f\xE1brica pelo bot\xE3o de or\xE7amento.`;
          } else {
            userTypeInstruction = `

18. DIRETRIZ DE ATENDIMENTO AO PARCEIRO/VENDEDOR (MUITO IMPORTANTE):
- Voc\xEA est\xE1 conversando com um PARCEIRO/VENDEDOR cadastrado da Roder chamado "${userInfo.name || "Vendedor"}".
- Ofere\xE7a suporte de engenharia avan\xE7ado, com foco em ajud\xE1-lo a sanar d\xFAvidas t\xE9cnicas de clientes, dimensionar corretamente os equipamentos para fechar neg\xF3cios, identificar c\xF3digos de produtos, consultar o estoque atual da f\xE1brica de garras/cabe\xE7otes e auxiliar na elabora\xE7\xE3o de propostas que ser\xE3o encaminhadas e finalizadas pela nossa equipe de vendas internas da f\xE1brica no painel administrativo.
- Sinta-se \xE0 vontade para ser mais t\xE9cnico e usar termos de revenda, comiss\xE3o, estoque e especifica\xE7\xF5es de montagem e instala\xE7\xE3o.`;
          }
          const finalSystemInstruction = systemInstruction + userTypeInstruction + `

LEMBRETE FINAL (PRIORIDADE M\xC1XIMA): siga as REGRAS PRIORIT\xC1RIAS A, B, C e D do in\xEDcio. Resposta curta e direta; se faltar dado essencial, pergunte antes; no m\xE1ximo 1 foto e s\xF3 do equipamento recomendado.`;
          const startTime = Date.now();
          const response = await generateContentWithRetry(ai, {
            defaultModel: "gemini-3.5-flash",
            contents,
            config: {
              systemInstruction: finalSystemInstruction,
              temperature: 0.3
            }
          });
          const responseTimeMs = Date.now() - startTime;
          result = response.text || "Desculpe, n\xE3o consegui calcular ou analisar sua d\xFAvida t\xE9cnica no momento.";
          try {
            result = fixConsultantImages(result, catalogImageIndex);
          } catch (imgErr) {
            console.warn("[engineerHelper] fixConsultantImages:", imgErr?.message);
          }
          try {
            const userInfo2 = args.userInfo || {};
            const topic = await classifyQuestionTopic(ai, question);
            await db.collection("roder_ai_questions").add({
              question,
              answer: result,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              userUid: userInfo2.uid || "unauthenticated",
              userName: userInfo2.name || "An\xF4nimo",
              userEmail: userInfo2.email || "anonimo@roderbrasil.com",
              userRole: userInfo2.role || "external_seller",
              topic,
              isImproved: false,
              improvedAnswer: "",
              ledToIndication: false,
              responseTimeMs,
              referredBy: userInfo2.referredBy || ""
            });
          } catch (err) {
            console.error("Failed to log Roder AI question to Firestore:", err);
          }
          break;
        }
        case "askJefe": {
          const { question, context } = args;
          const prompt = `Voc\xEA \xE9 o "Jefe Roder", um especialista t\xE9cnico em m\xE1quinas florestais da Roder. 
        Sua miss\xE3o \xE9 ajudar vendedores externos com d\xFAvidas t\xE9cnicas sobre garras, trituradores, cabe\xE7otes e compatibilidade com m\xE1quinas base (escavadeiras, tratores).
        Responda de forma profissional, t\xE9cnica e prestativa.
        
        Contexto adicional: ${context || "Nenhum"}
        
        Pergunta do vendedor: ${question}`;
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
          });
          result = response.text || "O Jefe est\xE1 ocupado no momento. Tente novamente mais tarde.";
          break;
        }
        case "generateRoderAIDailySummary": {
          const { dateStr } = args;
          const targetDate = dateStr || getTodayLocalDate();
          let questionsList = [];
          try {
            const qSnap = await db.collection("roder_ai_questions").orderBy("timestamp", "desc").limit(500).get();
            qSnap.forEach((doc) => {
              const data = doc.data();
              if (data.timestamp) {
                const itemDate = getLocalDateString(data.timestamp);
                if (itemDate === targetDate) {
                  questionsList.push({
                    userName: data.userName || "An\xF4nimo",
                    userEmail: data.userEmail || "",
                    userRole: data.userRole || "",
                    question: data.question || "",
                    answer: data.answer || "",
                    topic: data.topic || "D\xFAvida Geral",
                    timestamp: data.timestamp
                  });
                }
              }
            });
            questionsList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          } catch (err) {
            console.error("Error loading today's questions for summary:", err);
          }
          if (questionsList.length === 0) {
            result = {
              date: targetDate,
              summary: "Nenhuma pergunta foi realizada ao consultor Roder IA na data selecionada.",
              totalQuestions: 0,
              bestQuestions: []
            };
            break;
          }
          const prompt = `Voc\xEA \xE9 um analista de dados t\xE9cnico especializado na Roder Brasil.
            Abaixo est\xE1 a lista de TODAS as intera\xE7\xF5es/perguntas realizadas hoje por TODOS os usu\xE1rios (vendedores internos, vendedores externos, diretores e parceiros) ao Consultor T\xE9cnico Roder IA.
            Sua tarefa \xE9 analisar rigorosamente todas essas conversas e produzir um RESUMO DI\xC1RIO executivo consolidado em formato Markdown estruturado.
            O resumo \xE9 voltado para a ger\xEAncia comercial (Gislene e Luana) e diretoria.
            
            DIRETRIZES DO RESUMO:
            1. Traga uma consolida\xE7\xE3o de TODAS as conversas e intera\xE7\xF5es do dia organizadas por ordem de hor\xE1rio.
            2. Traga um panorama geral de usabilidade (quantidade total de perguntas, perfil dos usu\xE1rios/vendedores).
            3. Selecione e destaque as MELHORES perguntas t\xE9cnicas (com maiores d\xFAvidas, or\xE7amentos gerados ou especifica\xE7\xF5es mais inteligentes).
            4. Se houver relat\xF3rios ou dossi\xEAs gerados para envio ao cliente, garanta que qualquer recomenda\xE7\xE3o apresentada seja impessoal e gen\xE9rica (sem dirigir-se ao vendedor por nomes espec\xEDficos como Yury ou Jeferson), facilitando o envio ao cliente final.
            5. Nas recomenda\xE7\xF5es de equipamentos (como CMF 500, Feller CFTA, Garras R/GT), cite as especifica\xE7\xF5es t\xE9cnicas completas, incluindo a foto principal do equipamento e a quantidade e fun\xE7\xE3o de cada linha hidr\xE1ulica necess\xE1ria.
            
            INTERA\xC7\xD5ES DO DIA (${targetDate}):
            ${JSON.stringify(questionsList, null, 2)}
            
            Retorne a resposta estruturada estritamente no formato JSON definido no schema.`;
          const response = await generateContentWithRetry(ai, {
            defaultModel: "gemini-3.5-flash",
            contents: [{ text: prompt }],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  summary: {
                    type: import_genai.Type.STRING,
                    description: "Texto consolidado em Markdown profissional com o resumo do dia."
                  },
                  bestQuestions: {
                    type: import_genai.Type.ARRAY,
                    description: "Lista das 3-5 melhores perguntas/d\xFAvidas do dia.",
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        userName: { type: import_genai.Type.STRING },
                        question: { type: import_genai.Type.STRING },
                        outcome: { type: import_genai.Type.STRING, description: "O desfecho, equipamento indicado ou resultado." }
                      },
                      required: ["userName", "question", "outcome"]
                    }
                  }
                },
                required: ["summary", "bestQuestions"]
              }
            }
          });
          const rawText = response.text || "{}";
          try {
            const parsed = JSON.parse(rawText);
            const summaryDoc = {
              date: targetDate,
              summary: parsed.summary,
              bestQuestions: parsed.bestQuestions,
              totalQuestions: questionsList.length,
              generatedAt: (/* @__PURE__ */ new Date()).toISOString()
            };
            await db.collection("roder_ai_daily_summaries").doc(targetDate).set(summaryDoc);
            result = summaryDoc;
          } catch (e) {
            console.error("Failed to generate daily summary JSON response", rawText);
            throw new Error("Erro ao parsear o resumo di\xE1rio estruturado da Roder IA.");
          }
          break;
        }
        case "analyzeBudget": {
          const { fileBase64, mimeType } = args;
          const prompt = `Analise este or\xE7amento/proposta da RODER e extraia os itens conforme as seguintes regras de neg\xF3cio:
            
            1. Identifique todos os PRODUTOS (equipamentos rurais/florestais).
            2. Identifique itens que N\xC3O s\xE3o base de comissionamento: Kit hidr\xE1ulico, Suporte, Acess\xF3rios.
            3. Para cada item, extraia: Nome, C\xF3digo (se houver), Quantidade e Valor (se houver).
            
            Retorne um JSON contendo a lista dos itens, totalValue e observations.
            
            IMPORTANTE: Marque 'isCommissionable' como false se for Kit hidr\xE1ulico, Suporte ou Acess\xF3rios.`;
          const safeMimeType = (mimeType || "application/pdf").split(";")[0] || "application/pdf";
          const response = await generateContentWithRetry(ai, {
            defaultModel: "gemini-3.5-flash",
            contents: [
              { text: prompt },
              { inlineData: { data: fileBase64, mimeType: safeMimeType } }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  items: {
                    type: import_genai.Type.ARRAY,
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        name: { type: import_genai.Type.STRING },
                        code: { type: import_genai.Type.STRING },
                        quantity: { type: import_genai.Type.NUMBER },
                        price: { type: import_genai.Type.NUMBER },
                        isCommissionable: { type: import_genai.Type.BOOLEAN }
                      },
                      required: ["name", "code", "quantity", "price", "isCommissionable"]
                    }
                  },
                  totalValue: { type: import_genai.Type.NUMBER },
                  observations: { type: import_genai.Type.STRING }
                },
                required: ["items", "totalValue", "observations"]
              }
            }
          });
          const text = response.text || "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("JSON bruto n\xE3o encontrado na resposta");
          result = JSON.parse(jsonMatch[0]);
          break;
        }
        case "scanStockPDF": {
          const { fileBase64 } = args;
          const prompt = `Voc\xEA \xE9 um especialista em relat\xF3rios de estoque da Roder M\xE1quinas e Roder Brasil.
            Sua tarefa \xE9 analisar este relat\xF3rio de estoque e extrair TODOS os itens contidos nele.
            
            O relat\xF3rio de estoque pode conter itens de diferentes filiais na mesma tabela (identificados pela primeira coluna "NOME EMPRESA") ou ser espec\xEDfico de uma filial.
            
            REGRAS DE CLASSIFICA\xC7\xC3O DE REGIONAL (FILIAL) E ORIGEM (SOURCE) POR ITEM:
            Analise cada item/linha do relat\xF3rio. A primeira coluna indica "NOME EMPRESA" (ou similar):
            1. Se estiver escrito "Roder - Filial Sinop", "Roder - filial Sinop" ou "Sinop" na linha do item, classifique este item com:
               - branch: "sinop"
               - source: "sinop"
            2. Se estiver escrito "Roder M\xE1quinas", "Roder Maquinas" ou referir-se \xE0 f\xE1brica/matriz, classifique este item com:
               - branch: "matriz"
               - Classifique a origem (source) do item em um dos seguintes tipos conforme a descri\xE7\xE3o:
                 - 'fae': Se o item for da marca FAE (fresas, trituradores, RCU, UML, STC, SFM, etc.) ou rompedor hidr\xE1ulico (Hammer, JSB, etc.).
                 - 'accessories': Se for suporte (suporte destocador, feller, rompedor, triturador), ponteira, engate r\xE1pido, etc.
                 - 'roder': Para garras florestais (R400, R600, R800, R1000, R280, R360, etc.), garras tra\xE7adoras (GT280, GT800, GT1000, GT600, etc.), pin\xE7as, destocadores, cabe\xE7otes, etc.
            
            Sua tarefa t\xE9cnica:
            1. Extraia 'code', 'description', 'quantity', 'branch' e 'source' de todos os itens da tabela.
            2. Substitua qualquer men\xE7\xE3o de "CHANFROL" ou "CHANFRO" por "FLORESTAL" na descri\xE7\xE3o (ex: 'GARRA SHANFROL' vira 'GARRA FLORESTAL').
            3. Apenas retorne itens com quantity > 0 no JSON final.`;
          const response = await generateContentWithRetry(ai, {
            defaultModel: "gemini-3.5-flash",
            contents: [
              { text: prompt },
              { inlineData: { data: fileBase64, mimeType: "application/pdf" } }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  source: {
                    type: import_genai.Type.STRING,
                    description: "A origem padr\xE3o do estoque: roder | fae | accessories | sinop"
                  },
                  branch: {
                    type: import_genai.Type.STRING,
                    description: "A filial padr\xE3o correspondente: matriz | sinop"
                  },
                  items: {
                    type: import_genai.Type.ARRAY,
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        code: { type: import_genai.Type.STRING },
                        description: { type: import_genai.Type.STRING },
                        quantity: { type: import_genai.Type.NUMBER },
                        branch: { type: import_genai.Type.STRING, description: "Filial do item: matriz | sinop" },
                        source: { type: import_genai.Type.STRING, description: "Origem do item: roder | fae | accessories | sinop" }
                      },
                      required: ["code", "description", "quantity", "branch", "source"]
                    }
                  }
                },
                required: ["source", "branch", "items"]
              }
            }
          });
          const text = response.text || "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            result = { items: [], source: "unknown", branch: "matriz" };
          } else {
            const parsed = JSON.parse(jsonMatch[0]);
            result = {
              items: parsed.items || [],
              source: parsed.source || "roder",
              branch: parsed.branch || "matriz"
            };
          }
          break;
        }
        case "generateWhatsAppMessage": {
          const { leadData, fairName } = args;
          const prompt = `Voc\xEA \xE9 o copiloto de vendas "Jefe Roder". Crie uma mensagem de WhatsApp persuasiva e profissional para um lead captado na feira ${fairName}.
            
            DADOS DO LEAD:
            Nome: ${leadData.name}
            Empresa: ${leadData.company || "N\xE3o informada"}
            Interesses: ${leadData.products_of_interest || "Equipamentos Roder"}
            Observa\xE7\xF5es: ${leadData.ai_notes || leadData.remarks || ""}
            
            REGRAS DA MENSAGEM:
            1. Seja cordial e mencione que nos vimos na feira.
            2. Destaque um item de interesse.
            3. Convide para uma breve conversa ou envio de or\xE7amento.
            4. Use emojis moderados.
            5. No final, coloque um placeholder [NOME DO VENDEDOR].
            
            Retorne apenas o texto da mensagem sugerida.`;
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
          });
          result = response.text || "Ol\xE1! Foi um prazer conversar com voc\xEA na feira.";
          break;
        }
        case "generateAISummary": {
          const { historyText, variant } = args;
          let prompt = "";
          if (variant === "short") {
            prompt = `Resuma brevemente o andamento desta negocia\xE7\xE3o em UMA ou DUAS frases curtas, focando no que falta para fechar o neg\xF3cio.
            Hist\xF3rico:
            ${historyText}`;
          } else {
            prompt = `Gere um RESUMO EXECUTIVO EXTREMAMENTE COMPACTO (m\xE1x 500 caracteres) em t\xF3picos:
              \u2022 OBJETIVO: O que o cliente quer.
              \u2022 NEGOCIA\xC7\xC3O: Status e mudan\xE7as.
              \u2022 PONTO CHAVE: Valor ou detalhe cr\xEDtico.
              \u2022 A\xC7\xC3O: Pr\xF3ximo passo.

              HIST\xD3RICO:
              ${historyText || "Sem hist\xF3rico relevante."}`;
          }
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
          });
          result = response.text || "Sem resumo dispon\xEDvel.";
          break;
        }
        case "analyzeDetailedBudget": {
          const { fileBase64 } = args;
          const prompt = `Analise este pedido de venda/or\xE7amento em PDF e extraia as seguintes informa\xE7\xF5es:
          1. O valor total da venda/pedido (procurado em "Total Pedido", "Valor total com ajuste de frete" ou "Valor total").
          2. O nome/raz\xE3o social do cliente ("Cliente"). Se tiver um c\xF3digo num\xE9rico antes (ex: "4235 - Eucazin Ltda"), extraia o c\xF3digo separado e limpe o nome.
          3. O prazo de entrega do pedido (procurado em "PRAZO DE ENTREGA" ou "data de entrega"), trazendo no formato DD/MM/YYYY (ex: "13/07/2026").
          4. O n\xFAmero do pedido de venda (e.g., procurado no t\xEDtulo como "Pedido de Venda n\xBA 9414"). Traga como inteiro ou texto limpo (ex: "9414").
          5. A data em que o pedido de venda foi feito/gerado (procurada na coluna ou r\xF3tulo "Data" na linha do cliente ou pr\xF3ximo \xE0 coluna endere\xE7o, ex: "28/05/2026"). Traga no formato de data DD/MM/YYYY.
          6. O CNPJ ou CPF do cliente (procurado em "CNPJ" ou "CPF/CNPJ", ex: "59.317.231/0001-76").
          7. O c\xF3digo do cliente (procurado na linha ou campo "Cliente" antes do nome ou em campo separado, ex: "4235").
          8. O apelido ou Nome Abreviado do cliente (procurado in "Apelido/Nome Abrev.", ex: "Eucazin Ltda").
          9. O e-mail de contato do cliente (procurado na linha de contato, ex: "financeiro@fazendadocarmo.com").
          10. O telefone ou celular do cliente (procurado na linha de contato ou telefone, ex: "62 9278-6496" ou "(14) 3161-5110").
          11. O endere\xE7o do cliente (procurado no campo "Endere\xE7o").
          12. A lista completa de todos os itens contidos na tabela de itens do pedido. Para cada item extraia:
             - O c\xF3digo do produto exatamente como est\xE1 (ex: "1000.1484.0000" ou "9000.9000.9027").
             - A descri\xE7\xE3o ou nome do produto.
             - A quantidade (n\xFAmero).
             - O pre\xE7o unit\xE1rio (n\xFAmero).
          
          Responda em formato de objeto JSON estruturado.`;
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
              { text: prompt },
              { inlineData: { data: fileBase64, mimeType: "application/pdf" } }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  sale_value: { type: import_genai.Type.NUMBER, description: "Total value of the budget/order" },
                  client_name: { type: import_genai.Type.STRING, description: "Client's corporate or full name" },
                  delivery_date: { type: import_genai.Type.STRING, description: "Delivery date strictly in DD/MM/YYYY format" },
                  order_number: { type: import_genai.Type.STRING, description: "Sales order number extracted (e.g. 9414)" },
                  order_date: { type: import_genai.Type.STRING, description: "Sales order generation date in DD/MM/YYYY format" },
                  client_cnpj: { type: import_genai.Type.STRING, description: "Customer's CNPJ or CPF (e.g. 59.317.231/0001-76)" },
                  client_code: { type: import_genai.Type.STRING, description: "Customer's code (e.g. 4235)" },
                  company_name: { type: import_genai.Type.STRING, description: "Customer's short/abbreviated name (e.g. Eucazin Ltda)" },
                  client_email: { type: import_genai.Type.STRING, description: "Customer's email (e.g. financeiro@fazendadocarmo.com)" },
                  client_phone: { type: import_genai.Type.STRING, description: "Customer's phone / cellular (e.g. 62 9278-6496)" },
                  client_address: { type: import_genai.Type.STRING, description: "Customer's complete address" },
                  items: {
                    type: import_genai.Type.ARRAY,
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        code: { type: import_genai.Type.STRING, description: "Product code (e.g. 1000.1484.0000)" },
                        name: { type: import_genai.Type.STRING, description: "Product description/name" },
                        quantity: { type: import_genai.Type.NUMBER, description: "Exact quantity" },
                        unit_price: { type: import_genai.Type.NUMBER, description: "Unit price of the product" }
                      },
                      required: ["code", "name", "quantity", "unit_price"]
                    }
                  }
                },
                required: ["sale_value", "client_name", "items"]
              }
            }
          });
          const text = response.text || "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
          break;
        }
        case "analyzePDFDocument": {
          const { fileBase64, customPrompt } = args;
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
              { text: customPrompt },
              { inlineData: { data: fileBase64, mimeType: "application/pdf" } }
            ]
          });
          const text = response.text || "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
          break;
        }
        case "analyzeNF": {
          const { fileBase64, expectedValue } = args;
          const prompt = `Analise esta Nota Fiscal e verifique se o valor total corresponde a R$ ${expectedValue.toLocaleString("pt-BR")}. Extraia o valor total e o n\xFAmero da nota. Responda apenas em JSON puro: { "total": number, "nf_number": "string", "matches": boolean }`;
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
              { text: prompt },
              { inlineData: { data: fileBase64, mimeType: "application/pdf" } }
            ]
          });
          const text = response.text || "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
          break;
        }
        case "extractCardData": {
          const { imageSnap } = args;
          const prompt = "Extraia os dados deste cart\xE3o de visita para JSON. Campos: name (nome da pessoa), email, phone (telefone), company (empresa), cnpj. Se n\xE3o encontrar um campo, deixe-o vazio. Retorne APENAS o JSON puro, sem explica\xE7\xF5es.";
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
              { text: prompt },
              { inlineData: { data: imageSnap, mimeType: "image/jpeg" } }
            ]
          });
          const text = response.text || "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
          break;
        }
        case "refineTranscription": {
          const { text: textToRefine } = args;
          const prompt = `Voc\xEA \xE9 um assistente da Roder Brasil. Organize o seguinte texto transcrito de uma conversa com um cliente na feira.
            O objetivo \xE9 facilitar o trabalho do vendedor interno (Roger) que enviar\xE1 o or\xE7amento.
            
            TEXTO TRANSCRITO:
            "${textToRefine}"
            
            ESTRUTURA DESEJADA:
            \u2022 SISTEMA DE OPERA\xC7\xC3O/M\xC1QUINA ATUAL: (Como o cliente opera hoje, quais m\xE1quinas possui)
            \u2022 EQUIPAMENTOS RODER DE INTERESSE: (O que ele quer comprar da Roder e para qual aplica\xE7\xE3o)
            \u2022 DETALHES T\xC9CNICOS ESPEC\xCDFICOS: (Medidas, vaz\xE3o hidr\xE1ulica, modelo da m\xE1quina base, etc)
            \u2022 OBSERVA\xC7\xD5ES PARA O COMERCIAL: (Urg\xEAncia, prazos, condi\xE7\xF5es ou recados para o Roger)
            
            REGRAS:
            1. Seja extremamente organizou e profissional.
            2. Remova gagueiras, repeti\xE7\xF5es de palavras e v\xEDcios de linguagem do texto original.
            3. Se o texto original for muito curto ou simples, transforme em um relat\xF3rio executivo de 2 ou 3 linhas.
            4. Use termos t\xE9cnicos corretamente (ex: Garra, Rotor, Triturador).
            5. Retorne apenas o texto estruturado em t\xF3picos, pronto para leitura t\xE9cnica.`;
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
          });
          result = response.text?.trim() || textToRefine;
          break;
        }
        case "generateAIInsight": {
          const { context } = args;
          const prompt = `Analise os resultados desta feira e forne\xE7a um relat\xF3rio executivo de ROI e performance.
            
            DADOS DA FEIRA:
            Nome: ${context.fairName}
            Investimento Total: R$ ${context.investment}
            Despesas: ${context.expenses}
            Total de Leads: ${context.leadsCount}
            Perfil dos Leads: ${JSON.stringify(context.profiles)}
            Qualidade (IA Score): ${JSON.stringify(context.quality)}
            
            GERE UM TEXTO ESTRUTURADO EM:
            1. Resumo da Performance
            2. C\xE1lculo Estimado de ROI (baseado na qualidade dos leads)
            3. Pontos Fortes e Fracos
            4. Sugest\xF5es Estrat\xE9gicas para a pr\xF3xima feira.
            
            Retorne o texto formatado em Markdown.`;
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
          });
          result = response.text || "N\xE3o foi poss\xEDvel gerar a an\xE1lise.";
          break;
        }
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }
      return res.json({ success: true, result });
    } catch (error) {
      console.error(`[API Gemini] Error executing action: ${req.body?.action || "unknown"}`, error);
      return res.status(500).json({ error: error.message || "Erro ao executar processamento de IA." });
    }
  });
  app.post("/api/ocr-monday", async (req, res) => {
    try {
      const { image, mimeType = "image/png" } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Nenhuma imagem fornecida." });
      }
      const ai = getGenAI();
      if (!ai) {
        return res.status(500).json({ error: "Ocorreu um erro ao inicializar o Gemini API no servidor. Por favor, adicione a sua chave 'GEMINI_API_KEY' na aba Settings > Secrets do seu painel do AI Studio para que as chamadas funcionem." });
      }
      let base64Data = image;
      let detectedMimeType = mimeType;
      if (image.startsWith("data:")) {
        const parts = image.split(";base64,");
        if (parts.length === 2) {
          detectedMimeType = parts[0].substring(5).split(";")[0];
          base64Data = parts[1];
        }
      }
      console.log(`[OCR-MONDAY] Starting Monday image analysis, mimeType: ${detectedMimeType}`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: detectedMimeType
            }
          },
          "Voc\xEA \xE9 um assistente especialista da Roder que l\xEA tabelas de listas de importa\xE7\xE3o do Monday.com. Sua tarefa \xE9 extrair as linhas de equipamentos importados da imagem. Extraia as seguintes informa\xE7\xF5es de cada linha como um array de objetos JSON: \n1. 'code' (c\xF3digo ou ref do equipamento, de prefer\xEAncia o padr\xE3o Roder se houver. Deixe como string vazia se n\xE3o puder ler)\n2. 'description' (a descri\xE7\xE3o leg\xEDvel do item da importa\xE7\xE3o, p. ex. 'FAE UML/S/EX/VT-125')\n3. 'quantity' (quantidade f\xEDsica ou itens para importar, deve ser n\xFAmero)\n4. 'embarque' (data de embarque formatada p. ex. '20 abr, 2026' ou '12 out, 2026' ou '-'. Use abrevia\xE7\xE3o leg\xEDvel em portugu\xEAs se poss\xEDvel, ou retorne '-' se n\xE3o houver)\n5. 'chegada' (a previs\xE3o de chegada ou data prevista formatada p. ex. '20 jun, 2026' ou '19 dez, 2026' ou '-'. Use abrevia\xE7\xE3o leg\xEDvel em portugu\xEAs se poss\xEDvel, ou retorne '-' se n\xE3o houver)\nSeja preciso e extraia tudo que puder ler com seguran\xE7a."
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                code: { type: "STRING" },
                description: { type: "STRING" },
                quantity: { type: "INTEGER" },
                embarque: { type: "STRING" },
                chegada: { type: "STRING" }
              },
              required: ["description", "quantity", "embarque", "chegada"]
            }
          }
        }
      });
      const text = response.text;
      console.log(`[OCR-MONDAY] Response received from Gemini: ${text}`);
      const parsedItems = JSON.parse(text || "[]");
      return res.json({ success: true, items: parsedItems });
    } catch (error) {
      console.error("[OCR-MONDAY] Error processing sheet image:", error);
      return res.status(500).json({ error: error.message || "Erro interno ao processar imagem." });
    }
  });
  const upload = (0, import_multer.default)({ storage: import_multer.default.memoryStorage() });
  app.post("/api/financeiro/parse-pdf", upload.array("files"), async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Nenhum arquivo enviado." });
      }
      console.log(`[FINANCE-PARSER] Received ${files.length} PDF files for parsing.`);
      const ai = getGenAI();
      if (!ai) {
        return res.status(500).json({ error: "O cliente da API Gemini n\xE3o foi inicializado no servidor. Por favor, adicione a sua chave 'GEMINI_API_KEY' na aba Settings > Secrets do seu painel do AI Studio para que as chamadas funcionem." });
      }
      const parsedFiles = [];
      const seenTexts = /* @__PURE__ */ new Set();
      for (const file of files) {
        try {
          const parser = new PDFParse({ data: file.buffer });
          const result = await parser.getText();
          const textStr = result.text || "";
          const trimmedText = textStr.trim();
          if (seenTexts.has(trimmedText)) {
            console.log(`[FINANCE-PARSER] Skipping duplicate PDF file by content: ${file.originalname}`);
            continue;
          }
          seenTexts.add(trimmedText);
          parsedFiles.push({
            filename: file.originalname,
            text: textStr
          });
        } catch (pdfErr) {
          console.error(`Error parsing PDF file ${file.originalname}:`, pdfErr);
        }
      }
      if (parsedFiles.length === 0) {
        return res.status(400).json({ error: "Nenhum arquivo PDF p\xF4de ser extra\xEDdo." });
      }
      const prompt = `Voc\xEA \xE9 um analista financeiro s\xEAnior e especialista da Roder Brasil.
Seu trabalho \xE9 processar relat\xF3rios em formato de texto extra\xEDdos de arquivos PDF de controle financeiro mensal da Matriz ("Roder M\xE1quinas" ou "F\xE1brica") e da Filial ("Sinop" ou "Filial").

REGRAS GERAIS DE NEG\xD3CIO:
- Identifique o ANO (format: YYYY) e M\xCAS (n\xFAmero de 1 a 12) a partir do cabe\xE7alho dos relat\xF3rios. Todos os relat\xF3rios devem pertencer ao mesmo per\xEDodo. No JSON retorne "year" e "month" e "monthId" no formato "YYYY-MM" (por exemplo, "2026-05").
- O pacote mensal ideal deve conter 20 relat\xF3rios divididos entre Matriz e Filial:
  \u2022 Receita Sint\xE9tico - Matriz ("Roder M\xE1quinas")
  \u2022 Receita Sint\xE9tico - Filial ("Sinop" ou "Filial")
  \u2022 Despesas Fixas - Matriz
  \u2022 Despesas Fixas - Filial
  \u2022 Despesas Vari\xE1veis - Matriz
  \u2022 Despesas Vari\xE1veis - Filial
  \u2022 EBITDA - Matriz
  \u2022 EBITDA - Filial
  \u2022 Gera\xE7\xE3o de Caixa (NCC) - Matriz
  \u2022 Gera\xE7\xE3o de Caixa (NCC) - Filial
  \u2022 Lucratividade L\xEDquida - Matriz
  \u2022 Lucratividade L\xEDquida - Filial
  \u2022 Margem de Contribui\xE7\xE3o - Matriz
  \u2022 Margem de Contribui\xE7\xE3o - Filial
  \u2022 Ponto de Equil\xEDbrio - Matriz
  \u2022 Ponto de Equil\xEDbrio - Filial
  \u2022 Resultado L\xEDquido - Matriz
  \u2022 Resultado L\xEDquido - Filial
  \u2022 Resultado Operacional de Caixa - Matriz
  \u2022 Resultado Operacional de Caixa - Filial
- Compare o conjunto de textos fornecidos com os 20 relat\xF3rios esperados e preencha uma lista "filesUploaded" com as descri\xE7\xF5es dos relat\xF3rios que de fato encontrou, e "missingFiles" com o t\xEDtulo amig\xE1vel dos relat\xF3rios que est\xE3o faltando se houver (por exemplo, "EBITDA - Filial" ou "Despesas Fixas - Matriz").

VALORES DOS KPIs ESPERADOS PARA EXTRA\xC7\xC3O:
Para a Matriz ("matriz") e a Filial ("filial"), extraia os seguintes KPIs caso existam nos relat\xF3rios. Mantenha os valores como n\xFAmeros (Float):
- "faturamento": O faturamento total ou total de receitas brutas (se houver relat\xF3rio de Receitas ou Emiss\xE3o de Notas).
- "receita_liquida": Receita ap\xF3s dedu\xE7\xF5es prim\xE1rias (no relat\xF3rio de Lucratividade, EBITDA ou Margem de contribui\xE7\xE3o).
- "margem_liquida": Margem de lucro l\xEDquida em percentual (geralmente nos relat\xF3rios de Lucratividade L\xEDquida).
- "resultado_liquido": O valor monet\xE1rio final de lucro l\xEDquido (geralmente no relat\xF3rio de Resultado L\xEDquido).
- "lucro_bruto": Lucro bruto monet\xE1rio (Receitas - Custos Diretos/CMV).
- "rentabilidade": Taxa de rentabilidade em percentual (geralmente sob rentabilidade ou lucratividade l\xEDquida).
- "ponto_equilibrio": Valor monet\xE1rio para ponto de equil\xEDbrio (geralmente no relat\xF3rio de Ponto de Equil\xEDbrio).
- "ebitda": Valor monet\xE1rio do EBITDA (no relat\xF3rio de EBITDA).
- "margem_ebitda": Margem EBITDA em percentual (geralmente de 0 a 100).
- "lucro_liquido": Lucro l\xEDquido absoluto.
- "margem_bruta": Margem Bruta em percentual.
- "fluxo_caixa_operacional": Saldo operacional de caixa ou Resultado Operacional de Caixa (no relat\xF3rio de Resultado Operacional de Caixa).
- "saldo_caixa": Saldo acumulado em caixa no m\xEAs (ex: do Gera\xE7\xE3o de Caixa ou Resultado Operacional de Caixa, tipo item "1 - Caixa").
- "geracao_caixa_ncc": Valor da Gera\xE7\xE3o de Caixa - NCC (do relat\xF3rio de Gera\xE7\xE3o de Caixa NCC).
- "capacidade_gerar_lucro": Percentual de Capacidade de Gerar Lucro.
- "lucro_operacional": Lucro Operacional monet\xE1rio.
- "margem_contribuicao": Margem de Contribui\xE7\xE3o em percentual.
- "capital_giro": Valor monet\xE1rio para Capital de Giro.
- "pmr": Prazo M\xE9dio de Recebimento em dias (se houver, sen\xE3o calcule ou use um valor padr\xE3o como 45 se houver men\xE7\xE3o, ou 0).
- "pmp": Prazo M\xE9dio de Pagamento em dias (se houver, sen\xE3o use padr\xE3o como 30 se houver men\xE7\xE3o, ou 0).
- "indice_inadimplencia": \xCDndice de inadimpl\xEAncia em percentual.
- "liquidez_corrente": \xCDndice de liquidez corrente (Ex: Ativo / Passivo or calculated).

C\xC1LCULO DE VALORES FALTANTES:
Se algum valor n\xE3o puder ser encontrado diretamente mas os valores brutos para calcul\xE1-lo existirem, realize o c\xE1lculo apropriado. Se n\xE3o houver dados, retorne null.

CONSOLIDA\xC7\xC3O ("consolidado"):
Calcule e consolide os valores da Matriz e Filial para preencher a estrutura "consolidado":
- KPIs absolutos monet\xE1rios (Faturamento, Receita L\xEDquida, Resultado L\xEDquido, Lucro Bruto, EBITDA, Saldo de Caixa, Fluxo de Caixa Operacional, etc.) devem ser a soma exata: Matriz + Filial.
- KPIs percentuais (Margem L\xEDquida, Rentabilidade, Margem EBITDA, Margem de Contribui\xE7\xE3o, Margem Bruta) devem ser recalculados proporcionalmente com base nos consolidados absolutos. Por exemplo, Margem EBITDA Consolidada = (EBITDA Consolidado / Receita L\xEDquida Consolidada) * 100.

POR FAVOR, RETORNE UM JSON DE ACORDO COM O SCHEMATYPE DEFINIDO.`;
      const gResponse = await generateContentWithRetry(ai, {
        defaultModel: "gemini-3.5-flash",
        contents: [
          { text: prompt },
          { text: `TEXTOS DOS ARQUIVOS PDF CARREGADOS:

${JSON.stringify(parsedFiles, null, 2)}` }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              monthId: { type: import_genai.Type.STRING },
              year: { type: import_genai.Type.INTEGER },
              month: { type: import_genai.Type.INTEGER },
              filesUploaded: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING }
              },
              missingFiles: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING }
              },
              matriz: {
                type: import_genai.Type.OBJECT,
                properties: {
                  faturamento: { type: import_genai.Type.NUMBER },
                  receita_liquida: { type: import_genai.Type.NUMBER },
                  margem_liquida: { type: import_genai.Type.NUMBER },
                  resultado_liquido: { type: import_genai.Type.NUMBER },
                  lucro_bruto: { type: import_genai.Type.NUMBER },
                  rentabilidade: { type: import_genai.Type.NUMBER },
                  ponto_equilibrio: { type: import_genai.Type.NUMBER },
                  ebitda: { type: import_genai.Type.NUMBER },
                  margem_ebitda: { type: import_genai.Type.NUMBER },
                  lucro_liquido: { type: import_genai.Type.NUMBER },
                  margem_bruta: { type: import_genai.Type.NUMBER },
                  fluxo_caixa_operacional: { type: import_genai.Type.NUMBER },
                  saldo_caixa: { type: import_genai.Type.NUMBER },
                  geracao_caixa_ncc: { type: import_genai.Type.NUMBER },
                  capacidade_gerar_lucro: { type: import_genai.Type.NUMBER },
                  lucro_operacional: { type: import_genai.Type.NUMBER },
                  margem_contribuicao: { type: import_genai.Type.NUMBER },
                  capital_giro: { type: import_genai.Type.NUMBER },
                  pmr: { type: import_genai.Type.NUMBER },
                  pmp: { type: import_genai.Type.NUMBER },
                  indice_inadimplencia: { type: import_genai.Type.NUMBER },
                  liquidez_corrente: { type: import_genai.Type.NUMBER }
                }
              },
              filial: {
                type: import_genai.Type.OBJECT,
                properties: {
                  faturamento: { type: import_genai.Type.NUMBER },
                  receita_liquida: { type: import_genai.Type.NUMBER },
                  margem_liquida: { type: import_genai.Type.NUMBER },
                  resultado_liquido: { type: import_genai.Type.NUMBER },
                  lucro_bruto: { type: import_genai.Type.NUMBER },
                  rentabilidade: { type: import_genai.Type.NUMBER },
                  ponto_equilibrio: { type: import_genai.Type.NUMBER },
                  ebitda: { type: import_genai.Type.NUMBER },
                  margem_ebitda: { type: import_genai.Type.NUMBER },
                  lucro_liquido: { type: import_genai.Type.NUMBER },
                  margem_bruta: { type: import_genai.Type.NUMBER },
                  fluxo_caixa_operacional: { type: import_genai.Type.NUMBER },
                  saldo_caixa: { type: import_genai.Type.NUMBER },
                  geracao_caixa_ncc: { type: import_genai.Type.NUMBER },
                  capacidade_gerar_lucro: { type: import_genai.Type.NUMBER },
                  lucro_operacional: { type: import_genai.Type.NUMBER },
                  margem_contribuicao: { type: import_genai.Type.NUMBER },
                  capital_giro: { type: import_genai.Type.NUMBER },
                  pmr: { type: import_genai.Type.NUMBER },
                  pmp: { type: import_genai.Type.NUMBER },
                  indice_inadimplencia: { type: import_genai.Type.NUMBER },
                  liquidez_corrente: { type: import_genai.Type.NUMBER }
                }
              },
              consolidado: {
                type: import_genai.Type.OBJECT,
                properties: {
                  faturamento: { type: import_genai.Type.NUMBER },
                  receita_liquida: { type: import_genai.Type.NUMBER },
                  margem_liquida: { type: import_genai.Type.NUMBER },
                  resultado_liquido: { type: import_genai.Type.NUMBER },
                  lucro_bruto: { type: import_genai.Type.NUMBER },
                  rentabilidade: { type: import_genai.Type.NUMBER },
                  ponto_equilibrio: { type: import_genai.Type.NUMBER },
                  ebitda: { type: import_genai.Type.NUMBER },
                  margem_ebitda: { type: import_genai.Type.NUMBER },
                  lucro_liquido: { type: import_genai.Type.NUMBER },
                  margem_bruta: { type: import_genai.Type.NUMBER },
                  fluxo_caixa_operacional: { type: import_genai.Type.NUMBER },
                  saldo_caixa: { type: import_genai.Type.NUMBER },
                  geracao_caixa_ncc: { type: import_genai.Type.NUMBER },
                  capacidade_gerar_lucro: { type: import_genai.Type.NUMBER },
                  lucro_operacional: { type: import_genai.Type.NUMBER },
                  margem_contribuicao: { type: import_genai.Type.NUMBER },
                  capital_giro: { type: import_genai.Type.NUMBER },
                  pmr: { type: import_genai.Type.NUMBER },
                  pmp: { type: import_genai.Type.NUMBER },
                  indice_inadimplencia: { type: import_genai.Type.NUMBER },
                  liquidez_corrente: { type: import_genai.Type.NUMBER }
                }
              }
            },
            required: ["monthId", "year", "month", "filesUploaded", "missingFiles", "matriz", "filial", "consolidado"]
          }
        }
      });
      const textResult = gResponse.text || "{}";
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      const parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : textResult);
      return res.json({ success: true, data: parsedResult });
    } catch (error) {
      console.error("[FINANCE-PARSER] Error during PDF ingestion:", error);
      return res.status(500).json({ error: error.message || "Falha ao processar arquivos do demonstrativo financeiro." });
    }
  });
  app.post("/api/financeiro/diagnose", async (req, res) => {
    try {
      const { current, history, entity } = req.body;
      if (!current) {
        return res.status(400).json({ error: "O demonstrativo do per\xEDodo atual \xE9 obrigat\xF3rio para diagn\xF3stico." });
      }
      const ai = getGenAI();
      if (!ai) {
        return res.status(500).json({ error: "A chave da API Gemini n\xE3o est\xE1 configurada no servidor. Por favor, configure a chave 'GEMINI_API_KEY' na aba Settings > Secrets do seu painel do AI Studio para que as chamadas funcionem." });
      }
      const targetEntity = entity || "consolidado";
      const currentMonthData = current[targetEntity] || {};
      const prompt = `Voc\xEA \xE9 o Diretor Financeiro (CFO) Inteligente e Consultor Executivo da RODER Brasil, especialista em diagn\xF3sticos financeiros de alto n\xEDvel para ind\xFAstrias de equipamentos florestais e agro.
Analise com extrema aten\xE7\xE3o e rigor os indicadores fornecidos para a entidade "${targetEntity}" do per\xEDodo ${current.monthId}.

DADOS FINANCEIROS ATUAIS (${current.monthId} - ${targetEntity}):
${JSON.stringify(currentMonthData, null, 2)}

DADOS HIST\xD3RICOS (M\xFAltiplos per\xEDodos ordenados cronologicamente):
${JSON.stringify((history || []).map((h) => ({ monthId: h.monthId, data: h[targetEntity] })), null, 2)}

SUAS TAREFAS:
1. Avalie a sa\xFAde econ\xF4mica geral da empresa com base em faturamento, receita l\xEDquida, lucratividade/margem l\xEDquida, EBITDA, saldo de caixa e fluxo de caixa operacional. Classifique em: "Saud\xE1vel" (todos principais saud\xE1veis), "Aten\xE7\xE3o" (algum sinalizador que exp\xF5e a empresa a m\xE9dio prazo), ou "Cr\xEDtico" (riscos severos de caixa, margem l\xEDquida negativa severa ou alto endividamento silencioso).
2. Forne\xE7a um t\xEDtulo executivo din\xE2mico e impactante para o painel de apresenta\xE7\xE3o do CFO.
3. Elabore um Resumo Executivo detalhado (3 a 5 linhas) explicando a performance financeira e os fatores mais p\xF3s-venda fundamentais para o resultado (ex: compress\xE3o de custos, melhoria de vendas, descasamento entre PMR/PMP, ou estabilidade).
4. Indique de 2 a 3 pontos fortes e de 2 a 3 pontos de aten\xE7\xE3o urgentes.
5. Indique de 3 a 4 sugest\xF5es acion\xE1veis, explicando o que deve ser feito e o impacto estrat\xE9gico ou retorno financeiro esperado.

Por favor, gere e ordene tudo de forma que fa\xE7a total sentido real de mercado para uma ind\xFAstria real. Retorne a resposta em formato JSON estrito em l\xEDngua Portuguesa de acordo com o esquema definido.`;
      const gResponse = await generateContentWithRetry(ai, {
        defaultModel: "gemini-3.5-flash",
        contents: [
          { text: prompt }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              financialHealth: { type: import_genai.Type.STRING },
              healthCheckTitle: { type: import_genai.Type.STRING },
              summary: { type: import_genai.Type.STRING },
              strengths: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    title: { type: import_genai.Type.STRING },
                    desc: { type: import_genai.Type.STRING }
                  },
                  required: ["title", "desc"]
                }
              },
              alerts: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    title: { type: import_genai.Type.STRING },
                    desc: { type: import_genai.Type.STRING }
                  },
                  required: ["title", "desc"]
                }
              },
              suggestions: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    action: { type: import_genai.Type.STRING },
                    impact: { type: import_genai.Type.STRING }
                  },
                  required: ["action", "impact"]
                }
              }
            },
            required: ["financialHealth", "healthCheckTitle", "summary", "strengths", "alerts", "suggestions"]
          }
        }
      });
      const textResult = gResponse.text || "{}";
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      const parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : textResult);
      return res.json({ success: true, data: parsedResult });
    } catch (error) {
      console.error("[CFO-DIAGNOSE] Error generating financial diagnostic:", error);
      return res.status(500).json({ error: error.message || "Falha ao gerar diagn\xF3stico financeiro inteligente." });
    }
  });
  app.post("/api/admin/set-user-password", async (req, res) => {
    const { email, password, token } = req.body;
    console.log(`[AUTH-ADMIN] Request to set password for: ${email}`);
    if (!email || !password || !token) {
      console.error("[AUTH-ADMIN] Missing parameters");
      return res.status(400).json({ error: "E-mail, senha e token s\xE3o obrigat\xF3rios." });
    }
    try {
      console.log("[AUTH-ADMIN] Verifying admin token...");
      let decodedToken;
      try {
        decodedToken = await import_firebase_admin.default.auth().verifyIdToken(token);
      } catch (tokenErr) {
        console.error("[AUTH-ADMIN] Token verification failed:", tokenErr.message);
        return res.status(401).json({ error: "Token de autentica\xE7\xE3o inv\xE1lido ou expirado." });
      }
      const requesterUid = decodedToken.uid;
      console.log(`[AUTH-ADMIN] Requester UID: ${requesterUid}`);
      let requesterData;
      try {
        const requesterDoc = await db.collection("users").doc(requesterUid).get();
        requesterData = requesterDoc.data();
      } catch (dbErr) {
        console.error("[AUTH-ADMIN] Database error fetching requester:", dbErr.message);
      }
      const isAdmin = requesterData?.role === "admin" || requesterData?.role === "manager" || requesterData?.role === "triagem" || requesterData?.email === "roderbrasil@gmail.com" || requesterData?.email === "roderindica@gmail.com" || decodedToken.email === "roderbrasil@gmail.com" || decodedToken.email === "roderindica@gmail.com";
      if (!isAdmin) {
        console.warn(`[AUTH-ADMIN] Access denied for ${requesterData?.email || decodedToken.email || requesterUid}`);
        return res.status(403).json({ error: "Acesso negado. Administradores e Gestores podem definir senhas." });
      }
      console.log(`[AUTH-ADMIN] Target Email: ${email}`);
      let userRecord;
      try {
        userRecord = await import_firebase_admin.default.auth().getUserByEmail(email);
        console.log(`[AUTH-ADMIN] User found (UID: ${userRecord.uid}). Updating password...`);
        await import_firebase_admin.default.auth().updateUser(userRecord.uid, {
          password
        });
        console.log(`[AUTH-ADMIN] Password updated successfully for ${email}`);
      } catch (err) {
        if (err.code === "auth/user-not-found") {
          console.log(`[AUTH-ADMIN] User not found in Auth. Creating new record for ${email}`);
          userRecord = await import_firebase_admin.default.auth().createUser({
            email,
            password,
            emailVerified: true
          });
          console.log(`[AUTH-ADMIN] User created successfully with password: ${email}`);
        } else {
          console.error("[AUTH-ADMIN] Firebase Admin error during user fetch/update:", err);
          throw err;
        }
      }
      try {
        const usersRef = db.collection("users");
        const userQuery = await usersRef.where("email", "==", email.toLowerCase().trim()).get();
        if (!userQuery.empty) {
          const batch = db.batch();
          userQuery.docs.forEach((docSnap) => {
            batch.update(docSnap.ref, {
              initial_password: password,
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            });
          });
          await batch.commit();
          console.log(`[AUTH-ADMIN] Updated Firestore users doc for ${email} with initial_password`);
        }
      } catch (dbUpdateErr) {
        console.warn("[AUTH-ADMIN] Non-fatal: could not update Firestore initial_password:", dbUpdateErr.message);
      }
      return res.json({ success: true, message: `Senha definida com sucesso para ${email}.` });
    } catch (err) {
      console.error("[AUTH-ADMIN] FATAL ERROR:", err);
      const errorMessage = err.message || "Erro desconhecido ao processar senha.";
      return res.status(500).json({ error: errorMessage, code: err.code });
    }
  });
  const __entryDir = (() => {
    try {
      return process.argv[1] ? import_path.default.dirname(import_fs.default.realpathSync(process.argv[1])) : process.cwd();
    } catch {
      return process.cwd();
    }
  })();
  const candidateDistDirs = [
    import_path.default.resolve(__entryDir, "dist"),
    import_path.default.resolve(__entryDir, "build"),
    import_path.default.resolve(__entryDir),
    import_path.default.resolve(process.cwd(), "dist"),
    import_path.default.resolve(process.cwd(), "build"),
    import_path.default.resolve(__appDir, "dist"),
    import_path.default.resolve(__appDir, "build"),
    import_path.default.resolve(__appDir),
    import_path.default.resolve(__appDir, "..", "dist"),
    import_path.default.resolve(__appDir, "..", "build"),
    import_path.default.resolve(__appDir, ".."),
    import_path.default.resolve(process.cwd(), "public_html", "dist"),
    import_path.default.resolve(process.cwd(), "public_html")
  ];
  let distPath = null;
  let indexPath = null;
  for (const candidate of candidateDistDirs) {
    const checkIndex = import_path.default.resolve(candidate, "index.html");
    const checkAssets = import_path.default.resolve(candidate, "assets");
    if (import_fs.default.existsSync(checkIndex)) {
      try {
        const content = import_fs.default.readFileSync(checkIndex, "utf8");
        if (content.includes("/assets/") || import_fs.default.existsSync(checkAssets)) {
          distPath = candidate;
          indexPath = checkIndex;
          console.log(`\u2705 [STATIC-SERVER] Diret\xF3rio de build v\xE1lido com assets encontrado em: ${distPath}`);
          break;
        }
      } catch (readErr) {
        console.warn(`[STATIC-SERVER] Aviso ao ler index em ${candidate}:`, readErr);
      }
    }
  }
  if (!indexPath) {
    console.log("\u26A0\uFE0F [STATIC-SERVER] 'dist/index.html' com assets pr\xE9-compilados n\xE3o foi encontrado nos diret\xF3rios padr\xE3o. Buscando em fallback...");
    const fallbackDistIndex = import_path.default.resolve(process.cwd(), "dist", "index.html");
    const rootIndex = import_path.default.resolve(process.cwd(), "index.html");
    if (import_fs.default.existsSync(fallbackDistIndex)) {
      indexPath = fallbackDistIndex;
      distPath = import_path.default.resolve(process.cwd(), "dist");
      console.log(`\u2705 [STATIC-SERVER] Usando fallback dist: ${distPath}`);
    } else if (import_fs.default.existsSync(rootIndex)) {
      indexPath = rootIndex;
      distPath = process.cwd();
      console.log(`\u2139\uFE0F [STATIC-SERVER] Usando fallback raiz: ${distPath}`);
    }
  }
  app.get(["/sw.js", "/service-worker.js"], (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.send(`
      self.addEventListener('install', function(e) { self.skipWaiting(); });
      self.addEventListener('activate', function(e) {
        self.registration.unregister().then(function() { return self.clients.matchAll(); }).then(function(clients) {
          clients.forEach(function(client) { if (client.url && 'navigate' in client) { client.navigate(client.url); } });
        });
      });
    `);
  });
  const limites = /* @__PURE__ */ new Map();
  const passouLimite = (chave, max, janelaMs) => {
    const agora = Date.now();
    const lista = (limites.get(chave) || []).filter((t) => agora - t < janelaMs);
    lista.push(agora);
    limites.set(chave, lista);
    if (limites.size > 5e3) limites.clear();
    return lista.length > max;
  };
  const ipDe = (req) => String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
  const ALFABETO_LINK = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const novoCodigo = () => Array.from({ length: 5 }, () => ALFABETO_LINK[Math.floor(Math.random() * ALFABETO_LINK.length)]).join("");
  const SITE = "https://roderindica.com";
  const absoluta = (u) => !u ? "" : u.startsWith("db-file://") ? `${SITE}/api/foto/${encodeURIComponent(u.slice(10))}` : u.startsWith("http") ? u : `${SITE}${u.startsWith("/") ? "" : "/"}${u}`;
  app.get("/api/foto/:id", async (req, res) => {
    try {
      const id = String(req.params.id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
      if (!id) return res.status(400).send("Foto inv\xE1lida");
      const snap = await db.collection("app_files").doc(id).get();
      const dados = String(snap.exists && snap.data()?.data || "");
      const m = dados.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/s);
      if (!m) return res.status(404).send("Foto n\xE3o encontrada");
      res.setHeader("Content-Type", m[1]);
      res.setHeader("Cache-Control", "public, max-age=604800");
      res.send(Buffer.from(m[2], "base64"));
    } catch (e) {
      res.status(500).send("Erro");
    }
  });
  const escHtml = (t) => String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  app.post("/api/link-curto", async (req, res) => {
    try {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return res.status(401).json({ error: "Fa\xE7a login novamente." });
      const quem = await import_firebase_admin.default.auth().verifyIdToken(token);
      const pid = String(req.body?.pid || "").slice(0, 80);
      const mid = String(req.body?.mid || "").slice(0, 80);
      if (!pid) return res.status(400).json({ error: "Equipamento n\xE3o informado." });
      const existente = await db.collection("links_curtos").where("uid", "==", quem.uid).where("pid", "==", pid).where("mid", "==", mid).limit(1).get();
      if (!existente.empty) return res.json({ codigo: existente.docs[0].id });
      for (let tentativa = 0; tentativa < 6; tentativa++) {
        const codigo = novoCodigo();
        const ref = db.collection("links_curtos").doc(codigo);
        const criado = await db.runTransaction(async (t) => {
          const snap = await t.get(ref);
          if (snap.exists) return false;
          t.set(ref, { uid: quem.uid, pid, mid, created_at: (/* @__PURE__ */ new Date()).toISOString() });
          return true;
        });
        if (criado) return res.json({ codigo });
      }
      res.status(500).json({ error: "N\xE3o consegui gerar o link." });
    } catch (e) {
      res.status(500).json({ error: e?.message || "Erro" });
    }
  });
  app.get("/api/link-curto/:codigo", async (req, res) => {
    try {
      const codigo = String(req.params.codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
      const snap = await db.collection("links_curtos").doc(codigo).get();
      if (!snap.exists) return res.status(404).json({ error: "Link n\xE3o encontrado." });
      const d = snap.data();
      res.json({ uid: d.uid || "", pid: d.pid || "", mid: d.mid || "" });
    } catch (e) {
      res.status(500).json({ error: e?.message || "Erro" });
    }
  });
  app.get("/o/:codigo", async (req, res, next) => {
    try {
      const arquivo = indexPath && import_fs.default.existsSync(indexPath) ? indexPath : import_path.default.resolve(process.cwd(), "dist", "index.html");
      if (!import_fs.default.existsSync(arquivo)) return next();
      let html = import_fs.default.readFileSync(arquivo, "utf8");
      const codigo = String(req.params.codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
      let titulo = "Roder M\xE1quinas e Equipamentos";
      let descricao = "Fotos, v\xEDdeo, ficha t\xE9cnica e or\xE7amento.";
      let imagem = `${SITE}/marca/roder-redondo-512.png`;
      try {
        const link = await db.collection("links_curtos").doc(codigo).get();
        if (link.exists) {
          const l = link.data();
          const prod = await db.collection("products").doc(l.pid).get();
          if (prod.exists) {
            const p = prod.data();
            const m = (p.models || []).find((x) => x.id === l.mid) || null;
            titulo = `${p.name}${m && !String(p.name).includes(m.name) ? ` ${m.name}` : ""} | Roder`;
            const base = String(m?.technical_specs?.maquina_base || "").trim();
            descricao = base ? `Para ${/carregadeira|engate/i.test(p.name) ? "p\xE1 carregadeira" : "escavadeiras"} de ${base.replace(/\s*ton\.?$/i, " t")}. Fotos, v\xEDdeo, ficha e or\xE7amento.` : descricao;
            const foto = (m?.images || []).find((i) => i && !/run\.app/.test(i)) || p.image_url;
            if (foto && !/run\.app/.test(foto)) imagem = absoluta(foto);
          }
        }
      } catch (e) {
      }
      const meta = `<meta property="og:type" content="website" />
    <meta property="og:site_name" content="Roder M\xE1quinas e Equipamentos" />
    <meta property="og:title" content="${escHtml(titulo)}" />
    <meta property="og:description" content="${escHtml(descricao)}" />
    <meta property="og:image" content="${escHtml(imagem)}" />
    <meta property="og:url" content="${SITE}/o/${codigo}" />
    <meta name="twitter:card" content="summary_large_image" />`;
      html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${escHtml(titulo)}</title>
    ${meta}`);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.type("html").send(html);
    } catch (e) {
      next();
    }
  });
  app.post("/api/orcamento/confirmacao", async (req, res) => {
    try {
      if (passouLimite(`conf-ip:${ipDe(req)}`, 5, 60 * 60 * 1e3)) return res.status(429).json({ error: "Muitas solicita\xE7\xF5es." });
      const id = String(req.body?.indicationId || "").slice(0, 60);
      if (!id) return res.status(400).json({ error: "Solicita\xE7\xE3o n\xE3o informada." });
      const ref = db.collection("indications").doc(id);
      let ind = null;
      const liberado = await db.runTransaction(async (t) => {
        const snap = await t.get(ref);
        if (!snap.exists) return "nao_existe";
        ind = snap.data();
        if (ind.creator_type !== "client") return "nao_cliente";
        if (ind.confirmacao_cliente_enviada_em) return "repetido";
        const criadoEm = snap.createTime ? snap.createTime.toMillis() : 0;
        if (!criadoEm || Date.now() - criadoEm > 15 * 60 * 1e3) return "prazo";
        t.update(ref, { confirmacao_cliente_enviada_em: (/* @__PURE__ */ new Date()).toISOString() });
        return "ok";
      });
      if (liberado === "repetido") return res.json({ ok: true, repetido: true });
      if (liberado !== "ok") return res.status(400).json({ error: "Solicita\xE7\xE3o inv\xE1lida." });
      const email = String(ind.client_email || "").trim().toLowerCase();
      if (!/^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]+$/.test(email)) return res.json({ ok: false, motivo: "sem e-mail" });
      if (passouLimite(`conf-mail:${email}`, 3, 24 * 60 * 60 * 1e3)) return res.status(429).json({ error: "Muitas solicita\xE7\xF5es." });
      const produto = String(ind.items?.[0]?.product_name || "equipamento Roder");
      const nome = String(ind.client_name || "").trim().split(/\s+/)[0] || "";
      const foto = absoluta(String(req.body?.foto || "")).replace(/[^\w:/.\-?=&%~+]/g, "");
      let link = SITE;
      try {
        const u = new URL(String(req.body?.link || ""));
        if (u.origin === SITE) link = escHtml(u.toString());
      } catch {
      }
      const PERFIS = {
        completa: { itens: ["equipamento", "frete at\xE9 a sua cidade", "instala\xE7\xE3o hidr\xE1ulica na sua m\xE1quina por t\xE9cnico Roder", "regulagem e orienta\xE7\xE3o ao operador"], consultor: "Ele vai pedir a marca e o modelo da sua m\xE1quina e fotos do comando hidr\xE1ulico, para confirmar se ela tem fatia extra e v\xE1lvula de regulagem de press\xE3o. \xC9 com isso que a Roder prepara a instala\xE7\xE3o hidr\xE1ulica completa." },
        linha_extra: { itens: ["equipamento com o encaixe do engate da sua p\xE1 carregadeira", "frete at\xE9 a sua cidade", "instala\xE7\xE3o da linha extra (3\xAA fun\xE7\xE3o), se a sua m\xE1quina ainda n\xE3o tiver"], consultor: "Ele vai confirmar o modelo da sua p\xE1 carregadeira e se ela j\xE1 tem engate r\xE1pido e linha extra bidirecional (3\xAA fun\xE7\xE3o). Se j\xE1 tiver, n\xE3o precisa de instala\xE7\xE3o. Se n\xE3o tiver, a Roder instala." },
        garfo: { itens: ["equipamento", "frete at\xE9 a sua cidade"], consultor: "Ele vai confirmar o modelo da sua p\xE1 carregadeira e se ela usa engate r\xE1pido, para o garfo ir com o encaixe certo." },
        trator_tecnico: { itens: ["equipamento", "frete at\xE9 a sua cidade", "t\xE9cnico Roder acompanha a primeira instala\xE7\xE3o no trator", "orienta\xE7\xE3o de trabalho ao operador no in\xEDcio"], consultor: "Ele vai confirmar o modelo e a pot\xEAncia do seu trator." },
        trator: { itens: ["equipamento pronto para acoplar no trator", "frete at\xE9 a sua cidade"], consultor: "Ele vai confirmar o modelo do seu trator e fechar frete e prazo de entrega." },
        guindaste: { itens: ["equipamento", "frete at\xE9 a sua cidade"], consultor: "Ele vai confirmar o modelo do seu guindaste, grua ou cesto a\xE9reo e as linhas hidr\xE1ulicas que ele j\xE1 tem preparadas para o equipamento." }
      };
      const perfilTxt = PERFIS[String(req.body?.perfil || "")] || PERFIS.completa;
      const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111">
  <div style="background:#090909;padding:16px;text-align:center"><img src="${SITE}/marca/roder-horizontal.png" alt="Roder" style="height:36px" /></div>
  <div style="padding:20px 18px;font-size:15px;line-height:1.55">
    <p>Ol\xE1${nome ? `, ${escHtml(nome)}` : ""}.</p>
    <p>Recebemos seu pedido de or\xE7amento da <b>${escHtml(produto)}</b>.</p>
    ${foto ? `<p style="text-align:center"><img src="${foto}" alt="" style="max-width:260px;max-height:200px" /></p>` : ""}
    <p>Seu or\xE7amento inclui:<br>${perfilTxt.itens.map((i) => `\u2022 ${i}`).join("<br>")}</p>
    <p>Para chegar aos valores certos, um consultor Roder vai falar com voc\xEA pelo WhatsApp. ${perfilTxt.consultor}</p>
    <p>O or\xE7amento chega neste e-mail.</p>
    <p style="text-align:center;margin:22px 0"><a href="${link}" style="background:#facc15;color:#111;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:10px;display:inline-block">Ver v\xEDdeo e ficha t\xE9cnica</a></p>
    <p style="color:#555;font-size:13px">Roder M\xE1quinas e Equipamentos \xB7 desde 2002<br>Pardinho, SP \xB7 roderbrasil.com.br</p>
  </div>
</div>`;
      await sendAutomaticEmail(email, `Recebemos seu pedido de or\xE7amento: ${produto}`, html, { fromName: "Roder M\xE1quinas e Equipamentos" });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e?.message || "Erro" });
    }
  });
  app.get("/registerSW.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.send(`console.log('registerSW mock active');`);
  });
  if (distPath && indexPath && import_fs.default.existsSync(indexPath)) {
    console.log(`Starting in PRODUCTION static mode. Serving frontend from: ${distPath}`);
    app.use("/assets", import_express.default.static(import_path.default.resolve(distPath, "assets"), { maxAge: "1y", immutable: true }));
    app.use(import_express.default.static(distPath, {
      index: false,
      // a pasta dist/catalogo (fotos, fichas e vídeos) tem o mesmo nome da tela /catalogo:
      // sem isto, abrir /catalogo redirecionava para /catalogo/
      redirect: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html") || filePath.endsWith("roder-sw.js")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      const isAssetRequest = /\.(js|css|woff2?|ttf|png|jpg|jpeg|gif|svg|ico|json|map)$/i.test(req.path);
      if (isAssetRequest) {
        return res.status(404).send("File not found");
      }
      if (indexPath && import_fs.default.existsSync(indexPath)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        return res.sendFile(indexPath);
      }
      for (const candidate of candidateDistDirs) {
        const candIndex = import_path.default.resolve(candidate, "index.html");
        if (import_fs.default.existsSync(candIndex) && import_fs.default.existsSync(import_path.default.resolve(candidate, "assets"))) {
          indexPath = candIndex;
          distPath = candidate;
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          return res.sendFile(candIndex);
        }
      }
      const fallbackDistIndex = import_path.default.resolve(process.cwd(), "dist", "index.html");
      if (import_fs.default.existsSync(fallbackDistIndex)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.sendFile(fallbackDistIndex);
      }
      const rootIndex = import_path.default.resolve(process.cwd(), "index.html");
      if (import_fs.default.existsSync(rootIndex)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.sendFile(rootIndex);
      }
      if (!import_fs.default.existsSync(import_path.default.join(__appDir, "server.js"))) {
        console.warn("[STATIC-SERVER] Pasta da vers\xE3o removida. Encerrando processo antigo.");
        setTimeout(() => process.exit(0), 500);
      }
      console.error(`[STATIC-SERVER] index.html nao encontrado. cwd=${process.cwd()} entry=${__entryDir} indexPath=${indexPath}`);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).send("<!DOCTYPE html><html><head><title>RODER Brasil</title></head><body style='background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:40px;text-align:center;'><h2>Iniciando RODER Brasil...</h2><p>Carregando m\xF3dulos em tempo real...</p></body></html>");
    });
  } else {
    console.log("\u{1F680} [SERVER] Tentando servir frontend em modo de compatibilidade...");
    try {
      const vite = await (0, import_vite.createServer)({
        server: { middlewareMode: true },
        appType: "spa",
        root: process.cwd()
      });
      app.use(vite.middlewares);
      console.log("\u2705 [SERVER] Vite middleware anexado com sucesso. Aplica\xE7\xE3o rodando!");
    } catch (viteErr) {
      console.error("\u274C [SERVER] Erro ao iniciar Vite middleware:", viteErr);
      app.use(import_express.default.static(process.cwd()));
      if (import_fs.default.existsSync(import_path.default.resolve(process.cwd(), "dist"))) {
        app.use(import_express.default.static(import_path.default.resolve(process.cwd(), "dist")));
      }
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api/")) return next();
        const fallbackDistIndex = import_path.default.resolve(process.cwd(), "dist", "index.html");
        if (import_fs.default.existsSync(fallbackDistIndex)) {
          return res.sendFile(fallbackDistIndex);
        }
        const rootIndex = import_path.default.resolve(process.cwd(), "index.html");
        if (import_fs.default.existsSync(rootIndex)) {
          return res.sendFile(rootIndex);
        }
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>RODER Brasil - Inicializa\xE7\xE3o</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 500px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
                h1 { color: #f97316; font-size: 24px; margin-top: 0; }
                p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
                .btn { display: inline-block; background: #f97316; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 20px; transition: background 0.2s; cursor: pointer; border: none; }
                .btn:hover { background: #ea580c; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>RODER Brasil</h1>
                <p>O servidor est\xE1 ativo. Se voc\xEA acabou de publicar uma nova vers\xE3o na Hostinger, execute <code>npm run build</code> ou reinicie o aplicativo Node.js no painel.</p>
                <button class="btn" onclick="window.location.reload()">Recarregar P\xE1gina</button>
              </div>
            </body>
          </html>
        `);
      });
    }
  }
  const BR_TIMEZONE = "America/Sao_Paulo";
  const formatCurrency = (val) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  const getFinanceReplyTo = (notif) => {
    const list = ["financeiro@roderbrasil.com.br", "financeiro2@roderbrasil.com.br"].flatMap((e) => String(e).split(/[,;]/)).map((e) => e.trim()).filter(Boolean);
    return Array.from(new Set(list));
  };
  async function getEmailTransporter() {
    let settings = null;
    try {
      const settingsSnap = await db.collection("settings").doc("email").get();
      settings = settingsSnap.exists ? settingsSnap.data() : null;
    } catch (e) {
      console.warn("[EMAIL] N\xE3o foi poss\xEDvel ler settings/email, usando SMTP das vari\xE1veis de ambiente:", e?.message);
    }
    if (!(settings?.provider === "gmail" && settings.user && settings.pass) && process.env.SMTP_USER && process.env.SMTP_PASS) {
      settings = { provider: "gmail", user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
    }
    if (settings?.provider !== "gmail" || !settings.user || !settings.pass) return null;
    return import_nodemailer.default.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: settings.user,
        pass: settings.pass.replace(/\s/g, "")
      }
    });
  }
  async function sendAutomaticEmail(to, subject, html, opts = {}) {
    const transporter = await getEmailTransporter();
    if (!transporter) {
      console.warn("[EMAIL] Sem configura\xE7\xE3o de e-mail; n\xE3o enviado:", subject);
      return;
    }
    const user = transporter.options?.auth?.user;
    await transporter.sendMail({
      from: `"${opts.fromName || "Roder Sistema"}" <${user}>`,
      to,
      subject,
      ...opts.replyTo ? { replyTo: opts.replyTo } : {},
      ...opts.cc ? { cc: opts.cc } : {},
      html: `${html}<div style="margin-top:30px; font-size:10px; color:#999; border-top:1px solid #eee; padding-top:10px;">Enviado automaticamente pelo Sistema Roder Indica V2</div>`
    });
  }
  import_node_cron.default.schedule("0 20 * * *", async () => {
    console.log("[Schedule] Checking for Active Fairs to send daily reports (20h Bras\xEDlia)...");
    try {
      const now = /* @__PURE__ */ new Date();
      const fairsSnap = await db.collection("fairs").where("status", "==", "active").get();
      const activeFairs = fairsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((fair) => {
        const start = new Date(fair.start_date);
        const end = new Date(fair.end_date);
        const activeStart = new Date(start);
        activeStart.setDate(start.getDate() - 3);
        const activeEnd = new Date(end);
        activeEnd.setDate(end.getDate() + 3);
        return now >= activeStart && now <= activeEnd;
      });
      if (activeFairs.length === 0) {
        console.log("[Schedule] No active fairs found for daily report.");
        return;
      }
      for (const fair of activeFairs) {
        const leadsSnap = await db.collection("fair_leads").where("fair_id", "==", fair.id).get();
        const leads = leadsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (leads.length === 0) {
          console.log(`[Schedule] No leads found for fair: ${fair.name}`);
          continue;
        }
        const recipients = [
          "luana@roderbrasil.com.br",
          "gislene@roderbrasil.com.br",
          "roderbrasil@gmail.com"
        ];
        let html = `
          <div style="font-family: sans-serif; color: #333; max-width: 1000px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder" style="height: 40px;">
              <h1 style="color: #22c55e; margin: 10px 0;">Relat\xF3rio Di\xE1rio de Leads - ${fair.name}</h1>
              <p style="color: #666; font-size: 14px;">Data do Relat\xF3rio: ${now.toLocaleDateString("pt-BR")} ${now.toLocaleTimeString("pt-BR", { timeZone: BR_TIMEZONE })}</p>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-around; text-align: center;">
              <div>
                <p style="margin: 0; font-size: 14px; color: #166534; font-weight: bold;">TOTAL DE LEADS</p>
                <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: 900; color: #166534;">${leads.length}</p>
              </div>
              <div>
                <p style="margin: 0; font-size: 14px; color: #991b1b; font-weight: bold;">LEADS QUENTES</p>
                <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: 900; color: #991b1b;">${leads.filter((l) => l.ai_score === "hot").length}</p>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #22c55e; color: white;">
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Data</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Lead / Empresa</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Contato</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Produtos de Interesse</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Observa\xE7\xF5es</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Vendedor</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Temp.</th>
                </tr>
              </thead>
              <tbody>
                ${leads.map((lead) => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${new Date(lead.created_at).toLocaleDateString("pt-BR")}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>${lead.name}</strong><br><small style="color: #666;">${lead.company || "-"}</small></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${lead.phone || "-"}<br><small style="color: #666;">${lead.email || "-"}</small></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${(lead.interest_products || []).join(", ") || "Geral"}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; font-style: italic; color: #666;">${lead.observations || "-"}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${lead.salesperson_name || "An\xF4nimo"}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
                      <span style="display: inline-block; padding: 2px 6px; border-radius: 10px; background: ${lead.ai_score === "hot" ? "#fee2e2" : "#fef3c7"}; color: ${lead.ai_score === "hot" ? "#991b1b" : "#92400e"}; font-weight: bold; font-size: 10px;">
                        ${lead.ai_score === "hot" ? "QUENTE" : "MORNO"}
                      </span>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div style="margin-top: 30px; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
              <p style="margin: 0; font-size: 13px; color: #64748b;">
                * Este relat\xF3rio \xE9 export\xE1vel em PDF atrav\xE9s do painel da feira no sistema Roder Indica V2.
                Para triagem individual, acesse: <a href="https://roder-indica.web.app/fairs/${fair.id}" style="color: #22c55e;">Painel da Feira</a>
              </p>
            </div>
          </div>
        `;
        for (const email of recipients) {
          await sendAutomaticEmail(email, `PLANILHA LEADS - ${fair.name} - ${now.toLocaleDateString("pt-BR")}`, html);
          console.log(`[Schedule] Daily fair report sent to ${email} for fair ${fair.name}`);
        }
      }
    } catch (err) {
      console.error("[Schedule] Error in Daily Fair Reports:", err);
    }
  }, {
    timezone: BR_TIMEZONE
  });
  import_node_cron.default.schedule("0 8 1 * *", async () => {
    console.log("[Schedule] Generating Day 1 Monthly Reports...");
    const notifSnap = await db.collection("settings").doc("notifications").get();
    const notif = notifSnap.data();
    if (!notif?.monthly_report_directors) return;
    const now = /* @__PURE__ */ new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const indicationsSnap = await db.collection("indications").where("status", "==", "sold").get();
    const negotiatingSnap = await db.collection("indications").where("status", "==", "negotiating").get();
    const monthlySales = indicationsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => {
      if (!d.updated_at) return false;
      const date = new Date(d.updated_at);
      return date >= lastMonth && date <= endOfLastMonth;
    });
    const activeNegotiations = negotiatingSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => {
      if (!d.budget_date) return false;
      const budgetDate = new Date(d.budget_date);
      const daysOld = (now.getTime() - budgetDate.getTime()) / (1e3 * 60 * 60 * 24);
      return daysOld <= 60;
    });
    if (monthlySales.length === 0 && activeNegotiations.length === 0) return;
    const totalSalesValue = monthlySales.reduce((acc, curr) => acc + (curr.sale_value || 0), 0);
    const totalCommissions = monthlySales.reduce((acc, curr) => acc + (curr.commission_value || 0), 0);
    const totalNegotiatingValue = activeNegotiations.reduce((acc, curr) => acc + (curr.sale_value || 0), 0);
    const sellersMap = {};
    monthlySales.forEach((sale) => {
      const sid = sale.external_seller_uid;
      if (!sellersMap[sid]) {
        sellersMap[sid] = { name: sale.external_seller_name, count: 0, total: 0, commissions: 0, saleTimes: [] };
      }
      sellersMap[sid].count++;
      sellersMap[sid].total += sale.sale_value || 0;
      sellersMap[sid].commissions += sale.commission_value || 0;
      if (sale.created_at && sale.updated_at) {
        const t = (new Date(sale.updated_at).getTime() - new Date(sale.created_at).getTime()) / (1e3 * 60 * 60 * 24);
        sellersMap[sid].saleTimes.push(t);
      }
    });
    const sellersRanking = Object.entries(sellersMap).map(([uid, data]) => ({
      uid,
      ...data
    })).sort((a, b) => b.total - a.total);
    const monthName = lastMonth.toLocaleString("pt-BR", { month: "long", year: "numeric" });
    let html = `
      <div style="font-family: sans-serif; color: #333; max-width: 900px;">
        <h1 style="color: #eab308; border-bottom: 2px solid #eab308; padding-bottom: 10px;">Relat\xF3rio de Vendas - ${monthName}</h1>
        
        <div style="display: flex; gap: 20px; margin: 20px 0;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">VENDAS TOTAIS (NF)</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #eab308;">${formatCurrency(totalSalesValue)}</p>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">EM NEGOCIA\xC7\xC3O (ABERTO)</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #3b82f6;">${formatCurrency(totalNegotiatingValue)}</p>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">COMISS\xD5ES \xC0 PAGAR</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #0f172a;">${formatCurrency(totalCommissions)}</p>
          </div>
        </div>

        <h2 style="font-size: 18px; margin-top: 30px;">Destaques por Vendedor</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Vendedor</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Vendas</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">T. M\xE9dio (Dias)</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Valor Total (NF)</th>
            </tr>
          </thead>
          <tbody>
            ${sellersRanking.map((s) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${s.name}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${s.count}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${s.saleTimes.length > 0 ? (s.saleTimes.reduce((a, b) => a + b, 0) / s.saleTimes.length).toFixed(1) : "N/A"}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${formatCurrency(s.total)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <h2 style="font-size: 18px; margin-top: 40px;">Listagem Detalhada de Vendas</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Cliente</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Equipamento</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Indicador</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Vendedor Interno</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Valor Venda</th>
            </tr>
          </thead>
          <tbody>
            ${monthlySales.map((sale) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.client_name}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.product_name}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.external_seller_name || "-"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.internal_seller_name || "-"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatCurrency(sale.sale_value || 0)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <h2 style="font-size: 18px; margin-top: 40px; color: #3b82f6;">Or\xE7amentos em Aberto (V\xE1lidos)</h2>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">Estas negocia\xE7\xF5es ainda est\xE3o dentro do prazo de 60 dias e s\xE3o prioridade para reuni\xF5es de acompanhamento.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
          <thead>
            <tr style="background: #eff6ff; text-align: left;">
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Cliente</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Equipamento</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Interno</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Enviado em</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Validade</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Previs\xE3o</th>
            </tr>
          </thead>
          <tbody>
            ${activeNegotiations.map((neg) => {
      const bDate = new Date(neg.budget_date);
      const daysLeft = 60 - Math.floor((now.getTime() - bDate.getTime()) / (1e3 * 60 * 60 * 24));
      return `
                <tr>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${neg.client_name}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${neg.product_name}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${neg.internal_seller_name || "-"}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${bDate.toLocaleDateString("pt-BR")}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; color: ${daysLeft <= 5 ? "#ef4444" : "#64748b"}; font-weight: bold;">
                    ${daysLeft} dias
                  </td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatCurrency(neg.sale_value || 0)}</td>
                </tr>
              `;
    }).join("")}
            ${activeNegotiations.length === 0 ? '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #94a3b8;">Nenhuma negocia\xE7\xE3o ativa no momento.</td></tr>' : ""}
          </tbody>
        </table>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Este relat\xF3rio cont\xE9m valores reais de nota fiscal para fins gerenciais.
        </p>
      </div>
    `;
    const recipients = [
      ...notif.manager_emails ? notif.manager_emails.split(",").map((e) => e.trim()) : [],
      ...notif.director_emails ? notif.director_emails.split(",").map((e) => e.trim()) : []
    ].filter((e) => e !== "");
    for (const email of recipients) {
      await sendAutomaticEmail(email, `Relat\xF3rio de Vendas Roder - ${monthName}`, html);
    }
    const financeEmails = [
      "financeiro@roderbrasil.com.br",
      "financeiro2@roderbrasil.com.br",
      "jeferson@roderbrasil.com.br"
    ];
    if (notif.finance_email) {
      const customEmails = String(notif.finance_email).split(",").map((e) => e.trim()).filter((e) => e !== "");
      customEmails.forEach((email) => {
        if (!financeEmails.map((x) => x.toLowerCase()).includes(email.toLowerCase())) {
          financeEmails.push(email);
        }
      });
    }
    const detailedSellers = await Promise.all(sellersRanking.map(async (s) => {
      if (!s.uid) return { ...s, pix_key: "-", bank_info: { bank: "-", agency: "-", account: "-" } };
      const userDoc = await db.collection("users").doc(s.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data() || {};
        return {
          ...s,
          pix_key: userData.pix_key || "N\xE3o informado",
          bank_info: userData.bank_info || { bank: "-", agency: "-", account: "-" }
        };
      }
      return { ...s, pix_key: "-", bank_info: { bank: "-", agency: "-", account: "-" } };
    }));
    const financeHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 900px;">
        <h1 style="color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">Previs\xE3o de Pagamentos - ${monthName}</h1>
        <p>O valor total de comiss\xF5es para as vendas de <strong>${monthName}</strong> \xE9 de: <strong style="font-size: 18px; color: #eab308;">${formatCurrency(totalCommissions)}</strong>.</p>
        <p>Abaixo seguem os detalhes de cada vendedor e suas respectivas informa\xE7\xF5es banc\xE1rias para processamento do pagamento.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Vendedor</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Comiss\xE3o</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Chave PIX</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Dados Banc\xE1rios</th>
            </tr>
          </thead>
          <tbody>
            ${detailedSellers.map((s) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${s.name}</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${formatCurrency(s.commissions)}</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #666;">${s.pix_key}</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-size: 11px; color: #666;">
                  ${s.bank_info?.bank ? `Bco: ${s.bank_info.bank}<br>Ag: ${s.bank_info.agency}<br>Cc: ${s.bank_info.account}` : "N/A"}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <h2 style="font-size: 16px; margin-top: 35px; border-bottom: 2px solid #0f172a; padding-bottom: 5px; color: #0f172a; font-weight: bold;">Detalhamento das Indica\xE7\xF5es Faturadas no M\xEAs (Roder Indica)</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Cliente</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Parceiro Indicador</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Equipamento(s)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Valor Venda (R$)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Base Comission\xE1vel (R$)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Al\xEDquota (%)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Comiss\xE3o (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${monthlySales.map((sale) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.client_name || "N\xE3o informado"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.external_seller_name || "-"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.product_name || "-"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(sale.sale_value || 0)}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatCurrency(sale.base_commission_value || 0)}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${sale.commission_rate_applied || 5}%</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #16a34a;">${formatCurrency(sale.commission_value || 0)}</td>
              </tr>
            `).join("")}
            ${monthlySales.length === 0 ? '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #64748b;">Nenhum faturamento registrado no m\xEAs anterior.</td></tr>' : ""}
          </tbody>
        </table>

        <p style="margin-top: 25px; font-size: 12px; color: #666; font-style: italic;">
          * Por favor, verifique se os vendedores enviaram as Notas Fiscais no sistema antes de efetivar o pagamento.
        </p>
      </div>
    `;
    for (const email of financeEmails) {
      await sendAutomaticEmail(email, `Financeiro: Relat\xF3rio de Pagamentos - ${monthName}`, financeHtml);
    }
  }, {
    timezone: BR_TIMEZONE
  });
  import_node_cron.default.schedule("0 8 1 * *", async () => {
    console.log("[Schedule] Generating Day 1 Partner Reports...");
    const notifSnap = await db.collection("settings").doc("notifications").get();
    const notif = notifSnap.data();
    if (!notif?.monthly_report_partners) return;
    const now = /* @__PURE__ */ new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const indicationsSnap = await db.collection("indications").where("status", "==", "sold").get();
    const monthlySales = indicationsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => {
      if (!d.updated_at) return false;
      const date = new Date(d.updated_at);
      return date >= lastMonth && date <= endOfLastMonth;
    });
    const sellersMap = {};
    monthlySales.forEach((sale) => {
      const sid = sale.external_seller_uid;
      if (!sellersMap[sid]) sellersMap[sid] = [];
      sellersMap[sid].push(sale);
    });
    for (const [sid, sales] of Object.entries(sellersMap)) {
      const partnerData = await db.collection("users").doc(sid).get();
      if (!partnerData.exists) continue;
      const partner = partnerData.data();
      if (!partner.email || partner.email.endsWith("@mobile.roder.com.br")) continue;
      const salesWithCommission = sales.filter((x) => (x.commission_value || 0) > 0);
      const totalCommissions = salesWithCommission.reduce((acc, curr) => acc + (curr.commission_value || 0), 0);
      if (totalCommissions <= 0) continue;
      const monthName = lastMonth.toLocaleString("pt-BR", { month: "long", year: "numeric" });
      const financeReplyTo = getFinanceReplyTo(notif);
      const firstName = String(partner.name || "").split(" ")[0] || "parceiro";
      const html = `
        <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 620px;">
          <p style="font-size: 16px;">Ol\xE1, ${firstName}!</p>
          <p style="font-size: 15px; line-height: 1.6;">\xC9 um prazer informar que as suas indica\xE7\xF5es geraram vendas em <strong>${monthName}</strong>. Muito obrigado pela parceria e pela confian\xE7a na Roder.</p>

          <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 18px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #9a3412; text-transform: uppercase; letter-spacing: .05em;">Sua comiss\xE3o a receber</p>
            <p style="margin: 6px 0 0 0; font-size: 30px; font-weight: 800; color: #c2410c;">${formatCurrency(totalCommissions)}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="color: #6b7280; text-align: left;">
                <th style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Cliente</th>
                <th style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Equipamento</th>
                <th style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">Comiss\xE3o</th>
              </tr>
            </thead>
            <tbody>
              ${salesWithCommission.map((x) => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${x.client_name || x.client_person_name || ""}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${x.base_machine || x.product_name || ""}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: bold;">${formatCurrency(x.commission_value || 0)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; font-size: 14px; line-height: 1.6;">
            <p style="margin: 0;"><strong>Pr\xF3ximo passo: nota fiscal de servi\xE7o</strong></p>
            <p style="margin: 6px 0 0 0;">Nosso setor financeiro est\xE1 aguardando a sua <strong>nota fiscal de servi\xE7o no valor de ${formatCurrency(totalCommissions)}</strong>.</p>
            <p style="margin: 6px 0 0 0;">Basta <strong>responder este e-mail com a nota fiscal anexada</strong> at\xE9 o dia <strong>05</strong>. A resposta vai direto para o nosso financeiro, e o pagamento \xE9 feito at\xE9 o dia <strong>07</strong> (se cair em fim de semana ou feriado, no pr\xF3ximo dia \xFAtil).</p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #6b7280;">Se preferir, voc\xEA tamb\xE9m pode carregar a nota no Roder Indica, na tela Comiss\xF5es.</p>
          </div>

          <p style="font-size: 14px; margin-top: 24px;">Um abra\xE7o,<br><strong>Equipe Roder M\xE1quinas e Equipamentos</strong></p>
        </div>
      `;
      await sendAutomaticEmail(partner.email, `Sua comiss\xE3o Roder de ${monthName}: ${formatCurrency(totalCommissions)}`, html, { replyTo: financeReplyTo, fromName: "Roder M\xE1quinas" });
    }
  }, {
    timezone: BR_TIMEZONE
  });
  import_node_cron.default.schedule("0 8 5 * *", async () => {
    console.log("[Schedule] Running Day 5 Invoice Reminders...");
    const notifSnap = await db.collection("settings").doc("notifications").get();
    const notif = notifSnap.data();
    if (!notif?.monthly_report_partners) return;
    const now = /* @__PURE__ */ new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const indicationsSnap = await db.collection("indications").where("status", "==", "sold").get();
    const monthlySales = indicationsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => {
      if (!d.updated_at) return false;
      const date = new Date(d.updated_at);
      return date >= lastMonth && date <= endOfLastMonth;
    });
    const sellersMap = {};
    monthlySales.forEach((sale) => {
      const sid = sale.external_seller_uid;
      if (!sellersMap[sid]) sellersMap[sid] = [];
      sellersMap[sid].push(sale);
    });
    for (const [sid, _] of Object.entries(sellersMap)) {
      const salesOfSeller = sellersMap[sid] || [];
      const totalDue = salesOfSeller.reduce((acc, x) => acc + (x.commission_value || 0), 0);
      if (totalDue <= 0) continue;
      const candidates = [
        `${sid}_${lastMonth.getMonth() + 1}_${lastMonth.getFullYear()}`,
        `${sid}_${now.getMonth() + 1}_${now.getFullYear()}`
      ];
      let alreadySent = false;
      for (const stId of candidates) {
        const st = await db.collection("monthly_statements").doc(stId).get();
        const stData = st.exists ? st.data() : null;
        if (stData && (stData.nf_url || stData.status === "waiting_payment" || stData.status === "paid")) {
          alreadySent = true;
          break;
        }
      }
      const needsReminder = !alreadySent;
      if (needsReminder) {
        const partnerData = await db.collection("users").doc(sid).get();
        if (!partnerData.exists) continue;
        const partner = partnerData.data();
        if (!partner.email || partner.email.endsWith("@mobile.roder.com.br")) continue;
        const html = `
          <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #ef4444;">\u26A0\uFE0F AVISO: \xDAltimo dia para envio da Nota Fiscal</h2>
            <p>Ol\xE1 ${partner.name},</p>
            <p>Identificamos que a sua Nota Fiscal referente \xE0s comiss\xF5es do m\xEAs passado ainda n\xE3o foi carregada no sistema.</p>
            
            <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0; font-weight: bold; color: #991b1b;">PRAZO FINAL: HOJE</p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Conforme contrato, o n\xE3o envio da NF at\xE9 o dia 05 (hoje) impossibilita o pagamento neste ciclo. O valor ser\xE1 acumulado para o pagamento do pr\xF3ximo m\xEAs.</p>
            </div>

            <p>Para garantir seu recebimento, <strong>responda este e-mail com a nota fiscal anexada</strong> (vai direto para o nosso financeiro) ou carregue a nota no sistema.</p>
            <a href="${process.env.APP_URL || "https://roder-indica.web.app"}/comissoes" style="display: inline-block; background: #eab308; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Minhas Comiss\xF5es</a>
          </div>
        `;
        await sendAutomaticEmail(partner.email, `\xDAltimo dia para enviar a nota fiscal da sua comiss\xE3o Roder`, html, { replyTo: getFinanceReplyTo(notif), fromName: "Roder M\xE1quinas" });
      }
    }
  }, {
    timezone: BR_TIMEZONE
  });
  import_node_cron.default.schedule("20 * * * *", async () => {
    try {
      const snap = await db.collection("indications").where("finance_notice_pending", "==", true).get();
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      for (const d of snap.docs) {
        const ind = d.data();
        if (ind.status !== "sold" || ind.finance_notice_sent_at) {
          await d.ref.update({ finance_notice_pending: false });
          continue;
        }
        if (!ind.finance_notice_due_at || ind.finance_notice_due_at > nowIso) continue;
        const partner = ind.external_seller_name || "parceiro indicador";
        const equip = ind.base_machine || ind.items && ind.items[0]?.product_name || "equipamento";
        const order = ind.sale_order_number || "";
        const date = String(ind.sale_order_date || ind.sale_date || "").split("-").reverse().join("/");
        const html = `
          <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 620px; font-size: 14px; line-height: 1.6;">
            <p>Ol\xE1, equipe do financeiro!</p>
            <p>Este \xE9 um aviso autom\xE1tico do <strong>Roder Indica</strong>.</p>
            <p>Haver\xE1 uma programa\xE7\xE3o de pagamento de comiss\xE3o para o parceiro indicador <strong>${partner}</strong>, referente \xE0 venda conclu\xEDda abaixo:</p>
            <table style="border-collapse: collapse; font-size: 14px; margin: 12px 0;">
              <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Cliente</td><td><strong>${ind.client_name || ""}</strong></td></tr>
              <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Equipamento</td><td><strong>${equip}</strong></td></tr>
              <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Pedido de venda</td><td><strong>${order ? "n\xBA " + order : "n\xE3o informado"}</strong>${date ? " de " + date : ""}</td></tr>
              <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Comiss\xE3o prevista</td><td><strong>${formatCurrency(ind.commission_value || 0)}</strong></td></tr>
            </table>
            <p>N\xE3o \xE9 preciso fazer nada agora. No in\xEDcio do pr\xF3ximo m\xEAs, voc\xEAs receber\xE3o um e-mail com o valor e a data de pagamento da comiss\xE3o desta venda e de outras vendas de parceiros indicadores, caso aconte\xE7am.</p>
            <p>O parceiro indicador tamb\xE9m receber\xE1 um e-mail autom\xE1tico pedindo a emiss\xE3o da nota fiscal de servi\xE7o pela parceria no Roder Indica.</p>
          </div>`;
        await sendAutomaticEmail("financeiro@roderbrasil.com.br, financeiro2@roderbrasil.com.br", `Roder Indica: comiss\xE3o a programar para ${partner} (pedido ${order || ind.client_name || ""})`, html, { fromName: "Roder Indica" });
        await d.ref.update({ finance_notice_pending: false, finance_notice_sent_at: nowIso });
        console.log(`[FINANCE-NOTICE] Aviso enviado: ${d.id}`);
      }
    } catch (e) {
      console.error("[FINANCE-NOTICE] Erro:", e?.message);
    }
  }, { timezone: "America/Sao_Paulo" });
  import_node_cron.default.schedule("0 8 7 * *", async () => {
    console.log("[Schedule] Generating Day 7 Finance Reminders...");
    const notifSnap = await db.collection("settings").doc("notifications").get();
    const notif = notifSnap.data();
    if (!notif?.payment_reminder_finance) return;
    const financeEmails = [
      "financeiro@roderbrasil.com.br",
      "financeiro2@roderbrasil.com.br",
      "jeferson@roderbrasil.com.br"
    ];
    if (notif.finance_email) {
      const customEmails = String(notif.finance_email).split(",").map((e) => e.trim()).filter((e) => e !== "");
      customEmails.forEach((email) => {
        if (!financeEmails.map((x) => x.toLowerCase()).includes(email.toLowerCase())) {
          financeEmails.push(email);
        }
      });
    }
    const now = /* @__PURE__ */ new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const indicationsSnap = await db.collection("indications").where("status", "==", "sold").get();
    const monthlyCommissions = indicationsSnap.docs.map((d) => d.data()).filter((d) => {
      if (!d.updated_at) return false;
      const date = new Date(d.updated_at);
      return date >= lastMonth && date <= endOfLastMonth;
    }).reduce((acc, curr) => acc + (curr.commission_value || 0), 0);
    if (monthlyCommissions === 0) return;
    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #0f172a;">Lembrete de Pagamento de Comiss\xF5es</h2>
        <p>Ol\xE1 Setor Financeiro / Jeferson,</p>
        <p>Hoje \xE9 dia 7. Lembramos que o valor total de comiss\xF5es calculadas para o fechamento do m\xEAs anterior \xE9 de:</p>
        <div style="font-size: 36px; font-weight: 900; color: #eab308; margin: 20px 0;">${formatCurrency(monthlyCommissions)}</div>
        <p>Ap\xF3s realizar os pagamentos, por favor, certifique que as notas fiscais foram enviadas no sistema e carregue os respectivos comprovantes para notificar os parceiros.</p>
      </div>
    `;
    for (const email of financeEmails) {
      await sendAutomaticEmail(email, `URGENTE: Pagamento de Comiss\xF5es do M\xEAs`, html);
    }
  }, {
    timezone: BR_TIMEZONE
  });
  function getBrtDateParts(dateInput) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return getBrtDateParts(/* @__PURE__ */ new Date());
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    });
    const parts = formatter.formatToParts(d);
    const partMap = {};
    for (const part of parts) {
      partMap[part.type] = part.value;
    }
    const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    let hour = parseInt(partMap.hour, 10);
    if (hour === 24) hour = 0;
    return {
      year: parseInt(partMap.year, 10),
      month: parseInt(partMap.month, 10) - 1,
      day: parseInt(partMap.day, 10),
      dayOfWeek: weekdayMap[partMap.weekday] ?? 0,
      hour,
      minute: parseInt(partMap.minute, 10),
      second: parseInt(partMap.second, 10)
    };
  }
  function createBrtDate(year, month, day, hour, minute) {
    const y = String(year);
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const h = String(hour).padStart(2, "0");
    const min = String(minute).padStart(2, "0");
    return /* @__PURE__ */ new Date(`${y}-${m}-${d}T${h}:${min}:00.000-03:00`);
  }
  function advanceOneDay(year, month, day) {
    const d = new Date(Date.UTC(year, month, day + 1));
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      day: d.getUTCDate()
    };
  }
  function getNextBusinessDay0700(year, month, day, dayOfWeek) {
    let cur = { year, month, day };
    let dow = dayOfWeek;
    do {
      cur = advanceOneDay(cur.year, cur.month, cur.day);
      const tempDate = createBrtDate(cur.year, cur.month, cur.day, 12, 0);
      const tempParts = getBrtDateParts(tempDate);
      dow = tempParts.dayOfWeek;
    } while (dow === 0 || dow === 6);
    return createBrtDate(cur.year, cur.month, cur.day, 7, 0);
  }
  function calculateSlaExpiration(createdAtInput, slaHours = 4) {
    let current = new Date(createdAtInput);
    if (isNaN(current.getTime())) current = /* @__PURE__ */ new Date();
    let remainingMinutes = slaHours * 60;
    let safetyCounter = 0;
    while (remainingMinutes > 0 && safetyCounter < 100) {
      safetyCounter++;
      const parts = getBrtDateParts(current);
      if (parts.dayOfWeek === 0 || parts.dayOfWeek === 6) {
        current = getNextBusinessDay0700(parts.year, parts.month, parts.day, parts.dayOfWeek);
        continue;
      }
      if (parts.hour < 7) {
        current = createBrtDate(parts.year, parts.month, parts.day, 7, 0);
        continue;
      }
      if (parts.hour >= 17) {
        current = getNextBusinessDay0700(parts.year, parts.month, parts.day, parts.dayOfWeek);
        continue;
      }
      const minutesLeftToday = (17 - parts.hour) * 60 - parts.minute;
      if (remainingMinutes <= minutesLeftToday) {
        current = new Date(current.getTime() + remainingMinutes * 6e4);
        remainingMinutes = 0;
      } else {
        remainingMinutes -= minutesLeftToday;
        current = getNextBusinessDay0700(parts.year, parts.month, parts.day, parts.dayOfWeek);
      }
    }
    return current;
  }
  import_node_cron.default.schedule("*/15 * * * *", async () => {
    console.log("[Schedule] Running automatic assignment check for pending leads (SLA 4h \xFAteis BRT)...");
    try {
      const now = /* @__PURE__ */ new Date();
      const pendingSnap = await db.collection("indications").where("status", "==", "pending").get();
      if (pendingSnap.empty) {
        console.log("[Schedule] No pending leads found.");
        return;
      }
      const usersSnap = await db.collection("users").get();
      const utcOffset = now.getTime() + now.getTimezoneOffset() * 6e4;
      const brDate = new Date(utcOffset + 36e5 * -3);
      const year = brDate.getFullYear();
      const month = String(brDate.getMonth() + 1).padStart(2, "0");
      const day = String(brDate.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`;
      const availableSellers = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() })).filter((u) => {
        const isSellerRole = u.role === "internal_seller" || u.role === "triagem" || ["monali", "heloisa", "yury"].some((name) => u.name?.toLowerCase().includes(name));
        if (!isSellerRole) return false;
        if (u.is_lead_receiver === false) return false;
        if (u.vacation_start && u.vacation_end) {
          if (todayStr >= u.vacation_start && todayStr <= u.vacation_end) {
            return false;
          }
        }
        return true;
      });
      if (availableSellers.length === 0) {
        console.warn("[Schedule] No available internal sellers to receive auto-assigned leads.");
        return;
      }
      for (const docRef of pendingSnap.docs) {
        const indData = { id: docRef.id, ...docRef.data() };
        const createdAt = new Date(indData.created_at || now.toISOString());
        const slaExpirationDate = calculateSlaExpiration(createdAt, 4);
        if (now >= slaExpirationDate) {
          console.log(`[Schedule] Auto-assigning pending lead ${indData.id} (${indData.client_name}) due to commercial SLA timeout (4 business hours BRT)...`);
          const sellerLeadCounts = await Promise.all(
            availableSellers.map(async (seller) => {
              const activeCountSnap = await db.collection("indications").where("status", "==", "negotiating").where("internal_seller_uid", "==", seller.uid).get();
              return { seller, count: activeCountSnap.size };
            })
          );
          sellerLeadCounts.sort((a, b) => a.count - b.count);
          const chosenSeller = sellerLeadCounts[0].seller;
          console.log(`[Schedule] Chosen seller for lead ${indData.id}: ${chosenSeller.name} with ${sellerLeadCounts[0].count} active leads.`);
          let partnerData = null;
          if (indData.external_seller_uid) {
            const partnerSnap = await db.collection("users").doc(indData.external_seller_uid).get();
            if (partnerSnap.exists) {
              partnerData = partnerSnap.data();
            }
          }
          const historyEntry = {
            id: Math.random().toString(36).substring(2, 11),
            type: "system",
            author_name: "Sistema Roder",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            content: `[SLA Expirado - 4 Horas \xDAteis]: O limite de triagem (4h \xFAteis no hor\xE1rio comercial de Bras\xEDlia: Seg-Sex 07:00 \xE0s 17:00) expirou. O lead foi distribu\xEDdo automaticamente para o(a) vendedor(a) ${chosenSeller.name} e enviado ao Agendor CRM.`,
            attachments: []
          };
          await db.collection("indications").doc(indData.id).update({
            internal_seller_uid: chosenSeller.uid,
            internal_seller_name: chosenSeller.name,
            status: "negotiating",
            updated_at: (/* @__PURE__ */ new Date()).toISOString(),
            duplicate_reviewed: true,
            negotiation_history: [...indData.negotiation_history || [], historyEntry]
          });
          await db.collection("notifications").add({
            user_uid: chosenSeller.uid,
            title: "Novo Lead Atribu\xEDdo Automaticamente",
            message: `O lead de ${indData.client_name} foi atribu\xEDdo automaticamente a voc\xEA por limite de tempo na triagem.`,
            type: "info",
            read: false,
            link: "/indicacoes?filter=negotiating",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          });
          if (chosenSeller.email) {
            const emailSubjectSeller = `\u{1F4E5} Novo Lead Atribu\xEDdo Automaticamente: ${indData.client_name || "Cliente"} - Fale com o Parceiro ${partnerData?.name || indData.external_seller_name || "Indicador"}`;
            let itemsHtmlList = "";
            if (indData.items && indData.items.length > 0) {
              itemsHtmlList = `
                <div style="margin-top: 15px;">
                  <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: bold; color: #475569; text-transform: uppercase;">Equipamentos Solicitados:</p>
                  <div>
                    ${indData.items.map((item) => `
                      <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: #1e293b; margin-right: 5px; margin-bottom: 5px;">
                        ${item.quantity}x ${item.product_name}
                      </span>
                    `).join("")}
                  </div>
                </div>
              `;
            }
            const emailHtmlSeller = `
              <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background-color: #ffffff;">
                <div style="background-color: #3b82f6; color: white; padding: 24px; text-align: center;">
                  <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder" style="height: 35px; filter: brightness(0) invert(1); margin-bottom: 10px;">
                  <h2 style="margin: 0; text-transform: uppercase; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">Novo Lead Atribu\xEDdo (Autom\xE1tico)</h2>
                  <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Um lead foi direcionado automaticamente para voc\xEA por tempo limite de triagem</p>
                </div>
                
                <div style="padding: 24px; line-height: 1.6;">
                  <p style="font-size: 15px; margin-top: 0;">Ol\xE1 <strong>${chosenSeller.name}</strong>,</p>
                  <p style="font-size: 15px; color: #475569;">O lead do cliente <strong>${indData.client_name || indData.client_person_name || "Cliente"}</strong> foi atribu\xEDdo para a sua carteira e j\xE1 est\xE1 dispon\xEDvel para andamento no <strong>CRM Agendor</strong>.</p>
                  
                  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 18px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #b45309; font-size: 15px; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #fef3c7; padding-bottom: 4px;">
                      Informa\xE7\xF5es do Cliente
                    </h3>
                    <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
                      <tr>
                        <td style="padding: 4px 0; color: #b45309; font-weight: bold; width: 35%;">Cliente:</td>
                        <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${indData.client_name || indData.client_person_name || "N\xE3o informado"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #b45309; font-weight: bold;">Localiza\xE7\xE3o:</td>
                        <td style="padding: 4px 0; color: #1e293b;">${indData.client_location || "N\xE3o informada"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #b45309; font-weight: bold;">WhatsApp / Contato:</td>
                        <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${indData.client_phone || "N\xE3o informado"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #b45309; font-weight: bold;">M\xE1quina Base:</td>
                        <td style="padding: 4px 0; color: #1e293b;">${indData.base_machine || "N\xE3o informada"} ${indData.machine_details || ""}</td>
                      </tr>
                    </table>
                    ${itemsHtmlList}
                    ${indData.description ? `
                      <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #fef3c7;">
                        <p style="margin: 0; font-size: 11px; font-weight: bold; color: #b45309; text-transform: uppercase;">Descri\xE7\xE3o da Necessidade:</p>
                        <p style="margin: 3px 0 0 0; font-size: 12px; color: #475569; font-style: italic;">"${indData.description}"</p>
                      </div>
                    ` : ""}
                  </div>
                  
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; margin: 20px 0; border-radius: 8px;">
                    <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 15px; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                      Parceiro Indicador Respons\xE1vel
                    </h3>
                    <p style="margin: 0 0 10px 0; font-size: 13px; color: #475569;">Este lead foi indicado pelo nosso parceiro credenciado. Entre em contato com ele para alinhar informa\xE7\xF5es antes de ligar para o cliente!</p>
                    <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: bold; width: 35%;">Parceiro:</td>
                        <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${partnerData?.name || indData.external_seller_name || "Parceiro"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: bold;">WhatsApp / Celular:</td>
                        <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">
                          ${partnerData?.phone ? `
                            <a href="https://wa.me/55${partnerData.phone.replace(/\D/g, "")}" style="color: #25d366; text-decoration: none; font-weight: bold;">
                              ${partnerData.phone} \u{1F4AC}
                            </a>
                          ` : "N\xE3o informado"}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: bold;">E-mail:</td>
                        <td style="padding: 4px 0; color: #1e293b;">${partnerData?.email || "N\xE3o informado"}</td>
                      </tr>
                    </table>
                  </div>

                  <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #1e40af;">
                    <strong>\u{1F4A1} Dica de Ouro:</strong> Converse com o parceiro por WhatsApp! Ele pode possuir fotos ou v\xEDdeos da m\xE1quina do cliente, saber detalhes espec\xEDficos da demanda, ou explicar como o cliente prefere ser atendido, garantindo um contato inicial muito mais assertivo e produtivo.
                  </div>

                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://roderindica.roderbrasil.com.br/indicacoes" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">ACESSAR PAINEL DO VENDEDOR</a>
                  </div>
                </div>
              </div>
            `;
            await sendAutomaticEmail(chosenSeller.email, emailSubjectSeller, emailHtmlSeller);
          }
          const partnerEmail = partnerData?.email || indData.client_email;
          if (partnerEmail && partnerEmail.includes("@") && !partnerEmail.endsWith("@mobile.roder.com.br")) {
            const emailSubjectPartner = `\u{1F4BC} Sua indica\xE7\xE3o de ${indData.client_name || "Cliente"} foi encaminhada para ${chosenSeller.name}!`;
            const waLink = chosenSeller.phone ? `https://wa.me/55${chosenSeller.phone.replace(/\D/g, "")}?text=Ol\xE1%20${encodeURIComponent(chosenSeller.name)},%20sou%20o%20parceiro%20${encodeURIComponent(partnerData?.name || "Parceiro")}%20e%20gostaria%20de%20enviar%20informa\xE7\xF5es%20adicionais%20sobre%20a%20indica\xE7\xE3o%20de%20${encodeURIComponent(indData.client_name)}` : "";
            const emailHtmlPartner = `
              <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background-color: #ffffff;">
                <div style="background-color: #10b981; color: white; padding: 24px; text-align: center;">
                  <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder" style="height: 35px; filter: brightness(0) invert(1); margin-bottom: 10px;">
                  <h2 style="margin: 0; text-transform: uppercase; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">Indica\xE7\xE3o em Atendimento!</h2>
                  <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Seu lead j\xE1 foi encaminhado para o setor comercial da f\xE1brica</p>
                </div>
                
                <div style="padding: 24px; line-height: 1.6;">
                  <p style="font-size: 15px; margin-top: 0;">Ol\xE1 <strong>${partnerData?.name || "Parceiro"}</strong>,</p>
                  <p style="font-size: 15px; color: #475569;">Gostar\xEDamos de informar que a sua indica\xE7\xE3o para o cliente <strong>${indData.client_name || "Cliente"}</strong> j\xE1 foi distribu\xEDda (atrav\xE9s de fluxo autom\xE1tico por limite de tempo na triagem) e est\xE1 sob os cuidados do vendedor interno <strong>${chosenSeller.name}</strong>.</p>
                  
                  <!-- Seller Info Card -->
                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; margin: 20px 0; border-radius: 8px;">
                    <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 15px; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #bbf7d0; padding-bottom: 4px;">
                      Vendedor Interno Designado
                    </h3>
                    <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
                      <tr>
                        <td style="padding: 4px 0; color: #15803d; font-weight: bold; width: 35%;">Vendedor(a):</td>
                        <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${chosenSeller.name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #15803d; font-weight: bold;">WhatsApp / Celular:</td>
                        <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">
                          ${chosenSeller.phone ? `
                            <a href="https://wa.me/55${chosenSeller.phone.replace(/\D/g, "")}" style="color: #25d366; text-decoration: none; font-weight: bold;">
                              ${chosenSeller.phone} \u{1F4AC}
                            </a>
                          ` : "N\xE3o informado"}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #15803d; font-weight: bold;">E-mail:</td>
                        <td style="padding: 4px 0; color: #1e293b;">${chosenSeller.email || "N\xE3o informado"}</td>
                      </tr>
                    </table>
                  </div>

                  <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #1e40af; line-height: 1.5;">
                    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">\u{1F4A1} Como voc\xEA pode acelerar o fechamento e ajudar o seu cliente?</p>
                    Se voc\xEA possuir fotos ou v\xEDdeos da m\xE1quina do cliente, marca, modelo ou qualquer detalhe operacional espec\xEDfico sobre essa demanda, **compartilhe diretamente com o(a) vendedor(a) ${chosenSeller.name} por WhatsApp**!
                    <br><br>
                    Dessa forma, o(a) vendedor(a) poder\xE1 **gerar o or\xE7amento correto diretamente baseado nas informa\xE7\xF5es que voc\xEA enviou**, reduzindo burocracias e otimizando o tempo. Ap\xF3s elaborar o or\xE7amento, ele(a) enviar\xE1 uma mensagem informando que a proposta foi feita com base nos detalhes precisos que voc\xEA forneceu.
                  </div>

                  <p style="font-size: 14px; color: #475569;">Esta coopera\xE7\xE3o m\xFAtua garante que alinhemos as melhores expectativas, oferecendo o equipamento perfeitamente dimensionado para o trabalho do cliente.</p>
                  
                  <p style="font-size: 14px; color: #475569;">Voc\xEA pode continuar acompanhando todo o hist\xF3rico e a evolu\xE7\xE3o deste atendimento diretamente no painel do <strong>RODER Indica</strong>.</p>
                </div>
              </div>
            `;
            await sendAutomaticEmail(partnerEmail, emailSubjectPartner, emailHtmlPartner);
          }
          try {
            const baseUrl = `http://localhost:3000`;
            fetch(`${baseUrl}/api/agendor/sync-indication`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ indicationId: indData.id })
            }).catch((e) => console.error("Error triggering auto sync endpoint:", e.message));
          } catch (syncErr) {
            console.error("Failed to trigger Agendor sync for auto-assigned lead:", syncErr.message);
          }
        }
      }
    } catch (error) {
      console.error("[Schedule] Error in automatic lead assignment cron:", error);
    }
  }, {
    timezone: BR_TIMEZONE
  });
  const AGENDOR_DISABLED = true;
  if (AGENDOR_DISABLED) {
    app.use(["/api/agendor", "/api/webhooks/agendor"], (req, res) => {
      res.status(200).json({ success: false, disabled: true, message: "Integra\xE7\xE3o com o Agendor desligada." });
    });
  }
  app.get("/api/admin/agendor-fotos", async (req, res) => {
    try {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return res.status(401).json({ error: "Fa\xE7a login novamente." });
      const decoded = await import_firebase_admin.default.auth().verifyIdToken(token);
      const me = (await db.collection("users").doc(decoded.uid).get()).data();
      const OWNER_EMAILS = ["jeferson@roderbrasil.com.br", "roderbrasil@gmail.com"];
      const myEmail = String(decoded.email || me?.email || "").toLowerCase();
      if (!me || me.role !== "admin" || !OWNER_EMAILS.includes(myEmail)) return res.status(403).json({ error: "Somente o Jeferson." });
      const cfg = (await db.collection("settings").doc("agendor").get()).data();
      const apiToken = cfg?.apiToken;
      if (!apiToken) return res.status(400).json({ error: "Token do Agendor n\xE3o encontrado nas configura\xE7\xF5es." });
      const out = [];
      for (let page = 1; page <= 20; page++) {
        const r = await callAgendor(`products?per_page=100&page=${page}`, "GET", apiToken);
        const arr = Array.isArray(r) ? r : r?.data || [];
        for (const p of arr) {
          const img = p.imageUrl || p.image_url || p.picture || "";
          if (img) out.push({ name: p.name || "", code: p.code || "", imageUrl: img });
        }
        if (arr.length < 100) break;
      }
      res.json({ products: out });
    } catch (e) {
      console.error("[AGENDOR-FOTOS]", e?.message);
      res.status(500).json({ error: e?.message || "Erro ao buscar fotos do Agendor." });
    }
  });
  app.get("/api/admin/agendor-foto", async (req, res) => {
    try {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return res.status(401).send("Fa\xE7a login novamente.");
      await import_firebase_admin.default.auth().verifyIdToken(token);
      const url = String(req.query.url || "");
      if (!/^https:\/\//i.test(url)) return res.status(400).send("URL inv\xE1lida");
      const r = await fetch(url, { redirect: "follow" });
      if (!r.ok) return res.status(502).send("Falha ao baixar a foto");
      const type = r.headers.get("content-type") || "image/jpeg";
      if (!/^image\//i.test(type)) return res.status(415).send("N\xE3o \xE9 imagem");
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader("Content-Type", type);
      res.setHeader("Cache-Control", "no-store");
      res.send(buf);
    } catch (e) {
      res.status(500).send(e?.message || "Erro");
    }
  });
  app.get("/api/documento", async (req, res) => {
    try {
      let url = String(req.query.url || "");
      const publico = /^https:\/\/(www\.)?(roderbrasil\.com\.br|roderindica\.com)\//i.test(url) || /^https:\/\/firebasestorage\.googleapis\.com\/[^?#]*\?(?:[^#]*&)?token=[\w-]{20,}/i.test(url);
      if (publico && passouLimite(`doc-ip:${ipDe(req)}`, 600, 60 * 1e3)) return res.status(429).send("Muitas aberturas seguidas. Tente de novo em instantes.");
      if (!publico) {
        const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
        if (!token) return res.status(401).send("Entre no app para abrir este documento.");
        await import_firebase_admin.default.auth().verifyIdToken(token);
      }
      let host = "";
      try {
        host = new URL(url).hostname.toLowerCase();
      } catch {
        return res.status(400).send("URL inv\xE1lida");
      }
      if (!/^https:\/\//i.test(url)) return res.status(400).send("URL inv\xE1lida");
      const permitidos = ["firebasestorage.googleapis.com", "storage.googleapis.com", "roderbrasil.com.br", "www.roderbrasil.com.br", "drive.google.com", "docs.google.com", "roderindica.com", "www.roderindica.com"];
      if (!permitidos.includes(host)) return res.status(403).send("Este endere\xE7o n\xE3o pode ser aberto dentro do app.");
      const drive = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/);
      if (drive) url = `https://drive.google.com/uc?export=download&id=${drive[1]}`;
      const destinos = [...permitidos, "drive.usercontent.google.com", "doc-0s-docs.googleusercontent.com"];
      let r = null;
      for (let salto = 0; salto < 5; salto++) {
        r = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 (RoderIndica)" } });
        if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
          url = new URL(r.headers.get("location"), url).toString();
          const h = new URL(url).hostname.toLowerCase();
          if (!destinos.includes(h) && !h.endsWith(".googleusercontent.com")) return res.status(403).send("Este endere\xE7o n\xE3o pode ser aberto dentro do app.");
          continue;
        }
        break;
      }
      if (!r.ok) return res.status(502).send("N\xE3o consegui baixar o documento.");
      const LIMITE = 40 * 1024 * 1024;
      if (Number(r.headers.get("content-length") || 0) > LIMITE) return res.status(413).send("Documento grande demais");
      const partes = [];
      let total = 0;
      const leitor = r.body?.getReader ? r.body.getReader() : null;
      if (leitor) {
        for (; ; ) {
          const { done, value } = await leitor.read();
          if (done) break;
          total += value.length;
          if (total > LIMITE) {
            try {
              await leitor.cancel();
            } catch {
            }
            return res.status(413).send("Documento grande demais");
          }
          partes.push(Buffer.from(value));
        }
      } else {
        partes.push(Buffer.from(await r.arrayBuffer()));
      }
      const buf = Buffer.concat(partes);
      if (buf.length > 40 * 1024 * 1024) return res.status(413).send("Documento grande demais");
      const ehPdfArq = buf.subarray(0, 1024).toString("latin1").includes("%PDF-");
      const tipoOrigem = String(r.headers.get("content-type") || "").toLowerCase();
      const ehFoto = /^image\/(jpeg|png|webp|gif)/.test(tipoOrigem) || buf[0] === 255 && buf[1] === 216 || buf[0] === 137 && buf[1] === 80;
      if (!ehPdfArq && !ehFoto) return res.status(415).send("Este arquivo n\xE3o \xE9 PDF nem foto.");
      res.setHeader("Content-Type", ehPdfArq ? "application/pdf" : tipoOrigem.startsWith("image/") ? tipoOrigem : "image/jpeg");
      res.setHeader("Cache-Control", "private, max-age=300");
      res.send(buf);
    } catch (e) {
      res.status(500).send(e?.message || "Erro");
    }
  });
  async function callAgendor(endpoint, method, apiToken, body) {
    const url = `https://api.agendor.com.br/v3/${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Token ${apiToken}`
    };
    const options = {
      method,
      headers
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API do Agendor: ${response.status} - ${errorText}`);
    }
    return await response.json();
  }
  function extractAgendorId(response, preferredKeys = ["id", "organizationId", "organization_id", "dealId", "deal_id", "personId", "person_id"]) {
    if (!response) return null;
    if (Array.isArray(response)) {
      if (response.length > 0) {
        return extractAgendorId(response[0], preferredKeys);
      }
      return null;
    }
    for (const key of preferredKeys) {
      if (response[key] !== void 0 && response[key] !== null) {
        return response[key];
      }
    }
    if (response.data) {
      for (const key of preferredKeys) {
        if (response.data[key] !== void 0 && response.data[key] !== null) {
          return response.data[key];
        }
      }
    }
    const findKeyRecursive = (obj, keys) => {
      if (obj && typeof obj === "object") {
        for (const key of keys) {
          if (key in obj && obj[key] !== void 0 && obj[key] !== null) {
            return obj[key];
          }
        }
        for (const k of Object.keys(obj)) {
          const res = findKeyRecursive(obj[k], keys);
          if (res !== void 0 && res !== null) {
            return res;
          }
        }
      }
      return void 0;
    };
    const recursiveId = findKeyRecursive(response, preferredKeys);
    if (recursiveId !== void 0 && recursiveId !== null) {
      return recursiveId;
    }
    return null;
  }
  function extractAgendorList(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.comments)) return res.comments;
    if (Array.isArray(res.activities)) return res.activities;
    if (Array.isArray(res.tasks)) return res.tasks;
    if (Array.isArray(res.history)) return res.history;
    if (Array.isArray(res.stream)) return res.stream;
    if (Array.isArray(res.results)) return res.results;
    return [];
  }
  app.post("/api/agendor/test", async (req, res) => {
    try {
      const { apiToken, indicatorName, indicatorEmail, indicatorPhone } = req.body;
      if (!apiToken) {
        return res.status(400).json({ error: "Token da API do Agendor n\xE3o fornecido." });
      }
      console.log("[AGENDOR-TEST] Iniciando teste de conex\xE3o end-to-end...");
      let testOrgData = [];
      try {
        testOrgData = await callAgendor("organizations?per_page=1", "GET", apiToken);
        console.log("[AGENDOR-TEST] Passo A (Lista de Empresas) bem-sucedido.");
      } catch (err) {
        console.error("[AGENDOR-TEST] Falha no Passo A (Verifica\xE7\xE3o de Token/Empresas):", err.message);
        return res.status(500).json({
          error: `Falha na verifica\xE7\xE3o do Token de Conex\xE3o (Passo A: GET /v3/organizations): ${err.message}. Verifique se o Token est\xE1 correto e ativo.`
        });
      }
      let usersData = [];
      try {
        usersData = await callAgendor("users", "GET", apiToken);
        console.log("[AGENDOR-TEST] Opcional: Lista de Usu\xE1rios obtida com sucesso. Usu\xE1rios encontrados:", usersData.length || 0);
      } catch (err) {
        console.log("[AGENDOR-TEST] Opcional: N\xE3o foi poss\xEDvel obter lista de usu\xE1rios (geralmente porque o token n\xE3o \xE9 administrador):", err.message);
      }
      const finalIndicatorName = indicatorName || "Jeferson Roder";
      const finalIndicatorEmail = indicatorEmail || "jeferson@roderbrasil.com.br";
      const finalIndicatorPhone = indicatorPhone || "(14) 99811-5110";
      const uniqueSuffix = Math.floor(1e3 + Math.random() * 9e3);
      const testOrgName = `Cliente Fict\xEDcio - Teste RODER Indica (${uniqueSuffix})`;
      const testOrgPayload = {
        name: testOrgName,
        contact: {
          name: "Contato Teste",
          email: "suporte@roder.com.br",
          phones: [{ number: "(11) 98888-8888", type: "mobile" }]
        },
        address: {
          city: "Ara\xE7ariguama",
          state: "SP"
        }
      };
      let organizationId = null;
      let createdOrg = null;
      try {
        console.log("[AGENDOR-TEST] Criando empresa de teste no Agendor...");
        createdOrg = await callAgendor("organizations", "POST", apiToken, testOrgPayload);
        console.log("[AGENDOR-TEST] Resposta do Passo B (Criar Empresa):", JSON.stringify(createdOrg));
        organizationId = extractAgendorId(createdOrg, ["organizationId", "organization_id", "id"]);
        console.log("[AGENDOR-TEST] Passo B (Criar Empresa) bem-sucedido. ID:", organizationId);
        if (!organizationId) {
          return res.status(500).json({
            error: `Falha na extra\xE7\xE3o do ID da empresa criada (Passo B). Chaves retornadas: ${Object.keys(createdOrg || {}).join(", ")}. Resposta completa: ${JSON.stringify(createdOrg)}`
          });
        }
      } catch (err) {
        console.error("[AGENDOR-TEST] Falha no Passo B (Criar Empresa):", err.message);
        return res.status(500).json({
          error: `Falha na cria\xE7\xE3o de empresa de teste (Passo B: POST /v3/organizations): ${err.message}`
        });
      }
      const testDealTitle = `Teste de Integra\xE7\xE3o: RODER Indica V2 - Cliente Fict\xEDcio (${uniqueSuffix})`;
      const testDealPayload = {
        title: testDealTitle,
        description: `\u2605 ORIGEM: RODER Indica V2 (Teste de Conex\xE3o)
\u2605 PARCEIRO INDICADOR: ${finalIndicatorName}
\u2605 EMAIL DO PARCEIRO: ${finalIndicatorEmail}
\u2605 TELEFONE DO PARCEIRO: ${finalIndicatorPhone}

Este \xE9 um teste autom\xE1tico de conex\xE3o gerado a partir do painel administrativo do RODER Indica V2 para validar a perfeita integra\xE7\xE3o e o registro autom\xE1tico de novos leads com informa\xE7\xF5es completas do parceiro indicador.`,
        stage: "lead",
        status: "ongoing",
        organization: organizationId
      };
      let dealId = null;
      let createdDeal = null;
      try {
        console.log("[AGENDOR-TEST] Criando neg\xF3cio (lead) de teste no Agendor...");
        createdDeal = await callAgendor(`organizations/${organizationId}/deals`, "POST", apiToken, testDealPayload);
        console.log("[AGENDOR-TEST] Resposta do Passo C (Criar Neg\xF3cio):", JSON.stringify(createdDeal));
        dealId = extractAgendorId(createdDeal, ["dealId", "deal_id", "id"]);
        console.log("[AGENDOR-TEST] Passo C (Criar Neg\xF3cio) bem-sucedido. ID:", dealId);
        if (!dealId) {
          return res.status(500).json({
            error: `Falha na extra\xE7\xE3o do ID do neg\xF3cio criado (Passo C). Chaves retornadas: ${Object.keys(createdDeal || {}).join(", ")}. Resposta completa: ${JSON.stringify(createdDeal)}`
          });
        }
      } catch (err) {
        console.error("[AGENDOR-TEST] Falha no Passo C (Criar Neg\xF3cio):", err.message);
        return res.status(500).json({
          error: `Falha na cria\xE7\xE3o de neg\xF3cio de teste (Passo C: POST /v3/organizations/${organizationId}/deals): ${err.message}`
        });
      }
      let taskId = null;
      let createdTask = null;
      const testTaskText = `[Teste RODER Indica] Ligar para o contato da empresa ${testOrgName} para dar andamento \xE0 indica\xE7\xE3o de ${finalIndicatorName}.`;
      try {
        console.log("[AGENDOR-TEST] Criando tarefa/atividade de teste no Agendor...");
        const tomorrow = /* @__PURE__ */ new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split(".")[0] + "Z";
        const testTaskPayload = {
          text: testTaskText,
          due_date: tomorrowStr,
          deal: Number(dealId) || void 0,
          organization: Number(organizationId) || void 0
        };
        createdTask = await callAgendor("tasks", "POST", apiToken, testTaskPayload);
        console.log("[AGENDOR-TEST] Resposta do Passo D (Criar Tarefa):", JSON.stringify(createdTask));
        taskId = extractAgendorId(createdTask, ["taskId", "task_id", "id"]);
        console.log("[AGENDOR-TEST] Passo D (Criar Tarefa) bem-sucedido. ID:", taskId);
      } catch (taskErr) {
        console.error("[AGENDOR-TEST] Falha opcional no Passo D (Criar Tarefa):", taskErr.message);
      }
      let finalMessage = `Conex\xE3o efetuada e teste executado com absoluto sucesso! Criamos a empresa de teste "${testOrgName}" (ID ${organizationId}) e o neg\xF3cio de teste "${testDealTitle}" (ID ${dealId})`;
      if (taskId) {
        finalMessage += ` e geramos uma atividade de teste vinculada para amanh\xE3: "${testTaskText}" (ID da tarefa: ${taskId}). Acesse agora a tela de in\xEDcio do seu Agendor, na se\xE7\xE3o de ATIVIDADES, para conferir tudo em tempo real!`;
      } else {
        finalMessage += ` no seu Agendor! Acesse agora o seu CRM Agendor para conferir o novo lead.`;
      }
      return res.json({
        success: true,
        message: finalMessage,
        users: usersData,
        organizationId,
        dealId,
        taskId,
        orgName: testOrgName,
        dealTitle: testDealTitle,
        taskText: testTaskText
      });
    } catch (err) {
      console.error("[AGENDOR-TEST] Erro geral de teste:", err.message);
      return res.status(500).json({ error: err.message || "Erro desconhecido ao testar token de conex\xE3o com o Agendor." });
    }
  });
  async function executeAgendorSync(indicationId, indData, apiToken, forceSyncDeal = true) {
    const status = indData.status || "pending";
    if (status === "pending" && !forceSyncDeal) {
      const updatedSnap2 = await db.collection("indications").doc(indicationId).get();
      return {
        success: true,
        message: "Lead em triagem pendente. A sincroniza\xE7\xE3o do novo neg\xF3cio e da nova empresa no Agendor ser\xE1 disparada automaticamente assim que a Luana atribuir um vendedor.",
        pending: true,
        negotiation_history: updatedSnap2.data()?.negotiation_history || []
      };
    }
    let partnerName = indData.indicator_name || "Indicador Parceiro";
    let partnerCode = indData.indicator_code || "";
    if (indData.indicator_id) {
      try {
        const pSnap = await db.collection("users").doc(indData.indicator_id).get();
        if (pSnap.exists) {
          const pData = pSnap.data();
          partnerName = pData?.full_name || pData?.name || partnerName;
          partnerCode = pData?.partner_code || partnerCode;
        }
      } catch (pErr) {
        console.warn("[AGENDOR-SYNC] N\xE3o foi poss\xEDvel carregar dados do indicador:", pErr);
      }
    }
    let sellerName = indData.seller_name || "";
    let sellerEmail = indData.seller_email || "";
    if (indData.seller_id) {
      try {
        const sSnap = await db.collection("users").doc(indData.seller_id).get();
        if (sSnap.exists) {
          const sData = sSnap.data();
          sellerName = sData?.full_name || sData?.name || sellerName;
          sellerEmail = sData?.email || sellerEmail;
        }
      } catch (sErr) {
        console.warn("[AGENDOR-SYNC] N\xE3o foi poss\xEDvel carregar dados do vendedor:", sErr);
      }
    }
    let agendorUserId = null;
    if (sellerEmail) {
      try {
        const agendorUsersRes = await callAgendor("users", "GET", apiToken);
        const agendorUsersList = extractAgendorList(agendorUsersRes);
        const matchedUser = agendorUsersList.find(
          (u) => u.email && u.email.toLowerCase().trim() === sellerEmail.toLowerCase().trim()
        );
        if (matchedUser && matchedUser.id) {
          agendorUserId = matchedUser.id;
          console.log(`[AGENDOR-SYNC] Vendedor correspondente no Agendor localizado: ${matchedUser.name} (ID ${matchedUser.id}) para email ${sellerEmail}`);
        } else {
          console.warn(`[AGENDOR-SYNC] Nenhum usu\xE1rio com email ${sellerEmail} encontrado no Agendor. Usando usu\xE1rio padr\xE3o do Token.`);
        }
      } catch (userErr) {
        console.warn("[AGENDOR-SYNC] Falha ao listar usu\xE1rios do Agendor para mapeamento de vendedor:", userErr.message);
      }
    }
    const rawClientName = (indData.client_name || indData.contact_name || "").trim();
    const rawCompanyName = (indData.client_company_name || indData.company_name || "").trim();
    const companyDisplayName = rawCompanyName || rawClientName || "Cliente Roder Indica";
    const realClientName = rawClientName || rawCompanyName || "Contato N\xE3o Informado";
    const clientPhone = indData.client_phone || "";
    const clientEmail = indData.client_email || "";
    const clientCnpj = indData.client_cnpj || "";
    const clientLocation = indData.client_location || "";
    const equipment = indData.equipment || indData.machine_model || "Equipamento Roder";
    const baseValue = indData.base_commission_value || indData.estimated_value || 0;
    const dealValue = typeof baseValue === "number" ? baseValue : parseFloat(baseValue) || 0;
    let dealId = indData.agendor_deal_id || null;
    let organizationId = indData.agendor_organization_id || null;
    let personId = indData.agendor_person_id || null;
    if (!dealId || !organizationId) {
      const orgPayload = {
        name: companyDisplayName,
        contact: {
          name: realClientName
        },
        description: `Lead cadastrado via Roder Indica V2 por ${partnerName}. Equipamento de interesse: ${equipment}.`,
        phones: clientPhone ? [{ number: clientPhone }] : [],
        emails: clientEmail ? [{ email: clientEmail }] : []
      };
      if (clientCnpj && clientCnpj !== "N\xE3o informado") {
        orgPayload.cnpj = clientCnpj.replace(/\D/g, "");
      }
      if (clientLocation) {
        const parts = clientLocation.split("/");
        if (parts.length >= 2) {
          orgPayload.address = {
            city: parts[0].trim(),
            state: parts[1].trim()
          };
        }
      }
      if (agendorUserId) {
        orgPayload.user = agendorUserId;
      }
      console.log(`[AGENDOR-SYNC] Criando nova Empresa ISOLADA no Agendor:`, orgPayload);
      try {
        const orgResult = await callAgendor("organizations", "POST", apiToken, orgPayload);
        organizationId = extractAgendorId(orgResult, ["organizationId", "organization_id", "id"]);
        console.log(`[AGENDOR-SYNC] Nova Empresa isolada criada com sucesso no Agendor (ID #${organizationId})`);
      } catch (orgErr) {
        console.error("[AGENDOR-SYNC] Erro ao criar nova Empresa no Agendor:", orgErr.message);
        try {
          delete orgPayload.cnpj;
          orgPayload.name = `${companyDisplayName} (Roder Indica)`;
          const fallbackOrg = await callAgendor("organizations", "POST", apiToken, orgPayload);
          organizationId = extractAgendorId(fallbackOrg, ["organizationId", "organization_id", "id"]);
          console.log(`[AGENDOR-SYNC] Empresa criada via fallback de isolamento no Agendor (ID #${organizationId})`);
        } catch (fErr) {
          console.error("[AGENDOR-SYNC] Falha no fallback de cria\xE7\xE3o de Empresa:", fErr.message);
        }
      }
    }
    let funnelId = null;
    let sdrStageId = "lead";
    try {
      const funnelsRes = await callAgendor("funnels", "GET", apiToken);
      const funnelsList = extractAgendorList(funnelsRes);
      const matchedFunnel = funnelsList.find(
        (f) => f.name && (f.name.toLowerCase().includes("pr\xE9 venda") || f.name.toLowerCase().includes("pre venda") || f.name.toLowerCase().includes("prospec\xE7\xE3o") || f.name.toLowerCase().includes("sdr"))
      ) || funnelsList[0];
      if (matchedFunnel) {
        funnelId = matchedFunnel.id;
        if (Array.isArray(matchedFunnel.stages) && matchedFunnel.stages.length > 0) {
          sdrStageId = matchedFunnel.stages[0].id || matchedFunnel.stages[0].stage_id || sdrStageId;
        }
        console.log(`[AGENDOR-SYNC] Funil de Pr\xE9-Venda / SDR localizado: "${matchedFunnel.name}" (ID ${funnelId})`);
      }
    } catch (funnelErr) {
      console.warn("[AGENDOR-SYNC] Falha ao listar funis do Agendor:", funnelErr.message);
    }
    const dealTitle = `${companyDisplayName} - ${equipment}`;
    if (!dealId) {
      const dealPayload = {
        title: dealTitle,
        value: dealValue,
        description: `Lead cadastrado via Roder Indica V2.
\u2022 Empresa: ${companyDisplayName}
\u2022 Contato: ${realClientName}
\u2022 Telefone: ${clientPhone || "N\xE3o informado"}
\u2022 Email: ${clientEmail || "N\xE3o informado"}
\u2022 Equipamento: ${equipment}
\u2022 Indicador Parceiro: ${partnerName} (${partnerCode})
\u2022 Vendedor Alocado: ${sellerName || "N\xE3o atribu\xEDdo"}`
      };
      if (organizationId) {
        dealPayload.organization = organizationId;
      }
      if (personId) {
        dealPayload.person = personId;
      }
      if (agendorUserId) {
        dealPayload.user = agendorUserId;
      }
      if (funnelId) {
        dealPayload.funnel = funnelId;
      }
      console.log(`[AGENDOR-SYNC] Criando novo Neg\xF3cio ISOLADO no Agendor:`, dealPayload);
      try {
        const dealResult = await callAgendor("deals", "POST", apiToken, dealPayload);
        dealId = extractAgendorId(dealResult, ["dealId", "deal_id", "id"]);
        console.log(`[AGENDOR-SYNC] Novo Neg\xF3cio isolado criado com sucesso no Agendor (ID #${dealId})`);
      } catch (dealErr) {
        console.error("[AGENDOR-SYNC] Erro ao criar Neg\xF3cio no Agendor:", dealErr.message);
        delete dealPayload.funnel;
        delete dealPayload.user;
        try {
          const retryResult = await callAgendor("deals", "POST", apiToken, dealPayload);
          dealId = extractAgendorId(retryResult, ["dealId", "deal_id", "id"]);
        } catch (retryErr) {
          console.error("[AGENDOR-SYNC] Falha no retry de cria\xE7\xE3o do Neg\xF3cio:", retryErr.message);
        }
      }
    }
    if (dealId) {
      try {
        const commentNote = `\u2605 PROPOSTA / INDICA\xC7\xC3O REGISTRADA VIA RODER INDICA V2
\u2022 ID Indica\xE7\xE3o: ${indicationId}
\u2022 Empresa (Aba Empresas): ${companyDisplayName}
\u2022 Contato do Cliente: ${realClientName}
\u2022 Telefone: ${clientPhone || "N\xE3o informado"}
\u2022 Email: ${clientEmail || "N\xE3o informado"}
\u2022 CNPJ: ${clientCnpj || "N\xE3o informado"}
\u2022 Localiza\xE7\xE3o: ${clientLocation || "N\xE3o informada"}
\u2022 Equipamento Solicitado: ${equipment}
\u2022 Valor Estimado: R$ ${dealValue ? dealValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}
\u2022 Indicador Parceiro: ${partnerName} (C\xF3digo: ${partnerCode || "N/A"})
\u2022 Vendedor Comercial Respons\xE1vel: ${sellerName || "N\xE3o atribu\xEDdo"}`;
        await callAgendor(`deals/${dealId}/comments`, "POST", apiToken, { text: commentNote });
      } catch (cErr) {
        console.warn("[AGENDOR-SYNC] N\xE3o foi poss\xEDvel adicionar coment\xE1rio de resumo no neg\xF3cio:", cErr.message);
      }
    }
    const sentValueFormatted = dealValue && dealValue > 0 ? `R$ ${Number(dealValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "N\xE3o informado";
    const syncHistoryEntry = {
      id: Math.random().toString(36).substring(2, 11),
      type: "system",
      author_name: "CRM Agendor",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      content: `[Sincroniza\xE7\xE3o CRM Agendor - Funil Pr\xE9-Venda / SDR]: Indica\xE7\xE3o integrada e enviada para o funil "Funil Pr\xE9 venda - Prospec\xE7\xE3o" do Agendor CRM com sucesso!

\u2605 DADOS ENVIADOS PARA O CRM:
\u2022 T\xEDtulo do Neg\xF3cio: "${dealTitle}"
\u2022 Funil / Categoria: "Funil Pr\xE9 venda - Prospec\xE7\xE3o" (SDR)
\u2022 Est\xE1gio Inicial: "${indData.agendor_stage === "lead" ? "Prospec\xE7\xE3o (SDR)" : indData.agendor_stage || "Prospec\xE7\xE3o"}"
\u2022 Empresa (Aba Empresas): "${companyDisplayName}"
\u2022 Contato do Cliente: "${realClientName}"
\u2022 Telefone de Contato: "${clientPhone || "N\xE3o informado"}"
\u2022 Valor Estimado: ${sentValueFormatted}
\u2022 Vendedor Comercial: "${sellerName || "N\xE3o atribu\xEDdo"}"
\u2022 Parceiro Indicador: "${partnerName}"

\u2605 DADOS RECEBIDOS DO CRM (REFER\xCANCIAS):
\u2022 ID do Neg\xF3cio (Deal ID): ${dealId}
\u2022 ID da Empresa (Org ID): ${organizationId || "N\xE3o criada"}
\u2022 ID da Pessoa (Person ID): ${personId || "N\xE3o criada"}`
    };
    await db.collection("indications").doc(indicationId).update({
      agendor_synced: true,
      agendor_deal_id: dealId,
      agendor_person_id: personId,
      agendor_organization_id: organizationId,
      agendor_synced_at: (/* @__PURE__ */ new Date()).toISOString(),
      negotiation_history: import_firebase_admin.default.firestore.FieldValue.arrayUnion(syncHistoryEntry)
    });
    const updatedSnap = await db.collection("indications").doc(indicationId).get();
    const updatedData = updatedSnap.data();
    return {
      success: true,
      message: "Indica\xE7\xE3o integrada e sincronizada no Agendor CRM com sucesso!",
      dealId,
      personId,
      organizationId,
      negotiation_history: updatedData?.negotiation_history || []
    };
  }
  async function syncAndPullAgendorDetails(indicationId, indData, apiToken) {
    let dealId = indData.agendor_deal_id;
    let dealDetails = null;
    if (dealId) {
      try {
        const dealRes = await callAgendor(`deals/${dealId}`, "GET", apiToken);
        if (dealRes && !dealRes.error && (dealRes.id || dealRes.data?.id)) {
          dealDetails = dealRes.data || dealRes;
        }
      } catch (err) {
        console.warn(`[AGENDOR-PULL] Neg\xF3cio #${dealId} n\xE3o localizado no Agendor CRM:`, err.message);
        dealDetails = null;
      }
    }
    if (!dealId || !dealDetails) {
      console.log(`[AGENDOR-PULL] Lead da indica\xE7\xE3o ${indicationId} n\xE3o cadastrado ou n\xE3o encontrado no Agendor CRM. Registrando automaticamente...`);
      try {
        const syncRes = await executeAgendorSync(indicationId, indData, apiToken, true);
        if (syncRes && syncRes.dealId) {
          dealId = syncRes.dealId;
          const freshSnap = await db.collection("indications").doc(indicationId).get();
          if (freshSnap.exists) {
            indData = freshSnap.data() || indData;
          }
          try {
            const newDealRes = await callAgendor(`deals/${dealId}`, "GET", apiToken);
            dealDetails = newDealRes?.data || newDealRes;
          } catch (e) {
            console.warn(`[AGENDOR-PULL] Falha ao obter detalhes do novo neg\xF3cio #${dealId}:`, e.message);
          }
        } else if (syncRes && syncRes.pending) {
          return { pulled: false, newHistoryCount: 0, message: "Lead em triagem pendente no Roder Indica." };
        }
      } catch (syncErr) {
        console.error(`[AGENDOR-PULL] Erro na sincroniza\xE7\xE3o autom\xE1tica para o Agendor:`, syncErr.message);
        return { pulled: false, newHistoryCount: 0, message: `Erro ao cadastrar lead no CRM: ${syncErr.message}` };
      }
    }
    if (!dealId) {
      return { pulled: false, newHistoryCount: 0, message: "Sem ID de neg\xF3cio do Agendor." };
    }
    console.log(`[AGENDOR-PULL] Buscando atualiza\xE7\xF5es e hist\xF3rico do neg\xF3cio #${dealId} no Agendor...`);
    const updates = {
      agendor_synced: true,
      agendor_synced_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const historyEntriesToAdd = [];
    const existingHistory = Array.isArray(indData.negotiation_history) ? indData.negotiation_history : [];
    const extractAgendorList2 = (res) => {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.items)) return res.items;
      if (Array.isArray(res.comments)) return res.comments;
      if (Array.isArray(res.activities)) return res.activities;
      if (Array.isArray(res.tasks)) return res.tasks;
      if (Array.isArray(res.history)) return res.history;
      if (Array.isArray(res.stream)) return res.stream;
      if (Array.isArray(res.results)) return res.results;
      return [];
    };
    const isAlreadyInHistory = (itemId, rawText) => {
      const cleanText = (rawText || "").trim();
      if (!cleanText) return true;
      const idStr = itemId !== void 0 && itemId !== null ? String(itemId).trim() : "";
      const checkMatch = (h) => {
        if (!h) return false;
        if (idStr && (h.agendor_id === idStr || h.id === `agendor-${idStr}` || h.id === `agendor-comment-${idStr}` || h.id === `agendor-act-${idStr}` || h.id === `agendor-task-${idStr}` || h.id === `agendor-pcomm-${idStr}` || h.id === `agendor-ocomm-${idStr}`)) {
          return true;
        }
        if (idStr && h.content && (h.content.includes(`ID #${idStr}]`) || h.content.includes(`[CRM Agendor #${idStr}]`))) {
          return true;
        }
        if (h.content) {
          if (h.content === cleanText) return true;
          if (cleanText.length >= 15 && h.content.includes(cleanText)) return true;
        }
        return false;
      };
      return existingHistory.some(checkMatch) || historyEntriesToAdd.some(checkMatch);
    };
    if (!dealDetails) {
      try {
        const dealRes = await callAgendor(`deals/${dealId}`, "GET", apiToken);
        dealDetails = dealRes?.data || dealRes;
      } catch (err) {
        console.warn(`[AGENDOR-PULL] N\xE3o foi poss\xEDvel obter detalhes do neg\xF3cio #${dealId}:`, err.message);
      }
    }
    if (dealDetails) {
      const newStage = dealDetails.stage?.id || dealDetails.stage || dealDetails.stage_id;
      if (newStage && typeof newStage === "string" && newStage !== indData.agendor_stage) {
        updates.agendor_stage = newStage;
        const stageLabels = {
          lead: "Lead (Triagem)",
          contact: "Contato Iniciado",
          proposal: "Proposta / Or\xE7amento Enviado",
          negotiation: "Negocia\xE7\xE3o Em Andamento",
          won: "Ganho / Venda Realizada",
          lost: "Perdido"
        };
        const stageLabel = stageLabels[newStage] || newStage;
        historyEntriesToAdd.push({
          id: `agendor-stage-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: "status_change",
          author_name: "CRM Agendor",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          content: `Est\xE1gio da negocia\xE7\xE3o atualizado no Agendor CRM para: "${stageLabel}".`
        });
        const isProposal = newStage.toLowerCase().includes("propos") || newStage.toLowerCase().includes("or\xE7am") || newStage.toLowerCase() === "proposal";
        if (isProposal && !indData.budget_sent_at) {
          const now = /* @__PURE__ */ new Date();
          updates.budget_sent_at = now.toISOString();
          updates.protection_expires_at = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1e3).toISOString();
          historyEntriesToAdd.push({
            id: `agendor-prot-${Date.now()}`,
            type: "status_change",
            author_name: "CRM Agendor",
            created_at: now.toISOString(),
            content: `[Prote\xE7\xE3o de Vendas 60 dias]: In\xEDcio da janela de prote\xE7\xE3o do lead registrado a partir da proposta enviada no Agendor. V\xE1lida at\xE9 ${new Date(now.getTime() + 60 * 24 * 60 * 60 * 1e3).toLocaleDateString("pt-BR")}.`
          });
        }
      }
      const newStatus = dealDetails.status;
      if (newStatus && newStatus !== indData.agendor_status) {
        updates.agendor_status = newStatus;
        if (newStatus === "won") {
          updates.status = "sold";
          historyEntriesToAdd.push({
            id: `agendor-won-${Date.now()}`,
            type: "status_change",
            author_name: "CRM Agendor",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            content: `O neg\xF3cio foi marcado como GANHO no Agendor CRM!`
          });
        } else if (newStatus === "lost") {
          updates.status = "cancelled";
          historyEntriesToAdd.push({
            id: `agendor-lost-${Date.now()}`,
            type: "status_change",
            author_name: "CRM Agendor",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            content: `O neg\xF3cio foi marcado como PERDIDO no Agendor CRM.`
          });
        }
      }
      if (dealDetails.value !== void 0 && dealDetails.value !== null) {
        const numVal = parseFloat(dealDetails.value);
        if (numVal > 0 && numVal !== indData.base_commission_value) {
          updates.base_commission_value = numVal;
        }
      }
    }
    try {
      const rawCommentsRes = await Promise.all([
        callAgendor(`deals/${dealId}/comments`, "GET", apiToken).catch(() => null),
        callAgendor(`comments?deal_id=${dealId}`, "GET", apiToken).catch(() => null),
        callAgendor(`comments?deal=${dealId}`, "GET", apiToken).catch(() => null)
      ]);
      const commentsList = [
        ...extractAgendorList2(rawCommentsRes[0]),
        ...extractAgendorList2(rawCommentsRes[1]),
        ...extractAgendorList2(rawCommentsRes[2])
      ];
      for (const comment of commentsList) {
        const commentId = comment.id || comment.commentId || comment.comment_id;
        const commentText = comment.text || comment.content || comment.note || comment.body || comment.comment || comment.description || comment.details || "";
        if (!commentText.trim()) continue;
        if (!isAlreadyInHistory(commentId, commentText)) {
          const authorName = comment.user?.name || comment.user?.fullName || comment.author?.name || comment.creator?.name || comment.owner?.name || "Vendedor Comercial (CRM Agendor)";
          const commentDate = comment.createdAt || comment.created_at || comment.date || comment.updatedAt || comment.updated_at || (/* @__PURE__ */ new Date()).toISOString();
          const rawAtts = comment.attachments || comment.files || comment.file || [];
          const attsArray = Array.isArray(rawAtts) ? rawAtts : rawAtts ? [rawAtts] : [];
          const attachments = attsArray.filter((a) => a && (a.url || a.file_url || a.link)).map((a) => ({
            name: a.name || a.title || a.filename || "Anexo",
            url: a.url || a.file_url || a.link
          }));
          historyEntriesToAdd.push({
            id: commentId ? `agendor-comment-${commentId}` : `agendor-comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            agendor_id: commentId ? String(commentId) : void 0,
            type: "note",
            author_name: `${authorName}`,
            created_at: commentDate,
            content: `[CRM Agendor${commentId ? " ID #" + commentId : ""} - ${authorName}]:
${commentText.trim()}`,
            attachments: attachments.length > 0 ? attachments : void 0
          });
        }
      }
    } catch (commErr) {
      console.warn(`[AGENDOR-PULL] N\xE3o foi poss\xEDvel buscar coment\xE1rios para #${dealId}:`, commErr.message);
    }
    try {
      const rawActRes = await Promise.all([
        callAgendor(`deals/${dealId}/activities`, "GET", apiToken).catch(() => null),
        callAgendor(`activities?deal_id=${dealId}`, "GET", apiToken).catch(() => null),
        callAgendor(`deals/${dealId}/stream`, "GET", apiToken).catch(() => null),
        callAgendor(`deals/${dealId}/history`, "GET", apiToken).catch(() => null),
        callAgendor(`deals/${dealId}/timeline`, "GET", apiToken).catch(() => null)
      ]);
      const actList = [
        ...extractAgendorList2(rawActRes[0]),
        ...extractAgendorList2(rawActRes[1]),
        ...extractAgendorList2(rawActRes[2]),
        ...extractAgendorList2(rawActRes[3]),
        ...extractAgendorList2(rawActRes[4])
      ];
      for (const act of actList) {
        const actId = act.id || act.activityId || act.activity_id || act.historyId;
        const actText = act.text || act.content || act.note || act.description || act.body || act.title || act.summary || act.details || "";
        if (!actText.trim()) continue;
        if (!isAlreadyInHistory(actId, actText)) {
          const authorName = act.user?.name || act.author?.name || act.creator?.name || act.owner?.name || "Vendedor Comercial (CRM Agendor)";
          const actDate = act.createdAt || act.created_at || act.date || act.updatedAt || act.time || (/* @__PURE__ */ new Date()).toISOString();
          const actType = act.type || act.category || act.activity_type || "Hist\xF3rico/Atividade";
          const rawAtts = act.attachments || act.files || act.file || [];
          const attsArray = Array.isArray(rawAtts) ? rawAtts : rawAtts ? [rawAtts] : [];
          const attachments = attsArray.filter((a) => a && (a.url || a.file_url || a.link)).map((a) => ({
            name: a.name || a.title || a.filename || "Anexo",
            url: a.url || a.file_url || a.link
          }));
          historyEntriesToAdd.push({
            id: actId ? `agendor-act-${actId}` : `agendor-act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            agendor_id: actId ? String(actId) : void 0,
            type: "note",
            author_name: `${authorName}`,
            created_at: actDate,
            content: `[CRM Agendor (${actType})${actId ? " ID #" + actId : ""} - ${authorName}]:
${actText.trim()}`,
            attachments: attachments.length > 0 ? attachments : void 0
          });
        }
      }
    } catch (actErr) {
      console.warn(`[AGENDOR-PULL] N\xE3o foi poss\xEDvel buscar atividades/stream para #${dealId}:`, actErr.message);
    }
    try {
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1e3).toISOString();
      const rawTasksRes = await Promise.all([
        callAgendor(`deals/${dealId}/tasks`, "GET", apiToken).catch(() => null),
        callAgendor(`deals/${dealId}/tasks?status=all`, "GET", apiToken).catch(() => null),
        callAgendor(`tasks?deal_id=${dealId}`, "GET", apiToken).catch(() => null),
        callAgendor(`tasks?deal=${dealId}`, "GET", apiToken).catch(() => null),
        callAgendor(`tasks?createdDateGt=${sixtyDaysAgo}`, "GET", apiToken).catch(() => null),
        callAgendor(`tasks?status=all&createdDateGt=${sixtyDaysAgo}`, "GET", apiToken).catch(() => null)
      ]);
      const tasksList = [
        ...extractAgendorList2(rawTasksRes[0]),
        ...extractAgendorList2(rawTasksRes[1]),
        ...extractAgendorList2(rawTasksRes[2]),
        ...extractAgendorList2(rawTasksRes[3]),
        ...extractAgendorList2(rawTasksRes[4]),
        ...extractAgendorList2(rawTasksRes[5])
      ];
      const targetOrgId = dealDetails?.organization?.id || dealDetails?.organization_id ? String(dealDetails?.organization?.id || dealDetails?.organization_id) : null;
      const targetPersonId = dealDetails?.person?.id || dealDetails?.person_id ? String(dealDetails?.person?.id || dealDetails?.person_id) : null;
      const targetDealId = dealId ? String(dealId) : null;
      for (const task of tasksList) {
        const taskId = task.id || task.taskId || task.task_id;
        const taskText = task.text || task.title || task.description || task.note || task.content || "";
        if (!taskText.trim()) continue;
        const taskDealId = typeof task.deal === "object" ? String(task.deal?.id || task.deal?.deal_id || "") : String(task.deal || task.deal_id || task.dealId || "");
        const taskOrgId = typeof task.organization === "object" ? String(task.organization?.id || "") : String(task.organization || task.organization_id || "");
        const taskPersonId = typeof task.person === "object" ? String(task.person?.id || "") : String(task.person || task.person_id || "");
        const isMatch = targetDealId && (taskDealId === targetDealId || taskDealId.includes(targetDealId)) || targetOrgId && taskOrgId === targetOrgId || targetPersonId && taskPersonId === targetPersonId;
        if (isMatch && !isAlreadyInHistory(taskId, taskText)) {
          const authorName = task.finishedBy?.name || task.user?.name || task.assignedTo?.name || task.author?.name || "Vendedor Comercial (CRM Agendor)";
          const taskDate = task.finishedAt || task.createdAt || task.updatedAt || task.dueDate || (/* @__PURE__ */ new Date()).toISOString();
          const taskType = task.type || task.category || "WhatsApp / Liga\xE7\xE3o";
          const rawAtts = task.attachments || task.files || task.file || [];
          const attsArray = Array.isArray(rawAtts) ? rawAtts : rawAtts ? [rawAtts] : [];
          const attachments = attsArray.filter((a) => a && (a.url || a.file_url || a.link)).map((a) => ({
            name: a.name || a.title || a.filename || "Anexo",
            url: a.url || a.file_url || a.link
          }));
          historyEntriesToAdd.push({
            id: taskId ? `agendor-task-${taskId}` : `agendor-task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            agendor_id: taskId ? String(taskId) : void 0,
            type: "note",
            author_name: authorName,
            created_at: taskDate,
            content: `[CRM Agendor (${taskType})${task.finished ? " \u2713 Finalizada" : ""} - ${authorName}]:
${taskText.trim()}`,
            attachments: attachments.length > 0 ? attachments : void 0
          });
        }
      }
    } catch (taskErr) {
      console.warn(`[AGENDOR-PULL] N\xE3o foi poss\xEDvel buscar tarefas/atividades para #${dealId}:`, taskErr.message);
    }
    const personId = indData.agendor_person_id || dealDetails?.person?.id || dealDetails?.person;
    if (personId) {
      try {
        const pComments = await callAgendor(`people/${personId}/comments`, "GET", apiToken).catch(() => null);
        const pList = extractAgendorList2(pComments);
        for (const comment of pList) {
          const commentId = comment.id || comment.commentId || comment.comment_id;
          const commentText = comment.text || comment.content || comment.note || comment.body || comment.comment || comment.description || "";
          if (!commentText.trim()) continue;
          if (!isAlreadyInHistory(commentId, commentText)) {
            const authorName = comment.user?.name || comment.author?.name || "Vendedor Comercial (CRM Agendor)";
            const commentDate = comment.createdAt || comment.created_at || comment.date || (/* @__PURE__ */ new Date()).toISOString();
            historyEntriesToAdd.push({
              id: commentId ? `agendor-pcomm-${commentId}` : `agendor-pcomm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              agendor_id: commentId ? String(commentId) : void 0,
              type: "note",
              author_name: `${authorName}`,
              created_at: commentDate,
              content: `[CRM Agendor (Contato)${commentId ? " ID #" + commentId : ""} - ${authorName}]:
${commentText.trim()}`
            });
          }
        }
      } catch (pCommErr) {
        console.warn(`[AGENDOR-PULL] N\xE3o foi poss\xEDvel buscar coment\xE1rios do contato #${personId}:`, pCommErr.message);
      }
    }
    const organizationId = indData.agendor_organization_id || dealDetails?.organization?.id || dealDetails?.organization;
    if (organizationId) {
      try {
        const oComments = await callAgendor(`organizations/${organizationId}/comments`, "GET", apiToken).catch(() => null);
        const oList = extractAgendorList2(oComments);
        for (const comment of oList) {
          const commentId = comment.id || comment.commentId || comment.comment_id;
          const commentText = comment.text || comment.content || comment.note || comment.body || comment.comment || comment.description || "";
          if (!commentText.trim()) continue;
          if (!isAlreadyInHistory(commentId, commentText)) {
            const authorName = comment.user?.name || comment.author?.name || "Vendedor Comercial (CRM Agendor)";
            const commentDate = comment.createdAt || comment.created_at || comment.date || (/* @__PURE__ */ new Date()).toISOString();
            historyEntriesToAdd.push({
              id: commentId ? `agendor-ocomm-${commentId}` : `agendor-ocomm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              agendor_id: commentId ? String(commentId) : void 0,
              type: "note",
              author_name: `${authorName}`,
              created_at: commentDate,
              content: `[CRM Agendor (Empresa)${commentId ? " ID #" + commentId : ""} - ${authorName}]:
${commentText.trim()}`
            });
          }
        }
      } catch (oCommErr) {
        console.warn(`[AGENDOR-PULL] N\xE3o foi poss\xEDvel buscar coment\xE1rios da organiza\xE7\xE3o #${organizationId}:`, oCommErr.message);
      }
    }
    if (historyEntriesToAdd.length > 0) {
      updates.negotiation_history = import_firebase_admin.default.firestore.FieldValue.arrayUnion(...historyEntriesToAdd);
    }
    await db.collection("indications").doc(indicationId).update(updates);
    return {
      pulled: true,
      newHistoryCount: historyEntriesToAdd.length,
      updates
    };
  }
  app.post("/api/agendor/add-comment", async (req, res) => {
    try {
      const { indicationId, content, authorName, attachments } = req.body;
      if (!indicationId) {
        return res.status(400).json({ error: "Par\xE2metro 'indicationId' \xE9 obrigat\xF3rio." });
      }
      console.log(`[AGENDOR-COMMENT] Novo acompanhamento recebido para indica\xE7\xE3o #${indicationId}. Sincronizando com Agendor CRM...`);
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) {
        return res.status(400).json({ error: "Integra\xE7\xE3o com Agendor n\xE3o configurada." });
      }
      const agendorConfig = settingsSnap.data();
      if (!agendorConfig.apiToken || !agendorConfig.enabled) {
        return res.status(400).json({ error: "Integra\xE7\xE3o com Agendor desabilitada ou sem token." });
      }
      const apiToken = agendorConfig.apiToken;
      const indSnap = await db.collection("indications").doc(indicationId).get();
      if (!indSnap.exists) {
        return res.status(404).json({ error: "Indica\xE7\xE3o n\xE3o encontrada." });
      }
      const indData = indSnap.data();
      const dealId = indData.agendor_deal_id;
      const personId = indData.agendor_person_id;
      const organizationId = indData.agendor_organization_id;
      let commentText = `[Acompanhamento RODER Indica - ${authorName || "Parceiro/Vendedor"}]
${content || ""}`;
      if (Array.isArray(attachments) && attachments.length > 0) {
        commentText += `

\u{1F4F7} Anexos/Fotos (${attachments.length}):
` + attachments.map((a) => `- ${a.name || "Arquivo"}: ${a.url}`).join("\n");
      }
      let pushed = false;
      let pushError = null;
      if (dealId) {
        try {
          await callAgendor(`deals/${dealId}/comments`, "POST", apiToken, { text: commentText });
          pushed = true;
          console.log(`[AGENDOR-COMMENT] Coment\xE1rio enviado com sucesso para o neg\xF3cio #${dealId}`);
        } catch (err1) {
          console.warn(`[AGENDOR-COMMENT] Falha em /deals/${dealId}/comments, tentando /comments:`, err1.message);
          try {
            await callAgendor(`comments`, "POST", apiToken, { deal_id: Number(dealId), text: commentText });
            pushed = true;
            console.log(`[AGENDOR-COMMENT] Coment\xE1rio enviado via /comments para o neg\xF3cio #${dealId}`);
          } catch (err2) {
            pushError = err2.message;
            console.error(`[AGENDOR-COMMENT] Erro ao postar coment\xE1rio no neg\xF3cio:`, err2.message);
          }
        }
      }
      if (organizationId) {
        try {
          await callAgendor(`organizations/${organizationId}/comments`, "POST", apiToken, { text: commentText });
          pushed = true;
          console.log(`[AGENDOR-COMMENT] Coment\xE1rio enviado com sucesso para a empresa #${organizationId}`);
        } catch (oErr) {
          console.warn(`[AGENDOR-COMMENT] Falha em /organizations/${organizationId}/comments:`, oErr.message);
        }
      }
      if (!pushed && personId) {
        try {
          await callAgendor(`people/${personId}/comments`, "POST", apiToken, { text: commentText });
          pushed = true;
          console.log(`[AGENDOR-COMMENT] Coment\xE1rio enviado com sucesso para a pessoa #${personId}`);
        } catch (pErr) {
          console.warn(`[AGENDOR-COMMENT] Falha em /people/${personId}/comments:`, pErr.message);
        }
      }
      const pullResult = await syncAndPullAgendorDetails(indicationId, indData, apiToken);
      return res.json({ success: true, pushed, pushError, pullResult });
    } catch (err) {
      console.error("[AGENDOR-COMMENT] Erro ao enviar coment\xE1rio para o Agendor:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/agendor/sync-indication", async (req, res) => {
    try {
      const { indicationId, forceSyncDeal } = req.body;
      if (!indicationId) {
        return res.status(400).json({ error: "ID da indica\xE7\xE3o n\xE3o fornecido." });
      }
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) {
        return res.status(400).json({ error: "Configura\xE7\xF5es de integra\xE7\xE3o com Agendor n\xE3o encontradas no banco de dados." });
      }
      const agendorConfig = settingsSnap.data();
      if (!agendorConfig.apiToken || !agendorConfig.enabled) {
        return res.status(400).json({ error: "Integra\xE7\xE3o com Agendor desabilitada ou Token de API ausente." });
      }
      const apiToken = agendorConfig.apiToken;
      const indSnap = await db.collection("indications").doc(indicationId).get();
      if (!indSnap.exists) {
        return res.status(404).json({ error: "Indica\xE7\xE3o n\xE3o encontrada no banco." });
      }
      const indData = indSnap.data();
      const syncResult = await executeAgendorSync(indicationId, indData, apiToken, forceSyncDeal !== false);
      if (syncResult && syncResult.dealId) {
        const freshSnap = await db.collection("indications").doc(indicationId).get();
        const freshData = freshSnap.data();
        if (freshData) {
          await syncAndPullAgendorDetails(indicationId, freshData, apiToken).catch((pErr) => {
            console.warn("[AGENDOR-SYNC] Falha ao puxar hist\xF3rico p\xF3s-sincroniza\xE7\xE3o:", pErr.message);
          });
        }
      }
      const finalSnap = await db.collection("indications").doc(indicationId).get();
      const finalData = finalSnap.data();
      return res.json({
        ...syncResult,
        negotiation_history: finalData?.negotiation_history || syncResult.negotiation_history || []
      });
    } catch (err) {
      console.error("[AGENDOR-SYNC] Erro geral de sincroniza\xE7\xE3o:", err.message);
      return res.status(500).json({ error: err.message || "Erro interno ao sincronizar com Agendor." });
    }
  });
  app.post("/api/agendor/pull-details", async (req, res) => {
    try {
      const { indicationId } = req.body;
      if (!indicationId) {
        return res.status(400).json({ error: "ID da indica\xE7\xE3o n\xE3o fornecido." });
      }
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) {
        return res.status(400).json({ error: "Configura\xE7\xF5es do Agendor n\xE3o encontradas." });
      }
      const agendorConfig = settingsSnap.data() || {};
      if (!agendorConfig.apiToken) {
        return res.status(400).json({ error: "Token de API do Agendor n\xE3o configurado." });
      }
      const indSnap = await db.collection("indications").doc(indicationId).get();
      if (!indSnap.exists) {
        return res.status(404).json({ error: "Indica\xE7\xE3o n\xE3o encontrada no banco de dados." });
      }
      const indData = indSnap.data() || {};
      const pullResult = await syncAndPullAgendorDetails(indicationId, indData, agendorConfig.apiToken);
      const finalSnap = await db.collection("indications").doc(indicationId).get();
      const finalData = finalSnap.data() || {};
      return res.json({
        success: true,
        pullResult,
        negotiation_history: finalData.negotiation_history || []
      });
    } catch (err) {
      console.error("[AGENDOR-PULL] Erro ao buscar detalhes do Agendor:", err.message);
      return res.status(500).json({ error: err.message || "Erro interno ao buscar hist\xF3rico do Agendor." });
    }
  });
  app.post("/api/agendor/import-files", async (req, res) => {
    try {
      const { indicationId } = req.body;
      if (!indicationId) {
        return res.status(400).json({ error: "ID da indica\xE7\xE3o n\xE3o fornecido." });
      }
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) {
        return res.status(400).json({ error: "Configura\xE7\xF5es de integra\xE7\xE3o com Agendor n\xE3o encontradas." });
      }
      const agendorConfig = settingsSnap.data();
      if (!agendorConfig.apiToken || !agendorConfig.enabled) {
        return res.status(400).json({ error: "Integra\xE7\xE3o com Agendor desabilitada ou Token ausente." });
      }
      const apiToken = agendorConfig.apiToken;
      const indSnap = await db.collection("indications").doc(indicationId).get();
      if (!indSnap.exists) {
        return res.status(404).json({ error: "Indica\xE7\xE3o n\xE3o encontrada no banco." });
      }
      const indData = indSnap.data();
      const dealId = indData.agendor_deal_id;
      if (!dealId) {
        return res.status(400).json({ error: "Esta indica\xE7\xE3o n\xE3o possui um ID de neg\xF3cio do Agendor associado. Por favor, sincronize a indica\xE7\xE3o primeiro." });
      }
      const pullResult = await syncAndPullAgendorDetails(indicationId, indData, apiToken);
      console.log(`[AGENDOR-IMPORT] Iniciando busca de anexos para o neg\xF3cio #${dealId}...`);
      const pdfFiles = [];
      try {
        const filesRes = await callAgendor(`deals/${dealId}/files`, "GET", apiToken);
        const filesArray = Array.isArray(filesRes) ? filesRes : filesRes.data || [];
        if (Array.isArray(filesArray)) {
          filesArray.forEach((f) => {
            if (f && f.url && (f.url.toLowerCase().includes(".pdf") || f.name && f.name.toLowerCase().endsWith(".pdf"))) {
              pdfFiles.push({
                name: f.name || "arquivo.pdf",
                url: f.url,
                date: f.created_at || f.createdAt || (/* @__PURE__ */ new Date()).toISOString()
              });
            }
          });
        }
      } catch (err) {
        console.warn("[AGENDOR-IMPORT] N\xE3o foi poss\xEDvel obter arquivos de /files:", err.message);
      }
      try {
        const commentsRes = await callAgendor(`deals/${dealId}/comments`, "GET", apiToken);
        const commentsArray = Array.isArray(commentsRes) ? commentsRes : commentsRes.data || [];
        if (Array.isArray(commentsArray)) {
          commentsArray.forEach((c) => {
            const attachments = c.attachments || c.files || [];
            if (Array.isArray(attachments)) {
              attachments.forEach((att) => {
                if (att && att.url && (att.url.toLowerCase().includes(".pdf") || att.name && att.name.toLowerCase().endsWith(".pdf"))) {
                  pdfFiles.push({
                    name: att.name || "comentario_anexo.pdf",
                    url: att.url,
                    date: att.created_at || att.createdAt || c.created_at || c.createdAt || (/* @__PURE__ */ new Date()).toISOString()
                  });
                }
              });
            }
          });
        }
      } catch (err) {
        console.warn("[AGENDOR-IMPORT] N\xE3o foi poss\xEDvel obter anexos de /comments:", err.message);
      }
      if (pdfFiles.length === 0) {
        const historyMsg = pullResult.newHistoryCount && pullResult.newHistoryCount > 0 ? `Sincronizados ${pullResult.newHistoryCount} novo(s) registro(s) de hist\xF3rico/coment\xE1rios do CRM Agendor!` : `Hist\xF3rico e hor\xE1rio de verifica\xE7\xE3o do CRM Agendor atualizados com sucesso!`;
        return res.json({
          success: true,
          message: `${historyMsg} (Nota: Nenhum or\xE7amento ou pedido em PDF foi localizado anexado ao neg\xF3cio no Agendor).`,
          pdfFound: false,
          newHistoryCount: pullResult.newHistoryCount || 0
        });
      }
      pdfFiles.sort((a, b) => {
        const dA = a.date ? new Date(a.date).getTime() : 0;
        const dB = b.date ? new Date(b.date).getTime() : 0;
        return dB - dA;
      });
      const targetFile = pdfFiles[0];
      console.log(`[AGENDOR-IMPORT] Baixando PDF do Agendor: ${targetFile.name} (URL: ${targetFile.url})`);
      const fileResponse = await fetch(targetFile.url);
      if (!fileResponse.ok) {
        return res.status(500).json({ error: `Falha ao fazer download do arquivo PDF do Agendor. Status HTTP: ${fileResponse.status}` });
      }
      const arrayBuffer = await fileResponse.arrayBuffer();
      const fileBase64 = Buffer.from(arrayBuffer).toString("base64");
      const ai = getGenAI();
      if (!ai) {
        return res.status(500).json({ error: "Chave GEMINI_API_KEY n\xE3o configurada no servidor." });
      }
      const prompt = `Analise este pedido de venda/or\xE7amento em PDF e extraia as seguintes informa\xE7\xF5es:
      1. O valor total da venda/pedido (procurado em "Total Pedido", "Valor total com ajuste de frete" ou "Valor total").
      2. O nome/raz\xE3o social do cliente ("Cliente"). Se tiver um c\xF3digo num\xE9rico antes (ex: "4235 - Eucazin Ltda"), extraia o c\xF3digo separado e limpe o nome.
      3. O prazo de entrega do pedido (procurado em "PRAZO DE ENTREGA" ou "data de entrega"), trazendo no formato DD/MM/YYYY (ex: "13/07/2026").
      4. O n\xFAmero do pedido de venda (e.g., procurado no t\xEDtulo como "Pedido de Venda n\xBA 9414"). Traga como inteiro ou texto limpo (ex: "9414").
      5. A data em que o pedido de venda foi feito/gerado (procurada na coluna ou r\xF3tulo "Data" na linha do cliente ou pr\xF3ximo \xE0 coluna endere\xE7o, ex: "28/05/2026"). Traga no formato de data DD/MM/YYYY.
      6. O CNPJ ou CPF do cliente (procurado em "CNPJ" ou "CPF/CNPJ", ex: "59.317.231/0001-76").
      7. O c\xF3digo do cliente (procurado na linha ou campo "Cliente" antes do nome ou em campo separado, ex: "4235").
      8. O apelido ou Nome Abreviado do cliente (procurado in "Apelido/Nome Abrev.", ex: "Eucazin Ltda").
      9. O e-mail de contato do cliente (procurado na linha de contato, ex: "financeiro@fazendadocarmo.com").
      10. O telefone ou celular do cliente (procurado na linha de contato ou telefone, ex: "62 9278-6496" ou "(14) 3161-5110").
      11. O endere\xE7o do cliente (procurado no campo "Endere\xE7o").
      12. A lista completa de todos os itens contidos na tabela de itens do pedido. Para cada item extraia:
         - O c\xF3digo do produto exatamente como est\xE1 (ex: "1000.1484.0000" ou "9000.9000.9027").
         - A descri\xE7\xE3o ou nome do produto.
         - A quantidade (n\xFAmero).
         - O pre\xE7o unit\xE1rio (n\xFAmero).
      
      Responda em formato de objeto JSON estruturado.`;
      console.log("[AGENDOR-IMPORT] Enviando PDF para an\xE1lise do Gemini...");
      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: prompt },
          { inlineData: { data: fileBase64, mimeType: "application/pdf" } }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              sale_value: { type: import_genai.Type.NUMBER, description: "Total value of the budget/order" },
              client_name: { type: import_genai.Type.STRING, description: "Client's corporate or full name" },
              delivery_date: { type: import_genai.Type.STRING, description: "Delivery date strictly in DD/MM/YYYY format" },
              order_number: { type: import_genai.Type.STRING, description: "Sales order number extracted (e.g. 9414)" },
              order_date: { type: import_genai.Type.STRING, description: "Sales order generation date in DD/MM/YYYY format" },
              client_cnpj: { type: import_genai.Type.STRING, description: "Customer's CNPJ or CPF (e.g. 59.317.231/0001-76)" },
              client_code: { type: import_genai.Type.STRING, description: "Customer's code (e.g. 4235)" },
              company_name: { type: import_genai.Type.STRING, description: "Customer's short/abbreviated name (e.g. Eucazin Ltda)" },
              client_email: { type: import_genai.Type.STRING, description: "Customer's email (e.g. financeiro@fazendadocarmo.com)" },
              client_phone: { type: import_genai.Type.STRING, description: "Customer's phone / cellular (e.g. 62 9278-6496)" },
              client_address: { type: import_genai.Type.STRING, description: "Customer's complete address" },
              items: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    code: { type: import_genai.Type.STRING, description: "Product code (e.g. 1000.1484.0000)" },
                    name: { type: import_genai.Type.STRING, description: "Product description/name" },
                    quantity: { type: import_genai.Type.NUMBER, description: "Exact quantity" },
                    unit_price: { type: import_genai.Type.NUMBER, description: "Unit price of the product" }
                  },
                  required: ["code", "name", "quantity", "unit_price"]
                }
              }
            },
            required: ["sale_value", "client_name", "items"]
          }
        }
      });
      const parsedText = geminiResponse.text || "";
      const jsonMatch = parsedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(500).json({ error: "Falha na decodifica\xE7\xE3o do retorno estruturado do Gemini." });
      }
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("[AGENDOR-IMPORT] An\xE1lise conclu\xEDda com sucesso. Itens extra\xEDdos:", (parsed.items || []).length);
      const isSalesOrder = targetFile.name.toLowerCase().includes("pedido") || targetFile.name.toLowerCase().includes("venda") || targetFile.name.toLowerCase().includes("order") || !!parsed.order_number;
      let commissionRate = 5;
      const partnerId = indData.external_seller_uid || indData.creator_uid;
      if (partnerId) {
        const partnerSnap = await db.collection("users").doc(partnerId).get();
        if (partnerSnap.exists) {
          const partnerData = partnerSnap.data() || {};
          if (partnerData.commission_rate !== void 0 && partnerData.commission_rate !== null) {
            commissionRate = Number(partnerData.commission_rate);
          }
        }
      }
      let totalCommissionable = 0;
      const mappedProducts = (parsed.items || []).map((item) => {
        const code = (item.code || "").trim();
        const isComm = code && !code.startsWith("9000");
        const price = item.unit_price || 0;
        const qty = item.quantity || 1;
        if (isComm) {
          totalCommissionable += price * qty;
        }
        return {
          code,
          name: item.name || "Equipamento n\xE3o cadastrado",
          quantity: qty,
          base_value: price,
          is_commissionable: isComm,
          uniqueId: `${code || "item"}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
        };
      });
      const finalCommission = totalCommissionable * (commissionRate / 100);
      const updates = {
        commissioned_products: mappedProducts,
        base_commission_value: totalCommissionable,
        commission_rate_applied: commissionRate,
        commission_value: finalCommission,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (isSalesOrder) {
        updates.sales_order_loaded = true;
        updates.sale_value = parsed.sale_value;
        if (parsed.order_number) updates.order_number = parsed.order_number;
        if (parsed.order_date) updates.order_date = parsed.order_date;
        updates.status = "sold";
      } else {
        updates.budget_loaded = true;
        updates.gross_budget_value = parsed.sale_value;
        if (parsed.order_number) updates.budget_number = parsed.order_number;
        if (parsed.order_date) updates.budget_date = parsed.order_date;
      }
      if (!indData.client_cnpj && parsed.client_cnpj) updates.client_cnpj = parsed.client_cnpj;
      if (!indData.client_name && parsed.client_name) updates.client_name = parsed.client_name;
      if (!indData.client_phone && parsed.client_phone) updates.client_phone = parsed.client_phone;
      if (!indData.client_email && parsed.client_email) updates.client_email = parsed.client_email;
      if (!indData.client_address && parsed.client_address) updates.client_address = parsed.client_address;
      const syncHistoryEntry = {
        id: Math.random().toString(36).substring(2, 11),
        type: "status_change",
        author_name: "Roder IA Automatizada",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        content: `Documento [${targetFile.name}] importado e analisado via CRM Agendor! Tipo identificado: ${isSalesOrder ? "Pedido de Venda" : "Or\xE7amento"}. Foram faturados ${mappedProducts.length} itens. Base Comission\xE1vel: R$ ${totalCommissionable.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Al\xEDquota do Indicador Parceiro: ${commissionRate}%. Comiss\xE3o Calculada: R$ ${finalCommission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
      };
      updates.negotiation_history = import_firebase_admin.default.firestore.FieldValue.arrayUnion(syncHistoryEntry);
      await db.collection("indications").doc(indicationId).update(updates);
      return res.json({
        success: true,
        message: `Importa\xE7\xE3o realizada com sucesso! Documento analisado: ${targetFile.name} (${isSalesOrder ? "Pedido de Venda" : "Or\xE7amento Or\xE7ado"}).`,
        isSalesOrder,
        parsedData: parsed,
        totalCommissionable,
        commissionRate,
        finalCommission
      });
    } catch (err) {
      console.error("[AGENDOR-IMPORT] Erro ao importar arquivos:", err.message);
      return res.status(500).json({ error: err.message || "Erro interno ao processar a importa\xE7\xE3o do CRM." });
    }
  });
  app.get("/api/agendor/search-client", async (req, res) => {
    try {
      const { cnpj, phone, name, code } = req.query;
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) {
        return res.status(400).json({ error: "Integra\xE7\xE3o com Agendor n\xE3o configurada." });
      }
      const agendorConfig = settingsSnap.data();
      if (!agendorConfig.apiToken || !agendorConfig.enabled) {
        return res.status(400).json({ error: "Integra\xE7\xE3o desabilitada ou sem Token de API." });
      }
      const apiToken = agendorConfig.apiToken;
      if (code) {
        let rawInput = String(code).trim();
        let extractedId = "";
        const dealUrlMatch = rawInput.match(/negocios\/([0-9]+)/i);
        const orgUrlMatch = rawInput.match(/empresas\/([0-9]+)/i);
        const personUrlMatch = rawInput.match(/pessoas\/([0-9]+)/i);
        const dealEmailMatch = rawInput.match(/n([0-9]{5,})@/i);
        if (dealEmailMatch) {
          extractedId = dealEmailMatch[1];
        } else if (dealUrlMatch) {
          extractedId = dealUrlMatch[1];
        } else if (orgUrlMatch) {
          extractedId = orgUrlMatch[1];
        } else if (personUrlMatch) {
          extractedId = personUrlMatch[1];
        } else {
          extractedId = rawInput.replace(/\D/g, "");
        }
        if (extractedId) {
          try {
            const dealRes = await callAgendor(`deals/${extractedId}`, "GET", apiToken);
            const deal = dealRes?.data || dealRes;
            if (deal && (deal.id || deal.title)) {
              console.log(`[AGENDOR-SEARCH] Neg\xF3cio localizado por ID #${extractedId}: ${deal.title}`);
              return res.json({
                success: true,
                found: true,
                source: "deal_id",
                type: "deal",
                deal_id: deal.id || extractedId,
                id: deal.organization?.id || deal.organization || deal.person?.id || deal.person || extractedId,
                name: deal.title || deal.organization?.name || deal.person?.name || `Neg\xF3cio #${extractedId}`,
                company_name: deal.organization?.name || deal.title || `Neg\xF3cio #${extractedId}`,
                cnpj: deal.organization?.cnpj || "",
                phone: deal.organization?.phones?.[0]?.number || deal.person?.phones?.[0]?.number || "",
                email: deal.organization?.emails?.[0]?.email || deal.person?.emails?.[0]?.email || "",
                address: deal.organization?.address ? `${deal.organization.address.city || ""}/${deal.organization.address.state || ""}` : "",
                client_code: String(deal.id || extractedId)
              });
            }
          } catch (dErr) {
            console.log(`[AGENDOR-SEARCH] ID #${extractedId} n\xE3o \xE9 um neg\xF3cio v\xE1lido, tentando Empresa...`);
          }
          try {
            const org = await callAgendor(`organizations/${extractedId}`, "GET", apiToken);
            if (org && org.id) {
              return res.json({
                success: true,
                found: true,
                source: "code",
                type: "organization",
                id: org.id,
                name: org.name,
                company_name: org.name,
                cnpj: org.cnpj || "",
                phone: org.phones?.[0]?.number || "",
                email: org.emails?.[0]?.email || "",
                address: org.address ? `${org.address.city || ""}/${org.address.state || ""}` : "",
                client_code: String(org.id)
              });
            }
          } catch (e) {
            try {
              const person = await callAgendor(`people/${extractedId}`, "GET", apiToken);
              if (person && person.id) {
                return res.json({
                  success: true,
                  found: true,
                  source: "code",
                  type: "person",
                  id: person.id,
                  name: person.name,
                  company_name: person.organization?.name || "",
                  cnpj: "",
                  phone: person.phones?.[0]?.number || "",
                  email: person.emails?.[0]?.email || "",
                  address: person.address ? `${person.address.city || ""}/${person.address.state || ""}` : "",
                  client_code: String(person.id)
                });
              }
            } catch (pErr) {
              console.log("[AGENDOR-SEARCH] Code search by direct ID failed:", extractedId);
            }
          }
        }
        try {
          const orgs = await callAgendor(`organizations?q=${encodeURIComponent(rawInput)}`, "GET", apiToken);
          if (Array.isArray(orgs) && orgs.length > 0) {
            const org = orgs[0];
            return res.json({
              success: true,
              found: true,
              source: "code",
              type: "organization",
              id: org.id,
              name: org.name,
              company_name: org.name,
              cnpj: org.cnpj || "",
              phone: org.phones?.[0]?.number || "",
              email: org.emails?.[0]?.email || "",
              address: org.address ? `${org.address.city || ""}/${org.address.state || ""}` : "",
              client_code: String(org.id)
            });
          }
        } catch (searchCodeErr) {
          console.warn("[AGENDOR-SEARCH] Search org by code q failed");
        }
      }
      if (cnpj) {
        const cleanCnpj = String(cnpj).replace(/\D/g, "");
        if (cleanCnpj.length === 14) {
          try {
            let orgs = await callAgendor(`organizations?cnpj=${cleanCnpj}`, "GET", apiToken);
            if (!Array.isArray(orgs) || orgs.length === 0) {
              orgs = await callAgendor(`organizations?q=${cleanCnpj}`, "GET", apiToken);
            }
            if (Array.isArray(orgs) && orgs.length > 0) {
              const org = orgs[0];
              return res.json({
                success: true,
                found: true,
                source: "cnpj",
                type: "organization",
                id: org.id,
                name: org.name,
                company_name: org.name,
                cnpj: org.cnpj || "",
                phone: org.phones?.[0]?.number || "",
                email: org.emails?.[0]?.email || "",
                address: org.address ? `${org.address.city || ""}/${org.address.state || ""}` : "",
                client_code: String(org.id)
              });
            }
          } catch (cnpjErr) {
            console.error("[AGENDOR-SEARCH] CNPJ lookup failed:", cnpjErr.message);
          }
        }
      }
      if (phone) {
        const cleanPhone = String(phone).replace(/\D/g, "");
        if (cleanPhone.length >= 8) {
          try {
            const people = await callAgendor(`people?q=${cleanPhone}`, "GET", apiToken);
            if (Array.isArray(people) && people.length > 0) {
              const person = people[0];
              return res.json({
                success: true,
                found: true,
                source: "phone",
                type: "person",
                id: person.id,
                name: person.name,
                company_name: person.organization?.name || "",
                cnpj: "",
                phone: person.phones?.[0]?.number || "",
                email: person.emails?.[0]?.email || "",
                address: person.address ? `${person.address.city || ""}/${person.address.state || ""}` : "",
                client_code: String(person.id)
              });
            }
            const orgs = await callAgendor(`organizations?q=${cleanPhone}`, "GET", apiToken);
            if (Array.isArray(orgs) && orgs.length > 0) {
              const org = orgs[0];
              return res.json({
                success: true,
                found: true,
                source: "phone",
                type: "organization",
                id: org.id,
                name: org.name,
                company_name: org.name,
                cnpj: org.cnpj || "",
                phone: org.phones?.[0]?.number || "",
                email: org.emails?.[0]?.email || "",
                address: org.address ? `${org.address.city || ""}/${org.address.state || ""}` : "",
                client_code: String(org.id)
              });
            }
          } catch (phoneErr) {
            console.error("[AGENDOR-SEARCH] Phone lookup failed:", phoneErr.message);
          }
        }
      }
      if (name) {
        const cleanName = String(name).trim();
        if (cleanName.length >= 3) {
          try {
            const orgs = await callAgendor(`organizations?q=${encodeURIComponent(cleanName)}`, "GET", apiToken);
            if (Array.isArray(orgs) && orgs.length > 0) {
              const org = orgs[0];
              return res.json({
                success: true,
                found: true,
                source: "name",
                type: "organization",
                id: org.id,
                name: org.name,
                company_name: org.name,
                cnpj: org.cnpj || "",
                phone: org.phones?.[0]?.number || "",
                email: org.emails?.[0]?.email || "",
                address: org.address ? `${org.address.city || ""}/${org.address.state || ""}` : "",
                client_code: String(org.id)
              });
            }
            const people = await callAgendor(`people?q=${encodeURIComponent(cleanName)}`, "GET", apiToken);
            if (Array.isArray(people) && people.length > 0) {
              const person = people[0];
              return res.json({
                success: true,
                found: true,
                source: "name",
                type: "person",
                id: person.id,
                name: person.name,
                company_name: person.organization?.name || "",
                cnpj: "",
                phone: person.phones?.[0]?.number || "",
                email: person.emails?.[0]?.email || "",
                address: person.address ? `${person.address.city || ""}/${person.address.state || ""}` : "",
                client_code: String(person.id)
              });
            }
          } catch (nameErr) {
            console.error("[AGENDOR-SEARCH] Name lookup failed:", nameErr.message);
          }
        }
      }
      return res.json({ success: true, found: false });
    } catch (err) {
      console.error("[AGENDOR-SEARCH-CLIENT] Erro geral de busca:", err.message);
      return res.status(500).json({ error: err.message || "Erro interno ao buscar cliente." });
    }
  });
  app.get("/api/agendor/contacts", async (req, res) => {
    try {
      const q = req.query.q || "";
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) {
        return res.status(400).json({ error: "Integra\xE7\xE3o com Agendor n\xE3o configurada." });
      }
      const agendorConfig = settingsSnap.data();
      if (!agendorConfig.apiToken || !agendorConfig.enabled) {
        return res.status(400).json({ error: "Integra\xE7\xE3o desabilitada ou sem Token de API." });
      }
      const apiToken = agendorConfig.apiToken;
      const endpoint = q ? `people?q=${encodeURIComponent(q)}` : "people?limit=15";
      const people = await callAgendor(endpoint, "GET", apiToken);
      return res.json({ success: true, contacts: people });
    } catch (err) {
      console.error("[AGENDOR-CONTACTS] Erro ao buscar contatos:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });
  async function sendNotificationEmail(to, subject, html, fromName) {
    try {
      const settingsSnap = await db.collection("settings").doc("email").get();
      let settings = settingsSnap.exists ? settingsSnap.data() : null;
      if (!settings && process.env.SMTP_USER && process.env.SMTP_PASS) {
        settings = {
          provider: process.env.SMTP_PROVIDER || "gmail",
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
          senderEmail: process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER
        };
      }
      if (!settings) {
        console.warn("[SEND-NOTIFICATION] Configura\xE7\xF5es de e-mail n\xE3o encontradas no sistema.");
        return;
      }
      if (settings.provider === "gmail") {
        const transporter = import_nodemailer.default.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: settings.user,
            pass: settings.pass.replace(/\s/g, "")
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        const mailOptions = {
          from: fromName ? `"${fromName}" <${settings.user}>` : `"RODER Indica" <${settings.user}>`,
          to,
          subject,
          html
        };
        await transporter.sendMail(mailOptions);
        console.log(`[SEND-NOTIFICATION] E-mail enviado com sucesso para ${to} via Gmail`);
      } else if (settings.provider === "resend") {
        const resend = new import_resend.Resend(settings.apiKey);
        const fromEmail = settings.senderEmail || "vendas@roderbrasil.com.br";
        await resend.emails.send({
          from: fromName ? `${fromName} <${fromEmail}>` : `RODER Indica <${fromEmail}>`,
          to: [to],
          subject,
          html,
          replyTo: fromEmail
        });
        console.log(`[SEND-NOTIFICATION] E-mail enviado com sucesso para ${to} via Resend`);
      } else {
        const transporter = import_nodemailer.default.createTransport({
          host: settings.host || "smtp.hostinger.com",
          port: Number(settings.port) || 465,
          secure: settings.secure !== false,
          auth: {
            user: settings.user,
            pass: settings.pass
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        const mailOptions = {
          from: fromName ? `"${fromName}" <${settings.user}>` : `"${settings.senderName || "RODER Indica"}" <${settings.senderEmail || settings.user}>`,
          to,
          subject,
          html
        };
        await transporter.sendMail(mailOptions);
        console.log(`[SEND-NOTIFICATION] E-mail enviado com sucesso para ${to} via Custom SMTP`);
      }
    } catch (err) {
      console.error("[SEND-NOTIFICATION] Erro ao enviar e-mail:", err.message);
    }
  }
  async function sendPartnerNotificationFromWebhook(indData, type, updates) {
    let partnerEmail = indData.external_seller_email || "";
    let partnerName = indData.external_seller_name || "Parceiro";
    if (indData.external_seller_uid) {
      try {
        const partnerSnap = await db.collection("users").doc(indData.external_seller_uid).get();
        if (partnerSnap.exists) {
          const pData = partnerSnap.data();
          partnerEmail = pData.email || partnerEmail;
          partnerName = pData.name || partnerName;
        }
      } catch (err) {
        console.error("[AGENDOR-WEBHOOK] Erro ao obter e-mail do parceiro para notifica\xE7\xE3o:", err.message);
      }
    }
    if (!partnerEmail || partnerEmail.includes("@mobile.roder.com.br") || !partnerEmail.includes("@")) {
      console.log(`[AGENDOR-WEBHOOK] Notifica\xE7\xE3o de e-mail pulada: e-mail inv\xE1lido ou de simula\xE7\xE3o (${partnerEmail})`);
      return;
    }
    let subject = "";
    let html = "";
    let headerColor = "#f97316";
    const sellerName = indData.internal_seller_name || "Vendedor Roder";
    if (type === "budget_sent") {
      subject = `Or\xE7amento Enviado: Sua indica\xE7\xE3o de ${indData.client_name}`;
      html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f97316; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; text-transform: uppercase;">Or\xE7amento Enviado ao Cliente!</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Sua indica\xE7\xE3o est\xE1 avan\xE7ando no comercial da RODER (via CRM)</p>
          </div>
          
          <div style="padding: 24px; line-height: 1.6;">
            <p>Ol\xE1 <strong>${partnerName}</strong>,</p>
            
            <p>Temos \xF3timas not\xEDcias! O or\xE7amento t\xE9cnico-comercial foi enviado com sucesso para o cliente <strong>${indData.client_name}</strong> referente ao equipamento <strong>${indData.product_name || "equipamento solicitado"}</strong>.</p>
            
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; font-weight: bold; color: #b45309; font-size: 15px;">"Esperamos que esta venda seja conclu\xEDda!"</p>
            </div>

            <p><strong>Acompanhamento da Negocia\xE7\xE3o:</strong></p>
            <p>A plataforma <strong>RODER Indica</strong> \xE9 o seu canal oficial exclusivo para verificar o progresso, ver o status atualizado e acompanhar os seus ganhos em tempo real.</p>
            
            <div style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 15px;">
              <p>O vendedor respons\xE1vel pelo atendimento \xE9 <strong>${sellerName}</strong>.</p>
            </div>
            
            <p style="font-size: 13px; color: #666; margin-top: 25px;">Qualquer altera\xE7\xE3o relevante de status na negocia\xE7\xE3o ser\xE1 enviada automaticamente para o seu e-mail.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">Roder M\xE1quinas e Equipamentos Ltda.<br>Este \xE9 um e-mail autom\xE1tico de acompanhamento de parceria.</p>
          </div>
        </div>
      `;
    } else if (type === "sold") {
      headerColor = "#22c55e";
      subject = `\u{1F389} PARAB\xC9NS! Sua indica\xE7\xE3o de ${indData.client_name} foi CONCLU\xCDDA!`;
      html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${headerColor}; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; text-transform: uppercase;">Venda Conclu\xEDda!</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Excelente parceria comercial com a RODER</p>
          </div>
          
          <div style="padding: 24px; line-height: 1.6;">
            <p>Ol\xE1 <strong>${partnerName}</strong>,</p>
            
            <p>Gostar\xEDamos de informar que a sua indica\xE7\xE3o para <strong>${indData.client_name}</strong> foi marcada como <strong>GANHA (Conclu\xEDda)</strong> no CRM Agendor!</p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; font-weight: bold; color: #15803d; font-size: 15px;">Neg\xF3cio Fechado!</p>
              <p style="margin: 5px 0 0 0; color: #166534; font-size: 13px;">O neg\xF3cio foi fechado com sucesso! A comiss\xE3o correspondente \xE0 sua indica\xE7\xE3o ser\xE1 liberada e processada no sistema do Roder Indica assim que finalizado o faturamento interno pela nossa equipe comercial.</p>
            </div>

            <p><strong>Canal de Acompanhamento:</strong></p>
            <p>Acesse o portal do <strong>RODER Indica</strong> para verificar o progresso detalhado de suas negocia\xE7\xF5es, o hist\xF3rico e os valores de comiss\xF5es agendadas.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">Roder M\xE1quinas e Equipamentos Ltda.<br>Informativo autom\xE1tico de parceria.</p>
          </div>
        </div>
      `;
    } else if (type === "lost") {
      headerColor = "#ef4444";
      subject = `Atualiza\xE7\xE3o: Indica\xE7\xE3o de ${indData.client_name} finalizada`;
      html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${headerColor}; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; text-transform: uppercase;">Atualiza\xE7\xE3o de Status</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Negocia\xE7\xE3o Encerrada</p>
          </div>
          
          <div style="padding: 24px; line-height: 1.6;">
            <p>Ol\xE1 <strong>${partnerName}</strong>,</p>
            
            <p>Gostar\xEDamos de informar que a negocia\xE7\xE3o para a sua indica\xE7\xE3o do cliente <strong>${indData.client_name}</strong> foi dada como encerrada sem conclus\xE3o no CRM Agendor.</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; font-weight: bold; color: #991b1b; font-size: 14px;">Negocia\xE7\xE3o Finalizada sem Compra</p>
              <p style="margin: 5px 0 0 0; color: #7f1d1d; font-size: 13px;">Infelizmente este lead n\xE3o seguiu com a compra do equipamento neste momento. Ficamos \xE0 disposi\xE7\xE3o do cliente para novas consultas futuramente.</p>
            </div>

            <p>Agradecemos o seu empenho e continuamos juntos para as pr\xF3ximas indica\xE7\xF5es!</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">Roder M\xE1quinas e Equipamentos Ltda.<br>Informativo autom\xE1tico de parceria.</p>
          </div>
        </div>
      `;
    }
    await sendNotificationEmail(partnerEmail, subject, html, "Roder Indica");
  }
  import_node_cron.default.schedule("*/15 * * * *", async () => {
    if (AGENDOR_DISABLED) return;
    try {
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) return;
      const agendorConfig = settingsSnap.data();
      if (!agendorConfig?.apiToken || !agendorConfig?.enabled) return;
      console.log("[Schedule] Iniciando sincroniza\xE7\xE3o peri\xF3dica de neg\xF3cios do Agendor CRM...");
      const allIndicationsSnap = await db.collection("indications").get();
      if (allIndicationsSnap.empty) return;
      let syncCount = 0;
      for (const docSnap of allIndicationsSnap.docs) {
        const indData = docSnap.data();
        if (!indData.agendor_deal_id || indData.status === "cancelled") continue;
        try {
          await syncAndPullAgendorDetails(docSnap.id, indData, agendorConfig.apiToken);
          syncCount++;
        } catch (err) {
          console.warn(`[Schedule-Agendor] Erro ao sincronizar indica\xE7\xE3o ${docSnap.id}:`, err.message);
        }
      }
      if (syncCount > 0) {
        console.log(`[Schedule] Sincroniza\xE7\xE3o peri\xF3dica do Agendor conclu\xEDda com sucesso para ${syncCount} indica\xE7\xE3o(\xF5es).`);
      }
    } catch (error) {
      console.error("[Schedule] Erro na sincroniza\xE7\xE3o peri\xF3dica do Agendor:", error.message);
    }
  }, {
    timezone: BR_TIMEZONE
  });
  app.post("/api/webhooks/agendor", async (req, res) => {
    try {
      const payload = req.body;
      console.log("[AGENDOR-WEBHOOK] Recebido payload:", JSON.stringify(payload, null, 2));
      const data = payload.data || payload;
      let dealId = data.id || data.deal_id || data.dealId;
      if (!dealId && data.deal) {
        dealId = typeof data.deal === "object" ? data.deal.id : data.deal;
      }
      if (!dealId && payload.entity_type === "deal") {
        dealId = payload.entity_id;
      }
      if (!dealId && (payload.related_entity_id || payload.deal_id || payload.dealId)) {
        dealId = payload.related_entity_id || payload.deal_id || payload.dealId;
      }
      if (!dealId && payload.comment?.deal_id) dealId = payload.comment.deal_id;
      if (!dealId && payload.task?.deal_id) dealId = payload.task.deal_id;
      if (!dealId && payload.activity?.deal_id) dealId = payload.activity.deal_id;
      if (!dealId) {
        console.warn("[AGENDOR-WEBHOOK] ID do neg\xF3cio n\xE3o identificado no payload.");
        return res.json({ success: false, message: "ID do neg\xF3cio n\xE3o identificado" });
      }
      let indQuery = await db.collection("indications").where("agendor_deal_id", "==", Number(dealId)).get();
      if (indQuery.empty) {
        indQuery = await db.collection("indications").where("agendor_deal_id", "==", String(dealId)).get();
      }
      if (indQuery.empty) {
        console.log(`[AGENDOR-WEBHOOK] Nenhuma indica\xE7\xE3o correspondente encontrada para agendor_deal_id: ${dealId}`);
        return res.json({ success: false, message: "Indica\xE7\xE3o n\xE3o correspondente no Roder" });
      }
      const indicationDoc = indQuery.docs[0];
      const indicationId = indicationDoc.id;
      const indData = indicationDoc.data();
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      const agendorConfig = settingsSnap.exists ? settingsSnap.data() : null;
      let pullResult = null;
      if (agendorConfig?.apiToken) {
        pullResult = await syncAndPullAgendorDetails(indicationId, indData, agendorConfig.apiToken);
        console.log(`[AGENDOR-WEBHOOK] Pull completo executado para indica\xE7\xE3o ${indicationId}:`, pullResult);
      }
      const updates = {};
      const historyEntries = [];
      if (data.value !== void 0 && data.value !== null) {
        const newValue = parseFloat(data.value);
        if (newValue !== indData.base_commission_value) {
          updates.base_commission_value = newValue;
          historyEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "status_change",
            author_name: "CRM Agendor",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            content: `Valor base atualizado via Agendor CRM: de R$ ${(indData.base_commission_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} para R$ ${newValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
          });
        }
      }
      const stageLabels = {
        lead: "Lead",
        contact: "Contato",
        proposal: "Apresenta\xE7\xE3o / Proposta",
        negotiation: "Negocia\xE7\xE3o",
        won: "Ganho",
        lost: "Perdido"
      };
      let notifyType = null;
      const newStage = data.stage;
      const newStatus = data.status;
      if (newStage && newStage !== indData.agendor_stage) {
        updates.agendor_stage = newStage;
        const currentStageLabel = stageLabels[indData.agendor_stage || ""] || indData.agendor_stage || "Desconhecido";
        const newStageLabel = stageLabels[newStage] || newStage;
        historyEntries.push({
          id: Math.random().toString(36).substring(2, 11),
          type: "status_change",
          author_name: "CRM Agendor",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          content: `Est\xE1gio da negocia\xE7\xE3o atualizado no CRM: de "${currentStageLabel}" para "${newStageLabel}".`
        });
        const isProposalStage = typeof newStage === "string" && (newStage.toLowerCase() === "proposal" || newStage.toLowerCase().includes("propos") || newStage.toLowerCase().includes("or\xE7ament") || newStage.toLowerCase().includes("orcam"));
        if (isProposalStage && !indData.budget_sent_at) {
          const now = /* @__PURE__ */ new Date();
          updates.budget_sent_at = now.toISOString();
          updates.protection_expires_at = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1e3).toISOString();
          historyEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "status_change",
            author_name: "CRM Agendor",
            created_at: now.toISOString(),
            content: `[Controle Autom\xE1tico]: Or\xE7amento enviado identificado no CRM Agendor! A validade da prote\xE7\xE3o de 60 dias para o indicador parceiro foi iniciada e expira em ${new Date(now.getTime() + 60 * 24 * 60 * 60 * 1e3).toLocaleDateString("pt-BR")}.`
          });
          notifyType = "budget_sent";
        }
      }
      if (newStatus && newStatus !== indData.agendor_status) {
        updates.agendor_status = newStatus;
        if (newStatus === "won") {
          historyEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "status_change",
            author_name: "CRM Agendor",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            content: `O neg\xF3cio foi marcado como GANHO no Agendor CRM. Lembre-se de anexar a nota fiscal e finalizar o faturamento no Roder Indica.`
          });
          notifyType = "sold";
        } else if (newStatus === "lost") {
          updates.status = "cancelled";
          const lossReason = data.loss_reason || "N\xE3o informada";
          historyEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "status_change",
            author_name: "CRM Agendor",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            content: `O neg\xF3cio foi marcado como PERDIDO no Agendor CRM. Motivo: ${lossReason}. A indica\xE7\xE3o foi cancelada no Roder Indica automaticamente.`
          });
          notifyType = "lost";
        }
      }
      const commentText = payload.comment?.text || payload.comment?.content || payload.activity?.text || payload.activity?.description || payload.text;
      if (commentText) {
        historyEntries.push({
          id: Math.random().toString(36).substring(2, 11),
          type: "note",
          author_name: payload.comment?.user?.name || payload.activity?.user?.name || "CRM Agendor",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          content: `[CRM Agendor]: ${commentText}`
        });
      }
      if (Object.keys(updates).length > 0 || historyEntries.length > 0) {
        const indRef = db.collection("indications").doc(indicationId);
        const updatePayload = {
          ...updates,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (historyEntries.length > 0) {
          updatePayload.negotiation_history = import_firebase_admin.default.firestore.FieldValue.arrayUnion(...historyEntries);
        }
        await indRef.update(updatePayload);
        console.log(`[AGENDOR-WEBHOOK] Indica\xE7\xE3o ${indicationId} atualizada com sucesso!`);
        if (notifyType) {
          sendPartnerNotificationFromWebhook(indData, notifyType, updates).catch((err) => {
            console.error("[AGENDOR-WEBHOOK] Erro ao enviar e-mail de notifica\xE7\xE3o de parceria:", err.message);
          });
        }
      }
      if (db) {
        setTimeout(async () => {
          try {
            const settingsSnap2 = await db.collection("settings").doc("agendor").get();
            const agendorConfig2 = settingsSnap2.data();
            if (agendorConfig2?.apiToken && agendorConfig2?.enabled) {
              console.log(`[AGENDOR-WEBHOOK] Auto-sincronizando arquivos do neg\xF3cio #${dealId}...`);
              const localUrl = `http://0.0.0.0:${PORT}/api/agendor/import-files`;
              const importRes = await fetch(localUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ indicationId })
              });
              const importJson = await importRes.json();
              console.log(`[AGENDOR-WEBHOOK] Auto-sincroniza\xE7\xE3o de arquivos finalizada para indica\xE7\xE3o ${indicationId}:`, importJson);
            }
          } catch (err) {
            console.error(`[AGENDOR-WEBHOOK] Erro ao sincronizar arquivos do neg\xF3cio #${dealId} automaticamente:`, err.message);
          }
        }, 1500);
      }
      return res.json({ success: true, message: "Webhook processado com sucesso" });
    } catch (err) {
      console.error("[AGENDOR-WEBHOOK] Erro no webhook do Agendor:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });
  const onServerListen = () => {
    console.log(`Server running on port/socket: ${PORT}`);
    setTimeout(async () => {
      try {
        if (!db) return;
        const usersSnap = await db.collection("users").get();
        for (const userDoc of usersSnap.docs) {
          const uData = userDoc.data();
          const emailLower = (uData.email || "").toLowerCase().trim();
          const nameCurrent = uData.name || "";
          const isLuana = emailLower === "contato@roderbrasil.com.br" || emailLower === "luana@roderbrasil.com.br" || emailLower === "luana@roder.com.br" || nameCurrent.includes("Contato_Roder") || nameCurrent.includes("Contato Roder");
          if (isLuana && nameCurrent !== "Luana Camargo") {
            console.log(`[BOOT-HEAL] Corrigindo nome do usu\xE1rio ${userDoc.id} (${uData.email}) de "${nameCurrent}" para "Luana Camargo"...`);
            await db.collection("users").doc(userDoc.id).update({
              name: "Luana Camargo",
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            });
          }
        }
      } catch (healErr) {
        console.error("[BOOT-HEAL] Erro ao auto-corrigir nome da Luana Camargo:", healErr.message);
      }
    }, 3e3);
  };
  if (typeof PORT === "string" && (PORT.startsWith("/") || PORT.startsWith("\\\\"))) {
    app.listen(PORT, onServerListen);
  } else {
    const portNum = Number(PORT) || 3e3;
    app.listen(portNum, "0.0.0.0", onServerListen);
  }
}
(() => {
  try {
    const appDir = import_fs.default.realpathSync(__appDir);
    const marker = `${import_path.default.sep}hbuilds${import_path.default.sep}versions${import_path.default.sep}`;
    const idx = appDir.indexOf(marker);
    if (idx < 0) return;
    const rest = appDir.slice(idx + marker.length).split(import_path.default.sep).slice(1).join(import_path.default.sep);
    const currentDir = import_path.default.join(appDir.slice(0, idx), "hbuilds", "current", rest);
    console.log(`[VERSION-WATCHDOG] Ativo. Esta vers\xE3o: ${appDir} | vers\xE3o atual: ${currentDir}`);
    const timer = setInterval(() => {
      let active = "";
      try {
        active = import_fs.default.realpathSync(currentDir);
      } catch {
        return;
      }
      const stillHere = import_fs.default.existsSync(import_path.default.join(appDir, "server.js"));
      if (active && (active !== appDir || !stillHere)) {
        console.warn(`[VERSION-WATCHDOG] Nova vers\xE3o ativa (${active}). Encerrando processo antigo ${appDir}.`);
        clearInterval(timer);
        setTimeout(() => process.exit(0), 1e3);
      }
    }, 3e4);
    timer.unref();
  } catch (e) {
    console.warn("[VERSION-WATCHDOG] N\xE3o iniciado:", e?.message);
  }
})();
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
