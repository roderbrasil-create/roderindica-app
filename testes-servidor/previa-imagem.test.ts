// Foto da prévia do link no WhatsApp (/og/...). Rodar: node --import tsx --test testes-servidor/previa-imagem.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import sharp from 'sharp';
import {
  criarImagemPrevia, fonteDaFoto, candidatasDoLink, urlImagemPrevia, versaoDaPrevia, lerNomeArquivo,
  GuardaRecente, OG_LARGURA, OG_ALTURA, OG_MAX_BYTES, CODIGO_PADRAO,
} from '../server/previaImagem.ts';
import { injetarPrevia, previaDoEquipamento, previaPadrao, SITE_PREVIA } from '../server/previaLink.ts';
import { referenciasExternas, trocarEnderecos, fotosExternas } from '../server/fotosExternas.ts';

const SITE = 'https://roderindica.com';
const BUCKETS = ['gen-lang-client-0708423613.firebasestorage.app'];
const LOGO_H = fs.readFileSync(new URL('../public/marca/roder-horizontal.png', import.meta.url));
const LOGO_R = fs.readFileSync(new URL('../public/marca/roder-redondo-512.png', import.meta.url));

// Foto "difícil": 3000x2000 de ruído (não comprime), em WebP como as do site roderbrasil.com.br
const ruido = (l: number, a: number) => sharp(crypto.randomBytes(l * a * 3), { raw: { width: l, height: a, channels: 3 } });
const fotoWebpGrande = await ruido(3000, 2000).webp({ quality: 95 }).toBuffer();
const fotoPngAlta = await ruido(400, 900).png().toBuffer();

function bancoFalso(dados: Record<string, Record<string, any>>) {
  const leituras: string[] = [];
  return {
    leituras,
    collection: (c: string) => ({
      doc: (id: string) => ({
        get: async () => { leituras.push(`${c}/${id}`); return { exists: !!dados[c]?.[id], data: () => dados[c]?.[id] }; },
      }),
    }),
  };
}

function montar(op: { baixar?: any; lerStorage?: any; semSharp?: boolean; cache?: Map<string, Buffer> } = {}) {
  const db = bancoFalso({
    links_curtos: {
      K7P2Q: { uid: 'u1', pid: 'garra', mid: 'r400' },
      BANCO: { uid: 'u1', pid: 'cmf', mid: 'cmf500' },
      MORTA: { uid: 'u1', pid: 'morta', mid: '' },
      SUMIU: { uid: 'u1', pid: 'apagado', mid: '' },
    },
    products: {
      garra: { name: 'Garra Florestal', image_url: 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0708423613.firebasestorage.app/o/products%2Fg.jpg?alt=media&token=x',
        models: [{ id: 'r400', name: 'R400', images: ['https://roderbrasil.com.br/wp-content/webp-express/garra.jpg.webp'] }] },
      cmf: { name: 'Cabeçote', image_url: '', models: [{ id: 'cmf500', name: 'CMF 500', images: ['db-file://abc123'] }] },
      morta: { name: 'Feller', image_url: 'https://roderbrasil.com.br/morta.webp', models: [] },
    },
    app_files: { abc123: { data: `data:image/png;base64,${fotoPngAlta.toString('base64')}` } },
  });
  const chamadas = { baixar: [] as string[], storage: [] as string[], gravou: [] as string[] };
  const cache = op.cache || new Map<string, Buffer>();
  const img = criarImagemPrevia({
    db, site: SITE, buckets: BUCKETS,
    carregarSharp: async () => (op.semSharp ? null : sharp),
    baixar: op.baixar || (async (u: string) => { chamadas.baixar.push(u); return u.includes('morta') ? null : { bytes: fotoWebpGrande, tipo: 'image/webp' }; }),
    lerStorage: op.lerStorage || (async (b: string, c: string) => { chamadas.storage.push(`${b}/${c}`); return fotoPngAlta; }),
    lerCache: async (k) => cache.get(k) || null,
    gravarCache: async (k, j) => { chamadas.gravou.push(k); cache.set(k, j); },
    logoHorizontal: () => LOGO_H,
    logoRedonda: () => LOGO_R,
  });
  return { img, db, chamadas, cache };
}

const resFalso = () => {
  const r: any = { statusCode: 0, cabecalhos: {} as Record<string, string>, corpo: null as Buffer | null };
  r.status = (c: number) => { r.statusCode = c; return r; };
  r.setHeader = (k: string, v: string) => { r.cabecalhos[k.toLowerCase()] = v; };
  r.end = (b?: any) => { r.corpo = b ? Buffer.from(b) : null; return r; };
  return r;
};
const pedir = async (img: any, arquivo: string) => { const res = resFalso(); await img.rota({ params: { arquivo } }, res); return res; };

