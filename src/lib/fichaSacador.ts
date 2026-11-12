// Ficha "Sacador de Árvores Roder SAC-500" (2 páginas A4). Versão nova de 12/11/2026, no lugar da ficha antiga
// montada em React (que dizia eucalipto até 35 cm: o certo é 100 a 300 mm, ou seja, até 30 cm).
// As páginas e o PDF são arquivos prontos em public/fichas-sacador: o app só exibe, baixa e compartilha.

export const PASTA_FICHA_SACADOR = '/fichas-sacador';
export const PDF_FICHA_SACADOR = `${PASTA_FICHA_SACADOR}/Ficha_Sacador_SAC500.pdf`;
export const PAGINAS_FICHA_SACADOR = [`${PASTA_FICHA_SACADOR}/ficha-sacador-sac500-p1.webp`, `${PASTA_FICHA_SACADOR}/ficha-sacador-sac500-p2.webp`];
export const NOME_ARQUIVO_FICHA_SACADOR = 'Ficha_Sacador_SAC500_Roder.pdf';
export const TITULO_FICHA_SACADOR = 'Ficha Sacador de Árvores Roder SAC-500';

// O texto cita o Sacador SAC-500? ("SAC 500", "SAC-500", "SAC500", "sacador de árvores")
export function ehSacadorSac500(texto?: string | null): boolean {
  const t = String(texto || '').toLowerCase();
  return /\bsac[-_ ]?500\b/.test(t) || /sacador/.test(t);
}
