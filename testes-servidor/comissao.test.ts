// Comissão do parceiro: conta compartilhada, diagnóstico, geração e e-mails mensais.
// Rodar: node --import tsx --test testes-servidor/comissao.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calcularComissao, mesDaComissao, taxaDoParceiro, papelComissionavel, temParceiroSemUid,
} from '../src/lib/calculoComissao.ts';
import { diagnosticar, gerarComissao, previaGeracao, ligarParceiro, nomeCasa, normalizar } from '../server/diagnosticoComissao.ts';
import {
  comissoesDoCiclo, agruparPorParceiro, comTravaMensal, relatorioParceirosDia1, lembreteNfDia5, lembreteFinanceiroDia7, relatorioDiretoriaDia1, mesEmBrasilia,
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
    };
  }
  const consulta = (n: string, f: [string, string, any][]): any => ({
    _consulta: true,
    where: (c: string, op: string, v: any) => consulta(n, [...f, [c, op, v]]),
    select: () => consulta(n, f),
    get: async () => {
      const docs = Object.keys(col(n)).filter(id => f.every(([c, op, v]) => {
        const d = col(n)[id];
        return op === '==' ? d[c] === v : op === 'in' ? v.includes(d[c]) : false;
      })).map(id => snapDoc(n, id));
      return { docs, empty: !docs.length, size: docs.length };
    },
  });
  const db: any = {
    dados,
    collection: (n: string) => ({ doc: (id?: string) => docRef(n, id), where: (c: string, op: string, v: any) => consulta(n, [[c, op, v]]), select: () => consulta(n, []), get: () => consulta(n, []).get() }),
    runTransaction: async (fn: any) => {
      const escritas: (() => Promise<any>)[] = [];
      const tx = {
        get: (r: any) => r.get(),
        set: (r: any, v: any, o?: any) => { escritas.push(() => r.set(v, o)); },
        update: (r: any, v: any) => { escritas.push(() => r.update(v)); },
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
  assert.deepEqual(r1.usuarios.map((u: any) => u.uid), ['raf']);
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
  assert.match(raf.subject, /outubro de 2026: R\$\s7\.200,00/);
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
