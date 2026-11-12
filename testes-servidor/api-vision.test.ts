import test from 'node:test';
import assert from 'node:assert/strict';
import { tratarVision, limparLimiteVision, normVision } from '../server/apiVision';

// Firestore de mentira: igualdade em where, get, set com merge raso, update.
function dbFalso(semente: Record<string, Record<string, any>> = {}) {
  const colecoes: Record<string, Record<string, any>> = JSON.parse(JSON.stringify(semente));
  const col = (nome: string) => {
    colecoes[nome] ??= {};
    const docs = colecoes[nome];
    const dc = (id: string) => ({ id, data: () => docs[id], ref: { update: async (d: any) => { docs[id] = { ...docs[id], ...d }; } } });
    const consulta = (filtros: [string, any][]): any => ({
      where: (c: string, _o: string, v: any) => consulta([...filtros, [c, v]]),
      limit: () => consulta(filtros),
      get: async () => { const ds = Object.keys(docs).filter(id => filtros.every(([c, v]) => docs[id][c] === v)).map(dc); return { empty: ds.length === 0, docs: ds }; },
    });
    return {
      ...consulta([]),
      doc: (id: string) => ({
        get: async () => ({ exists: id in docs, data: () => docs[id] }),
        set: async (d: any, o?: any) => { docs[id] = o?.merge ? { ...(docs[id] || {}), ...d } : d; },
      }),
    };
  };
  return { colecoes, collection: col } as any;
}

const CHAVE_LEITURA = 'rod_live_leitura';
const CHAVE_ESCRITA = 'rod_live_escrita';
const CHAVE_ESTOQUE = 'rod_live_estoque';
const base = () => dbFalso({
  api_keys: {
    k1: { key: CHAVE_LEITURA, active: true, permissions: { stock: false, vision_leitura: true, vision_escrita: false } },
    k2: { key: CHAVE_ESCRITA, active: true, permissions: { stock: false, vision_leitura: false, vision_escrita: true } },
    k3: { key: CHAVE_ESTOQUE, active: true, permissions: { stock: true, catalog: true } },
    k4: { key: 'rod_live_revogada', active: false, permissions: { vision_leitura: true } },
  },
  products: {
    p1: {
      name: 'Cabeçote CMF', category: 'Cabeçotes', description: 'Multifuncional', pdf_url: 'https://x/p.pdf', is_blocked: false, base_price: 999999,
      models: [{ name: 'CMF 600', pdf_url: 'https://x/600.pdf', parts_manual_url: 'https://x/pecas600.pdf', base_value: 123456, technical_specs: { peso: '1.200 kg', vazao: '200 l/min' } }],
    },
    p2: { name: 'Oculto', category: 'X', is_blocked: true, models: [{ name: 'Z' }] },
  },
  installation_kits: { a: { code: '9000.9000.9023', description: 'KIT TESTE', items: [{ code: '3000.5000.0359', quantity: 2, description: 'MANGUEIRA', custo: 77 }], photo_url: 'https://x/k.png', custo: 5 } },
  accessories: { a1: { brand: 'KOMATSU', model: 'PC 200 Ñ', pin: 'PINO Ø80', ponteira_biela_4: '1000.0000.0019', preco: 10 } },
  roder_ai_questions: {
    q1: { question: 'Pressão do CMF', improvedAnswer: 'Trabalha a 280 bar', isImproved: true, timestamp: '2026-11-01T10:00:00.000Z', source: 'Base de Conhecimento Direta', author: 'segredo@roderbrasil.com.br' },
    q2: { question: 'Pergunta sem resposta melhorada', isImproved: false, timestamp: '2026-11-02T10:00:00.000Z' },
    q3: { question: 'Antigo', improvedAnswer: 'texto antigo', isImproved: true, timestamp: '2026-09-01T10:00:00.000Z', source: 'Ensino' },
  },
  roder_comercial_guidelines: { g1: { title: 'Comissão do vendedor é 3%', text: 'segredo comercial' } },
});
const agora = () => new Date('2026-11-11T12:00:00Z');
const get = (db: any, rota: string, chave: string | null, query: any = {}) => tratarVision({ db, agora }, { metodo: 'GET', rota, query, headers: chave ? { 'x-api-key': chave } : {} });

test.beforeEach(() => limparLimiteVision());

