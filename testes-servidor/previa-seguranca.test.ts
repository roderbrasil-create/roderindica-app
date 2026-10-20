// Prévia do link: foto de fora sem abrir porta para a rede interna, arte sem foto que não fica
// presa no cache, e a manutenção de fotos com trava e limite por rodada.
// Rodar: node --import tsx --test testes-servidor/previa-seguranca.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import sharp from 'sharp';
import {
  baixarExterna, conferirDestino, ipBloqueado, criarImagemPrevia, fonteDaFoto,
  TEMPO_ARTE_PROVISORIA_MS, TEMPO_CANDIDATAS_MS,
} from '../server/previaImagem.ts';
import { fotosExternas, RodadaEmAndamento, MAX_URLS_POR_RODADA, COLECAO_ESTADO, DOC_TRAVA } from '../server/fotosExternas.ts';

const SITE = 'https://roderindica.com';
const BUCKETS = ['gen-lang-client-0708423613.firebasestorage.app'];
const LOGO_H = fs.readFileSync(new URL('../public/marca/roder-horizontal.png', import.meta.url));
const LOGO_R = fs.readFileSync(new URL('../public/marca/roder-redondo-512.png', import.meta.url));
// endereço do Storage do projeto: depois da troca a foto não é mais "de fora"
const NOVO = (c: string) => `https://firebasestorage.googleapis.com/v0/b/${BUCKETS[0]}/o/${encodeURIComponent(c)}?alt=media`;
const FOTO = await sharp(crypto.randomBytes(300 * 200 * 3), { raw: { width: 300, height: 200, channels: 3 } }).jpeg().toBuffer();

// ---------- rede: endereços bloqueados ----------

test('IPs da rede interna, metadados da nuvem, CGNAT, multicast e IPv6 mapeado são bloqueados', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '100.127.255.255',
    '0.0.0.0', '0.1.2.3', '224.0.0.1', '239.255.255.250', '255.255.255.255', '::', '::1', 'fc00::1', 'fd12:3456::1', 'fe80::1',
    'ff02::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1', '::ffff:8.8.8.8', 'não-é-ip']) {
    assert.equal(ipBloqueado(ip), true, ip);
  }
  for (const ip of ['8.8.8.8', '104.21.3.4', '100.128.0.1', '172.32.0.1', '2606:4700::1111']) assert.equal(ipBloqueado(ip), false, ip);
  // IP literal privado já cai na escolha da fonte
  for (const u of ['http://100.64.0.9/a.jpg', 'http://[::ffff:127.0.0.1]/a.jpg', 'http://[fd00::1]/a.jpg', 'http://0.0.0.1/a.jpg']) {
    assert.equal(fonteDaFoto(u, SITE, BUCKETS), null, u);
  }
});

test('destino: só http/https nas portas 80 e 443; DNS que responde um IP interno (mesmo entre públicos) é recusado', async () => {
  const publico = async () => [{ address: '93.184.216.34', family: 4 }];
  assert.equal(await conferirDestino('https://site.com:8443/a.jpg', { resolver: publico }), null);
  assert.equal(await conferirDestino('http://site.com:22/a.jpg', { resolver: publico }), null);
  assert.equal(await conferirDestino('ftp://site.com/a.jpg', { resolver: publico }), null);
  assert.equal(await conferirDestino('https://u:s@site.com/a.jpg', { resolver: publico }), null);
  const ok = await conferirDestino('https://site.com/a.jpg', { resolver: publico });
  assert.equal(ok?.ip, '93.184.216.34');
  assert.ok(await conferirDestino('http://site.com:80/a.jpg', { resolver: publico }));
  const misto = async () => [{ address: '93.184.216.34', family: 4 }, { address: '127.0.0.1', family: 4 }];
  assert.equal(await conferirDestino('https://site.com/a.jpg', { resolver: misto }), null);
  assert.equal(await conferirDestino('https://site.com/a.jpg', { resolver: async () => [{ address: '169.254.169.254', family: 4 }] }), null);
  assert.equal(await conferirDestino('https://site.com/a.jpg', { resolver: async () => [{ address: '::ffff:10.0.0.1', family: 6 }] }), null);
  assert.equal(await conferirDestino('https://site.com/a.jpg', { resolver: async () => { throw new Error('NXDOMAIN'); } }), null);
});

