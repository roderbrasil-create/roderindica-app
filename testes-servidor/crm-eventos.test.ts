// Eventos do CRM -> Indica: cada evento vira o efeito certo, idempotência, comissão congelada e conferência.
// Rodar: node --import tsx --test testes-servidor/crm-eventos.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { processarEventoCrm } from '../server/crmEventos.ts';
import { lerConfigCrm } from '../src/lib/crmIntegracao.ts';
import { planejarEvento, textoSeguroParaParceiro, MOTIVO_GENERICO_RECUSA, MOTIVO_GENERICO_PERDA } from '../src/lib/crmEventos.ts';
import { classificarItem, normalizarItensCrm, numeroDoCrm, diaDoCrm } from '../src/lib/crmFaturamento.ts';
import { calcularComissao, mesDaComissao } from '../src/lib/calculoComissao.ts';
import { bancoFalsoCrm, arrayUnionFalso } from './fixtures/bancoFalsoCrm.ts';

const AGORA = new Date('2026-10-28T15:00:00Z');
let seq = 0;
const ev = (evento: string, dados: any = {}, extra: any = {}) => ({ id: `ev${++seq}`, evento, em: '2026-10-28T14:00:00Z', id_externo: 'ind1', parceiro_id: 'p1', dados, ...extra });

const USUARIOS = {
  p1: { name: 'Maria Parceira', role: 'external_seller', commission_rate: 3, status: 'active', email: 'maria@x.com' },
  p2: { name: 'Carlos Concorrente', role: 'external_seller', status: 'active' },
  v1: { name: 'Heloisa Laira', role: 'internal_seller', email: 'heloisa@roderbrasil.com.br', status: 'active' },
  adm: { name: 'Jeferson', role: 'admin', status: 'active' },
  fin: { name: 'Financeiro', role: 'financial', status: 'active' },
};
const ind = (o: any = {}) => ({
  client_name: 'Fazenda Boa Vista', status: 'pending', external_seller_uid: 'p1', external_seller_name: 'Maria Parceira',
  created_at: '2026-10-27T10:00:00Z', protection_expires_at: '2026-12-26T10:00:00Z', negotiation_history: [], ...o,
});
function amb(indicacao: any = ind(), extra: Record<string, Record<string, any>> = {}) {
  const db = bancoFalsoCrm({ indications: { ind1: indicacao }, users: USUARIOS, ...extra });
  const deps = { db, arrayUnion: arrayUnionFalso, config: () => lerConfigCrm({ CRM_ATIVO: '1', CRM_SEGREDO: 's' }), agora: () => AGORA, log: () => {} };
  const rodar = (e: any) => processarEventoCrm(deps, e);
  return { db, deps, rodar, get: () => db.dados.indications.ind1, notificacoes: () => Object.values(db.dados.notifications || {}) as any[] };
}
const textos = (a: any) => (a.get().negotiation_history as any[]).map(h => h.content);

test('RECEBIDA: só registra no histórico, não muda status', async () => {
  const a = amb();
  const r = await a.rodar(ev('indicacao.recebida'));
  assert.equal(r.body.resultado, 'aplicado');
  assert.equal(a.get().status, 'pending');
  assert.deepEqual(textos(a), ['Indicação recebida']);
  assert.equal(a.get().negotiation_history[0].author_name, 'CRM Roder');
  assert.equal(a.get().negotiation_history[0].created_at, '2026-10-28T14:00:00.000Z');
  assert.equal(a.notificacoes().length, 0);
});

test('ACEITA: vira negotiating com a vendedora (cadastro casado pelo e-mail), mantém a proteção, avisa vendedora e parceiro', async () => {
  const a = amb();
  await a.rodar(ev('indicacao.aceita', { vendedora: { nome: 'Heloisa', email: 'heloisa@roderbrasil.com.br' } }));
  const i = a.get();
  assert.equal(i.status, 'negotiating');
  assert.equal(i.internal_seller_uid, 'v1'); assert.equal(i.internal_seller_name, 'Heloisa Laira'); assert.equal(i.internal_seller_email, 'heloisa@roderbrasil.com.br');
  assert.equal(i.duplicate_reviewed, true);
  assert.equal(i.protection_expires_at, '2026-12-26T10:00:00Z', 'a proteção da criação não é mexida');
  assert.deepEqual(textos(a), ['Em atendimento por Heloisa Laira']);
  const n = a.notificacoes();
  assert.deepEqual(n.map(x => x.user_uid).sort(), ['p1', 'v1']);
  assert.ok(n.find(x => x.user_uid === 'p1').message.includes('Heloisa Laira'));
});

