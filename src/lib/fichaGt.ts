// Fichas das garras traçadoras Roder GT, no padrão novo (1 página A4 pronta, com o PDF aprovado).
// Hoje só a GT 600X tem a ficha nova. GT 800X e GT 1000X entram aqui quando a ficha chegar:
// basta colocar o PDF e a imagem em public/fichas-gt e incluir a chave abaixo.
// Os outros modelos GT continuam com a ficha padrão automática.

export const PASTA_FICHA_GT = '/fichas-gt';

export const CHAVES_FICHA_GT = ['gt600x'] as const;
export type ChaveFichaGt = typeof CHAVES_FICHA_GT[number];

export const paginasFichaGt = (chave: ChaveFichaGt): string[] => [`${PASTA_FICHA_GT}/ficha-${chave}-p1.webp`];

export const nomeArquivoFichaGt = (chave: ChaveFichaGt): string => `Ficha_Garra_Tracadora_${chave.toUpperCase()}.pdf`;

export const pdfFichaGtUrl = (chave: ChaveFichaGt): string => `${PASTA_FICHA_GT}/${nomeArquivoFichaGt(chave)}`;

export const tituloFichaGt = (chave: ChaveFichaGt): string => `Ficha Garra Traçadora ${chave.toUpperCase().replace('GT', 'GT ')}`;

export const PREFIXO_LINK_FICHA_GT = 'ficha-gt:';

export function ehLinkFichaGt(href: string): boolean {
  return String(href || '').trim().toLowerCase().startsWith(PREFIXO_LINK_FICHA_GT);
}

// "GT 600x", "GT600X", "gt-600" ... Só devolve chave de modelo que já tem ficha nova
export function chaveModeloGt(texto?: string | null): ChaveFichaGt | null {
  const m = String(texto || '').toLowerCase().match(/\bgt[-_ ]?(\d{3,4})\s*x?\b/);
  if (!m) return null;
  const chave = `gt${m[1]}x` as ChaveFichaGt;
  return (CHAVES_FICHA_GT as readonly string[]).includes(chave) ? chave : null;
}

// "ficha-gt:600x", "ficha-gt:gt600"
export function chaveDoLinkFichaGt(href: string): ChaveFichaGt | null {
  if (!ehLinkFichaGt(href)) return null;
  const resto = String(href).trim().slice(PREFIXO_LINK_FICHA_GT.length).toLowerCase().replace(/[^a-z0-9]/g, '');
  const m = resto.match(/^(?:gt)?(\d{3,4})x?$/);
  if (!m) return null;
  const chave = `gt${m[1]}x` as ChaveFichaGt;
  return (CHAVES_FICHA_GT as readonly string[]).includes(chave) ? chave : null;
}

// Decide a ficha pelo nome do modelo (o card do produto, sem modelo, não abre ficha nova)
export function chaveFichaGt(modelo?: string | null): ChaveFichaGt | null {
  return chaveModeloGt(modelo);
}
