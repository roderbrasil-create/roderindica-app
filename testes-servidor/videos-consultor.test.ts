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
  assert.equal(videosParaPrompt(Array(100).fill(l[0])).split('\n').length, 60, 'no máximo 60 linhas');
  // contexto cortado em 160 caracteres no prompt
  const longo = { ...l[0], contexto: 'x'.repeat(400) };
  assert.ok(videosParaPrompt([longo]).length < 260);
  assert.ok(videosParaPrompt([longo]).includes('x'.repeat(160)));
  assert.ok(!videosParaPrompt([longo]).includes('x'.repeat(161)));
  const inst = instrucaoVideos(l);
  assert.match(inst, /"videos"/);
  // a frase fixa saiu: o modelo repetia "Tenho vídeo disso." em toda resposta
  assert.doesNotMatch(inst, /Tenho vídeo disso/);
  assert.match(inst, /uma vez só/);
  assert.equal(instrucaoVideos([]), '');
});

test('PROMPT: o equipamento da conversa vem primeiro, mesmo depois da linha 60', () => {
  const muitos = Array.from({ length: 70 }, (_, i) => ({ id: `x${i}`, produto_id: 'p1', equipamento_nome: 'Garras Traçadoras', modelo_nome: 'GT 600X', tipo: 'campo' as const, contexto: '', titulo: `t${i}`, video_url: ST }));
  const cmf = { id: 'cmf', produto_id: 'p2', equipamento_nome: 'Cabeçotes Multifuncionais', modelo_nome: 'CMF 600', tipo: 'campo' as const, contexto: 'rebrota', titulo: 'CMF em rebrota', video_url: ST };
  const sem = videosParaPrompt([...muitos, cmf]);
  assert.ok(!sem.includes('- cmf |'), 'sem conversa, a ordem da lista corta o 71º');
  const com = videosParaPrompt([...muitos, cmf], 60, 'o cliente tem uma PC200 e quer o cmf-600 para rebrota');
  assert.ok(com.startsWith('- cmf |'), 'o modelo citado vai para o topo');
  assert.equal(com.split('\n').length, 60);
});

test('CATÁLOGO: modelo com vídeo próprio e mapa fixo dá um vídeo só por modelo, ids nunca repetem', () => {
  const p = [{ id: 'c', name: 'CMF 600', video_url: 'https://www.youtube.com/watch?v=PPPPPPPPPPP', models: [
    { id: 'm', name: 'CMF 600', video_url: 'https://www.youtube.com/watch?v=MMMMMMMMMMM' },
    { id: 'm', name: 'CMF 500', video_url: 'https://www.youtube.com/watch?v=NNNNNNNNNNN' },
  ] }];
  const l = videosDoCatalogo(p);
  const ids = l.map(v => v.id);
  assert.equal(new Set(ids).size, ids.length, 'chaves únicas');
  // produto: o vídeo dele (não o do mapa "CMF 600"); modelo: o vídeo dele (não o do mapa)
  assert.equal(l.find(v => v.id === 'cat_c_p')!.video_url, 'https://www.youtube.com/watch?v=PPPPPPPPPPP');
  assert.equal(l.find(v => v.id === 'cat_c_m')!.video_url, 'https://www.youtube.com/watch?v=MMMMMMMMMMM');
  assert.ok(!l.some(v => v.video_url.includes('0_u6eJ6-YnQ')), 'o mapa fixo só entra quando falta vídeo próprio');
  assert.ok(ids.includes('cat_c_m_2'), 'modelo com id repetido ganha sufixo');
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
  // sem token da equipe, ?fresco=1 é ignorado (senão qualquer um esvaziava o cache a cada pedido)
  await b.rotaListar({ query: { fresco: '1' } }, res());
  assert.equal(leituras, 4, 'rota sem conferência de equipe ignora fresco');
  const rota = b.rotaListarCom({ ehEquipeDoPedido: async (req: any) => req.headers?.authorization === 'Bearer equipe' });
  await rota({ query: { fresco: '1' }, headers: {} }, res());
  assert.equal(leituras, 4, 'visitante não renova');
  const rf = res();
  await rota({ query: { fresco: '1' }, headers: { authorization: 'Bearer equipe' } }, rf);
  assert.equal(leituras, 6, 'depois de salvar, a equipe pede a lista nova');
  assert.match(rf.cab['Cache-Control'], /no-store/);
  // teto por IP
  const lim = new Map<string, number>();
  const rotaIp = b.rotaListarCom({ ipDe: () => '1.2.3.4', passouLimite: (k: string, max: number) => { lim.set(k, (lim.get(k) || 0) + 1); return lim.get(k)! > max; } });
  for (let i = 0; i < 60; i++) { const r = res(); await rotaIp({ query: {} }, r); assert.equal(r.code, undefined); }
  const r429 = res();
  await rotaIp({ query: {} }, r429);
  assert.equal(r429.code, 429);
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

test('FORMULÁRIO: tipo no topo, vídeo modelo sem equipamento, com título obrigatório, máquina opcional e selo de uso', async () => {
  const { readFileSync } = await import('node:fs');
  const t = readFileSync(new URL('../src/pages/VideosConsultor.tsx', import.meta.url), 'utf8');
  const form = t.slice(t.indexOf('role="dialog"'));
  assert.ok(form.indexOf('>Tipo</span>') > 0 && form.indexOf('>Tipo</span>') < form.indexOf('>Equipamento</span>'), 'Tipo vem antes de Equipamento');
  assert.match(form, /Vídeo modelo: mostra como o cliente deve filmar a escavadeira para o técnico avaliar\. Vale para qualquer equipamento\./);
  assert.match(t, /Ex\.: Como filmar a escavadeira \(modelo geral\)/);
  assert.match(t, /Máquina <span[^>]*>\(opcional\)/);
  assert.match(t, /placeholder="Ex\.: CAT 320 nova"/);
  assert.match(t, /modelo_nome: amostra \? form\.maquina/);
  assert.match(t, /produto_id: p && !amostra \? p\.id : PRODUTO_AMOSTRA/);
  assert.match(t, /Escreva o título do vídeo modelo/);
  assert.match(t, /Em uso no texto do WhatsApp/);
  assert.match(t, /videoAmostraDe\(linhas\.filter\(l => l\.ativo\)\)/);
  assert.match(t, /'Vídeo modelo' : nomeDe\(l\)/);
  assert.match(t, /mais o vídeo modelo de filmagem, que vale para qualquer equipamento/);
  assert.ok(!/[—–]/.test(t.slice(t.indexOf('Vídeo modelo:'), t.indexOf('Vídeo modelo:') + 200)));
});
