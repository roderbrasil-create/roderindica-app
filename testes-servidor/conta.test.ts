import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dadosDoPerfil, houveAlteracao, rotuloDoPerfil, formularioAposPerfil } from '../src/lib/conta.ts';

const perfil = { name: 'Rafael', email: 'a@b.com', phone: '35972430000', cpf_cnpj: '68261835000139', company_name: 'MAQLOC', city: 'Lavras', state: 'MG', pix_key: '68261835000139' };

test('SALVAR FIXO: sem mexer em nada não há alteração, então a barra não aparece', () => {
  assert.equal(houveAlteracao(dadosDoPerfil(perfil), dadosDoPerfil(perfil)), false);
  assert.equal(houveAlteracao(dadosDoPerfil({}), dadosDoPerfil({ bank_info: null })), false);
});

test('SALVAR FIXO: mudar um campo, inclusive dado bancário, liga a barra; voltar ao valor desliga', () => {
  const o = dadosDoPerfil(perfil);
  assert.equal(houveAlteracao({ ...o, city: 'Varginha' }, o), true);
  assert.equal(houveAlteracao({ ...o, bank_info: { ...o.bank_info, agency: '1234' } }, o), true);
  assert.equal(houveAlteracao({ ...o, city: 'Lavras ' }, o), false);
});

test('MENU DA CONTA: rótulo do perfil', () => {
  assert.equal(rotuloDoPerfil({ isExternalSeller: true }), 'Parceiro Roder');
  assert.equal(rotuloDoPerfil({ isAdmin: true, isExternalSeller: true }), 'Administrador');
  assert.equal(rotuloDoPerfil({}, 'vendedor_x'), 'vendedor x');
});

test('SAIR DA CONTA: saiu do menu lateral e mora no ícone da conta, com confirmação', () => {
  const sidebar = readFileSync(new URL('../src/components/layout/Sidebar.tsx', import.meta.url), 'utf8');
  const perfilTsx = readFileSync(new URL('../src/pages/Profile.tsx', import.meta.url), 'utf8');
  const menu = readFileSync(new URL('../src/components/layout/ContaMenu.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(sidebar, /Sair da Conta/i);
  assert.doesNotMatch(perfilTsx, /Sair da Conta/i);
  assert.match(menu, /Quer mesmo sair da conta\?/);
  assert.match(menu, /stopImpersonation/);
});

test('PERFIL ATUALIZADO NA EDIÇÃO: não apaga o que a pessoa digitou; sem edição, acompanha o perfil', () => {
  const o1 = dadosDoPerfil(perfil);
  const o2 = dadosDoPerfil({ ...perfil, city: 'Varginha' });
  const digitado = { ...o1, name: 'Novo nome' };
  assert.equal(formularioAposPerfil(digitado, o1, o2), digitado);
  assert.deepEqual(formularioAposPerfil(o1, o1, o2), o2);
});

test('SALVAR FIXO: o botão do consultor sobe acima da barra enquanto ela aparece', () => {
  const f = readFileSync(new URL('../src/pages/Profile.tsx', import.meta.url), 'utf8');
  assert.match(f, /data-barra-salvar/);
  assert.match(f, /removeAttribute\('data-barra-salvar'\)/);
});
