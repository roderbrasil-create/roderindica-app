// E-mail só vale confirmado. Rodar: node --import tsx --test testes-servidor/email-confiavel.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { emailConfiavelDoToken, ehDiretoriaPeloToken, papelDeQuemChama, deveMarcarEmailConfirmado, classificarConta, podeConfirmarPrimeiroAcesso, podeDefinirSenha } from '../server/emailConfiavel.ts';
import { hostDeFotoAgendor, urlDeFotoAgendor } from '../server/fotoAgendor.ts';

const token = (email: string, confirmado: boolean, provedor = 'password') =>
  ({ uid: 'u1', email, email_verified: confirmado, firebase: { sign_in_provider: provedor } });

test('conta com senha criada por fora (e-mail não confirmado) não vale como e-mail confiável', () => {
  assert.equal(emailConfiavelDoToken(token('qualquer@roderbrasil.com.br', false)), '');
  assert.equal(emailConfiavelDoToken(token('Qualquer@RoderBrasil.com.br', true)), 'qualquer@roderbrasil.com.br');
  assert.equal(emailConfiavelDoToken({ email: 'x@roderbrasil.com.br', email_verified: true, firebase: { sign_in_provider: 'anonymous' } }), '');
  assert.equal(emailConfiavelDoToken(null), '');
});

test('diretoria pelo e-mail só confirmada: senha sem confirmação não vira admin', () => {
  assert.equal(ehDiretoriaPeloToken(token('jeferson@roderbrasil.com.br', false)), false);
  assert.equal(papelDeQuemChama(token('jeferson@roderbrasil.com.br', false), ''), '');
  assert.equal(papelDeQuemChama(token('roderbrasil@gmail.com', false), 'external_seller'), 'external_seller');
  assert.equal(papelDeQuemChama(token('jeferson@roderbrasil.com.br', true, 'google.com'), ''), 'admin');
});

test('equipe vem do papel do cadastro, nunca do domínio do e-mail', () => {
  assert.equal(papelDeQuemChama(token('qualquer@roderbrasil.com.br', true), ''), '');
  assert.equal(papelDeQuemChama(token('heloisa@gmail.com', false), 'internal_seller'), 'internal_seller');
});

test('marcação única: só conta com senha, não confirmada, com cadastro ATIVO do mesmo e-mail', () => {
  const conta = { uid: 'u1', email: 'gislene@roderbrasil.com.br', emailVerified: false, providerData: [{ providerId: 'password' }] };
  assert.equal(deveMarcarEmailConfirmado(conta, { status: 'active', role: 'manager', email: 'gislene@roderbrasil.com.br' }), true);
  assert.equal(deveMarcarEmailConfirmado(conta, { status: 'active', role: 'external_seller' }), true);
  // conta criada por fora: sem cadastro, ou cadastro próprio (nasce pending pelas regras)
  assert.equal(deveMarcarEmailConfirmado(conta, undefined), false);
  assert.equal(deveMarcarEmailConfirmado(conta, { status: 'pending', role: 'external_seller' }), false);
  assert.equal(deveMarcarEmailConfirmado(conta, { status: 'inactive', role: 'manager' }), false);
  // cadastro de outro e-mail no mesmo uid: não mexe
  assert.equal(deveMarcarEmailConfirmado(conta, { status: 'active', email: 'outra@roderbrasil.com.br' }), false);
  // já confirmada, ou só Google: nada a fazer
  assert.equal(deveMarcarEmailConfirmado({ ...conta, emailVerified: true }, { status: 'active' }), false);
  assert.equal(deveMarcarEmailConfirmado({ ...conta, providerData: [{ providerId: 'google.com' }] }, { status: 'active' }), false);
});

