import test from 'node:test';
import assert from 'node:assert/strict';
import { caracteristicasDoModelo, textoEquipamentoCliente, linkWhatsSemNumero } from '../src/lib/mensagemWhatsCliente';

const ssh = { name: 'Fresas FAE SSH', description: 'Fresa para tocos e solo pesado. Trabalha até 500 mm.' };
const ssh150 = { id: 'ssh-150', name: 'SSH 150', technical_specs: { maquina_base: '160 a 280 hp', peso: '3690', trator_hp: '160 a 280 hp' } };

test('traz de 2 a 4 características, sem passar de 4', () => {
  const m = { id: 'x', name: 'X', technical_specs: { maquina_base: '13 a 22 Ton.', peso: '5200', diametro_corte: '300', vazao: '200', pressao: '350', giro_360: 'Sim' } };
  const c = caracteristicasDoModelo(ssh, m);
  assert.equal(c.length, 4);
  assert.equal(c[0], 'Indicado para escavadeiras de 13 a 22 t');
  assert.ok(c.includes('Peso 5200 kg'));
});

test('cadastro magro completa com a primeira frase da descrição', () => {
  const c = caracteristicasDoModelo(ssh, { id: 'y', name: 'Y', technical_specs: {} });
  assert.deepEqual(c, ['Fresa para tocos e solo pesado.']);
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
