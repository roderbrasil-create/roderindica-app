// Fichas das garras traçadoras Roder GT, no padrão novo (1 página A4 pronta, com o PDF aprovado).
// GT 600X, 800X e 1000X têm a ficha nova (13/11/2026). Modelo novo entra aqui: coloque o PDF e a imagem
// em public/fichas-gt e inclua a chave abaixo. GT 280, 360 e 400X seguem com a ficha padrão automática.

export const PASTA_FICHA_GT = '/fichas-gt';

export const CHAVES_FICHA_GT = ['gt600x', 'gt800x', 'gt1000x'] as const;
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

// Dados oficiais das fichas novas (13/11/2026). É a fonte do cadastro dos cards (technical_specs) e do consultor.
// Formato igual ao do cadastro antigo: a ficha padrão acrescenta kg, bar e L/min sozinha.
export const ESPECIFICACOES_GT: Record<ChaveFichaGt, Record<string, string>> = {
  gt600x: {
    area_carga: '0,60', capacidade_carga: '6.500 kg', diametro_corte: 'Ø 800 mm', peso: '1300', peso_com_rotator: 'RR550: 1.480 kg · IR10: 1.385 kg',
    motor: '60 cc', sabre: '52" com roldana', corrente: '3/4"', maquina_base: '16 a 22 Ton.', pressao: '240', vazao: '140 a 250', abertura_maxima: '2.124 mm',
  },
  gt800x: {
    area_carga: '0,80', capacidade_carga: '7.200 kg', diametro_corte: 'Ø 940 mm', peso: '1440', peso_com_rotator: 'RR550: 1.620 kg · IR10: 1.525 kg',
    motor: '60 cc (Parker F12-60)', sabre: '60"', corrente: '3/4"', maquina_base: '20 a 30 Ton.', pressao: '250', vazao: '180 a 250', abertura_maxima: '2.657 mm',
  },
  gt1000x: {
    area_carga: '1,00', capacidade_carga: '8.250 kg', diametro_corte: 'Ø 1.128 mm', peso: '1650', peso_com_rotator: 'RR550: 1.830 kg · IR10: 1.735 kg',
    motor: '80 cc (Parker F12-80)', sabre: '65"', corrente: '3/4"', maquina_base: '25 a 35 Ton.', pressao: '240 a 300', vazao: '220 a 300', abertura_maxima: '2.606 mm',
  },
};

// Aplica os dados das fichas novas nos modelos GT do cadastro. Devolve null se já estiver tudo igual.
export function corrigirEspecificacoesGt<T extends { id?: string; name?: string; technical_specs?: Record<string, any> }>(modelos: T[]): T[] | null {
  let mudou = false;
  const novos = (modelos || []).map(m => {
    const chave = chaveModeloGt(`${m.name || ''}`) || chaveModeloGt(String(m.id || '').replace(/-/g, ' '));
    if (!chave) return m;
    const atual = m.technical_specs || {};
    const alvo = ESPECIFICACOES_GT[chave];
    if (Object.entries(alvo).every(([k, v]) => atual[k] === v)) return m;
    mudou = true;
    return { ...m, technical_specs: { ...atual, ...alvo } };
  });
  return mudou ? novos : null;
}
