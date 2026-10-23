import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { enderecoDoContratoAssinado, dataDaAssinatura } from '../src/lib/contratoAssinado.ts';

const fonte = (c: string) => readFileSync(new URL(`../src/pages/${c}`, import.meta.url), 'utf8');

test('VISUALIZAR CONTRATO: o endereço leva o modo leitura, senão a tela mandava o parceiro de volta para a inicial', () => {
  assert.equal(enderecoDoContratoAssinado('abc 1'), '/contrato?ver=1&uid=abc%201');
  assert.equal(enderecoDoContratoAssinado(), '/contrato?ver=1');
  assert.match(fonte('Profile.tsx'), /enderecoDoContratoAssinado\(profile\.uid\)/);
});

test('VISUALIZAR CONTRATO: quem já assinou só é redirecionado fora do modo leitura', () => {
  const c = fonte('Contract.tsx');
  assert.match(c, /contract_accepted && !isPreview && !viewUid && !modoLeitura/);
});

test('DATA DA ASSINATURA: aceita ISO, Timestamp do Firestore, ms e não quebra com vazio ou lixo', () => {
  assert.equal(dataDaAssinatura('2026-09-15T15:00:00.000Z'), '15/09/2026');
  assert.equal(dataDaAssinatura({ seconds: Date.UTC(2026, 8, 15, 15) / 1000 }), '15/09/2026');
  assert.equal(dataDaAssinatura({ toDate: () => new Date(Date.UTC(2026, 8, 15, 15)) }), '15/09/2026');
  assert.equal(dataDaAssinatura(Date.UTC(2026, 8, 15, 15)), '15/09/2026');
  for (const v of [undefined, null, '', 'xx', {}]) assert.equal(dataDaAssinatura(v), null);
});

import { dadosDeExibicaoDoContrato } from '../src/lib/contratoAssinado.ts';

test('MODO LEITURA: nome, e-mail, telefone e PIX vêm do perfil visto, mesmo com o formulário vazio (próprio parceiro ou admin vendo outro)', () => {
  const vazio = { name: '', email: '', phone: '', pix_key: '' };
  const perfil = { name: 'Rafael MAQLOC', email: 'r@maqloc.com', phone: '(14) 99999-0000', pix_key: '123' };
  const d = dadosDeExibicaoDoContrato({ isPreview: false, somenteLeitura: true, step: 'contract', viewProfile: perfil, formData: vazio });
  assert.deepEqual(d, { nome: 'Rafael MAQLOC', email: 'r@maqloc.com', telefone: '(14) 99999-0000', pix: '123' });
});

test('MODO LEITURA: perfil sem e-mail ou PIX mostra o aviso, não branco; sem perfil não quebra', () => {
  const vazio = { name: '', email: '', phone: '', pix_key: '' };
  const d = dadosDeExibicaoDoContrato({ isPreview: false, somenteLeitura: true, step: 'contract', viewProfile: { name: 'A' }, formData: vazio });
  assert.equal(d.pix, 'A PREENCHER NO PERFIL');
  assert.equal(d.email, 'A PREENCHER NO PERFIL');
  assert.equal(dadosDeExibicaoDoContrato({ isPreview: false, somenteLeitura: true, step: 'contract', viewProfile: null, formData: vazio }).nome, '');
});

test('ASSINATURA: fora do modo leitura o contrato mostra o que o parceiro digitou; prévia usa os exemplos', () => {
  const f = { name: 'Novo', email: 'n@x.com', phone: '1', pix_key: '' };
  const d = dadosDeExibicaoDoContrato({ isPreview: false, somenteLeitura: false, step: 'contract', viewProfile: { name: 'Velho' }, formData: f });
  assert.equal(d.nome, 'Novo');
  assert.equal(d.pix, 'A PREENCHER NO PERFIL');
  assert.equal(dadosDeExibicaoDoContrato({ isPreview: true, somenteLeitura: false, step: 'contract', formData: f }).nome, 'NOME DO PARCEIRO');
});

test('MODO LEITURA: o rodapé da tela nunca mostra checkbox nem botão de assinar', () => {
  const c = fonte('Contract.tsx');
  assert.match(c, /!viewProfile\?\.contract_accepted && !isPreview && !somenteLeitura/);
  assert.match(c, /catch \(err\)[\s\S]{0,300}navigate\('\/'\)/);
});