test('ACEITA: sem proteção gravada, nasce com 60 dias; vendedora sem cadastro vale só pelo nome e não vira dona', async () => {
  const a = amb(ind({ protection_expires_at: undefined }));
  await a.rodar(ev('indicacao.aceita', { vendedora: 'Fulana Nova' }));
  assert.equal(a.get().internal_seller_name, 'Fulana Nova');
  assert.equal(a.get().internal_seller_uid, undefined);
  assert.equal(a.get().protection_expires_at, new Date(AGORA.getTime() + 60 * 86400000).toISOString());
});

test('NÃO REGRIDE: aceita/recusada/vinculada depois de vendida ou cancelada só vão para o log', async () => {
  for (const status of ['sold', 'cancelled', 'archived']) {
    const a = amb(ind({ status }));
    for (const e of ['indicacao.aceita', 'indicacao.recusada', 'indicacao.vinculada', 'negocio.perdido', 'proposta.enviada']) {
      const r = await a.rodar(ev(e, { motivo: 'x', vendedora: 'Heloisa Laira' }));
      assert.equal(r.body.resultado, 'ignorado', `${status} ${e}`);
    }
    assert.equal(a.get().status, status);
    assert.deepEqual(a.get().negotiation_history, []);
    assert.equal(a.notificacoes().length, 0);
  }
  const b = amb(ind({ status: 'negotiating' }));
  assert.equal((await b.rodar(ev('indicacao.recusada', { motivo: 'x' }))).body.resultado, 'ignorado');
  assert.equal(b.get().status, 'negotiating');
});

test('RECUSADA: arquiva como a Triagem, com motivo curto e notificação; log guarda o motivo do ignorado', async () => {
  const a = amb();
  await a.rodar(ev('indicacao.recusada', { motivo: 'Cliente fora da área de atendimento' }));
  assert.equal(a.get().status, 'archived');
  assert.equal(a.get().cancellation_details, 'Cliente fora da área de atendimento');
  assert.deepEqual(textos(a), ['Indicação recusada: Cliente fora da área de atendimento']);
  assert.equal(a.notificacoes()[0].user_uid, 'p1');
  assert.match(a.notificacoes()[0].message, /fora da área/);
});

test('NUNCA cita outro parceiro: palavras como parceiro/indicado por e o nome de outro parceiro viram texto genérico', async () => {
  const casos = ['Já indicado pelo parceiro Carlos', 'Cliente já foi indicado por outra pessoa', 'indicação de Carlos Concorrente', 'Carlos Concorrente já negocia', 'Falar com o representante João', 'ligue 66999991234', 'Comissão de 3%'];
  for (const motivo of casos) {
    const a = amb();
    await a.rodar(ev('indicacao.recusada', { motivo }));
    const gravado = JSON.stringify(a.db.dados.indications.ind1) + JSON.stringify(a.notificacoes());
    assert.ok(gravado.includes(MOTIVO_GENERICO_RECUSA), motivo);
    assert.equal(/Carlos|parceiro Carlos|66999991234|3%/i.test(gravado.replace(/Maria Parceira/g, '')), false, motivo);
  }
  // perdido idem
  const b = amb(ind({ status: 'negotiating' }));
  await b.rodar(ev('negocio.perdido', { motivo: 'Cliente comprou pelo parceiro Carlos Concorrente' }));
  assert.equal(b.get().cancellation_reason, MOTIVO_GENERICO_PERDA);
  assert.equal(textoSeguroParaParceiro('Preço acima do orçamento do cliente', 'g', ['Carlos Concorrente']), 'Preço acima do orçamento do cliente');
  assert.equal(textoSeguroParaParceiro('', 'g'), 'g');
  // o nome de outro parceiro no nome da etapa também é barrado
  const c = amb(); await c.rodar(ev('negocio.etapa', { etapa: 'Aguardando Carlos Concorrente' }));
  assert.equal(c.get().crm_etapa, undefined);
});

test('VINCULADA: vira negotiating (em negociação)', async () => {
  const a = amb(ind({ status: 'triagem' }));
  await a.rodar(ev('indicacao.vinculada', { cliente_id: 'c9' }));
  assert.equal(a.get().status, 'negotiating');
  assert.match(textos(a)[0], /em negociação/);
});

