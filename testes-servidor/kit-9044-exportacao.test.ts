import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarAlteracaoKit9044, SAEM_9044, QUANTIDADE_9044, ENTRAM_9044, DESCRICAO_KIT_9044 } from '../src/lib/kit9044';

const base = {
  description: 'KIT INSTALACAO CMF500/600 + LINCK ESCAVADEIRA CAT 320GC - ( MAQUINA COM FATIA EXTRA SEM LINHA)',
  items: [
    { code: '5000.1001.0053', description: 'caixa', quantity: 1 },
    { code: '5000.1001.0018', description: 'manopla', quantity: 1 },
    { code: '3000.5003.0100', description: 'comando', quantity: 1 },
    { code: '3000.5001.1188', description: 'mangueira 1650', quantity: 10 },
    { code: '3000.5001.1134', description: 'mangueira 2000', quantity: 2 },
    { code: '3000.5000.0398', description: 'adaptador', quantity: 3 },
    { code: '3000.5000.0276', description: 'adaptador 90', quantity: 8 },
    { code: '3000.5000.0324', description: 'adaptador', quantity: 2 },
    { code: '3000.5000.0294', description: 'adaptador', quantity: 2 },
    { code: '3000.5000.0294', description: 'adaptador (segunda linha do ERP)', quantity: 2 },
    { code: '3000.5000.0359', description: 'engate', quantity: 2 },
  ],
};

test('KIT 9044: o que o Jeferson mandou sair não consta mais no kit', () => {
  const r = aplicarAlteracaoKit9044(base);
  for (const c of SAEM_9044) assert.ok(!r.items.some(i => i.code === c), c);
});

test('KIT 9044: só a quantidade muda nos itens azuis e os outros ficam como estavam', () => {
  const r = aplicarAlteracaoKit9044(base);
  const q = (c: string) => r.items.find(i => i.code === c)!.quantity;
  for (const [c, n] of Object.entries(QUANTIDADE_9044)) assert.equal(q(c), n, c);
  assert.equal(q('3000.5000.0359'), 2);
  assert.equal(r.items.filter(i => i.code === '3000.5000.0294').length, 1);
});

test('KIT 9044: entram os itens verdes, inclusive os que ainda esperam código do ERP', () => {
  const r = aplicarAlteracaoKit9044(base);
  for (const n of ENTRAM_9044) assert.equal(r.items.find(i => i.code === n.code)?.quantity, n.quantity, n.code);
  assert.equal(r.items.filter(i => i.code.startsWith('A-CADASTRAR')).length, 5);
  assert.equal(r.description, DESCRICAO_KIT_9044);
  assert.ok(/DUPLA SEM LINHA/.test(r.description));
});

test('KIT 9044: rodar de novo não duplica nem desfaz', () => {
  const uma = aplicarAlteracaoKit9044(base);
  const duas = aplicarAlteracaoKit9044(uma);
  assert.deepEqual(duas, uma);
});
