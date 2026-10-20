import test from 'node:test';
import assert from 'node:assert/strict';
import { caracteristicasDoModelo, textoEquipamentoCliente, linkWhatsSemNumero } from '../src/lib/mensagemWhatsCliente';

const ssh = { name: 'Fresas FAE SSH', description: 'Fresa para tocos e solo pesado. Trabalha até 500 mm.' };
const ssh150 = { id: 'ssh-150', name: 'SSH 150', technical_specs: { maquina_base: '160 a 280 hp', peso: '3690', trator: '160 a 280 hp' } };

test('traz de 2 a 4 características, sem passar de 4', () => {
  const m = { id: 'x', name: 'X', technical_specs: { maquina_base: '13 a 22 Ton.', peso: '5200', diametro_corte: '300', vazao: '200', pressao: '350', giro_360: 'Sim' } };
  const c = caracteristicasDoModelo(ssh, m);
  assert.equal(c.length, 4);
  assert.equal(c[0], 'Indicado para escavadeiras de 13 a 22 t');
  assert.ok(c.includes('Peso 5200 kg'));
});

test('cadastro magro completa com as frases da descrição até 2', () => {
  const c = caracteristicasDoModelo(ssh, { id: 'y', name: 'Y', technical_specs: {} });
  assert.deepEqual(c, ['Fresa para tocos e solo pesado.', 'Trabalha até 500 mm.']);
});

test('a mensagem leva o nome, as características e o link, e nada de comissão ou dado do parceiro', () => {
  const t = textoEquipamentoCliente(ssh, ssh150, 'https://roderindica.com/o/K7P2Q');
  assert.match(t, /\*Fresa FAE SSH 150\*/);
  assert.match(t, /• Peso 3690 kg/);
  assert.match(t, /https:\/\/roderindica\.com\/o\/K7P2Q$/);
  assert.doesNotMatch(t, /comiss|indica[çc][ãa]o|parceiro/i);
});

test('o link do WhatsApp não leva número e o texto volta inteiro ao decodificar', () => {
  const t = textoEquipamentoCliente(ssh, ssh150, 'https://roderindica.com/o/K7P2Q');
  const u = new URL(linkWhatsSemNumero(t));
  assert.equal(u.origin + u.pathname, 'https://wa.me/');
  assert.equal(u.searchParams.get('text'), t);
});

test('SSH: a faixa em hp vira "tratores" e não repete em outro item', () => {
  const c = caracteristicasDoModelo(ssh, ssh150);
  assert.equal(c[0], 'Indicado para tratores de 160 a 280 hp');
  assert.equal(c.filter(i => /160 a 280/.test(i)).length, 1);
  assert.ok(!c.some(i => /escavadeira/i.test(i)));
});

test('pá carregadeira: toneladas viram "pás carregadeiras" e texto solto é omitido', () => {
  const eng = { name: 'Engates Rápidos Pá Carregadeira' };
  assert.equal(caracteristicasDoModelo(eng, { name: 'E1', technical_specs: { maquina_base: '8 a 12 Ton.' } })[0], 'Indicado para pás carregadeiras de 8 a 12 t');
  const c = caracteristicasDoModelo(eng, { name: 'E2', technical_specs: { maquina_base: 'Pá Carregadeira', peso: '300' } });
  assert.deepEqual(c, ['Peso 300 kg']);
});

test('valores inválidos (objeto, lista, 0, NaN) são ignorados', () => {
  const c = caracteristicasDoModelo({ name: 'X' }, { name: 'M', technical_specs: { peso: 0, diametro_corte: NaN, abertura_maxima: { a: 1 }, vazao: [1], pressao: '0', trator: 'ok' } as any });
  assert.deepEqual(c, ['Trator ok']);
});

test('travessão do cadastro some', () => {
  const c = caracteristicasDoModelo({ name: 'X', description: 'Robusta — para tocos. Boa — rende.' }, { name: 'M', technical_specs: { trator: '160 – 280 hp' } });
  assert.ok(c.every(i => !/[—–]/.test(i)));
  assert.ok(c.includes('Trator 160 a 280 hp'));
  assert.ok(c.includes('Robusta, para tocos.'));
});

test('completa até 2 com frases da descrição; sem dado não inventa', () => {
  const d = { name: 'X', description: 'Primeira frase. Segunda frase. Terceira frase.' };
  assert.deepEqual(caracteristicasDoModelo(d, { name: 'M', technical_specs: { peso: '100' } }), ['Peso 100 kg', 'Primeira frase.']);
  assert.deepEqual(caracteristicasDoModelo(d, { name: 'M' }), ['Primeira frase.', 'Segunda frase.']);
  assert.deepEqual(caracteristicasDoModelo({ name: 'X' }, { name: 'M' }), []);
});
