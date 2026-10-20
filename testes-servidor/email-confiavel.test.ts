// E-mail só vale confirmado. Rodar: node --import tsx --test testes-servidor/email-confiavel.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { emailConfiavelDoToken, ehDiretoriaPeloToken, papelDeQuemChama, deveMarcarEmailConfirmado } from '../server/emailConfiavel.ts';

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
  assert.match(servidor, /password: password,\s*emailVerified: true/);
  assert.match(servidor, /marcarContasDaEquipe\(\)/);
  const regras = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.ok(!/sign_in_provider == 'password'/.test(regras), "firestore.rules ainda aceita sign_in_provider == 'password'");
  const storage = fs.readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
  assert.ok(!/sign_in_provider == 'password'/.test(storage));
});
