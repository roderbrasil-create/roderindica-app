import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rolagemParaAncorar, pontoDoConteudo, limitarZoom } from '../src/lib/zoomAncora.ts';

const fonte = (c: string) => readFileSync(new URL(`../src/components/${c}`, import.meta.url), 'utf8');

test('PINÇA: o ponto sob o dedo continua sob o dedo em qualquer zoom, inclusive arrastando com os dois dedos', () => {
  // dedos no meio do quadro (x = 186) com a ficha rolada 40 px a 100%
  const c = pontoDoConteudo(40, 186, 1);
  for (const z of [1.5, 2.2, 4]) {
    const rolagem = rolagemParaAncorar(c, z, 186);
    assert.ok(Math.abs(pontoDoConteudo(rolagem, 186, z) - c) < 1e-9, `perdeu o ponto no zoom ${z}`);
  }
  // os dedos andaram 30 px para a direita: o mesmo ponto do conteúdo acompanha
  const rolagem = rolagemParaAncorar(c, 2, 216);
  assert.ok(Math.abs(pontoDoConteudo(rolagem, 216, 2) - c) < 1e-9);
});

test('ZOOM: nunca passa do limite nem fica abaixo de 100%', () => {
  assert.equal(limitarZoom(0.4, 4), 1);
  assert.equal(limitarZoom(9, 4), 4);
  assert.equal(limitarZoom(2.5, 4), 2.5);
});

test('PISCADA DA SSH: o quadro da folha não estica a folha (items-start), senão a medida lê a própria altura e entra em laço', () => {
  // Sem items-start a folha estica até a altura do quadro; a medida (offsetHeight x escala) vira a altura nova do
  // quadro e ele encolhe a cada medida até zero, volta a "auto" e recomeça (scrollHeight oscilando 1229 e 2673).
  for (const arq of ['catalog/FresaSshFicha.tsx', 'catalog/CabecotePodaFicha.tsx']) {
    assert.match(fonte(arq), /flex justify-center items-start/, `${arq} sem items-start no quadro da folha`);
  }
});

test('ZOOM DA FICHA: a barra de modelos é fixa (topo) e a borda do arraste não estica', () => {
  const zoom = fonte('documento/ZoomRolagem.tsx');
  assert.match(zoom, /topo\?: React\.ReactNode/);
  assert.match(zoom, /overscrollBehavior: 'none'/);
  for (const arq of ['catalog/FichaPadrao.tsx', 'catalog/FresaSshFicha.tsx']) {
    assert.match(fonte(arq), /topo=\{/, `${arq} deixou a barra de modelos dentro da área que amplia`);
  }
});
