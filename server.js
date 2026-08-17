// server.js
// Ponto de entrada principal para compatibilidade com Hostinger, cPanel, Docker e servidores Node.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cjsPath = path.resolve(__dirname, 'dist', 'server.cjs');

// Iniciar servidor imediatamente (sem bloqueios síncronos)
if (fs.existsSync(cjsPath)) {
  console.log("🚀 [SERVER]: Iniciando bundle compilado 'dist/server.cjs'...");
  import('./dist/server.cjs').catch(async (err) => {
    console.error("⚠️ Erro ao iniciar 'dist/server.cjs', carregando 'server.ts':", err);
    try {
      await import('./server.ts');
    } catch (tsErr) {
      console.error("❌ Erro fatal ao carregar 'server.ts':", tsErr);
    }
  });
} else {
  console.log("🚀 [SERVER]: 'dist/server.cjs' não encontrado. Iniciando via 'server.ts'...");
  import('./server.ts').catch((err) => {
    console.error("❌ Erro fatal ao carregar 'server.ts':", err);
  });
}




