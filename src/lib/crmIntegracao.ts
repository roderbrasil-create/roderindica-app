// Integração Roder Indica <-> CRM do Roder Vision: parte PURA (sem Firebase, sem rede).
// O servidor (server/crmEntrada.ts, server/crmEventos.ts) e os testes usam este arquivo direto.
//
// Sentido A: o Indica manda cada indicação nova ao CRM (payload, quem pode ser enviada, fila com
// backoff). O sentido B (andamento que volta do CRM) está em src/lib/crmEventos.ts.
// Documentação: docs/integracao-crm.md

export const CRM_URL_PADRAO = 'https://roder-vision.lovable.app/api/public/hooks/crm-entrada';

// Status que o CRM precisa conhecer. 'sold', 'cancelled' e 'archived' não entram: venda fechada ou
// indicação morta não é lead para triar (decisão da carga inicial, ver docs/integracao-crm.md).
export const STATUS_ENVIAVEIS = ['pending', 'triagem', 'negotiating'];

export const MAX_TENTATIVAS_ENVIO = 10;
const ATRASO_BASE_MS = 60 * 1000; // 1 min, depois 2, 4, 8... até o teto
const ATRASO_TETO_MS = 6 * 60 * 60 * 1000;
// Quem está sendo enviado agora fica "reservado" por este tempo: dois processos do servidor (ou o
// laço e a carga inicial) não mandam a mesma indicação ao mesmo tempo.
export const RESERVA_ENVIO_MS = 3 * 60 * 1000;

export type ConfigCrm = {
  ativo: boolean;          // CRM_ATIVO=1: a virada
  url: string;             // CRM_URL (ou o padrão)
  chave: string;           // CRM_CHAVE: vai no cabeçalho x-roder-chave, nunca no código
  segredo: string;         // CRM_SEGREDO: valida os eventos que voltam
  ativoDesde: string | null; // data da virada: só indicações criadas depois dela entram no laço
  notificarEmail: string | null;
  urlValida: boolean;
};

function urlAceita(v: string): boolean {
  try {
    const u = new URL(v);
    if (u.protocol === 'https:') return true;
    // http só para teste local
    return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1');
  } catch { return false; }
}

const dataValida = (v?: any): v is string => typeof v === 'string' && !!v && !Number.isNaN(new Date(v).getTime());

export function lerConfigCrm(env: Record<string, string | undefined>, settings?: { ativo_desde?: string | null } | null): ConfigCrm {
  const url = String(env.CRM_URL || '').trim() || CRM_URL_PADRAO;
  const desdeEnv = String(env.CRM_ATIVO_DESDE || '').trim();
  const desde = dataValida(desdeEnv) ? new Date(desdeEnv).toISOString()
    : dataValida(settings?.ativo_desde) ? new Date(String(settings!.ativo_desde)).toISOString() : null;
  return {
    ativo: String(env.CRM_ATIVO || '').trim() === '1',
    url,
    chave: String(env.CRM_CHAVE || '').trim(),
    segredo: String(env.CRM_SEGREDO || ''),
    ativoDesde: desde,
    notificarEmail: String(env.CRM_NOTIFICAR_EMAIL || '').trim() || null,
    urlValida: urlAceita(url),
  };
}

// Carga inicial manual: não exige CRM_ATIVO (acontece ANTES da virada); só chave e endereço.
export const podeCargaAoCrm = (c: ConfigCrm) => !!c.chave && c.urlValida;
// Só envia com o interruptor ligado, com a chave e com um endereço aceitável.
export const podeEnviarAoCrm = (c: ConfigCrm) => c.ativo && !!c.chave && c.urlValida;
// Só aceita evento com o interruptor ligado e o segredo configurado.
export const podeReceberDoCrm = (c: ConfigCrm) => c.ativo && !!c.segredo;

