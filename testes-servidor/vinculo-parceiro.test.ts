import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { somaAReceber, unirPorId, uidDasTelasDoParceiro } from '../src/lib/vinculoParceiro';
import { mesDaComissao } from '../src/lib/calculoComissao';

test('A receber soma tudo que não foi pago, de qualquer mês', () => {
  assert.equal(somaAReceber([
    { value: 3336.18, status: 'waiting_nf' }, { value: 100, status: 'paid' }, { value: '50.5', status: 'waiting_payment' }, {},
  ]), 3386.68);
  assert.equal(somaAReceber([]), 0);
  assert.equal(somaAReceber(null), 0);
});

test('união por id não repete e ignora documento sem id', () => {
  const r = unirPorId([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }], [{}], undefined);
  assert.deepEqual(r.map(x => x.id), ['a', 'b', 'c']);
});

test('as telas do parceiro usam o uid do perfil mostrado', () => {
  assert.equal(uidDasTelasDoParceiro({ uid: 'rafael123' }), 'rafael123');
  assert.equal(uidDasTelasDoParceiro(null), '');
});

test('venda faturada em 06/10/2026 com entrega em dezembro: comissão cai em novembro', () => {
  assert.deepEqual(mesDaComissao('2026-12-07', new Date('2026-10-06T15:00:00Z')), { month: 11, year: 2026 });
});

// Nenhuma busca das telas do parceiro pode usar o uid do administrador logado no "Ver como":
// elas leem sempre `profile` (o perfil mostrado), nunca auth.currentUser nem realProfile.uid.
for (const arq of ['src/components/parceiro/PainelParceiro.tsx', 'src/pages/Commissions.tsx']) {
  test(`${arq}: buscas pelo uid do perfil mostrado`, () => {
    const fonte = readFileSync(arq, 'utf8');
    const buscas = fonte.split('\n').filter(l => /where\(['"](external_seller_uid|seller_uid)['"]/.test(l));
    assert.ok(buscas.length > 0);
    for (const l of buscas) {
      assert.match(l, /profile\??\.uid|'__nenhum__'/, l);
      assert.doesNotMatch(l, /currentUser|realProfile|user\?\.uid/, l);
    }
  });
}

test('filtrosDoParceiro e Indicações não usam auth.currentUser.uid', () => {
  for (const arq of ['src/lib/filtrosParceiro.ts', 'src/pages/Indications.tsx', 'src/pages/Dashboard.tsx']) {
    assert.doesNotMatch(readFileSync(arq, 'utf8'), /currentUser\??\.uid/, arq);
  }
});

test('tela inicial do parceiro usa a mesma busca de Indicações', () => {
  const f = readFileSync('src/components/parceiro/PainelParceiro.tsx', 'utf8');
  assert.match(f, /filtrosDoParceiro\(profile, realProfile\)/);
  assert.match(f, /somaAReceber\(comissoes\)/);
});