// Servidor local de mentira. O teste libera só 127.0.0.1 e a porta dele; em produção os dois são
// recusados. Os nomes "*.teste" não existem no DNS: se a conexão não fosse para o IP conferido,
// ela nem abriria.
async function servidorDeTeste(rotas: Record<string, (req: http.IncomingMessage, res: http.ServerResponse) => void>) {
  const pedidos: string[] = [];
  const srv = http.createServer((req, res) => {
    pedidos.push(`${req.headers.host}${req.url}`);
    const r = rotas[String(req.url)];
    if (r) r(req, res); else { res.statusCode = 404; res.end(); }
  });
  await new Promise<void>(ok => srv.listen(0, '127.0.0.1', ok));
  const porta = (srv.address() as any).port as number;
  return { porta, pedidos, fechar: () => new Promise<void>(ok => srv.close(() => ok())) };
}

test('download: IP preso ao conferido, redirecionamento conferido salto a salto, no máximo 3', async () => {
  const s = await servidorDeTeste({
    '/foto.jpg': (_q, r) => { r.setHeader('Content-Type', 'image/jpeg'); r.end(FOTO); },
    '/r1': (_q, r) => { r.statusCode = 302; r.setHeader('Location', '/foto.jpg'); r.end(); },
    '/loop': (_q, r) => { r.statusCode = 301; r.setHeader('Location', '/loop'); r.end(); },
    '/para-interno': (_q, r) => { r.statusCode = 302; r.setHeader('Location', `http://interno.teste:${s.porta}/foto.jpg`); r.end(); },
    '/para-porta': (_q, r) => { r.statusCode = 302; r.setHeader('Location', 'http://foto.teste:6379/foto.jpg'); r.end(); },
    '/html': (_q, r) => { r.setHeader('Content-Type', 'text/html'); r.end('<html></html>'); },
  });
  try {
    const resolucoes: string[] = [];
    const op = {
      portas: [80, 443, s.porta],
      // o teste finge que foto.teste é um IP público (127.0.0.1 liberado só aqui) e que
      // interno.teste é a rede interna
      ipPermitido: (ip: string) => ip === '127.0.0.1',
      resolver: async (h: string) => { resolucoes.push(h); return [{ address: h === 'interno.teste' ? '10.0.0.5' : '127.0.0.1', family: 4 }]; },
    };
    const base = `http://foto.teste:${s.porta}`;
    const r = await baixarExterna(`${base}/foto.jpg`, 3000, 1e6, op);
    assert.ok(r && r.bytes.equals(FOTO));
    assert.equal(r.tipo, 'image/jpeg');
    assert.equal(s.pedidos.at(-1), `foto.teste:${s.porta}/foto.jpg`, 'o nome vai no Host; a conexão vai para o IP conferido');

    const r1 = await baixarExterna(`${base}/r1`, 3000, 1e6, op);
    assert.ok(r1 && r1.bytes.equals(FOTO));

    resolucoes.length = 0;
    const antes = s.pedidos.length;
    assert.equal(await baixarExterna(`${base}/loop`, 3000, 1e6, op), null);
    assert.equal(s.pedidos.length - antes, 4, 'o pedido e no máximo 3 redirecionamentos');

    const n = s.pedidos.length;
    assert.equal(await baixarExterna(`${base}/para-interno`, 3000, 1e6, op), null);
    assert.equal(s.pedidos.length - n, 1, 'o salto para a rede interna nem é pedido');
    assert.equal(await baixarExterna(`${base}/para-porta`, 3000, 1e6, op), null);
    assert.equal(await baixarExterna(`${base}/html`, 3000, 1e6, op), null);
    assert.equal(await baixarExterna(`${base}/foto.jpg`, 3000, 100, op), null, 'acima do teto');
    // sem a liberação de teste, 127.0.0.1 e a porta alta são recusados antes de conectar
    const m = s.pedidos.length;
    assert.equal(await baixarExterna(`http://127.0.0.1:${s.porta}/foto.jpg`), null);
    assert.equal(await baixarExterna(`http://localhost:${s.porta}/foto.jpg`, 3000, 1e6, { portas: [s.porta] }), null);
    assert.equal(s.pedidos.length, m);
  } finally { await s.fechar(); }
});

// ---------- arte sem foto não fica presa ----------

