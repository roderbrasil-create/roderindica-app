// Rotas do consultor do parceiro com um Firestore em memória. Rodar: node --import tsx --test testes-servidor/consultor-parceiro.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { criarRotasConsultorParceiro } from '../server/consultorParceiro.ts';
import { querIndicar, validarTelefoneBR, lerCidadeUf, validarCnpj } from '../src/lib/consultorIndicar.ts';

function bancoFalso(inicial: Record<string, Record<string, any>>) {
  const dados: Record<string, Record<string, any>> = JSON.parse(JSON.stringify(inicial));
  let seq = 0;
  const col = (nome: string) => (dados[nome] ||= {});
  const docRef = (nome: string, id?: string): any => {
    const did = id || `auto${++seq}`;
    return {
      id: did,
      get: async () => ({ exists: did in col(nome), id: did, data: () => col(nome)[did] }),
      set: async (v: any, o?: any) => { col(nome)[did] = o?.merge ? { ...(col(nome)[did] || {}), ...v } : v; },
    };
  };
  const consulta = (nome: string, filtros: [string, string, any][]): any => ({
    where: (c: string, op: string, v: any) => consulta(nome, [...filtros, [c, op, v]]),
    get: async () => {
      const docs = Object.entries(col(nome)).filter(([, d]) => filtros.every(([c, op, v]) =>
        op === '==' ? d[c] === v : op === 'in' ? v.includes(d[c]) : false)).map(([id, d]) => ({ id, data: () => d }));
      return { docs, empty: !docs.length, size: docs.length };
    },
  });
  const db = {
    dados,
    collection: (nome: string) => ({ doc: (id?: string) => docRef(nome, id), where: (c: string, op: string, v: any) => consulta(nome, [[c, op, v]]) }),
    batch: () => { const ops: any[] = []; return { set: (r: any, v: any, o?: any) => ops.push([r, v, o]), commit: async () => { for (const [r, v, o] of ops) await r.set(v, o); } }; },
  };
  return db;
}

const resFalso = () => {
  const r: any = { statusCode: 200, corpo: null, headersSent: false };
  r.status = (c: number) => { r.statusCode = c; return r; };
  r.json = (b: any) => { r.corpo = b; r.headersSent = true; return r; };
  r.setHeader = () => {};
  return r;
};

function montar(quem: any = null) {
  const db = bancoFalso({
    users: {
      gis: { name: 'Gislene', role: 'manager', status: 'active', email: 'gislene@roderbrasil.com.br' },
      lua: { name: 'Luana Camargo', role: 'triagem', status: 'active', email: 'luana@roderbrasil.com.br' },
      hel: { name: 'Heloisa', role: 'internal_seller', status: 'active', email: 'heloisa@x.com' },
      car: { name: 'Carlos Pereira', role: 'external_seller', status: 'active', email: 'carlos@gmail.com' },
      ina: { name: 'Inativo', role: 'external_seller', status: 'inactive', email: 'ina@gmail.com' },
      reg: { name: 'Regional MT', role: 'vendedor_padrao', status: 'active', assigned_regions: ['MT'] },
    },
    products: { p3: { name: 'Cabeçotes Multifuncionais', models: [{ id: 'm4', name: 'CMF 500' }, { id: 'm5', name: 'CMF 600' }] } },
    settings: { notifications: { manager_emails: 'x@roderbrasil.com.br' } },
  });
  const emails: string[] = [];
  const quemAtual = { v: quem };
  const r = criarRotasConsultorParceiro({
    db, quemChama: async () => quemAtual.v, passouLimite: () => false, ipDe: () => '1.1.1.1',
    criarLinkCurto: async (uid, pid, mid) => `C${uid}${pid}${mid}`.slice(0, 8).toUpperCase(),
    enviarEmail: async (to) => { emails.push(to); },
  });
  return { db, r, emails, quemAtual };
}

const chamar = async (fn: any, req: any) => { const res = resFalso(); await fn(req, res); return res; };

