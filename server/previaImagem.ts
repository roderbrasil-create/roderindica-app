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
import dns from 'dns';
import http from 'http';
import https from 'https';
import net from 'net';

export const OG_LARGURA = 1200;
export const OG_ALTURA = 630;
// 300 KB é o teto que o WhatsApp aceita na prática; fica uma folga
export const OG_MAX_BYTES = 290 * 1024;
// Foto de origem maior que isto nem é baixada (proteção de memória do servidor)
export const MAX_ORIGEM_BYTES = 15 * 1024 * 1024;
export const TEMPO_EXTERNA_MS = 4000;
// Mudar o desenho da arte (faixa, fundo) troca a versão: o WhatsApp e a CDN pedem a arte nova.
// a2: a versão a1 podia ter guardado no Storage a arte SEM foto quando o site estava lento; a
// troca de versão faz todas serem montadas de novo.
export const VERSAO_ARTE = 'a2';
// Foto com mais pixels que isto não é aberta (uma imagem pequena em bytes pode pedir GB de memória)
export const LIMITE_PIXELS = 40_000_000;
// Arte sem foto quando o equipamento TEM foto (site fora do ar, lento): fica só na memória por
// pouco tempo e o próximo pedido tenta de novo. Nunca vai para o Storage.
export const TEMPO_ARTE_PROVISORIA_MS = 3 * 60 * 1000;
// Lista de fotos de cada código, na memória: o /og não lê o banco duas vezes a cada pedido
export const TEMPO_CANDIDATAS_MS = 2 * 60 * 1000;
export const MAX_REDIRECIONAMENTOS = 3;
export const PORTAS_PERMITIDAS = [80, 443];
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

const hostPrivado = (h: string) => /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|.*\.local$|.*\.internal$|.*\.localhost$)/i.test(h);

// Endereços de rede que o servidor nunca acessa ao baixar foto de fora: a própria máquina, a
// rede interna da Hostinger, o endereço de metadados da nuvem (169.254.169.254), CGNAT,
// multicast e reservados. IPv6 mapeado de IPv4 (::ffff:127.0.0.1) também fica de fora, senão
// ele seria o jeito de passar por cima da lista de IPv4.
// Duas listas separadas: numa lista só, a regra IPv6 ::ffff:0:0/96 também pega TODO IPv4 (o
// Node compara IPv4 como mapeado) e nenhuma foto de fora baixaria.
const BLOQUEADOS_V4 = new net.BlockList();
const BLOQUEADOS_V6 = new net.BlockList();
(() => {
  const b = BLOQUEADOS_V4;
  for (const [ip, bits] of [
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
    ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
    ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
  ] as [string, number][]) b.addSubnet(ip, bits, 'ipv4');
  for (const [ip, bits] of [
    ['::', 96], ['::ffff:0:0', 96], ['64:ff9b::', 96], ['100::', 64], ['2001:db8::', 32],
    ['fc00::', 7], ['fe80::', 10], ['fec0::', 10], ['ff00::', 8],
  ] as [string, number][]) BLOQUEADOS_V6.addSubnet(ip, bits, 'ipv6');
})();

export function ipBloqueado(ip: string): boolean {
  const limpo = String(ip || '').replace(/^\[|\]$/g, '').split('%')[0];
  const tipo = net.isIP(limpo);
  if (tipo === 4) return BLOQUEADOS_V4.check(limpo, 'ipv4');
  if (tipo === 6) return BLOQUEADOS_V6.check(limpo, 'ipv6');
  return true; // não é IP: quem chama errou, recusa
}

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
  if (net.isIP(x.hostname.replace(/^\[|\]$/g, '')) && ipBloqueado(x.hostname)) return null;
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

export type Resolvedor = (host: string) => Promise<{ address: string; family: number }[]>;
const resolverPadrao: Resolvedor = (host) => dns.promises.lookup(host, { all: true, verbatim: true });

export interface OpcoesBaixar {
  tempoMs?: number;
  teto?: number;
  resolver?: Resolvedor;
  // só para teste (servidor local em porta alta): em produção são 80 e 443 e a lista de bloqueio
  portas?: number[];
  ipPermitido?: (ip: string) => boolean;
}