function bancoFalso(dados: Record<string, Record<string, any>>) {
  const leituras: string[] = [];
  return {
    leituras,
    collection: (c: string) => ({
      doc: (id: string) => ({ get: async () => { leituras.push(`${c}/${id}`); return { exists: !!dados[c]?.[id], data: () => dados[c]?.[id] }; } }),
    }),
  };
}
const resFalso = () => {
  const r: any = { statusCode: 0, cabecalhos: {} as Record<string, string>, corpo: null as Buffer | null };
  r.status = (c: number) => { r.statusCode = c; return r; };
  r.setHeader = (k: string, v: string) => { r.cabecalhos[k.toLowerCase()] = v; };
  r.end = (b?: any) => { r.corpo = b ? Buffer.from(b) : null; return r; };
  return r;
};

function montarSite(baixar: (u: string) => Promise<any>, extra: any = {}) {
  let relogio = 1_000_000;
  const db = bancoFalso({
    links_curtos: { SITE1: { pid: 'feller', mid: '' } },
    products: { feller: { name: 'Feller', image_url: 'https://roderbrasil.com.br/feller.webp', models: [] } },
  });
  const cache = new Map<string, Buffer>();
  const gravou: string[] = [];
  const img = criarImagemPrevia({
    db, site: SITE, buckets: BUCKETS,
    carregarSharp: async () => sharp,
    lerStorage: async () => null,
    lerCache: async (k) => cache.get(k) || null,
    gravarCache: async (k, j) => { gravou.push(k); cache.set(k, j); },
    baixar,
    logoHorizontal: () => LOGO_H,
    logoRedonda: () => LOGO_R,
    agora: () => relogio,
    ...extra,
  });
  return { img, db, cache, gravou, passar: (ms: number) => { relogio += ms; } };
}
const pedir = async (img: any, arquivo: string, req: any = {}) => { const res = resFalso(); await img.rota({ params: { arquivo }, ...req }, res); return res; };

test('site fora do ar na primeira vez: arte sem foto só na memória, cache curto; depois volta com a foto e aí grava', async () => {
  let tentativas = 0;
  const m = montarSite(async () => (++tentativas === 1 ? null : { bytes: FOTO, tipo: 'image/jpeg' }));
  const r1 = await pedir(m.img, 'SITE1-aaaa.jpg');
  assert.equal(r1.statusCode, 200);
  assert.equal(r1.cabecalhos['cache-control'], 'public, max-age=300');
  assert.deepEqual(m.gravou, [], 'a arte sem foto não vai para o Storage');
  assert.equal(m.cache.size, 0);
  // dentro dos poucos minutos: a mesma arte, sem bater no site de novo
  await pedir(m.img, 'SITE1-aaaa.jpg');
  assert.equal(tentativas, 1);
  // passou o prazo: tenta de novo, agora com a foto, e grava
  m.passar(TEMPO_ARTE_PROVISORIA_MS + 1);
  const r2 = await pedir(m.img, 'SITE1-aaaa.jpg');
  assert.equal(tentativas, 2);
  assert.equal(r2.statusCode, 200);
  assert.match(r2.cabecalhos['cache-control'], /max-age=86400/);
  assert.equal(m.gravou.length, 1);
  assert.notDeepEqual(r2.corpo, r1.corpo, 'a arte nova é a com foto');
  // (x=300 fica fora da logo da arte padrão e dentro da foto)
  const desvio = async (b: Buffer) => (await sharp(await sharp(b).extract({ left: 290, top: 280, width: 20, height: 20 }).png().toBuffer()).stats()).channels[0].stdev;
  assert.ok((await desvio(r1.corpo)) < 3, 'sem foto: fundo liso');
  assert.ok((await desvio(r2.corpo)) > 20, 'com foto: a foto de ruído aparece');
});

test('/og: lista de fotos do código fica 2 min na memória (versão aleatória no nome não lê o banco de novo)', async () => {
  const m = montarSite(async () => ({ bytes: FOTO, tipo: 'image/jpeg' }));
  await pedir(m.img, 'SITE1-1111.jpg');
  const leituras = m.db.leituras.length;
  for (let i = 0; i < 5; i++) await pedir(m.img, `SITE1-${crypto.randomBytes(4).toString('hex')}.jpg`);
  assert.equal(m.db.leituras.length, leituras);
  m.passar(TEMPO_CANDIDATAS_MS + 1);
  await pedir(m.img, 'SITE1-2222.jpg');
  assert.equal(m.db.leituras.length, leituras + 2);
});

