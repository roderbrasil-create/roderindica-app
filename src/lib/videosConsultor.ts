// Biblioteca de vídeos do consultor (pedido do Jeferson em 19/10/2026).
// Cada vídeo é ligado a um equipamento (e, se quiser, a um modelo), tem um título curto e um
// CONTEXTO em texto livre ("CMF 600 derrubando e traçando metrinho, eucalipto, em PC200"). É o
// contexto que deixa o consultor escolher o vídeo certo para a pergunta.
// Os vídeos que já estão no catálogo (video_url do produto ou do modelo) entram sozinhos como
// tipo "catalogo", montados aqui na hora: não são copiados para o banco, senão viram duas fontes.
// Sem dependência do navegador: o servidor e os testes importam este arquivo.
import { tituloFicha } from './tituloFicha';
import { PRODUCT_VIDEOS, videoValido } from './videoEquipamento';

export type TipoVideo = 'campo' | 'marketing' | 'instalacao' | 'catalogo';

export const TIPOS_VIDEO: { id: Exclude<TipoVideo, 'catalogo'>; rotulo: string }[] = [
  { id: 'campo', rotulo: 'Em campo' },
  { id: 'marketing', rotulo: 'Marketing' },
  { id: 'instalacao', rotulo: 'Instalação' },
];
export const ROTULO_TIPO: Record<TipoVideo, string> = { campo: 'Em campo', marketing: 'Marketing', instalacao: 'Instalação', catalogo: 'Catálogo' };

// O que sai para o navegador e para o prompt. Nada de quem cadastrou nem datas: a lista é pública
// (o parceiro pelo link e o visitante não têm login).
export type VideoConsultor = {
  id: string;
  produto_id: string;
  modelo_id?: string;
  equipamento_nome: string;
  modelo_nome?: string;
  tipo: TipoVideo;
  contexto: string;
  titulo: string;
  video_url: string;
  thumb_url?: string;
  duracao_s?: number;
  no_carrossel?: boolean;
  ordem?: number;
};

export const MAX_TITULO = 80;
export const MAX_CONTEXTO = 400;
export const MAX_VIDEOS_RESPOSTA = 3;
export const MAX_VIDEOS_PROMPT = 80;

const texto = (v: any, max: number) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// Id da entrada do catálogo: nasce do produto e do modelo, então é o mesmo em toda chamada
// (o consultor cita o id numa resposta e o navegador acha o vídeo depois)
export const idDoCatalogo = (pid: string, mid?: string) => `cat_${pid}_${mid || 'p'}`.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 120);

// Documento de consultor_videos/{id} -> entrada pública (ou nulo se inativo ou incompleto)
export function lerVideoDoBanco(id: string, d: any): VideoConsultor | null {
  if (!d || d.ativo === false) return null;
  const url = videoValido(d.video_url);
  const pid = texto(d.produto_id, 80);
  if (!url || !pid) return null;
  const tipo: TipoVideo = ['campo', 'marketing', 'instalacao'].includes(d.tipo) ? d.tipo : 'campo';
  const thumb = /^https:\/\//i.test(String(d.thumb_url || '')) ? String(d.thumb_url).slice(0, 2000) : '';
  const dur = Number(d.duracao_s);
  return {
    id: String(id),
    produto_id: pid,
    ...(d.modelo_id ? { modelo_id: texto(d.modelo_id, 80) } : {}),
    equipamento_nome: texto(d.equipamento_nome, 120),
    ...(d.modelo_nome ? { modelo_nome: texto(d.modelo_nome, 80) } : {}),
    tipo,
    contexto: texto(d.contexto, MAX_CONTEXTO),
    titulo: texto(d.titulo, MAX_TITULO) || texto(d.equipamento_nome, MAX_TITULO),
    video_url: url,
    ...(thumb ? { thumb_url: thumb } : {}),
    ...(dur > 0 && dur < 36000 ? { duracao_s: Math.round(dur) } : {}),
    no_carrossel: d.no_carrossel === true,
    ordem: Number.isFinite(Number(d.ordem)) ? Number(d.ordem) : 0,
  };
}

