import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { textoPercentualContrato, taxaDoContrato, percentualPorExtenso, ajusteDeTaxaDoParceiro, EMAIL_PARCEIRO_CORRIGIDO } from '../src/lib/percentualContrato.ts';

const fonte = (c: string) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8');

test('CONTRATO: o percentual e o por extenso saem do perfil do parceiro', () => {
  assert.equal(textoPercentualContrato(2), '2% (dois por cento)');
  assert.equal(textoPercentualContrato(1), '1% (um por cento)');
  assert.equal(textoPercentualContrato(3), '3% (três por cento)');
  assert.equal(textoPercentualContrato(5), '5% (cinco por cento)');
  assert.equal(textoPercentualContrato(12), '12% (doze por cento)');
  assert.equal(textoPercentualContrato(2.5), '2,5% (dois vírgula cinco por cento)');
  assert.equal(percentualPorExtenso(21), 'vinte e um');
});

test('CONTRATO: sem taxa válida no perfil o contrato mostra 2%, nunca "undefined" nem 0', () => {
  for (const v of [undefined, null, '', 'abc', 0, -1, 101, NaN]) assert.equal(taxaDoContrato(v), 2);
  assert.equal(taxaDoContrato('3'), 3);
});

test('CONTRATO: a tela usa o texto do perfil, sem número por extenso fixo', () => {
  // o texto agora nasce em montarContrato (lib), que a tela e o PDF compartilham
  const c = fonte('src/pages/Contract.tsx') + fonte('src/lib/contratoParceria.ts');
  assert.match(c, /textoPercentualContrato\(/);
  assert.match(fonte('src/pages/Contract.tsx'), /taxa: isPreview \? previewRate : viewProfile\?\.commission_rate/);
  assert.doesNotMatch(c, /commissionRate === 1/);
});

test('MIGRAÇÃO RAFAEL: só o parceiro-alvo com 1% muda, e só o campo commission_rate', () => {
  assert.deepEqual(ajusteDeTaxaDoParceiro({ email: EMAIL_PARCEIRO_CORRIGIDO, commission_rate: 1 }), { commission_rate: 2 });
  assert.deepEqual(ajusteDeTaxaDoParceiro({ email: ' RafaelCRafael413@Yahoo.com ', commission_rate: '1' }), { commission_rate: 2 });
  assert.equal(ajusteDeTaxaDoParceiro({ email: EMAIL_PARCEIRO_CORRIGIDO, commission_rate: 2 }), null);
  assert.equal(ajusteDeTaxaDoParceiro({ email: EMAIL_PARCEIRO_CORRIGIDO, commission_rate: 3 }), null);
  assert.equal(ajusteDeTaxaDoParceiro({ email: 'outro@x.com', commission_rate: 1 }), null);
  assert.equal(ajusteDeTaxaDoParceiro(null), null);
});

test('MIGRAÇÃO RAFAEL: o aceite do contrato é preservado e nada de comissão já fechada é regravado', () => {
  const perfil = { email: EMAIL_PARCEIRO_CORRIGIDO, commission_rate: 1, contract_accepted: true, contract_accepted_at: '2026-09-15T15:00:00.000Z' };
  const ajuste = ajusteDeTaxaDoParceiro(perfil)!;
  assert.deepEqual(Object.keys(ajuste), ['commission_rate']);
  const depois = { ...perfil, ...ajuste };
  assert.equal(depois.contract_accepted, true);
  assert.equal(depois.contract_accepted_at, perfil.contract_accepted_at);
  const m = fonte('src/lib/migracaoContratoRafael.ts');
  assert.match(m, /tx\.update\(ref, ajuste\)/);
  assert.match(m, /migracao_contrato_rafael_2pct/);
  // só mexe em users e na marca: nunca em indications nem commissions (valores congelados no faturamento)
  assert.doesNotMatch(m, /'indications'|'commissions'/);
});

test('IMPRESSÃO DO CONTRATO: o contrato volta a aparecer, sem rolagem interna e com assinatura sem quebra', () => {
  const css = fonte('src/index.css');
  assert.match(css, /body:has\(\.contrato-impressao\) > #root/);
  assert.match(css, /\.contrato-assinatura \{\s*break-inside: avoid/);
  const c = fonte('src/pages/Contract.tsx');
  assert.match(c, /className="contrato-impressao /);
  assert.match(c, /className="contrato-assinatura /);
});