test('/og: limite por endereço só para quem obriga a ler o banco', async () => {
  let pedidos = 0;
  const m = montarSite(async () => ({ bytes: FOTO, tipo: 'image/jpeg' }), { limitar: () => ++pedidos > 2 });
  assert.equal((await pedir(m.img, 'SITE1.jpg')).statusCode, 200);
  assert.equal((await pedir(m.img, 'ZZZ1.jpg')).statusCode, 200);
  const barrado = await pedir(m.img, 'ZZZ2.jpg');
  assert.equal(barrado.statusCode, 429);
  // o código que já está na memória continua saindo
  assert.equal((await pedir(m.img, 'SITE1.jpg')).statusCode, 200);
});

test('sem sharp: manda a arte padrão JPEG pronta (public/og-padrao.jpg), nunca PNG com etiqueta de JPEG', async () => {
  const pronta = fs.readFileSync(new URL('../public/og-padrao.jpg', import.meta.url));
  const meta = await sharp(pronta).metadata();
  assert.deepEqual([meta.format, meta.width, meta.height], ['jpeg', 1200, 630]);
  assert.ok(pronta.length < 290 * 1024);
  const m = montarSite(async () => null, { carregarSharp: async () => null, artePadraoPronta: () => pronta });
  const r = await pedir(m.img, 'SITE1.jpg');
  assert.equal(r.statusCode, 200);
  assert.equal(r.cabecalhos['content-type'], 'image/jpeg');
  assert.ok(r.corpo.equals(pronta));
});

// ---------- manutenção de fotos de fora ----------

function bancoManutencao(produtos: { id: string; data: any }[], opc: { falharUpdate?: string } = {}) {
  const docs = new Map<string, any>();
  for (const p of produtos) docs.set(`products/${p.id}`, p.data);
  const registros: any[] = [];
  let auto = 0;
  const ref = (c: string, id: string) => ({
    c, id,
    get: async () => ({ exists: docs.has(`${c}/${id}`), data: () => docs.get(`${c}/${id}`) }),
    set: async (d: any) => { docs.set(`${c}/${id}`, d); if (c === 'manutencao_fotos_externas') registros.push({ id, situacao: d.situacao, mapa: d.mapa, trocados: [...docs.keys()].filter(k => k.startsWith('products/') && JSON.stringify(docs.get(k)).includes('firebasestorage')).length }); },
  });
  const db: any = {
    docs, registros,
    collection: (c: string) => ({
      get: async () => ({ docs: [...docs.entries()].filter(([k]) => k.startsWith(`${c}/`)).map(([k, v]) => ({ id: k.slice(c.length + 1), data: () => v })) }),
      doc: (id?: string) => ref(c, id || `auto${++auto}`),
    }),
    runTransaction: async (fn: any) => fn({
      get: (r: any) => r.get(),
      set: (r: any, d: any) => { docs.set(`${r.c}/${r.id}`, d); },
      update: (r: any, d: any) => {
        if (opc.falharUpdate === r.id) throw new Error('produto travado');
        docs.set(`${r.c}/${r.id}`, { ...docs.get(`${r.c}/${r.id}`), ...d });
      },
    }),
  };
  return db;
}

test('fotos de fora: no máximo 60 por rodada, informa quantas faltam, e a próxima rodada pega as seguintes', async () => {
  const produtos = Array.from({ length: 70 }, (_, i) => ({ id: `p${i}`, data: { name: `P${i}`, image_url: `https://roderbrasil.com.br/f${i}.jpg`, models: [] } }));
  const db = bancoManutencao(produtos);
  const baixados: string[] = [];
  const deps = {
    db, site: SITE, buckets: BUCKETS, bucketDestino: BUCKETS[0], carregarSharp: async () => sharp,
    baixar: async (u: string) => { baixados.push(u); return u.endsWith('f0.jpg') ? null : { bytes: FOTO, tipo: 'image/jpeg' }; },
    gravar: async (c: string) => NOVO(c),
  };
  const r1 = await fotosExternas(deps, true, 'admin');
  assert.equal(MAX_URLS_POR_RODADA, 60);
  assert.equal(r1.nesta_rodada, 60);
  assert.equal(r1.produtos_alterados, 59);
  assert.equal(r1.faltam_para_proxima_rodada, 11);
  // a que falhou (f0) vai para o fim: a segunda rodada pega as 10 novas antes dela
  baixados.length = 0;
  const r2 = await fotosExternas(deps, true, 'admin');
  assert.equal(baixados[0], 'https://roderbrasil.com.br/f60.jpg');
  assert.equal(baixados.at(-1), 'https://roderbrasil.com.br/f0.jpg');
  assert.equal(r2.produtos_alterados, 10);
  assert.equal(r2.faltam_para_proxima_rodada, 1);
  // a trava foi solta nas duas
  assert.equal(db.docs.get(`${COLECAO_ESTADO}/${DOC_TRAVA}`).dono, '');
});

