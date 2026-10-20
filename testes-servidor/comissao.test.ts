// Comissão do parceiro: conta compartilhada, diagnóstico, geração e e-mails mensais.
// Rodar: node --import tsx --test testes-servidor/comissao.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calcularComissao, mesDaComissao, taxaDoParceiro, papelComissionavel, temParceiroSemUid,
} from '../src/lib/calculoComissao.ts';
import { diagnosticar, gerarComissao, previaGeracao, ligarParceiro, nomeCasa, normalizar, nomeContido, transferirIndicacao, moverComissoesDoProvisorio, loteEmPartes } from '../server/diagnosticoComissao.ts';
import {
  comissoesDoCiclo, agruparPorParceiro, comTravaMensal, relatorioParceirosDia1, lembreteNfDia5, lembreteFinanceiroDia7, relatorioDiretoriaDia1, mesEmBrasilia,
  ligarEmailsComissaoUmaVez,
} from '../server/relatoriosComissao.ts';

// ---------- Firestore em memória ----------
const UNIAO = Symbol('arrayUnion');
const arrayUnion = (...v: any[]) => ({ [UNIAO]: v });
function aplicar(atual: any, mudanca: any) {
  const novo = { ...(atual || {}) };
  for (const [k, v] of Object.entries(mudanca)) {
    if (v && typeof v === 'object' && (v as any)[UNIAO]) novo[k] = [...(novo[k] || []), ...(v as any)[UNIAO]];
    else novo[k] = v;
  }
  return novo;
}
function bancoFalso(inicial: Record<string, Record<string, any>> = {}) {
  const dados: Record<string, Record<string, any>> = structuredClone(inicial);
  const col = (n: string) => (dados[n] ||= {});
  let seq = 0;
  const snapDoc = (n: string, id: string) => ({ exists: id in col(n), id, data: () => col(n)[id] ? structuredClone(col(n)[id]) : undefined, ref: docRef(n, id) });
  function docRef(n: string, id?: string): any {
    const did = id || `auto${++seq}`;
    return {
      id: did, _col: n,
      get: async () => snapDoc(n, did),
      set: async (v: any, o?: any) => { col(n)[did] = o?.merge ? aplicar(col(n)[did], v) : aplicar({}, v); },
      update: async (v: any) => { if (!(did in col(n))) throw new Error('não existe'); col(n)[did] = aplicar(col(n)[did], v); },
      create: async (v: any) => { if (did in col(n)) throw Object.assign(new Error('ALREADY_EXISTS'), { code: 6 }); col(n)[did] = aplicar({}, v); },
      delete: async () => { delete col(n)[did]; },
    };
  }
  const consulta = (n: string, f: [string, string, any][]): any => ({
    _consulta: true,
    where: (c: string, op: string, v: any) => consulta(n, [...f, [c, op, v]]),
    select: () => consulta(n, f),
    get: async () => {
      const docs = Object.keys(col(n)).filter(id => f.every(([c, op, v]) => {
        const d = col(n)[id];
        return op === '==' ? d[c] === v : op === 'in' ? v.includes(d[c]) : op === 'array-contains' ? Array.isArray(d[c]) && d[c].includes(v) : false;
      })).map(id => snapDoc(n, id));
      return { docs, empty: !docs.length, size: docs.length };
    },
  });
  const db: any = {
    dados,
    batch: () => {
      const ops: (() => Promise<any>)[] = [];
      return {
        set: (r: any, v: any, o?: any) => { ops.push(() => r.set(v, o)); },
        update: (r: any, v: any) => { ops.push(() => r.update(v)); },
        delete: (r: any) => { ops.push(() => r.delete()); },
        commit: async () => { for (const op of ops) await op(); },
      };
    },
    collection: (n: string) => ({ doc: (id?: string) => docRef(n, id), where: (c: string, op: string, v: any) => consulta(n, [[c, op, v]]), select: () => consulta(n, []), get: () => consulta(n, []).get() }),
    runTransaction: async (fn: any) => {
      const escritas: (() => Promise<any>)[] = [];
      const tx = {
        get: (r: any) => r.get(),
        set: (r: any, v: any, o?: any) => { escritas.push(() => r.set(v, o)); },
        update: (r: any, v: any) => { escritas.push(() => r.update(v)); },
        delete: (r: any) => { escritas.push(() => r.delete()); },
      };
      const out = await fn(tx);
      for (const e of escritas) await e();
      return out;
    },
  };
  return db;
}

// ---------- A conta antiga do faturamento (Indications.tsx antes da extração), para paridade ----------
function contaAntiga(produtos: any[], descontoReais: number, partner: any) {
  let commissionRate = 2;
  if (partner && partner.commission_rate !== undefined && partner.commission_rate !== null) commissionRate = partner.commission_rate;
  let commissionableValue = (produtos || []).reduce((acc, p) => {
    const is9000 = p.code && p.code.trim().startsWith('9000');
    const isService = /m[ãa]o\s*de\s*obra|frete|transporte|instala[çc][ãa]o|montagem|entrega\s*t[ée]cnica|deslocamento|kit\s+de\s+instala/i.test(p.name || '');
    const isCommissionable = p.is_commissionable !== false && !is9000 && !isService;
    return acc + (isCommissionable ? (p.base_value || 0) * (p.quantity || 0) : 0);
  }, 0);
  const gross = commissionableValue;
  const discountAmount = Math.min(Math.max(Number(descontoReais) || 0, 0), gross);
  const discPct = gross > 0 ? (discountAmount / gross) * 100 : 0;
  commissionableValue = gross - discountAmount;
  return { gross, discountAmount, discPct, base: commissionableValue, valor: commissionableValue * (commissionRate / 100), rate: commissionRate };
}
function mesAntigo(deliveryDate: string, currentDateObj: Date) {
  const currentMonth = currentDateObj.getMonth() + 1;
  const currentYear = currentDateObj.getFullYear();
  let retro = false;
  if (deliveryDate) { if (new Date(deliveryDate + 'T23:59:59') <= currentDateObj) retro = true; }
  if (retro) return { month: currentMonth, year: currentYear };
  let m = currentMonth + 1, y = currentYear;
  if (m > 12) { m = 1; y += 1; }
  return { month: m, year: y };
}

const PRODUTOS = [
  { code: '1000.0001', name: 'CABEÇOTE CMF 600', quantity: 1, base_value: 180000 },
  { code: '9000.9000.9016', name: 'Kit hidráulico', quantity: 1, base_value: 12000 },
  { code: '2000.0002', name: 'Frete até a fazenda', quantity: 1, base_value: 3500 },
  { code: '1000.0003', name: 'Garra R360', quantity: 2, base_value: 25000 },
  { code: '1000.0004', name: 'Item sem comissão', quantity: 1, base_value: 9000, is_commissionable: false },
  { code: '1000.0005', name: 'Instalação completa', quantity: 1, base_value: 8000 },
];

