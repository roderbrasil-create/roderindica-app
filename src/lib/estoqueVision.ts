// Roder Vision -> Indica: estoque semanal e importações em trânsito (POST /api/public/hooks/estoque).
// Funções puras: o servidor (server/estoqueVision.ts) lê o Firestore, chama estas funções e grava o plano.
// Regras do estoque (mesmas da tela Estoque > Atualizar do Indica):
//   chave = código + origem + filial; duplicata no envio vale a maior quantidade;
//   só mexe na origem + filial do envio; quantidade igual é ignorada;
//   quantidade 0 ou item que sumiu é removido, exceto com reserva ativa (fica com quantidade 0);
//   item novo (quantidade > 0) é criado.
// Importações: a lista inteira substitui a anterior; item com reserva ativa nunca é apagado.

export const ORIGENS_ESTOQUE = ['roder', 'fae', 'accessories', 'manual', 'sinop_pdf'] as const;
export const FILIAIS_ESTOQUE = ['matriz', 'sinop'] as const;
export type OrigemEstoque = (typeof ORIGENS_ESTOQUE)[number];
export type FilialEstoque = (typeof FILIAIS_ESTOQUE)[number];

export type ItemEnvio = { codigo: string; descricao: string; quantidade: number };
export type EnvioEstoque = { origem: OrigemEstoque; filial: FilialEstoque; enviado_em?: string; itens: ItemEnvio[] };
export type ItemExistente = { id: string; code?: string; description?: string; quantity?: number; source?: string; branch?: string };

export type PlanoEstoque = {
  criar: { code: string; description: string; quantity: number; source: OrigemEstoque; branch: FilialEstoque }[];
  atualizar: { id: string; quantity: number; description: string }[];
  remover: string[];
  zerar: string[]; // sumiu ou veio 0, mas tem reserva ativa
  ignorados: number;
};

const txt = (v: unknown, max = 300) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const qtd = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};
const chave = (code: string, source: string, branch: string) => `${code.trim().toUpperCase()}|${source.toLowerCase()}|${branch.toLowerCase()}`;

/** Valida o corpo { tipo:"estoque", origem, filial, itens }. Devolve o envio limpo ou o motivo da recusa. */
export function lerEnvioEstoque(c: any): { ok: true; envio: EnvioEstoque } | { ok: false; erro: string } {
  const origem = txt(c?.origem, 20).toLowerCase() as OrigemEstoque;
  const filial = txt(c?.filial, 20).toLowerCase() as FilialEstoque;
  if (!ORIGENS_ESTOQUE.includes(origem)) return { ok: false, erro: `origem inválida (use ${ORIGENS_ESTOQUE.join(', ')})` };
  if (!FILIAIS_ESTOQUE.includes(filial)) return { ok: false, erro: 'filial inválida (use matriz ou sinop)' };
  if (!Array.isArray(c?.itens)) return { ok: false, erro: 'itens precisa ser uma lista' };
  if (c.itens.length > 5000) return { ok: false, erro: 'itens demais (máximo 5000)' };
  const itens: ItemEnvio[] = [];
  for (const i of c.itens) {
    const codigo = txt(i?.codigo, 60);
    if (!codigo) continue;
    itens.push({ codigo, descricao: txt(i?.descricao) || 'Sem descrição', quantidade: qtd(i?.quantidade) });
  }
  return { ok: true, envio: { origem, filial, enviado_em: txt(c?.enviado_em, 40) || undefined, itens } };
}

/** Plano de gravação do estoque para uma origem + filial. `reservados` = ids de stock_items com reserva ativa. */
export function planejarEstoque(existentes: ItemExistente[], reservados: Set<string>, envio: EnvioEstoque): PlanoEstoque {
  // duplicata no envio: vale a maior quantidade
  const novos = new Map<string, ItemEnvio>();
  for (const i of envio.itens) {
    const k = chave(i.codigo, envio.origem, envio.filial);
    const atual = novos.get(k);
    if (!atual || i.quantidade > atual.quantidade) novos.set(k, i);
  }
  const plano: PlanoEstoque = { criar: [], atualizar: [], remover: [], zerar: [], ignorados: 0 };
  const vistos = new Set<string>();
  for (const e of existentes) {
    const src = String(e.source || '').toLowerCase();
    const br = String(e.branch || 'matriz').toLowerCase();
    if (src !== envio.origem || br !== envio.filial) continue; // outras origens/filiais não são tocadas
    const k = chave(String(e.code || ''), src, br);
    const novo = novos.get(k);
    const reservado = reservados.has(e.id);
    if (novo && !vistos.has(k)) {
      vistos.add(k);
      if (novo.quantidade === (Number(e.quantity) || 0)) { plano.ignorados++; continue; }
      if (novo.quantidade <= 0) {
        if (reservado) plano.zerar.push(e.id); else plano.remover.push(e.id);
        continue;
      }
      plano.atualizar.push({ id: e.id, quantity: novo.quantidade, description: novo.descricao || String(e.description || '') });
    } else {
      // sumiu do relatório (ou é um documento repetido da mesma chave)
      if (reservado) { if ((Number(e.quantity) || 0) !== 0) plano.zerar.push(e.id); else plano.ignorados++; }
      else plano.remover.push(e.id);
    }
  }
  for (const [k, i] of novos) {
    if (vistos.has(k) || i.quantidade <= 0) continue;
    plano.criar.push({ code: i.codigo.trim(), description: i.descricao, quantity: i.quantidade, source: envio.origem, branch: envio.filial });
  }
  return plano;
}

