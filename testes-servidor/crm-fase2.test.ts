// Contrato final do CRM (campos no topo e em dados, mensagem, datas em São Paulo) e fase 2 (atualização, comissão, comissão paga).
// Rodar: node --import tsx --test testes-servidor/crm-fase2.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { processarEventoCrm, tratarRequisicaoCrm } from '../server/crmEventos.ts';
import { assinarCrm } from '../server/crmAssinatura.ts';
import { rodarAtualizacoesCrm, rodarComissoesCrm, rodarFilaCrm, cargaInicialCrm, garantirDataDaVirada, reativarDesistidasCrm } from '../server/crmEntrada.ts';
import { lerConfigCrm } from '../src/lib/crmIntegracao.ts';
import { mesclarDadosCrm } from '../src/lib/crmEventos.ts';
import { entradasPendentesDoParceiro, entradasParaIgnorar, montarAtualizacao, montarComissao, montarComissaoPaga, referenciaStorage, tipoDoAnexo, idMensagemCrm } from '../src/lib/crmFase2.ts';
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
    bucketProprio: 'proprio',
  };
  return { db, deps, chamadas, avancar: (ms: number) => { agora = new Date(agora.getTime() + ms); } };
}
const ENV_ON = { CRM_ATIVO: '1', CRM_CHAVE: CHAVE, CRM_URL: 'http://localhost:9/crm', CRM_ATIVO_DESDE: '2026-10-01T00:00:00.000Z' };

test('CARGA INICIAL: um POST { tipo, itens }, resumo do CRM devolvido, lote de até 500', async () => {
  const many: Record<string, any> = {};
  for (let k = 0; k < 520; k++) many[`i${k}`] = { client_name: `C${k}`, status: 'negotiating', created_at: '2026-09-01T00:00:00Z', external_seller_uid: 'p1', external_seller_name: 'Maria' };
  const a = ambEnviar({ CRM_CHAVE: CHAVE, CRM_URL: 'http://localhost:9/crm' }, many, {}, [{ status: 200, corpo: { ok: true, recebidos: 500, vinculados: 3, repetidos: 1, ignorados: 2 } }]);
  const r: any = await cargaInicialCrm(a.deps, { limite: 9999 });
  assert.equal(a.chamadas.length, 1);
  assert.equal(a.chamadas[0].corpo.tipo, 'carga_inicial');
  assert.equal(a.chamadas[0].corpo.itens.length, 500);
  assert.equal(a.chamadas[0].init.headers['x-roder-chave'], CHAVE);
  assert.deepEqual(r.resumo, { recebidos: 500, vinculados: 3, repetidos: 1, ignorados: 2 });
  assert.equal(r.enviadas, 500); assert.equal(r.restantes, 20);
});

test('CARGA INICIAL: transporte, 401, 403, 429 e 5xx não contam tentativa nem desistem, mesmo repetindo 15 vezes', async () => {
  for (const resp of [{ status: 500 }, { status: 401 }, { status: 403 }, { status: 429 }, new Error('ECONNRESET')]) {
    const a = ambEnviar({ CRM_CHAVE: CHAVE, CRM_URL: 'http://localhost:9/crm' }, { a: { client_name: 'A', status: 'negotiating', created_at: '2026-09-01T00:00:00Z' } }, {}, [resp]);
    for (let k = 0; k < 15; k++) { a.avancar(5 * 60 * 1000); const r: any = await cargaInicialCrm(a.deps, {}); assert.equal(r.enviadas, 0); }
    const x = a.db.dados.indications.a;
    assert.equal(x.crm_enviado_em, undefined); assert.equal(x.crm_tentativas, undefined); assert.equal(x.crm_desistiu_em, undefined);
    assert.equal(x.crm_reservado_ate, null, 'solta a reserva');
    assert.equal(a.chamadas.length, 15, 'sempre tenta de novo');
  }
});

