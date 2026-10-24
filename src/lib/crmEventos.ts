// Andamento que volta do CRM para o Indica: o que cada evento FAZ na indicação.
// Tudo aqui é função pura (recebe a indicação como está e devolve o plano do que gravar); quem
// grava é server/crmEventos.ts, dentro de uma transação. Documentação: docs/integracao-crm.md
//
// Regras que valem para todos os eventos:
//  - o texto que o parceiro lê vai para negotiation_history com autor "CRM Roder" e a data do evento,
//    no mesmo formato que a Central de Negociações e a tela do parceiro já leem;
//  - evento que faria o status regredir (aceita depois de venda, etapa numa indicação cancelada...)
//    é IGNORADO e só vai para o log (coleção crm_eventos);
//  - nunca se grava nem se mostra texto que cite outro parceiro, percentual de comissão ou contato;
//  - a comissão só nasce quando TODOS os itens têm regra (src/lib/crmFaturamento.ts); senão a
//    indicação fica "aguardando conferência" e a equipe decide.
import { emCentavos } from './calculoComissao';
import { classificarItensCrm, decidirFaturamento, diaDoCrm, numeroDoCrm, type DecisaoFaturamento, type ItemClassificado } from './crmFaturamento';

export const EVENTOS_CRM = [
  'indicacao.recebida', 'indicacao.aceita', 'indicacao.recusada', 'indicacao.vinculada', 'negocio.etapa',
  'proposta.enviada', 'pedido.lancado', 'pedido.faturado', 'negocio.ganho', 'negocio.perdido',
] as const;
export type NomeEventoCrm = typeof EVENTOS_CRM[number];

export type EventoCrm = { id: string; evento: string; em?: string; id_externo: string; parceiro_id?: string | null; dados?: any };

export const AUTOR_CRM = 'CRM Roder';
export const SESSENTA_DIAS_MS = 60 * 24 * 60 * 60 * 1000;

export type EntradaHistoricoCrm = { id: string; type: string; content: string; author_name: string; created_at: string; attachments: [] };
export type NotificacaoCrm = { para: 'parceiro' | 'vendedora' | 'gestao'; titulo: string; mensagem: string; tipo: 'info' | 'success' | 'warning' };

export type Plano = {
  resultado: 'aplicado' | 'ignorado';
  motivo?: string;
  campos: Record<string, any>;
  historico: EntradaHistoricoCrm[];
  notificacoes: NotificacaoCrm[];
  comissao?: Record<string, any>;     // documento commissions/{id da indicação}
  conferencia?: { motivos: string[]; itensSemRegra: string[] };
  // só para o log interno (crm_eventos): o que este evento substituiu
  substituiu?: Record<string, any>;
};

export type ContextoEvento = {
  agora: Date;
  parceiro: any | null;
  vendedora: { uid?: string | null; name: string; email?: string | null } | null;
  nomesOutrosParceiros: string[];
  catalogo: Record<string, { is_commissionable?: boolean }>;
  comissaoExistente: boolean;
};

// ---------- Status ----------
// 0 = ainda na triagem; 1 = em negociação; 2 = vendida; 9 = encerrada (cancelada/arquivada)
export function nivelDoStatus(status: any): number {
  const s = String(status || '');
  if (s === 'negotiating') return 1;
  if (s === 'sold') return 2;
  if (s === 'cancelled' || s === 'archived' || s === 'lost') return 9;
  return 0; // pending, triagem, new, vazio
}

// ---------- Texto seguro para o parceiro ----------
const normalizar = (v: any) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const CITA_PARCEIRO = /\b(parceiros?|indicadors?|indicadas?|indicados?|indicou|indicacao\s+d[eao]|representantes?|outra\s+pessoa|outro\s+vendedor)\b/;
const DADO_INTERNO = /@|comiss|%|r\$|\d{8,}/;

const PALAVRAS_COMUNS = new Set(['ltda', 'eireli', 'agro', 'agricola', 'florestal', 'madeiras', 'madeireira', 'servicos', 'transportes', 'comercio', 'maquinas', 'equipamentos', 'empresa', 'grupo', 'industria', 'construtora', 'locadora', 'cliente', 'preco', 'prazo']);

export const MOTIVO_GENERICO_RECUSA = 'Indicação não aceita pela Roder.';
export const MOTIVO_GENERICO_PERDA = 'Negócio não concluído.';

