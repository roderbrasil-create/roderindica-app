// Contrato final do CRM (campos no topo e em dados, mensagem, datas em São Paulo) e fase 2 (atualização, comissão, comissão paga).
// Rodar: node --import tsx --test testes-servidor/crm-fase2.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { processarEventoCrm, tratarRequisicaoCrm } from '../server/crmEventos.ts';
import { assinarCrm } from '../server/crmAssinatura.ts';
import { rodarAtualizacoesCrm, rodarComissoesCrm, rodarFilaCrm, cargaInicialCrm, garantirDataDaVirada } from '../server/crmEntrada.ts';
import { lerConfigCrm } from '../src/lib/crmIntegracao.ts';
import { mesclarDadosCrm } from '../src/lib/crmEventos.ts';
import { entradasPendentesDoParceiro, montarAtualizacao, montarComissao, montarComissaoPaga, referenciaStorage, tipoDoAnexo, idMensagemCrm } from '../src/lib/crmFase2.ts';
import { bancoFalsoCrm, arrayUnionFalso } from './fixtures/bancoFalsoCrm.ts';

const AGORA = new Date('2026-10-28T15:00:00Z');
const SEGREDO = 'segredo-de-teste';
const CHAVE = 'chave-de-teste';
const USUARIOS = {
  p1: { name: 'Maria Parceira', role: 'external_seller', commission_rate: 3, status: 'active', email: 'maria@x.com' },
  v1: { name: 'Heloisa Laira', role: 'internal_seller', email: 'heloisa@roderbrasil.com.br', status: 'active' },
};
const ind = (o: any = {}) => ({
  client_name: 'Fazenda Boa Vista', status: 'negotiating', external_seller_uid: 'p1', external_seller_name: 'Maria Parceira',
  created_at: '2026-10-27T10:00:00Z', crm_enviado_em: '2026-10-27T10:05:00Z', negotiation_history: [], ...o,
});

// ---------- Contrato final: recebimento ----------
function ambReceber(indicacao: any = ind(), extra: Record<string, Record<string, any>> = {}) {
  const db = bancoFalsoCrm({ indications: { ind1: indicacao }, users: USUARIOS, ...extra });
  const deps = { db, arrayUnion: arrayUnionFalso, config: () => lerConfigCrm({ CRM_ATIVO: '1', CRM_SEGREDO: SEGREDO }), agora: () => AGORA, log: () => {} };
  const enviar = (corpo: any) => {
    const raw = Buffer.from(JSON.stringify(corpo));
    const ts = String(Math.floor(AGORA.getTime() / 1000));
    return tratarRequisicaoCrm(deps, { headers: { 'x-roder-timestamp': ts, 'x-roder-assinatura': assinarCrm(SEGREDO, ts, raw) }, corpo: raw });
  };
  return { db, deps, enviar, get: () => db.dados.indications.ind1 };
}
const textos = (a: any) => (a.get().negotiation_history as any[]).map(h => h.content);
let n = 0;
const base = (evento: string, resto: any = {}) => ({ id: `e${++n}`, evento, em: '2026-10-28T14:00:00Z', id_externo: 'ind1', parceiro_id: 'p1', ...resto });

test('CONTRATO: campos no topo do corpo valem igual aos de dentro de "dados" (e dados prevalece)', () => {
  const m = mesclarDadosCrm({ pedido_numero: 'PV-1', cnpj: '1', dados: { cnpj: '2', itens: [] } });
  assert.equal(m.pedido_numero, 'PV-1'); assert.equal(m.cnpj, '2'); assert.deepEqual(m.itens, []);
});

test('CONTRATO: aceita com a vendedora só na mensagem "Em atendimento por <nome>"', async () => {
  const a = ambReceber(ind({ status: 'pending' }));
  const r = await a.enviar(base('indicacao.aceita', { status: 'em_negociacao', mensagem: 'Em atendimento por Heloisa Laira' }));
  assert.equal(r.status, 200);
  assert.equal(a.get().status, 'negotiating');
  assert.equal(a.get().internal_seller_name, 'Heloisa Laira');
  assert.deepEqual(textos(a), ['Em atendimento por Heloisa Laira']);
});

