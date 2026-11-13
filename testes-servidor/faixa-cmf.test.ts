import test from 'node:test';
import assert from 'node:assert/strict';
import { faixaDoModelo, corrigirFaixaCmf500 } from '../src/lib/faixaCmf';

test('CMF 500 com "8 a 22 Ton." aparece como 8 a 13 no explorador', () => {
  assert.equal(faixaDoModelo({ id: 'cmf-500', name: 'CMF 500', technical_specs: { peso_operacional: '8 a 22 Ton.' } }), '8 a 13 Ton.');
  assert.equal(faixaDoModelo({ id: 'x', name: 'CMF 500', technical_specs: { maquina_base: '8 a 22 Ton' } }), '8 a 13 Ton.');
});

test('CMF 600 e outros modelos não mudam', () => {
  assert.equal(faixaDoModelo({ id: 'cmf-600', name: 'CMF 600', technical_specs: { maquina_base: '13 a 22 Ton' } }), '13 a 22 Ton');
  assert.equal(faixaDoModelo({ id: 'gt', name: 'GT 400X', technical_specs: { maquina_base: '8 a 22 Ton.' } }), '8 a 22 Ton.');
});

test('correção do cadastro troca só o CMF 500 e devolve null quando já está certo', () => {
  const modelos = [
    { id: 'cmf-500', name: 'CMF 500', technical_specs: { peso_operacional: '8 a 22 Ton.', motor: '24 cc' } },
    { id: 'cmf-600', name: 'CMF 600', technical_specs: { peso_operacional: '13 a 22 Ton.' } },
  ];
  const novos = corrigirFaixaCmf500(modelos)!;
  assert.equal(novos[0].technical_specs.peso_operacional, '8 a 13 Ton.');
  assert.equal(novos[0].technical_specs.motor, '24 cc');
  assert.equal(novos[1], modelos[1]);
  assert.equal(corrigirFaixaCmf500(novos), null);
});

import { corrigirFaixaCmf800, faixaDoModelo as faixaDoModelo800, FAIXA_CMF800 } from '../src/lib/faixaCmf';
import test800 from 'node:test';
import assert800 from 'node:assert/strict';

test800('CMF 800: faixa antiga 20 a 30 t vira 20 a 35 t, sem mexer nos outros modelos', () => {
  const modelos = [
    { id: 'cmf-600', name: 'CMF 600', technical_specs: { peso_operacional: '20 a 30 Ton.' } },
    { id: 'cmf-800', name: 'CMF 800', technical_specs: { peso_operacional: '20 a 30 Ton.' } },
  ];
  const novos = corrigirFaixaCmf800(modelos)!;
  assert800.equal(novos[1].technical_specs.peso_operacional, FAIXA_CMF800);
  assert800.equal(novos[0].technical_specs.peso_operacional, '20 a 30 Ton.');
  assert800.equal(faixaDoModelo800(modelos[1]), '20 a 35 Ton.');
  assert800.equal(corrigirFaixaCmf800(novos), null);
});
