// Kit depende da configuração da máquina. Rodar: node --import tsx --test testes-servidor/confirmacao-maquina.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  REGRA_KIT_CONFIRMACAO, perguntaDeKit, textoPedirConfirmacaoMaquina, videoAmostraDe, linkPublicoDoVideo,
  precisaConfirmarMaquina, instrucaoAmostra, AVISO_SEM_AMOSTRA,
} from '../src/lib/confirmacaoMaquina.ts';
import { montarListaVideos, videosParaPrompt } from '../src/lib/videosConsultor.ts';
import { instrucaoVideos, sanitizarPainel } from '../server/videosConsultor.ts';
import { separarPainel } from '../src/lib/painelConsultor.ts';

const LINK = 'https://firebasestorage.googleapis.com/v0/b/b/o/consultor_videos%2Fa%2Famostra.mp4?alt=media&token=abc';
const docAmostra = (extra: any = {}) => ({ id: 'am1', data: { produto_id: 'geral', equipamento_nome: 'Todos os equipamentos', tipo: 'amostra', titulo: 'Como filmar a máquina', video_url: LINK, ativo: true, ...extra } });
const docCampo = { id: 'v1', data: { produto_id: 'p1', equipamento_nome: 'Garras', tipo: 'campo', titulo: 'Traçando', video_url: 'https://www.youtube.com/watch?v=AAAAAAAAAAA', ativo: true } };

const semDefeito = (t: string) => {
  assert.ok(!/undefined|null|NaN|\[object/.test(t), t);
  assert.ok(!/[—–]/.test(t), 'sem travessão');
  assert.ok(!/\d\s*%/.test(t), 'sem percentual');
  assert.ok(!/comiss/i.test(t), 'sem comissão');
};

test('mensagem pronta COM vídeo de amostra: leva o link, o vídeo do braço, a cabine e as três fotos', () => {
  const t = textoPedirConfirmacaoMaquina(LINK);
  semDefeito(t);
  assert.ok(t.includes(LINK));
  assert.match(t, /linhas hidráulicas que existem no braço/);
  assert.match(t, /cabine por dentro/);
  assert.match(t, /comando hidráulico \(bloco de válvulas\)/);
  assert.match(t, /bomba hidráulica/);
  assert.match(t, /dois joysticks/);
  assert.ok(t.length < 700, 'texto curto');
});

test('mensagem pronta SEM vídeo de amostra: sai igual, só que sem link e sem "exemplo"', () => {
  for (const vazio of ['', undefined as any, null as any, '  ', 'db-file://x', 'javascript:alert(1)']) {
    const t = textoPedirConfirmacaoMaquina(vazio);
    semDefeito(t);
    assert.ok(!/https?:/.test(t) && !/db-file|javascript/.test(t));
    assert.ok(!/exemplo/.test(t));
    assert.match(t, /linhas hidráulicas que existem no braço/);
    assert.match(t, /dois joysticks/);
  }
});

test('o vídeo de amostra vem da biblioteca: só tipo amostra, ativo e com link https público', () => {
  const lista = montarListaVideos([docCampo, docAmostra()], []);
  assert.equal(videoAmostraDe(lista)?.id, 'am1');
  assert.equal(linkPublicoDoVideo(videoAmostraDe(lista)), LINK);
  assert.equal(videoAmostraDe(montarListaVideos([docCampo], [])), undefined);
  assert.equal(videoAmostraDe(montarListaVideos([docAmostra({ ativo: false })], [])), undefined);
  // db-file:// só abre dentro do app: o cliente não conseguiria ver, então não conta como amostra
  assert.equal(videoAmostraDe(montarListaVideos([docAmostra({ video_url: 'db-file://abc123' })], [])), undefined);
  assert.equal(videoAmostraDe(null), undefined);
});

test('a amostra NÃO entra no prompt de vídeos nem nos ids que o consultor pode citar', () => {
  const lista = montarListaVideos([docCampo, docAmostra()], []);
  assert.ok(!videosParaPrompt(lista).includes('am1'));
  assert.ok(!instrucaoVideos(lista).includes('am1'));
  assert.ok(instrucaoVideos(lista).includes('v1'));
  assert.equal(instrucaoVideos(montarListaVideos([docAmostra()], [])), '');
  assert.equal(sanitizarPainel('{"confirmar_maquina":true}', new Set(['v1'])), '{"confirmar_maquina":true}');
});

test('regra de prompt: não afirma kit por modelo nem serial, pede confirmação e não inventa código', () => {
  const r = REGRA_KIT_CONFIRMACAO;
  assert.match(r, /NUNCA afirme um kit só pelo modelo ou pelo número de série/);
  assert.match(r, /fatia extra/);
  assert.match(r, /FUNÇÃO DUPLA com as duas saídas tampadas/);
  assert.match(r, /linhas hidráulicas já existem no braço/);
  assert.match(r, /NUNCA invente código/);
  assert.match(r, /bloco de válvulas/);
  assert.match(r, /DOIS joysticks/);
  assert.match(r, /confirmar_maquina/);
  assert.ok(!/[—–]/.test(r));
  // e está de fato dentro do prompt do consultor, sem apagar a regra antiga do kit sem fatia extra
  const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.ok(server.includes('${REGRA_KIT_CONFIRMACAO}'));
  assert.ok(server.includes('DIRETRIZ CRÍTICA PARA INSTALAÇÃO DE GARRA EM ESCAVADEIRAS SEM FATIA EXTRA'));
  assert.ok(server.includes('9000.9000.9016'));
});

test('o consultor avisa o vendedor quando não há amostra cadastrada', () => {
  assert.ok(instrucaoAmostra(false).includes(AVISO_SEM_AMOSTRA));
  assert.ok(!instrucaoAmostra(true).includes(AVISO_SEM_AMOSTRA));
  assert.equal(AVISO_SEM_AMOSTRA, 'Ainda não há vídeo de amostra cadastrado.');
});

test('reconhece a pergunta de kit (o caso do Yuri) e não confunde com outras', () => {
  assert.equal(perguntaDeKit('Quais kits hidráulicos enviar com garra traçadora para uma CAT 320?'), true);
  assert.equal(perguntaDeKit('qual kit de instalação uso na PC200?'), true);
  assert.equal(perguntaDeKit('Que mangueiras preciso enviar para instalar o cabeçote?'), true);
  assert.equal(perguntaDeKit('Qual o peso da garra R400?'), false);
  assert.equal(perguntaDeKit(''), false);
  assert.equal(precisaConfirmarMaquina({ confirmar_maquina: true }, ''), true);
  assert.equal(precisaConfirmarMaquina(null, 'qual kit uso na CAT 320 com tracadora'), true);
  assert.equal(precisaConfirmarMaquina({}, 'oi'), false);
});

test('o <painel> com confirmar_maquina chega ao app e some do texto', () => {
  const { texto, painel } = separarPainel('Preciso confirmar.\n\n<painel>{"confirmar_maquina":true,"produto":"GT 600X"}</painel>');
  assert.equal(texto, 'Preciso confirmar.');
  assert.equal(painel?.confirmar_maquina, true);
  assert.equal(separarPainel('<painel>{"confirmar_maquina":"sim"}</painel>').painel, null);
});
