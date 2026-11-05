// Link curto para arquivo (vídeo, foto, PDF) que vai num texto de WhatsApp.
// O endereço do Firebase Storage passa de 200 caracteres e ocupa meia tela da mensagem; o curto tem ~35.
// Só endereços de dentro da própria Roder ou do YouTube podem ser encurtados: sem essa lista o encurtador
// viraria um redirecionador aberto, que serve para mandar o cliente a qualquer site.
const HOSTS_PERMITIDOS = [
  /^firebasestorage\.googleapis\.com$/i,
  /^[a-z0-9-]+\.firebasestorage\.app$/i,
  /^storage\.googleapis\.com$/i,
  /^(www\.|m\.)?youtube\.com$/i,
  /^youtu\.be$/i,
  /^(www\.)?roderindica\.com$/i,
  /^(www\.)?roderbrasil\.com\.br$/i,
];

export function urlEncurtavel(bruta: unknown): string {
  const t = String(bruta || '').trim();
  if (!/^https:\/\/\S+$/i.test(t) || t.length > 2000) return '';
  let u: URL;
  try { u = new URL(t); } catch { return ''; }
  if (u.protocol !== 'https:' || u.username || u.password) return '';
  return HOSTS_PERMITIDOS.some(r => r.test(u.hostname)) ? u.toString() : '';
}