test('PARIDADE: a conta compartilhada dá exatamente o que o faturamento antigo dava', () => {
  const casos = [
    { produtos: PRODUTOS, desconto: 0, parceiro: { commission_rate: 3 } },
    { produtos: PRODUTOS, desconto: 15000, parceiro: { commission_rate: 4.5 } },
    { produtos: PRODUTOS, desconto: 999999, parceiro: { commission_rate: 3 } },
    { produtos: PRODUTOS, desconto: -50, parceiro: {} },
    { produtos: [], desconto: 100, parceiro: { commission_rate: 5 } },
    { produtos: [{ code: ' 9000.1', name: 'x', quantity: 3, base_value: 10 }], desconto: 0, parceiro: null },
    { produtos: [{ name: 'Mão de obra', quantity: 1, base_value: 100 }, { name: 'Garfo', quantity: 0, base_value: 100 }], desconto: 0, parceiro: { commission_rate: 0 } },
  ];
  for (const c of casos) {
    const velho = contaAntiga(c.produtos, c.desconto, c.parceiro);
    const novo = calcularComissao(c.produtos, c.desconto, taxaDoParceiro(c.parceiro));
    assert.deepEqual(
      { gross: novo.baseBruta, d: novo.desconto, p: novo.descontoPct, base: novo.base, valor: novo.valor, rate: novo.taxa },
      { gross: velho.gross, d: velho.discountAmount, p: velho.discPct, base: velho.base, valor: velho.valor, rate: velho.rate },
    );
  }
  for (const [entrega, agora] of [['', '2026-10-19T12:00:00'], ['2026-10-01', '2026-10-19T12:00:00'], ['2026-12-30', '2026-12-10T12:00:00'], ['', '2026-12-10T12:00:00'], ['2026-10-19', '2026-10-19T12:00:00']] as const) {
    assert.deepEqual(mesDaComissao(entrega, new Date(agora)), mesAntigo(entrega, new Date(agora)));
  }
});

test('perfil da equipe não recebe comissão; parceiro e papel vazio recebem', () => {
  assert.equal(papelComissionavel('external_seller'), true);
  assert.equal(papelComissionavel(undefined), true);
  for (const p of ['admin', 'manager', 'internal_seller', 'triagem', 'financial', 'marketing', 'fiscal', 'vendedor_padrao']) assert.equal(papelComissionavel(p), false);
});

test('FATURAR SEM UID: venda de parceiro só pelo nome é barrada, venda direta e do site passam', () => {
  assert.equal(temParceiroSemUid({ external_seller_name: 'Rafael - MAQLOC' }), true);
  assert.equal(temParceiroSemUid({ indicator_name: 'Rafael' }), true);
  assert.equal(temParceiroSemUid({ external_seller_uid: 'u1', external_seller_name: 'Rafael' }), false);
  assert.equal(temParceiroSemUid({ external_seller_name: 'Solicitação Direta (Site)' }), false);
  assert.equal(temParceiroSemUid({ external_seller_name: 'Heloisa (Fábrica)' }), false);
  assert.equal(temParceiroSemUid({ external_seller_name: 'Cliente: Fazenda Boa Vista' }), false);
  assert.equal(temParceiroSemUid({}), false);
});

// ---------- Diagnóstico ----------
const AGORA = new Date('2026-10-19T12:00:00-03:00');
function cenarioRafael() {
  return bancoFalso({
    users: {
      raf: { uid: 'raf', name: 'Rafael - MAQLOC', email: 'rafael@maqloc.com.br', role: 'external_seller', status: 'active', commission_rate: 3 },
      raf2: { uid: 'raf2', name: 'rafael maqloc', email: 'rafa.maqloc@gmail.com', role: 'external_seller', status: 'active' },
      gis: { uid: 'gis', name: 'Gislene', email: 'gislene@roderbrasil.com.br', role: 'manager' },
      car: { uid: 'car', name: 'Carlos Pereira', email: 'carlos@gmail.com', role: 'external_seller' },
    },
    indications: {
      i_nome: { status: 'sold', client_name: 'Madeireira Norte', external_seller_name: 'Rafael - MAQLOC', commissioned_products: PRODUTOS, sale_value: 230000, sale_date: '2026-10-10', updated_at: '2026-10-10T10:00:00Z' },
      i_ok: { status: 'sold', client_name: 'Fazenda Sol', external_seller_uid: 'raf', external_seller_name: 'Rafael - MAQLOC', commissioned_products: PRODUTOS, discount_amount: 1000, updated_at: '2026-10-02T10:00:00Z' },
      i_sem_comissao: { status: 'sold', client_name: 'Serraria Leste', external_seller_uid: 'raf', external_seller_name: 'Rafael - MAQLOC', commissioned_products: PRODUTOS, discount_amount: 5000, updated_at: '2026-10-05T10:00:00Z' },
      i_base_zero: { status: 'sold', client_name: 'Agro Sul', external_seller_uid: 'raf', external_seller_name: 'Rafael - MAQLOC', commissioned_products: [], updated_at: '2026-10-04T10:00:00Z' },
      i_uid_velho: { status: 'negotiating', client_name: 'Toras Oeste', external_seller_uid: 'tmp_antigo', external_seller_email: 'RAFAEL@MAQLOC.COM.BR', external_seller_name: 'Rafael', updated_at: '2026-10-01T10:00:00Z' },
      i_outro: { status: 'sold', client_name: 'Outro Cliente', external_seller_uid: 'car', external_seller_name: 'Carlos Pereira', commissioned_products: PRODUTOS },
    },
    commissions: {
      i_ok: { indication_id: 'i_ok', external_seller_uid: 'raf', external_seller_name: 'Rafael - MAQLOC', value: 6000, status: 'waiting_nf', month: 11, year: 2026 },
    },
    monthly_statements: { raf_9_2026: { seller_uid: 'raf', month: 9, year: 2026, status: 'paid', total_value: 1200 } },
    settings: { notifications: { monthly_report_partners: true } },
  });
}

test('nome casa sem acento, sem traço e em qualquer ordem', () => {
  assert.equal(normalizar('Rafael - MAQLOC'), 'rafael maqloc');
  assert.equal(nomeCasa('Rafael - MAQLOC', 'maqloc rafael'), true);
  assert.equal(nomeCasa('Rafael Souza (MAQLOC)', 'rafael maqloc'), true);
  assert.equal(nomeCasa('Rafaela', 'rafael maqloc'), false);
});

