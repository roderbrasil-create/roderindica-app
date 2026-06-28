// Client-side Gemini Service Proxy
// This file runs inside the browser and forwards all AI queries to the secure backend.
// This prevents exposing process.env keys and loading Node-only libraries on the client.

import { getApiBaseUrl } from "../lib/utils";

async function executeBackendAI(action: string, args: any = {}): Promise<any> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/gemini/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, args }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `HTTP error ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (data.success) {
    return data.result;
  } else {
    throw new Error(data.error || "Erro desconhecido na execução da IA.");
  }
}

export async function transcribeAudio(audioBase64: string, mimeType: string, mode?: string): Promise<string> {
  return executeBackendAI("transcribeAudio", { audioBase64, mimeType, mode });
}

export async function askJefe(question: string, context?: string): Promise<string> {
  return executeBackendAI("askJefe", { question, context });
}

export async function askEngineerHelper(question: string, chatHistory: { role: 'user' | 'assistant'; content: string }[] = []): Promise<string> {
  return executeBackendAI("engineerHelper", { question, chatHistory });
}

export async function analyzeBudget(fileBase64: string, mimeType: string): Promise<any> {
  return executeBackendAI("analyzeBudget", { fileBase64, mimeType });
}

export async function scanStockPDF(fileBase64: string): Promise<{ items: any[], source: string, branch: string }> {
  return executeBackendAI("scanStockPDF", { fileBase64 });
}

export async function generateWhatsAppMessage(leadData: any, fairName: string): Promise<string> {
  return executeBackendAI("generateWhatsAppMessage", { leadData, fairName });
}

export async function generateAISummary(historyText: string, variant: 'short' | 'executive' = 'short'): Promise<string> {
  return executeBackendAI("generateAISummary", { historyText, variant });
}

export async function analyzeDetailedBudget(fileBase64: string): Promise<any> {
  return executeBackendAI("analyzeDetailedBudget", { fileBase64 });
}

export async function analyzePDFDocument(fileBase64: string, customPrompt: string): Promise<any> {
  return executeBackendAI("analyzePDFDocument", { fileBase64, customPrompt });
}

export async function analyzeNF(fileBase64: string, expectedValue: number): Promise<any> {
  return executeBackendAI("analyzeNF", { fileBase64, expectedValue });
}

export async function extractCardData(imageSnap: string): Promise<any> {
  return executeBackendAI("extractCardData", { imageSnap });
}

export async function refineTranscription(text: string): Promise<string> {
  return executeBackendAI("refineTranscription", { text });
}

export async function generateAIInsight(context: any): Promise<string> {
  return executeBackendAI("generateAIInsight", { context });
}
