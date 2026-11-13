import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chaveFichaGt, chaveModeloGt, chaveDoLinkFichaGt, paginasFichaGt, pdfFichaGtUrl, CHAVES_FICHA_GT } from '../src/lib/fichaGt';

test('GT 600X abre a ficha nova, em qualquer grafia', () => {
  for (const n of ['GT 600x', 'GT600X', 'gt-600', 'Garra Traçadora GT 600X']) assert.equal(chaveFichaGt(n), 'gt600x', n);
});

test('modelos sem ficha nova (GT 280, 360, 400) seguem na ficha padrão', () => {
  for (const n of ['GT 280', 'GT 360', 'GT 400', 'CMF 600', '']) assert.equal(chaveModeloGt(n), null, n);
});

test('link ficha-gt reconhece 600x e recusa o resto', () => {
  assert.equal(chaveDoLinkFichaGt('ficha-gt:600x'), 'gt600x');
  assert.equal(chaveDoLinkFichaGt('ficha-gt:gt600'), 'gt600x');
  assert.equal(chaveDoLinkFichaGt('ficha-gt:800x'), 'gt800x');
  assert.equal(chaveDoLinkFichaGt('ficha-gt:400x'), null);
  assert.equal(chaveDoLinkFichaGt('ficha-rcu:75'), null);
});

test('os arquivos de cada ficha existem em public/fichas-gt', () => {
  for (const c of CHAVES_FICHA_GT) {
    for (const p of paginasFichaGt(c)) assert.ok(fs.existsSync('public' + p), p);
    assert.ok(fs.existsSync('public' + pdfFichaGtUrl(c)));
  }
});

import { corrigirEspecificacoesGt, ESPECIFICACOES_GT } from '../src/lib/fichaGt';

test('GT 600X, 800X e 1000X abrem ficha nova', () => {
  assert.equal(chaveFichaGt('GT 800x'), 'gt800x');
  assert.equal(chaveFichaGt('GT 1000x'), 'gt1000x');
  assert.equal(chaveFichaGt('GT 400X'), null);
});

test('cadastro dos cards recebe os dados das fichas e só mexe nos três modelos', () => {
  const modelos = [
    { id: 'gt-400x', name: 'GT 400X', technical_specs: { peso: '825 kg' } },
    { id: 'gt-600x', name: 'GT 600x', technical_specs: { peso: '1300', pressao: '220 a 250', extra: 'fica' } },
    { id: 'gt-800x', name: 'GT 800x', technical_specs: { motor: '80 cc', sabre: '58"' } },
    { id: 'gt-1000x', name: 'GT 1000x', technical_specs: {} },
  ];
  const novos = corrigirEspecificacoesGt(modelos)!;
  assert.deepEqual(novos[0], modelos[0]);
  assert.equal(novos[1].technical_specs!.pressao, '240');
  assert.equal(novos[1].technical_specs!.extra, 'fica');
  assert.equal(novos[2].technical_specs!.sabre, '60"');
  assert.equal(novos[3].technical_specs!.abertura_maxima, ESPECIFICACOES_GT.gt1000x.abertura_maxima);
  assert.equal(corrigirEspecificacoesGt(novos), null);
});
