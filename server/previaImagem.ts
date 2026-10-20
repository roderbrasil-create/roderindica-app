// FOTO DA PRÉVIA DO LINK CURTO NO WHATSAPP: roderindica.com/og/K7P2Q-<versão>.jpg
//
// A mensagem chegava com texto e link, mas sem a foto grande. O WhatsApp só mostra a foto quando
// ela é JPEG ou PNG pequena (na prática até uns 300 KB), abre rápido e sem login. As fotos do
// catálogo vêm de três lugares e quase nenhuma cumpria isso:
//   - site roderbrasil.com.br: arquivos .webp (o WhatsApp não monta prévia com WebP de forma confiável);
//   - Firebase Storage: foto original do celular, 1 a 4 MB;
//   - db-file://<id>: base64 no Firestore (app_files), muitas vezes acima de 300 KB.
// Aqui o servidor busca a foto do equipamento onde ela estiver e devolve SEMPRE um JPEG
// 1200x630 (a proporção que o WhatsApp mostra grande), com a foto inteira centralizada num fundo
// claro e uma faixa com a logo da Roder, abaixo de 300 KB. O resultado fica guardado na memória
// e no Storage (og_cache/), então só o primeiro envio de cada foto paga o trabalho.
// Separado do server.ts para o teste rodar com fontes falsas, sem Firebase.
import crypto from 'crypto';

export const OG_LARGURA = 1200;
export const OG_ALTURA = 630;
// 300 KB é o teto que o WhatsApp aceita na prática; fica uma folga
export const OG_MAX_BYTES = 290 * 1024;
// Foto de origem maior que isto nem é baixada (proteção de memória do servidor)
export const MAX_ORIGEM_BYTES = 15 * 1024 * 1024;
export const TEMPO_EXTERNA_MS = 4000;
// Mudar o desenho da arte (faixa, fundo) troca a versão: o WhatsApp e a CDN pedem a arte nova
export const VERSAO_ARTE = 'a1';
export const CODIGO_PADRAO = 'PADRAO'; // tem "O", que o alfabeto do link curto não usa: nunca colide
export const PASTA_CACHE = 'og_cache';

const FAIXA = 70; // faixa branca de baixo com a logo
const MARGEM = 24;
const FUNDO = '#f1f2f4';
const LARANJA = '#f97316';

export type FonteFoto =
  | { tipo: 'banco'; id: string }
  | { tipo: 'storage'; bucket: string; caminho: string }
  | { tipo: 'externa'; url: string }
  | { tipo: 'local'; caminho: string };

const hostPrivado = (h: string) => /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|.*\.local$|.*\.internal$)/i.test(h);

