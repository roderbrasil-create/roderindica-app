// Assinatura dos eventos do CRM e rota /api/crm/eventos (cabeçalhos, 401, 503, corpo cru).
// Rodar: node --import tsx --test testes-servidor/crm-assinatura.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assinarCrm, verificarAssinaturaCrm, timestampEmMs } from '../server/crmAssinatura.ts';
import { tratarRequisicaoCrm } from '../server/crmEventos.ts';
import { lerConfigCrm } from '../src/lib/crmIntegracao.ts';
import { bancoFalsoCrm, arrayUnionFalso } from './fixtures/bancoFalsoCrm.ts';

const SEGREDO = 'segredo-de-teste';
const AGORA = new Date('2026-10-26T12:00:00Z');
const ts = String(Math.floor(AGORA.getTime() / 1000));
const corpo = Buffer.from(JSON.stringify({ id: 'e1', evento: 'indicacao.recebida', id_externo: 'ind1', parceiro_id: 'p1', dados: {} }));

test('assinatura válida passa, com timestamp em segundos, milissegundos ou ISO', () => {
  for (const t of [ts, String(AGORA.getTime()), AGORA.toISOString()]) {
    const r = verificarAssinaturaCrm({ segredo: SEGREDO, timestamp: t, assinatura: assinarCrm(SEGREDO, t, corpo), corpo, agora: AGORA });
    assert.equal(r.ok, true, t);
  }
});

test('assinatura inválida, segredo errado e corpo adulterado dão 401', () => {
  const boa = assinarCrm(SEGREDO, ts, corpo);
  assert.deepEqual(verificarAssinaturaCrm({ segredo: SEGREDO, timestamp: ts, assinatura: 'sha256=' + '0'.repeat(64), corpo, agora: AGORA }), { ok: false, status: 401, motivo: 'assinatura_invalida' });
  assert.equal((verificarAssinaturaCrm({ segredo: 'outro', timestamp: ts, assinatura: boa, corpo, agora: AGORA }) as any).status, 401);
  const adulterado = Buffer.from(corpo.toString().replace('ind1', 'ind2'));
  assert.equal((verificarAssinaturaCrm({ segredo: SEGREDO, timestamp: ts, assinatura: boa, corpo: adulterado, agora: AGORA }) as any).motivo, 'assinatura_invalida');
  // um espaço a mais no corpo já invalida: vale o corpo CRU
  assert.equal(verificarAssinaturaCrm({ segredo: SEGREDO, timestamp: ts, assinatura: boa, corpo: Buffer.from(corpo.toString() + ' '), agora: AGORA }).ok, false);
  // tamanho diferente não lança
  assert.equal(verificarAssinaturaCrm({ segredo: SEGREDO, timestamp: ts, assinatura: 'sha256=abc', corpo, agora: AGORA }).ok, false);
  assert.equal(verificarAssinaturaCrm({ segredo: SEGREDO, timestamp: ts, assinatura: undefined, corpo, agora: AGORA }).ok, false);
});

test('timestamp com mais de 5 minutos de diferença é recusado, para os dois lados', () => {
  const antigo = String(Math.floor(AGORA.getTime() / 1000) - 301);
  const futuro = String(Math.floor(AGORA.getTime() / 1000) + 301);
  for (const t of [antigo, futuro]) {
    const r: any = verificarAssinaturaCrm({ segredo: SEGREDO, timestamp: t, assinatura: assinarCrm(SEGREDO, t, corpo), corpo, agora: AGORA });
    assert.equal(r.ok, false); assert.equal(r.motivo, 'timestamp_fora_da_janela');
  }
  const limite = String(Math.floor(AGORA.getTime() / 1000) - 299);
  assert.equal(verificarAssinaturaCrm({ segredo: SEGREDO, timestamp: limite, assinatura: assinarCrm(SEGREDO, limite, corpo), corpo, agora: AGORA }).ok, true);
  assert.equal(timestampEmMs('lixo'), null);
});

