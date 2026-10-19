// Ficha própria carregada no cadastro (PDF da Roder, link do Drive, arquivo do banco):
// quando existe, ela abre no lugar da ficha padrão automática.
// O PDF de catálogo do site (roderbrasil.com.br) não conta: continua como link dentro da ficha padrão.
export function ehFichaPropria(url?: string | null): boolean {
  const u = (url || '').trim();
  if (!u) return false;
  if (u.startsWith('/catalogo/') || u.startsWith('db-file://')) return true;
  if (!/^https?:\/\//i.test(u)) return false;
  try {
    const host = new URL(u).hostname.toLowerCase();
    return !(host === 'roderbrasil.com.br' || host.endsWith('.roderbrasil.com.br'));
  } catch {
    return false;
  }
}
