import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const f = readFileSync(new URL('../src/pages/PublicBudgetRequest.tsx', import.meta.url), 'utf8');

test('FOTO: no link do orçamento o equipamento ocupa mais do quadro (card e capa do vídeo)', () => {
  assert.ok(/w-\[168px\] h-\[168px\][^"]*overflow-hidden/.test(f));
  assert.ok(/max-h-full max-w-full object-contain scale-\[1\.22\]/.test(f));
  assert.ok(/object-contain scale-\[1\.28\]/.test(f));
  assert.ok(!/max-h-\[88%\] max-w-\[88%\]/.test(f));
});

test('BOTÕES: vídeo em vermelho suave e ficha em azul suave no link do cliente', () => {
  assert.ok(/bg-\[#CF5B58\] text-white text-xs font-bold/.test(f));
  assert.ok(/bg-\[#5E86B5\] text-white text-xs font-bold/.test(f));
  assert.ok(!/bg-\[#FF0000\]/.test(f));
});