test('ETAPA: só histórico visível com o nome da etapa; não muda o status', async () => {
  const a = amb(ind({ status: 'negotiating' }));
  await a.rodar(ev('negocio.etapa', { etapa: 'Negociação' }));
  assert.equal(a.get().status, 'negotiating');
  assert.deepEqual(textos(a), ['Etapa: Negociação']);
});

test('PROPOSTA: grava orçamento (número, data, valor), 60 dias de proteção contados do envio, histórico e notificação só na primeira', async () => {
  const a = amb(ind({ status: 'negotiating', protection_expires_at: '2026-10-30T00:00:00Z' }));
  await a.rodar(ev('proposta.enviada', { numero: '1234', data: '28/10/2026', valor: 150000 }));
  const i = a.get();
  assert.equal(i.budget_loaded, true); assert.equal(i.budget_number, '1234'); assert.equal(i.budget_date, '2026-10-28'); assert.equal(i.gross_budget_value, 150000);
  assert.equal(i.budget_sent_at, '2026-10-28T14:00:00.000Z');
  assert.equal(i.protection_expires_at, new Date(Date.parse('2026-10-28T14:00:00Z') + 60 * 86400000).toISOString());
  assert.deepEqual(textos(a), ['Orçamento enviado (nº 1234)']);
  assert.equal(a.notificacoes().length, 1);
  await a.rodar(ev('proposta.enviada', { numero: '1235', valor: 160000 }));
  assert.equal(a.notificacoes().length, 1, 'segundo orçamento não avisa de novo');
  assert.equal(a.get().budget_number, '1235');
});

test('PROPOSTA: não encurta uma proteção que já vai mais longe (renovação manual)', async () => {
  const longe = '2027-06-01T00:00:00.000Z';
  const a = amb(ind({ status: 'negotiating', protection_expires_at: longe }));
  await a.rodar(ev('proposta.enviada', { numero: '9' }));
  assert.equal(a.get().protection_expires_at, longe);
});

test('PEDIDO LANÇADO: grava número, data, itens (com regra só onde há regra) e histórico', async () => {
  const a = amb(ind({ status: 'negotiating' }), { registered_products: { r1: { code: '1000.0001', is_commissionable: true } } });
  await a.rodar(ev('pedido.lancado', { numero: 'PV-77', data: '2026-10-28', itens: [{ codigo: '1000.0001', nome: 'CMF 600', quantidade: 1, valor: 180000 }, { codigo: '9000.1', nome: 'Kit', quantidade: 1, valor: 12000 }, { codigo: 'X', nome: 'Peça sem cadastro', quantidade: 2, valor: 100 }] }));
  const i = a.get();
  assert.equal(i.sale_order_number, 'PV-77'); assert.equal(i.sale_order_date, '2026-10-28');
  assert.equal(i.status, 'negotiating', 'ainda não é venda');
  const [cmf, kit, x] = i.commissioned_products;
  assert.equal(cmf.is_commissionable, true); assert.equal(kit.is_commissionable, false); assert.equal('is_commissionable' in x, false);
  assert.deepEqual(textos(a), ['Pedido de venda lançado (nº PV-77)']);
});

const ITENS_OK = [{ codigo: '1000.0001', nome: 'CABEÇOTE CMF 600', quantidade: 1, valor: 180000 }, { codigo: '9000.9000.9016', nome: 'Kit hidráulico', quantidade: 1, valor: 12000 }, { codigo: '2000.1', nome: 'Frete até a fazenda', quantidade: 1, valor: 3500 }];
const FAT = (itens: any = ITENS_OK) => ({ numero: 'PV-77', cnpj: '12345678000190', data_pedido: '2026-10-20', data_faturamento: '2026-10-28', previsao_entrega: '2026-11-20', itens });
const catalogoOk = { registered_products: { r1: { code: '1000.0001', is_commissionable: true } } };