test('SEGURANÇA: sem chave 401; revogada ou desconhecida 403; chave do ESTOQUE não abre nada do Vision', async () => {
  const db = base();
  for (const rota of ['/api/v1/fichas', '/api/v1/kits-instalacao', '/api/v1/compatibilidade', '/api/v1/regras-tecnicas', '/api/v1/ensinamentos']) {
    assert.equal((await get(db, rota, null)).status, 401);
    assert.equal((await get(db, rota, 'rod_live_revogada')).status, 403);
    assert.equal((await get(db, rota, 'nao_existe')).status, 403);
    assert.equal((await get(db, rota, CHAVE_ESTOQUE)).status, 403);
    assert.equal((await get(db, rota, CHAVE_ESCRITA)).status, 403); // chave de escrita não lê
    assert.equal((await get(db, rota, CHAVE_LEITURA)).status, 200);
  }
});

test('SEGURANÇA: chave de leitura não escreve; método estranho é recusado', async () => {
  const db = base();
  const r = await tratarVision({ db, agora }, { metodo: 'POST', rota: '/api/v1/ensinamentos', headers: { 'x-api-key': CHAVE_LEITURA }, body: { titulo: 'a', texto: 'b', id_externo: 'x1' } });
  assert.equal(r.status, 403);
  assert.equal(Object.keys(db.colecoes.roder_ai_questions).includes('vision_x1'), false);
  assert.equal((await tratarVision({ db, agora }, { metodo: 'DELETE', rota: '/api/v1/ensinamentos', headers: { 'x-api-key': CHAVE_ESCRITA } })).status, 405);
  assert.equal((await tratarVision({ db, agora }, { metodo: 'POST', rota: '/api/v1/fichas', headers: { 'x-api-key': CHAVE_ESCRITA }, body: {} })).status, 405);
});

test('LIMITE: passou de 120 por minuto devolve 429', async () => {
  const db = base();
  let ultimo = 200;
  for (let i = 0; i < 125; i++) ultimo = (await get(db, '/api/v1/regras-tecnicas', CHAVE_LEITURA)).status;
  assert.equal(ultimo, 429);
});

test('FICHAS: tem total e atualizado_em, esconde produto bloqueado e NENHUM preço sai', async () => {
  const r = await get(base(), '/api/v1/fichas', CHAVE_LEITURA);
  assert.equal(r.body.total, 1);
  assert.equal(r.body.atualizado_em, '2026-11-11T12:00:00.000Z');
  const f = r.body.fichas[0];
  assert.equal(f.modelo, 'CMF 600');
  assert.equal(f.ficha_url, 'https://x/600.pdf');
  assert.equal(f.catalogo_pecas_url, 'https://x/pecas600.pdf');
  assert.equal(f.specs.vazao, '200 l/min');
  assert.doesNotMatch(JSON.stringify(r.body), /999999|123456|base_price|base_value|Oculto/);
});

test('KITS: junta o cadastro com os 58 do ERP, sem campos de custo', async () => {
  const r = await get(base(), '/api/v1/kits-instalacao', CHAVE_LEITURA);
  assert.ok(r.body.total >= 58); // 58 do ERP; o 9023 do cadastro substitui o do ERP
  const k = r.body.kits.find((x: any) => x.codigo === '9000.9000.9023');
  assert.deepEqual(k.itens, [{ codigo: '3000.5000.0359', quantidade: 2, descricao: 'MANGUEIRA' }]);
  assert.ok(r.body.kits.some((x: any) => x.codigo === '9000.9000.9000' && x.fonte === 'erp'));
  assert.doesNotMatch(JSON.stringify(r.body), /"custo"|"preco"/);
  assert.equal(Object.keys(k).includes('custo'), false);
});

test('COMPATIBILIDADE: sem parâmetro devolve tudo; busca ignora maiúscula e acento', async () => {
  const db = base();
  const tudo = await get(db, '/api/v1/compatibilidade', CHAVE_LEITURA);
  assert.ok(tudo.body.total > 5);
  const r = await get(db, '/api/v1/compatibilidade', CHAVE_LEITURA, { marca: 'komatsu', modelo: 'pc 200 n' });
  assert.equal(r.body.total, 1);
  assert.equal(r.body.maquinas[0].pino, 'PINO Ø80');
  assert.doesNotMatch(JSON.stringify(r.body), /preco/);
  const so = await get(db, '/api/v1/compatibilidade', CHAVE_LEITURA, { marca: 'CATERPILLAR' });
  assert.ok(so.body.total >= 3 && so.body.maquinas.every((m: any) => normVision(m.marca).includes('caterpillar')));
  assert.equal((await get(db, '/api/v1/compatibilidade', CHAVE_LEITURA, { marca: 'inexistente' })).body.total, 0);
});

