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

test('CATERPILLAR NOVA: bomba extra e comando duplo, com fotos e vídeo para orçar', () => {
  assert.ok(/CATERPILLAR NOVA GERAÇÃO/.test(servidor) && /BOMBA EXTRA/.test(servidor) && /COMANDO DUPLO Roder/.test(servidor));
  assert.ok(/plaqueta, bomba e o comando/.test(servidor));
});

test('BLOCO: o consultor sabe que o bloco fica no pé do primeiro braço', () => {
  assert.ok(/pé do primeiro braço/.test(servidor));
});

test('FERRAMENTAS: dentes do Feller de Disco podem ser virados e não precisam de afiação', () => {
  assert.ok(/podem ser VIRADOS/.test(servidor) && /NÃO precisam de afiação/.test(servidor));
});

test('ORÇAR: máquina nova pode passar o contato do vendedor em vez do vídeo', () => {
  assert.ok(/contato do VENDEDOR da máquina/.test(servidor) && /pé da bomba principal/.test(servidor));
});

import { existsSync as existe } from 'node:fs';
test('FOTOS DO CONSULTOR: as 8 fotos existem e entram no índice de imagens do consultor', () => {
  const urls = [...servidor.matchAll(/url: '(\/catalogo\/feller-disco\/consultor\/[^']+)'/g)].map(m => m[1]);
  assert.equal(urls.length, 8);
  for (const u of urls) assert.ok(existe('public' + u), u);
  assert.ok(/for \(const f of FOTOS_CONSULTOR_FELLER_DISCO\) catalogImageIndex\.push\(f\)/.test(servidor));
});

test('PRODUTIVIDADE: faixa de 2 a 3 vezes como referência, sem prometer número exato', () => {
  assert.ok(/de 2 a 3 vezes mais que um cabeçote multifuncional na mesma operação/.test(servidor));
  assert.ok(!/chegou a produzir até 3 vezes/.test(servidor));
  assert.ok(/REFERÊNCIA, nunca uma garantia/.test(servidor));
});

test('FICHA: o servidor aplica a ficha nova do CFD 40 sozinho, sem esperar alguém abrir o Catálogo', () => {
  assert.ok(/async function migrarFichaFellerDisco/.test(servidor));
  assert.ok(/migrarFichaFellerDisco\(db\)/.test(servidor));
  assert.ok(/Ficha_Feller_Disco_CFD40\.pdf/.test(servidor));
});