// De onde vem a foto. Só endereços do próprio catálogo chegam aqui (a rota não recebe URL de
// fora), mas mesmo assim endereço interno da rede é recusado.
export function fonteDaFoto(u: string, site: string, buckets: string[]): FonteFoto | null {
  const s = String(u || '').trim();
  if (!s || s.length > 2000) return null;
  const banco = s.match(/^db-file:\/\/([A-Za-z0-9_-]{1,128})$/);
  if (banco) return { tipo: 'banco', id: banco[1] };
  if (s.startsWith('/') && !s.startsWith('//')) {
    const caminho = s.split(/[?#]/)[0];
    if (caminho.split('/').some(t => t === '..')) return null;
    const foto = caminho.match(/^\/api\/foto\/([A-Za-z0-9_-]{1,128})$/);
    if (foto) return { tipo: 'banco', id: foto[1] };
    return { tipo: 'local', caminho };
  }
  let x: URL;
  try { x = new URL(s); } catch { return null; }
  if (!/^https?:$/.test(x.protocol) || x.username || x.password || hostPrivado(x.hostname)) return null;
  try {
    const nosso = new URL(site);
    if (x.hostname === nosso.hostname || x.hostname === `www.${nosso.hostname}`) {
      const foto = x.pathname.match(/^\/api\/foto\/([A-Za-z0-9_-]{1,128})$/);
      if (foto) return { tipo: 'banco', id: decodeURIComponent(foto[1]) };
      if (!x.pathname.split('/').some(t => t === '..')) return { tipo: 'local', caminho: decodeURIComponent(x.pathname) };
    }
    if (x.hostname === 'firebasestorage.googleapis.com') {
      const m = x.pathname.match(/^\/v0\/b\/([^/]+)\/o\/([^/]+)$/);
      if (m && buckets.includes(decodeURIComponent(m[1]))) return { tipo: 'storage', bucket: decodeURIComponent(m[1]), caminho: decodeURIComponent(m[2]) };
    } else if (x.hostname === 'storage.googleapis.com') {
      const m = x.pathname.match(/^\/([^/]+)\/(.+)$/);
      if (m && buckets.includes(decodeURIComponent(m[1]))) return { tipo: 'storage', bucket: decodeURIComponent(m[1]), caminho: decodeURIComponent(m[2]) };
    }
  } catch { return null; }
  return { tipo: 'externa', url: x.toString() };
}

// Fotos do equipamento do link, na ordem de preferência: do modelo, depois a do produto.
// Endereço antigo do AI Studio (run.app) não abre mais e fica de fora.
export function candidatasDoLink(p: any, m: any): string[] {
  const lista = [...(Array.isArray(m?.images) ? m.images : []), m?.image_url, p?.image_url, ...(Array.isArray(p?.images) ? p.images : [])]
    .filter((i: any) => typeof i === 'string' && i.trim() && !/run\.app/.test(i))
    .map((i: string) => i.trim());
  return [...new Set(lista)].slice(0, 4);
}

// A versão entra no NOME do arquivo (não em ?v=): a CDN da Hostinger e o WhatsApp guardam a
// imagem pelo endereço, e a foto trocada no catálogo precisa de endereço novo para aparecer.
export function versaoDaPrevia(candidatas: string[]): string {
  return crypto.createHash('sha1').update(`${VERSAO_ARTE}|${candidatas.join('|')}`).digest('hex').slice(0, 10);
}

export function urlImagemPrevia(site: string, codigo: string, candidatas: string[]): string {
  const c = candidatas.length ? codigo : CODIGO_PADRAO;
  return `${site.replace(/\/$/, '')}/og/${c}-${versaoDaPrevia(candidatas)}.jpg`;
}

export function lerNomeArquivo(nome: string): { codigo: string } | null {
  const m = String(nome || '').match(/^([A-Za-z0-9]{1,12})(?:-[a-f0-9]{4,16})?\.jpe?g$/);
  return m ? { codigo: m[1].toUpperCase() } : null;
}

// Lê o corpo da resposta até o teto; acima dele desiste (não carrega 200 MB na memória)
export async function lerComTeto(r: Response, teto: number): Promise<Buffer | null> {
  const tamanho = Number(r.headers.get('content-length') || 0);
  if (tamanho && tamanho > teto) { try { await r.body?.cancel(); } catch { /* nada */ } return null; }
  if (!r.body) return null;
  const partes: Buffer[] = [];
  let total = 0;
  const leitor = (r.body as any).getReader();
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    total += value.length;
    if (total > teto) { try { await leitor.cancel(); } catch { /* nada */ } return null; }
    partes.push(Buffer.from(value));
  }
  return Buffer.concat(partes);
}

export async function baixarExterna(url: string, tempoMs = TEMPO_EXTERNA_MS, teto = MAX_ORIGEM_BYTES): Promise<{ bytes: Buffer; tipo: string } | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), tempoMs);
  try {
    const r = await fetch(url, {
      signal: ctl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (RoderIndica; previa do link)', Accept: 'image/jpeg,image/png,image/webp,image/*;q=0.8' },
    });
    if (!r.ok) { try { await r.body?.cancel(); } catch { /* nada */ } return null; }
    const tipo = String(r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (tipo && !tipo.startsWith('image/') && tipo !== 'application/octet-stream') { try { await r.body?.cancel(); } catch { /* nada */ } return null; }
    const bytes = await lerComTeto(r, teto);
    return bytes ? { bytes, tipo } : null;
  } catch { return null; } finally { clearTimeout(t); }
}

// Guardado simples por ordem de uso: as artes mais pedidas ficam na memória, sem passar de ~20 MB
export class GuardaRecente {
  private mapa = new Map<string, Buffer>();
  private total = 0;
  constructor(private maxItens = 80, private maxBytes = 20 * 1024 * 1024) {}
  get(k: string) { const v = this.mapa.get(k); if (v) { this.mapa.delete(k); this.mapa.set(k, v); } return v; }
  set(k: string, v: Buffer) {
    const antigo = this.mapa.get(k);
    if (antigo) { this.total -= antigo.length; this.mapa.delete(k); }
    this.mapa.set(k, v); this.total += v.length;
    while (this.mapa.size > this.maxItens || this.total > this.maxBytes) {
      const [k0, v0] = this.mapa.entries().next().value as [string, Buffer];
      this.mapa.delete(k0); this.total -= v0.length;
    }
  }
  get tamanho() { return this.mapa.size; }
}