// ---------- Backoff ----------
// tentativas = quantas já foram feitas (1 depois da primeira falha).
export function atrasoDaTentativa(tentativas: number): number {
  const n = Math.max(1, Math.floor(tentativas) || 1);
  return Math.min(ATRASO_BASE_MS * 2 ** (n - 1), ATRASO_TETO_MS);
}

export function planoDeFalha(tentativasAntes: number, agora: Date): { tentativas: number; desistiu: boolean; proxima: string | null } {
  const tentativas = (Number(tentativasAntes) || 0) + 1;
  if (tentativas >= MAX_TENTATIVAS_ENVIO) return { tentativas, desistiu: true, proxima: null };
  return { tentativas, desistiu: false, proxima: new Date(agora.getTime() + atrasoDaTentativa(tentativas)).toISOString() };
}

// ---------- Quem deve ser enviada ----------
const vazio = (v: any) => !String(v ?? '').trim();

// Comum ao laço e à carga: a indicação é um lead de verdade e ainda não foi enviada.
function baseEnviavel(ind: any): string | null {
  if (!ind) return 'inexistente';
  if (ind.crm_enviado_em) return 'ja_enviada';
  if (ind.crm_desistiu_em) return 'desistiu';
  if (!STATUS_ENVIAVEIS.includes(String(ind.status || ''))) return 'status_nao_envia';
  if (ind.creator_type === 'visitor') return 'conversa_do_consultor'; // início de atendimento do consultor digital, ainda não é indicação
  if (vazio(ind.client_name)) return 'sem_cliente';
  return null;
}

function reservada(ind: any, agora: Date): boolean {
  return dataValida(ind.crm_reservado_ate) && new Date(ind.crm_reservado_ate).getTime() > agora.getTime();
}

// Laço de 1 minuto: só indicações criadas DEPOIS da virada (o passado vai pela carga inicial).
export function motivoNaoEnviarNoLaco(ind: any, o: { ativoDesde: string | null; agora: Date }): string | null {
  const b = baseEnviavel(ind);
  if (b) return b;
  if (!o.ativoDesde) return 'sem_data_de_virada';
  if (!dataValida(ind.created_at)) return 'sem_data_de_criacao';
  if (new Date(ind.created_at).getTime() < new Date(o.ativoDesde).getTime()) return 'anterior_a_virada';
  if (reservada(ind, o.agora)) return 'reservada';
  if (dataValida(ind.crm_proxima_tentativa_em) && new Date(ind.crm_proxima_tentativa_em).getTime() > o.agora.getTime()) return 'aguardando_nova_tentativa';
  return null;
}

// Carga inicial: qualquer indicação aberta ainda não enviada, independente da data.
export function motivoNaoEnviarNaCarga(ind: any, o: { agora: Date }): string | null {
  const b = baseEnviavel(ind);
  if (b) return b;
  if (reservada(ind, o.agora)) return 'reservada';
  return null;
}

// Indicação que o CRM já tem (ou vai ter em instantes) e que por isso a triagem do Indica não deve
// distribuir sozinha (o robô de 4 horas úteis de server.ts).
export function triagemEhDoCrm(ind: any, c: Pick<ConfigCrm, 'ativo' | 'ativoDesde'>): boolean {
  if (!c.ativo) return false;
  if (ind?.crm_enviado_em) return true;
  if (ind?.crm_desistiu_em) return false;
  return !!c.ativoDesde && dataValida(ind?.created_at) && new Date(ind.created_at).getTime() >= new Date(c.ativoDesde).getTime();
}

// ---------- Payload ----------
const PLACEHOLDER = /^(n[ãa]o informad[oa]|n\/?a|a definir|-+)$/i;
const limpo = (v: any, max = 300) => {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  return !s || PLACEHOLDER.test(s) ? '' : s.slice(0, max);
};

// "Cidade - UF" é o formato que a tela de nova indicação grava
export function separarCidadeUf(local: any): { cidade: string; uf: string } {
  const s = limpo(local, 120);
  const m = s.match(/^(.*?)\s*[-/,]\s*([A-Za-z]{2})$/);
  if (m && m[1]) return { cidade: m[1].trim(), uf: m[2].toUpperCase() };
  return { cidade: s, uf: '' };
}

