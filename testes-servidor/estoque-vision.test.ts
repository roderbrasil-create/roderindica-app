import test from 'node:test';
import assert from 'node:assert/strict';
import { planejarEstoque, planejarImportacoes, lerEnvioEstoque, lerEnvioImportacoes, dataParaTela, chavesIguais } from '../src/lib/estoqueVision';
import { processarEnvioEstoque, tratarRequisicaoEstoque } from '../server/estoqueVision';
import { assinarCrm } from '../server/crmAssinatura';

const envio = (itens: any[], origem = 'roder', filial = 'matriz') => {
  const r = lerEnvioEstoque({ tipo: 'estoque', origem, filial, itens });
  if (!r.ok) throw new Error((r as any).erro);
  return r.envio;
};

test('ESTOQUE: cria, altera, ignora igual, remove sumido, zera reservado e não toca outra origem/filial', () => {
  const existentes = [
    { id: 'a', code: 'R800', quantity: 2, source: 'roder', branch: 'matriz' },
    { id: 'b', code: 'R600', quantity: 1, source: 'roder', branch: 'matriz' },
    { id: 'c', code: 'GT800', quantity: 3, source: 'roder', branch: 'matriz' },
    { id: 'd', code: 'R1000', quantity: 1, source: 'roder', branch: 'matriz' },
    { id: 'e', code: 'R800', quantity: 5, source: 'roder', branch: 'sinop' },
    { id: 'f', code: 'UML', quantity: 1, source: 'fae', branch: 'matriz' },
  ];
  const p = planejarEstoque(existentes, new Set(['d']), envio([
    { codigo: 'R800', descricao: 'Garra', quantidade: 2 },
    { codigo: 'R600', descricao: 'Garra 600', quantidade: 4 },
    { codigo: 'R600', descricao: 'Garra 600', quantidade: 3 },
    { codigo: 'NOVO1', descricao: 'Pinça', quantidade: 1 },
    { codigo: 'ZERO', descricao: 'Zerado', quantidade: 0 },
  ]));
  assert.equal(p.ignorados, 1);
  assert.deepEqual(p.atualizar, [{ id: 'b', quantity: 4, description: 'Garra 600' }]);
  assert.deepEqual(p.remover, ['c']);
  assert.deepEqual(p.zerar, ['d']);
  assert.deepEqual(p.criar.map(c => c.code), ['NOVO1']);
});

test('ESTOQUE: quantidade 0 com reserva zera; sem reserva remove', () => {
  const ex = [{ id: 'a', code: 'X', quantity: 2, source: 'fae', branch: 'matriz' }, { id: 'b', code: 'Y', quantity: 2, source: 'fae', branch: 'matriz' }];
  const p = planejarEstoque(ex, new Set(['a']), envio([{ codigo: 'X', descricao: 'x', quantidade: 0 }, { codigo: 'Y', descricao: 'y', quantidade: 0 }], 'fae'));
  assert.deepEqual(p.zerar, ['a']);
  assert.deepEqual(p.remover, ['b']);
});

test('ESTOQUE: valida origem e filial', () => {
  assert.equal(lerEnvioEstoque({ origem: 'xx', filial: 'matriz', itens: [] }).ok, false);
  assert.equal(lerEnvioEstoque({ origem: 'roder', filial: 'rio', itens: [] }).ok, false);
  assert.equal(lerEnvioEstoque({ origem: 'sinop_pdf', filial: 'sinop', itens: [] }).ok, true);
});

test('IMPORTAÇÕES: substitui a lista e preserva item com reserva', () => {
  const ex = [
    { id: 'i1', description: 'FAE UML/S/EX/VT-125', quantity: 2, chegada_iso: '2026-06-20' },
    { id: 'i2', description: 'FAE RCU55', quantity: 1 },
    { id: 'i3', description: 'FAE ANTIGO', quantity: 1 },
  ];
  const r = lerEnvioImportacoes({ itens: [{ descricao: 'FAE UML/S/EX/VT-125', quantidade: 3, embarque: '2026-05-10', chegada: '2026-06-20' }, { descricao: 'FAE NOVO', quantidade: 1, embarque: '', chegada: '2026-12-19' }] });
  assert.ok(r.ok);
  const p = planejarImportacoes(ex, new Set(['i2']), (r as any).itens);
  assert.equal(p.atualizar[0].id, 'i1');
  assert.equal(p.atualizar[0].quantity, 3);
  assert.equal(p.atualizar[0].chegada, '20 jun, 2026');
  assert.deepEqual(p.criar.map(c => c.description), ['FAE NOVO']);
  assert.deepEqual(p.preservados, ['i2']);
  assert.deepEqual(p.remover, ['i3']);
  assert.equal(lerEnvioImportacoes({ itens: [{ descricao: 'X', quantidade: 1, chegada: '20/06/2026' }] }).ok, false);
});

test('datas e chaves', () => {
  assert.equal(dataParaTela('2026-12-05'), '05 dez, 2026');
  assert.ok(chavesIguais('abc', 'abc'));
  assert.ok(!chavesIguais('abc', 'abd'));
  assert.ok(!chavesIguais('', ''));
});