// A arte: foto inteira (sem cortar o equipamento) centralizada no fundo claro, faixa branca com
// linha laranja e a logo horizontal. Sem texto desenhado: o servidor pode não ter fontes.
export async function montarArte(sharp: any, foto: Buffer | null, logoHorizontal: Buffer | null, logoRedonda: Buffer | null): Promise<Buffer> {
  const altoFoto = OG_ALTURA - FAIXA;
  const camadas: any[] = [];
  const centro = async (buf: Buffer, maxL: number, maxA: number, topoArea: number) => {
    const { data, info } = await sharp(buf, { failOn: 'none', limitInputPixels: 100_000_000 })
      .rotate()
      .resize({ width: maxL, height: maxA, fit: 'inside' })
      .flatten({ background: '#ffffff' })
      .png()
      .toBuffer({ resolveWithObject: true });
    return { input: data, left: Math.round((OG_LARGURA - info.width) / 2), top: Math.round(topoArea + (altoFoto - info.height) / 2) };
  };
  if (foto) camadas.push(await centro(foto, OG_LARGURA - MARGEM * 2, altoFoto - MARGEM * 2, 0));
  else if (logoRedonda) {
    const { data, info } = await sharp(logoRedonda).resize({ width: 380, height: 380, fit: 'inside' }).png().toBuffer({ resolveWithObject: true });
    camadas.push({ input: data, left: Math.round((OG_LARGURA - info.width) / 2), top: Math.round((altoFoto - info.height) / 2) });
  }
  // faixa de baixo
  camadas.push({ input: { create: { width: OG_LARGURA, height: FAIXA, channels: 3, background: '#ffffff' } }, left: 0, top: altoFoto });
  camadas.push({ input: { create: { width: OG_LARGURA, height: 5, channels: 3, background: LARANJA } }, left: 0, top: altoFoto });
  // na arte padrão a logo grande já está no meio: a faixa fica só com a linha laranja
  if (logoHorizontal && foto) {
    const { data, info } = await sharp(logoHorizontal).resize({ height: 46, width: 300, fit: 'inside' }).png().toBuffer({ resolveWithObject: true });
    camadas.push({ input: data, left: 32, top: altoFoto + 5 + Math.round((FAIXA - 5 - info.height) / 2) });
  }
  const base = await sharp({ create: { width: OG_LARGURA, height: OG_ALTURA, channels: 3, background: FUNDO } })
    .composite(camadas).png().toBuffer();
  // abaixa a qualidade até caber no teto do WhatsApp (quase sempre cabe na primeira)
  let saida: Buffer = Buffer.alloc(0);
  for (const q of [82, 74, 66, 58, 50, 42, 34]) {
    saida = await sharp(base).jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer();
    if (saida.length <= OG_MAX_BYTES) break;
  }
  return saida;
}

export interface DepsImagemPrevia {
  db: any;
  site: string;
  buckets: string[];
  // sharp é nativo; se não carregar no servidor, a rota manda a logo PNG em vez de quebrar
  carregarSharp: () => Promise<any | null>;
  lerStorage: (bucket: string, caminho: string) => Promise<Buffer | null>;
  lerCache?: (chave: string) => Promise<Buffer | null>;
  gravarCache?: (chave: string, jpeg: Buffer) => Promise<void>;
  baixar?: (url: string) => Promise<{ bytes: Buffer; tipo: string } | null>;
  lerLocal?: (caminho: string) => Buffer | null;
  logoHorizontal?: () => Buffer | null;
  logoRedonda?: () => Buffer | null;
  log?: (msg: string) => void;
}