test('servidor e regras não aceitam mais conta com senha como e-mail confirmado', () => {
  const servidor = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.ok(!/sign_in_provider\s*!==\s*'password'/.test(servidor), 'reivindicar-perfil ainda aceita conta com senha');
  assert.ok(!/requesterData\?\.email === 'roder/.test(servidor), 'troca de senha ainda confia no e-mail gravado no cadastro');
  assert.match(servidor, /updateUser\(contaExistente.uid, { password, emailVerified: true }\)/);
  assert.match(servidor, /marcarContasDaEquipe\(\)/);
  const regras = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.ok(!/sign_in_provider == 'password'/.test(regras), "firestore.rules ainda aceita sign_in_provider == 'password'");
  const storage = fs.readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
  assert.ok(!/sign_in_provider == 'password'/.test(storage));
});

test('rodada única: diretoria nunca é marcada, e cada conta de fora sai com o motivo', () => {
  const conta = (email: string) => ({ uid: 'u1', email, emailVerified: false, providerData: [{ providerId: 'password' }] });
  assert.equal(classificarConta(conta('jeferson@roderbrasil.com.br'), { status: 'active', role: 'admin', email: 'jeferson@roderbrasil.com.br' }, false), 'diretoria');
  assert.equal(classificarConta(conta('a@x.com'), { status: 'active', email: 'a@x.com' }, false), 'marcar');
  assert.equal(classificarConta(conta('a@x.com'), undefined, false), 'sem_cadastro');
  assert.equal(classificarConta(conta('a@x.com'), undefined, true), 'pre_cadastro_por_email');
  assert.equal(classificarConta(conta('a@x.com'), { status: 'pending', email: 'a@x.com' }, false), 'cadastro_inativo');
  assert.equal(classificarConta(conta('a@x.com'), { status: 'active', email: 'b@x.com' }, false), 'email_diferente');
  assert.equal(classificarConta({ ...conta('a@x.com'), emailVerified: true }, undefined, false), 'pular');
  assert.equal(classificarConta({ ...conta('a@x.com'), providerData: [{ providerId: 'google.com' }] }, undefined, false), 'pular');
});

test('primeiro acesso sem e-mail confirmado: só com senha da Roder e login DEPOIS de ela ser definida', () => {
  const definida = '2026-10-19T12:00:00.000Z';
  const seg = Date.parse(definida) / 1000;
  const dec = (auth_time: number, provedor = 'password') => ({ auth_time, firebase: { sign_in_provider: provedor } });
  const prov = { initial_password: 'abc123', initial_password_set_at: definida };
  assert.equal(podeConfirmarPrimeiroAcesso(dec(seg + 60), prov), true);
  // conta criada por fora e logada ANTES da senha da Roder: não passa
  assert.equal(podeConfirmarPrimeiroAcesso(dec(seg - 60), prov), false);
  assert.equal(podeConfirmarPrimeiroAcesso(dec(seg + 60, 'google.com'), prov), false);
  assert.equal(podeConfirmarPrimeiroAcesso(dec(seg + 60), { initial_password: 'abc123' }), false);
  assert.equal(podeConfirmarPrimeiroAcesso(dec(seg + 60), { initial_password_set_at: definida }), false);
});

test('senha pela tela de Usuários: gestão não troca senha de gestão, de conta Google nem da diretoria', () => {
  const base = { papelQuemPede: 'manager', diretoria: false, papeisAlvo: ['external_seller'], emailAlvo: 'p@x.com', temGoogle: false };
  assert.equal(podeDefinirSenha(base).ok, true);
  assert.equal(podeDefinirSenha({ ...base, papeisAlvo: ['external_seller', 'manager'] }).ok, false);
  assert.equal(podeDefinirSenha({ ...base, papeisAlvo: ['triagem'] }).ok, false);
  assert.equal(podeDefinirSenha({ ...base, papeisAlvo: ['admin'] }).ok, false);
  assert.equal(podeDefinirSenha({ ...base, temGoogle: true }).ok, false);
  assert.equal(podeDefinirSenha({ ...base, emailAlvo: 'roderbrasil@gmail.com' }).ok, false);
  assert.equal(podeDefinirSenha({ ...base, papelQuemPede: 'internal_seller' }).ok, false);
  assert.equal(podeDefinirSenha({ ...base, papelQuemPede: 'admin', papeisAlvo: ['manager'], temGoogle: true }).ok, true);
  assert.equal(podeDefinirSenha({ ...base, papelQuemPede: '', diretoria: true, papeisAlvo: ['admin'] }).ok, true);
});

test('foto do Agendor: só https de agendor.com.br, S3 ou CloudFront', () => {
  assert.equal(urlDeFotoAgendor('https://app.agendor.com.br/foto.jpg'), true);
  assert.equal(urlDeFotoAgendor('https://agendor-prod.s3.amazonaws.com/p/1.png'), true);
  assert.equal(urlDeFotoAgendor('https://d1234.cloudfront.net/1.png'), true);
  assert.equal(urlDeFotoAgendor('http://app.agendor.com.br/foto.jpg'), false);
  assert.equal(urlDeFotoAgendor('https://169.254.169.254/latest/meta-data'), false);
  assert.equal(urlDeFotoAgendor('https://agendor.com.br.evil.com/x.png'), false);
  assert.equal(urlDeFotoAgendor('https://evilagendor.com.br/x.png'), false);
  assert.equal(urlDeFotoAgendor('https://user:pw@app.agendor.com.br/x.png'), false);
  assert.equal(urlDeFotoAgendor('https://app.agendor.com.br:8443/x.png'), false);
  assert.equal(hostDeFotoAgendor('metadata.google.internal'), false);
});

test('servidor: a rota da foto do Agendor exige o dono e usa o download protegido', () => {
  const fonte = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const i = fonte.indexOf('app.get("/api/admin/agendor-foto"');
  const trecho = fonte.slice(i, fonte.indexOf('app.get("/api/documento"', i));
  assert.ok(trecho.includes("me.role !== 'admin'"));
  assert.ok(trecho.includes('urlDeFotoAgendor(url)'));
  assert.ok(trecho.includes('baixarExterna(url, 8000, 10 * 1024 * 1024, { hostPermitido: hostDeFotoAgendor })'));
  assert.ok(!/await fetch\(url/.test(trecho));
});
