// Faturamento que chega do CRM (evento pedido.faturado): quais itens contam para a comissão e
// quando NÃO dá para decidir sozinho. Parte pura; a conta em si é a de src/lib/calculoComissao.ts
// (a mesma do botão Faturar da tela de Indicações), então os dois caminhos nunca divergem.
import {
  calcularComissaoCentavos, emCentavos, itemComissionavel, mesDaComissao, papelComissionavel, taxaDoParceiro, temEstornoNoHistorico, temParceiroSemUid, UIDS_DE_SISTEMA,
  type ProdutoComissao,
} from './calculoComissao';

// ambiguo: o item veio com valor_total igual a valor e quantidade maior que 1 (não dá para saber se é unitário ou da linha)
export type ItemCrm = { code: string; name: string; quantity: number; base_value: number; ambiguo?: boolean };

// "1.234,56" (pt-BR) ou 1234.56
export function numeroDoCrm(v: any): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v ?? '').trim().replace(/[^\d.,-]/g, '');
  if (!s) return null;
  const n = s.includes(',') ? Number(s.replace(/\./g, '').replace(',', '.')) : Number(s);
  return Number.isFinite(n) ? n : null;
}

// Dia AAAA-MM-DD a partir de "2026-10-30", "30/10/2026" ou data ISO com hora.
export function diaDoCrm(v: any): string {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

// Itens como o CRM manda: [{codigo, nome, quantidade, valor}]. `valor` é o valor UNITÁRIO (o mesmo
// base_value da Central de Negociações); se vier `valor_total` e não houver unitário, divide pela quantidade.
export function normalizarItensCrm(raw: any): ItemCrm[] {
  if (!Array.isArray(raw)) return [];
  const out: ItemCrm[] = [];
  for (const i of raw) {
    if (!i || typeof i !== 'object') continue;
    const code = String(i.codigo ?? i.code ?? i.sku ?? '').trim().slice(0, 60);
    const name = String(i.nome ?? i.name ?? i.descricao ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!code && !name) continue;
    const qRaw = numeroDoCrm(i.quantidade ?? i.quantity ?? i.qtd);
    const quantity = qRaw !== null && qRaw > 0 ? qRaw : 1;
    let unit = numeroDoCrm(i.valor_unitario ?? i.valor ?? i.preco ?? i.value);
    if (unit === null) {
      const total = numeroDoCrm(i.valor_total);
      unit = total !== null ? total / quantity : 0;
    }
    const totalLinha = numeroDoCrm(i.valor_total);
    const ambiguo = quantity > 1 && totalLinha !== null && numeroDoCrm(i.valor_unitario ?? i.valor ?? i.preco ?? i.value) === totalLinha;
    out.push({ code, name, quantity, base_value: emCentavos(Math.max(unit, 0)), ...(ambiguo ? { ambiguo: true } : {}) });
  }
  return out;
}

export type ItemClassificado = ItemCrm & { is_commissionable?: boolean; regra: 'excluido' | 'catalogo' | 'indicacao' | 'sem_regra' };

// Regra do item, nesta ordem:
//  1. kit 9000 ou serviço (frete, montagem, instalação...): fora, é a regra fixa de calculoComissao;
//  2. o vendedor já decidiu naquele código dentro desta indicação (commissioned_products);
//  3. o produto está no cadastro (registered_products): vale o campo is_commissionable dele
//     (ausente = comissionável, como a Central de Negociações já trata);
//  4. nada disso: SEM REGRA. Não inventamos.
export function classificarItem(
  item: ItemCrm,
  anteriores: { code?: string; is_commissionable?: boolean }[],
  catalogo: Record<string, { is_commissionable?: boolean }>,
): ItemClassificado {
  if (!itemComissionavel({ code: item.code, name: item.name })) return { ...item, is_commissionable: false, regra: 'excluido' };
  const ant = item.code ? (anteriores || []).find(a => a && String(a.code || '').trim() === item.code && typeof a.is_commissionable === 'boolean') : undefined;
  if (ant) return { ...item, is_commissionable: ant.is_commissionable, regra: 'indicacao' };
  const cat = item.code ? catalogo[item.code] : undefined;
  if (cat) return { ...item, is_commissionable: cat.is_commissionable !== false, regra: 'catalogo' };
  return { ...item, regra: 'sem_regra' };
}

export function classificarItensCrm(brutos: any, anteriores: { code?: string; is_commissionable?: boolean }[], catalogo: Record<string, { is_commissionable?: boolean }>): ItemClassificado[] {
  return normalizarItensCrm(brutos).map(i => classificarItem(i, anteriores, catalogo));
}

export type DecisaoFaturamento =
  | { tipo: 'ja_faturada' }
  | { tipo: 'conferencia'; motivos: string[]; itensSemRegra: string[]; itens: ItemClassificado[] }
  | { tipo: 'sem_comissao'; itens: ItemClassificado[] }
  | {
    tipo: 'comissao'; itens: ItemClassificado[]; taxa: number;
    calc: ReturnType<typeof calcularComissaoCentavos>; mes: { month: number; year: number };
    parceiroNome: string;
  };

// Estorno gravado na indicação OU só no histórico (estorno antigo): nunca ganha comissão nova por evento do CRM.
export function temEstorno(ind: any): boolean { return !!ind?.estornado_em || temEstornoNoHistorico(ind); }

export function decidirFaturamento(o: {
  ind: any;
  parceiro: any | null;            // cadastro do parceiro (users), se a indicação tem uid de pessoa
  itensBrutos: any;                // dados.itens do evento
  catalogo: Record<string, { is_commissionable?: boolean }>;
  comissaoExistente: boolean;      // commissions/{id} ou comissão antiga com indication_id
  totalPedido?: number | null;     // total do pedido, quando o CRM manda: soma dos itens - desconto + frete tem de bater
  desconto?: number | null;        // desconto do pedido, em campo separado
  frete?: number | null;           // frete do pedido, em campo separado
  entrega: string;                 // previsão de entrega (AAAA-MM-DD ou vazio)
  agora: Date;
}): DecisaoFaturamento {
  const { ind } = o;
  // Já faturada (pelo Indica ou por um evento anterior) ou com comissão: nada a recriar nem sobrescrever.
  if (ind.status === 'sold' || o.comissaoExistente) return { tipo: 'ja_faturada' };

  const itens = normalizarItensCrm(o.itensBrutos).map(i => classificarItem(i, ind.commissioned_products || [], o.catalogo));
  const motivos: string[] = [];
  const semRegra = itens.filter(i => i.regra === 'sem_regra').map(i => i.code || i.name);

  if (temEstorno(ind)) motivos.push('A indicação teve o faturamento estornado. A comissão não é recriada sozinha.');
  if (temParceiroSemUid(ind)) motivos.push('A indicação tem cara de parceiro, mas não está ligada ao cadastro dele.');

  const uid = String(ind.external_seller_uid || '');
  const comParceiro = !!uid && !UIDS_DE_SISTEMA.includes(uid);
  // Dinheiro: se o valor do item pode ser o total da linha, ou a soma não fecha com o total do pedido, a
  // comissão sairia errada. Conferência, sem comissão.
  if (itens.some(i => i.ambiguo)) motivos.push('Não dá para saber se o valor dos itens é unitário ou o total da linha.');
  const soma = emCentavos(itens.reduce((a, i) => a + i.base_value * i.quantity, 0));
  // itens x valor, menos `desconto`, mais `frete` (quando presentes), contra valor_total, com tolerância de R$ 0,05
  const esperado = soma - (o.desconto ?? 0) + (o.frete ?? 0);
  if (o.totalPedido !== undefined && o.totalPedido !== null && Math.abs(esperado - o.totalPedido) > 0.05) motivos.push('A soma dos itens (com desconto e frete) não bate com o total do pedido.');
  if (comParceiro && !o.parceiro) motivos.push('O parceiro ligado à indicação não existe mais no cadastro.');
  const recebeComissao = comParceiro && !!o.parceiro && papelComissionavel(o.parceiro.role);
  // Regra de item só importa quando há comissão a calcular; venda sem parceiro comissionável é só venda.
  if (recebeComissao) {
    if (!itens.length) motivos.push('O CRM não mandou itens no pedido faturado.');
    if (semRegra.length) motivos.push(`Itens sem regra de comissão: ${semRegra.join(', ')}.`);
  }

  const produtos: ProdutoComissao[] = itens.map(i => ({ code: i.code, name: i.name, quantity: i.quantity, base_value: i.base_value, is_commissionable: i.is_commissionable }));
  const taxa = taxaDoParceiro(o.parceiro);
  const calc = calcularComissaoCentavos(produtos, 0, taxa);
  if (recebeComissao && !motivos.length) {
    if (calc.baseBruta <= 0) motivos.push('Nenhum item do pedido conta para a comissão (a base daria zero).');
    else if (calc.valor <= 0) motivos.push('A comissão daria zero.');
  }

  if (motivos.length) return { tipo: 'conferencia', motivos, itensSemRegra: semRegra, itens };
  if (!recebeComissao) return { tipo: 'sem_comissao', itens };
  return { tipo: 'comissao', itens, taxa, calc, mes: mesDaComissao(o.entrega || undefined, o.agora), parceiroNome: o.parceiro?.name || ind.external_seller_name || 'Parceiro' };
}