test('FATURADO: vira sold, comissão CONGELADA com a taxa do parceiro, só itens comissionáveis, mês pela previsão de entrega', async () => {
  const a = amb(ind({ status: 'negotiating' }), catalogoOk);
  const r = await a.rodar(ev('pedido.faturado', FAT()));
  assert.equal(r.body.resultado, 'aplicado');
  const i = a.get();
  assert.equal(i.status, 'sold');
  const esperado = calcularComissao([{ code: '1000.0001', name: 'CABEÇOTE CMF 600', quantity: 1, base_value: 180000 }], 0, 3);
  assert.equal(esperado.valor, 5400);
  assert.equal(i.commission_value, 5400); assert.equal(i.commission_rate_applied, 3); assert.equal(i.commissionable_value, 180000);
  assert.equal(i.sale_value, 195500); assert.equal(i.sale_date, '2026-10-20'); assert.equal(i.delivery_date, '2026-11-20');
  const c = a.db.dados.commissions.ind1;
  assert.equal(c.value, 5400); assert.equal(c.rate_applied, 3); assert.equal(c.base_value_used, 180000); assert.equal(c.gross_commissionable_value, 180000);
  assert.equal(c.status, 'waiting_nf'); assert.equal(c.external_seller_uid, 'p1'); assert.equal(c.indication_id, 'ind1');
  assert.deepEqual({ month: c.month, year: c.year }, mesDaComissao('2026-11-20', AGORA));
  assert.deepEqual({ month: c.month, year: c.year }, { month: 11, year: 2026 });
  assert.equal(i.finance_notice_pending, true);
  assert.equal(i.options.kit_hydraulic, true); assert.equal(i.options.with_freight, true);
  // o que o parceiro lê: sem percentual nem valor de comissão
  assert.deepEqual(textos(a), ['VENDA FINALIZADA! Data do Pedido: 20/10/2026. Venda concluída, comissão liberada.']);
  const visivel = JSON.stringify(i.negotiation_history) + JSON.stringify(a.notificacoes().filter(n => n.user_uid === 'p1'));
  assert.equal(/%|3%|5\.?400/.test(visivel), false);
  assert.ok(a.notificacoes().some(n => n.user_uid === 'p1' && /Venda concluída, comissão liberada/.test(n.message)));
  assert.ok(a.notificacoes().some(n => n.user_uid === 'adm'), 'gestão é avisada da venda');
});

test('FATURADO com taxa própria do parceiro e padrão de 2% quando não há taxa', async () => {
  const a = amb(ind({ status: 'negotiating' }), { ...catalogoOk, users: { ...USUARIOS, p1: { ...USUARIOS.p1, commission_rate: undefined } } });
  await a.rodar(ev('pedido.faturado', FAT()));
  assert.equal(a.get().commission_rate_applied, 2);
  assert.equal(a.get().commission_value, 3600);
});

test('FATURADO: item SEM REGRA -> aguardando conferência, sem comissão, sem mudar status, avisa admin e financeiro', async () => {
  const a = amb(ind({ status: 'negotiating' }));  // catálogo vazio: o CMF não tem regra
  const r = await a.rodar(ev('pedido.faturado', FAT()));
  assert.equal(r.body.aguardando_conferencia, true);
  const i = a.get();
  assert.equal(i.status, 'negotiating');
  assert.equal(i.faturamento_aguardando_conferencia, true);
  assert.deepEqual(a.db.dados.commissions ?? {}, {}, 'não cria comissão');
  assert.equal(i.commission_value, undefined);
  assert.equal(i.sale_order_number, 'PV-77');
  assert.deepEqual(i.negotiation_history, [], 'o parceiro não vê nada');
  const para = a.notificacoes().map(n => n.user_uid).sort();
  assert.deepEqual(para, ['adm', 'fin']);
  assert.match(a.notificacoes()[0].message, /não dá para lançar a comissão sozinho/);
  const log = a.db.dados.crm_eventos[Object.keys(a.db.dados.crm_eventos)[0]];
  assert.deepEqual(log.conferencia.itensSemRegra, ['1000.0001']);
  assert.equal(JSON.stringify(a.notificacoes()).includes('%'), false);
});

test('FATURADO: regra do vendedor na própria indicação (commissioned_products) conta como regra', async () => {
  const a = amb(ind({ status: 'negotiating', commissioned_products: [{ code: '1000.0001', name: 'CMF', quantity: 1, base_value: 1, is_commissionable: true }] }));
  await a.rodar(ev('pedido.faturado', FAT()));
  assert.equal(a.get().status, 'sold');
  assert.equal(a.get().commission_value, 5400);
});