// Confere um endereço antes de cada salto: http/https, sem usuário e senha, porta 80 ou 443,
// nome que não é da rede interna. Devolve o IP JÁ CONFERIDO: a conexão vai para ele, e não para
// uma nova consulta de DNS (senão o DNS responde um IP público na conferência e 127.0.0.1 na
// conexão, o chamado "DNS rebinding").
export async function conferirDestino(url: string, op: OpcoesBaixar = {}): Promise<{ u: URL; ip: string; familia: number } | null> {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
  const porta = u.port ? Number(u.port) : (u.protocol === 'https:' ? 443 : 80);
  if (!(op.portas || PORTAS_PERMITIDAS).includes(porta)) return null;
  const host = u.hostname.replace(/^\[|\]$/g, '');
  const permitido = op.ipPermitido || ((ip: string) => !ipBloqueado(ip));
  if (net.isIP(host)) return permitido(host) ? { u, ip: host, familia: net.isIP(host) } : null;
  if (hostPrivado(host)) return null;
  let enderecos: { address: string; family: number }[];
  try { enderecos = await (op.resolver || resolverPadrao)(host); } catch { return null; }
  // um endereço ruim entre vários já recusa: o DNS pode alternar entre eles
  if (!enderecos.length || enderecos.some(e => !permitido(e.address))) return null;
  return { u, ip: enderecos[0].address, familia: enderecos[0].family || net.isIP(enderecos[0].address) };
}

function pedirUmSalto(alvo: { u: URL; ip: string; familia: number }, sinal: AbortSignal): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const mod = alvo.u.protocol === 'https:' ? https : http;
    const req = mod.request(alvo.u, {
      method: 'GET',
      signal: sinal,
      agent: false,
      // a conexão vai para o IP conferido; o nome continua no Host e no SNI do https
      lookup: ((_h: string, opcoes: any, cb: any) => {
        if (opcoes?.all) cb(null, [{ address: alvo.ip, family: alvo.familia }]);
        else cb(null, alvo.ip, alvo.familia);
      }) as any,
      headers: { 'User-Agent': 'Mozilla/5.0 (RoderIndica; previa do link)', Accept: 'image/jpeg,image/png,image/webp,image/*;q=0.8' },
    }, resolve);
    req.on('error', reject);
    req.end();
  });
}

async function lerStreamComTeto(r: http.IncomingMessage, teto: number): Promise<Buffer | null> {
  const tamanho = Number(r.headers['content-length'] || 0);
  if (tamanho && tamanho > teto) { r.destroy(); return null; }
  const partes: Buffer[] = [];
  let total = 0;
  for await (const pedaco of r) {
    total += (pedaco as Buffer).length;
    if (total > teto) { r.destroy(); return null; }
    partes.push(pedaco as Buffer);
  }
  return Buffer.concat(partes);
}

