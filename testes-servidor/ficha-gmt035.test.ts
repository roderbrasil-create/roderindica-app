// Ficha GMT 035 Guindaste (4 páginas A4 prontas + PDF) no card, no consultor e nos dados.
// Rodar: node --import tsx --test testes-servidor/ficha-gmt035.test.ts
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import {
  PAGINAS_FICHA_GMT, PDF_FICHA_GMT, chaveDoLinkFichaGmt, ehCabecoteGmt035, ehLinkFichaGmt,
} from '../src/lib/fichaGmt.ts';

const fonte = (c: string) => readFileSync(new URL(c, import.meta.url), 'utf8');
const publico = (c: string) => new URL(`../public${c}`, import.meta.url);

test('as 4 páginas e o PDF existem em public/fichas-gmt e têm tamanho razoável', () => {
  assert.equal(PAGINAS_FICHA_GMT.length, 4);
  for (const p of PAGINAS_FICHA_GMT) {
    assert.ok(existsSync(publico(p)), p);
    const kb = statSync(publico(p)).size / 1024;
    assert.ok(kb > 100 && kb < 450, `${p} ${kb} kB`);
  }
  assert.ok(existsSync(publico(PDF_FICHA_GMT)));
  assert.equal(readFileSync(publico(PDF_FICHA_GMT)).subarray(0, 5).toString(), '%PDF-');
  const comp = fonte('../src/components/catalog/FichaGmt035.tsx');
  assert.ok(!/firestore|firebase/.test(comp));
});

test('o link ficha-gmt:035 do consultor é reconhecido, e outros não', () => {
  assert.equal(chaveDoLinkFichaGmt('ficha-gmt:035'), '035');
  assert.equal(chaveDoLinkFichaGmt('Ficha-GMT:GMT-035'), '035');
  assert.equal(chaveDoLinkFichaGmt('ficha-gmt:999'), null);
  assert.equal(chaveDoLinkFichaGmt('ficha-fae:umm'), null);
  assert.equal(ehLinkFichaGmt('ficha-gmt:xyz'), true);
  assert.equal(ehLinkFichaGmt('fresa-ssh'), false);
  assert.ok(ehCabecoteGmt035('Cabeçote de Poda GMT 035') && ehCabecoteGmt035('JMT 035') && !ehCabecoteGmt035('GP 150'));
});

test('catálogo e consultor abrem a ficha nova e a ficha antiga saiu do código', () => {
  assert.ok(!existsSync(new URL('../src/components/catalog/CabecoteGmt035Ficha.tsx', import.meta.url)));
  for (const a of ['../src/pages/Catalog.tsx', '../src/components/layout/EngineerHelper.tsx']) {
    const s = fonte(a);
    assert.ok(s.includes('<FichaGmt035'), a);
    assert.ok(!s.includes('catalog/CabecoteGmt035Ficha') && !s.includes('<CabecoteGmt035Ficha'), a);
  }
  const eng = fonte('../src/components/layout/EngineerHelper.tsx');
  assert.ok(eng.includes('ehLinkFichaGmt(url)') && eng.includes('compartilharFichaGmt()'));
});

test('o compartilhar reaproveita o enviarArquivoPdf (iPhone) com o PDF pronto em memória', () => {
  const s = fonte('../src/components/catalog/FichaGmt035.tsx');
  assert.ok(s.includes('enviarArquivoPdf(await pdfFichaGmt()') && s.includes('baixarBlob(await pdfFichaGmt()'));
  assert.ok(s.includes('Baixar PDF') && s.includes('Compartilhar'));
});

test('o prompt do consultor ensina o GMT 035 e oferece a ficha', () => {
  const s = fonte('../server.ts');
  for (const t of [
    '(ficha-gmt:035)', '4 linhas', '35 a 65 L/min', 'Pressão máxima **250 bar**', '1/2 pol R2', 'rosca 1/2 pol, ponta macho Ø 25 mm',
    '3/8 R2 ou 1/2 R2', 'face plana **3/8 pol, ponta macho Ø 20 mm**', 'desvio em T na linha de abrir a garra', 'válvula de esfera e válvula de dreno',
    'Abertura máxima da garra **85 cm**', 'fechamento mínimo **4,5 cm**', '**Ø 40 cm**', 'mínimo **Ø 5 cm**', '**1.500 kg**', '**275 kg**', '**405 kg**',
    'controle remoto PRÓPRIO do GMT', 'controle remoto do PRÓPRIO guindaste, fornecido pelo fabricante do guindaste',
    'CONSULTAR O FABRICANTE DO GUINDASTE', 'encaminhar ao fabricante do guindaste', 'Nunca cite comissão do vendedor',
    'Nunca mostre ao cliente nome, site ou contato do fabricante',
  ]) assert.ok(s.includes(t), t);
  for (const velho of ['230 kg a 245 kg', '185 a 250 Bar', 'até **60 cm** em corte duplo', 'Acionado por controle remoto sem fio (wireless)']) assert.ok(!s.includes(velho), velho);
});

test('dados do manual alinhados com a ficha (sem 245 kg nem corte de 60 cm)', () => {
  const m = fonte('../src/data/equipmentManualData.ts');
  const linha = m.split('\n').find(l => l.includes("['GMT 035'"))!;
  assert.ok(linha, 'linha do GMT 035');
  for (const t of ['Ø 5 a 40 cm', '35 a 65 L/min', '250 bar', '275 kg', '405 kg']) assert.ok(linha.includes(t), t);
  assert.ok(!/245|60 cm|185/.test(linha));
  const est = fonte('../src/components/catalog/EstudosComparativosModal.tsx');
  assert.ok(!est.includes('até 60 cm (duplo)') && !est.includes('40 cm (único)') && !est.includes('185 a 250'));
});
