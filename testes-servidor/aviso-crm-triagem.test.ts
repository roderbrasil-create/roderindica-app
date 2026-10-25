import test from 'node:test';
import assert from 'node:assert/strict';
import { avisoCrmTriagemVisivel, TEXTO_AVISO_CRM_TRIAGEM } from '../src/lib/avisoCrmTriagem';

test('AVISO CRM: some até 25/10 e aparece a partir de 26/10, no dia de Brasília', () => {
  assert.equal(avisoCrmTriagemVisivel(new Date('2026-10-25T12:00:00-03:00')), false);
  // 25/10 às 23h59 em Brasília já é 26/10 em UTC: não pode aparecer ainda
  assert.equal(avisoCrmTriagemVisivel(new Date('2026-10-25T23:59:00-03:00')), false);
  assert.equal(avisoCrmTriagemVisivel(new Date('2026-10-26T00:00:00-03:00')), true);
  assert.equal(avisoCrmTriagemVisivel(new Date('2026-11-15T09:00:00-03:00')), true);
});

test('AVISO CRM: texto exato e sem travessão', () => {
  assert.equal(TEXTO_AVISO_CRM_TRIAGEM, 'Agora as indicações também chegam ao CRM Roder Vision, e a triagem já pode ser feita lá. Esta tela continua funcionando como reserva.');
  assert.ok(!/[—–]/.test(TEXTO_AVISO_CRM_TRIAGEM));
});
