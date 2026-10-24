// Envio ao CRM: payload, seleção, backoff, interruptor, laço e carga inicial.
// Rodar: node --import tsx --test testes-servidor/crm-integracao.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  lerConfigCrm, montarPayloadIndicacao, motivoNaoEnviarNoLaco, motivoNaoEnviarNaCarga, atrasoDaTentativa, planoDeFalha, MAX_TENTATIVAS_ENVIO,
  separarCidadeUf, triagemEhDoCrm, podeEnviarAoCrm, CRM_URL_PADRAO,
} from '../src/lib/crmIntegracao.ts';
import { rodarFilaCrm, rodarAtualizacoesCrm, rodarComissoesCrm, cargaInicialCrm, enviarIndicacaoAoCrm, listarCandidatasDoLaco } from '../server/crmEntrada.ts';
import { bancoFalsoCrm } from './fixtures/bancoFalsoCrm.ts';

const AGORA = new Date('2026-10-27T15:00:00Z');
const DESDE = '2026-10-26T10:00:00.000Z';
const CHAVE_TESTE = 'chave-de-teste-123';

const indBase = (o: any = {}) => ({
  client_name: 'Fazenda Boa Vista', client_person_name: 'João Silva', client_cnpj: '12.345.678/0001-90', client_phone: '(66) 99999-0000',
  client_email: 'joao@fazenda.com', client_location: 'Sinop - MT', base_machine: 'Escavadeira CAT 320', description: 'Quer um triturador',
  items: [{ product_name: 'Triturador FAE', quantity: 1 }], status: 'pending', external_seller_uid: 'p1', external_seller_name: 'Maria Parceira',
  created_at: '2026-10-27T14:00:00.000Z', ...o,
});

test('CONFIG: sem nada configurado está desligado e usa a URL padrão; CRM_URL e a data da virada vêm do ambiente', () => {
  const c = lerConfigCrm({});
  assert.equal(c.ativo, false); assert.equal(c.url, CRM_URL_PADRAO); assert.equal(podeEnviarAoCrm(c), false);
  assert.equal(lerConfigCrm({ CRM_ATIVO: '1' }).ativo, true);
  assert.equal(podeEnviarAoCrm(lerConfigCrm({ CRM_ATIVO: '1' })), false, 'ligado sem chave não envia');
  assert.equal(lerConfigCrm({ CRM_ATIVO: 'true' }).ativo, false, 'só "1" liga');
  assert.equal(lerConfigCrm({ CRM_URL: 'http://evil.example.com/x' }).urlValida, false);
  assert.equal(lerConfigCrm({ CRM_URL: 'http://localhost:9999/x' }).urlValida, true);
  assert.equal(lerConfigCrm({ CRM_ATIVO_DESDE: DESDE }).ativoDesde, DESDE);
  assert.equal(lerConfigCrm({}, { ativo_desde: DESDE }).ativoDesde, DESDE);
});

test('PAYLOAD: campos do contrato, parceiro.id = uid, sem segredos', () => {
  const p = montarPayloadIndicacao(indBase(), 'ind1', { name: 'Maria Parceira', phone: '66988887777', email: 'maria@x.com' }, { notificarEmail: 'luana@roderbrasil.com.br' });
  assert.deepEqual(Object.keys(p).sort(), ['cidade', 'cnpj', 'criado_em', 'email', 'empresa', 'id_externo', 'nome', 'notificar_email', 'observacao', 'parceiro', 'produto', 'telefone', 'uf'].sort());
  assert.equal(p.id_externo, 'ind1');
  assert.equal(p.nome, 'João Silva'); assert.equal(p.empresa, 'Fazenda Boa Vista');
  assert.equal(p.cnpj, '12345678000190');
  assert.equal(p.cidade, 'Sinop'); assert.equal(p.uf, 'MT');
  assert.equal(p.produto, 'Triturador FAE');
  assert.deepEqual(p.parceiro, { id: 'p1', nome: 'Maria Parceira', telefone: '66988887777', email: 'maria@x.com' });
  assert.equal(p.criado_em, '2026-10-27T14:00:00.000Z');
  assert.match(p.observacao, /Quer um triturador/); assert.match(p.observacao, /Escavadeira CAT 320/);
  const json = JSON.stringify(p);
  for (const proibido of ['chave', 'segredo', 'commission', 'comiss', 'password', 'initial_password', 'pix']) assert.equal(json.toLowerCase().includes(proibido), false, proibido);
  // sem notificar_email por padrão
  assert.equal('notificar_email' in montarPayloadIndicacao(indBase(), 'x', null), false);
});

