// "TRAZER FOTOS DO SITE PARA O APP" (Admin > Configurações, só o administrador).
//
// Parte das fotos do catálogo aponta para o site roderbrasil.com.br (ou outro endereço de fora).
// Se o site mudar o endereço, sair do ar ou trocar a foto, o app e a prévia do WhatsApp ficam sem
// foto. Esta manutenção baixa cada foto de fora uma vez, guarda no Storage do app (catalogo_site/)
// e troca o endereço no produto e no modelo.
// Primeiro roda SEM gravar (aplicar=0) e mostra o que faria; só com aplicar=1 grava. O mapa
// "endereço antigo -> novo" fica em manutencao_fotos_externas ANTES de qualquer troca, para
// voltar se precisar (mesmo se o servidor cair no meio).
// Cada rodada faz no máximo 60 fotos (o pedido não pode passar do tempo do servidor da
// Hostinger) e duas rodadas ao mesmo tempo são barradas por uma trava no banco.
import crypto from 'crypto';
import { fonteDaFoto, baixarExterna, MAX_ORIGEM_BYTES, LIMITE_PIXELS } from './previaImagem';

export const MAX_URLS_POR_RODADA = 60;
const SIMULTANEAS = 4;
// Trava de rodada: vale por 10 minutos; se o servidor cair no meio, ela solta sozinha
export const TRAVA_MS = 10 * 60 * 1000;
export const COLECAO_ESTADO = 'manutencao_estado';
export const DOC_TRAVA = 'fotos_externas';
// Endereços que falharam vão para o fim da fila: senão 60 fotos mortas travariam o resto para sempre
const MAX_FALHAS_LEMBRADAS = 1000;

export class RodadaEmAndamento extends Error {
  constructor() { super('Já tem uma rodada de fotos rodando. Espere alguns minutos e tente de novo.'); }
}

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

// Pega a trava da rodada (transação: dois cliques juntos, ou duas abas, não pegam os dois)
async function pegarTrava(db: any, dono: string, agora: Date): Promise<string[]> {
  const ref = db.collection(COLECAO_ESTADO).doc(DOC_TRAVA);
  return db.runTransaction(async (t: any) => {
    const s = await t.get(ref);
    const d: any = s.exists ? s.data() : {};
    if (d?.travado_ate && new Date(d.travado_ate).getTime() > agora.getTime() && d.dono !== dono) throw new RodadaEmAndamento();
    t.set(ref, { ...d, dono, travado_ate: new Date(agora.getTime() + TRAVA_MS).toISOString() });
    return Array.isArray(d?.falhas) ? d.falhas.map(String) : [];
  });
}

async function soltarTrava(db: any, dono: string, falhas: string[] | null) {
  const ref = db.collection(COLECAO_ESTADO).doc(DOC_TRAVA);
  await db.runTransaction(async (t: any) => {
    const s = await t.get(ref);
    const d: any = s.exists ? s.data() : {};
    if (d?.dono && d.dono !== dono) return; // a trava venceu e outra rodada já pegou
    t.set(ref, { ...d, dono: '', travado_ate: '', ...(falhas ? { falhas: falhas.slice(-MAX_FALHAS_LEMBRADAS) } : {}) });
  });
}

