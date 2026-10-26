// Roder Vision -> Indica: POST /api/public/hooks/estoque
// Corpo { tipo:"estoque", origem, filial, enviado_em, itens:[{codigo, descricao, quantidade}] }
//    ou { tipo:"importacoes", enviado_em, itens:[{descricao, quantidade, embarque, chegada}] } (datas AAAA-MM-DD).
// Resposta do estoque: { ok, origem, filial, criados, atualizados, removidos, mantidos_por_reserva } (alterados = atualizados, por compatibilidade).
// Reservas em importação: stock_reservations com stock_imports_fae_id (is_import_fae) ativas nunca perdem o item.
// Autenticação: a MESMA assinatura do CRM em /api/crm/eventos: X-Roder-Timestamp e
// X-Roder-Assinatura = "sha256=" + HMAC-SHA256(CRM_SEGREDO, timestamp + "." + corpoCru), janela de 5 min.
// Sem CRM_SEGREDO: 503. Não usa chave nova. A tela antiga (Estoque > Atualizar) continua funcionando.
// Regras em src/lib/estoqueVision.ts. Reservas ativas (stock_reservations) nunca são apagadas nem perdem o item.
import { lerEnvioAba, lerEnvioEstoque, lerEnvioImportacoes, lerEnvioReservas, planejarEstoque, planejarEstoqueAba, planejarImportacoes, planejarReservas } from '../src/lib/estoqueVision';
import { verificarAssinaturaCrm } from './crmAssinatura';

export type DepsEstoqueVision = { db: any; segredo: () => string; soLeitura?: () => boolean; agora?: () => Date; log?: (...a: any[]) => void };

async function idsReservados(db: any, campo: 'stock_item_id' | 'stock_imports_fae_id'): Promise<Set<string>> {
  const s = await db.collection('stock_reservations').where('status', '==', 'active').get();
  const out = new Set<string>();
  for (const d of s.docs) { const v = d.data()?.[campo]; if (v) out.add(String(v)); }
  return out;
}

async function gravarEmLotes(db: any, ops: ((b: any) => void)[]) {
  for (let i = 0; i < ops.length; i += 400) {
    const b = db.batch();
    ops.slice(i, i + 400).forEach(op => op(b));
    await b.commit();
  }
}

