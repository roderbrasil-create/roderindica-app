// Roder Indica: funcionamento sem internet.
// Com internet: a tela do app vem sempre do servidor (versão nova), e o que chega fica guardado.
// Sem internet: abre a última versão guardada, com catálogo, fotos e fichas.
// As rotas /api e o banco (Firebase) nunca passam por aqui: o banco tem o próprio cache.
const VERSAO = 'roder-v1';
const APP = `${VERSAO}-app`;      // tela do app e arquivos do site
const FOTOS = 'roder-fotos';      // fotos dos equipamentos (fica entre versões)
const LIMITE_FOTOS = 900;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(APP);
    await Promise.allSettled(['/', '/manifest.webmanifest', '/marca/roder-redondo-512.png', '/marca/roder-horizontal.png', '/marca/icone-192.png'].map(u => c.add(new Request(u, { cache: 'reload' }))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => n.startsWith('roder-v') && !n.startsWith(VERSAO)).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

const ehFoto = (req, url) => req.destination === 'image' || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url.pathname);

async function limitarFotos() {
  const c = await caches.open(FOTOS);
  const chaves = await c.keys();
  for (let i = 0; i < chaves.length - LIMITE_FOTOS; i++) await c.delete(chaves[i]);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') return;
  const mesmaOrigem = url.origin === self.location.origin;

  // Nunca: API, banco, login, vídeos (pedidos parciais) e o próprio roder-sw.js
  if (mesmaOrigem && (url.pathname.startsWith('/api/') || url.pathname === '/roder-sw.js')) return;
  if (/firestore\.googleapis|identitytoolkit|securetoken|googleapis\.com\/(identity|v1)|firebaseinstallations/.test(url.hostname + url.pathname)) return;
  if (req.headers.has('range') || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url.pathname)) return;

  // Abrir uma tela do app: tenta a internet (até 4 s); sem ela, a tela guardada
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(APP);
      try {
        const resp = await Promise.race([
          fetch(req),
          new Promise((_, rej) => setTimeout(() => rej(new Error('lento')), 4000)),
        ]);
        if (resp && resp.ok && (resp.headers.get('content-type') || '').includes('text/html')) {
          // todas as telas do app são o mesmo index.html; a página /o/ tem prévia própria
          if (!url.pathname.startsWith('/o/')) c.put('/', resp.clone());
        }
        return resp;
      } catch {
        return (await c.match('/')) || Response.error();
      }
    })());
    return;
  }

  // Arquivos do app com nome que muda a cada versão: guardados para sempre
  if (mesmaOrigem && url.pathname.startsWith('/assets/')) {
    e.respondWith((async () => {
      const c = await caches.open(APP);
      const salvo = await c.match(req);
      if (salvo) return salvo;
      const resp = await fetch(req);
      if (resp.ok) c.put(req, resp.clone());
      return resp;
    })());
    return;
  }

  // Fotos (do app, do site da Roder e do Storage): usa a guardada, senão baixa e guarda
  if (ehFoto(req, url)) {
    e.respondWith((async () => {
      const c = await caches.open(FOTOS);
      const salvo = await c.match(req, { ignoreVary: true });
      if (salvo) return salvo;
      try {
        const resp = await fetch(req);
        if (resp.ok || resp.type === 'opaque') { await c.put(req, resp.clone()); limitarFotos(); }
        return resp;
      } catch {
        return (await c.match(req.url, { ignoreSearch: false })) || Response.error();
      }
    })());
    return;
  }

  // Demais arquivos do próprio site (fichas em /catalogo, pdf.js, lista de cidades, ícones):
  // usa o guardado na hora e atualiza por trás
  if (mesmaOrigem) {
    e.respondWith((async () => {
      const c = await caches.open(APP);
      const salvo = await c.match(req);
      const rede = fetch(req).then(resp => { if (resp.ok) c.put(req, resp.clone()); return resp; }).catch(() => null);
      return salvo || (await rede) || Response.error();
    })());
  }
});