// Devolve o texto curto e limpo, ou o generico se ele puder citar outro parceiro (palavras como
// "parceiro", "indicado por", o nome de qualquer outro parceiro cadastrado), trouxer e-mail,
// telefone, valor ou comissão.
export function textoSeguroParaParceiro(texto: any, generico: string, outrosParceiros: string[] = [], max = 140): string {
  const bruto = String(texto ?? '').replace(/\s+/g, ' ').trim();
  if (!bruto) return generico;
  const n = normalizar(bruto);
  if (CITA_PARCEIRO.test(n) || DADO_INTERNO.test(bruto.toLowerCase())) return generico;
  const cercado = ` ${n} `;
  for (const nome of outrosParceiros) {
    const nn = normalizar(nome);
    if (nn.length >= 3 && cercado.includes(` ${nn} `)) return generico;
    // primeiro nome ou sobrenome de outro parceiro, com 4+ letras (menos palavras comuns de empresa)
    for (const t of nn.split(' ')) if (t.length >= 4 && !PALAVRAS_COMUNS.has(t) && cercado.includes(` ${t} `)) return generico;
  }
  return bruto.length > max ? `${bruto.slice(0, max - 1).trimEnd()}…` : bruto;
}

// ---------- Auxiliares ----------
// Id do evento usado em chaves (documento e linha do histórico). Id comum passa como veio; qualquer outro
// ('.', '..', com barra, espaço, muito longo) vira um hash, para nunca colidir nem falhar na gravação.
export function idSeguroEvento(id: string): string {
  const s = String(id);
  if (/^[A-Za-z0-9_-]{1,100}$/.test(s)) return s;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `h${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}${s.length.toString(16)}`;
}
const idSeguro = idSeguroEvento;

function dataDoEvento(ev: EventoCrm, agora: Date): string {
  const t = ev.em ? new Date(ev.em).getTime() : NaN;
  // data inválida ou no futuro distante: vale a hora em que o Indica recebeu
  if (!Number.isFinite(t) || t > agora.getTime() + 60 * 60 * 1000) return agora.toISOString();
  return new Date(t).toISOString();
}

function entrada(ev: EventoCrm, agora: Date, content: string, type: 'system' | 'status_change' = 'system', sufixo = ''): EntradaHistoricoCrm {
  return { id: `crm-${idSeguro(ev.id)}${sufixo}`, type, content, author_name: AUTOR_CRM, created_at: dataDoEvento(ev, agora), attachments: [] };
}

const jaAplicado = (ind: any, ev: EventoCrm) => {
  const prefixo = `crm-${idSeguro(ev.id)}`;
  if (ind.crm_ultimo_evento_id === ev.id) return true;
  return (Array.isArray(ind.negotiation_history) ? ind.negotiation_history : []).some((e: any) => typeof e?.id === 'string' && (e.id === prefixo || e.id.startsWith(`${prefixo}-`)));
};

const ignorado = (motivo: string): Plano => ({ resultado: 'ignorado', motivo, campos: {}, historico: [], notificacoes: [] });
const dados = (ev: EventoCrm) => (ev.dados && typeof ev.dados === 'object' ? ev.dados : {});
const curto = (v: any, max = 120) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const brData = (dia: string) => (dia ? dia.split('-').reverse().join('/') : '');
const cliente = (ind: any) => curto(ind.client_name, 80) || 'cliente';

// uid de pessoa (parceiro de verdade)
const UIDS_SISTEMA = ['client_referral', 'direct_factory', 'public_request', 'anonymous'];
export const parceiroEhPessoa = (ind: any) => !!ind.external_seller_uid && !UIDS_SISTEMA.includes(String(ind.external_seller_uid));

function nomeDaVendedora(ev: EventoCrm, ctx: ContextoEvento): string {
  const d = dados(ev);
  const v = d.vendedora ?? d.vendedora_nome ?? d.responsavel;
  const doEvento = typeof v === 'string' ? v : v?.nome ?? v?.name ?? '';
  return curto(ctx.vendedora?.name || doEvento, 80);
}

