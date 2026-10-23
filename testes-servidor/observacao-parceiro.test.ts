import test from 'node:test';
import assert from 'node:assert/strict';
import {
  entradaObservacaoParceiro, entradaParaGravar, historicoComObservacao, idObservacaoParceiro,
  textoSeguroComQuebras, TIPO_OBSERVACAO_PARCEIRO,
} from '../src/lib/observacaoParceiro';

const base = {
  id: 'ind1', description: 'Cliente quer triturar\neucalipto', created_at: '2026-10-20T14:30:00.000Z',
  created_by_name: 'João Parceiro', external_seller_name: 'João Parceiro',
};

test('monta a entrada com autor, data da indicação e texto', () => {
  const e = entradaObservacaoParceiro(base)!;
  assert.equal(e.type, TIPO_OBSERVACAO_PARCEIRO);
  assert.equal(e.author_name, 'João Parceiro');
  assert.equal(e.created_at, base.created_at);
  assert.equal(e.content, 'Cliente quer triturar\neucalipto');
  assert.equal(e.id, idObservacaoParceiro('ind1'));
});

test('texto vazio ou só espaços não gera entrada', () => {
  assert.equal(entradaObservacaoParceiro({ ...base, description: '' }), null);
  assert.equal(entradaObservacaoParceiro({ ...base, description: '  \n ' }), null);
  assert.equal(entradaObservacaoParceiro({ ...base, description: undefined }), null);
  assert.equal(entradaObservacaoParceiro(null), null);
});

test('autor cai para o indicador e depois para um nome genérico', () => {
  assert.equal(entradaObservacaoParceiro({ ...base, created_by_name: '' })!.author_name, 'João Parceiro');
  assert.equal(entradaObservacaoParceiro({ ...base, created_by_name: '', external_seller_name: '' })!.author_name, 'Parceiro indicador');
});

test('idempotente: não grava de novo se já existe, por id ou por tipo', () => {
  assert.ok(entradaParaGravar(base));
  const gravada = entradaObservacaoParceiro(base)!;
  assert.equal(entradaParaGravar({ ...base, negotiation_history: [gravada] }), null);
  assert.equal(entradaParaGravar({ ...base, negotiation_history: [{ ...gravada, id: 'outro' }] }), null);
});

test('retroativo: indicação antiga sem entrada ganha a observação só na exibição', () => {
  const sistema = { id: 's', type: 'system', content: 'Indicação inicial enviada.', author_name: 'João Parceiro', created_at: '2026-10-20T14:30:05.000Z' };
  const h = historicoComObservacao({ ...base, negotiation_history: [sistema] });
  assert.equal(h.length, 2);
  assert.equal(h[0].type, TIPO_OBSERVACAO_PARCEIRO);
  assert.equal(h[1].id, 's');
});

test('sem duplicar quando a entrada gravada existe', () => {
  const gravada = entradaObservacaoParceiro(base)!;
  const h = historicoComObservacao({ ...base, negotiation_history: [gravada] });
  assert.equal(h.filter(e => e.type === TIPO_OBSERVACAO_PARCEIRO).length, 1);
});

test('ordem cronológica e entradas sem data vão para o começo', () => {
  const h = historicoComObservacao({
    ...base,
    negotiation_history: [
      { id: 'b', type: 'note', content: 'x', author_name: 'H', created_at: '2026-10-22T10:00:00.000Z' },
      { id: 'a', type: 'note', content: 'y', author_name: 'H', created_at: '2026-10-21T10:00:00.000Z' },
    ],
  });
  assert.deepEqual(h.map(e => e.id), [idObservacaoParceiro('ind1'), 'a', 'b']);
  const semData = historicoComObservacao({ ...base, created_at: undefined, negotiation_history: [{ id: 'a', type: 'note', content: 'y', author_name: 'H', created_at: '2026-10-21T10:00:00.000Z' }] });
  assert.equal(semData[0].type, TIPO_OBSERVACAO_PARCEIRO);
});

test('não altera o histórico original (nada é escrito)', () => {
  const hist: any[] = [];
  historicoComObservacao({ ...base, negotiation_history: hist });
  assert.equal(hist.length, 0);
});

test('escape de HTML preservando quebras de linha', () => {
  assert.equal(textoSeguroComQuebras('a<script>"x"</script>\r\nb'), 'a&lt;script&gt;&quot;x&quot;&lt;/script&gt;<br>b');
});
