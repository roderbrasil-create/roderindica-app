import test from 'node:test';
import assert from 'node:assert/strict';
import { processarEnvioEstoque } from '../server/estoqueVision';
import { enviarConfirmacoesPendentes, lerLote } from '../server/confirmacaoEstoque';

// Firestore de mentira com where de igualdade, set (merge raso) e batch.
function dbFalso() {
  const colecoes: Record<string, Record<string, any>> = {};
  let n = 0;
  const col = (nome: string) => {
    colecoes[nome] ??= {};
    const docs = colecoes[nome];
    const consulta = (filtros: [string, any][]): any => ({
      where: (c: string, _o: string, v: any) => consulta([...filtros, [c, v]]),
      limit: () => consulta(filtros),
      get: async () => ({ empty: false, docs: Object.entries(docs).filter(([, d]) => filtros.every(([c, v]) => d[c] === v)).map(([id, d]) => ({ id, data: () => d })) }),
    });
    return { ...consulta([]), doc: (id?: string) => ({ id: id ?? `novo${++n}`, nome, docs, set: async (d: any) => { docs[id ?? 'x'] = { ...(docs[id ?? 'x'] || {}), ...d }; } }) };
  };
  return {
    colecoes, collection: col,
    batch: () => { const ops: (() => void)[] = []; return {
      update: (r: any, d: any) => ops.push(() => { r.docs[r.id] = { ...r.docs[r.id], ...d }; }),
      set: (r: any, d: any) => ops.push(() => { r.docs[r.id] = d; }),
      delete: (r: any) => ops.push(() => { delete r.docs[r.id]; }),
      commit: async () => ops.forEach(o => o()),
    }; },
  } as any;
}
const lote = (parte: number, extra: any = {}) => ({ tipo: 'estoque', origem: ['roder', 'fae', 'accessories', 'sinop'][parte - 1], filial: parte === 4 ? 'sinop' : 'matriz', lote: 'L1', lote_parte: parte, lote_total: 4, arquivo: 'estoque.xlsx', enviado_por: { nome: 'Rogério', email: 'Rogerio@roderbrasil.com.br' }, itens: [{ codigo: `C${parte}`, descricao: 'Item', quantidade: 2 }], ...extra });

test('CONFIRMAÇÃO: lote completo manda UM e-mail só, com uma linha por origem', async () => {
  const db = dbFalso();
  const t0 = new Date('2026-11-09T14:00:00Z');
  const enviados: { to: string; assunto: string; html: string }[] = [];
  const enviar = async (to: string, assunto: string, html: string) => { enviados.push({ to, assunto, html }); };
  for (let p = 1; p <= 4; p++) {
    const r = await processarEnvioEstoque({ db, segredo: () => 'x', agora: () => new Date(t0.getTime() + p * 1000) }, lote(p));
    assert.equal(r.status, 200);
    assert.ok('reservas_preservadas' in r.body && 'criados' in r.body); // resposta do endpoint intacta
  }
  assert.equal(await enviarConfirmacoesPendentes({ db, enviar, agora: () => new Date(t0.getTime() + 10_000), log: () => {} }), 2);
  assert.deepEqual(enviados.map(e => e.to).sort(), ['roderbrasil@gmail.com', 'rogerio@roderbrasil.com.br']);
  assert.match(enviados[0].assunto, /^Estoque atualizado no Roder Indica · \d\d\/\d\d \d\d:\d\d$/);
  for (const o of ['roder', 'fae', 'accessories', 'sinop']) assert.ok(enviados[0].html.includes(`>${o} (`));
  assert.ok(enviados[0].html.includes('estoque.xlsx') && enviados[0].html.includes('Rogério'));
  assert.ok(enviados[0].html.includes('depois da atualização'));
  assert.equal(await enviarConfirmacoesPendentes({ db, enviar, agora: () => new Date(t0.getTime() + 20_000), log: () => {} }), 0); // não repete
});

test('CONFIRMAÇÃO: parte que não chega em 3 minutos vira aviso de NÃO atualizado por completo', async () => {
  const db = dbFalso();
  const t0 = new Date('2026-11-09T14:00:00Z');
  const enviados: { to: string; assunto: string; html: string }[] = [];
  const enviar = async (to: string, assunto: string, html: string) => { enviados.push({ to, assunto, html }); };
  for (const p of [1, 2, 4]) await processarEnvioEstoque({ db, segredo: () => 'x', agora: () => t0 }, lote(p));
  assert.equal(await enviarConfirmacoesPendentes({ db, enviar, agora: () => new Date(t0.getTime() + 2 * 60_000), log: () => {} }), 0); // ainda esperando
  await enviarConfirmacoesPendentes({ db, enviar, agora: () => new Date(t0.getTime() + 3 * 60_000 + 1000), log: () => {} });
  assert.equal(enviados[0].assunto, '⚠ Estoque NÃO foi atualizado por completo');
  assert.match(enviados[0].html, /parte 3 de 4 não chegou/);
});

test('CONFIRMAÇÃO: parte com erro diz qual falhou e por quê', async () => {
  const db = dbFalso();
  const t0 = new Date('2026-11-09T14:00:00Z');
  const enviados: { assunto: string; html: string }[] = [];
  const enviar = async (_to: string, assunto: string, html: string) => { enviados.push({ assunto, html }); };
  for (const p of [1, 2, 3]) await processarEnvioEstoque({ db, segredo: () => 'x', agora: () => t0 }, lote(p));
  const ruim = await processarEnvioEstoque({ db, segredo: () => 'x', agora: () => t0 }, lote(4, { origem: 'xyz' }));
  assert.equal(ruim.status, 400);
  await enviarConfirmacoesPendentes({ db, enviar, agora: () => new Date(t0.getTime() + 5000), log: () => {} });
  assert.equal(enviados[0].assunto, '⚠ Estoque NÃO foi atualizado por completo');
  assert.match(enviados[0].html, /parte 4/);
  assert.match(enviados[0].html, /origem inválida/);
});

test('CONFIRMAÇÃO: envio sem lote não manda e-mail, e e-mail de fora da Roder não recebe', async () => {
  const db = dbFalso();
  const enviados: string[] = [];
  const enviar = async (to: string) => { enviados.push(to); };
  await processarEnvioEstoque({ db, segredo: () => 'x' }, { ...lote(1), lote: undefined, lote_parte: undefined, lote_total: undefined });
  assert.equal(await enviarConfirmacoesPendentes({ db, enviar, log: () => {} }), 0);
  assert.equal(lerLote({ tipo: 'estoque' }), null);
  const t0 = new Date('2026-11-09T14:00:00Z');
  for (let p = 1; p <= 4; p++) await processarEnvioEstoque({ db, segredo: () => 'x', agora: () => t0 }, lote(p, { lote: 'L2', enviado_por: { nome: 'Fulano', email: 'fulano@gmail.com' } }));
  await enviarConfirmacoesPendentes({ db, enviar, agora: () => new Date(t0.getTime() + 5000), log: () => {} });
  assert.deepEqual(enviados, ['roderbrasil@gmail.com']);
});