// ---------- O plano de cada evento ----------
export function planejarEvento(ind: any, ev: EventoCrm, ctx: ContextoEvento): Plano {
  const nome = String(ev.evento || '');
  if (!(EVENTOS_CRM as readonly string[]).includes(nome)) return ignorado('evento_desconhecido');
  if (jaAplicado(ind, ev)) return ignorado('ja_aplicado');

  const agora = ctx.agora;
  const nowIso = agora.toISOString();
  const nivel = nivelDoStatus(ind.status);
  const d = dados(ev);
  const base = { updated_at: nowIso, crm_ultimo_evento_id: ev.id, crm_ultimo_evento: nome, crm_ultimo_evento_em: dataDoEvento(ev, agora) };
  const ehPessoa = parceiroEhPessoa(ind);
  const paraParceiro = (titulo: string, mensagem: string, tipo: NotificacaoCrm['tipo'] = 'info'): NotificacaoCrm[] =>
    (ehPessoa ? [{ para: 'parceiro', titulo, mensagem, tipo }] : []);

  switch (nome as NomeEventoCrm) {
    case 'indicacao.recebida':
      // só registra; vale em qualquer status
      return { resultado: 'aplicado', campos: { crm_ultimo_evento_id: ev.id, crm_ultimo_evento: nome, crm_ultimo_evento_em: base.crm_ultimo_evento_em }, historico: [entrada(ev, agora, 'Indicação recebida')], notificacoes: [] };

    case 'indicacao.aceita': {
      if (nivel >= 2) return ignorado('status_nao_regride');
      if (nivel === 9) return ignorado('indicacao_encerrada');
      const vend = nomeDaVendedora(ev, ctx);
      const texto = vend ? `Em atendimento por ${vend}` : 'Em atendimento pela equipe comercial da Roder';
      if (nivel === 1) {
        // já em negociação: só completa a vendedora se ainda não havia nenhuma
        if (ind.internal_seller_name || !vend) return ignorado('ja_em_negociacao');
        return {
          resultado: 'aplicado',
          campos: { ...base, internal_seller_name: vend, ...(ctx.vendedora?.uid ? { internal_seller_uid: ctx.vendedora.uid, internal_seller_email: ctx.vendedora.email || null } : {}) },
          historico: [entrada(ev, agora, texto)], notificacoes: [],
        };
      }
      const campos: Record<string, any> = {
        ...base, status: 'negotiating', duplicate_reviewed: true,
        crm_aceita_em: dataDoEvento(ev, agora),
      };
      if (vend) {
        campos.internal_seller_name = vend;
        if (ctx.vendedora?.uid) { campos.internal_seller_uid = ctx.vendedora.uid; campos.internal_seller_email = ctx.vendedora.email || null; }
        else if (ind.internal_seller_uid && normalizar(ind.internal_seller_name) !== normalizar(vend)) { campos.internal_seller_uid = null; campos.internal_seller_email = null; }
      }
      // proteção de 60 dias: a da criação continua; só nasce se a indicação ainda não tinha
      if (!ind.protection_expires_at) campos.protection_expires_at = new Date(agora.getTime() + SESSENTA_DIAS_MS).toISOString();
      const notificacoes: NotificacaoCrm[] = [
        ...(ctx.vendedora?.uid ? [{ para: 'vendedora' as const, titulo: 'Novo Lead Atribuído', mensagem: `Você recebeu um novo lead: ${cliente(ind)}`, tipo: 'info' as const }] : []),
        ...paraParceiro('Lead em Atendimento', `Sua indicação para ${cliente(ind)} foi aceita e está em atendimento${vend ? ` por ${vend}` : ''}.`, 'success'),
      ];
      return { resultado: 'aplicado', campos, historico: [entrada(ev, agora, texto, 'status_change')], notificacoes };
    }

    case 'indicacao.recusada': {
      if (nivel >= 1) return ignorado(nivel === 9 ? 'indicacao_encerrada' : 'status_nao_regride');
      const motivo = textoSeguroParaParceiro(d.motivo, MOTIVO_GENERICO_RECUSA, ctx.nomesOutrosParceiros);
      return {
        resultado: 'aplicado',
        campos: { ...base, status: 'archived', cancellation_reason: 'Indicação não aceita', cancellation_details: motivo },
        historico: [entrada(ev, agora, `Indicação recusada: ${motivo}`, 'status_change')],
        notificacoes: paraParceiro('Lead Arquivado', `Sua indicação para ${cliente(ind)} não foi aceita. Motivo: ${motivo}`, 'warning'),
      };
    }

    case 'indicacao.vinculada': {
      if (nivel >= 2) return ignorado('status_nao_regride');
      if (nivel === 9) return ignorado('indicacao_encerrada');
      if (nivel === 1) return ignorado('ja_em_negociacao');
      const campos: Record<string, any> = { ...base, status: 'negotiating', duplicate_reviewed: true, crm_aceita_em: dataDoEvento(ev, agora) };
      if (!ind.protection_expires_at) campos.protection_expires_at = new Date(agora.getTime() + SESSENTA_DIAS_MS).toISOString();
      return {
        resultado: 'aplicado', campos,
        historico: [entrada(ev, agora, 'Cliente já atendido pela Roder: indicação em negociação', 'status_change')],
        notificacoes: paraParceiro('Lead em Atendimento', `Sua indicação para ${cliente(ind)} está em negociação.`, 'success'),
      };
    }

    case 'negocio.etapa': {
      if (nivel === 9) return ignorado('indicacao_encerrada');
      const etapa = textoSeguroParaParceiro(d.etapa ?? d.nome, '', ctx.nomesOutrosParceiros, 80);
      if (!etapa) return ignorado('etapa_sem_nome');
      return { resultado: 'aplicado', campos: { ...base, crm_etapa: etapa }, historico: [entrada(ev, agora, `Etapa: ${etapa}`)], notificacoes: [] };
    }

    case 'proposta.enviada': {
      if (nivel >= 2) return ignorado('status_nao_regride');
      if (nivel === 9) return ignorado('indicacao_encerrada');
      const numero = curto(d.numero ?? d.numero_orcamento, 40);
      const dia = diaDoCrm(d.data ?? d.data_orcamento);
      const valor = numeroDoCrm(d.valor);
      const campos: Record<string, any> = { ...base, budget_loaded: true };
      if (numero) campos.budget_number = numero;
      if (dia) campos.budget_date = dia;
      if (valor !== null && valor >= 0) campos.gross_budget_value = valor;
      // proteção de 60 dias a partir do envio, nunca encurtando uma proteção que já vai mais longe
      const enviadoMs = new Date(dataDoEvento(ev, agora)).getTime();
      const candidata = enviadoMs + SESSENTA_DIAS_MS;
      const atual = ind.protection_expires_at ? new Date(ind.protection_expires_at).getTime() : 0;
      if (!(atual > candidata)) { campos.budget_sent_at = new Date(enviadoMs).toISOString(); campos.protection_expires_at = new Date(candidata).toISOString(); }
      else if (!ind.budget_sent_at) campos.budget_sent_at = new Date(enviadoMs).toISOString();
      const primeira = !ind.budget_loaded;
      return {
        resultado: 'aplicado', campos,
        historico: [entrada(ev, agora, numero ? `Orçamento enviado (nº ${numero})` : 'Orçamento enviado')],
        notificacoes: primeira ? paraParceiro('Orçamento em Andamento', `Um orçamento foi enviado para o cliente ${cliente(ind)}.`, 'info') : [],
      };
    }

    case 'pedido.lancado': {
      if (nivel >= 2) return ignorado('status_nao_regride');
      if (nivel === 9) return ignorado('indicacao_encerrada');
      const numero = curto(d.numero ?? d.numero_pedido, 40);
      const itens = classificar(d.itens, ind, ctx);
      const campos: Record<string, any> = { ...base };
      if (numero) campos.sale_order_number = numero;
      const dia = diaDoCrm(d.data ?? d.data_pedido);
      if (dia) campos.sale_order_date = dia;
      const entrega = diaDoCrm(d.previsao_entrega);
      if (entrega) campos.delivery_date = entrega;
      if (itens.length) { campos.commissioned_products = produtosGravaveis(itens); campos.sale_value = totalDosItens(itens); }
      return { resultado: 'aplicado', campos, historico: [entrada(ev, agora, numero ? `Pedido de venda lançado (nº ${numero})` : 'Pedido de venda lançado')], notificacoes: [] };
    }

    case 'pedido.faturado':
      return planejarFaturado(ind, ev, ctx, base);

    case 'negocio.ganho': {
      if (nivel === 9) return ignorado('indicacao_encerrada');
      const valor = numeroDoCrm(d.valor);
      return {
        resultado: 'aplicado',
        // não cria comissão e não muda o status: quem fatura é o pedido.faturado
        campos: { ...base, crm_ganho_em: dataDoEvento(ev, agora), ...(valor !== null && valor >= 0 ? { crm_ganho_valor: valor } : {}) },
        historico: [entrada(ev, agora, 'Negócio ganho')], notificacoes: [],
      };
    }

    case 'negocio.perdido': {
      if (nivel >= 2) return ignorado('status_nao_regride');
      if (nivel === 9) return ignorado('indicacao_encerrada');
      const motivo = textoSeguroParaParceiro(d.motivo, MOTIVO_GENERICO_PERDA, ctx.nomesOutrosParceiros);
      return {
        resultado: 'aplicado',
        campos: { ...base, status: 'cancelled', cancellation_reason: motivo, cancellation_details: 'Negócio encerrado no CRM da Roder.', crm_perdido_em: dataDoEvento(ev, agora) },
        historico: [entrada(ev, agora, `Negócio perdido: ${motivo}`, 'status_change')],
        notificacoes: paraParceiro('Indicação Cancelada', `A negociação com ${cliente(ind)} foi encerrada. Motivo: ${motivo}`, 'warning'),
      };
    }
  }
}