test('REGRAS TÉCNICAS: traz perfis de instalação, regra de kit e as 4 fichas dos trituradores FAE', async () => {
  const r = await get(base(), '/api/v1/regras-tecnicas', CHAVE_LEITURA);
  const ids = r.body.regras.map((x: any) => x.id);
  assert.ok(ids.includes('instalacao:completa') && ids.includes('instalacao:guindaste'));
  assert.ok(ids.includes('kit:confirmacao-da-maquina') && ids.includes('kit:baixa-9003'));
  assert.equal(ids.filter((i: string) => i.startsWith('ficha-fae:')).length, 4);
  assert.equal(r.body.total, ids.length);
  assert.ok(r.body.atualizado_em);
});

test('ENSINAMENTOS: só os técnicos melhorados, sem autor e sem as diretrizes comerciais; filtro desde', async () => {
  const db = base();
  const r = await get(db, '/api/v1/ensinamentos', CHAVE_LEITURA);
  assert.equal(r.body.total, 2);
  assert.deepEqual(r.body.ensinamentos.map((e: any) => e.id), ['q1', 'q3']); // mais novo primeiro
  assert.doesNotMatch(JSON.stringify(r.body), /segredo|Comissão|roderbrasil/);
  const d = await get(db, '/api/v1/ensinamentos', CHAVE_LEITURA, { desde: '2026-10-01' });
  assert.deepEqual(d.body.ensinamentos.map((e: any) => e.id), ['q1']);
  assert.equal((await get(db, '/api/v1/ensinamentos', CHAVE_LEITURA, { desde: 'ontem' })).status, 400);
});

test('POST ENSINAMENTO: grava com source Roder Vision, atualiza pelo id_externo em vez de duplicar', async () => {
  const db = base();
  const envia = (body: any, chave = CHAVE_ESCRITA) => tratarVision({ db, agora }, { metodo: 'POST', rota: '/api/v1/ensinamentos', headers: { 'x-api-key': chave }, body });
  const r1 = await envia({ titulo: 'Calço do CMF', texto: 'Use calço de 5 mm', assunto: 'instalação', equipamento: 'CMF 600', imagens: ['https://x/a.png'], id_externo: 'vis-1' });
  assert.equal(r1.status, 200);
  assert.equal(r1.body.criado, true);
  const doc = db.colecoes.roder_ai_questions['vision_vis-1'];
  assert.equal(doc.isImproved, true);
  assert.equal(doc.source, 'Roder Vision');
  assert.equal(doc.question, 'Calço do CMF');
  assert.equal(doc.improvedAnswer, 'Use calço de 5 mm');
  const r2 = await envia({ titulo: 'Calço do CMF', texto: 'Use calço de 6 mm', id_externo: 'vis-1' });
  assert.equal(r2.body.atualizado, true);
  assert.equal(Object.keys(db.colecoes.roder_ai_questions).filter(k => k.startsWith('vision_')).length, 1);
  assert.equal(db.colecoes.roder_ai_questions['vision_vis-1'].improvedAnswer, 'Use calço de 6 mm');
  assert.equal(db.colecoes.roder_ai_questions['vision_vis-1'].criado_em, '2026-11-11T12:00:00.000Z');
  // aparece na leitura com a origem
  const lido = await get(db, '/api/v1/ensinamentos', CHAVE_LEITURA);
  assert.ok(lido.body.ensinamentos.some((e: any) => e.id === 'vision_vis-1' && e.origem === 'Roder Vision'));
});

test('POST ENSINAMENTO: recusa corpo ruim e NUNCA mexe nos ensinamentos do Indica', async () => {
  const db = base();
  const envia = (body: any) => tratarVision({ db, agora }, { metodo: 'POST', rota: '/api/v1/ensinamentos', headers: { 'x-api-key': CHAVE_ESCRITA }, body });
  assert.equal((await envia({ texto: 'sem título', id_externo: 'a' })).status, 400);
  assert.equal((await envia({ titulo: 't', id_externo: 'a' })).status, 400);
  assert.equal((await envia({ titulo: 't', texto: 'x' })).status, 400);
  assert.equal((await envia({ titulo: 't', texto: 'x', id_externo: '../q1' })).status, 400);
  assert.equal((await envia({ titulo: 't', texto: 'x', id_externo: 'a', imagens: ['javascript:alert(1)'] })).status, 400);
  assert.equal((await envia({ titulo: 't', texto: 'x', id_externo: 'a', imagens: 'https://x' })).status, 400);
  // id_externo "q1" cai em vision_q1, nunca no q1 do Indica
  assert.equal((await envia({ titulo: 'Tentativa', texto: 'trocar', id_externo: 'q1' })).status, 200);
  assert.equal(db.colecoes.roder_ai_questions.q1.improvedAnswer, 'Trabalha a 280 bar');
});