export function criarImagemPrevia(deps: DepsImagemPrevia) {
  const memoria = new GuardaRecente();
  const emAndamento = new Map<string, Promise<Buffer | null>>();
  const baixar = deps.baixar || ((u: string) => baixarExterna(u));
  const log = deps.log || (() => {});

  async function bytesDaFonte(f: FonteFoto): Promise<Buffer | null> {
    try {
      if (f.tipo === 'banco') {
        const snap = await deps.db.collection('app_files').doc(f.id).get();
        const dados = String((snap.exists && snap.data()?.data) || '');
        const m = dados.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/is);
        return m ? Buffer.from(m[1], 'base64') : null;
      }
      if (f.tipo === 'storage') return await deps.lerStorage(f.bucket, f.caminho);
      if (f.tipo === 'local') return deps.lerLocal ? deps.lerLocal(f.caminho) : null;
      const r = await baixar(f.url);
      return r?.bytes || null;
    } catch { return null; }
  }

  // Fotos do equipamento do link (vazio: código desconhecido ou equipamento apagado)
  async function candidatasDoCodigo(codigo: string): Promise<string[]> {
    if (!codigo || codigo === CODIGO_PADRAO) return [];
    try {
      const link = await deps.db.collection('links_curtos').doc(codigo).get();
      if (!link?.exists) return [];
      const l: any = link.data();
      const prod = await deps.db.collection('products').doc(String(l.pid || '_')).get();
      if (!prod?.exists) return [];
      const p: any = prod.data();
      const m: any = (p.models || []).find((x: any) => x.id === l.mid) || null;
      return candidatasDoLink(p, m);
    } catch { return []; }
  }

  async function gerar(chave: string, candidatas: string[]): Promise<Buffer | null> {
    const sharp = await deps.carregarSharp();
    if (!sharp) return null;
    let foto: Buffer | null = null;
    for (const c of candidatas) {
      const f = fonteDaFoto(c, deps.site, deps.buckets);
      if (!f) continue;
      const bytes = await bytesDaFonte(f);
      if (!bytes) continue;
      // só serve se a biblioteca consegue abrir (arquivo que não é imagem, ou corrompido, passa para a próxima)
      try { const meta = await sharp(bytes, { failOn: 'none' }).metadata(); if (meta?.width && meta?.height) { foto = bytes; break; } } catch { /* próxima */ }
    }
    const arte = await montarArte(sharp, foto, deps.logoHorizontal?.() || null, deps.logoRedonda?.() || null);
    if (!foto && candidatas.length) log(`[OG] nenhuma foto abriu para ${chave}; vai a arte padrão`);
    return arte;
  }

  // Arte de um código: memória, depois Storage, depois gera. Dois pedidos iguais ao mesmo tempo
  // (o WhatsApp do vendedor e o do cliente) geram uma vez só.
  async function arteDoCodigo(codigoBruto: string): Promise<{ jpeg: Buffer | null; chave: string }> {
    const codigo = String(codigoBruto || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    const candidatas = await candidatasDoCodigo(codigo);
    const chave = versaoDaPrevia(candidatas);
    const daMemoria = memoria.get(chave);
    if (daMemoria) return { jpeg: daMemoria, chave };
    let tarefa = emAndamento.get(chave);
    if (!tarefa) {
      tarefa = (async () => {
        try {
          const guardada = deps.lerCache ? await deps.lerCache(chave).catch(() => null) : null;
          if (guardada && guardada.length) return guardada;
          const nova = await gerar(chave, candidatas);
          if (nova && deps.gravarCache) deps.gravarCache(chave, nova).catch((e: any) => log(`[OG] não gravou o cache ${chave}: ${e?.message || e}`));
          return nova;
        } finally { emAndamento.delete(chave); }
      })();
      emAndamento.set(chave, tarefa);
    }
    const jpeg = await tarefa;
    if (jpeg) memoria.set(chave, jpeg);
    return { jpeg, chave };
  }

  // GET /og/:arquivo  (ex.: /og/K7P2Q-3f9a0c1b2d.jpg)
  async function rota(req: any, res: any) {
    const nome = lerNomeArquivo(String(req.params?.arquivo || ''));
    if (!nome) { res.status(404).end(); return; }
    try {
      const { jpeg } = await arteDoCodigo(nome.codigo);
      if (jpeg) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Length', String(jpeg.length));
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.status(200).end(jpeg);
        return;
      }
    } catch (e: any) { log(`[OG] erro ao montar ${nome.codigo}: ${e?.message || e}`); }
    // sem a biblioteca de imagem: a logo PNG (pequena), que o WhatsApp também aceita
    const logo = deps.logoRedonda?.();
    if (logo) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', String(logo.length));
      res.setHeader('Cache-Control', 'public, max-age=600');
      res.status(200).end(logo);
      return;
    }
    res.status(404).end();
  }

  // Esquenta a arte assim que a página /o/ é servida: quando o WhatsApp pedir a imagem, logo
  // depois, ela já está pronta (o robô dele desiste se a imagem demora).
  function esquentar(codigo: string) { arteDoCodigo(codigo).catch(() => {}); }

  return { rota, arteDoCodigo, esquentar, candidatasDoCodigo, memoria };
}