test('PAYLOAD: "Não informado" vira vazio, cidade sem UF, produto cai para a máquina base, carga avisa que já estava em negociação', () => {
  const p = montarPayloadIndicacao(indBase({ client_cnpj: 'Não informado', client_phone: 'Não informado', client_location: 'Sorriso', items: [], client_person_name: undefined, status: 'negotiating', internal_seller_name: 'Heloisa' }), 'i2', null, { jaEmNegociacao: true });
  assert.equal(p.cnpj, ''); assert.equal(p.telefone, ''); assert.equal(p.cidade, 'Sorriso'); assert.equal(p.uf, '');
  assert.equal(p.nome, 'Fazenda Boa Vista');
  assert.equal(p.produto, 'Escavadeira CAT 320');
  assert.match(p.observacao, /^\[Já estava em negociação no Roder Indica com Heloisa\]/);
  assert.deepEqual(separarCidadeUf('Cuiabá - MT'), { cidade: 'Cuiabá', uf: 'MT' });
});

test('SELEÇÃO do laço: só aberta, criada depois da virada, ainda não enviada e fora do backoff', () => {
  const o = { ativoDesde: DESDE, agora: AGORA };
  assert.equal(motivoNaoEnviarNoLaco(indBase(), o), null);
  assert.equal(motivoNaoEnviarNoLaco(indBase({ status: 'triagem' }), o), null);
  assert.equal(motivoNaoEnviarNoLaco(indBase({ status: 'negotiating' }), o), null);
  assert.equal(motivoNaoEnviarNoLaco(indBase({ crm_enviado_em: '2026-10-27T14:01:00Z' }), o), 'ja_enviada');
  for (const status of ['sold', 'cancelled', 'archived', 'new']) assert.equal(motivoNaoEnviarNoLaco(indBase({ status }), o), 'status_nao_envia', status);
  // pending/triagem vão como indicação nova de QUALQUER idade; só a negotiating respeita o corte (as antigas são da carga)
  assert.equal(motivoNaoEnviarNoLaco(indBase({ created_at: '2026-10-20T10:00:00Z' }), o), null);
  assert.equal(motivoNaoEnviarNoLaco(indBase({ status: 'triagem', created_at: '2020-01-01T00:00:00Z' }), o), null);
  // pending que virou negotiating antes de ser enviada ainda vai (com a nota "Já estava em negociação"), de qualquer idade
  assert.equal(motivoNaoEnviarNoLaco(indBase({ status: 'negotiating', created_at: '2026-10-20T10:00:00Z' }), o), null);
  assert.equal(motivoNaoEnviarNoLaco(indBase({ status: 'negotiating', created_at: undefined }), o), null);
  assert.equal(motivoNaoEnviarNoLaco(indBase({ status: 'negotiating', crm_enviado_em: 'x' }), o), 'ja_enviada');
  assert.equal(motivoNaoEnviarNoLaco(indBase({ crm_proxima_tentativa_em: '2026-10-27T15:10:00Z' }), o), 'aguardando_nova_tentativa');
  assert.equal(motivoNaoEnviarNoLaco(indBase({ crm_proxima_tentativa_em: '2026-10-27T14:50:00Z' }), o), null);
  assert.equal(motivoNaoEnviarNoLaco(indBase({ crm_reservado_ate: '2026-10-27T15:02:00Z' }), o), 'reservada');
  assert.equal(motivoNaoEnviarNoLaco(indBase({ crm_desistiu_em: '2026-10-27T14:59:00Z' }), o), 'desistiu');
  assert.equal(motivoNaoEnviarNoLaco(indBase({ creator_type: 'visitor' }), o), 'conversa_do_consultor');
  assert.equal(motivoNaoEnviarNoLaco(indBase({ client_name: '  ' }), o), 'sem_cliente');
});

