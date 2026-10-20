import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseKitsText } from '../server/kitsPdf';
import { computeKitsDiff } from '../src/lib/kitsDiff';
import { INSTALLATION_KITS } from '../src/constants';

const ler = (n: string) => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8');
const total = (k: { items: unknown[] }[]) => k.reduce((a, x) => a + x.items.length, 0);

test('PDF do ERP 08/2026: os dois formatos de texto dão os mesmos 58 kits e 1007 itens', () => {
  const layout = parseKitsText(ler('kits-layout.txt'));
  const pdfparse = parseKitsText(ler('kits-pdfparse.txt'));
  assert.equal(layout.length, 58);
  assert.equal(total(layout), 1007);
  assert.deepEqual(pdfparse, layout);
});

test('rodapé "n of 19" do pdf-parse não vaza na descrição do item', () => {
  const kits = parseKitsText(ler('kits-pdfparse.txt'));
  assert.ok(!JSON.stringify(kits).includes(' of 19'));
});

test('item repetido no mesmo kit continua separado (9003, 9031, 9044, 9056)', () => {
  const kits = parseKitsText(ler('kits-layout.txt'));
  for (const c of ['9003', '9031', '9044', '9056']) {
    const k = kits.find(x => x.code === `9000.9000.${c}`)!;
    const codigos = k.items.map(i => i.code);
    assert.ok(codigos.length > new Set(codigos).size, `kit ${c} deveria ter item repetido`);
  }
});

test('descrição com "L" no meio não é truncada como se fosse unidade', () => {
  const kits = parseKitsText(ler('kits-layout.txt'));
  const todas = kits.flatMap(k => k.items.map(i => i.description));
  assert.equal(todas.filter(d => d === 'CHAPA PERFIL L ADAPTADOR PAINEL 7/8').length, 6);
});

test('INSTALLATION_KITS é exatamente o que o parser lê do PDF', () => {
  const lidos = parseKitsText(ler('kits-layout.txt')).sort((a, b) => a.code.localeCompare(b.code));
  assert.equal(INSTALLATION_KITS.length, 58);
  assert.deepEqual(INSTALLATION_KITS, lidos);
});

test('computeKitsDiff: sem mudança, nada é acusado (inclusive com item repetido)', () => {
  const d = computeKitsDiff(INSTALLATION_KITS, INSTALLATION_KITS);
  assert.equal(d.added.length + d.updated.length, 0);
  assert.equal(d.unchanged.length, 58);
});

test('computeKitsDiff: detecta item adicionado, removido, quantidade alterada e kit novo', () => {
  const base = INSTALLATION_KITS.filter(k => k.code !== '9000.9000.9035').map(k => ({ ...k, items: k.items.map(i => ({ ...i })) }));
  const k0 = base[0];
  const removido = k0.items.shift()!;
  k0.items[0].quantity += 1;
  k0.items.push({ code: '9999.9999.9999', description: 'ITEM FALSO', quantity: 1 });
  const d = computeKitsDiff(INSTALLATION_KITS, base);
  assert.equal(d.added.length, 1);
  assert.equal(d.added[0].parsedKit.code, '9000.9000.9035');
  assert.equal(d.updated.length, 1);
  const c = d.updated[0].changes.join('\n');
  assert.match(c, /Item adicionado: .*Qtd/);
  assert.match(c, /Qtd alterada/);
  assert.match(c, /Item removido/);
  assert.ok(base[0].items.some(i => i.code === '9999.9999.9999') && removido);
});

test('todo código de kit citado no consultor e no prompt existe em INSTALLATION_KITS', () => {
  const codigos = new Set(INSTALLATION_KITS.map(k => k.code));
  for (const arq of ['../src/lib/confirmacaoMaquina.ts', '../server.ts']) {
    const txt = readFileSync(new URL(arq, import.meta.url), 'utf8');
    for (const c of new Set(txt.match(/9000\.9000\.9\d{3}/g) || [])) {
      assert.ok(codigos.has(c), `${c} citado em ${arq} não está em INSTALLATION_KITS`);
    }
  }
});

test('kit 9035 tem itens (antes estava vazio)', () => {
  const k = INSTALLATION_KITS.find(x => x.code === '9000.9000.9035')!;
  assert.equal(k.items.length, 20);
});

test('plano B da tela usa o mesmo parser do servidor, sem parser local duplicado', () => {
  const tela = readFileSync(new URL('../src/pages/Accessories.tsx', import.meta.url), 'utf8');
  assert.match(tela, /from '\.\.\/\.\.\/server\/kitsPdf'/);
  assert.ok(!tela.includes('itemRegex'), 'parser local antigo voltou');
});

test('quantidade de todo item é inteira e >= 1, salvo os dois itens em MT (cabo do 9040 e mangueira do 9056)', () => {
  const fora: string[] = [];
  for (const k of INSTALLATION_KITS) for (const i of k.items) {
    if (i.unit === 'MT') continue;
    if (!Number.isInteger(i.quantity) || i.quantity < 1) fora.push(`${k.code} ${i.code} ${i.quantity}`);
  }
  assert.deepEqual(fora, []);
  const mt = INSTALLATION_KITS.flatMap(k => k.items.filter(i => i.unit === 'MT').map(i => `${k.code}|${i.code}|${i.quantity}`));
  assert.deepEqual(mt, ['9000.9000.9040|5000.1001.0030|2.5', '9000.9000.9056|3000.5001.0029|0.8']);
});

test('formatarQuantidadeKit: inteiro sem casas, MT com vírgula e unidade, nunca 0,01', async () => {
  const { formatarQuantidadeKit } = await import('../src/lib/kitQuantidade');
  assert.equal(formatarQuantidadeKit({ quantity: 14 }), '14');
  assert.equal(formatarQuantidadeKit({ quantity: 2.5, unit: 'MT' }), '2,5 MT');
  assert.equal(formatarQuantidadeKit({ quantity: 0.8, unit: 'MT' }), '0,8 MT');
  assert.equal(formatarQuantidadeKit({ quantity: 1, unit: 'PC' }), '1 PC');
});

test('9015 é o kit de garra + lança extensora do PDF, sem o link 1000.0000.0120 dentro', () => {
  const k = INSTALLATION_KITS.find(x => x.code === '9000.9000.9015')!;
  assert.match(k.description, /^KIT INSTALACAO GARRA \+ LANCA EXTENSORA EM ESCAVADEIRA/);
  assert.equal(k.items.length, 14);
  assert.ok(!k.items.some(i => i.code === '1000.0000.0120'));
  const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.ok(!/Kit Hidráulico \*\*9000\.9000\.9015/.test(server));
  assert.match(server, /NUNCA diga que o 9015 inclui o link/);
});
