// Observação do parceiro na linha do tempo da Central de Negociações.
// O texto que o parceiro digita na indicação (campo "description") é a descrição da necessidade,
// que também vai no e-mail ao vendedor. Aqui ele vira uma entrada própria do histórico, com o
// nome de quem escreveu e a data da indicação, sem depender de a entrada ter sido gravada:
// indicação antiga ganha a entrada só na exibição (derivada), e a gravada nunca duplica.

export const TIPO_OBSERVACAO_PARCEIRO = 'partner_note';
export const ROTULO_OBSERVACAO_PARCEIRO = 'Observação do parceiro';

export interface EntradaHistorico {
  id: string;
  type: string;
  content: string;
  author_name: string;
  created_at: string;
  attachments?: { name: string; url: string }[];
}

interface IndicacaoMin {
  id?: string;
  description?: string | null;
  created_at?: string | null;
  created_by_name?: string | null;
  external_seller_name?: string | null;
  negotiation_history?: EntradaHistorico[] | null;
}

// Chave estável: a mesma indicação gera sempre o mesmo id, então gravar duas vezes não duplica.
export function idObservacaoParceiro(indicacaoId?: string | null): string {
  return `obs-parceiro-${indicacaoId || 'sem-id'}`;
}

const dataValida = (v?: string | null) => !!v && !Number.isNaN(new Date(v).getTime());

// Quem escreveu: quem criou a indicação (o parceiro). Cai para o indicador quando o criador não veio.
export function autorObservacaoParceiro(ind: IndicacaoMin): string {
  const nome = (ind.created_by_name || '').trim() || (ind.external_seller_name || '').trim();
  return nome || 'Parceiro indicador';
}

export function entradaObservacaoParceiro(ind: IndicacaoMin | null | undefined): EntradaHistorico | null {
  if (!ind) return null;
  const texto = String(ind.description ?? '').replace(/\r\n?/g, '\n').trim();
  if (!texto) return null;
  return {
    id: idObservacaoParceiro(ind.id),
    type: TIPO_OBSERVACAO_PARCEIRO,
    author_name: autorObservacaoParceiro(ind),
    // sem data na indicação a entrada ainda aparece, mas vai para o começo (data vazia ordena primeiro)
    created_at: dataValida(ind.created_at) ? String(ind.created_at) : '',
    content: texto,
    attachments: [],
  };
}

export function temObservacaoGravada(historico: EntradaHistorico[] | null | undefined, indicacaoId?: string | null): boolean {
  const id = idObservacaoParceiro(indicacaoId);
  return (historico || []).some(e => e && (e.id === id || e.type === TIPO_OBSERVACAO_PARCEIRO));
}

// Para gravar: devolve a entrada só se ainda não existe no histórico (idempotente).
export function entradaParaGravar(ind: IndicacaoMin | null | undefined): EntradaHistorico | null {
  const e = entradaObservacaoParceiro(ind);
  if (!e || !ind) return null;
  return temObservacaoGravada(ind.negotiation_history, ind.id) ? null : e;
}

const instante = (e: EntradaHistorico) => (dataValida(e.created_at) ? new Date(e.created_at).getTime() : 0);

// Para exibir: histórico gravado mais a observação derivada quando não há gravada.
// Ordem cronológica crescente, estável (empate mantém a ordem original).
export function historicoComObservacao(ind: IndicacaoMin | null | undefined): EntradaHistorico[] {
  const gravado = ((ind && ind.negotiation_history) || []).filter(Boolean);
  const derivada = ind ? entradaParaGravar(ind) : null;
  const todos = derivada ? [...gravado, derivada] : [...gravado];
  return todos
    .map((e, i) => ({ e, i }))
    .sort((a, b) => instante(a.e) - instante(b.e) || a.i - b.i)
    .map(x => x.e);
}

// Texto para a tela em HTML seguro (quando alguém precisar de innerHTML): escapa e mantém quebras de linha.
export function textoSeguroComQuebras(texto: string): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    .replace(/\r\n?|\n/g, '<br>');
}