test('foto WebP grande do site vira JPEG 1200x630 abaixo de 300 KB, com cache público', async () => {
  assert.ok(fotoWebpGrande.length > 3 * 1024 * 1024, 'a foto de teste precisa ser bem maior que o teto');
  const { img, chamadas } = montar();
  const res = await pedir(img, 'K7P2Q-0123456789.jpg');
  assert.equal(res.statusCode, 200);
  assert.equal(res.cabecalhos['content-type'], 'image/jpeg');
  assert.match(res.cabecalhos['cache-control'], /^public, max-age=\d+/);
  assert.equal(Number(res.cabecalhos['content-length']), res.corpo.length);
  assert.ok(res.corpo.length <= OG_MAX_BYTES && res.corpo.length < 300 * 1024, `ficou com ${res.corpo.length} bytes`);
  const meta = await sharp(res.corpo).metadata();
  assert.equal(meta.format, 'jpeg');
  assert.equal(meta.width, OG_LARGURA);
  assert.equal(meta.height, OG_ALTURA);
  // a foto do modelo vem primeiro: o Storage do produto nem foi lido
  assert.deepEqual(chamadas.baixar, ['https://roderbrasil.com.br/wp-content/webp-express/garra.jpg.webp']);
  assert.deepEqual(chamadas.storage, []);
});

test('cache: o segundo pedido sai da memória; outro servidor (memória vazia) sai do Storage sem baixar de novo', async () => {
  const { img, chamadas, cache } = montar();
  await pedir(img, 'K7P2Q-aaaa.jpg');
  await pedir(img, 'K7P2Q-bbbb.jpg');
  assert.equal(chamadas.baixar.length, 1);
  assert.equal(chamadas.gravou.length, 1);
  assert.equal(cache.size, 1);
  const outro = montar({ cache });
  const res = await pedir(outro.img, 'K7P2Q.jpg');
  assert.equal(res.statusCode, 200);
  assert.equal(outro.chamadas.baixar.length, 0);
  assert.equal(outro.chamadas.gravou.length, 0);
});

test('dois pedidos ao mesmo tempo geram a arte uma vez só', async () => {
  const { img, chamadas } = montar();
  await Promise.all([pedir(img, 'K7P2Q.jpg'), pedir(img, 'K7P2Q.jpg'), pedir(img, 'K7P2Q.jpg')]);
  assert.equal(chamadas.baixar.length, 1);
  assert.equal(chamadas.gravou.length, 1);
});

test('foto do banco (db-file, PNG em pé) entra inteira, sem cortar, no 1200x630', async () => {
  const { img } = montar();
  const res = await pedir(img, 'BANCO-1234abcd.jpg');
  const m = await sharp(res.corpo).metadata();
  assert.equal(m.width, 1200); assert.equal(m.height, 630);
  assert.ok(res.corpo.length < 300 * 1024);
});

test('foto que não abre: tenta a próxima; nenhuma abre: arte padrão da Roder (nunca quebra)', async () => {
  const { img, chamadas } = montar();
  const res = await pedir(img, 'MORTA.jpg');
  assert.equal(res.statusCode, 200);
  assert.equal(res.cabecalhos['content-type'], 'image/jpeg');
  assert.deepEqual(chamadas.baixar, ['https://roderbrasil.com.br/morta.webp']);
  // foto do Storage morta no produto da garra: a do modelo continua servindo
  const so = montar({ baixar: async () => ({ bytes: Buffer.from('<html>não é imagem</html>'), tipo: 'image/jpeg' }) });
  const r2 = await pedir(so.img, 'K7P2Q.jpg');
  assert.equal(r2.statusCode, 200);
  assert.equal(so.chamadas.storage.length, 1, 'passou para a foto do produto no Storage');
});

test('código desconhecido, equipamento apagado e PADRAO: a mesma arte padrão, gerada e guardada uma vez', async () => {
  const { img, chamadas } = montar();
  for (const a of ['ZZZZZ.jpg', 'SUMIU.jpg', `${CODIGO_PADRAO}-${versaoDaPrevia([])}.jpg`]) {
    const res = await pedir(img, a);
    assert.equal(res.statusCode, 200);
    const m = await sharp(res.corpo).metadata();
    assert.equal(m.width, 1200); assert.equal(m.height, 630);
  }
  assert.equal(chamadas.gravou.length, 1);
  assert.equal(chamadas.baixar.length, 0);
});