test('DIAGNÓSTICO: acha o parceiro pelo nome, o cadastro repetido e cada elo solto', async () => {
  const db = cenarioRafael();
  const r: any = await diagnosticar({ db, agora: () => AGORA }, 'rafael maqloc');
  assert.deepEqual(r.usuarios.map((u: any) => u.uid).sort(), ['raf', 'raf2']);
  assert.equal(r.usuarios.find((u: any) => u.uid === 'raf').commission_rate, 3);
  assert.equal(r.duplicados.length, 1);
  assert.ok(r.avisos_gerais.some((a: string) => a.includes('Cadastro repetido')));
  assert.ok(r.avisos_gerais.some((a: string) => a.includes('diretoria')), 'flag desligada aparece');
  const ids = r.indicacoes.map((i: any) => i.id).sort();
  assert.deepEqual(ids, ['i_base_zero', 'i_nome', 'i_ok', 'i_sem_comissao', 'i_uid_velho'], 'não traz a venda do Carlos');
  const por = (id: string) => r.indicacoes.find((i: any) => i.id === id);
  const codigos = (id: string) => por(id).falta.map((f: any) => f.codigo);

  assert.deepEqual(por('i_nome').ligado_por, ['nome']);
  assert.ok(codigos('i_nome').includes('sem_uid'));
  assert.equal(por('i_nome').falta.find((f: any) => f.codigo === 'sem_uid').acao, 'ligar');

  assert.deepEqual(por('i_uid_velho').ligado_por, ['e-mail'], 'e-mail gravado com maiúsculas casa; só "Rafael" não basta pelo nome');
  assert.ok(codigos('i_uid_velho').includes('uid_inexistente'));

  assert.ok(codigos('i_base_zero').includes('base_zero'));
  assert.equal(por('i_base_zero').falta.find((f: any) => f.codigo === 'sem_comissao').acao, undefined, 'base zero não oferece gerar');

  const semCom = por('i_sem_comissao');
  assert.equal(semCom.falta.find((f: any) => f.codigo === 'sem_comissao').acao, 'gerar');
  assert.equal(semCom.calculo_previsto.valor, (180000 + 50000 - 5000) * 0.03);

  assert.equal(por('i_ok').falta.filter((f: any) => f.tipo !== 'info').length, 0, 'venda certa não acusa nada');
  assert.equal(r.comissoes.find((c: any) => c.id === 'i_ok').value, 6000);
  assert.equal(r.extratos.length, 1);
});

test('DIAGNÓSTICO pelo e-mail e pelo código; termo curto é recusado', async () => {
  const db = cenarioRafael();
  const r1: any = await diagnosticar({ db, agora: () => AGORA }, 'rafael@maqloc.com.br');
  assert.deepEqual(r1.usuarios.map((u: any) => u.uid), ['raf', 'raf2'], 'o cadastro repetido (mesmo nome) entra junto');
  assert.equal(r1.usuarios.find((u: any) => u.uid === 'raf2').repetido, true);
  const r2: any = await diagnosticar({ db, agora: () => AGORA }, 'tmp_antigo');
  assert.equal(r2.usuarios.length, 0);
  assert.deepEqual(r2.indicacoes.map((i: any) => i.id), ['i_uid_velho'], 'uid antigo que não existe mais ainda acha a indicação');
  await assert.rejects(diagnosticar({ db }, 'r'), /Digite/);
});

// ---------- Geração ----------
const ADMIN = { uid: 'jef', nome: 'Jeferson' };

test('GERAR: cria commissions/{id} igual ao faturamento, marca o aviso ao financeiro e registra no histórico', async () => {
  const db = cenarioRafael();
  const deps = { db, arrayUnion, agora: () => AGORA };
  const p: any = await previaGeracao(deps, 'i_sem_comissao');
  const esperado = calcularComissao(PRODUTOS, 5000, 3);
  assert.equal(p.valor, esperado.valor);
  assert.equal(p.ja_existe, false);
  assert.ok(!db.dados.commissions.i_sem_comissao, 'prévia não grava');

  const r: any = await gerarComissao(deps, 'i_sem_comissao', ADMIN);
  assert.equal(r.valor, esperado.valor);
  const c = db.dados.commissions.i_sem_comissao;
  assert.deepEqual({ ...c, created_at: undefined }, {
    indication_id: 'i_sem_comissao', external_seller_uid: 'raf', external_seller_name: 'Rafael - MAQLOC',
    value: esperado.valor, base_value_used: esperado.base, gross_commissionable_value: esperado.baseBruta,
    discount_applied: 5000, discount_percentage: esperado.descontoPct, rate_applied: 3, status: 'waiting_nf',
    month: 11, year: 2026, sale_date: null, created_at: undefined, generated_by: 'diagnostico_admin', generated_by_uid: 'jef',
  });
  const ind = db.dados.indications.i_sem_comissao;
  assert.equal(ind.commission_value, esperado.valor);
  assert.equal(ind.finance_notice_pending, true);
  assert.equal(ind.finance_notice_due_at, new Date(AGORA.getTime() + 2 * 86400000).toISOString());
  assert.equal(ind.negotiation_history.length, 1);
  assert.match(ind.negotiation_history[0].content, /COMISSÃO LANÇADA PELO DIAGNÓSTICO/);
  assert.doesNotMatch(ind.negotiation_history[0].content, /%/, 'o histórico não mostra taxa');
});

test('GERAR é idempotente: a segunda vez recusa e não mexe no que existe', async () => {
  const db = cenarioRafael();
  const deps = { db, arrayUnion, agora: () => AGORA };
  await gerarComissao(deps, 'i_sem_comissao', ADMIN);
  const antes = structuredClone(db.dados.commissions.i_sem_comissao);
  await assert.rejects(gerarComissao(deps, 'i_sem_comissao', ADMIN, 0), /Já existe/);
  assert.deepEqual(db.dados.commissions.i_sem_comissao, antes);
  // comissão antiga de id aleatório também conta
  db.dados.commissions.velha = { indication_id: 'i_base_zero', external_seller_uid: 'raf', value: 10 };
  db.dados.indications.i_base_zero.commissioned_products = PRODUTOS;
  await assert.rejects(gerarComissao(deps, 'i_base_zero', ADMIN), /Já existe/);
  assert.equal((await previaGeracao(deps, 'i_base_zero')).ja_existe, true);
});

test('GERAR recusa sem uid, com base zero, não faturada e perfil da equipe', async () => {
  const db = cenarioRafael();
  const deps = { db, arrayUnion, agora: () => AGORA };
  await assert.rejects(gerarComissao(deps, 'i_nome', ADMIN), /Ligue a indicação/);
  await assert.rejects(gerarComissao(deps, 'i_base_zero', ADMIN), /zero/);
  await assert.rejects(gerarComissao(deps, 'i_uid_velho', ADMIN), /não foi faturada/);
  db.dados.indications.i_nome.external_seller_uid = 'gis';
  await assert.rejects(gerarComissao(deps, 'i_nome', ADMIN), /não recebe comissão/);
  await assert.rejects(gerarComissao(deps, 'nao_existe', ADMIN), /não encontrada/);
  assert.equal(Object.keys(db.dados.commissions).length, 1);
});