test('FATURADO: sem itens, ou só com serviço/kit (base zero), também vai para conferência', async () => {
  const a = amb(ind({ status: 'negotiating' }));
  await a.rodar(ev('pedido.faturado', FAT([])));
  assert.equal(a.get().faturamento_aguardando_conferencia, true);
  const b = amb(ind({ status: 'negotiating' }));
  await b.rodar(ev('pedido.faturado', FAT([{ codigo: '9000.1', nome: 'Kit', quantidade: 1, valor: 10 }, { codigo: '2', nome: 'Frete', quantidade: 1, valor: 10 }])));
  assert.equal(b.get().faturamento_aguardando_conferencia, true);
  assert.deepEqual(b.db.dados.commissions ?? {}, {});
});

test('FATURADO: não recria comissão existente nem sobrescreve; estornada não vira comissão', async () => {
  const comissaoAntiga = { indication_id: 'ind1', value: 111, external_seller_uid: 'p1', status: 'paid' };
  const a = amb(ind({ status: 'negotiating' }), { ...catalogoOk, commissions: { ind1: comissaoAntiga } });
  const r = await a.rodar(ev('pedido.faturado', FAT()));
  assert.equal(r.body.resultado, 'ignorado');
  assert.deepEqual(a.db.dados.commissions.ind1, comissaoAntiga);
  assert.equal(a.get().status, 'negotiating');
  // comissão antiga com id aleatório e indication_id
  const b = amb(ind({ status: 'negotiating' }), { ...catalogoOk, commissions: { zzz: { indication_id: 'ind1', value: 5 } } });
  assert.equal((await b.rodar(ev('pedido.faturado', FAT()))).body.resultado, 'ignorado');
  assert.equal(b.db.dados.commissions.ind1, undefined);
  // já faturada na tela
  const c = amb(ind({ status: 'sold', commission_value: 10 }), catalogoOk);
  assert.equal((await c.rodar(ev('pedido.faturado', FAT()))).body.resultado, 'ignorado');
  assert.equal(c.get().commission_value, 10);
  // estornada: nada de comissão, vai para conferência sem mexer em itens
  const d = amb(ind({ status: 'negotiating', estornado_em: '2026-10-01T00:00:00Z' }), catalogoOk);
  const rd = await d.rodar(ev('pedido.faturado', FAT()));
  assert.equal(rd.body.aguardando_conferencia, true);
  assert.deepEqual(d.db.dados.commissions ?? {}, {});
  assert.equal(d.get().status, 'negotiating');
  assert.equal(d.get().estornado_em, '2026-10-01T00:00:00Z');
  assert.equal(d.get().sale_order_number, undefined);
});

test('FATURADO sem parceiro (venda direta): vira sold sem comissão e sem exigir regra de item', async () => {
  const a = amb(ind({ status: 'negotiating', external_seller_uid: 'direct_factory', external_seller_name: 'Venda Direta' }));
  await a.rodar(ev('pedido.faturado', FAT(), { parceiro_id: null }));
  assert.equal(a.get().status, 'sold'); assert.equal(a.get().commission_value, 0);
  assert.deepEqual(a.db.dados.commissions ?? {}, {});
  assert.equal(a.notificacoes().filter(n => n.user_uid === 'direct_factory').length, 0);
});

test('FATURADO com parceiro que não recebe comissão (perfil da equipe): vira sold sem comissão', async () => {
  const a = amb(ind({ status: 'negotiating', external_seller_uid: 'v1' }), { users: { ...USUARIOS } });
  await a.rodar(ev('pedido.faturado', FAT(), { parceiro_id: 'v1' }));
  assert.equal(a.get().status, 'sold'); assert.deepEqual(a.db.dados.commissions ?? {}, {});
});

test('GANHO: se o faturado ainda não chegou só registra no histórico (sem comissão, sem mudar status)', async () => {
  const a = amb(ind({ status: 'negotiating' }));
  await a.rodar(ev('negocio.ganho', { valor: 200000 }));
  assert.equal(a.get().status, 'negotiating'); assert.deepEqual(a.db.dados.commissions ?? {}, {});
  assert.deepEqual(textos(a), ['Negócio ganho']);
  assert.equal(a.get().crm_ganho_valor, 200000);
});