test('sem a biblioteca sharp no servidor: manda a logo PNG em vez de erro', async () => {
  const { img } = montar({ semSharp: true });
  const res = await pedir(img, 'K7P2Q.jpg');
  assert.equal(res.statusCode, 200);
  assert.equal(res.cabecalhos['content-type'], 'image/png');
  assert.equal(res.corpo.length, LOGO_R.length);
});

test('nome de arquivo estranho: 404 sem ler o banco', async () => {
  const { img, db } = montar();
  for (const a of ['../x.jpg', 'K7P2Q.png', 'K7P2Q-XYZ.jpg', '', 'a'.repeat(20) + '.jpg']) {
    const res = await pedir(img, a);
    assert.equal(res.statusCode, 404, a);
  }
  assert.equal(db.leituras.length, 0);
  assert.deepEqual(lerNomeArquivo('k7p2q-0a1b2c3d4e.jpg'), { codigo: 'K7P2Q' });
});

test('de onde vem a foto: banco, Storage do projeto, site de fora, arquivo local; rede interna recusada', () => {
  assert.deepEqual(fonteDaFoto('db-file://abc_1', SITE, BUCKETS), { tipo: 'banco', id: 'abc_1' });
  assert.deepEqual(fonteDaFoto('https://roderindica.com/api/foto/xyz', SITE, BUCKETS), { tipo: 'banco', id: 'xyz' });
  assert.deepEqual(fonteDaFoto('/api/foto/xyz', SITE, BUCKETS), { tipo: 'banco', id: 'xyz' });
  assert.deepEqual(fonteDaFoto('https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0708423613.firebasestorage.app/o/products%2Fa%20b.jpg?alt=media', SITE, BUCKETS),
    { tipo: 'storage', bucket: BUCKETS[0], caminho: 'products/a b.jpg' });
  // Storage de outro projeto é endereço de fora como qualquer outro
  assert.equal(fonteDaFoto('https://firebasestorage.googleapis.com/v0/b/outro/o/a.jpg?alt=media', SITE, BUCKETS)?.tipo, 'externa');
  assert.equal(fonteDaFoto('https://roderbrasil.com.br/x.jpg.webp', SITE, BUCKETS)?.tipo, 'externa');
  assert.deepEqual(fonteDaFoto('/uploads/a.jpg', SITE, BUCKETS), { tipo: 'local', caminho: '/uploads/a.jpg' });
  for (const ruim of ['http://localhost/a.jpg', 'http://127.0.0.1/a.jpg', 'http://169.254.169.254/x', 'http://10.0.0.2/a', 'file:///etc/passwd', '/../etc/passwd', '//x.com/a', 'javascript:1', '']) {
    assert.equal(fonteDaFoto(ruim, SITE, BUCKETS), null, ruim);
  }
});

test('candidatas e endereço: foto do modelo primeiro, sem repetir, sem run.app; versão muda com a foto', () => {
  const p = { image_url: 'https://a/p.jpg', models: [] };
  const m = { images: ['https://x.run.app/v.jpg', 'db-file://m1', 'db-file://m1'], image_url: 'https://a/m.jpg' };
  assert.deepEqual(candidatasDoLink(p, m), ['db-file://m1', 'https://a/m.jpg', 'https://a/p.jpg']);
  const u1 = urlImagemPrevia(SITE, 'K7P2Q', ['db-file://m1']);
  const u2 = urlImagemPrevia(SITE, 'K7P2Q', ['db-file://m2']);
  assert.match(u1, /^https:\/\/roderindica\.com\/og\/K7P2Q-[a-f0-9]{10}\.jpg$/);
  assert.notEqual(u1, u2);
  assert.match(urlImagemPrevia(SITE, 'K7P2Q', []), /\/og\/PADRAO-[a-f0-9]{10}\.jpg$/);
});

test('guarda da memória respeita o limite e mantém as mais recentes', () => {
  const g = new GuardaRecente(2, 1000);
  g.set('a', Buffer.alloc(10)); g.set('b', Buffer.alloc(10)); g.get('a'); g.set('c', Buffer.alloc(10));
  assert.ok(g.get('a') && g.get('c') && !g.get('b'));
  g.set('d', Buffer.alloc(2000));
  assert.equal(g.tamanho, 0);
});

const INDEX = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>RODER Indica V2</title>
    <script>${'var x = 1;'.repeat(3000)}</script>
    <meta property="og:image" content="https://antigo/velha.png" />
  </head>
  <body><div id="root"></div></body>
