import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const servidor = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const catalogo = readFileSync(new URL('../src/pages/Catalog.tsx', import.meta.url), 'utf8');

test('AFMC-280: ficha e foto existem nos arquivos públicos', () => {
  assert.ok(existsSync(new URL('../public/catalogo/estufagem/Ficha_AFMC-280.pdf', import.meta.url)));
  assert.ok(existsSync(new URL('../public/catalogo/estufagem/afmc-280.jpg', import.meta.url)));
});

test('AFMC-280: é o PRIMEIRO modelo da linha de estufagem no cadastro padrão', () => {
  const i = catalogo.indexOf("name: 'Garra para Estufagem'");
  const m = catalogo.indexOf('models: [', i);
  const primeiro = catalogo.slice(m, m + 200);
  assert.ok(/id: 'afmc-280'/.test(primeiro));
});

test('AFMC-280: o servidor inclui o modelo na frente da lista, uma vez só e sem duplicar', () => {
  assert.ok(/async function migrarAfmc280/.test(servidor));
  assert.ok(/models: \[novo, \.\.\.models\]/.test(servidor));
  assert.ok(/afmc280_2026_11_05/.test(servidor));
  assert.ok(/migrarAfmc280\(db\)/.test(servidor));
});

test('AFMC-280: "Ver ficha" abre o PDF próprio, sem cair na ficha geral de garras de estufagem', () => {
  assert.ok(/ehAlimentadorForno/.test(catalogo));
  assert.ok(/isEstufagem && !ehAlimentadorForno/.test(catalogo));
});

test('AFMC-280: o consultor sabe que é para mini carregadeira, sem preço e sem vídeo', () => {
  assert.ok(/ALIMENTADOR DE FORNO AFMC-280/.test(servidor));
  assert.ok(/MINI CARREGADEIRA/.test(servidor));
  assert.ok(/Não há vídeo cadastrado/.test(servidor));
});
