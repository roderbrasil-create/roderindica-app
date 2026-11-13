import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chaveFichaGt, chaveModeloGt, chaveDoLinkFichaGt, paginasFichaGt, pdfFichaGtUrl, CHAVES_FICHA_GT } from '../src/lib/fichaGt';

test('GT 600X abre a ficha nova, em qualquer grafia', () => {
  for (const n of ['GT 600x', 'GT600X', 'gt-600', 'Garra Traçadora GT 600X']) assert.equal(chaveFichaGt(n), 'gt600x', n);
});

test('modelos sem ficha nova (GT 280, 360, 400, 800, 1000) seguem na ficha padrão', () => {
  for (const n of ['GT 280', 'GT 360', 'GT 400', 'GT 800x', 'GT 1000x', 'CMF 600', '']) assert.equal(chaveModeloGt(n), null, n);
});

test('link ficha-gt reconhece 600x e recusa o resto', () => {
  assert.equal(chaveDoLinkFichaGt('ficha-gt:600x'), 'gt600x');
  assert.equal(chaveDoLinkFichaGt('ficha-gt:gt600'), 'gt600x');
  assert.equal(chaveDoLinkFichaGt('ficha-gt:800x'), null);
  assert.equal(chaveDoLinkFichaGt('ficha-rcu:75'), null);
});

test('os arquivos de cada ficha existem em public/fichas-gt', () => {
  for (const c of CHAVES_FICHA_GT) {
    for (const p of paginasFichaGt(c)) assert.ok(fs.existsSync('public' + p), p);
    assert.ok(fs.existsSync('public' + pdfFichaGtUrl(c)));
  }
});