test('SELEÇÃO da carga: só as em negociação, de qualquer data; pending e triagem vão como novas; nunca vendidas nem já enviadas', () => {
  const o = { agora: AGORA };
  assert.equal(motivoNaoEnviarNaCarga(indBase({ status: 'negotiating', created_at: '2025-01-01T00:00:00Z' }), o), null);
  assert.equal(motivoNaoEnviarNaCarga(indBase({ created_at: '2025-01-01T00:00:00Z' }), o), 'vai_como_nova');
  assert.equal(motivoNaoEnviarNaCarga(indBase({ status: 'triagem' }), o), 'vai_como_nova');
  assert.equal(motivoNaoEnviarNaCarga(indBase({ status: 'sold' }), o), 'status_nao_envia');
  assert.equal(motivoNaoEnviarNaCarga(indBase({ crm_enviado_em: 'x' }), o), 'ja_enviada');
});

test('BACKOFF exponencial com teto e limite de tentativas', () => {
  assert.deepEqual([1, 2, 3, 4].map(atrasoDaTentativa), [60000, 120000, 240000, 480000]);
  assert.equal(atrasoDaTentativa(30), 6 * 60 * 60 * 1000);
  const f1 = planoDeFalha(0, AGORA);
  assert.equal(f1.tentativas, 1); assert.equal(f1.desistiu, false); assert.equal(f1.proxima, new Date(AGORA.getTime() + 60000).toISOString());
  const ultima = planoDeFalha(MAX_TENTATIVAS_ENVIO - 1, AGORA);
  assert.equal(ultima.desistiu, true); assert.equal(ultima.proxima, null);
});

test('TRIAGEM do robô: com o CRM ligado não atribui NADA que o laço ainda vai mandar (qualquer idade); se o envio desistir, volta a assumir', () => {
  const ligado = { ativo: true, chave: 'k', urlValida: true };
  assert.equal(triagemEhDoCrm(indBase(), { ...ligado, ativo: false }), false);
  assert.equal(triagemEhDoCrm(indBase({ crm_enviado_em: 'x', created_at: '2026-01-01T00:00:00Z' }), ligado), true);
  assert.equal(triagemEhDoCrm(indBase(), ligado), true, 'nova e ainda na fila de envio');
  assert.equal(triagemEhDoCrm(indBase({ created_at: '2026-01-01T00:00:00Z' }), ligado), true, 'antiga ainda não enviada: o laço vai mandar');
  assert.equal(triagemEhDoCrm(indBase({ status: 'triagem', created_at: '2020-01-01T00:00:00Z' }), ligado), true);
  assert.equal(triagemEhDoCrm(indBase({ crm_desistiu_em: 'x' }), ligado), false, 'o envio desistiu: o robô assume');
  assert.equal(triagemEhDoCrm(indBase({ creator_type: 'visitor' }), ligado), false, 'o laço nunca envia esta: o robô cuida');
  assert.equal(triagemEhDoCrm(indBase(), { ...ligado, chave: '' }), false, 'sem chave o laço não envia: não segura a triagem');
});

// ---------- Laço e carga com fetch falso ----------
function ambiente(env: Record<string, string>, ind: Record<string, any>, respostas: Array<{ status: number; corpo?: any } | Error>) {
  const db = bancoFalsoCrm({ indications: ind, users: { p1: { name: 'Maria Parceira', phone: '66988887777', email: 'maria@x.com', role: 'external_seller' } } });
  const chamadas: { url: string; init: any }[] = [];
  let i = 0;
  const fetchFn = async (url: string, init: any) => {
    chamadas.push({ url, init });
    const r = respostas[Math.min(i++, respostas.length - 1)];
    if (r instanceof Error) throw r;
    return { ok: r.status < 300, status: r.status, text: async () => JSON.stringify(r.corpo ?? { ok: true, id: 'crm-' + i }) };
  };
  let agora = AGORA;
  const deps = { db, config: () => lerConfigCrm(env), fetchFn, agora: () => agora, log: () => {} };
  return { db, deps, chamadas, avancar: (ms: number) => { agora = new Date(agora.getTime() + ms); } };
}
const ENV = { CRM_ATIVO: '1', CRM_CHAVE: CHAVE_TESTE, CRM_URL: 'http://localhost:9/crm', CRM_ATIVO_DESDE: DESDE };