test('LIGAR grava uid, nome e e-mail minúsculo, e depois a comissão pode ser gerada', async () => {
  const db = cenarioRafael();
  const deps = { db, arrayUnion, agora: () => AGORA };
  await ligarParceiro(deps, 'i_nome', 'raf', ADMIN);
  const ind = db.dados.indications.i_nome;
  assert.equal(ind.external_seller_uid, 'raf');
  assert.equal(ind.external_seller_email, 'rafael@maqloc.com.br');
  assert.match(ind.negotiation_history[0].content, /antes Rafael - MAQLOC, agora Rafael - MAQLOC/);
  const r: any = await gerarComissao(deps, 'i_nome', ADMIN);
  assert.equal(r.valor, calcularComissao(PRODUTOS, 0, 3).valor);
  // com comissão lançada em nome de outro, trocar o parceiro é recusado
  await assert.rejects(ligarParceiro(deps, 'i_nome', 'raf2', ADMIN), /Já existe comissão/);
  await assert.rejects(ligarParceiro(deps, 'i_nome', 'ninguem', ADMIN), /Usuário não encontrado/);
});

// ---------- E-mails mensais ----------
function cenarioMes() {
  return bancoFalso({
    users: {
      raf: { name: 'Rafael - MAQLOC', email: 'rafael@maqloc.com.br', role: 'external_seller', pix_key: 'pix-raf' },
      car: { name: 'Carlos Pereira', email: 'carlos@gmail.com', role: 'external_seller' },
      mob: { name: 'Sem Email', email: 'x@mobile.roder.com.br', role: 'external_seller' },
    },
    indications: {
      a: { status: 'sold', client_name: 'Cliente A', base_machine: 'CMF 600', sale_value: 230000, sale_date: '2026-10-10', updated_at: '2026-11-03T00:00:00Z' },
      b: { status: 'sold', client_name: 'Cliente B', sale_value: 50000, sale_date: '2026-10-20' },
      c: { status: 'sold', client_name: 'Cliente C', sale_value: 10000, sale_date: '2026-09-15', updated_at: '2026-10-25T00:00:00Z' },
    },
    commissions: {
      a: { indication_id: 'a', external_seller_uid: 'raf', external_seller_name: 'Rafael', value: 6900, status: 'waiting_nf', month: 11, year: 2026, base_value_used: 230000, rate_applied: 3 },
      b: { indication_id: 'b', external_seller_uid: 'car', value: 1000, status: 'waiting_nf', month: 11, year: 2026 },
      paga: { indication_id: 'x', external_seller_uid: 'car', value: 500, status: 'paid', month: 11, year: 2026 },
      zero: { indication_id: 'y', external_seller_uid: 'car', value: 0, status: 'waiting_nf', month: 11, year: 2026 },
      acumulada: { indication_id: 'c', external_seller_uid: 'raf', value: 300, status: 'waiting_nf', month: 10, year: 2026 },
      outubro_paga_extrato: { indication_id: 'z', external_seller_uid: 'car', value: 700, status: 'waiting_payment', month: 10, year: 2026 },
      dezembro: { indication_id: 'w', external_seller_uid: 'raf', value: 999, status: 'waiting_nf', month: 12, year: 2026 },
      velha: { indication_id: 'v', external_seller_uid: 'raf', value: 888, status: 'waiting_nf', month: 8, year: 2026 },
      mob: { indication_id: 'm', external_seller_uid: 'mob', value: 50, status: 'waiting_nf', month: 11, year: 2026 },
    },
    monthly_statements: { car_10_2026: { status: 'paid' } },
    settings: { notifications: { monthly_report_partners: true, monthly_report_directors: true, payment_reminder_finance: true, manager_emails: 'gislene@roderbrasil.com.br' } },
  });
}
const DIA1 = new Date('2026-11-01T11:00:00Z'); // 8h em Brasília
function depsEmail(db: any, agora: Date) {
  const enviados: { to: string; subject: string; html: string }[] = [];
  return {
    enviados,
    deps: {
      db, agora: () => agora,
      enviar: async (to: string, subject: string, html: string) => { enviados.push({ to, subject, html }); },
      formatCurrency: (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v),
      getFinanceReplyTo: () => ['financeiro@roderbrasil.com.br'],
    },
  };
}

test('CICLO: comissões do mês de pagamento mais o atraso do mês anterior, sem as pagas nem as zeradas', async () => {
  const db = cenarioMes();
  assert.deepEqual(mesEmBrasilia(new Date('2026-11-01T02:00:00Z')), { month: 10, year: 2026 }, 'meia-noite UTC ainda é outubro em Brasília');
  const c = await comissoesDoCiclo(db, { month: 11, year: 2026 });
  assert.deepEqual(c.map((x: any) => x.id).sort(), ['a', 'acumulada', 'b', 'mob']);
  const g = agruparPorParceiro(c);
  assert.equal(g.find(x => x.uid === 'raf')!.total, 7200);
  assert.equal(g.find(x => x.uid === 'car')!.total, 1000);
});

test('DIA 1 PARCEIRO: um e-mail por parceiro com o total do ciclo, e a trava impede o segundo envio', async () => {
  const db = cenarioMes();
  const { deps, enviados } = depsEmail(db, DIA1);
  assert.equal(await relatorioParceirosDia1(deps), true);
  assert.deepEqual(enviados.map(e => e.to).sort(), ['carlos@gmail.com', 'rafael@maqloc.com.br'], 'e-mail @mobile não recebe');
  const raf = enviados.find(e => e.to === 'rafael@maqloc.com.br')!;
  // Rafael tem comissão acumulada de outubro: o texto fala em comissões a receber, não em vendas do mês
  assert.match(raf.subject, /a receber: R\$\s7\.200,00/);
  assert.match(raf.html, /comissões a receber/);
  assert.doesNotMatch(raf.html, /geraram vendas em/);
  const car = enviados.find(e => e.to === 'carlos@gmail.com')!;
  assert.match(car.subject, /outubro de 2026: R\$\s1\.000,00/);
  assert.match(car.html, /geraram vendas em <strong>outubro de 2026/);
  assert.match(raf.html, /Cliente A/);
  assert.match(raf.html, /CMF 600/);
  // a venda A foi editada em novembro: pelo updated_at ela sumia do relatório de 1º de novembro
  assert.equal(await relatorioParceirosDia1(deps), false);
  assert.equal(enviados.length, 2);
  assert.ok(db.dados.cron_locks['relatorio_parceiros_dia1_2026-11'].finished_at);
});

