import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const c = readFileSync('src/components/layout/EngineerHelper.tsx', 'utf8');

test('a equipe tem botão "Folha em imagem" em cada resposta técnica, ao lado de Copiar resposta', () => {
  assert.ok(c.includes('Folha em imagem'));
  assert.ok(c.indexOf('Folha em imagem') < c.indexOf('Copiar resposta\n'));
  assert.ok(/c\.length < 400/.test(c), 'resposta curta ou pergunta não ganha folha');
});

test('a folha é enviada como IMAGEM: compartilhar no celular, copiar + WhatsApp Web no computador', () => {
  assert.ok(c.includes('handleEnviarImagemWhatsapp'));
  assert.ok(c.includes("navigator.share({ files: [arquivo]"));
  assert.ok(c.includes("new ClipboardItem({ 'image/png': blob })"));
  assert.ok(c.includes('https://web.whatsapp.com/'));
});

test('texto longo encolhe para caber em uma folha (piso 0,72) em vez de virar duas', () => {
  assert.ok(c.includes('data-folha-miolo'));
  assert.ok(c.includes('z > 0.72') && c.includes('> 1123'));
});

test('as fotos entram na imagem: viram dados da imagem antes de fotografar a folha (PNG, PDF e WhatsApp)', () => {
  assert.ok(c.includes('embutirImagensDaFolha'));
  assert.equal((c.match(/await embutirImagensDaFolha\(element\)/g) || []).length, 3);
});
