// Rotas do consultor do parceiro com um Firestore em memória. Rodar: node --import tsx --test testes-servidor/consultor-parceiro.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from 'node:http';
import { Readable } from 'node:stream';
import { criarRotasConsultorParceiro, alvoDoVideo, LIMITE_LINK_HORA, LIMITE_IP_HORA, MAX_VIDEO_PROXY } from '../server/consultorParceiro.ts';
import { querIndicar, validarTelefoneBR, lerCidadeUf, validarCnpj } from '../src/lib/consultorIndicar.ts';

const APAGAR = Symbol('apagar');

function bancoFalso(inicial: Record<string, Record<string, any>>) {
  const dados: Record<string, Record<string, any>> = structuredClone(inicial);
  let seq = 0;
  const col = (nome: string) => (dados[nome] ||= {});
  const docRef = (nome: string, id?: string): any => {
    const did = id || `auto${++seq}`;
    return {
      id: did,
      get: async () => ({ exists: did in col(nome), id: did, data: () => col(nome)[did] }),
      set: async (v: any, o?: any) => {
        const novo = o?.merge ? { ...(col(nome)[did] || {}), ...v } : { ...v };
        for (const k of Object.keys(novo)) if (novo[k] === APAGAR) delete novo[k]; // FieldValue.delete()
        col(nome)[did] = novo;
      },
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
  r.cabecalhos = {} as Record<string, string>;
  r.setHeader = (k: string, v: string) => { r.cabecalhos[k.toLowerCase()] = v; };
  r.end = (b: any) => { r.corpo = b; r.headersSent = true; return r; };
  return r;
};

function montar(quem: any = null, op: { passouLimite?: any; ipDe?: any; abrirArquivoStorage?: any } = {}) {
  const db = bancoFalso({
    users: {
      gis: { name: 'Gislene', role: 'manager', status: 'active', email: 'gislene@roderbrasil.com.br' },
      lua: { name: 'Luana Camargo', role: 'manager', status: 'active', email: 'luana@roderbrasil.com.br' },
      hel: { name: 'Heloisa', role: 'internal_seller', status: 'active', email: 'heloisa@x.com' },
      car: { name: 'Carlos Pereira', role: 'external_seller', status: 'active', email: 'carlos@gmail.com' },
      // cadastro de uma versão antiga: token ainda gravado em users (legível pela equipe)
      vel: { name: 'Velho Parceiro', role: 'external_seller', status: 'active', email: 'vel@gmail.com', consultor_link_token: 'L'.repeat(32) },
      ina: { name: 'Inativo', role: 'external_seller', status: 'inactive', email: 'ina@gmail.com' },
      reg: { name: 'Regional MT', role: 'vendedor_padrao', status: 'active', assigned_regions: ['MT'] },
    },
    consultor_links: { ['L'.repeat(32)]: { uid: 'vel', nome: 'Velho Parceiro', ativo: true, criado_em: '2026-01-01T00:00:00.000Z' } },
    products: { p3: { name: 'Cabeçotes Multifuncionais', models: [{ id: 'm4', name: 'CMF 500' }, { id: 'm5', name: 'CMF 600' }] } },
    settings: { notifications: { manager_emails: 'x@roderbrasil.com.br' } },
  });
  const emails: string[] = [];
  const quemAtual = { v: quem };
  const r = criarRotasConsultorParceiro({
    db, quemChama: async () => quemAtual.v, passouLimite: op.passouLimite || (() => false), ipDe: op.ipDe || (() => '1.1.1.1'),
    abrirArquivoStorage: op.abrirArquivoStorage,
    campoApagado: () => APAGAR,
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
  quemAtual.v = { uid: 'lua', email: 'luana@roderbrasil.com.br', role: 'manager' };
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
  // o token não fica no cadastro do usuário (a equipe lê users pelas regras do Firestore)
  assert.equal('consultor_link_token' in db.dados.users.car, false);
  assert.ok(db.dados.users.car.consultor_link_em);
  assert.equal(JSON.stringify(db.dados.users.car).includes(t2), false);
  assert.equal(db.dados.consultor_links[t2].uid, 'car');
  // pedir de novo (sem regenerar) acha o ativo pelo consultor_links
  res = await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} });
  assert.equal(res.corpo.token, t2);
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

test('link só para parceiro externo; token de outro papel não autentica', async () => {
  const { db, r, quemAtual } = montar({ uid: 'gis', email: 'g', role: 'manager' });
  for (const uid of ['hel', 'lua', 'reg']) {
    const res = await chamar(r.rotaLink, { params: { uid }, body: {} });
    assert.equal(res.statusCode, 400, uid);
  }
  assert.equal(Object.values(db.dados.consultor_links).filter((l: any) => l.uid !== 'vel').length, 0);
  // link ativo apontando para alguém da equipe (gravado à mão ou papel trocado depois)
  const tok = 'H'.repeat(32);
  db.dados.consultor_links[tok] = { uid: 'hel', ativo: true };
  assert.equal((await chamar(r.rotaResolver, { params: { token: tok } })).statusCode, 404);
  quemAtual.v = null;
  const corpo = { p: tok, equipamento: { nome: 'Garra' }, cliente: 'Cliente Y', telefone: '14 99811-5111', cidade: 'Botucatu SP' };
  assert.equal((await chamar(r.rotaIndicacao, { body: corpo })).statusCode, 401);
  assert.equal((await chamar(r.rotaLinkCliente, { body: { p: tok, pid: 'p3', mid: 'm5' } })).statusCode, 401);
  // parceiro que virou equipe: o link dele para de valer
  quemAtual.v = { uid: 'gis', email: 'g', role: 'manager' };
  const tc = (await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} })).corpo.token;
  assert.equal((await chamar(r.rotaResolver, { params: { token: tc } })).statusCode, 200);
  db.dados.users.car.role = 'internal_seller';
  assert.equal((await chamar(r.rotaResolver, { params: { token: tc } })).statusCode, 404);
});