test('PERDIDO: cancela como o botão Cancelar (motivo, histórico, notificação) e não cancela venda feita', async () => {
  const a = amb(ind({ status: 'negotiating' }));
  await a.rodar(ev('negocio.perdido', { motivo: 'Cliente desistiu da compra' }));
  assert.equal(a.get().status, 'cancelled'); assert.equal(a.get().cancellation_reason, 'Cliente desistiu da compra');
  assert.deepEqual(textos(a), ['Negócio perdido: Cliente desistiu da compra']);
  assert.match(a.notificacoes()[0].message, /Cliente desistiu/);
  const b = amb(ind({ status: 'sold' }));
  assert.equal((await b.rodar(ev('negocio.perdido', { motivo: 'x' }))).body.resultado, 'ignorado');
  assert.equal(b.get().status, 'sold');
});

test('IDEMPOTÊNCIA: o mesmo id de evento não reprocessa, nem duplica histórico, notificação ou comissão', async () => {
  const a = amb(ind({ status: 'negotiating' }), catalogoOk);
  const e = ev('pedido.faturado', FAT());
  await a.rodar(e);
  const n1 = a.notificacoes().length; const h1 = a.get().negotiation_history.length;
  const r2 = await a.rodar(e);
  assert.equal(r2.body.duplicado, true);
  assert.equal(a.notificacoes().length, n1); assert.equal(a.get().negotiation_history.length, h1);
  // mesmo se o registro do evento se perdesse, o histórico com id fixo segura o reprocessamento
  delete a.db.dados.crm_eventos[e.id];
  const r3 = await a.rodar(e);
  assert.equal(r3.body.resultado, 'ignorado');
  assert.equal(a.get().negotiation_history.length, h1);
  assert.equal(a.notificacoes().length, n1);
  // idem para a conferência (sem histórico): o marcador do último evento segura
  const b = amb(ind({ status: 'negotiating' }));
  const f = ev('pedido.faturado', FAT());
  await b.rodar(f); const nb = b.notificacoes().length;
  delete b.db.dados.crm_eventos[f.id];
  await b.rodar(f);
  assert.equal(b.notificacoes().length, nb);
});

test('OUTROS: indicação inexistente, parceiro diferente e evento desconhecido respondem 200 e só vão para o log', async () => {
  const a = amb();
  assert.equal((await a.rodar(ev('indicacao.recebida', {}, { id_externo: 'naoexiste' }))).body.motivo, 'indicacao_nao_encontrada');
  const r = await a.rodar(ev('indicacao.aceita', { vendedora: 'X' }, { parceiro_id: 'p2' }));
  assert.equal(r.body.motivo, 'parceiro_diferente'); assert.equal(a.get().status, 'pending');
  assert.equal((await a.rodar(ev('evento.novo'))).body.motivo, 'evento_desconhecido');
  assert.equal(Object.keys(a.db.dados.crm_eventos).length, 3);
});

test('FUNÇÕES PURAS: normalização de itens, números e datas do CRM', () => {
  assert.equal(numeroDoCrm('1.234,56'), 1234.56); assert.equal(numeroDoCrm('1234.5'), 1234.5); assert.equal(numeroDoCrm('abc'), null);
  assert.equal(diaDoCrm('30/10/2026'), '2026-10-30'); assert.equal(diaDoCrm('2026-10-30'), '2026-10-30'); assert.equal(diaDoCrm('2026-10-30T02:00:00Z'), '2026-10-29'); assert.equal(diaDoCrm('lixo'), '');
  assert.deepEqual(normalizarItensCrm([{ codigo: 'A', nome: 'Peça', quantidade: 2, valor_total: 200 }, { nome: '', codigo: '' }, null]), [{ code: 'A', name: 'Peça', quantity: 2, base_value: 100 }]);
  assert.equal(classificarItem({ code: '9000.1', name: 'x', quantity: 1, base_value: 1 }, [], {}).regra, 'excluido');
  assert.equal(classificarItem({ code: 'Z', name: 'x', quantity: 1, base_value: 1 }, [], {}).regra, 'sem_regra');
  assert.equal(classificarItem({ code: 'Z', name: 'x', quantity: 1, base_value: 1 }, [], { Z: { is_commissionable: false } }).is_commissionable, false);
  const p = planejarEvento(ind(), { id: 'q', evento: 'indicacao.recebida', id_externo: 'ind1' }, { agora: AGORA, parceiro: null, vendedora: null, nomesOutrosParceiros: [], catalogo: {}, comissaoExistente: false });
  assert.equal(p.resultado, 'aplicado');
});