test('INTERRUPTOR DESLIGADO: o laço e as rotinas da fase 2 não enviam nada; a carga só exige a chave', async () => {
  const sem = ambiente({}, { i1: indBase({ status: 'negotiating' }) }, [{ status: 200 }]);
  const c0: any = await cargaInicialCrm(sem.deps, {});
  assert.equal(c0.ok, false); assert.equal(sem.chamadas.length, 0, 'sem chave a carga não envia');
  const a = ambiente({ CRM_CHAVE: CHAVE_TESTE, CRM_URL: 'http://localhost:9/crm' }, { i1: indBase({ status: 'negotiating' }) }, [{ status: 200 }]);
  assert.equal((await rodarFilaCrm(a.deps)).pulado, 'integracao_desligada');
  assert.equal((await rodarAtualizacoesCrm(a.deps)).pulado, 'integracao_desligada');
  assert.equal((await rodarComissoesCrm(a.deps)).pulado, 'integracao_desligada');
  assert.equal(a.chamadas.length, 0);
  assert.deepEqual(Object.keys(a.db.dados.indications.i1).filter(k => k.startsWith('crm_')), []);
  const s: any = await cargaInicialCrm(a.deps, { simulacao: true });
  assert.equal(s.elegiveis, 1); assert.equal(a.chamadas.length, 0);
  // com a chave, a carga roda mesmo com CRM_ATIVO desligado, e grava o corte
  const c: any = await cargaInicialCrm(a.deps, {});
  assert.equal(c.enviadas, 1); assert.equal(a.chamadas.length, 1);
  assert.equal(JSON.parse(a.chamadas[0].init.body).tipo, 'carga_inicial');
  assert.equal(a.db.dados.settings.crm_integracao.carga_inicial_em, AGORA.toISOString());
});

test('LAÇO: envia a nova com a chave no cabeçalho e marca crm_enviado_em/crm_id; a segunda rodada não reenvia', async () => {
  const a = ambiente(ENV, { i1: indBase(), velha: indBase({ status: 'negotiating', created_at: '2026-10-01T00:00:00Z' }), vendida: indBase({ status: 'sold' }) }, [{ status: 200, corpo: { ok: true, id: 'crm-77' } }]);
  const r = await rodarFilaCrm(a.deps);
  assert.deepEqual(r.resultados.map(x => [x.id, x.resultado]).sort(), [['i1', 'enviada'], ['velha', 'enviada']]);
  assert.equal(a.chamadas.length, 2);
  assert.equal(a.chamadas[0].url, 'http://localhost:9/crm');
  assert.equal(a.chamadas[0].init.headers['x-roder-chave'], CHAVE_TESTE);
  const corpo = a.chamadas.map(c => JSON.parse(c.init.body)).find(c => c.id_externo === 'i1');
  assert.equal(corpo.id_externo, 'i1'); assert.equal(corpo.parceiro.id, 'p1'); assert.equal(corpo.parceiro.email, 'maria@x.com');
  assert.equal(a.db.dados.indications.i1.crm_id, 'crm-77');
  assert.ok(a.db.dados.indications.i1.crm_enviado_em);
  assert.match(JSON.parse(a.chamadas.find(c => JSON.parse(c.init.body).id_externo === 'velha')!.init.body).observacao, /Já estava em negociação/);
  await rodarFilaCrm(a.deps);
  assert.equal(a.chamadas.length, 2, 'não duplica');
});