export async function processarEnvioEstoque(deps: DepsEstoqueVision, corpo: any): Promise<{ status: number; body: any }> {
  const agora = (deps.agora ? deps.agora() : new Date()).toISOString();
  const tipo = String(corpo?.tipo || '');
  const db = deps.db;
  if (tipo === 'estoque' && corpo?.aba !== undefined) {
    // Envio por aba (Vision): substitui todas as origens da aba, inclusive as antigas.
    const lido = lerEnvioAba(corpo);
    if (!lido.ok) return { status: 400, body: { ok: false, error: (lido as any).erro } };
    const { envio } = lido;
    const s = await db.collection('stock_items').get();
    const existentes = s.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const plano = planejarEstoqueAba(existentes, await idsReservados(db, 'stock_item_id'), envio);
    const col = db.collection('stock_items');
    const ops: ((b: any) => void)[] = [];
    // source/branch mudam no mesmo documento (a reserva continua presa a ele).
    plano.atualizar.forEach(u => ops.push(b => b.update(col.doc(u.id), { quantity: u.quantity, description: u.description, ...(u.source ? { source: u.source } : {}), ...(u.branch ? { branch: u.branch } : {}), last_list_match: true, updated_at: agora, origem_envio: 'roder_vision' })));
    plano.zerar.forEach(id => ops.push(b => b.update(col.doc(id), { quantity: 0, updated_at: agora, origem_envio: 'roder_vision' })));
    plano.remover.forEach(id => ops.push(b => b.delete(col.doc(id))));
    plano.criar.forEach(c => ops.push(b => b.set(col.doc(), { ...c, last_list_match: true, created_at: agora, updated_at: agora, origem_envio: 'roder_vision' })));
    await gravarEmLotes(db, ops);
    await db.collection('settings').doc('estoque_vision').set({ [`ultimo_aba_${envio.aba}`]: { em: agora, enviado_em: envio.enviado_em || null, itens: envio.itens.length } }, { merge: true });
    return { status: 200, body: { ok: true, aba: envio.aba, criados: plano.criar.length, atualizados: plano.atualizar.length, alterados: plano.atualizar.length, removidos: plano.remover.length, mantidos_por_reserva: plano.zerar.length, ignorados: plano.ignorados } };
  }
  if (tipo === 'estoque') {
    const lido = lerEnvioEstoque(corpo);
    if (!lido.ok) return { status: 400, body: { ok: false, error: (lido as any).erro } };
    const { envio } = lido;
    const s = await db.collection('stock_items').where('source', '==', envio.origem).get();
    const existentes = s.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const plano = planejarEstoque(existentes, await idsReservados(db, 'stock_item_id'), envio);
    const col = db.collection('stock_items');
    const ops: ((b: any) => void)[] = [];
    plano.atualizar.forEach(u => ops.push(b => b.update(col.doc(u.id), { quantity: u.quantity, description: u.description, last_list_match: true, updated_at: agora, origem_envio: 'roder_vision' })));
    plano.zerar.forEach(id => ops.push(b => b.update(col.doc(id), { quantity: 0, updated_at: agora, origem_envio: 'roder_vision' })));
    plano.remover.forEach(id => ops.push(b => b.delete(col.doc(id))));
    plano.criar.forEach(c => ops.push(b => b.set(col.doc(), { ...c, last_list_match: true, created_at: agora, updated_at: agora, origem_envio: 'roder_vision' })));
    await gravarEmLotes(db, ops);
    await db.collection('settings').doc('estoque_vision').set({ [`ultimo_${envio.origem}_${envio.filial}`]: { em: agora, enviado_em: envio.enviado_em || null, itens: envio.itens.length } }, { merge: true });
    return { status: 200, body: { ok: true, origem: envio.origem, filial: envio.filial, criados: plano.criar.length, atualizados: plano.atualizar.length, alterados: plano.atualizar.length, removidos: plano.remover.length, mantidos_por_reserva: plano.zerar.length, ignorados: plano.ignorados } };
  }
  if (tipo === 'importacoes') {
    const lido = lerEnvioImportacoes(corpo);
    if (!lido.ok) return { status: 400, body: { ok: false, error: (lido as any).erro } };
    const s = await db.collection('stock_imports_fae').get();
    const existentes = s.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const plano = planejarImportacoes(existentes, await idsReservados(db, 'stock_imports_fae_id'), lido.itens);
    const col = db.collection('stock_imports_fae');
    const ops: ((b: any) => void)[] = [];
    plano.atualizar.forEach(u => { const { id, ...c } = u; ops.push(b => b.update(col.doc(id), { ...c, updated_at: agora, origem_envio: 'roder_vision' })); });
    plano.criar.forEach(c => ops.push(b => b.set(col.doc(), { ...c, created_at: agora, updated_at: agora, origem_envio: 'roder_vision' })));
    plano.remover.forEach(id => ops.push(b => b.delete(col.doc(id))));
    await gravarEmLotes(db, ops);
    await db.collection('settings').doc('estoque_vision').set({ ultimo_importacoes: { em: agora, itens: lido.itens.length } }, { merge: true });
    return { status: 200, body: { ok: true, itens: lido.itens.length, criados: plano.criar.length, atualizados: plano.atualizar.length, alterados: plano.atualizar.length, removidos: plano.remover.length, reservas_preservadas: plano.preservados.length } };
  }
  return { status: 400, body: { ok: false, error: 'tipo deve ser "estoque" ou "importacoes"' } };
}

