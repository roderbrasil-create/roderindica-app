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
var import_crypto4 = __toESM(require("crypto"), 1);
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
    code: "9000.9000.9004",
    description: "KIT INSTALACAO CMF500/600 + LINCK EM ESCAVADEIRA - ( MAQUINA COM LINHA ROMPEDOR)",
    items: [
      { code: "5000.1001.0061", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA CMF500/600", quantity: 1 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "3000.5001.1083", description: "3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1110", description: "1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL", quantity: 3 },
      { code: "3000.5001.1042", description: "3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1134", description: "3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL", quantity: 2 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "1000.1040.2705", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT", quantity: 2 },
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 2 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5003.0146", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP", quantity: 1 },
      { code: "3000.5000.0491", description: "ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 4 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.1004.0018", description: "Arruela de press\xE3o M6", quantity: 2 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "3000.5000.0396", description: "BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0336", description: "BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0366", description: "BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC", quantity: 3 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 2 },
      { code: "3000.5000.0379", description: "Adaptador Painel 1.1/16 JIC", quantity: 2 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5000.0359", description: "ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2", quantity: 3 },
      { code: "3000.5000.0360", description: "ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2", quantity: 3 },
      { code: "3000.5000.0395", description: "ADAPTADOR MACHO/FEMEA 1/2 NPT X 7/8 JIC", quantity: 3 },
      { code: "3000.5003.0188", description: "VALVULA CONTROLE FLUXO BI-DIRECIONAL 3/4 BSP", quantity: 2 },
      { code: "3000.5000.0294", description: "Adaptador macho/macho 3/4 BSP x 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0324", description: "ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0361", description: "ENGATE RAPIDO FEMEA FACE PLANA 9/16 UNF-14 - CORPO 1/4", quantity: 1 },
      { code: "3000.5000.0362", description: "ENGATE RAPIDO MACHO FACE PLANA 9/16 UNF-14 - CORPO 1/4", quantity: 1 },
      { code: "3000.5000.0399", description: "Adaptador macho/femea 9/16 UNF X 9/16 JIC", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9005",
    description: 'KIT INSTALACAO LINHA EXTRA PADRAO ESCAVADEIRA - ( MAQUINA CAT320 GC COM FATIA EXTRA "ACIONADA" SEM LINHA)',
    items: [
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 10 },
      { code: "1000.1040.5600", description: "ABRACADEIRA CONJUNTO SIMPLES \xD827", quantity: 4 },
      { code: "3000.5003.0075", description: "Valvula esfera 2 vias 3/4BSP", quantity: 2 },
      { code: "3000.5000.0294", description: "Adaptador macho/macho 3/4 BSP x 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0324", description: "ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC", quantity: 2 },
      { code: "1000.1040.1107", description: "ADAPTADOR PARA SOLDA 1.1/16 JIC", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9006",
    description: "KIT INSTALACAO GT COM BLOCO 3 VIAS - ( MAQUINA COM LINHA)",
    items: [
      { code: "3000.5003.0085", description: "BLOCO COMANDO VALVULA DIRECIONAL PILOTADA", quantity: 1 },
      { code: "3000.5000.0307", description: "Adaptador macho/macho 1.5/16 UNF x 1.1/16 JIC", quantity: 6 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 5 },
      { code: "5000.1001.0042", description: "MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "5000.1001.0051", description: "CAIXA ELETRICA 01 FUNCAO 12/24V", quantity: 1 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1004.0018", description: "Arruela de press\xE3o M6", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9007",
    description: "KIT INSTALACAO TRITURADOR EM ESCAVADEIRA - ( MAQUINA COM LINHA)",
    items: [
      { code: "3000.5000.0366", description: "BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC", quantity: 1 },
      { code: "3000.5000.0396", description: "BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "1000.1040.4700", description: "FIXACAO MANGUEIRAS DESTOCADOR", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 1 },
      { code: "2000.1000.2847", description: "CHAPA PERFIL L ADAPTADOR PAINEL 7/8", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "4000.5000.0019", description: "ABRACADEIRA NYLON 4,8 X 400MM", quantity: 10 },
      { code: "2000.1000.3510", description: "CHAPA DO CHICOTE ELETRICO FAE", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9008",
    description: "KIT INSTALACAO LINHA EXTRA PADRAO ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA)",
    items: [
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 10 },
      { code: "1000.1040.5600", description: "ABRACADEIRA CONJUNTO SIMPLES \xD827", quantity: 4 },
      { code: "5000.1001.0039", description: "PEDAL ACIONAMENTO 10A 250V 1REV MINI TFS-100 - COM CABO 1METRO", quantity: 2 },
      { code: "3000.5003.0075", description: "Valvula esfera 2 vias 3/4BSP", quantity: 2 },
      { code: "3000.5000.0294", description: "Adaptador macho/macho 3/4 BSP x 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0324", description: "ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC", quantity: 2 },
      { code: "1000.1040.1107", description: "ADAPTADOR PARA SOLDA 1.1/16 JIC", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9009",
    description: "KIT INSTALACAO GT600/800 ROTATOR SEM PASSAGEM EXTRA EM ESCAVADEIRA 20TON - (MAQUINA COM LINHA DE GARRA)",
    items: [
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 14 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0017", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GT600-GT800 SEM PASSAGEM EXTRA", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 6 },
      { code: "3000.5003.0008", description: "BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)", quantity: 1 },
      { code: "3000.5003.0009", description: "VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER", quantity: 1 },
      { code: "3000.5000.0301", description: "Adaptador macho/macho 3/4 UNF x 9/16 JIC", quantity: 3 },
      { code: "1000.1040.4101", description: "ABRACADEIRA SUPERIOR FERRO DUPLA PARA TUBO 27MM", quantity: 4 },
      { code: "1000.1040.2711", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 7/8JIC", quantity: 2 },
      { code: "1000.1040.2333", description: "KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR", quantity: 1 },
      { code: "3000.5001.1147", description: "3/8 R2 - 3000MM X FG 7/8 JIC X FG 3/4 JIC", quantity: 1 },
      { code: "3000.5001.1084", description: "1/2 R2 - 3000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1035", description: "3/4 R12 - 3000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1038", description: "3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.1004.0018", description: "Arruela de press\xE3o M6", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9010",
    description: "KIT INSTALACAO FELLER TESOURA EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA )",
    items: [
      { code: "3000.5003.0100", description: "COMANDO HIDRAULICO ELETRICO SDS180/2 - AC(XG-180) /18EI3L/18EI3L/RV-KE2R3-24CDV", quantity: 1 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 24 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "3000.5001.1175", description: "3/4 R12 - 2300 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 3 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 4 },
      { code: "3000.5000.0381", description: "Adaptador macho/macho 1/2 BSP x 9/16 JIC", quantity: 2 },
      { code: "3000.5000.0284", description: "Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC", quantity: 4 },
      { code: "3000.5000.0307", description: "Adaptador macho/macho 1.5/16 UNF x 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0276", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC", quantity: 6 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "5000.1001.0053", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR", quantity: 1 },
      { code: "5000.1001.0018", description: "MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL", quantity: 1 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 8 },
      { code: "3000.5001.1180", description: "3/4R12 - 1000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "3000.5000.0333", description: "ADAPTADOR TEE MACHO/FEMEA LATERAL 9/16 JIC", quantity: 2 },
      { code: "3000.5001.1081", description: "1/4 R17 - 1000 MM X FG 9/16 JIC X FG 90\xB0 9/16 JIC", quantity: 2 },
      { code: "3000.5001.1006", description: "1/4 R17 - 1800 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 4 },
      { code: "3000.5001.1008", description: "1/2 R2 - 2300 MM X FG 7/8 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1138", description: "3/4R12 - 1000 MM X FG 1.1/16 JIC X FG 90\xB0 1.1/16 JIC", quantity: 4 },
      { code: "3000.5001.1009", description: "3/4 R2 - 1300 MM X FG 1.1/16 JIC X FG 90\xB0 1.1/16 JIC", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9011",
    description: "KIT INSTALACAO CMF500/600 + LANCA EXTENSORA EM ESCAVADEIRA - ( MAQUINA SEM FATIA EXTRA )",
    items: [
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 6 },
      { code: "1000.1040.2707", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC", quantity: 2 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.2333", description: "KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR", quantity: 1 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 14 },
      { code: "1000.1040.2709", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "3000.5001.1007", description: "1/2 R2 - 1600 MM X FG 7/8 JIC X FG 45\xB0 7/8 JIC", quantity: 3 },
      { code: "3000.5001.1043", description: "3/8 R2 - 1600 MM X FG 9/16 JIC X FG 45\xB0 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 2 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5003.0146", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP", quantity: 1 },
      { code: "3000.5000.0291", description: "ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0491", description: "ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "3000.5003.0086", description: "REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN", quantity: 1 },
      { code: "3000.5003.0008", description: "BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)", quantity: 1 },
      { code: "3000.5003.0009", description: "VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER", quantity: 1 },
      { code: "3000.5000.0301", description: "Adaptador macho/macho 3/4 UNF x 9/16 JIC", quantity: 3 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 2 },
      { code: "3000.5000.0396", description: "BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0336", description: "BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0366", description: "BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC", quantity: 3 },
      { code: "3000.5001.1002", description: "1/2 R2 - 1200mm x FG 7/8 JIC x FG 45\xB0 7/8JIC", quantity: 3 },
      { code: "3000.5001.1177", description: "3/8 R2 - 1170 MM X FG 9/16 JIC X FG 45\xB0 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1172", description: "3/4 R12 - 1160 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0379", description: "Adaptador Painel 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1083", description: "3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9012",
    description: "KIT INSTALACAO CMF500/600 + LANCA EXTENSORA EM ESCAVADEIRA - ( MAQUINA COM LINHA DE GARRA)",
    items: [
      { code: "1000.1040.2707", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC", quantity: 2 },
      { code: "1000.1040.2709", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 2 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5003.0146", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP", quantity: 1 },
      { code: "3000.5000.0291", description: "ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 3 },
      { code: "3000.5000.0491", description: "ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "3000.5001.1043", description: "3/8 R2 - 1600 MM X FG 9/16 JIC X FG 45\xB0 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1007", description: "1/2 R2 - 1600 MM X FG 7/8 JIC X FG 45\xB0 7/8 JIC", quantity: 3 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "3000.5003.0086", description: "REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN", quantity: 1 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 4 },
      { code: "3000.5000.0396", description: "BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0366", description: "BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC", quantity: 3 },
      { code: "3000.5000.0336", description: "BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 2 },
      { code: "3000.5001.1002", description: "1/2 R2 - 1200mm x FG 7/8 JIC x FG 45\xB0 7/8JIC", quantity: 3 },
      { code: "3000.5001.1177", description: "3/8 R2 - 1170 MM X FG 9/16 JIC X FG 45\xB0 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1172", description: "3/4 R12 - 1160 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0379", description: "Adaptador Painel 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1083", description: "3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9013",
    description: "KIT INSTALACAO CMF500/600 + LANCA EXTENSORA EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA)",
    items: [
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 6 },
      { code: "1000.1040.2707", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC", quantity: 2 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 14 },
      { code: "1000.1040.2709", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "3000.5001.1007", description: "1/2 R2 - 1600 MM X FG 7/8 JIC X FG 45\xB0 7/8 JIC", quantity: 3 },
      { code: "3000.5001.1043", description: "3/8 R2 - 1600 MM X FG 9/16 JIC X FG 45\xB0 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 2 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5003.0146", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP", quantity: 1 },
      { code: "3000.5000.0291", description: "ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 4 },
      { code: "3000.5000.0491", description: "ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "3000.5003.0086", description: "REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN", quantity: 1 },
      { code: "3000.5000.0396", description: "BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0336", description: "BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0366", description: "BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC", quantity: 3 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 2 },
      { code: "3000.5001.1002", description: "1/2 R2 - 1200mm x FG 7/8 JIC x FG 45\xB0 7/8JIC", quantity: 3 },
      { code: "3000.5001.1177", description: "3/8 R2 - 1170 MM X FG 9/16 JIC X FG 45\xB0 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1172", description: "3/4 R12 - 1160 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0379", description: "Adaptador Painel 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1083", description: "3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1040", description: "3/4R12 - 700 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0321", description: "ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC", quantity: 1 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9014",
    description: "KIT INSTALACAO GARRA + LANCA EXTENSORA EM ESCAVADEIRA - ( MAQUINA COM LINHA ROMPEDOR )",
    items: [
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 4 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "1000.1040.2705", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT", quantity: 2 },
      { code: "5000.1001.0042", description: "MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5000.0359", description: "ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2", quantity: 2 },
      { code: "3000.5000.0360", description: "ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2", quantity: 2 },
      { code: "3000.5000.0336", description: "BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0396", description: "BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1046", description: "1/2 R2 - 1800 MM X FG 7/8 JIC X MF 1/2 NPT", quantity: 2 },
      { code: "3000.5001.1045", description: "1/2 R2 - 1800 MM X FG 7/8 JIC X FG 1.1/16 JIC", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9015",
    description: "KIT INSTALACAO GARRA + LANCA EXTENSORA EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA )",
    items: [
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 14 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "1000.1040.2705", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT", quantity: 2 },
      { code: "5000.1001.0042", description: "MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5000.0359", description: "ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2", quantity: 2 },
      { code: "3000.5000.0360", description: "ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2", quantity: 2 },
      { code: "3000.5000.0396", description: "BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0336", description: "BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1046", description: "1/2 R2 - 1800 MM X FG 7/8 JIC X MF 1/2 NPT", quantity: 2 },
      { code: "3000.5001.1045", description: "1/2 R2 - 1800 MM X FG 7/8 JIC X FG 1.1/16 JIC", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9016",
    description: "KIT INSTALACAO GARRA EM ESCAVADEIRA - ( MAQUINA SEM FATIA EXTRA)",
    items: [
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 10 },
      { code: "1000.1040.2333", description: "KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR", quantity: 1 },
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.2701", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC", quantity: 4 },
      { code: "5000.1001.0042", description: "MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5003.0008", description: "BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)", quantity: 1 },
      { code: "3000.5003.0009", description: "VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER", quantity: 1 },
      { code: "3000.5000.0301", description: "Adaptador macho/macho 3/4 UNF x 9/16 JIC", quantity: 3 }
    ]
  },
  {
    code: "9000.9000.9017",
    description: "KIT INSTALACAO GARRA EM ESCAVADEIRA - ( MAQUINA COM LINHA ROMPEDOR)",
    items: [
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "1000.1040.2701", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC", quantity: 4 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9018",
    description: "KIT INSTALACAO GARRA EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA)",
    items: [
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 10 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.2701", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC", quantity: 4 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5000.0276", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC", quantity: 4 }
    ]
  },
  {
    code: "9000.9000.9019",
    description: "KIT INSTALACAO GT600/800 ROTATOR COM PASSAGEM EXTRA EM ESCAVADEIRA 20TON - ( MAQUINA COM FATIA EXTRA SEM LINHA)",
    items: [
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2701", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC", quantity: 2 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 6 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 10 },
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "3000.5001.1134", description: "3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL", quantity: 2 },
      { code: "3000.5001.1136", description: "1/2 R2 - 2000 MM X FG 7/8 JIC X FG 90\xB0 1/2 BOL", quantity: 3 },
      { code: "3000.5001.1223", description: "3/8 R2 - 2000 MM X FG 9/16 JIC X FG 90\xB0 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "3000.5003.0006", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 1/4 BSP", quantity: 1, unit: "PC" },
      { code: "3000.5000.0291", description: "ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0321", description: "ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 3 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 2 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1038", description: "3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.1004.0018", description: "Arruela de press\xE3o M6", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9020",
    description: "KIT INSTALACAO GT600/800 ROTATOR SEM PASSAGEM EXTRA EM ESCAVADEIRA 20TON - ( MAQUINA COM FATIA EXTRA SEM LINHA)",
    items: [
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 20 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0017", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GT600-GT800 SEM PASSAGEM EXTRA", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 8 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 10 },
      { code: "3000.5003.0008", description: "BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)", quantity: 1 },
      { code: "3000.5003.0009", description: "VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER", quantity: 1 },
      { code: "3000.5000.0330", description: "ADAPTADOR TEE MACHO/FEMEA LATERAL 3/4 JIC", quantity: 2 },
      { code: "3000.5000.0301", description: "Adaptador macho/macho 3/4 UNF x 9/16 JIC", quantity: 3 },
      { code: "1000.1040.4101", description: "ABRACADEIRA SUPERIOR FERRO DUPLA PARA TUBO 27MM", quantity: 4 },
      { code: "1000.1040.2701", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC", quantity: 4 },
      { code: "3000.5001.1146", description: "5/8 R12 - 1900 MM X FG 7/8 JIC X FG 90\xB0 7/8 JIC", quantity: 4 },
      { code: "1000.1040.2711", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 7/8JIC", quantity: 2 },
      { code: "1000.1040.2333", description: "KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR", quantity: 1 },
      { code: "3000.5001.1147", description: "3/8 R2 - 3000MM X FG 7/8 JIC X FG 3/4 JIC", quantity: 1 },
      { code: "3000.5001.1084", description: "1/2 R2 - 3000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1035", description: "3/4 R12 - 3000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1038", description: "3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.1004.0018", description: "Arruela de press\xE3o M6", quantity: 2 },
      { code: "5000.1001.0018", description: "MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5001.1018", description: "3/8 R2 - 900MM X FG 3/4 JIC X FG 9/16 JIC", quantity: 2 },
      { code: "3000.5000.0276", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC", quantity: 6 },
      { code: "3000.5000.0277", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 7/8 JIC X 7/8 JIC", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9021",
    description: "KIT INSTALACAO GARRA + LINCK EM ESCAVADEIRA - ( MAQUINA SEM FATIA )",
    items: [
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "1000.1040.2333", description: "KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 6 },
      { code: "3000.5001.1110", description: "1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL", quantity: 4 },
      { code: "1000.1040.2705", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT", quantity: 4 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 8 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 24 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5000.0359", description: "ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2", quantity: 4 },
      { code: "3000.5000.0360", description: "ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2", quantity: 4 },
      { code: "3000.5000.0308", description: "Adaptador macho/macho 1/2 NPT x 7/8 JIC", quantity: 4 },
      { code: "3000.5003.0008", description: "BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)", quantity: 1 },
      { code: "3000.5003.0009", description: "VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER", quantity: 1 },
      { code: "3000.5000.0282", description: "Adaptador macho/macho 3/4 UNF x 3/4 JIC", quantity: 3 },
      { code: "3000.5001.1067", description: "1/2 R2 - 1100 MM X FG 1.1/16 JIC X FG 3/4 JIC", quantity: 2 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.1004.0018", description: "Arruela de press\xE3o M6", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9022",
    description: "KIT INSTALACAO CMF500/600 EM ESCAVADEIRA - ( MAQUINA COM LINHA ROMPEDOR )",
    items: [
      { code: "1000.1040.2707", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC", quantity: 2 },
      { code: "1000.1040.2709", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5003.0146", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP", quantity: 1 },
      { code: "3000.5000.0291", description: "ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 3 },
      { code: "3000.5000.0491", description: "ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "3000.5001.1042", description: "3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1110", description: "1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL", quantity: 3 },
      { code: "3000.5001.1134", description: "3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL", quantity: 2 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "3000.5003.0086", description: "REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN", quantity: 1 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 2 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1083", description: "3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "5000.1001.0061", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA CMF500/600", quantity: 1 },
      { code: "3000.5000.0321", description: "ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 3 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9023",
    description: "KIT INSTALACAO CMF500/600 EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA)",
    items: [
      { code: "5000.1001.0061", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA CMF500/600", quantity: 1 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1083", description: "3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1134", description: "3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL", quantity: 2 },
      { code: "3000.5001.1110", description: "1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL", quantity: 3 },
      { code: "3000.5001.1042", description: "3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "1000.1040.2707", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC", quantity: 2 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.2709", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 10 },
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5003.0146", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP", quantity: 1 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 2 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0491", description: "ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC", quantity: 1 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 3 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9024",
    description: "KIT HIDRAULICO PARA INSTALACAO SEGUNDA VELOCIDADE DESTOCADOR",
    items: [
      { code: "3000.5001.1165", description: "1/4 R17 - 600 MM X FG 9/16 JIC X FG 90\xB0 9/16 JIC", quantity: 1 },
      { code: "3000.5003.0008", description: "BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)", quantity: 1 },
      { code: "3000.5003.0009", description: "VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER", quantity: 1 },
      { code: "3000.5000.0301", description: "Adaptador macho/macho 3/4 UNF x 9/16 JIC", quantity: 3 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0321", description: "ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9025",
    description: "KIT INSTALACAO CMF500/600 EM ESCAVADEIRA - ( MAQUINA COM LINHA DE GARRA)",
    items: [
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.2707", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC", quantity: 2 },
      { code: "1000.1040.2709", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5003.0146", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP", quantity: 1 },
      { code: "3000.5000.0491", description: "ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "3000.5001.1042", description: "3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1110", description: "1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL", quantity: 3 },
      { code: "3000.5001.1134", description: "3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL", quantity: 2 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 2 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1083", description: "3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 },
      { code: "5000.1001.0061", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA CMF500/600", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 3 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9026",
    description: "KIT INSTALACAO CMF500/600 EM ESCAVADEIRA - ( MAQUINA SEM FATIA EXTRA )",
    items: [
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2707", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC", quantity: 2 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.2333", description: "KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR", quantity: 1 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 10 },
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.2709", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "3000.5001.1134", description: "3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL", quantity: 2 },
      { code: "3000.5001.1110", description: "1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL", quantity: 3 },
      { code: "3000.5001.1042", description: "3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5003.0006", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 1/4 BSP", quantity: 1, unit: "PC" },
      { code: "3000.5000.0291", description: "ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 4 },
      { code: "3000.5000.0321", description: "ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC", quantity: 2 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "3000.5003.0086", description: "REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN", quantity: 1 },
      { code: "3000.5003.0008", description: "BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)", quantity: 1 },
      { code: "3000.5003.0009", description: "VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER", quantity: 1 },
      { code: "3000.5000.0301", description: "Adaptador macho/macho 3/4 UNF x 9/16 JIC", quantity: 3 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 2 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1083", description: "3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9027",
    description: "KIT ELETRO HIDRAULICO PA CARREGADEIRA PARA INSTALACAO DE 3\xAA E 4\xAA FUNCAO 24V",
    items: [
      { code: "5000.1001.0058", description: "CAIXA ELETRICA 02 FUNCOES 24V", quantity: 1 },
      { code: "3000.5000.0288", description: "Adaptador macho/macho 1/2 BSP x 1.1/16 JIC", quantity: 4 },
      { code: "3000.5000.0283", description: "ADAPTADOR MACHO/MACHO 1/2 BSPP PARALELO COM ANEL VEDACAO ED X 7/8 JIC", quantity: 4 },
      { code: "2000.1000.0743", description: "SUPORTE VALVULA 6 VIAS", quantity: 1 },
      { code: "3000.1001.0068", description: "Parafuso Allen 12.9-M8 x 90", quantity: 2 },
      { code: "3000.1001.0069", description: "PARAFUSO ALLEN 12.9-M8 X 160", quantity: 4 },
      { code: "3000.1003.0005", description: "Porca M8 parlock", quantity: 6 },
      { code: "3000.2001.0338", description: "Oring D.I. 26,70 x 1,78 - NBR-90sh - ref. Parker 2023", quantity: 2 },
      { code: "3000.5003.0092", description: "VALVULA SOLENOIDE DVS90-6-G1/2- 6 VIAS PADRAO G1/2, VAZAO HIDRAULICA MAX. DE 90 LPM COM BOBINA DE ACIONAMENTO 12 OU 24 VDC, UTILIZADA PARA ACIONAMENTO DE MOVIMENTOS HIDRAULICOS EM EQUIPAMENTOS_NCM:8481.80.92", quantity: 2, unit: "PC" },
      { code: "3000.5000.0364", description: "ABRACADEIRA DUPLA TUBO 25MM P/ SOLDAR", quantity: 4 },
      { code: "3000.5000.0276", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC", quantity: 2 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5000.0277", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 7/8 JIC X 7/8 JIC", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9028",
    description: "KIT ELETRO HIDRAULICO PA CARREGADEIRA PARA INSTALACAO DE 3\xAA FUNCAO 24V",
    items: [
      { code: "5000.1001.0051", description: "CAIXA ELETRICA 01 FUNCAO 12/24V", quantity: 1 },
      { code: "3000.5003.0092", description: "VALVULA SOLENOIDE DVS90-6-G1/2- 6 VIAS PADRAO G1/2, VAZAO HIDRAULICA MAX. DE 90 LPM COM BOBINA DE ACIONAMENTO 12 OU 24 VDC, UTILIZADA PARA ACIONAMENTO DE MOVIMENTOS HIDRAULICOS EM EQUIPAMENTOS_NCM:8481.80.92", quantity: 1, unit: "PC" },
      { code: "3000.5000.0288", description: "Adaptador macho/macho 1/2 BSP x 1.1/16 JIC", quantity: 4 },
      { code: "3000.5000.0283", description: "ADAPTADOR MACHO/MACHO 1/2 BSPP PARALELO COM ANEL VEDACAO ED X 7/8 JIC", quantity: 2 },
      { code: "2000.1000.0743", description: "SUPORTE VALVULA 6 VIAS", quantity: 1 },
      { code: "3000.1001.0068", description: "Parafuso Allen 12.9-M8 x 90", quantity: 2 },
      { code: "3000.1003.0005", description: "Porca M8 parlock", quantity: 2 },
      { code: "3000.5000.0364", description: "ABRACADEIRA DUPLA TUBO 25MM P/ SOLDAR", quantity: 2 },
      { code: "5000.1001.0043", description: "BOTAO PULSANTE 12MM P9 900016054489 + CAPA P9 C401245-25-1", quantity: 2 },
      { code: "3000.5000.0276", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0277", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 7/8 JIC X 7/8 JIC", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9029",
    description: "KIT ELETRO HIDRAULICO COMANDO 2 SECCAO 24V PA CARREGADEIRA BOMBA ENGRENAGEM ( 120L/ 250BAR )",
    items: [
      { code: "5000.1001.0053", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR", quantity: 1 },
      { code: "3000.5003.0147", description: "COMANDO ELETRICO 80LTS - 02 SECC24V", quantity: 1 },
      { code: "3000.5000.0287", description: "Adaptador macho/macho 7/8 UNF x 7/8 JIC", quantity: 4 },
      { code: "3000.5000.0292", description: "Adaptador macho/macho 1/8 NPT x 7/16 JIC", quantity: 1 },
      { code: "5000.1001.0018", description: "MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5000.0428", description: "Adaptador macho/macho 7/8 UNF X 1.1/16 JIC", quantity: 3 },
      { code: "5000.1001.0057", description: "CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619", quantity: 4 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "3000.5003.0157", description: "BLOCO REGULADOR DE FLUXO 3 VIAS 12V 3/4 BSP ( 200L/MIM)", quantity: 1 },
      { code: "3000.5000.0294", description: "Adaptador macho/macho 3/4 BSP x 1.1/16 JIC", quantity: 3 }
    ]
  },
  {
    code: "9000.9000.9030",
    description: "KIT COMANDO ELETRO HIDRAULICO PA CARREGADEIRA 2 FUNCOES LS 24V ( MAQUINA BOMBA PISTAO )",
    items: [
      { code: "3000.5003.0100", description: "COMANDO HIDRAULICO ELETRICO SDS180/2 - AC(XG-180) /18EI3L/18EI3L/RV-KE2R3-24CDV", quantity: 1 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 3 },
      { code: "5000.1001.0053", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR", quantity: 1 },
      { code: "3000.5000.0284", description: "Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC", quantity: 4 },
      { code: "3000.5000.0307", description: "Adaptador macho/macho 1.5/16 UNF x 1.1/16 JIC", quantity: 3 },
      { code: "1000.1040.5200", description: "TEE 1.1/16 USINADO", quantity: 1 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0491", description: "ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1167", description: "1/4 R17 - 1000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9031",
    description: "KIT ELETRO HIDRAULICO COMANDO 1 SECCAO 12V ( 120L/ 250BAR )",
    items: [
      { code: "5000.1001.0050", description: "CAIXA ELETRICA 02 FUNCOES 12V", quantity: 1 },
      { code: "3000.5003.0091", description: "COMANDO 1 FUNCAO - CH100 - 1CE - ELETRICO - 12VOLTS", quantity: 1 },
      { code: "3000.5000.0287", description: "Adaptador macho/macho 7/8 UNF x 7/8 JIC", quantity: 2 },
      { code: "3000.5000.0428", description: "Adaptador macho/macho 7/8 UNF X 1.1/16 JIC", quantity: 3 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "5000.1001.0057", description: "CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619", quantity: 2 },
      { code: "3000.5000.0428", description: "Adaptador macho/macho 7/8 UNF X 1.1/16 JIC", quantity: 1 },
      { code: "3000.5003.0174", description: "VALVULA ALIVIO VSD8 - (COMANDO 90LTS VH)", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9032",
    description: "KIT INSTALACAO VIA HIDRAULICA EXTRA MANUAL PARA IMPLEMENTO",
    items: [
      { code: "3000.5003.0039", description: "REGISTRO VALVULA ESFERA 3 VIAS 1/2 BSP", quantity: 2 },
      { code: "3000.5000.0395", description: "ADAPTADOR MACHO/FEMEA 1/2 NPT X 7/8 JIC", quantity: 4 },
      { code: "3000.5000.0283", description: "ADAPTADOR MACHO/MACHO 1/2 BSPP PARALELO COM ANEL VEDACAO ED X 7/8 JIC", quantity: 2 },
      { code: "3000.5000.0358", description: "PINO ENGATE HID. RAPIDO ROSCA FEMEA 1/2 NPT- (AGRICOLA)", quantity: 2 },
      { code: "3000.5000.0357", description: "Engate r\xE1pido 1/2 NPT f\xEAmea (agr\xEDcola)", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9033",
    description: "KIT ELETRO HIDRAULICO COMANDO 1 SECCAO 24V ( 120L/ 250BAR )",
    items: [
      { code: "5000.1001.0058", description: "CAIXA ELETRICA 02 FUNCOES 24V", quantity: 1 },
      { code: "3000.5003.0152", description: "COMANDO ELETRICO 80LTS - 01 SECC24V", quantity: 1 },
      { code: "3000.5000.0287", description: "Adaptador macho/macho 7/8 UNF x 7/8 JIC", quantity: 2 },
      { code: "3000.5000.0284", description: "Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC", quantity: 2 },
      { code: "5000.1001.0042", description: "MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "5000.1001.0057", description: "CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619", quantity: 2 },
      { code: "3000.5003.0149", description: "CONECTOR PASSAGEM PRESSAO P80", quantity: 1 },
      { code: "3000.5000.0428", description: "Adaptador macho/macho 7/8 UNF X 1.1/16 JIC", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9034",
    description: "KIT ELETRO HIDRAULICO COMANDO 2 SECCAO 12V ( 120L/ 250BAR )",
    items: [
      { code: "5000.1001.0052", description: "CAIXA ELETRICA 04 FUNCOES 12V ( 4 RELES )", quantity: 1 },
      { code: "3000.5003.0161", description: "COMANDO ELETRICO 100LTS - 02 SECC12V - (V027C100-0001-12VDC)", quantity: 1 },
      { code: "3000.5000.0287", description: "Adaptador macho/macho 7/8 UNF x 7/8 JIC", quantity: 4 },
      { code: "5000.1001.0018", description: "MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5000.0428", description: "Adaptador macho/macho 7/8 UNF X 1.1/16 JIC", quantity: 3 },
      { code: "3000.5000.0337", description: "BUJAO MACHO SEXTAVADO INTERNO 3/8 BSP", quantity: 1 },
      { code: "5000.1001.0057", description: "CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619", quantity: 4 }
    ]
  },
  {
    code: "9000.9000.9035",
    description: 'KIT INSTALACAO CMF500/600 EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA "ACIONADA" SEM LINHA)',
    items: [
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2707", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 7/8JIC", quantity: 2 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 10 },
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.2709", description: "TUBO HIDRAULICO 3/4 X 1200 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "3000.5001.1134", description: "3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL", quantity: 2 },
      { code: "3000.5001.1110", description: "1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL", quantity: 3 },
      { code: "3000.5001.1042", description: "3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5003.0006", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 1/4 BSP", quantity: 1, unit: "PC" },
      { code: "3000.5000.0291", description: "ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 4 },
      { code: "3000.5000.0321", description: "ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "3000.5003.0086", description: "REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN", quantity: 1 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 2 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1083", description: "3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9037",
    description: "KIT INSTALACAO CMF500/600 EM ESCAVADEIRA - ( MAQUINA COM LINHA DE HARVESTER)",
    items: [
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "3000.5001.1134", description: "3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL", quantity: 2 },
      { code: "3000.5001.1110", description: "1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL", quantity: 3 },
      { code: "3000.5001.1042", description: "3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5003.0146", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP", quantity: 1 },
      { code: "3000.5000.0291", description: "ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 3 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "3000.5003.0086", description: "REGULADORA DE PRESSAO 1/4 - 40-250 BAR 25 LITROS S/MIN", quantity: 1 },
      { code: "3000.5001.1083", description: "3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0491", description: "ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC", quantity: 1 },
      { code: "5000.1001.0042", description: "MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9038",
    description: "KIT INSTALACAO GT600/800 ROTATOR SEM PASSAGEM EXTRA EM ESCAVADEIRA ( MAQUINA COM LINHA DE HARVESTER)",
    items: [
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 10 },
      { code: "1000.1040.2333", description: "KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR", quantity: 1 },
      { code: "1000.1040.4101", description: "ABRACADEIRA SUPERIOR FERRO DUPLA PARA TUBO 27MM", quantity: 4 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0017", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GT600-GT800 SEM PASSAGEM EXTRA", quantity: 1 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1146", description: "5/8 R12 - 1900 MM X FG 7/8 JIC X FG 90\xB0 7/8 JIC", quantity: 4 },
      { code: "3000.5001.1147", description: "3/8 R2 - 3000MM X FG 7/8 JIC X FG 3/4 JIC", quantity: 1 },
      { code: "3000.5001.1084", description: "1/2 R2 - 3000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1035", description: "3/4 R12 - 3000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1038", description: "3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0301", description: "Adaptador macho/macho 3/4 UNF x 9/16 JIC", quantity: 3 },
      { code: "3000.5003.0008", description: "BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)", quantity: 1 },
      { code: "3000.5003.0009", description: "VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER", quantity: 1 },
      { code: "3000.5000.0330", description: "ADAPTADOR TEE MACHO/FEMEA LATERAL 3/4 JIC", quantity: 2 },
      { code: "5000.1001.0042", description: "MANOPLA JOYSTICK 2 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "5000.1001.0018", description: "MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL", quantity: 1 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.1004.0018", description: "Arruela de press\xE3o M6", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9039",
    description: "KIT INSTALACAO GT600/800/360 ROTATOR SEM PASSAGEM EXTRA EM ESCAVADEIRA ( MAQUINA COM LINHA DE ROMPEDOR)",
    items: [
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 12 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0017", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GT600-GT800 SEM PASSAGEM EXTRA", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 8 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 6 },
      { code: "3000.5003.0008", description: "BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)", quantity: 1 },
      { code: "3000.5003.0009", description: "VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER", quantity: 1 },
      { code: "3000.5000.0330", description: "ADAPTADOR TEE MACHO/FEMEA LATERAL 3/4 JIC", quantity: 2 },
      { code: "3000.5000.0301", description: "Adaptador macho/macho 3/4 UNF x 9/16 JIC", quantity: 3 },
      { code: "1000.1040.4101", description: "ABRACADEIRA SUPERIOR FERRO DUPLA PARA TUBO 27MM", quantity: 4 },
      { code: "1000.1040.2701", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC", quantity: 4 },
      { code: "3000.5001.1146", description: "5/8 R12 - 1900 MM X FG 7/8 JIC X FG 90\xB0 7/8 JIC", quantity: 4 },
      { code: "1000.1040.2711", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 7/8JIC", quantity: 2 },
      { code: "1000.1040.2333", description: "KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR", quantity: 1 },
      { code: "3000.5001.1147", description: "3/8 R2 - 3000MM X FG 7/8 JIC X FG 3/4 JIC", quantity: 1 },
      { code: "3000.5001.1084", description: "1/2 R2 - 3000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1035", description: "3/4 R12 - 3000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1038", description: "3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.1004.0018", description: "Arruela de press\xE3o M6", quantity: 2 },
      { code: "5000.1001.0018", description: "MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5001.1018", description: "3/8 R2 - 900MM X FG 3/4 JIC X FG 9/16 JIC", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9040",
    description: "KIT ELETRO HIDRAULICO COMANDO COM CONTROLE DE ACIONAMENTO GARRA KL2500T EM EMPILHADEIRA",
    items: [
      { code: "3000.5003.0170", description: "VALVULA SELETORA 6 VIAS HSV06-/-A-1-P6-S1 -12V-50L/250BAR", quantity: 2 },
      { code: "3000.5000.0282", description: "Adaptador macho/macho 3/4 UNF x 3/4 JIC", quantity: 2 },
      { code: "3000.5000.0320", description: "Adaptador macho/f\xEAmea 3/4 UNF x 3/4 JIC", quantity: 2 },
      { code: "3000.5000.0502", description: "ADAPTADOR MACHO/MACHO 3/4UNF X M16 X 1,5 DKO T10", quantity: 6 },
      { code: "3000.5000.0503", description: "ADAPTADOR MACHO/FEMEA 90GRAUS M16X1,5 TB10 X M16X1,5 DKO TB10", quantity: 6 },
      { code: "3000.1001.0056", description: "Parafuso Allen 12.9-M8 x 25", quantity: 6 },
      { code: "3000.1004.0003", description: "Arruela lisa M6", quantity: 2 },
      { code: "3000.5000.0301", description: "Adaptador macho/macho 3/4 UNF x 9/16 JIC", quantity: 2 },
      { code: "3000.5000.0362", description: "ENGATE RAPIDO MACHO FACE PLANA 9/16 UNF-14 - CORPO 1/4", quantity: 2 },
      { code: "3000.5000.0361", description: "ENGATE RAPIDO FEMEA FACE PLANA 9/16 UNF-14 - CORPO 1/4", quantity: 2 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 4 },
      { code: "3000.5000.0119", description: "FEMEA GIRATORIA M16 X 1,5 T10 X 3/8", quantity: 2 },
      { code: "3000.5001.1194", description: "3/8 R2 - 900 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 2 },
      { code: "5000.1001.0007", description: "Porta Fus\xEDvel Baioneta Fio 1,5mm ETE 719", quantity: 1 },
      { code: "5000.1001.0027", description: "Conector para Reles com 5 Vias", quantity: 2 },
      { code: "3000.1002.0046", description: "PARAFUSO 4,2 X 13MM FLANGEADO CROMADO PONTA AGULHA", quantity: 2 },
      { code: "5000.1001.0038", description: "Caixa PVC 154 x 110 x 70mm S.SX.161 LIGHT IP55 - STECK", quantity: 1 },
      { code: "5000.1001.0030", description: "Cabo PP 3 x 1,00mm PT", quantity: 2.5, unit: "MT" },
      { code: "5000.1001.0005", description: "Rele Auxiliar 4 pinos 12 Volts c/ Suporte 40A", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9041",
    description: "KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - ( MAQUINA COM LINHA DE GARRA)",
    items: [
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
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
    code: "9000.9000.9042",
    description: "KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - ( MAQUINA COM LINHA HARVESTER)",
    items: [
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0039", description: "PEDAL ACIONAMENTO 10A 250V 1REV MINI TFS-100 - COM CABO 1METRO", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9043",
    description: "KIT INSTALACAO GT600/800 + LANCA EXTENSORA ROTATOR SEM PASSAGEM EXTRA EM ESCAVADEIRA 20TON - ( MAQUINA COM FATIA EXTRA SEM LINHA)",
    items: [
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 28 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 8 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 8 },
      { code: "3000.5003.0008", description: "BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)", quantity: 1 },
      { code: "3000.5003.0009", description: "VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER", quantity: 1 },
      { code: "3000.5000.0301", description: "Adaptador macho/macho 3/4 UNF x 9/16 JIC", quantity: 3 },
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.4101", description: "ABRACADEIRA SUPERIOR FERRO DUPLA PARA TUBO 27MM", quantity: 4 },
      { code: "1000.1040.2705", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT", quantity: 4 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "3000.5000.0330", description: "ADAPTADOR TEE MACHO/FEMEA LATERAL 3/4 JIC", quantity: 2 },
      { code: "1000.1040.2333", description: "KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR", quantity: 1 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1038", description: "3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.1004.0018", description: "Arruela de press\xE3o M6", quantity: 2 },
      { code: "5000.1001.0018", description: "MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5001.1018", description: "3/8 R2 - 900MM X FG 3/4 JIC X FG 9/16 JIC", quantity: 2 },
      { code: "1000.1040.2712", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 7/8JIC", quantity: 2 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0379", description: "Adaptador Painel 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1002", description: "1/2 R2 - 1200mm x FG 7/8 JIC x FG 45\xB0 7/8JIC", quantity: 4 },
      { code: "3000.5001.1046", description: "1/2 R2 - 1800 MM X FG 7/8 JIC X MF 1/2 NPT", quantity: 4 },
      { code: "3000.5001.1134", description: "3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL", quantity: 4 },
      { code: "3000.5000.0359", description: "ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2", quantity: 4 },
      { code: "3000.5000.0360", description: "ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2", quantity: 4 },
      { code: "3000.5000.0480", description: "ENGATE RAPIDO FEMEA PLT4 FACE PLANA 3/4 BSP-14 - CORPO 3/4", quantity: 2 },
      { code: "3000.5000.0479", description: "ENGATE RAPIDO MACHO PLT4 FACE PLANA 3/4 BSP-14 - CORPO 3/4", quantity: 2 },
      { code: "3000.5000.0324", description: "ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0294", description: "Adaptador macho/macho 3/4 BSP x 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1212", description: "1/2 R2 - 1800 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1213", description: "3/8 R2 - 1800 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1214", description: "3/8 R2 - 1800 MM X FG 7/8 JIC X FG 9/16 JIC", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9044",
    description: "KIT INSTALACAO CMF500/600 + LINCK ESCAVADEIRA CAT 320GC - ( MAQUINA COM FATIA EXTRA SEM LINHA)",
    items: [
      { code: "3000.5003.0100", description: "COMANDO HIDRAULICO ELETRICO SDS180/2 - AC(XG-180) /18EI3L/18EI3L/RV-KE2R3-24CDV", quantity: 1 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 38 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 10 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 3 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 4 },
      { code: "3000.5000.0284", description: "Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC", quantity: 4 },
      { code: "3000.5000.0307", description: "Adaptador macho/macho 1.5/16 UNF x 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0276", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC", quantity: 8 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 4 },
      { code: "5000.1001.0053", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR", quantity: 1 },
      { code: "5000.1001.0018", description: "MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL", quantity: 1 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 12 },
      { code: "3000.5001.1180", description: "3/4R12 - 1000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "3000.5000.0333", description: "ADAPTADOR TEE MACHO/FEMEA LATERAL 9/16 JIC", quantity: 1 },
      { code: "1000.1040.2705", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT", quantity: 2 },
      { code: "1000.1040.2712", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 7/8JIC", quantity: 2 },
      { code: "3000.5000.0359", description: "ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2", quantity: 2 },
      { code: "3000.5000.0360", description: "ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2", quantity: 2 },
      { code: "3000.5000.0480", description: "ENGATE RAPIDO FEMEA PLT4 FACE PLANA 3/4 BSP-14 - CORPO 3/4", quantity: 2 },
      { code: "3000.5000.0479", description: "ENGATE RAPIDO MACHO PLT4 FACE PLANA 3/4 BSP-14 - CORPO 3/4", quantity: 2 },
      { code: "3000.5000.0324", description: "ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0294", description: "Adaptador macho/macho 3/4 BSP x 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1134", description: "3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL", quantity: 2 },
      { code: "3000.5001.1110", description: "1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL", quantity: 3 },
      { code: "3000.5001.1042", description: "3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0395", description: "ADAPTADOR MACHO/FEMEA 1/2 NPT X 7/8 JIC", quantity: 2 },
      { code: "3000.5001.1214", description: "3/8 R2 - 1800 MM X FG 7/8 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5003.0146", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP", quantity: 1 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0491", description: "ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9045",
    description: "KIT INSTALACAO CMF500 + PONTEIRA PARA RETRO (MAQUINA COM LINHA EXTRA BI-DIRECIONAL)",
    items: [
      { code: "3000.5003.0008", description: "BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)", quantity: 1 },
      { code: "3000.5003.0009", description: "VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER", quantity: 1 },
      { code: "3000.5000.0301", description: "Adaptador macho/macho 3/4 UNF x 9/16 JIC", quantity: 3 }
    ]
  },
  {
    code: "9000.9000.9046",
    description: "KIT INSTALACAO GARRA EM ESCAVADEIRA - (MAQUINA COM LINHA EXTRA BI-DIRECIONAL)",
    items: [
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.2701", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC", quantity: 4 },
      { code: "3000.5001.1161", description: "1/2 R2 - 1650 mm x FG 7/8 JIC x FG 90\xB0 7/8 JIC", quantity: 4 }
    ]
  },
  {
    code: "9000.9000.9047",
    description: "KIT INSTALACAO GT280/360 EM GRUA - ( MAQUINA COM FATIA EXTRA )",
    items: [
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 2 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9048",
    description: "KIT INSTALACAO CMF500/600 + LINCK EM ESCAVADEIRA - ( MAQUINA COM FATIA EXTRA SEM LINHA)",
    items: [
      { code: "5000.1001.0061", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA CMF500/600", quantity: 1 },
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1083", description: "3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 8 },
      { code: "3000.5001.1134", description: "3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL", quantity: 2 },
      { code: "3000.5001.1042", description: "3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1110", description: "1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL", quantity: 3 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "1000.1040.2705", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT", quantity: 2 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5003.0146", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP", quantity: 1 },
      { code: "3000.5000.0291", description: "ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 2 },
      { code: "3000.5000.0491", description: "ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "3000.5000.0396", description: "BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0336", description: "BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0366", description: "BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC", quantity: 3 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 2 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0321", description: "ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC", quantity: 1 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5003.0075", description: "Valvula esfera 2 vias 3/4BSP", quantity: 2 },
      { code: "3000.5000.0359", description: "ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2", quantity: 3 },
      { code: "3000.5000.0360", description: "ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2", quantity: 3 },
      { code: "3000.5000.0308", description: "Adaptador macho/macho 1/2 NPT x 7/8 JIC", quantity: 2 },
      { code: "3000.5000.0294", description: "Adaptador macho/macho 3/4 BSP x 1.1/16 JIC", quantity: 6 },
      { code: "3000.5000.0324", description: "ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC", quantity: 4 },
      { code: "3000.5000.0361", description: "ENGATE RAPIDO FEMEA FACE PLANA 9/16 UNF-14 - CORPO 1/4", quantity: 1 },
      { code: "3000.5000.0362", description: "ENGATE RAPIDO MACHO FACE PLANA 9/16 UNF-14 - CORPO 1/4", quantity: 1 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 4 },
      { code: "3000.5003.0188", description: "VALVULA CONTROLE FLUXO BI-DIRECIONAL 3/4 BSP", quantity: 2 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "3000.5000.0399", description: "Adaptador macho/femea 9/16 UNF X 9/16 JIC", quantity: 1 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 14 }
    ]
  },
  {
    code: "9000.9000.9049",
    description: "KIT INSTALACAO CMF500/600 + LINCK EM ESCAVADEIRA - ( MAQUINA COM LINHA DE GARRA)",
    items: [
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1083", description: "3/8 R2 - 12000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "3000.5001.1134", description: "3/4R12 - 2000 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL", quantity: 2 },
      { code: "3000.5001.1042", description: "3/8 R2 - 2000 MM X FG 9/16 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1110", description: "1/2 R2 - 2000 MM X FG 7/8 JIC X FG 1/2 BSP BOL", quantity: 3 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 2 },
      { code: "1000.1040.2705", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1/2NPT", quantity: 2 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 14 },
      { code: "3000.5000.0318", description: "Adaptador Painel 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5003.0146", description: "VALVULA CONTROLE FLUXO UNIDIRECIONAL 3/8 BSP", quantity: 1 },
      { code: "3000.5000.0291", description: "ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 2 },
      { code: "3000.5000.0491", description: "ADAPTADOR MACHO/FEMEA 3/8 BSP X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "2000.1000.3147", description: "CHAPA PAINEL 9/16 -7/8 INSTALACAO", quantity: 1 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5000.0396", description: "BUJAO FEMEA SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0336", description: "BUJAO MACHO SEXTAVADO EXTERNO 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0366", description: "BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC", quantity: 3 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 2 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 1 },
      { code: "3000.5000.0321", description: "ADAPTADOR MACHO/FEMEA 1/4 BSP X 9/16 JIC", quantity: 1 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5003.0075", description: "Valvula esfera 2 vias 3/4BSP", quantity: 2 },
      { code: "3000.5000.0359", description: "ENGATE RAPIDO FEMEA FACE PLANA 1/2 NPT-14 CORPO 1/2", quantity: 2 },
      { code: "3000.5000.0360", description: "ENGATE RAPIDO MACHO FACE PLANA 1/2 NPT-14 - CORPO 1/2", quantity: 2 },
      { code: "3000.5000.0308", description: "Adaptador macho/macho 1/2 NPT x 7/8 JIC", quantity: 2 },
      { code: "3000.5000.0294", description: "Adaptador macho/macho 3/4 BSP x 1.1/16 JIC", quantity: 6 },
      { code: "3000.5000.0324", description: "ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC", quantity: 4 },
      { code: "3000.5000.0361", description: "ENGATE RAPIDO FEMEA FACE PLANA 9/16 UNF-14 - CORPO 1/4", quantity: 1 },
      { code: "3000.5000.0362", description: "ENGATE RAPIDO MACHO FACE PLANA 9/16 UNF-14 - CORPO 1/4", quantity: 1 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 4 },
      { code: "3000.5003.0182", description: "REGISTRO VALVULA ESFERA 3 VIAS 3/4BSP", quantity: 2 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "3000.5000.0399", description: "Adaptador macho/femea 9/16 UNF X 9/16 JIC", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9050",
    description: "KIT COMANDO ELETRO HIDRAULICO PA CARREGADEIRA 1 FUNCAO LS 24V (MAQUINA BOMBA PISTAO)",
    items: [
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 3 },
      { code: "1000.1040.2333", description: "KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR", quantity: 1 },
      { code: "5000.1001.0053", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR", quantity: 1 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "5000.1001.0043", description: "BOTAO PULSANTE 12MM P9 900016054489 + CAPA P9 C401245-25-1", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9051",
    description: "KIT INSTALACAO FELLER TESOURA EM ESCAVADEIRA - ( MAQUINA COM LINHA DE GARRA )",
    items: [
      { code: "3000.5003.0100", description: "COMANDO HIDRAULICO ELETRICO SDS180/2 - AC(XG-180) /18EI3L/18EI3L/RV-KE2R3-24CDV", quantity: 1 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 24 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1175", description: "3/4 R12 - 2300 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0311", description: "ADAPTADOR MACHO/MACHO 3/8 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC", quantity: 4 },
      { code: "3000.5000.0381", description: "Adaptador macho/macho 1/2 BSP x 9/16 JIC", quantity: 2 },
      { code: "3000.5000.0284", description: "Adaptador macho/macho 1.1/16 UNF x 1.1/16 JIC", quantity: 4 },
      { code: "3000.5000.0307", description: "Adaptador macho/macho 1.5/16 UNF x 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0276", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC", quantity: 6 },
      { code: "3000.5000.0274", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 9/16 JIC X 9/16 JIC", quantity: 2 },
      { code: "5000.1001.0053", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR", quantity: 1 },
      { code: "5000.1001.0018", description: "MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL", quantity: 1 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "3000.5001.1180", description: "3/4R12 - 1000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "3000.5000.0333", description: "ADAPTADOR TEE MACHO/FEMEA LATERAL 9/16 JIC", quantity: 2 },
      { code: "3000.5001.1008", description: "1/2 R2 - 2300 MM X FG 7/8 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1138", description: "3/4R12 - 1000 MM X FG 1.1/16 JIC X FG 90\xB0 1.1/16 JIC", quantity: 4 },
      { code: "3000.5001.1009", description: "3/4 R2 - 1300 MM X FG 1.1/16 JIC X FG 90\xB0 1.1/16 JIC", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9052",
    description: "ACIONAMENTO ELETRO HIDRAULICO PARA GARRA FLORESTAL NA ESCAVADEIRA - EXPORTACAO",
    items: [
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0016", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GARRA/DESTOCADOR/ FELLER SEM ACUMALADOR", quantity: 1 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9053",
    description: "ACIONAMENTO ELETRO HIDRAULICO PARA CABECOTE MULTIFUNCIONAL NA ESCAVADEIRA - EXPORTACAO",
    items: [
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0061", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA CMF500/600", quantity: 1 },
      { code: "5000.1001.0059", description: "MANOPLA JOYSTICK 3 BOTOES- PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 3 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.1004.0018", description: "Arruela de press\xE3o M6", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9054",
    description: "ACIONAMENTO ELETRO HIDRAULICO PARA GARRA TRACADORA NA ESCAVADEIRA - EXPORTACAO",
    items: [
      { code: "1000.1040.2305", description: "KIT ACIONAMENTO FATIA AUXILIAR 24V", quantity: 1 },
      { code: "5000.1001.0017", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA GT600-GT800 SEM PASSAGEM EXTRA", quantity: 1 },
      { code: "5000.1001.0018", description: "MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5003.0008", description: "BLOCO PADRAO SDC10-3-S8S (ZNC PRETO)", quantity: 1 },
      { code: "3000.5003.0009", description: "VALVULA REDUTORA DE PRESSAO PRRS-10-N-S-0-30 BUCHER", quantity: 1 },
      { code: "3000.5000.0330", description: "ADAPTADOR TEE MACHO/FEMEA LATERAL 3/4 JIC", quantity: 2 },
      { code: "3000.5000.0301", description: "Adaptador macho/macho 3/4 UNF x 9/16 JIC", quantity: 3 },
      { code: "2000.1000.3181", description: "CHAPA SUPORTE VALVULA PILOTO SIMPLES", quantity: 1 },
      { code: "3000.1000.0076", description: "Parafuso Sextavado 8.8-M6 x 45", quantity: 2 },
      { code: "3000.1003.0073", description: "Porca M6 parlock", quantity: 2 },
      { code: "3000.1004.0018", description: "Arruela de press\xE3o M6", quantity: 2 },
      { code: "1000.1040.2333", description: "KIT VALVULA DIRECIONAL TN6 DUPLA FUNCAO 24V - PARA LINHA ROTATOR", quantity: 1 }
    ]
  },
  {
    code: "9000.9000.9056",
    description: 'KIT INSTALACAO FELLER DISCO EM ESCAVADEIRA CAT 320 GC- ( MAQUINA COM FATIA EXTRA "ACIONADA" COM LINHA EXTRA)',
    items: [
      { code: "1000.1040.5700", description: "FLANGE 1.3/4 (44,5) X COM ROSCA 3/4 BSP", quantity: 1 },
      { code: "3000.2001.0349", description: "Oring W 3,53 x D.I. 32,92 - ref. Parker 2219", quantity: 1 },
      { code: "3000.5000.0307", description: "Adaptador macho/macho 1.5/16 UNF x 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0276", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC", quantity: 1 },
      { code: "3000.5000.0324", description: "ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC", quantity: 1 },
      { code: "3000.5000.0287", description: "Adaptador macho/macho 7/8 UNF x 7/8 JIC", quantity: 1 },
      { code: "3000.1001.0016", description: "Parafuso Allen 12.9-M10 x 40", quantity: 4 },
      { code: "5000.1001.0012", description: "Plug Conector 24V", quantity: 1 },
      { code: "3000.5000.0376", description: "Adaptador macho/macho 7/16 UNF x 9/16 JIC", quantity: 1 },
      { code: "3000.5003.0190", description: "BOBINA 24V 20W -( VALVULA 2/2 OD1533175A000000 VEI 016 NC 1)", quantity: 1 },
      { code: "3000.5002.0090", description: 'BOMBA PISTAO A10VO72 DRS/3R VSC12K52 - (EIXO 1" X 15DENTES) 105 L/MIN', quantity: 1 },
      { code: "3000.5003.0191", description: "BLOCO SDC16-2-S16S- 1.5/16 UNF", quantity: 1 },
      { code: "3000.5003.0192", description: "VALVULA 2/2 OD1533175A000000 VEI 016 NC 1 - (2VIAS PARA BLOCO SDC16)", quantity: 1 },
      { code: "1000.2039.0101", description: "Adaptador usinado 9/16 JIC", quantity: 1 },
      { code: "5000.1001.0053", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR", quantity: 1 },
      { code: "3000.5003.0158", description: "COMANDO ELETRICO 100L 02 SECC24V COM VALVULAS DE ALIVIO NAS FATIAS + BUJAO PASSAGEM PRESSAO", quantity: 1 },
      { code: "5000.1001.0057", description: "CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619", quantity: 4 },
      { code: "3000.5000.0287", description: "Adaptador macho/macho 7/8 UNF x 7/8 JIC", quantity: 7 },
      { code: "3000.5000.0366", description: "BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC", quantity: 1 },
      { code: "3000.5000.0426", description: "ABRACADEIRA MANGOTE PESADO 32MM MSA 54-62 (PARA MANGUEIRA SUCCAO 2)", quantity: 2 },
      { code: "3000.5001.0029", description: "MANGUEIRA HIDRAULICA R4 2 (SUCCAO)", quantity: 0.8, unit: "MT" },
      { code: "3000.5000.0436", description: 'MACHO FIXO 2 NPT X 2 (MANGUEIRA DE 2")', quantity: 1 },
      { code: "3000.5000.0516", description: "FLANGE BIPARTIDA 2 (PARA FLANGE \xD871,4)", quantity: 1, unit: "PAR" },
      { code: "3000.5000.0517", description: 'FLANGE RETA 71,4MM X 2"', quantity: 1 },
      { code: "3000.5001.1179", description: "1/4 R17 - 550 MM X FG 9/16 JIC X FG 90\xB0 9/16 JIC", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 12 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 6 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 12 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 36 },
      { code: "3000.5003.0075", description: "Valvula esfera 2 vias 3/4BSP", quantity: 6 },
      { code: "3000.5000.0294", description: "Adaptador macho/macho 3/4 BSP x 1.1/16 JIC", quantity: 6 },
      { code: "3000.5000.0324", description: "ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC", quantity: 6 },
      { code: "1000.1040.1107", description: "ADAPTADOR PARA SOLDA 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "2000.1000.2847", description: "CHAPA PERFIL L ADAPTADOR PAINEL 7/8", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "4000.5000.0019", description: "ABRACADEIRA NYLON 4,8 X 400MM", quantity: 30 }
    ]
  },
  {
    code: "9000.9000.9057",
    description: "KIT INSTALACAO GARRA EM ESCAVADEIRA CAT 320GC COM FATIA DUPLA ACIONADA",
    items: [
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 10 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 4 },
      { code: "1000.1040.2701", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC", quantity: 4 },
      { code: "3000.5000.0276", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC", quantity: 4 }
    ]
  },
  {
    code: "9000.9000.9059",
    description: 'KIT INSTALACAO GT600/800 ROTATOR SEM PASSAGEM EXTRA EM ESCAVADEIRA CAT 320 GC/NG- ( MAQUINA COM FATIA EXTRA "ACIONADA" SEM LINHA EXTRA)',
    items: [
      { code: "1000.1040.4200", description: "ABRACADEIRA QUADRUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 2 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 20 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 8 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 10 },
      { code: "1000.1040.4101", description: "ABRACADEIRA SUPERIOR FERRO DUPLA PARA TUBO 27MM", quantity: 4 },
      { code: "1000.1040.2701", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 1.1/16JIC", quantity: 4 },
      { code: "3000.5001.1146", description: "5/8 R12 - 1900 MM X FG 7/8 JIC X FG 90\xB0 7/8 JIC", quantity: 4 },
      { code: "1000.1040.2711", description: "TUBO HIDRAULICO 3/4 X 2000 X 7/8JIC X 7/8JIC", quantity: 2 },
      { code: "3000.5001.1147", description: "3/8 R2 - 3000MM X FG 7/8 JIC X FG 3/4 JIC", quantity: 1 },
      { code: "3000.5001.1084", description: "1/2 R2 - 3000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1035", description: "3/4 R12 - 3000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "1000.1040.1102", description: "ADAPTADOR PARA SOLDA 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1038", description: "3/8 R2 - 10000 MM X FG 7/8 JIC X FG 9/16 JIC", quantity: 1 },
      { code: "5000.1001.0018", description: "MANOPLA JOYSTICK 5 BOTOES - PADRAO FLORESTAL", quantity: 1 },
      { code: "3000.5000.0276", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC", quantity: 6 },
      { code: "3000.5000.0277", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 7/8 JIC X 7/8 JIC", quantity: 2 }
    ]
  },
  {
    code: "9000.9000.9060",
    description: "KIT INSTALACAO FELLER DISCO EM ESCAVADEIRA- ( MAQUINA COM FATIA EXTRA SEM LINHA EXTRA)",
    items: [
      { code: "3000.5003.0198", description: "BLOCO DE COMANDO FELLER DISCO (HYDRAFORCE 187761-26)", quantity: 1 },
      { code: "1000.1040.5700", description: "FLANGE 1.3/4 (44,5) X COM ROSCA 3/4 BSP", quantity: 1 },
      { code: "3000.2001.0349", description: "Oring W 3,53 x D.I. 32,92 - ref. Parker 2219", quantity: 2 },
      { code: "3000.5000.0276", description: "ADAPTADOR MACHO/FEMEA 90GRAUS 1.1/16 JIC X 1.1/16 JIC", quantity: 8 },
      { code: "3000.5000.0324", description: "ADAPTADOR MACHO/FEMEA 3/4 BSP X 1.1/16 JIC", quantity: 1 },
      { code: "3000.5000.0287", description: "Adaptador macho/macho 7/8 UNF x 7/8 JIC", quantity: 4 },
      { code: "3000.1001.0016", description: "Parafuso Allen 12.9-M10 x 40", quantity: 4 },
      { code: "5000.1001.0053", description: "CAIXA ELETRICA PARA KIT DE ACIONAMENTO 24V PARA FELLER COM ACUMULADOR", quantity: 1 },
      { code: "5000.1001.0057", description: "CONECTOR PLUG DEUTCH COM CABO 500MM PARA BOBINA SOLENOIDE 171147619", quantity: 5 },
      { code: "3000.5000.0366", description: "BUJAO FEMEA SEXTAVADO EXTERNO 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1188", description: "3/4R12 - 1650 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 12 },
      { code: "1000.1040.2703", description: "TUBO HIDRAULICO 3/4 X 1000 X 1.1/16JIC X 1.1/16JIC", quantity: 6 },
      { code: "1000.1040.2702", description: "TUBO HIDRAULICO 3/4 X 2000 X 1.1/16JIC X 1.1/16JIC", quantity: 12 },
      { code: "1000.1040.4100", description: "ABRACADEIRA DUPLA PARA INSTALACAO ESCAVADEIRA", quantity: 36 },
      { code: "3000.5000.0294", description: "Adaptador macho/macho 3/4 BSP x 1.1/16 JIC", quantity: 2 },
      { code: "1000.1040.1107", description: "ADAPTADOR PARA SOLDA 1.1/16 JIC", quantity: 2 },
      { code: "3000.5000.0317", description: "Adaptador Painel 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1142", description: "5/8 R2 - 11000 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "4000.5000.0019", description: "ABRACADEIRA NYLON 4,8 X 400MM", quantity: 30 },
      { code: "3000.5003.0003", description: "VALVULA CARTUCHO SV08-23-01-00-0-B-0 (PARA CRU-0129)", quantity: 1 },
      { code: "3000.5003.0004", description: "BLOCO PADRAO SDC08-3-S6S (CRU-0129) - 9/16 UNF", quantity: 1 },
      { code: "3000.5003.0084", description: "BOBINA M13-24D-20W-DN/FL - SOLENOIDE", quantity: 1 },
      { code: "3000.5000.0398", description: "Adaptador macho/macho 9/16 UNF X 9/16 JIC", quantity: 3 },
      { code: "3000.5001.1180", description: "3/4R12 - 1000 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 1 },
      { code: "3000.5001.1175", description: "3/4 R12 - 2300 MM X FG 1.1/16 JIC X FG 1.1/16 JIC", quantity: 2 },
      { code: "3000.5001.1045", description: "1/2 R2 - 1800 MM X FG 7/8 JIC X FG 1.1/16 JIC", quantity: 4 },
      { code: "3000.5001.1010", description: "1/2 R2 - 2500 MM X FG 7/8 JIC X FG 7/8 JIC", quantity: 1 },
      { code: "3000.5001.1228", description: "5/8 R12 - 1000 MM x FG 7/8 JIC x FG 1.1/16 JIC", quantity: 4 }
    ]
  }
];

// server/linkCurtoDono.ts
var PAPEIS_QUE_VEEM_COMO = ["admin", "manager"];
var UID_VALIDO = /^[A-Za-z0-9_-]{1,128}$/;
async function donoDoLinkCurto(chamador, uidPedido, parceiroAtivoExiste) {
  const pedido = typeof uidPedido === "string" ? uidPedido.trim() : "";
  if (!pedido || pedido === chamador.uid) return chamador.uid;
  if (!PAPEIS_QUE_VEEM_COMO.includes(String(chamador.role || ""))) return chamador.uid;
  if (!UID_VALIDO.test(pedido)) return chamador.uid;
  try {
    return await parceiroAtivoExiste(pedido) ? pedido : chamador.uid;
  } catch {
    return chamador.uid;
  }
}

// src/lib/pedidoEnvio.ts
var REGRA_ENVIO_EQUIPAMENTO = `REGRA DE ENVIO DO EQUIPAMENTO AO CLIENTE (vale para a equipe):
- Quando o vendedor pedir para enviar, mandar, compartilhar, apresentar, divulgar o equipamento ao cliente, ou pedir cat\xE1logo, folder, propaganda ou material de venda, N\xC3O ofere\xE7a escolha entre formatos e N\xC3O pergunte "ficha ou link". O envio \xE9 sempre o formato completo: foto grande, caracter\xEDsticas e link para o cliente ver v\xEDdeo, ficha e pedir or\xE7amento. Esse envio \xE9 o bot\xE3o verde "Enviar ao cliente" do cart\xE3o do equipamento, que aparece abaixo da sua resposta.
- Responda curto: cite o equipamento, diga que o bot\xE3o "Enviar ao cliente" manda a foto com o link e, se faltar saber qual \xE9 o equipamento, pergunte s\xF3 isso.
- S\xF3 fale em ficha em PDF e s\xF3 mostre o link da ficha quando o vendedor pedir a ficha de forma expl\xEDcita (palavras como ficha, ficha t\xE9cnica, PDF).`;

// src/lib/observacaoParceiro.ts
var TIPO_OBSERVACAO_PARCEIRO = "partner_note";
function idObservacaoParceiro(indicacaoId) {
  return `obs-parceiro-${indicacaoId || "sem-id"}`;
}
var dataValida = (v) => !!v && !Number.isNaN(new Date(v).getTime());
function autorObservacaoParceiro(ind) {
  const nome = (ind.created_by_name || "").trim() || (ind.external_seller_name || "").trim();
  return nome || "Parceiro indicador";
}
function entradaObservacaoParceiro(ind) {
  if (!ind) return null;
  const texto2 = String(ind.description ?? "").replace(/\r\n?/g, "\n").trim();
  if (!texto2) return null;
  return {
    id: idObservacaoParceiro(ind.id),
    type: TIPO_OBSERVACAO_PARCEIRO,
    author_name: autorObservacaoParceiro(ind),
    // sem data na indicação a entrada ainda aparece, mas vai para o começo (data vazia ordena primeiro)
    created_at: dataValida(ind.created_at) ? String(ind.created_at) : "",
    content: texto2,
    attachments: []
  };
}
function temObservacaoGravada(historico, indicacaoId) {
  const id = idObservacaoParceiro(indicacaoId);
  return (historico || []).some((e) => e && (e.id === id || e.type === TIPO_OBSERVACAO_PARCEIRO));
}
function entradaParaGravar(ind) {
  const e = entradaObservacaoParceiro(ind);
  if (!e || !ind) return null;
  return temObservacaoGravada(ind.negotiation_history, ind.id) ? null : e;
}

// src/lib/destocadorDth.ts
var SPECS_DTH240B = {
  diametro_corte: "660",
  maquina_base: "14 a 22 t (escavadeira) | 6 a 10 t (retro/escav. pequena)",
  pressao: "280 a 350 bar (escavadeira) | 190 a 220 bar (retro)",
  vazao: "140 a 220 L/min (escavadeira) | 100 a 150 L/min (retro)"
};
var SPECS_NOVAS_DTH240B = {
  comprimento_total: "1.452 mm",
  profundidade_trabalho: "740 mm"
};
var ANTIGOS = {
  diametro_corte: [/^\s*240\s*(mm)?\s*$/i],
  maquina_base: [/^\s*14\s*a\s*25\s*(t|ton)?\.?\s*$/i, /^\s*14\s*a\s*22\s*ton\.?\s*\(escavadeira\)\s*\|\s*6\s*a\s*10\s*ton\.?\s*\(retro\/escavadeira pequena\)\s*$/i],
  pressao: [/^\s*210\s*(a|-)\s*250\s*(bar)?\s*$/i, /^\s*280\s*a\s*350\s*\(escavadeira\)\s*\|\s*190\s*a\s*220\s*\(retro\)\s*$/i],
  vazao: [/^\s*120\s*(a|-)\s*180\s*(l\/min)?\s*$/i, /^\s*140\s*a\s*220\s*\(escavadeira\)\s*\|\s*100\s*a\s*150\s*\(retro\)\s*$/i]
};
var ehModeloDth240b = (m) => !!m && (/^dth[-_ ]?240b?$/i.test(String(m.id || "").trim()) || /^dth[-_ ]?240b?$/i.test(String(m.name || "").trim()));
function corrigirDestocadorDth240b(modelos) {
  let mudou = false;
  const novos = (modelos || []).map((m) => {
    if (!ehModeloDth240b(m) || !m.technical_specs) return m;
    const specs = { ...m.technical_specs };
    let alterou = false;
    for (const campo of Object.keys(SPECS_DTH240B)) {
      if (typeof specs[campo] === "string" && ANTIGOS[campo].some((re) => re.test(specs[campo]))) {
        specs[campo] = SPECS_DTH240B[campo];
        alterou = true;
      }
    }
    if (!alterou) return m;
    for (const campo of Object.keys(SPECS_NOVAS_DTH240B)) {
      if (!String(specs[campo] ?? "").trim()) specs[campo] = SPECS_NOVAS_DTH240B[campo];
    }
    mudou = true;
    return { ...m, technical_specs: specs };
  });
  return mudou ? novos : null;
}
function modeloParaEnvio(model) {
  const novos = corrigirDestocadorDth240b([model]);
  return novos ? novos[0] : model;
}
function comDestocadorDthCorrigido(produto) {
  const novos = corrigirDestocadorDth240b(produto?.models);
  return novos ? { ...produto, models: novos } : produto;
}

// src/lib/confirmacaoMaquina.ts
var RESSALVA_KIT = 'REGRA DE KIT: enquanto o vendedor n\xE3o AFIRMAR a configura\xE7\xE3o da m\xE1quina (fatia extra com sa\xEDda dupla, joystick eletr\xF4nico ou hidr\xE1ulico, GC/NG sem fatia), N\xC3O cite c\xF3digo de kit, N\xC3O liste op\xE7\xF5es de kit e N\xC3O escreva "poss\xEDvel kit". "Acho que tem" ou falta de informa\xE7\xE3o n\xE3o vale como afirma\xE7\xE3o, e modelo ou n\xFAmero de s\xE9rie nunca decidem. Nesse caso responda em 1 ou 2 frases curtas: a configura\xE7\xE3o varia de m\xE1quina para m\xE1quina e o primeiro passo \xE9 pedir ao cliente o v\xEDdeo no modelo do v\xEDdeo de amostra; aponte o bot\xE3o "Pedir confirma\xE7\xE3o da m\xE1quina ao cliente" logo abaixo (confirmar_maquina true). Na d\xFAvida, pe\xE7a sempre o v\xEDdeo (no modelo) OU o contato do vendedor da m\xE1quina, para o t\xE9cnico especialista conversar com ele ou analisar o v\xEDdeo e definir os kits. Lembre tamb\xE9m que o kit depende do modelo da m\xE1quina EM CONJUNTO com o tipo de suporte do implemento (link, ponteira, lan\xE7a extensora) e do equipamento, ent\xE3o pergunte o suporte e nunca chute c\xF3digo: um c\xF3digo errado entra errado no pedido de venda. S\xF3 quando o vendedor afirmar a configura\xE7\xE3o voc\xEA pode citar os kits cadastrados correspondentes, como resposta baseada no que ele informou, lembrando que o t\xE9cnico Roder confirma na confer\xEAncia final.';
var KIT_BAIXA_SEM_LINHAS = "O kit de baixa 9000.9000.9003 sozinho N\xC3O tem tubula\xE7\xF5es nem mangueiras. Pelo cadastro ele \xE9 s\xF3: a bomba de engrenagem extra (48 cc), o comando el\xE9trico de uma se\xE7\xE3o (80 L) que recebe o fluxo dessa bomba extra e a caixa el\xE9trica de controle do comando, com a manopla de joystick, o bot\xE3o pulsante, os conectores e os adaptadores de conex\xE3o. Ele SEMPRE precisa de outro kit com as linhas hidr\xE1ulicas, que depende do equipamento a instalar (9000.9000.9035 para CMF; para garra, destocador, feller e outros, o kit de linhas correspondente do cadastro).";
var TEXTO_CMF_CAT320 = "CMF em CAT 320 nova (GC, NG ou eletr\xF4nica, a partir de cerca de 2020, joystick eletr\xF4nico). S\xD3 quando o VENDEDOR AFIRMAR a configura\xE7\xE3o: (a) fatia extra dupla j\xE1 acionada no joystick eletr\xF4nico, faltando s\xF3 a tubula\xE7\xE3o: kit 9000.9000.9035 (KIT INSTALACAO CMF500/600 EM ESCAVADEIRA, MAQUINA COM FATIA EXTRA ACIONADA SEM LINHA), que traz toda a linha hidr\xE1ulica do CMF e vale para CMF 500, 600 e 800. (b) GC ou NG SEM fatia extra: kit de baixa 9000.9000.9003 (KIT BAIXA PRESSAO 1 SECCAO DUPLA CAT320GC/NG 24V, 80L/190BAR) para o giro do rotator, MAIS o 9000.9000.9035 para as linhas. " + KIT_BAIXA_SEM_LINHAS + ' CAT mais antiga de comando pilotado sem fatia extra: precisa de fatia ou bomba extra, e o t\xE9cnico Roder define. Garra de carregamento usa o 9003 para o rotator, mais o kit de linhas da garra: o t\xE9cnico informa o c\xF3digo. Em CAT 320 nova a fatia \xE9 instalada pela concession\xE1ria; nas outras m\xE1quinas, o t\xE9cnico Roder define ap\xF3s o v\xEDdeo. Sem a afirma\xE7\xE3o do vendedor, N\xC3O cite nenhum desses c\xF3digos: pe\xE7a o v\xEDdeo no modelo do v\xEDdeo de amostra e aponte o bot\xE3o. M\xE1quina nova e cliente sem a informa\xE7\xE3o: pe\xE7a o contato do vendedor ou da concession\xE1ria da m\xE1quina; a Roder fala com ele para saber como a m\xE1quina ser\xE1 fornecida e s\xF3 ent\xE3o passa o valor do kit. Se for preciso instalar a fatia extra original pela concession\xE1ria, a Roder orienta o vendedor a repassar esse valor ao cliente. O t\xE9cnico Roder confirma na confer\xEAncia final. N\xE3o declare "perigoso" ou "invi\xE1vel" s\xF3 pelo modelo; bloco de press\xE3o piloto para serra e tilt s\xF3 se o t\xE9cnico confirmar.';
var SEQUENCIA_VIDEO_PROMPT = "UM v\xEDdeo na mesma sequ\xEAncia do v\xEDdeo modelo: (1) bra\xE7o e lan\xE7a da m\xE1quina, mostrando as tubula\xE7\xF5es; (2) comando hidr\xE1ulico, que fica atr\xE1s do motor de giro; (3) dentro da cabine, os joysticks e os pedais; (4) se poss\xEDvel, em Caterpillar de modelo novo, abrir e filmar a porta traseira para mostrar a bomba hidr\xE1ulica. Fotos s\xF3 como complemento.";
var REGRA_KIT_CONFIRMACAO = `
REGRA PRIORIT\xC1RIA DE KIT DE INSTALA\xC7\xC3O (vale acima de TODAS as regras de kit mais abaixo, que s\xF3 valem depois de o vendedor afirmar a configura\xE7\xE3o):
   \u2022 PASSO 1, o padr\xE3o: quando o vendedor falar de uma m\xE1quina (escavadeira, qualquer marca, principalmente Caterpillar) e de kit, instala\xE7\xE3o, kit hidr\xE1ulico ou mangueiras, e a configura\xE7\xE3o N\xC3O foi afirmada por ele, NUNCA cite c\xF3digo de kit, NUNCA liste op\xE7\xF5es de kit e NUNCA escreva "poss\xEDvel kit". N\xE3o decida por modelo nem por n\xFAmero de s\xE9rie: o serial mostra como a m\xE1quina saiu de f\xE1brica, n\xE3o o que foi acrescentado depois. Responda curto, em 1 ou 2 frases: a configura\xE7\xE3o varia de m\xE1quina para m\xE1quina e o primeiro passo \xE9 pedir ao cliente o v\xEDdeo no modelo do v\xEDdeo de amostra. Diga que o bot\xE3o "Pedir confirma\xE7\xE3o da m\xE1quina ao cliente" est\xE1 logo abaixo, com o texto pronto para enviar, e n\xE3o escreva o texto do pedido por extenso. No JSON do <painel>, acrescente "confirmar_maquina": true.
   \u2022 O KIT N\xC3O DEPENDE S\xD3 DA FATIA NEM S\xD3 DA M\xC1QUINA: depende do modelo da m\xE1quina EM CONJUNTO com o tipo de suporte do implemento (link, ponteira, lan\xE7a extensora etc.) e do equipamento (garra, garra tra\xE7adora, cabe\xE7ote multifuncional, destocador, feller, triturador). Exemplo: garra de carregamento com link e com ponteira usam kits hidr\xE1ulicos diferentes, espec\xEDficos para a m\xE1quina; o rotator com ou sem passagem extra e as m\xE1quinas de 20 ton tamb\xE9m mudam o kit. Quando o vendedor perguntar de kit, diga isso em uma frase e pe\xE7a tamb\xE9m o tipo de suporte (link, ponteira ou lan\xE7a extensora). Esse conhecimento serve para voc\xEA explicar que as varia\xE7\xF5es existem; N\xC3O liste c\xF3digos para o vendedor, para ele n\xE3o colocar c\xF3digo errado em pedido de venda. Na d\xFAvida, pe\xE7a sempre ao cliente o v\xEDdeo (no modelo do v\xEDdeo de amostra) OU o contato do vendedor da m\xE1quina, para o t\xE9cnico especialista conversar com o vendedor ou analisar o v\xEDdeo e definir os kits.
   \u2022 PASSO 2, a \xFAnica exce\xE7\xE3o: se o vendedor AFIRMA a configura\xE7\xE3o (ex.: "\xE9 uma CAT 320 nova com joystick eletr\xF4nico e j\xE1 tem fatia extra dupla" ou "\xE9 CAT 320 GC/NG sem fatia extra"), voc\xEA pode insistir com resposta t\xE9cnica e citar o(s) kit(s) cadastrados correspondentes, como afirma\xE7\xE3o baseada no que o vendedor informou (com fatia extra dupla acionada: 9000.9000.9035; GC/NG sem fatia: o kit de baixa 9000.9000.9003 para a linha do rotator mais o kit de linhas do equipamento), lembrando que o t\xE9cnico Roder confirma na confer\xEAncia final. "Acho que tem", "deve ter" ou aus\xEAncia de informa\xE7\xE3o N\xC3O valem: volte ao passo 1. S\xF3 cite c\xF3digo que esteja na lista de kits cadastrados do contexto; sem item cadastrado, diga que o t\xE9cnico informa o c\xF3digo.
   \u2022 KIT DE BAIXA (9000.9000.9003): ${KIT_BAIXA_SEM_LINHAS}
   \u2022 REQUISITO GERAL: a m\xE1quina precisa ter, no comando hidr\xE1ulico (bloco de v\xE1lvulas), pelo menos a FATIA EXTRA COM SA\xCDDA DUPLA (duas sa\xEDdas, com os dois tamp\xF5es) dispon\xEDvel. Com ela, a Roder vende o kit de instala\xE7\xE3o completo (todas as linhas hidr\xE1ulicas, v\xE1lvulas, eletrov\xE1lvulas e acionamento el\xE9trico). Isso vale para a maioria das m\xE1quinas com joystick hidr\xE1ulico pilotado (Komatsu, Hyundai, JCB, John Deere e outras). N\xC3O exija "linhas hidr\xE1ulicas no bra\xE7o": elas s\xE3o s\xF3 um complemento opcional do v\xEDdeo, nunca requisito.
   \u2022 CAT 320 tem v\xE1rias configura\xE7\xF5es. Antigas (320C, 320D, 320FM): comando pilotado com joystick hidr\xE1ulico, mesmo padr\xE3o das outras marcas. Novas (a partir de cerca de 2020: 320GC, 320NG nova gera\xE7\xE3o, e "320" sem nomenclatura antiga): joystick ELETR\xD4NICO, de acionamento el\xE9trico, n\xE3o pilotado. Nelas, para os equipamentos que exigem fatia extra, a m\xE1quina J\xC1 deve ter a fatia extra no comando, ligada ao joystick eletr\xF4nico por chicote el\xE9trico. Muitas saem sem fatia extra, e a Roder N\xC3O instala fatia extra em CAT nova: o cliente deve pedir \xE0 concession\xE1ria que instale a fatia extra e deixe a liga\xE7\xE3o el\xE9trica/eletr\xF4nica pronta no joystick. S\xF3 diga isso depois de o v\xEDdeo mostrar o caso ou de o vendedor afirm\xE1-lo; n\xE3o presuma pelo modelo.
   \u2022 EXCE\xC7\xC3O na CAT 320 nova: garra de carregamento, garras florestais (de carregamento) e cabe\xE7ote multifuncional podem ser instalados MESMO SEM fatia extra, com o "kit de baixa" (9003; o t\xE9cnico confirma a press\xE3o; cadastro do 9003: 190 bar). ${TEXTO_CMF_CAT320} Esta exce\xE7\xE3o tamb\xE9m s\xF3 vale depois de o vendedor afirmar a configura\xE7\xE3o (passo 2).
   \u2022 PROPOSTA OU LISTA DE COMPONENTES (ex.: vendedor de pe\xE7as ou exporta\xE7\xE3o pergunta o que incluir na proposta de um CMF numa CAT 320, com s\xE9rie informada e "configura\xE7\xE3o padr\xE3o"): "padr\xE3o" e s\xE9rie n\xE3o s\xE3o afirma\xE7\xE3o. N\xC3O entregue lista de kit, v\xE1lvulas e linhas, nem cite c\xF3digo. Explique em 2 frases que a CAT 320 tem configura\xE7\xF5es diferentes (antiga com joystick hidr\xE1ulico, nova com joystick eletr\xF4nico; fatia extra com sa\xEDda dupla j\xE1 instalada ou n\xE3o), pe\xE7a o v\xEDdeo no modelo do v\xEDdeo de amostra e aponte o bot\xE3o. O t\xE9cnico Roder confirma os kits.
   \u2022 Melhor resposta: pedir o v\xEDdeo para passar ao t\xE9cnico Roder respons\xE1vel, que informa os kits e se o cliente precisa pedir a fatia extra \xE0 concession\xE1ria. Explique em 2 frases curtas por que a configura\xE7\xE3o \xE9 confirmada assim, sem afirmar kit nem fatia por serial ou modelo.
   \u2022 O pedido ao cliente \xE9 ${SEQUENCIA_VIDEO_PROMPT} N\xE3o d\xEA a entender que a concession\xE1ria \xE9 obrigat\xF3ria antes da an\xE1lise: por ora \xE9 s\xF3 coletar o v\xEDdeo.
   \u2022 No JSON do <painel>, sempre que aplicar esta regra sem a afirma\xE7\xE3o do vendedor, acrescente "confirmar_maquina": true.`;
var AVISO_SEM_AMOSTRA = "Ainda n\xE3o h\xE1 v\xEDdeo de amostra cadastrado.";
function instrucaoAmostra(temAmostra) {
  return temAmostra ? "\n\nV\xCDDEO DE AMOSTRA DE FILMAGEM: j\xE1 est\xE1 cadastrado. O bot\xE3o do pedido de confirma\xE7\xE3o leva o link sozinho; n\xE3o escreva link nem id de v\xEDdeo no texto." : `

V\xCDDEO DE AMOSTRA DE FILMAGEM: ainda n\xE3o h\xE1 v\xEDdeo cadastrado. Quando aplicar a regra de confirma\xE7\xE3o da m\xE1quina, diga ao vendedor numa frase curta: "${AVISO_SEM_AMOSTRA}" O bot\xE3o do pedido continua funcionando, s\xF3 sem o link.`;
}
function linkPublicoDoVideo(v) {
  const u = String(v?.video_url || "").trim();
  return /^https:\/\/[^\s]+$/i.test(u) && u.length <= 2e3 ? u : "";
}
function videoAmostraDe(lista) {
  return (lista || []).find((v) => v.tipo === "amostra" && !!linkPublicoDoVideo(v));
}

// server/consultorParceiro.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_stream = require("stream");

// src/lib/videoEquipamento.ts
var PRODUCT_VIDEOS = {
  "CMF 600": "https://www.youtube.com/watch?v=0_u6eJ6-YnQ",
  "CMF 500": "https://www.youtube.com/watch?v=Aof_7Q-fS1s",
  "CMF 800": "https://www.youtube.com/watch?v=t5A9Tj_C9n4",
  "GPR 4500": "https://www.youtube.com/watch?v=W0ybyuB9gB0",
  "GPR 7000": "https://www.youtube.com/watch?v=W0ybyuB9gB0",
  "R250": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R280": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R360": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R360G": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R400": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R600": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R800": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "Mini Skidder": "https://youtu.be/OE0bsl5FlRw",
  "MSR 600": "https://youtu.be/OE0bsl5FlRw",
  "MSR 1000": "https://youtu.be/OE0bsl5FlRw",
  "Garra Frontal": "https://youtu.be/tlp3Grju-LM",
  "Garra para Estufagem": "https://youtu.be/tlp3Grju-LM",
  "AF400": "https://youtu.be/tlp3Grju-LM",
  "AF 400": "https://youtu.be/tlp3Grju-LM",
  "AF - 400": "https://youtu.be/tlp3Grju-LM",
  "SSH 150": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH 200": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH 225": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH 250": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH-150": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH-200": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH-225": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH-250": "https://www.youtube.com/watch?v=na5Z2tLWMgA"
};
var VIDEOS_MORTOS = ["t_8n_nlf2xk"];
function videoValido(url) {
  const v = String(url || "").trim();
  if (!v) return "";
  if (!/^https?:\/\//i.test(v) && !/^db-file:\/\/[A-Za-z0-9_-]+$/.test(v)) return "";
  if (VIDEOS_MORTOS.some((m) => v.toLowerCase().includes(m))) return "";
  if (/^https?:\/\/(www\.)?roderbrasil\.com\.br\/(?!.*\.(mp4|webm|mov)(\?|$))/i.test(v)) return "";
  return v;
}
var VIDEO_GARRA = "Kzqi_Cn2WG4";
var ehSkidder = (nome) => /skidder|^msr\b/i.test(String(nome || ""));
var semVideoErrado = (url, prod, model) => String(url || "").includes(VIDEO_GARRA) && (ehSkidder(prod?.name) || ehSkidder(model?.name)) ? "" : url;
function videoDoEquipamento(prod, model) {
  return videoValido(semVideoErrado(model?.video_url, prod, model)) || videoValido(semVideoErrado(prod?.video_url, prod, model)) || videoValido(PRODUCT_VIDEOS[String(model?.name || "")]) || videoValido(PRODUCT_VIDEOS[String(prod?.name || "")]);
}

// src/lib/consultorIndicar.ts
var PAPEIS_QUE_INDICAM = ["external_seller", "admin", "manager", "internal_seller", "vendedor_padrao", "triagem"];
var TOKEN_LINK_VALIDO = /^[A-Za-z0-9_-]{24,64}$/;
function primeiroNome(nome) {
  return String(nome || "").replace("Jefferson", "Jeferson").trim().split(/\s+/)[0] || "";
}
var DDDS = /* @__PURE__ */ new Set([
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  21,
  22,
  24,
  27,
  28,
  31,
  32,
  33,
  34,
  35,
  37,
  38,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  51,
  53,
  54,
  55,
  61,
  62,
  63,
  64,
  65,
  66,
  67,
  68,
  69,
  71,
  73,
  74,
  75,
  77,
  79,
  81,
  82,
  83,
  84,
  85,
  86,
  87,
  88,
  89,
  91,
  92,
  93,
  94,
  95,
  96,
  97,
  98,
  99
]);
function validarTelefoneBR(texto2) {
  let d = String(texto2 || "").replace(/\D/g, "");
  d = d.replace(/^0+/, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return { ok: false };
  if (!DDDS.has(Number(d.slice(0, 2)))) return { ok: false };
  if (d.length === 11 && d[2] !== "9") return { ok: false };
  if (d.length === 10 && !/[2-8]/.test(d[2])) return { ok: false };
  if (/^(\d)\1+$/.test(d.slice(2))) return { ok: false };
  const formatado = d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return { ok: true, digitos: d, formatado };
}
var UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
var NOMES_UF = {
  "acre": "AC",
  "alagoas": "AL",
  "amapa": "AP",
  "amazonas": "AM",
  "bahia": "BA",
  "ceara": "CE",
  "distrito federal": "DF",
  "espirito santo": "ES",
  "goias": "GO",
  "maranhao": "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  "para": "PA",
  "paraiba": "PB",
  "parana": "PR",
  "pernambuco": "PE",
  "piaui": "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  "rondonia": "RO",
  "roraima": "RR",
  "santa catarina": "SC",
  "sao paulo": "SP",
  "sergipe": "SE",
  "tocantins": "TO"
};
var semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");
function lerCidadeUf(texto2) {
  const t = String(texto2 || "").trim().replace(/\s+/g, " ").replace(/[.]+$/, "");
  if (!t) return null;
  const limpaCidade = (c) => c.replace(/[\s,/-]+$/, "").trim();
  const base = semAcento(t).toLowerCase();
  const nomes = Object.keys(NOMES_UF).sort((a, b) => b.length - a.length);
  for (const n of nomes) {
    if (base.endsWith(n) && base.length > n.length) {
      const cidade2 = limpaCidade(t.slice(0, t.length - n.length));
      if (cidade2.length >= 2 && /[\s,/-]$/.test(t.slice(0, t.length - n.length))) return { cidade: cidade2, uf: NOMES_UF[n] };
    }
  }
  const m = t.match(/^(.*?)[\s,/-]+([A-Za-z]{2})$/);
  if (!m) return null;
  const uf = m[2].toUpperCase();
  const cidade = limpaCidade(m[1]);
  if (!UFS.includes(uf) || cidade.length < 2) return null;
  return { cidade, uf };
}
function validarCnpj(texto2) {
  const d = String(texto2 || "").replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return { ok: false };
  const calc = (base, pesos) => {
    const s = base.split("").reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d22 = calc(d.slice(0, 12) + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(d[12]) || d22 !== Number(d[13])) return { ok: false };
  return { ok: true, digitos: d, formatado: `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` };
}

// server/consultorParceiro.ts
var BUCKETS_VIDEO = ["gen-lang-client-0708423613.firebasestorage.app", "gen-lang-client-0708423613.appspot.com"];
var PASTAS_VIDEO = ["product_videos/", "model_videos/", "consultor_videos/"];
var MAX_VIDEO_PROXY = 40 * 1024 * 1024;
function alvoDoVideo(url) {
  const u = String(url || "").trim();
  if (!u || u.length > 2e3) return null;
  const banco = u.match(/^db-file:\/\/([A-Za-z0-9_-]{1,128})$/);
  if (banco) return { tipo: "banco", id: banco[1] };
  let x;
  try {
    x = new URL(u);
  } catch {
    return null;
  }
  if (x.protocol !== "https:" || x.username || x.password || x.port) return null;
  let bucket = "";
  let caminho = "";
  try {
    if (x.hostname === "firebasestorage.googleapis.com") {
      const m = x.pathname.match(/^\/v0\/b\/([^/]+)\/o\/([^/]+)$/);
      if (!m) return null;
      bucket = decodeURIComponent(m[1]);
      caminho = decodeURIComponent(m[2]);
    } else if (x.hostname === "storage.googleapis.com") {
      const m = x.pathname.match(/^\/([^/]+)\/(.+)$/);
      if (!m) return null;
      bucket = decodeURIComponent(m[1]);
      caminho = decodeURIComponent(m[2]);
    } else return null;
  } catch {
    return null;
  }
  if (!BUCKETS_VIDEO.includes(bucket) || !caminho || caminho.length > 500 || /[\u0000-\u001f]/.test(caminho)) return null;
  if (!PASTAS_VIDEO.some((p) => caminho.startsWith(p)) || caminho.split("/").some((t) => !t || t === "." || t === "..")) return null;
  return { tipo: "storage", bucket, caminho };
}
var GESTAO_LINK = ["admin", "manager"];
var PAPEL_DO_LINK = "external_seller";
var EQUIPE = ["admin", "manager", "triagem", "internal_seller", "financial", "finance", "fiscal", "marketing", "assistant"];
var LIMITE_DIA = 20;
var LIMITE_IP_HORA = 200;
var LIMITE_LINK_HORA = 30;
var LIMITE_INDICACAO_HORA = 30;
var LIMITE_VIDEO_HORA = 20;
var novoToken = () => import_crypto.default.randomBytes(24).toString("base64url");
var limpaTexto = (t, max) => String(t ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
var escHtml = (t) => String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function criarRotasConsultorParceiro(deps) {
  const { db: db2, quemChama, passouLimite, ipDe } = deps;
  const agora = () => deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  async function linksAtivosDe(uid) {
    const snap = await db2.collection("consultor_links").where("uid", "==", uid).get();
    return snap.docs.filter((d) => d.data()?.ativo === true).sort((a, b) => String(b.data()?.criado_em || "").localeCompare(String(a.data()?.criado_em || "")));
  }
  async function linkDoUsuario(uid, regenerar, criadoPor) {
    const userRef = db2.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return { erro: 404, msg: "Usu\xE1rio n\xE3o encontrado." };
    const u = userSnap.data() || {};
    if (u.role !== PAPEL_DO_LINK) return { erro: 400, msg: "O link do consultor \xE9 s\xF3 para parceiro externo (indicador)." };
    const iso = agora().toISOString();
    const lote = db2.batch();
    const limpaUsuario = "consultor_link_token" in u && deps.campoApagado ? { consultor_link_token: deps.campoApagado() } : {};
    const ativos = await linksAtivosDe(uid);
    const atual = ativos.find((d) => TOKEN_LINK_VALIDO.test(String(d.id)));
    if (!regenerar && atual) {
      if (Object.keys(limpaUsuario).length) {
        lote.set(userRef, limpaUsuario, { merge: true });
        await lote.commit();
      }
      return { token: String(atual.id), nome: u.name || "" };
    }
    const token = novoToken();
    for (const d of ativos) lote.set(db2.collection("consultor_links").doc(d.id), { ativo: false, desativado_em: iso }, { merge: true });
    lote.set(db2.collection("consultor_links").doc(token), { uid, nome: u.name || "", criado_em: iso, criado_por: criadoPor, ativo: true });
    lote.set(userRef, { ...limpaUsuario, consultor_link_em: iso }, { merge: true });
    await lote.commit();
    return { token, nome: u.name || "" };
  }
  async function donoDoToken(token) {
    if (!TOKEN_LINK_VALIDO.test(token)) return null;
    const l = await db2.collection("consultor_links").doc(token).get();
    if (!l.exists) return null;
    const ld = l.data() || {};
    if (ld.ativo !== true || !ld.uid) return null;
    const u = await db2.collection("users").doc(String(ld.uid)).get();
    if (!u.exists) return null;
    const ud = u.data() || {};
    if (ud.status !== "active" || ud.role !== PAPEL_DO_LINK) return null;
    return { uid: String(ld.uid), nome: String(ud.name || ""), email: String(ud.email || "").toLowerCase(), role: PAPEL_DO_LINK };
  }
  async function donoDoPedido(req) {
    const q = await quemChama(req);
    if (q) {
      const u = await db2.collection("users").doc(q.uid).get();
      const ud = u.exists ? u.data() : null;
      const role = q.role || String(ud?.role || "");
      if (!ud || ud.status !== "active" || !PAPEIS_QUE_INDICAM.includes(role)) return { erro: 403, msg: "Seu cadastro n\xE3o pode fazer indica\xE7\xF5es por aqui." };
      return { uid: q.uid, nome: String(ud.name || q.email || ""), email: String(ud.email || q.email || "").toLowerCase(), role, via: "login" };
    }
    const dono = await donoDoToken(String(req.body?.p || req.query?.p || ""));
    if (!dono) return { erro: 401, msg: "Seu link n\xE3o vale mais. Pe\xE7a um novo ao comercial da Roder." };
    return { ...dono, via: "link" };
  }
  async function rotaLink(req, res) {
    try {
      const q = await quemChama(req);
      if (!q || !GESTAO_LINK.includes(q.role)) return res.status(403).json({ error: "S\xF3 a gest\xE3o comercial gera o link do parceiro." });
      const uid = String(req.params?.uid || "");
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) return res.status(400).json({ error: "Usu\xE1rio inv\xE1lido." });
      if (passouLimite(`conslink:${q.uid}`, 60, 60 * 60 * 1e3)) return res.status(429).json({ error: "Muitos pedidos. Espere alguns minutos." });
      const r = await linkDoUsuario(uid, req.body?.novo === true, q.uid);
      if ("erro" in r) return res.status(r.erro).json({ error: r.msg });
      res.json({ ok: true, token: r.token, caminho: `/consultor?p=${r.token}`, nome: r.nome, primeiroNome: primeiroNome(r.nome) });
    } catch {
      res.status(500).json({ error: "N\xE3o consegui gerar o link." });
    }
  }
  async function rotaResolver(req, res) {
    try {
      if (passouLimite(`consparc-ip:${ipDe(req)}`, 40, 15 * 60 * 1e3)) return res.status(429).json({ error: "Muitas tentativas. Espere alguns minutos." });
      const dono = await donoDoToken(String(req.params?.token || ""));
      if (!dono) return res.status(404).json({ error: "Link n\xE3o encontrado." });
      res.setHeader?.("Cache-Control", "no-store");
      res.json({ ok: true, nome: dono.nome, primeiroNome: primeiroNome(dono.nome) });
    } catch {
      res.status(500).json({ error: "Erro ao abrir o link." });
    }
  }
  async function rotaLinkCliente(req, res) {
    try {
      if (passouLimite(`conslc-ip:${ipDe(req)}`, LIMITE_IP_HORA, 60 * 60 * 1e3)) return res.status(429).json({ error: "Muitos pedidos. Espere alguns minutos." });
      const dono = await donoDoPedido(req);
      if ("erro" in dono) return res.status(dono.erro).json({ error: dono.msg });
      if (passouLimite(`conslc:${dono.uid}`, LIMITE_LINK_HORA, 60 * 60 * 1e3)) return res.status(429).json({ error: "Muitos links seguidos. Espere alguns minutos." });
      const pid = String(req.body?.pid || "").slice(0, 80);
      const mid = String(req.body?.mid || "").slice(0, 80);
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(pid) || mid && !/^[A-Za-z0-9_.-]{1,80}$/.test(mid)) return res.status(400).json({ error: "Equipamento inv\xE1lido." });
      const p = await db2.collection("products").doc(pid).get();
      if (!p.exists) return res.status(404).json({ error: "Equipamento n\xE3o encontrado." });
      const donoLink = dono.via === "login" ? await donoDoLinkCurto({ uid: dono.uid, role: dono.role }, req.body?.uid, async (u) => {
        const d = (await db2.collection("users").doc(u).get()).data();
        return !!d && d.status === "active";
      }) : dono.uid;
      const codigo = await deps.criarLinkCurto(donoLink, pid, mid);
      if (!codigo) return res.status(500).json({ error: "N\xE3o consegui gerar o link." });
      res.json({ ok: true, codigo });
    } catch {
      res.status(500).json({ error: "N\xE3o consegui gerar o link." });
    }
  }
  async function regionalDoEstado(uf) {
    try {
      const snap = await db2.collection("users").where("role", "==", "vendedor_padrao").where("status", "==", "active").get();
      const achado = snap.docs.map((d) => ({ uid: d.id, ...d.data() || {} })).find((u) => Array.isArray(u.assigned_regions) && u.assigned_regions.includes(uf));
      return achado || null;
    } catch {
      return null;
    }
  }
  async function equipamentoDe(body) {
    const pid = String(body?.equipamento?.pid || "").slice(0, 80);
    const mid = String(body?.equipamento?.mid || "").slice(0, 80);
    const escrito = limpaTexto(body?.equipamento?.nome, 120);
    if (pid && /^[A-Za-z0-9_-]{1,80}$/.test(pid)) {
      const p = await db2.collection("products").doc(pid).get();
      if (p.exists) {
        const pd = p.data() || {};
        const m = mid ? (pd.models || []).find((x) => String(x?.id) === mid) : null;
        const nome = m ? `${pd.name} - ${m.name}` : String(pd.name || escrito);
        return { nome: limpaTexto(nome, 160), pid, mid: m ? mid : "" };
      }
    }
    if (escrito.length < 2) return null;
    return { nome: escrito, pid: "", mid: "" };
  }
  async function avisarGestao(titulo, mensagem) {
    const snap = await db2.collection("users").where("role", "in", ["admin", "manager", "triagem"]).get();
    const lote = db2.batch();
    const iso = agora().toISOString();
    snap.docs.forEach((d) => lote.set(db2.collection("notifications").doc(), {
      user_uid: d.id,
      title: titulo,
      message: mensagem,
      link: "/indicacoes",
      type: "info",
      read: false,
      created_at: iso
    }));
    await lote.commit();
  }
  async function enviarEmails(dados2, dono) {
    if (!deps.enviarEmail) return;
    const obrigatorios = ["gislene@roderbrasil.com.br", "contato@roderbrasil.com.br", "roderbrasil@gmail.com", "luana@roderbrasil.com.br"];
    let config2 = {};
    try {
      const s = await db2.collection("settings").doc("notifications").get();
      config2 = s.exists ? s.data() || {} : {};
    } catch {
    }
    const lista = String(Array.isArray(config2.manager_emails) ? config2.manager_emails.join(",") : config2.manager_emails || "").split(",").map((e) => e.trim()).filter(Boolean);
    for (const e of obrigatorios) if (!lista.map((x) => x.toLowerCase()).includes(e)) lista.push(e);
    const corte = dados2.client_location.lastIndexOf(" - ");
    const cidade = corte >= 0 ? dados2.client_location.slice(0, corte) : dados2.client_location;
    const uf = corte >= 0 ? dados2.client_location.slice(corte + 3) : "";
    const produto = dados2.items?.[0]?.product_name || "Equipamento";
    const assunto = `\u{1F525} NOVO LEAD CADASTRADO: ${dados2.client_name} (via ${dono.nome})`;
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f97316; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; text-transform: uppercase;">Nova Indica\xE7\xE3o Recebida</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Um novo neg\xF3cio foi registrado pela conversa do Consultor Roder por <strong>${escHtml(dono.nome)}</strong></p>
        </div>
        <div style="padding: 24px;">
          <div style="background-color: #fdf2f7; border-left: 4px solid #f97316; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold; color: #7c2d12; font-size: 16px;">CLIENTE: ${escHtml(dados2.client_name)}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; width: 140px;">Origem / Indicador:</td><td style="padding: 8px 0; font-weight: bold; color: #f97316;">${escHtml(dono.nome)}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Canal:</td><td style="padding: 8px 0; font-weight: bold;">Conversa do Consultor Roder</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">WhatsApp Cliente:</td><td style="padding: 8px 0; font-weight: bold;">${escHtml(dados2.client_phone)}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Cidade/UF:</td><td style="padding: 8px 0;">${escHtml(cidade)}/${escHtml(uf)}</td></tr>
            ${dados2.client_cnpj ? `<tr><td style="padding: 8px 0; color: #666;">CNPJ:</td><td style="padding: 8px 0;">${escHtml(dados2.client_cnpj)}</td></tr>` : ""}
            <tr><td style="padding: 8px 0; color: #666;">Equipamento:</td><td style="padding: 8px 0; color: #f97316; font-weight: bold;">${escHtml(produto)}</td></tr>
          </table>
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://roderindica.roderbrasil.com.br/triagem" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">ACESSAR TRIAGEM NO SISTEMA</a>
          </div>
        </div>
      </div>`;
    const envios = lista.map((e) => deps.enviarEmail(e, assunto, html));
    if (dono.email && dono.email.includes("@") && !dono.email.endsWith("@mobile.roder.com.br") && config2.confirmation_partner !== false) {
      const htmlParceiro = `
        <div style="font-family: sans-serif; color: #333;">
          <h2 style="color: #eab308;">Ol\xE1 ${escHtml(dono.nome)},</h2>
          <p>Recebemos com sucesso a sua indica\xE7\xE3o para <strong>${escHtml(dados2.client_name)}</strong>.</p>
          <p>Nossa equipe comercial j\xE1 foi notificada. Em breve, um de nossos vendedores entrar\xE1 em contato para dar continuidade ao atendimento.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eab308;">
            <p style="margin: 0;"><strong>Equipamento:</strong> ${escHtml(produto)}</p>
            <p style="margin: 5px 0 0 0;"><strong>Status Inicial:</strong> Em Triagem</p>
          </div>
          <p>Voc\xEA pode acompanhar o andamento no seu painel no sistema <strong>Roder Indica</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Atenciosamente,<br>Equipe Roder M\xE1quinas</p>
        </div>`;
      envios.push(deps.enviarEmail(dono.email, `Confirma\xE7\xE3o de Recebimento: Sua indica\xE7\xE3o de ${dados2.client_name}`, htmlParceiro));
    }
    await Promise.allSettled(envios);
  }
  async function rotaIndicacao(req, res) {
    try {
      if (passouLimite(`consind-ip:${ipDe(req)}`, LIMITE_IP_HORA, 60 * 60 * 1e3)) return res.status(429).json({ error: "Muitas indica\xE7\xF5es seguidas. Espere um pouco." });
      const dono = await donoDoPedido(req);
      if ("erro" in dono) return res.status(dono.erro).json({ error: dono.msg });
      if (passouLimite(`consind-h:${dono.uid}`, LIMITE_INDICACAO_HORA, 60 * 60 * 1e3)) return res.status(429).json({ error: "Muitas indica\xE7\xF5es seguidas. Espere um pouco." });
      const b = req.body || {};
      const cliente2 = limpaTexto(b.cliente, 120);
      if (cliente2.length < 2) return res.status(400).json({ error: "Informe o nome do cliente ou da fazenda." });
      const tel = validarTelefoneBR(String(b.telefone || ""));
      if (!tel.ok) return res.status(400).json({ error: "Telefone inv\xE1lido. Use DDD e n\xFAmero." });
      const local = lerCidadeUf(String(b.cidade || ""));
      if (!local) return res.status(400).json({ error: "Informe a cidade e o estado (UF)." });
      let cnpj = "";
      if (String(b.cnpj || "").trim()) {
        const c = validarCnpj(String(b.cnpj));
        if (!c.ok) return res.status(400).json({ error: "CNPJ inv\xE1lido." });
        cnpj = c.formatado;
      }
      const equip = await equipamentoDe(b);
      if (!equip) return res.status(400).json({ error: "Informe o equipamento." });
      const agoraMs = agora().getTime();
      const recentes = await db2.collection("indications").where("external_seller_uid", "==", dono.uid).where("origem", "==", "consultor").get();
      const doDia = recentes.docs.map((d) => ({ id: d.id, ...d.data() || {} })).filter((d) => agoraMs - new Date(d.created_at || 0).getTime() < 24 * 36e5);
      const repetida = doDia.find((d) => d.client_phone === tel.formatado && d.items?.[0]?.product_name === equip.nome && agoraMs - new Date(d.created_at || 0).getTime() < 10 * 6e4);
      if (repetida) return res.json({ ok: true, id: repetida.id, repetida: true });
      if (doDia.length >= LIMITE_DIA || passouLimite(`consind:${dono.uid}`, LIMITE_DIA, 24 * 36e5)) {
        return res.status(429).json({ error: `Limite de ${LIMITE_DIA} indica\xE7\xF5es por dia pela conversa. Use o app para mais.` });
      }
      const ehEquipe = EQUIPE.includes(dono.role);
      const ehInterna = dono.role === "internal_seller" || dono.role === "triagem";
      const regional = await regionalDoEstado(local.uf);
      const iso = agora().toISOString();
      const ref = db2.collection("indications").doc();
      const localizacao = `${local.cidade} - ${local.uf}`;
      const descricao = "Indica\xE7\xE3o feita pela conversa do Consultor Roder." + (!equip.pid ? " Equipamento escrito pelo indicador." : !equip.mid ? " Modelo a definir com a Roder." : "");
      const dados2 = {
        client_name: cliente2,
        client_person_name: cliente2,
        client_phone: tel.formatado,
        client_email: "",
        client_cnpj: cnpj,
        client_location: localizacao,
        base_machine: "",
        machine_details: "",
        machine_porte: "",
        description: descricao,
        is_icms_contributor: false,
        ai_score: "hot",
        id: ref.id,
        items: [{ id: equip.mid ? `model-${equip.mid}` : equip.pid || "custom-item", product_name: equip.nome, quantity: 1 }],
        options: [],
        origin_type: ehEquipe ? "direct" : "partner",
        is_client_referral: false,
        referring_client_name: null,
        referring_client_phone: null,
        referring_client_notes: null,
        external_seller_uid: dono.uid,
        external_seller_name: ehEquipe ? `${dono.nome || "Venda Direta"} (F\xE1brica)` : dono.nome || "Parceiro",
        external_seller_email: dono.email || null,
        internal_seller_uid: ehInterna ? dono.uid : null,
        internal_seller_name: ehInterna ? dono.nome : null,
        internal_seller_email: ehInterna ? dono.email : null,
        created_by_uid: dono.uid,
        created_by_name: dono.nome || null,
        created_by_role: dono.role || null,
        standard_seller_uid: regional?.uid || null,
        standard_seller_name: regional?.name || null,
        standard_seller_commission_rate: regional?.commission_rate || 2,
        standard_seller_commission_enabled: !!regional,
        media_urls: [],
        media_upload_status: "none",
        status: "pending",
        negotiation_history: [{
          id: Math.random().toString(36).substring(2, 11),
          type: "system",
          author_name: dono.nome || "Sistema",
          created_at: iso,
          content: `Indica\xE7\xE3o inicial enviada pela conversa do Consultor Roder${dono.via === "link" ? " (link pessoal do parceiro)" : ""}.

SOLICITA\xC7\xC3O: 1x ${equip.nome}

CLIENTE: ${cliente2} | ${tel.formatado} | ${localizacao}${cnpj ? ` | CNPJ ${cnpj}` : ""}`,
          attachments: []
        }],
        created_at: iso,
        updated_at: iso,
        protection_expires_at: new Date(agoraMs + 60 * 24 * 60 * 60 * 1e3).toISOString(),
        origem: "consultor",
        origem_via: dono.via
      };
      if (equip.pid) dados2.product_id = equip.pid;
      if (equip.mid) dados2.model_id = equip.mid;
      await ref.set(dados2);
      res.json({ ok: true, id: ref.id });
      (async () => {
        await avisarGestao("Nova Indica\xE7\xE3o Recebida", `${dono.nome || "Parceiro"} enviou uma nova indica\xE7\xE3o para ${cliente2} pela conversa do consultor.`).catch(() => {
        });
        await enviarEmails(dados2, dono).catch(() => {
        });
      })();
    } catch {
      if (!res.headersSent) res.status(500).json({ error: "N\xE3o consegui enviar a indica\xE7\xE3o. Tente de novo." });
    }
  }
  async function rotaVideoArquivo(req, res) {
    try {
      if (passouLimite(`consvid-ip:${ipDe(req)}`, LIMITE_IP_HORA, 60 * 60 * 1e3)) return res.status(429).json({ error: "Muitos pedidos. Espere alguns minutos." });
      const url = String(req.query?.url || "").trim();
      const alvo = alvoDoVideo(url);
      if (!alvo) return res.status(400).json({ error: "V\xEDdeo n\xE3o permitido." });
      const pid = String(req.query?.pid || "");
      const mid = String(req.query?.mid || "");
      const vid = String(req.query?.vid || "");
      if (vid && !/^[A-Za-z0-9_-]{1,120}$/.test(vid)) return res.status(400).json({ error: "V\xEDdeo inv\xE1lido." });
      if (!vid && (!/^[A-Za-z0-9_-]{1,80}$/.test(pid) || mid && !/^[A-Za-z0-9_.-]{1,80}$/.test(mid))) return res.status(400).json({ error: "Equipamento inv\xE1lido." });
      const dono = await donoDoPedido(req);
      if ("erro" in dono) return res.status(dono.erro).json({ error: dono.msg });
      if (passouLimite(`consvid:${dono.uid}`, LIMITE_VIDEO_HORA, 60 * 60 * 1e3)) return res.status(429).json({ error: "Muitos v\xEDdeos seguidos. Espere alguns minutos." });
      if (vid) {
        const v = await db2.collection("consultor_videos").doc(vid).get();
        const vd = v.exists ? v.data() || {} : null;
        if (!vd || vd.ativo === false) return res.status(404).json({ error: "V\xEDdeo n\xE3o encontrado." });
        if (String(vd.video_url || "").trim() !== url) return res.status(403).json({ error: "Este v\xEDdeo n\xE3o \xE9 da biblioteca." });
        const pidVideo = String(vd.produto_id || "");
        if (/^[A-Za-z0-9_-]{1,80}$/.test(pidVideo)) {
          const pv = await db2.collection("products").doc(pidVideo).get();
          if (pv.exists && (pv.data() || {}).is_blocked) return res.status(404).json({ error: "V\xEDdeo n\xE3o encontrado." });
        }
      } else {
        const p = await db2.collection("products").doc(pid).get();
        if (!p.exists) return res.status(404).json({ error: "Equipamento n\xE3o encontrado." });
        const pd = p.data() || {};
        const modelo = mid ? (pd.models || []).find((x) => String(x?.id) === mid) : null;
        if (mid && !modelo) return res.status(404).json({ error: "Equipamento n\xE3o encontrado." });
        if (videoDoEquipamento(pd, modelo) !== url) return res.status(403).json({ error: "Este v\xEDdeo n\xE3o \xE9 do equipamento." });
      }
      res.setHeader?.("Cache-Control", "private, no-store");
      res.setHeader?.("X-Content-Type-Options", "nosniff");
      if (alvo.tipo === "banco") {
        const s = await db2.collection("app_files").doc(alvo.id).get();
        const d = String(s.exists && s.data()?.data || "");
        const m = d.match(/^data:(video\/[A-Za-z0-9.+-]+)(?:;[^,]*)?;base64,(.*)$/s);
        if (!m) return res.status(415).json({ error: "Este arquivo n\xE3o \xE9 um v\xEDdeo." });
        const buf = Buffer.from(m[2], "base64");
        if (buf.length > MAX_VIDEO_PROXY) return res.status(413).json({ error: "V\xEDdeo grande demais." });
        res.setHeader?.("Content-Type", m[1]);
        res.setHeader?.("Content-Length", String(buf.length));
        return res.end(buf);
      }
      if (!deps.abrirArquivoStorage) return res.status(500).json({ error: "N\xE3o consegui baixar o v\xEDdeo." });
      const arq = await deps.abrirArquivoStorage(alvo.bucket, alvo.caminho);
      if (!arq) return res.status(404).json({ error: "V\xEDdeo n\xE3o encontrado." });
      if (!/^video\/[A-Za-z0-9.+-]+$/.test(arq.contentType || "")) {
        arq.stream?.destroy?.();
        return res.status(415).json({ error: "Este arquivo n\xE3o \xE9 um v\xEDdeo." });
      }
      if (!(arq.tamanho > 0) || arq.tamanho > MAX_VIDEO_PROXY) {
        arq.stream?.destroy?.();
        return res.status(413).json({ error: "V\xEDdeo grande demais." });
      }
      await new Promise((resolve) => {
        let comecou = false;
        let fim = false;
        const acabar = () => {
          if (!fim) {
            fim = true;
            resolve();
          }
        };
        const comecar = () => {
          if (comecou) return;
          comecou = true;
          res.setHeader?.("Content-Type", arq.contentType);
          res.setHeader?.("Content-Length", String(arq.tamanho));
          (0, import_stream.pipeline)(portao, res, () => acabar());
        };
        const portao = new import_stream.Transform({
          transform(pedaco, _cod, cb) {
            comecar();
            cb(null, pedaco);
          },
          flush(cb) {
            comecar();
            cb();
          }
        });
        (0, import_stream.pipeline)(arq.stream, portao, (err) => {
          if (err && !comecou) {
            if (!res.headersSent) res.status(500).json({ error: "N\xE3o consegui baixar o v\xEDdeo." });
            acabar();
          }
        });
      });
    } catch {
      if (!res.headersSent) res.status(500).json({ error: "N\xE3o consegui baixar o v\xEDdeo." });
    }
  }
  return { rotaLink, rotaResolver, rotaLinkCliente, rotaIndicacao, rotaVideoArquivo, donoDoToken, linkDoUsuario };
}
function registrarConsultorParceiro(app, deps) {
  const r = criarRotasConsultorParceiro(deps);
  app.post("/api/consultor/links/:uid", r.rotaLink);
  app.get("/api/consultor/parceiro/:token", r.rotaResolver);
  app.post("/api/consultor/link-cliente", r.rotaLinkCliente);
  app.post("/api/consultor/indicacao", r.rotaIndicacao);
  app.get("/api/consultor/video-arquivo", r.rotaVideoArquivo);
  return r;
}

// src/lib/tituloFicha.ts
function singular(palavra) {
  if (palavra.length < 4 || palavra === palavra.toUpperCase()) return palavra;
  if (/ais$/i.test(palavra)) return palavra.replace(/ais$/i, "al");
  if (/ões$/i.test(palavra)) return palavra.replace(/ões$/i, "\xE3o");
  if (/[aeo]s$/i.test(palavra)) return palavra.slice(0, -1);
  return palavra;
}
function tituloFicha(p, m) {
  const pn = (p.name || "").replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  const mn = (m.name || "").trim();
  if (!mn) return pn;
  if (!pn || mn.toLowerCase().includes(pn.toLowerCase()) || pn.toLowerCase().includes(mn.toLowerCase())) return mn.length >= pn.length ? mn : pn;
  let palavras = pn.split(" ");
  const primeira = mn.split(/\s+/)[0].toLowerCase();
  const corte = palavras.findIndex((w) => w.toLowerCase() === primeira);
  if (corte > 0) palavras = palavras.slice(0, corte);
  palavras = palavras.map((w, i) => i < 2 ? singular(w) : w);
  return `${palavras.join(" ")} ${mn}`;
}

// src/lib/videosConsultor.ts
var MAX_TITULO = 80;
var MAX_CONTEXTO = 400;
var MAX_VIDEOS_RESPOSTA = 3;
var MAX_VIDEOS_PROMPT = 60;
var MAX_CONTEXTO_PROMPT = 160;
var texto = (v, max) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
var idDoCatalogo = (pid, mid) => `cat_${pid}_${mid || "p"}`.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 120);
function lerVideoDoBanco(id, d) {
  if (!d || d.ativo === false) return null;
  const url = videoValido(d.video_url);
  const pid = texto(d.produto_id, 80);
  if (!url || !pid) return null;
  const tipo = ["campo", "marketing", "instalacao", "amostra"].includes(d.tipo) ? d.tipo : "campo";
  const thumb = /^https:\/\//i.test(String(d.thumb_url || "")) ? String(d.thumb_url).slice(0, 2e3) : "";
  const dur = Number(d.duracao_s);
  return {
    id: String(id),
    produto_id: pid,
    ...d.modelo_id ? { modelo_id: texto(d.modelo_id, 80) } : {},
    equipamento_nome: texto(d.equipamento_nome, 120),
    ...d.modelo_nome ? { modelo_nome: texto(d.modelo_nome, 80) } : {},
    tipo,
    contexto: texto(d.contexto, MAX_CONTEXTO),
    titulo: texto(d.titulo, MAX_TITULO) || texto(d.equipamento_nome, MAX_TITULO),
    video_url: url,
    ...thumb ? { thumb_url: thumb } : {},
    ...dur > 0 && dur < 36e3 ? { duracao_s: Math.round(dur) } : {},
    no_carrossel: d.no_carrossel === true,
    ordem: Number.isFinite(Number(d.ordem)) ? Number(d.ordem) : 0
  };
}
function videosDoCatalogo(produtos, jaNaBiblioteca = /* @__PURE__ */ new Set()) {
  const saida = [];
  const vistos = /* @__PURE__ */ new Set();
  const ids = /* @__PURE__ */ new Set();
  for (const p of produtos || []) {
    if (!p || p.is_blocked || !p.id) continue;
    const add = (m) => {
      const v = videoDoEquipamento(p, m);
      if (!v || jaNaBiblioteca.has(v) || vistos.has(`${p.id}|${v}`)) return;
      let id = idDoCatalogo(String(p.id), m?.id ? String(m.id) : void 0);
      for (let n = 2; ids.has(id); n++) id = `${idDoCatalogo(String(p.id), m?.id ? String(m.id) : void 0).slice(0, 114)}_${n}`;
      vistos.add(`${p.id}|${v}`);
      ids.add(id);
      const nome = m ? tituloFicha(p, m) : String(p.name || "");
      saida.push({
        id,
        produto_id: String(p.id),
        ...m?.id ? { modelo_id: String(m.id), modelo_nome: texto(m.name, 80) } : {},
        equipamento_nome: texto(p.name, 120),
        tipo: "catalogo",
        contexto: "V\xEDdeo do cat\xE1logo",
        titulo: texto(nome, MAX_TITULO),
        video_url: v,
        no_carrossel: false,
        ordem: 9999
      });
    };
    add(null);
    for (const m of p.models || []) if (m) add(m);
  }
  return saida;
}
function montarListaVideos(docs, produtos) {
  const bloqueados = new Set((produtos || []).filter((p) => p?.is_blocked).map((p) => String(p.id)));
  const biblioteca = (docs || []).map((d) => lerVideoDoBanco(d.id, d.data)).filter((v) => !!v && !bloqueados.has(v.produto_id)).sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.titulo.localeCompare(b.titulo));
  const urls = new Set(biblioteca.map((v) => v.video_url));
  return [...biblioteca, ...videosDoCatalogo(produtos, urls)];
}
function nomeDoVideo(v) {
  return tituloFicha({ name: v.equipamento_nome || "" }, { name: v.modelo_nome || "" });
}
var colado = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function pontosNaConversa(v, conversa) {
  const c = colado(conversa);
  if (!c) return 0;
  let pts = 0;
  const modelo = colado(v.modelo_nome || "");
  if (modelo.length >= 3 && c.includes(modelo)) pts += 3;
  const radicais = String(v.equipamento_nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 5).map((w) => w.slice(0, 5));
  if (radicais.some((r) => c.includes(r))) pts += 1;
  return pts;
}
function videosParaPrompt(lista, max = MAX_VIDEOS_PROMPT, conversa = "") {
  const ordenada = (lista || []).filter((v) => v.tipo !== "amostra").map((v, i) => ({ v, i, pts: pontosNaConversa(v, conversa) })).sort((a, b) => b.pts - a.pts || a.i - b.i).map((x) => x.v);
  return ordenada.slice(0, max).map((v) => {
    const ctx = v.contexto && v.tipo !== "catalogo" ? texto(v.contexto, MAX_CONTEXTO_PROMPT) : "";
    return `- ${v.id} | ${nomeDoVideo(v)} | ${v.titulo}${ctx ? ` | ${ctx}` : ""}`;
  }).join("\n");
}
function lerIdsVideos(bruto, validos) {
  if (!Array.isArray(bruto)) return [];
  const saida = [];
  for (const x of bruto) {
    const id = typeof x === "string" ? x.trim() : "";
    if (!id || id.length > 120 || !/^[A-Za-z0-9_-]+$/.test(id)) continue;
    if (validos && !validos.has(id)) continue;
    if (!saida.includes(id)) saida.push(id);
    if (saida.length >= MAX_VIDEOS_RESPOSTA) break;
  }
  return saida;
}

// server/videosConsultor.ts
var VALIDADE_CACHE_MS = 60 * 1e3;
var LIMITE_LISTA_IP_MIN = 60;
function criarBibliotecaVideos(deps) {
  const agora = () => deps.agora ? deps.agora() : Date.now();
  let cache = null;
  let emCurso = null;
  async function carregar() {
    const [vids, prods] = await Promise.all([
      deps.db.collection("consultor_videos").get(),
      deps.db.collection("products").get()
    ]);
    const docs = (vids.docs || []).map((d) => ({ id: d.id, data: d.data() }));
    const produtos = (prods.docs || []).map((d) => ({ id: d.id, ...d.data() || {} }));
    return montarListaVideos(docs, produtos);
  }
  async function listar() {
    if (cache && cache.ate > agora()) return cache.lista;
    if (!emCurso) {
      emCurso = carregar().then((lista) => {
        cache = { ate: agora() + VALIDADE_CACHE_MS, lista };
        return lista;
      }).finally(() => {
        emCurso = null;
      });
    }
    try {
      return await emCurso;
    } catch {
      return cache?.lista || [];
    }
  }
  const limpar = () => {
    cache = null;
  };
  const rotaListarCom = (op = {}) => async function rotaListar(req, res) {
    const deps2 = op;
    try {
      if (deps2.passouLimite && deps2.ipDe && deps2.passouLimite(`videos-ip:${deps2.ipDe(req)}`, LIMITE_LISTA_IP_MIN, 60 * 1e3)) {
        return res.status(429).json({ error: "Muitos pedidos seguidos. Espere um minuto." });
      }
      let fresco = false;
      if (String(req.query?.fresco || "") === "1" && deps2.ehEquipeDoPedido) {
        try {
          fresco = await deps2.ehEquipeDoPedido(req);
        } catch {
          fresco = false;
        }
        if (fresco) limpar();
      }
      const videos = await listar();
      res.setHeader?.("Cache-Control", fresco ? "private, no-store" : "public, max-age=60");
      res.json({ videos });
    } catch {
      res.status(500).json({ error: "N\xE3o consegui carregar os v\xEDdeos." });
    }
  };
  return { listar, limpar, rotaListarCom, rotaListar: rotaListarCom() };
}
function instrucaoVideos(listaCompleta, conversa = "") {
  const lista = listaCompleta.filter((v) => v.tipo !== "amostra");
  if (!lista.length) return "";
  return `

V\xCDDEOS DISPON\xCDVEIS (id | equipamento | t\xEDtulo | contexto):
${videosParaPrompt(lista, MAX_VIDEOS_PROMPT, conversa)}
- Quando a pessoa pedir v\xEDdeo, ou quando um v\xEDdeo claramente ajudar (ex.: pergunta como o equipamento trabalha numa opera\xE7\xE3o, material ou m\xE1quina espec\xEDfica), acrescente no JSON do <painel> o campo "videos": ["<id>", ...] com no m\xE1ximo ${MAX_VIDEOS_RESPOSTA} ids DESTA lista, os mais pr\xF3ximos da pergunta (mesmo equipamento e modelo; o contexto diz a opera\xE7\xE3o). Prefira os que t\xEAm contexto parecido com o da pergunta.
- Ao mandar v\xEDdeo, cite os v\xEDdeos uma vez s\xF3 no texto, numa frase curta (sem repetir a mesma frase em toda resposta). Os cart\xF5es com o v\xEDdeo aparecem sozinhos embaixo da resposta; n\xE3o escreva link nem id do v\xEDdeo no texto.
- Mande o v\xEDdeo de um equipamento UMA vez por conversa. Se j\xE1 mandou antes (veja o hist\xF3rico), n\xE3o ponha "videos" de novo nas respostas seguintes sobre o mesmo equipamento (ficha, hidr\xE1ulico, d\xFAvidas). S\xF3 repita se a pessoa pedir o v\xEDdeo de novo.
- Nunca invente id. Sem v\xEDdeo do equipamento na lista, n\xE3o ponha o campo e n\xE3o prometa v\xEDdeo.`;
}
function sanitizarPainel(json, idsValidos) {
  try {
    const obj = JSON.parse(String(json || "").trim());
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return "";
    if ("videos" in obj) {
      const ids = lerIdsVideos(obj.videos, idsValidos || /* @__PURE__ */ new Set());
      if (ids.length) obj.videos = ids;
      else delete obj.videos;
    }
    return Object.keys(obj).length ? JSON.stringify(obj) : "";
  } catch {
    return "";
  }
}

// server/arquivosVideosConsultor.ts
var import_node_crypto = __toESM(require("node:crypto"), 1);
var PAPEIS_VIDEOS = ["admin", "manager", "marketing"];
var PASTA_VIDEOS = "consultor_videos";
var MAX_VIDEO_MB = 80;
var MAX_CAPA_MB = 2;
var VALIDADE_UPLOAD_MS = 15 * 60 * 1e3;
var LIMITE_UPLOADS_HORA = 60;
var TIPOS = {
  "video/mp4": { ext: "mp4", maxMb: MAX_VIDEO_MB },
  "video/webm": { ext: "webm", maxMb: MAX_VIDEO_MB },
  "video/quicktime": { ext: "mov", maxMb: MAX_VIDEO_MB },
  "image/jpeg": { ext: "jpg", maxMb: MAX_CAPA_MB },
  "image/png": { ext: "png", maxMb: MAX_CAPA_MB },
  "image/webp": { ext: "webp", maxMb: MAX_CAPA_MB }
};
var tipoPermitido = (ct) => TIPOS[String(ct || "").toLowerCase().split(";")[0].trim()] || null;
var maxBytesDo = (ct) => (tipoPermitido(ct)?.maxMb || 0) * 1024 * 1024;
function nomeSeguro(nome, contentType) {
  const t = tipoPermitido(contentType);
  const base = String(nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\.[A-Za-z0-9]{1,5}$/, "").replace(/[^A-Za-z0-9_-]/g, "_").replace(/_+/g, "_").replace(/^_+/, "").slice(0, 60) || "arquivo";
  return `${base}.${t ? t.ext : "bin"}`;
}
function caminhoDaBiblioteca(c) {
  const s = String(c || "");
  if (!s || s.length > 300 || !s.startsWith(`${PASTA_VIDEOS}/`)) return "";
  const partes = s.split("/");
  if (partes.length < 2 || partes.length > 3) return "";
  if (partes.some((p) => !p || p === "." || p === ".." || !/^[A-Za-z0-9._-]{1,120}$/.test(p))) return "";
  return s;
}
var urlDeDownload = (bucket, caminho, token) => `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(caminho)}?alt=media&token=${encodeURIComponent(token)}`;
function caminhoDoLink(url) {
  const a = alvoDoVideo(String(url || ""));
  return a && a.tipo === "storage" ? caminhoDaBiblioteca(a.caminho) : "";
}
function criarRotasArquivosVideos(deps) {
  const agora = () => deps.agora ? deps.agora() : Date.now();
  const novoId = deps.novoId || (() => import_node_crypto.default.randomBytes(10).toString("hex"));
  const novoToken2 = deps.novoToken || (() => import_node_crypto.default.randomUUID());
  async function podeGravar(req, res) {
    const q = await deps.quemChama(req);
    if (!q) {
      res.status(401).json({ error: "Entre com a sua conta da Roder." });
      return null;
    }
    if (!PAPEIS_VIDEOS.includes(String(q.role))) {
      res.status(403).json({ error: "S\xF3 admin, ger\xEAncia e marketing cadastram v\xEDdeo." });
      return null;
    }
    return q;
  }
  async function rotaUploadUrl(req, res) {
    try {
      const q = await podeGravar(req, res);
      if (!q) return;
      if (deps.passouLimite(`vidup:${q.uid}`, LIMITE_UPLOADS_HORA, 60 * 60 * 1e3)) return res.status(429).json({ error: "Muitos envios seguidos. Espere alguns minutos." });
      const ct = String(req.body?.contentType || "").toLowerCase().trim();
      const t = tipoPermitido(ct);
      if (!t) return res.status(415).json({ error: "S\xF3 v\xEDdeo MP4, WEBM ou MOV, e capa JPG, PNG ou WEBP." });
      const max = t.maxMb * 1024 * 1024;
      const tamanho = Number(req.body?.tamanho || 0);
      if (!(tamanho > 0)) return res.status(400).json({ error: "Arquivo vazio." });
      if (tamanho > max) return res.status(413).json({ error: `Arquivo grande demais. O limite \xE9 ${t.maxMb} MB.` });
      const caminho = `${PASTA_VIDEOS}/${novoId()}/${nomeSeguro(req.body?.nome, ct)}`;
      const origem = String(req.headers?.origin || "");
      if (origem && deps.garantirCors) {
        try {
          await deps.garantirCors(origem);
        } catch (e) {
          console.warn("[videos] CORS do bucket:", e?.message || e);
        }
      }
      const cabecalhos = { "Content-Type": ct, "x-goog-content-length-range": `0,${max}` };
      const [uploadUrl] = await deps.arquivo(caminho).getSignedUrl({
        version: "v4",
        action: "write",
        expires: agora() + VALIDADE_UPLOAD_MS,
        contentType: ct,
        // assinado junto: o PUT sem este cabeçalho, ou com arquivo maior, é recusado pelo próprio Storage
        extensionHeaders: { "x-goog-content-length-range": `0,${max}` }
      });
      res.setHeader?.("Cache-Control", "no-store");
      res.json({ caminho, uploadUrl, cabecalhos, expiraEm: agora() + VALIDADE_UPLOAD_MS });
    } catch (e) {
      console.error("[videos] upload-url:", e?.message || e);
      res.status(500).json({ error: "N\xE3o consegui preparar o envio. Tente de novo." });
    }
  }
  async function rotaConfirmar(req, res) {
    try {
      const q = await podeGravar(req, res);
      if (!q) return;
      const caminho = caminhoDaBiblioteca(req.body?.caminho);
      if (!caminho) return res.status(400).json({ error: "Arquivo inv\xE1lido." });
      const arq = deps.arquivo(caminho);
      let meta;
      try {
        [meta] = await arq.getMetadata();
      } catch {
        return res.status(404).json({ error: "O arquivo n\xE3o chegou. Envie de novo." });
      }
      const ct = String(meta?.contentType || "");
      const tamanho = Number(meta?.size || 0);
      if (!tipoPermitido(ct)) {
        await arq.delete({ ignoreNotFound: true }).catch(() => {
        });
        return res.status(415).json({ error: "Tipo de arquivo n\xE3o aceito." });
      }
      if (!(tamanho > 0) || tamanho > maxBytesDo(ct)) {
        await arq.delete({ ignoreNotFound: true }).catch(() => {
        });
        return res.status(413).json({ error: `Arquivo grande demais. O limite \xE9 ${tipoPermitido(ct).maxMb} MB.` });
      }
      const existente = String(meta?.metadata?.firebaseStorageDownloadTokens || "").split(",")[0].trim();
      const token = existente || novoToken2();
      if (!existente) {
        await arq.setMetadata({ cacheControl: "public, max-age=31536000", metadata: { firebaseStorageDownloadTokens: token, enviado_por: q.uid } });
      }
      res.setHeader?.("Cache-Control", "no-store");
      res.json({ url: urlDeDownload(deps.nomeBucket, caminho, token), caminho, tamanho, contentType: ct });
    } catch (e) {
      console.error("[videos] confirmar:", e?.message || e);
      res.status(500).json({ error: "N\xE3o consegui conferir o arquivo. Tente de novo." });
    }
  }
  async function rotaApagar(req, res) {
    try {
      const q = await podeGravar(req, res);
      if (!q) return;
      const corpo = req.body || {};
      const caminho = corpo.caminho ? caminhoDaBiblioteca(corpo.caminho) : caminhoDoLink(corpo.url);
      if (!caminho) return res.status(400).json({ error: "S\xF3 arquivos da biblioteca de v\xEDdeos." });
      const snap = await deps.db.collection("consultor_videos").get();
      const emUso = (snap.docs || []).some((d) => {
        const x = d.data() || {};
        return caminhoDoLink(x.video_url) === caminho || caminhoDoLink(x.thumb_url) === caminho;
      });
      if (emUso) return res.status(409).json({ error: "Este arquivo ainda est\xE1 num v\xEDdeo cadastrado." });
      await deps.arquivo(caminho).delete({ ignoreNotFound: true });
      res.json({ ok: true });
    } catch (e) {
      console.error("[videos] apagar:", e?.message || e);
      res.status(500).json({ error: "N\xE3o consegui apagar o arquivo." });
    }
  }
  return { rotaUploadUrl, rotaConfirmar, rotaApagar };
}

// server/kitsPdf.ts
var RE_COD = "\\d{4}\\.\\d{4}\\.\\d{4}";
var RE_CABECALHO_KIT = new RegExp(`^(${RE_COD})\\s+(.*)$`);
var RE_ITEM = new RegExp(`^\\d+\\s+\\d+\\s+(${RE_COD})\\s*(.*)$`);
var RE_FIM_ITEM = /^(.*?)\s*(?:^|\s)(UN|PC|MT|PAR|KG|CJ|LT|JG|PCT|CX|M2|M3|M|L|GR|RL)\s+([\d.]*\d,\d{1,6})\s+\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}\/\d{2}\/\d{4})?$/;
var RE_LIXO = /^(Roder M[aá]quinas|Quant\. Item Pai|N[ií]vel\b|Item(\s+UN(\s+Vers[aã]o)?)?$|UN$|Vers[aã]o$|\d{2}\/\d{2}\/\d{4}(\s+\d{2}:\d{2})?$)|--\s*\d+\s+of\s+\d+\s*--|Filtros:|DBCorp PCR|Relat[oó]rio de Estruturas/i;
var limpa = (t) => t.replace(/\s+/g, " ").trim();
var numero = (t) => parseFloat(t.replace(/\./g, "").replace(",", "."));
function parseKitsText(texto2) {
  const kits = [];
  let kit = null;
  let item = null;
  let noTitulo = false;
  const fecha = (qtd, unidade) => {
    if (kit && item) {
      const novo = { code: item.code, description: limpa(item.partes.join(" ")), quantity: Number.isFinite(qtd) && qtd > 0 ? qtd : 1 };
      if (unidade.toUpperCase() !== "UN") novo.unit = unidade.toUpperCase();
      kit.items.push(novo);
    }
    item = null;
  };
  const semUnidadeDoKit = (t) => t.replace(/\s*\bUN\s+\d+$/i, "");
  for (const bruta of String(texto2 || "").split(/\r?\n/)) {
    const linha = limpa(bruta);
    if (!linha) continue;
    if (/^N[ií]vel\b/i.test(linha)) {
      noTitulo = false;
      continue;
    }
    if (RE_LIXO.test(linha)) continue;
    const ehItem = RE_ITEM.exec(linha);
    if (ehItem) {
      if (!kit) continue;
      noTitulo = false;
      item = { code: ehItem[1], partes: [] };
      const resto = ehItem[2];
      const fim = RE_FIM_ITEM.exec(resto);
      if (fim) {
        if (limpa(fim[1])) item.partes.push(fim[1]);
        fecha(numero(fim[3]), fim[2]);
      } else if (resto) item.partes.push(resto);
      continue;
    }
    const ehKit = RE_CABECALHO_KIT.exec(linha);
    if (ehKit && !item) {
      kit = { code: ehKit[1], description: limpa(semUnidadeDoKit(ehKit[2])), items: [] };
      kits.push(kit);
      noTitulo = true;
      continue;
    }
    if (item) {
      const fim = RE_FIM_ITEM.exec(linha);
      if (fim) {
        if (limpa(fim[1])) item.partes.push(fim[1]);
        fecha(numero(fim[3]), fim[2]);
      } else item.partes.push(linha);
    } else if (kit && noTitulo) {
      const t = limpa(semUnidadeDoKit(linha));
      if (t) kit.description = limpa(`${kit.description} ${t}`);
    } else if (kit && kit.items.length) {
      const ultimo = kit.items[kit.items.length - 1];
      ultimo.description = limpa(`${ultimo.description} ${linha}`);
    }
  }
  return kits;
}

// src/lib/conviteConsultor.ts
var LINK_CONSULTOR_EQUIPE = "https://roderbrasil.com.br/consultor-equipe";
var PAPEIS_CONVITE = ["internal_seller", "manager", "admin", "triagem"];
var ROTULO_PAPEL_CONVITE = {
  internal_seller: "Vendedor interno",
  manager: "Ger\xEAncia comercial",
  admin: "Diretoria",
  triagem: "Triagem"
};
var EMAILS_FORA_DO_CONVITE = ["rogerio@roderbrasil.com.br"];
var EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function filtrarDestinatarios(usuarios) {
  const vistos = /* @__PURE__ */ new Set();
  const saida = [];
  for (const u of usuarios) {
    const email = String(u.email || "").trim().toLowerCase();
    const papel = String(u.role || "");
    if (u.status !== "active" || !EMAIL_OK.test(email)) continue;
    if (!PAPEIS_CONVITE.includes(papel)) continue;
    if (EMAILS_FORA_DO_CONVITE.includes(email)) continue;
    if (vistos.has(email)) continue;
    vistos.add(email);
    saida.push({ id: u.id, nome: String(u.name || "").trim() || email, email, papel, rotulo: ROTULO_PAPEL_CONVITE[papel] || papel });
  }
  const ordem = (p) => PAPEIS_CONVITE.indexOf(p);
  return saida.sort((a, b) => ordem(a.papel) - ordem(b.papel) || a.nome.localeCompare(b.nome, "pt-BR"));
}
var esc = (t) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var ASSUNTO_CONVITE = "Consultor T\xE9cnico Roder no seu celular e no computador";
var USOS = [
  "D\xFAvidas t\xE9cnicas e de compatibilidade: qual equipamento serve em qual m\xE1quina.",
  "Ponteiras, suportes e links: o que cada m\xE1quina aceita.",
  "Kits de instala\xE7\xE3o, com a confirma\xE7\xE3o da m\xE1quina antes de indicar o kit.",
  "Equipamentos \xE0 pronta entrega.",
  "Fichas t\xE9cnicas e v\xEDdeos para mandar ao cliente."
];
var PASSOS = [
  ["iPhone (Safari)", 'toque em Compartilhar e depois em "Adicionar \xE0 Tela de In\xEDcio".'],
  ["Android (Chrome)", 'toque no menu dos tr\xEAs pontos e depois em "Instalar app" ou "Adicionar \xE0 tela inicial".'],
  ["Computador (Chrome ou Edge)", 'clique no \xEDcone de instalar, na ponta direita da barra de endere\xE7o, e depois em "Instalar".']
];
function montarConvite(nome) {
  const pn = primeiroNome(nome);
  const saudacao = pn ? `Ol\xE1, ${pn}!` : "Ol\xE1!";
  const abertura = "O Consultor T\xE9cnico Roder est\xE1 liberado para o comercial. Use no dia a dia, direto do celular ou do computador.";
  const entrada2 = "Na primeira vez, entre com o seu e-mail cadastrado na Roder. Depois disso o aparelho fica liberado.";
  const texto2 = [
    saudacao,
    "",
    abertura,
    "",
    `Abrir: ${LINK_CONSULTOR_EQUIPE}`,
    entrada2,
    "",
    "Para que serve:",
    ...USOS.map((u) => `- ${u}`),
    "",
    "Como deixar como aplicativo:",
    ...PASSOS.map(([a, b]) => `- ${a}: ${b}`),
    "",
    "Dica: pergunte do jeito que falaria com um colega, citando a m\xE1quina do cliente. Se faltar dado, ele pergunta antes de responder."
  ].join("\n");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1B1E22;max-width:560px;line-height:1.5;font-size:15px">
<p style="font-size:17px;font-weight:bold;margin:0 0 10px">${esc(saudacao)}</p>
<p style="margin:0 0 14px">${esc(abertura)}</p>
<p style="margin:0 0 6px"><a href="${LINK_CONSULTOR_EQUIPE}" style="display:inline-block;background:#facc15;color:#000;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:8px">Abrir o Consultor</a></p>
<p style="margin:0 0 18px;font-size:13px;color:#555">${esc(entrada2)}</p>
<p style="margin:0 0 6px;font-weight:bold">Para que serve</p>
<ul style="margin:0 0 18px;padding-left:20px">${USOS.map((u) => `<li>${esc(u)}</li>`).join("")}</ul>
<p style="margin:0 0 6px;font-weight:bold">Como deixar como aplicativo</p>
<ul style="margin:0 0 18px;padding-left:20px">${PASSOS.map(([a, b]) => `<li><b>${esc(a)}:</b> ${esc(b)}</li>`).join("")}</ul>
<p style="margin:0;font-size:13px;color:#555">Dica: pergunte do jeito que falaria com um colega, citando a m\xE1quina do cliente. Se faltar dado, ele pergunta antes de responder.</p>
</div>`;
  return { assunto: ASSUNTO_CONVITE, html, texto: texto2 };
}

// server/conviteConsultor.ts
var COLECAO = "convites_consultor";
function registrarConviteConsultor(app, deps) {
  const agora = deps.agora || (() => /* @__PURE__ */ new Date());
  async function candidatos() {
    const snap = await deps.db.collection("users").get();
    const lista = filtrarDestinatarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    const out = [];
    for (const d of lista) {
      let ultimo = null;
      try {
        ultimo = (await deps.db.collection(COLECAO).doc(d.id).get()).data()?.enviado_em || null;
      } catch {
      }
      out.push({ ...d, ultimo_convite: ultimo });
    }
    return out;
  }
  app.get("/api/admin/convite-consultor", async (req, res) => {
    if (!await deps.exigirGestao(req, res)) return;
    try {
      const lista = await candidatos();
      const exemplo = montarConvite("Nome");
      return res.json({ ok: true, destinatarios: lista, assunto: exemplo.assunto, texto: exemplo.texto });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "N\xE3o consegui montar a lista agora." });
    }
  });
  app.post("/api/admin/convite-consultor/enviar", async (req, res) => {
    const q = await deps.exigirGestao(req, res);
    if (!q) return;
    try {
      const pedidos = Array.isArray(req.body?.emails) ? req.body.emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean) : [];
      const reenviar = req.body?.reenviar === true;
      if (pedidos.length === 0 || pedidos.length > 50) return res.status(400).json({ ok: false, error: "Marque quem vai receber." });
      const permitidos = new Map((await candidatos()).map((c) => [c.email, c]));
      const resultados = [];
      for (const email of [...new Set(pedidos)]) {
        const d = permitidos.get(email);
        if (!d) {
          resultados.push({ email, nome: "", status: "fora_da_lista", detalhe: "N\xE3o est\xE1 no comercial interno ativo." });
          continue;
        }
        if (d.ultimo_convite && !reenviar) {
          resultados.push({ email, nome: d.nome, status: "ja_enviado", detalhe: d.ultimo_convite });
          continue;
        }
        try {
          const m = montarConvite(d.nome);
          await deps.enviarEmail(email, m.assunto, m.html, m.texto);
          await deps.db.collection(COLECAO).doc(d.id).set({ email, enviado_em: agora().toISOString(), enviado_por: q.email || "" }, { merge: true });
          resultados.push({ email, nome: d.nome, status: "enviado" });
        } catch (e) {
          resultados.push({ email, nome: d.nome, status: "erro", detalhe: String(e?.message || "N\xE3o saiu.").slice(0, 160) });
        }
      }
      return res.json({ ok: true, resultados });
    } catch {
      return res.status(500).json({ ok: false, error: "Erro ao enviar o convite." });
    }
  });
}

// server/consultorPerfil.ts
var PAPEIS_EQUIPE = ["admin", "manager", "internal_seller", "triagem", "financial", "marketing", "fiscal", "vendedor_padrao"];
function ehEquipeNoConsultor(userInfo) {
  if (!userInfo || typeof userInfo !== "object") return false;
  if (userInfo.equipe === true) return true;
  return PAPEIS_EQUIPE.includes(String(userInfo.role || ""));
}
function instrucaoPerfilConsultor(userInfo, equipe) {
  const u = userInfo && typeof userInfo === "object" ? userInfo : {};
  if (u.role === "client" || u.role === "cliente") {
    return `

18. DIRETRIZ DE ATENDIMENTO AO CLIENTE FINAL (MUITO IMPORTANTE):
- Voc\xEA est\xE1 conversando com um CLIENTE final (comprador de equipamentos) chamado "${u.name || "Cliente"}" que possui a m\xE1quina base "${u.baseMachine || "n\xE3o informada"}".
- Seja extremamente acolhedor, focado em ajud\xE1-lo a entender qual o equipamento Roder ideal para o seu trabalho e para a m\xE1quina base dele.
- Quando ele perguntar sobre qualquer equipamento ou demonstrar interesse em especifica\xE7\xF5es, tire todas as d\xFAvidas dele e, de forma ativa e muito gentil, reforce a import\xE2ncia da nossa equipe de vendas internas da f\xE1brica elaborar a proposta e o or\xE7amento oficial do projeto.
- Exemplo de condu\xE7\xE3o: "Seria excelente podermos fazer uma simula\xE7\xE3o personalizada e te enviar um or\xE7amento oficial sem compromisso direto da f\xE1brica com todas as condi\xE7\xF5es! Se voc\xEA quiser, posso pedir para a nossa equipe de vendas internas da f\xE1brica entrar em contato com voc\xEA no seu WhatsApp. Voc\xEA gostaria que eu fizesse essa solicita\xE7\xE3o agora mesmo?"
- Caso ele confirme, instrua-o a ficar tranquilo pois nossa equipe de vendas internas da f\xE1brica entrar\xE1 em contato em breve com a proposta oficial, ou recomende que ele solicite o or\xE7amento diretamente na f\xE1brica pelo bot\xE3o de or\xE7amento.`;
  }
  if (equipe ?? ehEquipeNoConsultor(u)) {
    return `

18. DIRETRIZ DE ATENDIMENTO \xC0 EQUIPE RODER (MUITO IMPORTANTE):
- Voc\xEA est\xE1 conversando com "${u.name || "Equipe Roder"}", da EQUIPE INTERNA da Roder (vendedor interno, triagem, ger\xEAncia ou t\xE9cnico). A pessoa quer a resposta t\xE9cnica para atender ou or\xE7ar.
- Responda T\xC9CNICO e direto, nesta ordem:
  1. VEREDITO na primeira frase, em negrito: **Serve**, **N\xE3o serve** ou **Verificar**, com o motivo em poucas palavras (porte, fatia extra, transmiss\xE3o, vaz\xE3o).
  2. Kit de instala\xE7\xE3o indicado.
  3. Ponteira/biela e rotator, quando se aplica (link s\xF3 se perguntarem, como nas regras acima).
  4. Suporte ou adapta\xE7\xE3o necess\xE1ria na m\xE1quina (fatia extra, linha bidirecional, engate, etc.).
  5. C\xF3digos Roder dos itens quando constarem no cat\xE1logo ou nos kits. Nunca invente c\xF3digo: sem c\xF3digo cadastrado, n\xE3o escreva c\xF3digo.
- Pule o que n\xE3o se aplica \xE0 pergunta. Sem linguagem de venda: nada de frases de convencimento, de oferecer or\xE7amento, de falar em indica\xE7\xE3o ou comiss\xE3o.
- Se faltar dado essencial (modelo da m\xE1quina, porte, se tem fatia extra), pergunte antes, numa frase.
- Todas as outras regras t\xE9cnicas continuam valendo.`;
  }
  return `

18. DIRETRIZ DE ATENDIMENTO AO PARCEIRO/VENDEDOR (MUITO IMPORTANTE):
- Voc\xEA est\xE1 conversando com um PARCEIRO/VENDEDOR cadastrado da Roder chamado "${u.name || "Vendedor"}".
- Ofere\xE7a suporte de engenharia avan\xE7ado, com foco em ajud\xE1-lo a sanar d\xFAvidas t\xE9cnicas de clientes, dimensionar corretamente os equipamentos para fechar neg\xF3cios, identificar c\xF3digos de produtos, consultar o estoque atual da f\xE1brica de garras/cabe\xE7otes e auxiliar na elabora\xE7\xE3o de propostas que ser\xE3o encaminhadas e finalizadas pela nossa equipe de vendas internas da f\xE1brica no painel administrativo.
- Sinta-se \xE0 vontade para ser mais t\xE9cnico e usar termos de revenda, comiss\xE3o, estoque e especifica\xE7\xF5es de montagem e instala\xE7\xE3o.`;
}

// server/previaImagem.ts
var import_crypto2 = __toESM(require("crypto"), 1);
var import_dns = __toESM(require("dns"), 1);
var import_http = __toESM(require("http"), 1);
var import_https = __toESM(require("https"), 1);
var import_net = __toESM(require("net"), 1);
var OG_LARGURA = 1200;
var OG_ALTURA = 630;
var OG_MAX_BYTES = 290 * 1024;
var MAX_ORIGEM_BYTES = 15 * 1024 * 1024;
var TEMPO_EXTERNA_MS = 4e3;
var VERSAO_ARTE = "a2";
var LIMITE_PIXELS = 4e7;
var TEMPO_ARTE_PROVISORIA_MS = 3 * 60 * 1e3;
var TEMPO_CANDIDATAS_MS = 2 * 60 * 1e3;
var MAX_REDIRECIONAMENTOS = 3;
var PORTAS_PERMITIDAS = [80, 443];
var CODIGO_PADRAO = "PADRAO";
var PASTA_CACHE = "og_cache";
var FAIXA = 70;
var MARGEM = 24;
var FUNDO = "#f1f2f4";
var LARANJA = "#f97316";
var hostPrivado = (h) => /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|.*\.local$|.*\.internal$|.*\.localhost$)/i.test(h);
var BLOQUEADOS_V4 = new import_net.default.BlockList();
var BLOQUEADOS_V6 = new import_net.default.BlockList();
(() => {
  const b = BLOQUEADOS_V4;
  for (const [ip, bits] of [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4]
  ]) b.addSubnet(ip, bits, "ipv4");
  for (const [ip, bits] of [
    ["::", 96],
    ["::ffff:0:0", 96],
    ["64:ff9b::", 96],
    ["100::", 64],
    ["2001:db8::", 32],
    ["fc00::", 7],
    ["fe80::", 10],
    ["fec0::", 10],
    ["ff00::", 8]
  ]) BLOQUEADOS_V6.addSubnet(ip, bits, "ipv6");
})();
function ipBloqueado(ip) {
  const limpo2 = String(ip || "").replace(/^\[|\]$/g, "").split("%")[0];
  const tipo = import_net.default.isIP(limpo2);
  if (tipo === 4) return BLOQUEADOS_V4.check(limpo2, "ipv4");
  if (tipo === 6) return BLOQUEADOS_V6.check(limpo2, "ipv6");
  return true;
}
function fonteDaFoto(u, site, buckets) {
  const s = String(u || "").trim();
  if (!s || s.length > 2e3) return null;
  const banco = s.match(/^db-file:\/\/([A-Za-z0-9_-]{1,128})$/);
  if (banco) return { tipo: "banco", id: banco[1] };
  if (s.startsWith("/") && !s.startsWith("//")) {
    const caminho = s.split(/[?#]/)[0];
    if (caminho.split("/").some((t) => t === "..")) return null;
    const foto = caminho.match(/^\/api\/foto\/([A-Za-z0-9_-]{1,128})$/);
    if (foto) return { tipo: "banco", id: foto[1] };
    return { tipo: "local", caminho };
  }
  let x;
  try {
    x = new URL(s);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(x.protocol) || x.username || x.password || hostPrivado(x.hostname)) return null;
  if (import_net.default.isIP(x.hostname.replace(/^\[|\]$/g, "")) && ipBloqueado(x.hostname)) return null;
  try {
    const nosso = new URL(site);
    if (x.hostname === nosso.hostname || x.hostname === `www.${nosso.hostname}`) {
      const foto = x.pathname.match(/^\/api\/foto\/([A-Za-z0-9_-]{1,128})$/);
      if (foto) return { tipo: "banco", id: decodeURIComponent(foto[1]) };
      if (!x.pathname.split("/").some((t) => t === "..")) return { tipo: "local", caminho: decodeURIComponent(x.pathname) };
    }
    if (x.hostname === "firebasestorage.googleapis.com") {
      const m = x.pathname.match(/^\/v0\/b\/([^/]+)\/o\/([^/]+)$/);
      if (m && buckets.includes(decodeURIComponent(m[1]))) return { tipo: "storage", bucket: decodeURIComponent(m[1]), caminho: decodeURIComponent(m[2]) };
    } else if (x.hostname === "storage.googleapis.com") {
      const m = x.pathname.match(/^\/([^/]+)\/(.+)$/);
      if (m && buckets.includes(decodeURIComponent(m[1]))) return { tipo: "storage", bucket: decodeURIComponent(m[1]), caminho: decodeURIComponent(m[2]) };
    }
  } catch {
    return null;
  }
  return { tipo: "externa", url: x.toString() };
}
function candidatasDoLink(p, m) {
  const lista = [...Array.isArray(m?.images) ? m.images : [], m?.image_url, p?.image_url, ...Array.isArray(p?.images) ? p.images : []].filter((i) => typeof i === "string" && i.trim() && !/run\.app/.test(i)).map((i) => i.trim());
  return [...new Set(lista)].slice(0, 4);
}
function versaoDaPrevia(candidatas) {
  return import_crypto2.default.createHash("sha1").update(`${VERSAO_ARTE}|${candidatas.join("|")}`).digest("hex").slice(0, 10);
}
function urlImagemPrevia(site, codigo, candidatas) {
  const c = candidatas.length ? codigo : CODIGO_PADRAO;
  return `${site.replace(/\/$/, "")}/og/${c}-${versaoDaPrevia(candidatas)}.jpg`;
}
function lerNomeArquivo(nome) {
  const m = String(nome || "").match(/^([A-Za-z0-9]{1,12})(?:-[a-f0-9]{4,16})?\.jpe?g$/);
  return m ? { codigo: m[1].toUpperCase() } : null;
}
var resolverPadrao = (host) => import_dns.default.promises.lookup(host, { all: true, verbatim: true });
async function conferirDestino(url, op = {}) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
  const porta = u.port ? Number(u.port) : u.protocol === "https:" ? 443 : 80;
  if (!(op.portas || PORTAS_PERMITIDAS).includes(porta)) return null;
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (op.hostPermitido && !op.hostPermitido(host.toLowerCase())) return null;
  const permitido = op.ipPermitido || ((ip) => !ipBloqueado(ip));
  if (import_net.default.isIP(host)) return permitido(host) ? { u, ip: host, familia: import_net.default.isIP(host) } : null;
  if (hostPrivado(host)) return null;
  let enderecos;
  try {
    enderecos = await (op.resolver || resolverPadrao)(host);
  } catch {
    return null;
  }
  if (!enderecos.length || enderecos.some((e) => !permitido(e.address))) return null;
  return { u, ip: enderecos[0].address, familia: enderecos[0].family || import_net.default.isIP(enderecos[0].address) };
}
function pedirUmSalto(alvo, sinal) {
  return new Promise((resolve, reject) => {
    const mod = alvo.u.protocol === "https:" ? import_https.default : import_http.default;
    const req = mod.request(alvo.u, {
      method: "GET",
      signal: sinal,
      agent: false,
      // a conexão vai para o IP conferido; o nome continua no Host e no SNI do https
      lookup: ((_h, opcoes, cb) => {
        if (opcoes?.all) cb(null, [{ address: alvo.ip, family: alvo.familia }]);
        else cb(null, alvo.ip, alvo.familia);
      }),
      headers: { "User-Agent": "Mozilla/5.0 (RoderIndica; previa do link)", Accept: "image/jpeg,image/png,image/webp,image/*;q=0.8" }
    }, resolve);
    req.on("error", reject);
    req.end();
  });
}
async function lerStreamComTeto(r, teto) {
  const tamanho = Number(r.headers["content-length"] || 0);
  if (tamanho && tamanho > teto) {
    r.destroy();
    return null;
  }
  const partes = [];
  let total = 0;
  for await (const pedaco of r) {
    total += pedaco.length;
    if (total > teto) {
      r.destroy();
      return null;
    }
    partes.push(pedaco);
  }
  return Buffer.concat(partes);
}
async function baixarExterna(url, tempoMs = TEMPO_EXTERNA_MS, teto = MAX_ORIGEM_BYTES, op = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), op.tempoMs ?? tempoMs);
  const limite = op.teto ?? teto;
  try {
    let atual = url;
    for (let salto = 0; salto <= MAX_REDIRECIONAMENTOS; salto++) {
      const alvo = await conferirDestino(atual, op);
      if (!alvo) return null;
      const r = await pedirUmSalto(alvo, ctl.signal);
      const st = r.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(st)) {
        const destino = r.headers.location;
        r.resume();
        if (!destino) return null;
        try {
          atual = new URL(String(destino), alvo.u).toString();
        } catch {
          return null;
        }
        continue;
      }
      if (st < 200 || st >= 300) {
        r.resume();
        return null;
      }
      const tipo = String(r.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
      if (tipo && !tipo.startsWith("image/") && tipo !== "application/octet-stream") {
        r.destroy();
        return null;
      }
      const bytes = await lerStreamComTeto(r, limite);
      return bytes ? { bytes, tipo } : null;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
var GuardaRecente = class {
  constructor(maxItens = 80, maxBytes = 20 * 1024 * 1024) {
    this.maxItens = maxItens;
    this.maxBytes = maxBytes;
    this.mapa = /* @__PURE__ */ new Map();
    this.total = 0;
  }
  get(k) {
    const v = this.mapa.get(k);
    if (v) {
      this.mapa.delete(k);
      this.mapa.set(k, v);
    }
    return v;
  }
  set(k, v) {
    const antigo = this.mapa.get(k);
    if (antigo) {
      this.total -= antigo.length;
      this.mapa.delete(k);
    }
    this.mapa.set(k, v);
    this.total += v.length;
    while (this.mapa.size > this.maxItens || this.total > this.maxBytes) {
      const [k0, v0] = this.mapa.entries().next().value;
      this.mapa.delete(k0);
      this.total -= v0.length;
    }
  }
  get tamanho() {
    return this.mapa.size;
  }
};
async function montarArte(sharp, foto, logoHorizontal, logoRedonda) {
  const altoFoto = OG_ALTURA - FAIXA;
  const camadas = [];
  const centro = async (buf, maxL, maxA, topoArea) => {
    const { data, info } = await sharp(buf, { failOn: "none", limitInputPixels: LIMITE_PIXELS }).rotate().resize({ width: maxL, height: maxA, fit: "inside" }).flatten({ background: "#ffffff" }).png().toBuffer({ resolveWithObject: true });
    return { input: data, left: Math.round((OG_LARGURA - info.width) / 2), top: Math.round(topoArea + (altoFoto - info.height) / 2) };
  };
  if (foto) camadas.push(await centro(foto, OG_LARGURA - MARGEM * 2, altoFoto - MARGEM * 2, 0));
  else if (logoRedonda) {
    const { data, info } = await sharp(logoRedonda, { limitInputPixels: LIMITE_PIXELS }).resize({ width: 380, height: 380, fit: "inside" }).png().toBuffer({ resolveWithObject: true });
    camadas.push({ input: data, left: Math.round((OG_LARGURA - info.width) / 2), top: Math.round((altoFoto - info.height) / 2) });
  }
  camadas.push({ input: { create: { width: OG_LARGURA, height: FAIXA, channels: 3, background: "#ffffff" } }, left: 0, top: altoFoto });
  camadas.push({ input: { create: { width: OG_LARGURA, height: 5, channels: 3, background: LARANJA } }, left: 0, top: altoFoto });
  if (logoHorizontal && foto) {
    const { data, info } = await sharp(logoHorizontal, { limitInputPixels: LIMITE_PIXELS }).resize({ height: 46, width: 300, fit: "inside" }).png().toBuffer({ resolveWithObject: true });
    camadas.push({ input: data, left: 32, top: altoFoto + 5 + Math.round((FAIXA - 5 - info.height) / 2) });
  }
  const base = await sharp({ create: { width: OG_LARGURA, height: OG_ALTURA, channels: 3, background: FUNDO } }).composite(camadas).png().toBuffer();
  let saida = Buffer.alloc(0);
  for (const q of [82, 74, 66, 58, 50, 42, 34]) {
    saida = await sharp(base).jpeg({ quality: q, mozjpeg: true, chromaSubsampling: "4:2:0" }).toBuffer();
    if (saida.length <= OG_MAX_BYTES) break;
  }
  return saida;
}
function criarImagemPrevia(deps) {
  const memoria = new GuardaRecente();
  const provisorias = /* @__PURE__ */ new Map();
  const listas = /* @__PURE__ */ new Map();
  const emAndamento = /* @__PURE__ */ new Map();
  const baixar = deps.baixar || ((u) => baixarExterna(u));
  const log = deps.log || (() => {
  });
  const agora = deps.agora || (() => Date.now());
  async function bytesDaFonte(f) {
    try {
      if (f.tipo === "banco") {
        const snap = await deps.db.collection("app_files").doc(f.id).get();
        const dados2 = String(snap.exists && snap.data()?.data || "");
        const m = dados2.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/is);
        return m ? Buffer.from(m[1], "base64") : null;
      }
      if (f.tipo === "storage") return await deps.lerStorage(f.bucket, f.caminho);
      if (f.tipo === "local") return deps.lerLocal ? deps.lerLocal(f.caminho) : null;
      const r = await baixar(f.url);
      return r?.bytes || null;
    } catch {
      return null;
    }
  }
  async function lerCandidatas(codigo) {
    if (!codigo || codigo === CODIGO_PADRAO) return [];
    try {
      const link = await deps.db.collection("links_curtos").doc(codigo).get();
      if (!link?.exists) return [];
      const l = link.data();
      const prod = await deps.db.collection("products").doc(String(l.pid || "_")).get();
      if (!prod?.exists) return [];
      const p = prod.data();
      const m = (p.models || []).find((x) => x.id === l.mid) || null;
      return candidatasDoLink(p, m);
    } catch {
      return [];
    }
  }
  function candidatasGuardadas(codigo) {
    const g = listas.get(codigo);
    if (g && g.ate > agora()) return g.candidatas;
    if (g) listas.delete(codigo);
    return null;
  }
  async function candidatasDoCodigo(codigo) {
    const g = candidatasGuardadas(codigo);
    if (g) return g;
    const candidatas = await lerCandidatas(codigo);
    if (listas.size >= 1e3) listas.clear();
    listas.set(codigo, { candidatas, ate: agora() + TEMPO_CANDIDATAS_MS });
    return candidatas;
  }
  async function gerar(chave, candidatas) {
    const sharp = await deps.carregarSharp();
    if (!sharp) return { jpeg: null, provisoria: false };
    let foto = null;
    for (const c of candidatas) {
      const f = fonteDaFoto(c, deps.site, deps.buckets);
      if (!f) continue;
      const bytes = await bytesDaFonte(f);
      if (!bytes) continue;
      try {
        const meta = await sharp(bytes, { failOn: "none", limitInputPixels: LIMITE_PIXELS }).metadata();
        if (meta?.width && meta?.height && meta.width * meta.height <= LIMITE_PIXELS) {
          foto = bytes;
          break;
        }
      } catch {
      }
    }
    const arte = await montarArte(sharp, foto, deps.logoHorizontal?.() || null, deps.logoRedonda?.() || null);
    const provisoria = !foto && candidatas.length > 0;
    if (provisoria) log(`[OG] nenhuma foto abriu para ${chave}; vai a arte padr\xE3o por ${TEMPO_ARTE_PROVISORIA_MS / 6e4} min e tenta de novo depois`);
    return { jpeg: arte, provisoria };
  }
  async function arteDoCodigo(codigoBruto) {
    const codigo = String(codigoBruto || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    const candidatas = await candidatasDoCodigo(codigo);
    const chave = versaoDaPrevia(candidatas);
    const daMemoria = memoria.get(chave);
    if (daMemoria) return { jpeg: daMemoria, chave, provisoria: false };
    const prov = provisorias.get(chave);
    if (prov && prov.ate > agora()) return { jpeg: prov.jpeg, chave, provisoria: true };
    if (prov) provisorias.delete(chave);
    let tarefa = emAndamento.get(chave);
    if (!tarefa) {
      tarefa = (async () => {
        try {
          const guardada = deps.lerCache ? await deps.lerCache(chave).catch(() => null) : null;
          if (guardada && guardada.length) return { jpeg: guardada, provisoria: false };
          const nova = await gerar(chave, candidatas);
          if (nova.jpeg && !nova.provisoria && deps.gravarCache) deps.gravarCache(chave, nova.jpeg).catch((e) => log(`[OG] n\xE3o gravou o cache ${chave}: ${e?.message || e}`));
          return nova;
        } finally {
          emAndamento.delete(chave);
        }
      })();
      emAndamento.set(chave, tarefa);
    }
    const { jpeg, provisoria } = await tarefa;
    if (jpeg && provisoria) {
      if (provisorias.size >= 200) provisorias.clear();
      provisorias.set(chave, { jpeg, ate: agora() + TEMPO_ARTE_PROVISORIA_MS });
    } else if (jpeg) memoria.set(chave, jpeg);
    return { jpeg, chave, provisoria };
  }
  async function rota(req, res) {
    const nome = lerNomeArquivo(String(req.params?.arquivo || ""));
    if (!nome) {
      res.status(404).end();
      return;
    }
    if (deps.limitar && !candidatasGuardadas(nome.codigo) && deps.limitar(req)) {
      res.setHeader("Retry-After", "60");
      res.status(429).end();
      return;
    }
    try {
      const { jpeg, provisoria } = await arteDoCodigo(nome.codigo);
      if (jpeg) {
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Content-Length", String(jpeg.length));
        res.setHeader("Cache-Control", provisoria ? "public, max-age=300" : "public, max-age=86400, s-maxage=604800");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.status(200).end(jpeg);
        return;
      }
    } catch (e) {
      log(`[OG] erro ao montar ${nome.codigo}: ${e?.message || e}`);
    }
    const pronta = deps.artePadraoPronta?.();
    if (pronta) {
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", String(pronta.length));
      res.setHeader("Cache-Control", "public, max-age=600");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.status(200).end(pronta);
      return;
    }
    const logo = deps.logoRedonda?.();
    if (logo) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Length", String(logo.length));
      res.setHeader("Cache-Control", "public, max-age=600");
      res.status(200).end(logo);
      return;
    }
    res.status(404).end();
  }
  function esquentar(codigo) {
    arteDoCodigo(codigo).catch(() => {
    });
  }
  return { rota, arteDoCodigo, esquentar, candidatasDoCodigo, memoria };
}

// server/previaLink.ts
var SITE_PREVIA = (/^https:\/\/[a-z0-9.-]+$/i.test(String(process.env.SITE_PUBLICO || "")) ? String(process.env.SITE_PUBLICO) : "https://roderindica.com").replace(/\/$/, "");
var ehArteOg = (u) => /\/og\/[A-Za-z0-9]{1,12}-[a-f0-9]{4,16}\.jpg$/.test(String(u || ""));
var urlPreviaPadrao = () => urlImagemPrevia(SITE_PREVIA, "", []);
var escHtml2 = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
var codigoLimpo = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
function previaPadrao(codigo) {
  return {
    titulo: "Roder M\xE1quinas e Equipamentos",
    descricao: "Fotos, v\xEDdeo, ficha t\xE9cnica e or\xE7amento.",
    imagem: urlPreviaPadrao(),
    url: `${SITE_PREVIA}/o/${codigoLimpo(codigo)}`
  };
}
function previaDoEquipamento(codigo, p, m, imagem) {
  const nome = String(p?.name || "").trim();
  if (!nome) return previaPadrao(codigo);
  const titulo = `${nome}${m?.name && !nome.includes(String(m.name)) ? ` ${m.name}` : ""} | Roder`;
  const base = String(m?.technical_specs?.maquina_base || "").split("|")[0].replace(/\s*\([^)]*\)\s*$/, "").trim();
  const temVideo = !!videoDoEquipamento(p, m);
  const fim = temVideo ? "Veja o v\xEDdeo trabalhando e pe\xE7a o or\xE7amento." : "Fotos, v\xEDdeo, ficha e or\xE7amento.";
  const descricao = base ? `Para ${/carregadeira|engate/i.test(nome) ? "p\xE1 carregadeira" : "escavadeiras"} de ${base.replace(/\s*ton\.?$/i, " t")}. ${fim}` : temVideo ? fim : previaPadrao(codigo).descricao;
  return { titulo, descricao, imagem: imagem || previaPadrao(codigo).imagem, url: `${SITE_PREVIA}/o/${codigoLimpo(codigo)}`, temVideo };
}
function metaPrevia(d) {
  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Roder M\xE1quinas e Equipamentos" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:title" content="${escHtml2(d.titulo)}" />`,
    `<meta property="og:description" content="${escHtml2(d.descricao)}" />`,
    `<meta property="og:image" content="${escHtml2(d.imagem)}" />`,
    ...d.imagem.startsWith("https://") ? [`<meta property="og:image:secure_url" content="${escHtml2(d.imagem)}" />`] : [],
    // largura, altura e tipo deixam o WhatsApp montar a prévia grande sem baixar a imagem antes
    ...ehArteOg(d.imagem) ? [
      `<meta property="og:image:type" content="image/jpeg" />`,
      `<meta property="og:image:width" content="${OG_LARGURA}" />`,
      `<meta property="og:image:height" content="${OG_ALTURA}" />`
    ] : [],
    `<meta property="og:image:alt" content="${escHtml2(d.titulo)}" />`,
    `<meta property="og:url" content="${escHtml2(d.url)}" />`,
    `<meta name="description" content="${escHtml2(d.descricao)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${escHtml2(d.imagem)}" />`
  ].join("\n    ");
}
function injetarPrevia(html, d) {
  let saida = String(html || "").replace(/\s*<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*"|name="description")[^>]*>/gi, "");
  const bloco = `<title>${escHtml2(d.titulo)}</title>
    ${metaPrevia(d)}`;
  if (/<title>[\s\S]*?<\/title>/i.test(saida)) return saida.replace(/<title>[\s\S]*?<\/title>/i, () => bloco);
  if (/<\/head>/i.test(saida)) return saida.replace(/<\/head>/i, () => `${bloco}
  </head>`);
  return `${bloco}
${saida}`;
}

// server/fotosExternas.ts
var import_crypto3 = __toESM(require("crypto"), 1);
var MAX_URLS_POR_RODADA = 60;
var SIMULTANEAS = 4;
var TRAVA_MS = 10 * 60 * 1e3;
var COLECAO_ESTADO = "manutencao_estado";
var DOC_TRAVA = "fotos_externas";
var MAX_FALHAS_LEMBRADAS = 1e3;
var RodadaEmAndamento = class extends Error {
  constructor() {
    super("J\xE1 tem uma rodada de fotos rodando. Espere alguns minutos e tente de novo.");
  }
};
function referenciasExternas(produtos, site, buckets) {
  const saida = [];
  const olhar = (pid, produto, campo, v) => {
    if (typeof v !== "string" || !v.trim()) return;
    if (fonteDaFoto(v, site, buckets)?.tipo === "externa") saida.push({ pid, produto, campo, url: v.trim() });
  };
  for (const { id, data: p } of produtos) {
    const nome = String(p?.name || id);
    olhar(id, nome, "image_url", p?.image_url);
    (Array.isArray(p?.images) ? p.images : []).forEach((u, j) => olhar(id, nome, `images[${j}]`, u));
    (Array.isArray(p?.models) ? p.models : []).forEach((m, i) => {
      const nm = `${nome} ${m?.name || ""}`.trim();
      (Array.isArray(m?.images) ? m.images : []).forEach((u, j) => olhar(id, nm, `models[${i}].images[${j}]`, u));
      olhar(id, nm, `models[${i}].image_url`, m?.image_url);
    });
  }
  return saida;
}
function trocarEnderecos(p, mapa) {
  let trocas = 0;
  const t = (v) => typeof v === "string" && mapa[v.trim()] ? (trocas++, mapa[v.trim()]) : v;
  const novo = {};
  if ("image_url" in (p || {})) novo.image_url = t(p.image_url);
  if (Array.isArray(p?.images)) novo.images = p.images.map(t);
  if (Array.isArray(p?.models)) novo.models = p.models.map((m) => {
    const x = { ...m };
    if (Array.isArray(m?.images)) x.images = m.images.map(t);
    if ("image_url" in (m || {})) x.image_url = t(m.image_url);
    return x;
  });
  return { novo, trocas };
}
var EXT = { jpeg: "jpg", jpg: "jpg", png: "png", webp: "webp", gif: "gif", avif: "avif" };
async function pegarTrava(db2, dono, agora) {
  const ref = db2.collection(COLECAO_ESTADO).doc(DOC_TRAVA);
  return db2.runTransaction(async (t) => {
    const s = await t.get(ref);
    const d = s.exists ? s.data() : {};
    if (d?.travado_ate && new Date(d.travado_ate).getTime() > agora.getTime() && d.dono !== dono) throw new RodadaEmAndamento();
    t.set(ref, { ...d, dono, travado_ate: new Date(agora.getTime() + TRAVA_MS).toISOString() });
    return Array.isArray(d?.falhas) ? d.falhas.map(String) : [];
  });
}
async function soltarTrava(db2, dono, falhas) {
  const ref = db2.collection(COLECAO_ESTADO).doc(DOC_TRAVA);
  await db2.runTransaction(async (t) => {
    const s = await t.get(ref);
    const d = s.exists ? s.data() : {};
    if (d?.dono && d.dono !== dono) return;
    t.set(ref, { ...d, dono: "", travado_ate: "", ...falhas ? { falhas: falhas.slice(-MAX_FALHAS_LEMBRADAS) } : {} });
  });
}
async function fotosExternas(deps, aplicar, quem) {
  const agora = () => deps.agora?.() || /* @__PURE__ */ new Date();
  const dono = import_crypto3.default.randomUUID();
  const falhasAntes = await pegarTrava(deps.db, dono, agora());
  let falhasDepois = null;
  try {
    const snap = await deps.db.collection("products").get();
    const produtos = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    const refs = referenciasExternas(produtos, deps.site, deps.buckets);
    const unicas = [...new Set(refs.map((r) => r.url))];
    const jaFalhou = new Set(falhasAntes);
    const fila = [...unicas.filter((u) => !jaFalhou.has(u)), ...unicas.filter((u) => jaFalhou.has(u))];
    const nestaRodada = fila.slice(0, MAX_URLS_POR_RODADA);
    const sharp = await deps.carregarSharp();
    const baixar = deps.baixar || ((u) => baixarExterna(u, 15e3, MAX_ORIGEM_BYTES));
    const itens = nestaRodada.map((url) => {
      const usos = refs.filter((r) => r.url === url);
      return { url, usos: usos.length, produtos: [...new Set(usos.map((r) => r.produto))].slice(0, 6), ok: false };
    });
    let proximo = 0;
    const trabalhar = async () => {
      while (proximo < itens.length) {
        const it = itens[proximo++];
        try {
          const r = await baixar(it.url);
          if (!r) {
            it.motivo = "n\xE3o baixou (fora do ar, lento ou acima de 15 MB)";
            continue;
          }
          let formato = (r.tipo.split("/")[1] || "").replace("jpg", "jpeg");
          if (sharp) {
            try {
              const meta = await sharp(r.bytes, { failOn: "none", limitInputPixels: LIMITE_PIXELS }).metadata();
              formato = String(meta?.format || "");
              if (!meta?.width) throw new Error("sem imagem");
            } catch {
              it.motivo = "o arquivo n\xE3o \xE9 uma imagem (ou \xE9 grande demais)";
              continue;
            }
          } else if (!r.tipo.startsWith("image/")) {
            it.motivo = "o arquivo n\xE3o \xE9 uma imagem";
            continue;
          }
          if (!EXT[formato]) {
            it.motivo = `formato ${formato || "desconhecido"} n\xE3o usado no app`;
            continue;
          }
          it.ok = true;
          it.bytes = r.bytes.length;
          it.formato = formato;
          if (aplicar) {
            const nome = import_crypto3.default.createHash("sha1").update(it.url).digest("hex").slice(0, 20);
            try {
              it.novo = await deps.gravar(`catalogo_site/${nome}.${EXT[formato]}`, r.bytes, `image/${formato === "jpg" ? "jpeg" : formato}`);
            } catch (e) {
              it.ok = false;
              it.motivo = `n\xE3o gravou no Storage: ${String(e?.message || e).slice(0, 120)}`;
            }
          }
        } catch (e) {
          it.ok = false;
          it.motivo = `erro: ${String(e?.message || e).slice(0, 120)}`;
        }
      }
    };
    await Promise.all(Array.from({ length: SIMULTANEAS }, trabalhar));
    const mapa = {};
    for (const it of itens) if (it.ok && it.novo) mapa[it.url] = it.novo;
    const alterados = [];
    const erros = [];
    if (aplicar && Object.keys(mapa).length) {
      const registro = deps.db.collection("manutencao_fotos_externas").doc();
      await registro.set({
        feito_em: agora().toISOString(),
        quem,
        situacao: "trocando",
        mapa: Object.entries(mapa).map(([de, para]) => ({ de, para })),
        produtos_alterados: [],
        erros: []
      });
      try {
        for (const pid of [...new Set(refs.filter((r) => mapa[r.url]).map((r) => r.pid))]) {
          try {
            const ref = deps.db.collection("products").doc(pid);
            const trocas = await deps.db.runTransaction(async (t) => {
              const s = await t.get(ref);
              if (!s.exists) return 0;
              const { novo, trocas: trocas2 } = trocarEnderecos(s.data(), mapa);
              if (trocas2) t.update(ref, novo);
              return trocas2;
            });
            if (trocas) alterados.push({ pid, trocas });
          } catch (e) {
            erros.push({ pid, erro: String(e?.message || e).slice(0, 200) });
          }
        }
      } finally {
        await registro.set({
          feito_em: agora().toISOString(),
          quem,
          situacao: erros.length ? "concluido_com_erros" : "concluido",
          mapa: Object.entries(mapa).map(([de, para]) => ({ de, para })),
          produtos_alterados: alterados,
          erros,
          terminado_em: agora().toISOString()
        });
      }
    }
    const okAgora = new Set(itens.filter((i) => i.ok).map((i) => i.url));
    const falhouAgora = itens.filter((i) => !i.ok).map((i) => i.url);
    if (aplicar) falhasDepois = [...falhasAntes.filter((u) => !okAgora.has(u) && !falhouAgora.includes(u)), ...falhouAgora];
    const faltam = aplicar ? Math.max(0, unicas.length - itens.filter((i) => i.ok && i.novo).length) : Math.max(0, unicas.length - itens.length);
    return {
      ok: true,
      aplicado: aplicar,
      referencias: refs.length,
      fotos_de_fora: unicas.length,
      nesta_rodada: itens.length,
      limite_por_rodada: MAX_URLS_POR_RODADA,
      copiaveis: itens.filter((i) => i.ok).length,
      com_problema: itens.filter((i) => !i.ok).length,
      produtos_alterados: alterados.length,
      erros_ao_trocar: erros.length,
      faltam_para_proxima_rodada: faltam,
      itens
    };
  } finally {
    await soltarTrava(deps.db, dono, falhasDepois).catch(() => {
    });
  }
}

// server/emailConfiavel.ts
var EMAILS_DIRETORIA = ["roderbrasil@gmail.com", "roderindica@gmail.com", "jeferson@roderbrasil.com.br"];
function emailConfiavelDoToken(dec) {
  if (!dec || dec.firebase?.sign_in_provider === "anonymous") return "";
  if (dec.email_verified !== true) return "";
  return String(dec.email || "").toLowerCase().trim();
}
function ehDiretoriaPeloToken(dec) {
  const email = emailConfiavelDoToken(dec);
  return !!email && EMAILS_DIRETORIA.includes(email);
}
function papelDeQuemChama(dec, papelDoCadastro) {
  if (ehDiretoriaPeloToken(dec)) return "admin";
  return String(papelDoCadastro || "");
}
function classificarConta(contaAuth, cadastro, temPreCadastroPorEmail) {
  if (!contaAuth || contaAuth.emailVerified === true) return "pular";
  const email = String(contaAuth.email || "").toLowerCase().trim();
  if (!email) return "pular";
  const temSenha = Array.isArray(contaAuth.providerData) && contaAuth.providerData.some((p) => p?.providerId === "password");
  if (!temSenha) return "pular";
  if (EMAILS_DIRETORIA.includes(email)) return "diretoria";
  if (!cadastro) return temPreCadastroPorEmail ? "pre_cadastro_por_email" : "sem_cadastro";
  if (cadastro.status !== "active") return "cadastro_inativo";
  const emailCadastro = String(cadastro.email || "").toLowerCase().trim();
  if (emailCadastro && emailCadastro !== email) return "email_diferente";
  return "marcar";
}
function podeConfirmarPrimeiroAcesso(dec, provisorio, cadastroId, marca) {
  if (!dec || dec.firebase?.sign_in_provider !== "password") return false;
  if (!provisorio || !String(provisorio.initial_password || "")) return false;
  if (!marca || marca.cadastro_id !== cadastroId || !String(marca.definida_por_uid || "")) return false;
  const email = String(dec.email || "").toLowerCase().trim();
  if (!email || String(marca.email || "").toLowerCase().trim() !== email) return false;
  if (String(provisorio.email || "").toLowerCase().trim() !== email) return false;
  const definidaEm = Date.parse(String(marca.definida_em || ""));
  if (!Number.isFinite(definidaEm)) return false;
  const entrouEm = Number(dec.auth_time);
  if (!Number.isFinite(entrouEm) || entrouEm <= 0) return false;
  return entrouEm * 1e3 > definidaEm;
}
var CAMPOS_DO_PRE_CADASTRO = [
  "name",
  "phone",
  "role",
  "commission_rate",
  "assigned_regions",
  "monthly_salary",
  "pix_key",
  "bank_info",
  "cpf_cnpj",
  "company_name",
  "city",
  "state",
  "is_icms_contributor",
  "is_lead_receiver",
  "is_commissionable",
  "vacation_start",
  "vacation_end",
  "contract_accepted",
  "contract_accepted_at",
  "initial_password",
  "initial_password_set_at",
  "sidebar_order",
  "created_at",
  "permissions"
];
function camposDoPreCadastro(dados2) {
  const saida = {};
  for (const k of CAMPOS_DO_PRE_CADASTRO) if (dados2 && dados2[k] !== void 0) saida[k] = dados2[k];
  return saida;
}
async function escolherPreCadastros(p) {
  const aceitos = [];
  for (const c of p.cadastros) {
    if (c.id === p.uidDoLogin) continue;
    if (c.dados?.status !== "active") continue;
    if (await p.ehContaDeLogin(c.id)) continue;
    if (!p.confirmado && !podeConfirmarPrimeiroAcesso(p.dec, c.dados, c.id, await p.marcaDe(c.id))) continue;
    aceitos.push(c);
  }
  return aceitos;
}
var PAPEIS_QUE_GESTAO_DEFINE_SENHA = [
  "external_seller",
  "vendedor_padrao",
  "internal_seller",
  "financial",
  "finance",
  "fiscal",
  "marketing",
  "assistant",
  ""
];
function podeDefinirSenha(p) {
  const admin2 = p.diretoria || p.papelQuemPede === "admin";
  if (admin2) return { ok: true };
  if (!["manager", "triagem"].includes(p.papelQuemPede)) {
    return { ok: false, status: 403, erro: "Acesso negado. S\xF3 administrador, gerente e triagem definem senhas." };
  }
  const email = String(p.emailAlvo || "").toLowerCase().trim();
  if (EMAILS_DIRETORIA.includes(email) || p.papeisAlvo.some((r) => !PAPEIS_QUE_GESTAO_DEFINE_SENHA.includes(String(r || "")))) {
    return { ok: false, status: 403, erro: "S\xF3 o administrador troca a senha de contas de gest\xE3o (administrador, gerente e triagem)." };
  }
  if (p.temGoogle) {
    return { ok: false, status: 403, erro: "Esta pessoa entra com o Google. S\xF3 o administrador pode p\xF4r senha nessa conta." };
  }
  return { ok: true };
}
function papeisDaContaAlvo(p) {
  const papeisAlvo = [String(p.cadastroAlvoRole || ""), ...p.papeisPorEmail.map((r) => String(r || ""))];
  if (!p.contaUid || p.contaUid === p.cadastroAlvoId) return { ok: true, papeisAlvo };
  if (p.cadastroDaConta?.existe) {
    papeisAlvo.push(String(p.cadastroDaConta.role || ""));
    return { ok: true, papeisAlvo };
  }
  if (p.cadastroAlvoEhPreCadastro) return { ok: true, papeisAlvo };
  return {
    ok: false,
    papeisAlvo,
    status: 409,
    erro: "A conta de login deste e-mail n\xE3o tem cadastro pr\xF3prio na tela de Usu\xE1rios. S\xF3 o pr\xE9-cadastro (primeiro acesso) recebe senha assim; fale com o administrador."
  };
}

// src/lib/calculoComissao.ts
var PAPEIS_SEM_COMISSAO = ["admin", "manager", "internal_seller", "triagem", "financial", "marketing", "fiscal", "vendedor_padrao"];
var TAXA_SEM_CADASTRO = 2;
var RE_SERVICO = /m[ãa]o\s*de\s*obra|frete|transporte|instala[çc][ãa]o|montagem|entrega\s*t[ée]cnica|deslocamento|kit\s+de\s+instala/i;
function itemComissionavel(p) {
  const is9000 = !!p.code && String(p.code).trim().startsWith("9000");
  const isService = RE_SERVICO.test(p.name || "");
  return p.is_commissionable !== false && !is9000 && !isService;
}
function baseBrutaDosProdutos(produtos) {
  return (produtos || []).reduce((acc, p) => acc + (itemComissionavel(p) ? (p.base_value || 0) * (p.quantity || 0) : 0), 0);
}
function papelComissionavel(papel) {
  return !PAPEIS_SEM_COMISSAO.includes(papel || "external_seller");
}
function taxaDoParceiro(parceiro) {
  const t = parceiro?.commission_rate;
  return t !== void 0 && t !== null ? Number(t) : TAXA_SEM_CADASTRO;
}
function calcularComissao(produtos, descontoReais, taxa) {
  const baseBruta = baseBrutaDosProdutos(produtos);
  const desconto = Math.min(Math.max(Number(descontoReais) || 0, 0), baseBruta);
  const descontoPct = baseBruta > 0 ? desconto / baseBruta * 100 : 0;
  const base = baseBruta - desconto;
  return { baseBruta, desconto, descontoPct, base, taxa, valor: base * (taxa / 100) };
}
var FUSO_BR = "America/Sao_Paulo";
function diaEmBrasilia(d) {
  return d.toLocaleDateString("en-CA", { timeZone: FUSO_BR });
}
function diaDaEntrega(v) {
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : diaEmBrasilia(d);
}
function mesDaComissao(dataEntrega, agora = /* @__PURE__ */ new Date()) {
  const hoje = diaEmBrasilia(agora);
  const [anoAtual, mesAtual] = hoje.split("-").map(Number);
  if (dataEntrega) {
    const dia = diaDaEntrega(dataEntrega);
    if (dia && dia < hoje) return { month: mesAtual, year: anoAtual };
  }
  return mesAtual === 12 ? { month: 1, year: anoAtual + 1 } : { month: mesAtual + 1, year: anoAtual };
}
var UIDS_DE_SISTEMA = ["client_referral", "direct_factory", "public_request", "anonymous"];
var NOME_SEM_PARCEIRO = /^(solicita[çc][ãa]o direta|venda direta|cliente:)|\(f[áa]brica\)\s*$/i;
function temParceiroSemUid(ind) {
  if (!ind || String(ind.external_seller_uid || "").trim()) return false;
  const nome = String(ind.external_seller_name || ind.indicator_name || "").trim();
  if (nome && NOME_SEM_PARCEIRO.test(nome)) return false;
  return !!(nome || String(ind.external_seller_email || "").trim() || ind.indicator_uid);
}
var temEstornoNoHistorico = (ind) => {
  const h = Array.isArray(ind?.negotiation_history) ? ind.negotiation_history : [];
  const ultimo = (re) => h.reduce((m, x) => re.test(String(x?.content || "")) ? Math.max(m, Date.parse(x?.created_at) || 0) : m, -Infinity);
  const estorno = ultimo(/^ESTORNO DE FATURAMENTO/i);
  if (estorno === -Infinity) return false;
  const faturou = ultimo(/^VENDA FINALIZADA/i);
  return !(faturou !== -Infinity && faturou > estorno);
};
var emCentavos = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
function calcularComissaoCentavos(produtos, descontoReais, taxa) {
  const c = calcularComissao(produtos, descontoReais, taxa);
  const baseBruta = emCentavos(c.baseBruta);
  const desconto = emCentavos(c.desconto);
  const base = emCentavos(baseBruta - desconto);
  return { ...c, baseBruta, desconto, base, valor: emCentavos(base * (taxa / 100)) };
}

// server/diagnosticoComissao.ts
var temMarcaDeEstorno = (ind) => !!ind?.estornado_em;
var normalizar = (v) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9@._]+/g, " ").replace(/\s+/g, " ").trim();
function nomeContido(a, b) {
  if (!a || !b || a === b) return false;
  const [curto2, longo] = a.length <= b.length ? [a, b] : [b, a];
  if (curto2.length < 3) return false;
  return ` ${longo} `.includes(` ${curto2} `);
}
function nomeCasa(nome, termoNormalizado) {
  const n = normalizar(nome);
  if (!n || !termoNormalizado) return false;
  const palavras = n.split(" ");
  return termoNormalizado.split(" ").every((t) => palavras.some((p) => p.startsWith(t)));
}
var CAMPOS_IND = [
  "status",
  "client_name",
  "external_seller_uid",
  "external_seller_name",
  "external_seller_email",
  "indicator_name",
  "indicator_uid",
  "created_by",
  "user_id",
  "sale_value",
  "base_commission_value",
  "commissioned_products",
  "commission_value",
  "commissionable_value",
  "discount_amount",
  "sale_date",
  "sale_order_number",
  "delivery_date",
  "updated_at",
  "created_at",
  "finance_notice_pending",
  "finance_notice_due_at",
  "finance_notice_sent_at",
  "base_machine"
];
var ROTULO_STATUS = {
  pending: "pendente",
  negotiating: "em negocia\xE7\xE3o",
  sold: "faturada",
  cancelled: "cancelada",
  lost: "perdida"
};
var chaveMes = (m, a) => a * 12 + (m - 1);
async function diagnosticar(deps, termoBruto, opcoes = {}) {
  const { db: db2 } = deps;
  const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  const termo = String(termoBruto || "").trim();
  if (termo.length < 2) throw Object.assign(new Error("Digite o nome, o e-mail ou o c\xF3digo do parceiro."), { status: 400 });
  const termoN = normalizar(termo);
  const termoEmail = termo.includes("@") ? termo.toLowerCase() : "";
  const usersSnap = await db2.collection("users").get();
  const todos = usersSnap.docs.map((d) => {
    const u = d.data() || {};
    return { ...u, uid: String(u.uid || d.id), doc_id: d.id };
  });
  const porUid = /* @__PURE__ */ new Map();
  todos.forEach((u) => {
    porUid.set(u.uid, u);
    porUid.set(u.doc_id, u);
  });
  const achadosBusca = todos.filter((u) => u.uid === termo || u.doc_id === termo || termoEmail && String(u.email || "").toLowerCase() === termoEmail || !termoEmail && nomeCasa(u.name, termoN));
  const duplicados = [];
  const vistos = /* @__PURE__ */ new Set();
  const extras = /* @__PURE__ */ new Map();
  for (const u of achadosBusca) {
    const nome = normalizar(u.name);
    const email = String(u.email || "").toLowerCase();
    const motivoDe = (o) => {
      if (o.uid === u.uid) return "mesmo";
      if (email && String(o.email || "").toLowerCase() === email) return "mesmo e-mail";
      const on = normalizar(o.name);
      if (nome && on === nome) return "mesmo nome";
      if (nome && on && papelComissionavel(u.role) && papelComissionavel(o.role) && nomeContido(nome, on)) return "nome parecido";
      return null;
    };
    const iguais = todos.filter((o) => motivoDe(o));
    const chave = iguais.map((o) => o.uid).sort().join(",");
    if (iguais.length > 1 && !vistos.has(chave)) {
      vistos.add(chave);
      const motivos = new Set(iguais.map(motivoDe).filter((m) => m && m !== "mesmo"));
      const motivo = motivos.has("mesmo e-mail") ? "mesmo e-mail" : motivos.has("mesmo nome") ? "mesmo nome" : "nome parecido";
      duplicados.push({ motivo, uids: iguais.map((o) => o.uid) });
      iguais.forEach((o) => {
        if (!achadosBusca.includes(o)) extras.set(o.uid, o);
      });
    }
  }
  const achados = [...achadosBusca, ...extras.values()];
  const uids = /* @__PURE__ */ new Set();
  achados.forEach((u) => {
    uids.add(u.uid);
    uids.add(u.doc_id);
  });
  if (!achados.length) uids.add(termo);
  const emails = new Set(achados.map((u) => String(u.email || "").toLowerCase()).filter(Boolean));
  if (termoEmail) emails.add(termoEmail);
  const nomesAchados = new Set(achados.map((u) => normalizar(u.name)).filter(Boolean));
  const contasComissionaveis = achados.filter((u) => papelComissionavel(u.role));
  const variasContas = contasComissionaveis.length > 1;
  const contaEscolhida = variasContas && opcoes.conta ? contasComissionaveis.find((u) => u.uid === opcoes.conta || u.doc_id === opcoes.conta) || null : null;
  const nomeConta = (uid) => {
    const u = uid ? porUid.get(uid) : null;
    return u ? u.name || u.uid : uid || "nenhuma";
  };
  const indSnap = await db2.collection("indications").select(...CAMPOS_IND).get();
  const indicacoes = [];
  for (const d of indSnap.docs) {
    const ind = d.data() || {};
    const por = [];
    if (["external_seller_uid", "indicator_uid", "created_by", "user_id"].some((c) => ind[c] && uids.has(String(ind[c])))) por.push("uid");
    if (ind.external_seller_email && emails.has(String(ind.external_seller_email).toLowerCase())) por.push("e-mail");
    const nomeBate = (v) => !!v && (nomesAchados.has(normalizar(v)) || !termoEmail && nomeCasa(v, termoN));
    if (nomeBate(ind.external_seller_name) || nomeBate(ind.indicator_name)) por.push("nome");
    if (por.length) indicacoes.push({ id: d.id, ...ind, ligado_por: por });
  }
  indicacoes.sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")));
  const limitadas = indicacoes.slice(0, 150);
  const comissoes = /* @__PURE__ */ new Map();
  for (const uid of uids) {
    const s = await db2.collection("commissions").where("external_seller_uid", "==", uid).get();
    s.docs.forEach((c) => comissoes.set(c.id, { id: c.id, ...c.data(), achada_por: "uid" }));
  }
  const ids = limitadas.map((i) => i.id);
  for (let i = 0; i < ids.length; i += 10) {
    const s = await db2.collection("commissions").where("indication_id", "in", ids.slice(i, i + 10)).get();
    s.docs.forEach((c) => {
      if (!comissoes.has(c.id)) comissoes.set(c.id, { id: c.id, ...c.data(), achada_por: "indica\xE7\xE3o" });
    });
  }
  const listaComissoes = Array.from(comissoes.values()).map((c) => ({
    id: c.id,
    indication_id: c.indication_id || null,
    external_seller_uid: c.external_seller_uid || null,
    external_seller_name: c.external_seller_name || null,
    value: Number(c.value) || 0,
    base_value_used: Number(c.base_value_used) || 0,
    status: c.status || null,
    month: c.month ?? null,
    year: c.year ?? null,
    sale_date: c.sale_date || null,
    created_at: c.created_at || null,
    achada_por: c.achada_por,
    conta_nome: c.external_seller_uid ? nomeConta(c.external_seller_uid) : null
  }));
  const extratos = [];
  for (const uid of uids) {
    const s = await db2.collection("monthly_statements").where("seller_uid", "==", uid).get();
    s.docs.forEach((e) => {
      const x = e.data() || {};
      extratos.push({ id: e.id, seller_uid: x.seller_uid, month: x.month, year: x.year, status: x.status || null, total_value: Number(x.total_value) || 0, nf_enviada: !!x.nf_url, commission_ids: (x.commission_ids || []).length });
    });
  }
  const notifSnap = await db2.collection("settings").doc("notifications").get();
  const notif = notifSnap.exists ? notifSnap.data() || {} : {};
  const avisos = {
    existe: !!notifSnap.exists,
    monthly_report_partners: notif.monthly_report_partners === true,
    monthly_report_directors: notif.monthly_report_directors === true,
    payment_reminder_finance: notif.payment_reminder_finance === true
  };
  const [anoBr, mesBr] = diaEmBrasilia(agora).split("-").map(Number);
  const mesAgora = chaveMes(mesBr, anoBr);
  const resultadoInd = limitadas.map((ind) => {
    const uidInd = String(ind.external_seller_uid || "");
    const parceiro = uidInd ? porUid.get(uidInd) : null;
    const comms = listaComissoes.filter((c) => c.indication_id === ind.id);
    const falta = [];
    let parceiroOk = false;
    const troca = comms.length ? void 0 : "ligar";
    const TROCAR = ' Para mudar de conta, use "Trocar Indicador" na tela de Indica\xE7\xF5es: a comiss\xE3o vai junto.';
    if (!uidInd) falta.push({ codigo: "sem_uid", texto: "Indica\xE7\xE3o sem parceiro ligado. A comiss\xE3o n\xE3o nasce no faturamento e o painel do parceiro n\xE3o enxerga a venda.", acao: troca });
    else if (UIDS_DE_SISTEMA.includes(uidInd)) falta.push({ codigo: "uid_sistema", texto: `Ligada a "${uidInd}", que n\xE3o \xE9 um parceiro.`, acao: troca });
    else if (!parceiro) falta.push({ codigo: "uid_inexistente", texto: "Ligada a um c\xF3digo de parceiro que n\xE3o existe mais no cadastro (cadastro antigo ou apagado). O painel do parceiro n\xE3o enxerga esta venda.", acao: troca });
    else if (!papelComissionavel(parceiro.role)) falta.push({ codigo: "papel", texto: `Ligada a ${parceiro.name || uidInd}, com perfil ${parceiro.role}, que n\xE3o recebe comiss\xE3o.`, acao: troca });
    else {
      parceiroOk = true;
      if (achados.length && !uids.has(uidInd)) falta.push({ codigo: "outro_parceiro", texto: `Ligada a outro cadastro: ${parceiro.name || uidInd}.`, acao: troca });
      else if (contaEscolhida && uidInd !== contaEscolhida.uid) {
        falta.push({ codigo: "conta_repetida", texto: `Esta venda est\xE1 na conta ${nomeConta(uidInd)}, mas o parceiro entra com a conta ${nomeConta(contaEscolhida.uid)}. O painel dele n\xE3o mostra esta venda.` + TROCAR });
      }
    }
    const produtos = ind.commissioned_products || [];
    const calc = calcularComissao(produtos, Number(ind.discount_amount) || 0, taxaDoParceiro(parceiro));
    if (calc.baseBruta <= 0) {
      falta.push({ codigo: "base_zero", texto: produtos.length ? "Nenhum produto da indica\xE7\xE3o conta para comiss\xE3o (s\xF3 kit 9000, frete, instala\xE7\xE3o ou item marcado como n\xE3o comission\xE1vel). A base fica zerada." : "Sem produtos cadastrados na indica\xE7\xE3o: a base da comiss\xE3o fica zerada. Vincule os produtos vendidos na indica\xE7\xE3o." });
    }
    if (ind.status === "sold") {
      if (!comms.length) {
        falta.push(parceiroOk && calc.valor > 0 ? { codigo: "sem_comissao", texto: "Venda faturada sem comiss\xE3o lan\xE7ada.", acao: "gerar" } : { codigo: "sem_comissao", texto: "Venda faturada sem comiss\xE3o lan\xE7ada. Resolva os itens acima para poder gerar." });
      } else {
        for (const c of comms) {
          if (c.value <= 0) falta.push({ codigo: "comissao_zero", texto: `Comiss\xE3o lan\xE7ada com valor zero (${c.id}).` });
          if (uidInd && c.external_seller_uid !== uidInd) falta.push({ codigo: "comissao_outro_uid", texto: `A comiss\xE3o est\xE1 em nome de outro c\xF3digo (${c.external_seller_name || c.external_seller_uid || "vazio"}): o painel do parceiro n\xE3o soma ela. A corre\xE7\xE3o autom\xE1tica leva a comiss\xE3o para o parceiro da indica\xE7\xE3o; se ela continuar aqui, veja o motivo em "Corre\xE7\xF5es autom\xE1ticas".` });
          else if (contaEscolhida && c.external_seller_uid !== contaEscolhida.uid && uidInd === contaEscolhida.uid) {
            falta.push({ codigo: "comissao_conta_repetida", texto: `A comiss\xE3o de ${brl(c.value)} est\xE1 na conta ${nomeConta(c.external_seller_uid)}, e o parceiro entra com a conta ${nomeConta(contaEscolhida.uid)}. A corre\xE7\xE3o autom\xE1tica leva a comiss\xE3o para o parceiro da indica\xE7\xE3o.` });
          }
          if (c.status !== "paid" && c.month && c.year && chaveMes(c.month, c.year) < mesAgora) {
            falta.push({ codigo: "comissao_atrasada", texto: `Comiss\xE3o de ${String(c.month).padStart(2, "0")}/${c.year} ainda n\xE3o est\xE1 como paga.` });
          }
        }
        if (comms.length > 1) falta.push({ codigo: "comissao_duplicada", texto: `${comms.length} comiss\xF5es para a mesma venda.` });
      }
      if (ind.finance_notice_pending && !ind.finance_notice_sent_at) falta.push({ codigo: "aviso_financeiro", texto: `Aviso ao financeiro programado para ${String(ind.finance_notice_due_at || "").slice(0, 10).split("-").reverse().join("/")}.`, tipo: "info" });
    } else {
      falta.push({ codigo: "nao_faturada", texto: `Ainda n\xE3o faturada (${ROTULO_STATUS[ind.status] || ind.status || "sem status"}).`, tipo: "info" });
    }
    return {
      id: ind.id,
      client_name: ind.client_name || "",
      status: ind.status || null,
      ligado_por: ind.ligado_por,
      conta: uidInd || null,
      conta_nome: uidInd ? nomeConta(uidInd) : null,
      fora_da_conta: !!contaEscolhida && (uidInd !== contaEscolhida.uid || comms.some((c) => c.external_seller_uid !== contaEscolhida.uid)),
      external_seller_uid: ind.external_seller_uid || null,
      external_seller_name: ind.external_seller_name || null,
      external_seller_email: ind.external_seller_email || null,
      indicator_name: ind.indicator_name || null,
      indicator_uid: ind.indicator_uid || null,
      created_by: ind.created_by || null,
      sale_value: Number(ind.sale_value) || 0,
      base_commission_value: Number(ind.base_commission_value) || 0,
      produtos: {
        total: produtos.length,
        comissionaveis: produtos.filter(itemComissionavel).length,
        base_bruta: baseBrutaDosProdutos(produtos),
        itens: produtos.slice(0, 12).map((p) => ({ code: p.code || "", name: p.name || "", quantity: Number(p.quantity) || 0, base_value: Number(p.base_value) || 0, conta: itemComissionavel(p) }))
      },
      commission_value: Number(ind.commission_value) || 0,
      discount_amount: Number(ind.discount_amount) || 0,
      sale_date: ind.sale_date || null,
      sale_order_number: ind.sale_order_number || null,
      updated_at: ind.updated_at || null,
      finance_notice_pending: !!ind.finance_notice_pending,
      finance_notice_due_at: ind.finance_notice_due_at || null,
      finance_notice_sent_at: ind.finance_notice_sent_at || null,
      calculo_previsto: parceiroOk ? { base: calc.base, valor: calc.valor, desconto: calc.desconto } : null,
      comissoes: comms,
      falta
    };
  });
  const avisosGerais = [];
  if (!achados.length) avisosGerais.push("Nenhum usu\xE1rio encontrado com esse nome, e-mail ou c\xF3digo.");
  duplicados.forEach((d) => avisosGerais.push(`Cadastro repetido (${d.motivo}): ${d.uids.length} usu\xE1rios. A venda pode estar ligada a um e o parceiro entrando com o outro.`));
  if (variasContas && !contaEscolhida) avisosGerais.push(`H\xE1 ${contasComissionaveis.length} contas que recebem comiss\xE3o. Escolha abaixo a conta em que o parceiro entra para ver o que est\xE1 fora dela.`);
  if (!avisos.monthly_report_partners) avisosGerais.push("E-mail mensal ao parceiro (dia 1 e lembrete do dia 5) est\xE1 desligado em Configura\xE7\xF5es > Central de Notifica\xE7\xF5es.");
  if (!avisos.monthly_report_directors) avisosGerais.push("Relat\xF3rio mensal da diretoria e do financeiro (dia 1) est\xE1 desligado.");
  if (!avisos.payment_reminder_finance) avisosGerais.push("Lembrete de pagamento ao financeiro (dia 7) est\xE1 desligado.");
  if (indicacoes.length > limitadas.length) avisosGerais.push(`Mostrando as ${limitadas.length} indica\xE7\xF5es mais recentes de ${indicacoes.length}.`);
  return {
    ok: true,
    termo,
    usuarios: achados.map((u) => ({
      uid: u.uid,
      doc_id: u.doc_id,
      name: u.name || "",
      email: u.email || "",
      role: u.role || "",
      status: u.status || "",
      commission_rate: u.commission_rate ?? null,
      // só o administrador chega aqui
      comissionavel: papelComissionavel(u.role),
      repetido: extras.has(u.uid)
    })),
    duplicados,
    varias_contas: variasContas,
    conta_escolhida: contaEscolhida ? contaEscolhida.uid : null,
    indicacoes: resultadoInd,
    comissoes: listaComissoes,
    extratos,
    avisos,
    avisos_gerais: avisosGerais
  };
}
function erro(status, msg) {
  return Object.assign(new Error(msg), { status });
}
var brl = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
var idHist = () => Math.random().toString(36).substring(2, 11);
function exigirId(indId) {
  if (!String(indId || "").trim()) throw erro(400, "Indica\xE7\xE3o n\xE3o informada.");
}
function conferirGeracao(indId, ind, parceiro, descontoInformado, agora, usarTaxaGravada = false) {
  if (!ind) throw erro(404, "Indica\xE7\xE3o n\xE3o encontrada.");
  if (ind.status !== "sold") throw erro(409, "A venda ainda n\xE3o foi faturada. A comiss\xE3o nasce no faturamento.");
  const uid = String(ind.external_seller_uid || "");
  if (!uid || UIDS_DE_SISTEMA.includes(uid)) throw erro(409, "Ligue a indica\xE7\xE3o ao parceiro antes de gerar a comiss\xE3o.");
  if (!parceiro) throw erro(409, "O parceiro ligado a esta indica\xE7\xE3o n\xE3o existe no cadastro. Ligue ao parceiro certo antes.");
  if (!papelComissionavel(parceiro.role)) throw erro(409, `O perfil de ${parceiro.name || "quem est\xE1 ligado"} n\xE3o recebe comiss\xE3o.`);
  const desconto = descontoInformado !== void 0 && descontoInformado !== null && Number.isFinite(Number(descontoInformado)) ? Number(descontoInformado) : Number(ind.discount_amount) || 0;
  const taxa = usarTaxaGravada && Number(ind.commission_rate_applied) > 0 ? Number(ind.commission_rate_applied) : taxaDoParceiro(parceiro);
  const calc = calcularComissao(ind.commissioned_products || [], desconto, taxa);
  if (calc.baseBruta <= 0) throw erro(409, "Sem produtos comission\xE1veis na indica\xE7\xE3o: a comiss\xE3o daria zero. Vincule os produtos vendidos antes.");
  if (calc.valor <= 0) throw erro(409, "O desconto zera a base da comiss\xE3o. Confira o desconto informado.");
  const mes = mesDaComissao(ind.delivery_date, agora);
  return { uid, calc, mes, nomeParceiro: parceiro.name || ind.external_seller_name || "Parceiro" };
}
async function previaGeracao(deps, indId, desconto) {
  const { db: db2 } = deps;
  const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  exigirId(indId);
  const s = await db2.collection("indications").doc(indId).get();
  const ind = s.exists ? s.data() : null;
  const uid = String(ind?.external_seller_uid || "");
  const p = uid && !UIDS_DE_SISTEMA.includes(uid) ? await db2.collection("users").doc(uid).get() : null;
  const r = conferirGeracao(indId, ind, p?.exists ? p.data() : null, desconto, agora);
  const ja = await db2.collection("commissions").doc(indId).get();
  const legado = await db2.collection("commissions").where("indication_id", "==", indId).get();
  return {
    ok: true,
    ja_existe: ja.exists || !legado.empty,
    parceiro: r.nomeParceiro,
    cliente: ind.client_name || "",
    base_bruta: r.calc.baseBruta,
    desconto: r.calc.desconto,
    base: r.calc.base,
    valor: r.calc.valor,
    month: r.mes.month,
    year: r.mes.year
  };
}
async function gerarComissao(deps, indId, autor, desconto, opcoes = {}) {
  const { db: db2, arrayUnion } = deps;
  const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  exigirId(indId);
  const indRef = db2.collection("indications").doc(indId);
  const commRef = db2.collection("commissions").doc(indId);
  return db2.runTransaction(async (tx) => {
    const s = await tx.get(indRef);
    const ind = s.exists ? s.data() : null;
    const uid = String(ind?.external_seller_uid || "");
    const p = uid && !UIDS_DE_SISTEMA.includes(uid) ? await tx.get(db2.collection("users").doc(uid)) : null;
    const ja = await tx.get(commRef);
    const legado = await tx.get(db2.collection("commissions").where("indication_id", "==", indId));
    if (opcoes.recusarEstornada && (temMarcaDeEstorno(ind) || temEstornoNoHistorico(ind))) {
      throw erro(409, "Esta indica\xE7\xE3o foi estornada (ou est\xE1 com o estorno em andamento). A comiss\xE3o n\xE3o \xE9 lan\xE7ada sozinha.");
    }
    const r = conferirGeracao(indId, ind, p?.exists ? p.data() : null, desconto, agora, !!opcoes.usarTaxaGravada);
    if (ja.exists || !legado.empty) throw erro(409, "J\xE1 existe comiss\xE3o lan\xE7ada para esta venda. Nada foi alterado.");
    const fech = await tx.get(db2.collection("monthly_statements").doc(`${r.uid}_${r.mes.month}_${r.mes.year}`));
    if (fech.exists && fechamentoTravado(fech.data())) {
      throw erro(409, `O fechamento de ${mmaa(r.mes.month, r.mes.year)} de ${r.nomeParceiro} j\xE1 est\xE1 ${rotuloFechamento(fech.data())}. A comiss\xE3o entraria nele como paga sem ter sido paga. Acerte com o financeiro antes.`);
    }
    const nowIso = agora.toISOString();
    tx.set(commRef, {
      indication_id: indId,
      external_seller_uid: r.uid,
      external_seller_name: r.nomeParceiro,
      value: r.calc.valor,
      base_value_used: r.calc.base,
      gross_commissionable_value: r.calc.baseBruta,
      discount_applied: r.calc.desconto,
      discount_percentage: r.calc.descontoPct,
      rate_applied: r.calc.taxa,
      status: "waiting_nf",
      month: r.mes.month,
      year: r.mes.year,
      sale_date: ind.sale_date || null,
      created_at: nowIso,
      generated_by: opcoes.geradoPor || "diagnostico_admin",
      generated_by_uid: autor.uid
    });
    tx.update(indRef, {
      commission_value: r.calc.valor,
      commission_rate_applied: r.calc.taxa,
      commissionable_value: r.calc.base,
      discount_amount: r.calc.desconto,
      discount_percentage: r.calc.descontoPct,
      updated_at: nowIso,
      // mesmo aviso ao financeiro do faturamento: sai 2 dias depois, se ainda não saiu
      ...ind.finance_notice_sent_at || opcoes.semAvisoFinanceiro ? {} : { finance_notice_pending: true, finance_notice_due_at: new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1e3).toISOString() },
      negotiation_history: arrayUnion({
        id: idHist(),
        type: "status_change",
        author_name: autor.nome || "Administrador",
        created_at: nowIso,
        content: `${opcoes.textoHistorico || "COMISS\xC3O LAN\xC7ADA PELO DIAGN\xD3STICO"}: a venda estava faturada sem comiss\xE3o. Comiss\xE3o de ${brl(r.calc.valor)} sobre a base comission\xE1vel de ${brl(r.calc.base)}` + (r.calc.desconto > 0 ? `, j\xE1 com o desconto de ${brl(r.calc.desconto)} abatido` : "") + `, para pagamento em ${String(r.mes.month).padStart(2, "0")}/${r.mes.year}.`,
        attachments: []
      })
    });
    return { ok: true, valor: r.calc.valor, base: r.calc.base, month: r.mes.month, year: r.mes.year, parceiro: r.nomeParceiro };
  });
}
async function ligarParceiro(deps, indId, uid, autor) {
  const { db: db2, arrayUnion } = deps;
  const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  exigirId(indId);
  if (!uid) throw erro(400, "Escolha o parceiro.");
  const indRef = db2.collection("indications").doc(indId);
  return db2.runTransaction(async (tx) => {
    const s = await tx.get(indRef);
    if (!s.exists) throw erro(404, "Indica\xE7\xE3o n\xE3o encontrada.");
    const u = await tx.get(db2.collection("users").doc(uid));
    if (!u.exists) throw erro(404, "Usu\xE1rio n\xE3o encontrado.");
    const comms = await tx.get(db2.collection("commissions").where("indication_id", "==", indId));
    const ind = s.data() || {};
    const user = u.data() || {};
    if (!papelComissionavel(user.role)) throw erro(409, `${user.name || "Este usu\xE1rio"} \xE9 da equipe Roder e n\xE3o recebe comiss\xE3o. Escolha o parceiro indicador.`);
    const novoUid = String(user.uid || u.id || uid);
    const outra = comms.docs.find((c) => (c.data() || {}).external_seller_uid !== novoUid);
    if (outra) throw erro(409, `J\xE1 existe comiss\xE3o lan\xE7ada para esta venda em nome de ${(outra.data() || {}).external_seller_name || "outro c\xF3digo"}. Use "Trocar Indicador" na tela de Indica\xE7\xF5es para levar a indica\xE7\xE3o e a comiss\xE3o juntas.`);
    const nowIso = agora.toISOString();
    const antes = ind.external_seller_name || ind.external_seller_uid || "ningu\xE9m";
    tx.update(indRef, {
      external_seller_uid: novoUid,
      external_seller_name: user.name || ind.external_seller_name || "Parceiro",
      external_seller_email: String(user.email || "").toLowerCase(),
      updated_at: nowIso,
      negotiation_history: arrayUnion({
        id: idHist(),
        type: "system",
        author_name: autor.nome || "Administrador",
        created_at: nowIso,
        content: `Parceiro indicador ligado pelo diagn\xF3stico de comiss\xE3o: antes ${antes}, agora ${user.name || novoUid}.`,
        attachments: []
      })
    });
    return { ok: true, uid: novoUid, nome: user.name || "" };
  });
}
var ROTULO_STATUS_COMISSAO = { waiting_payment: "aguardando pagamento (nota fiscal j\xE1 enviada)", paid: "paga" };
var fechamentoTravado = (st) => !!st && (st.status === "paid" || st.status === "waiting_payment");
var rotuloFechamento = (st) => st?.status === "paid" ? "pago" : "aguardando pagamento";
var mmaa = (m, a) => `${String(m).padStart(2, "0")}/${a}`;
async function transferirIndicacao(deps, indId, uid, autor, origem = "diagn\xF3stico de comiss\xE3o", opcoes = {}) {
  const { db: db2, arrayUnion } = deps;
  const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  exigirId(indId);
  if (!uid) throw erro(400, "Escolha a conta para onde a venda vai.");
  const indRef = db2.collection("indications").doc(indId);
  return db2.runTransaction(async (tx) => {
    const s = await tx.get(indRef);
    if (!s.exists) throw erro(404, "Indica\xE7\xE3o n\xE3o encontrada.");
    const u = await tx.get(db2.collection("users").doc(uid));
    const user = u.exists ? u.data() || {} : null;
    const ind = s.data() || {};
    if (opcoes.uidEsperado !== void 0 && String(ind.external_seller_uid || "") !== opcoes.uidEsperado) {
      throw erro(409, "O parceiro desta indica\xE7\xE3o mudou enquanto a corre\xE7\xE3o rodava. Nada foi alterado; a pr\xF3xima rodada confere de novo.");
    }
    const comms = (await tx.get(db2.collection("commissions").where("indication_id", "==", indId))).docs;
    const livre = !!opcoes.semComissaoQualquerDestino && !comms.length;
    const nomeInformado = String(opcoes.nomeInformado || "").trim();
    if (!user && !(livre && nomeInformado)) throw erro(404, "Usu\xE1rio n\xE3o encontrado.");
    if (!livre && !papelComissionavel(user.role)) {
      throw erro(409, `${user.name || "Este usu\xE1rio"} \xE9 da equipe Roder e n\xE3o recebe comiss\xE3o.` + (opcoes.semComissaoQualquerDestino ? " Esta venda j\xE1 tem comiss\xE3o lan\xE7ada: ela s\xF3 pode ir para um parceiro que recebe comiss\xE3o. Acerte a comiss\xE3o no Diagn\xF3stico de comiss\xE3o (Configura\xE7\xF5es) antes." : " Escolha o parceiro indicador."));
    }
    const novoUid = user ? String(user.uid || u.id || uid) : uid;
    const fechamentos = /* @__PURE__ */ new Map();
    const destinos = /* @__PURE__ */ new Map();
    for (const c of comms) {
      const cd = c.data() || {};
      if (cd.status === "paid" || cd.status === "waiting_payment") {
        throw erro(409, `A comiss\xE3o desta venda j\xE1 est\xE1 ${ROTULO_STATUS_COMISSAO[cd.status]} na conta ${cd.external_seller_name || cd.external_seller_uid}. N\xE3o d\xE1 para transferir: a nota fiscal e o pagamento s\xE3o dessa conta. Acerte com o financeiro antes.`);
      }
      const lidos = [];
      if (cd.external_seller_uid && cd.month && cd.year) {
        const f = await tx.get(db2.collection("monthly_statements").doc(`${cd.external_seller_uid}_${cd.month}_${cd.year}`));
        if (f.exists) lidos.push(f);
      }
      const q = await tx.get(db2.collection("monthly_statements").where("commission_ids", "array-contains", c.id));
      lidos.push(...q.docs);
      for (const f of lidos) {
        const fd = f.data() || {};
        const lista = fd.commission_ids || [];
        const contem = lista.includes(c.id);
        const doMesmoMes = fd.seller_uid === cd.external_seller_uid && fd.month === cd.month && fd.year === cd.year;
        if ((contem || doMesmoMes) && fechamentoTravado(fd)) {
          throw erro(409, `A comiss\xE3o desta venda est\xE1 no fechamento de ${mmaa(fd.month, fd.year)} da conta ${fd.seller_name || fd.seller_uid}, que est\xE1 ${rotuloFechamento(fd)}. N\xE3o d\xE1 para transferir: a nota fiscal e o pagamento s\xE3o dessa conta. Acerte com o financeiro antes.`);
        }
        if (contem || doMesmoMes && !lista.length) {
          const atual = fechamentos.get(f.id) || { ref: f.ref, data: fd, tirar: [] };
          if (!atual.tirar.some((t) => t.id === c.id)) atual.tirar.push({ id: c.id, valor: Number(cd.value) || 0 });
          fechamentos.set(f.id, atual);
        }
      }
      if (cd.external_seller_uid !== novoUid && cd.month && cd.year) {
        const idDestino = `${novoUid}_${cd.month}_${cd.year}`;
        if (!destinos.has(idDestino)) {
          const d = await tx.get(db2.collection("monthly_statements").doc(idDestino));
          destinos.set(idDestino, d.exists ? d.data() || {} : null);
        }
        const dd = destinos.get(idDestino);
        if (fechamentoTravado(dd)) {
          throw erro(409, `O fechamento de ${mmaa(cd.month, cd.year)} da conta ${dd.seller_name || user && user.name || novoUid} j\xE1 est\xE1 ${rotuloFechamento(dd)}. A comiss\xE3o desta venda entraria nele como paga sem ter sido paga. Acerte com o financeiro antes.`);
        }
      }
    }
    const jaNaConta = String(ind.external_seller_uid || "") === novoUid && comms.every((c) => (c.data() || {}).external_seller_uid === novoUid);
    if (jaNaConta) throw erro(409, `A venda e as comiss\xF5es j\xE1 est\xE3o na conta ${user && user.name || nomeInformado || novoUid}. Nada foi alterado.`);
    const nowIso = agora.toISOString();
    const nome = user && user.name || nomeInformado || ind.external_seller_name || "Parceiro";
    const email = user ? String(user.email || "").toLowerCase() : "";
    const antes = ind.external_seller_name || ind.external_seller_uid || "ningu\xE9m";
    const antesUid = ind.external_seller_uid || null;
    let somaComissoes = 0;
    for (const c of comms) {
      const cd = c.data() || {};
      somaComissoes += Number(cd.value) || 0;
      if (cd.external_seller_uid === novoUid) continue;
      tx.update(c.ref, {
        external_seller_uid: novoUid,
        external_seller_name: nome,
        ..."external_seller_email" in cd ? { external_seller_email: email } : {},
        transferred_from_uid: cd.external_seller_uid || null,
        transferred_at: nowIso,
        updated_at: nowIso,
        // a marca do primeiro acesso (moverComissoesDoProvisorio) sai quando a comissão chega
        ...cd.transferencia_pendente ? { transferencia_pendente: null } : {}
      });
    }
    for (const [, f] of fechamentos) {
      const ids = new Set(f.tirar.map((t) => t.id));
      const menos = f.tirar.reduce((a, t) => a + t.valor, 0);
      const restantes = (f.data.commission_ids || []).filter((x) => !ids.has(x));
      const total = Math.max(0, Math.round(((Number(f.data.total_value) || 0) - menos) * 100) / 100);
      if (!restantes.length && total <= 0 && !f.data.nf_url) tx.delete(f.ref);
      else tx.update(f.ref, { commission_ids: restantes, total_value: total, updated_at: nowIso });
    }
    tx.update(indRef, {
      external_seller_uid: novoUid,
      external_seller_name: nome,
      external_seller_email: email,
      updated_at: nowIso,
      negotiation_history: arrayUnion({
        id: idHist(),
        type: "system",
        author_name: autor.nome || "Administrador",
        created_at: nowIso,
        content: (antesUid === novoUid ? `Comiss\xE3o levada para ${nome} (${novoUid}) pela ${origem}: ela estava em outro c\xF3digo, e quem recebe \xE9 o parceiro da indica\xE7\xE3o.` : `Venda transferida pelo ${origem}: antes ${antes}${antesUid ? ` (${antesUid})` : ""}, agora ${nome} (${novoUid}).`) + (comms.length ? ` ${comms.length === 1 ? "A comiss\xE3o de" : `As ${comms.length} comiss\xF5es, somando`} ${brl(somaComissoes)} ${comms.length === 1 ? "foi junto" : "foram juntas"}.` : ""),
        attachments: []
      })
    });
    return { ok: true, uid: novoUid, nome, comissoes: comms.length };
  });
}
function loteEmPartes(db2, limite = 450) {
  const ops = [];
  return {
    set: (r, v, o) => {
      ops.push((b) => o ? b.set(r, v, o) : b.set(r, v));
    },
    update: (r, v) => {
      ops.push((b) => b.update(r, v));
    },
    delete: (r) => {
      ops.push((b) => b.delete(r));
    },
    get tamanho() {
      return ops.length;
    },
    commit: async () => {
      for (let i = 0; i < ops.length; i += limite) {
        const b = db2.batch();
        ops.slice(i, i + limite).forEach((op) => op(b));
        await b.commit();
      }
    }
  };
}
var PESO_STATUS = { paid: 3, waiting_payment: 2, waiting_nf: 1 };
async function moverComissoesDoProvisorio(db2, lote, deUids, paraUid, agoraIso, paraNome) {
  const origens = Array.from(new Set((Array.isArray(deUids) ? deUids : [deUids]).filter((d) => d && d !== paraUid)));
  const resultado = { comissoes: 0, fechamentos: 0, presos: [] };
  if (!paraUid || !origens.length) return resultado;
  const grupos = /* @__PURE__ */ new Map();
  const comissoes = [];
  for (const de of origens) {
    const cs = await db2.collection("commissions").where("external_seller_uid", "==", de).get();
    cs.docs.forEach((c) => comissoes.push({ de, ref: c.ref, data: c.data() || {} }));
    const extratos = await db2.collection("monthly_statements").where("seller_uid", "==", de).get();
    for (const e of extratos.docs) {
      const d = e.data() || {};
      const novoId = e.id.includes(de) ? e.id.split(de).join(paraUid) : e.id;
      if (novoId === e.id) {
        lote.update(e.ref, { seller_uid: paraUid, updated_at: agoraIso });
        resultado.fechamentos++;
        continue;
      }
      let g = grupos.get(novoId);
      if (!g) {
        const ja = await db2.collection("monthly_statements").doc(novoId).get();
        g = { destino: ja.exists ? { ref: ja.ref, data: ja.data() || {} } : null, fontes: [] };
        grupos.set(novoId, g);
      }
      g.fontes.push({ de, ref: e.ref, data: d });
    }
  }
  const presos = /* @__PURE__ */ new Set();
  const destinoTravado = /* @__PURE__ */ new Set();
  const chave = (de, m, a) => `${de}|${m}|${a}`;
  for (const [novoId, g] of grupos) {
    const fontes = [...g.fontes].sort((x, y) => (PESO_STATUS[y.data.status] || 0) - (PESO_STATUS[x.data.status] || 0));
    let base = g.destino ? { ...g.destino.data } : null;
    const juntadas = [];
    for (const f of fontes) {
      if (!base) {
        base = { ...f.data, ..."id" in f.data ? { id: novoId } : {}, seller_uid: paraUid };
        juntadas.push(f);
        continue;
      }
      if (fechamentoTravado(base) || fechamentoTravado(f.data)) {
        presos.add(chave(f.de, f.data.month, f.data.year));
        resultado.presos.push(f.ref.id);
        console.warn(`[AUTH] Fechamento ${f.ref.id} N\xC3O foi juntado a ${novoId}: um dos dois j\xE1 est\xE1 pago ou aguardando pagamento. Ficou no c\xF3digo provis\xF3rio ${f.de}, com as comiss\xF5es do m\xEAs. Acerte no Diagn\xF3stico de comiss\xE3o.`);
        continue;
      }
      const st = (PESO_STATUS[f.data.status] || 0) > (PESO_STATUS[base.status] || 0) ? f.data.status : base.status;
      base = {
        ...base,
        commission_ids: Array.from(/* @__PURE__ */ new Set([...base.commission_ids || [], ...f.data.commission_ids || []])),
        total_value: Math.round(((Number(base.total_value) || 0) + (Number(f.data.total_value) || 0)) * 100) / 100,
        nf_url: base.nf_url || f.data.nf_url || null,
        ...st !== void 0 ? { status: st } : {}
      };
      juntadas.push(f);
    }
    if (g.destino && !juntadas.length && fechamentoTravado(g.destino.data)) destinoTravado.add(novoId);
    if (!juntadas.length) continue;
    const novoRef = g.destino ? g.destino.ref : db2.collection("monthly_statements").doc(novoId);
    lote.set(novoRef, { ...base, updated_at: agoraIso });
    juntadas.forEach((f) => {
      lote.delete(f.ref);
      resultado.fechamentos++;
    });
  }
  for (const c of comissoes) {
    const { month, year } = c.data;
    let travadoNoDestino = false;
    if (month && year && !grupos.has(`${paraUid}_${month}_${year}`)) {
      const d = await db2.collection("monthly_statements").doc(`${paraUid}_${month}_${year}`).get();
      travadoNoDestino = d.exists && fechamentoTravado(d.data());
    }
    if (month && year && (presos.has(chave(c.de, month, year)) || destinoTravado.has(`${paraUid}_${month}_${year}`) || travadoNoDestino)) {
      lote.update(c.ref, { transferencia_pendente: { para_uid: paraUid, motivo: `fechamento de ${mmaa(month, year)} j\xE1 pago ou aguardando pagamento`, em: agoraIso } });
      console.warn(`[AUTH] Comiss\xE3o ${c.ref.id} ficou no c\xF3digo provis\xF3rio ${c.de}: o fechamento de ${mmaa(month, year)} n\xE3o p\xF4de ser juntado. Acerte no Diagn\xF3stico de comiss\xE3o.`);
      continue;
    }
    lote.update(c.ref, { external_seller_uid: paraUid, ...paraNome ? { external_seller_name: paraNome } : {}, updated_at: agoraIso });
    resultado.comissoes++;
  }
  return resultado;
}
function registrarDiagnosticoComissao(app, deps) {
  const responderErro = (res, e) => res.status(e?.status || 500).json({ ok: false, error: e?.message || "Erro." });
  const nomeDe2 = async (q) => {
    try {
      return String((await deps.db.collection("users").doc(q.uid).get()).data()?.name || q.email || "Administrador");
    } catch {
      return "Administrador";
    }
  };
  app.get("/api/admin/diagnostico-comissao", async (req, res) => {
    if (!await deps.exigirAdmin(req, res)) return;
    try {
      return res.json(await diagnosticar(deps, String(req.query?.parceiro || ""), { conta: String(req.query?.conta || "") || void 0 }));
    } catch (e) {
      return responderErro(res, e);
    }
  });
  app.post("/api/admin/diagnostico-comissao/previa", async (req, res) => {
    if (!await deps.exigirAdmin(req, res)) return;
    try {
      return res.json(await previaGeracao(deps, String(req.body?.indicacaoId || ""), req.body?.desconto));
    } catch (e) {
      return responderErro(res, e);
    }
  });
  app.post("/api/admin/diagnostico-comissao/gerar", async (req, res) => {
    const q = await deps.exigirAdmin(req, res);
    if (!q) return;
    try {
      return res.json(await gerarComissao(deps, String(req.body?.indicacaoId || ""), { uid: q.uid, nome: await nomeDe2(q) }, req.body?.desconto));
    } catch (e) {
      return responderErro(res, e);
    }
  });
  app.post("/api/admin/diagnostico-comissao/ligar", async (req, res) => {
    const q = await deps.exigirAdmin(req, res);
    if (!q) return;
    try {
      return res.json(await ligarParceiro(deps, String(req.body?.indicacaoId || ""), String(req.body?.uid || ""), { uid: q.uid, nome: await nomeDe2(q) }));
    } catch (e) {
      return responderErro(res, e);
    }
  });
  app.post("/api/indicacoes/trocar-indicador", async (req, res) => {
    const exigir = deps.exigirGestao || deps.exigirAdmin;
    const q = await exigir(req, res);
    if (!q) return;
    try {
      return res.json(await transferirIndicacao(
        deps,
        String(req.body?.indicacaoId || ""),
        String(req.body?.uid || ""),
        { uid: q.uid, nome: await nomeDe2(q) },
        "Trocar Indicador",
        { semComissaoQualquerDestino: true, nomeInformado: String(req.body?.nome || "") }
      ));
    } catch (e) {
      return responderErro(res, e);
    }
  });
}

// server/conciliacaoComissao.ts
var import_node_crypto2 = require("node:crypto");
var DOC_TRAVA2 = "conciliacao_comissao_rodando";
var DOC_RESULTADO = "conciliacao_comissao_resultado";
var TRAVA_VELHA_MS = 30 * 60 * 1e3;
var DIAS_PARA_GERAR = 90;
var MINUTOS_SEM_MEXER = 30;
var MAX_HISTORICO = 100;
var MAX_TRAVADAS = 200;
var MAX_CRIADAS_POR_RODADA = 20;
var MAX_LISTA_NO_DOC = 200;
var MAX_TEXTO_NO_DOC = 400;
var AUTOR = { uid: "sistema", nome: "Corre\xE7\xE3o autom\xE1tica" };
var ORIGEM = "corre\xE7\xE3o autom\xE1tica de comiss\xE3o";
var brl2 = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
var ehProvisorio = (id) => /^(temp_|phone_)/.test(id);
var statusQueRecebe = (st) => !st || st === "active" || st === "pending";
var papelQueRecebe = (role) => !role || role === "external_seller";
var recebe = (u) => !!u && papelQueRecebe(u.role) && statusQueRecebe(u.status);
var UID_SINTETICO_DA_EQUIPE = /_manager_direct$/;
var travadoPorStatus = (st) => st === "paid" || st === "waiting_payment";
var CAMPOS_COMISSAO = ["indication_id", "external_seller_uid", "external_seller_name", "value", "status", "transferencia_pendente", "created_at", "sale_date", "month", "year"];
var nomeDe = (u) => u?.name || "Parceiro";
var ultimos9 = (t) => String(t || "").replace(/\D/g, "").slice(-9);
async function conciliarComissoes(deps, origem = "di\xE1ria") {
  const { db: db2 } = deps;
  const log = deps.log || console.log;
  const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  const res = { rodada_em: agora.toISOString(), terminou_em: "", origem, movidas: [], criadas: [], travadas: [], travadas_total: 0, erros: [], adiadas: [] };
  const todasTravadas = [];
  let quandoAtual = "";
  const travar = (t, quando) => {
    const o = Date.parse(String(quando || quandoAtual || ""));
    todasTravadas.push({ t, ordem: Number.isFinite(o) ? o : 0 });
  };
  const usersSnap = await db2.collection("users").get();
  const porId = /* @__PURE__ */ new Map();
  const porUidCampo = /* @__PURE__ */ new Map();
  usersSnap.docs.forEach((d) => {
    const u = { ...d.data() || {}, doc_id: d.id };
    porId.set(d.id, u);
    if (u.uid) porUidCampo.set(String(u.uid), u);
  });
  const usuario = (uid) => porId.get(uid) || porUidCampo.get(uid) || null;
  const definitivas = Array.from(porId.values()).filter((u) => !ehProvisorio(u.doc_id) && recebe(u));
  const unica = (lista) => lista.length === 1 ? lista[0] : null;
  const porEmail = (e) => e ? unica(definitivas.filter((u) => String(u.email || "").toLowerCase().trim() === e)) : null;
  const porNome = (n) => n ? unica(definitivas.filter((u) => normalizar(u.name) === n)) : null;
  const indSnap = await db2.collection("indications").select("status", "client_name", "external_seller_uid", "external_seller_name", "external_seller_email", "sale_date", "updated_at", "commissioned_products", "discount_amount", "delivery_date", "commission_rate_applied", "estornado_em", "commission_value").get();
  const indicacoes = /* @__PURE__ */ new Map();
  indSnap.docs.forEach((d) => indicacoes.set(d.id, d.data() || {}));
  const commSnap = await db2.collection("commissions").select(...CAMPOS_COMISSAO).get();
  const comissoesPorInd = /* @__PURE__ */ new Map();
  const semIndicacaoId = [];
  for (const c of commSnap.docs) {
    const cd = c.data() || {};
    const indId = String(cd.indication_id || "");
    if (!indId || !indicacoes.has(indId)) semIndicacaoId.push({ ...cd, _indicacao_apagada: !!indId });
    if (!indId || !indicacoes.has(indId)) {
      const u = cd.external_seller_uid ? usuario(String(cd.external_seller_uid)) : null;
      if (!u && !travadoPorStatus(cd.status)) travar({ indicacao_id: indId || null, cliente: "", parceiro: cd.external_seller_name || cd.external_seller_uid || "-", motivo: `Comiss\xE3o ${c.id} de ${brl2(Number(cd.value) || 0)} sem indica\xE7\xE3o e num c\xF3digo que n\xE3o existe mais no cadastro.` }, cd.created_at);
      continue;
    }
    if (!comissoesPorInd.has(indId)) comissoesPorInd.set(indId, []);
    comissoesPorInd.get(indId).push({ id: c.id, ref: c.ref, ...cd });
  }
  const fechamentoTravado2 = async (uid, m, a) => {
    if (!uid || !m || !a) return null;
    const f = await db2.collection("monthly_statements").doc(`${uid}_${m}_${a}`).get();
    const fd = f.exists ? f.data() || {} : null;
    return fd && travadoPorStatus(fd.status) ? fd : null;
  };
  let ultimaRenovacao = Date.now();
  for (const [indId, ind] of indicacoes) {
    if (deps.renovarTrava && Date.now() - ultimaRenovacao > 6e4) {
      ultimaRenovacao = Date.now();
      try {
        await deps.renovarTrava();
      } catch {
      }
    }
    const comms = comissoesPorInd.get(indId) || [];
    const uidInd = String(ind.external_seller_uid || "");
    const cliente2 = String(ind.client_name || "");
    quandoAtual = ind.updated_at || ind.sale_date;
    if (!uidInd || UIDS_DE_SISTEMA.includes(uidInd)) continue;
    if (ind.status !== "sold") continue;
    if (UID_SINTETICO_DA_EQUIPE.test(uidInd)) continue;
    let atual = usuario(uidInd);
    let destino = atual;
    let motivo = "a comiss\xE3o estava em outro c\xF3digo, e quem recebe \xE9 o parceiro da indica\xE7\xE3o";
    if (!atual || ehProvisorio(atual.doc_id)) {
      let achada = null;
      let porEmailOuNome = "e-mail";
      if (atual) {
        const email = String(atual.email || "").toLowerCase().trim();
        achada = porEmail(email);
        if (!achada && !email) {
          const pelaNomeUnica = porNome(normalizar(atual.name));
          if (pelaNomeUnica) {
            if (ultimos9(atual.phone) && ultimos9(atual.phone) === ultimos9(pelaNomeUnica.phone)) {
              achada = pelaNomeUnica;
              porEmailOuNome = "nome";
            } else {
              travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDe(atual), motivo: `A venda est\xE1 num cadastro provis\xF3rio (${atual.doc_id}) e s\xF3 o nome bate com a conta ${pelaNomeUnica.doc_id} (sem e-mail e sem telefone em comum). Nome igual pode ser outra pessoa. Use "Trocar Indicador" para confirmar.` });
              continue;
            }
          }
        }
      } else {
        const email = String(ind.external_seller_email || "").toLowerCase().trim();
        const nomeInd = normalizar(ind.external_seller_name);
        const candidata = porEmail(email);
        if (candidata) {
          const nomeConta = normalizar(candidata.name);
          if (nomeConta && nomeInd && (nomeConta === nomeInd || nomeContido(nomeConta, nomeInd))) achada = candidata;
          else travar({ indicacao_id: indId, cliente: cliente2, parceiro: ind.external_seller_name || uidInd, motivo: `A venda est\xE1 ligada a um c\xF3digo que n\xE3o existe mais, e o e-mail ${email} da indica\xE7\xE3o \xE9 de ${candidata.name || "outra conta"}, com nome diferente de ${ind.external_seller_name || "o da indica\xE7\xE3o"}. Pode ser o e-mail de um parceiro anterior. Use "Trocar Indicador" na tela de Indica\xE7\xF5es.` });
          if (!achada) continue;
        } else if (!email) {
          const pelaNomeUnica = porNome(nomeInd);
          if (pelaNomeUnica) {
            travar({ indicacao_id: indId, cliente: cliente2, parceiro: ind.external_seller_name || uidInd, motivo: `A venda est\xE1 ligada a um c\xF3digo que n\xE3o existe mais, e s\xF3 o nome bate com a conta ${pelaNomeUnica.doc_id} (a indica\xE7\xE3o n\xE3o tem e-mail nem telefone para confirmar). Nome igual pode ser outra pessoa. Use "Trocar Indicador" para confirmar.` });
            continue;
          }
        }
      }
      if (achada) {
        destino = achada;
        motivo = `a venda estava num cadastro ${atual ? "provis\xF3rio" : "apagado"} e foi para a conta definitiva com o mesmo ${porEmailOuNome}`;
      } else if (!atual) {
        const email = String(ind.external_seller_email || "").trim();
        const porque = email ? `O e-mail ${email} da indica\xE7\xE3o n\xE3o est\xE1 em nenhuma conta (ou est\xE1 em mais de uma), e o nome n\xE3o \xE9 usado quando h\xE1 e-mail, para n\xE3o levar a venda a um hom\xF4nimo.` : "N\xE3o h\xE1 uma conta s\xF3 com o mesmo nome (zero contas ou mais de uma).";
        travar({ indicacao_id: indId, cliente: cliente2, parceiro: ind.external_seller_name || uidInd, motivo: `A venda est\xE1 ligada a um c\xF3digo que n\xE3o existe mais. ${porque} Use "Trocar Indicador" na tela de Indica\xE7\xF5es.` });
        continue;
      }
    }
    const destUid = String(destino.uid || destino.doc_id);
    const nomeDest = destino.name || ind.external_seller_name || "Parceiro";
    const fora = comms.filter((c) => c.external_seller_uid !== destUid);
    let mexiAgora = false;
    if (uidInd !== destUid || fora.length) {
      if (ehProvisorio(destino.doc_id)) {
        if (fora.length) travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: `A venda est\xE1 num cadastro provis\xF3rio (${destino.doc_id}) que n\xE3o achou conta definitiva \xFAnica, mas a comiss\xE3o est\xE1 em outra conta (${fora[0].external_seller_name || fora[0].external_seller_uid}). N\xE3o foi mexida: lev\xE1-la para um provis\xF3rio faria o dinheiro sumir do painel do parceiro. Use "Trocar Indicador" e escolha a conta certa.` });
        continue;
      }
      if (!recebe(destino)) {
        if (fora.length) travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: `A comiss\xE3o est\xE1 em outro c\xF3digo, mas ${nomeDest} ${papelQueRecebe(destino.role) ? `est\xE1 com o cadastro ${destino.status}` : "\xE9 da equipe Roder"} e n\xE3o recebe comiss\xE3o.` });
        continue;
      }
      const presa = comms.find((c) => travadoPorStatus(c.status));
      if (presa) {
        travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: `A comiss\xE3o de ${brl2(Number(presa.value) || 0)} j\xE1 est\xE1 ${presa.status === "paid" ? "paga" : "aguardando pagamento"} na conta ${presa.external_seller_name || presa.external_seller_uid}. N\xE3o foi mexida: a nota fiscal e o pagamento s\xE3o dessa conta. Acerte com o financeiro.` });
        continue;
      }
      try {
        await transferirIndicacao(deps, indId, destino.doc_id, AUTOR, ORIGEM, { uidEsperado: uidInd });
        const valor = Math.round(fora.reduce((a, c) => a + (Number(c.value) || 0), 0) * 100) / 100;
        const de = fora[0]?.external_seller_uid || uidInd;
        const deNome = fora[0]?.external_seller_name || atual && atual.name || ind.external_seller_name || null;
        res.movidas.push({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, de_uid: de || null, de_nome: deNome, para_uid: destUid, comissoes: fora.length, valor, motivo });
        log(`[CORRECAO-COMISSAO] ${cliente2 || indId}: ${fora.length} comiss\xE3o(\xF5es) de ${brl2(valor)} de ${deNome || de} (${de}) para ${nomeDest} (${destUid}); ${motivo}.`);
        comms.forEach((c) => {
          c.external_seller_uid = destUid;
          c.transferencia_pendente = null;
        });
        mexiAgora = true;
      } catch (e) {
        if (e?.status === 409) travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: e.message });
        else res.erros.push(`${cliente2 || indId}: ${e?.message || e}`);
        continue;
      }
    }
    for (const c of comms) {
      if (c.transferencia_pendente && c.external_seller_uid === destUid) {
        try {
          await c.ref.update({ transferencia_pendente: null, updated_at: agora.toISOString() });
        } catch (e) {
          res.erros.push(`${cliente2 || indId}: n\xE3o limpei a marca de primeiro acesso: ${e?.message || e}`);
        }
      }
    }
    if (comms.length && comms.every((c) => c.external_seller_uid === destUid)) {
      const emailD = String(destino.email || "").toLowerCase().trim();
      const nomeD = normalizar(destino.name);
      const repetida = definitivas.find((u) => u.doc_id !== destino.doc_id && (emailD && String(u.email || "").toLowerCase().trim() === emailD || nomeD && normalizar(u.name) === nomeD));
      if (repetida) travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: `${nomeDest} tem duas contas (${destino.doc_id} e ${repetida.doc_id}, mesmo e-mail ou nome). A venda e a comiss\xE3o est\xE3o em ${destino.doc_id}. Se ele entra pela outra, o painel mostra R$ 0,00: confirme com ele a conta certa e use "Trocar Indicador".` });
    }
    if (ind.status !== "sold" || comms.length || !recebe(destino)) continue;
    let noHistorico = false;
    try {
      const f = await db2.collection("indications").doc(indId).get();
      noHistorico = temEstornoNoHistorico(f.exists ? f.data() : null);
    } catch (e) {
      res.erros.push(`${cliente2 || indId}: n\xE3o consegui ler o hist\xF3rico: ${e?.message || e}`);
      continue;
    }
    if (temMarcaDeEstorno(ind) || noHistorico) {
      travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: noHistorico ? "Venda faturada sem comiss\xE3o, mas esta indica\xE7\xE3o j\xE1 foi estornada antes e a comiss\xE3o foi apagada de prop\xF3sito. N\xE3o \xE9 lan\xE7ada sozinha. Se for devida, gere pelo Diagn\xF3stico de comiss\xE3o." : "Estorno incompleto: o estorno foi come\xE7ado (a comiss\xE3o pode ter sido apagada) mas a venda continua faturada. Refa\xE7a o estorno na tela de Indica\xE7\xF5es. N\xE3o \xE9 lan\xE7ada comiss\xE3o sozinha." });
      continue;
    }
    const dataVenda = Date.parse(String(ind.sale_date || "").slice(0, 10) + "T12:00:00-03:00");
    const dias = Number.isFinite(dataVenda) ? (agora.getTime() - dataVenda) / 864e5 : Infinity;
    if (dias > DIAS_PARA_GERAR) {
      travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: `Venda faturada sem comiss\xE3o, com pedido de ${ind.sale_date ? String(ind.sale_date).slice(0, 10).split("-").reverse().join("/") : "data desconhecida"}: antiga demais para lan\xE7ar sozinha (mais de ${DIAS_PARA_GERAR} dias). Se a comiss\xE3o \xE9 devida, gere pelo Diagn\xF3stico de comiss\xE3o.` });
      continue;
    }
    if (!(Number(ind.commission_rate_applied) > 0) || typeof ind.discount_amount !== "number") {
      travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: "Venda faturada sem comiss\xE3o, e o faturamento n\xE3o gravou taxa de comiss\xE3o e desconto (foi faturada sem parceiro, ou o desconto \xE9 desconhecido). N\xE3o \xE9 lan\xE7ada sozinha, para n\xE3o pagar a mais. Confira o desconto e gere pelo Diagn\xF3stico de comiss\xE3o." });
      continue;
    }
    const calc = calcularComissao(ind.commissioned_products || [], ind.discount_amount, Number(ind.commission_rate_applied));
    if (calc.valor <= 0) {
      travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: "Venda faturada sem comiss\xE3o, e os produtos da indica\xE7\xE3o n\xE3o d\xE3o base de comiss\xE3o (sem produto ou s\xF3 kit, frete e instala\xE7\xE3o). Vincule os produtos vendidos." });
      continue;
    }
    if (typeof ind.commission_value === "number" && ind.commission_value > 0 && Math.abs(ind.commission_value - calc.valor) > 0.01) {
      travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: `valor recalculado difere do gravado no faturamento (recalculado ${brl2(calc.valor)}, gravado ${brl2(ind.commission_value)}). N\xE3o foi lan\xE7ada sozinha. Confira e gere pelo Diagn\xF3stico de comiss\xE3o.` });
      continue;
    }
    const mesDela = mesDaComissao(ind.delivery_date, agora);
    const diaVenda = String(ind.sale_date || "").slice(0, 10);
    const nomesDoParceiro = [normalizar(nomeDest), normalizar(ind.external_seller_name)].filter(Boolean);
    const parecida = semIndicacaoId.find((c) => {
      const doParceiro = [destUid, uidInd].includes(String(c.external_seller_uid || "")) || nomesDoParceiro.includes(normalizar(c.external_seller_name));
      const mesmoDia = !!diaVenda && String(c.sale_date || "").slice(0, 10) === diaVenda;
      const mesmoValor = Math.abs((Number(c.value) || 0) - calc.valor) < 0.01 && c.month === mesDela.month && c.year === mesDela.year;
      return doParceiro && (c._indicacao_apagada ? mesmoValor : mesmoDia || mesmoValor);
    });
    if (parecida) {
      travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: `Venda faturada sem comiss\xE3o ligada a ela, mas existe uma comiss\xE3o antiga sem v\xEDnculo com indica\xE7\xE3o (${brl2(Number(parecida.value) || 0)}, ${parecida.external_seller_name || parecida.external_seller_uid}) que pode ser desta venda. N\xE3o foi lan\xE7ada outra, para n\xE3o pagar duas vezes. Confira no Diagn\xF3stico de comiss\xE3o.` });
      continue;
    }
    const mexida = Date.parse(ind.updated_at || "");
    if (!mexiAgora && Number.isFinite(mexida) && agora.getTime() - mexida < MINUTOS_SEM_MEXER * 60 * 1e3) continue;
    const mes = mesDaComissao(ind.delivery_date, agora);
    let fechTravado = null;
    try {
      fechTravado = await fechamentoTravado2(destUid, mes.month, mes.year);
    } catch (e) {
      res.erros.push(`${cliente2 || indId}: n\xE3o consegui ler o fechamento: ${e?.message || e}`);
      continue;
    }
    if (fechTravado) {
      travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: `Venda faturada sem comiss\xE3o, mas o fechamento de ${String(mes.month).padStart(2, "0")}/${mes.year} de ${nomeDest} j\xE1 est\xE1 pago ou aguardando pagamento. Acerte com o financeiro.` });
      continue;
    }
    if (res.criadas.length >= MAX_CRIADAS_POR_RODADA) {
      res.adiadas.push({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest });
      continue;
    }
    try {
      const r = await gerarComissao(deps, indId, AUTOR, void 0, { geradoPor: "correcao_automatica", textoHistorico: "COMISS\xC3O LAN\xC7ADA PELA CORRE\xC7\xC3O AUTOM\xC1TICA", semAvisoFinanceiro: true, usarTaxaGravada: true, recusarEstornada: true });
      res.criadas.push({ indicacao_id: indId, cliente: cliente2, parceiro: r.parceiro, valor: r.valor, month: r.month, year: r.year });
      log(`[CORRECAO-COMISSAO] ${cliente2 || indId}: comiss\xE3o de ${brl2(r.valor)} lan\xE7ada para ${r.parceiro} (${destUid}), pagamento em ${String(r.month).padStart(2, "0")}/${r.year}.`);
    } catch (e) {
      if (e?.status === 409) travar({ indicacao_id: indId, cliente: cliente2, parceiro: nomeDest, motivo: e.message });
      else res.erros.push(`${cliente2 || indId}: ${e?.message || e}`);
    }
  }
  res.travadas_total = todasTravadas.length;
  res.travadas = todasTravadas.sort((a, b) => b.ordem - a.ordem).slice(0, MAX_TRAVADAS).map((x) => x.t);
  res.terminou_em = (deps.agora ? deps.agora() : /* @__PURE__ */ new Date()).toISOString();
  return res;
}
function paraDocumento(r) {
  const corta = (t) => typeof t === "string" && t.length > MAX_TEXTO_NO_DOC ? t.slice(0, MAX_TEXTO_NO_DOC) + "..." : t;
  const limita = (l) => l.slice(0, MAX_LISTA_NO_DOC).map((x) => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, corta(v)])));
  return {
    ...r,
    movidas: limita(r.movidas),
    criadas: limita(r.criadas),
    travadas: limita(r.travadas),
    erros: r.erros.slice(0, MAX_LISTA_NO_DOC).map(corta),
    adiadas: limita(r.adiadas),
    movidas_total: r.movidas.length,
    criadas_total: r.criadas.length,
    adiadas_total: r.adiadas.length,
    erros_total: r.erros.length
  };
}
async function conciliarComTrava(deps, origem) {
  const { db: db2 } = deps;
  const log = deps.log || console.log;
  const agora = () => deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  const trava = db2.collection("cron_locks").doc(DOC_TRAVA2);
  const dono = (0, import_node_crypto2.randomUUID)();
  const dados2 = (extra = {}) => ({ job: "conciliacao_comissao", origem, owner_id: dono, started_at: agora().toISOString(), ...extra });
  try {
    await trava.create(dados2());
  } catch (e) {
    if (e?.code !== 6) {
      console.error("[CORRECAO-COMISSAO] N\xE3o consegui criar a trava:", e?.message);
      return null;
    }
    const retomou = await db2.runTransaction(async (tx) => {
      const atual = await tx.get(trava);
      const t = atual.exists ? atual.data() || {} : {};
      const velha = !atual.exists || !t.started_at || agora().getTime() - new Date(t.started_at).getTime() > TRAVA_VELHA_MS;
      if (!velha) return false;
      tx.set(trava, dados2({ retomada: true }));
      return true;
    }).catch(() => false);
    if (!retomou) {
      log("[CORRECAO-COMISSAO] Outra rodada em andamento; esta foi pulada.");
      return null;
    }
  }
  try {
    const renovarTrava = async () => {
      await db2.runTransaction(async (tx) => {
        const atual = await tx.get(trava);
        if (atual.exists && (atual.data() || {}).owner_id === dono) tx.update(trava, { started_at: agora().toISOString() });
      });
    };
    const r = await conciliarComissoes({ ...deps, renovarTrava }, origem);
    const docRes = db2.collection("cron_locks").doc(DOC_RESULTADO);
    const antes = (await docRes.get()).data() || {};
    const novos = [
      ...r.movidas.slice(0, MAX_HISTORICO).map((m) => ({ tipo: "movida", em: r.rodada_em, ...m })),
      ...r.criadas.slice(0, MAX_HISTORICO).map((c) => ({ tipo: "criada", em: r.rodada_em, ...c }))
    ];
    const historico = [...novos, ...Array.isArray(antes.historico) ? antes.historico : []].slice(0, MAX_HISTORICO);
    await docRes.set({ ultima: paraDocumento(r), historico, atualizado_em: r.terminou_em });
    log(`[CORRECAO-COMISSAO] Rodada ${origem}: ${r.movidas.length} movida(s), ${r.criadas.length} criada(s), ${r.travadas.length} travada(s), ${r.adiadas.length} adiada(s), ${r.erros.length} erro(s).`);
    return r;
  } catch (e) {
    console.error("[CORRECAO-COMISSAO] Erro:", e?.message);
    return null;
  } finally {
    try {
      await db2.runTransaction(async (tx) => {
        const atual = await tx.get(trava);
        if (atual.exists && (atual.data() || {}).owner_id === dono) tx.delete(trava);
      });
    } catch {
    }
  }
}
async function lerCorrecoes(db2) {
  const d = await db2.collection("cron_locks").doc(DOC_RESULTADO).get();
  const x = d.exists ? d.data() || {} : {};
  return { ok: true, ultima: x.ultima || null, historico: Array.isArray(x.historico) ? x.historico : [] };
}
function registrarCorrecoesAutomaticas(app, deps) {
  app.get("/api/admin/diagnostico-comissao/correcoes", async (req, res) => {
    if (!await deps.exigirAdmin(req, res)) return;
    try {
      return res.json(await lerCorrecoes(deps.db));
    } catch (e) {
      return res.status(500).json({ ok: false, error: e?.message || "Erro." });
    }
  });
}

// server/emailsSempreLigados.ts
var CHAVES_SEMPRE_LIGADAS = [
  "monthly_report_partners",
  "monthly_report_directors",
  "payment_reminder_finance",
  "confirmation_partner",
  "status_change_partner",
  "commission_approved_partner"
];
async function garantirEmailsLigados(db2, agora = /* @__PURE__ */ new Date()) {
  try {
    const ref = db2.collection("settings").doc("notifications");
    const snap = await ref.get();
    const atual = (snap.exists ? snap.data() : {}) || {};
    const faltando = CHAVES_SEMPRE_LIGADAS.filter((k) => atual[k] !== true);
    if (!faltando.length) return "ja_ligados";
    const ligar = { updated_at: agora.toISOString() };
    for (const k of faltando) ligar[k] = true;
    await ref.set(ligar, { merge: true });
    console.log("[EMAILS-LIGADOS] Ligados de novo: " + faltando.join(", "));
    return "ajustado";
  } catch (e) {
    console.error("[EMAILS-LIGADOS] N\xE3o consegui conferir os avisos por e-mail:", e?.message);
    return "erro";
  }
}

// src/lib/crmIntegracao.ts
var CRM_URL_PADRAO = "https://roder-vision.lovable.app/api/public/hooks/crm-entrada";
var STATUS_ENVIAVEIS = ["pending", "triagem", "negotiating"];
var STATUS_DA_CARGA = [...STATUS_ENVIAVEIS, "sold"];
var STATUS_INDICA = {
  pending: "pendente",
  triagem: "triagem",
  negotiating: "em_negociacao",
  sold: "vendido",
  archived: "arquivado",
  cancelled: "cancelado"
};
var UIDS_SEM_PARCEIRO = ["client_referral", "direct_factory", "public_request", "anonymous"];
var temParceiroDeVerdade = (ind) => !!ind?.external_seller_uid && !UIDS_SEM_PARCEIRO.includes(String(ind.external_seller_uid));
var MAX_TENTATIVAS_ENVIO = 10;
var ATRASO_BASE_MS = 60 * 1e3;
var ATRASO_TETO_MS = 6 * 60 * 60 * 1e3;
var RESERVA_ENVIO_MS = 3 * 60 * 1e3;
function urlAceita(v) {
  try {
    const u = new URL(v);
    if (u.protocol === "https:") return true;
    return u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}
var dataValida2 = (v) => typeof v === "string" && !!v && !Number.isNaN(new Date(v).getTime());
function lerConfigCrm(env, settings) {
  const url = String(env.CRM_URL || "").trim() || CRM_URL_PADRAO;
  const desdeEnv = String(env.CRM_ATIVO_DESDE || "").trim();
  const desde = dataValida2(desdeEnv) ? new Date(desdeEnv).toISOString() : dataValida2(settings?.ativo_desde) ? new Date(String(settings.ativo_desde)).toISOString() : null;
  return {
    ativo: String(env.CRM_ATIVO || "").trim() === "1",
    url,
    chave: String(env.CRM_CHAVE || "").trim(),
    segredo: String(env.CRM_SEGREDO || ""),
    ativoDesde: desde,
    notificarEmail: String(env.CRM_NOTIFICAR_EMAIL || "").trim() || null,
    urlValida: urlAceita(url)
  };
}
var podeCargaAoCrm = (c) => !!c.chave && c.urlValida;
var podeEnviarAoCrm = (c) => c.ativo && !!c.chave && c.urlValida;
var podeReceberDoCrm = (c) => c.ativo && !!c.segredo;
function atrasoDaTentativa(tentativas) {
  const n = Math.max(1, Math.floor(tentativas) || 1);
  return Math.min(ATRASO_BASE_MS * 2 ** (n - 1), ATRASO_TETO_MS);
}
function planoDeFalha(tentativasAntes, agora) {
  const tentativas = (Number(tentativasAntes) || 0) + 1;
  if (tentativas >= MAX_TENTATIVAS_ENVIO) return { tentativas, desistiu: true, proxima: null };
  return { tentativas, desistiu: false, proxima: new Date(agora.getTime() + atrasoDaTentativa(tentativas)).toISOString() };
}
var vazio = (v) => !String(v ?? "").trim();
function baseEnviavel(ind, statusAceitos = STATUS_ENVIAVEIS) {
  if (!ind) return "inexistente";
  if (ind.crm_enviado_em) return "ja_enviada";
  if (ind.crm_desistiu_em) return "desistiu";
  if (!statusAceitos.includes(String(ind.status || ""))) return "status_nao_envia";
  if (ind.creator_type === "visitor") return "conversa_do_consultor";
  if (vazio(ind.client_name)) return "sem_cliente";
  return null;
}
function reservada(ind, agora) {
  return dataValida2(ind.crm_reservado_ate) && new Date(ind.crm_reservado_ate).getTime() > agora.getTime();
}
function motivoNaoEnviarNoLaco(ind, o) {
  const b = baseEnviavel(ind);
  if (b) return b;
  if (reservada(ind, o.agora)) return "reservada";
  if (dataValida2(ind.crm_proxima_tentativa_em) && new Date(ind.crm_proxima_tentativa_em).getTime() > o.agora.getTime()) return "aguardando_nova_tentativa";
  return null;
}
function motivoNaoEnviarNaCarga(ind, o) {
  const b = baseEnviavel(ind, STATUS_DA_CARGA);
  if (b) return b;
  if (String(ind.status) === "sold") {
    if (!temParceiroDeVerdade(ind)) return "venda_direta";
  } else if (String(ind.status) !== "negotiating") return "vai_como_nova";
  if (reservada(ind, o.agora)) return "reservada";
  return null;
}
var HORAS_ATE_O_ROBO_REASSUMIR = 24;
var FALHAS_DE_TRANSPORTE_ATE_O_ROBO_REASSUMIR = 20;
function triagemEhDoCrm(ind, c, agora = /* @__PURE__ */ new Date()) {
  if (!c.ativo) return false;
  if (ind?.crm_enviado_em) return true;
  if (ind?.crm_desistiu_em) return false;
  if (!c.chave || !c.urlValida) return false;
  if (baseEnviavel(ind) !== null) return false;
  if ((Number(ind?.crm_falhas_transporte) || 0) > FALHAS_DE_TRANSPORTE_ATE_O_ROBO_REASSUMIR) return false;
  const marcos = [ind?.created_at, c.ativoDesde].filter(dataValida2).map((v) => new Date(v).getTime());
  if (marcos.length) {
    const desde = Math.max(...marcos);
    if (agora.getTime() - desde > HORAS_ATE_O_ROBO_REASSUMIR * 60 * 60 * 1e3) return false;
  }
  return true;
}
var PLACEHOLDER = /^(n[ãa]o informad[oa]|n\/?a|a definir|-+)$/i;
var limpo = (v, max = 300) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return !s || PLACEHOLDER.test(s) ? "" : s.slice(0, max);
};
function separarCidadeUf(local) {
  const s = limpo(local, 120);
  const m = s.match(/^(.*?)\s*[-/,]\s*([A-Za-z]{2})$/);
  if (m && m[1]) return { cidade: m[1].trim(), uf: m[2].toUpperCase() };
  return { cidade: s, uf: "" };
}
function documentoSoDigitos(v) {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length === 11 || d.length === 14 ? d : "";
}
function produtoDeInteresse(ind) {
  const itens = Array.isArray(ind.items) ? ind.items : [];
  const nomes = itens.map((i) => {
    const n = limpo(i?.product_name, 120);
    const q = Number(i?.quantity) || 1;
    return n ? q > 1 ? `${q}x ${n}` : n : "";
  }).filter(Boolean);
  if (nomes.length) return nomes.join(", ").slice(0, 400);
  return limpo(ind.product_name || ind.base_machine, 200);
}
function observacao(ind) {
  const partes = [];
  const desc = String(ind.description ?? "").replace(/\r\n?/g, "\n").trim();
  if (desc) partes.push(desc);
  const maq = limpo(ind.base_machine, 120);
  if (maq && !/^a definir$/i.test(maq)) partes.push(`M\xE1quina base: ${maq}${limpo(ind.machine_details, 200) ? ` (${limpo(ind.machine_details, 200)})` : ""}`);
  const o = ind.options || {};
  const extras = [o.complete_installation && "instala\xE7\xE3o completa", o.kit_hydraulic && "kit hidr\xE1ulico", o.with_freight && "com frete", o.only_equipment && "s\xF3 equipamento"].filter(Boolean);
  if (extras.length) partes.push(`Op\xE7\xF5es: ${extras.join(", ")}`);
  if (ind.is_export) partes.push(`Exporta\xE7\xE3o${limpo(ind.export_country, 60) ? `: ${limpo(ind.export_country, 60)}` : ""}`);
  return partes.join("\n").slice(0, 3e3);
}
function montarPayloadIndicacao(ind, idIndicacao, parceiro, opcoes = {}) {
  const { cidade, uf } = separarCidadeUf(ind.client_location);
  const pessoa = limpo(ind.client_person_name, 160);
  const nomeCliente = limpo(ind.client_name, 160);
  let obs = observacao(ind);
  if (opcoes.jaEmNegociacao) {
    const quem = limpo(ind.internal_seller_name, 80);
    obs = `[J\xE1 estava em negocia\xE7\xE3o no Roder Indica${quem ? ` com ${quem}` : ""}]
${obs}`.trim();
  }
  const uid = limpo(ind.external_seller_uid, 128);
  const payload = {
    id_externo: String(idIndicacao),
    nome: pessoa || nomeCliente,
    empresa: limpo(ind.client_company_name || ind.company_name, 160) || nomeCliente,
    cnpj: documentoSoDigitos(ind.client_cnpj),
    telefone: limpo(ind.client_phone, 40),
    email: limpo(ind.client_email, 160),
    cidade,
    uf,
    produto: produtoDeInteresse(ind),
    observacao: obs,
    parceiro: {
      id: uid || null,
      nome: limpo(parceiro?.name, 160) || limpo(ind.external_seller_name, 160),
      telefone: limpo(parceiro?.phone, 40),
      email: limpo(parceiro?.email, 160) || limpo(ind.external_seller_email, 160)
    },
    criado_em: dataValida2(ind.created_at) ? new Date(ind.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
  };
  if (STATUS_INDICA[String(ind.status)]) payload.status_indica = STATUS_INDICA[String(ind.status)];
  if (opcoes.notificarEmail) payload.notificar_email = opcoes.notificarEmail;
  return payload;
}

// src/lib/crmFaturamento.ts
function numeroDoCrm(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v ?? "").trim().replace(/[^\d.,-]/g, "");
  if (!s) return null;
  const n = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s);
  return Number.isFinite(n) ? n : null;
}
function valorOpcionalDoCrm(v) {
  if (v === void 0 || v === null || String(v).trim() === "") return void 0;
  const n = numeroDoCrm(v);
  return n === null ? NaN : n;
}
function diaDoCrm(v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}
function normalizarItensCrm(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const i of raw) {
    if (!i || typeof i !== "object") continue;
    const code = String(i.codigo ?? i.code ?? i.sku ?? "").trim().slice(0, 60);
    const name = String(i.nome ?? i.name ?? i.descricao ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
    if (!code && !name) continue;
    const qRaw = numeroDoCrm(i.quantidade ?? i.quantity ?? i.qtd);
    const quantity = qRaw !== null && qRaw > 0 ? qRaw : 1;
    let unit = numeroDoCrm(i.valor_unitario ?? i.valor ?? i.preco ?? i.value);
    if (unit === null) {
      const total = numeroDoCrm(i.valor_total);
      unit = total !== null ? total / quantity : 0;
    }
    const totalLinha = numeroDoCrm(i.valor_total);
    const ambiguo = quantity > 1 && totalLinha !== null && numeroDoCrm(i.valor_unitario ?? i.valor ?? i.preco ?? i.value) === totalLinha;
    out.push({ code, name, quantity, base_value: emCentavos(Math.max(unit, 0)), ...ambiguo ? { ambiguo: true } : {} });
  }
  return out;
}
function classificarItem(item, anteriores, catalogo) {
  if (!itemComissionavel({ code: item.code, name: item.name })) return { ...item, is_commissionable: false, regra: "excluido" };
  const ant = item.code ? (anteriores || []).find((a) => a && String(a.code || "").trim() === item.code && typeof a.is_commissionable === "boolean") : void 0;
  if (ant) return { ...item, is_commissionable: ant.is_commissionable, regra: "indicacao" };
  const cat = item.code ? catalogo[item.code] : void 0;
  if (cat) return { ...item, is_commissionable: cat.is_commissionable !== false, regra: "catalogo" };
  return { ...item, regra: "sem_regra" };
}
function classificarItensCrm(brutos, anteriores, catalogo) {
  return normalizarItensCrm(brutos).map((i) => classificarItem(i, anteriores, catalogo));
}
function temEstorno(ind) {
  return !!ind?.estornado_em || temEstornoNoHistorico(ind);
}
function decidirFaturamento(o) {
  const { ind } = o;
  if (ind.status === "sold" || o.comissaoExistente) return { tipo: "ja_faturada" };
  const itens = normalizarItensCrm(o.itensBrutos).map((i) => classificarItem(i, ind.commissioned_products || [], o.catalogo));
  const motivos = [];
  const semRegra = itens.filter((i) => i.regra === "sem_regra").map((i) => i.code || i.name);
  if (temEstorno(ind)) motivos.push("A indica\xE7\xE3o teve o faturamento estornado. A comiss\xE3o n\xE3o \xE9 recriada sozinha.");
  if (temParceiroSemUid(ind)) motivos.push("A indica\xE7\xE3o tem cara de parceiro, mas n\xE3o est\xE1 ligada ao cadastro dele.");
  const uid = String(ind.external_seller_uid || "");
  const comParceiro = !!uid && !UIDS_DE_SISTEMA.includes(uid);
  if (itens.some((i) => i.ambiguo)) motivos.push("N\xE3o d\xE1 para saber se o valor dos itens \xE9 unit\xE1rio ou o total da linha.");
  const soma = emCentavos(itens.reduce((a, i) => a + i.base_value * i.quantity, 0));
  const invalido = (v) => v !== void 0 && v !== null && (!Number.isFinite(v) || v < 0);
  if (invalido(o.desconto) || invalido(o.frete)) motivos.push("Desconto ou frete do pedido inv\xE1lido (negativo ou n\xE3o num\xE9rico).");
  const esperado = soma - (invalido(o.desconto) ? 0 : o.desconto ?? 0) + (invalido(o.frete) ? 0 : o.frete ?? 0);
  if (o.totalPedido !== void 0 && o.totalPedido !== null && Math.abs(esperado - o.totalPedido) > 0.05) motivos.push("A soma dos itens (com desconto e frete) n\xE3o bate com o total do pedido.");
  if (comParceiro && !o.parceiro) motivos.push("O parceiro ligado \xE0 indica\xE7\xE3o n\xE3o existe mais no cadastro.");
  const recebeComissao = comParceiro && !!o.parceiro && papelComissionavel(o.parceiro.role);
  if (recebeComissao) {
    if (!itens.length) motivos.push("O CRM n\xE3o mandou itens no pedido faturado.");
    if (semRegra.length) motivos.push(`Itens sem regra de comiss\xE3o: ${semRegra.join(", ")}.`);
  }
  const produtos = itens.map((i) => ({ code: i.code, name: i.name, quantity: i.quantity, base_value: i.base_value, is_commissionable: i.is_commissionable }));
  const taxa = taxaDoParceiro(o.parceiro);
  const calc = calcularComissaoCentavos(produtos, 0, taxa);
  if (recebeComissao && !motivos.length) {
    if (calc.baseBruta <= 0) motivos.push("Nenhum item do pedido conta para a comiss\xE3o (a base daria zero).");
    else if (calc.valor <= 0) motivos.push("A comiss\xE3o daria zero.");
  }
  if (motivos.length) return { tipo: "conferencia", motivos, itensSemRegra: semRegra, itens };
  if (!recebeComissao) return { tipo: "sem_comissao", itens };
  return { tipo: "comissao", itens, taxa, calc, mes: mesDaComissao(o.entrega || void 0, o.agora), parceiroNome: o.parceiro?.name || ind.external_seller_name || "Parceiro" };
}

// src/lib/crmEventos.ts
var EVENTOS_CRM = [
  "indicacao.recebida",
  "indicacao.aceita",
  "indicacao.recusada",
  "indicacao.vinculada",
  "negocio.etapa",
  "proposta.enviada",
  "pedido.lancado",
  "pedido.faturado",
  "negocio.ganho",
  "negocio.perdido"
];
var CAMPOS_DO_TOPO = ["pedido_numero", "numero", "cnpj", "data_pedido", "previsao_entrega", "data_faturamento", "nota_fiscal", "valor_total", "total", "itens", "motivo", "etapa", "vendedora", "vendedora_nome", "vendedora_email", "vendedora_uid", "valor", "data", "numero_orcamento", "desconto", "frete"];
function mesclarDadosCrm(corpo) {
  const out = {};
  if (corpo && typeof corpo === "object") {
    for (const k of CAMPOS_DO_TOPO) if (corpo[k] !== void 0 && corpo[k] !== null) out[k] = corpo[k];
  }
  if (corpo?.dados && typeof corpo.dados === "object") {
    for (const [k, v] of Object.entries(corpo.dados)) if (v !== void 0 && v !== null) out[k] = v;
  }
  return out;
}
function textoDaMensagem(ev, prefixo) {
  const m = String(ev.mensagem ?? "").replace(/\s+/g, " ").trim();
  return prefixo ? m.replace(prefixo, "").trim() : m;
}
function vendedoraDaMensagem(ev) {
  const m = String(ev.mensagem ?? "").replace(/\s+/g, " ").trim().match(/^Em atendimento por\s+(.+)$/i);
  return m ? m[1].trim() : "";
}
var AUTOR_CRM = "CRM Roder";
var SESSENTA_DIAS_MS = 60 * 24 * 60 * 60 * 1e3;
function nivelDoStatus(status) {
  const s = String(status || "");
  if (s === "negotiating") return 1;
  if (s === "sold") return 2;
  if (s === "cancelled" || s === "archived" || s === "lost") return 9;
  return 0;
}
var normalizar2 = (v) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
var CITA_PARCEIRO = /\b(parceiros?|indicadors?|indicadas?|indicados?|indicou|indicacao\s+d[eao]|representantes?|outra\s+pessoa|outro\s+vendedor)\b/;
var DADO_INTERNO = /@|comiss|%|r\$|\d{8,}/;
var PALAVRAS_COMUNS = /* @__PURE__ */ new Set(["ltda", "eireli", "agro", "agricola", "florestal", "madeiras", "madeireira", "servicos", "transportes", "comercio", "maquinas", "equipamentos", "empresa", "grupo", "industria", "construtora", "locadora", "cliente", "preco", "prazo"]);
var MOTIVO_GENERICO_RECUSA = "Indica\xE7\xE3o n\xE3o aceita pela Roder.";
var MOTIVO_GENERICO_PERDA = "Neg\xF3cio n\xE3o conclu\xEDdo.";
function textoSeguroParaParceiro(texto2, generico, outrosParceiros = [], max = 140) {
  const bruto = String(texto2 ?? "").replace(/\s+/g, " ").trim();
  if (!bruto) return generico;
  const n = normalizar2(bruto);
  if (CITA_PARCEIRO.test(n) || DADO_INTERNO.test(bruto.toLowerCase())) return generico;
  const cercado = ` ${n} `;
  for (const nome of outrosParceiros) {
    const nn = normalizar2(nome);
    if (nn.length >= 3 && cercado.includes(` ${nn} `)) return generico;
    for (const t of nn.split(" ")) if (t.length >= 4 && !PALAVRAS_COMUNS.has(t) && cercado.includes(` ${t} `)) return generico;
  }
  return bruto.length > max ? `${bruto.slice(0, max - 1).trimEnd()}\u2026` : bruto;
}
function idSeguroEvento(id) {
  const s = String(id);
  if (/^[A-Za-z0-9_-]{1,100}$/.test(s)) return s;
  let h1 = 3735928559, h2 = 1103547991;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return `h${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0).toString(16).padStart(8, "0")}${s.length.toString(16)}`;
}
var idSeguro = idSeguroEvento;
function dataDoEvento(ev, agora) {
  const emTexto = ev.em && /^\d{4}-\d{2}-\d{2}$/.test(String(ev.em).trim()) ? `${String(ev.em).trim()}T12:00:00-03:00` : ev.em;
  const t = emTexto ? new Date(emTexto).getTime() : NaN;
  if (!Number.isFinite(t) || t > agora.getTime() + 60 * 60 * 1e3) return agora.toISOString();
  return new Date(t).toISOString();
}
function entrada(ev, agora, content, type = "system", sufixo = "") {
  return { id: `crm-${idSeguro(ev.id)}${sufixo}`, type, content, author_name: AUTOR_CRM, created_at: dataDoEvento(ev, agora), attachments: [] };
}
var jaAplicado = (ind, ev) => {
  const prefixo = `crm-${idSeguro(ev.id)}`;
  if (ind.crm_ultimo_evento_id === ev.id) return true;
  return (Array.isArray(ind.negotiation_history) ? ind.negotiation_history : []).some((e) => typeof e?.id === "string" && (e.id === prefixo || e.id.startsWith(`${prefixo}-`)));
};
var ignorado = (motivo) => ({ resultado: "ignorado", motivo, campos: {}, historico: [], notificacoes: [] });
var dados = (ev) => ev.dados && typeof ev.dados === "object" ? ev.dados : {};
var curto = (v, max = 120) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
var brData = (dia) => dia ? dia.split("-").reverse().join("/") : "";
var cliente = (ind) => curto(ind.client_name, 80) || "cliente";
var UIDS_SISTEMA = ["client_referral", "direct_factory", "public_request", "anonymous"];
var parceiroEhPessoa = (ind) => !!ind.external_seller_uid && !UIDS_SISTEMA.includes(String(ind.external_seller_uid));
function nomeDaVendedora(ev, ctx) {
  const d = dados(ev);
  const v = d.vendedora ?? d.vendedora_nome ?? d.responsavel;
  const doEvento = (typeof v === "string" ? v : v?.nome ?? v?.name ?? "") || vendedoraDaMensagem(ev);
  return curto(ctx.vendedora?.name || doEvento, 80);
}
function planejarEvento(ind, ev, ctx) {
  const nome = String(ev.evento || "");
  if (!EVENTOS_CRM.includes(nome)) return ignorado("evento_desconhecido");
  if (jaAplicado(ind, ev)) return ignorado("ja_aplicado");
  const agora = ctx.agora;
  const nowIso = agora.toISOString();
  const nivel = nivelDoStatus(ind.status);
  const d = dados(ev);
  const base = { updated_at: nowIso, crm_ultimo_evento_id: ev.id, crm_ultimo_evento: nome, crm_ultimo_evento_em: dataDoEvento(ev, agora) };
  const ehPessoa = parceiroEhPessoa(ind);
  const paraParceiro = (titulo, mensagem, tipo = "info") => ehPessoa ? [{ para: "parceiro", titulo, mensagem, tipo }] : [];
  switch (nome) {
    case "indicacao.recebida":
      return { resultado: "aplicado", campos: { crm_ultimo_evento_id: ev.id, crm_ultimo_evento: nome, crm_ultimo_evento_em: base.crm_ultimo_evento_em }, historico: [entrada(ev, agora, "Indica\xE7\xE3o recebida")], notificacoes: [] };
    case "indicacao.aceita": {
      if (nivel >= 2) return ignorado("status_nao_regride");
      if (nivel === 9) return ignorado("indicacao_encerrada");
      const vend = nomeDaVendedora(ev, ctx);
      const texto2 = vend ? `Em atendimento por ${vend}` : "Em atendimento";
      if (nivel === 1) {
        if (ind.internal_seller_name || !vend) return ignorado("ja_em_negociacao");
        return {
          resultado: "aplicado",
          campos: { ...base, internal_seller_name: vend, ...ctx.vendedora?.uid ? { internal_seller_uid: ctx.vendedora.uid, internal_seller_email: ctx.vendedora.email || null } : {} },
          historico: [entrada(ev, agora, texto2)],
          notificacoes: []
        };
      }
      const campos = {
        ...base,
        status: "negotiating",
        duplicate_reviewed: true,
        crm_aceita_em: dataDoEvento(ev, agora)
      };
      if (vend) {
        campos.internal_seller_name = vend;
        if (ctx.vendedora?.uid) {
          campos.internal_seller_uid = ctx.vendedora.uid;
          campos.internal_seller_email = ctx.vendedora.email || null;
        } else if (ind.internal_seller_uid && normalizar2(ind.internal_seller_name) !== normalizar2(vend)) {
          campos.internal_seller_uid = null;
          campos.internal_seller_email = null;
        }
      }
      if (!ind.protection_expires_at) campos.protection_expires_at = new Date(agora.getTime() + SESSENTA_DIAS_MS).toISOString();
      const notificacoes = [
        ...ctx.vendedora?.uid ? [{ para: "vendedora", titulo: "Novo Lead Atribu\xEDdo", mensagem: `Voc\xEA recebeu um novo lead: ${cliente(ind)}`, tipo: "info" }] : [],
        ...paraParceiro("Lead em Atendimento", `Sua indica\xE7\xE3o para ${cliente(ind)} foi aceita e est\xE1 em atendimento${vend ? ` por ${vend}` : ""}.`, "success")
      ];
      return { resultado: "aplicado", campos, historico: [entrada(ev, agora, texto2, "status_change")], notificacoes };
    }
    case "indicacao.recusada": {
      if (nivel >= 1) return ignorado(nivel === 9 ? "indicacao_encerrada" : "status_nao_regride");
      const motivo = textoSeguroParaParceiro(d.motivo ?? textoDaMensagem(ev), MOTIVO_GENERICO_RECUSA, ctx.nomesOutrosParceiros);
      return {
        resultado: "aplicado",
        campos: { ...base, status: "archived", cancellation_reason: "Indica\xE7\xE3o n\xE3o aceita", cancellation_details: motivo },
        historico: [entrada(ev, agora, `Indica\xE7\xE3o recusada: ${motivo}`, "status_change")],
        notificacoes: paraParceiro("Lead Arquivado", `Sua indica\xE7\xE3o para ${cliente(ind)} n\xE3o foi aceita. Motivo: ${motivo}`, "warning")
      };
    }
    case "indicacao.vinculada": {
      if (nivel >= 2) return ignorado("status_nao_regride");
      if (nivel === 9) return ignorado("indicacao_encerrada");
      if (nivel === 1) return ignorado("ja_em_negociacao");
      const campos = { ...base, status: "negotiating", duplicate_reviewed: true, crm_aceita_em: dataDoEvento(ev, agora) };
      if (!ind.protection_expires_at) campos.protection_expires_at = new Date(agora.getTime() + SESSENTA_DIAS_MS).toISOString();
      return {
        resultado: "aplicado",
        campos,
        historico: [entrada(ev, agora, "Cliente j\xE1 atendido pela Roder: indica\xE7\xE3o em negocia\xE7\xE3o", "status_change")],
        notificacoes: paraParceiro("Lead em Atendimento", `Sua indica\xE7\xE3o para ${cliente(ind)} est\xE1 em negocia\xE7\xE3o.`, "success")
      };
    }
    case "negocio.etapa": {
      if (nivel === 9) return ignorado("indicacao_encerrada");
      const etapa = textoSeguroParaParceiro(d.etapa ?? d.nome ?? textoDaMensagem(ev), "", ctx.nomesOutrosParceiros, 80);
      if (!etapa) return ignorado("etapa_sem_nome");
      return { resultado: "aplicado", campos: { ...base, crm_etapa: etapa }, historico: [entrada(ev, agora, `Etapa: ${etapa}`)], notificacoes: [] };
    }
    case "proposta.enviada": {
      if (nivel >= 2) return ignorado("status_nao_regride");
      if (nivel === 9) return ignorado("indicacao_encerrada");
      const numero2 = curto(d.numero ?? d.numero_orcamento ?? d.orcamento_numero, 40);
      const dia = diaDoCrm(d.data ?? d.data_orcamento);
      const valor = numeroDoCrm(d.valor ?? d.valor_total);
      const campos = { ...base, budget_loaded: true };
      if (numero2) campos.budget_number = numero2;
      if (dia) campos.budget_date = dia;
      if (valor !== null && valor >= 0) campos.gross_budget_value = valor;
      const enviadoMs = new Date(dataDoEvento(ev, agora)).getTime();
      const candidata = enviadoMs + SESSENTA_DIAS_MS;
      const atual = ind.protection_expires_at ? new Date(ind.protection_expires_at).getTime() : 0;
      if (!(atual > candidata)) {
        campos.budget_sent_at = new Date(enviadoMs).toISOString();
        campos.protection_expires_at = new Date(candidata).toISOString();
      } else if (!ind.budget_sent_at) campos.budget_sent_at = new Date(enviadoMs).toISOString();
      const primeira = !ind.budget_loaded;
      return {
        resultado: "aplicado",
        campos,
        historico: [entrada(ev, agora, numero2 ? `Or\xE7amento enviado (n\xBA ${numero2})` : "Or\xE7amento enviado")],
        notificacoes: primeira ? paraParceiro("Or\xE7amento em Andamento", `Um or\xE7amento foi enviado para o cliente ${cliente(ind)}.`, "info") : []
      };
    }
    case "pedido.lancado": {
      if (nivel >= 2) return ignorado("status_nao_regride");
      if (nivel === 9) return ignorado("indicacao_encerrada");
      const numero2 = curto(d.pedido_numero ?? d.numero ?? d.numero_pedido, 40);
      const itens = classificar(d.itens, ind, ctx);
      const campos = { ...base };
      if (numero2) campos.sale_order_number = numero2;
      const dia = diaDoCrm(d.data ?? d.data_pedido);
      if (dia) campos.sale_order_date = dia;
      const entrega = diaDoCrm(d.previsao_entrega);
      if (entrega) campos.delivery_date = entrega;
      if (itens.length) {
        campos.commissioned_products = produtosGravaveis(itens);
        campos.sale_value = totalDosItens(itens);
      }
      return { resultado: "aplicado", campos, historico: [entrada(ev, agora, numero2 ? `Pedido de venda lan\xE7ado (n\xBA ${numero2})` : "Pedido de venda lan\xE7ado")], notificacoes: [] };
    }
    case "pedido.faturado":
      return planejarFaturado(ind, ev, ctx, base);
    case "negocio.ganho": {
      if (nivel === 9) return ignorado("indicacao_encerrada");
      const valor = numeroDoCrm(d.valor ?? d.valor_total);
      return {
        resultado: "aplicado",
        // não cria comissão e não muda o status: quem fatura é o pedido.faturado
        campos: { ...base, crm_ganho_em: dataDoEvento(ev, agora), ...valor !== null && valor >= 0 ? { crm_ganho_valor: valor } : {} },
        historico: [entrada(ev, agora, "Neg\xF3cio fechado")],
        notificacoes: []
      };
    }
    case "negocio.perdido": {
      if (nivel >= 2) return ignorado("status_nao_regride");
      if (nivel === 9) return ignorado("indicacao_encerrada");
      const motivo = textoSeguroParaParceiro(d.motivo ?? textoDaMensagem(ev, /^Negocia[çc][ãa]o encerrada:?\s*/i), MOTIVO_GENERICO_PERDA, ctx.nomesOutrosParceiros);
      return {
        resultado: "aplicado",
        campos: { ...base, status: "cancelled", cancellation_reason: motivo, cancellation_details: "Neg\xF3cio encerrado no CRM da Roder.", crm_perdido_em: dataDoEvento(ev, agora) },
        historico: [entrada(ev, agora, `Negocia\xE7\xE3o encerrada: ${motivo}`, "status_change")],
        notificacoes: paraParceiro("Indica\xE7\xE3o Cancelada", `A negocia\xE7\xE3o com ${cliente(ind)} foi encerrada. Motivo: ${motivo}`, "warning")
      };
    }
  }
}
function classificar(brutos, ind, ctx) {
  return classificarItensCrm(brutos, ind.commissioned_products || [], ctx.catalogo);
}
function produtosGravaveis(itens) {
  return itens.map((i) => ({
    code: i.code,
    name: i.name,
    quantity: i.quantity,
    base_value: i.base_value,
    ...typeof i.is_commissionable === "boolean" ? { is_commissionable: i.is_commissionable } : {}
  }));
}
var totalDosItens = (itens) => emCentavos(itens.reduce((a, i) => a + i.base_value * i.quantity, 0));
function opcoesDosItens(ind, itens) {
  const atual = ind.options || { complete_installation: false, kit_hydraulic: false, with_freight: false };
  const instal = itens.some((p) => /instalacao|instalação|montagem|entrega/i.test(p.name));
  const kit = itens.some((p) => /kit|hidraulico|hidráulico|funcao|função|valvula|válvula/i.test(p.name) || p.code.startsWith("9000"));
  const frete = itens.some((p) => /frete|transporte|deslocamento/i.test(p.name));
  return { ...atual, complete_installation: !!atual.complete_installation || instal, kit_hydraulic: !!atual.kit_hydraulic || kit, with_freight: !!atual.with_freight || frete };
}
function planejarFaturado(ind, ev, ctx, base) {
  const p = planejarFaturadoBase(ind, ev, ctx, base);
  if (p.resultado === "aplicado" && ind.faturamento_aguardando_conferencia === true && p.campos.commissioned_products && (ind.commissioned_products?.length || ind.sale_value)) {
    p.substituiu = { evento_anterior: ind.crm_ultimo_evento_id ?? null, sale_order_number: ind.sale_order_number ?? null, sale_value: ind.sale_value ?? null, commissioned_products: ind.commissioned_products ?? [] };
  }
  return p;
}
function planejarFaturadoBase(ind, ev, ctx, base) {
  const agora = ctx.agora;
  const nivel = nivelDoStatus(ind.status);
  if (nivel === 9) return ignorado("indicacao_encerrada");
  const d = dados(ev);
  const numero2 = curto(d.pedido_numero ?? d.numero ?? d.numero_pedido, 40);
  const diaPedido = diaDoCrm(d.data_pedido ?? d.data) || diaDoCrm(dataDoEvento(ev, agora));
  const diaFaturamento = diaDoCrm(d.data_faturamento);
  const entrega = diaDoCrm(d.previsao_entrega);
  const dec = decidirFaturamento({
    ind,
    parceiro: ctx.parceiro,
    itensBrutos: d.itens,
    catalogo: ctx.catalogo,
    comissaoExistente: ctx.comissaoExistente,
    entrega,
    agora,
    totalPedido: numeroDoCrm(d.valor_total ?? d.total),
    desconto: valorOpcionalDoCrm(d.desconto),
    frete: valorOpcionalDoCrm(d.frete)
  });
  if (dec.tipo === "ja_faturada") return ignorado(ind.status === "sold" ? "ja_faturada" : "comissao_ja_existe");
  const cnpjCampo = !ind.client_cnpj || /n[ãa]o informado/i.test(String(ind.client_cnpj)) ? String(d.cnpj ?? "").replace(/\D/g, "") || null : null;
  if (dec.tipo === "conferencia") {
    const estornada = !!ind.estornado_em;
    const itens2 = dec.itens;
    const campos2 = {
      ...base,
      faturamento_aguardando_conferencia: true,
      faturamento_conferencia_em: agora.toISOString(),
      faturamento_conferencia_motivo: estornada ? "Faturamento estornado; conferir antes de faturar de novo." : dec.itensSemRegra.length ? "Itens do pedido sem regra de comiss\xE3o." : "Faturamento do CRM precisa de confer\xEAncia."
    };
    if (!estornada) {
      if (numero2) campos2.sale_order_number = numero2;
      campos2.sale_order_date = diaPedido;
      if (entrega) campos2.delivery_date = entrega;
      if (itens2.length) {
        campos2.commissioned_products = produtosGravaveis(itens2);
        campos2.sale_value = totalDosItens(itens2);
      }
      if (cnpjCampo) campos2.client_cnpj = cnpjCampo;
    }
    return {
      resultado: "aplicado",
      campos: campos2,
      historico: [],
      // o parceiro não vê nada: é conferência interna
      notificacoes: [{ para: "gestao", titulo: "Faturamento aguardando confer\xEAncia", mensagem: `O CRM faturou o pedido ${numero2 || "s/n"} de ${cliente(ind)}, mas n\xE3o d\xE1 para lan\xE7ar a comiss\xE3o sozinho. ${dec.motivos[0]}`, tipo: "warning" }],
      conferencia: { motivos: dec.motivos, itensSemRegra: dec.itensSemRegra }
    };
  }
  const itens = dec.itens;
  const total = totalDosItens(itens);
  const c = dec.tipo === "comissao" ? dec : null;
  const comissao = !!c;
  const campos = {
    ...base,
    status: "sold",
    sale_value: total,
    discount_percentage: 0,
    discount_amount: 0,
    commission_value: c ? c.calc.valor : 0,
    commission_rate_applied: c ? c.taxa : 0,
    commissionable_value: c ? c.calc.base : 0,
    standard_seller_commission_value: 0,
    sale_date: diaPedido,
    sale_order_date: diaPedido,
    items: itens.map((i) => ({ product_name: i.name, quantity: i.quantity, price: i.base_value, code: i.code })),
    commissioned_products: produtosGravaveis(itens),
    options: opcoesDosItens(ind, itens),
    faturamento_aguardando_conferencia: false,
    crm_faturado_em: diaFaturamento || diaDoCrm(dataDoEvento(ev, agora)),
    ...curto(d.nota_fiscal, 40) ? { crm_nota_fiscal: curto(d.nota_fiscal, 40) } : {}
  };
  if (numero2) campos.sale_order_number = numero2;
  if (entrega) campos.delivery_date = entrega;
  if (cnpjCampo) campos.client_cnpj = cnpjCampo;
  if (comissao && !ind.finance_notice_sent_at) {
    campos.finance_notice_pending = true;
    campos.finance_notice_due_at = new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1e3).toISOString();
  }
  const nomePessoa = cliente(ind);
  const plano = {
    resultado: "aplicado",
    campos,
    // começa com "VENDA FINALIZADA" porque o diagnóstico de comissão usa esse início para ordenar faturamento e estorno
    historico: [entrada(ev, agora, comissao ? `VENDA FINALIZADA! Data do Pedido: ${brData(diaPedido)}. Venda conclu\xEDda, comiss\xE3o liberada.` : `VENDA FINALIZADA! Data do Pedido: ${brData(diaPedido)}.`, "status_change")],
    notificacoes: [
      ...comissao && parceiroEhPessoa(ind) ? [{ para: "parceiro", titulo: "Venda conclu\xEDda", mensagem: `Venda conclu\xEDda, comiss\xE3o liberada. Cliente: ${nomePessoa}.`, tipo: "success" }] : [],
      { para: "gestao", titulo: "Venda Realizada", mensagem: `O CRM faturou a venda de ${nomePessoa}${numero2 ? ` (pedido ${numero2})` : ""}.`, tipo: "success" }
    ]
  };
  if (c) {
    plano.comissao = {
      indication_id: ev.id_externo,
      external_seller_uid: String(ind.external_seller_uid),
      external_seller_name: c.parceiroNome,
      value: c.calc.valor,
      base_value_used: c.calc.base,
      gross_commissionable_value: c.calc.baseBruta,
      discount_applied: 0,
      discount_percentage: 0,
      rate_applied: c.taxa,
      status: "waiting_nf",
      month: c.mes.month,
      year: c.mes.year,
      sale_date: diaPedido,
      created_at: agora.toISOString(),
      generated_by: "crm"
    };
  }
  return plano;
}

// server/crmAssinatura.ts
var import_node_crypto3 = require("node:crypto");
var TOLERANCIA_RELOGIO_MS = 5 * 60 * 1e3;
function assinarCrm(segredo, timestamp, corpo) {
  const mac = (0, import_node_crypto3.createHmac)("sha256", segredo);
  mac.update(`${timestamp}.`);
  mac.update(typeof corpo === "string" ? Buffer.from(corpo, "utf8") : corpo);
  return `sha256=${mac.digest("hex")}`;
}
function timestampEmMs(ts) {
  const s = String(ts || "").trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return s.length <= 11 ? n * 1e3 : n;
  }
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : null;
}
function verificarAssinaturaCrm(o) {
  if (!o.segredo) return { ok: false, status: 503, motivo: "segredo_nao_configurado" };
  const ts = String(o.timestamp || "").trim();
  const sig = String(o.assinatura || "").trim();
  if (!ts || !sig) return { ok: false, status: 401, motivo: "cabecalhos_ausentes" };
  const ms2 = timestampEmMs(ts);
  if (ms2 === null) return { ok: false, status: 401, motivo: "timestamp_invalido" };
  const agora = (o.agora || /* @__PURE__ */ new Date()).getTime();
  if (Math.abs(agora - ms2) > (o.toleranciaMs ?? TOLERANCIA_RELOGIO_MS)) return { ok: false, status: 401, motivo: "timestamp_fora_da_janela" };
  const esperado = Buffer.from(assinarCrm(o.segredo, ts, o.corpo), "utf8");
  const recebido = Buffer.from(sig.toLowerCase().startsWith("sha256=") ? `sha256=${sig.slice(7).toLowerCase()}` : sig, "utf8");
  if (esperado.length !== recebido.length || !(0, import_node_crypto3.timingSafeEqual)(esperado, recebido)) return { ok: false, status: 401, motivo: "assinatura_invalida" };
  return { ok: true };
}

// server/crmEventos.ts
var ID_SIMPLES = /^[A-Za-z0-9_-]{1,128}$/;
var docIdEvento = idSeguroEvento;
var EVENTOS_COM_VINCULO = ["pedido.faturado", "pedido.lancado", "negocio.ganho", "negocio.perdido", "indicacao.aceita", "indicacao.recusada"];
var norm = (v) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9@._]+/g, " ").trim();
var PAPEIS_GESTAO_VENDA = ["admin", "manager"];
var PAPEIS_CONFERENCIA = ["admin", "manager", "financial", "finance"];
async function catalogoDosItens(db2, itensBrutos) {
  const codigos = Array.from(new Set(normalizarItensCrm(itensBrutos).map((i) => i.code).filter(Boolean)));
  const out = {};
  for (const code of codigos) {
    const s = await db2.collection("registered_products").where("code", "==", code).get();
    if (!s.empty) {
      const flags = s.docs.map((d) => (d.data() || {}).is_commissionable);
      out[code] = { is_commissionable: flags.includes(false) ? false : void 0 };
    }
  }
  return out;
}
async function nomesDeOutrosParceiros(db2, uidDoDono) {
  const s = await db2.collection("users").where("role", "==", "external_seller").get();
  return s.docs.filter((d) => d.id !== uidDoDono).map((d) => String(d.data()?.name || "")).filter(Boolean);
}
async function resolverVendedora(db2, d) {
  const v = d?.vendedora ?? d?.vendedora_nome ?? d?.responsavel;
  const nome = String(typeof v === "string" ? v : v?.nome ?? v?.name ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  const email = String(d?.vendedora_email ?? (typeof v === "object" ? v?.email : "") ?? "").trim().toLowerCase();
  const uid = String(d?.vendedora_uid ?? (typeof v === "object" ? v?.uid : "") ?? "").trim();
  const dePerfil = (id, u) => ({ uid: id, name: String(u?.name || nome), email: u?.email || null });
  if (uid && ID_SIMPLES.test(uid)) {
    const s = await db2.collection("users").doc(uid).get();
    if (s.exists && s.data()?.status !== "inactive") return dePerfil(s.id, s.data());
  }
  if (email) {
    const s = await db2.collection("users").where("email", "==", email).get();
    const achado = s.docs.find((x) => x.data()?.status !== "inactive");
    if (achado) return dePerfil(achado.id, achado.data());
  }
  if (nome) {
    const alvo = norm(nome);
    const s = await db2.collection("users").where("role", "==", "internal_seller").get();
    const achados = s.docs.filter((x) => norm(x.data()?.name) === alvo && x.data()?.status !== "inactive");
    if (achados.length === 1) return dePerfil(achados[0].id, achados[0].data());
    return { name: nome };
  }
  return null;
}
async function usuariosPorPapel(db2, papeis) {
  const s = await db2.collection("users").where("role", "in", papeis).get();
  return s.docs.filter((d) => (d.data()?.status ?? "active") === "active").map((d) => d.id);
}
async function enviarNotificacoes(deps, ind, plano, vendedoraUid, agora) {
  const { db: db2 } = deps;
  const link = "/indicacoes";
  for (const n of plano.notificacoes) {
    try {
      const destinos = n.para === "parceiro" ? [String(ind.external_seller_uid || "")] : n.para === "vendedora" ? [String(vendedoraUid || "")] : await usuariosPorPapel(db2, plano.conferencia ? PAPEIS_CONFERENCIA : PAPEIS_GESTAO_VENDA);
      for (const uid of Array.from(new Set(destinos.filter(Boolean)))) {
        await db2.collection("notifications").add({ user_uid: uid, title: n.titulo, message: n.mensagem, type: n.tipo, read: false, link, created_at: agora.toISOString(), origem: "crm" });
      }
    } catch (e) {
      (deps.log || console.error)("[CRM-EVENTOS] Notifica\xE7\xE3o n\xE3o enviada:", e?.message);
    }
  }
}
async function processarEventoCrm(deps, ev) {
  const { db: db2 } = deps;
  const log = deps.log || console.log;
  const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  const eventoRef = db2.collection("crm_eventos").doc(docIdEvento(ev.id));
  const anterior = await eventoRef.get();
  if (anterior.exists && anterior.data()?.processado_em) return { status: 200, body: { ok: true, duplicado: true } };
  const registrar = async (resultado, motivo, plano2) => {
    let dadosGravados = null;
    try {
      const j = JSON.stringify(ev.dados ?? null);
      dadosGravados = j.length > 2e4 ? `${j.slice(0, 2e4)}\u2026` : j;
    } catch {
    }
    const final = resultado === "ignorado" && motivo === "ja_aplicado" ? "aplicado" : resultado;
    const doc = {
      id: ev.id,
      evento: ev.evento,
      id_externo: ev.id_externo,
      parceiro_id: ev.parceiro_id ?? null,
      resultado: final,
      motivo: motivo ?? null,
      processado_em: agora.toISOString(),
      em: ev.em ?? null,
      dados: dadosGravados,
      ...plano2?.conferencia ? { conferencia: plano2.conferencia } : {},
      ...plano2?.substituiu ? { substituiu: plano2.substituiu } : {}
    };
    try {
      await eventoRef.create(doc);
    } catch (e) {
      if (!(e?.code === 6 || /ALREADY_EXISTS|already exists/i.test(String(e?.message)))) throw e;
      const atual = (await eventoRef.get()).data() || {};
      if (atual.resultado === "aplicado" || final === "ignorado") return;
      await eventoRef.set(doc);
    }
  };
  if (!EVENTOS_CRM.includes(ev.evento)) {
    await registrar("ignorado", "evento_desconhecido");
    return { status: 200, body: { ok: true, resultado: "ignorado", motivo: "evento_desconhecido" } };
  }
  const indRef = db2.collection("indications").doc(ev.id_externo);
  const previa = await indRef.get();
  if (!previa.exists) {
    await registrar("ignorado", "indicacao_nao_encontrada");
    log(`[CRM-EVENTOS] ${ev.evento} ${ev.id}: indica\xE7\xE3o ${ev.id_externo} n\xE3o existe.`);
    return { status: 200, body: { ok: true, resultado: "ignorado", motivo: "indicacao_nao_encontrada" } };
  }
  const indPrevia = previa.data() || {};
  const donoUid = String(indPrevia.external_seller_uid || "");
  const parceiroDoEvento = String(ev.parceiro_id ?? "");
  const diverge = EVENTOS_COM_VINCULO.includes(ev.evento) ? parceiroDoEvento !== donoUid : !!(parceiroDoEvento && donoUid && parceiroDoEvento !== donoUid);
  if (diverge) {
    await registrar("ignorado", "parceiro_diferente");
    log(`[CRM-EVENTOS] ${ev.evento} ${ev.id}: parceiro_id do evento difere do da indica\xE7\xE3o ${ev.id_externo}.`);
    return { status: 200, body: { ok: true, resultado: "ignorado", motivo: "parceiro_diferente" } };
  }
  const d = ev.dados && typeof ev.dados === "object" ? ev.dados : {};
  const parceiro = parceiroEhPessoa(indPrevia) ? (await db2.collection("users").doc(donoUid).get()).data() || null : null;
  const vendedora = ev.evento === "indicacao.aceita" ? await resolverVendedora(db2, { ...d, ...d.vendedora || d.vendedora_nome ? {} : { vendedora_nome: vendedoraDaMensagem(ev) } }) : null;
  const textoLivre = ["indicacao.recusada", "negocio.perdido", "negocio.etapa"].includes(ev.evento);
  const nomesOutrosParceiros = textoLivre ? await nomesDeOutrosParceiros(db2, donoUid) : [];
  const catalogo = ["pedido.lancado", "pedido.faturado"].includes(ev.evento) ? await catalogoDosItens(db2, d.itens) : {};
  const commRef = db2.collection("commissions").doc(ev.id_externo);
  const feito = await db2.runTransaction(async (tx) => {
    const s = await tx.get(indRef);
    if (!s.exists) return { plano: null, ind: null };
    const ind2 = { id: s.id, ...s.data() };
    let comissaoExistente = false;
    if (ev.evento === "pedido.faturado") {
      const c = await tx.get(commRef);
      const legado = await tx.get(db2.collection("commissions").where("indication_id", "==", ev.id_externo));
      comissaoExistente = c.exists || !legado.empty;
    }
    const plano2 = planejarEvento(ind2, ev, { agora, parceiro, vendedora, nomesOutrosParceiros, catalogo, comissaoExistente });
    if (plano2.resultado === "aplicado") {
      tx.update(indRef, {
        ...plano2.campos,
        ...plano2.historico.length ? { negotiation_history: deps.arrayUnion(...plano2.historico) } : {}
      });
      if (plano2.comissao) tx.set(commRef, plano2.comissao);
    }
    return { plano: plano2, ind: ind2 };
  });
  if (!feito.plano) {
    await registrar("ignorado", "indicacao_nao_encontrada");
    return { status: 200, body: { ok: true, resultado: "ignorado", motivo: "indicacao_nao_encontrada" } };
  }
  const { plano, ind } = feito;
  if (plano.resultado === "aplicado") await enviarNotificacoes(deps, ind, plano, vendedora?.uid, agora);
  else log(`[CRM-EVENTOS] ${ev.evento} ${ev.id} ignorado (${plano.motivo}) na indica\xE7\xE3o ${ev.id_externo}.`);
  await registrar(plano.resultado, plano.motivo, plano);
  return { status: 200, body: { ok: true, resultado: plano.resultado, ...plano.motivo ? { motivo: plano.motivo } : {}, ...plano.conferencia ? { aguardando_conferencia: true } : {} } };
}
async function tratarRequisicaoCrm(deps, req) {
  const cfg = deps.config();
  if (!podeReceberDoCrm(cfg)) return { status: 503, body: { ok: false, error: "Integra\xE7\xE3o com o CRM desligada ou sem segredo configurado." } };
  const h = (n) => {
    const v = req.headers[n];
    return Array.isArray(v) ? v[0] : v;
  };
  const ver = verificarAssinaturaCrm({ segredo: cfg.segredo, timestamp: h("x-roder-timestamp"), assinatura: h("x-roder-assinatura"), corpo: req.corpo, agora: deps.agora ? deps.agora() : void 0 });
  if (!ver.ok) return { status: ver.status, body: { ok: false, error: "Assinatura inv\xE1lida." } };
  let json;
  try {
    json = JSON.parse(req.corpo.toString("utf8"));
  } catch {
    return { status: 400, body: { ok: false, error: "Corpo n\xE3o \xE9 JSON." } };
  }
  const id = typeof json?.id === "string" ? json.id.trim() : "";
  const evento = typeof json?.evento === "string" ? json.evento.trim() : "";
  const idExterno = typeof json?.id_externo === "string" ? json.id_externo.trim() : "";
  if (!id || id.length > 200 || !evento || !ID_SIMPLES.test(idExterno)) return { status: 400, body: { ok: false, error: "Faltam id, evento ou id_externo v\xE1lidos." } };
  try {
    return await processarEventoCrm(deps, {
      id,
      evento,
      id_externo: idExterno,
      em: typeof json.em === "string" ? json.em : void 0,
      parceiro_id: json.parceiro_id == null ? null : String(json.parceiro_id),
      status: typeof json.status === "string" ? json.status : void 0,
      mensagem: typeof json.mensagem === "string" ? json.mensagem.slice(0, 500) : void 0,
      dados: mesclarDadosCrm(json)
    });
  } catch (e) {
    (deps.log || console.error)("[CRM-EVENTOS] Erro ao processar:", e?.message);
    return { status: 500, body: { ok: false, error: "Erro ao processar. Reenvie." } };
  }
}
function registrarRotaEventosCrm(app, express2, deps) {
  app.post("/api/crm/eventos", express2.raw({ type: () => true, limit: "2mb" }), async (req, res) => {
    const r = await tratarRequisicaoCrm(deps, { headers: req.headers, corpo: Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0) });
    res.setHeader("Cache-Control", "no-store");
    res.status(r.status).json(r.body);
  });
}

// src/lib/crmFase2.ts
var MAX_ANEXOS = 10;
var MAX_ANEXO_BYTES = 20 * 1024 * 1024;
var ms = (v) => {
  const t = Date.parse(String(v ?? ""));
  return Number.isFinite(t) ? t : NaN;
};
var TIPOS_DE_NOTA_DO_PARCEIRO = ["note", "whatsapp"];
function classificarEntrada(ind, e) {
  if (!e || typeof e !== "object" || !e.id) return "fora";
  if (e.author_name === AUTOR_CRM || String(e.id).startsWith("crm-")) return "fora";
  if (String(e.id).startsWith("obs-parceiro-") || e.id === "initial_virtual") return "fora";
  if (!TIPOS_DE_NOTA_DO_PARCEIRO.includes(String(e.type))) return "fora";
  if (!(ms(e.created_at) > ms(ind.crm_enviado_em))) return "fora";
  if (!parceiroEhPessoa(ind)) return "fora";
  if (!(String(e.content ?? "").trim() || Array.isArray(e.attachments) && e.attachments.length)) return "fora";
  const dono = String(ind.external_seller_uid);
  if (e.author_uid) return String(e.author_uid) === dono ? "enviar" : "ignorar";
  const nome = String(ind.external_seller_name ?? "").trim();
  return nome && String(e.author_name ?? "").trim() === nome ? "enviar" : "ignorar";
}
var conjunto = (v) => new Set(Array.isArray(v) ? v.map(String) : []);
function entradasPendentesDoParceiro(ind) {
  const fora = /* @__PURE__ */ new Set([...conjunto(ind.crm_atualizacoes_enviadas), ...conjunto(ind.crm_atualizacoes_desistiu), ...conjunto(ind.crm_atualizacoes_ignoradas)]);
  const hist = Array.isArray(ind.negotiation_history) ? ind.negotiation_history : [];
  return hist.filter((e) => classificarEntrada(ind, e) === "enviar" && !fora.has(String(e.id)));
}
function entradasParaIgnorar(ind) {
  const marcadas = conjunto(ind.crm_atualizacoes_ignoradas);
  const hist = Array.isArray(ind.negotiation_history) ? ind.negotiation_history : [];
  return hist.filter((e) => classificarEntrada(ind, e) === "ignorar" && !marcadas.has(String(e.id))).map((e) => String(e.id));
}
var idMensagemCrm = (indId, entradaId) => `${indId}:${entradaId}`;
function tipoDoAnexo(a) {
  const nome = String(a?.name || "").toLowerCase();
  const url = String(a?.url || "").split("?")[0].toLowerCase();
  const alvo = `${nome} ${url}`;
  if (/^data:audio\//.test(String(a?.url || "")) || /\.(webm|mp3|m4a|ogg|oga|wav|aac|opus|amr)(\s|$)/.test(alvo) || /(^|[^a-z])(audio|áudio)/.test(nome)) return "audio";
  if (/^data:image\//.test(String(a?.url || "")) || /\.(jpe?g|png|gif|webp|heic|heif|bmp)(\s|$)/.test(alvo)) return "imagem";
  return "arquivo";
}
function referenciaStorage(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "firebasestorage.googleapis.com") {
      const m = u.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (m) return { bucket: m[1], caminho: decodeURIComponent(m[2]) };
    }
    if (u.hostname === "storage.googleapis.com") {
      const [, bucket, ...resto] = u.pathname.split("/");
      if (bucket && resto.length) return { bucket, caminho: decodeURIComponent(resto.join("/")) };
    }
  } catch {
  }
  return null;
}
function montarAtualizacao(ind, indId, e, anexos, observacoes = []) {
  const texto2 = [String(e.content ?? "").trim(), ...observacoes].filter(Boolean).join("\n").slice(0, 5e3);
  return {
    tipo: "atualizacao",
    id_externo: indId,
    id_mensagem: idMensagemCrm(indId, String(e.id)),
    texto: texto2,
    autor: String(e.author_name || ind.external_seller_name || "Parceiro").slice(0, 120),
    criado_em: Number.isFinite(ms(e.created_at)) ? new Date(e.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
    anexos: anexos.slice(0, MAX_ANEXOS)
  };
}
var d2 = (n) => String(n).padStart(2, "0");
var previsaoDePagamento = (month, year) => `${year}-${d2(month)}-07`;
var num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
var arred = (n) => Math.round(n * 100) / 100;
function baseEPercentual(c) {
  const valor = num(c.value);
  if (!(valor >= 0)) return null;
  const taxa = num(c.rate_applied);
  const coerente = (b) => b > 0 && taxa > 0 && Math.abs(b * taxa / 100 - valor) <= 0.01;
  let base = num(c.base_value_used);
  if (!(base > 0)) {
    base = [num(c.commissionable_value), num(c.base_commission_value)].find(coerente) || 0;
    if (!(base > 0) && taxa > 0 && valor > 0) base = arred(valor / (taxa / 100));
  }
  if (!(base > 0)) return null;
  let pct = taxa;
  if (!(pct > 0)) pct = valor > 0 ? arred(valor / base * 100) : 0;
  if (!(pct > 0)) return null;
  return { base: arred(base), pct, valor: arred(valor) };
}
function montarComissao(c, commId, ind, pedidoEnviado) {
  const pedido = String(pedidoEnviado || ind?.sale_order_number || "").trim();
  if (!pedido) return null;
  const bp = baseEPercentual(c);
  if (!bp) return null;
  return {
    tipo: "comissao",
    id_externo: String(c.indication_id || commId),
    pedido_numero: pedido,
    // só o parceiro e o pedido: nada de vendedor interno nem de desconto
    parceiro: { id: String(c.external_seller_uid || ""), nome: String(c.external_seller_name || ind?.external_seller_name || "") },
    valor_equipamento: bp.base,
    percentual: bp.pct,
    valor_comissao: bp.valor,
    calculada_em: Number.isFinite(ms(c.created_at)) ? new Date(c.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
    previsao_pagamento: c.month && c.year ? previsaoDePagamento(Number(c.month), Number(c.year)) : ""
  };
}
function montarVendaParaCarga(ind, comissao) {
  const out = {};
  const pedido = String(ind?.sale_order_number ?? "").trim();
  if (pedido) out.pedido_numero = pedido;
  const dataPedido = diaDoCrm(ind?.sale_order_date) || diaDoCrm(ind?.sale_date);
  if (dataPedido) out.data_pedido = dataPedido;
  const fat = diaDoCrm(ind?.crm_faturado_em) || diaDoCrm(ind?.sale_date);
  if (fat) out.data_faturamento = fat;
  const entrega = diaDoCrm(ind?.delivery_date);
  if (entrega) out.previsao_entrega = entrega;
  const total = num(ind?.sale_value);
  if (total > 0) out.valor_total = arred(total);
  const prods = Array.isArray(ind?.commissioned_products) && ind.commissioned_products.length ? ind.commissioned_products : [];
  const brutos = prods.length ? prods.map((p) => ({ codigo: p.code, nome: p.name, quantidade: p.quantity, valor: p.base_value })) : (Array.isArray(ind?.items) ? ind.items : []).map((p) => ({ codigo: p.code, nome: p.product_name, quantidade: p.quantity, valor: p.price }));
  const itens = brutos.filter((i) => String(i.nome ?? "").trim() && num(i.valor) > 0).map((i) => ({ ...String(i.codigo ?? "").trim() ? { codigo: String(i.codigo).trim() } : {}, nome: String(i.nome).trim().slice(0, 200), quantidade: num(i.quantidade) > 0 ? num(i.quantidade) : 1, valor: arred(num(i.valor)) }));
  if (itens.length) out.itens = itens;
  const bp = comissao ? baseEPercentual(comissao) : null;
  if (comissao && bp) {
    const c = { valor_equipamento: bp.base, percentual: bp.pct, valor_comissao: bp.valor };
    if (Number.isFinite(ms(comissao.created_at))) c.calculada_em = new Date(comissao.created_at).toISOString();
    if (comissao.month && comissao.year) c.previsao_pagamento = previsaoDePagamento(Number(comissao.month), Number(comissao.year));
    if (comissao.status === "paid") {
      const q = comissao.paid_at || comissao.updated_at;
      if (Number.isFinite(ms(q))) c.paga_em = new Date(q).toISOString();
    }
    out.comissao = c;
  }
  return out;
}
var assinaturaDaComissao = (p) => `${p.pedido_numero}|${p.valor_equipamento}|${p.percentual}|${p.valor_comissao}`;
function montarComissaoPaga(c, commId, ind, pedidoEnviado) {
  const pedido = String(pedidoEnviado || ind?.sale_order_number || "").trim();
  if (!pedido) return null;
  const quando = c.paid_at || c.updated_at;
  return {
    tipo: "comissao_paga",
    id_externo: String(c.indication_id || commId),
    pedido_numero: pedido,
    paga_em: Number.isFinite(ms(quando)) ? new Date(quando).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
  };
}

// server/crmEntrada.ts
var DOC_CONFIG_CRM = "crm_integracao";
var TIMEOUT_ENVIO_MS = 15e3;
var MAX_POR_RODADA = 20;
var JANELA_DO_LACO_MS = 72 * 60 * 60 * 1e3;
var LIMITE_DO_LACO = 500;
async function garantirDataDaVirada(deps) {
  const cfg = deps.config();
  if (cfg.ativoDesde) return cfg.ativoDesde;
  if (!cfg.ativo) return null;
  const ref = deps.db.collection("settings").doc(DOC_CONFIG_CRM);
  const agora = (deps.agora ? deps.agora() : /* @__PURE__ */ new Date()).toISOString();
  return deps.db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.exists ? snap.data() || {} : {};
    if (valida(d.ativo_desde)) return new Date(d.ativo_desde).toISOString();
    const v = valida(d.carga_inicial_em) ? new Date(d.carga_inicial_em).toISOString() : agora;
    tx.set(ref, { ativo_desde: v }, { merge: true });
    return v;
  });
}
var valida = (v) => !!v && !Number.isNaN(new Date(v).getTime());
async function lerDataDaVirada(db2) {
  const s = await db2.collection("settings").doc(DOC_CONFIG_CRM).get();
  const v = s.exists ? s.data()?.ativo_desde : null;
  return v && !Number.isNaN(new Date(v).getTime()) ? new Date(v).toISOString() : null;
}
async function enviarIndicacaoAoCrm(deps, indId, ctx) {
  const { db: db2 } = deps;
  const cfg = deps.config();
  const agora = () => deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  const log = deps.log || console.log;
  if (!podeEnviarAoCrm(cfg)) return { id: indId, resultado: "pulada", motivo: "integracao_desligada" };
  const ref = db2.collection("indications").doc(indId);
  const reservada2 = await db2.runTransaction(async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists) return null;
    const ind2 = s.data();
    const motivo = ctx.modo === "laco" ? motivoNaoEnviarNoLaco(ind2, { ativoDesde: ctx.ativoDesde, agora: agora() }) : motivoNaoEnviarNaCarga(ind2, { agora: agora() });
    if (motivo) return { motivo };
    tx.update(ref, { crm_reservado_ate: new Date(agora().getTime() + RESERVA_ENVIO_MS).toISOString() });
    return { ind: ind2 };
  });
  if (!reservada2) return { id: indId, resultado: "pulada", motivo: "inexistente" };
  if ("motivo" in reservada2) return { id: indId, resultado: "pulada", motivo: reservada2.motivo };
  const ind = reservada2.ind;
  let parceiro = null;
  const uid = String(ind.external_seller_uid || "");
  if (uid) {
    try {
      parceiro = (await db2.collection("users").doc(uid).get()).data() || null;
    } catch {
    }
  }
  const payload = montarPayloadIndicacao(ind, indId, parceiro, {
    // O aviso por e-mail do CRM só vale para indicação realmente NOVA (criada em ou depois da virada).
    // Antigas e sobras enviadas pelo laço vão sem aviso, para não gerar e-mail em massa na virada.
    notificarEmail: ctx.modo === "laco" && valida(ind.created_at) && !!ctx.ativoDesde && new Date(ind.created_at).getTime() >= new Date(ctx.ativoDesde).getTime() ? cfg.notificarEmail : null,
    jaEmNegociacao: ind.status === "negotiating"
  });
  const r = await postarCrm(deps, payload, TIMEOUT_ENVIO_MS);
  if (r.ok) {
    const crmId = r.json && r.json.id != null ? String(r.json.id) : null;
    await ref.update({ crm_enviado_em: agora().toISOString(), crm_id: crmId, crm_reservado_ate: null, crm_ultimo_erro: null, crm_proxima_tentativa_em: null, crm_falhas_transporte: 0 });
    return { id: indId, resultado: "enviada", status: r.status };
  }
  if (r.transitorio) {
    const t = planoDeTransporte(Number(ind.crm_falhas_transporte) || 0, agora());
    await ref.update({ crm_falhas_transporte: t.falhas, crm_ultimo_erro: r.erro, crm_ultima_tentativa_em: agora().toISOString(), crm_reservado_ate: null, crm_proxima_tentativa_em: t.proxima });
    return { id: indId, resultado: "falhou", motivo: r.erro, status: r.status };
  }
  const falha = planoDeFalha(Number(ind.crm_tentativas) || 0, agora());
  await ref.update({
    crm_tentativas: falha.tentativas,
    crm_ultimo_erro: r.erro,
    crm_ultima_tentativa_em: agora().toISOString(),
    crm_reservado_ate: null,
    crm_proxima_tentativa_em: falha.proxima,
    ...falha.desistiu ? { crm_desistiu_em: agora().toISOString() } : {}
  });
  return { id: indId, resultado: falha.desistiu ? "desistiu" : "falhou", motivo: r.erro, status: r.status };
}
var emExecucao = false;
var JANELA_RECENTE_MS = 72 * 60 * 60 * 1e3;
var VARREDURA_COMPLETA_MS = 15 * 60 * 1e3;
var PAGINAS_MAX = 6;
var varredura = /* @__PURE__ */ new WeakMap();
async function paginarPorData(db2, desde) {
  const docs = [];
  let q = db2.collection("indications").where("created_at", ">=", desde).orderBy("created_at").limit(LIMITE_DO_LACO);
  for (let pg = 0; pg < PAGINAS_MAX; pg++) {
    const s = await q.get();
    docs.push(...s.docs);
    if (s.docs.length < LIMITE_DO_LACO) break;
    q = db2.collection("indications").where("created_at", ">=", desde).orderBy("created_at").startAfter(s.docs[s.docs.length - 1]).limit(LIMITE_DO_LACO);
  }
  return docs;
}
async function listarCandidatasDoLaco(db2, ativoDesde, agora, completa = false) {
  const recente = new Date(agora.getTime() - JANELA_RECENTE_MS).toISOString();
  const docs = await paginarPorData(db2, recente);
  if (completa) {
    const s = await db2.collection("indications").where("status", "in", STATUS_ENVIAVEIS).get();
    docs.push(...s.docs);
  }
  const vistos = /* @__PURE__ */ new Set();
  const achadas = [];
  for (const d of docs) {
    if (vistos.has(d.id)) continue;
    vistos.add(d.id);
    const data = d.data() || {};
    if (!motivoNaoEnviarNoLaco(data, { ativoDesde, agora })) achadas.push({ id: d.id, data });
  }
  achadas.sort((x, y) => String(x.data.created_at || "").localeCompare(String(y.data.created_at || "")));
  return achadas;
}
var MAX_HISTORICO_POR_RODADA = 100;
async function marcarCargaInicialFeita(deps, agora) {
  try {
    const ref = deps.db.collection("settings").doc(DOC_CONFIG_CRM);
    await deps.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const d = snap.exists ? snap.data() || {} : {};
      if (!valida(d.carga_inicial_em)) tx.set(ref, { carga_inicial_em: agora.toISOString() }, { merge: true });
    });
  } catch {
  }
}
async function rodarFilaCrm(deps) {
  const cfg = deps.config();
  if (!podeEnviarAoCrm(cfg)) return { pulado: "integracao_desligada", resultados: [] };
  if (emExecucao) return { pulado: "rodada_anterior_em_andamento", resultados: [] };
  emExecucao = true;
  try {
    const desde = await garantirDataDaVirada(deps);
    if (!desde) return { pulado: "sem_data_de_virada", resultados: [] };
    const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
    const est = varredura.get(deps.db) || { proxima: 0, sobrou: false };
    const completa = est.sobrou || agora.getTime() >= est.proxima;
    const candidatas = await listarCandidatasDoLaco(deps.db, desde, agora, completa);
    const corte = new Date(desde).getTime();
    const historicas = candidatas.filter((c) => String(c.data.status) === "negotiating" && !(valida(c.data.created_at) && new Date(c.data.created_at).getTime() >= corte));
    const idsHist = new Set(historicas.map((c) => c.id));
    const normais = candidatas.filter((c) => !idsHist.has(c.id));
    const sobrou = normais.length > MAX_POR_RODADA || historicas.length > MAX_HISTORICO_POR_RODADA;
    if (completa) varredura.set(deps.db, { proxima: agora.getTime() + VARREDURA_COMPLETA_MS, sobrou });
    else if (est.sobrou) varredura.set(deps.db, { ...est, sobrou });
    const resultados = [];
    for (const c of normais.slice(0, MAX_POR_RODADA)) {
      resultados.push(await enviarIndicacaoAoCrm(deps, c.id, { modo: "laco", ativoDesde: desde }));
    }
    let historicoConcluido = completa && historicas.length === 0;
    if (historicas.length) {
      const lr = await enviarLoteComoCarga(deps, historicas.slice(0, MAX_HISTORICO_POR_RODADA).map((c) => c.id), { backoff: true });
      resultados.push(...lr.resultados);
      historicoConcluido = completa && historicas.length <= MAX_HISTORICO_POR_RODADA && lr.resultados.length === historicas.length && lr.resultados.every((x) => x.resultado === "enviada");
    }
    if (historicoConcluido) await marcarCargaInicialFeita(deps, agora);
    return { resultados };
  } finally {
    emExecucao = false;
  }
}
var MAX_ITENS_CARGA = 500;
async function corteDaCarga(deps, gravar) {
  const ref = deps.db.collection("settings").doc(DOC_CONFIG_CRM);
  const agora = (deps.agora ? deps.agora() : /* @__PURE__ */ new Date()).toISOString();
  if (deps.config().ativoDesde && valida(deps.config().ativoDesde)) return new Date(deps.config().ativoDesde).toISOString();
  if (!gravar) {
    const d = (await ref.get()).data() || {};
    return valida(d.ativo_desde) ? new Date(d.ativo_desde).toISOString() : valida(d.carga_inicial_em) ? new Date(d.carga_inicial_em).toISOString() : null;
  }
  return deps.db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.exists ? snap.data() || {} : {};
    if (valida(d.ativo_desde)) return new Date(d.ativo_desde).toISOString();
    if (valida(d.carga_inicial_em)) return new Date(d.carga_inicial_em).toISOString();
    tx.set(ref, { carga_inicial_em: agora }, { merge: true });
    return agora;
  });
}
async function cargaInicialCrm(deps, o = {}) {
  const cfg = deps.config();
  if (!o.simulacao && !podeCargaAoCrm(cfg)) return { ok: false, status: 409, error: "Configure CRM_CHAVE (e confira CRM_URL) antes de enviar. Use a simula\xE7\xE3o para s\xF3 contar." };
  const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  const log = deps.log || console.log;
  const corte = await corteDaCarga(deps, !o.simulacao);
  const s = await deps.db.collection("indications").where("status", "in", STATUS_DA_CARGA).get();
  const elegiveis = [];
  const porMotivo = {};
  for (const d of s.docs) {
    const data = d.data() || {};
    let m = motivoNaoEnviarNaCarga(data, { agora });
    if (!m && corte && data.status === "negotiating" && valida(data.created_at) && new Date(data.created_at).getTime() >= new Date(corte).getTime()) m = "depois_do_corte";
    if (m) {
      porMotivo[m] = (porMotivo[m] || 0) + 1;
      continue;
    }
    elegiveis.push({ id: d.id, status: String(data.status), criada: String(data.created_at || "") });
  }
  elegiveis.sort((a, b) => a.criada.localeCompare(b.criada));
  const porStatus = {};
  elegiveis.forEach((e) => {
    porStatus[e.status] = (porStatus[e.status] || 0) + 1;
  });
  if (o.simulacao) return { ok: true, simulacao: true, elegiveis: elegiveis.length, por_status: porStatus, descartadas: porMotivo, corte, pendentes_novas: porMotivo.vai_como_nova || 0, em_negociacao: porStatus.negotiating || 0, vendidas: porStatus.sold || 0, total_carga: elegiveis.length, proximo_lote: Math.min(elegiveis.length, Math.min(Math.max(Math.floor(o.limite || 200), 1), MAX_ITENS_CARGA)), vendas_diretas_fora: porMotivo.venda_direta || 0 };
  const limite = Math.min(Math.max(Math.floor(o.limite || 200), 1), MAX_ITENS_CARGA);
  const lote = elegiveis.slice(0, limite);
  const lr = await enviarLoteComoCarga(deps, lote.map((e) => e.id), { backoff: false });
  if (!lr.tentadas) return { ok: true, simulacao: false, elegiveis: elegiveis.length, tentadas: 0, enviadas: 0, falhas: 0, restantes: elegiveis.length, resumo: lr.resumo };
  if ("erro" in lr && lr.erro !== void 0) return { ok: true, simulacao: false, elegiveis: elegiveis.length, tentadas: lr.tentadas, enviadas: 0, falhas: lr.tentadas, restantes: elegiveis.length, erro: lr.erro, resumo: lr.resumo };
  return { ok: true, simulacao: false, elegiveis: elegiveis.length, tentadas: lr.tentadas, enviadas: lr.enviadas, falhas: lr.tentadas - lr.enviadas, restantes: Math.max(elegiveis.length - lr.enviadas, 0), resumo: lr.resumo };
}
async function reenviarCargaCrm(deps) {
  const cfg = deps.config();
  if (!podeCargaAoCrm(cfg)) return { ok: false, status: 409, error: "Configure CRM_CHAVE (e confira CRM_URL) antes de enviar." };
  const s = await deps.db.collection("indications").where("crm_carga_inicial", "==", true).get();
  const ids = s.docs.map((d) => d.id).slice(0, MAX_ITENS_CARGA);
  const lr = await enviarLoteComoCarga(deps, ids, { backoff: false, reenvio: true });
  return { ok: true, tentadas: lr.tentadas, enviadas: lr.enviadas, falhas: lr.tentadas - lr.enviadas, erro: lr.erro, resumo: lr.resumo };
}
async function enviarLoteComoCarga(deps, ids, o) {
  const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  const log = deps.log || console.log;
  const itens = [];
  const reservadas = [];
  const parceiros = /* @__PURE__ */ new Map();
  for (const id of ids) {
    const ref = deps.db.collection("indications").doc(id);
    const r2 = await deps.db.runTransaction(async (tx) => {
      const sn = await tx.get(ref);
      if (!sn.exists) return null;
      const ind = sn.data();
      if (motivoNaoEnviarNaCarga(o.reenvio ? { ...ind, crm_enviado_em: null, crm_desistiu_em: null } : ind, { agora })) return null;
      tx.update(ref, { crm_reservado_ate: new Date(agora.getTime() + RESERVA_ENVIO_MS).toISOString() });
      return ind;
    });
    if (!r2) continue;
    const uid = String(r2.external_seller_uid || "");
    if (uid && !parceiros.has(uid)) {
      try {
        parceiros.set(uid, (await deps.db.collection("users").doc(uid).get()).data() || null);
      } catch {
        parceiros.set(uid, null);
      }
    }
    const item = montarPayloadIndicacao(r2, id, parceiros.get(uid) || null, { jaEmNegociacao: r2.status === "negotiating" });
    if (r2.status === "sold") {
      let com = null;
      try {
        const q = await deps.db.collection("commissions").where("indication_id", "==", id).get();
        com = q.docs.length ? q.docs[0].data() : null;
      } catch {
      }
      Object.assign(item, montarVendaParaCarga(r2, com));
    }
    itens.push(item);
    reservadas.push({ id, ind: r2 });
  }
  const zero = { recebidos: 0, vinculados: 0, repetidos: 0, ignorados: 0 };
  if (!itens.length) return { tentadas: 0, enviadas: 0, resumo: zero, resultados: [] };
  const r = await postarCrm(deps, { tipo: "carga_inicial", itens });
  const nowIso = agora.toISOString();
  try {
    await deps.db.collection("settings").doc(DOC_CONFIG_CRM).set({
      ultima_carga: { em: nowIso, itens: itens.length, reenvio: !!o.reenvio, http: r.status, ok: r.ok, resposta: (r.json ? JSON.stringify(r.json) : r.erro || "").slice(0, 4e3) }
    }, { merge: true });
  } catch {
  }
  const resultados = [];
  if (!r.ok) {
    for (const x of reservadas) {
      const t = planoDeTransporte(Number(x.ind.crm_falhas_transporte) || 0, agora);
      await deps.db.collection("indications").doc(x.id).update({
        crm_reservado_ate: null,
        ...o.backoff ? { crm_falhas_transporte: t.falhas, crm_proxima_tentativa_em: t.proxima, crm_ultimo_erro: r.erro, crm_ultima_tentativa_em: nowIso } : {}
      });
      resultados.push({ id: x.id, resultado: "falhou", motivo: r.erro, status: r.status });
    }
    if (r.status === 401 || r.status === 403) log("[CRM-CARGA] O CRM recusou a chave (CRM_CHAVE).");
    return { tentadas: reservadas.length, enviadas: 0, erro: r.erro, resumo: zero, resultados };
  }
  const porItem = Array.isArray(r.json?.resultados) ? r.json.resultados : null;
  const recusados = new Set(porItem ? porItem.filter((x) => x && x.ok === false).map((x) => String(x.id_externo)) : []);
  let enviadas = 0;
  for (const x of reservadas) {
    const ref = deps.db.collection("indications").doc(x.id);
    if (recusados.has(x.id)) {
      const f = planoDeFalha(Number(x.ind.crm_tentativas) || 0, agora);
      await ref.update({
        crm_tentativas: f.tentativas,
        crm_ultimo_erro: "recusada pelo CRM na carga",
        crm_ultima_tentativa_em: nowIso,
        crm_reservado_ate: null,
        crm_proxima_tentativa_em: f.proxima,
        ...f.desistiu ? { crm_desistiu_em: nowIso } : {}
      });
      resultados.push({ id: x.id, resultado: f.desistiu ? "desistiu" : "falhou", motivo: "recusada" });
      continue;
    }
    await ref.update({ crm_enviado_em: nowIso, crm_id: null, crm_carga_inicial: true, crm_reservado_ate: null, crm_ultimo_erro: null, crm_proxima_tentativa_em: null, crm_falhas_transporte: 0 });
    resultados.push({ id: x.id, resultado: "enviada" });
    enviadas++;
    if (x.ind.status === "sold") {
      try {
        const q = await deps.db.collection("commissions").where("indication_id", "==", x.id).get();
        for (const c of q.docs) if ((c.data() || {}).crm_nao_aplica_em) await deps.db.collection("commissions").doc(c.id).update({ crm_nao_aplica_em: null, crm_aguardando_paga: true });
      } catch {
      }
    }
  }
  const n = (v, padrao = 0) => Number.isFinite(Number(v)) ? Number(v) : padrao;
  const resumo = { recebidos: n(r.json?.recebidos, reservadas.length), vinculados: n(r.json?.vinculados), repetidos: n(r.json?.repetidos), ignorados: n(r.json?.ignorados) };
  return { tentadas: reservadas.length, enviadas, resumo, resultados };
}
var falhaDeTransporte = (status, erroRede) => erroRede || status === 0 || [401, 403, 408, 429].includes(status) || status >= 500;
function planoDeTransporte(falhasAntes, agora) {
  const falhas = (Number(falhasAntes) || 0) + 1;
  return { falhas, proxima: new Date(agora.getTime() + atrasoDaTentativa(falhas)).toISOString() };
}
var saude = /* @__PURE__ */ new WeakMap();
async function registrarSaude(deps, r) {
  try {
    const est = saude.get(deps.db) || { seguidas: 0, limpo: false };
    const ref = deps.db.collection("settings").doc(DOC_CONFIG_CRM);
    if (r.transitorio) {
      est.seguidas++;
      est.limpo = false;
      saude.set(deps.db, est);
      const motivo = r.status === 401 || r.status === 403 ? `CRM recusou a chave (${r.status}). Confira a CRM_CHAVE.` : r.status ? `CRM com problema (HTTP ${r.status}).` : "Sem conex\xE3o com o CRM.";
      await ref.set({ alerta_transporte: { em: (deps.agora ? deps.agora() : /* @__PURE__ */ new Date()).toISOString(), seguidas: est.seguidas, motivo } }, { merge: true });
    } else if (!est.limpo) {
      est.seguidas = 0;
      est.limpo = true;
      saude.set(deps.db, est);
      await ref.set({ alerta_transporte: null }, { merge: true });
    }
  } catch {
  }
}
async function postarCrm(deps, corpo, timeoutMs = 6e4) {
  const cfg = deps.config();
  let status = 0;
  let texto2 = "";
  let erroRede = "";
  try {
    const f = deps.fetchFn || ((url, init) => fetch(url, init));
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r2 = await f(cfg.url, { method: "POST", headers: { "Content-Type": "application/json", "x-roder-chave": cfg.chave }, body: JSON.stringify(corpo), signal: ctrl.signal });
      status = r2.status;
      texto2 = await r2.text().catch(() => "");
    } finally {
      clearTimeout(t);
    }
  } catch (e) {
    erroRede = e?.name === "AbortError" ? "tempo esgotado" : String(e?.message || "falha de rede").slice(0, 120);
  }
  let json = null;
  try {
    json = JSON.parse(texto2);
  } catch {
  }
  const ok = status >= 200 && status < 300 && json?.ok !== false;
  const transitorio = !ok && falhaDeTransporte(status, !!erroRede);
  const r = { ok, status, json, erro: ok ? "" : (erroRede || `HTTP ${status}`).slice(0, 160), transitorio };
  await registrarSaude(deps, r);
  return r;
}
var atualizacoesEmExecucao = false;
var MAX_ATUALIZACOES_POR_RODADA = 30;
var MAX_COMISSOES_POR_RODADA = 30;
async function prepararAnexos(deps, e) {
  const anexos = [];
  const avisos = [];
  const lista = Array.isArray(e.attachments) ? e.attachments : [];
  for (const a of lista.slice(0, MAX_ANEXOS)) {
    const url = String(a?.url || "");
    const nome = String(a?.name || "arquivo").slice(0, 160);
    if (!/^https:\/\//.test(url)) {
      avisos.push(`[Anexo "${nome}" n\xE3o enviado: est\xE1 guardado s\xF3 no aparelho]`);
      continue;
    }
    const ref = referenciaStorage(url);
    if (!ref || !deps.bucketProprio || ref.bucket !== deps.bucketProprio || !deps.assinarAnexo) {
      avisos.push(`[Anexo "${nome}" n\xE3o enviado: arquivo fora do armazenamento do Roder Indica]`);
      continue;
    }
    let r = null;
    try {
      r = await deps.assinarAnexo(url);
    } catch {
      r = null;
    }
    if (!r || r.tamanho === void 0) {
      avisos.push(`[Anexo "${nome}" n\xE3o enviado: n\xE3o foi poss\xEDvel conferir o arquivo]`);
      continue;
    }
    if (r.tamanho > MAX_ANEXO_BYTES) {
      avisos.push(`[Anexo "${nome}" n\xE3o enviado: passa de 20 MB]`);
      continue;
    }
    anexos.push({ url: r.url || url, tipo: tipoDoAnexo({ name: nome, url }), nome });
  }
  if (lista.length > MAX_ANEXOS) avisos.push(`[${lista.length - MAX_ANEXOS} anexo(s) al\xE9m do limite de ${MAX_ANEXOS} n\xE3o enviado(s)]`);
  return { anexos, avisos };
}
async function paginar(consultaBase, tamanho, paginas) {
  const docs = [];
  let q = consultaBase().limit(tamanho);
  for (let pg = 0; pg < paginas; pg++) {
    const s = await q.get();
    docs.push(...s.docs);
    if (s.docs.length < tamanho) break;
    q = consultaBase().startAfter(s.docs[s.docs.length - 1]).limit(tamanho);
  }
  return docs;
}
var TETO_VARREDURA_COMPLETA = 2e3;
var VARREDURA_ATUALIZACOES_MS = 6 * 60 * 60 * 1e3;
var SOBREPOSICAO_MS = 30 * 60 * 1e3;
var ultimaVarreduraAtu = /* @__PURE__ */ new WeakMap();
async function rodarAtualizacoesCrm(deps) {
  const cfg = deps.config();
  if (!podeEnviarAoCrm(cfg)) return { pulado: "integracao_desligada", enviadas: 0, falhas: 0 };
  if (atualizacoesEmExecucao) return { pulado: "rodada_anterior_em_andamento", enviadas: 0, falhas: 0 };
  atualizacoesEmExecucao = true;
  try {
    const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
    const uniao = deps.arrayUnion || ((...v) => v);
    const est = ultimaVarreduraAtu.get(deps.db) || { completa: 0, rodada: 0 };
    const completa = agora.getTime() - est.completa >= VARREDURA_ATUALIZACOES_MS;
    let docs;
    if (completa) {
      docs = await paginar(() => deps.db.collection("indications").where("crm_enviado_em", ">", "").orderBy("crm_enviado_em", "desc"), 500, TETO_VARREDURA_COMPLETA / 500);
    } else {
      const desde = new Date(est.rodada - SOBREPOSICAO_MS).toISOString();
      docs = await paginar(() => deps.db.collection("indications").where("updated_at", ">=", desde).orderBy("updated_at"), 500, 4);
      const retentar = await deps.db.collection("indications").where("crm_atu_retry", ">", "").get();
      const ja = new Set(docs.map((x) => x.id));
      for (const x of retentar.docs) if (!ja.has(x.id)) docs.push(x);
    }
    let enviadas = 0;
    let falhas = 0;
    let feitas = 0;
    for (const d of docs) {
      const ind = d.data() || {};
      if (!ind.crm_enviado_em || !STATUS_ENVIAVEIS.includes(String(ind.status))) continue;
      const ref = deps.db.collection("indications").doc(d.id);
      const ignorar = entradasParaIgnorar(ind);
      if (ignorar.length) await ref.update({ crm_atualizacoes_ignoradas: uniao(...ignorar) });
      let proximaRetentativa = null;
      for (const e of entradasPendentesDoParceiro(ind)) {
        const falha = ind[`crm_atu_falha_${e.id}`];
        if (falha?.proxima && new Date(falha.proxima).getTime() > agora.getTime()) {
          proximaRetentativa = proximaRetentativa && proximaRetentativa < falha.proxima ? proximaRetentativa : falha.proxima;
          continue;
        }
        if (feitas >= MAX_ATUALIZACOES_POR_RODADA) return { enviadas, falhas };
        feitas++;
        const { anexos, avisos } = await prepararAnexos(deps, e);
        const r = await postarCrm(deps, montarAtualizacao(ind, d.id, e, anexos, avisos));
        if (r.ok) {
          await ref.update({ crm_atualizacoes_enviadas: uniao(String(e.id)) });
          enviadas++;
        } else if (r.transitorio) {
          const t = planoDeTransporte(Number(falha?.t) || 0, agora);
          await ref.update({ [`crm_atu_falha_${e.id}`]: { n: Number(falha?.n) || 0, t: t.falhas, proxima: t.proxima, erro: r.erro }, crm_atu_retry: t.proxima });
          proximaRetentativa = t.proxima;
          falhas++;
        } else {
          const f = planoDeFalha(Number(falha?.n) || 0, agora);
          await ref.update({
            [`crm_atu_falha_${e.id}`]: { n: f.tentativas, t: Number(falha?.t) || 0, proxima: f.proxima, erro: r.erro },
            ...f.desistiu ? { crm_atualizacoes_desistiu: uniao(String(e.id)) } : { crm_atu_retry: f.proxima }
          });
          if (!f.desistiu) proximaRetentativa = f.proxima;
          falhas++;
        }
      }
      if (ind.crm_atu_retry && !proximaRetentativa) await ref.update({ crm_atu_retry: null });
    }
    ultimaVarreduraAtu.set(deps.db, { completa: completa ? agora.getTime() : est.completa, rodada: agora.getTime() });
    return { enviadas, falhas };
  } finally {
    atualizacoesEmExecucao = false;
  }
}
var comissoesEmExecucao = false;
var JANELA_COMISSOES_MS = 14 * 24 * 60 * 60 * 1e3;
var camposDaComissao = (c) => `${Number(c.value) || 0}|${Number(c.base_value_used) || 0}|${Number(c.rate_applied) || 0}|${Number(c.commissionable_value) || 0}|${Number(c.base_commission_value) || 0}`;
async function rodarComissoesCrm(deps) {
  const cfg = deps.config();
  if (!podeEnviarAoCrm(cfg)) return { pulado: "integracao_desligada", enviadas: 0, falhas: 0 };
  if (comissoesEmExecucao) return { pulado: "rodada_anterior_em_andamento", enviadas: 0, falhas: 0 };
  comissoesEmExecucao = true;
  try {
    const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
    const desde = new Date(agora.getTime() - JANELA_COMISSOES_MS).toISOString();
    const col = () => deps.db.collection("commissions");
    const fontes = await Promise.all([
      col().where("crm_aguardando_paga", "==", true).get(),
      col().orderBy("created_at", "desc").limit(100).get(),
      col().where("created_at", ">=", desde).orderBy("created_at", "desc").limit(300).get(),
      col().where("updated_at", ">=", desde).orderBy("updated_at", "desc").limit(300).get()
    ]);
    const vistos = /* @__PURE__ */ new Set();
    const docs = [];
    for (const f of fontes) for (const d of f.docs) if (!vistos.has(d.id)) {
      vistos.add(d.id);
      docs.push(d);
    }
    let enviadas = 0;
    let falhas = 0;
    const inds = /* @__PURE__ */ new Map();
    for (const d of docs) {
      const c = d.data() || {};
      if (c.crm_nao_aplica_em || c.crm_desistiu_em) continue;
      if (c.crm_comissao_enviada_em && (c.status !== "paid" || c.crm_paga_enviada_em) && c.crm_comissao_campos === camposDaComissao(c)) continue;
      const ref = deps.db.collection("commissions").doc(d.id);
      const idInd = String(c.indication_id || d.id);
      if (!inds.has(idInd)) inds.set(idInd, (await deps.db.collection("indications").doc(idInd).get()).data() || null);
      const ind = inds.get(idInd);
      if (!ind || !ind.crm_enviado_em && !STATUS_ENVIAVEIS.includes(String(ind.status))) {
        await ref.update({ crm_nao_aplica_em: agora.toISOString() });
        continue;
      }
      if (!ind.crm_enviado_em) continue;
      const pedidoEnviado = String(c.crm_comissao_pedido_numero || "").trim() || void 0;
      const pedidoAtual = String(ind.sale_order_number ?? "").trim();
      if (pedidoEnviado && pedidoAtual && pedidoAtual !== pedidoEnviado && c.crm_pedido_divergente_registrado !== pedidoAtual) {
        await deps.db.collection("indications").doc(idInd).update({
          negotiation_history: (deps.arrayUnion || ((...v) => v))({
            id: `crm-pedido-divergiu-${d.id}-${pedidoAtual}`.replace(/[^A-Za-z0-9_-]/g, "_"),
            type: "system",
            author_name: "Sistema",
            created_at: agora.toISOString(),
            content: `O n\xFAmero do pedido mudou para ${pedidoAtual} depois de a comiss\xE3o ir ao CRM. O CRM segue com o n\xFAmero ${pedidoEnviado}.`
          })
        });
        await ref.update({ crm_pedido_divergente_registrado: pedidoAtual });
        c.crm_pedido_divergente_registrado = pedidoAtual;
      }
      const pComissao = montarComissao(c, d.id, ind, pedidoEnviado);
      const assinatura = pComissao ? assinaturaDaComissao(pComissao) : "";
      const comissaoPendente = !!pComissao && (!c.crm_comissao_enviada_em || !!c.crm_comissao_assinatura && c.crm_comissao_assinatura !== assinatura);
      const pPaga = c.status === "paid" && !c.crm_paga_enviada_em ? montarComissaoPaga(c, d.id, ind, pedidoEnviado) : null;
      const passos = [];
      if (comissaoPendente) passos.push({ corpo: pComissao, tent: "crm_comissao_tentativas", trans: "crm_comissao_transporte", prox: "crm_comissao_proxima", ok: { crm_comissao_enviada_em: agora.toISOString(), crm_comissao_assinatura: assinatura, crm_comissao_campos: camposDaComissao(c), crm_comissao_pedido_numero: pedidoEnviado || pComissao.pedido_numero, crm_comissao_proxima: null, crm_aguardando_paga: true } });
      if (pPaga && (c.crm_comissao_enviada_em || comissaoPendente)) passos.push({ corpo: pPaga, tent: "crm_paga_tentativas", trans: "crm_paga_transporte", prox: "crm_paga_proxima", ok: { crm_paga_enviada_em: agora.toISOString(), crm_paga_proxima: null, crm_aguardando_paga: false } });
      if (!passos.length && c.crm_comissao_enviada_em && pComissao && c.crm_comissao_campos !== camposDaComissao(c)) await ref.update({ crm_comissao_campos: camposDaComissao(c) });
      for (const p of passos) {
        if (enviadas + falhas >= MAX_COMISSOES_POR_RODADA) return { enviadas, falhas };
        if (c[p.prox] && new Date(c[p.prox]).getTime() > agora.getTime()) break;
        const r = await postarCrm(deps, p.corpo);
        if (r.ok) {
          await ref.update(p.ok);
          enviadas++;
        } else if (r.transitorio) {
          const t = planoDeTransporte(Number(c[p.trans]) || 0, agora);
          await ref.update({ [p.trans]: t.falhas, [p.prox]: t.proxima, crm_ultimo_erro: r.erro });
          falhas++;
          break;
        } else {
          const f = planoDeFalha(Number(c[p.tent]) || 0, agora);
          await ref.update({ [p.tent]: f.tentativas, [p.prox]: f.proxima, crm_ultimo_erro: r.erro, ...f.desistiu ? { crm_desistiu_em: agora.toISOString() } : {} });
          falhas++;
          break;
        }
      }
    }
    return { enviadas, falhas };
  } finally {
    comissoesEmExecucao = false;
  }
}
async function reativarDesistidasCrm(deps) {
  const ind = await deps.db.collection("indications").where("crm_desistiu_em", ">", "").get();
  for (const d of ind.docs) {
    const x = d.data() || {};
    const limpar = {
      crm_desistiu_em: null,
      crm_tentativas: 0,
      crm_proxima_tentativa_em: null,
      crm_ultimo_erro: null,
      crm_reservado_ate: null
    };
    if (Array.isArray(x.crm_atualizacoes_desistiu)) limpar.crm_atualizacoes_desistiu = [];
    for (const k of Object.keys(x)) if (k.startsWith("crm_atu_falha_")) limpar[k] = null;
    await deps.db.collection("indications").doc(d.id).update(limpar);
  }
  const com = await deps.db.collection("commissions").where("crm_desistiu_em", ">", "").get();
  for (const d of com.docs) {
    await deps.db.collection("commissions").doc(d.id).update({
      crm_desistiu_em: null,
      crm_comissao_tentativas: 0,
      crm_comissao_transporte: 0,
      crm_comissao_proxima: null,
      crm_paga_tentativas: 0,
      crm_paga_transporte: 0,
      crm_paga_proxima: null,
      crm_ultimo_erro: null
    });
  }
  return { indicacoes: ind.docs.length, comissoes: com.docs.length };
}
function registrarRotasAdminCrm(app, deps) {
  app.get("/api/admin/crm/estado", async (req, res) => {
    if (!await deps.exigirAdmin(req, res)) return;
    try {
      const cfg = deps.config();
      const desde = await lerDataDaVirada(deps.db) || cfg.ativoDesde;
      let host = "";
      try {
        host = new URL(cfg.url).host;
      } catch {
      }
      const sim = await cargaInicialCrm(deps, { simulacao: true });
      const cfgDoc = (await deps.db.collection("settings").doc(DOC_CONFIG_CRM).get()).data() || {};
      const desistiram = (await deps.db.collection("indications").where("crm_desistiu_em", ">", "").get()).docs.length;
      return res.json({
        ok: true,
        ativo: cfg.ativo,
        tem_chave: !!cfg.chave,
        tem_segredo: !!cfg.segredo,
        destino: host,
        url_valida: cfg.urlValida,
        ativo_desde: desde,
        pode_carga: podeCargaAoCrm(cfg),
        pendentes_da_carga: sim && sim.ok ? sim.elegiveis : null,
        pendentes_como_novas: sim && sim.ok ? sim.pendentes_novas : null,
        desistiram,
        carga_em_negociacao: sim && sim.ok ? sim.em_negociacao : null,
        carga_vendidas: sim && sim.ok ? sim.vendidas : null,
        carga_total: sim && sim.ok ? sim.total_carga : null,
        alerta_transporte: cfgDoc.alerta_transporte || null,
        carga_inicial_em: cfgDoc.carga_inicial_em || null,
        ultima_carga: cfgDoc.ultima_carga || null
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e?.message || "Erro." });
    }
  });
  app.post("/api/admin/crm/carga-inicial", async (req, res) => {
    if (!await deps.exigirAdmin(req, res)) return;
    try {
      const r = await cargaInicialCrm(deps, { simulacao: req.body?.simulacao === true, limite: Number(req.body?.limite) || void 0 });
      return res.status(r.ok ? 200 : r.status).json(r);
    } catch (e) {
      (deps.log || console.error)("[CRM-CARGA] Erro:", e?.message);
      return res.status(500).json({ ok: false, error: "N\xE3o consegui concluir a carga. Tente de novo." });
    }
  });
  app.post("/api/admin/crm/reenviar-carga", async (req, res) => {
    if (!await deps.exigirAdmin(req, res)) return;
    try {
      const r = await reenviarCargaCrm(deps);
      return res.status(r.ok ? 200 : r.status).json(r);
    } catch (e) {
      (deps.log || console.error)("[CRM-CARGA] Erro no reenvio:", e?.message);
      return res.status(500).json({ ok: false, error: "N\xE3o consegui reenviar a carga. Tente de novo." });
    }
  });
  app.post("/api/admin/crm/reativar", async (req, res) => {
    if (!await deps.exigirAdmin(req, res)) return;
    try {
      return res.json({ ok: true, ...await reativarDesistidasCrm(deps) });
    } catch (e) {
      (deps.log || console.error)("[CRM-REATIVAR] Erro:", e?.message);
      return res.status(500).json({ ok: false, error: "N\xE3o consegui reativar. Tente de novo." });
    }
  });
}

// server/relatoriosComissao.ts
var FUSO_BR2 = "America/Sao_Paulo";
function mesEmBrasilia(agora) {
  const [y, m] = agora.toLocaleDateString("en-CA", { timeZone: FUSO_BR2 }).split("-").map(Number);
  return { month: m, year: y };
}
var mesAnterior = (c) => c.month === 1 ? { month: 12, year: c.year - 1 } : { month: c.month - 1, year: c.year };
var pago = (st) => !!st && st.status === "paid";
async function comissoesDoCiclo(db2, ciclo) {
  const ant = mesAnterior(ciclo);
  const ler = async (c, acumulado) => {
    const s = await db2.collection("commissions").where("month", "==", c.month).where("year", "==", c.year).get();
    return s.docs.map((d) => ({ id: d.id, ...d.data(), acumulado }));
  };
  const todas = [...await ler(ciclo, false), ...await ler(ant, true)].filter((c) => c.status !== "paid" && c.external_seller_uid && (Number(c.value) || 0) > 0);
  const extratos = /* @__PURE__ */ new Map();
  for (const c of todas) {
    const id = `${c.external_seller_uid}_${c.month}_${c.year}`;
    if (!extratos.has(id)) {
      const st = await db2.collection("monthly_statements").doc(id).get();
      extratos.set(id, st.exists ? st.data() : null);
    }
  }
  return todas.filter((c) => !pago(extratos.get(`${c.external_seller_uid}_${c.month}_${c.year}`)));
}
function agruparPorParceiro(comissoes) {
  const m = /* @__PURE__ */ new Map();
  for (const c of comissoes) {
    const g = m.get(c.external_seller_uid) || { uid: c.external_seller_uid, nome: c.external_seller_name || "", itens: [], total: 0 };
    g.itens.push(c);
    g.total += Number(c.value) || 0;
    m.set(c.external_seller_uid, g);
  }
  return Array.from(m.values()).sort((a, b) => b.total - a.total);
}
async function comTravaMensal(db2, tarefa, ciclo, fn) {
  const id = `${tarefa}_${ciclo.year}-${String(ciclo.month).padStart(2, "0")}`;
  const ref = db2.collection("cron_locks").doc(id);
  try {
    await ref.create({ job: tarefa, month: ciclo.month, year: ciclo.year, started_at: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (e) {
    if (e?.code === 6) console.log(`[CRON] ${id}: j\xE1 executado ou em execu\xE7\xE3o.`);
    else console.error(`[CRON] ${id}: n\xE3o consegui criar a trava:`, e?.message);
    return false;
  }
  try {
    const r = await fn();
    await ref.set({ finished_at: (/* @__PURE__ */ new Date()).toISOString(), ...r && typeof r === "object" ? r : {} }, { merge: true });
  } catch (e) {
    await ref.set({ error: String(e?.message || e), failed_at: (/* @__PURE__ */ new Date()).toISOString() }, { merge: true }).catch(() => {
    });
    console.error(`[CRON] ${id}: erro:`, e?.message);
  }
  return true;
}
async function lerIndicacoes(db2, ids) {
  const m = /* @__PURE__ */ new Map();
  for (const id of Array.from(new Set(ids.filter(Boolean)))) {
    const s = await db2.collection("indications").doc(id).get();
    if (s.exists) m.set(id, s.data());
  }
  return m;
}
async function lerAvisos(db2) {
  const s = await db2.collection("settings").doc("notifications").get();
  return (s.exists ? s.data() : null) || null;
}
var emailDeVerdade = (e) => !!e && String(e).includes("@") && !String(e).endsWith("@mobile.roder.com.br");
async function relatorioParceirosDia1(deps) {
  const { db: db2, formatCurrency } = deps;
  const notif = await lerAvisos(db2);
  if (!notif?.monthly_report_partners) return "desligado";
  const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  const ciclo = mesEmBrasilia(agora);
  const ant = mesAnterior(ciclo);
  const lastMonth = new Date(ant.year, ant.month - 1, 1);
  return comTravaMensal(db2, "relatorio_parceiros_dia1", ciclo, async () => {
    const grupos = agruparPorParceiro(await comissoesDoCiclo(db2, ciclo));
    const inds = await lerIndicacoes(db2, grupos.flatMap((g) => g.itens.map((c) => c.indication_id)));
    let enviados = 0;
    for (const g of grupos) {
      const partnerData = await db2.collection("users").doc(g.uid).get();
      if (!partnerData.exists) continue;
      const partner = partnerData.data();
      if (!emailDeVerdade(partner.email)) continue;
      const totalCommissions = g.total;
      if (totalCommissions <= 0) continue;
      const monthName = lastMonth.toLocaleString("pt-BR", { month: "long", year: "numeric" });
      const financeReplyTo = deps.getFinanceReplyTo(notif);
      const firstName = String(partner.name || "").split(" ")[0] || "parceiro";
      const linhas = g.itens.map((c) => ({ c, x: inds.get(c.indication_id) || {} }));
      const temAcumulado = g.itens.some((c) => c.acumulado);
      const html = `
        <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 620px;">
          <p style="font-size: 16px;">Ol\xE1, ${firstName}!</p>
          <p style="font-size: 15px; line-height: 1.6;">${temAcumulado ? `Este \xE9 o resumo das suas <strong>comiss\xF5es a receber</strong>: as de <strong>${monthName}</strong> e as de meses anteriores que ficaram acumuladas para este pagamento. Muito obrigado pela parceria e pela confian\xE7a na Roder.` : `\xC9 um prazer informar que as suas indica\xE7\xF5es geraram vendas em <strong>${monthName}</strong>. Muito obrigado pela parceria e pela confian\xE7a na Roder.`}</p>

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
              ${linhas.map(({ c, x }) => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${x.client_name || x.client_person_name || ""}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${x.base_machine || x.product_name || ""}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: bold;">${formatCurrency(Number(c.value) || 0)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; font-size: 14px; line-height: 1.6;">
            <p style="margin: 0;"><strong>Pr\xF3ximo passo: nota fiscal de servi\xE7o</strong></p>
            <p style="margin: 6px 0 0 0;">Nosso setor financeiro est\xE1 aguardando a sua <strong>nota fiscal de servi\xE7o no valor de ${formatCurrency(totalCommissions)}</strong>.</p>
            <p style="margin: 6px 0 0 0;">Basta <strong>responder este e-mail com a nota fiscal anexada</strong> at\xE9 o dia <strong>05</strong>. A resposta vai direto para o nosso financeiro, e o pagamento \xE9 feito at\xE9 o dia <strong>07</strong> (se cair em fim de semana ou feriado, no pr\xF3ximo dia \xFAtil).</p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #6b7280;">Se preferir, voc\xEA tamb\xE9m pode carregar a nota no Roder Indica, na tela Meus ganhos.</p>
          </div>

          <p style="font-size: 14px; margin-top: 24px;">Um abra\xE7o,<br><strong>Equipe Roder M\xE1quinas e Equipamentos</strong></p>
        </div>
      `;
      await deps.enviar(partner.email, temAcumulado ? `Suas comiss\xF5es Roder a receber: ${formatCurrency(totalCommissions)}` : `Sua comiss\xE3o Roder de ${monthName}: ${formatCurrency(totalCommissions)}`, html, { replyTo: financeReplyTo, fromName: "Roder M\xE1quinas" });
      enviados++;
    }
    return { enviados };
  });
}
async function lembreteNfDia5(deps) {
  const { db: db2 } = deps;
  const notif = await lerAvisos(db2);
  if (!notif?.monthly_report_partners) return "desligado";
  const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  const ciclo = mesEmBrasilia(agora);
  return comTravaMensal(db2, "lembrete_nf_dia5", ciclo, async () => {
    const grupos = agruparPorParceiro(await comissoesDoCiclo(db2, ciclo));
    let enviados = 0;
    for (const g of grupos) {
      if (g.total <= 0) continue;
      const candidatos = Array.from(new Set(g.itens.map((c) => `${g.uid}_${c.month}_${c.year}`)));
      let alreadySent = false;
      for (const stId of candidatos) {
        const st = await db2.collection("monthly_statements").doc(stId).get();
        const stData = st.exists ? st.data() : null;
        if (stData && (stData.nf_url || stData.status === "waiting_payment" || stData.status === "paid")) {
          alreadySent = true;
          break;
        }
      }
      if (alreadySent) continue;
      const partnerData = await db2.collection("users").doc(g.uid).get();
      if (!partnerData.exists) continue;
      const partner = partnerData.data();
      if (!emailDeVerdade(partner.email)) continue;
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
            <a href="${deps.appUrl || "https://roder-indica.web.app"}/comissoes" style="display: inline-block; background: #eab308; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Meus ganhos</a>
          </div>
        `;
      await deps.enviar(partner.email, `\xDAltimo dia para enviar a nota fiscal da sua comiss\xE3o Roder`, html, { replyTo: deps.getFinanceReplyTo(notif), fromName: "Roder M\xE1quinas" });
      enviados++;
    }
    return { enviados };
  });
}
function emailsDoFinanceiro(notif) {
  const financeEmails = ["financeiro@roderbrasil.com.br", "financeiro2@roderbrasil.com.br", "jeferson@roderbrasil.com.br"];
  if (notif?.finance_email) {
    String(notif.finance_email).split(",").map((e) => e.trim()).filter(Boolean).forEach((email) => {
      if (!financeEmails.map((x) => x.toLowerCase()).includes(email.toLowerCase())) financeEmails.push(email);
    });
  }
  return financeEmails;
}
function dataDaVenda(ind) {
  return String(ind.sale_date || ind.sale_order_date || "").slice(0, 10) || (ind.updated_at ? new Date(ind.updated_at).toLocaleDateString("en-CA", { timeZone: FUSO_BR2 }) : "");
}
async function relatorioDiretoriaDia1(deps) {
  const { db: db2, formatCurrency } = deps;
  const notif = await lerAvisos(db2);
  if (!notif?.monthly_report_directors) return "desligado";
  const now = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  const ciclo = mesEmBrasilia(now);
  const ant = mesAnterior(ciclo);
  const lastMonth = new Date(ant.year, ant.month - 1, 1);
  const prefixoMes = `${ant.year}-${String(ant.month).padStart(2, "0")}`;
  return comTravaMensal(db2, "relatorio_diretoria_dia1", ciclo, async () => {
    const indicationsSnap = await db2.collection("indications").where("status", "==", "sold").get();
    const negotiatingSnap = await db2.collection("indications").where("status", "==", "negotiating").get();
    const monthlySales = indicationsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => dataDaVenda(d).startsWith(prefixoMes));
    const activeNegotiations = negotiatingSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => {
      if (!d.budget_date) return false;
      const daysOld = (now.getTime() - new Date(d.budget_date).getTime()) / (1e3 * 60 * 60 * 24);
      return daysOld <= 60;
    });
    const comissoes = await comissoesDoCiclo(db2, ciclo);
    const grupos = agruparPorParceiro(comissoes);
    const indsComissao = await lerIndicacoes(db2, comissoes.map((c) => c.indication_id));
    if (monthlySales.length === 0 && activeNegotiations.length === 0 && comissoes.length === 0) return { enviados: 0 };
    const totalSalesValue = monthlySales.reduce((acc, curr) => acc + (curr.sale_value || 0), 0);
    const totalCommissions = grupos.reduce((acc, g) => acc + g.total, 0);
    const totalNegotiatingValue = activeNegotiations.reduce((acc, curr) => acc + (curr.sale_value || 0), 0);
    const sellersMap = {};
    monthlySales.forEach((sale) => {
      const sid = sale.external_seller_uid || `nome:${sale.external_seller_name || ""}`;
      if (!sellersMap[sid]) sellersMap[sid] = { name: sale.external_seller_name, count: 0, total: 0, saleTimes: [] };
      sellersMap[sid].count++;
      sellersMap[sid].total += sale.sale_value || 0;
      if (sale.created_at && sale.updated_at) {
        const t = (new Date(sale.updated_at).getTime() - new Date(sale.created_at).getTime()) / (1e3 * 60 * 60 * 24);
        sellersMap[sid].saleTimes.push(t);
      }
    });
    const sellersRanking = Object.values(sellersMap).sort((a, b) => b.total - a.total);
    const monthName = lastMonth.toLocaleString("pt-BR", { month: "long", year: "numeric" });
    const html = `
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
      ...notif.manager_emails ? String(notif.manager_emails).split(",").map((e) => e.trim()) : [],
      ...notif.director_emails ? String(notif.director_emails).split(",").map((e) => e.trim()) : []
    ].filter((e) => e !== "");
    let enviados = 0;
    for (const email of recipients) {
      await deps.enviar(email, `Relat\xF3rio de Vendas Roder - ${monthName}`, html);
      enviados++;
    }
    const detailedSellers = await Promise.all(grupos.map(async (g) => {
      const userDoc = await db2.collection("users").doc(g.uid).get();
      const userData = userDoc.exists ? userDoc.data() || {} : null;
      return {
        name: userData && userData.name || g.nome,
        commissions: g.total,
        pix_key: userData ? userData.pix_key || "N\xE3o informado" : "-",
        bank_info: userData && userData.bank_info || { bank: "-", agency: "-", account: "-" }
      };
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
            ${comissoes.map((c) => {
      const sale = indsComissao.get(c.indication_id) || {};
      return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.client_name || "N\xE3o informado"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${c.external_seller_name || sale.external_seller_name || "-"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.product_name || sale.base_machine || "-"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(sale.sale_value || 0)}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatCurrency(Number(c.base_value_used) || 0)}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${c.rate_applied !== void 0 && c.rate_applied !== null ? `${c.rate_applied}%` : "-"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #16a34a;">${formatCurrency(Number(c.value) || 0)}</td>
              </tr>
            `;
    }).join("")}
            ${comissoes.length === 0 ? '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #64748b;">Nenhum faturamento registrado no m\xEAs anterior.</td></tr>' : ""}
          </tbody>
        </table>

        <p style="margin-top: 25px; font-size: 12px; color: #666; font-style: italic;">
          * Por favor, verifique se os vendedores enviaram as Notas Fiscais no sistema antes de efetivar o pagamento.
        </p>
      </div>
    `;
    for (const email of emailsDoFinanceiro(notif)) {
      await deps.enviar(email, `Financeiro: Relat\xF3rio de Pagamentos - ${monthName}`, financeHtml);
      enviados++;
    }
    return { enviados };
  });
}
async function lembreteFinanceiroDia7(deps) {
  const { db: db2, formatCurrency } = deps;
  const notif = await lerAvisos(db2);
  if (!notif?.payment_reminder_finance) return "desligado";
  const agora = deps.agora ? deps.agora() : /* @__PURE__ */ new Date();
  const ciclo = mesEmBrasilia(agora);
  return comTravaMensal(db2, "lembrete_financeiro_dia7", ciclo, async () => {
    const monthlyCommissions = (await comissoesDoCiclo(db2, ciclo)).reduce((acc, c) => acc + (Number(c.value) || 0), 0);
    if (monthlyCommissions === 0) return { enviados: 0 };
    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #0f172a;">Lembrete de Pagamento de Comiss\xF5es</h2>
        <p>Ol\xE1 Setor Financeiro / Jeferson,</p>
        <p>Hoje \xE9 dia 7. Lembramos que o valor total de comiss\xF5es calculadas para o fechamento do m\xEAs anterior \xE9 de:</p>
        <div style="font-size: 36px; font-weight: 900; color: #eab308; margin: 20px 0;">${formatCurrency(monthlyCommissions)}</div>
        <p>Ap\xF3s realizar os pagamentos, por favor, certifique que as notas fiscais foram enviadas no sistema e carregue os respectivos comprovantes para notificar os parceiros.</p>
      </div>
    `;
    let enviados = 0;
    for (const email of emailsDoFinanceiro(notif)) {
      await deps.enviar(email, `URGENTE: Pagamento de Comiss\xF5es do M\xEAs`, html);
      enviados++;
    }
    return { enviados };
  });
}
var TRAVA_LIGAR_EMAILS = "ligar_emails_comissao_v1";
async function ligarEmailsComissaoUmaVez(db2, agora = /* @__PURE__ */ new Date()) {
  const trava = db2.collection("cron_locks").doc(TRAVA_LIGAR_EMAILS);
  try {
    await trava.create({ job: TRAVA_LIGAR_EMAILS, started_at: agora.toISOString() });
  } catch (e) {
    if (e?.code === 6) return "ja_rodou";
    console.error("[EMAILS-COMISSAO] N\xE3o consegui criar a trava:", e?.message);
    return "erro";
  }
  try {
    const flags = { monthly_report_partners: true, monthly_report_directors: true, payment_reminder_finance: true };
    await db2.collection("settings").doc("notifications").set({ ...flags, updated_at: agora.toISOString() }, { merge: true });
    await trava.set({ finished_at: (/* @__PURE__ */ new Date()).toISOString(), ...flags }, { merge: true });
    console.log("[EMAILS-COMISSAO] Ligados: e-mail do parceiro (dia 1 e dia 5), relat\xF3rio da diretoria (dia 1) e lembrete ao financeiro (dia 7).");
    return "ligado";
  } catch (e) {
    await trava.delete().catch(() => {
    });
    console.error("[EMAILS-COMISSAO] Erro ao ligar:", e?.message);
    return "erro";
  }
}

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
  const norm2 = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const STOP = /* @__PURE__ */ new Set(["de", "da", "do", "das", "dos", "para", "com", "e", "o", "a", "roder", "modelo", "equipamento", "foto", "imagem"]);
  const tokens = (v) => norm2(v).split(/[^a-z0-9]+/).filter((t) => t.length >= 2 && !STOP.has(t));
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
var bibliotecaVideos = criarBibliotecaVideos({ db });
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
var REGEX_MARCA_TRATOR = /\b(case\s*ih|case|new\s*holland|nh|john\s*deere|deere|jd|massey|mf\s*\d{3,4}|mf|valtra|fendt|deutz|claas|ls\s*tractor|mahindra|agrale|yanmar|puma|magnum|optum|axion|arion|t7|t8|7r|8r|6r|7j|6j|7m|vario|dyna-?vt|dyna-?6|cvx|auto\s*command|power\s*command|autopowr|eautopowr|e23|hitech)\b/i;
var REGEX_TRATOR_COM_NUMERO = /\b(trator|tractor)\b[^\n]{0,40}\d{2,4}/i;
var REGEX_FRESA = /\b(fresa|fresas|fresagem|ssh|ssh\s*\d{3})\b/i;
function pedeConsultaDeTrator(question, chatHistory) {
  const pergunta = String(question || "");
  if (!REGEX_MARCA_TRATOR.test(pergunta) && !REGEX_TRATOR_COM_NUMERO.test(pergunta)) return false;
  if (REGEX_FRESA.test(pergunta)) return true;
  const recentes = Array.isArray(chatHistory) ? chatHistory.slice(-6) : [];
  return recentes.some((m) => REGEX_FRESA.test(String(m?.content || "")));
}
async function consultarTratorNaInternet(ai, question, chatHistory) {
  const recentesDoUsuario = (Array.isArray(chatHistory) ? chatHistory : []).filter((m) => m?.role === "user").slice(-2).map((m) => String(m?.content || "").slice(0, 400));
  const prompt = `Um vendedor no Brasil quer saber se o trator do cliente serve para uma fresa trituradora de tocos que exige transmiss\xE3o CVT (vari\xE1vel cont\xEDnua) e TDP de 1000 rpm.
Mensagens do vendedor (a mais recente por \xFAltimo):
${[...recentesDoUsuario, String(question || "").slice(0, 600)].map((t) => "- " + t).join("\n")}

Pesquise na internet o modelo de trator citado, de prefer\xEAncia a vers\xE3o vendida no Brasil, e responda em portugu\xEAs, no m\xE1ximo 5 linhas curtas, neste formato:
Modelo: ...
Transmiss\xE3o: ... (nome comercial)
CVT: de s\xE9rie / opcional / n\xE3o tem / incerto
Pot\xEAncia: ... cv
TDP 1000 rpm: sim / opcional / incerto
Super redutor (creeper) e powershift n\xE3o contam como CVT. Se o modelo n\xE3o estiver claro ou as fontes n\xE3o confirmarem, escreva "incerto" no item. N\xE3o invente.`;
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), 12e3);
  try {
    const resposta = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0, abortSignal: controle.signal }
    });
    const texto2 = String(resposta?.text || "").trim();
    if (texto2) return texto2.slice(0, 800);
  } catch (err) {
    console.warn("[engineerHelper] Consulta do trator falhou:", err?.message || err);
  } finally {
    clearTimeout(relogio);
  }
  return null;
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
  app.use((req, res, next) => {
    if (/\.(cjs|map|env)$/i.test(req.path) || /^\/server\.(ts|js)$/i.test(req.path) || /service-account|firebase-adminsdk/i.test(req.path) || /^\/\.(?!well-known)/.test(req.path)) {
      return res.status(404).send("Not found");
    }
    next();
  });
  const PORT = process.env.PORT || 3e3;
  app.use((0, import_cors.default)({
    origin: function(origin, callback) {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cache-Control", "Pragma"]
  }));
  const configCrm = () => lerConfigCrm(process.env);
  registrarRotaEventosCrm(app, import_express.default, { db, arrayUnion: (...v) => import_firebase_admin.default.firestore.FieldValue.arrayUnion(...v), config: configCrm });
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use("/api/", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  const uploadsDir = import_path.default.join(process.cwd(), "uploads");
  if (!import_fs.default.existsSync(uploadsDir)) {
    import_fs.default.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  }, import_express.default.static(uploadsDir));
  const RELEASE_LABEL = "2026-10-25 videos-af400";
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
  app.use(
    ["/api/v1/api-keys"],
    async (req, res, next) => {
      if (req.method === "OPTIONS") return next();
      if (ehGestao(await quemChama(req))) return next();
      if (negarSessaoRevogada(req, res)) return;
      return res.status(403).json({ success: false, error: "Acesso restrito \xE0 gest\xE3o." });
    }
  );
  app.post("/api/v1/api-keys/generate", async (req, res) => {
    try {
      const { name, permissions, created_by } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ success: false, error: "O nome do aplicativo ou destino \xE9 obrigat\xF3rio." });
      }
      const randomHex = import_crypto4.default.randomBytes(16).toString("hex");
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
      let parsedKits = parseKitsText(text);
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
      if (!ehEquipe(await quemChama(req))) {
        if (negarSessaoRevogada(req, res)) return;
        return res.status(401).json({ error: "Entre no app para enviar arquivos." });
      }
      if (!/\.(jpe?g|jfif|png|webp|gif|heic|heif|pdf|webm|m4a|mp3|ogg|wav|docx?|xlsx?)$/i.test(String(fileName))) {
        return res.status(400).json({ error: "Tipo de arquivo n\xE3o aceito (html e scripts n\xE3o entram)." });
      }
      if (docName && !/^[a-z0-9_-]{1,80}$/i.test(String(docName))) {
        return res.status(400).json({ error: "Documento inv\xE1lido." });
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
  async function quemChama(req) {
    try {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token || token.length < 100) return null;
      let dec;
      try {
        dec = await import_firebase_admin.default.auth().verifyIdToken(token, true);
      } catch (e) {
        if (e?.code === "auth/id-token-revoked") req.sessaoRevogada = true;
        return null;
      }
      if (dec.firebase?.sign_in_provider === "anonymous") return null;
      const email = (dec.email || "").toLowerCase();
      let role = "";
      try {
        const cad = (await db.collection("users").doc(dec.uid).get()).data();
        role = cad?.status === "active" ? String(cad?.role || "") : "";
      } catch {
      }
      role = papelDeQuemChama(dec, role);
      return { uid: dec.uid, email, role };
    } catch {
      return null;
    }
  }
  function negarSessaoRevogada(req, res) {
    if (!req.sessaoRevogada) return false;
    res.status(401).json({ ok: false, success: false, codigo: "token_revogado", error: "Seu acesso precisa ser feito de novo. Entre outra vez com seu e-mail e senha." });
    return true;
  }
  const envioPublicoPorIp = /* @__PURE__ */ new Map();
  const EQUIPE_RODER = ["admin", "manager", "triagem", "internal_seller", "financial", "finance", "fiscal", "marketing", "assistant", "vendedor_padrao"];
  const ehEquipe = (q) => !!q && EQUIPE_RODER.includes(q.role);
  const ehGestao = (q) => !!q && (q.role === "admin" || q.role === "manager");
  app.get("/api/usuarios/regionais", async (req, res) => {
    try {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      const dec = token ? await import_firebase_admin.default.auth().verifyIdToken(token).catch(() => null) : null;
      if (!dec || dec.firebase?.sign_in_provider === "anonymous") return res.status(401).json({ ok: false });
      const snap = await db.collection("users").where("role", "==", "vendedor_padrao").where("status", "==", "active").get();
      const lista = snap.docs.map((d) => {
        const u = d.data();
        return { uid: d.id, name: u.name || "", email: u.email || "", role: "vendedor_padrao", assigned_regions: u.assigned_regions || [] };
      });
      return res.json({ ok: true, lista });
    } catch (e) {
      return res.status(500).json({ ok: false });
    }
  });
  app.post("/api/notificacoes/gestao", async (req, res) => {
    try {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      const dec = token ? await import_firebase_admin.default.auth().verifyIdToken(token).catch(() => null) : null;
      if (!dec || dec.firebase?.sign_in_provider === "anonymous") return res.status(401).json({ ok: false });
      const quemPede = await db.collection("users").doc(dec.uid).get();
      if (!quemPede.exists || quemPede.data()?.status !== "active") return res.status(403).json({ ok: false });
      const { title, message, link, type } = req.body || {};
      if (!title || !message) return res.status(400).json({ ok: false });
      const snap = await db.collection("users").where("role", "in", ["admin", "manager", "triagem"]).get();
      const agora = (/* @__PURE__ */ new Date()).toISOString();
      const lote = db.batch();
      snap.docs.forEach((d) => lote.set(db.collection("notifications").doc(), {
        user_uid: d.id,
        title: String(title).slice(0, 140),
        message: String(message).slice(0, 600),
        link: typeof link === "string" && link.startsWith("/") ? link.slice(0, 200) : null,
        type: ["info", "success", "warning", "error"].includes(type) ? type : "info",
        read: false,
        created_at: agora
      }));
      await lote.commit();
      return res.json({ ok: true, enviados: snap.size });
    } catch (e) {
      return res.status(500).json({ ok: false });
    }
  });
  const REGRAS_API = "https://firebaserules.googleapis.com/v1";
  const lerRegra = (arquivo) => {
    for (const base of [process.cwd(), __entryDirRegras(), import_path.default.resolve(__entryDirRegras(), "..")]) {
      const p = import_path.default.join(base, arquivo);
      if (import_fs.default.existsSync(p)) return import_fs.default.readFileSync(p, "utf8");
    }
    return null;
  };
  function __entryDirRegras() {
    try {
      return process.argv[1] ? import_path.default.dirname(import_fs.default.realpathSync(process.argv[1])) : process.cwd();
    } catch {
      return process.cwd();
    }
  }
  async function tokenGoogle() {
    const cred = adminApp.options?.credential;
    if (!cred?.getAccessToken) throw new Error("Servidor sem credencial do Firebase.");
    const t = await cred.getAccessToken();
    return t.access_token;
  }
  function nomesRelease() {
    const projeto = config.projectId;
    const banco = config.firestoreDatabaseId || "(default)";
    const bucket = config.storageBucket || `${projeto}.appspot.com`;
    return {
      projeto,
      firestore: banco === "(default)" ? `projects/${projeto}/releases/cloud.firestore` : `projects/${projeto}/releases/cloud.firestore/${banco}`,
      storage: `projects/${projeto}/releases/firebase.storage/${bucket}`
    };
  }
  async function chamarRegras(metodo, url, corpo) {
    const r = await fetch(url, {
      method: metodo,
      headers: { Authorization: `Bearer ${await tokenGoogle()}`, "Content-Type": "application/json" },
      body: corpo ? JSON.stringify(corpo) : void 0
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = new Error(j?.error?.message || `Erro ${r.status} na API de regras`);
      e.status = r.status;
      throw e;
    }
    return j;
  }
  const TRAVA_EMAIL_CONFIRMADO = "marcar_email_confirmado_equipe_v1";
  const COLECAO_SENHAS_PELA_GESTAO = "senhas_definidas_pela_gestao";
  async function ultimasSenhasPelaGestao(limite = 20) {
    const q = await db.collection(COLECAO_SENHAS_PELA_GESTAO).orderBy("quando", "desc").limit(limite).get();
    return q.docs.map((d) => {
      const x = d.data();
      return { quando: x.quando || "", quem_email: x.quem_email || "", quem_papel: x.quem_papel || "", email_alvo: x.email_alvo || "", cadastro_id: x.cadastro_id || "", tipo: x.tipo || "" };
    });
  }
  async function resultadoEmailConfirmado() {
    const t = (await db.collection("cron_locks").doc(TRAVA_EMAIL_CONFIRMADO).get()).data();
    if (!t) return { terminou: false, iniciada_em: null };
    return {
      terminou: !!t.finished_at,
      iniciada_em: t.started_at || null,
      finished_at: t.finished_at || null,
      contas: t.contas ?? null,
      com_senha_sem_confirmar: t.comSenhaSemConfirmar ?? null,
      marcadas: t.marcadas ?? null,
      deixadas: (t.semCadastroAtivo ?? 0) + (t.diretoria ?? 0),
      erros: t.erros ?? 0,
      // rodada antiga gravava só o e-mail (texto); a nova grava e-mail, papel e código do cadastro
      marcadas_emails: Array.isArray(t.marcadas_emails) ? t.marcadas_emails.map((m) => typeof m === "string" ? { email: m, role: "", doc_id: "" } : m) : [],
      pendentes: Array.isArray(t.pendentes) ? t.pendentes : []
    };
  }
  async function exigirAdmin(req, res) {
    const q = await quemChama(req);
    if (negarSessaoRevogada(req, res)) return null;
    if (!q || q.role !== "admin") {
      res.status(403).json({ ok: false, error: "S\xF3 o administrador." });
      return null;
    }
    return q;
  }
  async function exigirGestaoComissao(req, res) {
    const q = await quemChama(req);
    if (negarSessaoRevogada(req, res)) return null;
    if (!ehGestao(q)) {
      res.status(403).json({ ok: false, error: "S\xF3 o administrador ou a ger\xEAncia podem trocar o indicador de uma venda faturada." });
      return null;
    }
    return q;
  }
  registrarRotasAdminCrm(app, { db, config: configCrm, exigirAdmin, arrayUnion: (...v) => import_firebase_admin.default.firestore.FieldValue.arrayUnion(...v) });
  registrarDiagnosticoComissao(app, { db, exigirAdmin, exigirGestao: exigirGestaoComissao, arrayUnion: (...v) => import_firebase_admin.default.firestore.FieldValue.arrayUnion(...v) });
  registrarCorrecoesAutomaticas(app, { db, exigirAdmin });
  registrarConviteConsultor(app, {
    db,
    exigirGestao: async (req, res) => {
      const q = await quemChama(req);
      if (negarSessaoRevogada(req, res)) return null;
      if (!ehGestao(q)) {
        res.status(403).json({ ok: false, error: "S\xF3 o administrador ou a ger\xEAncia." });
        return null;
      }
      return q;
    },
    enviarEmail: async (to, subject, html) => {
      if (!await getEmailTransporter()) throw new Error("O e-mail do app n\xE3o est\xE1 configurado.");
      await sendAutomaticEmail(to, subject, html, { fromName: "Roder Indica" });
    }
  });
  app.get("/api/admin/regras/estado", async (req, res) => {
    if (!await exigirAdmin(req, res)) return;
    try {
      const n = nomesRelease();
      const out = { ok: true };
      for (const alvo of ["firestore", "storage"]) {
        const rel = await chamarRegras("GET", `${REGRAS_API}/${n[alvo]}`).catch((e) => ({ erro: e.message }));
        let fonteAtual = "";
        if (rel.rulesetName) {
          const rs = await chamarRegras("GET", `${REGRAS_API}/${rel.rulesetName}`).catch(() => null);
          fonteAtual = rs?.source?.files?.[0]?.content || "";
        }
        const nova = lerRegra(alvo === "firestore" ? "firestore.rules" : "storage.rules") || "";
        const hist = await db.collection("regras_historico").doc(alvo).get();
        out[alvo] = {
          no_ar: rel.rulesetName || null,
          atualizada_em: rel.updateTime || null,
          erro: rel.erro || null,
          ja_e_a_nova: !!nova && fonteAtual.trim() === nova.trim(),
          pode_voltar: !!hist.data()?.anterior
        };
      }
      out.email_confirmado = await resultadoEmailConfirmado().catch((e) => ({ terminou: false, erro: e.message }));
      out.senhas_pela_gestao = await ultimasSenhasPelaGestao().catch((e) => ({ erro: e.message }));
      return res.json(out);
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  });
  app.post("/api/admin/regras/publicar", async (req, res) => {
    const q = await exigirAdmin(req, res);
    if (!q) return;
    const rodada = await resultadoEmailConfirmado().catch(() => null);
    if (!rodada?.terminou) {
      return res.status(409).json({ ok: false, error: "A confer\xEAncia das contas da equipe ainda n\xE3o terminou. Espere alguns segundos depois de o servidor subir e recarregue esta tela.", feito: {} });
    }
    const alvos = req.body?.alvo === "storage" ? ["storage"] : req.body?.alvo === "firestore" ? ["firestore"] : ["firestore", "storage"];
    const n = nomesRelease();
    const feito = {};
    try {
      for (const alvo of alvos) {
        const fonte = lerRegra(alvo === "firestore" ? "firestore.rules" : "storage.rules");
        if (!fonte) throw new Error(`Arquivo de regras de ${alvo} n\xE3o encontrado no servidor.`);
        const rs = await chamarRegras("POST", `${REGRAS_API}/projects/${n.projeto}/rulesets`, {
          source: { files: [{ name: alvo === "firestore" ? "firestore.rules" : "storage.rules", content: fonte }] }
        });
        const releaseNome = n[alvo];
        const atual = await chamarRegras("GET", `${REGRAS_API}/${releaseNome}`).catch((e) => {
          if (e?.status === 404) return null;
          throw e;
        });
        if (atual?.rulesetName) {
          const fonteNoAr = (await chamarRegras("GET", `${REGRAS_API}/${atual.rulesetName}`))?.source?.files?.[0]?.content || "";
          if (fonteNoAr.trim() === fonte.trim()) {
            feito[alvo] = "ja_estava";
            continue;
          }
        }
        const hist = (await db.collection("regras_historico").doc(alvo).get()).data();
        const anterior = hist?.anterior ? hist.anterior : atual?.rulesetName || null;
        await db.collection("regras_historico").doc(alvo).set({
          anterior,
          nova: rs.name,
          publicado_por: q.email,
          publicado_em: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (atual?.rulesetName) {
          await chamarRegras("PATCH", `${REGRAS_API}/${releaseNome}`, { release: { name: releaseNome, rulesetName: rs.name } });
        } else {
          await chamarRegras("POST", `${REGRAS_API}/projects/${n.projeto}/releases`, { name: releaseNome, rulesetName: rs.name });
        }
        feito[alvo] = rs.name;
      }
      console.log(`[REGRAS] Publicadas por ${q.email}:`, feito);
      return res.json({ ok: true, feito });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message, feito });
    }
  });
  app.post("/api/admin/regras/voltar", async (req, res) => {
    const q = await exigirAdmin(req, res);
    if (!q) return;
    const n = nomesRelease();
    const feito = {};
    try {
      for (const alvo of ["firestore", "storage"]) {
        const h = (await db.collection("regras_historico").doc(alvo).get()).data();
        if (!h?.anterior) continue;
        const releaseNome = n[alvo];
        await chamarRegras("PATCH", `${REGRAS_API}/${releaseNome}`, { release: { name: releaseNome, rulesetName: h.anterior } });
        await db.collection("regras_historico").doc(alvo).set({ anterior: null, voltou_para: h.anterior, voltou_em: (/* @__PURE__ */ new Date()).toISOString(), por: q.email }, { merge: true });
        feito[alvo] = h.anterior;
      }
      console.log(`[REGRAS] Voltadas por ${q.email}:`, feito);
      return res.json({ ok: true, feito });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message, feito });
    }
  });
  app.post("/api/auth/reivindicar-perfil", async (req, res) => {
    try {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return res.status(401).json({ ok: false });
      let dec;
      try {
        dec = await import_firebase_admin.default.auth().verifyIdToken(token, true);
      } catch (e) {
        const codigo = e?.code === "auth/id-token-revoked" ? "token_revogado" : "token_invalido";
        return res.status(401).json({ ok: false, codigo, error: "Seu acesso precisa ser feito de novo. Entre outra vez com seu e-mail e senha." });
      }
      const email = String(dec.email || "").toLowerCase().trim();
      if (!email || dec.firebase?.sign_in_provider === "anonymous") return res.status(401).json({ ok: false });
      const confirmado = !!emailConfiavelDoToken(dec);
      const achados = await db.collection("users").where("email", "==", email).get();
      const porId = new Map(achados.docs.map((d) => [d.id, d]));
      const escolhidos = await escolherPreCadastros({
        cadastros: achados.docs.map((d) => ({ id: d.id, dados: d.data() })),
        uidDoLogin: dec.uid,
        confirmado,
        dec,
        ehContaDeLogin: (id) => import_firebase_admin.default.auth().getUser(id).then(() => true).catch((e) => e?.code !== "auth/user-not-found"),
        marcaDe: async (id) => (await db.collection("senhas_iniciais").doc(id).get()).data()
      });
      const temporarios = escolhidos.map((c) => porId.get(c.id));
      if (!confirmado && temporarios.length === 0) return res.json({ ok: true, merged: false, motivo: "email_nao_confirmado" });
      if (temporarios.length === 0) return res.json({ ok: true, merged: false });
      const realRef = db.collection("users").doc(dec.uid);
      const realSnap = await realRef.get();
      let perfil = realSnap.exists ? { ...realSnap.data() } : {};
      if (perfil.status !== "active") {
        for (const k of ["commission_rate", "is_commissionable", "is_lead_receiver", "assigned_regions"]) delete perfil[k];
      }
      const prioridade = ["admin", "manager", "financial", "triagem", "internal_seller", "marketing", "vendedor_padrao", "external_seller", ""];
      for (const t of temporarios) {
        const td = t.data();
        const iAtual = prioridade.indexOf(perfil.role || "");
        const iTemp = prioridade.indexOf(td.role || "");
        const papel = iAtual !== -1 && iTemp !== -1 && iTemp < iAtual ? td.role : perfil.role || td.role || "external_seller";
        perfil = {
          ...camposDoPreCadastro(td),
          ...perfil,
          role: papel,
          is_lead_receiver: perfil.is_lead_receiver || td.is_lead_receiver || false,
          permissions: {
            sidebar: { ...td.permissions?.sidebar || {}, ...perfil.permissions?.sidebar || {} },
            dashboard_cards: { ...td.permissions?.dashboard_cards || {}, ...perfil.permissions?.dashboard_cards || {} }
          }
        };
      }
      perfil.uid = dec.uid;
      perfil.email = email;
      perfil.status = "active";
      perfil.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      const lote = loteEmPartes(db);
      lote.set(realRef, perfil);
      for (const t of temporarios) {
        const ligados = await Promise.all([
          db.collection("indications").where("internal_seller_uid", "==", t.id).get(),
          db.collection("indications").where("assigned_to_uid", "==", t.id).get(),
          db.collection("fair_leads").where("assigned_to_uid", "==", t.id).get(),
          // Parceiro pré-cadastrado: as indicações lançadas para o cadastro provisório têm de ir
          // junto, senão a regra (só lê o que é dele, pelo uid) esconde todas dele.
          db.collection("indications").where("external_seller_uid", "==", t.id).get(),
          db.collection("indications").where("standard_seller_uid", "==", t.id).get()
        ]);
        ligados[3].forEach((d) => lote.update(d.ref, { external_seller_uid: dec.uid, updated_at: perfil.updated_at }));
        ligados[4].forEach((d) => lote.update(d.ref, { standard_seller_uid: dec.uid, updated_at: perfil.updated_at }));
        ligados[0].forEach((d) => lote.update(d.ref, { internal_seller_uid: dec.uid, updated_at: perfil.updated_at }));
        ligados[1].forEach((d) => lote.update(d.ref, { assigned_to_uid: dec.uid, updated_at: perfil.updated_at }));
        ligados[2].forEach((d) => lote.update(d.ref, { assigned_to_uid: dec.uid, updated_at: perfil.updated_at }));
      }
      const movidos = await moverComissoesDoProvisorio(db, lote, temporarios.map((t) => t.id), dec.uid, perfil.updated_at, perfil.name);
      if (movidos.presos.length) console.warn(`[AUTH] ${email}: ${movidos.presos.length} fechamento(s) do provis\xF3rio n\xE3o puderam ser juntados (pago ou aguardando pagamento).`);
      temporarios.forEach((t) => {
        lote.delete(t.ref);
        lote.delete(db.collection("senhas_iniciais").doc(t.id));
      });
      await lote.commit();
      console.log(`[AUTH] Perfil pr\xE9-cadastrado passado para ${email} (${temporarios.length} provis\xF3rio(s)).`);
      if (!confirmado) {
        await import_firebase_admin.default.auth().updateUser(dec.uid, { emailVerified: true });
        await import_firebase_admin.default.auth().revokeRefreshTokens(dec.uid);
        console.log(`[AUTH] E-mail de ${email} confirmado no primeiro acesso (senha definida pela Roder).`);
        return res.json({ ok: true, merged: true, entrar_de_novo: true });
      }
      return res.json({ ok: true, merged: true });
    } catch (err) {
      console.error("[AUTH] reivindicar-perfil:", err?.message);
      return res.status(500).json({ ok: false });
    }
  });
  app.get("/api/settings/:docName", async (req, res) => {
    try {
      const { docName } = req.params;
      if (!docName) {
        return res.status(400).json({ error: "Nome do documento n\xE3o fornecido." });
      }
      if (!/^engate_rapido/.test(docName) && !ehGestao(await quemChama(req))) {
        if (negarSessaoRevogada(req, res)) return;
        return res.status(403).json({ error: "Acesso restrito." });
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
      if (!ehGestao(await quemChama(req))) {
        if (negarSessaoRevogada(req, res)) return;
        return res.status(403).json({ error: "S\xF3 a gest\xE3o altera configura\xE7\xF5es." });
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
          const localFile = import_path.default.join(uploadsDir, import_path.default.basename(parts[1].split("?")[0]));
          if (localFile.startsWith(uploadsDir) && import_fs.default.existsSync(localFile)) {
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
    const { to, subject, html, replyTo, fromName, attachments } = req.body;
    console.log(`[EMAIL-API] Recebida solicita\xE7\xE3o de envio para: ${to} | Assunto: ${subject}`);
    try {
      let settings = null;
      let destinoFinal = to;
      const quem = await quemChama(req);
      if (!quem) {
        const destinos = (Array.isArray(to) ? to : String(to || "").split(",")).map((e) => String(e).trim().toLowerCase()).filter(Boolean);
        if (destinos.length === 0 || destinos.length > 15) return res.status(400).json({ error: "Destinat\xE1rio inv\xE1lido." });
        const internos = [];
        const externos = [];
        for (const d of destinos) {
          if (d.endsWith("@roderbrasil.com.br") || d === "roderbrasil@gmail.com" || d === "roderindica@gmail.com") {
            internos.push(d);
            continue;
          }
          const achou = await db.collection("users").where("email", "==", d).limit(1).get().catch(() => null);
          if (achou && !achou.empty) internos.push(d);
          else externos.push(d);
        }
        let permitidos = internos;
        if (externos.length === 1 && internos.length === 0) {
          const ip = String(req.ip || req.socket?.remoteAddress || "");
          const agora = Date.now();
          const lista = (envioPublicoPorIp.get(ip) || []).filter((t) => agora - t < 36e5);
          if (lista.length >= 8) return res.status(429).json({ error: "Muitos envios. Tente mais tarde." });
          lista.push(agora);
          envioPublicoPorIp.set(ip, lista);
          if (envioPublicoPorIp.size > 2e3) envioPublicoPorIp.clear();
          permitidos = externos;
        }
        if (permitidos.length === 0) return res.status(403).json({ error: "Envio n\xE3o permitido para este destinat\xE1rio." });
        destinoFinal = permitidos.join(", ");
      }
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
        const toArray = typeof destinoFinal === "string" ? destinoFinal.split(",").map((e) => e.trim()).filter((e) => e !== "") : Array.isArray(destinoFinal) ? destinoFinal : [destinoFinal];
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
          to: destinoFinal,
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
Use as orienta\xE7\xF5es abaixo se a pergunta do usu\xE1rio for similar a estas d\xFAvidas mapeadas de forma priorit\xE1ria para dar a resposta correta. Se alguma orienta\xE7\xE3o abaixo indicar kit, fatia extra ou v\xE1lvulas s\xF3 pelo modelo ou pelo n\xFAmero de s\xE9rie, IGNORE o c\xF3digo e aplique a regra de confirma\xE7\xE3o da m\xE1quina (sem c\xF3digo de kit at\xE9 o vendedor afirmar a configura\xE7\xE3o):
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
                const data = comDestocadorDthCorrigido(doc.data());
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
   - Fresa FAE SSH (trator): marca, modelo e pot\xEAncia do trator. CVT \xE9 obrigat\xF3ria (creeper n\xE3o serve); nunca diga que serve sem saber a transmiss\xE3o.
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
E. ROTATOR DE GARRA FLORESTAL (orienta\xE7\xE3o da Roder): garra R600 ou maior em escavadeira acima de 20 t = sempre com Rotator IR10 (garra CA), para trabalho pesado. Garra R400 a R600 em escavadeira de 12 a 16 t = Rotator de 12 t ou 16 t (preferir 16 t). Nunca indique rotator de 16 t para garra R800/R1000 em m\xE1quina acima de 20 t.
F. INSTALA\xC7\xC3O (o que entra na venda, orienta\xE7\xE3o da Roder). 95% das vendas s\xE3o completas: equipamento, frete, instala\xE7\xE3o pelo t\xE9cnico Roder na cidade do cliente, regulagem e orienta\xE7\xE3o ao operador. Nunca prometa instala\xE7\xE3o onde ela n\xE3o existe:
   - ESCAVADEIRA (garras florestais e tra\xE7adoras, garra rachadora, Clamshell, cabe\xE7otes CMF, feller tesoura e de disco, destocador, sacador, trituradores FAE de escavadeira): instala\xE7\xE3o hidr\xE1ulica completa, adequa\xE7\xE3o e regulagem de press\xE3o. O vendedor pede um v\xEDdeo (bra\xE7o e lan\xE7a com as tubula\xE7\xF5es, comando atr\xE1s do motor de giro, joysticks e pedais e, em CAT nova, porta traseira com a bomba; fotos s\xF3 como complemento) para confirmar se a m\xE1quina tem fatia extra e v\xE1lvula de regulagem de press\xE3o na fatia extra.
   - P\xC1 CARREGADEIRA: Engate R\xE1pido hidr\xE1ulico precisa da 3\xAA fun\xE7\xE3o (linha extra) para engatar e desengatar; vendemos junto o adaptador para a concha original do cliente. Garra Frontal / Top Clamp, Triturador FAE p/ p\xE1 e Carregador Frontal CFR precisam de 3\xAA e 4\xAA fun\xE7\xE3o (CFR: giro hor\xE1rio/anti-hor\xE1rio do rotator e abre/fecha da garra = 4 mangueiras).
   - Ca\xE7amba High Tip e Prolongador com Concha: precisam de uma linha extra bidirecional (3\xAA fun\xE7\xE3o) para o basculante. Se a p\xE1 N\xC3O tem engate r\xE1pido nem linha extra, a Roder instala engate + 3\xAA fun\xE7\xE3o (com 3\xAA e 4\xAA fun\xE7\xE3o o operador n\xE3o precisa trocar a fun\xE7\xE3o entre engate e basculante). Se a p\xE1 J\xC1 tem engate r\xE1pido original e linha extra bidirecional, n\xE3o precisa de instala\xE7\xE3o: a Roder fabrica o equipamento com o gancho traseiro na medida do engate original.
   - Garfo Paleteiro GPR 4500 / GPR 7000: s\xF3 mec\xE2nico, sem instala\xE7\xE3o (vai no lugar dos pinos). Normalmente \xE9 vendido com o engate r\xE1pido, e o garfo j\xE1 vai com o gancho do engate para o operador trocar entre concha e garfo sem descer da m\xE1quina.
   - TRATOR: Mini Skidder MSR 600 / MSR 1000, carreta de arrasto e Clambank: sem instala\xE7\xE3o, o cliente acopla e liga as mangueiras que j\xE1 v\xE3o prontas. Fresa FAE SSH e trituradores FAE de trator (TDP): a Roder entrega, acompanha a primeira instala\xE7\xE3o no trator e orienta o operador no in\xEDcio, porque \xE9 um equipamento mais t\xE9cnico.
   - GUINDASTE: Cabe\xE7ote GMT 035 vai em guindaste (Munck), grua em caminh\xE3o ou grua florestal em trator, N\xC3O em escavadeira. Cabe\xE7ote de Poda GP 150 vai SOMENTE em cesto a\xE9reo (bra\xE7o isolado em caminh\xE3o): tira o cesto de fibra e parafusa o cabe\xE7ote no lugar; o cesto a\xE9reo precisa vir preparado pelo pr\xF3prio fornecedor com 3 linhas bidirecionais (6 mangueiras), normalmente j\xE1 no controle remoto do bra\xE7o.
G. FONTE DA INDICA\xC7\xC3O: n\xE3o cite pessoa como fonte (nada de "Conforme indica\xE7\xE3o de Jeff Roder", "Como me ensinou o Jeff"). Use "A Roder indica" ou "N\xF3s indicamos", mesmo que respostas antigas do hist\xF3rico ou da base aprendida usem outra forma.

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
     \u2022 Escavadeiras de 8 a 13 t: FAE BL2/EX-VT (de 8 a 14 t)
     \u2022 Escavadeiras de 14 a 20 t: FAE UML/EX-VT (de 14 a 20 t), UML/S/EX-VT (a partir de 18 t), UMM/EX-VT (a partir de 20 t), ou Ca\xE7ambas/Garras adequadas como R400 e R600
     \u2022 Escavadeiras de 21 a 35 t: FAE UMM/EX-VT (at\xE9 30 t), UML/S/EX-VT (at\xE9 25 t), BL3/EX-VT
     \u2022 A faixa exata de cada um dos quatro modelos com ficha individual est\xE1 nos FATOS dos trituradores FAE de escavadeira, mais abaixo.
   - Garras Florestais por Escavadeira (REGRAS CR\xCDTICAS DE PORTF\xD3LIO E ESTABILIDADE):
     \u2022 NUNCA indique garras inexistentes como R200 (ela N\xC3O faz parte do cat\xE1logo Roder e n\xE3o existe!). S\xF3 indique garras do cat\xE1logo oficial Roder.
     \u2022 Para escavadeiras de cerca de 7 a 8 toneladas: Normalmente, \xE9 indicada a garra R280 para fazer o carregamento convencional.
     \u2022 Para alimenta\xE7\xE3o de picador em m\xE1quinas de 7 a 8 toneladas (ou na faixa de 7 at\xE9 13 toneladas): \xC9 poss\xEDvel indicar a garra R360 ou a garra R280, dependendo do tipo de material:
       - **Alimenta\xE7\xE3o de Picador com \xC1rvores Inteiras (Eucalipto)**: A melhor e mais recomendada indica\xE7\xE3o \xE9 a **R280**. Ela foi projetada para conseguir pegar os feixes de \xE1rvores e arrast\xE1-las usando a for\xE7a de giro da m\xE1quina base para guiar os p\xE9s das \xE1rvores at\xE9 a boca do picador. Por causa desse grande esfor\xE7o de arrastar as \xE1rvores inteiras, a **R280** \xE9 a escolha ideal.
       - **Alimenta\xE7\xE3o de Picador com Res\xEDduos e Madeiras Tran\xE7adas**: \xC9 poss\xEDvel e indicado recomendar a garra **R360**. Pode ser a **R360 Padr\xE3o** (com pin\xE7a fechada) para manuseio comum de madeira, ou a **R360G** (com unha tipo garfo, aberta), que \xE9 excelente para pegar res\xEDduos, paletes, galhadas (como galhos e restos de p\xE9 de laranja) e res\xEDduos florestais em geral para alimentar o picador.
     \u2022 Cat\xE1logo de Garras Florestais Roder Oficiais: R250 (5-8t), R280 (6-10t), R360 (8-12t), R400 (12-18t), R600 (14-22t), R800 (18-25t), R1000 (22-30t), R1200 (24-35t), R1400 (25-35t).
      \u2022 DIRETRIZ CR\xCDTICA DE DIMENSIONAMENTO PARA ESCAVADEIRAS DE 16 TONELADAS (como John Deere 160) - RECOMENDE GARRAS R400, R600 E R800:
        Se a m\xE1quina base for uma escavadeira de cerca de 16 toneladas (por exemplo, John Deere 160 LC ou similar), siga rigorosamente as seguintes indica\xE7\xF5es t\xE9cnicas oficiais da Roder:
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
      \u2022 **REGRA DA RODER (vale acima das outras)**: garras R600 at\xE9 as maiores (R800, R1000, R1200, R1400) em escavadeiras ACIMA de 20 toneladas: orientar sempre garra com **Rotator IR10** (garra CA, cabe\xE7ote alto), para aguentar o trabalho pesado. Garras R400 at\xE9 R600 em escavadeiras de 12 a 16 toneladas: pode ser **Rotator de 12 t ou 16 t** (garra CB), dando prefer\xEAncia ao de 16 t, que tem o mesmo pre\xE7o e costuma ter estoque.
      \u2022 **Rotatores para Garras Tra\xE7adoras (Porte M\xE9dio e Grande)**: H\xE1 duas op\xE7\xF5es principais: 1) **Rotator IR10**; ou 2) **Rotor de giro livre RR550-7** (Capacidade 55t, swivel 7 passagens, giro livre ilimitado).
      \u2022 **COMPATIBILIDADE RR550-7**: O Rotator RR550-7 \xE9 indicado estritamente para as garras **GT 600X e modelos acima**.
      \u2022 ATEN\xC7\xC3O \xC0 GRAFIA: O termo correto \xE9 estritamente **Rotator** (com "t"). NUNCA use o termo "Rotador" sob nenhuma hip\xF3tese.
${REGRA_KIT_CONFIRMACAO}
   - DIRETRIZ CR\xCDTICA PARA INSTALA\xC7\xC3O DE GARRA EM ESCAVADEIRAS SEM FATIA EXTRA DE COMANDO (MUITO IMPORTANTE):
      \u2022 Se o vendedor perguntar sobre a instala\xE7\xE3o de garras em escavadeiras que, **depois de confirmado**, N\xC3O possuem a fatia extra de comando original (a aus\xEAncia nunca se presume pelo modelo; s\xF3 vale quando confirmado: PC200, PC210, Volvo 200 e outros variam de m\xE1quina para m\xE1quina):
        - **Solu\xE7\xE3o T\xE9cnico-Oficial**: S\xF3 se o vendedor AFIRMAR que a m\xE1quina n\xE3o tem fatia extra, o kit \xE9 o **Kit de Instala\xE7\xE3o de Garra para M\xE1quinas sem Fatia Extra - C\xF3digo 9000.9000.9016**. ${RESSALVA_KIT}
        - **Como Funciona o Kit 9000.9000.9016**: Este kit deriva a press\xE3o hidr\xE1ulica diretamente da bomba principal da escavadeira para alimentar uma v\xE1lvula com duas solenoides. Como opera com baixo fluxo, ele \xE9 utilizado exclusivamente para fazer a rota\xE7\xE3o do rotator de forma independente, sem necessitar de uma fatia extra no comando principal. O 9016 deriva da bomba principal e N\xC3O \xE9 o kit de baixa.
        - **Condi\xE7\xE3o Cr\xEDtica/Defici\xEAncia que o Cliente DEVE Saber**: Como a vaz\xE3o \xE9 derivada diretamente da bomba principal, quando a escavadeira est\xE1 est\xE1tica (ou seja, quando o operador n\xE3o est\xE1 executando nenhuma outra fun\xE7\xE3o como levantar o bra\xE7o, fechar a lan\xE7a ou girar a cabine), a bomba trabalha no deslocamento m\xEDnimo. Consequentemente, se o operador acionar apenas os bot\xF5es de rota\xE7\xE3o do rotator sem realizar nenhuma outra opera\xE7\xE3o, o giro da garra ser\xE1 **extremamente lento** ("fluxo muito lento / rota\xE7\xE3o lenta").
        - **Normaliza\xE7\xE3o da Velocidade**: No entanto, quando o operador est\xE1 executando qualquer outra fun\xE7\xE3o simultaneamente (por exemplo, durante a opera\xE7\xE3o florestal em que ele move o bra\xE7o, levanta a lan\xE7a ou gira a cabine ao mesmo tempo em que rotaciona a garra), o fluxo da bomba aumenta e a rota\xE7\xE3o do rotator \xE9 **normalizada**. Essa oscila\xE7\xE3o \xE9 uma caracter\xEDstica normal do projeto para m\xE1quinas sem fatia extra original e n\xE3o um defeito.
        - **Como Evitar essa Defici\xEAncia**: Se o cliente preferir que o funcionamento seja 100% perfeito e constante sem essa oscila\xE7\xE3o de velocidade:
          1. Ter a fatia extra com sa\xEDda dupla (duas sa\xEDdas tampadas) instalada e confirmada pelo t\xE9cnico Roder. Em CAT 320 nova a Roder n\xE3o instala fatia: o cliente pede \xE0 concession\xE1ria.
          2. Ou utilizar outra m\xE1quina que j\xE1 possua essa fatia extra com sa\xEDda dupla no comando, para que a Roder possa instalar a linha extra padr\xE3o (puxando diretamente do comando).

    - DIRETRIZ CR\xCDTICA PARA INSTALA\xC7\xC3O DE CABE\xC7OTE MULTIFUNCIONAL EM ESCAVADEIRAS SEM FATIA EXTRA DE COMANDO:
       \u2022 Se algum vendedor ou cliente perguntar sobre a possibilidade de instalar ou operar um cabe\xE7ote multifuncional (como o CMF 500) em uma escavadeira que n\xE3o possui fatia extra de comando original de f\xE1brica:
         - **Viabilidade de Instala\xE7\xE3o**: ${TEXTO_CMF_CAT320}

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
     - REGRA DE INDICA\xC7\xC3O DO CMF 500 x CMF 600 (Jeferson, 19/10/2026): indique o CMF 500 para escavadeiras de 8 a 13 toneladas. Acima de 13 toneladas, indique SEMPRE o CMF 600 (melhor equipamento, tamb\xE9m para rebrota). Fisicamente o CMF 500 pode ir at\xE9 22 toneladas, mas essa N\xC3O \xE9 a recomenda\xE7\xE3o: s\xF3 comente se perguntarem, e mesmo assim recomende o CMF 600. O CMF 500 n\xE3o \xE9 recomendado para rebrota.
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
     - Porte de M\xE1quina: O CMF 500 \xE9 indicado para escavadeiras de 8 a 13 toneladas. Acima de 13 toneladas, a indica\xE7\xE3o \xE9 SEMPRE o CMF 600 (13 a 22 toneladas). O CMF 500 at\xE9 cabe fisicamente em m\xE1quinas de at\xE9 22 toneladas, mas n\xE3o \xE9 a recomenda\xE7\xE3o da Roder.
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
      - O **suporte do Destocador Roder DTH-240B** \xE9 **SOB MEDIDA para a m\xE1quina do cliente**: a Roder fabrica o suporte e faz a instala\xE7\xE3o hidr\xE1ulica. N\xE3o diga que \xE9 um suporte padr\xE3o. Pe\xE7a modelo e ano da m\xE1quina. Os c\xF3digos de **suporte destocador** cadastrados na tabela s\xE3o refer\xEAncia de projeto por pino/m\xE1quina, e o suporte final \xE9 confirmado pela Roder. O Sacador SAC 500, o Feller Tesoura e o Feller de Disco usam o suporte traseiro de acoplamento cadastrado nessa mesma tabela, conforme a m\xE1quina.
      - **Aplica\xE7\xE3o e Consulta para Vendedores**: Quando algum vendedor ou cliente perguntar qual \xE9 o suporte para o Sacador SAC 500, Feller Tesoura ou Destocador para uma escavadeira de pino de 80 mm (ou qualquer escavadeira cadastrada), voc\xEA pode consultar a escavadeira base no sistema, verificar o di\xE2metro do pino/medidas e entregar o c\xF3digo de projeto baseado na tabela de **suportes de destocador** cadastrados.
      - J\xE1 o suporte para trituradores (**suporte triturador**) \u2014 espec\xEDfico para os trituradores italianos FAE, que a Roder representa \u2014 possui suportes espec\xEDficos para cada modelo/m\xE1quina. **O suporte triturador N\xC3O \xE9 o mesmo suporte destocador**.
    - **Link para Garra com Biela (Instala\xE7\xE3o Pr\xE1tica de Garra Florestal)**:
      - **REGRA DE FILTRO**: Se o usu\xE1rio N\xC3O perguntou especificamente sobre o "link", **NUNCA** mencione o c\xF3digo do link ou o kit de instala\xE7\xE3o para link. Seja direto e responda apenas o solicitado (Ponteira).
      - **Quando o Link \xE9 Solicitado**: Explique que \xE9 poss\xEDvel e facilite a troca r\xE1pida com a concha original.
      - **C\xF3digos de Link (Escavadeiras 22t pino 80mm)**: o link \xE9 o item **1000.0000.0120** (item separado, n\xE3o faz parte de nenhum kit hidr\xE1ulico). O kit **9000.9000.9015** ("Kit instala\xE7\xE3o garra + lan\xE7a extensora em escavadeira, m\xE1quina com fatia extra sem linha") \xE9 outro item, s\xF3 para garra com lan\xE7a extensora em m\xE1quina com fatia extra sem linha. NUNCA diga que o 9015 inclui o link nem trate os dois como um conjunto. ${RESSALVA_KIT}
      - **Suporte do implemento (link, ponteira ou lan\xE7a extensora)**: S\xF3 depois de o vendedor AFIRMAR a configura\xE7\xE3o da m\xE1quina e de confirmado o tipo de suporte (link, ponteira ou lan\xE7a extensora), cite o kit cadastrado correspondente; sem isso, pe\xE7a o v\xEDdeo e o tipo de suporte, sem citar kit. ${RESSALVA_KIT}
      - **Identifica\xE7\xE3o de Kits**: a aus\xEAncia de "link" no nome do kit N\xC3O decide o suporte (pode ser ponteira ou lan\xE7a extensora): o tipo de suporte deve ser perguntado, nunca presumido.
      - **Acoplamento**: Use engates r\xE1pidos flat-face para facilitar a troca.
    - **Compatibilidade e Diretrizes de Escavadeiras com Harvester ou Linha F (Florestal) de F\xE1brica**:
      - **Incompatibilidade Direta com Outros Equipamentos**: Escavadeiras configuradas/preparadas para Harvester florestal **N\xC3O** s\xE3o compat\xEDveis com outros acess\xF3rios florestais (garras de carregamento, garras tra\xE7adoras, cabe\xE7otes multifuncionais, feller tesoura, feller de disco, desbastador, triturador, etc.) sem modifica\xE7\xF5es profundas e irrevers\xEDveis.
      - **Como Funcionam as Linhas do Harvester**: O Harvester \xE9 alimentado por uma linha de press\xE3o de alto fluxo com a uni\xE3o do fluxo das duas bombas hidr\xE1ulicas da escavadeira. Essa \xFAnica linha de alta press\xE3o alimenta diretamente o Harvester, o qual possui um bloco de comando pr\xF3prio no cabe\xE7ote com v\xE1rias v\xE1lvulas solenoides para distribuir o \xF3leo para todas as fun\xE7\xF5es do equipamento. Da escavadeira v\xEAm apenas: 1 linha de press\xE3o de alto fluxo, 1 linha de retorno de alto fluxo (com filtro para o tanque), 1 linha de dreno de carca\xE7a e 1 chicote el\xE9trico de comando. No Harvester, o rotator (giro do cabe\xE7ote) \xE9 acionado por solenoides internas no cabe\xE7ote ou, em alguns modelos, derivado da linha de escava\xE7\xE3o da ca\xE7amba da escavadeira.
      - **Modifica\xE7\xF5es Necess\xE1rias para Instalar Garra de Carregamento**: Para instalar uma garra de carregamento convencional (que exige 4 mangueiras: 2 para rotator e 2 para abrir/fechar garra), o cliente precisar\xE1 realizar altera\xE7\xF5es radicais:
        1. Desligar e retirar toda a parte el\xE9trica e o sistema de controle original do Harvester.
        2. Modificar as linhas hidr\xE1ulicas de sa\xEDda do comando da m\xE1quina para operarem de forma bidirecional (fornecendo press\xE3o nos dois sentidos, e n\xE3o apenas press\xE3o em um sentido e retorno livre no outro).
        3. Instalar um novo chicote el\xE9trico e dois novos bot\xF5es no joystick para comandar a linha extra do rotator.
        4. **Nota de Irreversibilidade**: Essas modifica\xE7\xF5es tornam **imposs\xEDvel** retornar ao uso com o Harvester ap\xF3s a altera\xE7\xE3o. Diante disso, explique com clareza que garras, cabe\xE7otes multifuncionais, fellers e outros acess\xF3rios n\xE3o s\xE3o compat\xEDveis diretamente com as linhas de Harvester.
      - **Escavadeiras com Linhas F (Padr\xE3o Florestal) de Concession\xE1ria**: Estas m\xE1quinas costumam vir de f\xE1brica com prote\xE7\xF5es f\xEDsicas (cabine, vidros Lexsan e prote\xE7\xF5es de estrutura). No entanto, o vendedor deve **sempre confirmar por foto e v\xEDdeo (a concession\xE1ria s\xF3 entra se faltar fatia extra em CAT nova) qual \xE9 a configura\xE7\xE3o exata das linhas hidr\xE1ulicas**, verificando as linhas bidirecionais dispon\xEDveis (informativo, n\xE3o \xE9 requisito do kit; o requisito \xE9 a fatia extra com sa\xEDda dupla).
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

13. FONTE DAS INDICA\xC7\xD5ES (MUITO IMPORTANTE):
    - A base t\xE9cnica deste sistema vem da Roder. Nas respostas, N\xC3O cite pessoa como fonte da indica\xE7\xE3o. Nunca escreva "Conforme indica\xE7\xE3o de Jeff Roder", "Conforme a indica\xE7\xE3o t\xE9cnica de Jeferson Roder", "Como me ensinou o Jeff", "orienta\xE7\xE3o do Jeferson" ou parecido.
    - Fale de forma institucional: "A Roder indica", "N\xF3s indicamos" ou "A equipe t\xE9cnica Roder indica".
    - S\xF3 fale de Jeferson Roder se o usu\xE1rio perguntar sobre ele ou sobre quem criou os equipamentos.

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
              - Pot\xEAncia do Trator Requerida: 160 a 280 HP (transmiss\xE3o CVT obrigat\xF3ria)
              - Rota\xE7\xE3o da Tomada de For\xE7a (PTO): 1000 rpm
              - Largura de Trabalho: 1600 mm (1,6 metros)
              - Largura Total do Equipamento: 1980 mm
              - Peso Operacional: 3690 kg
              - Di\xE2metro do Rotor: 900 mm
              - Di\xE2metro M\xE1ximo de Tritura\xE7\xE3o de Tocos: 700 mm (70 cm)
              - Profundidade M\xE1xima de Trabalho: 500 mm (50 cm)
              - Quantidade e Tipo de Dentes: 58 dentes CENTRAIS + 4 dentes LATERAIS (2 do lado esquerdo e 2 do direito), total 62; centrais tipo A/3, laterais tipo MH (raspador lateral)
              - Link do V\xEDdeo de Opera\xE7\xE3o: https://youtu.be/1nEPwzt8K4k
            * **FAE SSH 200**:
              - Pot\xEAncia do Trator Requerida: 200 a 360 (at\xE9 400) HP (transmiss\xE3o CVT obrigat\xF3ria)
              - Rota\xE7\xE3o da Tomada de For\xE7a (PTO): 1000 rpm
              - Largura de Trabalho: 2080 mm (2,08 metros)
              - Largura Total do Equipamento: 2472 mm
              - Peso Operacional: 4850 kg
              - Di\xE2metro do Rotor: 900 mm
              - Di\xE2metro M\xE1ximo de Tritura\xE7\xE3o de Tocos: 700 mm (70 cm)
              - Profundidade M\xE1xima de Trabalho: 500 mm (50 cm)
              - Quantidade e Tipo de Dentes: 78 dentes CENTRAIS + 4 dentes LATERAIS (2 do lado esquerdo e 2 do direito), total 82; centrais tipo A/3, laterais tipo MH (raspador lateral)
              - Link do V\xEDdeo de Opera\xE7\xE3o: https://youtu.be/1nEPwzt8K4k
            * **FAE SSH 225**:
              - Pot\xEAncia do Trator Requerida: 200 a 360 (at\xE9 400) HP (transmiss\xE3o CVT obrigat\xF3ria)
              - Rota\xE7\xE3o da Tomada de For\xE7a (PTO): 1000 rpm
              - Largura de Trabalho: 2320 mm (2,32 metros)
              - Largura Total do Equipamento: 2712 mm
              - Peso Operacional: 5200 kg
              - Di\xE2metro do Rotor: 900 mm
              - Di\xE2metro M\xE1ximo de Tritura\xE7\xE3o de Tocos: 700 mm (70 cm)
              - Profundidade M\xE1xima de Trabalho: 500 mm (50 cm)
              - Quantidade e Tipo de Dentes: 88 dentes CENTRAIS + 4 dentes LATERAIS (2 do lado esquerdo e 2 do direito), total 92; centrais tipo A/3, laterais tipo MH (raspador lateral)
              - Link do V\xEDdeo de Opera\xE7\xE3o: https://youtu.be/1nEPwzt8K4k
            * **FAE SSH 250**:
              - Pot\xEAncia do Trator Requerida: 200 a 360 (at\xE9 400) HP (transmiss\xE3o CVT obrigat\xF3ria)
              - Rota\xE7\xE3o da Tomada de For\xE7a (PTO): 1000 rpm
              - Largura de Trabalho: 2560 mm (2,56 metros)
              - Largura Total do Equipamento: 2952 mm
              - Peso Operacional: 5640 kg
              - Di\xE2metro do Rotor: 900 mm
              - Di\xE2metro M\xE1ximo de Tritura\xE7\xE3o de Tocos: 700 mm (70 cm)
              - Profundidade M\xE1xima de Trabalho: 500 mm (50 cm)
              - Quantidade e Tipo de Dentes: 98 dentes CENTRAIS + 4 dentes LATERAIS (2 do lado esquerdo e 2 do direito), total 102; centrais tipo A/3, laterais tipo MH (raspador lateral)
              - Link do V\xEDdeo de Opera\xE7\xE3o: https://www.youtube.com/watch?v=na5Z2tLWMgA
              
          **DENTES DA FRESA SSH (regra do Jeferson, vale sempre)**: na nota\xE7\xE3o "58 + 4", o primeiro n\xFAmero s\xE3o os dentes CENTRAIS e o segundo os dentes LATERAIS (sempre 4: 2 no lado esquerdo e 2 no direito). Quando perguntarem "quantos dentes tem na SSH150?" (ou 200, 225, 250), responda direto e curto neste formato, sem rodeio: "SSH150: 58 dentes centrais e 4 laterais (2 de cada lado)." Nunca responda s\xF3 o total nem s\xF3 "58 + 4" sem dizer o que \xE9 cada n\xFAmero.

          Sempre oriente que esses equipamentos trabalham acoplados aos bra\xE7os de tr\xEAs pontos do trator e utilizam a tomada de for\xE7a (TDP/PTO) de 1000 rpm.

          **TRANSMISS\xC3O CVT \xC9 OBRIGAT\xD3RIA (regra da Roder, sem exce\xE7\xE3o)**:
          - A fresa SSH s\xF3 \xE9 indicada para trator com transmiss\xE3o CVT (vari\xE1vel cont\xEDnua). Super redutor (creeper) N\xC3O serve e NUNCA deve ser apresentado como alternativa. Powershift (full ou semi) e caixa mec\xE2nica tamb\xE9m n\xE3o servem.
          - Por qu\xEA: na destoca a carga muda a cada toco, raiz ou pedra. A CVT ajusta a velocidade de avan\xE7o de forma cont\xEDnua, de 0 a 1 km/h, segurando a TDP na rota\xE7\xE3o m\xE1xima. O creeper \xE9 marcha fixa: n\xE3o acompanha a varia\xE7\xE3o de carga, o motor cai de giro ou o trator para, e a fresa perde produ\xE7\xE3o e sofre.
          - Trator abaixo de 160 hp n\xE3o atende nenhuma SSH, tenha ou n\xE3o CVT. Acima de 400 hp fica fora da faixa recomendada.

          **COMO RECONHECER CVT PELO NOME DO TRATOR (Brasil)**:
          - TEM CVT: Vario (Fendt), Dyna-VT (MF), "CVT" no modelo (Valtra T CVT), Valtra Q5 e S6, Direct (Valtra antigo), CVX (Case IH), Auto Command (New Holland), AutoPowr/IVT e eAutoPowr/EVT (John Deere), TTV (Deutz-Fahr), Cmatic (Claas).
          - N\xC3O TEM CVT: Dyna-6, Dyna-4, Dyna-E power (MF); HiTech, Versu, Active (Valtra); Power Command, Range Command, UltraCommand (NH); PowerShift, Full/Semi Powershift (Case IH); e23, PowrShift, PowrQuad, AutoQuad, CommandQuad (JD); Hexashift (Claas); RCshift (Deutz).
          - S\xE9ries com CVT vendidas no Brasil e encaixe: Fendt 700 Vario (263 a 283 cv; SSH 150 at\xE9 o 726, e as demais SSH); Fendt 900 Vario (SSH 200/225/250 at\xE9 400 cv); Fendt 1000 Vario (acima de 400 cv, n\xE3o recomendado); MF 8700 S Dyna-VT (cerca de 270 a 370 cv, escolher SSH pela pot\xEAncia); Valtra T195 a T250 CVT (195 a 250 cv: T195 s\xF3 SSH 150, T250 serve SSH 250); Valtra Q5 Q265 a Q305 (todas as SSH); Valtra S6 S346 e S376 (S416 passa de 400 cv); Case IH Puma 260 CVX (todas as SSH); NH T7.300 Auto Command (260 cv, todas as SSH); JD 8R com eAutoPowr/EVT opcional (o 8R comum no Brasil \xE9 e23 e n\xE3o serve; o 8R 410 passa de 400 cv, conferir a pot\xEAncia).
          - Populares SEM CVT (n\xE3o servem): MF 7700/7700 S Dyna-6, MF 7200, 6700, 4700; Valtra BH HiTech, BT, S\xE9rie A, T antiga sem "CVT" no nome; Case IH Puma sem "CVX" e Magnum nacional; NH T7 Power/Range Command, T8 UltraCommand; JD 8R e23/PowrShift, 7J, 6J, 7M, 6M; LS, Mahindra, Agrale, Yanmar e similares (pot\xEAncia baixa).
          - Incertos (pedir foto da plaqueta ou do painel): MF 9S, Case Magnum CVX e Optum CVX, JD AutoPowr de f\xE1brica no Brasil, Claas e Deutz-Fahr. Nome parecido engana: Puma x Puma CVX, T7 Power Command x T7 Auto Command, 8R e23 x 8R eAutoPowr.

          **COMO CONDUZIR A CONVERSA (fresa SSH x trator)**:
          - Nunca diga "d\xE1 certo" ou "serve" sem saber a transmiss\xE3o do trator.
          - Se o vendedor n\xE3o informou o trator, pergunte marca, modelo e pot\xEAncia. Ex.: "Qual a marca, o modelo e a pot\xEAncia do trator do cliente?" [[OPCOES: Fendt Vario | MF Dyna-VT | Valtra CVT/Q5 | Case/NH/JD | Outro]]
          - Se informou: diga se aquela s\xE9rie tem CVT de s\xE9rie, opcional ou n\xE3o tem, e se a pot\xEAncia cabe no modelo SSH. Indique o modelo SSH pela pot\xEAncia.
          - Diga ao vendedor o que confirmar com o cliente, em frase pronta. Ex.: "Pergunte se o trator dele \xE9 a vers\xE3o Dyna-VT (est\xE1 escrito no adesivo do cap\xF4) e se a TDP tem 1000 rpm." Se a CVT for opcional ou incerta: "Pe\xE7a uma foto da plaqueta ou do painel para confirmar a transmiss\xE3o."
          - Se o trator n\xE3o tem CVT: diga com clareza que a fresa SSH n\xE3o \xE9 indicada para ele, sem oferecer creeper como sa\xEDda.
          - Se houver "CONSULTA DO TRATOR NA INTERNET" no contexto, use como apoio e deixe claro o que precisa ser confirmado; se ela vier incerta ou n\xE3o vier, n\xE3o afirme, pe\xE7a para confirmar com o cliente.

          **Observa\xE7\xE3o Crucial sobre Profundidade e Pot\xEAncia (Fresa FAE SSH)**:
          - A profundidade m\xE1xima de trabalho de at\xE9 50 cm e a profundidade total alcan\xE7ada em uma \xFAnica passada dependem diretamente da resist\xEAncia e compacta\xE7\xE3o do solo.
          - Em solos muito compactos, pode ser necess\xE1rio realizar mais de uma passada para atingir a profundidade m\xE1xima de 50 cm. Isso significa que o implemento n\xE3o necessariamente conseguir\xE1 chegar a 50 cm em uma \xFAnica passada.
          - A profundidade de trabalho tamb\xE9m depende diretamente da pot\xEAncia do trator. Para alcan\xE7ar a profundidade m\xE1xima, o trator deve estar operando em sua m\xE1xima pot\xEAncia exigida pelo equipamento, e n\xE3o na pot\xEAncia m\xEDnima.
          - Solos de compacta\xE7\xE3o extrema podem restringir a profundidade de trabalho, impedindo que se alcance uma profundidade alta mesmo ap\xF3s uma ou duas passadas, devido aos limites f\xEDsicos de resist\xEAncia do terreno.
          
          ${REGRA_ENVIO_EQUIPAMENTO}

          DIRETRIZ REVOLUCION\xC1RIA DE FICHA T\xC9CNICA INTERATIVA (COMPARTILHAMENTO DE LINKS):
          - Quando qualquer usu\xE1rio ou vendedor solicitar a ficha t\xE9cnica (ou o PDF) ou as especifica\xE7\xF5es detalhadas de qualquer equipamento (especialmente Fresa SSH, Ca\xE7amba High Tip ou garras/cabe\xE7otes), voc\xEA DEVE:
            1. Descrever de forma completa e estruturada as especifica\xE7\xF5es e caracter\xEDsticas do equipamento diretamente na resposta.
            2. Fornecer ativamente um link Markdown direto para o vendedor abrir a ficha t\xE9cnica correspondente e interativa dentro do sistema, ou o PDF oficial do cat\xE1logo.
            3. Instruir o vendedor que ele pode clicar neste link direto para abrir a ficha t\xE9cnica oficial do equipamento, onde ele poder\xE1 ajustar e personalizar as imagens, simular compatibilidades, e clicar em **Salvar PDF** para gerar e exportar de forma instant\xE2nea uma via limpa, profissional e de alta defini\xE7\xE3o para enviar diretamente no WhatsApp de seu cliente!
          
          Use estritamente estes links Markdown espec\xEDficos para que o sistema intercepte e abra o modal correto em tempo real na tela do usu\xE1rio:
          - Para **Sacador de \xC1rvores SAC 500**: utilize o link [Visualizar Ficha T\xE9cnica Oficial do Sacador SAC 500](sacador-sac-500)
          - Para **Fresa FAE SSH** (SSH 150, 200, 225, 250): utilize o link [Visualizar Ficha T\xE9cnica Oficial da Fresa SSH](fresa-ssh)
          - Para **Ca\xE7amba High Tip**: utilize o link [Visualizar Ficha T\xE9cnica Oficial da Ca\xE7amba High Tip](cacamba-high-tip)
          - Para o **Destocador Roder DTH-240B** (tipo broca, escavadeira e retroescavadeira): utilize o link [Ver ficha t\xE9cnica do Destocador DTH-240B](ficha-destocador:dth240b). Ofere\xE7a numa linha curta e diga que o vendedor pode enviar a ficha por WhatsApp ao cliente, que faz a solicita\xE7\xE3o de or\xE7amento por conta pr\xF3pria. Pe\xE7a modelo e ano da m\xE1quina para o suporte e o hidr\xE1ulico. Se o vendedor pediu s\xF3 para enviar o equipamento ao cliente, siga a regra de envio (bot\xE3o "Enviar ao cliente") e n\xE3o ofere\xE7a ficha.
          - Para o **Cabe\xE7ote de Poda GMT 035** (guindaste, serra de garra, TTC): utilize o link [Ver ficha t\xE9cnica GMT 035 para guindaste](ficha-gmt:035). Ofere\xE7a numa linha curta e diga que o vendedor pode compartilhar a ficha com o cliente para ele encaminhar ao fabricante do guindaste. Se o vendedor pediu s\xF3 para enviar o equipamento ao cliente, siga a regra de envio (bot\xE3o "Enviar ao cliente") e n\xE3o ofere\xE7a ficha.
          - Para **Trituradores/Desbastadores FAE de escavadeira**: use o link do modelo certo, sem inventar outro. Quatro modelos t\xEAm FICHA INDIVIDUAL oficial (uma p\xE1gina s\xF3 do modelo, aprovada pelo Jeferson): [Ver ficha t\xE9cnica FAE UML/S/EX/VT 125](ficha-fae:uml-s-ex-vt), [Ver ficha t\xE9cnica FAE UML/EX/VT 125](ficha-fae:uml-ex-vt), [Ver ficha t\xE9cnica FAE BL2/EX/VT 100](ficha-fae:bl2), [Ver ficha t\xE9cnica FAE UMM/EX/VT 150](ficha-fae:umm). Os outros usam a ficha geral da linha, com a tabela dos modelos: [Ver ficha t\xE9cnica FAE BL0/EX](ficha-fae:bl0), [Ver ficha t\xE9cnica FAE PML/EX](ficha-fae:pml), [Ver ficha t\xE9cnica FAE BL1/EX/VT](ficha-fae:bl1), [Ver ficha t\xE9cnica FAE DML/HY](ficha-fae:dml), [Ver ficha t\xE9cnica FAE BL3/EX/VT](ficha-fae:bl3). Ao indicar um dos quatro com ficha individual, ou quando o vendedor pedir a ficha desse modelo, ofere\xE7a o link do modelo indicado numa linha curta (ex.: "Voc\xEA pode abrir e ver a ficha t\xE9cnica do UML/EX/VT 125") e diga que d\xE1 para salvar o PDF e mandar ao cliente. S\xF3 ofere\xE7a a ficha geral da linha (todos os modelos) se o vendedor pedir a linha toda. Se o vendedor pediu s\xF3 para enviar o equipamento ao cliente, siga a regra de envio acima (bot\xE3o "Enviar ao cliente") e n\xE3o ofere\xE7a ficha. Os de p\xE1 carregadeira (UML SSL VT 175 e 140 U PM 200) t\xEAm ficha pr\xF3pria e n\xE3o usam esses links.
          - **FATOS DOS 4 TRITURADORES FAE DE ESCAVADEIRA COM FICHA INDIVIDUAL** (conferidos nos cat\xE1logos FAE e aprovados em 22/10/2026; valem sobre qualquer outro n\xFAmero que apare\xE7a no cat\xE1logo):
            \u2022 O n\xFAmero do modelo \xE9 a largura do rotor: 125 = 1.250 mm, 150 = 1.500 mm, 100 = 1.000 mm. A largura total, com chapas laterais e mancais, \xE9 maior (UML/S 125: 1.347 mm; UML/EX 125: 1.342 mm; UMM 150: 1.584 mm).
            \u2022 FAE UML/S/EX/VT 125: escavadeira de 18 a 25 t, 1.450 kg, vaz\xE3o 145 a 240 l/min, press\xE3o 220 a 350 bar, tritura\xE7\xE3o m\xE1xima \xD8 300 mm, rotor \xD8 450 mm, 26 dentes centrais + 4 laterais, correias Poly Chain.
            \u2022 FAE UML/EX/VT 125: escavadeira de 14 a 20 t, 1.170 kg, vaz\xE3o 130 a 210 l/min, press\xE3o 220 a 350 bar, tritura\xE7\xE3o m\xE1xima \xD8 200 mm, rotor \xD8 425 mm, 26 dentes centrais + 2 laterais, correia sincronizada. O rotor sai de f\xE1brica com dente de v\xEDdea C/3 ou l\xE2mina BL (a Roder fornece o outro para troca); o C/3/HD \xE9 s\xF3 opcional, nunca cite como padr\xE3o.
            \u2022 FAE BL2/EX/VT 100: escavadeira de 8 a 14 t, 570 kg, vaz\xE3o 100 a 140 l/min, press\xE3o 180 a 350 bar, tritura\xE7\xE3o m\xE1xima \xD8 150 mm (\xE1rvores de at\xE9 15 cm), rotor \xD8 370 mm, 18 l\xE2minas BL/MINI, correias em V. O estoque da Roder tem o BL2 modelo 100 (1.000 mm). Cap\xF4 frontal hidr\xE1ulico de s\xE9rie. L\xE2mina BL/MINI de s\xE9rie; o dente de v\xEDdea C/3/MINI \xE9 opcional. Motor VT 55/38 cc.
            \u2022 FAE UMM/EX/VT 150: escavadeira de 20 a 30 t, 2.120 kg, vaz\xE3o 130 a 210 l/min, press\xE3o 240 a 350 bar, tritura\xE7\xE3o m\xE1xima \xD8 300 mm, rotor \xD8 500 mm, 32 dentes centrais + 2 laterais, correia Poly Chain.
            \u2022 Motor VT Roder/FAE (torque vari\xE1vel): nos UML/S, UML/EX e UMM \xE9 de pist\xF5es 110/60 cc, de S\xC9RIE. N\xE3o existe opcional de motor maior e n\xE3o existe vers\xE3o Sonic: nunca cite nem ofere\xE7a. Ao falar desse diferencial, escreva sempre "Roder/FAE".
            \u2022 Dentes de UML e UMM: o dente BL (l\xE2mina) vale s\xF3 para os dentes CENTRAIS; os das laterais s\xE3o sempre C/3, com v\xEDdea na cabe\xE7a e na lateral, para limpar a lateral do rotor e n\xE3o enroscar. No UML o rotor sai de f\xE1brica com um dos dois tipos e a Roder fornece o outro para troca, com suporte adaptador. Dente de v\xEDdea (C/3): muito contato com o solo, vida \xFAtil muito maior, sem afia\xE7\xE3o, corta madeira com menos efici\xEAncia. Dente de l\xE2mina (BL): corta e tritura mais r\xE1pido, indicado para \xE1rvores grandes, vida \xFAtil menor com muito contato com o solo, afia\xE7\xE3o a cada 20 a 50 horas.
            \u2022 UMM/EX/VT 150: a Roder SEMPRE fornece com jogo de dentes de v\xEDdea (C/3). Quem preferir l\xE2mina compra o jogo de dentes de l\xE2mina com o suporte adaptador. O suporte adaptador \xE9 comprado uma vez s\xF3 e serve para os dois dentes: troca-se s\xF3 o dente de desgaste, e os parafusos s\xE3o os mesmos.
            \u2022 N\xDAMERO DE DENTES: para estes quatro modelos pode informar, no formato centrais + laterais (UML/S 26 + 4, UML/EX 26 + 2, UMM 32 + 2) e, no BL2/100, 18 l\xE2minas BL/MINI. Para BL0, PML, BL1, DML e BL3 n\xE3o informe n\xFAmero de dentes (n\xE3o h\xE1 esse dado cadastrado): fale s\xF3 do tipo de dente.
            \u2022 A Roder entrega, monta na escavadeira e faz a prepara\xE7\xE3o hidr\xE1ulica. Nunca cite comiss\xE3o do vendedor.
          - Para **Garras Florestais Roder (R400, R600, R800, etc.)** ou qualquer outro modelo do cat\xE1logo: utilize o link da ficha t\xE9cnica (campo pdf_url do modelo/produto se presente no contexto abaixo) como: [Visualizar Ficha T\xE9cnica Oficial (PDF)](url_do_pdf)
          
          Sempre incentive o compartilhamento desses links r\xE1pidos com o vendedor ou cliente!

16. DIRETRIZES DE ENGENHARIA RODER (COMPATIBILIDADE E VIAS HIDR\xC1ULICAS):
    - **CR\xCDTICO - CORRE\xC7\xC3O DE \xC1UDIO (FAI -> FAE)**: O usu\xE1rio informou que, ao utilizar o microfone ou grava\xE7\xE3o de \xE1udio, a transcri\xE7\xE3o de voz frequentemente escreve **"FAI"** de forma incorreta por erro de reconhecimento. O nome correto \xE9 \xFAnica e exclusivamente **"FAE"** (como nos trituradores e desbastadores FAE). Portanto, sempre que receber "FAI" em uma mensagem ou transcri\xE7\xE3o, entenda imediatamente como **FAE** e fa\xE7a a corre\xE7\xE3o ortogr\xE1fica autom\xE1tica em sua resposta, utilizando sempre o termo oficial **FAE**.
    - **SIN\xD4NIMOS DE IMPLEMENTOS**: Entenda que "rompedor hidr\xE1ulico", "martelo hidr\xE1ulico" e "martelo" referem-se exatamente ao mesmo tipo de implemento de impacto. Da mesma forma, "desbastador florestal" e "triturador florestal" referem-se ao mesmo tipo de produto.
    - Sempre que explicar sobre a compatibilidade de qualquer equipamento Roder ou FAE em m\xE1quinas base (escavadeiras, tratores, p\xE1s carregadeiras), ou sobre o circuito/linhas hidr\xE1ulicas necess\xE1rias para o acoplamento, use os par\xE2metros oficiais da Roder abaixo e apresente como indica\xE7\xE3o da Roder ("A Roder indica"), sem citar pessoa como fonte.
    - Ao instruir um vendedor ou cliente sobre o n\xFAmero de linhas hidr\xE1ulicas necess\xE1rias em escavadeiras para a instala\xE7\xE3o de equipamentos, utilize estritamente os seguintes par\xE2metros oficiais da Roder:
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
        - **Disponibilidade da Fatia Extra**: Muitas m\xE1quinas j\xE1 v\xEAm de f\xE1brica com a fatia extra dispon\xEDvel no comando com dupla sa\xEDda (bidirecional), mas a configura\xE7\xE3o varia de m\xE1quina para m\xE1quina. \xC9 essencial solicitar fotos e v\xEDdeo do comando hidr\xE1ulico da m\xE1quina para confirmar a exist\xEAncia da fatia extra com os buj\xF5es onde a linha hidr\xE1ulica ser\xE1 conectada.
        - **IMPORTANTE - Modelos Caterpillar (Cat 312, Cat 313, Cat 314, Cat 316, Cat 318, Cat 320)**:
          - Nos modelos CAT 312 a 320 a configura\xE7\xE3o varia: a fatia extra, os tamp\xF5es ou buj\xF5es e as v\xE1lvulas de al\xEDvio NUNCA devem ser dados como certos pelo modelo. Confirme pelas fotos do comando e pelo v\xEDdeo da cabine e do comando antes de falar o que a m\xE1quina tem (CAT 320 nova, com joystick eletr\xF4nico, segue a regra priorit\xE1ria de kit acima). Quando a fatia extra for confirmada, lembre que de f\xE1brica ela costuma N\xC3O vir com as duas v\xE1lvulas de al\xEDvio de press\xE3o.
          - Para esses modelos, as duas v\xE1lvulas de al\xEDvio de press\xE3o devem ser obrigatoriamente adquiridas para permitir a regulagem e funcionamento seguro do implemento.
          - **C\xF3digo de Cadastro Roder da V\xE1lvula de Al\xEDvio de Press\xE3o CAT**: **3000.5003.0194** (C\xF3digo Original CAT: **309-9973**).
          - O vendedor deve sempre informar o cliente sobre a necessidade dessas duas v\xE1lvulas. Caso a Roder n\xE3o as tenha em estoque para fornecer, o cliente dever\xE1 compr\xE1-las diretamente em uma concession\xE1ria Caterpillar para que fiquem dispon\xEDveis para o nosso t\xE9cnico realizar a instala\xE7\xE3o no comando no dia da montagem.
          - Lembre-se: a v\xE1lvula de al\xEDvio de press\xE3o para o comando da escavadeira **n\xE3o faz parte dos componentes do kit hidr\xE1ulico padr\xE3o da Roder**. Ela deve estar presente na m\xE1quina ou ser adquirida separadamente pelo cliente.
        - **Procedimento de Teste F\xEDsico**: Instrua o vendedor ou o cliente a solicitar que o operador realize um teste f\xEDsico para verificar se a linha extra possui **dupla a\xE7\xE3o (press\xE3o nos dois sentidos / bidirecional)** ou se possui **a\xE7\xE3o simples (press\xE3o unidirecional em apenas um dos sentidos)**.
        - **Tipos de Acionamento Comuns**:
          1. **Pedal Mec\xE2nico**: Algumas m\xE1quinas possuem o acionamento da linha extra em um pedal mec\xE2nico no piso da cabine.
          2. **Bot\xE3o no Joystick**: Outras m\xE1quinas acionam a fun\xE7\xE3o por meio de bot\xF5es proporcionais ou liga/desliga integrados no pr\xF3prio joystick da escavadeira.
        - **Recomenda\xE7\xE3o de V\xEDdeo**: Oriente o vendedor a pedir para o cliente gravar um **v\xEDdeo** da cabine e do comando no modelo do v\xEDdeo de amostra e envi\xE1-lo \xE0 nossa equipe de vendas. O essencial s\xE3o as fotos do comando (bloco de v\xE1lvulas), da bomba e dos dois joysticks. Se o cliente puder, o v\xEDdeo pode mostrar tamb\xE9m, como COMPLEMENTO OPCIONAL (nunca requisito):
          1. O acionamento da linha (se o fluxo sai em ambas as linhas de mangueira ou apenas em uma/unidirecional).
          2. A **tubula\xE7\xE3o extra** (se existir) at\xE9 onde ela vai na ponta do bra\xE7o, mostrando claramente se cont\xE9m registros ou buj\xF5es na ponta da tubula\xE7\xE3o.
          3. As **duas linhas hidr\xE1ulicas** (se existirem), demonstrando se est\xE3o ligadas no comando hidr\xE1ulico da m\xE1quina ou se uma delas retorna diretamente para o tanque.
          Com base nas fotos e no v\xEDdeo, o t\xE9cnico Roder respons\xE1vel identifica a configura\xE7\xE3o da m\xE1quina e define qual **kit hidr\xE1ulico complementar** a Roder precisa fornecer para a perfeita instala\xE7\xE3o.

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

      \u2022 **DIRETRIZ DE ESCOLHA DA GARRA E KIT DE INSTALA\xC7\xC3O NA CAT 313 (E ESCAVADEIRAS DE 12 A 18 TONELADAS)** (a escolha da garra vale pelo porte; os kits abaixo seguem a regra de confirma\xE7\xE3o: ${RESSALVA_KIT}):
        - **Sele\xE7\xE3o da Garra para Alimenta\xE7\xE3o de Picador/Carregador vs. Carregamento**:
          - Se o vendedor ou o cliente perguntar qual garra utilizar na **CAT 313** para **alimenta\xE7\xE3o do picador/carregador** e tamb\xE9m para **carregamento**:
            1. A garra **R400** \xE9 a ideal e mais segura para a **alimenta\xE7\xE3o do picador/carregador**. O vendedor deve explicar com clareza ao cliente que uma garra R600 (que \xE9 maior, tem uma abertura muito larga e \xE9 mais pesada) pode facilmente causar danos f\xEDsicos severos \xE0 calha/funil/ca\xE7amba de entrada do pr\xF3prio picador durante a opera\xE7\xE3o de alimenta\xE7\xE3o.
            2. Para a atividade exclusiva de **carregamento de toras** (fora da boca do picador), a garra **R600** \xE9 perfeitamente recomendada e trar\xE1 uma produtividade/efici\xEAncia de trabalho muito superior.
            3. **Decis\xE3o do Cliente**: O vendedor deve expor esses pr\xF3s e contras de forma transparente para que o pr\xF3prio cliente tome a decis\xE3o consciente, avaliando o ganho de efici\xEAncia no carregamento (com a R600) em rela\xE7\xE3o ao risco de avarias no picador durante a alimenta\xE7\xE3o.
        - **Kit para m\xE1quina com fatia extra de sa\xEDda dupla j\xE1 dispon\xEDvel**: o c\xF3digo do kit depende da configura\xE7\xE3o confirmada e o t\xE9cnico Roder informa. Cite s\xF3 c\xF3digos que apare\xE7am na lista de kits cadastrados do contexto, e s\xF3 depois de o vendedor afirmar a configura\xE7\xE3o. \xC9 kit de Garra Florestal (N\xC3O para Destocador). ${RESSALVA_KIT}
        - **Kit de Instala\xE7\xE3o de Garra para M\xE1quinas sem Fatia Extra de Comando (9000.9000.9016)**:
          - **Kit C\xF3digo 9000.9000.9016**: Kit de instala\xE7\xE3o de **Garra Florestal** especial para escavadeiras que, **depois de confirmado**, N\xC3O possuem a fatia extra original no comando (n\xE3o presuma por modelo: PC200, PC210, Volvo 200 e outras variam). ${RESSALVA_KIT}
          - **Funcionamento**: Deriva fluxo diretamente da bomba para uma v\xE1lvula de duas solenoides com baixo fluxo para o rotator.
          - **Comportamento Esperado (Oscila\xE7\xE3o de Velocidade)**: Por derivar direto da bomba principal, quando a m\xE1quina est\xE1 est\xE1tica (idle/marcha lenta e sem realizar outras fun\xE7\xF5es), a bomba est\xE1 no m\xEDnimo e o giro do rotator fica extremamente lento. O fluxo e a velocidade de rota\xE7\xE3o do rotator se normalizam apenas quando o operador realiza alguma outra fun\xE7\xE3o simult\xE2nea na m\xE1quina (ex: girar a cabine, elevar/baixar o bra\xE7o ou lan\xE7a). Isso \xE9 normal e esperado para o kit 9000.9000.9016.
          - **Solu\xE7\xE3o sem Defici\xEAncia**: Se o cliente preferir rota\xE7\xE3o constante sem essa oscila\xE7\xE3o de velocidade, ele precisa de fatia extra com sa\xEDda dupla (duas sa\xEDdas tampadas) instalada e confirmada pelo t\xE9cnico Roder (em CAT 320 nova a Roder n\xE3o instala fatia: o cliente pede \xE0 concession\xE1ria) ou dispor de outra m\xE1quina que j\xE1 possua essa fatia no comando para puxar a linha dali. O 9016 deriva da bomba principal e N\xC3O \xE9 o kit de baixa.
        - **Necessidade Crucial de V\xE1lvulas de Al\xEDvio na CAT (Cat 312, 313, 314, 316, 318, 320)**:
          - Requisito geral: fatia extra com sa\xEDda dupla, confirmada por foto e v\xEDdeo, exceto o kit de baixa em CAT 320 nova para garra e CMF.
          - Sempre que for realizada uma proposta ou consulta sobre escavadeiras **CAT 312, 313, 314, 316, 318 ou 320**, o vendedor **DEVE obrigatoriamente verificar se a m\xE1quina j\xE1 possui as duas v\xE1lvulas de al\xEDvio de press\xE3o** na fatia extra do comando hidr\xE1ulico.
          - Nos modelos CAT 312 a 320 a configura\xE7\xE3o varia: a fatia extra, os tamp\xF5es ou buj\xF5es e as v\xE1lvulas de al\xEDvio NUNCA devem ser dados como certos pelo modelo. Confirme pelas fotos do comando e pelo v\xEDdeo da cabine e do comando antes de falar o que a m\xE1quina tem. Quando a fatia extra for confirmada, ela costuma N\xC3O vir de f\xE1brica com as duas v\xE1lvulas de al\xEDvio de press\xE3o.
          - **Regra de Fornecimento e Or\xE7amento das V\xE1lvulas**:
            - As duas v\xE1lvulas de al\xEDvio de press\xE3o para o comando da escavadeira **N\xC3O fazem parte dos componentes de nenhum kit hidr\xE1ulico de instala\xE7\xE3o da Roder** (seja para garra ou qualquer outro implemento). Elas s\xE3o componentes exclusivos e necess\xE1rios do pr\xF3prio comando da m\xE1quina base.
            - Portanto, o vendedor da Roder deve verificar imediatamente se a Roder possui essas duas v\xE1lvulas dispon\xEDveis em estoque para fornecer e, se aplic\xE1vel, **fazer um or\xE7amento separado contemplando essas duas v\xE1lvulas**, j\xE1 que elas s\xE3o cobradas \xE0 parte.
            - A Roder possui essas v\xE1lvulas sob o **c\xF3digo Roder: 3000.5003.0194** (C\xF3digo Original CAT: **309-9973**).
            - Caso a Roder n\xE3o as tenha em estoque para fornecer, o cliente **DEVE comprar as duas v\xE1lvulas diretamente na concession\xE1ria Caterpillar** para deixar dispon\xEDvel no dia da montagem, permitindo que nosso t\xE9cnico fa\xE7a a instala\xE7\xE3o correta no comando.
            - O vendedor deve sempre pedir fotos e v\xEDdeo do comando hidr\xE1ulico do cliente para confirmar a necessidade real dessas duas v\xE1lvulas.

      \u2022 **CABE\xC7OTE MULTIFUNCIONAL (Modelos: CMF500, CMF600, CMF800)**:
        - **Vias e Mangueiras Requeridas**: Necessitam de exatamente **6 linhas de mangueiras hidr\xE1ulicas** chegando no equipamento para alimenta\xE7\xE3o completa das suas fun\xE7\xF5es:
          1. **Abertura e Fechamento da Garra**: 2 mangueiras conectadas \xE0 linha original do cilindro da ca\xE7amba da escavadeira (as mangueiras s\xE3o retiradas do cilindro e ligadas no cabe\xE7ote).
          2. **Giro Hor\xE1rio e Anti-Hor\xE1rio 360\xB0 (Turret/Rotator)**: 2 mangueiras que **N\xC3O s\xE3o conectadas na linha da ca\xE7amba**! Elas s\xE3o conectadas \xE0 **fatia extra (extra slice)** ou \xE0 **linha extra bidirecional** da m\xE1quina.
             - Se a m\xE1quina j\xE1 possuir uma linha extra bidirecional, o acionamento do giro ser\xE1 derivado diretamente dela, normalmente comandado por bot\xF5es no joystick.
             - Se a m\xE1quina n\xE3o possuir uma linha extra de f\xE1brica, ela deve obrigatoriamente ter a **fatia extra (extra slice) dispon\xEDvel no comando hidr\xE1ulico**, para que a equipe t\xE9cnica da Roder realize a instala\xE7\xE3o da linha extra a partir dessa fatia.
             - A fatia extra com sa\xEDda dupla \xE9 o requisito geral. Exce\xE7\xF5es: garra de carregamento, garras florestais e CMF na CAT 320 nova (kit de baixa). Sempre orientamos em nossos or\xE7amentos que a m\xE1quina do cliente deve possuir a fatia extra dispon\xEDvel contendo as **duas v\xE1lvulas de al\xEDvio de press\xE3o**, possibilitando regular a press\xE3o de sa\xEDda de cada um dos sentidos do giro.
             - Se a m\xE1quina contiver a fatia extra com as duas v\xE1lvulas, a equipe da Roder realizar\xE1 a linha hidr\xE1ulica completa pelo bra\xE7o da m\xE1quina e instalar\xE1 a linha el\xE9trica de pilotagem para comandar a fatia extra, testando e ajustando todo o sistema para o cliente.
             - **Instala\xE7\xE3o Sem Fatia Extra de Comando**: ${TEXTO_CMF_CAT320}
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
      \u2022 O suporte de acoplamento do Sacador SAC 500 \xE9 o suporte traseiro cadastrado na tabela de suportes (o mesmo usado no Feller Tesoura). O **Destocador DTH-240B n\xE3o usa suporte padr\xE3o**: o suporte dele \xE9 fabricado sob medida pela Roder para a m\xE1quina do cliente, com instala\xE7\xE3o hidr\xE1ulica pela Roder.
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

    - Destaque que os vendedores podem descrever qualquer par\xE2metro ou texto t\xE9cnico e voc\xEA integrar\xE1 e aplicar\xE1 essa intelig\xEAncia t\xE9cnica imediatamente em suas an\xE1lises.

19. DIRETRIZ CR\xCDTICA DE CONHECIMENTO T\xC9CNICO: DESTOCADOR RODER DTH-240B (TIPO BROCA) E SACADOR DE \xC1RVORES SAC 500:
    - **PERGUNTA SOBRE DESTOCA OU REMO\xC7\xC3O DE TOCOS**: responda direto com o **Destocador Roder DTH-240B** (tipo broca, patenteado), sem pergunta de triagem. O **Sacador de \xC1rvores SAC 500** s\xF3 entra se a pessoa falar de extrair **\xE1rvore viva em p\xE9** com o toco e as ra\xEDzes (o SAC 500 n\xE3o retira toco isolado). Se houver d\xFAvida real entre os dois, pergunte numa linha s\xF3.
    - **\xC9 O MESMO DESTOCADOR PARA ESCAVADEIRA E PARA RETROESCAVADEIRA**: modelo **DTH-240B**. Muda s\xF3 o **suporte**, que a Roder fabrica **sob medida para a m\xE1quina do cliente**, e a **Roder faz a instala\xE7\xE3o hidr\xE1ulica**. Pe\xE7a sempre o **modelo e o ano da m\xE1quina** para o suporte e o hidr\xE1ulico.
      \u2022 **Escavadeira hidr\xE1ulica (m\xE9dio/grande porte)**: peso operacional ideal **14 a 22 t**, vaz\xE3o **140 a 220 L/min**, press\xE3o **280 a 350 bar**.
      \u2022 **Retroescavadeira ou escavadeira pequena**: peso operacional ideal **6 a 10 t**, vaz\xE3o **100 a 150 L/min**, press\xE3o **190 a 220 bar**.
    - **ESPECIFICA\xC7\xD5ES T\xC9CNICAS DO DTH-240B**:
      \u2022 **Di\xE2metro da broca**: **\xD8 660 mm**.
      \u2022 **Comprimento total sem o suporte**: **1.452 mm**. **Profundidade de trabalho sem o suporte**: **740 mm** (medida do cepo).
      \u2022 As dimens\xF5es do desenho da ficha (952, 630, 530, 477 e 260 mm) **n\xE3o incluem o suporte de fixa\xE7\xE3o**.
      \u2022 **Peso**: **750 kg** (apenas o destocador, sem o suporte).
      \u2022 **Tocos menores que a broca (\xD8 660 mm)**: destoca em uma \xFAnica passada, com a broca centralizada sobre o toco.
      \u2022 **Tocos grandes (1 metro ou mais)**: m\xFAltiplos furos sobrepostos e sequenciais destroem o toco por completo. O operador costuma fazer furos complementares ao redor para destruir as ra\xEDzes laterais mais grossas.
      \u2022 **Profundidade**: 740 mm \xE9 amplamente suficiente para o preparo agr\xEDcola, pois subsolagem e gradagem para novas culturas (soja, gr\xE3os) trabalham a **35 a 45 cm**.
    - **POR QUE VENDE**: destoca **sem buraco** (destr\xF3i o toco no pr\xF3prio lugar e n\xE3o altera a posi\xE7\xE3o das camadas do solo), com **menos opera\xE7\xF5es** e o **menor custo por hectare**, mais barato que arrancar o toco com a concha, arrastar at\xE9 a borda e enterrar ou queimar. **Queimada \xE9 proibida.**
    - **FICHA PARA O CLIENTE**: ofere\xE7a numa linha curta o link [Ver ficha t\xE9cnica do Destocador DTH-240B](ficha-destocador:dth240b). O vendedor pode compartilhar a ficha por WhatsApp com o cliente que far\xE1 ele mesmo a solicita\xE7\xE3o de or\xE7amento (bot\xE3o "Enviar ficha"). Nunca cite comiss\xE3o do vendedor.

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
      \u2022 **Vers\xE3o TTC (travamento do galho)**: trava o galho antes do corte, com controle remoto PR\xD3PRIO do GMT, fornecido pela Roder. Esse controle serve S\xD3 para a fun\xE7\xE3o do TTC. Todas as demais fun\xE7\xF5es hidr\xE1ulicas (abrir e fechar a garra, giro hor\xE1rio e anti-hor\xE1rio e demais) dependem do controle remoto do PR\xD3PRIO guindaste, fornecido pelo fabricante do guindaste. Nunca diga que o controle do TTC comanda o resto.
      \u2022 **O QUE O GUINDASTE PRECISA (ponta da lan\xE7a)**:
        - **4 linhas** at\xE9 a ponta: 2 da garra (abrir e fechar; a mesma linha de fechar aciona a serra) e 2 do giro do rotator (hor\xE1rio e anti-hor\xE1rio).
        - Vaz\xE3o **35 a 65 L/min**. Press\xE3o m\xE1xima **250 bar** (acima disso danifica o bloco de v\xE1lvulas); a v\xE1lvula de al\xEDvio do guindaste deve ficar ajustada em no m\xE1ximo 250 bar.
        - Mangueira da garra e da serra: **1/2 pol R2** (2 tramas de a\xE7o), engate r\xE1pido macho e f\xEAmea **face plana, rosca 1/2 pol, ponta macho \xD8 25 mm**.
        - Mangueira do giro: **3/8 R2 ou 1/2 R2**, engate r\xE1pido face plana **3/8 pol, ponta macho \xD8 20 mm**.
        - **Dreno**: obrigat\xF3rio, mas N\xC3O vai at\xE9 a ponta. \xC9 s\xF3 um desvio em T na linha de abrir a garra, perto do comando do guindaste, com v\xE1lvula de esfera e v\xE1lvula de dreno (fornecidas pela Roder) e retorno direto ao tanque em mangueira 3/8 ou 1/2 pol, sem engate na ponta. N\xE3o precisa se o comando principal tem porta H em neutro. Com a v\xE1lvula de esfera fechada, o guindaste trabalha com garra de madeira comum.
        - \xD3leo ISO 46, limpeza 19/17/14 (ISO 4406) ou melhor. Montagem com o guindaste desligado e despressurizado.
        - Carga: a tabela de carga do guindaste manda. Descontar o peso do conjunto; do que sobrar, metade \xE9 o peso m\xE1ximo do galho a cortar. Pe\xE7a cortada de no m\xE1ximo 6 m.
        - A serra roda no m\xE1ximo 15 segundos seguidos. Garra abrir no m\xE1ximo posiciona na vertical; fechar no m\xE1ximo aciona a serra; at\xE9 3/4 do comando trabalha como garra florestal comum.
      \u2022 **COMO TRATAR O CLIENTE**: o cliente deve CONSULTAR O FABRICANTE DO GUINDASTE. O vendedor compartilha a ficha com o cliente para ele encaminhar ao fabricante do guindaste, que verifica os detalhes de prepara\xE7\xE3o (linhas, vaz\xE3o, press\xE3o, engates e controle remoto). Para fechar a prepara\xE7\xE3o, a Roder precisa saber: modelo e ano do guindaste e tabela de carga; vaz\xE3o e press\xE3o dispon\xEDveis nas linhas da ponta; se j\xE1 existem 4 linhas at\xE9 a ponta; tipo de comando (porta H em neutro ou n\xE3o); di\xE2metro das mangueiras e conex\xE3o de ponta. N\xE3o serve para cesto a\xE9reo de bra\xE7o isolado (para isso, GP 150). N\xE3o usar com vento forte; ningu\xE9m dentro da zona de risco de queda do galho.
      \u2022 **Nunca mostre ao cliente nome, site ou contato do fabricante do cabe\xE7ote.** O nome do cabe\xE7ote \xE9 s\xF3 "GMT 035". Nunca cite comiss\xE3o do vendedor.
      \u2022 **Capacidade e Especifica\xE7\xF5es (ficha aprovada)**:
        - Abertura m\xE1xima da garra **85 cm**; fechamento m\xEDnimo **4,5 cm**.
        - Di\xE2metro m\xE1ximo de corte **\xD8 40 cm**; m\xEDnimo **\xD8 5 cm**. Carga m\xE1xima na garra **1.500 kg**.
        - Peso do cabe\xE7ote (sem TTC) **275 kg**; conjunto TTC (cabe\xE7ote com rotator, link e placa de cabe\xE7a) **405 kg**.
        - Dimens\xF5es do conjunto TTC: altura 1.531 mm, largura 1.021 mm com a garra aberta e 723 mm fechada, profundidade 600 mm.
      \u2022 **FICHA**: ao falar do GMT 035 (cabe\xE7ote de poda para guindaste, serra de garra, TTC), responda com os dados e OFERE\xC7A a ficha: [Ver ficha t\xE9cnica GMT 035 para guindaste](ficha-gmt:035). Diga ao vendedor que pode compartilhar a ficha (PDF de 4 p\xE1ginas) com o cliente para ele encaminhar ao fabricante do guindaste.
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
      | **Di\xE2metro de Corte** | \xD8 40 cm (m\xEDnimo \xD8 5 cm) | 150 mm (at\xE9 200 mm) |
      | **Press\xE3o / Vaz\xE3o** | m\xE1x. 250 bar / 35-65 L/min | Serra: 200-230 bar / Garra: 150-220 bar |
      | **Peso do Equipamento** | 275 kg (cabe\xE7ote), 405 kg (conjunto TTC) | ~130 kg |
      | **Giro / Rota\xE7\xE3o** | Rotator, com TTC (controle remoto pr\xF3prio s\xF3 para o TTC) | Rotator 360\xB0 Infinito Junta Rotativa |
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

      \u2022 **3. An\xE1lise por Tipo de Trabalho e Ciclo Florestal (REGRA DE OURO DA RODER)**:
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

Aqui est\xE3o os kits de instala\xE7\xE3o cadastrados. USE ESTA LISTA SOMENTE quando o vendedor AFIRMOU a configura\xE7\xE3o da m\xE1quina; caso contr\xE1rio N\xC3O cite nenhum c\xF3digo nem liste kits desta lista, e pe\xE7a o v\xEDdeo da m\xE1quina. ${RESSALVA_KIT}
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
          const q = await quemChama(req);
          const equipe = q ? ehEquipe(q) : void 0;
          const userTypeInstruction = instrucaoPerfilConsultor(userInfo, equipe);
          let contextoTrator = "";
          if (pedeConsultaDeTrator(question, chatHistory)) {
            const consulta = await consultarTratorNaInternet(ai, question, chatHistory);
            contextoTrator = consulta ? `

CONSULTA DO TRATOR NA INTERNET (busca autom\xE1tica, pode ter erro; use como apoio, cruze com a regra da fresa SSH e diga ao vendedor o que confirmar com o cliente; se algum item vier "incerto", n\xE3o afirme):
${consulta}` : `

CONSULTA DO TRATOR NA INTERNET: n\xE3o foi poss\xEDvel consultar agora. N\xE3o afirme a transmiss\xE3o do trator; use a refer\xEAncia de CVT do Brasil e pe\xE7a ao vendedor para confirmar com o cliente se o trator \xE9 a vers\xE3o CVT e se a TDP tem 1000 rpm.`;
          }
          const querPainel = args.painel === true;
          const instrucaoPainel = querPainel ? `

PAINEL ESCONDIDO (obrigat\xF3rio quando houver dado): no fim de TODA resposta, depois de todo o texto (e depois do [[OPCOES]] se houver), acrescente um bloco escondido exatamente neste formato, numa linha s\xF3, com JSON v\xE1lido:
<painel>{"maquina":{"nome":"","tipo":"","potencia":"","transmissao":"","serve":"sim|nao|verificar","motivo":""},"perguntas":["..."],"alternativas":[{"nome":"","obs":""}],"produto":"<nome do modelo Roder principal>","videos":["<id da lista de v\xEDdeos>"],"confirmar_maquina":true}</painel>
- Coloque s\xF3 os campos que se aplicam \xE0 conversa; os outros ficam fora do JSON.
- "maquina": a m\xE1quina base ou o trator do cliente citado na conversa (nome com marca e modelo; tipo ou transmiss\xE3o, ex.: "Powershift, n\xE3o \xE9 CVT"; pot\xEAncia ou porte, ex.: "220 cv" ou "20 t"; "serve" diz se ela atende o equipamento indicado: "sim", "nao" ou "verificar"; "motivo" em at\xE9 8 palavras).
- "perguntas": no m\xE1ximo 3 perguntas curtas que o vendedor deve fazer ao cliente para confirmar a indica\xE7\xE3o.
- "alternativas": no m\xE1ximo 3 op\xE7\xF5es que servem (m\xE1quinas, tratores ou modelos Roder), com "obs" de at\xE9 4 palavras (ex.: "CVT de s\xE9rie").
- "produto": o nome exato do modelo Roder principal da resposta, como est\xE1 no cat\xE1logo (ex.: "SSH 150", "R400", "CMF 600").
- "confirmar_maquina": true s\xF3 quando a pergunta for qual kit de instala\xE7\xE3o usar numa m\xE1quina (regra de confirma\xE7\xE3o da m\xE1quina).
- "videos": s\xF3 quando houver v\xEDdeo \xFAtil, seguindo a lista V\xCDDEOS DISPON\xCDVEIS mais abaixo (o bloco pode ter s\xF3 "videos" e "produto").
- Se nada disso se aplica (ex.: sauda\xE7\xE3o), n\xE3o escreva o bloco. Nunca mencione o bloco no texto e nunca escreva <painel> em outro lugar da resposta. O texto da resposta continua curto, em portugu\xEAs, seguindo todas as regras acima.` : "";
          let videosDisponiveis = [];
          if (querPainel) {
            try {
              videosDisponiveis = await bibliotecaVideos.listar();
            } catch {
              videosDisponiveis = [];
            }
          }
          const idsVideos = new Set(videosDisponiveis.filter((v) => v.tipo !== "amostra").map((v) => String(v.id)));
          const conversaRecente = [...(Array.isArray(chatHistory) ? chatHistory.slice(-6) : []).map((m) => String(m?.content || "").slice(0, 600)), String(question || "")].join(" ");
          const instrucaoDosVideos = querPainel ? instrucaoVideos(videosDisponiveis, conversaRecente) + instrucaoAmostra(!!videoAmostraDe(videosDisponiveis)) : "";
          const finalSystemInstruction = systemInstruction + userTypeInstruction + contextoTrator + `

LEMBRETE FINAL (PRIORIDADE M\xC1XIMA): siga as REGRAS PRIORIT\xC1RIAS A, B, C e D do in\xEDcio. Resposta curta e direta; se faltar dado essencial, pergunte antes; no m\xE1ximo 1 foto e s\xF3 do equipamento recomendado. Pergunta de QUAL KIT usar numa m\xE1quina: nunca afirme o kit pelo modelo ou pelo n\xFAmero de s\xE9rie; explique em 2 frases, diga o que confirmar e ofere\xE7a o pedido de confirma\xE7\xE3o ao cliente.` + instrucaoPainel + instrucaoDosVideos;
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
          let painelJson = "";
          {
            const blocos = Array.from(String(result).matchAll(/<\s*painel\s*>([\s\S]*?)<\s*\/\s*painel\s*>/gi));
            if (blocos.length) painelJson = blocos[blocos.length - 1][1].trim();
            result = String(result).replace(/<\s*painel\s*>[\s\S]*?<\s*\/\s*painel\s*>/gi, "").replace(/<\s*painel\b[\s\S]*$/i, "").trim();
          }
          try {
            result = fixConsultantImages(result, catalogImageIndex);
          } catch (imgErr) {
            console.warn("[engineerHelper] fixConsultantImages:", imgErr?.message);
          }
          const textoParaGuardar = result;
          let painelValido = "";
          if (painelJson) {
            painelValido = sanitizarPainel(painelJson, idsVideos);
          }
          if (querPainel && painelValido) result = `${result}

<painel>${painelValido}</painel>`;
          try {
            const userInfo2 = args.userInfo || {};
            const topic = await classifyQuestionTopic(ai, question);
            await db.collection("roder_ai_questions").add({
              question,
              answer: textoParaGuardar,
              ...painelValido ? { painel: painelValido } : {},
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
          const { fileBase64, mimeType } = args;
          const tipoArquivo = /^(application\/pdf|image\/(jpeg|png|webp))$/.test(String(mimeType || "")) ? String(mimeType) : "application/pdf";
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
              { inlineData: { data: fileBase64, mimeType: tipoArquivo } }
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
        decodedToken = await import_firebase_admin.default.auth().verifyIdToken(token, true);
      } catch (tokenErr) {
        console.error("[AUTH-ADMIN] Token verification failed:", tokenErr.message);
        if (tokenErr?.code === "auth/id-token-revoked") {
          return res.status(401).json({ codigo: "token_revogado", error: "Seu acesso foi encerrado. Entre de novo com seu e-mail e senha." });
        }
        return res.status(401).json({ codigo: "token_invalido", error: "Token de autentica\xE7\xE3o inv\xE1lido ou expirado." });
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
      if (decodedToken.firebase?.sign_in_provider === "anonymous") {
        return res.status(403).json({ error: "Acesso negado." });
      }
      const papelQuemPede = String(requesterData?.role || "");
      const diretoria = ehDiretoriaPeloToken(decodedToken);
      if (!diretoria && !["admin", "manager", "triagem"].includes(papelQuemPede)) {
        console.warn(`[AUTH-ADMIN] Access denied for ${requesterData?.email || decodedToken.email || requesterUid}`);
        return res.status(403).json({ error: "Acesso negado. Administradores e Gestores podem definir senhas." });
      }
      const emailAlvo = String(email).toLowerCase().trim();
      const uidAlvo = String(req.body?.uid || "").trim();
      const consultasEmail = [emailAlvo, ...String(email).trim() !== emailAlvo ? [String(email).trim()] : []];
      const docsPorEmail = /* @__PURE__ */ new Map();
      for (const e of consultasEmail) {
        (await db.collection("users").where("email", "==", e).get()).docs.forEach((d) => docsPorEmail.set(d.id, d));
      }
      const porEmail = { docs: Array.from(docsPorEmail.values()), empty: docsPorEmail.size === 0, size: docsPorEmail.size };
      let cadastroAlvo = null;
      if (uidAlvo) {
        const snap = await db.collection("users").doc(uidAlvo).get();
        if (!snap.exists) return res.status(404).json({ error: "Cadastro n\xE3o encontrado na tela de Usu\xE1rios." });
        if (String(snap.data()?.email || "").toLowerCase().trim() !== emailAlvo) {
          return res.status(400).json({ error: "O e-mail n\xE3o confere com o cadastro. Salve o cadastro antes de definir a senha." });
        }
        cadastroAlvo = snap;
      } else if (porEmail.empty) {
        return res.status(404).json({ error: "Este e-mail n\xE3o tem cadastro na tela de Usu\xE1rios. Cadastre a pessoa antes de definir a senha." });
      } else if (porEmail.size > 1) {
        return res.status(409).json({ error: "H\xE1 mais de um cadastro com este e-mail. Defina a senha pelo bot\xE3o do cadastro certo (o app manda o c\xF3digo do cadastro)." });
      } else {
        cadastroAlvo = porEmail.docs[0];
      }
      let contaExistente = null;
      try {
        contaExistente = await import_firebase_admin.default.auth().getUserByEmail(emailAlvo);
      } catch (e) {
        if (e?.code !== "auth/user-not-found") throw e;
      }
      let cadastroDaConta = null;
      if (contaExistente && contaExistente.uid !== cadastroAlvo.id) {
        const sc = await db.collection("users").doc(contaExistente.uid).get();
        cadastroDaConta = { existe: sc.exists, role: String(sc.data()?.role || "") };
      }
      let cadastroAlvoEhPreCadastro = false;
      if (contaExistente && contaExistente.uid !== cadastroAlvo.id) {
        try {
          await import_firebase_admin.default.auth().getUser(cadastroAlvo.id);
        } catch (e) {
          if (e?.code !== "auth/user-not-found") throw e;
          cadastroAlvoEhPreCadastro = true;
        }
      }
      const alvo = papeisDaContaAlvo({
        cadastroAlvoId: cadastroAlvo.id,
        cadastroAlvoEhPreCadastro,
        cadastroAlvoRole: String(cadastroAlvo.data()?.role || ""),
        papeisPorEmail: porEmail.docs.map((d) => String(d.data()?.role || "")),
        contaUid: contaExistente?.uid || null,
        cadastroDaConta
      });
      if (!alvo.ok) return res.status(alvo.status || 409).json({ error: alvo.erro });
      const papeisAlvo = alvo.papeisAlvo;
      const temGoogle = !!contaExistente?.providerData?.some((pp) => pp?.providerId === "google.com");
      const permissao = podeDefinirSenha({ papelQuemPede, diretoria, papeisAlvo, emailAlvo, temGoogle });
      if (!permissao.ok) return res.status(permissao.status || 403).json({ error: permissao.erro });
      const senhaDefinidaEm = (/* @__PURE__ */ new Date()).toISOString();
      let precisaEntrarDeNovo = false;
      if (contaExistente) {
        await import_firebase_admin.default.auth().updateUser(contaExistente.uid, { password, emailVerified: true });
        await import_firebase_admin.default.auth().revokeRefreshTokens(contaExistente.uid);
        precisaEntrarDeNovo = true;
        console.log(`[AUTH-ADMIN] Password updated successfully for ${emailAlvo}`);
      } else {
        await import_firebase_admin.default.auth().createUser({ email: emailAlvo, password, emailVerified: true });
        console.log(`[AUTH-ADMIN] User created successfully with password: ${emailAlvo}`);
      }
      try {
        const lote = db.batch();
        lote.update(cadastroAlvo.ref, {
          initial_password: password,
          initial_password_set_at: senhaDefinidaEm,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
        lote.set(db.collection("senhas_iniciais").doc(cadastroAlvo.id), {
          cadastro_id: cadastroAlvo.id,
          email: emailAlvo,
          definida_em: senhaDefinidaEm,
          definida_por_uid: requesterUid
        });
        await lote.commit();
      } catch (dbUpdateErr) {
        console.warn("[AUTH-ADMIN] Non-fatal: could not update Firestore initial_password:", dbUpdateErr.message);
      }
      if (!(diretoria || papelQuemPede === "admin")) {
        try {
          await db.collection(COLECAO_SENHAS_PELA_GESTAO).add({
            quando: (/* @__PURE__ */ new Date()).toISOString(),
            quem_uid: requesterUid,
            quem_email: String(decodedToken.email || requesterData?.email || ""),
            quem_papel: papelQuemPede,
            email_alvo: emailAlvo,
            cadastro_id: cadastroAlvo.id,
            conta_uid: contaExistente?.uid || "",
            tipo: contaExistente ? "senha_trocada" : "conta_criada"
          });
        } catch (regErr) {
          console.error("[AUTH-ADMIN] FALHA ao gravar o registro da senha definida pela gest\xE3o (senhas_definidas_pela_gestao):", regErr?.message, { quem: requesterUid, alvo: emailAlvo });
        }
      }
      return res.json({
        success: true,
        precisa_entrar_de_novo: precisaEntrarDeNovo,
        message: precisaEntrarDeNovo ? `Senha definida para ${emailAlvo}. A pessoa vai precisar entrar de novo com a senha nova em todos os aparelhos.` : `Senha definida com sucesso para ${emailAlvo}.`
      });
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
      const dados2 = String(snap.exists && snap.data()?.data || "");
      const m = dados2.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/s);
      if (!m) return res.status(404).send("Foto n\xE3o encontrada");
      res.setHeader("Content-Type", m[1]);
      res.setHeader("Cache-Control", "public, max-age=604800");
      res.send(Buffer.from(m[2], "base64"));
    } catch (e) {
      res.status(500).send("Erro");
    }
  });
  const BUCKETS_PROJETO = [...new Set([config.storageBucket, `${config.projectId}.appspot.com`, ...BUCKETS_VIDEO].filter(Boolean))];
  const PASTA_PUBLICA = import_path.default.resolve(process.cwd(), "public");
  const lerArquivoSeguro = (raiz, relativo) => {
    try {
      const alvo = import_path.default.resolve(raiz, "." + import_path.default.posix.normalize("/" + relativo));
      if (!alvo.startsWith(raiz + import_path.default.sep)) return null;
      const st = import_fs.default.statSync(alvo);
      if (!st.isFile() || st.size > MAX_ORIGEM_BYTES) return null;
      return import_fs.default.readFileSync(alvo);
    } catch {
      return null;
    }
  };
  let sharpCarregado = void 0;
  const logoHorizontal = /* @__PURE__ */ (() => {
    let b;
    return () => b === void 0 ? b = lerArquivoSeguro(PASTA_PUBLICA, "/marca/roder-horizontal.png") || lerArquivoSeguro(import_path.default.resolve(process.cwd(), "dist"), "/marca/roder-horizontal.png") : b;
  })();
  const logoRedonda = /* @__PURE__ */ (() => {
    let b;
    return () => b === void 0 ? b = lerArquivoSeguro(PASTA_PUBLICA, "/marca/roder-redondo-512.png") || lerArquivoSeguro(import_path.default.resolve(process.cwd(), "dist"), "/marca/roder-redondo-512.png") : b;
  })();
  const bucketCache = () => (0, import_storage.getStorage)(adminApp).bucket(config.storageBucket || `${config.projectId}.appspot.com`);
  const imagemPrevia = criarImagemPrevia({
    db,
    site: SITE_PREVIA,
    buckets: BUCKETS_PROJETO,
    // sharp é nativo (vem do node_modules instalado no servidor). Se faltar, a rota manda a logo.
    carregarSharp: async () => {
      if (sharpCarregado !== void 0) return sharpCarregado;
      try {
        const m = await import("sharp");
        sharpCarregado = m.default || m;
      } catch (e) {
        console.error("[OG] biblioteca sharp n\xE3o carregou; pr\xE9via vai com a logo:", e?.message || e);
        sharpCarregado = null;
      }
      return sharpCarregado;
    },
    lerStorage: async (bucket, caminho) => {
      const file = (0, import_storage.getStorage)(adminApp).bucket(bucket).file(caminho);
      const [meta] = await file.getMetadata().catch(() => [null]);
      if (!meta || Number(meta.size || 0) > MAX_ORIGEM_BYTES) return null;
      const [buf] = await file.download();
      return buf;
    },
    lerCache: async (chave) => {
      const file = bucketCache().file(`${PASTA_CACHE}/${chave}.jpg`);
      const [existe] = await file.exists();
      if (!existe) return null;
      const [buf] = await file.download();
      return buf;
    },
    gravarCache: async (chave, jpeg) => {
      await bucketCache().file(`${PASTA_CACHE}/${chave}.jpg`).save(jpeg, { contentType: "image/jpeg", resumable: false, metadata: { cacheControl: "public, max-age=31536000" } });
    },
    lerLocal: (caminho) => caminho.startsWith("/uploads/") ? lerArquivoSeguro(uploadsDir, caminho.slice("/uploads".length)) : lerArquivoSeguro(PASTA_PUBLICA, caminho),
    logoHorizontal,
    logoRedonda,
    // JPEG pronto para quando o sharp não carregar (a og:image:type do HTML é image/jpeg)
    artePadraoPronta: /* @__PURE__ */ (() => {
      let b;
      return () => b === void 0 ? b = lerArquivoSeguro(PASTA_PUBLICA, "/og-padrao.jpg") || lerArquivoSeguro(import_path.default.resolve(process.cwd(), "dist"), "/og-padrao.jpg") : b;
    })(),
    // código fora da memória obriga a ler o banco: no máximo 60 por minuto por endereço
    limitar: (req) => passouLimite(`og:${ipDe(req)}`, 60, 6e4),
    log: (m) => console.warn(m)
  });
  app.get("/og/:arquivo", (req, res) => {
    imagemPrevia.rota(req, res);
  });
  app.post("/api/admin/fotos-externas", async (req, res) => {
    const q = await exigirAdmin(req, res);
    if (!q) return;
    try {
      const aplicar = String(req.query.aplicar || "0") === "1";
      const bucketDestino = config.storageBucket || `${config.projectId}.appspot.com`;
      const r = await fotosExternas({
        db,
        site: SITE_PREVIA,
        buckets: BUCKETS_PROJETO,
        bucketDestino,
        carregarSharp: async () => {
          try {
            const m = await import("sharp");
            return m.default || m;
          } catch {
            return null;
          }
        },
        gravar: async (caminho, bytes, tipo) => {
          const token = import_crypto4.default.randomUUID();
          await (0, import_storage.getStorage)(adminApp).bucket(bucketDestino).file(caminho).save(bytes, {
            contentType: tipo,
            resumable: false,
            metadata: { cacheControl: "public, max-age=31536000", metadata: { firebaseStorageDownloadTokens: token } }
          });
          return `https://firebasestorage.googleapis.com/v0/b/${bucketDestino}/o/${encodeURIComponent(caminho)}?alt=media&token=${token}`;
        }
      }, aplicar, q.email || q.uid);
      res.json(r);
    } catch (e) {
      if (e instanceof RodadaEmAndamento) return res.status(409).json({ ok: false, error: e.message });
      res.status(500).json({ ok: false, error: e?.message || "Erro ao conferir as fotos." });
    }
  });
  const escHtml3 = (t) => String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  async function criarLinkCurto(uid, pid, mid) {
    const existente = await db.collection("links_curtos").where("uid", "==", uid).where("pid", "==", pid).where("mid", "==", mid).limit(1).get();
    if (!existente.empty) {
      imagemPrevia.esquentar(existente.docs[0].id);
      return existente.docs[0].id;
    }
    for (let tentativa = 0; tentativa < 6; tentativa++) {
      const codigo = novoCodigo();
      const ref = db.collection("links_curtos").doc(codigo);
      const criado = await db.runTransaction(async (t) => {
        const snap = await t.get(ref);
        if (snap.exists) return false;
        t.set(ref, { uid, pid, mid, created_at: (/* @__PURE__ */ new Date()).toISOString() });
        return true;
      });
      if (criado) {
        imagemPrevia.esquentar(codigo);
        return codigo;
      }
    }
    return null;
  }
  app.post("/api/link-curto", async (req, res) => {
    try {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return res.status(401).json({ error: "Fa\xE7a login novamente." });
      const quem = await import_firebase_admin.default.auth().verifyIdToken(token);
      const pid = String(req.body?.pid || "").slice(0, 80);
      const mid = String(req.body?.mid || "").slice(0, 80);
      if (!pid) return res.status(400).json({ error: "Equipamento n\xE3o informado." });
      const chamador = await quemChama(req);
      const dono = await donoDoLinkCurto({ uid: quem.uid, role: chamador?.role }, req.body?.uid, async (u) => {
        const d = (await db.collection("users").doc(u).get()).data();
        return !!d && d.status === "active";
      });
      const codigo = await criarLinkCurto(dono, pid, mid);
      if (codigo) return res.json({ codigo });
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
      const codigo = codigoLimpo(req.params.codigo);
      let previa = previaPadrao(codigo);
      try {
        const link = codigo ? await db.collection("links_curtos").doc(codigo).get() : null;
        if (link && link.exists) {
          const l = link.data();
          const prod = await db.collection("products").doc(l.pid).get();
          if (prod.exists) {
            const p = prod.data();
            const mBruto = (p.models || []).find((x) => x.id === l.mid) || null;
            const m = mBruto ? modeloParaEnvio(mBruto) : null;
            const candidatas = candidatasDoLink(p, m);
            const imagem = urlImagemPrevia(SITE_PREVIA, codigo, candidatas);
            imagemPrevia.esquentar(codigo);
            previa = previaDoEquipamento(codigo, p, m, imagem);
          }
        }
      } catch (e) {
      }
      html = injetarPrevia(html, previa);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.type("html").send(html);
    } catch (e) {
      next();
    }
  });
  app.post("/api/consultor/equipe", async (req, res) => {
    try {
      if (passouLimite(`consequipe-ip:${ipDe(req)}`, 10, 15 * 60 * 1e3)) return res.status(429).json({ error: "Muitas tentativas. Espere alguns minutos." });
      const email = String(req.body?.email || "").trim().toLowerCase().slice(0, 120);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "E-mail inv\xE1lido." });
      const snap = await db.collection("users").where("email", "==", email).limit(1).get();
      const u = snap.empty ? null : snap.docs[0].data();
      const equipe = ["admin", "manager", "internal_seller", "triagem", "financial", "marketing", "fiscal", "vendedor_padrao"];
      if (!u || !equipe.includes(String(u.role)) || u.status !== "active") {
        return res.status(403).json({ error: "Este e-mail n\xE3o est\xE1 cadastrado na equipe Roder." });
      }
      res.json({ ok: true, name: u.name || "Equipe Roder", role: u.role });
    } catch {
      res.status(500).json({ error: "Erro ao conferir o e-mail." });
    }
  });
  app.get("/api/consultor/videos", bibliotecaVideos.rotaListarCom({
    ehEquipeDoPedido: async (req) => ehEquipe(await quemChama(req)),
    passouLimite,
    ipDe
  }));
  const BUCKET_VIDEOS = config.storageBucket || `${config.projectId}.appspot.com`;
  const origemDoApp = (o) => /^https:\/\/(www\.)?roderindica\.com$/i.test(o) || /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.run\.app$/i.test(o) || /^http:\/\/localhost(:\d+)?$/i.test(o);
  const corsConferido = /* @__PURE__ */ new Set();
  const arquivosVideos = criarRotasArquivosVideos({
    db,
    quemChama,
    passouLimite,
    nomeBucket: BUCKET_VIDEOS,
    arquivo: (caminho) => (0, import_storage.getStorage)(adminApp).bucket(BUCKET_VIDEOS).file(caminho),
    garantirCors: async (origem) => {
      if (!origemDoApp(origem) || corsConferido.has(origem)) return;
      const bucket = (0, import_storage.getStorage)(adminApp).bucket(BUCKET_VIDEOS);
      const [meta] = await bucket.getMetadata();
      const cors2 = Array.isArray(meta?.cors) ? meta.cors : [];
      const aceita = cors2.some((c) => (c.origin || []).some((x) => x === "*" || x === origem) && (c.method || []).some((m) => m === "*" || String(m).toUpperCase() === "PUT"));
      if (!aceita) {
        await bucket.setCorsConfiguration([...cors2, { origin: [origem], method: ["PUT"], responseHeader: ["Content-Type", "x-goog-content-length-range"], maxAgeSeconds: 3600 }]);
      }
      corsConferido.add(origem);
    }
  });
  app.post("/api/consultor/videos/upload-url", arquivosVideos.rotaUploadUrl);
  app.post("/api/consultor/videos/confirmar", arquivosVideos.rotaConfirmar);
  app.delete("/api/consultor/videos/arquivo", arquivosVideos.rotaApagar);
  registrarConsultorParceiro(app, {
    db,
    quemChama,
    passouLimite,
    ipDe,
    criarLinkCurto,
    campoApagado: () => import_firebase_admin.default.firestore.FieldValue.delete(),
    abrirArquivoStorage: async (bucket, caminho) => {
      const file = (0, import_storage.getStorage)(adminApp).bucket(bucket).file(caminho);
      const [existe] = await file.exists();
      if (!existe) return null;
      const [meta] = await file.getMetadata();
      return { contentType: String(meta?.contentType || ""), tamanho: Number(meta?.size || 0), stream: file.createReadStream() };
    },
    enviarEmail: (to, subject, html) => sendAutomaticEmail(to, subject, html)
  });
  app.post("/api/orcamento/registrar-link", async (req, res) => {
    try {
      if (passouLimite(`reglink-ip:${ipDe(req)}`, 10, 60 * 60 * 1e3)) return res.status(429).json({ error: "Muitas solicita\xE7\xF5es." });
      const id = String(req.body?.indicationId || "");
      const codigo = String(req.body?.codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
      if (!/^[A-Za-z0-9]{1,40}$/.test(id)) return res.status(400).json({ error: "Solicita\xE7\xE3o inv\xE1lida." });
      const ref = db.collection("indications").doc(id);
      let ind = null;
      const ok = await db.runTransaction(async (t) => {
        const snap = await t.get(ref);
        if (!snap.exists) return false;
        ind = snap.data();
        if (ind.creator_type !== "client" || ind.link_registrado_em) return false;
        const criadoEm = snap.createTime ? snap.createTime.toMillis() : 0;
        if (!criadoEm || Date.now() - criadoEm > 15 * 60 * 1e3) return false;
        t.update(ref, { link_registrado_em: (/* @__PURE__ */ new Date()).toISOString() });
        return true;
      });
      if (!ok) return res.json({ ok: false });
      const uid = String(ind.external_seller_uid || "");
      if (!uid || uid === "public_request") return res.json({ ok: true });
      const parceiro = await db.collection("users").doc(uid).get();
      if (!parceiro.exists) return res.json({ ok: true });
      const p = parceiro.data();
      const extra = {};
      if (p.name && (!ind.external_seller_name || /^(Vendedor Parceiro|Indicador)$/i.test(ind.external_seller_name))) extra.external_seller_name = p.name;
      let linkDele = false;
      if (codigo) {
        const l = await db.collection("links_curtos").doc(codigo).get();
        if (l.exists && l.data().uid === uid) {
          extra.link_curto = codigo;
          linkDele = true;
        }
      }
      if (Object.keys(extra).length) await ref.update(extra);
      if (!linkDele) return res.json({ ok: true });
      const produto = String(ind.items?.[0]?.product_name || ind.product_name || "equipamento Roder");
      await db.collection("notifications").add({
        user_uid: uid,
        title: "Pedido gerado pelo seu link!",
        message: `${String(ind.client_name || "Um cliente").replace(/[^\p{L}\p{N} .,&'-]/gu, "").slice(0, 60)} pediu or\xE7amento de ${produto.slice(0, 80)} pelo seu link. A indica\xE7\xE3o est\xE1 no seu nome.`,
        type: "success",
        read: false,
        link: "/indicacoes",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: "Erro" });
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
        if (u.origin === SITE) link = escHtml3(u.toString());
      } catch {
      }
      const PERFIS = {
        completa: { itens: ["equipamento", "frete at\xE9 a sua cidade", "instala\xE7\xE3o hidr\xE1ulica na sua m\xE1quina por t\xE9cnico Roder", "regulagem e orienta\xE7\xE3o ao operador"], consultor: "Ele vai pedir um v\xEDdeo (bra\xE7o e lan\xE7a com as tubula\xE7\xF5es, comando atr\xE1s do motor de giro, joysticks e pedais e, em CAT nova, porta traseira com a bomba; fotos s\xF3 como complemento), para confirmar se ela tem fatia extra e v\xE1lvula de regulagem de press\xE3o. \xC9 com isso que a Roder prepara a instala\xE7\xE3o hidr\xE1ulica completa." },
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
    <p>Ol\xE1${nome ? `, ${escHtml3(nome)}` : ""}.</p>
    <p>Recebemos seu pedido de or\xE7amento da <b>${escHtml3(produto)}</b>.</p>
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
  const depsRelatorio = { db, enviar: sendAutomaticEmail, formatCurrency, getFinanceReplyTo, appUrl: process.env.APP_URL };
  import_node_cron.default.schedule("0 8 1 * *", async () => {
    console.log("[Schedule] Generating Day 1 Monthly Reports...");
    try {
      await relatorioDiretoriaDia1(depsRelatorio);
    } catch (e) {
      console.error("[Schedule] Relat\xF3rio da diretoria:", e?.message);
    }
  }, { timezone: BR_TIMEZONE });
  import_node_cron.default.schedule("0 8 1 * *", async () => {
    console.log("[Schedule] Generating Day 1 Partner Reports...");
    try {
      await relatorioParceirosDia1(depsRelatorio);
    } catch (e) {
      console.error("[Schedule] Relat\xF3rio dos parceiros:", e?.message);
    }
  }, { timezone: BR_TIMEZONE });
  import_node_cron.default.schedule("0 8 5 * *", async () => {
    console.log("[Schedule] Running Day 5 Invoice Reminders...");
    try {
      await lembreteNfDia5(depsRelatorio);
    } catch (e) {
      console.error("[Schedule] Lembrete do dia 5:", e?.message);
    }
  }, { timezone: BR_TIMEZONE });
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
  const bucketProprioCrm = () => config.storageBucket || `${config.projectId}.appspot.com`;
  const assinarAnexoCrm = async (url) => {
    const ref = referenciaStorage(url);
    if (!ref || ref.bucket !== bucketProprioCrm()) return null;
    const arq = (0, import_storage.getStorage)(adminApp).bucket(ref.bucket).file(ref.caminho);
    const [meta] = await arq.getMetadata();
    const tamanho = Number(meta?.size);
    if (!Number.isFinite(tamanho)) return null;
    let assinada;
    try {
      [assinada] = await arq.getSignedUrl({ action: "read", expires: Date.now() + 24 * 60 * 60 * 1e3 });
    } catch {
    }
    return { url: assinada, tamanho };
  };
  const depsFase2Crm = () => ({ db, config: configCrm, assinarAnexo: assinarAnexoCrm, bucketProprio: bucketProprioCrm(), arrayUnion: (...v) => import_firebase_admin.default.firestore.FieldValue.arrayUnion(...v) });
  import_node_cron.default.schedule("*/10 * * * *", async () => {
    if (!configCrm().ativo) return;
    try {
      const a = await rodarAtualizacoesCrm(depsFase2Crm());
      if (a.enviadas || a.falhas) console.log(`[CRM-FASE2] atualiza\xE7\xF5es ${a.enviadas}/${a.falhas} (ok/falha).`);
    } catch (e) {
      console.error("[CRM-FASE2] Erro nas atualiza\xE7\xF5es:", e?.message);
    }
  }, { timezone: "America/Sao_Paulo" });
  import_node_cron.default.schedule("*/5 * * * *", async () => {
    if (!configCrm().ativo) return;
    try {
      const c = await rodarComissoesCrm(depsFase2Crm());
      if (c.enviadas || c.falhas) console.log(`[CRM-FASE2] comiss\xF5es ${c.enviadas}/${c.falhas} (ok/falha).`);
    } catch (e) {
      console.error("[CRM-FASE2] Erro nas comiss\xF5es:", e?.message);
    }
  }, { timezone: "America/Sao_Paulo" });
  import_node_cron.default.schedule("* * * * *", async () => {
    if (!configCrm().ativo) return;
    try {
      const r = await rodarFilaCrm({ db, config: configCrm });
      const enviadas = r.resultados.filter((x) => x.resultado === "enviada").length;
      const falhas = r.resultados.filter((x) => x.resultado === "falhou" || x.resultado === "desistiu").length;
      if (enviadas || falhas) console.log(`[CRM-ENVIO] ${enviadas} enviada(s), ${falhas} falha(s).`);
    } catch (e) {
      console.error("[CRM-ENVIO] Erro na rodada:", e?.message);
    }
  }, { timezone: "America/Sao_Paulo" });
  import_node_cron.default.schedule("10 3 * * *", async () => {
    const jobName = "auto_cancel_60d";
    const dayKey = (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA", { timeZone: BR_TIMEZONE });
    try {
      await db.collection("cron_locks").doc(`${jobName}_${dayKey}`).create({
        job: jobName,
        day: dayKey,
        started_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (lockErr) {
      if (lockErr?.code === 6) {
        console.log(`[AUTO-CANCEL-60D] J\xE1 executado ou em execu\xE7\xE3o hoje (${dayKey}).`);
      } else {
        console.error("[AUTO-CANCEL-60D] N\xE3o consegui criar a trava do dia:", lockErr?.message);
      }
      return;
    }
    const SESSENTA_DIAS = 60 * 24 * 60 * 60 * 1e3;
    const expiryOf = (ind) => {
      if (ind.protection_expires_at) {
        const t = new Date(ind.protection_expires_at).getTime();
        return Number.isFinite(t) ? t : null;
      }
      if (ind.budget_sent_at) {
        const t = new Date(ind.budget_sent_at).getTime();
        return Number.isFinite(t) ? t + SESSENTA_DIAS : null;
      }
      return null;
    };
    const hasSalesOrder = (ind) => !!(ind.sale_order_number && String(ind.sale_order_number).trim());
    let cancelled = 0;
    try {
      const snap = await db.collection("indications").where("status", "==", "negotiating").get();
      const nowMs = Date.now();
      for (const d of snap.docs) {
        if (cancelled >= 25) {
          console.warn("[AUTO-CANCEL-60D] Teto de 25 por dia atingido; o resto fica para amanh\xE3.");
          break;
        }
        const pre = d.data();
        if (hasSalesOrder(pre)) continue;
        const preExpiry = expiryOf(pre);
        if (preExpiry === null || preExpiry > nowMs) continue;
        try {
          const done = await db.runTransaction(async (tx) => {
            const fresh = await tx.get(d.ref);
            if (!fresh.exists) return null;
            const ind = fresh.data();
            if (ind.status !== "negotiating" || hasSalesOrder(ind)) return null;
            const exp = expiryOf(ind);
            if (exp === null || exp > Date.now()) return null;
            const nowIso2 = (/* @__PURE__ */ new Date()).toISOString();
            tx.update(d.ref, {
              status: "cancelled",
              cancellation_reason: "Prazo expirado",
              cancellation_details: "Lead cancelado automaticamente ap\xF3s 60 dias de validade da proposta, sem pedido de venda carregado.",
              cancelled_automatically_at: nowIso2,
              updated_at: nowIso2,
              negotiation_history: import_firebase_admin.default.firestore.FieldValue.arrayUnion({
                id: import_crypto4.default.randomBytes(6).toString("hex"),
                type: "status_change",
                author_name: "Sistema",
                created_at: nowIso2,
                content: `Cancelamento autom\xE1tico: a prote\xE7\xE3o de 60 dias venceu em ${new Date(exp).toLocaleDateString("pt-BR", { timeZone: BR_TIMEZONE })} sem pedido de venda carregado. Pode ser renovada se o interesse do cliente for comprovado.`,
                attachments: []
              })
            });
            return ind;
          });
          if (!done) continue;
          cancelled++;
          const nowIso = (/* @__PURE__ */ new Date()).toISOString();
          const client = done.client_name || "cliente";
          const recipients = Array.from(new Set([done.external_seller_uid, done.internal_seller_uid].filter(Boolean)));
          for (const uid of recipients) {
            const isPartner = uid === done.external_seller_uid;
            await db.collection("notifications").add({
              user_uid: uid,
              title: "Negocia\xE7\xE3o expirada",
              message: isPartner ? `A prote\xE7\xE3o de 60 dias da sua indica\xE7\xE3o ${client} venceu sem pedido de venda e a negocia\xE7\xE3o foi cancelada. Se o cliente ainda tiver interesse, fale com a Roder para renovar.` : `A negocia\xE7\xE3o com ${client} foi cancelada automaticamente: a prote\xE7\xE3o de 60 dias venceu sem pedido de venda.`,
              type: "warning",
              read: false,
              link: "/indicacoes",
              created_at: nowIso
            });
          }
        } catch (docErr) {
          console.error(`[AUTO-CANCEL-60D] Erro na indica\xE7\xE3o ${d.id}:`, docErr?.message);
        }
      }
      await db.collection("cron_locks").doc(`${jobName}_${dayKey}`).set({
        finished_at: (/* @__PURE__ */ new Date()).toISOString(),
        cancelled
      }, { merge: true });
      console.log(`[AUTO-CANCEL-60D] ${cancelled} negocia\xE7\xE3o(\xF5es) cancelada(s).`);
    } catch (e) {
      console.error("[AUTO-CANCEL-60D] Erro:", e?.message);
    }
  }, { timezone: BR_TIMEZONE });
  import_node_cron.default.schedule("30 7 * * *", async () => {
    if (!db) return;
    await conciliarComTrava({ db, arrayUnion: (...v) => import_firebase_admin.default.firestore.FieldValue.arrayUnion(...v) }, "di\xE1ria");
  }, { timezone: BR_TIMEZONE });
  import_node_cron.default.schedule("0 8 7 * *", async () => {
    console.log("[Schedule] Generating Day 7 Finance Reminders...");
    try {
      await lembreteFinanceiroDia7(depsRelatorio);
    } catch (e) {
      console.error("[Schedule] Lembrete do dia 7:", e?.message);
    }
  }, { timezone: BR_TIMEZONE });
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
        const nome = (u.name || "").toLowerCase();
        const isSellerRole = (u.role === "internal_seller" || ["monali", "heloisa", "helo\xEDsa"].some((n) => nome.includes(n))) && u.role !== "triagem" && !nome.includes("yury");
        if (!isSellerRole) return false;
        if (u.is_lead_receiver !== true) return false;
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
      const cfgCrm = configCrm();
      const crmDesde = cfgCrm.ativo ? cfgCrm.ativoDesde || await lerDataDaVirada(db).catch(() => null) : null;
      for (const docRef of pendingSnap.docs) {
        const indData = { id: docRef.id, ...docRef.data() };
        if (triagemEhDoCrm(indData, { ...cfgCrm, ativoDesde: crmDesde }, now)) continue;
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
          const jaDona = indData.internal_seller_uid && availableSellers.find((sl) => sl.uid === indData.internal_seller_uid);
          const chosenSeller = jaDona || sellerLeadCounts[0].seller;
          const atual = await db.collection("indications").doc(indData.id).get();
          if (!atual.exists || atual.data()?.status !== "pending") continue;
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
            content: `[SLA Expirado - 4 Horas \xDAteis]: O limite de triagem (4h \xFAteis no hor\xE1rio comercial de Bras\xEDlia: Seg-Sex 07:00 \xE0s 17:00) expirou. O lead foi distribu\xEDdo automaticamente para o(a) vendedor(a) ${chosenSeller.name}.`,
            attachments: []
          };
          await db.collection("indications").doc(indData.id).update({
            internal_seller_uid: chosenSeller.uid,
            internal_seller_name: chosenSeller.name,
            internal_seller_email: chosenSeller.email || null,
            status: "negotiating",
            updated_at: (/* @__PURE__ */ new Date()).toISOString(),
            duplicate_reviewed: true,
            negotiation_history: [...indData.negotiation_history || [], ...entradaParaGravar(indData) ? [entradaParaGravar(indData)] : [], historyEntry]
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
                  <p style="font-size: 15px; color: #475569;">O lead do cliente <strong>${indData.client_name || indData.client_person_name || "Cliente"}</strong> foi atribu\xEDdo para a sua carteira e j\xE1 est\xE1 dispon\xEDvel no <strong>Roder Indica</strong>.</p>
                  
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
                    <a href="https://roderindica.com/indicacoes" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">ACESSAR PAINEL DO VENDEDOR</a>
                  </div>
                </div>
              </div>
            `;
            await sendAutomaticEmail(chosenSeller.email, emailSubjectSeller, emailHtmlSeller);
          }
          const partnerEmail = partnerData?.email;
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
        }
      }
    } catch (error) {
      console.error("[Schedule] Error in automatic lead assignment cron:", error);
    }
  }, {
    timezone: BR_TIMEZONE
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
  const backfillDonoIndicacoes = async () => {
    const trava = db.collection("cron_locks").doc("backfill_dono_indicacoes_v1");
    try {
      await trava.create({ job: "backfill_dono_indicacoes_v1", started_at: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (e) {
      if (e?.code === 6) {
        const t = (await trava.get()).data() || {};
        const velha = !t.finished_at && t.started_at && Date.now() - new Date(t.started_at).getTime() > 30 * 60 * 1e3;
        if (!velha) return;
        await trava.set({ started_at: (/* @__PURE__ */ new Date()).toISOString(), retomada: true }, { merge: true });
      } else {
        console.error("[BACKFILL-DONO] N\xE3o consegui criar a trava:", e?.message);
        return;
      }
    }
    try {
      const normalizar3 = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
      const parceiros = await db.collection("users").where("role", "in", ["external_seller", "vendedor_padrao"]).get();
      const porNome = /* @__PURE__ */ new Map();
      const porEmail = /* @__PURE__ */ new Map();
      const emailDe = /* @__PURE__ */ new Map();
      parceiros.docs.forEach((u) => {
        const d = u.data();
        const uid = String(d.uid || u.id);
        const nome = normalizar3(d.name);
        const email = String(d.email || "").toLowerCase().trim();
        if (email) {
          emailDe.set(uid, email);
          if (!porEmail.has(email)) porEmail.set(email, /* @__PURE__ */ new Set());
          porEmail.get(email).add(uid);
        }
        if (nome) {
          if (!porNome.has(nome)) porNome.set(nome, /* @__PURE__ */ new Set());
          porNome.get(nome).add(uid);
        }
      });
      const unico = (m, chave) => {
        const s = chave ? m.get(chave) : void 0;
        return s && s.size === 1 ? Array.from(s)[0] : null;
      };
      const indicacoes = await db.collection("indications").select("external_seller_uid", "external_seller_email", "external_seller_name", "indicator_name").get();
      let lote = db.batch();
      let noLote = 0;
      const n = { porEmail: 0, porNome: 0, emailMinusculo: 0, ambiguo: 0, semPar: 0 };
      const gravar = async (ref, dados2) => {
        lote.update(ref, dados2);
        noLote++;
        if (noLote >= 400) {
          await lote.commit();
          lote = db.batch();
          noLote = 0;
        }
      };
      for (const d of indicacoes.docs) {
        const ind = d.data();
        const dados2 = {};
        const emailGravado = typeof ind.external_seller_email === "string" ? ind.external_seller_email : "";
        const emailMin = emailGravado.toLowerCase().trim();
        if (emailGravado && emailGravado !== emailMin) {
          dados2.external_seller_email = emailMin;
          n.emailMinusculo++;
        }
        const temUid = typeof ind.external_seller_uid === "string" && ind.external_seller_uid.trim() !== "";
        if (!temUid) {
          let uid = unico(porEmail, emailMin);
          if (uid) n.porEmail++;
          if (!uid) {
            const candidatos = /* @__PURE__ */ new Set();
            let ambiguo = false;
            for (const campo of ["external_seller_name", "indicator_name"]) {
              const nome = normalizar3(ind[campo]);
              if (!nome || !porNome.has(nome)) continue;
              const s = porNome.get(nome);
              if (s.size > 1) ambiguo = true;
              else candidatos.add(Array.from(s)[0]);
            }
            if (!ambiguo && candidatos.size === 1) {
              uid = Array.from(candidatos)[0];
              n.porNome++;
            } else if (ambiguo || candidatos.size > 1) n.ambiguo++;
            else if (ind.external_seller_name || ind.indicator_name) n.semPar++;
          }
          if (uid) {
            dados2.external_seller_uid = uid;
            if (!emailMin && emailDe.get(uid)) dados2.external_seller_email = emailDe.get(uid);
          }
        }
        if (Object.keys(dados2).length) await gravar(d.ref, dados2);
      }
      if (noLote > 0) await lote.commit();
      await trava.set({ finished_at: (/* @__PURE__ */ new Date()).toISOString(), ...n }, { merge: true });
      console.log(`[BACKFILL-DONO] Indica\xE7\xF5es lidas: ${indicacoes.size}. Dono pelo e-mail: ${n.porEmail}; pelo nome: ${n.porNome}; e-mail passado para min\xFAsculas: ${n.emailMinusculo}; nome repetido (n\xE3o mexi): ${n.ambiguo}; nome sem parceiro: ${n.semPar}.`);
    } catch (e) {
      console.error("[BACKFILL-DONO] Erro:", e?.message);
      try {
        await trava.delete();
      } catch {
      }
    }
  };
  const marcarContasDaEquipe = async () => {
    const nomeTrava = TRAVA_EMAIL_CONFIRMADO;
    const trava = db.collection("cron_locks").doc(nomeTrava);
    try {
      await trava.create({ job: nomeTrava, started_at: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (e) {
      if (e?.code === 6) {
        const t = (await trava.get()).data() || {};
        const velha = !t.finished_at && t.started_at && Date.now() - new Date(t.started_at).getTime() > 30 * 60 * 1e3;
        if (!velha) return;
        await trava.set({ started_at: (/* @__PURE__ */ new Date()).toISOString(), retomada: true }, { merge: true });
      } else {
        console.error("[EMAIL-CONFIRMADO] N\xE3o consegui criar a trava:", e?.message);
        return;
      }
    }
    try {
      const n = { contas: 0, comSenhaSemConfirmar: 0, marcadas: 0, semCadastroAtivo: 0, diretoria: 0, erros: 0 };
      const marcadas = [];
      const pendentes = [];
      let pagina;
      do {
        const lista = await import_firebase_admin.default.auth().listUsers(1e3, pagina);
        for (const conta of lista.users) {
          n.contas++;
          try {
            const cadastro = (await db.collection("users").doc(conta.uid).get()).data();
            const preCadastro = !cadastro && conta.email ? !(await db.collection("users").where("email", "==", String(conta.email).toLowerCase().trim()).limit(1).get()).empty : false;
            const decisao = classificarConta(conta, cadastro, preCadastro);
            if (decisao === "pular") continue;
            n.comSenhaSemConfirmar++;
            const emailConta = String(conta.email).toLowerCase();
            if (decisao === "marcar") {
              await import_firebase_admin.default.auth().updateUser(conta.uid, { emailVerified: true });
              n.marcadas++;
              marcadas.push({ email: emailConta, role: String(cadastro?.role || ""), doc_id: conta.uid });
            } else {
              if (decisao === "diretoria") n.diretoria++;
              else n.semCadastroAtivo++;
              pendentes.push({ email: emailConta, motivo: decisao });
            }
          } catch (e) {
            n.erros++;
            pendentes.push({ email: String(conta.email || conta.uid).toLowerCase(), motivo: "erro" });
            console.error(`[EMAIL-CONFIRMADO] Erro na conta ${conta.uid}:`, e?.message);
          }
        }
        pagina = lista.pageToken;
      } while (pagina);
      await trava.set({ finished_at: (/* @__PURE__ */ new Date()).toISOString(), ...n, marcadas_emails: marcadas.slice(0, 300), pendentes: pendentes.slice(0, 300) }, { merge: true });
      console.log(`[EMAIL-CONFIRMADO] Contas lidas: ${n.contas}. Com senha e e-mail n\xE3o confirmado: ${n.comSenhaSemConfirmar}. Marcadas como confirmadas (cadastro ativo): ${n.marcadas}. Deixadas como est\xE3o: ${n.semCadastroAtivo + n.diretoria} (diretoria: ${n.diretoria}). Erros: ${n.erros}.`);
    } catch (e) {
      console.error("[EMAIL-CONFIRMADO] Erro:", e?.message);
      try {
        await trava.delete();
      } catch {
      }
    }
  };
  const onServerListen = () => {
    console.log(`Server running on port/socket: ${PORT}`);
    setTimeout(() => {
      if (db) backfillDonoIndicacoes();
    }, 8e3);
    setTimeout(() => {
      if (db) marcarContasDaEquipe();
    }, 12e3);
    setTimeout(() => {
      if (db) ligarEmailsComissaoUmaVez(db).catch(() => {
      });
    }, 9e3);
    setTimeout(() => {
      if (db) conciliarComTrava({ db, arrayUnion: (...v) => import_firebase_admin.default.firestore.FieldValue.arrayUnion(...v) }, "in\xEDcio do servidor").catch(() => {
      });
    }, 15e3);
    setTimeout(() => {
      if (db) garantirEmailsLigados(db).catch(() => {
      });
    }, 12e3);
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
