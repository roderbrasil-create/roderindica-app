import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fonte = readFileSync(new URL('../src/components/layout/EngineerHelper.tsx', import.meta.url), 'utf8');

test('BOLINHA: ao minimizar o consultor, ela volta ao canto inferior direito (remonta e zera o arrasto)', () => {
  assert.ok(/key=\{isOpen \? 'consultor-aberto' : 'consultor-minimizado'\}\s*\n\s*drag=\{!isOpen\}/.test(fonte));
  assert.ok(/roder-botao-consultor fixed bottom-6 right-6/.test(fonte));
});