test('fotos de fora: mapa para voltar gravado ANTES das trocas, como lista {de, para}; um produto com erro não para os outros', async () => {
  const produtos = [
    { id: 'a', data: { name: 'A', image_url: 'https://roderbrasil.com.br/a.jpg' } },
    { id: 'b', data: { name: 'B', image_url: 'https://roderbrasil.com.br/b.jpg' } },
    { id: 'c', data: { name: 'C', image_url: 'https://roderbrasil.com.br/c.jpg' } },
  ];
  const db = bancoManutencao(produtos, { falharUpdate: 'b' });
  const r = await fotosExternas({
    db, site: SITE, buckets: BUCKETS, bucketDestino: BUCKETS[0], carregarSharp: async () => sharp,
    baixar: async () => ({ bytes: FOTO, tipo: 'image/jpeg' }), gravar: async (c: string) => NOVO(c),
  }, true, 'admin');
  assert.equal(r.produtos_alterados, 2);
  assert.equal(r.erros_ao_trocar, 1);
  assert.equal(db.registros.length, 2);
  assert.equal(db.registros[0].situacao, 'trocando');
  assert.equal(db.registros[0].trocados, 0, 'o mapa foi gravado antes de qualquer troca');
  assert.ok(Array.isArray(db.registros[0].mapa));
  assert.deepEqual(Object.keys(db.registros[0].mapa[0]).sort(), ['de', 'para']);
  assert.equal(db.registros[0].mapa.length, 3);
  assert.equal(db.registros[1].situacao, 'concluido_com_erros');
  assert.equal(db.docs.get('products/b').image_url, 'https://roderbrasil.com.br/b.jpg');
  assert.match(db.docs.get('products/c').image_url, /^https:\/\/firebasestorage\./);
});

test('fotos de fora: duas rodadas ao mesmo tempo, a segunda é barrada; trava vencida (servidor caiu) solta sozinha', async () => {
  const produtos = [{ id: 'a', data: { name: 'A', image_url: 'https://roderbrasil.com.br/a.jpg' } }];
  const db = bancoManutencao(produtos);
  let soltar: () => void = () => {};
  const espera = new Promise<void>(ok => { soltar = ok; });
  let agora = new Date('2026-10-19T12:00:00Z');
  const deps = {
    db, site: SITE, buckets: BUCKETS, bucketDestino: BUCKETS[0], carregarSharp: async () => sharp,
    baixar: async () => { await espera; return { bytes: FOTO, tipo: 'image/jpeg' }; },
    gravar: async (c: string) => NOVO(c), agora: () => agora,
  };
  const primeira = fotosExternas(deps, false, 'admin');
  await new Promise(r => setImmediate(r));
  await assert.rejects(fotosExternas({ ...deps, baixar: async () => null }, false, 'admin'), RodadaEmAndamento);
  soltar();
  await primeira;
  // depois que a primeira termina, roda de novo
  assert.equal((await fotosExternas(deps, false, 'admin')).ok, true);
  // trava esquecida por um servidor que caiu: depois de 10 minutos, outra rodada passa
  db.docs.set(`${COLECAO_ESTADO}/${DOC_TRAVA}`, { dono: 'outro', travado_ate: new Date(agora.getTime() + 60_000).toISOString() });
  await assert.rejects(fotosExternas(deps, false, 'admin'), RodadaEmAndamento);
  agora = new Date(agora.getTime() + 11 * 60_000);
  assert.equal((await fotosExternas(deps, false, 'admin')).ok, true);
});

test('destino com lista de nomes: cada salto tem de estar na lista (foto do Agendor)', async () => {
  const publico = async () => [{ address: '93.184.216.34', family: 4 }];
  const lista = (h: string) => h === 'agendor.com.br' || h.endsWith('.agendor.com.br');
  assert.ok(await conferirDestino('https://app.agendor.com.br/a.jpg', { resolver: publico, hostPermitido: lista }));
  assert.equal(await conferirDestino('https://site.com/a.jpg', { resolver: publico, hostPermitido: lista }), null);
});
