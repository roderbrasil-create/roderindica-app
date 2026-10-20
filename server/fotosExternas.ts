// "TRAZER FOTOS DO SITE PARA O APP" (Admin > Configurações, só o administrador).
//
// Parte das fotos do catálogo aponta para o site roderbrasil.com.br (ou outro endereço de fora).
// Se o site mudar o endereço, sair do ar ou trocar a foto, o app e a prévia do WhatsApp ficam sem
// foto. Esta manutenção baixa cada foto de fora uma vez, guarda no Storage do app (catalogo_site/)
// e troca o endereço no produto e no modelo.
// Primeiro roda SEM gravar (aplicar=0) e mostra o que faria; só com aplicar=1 grava. O mapa
// "endereço antigo -> novo" fica em manutencao_fotos_externas, para voltar se precisar.
import crypto from 'crypto';
import { fonteDaFoto, baixarExterna, MAX_ORIGEM_BYTES } from './previaImagem';

export const MAX_URLS_POR_RODADA = 300;
const SIMULTANEAS = 4;

export type Referencia = { pid: string; produto: string; campo: string; url: string };

// Onde o catálogo guarda foto: image_url e images do produto, images e image_url de cada modelo
export function referenciasExternas(produtos: { id: string; data: any }[], site: string, buckets: string[]): Referencia[] {
  const saida: Referencia[] = [];
  const olhar = (pid: string, produto: string, campo: string, v: any) => {
    if (typeof v !== 'string' || !v.trim()) return;
    if (fonteDaFoto(v, site, buckets)?.tipo === 'externa') saida.push({ pid, produto, campo, url: v.trim() });
  };
  for (const { id, data: p } of produtos) {
    const nome = String(p?.name || id);
    olhar(id, nome, 'image_url', p?.image_url);
    (Array.isArray(p?.images) ? p.images : []).forEach((u: any, j: number) => olhar(id, nome, `images[${j}]`, u));
    (Array.isArray(p?.models) ? p.models : []).forEach((m: any, i: number) => {
      const nm = `${nome} ${m?.name || ''}`.trim();
      (Array.isArray(m?.images) ? m.images : []).forEach((u: any, j: number) => olhar(id, nm, `models[${i}].images[${j}]`, u));
      olhar(id, nm, `models[${i}].image_url`, m?.image_url);
    });
  }
  return saida;
}

// Troca, no produto, só os endereços que foram copiados (o resto do documento fica igual)
export function trocarEnderecos(p: any, mapa: Record<string, string>): { novo: any; trocas: number } {
  let trocas = 0;
  const t = (v: any) => (typeof v === 'string' && mapa[v.trim()] ? (trocas++, mapa[v.trim()]) : v);
  const novo: any = {};
  if ('image_url' in (p || {})) novo.image_url = t(p.image_url);
  if (Array.isArray(p?.images)) novo.images = p.images.map(t);
  if (Array.isArray(p?.models)) novo.models = p.models.map((m: any) => {
    const x = { ...m };
    if (Array.isArray(m?.images)) x.images = m.images.map(t);
    if ('image_url' in (m || {})) x.image_url = t(m.image_url);
    return x;
  });
  return { novo, trocas };
}

const EXT: Record<string, string> = { jpeg: 'jpg', jpg: 'jpg', png: 'png', webp: 'webp', gif: 'gif', avif: 'avif' };

export interface DepsFotosExternas {
  db: any;
  site: string;
  buckets: string[];
  bucketDestino: string;
  carregarSharp: () => Promise<any | null>;
  baixar?: (url: string) => Promise<{ bytes: Buffer; tipo: string } | null>;
  // grava no Storage e devolve o endereço público (link de download do Firebase)
  gravar: (caminho: string, bytes: Buffer, tipo: string) => Promise<string>;
  agora?: () => Date;
}

