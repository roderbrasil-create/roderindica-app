import test from 'node:test';
import assert from 'node:assert/strict';
import { nomeClienteIndicacao } from '../src/lib/nomeClienteIndicacao';

test('o nome do cliente sai de qualquer campo do cadastro, e só vira "Cliente" quando não há nenhum', () => {
  assert.equal(nomeClienteIndicacao({ client_name: 'Fazenda Boa Vista' }), 'Fazenda Boa Vista');
  assert.equal(nomeClienteIndicacao({ client_name: '  ', client_company_name: 'Maqloc Ltda' }), 'Maqloc Ltda');
  assert.equal(nomeClienteIndicacao({ client_person_name: 'João' }), 'João');
  assert.equal(nomeClienteIndicacao({}), 'Cliente');
  assert.equal(nomeClienteIndicacao(undefined), 'Cliente');
});