test('CONTRATO: recusada usa a mensagem como motivo; perdida tira o prefixo "Negociação encerrada:"', async () => {
  const a = ambReceber(ind({ status: 'pending' }));
  await a.enviar(base('indicacao.recusada', { status: 'arquivado', mensagem: 'Fora da área de atendimento' }));
  assert.equal(a.get().status, 'archived');
  assert.match(JSON.stringify(a.get()), /Fora da área de atendimento/);
  const b = ambReceber(ind());
  await b.enviar(base('negocio.perdido', { status: 'arquivado', mensagem: 'Negociação encerrada: Comprou de outra marca' }));
  assert.equal(b.get().cancellation_reason, 'Comprou de outra marca');
  assert.deepEqual(textos(b), ['Negociação encerrada: Comprou de outra marca']);
});

test('CONTRATO: mensagem com dado que identifica outro parceiro cai no texto genérico', async () => {
  const a = ambReceber(ind());
  await a.enviar(base('negocio.perdido', { mensagem: 'Negociação encerrada: indicado por Carlos, comissão 5%' }));
  assert.ok(!/Carlos|comiss|5%/.test(a.get().cancellation_reason), a.get().cancellation_reason);
});

test('CONTRATO: faturado com campos no topo (pedido_numero, datas AAAA-MM-DD) e valor unitário nos itens', async () => {
  const a = ambReceber(ind(), { registered_products: { r1: { code: '1000.0001', is_commissionable: true } } });
  const r = await a.enviar(base('pedido.faturado', {
    status: 'vendido', mensagem: 'Venda concluída, comissão liberada', pedido_numero: 'PV-77', cnpj: '12.345.678/0001-90',
    data_pedido: '2026-10-20', previsao_entrega: '2026-11-20', data_faturamento: '2026-10-28', nota_fiscal: '1234',
    itens: [{ codigo: '1000.0001', nome: 'Cabeçote', quantidade: 2, valor: 50000 }], valor_total: 100000,
  }));
  assert.equal(r.status, 200);
  assert.equal(a.get().status, 'sold');
  assert.equal(a.get().sale_order_number, 'PV-77');
  assert.equal(a.get().crm_nota_fiscal, '1234');
  const c: any = Object.values(a.db.dados.commissions)[0];
  assert.equal(c.gross_commissionable_value, 100000);
  assert.equal(c.value, 3000);
});

test('DATAS: data sem hora vale o dia de São Paulo (nunca o dia anterior em UTC)', async () => {
  const a = ambReceber(ind());
  await a.enviar(base('indicacao.recebida', { em: '2026-10-28' }));
  const quando = new Date(a.get().negotiation_history[0].created_at);
  assert.equal(quando.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }), '2026-10-28');
});

test('SEM PARCEIRO: evento que mexe em status ou dinheiro sem parceiro_id (ou de outro) é ignorado', async () => {
  const a = ambReceber(ind());
  const r1 = await a.enviar(base('negocio.perdido', { parceiro_id: null, mensagem: 'x' }));
  const r2 = await a.enviar(base('negocio.perdido', { parceiro_id: 'outro', mensagem: 'x' }));
  assert.equal(r1.body.resultado, 'ignorado'); assert.equal(r2.body.resultado, 'ignorado');
  assert.equal(a.get().status, 'negotiating');
});

// ---------- Envio: virada e carga ----------
function ambEnviar(env: Record<string, string>, indicacoes: Record<string, any>, extra: Record<string, Record<string, any>> = {}, respostas: any[] = [{ status: 200, corpo: { ok: true } }]) {
  const db = bancoFalsoCrm({ indications: indicacoes, users: USUARIOS, ...extra });
  const chamadas: { url: string; init: any; corpo: any }[] = [];
  let i = 0; let agora = AGORA;
  const fetchFn = async (url: string, init: any) => {
    chamadas.push({ url, init, corpo: JSON.parse(init.body) });
    const r = respostas[Math.min(i++, respostas.length - 1)];
    if (r instanceof Error) throw r;
    return { ok: r.status < 300, status: r.status, text: async () => JSON.stringify(r.corpo ?? { ok: true }) };
  };
  const deps = {
    db, fetchFn, agora: () => agora, log: () => {}, arrayUnion: arrayUnionFalso,
    config: () => lerConfigCrm(env),
    assinarAnexo: async (u: string) => ({ url: `${u}&assinada=1`, tamanho: 1000 }),
  };
  return { db, deps, chamadas, avancar: (ms: number) => { agora = new Date(agora.getTime() + ms); } };
}
const ENV_ON = { CRM_ATIVO: '1', CRM_CHAVE: CHAVE, CRM_URL: 'http://localhost:9/crm', CRM_ATIVO_DESDE: '2026-10-01T00:00:00.000Z' };

