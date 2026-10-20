// Link do consultor para a ficha montada dos trituradores FAE de escavadeira.
// Rodar: node --import tsx --test testes-servidor/ficha-escavadeira.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MODELOS_FICHA_ESCAVADEIRA, acharFichaEscavadeira, chaveDoLinkFichaFae, chaveFichaEscavadeira, linkFichaEscavadeira,
} from '../src/lib/fichaEscavadeira.ts';

const produto = {
  name: 'Desbastador Florestal FAE para Escavadeiras e Retroescavadeira',
  models: [
    ...MODELOS_FICHA_ESCAVADEIRA.map(m => ({ id: m.chave, name: m.nome })),
    { id: 'fae-uml-ssl-vt-175', name: 'FAE UML SSL VT 175' },
    { id: 'fae-140-u-pm-200', name: 'FAE 140 U PM 200' },
  ],
};

test('cada um dos nove modelos tem link que volta ao mesmo modelo', () => {
  for (const m of MODELOS_FICHA_ESCAVADEIRA) {
    assert.equal(chaveFichaEscavadeira(m.nome), m.chave, m.nome);
    assert.equal(chaveDoLinkFichaFae(linkFichaEscavadeira(m.chave)), m.chave);
    assert.equal(acharFichaEscavadeira([produto], m.chave)?.model.name, m.nome);
  }
});

test('UML/EX/VT e UML/S/EX/VT não se confundem', () => {
  assert.equal(chaveFichaEscavadeira('UML/EX/VT'), 'uml-ex-vt');
  assert.equal(chaveFichaEscavadeira('FAE UML/S/EX/VT'), 'uml-s-ex-vt');
  assert.equal(chaveFichaEscavadeira('UMM'), 'umm');
});

test('modelos de pá carregadeira e textos soltos ficam de fora (têm ficha própria)', () => {
  assert.equal(chaveFichaEscavadeira('FAE UML SSL VT 175'), null);
  assert.equal(chaveFichaEscavadeira('FAE 140 U PM 200'), null);
  assert.equal(chaveFichaEscavadeira('SSH 150'), null);
  assert.equal(chaveDoLinkFichaFae('fresa-ssh'), null);
  assert.equal(chaveDoLinkFichaFae('ficha-fae:ssh-150'), null);
});

test('link sem produto no catálogo devolve nulo em vez de abrir a ficha errada', () => {
  assert.equal(acharFichaEscavadeira([{ name: 'x', models: [{ id: 'a', name: 'Garra R400' }] }], 'umm'), null);
});

test('o prompt do consultor traz o link dos nove modelos e a regra de não falar número de dentes', async () => {
  const { readFileSync } = await import('node:fs');
  const fonte = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  for (const m of MODELOS_FICHA_ESCAVADEIRA) assert.ok(fonte.includes(`(${linkFichaEscavadeira(m.chave)})`), m.chave);
  assert.ok(fonte.includes('Nunca informe número de dentes desses trituradores de escavadeira'));
});
