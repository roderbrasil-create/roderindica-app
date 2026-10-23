// Vínculo do parceiro com suas indicações e comissões, em lógica pura (sem Firebase).
// A tela inicial, Indicações e Comissões do parceiro leem pelo uid do PERFIL mostrado (no
// "Ver como" é o do parceiro, nunca o do administrador logado). Venda ligada a outro código
// (parceiro com dois cadastros) não aparece em nenhuma delas: o conserto é "Trocar Indicador" ou o
// Diagnóstico de comissão, que levam indicação e comissão juntas.

// uid que as telas do parceiro usam nas buscas: sempre o do perfil mostrado.
export function uidDasTelasDoParceiro(perfilMostrado: { uid?: string } | null | undefined): string {
  return String(perfilMostrado?.uid || '').trim();
}

// junta listas de documentos sem repetir o mesmo id (a primeira ocorrência vale)
export function unirPorId<T extends { id?: string }>(...listas: Array<T[] | null | undefined>): T[] {
  const vistos = new Set<string>();
  const saida: T[] = [];
  for (const lista of listas) {
    for (const item of lista || []) {
      const id = String(item?.id ?? '');
      if (!id || vistos.has(id)) continue;
      vistos.add(id);
      saida.push(item);
    }
  }
  return saida;
}

// "A receber": tudo que ainda não foi pago, de qualquer mês (inclusive o próximo, mês de pagamento)
export function somaAReceber(comissoes: Array<{ value?: any; status?: string }> | null | undefined): number {
  const total = (comissoes || []).filter(c => c.status !== 'paid').reduce((s, c) => s + (Number(c.value) || 0), 0);
  return Math.round(total * 100) / 100;
}