test('CARGA INICIAL: um POST { tipo, itens }, resumo do CRM devolvido, lote de até 500', async () => {
  const many: Record<string, any> = {};
  for (let k = 0; k < 520; k++) many[`i${k}`] = { client_name: `C${k}`, status: 'pending', created_at: '2026-09-01T00:00:00Z', external_seller_uid: 'p1', external_seller_name: 'Maria' };
  const a = ambEnviar({ CRM_CHAVE: CHAVE, CRM_URL: 'http://localhost:9/crm' }, many, {}, [{ status: 200, corpo: { ok: true, recebidos: 500, vinculados: 3, repetidos: 1, ignorados: 2 } }]);
  const r: any = await cargaInicialCrm(a.deps, { limite: 9999 });
  assert.equal(a.chamadas.length, 1);
  assert.equal(a.chamadas[0].corpo.tipo, 'carga_inicial');
  assert.equal(a.chamadas[0].corpo.itens.length, 500);
  assert.equal(a.chamadas[0].init.headers['x-roder-chave'], CHAVE);
  assert.deepEqual(r.resumo, { recebidos: 500, vinculados: 3, repetidos: 1, ignorados: 2 });
  assert.equal(r.enviadas, 500); assert.equal(r.restantes, 20);
});

test('CARGA INICIAL: falha do CRM não marca nada como enviado e entra no backoff', async () => {
  const a = ambEnviar({ CRM_CHAVE: CHAVE, CRM_URL: 'http://localhost:9/crm' }, { a: { client_name: 'A', status: 'pending', created_at: '2026-09-01T00:00:00Z' } }, {}, [{ status: 500 }]);
  const r: any = await cargaInicialCrm(a.deps, {});
  assert.equal(r.enviadas, 0); assert.equal(r.falhas, 1);
  assert.equal(a.db.dados.indications.a.crm_enviado_em, undefined);
  assert.equal(a.db.dados.indications.a.crm_tentativas, 1);
});

test('VIRADA: carga grava o corte; o laço começa nesse corte e envia como NOVA o que nasceu entre a carga e o CRM_ATIVO=1', async () => {
  const antes = { client_name: 'Antiga', status: 'pending', created_at: '2026-10-24T09:00:00Z' };
  const a = ambEnviar({ CRM_CHAVE: CHAVE, CRM_URL: 'http://localhost:9/crm' }, { antiga: antes });
  await cargaInicialCrm(a.deps, {});
  const corte = a.db.dados.settings.crm_integracao.carga_inicial_em;
  assert.equal(corte, AGORA.toISOString());
  // nasce depois da carga, antes de ligar
  a.avancar(60 * 60 * 1000);
  a.db.dados.indications.nova = { client_name: 'Nova', status: 'pending', created_at: new Date(AGORA.getTime() + 1800000).toISOString() };
  // segunda carga (retentativa) NÃO leva a nova: ela é do laço
  const sim: any = await cargaInicialCrm(a.deps, { simulacao: true });
  assert.equal(sim.elegiveis, 0);
  // liga
  a.deps.config = () => lerConfigCrm({ CRM_ATIVO: '1', CRM_CHAVE: CHAVE, CRM_URL: 'http://localhost:9/crm' });
  assert.equal(await garantirDataDaVirada(a.deps), corte);
  const f = await rodarFilaCrm(a.deps);
  assert.deepEqual(f.resultados.map(x => x.id), ['nova']);
  assert.equal(a.chamadas.at(-1)!.corpo.id_externo, 'nova');
  assert.equal(a.chamadas.at(-1)!.corpo.tipo, undefined, 'indicação nova vai no formato normal');
});

// ---------- Fase 2: atualização do parceiro ----------
const entrada = (id: string, extra: any = {}) => ({ id, content: 'Falei com o cliente', author_name: 'Maria Parceira', author_role: 'external_seller', created_at: '2026-10-28T10:00:00Z', ...extra });

