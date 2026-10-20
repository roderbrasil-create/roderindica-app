// FOTO DO AGENDOR PELO SERVIDOR (19/10/2026). /api/admin/agendor-foto baixava QUALQUER endereço
// https para qualquer login, inclusive anônimo: virava porta para o servidor ler a rede interna
// (SSRF). Agora só o dono (mesma trava de /api/admin/agendor-fotos) e só destes servidores, em
// cada salto de redirecionamento. As fotos de produto do Agendor ficam no domínio dele ou num
// armazenamento da Amazon (S3 ou CloudFront) para onde ele redireciona.

const SUFIXOS = ['agendor.com.br', 'amazonaws.com', 'cloudfront.net'];

export function hostDeFotoAgendor(host: string): boolean {
  const h = String(host || '').toLowerCase().replace(/\.$/, '');
  if (!h || /^[0-9.]+$/.test(h) || h.includes(':')) return false; // IP direto nunca
  return SUFIXOS.some(s => h === s || h.endsWith('.' + s));
}

export function urlDeFotoAgendor(url: string): boolean {
  let u: URL;
  try { u = new URL(String(url || '')); } catch { return false; }
  if (u.protocol !== 'https:' || u.username || u.password) return false;
  if (u.port && u.port !== '443') return false;
  return hostDeFotoAgendor(u.hostname);
}
