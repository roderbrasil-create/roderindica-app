// server.js
// Ponto de entrada principal para compatibilidade com Hostinger, cPanel, Docker e servidores Node.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cjsPath = path.resolve(__dirname, 'dist', 'server.cjs');
const indexPath = path.resolve(__dirname, 'dist', 'index.html');
const serverTsPath = path.resolve(__dirname, 'server.ts');

let needsBuild = !fs.existsSync(cjsPath) || !fs.existsSync(indexPath);

if (!needsBuild && fs.existsSync(serverTsPath)) {
  try {
    const tsTime = fs.statSync(serverTsPath).mtimeMs;
    const cjsTime = fs.statSync(cjsPath).mtimeMs;
    if (tsTime > cjsTime) {
      needsBuild = true;
    }
  } catch (e) {
    // Ignore stat error
  }
}

if (needsBuild) {
  console.log("⚠️ [HOSTINGER ENTRYPOINT]: Tentando compilar aplicação ('npm run build')...");
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.warn("⚠️ [HOSTINGER ENTRYPOINT] Build via shell indisponível ou ignorado:", err?.message || err);
  }
}

// Check if bundled dist/server.cjs exists; otherwise boot server.ts
if (fs.existsSync(cjsPath)) {
  import('./dist/server.cjs').catch(async (err) => {
    console.error("⚠️ Erro ao iniciar 'dist/server.cjs', tentando carregar 'server.ts':", err);
    try {
      await import('./server.ts');
    } catch (tsErr) {
      console.error("❌ Erro fatal ao carregar 'server.ts':", tsErr);
    }
  });
} else {
  console.log("🚀 [HOSTINGER ENTRYPOINT]: Iniciando diretamente via 'server.ts'...");
  import('./server.ts').catch((err) => {
    console.error("❌ Erro fatal ao carregar 'server.ts':", err);
  });
}