test('DIA 1 desligado não manda nada nem cria trava', async () => {
  const db = cenarioMes();
  db.dados.settings.notifications.monthly_report_partners = false;
  const { deps, enviados } = depsEmail(db, DIA1);
  assert.equal(await relatorioParceirosDia1(deps), 'desligado');
  assert.equal(await lembreteNfDia5(deps), 'desligado');
  assert.equal(enviados.length, 0);
  assert.equal(Object.keys(db.dados.cron_locks || {}).length, 0);
});

test('DIA 5: lembra só quem ainda não mandou a nota do mês da comissão', async () => {
  const db = cenarioMes();
  db.dados.monthly_statements.car_11_2026 = { status: 'waiting_payment', nf_url: 'x' };
  const { deps, enviados } = depsEmail(db, new Date('2026-11-05T11:00:00Z'));
  await lembreteNfDia5(deps);
  assert.deepEqual(enviados.map(e => e.to), ['rafael@maqloc.com.br']);
  await lembreteNfDia5(deps);
  assert.equal(enviados.length, 1, 'trava do mês');
});

test('DIA 7 FINANCEIRO: total pelo documento da comissão, uma vez por mês', async () => {
  const db = cenarioMes();
  const { deps, enviados } = depsEmail(db, new Date('2026-11-07T11:00:00Z'));
  await lembreteFinanceiroDia7(deps);
  assert.equal(enviados.length, 3);
  assert.match(enviados[0].html, /R\$\s8\.250,00/); // 6900 + 1000 + 300 + 50
  await lembreteFinanceiroDia7(deps);
  assert.equal(enviados.length, 3);
});

test('DIA 1 DIRETORIA: vendas pela data do pedido, comissões pelo ciclo, sem taxa padrão inventada', async () => {
  const db = cenarioMes();
  const { deps, enviados } = depsEmail(db, DIA1);
  await relatorioDiretoriaDia1(deps);
  const dir = enviados.find(e => e.subject.startsWith('Relatório de Vendas'))!;
  assert.equal(dir.to, 'gislene@roderbrasil.com.br');
  assert.match(dir.html, /Cliente A/);
  assert.match(dir.html, /Cliente B/);
  assert.doesNotMatch(dir.html, /Cliente C/, 'venda de setembro editada em outubro não entra em outubro');
  assert.match(dir.html, /R\$\s280\.000,00/);
  const fin = enviados.find(e => e.subject.startsWith('Financeiro:'))!;
  assert.match(fin.html, /pix-raf/);
  assert.match(fin.html, />3%</);
  assert.doesNotMatch(fin.html, />5%</);
  const antes = enviados.length;
  await relatorioDiretoriaDia1(deps);
  assert.equal(enviados.length, antes);
});

test('TRAVA: erro no meio deixa a trava com o erro, e não roda de novo sozinho', async () => {
  const db = bancoFalso();
  const r = await comTravaMensal(db, 'x', { month: 3, year: 2027 }, async () => { throw new Error('smtp caiu'); });
  assert.equal(r, true);
  assert.equal(db.dados.cron_locks['x_2027-03'].error, 'smtp caiu');
  let rodou = false;
  assert.equal(await comTravaMensal(db, 'x', { month: 3, year: 2027 }, async () => { rodou = true; }), false);
  assert.equal(rodou, false);
});

// ---------- Mês da comissão no horário de Brasília ----------
test('MÊS DA COMISSÃO: virada do mês conta em Brasília, mesmo com o servidor em UTC', () => {
  const noite31 = new Date('2026-10-31T22:30:00-03:00'); // já é 01/11 em UTC
  assert.deepEqual(mesDaComissao('', noite31), { month: 11, year: 2026 }, 'faturou em outubro: paga em novembro, não em dezembro');
  assert.deepEqual(mesDaComissao('2026-10-30', noite31), { month: 10, year: 2026 }, 'entrega retroativa: mês corrente de Brasília');
  assert.deepEqual(mesDaComissao('2026-10-31', noite31), { month: 11, year: 2026 }, 'entrega no próprio dia ainda não passou');
  assert.deepEqual(mesDaComissao('2026-10-31T02:00:00Z', noite31), { month: 10, year: 2026 }, 'data com hora: 30/10 às 23h em Brasília');
  const madrugada1 = new Date('2026-11-01T00:30:00-03:00');
  assert.deepEqual(mesDaComissao('', madrugada1), { month: 12, year: 2026 });
  assert.deepEqual(mesDaComissao('2026-10-31', madrugada1), { month: 11, year: 2026 });
  assert.deepEqual(mesDaComissao('', new Date('2026-12-31T23:00:00-03:00')), { month: 1, year: 2027 });
});

// ---------- Cadastro repetido e conta escolhida ----------
test('REPETIDO: nome dentro do outro (nos dois sentidos) e mesmo e-mail viram cadastro repetido', async () => {
  assert.equal(nomeContido('rafael', 'rafael maqloc'), true);
  assert.equal(nomeContido('rafael maqloc', 'rafael'), true);
  assert.equal(nomeContido('rafa', 'rafael maqloc'), false, 'pedaço de palavra não conta');
  assert.equal(nomeContido('al', 'al maqloc'), false, 'nome curto demais');
  const db = cenarioRafael();
  db.dados.users.raf3 = { uid: 'raf3', name: 'Rafael', email: 'outro@x.com', role: 'external_seller' };
  db.dados.users.raf4 = { uid: 'raf4', name: 'Fulano', email: 'RAFAEL@maqloc.com.br', role: 'external_seller' };
  db.dados.indications.i_raf3 = { status: 'negotiating', client_name: 'Cliente do Rafael 3', external_seller_uid: 'raf3' };
  const r: any = await diagnosticar({ db, agora: () => AGORA }, 'rafael@maqloc.com.br');
  assert.deepEqual(r.usuarios.map((u: any) => u.uid).sort(), ['raf', 'raf2', 'raf3', 'raf4'], 'mesmo e-mail com outra caixa, mesmo nome e nome dentro do outro');
  assert.equal(r.duplicados[0].motivo, 'mesmo e-mail');
  const r2: any = await diagnosticar({ db, agora: () => AGORA }, 'rafael maqloc');
  assert.ok(r2.usuarios.some((u: any) => u.uid === 'raf3' && u.repetido), '"Rafael" entra como repetido de "Rafael - MAQLOC"');
  assert.ok(r2.indicacoes.some((i: any) => i.id === 'i_raf3'), 'a venda do cadastro repetido aparece');
  assert.equal(r2.varias_contas, true);
  assert.equal(r2.conta_escolhida, null);
  assert.ok(r2.avisos_gerais.some((a: string) => a.includes('Escolha abaixo a conta')));
});

