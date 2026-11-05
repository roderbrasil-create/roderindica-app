import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { urlEncurtavel } from '../server/linkArquivo';

const servidor = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const helper = readFileSync(new URL('../src/components/layout/EngineerHelper.tsx', import.meta.url), 'utf8');

test('LINK CURTO: aceita Storage e YouTube, recusa qualquer outro site (não vira redirecionador aberto)', () => {
  const storage = 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0708423613.firebasestorage.app/o/consultor_videos%2Fx%2FMeu_Filme_95.mp4?alt=media&token=415a7839-db7c-45c5-a489-05e43024194b';
  assert.equal(urlEncurtavel(storage), storage);
  assert.ok(urlEncurtavel('https://youtu.be/abc123'));
  assert.equal(urlEncurtavel('https://site-malicioso.com/golpe'), '');
  assert.equal(urlEncurtavel('http://firebasestorage.googleapis.com/x'), '');
  assert.equal(urlEncurtavel('https://firebasestorage.googleapis.com.golpe.com/x'), '');
  assert.equal(urlEncurtavel('https://user:senha@firebasestorage.googleapis.com/x'), '');
  assert.equal(urlEncurtavel('javascript:alert(1)'), '');
  assert.equal(urlEncurtavel('x'.repeat(2100)), '');
});

test('LINK CURTO: o servidor tem a criação (com login) e o redirecionamento conferindo o destino de novo', () => {
  assert.ok(/app\.post\("\/api\/link-arquivo"/.test(servidor));
  assert.ok(/app\.get\("\/v\/:codigo"/.test(servidor));
  assert.ok(/d\.tipo === 'arquivo' \? urlEncurtavel\(d\.url\)/.test(servidor));
});

test('LINK CURTO: o pedido de confirmação da máquina usa o link curto já pronto antes do clique', () => {
  assert.ok(/linkAmostraCurto \|\| linkPublicoDoVideo\(videoAmostra\)/.test(helper));
  assert.ok(/encurtarLinkArquivo\(longo\)/.test(helper));
});
