// Fase 2 da integração: atualizações do parceiro (texto, áudio, fotos) e comissão, do Indica para o CRM.
// Parte pura; o envio está em server/crmEntrada.ts. Documentação: docs/integracao-crm.md
import { AUTOR_CRM } from './crmEventos';
import { parceiroEhPessoa } from './crmEventos';
import { diaDoCrm } from './crmFaturamento';

export const MAX_ANEXOS = 10;
export const MAX_ANEXO_BYTES = 20 * 1024 * 1024;

const norm = (v: any) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const ms = (v: any) => { const t = Date.parse(String(v ?? '')); return Number.isFinite(t) ? t : NaN; };

// ---------- Atualização do parceiro ----------
// Só vai ao CRM nota que o PARCEIRO escreveu na linha do tempo (type note ou whatsapp) depois do envio da
// indicação. Quem escreveu é provado por author_uid === external_seller_uid (gravado pelo app a partir de 24/10/2026).
// Nota antiga, sem author_uid, só vale se o nome bater EXATAMENTE com o do parceiro. Nunca vão: entradas do
// próprio CRM (sem eco), a observação da abertura, entradas automáticas do sistema e notas de outras pessoas.
export const TIPOS_DE_NOTA_DO_PARCEIRO = ['note', 'whatsapp'];

export type ClasseEntrada = 'enviar' | 'ignorar' | 'fora';

export function classificarEntrada(ind: any, e: any): ClasseEntrada {
  if (!e || typeof e !== 'object' || !e.id) return 'fora';
  if (e.author_name === AUTOR_CRM || String(e.id).startsWith('crm-')) return 'fora';
  if (String(e.id).startsWith('obs-parceiro-') || e.id === 'initial_virtual') return 'fora';
  if (!TIPOS_DE_NOTA_DO_PARCEIRO.includes(String(e.type))) return 'fora';
  if (!(ms(e.created_at) > ms(ind.crm_enviado_em))) return 'fora';
  if (!parceiroEhPessoa(ind)) return 'fora';
  if (!(String(e.content ?? '').trim() || (Array.isArray(e.attachments) && e.attachments.length))) return 'fora';
  const dono = String(ind.external_seller_uid);
  if (e.author_uid) return String(e.author_uid) === dono ? 'enviar' : 'ignorar';
  const nome = String(ind.external_seller_name ?? '').trim();
  return nome && String(e.author_name ?? '').trim() === nome ? 'enviar' : 'ignorar';
}

export const ehEntradaDoParceiro = (ind: any, e: any) => classificarEntrada(ind, e) === 'enviar';

const conjunto = (v: any) => new Set<string>(Array.isArray(v) ? v.map(String) : []);

export function entradasPendentesDoParceiro(ind: any): any[] {
  const fora = new Set([...conjunto(ind.crm_atualizacoes_enviadas), ...conjunto(ind.crm_atualizacoes_desistiu), ...conjunto(ind.crm_atualizacoes_ignoradas)]);
  const hist: any[] = Array.isArray(ind.negotiation_history) ? ind.negotiation_history : [];
  return hist.filter(e => classificarEntrada(ind, e) === 'enviar' && !fora.has(String(e.id)));
}

// Notas candidatas que não são do parceiro: recebem a marca crm_atualizacoes_ignoradas para não serem reavaliadas.
export function entradasParaIgnorar(ind: any): string[] {
  const marcadas = conjunto(ind.crm_atualizacoes_ignoradas);
  const hist: any[] = Array.isArray(ind.negotiation_history) ? ind.negotiation_history : [];
  return hist.filter(e => classificarEntrada(ind, e) === 'ignorar' && !marcadas.has(String(e.id))).map(e => String(e.id));
}

// id estável derivado do id da entrada: reenviar a mesma entrada nunca duplica no CRM
export const idMensagemCrm = (indId: string, entradaId: string) => `${indId}:${entradaId}`;

