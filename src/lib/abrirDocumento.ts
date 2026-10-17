// Abre um documento (ficha, catálogo de peças, contrato...) DENTRO do app, com botão de voltar.
// Antes era window.open: no app instalado no celular o PDF abria em tela cheia sem nenhum
// botão, e a única saída era fechar o app inteiro.
export type PedidoDocumento = { url: string; titulo?: string };

const EVENTO = 'roder:abrir-documento';

const ehPdf = (url: string) => {
  const u = url.toLowerCase();
  return u.startsWith('blob:') || u.startsWith('data:application/pdf') || /\.pdf($|[?#])/.test(u) || u.includes('.pdf%') ||
    u.includes('firebasestorage.googleapis.com') || u.includes('storage.googleapis.com') ||
    /drive\.google\.com\/(file\/d\/|open\?id=|uc\?)/.test(u);
};

export function abrirDocumento(url: string, titulo?: string) {
  if (!url) return;
  // Página ou sistema de fora (ex.: catálogo digital do Roder Vision): abre fora do app.
  // O celular mostra esses endereços com botão de fechar próprio.
  if (!ehPdf(url)) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  window.dispatchEvent(new CustomEvent<PedidoDocumento>(EVENTO, { detail: { url, titulo } }));
}

export function ouvirDocumentos(fn: (p: PedidoDocumento) => void) {
  const h = (e: Event) => fn((e as CustomEvent<PedidoDocumento>).detail);
  window.addEventListener(EVENTO, h);
  return () => window.removeEventListener(EVENTO, h);
}
