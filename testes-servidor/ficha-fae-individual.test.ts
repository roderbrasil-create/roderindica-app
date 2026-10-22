// Fichas individuais aprovadas dos trituradores FAE de escavadeira (UML/S/EX/VT 125, UML/EX/VT 125, BL2/EX/VT 100, UMM/EX/VT 150).
// Rodar: node --import tsx --test testes-servidor/ficha-fae-individual.test.ts
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CHAVES_FICHA_FAE, FICHAS_FAE } from '../src/data/fichasTrituradorFae.ts';
import {
  CHAVES_FICHA_INDIVIDUAL, MODELOS_FICHA_ESCAVADEIRA, chaveIndividualDoModelo, decidirLinkFichaFae, temFichaIndividualFae,
} from '../src/lib/fichaEscavadeira.ts';

const fonte = (caminho: string) => readFileSync(new URL(caminho, import.meta.url), 'utf8');
const celulas = (chave: keyof typeof FICHAS_FAE) => FICHAS_FAE[chave].linhas.flatMap(l => l.celulas);

test('os 4 links ficha-fae abrem a ficha individual e os outros cinco abrem a geral', () => {
  const produto = { name: 'Desbastador', models: MODELOS_FICHA_ESCAVADEIRA.map(m => ({ id: m.chave, name: m.nome })) };
  for (const chave of ['uml-s-ex-vt', 'uml-ex-vt', 'bl2', 'umm']) {
    assert.deepEqual(decidirLinkFichaFae(`ficha-fae:${chave}`, [produto]), { acao: 'individual', chave });
  }
  for (const chave of ['bl0', 'pml', 'bl1', 'dml', 'bl3']) {
    const d = decidirLinkFichaFae(`ficha-fae:${chave}`, [produto]);
    assert.equal(d.acao, 'abrir', chave);
  }
  assert.deepEqual([...CHAVES_FICHA_INDIVIDUAL].sort(), [...CHAVES_FICHA_FAE].sort());
});

test('o "Ver ficha" do modelo do catálogo acha a ficha individual pelo nome ou pelo id', () => {
  assert.equal(chaveIndividualDoModelo({ id: 'fae-bl2-ex-vt', name: 'FAE BL2/EX/VT' }), 'bl2');
  assert.equal(chaveIndividualDoModelo({ id: 'fae-uml-ex-vt', name: 'FAE UML/EX/VT' }), 'uml-ex-vt');
  assert.equal(chaveIndividualDoModelo({ id: 'fae-uml-s-ex-vt', name: 'FAE UML/S/EX/VT' }), 'uml-s-ex-vt');
  assert.equal(chaveIndividualDoModelo({ id: 'x', name: 'FAE UMM/EX/VT' }), 'umm');
  assert.equal(chaveIndividualDoModelo({ id: 'fae-bl3-ex-vt', name: 'FAE BL3/EX/VT' }), null);
  assert.equal(chaveIndividualDoModelo({ id: 'fae-uml-ssl-vt-175', name: 'FAE UML SSL VT 175' }), null);
  assert.equal(chaveIndividualDoModelo(null), null);
  assert.equal(temFichaIndividualFae('bl0'), false);
});

test('as telas e o consultor roteiam: Catalog e EngineerHelper abrem a ficha individual, o card principal segue com a geral', () => {
  const cat = fonte('../src/pages/Catalog.tsx');
  assert.ok(cat.includes('chaveIndividualDoModelo(padrao.model)'));
  assert.ok(cat.includes('padrao && !padrao.geral'));
  assert.ok(cat.includes('geral: !model'));
  const eng = fonte('../src/components/layout/EngineerHelper.tsx');
  assert.ok(eng.includes("decisaoFae.acao === 'individual'"));
  const ver = eng.indexOf('const verFicha = ');
  assert.ok(eng.slice(ver, ver + 200).includes('chaveIndividualDoModelo(model)'));
  const env = eng.indexOf('const enviarFicha = ');
  assert.ok(eng.slice(env, env + 300).includes('enviarFichaFae(individual)'));
});

test('dados da UML/S/EX/VT 125', () => {
  const c = celulas('uml-s-ex-vt');
  for (const v of ['1.250 mm', '1.347 mm', '18 a 25 t', '1.450 kg', 'Ø 300 mm', '220 a 350 bar', '145 a 240 l/min', '26 + 4']) assert.ok(c.includes(v), v);
  assert.ok(c.some(x => x.includes('110/60 cc') && x.includes('de série')));
});

test('dados da UML/EX/VT 125 (peso 1.170 kg, dente C/3 padrão, sem C/3/HD planos)', () => {
  const f = FICHAS_FAE['uml-ex-vt'];
  const c = celulas('uml-ex-vt');
  for (const v of ['1.250 mm', '1.342 mm', '14 a 20 t', '1.170 kg', 'Ø 200 mm', '220 a 350 bar', '130 a 210 l/min', '26 + 2']) assert.ok(c.includes(v), v);
  assert.ok(!JSON.stringify(f).includes('C/3/HD'));
  assert.ok(f.dentes.some(d => d.titulo === 'Dente de vídea' && d.destaque === '(C/3)'));
});