// ---------- Itens ----------
function classificar(brutos: any, ind: any, ctx: ContextoEvento): ItemClassificado[] {
  return classificarItensCrm(brutos, ind.commissioned_products || [], ctx.catalogo);
}

// Firestore não aceita `undefined`
export function produtosGravaveis(itens: ItemClassificado[]) {
  return itens.map(i => ({
    code: i.code, name: i.name, quantity: i.quantity, base_value: i.base_value,
    ...(typeof i.is_commissionable === 'boolean' ? { is_commissionable: i.is_commissionable } : {}),
  }));
}
const totalDosItens = (itens: ItemClassificado[]) => emCentavos(itens.reduce((a, i) => a + i.base_value * i.quantity, 0));

// ---------- pedido.faturado ----------
function opcoesDosItens(ind: any, itens: ItemClassificado[]) {
  const atual = ind.options || { complete_installation: false, kit_hydraulic: false, with_freight: false };
  const instal = itens.some(p => /instalacao|instalação|montagem|entrega/i.test(p.name));
  const kit = itens.some(p => /kit|hidraulico|hidráulico|funcao|função|valvula|válvula/i.test(p.name) || p.code.startsWith('9000'));
  const frete = itens.some(p => /frete|transporte|deslocamento/i.test(p.name));
  return { ...atual, complete_installation: !!atual.complete_installation || instal, kit_hydraulic: !!atual.kit_hydraulic || kit, with_freight: !!atual.with_freight || frete };
}

