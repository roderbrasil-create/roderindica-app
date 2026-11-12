// Roder Indica <-> Roder Vision: rotas de conhecimento técnico (fichas, kits, compatibilidade,
// regras técnicas e ensinamentos). O Vision LÊ com uma chave de leitura e ENVIA ensinamentos
// com OUTRA chave, só de escrita. As duas ficam em api_keys com permissão explícita
// (permissions.vision_leitura / permissions.vision_escrita): a chave do estoque não abre nada aqui.
//
// REGRA DE OURO: cada resposta é montada campo a campo (lista branca). Nunca devolvemos o documento
// inteiro do Firestore, porque ele pode ganhar um campo de preço ou de cliente amanhã e sair sem
// ninguém perceber. NÃO saem: preço (custo, base_price, base_value), orçamentos, pedidos, comissões,
// dados de cliente e indicações, usuários/parceiros, chaves, reservas, autor dos ensinamentos.
import { INSTALLATION_KITS, ACCESSORIES_DATA } from '../src/constants';
import { TEXTOS_INSTALACAO } from '../src/lib/instalacao';
import { FICHAS_FAE } from '../src/data/fichasTrituradorFae';
import { REGRA_KIT_CONFIRMACAO, RESSALVA_KIT, KIT_BAIXA_SEM_LINHAS, TEXTO_CMF_CAT320 } from '../src/lib/confirmacaoMaquina';

export type DepsVision = { db: any; agora?: () => Date; log?: (...a: any[]) => void };
export type PedidoVision = { metodo: string; rota: string; query?: Record<string, any>; headers?: Record<string, any>; body?: any };
export type RespostaVision = { status: number; body: any };

export const ORIGEM_VISION = 'Roder Vision';
const LIMITE_POR_MINUTO = 120;
const janelas = new Map<string, { inicio: number; n: number }>();

export const limparLimiteVision = () => janelas.clear();
const passouDoLimite = (chave: string, agora: number) => {
  const j = janelas.get(chave);
  if (!j || agora - j.inicio >= 60_000) { janelas.set(chave, { inicio: agora, n: 1 }); return false; }
  j.n += 1;
  return j.n > LIMITE_POR_MINUTO;
};

// minúsculas, sem acento e sem pontuação: "Caterpillar 320D" casa com "caterpillar 320 d"
export const normVision = (v: any) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const txt = (v: any, max = 20000) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
const soDefinidos = (o: Record<string, any>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));
const envelope = (agora: Date, lista: any[], extra: Record<string, any> = {}) => ({ atualizado_em: agora.toISOString(), total: lista.length, ...extra });

// ---------- autenticação ----------
async function autenticar(db: any, headers: Record<string, any>, query: Record<string, any>, permissao: 'vision_leitura' | 'vision_escrita', agora: Date): Promise<{ ok: true; chaveId: string } | { ok: false; res: RespostaVision }> {
  const bruto = headers['x-api-key'] || headers['authorization'] || query.api_key;
  if (!bruto) return { ok: false, res: { status: 401, body: { success: false, error: 'Chave de API não fornecida. Envie no cabeçalho x-api-key.' } } };
  const s = String(bruto).trim();
  const token = s.startsWith('Bearer ') ? s.slice(7).trim() : s;
  let achou: any;
  try {
    achou = await db.collection('api_keys').where('key', '==', token).where('active', '==', true).limit(1).get();
  } catch {
    return { ok: false, res: { status: 500, body: { success: false, error: 'Falha ao validar a chave no servidor.' } } };
  }
  if (!achou || achou.empty) return { ok: false, res: { status: 403, body: { success: false, error: 'Chave de API inválida, inativa ou revogada.' } } };
  const doc = achou.docs[0];
  const dados = doc.data() || {};
  // permissão TEM de ser true: chave antiga (que só tem "stock") nunca abre estas rotas
  if (dados.permissions?.[permissao] !== true) {
    return { ok: false, res: { status: 403, body: { success: false, error: `Esta chave não tem a permissão ${permissao}.` } } };
  }
  if (passouDoLimite(doc.id, agora.getTime())) return { ok: false, res: { status: 429, body: { success: false, error: 'Muitas consultas. Espere um minuto.' } } };
  try { await doc.ref?.update?.({ last_used_at: agora.toISOString() }); } catch { /* só estatística */ }
  return { ok: true, chaveId: doc.id };
}