test('regras de texto', () => {
  assert.equal(validarTelefoneBR('(66) 99999-1234').ok, true);
  assert.equal((validarTelefoneBR('+55 66 99999 1234') as any).formatado, '(66) 99999-1234');
  assert.equal(validarTelefoneBR('66 89999 1234').ok, false);
  assert.equal(validarTelefoneBR('20 99999 1234').ok, false);
  assert.equal(validarTelefoneBR('1433334444').ok, true);
  assert.deepEqual(lerCidadeUf('Sorriso MT'), { cidade: 'Sorriso', uf: 'MT' });
  assert.deepEqual(lerCidadeUf('Ji-Paraná - RO'), { cidade: 'Ji-Paraná', uf: 'RO' });
  assert.deepEqual(lerCidadeUf('Campo Grande, Mato Grosso do Sul'), { cidade: 'Campo Grande', uf: 'MS' });
  assert.equal(lerCidadeUf('Sorriso'), null);
  assert.equal(lerCidadeUf('Sorriso XX'), null);
  assert.equal(validarCnpj('11.222.333/0001-81').ok, true);
  assert.equal(validarCnpj('11.222.333/0001-80').ok, false);
  assert.equal(querIndicar('Quero fazer uma indicação de cabeçote'), true);
  assert.equal(querIndicar('indicar'), true);
  assert.equal(querIndicar('vou mandar uma indicação'), true);
  assert.equal(querIndicar('Qual garra você indica para picador?'), false);
  assert.equal(querIndicar('O que indicar para picador de 600 cv?'), false);
});

test('só a gestão gera link; regenerar desliga o antigo', async () => {
  const { db, r, quemAtual } = montar({ uid: 'car', email: 'carlos@gmail.com', role: 'external_seller' });
  let res = await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} });
  assert.equal(res.statusCode, 403);
  quemAtual.v = { uid: 'hel', email: 'heloisa@x.com', role: 'internal_seller' };
  res = await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} });
  assert.equal(res.statusCode, 403);
  quemAtual.v = { uid: 'lua', email: 'luana@roderbrasil.com.br', role: 'triagem' };
  res = await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} });
  assert.equal(res.statusCode, 200);
  const t1 = res.corpo.token;
  assert.ok(t1.length >= 24 && /^[A-Za-z0-9_-]+$/.test(t1));
  assert.equal(res.corpo.caminho, `/consultor?p=${t1}`);
  // pedir de novo devolve o mesmo
  res = await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} });
  assert.equal(res.corpo.token, t1);
  // resolve só o nome
  let pub = await chamar(r.rotaResolver, { params: { token: t1 } });
  assert.deepEqual(pub.corpo, { ok: true, nome: 'Carlos Pereira', primeiroNome: 'Carlos' });
  // regenerar
  quemAtual.v = { uid: 'gis', email: 'g', role: 'manager' };
  res = await chamar(r.rotaLink, { params: { uid: 'car' }, body: { novo: true } });
  const t2 = res.corpo.token;
  assert.notEqual(t2, t1);
  assert.equal(db.dados.consultor_links[t1].ativo, false);
  assert.equal(db.dados.users.car.consultor_link_token, t2);
  pub = await chamar(r.rotaResolver, { params: { token: t1 } });
  assert.equal(pub.statusCode, 404);
  pub = await chamar(r.rotaResolver, { params: { token: t2 } });
  assert.equal(pub.statusCode, 200);
  pub = await chamar(r.rotaResolver, { params: { token: 'curto' } });
  assert.equal(pub.statusCode, 404);
  // usuário inativo: o link não abre
  res = await chamar(r.rotaLink, { params: { uid: 'ina' }, body: {} });
  pub = await chamar(r.rotaResolver, { params: { token: res.corpo.token } });
  assert.equal(pub.statusCode, 404);
});