test('cadastro antigo com token em users: vale só o consultor_links, e o campo some ao passar pela rota', async () => {
  const { db, r, quemAtual } = montar({ uid: 'gis', email: 'g', role: 'manager' });
  const velho = 'L'.repeat(32);
  // o link antigo ainda ativo em consultor_links continua valendo
  assert.equal((await chamar(r.rotaResolver, { params: { token: velho } })).statusCode, 200);
  // token só no cadastro do usuário, sem consultor_links ativo: não autentica
  const soNoUsuario = 'Z'.repeat(32);
  db.dados.users.car.consultor_link_token = soNoUsuario;
  quemAtual.v = null;
  assert.equal((await chamar(r.rotaResolver, { params: { token: soNoUsuario } })).statusCode, 404);
  assert.equal((await chamar(r.rotaIndicacao, { body: { p: soNoUsuario, equipamento: { nome: 'Garra' }, cliente: 'Cliente Z', telefone: '14 99811-5111', cidade: 'Botucatu SP' } })).statusCode, 401);
  // a gestão pede o link: devolve o mesmo token ativo e apaga o campo antigo do cadastro
  quemAtual.v = { uid: 'gis', email: 'g', role: 'manager' };
  let res = await chamar(r.rotaLink, { params: { uid: 'vel' }, body: {} });
  assert.equal(res.corpo.token, velho);
  assert.equal('consultor_link_token' in db.dados.users.vel, false);
  // regenerar desliga o antigo
  res = await chamar(r.rotaLink, { params: { uid: 'vel' }, body: { novo: true } });
  assert.notEqual(res.corpo.token, velho);
  assert.equal(db.dados.consultor_links[velho].ativo, false);
  assert.equal((await chamar(r.rotaResolver, { params: { token: velho } })).statusCode, 404);
  // o mesmo para o car (token só no usuário): gera um novo e limpa o campo
  res = await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} });
  assert.notEqual(res.corpo.token, soNoUsuario);
  assert.equal('consultor_link_token' in db.dados.users.car, false);
});

// O mesmo limitador do server.ts, na memória
function limitadorReal() {
  const limites = new Map<string, number[]>();
  return (chave: string, max: number, janelaMs: number) => {
    const agora = Date.now();
    const lista = (limites.get(chave) || []).filter(t => agora - t < janelaMs);
    lista.push(agora);
    limites.set(chave, lista);
    return lista.length > max;
  };
}

