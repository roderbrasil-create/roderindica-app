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

// ---------- Reservas e vendidos (Roder Vision, tela Disponibilidade) ----------
// Corpo: { tipo:"reservas", enviado_em, itens:[{ id, tipo:"reserva"|"vendido", codigo, origem, filial, importacao,
//          descricao, chegada, quantidade, cliente, vendedor, expira_em }] }. A lista é a COMPLETA: substitui as
// reservas ativas do Indica. Reserva antiga que não veio fica com status "substituida_vision" (não é apagada).
export type ItemReservaEnvio = {
  id: string; tipo: 'reserva' | 'vendido'; codigo: string; origem: string; filial: FilialEstoque; importacao: boolean;
  descricao: string; chegada: string; quantidade: number; cliente: string; vendedor: string; expira_em: string; pedido_venda?: string;
};
export type ReservaExistente = { id: string; status?: string };
export type ItemParaReserva = { id: string; code?: string; source?: string; branch?: string };
export type ImportacaoParaReserva = { id: string; description?: string; chegada_iso?: string };
export type PlanoReservas = {
  gravar: { id: string; dados: Record<string, any> }[];
  substituir: string[];
  sem_item: string[]; // id do Vision sem item correspondente no Indica (gravada mesmo assim, sem contar no disponível)
};

const ID_VISION = /^[A-Za-z0-9_.:-]{1,120}$/;
export const idReservaVision = (id: string) => `vision_${id.replace(/[^A-Za-z0-9_-]/g, '_')}`;

/**
 * Aceita o formato combinado com a tela Disponibilidade do Vision:
 *   { tipo:"reservas", enviado_em, reservas:[{ codigo_item, empresa:"matriz|sinop|fae", tipo:"reserva|vendido", quantidade,
 *     cliente, vendedora, pedido_venda, expira_em (null para vendido), id_origem }] }
 * e também { itens:[{ id, codigo, origem, filial, importacao, descricao, chegada, ... }] }. Lista vazia = nenhuma reserva.
 */
export function lerEnvioReservas(c: any): { ok: true; itens: ItemReservaEnvio[] } | { ok: false; erro: string } {
  const lista = Array.isArray(c?.reservas) ? c.reservas : c?.itens;
  if (!Array.isArray(lista)) return { ok: false, erro: 'reservas precisa ser uma lista' };
  if (lista.length > 3000) return { ok: false, erro: 'reservas demais (máximo 3000)' };
  const itens: ItemReservaEnvio[] = [];
  const vistos = new Set<string>();
  for (const i of lista) {
    const id = txt(i?.id_origem ?? i?.id, 120);
    if (!ID_VISION.test(id) || vistos.has(id)) return { ok: false, erro: `id_origem inválido ou repetido: "${id}"` };
    vistos.add(id);
    const quantidade = qtd(i?.quantidade ?? 1);
    if (quantidade <= 0) continue;
    const expira = txt(i?.expira_em, 40);
    if (expira && Number.isNaN(new Date(expira).getTime())) return { ok: false, erro: `expira_em inválido em "${id}"` };
    const chegada = txt(i?.chegada, 10);
    if (chegada && !DATA_ISO.test(chegada)) return { ok: false, erro: `chegada fora do formato AAAA-MM-DD em "${id}"` };
    const empresa = txt(i?.empresa, 20).toLowerCase();
    const filial: FilialEstoque = (txt(i?.filial, 20).toLowerCase() || empresa) === 'sinop' ? 'sinop' : 'matriz';
    const origem = txt(i?.origem, 20).toLowerCase() || (empresa === 'fae' ? 'fae' : empresa === 'sinop' ? 'sinop_pdf' : '');
    const pedido = txt(i?.pedido_venda, 40);
    itens.push({
      id, tipo: i?.tipo === 'vendido' ? 'vendido' : 'reserva', codigo: txt(i?.codigo_item ?? i?.codigo, 60), origem, filial,
      importacao: i?.importacao === true, descricao: txt(i?.descricao) || (pedido ? `Pedido ${pedido}` : ''), chegada, quantidade,
      cliente: txt(i?.cliente, 200), vendedor: txt(i?.vendedora ?? i?.vendedor, 200), expira_em: expira, pedido_venda: pedido,
    });
  }
  return { ok: true, itens };
}

/** Plano para substituir as reservas ativas pela lista do Vision. `agora` define a validade padrão (5 dias). */
export function planejarReservas(existentes: ReservaExistente[], itensEstoque: ItemParaReserva[], importacoes: ImportacaoParaReserva[], itens: ItemReservaEnvio[], agora: Date): PlanoReservas {
  const plano: PlanoReservas = { gravar: [], substituir: [], sem_item: [] };
  const porChave = new Map<string, string>();
  const porCodigoFilial = new Map<string, string>();
  for (const e of itensEstoque) {
    const cod = String(e.code || '').trim().toUpperCase();
    if (!cod) continue;
    const br = String(e.branch || 'matriz').toLowerCase();
    porChave.set(`${cod}|${String(e.source || '').toLowerCase()}|${br}`, e.id);
    if (!porCodigoFilial.has(`${cod}|${br}`)) porCodigoFilial.set(`${cod}|${br}`, e.id);
  }
  const ids = new Set<string>();
  for (const i of itens) {
    const id = idReservaVision(i.id);
    ids.add(id);
    const dados: Record<string, any> = {
      quantity_reserved: i.quantidade, status: 'active', kind: i.tipo, seller_name: i.vendedor || 'Roder Vision',
      client_name: i.cliente, item_code: i.codigo, item_description: i.descricao, origem_envio: 'roder_vision', id_vision: i.id,
      is_external: false, pedido_venda: i.pedido_venda || null,
    };
    const validade = i.tipo === 'vendido' ? new Date(agora.getTime() + 80 * 365 * 864e5)
      : i.expira_em ? new Date(i.expira_em) : new Date(agora.getTime() + 5 * 864e5);
    dados.expires_at = validade;
    if (i.importacao) {
      const d = normDesc(i.descricao);
      const imp = importacoes.find(x => normDesc(String(x.description || '')) === d && (!i.chegada || (x.chegada_iso || '') === i.chegada))
        ?? importacoes.find(x => normDesc(String(x.description || '')) === d);
      dados.is_import_fae = true;
      dados.stock_imports_fae_id = imp?.id ?? null;
      if (!imp) plano.sem_item.push(i.id);
    } else {
      const cod = i.codigo.trim().toUpperCase();
      const alvo = porChave.get(`${cod}|${i.origem}|${i.filial}`) ?? porCodigoFilial.get(`${cod}|${i.filial}`);
      dados.stock_item_id = alvo ?? null;
      if (!alvo) plano.sem_item.push(i.id);
    }
    plano.gravar.push({ id, dados });
  }
  for (const r of existentes) if (r.status === 'active' && !ids.has(r.id)) plano.substituir.push(r.id);
  return plano;
}