</html>`;

test('HTML do link: og:image é a arte https do servidor, com secure_url, tipo, largura e altura, logo no começo do <head>', () => {
  const p = { name: 'Garra Florestal', models: [{ id: 'r400', name: 'R400', images: ['db-file://m1'] }] };
  const imagem = urlImagemPrevia(SITE_PREVIA, 'K7P2Q', candidatasDoLink(p, p.models[0]));
  const html = injetarPrevia(INDEX, previaDoEquipamento('K7P2Q', p, p.models[0], imagem));
  const esc = imagem.replace(/[.]/g, '\\.');
  assert.match(html, new RegExp(`<meta property="og:image" content="${esc}" />`));
  assert.match(html, new RegExp(`<meta property="og:image:secure_url" content="${esc}" />`));
  assert.match(html, /<meta property="og:image:type" content="image\/jpeg" \/>/);
  assert.match(html, /<meta property="og:image:width" content="1200" \/>/);
  assert.match(html, /<meta property="og:image:height" content="630" \/>/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/roderindica\.com\/og\//);
  assert.equal((html.match(/og:image"/g) || []).length, 1);
  // as etiquetas vêm antes do script grande: o robô lê só o começo da página
  assert.ok(html.indexOf('og:image') < 1500, `og:image em ${html.indexOf('og:image')}`);
  assert.ok(html.indexOf('og:image') < html.indexOf('<script>'));
});

test('HTML do código desconhecido: arte padrão, também JPEG 1200x630', () => {
  const html = injetarPrevia(INDEX, previaPadrao('ZZ9'));
  assert.match(html, /og:image" content="https:\/\/roderindica\.com\/og\/PADRAO-[a-f0-9]{10}\.jpg"/);
  assert.match(html, /og:image:width" content="1200"/);
});

test('fotos de fora: acha as referências, troca só as copiadas e o teste sem gravar não grava nada', async () => {
  const produtos = [
    { id: 'p1', data: { name: 'Garra', image_url: 'https://roderbrasil.com.br/a.webp', images: ['db-file://x'], models: [{ id: 'm', name: 'R400', images: ['https://roderbrasil.com.br/a.webp', 'https://roderbrasil.com.br/b.jpg'], image_url: '' }] } },
    { id: 'p2', data: { name: 'CMF', image_url: 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0708423613.firebasestorage.app/o/a.jpg', models: [] } },
  ];
  const refs = referenciasExternas(produtos, SITE, BUCKETS);
  assert.deepEqual(refs.map(r => r.campo), ['image_url', 'models[0].images[0]', 'models[0].images[1]']);
  const { novo, trocas } = trocarEnderecos(produtos[0].data, { 'https://roderbrasil.com.br/a.webp': 'https://fs/novo.webp' });
  assert.equal(trocas, 2);
  assert.equal(novo.image_url, 'https://fs/novo.webp');
  assert.deepEqual(novo.models[0].images, ['https://fs/novo.webp', 'https://roderbrasil.com.br/b.jpg']);
  assert.deepEqual(novo.images, ['db-file://x']);
  assert.equal(novo.models[0].name, 'R400');

  const gravados: string[] = []; const escritas: string[] = [];
  const db: any = {
    collection: (c: string) => ({
      get: async () => ({ docs: produtos.map(p => ({ id: p.id, data: () => p.data })) }),
      doc: (id?: string) => ({ id, set: async () => { escritas.push(`${c}/set`); }, get: async () => ({ exists: true, data: () => produtos.find(p => p.id === id)?.data }) }),
    }),
    runTransaction: async (fn: any) => fn({ get: (r: any) => r.get(), update: () => { escritas.push('products/update'); } }),
  };
  const deps = {
    db, site: SITE, buckets: BUCKETS, bucketDestino: BUCKETS[0], carregarSharp: async () => sharp,
    baixar: async (u: string) => (u.endsWith('b.jpg') ? null : { bytes: fotoPngAlta, tipo: 'image/webp' }),
    gravar: async (c: string) => { gravados.push(c); return `https://fs/${c}`; },
  };
  const seco = await fotosExternas(deps, false, 'admin');
  assert.equal(seco.aplicado, false);
  assert.equal(seco.fotos_de_fora, 2);
  assert.equal(seco.copiaveis, 1);
  assert.equal(seco.com_problema, 1);
  assert.deepEqual(gravados, []);
  assert.deepEqual(escritas, []);
  const feito = await fotosExternas(deps, true, 'admin');
  assert.equal(gravados.length, 1);
  assert.match(gravados[0], /^catalogo_site\/[a-f0-9]{20}\.png$/); // formato real do arquivo, não o que o site diz
  assert.equal(feito.produtos_alterados, 1);
  assert.deepEqual(escritas, ['products/update', 'manutencao_fotos_externas/set']);
});