test('VÍDEO: o proxy só aceita as pastas de vídeo do catálogo no bucket do projeto, nunca um endereço qualquer', () => {
  const B = 'gen-lang-client-0708423613.firebasestorage.app';
  assert.deepEqual(alvoDoVideo(`https://firebasestorage.googleapis.com/v0/b/${B}/o/product_videos%2Fcmf.mp4?alt=media&token=x`), { tipo: 'storage', bucket: B, caminho: 'product_videos/cmf.mp4' });
  assert.deepEqual(alvoDoVideo(`https://storage.googleapis.com/${B}/model_videos/cmf.mp4`), { tipo: 'storage', bucket: B, caminho: 'model_videos/cmf.mp4' });
  assert.deepEqual(alvoDoVideo('db-file://abc_123'), { tipo: 'banco', id: 'abc_123' });
  for (const ruim of [
    'https://firebasestorage.googleapis.com/v0/b/outro-projeto.appspot.com/o/product_videos%2Fv.mp4?alt=media',
    `http://firebasestorage.googleapis.com/v0/b/${B}/o/product_videos%2Fv.mp4`,
    `https://firebasestorage.googleapis.com.evil.com/v0/b/${B}/o/product_videos%2Fv.mp4`,
    `https://evil.com/v0/b/${B}/o/product_videos%2Fv.mp4`,
    `https://user:x@firebasestorage.googleapis.com/v0/b/${B}/o/product_videos%2Fv.mp4`,
    `https://firebasestorage.googleapis.com:8443/v0/b/${B}/o/product_videos%2Fv.mp4`,
    // o mesmo bucket guarda fotos, fichas e anexos de indicação: fora das pastas de vídeo não sai
    `https://firebasestorage.googleapis.com/v0/b/${B}/o/indications%2Fanexo.mp4?alt=media`,
    `https://firebasestorage.googleapis.com/v0/b/${B}/o/videos%2Fcmf.mp4?alt=media`,
    `https://storage.googleapis.com/${B}/products/foto.jpg`,
    `https://firebasestorage.googleapis.com/v0/b/${B}/o/product_videos%2F..%2Findications%2Fx.mp4?alt=media`,
    `https://storage.googleapis.com/${B}/product_videos//x.mp4`,
    `https://firebasestorage.googleapis.com/v0/b/${B}/o/xproduct_videos%2Fv.mp4?alt=media`,
    'http://169.254.169.254/latest/meta-data',
    'http://localhost:3000/uploads/x.mp4',
    'db-file://../etc/passwd',
    'file:///etc/passwd',
    '',
  ]) assert.equal(alvoDoVideo(ruim), null, ruim);
});

// Resposta HTTP de verdade (o proxy usa pipeline, que precisa de um stream de escrita real), com o
// status/json do Express: o json só grava o Content-Type se ninguém gravou antes, como no Express.
async function servidorDe(rota: any) {
  const srv = http.createServer((req: any, res: any) => {
    res.status = (c: number) => { res.statusCode = c; return res; };
    res.json = (b: any) => { if (!res.getHeader('content-type')) res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(b)); return res; };
    req.query = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
    rota(req, res);
  });
  await new Promise<void>(ok => srv.listen(0, '127.0.0.1', () => ok()));
  const base = `http://127.0.0.1:${(srv.address() as any).port}`;
  const pedir = (q: Record<string, string>) => fetch(`${base}/?${new URLSearchParams(q)}`);
  return { srv, pedir, fechar: () => new Promise<void>(ok => srv.close(() => ok())) };
}

const BV = 'gen-lang-client-0708423613.firebasestorage.app';
const urlSt = (c: string) => `https://firebasestorage.googleapis.com/v0/b/${BV}/o/${encodeURIComponent(c)}?alt=media`;

