// "Próximo passo" da tela Meus ganhos (parceiro indicador). Função pura: recebe o dia de hoje
// e o mês de competência da comissão e devolve o texto, o selo e se mostra o botão da nota.
//
// Datas reais do sistema (server/relatoriosComissao.ts): o mês de competência é o mês em que a
// comissão é PAGA (mesDaComissao). No dia 1 desse mês sai o e-mail com o valor da nota, a nota
// vale até o dia 5 e o financeiro paga até o dia 7. Tudo no horário de Brasília.
import { diaEmBrasilia } from './calculoComissao';

export const DIA_LIMITE_NOTA = 5;
export const DIA_LIMITE_PAGAMENTO = 7;

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const nomeDoMes = (m: number) => MESES[m - 1] || '';

export type SituacaoComissao = 'sem_comissao' | 'aguardando_fechamento' | 'emitir_nota' | 'nota_atrasada' | 'aguardando_pagamento' | 'pago';

export interface EntradaProximoPasso {
  hoje?: Date;
  month: number;
  year: number;
  total: number;
  // status do extrato mensal (monthly_statements): waiting_nf, waiting_payment, paid. Outros valores
  // (in_progress, pending, vazio) contam como "ainda sem nota".
  status?: string | null;
  temNota?: boolean;
  paidAt?: string | null;
}

export interface ProximoPasso {
  situacao: SituacaoComissao;
  selo: string;
  legenda: string; // linha pequena do cartão preto
  texto: string;
  valorFormatado: string | null; // trecho do texto que a tela destaca em negrito
  botaoNota: boolean;
  tom: 'laranja' | 'verde' | 'neutro';
}

export const brl = (v: number) => `R$ ${(Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const aaaammdd = (y: number, m: number, d: number) => y * 10000 + m * 100 + d;

function dataPaga(paidAt?: string | null): string | null {
  if (!paidAt || paidAt === 'null') return null;
  const d = new Date(paidAt);
  if (isNaN(d.getTime())) return null;
  const [a, m, dia] = diaEmBrasilia(d).split('-');
  return `${dia}/${m}/${a}`;
}

export function proximoPassoComissao(e: EntradaProximoPasso): ProximoPasso {
  const hojeStr = diaEmBrasilia(e.hoje || new Date());
  const [ya, ma, da] = hojeStr.split('-').map(Number);
  const hoje = aaaammdd(ya, ma, da);
  const mes = nomeDoMes(e.month);

  if (!(e.total > 0) && e.status !== 'paid') {
    return {
      situacao: 'sem_comissao', selo: 'Sem comissão', legenda: 'Sem comissão',
      texto: 'Você ainda não tem comissão. Quando uma venda indicada por você for faturada, ela aparece aqui.',
      valorFormatado: null, botaoNota: false, tom: 'neutro',
    };
  }
  if (e.status === 'paid') {
    const data = dataPaga(e.paidAt);
    return {
      situacao: 'pago', selo: 'Pago', legenda: 'Pago',
      texto: data ? `Pago em ${data}` : 'Pago',
      valorFormatado: null, botaoNota: false, tom: 'verde',
    };
  }
  if (e.status === 'waiting_payment' || e.temNota) {
    return {
      situacao: 'aguardando_pagamento', selo: 'Aguardando pagamento', legenda: 'Aguardando pagamento',
      texto: `Nota recebida. O financeiro paga até o dia ${DIA_LIMITE_PAGAMENTO} de ${mes}.`,
      valorFormatado: null, botaoNota: false, tom: 'verde',
    };
  }
  const valor = brl(e.total);
  if (hoje < aaaammdd(e.year, e.month, 1)) {
    return {
      situacao: 'aguardando_fechamento', selo: 'Aguardando fechamento', legenda: 'Aguardando fechamento',
      texto: 'Aguarde o fechamento do mês para ter a soma das comissões das suas indicações. No dia 1 você recebe um e-mail com o valor da nota fiscal de serviço para emitir e carregar aqui.',
      valorFormatado: null, botaoNota: false, tom: 'laranja',
    };
  }
  if (hoje <= aaaammdd(e.year, e.month, DIA_LIMITE_NOTA)) {
    return {
      situacao: 'emitir_nota', selo: 'Emita sua nota fiscal', legenda: 'Falta enviar a nota',
      texto: `Emita a nota fiscal de serviço no valor de ${valor} até o dia ${DIA_LIMITE_NOTA} de ${mes} e carregue aqui para o financeiro fazer o seu pagamento.`,
      valorFormatado: valor, botaoNota: true, tom: 'laranja',
    };
  }
  return {
    situacao: 'nota_atrasada', selo: 'Envie a nota fiscal', legenda: 'Falta enviar a nota',
    texto: `O prazo da nota era dia ${DIA_LIMITE_NOTA}. Envie a nota assim que puder para o financeiro programar o pagamento.`,
    valorFormatado: null, botaoNota: true, tom: 'laranja',
  };
}

export interface PeriodoResumo { month: number; year: number; total: number; status?: string | null; temNota?: boolean; paidAt?: string | null }

// Qual mês o quadro "Próximo passo" do topo explica: o mais antigo que ainda não foi pago (o
// atrasado vem antes do futuro). Sem nenhum, o último pago; sem comissão nenhuma, nulo.
export function periodoEmFoco<T extends PeriodoResumo>(periodos: T[]): T | null {
  const comValor = periodos.filter(p => p.total > 0 || p.status === 'paid');
  if (comValor.length === 0) return null;
  const ordem = [...comValor].sort((a, b) => (a.year - b.year) || (a.month - b.month));
  const aberto = ordem.find(p => p.status !== 'paid');
  return aberto || ordem[ordem.length - 1];
}
