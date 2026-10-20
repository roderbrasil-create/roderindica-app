// Envio e remoção dos arquivos da biblioteca de vídeos pelo servidor.
// Rodar: node --import tsx --test testes-servidor/arquivos-videos-consultor.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  criarRotasArquivosVideos, caminhoDaBiblioteca, caminhoDoLink, nomeSeguro, urlDeDownload, MAX_VIDEO_MB, MAX_CAPA_MB,
} from '../server/arquivosVideosConsultor.ts';

const B = 'gen-lang-client-0708423613.firebasestorage.app';
const MB = 1024 * 1024;

function montar(quem: any, docs: Record<string, any> = {}) {
  const arquivos: Record<string, { contentType: string; size: number; metadata?: any; apagado?: boolean }> = {};
  const assinados: any[] = [];
  const cors: string[] = [];
  const atual = { v: quem };
  const r = criarRotasArquivosVideos({
    db: { collection: () => ({ get: async () => ({ docs: Object.entries(docs).map(([id, d]) => ({ id, data: () => d })) }) }) },
    quemChama: async () => atual.v,
    passouLimite: () => false,
    nomeBucket: B,
    novoId: () => 'abc123',
    novoToken: () => 'tok-1',
    agora: () => 1_000_000,
    garantirCors: async (o) => { cors.push(o); },
    arquivo: (caminho) => ({
      getSignedUrl: async (o: any) => { assinados.push({ caminho, ...o }); return [`https://storage.googleapis.com/${B}/${caminho}?X-Goog-Signature=x`]; },
      getMetadata: async () => { const a = arquivos[caminho]; if (!a || a.apagado) throw new Error('404'); return [{ contentType: a.contentType, size: String(a.size), metadata: a.metadata }]; },
      setMetadata: async (m: any) => { arquivos[caminho].metadata = { ...(arquivos[caminho].metadata || {}), ...(m.metadata || {}) }; },
      delete: async () => { if (arquivos[caminho]) arquivos[caminho].apagado = true; },
    }),
  });
  return { r, arquivos, assinados, cors, atual };
}

async function chamar(rota: any, body: any, headers: any = {}) {
  const res: any = { cab: {}, statusCode: 200 };
  res.setHeader = (k: string, v: string) => { res.cab[k] = v; };
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (j: any) => { res.corpo = j; return res; };
  await rota({ body, headers }, res);
  return res;
}

const ADMIN = { uid: 'jef', email: 'jeferson@roderbrasil.com.br', role: 'admin' };

test('UPLOAD-URL: só admin, gerência e marketing; vendedora, triagem e parceiro não', async () => {
  const { r, atual } = montar(null);
  const corpo = { contentType: 'video/mp4', nome: 'campo.mp4', tamanho: 5 * MB };
  assert.equal((await chamar(r.rotaUploadUrl, corpo)).statusCode, 401);
  for (const role of ['internal_seller', 'triagem', 'financial', 'partner', '']) {
    atual.v = { uid: 'x', email: 'x@roderbrasil.com.br', role };
    assert.equal((await chamar(r.rotaUploadUrl, corpo)).statusCode, 403, role);
  }
  for (const role of ['admin', 'manager', 'marketing']) {
    atual.v = { uid: 'x', email: 'x@gmail.com', role };
    assert.equal((await chamar(r.rotaUploadUrl, corpo)).statusCode, 200, role);
  }
});