export function tipoDoAnexo(a: { name?: string; url?: string; tipo?: string }): 'audio' | 'imagem' | 'arquivo' {
  const nome = String(a?.name || '').toLowerCase();
  const url = String(a?.url || '').split('?')[0].toLowerCase();
  const alvo = `${nome} ${url}`;
  if (/^data:audio\//.test(String(a?.url || '')) || /\.(webm|mp3|m4a|ogg|oga|wav|aac|opus|amr)(\s|$)/.test(alvo) || /(^|[^a-z])(audio|áudio)/.test(nome)) return 'audio';
  if (/^data:image\//.test(String(a?.url || '')) || /\.(jpe?g|png|gif|webp|heic|heif|bmp)(\s|$)/.test(alvo)) return 'imagem';
  return 'arquivo';
}

// URL do Firebase Storage (com token) -> bucket e caminho do arquivo, para gerar uma URL assinada nova.
export function referenciaStorage(url: string): { bucket: string; caminho: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'firebasestorage.googleapis.com') {
      const m = u.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (m) return { bucket: m[1], caminho: decodeURIComponent(m[2]) };
    }
    if (u.hostname === 'storage.googleapis.com') {
      const [, bucket, ...resto] = u.pathname.split('/');
      if (bucket && resto.length) return { bucket, caminho: decodeURIComponent(resto.join('/')) };
    }
  } catch { /* url inválida */ }
  return null;
}

export type AnexoCrm = { url: string; tipo: 'audio' | 'imagem' | 'arquivo'; nome: string };

export function montarAtualizacao(ind: any, indId: string, e: any, anexos: AnexoCrm[], observacoes: string[] = []) {
  const texto = [String(e.content ?? '').trim(), ...observacoes].filter(Boolean).join('\n').slice(0, 5000);
  return {
    tipo: 'atualizacao' as const,
    id_externo: indId,
    id_mensagem: idMensagemCrm(indId, String(e.id)),
    texto,
    autor: String(e.author_name || ind.external_seller_name || 'Parceiro').slice(0, 120),
    criado_em: Number.isFinite(ms(e.created_at)) ? new Date(e.created_at).toISOString() : new Date().toISOString(),
    anexos: anexos.slice(0, MAX_ANEXOS),
  };
}

// ---------- Comissão ----------
const d2 = (n: number) => String(n).padStart(2, '0');
// A comissão do mês M é paga em M (relatório do dia 1, nota até o dia 5, pagamento até o dia 7)
export const previsaoDePagamento = (month: number, year: number) => `${year}-${d2(month)}-07`;

const num = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const arred = (n: number) => Math.round(n * 100) / 100;

// Base comissionável líquida de desconto, percentual (pontos percentuais) e valor, ou null se não dá para saber.
function baseEPercentual(c: any): { base: number; pct: number; valor: number } | null {
  const valor = num(c.value);
  if (!(valor >= 0)) return null;
  const taxa = num(c.rate_applied);
  const coerente = (b: number) => b > 0 && taxa > 0 && Math.abs((b * taxa) / 100 - valor) <= 0.01;
  let base = num(c.base_value_used);
  if (!(base > 0)) {
    // outros campos só valem se baterem com a taxa e o valor da comissão; senão deriva do valor, ou espera
    base = [num(c.commissionable_value), num(c.base_commission_value)].find(coerente) || 0;
    if (!(base > 0) && taxa > 0 && valor > 0) base = arred(valor / (taxa / 100));
  }
  if (!(base > 0)) return null;
  let pct = taxa;
  if (!(pct > 0)) pct = valor > 0 ? arred((valor / base) * 100) : 0;
  if (!(pct > 0)) return null;
  return { base: arred(base), pct, valor: arred(valor) };
}

// Retorna null quando ainda não dá para mandar (sem número de pedido, sem base ou sem percentual conhecido):
// a rotina espera e tenta de novo, em vez de mandar zero ao CRM.
// `percentual` vai em PONTOS percentuais (2 = 2%); `valor_equipamento` é a base comissionável LÍQUIDA de desconto
// usada no cálculo, então valor_comissao = valor_equipamento x percentual / 100.
// `pedidoEnviado`: número do primeiro envio; se existir, é ele que vai (o CRM trata por id_externo + pedido_numero).
export function montarComissao(c: any, commId: string, ind: any, pedidoEnviado?: string) {
  const pedido = String(pedidoEnviado || ind?.sale_order_number || '').trim();
  if (!pedido) return null;
  const bp = baseEPercentual(c);
  if (!bp) return null;
  return {
    tipo: 'comissao' as const,
    id_externo: String(c.indication_id || commId),
    pedido_numero: pedido,
    // só o parceiro e o pedido: nada de vendedor interno nem de desconto
    parceiro: { id: String(c.external_seller_uid || ''), nome: String(c.external_seller_name || ind?.external_seller_name || '') },
    valor_equipamento: bp.base,
    percentual: bp.pct,
    valor_comissao: bp.valor,
    calculada_em: Number.isFinite(ms(c.created_at)) ? new Date(c.created_at).toISOString() : new Date().toISOString(),
    previsao_pagamento: c.month && c.year ? previsaoDePagamento(Number(c.month), Number(c.year)) : '',
  };
}