export function documentoSoDigitos(v: any): string {
  const d = String(v ?? '').replace(/\D/g, '');
  return d.length === 11 || d.length === 14 ? d : '';
}

function produtoDeInteresse(ind: any): string {
  const itens: any[] = Array.isArray(ind.items) ? ind.items : [];
  const nomes = itens
    .map(i => {
      const n = limpo(i?.product_name, 120);
      const q = Number(i?.quantity) || 1;
      return n ? (q > 1 ? `${q}x ${n}` : n) : '';
    })
    .filter(Boolean);
  if (nomes.length) return nomes.join(', ').slice(0, 400);
  return limpo(ind.product_name || ind.base_machine, 200);
}

function observacao(ind: any): string {
  const partes: string[] = [];
  const desc = String(ind.description ?? '').replace(/\r\n?/g, '\n').trim();
  if (desc) partes.push(desc);
  const maq = limpo(ind.base_machine, 120);
  if (maq && !/^a definir$/i.test(maq)) partes.push(`Máquina base: ${maq}${limpo(ind.machine_details, 200) ? ` (${limpo(ind.machine_details, 200)})` : ''}`);
  const o = ind.options || {};
  const extras = [o.complete_installation && 'instalação completa', o.kit_hydraulic && 'kit hidráulico', o.with_freight && 'com frete', o.only_equipment && 'só equipamento'].filter(Boolean);
  if (extras.length) partes.push(`Opções: ${extras.join(', ')}`);
  if (ind.is_export) partes.push(`Exportação${limpo(ind.export_country, 60) ? `: ${limpo(ind.export_country, 60)}` : ''}`);
  return partes.join('\n').slice(0, 3000);
}

export type ParceiroPayload = { id: string | null; nome: string; telefone: string; email: string };

export function montarPayloadIndicacao(
  ind: any,
  idIndicacao: string,
  parceiro: { name?: string; phone?: string; email?: string } | null | undefined,
  opcoes: { notificarEmail?: string | null; jaEmNegociacao?: boolean } = {},
) {
  const { cidade, uf } = separarCidadeUf(ind.client_location);
  const pessoa = limpo(ind.client_person_name, 160);
  const nomeCliente = limpo(ind.client_name, 160);
  let obs = observacao(ind);
  // Carga inicial: a indicação já estava sendo atendida no Indica. Avisa o CRM na própria observação
  // (o contrato não tem campo de status) para ninguém triar de novo.
  if (opcoes.jaEmNegociacao) {
    const quem = limpo(ind.internal_seller_name, 80);
    obs = `[Já estava em negociação no Roder Indica${quem ? ` com ${quem}` : ''}]\n${obs}`.trim();
  }
  const uid = limpo(ind.external_seller_uid, 128);
  const payload: Record<string, any> = {
    id_externo: String(idIndicacao),
    nome: pessoa || nomeCliente,
    empresa: limpo(ind.client_company_name || ind.company_name, 160) || nomeCliente,
    cnpj: documentoSoDigitos(ind.client_cnpj),
    telefone: limpo(ind.client_phone, 40),
    email: limpo(ind.client_email, 160),
    cidade,
    uf,
    produto: produtoDeInteresse(ind),
    observacao: obs,
    parceiro: {
      id: uid || null,
      nome: limpo(parceiro?.name, 160) || limpo(ind.external_seller_name, 160),
      telefone: limpo(parceiro?.phone, 40),
      email: limpo(parceiro?.email, 160) || limpo(ind.external_seller_email, 160),
    } as ParceiroPayload,
    criado_em: dataValida(ind.created_at) ? new Date(ind.created_at).toISOString() : new Date().toISOString(),
  };
  if (opcoes.notificarEmail) payload.notificar_email = opcoes.notificarEmail;
  return payload;
}
