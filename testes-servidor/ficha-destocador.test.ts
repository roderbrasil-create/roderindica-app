// Ficha Destocador DTH-240B (1 página A4 pronta + PDF) no card, no consultor e nos dados.
// Rodar: node --import tsx --test testes-servidor/ficha-destocador.test.ts
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import {
  PAGINAS_FICHA_DESTOCADOR, PDF_FICHA_DESTOCADOR, chaveDoLinkFichaDestocador, ehDestocadorDth, ehLinkFichaDestocador,
} from '../src/lib/fichaDestocador.ts';

const fonte = (c: string) => readFileSync(new URL(c, import.meta.url), 'utf8');
const publico = (c: string) => new URL(`../public${c}`, import.meta.url);

test('a página e o PDF existem em public/fichas-destocador e têm tamanho razoável', () => {
  assert.equal(PAGINAS_FICHA_DESTOCADOR.length, 1);
  for (const p of PAGINAS_FICHA_DESTOCADOR) {
    assert.ok(existsSync(publico(p)), p);
    const kb = statSync(publico(p)).size / 1024;
    assert.ok(kb > 80 && kb < 450, `${p} ${kb} kB`);
  }
  assert.ok(existsSync(publico(PDF_FICHA_DESTOCADOR)));
  assert.equal(readFileSync(publico(PDF_FICHA_DESTOCADOR)).subarray(0, 5).toString(), '%PDF-');
  assert.ok(!/firestore|firebase/.test(fonte('../src/components/catalog/FichaDestocador.tsx')));
});

test('o link ficha-destocador:dth240b do consultor é reconhecido, e outros não', () => {
  assert.equal(chaveDoLinkFichaDestocador('ficha-destocador:dth240b'), 'dth240b');
  assert.equal(chaveDoLinkFichaDestocador('Ficha-Destocador:DTH-240B'), 'dth240b');
  assert.equal(chaveDoLinkFichaDestocador('ficha-destocador:xyz'), null);
  assert.equal(chaveDoLinkFichaDestocador('ficha-gmt:035'), null);
  assert.equal(ehLinkFichaDestocador('ficha-destocador:xyz'), true);
  assert.equal(ehLinkFichaDestocador('fresa-ssh'), false);
  assert.ok(ehDestocadorDth('DTH 240B') && ehDestocadorDth('Destocador Tipo Broca') && ehDestocadorDth('dth-240b'));
  assert.ok(!ehDestocadorDth('Suporte destocador') && !ehDestocadorDth('Kit instalação destocador em escavadeira') && !ehDestocadorDth('GMT 035'));
});

test('catálogo e consultor abrem a ficha e o compartilhar usa o PDF pronto em memória', () => {
  for (const a of ['../src/pages/Catalog.tsx', '../src/components/layout/EngineerHelper.tsx']) assert.ok(fonte(a).includes('<FichaDestocador'), a);
  const eng = fonte('../src/components/layout/EngineerHelper.tsx');
  assert.ok(eng.includes('ehLinkFichaDestocador(url)') && eng.includes('compartilharFichaDestocador()'));
  const s = fonte('../src/components/catalog/FichaDestocador.tsx');
  assert.ok(s.includes('enviarArquivoPdf(await pdfFichaDestocador()') && s.includes('baixarBlob(await pdfFichaDestocador()'));
  assert.ok(s.includes('Baixar PDF') && s.includes('Compartilhar'));
});

test('o prompt do consultor ensina o DTH-240B com os valores confirmados e oferece a ficha', () => {
  const s = fonte('../server.ts');
  for (const t of [
    '(ficha-destocador:dth240b)', 'MESMO DESTOCADOR PARA ESCAVADEIRA E PARA RETROESCAVADEIRA', '**14 a 22 t**', '**140 a 220 L/min**', '**280 a 350 bar**',
    '**6 a 10 t**', '**100 a 150 L/min**', '**190 a 220 bar**', '**Ø 660 mm**', '**1.452 mm**', '**740 mm**', '952, 630, 530, 477 e 260',
    'sob medida', 'modelo e o ano da máquina', 'sem buraco', 'menor custo por hectare', 'Queimada é proibida', 'Nunca cite comissão do vendedor',
  ]) assert.ok(s.includes(t), t);
  for (const velho of ['680 milímetros', '60 centímetros (600 mm)', 'REGRA DE TRIAGEM OBRIGATÓRIA PARA PERGUNTAS SOBRE DESTOCA']) assert.ok(!s.includes(velho), velho);
});

test('dados do manual e do cadastro alinhados com a ficha (sem 240 mm, 750 kg, 14 a 25 t)', () => {
  const m = fonte('../src/data/equipmentManualData.ts');
  const linha = m.split('\n').find(l => l.includes("['Destocador DTH-240B'"))!;
  assert.ok(linha, 'linha do DTH-240B');
  for (const t of ['Ø 660 mm', '140 a 220', '280-350', '100 a 150', '190-220', '14 a 22', '6 a 10']) assert.ok(linha.includes(t), t);
  assert.ok(!/750|240 mm|14 a 25|120 a 180/.test(linha));
  const c = fonte('../src/pages/Catalog.tsx');
  assert.ok(!c.includes("peso: '750'") && !c.includes("diametro_corte: '240'") && c.includes("diametro_corte: '660'"));
});
