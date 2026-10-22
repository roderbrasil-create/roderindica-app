// Card do Destocador Roder DTH 240B (pedido do Jeferson, 22/10/2026): o cadastro antigo dizia
// Ø 240 mm, 14 a 25 Ton., 210 a 250 bar e 120 a 180 L/min. Os valores confirmados são os da ficha.
// O peso continua 750 kg. Cada campo só é trocado se ainda tiver o valor ANTIGO: o que a diretoria
// editar depois pela tela de cadastro nunca é desfeito.
export const SPECS_DTH240B = {
  diametro_corte: '660',
  maquina_base: '14 a 22 t (escavadeira) | 6 a 10 t (retro/escav. pequena)',
  pressao: '280 a 350 bar (escavadeira) | 190 a 220 bar (retro)',
  vazao: '140 a 220 L/min (escavadeira) | 100 a 150 L/min (retro)',
} as const;

// Campos que o cadastro antigo não tinha (medidas sem o suporte, da ficha)
export const SPECS_NOVAS_DTH240B = {
  comprimento_total: '1.452 mm',
  profundidade_trabalho: '740 mm',
} as const;

export const ROTULOS_DTH240B: Record<string, string> = {
  comprimento_total: 'Comprimento total (sem suporte)',
  profundidade_trabalho: 'Profundidade de trabalho (sem suporte)',
};

export const ROTULO_DIAMETRO_BROCA = 'Ø da broca';

const ANTIGOS: Record<keyof typeof SPECS_DTH240B, RegExp> = {
  diametro_corte: /^\s*240\s*(mm)?\s*$/i,
  maquina_base: /^\s*14\s*a\s*25\s*(t|ton)?\.?\s*$/i,
  pressao: /^\s*210\s*(a|-)\s*250\s*(bar)?\s*$/i,
  vazao: /^\s*120\s*(a|-)\s*180\s*(l\/min)?\s*$/i,
};

type Modelo = { id?: string; name?: string; technical_specs?: any };

export const ehModeloDth240b = (m: Modelo | null | undefined) =>
  !!m && (/^dth[-_ ]?240b?$/i.test(String(m.id || '').trim()) || /^dth[-_ ]?240b?$/i.test(String(m.name || '').trim()));

// Devolve os modelos com os campos antigos trocados, ou null se nada muda
export function corrigirDestocadorDth240b<T extends Modelo>(modelos: T[] | undefined | null): T[] | null {
  let mudou = false;
  const novos = (modelos || []).map(m => {
    if (!ehModeloDth240b(m) || !m.technical_specs) return m;
    const specs = { ...m.technical_specs };
    let alterou = false;
    for (const campo of Object.keys(SPECS_DTH240B) as (keyof typeof SPECS_DTH240B)[]) {
      if (typeof specs[campo] === 'string' && ANTIGOS[campo].test(specs[campo])) { specs[campo] = SPECS_DTH240B[campo]; alterou = true; }
    }
    if (!alterou) return m;
    // cadastro antigo: acrescenta as medidas novas só quando estão vazias
    for (const campo of Object.keys(SPECS_NOVAS_DTH240B) as (keyof typeof SPECS_NOVAS_DTH240B)[]) {
      if (!String(specs[campo] ?? '').trim()) specs[campo] = SPECS_NOVAS_DTH240B[campo];
    }
    mudou = true;
    return { ...m, technical_specs: specs };
  });
  return mudou ? novos : null;
}

// Só a exibição: o card já aparece certo antes de a correção do banco rodar (ou se ela não puder gravar)
export function comDestocadorDthCorrigido<P extends { models?: Modelo[] }>(produto: P): P {
  const novos = corrigirDestocadorDth240b(produto?.models);
  return novos ? { ...produto, models: novos } : produto;
}

// Acrescenta a unidade só se o valor ainda não a traz (os valores do DTH já vêm com "bar" e "L/min")
export const comUnidade = (valor: unknown, unidade: string) => {
  const v = String(valor ?? '');
  return v.toLowerCase().includes(unidade.toLowerCase()) ? v : `${v} ${unidade}`;
};

// Rótulo do campo no card: no DTH o diâmetro é o da broca, e não "Ø Máx. Corte"
export const rotuloDiametroDoModelo = (m: Modelo | null | undefined, padrao: string) => (ehModeloDth240b(m) ? ROTULO_DIAMETRO_BROCA : padrao);

// Editor: máquina base, pressão e vazão guardam os dois perfis num texto só ("A (escavadeira) | B (retro/escav. pequena)"),
// que é o que o card, a ficha padrão e o envio ao cliente já leem. O editor mostra um campo por perfil.
export function perfisDoTexto(texto: unknown): { escavadeira: string; retro: string } {
  const partes = String(texto ?? '').split('|').map(x => x.replace(/\s*\([^)]*\)\s*$/, '').trim());
  return { escavadeira: partes[0] || '', retro: partes[1] || '' };
}

// A máquina base diz "retro/escav. pequena"; vazão e pressão dizem só "retro" (como na ficha)
export function comporPerfis(escavadeira: string, retro: string, nomeRetro = 'retro'): string {
  const e = escavadeira.trim();
  const r = retro.trim();
  if (e && r) return `${e} (escavadeira) | ${r} (${nomeRetro})`;
  if (r) return `${r} (${nomeRetro})`;
  return e;
}