// ---------- Importações em trânsito ----------
export type ItemImportacaoEnvio = { descricao: string; quantidade: number; embarque: string; chegada: string };
export type ImportacaoExistente = { id: string; description?: string; quantity?: number; embarque?: string; chegada?: string; embarque_iso?: string; chegada_iso?: string };
export type PlanoImportacoes = {
  criar: { description: string; quantity: number; embarque: string; chegada: string; embarque_iso: string; chegada_iso: string }[];
  atualizar: { id: string; quantity: number; embarque: string; chegada: string; embarque_iso: string; chegada_iso: string }[];
  remover: string[];
  preservados: string[]; // sumiram da lista, mas têm reserva ativa
};

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
/** "2026-06-20" -> "20 jun, 2026" (formato que a tela do Indica já mostra). */
export function dataParaTela(iso: string): string {
  if (!DATA_ISO.test(iso)) return '';
  const [a, m, d] = iso.split('-');
  return `${d} ${MESES[Number(m) - 1]}, ${a}`;
}
const normDesc = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

export function lerEnvioImportacoes(c: any): { ok: true; itens: ItemImportacaoEnvio[] } | { ok: false; erro: string } {
  if (!Array.isArray(c?.itens)) return { ok: false, erro: 'itens precisa ser uma lista' };
  if (c.itens.length > 1000) return { ok: false, erro: 'itens demais (máximo 1000)' };
  const itens: ItemImportacaoEnvio[] = [];
  for (const i of c.itens) {
    const descricao = txt(i?.descricao);
    const quantidade = qtd(i?.quantidade);
    if (!descricao || quantidade <= 0) continue;
    const embarque = txt(i?.embarque, 10);
    const chegada = txt(i?.chegada, 10);
    if ((embarque && !DATA_ISO.test(embarque)) || (chegada && !DATA_ISO.test(chegada))) return { ok: false, erro: `data fora do formato AAAA-MM-DD em "${descricao}"` };
    itens.push({ descricao, quantidade, embarque, chegada });
  }
  return { ok: true, itens };
}

/** Substitui a lista inteira. Casa pelo texto da descrição + chegada (na ordem), para manter o id das reservas. */
export function planejarImportacoes(existentes: ImportacaoExistente[], reservados: Set<string>, itens: ItemImportacaoEnvio[]): PlanoImportacoes {
  const plano: PlanoImportacoes = { criar: [], atualizar: [], remover: [], preservados: [] };
  const livres = [...existentes];
  const pega = (pred: (e: ImportacaoExistente) => boolean) => {
    const idx = livres.findIndex(pred);
    return idx >= 0 ? livres.splice(idx, 1)[0] : null;
  };
  for (const i of itens) {
    const d = normDesc(i.descricao);
    const alvo = pega(e => normDesc(String(e.description || '')) === d && (e.chegada_iso || '') === i.chegada)
      ?? pega(e => normDesc(String(e.description || '')) === d);
    const campos = { quantity: i.quantidade, embarque: dataParaTela(i.embarque), chegada: dataParaTela(i.chegada), embarque_iso: i.embarque, chegada_iso: i.chegada };
    if (alvo) plano.atualizar.push({ id: alvo.id, ...campos });
    else plano.criar.push({ description: i.descricao, ...campos });
  }
  for (const e of livres) {
    if (reservados.has(e.id)) plano.preservados.push(e.id);
    else plano.remover.push(e.id);
  }
  return plano;
}

/** Comparação de chave sem vazar tempo (as duas strings são do mesmo tipo de origem). */
export function chavesIguais(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
