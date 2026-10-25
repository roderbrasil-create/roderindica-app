import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  VERSAO_REGRAS, SONDA_FIRESTORE, SONDA_STORAGE, interpretarFirestore, interpretarStorage,
  LINK_REGRAS_FIRESTORE, LINK_REGRAS_STORAGE,
} from '../src/lib/sondaRegras';

const ler = (c: string) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8');

test('SONDA: firestore.rules e storage.rules trazem a mesma versão da constante do app', () => {
  assert.match(VERSAO_REGRAS, /^\d{4}_\d{2}_\d{2}$/);
  const fs = ler('firestore.rules');
  const st = ler('storage.rules');
  assert.ok(fs.includes(`match /_sonda_regras/v_${VERSAO_REGRAS} {`), 'firestore.rules sem a versão da constante');
  assert.ok(st.includes(`match /_sonda_regras/v_${VERSAO_REGRAS}.txt {`), 'storage.rules sem a versão da constante');
  // nenhuma outra versão de sonda sobrando nos arquivos
  assert.deepEqual([...new Set(fs.match(/_sonda_regras\/v_\d{4}_\d{2}_\d{2}/g))], [`_sonda_regras/v_${VERSAO_REGRAS}`]);
  assert.deepEqual([...new Set(st.match(/_sonda_regras\/v_\d{4}_\d{2}_\d{2}/g))], [`_sonda_regras/v_${VERSAO_REGRAS}`]);
  assert.deepEqual([...SONDA_FIRESTORE], ['_sonda_regras', `v_${VERSAO_REGRAS}`]);
  assert.equal(SONDA_STORAGE, `_sonda_regras/v_${VERSAO_REGRAS}.txt`);
});

test('SONDA: só leitura de um documento ou objeto, sem escrita nem curinga', () => {
  const bloco = (t: string) => { const i = t.indexOf('match /_sonda_regras/'); return t.slice(i, t.indexOf('}', i) + 1); };
  for (const f of ['firestore.rules', 'storage.rules']) {
    const b = bloco(ler(f));
    assert.match(b, /allow get: if request\.auth != null;/);
    assert.ok(!/write|create|update|delete|list|\{[a-zA-Z]+=?\*?\*?\}/.test(b.replace(/match \/_sonda_regras\/v_[0-9_]+(\.txt)? \{/, '')), `${f}: a sonda abriu mais que a leitura`);
  }
});

test('SONDA: interpretação dos códigos do Firestore e do Storage', () => {
  assert.equal(interpretarFirestore(null), 'publicada');
  assert.equal(interpretarFirestore('not-found'), 'publicada');
  assert.equal(interpretarFirestore('permission-denied'), 'falta');
  assert.equal(interpretarFirestore('unavailable'), 'incerto');
  assert.equal(interpretarStorage(null), 'publicada');
  assert.equal(interpretarStorage('storage/object-not-found'), 'publicada');
  assert.equal(interpretarStorage('storage/unauthorized'), 'falta');
  assert.equal(interpretarStorage('storage/retry-limit-exceeded'), 'incerto');
});

test('SONDA: links do console e cartão único na aba Monitoramento (a aba é só do admin; publicar também)', () => {
  assert.equal(LINK_REGRAS_FIRESTORE, 'https://console.firebase.google.com/project/gen-lang-client-0708423613/firestore/databases/ai-studio-e7c58188-6deb-4a73-b6a5-1858f8dce981/rules');
  assert.equal(LINK_REGRAS_STORAGE, 'https://console.firebase.google.com/project/gen-lang-client-0708423613/storage/gen-lang-client-0708423613.firebasestorage.app/rules');
  const admin = ler('src/pages/Admin.tsx');
  assert.match(admin, /<RegrasFirebase podePublicar=\{isAdmin\} \/>/);
  const cartao = ler('src/components/admin/RegrasFirebase.tsx');
  assert.match(cartao, /Conferir de novo/);
  assert.match(cartao, /Falta publicar/);
  assert.match(cartao, /publicadas, versão \$\{VERSAO_REGRAS_TEXTO\}/);
  assert.match(cartao, /Ver detalhes e publicar/);
  assert.ok(!/[—–]/.test(cartao));
});