test('ATUALIZAÇÃO: só entra o que o parceiro escreveu depois do envio; nada do CRM, da abertura ou de vendedora interna', () => {
  const i = ind({ negotiation_history: [
    entrada('h1'),
    entrada('antes', { created_at: '2026-10-27T09:00:00Z' }),
    entrada('crm-ev1', { author_name: 'CRM Roder' }),
    entrada('obs-parceiro-1'),
    entrada('interna', { author_name: 'Heloisa Laira', author_role: 'internal_seller' }),
    entrada('vazia', { content: '' }),
    entrada('so-anexo', { content: '', attachments: [{ url: 'https://x/y.jpg', name: 'y.jpg' }] }),
  ] });
  assert.deepEqual(entradasPendentesDoParceiro(i).map(e => e.id), ['h1', 'so-anexo']);
  assert.deepEqual(entradasPendentesDoParceiro({ ...i, crm_atualizacoes_enviadas: ['h1'] }).map(e => e.id), ['so-anexo']);
});

test('ATUALIZAÇÃO: payload com id_mensagem estável e tipos de anexo', () => {
  const p = montarAtualizacao(ind(), 'ind1', entrada('h1'), [{ url: 'https://x/a.webm', tipo: 'audio', nome: 'a.webm' }]);
  assert.equal(p.tipo, 'atualizacao'); assert.equal(p.id_externo, 'ind1');
  assert.equal(p.id_mensagem, idMensagemCrm('ind1', 'h1'));
  assert.equal(p.autor, 'Maria Parceira'); assert.equal(p.criado_em, '2026-10-28T10:00:00.000Z');
  assert.equal(tipoDoAnexo({ name: 'Audio 12.webm' }), 'audio');
  assert.equal(tipoDoAnexo({ name: 'foto.JPG' }), 'imagem');
  assert.equal(tipoDoAnexo({ name: 'proposta.pdf' }), 'arquivo');
  assert.deepEqual(referenciaStorage('https://firebasestorage.googleapis.com/v0/b/meu-bucket/o/anexos%2Fa%20b.jpg?alt=media&token=t'), { bucket: 'meu-bucket', caminho: 'anexos/a b.jpg' });
  assert.equal(referenciaStorage('https://exemplo.com/x.jpg'), null);
});

test('ATUALIZAÇÃO: envia uma vez, assina a URL do Storage, limita a 10 anexos e avisa do data: URL', async () => {
  const anexos = Array.from({ length: 12 }, (_, k) => ({ name: `f${k}.jpg`, url: `https://firebasestorage.googleapis.com/v0/b/b/o/f${k}.jpg?alt=media` }));
  anexos.push({ name: 'local.jpg', url: 'data:image/jpeg;base64,AAAA' } as any);
  const a = ambEnviar(ENV_ON, { ind1: ind({ negotiation_history: [entrada('h1', { attachments: anexos })] }) });
  const r = await rodarAtualizacoesCrm(a.deps);
  assert.equal(r.enviadas, 1);
  const c = a.chamadas[0].corpo;
  assert.equal(c.anexos.length, 10);
  assert.ok(c.anexos.every((x: any) => x.url.includes('assinada=1') && x.tipo === 'imagem'));
  assert.match(c.texto, /além do limite/);
  assert.deepEqual(a.db.dados.indications.ind1.crm_atualizacoes_enviadas, ['h1']);
  await rodarAtualizacoesCrm(a.deps);
  assert.equal(a.chamadas.length, 1, 'não reenvia');
});

test('ATUALIZAÇÃO: falha entra no backoff por entrada e a próxima rodada espera; indicação fora do CRM não envia', async () => {
  const a = ambEnviar(ENV_ON, {
    ind1: ind({ negotiation_history: [entrada('h1')] }),
    fora: ind({ crm_enviado_em: undefined, negotiation_history: [entrada('h2')] }),
  }, {}, [{ status: 500 }, { status: 200 }]);
  const r1 = await rodarAtualizacoesCrm(a.deps);
  assert.equal(r1.falhas, 1); assert.equal(a.chamadas.length, 1);
  await rodarAtualizacoesCrm(a.deps);
  assert.equal(a.chamadas.length, 1, 'dentro do backoff');
  a.avancar(2 * 60 * 1000);
  const r3 = await rodarAtualizacoesCrm(a.deps);
  assert.equal(r3.enviadas, 1);
  assert.equal(a.chamadas[1].corpo.id_mensagem, a.chamadas[0].corpo.id_mensagem, 'mesmo id_mensagem na retentativa');
});