test('VÍDEO: só baixa quem pode indicar, só o vídeo do equipamento, só vídeo, e até 40 MB', async () => {
  const arquivos: Record<string, any> = {
    'product_videos/ok.mp4': { contentType: 'video/mp4', tamanho: 5 },
    'model_videos/m4.mp4': { contentType: 'video/mp4', tamanho: 5 },
    'product_videos/foto.jpg': { contentType: 'image/jpeg', tamanho: 5 },
    'product_videos/grande.mp4': { contentType: 'video/mp4', tamanho: MAX_VIDEO_PROXY + 1 },
    'product_videos/outro.mp4': { contentType: 'video/mp4', tamanho: 5 },
  };
  const abertos: string[] = [];
  const { db, r, quemAtual } = montar({ uid: 'gis', email: 'g', role: 'manager' }, {
    abrirArquivoStorage: async (bucket: string, caminho: string) => {
      assert.equal(bucket, BV);
      const a = arquivos[caminho];
      if (!a) return null;
      abertos.push(caminho);
      return { ...a, stream: Readable.from([Buffer.from('BYTES')]) };
    },
  });
  // um produto por caso: o vídeo pedido tem de ser o cadastrado no equipamento
  db.dados.products.pv = { name: 'Produto', video_url: urlSt('product_videos/ok.mp4'), models: [{ id: 'm4', name: 'Modelo', video_url: urlSt('model_videos/m4.mp4') }, { id: 'm9', name: 'Sem vídeo' }] };
  db.dados.products.pf = { name: 'Foto', video_url: urlSt('product_videos/foto.jpg') };
  db.dados.products.pg = { name: 'Grande', video_url: urlSt('product_videos/grande.mp4') };
  db.dados.products.pn = { name: 'Sumiu', video_url: urlSt('product_videos/nao.mp4') };
  db.dados.products.pb = { name: 'Banco', video_url: 'db-file://vid' };
  db.dados.products.pi = { name: 'Banco foto', video_url: 'db-file://img' };
  db.dados.app_files = { vid: { data: 'data:video/mp4;base64,' + Buffer.from('abc').toString('base64') }, img: { data: 'data:image/png;base64,AAAA' }, anexo: { data: 'data:video/mp4;base64,AAAA' } };
  const tok = (await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} })).corpo.token;
  quemAtual.v = null;
  const { pedir, fechar } = await servidorDe(r.rotaVideoArquivo);
  try {
    const st = async (q: Record<string, string>) => (await pedir(q)).status;
    // sem link e sem login: não baixa
    assert.equal(await st({ url: urlSt('product_videos/ok.mp4'), pid: 'pv' }), 401);
    // endereço de fora: recusa antes de qualquer coisa
    assert.equal(await st({ url: 'https://evil.com/v.mp4', pid: 'pv', p: tok }), 400);
    // sem equipamento: recusa
    assert.equal(await st({ url: urlSt('product_videos/ok.mp4'), p: tok }), 400);
    let res = await pedir({ url: urlSt('product_videos/ok.mp4'), pid: 'pv', p: tok });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'video/mp4');
    assert.equal(await res.text(), 'BYTES');
    // vídeo do modelo; e o modelo sem vídeo próprio herda o do produto
    assert.equal(await st({ url: urlSt('model_videos/m4.mp4'), pid: 'pv', mid: 'm4', p: tok }), 200);
    assert.equal(await st({ url: urlSt('product_videos/ok.mp4'), pid: 'pv', mid: 'm9', p: tok }), 200);
    // arquivo da pasta de vídeo, mas de outro equipamento (ou de nenhum): não sai
    assert.equal(await st({ url: urlSt('product_videos/outro.mp4'), pid: 'pv', p: tok }), 403);
    assert.equal(await st({ url: urlSt('product_videos/ok.mp4'), pid: 'pv', mid: 'm4', p: tok }), 403);
    assert.equal(await st({ url: urlSt('product_videos/ok.mp4'), pid: 'naoexiste', p: tok }), 404);
    assert.equal(await st({ url: urlSt('product_videos/ok.mp4'), pid: 'pv', mid: 'mX', p: tok }), 404);
    assert.equal(await st({ url: urlSt('product_videos/foto.jpg'), pid: 'pf', p: tok }), 415);
    assert.equal(await st({ url: urlSt('product_videos/grande.mp4'), pid: 'pg', p: tok }), 413);
    assert.equal(await st({ url: urlSt('product_videos/nao.mp4'), pid: 'pn', p: tok }), 404);
    assert.ok(!abertos.includes('product_videos/outro.mp4'), 'o vídeo de outro equipamento nem chega a ser aberto');
    // arquivo do banco: só o referenciado pelo equipamento, e só data:video/
    res = await pedir({ url: 'db-file://vid', pid: 'pb', p: tok });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'video/mp4');
    assert.equal(await res.text(), 'abc');
    assert.equal(await st({ url: 'db-file://img', pid: 'pi', p: tok }), 415);
    // app_files guarda fotos e anexos: um id que nenhum equipamento usa como vídeo não sai, mesmo sendo vídeo
    assert.equal(await st({ url: 'db-file://anexo', pid: 'pb', p: tok }), 403);
    // login de quem não indica: não baixa
    quemAtual.v = { uid: 'ina', email: 'ina@gmail.com', role: 'external_seller' };
    assert.equal(await st({ url: urlSt('product_videos/ok.mp4'), pid: 'pv' }), 403);
  } finally { await fechar(); }
});