// ---------- montagem (lista branca) ----------
function fichasDe(produtos: any[]) {
  const fichas: any[] = [];
  for (const p of produtos) {
    if (p.is_blocked === true) continue;
    const base = { produto: txt(p.name, 200), categoria: txt(p.category, 100), descricao: txt(p.description, 3000) };
    const modelos: any[] = Array.isArray(p.models) ? p.models : [];
    if (!modelos.length) {
      fichas.push(soDefinidos({ ...base, modelo: null, ficha_url: txt(p.pdf_url, 1000), catalogo_pecas_url: txt(p.parts_manual_url, 1000), video_url: txt(p.video_url, 1000), imagem_url: txt(p.image_url, 1000) }));
      continue;
    }
    for (const m of modelos) {
      const e = m.technical_specs || {};
      fichas.push(soDefinidos({
        ...base,
        modelo: txt(m.name, 200),
        // ficha do modelo; se o modelo não tem, vale a do produto
        ficha_url: txt(m.pdf_url, 1000) || txt(p.pdf_url, 1000),
        catalogo_pecas_url: txt(m.parts_manual_url, 1000) || txt(p.parts_manual_url, 1000),
        video_url: txt(m.video_url, 1000) || txt(p.video_url, 1000),
        imagem_url: txt(m.image_url, 1000) || txt(p.image_url, 1000),
        produtividade: txt(m.productivity_text, 3000),
        specs: soDefinidos({
          area_carga: txt(e.area_carga, 200), diametro_minimo: txt(e.diametro_minimo, 200), abertura_maxima: txt(e.abertura_maxima, 200),
          peso: txt(e.peso, 200), pressao_trabalho: txt(e.pressao_trabalho, 200), maquina_base: txt(e.maquina_base, 200),
          diametro_corte: txt(e.diametro_corte, 200), comprimento_total: txt(e.comprimento_total, 200), profundidade_trabalho: txt(e.profundidade_trabalho, 200),
          sabre: txt(e.sabre, 200), corrente: txt(e.corrente, 200), vazao: txt(e.vazao, 200), pressao: txt(e.pressao, 200),
          peso_operacional: txt(e.peso_operacional, 200), motor: txt(e.motor, 200), giro_360: txt(e.giro_360, 200),
          dimensoes: txt(e.dimensoes, 200), capacidade_diametro: txt(e.capacidade_diametro, 200), capacidade_carga: txt(e.capacidade_carga, 200),
          finame: txt(e.finame, 200), linhaviva: txt(e.linhaviva, 200),
        }),
      }));
    }
  }
  return fichas;
}

const itemKit = (i: any) => soDefinidos({ codigo: txt(i.code, 60), quantidade: Number(i.quantity) || 0, descricao: txt(i.description, 300), unidade: txt(i.unit, 10) });
function kitsDe(doBanco: any[]) {
  const porCodigo = new Map<string, any>();
  // o cadastro do banco manda; o que só existe na lista do ERP (constants.ts) completa
  for (const k of INSTALLATION_KITS) porCodigo.set(k.code, { codigo: k.code, descricao: k.description, itens: (k.items || []).map(itemKit), fonte: 'erp' });
  for (const k of doBanco) {
    const codigo = txt(k.code, 60);
    if (!codigo) continue;
    porCodigo.set(codigo, soDefinidos({ codigo, descricao: txt(k.description, 400), itens: (Array.isArray(k.items) ? k.items : []).map(itemKit), foto_url: txt(k.photo_url, 1000), fonte: 'cadastro' }));
  }
  return Array.from(porCodigo.values()).sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
}

const maquinaDe = (a: any) => soDefinidos({
  marca: txt(a.brand, 100), modelo: txt(a.model, 150), pino: txt(a.pin, 100),
  ponteira_biela_4: txt(a.ponteira_biela_4, 60), ponteira_biela_6: txt(a.ponteira_biela_6, 60),
  suporte_destocador: txt(a.suporte_destocador, 60), suporte_triturador: txt(a.suporte_triturador, 60),
  link_garra_biela_4: txt(a.link_garra_biela_4, 60), link_garra_biela_6: txt(a.link_garra_biela_6, 60),
  fotos: soDefinidos({ ponteira: txt(a.photo_urls?.ponteira, 1000), suporte: txt(a.photo_urls?.suporte, 1000), link: txt(a.photo_urls?.link, 1000) }),
});
function compatibilidadeDe(doBanco: any[], marca: string, modelo: string) {
  const porChave = new Map<string, any>();
  const chave = (a: any) => `${normVision(a.brand)}|${normVision(a.model)}`;
  for (const a of ACCESSORIES_DATA) porChave.set(chave(a), a);
  for (const a of doBanco) porChave.set(chave(a), a);
  const m = normVision(marca), mo = normVision(modelo);
  return Array.from(porChave.values())
    .filter(a => (!m || normVision(a.brand).includes(m)) && (!mo || normVision(a.model).includes(mo)))
    .map(maquinaDe)
    .sort((a, b) => `${a.marca}${a.modelo}`.localeCompare(`${b.marca}${b.modelo}`));
}

