// Fichas do site por modelo: só preenche o que está vazio, nunca troca link salvo.
// Rodar: node --import tsx --test testes-servidor/fichas-do-site.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fichaDoSiteParaModelo, modelosComFichaDoSite } from '../src/lib/fichasDoSite.ts';

const produto = () => ({
  name: 'Triturador / Desbastador FAE p/ Pá Carregadeira', pdf_url: '',
  models: [
    { id: 'fae-uml-ssl-vt-175', name: 'FAE UML SSL VT 175', pdf_url: '' },
    { id: 'fae-140-u-pm-200', name: 'FAE 140 U PM 200', pdf_url: '' },
    { id: 'outro', name: 'Outro', pdf_url: '' },
  ],
});

test('preenche os dois modelos da pá carregadeira com o PDF do site e deixa o desconhecido vazio', () => {
  const r = modelosComFichaDoSite(produto())!;
  assert.equal(r[0].pdf_url, 'https://roderbrasil.com.br/wp-content/uploads/2025/09/FAE-UML-SSL.pdf');
  assert.equal(r[1].pdf_url, 'https://roderbrasil.com.br/wp-content/uploads/2025/09/FAE-140U_200U.pdf');
  assert.equal(r[2].pdf_url, '');
});

test('não sobrescreve ficha já salva no modelo', () => {
  const p = produto();
  p.models[0].pdf_url = '/catalogo/ficha-propria.pdf';
  assert.equal(fichaDoSiteParaModelo(p, p.models[0]), '');
});

test('produto que já tem PDF de linha não recebe link por modelo', () => {
  const p = produto();
  p.pdf_url = 'https://roderbrasil.com.br/x.pdf';
  assert.equal(modelosComFichaDoSite(p), null);
});

test('rodar de novo não muda nada (idempotente)', () => {
  const p = produto();
  p.models = modelosComFichaDoSite(p)!;
  assert.equal(modelosComFichaDoSite(p), null);
});
