import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtrarDestinatarios, montarConvite, LINK_CONSULTOR_EQUIPE } from '../src/lib/conviteConsultor';
import { registrarConviteConsultor } from '../server/conviteConsultor';

const usuarios = [
  { id: '1', name: 'Heloísa Lima', email: 'Heloisa@roderbrasil.com.br', role: 'internal_seller', status: 'active' },
  { id: '2', name: 'Gislene', email: 'gislene@roderbrasil.com.br', role: 'manager', status: 'active' },
  { id: '3', name: 'Jeferson Roder', email: 'jeferson@roderbrasil.com.br', role: 'admin', status: 'active' },
  { id: '4', name: 'Luana Camargo', email: 'luana@roderbrasil.com.br', role: 'triagem', status: 'active' },
  { id: '5', name: 'Parceiro', email: 'p@x.com', role: 'external_seller', status: 'active' },
  { id: '6', name: 'Financeiro', email: 'fin@roderbrasil.com.br', role: 'financial', status: 'active' },
  { id: '7', name: 'Saiu', email: 'saiu@roderbrasil.com.br', role: 'internal_seller', status: 'inactive' },
  { id: '8', name: 'Sem email', role: 'internal_seller', status: 'active' },
  { id: '9', name: 'Duplicado', email: 'heloisa@roderbrasil.com.br', role: 'internal_seller', status: 'active' },
  { id: '10', name: 'Marketing', email: 'mkt@roderbrasil.com.br', role: 'marketing', status: 'active' },
];

test('CONVITE: só comercial interno ativo, com e-mail, sem repetir', () => {
  const l = filtrarDestinatarios(usuarios);
  assert.deepEqual(l.map(d => d.email).sort(), ['gislene@roderbrasil.com.br', 'heloisa@roderbrasil.com.br', 'jeferson@roderbrasil.com.br', 'luana@roderbrasil.com.br']);
  assert.ok(!l.some(d => ['external_seller', 'financial', 'marketing'].includes(d.papel)));
});

test('CONVITE: texto com saudação pelo nome, link da equipe e os três jeitos de instalar', () => {
  const m = montarConvite('Heloísa Lima');
  assert.match(m.texto, /^Olá, Heloísa!/);
  assert.ok(m.html.includes(LINK_CONSULTOR_EQUIPE) && m.texto.includes(LINK_CONSULTOR_EQUIPE));
  assert.match(m.texto, /iPhone/); assert.match(m.texto, /Android/); assert.match(m.texto, /Computador/);
  assert.match(m.texto, /pronta entrega/i);
  assert.ok(!m.html.includes('undefined'));
});

test('CONVITE: nada de indicação, comissão nem travessão', () => {
  for (const m of [montarConvite('Ana'), montarConvite('')]) {
    const t = `${m.assunto} ${m.texto} ${m.html}`;
    assert.ok(!/indica[çc]|indicad|comiss|%/i.test(t), 'tema proibido no convite');
    assert.ok(!/[—–]/.test(t), 'travessão no convite');
  }
  assert.match(montarConvite('').texto, /^Olá!/);
});

function appFalso() {
  const rotas: Record<string, any> = {};
  return { get: (c: string, h: any) => { rotas['GET ' + c] = h; }, post: (c: string, h: any) => { rotas['POST ' + c] = h; }, rotas };
}
function bancoFalso(hist: Record<string, any> = {}) {
  return {
    hist,
    collection: (nome: string) => nome === 'users'
      ? { get: async () => ({ docs: usuarios.map(u => ({ id: u.id, data: () => { const { id, ...r } = u as any; return r; } })) }) }
      : { doc: (id: string) => ({ get: async () => ({ data: () => hist[id] }), set: async (v: any) => { hist[id] = { ...hist[id], ...v }; } }) },
  };
}
const res = () => { const r: any = { code: 200 }; r.status = (c: number) => { r.code = c; return r; }; r.json = (b: any) => { r.body = b; return r; }; return r; };

test('CONVITE: envia só aos marcados, um por pessoa, e trava o reenvio', async () => {
  const app = appFalso(); const db = bancoFalso(); const enviados: string[] = [];
  registrarConviteConsultor(app, { db, exigirGestao: async () => ({ email: 'g@x' }), enviarEmail: async (to) => { enviados.push(to); }, agora: () => new Date('2026-10-20T12:00:00Z') });
  const post = app.rotas['POST /api/admin/convite-consultor/enviar'];
  let r = res(); await post({ body: { emails: ['luana@roderbrasil.com.br', 'p@x.com'] } }, r);
  assert.deepEqual(enviados, ['luana@roderbrasil.com.br']);
  assert.deepEqual(r.body.resultados.map((x: any) => x.status), ['enviado', 'fora_da_lista']);
  r = res(); await post({ body: { emails: ['luana@roderbrasil.com.br'] } }, r);
  assert.equal(r.body.resultados[0].status, 'ja_enviado'); assert.equal(enviados.length, 1);
  r = res(); await post({ body: { emails: ['luana@roderbrasil.com.br'], reenviar: true } }, r);
  assert.equal(r.body.resultados[0].status, 'enviado'); assert.equal(enviados.length, 2);
});

test('CONVITE: falha de envio aparece por pessoa e não grava como enviado', async () => {
  const app = appFalso(); const db = bancoFalso();
  registrarConviteConsultor(app, { db, exigirGestao: async () => ({ email: 'g@x' }), enviarEmail: async () => { throw new Error('SMTP recusou'); } });
  const r = res(); await app.rotas['POST /api/admin/convite-consultor/enviar']({ body: { emails: ['luana@roderbrasil.com.br'] } }, r);
  assert.equal(r.body.resultados[0].status, 'erro'); assert.deepEqual(db.hist, {});
});

test('CONVITE: sem permissão de gestão, nada é lido nem enviado', async () => {
  const app = appFalso(); let enviou = false;
  registrarConviteConsultor(app, { db: bancoFalso(), exigirGestao: async (_q, rs) => { rs.status(403).json({ ok: false }); return null; }, enviarEmail: async () => { enviou = true; } });
  for (const c of ['GET /api/admin/convite-consultor', 'POST /api/admin/convite-consultor/enviar']) {
    const r = res(); await app.rotas[c]({ body: { emails: ['luana@roderbrasil.com.br'] } }, r);
    assert.equal(r.code, 403);
  }
  assert.equal(enviou, false);
});
