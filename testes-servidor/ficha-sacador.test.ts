// Ficha nova do Sacador SAC-500 (2 páginas A4 prontas + PDF) no card, no modelo, no consultor e nos dados.
// Rodar: node --import tsx --test testes-servidor/ficha-sacador.test.ts
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { PAGINAS_FICHA_SACADOR, PDF_FICHA_SACADOR, ehSacadorSac500 } from '../src/lib/fichaSacador.ts';

const fonte = (c: string) => readFileSync(new URL(c, import.meta.url), 'utf8');
const publico = (c: string) => new URL(`../public${c}`, import.meta.url);

test('as 2 páginas e o PDF existem em public/fichas-sacador', () => {
  assert.equal(PAGINAS_FICHA_SACADOR.length, 2);
  for (const p of PAGINAS_FICHA_SACADOR) { assert.ok(existsSync(publico(p)), p); assert.ok(statSync(publico(p)).size > 80 * 1024, p); }
  assert.equal(readFileSync(publico(PDF_FICHA_SACADOR)).subarray(0, 5).toString(), '%PDF-');
});

test('reconhece o SAC-500 pelo nome e não confunde com outros equipamentos', () => {
  for (const t of ['Sacador SAC 500', 'SAC-500', 'sac500', 'Sacador de Árvores']) assert.ok(ehSacadorSac500(t), t);
  for (const t of ['Destocador DTH 240B', 'Feller CFD 40', 'GMT 035', '']) assert.ok(!ehSacadorSac500(t), t);
});

test('card principal e card do modelo: botão Ficha existe e abre a ficha nova; a antiga saiu', () => {
  const c = fonte('../src/pages/Catalog.tsx');
  assert.ok(c.includes('<FichaSacador') && c.includes('isSacador || isDestocadorDth'));
  assert.ok(!c.includes('SacadorSac500Ficha') || c.includes('setIsSacadorSac500FichaOpen'));
  assert.ok(!existsSync(new URL('../src/components/catalog/SacadorSac500Ficha.tsx', import.meta.url)));
  const e = fonte('../src/components/layout/EngineerHelper.tsx');
  assert.ok(e.includes('<FichaSacador') && e.includes('compartilharFichaSacador()'));
});

test('eucalipto: máximo 30 cm (100 a 300 mm) e nunca 35 cm no app, no consultor nem no manual', () => {
  const s = fonte('../server.ts');
  assert.ok(s.includes('100 a 300 mm') && s.includes('1000.1295.0000'));
  const trecho = s.slice(s.indexOf('18. REGRAS E ESPECIFICAÇÕES TÉCNICAS DO SACADOR'), s.indexOf('19. DIRETRIZ CRÍTICA'));
  assert.ok(!/350 mm|30 a 35 cm|500 mm \(45 a 50/.test(trecho.replace('nunca diga 35 cm', '')));
  const m = fonte('../src/data/equipmentManualData.ts').split('\n').find(l => l.includes("['Sacador SAC-500'"))!;
  for (const t of ['450 mm', '100 a 300 mm', '2.160 kg', '180 a 250', '320-350', '20 a 30']) assert.ok(m.includes(t), t);
  assert.ok(!/35 cm|920 kg|torrão/.test(m));
  assert.ok(!fonte('../src/pages/Catalog.tsx').includes('12 a 35 cm'));
});