test('UPLOAD-URL: endereço v4 de escrita, 15 min, tipo e teto de tamanho assinados, caminho na pasta', async () => {
  const { r, assinados, cors } = montar(ADMIN);
  const res = await chamar(r.rotaUploadUrl, { contentType: 'video/quicktime', nome: '../Vídeo do Rogério (1).MOV', tamanho: 10 * MB }, { origin: 'https://roderindica.com' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.corpo.caminho, 'consultor_videos/abc123/Video_do_Rogerio_1_.mov');
  const a = assinados[0];
  assert.equal(a.version, 'v4');
  assert.equal(a.action, 'write');
  assert.equal(a.expires, 1_000_000 + 15 * 60 * 1000);
  assert.equal(a.contentType, 'video/quicktime');
  assert.equal(a.extensionHeaders['x-goog-content-length-range'], `0,${MAX_VIDEO_MB * MB}`);
  assert.deepEqual(res.corpo.cabecalhos, { 'Content-Type': 'video/quicktime', 'x-goog-content-length-range': `0,${MAX_VIDEO_MB * MB}` });
  assert.deepEqual(cors, ['https://roderindica.com']);
  // a capa tem teto próprio
  await chamar(r.rotaUploadUrl, { contentType: 'image/jpeg', nome: 'capa.jpg', tamanho: 100 });
  assert.equal(assinados[1].extensionHeaders['x-goog-content-length-range'], `0,${MAX_CAPA_MB * MB}`);
  assert.match(assinados[1].caminho, /^consultor_videos\/abc123\/capa\.jpg$/);
});

test('UPLOAD-URL: tipo fora da lista e arquivo grande demais são recusados antes de assinar', async () => {
  const { r, assinados } = montar(ADMIN);
  assert.equal((await chamar(r.rotaUploadUrl, { contentType: 'application/pdf', nome: 'x.pdf', tamanho: 10 })).statusCode, 415);
  assert.equal((await chamar(r.rotaUploadUrl, { contentType: 'image/svg+xml', nome: 'x.svg', tamanho: 10 })).statusCode, 415);
  assert.equal((await chamar(r.rotaUploadUrl, { contentType: 'video/mp4', nome: 'g.mp4', tamanho: MAX_VIDEO_MB * MB + 1 })).statusCode, 413);
  assert.equal((await chamar(r.rotaUploadUrl, { contentType: 'image/png', nome: 'g.png', tamanho: MAX_CAPA_MB * MB + 1 })).statusCode, 413);
  assert.equal((await chamar(r.rotaUploadUrl, { contentType: 'video/mp4', nome: 'v.mp4', tamanho: 0 })).statusCode, 400);
  assert.equal(assinados.length, 0);
});

test('CONFIRMAR: grava o token e devolve o link do Firebase; tamanho ou tipo errado apaga o arquivo', async () => {
  const { r, arquivos } = montar(ADMIN);
  arquivos['consultor_videos/abc123/a.mp4'] = { contentType: 'video/mp4', size: 3 * MB };
  const ok = await chamar(r.rotaConfirmar, { caminho: 'consultor_videos/abc123/a.mp4' });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.corpo.url, urlDeDownload(B, 'consultor_videos/abc123/a.mp4', 'tok-1'));
  assert.equal(ok.corpo.url, `https://firebasestorage.googleapis.com/v0/b/${B}/o/consultor_videos%2Fabc123%2Fa.mp4?alt=media&token=tok-1`);
  assert.equal(arquivos['consultor_videos/abc123/a.mp4'].metadata.firebaseStorageDownloadTokens, 'tok-1');
  // o link volta para o mesmo caminho (é o que o proxy de "Enviar o vídeo" e a remoção leem)
  assert.equal(caminhoDoLink(ok.corpo.url), 'consultor_videos/abc123/a.mp4');

  arquivos['consultor_videos/abc123/g.mp4'] = { contentType: 'video/mp4', size: MAX_VIDEO_MB * MB + 1 };
  assert.equal((await chamar(r.rotaConfirmar, { caminho: 'consultor_videos/abc123/g.mp4' })).statusCode, 413);
  assert.equal(arquivos['consultor_videos/abc123/g.mp4'].apagado, true);
  arquivos['consultor_videos/abc123/x.mp4'] = { contentType: 'text/html', size: 10 };
  assert.equal((await chamar(r.rotaConfirmar, { caminho: 'consultor_videos/abc123/x.mp4' })).statusCode, 415);
  assert.equal(arquivos['consultor_videos/abc123/x.mp4'].apagado, true);
  assert.equal((await chamar(r.rotaConfirmar, { caminho: 'consultor_videos/abc123/nao.mp4' })).statusCode, 404);
  assert.equal((await chamar(r.rotaConfirmar, { caminho: 'product_videos/a.mp4' })).statusCode, 400);
});

test('APAGAR: só dentro de consultor_videos/, só quem cadastra, e nunca arquivo ainda em uso', async () => {
  const emUso = urlDeDownload(B, 'consultor_videos/abc123/usado.mp4', 't');
  const { r, arquivos, atual } = montar(ADMIN, { v1: { video_url: emUso, thumb_url: '' } });
  arquivos['consultor_videos/abc123/velho.mp4'] = { contentType: 'video/mp4', size: 5 };
  arquivos['consultor_videos/abc123/usado.mp4'] = { contentType: 'video/mp4', size: 5 };
  const velho = urlDeDownload(B, 'consultor_videos/abc123/velho.mp4', 't');
  atual.v = { uid: 'h', email: 'h@roderbrasil.com.br', role: 'internal_seller' };
  assert.equal((await chamar(r.rotaApagar, { url: velho })).statusCode, 403);
  atual.v = ADMIN;
  assert.equal((await chamar(r.rotaApagar, { url: velho })).statusCode, 200);
  assert.equal(arquivos['consultor_videos/abc123/velho.mp4'].apagado, true);
  assert.equal((await chamar(r.rotaApagar, { url: emUso })).statusCode, 409);
  assert.notEqual(arquivos['consultor_videos/abc123/usado.mp4'].apagado, true);
  for (const fora of [
    urlDeDownload(B, 'product_videos/cmf.mp4', 't'),
    urlDeDownload(B, 'consultor_videos/../indications/x.pdf', 't'),
    urlDeDownload('outro-bucket.appspot.com', 'consultor_videos/a.mp4', 't'),
    'https://evil.com/consultor_videos/a.mp4',
  ]) assert.equal((await chamar(r.rotaApagar, { url: fora })).statusCode, 400, fora);
  assert.equal((await chamar(r.rotaApagar, { caminho: 'consultor_videos/capas/antiga.jpg' })).statusCode, 200);
});

test('NOMES E CAMINHOS: extensão sai do tipo, nunca do nome; caminho sem "..", "//" nem pasta de fora', () => {
  assert.equal(nomeSeguro('video.exe', 'video/mp4'), 'video.mp4');
  assert.equal(nomeSeguro('', 'image/webp'), 'arquivo.webp');
  assert.equal(caminhoDaBiblioteca('consultor_videos/a/b.mp4'), 'consultor_videos/a/b.mp4');
  assert.equal(caminhoDaBiblioteca('consultor_videos/b.mp4'), 'consultor_videos/b.mp4');
  for (const ruim of ['consultor_videos//b.mp4', 'consultor_videos/../x', 'consultor_videos/a/b/c/d.mp4', 'consultor_videosx/a.mp4', 'product_videos/a.mp4', 'consultor_videos/a b.mp4', '']) {
    assert.equal(caminhoDaBiblioteca(ruim), '', ruim);
  }
});
