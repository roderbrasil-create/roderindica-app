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
    '**6 a 10 t**', '**100 a 150 L/min**', '**190 a 220 bar**', '**Ø 660 mm**', '**1.452 mm**', '**740 mm**', '**750 kg**', '952, 630, 530, 477 e 260',
    'sob medida', 'modelo e o ano da máquina', 'sem buraco', 'menor custo por hectare', 'Queimada é proibida', 'Nunca cite comissão do vendedor',
  ]) assert.ok(s.includes(t), t);
  for (const velho of ['680 milímetros', '60 centímetros (600 mm)', 'REGRA DE TRIAGEM OBRIGATÓRIA PARA PERGUNTAS SOBRE DESTOCA']) assert.ok(!s.includes(velho), velho);
});

test('dados do manual e do cadastro alinhados com a ficha (peso 750 kg mantido; sem 240 mm, 14 a 25 t)', () => {
  const m = fonte('../src/data/equipmentManualData.ts');
  const linha = m.split('\n').find(l => l.includes("['Destocador DTH-240B'"))!;
  assert.ok(linha, 'linha do DTH-240B');
  for (const t of ['Ø 660 mm', '750 kg', '140 a 220', '280-350', '100 a 150', '190-220', '14 a 22', '6 a 10']) assert.ok(linha.includes(t), t);
  assert.ok(!/240 mm|14 a 25|120 a 180/.test(linha));
  const c = fonte('../src/pages/Catalog.tsx');
  assert.ok(!c.includes("diametro_corte: '240'") && c.includes("diametro_corte: '660'") && c.includes("peso: '750'"));
});

test('CARD DO DTH 240B: o cadastro antigo aparece com os valores novos, sem desfazer edição da diretoria', async () => {
  const { corrigirDestocadorDth240b, comDestocadorDthCorrigido, comUnidade, rotuloDiametroDoModelo, SPECS_DTH240B } = await import('../src/lib/destocadorDth.ts');
  const antigo = { id: 'p1', name: 'Destocador Tipo Broca', models: [{ id: 'dth-240b', name: 'DTH 240B', technical_specs: { diametro_corte: '240', peso: '750', maquina_base: '14 a 25 Ton.', pressao: '210 a 250', vazao: '120 a 180' } }] };
  const novo = comDestocadorDthCorrigido(antigo).models[0].technical_specs;
  assert.deepEqual({ ...novo }, { ...SPECS_DTH240B, peso: '750', comprimento_total: '1.452 mm', profundidade_trabalho: '740 mm' });
  assert.equal(antigo.models[0].technical_specs.diametro_corte, '240'); // não altera o original
  // campo já editado pela diretoria não é tocado; sem nada a mudar devolve null e o mesmo objeto
  const editado = [{ id: 'dth-240b', name: 'DTH 240B', technical_specs: { diametro_corte: '700', peso: '750', maquina_base: '14 a 25 Ton.' } }];
  assert.equal(corrigirDestocadorDth240b(editado)![0].technical_specs.diametro_corte, '700');
  assert.equal(corrigirDestocadorDth240b(editado)![0].technical_specs.maquina_base, SPECS_DTH240B.maquina_base);
  assert.equal(corrigirDestocadorDth240b([{ id: 'dth-240b', name: 'DTH 240B', technical_specs: { ...SPECS_DTH240B, peso: '750', comprimento_total: '1.452 mm', profundidade_trabalho: '740 mm' } }]), null);
  // outro modelo nunca é tocado
  const outro = [{ id: 'cmf-500', name: 'CMF 500', technical_specs: { diametro_corte: '240' } }];
  assert.equal(corrigirDestocadorDth240b(outro), null);
  assert.equal(comUnidade(SPECS_DTH240B.pressao, 'bar'), SPECS_DTH240B.pressao);
  assert.equal(comUnidade('660', 'mm'), '660 mm');
  assert.equal(rotuloDiametroDoModelo(antigo.models[0], 'Ø Máx. Corte'), 'Ø da broca');
  assert.equal(rotuloDiametroDoModelo(outro[0], 'Ø Máx. Corte'), 'Ø Máx. Corte');
});

test('a migração do DTH 240B é uma vez só, com marca em settings, só para a diretoria, e não mexe nas regras', () => {
  const m = fonte('../src/lib/migracaoDestocadorDth.ts');
  assert.ok(m.includes("'settings', 'migracao_destocador_dth240b'") && m.includes('getDoc(marca)'));
  assert.ok(m.includes('runTransaction') && m.includes('tx.get(ref)') && m.includes('tx.update(ref, { models: novos })'));
  const c = fonte('../src/pages/Catalog.tsx');
  const i = c.indexOf('corrigirDestocadorDthUmaVez(dadosBrutos, db)');
  assert.ok(i > c.indexOf("user?.email === 'roderbrasil@gmail.com'") && i > 0);
  assert.ok(c.includes('comDestocadorDthCorrigido'));
});

