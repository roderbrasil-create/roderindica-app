// Feller de Disco CFD 40 em rebrota (Jeferson, 04/11/2026): pode, com toco de até 42 cm.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';

const servidor = readFileSync('server.ts', 'utf-8');
const catalogo = readFileSync('src/pages/Catalog.tsx', 'utf-8');

test('REBROTA: o consultor não proíbe mais o Feller de Disco e cita o limite de 42 cm', () => {
  assert.ok(!/Feller de Disco NÃO é indicado para áreas de rebrota/i.test(servidor));
  assert.ok(/Feller de Disco \*\*PODE trabalhar em rebrota/.test(servidor));
  assert.ok(/ACÚMULO DO FELLER DE DISCO CFD 40/.test(servidor) && /NÃO compensa acumular/.test(servidor));
  assert.ok(/42 cm/.test(servidor));
});

test('FICHA: a ficha nova do CFD 40 existe e o catálogo aponta para ela, não mais para a antiga', () => {
  assert.ok(existsSync('public/catalogo/feller-disco/Ficha_Feller_Disco_CFD40.pdf'));
  assert.ok(!catalogo.includes('Feller-de-Disco-Roder.pdf'));
  assert.ok(catalogo.includes("'/catalogo/feller-disco/Ficha_Feller_Disco_CFD40.pdf'"));
  assert.ok(catalogo.includes('ficha_cfd40_2026_11_04'));
  assert.ok(catalogo.includes("diametro_corte: '420'") && catalogo.includes("peso: '1850'"));
});

test('INSTALAÇÃO: o consultor conhece as 7 mangueiras e o bloco exclusivo do Feller de Disco', () => {
  assert.ok(/Total de 7 mangueiras/.test(servidor) && /união de fluxo das 2 bombas/.test(servidor));
});

test('COMPATIBILIDADE: Feller de Disco serve para comando pilotado com fatia extra', () => {
  assert.ok(/comando PILOTADO e com fatia extra disponível/.test(servidor) && /Caterpillar 320 mais antiga/.test(servidor));
});
