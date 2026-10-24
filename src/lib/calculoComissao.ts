// Cálculo da comissão do parceiro indicador, num lugar só.
// Antes a conta morava só dentro de handleFinishSale (src/pages/Indications.tsx). O servidor
// precisa da MESMA conta para gerar a comissão de uma venda que ficou sem ela (diagnóstico de
// comissão, server/diagnosticoComissao.ts): duas cópias da conta acabam divergindo, e aí o
// parceiro recebe um valor diferente conforme o caminho por onde a comissão nasceu.
// Sem import do Firebase de propósito: o servidor e os testes usam este arquivo direto.

// Perfis da equipe Roder: quem tem um destes papéis não recebe comissão de indicação.
export const PAPEIS_SEM_COMISSAO = ['admin', 'manager', 'internal_seller', 'triagem', 'financial', 'marketing', 'fiscal', 'vendedor_padrao'];

// Taxa usada só quando o cadastro do parceiro não tem taxa própria. Nunca mostrar na tela.
const TAXA_SEM_CADASTRO = 2;

export type ProdutoComissao = { code?: string; name?: string; quantity?: number; base_value?: number; is_commissionable?: boolean };

const RE_SERVICO = /m[ãa]o\s*de\s*obra|frete|transporte|instala[çc][ãa]o|montagem|entrega\s*t[ée]cnica|deslocamento|kit\s+de\s+instala/i;

// Kit de instalação (código 9000...) e serviço (frete, montagem, instalação) não entram na base.
export function itemComissionavel(p: ProdutoComissao): boolean {
  const is9000 = !!p.code && String(p.code).trim().startsWith('9000');
  const isService = RE_SERVICO.test(p.name || '');
  return p.is_commissionable !== false && !is9000 && !isService;
}

export function baseBrutaDosProdutos(produtos: ProdutoComissao[] | undefined | null): number {
  return (produtos || []).reduce((acc, p) => acc + (itemComissionavel(p) ? (p.base_value || 0) * (p.quantity || 0) : 0), 0);
}

export function papelComissionavel(papel: string | undefined | null): boolean {
  return !PAPEIS_SEM_COMISSAO.includes(papel || 'external_seller');
}

// A taxa é a do cadastro do parceiro (regra de negócio: fixa pelo perfil do indicador).
export function taxaDoParceiro(parceiro: { commission_rate?: number | null } | null | undefined): number {
  const t = parceiro?.commission_rate;
  return t !== undefined && t !== null ? Number(t) : TAXA_SEM_CADASTRO;
}

export type ResultadoComissao = {
  baseBruta: number; // soma dos produtos comissionáveis
  desconto: number; // desconto abatido (nunca passa da base)
  descontoPct: number;
  base: number; // base depois do desconto
  taxa: number;
  valor: number; // comissão
};

// Desconto concedido sai da base ANTES da taxa; nunca passa da própria base.
export function calcularComissao(produtos: ProdutoComissao[] | undefined | null, descontoReais: number, taxa: number): ResultadoComissao {
  const baseBruta = baseBrutaDosProdutos(produtos);
  const desconto = Math.min(Math.max(Number(descontoReais) || 0, 0), baseBruta);
  const descontoPct = baseBruta > 0 ? (desconto / baseBruta) * 100 : 0;
  const base = baseBruta - desconto;
  return { baseBruta, desconto, descontoPct, base, taxa, valor: base * (taxa / 100) };
}

// Mês/ano da comissão (o mês em que ela é paga): o mês seguinte para faturamento novo, ou o mês
// corrente quando a entrega já aconteceu (entrega retroativa).
// Tudo no horário de Brasília: o servidor roda em UTC, e às 21h do último dia do mês ele já está
// no mês seguinte. A comissão faturada na noite de 31/10 caía em 12 em vez de 11.
const FUSO_BR = 'America/Sao_Paulo';
export function diaEmBrasilia(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: FUSO_BR }); // AAAA-MM-DD
}
// "2026-10-31" é o dia como está; data com hora ("2026-11-01T02:00:00Z") vira o dia em Brasília
function diaDaEntrega(v: string): string | null {
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : diaEmBrasilia(d);
}
export function mesDaComissao(dataEntrega: string | undefined | null, agora: Date = new Date()): { month: number; year: number } {
  const hoje = diaEmBrasilia(agora);
  const [anoAtual, mesAtual] = hoje.split('-').map(Number);
  if (dataEntrega) {
    const dia = diaDaEntrega(dataEntrega);
    // entrega já passou (o dia dela acabou): mês corrente
    if (dia && dia < hoje) return { month: mesAtual, year: anoAtual };
  }
  return mesAtual === 12 ? { month: 1, year: anoAtual + 1 } : { month: mesAtual + 1, year: anoAtual };
}

// uids gravados em external_seller_uid que não são de pessoa nenhuma
export const UIDS_DE_SISTEMA = ['client_referral', 'direct_factory', 'public_request', 'anonymous'];

// nomes que o próprio app grava quando NÃO há parceiro (site, venda direta, indicação de cliente)
const NOME_SEM_PARCEIRO = /^(solicita[çc][ãa]o direta|venda direta|cliente:)|\(f[áa]brica\)\s*$/i;

// A indicação tem cara de ter vindo de um parceiro (nome ou e-mail de indicador gravado), mas sem o
// uid dele? Serve para não deixar faturar uma venda de parceiro que não geraria comissão nenhuma.
export function temParceiroSemUid(ind: any): boolean {
  if (!ind || String(ind.external_seller_uid || '').trim()) return false;
  const nome = String(ind.external_seller_name || ind.indicator_name || '').trim();
  if (nome && NOME_SEM_PARCEIRO.test(nome)) return false;
  return !!(nome || String(ind.external_seller_email || '').trim() || ind.indicator_uid);
}

// O estorno só vale como bloqueio se for mais recente que o último faturamento: venda refaturada
// depois do estorno pode ganhar a comissão que faltar.
export const temEstornoNoHistorico = (ind: any) => {
  const h: any[] = Array.isArray(ind?.negotiation_history) ? ind.negotiation_history : [];
  const ultimo = (re: RegExp) => h.reduce((m, x) => re.test(String(x?.content || '')) ? Math.max(m, Date.parse(x?.created_at) || 0) : m, -Infinity);
  const estorno = ultimo(/^ESTORNO DE FATURAMENTO/i);
  if (estorno === -Infinity) return false;
  const faturou = ultimo(/^VENDA FINALIZADA/i);
  return !(faturou !== -Infinity && faturou > estorno);
};


// Centavos: o caminho do CRM arredonda cada valor monetário a 2 casas (base 166809 x 2% = 3336.18, e não
// 3336.1800000000003). A tela de Indicações continua com calcularComissao sem arredondar, para não
// mudar nenhum número que já existe; este é um acréscimo, não uma troca.
export const emCentavos = (v: number) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
export function calcularComissaoCentavos(produtos: ProdutoComissao[] | undefined | null, descontoReais: number, taxa: number): ResultadoComissao {
  const c = calcularComissao(produtos, descontoReais, taxa);
  const baseBruta = emCentavos(c.baseBruta);
  const desconto = emCentavos(c.desconto);
  const base = emCentavos(baseBruta - desconto);
  return { ...c, baseBruta, desconto, base, valor: emCentavos(base * (taxa / 100)) };
}
