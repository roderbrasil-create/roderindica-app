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
