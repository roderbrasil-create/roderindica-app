import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A ficha em PDF mandada pelo consultor saía sem a foto no iPhone (caixa cinza). A foto agora vai reduzida e
// decodificada, a captura é aquecida antes da definitiva e as imagens esperam o decode.
test('o PDF da ficha usa foto leve, aquece a captura e espera o decode das imagens', () => {
  const pdf = readFileSync('src/components/catalog/fichaPdf.ts', 'utf8');
  const ficha = readFileSync('src/components/catalog/FichaPadrao.tsx', 'utf8');
  assert.match(pdf, /export async function fotoLeveParaPdf/);
  assert.match(pdf, /canvas\.toDataURL\('image\/jpeg'/);
  assert.match(pdf, /img\.decode\(\)/);
  assert.match(pdf, /aquece o motor/);
  assert.match(ficha, /resolverImagem\(fotoDoModelo\(p, m\)\)\.then\(f => fotoLeveParaPdf\(f\)\)/);
});