// Firestore de mentira, só com o que o servidor usa.
function dbFalso(colecoes: Record<string, Record<string, any>>) {
  let n = 0;
  const col = (nome: string) => {
    colecoes[nome] ??= {};
    const docs = colecoes[nome];
    const consulta = (filtros: [string, any][]) => ({
      where: (c: string, _op: string, v: any) => consulta([...filtros, [c, v]]),
      limit: () => consulta(filtros),
      get: async () => {
        const lista = Object.entries(docs).filter(([, d]) => filtros.every(([c, v]) => d[c] === v)).map(([id, d]) => ({ id, data: () => d }));
        return { empty: !lista.length, docs: lista };
      },
    });
    return { ...consulta([]), doc: (id?: string) => ({ id: id ?? `novo${++n}`, nome, docs, set: async (d: any) => { docs[id ?? 'x'] = { ...(docs[id ?? 'x'] || {}), ...d }; } }) };
  };
  return {
    colecoes,
    collection: col,
    batch: () => {
      const ops: (() => void)[] = [];
      return {
        update: (r: any, d: any) => ops.push(() => { r.docs[r.id] = { ...r.docs[r.id], ...d }; }),
        set: (r: any, d: any) => ops.push(() => { r.docs[r.id] = d; }),
        delete: (r: any) => ops.push(() => { delete r.docs[r.id]; }),
        commit: async () => ops.forEach(o => o()),
      };
    },
  } as any;
}

test('SERVIDOR: envio de estoque grava e responde as contagens', async () => {
  const db = dbFalso({
    stock_items: { a: { code: 'R800', quantity: 1, source: 'roder', branch: 'matriz' }, b: { code: 'R600', quantity: 1, source: 'roder', branch: 'matriz' } },
    stock_reservations: { r1: { status: 'active', stock_item_id: 'b' } },
    settings: {},
  });
  const r = await processarEnvioEstoque({ db, segredo: () => 'x' }, { tipo: 'estoque', origem: 'roder', filial: 'matriz', itens: [{ codigo: 'R800', descricao: 'Garra', quantidade: 3 }] });
  assert.equal(r.status, 200);
  assert.deepEqual({ ...r.body, ignorados: undefined }, { ok: true, origem: 'roder', filial: 'matriz', criados: 0, atualizados: 1, alterados: 1, removidos: 0, mantidos_por_reserva: 1, ignorados: undefined });
  assert.equal(db.colecoes.stock_items.a.quantity, 3);
  assert.equal(db.colecoes.stock_items.b.quantity, 0);
  const ruim = await processarEnvioEstoque({ db, segredo: () => 'x' }, { tipo: 'outro' });
  assert.equal(ruim.status, 400);
});

test('SERVIDOR: exige a assinatura do CRM (CRM_SEGREDO, janela de 5 min)', async () => {
  const db = dbFalso({ stock_items: {}, stock_reservations: {}, settings: {} });
  const agora = new Date('2026-10-26T12:00:00Z');
  const deps = { db, segredo: () => 'segredo-crm', agora: () => agora };
  const corpo = Buffer.from(JSON.stringify({ tipo: 'estoque', origem: 'fae', filial: 'matriz', itens: [{ codigo: 'UML', descricao: 'FAE UML', quantidade: 1 }] }));
  const ts = String(Math.floor(agora.getTime() / 1000));
  const ok = await tratarRequisicaoEstoque(deps, { headers: { 'x-roder-timestamp': ts, 'x-roder-assinatura': assinarCrm('segredo-crm', ts, corpo) }, corpo });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.criados, 1);
  const errada = await tratarRequisicaoEstoque(deps, { headers: { 'x-roder-timestamp': ts, 'x-roder-assinatura': assinarCrm('outro', ts, corpo) }, corpo });
  assert.equal(errada.status, 401);
  const velho = String(Math.floor(agora.getTime() / 1000) - 600);
  const atrasada = await tratarRequisicaoEstoque(deps, { headers: { 'x-roder-timestamp': velho, 'x-roder-assinatura': assinarCrm('segredo-crm', velho, corpo) }, corpo });
  assert.equal(atrasada.status, 401);
  const semSegredo = await tratarRequisicaoEstoque({ ...deps, segredo: () => '' }, { headers: {}, corpo });
  assert.equal(semSegredo.status, 503);
});