// Baixa uma foto de fora sem deixar o endereço virar porta para a rede interna: redirecionamento
// conferido salto a salto (no máximo 3), DNS conferido e o IP preso na conexão, só portas 80/443.
export async function baixarExterna(url: string, tempoMs = TEMPO_EXTERNA_MS, teto = MAX_ORIGEM_BYTES, op: OpcoesBaixar = {}): Promise<{ bytes: Buffer; tipo: string } | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), op.tempoMs ?? tempoMs);
  const limite = op.teto ?? teto;
  try {
    let atual = url;
    for (let salto = 0; salto <= MAX_REDIRECIONAMENTOS; salto++) {
      const alvo = await conferirDestino(atual, op);
      if (!alvo) return null;
      const r = await pedirUmSalto(alvo, ctl.signal);
      const st = r.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(st)) {
        const destino = r.headers.location;
        r.resume();
        if (!destino) return null;
        try { atual = new URL(String(destino), alvo.u).toString(); } catch { return null; }
        continue;
      }
      if (st < 200 || st >= 300) { r.resume(); return null; }
      const tipo = String(r.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (tipo && !tipo.startsWith('image/') && tipo !== 'application/octet-stream') { r.destroy(); return null; }
      const bytes = await lerStreamComTeto(r, limite);
      return bytes ? { bytes, tipo } : null;
    }
    return null; // redirecionamento demais
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
    const { data, info } = await sharp(buf, { failOn: 'none', limitInputPixels: LIMITE_PIXELS })
      .rotate()
      .resize({ width: maxL, height: maxA, fit: 'inside' })
      .flatten({ background: '#ffffff' })
      .png()
      .toBuffer({ resolveWithObject: true });
    return { input: data, left: Math.round((OG_LARGURA - info.width) / 2), top: Math.round(topoArea + (altoFoto - info.height) / 2) };
  };
  if (foto) camadas.push(await centro(foto, OG_LARGURA - MARGEM * 2, altoFoto - MARGEM * 2, 0));
  else if (logoRedonda) {
    const { data, info } = await sharp(logoRedonda, { limitInputPixels: LIMITE_PIXELS }).resize({ width: 380, height: 380, fit: 'inside' }).png().toBuffer({ resolveWithObject: true });
    camadas.push({ input: data, left: Math.round((OG_LARGURA - info.width) / 2), top: Math.round((altoFoto - info.height) / 2) });
  }
  // faixa de baixo
  camadas.push({ input: { create: { width: OG_LARGURA, height: FAIXA, channels: 3, background: '#ffffff' } }, left: 0, top: altoFoto });
  camadas.push({ input: { create: { width: OG_LARGURA, height: 5, channels: 3, background: LARANJA } }, left: 0, top: altoFoto });
  // na arte padrão a logo grande já está no meio: a faixa fica só com a linha laranja
  if (logoHorizontal && foto) {
    const { data, info } = await sharp(logoHorizontal, { limitInputPixels: LIMITE_PIXELS }).resize({ height: 46, width: 300, fit: 'inside' }).png().toBuffer({ resolveWithObject: true });
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
  // JPEG 1200x630 pronto (public/og-padrao.jpg): vai quando o sharp não carrega no servidor,
  // assim a og:image:type "image/jpeg" do HTML continua verdadeira
  artePadraoPronta?: () => Buffer | null;
  // true = este endereço passou do limite de pedidos que obrigam a ler o banco
  limitar?: (req: any) => boolean;
  agora?: () => number;
  log?: (msg: string) => void;
}

