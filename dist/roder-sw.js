// Roder Indica: funcionamento sem internet.
// Com internet: a tela do app vem sempre do servidor (versão nova), e o que chega fica guardado.
// Sem internet: abre a última versão guardada, com catálogo, fotos e fichas.
// As rotas /api, o banco e o login (Firebase) nunca passam por aqui.
//
// DESLIGAR EM EMERGÊNCIA: troque o conteúdo deste arquivo por
//   self.addEventListener('install', () => self.skipWaiting());
//   self.addEventListener('activate', () => self.registration.unregister());
// e publique. Os celulares buscam este arquivo sem cache e se desligam sozinhos.
const VERSAO = 'roder-v2';
const APP = `${VERSAO}-app`;      // tela do app, pacote JS/CSS, pdf.js, ícones
const FOTOS = 'roder-fotos';      // fotos dos equipamentos (fica entre versões)
const LIMITE_FOTOS = 900;

const ativosDoHtml = (html) => Array.from(new Set((html.match(/\/assets\/[^"'\s)]+/g) || [])));

// Guarda a tela do app só junto com os arquivos dela: se faltar um, a tela antiga fica
// (evita abrir sem internet uma tela que pede um arquivo que não está guardado)
async function guardarTela(c, resp) {
  const html = await resp.clone().text();
  const ativos = ativosDoHtml(html);
  // as fontes vêm citadas dentro do CSS
  for (const css of ativos.filter(x => x.endsWith('.css'))) {
    try {
      const r = (await c.match(css)) || await fetch(css);
      for (const f of ((await r.clone().text()).match(/\/assets\/[^"'\s)]+/g) || [])) if (!ativos.includes(f)) ativos.push(f);
    } catch { return; }
  }
  for (const a of ativos) {
    if (!(await c.match(a))) {
      const r = await fetch(a);
      if (!r.ok) return;
      await c.put(a, r);
    }
  }
  await c.put('/', resp);
  // apaga pacotes de versões antigas
  const manter = new Set(ativos);
  for (const k of await c.keys()) {
    const p = new URL(k.url).pathname;
    if (p.startsWith('/assets/') && !manter.has(p)) await c.delete(k);
  }
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(APP);
    await Promise.allSettled(['/manifest.webmanifest', '/marca/roder-redondo-512.png', '/marca/roder-horizontal.png', '/marca/icone-192.png', '/pdfjs/pdf.min.mjs', '/pdfjs/pdf.worker.min.mjs', '/cidades-br.txt'].map(u => c.add(new Request(u, { cache: 'reload' }))));
    try {
      const r = await fetch('/', { cache: 'reload' });
      if (r.ok) await guardarTela(c, r);
    } catch { /* sem internet na instalação: guarda na próxima abertura */ }
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

const ehFoto = (req, url) => req.destination === 'image' || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url.pathname);

async function limitarFotos(c) {
  const chaves = await c.keys();
  for (let i = 0; i < chaves.length - LIMITE_FOTOS; i++) await c.delete(chaves[i]);
}

// Foto de outro site (site da Roder, Storage): baixa pelo nosso servidor, que devolve uma
// resposta normal (não "opaca"). Resposta opaca o Chrome conta como 7 MB cada e estoura o espaço.
async function baixarFoto(url) {
  if (url.origin === self.location.origin) return fetch(url.href);
  return fetch(`/api/documento?url=${encodeURIComponent(url.href)}`);
}

async function guardar(c, chave, resp) {
  try { await c.put(chave, resp); limitarFotos(c); } catch { /* sem espaço: segue sem guardar */ }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') return;
  const mesmaOrigem = url.origin === self.location.origin;

  // Nunca: API, login do Firebase (/__/), banco, vídeos, PDFs (o leitor já guarda), verificação de versão
  if (mesmaOrigem && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/__/') || url.pathname === '/roder-sw.js' || url.pathname === '/index.html')) return;
  if (/firestore\.googleapis|identitytoolkit|securetoken|firebaseinstallations|googleapis\.com\/identity/.test(url.hostname + url.pathname)) return;
  if (req.headers.has('range') || /\.(mp4|webm|mov|m4v|pdf)(\?|$)/i.test(url.pathname)) return;

  // Abrir uma tela do app: internet primeiro. Se demorar mais de 4 s E houver tela guardada,
  // abre a guardada (e a resposta da internet, quando chegar, atualiza a guardada).
  if (req.mode === 'navigate') {
    const rede = fetch(req);
    // mantém o trabalho vivo até guardar a tela nova, mesmo se a guardada já foi mostrada
    e.waitUntil(rede.then(async resp => {
      if (resp.ok && !url.pathname.startsWith('/o/') && (resp.headers.get('content-type') || '').includes('text/html')) {
        const copia = resp.clone(); // antes de qualquer await: o navegador já vai ler a original
        await guardarTela(await caches.open(APP), copia);
      }
    }).catch(() => {}));
    e.respondWith((async () => {
      const c = await caches.open(APP);
      const salvo = await c.match('/');
      if (!salvo) return rede;
      try {
        return await Promise.race([rede, new Promise((_, rej) => setTimeout(() => rej(new Error('lento')), 4000))]);
      } catch {
        return salvo;
      }
    })());
    return;
  }

  // Pacote do app (nome muda a cada versão): guardado
  if (mesmaOrigem && url.pathname.startsWith('/assets/')) {
    e.respondWith((async () => {
      const c = await caches.open(APP);
      const salvo = await c.match(req);
      if (salvo) return salvo;
      const resp = await fetch(req);
      if (resp.ok) { try { await c.put(req, resp.clone()); } catch {} }
      return resp;
    })());
    return;
  }

  // Fotos: a guardada vale. Foto trocada no cadastro ganha endereço novo (token novo),
  // então não precisa conferir de novo a cada abertura (seria uma ida ao servidor por foto).
  if (ehFoto(req, url) && !url.pathname.startsWith('/marca/')) {
    e.respondWith((async () => {
      const c = await caches.open(FOTOS);
      const salvo = await c.match(url.href, { ignoreVary: true });
      if (salvo) return salvo;
      try {
        const r = await baixarFoto(url);
        if (r.ok && (r.headers.get('content-type') || '').startsWith('image/')) {
          e.waitUntil(guardar(c, url.href, r.clone()));
          return r;
        }
      } catch { /* cai para o direto */ }
      return fetch(req); // servidor não buscou: mostra direto, sem guardar
    })());
    return;
  }

  // Demais arquivos do próprio site (ícones, pdf.js, lista de cidades): guardado na hora, atualiza por trás
  if (mesmaOrigem) {
    e.respondWith((async () => {
      const c = await caches.open(APP);
      const salvo = await c.match(req, { ignoreSearch: true });
      const rede = fetch(req).then(async resp => { if (resp.ok) { try { await c.put(req, resp.clone()); } catch {} } return resp; }).catch(() => null);
      if (salvo) { e.waitUntil(rede); return salvo; }
      return (await rede) || Response.error();
    })());
  }
});
