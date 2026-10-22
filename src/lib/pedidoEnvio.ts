// Como a vendedora pede o equipamento para o cliente, e o que o Consultor mostra de botão.
// Regra do Jeferson: qualquer pedido de enviar, compartilhar, apresentar, divulgar o equipamento sai SEMPRE
// no formato completo do botão WhatsApp do catálogo (foto grande + características + link, onde o cliente vê
// vídeo, ficha e pede orçamento). O botão da ficha em PDF só aparece quando ela pede a ficha de forma explícita.

const sem = (t: string) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// "ficha", "ficha técnica", "PDF", "folha técnica", "datasheet"
export function pediuFicha(texto: string): boolean {
  const t = sem(texto);
  return /\bfichas?\b/.test(t) || /\bpdf\b/.test(t) || /\bfolha tecnica\b/.test(t) || /\bdata ?sheet\b/.test(t);
}

// "manda esse equipamento pro cliente", "compartilhar com o cliente", "quero apresentar", "preciso do catálogo",
// "tem um folder?", "material de divulgação", "propaganda do CMF 600" etc.
export function pediuEnvioEquipamento(texto: string): boolean {
  const t = sem(texto);
  if (/\b(catalogo|folder|folheto|propaganda|divulgacao|divulgar|apresentacao|apresentar|material de venda|material para o cliente)\b/.test(t)) return true;
  const verbo = /\b(envi\w*|mand\w*|compartilh\w*|pass\w*|encaminh\w*|apresent\w*|divulg\w*|mostr\w*)\b/.test(t);
  const alvo = /\b(cliente|equipamento|maquina|implemento|whats\w*|link)\b/.test(t) || /\b(esse|este|esta|essa|o|a)\s+(cmf|ssh|uml|umm|bl\d|dml|pml|r\d{3,4}|gmt|cfta|sac)\b/.test(t);
  return verbo && alvo;
}

// 'ficha' só com pedido explícito da ficha; todo o resto é o formato completo
export type FormatoEnvio = 'ficha' | 'completo';
export function formatoDoEnvio(texto: string): FormatoEnvio {
  return pediuFicha(texto) ? 'ficha' : 'completo';
}

// Entra no prompt do consultor (server.ts)
export const REGRA_ENVIO_EQUIPAMENTO = `REGRA DE ENVIO DO EQUIPAMENTO AO CLIENTE (vale para a equipe):
- Quando o vendedor pedir para enviar, mandar, compartilhar, apresentar, divulgar o equipamento ao cliente, ou pedir catálogo, folder, propaganda ou material de venda, NÃO ofereça escolha entre formatos e NÃO pergunte "ficha ou link". O envio é sempre o formato completo: foto grande, características e link para o cliente ver vídeo, ficha e pedir orçamento. Esse envio é o botão verde "Enviar ao cliente" do cartão do equipamento, que aparece abaixo da sua resposta.
- Responda curto: cite o equipamento, diga que o botão "Enviar ao cliente" manda a foto com o link e, se faltar saber qual é o equipamento, pergunte só isso.
- Só fale em ficha em PDF e só mostre o link da ficha quando o vendedor pedir a ficha de forma explícita (palavras como ficha, ficha técnica, PDF).`;
