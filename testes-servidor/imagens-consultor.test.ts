import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fixConsultantImages } from '../server/imagensConsultor';

const indice = [
  { label: 'Cabeçote Multifuncional CMF 500', url: 'https://x/cmf500.jpg' },
  { label: 'Cabeçote Multifuncional CMF 600', url: 'https://x/cmf600.jpg' },
];

test('resposta comum mostra no máximo 1 foto', () => {
  const t = '![CMF 500](u1) texto\n\n![CMF 600](u2) texto';
  const r = fixConsultantImages(t, indice);
  assert.equal((r.match(/!\[/g) || []).length, 1);
});

test('comparativo mostra a foto dos DOIS equipamentos, cada uma a do seu modelo', () => {
  const t = '# RELATÓRIO COMPARATIVO TÉCNICO E OPERACIONAL: CMF 500 vs. CMF 600\n\n![Cabeçote CMF 500](a) **CMF 500**: x\n\n![Cabeçote CMF 600](b) **CMF 600**: y';
  const r = fixConsultantImages(t, indice);
  assert.match(r, /!\[Cabeçote CMF 500\]\(https:\/\/x\/cmf500\.jpg\)/);
  assert.match(r, /!\[Cabeçote CMF 600\]\(https:\/\/x\/cmf600\.jpg\)/);
});

test('comparativo não repete a mesma foto para dois equipamentos', () => {
  const t = '# RELATÓRIO COMPARATIVO\n\n![CMF 500](a) x\n\n![CMF 500](b) y';
  assert.equal((fixConsultantImages(t, indice).match(/!\[/g) || []).length, 1);
});

test('a regra 21 manda foto de todos, 80% aplicado, rebrota do CMF 500 não indicada e uma folha A4', () => {
  const s = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.match(s, /UMA FOTO POR EQUIPAMENTO COMPARADO/);
  assert.match(s, /Jornada com 80% aplicado/);
  assert.match(s, /CMF 500 = "Não indicado"/);
  assert.match(s, /UMA folha/);
  assert.match(s, /Máquina base é parte do comparativo/);
});