test('EDITOR DO DTH 240B: campos por perfil e medidas novas, e o cadastro antigo ganha as medidas sem apagar edição', async () => {
  const d = await import('../src/lib/destocadorDth.ts');
  const antigo = [{ id: 'dth-240b', name: 'DTH 240B', technical_specs: { diametro_corte: '240', peso: '750', maquina_base: '14 a 25 Ton.' } }];
  const s = d.corrigirDestocadorDth240b(antigo)![0].technical_specs;
  assert.equal(s.comprimento_total, '1.452 mm');
  assert.equal(s.profundidade_trabalho, '740 mm');
  const editado = [{ id: 'dth-240b', name: 'DTH 240B', technical_specs: { diametro_corte: '240', comprimento_total: '1.500 mm' } }];
  assert.equal(d.corrigirDestocadorDth240b(editado)![0].technical_specs.comprimento_total, '1.500 mm');
  assert.deepEqual(d.perfisDoTexto(d.SPECS_DTH240B.vazao), { escavadeira: '140 a 220 L/min', retro: '100 a 150 L/min' });
  assert.deepEqual(d.perfisDoTexto('14 a 22 t'), { escavadeira: '14 a 22 t', retro: '' });
  assert.equal(d.comporPerfis('14 a 22 t', '6 a 10 t', 'retro/escav. pequena'), d.SPECS_DTH240B.maquina_base);
  assert.equal(d.comporPerfis('14 a 22 t', ''), '14 a 22 t');
  for (const k of Object.keys(d.SPECS_DTH240B) as (keyof typeof d.SPECS_DTH240B)[]) {
    const p = d.perfisDoTexto(d.SPECS_DTH240B[k]);
    assert.equal(d.comporPerfis(p.escavadeira, p.retro, k === 'maquina_base' ? 'retro/escav. pequena' : 'retro'), d.SPECS_DTH240B[k], k);
  }
  const c = fonte('../src/pages/Catalog.tsx');
  assert.ok(c.includes('data-editor-dth240b') && c.includes('ehModeloDth240b(editingModelData)') && c.includes('Ø da broca (mm)') && c.includes('ROTULOS_DTH240B'));
});

test('PERFIS DO EDITOR: só retro, só escavadeira, ambos, apagar um deles e ida e volta', async () => {
  const d = await import('../src/lib/destocadorDth.ts');
  const ida = (e: string, r: string, n = 'retro') => d.perfisDoTexto(d.comporPerfis(e, r, n));
  assert.deepEqual(ida('', '6 a 10 t', 'retro/escav. pequena'), { escavadeira: '', retro: '6 a 10 t' }); // só retro
  assert.deepEqual(ida('14 a 22 t', ''), { escavadeira: '14 a 22 t', retro: '' }); // só escavadeira
  assert.deepEqual(ida('14 a 22 t', '6 a 10 t'), { escavadeira: '14 a 22 t', retro: '6 a 10 t' }); // ambos
  // apagar um deles, a partir do texto completo
  const completo = d.SPECS_DTH240B.vazao;
  let p = d.perfisDoTexto(completo);
  assert.deepEqual(d.perfisDoTexto(d.comporPerfis('', p.retro)), { escavadeira: '', retro: p.retro });
  assert.deepEqual(d.perfisDoTexto(d.comporPerfis(p.escavadeira, '')), { escavadeira: p.escavadeira, retro: '' });
  assert.equal(d.comporPerfis('', ''), '');
  // texto só com retro, voltando para o campo certo, e recomposto igual
  const soRetro = d.comporPerfis('', '100 a 150 L/min');
  assert.equal(soRetro, '100 a 150 L/min (retro)');
  assert.equal(d.comporPerfis(d.perfisDoTexto(soRetro).escavadeira, d.perfisDoTexto(soRetro).retro), soRetro);
  // texto antigo sem sufixo conta como escavadeira
  assert.deepEqual(d.perfisDoTexto('14 a 25 Ton.'), { escavadeira: '14 a 25 Ton.', retro: '' });
});

test('MIGRAÇÃO: reconhece também os valores intermediários do commit 52160d1', async () => {
  const d = await import('../src/lib/destocadorDth.ts');
  const inter = [{ id: 'dth-240b', name: 'DTH 240B', technical_specs: {
    diametro_corte: '660', peso: '750',
    maquina_base: '14 a 22 Ton. (escavadeira) | 6 a 10 Ton. (retro/escavadeira pequena)',
    pressao: '280 a 350 (escavadeira) | 190 a 220 (retro)', vazao: '140 a 220 (escavadeira) | 100 a 150 (retro)' } }];
  const s = d.corrigirDestocadorDth240b(inter)![0].technical_specs;
  assert.equal(s.maquina_base, d.SPECS_DTH240B.maquina_base);
  assert.equal(s.pressao, d.SPECS_DTH240B.pressao);
  assert.equal(s.vazao, d.SPECS_DTH240B.vazao);
});

test('SUPORTE DO DESTOCADOR: sob medida, nunca "o mesmo suporte padrão" do SAC 500 e do Feller', () => {
  const s = fonte('../server.ts');
  assert.ok(!s.includes('mesmo suporte padrão utilizado') && !s.includes('o mesmo suporte padrão utilizado no destocador'));
  assert.ok(s.includes('SOB MEDIDA para a máquina do cliente') && s.includes('fabricado sob medida pela Roder'));
});