export async function fotosExternas(deps: DepsFotosExternas, aplicar: boolean, quem: string) {
  const agora = () => deps.agora?.() || new Date();
  const dono = crypto.randomUUID();
  const falhasAntes = await pegarTrava(deps.db, dono, agora());
  let falhasDepois: string[] | null = null;
  try {
    const snap = await deps.db.collection('products').get();
    const produtos = snap.docs.map((d: any) => ({ id: d.id, data: d.data() }));
    const refs = referenciasExternas(produtos, deps.site, deps.buckets);
    const unicas = [...new Set(refs.map(r => r.url))];
    // as que já falharam antes vão para o fim da fila
    const jaFalhou = new Set(falhasAntes);
    const fila = [...unicas.filter(u => !jaFalhou.has(u)), ...unicas.filter(u => jaFalhou.has(u))];
    const nestaRodada = fila.slice(0, MAX_URLS_POR_RODADA);
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
        try {
          const r = await baixar(it.url);
          if (!r) { it.motivo = 'não baixou (fora do ar, lento ou acima de 15 MB)'; continue; }
          let formato = (r.tipo.split('/')[1] || '').replace('jpg', 'jpeg');
          if (sharp) {
            try { const meta = await sharp(r.bytes, { failOn: 'none', limitInputPixels: LIMITE_PIXELS }).metadata(); formato = String(meta?.format || ''); if (!meta?.width) throw new Error('sem imagem'); }
            catch { it.motivo = 'o arquivo não é uma imagem (ou é grande demais)'; continue; }
          } else if (!r.tipo.startsWith('image/')) { it.motivo = 'o arquivo não é uma imagem'; continue; }
          if (!EXT[formato]) { it.motivo = `formato ${formato || 'desconhecido'} não usado no app`; continue; }
          it.ok = true; it.bytes = r.bytes.length; it.formato = formato;
          if (aplicar) {
            const nome = crypto.createHash('sha1').update(it.url).digest('hex').slice(0, 20);
            try { it.novo = await deps.gravar(`catalogo_site/${nome}.${EXT[formato]}`, r.bytes, `image/${formato === 'jpg' ? 'jpeg' : formato}`); }
            catch (e: any) { it.ok = false; it.motivo = `não gravou no Storage: ${String(e?.message || e).slice(0, 120)}`; }
          }
        } catch (e: any) { it.ok = false; it.motivo = `erro: ${String(e?.message || e).slice(0, 120)}`; }
      }
    };
    await Promise.all(Array.from({ length: SIMULTANEAS }, trabalhar));

    const mapa: Record<string, string> = {};
    for (const it of itens) if (it.ok && it.novo) mapa[it.url] = it.novo;
    const alterados: { pid: string; trocas: number }[] = [];
    const erros: { pid: string; erro: string }[] = [];
    if (aplicar && Object.keys(mapa).length) {
      // o mapa para voltar é gravado ANTES da primeira troca. Lista de {de, para}: endereço como
      // nome de campo do Firestore quebra (ponto, barra) e não dá para consultar.
      const registro = deps.db.collection('manutencao_fotos_externas').doc();
      await registro.set({
        feito_em: agora().toISOString(), quem, situacao: 'trocando',
        mapa: Object.entries(mapa).map(([de, para]) => ({ de, para })),
        produtos_alterados: [], erros: [],
      });
      try {
        for (const pid of [...new Set(refs.filter(r => mapa[r.url]).map(r => r.pid))]) {
          // um produto com problema não para os outros
          try {
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
          } catch (e: any) { erros.push({ pid, erro: String(e?.message || e).slice(0, 200) }); }
        }
      } finally {
        await registro.set({
          feito_em: agora().toISOString(), quem, situacao: erros.length ? 'concluido_com_erros' : 'concluido',
          mapa: Object.entries(mapa).map(([de, para]) => ({ de, para })),
          produtos_alterados: alterados, erros, terminado_em: agora().toISOString(),
        });
      }
    }
    // a fila da próxima rodada: quem falhou agora vai para o fim; quem deu certo sai da lista.
    // Só na rodada que grava: a conferência mostra sempre as mesmas fotos que a cópia vai pegar.
    const okAgora = new Set(itens.filter(i => i.ok).map(i => i.url));
    const falhouAgora = itens.filter(i => !i.ok).map(i => i.url);
    if (aplicar) falhasDepois = [...falhasAntes.filter(u => !okAgora.has(u) && !falhouAgora.includes(u)), ...falhouAgora];

    const faltam = aplicar
      ? Math.max(0, unicas.length - itens.filter(i => i.ok && i.novo).length)
      : Math.max(0, unicas.length - itens.length);
    return {
      ok: true,
      aplicado: aplicar,
      referencias: refs.length,
      fotos_de_fora: unicas.length,
      nesta_rodada: itens.length,
      limite_por_rodada: MAX_URLS_POR_RODADA,
      copiaveis: itens.filter(i => i.ok).length,
      com_problema: itens.filter(i => !i.ok).length,
      produtos_alterados: alterados.length,
      erros_ao_trocar: erros.length,
      faltam_para_proxima_rodada: faltam,
      itens,
    };
  } finally {
    await soltarTrava(deps.db, dono, falhasDepois).catch(() => {});
  }
}
