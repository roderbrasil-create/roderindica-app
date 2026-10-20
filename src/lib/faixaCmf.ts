// Faixa de máquina do CMF 500 (regra do Jeferson, 19/10/2026): indicado de 8 a 13 t.
// Acima de 13 t a indicação é SEMPRE o CMF 600 (13 a 22 t). O cadastro antigo dizia
// "8 a 22 Ton.", e o explorador mostrava as duas faixas se sobrepondo, como se o CMF 500
// fosse opção para máquina de 20 t.
export const FAIXA_CMF500 = '8 a 13 Ton.';

const ehCmf500 = (m: { id?: string; name?: string } | null | undefined) =>
  !!m && (/^cmf[-_ ]?500$/i.test(String(m.id || '').trim()) || /^cmf\s*500$/i.test(String(m.name || '').trim()));

const faixaAntiga = (v: unknown) => typeof v === 'string' && /^\s*8\s*a\s*22\s*(t|ton)?\.?\s*$/i.test(v);

// Faixa que o explorador mostra: o CMF 500 com o texto antigo já aparece certo,
// mesmo antes de a correção do banco rodar
export function faixaDoModelo(m: { id?: string; name?: string; technical_specs?: any } | null | undefined): string {
  const specs = m?.technical_specs || {};
  const bruto = String(specs.maquina_base || specs.peso_operacional || '').trim();
  if (bruto && ehCmf500(m) && faixaAntiga(bruto)) return FAIXA_CMF500;
  return bruto;
}

// Correção do cadastro: devolve os modelos com a faixa do CMF 500 trocada, ou null se nada muda
export function corrigirFaixaCmf500<T extends { id?: string; name?: string; technical_specs?: any }>(modelos: T[]): T[] | null {
  let mudou = false;
  const novos = (modelos || []).map(m => {
    if (!ehCmf500(m) || !m.technical_specs) return m;
    const specs = { ...m.technical_specs };
    let alterou = false;
    for (const campo of ['maquina_base', 'peso_operacional']) {
      if (faixaAntiga(specs[campo])) { specs[campo] = FAIXA_CMF500; alterou = true; }
    }
    if (!alterou) return m;
    mudou = true;
    return { ...m, technical_specs: specs };
  });
  return mudou ? novos : null;
}