test('indicação pelo link do parceiro: igual à do app, no nome dele', async () => {
  const { db, r, emails, quemAtual } = montar({ uid: 'gis', email: 'g', role: 'manager' });
  const tok = (await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} })).corpo.token;
  quemAtual.v = null; // o parceiro não tem login
  const corpo = { p: tok, equipamento: { nome: 'qualquer', pid: 'p3', mid: 'm5' }, cliente: 'Fazenda Boa Vista, João', telefone: '66 99999-1234', cidade: 'Sorriso MT', cnpj: '' };
  let res = await chamar(r.rotaIndicacao, { body: corpo });
  assert.equal(res.statusCode, 200, JSON.stringify(res.corpo));
  const ind = db.dados.indications[res.corpo.id];
  assert.equal(ind.status, 'pending');
  assert.equal(ind.external_seller_uid, 'car');
  assert.equal(ind.external_seller_email, 'carlos@gmail.com');
  assert.equal(ind.external_seller_name, 'Carlos Pereira');
  assert.equal(ind.created_by_uid, 'car');
  assert.equal(ind.origin_type, 'partner');
  assert.equal(ind.origem, 'consultor');
  assert.equal(ind.items[0].product_name, 'Cabeçotes Multifuncionais - CMF 600');
  assert.equal(ind.client_phone, '(66) 99999-1234');
  assert.equal(ind.client_location, 'Sorriso - MT');
  assert.equal(ind.standard_seller_uid, 'reg');
  assert.equal(ind.internal_seller_uid, null);
  await new Promise(s => setTimeout(s, 20));
  const avisos = Object.values(db.dados.notifications || {}) as any[];
  assert.deepEqual(avisos.map(a => a.user_uid).sort(), ['gis', 'lua']);
  assert.ok(emails.includes('carlos@gmail.com') && emails.includes('gislene@roderbrasil.com.br') && emails.includes('x@roderbrasil.com.br'));
  // toque duplo: devolve a mesma
  res = await chamar(r.rotaIndicacao, { body: corpo });
  assert.equal(res.corpo.repetida, true);
  // validações
  for (const [campo, valor] of [['telefone', '123'], ['cidade', 'Sorriso'], ['cnpj', '11.222.333/0001-80'], ['cliente', 'a']]) {
    res = await chamar(r.rotaIndicacao, { body: { ...corpo, [campo]: valor } });
    assert.equal(res.statusCode, 400, campo);
  }
  // token desconhecido
  res = await chamar(r.rotaIndicacao, { body: { ...corpo, p: 'x'.repeat(30) } });
  assert.equal(res.statusCode, 401);
  // limite de 20 por dia
  for (let i = 0; i < 25; i++) {
    res = await chamar(r.rotaIndicacao, { body: { ...corpo, telefone: `66 99999-${String(1000 + i)}` } });
  }
  assert.equal(res.statusCode, 429);
  assert.equal(Object.values(db.dados.indications).filter((d: any) => d.external_seller_uid === 'car').length, 20);
});

test('login vale mais que o link; equipe vira venda direta; link para o cliente', async () => {
  const { db, r, quemAtual } = montar({ uid: 'gis', email: 'g', role: 'manager' });
  const tok = (await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} })).corpo.token;
  quemAtual.v = { uid: 'hel', email: 'heloisa@x.com', role: 'internal_seller' };
  const res = await chamar(r.rotaIndicacao, { body: { p: tok, equipamento: { nome: 'Garra de teste' }, cliente: 'Cliente X', telefone: '14 99811-5111', cidade: 'Botucatu/SP' } });
  const ind = db.dados.indications[res.corpo.id];
  assert.equal(ind.external_seller_uid, 'hel');
  assert.equal(ind.origin_type, 'direct');
  assert.equal(ind.internal_seller_uid, 'hel');
  assert.equal(ind.items[0].product_name, 'Garra de teste');
  quemAtual.v = null;
  let lc = await chamar(r.rotaLinkCliente, { body: { p: tok, pid: 'p3', mid: 'm5' } });
  assert.equal(lc.statusCode, 200);
  assert.ok(lc.corpo.codigo);
  lc = await chamar(r.rotaLinkCliente, { body: { pid: 'p3', mid: 'm5' } });
  assert.equal(lc.statusCode, 401);
  lc = await chamar(r.rotaLinkCliente, { body: { p: tok, pid: 'nao-existe' } });
  assert.equal(lc.statusCode, 404);
});
