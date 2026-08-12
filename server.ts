import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import cron from "node-cron";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import { createRequire } from "module";
import cors from "cors";

let customRequire: any;
if (typeof require !== "undefined") {
  customRequire = require;
} else {
  try {
    customRequire = createRequire(import.meta.url);
  } catch (err) {
    customRequire = (moduleName: string) => {
      console.warn("Could not load module dynamically in ESM", moduleName);
      return {};
    };
  }
}

const { PDFParse } = customRequire("pdf-parse");

dotenv.config();

import admin from "firebase-admin";
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { ACCESSORIES_DATA, INSTALLATION_KITS } from "./src/constants.js";

// Resolve __dirname safely to avoid crashes in bundled CommonJS mode
const __dirname = process.cwd();

let config: any = {};
try {
  const saConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(saConfigPath)) {
    config = JSON.parse(fs.readFileSync(saConfigPath, 'utf8'));
  }
} catch (e: any) {
  console.warn('[FIREBASE-ADMIN] Could not load firebase-applet-config.json:', e.message);
}

let adminApp: admin.app.App;

if (admin.apps.length === 0) {
  let credential: admin.credential.Credential | undefined;

  // 1. Try to load service account from environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const saStr = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      let sa;
      if (saStr.startsWith('{')) {
        sa = JSON.parse(saStr);
      } else {
        sa = JSON.parse(Buffer.from(saStr, 'base64').toString('ascii'));
      }
      credential = admin.credential.cert(sa);
      console.log("[FIREBASE-ADMIN] Initialized using FIREBASE_SERVICE_ACCOUNT environment variable.");
    } catch (e: any) {
      console.error("[FIREBASE-ADMIN] Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:", e.message);
    }
  }

  // 2. Try to load service account from a local file
  if (!credential) {
    const saPath = path.join(process.cwd(), 'firebase-service-account.json');
    if (fs.existsSync(saPath)) {
      try {
        const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
        credential = admin.credential.cert(sa);
        console.log("[FIREBASE-ADMIN] Initialized using firebase-service-account.json file.");
      } catch (e: any) {
        console.error("[FIREBASE-ADMIN] Failed to parse firebase-service-account.json file:", e.message);
      }
    }
  }

  const initConfig: any = {
    projectId: config.projectId || process.env.FIREBASE_PROJECT_ID || 'ai-studio-e7c58188-6deb-4a73-b6a5-1858f8dce981',
  };

  if (credential) {
    initConfig.credential = credential;
  }

  adminApp = admin.initializeApp(initConfig);
} else {
  adminApp = admin.app();
}

const db = getFirestore(adminApp, config.firestoreDatabaseId || process.env.FIRESTORE_DATABASE_ID || '(default)');

function getTodayLocalDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLocalDateString(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString.split('T')[0];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initialize Gemini AI (Server-side)
let genAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in the server environment!");
      return null;
    }
    // Log key length for debugging (safely)
    console.log(`[AI] Initializing with key length: ${apiKey.length}`);
    genAI = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'user-agent': 'aistudio-build'
        }
      }
    });
  }
  return genAI;
}

async function generateContentWithRetry(ai: GoogleGenAI, params: {
  contents: any;
  config?: any;
  defaultModel?: string;
}): Promise<any> {
  const modelToUse = params.defaultModel || "gemini-3.5-flash";
  const maxAttempts = 2;
  let delay = 800;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model: modelToUse,
        contents: params.contents,
        config: params.config,
      });
    } catch (error: any) {
      console.warn(`Error on attempt ${attempt}/${maxAttempts} with model ${modelToUse}:`, error);
      
      const errorStr = (error.message || "").toLowerCase();
      const statusCode = error.status || error.statusCode || 0;
      
      const isRetryable = 
        statusCode === 429 || 
        statusCode === 503 ||
        statusCode === 500 ||
        errorStr.includes("429") || 
        errorStr.includes("503") || 
        errorStr.includes("500") || 
        errorStr.includes("quota") || 
        errorStr.includes("exhausted") || 
        errorStr.includes("rate limit") || 
        errorStr.includes("unavailable") || 
        errorStr.includes("high demand") || 
        errorStr.includes("overloaded") || 
        errorStr.includes("temporary") || 
        errorStr.includes("temp") || 
        errorStr.includes("busy");
        
      if (isRetryable && attempt < maxAttempts) {
        console.warn(`Retryable error detected. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      
      // Standard robust cascade fallback of production-ready stable models
      const fallbacks = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
      for (const fallbackModel of fallbacks) {
        if (modelToUse !== fallbackModel) {
          console.warn(`[AI-FALLBACK] Attempting fallback to stable model '${fallbackModel}'...`);
          try {
            await new Promise(resolve => setTimeout(resolve, 500));
            return await ai.models.generateContent({
              model: fallbackModel,
              contents: params.contents,
              config: params.config,
            });
          } catch (fallbackErr: any) {
            console.error(`[AI-FALLBACK] Fallback model '${fallbackModel}' failed:`, fallbackErr.message || fallbackErr);
          }
        }
      }
      
      throw error;
    }
  }
}

async function classifyQuestionTopic(ai: GoogleGenAI, question: string): Promise<string> {
  const lower = question.toLowerCase();
  if (lower.includes("compativ") || lower.includes("compatíb") || lower.includes("peso") || lower.includes("tonelada") || lower.includes("escavadeira") || lower.includes("trator") || lower.includes("indica") || lower.includes("pc")) return "Compatibilidade";
  if (lower.includes("produtiv") || lower.includes("ciclo") || lower.includes("t/h") || lower.includes("fórmula") || lower.includes("madeira") || lower.includes("calcul") || lower.includes("produz")) return "Produtividade de Garra";
  if (lower.includes("estoque") || lower.includes("pronta entrega") || lower.includes("disponiv") || lower.includes("temos") || lower.includes("disponibilidade") || lower.includes("tem no estoque")) return "Estoque/Disponibilidade";
  if (lower.includes("caçamba") || lower.includes("high tip") || lower.includes("pá carregadeira") || lower.includes("descarga") || lower.includes("capacidade")) return "Caçamba High Tip";
  return "Dúvida Geral";
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Set up standard and highly compatible CORS middleware using the 'cors' library
  app.use(cors({
    origin: function (origin, callback) {
      // Allow all origins (including localhost, roderindica.com, and other custom domains)
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma']
  }));

  app.use(express.json({ limit: '50mb' }));

  // Ensure local uploads directory exists for robust image fallback
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  // Serve uploads with express static middleware
  app.use("/uploads", express.static(uploadsDir));

  // API routes
  app.get("/api/health", async (req, res) => {
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const hasServiceAccount = !!(process.env.FIREBASE_SERVICE_ACCOUNT || fs.existsSync(path.join(process.cwd(), 'firebase-service-account.json')));
    
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
      // Query Firestore settings with a tight 3-second timeout to prevent server hanging
      const testPromise = db.collection('settings').doc('email').get();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firestore check timed out")), 3000)
      );
      
      await Promise.race([testPromise, timeoutPromise]);
      
      res.json({ 
        status: "ok",
        hasGeminiKey: true,
        hasServiceAccount: true,
        env: process.env.NODE_ENV,
        forceViteDev: process.env.FORCE_VITE_DEV
      });
    } catch (dbErr: any) {
      console.error("[HEALTHCHECK] Firestore connectivity check failed:", dbErr.message);
      return res.status(200).json({ 
        status: "degraded", 
        message: "Firestore check failed: " + dbErr.message,
        hasGeminiKey,
        hasServiceAccount
      });
    }
  });

  app.post("/api/parse-kits-pdf", async (req, res) => {
    try {
      const { fileBase64, rawText } = req.body;
      let text = rawText || "";

      if (fileBase64) {
        try {
          const pdfParse = customRequire("pdf-parse");
          const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, '');
          const buffer = Buffer.from(cleanBase64, 'base64');
          const pdfData = await pdfParse(buffer);
          text = pdfData.text || "";
        } catch (pdfErr: any) {
          console.error("[PARSE-PDF] Error parsing PDF buffer with pdf-parse:", pdfErr.message);
        }
      }

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: "Nenhum texto ou arquivo PDF válido recebido." });
      }

      // Robust kit parser
      const kitsMap = new Map<string, { code: string; description: string; items: { code: string; description: string; quantity: number }[] }>();

      const lines = text.split(/\r?\n/);
      let currentKitCode: string | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip report metadata lines
        if (
          line.startsWith('Roder Máquinas') ||
          line.startsWith('Quant. Item Pai') ||
          line.includes('DBCorp PCR') ||
          line.startsWith('Nível Nº Item') ||
          line.startsWith('Filtros:') ||
          line.includes('Relatório de Estruturas')
        ) {
          continue;
        }

        // Check for kit header line, e.g. "9000.9000.9000 KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA..."
        const kitMatch = line.match(/(9000\.\d{4}\.\d{4})\s+(.+?)(?:\s+UN\s+\d+|\s+UN|$)/i);
        if (kitMatch && !line.match(/\d{4}\.\d{4}\.\d{4}\s+.+?\s+(UN|PC|MT|PAR)\s+[\d,]+/i)) {
          const code = kitMatch[1].trim();
          let desc = kitMatch[2].trim();
          desc = desc.replace(/^Item\s+UN\s+Versão\s+/i, '').replace(/\s+UN\s*\d*$/i, '').trim();

          currentKitCode = code;
          if (!kitsMap.has(code)) {
            kitsMap.set(code, { code, description: desc, items: [] });
          } else if (desc && kitsMap.get(code)!.description !== desc) {
            kitsMap.get(code)!.description = desc;
          }
          continue;
        }

        // Check for item row line in active kit
        if (currentKitCode && kitsMap.has(currentKitCode)) {
          const itemMatch = line.match(/(\d{4}\.\d{4}\.\d{4})\s+(.+?)\s+(UN|PC|MT|PAR)\s+([\d]+(?:[,\.]\d+)?)/i);
          if (itemMatch) {
            const itemCode = itemMatch[1].trim();
            if (itemCode !== currentKitCode) {
              let itemDesc = itemMatch[2].trim();
              const qty = parseFloat(itemMatch[4].replace(',', '.'));

              const currentKit = kitsMap.get(currentKitCode)!;
              const existingIdx = currentKit.items.findIndex(it => it.code === itemCode);
              if (existingIdx >= 0) {
                currentKit.items[existingIdx] = {
                  code: itemCode,
                  description: itemDesc,
                  quantity: isNaN(qty) ? 1 : qty
                };
              } else {
                currentKit.items.push({
                  code: itemCode,
                  description: itemDesc,
                  quantity: isNaN(qty) ? 1 : qty
                });
              }
            }
          }
        }
      }

      const parsedKits = Array.from(kitsMap.values());
      console.log(`[PARSE-PDF] Extracted ${parsedKits.length} kits from PDF/text.`);

      res.json({
        success: true,
        count: parsedKits.length,
        kits: parsedKits
      });
    } catch (err: any) {
      console.error("[PARSE-PDF] Error processing PDF request:", err);
      res.status(500).json({ error: err.message || "Erro ao processar o arquivo PDF." });
    }
  });

  app.get("/api/sync-liugong-908", async (req, res) => {
    try {
      console.log("[SYNC-LIUGONG] Starting LIUGONG 908 syncing...");
      const colRef = db.collection('accessories');
      
      const snap = await colRef.where('brand', '==', 'LIUGONG').where('model', '==', '908').get();
      
      const accessoryData = {
        brand: 'LIUGONG',
        model: '908',
        pin: 'PINO Ø50',
        ponteira_biela_4: '1000.0000.0144',
        ponteira_biela_6: '1000.0000.0070',
        suporte_triturador: '1000.1399.0100',
        photo_urls: {
          ponteira: '/uploads/ponteira_1000_0000_0144.svg',
          suporte: '/uploads/suporte_1000_1399_0100.svg'
        },
        created_at: new Date().toISOString()
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
    } catch (err: any) {
      console.error("[SYNC-LIUGONG] Error syncing LIUGONG 908:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/clean-accessories-duplicates", async (req, res) => {
    try {
      const colRef = db.collection('accessories');
      const snap = await colRef.get();
      console.log(`[CLEAN-ACC] Total documents in accessories collection: ${snap.size}`);

      const grouped = new Map<string, any[]>();
      snap.docs.forEach(doc => {
        const data = doc.data();
        const brandClean = (data.brand || '').trim().toUpperCase();
        const modelClean = (data.model || '').trim().toUpperCase();
        const key = `${brandClean}__${modelClean}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push({ id: doc.id, ...data });
      });

      let removedCount = 0;
      const duplicatesDetail: any[] = [];

      for (const [key, items] of grouped.entries()) {
        if (items.length > 1) {
          // Sort items: keep the best one (with photos or more fields or newest)
          items.sort((a, b) => {
            const aHasPhoto = a.photo_urls && Object.values(a.photo_urls).some(Boolean) ? 1 : 0;
            const bHasPhoto = b.photo_urls && Object.values(b.photo_urls).some(Boolean) ? 1 : 0;
            if (bHasPhoto !== aHasPhoto) return bHasPhoto - aHasPhoto;
            
            const aKeys = Object.keys(a).filter(k => a[k]).length;
            const bKeys = Object.keys(b).filter(k => b[k]).length;
            if (bKeys !== aKeys) return bKeys - aKeys;

            return (b.created_at || '').localeCompare(a.created_at || '');
          });

          const keep = items[0];
          const toDelete = items.slice(1);

          duplicatesDetail.push({
            key,
            keptId: keep.id,
            deletedCount: toDelete.length,
            deletedIds: toDelete.map(d => d.id)
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
    } catch (err: any) {
      console.error("[CLEAN-ACC] Error cleaning accessories duplicates:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/list-accessories", async (req, res) => {
    try {
      const colRef = db.collection('accessories');
      const snap = await colRef.get();
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ total: docs.length, docs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/dump-history", async (req, res) => {
    try {
      console.log("[AdminFix] Starting manual database restoration from server side...");
      const colRef = db.collection('products');
      const snap = await colRef.get();
      let restoredCount = 0;

      for (const doc of snap.docs) {
        const data = doc.data();
        const docId = doc.id;
        const nameLower = (data.name || '').toLowerCase();

        // 1. CARREGADOR FRONTAL
        if (nameLower === 'carregador frontal') {
          console.log(`[AdminFix] Found Carregador Frontal product doc id: ${docId}, updating models...`);
          const originalModels = data.models || [];
          const updatedModels = originalModels.map((m: any) => {
            if (m.id === 'cfr-280') {
              return {
                ...m,
                images: ['db-file://uHCqKU8ggrCpIiqPZFKs', 'db-file://r6hzijMO4b6qvyg7OqmQ']
              };
            }
            if (m.id === 'cfr-400') {
              return {
                ...m,
                images: ['db-file://lznr9kOHOqNo553Pgw5i', 'db-file://fIaZVONv3pblJICufdwx']
              };
            }
            if (m.id === 'crf-600') {
              return {
                ...m,
                images: ['db-file://tGk9zNiABdCrjA1w9gvc']
              };
            }
            if (m.id === 'cfr-800') {
              return {
                ...m,
                images: ['db-file://IhqHVgVwQ7jsX62eo7o2']
              };
            }
            if (m.id === 'crf-1000') {
              return {
                ...m,
                images: ['db-file://wqAqO7ytRj1j99hp7MBT']
              };
            }
            if (m.id === 'crf-1200') {
              return {
                ...m,
                images: ['db-file://pp43FwKiUdz9nMu2onUu']
              };
            }
            if (m.id === 'cfr-1500') {
              return {
                ...m,
                images: ['db-file://Amd8PnY8DuJsxBK9M8kz']
              };
            }
            return m;
          });
          await colRef.doc(docId).update({ models: updatedModels });
          restoredCount++;
        }

        // 2. FELLER DE DISCO
        if (nameLower === 'feller de disco') {
          console.log(`[AdminFix] Found Feller de Disco product doc id: ${docId}, updating models...`);
          const originalModels = data.models || [];
          const updatedModels = originalModels.map((m: any) => {
            if (m.id === 'cfd-40') {
              return {
                ...m,
                images: [
                  'db-file://JTro2ibSenZ3sBRy11mH',
                  'db-file://Wz6c0AtZ8wMgfvPaAibp',
                  'db-file://KBjTjba9VlBA5nWuVA4d',
                  'db-file://m0wTGuGqtU0OgKdGfh4m',
                  'db-file://63k9qMNnFSqmMIIGBZpC',
                  'db-file://nEqdePRNK0mewgsIynZK',
                  'db-file://phhcobly6XQP1Gme71LV',
                  'db-file://FkYXlpt931ZOyGUZBO0e',
                  'db-file://zN6IsNP3GK5iiCZo4JgP',
                  'db-file://hAHfkaZWIF4LOhqEI0q1',
                  'db-file://aphOXvH9wbR2SCergEHR'
                ]
              };
            }
            return m;
          });
          await colRef.doc(docId).update({ models: updatedModels });
          restoredCount++;
        }

        // Garra Florestal
        if (nameLower === 'garra florestal') {
          console.log(`[AdminFix] Found Garra Florestal product doc id: ${docId}, clearing images...`);
          const originalModels = data.models || [];
          const updatedModels = originalModels.map((m: any) => {
            return {
              ...m,
              images: []
            };
          });
          await colRef.doc(docId).update({ models: updatedModels });
          restoredCount++;
        }

        // 3. DESBASTADOR FLORESTAL FAE
        if (nameLower.includes('desbastador florestal fae')) {
          console.log(`[AdminFix] Found Desbastador Florestal product doc id: ${docId}, updating models...`);
          const originalModels = data.models || [];
          const updatedModels = originalModels.map((m: any) => {
            if (m.id === 'fae-bl0-ex') return { ...m, images: ['db-file://tpaBKAFko6LXkBTbjYBr', 'db-file://YyvWLpsskmBHVznLiSSC', 'db-file://eavAWBFBYBssN8fmaCCd'] };
            if (m.id === 'fae-pml-ex') return { ...m, images: ['db-file://o250muUq0PnA7fQR5nCR', 'db-file://QsxxAqUDFJRo40oMtXpt', 'db-file://uigCh3oqg876krXWU0qa'] };
            if (m.id === 'fae-bl1-ex-vt') return { ...m, images: ['db-file://KxCghJ5QsKPTfZaoAR7R', 'db-file://4y38tfNrliO7S3VXj9nT', 'db-file://sS0Iavw9T0X4n0GDW4az', 'db-file://65MBZrx9KoO7oJ947rgS'] };
            if (m.id === 'fae-dml-hy') return { ...m, images: ['db-file://8h8pALZN9iG5fd4Q9Snb', 'db-file://mhymO2tQOxcvGSqUS4h4', 'db-file://ohgeHtitPErHqIgDMHI7'] };
            if (m.id === 'fae-bl2-ex-vt') return { ...m, images: ['db-file://US9zYchyK8uPhI2ymmd0', 'db-file://hM1qTk09k1O977KpPSSV'] };
            if (m.id === 'fae-bl3-ex-vt') return { ...m, images: ['db-file://8tiM6rH16NMur1q4xqOv', 'db-file://jw4WyK6lEiyBgjIYErPd', 'db-file://2Cj5FikMsYfxGC7kObpG'] };
            if (m.id === 'fae-uml-ex-vt') return { ...m, images: ['db-file://xH5C0o7qHCXgbPllI8hv', 'db-file://qtpHqn2BHOj2zaCRycbm', 'db-file://dxqB2PrQ4wcl6eUie2Zp', 'db-file://GuwOnI3DutvvG4fZn1h5', 'db-file://L8gy9gjs9CSUcIf2M6mA', 'db-file://Dwtp2CuoZNYB5bBIUzG4'] };
            if (m.id === 'fae-uml-s-ex-vt') return { ...m, images: ['db-file://YMeLIo2amVNuUgto0c3G', 'db-file://rorAafjsU30y9P9W2g9o', 'db-file://EueQzUxvKuDIiEwQmdpK'] };
            if (m.id === 'fae-umm-ex-vt') return { ...m, images: ['db-file://SLdlo717yZP2smStzcnJ', 'db-file://En5ZqIOVmzb1uoBm9JCn', 'db-file://tvABksEedUjzZdNWqzcr'] };
            return m;
          });
          await colRef.doc(docId).update({ models: updatedModels });
          restoredCount++;
        }
      }

      res.json({ success: true, message: `Manual Restoration Complete! Restored ${restoredCount} products.` });
    } catch (err: any) {
      console.error("[AdminFix] Error running fix:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Keep track of GCS availability. If it times out or fails once, bypass it for future uploads to prevent UX freezes.
  let gcsDisabled = false;

  // Upload image to Firebase Storage on the server-side, with full local disk fallback
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

      const buffer = Buffer.from(cleanBase64, 'base64');
      // Clean up file name to prevent special character paths issues
      const cleanedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filenameWithTimestamp = `${Date.now()}__${cleanedFileName}`;

      const saveToFirestoreSettings = async (url: string) => {
        if (docName) {
          try {
            // 1. Save to individual document with base64 embedded for direct fast loading
            await db.collection('settings').doc(docName).set({
              image_url: url,
              image_data: fileBase64 || url, // Store full base64 data URL if available
              updated_at: new Date().toISOString()
            });
            console.log(`[STORAGE-UPLOAD] Documento de settings '${docName}' salvo via Admin SDK no servidor com sucesso! URL: ${url}`);
          } catch (dbErr: any) {
            console.error(`[STORAGE-UPLOAD] Falha ao salvar no Firestore via Admin SDK no servidor:`, dbErr.message);
          }
        }
      };

      // 1. Try Firebase Cloud Storage Upload with 1.5s timeout
      try {
        if (gcsDisabled) {
          throw new Error("GCS previously timed out or failed. Bypassing directly to local fallback.");
        }

        const bucketName = config.storageBucket || `${config.projectId}.appspot.com`;
        console.log(`[STORAGE-UPLOAD] Tentando enviar para o primeiro bucket GCS: ${bucketName}...`);
        
        const storageInstance = getStorage(adminApp);
        let bucket = storageInstance.bucket(bucketName);
        let file = bucket.file(`${folder}/${filenameWithTimestamp}`);

        const uploadToGcs = async () => {
          try {
            await file.save(buffer, {
              contentType: contentType || 'image/jpeg',
              metadata: { cacheControl: 'public, max-age=31536000' }
            });
          } catch (saveErr: any) {
            const appspotBucket = `${config.projectId}.appspot.com`;
            if (bucketName !== appspotBucket) {
              console.warn(`[STORAGE-UPLOAD] Falha no primeiro bucket. Tentando fallback para ${appspotBucket}...`, saveErr.message);
              bucket = storageInstance.bucket(appspotBucket);
              file = bucket.file(`${folder}/${filenameWithTimestamp}`);
              await file.save(buffer, {
                contentType: contentType || 'image/jpeg',
                metadata: { cacheControl: 'public, max-age=31536000' }
              });
            } else {
              throw saveErr;
            }
          }

          // Try to make file public (optional - works if Fine-grained controls are enabled)
          try {
            await file.makePublic();
          } catch (pubErr: any) {
            console.warn("[STORAGE-UPLOAD] makePublic falhou (Uniform Bucket Access?).", pubErr.message);
          }
        };

        // Enforce a timeout of 1.5 seconds on GCS upload so it never blocks the application's UX
        await Promise.race([
          uploadToGcs(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("GCS Upload Timeout")), 1500))
        ]);

        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
        console.log(`[STORAGE-UPLOAD] Upload GCS bem-sucedido! URL: ${downloadUrl}`);
        
        // Execute background Firestore sync so we can return the URL to the client instantly without blocking
        saveToFirestoreSettings(downloadUrl).catch(dbErr => {
          console.error("[STORAGE-UPLOAD] Background settings save error:", dbErr);
        });

        return res.json({ 
          success: true, 
          url: downloadUrl 
        });

      } catch (gcsErr: any) {
        console.warn("[STORAGE-UPLOAD] GCS upload falhou ou atingiu timeout. Usando fallback de armazenamento local no servidor...", gcsErr.message);
        gcsDisabled = true; // Cache failure/timeout to speed up all subsequent uploads instantly
        
        // 2. Safe Local Storage Fallback inside the container
        const localFilePath = path.join(uploadsDir, filenameWithTimestamp);
        await fs.promises.writeFile(localFilePath, buffer);
        
        // Using relative path for robustness across standard proxies and localhost ports
        const localDownloadUrl = `/uploads/${filenameWithTimestamp}`;
        
        console.log(`[STORAGE-UPLOAD] Fallback local completo! Carregado em: ${localDownloadUrl}`);
        
        // Execute background Firestore sync so we can return the URL to the client instantly without blocking
        saveToFirestoreSettings(localDownloadUrl).catch(dbErr => {
          console.error("[STORAGE-UPLOAD] Background settings save error:", dbErr);
        });

        return res.json({ 
          success: true, 
          url: localDownloadUrl,
          isLocalFallback: true
        });
      }
    } catch (err: any) {
      console.error("[STORAGE-UPLOAD] Erro fatal no upload geral:", err);
      return res.status(500).json({ error: "Erro interno no upload via backend.", details: err.message });
    }
  });

  // Get settings document securely from server-side admin SDK to avoid client-side Firestore rules/connection blocks
  app.get("/api/settings/:docName", async (req, res) => {
    try {
      const { docName } = req.params;
      if (!docName) {
        return res.status(400).json({ error: "Nome do documento não fornecido." });
      }

      const docRef = db.collection('settings').doc(docName);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.json({ success: true, exists: false, data: null });
      }

      return res.json({ success: true, exists: true, data: docSnap.data() });
    } catch (err: any) {
      console.error(`[API-SETTINGS] Erro ao obter settings/${req.params.docName}:`, err.message);
      return res.status(500).json({ error: "Erro interno ao obter configurações.", details: err.message });
    }
  });

  // Save settings document securely from server-side admin SDK to bypass any client-side Firestore rules/auth constraints
  app.post("/api/settings/:docName", async (req, res) => {
    try {
      const { docName } = req.params;
      const data = req.body;
      if (!docName) {
        return res.status(400).json({ error: "Nome do documento não fornecido." });
      }

      const docRef = db.collection('settings').doc(docName);
      await docRef.set({
        ...data,
        updated_at: new Date().toISOString()
      }, { merge: true });

      console.log(`[API-SETTINGS] Documento '${docName}' salvo via POST API com sucesso!`);
      return res.json({ success: true, message: `Configurações de '${docName}' salvas com sucesso!` });
    } catch (err: any) {
      console.error(`[API-SETTINGS] Erro ao salvar settings/${req.params.docName}:`, err.message);
      return res.status(500).json({ error: "Erro interno ao salvar configurações.", details: err.message });
    }
  });

  // Proxy endpoint to load Firebase Storage images without CORS / read permission blocks
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).send("Faltando URL do arquivo.");
      }

      console.log(`[PROXY-IMAGE] Solicitada proxy de imagem para: ${url}`);

      // If it's starting with firebasestorage.googleapis.com, we can proxy with admin credentials
      if (url.startsWith("https://firebasestorage.googleapis.com")) {
        const match = url.match(/\/b\/([^\/]+)\/o\/([^?#]+)/);
        if (match) {
          const bucketName = decodeURIComponent(match[1]);
          const filePath = decodeURIComponent(match[2]);
          
          console.log(`[PROXY-IMAGE] Baixando do GCS: bucket=${bucketName}, path=${filePath}`);
          
          const storageInstance = getStorage(adminApp);
          const bucket = storageInstance.bucket(bucketName);
          const file = bucket.file(filePath);
          
          const [exists] = await file.exists();
          if (!exists) {
            console.warn(`[PROXY-IMAGE] Arquivo no caminho ${filePath} não existe no GCS!`);
            return res.status(404).send("Arquivo não encontrado no GCS.");
          }
          
          const [metadata] = await file.getMetadata();
          res.setHeader('Content-Type', metadata.contentType || 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          
          file.createReadStream()
            .on('error', (streamErr) => {
              console.error("[PROXY-IMAGE] Erro durante o stream da imagem:", streamErr);
              if (!res.headersSent) {
                res.status(500).send("Erro ao obter stream da imagem.");
              }
            })
            .pipe(res);
          return;
        }
      }

      // If it's already a local/relative or localhost URL, redirect to or fetch directly
      if (url.startsWith("http://localhost") || url.includes("/uploads/")) {
        const parts = url.split("/uploads/");
        if (parts.length > 1) {
          const localFile = path.join(uploadsDir, parts[1]);
          if (fs.existsSync(localFile)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            return res.sendFile(localFile);
          }
        }
      }

      // Default fallback: fetch and proxy the image server-side to bypass hotlink / CORS protections
      try {
        let refererUrl = "";
        try {
          refererUrl = new URL(url).origin + "/";
        } catch (_) {}

        // Temporarily ignore self-signed certificate errors common on local or Brazilian hosting servers
        const previousRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

        const headers: Record<string, string> = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        };
        if (refererUrl) {
          headers["Referer"] = refererUrl;
          headers["Origin"] = refererUrl.replace(/\/$/, "");
        }

        const response = await fetch(url, { headers });

        // Restore previous SSL verification setting
        if (previousRejectUnauthorized !== undefined) {
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
      } catch (fetchErr: any) {
        console.error(`[PROXY-IMAGE] Erro ao buscar imagem externa via fetch: ${fetchErr.message}. Fazendo redirect.`);
        return res.redirect(url);
      }
    } catch (error: any) {
      console.error("[PROXY-IMAGE] Erro fatal ao servir proxy da imagem:", error);
      return res.status(500).send(`Erro interno ao processar proxy de imagem: ${error.message}`);
    }
  });

  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html, replyTo, fromName, settings: bodySettings, attachments } = req.body;
    console.log(`[EMAIL-API] Recebida solicitação de envio para: ${to} | Assunto: ${subject}`);
    
    try {
      let settings = bodySettings;

      // Only try to read from DB if settings weren't passed in the body
      if (!settings) {
        try {
          const settingsSnap = await db.collection('settings').doc('email').get();
          if (settingsSnap.exists) {
            settings = settingsSnap.data();
          }
        } catch (dbErr) {
          console.warn("Could not read email settings from DB, and no settings provided in request body.");
        }
      }

      // Fallback to local server environment variables (perfect for Hostinger without Firebase service account)
      if (!settings && process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log("[EMAIL-API] No body or DB email settings found, using local server SMTP environment variables fallback.");
        settings = {
          provider: process.env.SMTP_PROVIDER || 'gmail',
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
          senderEmail: process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER
        };
      }
      
      if (!settings) {
        return res.status(400).json({ 
          error: "Configurações de e-mail não encontradas no sistema.",
          details: "O servidor não conseguiu ler o banco de dados e nenhuma configuração de SMTP local (env) foi definida."
        });
      }

      // Format attachments if present
      const formattedAttachments = attachments && Array.isArray(attachments)
        ? attachments.map((att: any) => {
            let cleanBase64 = att.content;
            if (att.content && att.content.includes(";base64,")) {
              cleanBase64 = att.content.split(";base64,")[1];
            }
            return {
              filename: att.filename,
              content: Buffer.from(cleanBase64, 'base64'),
              contentType: att.contentType || 'application/pdf'
            };
          })
        : [];

      if (settings.provider === 'resend') {
        if (!settings.apiKey) return res.status(400).json({ error: "API Key do Resend não configurada." });
        
        const resend = new Resend(settings.apiKey);
        const fromEmail = settings.senderEmail || 'vendas@roderbrasil.com.br';
        
        const toArray = typeof to === 'string'
          ? to.split(',').map((e: string) => e.trim()).filter((e: string) => e !== '')
          : Array.isArray(to) ? to : [to];

        const { data, error } = await resend.emails.send({
          from: fromName ? `${fromName} <${fromEmail}>` : `RODER Indica <${fromEmail}>`,
          to: toArray,
          subject: subject,
          html: html,
          replyTo: replyTo || fromEmail,
          attachments: formattedAttachments.map((att: any) => ({
            filename: att.filename,
            content: att.content
          }))
        });

        if (error) {
          console.error("Resend error:", error);
          return res.status(400).json({ error: error.message });
        }

        return res.json({ success: true, data });
      } else if (settings.provider === 'gmail') {
        if (!settings.user || !settings.pass) {
          return res.status(400).json({ error: "Credenciais do Gmail (usuário ou senha de app) não configuradas." });
        }

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true, // use TLS
          auth: {
            user: settings.user, // ex: roderindica@gmail.com
            pass: settings.pass.replace(/\s/g, '') // remove spaces just in case
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        const footer = `
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>Este é um e-mail automático da <strong>Roder Máquinas e Equipamentos</strong>.</p>
            <p>Para responder este atendimento, por favor, responda diretamente a este e-mail.</p>
          </div>
        `;

        const mailOptions = {
          from: fromName ? `"${fromName}" <${settings.user}>` : `"RODER Indica" <${settings.user}>`,
          to: to,
          subject: subject,
          html: `${html}${footer}`,
          replyTo: replyTo || settings.user,
          attachments: formattedAttachments
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL-API] E-mail enviado com sucesso via Gmail para ${to}. ID: ${result.messageId}`);
        return res.json({ success: true, data: result });
      } else {
        return res.status(400).json({ error: "Provedor de e-mail não suportado ou não configurado." });
      }
    } catch (err: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Thumbnail proxy error:", error);
      res.status(500).send("Failed to fetch thumbnail from Drive");
    }
  });

  // Unified Gemini API Proxy Route (runs everything securely on the server-side)
  app.post("/api/gemini/execute", async (req, res) => {
    // Utility to clean up transcription/STT inaccuracies
    const sanitizeRotatorText = (text: string): string => {
      if (!text) return "";
      return text
        .replace(/rotadores/gi, (match) => match[0] === 'R' ? 'Rotatores' : 'rotatores')
        .replace(/rotador/gi, (match) => match[0] === 'R' ? 'Rotator' : 'rotator')
        .replace(/\b(rodder|hoder|hodder|roderr|róder|róderr)\b/gi, "Roder")
        .replace(/\b(fai|fay|faé|faê|fae)\b/gi, "FAE");
    };

    try {
      const { action, args } = req.body;
      if (!action) {
        return res.status(400).json({ error: "No action specified" });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(500).json({ error: "O cliente da API Gemini não foi inicializado no servidor. Por favor, adicione a sua chave 'GEMINI_API_KEY' na aba Settings > Secrets (ou Configurações > Segredos) do seu painel do AI Studio para que as chamadas funcionem." });
      }

      let result;

      switch (action) {
        case "transcribeAudio": {
          const { audioBase64, mimeType, mode } = args;
          let prompt = `Você é um assistente da Roder Brasil, focado em ajudar vendedores a estruturar informações.
            Sua tarefa é transcrever e REGISTRAR DE FORMA ESTRUTURADA o áudio deste vendedor.

            O áudio contém detalhes sobre uma intenção de compra de garras florestais, trituradores ou acessórios.

            ESTRUTURA DESEJADA:
            - PERFIL DO CLIENTE/OPERAÇÃO: (Descreva o que o cliente faz e onde está)
            - NECESSIDADE TÉCNICA: (O que ele precisa resolver ou qual equipamento busca)
            - MÁQUINA BASE: (Detalhes da escavadeira ou trator que ele já possui)
            - OBSERVAÇÕES ADICIONAIS: (Prazos, urgência, ou detalhes específicos da negociação)

            REGRAS:
            1. Organize as informações nos tópicos acima.
            2. Caso o áudio seja muito vago, faça uma transcrição limpa e direta sem os tópicos.
            3. Melhore a gramática mantendo o vocabulário técnico (ex: garras, kit hidráulico).
            4. Retorne APENAS o texto estruturado, pronto para ser lido por um vendedor interno.
            5. ATENÇÃO MÁXIMA AO VOCABULÁRIO TÉCNICO: O termo correto para o componente de rotação é "rotator" (no singular) ou "rotatores" (no plural). NUNCA escreva "rotador" ou "rotadores" com a letra "d". Se você ouvir algo parecido com "rotador", transcreva obrigatoriamente como "rotator" ou "rotatores".`;

          if (mode === 'chat') {
            prompt = `Você é um transcritor de áudio altamente preciso e profissional especializado no ecossistema Roder Brasil.
              Sua única tarefa é transcrever verbatim (palavra por palavra) o áudio enviado pelo usuário, que é um parceiro indicador, vendedor ou cliente.
              Retorne APENAS a transcrição direta e limpa do áudio, sem adicionar comentários, explicações, saudações ou formatação de tópicos desnecessária.
              
              ATENÇÃO MÁXIMA AO VOCABULÁRIO TÉCNICO: O termo correto para o componente de rotação é "rotator" (no singular) ou "rotatores" (no plural). NUNCA escreva "rotador" ou "rotadores" com a letra "d". Se você ouvir algo parecido com "rotador", transcreva obrigatoriamente como "rotator" ou "rotatores".`;
          }

          const safeMimeType = (mimeType || 'audio/webm').split(';')[0] || 'audio/webm';
          const response = await generateContentWithRetry(ai, {
            contents: [
              { text: prompt },
              { inlineData: { data: audioBase64, mimeType: safeMimeType } }
            ]
          });
          const originalText = response.text || "Não foi possível transcrever o áudio.";
          result = sanitizeRotatorText(originalText);
          break;
        }

        case "structureDossierAudio": {
          const { audioBase64, mimeType, currentDossierText, currentCompatibilityNotes, currentChoiceReason, currentProductivityInfo, productName, modelName } = args;
          
          const prompt = `Você é um engenheiro de inteligência artificial especializado na Roder Brasil.
            Sua missão é ouvir o áudio enviado pelo consultor técnico referente ao equipamento "${productName}" - Modelo "${modelName}".
            
            Sua tarefa consiste em:
            1. Transcrever detalhadamente e com extrema precisão técnica o áudio gravado em português brasileiro.
            2. Analisar o conteúdo da fala e classificar/distribuir os trechos para as 4 categorias do Dossiê Técnico:
               - Relatório do Dossiê Geral (dossier_text)
               - Compatibilidade com máquina base e acoplamento (compatibility_notes)
               - Motivo da Escolha e diferenciais (choice_reason)
               - Dados de Produtividade e rendimento (productivity_info)
            3. ENRIQUECER os textos atuais que estão abaixo. Ao enriquecer, NUNCA apague ou remova especificações técnicas, compatibilidades ou medidas que já estão presentes nos textos originais! Preserve integralmente a riqueza dos dados técnicos originais, integrando e anexando o novo conhecimento do áudio de forma coerente e profissional no final do parágrafo correspondente ou em um novo parágrafo.
            4. Se o áudio não mencionar novos detalhes sobre uma categoria específica, mantenha o texto original correspondente intacto.

            --- TEXTOS ORIGINAIS ATUAIS DO EQUIPAMENTO ---
            - Relatório Atual (dossier_text): "${currentDossierText || ''}"
            - Compatibilidade Atual (compatibility_notes): "${currentCompatibilityNotes || ''}"
            - Motivo da Escolha Atual (choice_reason): "${currentChoiceReason || ''}"
            - Produtividade Atual (productivity_info): "${currentProductivityInfo || ''}"
            -------------------------------------------------

            Retorne a resposta estruturada estritamente no formato JSON definido no schema.`;

          const safeMimeType = (mimeType || 'audio/webm').split(';')[0] || 'audio/webm';
          const response = await generateContentWithRetry(ai, {
            defaultModel: "gemini-3.5-flash",
            contents: [
              { text: prompt },
              { inlineData: { data: audioBase64, mimeType: safeMimeType } }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  transcription: { 
                    type: Type.STRING, 
                    description: "Transcrição fiel e completa do áudio técnico gravado." 
                  },
                  dossier_text: { 
                    type: Type.STRING, 
                    description: "Relatório técnico geral enriquecido ou o texto original mantido intacto se sem alterações." 
                  },
                  compatibility_notes: { 
                    type: Type.STRING, 
                    description: "Especificações de compatibilidade enriquecidas ou o texto original mantido intacto." 
                  },
                  choice_reason: { 
                    type: Type.STRING, 
                    description: "Motivos da escolha e diferenciais enriquecidos ou o texto original mantido intacto." 
                  },
                  productivity_info: { 
                    type: Type.STRING, 
                    description: "Métricas de produtividade enriquecidas ou o texto original mantido intacto." 
                  }
                },
                required: ["transcription", "dossier_text", "compatibility_notes", "choice_reason", "productivity_info"]
              }
            }
          });

          const rawText = response.text || "{}";
          try {
            const parsed = JSON.parse(rawText);
            // Sanitize all text fields for "rotator" / "rotatores" spelling
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
            throw new Error("Resposta da IA retornou um JSON inválido para a estruturação do dossiê.");
          }
          break;
        }

        case "analyzeAndEnrichProductDossier": {
          const { question, improvedAnswer } = args;

          // 1. Fetch all products and their models to provide as options to Gemini
          let productsList: any[] = [];
          try {
            const colRef = db.collection('products');
            const snap = await colRef.get();
            
            snap.forEach(doc => {
              const data = doc.data();
              const models = (data.models || []).map((m: any) => ({
                id: m.id,
                name: m.name
              }));
              productsList.push({
                id: doc.id,
                name: data.name,
                category: data.category,
                models: models
              });
            });
          } catch (err) {
            console.error("Error loading products for enrichment matching:", err);
          }

          // 2. Query Gemini to see if this explanation matches any specific product & model
          const matchPrompt = `Você é um Engenheiro de IA especializado na Roder Brasil.
            Sua tarefa é analisar o novo conhecimento fornecido (pergunta e explicação técnica) e identificar se ele se refere ou aplica-se de forma específica a um produto e modelo do nosso catálogo.
            
            Se a informação for geral ou abstrata (não aplicável a nenhum produto específico), retorne matched: false.
            Se a informação referir-se a uma máquina portadora genérica sem focar no nosso equipamento, retorne matched: false.
            Se a informação descrever características, compatibilidade, produtividade ou motivos de escolha de um modelo ou equipamento Roder do catálogo, retorne matched: true e identifique o productId e o modelId correspondentes da lista fornecida abaixo.
            
            --- NOVO CONHECIMENTO ---
            Título/Pergunta: "${question}"
            Explicação Técnica: "${improvedAnswer}"
            
            --- LISTA DE PRODUTOS E MODELOS DO CATÁLOGO ---
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
            
            Descrição dos campos de dossiê para classificação:
            - "compatibility_notes": se falar sobre máquinas base compatíveis, engates, pinos, acoplamento, vazão, pressão, mangueiras, suportes.
            - "choice_reason": se falar sobre motivos de escolha, vantagens de mercado, indicações ideais por operação, recomendações por tipo de trabalho, diferencial do produto.
            - "productivity_info": se falar sobre rendimento, velocidade, metros cúbicos, toneladas por hora, dados de ciclos operacionais.
            - "dossier_text": se for descrição técnica geral ou detalhes estruturais gerais do equipamento.
          `;

          const matchResponse = await generateContentWithRetry(ai, {
            defaultModel: "gemini-3.5-flash",
            contents: [{ text: matchPrompt }],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  matched: { type: Type.BOOLEAN },
                  productId: { type: Type.STRING },
                  productName: { type: Type.STRING },
                  modelId: { type: Type.STRING },
                  modelName: { type: Type.STRING },
                  classifiedField: { type: Type.STRING }
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
            const dossierRef = db.collection('equipment_dossiers').doc(dossierId);
            const docSnap = await dossierRef.get();

            let currentFieldText = "";
            let dossierData: any = {
              id: dossierId,
              productId: productId,
              productName: productName || "",
              modelId: modelId,
              modelName: modelName || "",
              dossier_text: "",
              compatibility_notes: "",
              choice_reason: "",
              productivity_info: "",
              attachments: [],
              audios: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            if (docSnap.exists) {
              const data = docSnap.data();
              dossierData = { ...dossierData, ...data };
              currentFieldText = data[classifiedField] || "";
            }

            // Ask Gemini to perform the enrichment of this specific field
            const enrichPrompt = `Você é um Engenheiro de IA especialista da Roder Brasil.
              Sua tarefa é enriquecer um campo do Dossiê Técnico do equipamento "${productName}" - Modelo "${modelName}".
              
              Você deve enriquecer o texto atual integrando o novo conhecimento técnico que foi ensinado pelo administrador.
              
              DIRETRIZES DE ENRIQUECIMENTO:
              1. NUNCA apague ou remova especificações técnicas, compatibilidades, pinos, medidas ou dados que já existem no texto atual!
              2. Integre o novo conhecimento de forma fluida, coerente e com redação de alto padrão técnico em português brasileiro.
              3. Se o texto atual estiver vazio, redija uma excelente explicação baseando-se estritamente na nova informação.
              
              REGRAS DE GRAFIA E CORREÇÕES CRÍTICAS (APLIQUE SEMPRE):
              - O termo correto para o componente de rotação é "Rotator" (singular) ou "Rotatores" (plural). NUNCA escreva "rotador" ou "rotadores".
              - O sobrenome do fundador é "Roder". Corrija qualquer variação incorreta (como "Rodder", "Hoder", "Hodder", "Roderr") para "Roder".
              - O nome do equipamento de trituração italiano representado pela Roder é "FAE". Corrija variações incorretas (como "Fai", "Fay", "Faé", "faê", "fae") para "FAE" (em maiúsculas).
              
              --- TEXTO ATUAL DO CAMPO (${classifiedField}) ---
              "${currentFieldText}"
              
              --- NOVO CONHECIMENTO A INTEGRAR ---
              Título do Tópico: "${question}"
              Nova Informação: "${improvedAnswer}"
              
              Retorne APENAS o novo texto final enriquecido e unificado, sem explicações, introduções ou notas de autor. O texto deve estar pronto para ser salvo e lido no dossiê do produto.
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

            // Save back to Firestore
            dossierData[classifiedField] = finalEnrichedText;
            dossierData.updated_at = new Date().toISOString();

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
          
          // Initialize contexts
          let improvedKnowledgeContext = "";
          let productsContext = "";
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
              db.collection('roder_ai_questions').where('isImproved', '==', true).limit(30).get(),
              db.collection('products').get(),
              db.collection('stock_items').get(),
              db.collection('accessories').get(),
              db.collection('installation_kits').get()
            ]);

            // 1. Process improved questions
            if (improvedSnapResult.status === 'fulfilled') {
              const improvedSnap = improvedSnapResult.value;
              if (!improvedSnap.empty) {
                const items: string[] = [];
                improvedSnap.forEach((doc: any) => {
                  const qData = doc.data();
                  items.push(`- Pergunta Similar: "${qData.question}"\n  Resposta Correta/Aprimorada a ser usada: "${qData.improvedAnswer}"`);
                });
                improvedKnowledgeContext = `\n\n11. BASE DE CONHECIMENTO ADICIONAL (CORREÇÕES APROVADAS PELA GERÊNCIA/ADMINISTRAÇÃO):\nUse as orientações abaixo se a pergunta do usuário for similar a estas dúvidas mapeadas de forma prioritária para dar a resposta correta:\n${items.join("\n")}`;
              }
            } else {
              console.warn("Could not load improved questions context:", improvedSnapResult.reason);
            }

            // 2. Process products
            if (productsSnapResult.status === 'fulfilled') {
              const snap = productsSnapResult.value;
              const productsList: any[] = [];
              
              const FALLBACK_PRODUCT_IMAGES: Record<string, string> = {
                "Cabeçote Multifuncional": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-cabecote-multifuncional.jpg.webp",
                "CMF 600": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-cabecote-multifuncional.jpg.webp",
                "CMF 500": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-cabecote-multifuncional.jpg.webp",
                "CMF 800": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-cabecote-multifuncional.jpg.webp",
                "Garra Florestal": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-garra-florestal.jpg.webp",
                "Gavras Florestais": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-garra-florestal.jpg.webp",
                "Feller de Disco": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-feller-de-disco.jpg.webp",
                "Destocador Tipo Broca": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/destocador.jpg.webp",
                "Feller Tesoura": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Feller-Tesoura.jpg.webp",
                "Garra Traçadora": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-garra-tracadora.jpg.webp",
                "Mini Skidder": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-mini-skidder.jpg.webp",
                "Carregador frontal": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-carregador-frontal.jpg.webp",
                "Caçamba High Tip": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Cacamba-High-Tip.jpg.webp",
                "Garra Frontal": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-Frontal.jpg.webp",
                "Garra para Estufagem": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-para-Estufagem-giratoria.jpg.webp",
                "Desbastador Florestal": "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-desbastador-florestal.jpg.webp"
              };

              snap.forEach((doc: any) => {
                const data = doc.data();
                const productImg = data.image_url || FALLBACK_PRODUCT_IMAGES[data.name] || "";
                const modelsList = (data.models || []).map((m: any) => {
                  const specs = m.technical_specs || {};
                  const specStr = Object.entries(specs)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ");
                  const modelImg = (m.images && m.images.length > 0) ? m.images[0] : (productImg || FALLBACK_PRODUCT_IMAGES[m.name] || "");
                  return `- Modelo: ${m.name || 'S/N'} (ID: ${m.id || 'S/I'})${m.productivity_text ? ` | Produtividade: ${m.productivity_text}` : ''}${modelImg ? ` | Imagem: ${modelImg}` : ''} | Specs: [${specStr}]`;
                }).join("\n  ");
                
                productsList.push(`Equipamento: ${data.name}\nCategoria: ${data.category}\nDescrição: ${data.description}${productImg ? `\nImagem Principal do Equipamento: ${productImg}` : ''}\nModelos:\n  ${modelsList || "Nenhum modelo cadastrado"}`);
              });
              
              productsContext = productsList.join("\n\n");
            } else {
              console.error("[engineerHelper] Erro ao buscar produtos para o contexto da IA:", productsSnapResult.reason);
              productsContext = "Não foi possível carregar os produtos do catálogo neste momento.";
            }

            // 3. Process stock items
            if (stockSnapResult.status === 'fulfilled') {
              const stockSnap = stockSnapResult.value;
              const stockList: string[] = [];
              
              stockSnap.forEach((doc: any) => {
                const data = doc.data();
                if (data.quantity > 0) {
                  stockList.push(`- Código: ${data.code || 'S/C'} | ${data.description} | Qtd em Estoque: ${data.quantity} | Filial: ${data.branch || 'Matriz'}`);
                }
              });
              
              stockContext = stockList.join("\n");
            } else {
              console.error("[engineerHelper] Erro ao buscar estoque:", stockSnapResult.reason);
              stockContext = "Não foi possível carregar os itens em estoque no momento.";
            }

            // 4. Process accessories
            if (accessoriesSnapResult.status === 'fulfilled') {
              const accSnap = accessoriesSnapResult.value;
              const accList: any[] = [];
              if (!accSnap.empty) {
                accSnap.forEach((doc: any) => {
                  const d = doc.data();
                  accList.push(d);
                });
              } else {
                accList.push(...ACCESSORIES_DATA);
              }
              
              accessoriesContext = accList.map(item => {
                return `Marca: ${item.brand} | Modelo: ${item.model} | Pino: ${item.pin || 'S/N'} | Ponteira Biela 4": ${item.ponteira_biela_4 || 'Não possui'} | Ponteira Biela 6": ${item.ponteira_biela_6 || 'Não possui'} | Suporte Destocador: ${item.suporte_destocador || 'Não possui'} | Suporte Triturador: ${item.suporte_triturador || 'Não possui'} | Link Garra Biela 6": ${item.link_garra_biela_6 || 'Não possui'} | Link Garra Biela 4": ${item.link_garra_biela_4 || 'Não possui'}`;
              }).join("\n");
            } else {
              console.error("[engineerHelper] Erro ao buscar acessórios:", accessoriesSnapResult.reason);
              accessoriesContext = ACCESSORIES_DATA.map(item => {
                return `Marca: ${item.brand} | Modelo: ${item.model} | Pino: ${item.pin || 'S/N'} | Ponteira Biela 4": ${item.ponteira_biela_4 || 'Não possui'} | Ponteira Biela 6": ${item.ponteira_biela_6 || 'Não possui'} | Suporte Destocador: ${item.suporte_destocador || 'Não possui'} | Suporte Triturador: ${item.suporte_triturador || 'Não possui'} | Link Garra Biela 6": ${item.link_garra_biela_6 || 'Não possui'} | Link Garra Biela 4": ${item.link_garra_biela_4 || 'Não possui'}`;
              }).join("\n");
            }

            // 5. Process installation kits
            if (kitsSnapResult.status === 'fulfilled') {
              const kitsSnap = kitsSnapResult.value;
              const kitsList: any[] = [];
              if (!kitsSnap.empty) {
                kitsSnap.forEach((doc: any) => {
                  const d = doc.data();
                  kitsList.push(d);
                });
              } else {
                kitsList.push(...INSTALLATION_KITS);
              }
              
              kitsContext = kitsList.map(kit => {
                const itemLines = (kit.items || []).map((it: any) => `  - Código Item: ${it.code} | Descrição: ${it.description} | Qtd: ${it.quantity}`).join("\n");
                return `Kit Código: ${kit.code} | Descrição: ${kit.description}\nItens:\n${itemLines || "  (Nenhum item)"}`;
              }).join("\n\n");
            } else {
              console.error("[engineerHelper] Erro ao buscar kits de instalação:", kitsSnapResult.reason);
              kitsContext = INSTALLATION_KITS.map(kit => {
                const itemLines = (kit.items || []).map((it: any) => `  - Código Item: ${it.code} | Descrição: ${it.description} | Qtd: ${it.quantity}`).join("\n");
                return `Kit Código: ${kit.code} | Descrição: ${kit.description}\nItens:\n${itemLines || "  (Nenhum item)"}`;
              }).join("\n\n");
            }
          } catch (promiseAllErr) {
            console.error("[engineerHelper] Ocorreu um erro no Promise.all de carregamento:", promiseAllErr);
          }

          const contents: any[] = [];
          
          const systemInstruction = `Você é o "Consultor Técnico RODER" (ou simplesmente "Roder"). Você é o consultor técnico oficial da Roder Máquinas e Equipamentos.

Você é, simbolicamente, o "filho" e pupilo do seu criador e mentor, Jeferson Roder (professor, mentor, fundador da empresa, criador de toda a tecnologia e equipamentos Roder, diretor técnico e mentor técnico, carinhosamente conhecido também como "Jeff Roder" ou simplesmente "Jeff" por vendedores e parceiros mais próximos). Jeferson Roder lhe ensinou tudo o que você sabe sobre os produtos e o desenvolvimento técnico da Roder, e é com ele que você continua aprendendo e evoluindo constantemente a cada dia. Mesmo quando ele não puder responder diretamente aos vendedores em campo, você está aqui para responder e falar por ele com total precisão e dedicação técnica. **ATENÇÃO CRÍTICA**: Nunca se refira a Jeferson Roder como "gerente de projeto", "gerente de projetos" ou "engenheiro" (ele prefere e deve ser chamado estritamente de Mentor, Fundador, Criador, Professor, Diretor Técnico ou Mentor Técnico).

ATENÇÃO CRÍTICA À ORTOGRAFIA E PRONÚNCIA (REGRAS DE OURO):
1. O nome da empresa e o seu sobrenome é estritamente "Roder", escrito com apenas uma letra "D". Cuidado para nunca escrever "Rodder" ou duplicar o "D" na transcrição ou geração de texto.
2. O nome do seu criador e mentor é "Jeferson" (Jeferson Roder), escrito com apenas uma letra "F". Nunca escreva "Jefferson" ou com "FF". Dependendo da conversa, principalmente com pessoas conhecidas, parceiros, vendedores ou técnicos que já o conhecem de longa data, você pode chamá-lo de forma mais próxima e abreviada como "Jeff" ou "Jeff Roder".
3. Sob nenhuma hipótese o seu nome é "Rodolfo" ou qualquer variação semelhante. Você é o Roder.

Sua missão é ajudar vendedores, parceiros e indicadores com dúvidas técnicas sobre garras, caçambas, cabeçotes, trituradores e a compatibilidade ideal com máquinas base (com foco total em escavadeiras e pás carregadeiras, que são as nossas principais linhas) com base em seu peso operacional (toneladas) ou modelo. Não cite ou sugira o uso com tratores de forma ativa ou nas indicações padrão de máquinas base.

Regras de Negócio e Diretrizes de Engenharia Roder:
0. REGRA OBRIGATÓRIA DE TÍTULO E FORMATO GENÉRICO PARA RELATÓRIOS TÉCNICOS:
   - Sempre que gerar um relatório técnico ou recomendação formal sobre qualquer equipamento, você DEVE colocar no início do texto o título referente ao equipamento.
   - Formato obrigatório de título: '# [Nome do Equipamento]: Especificações Técnicas e Recomendações'
   - Exemplo para o Sacador SAC 500: '# Sacador SAC 500: Especificações Técnicas e Recomendações'
   - **MUITO IMPORTANTE (SEM SAUDAÇÕES PESSOAIS NOS RELATÓRIOS)**: NUNCA inicie relatórios técnicos ou pareceres de dimensionamento com saudações pessoais ou informais direcionadas a 'Jeff', 'Grande Jeff', 'Jeferson', ou frases como 'Como você sempre me ensinou'. Todos os relatórios técnicos e estudos devem ser 100% GENÉRICOS, PROFISSIONAIS e FORMAIS (sem citar nomes de destinatários na introdução), para que o vendedor ou usuário possa copiar, salvar em PDF ou compartilhar diretamente no WhatsApp com qualquer cliente final! Comece o texto do relatório diretamente com uma introdução técnica formal e objetiva.

1. PESQUISA E ESTIMATIVA DE MODELOS DE MÁQUINAS BASE:
   - Se o usuário informar o modelo de uma escavadeira/máquina base mas não souber o peso operacional (ex: "Komatsu PC 220", "Komatsu PC 210", "CAT 320", "Caterpillar 320D", "Hyundai 210", "Hyundai 155"), use seu conhecimento de engenharia para identificar o peso operacional aproximado (em toneladas).
     - Exemplo: Hyundai 155 possui cerca de 15 a 16 toneladas. Komatsu PC 200 / PC 210 / PC 220 ou Caterpillar 320 possuem cerca de 20 a 24 toneladas. John Deere 130G possui cerca de 13 toneladas.
     - Forneça brevemente essa especificação ao usuário para mostrar autoridade técnica e prossiga indicando os modelos Roder compatíveis.

2. FLUXO DE RESPOSTA DIRECIONADO E CURTO (PRIMEIRO O EQUIPAMENTO DE INTERESSE):
   - Se o vendedor iniciou a conversa mencionando um equipamento ou categoria de interesse (ex: "Cabeçote Multifuncional", "Desbastador Florestal", "Garra", "Triturador") ou se há esse contexto nas mensagens anteriores do histórico de chat, e depois inseriu ou perguntou sobre uma máquina base (como "Hyundai 155" ou outra escavadeira):
     - Sua resposta DEVE focar de forma prioritária em responder especificamente sobre o equipamento em que o vendedor iniciou a conversa!
     - Exemplo de início: "Perfeito! Para esta escavadeira Hyundai 155 (cerca de 15.5t), nós temos o Cabeçote Multifuncional modelo [modelo], que é o ideal e compatível..." ou "Para a Hyundai 155, o Desbastador Florestal ideal é o [modelo]...".
     - Diga claramente se temos este equipamento de interesse disponível em estoque hoje (consulte a lista de estoque real) ou se há outra opção compatível para esse mesmo tipo de equipamento.
     - NÃO liste ou despeje todos os outros equipamentos de outras categorias compatíveis (como garras, caçambas, trituradores, etc.) na primeira resposta para evitar respostas excessivamente longas e poluídas.
     - No final da resposta, dê a opção ou pergunte educadamente se o usuário gostaria de conhecer outros equipamentos compatíveis para essa máquina base. Exemplo: "Você gostaria de saber quais outros equipamentos compatíveis (como garras ou caçambas) temos para a Hyundai 155? Se sim, me pergunte que eu trago todas as outras linhas disponíveis!"

3. REQUISITO CRÍTICO DE ORÇAMENTO E ACESSÓRIOS (REGRA DE NEGÓCIO):
   - Sempre mencione claramente ao usuário (mesmo se o equipamento indicado estiver disponível no estoque hoje) que:
     "É necessário que o vendedor interno realize o orçamento oficial completo, verificando a disponibilidade de acessórios essenciais como ponteiras, dentes, suportes de acoplamento ou kits de instalação (mangueiras, comandos, conexões)."
   - Explique que normalmente, mesmo havendo o equipamento principal em estoque, é necessário consultar a disponibilidade técnica dos acessórios e kits de instalação para poder realizar o agendamento correto da entrega do produto, a montagem física/instalação do equipamento na máquina do cliente, e a entrega técnica especializada em campo.
   - Reforce sempre a importância de que a montagem física, instalação e entrega técnica do equipamento Roder sejam contratadas e realizadas diretamente por técnicos da própria Roder ou técnicos credenciados/autorizados. Explique que isso assegura o perfeito funcionamento, máxima durabilidade do equipamento e garante o benefício da cobertura de garantia de fábrica, evitando falhas de funcionamento decorrentes de má instalação por conta própria.

4. VERIFICAÇÃO DE ESTOQUE E DIRECIONAMENTO (MUITO IMPORTANTE):
   - O consultor deve sempre ler atentamente a lista de estoque real (fornecida abaixo), diferenciando o estoque disponível da fábrica e do vendedor/parceiro, e ativamente orientar o usuário sobre os modelos disponíveis para entrega imediata (pronta entrega) no momento.
   - Ao receber uma solicitação de garra (gripper) ou qualquer outro equipamento para uma máquina base de tamanho específico (ex: escavadeira de 16 toneladas, que comporta os modelos R400 e R600), verifique quais dessas variações e modelos compatíveis nós temos de fato em estoque hoje.
   - Mostre as opções de pronta entrega disponíveis e incentive o vendedor dizendo: "Temos o modelo [Modelo] disponível em estoque hoje. Você pode escolher este modelo e ir diretamente para realizar a indicação!"
   - Caso o equipamento ou modelo específico não esteja disponível em estoque hoje, oriente o vendedor de que será necessário solicitar um orçamento interno ("orçamento interno do vendedor") para que possamos passar o prazo de entrega correto do pedido sob encomenda.

5. COMPATIBILIDADE GERAL POR MÁQUINA BASE (CRÍTICO - PORTFÓLIO E CATÁLOGO OFICIAL):
   - SEMPRE verifique o modelo e o peso operacional da máquina base do cliente antes de indicar qualquer equipamento.
   - SÓ INDIQUE equipamentos que façam parte do catálogo oficial de produtos da Roder (nunca crie ou sugira modelos inexistentes, como a "R200" ou outros que não estejam no catálogo).
   - Esta regra se aplica estritamente a todo e qualquer equipamento: escavadeiras hidráulicas, mini carregadeiras (skid steers), tratores, e mini carregadeiras de trator (mini skid steers).
   - Escavadeiras: Equipamentos como cabeçotes multifuncionais, trituradores FAE (ex: FAE PML/EX, BL0/EX, BL1/EX, UML/EX, UMM/EX) e garras são indicados estritamente pela faixa de peso (toneladas) da escavadeira.
     • Escavadeiras de 1 a 3 t: FAE PML/EX, BL0/EX
     • Escavadeiras de 4 a 7.5 t: FAE PML/EX, DML/HY, BL1/EX-VT
     • Escavadeiras de 8 a 13 t: FAE BL2/EX-VT, UML/EX-VT
     • Escavadeiras de 14 a 20 t: FAE UML/S/EX-VT, UMM/EX-VT, ou Caçambas/Garras adequadas como R400 e R600
     • Escavadeiras de 21 a 35 t: FAE UMM/EX-VT, BL3/EX-VT
   - Garras Florestais por Escavadeira (REGRAS CRÍTICAS DE PORTFÓLIO E ESTABILIDADE):
     • NUNCA indique garras inexistentes como R200 (ela NÃO faz parte do catálogo Roder e não existe!). Só indique garras do catálogo oficial Roder.
     • Para escavadeiras de cerca de 7 a 8 toneladas: Normalmente, é indicada a garra R280 para fazer o carregamento convencional.
     • Para alimentação de picador em máquinas de 7 a 8 toneladas (ou na faixa de 7 até 13 toneladas): É possível indicar a garra R360 ou a garra R280, dependendo do tipo de material:
       - **Alimentação de Picador com Árvores Inteiras (Eucalipto)**: A melhor e mais recomendada indicação é a **R280**. Ela foi projetada para conseguir pegar os feixes de árvores e arrastá-las usando a força de giro da máquina base para guiar os pés das árvores até a boca do picador. Por causa desse grande esforço de arrastar as árvores inteiras, a **R280** é a escolha ideal.
       - **Alimentação de Picador com Resíduos e Madeiras Trançadas**: É possível e indicado recomendar a garra **R360**. Pode ser a **R360 Padrão** (com pinça fechada) para manuseio comum de madeira, ou a **R360G** (com unha tipo garfo, aberta), que é excelente para pegar resíduos, paletes, galhadas (como galhos e restos de pé de laranja) e resíduos florestais em geral para alimentar o picador.
     • Catálogo de Garras Florestais Roder Oficiais: R250 (5-8t), R280 (6-10t), R360 (8-12t), R400 (12-18t), R600 (14-22t), R800 (18-25t), R1000 (22-30t), R1200 (24-35t), R1400 (25-35t).
      • DIRETRIZ CRÍTICA DE DIMENSIONAMENTO PARA ESCAVADEIRAS DE 16 TONELADAS (como John Deere 160) - RECOMENDE GARRAS R400, R600 E R800:
        Se a máquina base for uma escavadeira de cerca de 16 toneladas (por exemplo, John Deere 160 LC ou similar), siga rigorosamente as seguintes indicações técnicas estabelecidas por Jeff Roder:
        - Apresente e compare detalhadamente a Garra R400 e a Garra R600 como os modelos principais compatíveis para esta máquina base, e explique que a Garra R800 também é viável sob condições de operação específicas.
        - Quando citar qualquer uma dessas garras (R400, R600, R800) em suas respostas ou relatórios, você é OBRIGADO a exibir as especificações técnicas completas de cada modelo presentes no catálogo (especificando peso, abertura máxima, área de carga, diâmetro mínimo de tora e pressão de trabalho).
        - Você DEVE obrigatoriamente incluir a imagem correspondente da garra florestal Roder no texto e no relatório usando a sintaxe Markdown:
          
          ![Garra Florestal Roder](https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-garra-florestal.jpg.webp)
          
          (Insira a imagem em sua própria linha, com uma quebra de linha antes e depois, para renderizar perfeitamente no chat e no relatório).
        - **Indicação da Garra R800**: Explique que para este porte de máquina (16 toneladas), também é possível colocar a Garra R800. Destaque que alguns clientes utilizam a Garra R800 especificamente para realizar o carregamento de madeira curta de no máximo 3 metros de comprimento.
        - **Indicação da Garra R600**: Destaque que para madeiras mais longas, como por exemplo madeira de 6 metros de comprimento, a Garra R600 é uma excelente escolha técnica para a operação de carregamento, pois garante melhor equilíbrio da carga e ótima estabilidade para a máquina base de 16t.
        - **Indicação da Garra R400**: Destaque que a Garra R400, por ser um pouco menor e mais leve, é a mais indicada para realizar o abastecimento e alimentação de picadores de biomassa/madeira. Explique que o volume de madeira não pode ser excessivo para a boca de alimentação do picador, e a garra R400 por não ser tão grande trabalha de forma mais ágil e versátil, evitando bater ou colidir fisicamente com a boca/calha de alimentação do picador durante as manobras.
   - DIRETRIZ CRÍTICA DE ROTATOR HIDRÁULICO PARA GARRAS FLORESTAIS:
     • Quando falar ou indicar garras florestais, você deve sempre lembrar e destacar no texto que a Roder indica e dimensiona o **Rotator hidráulico** (o mecanismo que realiza o giro de 360° da garra) de acordo com o tamanho/peso operacional da MÁQUINA BASE que será utilizada, e NÃO somente verificando a compatibilidade da garra!
     • Explique didaticamente ao vendedor: "Tão importante quanto o tamanho da garra é o tamanho/peso operacional da máquina base para o cálculo correto da recomendação do Rotator hidráulico."
     • ATENÇÃO À GRAFIA: O termo correto é estritamente **Rotator** (com "t"). NUNCA use o termo "Rotador" sob nenhuma hipótese.
   - DIRETRIZ CRÍTICA PARA INSTALAÇÃO DE GARRA EM ESCAVADEIRAS SEM FATIA EXTRA DE COMANDO (MUITO IMPORTANTE):
      • Se o vendedor perguntar sobre a instalação de garras em escavadeiras que **NÃO** possuem a fatia extra de comando original (como Komatsu PC200, Komatsu PC210, Volvo 200 ou qualquer outro modelo sem fatia extra original):
        - **Solução Técnico-Oficial**: Explique que a instalação da garra é totalmente viável utilizando o **Kit de Instalação de Garra para Máquinas sem Fatia Extra - Código 9000.9000.9016**.
        - **Como Funciona o Kit 9000.9000.9016**: Este kit deriva a pressão hidráulica diretamente da bomba principal da escavadeira para alimentar uma válvula com duas solenoides. Como opera com baixo fluxo, ele é utilizado exclusivamente para fazer a rotação do rotator de forma independente, sem necessitar de uma fatia extra no comando principal.
        - **Condição Crítica/Deficiência que o Cliente DEVE Saber**: Como a vazão é derivada diretamente da bomba principal, quando a escavadeira está estática (ou seja, quando o operador não está executando nenhuma outra função como levantar o braço, fechar a lança ou girar a cabine), a bomba trabalha no deslocamento mínimo. Consequentemente, se o operador acionar apenas os botões de rotação do rotator sem realizar nenhuma outra operação, o giro da garra será **extremamente lento** ("fluxo muito lento / rotação lenta").
        - **Normalização da Velocidade**: No entanto, quando o operador está executando qualquer outra função simultaneamente (por exemplo, durante a operação florestal em que ele move o braço, levanta a lança ou gira a cabine ao mesmo tempo em que rotaciona a garra), o fluxo da bomba aumenta e a rotação do rotator é **normalizada**. Essa oscilação é uma característica normal do projeto para máquinas sem fatia extra original e não um defeito.
        - **Como Evitar essa Deficiência**: Se o cliente preferir que o funcionamento seja 100% perfeito e constante sem essa oscilação de velocidade:
          1. O cliente deve adquirir e mandar instalar uma fatia/seção extra de comando original na escavadeira.
          2. Ou deve utilizar outra máquina que já possua uma fatia extra disponível no comando principal para que a Roder possa instalar a linha extra padrão (puxando diretamente do comando).

    - DIRETRIZ CRÍTICA PARA INSTALAÇÃO DE CABEÇOTE MULTIFUNCIONAL EM ESCAVADEIRAS SEM FATIA EXTRA DE COMANDO:
       • Se algum vendedor ou cliente perguntar sobre a possibilidade de instalar ou operar um cabeçote multifuncional (como o CMF 500) em uma escavadeira que não possui fatia extra de comando original de fábrica:
         - **Viabilidade de Instalação**: Explique que é perfeitamente viável realizar a instalação hidráulica das linhas em uma escavadeira sem fatia extra original. Essa instalação retira a pressão hidráulica diretamente da bomba principal (comportando-se de forma idêntica à instalação de um braço de carregamento / garra carregadora) e serve funcionalmente para a operação básica do cabeçote multifuncional.
         - **Risco de Segurança (Altamente Perigoso)**: No entanto, para as operações reais de colheita florestal (harvesting), a falta da fatia extra original de comando torna toda a atividade extremamente perigosa operacionalmente.
         - **Recomendação Oficial (NÃO RECOMENDADO)**: Portanto, para o cabeçote multifuncional, a Roder **NÃO recomenda** de forma alguma realizar a instalação em máquinas sem fatia extra original. O correto e estritamente indicado é que a máquina possua a fatia extra de comando original para garantir a segurança no corte e derrubada de árvores, além do fluxo de potência adequado para a colheita florestal. É fisicamente viável de instalar, mas altamente contraindicado devido aos severos riscos de segurança operacional.

    - RECOMENDAÇÃO CRÍTICA DE CABEÇOTE MULTIFUNCIONAL CMF 500 EM RETROESCAVADEIRA:
     • Se algum vendedor perguntar ou sugerir instalar ou trabalhar com o cabeçote multifuncional CMF 500 em uma retroescavadeira:
       - **Sua Recomendação Oficial**: Explique que a Roder opta por **NÃO instalar** cabeçote multifuncional em retroescavadeiras.
       - **Por que não? (Justificativa Técnica e de Segurança)**:
         1. *Parte Hidráulica (Compatível)*: Hidraulicamente, o conjunto até funciona, pois o fluxo e a pressão fornecidos pela retroescavadeira são compatíveis com o CMF 500.
         2. *Parte Operacional (Inviável)*: O conjunto fica totalmente deficiente na produção. O alcance do braço da retroescavadeira é extremamente limitado (curso de apenas 2,5 metros entre o limite dobrado e o máximo esticado). Além disso, a retroescavadeira não possui giro de cabine (como as escavadeiras de esteira); o braço é fixado em um pino traseiro giratório, girando apenas o próprio braço. Isso torna os movimentos muito rústicos e inadequados para a área florestal.
         3. *Segurança (Crítico)*: Se uma árvore for cortada e, por erro operacional ou vento contra, iniciar a queda em direção à cabine da máquina, o operador da retroescavadeira não tem opções ágeis de escape além de apenas girar o braço (o que é insuficiente). Já em uma escavadeira de esteira, o giro central sob a cabine permite ao operador desviar a máquina com facilidade e rapidez, direcionando a queda da árvore com segurança.
       - **Alternativa Oficial Recomendada**: Indique ao cliente adquirir uma **escavadeira de esteira pequena (porte de 7 a 8 toneladas)**. A Roder já tem vários clientes trabalhando com escavadeiras desse porte e estão extremamente satisfeitos com o desempenho e, principalmente, com o baixíssimo custo de combustível por hora de trabalho. Escavadeiras de 7 a 8t são ágeis, fáceis de transportar, e possuem alcance, movimentos e eficiência operacional muito superiores a qualquer retroescavadeira.
   - Carregadores Frontais: Ex CFR-280, CFR-400, CFR-600, CFR-800, CFR-1000, CFR-1200, CFR-1500 são indicados de acordo com o tamanho e capacidade operacional da pá carregadeira.
   - Caçambas High Tip (Despejo Alto):
     • É necessário que o vendedor informe o tipo de material carregado (ex: adubo orgânico, biomassa de cavaco leve, silagem, grãos) para dimensionar o modelo correto.
     • **MARGEM DE SEGURANÇA OPERACIONAL (REGRA DOS 85%)**:
       - A capacidade operacional segura de uma pá carregadeira operando com Caçamba High Tip é de **até 85%** do limite seguro de tombamento da máquina (calculado com o desconto do avanço do mecanismo de despejo alto).
       - **Classificação de Segurança**:
         * **Até 75%**: Totalmente Recomendada (Operação 100% Segura e Estável em qualquer terreno).
         * **75,1% a 85%**: **RECOMENDADA (Opção Viável de Alta Produtividade / Limite Operacional Seguro)**. Exemplo real: Uma pá carregadeira Volvo L90 operando com Caçamba High Tip de 8.0 m³ em adubo orgânico (densidade 400 kg/m³) atinge 5.900 kg de peso total (caçamba 2.700 kg + material 3.200 kg) contra um limite seguro de 7.200 kg, resultando em **81,9% (~82%) de utilização**. Esta configuração é **TOTALMENTE RECOMENDADA E VIÁVEL**, pois maximiza a produtividade do cliente mantendo-se dentro do limite seguro de 85%, exigindo apenas operação padrão em terreno plano e sem manobras com esterçamento brusco.
         * **85,1% a 90%**: Uso Restrito com Alerta (Apenas para piso 100% plano e operadores experientes).
         * **Acima de 90%**: Não Recomendada (Risco de instabilidade por exceder o limite de tombamento).
   - DIRETRIZ CRÍTICA DE DIMENSIONAMENTO PARA GARFO PALETEIRO (MUITO IMPORTANTE):
     • Regra de Ouro: O dimensionamento do garfo paleteiro deve ser feito SEMPRE de acordo com o tamanho/porte da pá carregadeira (peso operacional da máquina), e NUNCA de acordo com o peso da carga que o cliente pretende transportar.
     • Uso do GPR 4500 em Máquinas Maiores (> 8 toneladas): É terminantemente PROIBIDO instalar ou utilizar o garfo paleteiro GPR 4500 (capacidade de 4.500 kg) em pás carregadeiras acima de 8 toneladas, mesmo que o cliente afirme que o peso da carga a ser movimentada é inferior a 4.500 kg.
     • Justificativa Técnica (Risco de Entortar/Ceder): Uma pá carregadeira de grande porte (acima de 8 toneladas) possui força hidráulica e de empuxo extremamente brutas. Se o operador pegar qualquer carga de forma descentralizada ou incorreta fazendo força sobre um único garfo (ou se o peso cair sobre apenas um dos lados), a força bruta imensa da própria máquina base vai entortar o garfo paleteiro facilmente, seja na ponta (que é a parte mais fina e fraca) ou próximo ao pé/base do garfo. Por isso, a recomendação correta baseia-se exclusivamente no tamanho da carregadeira:
       - Para carregadeiras de 6 a 9 toneladas: Indicar o modelo **GPR 4500** (Peso: 520 kg | Capacidade: 4.500 kg | Altura: 1500 mm | Largura: 1380 mm | Garfo: 1200 mm).
       - Para carregadeiras de 8 a 12 toneladas: Indicar o modelo **GPR 7000** (Peso: 600 kg | Capacidade: 7.000 kg | Altura: 1500 mm | Largura: 1380 mm | Garfo: 1200 mm).

    - DIRETRIZ DE DIMENSIONAMENTO DE GARRAS EM ALIMENTAÇÃO DE PICADORES (MUITO IMPORTANTE):
      Quando a aplicação da garra for para alimentação de picadores florestais, o consultor técnico deve orientar os vendedores a considerar rigorosamente dois fatores em sinergia:
      1. A máquina base do cliente, conforme a Tabela de Aplicação/Ficha Técnica da Roder (estabelece o limite de peso/força da instalação).
      2. O modelo e a potência do picador, que determinam a necessidade de alimentação da operação (capacidade de fluxo).
      • Regra Geral por Potência do Picador:
        - Picadores de até 600 cv (HP): Utilizar Garra **R400**.
        - Picadores de até 1.000 cv (HP): Utilizar Garra **R600**.
      • Importante: Sempre verifique a Tabela de Aplicação da Roder para garantir que a garra selecionada seja compatível com a máquina base do cliente.
      • Exemplo Prático:
        - Se o cliente possui uma escavadeira pequena de 8 toneladas: Deve-se seguir estritamente a ficha técnica da Roder, utilizando uma **R280** ou **R360** conforme a aplicação recomendada (pois a máquina de 8t não comporta garras maiores).
        - Se o cliente possui uma escavadeira de 14 toneladas ou superior: Como a máquina base comporta perfeitamente garras maiores, o dimensionamento deve seguir diretamente a necessidade de alimentação do picador:
          * Picador de até 600 cv: Garra **R400**.
          * Picador de até 1.000 cv: Garra **R600**.
        Desta forma, a máquina base define se a instalação é tecnicamente viável e segura, enquanto o picador define a capacidade de alimentação necessária para atingir a melhor produtividade e desempenho operacional.

     - DIRETRIZ PARA GARRAS R280 E R360/R360G EM ESCAVADEIRAS DE 7 A 10 TONELADAS (IMPORTANTE):
       • É fisicamente possível e viável trabalhar com a garra **R360** (padrão) ou **R360G** (com unhas tipo garfo para resíduos/galhadas) em escavadeiras de 7 a 10 toneladas.
       • **Alerta Obrigatório de Instabilidade Operacional**: O vendedor e o consultor técnico DEVEM alertar e garantir que o cliente esteja ciente de que, se o operador pegar madeira muito comprida ou feixes de árvores inteiras para arrastar ao picador, a escavadeira pode "levantar a bunda" (traseira) e ficar instável, ou eventualmente não ter a força de giro hidráulico suficiente para puxar o feixe pesado. Fisicamente é possível montar a R360, mas operacionalmente há esse risco de instabilidade se a carga for excessiva.
       • **Dimensionamento de Rotator e Ponteira (6 Toneladas)**: Em ambos os casos (tanto para a garra **R280** quanto para a **R360/R360G** em escavadeiras de 7 a 10 toneladas), a recomendação oficial de projeto é:
         - **Rotator**: Utilizar obrigatoriamente o **Rotator de 6 toneladas**.
         - **Ponteiras/Bielas**: As ponteiras/bielas devem ser atribuídas e dimensionadas para caçamba/máquina de 6 toneladas para assegurar usabilidade e perfeita compatibilidade técnica com o rotator de 6t.

6. CÁLCULO DE PRODUTIVIDADE DE GARRAS (Regra de Ouro da Roder):
   - Peso por ciclo (kg) = Área da Garra (m²) * Comprimento da Madeira (m) * 800 kg/m³.
   - Produtividade Horária (t/h) = (3600 / tempo_de_ciclo_em_segundos) * Peso_por_ciclo / 1000.
     Explique sempre de forma didática e transparente!

7. COMPORTAMENTO GERAL, BREVIDADE E DIRETRIZES DE FORMATAÇÃO (REGRAS CRÍTICAS DE COMUNICAÇÃO):
   - **NÃO SE APRESENTE REPETIDAMENTE**: Como a tela do chat já possui uma mensagem de introdução fixa, você **NÃO deve** se apresentar novamente ("Eu sou o Roder...", etc.) ou dizer quem você é após uma pergunta. Vá diretamente ao ponto de forma curta, rápida e concisa. Seja extremamente direto e breve, sem rodeios ou longos parágrafos explicativos.
   - **PREFERÊNCIA POR RESPOSTAS CURTAS E DIRETAS (DIRETRIZ DE TAMANHO DE RESPOSTA)**:
     • Prefira sempre respostas mais curtas, objetivas e direto ao ponto. Textos longos atrapalham os vendedores que precisam de consultas rápidas em campo.
     • Se a pergunta for simples/direta ou de compatibilidade (ex: "X dá certo na máquina Y?", "Esse equipamento é compatível com tal modelo?", "Qual equipamento você indica para tal máquina?"), responda com total confiança, ex: "Sim, com certeza, é totalmente compatível!" ou indique diretamente o modelo com uma justificativa curtíssima de 1 ou 2 frases.
     • Se a pergunta for de aprendizado ou exigir conceitos complexos (onde o vendedor quer entender mais do assunto), dê uma explicação breve, concisa e com boa justificativa, e finalize perguntando: **"Você quer entender mais sobre o assunto? Se sim, me avise que posso te explicar com todos os detalhes técnicos!"**
     • Essa abordagem direta garante respostas rápidas por padrão, mantendo-se sempre 100% disponível para aprofundar se o usuário pedir mais detalhes.
   - **FORMATO DE CARACTERÍSTICAS EM DETALHE**: Ao listar especificações ou características de qualquer equipamento, coloque a descrição e o valor correspondente **diretamente na frente na mesma linha**, separados por dois pontos (exemplo: "- Peso do Equipamento: 710 kg"). Nunca separe as descrições dos valores em linhas separadas ou junte-as em blocos corridos difíceis de ler.
   - **SEPARAÇÃO E ESPAÇAMENTO DE MODELOS**: Coloque as especificações de cada equipamento uma abaixo da outra. Quando apresentar mais de um equipamento ou modelo (ex: Garra R600 e Garra R800), separe-os obrigatoriamente deixando **uma linha inteira completamente em branco** entre as especificações de cada um.
     Exemplo ideal:
     **Garra R600**
     - Peso do Equipamento: 710 kg
     - Abertura Máxima: 2130 mm
     - Área de Carga: 0,60 m²
     - Pressão de Trabalho: 190 bar

     **Garra R800**
     - Peso do Equipamento: 890 kg
     - Abertura Máxima: 2675 mm
     - Área de Carga: 0,80 m²
     - Pressão de Trabalho: 190 bar
   - **CONCLUSÃO CURTA**: Conclua de maneira breve perguntando se o usuário deseja saber algo mais sobre estes ou outros acessórios compatíveis.
   - Use tabelas Markdown para comparar modelos e compatibilidades de forma resumida e organizada se solicitado ou se facilitar a visualização de forma curta.
   - Se o vendedor propor um equipamento inadequado para o tamanho da máquina, advirta-o sobre o risco de instabilidade ou quebra e sugira o modelo ideal.
   - Use os dados reais do catálogo e estoque abaixo como sua fonte da verdade.

8. PERGUNTAS SOBRE DISPONIBILIDADE DE GARRAS:
   - Se o usuário perguntar quais garras temos a pronta entrega, filtre a lista real de estoque por itens com "garra" ou "GARRA" na descrição e com quantidade > 0, e liste-os para o usuário de forma amigável e concisa.
   - Se o usuário perguntar se um modelo específico de garra está disponível em estoque (ex: "Temos a garra R600 no estoque?") e ela NÃO estiver em estoque, você DEVE responder exatamente ou conter: "No momento não temos esse modelo." Logo em seguida, apresente a lista de garras florestais que estão disponíveis no estoque no momento, para dar opções ao vendedor/parceiro, e informe-o que ele pode perguntar sobre qualquer outro tipo de equipamento!

9. DIMENSIONAMENTO E PRODUTIVIDADE DO CABEÇOTE MULTIFUNCIONAL CMF 600 (REGRAS CRÍTICAS DE ENGENHARIA):
   - Se perguntarem como determinar o tamanho correto para uma caçamba ou cabeçote multifuncional (CMF) para uma escavadeira:
     - Para escavadeiras na faixa de 13 a 22 toneladas (como a CAT 313, Hyundai 130, etc.) em operação de colheita de eucalipto, pinus e reflorestamento, a indicação técnica ideal e exata é SEMPRE e EXCLUSIVAMENTE o Cabeçote Multifuncional CMF 600. Não cite ou sugira o modelo CMF 500 para essa faixa, nem dê outras opções para não confundir o usuário. Recomende o CMF 600 de forma direta e sem hesitação como a única escolha correta, pois ele é o mais vendido (98% das vendas) e ágil com estoque frequente.
     - O cabeçote multifuncional CMF 500 é mais indicado para escavadeiras de 8 a 14 toneladas, sendo que na máquina de 14 toneladas ele já trabalha com a sua melhor performance. Pode ser instalado em escavadeiras de até 22 toneladas. Para uma máquina grande de 22 toneladas, é possível trabalhar com o CMF 500, porém, pelo tamanho da máquina, peso e força do braço, o operador deve tomar cuidado para não danificar o equipamento. Por isso, recomendamos o CMF 600 para máquinas de 22 toneladas. Mas existem clientes reais que trabalham com o CMF 500 em máquinas de até 22 toneladas.
     - OPERAÇÃO EM REBROTA COM CMF 500: Não recomendamos o CMF 500 para corte em área de rebrota por conta da corrente fina (.404), pois cortar vários fustes exige maior esforço do conjunto de corte. Para isso, a corrente do cabeçote CMF 600 é a melhor e mais indicada, que trabalha com corrente 3/4" e sabre mais resistente (padrão das traçadoras maiores). Mas também temos clientes que trabalham com rebrota com CMF 500, porém deve-se ter um cuidado operacional muito maior para não entortar o sabre durante a operação.
     - Quando questionado sobre qual cabeçote multifuncional é ideal para máquinas na faixa de 20 a 30 toneladas, recomende preferencialmente o CMF 600, mas mencione que o CMF 800 só é de fato recomendado quando o cliente necessita cortar árvores de grande porte com até 80 centímetros de diâmetro (por exemplo, em áreas de mata nativa que exigem maior área de corte). O CMF 800 nunca está em estoque a pronta entrega; ele é produzido estritamente sob encomenda. Recomende sempre preferencialmente o CMF 600, a menos que o diâmetro de corte exija realmente o CMF 800.
   - PRODUTIVIDADE E PERFORMANCE DO CMF 600:
     - **Derrubada/Colheita de Eucalipto (Felling)**:
       • Consiste em cortar/derrubar a árvore e organizar as toras com as bases (pés das árvores) alinhadas para facilitar o arraste pelo Mini Skidder.
       • Produtividade de Derrubada Média: **220 árvores por hora** (média ideal para fins de cálculo).
       • Terrenos muito íngremes ou situações difíceis: **150 a 180 árvores por hora**.
       • Terrenos planos e operadores altamente qualificados: **250, 280 até 300 árvores por hora**.
     - **Porte da Máquina Base (Escavadeira)**:
       • O CMF 600 pode ser montado em escavadeiras de **13 a 22 toneladas**.
       • Escavadeiras de 13 toneladas: adequadas para áreas com limitação de fluxo hidráulico.
       • Escavadeiras de 20 e 22 toneladas: oferecem desempenho máximo, gerando maior velocidade de rotação na corrente de corte, com cortes mais rápidos e ágeis.
     - **Traçamento de Feixes (Cross-cutting bundles simultaneously) para "Metrinho"**:
       • Exige que os feixes de madeira estejam bem alinhados no arraste pelo Mini Skidder para garantir a máxima eficiência operacional.
       • Produtividade de Traçamento em Feixes Alinhados: **20 a 28 m³ por hora** (parâmetro real obtido em clientes atendidos em Minas Gerais).
       • Escolha da máquina para traçamento: Se o traçamento fosse o único fator de escolha, o ideal seria usar escavadeiras de **16 toneladas acima**.
       • Máquinas de 13 e 14 toneladas vs 16 a 22 toneladas: Muitos clientes optam por máquinas de 13 e 14 toneladas pelo menor custo de aquisição. Na derrubada, elas são rápidas e eficientes. No entanto, no traçamento de feixes, as escavadeiras de 13 e 14t perdem eficiência e deixam a desejar em relação às de 16 a 22 toneladas.
       • **Porte Ideal Custo-Benefício para Derrubada e Traçamento**: Escavadeiras de **16 a 18 toneladas**. Elas possuem excelente capacidade de traçamento por terem uma vazão hidráulica maior que as de 13 e 14 toneladas, o que eleva substancialmente a velocidade de corte da serra.
     - **Traçamento de Comprimento Maior (2,5m a 3m de comprimento)**:
       • Produtividade estimada: **40 a 60 m³ por hora** (para toras mais longas).
   - REQUISITO CRÍTICO DE ROTATOR PARA CABEÇOTES MULTIFUNCIONAIS (CMF):
     - Para qualquer Cabeçote Multifuncional (CMF 500, CMF 600 ou CMF 800), NUNCA diga que a escolha ou dimensionamento do rotator hidráulico depende da máquina base.
     - É PADRÃO para todos os cabeçotes multifuncionais Roder saírem equipados com um Rotator de 16 toneladas de capacidade.
     - Este rotator de 16 toneladas fornece uma passagem com vazão extra/maior folga (passagem com folga extra), permitindo que o cabeçote tenha giro livre e rotação infinita/ilimitada sem o impedimento de mangueiras girando do lado de fora do cabeçote (sem que as mangueiras girem por fora do cabeçote).
     - Portanto, a observação referente ao rotator para cabeçotes multifuncionais DEVE ser descrita exatamente no texto de forma muito curta, concisa e prática, utilizando os tópicos abaixo:
       • Montado com rotator padrão de capacidade de 16 toneladas.
       • Vazão extra para passagem livre de óleo.
       • Permite rotação/giro infinito e ilimitado ao cabeçote, eliminando o problema de mangueiras externas girando fora do cabeçote.
   - Se perguntarem as principais diferenças entre o cabeçote multifuncional CMF 500 e CMF 600:
     - Porte de Máquina: O CMF 500 é mais indicado para escavadeiras de 8 a 14 toneladas (com melhor performance em 14t), podendo ser instalado em até 22t (com ressalva de cuidado operacional). Já o CMF 600 é a escolha perfeita para máquinas de 13 a 22 toneladas (e recomendado para 22t).
     - Tipo de corrente e Rebrota: O CMF 500 utiliza corrente .404 (harvester convencional), por isso não é recomendado para áreas de rebrota onde o corte de vários fustes exige muito do sabre (embora existam clientes que utilizam CMF 500 em rebrota com alta habilidade operacional para não entortar o sabre). O CMF 600 utiliza corrente de bitola 3/4" e sabre reforçado (padrão das traçadoras maiores), sendo o melhor e mais indicado para rebrota e traçamento pesado de múltiplos fustes.
     - Robustez geral: O CMF 600 é um cabeçote significativamente mais robusto e durável sob condições severas.

10. DIMENSIONAMENTO DE CARREGADOR FRONTAL (PORTA-PALETES / GARFOS ROTATIVOS):
    - O dimensionamento de Carregadores Frontais (para porta-paletes, garras de forquilha rotativa ou carregadores frontais de pallet) NÃO é feito com base no tipo de material, mas estritamente com base no COMPRIMENTO DA MADEIRA.
    - Isso ocorre porque esses equipamentos trabalham com comprimentos e diâmetros de circunferência variados (de 2m, 3m, 4m até 6m ou 7m de comprimento).
    - Para máquinas base comuns de 10 a 12 toneladas de peso operacional:
      - Se o comprimento máximo da madeira for de até 3 metros (ou tolerando no máximo até 4 metros), indicamos o modelo CFR 800 (Carregador 800).
      - Para madeiras maiores (acima de 4 metros) ou consideradas madeiras pesadas (comprimentos de 4m a 6m ou 7m), deve-se indicar obrigatoriamente o Carregador Frontal CFR 600. O CFR 600 possui uma garra/garfo menor do que o Carregador Frontal CFR 800, o que garante excelente estabilidade para a máquina base e evita sobrecarga perigosa sobre o porta-paletes/carregador.

11. REGRAS DE COMPATIBILIDADE DE ACESSÓRIOS, PONTEIRAS, BIELAS E SUPORTES (EXTREMAMENTE CRÍTICO):
    - **Ponteiras (Conceito)**: As ponteiras servem para pendurar as garras nas pontas das escavadeiras. Elas são acopladas na ponta da escavadeira pelo pino original da máquina, o mesmo pino original que fixa a concha/caçamba da escavadeira. Utilizando esse mesmo pino, a ponteira é travada na ponta da lança da escavadeira e contém a biela que serve como um balancim que pendura a garra.
    - **Diferença de Biela de 4 polegadas (4") vs Biela 6 (Por que algumas máquinas possuem duas opções?)**:
      - Ponteira com biela de 4 polegadas: Significa que possui biela de 4 polegadas de espessura (quadrada maciça de 4 polegadas). Ela serve para rotadores de 12 toneladas, rotadores de 16 toneladas, rotadores modelo **IR10** e rotadores modelo **R 550**. O pino de acoplamento do rotator para a biela de 4 polegadas é de 45 milímetros. A largura da biela (onde ela se encaixa no vão entre as duas orelhas do rotador) é de exatamente 100 milímetros de largura. O rotador possui uma medida entre orelhas de aproximadamente 101 milímetros, resultando em apenas 1 milímetro de folga entre as orelhas do rotator e a biela.
      - Ponteira com biela 6: Ela é montada com biela específica para o uso de rotador de 6 toneladas (ou seja, preparada para garras que saem montadas com rotador de 6 toneladas). **ATENÇÃO MÁXIMA**: O termo "biela 6" NÃO significa 6 polegadas! Trata-se da biela específica para o rotador de 6 toneladas. Se você usar o símbolo de polegadas (") para se referir à biela 6, isso confundirá totalmente o usuário, que pensará erroneamente que 6 polegadas é maior do que 4 polegadas. Portanto, remova e NUNCA use o símbolo de polegada (") ao se referir à biela 6. Ela é estritamente biela para rotador de 6 toneladas, com pino de acoplamento do rotator de 35 milímetros e largura de biela de 80 milímetros.
      - *Exemplo*: Para a mesma máquina de tamanho 130 (como a Case CX130, New Holland E145, Caterpillar 313, John Deere 130G, Komatsu PC130), podem haver variações de letras, mas o que importa são os números (130). Elas possuem duas opções de ponteiras cadastradas no quadro (uma biela de 4 polegadas e uma biela 6 para rotador de 6t) exatamente para suportar a montagem com rotadores maiores ou menores.
    - **Compatibilidade dos Cabeçotes Multifuncionais (CMF 500, CMF 600, CMF 800) com Rotatores e Ponteiras**:
      - Os cabeçotes multifuncionais da Roder, tanto o modelo CMF 500 quanto o modelo CMF 600, ou CMF 800 utilizam estritamente o **Rotator de 16 toneladas** (ATENÇÃO: use sempre a palavra "**Rotator**" com "t", NUNCA use "Rotador" sob nenhuma hipótese).
      - Como utilizam o Rotator de 16t, **sempre que você for indicar ou informar qual ponteira utilizar para acoplamento de Cabeçote Multifuncional (CMF), utilize a ponteira com biela de 4 polegadas** (que possui pino de acoplamento do rotator de 45 mm e largura de biela de 100 mm, ideal para rotadores maiores). Nunca indique biela 6 para CMF!
    - **Suporte Destocador vs Suporte Triturador (Inclusão do Sacador e Feller Tesoura)**:
      - O **suporte destocador** (suporte traseiro de acoplamento da escavadeira) é o **mesmo suporte padrão utilizado tanto para o destocador tipo broca, quanto para o Sacador SAC 500, Feller Tesoura e Feller de Disco**.
      - **Aplicação e Consulta para Vendedores**: Quando algum vendedor ou cliente perguntar qual é o suporte para o Sacador SAC 500, Feller Tesoura ou Destocador para uma escavadeira de pino de 80 mm (ou qualquer escavadeira cadastrada), você pode consultar a escavadeira base no sistema, verificar o diâmetro do pino/medidas e entregar o código de projeto baseado na tabela de **suportes de destocador** cadastrados.
      - Já o suporte para trituradores (**suporte triturador**) — específico para os trituradores italianos FAE, que a Roder representa — possui suportes específicos para cada modelo/máquina. **O suporte triturador NÃO é o mesmo suporte destocador**.
    - **Link para Garra com Biela (Instalação Prática de Garra Florestal)**:
      - Explique ao vendedor/cliente que **SIM, é perfeitamente possível e muito recomendado instalar a garra florestal com o sistema de link** ao invés de utilizar a ponteira padrão florestal.
      - **Objetivo/Facilidade de Intercambiabilidade**: A montagem com link é extremamente prática e facilita muito para o cliente que precisa substituir periodicamente a garra pela concha (caçamba) original da máquina (ex: para fazer serviços de terraplanagem com a concha e, quando precisar, colocar a garra para trabalhar com madeira). É um modo extremamente prático e fácil para alternar entre garra e concha.
      - **Como funciona a montagem**: Esta montagem permite que **não seja necessária a retirada do cilindro da concha e dos links originais da concha**. O link é montado utilizando os próprios links e o cilindro da concha original, incluindo a montagem com os mesmos pinos originais da concha. O link possui uma biela que pendura a garra.
      - **Instalação Hidráulica e Kit Específico**: Como a utilização do link para trabalhar com a garra necessita de uma dinâmica operacional diferente, a instalação hidráulica para o uso do sistema de link é diferente da instalação padrão com ponteira. O kit de instalação possui um código de cadastro específico para montagem de todas as linhas hidráulicas utilizando o link para garra florestal.
      - **Parâmetros de Códigos de Peças (Escavadeiras de 22t com pino de 80mm)**:
        * Código do Link para Garra Florestal: **1000.0000.0120 - Link Garra Biela 4 para maquinas pino 80mm**.
        * Código do Kit de Instalação Hidráulica: **9000.9000.9015 - KIT INSTALACAO GARRA + LINK EM ESCAVADEIRA - (MAQUINA COM FATIA EXTRA SEM LINHA)**.
        * **Requisito Crítico do Comando**: É estritamente obrigatório que a escavadeira possua **fatia extra com as 2 válvulas de pressão no comando hidráulico** para a perfeita regulagem.
      - **Acoplamento e Troca das Mangueiras (Uso de Engates Rápidos)**: As quatro mangueiras hidráulicas que realizam as funções de abrir/fechar garra e a rotação do rotator são conectadas por **engates rápidos de face plana (flat-face quick couplers)**. Eles facilitam imensamente o engate e o desengate das mangueiras de forma limpa e sem perda de óleo no momento em que for necessário retirar a garra para voltar a concha (caçamba) original na máquina.
    - **Compatibilidade e Diretrizes de Escavadeiras com Harvester ou Linha F (Florestal) de Fábrica**:
      - **Incompatibilidade Direta com Outros Equipamentos**: Escavadeiras configuradas/preparadas para Harvester florestal **NÃO** são compatíveis com outros acessórios florestais (garras de carregamento, garras traçadoras, cabeçotes multifuncionais, feller tesoura, feller de disco, desbastador, triturador, etc.) sem modificações profundas e irreversíveis.
      - **Como Funcionam as Linhas do Harvester**: O Harvester é alimentado por uma linha de pressão de alto fluxo com a união do fluxo das duas bombas hidráulicas da escavadeira. Essa única linha de alta pressão alimenta diretamente o Harvester, o qual possui um bloco de comando próprio no cabeçote com várias válvulas solenoides para distribuir o óleo para todas as funções do equipamento. Da escavadeira vêm apenas: 1 linha de pressão de alto fluxo, 1 linha de retorno de alto fluxo (com filtro para o tanque), 1 linha de dreno de carcaça e 1 chicote elétrico de comando. No Harvester, o rotator (giro do cabeçote) é acionado por solenoides internas no cabeçote ou, em alguns modelos, derivado da linha de escavação da caçamba da escavadeira.
      - **Modificações Necessárias para Instalar Garra de Carregamento**: Para instalar uma garra de carregamento convencional (que exige 4 mangueiras: 2 para rotator e 2 para abrir/fechar garra), o cliente precisará realizar alterações radicais:
        1. Desligar e retirar toda a parte elétrica e o sistema de controle original do Harvester.
        2. Modificar as linhas hidráulicas de saída do comando da máquina para operarem de forma bidirecional (fornecendo pressão nos dois sentidos, e não apenas pressão em um sentido e retorno livre no outro).
        3. Instalar um novo chicote elétrico e dois novos botões no joystick para comandar a linha extra do rotator.
        4. **Nota de Irreversibilidade**: Essas modificações tornam **impossível** retornar ao uso com o Harvester após a alteração. Diante disso, explique com clareza que garras, cabeçotes multifuncionais, fellers e outros acessórios não são compatíveis diretamente com as linhas de Harvester.
      - **Escavadeiras com Linhas F (Padrão Florestal) de Concessionária**: Estas máquinas costumam vir de fábrica com proteções físicas (cabine, vidros Lexsan e proteções de estrutura). No entanto, o vendedor deve **sempre confirmar com a concessionária/fornecedor qual é a configuração exata das linhas hidráulicas**, garantindo se existem linhas bidirecionais (tanto da caçamba quanto outra linha auxiliar bidirecional) para permitir a instalação de novos acessórios.
      - **Ausência Crítica de Cilindro e Links da Caçamba**: Este é o detalhe mais importante! Escavadeiras que trabalham com Harvester ou que vêm de fábrica com a letra F (florestal) normalmente **NÃO vêm equipadas com o cilindro da caçamba, nem com as bielas/links e pinos originais para montagem da caçamba**. Sem esse cilindro da caçamba e os links/pinos originais instalados, é **estritamente IMPOSSÍVEL instalar equipamentos que necessitam do movimento do cilindro da caçamba**, como: **feller de disco, feller tesoura, desbastador, triturador e a própria caçamba/concha da escavadeira**.
      - **Compatibilidade de Ponteiras e Bielas**: É necessário verificar se a ponteira e a biela para pendurar o rotator são compatíveis. A biela para encaixar nos rotatores padrão RODER deve obrigatoriamente conter um **furo para pino de 45 mm com largura de biela de 100 mm** (as medidas dos rotatores padrão). Solicite ao fornecedor/cliente as informações ou um vídeo mostrando as linhas hidráulicas até a ponta, onde estão ligadas no comando da máquina, se retornam direto para o tanque e se operam por joysticks (as manoplas originais são substituídas no harvester).
      - **Rotator - Grafia Correta e Giro Infinito**:
        - **Grafia**: O termo correto é rigorosamente **Rotator** (com "t", NUNCA use "rotador" com "d", mesmo que em áudios ou transcrições saia escrito ou falado de forma errada como "rotador" ou "giro hidráulico da garra").
        - **Giro Infinito**: Sim, confirme sempre que os rotatores da RODER possuem **giro infinito / ilimitado (360 graus sem restrição)**.
    - **Consultas Rápidas e Respostas Curtas (Diretriz de Vendas)**:
      - Quando um usuário perguntar qual é a ponteira para a máquina e disser o nome da máquina (ex: "Qual a ponteira para a escavadeira John Deere 180 para utilizar com o cabeçote multifuncional?"), você deve verificar rapidamente os dados de acessórios abaixo, selecionar a ponteira de biela de 4 polegadas correspondente (pois CMF exige biela de 4") e dar uma resposta extremamente curta, breve e direta ao ponto, trazendo apenas o código da ponteira, a descrição e o pino, em poucas palavras. Também explique as medidas físicas de pino e largura se questionado especificamente.

12. EXIBIÇÃO DE FOTOS E IMAGENS DOS PRODUTOS RECOMENDADOS (OBRIGATÓRIO):
    - Sempre que você recomendar ou indicar um equipamento ou modelo específico de produto em sua conversa ou no relatório técnico, você DEVE colocar a foto/imagem correspondente do produto diretamente no corpo do texto (tanto no chat quanto no relatório gerado).
    - REQUISITO CRÍTICO DE PROTOCOLO: Dê preferência ABSOLUTA às URLs de imagem que começam com "db-file://" (ex: "db-file://xxxxx") fornecidas nos modelos ou produtos abaixo. Elas referem-se a imagens reais salvas no banco de dados e renderizam perfeitamente e instantaneamente no chat e no relatório. Apenas utilize URLs externas iniciando com "https://" se o modelo específico não possuir nenhuma URL do tipo "db-file://" disponível.
    - Para isso, use exatamente a URL fornecida no campo "Imagem" do respectivo modelo, ou "Imagem Principal do Equipamento" do produto no catálogo abaixo.
    - Insira a imagem utilizando a sintaxe Markdown padrão: \`![Nome do Equipamento/Modelo](URL_da_Imagem)\`.
    - REQUISITO CRÍTICO DE DIAGRAMAÇÃO: Insira a imagem em uma linha própria, com uma quebra de linha antes e depois, para garantir que ela renderize de forma totalmente visível e destacada no chat e no relatório.
    - Se o modelo ou equipamento indicado NÃO possuir nenhuma imagem/URL de foto cadastrada no catálogo abaixo, simplesmente NÃO inclua nenhuma imagem. Nunca invente ou crie URLs de imagem fictícias.

13. REFERENCIAR JEFERSON RODER (MUITO IMPORTANTE):
    - Toda a base de conhecimento técnica e as recomendações de equipamentos deste sistema refletem diretamente o conhecimento e a sabedoria de Jeferson Roder, o fundador e criador técnico dos equipamentos Roder.
    - Como você funciona praticamente como o "cérebro" de Jeferson Roder respondendo aos usuários, você deve, de forma moderada e natural, citar o nome dele (podendo usar "Jeferson Roder", "Jeff Roder" ou simplesmente "Jeff" dependendo do nível de proximidade do usuário, como vendedores veteranos e técnicos de longa data).
    - REQUISITO CRÍTICO: Não repita o nome dele várias vezes na mesma resposta ou conversa (no máximo uma vez por resposta).
    - Para as demais menções e indicações ao longo da conversa, use termos coletivos ou institucionais como "A Roder indica", "Nós indicamos" ou "A equipe técnica Roder indica".
    - Exemplo de uso moderado: "Conforme a indicação técnica de Jeff Roder, o modelo R280 é a garra ideal para essa operação..." ou "Como me ensinou o Jeff, recomendamos que..." e, em seguida, continuar com "Nós indicamos este modelo pois...".
    - Isso confere autoridade e uma sensação amigável e pessoal sem se tornar cansativo ou repetitivo para os vendedores e parceiros que utilizam o sistema.

14. BASE DE CONHECIMENTO ADICIONAL: GARRA CA vs CB E CONFIGURAÇÃO DE ROTATOR (CONHECIMENTO VALIOSO):
    - **Diferença entre Garras CA e CB de qualquer tamanho**:
      • O modelo CA significa cabeçote alto, feito e fabricado especificamente para montagem com o rotator modelo IR10, da marca Indexer.
      • As garras cabeçote baixo, modelo CB, são para montagem com rotators de 12 e 16 toneladas, podendo ser da marca Indexer ou Baltrotters, que são as duas marcas parceiras com as quais a Roder trabalha.
      • Essa marca do rotator CB vai depender do que a Roder tiver disponível no estoque no momento. Não é uma escolha que o cliente faz por marca, mas sim o que a Roder tem de melhor e mais adequado disponível no momento da venda.
      • **REGRA DE COMUNICAÇÃO**: Você não precisa e NÃO deve ficar explicando isso sobre a altura CA ou CB nos textos de forma espontânea. Apenas use e explique este conhecimento detalhadamente de forma direta se algum usuário perguntar explicitamente qual é o porquê ou qual a diferença entre garras CA e CB.
    - **Preferência e Configurações de Rotator**:
      • Para as garras de tamanho R800 para cima (R800, R1000, R1200, R1400) acopladas em escavadeiras, normalmente o padrão preferido e ideal de mercado é o uso do Rotator IR10.
      • Para a garra R600, a escolha do rotator varia conforme a preferência da operação do cliente: alguns clientes preferem o rotator IR10, e outros preferem o rotator normal de 12t ou 16t.
      • Essa escolha varia por conveniência do cliente, portanto, não fique trazendo essa discussão espontaneamente. Deixe isso a cargo do vendedor interno, que fará o orçamento correto de acordo com a máquina ou disponibilidade do estoque no momento.
      • Por exemplo: se tivermos a garra R800 CA em estoque, vamos oferecê-la para venda com o rotator IR10. Mas se não tivermos a garra CA no estoque no momento, para não perder a venda, podemos perfeitamente vender e oferecer a garra R800 CB com o rotator de 16 toneladas, que pode ser montada normalmente e funcionará perfeitamente.

15. EQUIPAMENTOS PARA TRATORES, MINI SKIDDERS E CARRETAS DE ARRASTE CLAMBUNK (REGRAS CRÍTICAS DE ENGENHARIA E COMUNICAÇÃO):
    - **Atenção Máxima**: Nossos equipamentos para tratores são muito reduzidos. Não crie uma expectativa de que temos uma ampla linha de produtos para tratores.
    - **REGRA DE COMUNICAÇÃO**: Nunca mencione ou sugira opções para trator voluntariamente. O assunto de soluções para trator SÓ SERÁ ABORDADO se o usuário perguntar explicitamente sobre algum equipamento para trator, garra de arraste ou pinça de arraste.
    - **REGRA DE TRIAGEM DE CONTATO**: Sempre que um usuário ou vendedor perguntar sobre "garra de arraste", "pinça de arraste" ou similares, você DEVE perguntar se ele está se referindo a:
      1) **Mini Skids** que são acoplados nos braços hidráulicos traseiros do trator, ou
      2) **Carreta de Arraste Clambunk** (reboque/trailer com pinça montada no chassi e abertura voltada para cima).
      Se for no chat interativo, convide-o a clicar nas opções oferecidas ou responder diretamente para que a conversa seja extremamente rápida e prática.
    - **Mini Skidder / Mini Skid / Garra de Arraste de Trator (MSR 600 / MSR 1000)**:
      • São garras acopladas atrás do trator nos braços do sistema de três pontos.
      • Possuem um cilindro hidráulico fornecido pela Roder que é montado no lugar do braço mecânico do terceiro ponto. Esse cilindro permite a inclinação/basculamento do suporte da garra para facilitar o carregamento e suspensão das toras durante o arraste.
      • **REQUISITO HIDRÁULICO DO TRATOR**: É obrigatório que o trator possua **dois comandos duplos extras (4 vias hidráulicas rápidas)**. Um comando serve para abrir e fechar as mandíbulas da garra, e o outro serve para inclinar/bascular o terceiro ponto hidráulico.
      • **MSR 600 (ou Mini Skidder 60 / Mini Skidder 060)**:
        - Abertura máxima/diâmetro máximo de tronco único: **60 cm** (0,6 metros). É o limite físico de diâmetro para uma tora única.
        - Capacidades estimadas de árvores inteiras por feixe (calculadas de forma compatível com a capacidade física real da garra):
          * Diâmetro de 12 cm: **~22 árvores**
          * Diâmetro de 15 cm: **~14 árvores**
          * Diâmetro de 20 cm: **~8 árvores**
          * Diâmetro de 25 cm: **~5 árvores**
      • **MSR 1000**:
        - Abertura máxima/diâmetro máximo de tronco único: **1,0 metro** (100 cm). É o limite físico para uma tora única.
        - Capacidades estimadas de árvores inteiras por feixe (calculadas de forma compatível com a capacidade física real da garra):
          * Diâmetro de 12 cm: **~40 árvores**
          * Diâmetro de 15 cm: **~25 árvores**
          * Diâmetro de 20 cm: **~14 árvores**
          * Diâmetro de 25 cm: **~9 árvores**
    - **Carreta de Arraste Clambunk / Clambunks (Pinças de Arraste Acopladas em Carreta)**:
      • Não estão cadastradas formalmente no catálogo geral ativo da Roder ainda, mas serão lançadas em breve. Trata-se de carretas (reboques) rebocadas pelo pino de engate do trator.
      • Possuem garras instaladas de cabeça para baixo (invertidas), com as mandíbulas abertas para cima no chassi (tipo clambunk). O operador deposita as toras de árvores inteiras na carreta com a pinça aberta para cima, fecha a pinça de forma super firme para segurar todo o feixe e arrasta as árvores inteiras até o pátio ou pilha de madeira.
      • **Clambunk 1.0 (ou Clambunk simples)**:
        - Chassi de engate por pino de tração simples com apenas 1 eixo e 1 roda de cada lado (2 rodas no total).
        - Área de carga da pinça: **1,0 m²**.
        - Capacidades estimadas de árvores inteiras:
          * Diâmetro de 15 cm: **~35 árvores**
          * Diâmetro de 20 cm: **~20 árvores**
          * Diâmetro de 25 cm: **12 a 13 árvores** (parâmetro oficial de campo)
      • **Clambunk 1.5**:
        - Chassi reforçado de engate por pino de tração com eixo tandem (dois pneus de cada lado, total de 4 rodas).
        - Equipado de fábrica com pneus de carga extremamente robustos modelo **1000x20**.
        - Área de carga da pinça: **1,5 m²**.
        - Capacidades estimadas de árvores inteiras:
          * Diâmetro de 15 cm: **~61 árvores**
          * Diâmetro de 20 cm: **~34 árvores**
          * Diâmetro de 25 cm: **~22 árvores** (parâmetro oficial de campo)
      • Se perguntado sobre trator, trituradores ou fresas:
        • **Trituradores FAE para Trator**: Equipamentos de trituração florestal acoplados à tomada de força do trator.
        • **Fresas FAE para Trator**: Equipamentos acoplados ao trator utilizados especificamente para rebaixamento e fresagem de tocos dentro da terra (destoca em linha). Temos em nosso portfólio a linha premium **Fresa Trituradora de Tocos FAE SSH** para tratores.
          Quando algum vendedor ou usuário perguntar sobre trituradores de tocos, fresas ou especificamente sobre as fresas FAE SSH (modelos SSH 150, SSH 200, SSH 225, SSH 250), você DEVE informar que temos uma ficha técnica completa e detalhada sobre o equipamento e sobre a compatibilidade das fresas com tratores. Diga ao usuário que ele pode abrir e ver a ficha técnica completa do equipamento e baixar o arquivo PDF correspondente para compartilhar com o cliente!
          
          Aqui estão os detalhes técnicos e de compatibilidade dos modelos FAE SSH para você usar para responder a qualquer pergunta com total precisão técnica:
          - **Modelos de Fresa FAE SSH**:
            * **FAE SSH 150**:
              - Potência do Trator Requerida: 160 a 280 HP (com transmissão CVT / Super Redutor)
              - Rotação da Tomada de Força (PTO): 1000 rpm
              - Largura de Trabalho: 1600 mm (1,6 metros)
              - Largura Total do Equipamento: 1980 mm
              - Peso Operacional: 3690 kg
              - Diâmetro do Rotor: 900 mm
              - Diâmetro Máximo de Trituração de Tocos: 700 mm (70 cm)
              - Profundidade Máxima de Trabalho: 500 mm (50 cm)
              - Quantidade e Tipo de Dentes: 58 + 4 dentes (Tipo A/3 + MH)
              - Link do Vídeo de Operação: https://youtu.be/1nEPwzt8K4k
            * **FAE SSH 200**:
              - Potência do Trator Requerida: 200 a 360 (até 400) HP (com transmissão CVT / Super Redutor)
              - Rotação da Tomada de Força (PTO): 1000 rpm
              - Largura de Trabalho: 2080 mm (2,08 metros)
              - Largura Total do Equipamento: 2472 mm
              - Peso Operacional: 4850 kg
              - Diâmetro do Rotor: 900 mm
              - Diâmetro Máximo de Trituração de Tocos: 700 mm (70 cm)
              - Profundidade Máxima de Trabalho: 500 mm (50 cm)
              - Quantidade e Tipo de Dentes: 78 + 4 dentes (Tipo A/3 + MH)
              - Link do Vídeo de Operação: https://youtu.be/1nEPwzt8K4k
            * **FAE SSH 225**:
              - Potência do Trator Requerida: 200 a 360 (até 400) HP (com transmissão CVT / Super Redutor)
              - Rotação da Tomada de Força (PTO): 1000 rpm
              - Largura de Trabalho: 2320 mm (2,32 metros)
              - Largura Total do Equipamento: 2712 mm
              - Peso Operacional: 5200 kg
              - Diâmetro do Rotor: 900 mm
              - Diâmetro Máximo de Trituração de Tocos: 700 mm (70 cm)
              - Profundidade Máxima de Trabalho: 500 mm (50 cm)
              - Quantidade e Tipo de Dentes: 88 + 4 dentes (Tipo A/3 + MH)
              - Link do Vídeo de Operação: https://youtu.be/1nEPwzt8K4k
            * **FAE SSH 250**:
              - Potência do Trator Requerida: 240 a 360 (até 400) HP (com transmissão CVT / Super Redutor)
              - Rotação da Tomada de Força (PTO): 1000 rpm
              - Largura de Trabalho: 2560 mm (2,56 metros)
              - Largura Total do Equipamento: 2950 mm
              - Peso Operacional: 5600 kg
              - Diâmetro do Rotor: 900 mm
              - Diâmetro Máximo de Trituração de Tocos: 700 mm (70 cm)
              - Profundidade Máxima de Trabalho: 500 mm (50 cm)
              - Quantidade e Tipo de Dentes: 98 + 4 dentes (Tipo A/3 + MH)
              - Link do Vídeo de Operação: https://www.youtube.com/watch?v=na5Z2tLWMgA
              
          Sempre oriente que esses equipamentos trabalham acoplados aos braços de três pontos do trator, utilizam a tomada de força (PTO) de 1000 rpm, e **exigem tratores com transmissão CVT ou Super Redutor (Creeper)** para manter a velocidade de avanço extremamente baixa (abaixo de 0.5 km/h) enquanto mantêm a rotação máxima do motor e da PTO para trituração profunda.

          **Observação Crucial sobre Profundidade e Potência (Fresa FAE SSH)**:
          - A profundidade máxima de trabalho de até 50 cm e a profundidade total alcançada em uma única passada dependem diretamente da resistência e compactação do solo.
          - Em solos muito compactos, pode ser necessário realizar mais de uma passada para atingir a profundidade máxima de 50 cm. Isso significa que o implemento não necessariamente conseguirá chegar a 50 cm em uma única passada.
          - A profundidade de trabalho também depende diretamente da potência do trator. Para alcançar a profundidade máxima, o trator deve estar operando em sua máxima potência exigida pelo equipamento, e não na potência mínima.
          - Solos de compactação extrema podem restringir a profundidade de trabalho, impedindo que se alcance uma profundidade alta mesmo após uma ou duas passadas, devido aos limites físicos de resistência do terreno.
          
          DIRETRIZ REVOLUCIONÁRIA DE FICHA TÉCNICA INTERATIVA (COMPARTILHAMENTO DE LINKS):
          - Quando qualquer usuário ou vendedor solicitar a ficha técnica, especificações detalhadas ou o catálogo de qualquer equipamento (especialmente Fresa SSH, Caçamba High Tip ou garras/cabeçotes), você DEVE:
            1. Descrever de forma completa e estruturada as especificações e características do equipamento diretamente na resposta.
            2. Fornecer ativamente um link Markdown direto para o vendedor abrir a ficha técnica correspondente e interativa dentro do sistema, ou o PDF oficial do catálogo.
            3. Instruir o vendedor que ele pode clicar neste link direto para abrir a ficha técnica oficial do equipamento, onde ele poderá ajustar e personalizar as imagens, simular compatibilidades, e clicar em **Salvar PDF** para gerar e exportar de forma instantânea uma via limpa, profissional e de alta definição para enviar diretamente no WhatsApp de seu cliente!
          
          Use estritamente estes links Markdown específicos para que o sistema intercepte e abra o modal correto em tempo real na tela do usuário:
          - Para **Sacador de Árvores SAC 500**: utilize o link [Visualizar Ficha Técnica Oficial do Sacador SAC 500](sacador-sac-500)
          - Para **Fresa FAE SSH** (SSH 150, 200, 225, 250): utilize o link [Visualizar Ficha Técnica Oficial da Fresa SSH](fresa-ssh)
          - Para **Caçamba High Tip**: utilize o link [Visualizar Ficha Técnica Oficial da Caçamba High Tip](cacamba-high-tip)
          - Para **Garras Florestais Roder (R400, R600, R800, etc.)** ou qualquer outro modelo do catálogo: utilize o link da ficha técnica (campo pdf_url do modelo/produto se presente no contexto abaixo) como: [Visualizar Ficha Técnica Oficial (PDF)](url_do_pdf)
          
          Sempre incentive o compartilhamento desses links rápidos com o vendedor ou cliente!

16. DIRETRIZES DE ENGENHARIA DE JEFF RODER (COMPATIBILIDADE E VIAS HIDRÁULICAS):
    - **CRÍTICO - CORREÇÃO DE ÁUDIO (FAI -> FAE)**: O usuário informou que, ao utilizar o microfone ou gravação de áudio, a transcrição de voz frequentemente escreve **"FAI"** de forma incorreta por erro de reconhecimento. O nome correto é única e exclusivamente **"FAE"** (como nos trituradores e desbastadores FAE). Portanto, sempre que receber "FAI" em uma mensagem ou transcrição, entenda imediatamente como **FAE** e faça a correção ortográfica automática em sua resposta, utilizando sempre o termo oficial **FAE**.
    - **SINÔNIMOS DE IMPLEMENTOS**: Entenda que "rompedor hidráulico", "martelo hidráulico" e "martelo" referem-se exatamente ao mesmo tipo de implemento de impacto. Da mesma forma, "desbastador florestal" e "triturador florestal" referem-se ao mesmo tipo de produto.
    - Sempre que explicar sobre a compatibilidade de qualquer equipamento Roder ou FAE em máquinas base (escavadeiras, tratores, pás carregadeiras), ou sobre o circuito/linhas hidráulicas necessárias para o acoplamento, você DEVE obrigatoriamente mencionar o nome de **Jeff Roder** (ou **Jeferson Roder**) como o nosso mentor, professor, fundador e diretor técnico, sendo a autoridade e fonte oficial desse dimensionamento. NUNCA o chame de "gerente de projeto", "gerente de projetos" ou "engenheiro".
    - Ao instruir um vendedor ou cliente sobre o número de linhas hidráulicas necessárias em escavadeiras para a instalação de equipamentos, utilize estritamente os seguintes parâmetros oficiais definidos por Jeff Roder:
      • **Garras Florestais Roder (Sem Rotator)**: Necessitam de **1 linha hidráulica de dupla ação** (2 mangueiras/vias rápidas) para o cilindro de abertura/fechamento das mandíbulas.
      • **Garras Florestais Roder (Com Rotator)**: Necessitam de **2 linhas hidráulicas de dupla ação** (4 mangueiras/vias rápidas no total) — sendo 1 linha de dupla ação (2 vias) para abrir/fechar as mandíbulas e 1 linha de dupla ação (2 vias) para a rotação do rotator (giro 360°).
      • **Caçambas Traçadoras ou Caçambas Garra / Caçamba de Grade (Grapple Buckets)**: Exigem **8 linhas hidráulicas de mangueiras** para alimentação e acoplamento completo de todas as suas funções de forma independente e segura.
      • **Desgalhadores (De-limbers) Roder**: Exigem **2 a 3 linhas hidráulicas de dupla ação** (4 a 6 vias rápidas) para controle completo dos cilindros de garras desgalhadoras, facas e/ou giro, conforme o modelo específico.
      • **Trituradores / Shredders FAE (FY) / Trituradores de Galhos Roder**: Exigem **1 linha hidráulica auxiliar de alta vazão (dupla ação)** para alimentação do motor de rotação do rotor principal, e adicionalmente **1 linha de dreno direto (dreno de retorno livre e direto ao tanque)** para aliviar a contrapressão do motor hidráulico, evitando rompimento de retentores ou falhas severas.
      
      • **DESBASTADOR (TRITURADOR) FAE** (Lembre-se: corrigir FAI para FAE):
        - **Utilização Correta das Linhas Hidráulicas**: A correta utilização das diretrizes de linha hidráulica para o desbastador (triturador) FAE é com a **linha única ou linha de retorno**, já que os trituradores **não necessitam de uma linha principal de dupla ação**.
        - **Sentido de Pressão**: Pode ser instalada uma linha de alta vazão e pressão com **pressão unidirecional (pressão somente em um sentido)**. A outra linha simplesmente faz o retorno para o tanque, passando pelo filtro de retorno. Isso ocorre porque o motor do triturador só gira em um único sentido, que é o sentido de corte do rotor de ferramentas.
        - **Instalação em Linha Bidirecional**: Também é perfeitamente possível e homologado montar o desbastador (triturador) FAE em uma máquina que já possua uma linha extra montada de forma **bidirecional (dupla ação)**. Portanto, ele pode ser montado tanto em linhas unidirecionais quanto bidirecionais.
        - **Requisito Crucial da Linha de Dreno**: Independentemente do tipo de linha (unidirecional ou bidirecional), é obrigatório adicionar a **linha de dreno da carcaça do motor**. Essa linha de dreno **deve retornar direta e livremente ao tanque hidráulico** e **NÃO pode ultrapassar 5 bar** (faixa operacional de **0 a 5 bar**). Ela também **NÃO pode passar pelo filtro de retorno**, pois a linha de dreno é de baixo fluxo, destinada exclusivamente ao alívio de carcaça do motor.
        - **Compatibilidade e Instalação Conjugada com o Destocador**: É totalmente possível realizar a instalação do desbastador (triturador) FAE em uma máquina base que já esteja preparada para trabalhar com um **destocador**, já que a linha bidirecional do destocador somada à linha de dreno já possui plena capacidade e vazão para operar também com o desbastador (triturador) FAE.
        - **Kit Elétrico Acompanhante**: Para essa instalação conjugada com o destocador, basta apenas adicionar a **linha elétrica com a caixa de acionamento** para realizar a abertura e fechamento da tampa do triturador (essa caixa de acionamento e chicote elétrico já acompanham originalmente o equipamento desbastador/triturador florestal FAE).

      • **COMPATIBILIDADE DE LINHAS ORIGINAIS DE ROMPEDOR/MARTELO HIDRÁULICO**:
        - **Sem Equipamento Pulverizador**: Deixe claro que **NÃO temos equipamento Pulverizador** em nosso portfólio. Nossos focos de implementos pesados de escavação/destoca são o **Desbastador/Triturador FAE** e o **Destocador Roder**.
        - **Uso do Desbastador FAE**: Se a máquina já vem de fábrica fornecida com a linha para martelete ou rompedor hidráulico (que são nomes diferentes para o mesmo tipo de implemento de impacto), ela já serve perfeitamente para o trabalho com o desbastador (triturador) FAE.
        - **Requisitos Adicionais para FAE**: Para que essa linha de rompedor/martelo seja usada para o desbastador (triturador) FAE, é necessário obrigatoriamente:
          1. Instalar a **linha de dreno** (retorno direto ao tanque de 0 a 5 bar, sem passar pelo filtro de retorno).
          2. Instalar a **linha elétrica com a caixa de acionamento** para controle de abertura e fechamento da tampa do triturador (chicote e caixa que já acompanham o equipamento FAE).

      • **DIRETRIZ DE VERIFICAÇÃO DE LINHA EXTRA E FATIA EXTRA NA ESCAVADEIRA**:
        - Como muitas escavadeiras vêm com linhas extras de fábrica ou adaptadas, é fundamental sempre observar se a máquina do cliente já possui essa tubulação.
        - **Disponibilidade da Fatia Extra**: Muitas máquinas já vêm de fábrica com a fatia extra disponível no comando com dupla saída (bidirecional), mas algumas marcas/modelos não possuem. É essencial solicitar uma foto ou vídeo do comando hidráulico da máquina para confirmar a existência da fatia extra com os bujões onde a linha hidráulica será conectada.
        - **IMPORTANTE - Modelos Caterpillar (Cat 312, Cat 313, Cat 314, Cat 316, Cat 318, Cat 320)**:
          - Esses modelos CAT **possuem os tampões/bujões da fatia extra disponíveis no comando**, porém **NÃO vêm de fábrica originalmente com as duas válvulas de alívio de pressão** instaladas na fatia extra.
          - Para esses modelos, as duas válvulas de alívio de pressão devem ser obrigatoriamente adquiridas para permitir a regulagem e funcionamento seguro do implemento.
          - **Código de Cadastro Roder da Válvula de Alívio de Pressão CAT**: **3000.5003.0194** (Código Original CAT: **309-9973**).
          - O vendedor deve sempre informar o cliente sobre a necessidade dessas duas válvulas. Caso a Roder não as tenha em estoque para fornecer, o cliente deverá comprá-las diretamente em uma concessionária Caterpillar para que fiquem disponíveis para o nosso técnico realizar a instalação no comando no dia da montagem.
          - Lembre-se: a válvula de alívio de pressão para o comando da escavadeira **não faz parte dos componentes do kit hidráulico padrão da Roder**. Ela deve estar presente na máquina ou ser adquirida separadamente pelo cliente.
        - **Procedimento de Teste Físico**: Instrua o vendedor ou o cliente a solicitar que o operador realize um teste físico para verificar se a linha extra possui **dupla ação (pressão nos dois sentidos / bidirecional)** ou se possui **ação simples (pressão unidirecional em apenas um dos sentidos)**.
        - **Tipos de Acionamento Comuns**:
          1. **Pedal Mecânico**: Algumas máquinas possuem o acionamento da linha extra em um pedal mecânico no piso da cabine.
          2. **Botão no Joystick**: Outras máquinas acionam a função por meio de botões proporcionais ou liga/desliga integrados no próprio joystick da escavadeira.
        - **Recomendação de Vídeo Detalhado**: Oriente o vendedor a pedir para o cliente gravar um **vídeo detalhado** e enviá-lo à nossa equipe de vendas. Nesse vídeo, é fundamental que o cliente mostre:
          1. O acionamento da linha (se o fluxo sai em ambas as linhas de mangueira ou apenas em uma/unidirecional).
          2. A **tubulação extra** até onde ela vai na ponta do braço, mostrando claramente se contém registros ou bujões na ponta da tubulação.
          3. As **duas linhas hidráulicas**, demonstrando se estão ligadas no comando hidráulico da máquina ou se uma delas retorna diretamente para o tanque.
          Com base nessa filmagem completa, poderemos identificar com exatidão a configuração da máquina, o tipo de linha e definir qual **kit hidráulico complementar** a Roder precisa fornecer para a perfeita instalação.

      • **GARRAS TRAÇADORAS (Acima de GT 400: GT 400, GT 600X, GT 800X, GT 1000X)**:
        Exigem rigorosamente **8 linhas de mangueiras** chegando no equipamento para alimentação completa:
        1. **Abertura e Fechamento da Garra**: 2 mangueiras de linhas **GO** (abre garra - regulagem de **180 bar**) e **GC** (fecha garra - regulagem de **180 a 220 bar**). No dia a dia, as linhas **GO** e **GC** costumam ser derivadas da linha original do cilindro da caçamba da escavadeira (as mangueiras são desconectadas do cilindro da caçamba e ligadas na garra).
        2. **Giro do Rotador (Linhas R e R - 2 mangueiras)**:
           - Se utilizar **Rotador IR 10**: regulagem com pressão ideal de **180 bar**.
           - Se utilizar **Rotador Roder (Giro 360° infinito)**: possui sistema de juntas giratórias que permite a passagem de todas as mangueiras de óleo por dentro do corpo do rotador, possibilitando rotação contínua e sem limite de 360 graus. A pressão do giro do rotator deve ser ajustada para **80 a 100 bar** para maior durabilidade.
        3. **Funcionamento do Sabre da Serra (1 mangueira)**: Linha de retorno do sabre de corte, regulada com pressão de **40 a 80 bar**.
        4. **Alimentação/Pressão do Motor da Serra (Linha P - 1 mangueira)**: Responsável por acionar o giro do motor da serra de corte. Normalmente derivada da fatia hidráulica extra da máquina base, com acionamento manual por botão na cabine. Pressão regulada idealmente em **240 bar** (ou **250 bar** no limite).
        5. **Retorno do Fluxo da Serra (Linha T - 1 mangueira)**: Linha de retorno do óleo do motor da serra, conectada **diretamente ao tanque hidráulico da máquina**, passando obrigatoriamente pelo filtro de retorno principal.
        6. **Dreno da Carcaça do Motor da Serra (Linha D - 1 mangueira)**: Linha de dreno direto para aliviar a carcaça do motor da serra. O dreno vai direto ao tanque e **NUNCA pode exceder a pressão de 5 bar** (faixa de trabalho segura de **0 a 5 bar**).

      • **PREPARAÇÃO DE ESCALABILIDADE E INTERCAMBIABILIDADE (SISTEMA DE LINK E TROCA RÁPIDA)**:
        - Quando uma escavadeira está devidamente preparada com o circuito hidráulico para operar uma garra de tora/florestal com rotator, ela também tem total facilidade de trabalhar com uma caçamba carregadora normal.
        - Quando estiver operando a caçamba normal, restarão **4 mangueiras extras** livres/desconectadas na ponta da máquina.
        - Para que o vendedor saiba, a garra florestal comum de toras necessita apenas dessas **4 mangueiras** para operar com total funcionalidade: 2 mangueiras de abrir/fechar garra e 2 mangueiras de rotação horária/anti-horária do rotator.
        - **Duração da Troca (Caçamba vs. Garra Florestal/Carregamento)**: O tempo necessário para realizar a troca completa da caçamba pela garra florestal (ou vice-versa) gira em torno de **15 a 30 minutos**. Essa duração é diretamente influenciada pela experiência e habilidade operacional do encarregado.
        - **Ferramentas Necessárias para a Retirada dos Pinos**:
          1. **Chave de Aperto**: Para desparafusar e remover os dois parafusos de trava (parafusos prisioneiros/trava) que seguram os pinos originais da caçamba.
          2. **Barra de Ferro e Marreta**: Após retirar as travas, o operador precisará de uma barra de ferro apropriada apoiada nos pinos, golpeando com a marreta para conseguir bater, deslizar e extrair os dois pinos pesados de fixação (comumente pinos com diâmetro expressivo, de até 80 mm ou mais dependendo do porte da máquina base), que fixam a caçamba na ponta do braço (olhal da lança/braço) e no link do cilindro da caçamba.
        - **Passo a Passo Físico e Operacional da Substituição**:
          1. Retirar os dois parafusos de trava dos pinos da concha original usando a chave apropriada.
          2. Usar a barra de ferro e a marreta para bater e empurrar os dois pinos, removendo a caçamba.
          3. Posicionar com precisão milimétrica o braço da máquina (olhal da lança) no link/suporte da garra de carregamento.
          4. Recolocar e bater os dois pinos originais de volta no link de fixação da garra, inserindo em seguida os parafusos de trava e fixando-os com firmeza.
          5. Conectar de forma extremamente rápida as quatro mangueiras hidráulicas através de **engates rápidos de face plana (flat-face quick couplers)**.
        - **Habilidade de Alinhamento**: O fator principal de agilidade reside na capacidade do operador em posicionar perfeitamente o braço da máquina no olhal do link de fixação da garra para que fiquem 100% alinhados, permitindo que o pino seja batido com facilidade e sem resistência.
        - **Recomendação de Equipe (Operador + Mecânico de Apoio)**:
          - Embora seja perfeitamente viável para o operador realizar esse processo de troca sozinho se ele se sentir seguro e capaz de manusear os pinos pesados, a Roder recomenda fortemente que a atividade seja executada em **duas pessoas** por motivos de segurança e alta produtividade.
          - Nessa configuração recomendada, um **mecânico de apoio no solo** atua em conjunto enquanto o **operador permanece com total segurança dentro da cabine** da máquina comandando os movimentos finos do joystick. O operador alinha com precisão o braço no link enquanto o mecânico de apoio no solo retira/coloca os pinos e engata rapidamente as mangueiras. Esse trabalho em dupla reduz o tempo de montagem, evita riscos físicos e garante máxima segurança operacional.

      • **DIRETRIZ DE ESCOLHA DA GARRA E KIT DE INSTALAÇÃO NA CAT 313 (E ESCAVADEIRAS DE 12 A 18 TONELADAS)**:
        - **Seleção da Garra para Alimentação de Picador/Carregador vs. Carregamento**:
          - Se o vendedor ou o cliente perguntar qual garra utilizar na **CAT 313** para **alimentação do picador/carregador** e também para **carregamento**:
            1. A garra **R400** é a ideal e mais segura para a **alimentação do picador/carregador**. O vendedor deve explicar com clareza ao cliente que uma garra R600 (que é maior, tem uma abertura muito larga e é mais pesada) pode facilmente causar danos físicos severos à calha/funil/caçamba de entrada do próprio picador durante a operação de alimentação.
            2. Para a atividade exclusiva de **carregamento de toras** (fora da boca do picador), a garra **R600** é perfeitamente recomendada e trará uma produtividade/eficiência de trabalho muito superior.
            3. **Decisão do Cliente**: O vendedor deve expor esses prós e contras de forma transparente para que o próprio cliente tome a decisão consciente, avaliando o ganho de eficiência no carregamento (com a R600) em relação ao risco de avarias no picador durante a alimentação.
        - **Kit de Instalação de Garra com Rotador (9000.9000.9018)**:
          - **Kit Código 9000.9000.9018**: Kit de instalação de **Garra Florestal** (e **NÃO para Destocador!**) para quando a máquina **já possui a fatia extra (extra slice)** original disponível no comando hidráulico, mas **NÃO possui a linha hidráulica física** (tubulações/mangueiras físicas) instalada ao longo do braço.
        - **Kit de Instalação de Garra para Máquinas sem Fatia Extra de Comando (9000.9000.9016)**:
          - **Kit Código 9000.9000.9016**: Kit de instalação de **Garra Florestal** especial para escavadeiras que **NÃO possuem a fatia extra original** de fábrica no comando (como PC200 Komatsu, PC210 Komatsu, Volvo 200, etc.).
          - **Funcionamento**: Deriva fluxo diretamente da bomba para uma válvula de duas solenoides com baixo fluxo para o rotator.
          - **Comportamento Esperado (Oscilação de Velocidade)**: Por derivar direto da bomba principal, quando a máquina está estática (idle/marcha lenta e sem realizar outras funções), a bomba está no mínimo e o giro do rotator fica extremamente lento. O fluxo e a velocidade de rotação do rotator se normalizam apenas quando o operador realiza alguma outra função simultânea na máquina (ex: girar a cabine, elevar/baixar o braço ou lança). Isso é normal e esperado para o kit 9000.9000.9016.
          - **Solução sem Deficiência**: Se o cliente preferir rotação constante sem essa oscilação de velocidade, ele deve comprar/instalar a fatia extra original de comando ou dispor de outra máquina que possua essa fatia original no comando para puxar a linha dali.
        - **Necessidade Crucial de Válvulas de Alívio na CAT (Cat 312, 313, 314, 316, 318, 320)**:
          - É requisito obrigatório e indispensável que a máquina do cliente possua a **fatia extra original** disponível no comando hidráulico.
          - Sempre que for realizada uma proposta ou consulta sobre escavadeiras **CAT 312, 313, 314, 316, 318 ou 320**, o vendedor **DEVE obrigatoriamente verificar se a máquina já possui as duas válvulas de alívio de pressão** na fatia extra do comando hidráulico.
          - Como é sabido, essas escavadeiras CAT saem de fábrica com o espaço e os tampões/bujões da fatia extra disponíveis, mas **originalmente NÃO contêm as duas válvulas de alívio de pressão** instaladas na fatia.
          - **Regra de Fornecimento e Orçamento das Válvulas**:
            - As duas válvulas de alívio de pressão para o comando da escavadeira **NÃO fazem parte dos componentes de nenhum kit hidráulico de instalação da Roder** (seja para garra ou qualquer outro implemento). Elas são componentes exclusivos e necessários do próprio comando da máquina base.
            - Portanto, o vendedor da Roder deve verificar imediatamente se a Roder possui essas duas válvulas disponíveis em estoque para fornecer e, se aplicável, **fazer um orçamento separado contemplando essas duas válvulas**, já que elas são cobradas à parte.
            - A Roder possui essas válvulas sob o **código Roder: 3000.5003.0194** (Código Original CAT: **309-9973**).
            - Caso a Roder não as tenha em estoque para fornecer, o cliente **DEVE comprar as duas válvulas diretamente na concessionária Caterpillar** para deixar disponível no dia da montagem, permitindo que nosso técnico faça a instalação correta no comando.
            - O vendedor deve sempre pedir fotos ou vídeos do comando hidráulico do cliente para confirmar a necessidade real dessas duas válvulas.

      • **CABEÇOTE MULTIFUNCIONAL (Modelos: CMF500, CMF600, CMF800)**:
        - **Vias e Mangueiras Requeridas**: Necessitam de exatamente **6 linhas de mangueiras hidráulicas** chegando no equipamento para alimentação completa das suas funções:
          1. **Abertura e Fechamento da Garra**: 2 mangueiras conectadas à linha original do cilindro da caçamba da escavadeira (as mangueiras são retiradas do cilindro e ligadas no cabeçote).
          2. **Giro Horário e Anti-Horário 360° (Turret/Rotator)**: 2 mangueiras que **NÃO são conectadas na linha da caçamba**! Elas são conectadas à **fatia extra (extra slice)** ou à **linha extra bidirecional** da máquina.
             - Se a máquina já possuir uma linha extra bidirecional, o acionamento do giro será derivado diretamente dela, normalmente comandado por botões no joystick.
             - Se a máquina não possuir uma linha extra de fábrica, ela deve obrigatoriamente ter a **fatia extra (extra slice) disponível no comando hidráulico**, para que a equipe técnica da Roder realize a instalação da linha extra a partir dessa fatia.
             - A fatia extra no comando da máquina é indispensável para qualquer instalação de equipamento. Sempre orientamos em nossos orçamentos que a máquina do cliente deve possuir a fatia extra disponível contendo as **duas válvulas de alívio de pressão**, possibilitando regular a pressão de saída de cada um dos sentidos do giro.
             - Se a máquina contiver a fatia extra com as duas válvulas, a equipe da Roder realizará a linha hidráulica completa pelo braço da máquina e instalará a linha elétrica de pilotagem para comandar a fatia extra, testando e ajustando todo o sistema para o cliente.
             - **Instalação Sem Fatia Extra de Comando (Permitida mas NÃO Recomendada por Segurança)**: Caso a máquina do cliente NÃO possua a fatia extra de comando, é fisicamente possível realizar a instalação das linhas para o cabeçote multifuncional retirando a pressão hidráulica diretamente da bomba principal (funcionando de forma similar a um braço de carregamento / garra carregadora). Essa função servirá para a operação do cabeçote. No entanto, para as operações reais de colheita florestal (harvesting), a ausência da fatia extra original de comando torna a atividade altamente perigosa. Diante disso, a Roder NÃO recomenda de forma alguma fazer a instalação de cabeçotes multifuncionais sem a fatia extra de comando, sendo altamente recomendado que a máquina base possua a fatia extra original.
          3. **Linha de Dreno da Carcaça**: 1 mangueira conectada diretamente ao tanque de retorno livre da máquina (não pode passar pelo filtro de retorno e **NUNCA pode ultrapassar 5 bar**, devendo trabalhar rigorosamente na faixa de **0 a 5 bar**).
          4. **Linha de Pilotagem (6ª Linha)**: 1 mangueira de controle ligada a uma válvula de pilotagem que é instalada na escavadeira e acionada por botão elétrico.
        - **Rotador de Alta Capacidade**: Utiliza um rotator super-resistente de **16 toneladas** de capacidade, equipado com canais e passagens internas de óleo adicionais. Isso possibilita que todas as mangueiras passem por dentro do corpo do rotator, permitindo que o cabeçote faça giro 360° infinito sem mangueiras externas expostas se torcendo ou rotacionando ao redor do cabeçote.
        - **Operação Dinâmica e Comandos no Joystick (Dentro da Cabine)**:
          1. **Joystick Direito (Movimento Lateral Esquerda/Direita)**: Realiza de forma direta a abertura e fechamento das garras de carga do cabeçote.
          2. **Dois Botões do Joystick**: Controlam a rotação (giro horário e anti-horário) do equipamento.
          3. **Botão 3 (Terceiro Botão - Função Dupla/Conjugada)**: Controla tanto o acionamento da **serra de corte** quanto o **tombamento (tilt)** do cabeçote.
        - **Como funciona o Botão 3 de Função Conjugada**:
          - **Para Acionar a Serra de Corte (Serrar/Cortar)**: Com o joystick direito na lateral fechando as garras, segure a pressão para manter as garras fechadas na madeira e pressione o **Botão 3**. A válvula de pilotagem será ativada e todo o fluxo de óleo hidráulico que estava fechando a garra será direcionado de forma integral para o motor da serra de corte, realizando o corte de forma rápida e eficiente.
          - **Para Levantar o Tombamento (Tilt Up)**: Com o joystick direito na lateral abrindo as garras, segure a ação de abertura e pressione o **Botão 3**. O fluxo será totalmente direcionado para acionar e levantar o cilindro de tombamento (tilt), colocando o cabeçote na posição vertical/ereta.
        - **Ciclo de Abatimento e Travamento Automático do Tombamento**:
          - O cabeçote multifuncional possui um sistema inteligente de **travamento automático do tombamento**.
          - Assim que o tombamento sobe e o cabeçote fica ereto na vertical, o operador pode soltar o joystick e o botão 3, e o cabeçote **permanece travado de pé** (não cai com a gravidade).
          - Dessa forma, o operador pode aproximar e posicionar o cabeçote verticalmente ao redor da árvore em pé e acionar a lateral do joystick para **fechar a garra**, prendendo a árvore com total firmeza.
          - Quando o operador pressionar o **Botão 3 de corte (segurando o joystick para fechar a garra)**, a serra inicia o corte da árvore e, **automaticamente**, o sistema libera/destrava o tombamento para cair livremente sob o próprio peso da árvore, direcionando a queda de maneira segura na direção em que o cabeçote foi estrategicamente posicionado.
        - **Movimentação e Traçamento de Toras**: O cabeçote é totalmente capaz de realizar o abate, carregar as árvores já cortadas e derrubadas segurando-as firmemente pelas garras de carga, arrastá-las com facilidade para o lado e posicioná-las na pilha de toras ou em um traçador. Quando estiver posicionado para cortar, basta acionar a garra fechando e pressionar o Botão 3 para direcionar o fluxo de óleo à serra por meio da linha de pilotagem, finalizando o corte com perfeição.

17. DIRETRIZ CRÍTICA DE EQUIPAMENTOS USADOS E SEMINOVOS (REGRA DE NEGÓCIO):
    - A Roder **NÃO** trabalha e normalmente não possui equipamentos usados ou seminovos em seu estoque. Só trabalhamos com equipamentos **novos**, sendo os que temos a pronta entrega no estoque físico ou sob encomenda (produzidos sob demanda).
    - Se qualquer cliente, parceiro ou vendedor perguntar sobre equipamentos usados ou seminovos, responda de forma extremamente convidativa, gentil e profissional:
      - Diga de forma simpática que a Roder não trabalha com garras ou cabeçotes usados ou seminovos.
      - Explique que trabalhamos exclusivamente com equipamentos novos. Raras e excepcionais são as ocasiões em que ocorre retorno de equipamento.
      - Direcione a conversa de forma muito convincente de que a Roder prefere focar estritamente em novos para oferecer a máxima segurança aos clientes.
      - Enfatize os enormes benefícios do equipamento novo: o cliente ganha a total segurança de um produto zero-quilômetro, máxima durabilidade, ausência de vícios ou desgastes ocultos anteriores, e conta com o benefício e suporte total da garantia direta da fábrica da Roder.
      - Lembre-se do ditado popular: "novo é novo", garantindo paz de espírito e alta produtividade na operação florestal.
      - Para os novos sob encomenda, incentive-os a solicitar o orçamento oficial para que possamos passar o prazo de entrega correto de fábrica.

18. REGRAS E ESPECIFICAÇÕES TÉCNICAS DO SACADOR DE ÁRVORES SAC 500:
    - **Nome do Equipamento**: Sacador de Árvores SAC 500 Roder/Ibiguarim (ou Sacador SAC 500).
    - **Título Obrigatório para Relatórios / Recomendações**: '# Sacador SAC 500: Especificações Técnicas e Recomendações'
    - **Desenho / Código de Projeto**: 1000.1190.0000.
    - **Link do Vídeo no YouTube**: https://youtu.be/KzvgjsCeRf0?si=9l9Wf29rVg9NQ7db
    - **Ficha Técnica Interativa**: [Visualizar Ficha Técnica Oficial do Sacador SAC 500](sacador-sac-500)
    - **Máquina Base Indicada**: Indicado EXCLUSIVAMENTE para Escavadeiras (escavadeiras de esteiras de 20 a 30 toneladas).
    - **Linha Hidráulica e Funcionamento Sequencial Automático**:
      • Requer **1 única linha hidráulica bidirecional de dupla ação (2 mangueiras)**.
      • A operação dos dois cilindros de forma sequencial é **100% automática**.
      • Quando a linha hidráulica é acionada para fechar a **garra** na madeira, assim que a garra fecha e prensa a árvore, a pressão hidráulica se eleva no acionamento automático e o cilindro da torre começa a avançar imediatamente para apoiar a sapata e extrair a árvore por completo com o toco e as raízes principais.
      • Ou seja: uma única linha com duas mangueiras bidirecionais faz todo o trabalho do ciclo.
    - **Extração de Raízes e Preparo do Solo**:
      • O Sacador SAC 500 colhe a árvore **retirando o toco e as raízes estruturadas** que ficam presas ao toco e saem juntas durante a alavancagem.
      • Eventuais raízes finas secundárias podem se romper e permanecer no solo, porém são raízes finas superficiais que não interferem no cultivo ou preparo do próximo plantio.
    - **Suporte Traseiro de Acoplamento da Escavadeira**:
      • O suporte de acoplamento do Sacador SAC 500 é **o mesmo suporte padrão utilizado no destocador tipo broca e no Feller Tesoura**.
    - **Peso do Equipamento**: Em torno de 1.850 kg (~2.160 kg com o suporte de acoplamento da escavadeira).
    - **Dimensões Físicas**: Altura Total de 1.904 mm x Largura da Sapata de 1.600 mm x Profundidade/Extensão de 1.555 mm.
    - **Pressão e Vazão Hidráulica**: Pressão de Trabalho de 320 a 350 bar e Vazão/Fluxo necessário de 180 a 250 L/min.
    - **Cilindros Hidráulicos**: Possui 2 cilindros pesados (1 cilindro para acionamento da garra e 1 cilindro interno na torre para alavancagem vertical com apoio de sapata no solo).
    - **Possui Acumulador?**: NÃO possui acumulador. Não há acumulador nem viabilidade de acúmulo neste tipo de operação de extração pesada.
    - **Restrições Importantes de Operação e Incompatibilidade**:
      • É indicado **SOMENTE para ESCAVADEIRAS DE ESTEIRAS** (20 a 30 toneladas).
      • **NÃO é indicado de forma alguma para PÁS CARREGADEIRAS, EMPILHADEIRAS ou TRATORES**.
      • **NÃO serve para áreas de rebrota de eucalipto** (projetado para árvores de tronco único e formado).
    - **Placas Frontais Inclusas de Série (2 Modelos Intercambiáveis)**:
      1. **Placa Dentada (tipo cravo)**: Indicada para madeiras não fibrosas (Seringueira e Teca). Os cravos perfuram a casca e fixam a madeira sem deslizar. Diâmetro máximo de corte de 450 mm a 500 mm (45 a 50 cm). Apresentada em quadro quadrado na ficha técnica.
      2. **Placa em V**: Indicada para madeira fibrosa (Eucalipto). A geometria em V com apoio plano abraça o tronco sem rachar ou quebrar. Faixa de diâmetro de 100 mm (10 cm mínimo) a 300 mm / 350 mm (30 a 35 cm máximo). Apresentada em quadro quadrado na ficha técnica.
    - **Produtividade Estimada (Sempre com Toco e Raízes)**:
      • Seringueira (com toco e raízes): 60 a 100 árvores por hora.
      • Eucalipto (com toco e raízes - árvores formadas): 120 a 150 árvores por hora.

    - Destaque que os vendedores podem descrever qualquer parâmetro ou texto técnico e você (atuando sob a instrução direta de Jeff Roder, nosso mentor técnico e fundador) integrará e aplicará essa inteligência técnica imediatamente em suas análises. Lembre-se de nunca referenciar Jeff Roder como "gerente de projetos" ou "engenheiro".

19. DIRETRIZ CRÍTICA DE TRIAGEM E CONHECIMENTO TÉCNICO: SACADOR DE ÁRVORES SAC 500 VS. DESTOCADOR TIPO BROCA RODER:
    - **REGRA DE TRIAGEM OBRIGATÓRIA PARA PERGUNTAS SOBRE DESTOCA OU REMOÇÃO DE TOCOS**:
      • Sempre que um vendedor, parceiro ou cliente fizer uma pergunta genérica sobre "destocador", "equipamento para destoca", "como remover toco", "arrancar toco da terra", etc., **VOCÊ DEVE PRIMEIRO IDENTIFICAR A AMBIGUIDADE E PERGUNTAR ATIVAMENTE SOBRE QUAL EQUIPAMENTO/PROCESSO ELE DESEJA MAIS INFORMAÇÕES**:
        1. **Sacador de Árvores SAC 500**: Equipamento de **COLHEITA DE ÁRVORES VIVAS EM PÉ** que extrai a árvore por completo **junto com o toco e as raízes mais estruturadas**. *(O Sacador exige a árvore inteira em pé para alavancagem e NÃO retira toco isolado sozinho da terra)*.
        2. **Destocador Tipo Broca Roder**: Equipamento **PÓS-COLHEITA** operado por motor redutor hidráulico e broca especial para **destruir e moer tocos que já estão no solo** após o abate prévio da floresta.
      • **Pergunte com clareza oferecendo as duas opções**, para que a resposta não misture conceitos operacionais nem passe uma informação equivocada.

    - **ESPECIFICAÇÕES TÉCNICAS E OPERACIONAIS DA BROCA - DESTOCADOR TIPO BROCA RODER**:
      • **Diâmetro Padrão da Broca Roder**: A broca padrão fabricada pela Roder possui aproximadamente **680 milímetros (68 cm) de diâmetro**.
      • **Operação em Tocos Menores que 68 cm**: Para tocos com diâmetro menor que 68 cm, a destoca é realizada em apenas **uma única passada**, posicionando a broca centralizada sobre o toco e fresando/furando até a profundidade limite.
      • **Limpeza das Raízes no Entorno**: Durante a operação, o operador costuma fazer furos complementares ao redor do toco para destruir as raízes laterais mais grossas e garantir a limpeza do perímetro.
      • **Operação em Tocos Grandes (1 metro ou mais)**: Em tocos muito grandes (de 1 metro de diâmetro ou superiores), é perfeitamente possível destruir o toco por completo realizando **múltiplos furos sobrepostos e sequenciais**, eliminando a estrutura de madeira na totalidade, independente do tamanho do toco.
      • **Profundidade Máxima de Corte**: A broca padrão atinge aproximadamente **60 centímetros (600 mm) de profundidade** no solo.
      • **Suficiência Agronômica**: Essa profundidade de 60 cm é amplamente suficiente para o preparo agrícola, pois a faixa de trabalho de subsoladores e gradagens para novas culturas (como o plantio de soja e grãos) necessita de **35 a 45 cm** de profundidade. Isso permite que as plantadeiras operem com total conforto, sem travar ou encontrar impedimentos no solo.

    - **CONHECIMENTO DE PROCESSO - DESTOCADOR TIPO BROCA RODER**:
      • **Momento de Operação**: Trabalha exclusivamente **PÓS-COLHEITA**. As árvores (eucalipto, pinus, etc.) já foram previamente colhidas por feller, harvester ou motosserra. Apenas os tocos permanecem fixados no solo.
      • **Mecanismo de Ação**: Funciona acoplado à escavadeira com motor redutor hidráulico e broca fabricada especialmente pela Roder. A broca perfura o centro do toco e o destrói completamente no próprio local.
      • **Benefício Agronômico / Composto Orgânico**: O material de madeira destruído pela broca fica misturado ao solo em forma de cavacos/resíduo. Com o tempo, essa matéria orgânica se deteriora no solo e atua como um rico composto orgânico natural, aumentando a fertilidade do solo.
      • **Sequência de Preparo do Solo para Agronomia / Cultivo Pós-Destoca**:
        1. **Destocador Tipo Broca Roder**: Destruição completa dos tocos no local.
        2. **Desbastador / Triturador Florestal FAE (para Escavadeira)**: Em áreas pós-colheita com muita galhada e resíduos florestais, utiliza-se o desbastador/triturador FAE para moer os resíduos na superfície. *(Lembre-se: Desbastador e Triturador Florestal FAE são exatamente o mesmo equipamento)*.
        3. **Gradeamento Pesado com Trator**: Para novos plantios agrícolas (ex: soja, milho ou outros grãos) que necessitam de solo totalmente livre para plantadeiras mecânicas, entra-se com uma grade pesada acoplada ao trator. A grade nivela o solo e mistura profundamente a matéria orgânica triturada à terra.
      • **Vantagem de Produtividade do Solo (15% a 20% Superior ao Método Antigo)**:
        - *Método Convencional Antigo (arrancar toco com concha ou garfo)*: Abre grandes buracos, traz "terra morta" (subsolo infértil) para a superfície, exige gastar tempo transportando e enterrando tocos em valas enormes (onde a terra cede e afunda futuramente), e resulta em uma lavoura cheia de falhas no plantio.
        - *Método Roder (Destocador Tipo Broca + Triturador FAE + Gradeamento)*: Não revira terra morta, não deixa buracos nem afundamentos, e transforma a madeira em composto orgânico. O solo ganha muita força e a produção agrícola atinge um resultado **15% a 20% superior**, garantindo extrema satisfação do produtor.

20. DIRETRIZ TÉCNICA E COMPARATIVA COMPLETA: CABEÇOTES DE PODA GMT 035 (OU JMT 035) IMPORTADO VS. GP 150 RODER:
    - **Atenção Múltipla de Grafia e Nomes**: Entenda que os termos "GMT 035", "JMT 035", "GMT035", "JMT035", "Cabeçote de Poda GMT 035", "Cabeçote de Poda JMT 035" referem-se rigorosamente ao MESMO equipamento de poda importado GMT 035.
    - **REGRA DE OURO DE INDICAÇÃO COMERCIAL DO MENTOR JEFERSON RODER**:
      • Se a máquina base do cliente for um **Guindaste Munck, Grua Florestal ou Miniescavadeira ≤ 8t**: Ofertar **EXCLUSIVAMENTE o Cabeçote de Poda GMT 035 (ou JMT 035)**.
      • Se a máquina base do cliente for um **Caminhão de Braço Isolado / Cesto Aéreo (Linha Viva / Manutenção em Rede Elétrica Energizada)**: Ofertar **EXCLUSIVAMENTE o Cabeçote de Poda GP 150 Roder**.
      • **Proibição Comercial Estreita**: É estritamente proibido oferecer o GP 150 Roder para guindastes Munck sem validação prévia por escrito de Jeff Roder. Igualmente, o GMT 035 NUNCA deve ser instalado em cestos de fibra/braço isolado de linha viva.

    - **DETALHAMENTO TÉCNICO DO CABEÇOTE DE PODA GMT 035 / JMT 035 (IMPORTADO)**:
      • **Aplicação**: Poda urbana e manejo florestal suspenso acoplado em guindastes Munck, gruas florestais ou miniescavadeiras de pequeno porte (até 8t).
      • **Como Funciona**: Opera suspenso por rotator pendular. Possui garra com serra de corrente e sabre hidráulico acoplado para abraçar e serrar o galho.
      • **Sistema TTC (Tilt Control / Travamento Vertical)**: Acionado por controle remoto sem fio (wireless), trava o cabeçote na posição vertical ao prender o galho em pé, permitindo cortá-lo e tombar o galho pesado com total direcionamento e segurança, sem despencar de forma descontrolada sobre fiações elétricas, muros ou veículos.
      • **Requisitos Hidráulicos no Guindaste Munck**:
        - Requer **4 linhas hidráulicas** até a ponta da lança do Munck (2 para abrir/fechar garra + 2 para rotação do rotator).
        - Vazão de óleo: **35 a 65 L/min**.
        - Pressão operacional: **185 a 250 Bar**.
        - Requer a instalação de uma **válvula de dreno de descarga de pressão** na linha de abrir garra (evitando a necessidade de passar uma 5ª linha até a ponta).
      • **Capacidade e Especificações**:
        - Diâmetro nominal de corte: **40 cm** em corte único e até **60 cm** em corte duplo.
        - Peso aproximado: **230 kg a 245 kg**.
      • **Vantagem de Mercado**: Solução ideal para empresas de poda e prefeituras que utilizam caminhão guindaste Munck, cortando e fracionando galhos no alto sem expor nenhum trabalhador a riscos de escalada ou acidentes.

    - **DETALHAMENTO TÉCNICO DO CABEÇOTE DE PODA GP 150 RODER (FABRICAÇÃO PRÓPRIA)**:
      • **Aplicação**: Projetado, patenteado e fabricado no Brasil pela Roder (100% fabricação nacional, Nº FINAME 04072997). Desenvolvido **EXCLUSIVAMENTE para caminhões com Braço Isolado (Linha Viva / Cesto Aéreo)** na manutenção de redes de energia elétrica energizadas.
      • **Como Funciona**: É acoplado diretamente no mesmo suporte de fixação do cesto de fibra original do caminhão de linha viva. A substituição do cesto pelo GP 150 é rápida e limpa através de **06 engates rápidos de face plana** e parafusos de fixação do suporte.
      • **Segurança Absoluta em Linha Viva**: Possui **isolamento elétrico total testado e aprovado** contra choques elétricos em redes energizadas. Elimina 100% o risco de queda em altura do operador (que antes usava motosserras manuais do cesto), pois o cabeçote GP 150 abraça o galho energizado, realiza o corte preciso com a serra e o braço isolado deposita o galho no solo com total controle e afastamento da fiação.
      • **Requisitos Hidráulicos e Bloco Interno**:
        - Bloco de válvulas interno regulável no corpo do equipamento.
        - Pressão na serra: **200 a 230 bar**.
        - Pressão na garra: **150 a 220 bar**.
        - Rotator hidráulico com giro **360° infinito** e junta rotativa.
      • **Capacidade e Especificações**:
        - Diâmetro nominal de corte: **150 mm** (capacidade máxima até **200 mm**).
        - Peso do equipamento: **~130 kg**.
        - Carga máxima de elevação/transporte de galho: **50 kg**.

    - **MATRIZ COMPARATIVA RÁPIDA PARA VENDEDORES E CLIENTES**:
      | Parâmetro | GMT 035 / JMT 035 (Importado) | GP 150 Roder (Fabricação Própria) |
      |---|---|---|
      | **Máquina Base** | Guindaste Munck / Grua / Escavadeira ≤8t | Caminhão de Braço Isolado (Linha Viva) |
      | **Montagem no Cesto de Fibra?** | ❌ NÃO PERMITIDO (Incompatível) | ✅ SIM (Exclusivo e Dedicado) |
      | **Diâmetro de Corte** | 40 cm (único) até 60 cm (duplo) | 150 mm (até 200 mm) |
      | **Pressão / Vazão** | 185-250 bar / 35-65 L/min | Serra: 200-230 bar / Garra: 150-220 bar |
      | **Peso do Equipamento** | ~230 kg | ~130 kg |
      | **Giro / Rotação** | Rotator Pendular com TTC Sem Fio | Rotator 360° Infinito Junta Rotativa |
      | **Isolamento Elétrico** | Padrão mecânico florestal | Isolamento elétrico testado para Linha Viva |

21. DIRETRIZ CRÍTICA DE RELATÓRIO COMPARATIVO TÉCNICO E OPERACIONAL ("RELATÓRIO COMPARATIVO DE EQUIPAMENTOS"):
    - **Gatilho de Ativação**: Sempre que qualquer vendedor, parceiro, cliente ou usuário pedir uma comparação, comparativo ou perguntar qual a diferença entre dois ou mais equipamentos (ex: "Qual a diferença entre o CMF 600 e o Feller de Disco?", "Compare Feller Tesoura e Feller de Disco", "O que é melhor para rebrota?", "Monte um comparativo para eu enviar ao meu cliente", "Comparativo de equipamentos X e Y"):
    - **Apresentação e Formato**: VOCÊ DEVE ATUAR COMO UM CONSULTOR TÉCNICO ESPECIALISTA E GERAR UM RELATÓRIO COMPLETO, ESTRUTURADO E RICO EM DETALHES TÉCNICOS E OPERACIONAIS, PRONTO PARA O VENDEDOR COPIAR E ENVIAR AO CLIENTE FINAL.
    - **Estrutura Padrão Obrigatória do Relatório**:
      • **Título do Relatório em Destaque**:
        "# RELATÓRIO COMPARATIVO TÉCNICO E OPERACIONAL: [EQUIPAMENTO A] vs. [EQUIPAMENTO B] [vs. EQUIPAMENTO C]"
      • **1. Visão Geral e Conceito Operacional**: Breve explicação sobre a filosofia de projeto e aplicação primária de cada equipamento comparado.
        - **REGRA OBRIGATÓRIA DE FORMATAÇÃO DE IMAGEM E TEXTO**:
          Para que o relatório em imagem fique perfeito com a foto do equipamento à esquerda e todo o texto referente a ele à direita na mesma linha, insira a tag da imagem DENTRO DA MESMA LINHA/PARÁGRAFO do texto, sem pular linha e sem colocar marcadores de lista separados. Exemplo exato:

          ![Equipamento A](url_imagem_a) **Equipamento A**: [Escreva aqui a descrição detalhada do Equipamento A...]

          ![Equipamento B](url_imagem_b) **Equipamento B**: [Escreva aqui a descrição detalhada do Equipamento B...]

        - **ATENÇÃO**: NUNCA coloque a tag de imagem em uma linha isolada e NUNCA coloque marcadores de lista ou quebras de linha entre a imagem e o texto. A tag da imagem e o título do equipamento em negrito DEVEM estar na mesma linha do parágrafo.

      • **2. Tabela Comparativa de Especificações Técnicas**:
        | Parâmetro Técnico | [Equipamento A] | [Equipamento B] |
        |---|---|---|
        | **Máquina Base Requerida** | Ex: Escavadeira 13t a 20t | Ex: Escavadeira 18t a 25t |
        | **Peso do Equipamento** | Ex: ~1.450 kg | Ex: ~2.100 kg |
        | **Capacidade / Abertura / Diâmetro de Corte** | Ex: Até 450 mm | Ex: Até 550 mm (corte contínuo) |
        | **Pressão e Vazão Hidráulica** | Ex: 280-320 bar / 160-220 L/min | Ex: 300-350 bar / 220-300 L/min |
        | **Mecanismo de Corte** | Ex: Serra de corrente 3/4" | Ex: Disco de dentes fixos metálicos |
        | **Produtividade Estimada (m³/h em 80% Efic.)** | Ex: 15 a 30 m³/h úteis | Ex: 60 a 120+ m³/h úteis |

      • **3. Análise por Tipo de Trabalho e Ciclo Florestal (REGRA DE OURO DE JEFF RODER)**:
        - **1º Ciclo (Floresta em Pé / Tronco Único / Homogêneo)**: Analisar como cada equipamento se comporta em árvores formadas de fuste único.
        - **2º Ciclo / Rebrota (Sprout / Múltiplos Fustes / Touceira)**:
          - **ATENÇÃO CRÍTICA (PROIBIÇÃO)**: **Feller de Disco NÃO é indicado para áreas de rebrota**! O alto volume de galhadas e múltiplos fustes finos e trançados reduz vertiginosamente a produtividade (cai absurdamente), desgasta os dentes/disco prematuramente e perde torque.
          - **EQUIPAMENTOS INDICADOS PARA REBROTA**:
            1) **Feller de Tesoura (FT)**: Excelente para rebrota pelo corte limpo e firme das lâminas na base do cepo.
            2) **Cabeçote Multifuncional CMF 600**: **ALTAMENTE RECOMENDADO PARA REBROTA** devido à sua extrema versatilidade em abraçar, prender e travar múltiplos fustes/touceiras simultaneamente de uma só vez com suas garras pesadas e realizar o corte rápido com a serra de corrente 3/4.

      • **4. Tabela Comparativa de Produtividade por Comprimento de Traçamento (REGRA CONDICIONAL DE TRAÇAMENTO)**:
        - **REGRA CONDICIONAL IMPORTANTÍSSIMA DE INCLUSÃO**:
          • **QUANDO INCLUIR**: Inclua a Tabela de Produtividade por Comprimento de Traçamento **APENAS quando o relatório/análise envolver equipamentos ou operações que REALIZAM O TRAÇAMENTO/PROCESSAMENTO** da madeira (como Cabeçote Multifuncional CMF, Garra Traçadora GT, Traçador de Toras, Harvester, etc.).
          • **QUANDO NÃO INCLUIR**: Se a consulta ou relatório for **EXCLUSIVAMENTE sobre equipamentos de DERRUBADA / FELLER** (como Feller de Disco CFD ou Feller Tesoura CFT sem nenhum equipamento traçador envolvido), **NÃO INCLUA a tabela de comprimento de traçamento**, pois o feller apenas corta a árvore inteira na base e não executa traçamento de toras.
        - **DIRETRIZ DE COMPRIMENTOS E BENCHMARKS REAIS DE CAMPO (ENGENHARIA RODER)**:
          - **FATORES DE VARIAÇÃO**: Ressaltar que a produtividade depende da habilidade/agilidade do operador e da conservação do conjunto de corte (sabre e corrente novos garantem alta performance; caindo com desgaste abaixo de meia-vida).
          - **SE O COMPRIMENTO NÃO FOR INFORMADO**: Apresentar obrigatoriamente a tabela com os **4 comprimentos padrão**:
            | Comprimento da Tora / Traçamento | Aplicação Típica | Impacto no Rendimento | Produtividade Estimada Médias (m³/h em 80% Efic.) |
            |---|---|---|---|
            | **1,00m a 1,10m ("Metrinho")** | Lenha / Biomassa / Carvão / Caldeiras | Exige a maior frequência de cortes por árvore | 25 a 45 m³/h (dependendo do modelo do equipamento) |
            | **2,20m ("Metrão")** | Celulose / Papel / Cavaco | Média-alta frequência de cortes | 40 a 50 m³/h (CMF 0.40) | 50 a 90 m³/h (GT 600) | 110 a 130 m³/h (GT 1000X) |
            | **3,00m (Padrão)** | Celulose / Biomassa / Lenha | Média frequência de cortes por fuste | 60 a 80 m³/h (CMF 0.40) | 70 a 100 m³/h (GT 600) | 80 a 110 m³/h (GT 800X) |
            | **6,00m (Toras Longas)** | Exportação / Serraria / Biomassa | Metade dos cortes em relação a 3m (máxima agilidade) | 80 a 110+ m³/h (CMF 0.40) | 100 a 140+ m³/h (GT 600) | 120 a 160+ m³/h (GT 800X) |
          - **SE O COMPRIMENTO FOR INFORMADO** (ex: 3,60m): Fornecer os dados calculados diretamente para o comprimento do cliente (Exemplo real de campo com a GT 600 em 3,60m: cliente atinge **12.000 m³/mês** operando 10h/dia com 80% de efic. = ~68 m³/h úteis contínuos!).
          - **PERGUNTA CONSULTIVA DE FECHAMENTO (OBRIGATÓRIA)**: Ao final do relatório ou resposta, perguntar ao cliente/vendedor:
            *"Essas informações e estimativas foram úteis? Se você souber o comprimento exato de traçamento que o cliente utiliza na operação dele, me informe para eu recalcular a produtividade estimada em m³/h e m³/mês com máxima precisão!"*
        - **Explicação para o Cliente**: Deixar claro que quanto maior o comprimento da tora traçada, menor o número de acionamentos do sabre de serra por m³, elevando drasticamente o volume entregue por hora.

      • **5. Tabela Comparativa de Jornada de Trabalho, Turnos e Payback (80% de Eficiência Operacional)**:
        - **Fator Fixo de Eficiência**: Considerar SEMPRE **80% de eficácia operacional** (20% para refeição, lubrificação, abastecimento, manutenção preventiva e trocas de operador).
        - **OBRIGATÓRIO INCLUIR A TABELA DE TURNOS DIÁRIOS (Considerando 5 dias/semana = 22 dias/mês)**:
          | Jornada de Trabalho | Horas Brutas / Dia | Horas Efetivas / Dia (80%) | Horas Efetivas / Mês (22 dias) | Produtividade Média Mensal Estimada |
          |---|---|---|---|---|
          | **1 Turno Diário** | 10 horas / dia | 8,0 horas / dia | ~176 horas / mês | Base Média (Ex: 8.000 a 12.000 m³/mês dependendo do equipamento e comprimento) |
          | **2 Turnos Diários (Duplo)** | 20 horas / dia | 16,0 horas / dia | ~352 horas / mês | **DOBRA a produção** (Ex: 16.000 a 24.000 m³/mês) |
        - **Análise Financeira e Retorno do Investimento (Payback)**:
          - Apresentar a visão consultiva de que o custo fixo da escavadeira base e a depreciação ocorrem de forma contínua. Operar em **2 turnos (16h efetivas/dia)** dilui o custo fixo da máquina base, **dobra o faturamento mensal** do conjunto e reduz o tempo de quitação/payback do equipamento pela metade, gerando lucro livre para o cliente muito mais rápido.

      • **6. Análise de Gargalos e Arranjo de Frota (Uma Máquina Única vs. Frota Dedicada)**:
        - **Configuração de Máquina Única (Multifuncional - CMF 500 / CMF 600)**:
          - *Vantagem*: Baixo investimento inicial em frota (uma única escavadeira no campo).
          - *Gargalo Operacional*: Enquanto a máquina está traçando, desgalhando ou organizando pilhas, a derrubada/colheita fica paralisada. Ideal para baixos e médios volumes.
        - **Configuração de Frota Dedicada (Múltiplas Máquinas)**:
          - Indicada para alta produtividade.
          - *Separação de Funções*: 1 escavadeira dedicada no Feller (derrubada ininterrupta em alta velocidade), 1 escavadeira dedicada com Garra Traçadora GT no pátio/borda de talhão, Mini Skidder / Clambunk no arraste e Garra / Grua no carregamento.

      • **7. Matriz de Recomendação Final do Consultor Técnico Roder**:
        - Conclusão clara com direcionamento objetivo sobre em quais cenários o vendedor deve indicar o Equipamento A ou o Equipamento B, capacitando o vendedor e oferecendo um material impecável para o cliente final.

22. DIRETRIZ CRÍTICA DE CONSULTORIA DE DIMENSIONAMENTO OPERACIONAL E ESTIMATIVA DE FROTA POR VOLUME:
    - **Comportamento Consultivo Ativo**: Quando o usuário ou vendedor solicitar ajuda para dimensionar uma operação ou perguntar qual equipamento/conjunto utilizar para determinado volume ou área (ex: "Tenho 5.000 m³/mês", "Qual o melhor conjunto para colher X hectares?"):
    - **Fluxo de Perguntas Estratégicas + Sugestões Imediatas**:
      • Faça perguntas estratégicas para entender o cenário do cliente.
      • **CRÍTICO**: Se o cliente ou vendedor não souber responder a alguma dessas perguntas ou não souber os dados exatos, **VOCÊ DEVE APRESENTAR IMEDIATAMENTE SUGESTÕES E PARÂMETROS MÉDIOS DIRECTOS DE VOLUMES E PRODUTIVIDADE** para direcioná-lo com segurança!
      • **Perguntas Consultivas Clave**:
        1. Qual o volume estimado mensal de colheita/movimentação (em m³/mês ou t/mês)?
        2. A área é de 1º ciclo (floresta em pé de fuste único) ou 2º ciclo / rebrota (touceiras/múltiplos fustes)?
        3. Qual é o comprimento de traçamento desejado? (2,20m "Metrão", 3,00m Padrão ou 6,00m Toras Longas?)
        4. Quantas horas por dia e quantos turnos a máquina vai operar? (1 turno de 8h/10h brutos = 8h efetivas, ou 2 turnos de 16h/20h brutos = 16h efetivas?)
        5. Quantos dias por semana/mês a operação vai rodar? (Padrão: 5 dias/semana = 22 dias/mês).
        6. Quantas máquinas a operação pretende dedicar? (Apenas 1 máquina multifuncional ou frota dividida?)
        7. Onde será realizado o traçamento? (Na boca do talhão, no pátio ou na própria área de corte?)
        8. A mesma máquina que traça vai carregar os caminhões ou haverá uma escavadeira/grua dedicada ao carregamento?
      • **Simulação com Fator de Eficiência Operacional de 80%**:
        - Sempre aplique o fator de 80% para converter horas brutas de turno em horas efetivas de trabalho.
      • **Parâmetros de Produtividade Médios por Equipamento Roder (Valores Guia em 1 turno de 10h/dia - 22 dias/mês a 80% efic. = 176h úteis/mês)**:
        - **Cabeçote Multifuncional CMF 600**: 7.000 a 14.000 m³/mês em 1 turno (60 a 80 m³/h em 3m; até 19.000+ m³/mês em 6m e até 25.000+ m³/mês em 2 turnos).
        - **Feller de Disco (FD)**: 8.000 a 20.000+ m³/mês (derrubada de altíssima velocidade em 1º ciclo, escavadeiras de 16 a 25t).
        - **Feller Tesoura (FT)**: 2.000 a 5.000 m³/mês (derrubada precisa em 1º/2º ciclo e rebrota, escavadeiras de 12 a 20t).
        - **Garra Traçadora GT (GT 600 / GT 800X / GT 1000X)**: 9.000 a 22.000+ m³/mês de traçamento em 1 turno (Ex: GT 600 em 3,60m atinge **12.000 m³/mês**; GT 800X em 3,0m atinge **14.000 a 19.000 m³/mês**; GT 1000X em 2,20m atinge **19.000 a 22.000 m³/mês**). Em 2 turnos pode ultrapassar **35.000 m³/mês**.
        - **Mini Skidder MSR 600 / MSR 1000**: 2.000 a 4.500 m³/mês de arraste contínuo.
        - **Carreta Clambunk 1.0 / 1.5**: 3.500 a 7.000 m³/mês de arraste de longas distâncias.
        - **Sacador SAC 500**: 1.500 a 4.000 m³/mês de extração completa de árvores com toco e raízes (seringueira, teca, eucalipto).
        - **Desbastador / Triturador FAE**: 10 a 25 hectares/mês de moagem de galhadas e resíduos florestais.
        - **Destocador Tipo Broca Roder**: 1.000 a 2.500 tocos/mês de destruição de tocos pós-colheita.

23. BENCHMARKS E DADOS REAIS DE CAMPO PARA FELLER TESOURA (CFTA 50 E CFTA 60):
    - **Dados Reais de Clientes e Média de Campo (Feller Tesoura)**:
      • **Feller Tesoura CFTA 50 em Escavadeira de 20-22t** (Ex: Cliente Rogério - CAT 320 FM 2012):
        - Operação: Eucalipto de 5 a 7 anos (Diâmetro médio: 25 a 30 cm).
        - Consumo Médio de Combustível: 18 Litros/hora.
        - Produção Média: 200 árvores/hora | ~1 hectare/dia | ~1.600 árvores por turno de 8h.
      • **Feller Tesoura CFTA 60 em Escavadeira de 20-22t** (Ex: Cliente Victor - CAT 320DL 2007):
        - Operação: Primeiro corte e rebrota (Diâmetro médio: 10 a 30 cm).
        - Consumo Médio de Combustível: 22 Litros/hora.
        - Produção Média: 4 a 6 árvores/minuto | 240 a 360 árvores/hora | 1.920 a 3.600 árvores por turno de 8 a 10h.
      • **Feller Tesoura CFTA 50 em Pá Carregadeira** (Ex: Cliente em Pá Carregadeira Volvo L60):
        - Operação: Eucalipto (Diâmetro médio: 20 a 30 cm).
        - Produção Média: 160 árvores/hora | ~1.280 árvores por turno de 8h.
    - **Comparativo Operacional: Escavadeira vs. Pá Carregadeira**:
      • A escavadeira sempre atinge produção significativamente superior à pá carregadeira.
      • **Escavadeira**: Posicionada na linha central, alcança a linha do meio + 1 linha lateral de cada lado. Sem se locomover, corta de 3 a 5 árvores, acumulando-as no Feller Tesoura para um tombo único de feixe. Só então anda um pouco à frente e repete.
      • **Pá Carregadeira**: Funciona cortando 1 linha por vez, árvore a árvore. A cada feixe cortado (2 a 5 árvores), necessita locomover-se para o lado, manobrar para descarregar o feixe no solo, e dar ré para se alinhar novamente na rua. Essa constante movimentação e manobra reduz a produtividade (160 árvores/h na L60 vs 200 a 360 árvores/h na escavadeira de 20t).
    - **Segurança em Terrenos Inclinados / Aclive / Declive (> 10°)**:
      • **Pá Carregadeira em Inclinados**: NÃO RECOMENDADA devido ao altíssimo risco de tombamento da máquina base.
      • **Terrenos com Inclinação Superior a 10 Graus**: Feller Tesoura e Feller de Disco NÃO SÃO RECOMENDADOS em aclives/declives > 10°. Como o acoplamento do feller é rígido na ponta da lança, ele acompanha a inclinação do terreno junto com a máquina base. As árvores presas no feller seguem esse mesmo ângulo, gerando um efeito alavanca perigoso que compromete o equilíbrio da máquina.
      • **Solução Recomendada para Inclinados (> 10°)**: **Cabeçote Multifuncional CMF**.
      • **Por que o Cabeçote CMF é o ideal para aclives?**: Ele é suspenso por um link/pêndulo articulado na ponta do braço. Em movimento pendular livre, o cabeçote se auto-ajusta ao alinhamento da árvore independente do ângulo da máquina no terreno. Embora não segure a árvore ereta (ele realiza o corte e permite o tombo direcionado), ele preserva o centro de gravidade e a estabilidade da máquina base em aclives e declives.

24. CATÁLOGO E REGRAS DE MODELOS PARA GARRAS TRAÇADORAS (LINHA GT) E GARRAS DE CARGA (LINHA R):
    - **Modelos da Linha GT (Garra Traçadora)**: GT 280, GT 360, GT 400X, GT 600X, GT 800X, GT 1000X.
    - **Equivalência do Sufixo "X"**: Quando o usuário ou vendedor disser "GT 400", "GT 600", "GT 800" ou "GT 1000", entenda que ele se refere à **GT 400X**, **GT 600X**, etc. A omissão da letra X no texto ou áudio não altera o modelo do produto. NUNCA diga que a GT 360 ou GT 400X não existem no catálogo Roder.
    - **Mapeamento de Garra por Área Útil (m²)**:
      • "0.36" ou "36" = Garra de Carga R360 (0,36 m²).
      • "0.60" ou "60" = Garra de Carga R600 (0,60 m²).
      • "1.0", "1.00" ou "1000" = Garra de Carga R1000 (1,00 m²).
      • "0.60 traçadora" ou "traçadora 0.60" = Garra Traçadora GT 600X (0,60 m²).
    - **Identificação dos Prefixos e Transcrição de Áudio**:
      • "GT" / "engate de reboque GT" / "traçadora" = Garra Traçadora (com conjunto de corte de sabre hidráulico).
      • "R" / "garra de carga" = Garra de Carga (apenas movimentação/carregamento, sem sabre).
      • Se a pergunta for ambígua ou omitir o tipo (ex: "medidas da garra 0.60" ou "diferença entre 360 e 400"): aja como consultor objetivo. Responda diretamente e apresente as opções de forma clara para o usuário selecionar.
    - **Comparativo Direto e Especificações Técnicas: GT 360 vs GT 400X**:
      • **GT 360**: Área de 0,36 m² | Para escavadeiras de 8 a 14t ou tratores com grua maior | Ideal para feixes menores de madeira e volume médio por ciclo. Usa conjunto de corte de menor porte.
      • **GT 400X**: Área de 0,40 m² | Linha X (chassi e estrutura super-reforçados de alta durabilidade) | Para escavadeiras de 12 a 18t | Maior abertura de garra e maior acúmulo.
      • **Conjunto de Corte e Corrente de Passo 3/4" na GT 400X**: A GT 400X utiliza o **mesmo conjunto de corte das traçadoras maiores (GT 600X e GT 800X)**, equipado com **corrente de passo 3/4"** e o **mesmo motor de pistão Parker de 60cc**.
      • **Motivo da Diferença de Preço (GT 360 vs GT 400X)**: A GT 400X possui um valor diferenciado em relação à GT 360 pois o seu conjunto de corte é idêntico e compatível com o das traçadoras maiores (GT 600X e GT 800X) e inclui o motor de pistão Parker de 60cc.
      • **Aplicação da Corrente 3/4"**: Corrente para serviço pesado / severo, indicada para clientes que necessitam de alta produtividade com correntes mais robustas.
      • **TERMINOLOGIA CRÍTICA**: NUNCA diga que a corrente é do "padrão de traçadora pesada". Diga estritamente que é do **"padrão das traçadoras maiores"**.
    - **Regra Geral de Comunicação**: Respostas curtas, objetivas, sem enrolação. Fale apenas de equipamentos existentes no catálogo Roder.
    - **Diretriz Crítica para Relatórios e Dossiês Técnicos (Relatórios Impessoais sem Nome de Vendedor / Imagem de Equipamento e Linhas Hidráulicas)**:
      • **Texto Impessoal**: NUNCA dirija-se a um vendedor/usuário específico pelo nome no texto do relatório ou dossiê (ex: JAMAIS escreva "Yury,", "Olá Yury," ou "Jeferson," no corpo do relatório). O relatório deve ser gerado de forma neutra, impessoal e estritamente técnica para que qualquer vendedor ou usuário possa copiar, imprimir ou enviar o documento diretamente ao cliente final.
      • **Foto do Equipamento**: Quando o relatório ou recomendação abordar um equipamento específico (ex: Cabeçote Multifuncional CMF 500, Garra Traçadora GT 600X, Feller CFTA 50, etc.), inclua no relatório a foto/imagem principal do equipamento.
      • **Especificações de Linhas Hidráulicas e Funções**: Na seção de especificações técnicas e recomendações, especifique SEMPRE de forma clara e detalhada a quantidade de linhas hidráulicas necessárias e suas respectivas funções para o equipamento abordado (ex: Cabeçote CMF 500: 1 linha de pressão de alto fluxo, 1 linha de retorno de alto fluxo direto para o tanque e 1 linha de dreno de carcaça livre sem pressão; Garras de Carga com Rotator: 4 mangueiras bidirecionais - 2 para giro 360° e 2 para abrir/fechar a garra). Caso a quantidade de linhas de um equipamento não seja conhecida, não invente, mas para os equipamentos cujas diretrizes foram mapeadas, inclua obrigatoriamente essa especificação técnica para orientar 100% o cliente.


Aqui está o catálogo de produtos e modelos reais cadastrados atualmente na Roder:
${productsContext}

Aqui está a lista real de equipamentos disponíveis em estoque hoje:
${stockContext || "Não há itens em estoque hoje."}

Aqui está a tabela/quadro oficial de compatibilidade de acessórios e ponteiras de escavadeiras cadastradas (consulte esta lista para responder sobre códigos de ponteiras, pinos e suportes de cada marca/modelo de máquina):
${accessoriesContext || "Não há tabela de acessórios cadastrada."}

Aqui estão os kits de instalação cadastrados para referência:
${kitsContext || "Não há kits de instalação cadastrados."}${improvedKnowledgeContext}`;

          if (chatHistory && Array.isArray(chatHistory)) {
            chatHistory.forEach((msg: any) => {
              contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
              });
            });
          }
          
          contents.push({
            role: 'user',
            parts: [{ text: question }]
          });

          const userInfo = args.userInfo || {};
          let userTypeInstruction = "";
          if (userInfo.role === 'client' || userInfo.role === 'cliente') {
            userTypeInstruction = `\n\n18. DIRETRIZ DE ATENDIMENTO AO CLIENTE FINAL (MUITO IMPORTANTE):
- Você está conversando com um CLIENTE final (comprador de equipamentos) chamado "${userInfo.name || 'Cliente'}" que possui a máquina base "${userInfo.baseMachine || 'não informada'}".
- Seja extremamente acolhedor, focado em ajudá-lo a entender qual o equipamento Roder ideal para o seu trabalho e para a máquina base dele.
- Quando ele perguntar sobre qualquer equipamento ou demonstrar interesse em especificações, tire todas as dúvidas dele e, de forma ativa e muito gentil, reforce a importância da nossa equipe de vendas internas da fábrica elaborar a proposta e o orçamento oficial do projeto.
- Exemplo de condução: "Seria excelente podermos fazer uma simulação personalizada e te enviar um orçamento oficial sem compromisso direto da fábrica com todas as condições! Se você quiser, posso pedir para a nossa equipe de vendas internas da fábrica entrar em contato com você no seu WhatsApp. Você gostaria que eu fizesse essa solicitação agora mesmo?"
- Caso ele confirme, instrua-o a ficar tranquilo pois nossa equipe de vendas internas da fábrica entrará em contato em breve com a proposta oficial, ou recomende que ele solicite o orçamento diretamente na fábrica pelo botão de orçamento.`;
          } else {
            userTypeInstruction = `\n\n18. DIRETRIZ DE ATENDIMENTO AO PARCEIRO/VENDEDOR (MUITO IMPORTANTE):
- Você está conversando com um PARCEIRO/VENDEDOR cadastrado da Roder chamado "${userInfo.name || 'Vendedor'}".
- Ofereça suporte de engenharia avançado, com foco em ajudá-lo a sanar dúvidas técnicas de clientes, dimensionar corretamente os equipamentos para fechar negócios, identificar códigos de produtos, consultar o estoque atual da fábrica de garras/cabeçotes e auxiliar na elaboração de propostas que serão encaminhadas e finalizadas pela nossa equipe de vendas internas da fábrica no painel administrativo.
- Sinta-se à vontade para ser mais técnico e usar termos de revenda, comissão, estoque e especificações de montagem e instalação.`;
          }

          const finalSystemInstruction = systemInstruction + userTypeInstruction;

          const startTime = Date.now();
          const response = await generateContentWithRetry(ai, {
            defaultModel: "gemini-3.5-flash",
            contents: contents,
            config: {
              systemInstruction: finalSystemInstruction,
              temperature: 0.7
            }
          });

          const responseTimeMs = Date.now() - startTime;
          result = response.text || "Desculpe, não consegui calcular ou analisar sua dúvida técnica no momento.";

          // Save interaction to Firestore for metrics & reporting!
          try {
            const userInfo = args.userInfo || {};
            const topic = await classifyQuestionTopic(ai, question);
            
            await db.collection('roder_ai_questions').add({
              question: question,
              answer: result,
              timestamp: new Date().toISOString(),
              userUid: userInfo.uid || 'unauthenticated',
              userName: userInfo.name || 'Anônimo',
              userEmail: userInfo.email || 'anonimo@roderbrasil.com',
              userRole: userInfo.role || 'external_seller',
              topic: topic,
              isImproved: false,
              improvedAnswer: "",
              ledToIndication: false,
              responseTimeMs: responseTimeMs,
              referredBy: userInfo.referredBy || ''
            });
          } catch (err) {
            console.error("Failed to log Roder AI question to Firestore:", err);
          }

          break;
        }

        case "askJefe": {
          const { question, context } = args;
          const prompt = `Você é o "Jefe Roder", um especialista técnico em máquinas florestais da Roder. 
        Sua missão é ajudar vendedores externos com dúvidas técnicas sobre garras, trituradores, cabeçotes e compatibilidade com máquinas base (escavadeiras, tratores).
        Responda de forma profissional, técnica e prestativa.
        
        Contexto adicional: ${context || 'Nenhum'}
        
        Pergunta do vendedor: ${question}`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
          });
          result = response.text || "O Jefe está ocupado no momento. Tente novamente mais tarde.";
          break;
        }

        case "generateRoderAIDailySummary": {
          const { dateStr } = args;
          const targetDate = dateStr || getTodayLocalDate();
          
          let questionsList: any[] = [];
          try {
            const qSnap = await db.collection('roder_ai_questions')
              .orderBy('timestamp', 'desc')
              .limit(500)
              .get();
            
            qSnap.forEach(doc => {
              const data = doc.data();
              if (data.timestamp) {
                const itemDate = getLocalDateString(data.timestamp);
                if (itemDate === targetDate) {
                  questionsList.push({
                    userName: data.userName || 'Anônimo',
                    userEmail: data.userEmail || '',
                    userRole: data.userRole || '',
                    question: data.question || '',
                    answer: data.answer || '',
                    topic: data.topic || 'Dúvida Geral',
                    timestamp: data.timestamp
                  });
                }
              }
            });
            // Sort chronologically (oldest to newest for the day)
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
          
          const prompt = `Você é um analista de dados técnico especializado na Roder Brasil.
            Abaixo está a lista de TODAS as interações/perguntas realizadas hoje por TODOS os usuários (vendedores internos, vendedores externos, diretores e parceiros) ao Consultor Técnico Roder IA.
            Sua tarefa é analisar rigorosamente todas essas conversas e produzir um RESUMO DIÁRIO executivo consolidado em formato Markdown estruturado.
            O resumo é voltado para a gerência comercial (Gislene e Luana) e diretoria.
            
            DIRETRIZES DO RESUMO:
            1. Traga uma consolidação de TODAS as conversas e interações do dia organizadas por ordem de horário.
            2. Traga um panorama geral de usabilidade (quantidade total de perguntas, perfil dos usuários/vendedores).
            3. Selecione e destaque as MELHORES perguntas técnicas (com maiores dúvidas, orçamentos gerados ou especificações mais inteligentes).
            4. Se houver relatórios ou dossiês gerados para envio ao cliente, garanta que qualquer recomendação apresentada seja impessoal e genérica (sem dirigir-se ao vendedor por nomes específicos como Yury ou Jeferson), facilitando o envio ao cliente final.
            5. Nas recomendações de equipamentos (como CMF 500, Feller CFTA, Garras R/GT), cite as especificações técnicas completas, incluindo a foto principal do equipamento e a quantidade e função de cada linha hidráulica necessária.
            
            INTERAÇÕES DO DIA (${targetDate}):
            ${JSON.stringify(questionsList, null, 2)}
            
            Retorne a resposta estruturada estritamente no formato JSON definido no schema.`;
            
          const response = await generateContentWithRetry(ai, {
            defaultModel: "gemini-3.5-flash",
            contents: [{ text: prompt }],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: { 
                    type: Type.STRING, 
                    description: "Texto consolidado em Markdown profissional com o resumo do dia." 
                  },
                  bestQuestions: {
                    type: Type.ARRAY,
                    description: "Lista das 3-5 melhores perguntas/dúvidas do dia.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        userName: { type: Type.STRING },
                        question: { type: Type.STRING },
                        outcome: { type: Type.STRING, description: "O desfecho, equipamento indicado ou resultado." }
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
              generatedAt: new Date().toISOString()
            };
            
            await db.collection('roder_ai_daily_summaries').doc(targetDate).set(summaryDoc);
            result = summaryDoc;
          } catch (e) {
            console.error("Failed to generate daily summary JSON response", rawText);
            throw new Error("Erro ao parsear o resumo diário estruturado da Roder IA.");
          }
          break;
        }

        case "analyzeBudget": {
          const { fileBase64, mimeType } = args;
          const prompt = `Analise este orçamento/proposta da RODER e extraia os itens conforme as seguintes regras de negócio:
            
            1. Identifique todos os PRODUTOS (equipamentos rurais/florestais).
            2. Identifique itens que NÃO são base de comissionamento: Kit hidráulico, Suporte, Acessórios.
            3. Para cada item, extraia: Nome, Código (se houver), Quantidade e Valor (se houver).
            
            Retorne um JSON contendo a lista dos itens, totalValue e observations.
            
            IMPORTANTE: Marque 'isCommissionable' como false se for Kit hidráulico, Suporte ou Acessórios.`;

          const safeMimeType = (mimeType || 'application/pdf').split(';')[0] || 'application/pdf';
          const response = await generateContentWithRetry(ai, {
            defaultModel: "gemini-3.5-flash",
            contents: [
              { text: prompt },
              { inlineData: { data: fileBase64, mimeType: safeMimeType } }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        code: { type: Type.STRING },
                        quantity: { type: Type.NUMBER },
                        price: { type: Type.NUMBER },
                        isCommissionable: { type: Type.BOOLEAN }
                      },
                      required: ["name", "code", "quantity", "price", "isCommissionable"]
                    }
                  },
                  totalValue: { type: Type.NUMBER },
                  observations: { type: Type.STRING }
                },
                required: ["items", "totalValue", "observations"]
              }
            }
          });

          const text = response.text || "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("JSON bruto não encontrado na resposta");
          result = JSON.parse(jsonMatch[0]);
          break;
        }

        case "scanStockPDF": {
          const { fileBase64 } = args;
          const prompt = `Você é um especialista em relatórios de estoque da Roder Máquinas e Roder Brasil.
            Sua tarefa é analisar este relatório de estoque e extrair TODOS os itens contidos nele.
            
            O relatório de estoque pode conter itens de diferentes filiais na mesma tabela (identificados pela primeira coluna "NOME EMPRESA") ou ser específico de uma filial.
            
            REGRAS DE CLASSIFICAÇÃO DE REGIONAL (FILIAL) E ORIGEM (SOURCE) POR ITEM:
            Analise cada item/linha do relatório. A primeira coluna indica "NOME EMPRESA" (ou similar):
            1. Se estiver escrito "Roder - Filial Sinop", "Roder - filial Sinop" ou "Sinop" na linha do item, classifique este item com:
               - branch: "sinop"
               - source: "sinop"
            2. Se estiver escrito "Roder Máquinas", "Roder Maquinas" ou referir-se à fábrica/matriz, classifique este item com:
               - branch: "matriz"
               - Classifique a origem (source) do item em um dos seguintes tipos conforme a descrição:
                 - 'fae': Se o item for da marca FAE (fresas, trituradores, RCU, UML, STC, SFM, etc.) ou rompedor hidráulico (Hammer, JSB, etc.).
                 - 'accessories': Se for suporte (suporte destocador, feller, rompedor, triturador), ponteira, engate rápido, etc.
                 - 'roder': Para garras florestais (R400, R600, R800, R1000, R280, R360, etc.), garras traçadoras (GT280, GT800, GT1000, GT600, etc.), pinças, destocadores, cabeçotes, etc.
            
            Sua tarefa técnica:
            1. Extraia 'code', 'description', 'quantity', 'branch' e 'source' de todos os itens da tabela.
            2. Substitua qualquer menção de "CHANFROL" ou "CHANFRO" por "FLORESTAL" na descrição (ex: 'GARRA SHANFROL' vira 'GARRA FLORESTAL').
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
                type: Type.OBJECT,
                properties: {
                  source: { 
                    type: Type.STRING,
                    description: "A origem padrão do estoque: roder | fae | accessories | sinop"
                  },
                  branch: { 
                    type: Type.STRING,
                    description: "A filial padrão correspondente: matriz | sinop"
                  },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        code: { type: Type.STRING },
                        description: { type: Type.STRING },
                        quantity: { type: Type.NUMBER },
                        branch: { type: Type.STRING, description: "Filial do item: matriz | sinop" },
                        source: { type: Type.STRING, description: "Origem do item: roder | fae | accessories | sinop" }
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
             result = { items: [], source: 'unknown', branch: 'matriz' };
          } else {
             const parsed = JSON.parse(jsonMatch[0]);
             result = {
               items: parsed.items || [],
               source: parsed.source || 'roder',
               branch: parsed.branch || 'matriz'
             };
          }
          break;
        }

        case "generateWhatsAppMessage": {
          const { leadData, fairName } = args;
          const prompt = `Você é o copiloto de vendas "Jefe Roder". Crie uma mensagem de WhatsApp persuasiva e profissional para um lead captado na feira ${fairName}.
            
            DADOS DO LEAD:
            Nome: ${leadData.name}
            Empresa: ${leadData.company || 'Não informada'}
            Interesses: ${leadData.products_of_interest || 'Equipamentos Roder'}
            Observações: ${leadData.ai_notes || leadData.remarks || ''}
            
            REGRAS DA MENSAGEM:
            1. Seja cordial e mencione que nos vimos na feira.
            2. Destaque um item de interesse.
            3. Convide para uma breve conversa ou envio de orçamento.
            4. Use emojis moderados.
            5. No final, coloque um placeholder [NOME DO VENDEDOR].
            
            Retorne apenas o texto da mensagem sugerida.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
          });
          result = response.text || "Olá! Foi um prazer conversar com você na feira.";
          break;
        }

        case "generateAISummary": {
          const { historyText, variant } = args;
          let prompt = "";
          if (variant === 'short') {
            prompt = `Resuma brevemente o andamento desta negociação em UMA ou DUAS frases curtas, focando no que falta para fechar o negócio.
            Histórico:
            ${historyText}`;
          } else {
            prompt = `Gere um RESUMO EXECUTIVO EXTREMAMENTE COMPACTO (máx 500 caracteres) em tópicos:
              • OBJETIVO: O que o cliente quer.
              • NEGOCIAÇÃO: Status e mudanças.
              • PONTO CHAVE: Valor ou detalhe crítico.
              • AÇÃO: Próximo passo.

              HISTÓRICO:
              ${historyText || "Sem histórico relevante."}`;
          }

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
          });
          result = response.text || "Sem resumo disponível.";
          break;
        }

        case "analyzeDetailedBudget": {
          const { fileBase64 } = args;
          const prompt = `Analise este pedido de venda/orçamento em PDF e extraia as seguintes informações:
          1. O valor total da venda/pedido (procurado em "Total Pedido", "Valor total com ajuste de frete" ou "Valor total").
          2. O nome/razão social do cliente ("Cliente"). Se tiver um código numérico antes (ex: "4235 - Eucazin Ltda"), extraia o código separado e limpe o nome.
          3. O prazo de entrega do pedido (procurado em "PRAZO DE ENTREGA" ou "data de entrega"), trazendo no formato DD/MM/YYYY (ex: "13/07/2026").
          4. O número do pedido de venda (e.g., procurado no título como "Pedido de Venda nº 9414"). Traga como inteiro ou texto limpo (ex: "9414").
          5. A data em que o pedido de venda foi feito/gerado (procurada na coluna ou rótulo "Data" na linha do cliente ou próximo à coluna endereço, ex: "28/05/2026"). Traga no formato de data DD/MM/YYYY.
          6. O CNPJ ou CPF do cliente (procurado em "CNPJ" ou "CPF/CNPJ", ex: "59.317.231/0001-76").
          7. O código do cliente (procurado na linha ou campo "Cliente" antes do nome ou em campo separado, ex: "4235").
          8. O apelido ou Nome Abreviado do cliente (procurado in "Apelido/Nome Abrev.", ex: "Eucazin Ltda").
          9. O e-mail de contato do cliente (procurado na linha de contato, ex: "financeiro@fazendadocarmo.com").
          10. O telefone ou celular do cliente (procurado na linha de contato ou telefone, ex: "62 9278-6496" ou "(14) 3161-5110").
          11. O endereço do cliente (procurado no campo "Endereço").
          12. A lista completa de todos os itens contidos na tabela de itens do pedido. Para cada item extraia:
             - O código do produto exatamente como está (ex: "1000.1484.0000" ou "9000.9000.9027").
             - A descrição ou nome do produto.
             - A quantidade (número).
             - O preço unitário (número).
          
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
                type: Type.OBJECT,
                properties: {
                  sale_value: { type: Type.NUMBER, description: "Total value of the budget/order" },
                  client_name: { type: Type.STRING, description: "Client's corporate or full name" },
                  delivery_date: { type: Type.STRING, description: "Delivery date strictly in DD/MM/YYYY format" },
                  order_number: { type: Type.STRING, description: "Sales order number extracted (e.g. 9414)" },
                  order_date: { type: Type.STRING, description: "Sales order generation date in DD/MM/YYYY format" },
                  client_cnpj: { type: Type.STRING, description: "Customer's CNPJ or CPF (e.g. 59.317.231/0001-76)" },
                  client_code: { type: Type.STRING, description: "Customer's code (e.g. 4235)" },
                  company_name: { type: Type.STRING, description: "Customer's short/abbreviated name (e.g. Eucazin Ltda)" },
                  client_email: { type: Type.STRING, description: "Customer's email (e.g. financeiro@fazendadocarmo.com)" },
                  client_phone: { type: Type.STRING, description: "Customer's phone / cellular (e.g. 62 9278-6496)" },
                  client_address: { type: Type.STRING, description: "Customer's complete address" },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        code: { type: Type.STRING, description: "Product code (e.g. 1000.1484.0000)" },
                        name: { type: Type.STRING, description: "Product description/name" },
                        quantity: { type: Type.NUMBER, description: "Exact quantity" },
                        unit_price: { type: Type.NUMBER, description: "Unit price of the product" }
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
          const prompt = `Analise esta Nota Fiscal e verifique se o valor total corresponde a R$ ${expectedValue.toLocaleString('pt-BR')}. Extraia o valor total e o número da nota. Responda apenas em JSON puro: { "total": number, "nf_number": "string", "matches": boolean }`;

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
          const prompt = "Extraia os dados deste cartão de visita para JSON. Campos: name (nome da pessoa), email, phone (telefone), company (empresa), cnpj. Se não encontrar um campo, deixe-o vazio. Retorne APENAS o JSON puro, sem explicações.";

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
          const prompt = `Você é um assistente da Roder Brasil. Organize o seguinte texto transcrito de uma conversa com um cliente na feira.
            O objetivo é facilitar o trabalho do vendedor interno (Roger) que enviará o orçamento.
            
            TEXTO TRANSCRITO:
            "${textToRefine}"
            
            ESTRUTURA DESEJADA:
            • SISTEMA DE OPERAÇÃO/MÁQUINA ATUAL: (Como o cliente opera hoje, quais máquinas possui)
            • EQUIPAMENTOS RODER DE INTERESSE: (O que ele quer comprar da Roder e para qual aplicação)
            • DETALHES TÉCNICOS ESPECÍFICOS: (Medidas, vazão hidráulica, modelo da máquina base, etc)
            • OBSERVAÇÕES PARA O COMERCIAL: (Urgência, prazos, condições ou recados para o Roger)
            
            REGRAS:
            1. Seja extremamente organizou e profissional.
            2. Remova gagueiras, repetições de palavras e vícios de linguagem do texto original.
            3. Se o texto original for muito curto ou simples, transforme em um relatório executivo de 2 ou 3 linhas.
            4. Use termos técnicos corretamente (ex: Garra, Rotor, Triturador).
            5. Retorne apenas o texto estruturado em tópicos, pronto para leitura técnica.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
          });
          result = response.text?.trim() || textToRefine;
          break;
        }

        case "generateAIInsight": {
          const { context } = args;
          const prompt = `Analise os resultados desta feira e forneça um relatório executivo de ROI e performance.
            
            DADOS DA FEIRA:
            Nome: ${context.fairName}
            Investimento Total: R$ ${context.investment}
            Despesas: ${context.expenses}
            Total de Leads: ${context.leadsCount}
            Perfil dos Leads: ${JSON.stringify(context.profiles)}
            Qualidade (IA Score): ${JSON.stringify(context.quality)}
            
            GERE UM TEXTO ESTRUTURADO EM:
            1. Resumo da Performance
            2. Cálculo Estimado de ROI (baseado na qualidade dos leads)
            3. Pontos Fortes e Fracos
            4. Sugestões Estratégicas para a próxima feira.
            
            Retorne o texto formatado em Markdown.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
          });
          result = response.text || "Não foi possível gerar a análise.";
          break;
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

      return res.json({ success: true, result });
    } catch (error: any) {
      console.error(`[API Gemini] Error executing action: ${req.body?.action || 'unknown'}`, error);
      return res.status(500).json({ error: error.message || "Erro ao executar processamento de IA." });
    }
  });

  // Monday.com Board/Spreadsheet OCR Analysis
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

      // Extract raw base64 data if it contains the data uri header, e.g. "data:image/png;base64,..."
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
          "Você é um assistente especialista da Roder que lê tabelas de listas de importação do Monday.com. " +
          "Sua tarefa é extrair as linhas de equipamentos importados da imagem. " +
          "Extraia as seguintes informações de cada linha como um array de objetos JSON: \n" +
          "1. 'code' (código ou ref do equipamento, de preferência o padrão Roder se houver. Deixe como string vazia se não puder ler)\n" +
          "2. 'description' (a descrição legível do item da importação, p. ex. 'FAE UML/S/EX/VT-125')\n" +
          "3. 'quantity' (quantidade física ou itens para importar, deve ser número)\n" +
          "4. 'embarque' (data de embarque formatada p. ex. '20 abr, 2026' ou '12 out, 2026' ou '-'. Use abreviação legível em português se possível, ou retorne '-' se não houver)\n" +
          "5. 'chegada' (a previsão de chegada ou data prevista formatada p. ex. '20 jun, 2026' ou '19 dez, 2026' ou '-'. Use abreviação legível em português se possível, ou retorne '-' se não houver)\n" +
          "Seja preciso e extraia tudo que puder ler com segurança."
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
    } catch (error: any) {
      console.error("[OCR-MONDAY] Error processing sheet image:", error);
      return res.status(500).json({ error: error.message || "Erro interno ao processar imagem." });
    }
  });

  // Configure multer storage
  const upload = multer({ storage: multer.memoryStorage() });

  // PDF Financial Reports Parsing Route with automatic missing files detection
  app.post("/api/financeiro/parse-pdf", upload.array("files"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Nenhum arquivo enviado." });
      }

      console.log(`[FINANCE-PARSER] Received ${files.length} PDF files for parsing.`);
      const ai = getGenAI();
      if (!ai) {
        return res.status(500).json({ error: "O cliente da API Gemini não foi inicializado no servidor. Por favor, adicione a sua chave 'GEMINI_API_KEY' na aba Settings > Secrets do seu painel do AI Studio para que as chamadas funcionem." });
      }

      // 1. Read files and extract text using pdf-parse PDFParse class, with deduplication checks
      const parsedFiles: { filename: string; text: string }[] = [];
      const seenTexts = new Set<string>();
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
        } catch (pdfErr: any) {
          console.error(`Error parsing PDF file ${file.originalname}:`, pdfErr);
        }
      }

      if (parsedFiles.length === 0) {
        return res.status(400).json({ error: "Nenhum arquivo PDF pôde ser extraído." });
      }

      // 2. Ask Gemini to identify the date and extract all KPIs for both Matriz (Roder Máquinas) and Filial (Sinop).
      const prompt = `Você é um analista financeiro sênior e especialista da Roder Brasil.
Seu trabalho é processar relatórios em formato de texto extraídos de arquivos PDF de controle financeiro mensal da Matriz ("Roder Máquinas" ou "Fábrica") e da Filial ("Sinop" ou "Filial").

REGRAS GERAIS DE NEGÓCIO:
- Identifique o ANO (format: YYYY) e MÊS (número de 1 a 12) a partir do cabeçalho dos relatórios. Todos os relatórios devem pertencer ao mesmo período. No JSON retorne "year" e "month" e "monthId" no formato "YYYY-MM" (por exemplo, "2026-05").
- O pacote mensal ideal deve conter 20 relatórios divididos entre Matriz e Filial:
  • Receita Sintético - Matriz ("Roder Máquinas")
  • Receita Sintético - Filial ("Sinop" ou "Filial")
  • Despesas Fixas - Matriz
  • Despesas Fixas - Filial
  • Despesas Variáveis - Matriz
  • Despesas Variáveis - Filial
  • EBITDA - Matriz
  • EBITDA - Filial
  • Geração de Caixa (NCC) - Matriz
  • Geração de Caixa (NCC) - Filial
  • Lucratividade Líquida - Matriz
  • Lucratividade Líquida - Filial
  • Margem de Contribuição - Matriz
  • Margem de Contribuição - Filial
  • Ponto de Equilíbrio - Matriz
  • Ponto de Equilíbrio - Filial
  • Resultado Líquido - Matriz
  • Resultado Líquido - Filial
  • Resultado Operacional de Caixa - Matriz
  • Resultado Operacional de Caixa - Filial
- Compare o conjunto de textos fornecidos com os 20 relatórios esperados e preencha uma lista "filesUploaded" com as descrições dos relatórios que de fato encontrou, e "missingFiles" com o título amigável dos relatórios que estão faltando se houver (por exemplo, "EBITDA - Filial" ou "Despesas Fixas - Matriz").

VALORES DOS KPIs ESPERADOS PARA EXTRAÇÃO:
Para a Matriz ("matriz") e a Filial ("filial"), extraia os seguintes KPIs caso existam nos relatórios. Mantenha os valores como números (Float):
- "faturamento": O faturamento total ou total de receitas brutas (se houver relatório de Receitas ou Emissão de Notas).
- "receita_liquida": Receita após deduções primárias (no relatório de Lucratividade, EBITDA ou Margem de contribuição).
- "margem_liquida": Margem de lucro líquida em percentual (geralmente nos relatórios de Lucratividade Líquida).
- "resultado_liquido": O valor monetário final de lucro líquido (geralmente no relatório de Resultado Líquido).
- "lucro_bruto": Lucro bruto monetário (Receitas - Custos Diretos/CMV).
- "rentabilidade": Taxa de rentabilidade em percentual (geralmente sob rentabilidade ou lucratividade líquida).
- "ponto_equilibrio": Valor monetário para ponto de equilíbrio (geralmente no relatório de Ponto de Equilíbrio).
- "ebitda": Valor monetário do EBITDA (no relatório de EBITDA).
- "margem_ebitda": Margem EBITDA em percentual (geralmente de 0 a 100).
- "lucro_liquido": Lucro líquido absoluto.
- "margem_bruta": Margem Bruta em percentual.
- "fluxo_caixa_operacional": Saldo operacional de caixa ou Resultado Operacional de Caixa (no relatório de Resultado Operacional de Caixa).
- "saldo_caixa": Saldo acumulado em caixa no mês (ex: do Geração de Caixa ou Resultado Operacional de Caixa, tipo item "1 - Caixa").
- "geracao_caixa_ncc": Valor da Geração de Caixa - NCC (do relatório de Geração de Caixa NCC).
- "capacidade_gerar_lucro": Percentual de Capacidade de Gerar Lucro.
- "lucro_operacional": Lucro Operacional monetário.
- "margem_contribuicao": Margem de Contribuição em percentual.
- "capital_giro": Valor monetário para Capital de Giro.
- "pmr": Prazo Médio de Recebimento em dias (se houver, senão calcule ou use um valor padrão como 45 se houver menção, ou 0).
- "pmp": Prazo Médio de Pagamento em dias (se houver, senão use padrão como 30 se houver menção, ou 0).
- "indice_inadimplencia": Índice de inadimplência em percentual.
- "liquidez_corrente": Índice de liquidez corrente (Ex: Ativo / Passivo or calculated).

CÁLCULO DE VALORES FALTANTES:
Se algum valor não puder ser encontrado diretamente mas os valores brutos para calculá-lo existirem, realize o cálculo apropriado. Se não houver dados, retorne null.

CONSOLIDAÇÃO ("consolidado"):
Calcule e consolide os valores da Matriz e Filial para preencher a estrutura "consolidado":
- KPIs absolutos monetários (Faturamento, Receita Líquida, Resultado Líquido, Lucro Bruto, EBITDA, Saldo de Caixa, Fluxo de Caixa Operacional, etc.) devem ser a soma exata: Matriz + Filial.
- KPIs percentuais (Margem Líquida, Rentabilidade, Margem EBITDA, Margem de Contribuição, Margem Bruta) devem ser recalculados proporcionalmente com base nos consolidados absolutos. Por exemplo, Margem EBITDA Consolidada = (EBITDA Consolidado / Receita Líquida Consolidada) * 100.

POR FAVOR, RETORNE UM JSON DE ACORDO COM O SCHEMATYPE DEFINIDO.`;

      const gResponse = await generateContentWithRetry(ai, {
        defaultModel: "gemini-3.5-flash",
        contents: [
          { text: prompt },
          { text: `TEXTOS DOS ARQUIVOS PDF CARREGADOS:\n\n${JSON.stringify(parsedFiles, null, 2)}` }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              monthId: { type: Type.STRING },
              year: { type: Type.INTEGER },
              month: { type: Type.INTEGER },
              filesUploaded: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              missingFiles: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              matriz: {
                type: Type.OBJECT,
                properties: {
                  faturamento: { type: Type.NUMBER },
                  receita_liquida: { type: Type.NUMBER },
                  margem_liquida: { type: Type.NUMBER },
                  resultado_liquido: { type: Type.NUMBER },
                  lucro_bruto: { type: Type.NUMBER },
                  rentabilidade: { type: Type.NUMBER },
                  ponto_equilibrio: { type: Type.NUMBER },
                  ebitda: { type: Type.NUMBER },
                  margem_ebitda: { type: Type.NUMBER },
                  lucro_liquido: { type: Type.NUMBER },
                  margem_bruta: { type: Type.NUMBER },
                  fluxo_caixa_operacional: { type: Type.NUMBER },
                  saldo_caixa: { type: Type.NUMBER },
                  geracao_caixa_ncc: { type: Type.NUMBER },
                  capacidade_gerar_lucro: { type: Type.NUMBER },
                  lucro_operacional: { type: Type.NUMBER },
                  margem_contribuicao: { type: Type.NUMBER },
                  capital_giro: { type: Type.NUMBER },
                  pmr: { type: Type.NUMBER },
                  pmp: { type: Type.NUMBER },
                  indice_inadimplencia: { type: Type.NUMBER },
                  liquidez_corrente: { type: Type.NUMBER }
                }
              },
              filial: {
                type: Type.OBJECT,
                properties: {
                  faturamento: { type: Type.NUMBER },
                  receita_liquida: { type: Type.NUMBER },
                  margem_liquida: { type: Type.NUMBER },
                  resultado_liquido: { type: Type.NUMBER },
                  lucro_bruto: { type: Type.NUMBER },
                  rentabilidade: { type: Type.NUMBER },
                  ponto_equilibrio: { type: Type.NUMBER },
                  ebitda: { type: Type.NUMBER },
                  margem_ebitda: { type: Type.NUMBER },
                  lucro_liquido: { type: Type.NUMBER },
                  margem_bruta: { type: Type.NUMBER },
                  fluxo_caixa_operacional: { type: Type.NUMBER },
                  saldo_caixa: { type: Type.NUMBER },
                  geracao_caixa_ncc: { type: Type.NUMBER },
                  capacidade_gerar_lucro: { type: Type.NUMBER },
                  lucro_operacional: { type: Type.NUMBER },
                  margem_contribuicao: { type: Type.NUMBER },
                  capital_giro: { type: Type.NUMBER },
                  pmr: { type: Type.NUMBER },
                  pmp: { type: Type.NUMBER },
                  indice_inadimplencia: { type: Type.NUMBER },
                  liquidez_corrente: { type: Type.NUMBER }
                }
              },
              consolidado: {
                type: Type.OBJECT,
                properties: {
                  faturamento: { type: Type.NUMBER },
                  receita_liquida: { type: Type.NUMBER },
                  margem_liquida: { type: Type.NUMBER },
                  resultado_liquido: { type: Type.NUMBER },
                  lucro_bruto: { type: Type.NUMBER },
                  rentabilidade: { type: Type.NUMBER },
                  ponto_equilibrio: { type: Type.NUMBER },
                  ebitda: { type: Type.NUMBER },
                  margem_ebitda: { type: Type.NUMBER },
                  lucro_liquido: { type: Type.NUMBER },
                  margem_bruta: { type: Type.NUMBER },
                  fluxo_caixa_operacional: { type: Type.NUMBER },
                  saldo_caixa: { type: Type.NUMBER },
                  geracao_caixa_ncc: { type: Type.NUMBER },
                  capacidade_gerar_lucro: { type: Type.NUMBER },
                  lucro_operacional: { type: Type.NUMBER },
                  margem_contribuicao: { type: Type.NUMBER },
                  capital_giro: { type: Type.NUMBER },
                  pmr: { type: Type.NUMBER },
                  pmp: { type: Type.NUMBER },
                  indice_inadimplencia: { type: Type.NUMBER },
                  liquidez_corrente: { type: Type.NUMBER }
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

    } catch (error: any) {
      console.error("[FINANCE-PARSER] Error during PDF ingestion:", error);
      return res.status(500).json({ error: error.message || "Falha ao processar arquivos do demonstrativo financeiro." });
    }
  });

  // AI Financial Diagnose API
  app.post("/api/financeiro/diagnose", async (req, res) => {
    try {
      const { current, history, entity } = req.body;
      if (!current) {
        return res.status(400).json({ error: "O demonstrativo do período atual é obrigatório para diagnóstico." });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(500).json({ error: "A chave da API Gemini não está configurada no servidor. Por favor, configure a chave 'GEMINI_API_KEY' na aba Settings > Secrets do seu painel do AI Studio para que as chamadas funcionem." });
      }

      const targetEntity = entity || "consolidado";
      const currentMonthData = current[targetEntity] || {};
      
      const prompt = `Você é o Diretor Financeiro (CFO) Inteligente e Consultor Executivo da RODER Brasil, especialista em diagnósticos financeiros de alto nível para indústrias de equipamentos florestais e agro.
Analise com extrema atenção e rigor os indicadores fornecidos para a entidade "${targetEntity}" do período ${current.monthId}.

DADOS FINANCEIROS ATUAIS (${current.monthId} - ${targetEntity}):
${JSON.stringify(currentMonthData, null, 2)}

DADOS HISTÓRICOS (Múltiplos períodos ordenados cronologicamente):
${JSON.stringify((history || []).map((h: any) => ({ monthId: h.monthId, data: h[targetEntity] })), null, 2)}

SUAS TAREFAS:
1. Avalie a saúde econômica geral da empresa com base em faturamento, receita líquida, lucratividade/margem líquida, EBITDA, saldo de caixa e fluxo de caixa operacional. Classifique em: "Saudável" (todos principais saudáveis), "Atenção" (algum sinalizador que expõe a empresa a médio prazo), ou "Crítico" (riscos severos de caixa, margem líquida negativa severa ou alto endividamento silencioso).
2. Forneça um título executivo dinâmico e impactante para o painel de apresentação do CFO.
3. Elabore um Resumo Executivo detalhado (3 a 5 linhas) explicando a performance financeira e os fatores mais pós-venda fundamentais para o resultado (ex: compressão de custos, melhoria de vendas, descasamento entre PMR/PMP, ou estabilidade).
4. Indique de 2 a 3 pontos fortes e de 2 a 3 pontos de atenção urgentes.
5. Indique de 3 a 4 sugestões acionáveis, explicando o que deve ser feito e o impacto estratégico ou retorno financeiro esperado.

Por favor, gere e ordene tudo de forma que faça total sentido real de mercado para uma indústria real. Retorne a resposta em formato JSON estrito em língua Portuguesa de acordo com o esquema definido.`;

      const gResponse = await generateContentWithRetry(ai, {
        defaultModel: "gemini-3.5-flash",
        contents: [
          { text: prompt }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              financialHealth: { type: Type.STRING },
              healthCheckTitle: { type: Type.STRING },
              summary: { type: Type.STRING },
              strengths: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    desc: { type: Type.STRING }
                  },
                  required: ["title", "desc"]
                }
              },
              alerts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    desc: { type: Type.STRING }
                  },
                  required: ["title", "desc"]
                }
              },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING },
                    impact: { type: Type.STRING }
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

    } catch (error: any) {
      console.error("[CFO-DIAGNOSE] Error generating financial diagnostic:", error);
      return res.status(500).json({ error: error.message || "Falha ao gerar diagnóstico financeiro inteligente." });
    }
  });

  // Admin Auth API - Set Password Manually
  app.post("/api/admin/set-user-password", async (req, res) => {
    const { email, password, token } = req.body;
    console.log(`[AUTH-ADMIN] Request to set password for: ${email}`);
    
    if (!email || !password || !token) {
      console.error("[AUTH-ADMIN] Missing parameters");
      return res.status(400).json({ error: "E-mail, senha e token são obrigatórios." });
    }
    
    try {
      // 1. Verify the requester is an admin
      console.log("[AUTH-ADMIN] Verifying admin token...");
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (tokenErr: any) {
        console.error("[AUTH-ADMIN] Token verification failed:", tokenErr.message);
        return res.status(401).json({ error: "Token de autenticação inválido ou expirado." });
      }
      
      const requesterUid = decodedToken.uid;
      console.log(`[AUTH-ADMIN] Requester UID: ${requesterUid}`);
      
      let requesterData;
      try {
        const requesterDoc = await db.collection('users').doc(requesterUid).get();
        requesterData = requesterDoc.data();
      } catch (dbErr: any) {
        console.error("[AUTH-ADMIN] Database error fetching requester:", dbErr.message);
        // Fallback check for super admins if DB fails
      }
      
      const isAdmin = requesterData?.role === 'admin' || 
                      requesterData?.role === 'manager' ||
                      requesterData?.role === 'triagem' ||
                      requesterData?.email === 'roderbrasil@gmail.com' || 
                      requesterData?.email === 'roderindica@gmail.com' ||
                      decodedToken.email === 'roderbrasil@gmail.com' ||
                      decodedToken.email === 'roderindica@gmail.com';
      
      if (!isAdmin) {
        console.warn(`[AUTH-ADMIN] Access denied for ${requesterData?.email || decodedToken.email || requesterUid}`);
        return res.status(403).json({ error: "Acesso negado. Administradores e Gestores podem definir senhas." });
      }

      // 2. Find or create the user in Firebase Auth
      console.log(`[AUTH-ADMIN] Target Email: ${email}`);
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
        console.log(`[AUTH-ADMIN] User found (UID: ${userRecord.uid}). Updating password...`);
        // Update existing user
        await admin.auth().updateUser(userRecord.uid, {
          password: password
        });
        console.log(`[AUTH-ADMIN] Password updated successfully for ${email}`);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          console.log(`[AUTH-ADMIN] User not found in Auth. Creating new record for ${email}`);
          // Create new user if they don't exist in Auth (but might exist in Firestore)
          userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            emailVerified: true
          });
          console.log(`[AUTH-ADMIN] User created successfully with password: ${email}`);
        } else {
          console.error("[AUTH-ADMIN] Firebase Admin error during user fetch/update:", err);
          throw err;
        }
      }

      return res.json({ success: true, message: `Senha definida com sucesso para ${email}.` });
    } catch (err: any) {
      console.error("[AUTH-ADMIN] FATAL ERROR:", err);
      // Return a more descriptive error if it's a known Auth error
      const errorMessage = err.message || "Erro desconhecido ao processar senha.";
      return res.status(500).json({ error: errorMessage, code: err.code });
    }
  });

  let hasDist = false;
  let distPath = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(path.resolve(distPath, 'index.html'))) {
    hasDist = true;
  } else if (fs.existsSync(path.resolve(__dirname, 'index.html'))) {
    distPath = __dirname;
    hasDist = true;
  } else if (fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'))) {
    distPath = path.resolve(__dirname, 'dist');
    hasDist = true;
  }

  if (process.env.NODE_ENV !== "production" || !hasDist) {
    if (!hasDist && process.env.NODE_ENV === "production") {
      console.warn("⚠️ [HOSTINGER / PRODUCTION]: 'dist/index.html' não encontrado. Ativando servidor de assets dinâmico Vite como fallback automático...");
    } else {
      console.log("Starting in DEVELOPMENT mode");
    }
    
    // Inject self-destructing service workers in dev mode to clear any active caches immediately
    app.get(["/sw.js", "/service-worker.js"], (req, res) => {
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.send(`
        self.addEventListener('install', function(e) {
          self.skipWaiting();
        });
        self.addEventListener('activate', function(e) {
          self.registration.unregister()
            .then(function() {
              return self.clients.matchAll();
            })
            .then(function(clients) {
              clients.forEach(function(client) {
                if (client.url && 'navigate' in client) {
                  client.navigate(client.url);
                }
              });
            });
        });
      `);
    });

    app.get("/registerSW.js", (req, res) => {
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.send(`console.log('registerSW mock in development');`);
    });

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(`Starting in PRODUCTION mode. Serving static files from: ${distPath}`);
    
    // Serve static files
    app.use(express.static(distPath));
    
    // Fallback to index.html for SPA routing
    app.get('*', (req, res) => {
      console.log(`Fallback triggered for: ${req.url}`);
      const indexPath = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Artefatos de compilação não encontrados. Por favor, execute 'npm run build'.");
      }
    });
  }

  // --- Scheduled Reports Logic ---
  
  const BR_TIMEZONE = 'America/Sao_Paulo';
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  async function getEmailTransporter() {
    const settingsSnap = await db.collection('settings').doc('email').get();
    if (!settingsSnap.exists) return null;
    const settings = settingsSnap.data();
    if (settings?.provider !== 'gmail' || !settings.user || !settings.pass) return null;

    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: settings.user,
        pass: settings.pass.replace(/\s/g, '')
      }
    });
  }

  async function sendAutomaticEmail(to: string, subject: string, html: string) {
    const transporter = await getEmailTransporter();
    if (!transporter) return;
    
    // Get sender email from settings
    const settingsSnap = await db.collection('settings').doc('email').get();
    const settings = settingsSnap.data();
    const user = settings?.user;

    await transporter.sendMail({
      from: `"Roder Sistema" <${user}>`,
      to,
      subject,
      html: `${html}<div style="margin-top:30px; font-size:10px; color:#999; border-top:1px solid #eee; padding-top:10px;">Enviado automaticamente pelo Sistema Roder Indica V2</div>`
    });
  }

  // Daily Fair Leads Report at 20:00 Brasília Time (UTC-3)
  // Cron: '0 20 * * *' with 'America/Sao_Paulo' timezone
  cron.schedule('0 20 * * *', async () => {
    console.log("[Schedule] Checking for Active Fairs to send daily reports (20h Brasília)...");
    try {
      const now = new Date();
      
      // Get active fairs based on date logic
      const fairsSnap = await db.collection('fairs')
        .where('status', '==', 'active')
        .get();

      const activeFairs = fairsSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(fair => {
          const start = new Date(fair.start_date);
          const end = new Date(fair.end_date);
          
          // Fair is active 3 days before start and 3 days after end
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
        // Get all leads for this fair
        const leadsSnap = await db.collection('fair_leads')
          .where('fair_id', '==', fair.id)
          .get();

        const leads = leadsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (leads.length === 0) {
          console.log(`[Schedule] No leads found for fair: ${fair.name}`);
          continue;
        }

        // Recipients
        const recipients = [
          'luana@roderbrasil.com.br',
          'gislene@roderbrasil.com.br',
          'roderbrasil@gmail.com'
        ];

        // Build HTML Report (Spreadsheet style)
        let html = `
          <div style="font-family: sans-serif; color: #333; max-width: 1000px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder" style="height: 40px;">
              <h1 style="color: #22c55e; margin: 10px 0;">Relatório Diário de Leads - ${fair.name}</h1>
              <p style="color: #666; font-size: 14px;">Data do Relatório: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { timeZone: BR_TIMEZONE })}</p>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-around; text-align: center;">
              <div>
                <p style="margin: 0; font-size: 14px; color: #166534; font-weight: bold;">TOTAL DE LEADS</p>
                <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: 900; color: #166534;">${leads.length}</p>
              </div>
              <div>
                <p style="margin: 0; font-size: 14px; color: #991b1b; font-weight: bold;">LEADS QUENTES</p>
                <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: 900; color: #991b1b;">${leads.filter(l => l.ai_score === 'hot').length}</p>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #22c55e; color: white;">
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Data</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Lead / Empresa</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Contato</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Produtos de Interesse</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Observações</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Vendedor</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Temp.</th>
                </tr>
              </thead>
              <tbody>
                ${leads.map(lead => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${new Date(lead.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>${lead.name}</strong><br><small style="color: #666;">${lead.company || '-'}</small></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${lead.phone || '-'}<br><small style="color: #666;">${lead.email || '-'}</small></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${(lead.interest_products || []).join(', ') || 'Geral'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; font-style: italic; color: #666;">${lead.observations || '-'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${lead.salesperson_name || 'Anônimo'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
                      <span style="display: inline-block; padding: 2px 6px; border-radius: 10px; background: ${lead.ai_score === 'hot' ? '#fee2e2' : '#fef3c7'}; color: ${lead.ai_score === 'hot' ? '#991b1b' : '#92400e'}; font-weight: bold; font-size: 10px;">
                        ${lead.ai_score === 'hot' ? 'QUENTE' : 'MORNO'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="margin-top: 30px; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
              <p style="margin: 0; font-size: 13px; color: #64748b;">
                * Este relatório é exportável em PDF através do painel da feira no sistema Roder Indica V2.
                Para triagem individual, acesse: <a href="https://roder-indica.web.app/fairs/${fair.id}" style="color: #22c55e;">Painel da Feira</a>
              </p>
            </div>
          </div>
        `;

        for (const email of recipients) {
          await sendAutomaticEmail(email, `PLANILHA LEADS - ${fair.name} - ${now.toLocaleDateString('pt-BR')}`, html);
          console.log(`[Schedule] Daily fair report sent to ${email} for fair ${fair.name}`);
        }
      }
    } catch (err) {
      console.error("[Schedule] Error in Daily Fair Reports:", err);
    }
  }, {
    timezone: BR_TIMEZONE
  });

  // Day 1: Monthly Sales Report (Managers/Directors/Finance)
  cron.schedule('0 8 1 * *', async () => {
    console.log("[Schedule] Generating Day 1 Monthly Reports...");
    const notifSnap = await db.collection('settings').doc('notifications').get();
    const notif = notifSnap.data();
    if (!notif?.monthly_report_directors) return;

    // Previous Month Range
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const indicationsSnap = await db.collection('indications')
      .where('status', '==', 'sold')
      .get();

    const negotiatingSnap = await db.collection('indications')
      .where('status', '==', 'negotiating')
      .get();
    
    const monthlySales = indicationsSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(d => {
        if (!d.updated_at) return false;
        const date = new Date(d.updated_at);
        return date >= lastMonth && date <= endOfLastMonth;
      });

    const activeNegotiations = negotiatingSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(d => {
        if (!d.budget_date) return false;
        const budgetDate = new Date(d.budget_date);
        const daysOld = (now.getTime() - budgetDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysOld <= 60; // Proteção de 60 dias
      });

    if (monthlySales.length === 0 && activeNegotiations.length === 0) return;

    // Calculations
    const totalSalesValue = monthlySales.reduce((acc, curr) => acc + (curr.sale_value || 0), 0);
    const totalCommissions = monthlySales.reduce((acc, curr) => acc + (curr.commission_value || 0), 0);
    const totalNegotiatingValue = activeNegotiations.reduce((acc, curr) => acc + (curr.sale_value || 0), 0);
    
    // Group by Seller for Efficiency and Ranking
    const sellersMap: any = {};
    monthlySales.forEach(sale => {
      const sid = sale.external_seller_uid;
      if (!sellersMap[sid]) {
        sellersMap[sid] = { name: sale.external_seller_name, count: 0, total: 0, commissions: 0, saleTimes: [] };
      }
      sellersMap[sid].count++;
      sellersMap[sid].total += (sale.sale_value || 0);
      sellersMap[sid].commissions += (sale.commission_value || 0);
      
      if (sale.created_at && sale.updated_at) {
        const t = (new Date(sale.updated_at).getTime() - new Date(sale.created_at).getTime()) / (1000 * 60 * 60 * 24);
        sellersMap[sid].saleTimes.push(t);
      }
    });

    const sellersRanking = Object.entries(sellersMap).map(([uid, data]: [string, any]) => ({
      uid,
      ...data
    })).sort((a: any, b: any) => b.total - a.total);

    // Build Email HTML
    const monthName = lastMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    let html = `
      <div style="font-family: sans-serif; color: #333; max-width: 900px;">
        <h1 style="color: #eab308; border-bottom: 2px solid #eab308; padding-bottom: 10px;">Relatório de Vendas - ${monthName}</h1>
        
        <div style="display: flex; gap: 20px; margin: 20px 0;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">VENDAS TOTAIS (NF)</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #eab308;">${formatCurrency(totalSalesValue)}</p>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">EM NEGOCIAÇÃO (ABERTO)</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #3b82f6;">${formatCurrency(totalNegotiatingValue)}</p>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">COMISSÕES À PAGAR</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #0f172a;">${formatCurrency(totalCommissions)}</p>
          </div>
        </div>

        <h2 style="font-size: 18px; margin-top: 30px;">Destaques por Vendedor</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Vendedor</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Vendas</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">T. Médio (Dias)</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Valor Total (NF)</th>
            </tr>
          </thead>
          <tbody>
            ${sellersRanking.map((s: any) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${s.name}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${s.count}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${s.saleTimes.length > 0 ? (s.saleTimes.reduce((a:any, b:any) => a+b, 0) / s.saleTimes.length).toFixed(1) : 'N/A'}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${formatCurrency(s.total)}</td>
              </tr>
            `).join('')}
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
            ${monthlySales.map((sale: any) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.client_name}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.product_name}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.external_seller_name || '-'}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.internal_seller_name || '-'}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatCurrency(sale.sale_value || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2 style="font-size: 18px; margin-top: 40px; color: #3b82f6;">Orçamentos em Aberto (Válidos)</h2>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">Estas negociações ainda estão dentro do prazo de 60 dias e são prioridade para reuniões de acompanhamento.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
          <thead>
            <tr style="background: #eff6ff; text-align: left;">
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Cliente</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Equipamento</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Interno</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Enviado em</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Validade</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Previsão</th>
            </tr>
          </thead>
          <tbody>
            ${activeNegotiations.map((neg: any) => {
              const bDate = new Date(neg.budget_date);
              const daysLeft = 60 - Math.floor((now.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
              return `
                <tr>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${neg.client_name}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${neg.product_name}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${neg.internal_seller_name || '-'}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${bDate.toLocaleDateString('pt-BR')}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; color: ${daysLeft <= 5 ? '#ef4444' : '#64748b'}; font-weight: bold;">
                    ${daysLeft} dias
                  </td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatCurrency(neg.sale_value || 0)}</td>
                </tr>
              `;
            }).join('')}
            ${activeNegotiations.length === 0 ? '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #94a3b8;">Nenhuma negociação ativa no momento.</td></tr>' : ''}
          </tbody>
        </table>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Este relatório contém valores reais de nota fiscal para fins gerenciais.
        </p>
      </div>
    `;

    // Send to Managers, Directors and Admin
    const recipients = [
      ...(notif.manager_emails ? notif.manager_emails.split(',').map((e:string) => e.trim()) : []),
      ...(notif.director_emails ? notif.director_emails.split(',').map((e:string) => e.trim()) : []),
    ].filter(e => e !== '');

    for (const email of recipients) {
      await sendAutomaticEmail(email, `Relatório de Vendas Roder - ${monthName}`, html);
    }

    // Prepare Finance summary emails (Financeiro, Novo Financeiro Vanessa, and Admin Jeferson)
    const financeEmails = [
      'financeiro@roderbrasil.com.br',
      'financeiro2@roderbrasil.com.br',
      'jeferson@roderbrasil.com.br'
    ];
    if (notif.finance_email) {
      const customEmails = String(notif.finance_email).split(',').map((e: string) => e.trim()).filter((e: string) => e !== '');
      customEmails.forEach((email: string) => {
        if (!financeEmails.map(x => x.toLowerCase()).includes(email.toLowerCase())) {
          financeEmails.push(email);
        }
      });
    }

    // Fetch bank details for each seller in the ranking
    const detailedSellers = await Promise.all(sellersRanking.map(async (s: any) => {
      if (!s.uid) return { ...s, pix_key: '-', bank_info: { bank: '-', agency: '-', account: '-' } };
      
      const userDoc = await db.collection('users').doc(s.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data() || {};
        return {
          ...s,
          pix_key: userData.pix_key || 'Não informado',
          bank_info: userData.bank_info || { bank: '-', agency: '-', account: '-' }
        };
      }
      return { ...s, pix_key: '-', bank_info: { bank: '-', agency: '-', account: '-' } };
    }));

    const financeHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 900px;">
        <h1 style="color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">Previsão de Pagamentos - ${monthName}</h1>
        <p>O valor total de comissões para as vendas de <strong>${monthName}</strong> é de: <strong style="font-size: 18px; color: #eab308;">${formatCurrency(totalCommissions)}</strong>.</p>
        <p>Abaixo seguem os detalhes de cada vendedor e suas respectivas informações bancárias para processamento do pagamento.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Vendedor</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Comissão</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Chave PIX</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Dados Bancários</th>
            </tr>
          </thead>
          <tbody>
            ${detailedSellers.map((s: any) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${s.name}</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${formatCurrency(s.commissions)}</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #666;">${s.pix_key}</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-size: 11px; color: #666;">
                  ${s.bank_info?.bank ? `Bco: ${s.bank_info.bank}<br>Ag: ${s.bank_info.agency}<br>Cc: ${s.bank_info.account}` : 'N/A'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2 style="font-size: 16px; margin-top: 35px; border-bottom: 2px solid #0f172a; padding-bottom: 5px; color: #0f172a; font-weight: bold;">Detalhamento das Indicações Faturadas no Mês (Roder Indica)</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Cliente</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Parceiro Indicador</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Equipamento(s)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Valor Venda (R$)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Base Comissionável (R$)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Alíquota (%)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Comissão (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${monthlySales.map((sale: any) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.client_name || "Não informado"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.external_seller_name || "-"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.product_name || "-"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(sale.sale_value || 0)}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatCurrency(sale.base_commission_value || 0)}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${sale.commission_rate_applied || 5}%</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #16a34a;">${formatCurrency(sale.commission_value || 0)}</td>
              </tr>
            `).join('')}
            ${monthlySales.length === 0 ? '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #64748b;">Nenhum faturamento registrado no mês anterior.</td></tr>' : ''}
          </tbody>
        </table>

        <p style="margin-top: 25px; font-size: 12px; color: #666; font-style: italic;">
          * Por favor, verifique se os vendedores enviaram as Notas Fiscais no sistema antes de efetivar o pagamento.
        </p>
      </div>
    `;

    for (const email of financeEmails) {
      await sendAutomaticEmail(email, `Financeiro: Relatório de Pagamentos - ${monthName}`, financeHtml);
    }
  }, {
    timezone: BR_TIMEZONE
  });

  // Day 1: Reports to Partners (Value Base Only) - SENT ON THE 1ST
  cron.schedule('0 8 1 * *', async () => {
    console.log("[Schedule] Generating Day 1 Partner Reports...");
    const notifSnap = await db.collection('settings').doc('notifications').get();
    const notif = notifSnap.data();
    if (!notif?.monthly_report_partners) return;

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const indicationsSnap = await db.collection('indications')
      .where('status', '==', 'sold')
      .get();
    
    const monthlySales = indicationsSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(d => {
        if (!d.updated_at) return false;
        const date = new Date(d.updated_at);
        return date >= lastMonth && date <= endOfLastMonth;
      });

    // Group by Seller
    const sellersMap: any = {};
    monthlySales.forEach(sale => {
      const sid = sale.external_seller_uid;
      if (!sellersMap[sid]) sellersMap[sid] = [];
      sellersMap[sid].push(sale);
    });

    for (const [sid, sales] of Object.entries(sellersMap)) {
      const partnerData = await db.collection('users').doc(sid).get();
      if (!partnerData.exists) continue;
      const partner = partnerData.data() as any;
      if (!partner.email || partner.email.endsWith('@mobile.roder.com.br')) continue;

      const totalCommissions = (sales as any[]).reduce((acc, curr) => acc + (curr.commission_value || 0), 0);
      const monthName = lastMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

      const html = `
        <div style="font-family: sans-serif; color: #333;">
          <h2 style="color: #eab308;">Olá ${partner.name}, o extrato de ${monthName} já está disponível!</h2>
          <p>Confira abaixo o resumo das suas vendas confirmadas no mês passado e o valor total para emissão da nota fiscal.</p>
          
          <div style="background: #eab308; color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">VALOR TOTAL DO MÊS</p>
            <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: 900;">${formatCurrency(totalCommissions)}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="font-size: 12px; color: #666; text-align: left;">
                <th style="padding: 10px; border-bottom: 1px solid #eee;">Cliente</th>
                <th style="padding: 10px; border-bottom: 1px solid #eee;">Equipamento</th>
                <th style="padding: 10px; border-bottom: 1px solid #eee;">Comissão</th>
              </tr>
            </thead>
            <tbody>
              ${(sales as any[]).map(s => `
                <tr style="font-size: 13px;">
                  <td style="padding: 10px; border-bottom: 1px solid #f9f9f9;">${s.client_name}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f9f9f9;">${s.product_name}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f9f9f9; font-weight: bold;">${formatCurrency(s.commission_value || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 30px; padding: 15px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; font-size: 14px; border-left: 4px solid #eab308;">
            <p style="margin: 0;"><strong>ATENÇÃO: PRAZO DE NOTA FISCAL</strong></p>
            <p style="margin: 5px 0 0 0;">Você tem até o dia <strong>05 deste mês</strong> para emitir e carregar a nota fiscal no sistema. Notas enviadas após este prazo terão o pagamento postergado para o mês seguinte.</p>
          </div>
        </div>
      `;

      await sendAutomaticEmail(partner.email, `Extrato Mensal de Comissões - ${monthName}`, html);
    }
  }, {
    timezone: BR_TIMEZONE
  });

  // Day 5: Invoice Deadline Reminder
  cron.schedule('0 8 5 * *', async () => {
    console.log("[Schedule] Running Day 5 Invoice Reminders...");
    const notifSnap = await db.collection('settings').doc('notifications').get();
    const notif = notifSnap.data();
    if (!notif?.monthly_report_partners) return;

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const indicationsSnap = await db.collection('indications')
      .where('status', '==', 'sold')
      .get();
    
    const monthlySales = indicationsSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(d => {
        if (!d.updated_at) return false;
        const date = new Date(d.updated_at);
        return date >= lastMonth && date <= endOfLastMonth;
      });

    // Group by Seller
    const sellersMap: any = {};
    monthlySales.forEach(sale => {
      const sid = sale.external_seller_uid;
      if (!sellersMap[sid]) sellersMap[sid] = [];
      sellersMap[sid].push(sale);
    });

    for (const [sid, _] of Object.entries(sellersMap)) {
      // Check if there is an invoice uploaded for last month's commissions
      const commissionSnap = await db.collection('commissions')
        .where('external_seller_uid', '==', sid)
        .where('month', '==', (lastMonth.getMonth() + 1).toString())
        .where('year', '==', lastMonth.getFullYear().toString())
        .get();

      const needsReminder = commissionSnap.empty || commissionSnap.docs.some(d => !d.data().invoice_url);

      if (needsReminder) {
        const partnerData = await db.collection('users').doc(sid).get();
        if (!partnerData.exists) continue;
        const partner = partnerData.data() as any;
        if (!partner.email || partner.email.endsWith('@mobile.roder.com.br')) continue;

        const html = `
          <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #ef4444;">⚠️ AVISO: Último dia para envio da Nota Fiscal</h2>
            <p>Olá ${partner.name},</p>
            <p>Identificamos que a sua Nota Fiscal referente às comissões do mês passado ainda não foi carregada no sistema.</p>
            
            <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0; font-weight: bold; color: #991b1b;">PRAZO FINAL: HOJE</p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Conforme contrato, o não envio da NF até o dia 05 (hoje) impossibilita o pagamento neste ciclo. O valor será acumulado para o pagamento do próximo mês.</p>
            </div>

            <p>Por favor, acesse o sistema e realize o upload da NF imediatamente para garantir seu recebimento.</p>
            <a href="${process.env.APP_URL || 'https://roder-indica.web.app'}/comissoes" style="display: inline-block; background: #eab308; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Minhas Comissões</a>
          </div>
        `;

        await sendAutomaticEmail(partner.email, `URGENTE: Último dia para Nota Fiscal`, html);
      }
    }
  }, {
    timezone: BR_TIMEZONE
  });

  // Day 7: Payment Reminder to Finance
  cron.schedule('0 8 7 * *', async () => {
    console.log("[Schedule] Generating Day 7 Finance Reminders...");
    const notifSnap = await db.collection('settings').doc('notifications').get();
    const notif = notifSnap.data();
    if (!notif?.payment_reminder_finance) return;

    // Prepare Finance summary emails (Financeiro, Novo Financeiro Vanessa, and Admin Jeferson)
    const financeEmails = [
      'financeiro@roderbrasil.com.br',
      'financeiro2@roderbrasil.com.br',
      'jeferson@roderbrasil.com.br'
    ];
    if (notif.finance_email) {
      const customEmails = String(notif.finance_email).split(',').map((e: string) => e.trim()).filter((e: string) => e !== '');
      customEmails.forEach((email: string) => {
        if (!financeEmails.map(x => x.toLowerCase()).includes(email.toLowerCase())) {
          financeEmails.push(email);
        }
      });
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const indicationsSnap = await db.collection('indications')
      .where('status', '==', 'sold')
      .get();
    
    const monthlyCommissions = indicationsSnap.docs
      .map(d => d.data() as any)
      .filter(d => {
        if (!d.updated_at) return false;
        const date = new Date(d.updated_at);
        return date >= lastMonth && date <= endOfLastMonth;
      })
      .reduce((acc, curr) => acc + (curr.commission_value || 0), 0);

    if (monthlyCommissions === 0) return;

    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #0f172a;">Lembrete de Pagamento de Comissões</h2>
        <p>Olá Setor Financeiro / Jeferson,</p>
        <p>Hoje é dia 7. Lembramos que o valor total de comissões calculadas para o fechamento do mês anterior é de:</p>
        <div style="font-size: 36px; font-weight: 900; color: #eab308; margin: 20px 0;">${formatCurrency(monthlyCommissions)}</div>
        <p>Após realizar os pagamentos, por favor, certifique que as notas fiscais foram enviadas no sistema e carregue os respectivos comprovantes para notificar os parceiros.</p>
      </div>
    `;

    for (const email of financeEmails) {
      await sendAutomaticEmail(email, `URGENTE: Pagamento de Comissões do Mês`, html);
    }
  }, {
    timezone: BR_TIMEZONE
  });

  // --- COMMERCIAL HOURS SLA UTILITY (BRT: Seg-Sex 07:00 às 17:00) ---
  function getBrtDateParts(dateInput: Date | string | number) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return getBrtDateParts(new Date());
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(d);
    const partMap: Record<string, string> = {};
    for (const part of parts) {
      partMap[part.type] = part.value;
    }
    
    const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
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

  function createBrtDate(year: number, month: number, day: number, hour: number, minute: number): Date {
    const y = String(year);
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const h = String(hour).padStart(2, '0');
    const min = String(minute).padStart(2, '0');
    return new Date(`${y}-${m}-${d}T${h}:${min}:00.000-03:00`);
  }

  function advanceOneDay(year: number, month: number, day: number) {
    const d = new Date(Date.UTC(year, month, day + 1));
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      day: d.getUTCDate()
    };
  }

  function getNextBusinessDay0700(year: number, month: number, day: number, dayOfWeek: number): Date {
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

  function calculateSlaExpiration(createdAtInput: Date | string | number, slaHours: number = 4): Date {
    let current = new Date(createdAtInput);
    if (isNaN(current.getTime())) current = new Date();
    
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
        current = new Date(current.getTime() + remainingMinutes * 60000);
        remainingMinutes = 0;
      } else {
        remainingMinutes -= minutesLeftToday;
        current = getNextBusinessDay0700(parts.year, parts.month, parts.day, parts.dayOfWeek);
      }
    }

    return current;
  }

  // Periodic check every 15 minutes to automatically assign pending leads after triage SLA timeout (4 horas úteis BRT)
  cron.schedule('*/15 * * * *', async () => {
    console.log("[Schedule] Running automatic assignment check for pending leads (SLA 4h úteis BRT)...");
    try {
      const now = new Date();

      const pendingSnap = await db.collection('indications')
        .where('status', '==', 'pending')
        .get();

      if (pendingSnap.empty) {
        console.log("[Schedule] No pending leads found.");
        return;
      }

      // Fetch all users to find available internal sellers
      const usersSnap = await db.collection('users').get();
      
      // Determine today's date string in Brasília (BR) Time
      const utcOffset = now.getTime() + now.getTimezoneOffset() * 60000;
      const brDate = new Date(utcOffset + (3600000 * -3)); // BRT is UTC-3
      const year = brDate.getFullYear();
      const month = String(brDate.getMonth() + 1).padStart(2, '0');
      const day = String(brDate.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const availableSellers = usersSnap.docs
        .map(d => ({ uid: d.id, ...d.data() } as any))
        .filter(u => {
          // Check role or specific names (monali, heloisa, yury)
          const isSellerRole = u.role === 'internal_seller' || 
            ['monali', 'heloisa', 'yury'].some(name => u.name?.toLowerCase().includes(name));
          
          if (!isSellerRole) return false;
          
          // Must be an active receiver
          if (u.is_lead_receiver === false) return false;

          // Check vacation
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
        const indData = { id: docRef.id, ...docRef.data() } as any;
        const createdAt = new Date(indData.created_at || now.toISOString());
        const slaExpirationDate = calculateSlaExpiration(createdAt, 4);

        // If lead has exceeded 4 commercial hours in BRT timezone, auto-assign it!
        if (now >= slaExpirationDate) {
          console.log(`[Schedule] Auto-assigning pending lead ${indData.id} (${indData.client_name}) due to commercial SLA timeout (4 business hours BRT)...`);

          // Balance workload: count how many active leads each available seller has
          const sellerLeadCounts = await Promise.all(
            availableSellers.map(async (seller) => {
              const activeCountSnap = await db.collection('indications')
                .where('status', '==', 'negotiating')
                .where('internal_seller_uid', '==', seller.uid)
                .get();
              return { seller, count: activeCountSnap.size };
            })
          );

          // Sort by active leads count ascending, pick the one with fewest leads
          sellerLeadCounts.sort((a, b) => a.count - b.count);
          const chosenSeller = sellerLeadCounts[0].seller;

          console.log(`[Schedule] Chosen seller for lead ${indData.id}: ${chosenSeller.name} with ${sellerLeadCounts[0].count} active leads.`);

          // We need partner (indicator) info too
          let partnerData: any = null;
          if (indData.external_seller_uid) {
            const partnerSnap = await db.collection('users').doc(indData.external_seller_uid).get();
            if (partnerSnap.exists) {
              partnerData = partnerSnap.data();
            }
          }

          const historyEntry = {
            id: Math.random().toString(36).substring(2, 11),
            type: 'system',
            author_name: 'Sistema Roder',
            created_at: new Date().toISOString(),
            content: `[SLA Expirado - 4 Horas Úteis]: O limite de triagem (4h úteis no horário comercial de Brasília: Seg-Sex 07:00 às 17:00) expirou. O lead foi distribuído automaticamente para o(a) vendedor(a) ${chosenSeller.name} e enviado ao Agendor CRM.`,
            attachments: []
          };

          // Update database
          await db.collection('indications').doc(indData.id).update({
            internal_seller_uid: chosenSeller.uid,
            internal_seller_name: chosenSeller.name,
            status: 'negotiating',
            updated_at: new Date().toISOString(),
            duplicate_reviewed: true,
            negotiation_history: [...(indData.negotiation_history || []), historyEntry]
          });

          // Create in-app notification for the seller
          await db.collection('notifications').add({
            user_uid: chosenSeller.uid,
            title: 'Novo Lead Atribuído Automaticamente',
            message: `O lead de ${indData.client_name} foi atribuído automaticamente a você por limite de tempo na triagem.`,
            type: 'info',
            read: false,
            link: '/indicacoes?filter=negotiating',
            created_at: new Date().toISOString()
          });

          // Send Emails!
          // 1. To the Salesperson
          if (chosenSeller.email) {
            const emailSubjectSeller = `📥 Novo Lead Atribuído Automaticamente: ${indData.client_name || 'Cliente'} - Fale com o Parceiro ${partnerData?.name || indData.external_seller_name || 'Indicador'}`;
            
            // Build requested items list
            let itemsHtmlList = '';
            if (indData.items && indData.items.length > 0) {
              itemsHtmlList = `
                <div style="margin-top: 15px;">
                  <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: bold; color: #475569; text-transform: uppercase;">Equipamentos Solicitados:</p>
                  <div>
                    ${indData.items.map((item: any) => `
                      <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: #1e293b; margin-right: 5px; margin-bottom: 5px;">
                        ${item.quantity}x ${item.product_name}
                      </span>
                    `).join('')}
                  </div>
                </div>
              `;
            }

            const emailHtmlSeller = `
              <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background-color: #ffffff;">
                <div style="background-color: #3b82f6; color: white; padding: 24px; text-align: center;">
                  <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder" style="height: 35px; filter: brightness(0) invert(1); margin-bottom: 10px;">
                  <h2 style="margin: 0; text-transform: uppercase; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">Novo Lead Atribuído (Automático)</h2>
                  <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Um lead foi direcionado automaticamente para você por tempo limite de triagem</p>
                </div>
                
                <div style="padding: 24px; line-height: 1.6;">
                  <p style="font-size: 15px; margin-top: 0;">Olá <strong>${chosenSeller.name}</strong>,</p>
                  <p style="font-size: 15px; color: #475569;">O lead do cliente <strong>${indData.client_name || indData.client_person_name || 'Cliente'}</strong> foi atribuído para a sua carteira e já está disponível para andamento no <strong>CRM Agendor</strong>.</p>
                  
                  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 18px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #b45309; font-size: 15px; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #fef3c7; padding-bottom: 4px;">
                      Informações do Cliente
                    </h3>
                    <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
                      <tr>
                        <td style="padding: 4px 0; color: #b45309; font-weight: bold; width: 35%;">Cliente:</td>
                        <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${indData.client_name || indData.client_person_name || 'Não informado'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #b45309; font-weight: bold;">Localização:</td>
                        <td style="padding: 4px 0; color: #1e293b;">${indData.client_location || 'Não informada'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #b45309; font-weight: bold;">WhatsApp / Contato:</td>
                        <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${indData.client_phone || 'Não informado'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #b45309; font-weight: bold;">Máquina Base:</td>
                        <td style="padding: 4px 0; color: #1e293b;">${indData.base_machine || 'Não informada'} ${indData.machine_details || ''}</td>
                      </tr>
                    </table>
                    ${itemsHtmlList}
                    ${indData.description ? `
                      <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #fef3c7;">
                        <p style="margin: 0; font-size: 11px; font-weight: bold; color: #b45309; text-transform: uppercase;">Descrição da Necessidade:</p>
                        <p style="margin: 3px 0 0 0; font-size: 12px; color: #475569; font-style: italic;">"${indData.description}"</p>
                      </div>
                    ` : ''}
                  </div>
                  
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; margin: 20px 0; border-radius: 8px;">
                    <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 15px; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                      Parceiro Indicador Responsável
                    </h3>
                    <p style="margin: 0 0 10px 0; font-size: 13px; color: #475569;">Este lead foi indicado pelo nosso parceiro credenciado. Entre em contato com ele para alinhar informações antes de ligar para o cliente!</p>
                    <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: bold; width: 35%;">Parceiro:</td>
                        <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${partnerData?.name || indData.external_seller_name || 'Parceiro'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: bold;">WhatsApp / Celular:</td>
                        <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">
                          ${partnerData?.phone ? `
                            <a href="https://wa.me/55${partnerData.phone.replace(/\D/g, '')}" style="color: #25d366; text-decoration: none; font-weight: bold;">
                              ${partnerData.phone} 💬
                            </a>
                          ` : 'Não informado'}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: bold;">E-mail:</td>
                        <td style="padding: 4px 0; color: #1e293b;">${partnerData?.email || 'Não informado'}</td>
                      </tr>
                    </table>
                  </div>

                  <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #1e40af;">
                    <strong>💡 Dica de Ouro:</strong> Converse com o parceiro por WhatsApp! Ele pode possuir fotos ou vídeos da máquina do cliente, saber detalhes específicos da demanda, ou explicar como o cliente prefere ser atendido, garantindo um contato inicial muito mais assertivo e produtivo.
                  </div>

                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://roderindica.roderbrasil.com.br/indicacoes" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">ACESSAR PAINEL DO VENDEDOR</a>
                  </div>
                </div>
              </div>
            `;
            await sendAutomaticEmail(chosenSeller.email, emailSubjectSeller, emailHtmlSeller);
          }

          // 2. To the Partner
          const partnerEmail = partnerData?.email || indData.client_email;
          if (partnerEmail && partnerEmail.includes('@') && !partnerEmail.endsWith('@mobile.roder.com.br')) {
            const emailSubjectPartner = `💼 Sua indicação de ${indData.client_name || 'Cliente'} foi encaminhada para ${chosenSeller.name}!`;
            const waLink = chosenSeller.phone ? `https://wa.me/55${chosenSeller.phone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(chosenSeller.name)},%20sou%20o%20parceiro%20${encodeURIComponent(partnerData?.name || 'Parceiro')}%20e%20gostaria%20de%20enviar%20informações%20adicionais%20sobre%20a%20indicação%20de%20${encodeURIComponent(indData.client_name)}` : '';

            const emailHtmlPartner = `
              <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background-color: #ffffff;">
                <div style="background-color: #10b981; color: white; padding: 24px; text-align: center;">
                  <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder" style="height: 35px; filter: brightness(0) invert(1); margin-bottom: 10px;">
                  <h2 style="margin: 0; text-transform: uppercase; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">Indicação em Atendimento!</h2>
                  <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Seu lead já foi encaminhado para o setor comercial da fábrica</p>
                </div>
                
                <div style="padding: 24px; line-height: 1.6;">
                  <p style="font-size: 15px; margin-top: 0;">Olá <strong>${partnerData?.name || 'Parceiro'}</strong>,</p>
                  <p style="font-size: 15px; color: #475569;">Gostaríamos de informar que a sua indicação para o cliente <strong>${indData.client_name || 'Cliente'}</strong> já foi distribuída (através de fluxo automático por limite de tempo na triagem) e está sob os cuidados do vendedor interno <strong>${chosenSeller.name}</strong>.</p>
                  
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
                            <a href="https://wa.me/55${chosenSeller.phone.replace(/\D/g, '')}" style="color: #25d366; text-decoration: none; font-weight: bold;">
                              ${chosenSeller.phone} 💬
                            </a>
                          ` : 'Não informado'}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #15803d; font-weight: bold;">E-mail:</td>
                        <td style="padding: 4px 0; color: #1e293b;">${chosenSeller.email || 'Não informado'}</td>
                      </tr>
                    </table>
                  </div>

                  <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #1e40af; line-height: 1.5;">
                    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">💡 Como você pode acelerar o fechamento e ajudar o seu cliente?</p>
                    Se você possuir fotos ou vídeos da máquina do cliente, marca, modelo ou qualquer detalhe operacional específico sobre essa demanda, **compartilhe diretamente com o(a) vendedor(a) ${chosenSeller.name} por WhatsApp**!
                    <br><br>
                    Dessa forma, o(a) vendedor(a) poderá **gerar o orçamento correto diretamente baseado nas informações que você enviou**, reduzindo burocracias e otimizando o tempo. Após elaborar o orçamento, ele(a) enviará uma mensagem informando que a proposta foi feita com base nos detalhes precisos que você forneceu.
                  </div>

                  <p style="font-size: 14px; color: #475569;">Esta cooperação mútua garante que alinhemos as melhores expectativas, oferecendo o equipamento perfeitamente dimensionado para o trabalho do cliente.</p>
                  
                  <p style="font-size: 14px; color: #475569;">Você pode continuar acompanhando todo o histórico e a evolução deste atendimento diretamente no painel do <strong>RODER Indica</strong>.</p>
                </div>
              </div>
            `;
            await sendAutomaticEmail(partnerEmail, emailSubjectPartner, emailHtmlPartner);
          }

          // Trigger Agendor background sync request
          try {
            const baseUrl = `http://localhost:3000`;
            fetch(`${baseUrl}/api/agendor/sync-indication`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ indicationId: indData.id })
            }).catch(e => console.error("Error triggering auto sync endpoint:", e.message));
          } catch (syncErr: any) {
            console.error("Failed to trigger Agendor sync for auto-assigned lead:", syncErr.message);
          }
        }
      }
    } catch (error: any) {
      console.error("[Schedule] Error in automatic lead assignment cron:", error);
    }
  }, {
    timezone: BR_TIMEZONE
  });

  // --- AGENDOR CRM INTEGRATION ROUTES ---

  // Helper function to call Agendor API
  async function callAgendor(endpoint: string, method: string, apiToken: string, body?: any) {
    const url = `https://api.agendor.com.br/v3/${endpoint}`;
    const headers: any = {
      "Content-Type": "application/json",
      "Authorization": `Token ${apiToken}`
    };

    const options: any = {
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

  // Robust helper to extract ID from Agendor responses (handles nested objects, arrays, and data envelopes)
  function extractAgendorId(response: any, preferredKeys: string[] = ["id", "organizationId", "organization_id", "dealId", "deal_id", "personId", "person_id"]): any {
    if (!response) return null;
    
    // If array, take first element
    if (Array.isArray(response)) {
      if (response.length > 0) {
        return extractAgendorId(response[0], preferredKeys);
      }
      return null;
    }
    
    // 1. Direct key search at top-level
    for (const key of preferredKeys) {
      if (response[key] !== undefined && response[key] !== null) {
        return response[key];
      }
    }
    
    // 2. Check in 'data' envelope
    if (response.data) {
      for (const key of preferredKeys) {
        if (response.data[key] !== undefined && response.data[key] !== null) {
          return response.data[key];
        }
      }
    }
    
    // 3. Deep recursive search
    const findKeyRecursive = (obj: any, keys: string[]): any => {
      if (obj && typeof obj === 'object') {
        for (const key of keys) {
          if (key in obj && obj[key] !== undefined && obj[key] !== null) {
            return obj[key];
          }
        }
        for (const k of Object.keys(obj)) {
          const res = findKeyRecursive(obj[k], keys);
          if (res !== undefined && res !== null) {
            return res;
          }
        }
      }
      return undefined;
    };
    
    const recursiveId = findKeyRecursive(response, preferredKeys);
    if (recursiveId !== undefined && recursiveId !== null) {
      return recursiveId;
    }
    
    return null;
  }

  // Helper to safely extract arrays from various response structures returned by Agendor
  function extractAgendorList(res: any): any[] {
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

  // 1. Test Agendor connection and token (now creates an end-to-end test lead as requested)
  app.post("/api/agendor/test", async (req, res) => {
    try {
      const { apiToken, indicatorName, indicatorEmail, indicatorPhone } = req.body;
      if (!apiToken) {
        return res.status(400).json({ error: "Token da API do Agendor não fornecido." });
      }

      console.log("[AGENDOR-TEST] Iniciando teste de conexão end-to-end...");

      // Step A: Test auth token by fetching organizations list (accessible by all roles, unlike /users which requires admin)
      let testOrgData: any = [];
      try {
        testOrgData = await callAgendor("organizations?per_page=1", "GET", apiToken);
        console.log("[AGENDOR-TEST] Passo A (Lista de Empresas) bem-sucedido.");
      } catch (err: any) {
        console.error("[AGENDOR-TEST] Falha no Passo A (Verificação de Token/Empresas):", err.message);
        return res.status(500).json({ 
          error: `Falha na verificação do Token de Conexão (Passo A: GET /v3/organizations): ${err.message}. Verifique se o Token está correto e ativo.` 
        });
      }

      // Try to fetch users list as optional diagnostic data (only works for admins, will be caught and ignored for standard users)
      let usersData: any = [];
      try {
        usersData = await callAgendor("users", "GET", apiToken);
        console.log("[AGENDOR-TEST] Opcional: Lista de Usuários obtida com sucesso. Usuários encontrados:", usersData.length || 0);
      } catch (err: any) {
        console.log("[AGENDOR-TEST] Opcional: Não foi possível obter lista de usuários (geralmente porque o token não é administrador):", err.message);
      }

      const finalIndicatorName = indicatorName || "Jeferson Roder";
      const finalIndicatorEmail = indicatorEmail || "jeferson@roderbrasil.com.br";
      const finalIndicatorPhone = indicatorPhone || "(14) 99811-5110";

      // Step B: Create a fictitious test client organization
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const testOrgName = `Cliente Fictício - Teste RODER Indica (${uniqueSuffix})`;
      
      const testOrgPayload = {
        name: testOrgName,
        contact: {
          name: "Contato Teste",
          email: "suporte@roder.com.br",
          phones: [{ number: "(11) 98888-8888", type: "mobile" }]
        },
        address: {
          city: "Araçariguama",
          state: "SP"
        }
      };

      let organizationId: any = null;
      let createdOrg: any = null;
      try {
        console.log("[AGENDOR-TEST] Criando empresa de teste no Agendor...");
        createdOrg = await callAgendor("organizations", "POST", apiToken, testOrgPayload);
        console.log("[AGENDOR-TEST] Resposta do Passo B (Criar Empresa):", JSON.stringify(createdOrg));
        organizationId = extractAgendorId(createdOrg, ["organizationId", "organization_id", "id"]);
        console.log("[AGENDOR-TEST] Passo B (Criar Empresa) bem-sucedido. ID:", organizationId);

        if (!organizationId) {
          return res.status(500).json({ 
            error: `Falha na extração do ID da empresa criada (Passo B). Chaves retornadas: ${Object.keys(createdOrg || {}).join(", ")}. Resposta completa: ${JSON.stringify(createdOrg)}` 
          });
        }
      } catch (err: any) {
        console.error("[AGENDOR-TEST] Falha no Passo B (Criar Empresa):", err.message);
        return res.status(500).json({ 
          error: `Falha na criação de empresa de teste (Passo B: POST /v3/organizations): ${err.message}` 
        });
      }

      // Step C: Create a test deal under the created organization
      const testDealTitle = `Teste de Integração: RODER Indica V2 - Cliente Fictício (${uniqueSuffix})`;
      
      const testDealPayload = {
        title: testDealTitle,
        description: `★ ORIGEM: RODER Indica V2 (Teste de Conexão)\n★ PARCEIRO INDICADOR: ${finalIndicatorName}\n★ EMAIL DO PARCEIRO: ${finalIndicatorEmail}\n★ TELEFONE DO PARCEIRO: ${finalIndicatorPhone}\n\nEste é um teste automático de conexão gerado a partir do painel administrativo do RODER Indica V2 para validar a perfeita integração e o registro automático de novos leads com informações completas do parceiro indicador.`,
        stage: "lead",
        status: "ongoing",
        organization: organizationId
      };

      let dealId: any = null;
      let createdDeal: any = null;
      try {
        console.log("[AGENDOR-TEST] Criando negócio (lead) de teste no Agendor...");
        createdDeal = await callAgendor(`organizations/${organizationId}/deals`, "POST", apiToken, testDealPayload);
        console.log("[AGENDOR-TEST] Resposta do Passo C (Criar Negócio):", JSON.stringify(createdDeal));
        dealId = extractAgendorId(createdDeal, ["dealId", "deal_id", "id"]);
        console.log("[AGENDOR-TEST] Passo C (Criar Negócio) bem-sucedido. ID:", dealId);

        if (!dealId) {
          return res.status(500).json({ 
            error: `Falha na extração do ID do negócio criado (Passo C). Chaves retornadas: ${Object.keys(createdDeal || {}).join(", ")}. Resposta completa: ${JSON.stringify(createdDeal)}` 
          });
        }
      } catch (err: any) {
        console.error("[AGENDOR-TEST] Falha no Passo C (Criar Negócio):", err.message);
        return res.status(500).json({ 
          error: `Falha na criação de negócio de teste (Passo C: POST /v3/organizations/${organizationId}/deals): ${err.message}` 
        });
      }

      // Step D: Create a test task/activity (Tarefa de Teste) linked to the created organization and deal as requested
      let taskId: any = null;
      let createdTask: any = null;
      const testTaskText = `[Teste RODER Indica] Ligar para o contato da empresa ${testOrgName} para dar andamento à indicação de ${finalIndicatorName}.`;
      try {
        console.log("[AGENDOR-TEST] Criando tarefa/atividade de teste no Agendor...");
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1); // Set to tomorrow
        const tomorrowStr = tomorrow.toISOString().split(".")[0] + "Z"; // e.g. "2026-07-20T18:48:37Z"
        
        const testTaskPayload = {
          text: testTaskText,
          due_date: tomorrowStr,
          deal: Number(dealId) || undefined,
          organization: Number(organizationId) || undefined
        };
        createdTask = await callAgendor("tasks", "POST", apiToken, testTaskPayload);
        console.log("[AGENDOR-TEST] Resposta do Passo D (Criar Tarefa):", JSON.stringify(createdTask));
        taskId = extractAgendorId(createdTask, ["taskId", "task_id", "id"]);
        console.log("[AGENDOR-TEST] Passo D (Criar Tarefa) bem-sucedido. ID:", taskId);
      } catch (taskErr: any) {
        console.error("[AGENDOR-TEST] Falha opcional no Passo D (Criar Tarefa):", taskErr.message);
      }

      let finalMessage = `Conexão efetuada e teste executado com absoluto sucesso! Criamos a empresa de teste "${testOrgName}" (ID ${organizationId}) e o negócio de teste "${testDealTitle}" (ID ${dealId})`;
      if (taskId) {
        finalMessage += ` e geramos uma atividade de teste vinculada para amanhã: "${testTaskText}" (ID da tarefa: ${taskId}). Acesse agora a tela de início do seu Agendor, na seção de ATIVIDADES, para conferir tudo em tempo real!`;
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
    } catch (err: any) {
      console.error("[AGENDOR-TEST] Erro geral de teste:", err.message);
      return res.status(500).json({ error: err.message || "Erro desconhecido ao testar token de conexão com o Agendor." });
    }
  });

  // Helper to synchronize an Indication as a Lead/Deal in Agendor CRM (creates/links Organization & Deal)
  async function executeAgendorSync(indicationId: string, indData: any, apiToken: string, forceSyncDeal: boolean = true) {
    const status = indData.status || "pending";

    // If status is pending (meaning Luana hasn't transferred/assigned it yet, and forceSyncDeal is false)
    if (status === "pending" && !forceSyncDeal) {
      const updatedSnap = await db.collection("indications").doc(indicationId).get();
      return {
        success: true,
        message: "Lead em triagem pendente. A sincronização do novo negócio e da nova empresa no Agendor será disparada automaticamente assim que a Luana atribuir um vendedor.",
        pending: true,
        negotiation_history: updatedSnap.data()?.negotiation_history || []
      };
    }

    // Step A: Fetch partner and salesperson details
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
        console.warn("[AGENDOR-SYNC] Não foi possível carregar dados do indicador:", pErr);
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
        console.warn("[AGENDOR-SYNC] Não foi possível carregar dados do vendedor:", sErr);
      }
    }

    // Resolve Agendor Owner User ID for the deal
    let agendorUserId: number | null = null;

    if (sellerEmail) {
      try {
        const agendorUsersRes = await callAgendor("users", "GET", apiToken);
        const agendorUsersList = extractAgendorList(agendorUsersRes);
        
        const matchedUser = agendorUsersList.find((u: any) => 
          u.email && u.email.toLowerCase().trim() === sellerEmail.toLowerCase().trim()
        );

        if (matchedUser && matchedUser.id) {
          agendorUserId = matchedUser.id;
          console.log(`[AGENDOR-SYNC] Vendedor correspondente no Agendor localizado: ${matchedUser.name} (ID ${matchedUser.id}) para email ${sellerEmail}`);
        } else {
          console.warn(`[AGENDOR-SYNC] Nenhum usuário com email ${sellerEmail} encontrado no Agendor. Usando usuário padrão do Token.`);
        }
      } catch (userErr: any) {
        console.warn("[AGENDOR-SYNC] Falha ao listar usuários do Agendor para mapeamento de vendedor:", userErr.message);
      }
    }

    // Build client data
    const rawClientName = (indData.client_name || indData.contact_name || "").trim();
    const rawCompanyName = (indData.client_company_name || indData.company_name || "").trim();
    
    // Priority: Company name if provided, else Person name
    const companyDisplayName = rawCompanyName || rawClientName || "Cliente Roder Indica";
    const realClientName = rawClientName || rawCompanyName || "Contato Não Informado";
    
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

    // Step B: Create a BRAND NEW Organization in Agendor for this lead (Aba Empresas)
    // NEVER search or reuse existing companies to avoid data contamination or overwriting existing CRM records!
    if (!dealId || !organizationId) {
      const orgPayload: any = {
        name: companyDisplayName,
        contact: {
          name: realClientName
        },
        description: `Lead cadastrado via Roder Indica V2 por ${partnerName}. Equipamento de interesse: ${equipment}.`,
        phones: clientPhone ? [{ number: clientPhone }] : [],
        emails: clientEmail ? [{ email: clientEmail }] : []
      };

      if (clientCnpj && clientCnpj !== "Não informado") {
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
      } catch (orgErr: any) {
        console.error("[AGENDOR-SYNC] Erro ao criar nova Empresa no Agendor:", orgErr.message);
        // Fallback: If creation with CNPJ failed (e.g. duplicate CNPJ constraint in CRM), create without CNPJ to ensure isolation
        try {
          delete orgPayload.cnpj;
          orgPayload.name = `${companyDisplayName} (Roder Indica)`;
          const fallbackOrg = await callAgendor("organizations", "POST", apiToken, orgPayload);
          organizationId = extractAgendorId(fallbackOrg, ["organizationId", "organization_id", "id"]);
          console.log(`[AGENDOR-SYNC] Empresa criada via fallback de isolamento no Agendor (ID #${organizationId})`);
        } catch (fErr: any) {
          console.error("[AGENDOR-SYNC] Falha no fallback de criação de Empresa:", fErr.message);
        }
      }
    }

    // Step C: Resolve SDR Funnel ID ("Funil Pré venda - Prospecção")
    let funnelId: number | null = null;
    let sdrStageId: string = "lead";

    try {
      const funnelsRes = await callAgendor("funnels", "GET", apiToken);
      const funnelsList = extractAgendorList(funnelsRes);

      const matchedFunnel = funnelsList.find((f: any) => 
        f.name && (
          f.name.toLowerCase().includes("pré venda") || 
          f.name.toLowerCase().includes("pre venda") || 
          f.name.toLowerCase().includes("prospecção") || 
          f.name.toLowerCase().includes("sdr")
        )
      ) || funnelsList[0];

      if (matchedFunnel) {
        funnelId = matchedFunnel.id;
        if (Array.isArray(matchedFunnel.stages) && matchedFunnel.stages.length > 0) {
          sdrStageId = matchedFunnel.stages[0].id || matchedFunnel.stages[0].stage_id || sdrStageId;
        }
        console.log(`[AGENDOR-SYNC] Funil de Pré-Venda / SDR localizado: "${matchedFunnel.name}" (ID ${funnelId})`);
      }
    } catch (funnelErr: any) {
      console.warn("[AGENDOR-SYNC] Falha ao listar funis do Agendor:", funnelErr.message);
    }

    // Step D: Create a BRAND NEW Deal in Agendor (Aba Negócios)
    // NEVER search or link existing deals on Agendor!
    const dealTitle = `${companyDisplayName} - ${equipment}`;

    if (!dealId) {
      const dealPayload: any = {
        title: dealTitle,
        value: dealValue,
        description: `Lead cadastrado via Roder Indica V2.
• Empresa: ${companyDisplayName}
• Contato: ${realClientName}
• Telefone: ${clientPhone || 'Não informado'}
• Email: ${clientEmail || 'Não informado'}
• Equipamento: ${equipment}
• Indicador Parceiro: ${partnerName} (${partnerCode})
• Vendedor Alocado: ${sellerName || 'Não atribuído'}`
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

      console.log(`[AGENDOR-SYNC] Criando novo Negócio ISOLADO no Agendor:`, dealPayload);
      
      try {
        const dealResult = await callAgendor("deals", "POST", apiToken, dealPayload);
        dealId = extractAgendorId(dealResult, ["dealId", "deal_id", "id"]);
        console.log(`[AGENDOR-SYNC] Novo Negócio isolado criado com sucesso no Agendor (ID #${dealId})`);
      } catch (dealErr: any) {
        console.error("[AGENDOR-SYNC] Erro ao criar Negócio no Agendor:", dealErr.message);
        delete dealPayload.funnel;
        delete dealPayload.user;
        try {
          const retryResult = await callAgendor("deals", "POST", apiToken, dealPayload);
          dealId = extractAgendorId(retryResult, ["dealId", "deal_id", "id"]);
        } catch (retryErr: any) {
          console.error("[AGENDOR-SYNC] Falha no retry de criação do Negócio:", retryErr.message);
        }
      }
    }

    // Step E: Post proposal note / details as comment in Agendor
    if (dealId) {
      try {
        const commentNote = `★ PROPOSTA / INDICAÇÃO REGISTRADA VIA RODER INDICA V2
• ID Indicação: ${indicationId}
• Empresa (Aba Empresas): ${companyDisplayName}
• Contato do Cliente: ${realClientName}
• Telefone: ${clientPhone || 'Não informado'}
• Email: ${clientEmail || 'Não informado'}
• CNPJ: ${clientCnpj || 'Não informado'}
• Localização: ${clientLocation || 'Não informada'}
• Equipamento Solicitado: ${equipment}
• Valor Estimado: R$ ${dealValue ? dealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
• Indicador Parceiro: ${partnerName} (Código: ${partnerCode || 'N/A'})
• Vendedor Comercial Responsável: ${sellerName || 'Não atribuído'}`;

        await callAgendor(`deals/${dealId}/comments`, "POST", apiToken, { text: commentNote });
      } catch (cErr: any) {
        console.warn("[AGENDOR-SYNC] Não foi possível adicionar comentário de resumo no negócio:", cErr.message);
      }
    }

    const sentValueFormatted = dealValue && dealValue > 0 
      ? `R$ ${Number(dealValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : 'Não informado';

    const syncHistoryEntry = {
      id: Math.random().toString(36).substring(2, 11),
      type: "system",
      author_name: "CRM Agendor",
      created_at: new Date().toISOString(),
      content: `[Sincronização CRM Agendor - Funil Pré-Venda / SDR]: Indicação integrada e enviada para o funil "Funil Pré venda - Prospecção" do Agendor CRM com sucesso!

★ DADOS ENVIADOS PARA O CRM:
• Título do Negócio: "${dealTitle}"
• Funil / Categoria: "Funil Pré venda - Prospecção" (SDR)
• Estágio Inicial: "${indData.agendor_stage === 'lead' ? 'Prospecção (SDR)' : (indData.agendor_stage || 'Prospecção')}"
• Empresa (Aba Empresas): "${companyDisplayName}"
• Contato do Cliente: "${realClientName}"
• Telefone de Contato: "${clientPhone || 'Não informado'}"
• Valor Estimado: ${sentValueFormatted}
• Vendedor Comercial: "${sellerName || 'Não atribuído'}"
• Parceiro Indicador: "${partnerName}"

★ DADOS RECEBIDOS DO CRM (REFERÊNCIAS):
• ID do Negócio (Deal ID): ${dealId}
• ID da Empresa (Org ID): ${organizationId || 'Não criada'}
• ID da Pessoa (Person ID): ${personId || 'Não criada'}`
    };

    await db.collection("indications").doc(indicationId).update({
      agendor_synced: true,
      agendor_deal_id: dealId,
      agendor_person_id: personId,
      agendor_organization_id: organizationId,
      agendor_synced_at: new Date().toISOString(),
      negotiation_history: admin.firestore.FieldValue.arrayUnion(syncHistoryEntry)
    });

    const updatedSnap = await db.collection("indications").doc(indicationId).get();
    const updatedData = updatedSnap.data();

    return {
      success: true,
      message: "Indicação integrada e sincronizada no Agendor CRM com sucesso!",
      dealId,
      personId,
      organizationId,
      negotiation_history: updatedData?.negotiation_history || []
    };
  }

  // Helper to pull fresh updates (stage, status, value, comments, tasks, activities, stream) from Agendor CRM for a linked deal
  async function syncAndPullAgendorDetails(indicationId: string, indData: any, apiToken: string) {
    let dealId = indData.agendor_deal_id;
    let dealDetails: any = null;

    if (dealId) {
      try {
        const dealRes = await callAgendor(`deals/${dealId}`, "GET", apiToken);
        if (dealRes && !dealRes.error && (dealRes.id || dealRes.data?.id)) {
          dealDetails = dealRes.data || dealRes;
        }
      } catch (err: any) {
        console.warn(`[AGENDOR-PULL] Negócio #${dealId} não localizado no Agendor CRM:`, err.message);
        dealDetails = null;
      }
    }

    // If dealId is missing OR the deal was not found in Agendor CRM, automatically register/sync it in Agendor CRM!
    if (!dealId || !dealDetails) {
      console.log(`[AGENDOR-PULL] Lead da indicação ${indicationId} não cadastrado ou não encontrado no Agendor CRM. Registrando automaticamente...`);
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
          } catch (e: any) {
            console.warn(`[AGENDOR-PULL] Falha ao obter detalhes do novo negócio #${dealId}:`, e.message);
          }
        } else if (syncRes && syncRes.pending) {
          return { pulled: false, newHistoryCount: 0, message: "Lead em triagem pendente no Roder Indica." };
        }
      } catch (syncErr: any) {
        console.error(`[AGENDOR-PULL] Erro na sincronização automática para o Agendor:`, syncErr.message);
        return { pulled: false, newHistoryCount: 0, message: `Erro ao cadastrar lead no CRM: ${syncErr.message}` };
      }
    }

    if (!dealId) {
      return { pulled: false, newHistoryCount: 0, message: "Sem ID de negócio do Agendor." };
    }

    console.log(`[AGENDOR-PULL] Buscando atualizações e histórico do negócio #${dealId} no Agendor...`);

    const updates: any = {
      agendor_synced: true,
      agendor_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const historyEntriesToAdd: any[] = [];
    const existingHistory: any[] = Array.isArray(indData.negotiation_history) ? indData.negotiation_history : [];

    // Helper to safely extract arrays from various response structures returned by Agendor
    const extractAgendorList = (res: any): any[] => {
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

    // Helper to prevent duplicate entries without false-positives
    const isAlreadyInHistory = (itemId: string | number | undefined, rawText: string) => {
      const cleanText = (rawText || "").trim();
      if (!cleanText) return true;

      const idStr = itemId !== undefined && itemId !== null ? String(itemId).trim() : "";

      const checkMatch = (h: any) => {
        if (!h) return false;
        // Check exact Agendor ID match if available
        if (idStr && (
          h.agendor_id === idStr || 
          h.id === `agendor-${idStr}` || 
          h.id === `agendor-comment-${idStr}` || 
          h.id === `agendor-act-${idStr}` || 
          h.id === `agendor-task-${idStr}` ||
          h.id === `agendor-pcomm-${idStr}` ||
          h.id === `agendor-ocomm-${idStr}`
        )) {
          return true;
        }
        if (idStr && h.content && (h.content.includes(`ID #${idStr}]`) || h.content.includes(`[CRM Agendor #${idStr}]`))) {
          return true;
        }
        // Check content match
        if (h.content) {
          if (h.content === cleanText) return true;
          if (cleanText.length >= 15 && h.content.includes(cleanText)) return true;
        }
        return false;
      };

      return existingHistory.some(checkMatch) || historyEntriesToAdd.some(checkMatch);
    };

    // 1. Fetch current Deal details (GET /deals/{dealId})
    if (!dealDetails) {
      try {
        const dealRes = await callAgendor(`deals/${dealId}`, "GET", apiToken);
        dealDetails = dealRes?.data || dealRes;
      } catch (err: any) {
        console.warn(`[AGENDOR-PULL] Não foi possível obter detalhes do negócio #${dealId}:`, err.message);
      }
    }

    if (dealDetails) {
      const newStage = dealDetails.stage?.id || dealDetails.stage || dealDetails.stage_id;
      if (newStage && typeof newStage === "string" && newStage !== indData.agendor_stage) {
        updates.agendor_stage = newStage;
        const stageLabels: { [key: string]: string } = {
          lead: "Lead (Triagem)",
          contact: "Contato Iniciado",
          proposal: "Proposta / Orçamento Enviado",
          negotiation: "Negociação Em Andamento",
          won: "Ganho / Venda Realizada",
          lost: "Perdido"
        };
        const stageLabel = stageLabels[newStage] || newStage;
        
        historyEntriesToAdd.push({
          id: `agendor-stage-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: "status_change",
          author_name: "CRM Agendor",
          created_at: new Date().toISOString(),
          content: `Estágio da negociação atualizado no Agendor CRM para: "${stageLabel}".`
        });

        const isProposal = newStage.toLowerCase().includes("propos") || 
                           newStage.toLowerCase().includes("orçam") ||
                           newStage.toLowerCase() === "proposal";
        if (isProposal && !indData.budget_sent_at) {
          const now = new Date();
          updates.budget_sent_at = now.toISOString();
          updates.protection_expires_at = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
          historyEntriesToAdd.push({
            id: `agendor-prot-${Date.now()}`,
            type: "status_change",
            author_name: "CRM Agendor",
            created_at: now.toISOString(),
            content: `[Proteção de Vendas 60 dias]: Início da janela de proteção do lead registrado a partir da proposta enviada no Agendor. Válida até ${new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR")}.`
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
            created_at: new Date().toISOString(),
            content: `O negócio foi marcado como GANHO no Agendor CRM!`
          });
        } else if (newStatus === "lost") {
          updates.status = "cancelled";
          historyEntriesToAdd.push({
            id: `agendor-lost-${Date.now()}`,
            type: "status_change",
            author_name: "CRM Agendor",
            created_at: new Date().toISOString(),
            content: `O negócio foi marcado como PERDIDO no Agendor CRM.`
          });
        }
      }

      if (dealDetails.value !== undefined && dealDetails.value !== null) {
        const numVal = parseFloat(dealDetails.value);
        if (numVal > 0 && numVal !== indData.base_commission_value) {
          updates.base_commission_value = numVal;
        }
      }
    }

    // 2. Fetch Deal Comments (/deals/{dealId}/comments & /comments?deal_id={dealId})
    try {
      const rawCommentsRes = await Promise.all([
        callAgendor(`deals/${dealId}/comments`, "GET", apiToken).catch(() => null),
        callAgendor(`comments?deal_id=${dealId}`, "GET", apiToken).catch(() => null),
        callAgendor(`comments?deal=${dealId}`, "GET", apiToken).catch(() => null)
      ]);
      const commentsList = [
        ...extractAgendorList(rawCommentsRes[0]),
        ...extractAgendorList(rawCommentsRes[1]),
        ...extractAgendorList(rawCommentsRes[2])
      ];

      for (const comment of commentsList) {
        const commentId = comment.id || comment.commentId || comment.comment_id;
        const commentText = comment.text || comment.content || comment.note || comment.body || comment.comment || comment.description || comment.details || "";
        if (!commentText.trim()) continue;

        if (!isAlreadyInHistory(commentId, commentText)) {
          const authorName = comment.user?.name || comment.user?.fullName || comment.author?.name || comment.creator?.name || comment.owner?.name || "Vendedor Comercial (CRM Agendor)";
          const commentDate = comment.createdAt || comment.created_at || comment.date || comment.updatedAt || comment.updated_at || new Date().toISOString();
          
          // Parse attachments in comment if any
          const rawAtts = comment.attachments || comment.files || comment.file || [];
          const attsArray = Array.isArray(rawAtts) ? rawAtts : (rawAtts ? [rawAtts] : []);
          const attachments = attsArray
            .filter((a: any) => a && (a.url || a.file_url || a.link))
            .map((a: any) => ({
              name: a.name || a.title || a.filename || "Anexo",
              url: a.url || a.file_url || a.link
            }));

          historyEntriesToAdd.push({
            id: commentId ? `agendor-comment-${commentId}` : `agendor-comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            agendor_id: commentId ? String(commentId) : undefined,
            type: "note",
            author_name: `${authorName}`,
            created_at: commentDate,
            content: `[CRM Agendor${commentId ? ' ID #' + commentId : ''} - ${authorName}]:\n${commentText.trim()}`,
            attachments: attachments.length > 0 ? attachments : undefined
          });
        }
      }
    } catch (commErr: any) {
      console.warn(`[AGENDOR-PULL] Não foi possível buscar comentários para #${dealId}:`, commErr.message);
    }

    // 3. Fetch Deal Activities & Stream (/deals/{dealId}/activities, /deals/{dealId}/stream, /deals/{dealId}/history)
    try {
      const rawActRes = await Promise.all([
        callAgendor(`deals/${dealId}/activities`, "GET", apiToken).catch(() => null),
        callAgendor(`activities?deal_id=${dealId}`, "GET", apiToken).catch(() => null),
        callAgendor(`deals/${dealId}/stream`, "GET", apiToken).catch(() => null),
        callAgendor(`deals/${dealId}/history`, "GET", apiToken).catch(() => null),
        callAgendor(`deals/${dealId}/timeline`, "GET", apiToken).catch(() => null)
      ]);
      const actList = [
        ...extractAgendorList(rawActRes[0]),
        ...extractAgendorList(rawActRes[1]),
        ...extractAgendorList(rawActRes[2]),
        ...extractAgendorList(rawActRes[3]),
        ...extractAgendorList(rawActRes[4])
      ];

      for (const act of actList) {
        const actId = act.id || act.activityId || act.activity_id || act.historyId;
        const actText = act.text || act.content || act.note || act.description || act.body || act.title || act.summary || act.details || "";
        if (!actText.trim()) continue;

        if (!isAlreadyInHistory(actId, actText)) {
          const authorName = act.user?.name || act.author?.name || act.creator?.name || act.owner?.name || "Vendedor Comercial (CRM Agendor)";
          const actDate = act.createdAt || act.created_at || act.date || act.updatedAt || act.time || new Date().toISOString();
          const actType = act.type || act.category || act.activity_type || "Histórico/Atividade";

          // Parse attachments in activity if any
          const rawAtts = act.attachments || act.files || act.file || [];
          const attsArray = Array.isArray(rawAtts) ? rawAtts : (rawAtts ? [rawAtts] : []);
          const attachments = attsArray
            .filter((a: any) => a && (a.url || a.file_url || a.link))
            .map((a: any) => ({
              name: a.name || a.title || a.filename || "Anexo",
              url: a.url || a.file_url || a.link
            }));

          historyEntriesToAdd.push({
            id: actId ? `agendor-act-${actId}` : `agendor-act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            agendor_id: actId ? String(actId) : undefined,
            type: "note",
            author_name: `${authorName}`,
            created_at: actDate,
            content: `[CRM Agendor (${actType})${actId ? ' ID #' + actId : ''} - ${authorName}]:\n${actText.trim()}`,
            attachments: attachments.length > 0 ? attachments : undefined
          });
        }
      }
    } catch (actErr: any) {
      console.warn(`[AGENDOR-PULL] Não foi possível buscar atividades/stream para #${dealId}:`, actErr.message);
    }

    // 4. Fetch Tasks & Activities (/v3/tasks & /deals/{dealId}/tasks)
    try {
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const rawTasksRes = await Promise.all([
        callAgendor(`deals/${dealId}/tasks`, "GET", apiToken).catch(() => null),
        callAgendor(`deals/${dealId}/tasks?status=all`, "GET", apiToken).catch(() => null),
        callAgendor(`tasks?deal_id=${dealId}`, "GET", apiToken).catch(() => null),
        callAgendor(`tasks?deal=${dealId}`, "GET", apiToken).catch(() => null),
        callAgendor(`tasks?createdDateGt=${sixtyDaysAgo}`, "GET", apiToken).catch(() => null),
        callAgendor(`tasks?status=all&createdDateGt=${sixtyDaysAgo}`, "GET", apiToken).catch(() => null)
      ]);

      const tasksList = [
        ...extractAgendorList(rawTasksRes[0]),
        ...extractAgendorList(rawTasksRes[1]),
        ...extractAgendorList(rawTasksRes[2]),
        ...extractAgendorList(rawTasksRes[3]),
        ...extractAgendorList(rawTasksRes[4]),
        ...extractAgendorList(rawTasksRes[5])
      ];

      const targetOrgId = dealDetails?.organization?.id || dealDetails?.organization_id ? String(dealDetails?.organization?.id || dealDetails?.organization_id) : null;
      const targetPersonId = dealDetails?.person?.id || dealDetails?.person_id ? String(dealDetails?.person?.id || dealDetails?.person_id) : null;
      const targetDealId = dealId ? String(dealId) : null;

      for (const task of tasksList) {
        const taskId = task.id || task.taskId || task.task_id;
        const taskText = task.text || task.title || task.description || task.note || task.content || "";
        if (!taskText.trim()) continue;

        // Safely extract deal/org/person IDs (support objects, strings, numbers)
        const taskDealId = typeof task.deal === "object" ? String(task.deal?.id || task.deal?.deal_id || "") : String(task.deal || task.deal_id || task.dealId || "");
        const taskOrgId = typeof task.organization === "object" ? String(task.organization?.id || "") : String(task.organization || task.organization_id || "");
        const taskPersonId = typeof task.person === "object" ? String(task.person?.id || "") : String(task.person || task.person_id || "");

        const isMatch = (targetDealId && (taskDealId === targetDealId || taskDealId.includes(targetDealId))) ||
                        (targetOrgId && taskOrgId === targetOrgId) ||
                        (targetPersonId && taskPersonId === targetPersonId);

        if (isMatch && !isAlreadyInHistory(taskId, taskText)) {
          const authorName = task.finishedBy?.name || task.user?.name || task.assignedTo?.name || task.author?.name || "Vendedor Comercial (CRM Agendor)";
          const taskDate = task.finishedAt || task.createdAt || task.updatedAt || task.dueDate || new Date().toISOString();
          const taskType = task.type || task.category || "WhatsApp / Ligação";

          // Parse attachments in task if any
          const rawAtts = task.attachments || task.files || task.file || [];
          const attsArray = Array.isArray(rawAtts) ? rawAtts : (rawAtts ? [rawAtts] : []);
          const attachments = attsArray
            .filter((a: any) => a && (a.url || a.file_url || a.link))
            .map((a: any) => ({
              name: a.name || a.title || a.filename || "Anexo",
              url: a.url || a.file_url || a.link
            }));

          historyEntriesToAdd.push({
            id: taskId ? `agendor-task-${taskId}` : `agendor-task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            agendor_id: taskId ? String(taskId) : undefined,
            type: "note",
            author_name: authorName,
            created_at: taskDate,
            content: `[CRM Agendor (${taskType})${task.finished ? ' ✓ Finalizada' : ''} - ${authorName}]:\n${taskText.trim()}`,
            attachments: attachments.length > 0 ? attachments : undefined
          });
        }
      }
    } catch (taskErr: any) {
      console.warn(`[AGENDOR-PULL] Não foi possível buscar tarefas/atividades para #${dealId}:`, taskErr.message);
    }

    // 5. Fetch Person Comments & Activities if personId exists
    const personId = indData.agendor_person_id || dealDetails?.person?.id || dealDetails?.person;
    if (personId) {
      try {
        const pComments = await callAgendor(`people/${personId}/comments`, "GET", apiToken).catch(() => null);
        const pList = extractAgendorList(pComments);
        for (const comment of pList) {
          const commentId = comment.id || comment.commentId || comment.comment_id;
          const commentText = comment.text || comment.content || comment.note || comment.body || comment.comment || comment.description || "";
          if (!commentText.trim()) continue;

          if (!isAlreadyInHistory(commentId, commentText)) {
            const authorName = comment.user?.name || comment.author?.name || "Vendedor Comercial (CRM Agendor)";
            const commentDate = comment.createdAt || comment.created_at || comment.date || new Date().toISOString();

            historyEntriesToAdd.push({
              id: commentId ? `agendor-pcomm-${commentId}` : `agendor-pcomm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              agendor_id: commentId ? String(commentId) : undefined,
              type: "note",
              author_name: `${authorName}`,
              created_at: commentDate,
              content: `[CRM Agendor (Contato)${commentId ? ' ID #' + commentId : ''} - ${authorName}]:\n${commentText.trim()}`
            });
          }
        }
      } catch (pCommErr: any) {
        console.warn(`[AGENDOR-PULL] Não foi possível buscar comentários do contato #${personId}:`, pCommErr.message);
      }
    }

    // 6. Fetch Organization Comments & Activities if organizationId exists
    const organizationId = indData.agendor_organization_id || dealDetails?.organization?.id || dealDetails?.organization;
    if (organizationId) {
      try {
        const oComments = await callAgendor(`organizations/${organizationId}/comments`, "GET", apiToken).catch(() => null);
        const oList = extractAgendorList(oComments);
        for (const comment of oList) {
          const commentId = comment.id || comment.commentId || comment.comment_id;
          const commentText = comment.text || comment.content || comment.note || comment.body || comment.comment || comment.description || "";
          if (!commentText.trim()) continue;

          if (!isAlreadyInHistory(commentId, commentText)) {
            const authorName = comment.user?.name || comment.author?.name || "Vendedor Comercial (CRM Agendor)";
            const commentDate = comment.createdAt || comment.created_at || comment.date || new Date().toISOString();

            historyEntriesToAdd.push({
              id: commentId ? `agendor-ocomm-${commentId}` : `agendor-ocomm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              agendor_id: commentId ? String(commentId) : undefined,
              type: "note",
              author_name: `${authorName}`,
              created_at: commentDate,
              content: `[CRM Agendor (Empresa)${commentId ? ' ID #' + commentId : ''} - ${authorName}]:\n${commentText.trim()}`
            });
          }
        }
      } catch (oCommErr: any) {
        console.warn(`[AGENDOR-PULL] Não foi possível buscar comentários da organização #${organizationId}:`, oCommErr.message);
      }
    }

    // Save updates & new history entries into Firestore
    if (historyEntriesToAdd.length > 0) {
      updates.negotiation_history = admin.firestore.FieldValue.arrayUnion(...historyEntriesToAdd);
    }

    await db.collection("indications").doc(indicationId).update(updates);

    return {
      pulled: true,
      newHistoryCount: historyEntriesToAdd.length,
      updates
    };
  }

  // Route to push notes & photos added in Roder Indica directly to Agendor CRM
  app.post("/api/agendor/add-comment", async (req, res) => {
    try {
      const { indicationId, content, authorName, attachments } = req.body;
      if (!indicationId) {
        return res.status(400).json({ error: "Parâmetro 'indicationId' é obrigatório." });
      }

      console.log(`[AGENDOR-COMMENT] Novo acompanhamento recebido para indicação #${indicationId}. Sincronizando com Agendor CRM...`);

      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) {
        return res.status(400).json({ error: "Integração com Agendor não configurada." });
      }
      const agendorConfig = settingsSnap.data() as any;
      if (!agendorConfig.apiToken || !agendorConfig.enabled) {
        return res.status(400).json({ error: "Integração com Agendor desabilitada ou sem token." });
      }

      const apiToken = agendorConfig.apiToken;

      const indSnap = await db.collection("indications").doc(indicationId).get();
      if (!indSnap.exists) {
        return res.status(404).json({ error: "Indicação não encontrada." });
      }
      const indData = indSnap.data() as any;

      const dealId = indData.agendor_deal_id;
      const personId = indData.agendor_person_id;
      const organizationId = indData.agendor_organization_id;

      // Build formatted comment text to push to Agendor CRM
      let commentText = `[Acompanhamento RODER Indica - ${authorName || 'Parceiro/Vendedor'}]\n${content || ''}`;
      if (Array.isArray(attachments) && attachments.length > 0) {
        commentText += `\n\n📷 Anexos/Fotos (${attachments.length}):\n` + attachments.map((a: any) => `- ${a.name || 'Arquivo'}: ${a.url}`).join('\n');
      }

      let pushed = false;
      let pushError = null;

      // 1. Push comment to Deal if dealId exists
      if (dealId) {
        try {
          await callAgendor(`deals/${dealId}/comments`, "POST", apiToken, { text: commentText });
          pushed = true;
          console.log(`[AGENDOR-COMMENT] Comentário enviado com sucesso para o negócio #${dealId}`);
        } catch (err1: any) {
          console.warn(`[AGENDOR-COMMENT] Falha em /deals/${dealId}/comments, tentando /comments:`, err1.message);
          try {
            await callAgendor(`comments`, "POST", apiToken, { deal_id: Number(dealId), text: commentText });
            pushed = true;
            console.log(`[AGENDOR-COMMENT] Comentário enviado via /comments para o negócio #${dealId}`);
          } catch (err2: any) {
            pushError = err2.message;
            console.error(`[AGENDOR-COMMENT] Erro ao postar comentário no negócio:`, err2.message);
          }
        }
      }

      // 2. Also push comment to Organization if organizationId exists
      if (organizationId) {
        try {
          await callAgendor(`organizations/${organizationId}/comments`, "POST", apiToken, { text: commentText });
          pushed = true;
          console.log(`[AGENDOR-COMMENT] Comentário enviado com sucesso para a empresa #${organizationId}`);
        } catch (oErr: any) {
          console.warn(`[AGENDOR-COMMENT] Falha em /organizations/${organizationId}/comments:`, oErr.message);
        }
      }

      // 3. Fallback to Person if dealId/org wasn't present or failed
      if (!pushed && personId) {
        try {
          await callAgendor(`people/${personId}/comments`, "POST", apiToken, { text: commentText });
          pushed = true;
          console.log(`[AGENDOR-COMMENT] Comentário enviado com sucesso para a pessoa #${personId}`);
        } catch (pErr: any) {
          console.warn(`[AGENDOR-COMMENT] Falha em /people/${personId}/comments:`, pErr.message);
        }
      }

      // Re-trigger syncAndPullAgendorDetails to sync back and pull any newest updates from Agendor
      const pullResult = await syncAndPullAgendorDetails(indicationId, indData, apiToken);

      return res.json({ success: true, pushed, pushError, pullResult });
    } catch (err: any) {
      console.error("[AGENDOR-COMMENT] Erro ao enviar comentário para o Agendor:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // 2. Synchronize an Indication as a Lead/Deal in Agendor
  app.post("/api/agendor/sync-indication", async (req, res) => {
    try {
      const { indicationId, forceSyncDeal } = req.body;
      if (!indicationId) {
        return res.status(400).json({ error: "ID da indicação não fornecido." });
      }

      // Load Agendor Token from global settings
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) {
        return res.status(400).json({ error: "Configurações de integração com Agendor não encontradas no banco de dados." });
      }

      const agendorConfig = settingsSnap.data() as any;
      if (!agendorConfig.apiToken || !agendorConfig.enabled) {
        return res.status(400).json({ error: "Integração com Agendor desabilitada ou Token de API ausente." });
      }

      const apiToken = agendorConfig.apiToken;

      // Load indication document
      const indSnap = await db.collection("indications").doc(indicationId).get();
      if (!indSnap.exists) {
        return res.status(404).json({ error: "Indicação não encontrada no banco." });
      }

      const indData = indSnap.data() as any;

      const syncResult = await executeAgendorSync(indicationId, indData, apiToken, forceSyncDeal !== false);

      // Instantly pull latest tasks, comments, and activities from Agendor into negotiation_history
      if (syncResult && syncResult.dealId) {
        const freshSnap = await db.collection("indications").doc(indicationId).get();
        const freshData = freshSnap.data();
        if (freshData) {
          await syncAndPullAgendorDetails(indicationId, freshData, apiToken).catch((pErr) => {
            console.warn("[AGENDOR-SYNC] Falha ao puxar histórico pós-sincronização:", pErr.message);
          });
        }
      }

      const finalSnap = await db.collection("indications").doc(indicationId).get();
      const finalData = finalSnap.data();

      return res.json({
        ...syncResult,
        negotiation_history: finalData?.negotiation_history || syncResult.negotiation_history || []
      });

    } catch (err: any) {
      console.error("[AGENDOR-SYNC] Erro geral de sincronização:", err.message);
      return res.status(500).json({ error: err.message || "Erro interno ao sincronizar com Agendor." });
    }
  });

  // 2.4. Pull latest details & activities from Agendor CRM
  app.post("/api/agendor/pull-details", async (req, res) => {
    try {
      const { indicationId } = req.body;
      if (!indicationId) {
        return res.status(400).json({ error: "ID da indicação não fornecido." });
      }

      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) {
        return res.status(400).json({ error: "Configurações do Agendor não encontradas." });
      }
      const agendorConfig = settingsSnap.data() || {};
      if (!agendorConfig.apiToken) {
        return res.status(400).json({ error: "Token de API do Agendor não configurado." });
      }

      const indSnap = await db.collection("indications").doc(indicationId).get();
      if (!indSnap.exists) {
        return res.status(404).json({ error: "Indicação não encontrada no banco de dados." });
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
    } catch (err: any) {
      console.error("[AGENDOR-PULL] Erro ao buscar detalhes do Agendor:", err.message);
      return res.status(500).json({ error: err.message || "Erro interno ao buscar histórico do Agendor." });
    }
  });

  // 2.5. Import and parse PDF files/attachments from Agendor CRM
  app.post("/api/agendor/import-files", async (req, res) => {
    try {
      const { indicationId } = req.body;
      if (!indicationId) {
        return res.status(400).json({ error: "ID da indicação não fornecido." });
      }

      // Load Agendor Token from global settings
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) {
        return res.status(400).json({ error: "Configurações de integração com Agendor não encontradas." });
      }

      const agendorConfig = settingsSnap.data() as any;
      if (!agendorConfig.apiToken || !agendorConfig.enabled) {
        return res.status(400).json({ error: "Integração com Agendor desabilitada ou Token ausente." });
      }

      const apiToken = agendorConfig.apiToken;

      // Load indication document
      const indSnap = await db.collection("indications").doc(indicationId).get();
      if (!indSnap.exists) {
        return res.status(404).json({ error: "Indicação não encontrada no banco." });
      }

      const indData = indSnap.data() as any;
      const dealId = indData.agendor_deal_id;
      if (!dealId) {
        return res.status(400).json({ error: "Esta indicação não possui um ID de negócio do Agendor associado. Por favor, sincronize a indicação primeiro." });
      }

      // 1. Pull fresh comments, tasks, stage, status, and update agendor_synced_at first
      const pullResult = await syncAndPullAgendorDetails(indicationId, indData, apiToken);

      console.log(`[AGENDOR-IMPORT] Iniciando busca de anexos para o negócio #${dealId}...`);

      const pdfFiles: Array<{ name: string, url: string, date?: string }> = [];

      // A. Try /deals/{dealId}/files
      try {
        const filesRes = await callAgendor(`deals/${dealId}/files`, "GET", apiToken);
        const filesArray = Array.isArray(filesRes) ? filesRes : (filesRes.data || []);
        if (Array.isArray(filesArray)) {
          filesArray.forEach((f: any) => {
            if (f && f.url && (f.url.toLowerCase().includes(".pdf") || (f.name && f.name.toLowerCase().endsWith(".pdf")))) {
              pdfFiles.push({
                name: f.name || "arquivo.pdf",
                url: f.url,
                date: f.created_at || f.createdAt || new Date().toISOString()
              });
            }
          });
        }
      } catch (err: any) {
        console.warn("[AGENDOR-IMPORT] Não foi possível obter arquivos de /files:", err.message);
      }

      // B. Try /deals/{dealId}/comments
      try {
        const commentsRes = await callAgendor(`deals/${dealId}/comments`, "GET", apiToken);
        const commentsArray = Array.isArray(commentsRes) ? commentsRes : (commentsRes.data || []);
        if (Array.isArray(commentsArray)) {
          commentsArray.forEach((c: any) => {
            const attachments = c.attachments || c.files || [];
            if (Array.isArray(attachments)) {
              attachments.forEach((att: any) => {
                if (att && att.url && (att.url.toLowerCase().includes(".pdf") || (att.name && att.name.toLowerCase().endsWith(".pdf")))) {
                  pdfFiles.push({
                    name: att.name || "comentario_anexo.pdf",
                    url: att.url,
                    date: att.created_at || att.createdAt || c.created_at || c.createdAt || new Date().toISOString()
                  });
                }
              });
            }
          });
        }
      } catch (err: any) {
        console.warn("[AGENDOR-IMPORT] Não foi possível obter anexos de /comments:", err.message);
      }

      if (pdfFiles.length === 0) {
        const historyMsg = pullResult.newHistoryCount && pullResult.newHistoryCount > 0
          ? `Sincronizados ${pullResult.newHistoryCount} novo(s) registro(s) de histórico/comentários do CRM Agendor!`
          : `Histórico e horário de verificação do CRM Agendor atualizados com sucesso!`;

        return res.json({ 
          success: true,
          message: `${historyMsg} (Nota: Nenhum orçamento ou pedido em PDF foi localizado anexado ao negócio no Agendor).`,
          pdfFound: false,
          newHistoryCount: pullResult.newHistoryCount || 0
        });
      }

      // Sort by date descending to get the latest file
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
        return res.status(500).json({ error: "Chave GEMINI_API_KEY não configurada no servidor." });
      }

      const prompt = `Analise este pedido de venda/orçamento em PDF e extraia as seguintes informações:
      1. O valor total da venda/pedido (procurado em "Total Pedido", "Valor total com ajuste de frete" ou "Valor total").
      2. O nome/razão social do cliente ("Cliente"). Se tiver um código numérico antes (ex: "4235 - Eucazin Ltda"), extraia o código separado e limpe o nome.
      3. O prazo de entrega do pedido (procurado em "PRAZO DE ENTREGA" ou "data de entrega"), trazendo no formato DD/MM/YYYY (ex: "13/07/2026").
      4. O número do pedido de venda (e.g., procurado no título como "Pedido de Venda nº 9414"). Traga como inteiro ou texto limpo (ex: "9414").
      5. A data em que o pedido de venda foi feito/gerado (procurada na coluna ou rótulo "Data" na linha do cliente ou próximo à coluna endereço, ex: "28/05/2026"). Traga no formato de data DD/MM/YYYY.
      6. O CNPJ ou CPF do cliente (procurado em "CNPJ" ou "CPF/CNPJ", ex: "59.317.231/0001-76").
      7. O código do cliente (procurado na linha ou campo "Cliente" antes do nome ou em campo separado, ex: "4235").
      8. O apelido ou Nome Abreviado do cliente (procurado in "Apelido/Nome Abrev.", ex: "Eucazin Ltda").
      9. O e-mail de contato do cliente (procurado na linha de contato, ex: "financeiro@fazendadocarmo.com").
      10. O telefone ou celular do cliente (procurado na linha de contato ou telefone, ex: "62 9278-6496" ou "(14) 3161-5110").
      11. O endereço do cliente (procurado no campo "Endereço").
      12. A lista completa de todos os itens contidos na tabela de itens do pedido. Para cada item extraia:
         - O código do produto exatamente como está (ex: "1000.1484.0000" ou "9000.9000.9027").
         - A descrição ou nome do produto.
         - A quantidade (número).
         - O preço unitário (número).
      
      Responda em formato de objeto JSON estruturado.`;

      console.log("[AGENDOR-IMPORT] Enviando PDF para análise do Gemini...");
      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: prompt },
          { inlineData: { data: fileBase64, mimeType: "application/pdf" } }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sale_value: { type: Type.NUMBER, description: "Total value of the budget/order" },
              client_name: { type: Type.STRING, description: "Client's corporate or full name" },
              delivery_date: { type: Type.STRING, description: "Delivery date strictly in DD/MM/YYYY format" },
              order_number: { type: Type.STRING, description: "Sales order number extracted (e.g. 9414)" },
              order_date: { type: Type.STRING, description: "Sales order generation date in DD/MM/YYYY format" },
              client_cnpj: { type: Type.STRING, description: "Customer's CNPJ or CPF (e.g. 59.317.231/0001-76)" },
              client_code: { type: Type.STRING, description: "Customer's code (e.g. 4235)" },
              company_name: { type: Type.STRING, description: "Customer's short/abbreviated name (e.g. Eucazin Ltda)" },
              client_email: { type: Type.STRING, description: "Customer's email (e.g. financeiro@fazendadocarmo.com)" },
              client_phone: { type: Type.STRING, description: "Customer's phone / cellular (e.g. 62 9278-6496)" },
              client_address: { type: Type.STRING, description: "Customer's complete address" },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    code: { type: Type.STRING, description: "Product code (e.g. 1000.1484.0000)" },
                    name: { type: Type.STRING, description: "Product description/name" },
                    quantity: { type: Type.NUMBER, description: "Exact quantity" },
                    unit_price: { type: Type.NUMBER, description: "Unit price of the product" }
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
        return res.status(500).json({ error: "Falha na decodificação do retorno estruturado do Gemini." });
      }
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("[AGENDOR-IMPORT] Análise concluída com sucesso. Itens extraídos:", (parsed.items || []).length);

      // Detect if Sales Order or Budget
      const isSalesOrder = targetFile.name.toLowerCase().includes("pedido") || 
                           targetFile.name.toLowerCase().includes("venda") ||
                           targetFile.name.toLowerCase().includes("order") ||
                           !!parsed.order_number;

      // Determine commission rate for partner
      let commissionRate = 5; // Default is 5%
      const partnerId = indData.external_seller_uid || indData.creator_uid;
      if (partnerId) {
        const partnerSnap = await db.collection("users").doc(partnerId).get();
        if (partnerSnap.exists) {
          const partnerData = partnerSnap.data() || {};
          if (partnerData.commission_rate !== undefined && partnerData.commission_rate !== null) {
            commissionRate = Number(partnerData.commission_rate);
          }
        }
      }

      // Map products and calculate total commissionable base value
      let totalCommissionable = 0;
      const mappedProducts = (parsed.items || []).map((item: any) => {
        const code = (item.code || "").trim();
        // Kit codes start with "9000" and are NOT commissionable
        const isComm = code && !code.startsWith("9000");
        const price = item.unit_price || 0;
        const qty = item.quantity || 1;
        if (isComm) {
          totalCommissionable += price * qty;
        }
        return {
          code,
          name: item.name || "Equipamento não cadastrado",
          quantity: qty,
          base_value: price,
          is_commissionable: isComm,
          uniqueId: `${code || 'item'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
        };
      });

      const finalCommission = totalCommissionable * (commissionRate / 100);

      const updates: any = {
        commissioned_products: mappedProducts,
        base_commission_value: totalCommissionable,
        commission_rate_applied: commissionRate,
        commission_value: finalCommission,
        updated_at: new Date().toISOString()
      };

      if (isSalesOrder) {
        updates.sales_order_loaded = true;
        updates.sale_value = parsed.sale_value;
        if (parsed.order_number) updates.order_number = parsed.order_number;
        if (parsed.order_date) updates.order_date = parsed.order_date;
        updates.status = "sold"; // Mark as faturado/sold automatically if order parsed!
      } else {
        updates.budget_loaded = true;
        updates.gross_budget_value = parsed.sale_value;
        if (parsed.order_number) updates.budget_number = parsed.order_number;
        if (parsed.order_date) updates.budget_date = parsed.order_date;
      }

      // Sync Client registration fields if not yet filled
      if (!indData.client_cnpj && parsed.client_cnpj) updates.client_cnpj = parsed.client_cnpj;
      if (!indData.client_name && parsed.client_name) updates.client_name = parsed.client_name;
      if (!indData.client_phone && parsed.client_phone) updates.client_phone = parsed.client_phone;
      if (!indData.client_email && parsed.client_email) updates.client_email = parsed.client_email;
      if (!indData.client_address && parsed.client_address) updates.client_address = parsed.client_address;

      // History entry
      const syncHistoryEntry = {
        id: Math.random().toString(36).substring(2, 11),
        type: "status_change",
        author_name: "Roder IA Automatizada",
        created_at: new Date().toISOString(),
        content: `Documento [${targetFile.name}] importado e analisado via CRM Agendor! Tipo identificado: ${isSalesOrder ? 'Pedido de Venda' : 'Orçamento'}. Foram faturados ${mappedProducts.length} itens. Base Comissionável: R$ ${totalCommissionable.toLocaleString("pt-BR", {minimumFractionDigits: 2})}. Alíquota do Indicador Parceiro: ${commissionRate}%. Comissão Calculada: R$ ${finalCommission.toLocaleString("pt-BR", {minimumFractionDigits: 2})}.`
      };

      updates.negotiation_history = admin.firestore.FieldValue.arrayUnion(syncHistoryEntry);

      await db.collection("indications").doc(indicationId).update(updates);

      return res.json({
        success: true,
        message: `Importação realizada com sucesso! Documento analisado: ${targetFile.name} (${isSalesOrder ? 'Pedido de Venda' : 'Orçamento Orçado'}).`,
        isSalesOrder,
        parsedData: parsed,
        totalCommissionable,
        commissionRate,
        finalCommission
      });

    } catch (err: any) {
      console.error("[AGENDOR-IMPORT] Erro ao importar arquivos:", err.message);
      return res.status(500).json({ error: err.message || "Erro interno ao processar a importação do CRM." });
    }
  });


  // 3. Search and Match Client in Agendor CRM
  app.get("/api/agendor/search-client", async (req, res) => {
    try {
      const { cnpj, phone, name, code } = req.query;
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) {
        return res.status(400).json({ error: "Integração com Agendor não configurada." });
      }
      const agendorConfig = settingsSnap.data() as any;
      if (!agendorConfig.apiToken || !agendorConfig.enabled) {
        return res.status(400).json({ error: "Integração desabilitada ou sem Token de API." });
      }

      const apiToken = agendorConfig.apiToken;

      // 1. Precedence: Search by Code / ID / Agendor URL
      if (code) {
        let rawInput = String(code).trim();
        let extractedId = "";

        // Check if input is a full Agendor URL or Agendor Deal Email (e.g. sdr-163494n44477683@to.agendor.com.br)
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
          // A) Try fetching Deal first (if user pasted a Deal ID or Deal URL)
          try {
            const dealRes = await callAgendor(`deals/${extractedId}`, "GET", apiToken);
            const deal = dealRes?.data || dealRes;
            if (deal && (deal.id || deal.title)) {
              console.log(`[AGENDOR-SEARCH] Negócio localizado por ID #${extractedId}: ${deal.title}`);
              return res.json({
                success: true,
                found: true,
                source: "deal_id",
                type: "deal",
                deal_id: deal.id || extractedId,
                id: deal.organization?.id || deal.organization || deal.person?.id || deal.person || extractedId,
                name: deal.title || deal.organization?.name || deal.person?.name || `Negócio #${extractedId}`,
                company_name: deal.organization?.name || deal.title || `Negócio #${extractedId}`,
                cnpj: deal.organization?.cnpj || "",
                phone: deal.organization?.phones?.[0]?.number || deal.person?.phones?.[0]?.number || "",
                email: deal.organization?.emails?.[0]?.email || deal.person?.emails?.[0]?.email || "",
                address: deal.organization?.address ? `${deal.organization.address.city || ""}/${deal.organization.address.state || ""}` : "",
                client_code: String(deal.id || extractedId)
              });
            }
          } catch (dErr: any) {
            console.log(`[AGENDOR-SEARCH] ID #${extractedId} não é um negócio válido, tentando Empresa...`);
          }

          // B) Try fetching Organization
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
            // C) Try fetching Person
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

        // Try general search with code or raw input
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

      // 2. Precedence: CNPJ
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
          } catch (cnpjErr: any) {
            console.error("[AGENDOR-SEARCH] CNPJ lookup failed:", cnpjErr.message);
          }
        }
      }

      // 3. Precedence: Phone number
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

            // Also try organization search by phone
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
          } catch (phoneErr: any) {
            console.error("[AGENDOR-SEARCH] Phone lookup failed:", phoneErr.message);
          }
        }
      }

      // 4. Precedence: Name
      if (name) {
        const cleanName = String(name).trim();
        if (cleanName.length >= 3) {
          try {
            // Try searching organization first
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

            // Try searching person
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
          } catch (nameErr: any) {
            console.error("[AGENDOR-SEARCH] Name lookup failed:", nameErr.message);
          }
        }
      }

      return res.json({ success: true, found: false });
    } catch (err: any) {
      console.error("[AGENDOR-SEARCH-CLIENT] Erro geral de busca:", err.message);
      return res.status(500).json({ error: err.message || "Erro interno ao buscar cliente." });
    }
  });

  // 4. Search Contacts (People) from Agendor
  app.get("/api/agendor/contacts", async (req, res) => {
    try {
      const q = req.query.q as string || "";
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) {
        return res.status(400).json({ error: "Integração com Agendor não configurada." });
      }
      const agendorConfig = settingsSnap.data() as any;
      if (!agendorConfig.apiToken || !agendorConfig.enabled) {
        return res.status(400).json({ error: "Integração desabilitada ou sem Token de API." });
      }

      const apiToken = agendorConfig.apiToken;
      const endpoint = q ? `people?q=${encodeURIComponent(q)}` : "people?limit=15";
      const people = await callAgendor(endpoint, "GET", apiToken);

      return res.json({ success: true, contacts: people });
    } catch (err: any) {
      console.error("[AGENDOR-CONTACTS] Erro ao buscar contatos:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // Internal helper to send automatic emails from server-side triggers (like Agendor webhooks)
  async function sendNotificationEmail(to: string, subject: string, html: string, fromName?: string) {
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
        console.warn("[SEND-NOTIFICATION] Configurações de e-mail não encontradas no sistema.");
        return;
      }

      if (settings.provider === "gmail") {
        const transporter = nodemailer.createTransport({
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
        const resend = new Resend(settings.apiKey);
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
        const transporter = nodemailer.createTransport({
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
    } catch (err: any) {
      console.error("[SEND-NOTIFICATION] Erro ao enviar e-mail:", err.message);
    }
  }

  // Internal helper to format and send partnership notification emails from webhook changes
  async function sendPartnerNotificationFromWebhook(indData: any, type: "budget_sent" | "sold" | "lost", updates: any) {
    let partnerEmail = indData.external_seller_email || "";
    let partnerName = indData.external_seller_name || "Parceiro";

    if (indData.external_seller_uid) {
      try {
        const partnerSnap = await db.collection("users").doc(indData.external_seller_uid).get();
        if (partnerSnap.exists) {
          const pData = partnerSnap.data() as any;
          partnerEmail = pData.email || partnerEmail;
          partnerName = pData.name || partnerName;
        }
      } catch (err: any) {
        console.error("[AGENDOR-WEBHOOK] Erro ao obter e-mail do parceiro para notificação:", err.message);
      }
    }

    if (!partnerEmail || partnerEmail.includes("@mobile.roder.com.br") || !partnerEmail.includes("@")) {
      console.log(`[AGENDOR-WEBHOOK] Notificação de e-mail pulada: e-mail inválido ou de simulação (${partnerEmail})`);
      return;
    }

    let subject = "";
    let html = "";
    let headerColor = "#f97316";

    const sellerName = indData.internal_seller_name || "Vendedor Roder";

    if (type === "budget_sent") {
      subject = `Orçamento Enviado: Sua indicação de ${indData.client_name}`;
      html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f97316; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; text-transform: uppercase;">Orçamento Enviado ao Cliente!</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Sua indicação está avançando no comercial da RODER (via CRM)</p>
          </div>
          
          <div style="padding: 24px; line-height: 1.6;">
            <p>Olá <strong>${partnerName}</strong>,</p>
            
            <p>Temos ótimas notícias! O orçamento técnico-comercial foi enviado com sucesso para o cliente <strong>${indData.client_name}</strong> referente ao equipamento <strong>${indData.product_name || "equipamento solicitado"}</strong>.</p>
            
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; font-weight: bold; color: #b45309; font-size: 15px;">"Esperamos que esta venda seja concluída!"</p>
            </div>

            <p><strong>Acompanhamento da Negociação:</strong></p>
            <p>A plataforma <strong>RODER Indica</strong> é o seu canal oficial exclusivo para verificar o progresso, ver o status atualizado e acompanhar os seus ganhos em tempo real.</p>
            
            <div style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 15px;">
              <p>O vendedor responsável pelo atendimento é <strong>${sellerName}</strong>.</p>
            </div>
            
            <p style="font-size: 13px; color: #666; margin-top: 25px;">Qualquer alteração relevante de status na negociação será enviada automaticamente para o seu e-mail.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">Roder Máquinas e Equipamentos Ltda.<br>Este é um e-mail automático de acompanhamento de parceria.</p>
          </div>
        </div>
      `;
    } else if (type === "sold") {
      headerColor = "#22c55e";
      subject = `🎉 PARABÉNS! Sua indicação de ${indData.client_name} foi CONCLUÍDA!`;
      html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${headerColor}; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; text-transform: uppercase;">Venda Concluída!</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Excelente parceria comercial com a RODER</p>
          </div>
          
          <div style="padding: 24px; line-height: 1.6;">
            <p>Olá <strong>${partnerName}</strong>,</p>
            
            <p>Gostaríamos de informar que a sua indicação para <strong>${indData.client_name}</strong> foi marcada como <strong>GANHA (Concluída)</strong> no CRM Agendor!</p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; font-weight: bold; color: #15803d; font-size: 15px;">Negócio Fechado!</p>
              <p style="margin: 5px 0 0 0; color: #166534; font-size: 13px;">O negócio foi fechado com sucesso! A comissão correspondente à sua indicação será liberada e processada no sistema do Roder Indica assim que finalizado o faturamento interno pela nossa equipe comercial.</p>
            </div>

            <p><strong>Canal de Acompanhamento:</strong></p>
            <p>Acesse o portal do <strong>RODER Indica</strong> para verificar o progresso detalhado de suas negociações, o histórico e os valores de comissões agendadas.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">Roder Máquinas e Equipamentos Ltda.<br>Informativo automático de parceria.</p>
          </div>
        </div>
      `;
    } else if (type === "lost") {
      headerColor = "#ef4444";
      subject = `Atualização: Indicação de ${indData.client_name} finalizada`;
      html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${headerColor}; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; text-transform: uppercase;">Atualização de Status</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Negociação Encerrada</p>
          </div>
          
          <div style="padding: 24px; line-height: 1.6;">
            <p>Olá <strong>${partnerName}</strong>,</p>
            
            <p>Gostaríamos de informar que a negociação para a sua indicação do cliente <strong>${indData.client_name}</strong> foi dada como encerrada sem conclusão no CRM Agendor.</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; font-weight: bold; color: #991b1b; font-size: 14px;">Negociação Finalizada sem Compra</p>
              <p style="margin: 5px 0 0 0; color: #7f1d1d; font-size: 13px;">Infelizmente este lead não seguiu com a compra do equipamento neste momento. Ficamos à disposição do cliente para novas consultas futuramente.</p>
            </div>

            <p>Agradecemos o seu empenho e continuamos juntos para as próximas indicações!</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">Roder Máquinas e Equipamentos Ltda.<br>Informativo automático de parceria.</p>
          </div>
        </div>
      `;
    }

    await sendNotificationEmail(partnerEmail, subject, html, "Roder Indica");
  }

  // Periodic Agendor CRM background sync every 15 minutes for all active linked deals
  cron.schedule('*/15 * * * *', async () => {
    try {
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      if (!settingsSnap.exists) return;
      const agendorConfig = settingsSnap.data() as any;
      if (!agendorConfig?.apiToken || !agendorConfig?.enabled) return;

      console.log("[Schedule] Iniciando sincronização periódica de negócios do Agendor CRM...");

      const allIndicationsSnap = await db.collection("indications").get();
      if (allIndicationsSnap.empty) return;

      let syncCount = 0;
      for (const docSnap of allIndicationsSnap.docs) {
        const indData = docSnap.data();
        if (!indData.agendor_deal_id || indData.status === "cancelled") continue;
        try {
          await syncAndPullAgendorDetails(docSnap.id, indData, agendorConfig.apiToken);
          syncCount++;
        } catch (err: any) {
          console.warn(`[Schedule-Agendor] Erro ao sincronizar indicação ${docSnap.id}:`, err.message);
        }
      }
      if (syncCount > 0) {
        console.log(`[Schedule] Sincronização periódica do Agendor concluída com sucesso para ${syncCount} indicação(ões).`);
      }
    } catch (error: any) {
      console.error("[Schedule] Erro na sincronização periódica do Agendor:", error.message);
    }
  }, {
    timezone: BR_TIMEZONE
  });

  // 4. Webhook Listener for Agendor CRM updates (Two-Way Sync)
  app.post("/api/webhooks/agendor", async (req, res) => {
    try {
      const payload = req.body;
      console.log("[AGENDOR-WEBHOOK] Recebido payload:", JSON.stringify(payload, null, 2));

      // Extract details
      const data = payload.data || payload;

      // Detect Deal ID across all possible fields
      let dealId = data.id || data.deal_id || data.dealId;
      if (!dealId && data.deal) {
        dealId = typeof data.deal === 'object' ? data.deal.id : data.deal;
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
        console.warn("[AGENDOR-WEBHOOK] ID do negócio não identificado no payload.");
        return res.json({ success: false, message: "ID do negócio não identificado" });
      }

      // Query firestore to find matching indication by agendor_deal_id (supports string or number)
      let indQuery = await db.collection("indications")
        .where("agendor_deal_id", "==", Number(dealId))
        .get();

      if (indQuery.empty) {
        indQuery = await db.collection("indications")
          .where("agendor_deal_id", "==", String(dealId))
          .get();
      }

      if (indQuery.empty) {
        console.log(`[AGENDOR-WEBHOOK] Nenhuma indicação correspondente encontrada para agendor_deal_id: ${dealId}`);
        return res.json({ success: false, message: "Indicação não correspondente no Roder" });
      }

      const indicationDoc = indQuery.docs[0];
      const indicationId = indicationDoc.id;
      const indData = indicationDoc.data() as any;

      // Trigger full sync & pull of latest comments, tasks, status, stage, and activities
      const settingsSnap = await db.collection("settings").doc("agendor").get();
      const agendorConfig = settingsSnap.exists ? settingsSnap.data() as any : null;
      let pullResult: any = null;
      if (agendorConfig?.apiToken) {
        pullResult = await syncAndPullAgendorDetails(indicationId, indData, agendorConfig.apiToken);
        console.log(`[AGENDOR-WEBHOOK] Pull completo executado para indicação ${indicationId}:`, pullResult);
      }

      const updates: any = {};
      const historyEntries: any[] = [];

      // Check if value changed
      if (data.value !== undefined && data.value !== null) {
        const newValue = parseFloat(data.value);
        if (newValue !== indData.base_commission_value) {
          updates.base_commission_value = newValue;
          historyEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "status_change",
            author_name: "CRM Agendor",
            created_at: new Date().toISOString(),
            content: `Valor base atualizado via Agendor CRM: de R$ ${(indData.base_commission_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} para R$ ${newValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
          });
        }
      }

      // Format stage names nicely for history
      const stageLabels: { [key: string]: string } = {
        lead: "Lead",
        contact: "Contato",
        proposal: "Apresentação / Proposta",
        negotiation: "Negociação",
        won: "Ganho",
        lost: "Perdido"
      };

      let notifyType: "budget_sent" | "sold" | "lost" | null = null;
      const newStage = data.stage;
      const newStatus = data.status; // 'ongoing', 'won', 'lost'

      if (newStage && newStage !== indData.agendor_stage) {
        updates.agendor_stage = newStage;
        const currentStageLabel = stageLabels[indData.agendor_stage || ""] || indData.agendor_stage || "Desconhecido";
        const newStageLabel = stageLabels[newStage] || newStage;
        
        historyEntries.push({
          id: Math.random().toString(36).substring(2, 11),
          type: "status_change",
          author_name: "CRM Agendor",
          created_at: new Date().toISOString(),
          content: `Estágio da negociação atualizado no CRM: de "${currentStageLabel}" para "${newStageLabel}".`
        });

        // Detect if stage changed to proposal/quote sent to start the 60-day protection window
        const isProposalStage = typeof newStage === "string" && (
          newStage.toLowerCase() === "proposal" || 
          newStage.toLowerCase().includes("propos") ||
          newStage.toLowerCase().includes("orçament") ||
          newStage.toLowerCase().includes("orcam")
        );

        if (isProposalStage && !indData.budget_sent_at) {
          const now = new Date();
          updates.budget_sent_at = now.toISOString();
          updates.protection_expires_at = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
          historyEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "status_change",
            author_name: "CRM Agendor",
            created_at: now.toISOString(),
            content: `[Controle Automático]: Orçamento enviado identificado no CRM Agendor! A validade da proteção de 60 dias para o indicador parceiro foi iniciada e expira em ${new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR")}.`
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
            created_at: new Date().toISOString(),
            content: `O negócio foi marcado como GANHO no Agendor CRM. Lembre-se de anexar a nota fiscal e finalizar o faturamento no Roder Indica.`
          });
          notifyType = "sold";
        } else if (newStatus === "lost") {
          updates.status = "cancelled";
          const lossReason = data.loss_reason || "Não informada";
          historyEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "status_change",
            author_name: "CRM Agendor",
            created_at: new Date().toISOString(),
            content: `O negócio foi marcado como PERDIDO no Agendor CRM. Motivo: ${lossReason}. A indicação foi cancelada no Roder Indica automaticamente.`
          });
          notifyType = "lost";
        }
      }

      // Check if a comment/note was added
      const commentText = payload.comment?.text || payload.comment?.content || payload.activity?.text || payload.activity?.description || payload.text;
      if (commentText) {
        historyEntries.push({
          id: Math.random().toString(36).substring(2, 11),
          type: "note",
          author_name: payload.comment?.user?.name || payload.activity?.user?.name || "CRM Agendor",
          created_at: new Date().toISOString(),
          content: `[CRM Agendor]: ${commentText}`
        });
      }

      // Apply updates to the database
      if (Object.keys(updates).length > 0 || historyEntries.length > 0) {
        const indRef = db.collection("indications").doc(indicationId);
        const updatePayload: any = {
          ...updates,
          updated_at: new Date().toISOString()
        };

        if (historyEntries.length > 0) {
          updatePayload.negotiation_history = admin.firestore.FieldValue.arrayUnion(...historyEntries);
        }

        await indRef.update(updatePayload);
        console.log(`[AGENDOR-WEBHOOK] Indicação ${indicationId} atualizada com sucesso!`);

        if (notifyType) {
          sendPartnerNotificationFromWebhook(indData, notifyType, updates).catch(err => {
            console.error("[AGENDOR-WEBHOOK] Erro ao enviar e-mail de notificação de parceria:", err.message);
          });
        }
      }

      // Automatically trigger file/attachment synchronization when any webhook payload is received
      if (db) {
        setTimeout(async () => {
          try {
            const settingsSnap = await db.collection("settings").doc("agendor").get();
            const agendorConfig = settingsSnap.data() as any;
            if (agendorConfig?.apiToken && agendorConfig?.enabled) {
              console.log(`[AGENDOR-WEBHOOK] Auto-sincronizando arquivos do negócio #${dealId}...`);
              const localUrl = `http://0.0.0.0:${PORT}/api/agendor/import-files`;
              const importRes = await fetch(localUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ indicationId })
              });
              const importJson = await importRes.json();
              console.log(`[AGENDOR-WEBHOOK] Auto-sincronização de arquivos finalizada para indicação ${indicationId}:`, importJson);
            }
          } catch (err: any) {
            console.error(`[AGENDOR-WEBHOOK] Erro ao sincronizar arquivos do negócio #${dealId} automaticamente:`, err.message);
          }
        }, 1500); // 1.5-second delay to allow Firestore to finish updating and Agendor file attachment to propagate
      }

      return res.json({ success: true, message: "Webhook processado com sucesso" });
    } catch (err: any) {
      console.error("[AGENDOR-WEBHOOK] Erro no webhook do Agendor:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    
    // Auto-heal Luana Camargo user profile in Firestore
    setTimeout(async () => {
      try {
        if (!db) return;
        const usersSnap = await db.collection("users").get();
        for (const userDoc of usersSnap.docs) {
          const uData = userDoc.data();
          const emailLower = (uData.email || "").toLowerCase().trim();
          const nameCurrent = uData.name || "";
          
          const isLuana = emailLower === "contato@roderbrasil.com.br" ||
                          emailLower === "luana@roderbrasil.com.br" ||
                          emailLower === "luana@roder.com.br" ||
                          nameCurrent.includes("Contato_Roder") ||
                          nameCurrent.includes("Contato Roder");

          if (isLuana && nameCurrent !== "Luana Camargo") {
            console.log(`[BOOT-HEAL] Corrigindo nome do usuário ${userDoc.id} (${uData.email}) de "${nameCurrent}" para "Luana Camargo"...`);
            await db.collection("users").doc(userDoc.id).update({
              name: "Luana Camargo",
              updated_at: new Date().toISOString()
            });
          }
        }
      } catch (healErr: any) {
        console.error("[BOOT-HEAL] Erro ao auto-corrigir nome da Luana Camargo:", healErr.message);
      }
    }, 3000);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