test('RESERVAS: lista do Vision substitui as ativas, liga ao item e preserva histórico', async () => {
  const { planejarReservas, lerEnvioReservas, idReservaVision } = await import('../src/lib/estoqueVision');
  const lido = lerEnvioReservas({ itens: [
    { id: 'r1', tipo: 'reserva', codigo: 'r800', origem: 'roder', filial: 'matriz', descricao: 'Garra', quantidade: 1, cliente: 'Cliente A', vendedor: 'Yury' },
    { id: 'v1', tipo: 'vendido', codigo: 'X9', origem: 'fae', filial: 'matriz', descricao: 'Sem item', quantidade: 2 },
    { id: 'i1', tipo: 'reserva', importacao: true, descricao: 'FAE UML/S/EX/VT-125', chegada: '2026-06-20', quantidade: 1 },
  ] });
  assert.ok(lido.ok);
  const agora = new Date('2026-10-26T12:00:00Z');
  const p = planejarReservas(
    [{ id: 'antiga', status: 'active' }, { id: 'vision_r1', status: 'active' }, { id: 'cancelada', status: 'cancelled' }],
    [{ id: 'it1', code: 'R800', source: 'roder', branch: 'matriz' }],
    [{ id: 'imp1', description: 'FAE UML/S/EX/VT-125', chegada_iso: '2026-06-20' }],
    (lido as any).itens, agora,
  );
  assert.deepEqual(p.substituir, ['antiga']);
  assert.equal(p.gravar.find(g => g.id === idReservaVision('r1'))!.dados.stock_item_id, 'it1');
  assert.equal(p.gravar.find(g => g.id === 'vision_i1')!.dados.stock_imports_fae_id, 'imp1');
  assert.deepEqual(p.sem_item, ['v1']);
  assert.ok(p.gravar.find(g => g.id === 'vision_v1')!.dados.expires_at.getTime() > agora.getTime() + 365 * 864e5);
  assert.equal(lerEnvioReservas({ itens: [{ id: 'a b', quantidade: 1 }] }).ok, false);
});

test('SERVIDOR: reservas exigem a mesma assinatura do CRM', async () => {
  const { tratarRequisicaoReservas } = await import('../server/estoqueVision');
  const db = dbFalso({ stock_items: { it1: { code: 'R800', source: 'roder', branch: 'matriz' } }, stock_reservations: { old: { status: 'active', stock_item_id: 'it1' } }, stock_imports_fae: {}, settings: {} });
  const agora = new Date('2026-10-26T12:00:00Z');
  const deps = { db, segredo: () => 's', agora: () => agora };
  const corpo = Buffer.from(JSON.stringify({ tipo: 'reservas', itens: [{ id: 'r1', codigo: 'R800', origem: 'roder', filial: 'matriz', descricao: 'Garra', quantidade: 1 }] }));
  const ts = String(Math.floor(agora.getTime() / 1000));
  const r = await tratarRequisicaoReservas(deps, { headers: { 'x-roder-timestamp': ts, 'x-roder-assinatura': assinarCrm('s', ts, corpo) }, corpo });
  assert.equal(r.status, 200);
  assert.equal(db.colecoes.stock_reservations.old.status, 'substituida_vision');
  assert.equal(db.colecoes.stock_reservations.vision_r1.stock_item_id, 'it1');
  const ruim = await tratarRequisicaoReservas(deps, { headers: { 'x-roder-timestamp': ts, 'x-roder-assinatura': 'sha256=00' }, corpo });
  assert.equal(ruim.status, 401);
});

test('RESERVAS: formato da Disponibilidade (reservas, codigo_item, empresa, id_origem) e lista vazia', async () => {
  const { lerEnvioReservas, planejarReservas } = await import('../src/lib/estoqueVision');
  const l = lerEnvioReservas({ tipo: 'reservas', reservas: [
    { codigo_item: '1000.0812', empresa: 'sinop', tipo: 'vendido', quantidade: 2, cliente: 'C', vendedora: 'Heloísa', pedido_venda: '9100', expira_em: null, id_origem: 'abc-1' },
  ] });
  assert.ok(l.ok);
  const it = (l as any).itens[0];
  assert.deepEqual([it.id, it.codigo, it.filial, it.origem, it.tipo, it.vendedor, it.pedido_venda], ['abc-1', '1000.0812', 'sinop', 'sinop_pdf', 'vendido', 'Heloísa', '9100']);
  const p = planejarReservas([], [{ id: 's9', code: '1000.0812', source: 'sinop_pdf', branch: 'sinop' }], [], (l as any).itens, new Date());
  assert.equal(p.gravar[0].dados.stock_item_id, 's9');
  const vazia = lerEnvioReservas({ tipo: 'reservas', reservas: [] });
  assert.ok(vazia.ok);
  assert.deepEqual(planejarReservas([{ id: 'x', status: 'active' }], [], [], (vazia as any).itens, new Date()).substituir, ['x']);
});

test('RESERVAS: importação com código vazio liga pela descrição (chegada vazia também)', async () => {
  const { lerEnvioReservas, planejarReservas } = await import('../src/lib/estoqueVision');
  const l = lerEnvioReservas({ tipo: 'reservas', reservas: [
    { codigo_item: '', empresa: 'fae', tipo: 'reserva', quantidade: 1, id_origem: 'imp-123e4567-e89b-12d3-a456-426614174000', importacao: true, descricao: 'FAE  UML/S/EX/VT-125', chegada: '' },
  ] });
  assert.ok(l.ok);
  const p = planejarReservas([], [], [{ id: 'imp1', description: 'FAE UML/S/EX/VT-125', chegada_iso: '2026-12-01' }], (l as any).itens, new Date());
  assert.equal(p.gravar[0].dados.stock_imports_fae_id, 'imp1');
  assert.deepEqual(p.sem_item, []);
});