test('LAÇO: 5xx, 401, 403 e 429 só reagendam com backoff: não contam tentativa nem desistem, mesmo após dezenas de rodadas; nunca grava a chave', async () => {
  for (const status of [500, 401, 403, 429]) {
    const a = ambiente(ENV, { i1: indBase() }, [{ status, corpo: { erro: `eco ${CHAVE_TESTE}` } }]);
    const r = await rodarFilaCrm(a.deps);
    assert.equal(r.resultados[0].resultado, 'falhou');
    assert.equal(a.db.dados.indications.i1.crm_tentativas, undefined);
    assert.equal(a.db.dados.indications.i1.crm_falhas_transporte, 1);
    assert.equal(a.db.dados.indications.i1.crm_ultimo_erro, `HTTP ${status}`);
    assert.equal(JSON.stringify(a.db.dados).includes(CHAVE_TESTE), false);
    await rodarFilaCrm(a.deps);
    assert.equal(a.chamadas.length, 1, 'ainda dentro do backoff');
    for (let n = 0; n < 30; n++) { a.avancar(7 * 60 * 60 * 1000); await rodarFilaCrm(a.deps); }
    assert.equal(a.db.dados.indications.i1.crm_desistiu_em, undefined, `${status} nunca desiste`);
    assert.equal(a.db.dados.indications.i1.crm_tentativas, undefined);
    assert.equal(a.chamadas.length, 31);
    // o card Admin enxerga o problema, sem segredo
    const alerta = a.db.dados.settings.crm_integracao.alerta_transporte;
    assert.ok(alerta && alerta.seguidas >= 31);
    assert.match(alerta.motivo, status === 401 || status === 403 ? /recusou a chave/ : /problema|Sem conexão/);
    assert.equal(JSON.stringify(a.db.dados.settings).includes(CHAVE_TESTE), false);
  }
});

test('LAÇO: só a rejeição de validação (4xx diferente de 401/403/429) conta tentativa e depois de 10 desiste; o alerta de transporte some quando volta', async () => {
  const a = ambiente(ENV, { i1: indBase() }, [{ status: 422 }]);
  await rodarFilaCrm(a.deps);
  assert.equal(a.db.dados.indications.i1.crm_tentativas, 1);
  for (let n = 0; n < 20; n++) { a.avancar(7 * 60 * 60 * 1000); await rodarFilaCrm(a.deps); }
  assert.equal(a.db.dados.indications.i1.crm_tentativas, MAX_TENTATIVAS_ENVIO);
  assert.ok(a.db.dados.indications.i1.crm_desistiu_em);
  assert.equal(a.chamadas.length, MAX_TENTATIVAS_ENVIO);
  const b = ambiente(ENV, { i1: indBase() }, [{ status: 503 }, { status: 200 }]);
  await rodarFilaCrm(b.deps);
  assert.ok(b.db.dados.settings.crm_integracao.alerta_transporte);
  b.avancar(2 * 60 * 1000);
  await rodarFilaCrm(b.deps);
  assert.equal(b.db.dados.settings.crm_integracao.alerta_transporte, null);
});

test('E-MAIL NA VIRADA: notificar_email só vai na indicação criada em ou depois de ativo_desde; antigas e sobras vão sem aviso', async () => {
  const env = { ...ENV, CRM_NOTIFICAR_EMAIL: 'luana@roderbrasil.com.br' };
  const a = ambiente(env, {
    nova: indBase({ created_at: '2026-10-27T14:00:00Z' }),
    antiga: indBase({ created_at: '2026-08-01T00:00:00Z' }),
    antigaTriagem: indBase({ status: 'triagem', created_at: '2026-01-01T00:00:00Z' }),
    virou: indBase({ status: 'negotiating', created_at: '2026-09-01T00:00:00Z' }),
  }, [{ status: 200 }]);
  await rodarFilaCrm(a.deps);
  const por = Object.fromEntries(a.chamadas.map(c => { const j = JSON.parse(c.init.body); return [j.id_externo, j]; }));
  assert.equal(por.nova.notificar_email, 'luana@roderbrasil.com.br');
  for (const id of ['antiga', 'antigaTriagem', 'virou']) assert.equal('notificar_email' in por[id], false, id);
  assert.match(por.virou.observacao, /Já estava em negociação/);
});

test('LAÇO: erro de rede também entra no backoff e depois um 2xx envia (sem duplicar)', async () => {
  const a = ambiente(ENV, { i1: indBase() }, [new Error('ECONNRESET'), { status: 201, corpo: { ok: true, id: 'c1' } }]);
  assert.equal((await rodarFilaCrm(a.deps)).resultados[0].resultado, 'falhou');
  a.avancar(61 * 1000);
  assert.equal((await rodarFilaCrm(a.deps)).resultados[0].resultado, 'enviada');
  assert.equal(a.db.dados.indications.i1.crm_ultimo_erro, null);
});

