// server.js
// Ponto de entrada principal para compatibilidade com a Hostinger e outros servidores Node.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cjsPath = path.resolve(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(cjsPath)) {
  console.log("⚠️ [HOSTINGER ENTRYPOINT]: 'dist/server.cjs' não encontrado. Executando 'npm run build'...");
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error("Falha ao executar build em server.js:", err);
  }
}

import('./dist/server.cjs').catch((err) => {
  console.error("Erro ao iniciar 'dist/server.cjs':", err);
});