function regrasTecnicas() {
  const regras: any[] = [];
  for (const [perfil, v] of Object.entries(TEXTOS_INSTALACAO)) {
    regras.push({ id: `instalacao:${perfil}`, assunto: 'Perfil de instalação', equipamento: perfil, texto: v.consultor, itens_incluidos: v.itens, fonte: 'codigo' });
  }
  regras.push({ id: 'kit:confirmacao-da-maquina', assunto: 'Kit de instalação: confirmação da máquina', equipamento: 'escavadeira', texto: REGRA_KIT_CONFIRMACAO.trim(), fonte: 'codigo' });
  regras.push({ id: 'kit:ressalva', assunto: 'Kit de instalação: ressalva', equipamento: 'escavadeira', texto: RESSALVA_KIT, fonte: 'codigo' });
  regras.push({ id: 'kit:baixa-9003', assunto: 'Kit de baixa 9000.9000.9003', equipamento: 'escavadeira', texto: KIT_BAIXA_SEM_LINHAS, fonte: 'codigo' });
  regras.push({ id: 'cmf:cat320-nova', assunto: 'CMF em CAT 320 nova', equipamento: 'Cabeçote CMF', texto: TEXTO_CMF_CAT320, fonte: 'codigo' });
  for (const f of Object.values(FICHAS_FAE)) {
    regras.push({
      id: `ficha-fae:${f.chave}`, assunto: 'Ficha do triturador FAE', equipamento: f.nome, texto: f.descricao, fonte: 'codigo',
      largura_rotor: f.largura, dentes: f.dentes.map(d => ({ titulo: d.titulo, texto: d.texto })), vantagens: f.vantagens,
      tabela: f.linhas.map(l => l.celulas),
    });
  }
  return regras;
}

// só ensinamento técnico: pergunta respondida e melhorada. Sem autor, sem e-mail de ninguém.
function ensinamentoDe(id: string, d: any) {
  return soDefinidos({
    id, titulo: txt(d.question || d.title, 300), texto: txt(d.improvedAnswer || d.answer || d.text, 20000), data: txt(d.timestamp, 40),
    origem: txt(d.source, 100), assunto: txt(d.assunto, 200), equipamento: txt(d.equipamento, 200), id_externo: txt(d.id_externo, 128),
    imagens: Array.isArray(d.imagens) ? d.imagens.filter((u: any) => typeof u === 'string').slice(0, 10) : undefined,
  });
}

const ID_EXTERNO = /^[A-Za-z0-9_.:-]{1,128}$/;
const DATA_DESDE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;

async function gravarEnsinamento(db: any, body: any, agora: Date): Promise<RespostaVision> {
  const b = body && typeof body === 'object' ? body : {};
  const titulo = txt(b.titulo, 300), texto = txt(b.texto, 20000);
  const idExterno = typeof b.id_externo === 'string' ? b.id_externo.trim() : '';
  if (!titulo || !texto) return { status: 400, body: { success: false, error: 'Envie titulo e texto.' } };
  if (!ID_EXTERNO.test(idExterno)) return { status: 400, body: { success: false, error: 'id_externo é obrigatório (letras, números, _ . : -, até 128).' } };
  let imagens: string[] = [];
  if (b.imagens !== undefined) {
    if (!Array.isArray(b.imagens) || b.imagens.length > 10 || !b.imagens.every((u: any) => typeof u === 'string' && /^https:\/\/\S{3,1000}$/.test(u))) {
      return { status: 400, body: { success: false, error: 'imagens deve ser uma lista de até 10 links https.' } };
    }
    imagens = b.imagens;
  }
  // o documento do Vision tem id próprio (vision_...): nunca sobrescreve um ensinamento do Indica
  const ref = db.collection('roder_ai_questions').doc(`vision_${idExterno}`);
  const antes = await ref.get();
  const existia = !!antes?.exists;
  const iso = agora.toISOString();
  await ref.set({
    question: titulo, improvedAnswer: texto, isImproved: true, source: ORIGEM_VISION, author: ORIGEM_VISION,
    assunto: txt(b.assunto, 200) ?? null, equipamento: txt(b.equipamento, 200) ?? null, imagens, id_externo: idExterno,
    timestamp: iso, atualizado_em: iso, ...(existia ? {} : { criado_em: iso }),
  }, { merge: true });
  return { status: 200, body: { success: true, id: `vision_${idExterno}`, criado: !existia, atualizado: existia, atualizado_em: iso } };
}