export function criarImagemPrevia(deps: DepsImagemPrevia) {
  const memoria = new GuardaRecente();
  // artes sem foto de equipamento que TEM foto: chave -> (arte, vale até)
  const provisorias = new Map<string, { jpeg: Buffer; ate: number }>();
  // código -> fotos do equipamento, por pouco tempo (a versão no nome do arquivo não muda nada aqui)
  const listas = new Map<string, { candidatas: string[]; ate: number }>();
  const emAndamento = new Map<string, Promise<{ jpeg: Buffer | null; provisoria: boolean }>>();
  const baixar = deps.baixar || ((u: string) => baixarExterna(u));
  const log = deps.log || (() => {});
  const agora = deps.agora || (() => Date.now());

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
  async function lerCandidatas(codigo: string): Promise<string[]> {
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

  function candidatasGuardadas(codigo: string): string[] | null {
    const g = listas.get(codigo);
    if (g && g.ate > agora()) return g.candidatas;
    if (g) listas.delete(codigo);
    return null;
  }

  async function candidatasDoCodigo(codigo: string): Promise<string[]> {
    const g = candidatasGuardadas(codigo);
    if (g) return g;
    const candidatas = await lerCandidatas(codigo);
    if (listas.size >= 1000) listas.clear();
    listas.set(codigo, { candidatas, ate: agora() + TEMPO_CANDIDATAS_MS });
    return candidatas;
  }

  async function gerar(chave: string, candidatas: string[]): Promise<{ jpeg: Buffer | null; provisoria: boolean }> {
    const sharp = await deps.carregarSharp();
    if (!sharp) return { jpeg: null, provisoria: false };
    let foto: Buffer | null = null;
    for (const c of candidatas) {
      const f = fonteDaFoto(c, deps.site, deps.buckets);
      if (!f) continue;
      const bytes = await bytesDaFonte(f);
      if (!bytes) continue;
      // só serve se a biblioteca consegue abrir (arquivo que não é imagem, ou corrompido, passa para a próxima)
      try { const meta = await sharp(bytes, { failOn: 'none', limitInputPixels: LIMITE_PIXELS }).metadata(); if (meta?.width && meta?.height && meta.width * meta.height <= LIMITE_PIXELS) { foto = bytes; break; } } catch { /* próxima */ }
    }
    const arte = await montarArte(sharp, foto, deps.logoHorizontal?.() || null, deps.logoRedonda?.() || null);
    const provisoria = !foto && candidatas.length > 0;
    if (provisoria) log(`[OG] nenhuma foto abriu para ${chave}; vai a arte padrão por ${TEMPO_ARTE_PROVISORIA_MS / 60000} min e tenta de novo depois`);
    return { jpeg: arte, provisoria };
  }

  // Arte de um código: memória, depois Storage, depois gera. Dois pedidos iguais ao mesmo tempo
  // (o WhatsApp do vendedor e o do cliente) geram uma vez só.
  async function arteDoCodigo(codigoBruto: string): Promise<{ jpeg: Buffer | null; chave: string; provisoria: boolean }> {
    const codigo = String(codigoBruto || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    const candidatas = await candidatasDoCodigo(codigo);
    const chave = versaoDaPrevia(candidatas);
    const daMemoria = memoria.get(chave);
    if (daMemoria) return { jpeg: daMemoria, chave, provisoria: false };
    const prov = provisorias.get(chave);
    if (prov && prov.ate > agora()) return { jpeg: prov.jpeg, chave, provisoria: true };
    if (prov) provisorias.delete(chave);
    let tarefa = emAndamento.get(chave);
    if (!tarefa) {
      tarefa = (async () => {
        try {
          const guardada = deps.lerCache ? await deps.lerCache(chave).catch(() => null) : null;
          if (guardada && guardada.length) return { jpeg: guardada, provisoria: false };
          const nova = await gerar(chave, candidatas);
          // a arte sem foto de um equipamento que tem foto NÃO vai para o Storage: lá ela ficaria
          // para sempre, e o link nunca mais mostraria o equipamento
          if (nova.jpeg && !nova.provisoria && deps.gravarCache) deps.gravarCache(chave, nova.jpeg).catch((e: any) => log(`[OG] não gravou o cache ${chave}: ${e?.message || e}`));
          return nova;
        } finally { emAndamento.delete(chave); }
      })();
      emAndamento.set(chave, tarefa);
    }
    const { jpeg, provisoria } = await tarefa;
    if (jpeg && provisoria) {
      if (provisorias.size >= 200) provisorias.clear();
      provisorias.set(chave, { jpeg, ate: agora() + TEMPO_ARTE_PROVISORIA_MS });
    } else if (jpeg) memoria.set(chave, jpeg);
    return { jpeg, chave, provisoria };
  }

  // GET /og/:arquivo  (ex.: /og/K7P2Q-3f9a0c1b2d.jpg)
  async function rota(req: any, res: any) {
    const nome = lerNomeArquivo(String(req.params?.arquivo || ''));
    if (!nome) { res.status(404).end(); return; }
    // o limite só pesa em quem obriga a ler o banco (código fora da memória): o robô do WhatsApp
    // pedindo de novo o mesmo link nunca é barrado
    if (deps.limitar && !candidatasGuardadas(nome.codigo) && deps.limitar(req)) {
      res.setHeader('Retry-After', '60');
      res.status(429).end();
      return;
    }
    try {
      const { jpeg, provisoria } = await arteDoCodigo(nome.codigo);
      if (jpeg) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Length', String(jpeg.length));
        // arte provisória (sem a foto que o equipamento tem): cache curto, para o WhatsApp e a CDN
        // pedirem de novo e receberem a arte com foto
        res.setHeader('Cache-Control', provisoria ? 'public, max-age=300' : 'public, max-age=86400, s-maxage=604800');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.status(200).end(jpeg);
        return;
      }
    } catch (e: any) { log(`[OG] erro ao montar ${nome.codigo}: ${e?.message || e}`); }
    // sem a biblioteca de imagem: a arte padrão JPEG já pronta (public/og-padrao.jpg); o HTML diz
    // image/jpeg, então mandar PNG aqui faria o WhatsApp desconfiar da prévia
    const pronta = deps.artePadraoPronta?.();
    if (pronta) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', String(pronta.length));
      res.setHeader('Cache-Control', 'public, max-age=600');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.status(200).end(pronta);
      return;
    }
    // último recurso: a logo PNG (pequena), que o WhatsApp também aceita
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
