// Envio dos arquivos da biblioteca de vídeos do consultor (vídeo e capa).
// O navegador não grava mais em consultor_videos/ pelo SDK do Storage (as regras recusam): o
// servidor confere o papel (admin, gerência, marketing) e devolve um endereço assinado para um PUT
// só. O arquivo sobe por XHR, com a porcentagem, e depois o servidor confere o que chegou e devolve
// o link final do Firebase (server/arquivosVideosConsultor.ts).
import { auth } from './firebase';
import { getApiBaseUrl } from './utils';

export const MAX_VIDEO_BIBLIOTECA_MB = 80;
export const MAX_CAPA_BIBLIOTECA_MB = 2;

async function chamar(caminho: string, metodo: 'POST' | 'DELETE', corpo: any): Promise<any> {
  const token = await auth.currentUser?.getIdToken().catch(() => '');
  const r = await fetch(`${getApiBaseUrl()}${caminho}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(corpo),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e: any = new Error(j?.error || `Erro ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return j;
}

export type EnvioEmCurso = { promessa: Promise<string>; cancelar: () => void };

// Sobe um arquivo e devolve o link de download (com token) do Firebase
export function enviarArquivoBiblioteca(
  arquivo: Blob,
  nome: string,
  contentType: string,
  aoProgresso?: (enviado: number, total: number) => void,
): EnvioEmCurso {
  let xhr: XMLHttpRequest | null = null;
  let cancelado = false;
  const cancelar = () => { cancelado = true; xhr?.abort(); };
  const promessa = (async () => {
    const pedido = await chamar('/api/consultor/videos/upload-url', 'POST', { contentType, nome, tamanho: arquivo.size });
    if (cancelado) throw Object.assign(new Error('cancelado'), { code: 'cancelado' });
    await new Promise<void>((ok, falha) => {
      const x = new XMLHttpRequest();
      xhr = x;
      x.open('PUT', pedido.uploadUrl);
      for (const [k, v] of Object.entries(pedido.cabecalhos || {})) x.setRequestHeader(k, String(v));
      x.upload.onprogress = (e) => { if (e.lengthComputable) aoProgresso?.(e.loaded, e.total); };
      x.onload = () => (x.status >= 200 && x.status < 300 ? ok() : falha(Object.assign(new Error(`envio recusado (${x.status})`), { code: x.status === 400 || x.status === 413 ? 'grande' : 'falha' })));
      x.onerror = () => falha(Object.assign(new Error('sem conexão'), { code: 'rede' }));
      x.onabort = () => falha(Object.assign(new Error('cancelado'), { code: 'cancelado' }));
      x.send(arquivo);
    });
    const fim = await chamar('/api/consultor/videos/confirmar', 'POST', { caminho: pedido.caminho });
    return String(fim.url || '');
  })();
  return { promessa, cancelar };
}

// Apaga o arquivo do Storage (só de consultor_videos/; o servidor recusa se ainda está num cadastro).
// Nunca joga erro: o cadastro já saiu, e um arquivo que ficou não quebra nada na tela.
export async function apagarArquivoBiblioteca(url?: string): Promise<void> {
  if (!url || !/firebasestorage\.googleapis\.com|storage\.googleapis\.com/.test(url) || !/consultor_videos(%2F|\/)/.test(url)) return;
  try { await chamar('/api/consultor/videos/arquivo', 'DELETE', { url }); } catch { /* fica o arquivo */ }
}