// Dados da venda e da comissão que a carga inicial leva para as indicações VENDIDAS (histórico do relatório do CRM).
// Campo ausente é omitido (nada de null nem 0 inventado). Nomes finais: pedido_numero, data_pedido, data_faturamento,
// previsao_entrega, valor_total, itens [{codigo, nome, quantidade, valor}] e comissao {valor_equipamento, percentual,
// valor_comissao, calculada_em, previsao_pagamento, paga_em}.
export function montarVendaParaCarga(ind: any, comissao?: any | null): Record<string, any> {
  const out: Record<string, any> = {};
  const pedido = String(ind?.sale_order_number ?? '').trim();
  if (pedido) out.pedido_numero = pedido;
  const dataPedido = diaDoCrm(ind?.sale_order_date) || diaDoCrm(ind?.sale_date);
  if (dataPedido) out.data_pedido = dataPedido;
  const fat = diaDoCrm(ind?.crm_faturado_em) || diaDoCrm(ind?.sale_date);
  if (fat) out.data_faturamento = fat;
  const entrega = diaDoCrm(ind?.delivery_date);
  if (entrega) out.previsao_entrega = entrega;
  const total = num(ind?.sale_value);
  if (total > 0) out.valor_total = arred(total);
  const prods: any[] = Array.isArray(ind?.commissioned_products) && ind.commissioned_products.length ? ind.commissioned_products : [];
  const brutos = prods.length
    ? prods.map(p => ({ codigo: p.code, nome: p.name, quantidade: p.quantity, valor: p.base_value }))
    : (Array.isArray(ind?.items) ? ind.items : []).map((p: any) => ({ codigo: p.code, nome: p.product_name, quantidade: p.quantity, valor: p.price }));
  const itens = brutos
    .filter(i => String(i.nome ?? '').trim() && num(i.valor) > 0)
    .map(i => ({ ...(String(i.codigo ?? '').trim() ? { codigo: String(i.codigo).trim() } : {}), nome: String(i.nome).trim().slice(0, 200), quantidade: num(i.quantidade) > 0 ? num(i.quantidade) : 1, valor: arred(num(i.valor)) }));
  if (itens.length) out.itens = itens;
  const bp = comissao ? baseEPercentual(comissao) : null;
  if (comissao && bp) {
    const c: Record<string, any> = { valor_equipamento: bp.base, percentual: bp.pct, valor_comissao: bp.valor };
    if (Number.isFinite(ms(comissao.created_at))) c.calculada_em = new Date(comissao.created_at).toISOString();
    if (comissao.month && comissao.year) c.previsao_pagamento = previsaoDePagamento(Number(comissao.month), Number(comissao.year));
    if (comissao.status === 'paid') { const q = comissao.paid_at || comissao.updated_at; if (Number.isFinite(ms(q))) c.paga_em = new Date(q).toISOString(); }
    out.comissao = c;
  }
  return out;
}

// Resumo do que o CRM recebeu: se a comissão for corrigida depois, a assinatura muda e a rotina reenvia
// o tipo "comissao" atualizado (mesmo id_externo + pedido_numero).
export const assinaturaDaComissao = (p: { pedido_numero: string; valor_equipamento: number; percentual: number; valor_comissao: number }) =>
  `${p.pedido_numero}|${p.valor_equipamento}|${p.percentual}|${p.valor_comissao}`;

export function montarComissaoPaga(c: any, commId: string, ind: any, pedidoEnviado?: string) {
  const pedido = String(pedidoEnviado || ind?.sale_order_number || '').trim();
  if (!pedido) return null;
  const quando = c.paid_at || c.updated_at;
  return {
    tipo: 'comissao_paga' as const,
    id_externo: String(c.indication_id || commId),
    pedido_numero: pedido,
    paga_em: Number.isFinite(ms(quando)) ? new Date(quando).toISOString() : new Date().toISOString(),
  };
}
