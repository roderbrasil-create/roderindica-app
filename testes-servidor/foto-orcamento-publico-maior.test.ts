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