export async function fotosExternas(deps: DepsFotosExternas, aplicar: boolean, quem: string) {
  const snap = await deps.db.collection('products').get();
  const produtos = snap.docs.map((d: any) => ({ id: d.id, data: d.data() }));
  const refs = referenciasExternas(produtos, deps.site, deps.buckets);
  const unicas = [...new Set(refs.map(r => r.url))];
  const nestaRodada = unicas.slice(0, MAX_URLS_POR_RODADA);
  const sharp = await deps.carregarSharp();
  const baixar = deps.baixar || ((u: string) => baixarExterna(u, 15000, MAX_ORIGEM_BYTES));

  type Item = { url: string; usos: number; produtos: string[]; ok: boolean; motivo?: string; bytes?: number; formato?: string; novo?: string };
  const itens: Item[] = nestaRodada.map(url => {
    const usos = refs.filter(r => r.url === url);
    return { url, usos: usos.length, produtos: [...new Set(usos.map(r => r.produto))].slice(0, 6), ok: false };
  });

  let proximo = 0;
  const trabalhar = async () => {
    while (proximo < itens.length) {
      const it = itens[proximo++];
      const r = await baixar(it.url);
      if (!r) { it.motivo = 'não baixou (fora do ar, lento ou acima de 15 MB)'; continue; }
      let formato = (r.tipo.split('/')[1] || '').replace('jpg', 'jpeg');
      if (sharp) {
        try { const meta = await sharp(r.bytes, { failOn: 'none' }).metadata(); formato = String(meta?.format || ''); if (!meta?.width) throw new Error('sem imagem'); }
        catch { it.motivo = 'o arquivo não é uma imagem'; continue; }
      } else if (!r.tipo.startsWith('image/')) { it.motivo = 'o arquivo não é uma imagem'; continue; }
      if (!EXT[formato]) { it.motivo = `formato ${formato || 'desconhecido'} não usado no app`; continue; }
      it.ok = true; it.bytes = r.bytes.length; it.formato = formato;
      if (aplicar) {
        const nome = crypto.createHash('sha1').update(it.url).digest('hex').slice(0, 20);
        try { it.novo = await deps.gravar(`catalogo_site/${nome}.${EXT[formato]}`, r.bytes, `image/${formato === 'jpg' ? 'jpeg' : formato}`); }
        catch (e: any) { it.ok = false; it.motivo = `não gravou no Storage: ${String(e?.message || e).slice(0, 120)}`; }
      }
    }
  };
  await Promise.all(Array.from({ length: SIMULTANEAS }, trabalhar));

  const mapa: Record<string, string> = {};
  for (const it of itens) if (it.ok && it.novo) mapa[it.url] = it.novo;
  const alterados: { pid: string; trocas: number }[] = [];
  if (aplicar && Object.keys(mapa).length) {
    for (const pid of [...new Set(refs.filter(r => mapa[r.url]).map(r => r.pid))]) {
      const ref = deps.db.collection('products').doc(pid);
      // relê o produto na hora: alguém pode ter mexido no catálogo durante os downloads
      const trocas = await deps.db.runTransaction(async (t: any) => {
        const s = await t.get(ref);
        if (!s.exists) return 0;
        const { novo, trocas } = trocarEnderecos(s.data(), mapa);
        if (trocas) t.update(ref, novo);
        return trocas;
      });
      if (trocas) alterados.push({ pid, trocas });
    }
    await deps.db.collection('manutencao_fotos_externas').doc().set({
      feito_em: (deps.agora?.() || new Date()).toISOString(), quem, mapa, produtos_alterados: alterados,
    });
  }

  return {
    ok: true,
    aplicado: aplicar,
    referencias: refs.length,
    fotos_de_fora: unicas.length,
    nesta_rodada: itens.length,
    copiaveis: itens.filter(i => i.ok).length,
    com_problema: itens.filter(i => !i.ok).length,
    produtos_alterados: alterados.length,
    faltam_para_proxima_rodada: Math.max(0, unicas.length - itens.length),
    itens,
  };
}
