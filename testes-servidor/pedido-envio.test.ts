import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pediuFicha, pediuEnvioEquipamento, formatoDoEnvio, REGRA_ENVIO_EQUIPAMENTO } from '../src/lib/pedidoEnvio';

const COMPLETO = [
  'quero enviar o CMF 600 para o cliente',
  'preciso mandar esse equipamento pro cliente',
  'me passa o catálogo do UML/S/EX/VT',
  'tem um folder do cabeçote?',
  'quero apresentar a garra R800 ao cliente',
  'material de divulgação do triturador',
  'uma propaganda da fresa SSH para postar',
  'compartilhar a SSH 200 no whatsapp',
  'mostrar o equipamento pro cliente',
  'encaminhar o link do equipamento',
  'Enviar o UML pro cliente',
];
const FICHA = [
  'manda a ficha do CMF 500',
  'preciso da ficha técnica da R600',
  'quero o PDF do UML',
  'envia a ficha técnica para o cliente',
  'me passa a Ficha',
  'tem datasheet da fresa?',
  'folha técnica da garra',
];

test('qualquer pedido de enviar o equipamento sai no formato completo (foto + características + link), sem perguntar', () => {
  for (const t of COMPLETO) {
    assert.equal(pediuEnvioEquipamento(t), true, t);
    assert.equal(formatoDoEnvio(t), 'completo', t);
  }
});

test('só pedido explícito de ficha, ficha técnica ou PDF mostra o botão da ficha', () => {
  for (const t of FICHA) {
    assert.equal(pediuFicha(t), true, t);
    assert.equal(formatoDoEnvio(t), 'ficha', t);
  }
  for (const t of COMPLETO) assert.equal(pediuFicha(t), false, t);
});

test('pergunta técnica comum não vira pedido de envio nem de ficha', () => {
  for (const t of ['qual escavadeira serve para o CMF 600?', 'o UML funciona com 18 toneladas?', 'tem pronta entrega?']) {
    assert.equal(pediuEnvioEquipamento(t), false, t);
    assert.equal(pediuFicha(t), false, t);
  }
});

test('o prompt do consultor leva a regra de envio e não oferece catálogo como pedido de ficha', () => {
  const srv = readFileSync('server.ts', 'utf8');
  assert.ok(srv.includes('${REGRA_ENVIO_EQUIPAMENTO}'), 'regra não entrou no prompt');
  assert.ok(!/solicitar a ficha técnica, especificações detalhadas ou o catálogo/.test(srv), 'catálogo ainda dispara a ficha');
  assert.match(REGRA_ENVIO_EQUIPAMENTO, /NÃO ofereça escolha/);
  assert.match(REGRA_ENVIO_EQUIPAMENTO, /Enviar ao cliente/);
  assert.ok(!/—/.test(REGRA_ENVIO_EQUIPAMENTO), 'travessão no prompt');
});

test('os botões do consultor mandam ao cliente no formato do catálogo e a ficha só quando pedida', () => {
  const src = readFileSync('src/components/layout/EngineerHelper.tsx', 'utf8');
  assert.ok(!src.includes('escolherEnvio'), 'sobrou a escolha de dois botões');
  assert.ok(!src.includes('mandarAoClienteWhats'), 'sobrou o envio só com texto');
  assert.ok(src.includes('textoEnvioModelo('), 'não usa o texto do catálogo (fonte única)');
  assert.ok(src.includes('compartilharModeloComFoto('), 'não manda a foto');
  assert.ok(src.includes('fichaPedida'), 'botão da ficha sem trava');
  const cat = readFileSync('src/pages/Catalog.tsx', 'utf8');
  assert.ok(cat.includes('textoEnvioModelo(') && cat.includes('compartilharModeloComFoto('), 'catálogo deixou de usar o código compartilhado');
});
