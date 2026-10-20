// Arquivos da biblioteca de vídeos do consultor (vídeo e capa em consultor_videos/ no Storage).
// O navegador NÃO grava mais nessa pasta pelas regras do Storage (storage.rules: write false).
// A regra antiga conferia só o e-mail @roderbrasil, e o papel (admin, gerência, marketing) mora
// no banco nomeado do Firestore, que as regras do Storage não enxergam: qualquer conta com e-mail
// da Roder subia e apagava vídeo. Agora o servidor confere o papel em users/{uid} e entrega:
//  1) POST   /api/consultor/videos/upload-url  -> endereço assinado (v4) para um PUT só, 15 min,
//     com o tipo e o teto de tamanho assinados junto (x-goog-content-length-range)
//  2) POST   /api/consultor/videos/confirmar   -> confere o arquivo que subiu (tipo e tamanho;
//     fora disso apaga), grava o token de download e devolve o link final do Firebase
//  3) DELETE /api/consultor/videos/arquivo     -> apaga o arquivo ao apagar ou trocar o vídeo,
//     só dentro de consultor_videos/ e só se nenhum cadastro ainda usa
import crypto from 'node:crypto';
import { alvoDoVideo } from './consultorParceiro';

export const PAPEIS_VIDEOS = ['admin', 'manager', 'marketing'];
export const PASTA_VIDEOS = 'consultor_videos';
export const MAX_VIDEO_MB = 80;
export const MAX_CAPA_MB = 2;
export const VALIDADE_UPLOAD_MS = 15 * 60 * 1000;
export const LIMITE_UPLOADS_HORA = 60;

const TIPOS: Record<string, { ext: string; maxMb: number }> = {
  'video/mp4': { ext: 'mp4', maxMb: MAX_VIDEO_MB },
  'video/webm': { ext: 'webm', maxMb: MAX_VIDEO_MB },
  'video/quicktime': { ext: 'mov', maxMb: MAX_VIDEO_MB },
  'image/jpeg': { ext: 'jpg', maxMb: MAX_CAPA_MB },
  'image/png': { ext: 'png', maxMb: MAX_CAPA_MB },
  'image/webp': { ext: 'webp', maxMb: MAX_CAPA_MB },
};
export const tipoPermitido = (ct: any) => TIPOS[String(ct || '').toLowerCase().split(';')[0].trim()] || null;
export const maxBytesDo = (ct: string) => (tipoPermitido(ct)?.maxMb || 0) * 1024 * 1024;

// "Vídeo do Rogério (1).MOV" -> "Video_do_Rogerio_1_.mov": só letras, números, ponto, hífen e _,
// e a extensão sempre a do tipo (o nome não engana o tipo do arquivo)
export function nomeSeguro(nome: any, contentType: string): string {
  const t = tipoPermitido(contentType);
  const base = String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\.[A-Za-z0-9]{1,5}$/, '').replace(/[^A-Za-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+/, '').slice(0, 60) || 'arquivo';
  return `${base}.${t ? t.ext : 'bin'}`;
}

// Caminho dentro da pasta da biblioteca: sem "..", sem "//", só caracteres simples.
// Vale o formato novo (consultor_videos/<id>/<nome>) e o antigo (consultor_videos/x.mp4 e capas/).
export function caminhoDaBiblioteca(c: any): string {
  const s = String(c || '');
  if (!s || s.length > 300 || !s.startsWith(`${PASTA_VIDEOS}/`)) return '';
  const partes = s.split('/');
  if (partes.length < 2 || partes.length > 3) return '';
  if (partes.some(p => !p || p === '.' || p === '..' || !/^[A-Za-z0-9._-]{1,120}$/.test(p))) return '';
  return s;
}

export const urlDeDownload = (bucket: string, caminho: string, token: string) =>
  `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(caminho)}?alt=media&token=${encodeURIComponent(token)}`;

// caminho a partir do link salvo no cadastro (o do Firebase com token ou o do storage.googleapis)
export function caminhoDoLink(url: any): string {
  const a = alvoDoVideo(String(url || ''));
  return a && a.tipo === 'storage' ? caminhoDaBiblioteca(a.caminho) : '';
}

export interface ArquivoStorage {
  getSignedUrl(o: any): Promise<[string]>;
  getMetadata(): Promise<[any]>;
  setMetadata(m: any): Promise<any>;
  delete(o?: any): Promise<any>;
}
export interface DepsArquivosVideos {
  db: any;
  quemChama: (req: any) => Promise<{ uid: string; email: string; role: string } | null>;
  passouLimite: (chave: string, max: number, janelaMs: number) => boolean;
  nomeBucket: string;
  arquivo: (caminho: string) => ArquivoStorage;
  // o PUT do navegador vai direto ao storage.googleapis.com: o bucket precisa aceitar a origem (CORS)
  garantirCors?: (origem: string) => Promise<void>;
  novoId?: () => string;
  novoToken?: () => string;
  agora?: () => number;
}