// Faturado repetido (id diferente) enquanto a indicação espera conferência: vale o último, e o que ele
// substituiu vai para o log interno (crm_eventos), nunca some em silêncio.
function planejarFaturado(ind: any, ev: EventoCrm, ctx: ContextoEvento, base: Record<string, any>): Plano {
  const p = planejarFaturadoBase(ind, ev, ctx, base);
  if (p.resultado === 'aplicado' && ind.faturamento_aguardando_conferencia === true && p.campos.commissioned_products && (ind.commissioned_products?.length || ind.sale_value)) {
    p.substituiu = { evento_anterior: ind.crm_ultimo_evento_id ?? null, sale_order_number: ind.sale_order_number ?? null, sale_value: ind.sale_value ?? null, commissioned_products: ind.commissioned_products ?? [] };
  }
  return p;
}

function planejarFaturadoBase(ind: any, ev: EventoCrm, ctx: ContextoEvento, base: Record<string, any>): Plano {
  const agora = ctx.agora;
  const nivel = nivelDoStatus(ind.status);
  if (nivel === 9) return ignorado('indicacao_encerrada');
  const d = dados(ev);
  const numero = curto(d.numero ?? d.numero_pedido, 40);
  const diaPedido = diaDoCrm(d.data_pedido ?? d.data) || diaDoCrm(dataDoEvento(ev, agora));
  const diaFaturamento = diaDoCrm(d.data_faturamento);
  const entrega = diaDoCrm(d.previsao_entrega);

  const dec: DecisaoFaturamento = decidirFaturamento({
    ind, parceiro: ctx.parceiro, itensBrutos: d.itens, catalogo: ctx.catalogo, comissaoExistente: ctx.comissaoExistente, entrega, agora,
    totalPedido: numeroDoCrm(d.valor_total ?? d.total),
  });
  if (dec.tipo === 'ja_faturada') return ignorado(ind.status === 'sold' ? 'ja_faturada' : 'comissao_ja_existe');

  const cnpjCampo = !ind.client_cnpj || /n[ãa]o informado/i.test(String(ind.client_cnpj)) ? (String(d.cnpj ?? '').replace(/\D/g, '') || null) : null;

  if (dec.tipo === 'conferencia') {
    const estornada = !!ind.estornado_em;
    const itens = dec.itens;
    const campos: Record<string, any> = {
      ...base,
      faturamento_aguardando_conferencia: true,
      faturamento_conferencia_em: agora.toISOString(),
      faturamento_conferencia_motivo: estornada ? 'Faturamento estornado; conferir antes de faturar de novo.' : (dec.itensSemRegra.length ? 'Itens do pedido sem regra de comissão.' : 'Faturamento do CRM precisa de conferência.'),
    };
    if (!estornada) {
      if (numero) campos.sale_order_number = numero;
      campos.sale_order_date = diaPedido;
      if (entrega) campos.delivery_date = entrega;
      if (itens.length) { campos.commissioned_products = produtosGravaveis(itens); campos.sale_value = totalDosItens(itens); }
      if (cnpjCampo) campos.client_cnpj = cnpjCampo;
    }
    return {
      resultado: 'aplicado', campos,
      historico: [],  // o parceiro não vê nada: é conferência interna
      notificacoes: [{ para: 'gestao', titulo: 'Faturamento aguardando conferência', mensagem: `O CRM faturou o pedido ${numero || 's/n'} de ${cliente(ind)}, mas não dá para lançar a comissão sozinho. ${dec.motivos[0]}`, tipo: 'warning' }],
      conferencia: { motivos: dec.motivos, itensSemRegra: dec.itensSemRegra },
    };
  }

  // Decidido com segurança: venda faturada
  const itens = dec.itens;
  const total = totalDosItens(itens);
  const c = dec.tipo === 'comissao' ? dec : null;
  const comissao = !!c;
  const campos: Record<string, any> = {
    ...base,
    status: 'sold',
    sale_value: total,
    discount_percentage: 0,
    discount_amount: 0,
    commission_value: c ? c.calc.valor : 0,
    commission_rate_applied: c ? c.taxa : 0,
    commissionable_value: c ? c.calc.base : 0,
    standard_seller_commission_value: 0,
    sale_date: diaPedido,
    sale_order_date: diaPedido,
    items: itens.map(i => ({ product_name: i.name, quantity: i.quantity, price: i.base_value, code: i.code })),
    commissioned_products: produtosGravaveis(itens),
    options: opcoesDosItens(ind, itens),
    faturamento_aguardando_conferencia: false,
    crm_faturado_em: diaFaturamento || diaDoCrm(dataDoEvento(ev, agora)),
  };
  if (numero) campos.sale_order_number = numero;
  if (entrega) campos.delivery_date = entrega;
  if (cnpjCampo) campos.client_cnpj = cnpjCampo;
  // aviso ao financeiro 2 dias depois, como o faturamento da tela
  if (comissao && !ind.finance_notice_sent_at) { campos.finance_notice_pending = true; campos.finance_notice_due_at = new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(); }

  const nomePessoa = cliente(ind);
  const plano: Plano = {
    resultado: 'aplicado', campos,
    // começa com "VENDA FINALIZADA" porque o diagnóstico de comissão usa esse início para ordenar faturamento e estorno
    historico: [entrada(ev, agora, comissao
      ? `VENDA FINALIZADA! Data do Pedido: ${brData(diaPedido)}. Venda concluída, comissão liberada.`
      : `VENDA FINALIZADA! Data do Pedido: ${brData(diaPedido)}.`, 'status_change')],
    notificacoes: [
      ...(comissao && parceiroEhPessoa(ind) ? [{ para: 'parceiro' as const, titulo: 'Venda concluída', mensagem: `Venda concluída, comissão liberada. Cliente: ${nomePessoa}.`, tipo: 'success' as const }] : []),
      { para: 'gestao', titulo: 'Venda Realizada', mensagem: `O CRM faturou a venda de ${nomePessoa}${numero ? ` (pedido ${numero})` : ''}.`, tipo: 'success' },
    ],
  };
  if (c) {
    plano.comissao = {
      indication_id: ev.id_externo,
      external_seller_uid: String(ind.external_seller_uid),
      external_seller_name: c.parceiroNome,
      value: c.calc.valor,
      base_value_used: c.calc.base,
      gross_commissionable_value: c.calc.baseBruta,
      discount_applied: 0,
      discount_percentage: 0,
      rate_applied: c.taxa,
      status: 'waiting_nf',
      month: c.mes.month,
      year: c.mes.year,
      sale_date: diaPedido,
      created_at: agora.toISOString(),
      generated_by: 'crm',
    };
  }
  return plano;
}
