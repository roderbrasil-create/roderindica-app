import test from 'node:test';
import assert from 'node:assert/strict';
import { proximoPassoComissao, periodoEmFoco } from '../src/lib/proximoPassoComissao';

// Competência = mês de pagamento. Aqui: novembro/2026 (vendas de outubro).
const nov = { month: 11, year: 2026, total: 3336.18 };
// 12h UTC é 9h em Brasília
const em = (iso: string) => new Date(iso);

test('antes do dia 1 do mês de competência: aguardar o fechamento, sem botão', () => {
  const r = proximoPassoComissao({ ...nov, hoje: em('2026-10-23T15:00:00Z') });
  assert.equal(r.situacao, 'aguardando_fechamento');
  assert.equal(r.selo, 'Aguardando fechamento');
  assert.equal(r.botaoNota, false);
  assert.match(r.texto, /^Aguarde o fechamento do mês para ter a soma das comissões das suas indicações\. No dia 1 você recebe um e-mail/);
});

test('fuso: 31/10 às 22h em Brasília (01/11 01h UTC) ainda é antes do dia 1; 01/11 03h UTC já é dia 31/10 em Brasília', () => {
  assert.equal(proximoPassoComissao({ ...nov, hoje: em('2026-11-01T01:00:00Z') }).situacao, 'aguardando_fechamento');
  assert.equal(proximoPassoComissao({ ...nov, hoje: em('2026-11-01T03:00:00Z') }).situacao, 'emitir_nota');
});

test('dia 1 a 5 sem nota: pede a nota com valor e prazo, e mostra o botão', () => {
  for (const iso of ['2026-11-01T12:00:00Z', '2026-11-03T12:00:00Z']) {
    const r = proximoPassoComissao({ ...nov, hoje: em(iso) });
    assert.equal(r.situacao, 'emitir_nota');
    assert.equal(r.selo, 'Emita sua nota fiscal');
    assert.equal(r.botaoNota, true);
    assert.equal(r.texto, 'Emita a nota fiscal de serviço no valor de R$ 3.336,18 até o dia 5 de novembro e carregue aqui para o financeiro fazer o seu pagamento.');
  }
});

test('dia 5 ainda vale até o fim do dia em Brasília (06/11 02h UTC é 05/11 23h)', () => {
  assert.equal(proximoPassoComissao({ ...nov, hoje: em('2026-11-06T02:00:00Z') }).situacao, 'emitir_nota');
  assert.equal(proximoPassoComissao({ ...nov, hoje: em('2026-11-06T03:00:00Z') }).situacao, 'nota_atrasada');
});

test('passou do dia 5 sem nota: tom neutro, botão continua', () => {
  const r = proximoPassoComissao({ ...nov, hoje: em('2026-11-10T12:00:00Z') });
  assert.equal(r.situacao, 'nota_atrasada');
  assert.equal(r.botaoNota, true);
  assert.equal(r.texto, 'O prazo da nota era dia 5. Envie a nota assim que puder para o financeiro programar o pagamento.');
  assert.doesNotMatch(r.texto, /multa|atras|perd/i);
});

test('nota enviada: aguarda o pagamento até o dia 7, sem botão, em qualquer data', () => {
  for (const iso of ['2026-11-03T12:00:00Z', '2026-12-20T12:00:00Z']) {
    const r = proximoPassoComissao({ ...nov, status: 'waiting_payment', hoje: em(iso) });
    assert.equal(r.situacao, 'aguardando_pagamento');
    assert.equal(r.selo, 'Aguardando pagamento');
    assert.equal(r.botaoNota, false);
    assert.equal(r.texto, 'Nota recebida. O financeiro paga até o dia 7 de novembro.');
  }
  assert.equal(proximoPassoComissao({ ...nov, temNota: true, hoje: em('2026-11-03T12:00:00Z') }).situacao, 'aguardando_pagamento');
});

test('pago: mostra a data em Brasília quando existe, senão só "Pago"', () => {
  const r = proximoPassoComissao({ ...nov, status: 'paid', paidAt: '2026-11-07T01:30:00Z', hoje: em('2026-11-20T12:00:00Z') });
  assert.equal(r.situacao, 'pago');
  assert.equal(r.selo, 'Pago');
  assert.equal(r.texto, 'Pago em 06/11/2026');
  assert.equal(proximoPassoComissao({ ...nov, status: 'paid', paidAt: 'null' }).texto, 'Pago');
  assert.equal(proximoPassoComissao({ ...nov, status: 'paid' }).texto, 'Pago');
});

test('sem comissão', () => {
  const r = proximoPassoComissao({ month: 11, year: 2026, total: 0, hoje: em('2026-11-03T12:00:00Z') });
  assert.equal(r.situacao, 'sem_comissao');
  assert.equal(r.texto, 'Você ainda não tem comissão. Quando uma venda indicada por você for faturada, ela aparece aqui.');
  assert.equal(r.botaoNota, false);
});

test('virada de ano: competência janeiro/2027 só abre em 01/01/2027', () => {
  const jan = { month: 1, year: 2027, total: 100 };
  assert.equal(proximoPassoComissao({ ...jan, hoje: em('2026-12-31T12:00:00Z') }).situacao, 'aguardando_fechamento');
  assert.equal(proximoPassoComissao({ ...jan, hoje: em('2027-01-02T12:00:00Z') }).texto.includes('até o dia 5 de janeiro'), true);
});

test('nenhum texto menciona percentual de comissão', () => {
  for (const iso of ['2026-10-23T12:00:00Z', '2026-11-03T12:00:00Z', '2026-11-10T12:00:00Z']) {
    assert.doesNotMatch(proximoPassoComissao({ ...nov, hoje: em(iso) }).texto, /%|percentual/i);
  }
});

test('mês em foco: o mais antigo ainda não pago; senão o último pago; senão nada', () => {
  const p = (month: number, status: string, total = 10) => ({ month, year: 2026, total, status });
  assert.equal(periodoEmFoco([p(9, 'paid'), p(10, 'waiting_nf'), p(11, 'waiting_nf')])?.month, 10);
  assert.equal(periodoEmFoco([p(9, 'paid'), p(10, 'paid')])?.month, 10);
  assert.equal(periodoEmFoco([p(11, 'in_progress', 0)]), null);
  assert.equal(periodoEmFoco([]), null);
});