test('CARGA INICIAL: só a recusa POR ITEM (ok:false) conta tentativa; os outros itens do lote ficam enviados', async () => {
  const mk = () => ({ client_name: 'X', status: 'negotiating', created_at: '2026-09-01T00:00:00Z' });
  const a = ambEnviar({ CRM_CHAVE: CHAVE, CRM_URL: 'http://localhost:9/crm' }, { bom: mk(), ruim: mk() }, {}, [{ status: 200, corpo: { ok: true, resultados: [{ id_externo: 'bom', ok: true }, { id_externo: 'ruim', ok: false }] } }]);
  const r: any = await cargaInicialCrm(a.deps, {});
  assert.equal(r.enviadas, 1);
  assert.ok(a.db.dados.indications.bom.crm_enviado_em);
  assert.equal(a.db.dados.indications.ruim.crm_enviado_em, undefined);
  assert.equal(a.db.dados.indications.ruim.crm_tentativas, 1);
});

test('REATIVAR: a ação de admin zera a desistência das indicações e comissões', async () => {
  const a = ambEnviar(ENV_ON, {
    d: { client_name: 'D', status: 'pending', created_at: '2026-10-27T00:00:00Z', crm_desistiu_em: '2026-10-27T05:00:00Z', crm_tentativas: 10, crm_ultimo_erro: 'HTTP 500', crm_atu_falha_h1: { n: 3 }, crm_atualizacoes_desistiu: ['h1'] },
    ok: { client_name: 'O', status: 'pending', created_at: '2026-10-27T00:00:00Z' },
  }, { commissions: { c1: { crm_desistiu_em: 'x', crm_comissao_tentativas: 10 } } });
  const r = await reativarDesistidasCrm(a.deps);
  assert.deepEqual(r, { indicacoes: 1, comissoes: 1 });
  const d = a.db.dados.indications.d;
  assert.equal(d.crm_desistiu_em, null); assert.equal(d.crm_tentativas, 0); assert.deepEqual(d.crm_atualizacoes_desistiu, []); assert.equal(d.crm_atu_falha_h1, null);
  assert.equal(a.db.dados.commissions.c1.crm_desistiu_em, null);
  const f = await rodarFilaCrm(a.deps);
  assert.ok(f.resultados.some(x => x.id === 'd' && x.resultado === 'enviada'));
});

test('LAÇO: pending, triagem e negotiating velhas vão de qualquer idade (sem janela de 72 h), em lotes por rodada', async () => {
  const velhas: Record<string, any> = {};
  for (let k = 0; k < 25; k++) velhas[`v${k}`] = { client_name: `V${k}`, status: k % 2 ? 'triagem' : 'pending', created_at: `2025-0${1 + (k % 9)}-10T00:00:00Z` };
  const a = ambEnviar({ ...ENV_ON, CRM_NOTIFICAR_EMAIL: 'x@roderbrasil.com.br' }, { ...velhas, neg: { client_name: 'N', status: 'negotiating', created_at: '2025-03-01T00:00:00Z' } });
  const r1 = await rodarFilaCrm(a.deps);
  assert.equal(r1.resultados.length, 20, 'teto por rodada');
  a.avancar(60 * 1000);
  const r2 = await rodarFilaCrm(a.deps);
  assert.equal(r2.resultados.length, 6, 'sobrou fila: varre de novo no minuto seguinte');
  assert.equal(r1.resultados.concat(r2.resultados).every(x => x.resultado === 'enviada'), true);
  assert.ok(a.chamadas.every(c => c.corpo.tipo === undefined && !('notificar_email' in c.corpo)), 'nenhuma antiga leva aviso por e-mail');
  assert.equal(a.chamadas.filter(c => /Já estava/.test(c.corpo.observacao)).length, 1, 'só a negotiating leva a nota');
});

test('LAÇO: negociação criada depois do corte é achada sem janela de 72 h e leva o aviso "Já estava em negociação"', async () => {
  const env = { CRM_ATIVO: '1', CRM_CHAVE: CHAVE, CRM_URL: 'http://localhost:9/crm', CRM_ATIVO_DESDE: '2026-10-20T00:00:00.000Z' };
  const a = ambEnviar(env, { n1: { client_name: 'N', status: 'negotiating', internal_seller_name: 'Heloisa', created_at: '2026-10-21T00:00:00Z' } });
  await rodarFilaCrm(a.deps);
  assert.equal(a.chamadas.length, 1);
  assert.match(a.chamadas[0].corpo.observacao, /^\[Já estava em negociação no Roder Indica com Heloisa\]/);
});

