import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ehRcu, chaveModeloRcu, chaveDoLinkFichaRcu, chaveFichaRcu, paginasFichaRcu, pdfFichaRcuUrl, CHAVES_FICHA_RCU,
} from '../src/lib/fichaRcu';

test('o modelo citado manda: RCU 45, 55, 75 e 120 abrem a ficha do próprio modelo', () => {
  assert.equal(chaveFichaRcu('RCU 45'), 'rcu45');
  assert.equal(chaveFichaRcu('FAE RCU55'), 'rcu55');
  assert.equal(chaveFichaRcu('rcu-75'), 'rcu75');
  assert.equal(chaveFichaRcu('RCU 120', 'FAE RCU Triturador Rádio Controle'), 'rcu120');
});

test('card principal (só o nome do produto) abre o comparativo', () => {
  assert.equal(chaveFichaRcu('FAE RCU Triturador Rádio Controle', '', 'FAE RCU Triturador Rádio Controle'), 'comparativo');
  assert.equal(chaveFichaRcu('', 'FAE RCU Triturador Rádio Controle'), 'comparativo');
});

test('implemento do RCU (BL1/RCU55-125) não é o transportador e não abre a ficha do RCU', () => {
  assert.equal(chaveModeloRcu('BL1/RCU55-125'), null);
  assert.equal(chaveModeloRcu('UML/SONIC/RCU120-150'), null);
  assert.equal(ehRcu('PML/RCU45-130'), false);
  assert.equal(ehRcu('SCL/RCU'), false);
  assert.equal(chaveFichaRcu('BL1/RCU55-125'), null);
});

test('outros equipamentos FAE não viram RCU', () => {
  assert.equal(chaveFichaRcu('FAE UML/S/EX/VT 125'), null);
  assert.equal(chaveFichaRcu('Fresa FAE SSH 150'), null);
  assert.equal(chaveFichaRcu('Sacador SAC 500'), null);
  assert.equal(ehRcu('Triturador PT-175'), false);
});

test('links do consultor: ficha-rcu:75, ficha-rcu:rcu120 e ficha-rcu:comparativo', () => {
  assert.equal(chaveDoLinkFichaRcu('ficha-rcu:75'), 'rcu75');
  assert.equal(chaveDoLinkFichaRcu('ficha-rcu:RCU-120'), 'rcu120');
  assert.equal(chaveDoLinkFichaRcu('ficha-rcu:comparativo'), 'comparativo');
  assert.equal(chaveDoLinkFichaRcu('ficha-rcu:99'), null);
  assert.equal(chaveDoLinkFichaRcu('ficha-gmt:035'), null);
});

test('todos os arquivos de cada ficha existem em public/fichas-rcu', () => {
  for (const c of CHAVES_FICHA_RCU) {
    for (const p of [...paginasFichaRcu(c), pdfFichaRcuUrl(c)]) {
      assert.ok(fs.existsSync(`public${p}`), `falta ${p}`);
    }
  }
  assert.equal(paginasFichaRcu('rcu75').length, 3);
  assert.equal(paginasFichaRcu('comparativo').length, 1);
});

test('o consultor sabe o Arla e só fala de consumo como estimativa Roder', () => {
  const src = fs.readFileSync('server.ts', 'utf8');
  const i = src.indexOf('25. FAE RCU');
  assert.ok(i > 0);
  const sec = src.slice(i, i + 6000);
  assert.match(sec, /Só o RCU 120 usa Arla 32/);
  assert.match(sec, /NUNCA invente/);
  assert.match(sec, /estimativa Roder/);
  assert.match(sec, /até ~18 l\/h/);
  assert.doesNotMatch(sec, /dado oficial da FAE:/);
  assert.match(sec, /ficha-rcu:comparativo/);
});