// ---------- Fase 2: comissão ----------
const COM = (o: any = {}) => ({
  indication_id: 'ind1', external_seller_uid: 'p1', external_seller_name: 'Maria Parceira', value: 3000, base_value_used: 100000,
  gross_commissionable_value: 100000, rate_applied: 3, status: 'waiting_nf', month: 11, year: 2026, created_at: '2026-10-28T12:00:00Z',
  discount_applied: 500, discount_percentage: 0.5, ...o,
});

test('COMISSÃO: payload só com pedido e parceiro (nada de desconto nem vendedor interno)', () => {
  const p: any = montarComissao(COM(), 'c1', ind({ sale_order_number: 'PV-77', internal_seller_name: 'Heloisa' }));
  assert.deepEqual(p, {
    tipo: 'comissao', id_externo: 'ind1', pedido_numero: 'PV-77', parceiro: { id: 'p1', nome: 'Maria Parceira' },
    valor_equipamento: 100000, percentual: 3, valor_comissao: 3000, calculada_em: '2026-10-28T12:00:00.000Z', previsao_pagamento: '2026-11-07',
  });
  assert.ok(!/desconto|Heloisa|discount/i.test(JSON.stringify(p)));
  const q = montarComissaoPaga(COM({ status: 'paid', updated_at: '2026-11-06T10:00:00Z' }), 'c1', ind({ sale_order_number: 'PV-77' }));
  assert.deepEqual(q, { tipo: 'comissao_paga', id_externo: 'ind1', pedido_numero: 'PV-77', paga_em: '2026-11-06T10:00:00.000Z' });
});

test('COMISSÃO: envia "comissao" uma vez; ao pagar envia "comissao_paga" uma vez; marcas na comissão', async () => {
  const a = ambEnviar(ENV_ON, { ind1: ind({ sale_order_number: 'PV-77', status: 'sold' }) }, { commissions: { c1: COM() } });
  const r = await rodarComissoesCrm(a.deps);
  assert.equal(r.enviadas, 1);
  assert.equal(a.chamadas[0].corpo.tipo, 'comissao');
  await rodarComissoesCrm(a.deps);
  assert.equal(a.chamadas.length, 1, 'idempotente');
  a.db.dados.commissions.c1.status = 'paid'; a.db.dados.commissions.c1.updated_at = '2026-11-06T10:00:00Z';
  await rodarComissoesCrm(a.deps);
  assert.equal(a.chamadas.length, 2); assert.equal(a.chamadas[1].corpo.tipo, 'comissao_paga');
  await rodarComissoesCrm(a.deps);
  assert.equal(a.chamadas.length, 2);
  assert.ok(a.db.dados.commissions.c1.crm_comissao_enviada_em && a.db.dados.commissions.c1.crm_paga_enviada_em);
});

test('COMISSÃO: indicação que nunca foi ao CRM não envia; falha faz backoff e a "paga" espera a "comissao"', async () => {
  const a = ambEnviar(ENV_ON, { ind1: ind({ crm_enviado_em: undefined }) }, { commissions: { c1: COM() } });
  await rodarComissoesCrm(a.deps);
  assert.equal(a.chamadas.length, 0);
  const b = ambEnviar(ENV_ON, { ind1: ind() }, { commissions: { c1: COM({ status: 'paid' }) } }, [{ status: 500 }, { status: 200 }]);
  await rodarComissoesCrm(b.deps);
  assert.equal(b.chamadas.length, 1, 'a paga não passa na frente da comissao que falhou');
  assert.equal(b.db.dados.commissions.c1.crm_comissao_tentativas, 1);
  await rodarComissoesCrm(b.deps);
  assert.equal(b.chamadas.length, 1, 'backoff');
  b.avancar(2 * 60 * 1000);
  await rodarComissoesCrm(b.deps);
  assert.deepEqual(b.chamadas.map(c => c.corpo.tipo), ['comissao', 'comissao', 'comissao_paga']);
});