test('dados da BL2/EX/VT 100 (570 kg, 18 lâminas BL/MINI, capô frontal hidráulico, C/3/MINI opcional)', () => {
  const f = FICHAS_FAE.bl2;
  const c = celulas('bl2');
  for (const v of ['1.000 mm', '8 a 14 t', '570 kg', 'Ø 150 mm', '180 a 350 bar', '100 a 140 l/min', '18']) assert.ok(c.includes(v), v);
  assert.ok(f.vantagens.includes('Capô frontal hidráulico de série'));
  assert.ok(f.introDentes.includes('BL/MINI sai de fábrica') && f.introDentes.includes('C/3/MINI') && f.introDentes.includes('opcional'));
});

test('dados da UMM/EX/VT 150 (2.120 kg, vídea sempre, suporte adaptador comprado uma vez)', () => {
  const f = FICHAS_FAE.umm;
  const c = celulas('umm');
  for (const v of ['1.500 mm', '1.584 mm', '20 a 30 t', '2.120 kg', 'Ø 300 mm', '240 a 350 bar', '130 a 210 l/min', '32 + 2']) assert.ok(c.includes(v), v);
  assert.ok(f.introDentes.includes('sempre fornece este modelo com dentes de vídea (C/3)'));
  assert.ok(f.introDentes.includes('comprado uma só vez'));
  assert.ok(f.introDentes.includes('o parafuso é o mesmo'));
});

test('nenhuma ficha cita Sonic nem motor maior opcional, e o motor VT é sempre de série', () => {
  for (const chave of CHAVES_FICHA_FAE) {
    const txt = JSON.stringify(FICHAS_FAE[chave]);
    assert.ok(!/sonic/i.test(txt), chave);
    assert.ok(celulas(chave).some(x => x.startsWith('Pistões de torque variável') && x.endsWith('de série')), chave);
    assert.ok(txt.includes('Roder/FAE'), chave);
  }
});

test('as imagens das fichas estão embutidas no repositório (public/fichas-fae), sem Firestore nem Storage', () => {
  const raiz = new URL('../public/fichas-fae/', import.meta.url);
  for (const chave of CHAVES_FICHA_FAE) {
    assert.ok(existsSync(new URL(`${chave}/foto.jpg`, raiz)), `${chave}/foto.jpg`);
    for (const d of FICHAS_FAE[chave].dentes) assert.ok(existsSync(new URL(`${chave}/${d.imagem}`, raiz)), `${chave}/${d.imagem}`);
  }
  for (const a of ['comum/qr.png', 'comum/roder-branco.png', 'comum/x-000.png', 'fonts/oswald-latin-400-normal.woff2', 'fonts/oswald-latin-700-normal.woff2']) assert.ok(existsSync(new URL(a, raiz)), a);
  const comp = fonte('../src/components/catalog/FichaTrituradorFae.tsx');
  assert.ok(!/firestore|firebase\/storage|db-file:\/\//.test(comp));
  // o PDF usa as cópias em memória e espera as imagens decodificarem (bug do iPhone com imagem grande na primeira captura)
  assert.ok(comp.includes('imagensEmMemoria') && comp.includes('esperarImagens(folha!)') && comp.includes('pdfDasFolhas([folha!])'));
});

test('o prompt do consultor ensina os fatos das 4 fichas e oferece a ficha individual', () => {
  const s = fonte('../server.ts');
  for (const l of ['ficha-fae:uml-s-ex-vt', 'ficha-fae:uml-ex-vt', 'ficha-fae:bl2', 'ficha-fae:umm']) assert.ok(s.includes(`(${l})`), l);
  for (const t of [
    '125 = 1.250 mm, 150 = 1.500 mm, 100 = 1.000 mm',
    'FICHA INDIVIDUAL oficial',
    'Só ofereça a ficha geral da linha',
    'não existe versão Sonic',
    'Roder/FAE',
    'Capô frontal hidráulico de série',
    'C/3/MINI',
    'vale só para os dentes CENTRAIS',
    'a Roder SEMPRE fornece com jogo de dentes de vídea',
    'comprado uma vez só e serve para os dois dentes',
    'os parafusos são os mesmos',
    'UML/S 26 + 4, UML/EX 26 + 2, UMM 32 + 2',
    '18 lâminas BL/MINI',
    'Nunca cite comissão do vendedor',
  ]) assert.ok(s.includes(t), t);
  assert.ok(!s.includes('Nunca informe número de dentes desses trituradores de escavadeira'));
});

test('catálogo e manual com os valores das fichas aprovadas', () => {
  const manual = fonte('../src/data/equipmentManualData.ts');
  for (const t of ["'1.170 kg', '130 a 210 L/min', '220 a 350 bar'", "'1.450 kg', '145 a 240 L/min'", "'570 kg', '100 a 140 L/min', '180 a 350 bar'", "'2.120 kg', '130 a 210 L/min', '240 a 350 bar'"]) assert.ok(manual.includes(t), t);
  assert.ok(!manual.includes('C/3/HD Planos'));
  const cat = fonte('../src/pages/Catalog.tsx');
  assert.ok(!cat.includes("peso_do_equipamento: '1100 a 1350'") && !cat.includes("peso_do_equipamento: '645 a 750'"));
  assert.ok(cat.includes("peso_do_equipamento: '1170'") && cat.includes("peso_do_equipamento: '570'") && cat.includes("peso_do_equipamento: '1450'") && cat.includes("peso_do_equipamento: '2120'"));
});