test('RESERVA: indicação reservada por outro processo não é enviada duas vezes', async () => {
  const a = ambiente(ENV, { i1: indBase({ crm_reservado_ate: '2026-10-27T15:02:00.000Z' }) }, [{ status: 200 }]);
  const r = await enviarIndicacaoAoCrm(a.deps, 'i1', { modo: 'laco', ativoDesde: DESDE });
  assert.equal(r.resultado, 'pulada'); assert.equal(r.motivo, 'reservada'); assert.equal(a.chamadas.length, 0);
});

test('CONSULTA SEM ÍNDICE COMPOSTO: acha indicação sem nenhum campo crm_* (campo ausente) filtrando em memória', async () => {
  const a = ambiente(ENV, { i1: indBase(), i2: indBase({ crm_enviado_em: 'x' }) }, [{ status: 200 }]);
  const lista = await listarCandidatasDoLaco(a.db, DESDE, AGORA);
  assert.deepEqual(lista.map(x => x.id), ['i1']);
});

test('DATA DA VIRADA: sem env nem settings, o laço grava o momento da primeira rodada uma vez e não muda depois', async () => {
  const env = { CRM_ATIVO: '1', CRM_CHAVE: CHAVE_TESTE, CRM_URL: 'http://localhost:9/crm' };
  const a = ambiente(env, { antiga: indBase({ status: 'negotiating', created_at: '2026-10-20T00:00:00Z' }) }, [{ status: 200 }]);
  await rodarFilaCrm(a.deps);
  assert.equal(a.chamadas.length, 1, 'a em negociação ainda não enviada vai com a nota, mesmo anterior à virada');
  assert.equal(a.db.dados.settings.crm_integracao.ativo_desde, AGORA.toISOString());
  a.avancar(3600 * 1000);
  await rodarFilaCrm(a.deps);
  assert.equal(a.db.dados.settings.crm_integracao.ativo_desde, AGORA.toISOString(), 'não muda depois');
});

test('CARGA INICIAL: só as em negociação, em lote; pending e triagem ficam para o laço; vendidas fora; idempotente', async () => {
  const neg = (o: any = {}) => indBase({ status: 'negotiating', internal_seller_name: 'Heloisa', ...o });
  const ind = {
    a: neg({ created_at: '2026-09-01T00:00:00Z' }), b: neg({ created_at: '2026-09-02T00:00:00Z' }), c: neg({ created_at: '2026-09-03T00:00:00Z' }),
    p: indBase({ created_at: '2026-09-04T00:00:00Z' }), t: indBase({ status: 'triagem', created_at: '2026-09-05T00:00:00Z' }),
    v: indBase({ status: 'sold' }), x: indBase({ status: 'cancelled' }), ja: neg({ crm_enviado_em: 'x' }),
  };
  const a = ambiente(ENV, ind, [{ status: 200 }]);
  const sim: any = await cargaInicialCrm(a.deps, { simulacao: true });
  assert.equal(sim.elegiveis, 3); assert.deepEqual(sim.por_status, { negotiating: 3 }); assert.equal(sim.pendentes_novas, 2);
  assert.equal(a.chamadas.length, 0);
  const lote1: any = await cargaInicialCrm(a.deps, { limite: 2 });
  assert.equal(lote1.enviadas, 2); assert.equal(lote1.restantes, 1);
  const lote2: any = await cargaInicialCrm(a.deps, {});
  assert.equal(lote2.enviadas, 1); assert.equal(lote2.restantes, 0);
  const lote3: any = await cargaInicialCrm(a.deps, {});
  assert.equal(lote3.elegiveis, 0);
  assert.equal(a.chamadas.length, 2, 'dois POSTs em lote (2 + 1)');
  const corpos = a.chamadas.map(c => JSON.parse(c.init.body));
  assert.ok(corpos.every(c => c.tipo === 'carga_inicial' && Array.isArray(c.itens)));
  const enviados = corpos.flatMap(c => c.itens);
  assert.equal(enviados.length, 3);
  assert.ok(enviados.every(e => /Já estava em negociação/.test(e.observacao) && !e.notificar_email));
  assert.equal(a.db.dados.indications.p.crm_enviado_em, undefined);
});
