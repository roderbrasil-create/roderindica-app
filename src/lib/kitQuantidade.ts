// Quantidade de item de kit para exibir: inteiro sem casas ("14"), fracionado com vírgula ("2,5 MT"),
// e a unidade sempre que não for UN (o ERP traz 2,5 m de cabo no 9040 e 0,8 m de mangueira no 9056).
export function formatarQuantidadeKit(item: { quantity: number; unit?: string }): string {
  const q = Number(item.quantity);
  const n = Number.isFinite(q) && q > 0 ? q : 1;
  const txt = Number.isInteger(n) ? String(n) : n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
  return item.unit && item.unit !== 'UN' ? `${txt} ${item.unit}` : txt;
}
