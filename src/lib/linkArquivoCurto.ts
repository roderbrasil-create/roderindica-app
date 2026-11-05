import { auth } from './firebase';
import { getApiBaseUrl } from './utils';

// Troca o endereço comprido de um arquivo (vídeo, foto, PDF) por um link curto da Roder para o texto do WhatsApp.
// Se não der (sem login, sem rede, endereço não permitido), devolve o endereço original: o texto sai igual a antes.
const guardados = new Map<string, string>();

export async function encurtarLinkArquivo(url: string): Promise<string> {
  const original = String(url || '').trim();
  if (!original) return '';
  const ja = guardados.get(original);
  if (ja) return ja;
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return original;
    const r = await fetch(`${getApiBaseUrl()}/api/link-arquivo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url: original }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && typeof j.link === 'string' && /^https:\/\/\S+$/i.test(j.link)) {
      guardados.set(original, j.link);
      return j.link;
    }
  } catch { /* cai no endereço original */ }
  return original;
}
