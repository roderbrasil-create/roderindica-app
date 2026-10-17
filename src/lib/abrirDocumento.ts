// Abre fichas, catálogos, notas, fotos e vídeos DENTRO do app, com botão de voltar.
// No app instalado no celular, "abrir em nova aba" trocava a tela do app pelo arquivo,
// sem nenhum botão: o X do vídeo ou do PDF fechava tudo e o app reabria no dashboard.
export type TipoMidia = 'pdf' | 'video' | 'youtube' | 'vimeo' | 'drive';
export type PedidoDocumento = { url: string; titulo?: string; tipo: TipoMidia };

const EVENTO = 'roder:abrir-documento';
let abrirOriginal: typeof window.open | null = null;

export function idYoutube(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i);
  return m ? m[1] : '';
}
export function idVimeo(url: string) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d{5,})/i);
  return m ? m[1] : '';
}
export function idDrive(url: string) {
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]{10,})/i);
  return m ? m[1] : '';
}

// Decide como mostrar. null = página ou sistema de fora (Roder Vision, WhatsApp, sites):
// abre fora do app, onde o celular mostra o próprio botão de fechar.
export function tipoDaMidia(url: string): TipoMidia | null {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.startsWith('mailto:') || u.startsWith('tel:') || u.includes('wa.me/') || u.includes('whatsapp.com')) return null;
  if (idYoutube(url)) return 'youtube';
  if (idVimeo(url)) return 'vimeo';
  if (idDrive(url)) return 'drive';
  if (/\.(mp4|webm|mov|m4v)($|[?#])/.test(u)) return 'video';
  if (u.startsWith('blob:') || u.startsWith('data:application/pdf') || /\.pdf($|[?#])/.test(u) || u.includes('.pdf%')) return 'pdf';
  if (u.includes('firebasestorage.googleapis.com') || u.includes('storage.googleapis.com')) {
    // Arquivo do Storage: só PDF e foto abrem no leitor; planilha, Word e áudio abrem fora
    const caminho = decodeURIComponent(u.split('?')[0]);
    const ext = (caminho.match(/\.([a-z0-9]{2,5})$/) || [])[1];
    if (ext && !['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return null;
    return 'pdf';
  }
  return null;
}

export function abrirDocumento(url: string, titulo?: string) {
  if (!url) return;
  const tipo = tipoDaMidia(url);
  if (!tipo) {
    (abrirOriginal || window.open).call(window, url, '_blank', 'noopener,noreferrer');
    return;
  }
  window.dispatchEvent(new CustomEvent<PedidoDocumento>(EVENTO, { detail: { url, titulo, tipo } }));
}

export function ouvirDocumentos(fn: (p: PedidoDocumento) => void) {
  const h = (e: Event) => fn((e as CustomEvent<PedidoDocumento>).detail);
  window.addEventListener(EVENTO, h);
  return () => window.removeEventListener(EVENTO, h);
}

const nomeDoLink = (url: string) => {
  try {
    const ultimo = decodeURIComponent(new URL(url, window.location.href).pathname.split('/').pop() || '');
    return ultimo.replace(/\.(pdf|mp4|webm|mov)$/i, '').replace(/[-_]+/g, ' ').trim() || undefined;
  } catch { return undefined; }
};

// Rede de segurança para o app inteiro: qualquer window.open ou link "nova aba" que
// aponte para PDF ou vídeo cai no leitor. Assim um botão novo, feito amanhã em qualquer
// tela, já nasce com o "voltar" funcionando, sem ninguém lembrar de trocar o código dele.
export function instalarInterceptor() {
  if (abrirOriginal || typeof window === 'undefined') return;
  abrirOriginal = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    const u = url ? String(url) : '';
    if (u && tipoDaMidia(u)) {
      abrirDocumento(u, nomeDoLink(u));
      return null;
    }
    return abrirOriginal!(url as any, target, features);
  }) as typeof window.open;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = (e.target as HTMLElement | null)?.closest?.('a') as HTMLAnchorElement | null;
    if (!a || !a.href || a.hasAttribute('download')) return;
    if (!tipoDaMidia(a.href)) return;
    e.preventDefault();
    abrirDocumento(a.href, a.getAttribute('title') || a.textContent?.trim() || nomeDoLink(a.href));
  }, true);
}

// Abre no navegador do celular, sem passar pelo leitor (botão "Abrir no navegador")
export function abrirForaDoApp(url: string) {
  (abrirOriginal || window.open).call(window, url, '_blank', 'noopener,noreferrer');
}
