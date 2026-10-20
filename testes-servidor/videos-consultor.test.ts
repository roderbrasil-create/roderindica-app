// Biblioteca de vídeos do consultor. Rodar: node --import tsx --test testes-servidor/videos-consultor.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { criarBibliotecaVideos, instrucaoVideos, sanitizarPainel } from '../server/videosConsultor.ts';
import {
  montarListaVideos, videosDoCatalogo, lerIdsVideos, idDoCatalogo, filtrarVideos, formatarDuracao, videosParaPrompt, capaDoVideo,
} from '../src/lib/videosConsultor.ts';
import { separarPainel } from '../src/lib/painelConsultor.ts';

const ST = 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0708423613.firebasestorage.app/o/consultor_videos%2Fa.mp4?alt=media';
const produtos = [
  { id: 'p1', name: 'Garras Traçadoras', models: [{ id: 'm1', name: 'GT 600X', video_url: 'https://www.youtube.com/watch?v=AAAAAAAAAAA' }, { id: 'm2', name: 'GT 800X' }] },
  { id: 'p2', name: 'Cabeçotes Multifuncionais', video_url: 'https://www.youtube.com/watch?v=BBBBBBBBBBB', models: [{ id: 'm5', name: 'CMF 600' }] },
  { id: 'p9', name: 'Bloqueado', is_blocked: true, video_url: 'https://www.youtube.com/watch?v=CCCCCCCCCCC' },
];
const docs = [
  { id: 'v1', data: { produto_id: 'p1', modelo_id: 'm1', equipamento_nome: 'Garras Traçadoras', modelo_nome: 'GT 600X', tipo: 'campo', titulo: 'Traçando eucalipto', contexto: 'GT 600X em PC200', video_url: ST, duracao_s: 22, no_carrossel: true, ordem: 2, ativo: true, criado_por: 'uid-secreto', criado_em: 'x' } },
  { id: 'v2', data: { produto_id: 'p2', equipamento_nome: 'Cabeçotes', tipo: 'marketing', titulo: 'Desligado', video_url: ST + '2', ativo: false } },
  { id: 'v3', data: { produto_id: 'p1', modelo_id: 'm1', equipamento_nome: 'Garras Traçadoras', modelo_nome: 'GT 600X', tipo: 'instalacao', titulo: 'Instalando', contexto: '', video_url: 'https://www.youtube.com/watch?v=AAAAAAAAAAA', ordem: 1, ativo: true } },
  { id: 'v4', data: { produto_id: 'p9', tipo: 'campo', titulo: 'Equipamento bloqueado', video_url: ST + '4', ativo: true } },
  { id: 'v5', data: { produto_id: 'p1', tipo: 'campo', titulo: 'Sem vídeo', video_url: '', ativo: true } },
];

test('LISTA: biblioteca ativa pela ordem, depois o catálogo, sem repetir o vídeo e sem campo interno', () => {
  const l = montarListaVideos(docs, produtos);
  assert.deepEqual(l.filter(v => v.tipo !== 'catalogo').map(v => v.id), ['v3', 'v1']);
  // o vídeo do GT 600X já está na biblioteca (v3): não entra de novo como catálogo
  const cat = l.filter(v => v.tipo === 'catalogo');
  assert.deepEqual(cat.map(v => v.id), [idDoCatalogo('p2'), idDoCatalogo('p2', 'm5')].slice(0, cat.length));
  assert.ok(!cat.some(v => v.video_url.includes('AAAAAAAAAAA')));
  assert.ok(!cat.some(v => v.produto_id === 'p9'), 'equipamento bloqueado fica fora');
  // nada de quem cadastrou nem datas: a lista é pública
  for (const v of l) { assert.ok(!('criado_por' in v)); assert.ok(!('criado_em' in v)); assert.ok(!('ativo' in v)); }
  assert.equal(l.find(v => v.id === 'v1')!.no_carrossel, true);
});

test('CATÁLOGO: um vídeo repetido no mesmo equipamento vira uma entrada só, com id estável', () => {
  const garras = [{ id: 'g', name: 'Garras Florestais', models: [{ id: 'a', name: 'R250' }, { id: 'b', name: 'R400' }, { id: 'c', name: 'R600' }] }];
  const l = videosDoCatalogo(garras);
  assert.equal(l.length, 1, 'R250 a R600 usam o mesmo vídeo do mapa fixo');
  assert.equal(l[0].id, 'cat_g_a');
  assert.equal(videosDoCatalogo(garras)[0].id, l[0].id);
});