test('VÍDEO: erro do Storage antes do primeiro pedaço sai como JSON, e não como "video/mp4"', async () => {
  const { db, r, quemAtual } = montar({ uid: 'gis', email: 'g', role: 'manager' }, {
    abrirArquivoStorage: async () => ({
      contentType: 'video/mp4', tamanho: 5,
      stream: new Readable({ read() { setTimeout(() => this.destroy(new Error('Storage caiu')), 5); } }),
    }),
  });
  db.dados.products.pv = { name: 'Produto', video_url: urlSt('product_videos/ok.mp4') };
  const tok = (await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} })).corpo.token;
  quemAtual.v = null;
  const { pedir, fechar } = await servidorDe(r.rotaVideoArquivo);
  try {
    const res = await pedir({ url: urlSt('product_videos/ok.mp4'), pid: 'pv', p: tok });
    assert.equal(res.status, 500);
    assert.match(String(res.headers.get('content-type')), /^application\/json/);
    assert.equal((await res.json()).error, 'Não consegui baixar o vídeo.');
  } finally { await fechar(); }
});

test('VÍDEO: o celular desistiu no meio, a leitura do Storage é destruída junto', async () => {
  let fonte: any = null;
  let aoDestruir = () => {};
  const destruida = new Promise<void>(ok => { aoDestruir = ok; });
  const { db, r, quemAtual } = montar({ uid: 'gis', email: 'g', role: 'manager' }, {
    abrirArquivoStorage: async () => {
      // um pedaço agora e o resto "nunca chega": só para se o cliente fechar
      let mandou = false;
      fonte = new Readable({
        read() { if (!mandou) { mandou = true; this.push(Buffer.alloc(1024, 1)); } },
        destroy(err, cb) { aoDestruir(); cb(err); },
      });
      return { contentType: 'video/mp4', tamanho: 10 * 1024 * 1024, stream: fonte };
    },
  });
  db.dados.products.pv = { name: 'Produto', video_url: urlSt('product_videos/ok.mp4') };
  const tok = (await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} })).corpo.token;
  quemAtual.v = null;
  const { pedir, fechar } = await servidorDe(r.rotaVideoArquivo);
  try {
    const res = await pedir({ url: urlSt('product_videos/ok.mp4'), pid: 'pv', p: tok });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'video/mp4');
    const leitor = res.body!.getReader();
    await leitor.read();
    await leitor.cancel();
    await Promise.race([destruida, new Promise((_, n) => setTimeout(() => n(new Error('a leitura do Storage continuou aberta')), 3000))]);
    assert.equal(fonte.destroyed, true);
  } finally { await fechar(); }
});

test('LIMITE POR DONO: um parceiro que passou do limite não trava outro no mesmo IP', async () => {
  const { db, r, quemAtual } = montar({ uid: 'gis', email: 'g', role: 'manager' }, { passouLimite: limitadorReal() });
  db.dados.users.out = { name: 'Outro Parceiro', role: 'external_seller', status: 'active', email: 'out@gmail.com' };
  const tA = (await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} })).corpo.token;
  const tB = (await chamar(r.rotaLink, { params: { uid: 'out' }, body: {} })).corpo.token;
  quemAtual.v = null;
  for (let i = 0; i < LIMITE_LINK_HORA; i++) assert.equal((await chamar(r.rotaLinkCliente, { body: { p: tA, pid: 'p3', mid: 'm5' } })).statusCode, 200, `A ${i}`);
  assert.equal((await chamar(r.rotaLinkCliente, { body: { p: tA, pid: 'p3', mid: 'm5' } })).statusCode, 429);
  // o mesmo IP, outro dono: passa
  assert.equal((await chamar(r.rotaLinkCliente, { body: { p: tB, pid: 'p3', mid: 'm5' } })).statusCode, 200);
  assert.ok(LIMITE_IP_HORA >= 200);
});