/** Lista completa de reservas/vendidos do Vision: substitui as reservas ativas (as antigas ficam "substituida_vision"). */
export async function processarEnvioReservas(deps: DepsEstoqueVision, corpo: any): Promise<{ status: number; body: any }> {
  if (String(corpo?.tipo || '') !== 'reservas') return { status: 400, body: { ok: false, error: 'tipo deve ser "reservas"' } };
  const lido = lerEnvioReservas(corpo);
  if (!lido.ok) return { status: 400, body: { ok: false, error: (lido as any).erro } };
  const db = deps.db;
  const agoraD = deps.agora ? deps.agora() : new Date();
  const agora = agoraD.toISOString();
  const [rs, its, ims] = await Promise.all([
    db.collection('stock_reservations').where('status', '==', 'active').get(),
    db.collection('stock_items').get(),
    db.collection('stock_imports_fae').get(),
  ]);
  const existentes = rs.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  const plano = planejarReservas(existentes, its.docs.map((d: any) => ({ id: d.id, ...d.data() })), ims.docs.map((d: any) => ({ id: d.id, ...d.data() })), lido.itens, agoraD);
  const existe = new Set(existentes.map((e: any) => e.id));
  const col = db.collection('stock_reservations');
  const ops: ((b: any) => void)[] = [];
  plano.gravar.forEach(g => ops.push(b => b.set(col.doc(g.id), { ...g.dados, updated_at: agora, ...(existe.has(g.id) ? {} : { created_at: agora }) }, { merge: true })));
  plano.substituir.forEach(id => ops.push(b => b.update(col.doc(id), { status: 'substituida_vision', updated_at: agora })));
  await gravarEmLotes(db, ops);
  await db.collection('settings').doc('estoque_vision').set({ ultimo_reservas: { em: agora, itens: lido.itens.length } }, { merge: true });
  return { status: 200, body: { ok: true, itens: lido.itens.length, gravadas: plano.gravar.length, substituidas: plano.substituir.length, sem_item: plano.sem_item } };
}

/** Confere a assinatura (corpo CRU) e processa. Mesma assinatura do CRM em /api/crm/eventos. */
async function tratarAssinado(deps: DepsEstoqueVision, req: { headers: Record<string, any>; corpo: Buffer }, processar: (deps: DepsEstoqueVision, corpo: any) => Promise<{ status: number; body: any }>) {
  const h = (n: string) => { const v = req.headers[n]; return Array.isArray(v) ? v[0] : v; };
  const ver = verificarAssinaturaCrm({ segredo: String(deps.segredo() || ''), timestamp: h('x-roder-timestamp'), assinatura: h('x-roder-assinatura'), corpo: req.corpo, agora: deps.agora ? deps.agora() : undefined });
  if (!ver.ok) return { status: (ver as any).status, body: { ok: false, error: (ver as any).status === 503 ? 'CRM_SEGREDO não configurado' : 'Assinatura inválida' } };
  let json: any;
  try { json = JSON.parse(req.corpo.toString('utf8')); } catch { return { status: 400, body: { ok: false, error: 'Corpo não é JSON.' } }; }
  return processar(deps, json);
}
export const tratarRequisicaoEstoque = (deps: DepsEstoqueVision, req: { headers: Record<string, any>; corpo: Buffer }) => tratarAssinado(deps, req, processarEnvioEstoque);
export const tratarRequisicaoReservas = (deps: DepsEstoqueVision, req: { headers: Record<string, any>; corpo: Buffer }) => tratarAssinado(deps, req, processarEnvioReservas);

export function registrarRotaEstoqueVision(app: any, express: any, deps: DepsEstoqueVision) {
  const log = deps.log || console.log;
  const soLeitura = () => (deps.soLeitura ? deps.soLeitura() : false);
  // As regras do Firestore leem settings/estoque_config.so_leitura (ESTOQUE_SO_LEITURA).
  Promise.resolve()
    .then(() => deps.db.collection('settings').doc('estoque_config').set({ so_leitura: soLeitura(), atualizado_em: new Date().toISOString() }, { merge: true }))
    .catch((e: any) => log('[ESTOQUE-VISION] settings/estoque_config:', e?.message || e));
  app.get('/api/public/estoque-config', (_req: any, res: any) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ so_leitura: soLeitura(), mensagem: soLeitura() ? 'Estoque e reservas são feitos no Roder Vision' : null });
  });
  const rota = (caminho: string, tratar: typeof tratarRequisicaoEstoque, rotulo: string) =>
    // Corpo CRU (antes do express.json global), igual a /api/crm/eventos.
    app.post(caminho, express.raw({ type: () => true, limit: '2mb' }), async (req: any, res: any) => {
      res.setHeader('Cache-Control', 'no-store');
      try {
        const r = await tratar(deps, { headers: req.headers, corpo: Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0) });
        if (r.status === 200) log(`[${rotulo}]`, JSON.stringify(r.body));
        return res.status(r.status).json(r.body);
      } catch (e: any) {
        log(`[${rotulo}] falhou:`, e?.message || e);
        return res.status(500).json({ ok: false, error: 'Falha ao gravar' });
      }
    });
  rota('/api/public/hooks/estoque', tratarRequisicaoEstoque, 'ESTOQUE-VISION');
  rota('/api/public/hooks/reservas', tratarRequisicaoReservas, 'RESERVAS-VISION');
}
