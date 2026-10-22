// Ficha "Destocador Roder DTH-240B" (1 página A4, aprovada em 22/10/2026).
// A página e o PDF são arquivos prontos em public/fichas-destocador: o app só exibe, baixa e compartilha.
// Serve para o vendedor mandar por WhatsApp ao cliente, que faz a solicitação de orçamento por conta própria.

export const PASTA_FICHA_DESTOCADOR = '/fichas-destocador';
export const PDF_FICHA_DESTOCADOR = `${PASTA_FICHA_DESTOCADOR}/Ficha_Destocador_DTH240B.pdf`;
export const PAGINAS_FICHA_DESTOCADOR = [`${PASTA_FICHA_DESTOCADOR}/ficha-destocador-dth240b-p1.webp`];
export const NOME_ARQUIVO_FICHA_DESTOCADOR = 'Ficha_Destocador_DTH240B.pdf';
export const TITULO_FICHA_DESTOCADOR = 'Ficha Destocador DTH-240B';

export const PREFIXO_LINK_FICHA_DESTOCADOR = 'ficha-destocador:';

export function ehLinkFichaDestocador(href: string): boolean {
  return String(href || '').trim().toLowerCase().startsWith(PREFIXO_LINK_FICHA_DESTOCADOR);
}

// "ficha-destocador:dth240b" (e variações: "dth-240b", "DTH240B")
export function chaveDoLinkFichaDestocador(href: string): 'dth240b' | null {
  if (!ehLinkFichaDestocador(href)) return null;
  const resto = String(href).trim().slice(PREFIXO_LINK_FICHA_DESTOCADOR.length).toLowerCase().replace(/[^a-z0-9]/g, '');
  return resto === 'dth240b' || resto === 'dth240' ? 'dth240b' : null;
}

// O texto cita o Destocador Roder tipo broca (DTH 240B)? Estrito: suporte e kit de destocador não entram.
export function ehDestocadorDth(texto?: string | null): boolean {
  const t = String(texto || '').toLowerCase();
  return /\bdth[-_ ]?240/.test(t) || /destocador tipo broca/.test(t);
}