test('CONTA ESCOLHIDA: tudo o que está em outra conta aparece com Transferir', async () => {
  const db = cenarioRafael();
  db.dados.indications.i_raf2 = { status: 'sold', client_name: 'Venda na conta 2', external_seller_uid: 'raf2', external_seller_name: 'rafael maqloc', commissioned_products: PRODUTOS };
  db.dados.commissions.i_raf2 = { indication_id: 'i_raf2', external_seller_uid: 'raf2', external_seller_name: 'rafael maqloc', value: 500, status: 'waiting_nf', month: 11, year: 2026 };
  const r: any = await diagnosticar({ db, agora: () => AGORA }, 'rafael maqloc', { conta: 'raf' });
  assert.equal(r.conta_escolhida, 'raf');
  const ind = r.indicacoes.find((i: any) => i.id === 'i_raf2');
  assert.equal(ind.conta, 'raf2');
  assert.equal(ind.fora_da_conta, true);
  assert.equal(ind.falta.find((f: any) => f.codigo === 'conta_repetida').acao, 'transferir');
  assert.equal(ind.comissoes[0].conta_nome, 'rafael maqloc');
  const ok = r.indicacoes.find((i: any) => i.id === 'i_ok');
  assert.equal(ok.fora_da_conta, false);
  assert.ok(!ok.falta.some((f: any) => f.acao === 'transferir'));
  // comissão em outro código que a indicação: transferir
  db.dados.commissions.i_ok.external_seller_uid = 'raf2';
  const r3: any = await diagnosticar({ db, agora: () => AGORA }, 'rafael maqloc', { conta: 'raf' });
  assert.equal(r3.indicacoes.find((i: any) => i.id === 'i_ok').falta.find((f: any) => f.codigo === 'comissao_outro_uid').acao, 'transferir');
  // conta que não está na busca é ignorada
  const r4: any = await diagnosticar({ db, agora: () => AGORA }, 'rafael maqloc', { conta: 'car' });
  assert.equal(r4.conta_escolhida, null);
});

// ---------- Transferir ----------
test('TRANSFERIR: indicação e comissões mudam juntas, o fechamento aguardando NF perde a comissão, e o histórico registra', async () => {
  const db = cenarioRafael();
  db.dados.commissions.i_ok.external_seller_email = 'rafael@maqloc.com.br';
  db.dados.commissions.legado = { indication_id: 'i_ok', external_seller_uid: 'raf', external_seller_name: 'Rafael - MAQLOC', value: 100, status: 'waiting_nf', month: 11, year: 2026 };
  db.dados.monthly_statements.raf_11_2026 = { seller_uid: 'raf', month: 11, year: 2026, status: 'waiting_nf', total_value: 6100, commission_ids: ['i_ok', 'legado', 'outra'] };
  const deps = { db, arrayUnion, agora: () => AGORA };
  const r: any = await transferirIndicacao(deps, 'i_ok', 'raf2', ADMIN);
  assert.deepEqual(r, { ok: true, uid: 'raf2', nome: 'rafael maqloc', comissoes: 2 });
  const ind = db.dados.indications.i_ok;
  assert.equal(ind.external_seller_uid, 'raf2');
  assert.equal(ind.external_seller_email, 'rafa.maqloc@gmail.com');
  assert.match(ind.negotiation_history[0].content, /transferida.*antes Rafael - MAQLOC \(raf\), agora rafael maqloc \(raf2\).*2 comissões/);
  assert.doesNotMatch(ind.negotiation_history[0].content, /%|\u2014/);
  assert.equal(db.dados.commissions.i_ok.external_seller_uid, 'raf2');
  assert.equal(db.dados.commissions.i_ok.external_seller_email, 'rafa.maqloc@gmail.com', 'e-mail só onde o campo existe');
  assert.equal(db.dados.commissions.legado.external_seller_uid, 'raf2');
  assert.ok(!('external_seller_email' in db.dados.commissions.legado));
  assert.equal(db.dados.commissions.i_ok.transferred_from_uid, 'raf');
  assert.deepEqual(db.dados.monthly_statements.raf_11_2026.commission_ids, ['outra']);
  assert.equal(db.dados.monthly_statements.raf_11_2026.total_value, 0);
  await assert.rejects(transferirIndicacao(deps, 'i_ok', 'raf2', ADMIN), /já estão na conta/);
});

test('TRANSFERIR recusa comissão paga, com NF enviada ou em fechamento aguardando pagamento, e perfil da equipe', async () => {
  const deps = (db: any) => ({ db, arrayUnion, agora: () => AGORA });
  let db = cenarioRafael();
  db.dados.commissions.i_ok.status = 'paid';
  await assert.rejects(transferirIndicacao(deps(db), 'i_ok', 'raf2', ADMIN), /já está paga.*Não dá para transferir/);
  db = cenarioRafael();
  db.dados.commissions.i_ok.status = 'waiting_payment';
  await assert.rejects(transferirIndicacao(deps(db), 'i_ok', 'raf2', ADMIN), /nota fiscal já enviada/);
  db = cenarioRafael();
  db.dados.monthly_statements.raf_11_2026 = { seller_uid: 'raf', seller_name: 'Rafael - MAQLOC', month: 11, year: 2026, status: 'waiting_payment', commission_ids: [] };
  await assert.rejects(transferirIndicacao(deps(db), 'i_ok', 'raf2', ADMIN), /fechamento de 11\/2026.*aguardando pagamento/);
  db = cenarioRafael();
  db.dados.monthly_statements.outro_id = { seller_uid: 'raf', month: 10, year: 2026, status: 'paid', commission_ids: ['i_ok'] };
  await assert.rejects(transferirIndicacao(deps(db), 'i_ok', 'raf2', ADMIN), /pago/);
  assert.equal(db.dados.indications.i_ok.external_seller_uid, 'raf', 'nada mudou');
  assert.equal(db.dados.commissions.i_ok.external_seller_uid, 'raf');
  db = cenarioRafael();
  await assert.rejects(transferirIndicacao(deps(db), 'i_ok', 'gis', ADMIN), /não recebe comissão/);
  await assert.rejects(transferirIndicacao(deps(db), '', 'raf2', ADMIN), (e: any) => e.status === 400);
  await assert.rejects(transferirIndicacao(deps(db), 'i_ok', '', ADMIN), (e: any) => e.status === 400);
  // sem comissão também funciona (vira um "ligar")
  await transferirIndicacao(deps(db), 'i_nome', 'raf', ADMIN);
  assert.equal(db.dados.indications.i_nome.external_seller_uid, 'raf');
});

test('LIGAR recusa perfil da equipe e indicação vazia', async () => {
  const db = cenarioRafael();
  const deps = { db, arrayUnion, agora: () => AGORA };
  await assert.rejects(ligarParceiro(deps, 'i_nome', 'gis', ADMIN), /não recebe comissão/);
  await assert.rejects(ligarParceiro(deps, '', 'raf', ADMIN), (e: any) => e.status === 400);
  await assert.rejects(previaGeracao(deps, ''), (e: any) => e.status === 400);
  await assert.rejects(gerarComissao(deps, '', ADMIN), (e: any) => e.status === 400);
  assert.ok(!db.dados.indications.i_nome.external_seller_uid);
});

