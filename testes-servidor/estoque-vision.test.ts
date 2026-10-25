import test from 'node:test';
import assert from 'node:assert/strict';
import { planejarEstoque, planejarImportacoes, lerEnvioEstoque, lerEnvioImportacoes, dataParaTela, chavesIguais } from '../src/lib/estoqueVision';
import { processarEnvioEstoque } from '../server/estoqueVision';

const envio = (itens: any[], origem = 'roder', filial = 'matriz') => {
  const r = lerEnvioEstoque({ tipo: 'estoque', origem, filial, itens });
  if (!r.ok) throw new Error(r.erro);
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
  const r = await processarEnvioEstoque({ db, chaveEnv: () => 'x' }, { tipo: 'estoque', origem: 'roder', filial: 'matriz', itens: [{ codigo: 'R800', descricao: 'Garra', quantidade: 3 }] });
  assert.equal(r.status, 200);
  assert.deepEqual({ ...r.body, ignorados: undefined }, { ok: true, origem: 'roder', filial: 'matriz', criados: 0, alterados: 1, removidos: 0, mantidos_por_reserva: 1, ignorados: undefined });
  assert.equal(db.colecoes.stock_items.a.quantity, 3);
  assert.equal(db.colecoes.stock_items.b.quantity, 0);
  const ruim = await processarEnvioEstoque({ db, chaveEnv: () => 'x' }, { tipo: 'outro' });
  assert.equal(ruim.status, 400);
});