test('VIRADA: carga grava o corte; o laço usa esse corte como ativo_desde; o que nasceu depois da carga vai como NOVA', async () => {
  const a = ambEnviar({ CRM_CHAVE: CHAVE, CRM_URL: 'http://localhost:9/crm' }, { antiga: { client_name: 'Antiga', status: 'negotiating', created_at: '2026-10-24T09:00:00Z' } });
  await cargaInicialCrm(a.deps, {});
  const corte = a.db.dados.settings.crm_integracao.carga_inicial_em;
  assert.equal(corte, AGORA.toISOString());
  a.avancar(60 * 60 * 1000);
  a.db.dados.indications.nova = { client_name: 'Nova', status: 'pending', created_at: new Date(AGORA.getTime() + 1800000).toISOString() };
  a.db.dados.indications.nova2 = { client_name: 'Nova2', status: 'negotiating', internal_seller_name: 'Heloisa', created_at: new Date(AGORA.getTime() + 1900000).toISOString() };
  const sim: any = await cargaInicialCrm(a.deps, { simulacao: true });
  assert.equal(sim.elegiveis, 0, 'carga repetida não leva o que nasceu depois do corte');
  a.deps.config = () => lerConfigCrm({ CRM_ATIVO: '1', CRM_CHAVE: CHAVE, CRM_URL: 'http://localhost:9/crm' });
  assert.equal(await garantirDataDaVirada(a.deps), corte);
  const f = await rodarFilaCrm(a.deps);
  assert.deepEqual(f.resultados.map(x => x.id).sort(), ['nova', 'nova2']);
  assert.match(a.chamadas.at(-1)!.corpo.observacao, /Já estava em negociação/);
});

// ---------- Fase 2: atualização do parceiro ----------
const entrada = (id: string, extra: any = {}) => ({ id, type: 'note', content: 'Falei com o cliente', author_name: 'Maria Parceira', author_uid: 'p1', created_at: '2026-10-28T10:00:00Z', ...extra });