// ---------- Conta provisória virando definitiva ----------
test('PROVISÓRIO: comissões e fechamentos vão para o uid definitivo no mesmo lote', async () => {
  const db = bancoFalso({
    commissions: {
      c1: { indication_id: 'i1', external_seller_uid: 'tmp', value: 100, month: 11, year: 2026 },
      c2: { indication_id: 'i2', external_seller_uid: 'outro', value: 50 },
    },
    monthly_statements: {
      tmp_10_2026: { id: 'tmp_10_2026', seller_uid: 'tmp', month: 10, year: 2026, status: 'paid', total_value: 300, commission_ids: ['a'] },
      tmp_11_2026: { seller_uid: 'tmp', month: 11, year: 2026, status: 'waiting_nf', total_value: 100, commission_ids: ['c1'] },
      real_11_2026: { seller_uid: 'real', month: 11, year: 2026, status: 'waiting_nf', total_value: 40, commission_ids: ['z'] },
      sem_uid_no_id: { seller_uid: 'tmp', month: 9, year: 2026, status: 'paid' },
    },
  });
  const lote = db.batch();
  const r = await moverComissoesDoProvisorio(db, lote, 'tmp', 'real', '2026-10-19T12:00:00Z');
  assert.ok(db.dados.commissions.c1.external_seller_uid === 'tmp', 'nada grava antes do commit');
  await lote.commit();
  assert.deepEqual(r, { comissoes: 1, fechamentos: 3, presos: [] });
  assert.equal(db.dados.commissions.c1.external_seller_uid, 'real');
  assert.equal(db.dados.commissions.c2.external_seller_uid, 'outro');
  assert.ok(!db.dados.monthly_statements.tmp_10_2026);
  assert.deepEqual({ ...db.dados.monthly_statements.real_10_2026, updated_at: undefined }, { id: 'real_10_2026', seller_uid: 'real', month: 10, year: 2026, status: 'paid', total_value: 300, commission_ids: ['a'], updated_at: undefined });
  assert.ok(!db.dados.monthly_statements.tmp_11_2026);
  assert.deepEqual(db.dados.monthly_statements.real_11_2026.commission_ids, ['z', 'c1'], 'junta com o que o definitivo já tinha');
  assert.equal(db.dados.monthly_statements.real_11_2026.total_value, 140);
  assert.equal(db.dados.monthly_statements.sem_uid_no_id.seller_uid, 'real', 'id sem o uid: só troca o campo');
  assert.deepEqual(await moverComissoesDoProvisorio(db, db.batch(), 'x', 'x', ''), { comissoes: 0, fechamentos: 0, presos: [] });
});

// ---------- Trocar Indicador numa venda faturada ----------
test('TROCAR INDICADOR: venda faturada sem comissão vai para regional ou gerente; com comissão, só para parceiro', async () => {
  const deps = (db: any) => ({ db, arrayUnion, agora: () => AGORA });
  const tela = { semComissaoQualquerDestino: true };
  let db = cenarioRafael();
  db.dados.users.reg = { uid: 'reg', name: 'Regional Sul', email: 'REG@roderbrasil.com.br', role: 'standard_seller' };
  // i_sem_comissao: faturada, sem documento de comissão. Regional para regional e para a gerente.
  db.dados.indications.i_sem_comissao.external_seller_uid = 'reg';
  db.dados.indications.i_sem_comissao.external_seller_name = 'Regional Sul';
  const r: any = await transferirIndicacao(deps(db), 'i_sem_comissao', 'gis', ADMIN, 'Trocar Indicador', tela);
  assert.deepEqual(r, { ok: true, uid: 'gis', nome: 'Gislene', comissoes: 0 });
  assert.equal(db.dados.indications.i_sem_comissao.external_seller_uid, 'gis');
  assert.equal(db.dados.indications.i_sem_comissao.external_seller_email, 'gislene@roderbrasil.com.br');
  // gerente sem cadastro (uid sintético da tela): vale com o nome informado
  await transferirIndicacao(deps(db), 'i_sem_comissao', 'gislene_manager_direct', ADMIN, 'Trocar Indicador', { ...tela, nomeInformado: 'Gislene' });
  assert.equal(db.dados.indications.i_sem_comissao.external_seller_uid, 'gislene_manager_direct');
  assert.equal(db.dados.indications.i_sem_comissao.external_seller_name, 'Gislene');
  await assert.rejects(transferirIndicacao(deps(db), 'i_sem_comissao', 'nao_existe', ADMIN, 'Trocar Indicador', tela), (e: any) => e.status === 404);
  // com comissão lançada: para a equipe é recusado, e nada muda
  await assert.rejects(transferirIndicacao(deps(db), 'i_ok', 'gis', ADMIN, 'Trocar Indicador', tela), (e: any) => e.status === 409 && /já tem comissão lançada/.test(e.message));
  assert.equal(db.dados.indications.i_ok.external_seller_uid, 'raf');
  assert.equal(db.dados.commissions.i_ok.external_seller_uid, 'raf');
  // o diagnóstico continua exigindo parceiro mesmo sem comissão
  db = cenarioRafael();
  await assert.rejects(transferirIndicacao(deps(db), 'i_sem_comissao', 'gis', ADMIN), /não recebe comissão/);
});

test('TRANSFERIR recusa quando o fechamento do mês na conta NOVA está pago ou aguardando pagamento', async () => {
  const deps = (db: any) => ({ db, arrayUnion, agora: () => AGORA });
  for (const status of ['paid', 'waiting_payment']) {
    const db = cenarioRafael();
    db.dados.monthly_statements.raf2_11_2026 = { seller_uid: 'raf2', seller_name: 'rafael maqloc', month: 11, year: 2026, status, total_value: 800, commission_ids: ['x'] };
    await assert.rejects(transferirIndicacao(deps(db), 'i_ok', 'raf2', ADMIN), (e: any) => e.status === 409 && /fechamento de 11\/2026.*rafael maqloc.*como paga sem ter sido paga/.test(e.message));
    assert.equal(db.dados.commissions.i_ok.external_seller_uid, 'raf', 'nada mudou');
    assert.equal(db.dados.indications.i_ok.external_seller_uid, 'raf');
  }
  // aberto (aguardando NF) na conta nova: passa
  const db = cenarioRafael();
  db.dados.monthly_statements.raf2_11_2026 = { seller_uid: 'raf2', month: 11, year: 2026, status: 'waiting_nf', total_value: 800, commission_ids: ['x'] };
  await transferirIndicacao(deps(db), 'i_ok', 'raf2', ADMIN);
  assert.equal(db.dados.commissions.i_ok.external_seller_uid, 'raf2');
});

