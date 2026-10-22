// Stream único do microfone do Consultor. Rodar: node --import tsx --test testes-servidor/microfone.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { criarGerenciadorMicrofone, OCIOSO_MS, OCULTA_MS } from '../src/lib/microfone.ts';

function faltaTrilha() {
  const t: any = { readyState: 'live', stop() { t.readyState = 'ended'; t.paradas++; }, paradas: 0 };
  return t;
}
function faltaStream() {
  const t = faltaTrilha();
  const s: any = { t, getTracks: () => [t], getAudioTracks: () => [t] };
  return s;
}
function montar() {
  const pedidos: any[] = [];
  const timers: { fn: () => void; ms: number; id: number; vivo: boolean }[] = [];
  const g = criarGerenciadorMicrofone({
    pedirStream: async () => { const s = faltaStream(); pedidos.push(s); return s; },
    setTimer: (fn, ms) => { const x = { fn, ms, id: timers.length, vivo: true }; timers.push(x); return x.id; },
    limparTimer: (id) => { timers[id].vivo = false; },
  });
  const disparar = (ms: number) => timers.filter(t => t.vivo && t.ms === ms).forEach(t => { t.vivo = false; t.fn(); });
  return { g, pedidos, disparar };
}

test('a segunda gravação não chama getUserMedia de novo e não para as tracks', async () => {
  const { g, pedidos } = montar();
  const s1 = await g.obterStream();
  g.iniciarUso(); g.terminarUso(); // fim da 1ª gravação
  const s2 = await g.obterStream();
  g.iniciarUso(); g.terminarUso();
  assert.equal(pedidos.length, 1);
  assert.equal(s1, s2);
  assert.equal(pedidos[0].t.paradas, 0);
});

test('ao fechar o painel as tracks são paradas e a próxima gravação pede de novo', async () => {
  const { g, pedidos } = montar();
  await g.obterStream();
  g.liberar();
  assert.equal(pedidos[0].t.paradas, 1);
  assert.equal(g.temStream(), false);
  await g.obterStream();
  assert.equal(pedidos.length, 2);
});

test('track encerrada leva a novo pedido', async () => {
  const { g, pedidos } = montar();
  await g.obterStream();
  pedidos[0].t.readyState = 'ended'; // o iOS derrubou o microfone
  const s = await g.obterStream();
  assert.equal(pedidos.length, 2);
  assert.equal(s, pedidos[1]);
});

test('pedidos simultâneos dividem um único getUserMedia', async () => {
  const { g, pedidos } = montar();
  const [a, b] = await Promise.all([g.obterStream(), g.obterStream()]);
  assert.equal(pedidos.length, 1);
  assert.equal(a, b);
});

test('10 minutos sem uso libera o microfone; gravando não libera', async () => {
  const { g, pedidos, disparar } = montar();
  await g.obterStream();
  g.iniciarUso();
  disparar(OCIOSO_MS);
  assert.equal(pedidos[0].t.paradas, 0);
  g.terminarUso();
  disparar(OCIOSO_MS);
  assert.equal(pedidos[0].t.paradas, 1);
});

test('aba oculta por mais de 2 minutos libera; voltar antes cancela', async () => {
  const { g, pedidos, disparar } = montar();
  await g.obterStream();
  g.aoMudarVisibilidade(true);
  g.aoMudarVisibilidade(false);
  disparar(OCULTA_MS);
  assert.equal(pedidos[0].t.paradas, 0);
  g.aoMudarVisibilidade(true);
  disparar(OCULTA_MS);
  assert.equal(pedidos[0].t.paradas, 1);
});

test('permissão negada propaga o erro e o próximo clique tenta de novo', async () => {
  let n = 0;
  const g = criarGerenciadorMicrofone({
    pedirStream: async () => { n++; if (n === 1) throw new Error('NotAllowedError'); return faltaStream(); },
  });
  await assert.rejects(g.obterStream(), /NotAllowedError/);
  await g.obterStream();
  assert.equal(n, 2);
});