test('ATUALIZAÇÃO: só nota (note/whatsapp) do parceiro por author_uid; nada do CRM, automático, de outra pessoa ou anterior ao envio', () => {
  const i = ind({ negotiation_history: [
    entrada('h1'),
    entrada('wa', { type: 'whatsapp' }),
    entrada('antes', { created_at: '2026-10-27T09:00:00Z' }),
    entrada('crm-ev1', { author_name: 'CRM Roder', author_uid: undefined }),
    entrada('obs-parceiro-1', { type: 'partner_note' }),
    entrada('sistema1', { type: 'system', author_uid: 'p1', content: 'Dados da negociação atualizados via Central Flutuante.' }),
    entrada('anexo-orc', { type: 'system', content: 'Orçamento anexado: x.pdf' }),
    entrada('status', { type: 'status_change' }),
    entrada('interna', { author_name: 'Heloisa Laira', author_uid: 'v1' }),
    entrada('mesmo-nome-outro-uid', { author_uid: 'outro' }),
    entrada('antiga-nome-igual', { author_uid: undefined }),
    entrada('antiga-nome-parecido', { author_uid: undefined, author_name: 'maria parceira' }),
    entrada('vazia', { content: '' }),
    entrada('so-anexo', { content: '', attachments: [{ url: 'https://x/y.jpg', name: 'y.jpg' }] }),
  ] });
  assert.deepEqual(entradasPendentesDoParceiro(i).map(e => e.id), ['h1', 'wa', 'antiga-nome-igual', 'so-anexo']);
  assert.deepEqual(entradasParaIgnorar(i).sort(), ['antiga-nome-parecido', 'interna', 'mesmo-nome-outro-uid']);
  assert.deepEqual(entradasPendentesDoParceiro({ ...i, crm_atualizacoes_enviadas: ['h1'] }).map(e => e.id), ['wa', 'antiga-nome-igual', 'so-anexo']);
  assert.deepEqual(entradasParaIgnorar({ ...i, crm_atualizacoes_ignoradas: ['interna', 'mesmo-nome-outro-uid', 'antiga-nome-parecido'] }), []);
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

const urlB = (bucket: string, nome: string) => `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${nome}?alt=media`;

test('ATUALIZAÇÃO: envia uma vez; assina só URL do bucket próprio; limita a 10; avisa de data:, de outro bucket e de arquivo > 20 MB', async () => {
  const anexos: any[] = Array.from({ length: 11 }, (_, k) => ({ name: `f${k}.jpg`, url: urlB('proprio', `f${k}.jpg`) }));
  anexos.push({ name: 'local.jpg', url: 'data:image/jpeg;base64,AAAA' });
  const a = ambEnviar(ENV_ON, { ind1: ind({ negotiation_history: [entrada('h1', { attachments: anexos })] }) });
  (a.deps as any).bucketProprio = 'proprio';
  const r = await rodarAtualizacoesCrm(a.deps);
  assert.equal(r.enviadas, 1);
  const c = a.chamadas[0].corpo;
  assert.equal(c.anexos.length, 10);
  assert.ok(c.anexos.every((x: any) => x.url.includes('assinada=1') && x.tipo === 'imagem'));
  assert.match(c.texto, /além do limite/);
  assert.deepEqual(a.db.dados.indications.ind1.crm_atualizacoes_enviadas, ['h1']);
  await rodarAtualizacoesCrm(a.deps);
  assert.equal(a.chamadas.length, 1, 'não reenvia');

  const b = ambEnviar(ENV_ON, { ind1: ind({ negotiation_history: [entrada('h2', { attachments: [
    { name: 'alheio.jpg', url: urlB('outro-bucket', 'alheio.jpg') },
    { name: 'site.jpg', url: 'https://exemplo.com/x.jpg' },
    { name: 'grande.mp4', url: urlB('proprio', 'grande.mp4') },
    { name: 'sem-conferir.jpg', url: urlB('proprio', 'sem-conferir.jpg') },
    { name: 'ok.jpg', url: urlB('proprio', 'ok.jpg') },
  ] })] }) });
  (b.deps as any).bucketProprio = 'proprio';
  (b.deps as any).assinarAnexo = async (u: string) => {
    if (u.includes('grande')) return { url: u, tamanho: 21 * 1024 * 1024 };
    if (u.includes('sem-conferir')) throw new Error('metadata falhou');
    return { url: undefined, tamanho: 1000 }; // assinatura falhou, tamanho conferido: vai a URL original
  };
  await rodarAtualizacoesCrm(b.deps);
  const cb = b.chamadas[0].corpo;
  assert.deepEqual(cb.anexos.map((x: any) => x.nome), ['ok.jpg']);
  assert.equal(cb.anexos[0].url, urlB('proprio', 'ok.jpg'));
  for (const nome of ['alheio.jpg', 'site.jpg', 'grande.mp4', 'sem-conferir.jpg']) assert.ok(cb.texto.includes(nome), nome);
});

test('ATUALIZAÇÃO: nota de outra pessoa recebe a marca de ignorada (uma vez) e não é enviada; fora do CRM nada é lido', async () => {
  const a = ambEnviar(ENV_ON, {
    ind1: ind({ negotiation_history: [entrada('i1', { author_name: 'Heloisa Laira', author_uid: 'v1' }), entrada('h1')] }),
    fora: ind({ crm_enviado_em: undefined, negotiation_history: [entrada('h2')] }),
  });
  await rodarAtualizacoesCrm(a.deps);
  assert.deepEqual(a.chamadas.map(c => c.corpo.id_mensagem), ['ind1:h1']);
  assert.deepEqual(a.db.dados.indications.ind1.crm_atualizacoes_ignoradas, ['i1']);
  assert.equal(a.db.dados.indications.fora.crm_atualizacoes_ignoradas, undefined);
});

test('ATUALIZAÇÃO: falha entra no backoff por entrada e a próxima rodada espera', async () => {
  const a = ambEnviar(ENV_ON, { ind1: ind({ negotiation_history: [entrada('h1')] }) }, {}, [{ status: 500 }, { status: 200 }]);
  const r1 = await rodarAtualizacoesCrm(a.deps);
  assert.equal(r1.falhas, 1); assert.equal(a.chamadas.length, 1);
  assert.equal(a.db.dados.indications.ind1.crm_atu_falha_h1.n, 0, '5xx não conta tentativa');
  assert.ok(a.db.dados.indications.ind1.crm_atu_retry, 'marca para a leitura incremental achar a retentativa');
  await rodarAtualizacoesCrm(a.deps);
  assert.equal(a.chamadas.length, 1, 'dentro do backoff');
  a.avancar(2 * 60 * 1000);
  const r3 = await rodarAtualizacoesCrm(a.deps);
  assert.equal(r3.enviadas, 1);
  assert.equal(a.chamadas[1].corpo.id_mensagem, a.chamadas[0].corpo.id_mensagem, 'mesmo id_mensagem na retentativa');
  assert.equal(a.db.dados.indications.ind1.crm_atu_retry, null);
});

test('ATUALIZAÇÃO: 401, 403, 429 e 5xx nunca fazem desistir; só a rejeição de validação conta e desiste após 10', async () => {
  for (const status of [401, 403, 429, 503]) {
    const a = ambEnviar(ENV_ON, { ind1: ind({ negotiation_history: [entrada('h1')] }) }, {}, [{ status }]);
    for (let k = 0; k < 15; k++) { await rodarAtualizacoesCrm(a.deps); a.avancar(7 * 60 * 60 * 1000); }
    assert.equal(a.chamadas.length, 15, String(status));
    assert.equal(a.db.dados.indications.ind1.crm_atualizacoes_desistiu, undefined);
  }
  const b = ambEnviar(ENV_ON, { ind1: ind({ negotiation_history: [entrada('h1')] }) }, {}, [{ status: 422 }]);
  for (let k = 0; k < 15; k++) { await rodarAtualizacoesCrm(b.deps); b.avancar(7 * 60 * 60 * 1000); }
  assert.equal(b.chamadas.length, 10);
  assert.deepEqual(b.db.dados.indications.ind1.crm_atualizacoes_desistiu, ['h1']);
});

test('ATUALIZAÇÃO: rodada normal lê só quem mudou (updated_at); a completa roda de 6 em 6 horas', async () => {
  const a = ambEnviar(ENV_ON, {
    novo: ind({ updated_at: '2026-10-28T14:55:00Z', negotiation_history: [entrada('h1')] }),
    parado: ind({ updated_at: '2026-10-01T00:00:00Z', negotiation_history: [entrada('h2')] }),
  });
  await rodarAtualizacoesCrm(a.deps); // primeira rodada: completa
  assert.equal(a.chamadas.length, 2);
  a.db.dados.indications.parado.negotiation_history.push(entrada('h3'));
  a.db.dados.indications.novo.negotiation_history.push(entrada('h4'));
  a.db.dados.indications.novo.updated_at = new Date(AGORA.getTime() + 60000).toISOString();
  a.avancar(10 * 60 * 1000);
  await rodarAtualizacoesCrm(a.deps);
  assert.deepEqual(a.chamadas.slice(2).map(c => c.corpo.id_mensagem), ['novo:h4'], 'o parado sem updated_at novo não foi relido');
  a.avancar(6 * 60 * 60 * 1000);
  await rodarAtualizacoesCrm(a.deps);
  assert.ok(a.chamadas.some(c => c.corpo.id_mensagem === 'parado:h3'), 'a varredura completa acha o que ficou para trás');
});

// ---------- Fase 2: comissão ----------
const COM = (o: any = {}) => ({
  indication_id: 'ind1', external_seller_uid: 'p1', external_seller_name: 'Maria Parceira', value: 2000, base_value_used: 100000,
  gross_commissionable_value: 105000, rate_applied: 2, status: 'waiting_nf', month: 11, year: 2026, created_at: '2026-10-28T12:00:00Z',
  discount_applied: 5000, discount_percentage: 4.76, ...o,
});
const INDV = (o: any = {}) => ind({ sale_order_number: 'PV-77', status: 'sold', ...o });

test('COMISSÃO: valor_equipamento é a base comissionável (sem desconto), percentual em pontos, nada de desconto ou vendedor interno', () => {
  const p: any = montarComissao(COM(), 'c1', INDV({ internal_seller_name: 'Heloisa' }));
  assert.deepEqual(p, {
    tipo: 'comissao', id_externo: 'ind1', pedido_numero: 'PV-77', parceiro: { id: 'p1', nome: 'Maria Parceira' },
    valor_equipamento: 100000, percentual: 2, valor_comissao: 2000, calculada_em: '2026-10-28T12:00:00.000Z', previsao_pagamento: '2026-11-07',
  });
  assert.equal(p.valor_equipamento * p.percentual / 100, p.valor_comissao);
  assert.ok(!/desconto|Heloisa|discount|105000/i.test(JSON.stringify(p)));
  assert.equal(montarComissao(COM({ rate_applied: 0 }), 'c1', INDV())!.percentual, 2, 'taxa ausente: calcula de valor/base');
  assert.equal(montarComissao(COM({ rate_applied: undefined }), 'c1', INDV())!.percentual, 2);
  assert.equal(montarComissao(COM({ rate_applied: 0, value: 0 }), 'c1', INDV()), null, 'sem como saber o percentual: espera');
  // sem base_value_used: outros campos só valem se baterem com taxa x base = valor; senão deriva do valor ou espera
  assert.equal(montarComissao(COM({ base_value_used: 0, commissionable_value: 100000 }), 'c1', INDV())!.valor_equipamento, 100000);
  assert.equal(montarComissao(COM({ base_value_used: 0, commissionable_value: 105000, base_commission_value: 100000 }), 'c1', INDV())!.valor_equipamento, 100000, 'pula o incoerente');
  assert.equal(montarComissao(COM({ base_value_used: 0, commissionable_value: 105000 }), 'c1', INDV())!.valor_equipamento, 100000, 'incoerente: deriva de valor / taxa');
  assert.equal(montarComissao(COM({ base_value_used: 0, rate_applied: 0, commissionable_value: 105000 }), 'c1', INDV()), null, 'sem taxa nem base confiável: espera');
  assert.equal(montarComissao(COM(), 'c1', INDV({ sale_order_number: 'PV-99' }), 'PV-77')!.pedido_numero, 'PV-77', 'mantém o número do primeiro envio');
  assert.equal(montarComissao(COM(), 'c1', ind({ sale_order_number: '  ' })), null, 'sem número do pedido: espera');
  const q = montarComissaoPaga(COM({ status: 'paid', updated_at: '2026-11-06T10:00:00Z' }), 'c1', INDV());
  assert.deepEqual(q, { tipo: 'comissao_paga', id_externo: 'ind1', pedido_numero: 'PV-77', paga_em: '2026-11-06T10:00:00.000Z' });
});

test('COMISSÃO: envia "comissao" uma vez; ao pagar envia "comissao_paga" uma vez; marcas na comissão', async () => {
  const a = ambEnviar(ENV_ON, { ind1: INDV() }, { commissions: { c1: COM() } });
  const r = await rodarComissoesCrm(a.deps);
  assert.equal(r.enviadas, 1);
  assert.equal(a.chamadas[0].corpo.tipo, 'comissao');
  assert.equal(a.db.dados.commissions.c1.crm_aguardando_paga, true);
  await rodarComissoesCrm(a.deps);
  assert.equal(a.chamadas.length, 1, 'idempotente');
  a.db.dados.commissions.c1.status = 'paid'; a.db.dados.commissions.c1.updated_at = '2026-11-06T10:00:00Z';
  await rodarComissoesCrm(a.deps);
  assert.equal(a.chamadas.length, 2); assert.equal(a.chamadas[1].corpo.tipo, 'comissao_paga');
  await rodarComissoesCrm(a.deps);
  assert.equal(a.chamadas.length, 2);
  assert.ok(a.db.dados.commissions.c1.crm_comissao_enviada_em && a.db.dados.commissions.c1.crm_paga_enviada_em);
  assert.equal(a.db.dados.commissions.c1.crm_aguardando_paga, false);
});

test('COMISSÃO: corrigida depois do envio, reenvia "comissao" atualizada (mesmo id_externo e pedido)', async () => {
  const a = ambEnviar(ENV_ON, { ind1: INDV() }, { commissions: { c1: COM() } });
  await rodarComissoesCrm(a.deps);
  a.db.dados.commissions.c1.value = 3000; a.db.dados.commissions.c1.rate_applied = 3;
  await rodarComissoesCrm(a.deps);
  assert.equal(a.chamadas.length, 2);
  assert.equal(a.chamadas[1].corpo.valor_comissao, 3000); assert.equal(a.chamadas[1].corpo.percentual, 3);
  assert.equal(a.chamadas[1].corpo.id_externo, a.chamadas[0].corpo.id_externo); assert.equal(a.chamadas[1].corpo.pedido_numero, a.chamadas[0].corpo.pedido_numero);
});

test('COMISSÃO: sem número de pedido espera; indicação que nunca foi ao CRM recebe crm_nao_aplica_em e não é lida de novo', async () => {
  const a = ambEnviar(ENV_ON, { ind1: ind({ status: 'sold', sale_order_number: '' }) }, { commissions: { c1: COM() } });
  await rodarComissoesCrm(a.deps);
  assert.equal(a.chamadas.length, 0); assert.equal(a.db.dados.commissions.c1.crm_enviado_em, undefined); assert.equal(a.db.dados.commissions.c1.crm_comissao_enviada_em, undefined);
  a.db.dados.indications.ind1.sale_order_number = 'PV-1';
  await rodarComissoesCrm(a.deps);
  assert.equal(a.chamadas.length, 1, 'quando o pedido chega, envia');
  const b = ambEnviar(ENV_ON, { ind1: ind({ crm_enviado_em: undefined, status: 'sold', sale_order_number: 'PV-1' }) }, { commissions: { c1: COM() } });
  await rodarComissoesCrm(b.deps);
  assert.equal(b.chamadas.length, 0); assert.ok(b.db.dados.commissions.c1.crm_nao_aplica_em);
});

test('COMISSÃO: com mais de 300 comissões as mais NOVAS são lidas primeiro; "paga" antiga é achada pela marca, sem janela de dias', async () => {
  const com: Record<string, any> = {};
  for (let k = 0; k < 320; k++) com[`x${k}`] = COM({ indication_id: 'ind1', crm_nao_aplica_em: 'x', created_at: `2026-0${1 + (k % 9)}-${String(10 + (k % 18))}T00:00:00Z` });
  com.nova = COM({ created_at: '2026-10-28T12:00:00Z', value: 2000 });
  com.antigaPaga = COM({ created_at: '2025-01-05T12:00:00Z', status: 'paid', updated_at: '2025-02-06T10:00:00Z', crm_comissao_enviada_em: '2025-01-06T00:00:00Z', crm_aguardando_paga: true });
  const a = ambEnviar(ENV_ON, { ind1: INDV() }, { commissions: com });
  await rodarComissoesCrm(a.deps);
  assert.deepEqual(a.chamadas.map(c => c.corpo.tipo).sort(), ['comissao', 'comissao_paga']);
});

test('COMISSÃO: 5xx faz backoff sem contar tentativa e a "paga" espera a "comissao"', async () => {
  const b = ambEnviar(ENV_ON, { ind1: INDV() }, { commissions: { c1: COM({ status: 'paid' }) } }, [{ status: 500 }, { status: 200 }]);
  await rodarComissoesCrm(b.deps);
  assert.equal(b.chamadas.length, 1, 'a paga não passa na frente da comissao que falhou');
  assert.equal(b.db.dados.commissions.c1.crm_comissao_transporte, 1);
  assert.equal(b.db.dados.commissions.c1.crm_comissao_tentativas, undefined, '5xx não conta tentativa');
  await rodarComissoesCrm(b.deps);
  assert.equal(b.chamadas.length, 1, 'backoff');
  b.avancar(2 * 60 * 1000);
  await rodarComissoesCrm(b.deps);
  assert.deepEqual(b.chamadas.map(c => c.corpo.tipo), ['comissao', 'comissao', 'comissao_paga']);
});

test('MENSAGEM: só vale como vendedora se começar com "Em atendimento por"; senão texto genérico', async () => {
  const a = ambReceber(ind({ status: 'pending' }));
  await a.enviar(base('indicacao.aceita', { mensagem: 'Cliente de Sinop, fale com Carlos Silva' }));
  assert.equal(a.get().internal_seller_name, undefined);
  assert.deepEqual(textos(a), ['Em atendimento']);
  const b = ambReceber(ind({ status: 'pending' }));
  await b.enviar(base('indicacao.aceita', { mensagem: 'Em atendimento por Heloisa Laira', dados: { vendedora: 'Fulana Nova' } }));
  assert.equal(b.get().internal_seller_name, 'Fulana Nova', 'dados.vendedora prevalece');
});

test('COMISSÃO: nascida já paga fica com crm_aguardando_paga até a "paga" ir; 401/429/5xx nunca fazem desistir', async () => {
  const a = ambEnviar(ENV_ON, { ind1: INDV() }, { commissions: { c1: COM({ status: 'paid', updated_at: '2026-11-06T10:00:00Z' }) } }, [{ status: 200 }, { status: 500 }]);
  await rodarComissoesCrm(a.deps);
  assert.deepEqual(a.chamadas.map(c => c.corpo.tipo), ['comissao', 'comissao_paga']);
  assert.equal(a.db.dados.commissions.c1.crm_aguardando_paga, true, 'enquanto a paga falhou');
  for (const status of [401, 403, 429, 502]) {
    const b = ambEnviar(ENV_ON, { ind1: INDV() }, { commissions: { c1: COM() } }, [{ status }]);
    for (let k = 0; k < 15; k++) { await rodarComissoesCrm(b.deps); b.avancar(7 * 60 * 60 * 1000); }
    assert.equal(b.chamadas.length, 15, String(status));
    assert.equal(b.db.dados.commissions.c1.crm_desistiu_em, undefined);
  }
  const c = ambEnviar(ENV_ON, { ind1: INDV() }, { commissions: { c1: COM() } }, [{ status: 422 }]);
  for (let k = 0; k < 15; k++) { await rodarComissoesCrm(c.deps); c.avancar(7 * 60 * 60 * 1000); }
  assert.equal(c.chamadas.length, 10); assert.ok(c.db.dados.commissions.c1.crm_desistiu_em);
});

test('COMISSÃO: pedido_numero que muda depois do envio NÃO duplica no CRM: reenvia com o número do primeiro envio e registra a divergência', async () => {
  const a = ambEnviar(ENV_ON, { ind1: INDV() }, { commissions: { c1: COM() } });
  await rodarComissoesCrm(a.deps);
  a.db.dados.indications.ind1.sale_order_number = 'PV-88';
  a.db.dados.commissions.c1.value = 2500; a.db.dados.commissions.c1.base_value_used = 125000;
  await rodarComissoesCrm(a.deps);
  assert.equal(a.chamadas.length, 2);
  assert.equal(a.chamadas[1].corpo.pedido_numero, 'PV-77');
  assert.equal(a.chamadas[1].corpo.valor_comissao, 2500);
  const hist = a.db.dados.indications.ind1.negotiation_history as any[];
  assert.equal(hist.filter(h => /número do pedido mudou para PV-88/.test(h.content)).length, 1);
  await rodarComissoesCrm(a.deps);
  assert.equal((a.db.dados.indications.ind1.negotiation_history as any[]).length, hist.length, 'registra uma vez só');
  assert.equal(a.chamadas.length, 2);
  a.db.dados.commissions.c1.status = 'paid'; a.db.dados.commissions.c1.updated_at = '2026-11-06T10:00:00Z';
  await rodarComissoesCrm(a.deps);
  assert.equal(a.chamadas[2].corpo.pedido_numero, 'PV-77', 'a "paga" também usa o número conhecido pelo CRM');
});
