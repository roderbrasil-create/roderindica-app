// Consultor por perfil e pronta entrega. Rodar: node --import tsx --test testes-servidor/consultor-perfil.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { instrucaoPerfilConsultor, ehEquipeNoConsultor } from '../server/consultorPerfil.ts';
import { montarProntaEntrega, itemProntoDe } from '../src/lib/prontaEntrega.ts';

test('equipe Roder recebe a diretriz técnica: veredito primeiro, sem linguagem de venda', () => {
  for (const role of ['admin', 'manager', 'internal_seller', 'triagem', 'vendedor_padrao']) {
    const t = instrucaoPerfilConsultor({ role, name: 'Heloisa' });
    assert.match(t, /EQUIPE RODER/);
    assert.match(t, /\*\*Serve\*\*, \*\*Não serve\*\* ou \*\*Verificar\*\*/);
    assert.match(t, /Kit de instalação/);
    assert.match(t, /Ponteira\/biela/);
    assert.match(t, /Sem linguagem de venda/);
    assert.ok(!t.includes('\u2014'));
  }
});

test('equipe que entrou pelo link da equipe (sem login) também é equipe', () => {
  assert.equal(ehEquipeNoConsultor({ role: 'vendedor', equipe: true }), true);
  assert.match(instrucaoPerfilConsultor({ role: 'vendedor', equipe: true }), /EQUIPE RODER/);
});

test('o servidor decide a equipe quando sabe: navegador dizendo equipe não basta', () => {
  // quem se diz admin pelo navegador, mas o token não confirma, recebe a diretriz de parceiro
  assert.match(instrucaoPerfilConsultor({ role: 'admin', equipe: true }, false), /PARCEIRO\/VENDEDOR/);
  // sem token conferido no servidor (undefined), vale o perfil informado: admin logado continua equipe
  assert.match(instrucaoPerfilConsultor({ role: 'admin', equipe: true }, undefined), /EQUIPE RODER/);
  assert.match(instrucaoPerfilConsultor({ role: 'external_seller' }, true), /EQUIPE RODER/);
});

test('parceiro e visitante continuam com a diretriz de parceiro; cliente com a de cliente', () => {
  assert.match(instrucaoPerfilConsultor({ role: 'external_seller', name: 'Carlos' }), /PARCEIRO\/VENDEDOR/);
  assert.match(instrucaoPerfilConsultor({ role: 'visitor' }), /PARCEIRO\/VENDEDOR/);
  assert.match(instrucaoPerfilConsultor({}), /PARCEIRO\/VENDEDOR/);
  assert.match(instrucaoPerfilConsultor({ role: 'client' }), /CLIENTE final/);
  assert.equal(ehEquipeNoConsultor({ role: 'external_seller', equipe: 'sim' }), false);
  assert.equal(ehEquipeNoConsultor(null), false);
});

const produtos = [
  { id: 'garras', name: 'Garras Florestais', models: [
    { id: 'r400', name: 'R400', images: ['https://x/r400.png'], technical_specs: { codigo_roder: '1000.0400', maquina_base: '12 a 18' } },
    { id: 'r250', name: 'R250', technical_specs: {} },
  ] },
  { id: 'cab', name: 'Cabeçote CMF', models: [{ id: 'cmf500', name: 'CMF 500', technical_specs: {} }] },
  { id: 'bloq', name: 'Bloqueado', is_blocked: true, models: [{ id: 'x1', name: 'X 1000', technical_specs: {} }] },
];

test('pronta entrega: casa pelo código e pelo nome inteiro, só com quantidade, sem bloqueado', () => {
  const estoque = [
    { code: '1000.0400', description: 'GARRA', quantity: 2 },
    { code: '', description: 'CABECOTE CMF500 COMPLETO', quantity: 1 },
    { code: '', description: 'GARRA R2500', quantity: 3 }, // R250 não casa com R2500
    { code: '', description: 'X 1000', quantity: 5 }, // produto bloqueado
    { code: '', description: 'R250 usada', quantity: 0 }, // sem quantidade
  ];
  const lista = montarProntaEntrega(estoque, produtos);
  assert.deepEqual(lista.map(i => i.chave), ['garras:r400', 'cab:cmf500']);
  assert.equal(lista[0].foto, 'https://x/r400.png');
  // título da ficha, no singular e com o modelo
  assert.equal(lista[0].nome, 'Garra Florestal R400');
  assert.equal(lista[1].nome, 'Cabeçote CMF 500');
  assert.equal(itemProntoDe(lista, 'garras', 'r400')?.chave, 'garras:r400');
  assert.equal(itemProntoDe(lista, 'garras', 'r250'), null);
  // só campos do catálogo e do estoque público: nada de preço
  assert.ok(!JSON.stringify(lista).match(/price|preco|valor/i));
});
