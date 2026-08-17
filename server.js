// server.js
// Ponto de entrada principal para Hostinger Node.js (compatibilidade ESM e CommonJS)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

process.env.NODE_ENV = 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

console.log(`[HOSTINGER-BOOT] Inicializando aplicação Node.js em: ${__dirname}`);

const cjsPath = path.resolve(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(cjsPath)) {
  console.log(`[HOSTINGER-BOOT] Carregando 'dist/server.cjs'...`);
  try {
    require(cjsPath);
  } catch (requireErr) {
    console.error("[HOSTINGER-BOOT] Erro ao carregar 'dist/server.cjs' via require, tentando import dinâmico:", requireErr);
    import('./dist/server.cjs').catch((err) => {
      console.error("[HOSTINGER-BOOT] Falha fatal ao importar 'dist/server.cjs':", err);
    });
  }
} else {
  console.log(`[HOSTINGER-BOOT] 'dist/server.cjs' não encontrado. Carregando 'server.ts'...`);
  import('./server.ts').catch((err) => {
    console.error("[HOSTINGER-BOOT] Falha fatal ao carregar 'server.ts':", err);
  });
}




