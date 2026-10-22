import test from 'node:test';
import assert from 'node:assert/strict';
import { idsVideosParaMostrar } from '../src/lib/videosConsultor';
import { instrucaoVideos } from '../server/videosConsultor';

const lista = [
  { id: 'v1', produto_id: 'uml', modelo_id: 'uml-s' },
  { id: 'v2', produto_id: 'uml', modelo_id: 'uml-s' },
  { id: 'v3', produto_id: 'ssh', modelo_id: 'ssh-150' },
];
const conversa = [
  { role: 'assistant', content: 'Olá' },
  { role: 'user', content: 'Quero o UML/S' },
  { role: 'assistant', painel: { videos: ['v1'] } },
  { role: 'user', content: 'Ver ficha' },
  { role: 'assistant', painel: { videos: ['v1'] } },
  { role: 'user', content: 'E o sistema hidráulico?' },
  { role: 'assistant', painel: { videos: ['v2'] } },
  { role: 'user', content: 'Tem vídeo de novo?' },
  { role: 'assistant', painel: { videos: ['v1'] } },
  { role: 'user', content: 'E a SSH?' },
  { role: 'assistant', painel: { videos: ['v3'] } },
];

test('VÍDEO UMA VEZ: a primeira resposta mostra o vídeo do equipamento', () => {
  assert.deepEqual(idsVideosParaMostrar(conversa, 2, lista), ['v1']);
});
test('VÍDEO UMA VEZ: ficha e hidráulico do mesmo equipamento não repetem o cartão, nem com outro vídeo dele', () => {
  assert.deepEqual(idsVideosParaMostrar(conversa, 4, lista), []);
  assert.deepEqual(idsVideosParaMostrar(conversa, 6, lista), []);
});
test('VÍDEO UMA VEZ: se a pessoa pede o vídeo de novo, ele volta', () => {
  assert.deepEqual(idsVideosParaMostrar(conversa, 8, lista), ['v1']);
});
test('VÍDEO UMA VEZ: outro equipamento mostra o seu vídeo normalmente', () => {
  assert.deepEqual(idsVideosParaMostrar(conversa, 10, lista), ['v3']);
});
test('VÍDEO UMA VEZ: conversa nova (limpa) começa do zero', () => {
  assert.deepEqual(idsVideosParaMostrar(conversa.slice(8), 0, lista), ['v1']);
});
test('VÍDEO UMA VEZ: o prompt manda o modelo não repetir', () => {
  const t = instrucaoVideos([{ id: 'v1', produto_id: 'uml', equipamento_nome: 'UML', tipo: 'catalogo', contexto: '', titulo: 'UML', video_url: 'https://x' } as any]);
  assert.match(t, /UMA vez por conversa/);
});