test('PAINEL: "videos" do modelo só passa com ids conhecidos, sem repetir, no máximo 3', () => {
  const ids = new Set(['v1', 'v3', 'cat_p2_p', 'x4']);
  const limpo = JSON.parse(sanitizarPainel('{"produto":"GT 600X","videos":["v1","inventado","v1","v3","cat_p2_p","x4"]}', ids));
  assert.deepEqual(limpo.videos, ['v1', 'v3', 'cat_p2_p']);
  assert.equal(limpo.produto, 'GT 600X');
  // nenhum id válido: o campo sai, o resto fica
  assert.deepEqual(JSON.parse(sanitizarPainel('{"produto":"R400","videos":["nada"]}', ids)), { produto: 'R400' });
  assert.equal(sanitizarPainel('{"videos":["nada"]}', ids), '');
  assert.equal(sanitizarPainel('{"videos":"v1"}', ids), '');
  assert.equal(sanitizarPainel('não é json', ids), '');
  assert.equal(sanitizarPainel('[1,2]', ids), '');
  // sem lista de vídeos (app antigo): nenhum id passa
  assert.equal(sanitizarPainel('{"videos":["v1"]}', null), '');
});

test('PAINEL NO APP: separarPainel lê "videos" e tira o bloco do texto', () => {
  const { texto, painel } = separarPainel('Tenho vídeo disso.\n\n<painel>{"produto":"GT 600X","videos":["v1","../x","v3"]}</painel>');
  assert.equal(texto, 'Tenho vídeo disso.');
  assert.deepEqual(painel?.videos, ['v1', 'v3']);
  assert.equal(separarPainel('Oi <painel>{"videos":[1,2]}</painel>').painel, null);
  assert.equal(lerIdsVideos(['a', 'b', 'c', 'd']).length, 3);
});

test('PROMPT: lista compacta com id, equipamento, título e contexto, e a regra do campo "videos"', () => {
  const l = montarListaVideos(docs, produtos);
  const p = videosParaPrompt(l);
  assert.match(p, /- v1 \| Garra Traçadora GT 600X \| Traçando eucalipto \| GT 600X em PC200/);
  assert.equal(videosParaPrompt(Array(100).fill(l[0]), 80).split('\n').length, 80);
  const inst = instrucaoVideos(l);
  assert.match(inst, /"videos"/);
  assert.match(inst, /Tenho vídeo disso/);
  assert.equal(instrucaoVideos([]), '');
});

test('ROTA: GET /api/consultor/videos guarda a lista 60 s e lê o banco uma vez', async () => {
  let leituras = 0;
  const col = (nome: string) => ({ get: async () => { leituras++; return { docs: (nome === 'consultor_videos' ? docs : produtos.map(p => ({ id: p.id, data: p }))).map((d: any) => ({ id: d.id, data: () => d.data })) }; } });
  let t = 1000;
  const b = criarBibliotecaVideos({ db: { collection: col }, agora: () => t });
  const res = () => { const r: any = { cab: {} }; r.setHeader = (k: string, v: string) => { r.cab[k] = v; }; r.status = (c: number) => { r.code = c; return r; }; r.json = (j: any) => { r.corpo = j; return r; }; return r; };
  const r1 = res();
  await Promise.all([b.rotaListar({ query: {} }, r1), b.rotaListar({ query: {} }, res())]);
  assert.equal(leituras, 2, 'dois pedidos juntos: uma leitura de cada coleção');
  assert.ok(r1.corpo.videos.some((v: any) => v.id === 'v1'));
  assert.match(r1.cab['Cache-Control'], /max-age=60/);
  await b.rotaListar({ query: {} }, res());
  assert.equal(leituras, 2, 'dentro de 60 s não lê de novo');
  t += 61_000;
  await b.rotaListar({ query: {} }, res());
  assert.equal(leituras, 4);
  await b.rotaListar({ query: { fresco: '1' } }, res());
  assert.equal(leituras, 6, 'depois de salvar, a tela pede a lista nova');
});

test('BUSCA E FORMATO: busca sem acento por operação e máquina; duração e capa do YouTube', () => {
  const l = montarListaVideos(docs, produtos);
  assert.deepEqual(filtrarVideos(l, 'tracando pc200').map(v => v.id), ['v1']);
  assert.equal(formatarDuracao(22), '0:22');
  assert.equal(formatarDuracao(3725), '1:02:05');
  assert.equal(formatarDuracao(0), '');
  assert.equal(capaDoVideo({ video_url: 'https://youtu.be/AAAAAAAAAAA' }), 'https://i.ytimg.com/vi/AAAAAAAAAAA/hqdefault.jpg');
  assert.equal(capaDoVideo({ video_url: ST, thumb_url: 'https://x/c.jpg' }), 'https://x/c.jpg');
});
