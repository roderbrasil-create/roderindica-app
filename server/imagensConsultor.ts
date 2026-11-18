// Consultor técnico: garante que a foto mostrada é do equipamento citado no texto da imagem.
// Resposta comum: no máximo 1 foto. Relatório comparativo: uma foto por equipamento comparado (até 4),
// senão só o primeiro equipamento aparece e o comparativo sai desigual.
export const MAX_FOTOS_RESPOSTA = 1;
export const MAX_FOTOS_COMPARATIVO = 4;

export function ehRelatorioComparativo(texto: string): boolean {
  return /RELAT[ÓO]RIO COMPARATIVO/i.test(texto || '');
}

export function fixConsultantImages(text: string, index: { label: string; url: string }[]): string {
  const norm = (v: string) => String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'para', 'com', 'e', 'o', 'a', 'roder', 'modelo', 'equipamento', 'foto', 'imagem']);
  const tokens = (v: string) => norm(v).split(/[^a-z0-9]+/).filter(t => t.length >= 2 && !STOP.has(t));
  const knownUrls = new Set(index.map(i => i.url));
  const limite = ehRelatorioComparativo(text) ? MAX_FOTOS_COMPARATIVO : MAX_FOTOS_RESPOSTA;
  let shown = 0;
  const used = new Set<string>();
  return text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) => {
    const altTokens = tokens(alt);
    let best: { url: string; score: number } | null = null;
    for (const entry of index) {
      const lt = new Set(tokens(entry.label));
      let score = 0;
      for (const t of altTokens) if (lt.has(t)) score += /\d/.test(t) ? 3 : 1;
      if (score > 0 && (!best || score > best.score)) best = { url: entry.url, score };
    }
    const finalUrl = best ? best.url : (knownUrls.has(url) ? url : '');
    if (!finalUrl || used.has(finalUrl) || shown >= limite) return '';
    used.add(finalUrl);
    shown++;
    return `![${alt}](${finalUrl})`;
  }).replace(/\n{3,}/g, '\n\n');
}
