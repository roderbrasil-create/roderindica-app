// Ficha "GMT 035 Guindaste" (4 páginas A4, aprovada em 22/10/2026, Modelo A).
// As páginas e o PDF são arquivos prontos em public/fichas-gmt: o app só exibe, baixa e compartilha.
// Serve para o cliente encaminhar ao fabricante do guindaste, que prepara as linhas, vazão, pressão,
// engates e controle remoto. Nunca leva nome, site nem contato do fabricante do cabeçote (só a logo na imagem).

export const PASTA_FICHA_GMT = '/fichas-gmt';
export const PDF_FICHA_GMT = `${PASTA_FICHA_GMT}/Ficha_GMT_035_Guindaste.pdf`;
export const PAGINAS_FICHA_GMT = [1, 2, 3, 4].map(n => `${PASTA_FICHA_GMT}/ficha-gmt-035-p${n}.webp`);
export const NOME_ARQUIVO_FICHA_GMT = 'Ficha_GMT_035_Guindaste.pdf';
export const TITULO_FICHA_GMT = 'Ficha GMT 035 Guindaste';

export const PREFIXO_LINK_FICHA_GMT = 'ficha-gmt:';

export function ehLinkFichaGmt(href: string): boolean {
  return String(href || '').trim().toLowerCase().startsWith(PREFIXO_LINK_FICHA_GMT);
}

// "ficha-gmt:035" (e variações: "ficha-gmt:gmt-035", "ficha-gmt:GMT035")
export function chaveDoLinkFichaGmt(href: string): '035' | null {
  if (!ehLinkFichaGmt(href)) return null;
  const resto = String(href).trim().slice(PREFIXO_LINK_FICHA_GMT.length).toLowerCase().replace(/[^a-z0-9]/g, '');
  return resto === '035' || resto === 'gmt035' ? '035' : null;
}

// O texto cita o cabeçote GMT 035 (ou JMT 035)?
export function ehCabecoteGmt035(texto?: string | null): boolean {
  const t = String(texto || '').toLowerCase();
  return /\b[gj]mt[-_ ]?0?35\b/.test(t) || /\bgmt\b/.test(t);
}
