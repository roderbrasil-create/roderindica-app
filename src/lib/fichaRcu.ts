// Fichas dos transportadores radiocontrolados FAE RCU (45, 55, 75 e 120), versão de 11/2026.
// Cada modelo tem a ficha oficial de 3 páginas (capa, ficha técnica, plano de manutenção) e o card principal
// tem a ficha comparativa de 1 página, com tabela e vantagens dos quatro. São arquivos prontos em
// public/fichas-rcu: o app só exibe, baixa e compartilha.

export const PASTA_FICHA_RCU = '/fichas-rcu';

export const CHAVES_FICHA_RCU = ['rcu45', 'rcu55', 'rcu75', 'rcu120', 'comparativo'] as const;
export type ChaveFichaRcu = typeof CHAVES_FICHA_RCU[number];

const PAGINAS: Record<ChaveFichaRcu, number> = { rcu45: 3, rcu55: 3, rcu75: 3, rcu120: 3, comparativo: 1 };

export const paginasFichaRcu = (chave: ChaveFichaRcu): string[] =>
  Array.from({ length: PAGINAS[chave] }, (_, i) => `${PASTA_FICHA_RCU}/ficha-${chave === 'comparativo' ? 'rcu-comparativo' : chave}-p${i + 1}.webp`);

export const pdfFichaRcuUrl = (chave: ChaveFichaRcu): string =>
  `${PASTA_FICHA_RCU}/Ficha_FAE_${chave === 'comparativo' ? 'RCU_Comparativo' : chave.toUpperCase()}.pdf`;

export const tituloFichaRcu = (chave: ChaveFichaRcu): string =>
  chave === 'comparativo' ? 'Ficha FAE RCU, comparativo dos 4 modelos' : `Ficha FAE ${chave.toUpperCase().replace('RCU', 'RCU ')}`;

export const nomeArquivoFichaRcu = (chave: ChaveFichaRcu): string =>
  chave === 'comparativo' ? 'Ficha_FAE_RCU_Comparativo.pdf' : `Ficha_FAE_${chave.toUpperCase()}.pdf`;

export const PREFIXO_LINK_FICHA_RCU = 'ficha-rcu:';

export function ehLinkFichaRcu(href: string): boolean {
  return String(href || '').trim().toLowerCase().startsWith(PREFIXO_LINK_FICHA_RCU);
}

// O texto cita um transportador FAE RCU? ("RCU", "RCU55", "RCU 75", "FAE RCU-120"; "BL1/RCU55-125" é implemento e não conta)
export function ehRcu(texto?: string | null): boolean {
  const t = String(texto || '').toLowerCase();
  if (!/\brcu\b|\brcu[-_ ]?\d/.test(t)) return false;
  // implemento do RCU (BL0/RCU45-125, PML/RCU55-150, SCL/RCU, UML/SONIC/RCU120-150) não é o transportador
  return !/[a-z0-9]\/rcu/.test(t) || /\brcu[-_ ]?(45|55|75|120)\b(?![-/]\d)/.test(t.replace(/[a-z0-9]+\/rcu\d*(-\d+)?/g, ''));
}

// Qual modelo o texto cita (nulo = nenhum modelo em particular)
export function chaveModeloRcu(texto?: string | null): ChaveFichaRcu | null {
  const t = String(texto || '').toLowerCase().replace(/[a-z0-9]+\/rcu\d*(-\d+)?/g, ' ');
  const m = t.match(/\brcu[-_ ]?(45|55|75|120)\b/);
  return m ? (`rcu${m[1]}` as ChaveFichaRcu) : null;
}

// "ficha-rcu:75", "ficha-rcu:rcu120" ou "ficha-rcu:comparativo"
export function chaveDoLinkFichaRcu(href: string): ChaveFichaRcu | null {
  if (!ehLinkFichaRcu(href)) return null;
  const resto = String(href).trim().slice(PREFIXO_LINK_FICHA_RCU.length).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (resto === 'comparativo' || resto === 'rcu' || resto === 'todos') return 'comparativo';
  const m = resto.match(/^(?:rcu)?(45|55|75|120)$/);
  return m ? (`rcu${m[1]}` as ChaveFichaRcu) : null;
}

// Decide a ficha: o modelo citado primeiro; só o produto (card principal) abre o comparativo
export function chaveFichaRcu(modelo?: string | null, ...contexto: Array<string | null | undefined>): ChaveFichaRcu | null {
  const doModelo = chaveModeloRcu(modelo);
  if (doModelo) return doModelo;
  if (contexto.some(c => ehRcu(c) && !chaveModeloRcu(c)) || ehRcu(modelo)) return 'comparativo';
  return null;
}