export function criarRotasArquivosVideos(deps: DepsArquivosVideos) {
  const agora = () => (deps.agora ? deps.agora() : Date.now());
  const novoId = deps.novoId || (() => crypto.randomBytes(10).toString('hex'));
  const novoToken = deps.novoToken || (() => crypto.randomUUID());

  async function podeGravar(req: any, res: any) {
    const q = await deps.quemChama(req);
    if (!q) { res.status(401).json({ error: 'Entre com a sua conta da Roder.' }); return null; }
    if (!PAPEIS_VIDEOS.includes(String(q.role))) { res.status(403).json({ error: 'Só admin, gerência e marketing cadastram vídeo.' }); return null; }
    return q;
  }

  // POST /api/consultor/videos/upload-url  { contentType, nome, tamanho }
  async function rotaUploadUrl(req: any, res: any) {
    try {
      const q = await podeGravar(req, res);
      if (!q) return;
      if (deps.passouLimite(`vidup:${q.uid}`, LIMITE_UPLOADS_HORA, 60 * 60 * 1000)) return res.status(429).json({ error: 'Muitos envios seguidos. Espere alguns minutos.' });
      const ct = String(req.body?.contentType || '').toLowerCase().trim();
      const t = tipoPermitido(ct);
      if (!t) return res.status(415).json({ error: 'Só vídeo MP4, WEBM ou MOV, e capa JPG, PNG ou WEBP.' });
      const max = t.maxMb * 1024 * 1024;
      const tamanho = Number(req.body?.tamanho || 0);
      if (!(tamanho > 0)) return res.status(400).json({ error: 'Arquivo vazio.' });
      if (tamanho > max) return res.status(413).json({ error: `Arquivo grande demais. O limite é ${t.maxMb} MB.` });
      const caminho = `${PASTA_VIDEOS}/${novoId()}/${nomeSeguro(req.body?.nome, ct)}`;
      const origem = String(req.headers?.origin || '');
      if (origem && deps.garantirCors) { try { await deps.garantirCors(origem); } catch (e: any) { console.warn('[videos] CORS do bucket:', e?.message || e); } }
      const cabecalhos = { 'Content-Type': ct, 'x-goog-content-length-range': `0,${max}` };
      const [uploadUrl] = await deps.arquivo(caminho).getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: agora() + VALIDADE_UPLOAD_MS,
        contentType: ct,
        // assinado junto: o PUT sem este cabeçalho, ou com arquivo maior, é recusado pelo próprio Storage
        extensionHeaders: { 'x-goog-content-length-range': `0,${max}` },
      });
      res.setHeader?.('Cache-Control', 'no-store');
      res.json({ caminho, uploadUrl, cabecalhos, expiraEm: agora() + VALIDADE_UPLOAD_MS });
    } catch (e: any) {
      console.error('[videos] upload-url:', e?.message || e);
      res.status(500).json({ error: 'Não consegui preparar o envio. Tente de novo.' });
    }
  }

  // POST /api/consultor/videos/confirmar  { caminho }  -> { url }
  async function rotaConfirmar(req: any, res: any) {
    try {
      const q = await podeGravar(req, res);
      if (!q) return;
      const caminho = caminhoDaBiblioteca(req.body?.caminho);
      if (!caminho) return res.status(400).json({ error: 'Arquivo inválido.' });
      const arq = deps.arquivo(caminho);
      let meta: any;
      try { [meta] = await arq.getMetadata(); } catch { return res.status(404).json({ error: 'O arquivo não chegou. Envie de novo.' }); }
      const ct = String(meta?.contentType || '');
      const tamanho = Number(meta?.size || 0);
      // segunda trava, caso o teto assinado não tenha valido: fora do tipo ou do tamanho, apaga
      if (!tipoPermitido(ct)) { await arq.delete({ ignoreNotFound: true }).catch(() => {}); return res.status(415).json({ error: 'Tipo de arquivo não aceito.' }); }
      if (!(tamanho > 0) || tamanho > maxBytesDo(ct)) { await arq.delete({ ignoreNotFound: true }).catch(() => {}); return res.status(413).json({ error: `Arquivo grande demais. O limite é ${tipoPermitido(ct)!.maxMb} MB.` }); }
      const existente = String(meta?.metadata?.firebaseStorageDownloadTokens || '').split(',')[0].trim();
      const token = existente || novoToken();
      if (!existente) {
        await arq.setMetadata({ cacheControl: 'public, max-age=31536000', metadata: { firebaseStorageDownloadTokens: token, enviado_por: q.uid } });
      }
      res.setHeader?.('Cache-Control', 'no-store');
      res.json({ url: urlDeDownload(deps.nomeBucket, caminho, token), caminho, tamanho, contentType: ct });
    } catch (e: any) {
      console.error('[videos] confirmar:', e?.message || e);
      res.status(500).json({ error: 'Não consegui conferir o arquivo. Tente de novo.' });
    }
  }

  // DELETE /api/consultor/videos/arquivo  { url } ou { caminho }
  async function rotaApagar(req: any, res: any) {
    try {
      const q = await podeGravar(req, res);
      if (!q) return;
      const corpo = req.body || {};
      const caminho = corpo.caminho ? caminhoDaBiblioteca(corpo.caminho) : caminhoDoLink(corpo.url);
      if (!caminho) return res.status(400).json({ error: 'Só arquivos da biblioteca de vídeos.' });
      // ainda usado por algum cadastro (vídeo ou capa): não apaga, senão o cartão fica quebrado
      const snap = await deps.db.collection('consultor_videos').get();
      const emUso = (snap.docs || []).some((d: any) => {
        const x = d.data() || {};
        return caminhoDoLink(x.video_url) === caminho || caminhoDoLink(x.thumb_url) === caminho;
      });
      if (emUso) return res.status(409).json({ error: 'Este arquivo ainda está num vídeo cadastrado.' });
      await deps.arquivo(caminho).delete({ ignoreNotFound: true });
      res.json({ ok: true });
    } catch (e: any) {
      console.error('[videos] apagar:', e?.message || e);
      res.status(500).json({ error: 'Não consegui apagar o arquivo.' });
    }
  }

  return { rotaUploadUrl, rotaConfirmar, rotaApagar };
}
