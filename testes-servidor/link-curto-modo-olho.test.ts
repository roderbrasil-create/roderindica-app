import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { donoDoLinkCurto } from '../server/linkCurtoDono';

const parceiro = 'uidParceiro123';
const existe = async (u: string) => u === parceiro;

test('admin vendo como parceiro: o link nasce no uid do parceiro', async () => {
  assert.equal(await donoDoLinkCurto({ uid: 'uidAdmin', role: 'admin' }, parceiro, existe), parceiro);
  assert.equal(await donoDoLinkCurto({ uid: 'uidGerente', role: 'manager' }, parceiro, existe), parceiro);
});

test('usuário comum que manda o uid de outro é ignorado: o link fica no uid do token', async () => {
  for (const role of ['internal_seller', 'external_seller', 'vendedor_padrao', 'triagem', 'financial', 'marketing', '']) {
    assert.equal(await donoDoLinkCurto({ uid: 'uidX', role }, parceiro, existe), 'uidX', role);
  }
});

test('uid que não existe, inválido ou erro na consulta: admin cai no próprio uid', async () => {
  assert.equal(await donoDoLinkCurto({ uid: 'uidAdmin', role: 'admin' }, 'naoExiste', existe), 'uidAdmin');
  assert.equal(await donoDoLinkCurto({ uid: 'uidAdmin', role: 'admin' }, '../outro', async () => true), 'uidAdmin');
  assert.equal(await donoDoLinkCurto({ uid: 'uidAdmin', role: 'admin' }, parceiro, async () => { throw new Error('banco'); }), 'uidAdmin');
  assert.equal(await donoDoLinkCurto({ uid: 'uidAdmin', role: 'admin' }, undefined, existe), 'uidAdmin');
  assert.equal(await donoDoLinkCurto({ uid: 'uidAdmin', role: 'admin' }, 123 as any, existe), 'uidAdmin');
});

test('as duas rotas de link usam o dono resolvido e só o parceiro ativo vale', () => {
  const srv = readFileSync('server.ts', 'utf8');
  assert.match(srv, /const dono = await donoDoLinkCurto\(\{ uid: quem\.uid, role: chamador\?\.role \}, req\.body\?\.uid/);
  assert.match(srv, /criarLinkCurto\(dono, pid, mid\)/);
  assert.match(srv, /d\.status === 'active'/);
  const cons = readFileSync('server/consultorParceiro.ts', 'utf8');
  assert.match(cons, /dono\.via === 'login'/);
  assert.match(cons, /deps\.criarLinkCurto\(donoLink, pid, mid\)/);
});

test('catálogo, painel do parceiro e consultor mandam o uid do parceiro só no modo olho', () => {
  assert.match(readFileSync('src/pages/Catalog.tsx', 'utf8'), /uid: isImpersonating \? profile\?\.uid : undefined/);
  assert.match(readFileSync('src/components/parceiro/PainelParceiro.tsx', 'utf8'), /isImpersonating \? profile\?\.uid : undefined/);
  assert.match(readFileSync('src/components/layout/EngineerHelper.tsx', 'utf8'), /uid: isImpersonating && logado \? profile\?\.uid : undefined/);
});

test('o pedido aberto pelo link curto cai no uid do link (parceiro), não em quem gerou', () => {
  const link = readFileSync('src/pages/LinkCurto.tsx', 'utf8');
  assert.match(link, /uid: d\.uid/);
  const pedido = readFileSync('src/pages/PublicBudgetRequest.tsx', 'utf8');
  assert.match(pedido, /const finalIndicatorId = isPublic \? 'public_request' : indicatorId;/);
});