// ---------- entrada única ----------
export async function tratarVision(deps: DepsVision, p: PedidoVision): Promise<RespostaVision> {
  const { db } = deps;
  const agora = (deps.agora ?? (() => new Date()))();
  const headers = p.headers || {}, query = p.query || {}, metodo = p.metodo.toUpperCase();
  const escrita = metodo === 'POST' && p.rota === '/api/v1/ensinamentos';
  const leitura = metodo === 'GET' && ['/api/v1/fichas', '/api/v1/kits-instalacao', '/api/v1/compatibilidade', '/api/v1/regras-tecnicas', '/api/v1/ensinamentos'].includes(p.rota);
  if (!escrita && !leitura) return { status: 405, body: { success: false, error: 'Método não permitido. O Vision só lê, e só envia ensinamentos.' } };

  const aut = await autenticar(db, headers, query, escrita ? 'vision_escrita' : 'vision_leitura', agora);
  if (!aut.ok) return aut.res;

  try {
    if (escrita) return await gravarEnsinamento(db, p.body, agora);
    if (p.rota === '/api/v1/fichas') {
      const s = await db.collection('products').get();
      const fichas = fichasDe(s.docs.map((d: any) => d.data()));
      return { status: 200, body: { success: true, ...envelope(agora, fichas), fichas } };
    }
    if (p.rota === '/api/v1/kits-instalacao') {
      const s = await db.collection('installation_kits').get();
      const kits = kitsDe(s.docs.map((d: any) => d.data()));
      return { status: 200, body: { success: true, ...envelope(agora, kits), kits } };
    }
    if (p.rota === '/api/v1/compatibilidade') {
      const s = await db.collection('accessories').get();
      const maquinas = compatibilidadeDe(s.docs.map((d: any) => d.data()), String(query.marca ?? ''), String(query.modelo ?? ''));
      return { status: 200, body: { success: true, ...envelope(agora, maquinas), maquinas } };
    }
    if (p.rota === '/api/v1/regras-tecnicas') {
      const regras = regrasTecnicas();
      return { status: 200, body: { success: true, ...envelope(agora, regras), regras } };
    }
    // ensinamentos
    const desde = query.desde === undefined || query.desde === '' ? '' : String(query.desde);
    if (desde && !DATA_DESDE.test(desde)) return { status: 400, body: { success: false, error: 'desde deve ser AAAA-MM-DD.' } };
    const s = await db.collection('roder_ai_questions').where('isImproved', '==', true).get();
    const ensinamentos = s.docs
      .map((d: any) => ensinamentoDe(d.id, d.data()))
      .filter((e: any) => e.titulo && e.texto && (!desde || String(e.data || '') >= desde))
      .sort((a: any, b: any) => String(b.data || '').localeCompare(String(a.data || '')));
    return { status: 200, body: { success: true, ...envelope(agora, ensinamentos), ensinamentos } };
  } catch (e: any) {
    deps.log?.('[VISION] erro', e?.message);
    return { status: 500, body: { success: false, error: 'Falha ao montar a resposta.' } };
  }
}

export function registrarRotasVision(app: any, deps: DepsVision) {
  const cors = (res: any) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  };
  const rotas = ['/api/v1/fichas', '/api/v1/kits-instalacao', '/api/v1/compatibilidade', '/api/v1/regras-tecnicas', '/api/v1/ensinamentos'];
  for (const rota of rotas) {
    app.options(rota, (_req: any, res: any) => { cors(res); res.status(204).end(); });
    app.all(rota, async (req: any, res: any) => {
      cors(res);
      const r = await tratarVision(deps, { metodo: req.method, rota, query: req.query, headers: req.headers, body: req.body });
      res.status(r.status).json(r.body);
    });
  }
}
