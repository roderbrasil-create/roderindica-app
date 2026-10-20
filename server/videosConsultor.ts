// Biblioteca de vídeos do consultor no servidor.
// consultor_videos/{id} só a equipe lê pelas regras do Firestore (lá ficam quem cadastrou e quando).
// O consultor é usado também pelo parceiro pelo link e pelo visitante, sem login: por isso a lista
// sai por aqui, só com os campos que podem ir para qualquer um, e guardada 60 s na memória
// (o consultor pede a lista a cada pergunta; o catálogo quase não muda).
import { montarListaVideos, videosParaPrompt, lerIdsVideos, MAX_VIDEOS_RESPOSTA, type VideoConsultor } from '../src/lib/videosConsultor';

export const VALIDADE_CACHE_MS = 60 * 1000;

export function criarBibliotecaVideos(deps: { db: any; agora?: () => number }) {
  const agora = () => (deps.agora ? deps.agora() : Date.now());
  let cache: { ate: number; lista: VideoConsultor[] } | null = null;
  let emCurso: Promise<VideoConsultor[]> | null = null;

  async function carregar(): Promise<VideoConsultor[]> {
    const [vids, prods] = await Promise.all([
      deps.db.collection('consultor_videos').get(),
      deps.db.collection('products').get(),
    ]);
    const docs = (vids.docs || []).map((d: any) => ({ id: d.id, data: d.data() }));
    const produtos = (prods.docs || []).map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
    return montarListaVideos(docs, produtos);
  }

  async function listar(): Promise<VideoConsultor[]> {
    if (cache && cache.ate > agora()) return cache.lista;
    // vários pedidos juntos leem o banco uma vez só
    if (!emCurso) {
      emCurso = carregar()
        .then(lista => { cache = { ate: agora() + VALIDADE_CACHE_MS, lista }; return lista; })
        .finally(() => { emCurso = null; });
    }
    try { return await emCurso; } catch { return cache?.lista || []; }
  }

  const limpar = () => { cache = null; };

  // GET /api/consultor/videos -> { videos: [...] }
  async function rotaListar(req: any, res: any) {
    try {
      // a tela de cadastro pede a lista nova logo depois de salvar
      if (String(req.query?.fresco || '') === '1') limpar();
      const videos = await listar();
      res.setHeader?.('Cache-Control', 'public, max-age=60');
      res.json({ videos });
    } catch {
      res.status(500).json({ error: 'Não consegui carregar os vídeos.' });
    }
  }

  return { listar, limpar, rotaListar };
}

// Instrução do prompt: a lista compacta e quando citar um vídeo no <painel>
export function instrucaoVideos(lista: VideoConsultor[]): string {
  if (!lista.length) return '';
  return `\n\nVÍDEOS DISPONÍVEIS (id | equipamento | título | contexto):\n${videosParaPrompt(lista)}
- Quando a pessoa pedir vídeo, ou quando um vídeo claramente ajudar (ex.: pergunta como o equipamento trabalha numa operação, material ou máquina específica), acrescente no JSON do <painel> o campo "videos": ["<id>", ...] com no máximo ${MAX_VIDEOS_RESPOSTA} ids DESTA lista, os mais próximos da pergunta (mesmo equipamento e modelo; o contexto diz a operação). Prefira os que têm contexto parecido com o da pergunta.
- Ao mandar vídeo, diga no texto, curto: "Tenho vídeo disso." (os cartões com o vídeo aparecem sozinhos embaixo da resposta; não escreva link nem id do vídeo no texto).
- Nunca invente id. Sem vídeo do equipamento na lista, não ponha o campo e não prometa vídeo.`;
}

// Limpa o JSON do <painel> que o modelo escreveu: objeto válido, e "videos" só com ids conhecidos.
// Devolve o JSON pronto para guardar e mandar ao app, ou '' se o bloco não serve.
export function sanitizarPainel(json: string, idsValidos: Set<string> | null): string {
  try {
    const obj = JSON.parse(String(json || '').trim());
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return '';
    if ('videos' in obj) {
      const ids = lerIdsVideos(obj.videos, idsValidos || new Set());
      if (ids.length) obj.videos = ids; else delete obj.videos;
    }
    return Object.keys(obj).length ? JSON.stringify(obj) : '';
  } catch {
    return '';
  }
}