// Vídeos do catálogo: o do modelo, o do produto e o mapa fixo por nome. Um vídeo repetido no mesmo
// equipamento (as garras R250 a R800 usam o mesmo) vira uma entrada só. Vídeo que já está na
// biblioteca não entra de novo.
export function videosDoCatalogo(produtos: any[], jaNaBiblioteca: Set<string> = new Set()): VideoConsultor[] {
  const saida: VideoConsultor[] = [];
  const vistos = new Set<string>();
  for (const p of produtos || []) {
    if (!p || p.is_blocked || !p.id) continue;
    const add = (url: string, m: any) => {
      const v = videoValido(url);
      if (!v || jaNaBiblioteca.has(v) || vistos.has(`${p.id}|${v}`)) return;
      vistos.add(`${p.id}|${v}`);
      const nome = m ? tituloFicha(p, m) : String(p.name || '');
      saida.push({
        id: idDoCatalogo(String(p.id), m?.id ? String(m.id) : undefined),
        produto_id: String(p.id),
        ...(m?.id ? { modelo_id: String(m.id), modelo_nome: texto(m.name, 80) } : {}),
        equipamento_nome: texto(p.name, 120),
        tipo: 'catalogo',
        contexto: 'Vídeo do catálogo',
        titulo: texto(nome, MAX_TITULO),
        video_url: v,
        no_carrossel: false,
        ordem: 9999,
      });
    };
    for (const m of p.models || []) add(m?.video_url, m);
    add(p.video_url, null);
    for (const m of p.models || []) add(PRODUCT_VIDEOS[String(m?.name || '')], m);
    add(PRODUCT_VIDEOS[String(p.name || '')], null);
  }
  return saida;
}

// Lista completa: biblioteca (ativos, pela ordem) e depois o catálogo
export function montarListaVideos(docs: { id: string; data: any }[], produtos: any[]): VideoConsultor[] {
  const bloqueados = new Set((produtos || []).filter(p => p?.is_blocked).map(p => String(p.id)));
  const biblioteca = (docs || [])
    .map(d => lerVideoDoBanco(d.id, d.data))
    .filter((v): v is VideoConsultor => !!v && !bloqueados.has(v.produto_id))
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.titulo.localeCompare(b.titulo));
  const urls = new Set(biblioteca.map(v => v.video_url));
  return [...biblioteca, ...videosDoCatalogo(produtos, urls)];
}

export function nomeDoVideo(v: VideoConsultor): string {
  return tituloFicha({ name: v.equipamento_nome || '' }, { name: v.modelo_nome || '' });
}

// Lista compacta para o prompt: os da biblioteca primeiro (são os que têm contexto), depois o catálogo
export function videosParaPrompt(lista: VideoConsultor[], max = MAX_VIDEOS_PROMPT): string {
  return (lista || []).slice(0, max)
    .map(v => `- ${v.id} | ${nomeDoVideo(v)} | ${v.titulo}${v.contexto && v.tipo !== 'catalogo' ? ` | ${v.contexto}` : ''}`)
    .join('\n');
}

// "videos" do bloco <painel>: só ids conhecidos, sem repetir, no máximo 3
export function lerIdsVideos(bruto: any, validos?: Set<string> | null): string[] {
  if (!Array.isArray(bruto)) return [];
  const saida: string[] = [];
  for (const x of bruto) {
    const id = typeof x === 'string' ? x.trim() : '';
    if (!id || id.length > 120 || !/^[A-Za-z0-9_-]+$/.test(id)) continue;
    if (validos && !validos.has(id)) continue;
    if (!saida.includes(id)) saida.push(id);
    if (saida.length >= MAX_VIDEOS_RESPOSTA) break;
  }
  return saida;
}

export function formatarDuracao(s?: number): string {
  const n = Math.round(Number(s) || 0);
  if (n <= 0) return '';
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const ss = String(n % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

// Busca da folha "Vídeos": sem acento, cada palavra tem de aparecer em algum campo
const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function filtrarVideos(lista: VideoConsultor[], busca: string): VideoConsultor[] {
  const termos = semAcento(busca || '').split(/\s+/).filter(Boolean);
  if (!termos.length) return lista;
  return lista.filter(v => {
    const alvo = semAcento(`${v.equipamento_nome} ${v.modelo_nome || ''} ${v.titulo} ${v.contexto} ${ROTULO_TIPO[v.tipo]}`);
    return termos.every(t => alvo.includes(t));
  });
}

// Agrupa por equipamento, na ordem em que aparecem
export function agruparPorEquipamento(lista: VideoConsultor[]): { produto_id: string; nome: string; videos: VideoConsultor[] }[] {
  const grupos = new Map<string, { produto_id: string; nome: string; videos: VideoConsultor[] }>();
  for (const v of lista) {
    const g = grupos.get(v.produto_id) || { produto_id: v.produto_id, nome: v.equipamento_nome, videos: [] };
    g.videos.push(v);
    grupos.set(v.produto_id, g);
  }
  return Array.from(grupos.values());
}

// Capa do YouTube (o arquivo do Storage usa a capa gravada no cadastro)
export function capaDoVideo(v: Pick<VideoConsultor, 'thumb_url' | 'video_url'>): string {
  if (v.thumb_url) return v.thumb_url;
  const u = String(v.video_url || '');
  const m = /(youtube\.com|youtube-nocookie\.com|youtu\.be)/i.test(u)
    ? (u.match(/[?&]v=([A-Za-z0-9_-]{6,20})/) || u.match(/youtu\.be\/([A-Za-z0-9_-]{6,20})/) || u.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{6,20})/))
    : null;
  return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : '';
}