test('LIMITE POR IP: continua como teto alto de segurança', async () => {
  const { r } = montar(null, { passouLimite: limitadorReal() });
  // token falso dá 401 até o teto do IP; passando dele, 429
  for (let i = 0; i < LIMITE_IP_HORA; i++) assert.equal((await chamar(r.rotaLinkCliente, { body: { p: 'X'.repeat(32), pid: 'p3' } })).statusCode, 401);
  assert.equal((await chamar(r.rotaLinkCliente, { body: { p: 'X'.repeat(32), pid: 'p3' } })).statusCode, 429);
});

test('VÍDEO DA BIBLIOTECA: "Enviar o vídeo" baixa o vídeo do cadastro (vid), só ele e só ativo', async () => {
  const arquivos: Record<string, any> = {
    'consultor_videos/campo.mp4': { contentType: 'video/mp4', tamanho: 5 },
    'consultor_videos/outro.mp4': { contentType: 'video/mp4', tamanho: 5 },
    'consultor_videos/capas/c.jpg': { contentType: 'image/jpeg', tamanho: 5 },
  };
  const { db, r, quemAtual } = montar({ uid: 'gis', email: 'g', role: 'manager' }, {
    abrirArquivoStorage: async (_b: string, caminho: string) => {
      const a = arquivos[caminho];
      return a ? { ...a, stream: Readable.from([Buffer.from('BYTES')]) } : null;
    },
  });
  db.dados.consultor_videos = {
    v1: { produto_id: 'p3', video_url: urlSt('consultor_videos/campo.mp4'), ativo: true },
    v2: { produto_id: 'p3', video_url: urlSt('consultor_videos/outro.mp4'), ativo: false },
    v3: { produto_id: 'p3', video_url: urlSt('consultor_videos/capas/c.jpg'), ativo: true },
    v4: { produto_id: 'pblq', video_url: urlSt('consultor_videos/campo.mp4'), ativo: true },
  };
  db.dados.products.pblq = { name: 'Bloqueado', is_blocked: true };
  const tok = (await chamar(r.rotaLink, { params: { uid: 'car' }, body: {} })).corpo.token;
  quemAtual.v = null;
  const { pedir, fechar } = await servidorDe(r.rotaVideoArquivo);
  try {
    const st = async (q: Record<string, string>) => (await pedir(q)).status;
    // a pasta da biblioteca passou a valer no endereço
    assert.deepEqual(alvoDoVideo(urlSt('consultor_videos/campo.mp4')), { tipo: 'storage', bucket: BV, caminho: 'consultor_videos/campo.mp4' });
    const res = await pedir({ url: urlSt('consultor_videos/campo.mp4'), vid: 'v1', pid: 'p3', p: tok });
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'BYTES');
    // sem link e sem login: não baixa
    assert.equal(await st({ url: urlSt('consultor_videos/campo.mp4'), vid: 'v1' }), 401);
    // o endereço tem de ser o do cadastro pedido
    assert.equal(await st({ url: urlSt('consultor_videos/outro.mp4'), vid: 'v1', p: tok }), 403);
    // vídeo desligado ou inexistente não sai
    assert.equal(await st({ url: urlSt('consultor_videos/outro.mp4'), vid: 'v2', p: tok }), 404);
    assert.equal(await st({ url: urlSt('consultor_videos/campo.mp4'), vid: 'naoexiste', p: tok }), 404);
    // equipamento bloqueado no catálogo: o vídeo dele não sai
    assert.equal(await st({ url: urlSt('consultor_videos/campo.mp4'), vid: 'v4', p: tok }), 404);
    // id com caractere estranho: recusa antes de ler o banco
    assert.equal(await st({ url: urlSt('consultor_videos/campo.mp4'), vid: '../v1', p: tok }), 400);
    // a capa mora na pasta, mas não é vídeo
    assert.equal(await st({ url: urlSt('consultor_videos/capas/c.jpg'), vid: 'v3', p: tok }), 415);
    // sem vid, o arquivo da biblioteca não passa como vídeo de equipamento
    assert.equal(await st({ url: urlSt('consultor_videos/campo.mp4'), pid: 'p3', p: tok }), 403);
  } finally { await fechar(); }
});
