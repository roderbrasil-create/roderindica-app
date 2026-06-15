// server.js
// Ponto de entrada principal para compatibilidade com a Hostinger e outros servidores de produção
// Este arquivo carrega dinamicamente o servidor compilado de produção 'dist/server.cjs'

import('./dist/server.cjs').catch((err) => {
  console.error("Erro ao iniciar o servidor de produção 'dist/server.cjs':", err);
  console.log("\n⚠️ Certifique-se de executar 'npm run build' no painel da Hostinger para compilar a aplicação antes de iniciar o servidor.");
  process.exit(1);
});
