// Fase 2 da integração: atualizações do parceiro (texto, áudio, fotos) e comissão, do Indica para o CRM.
// Parte pura; o envio está em server/crmEntrada.ts. Documentação: docs/integracao-crm.md
import { AUTOR_CRM } from './crmEventos';
import { parceiroEhPessoa } from './crmEventos';

export const MAX_ANEXOS = 10;
export const MAX_ANEXO_BYTES = 20 * 1024 * 1024;

const norm = (v: any) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const ms = (v: any) => { const t = Date.parse(String(v ?? '')); return Number.isFinite(t) ? t : NaN; };

// ---------- Atualização do parceiro ----------
// Entrada do parceiro na linha do tempo, feita DEPOIS de a indicação ir ao CRM. Fora: o que veio do próprio
// CRM (sem eco), a observação inicial (já vai na observacao da indicação) e a entrada virtual de abertura.
export function ehEntradaDoParceiro(ind: any, e: any): boolean {
  if (!e || typeof e !== 'object' || !e.id) return false;
  if (e.author_name === AUTOR_CRM || String(e.id).startsWith('crm-')) return false;
  if (String(e.id).startsWith('obs-parceiro-') || e.type === 'partner_note' || e.id === 'initial_virtual') return false;
  if (!(ms(e.created_at) > ms(ind.crm_enviado_em))) return false;
  if (!parceiroEhPessoa(ind)) return false;
  if (e.author_role === 'external_seller') return true;
  if (e.author_uid && String(e.author_uid) === String(ind.external_seller_uid)) return true;
  return !!e.author_name && !!ind.external_seller_name && norm(e.author_name) === norm(ind.external_seller_name);
}

export function entradasPendentesDoParceiro(ind: any): any[] {
  const enviadas = new Set<string>(Array.isArray(ind.crm_atualizacoes_enviadas) ? ind.crm_atualizacoes_enviadas : []);
  const desistiu = new Set<string>(Array.isArray(ind.crm_atualizacoes_desistiu) ? ind.crm_atualizacoes_desistiu : []);
  const hist: any[] = Array.isArray(ind.negotiation_history) ? ind.negotiation_history : [];
  return hist.filter(e => ehEntradaDoParceiro(ind, e) && !enviadas.has(String(e.id)) && !desistiu.has(String(e.id))
    && (String(e.content ?? '').trim() || (Array.isArray(e.attachments) && e.attachments.length)));
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

export function montarComissao(c: any, commId: string, ind: any) {
  const idInd = String(c.indication_id || commId);
  return {
    tipo: 'comissao' as const,
    id_externo: idInd,
    pedido_numero: String(ind?.sale_order_number ?? ''),
    // só o parceiro e o pedido: nada de vendedor interno nem de desconto
    parceiro: { id: String(c.external_seller_uid || ''), nome: String(c.external_seller_name || ind?.external_seller_name || '') },
    valor_equipamento: Number(c.gross_commissionable_value ?? c.base_value_used) || 0,
    percentual: Number(c.rate_applied) || 0,
    valor_comissao: Number(c.value) || 0,
    calculada_em: Number.isFinite(ms(c.created_at)) ? new Date(c.created_at).toISOString() : new Date().toISOString(),
    previsao_pagamento: c.month && c.year ? previsaoDePagamento(Number(c.month), Number(c.year)) : '',
  };
}

export function montarComissaoPaga(c: any, commId: string, ind: any) {
  const quando = c.paid_at || c.updated_at;
  return {
    tipo: 'comissao_paga' as const,
    id_externo: String(c.indication_id || commId),
    pedido_numero: String(ind?.sale_order_number ?? ''),
    paga_em: Number.isFinite(ms(quando)) ? new Date(quando).toISOString() : new Date().toISOString(),
  };
}