test('TRANSFERIR: fechamento antigo que fica vazio é apagado; sem lista de comissões, o total diminui', async () => {
  const deps = (db: any) => ({ db, arrayUnion, agora: () => AGORA });
  let db = cenarioRafael();
  db.dados.monthly_statements.raf_11_2026 = { seller_uid: 'raf', month: 11, year: 2026, status: 'waiting_nf', total_value: 6000, commission_ids: ['i_ok'] };
  await transferirIndicacao(deps(db), 'i_ok', 'raf2', ADMIN);
  assert.ok(!db.dados.monthly_statements.raf_11_2026, 'vazio sai');
  db = cenarioRafael();
  db.dados.monthly_statements.raf_11_2026 = { seller_uid: 'raf', month: 11, year: 2026, status: 'waiting_nf', total_value: 6500 };
  await transferirIndicacao(deps(db), 'i_ok', 'raf2', ADMIN);
  assert.equal(db.dados.monthly_statements.raf_11_2026.total_value, 500, 'sem commission_ids: tira do total do mês');
});

test('PROVISÓRIO: não junta em fechamento pago ou aguardando pagamento, e a comissão fica com a marca', async () => {
  for (const status of ['paid', 'waiting_payment']) {
    const db = bancoFalso({
      commissions: {
        c1: { indication_id: 'i1', external_seller_uid: 'tmp', value: 100, month: 11, year: 2026, status: 'waiting_nf' },
        c2: { indication_id: 'i2', external_seller_uid: 'tmp', value: 70, month: 12, year: 2026, status: 'waiting_nf' },
      },
      monthly_statements: {
        tmp_11_2026: { seller_uid: 'tmp', month: 11, year: 2026, status: 'waiting_nf', total_value: 100, commission_ids: ['c1'] },
        real_11_2026: { seller_uid: 'real', month: 11, year: 2026, status, total_value: 40, commission_ids: ['z'] },
        real_12_2026: { seller_uid: 'real', month: 12, year: 2026, status, total_value: 10, commission_ids: ['y'] },
      },
    });
    const lote = db.batch();
    const r = await moverComissoesDoProvisorio(db, lote, 'tmp', 'real', '2026-10-19T12:00:00Z', 'Rafael');
    await lote.commit();
    assert.deepEqual(r.presos, ['tmp_11_2026']);
    assert.equal(r.comissoes, 0);
    assert.deepEqual(db.dados.monthly_statements.real_11_2026.commission_ids, ['z'], 'o fechamento travado não muda');
    assert.equal(db.dados.monthly_statements.real_11_2026.total_value, 40);
    assert.ok(db.dados.monthly_statements.tmp_11_2026, 'o provisório fica, nada se perde');
    assert.equal(db.dados.commissions.c1.external_seller_uid, 'tmp');
    assert.equal(db.dados.commissions.c1.transferencia_pendente.para_uid, 'real');
    // sem fechamento no provisório, mas o do definitivo daquele mês já travado: também fica
    assert.equal(db.dados.commissions.c2.external_seller_uid, 'tmp');
    assert.ok(db.dados.commissions.c2.transferencia_pendente);
  }
});

test('PROVISÓRIO: dois provisórios do mesmo mês somam, com o nome novo, em lote de mais de 500 escritas', async () => {
  const comissoes: Record<string, any> = {};
  for (let i = 0; i < 600; i++) comissoes[`c${i}`] = { indication_id: `i${i}`, external_seller_uid: i % 2 ? 'tmpA' : 'tmpB', value: 1, month: 10, year: 2026, status: 'waiting_nf' };
  const db = bancoFalso({
    commissions: comissoes,
    monthly_statements: {
      tmpA_11_2026: { seller_uid: 'tmpA', month: 11, year: 2026, status: 'waiting_nf', total_value: 100, commission_ids: ['a'] },
      tmpB_11_2026: { seller_uid: 'tmpB', month: 11, year: 2026, total_value: 50.1, commission_ids: ['b'] },
      real_11_2026: { seller_uid: 'real', month: 11, year: 2026, total_value: 40, commission_ids: ['z'] },
    },
  });
  let maior = 0;
  const batchOriginal = db.batch;
  db.batch = () => { const b = batchOriginal(); let n = 0; const conta = (f: any) => (...a: any[]) => { n++; maior = Math.max(maior, n); return f(...a); }; return { ...b, set: conta(b.set), update: conta(b.update), delete: conta(b.delete) }; };
  const lote = loteEmPartes(db);
  const r = await moverComissoesDoProvisorio(db, lote, ['tmpA', 'tmpB'], 'real', '2026-10-19T12:00:00Z', 'Rafael');
  await lote.commit();
  assert.ok(maior <= 450, `cada parte com no máximo 450 escritas (teve ${maior})`);
  assert.equal(r.comissoes, 600);
  assert.equal(db.dados.commissions.c7.external_seller_uid, 'real');
  assert.equal(db.dados.commissions.c7.external_seller_name, 'Rafael');
  const f = db.dados.monthly_statements.real_11_2026;
  assert.deepEqual([...f.commission_ids].sort(), ['a', 'b', 'z'], 'os dois provisórios entram, nenhum por cima do outro');
  assert.equal(f.total_value, 190.1);
  assert.equal(f.status, 'waiting_nf', 'fica o status mais adiantado entre os abertos');
  assert.ok(!db.dados.monthly_statements.tmpA_11_2026 && !db.dados.monthly_statements.tmpB_11_2026);
});

// ---------- Liga os e-mails uma vez só ----------
test('E-MAILS LIGADOS UMA VEZ: liga os três, e depois o que a tela mudar fica', async () => {
  const db = bancoFalso({ settings: { notifications: { monthly_report_partners: false, manager_emails: 'g@roderbrasil.com.br' } } });
  assert.equal(await ligarEmailsComissaoUmaVez(db), 'ligado');
  const n = db.dados.settings.notifications;
  assert.equal(n.monthly_report_partners, true);
  assert.equal(n.monthly_report_directors, true);
  assert.equal(n.payment_reminder_finance, true);
  assert.equal(n.manager_emails, 'g@roderbrasil.com.br', 'merge: não apaga o resto');
  n.monthly_report_directors = false; // alguém desligou na tela
  assert.equal(await ligarEmailsComissaoUmaVez(db), 'ja_rodou');
  assert.equal(db.dados.settings.notifications.monthly_report_directors, false);
  const vazio = bancoFalso({});
  assert.equal(await ligarEmailsComissaoUmaVez(vazio), 'ligado');
  assert.equal(vazio.dados.settings.notifications.payment_reminder_finance, true);
});