test('segredo ausente: 503', () => {
  const r: any = verificarAssinaturaCrm({ segredo: '', timestamp: ts, assinatura: 'x', corpo, agora: AGORA });
  assert.equal(r.status, 503);
});

function depsCom(env: Record<string, string>, db = bancoFalsoCrm()) {
  return { db, arrayUnion: arrayUnionFalso, config: () => lerConfigCrm(env), agora: () => AGORA, log: () => {} };
}
const cab = (t = ts, c = corpo) => ({ 'x-roder-timestamp': t, 'x-roder-assinatura': assinarCrm(SEGREDO, t, c) });

test('rota: sem CRM_SEGREDO ou com a integração desligada responde 503, sem tocar no banco', async () => {
  const db = bancoFalsoCrm({ indications: { ind1: { status: 'pending', client_name: 'X', external_seller_uid: 'p1' } } });
  assert.equal((await tratarRequisicaoCrm(depsCom({ CRM_ATIVO: '1' }, db), { headers: cab(), corpo })).status, 503);
  assert.equal((await tratarRequisicaoCrm(depsCom({ CRM_SEGREDO: SEGREDO }, db), { headers: cab(), corpo })).status, 503);
  assert.equal((await tratarRequisicaoCrm(depsCom({ CRM_ATIVO: '0', CRM_SEGREDO: SEGREDO }, db), { headers: cab(), corpo })).status, 503);
  assert.deepEqual(db.dados.crm_eventos || {}, {});
  assert.equal(db.dados.indications.ind1.negotiation_history, undefined);
});

test('rota: assinatura inválida 401, JSON quebrado 400, válida 200 e grava o histórico', async () => {
  const env = { CRM_ATIVO: '1', CRM_SEGREDO: SEGREDO };
  const db = bancoFalsoCrm({ indications: { ind1: { status: 'pending', client_name: 'Fazenda X', external_seller_uid: 'p1' } } });
  assert.equal((await tratarRequisicaoCrm(depsCom(env, db), { headers: { ...cab(), 'x-roder-assinatura': 'sha256=00' }, corpo })).status, 401);
  assert.equal((await tratarRequisicaoCrm(depsCom(env, db), { headers: {}, corpo })).status, 401);
  const ruim = Buffer.from('{nao e json');
  assert.equal((await tratarRequisicaoCrm(depsCom(env, db), { headers: cab(ts, ruim), corpo: ruim })).status, 400);
  const semId = Buffer.from(JSON.stringify({ evento: 'indicacao.recebida', id_externo: 'ind1' }));
  assert.equal((await tratarRequisicaoCrm(depsCom(env, db), { headers: cab(ts, semId), corpo: semId })).status, 400);
  const r = await tratarRequisicaoCrm(depsCom(env, db), { headers: cab(), corpo });
  assert.equal(r.status, 200);
  const h = db.dados.indications.ind1.negotiation_history;
  assert.equal(h.length, 1);
  assert.equal(h[0].author_name, 'CRM Roder');
  assert.equal(h[0].content, 'Indicação recebida');
  assert.equal(db.dados.indications.ind1.status, 'pending', 'recebida não muda o status');
});

test('rota: erro do banco no meio devolve 5xx e NÃO marca o evento como processado', async () => {
  const env = { CRM_ATIVO: '1', CRM_SEGREDO: SEGREDO };
  const db = bancoFalsoCrm({ indications: { ind1: { status: 'pending', client_name: 'X', external_seller_uid: 'p1' } } });
  db.falhas.colecao = 'crm_eventos'; db.falhas.vezes = 1;
  const r = await tratarRequisicaoCrm(depsCom(env, db), { headers: cab(), corpo });
  assert.equal(r.status, 500);
  assert.equal(db.dados.crm_eventos?.e1, undefined);
  // o reenvio funciona e não duplica a linha do tempo
  const r2 = await tratarRequisicaoCrm(depsCom(env, db), { headers: cab(), corpo });
  assert.equal(r2.status, 200);
  assert.equal(db.dados.indications.ind1.negotiation_history.length, 1);
});
