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

dotenv.config();

import admin from "firebase-admin";
import { getFirestore } from 'firebase-admin/firestore';

// Resolve __dirname safely to avoid crashes in bundled CommonJS mode
const __dirname = process.cwd();

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: config.projectId,
  });
}

const db = getFirestore(admin.app(), config.firestoreDatabaseId || '(default)');

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
  try {
    return await ai.models.generateContent({
      model: modelToUse,
      contents: params.contents,
      config: params.config,
    });
  } catch (error: any) {
    console.warn(`Error generating content with model ${modelToUse}:`, error);
    
    // Check if it's a 429, Quota, or Resource Exhausted error
    const errorStr = (error.message || "").toLowerCase();
    const isRateLimit = 
      errorStr.includes("429") || 
      errorStr.includes("quota") || 
      errorStr.includes("exhausted") || 
      errorStr.includes("rate limit") || 
      error.status === 429;
    
    if (isRateLimit && modelToUse !== "gemini-flash-latest") {
      console.log("Gemini quota exhausted. Retrying immediately with alternative model 'gemini-flash-latest'...");
      // Add a tiny sleep of 1 second before calling the alternative model
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: params.contents,
        config: params.config,
      });
    }
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok"
    });
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

  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html, replyTo, fromName, settings: bodySettings } = req.body;
    
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
      
      if (!settings) {
        return res.status(400).json({ 
          error: "Configurações de e-mail não encontradas no sistema.",
          details: "O servidor não conseguiu ler o banco de dados e as configurações não foram enviadas na requisição."
        });
      }

      if (settings.provider === 'resend') {
        if (!settings.apiKey) return res.status(400).json({ error: "API Key do Resend não configurada." });
        
        const resend = new Resend(settings.apiKey);
        const fromEmail = settings.senderEmail || 'vendas@roderbrasil.com.br';
        
        const { data, error } = await resend.emails.send({
          from: fromName ? `${fromName} <${fromEmail}>` : `RODER Indica <${fromEmail}>`,
          to: [to],
          subject: subject,
          html: html,
          replyTo: replyTo || fromEmail
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
          replyTo: replyTo || settings.user
        };

        const result = await transporter.sendMail(mailOptions);
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
    try {
      const { action, args } = req.body;
      if (!action) {
        return res.status(400).json({ error: "No action specified" });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(500).json({ error: "O cliente da API Gemini não foi inicializado no servidor." });
      }

      let result;

      switch (action) {
        case "transcribeAudio": {
          const { audioBase64, mimeType } = args;
          const prompt = `Você é um assistente da Roder Brasil, focado em ajudar vendedores a estruturar informações.
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
            3. Melhore a gramática mantendo o vocabulário técnico (ex: garras, kit hidráulico, rotor).
            4. Retorne APENAS o texto estruturado, pronto para ser lido por um vendedor interno.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
              { text: prompt },
              { inlineData: { data: audioBase64, mimeType: mimeType.split(';')[0] } }
            ]
          });
          result = response.text || "Não foi possível transcrever o áudio.";
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

        case "analyzeBudget": {
          const { fileBase64, mimeType } = args;
          const prompt = `Analise este orçamento/proposta da RODER e extraia os itens conforme as seguintes regras de negócio:
            
            1. Identifique todos os PRODUTOS (equipamentos rurais/florestais).
            2. Identifique itens que NÃO são base de comissionamento: Kit hidráulico, Suporte, Acessórios.
            3. Para cada item, extraia: Nome, Código (se houver), Quantidade e Valor (se houver).
            
            Retorne um JSON contendo a lista dos itens, totalValue e observations.
            
            IMPORTANTE: Marque 'isCommissionable' como false se for Kit hidráulico, Suporte ou Acessórios.`;

          const response = await generateContentWithRetry(ai, {
            defaultModel: "gemini-3.5-flash",
            contents: [
              { text: prompt },
              { inlineData: { data: fileBase64, mimeType: mimeType.split(';')[0] } }
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
            
            REGRAS DE CLASSIFICAÇÃO DE REGIONAL (FILIAL):
            1. Verifique se o cabeçalho do relatório menciona expressamente "Filial Sinop", "RODER - FILIAL SINOP" ou "Sinop". 
               - Se SIM: Classifique como branch: "sinop" e source: "sinop".
               - Se NÃO: Significa que pertence ao Estoque Fábrica (Matriz). Classifique obrigatoriamente como branch: "matriz".
            
            REGRAS DE CATEGORIA DE ORIGEM (SOURCE):
            Para relatórios da Matriz (branch: "matriz"), classifique a origem (source) em um dos seguintes tipos conforme os itens lidos:
            - 'roder': Equipamentos Roder fabricados nacionalmente, garras, pinças etc.
            - 'fae': Equipamentos florestais importados da marca FAE, trituradores FAE, fresas FAE etc., ou outros equipamentos importados (como rompedores hidráulicos importados Hammer/JSB etc.)
            - 'accessories': Acessórios Roder, suportes de feller, ponteiras de escavadeira, adaptadores, engates rápidos, parafusos etc.
            
            Sua tarefa técnica:
            1. Extraia 'code', 'description' e 'quantity' de todos os itens da tabela.
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
                    description: "A origem do estoque: roder | fae | accessories | sinop"
                  },
                  branch: { 
                    type: Type.STRING,
                    description: "A filial correspondente: matriz | sinop"
                  },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        code: { type: Type.STRING },
                        description: { type: Type.STRING },
                        quantity: { type: Type.NUMBER }
                      },
                      required: ["code", "description", "quantity"]
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
        return res.status(500).json({ error: "Ocorreu um erro ao inicializar o Gemini API no servidor." });
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

  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode");
    
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
    console.log("Starting in PRODUCTION mode");
    const distPath = path.resolve(__dirname, 'dist');
    
    // Serve static files
    app.use(express.static(distPath));
    
    // Fallback to index.html for SPA routing
    app.get('*', (req, res) => {
      console.log(`Fallback triggered for: ${req.url}`);
      const indexPath = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Build artifacts not found. Please run npm run build.");
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
        <p style="margin-top: 20px; font-size: 12px; color: #666; font-style: italic;">
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
