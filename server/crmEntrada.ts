// Indica -> CRM: envia cada indicação nova ao CRM do Roder Vision, com fila, backoff e reserva.
// Entradas:
//   - laço de 1 minuto (rodarFilaCrm): pending/triagem de qualquer idade e negotiating criada depois da virada, como
//     indicação nova (aviso por e-mail só nas criadas depois da virada); negotiating ANTERIOR à virada vai no formato
//     de carga inicial (histórico), em lotes de até 100;
//   - carga inicial manual (cargaInicialCrm), pela tela Admin: as em negociação, em lotes de até 500;
//   - fase 2: atualização do parceiro (a cada 10 min), comissão e comissão paga (a cada 5 min);
// Documentação: docs/integracao-crm.md
import {
  RESERVA_ENVIO_MS, STATUS_ENVIAVEIS, STATUS_DA_CARGA, montarPayloadIndicacao, motivoNaoEnviarNaCarga, motivoNaoEnviarNoLaco, planoDeFalha, atrasoDaTentativa, podeEnviarAoCrm, podeCargaAoCrm,
  type ConfigCrm,
} from '../src/lib/crmIntegracao';
import {
  MAX_ANEXOS, MAX_ANEXO_BYTES, assinaturaDaComissao, montarVendaParaCarga, entradasParaIgnorar, entradasPendentesDoParceiro, montarAtualizacao, montarComissao, montarComissaoPaga, referenciaStorage, tipoDoAnexo,
  type AnexoCrm,
} from '../src/lib/crmFase2';

export type DepsEntradaCrm = {
  db: any;
  config: () => ConfigCrm;
  fetchFn?: (url: string, init: any) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;
  agora?: () => Date;
  log?: (...a: any[]) => void;
  arrayUnion?: (...v: any[]) => any;
  // Fase 2: bucket do Storage do próprio projeto. URL de outro bucket nunca é assinada nem enviada.
  bucketProprio?: string;
  // Fase 2: gera uma URL assinada de 24 h para o anexo (Firebase Storage). Sem ela, vale a URL que já está na entrada.
  // Devolve a URL assinada (ou a original, se a assinatura falhar) e o tamanho conferido no Storage. Lança se não conseguir conferir.
  assinarAnexo?: (url: string) => Promise<{ url?: string; tamanho?: number } | null>;
};

export const DOC_CONFIG_CRM = 'crm_integracao';
const TIMEOUT_ENVIO_MS = 15000;
const MAX_POR_RODADA = 20;
const JANELA_DO_LACO_MS = 72 * 60 * 60 * 1000;
const LIMITE_DO_LACO = 500;

export type ResultadoEnvio = { id: string; resultado: 'enviada' | 'falhou' | 'desistiu' | 'pulada'; motivo?: string; status?: number };

// ---------- Data da virada ----------
// Valor do ambiente (CRM_ATIVO_DESDE) ou o gravado em settings/crm_integracao.ativo_desde. Se nenhum
// existir e o interruptor estiver ligado, grava AGORA (uma vez só: create falha se já existe) e
// usa esse valor. Assim o passado nunca é reenviado fora da carga inicial.
export async function garantirDataDaVirada(deps: DepsEntradaCrm): Promise<string | null> {
  const cfg = deps.config();
  if (cfg.ativoDesde) return cfg.ativoDesde;
  if (!cfg.ativo) return null;
  const ref = deps.db.collection('settings').doc(DOC_CONFIG_CRM);
  const agora = (deps.agora ? deps.agora() : new Date()).toISOString();
  // Se a carga inicial já rodou, a virada vale desde o INÍCIO dela: o que foi indicado depois da carga
  // e antes de ligar o CRM_ATIVO entra como indicação nova (com triagem), e não se perde no meio.
  return deps.db.runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    const d = snap.exists ? (snap.data() || {}) : {};
    if (valida(d.ativo_desde)) return new Date(d.ativo_desde).toISOString();
    const v = valida(d.carga_inicial_em) ? new Date(d.carga_inicial_em).toISOString() : agora;
    tx.set(ref, { ativo_desde: v }, { merge: true });
    return v;
  });
}

const valida = (v: any) => !!v && !Number.isNaN(new Date(v).getTime());

export async function lerDataDaVirada(db: any): Promise<string | null> {
  const s = await db.collection('settings').doc(DOC_CONFIG_CRM).get();
  const v = s.exists ? s.data()?.ativo_desde : null;
  return v && !Number.isNaN(new Date(v).getTime()) ? new Date(v).toISOString() : null;
}

// ---------- Envio de uma indicação ----------
type Ctx = { modo: 'laco' | 'carga'; ativoDesde: string | null };

export async function enviarIndicacaoAoCrm(deps: DepsEntradaCrm, indId: string, ctx: Ctx): Promise<ResultadoEnvio> {
  const { db } = deps;
  const cfg = deps.config();
  const agora = () => (deps.agora ? deps.agora() : new Date());
  const log = deps.log || console.log;
  if (!podeEnviarAoCrm(cfg)) return { id: indId, resultado: 'pulada', motivo: 'integracao_desligada' };
  const ref = db.collection('indications').doc(indId);

  // 1. Reserva: relê dentro da transação e só segue quem ainda é elegível. Dois processos nunca
  //    mandam a mesma indicação juntos (e o CRM ainda deduplica por id_externo).
  const reservada = await db.runTransaction(async (tx: any) => {
    const s = await tx.get(ref);
    if (!s.exists) return null;
    const ind = s.data();
    const motivo = ctx.modo === 'laco'
      ? motivoNaoEnviarNoLaco(ind, { ativoDesde: ctx.ativoDesde, agora: agora() })
      : motivoNaoEnviarNaCarga(ind, { agora: agora() });
    if (motivo) return { motivo };
    tx.update(ref, { crm_reservado_ate: new Date(agora().getTime() + RESERVA_ENVIO_MS).toISOString() });
    return { ind };
  });
  if (!reservada) return { id: indId, resultado: 'pulada', motivo: 'inexistente' };
  if ('motivo' in reservada) return { id: indId, resultado: 'pulada', motivo: reservada.motivo };
  const ind = reservada.ind;

  // 2. Payload
  let parceiro: any = null;
  const uid = String(ind.external_seller_uid || '');
  if (uid) { try { parceiro = (await db.collection('users').doc(uid).get()).data() || null; } catch { /* segue só com o que a indicação tem */ } }
  const payload = montarPayloadIndicacao(ind, indId, parceiro, {
    // O aviso por e-mail do CRM só vale para indicação realmente NOVA (criada em ou depois da virada).
    // Antigas e sobras enviadas pelo laço vão sem aviso, para não gerar e-mail em massa na virada.
    notificarEmail: ctx.modo === 'laco' && valida(ind.created_at) && !!ctx.ativoDesde && new Date(ind.created_at).getTime() >= new Date(ctx.ativoDesde).getTime() ? cfg.notificarEmail : null,
    jaEmNegociacao: ind.status === 'negotiating',
  });

  // 3. POST
  const r = await postarCrm(deps, payload, TIMEOUT_ENVIO_MS);

  // 4. Resultado
  if (r.ok) {
    const crmId = r.json && r.json.id != null ? String(r.json.id) : null;
    await ref.update({ crm_enviado_em: agora().toISOString(), crm_id: crmId, crm_reservado_ate: null, crm_ultimo_erro: null, crm_proxima_tentativa_em: null, crm_falhas_transporte: 0 });
    return { id: indId, resultado: 'enviada', status: r.status };
  }
  if (r.transitorio) {
    // Rede, 401, 403, 429, 5xx: não é culpa da indicação. Não conta tentativa e nunca desiste; só reagenda com backoff.
    const t = planoDeTransporte(Number(ind.crm_falhas_transporte) || 0, agora());
    await ref.update({ crm_falhas_transporte: t.falhas, crm_ultimo_erro: r.erro, crm_ultima_tentativa_em: agora().toISOString(), crm_reservado_ate: null, crm_proxima_tentativa_em: t.proxima });
    return { id: indId, resultado: 'falhou', motivo: r.erro, status: r.status };
  }
  const falha = planoDeFalha(Number(ind.crm_tentativas) || 0, agora());
  await ref.update({
    crm_tentativas: falha.tentativas,
    crm_ultimo_erro: r.erro,
    crm_ultima_tentativa_em: agora().toISOString(),
    crm_reservado_ate: null,
    crm_proxima_tentativa_em: falha.proxima,
    ...(falha.desistiu ? { crm_desistiu_em: agora().toISOString() } : {}),
  });
  return { id: indId, resultado: falha.desistiu ? 'desistiu' : 'falhou', motivo: r.erro, status: r.status };
}

// ---------- Laço de 1 minuto ----------
let emExecucao = false;
const JANELA_RECENTE_MS = 72 * 60 * 60 * 1000;
const VARREDURA_COMPLETA_MS = 15 * 60 * 1000;
const PAGINAS_MAX = 6;
// Por banco: quando foi a última varredura completa e se ainda sobrou fila (então varre de novo no minuto seguinte)
const varredura = new WeakMap<object, { proxima: number; sobrou: boolean }>();

async function paginarPorData(db: any, desde: string): Promise<any[]> {
  // Faixa e ordem no MESMO campo (created_at): sem índice composto. Páginas de LIMITE_DO_LACO.
  const docs: any[] = [];
  let q = db.collection('indications').where('created_at', '>=', desde).orderBy('created_at').limit(LIMITE_DO_LACO);
  for (let pg = 0; pg < PAGINAS_MAX; pg++) {
    const s = await q.get();
    docs.push(...s.docs);
    if (s.docs.length < LIMITE_DO_LACO) break;
    q = db.collection('indications').where('created_at', '>=', desde).orderBy('created_at').startAfter(s.docs[s.docs.length - 1]).limit(LIMITE_DO_LACO);
  }
  return docs;
}

// Todo minuto lê as criadas nas últimas 72 h (ou desde o corte, se for mais recente). A cada 15 minutos (ou
// enquanto ainda sobra fila) faz a varredura COMPLETA: todas as abertas (pending, triagem, negotiating) de qualquer idade. Filtra em memória: where('crm_enviado_em','==',null) NÃO casa campo inexistente.
export async function listarCandidatasDoLaco(db: any, ativoDesde: string, agora: Date, completa = false): Promise<{ id: string; data: any }[]> {
  const recente = new Date(agora.getTime() - JANELA_RECENTE_MS).toISOString();
  const docs: any[] = await paginarPorData(db, recente);
  if (completa) {
    // Tudo o que está aberto, de qualquer idade (status em lista, campo único, sem índice composto)
    const s = await db.collection('indications').where('status', 'in', STATUS_ENVIAVEIS).get();
    docs.push(...s.docs);
  }
  const vistos = new Set<string>();
  const achadas: { id: string; data: any }[] = [];
  for (const d of docs) {
    if (vistos.has(d.id)) continue; vistos.add(d.id);
    const data = d.data() || {};
    if (!motivoNaoEnviarNoLaco(data, { ativoDesde, agora })) achadas.push({ id: d.id, data });
  }
  // mais antigas primeiro: é a ordem em que os parceiros indicaram
  achadas.sort((x, y) => String(x.data.created_at || '').localeCompare(String(y.data.created_at || '')));
  return achadas;
}

const MAX_HISTORICO_POR_RODADA = 100;

async function marcarCargaInicialFeita(deps: DepsEntradaCrm, agora: Date) {
  try {
    const ref = deps.db.collection('settings').doc(DOC_CONFIG_CRM);
    await deps.db.runTransaction(async (tx: any) => {
      const snap = await tx.get(ref);
      const d = snap.exists ? (snap.data() || {}) : {};
      if (!valida(d.carga_inicial_em)) tx.set(ref, { carga_inicial_em: agora.toISOString() }, { merge: true });
    });
  } catch { /* o aviso do card não pode derrubar o envio */ }
}

export async function rodarFilaCrm(deps: DepsEntradaCrm): Promise<{ pulado?: string; resultados: ResultadoEnvio[] }> {
  const cfg = deps.config();
  if (!podeEnviarAoCrm(cfg)) return { pulado: 'integracao_desligada', resultados: [] };
  if (emExecucao) return { pulado: 'rodada_anterior_em_andamento', resultados: [] };
  emExecucao = true;
  try {
    const desde = await garantirDataDaVirada(deps);
    if (!desde) return { pulado: 'sem_data_de_virada', resultados: [] };
    const agora = deps.agora ? deps.agora() : new Date();
    const est = varredura.get(deps.db) || { proxima: 0, sobrou: false };
    const completa = est.sobrou || agora.getTime() >= est.proxima;
    const candidatas = await listarCandidatasDoLaco(deps.db, desde, agora, completa);
    // Em negociação ANTERIOR à virada (e ainda não enviada) não pode entrar no CRM como indicação normal, que seria triada
    // de novo: vai no formato de carga inicial (histórico), em lotes. O resto vai como indicação nova.
    const corte = new Date(desde).getTime();
    const historicas = candidatas.filter(c => String(c.data.status) === 'negotiating' && !(valida(c.data.created_at) && new Date(c.data.created_at).getTime() >= corte));
    const idsHist = new Set(historicas.map(c => c.id));
    const normais = candidatas.filter(c => !idsHist.has(c.id));
    const sobrou = normais.length > MAX_POR_RODADA || historicas.length > MAX_HISTORICO_POR_RODADA;
    if (completa) varredura.set(deps.db, { proxima: agora.getTime() + VARREDURA_COMPLETA_MS, sobrou });
    else if (est.sobrou) varredura.set(deps.db, { ...est, sobrou });
    const resultados: ResultadoEnvio[] = [];
    for (const c of normais.slice(0, MAX_POR_RODADA)) {
      resultados.push(await enviarIndicacaoAoCrm(deps, c.id, { modo: 'laco', ativoDesde: desde }));
    }
    let historicoConcluido = completa && historicas.length === 0;
    if (historicas.length) {
      const lr = await enviarLoteComoCarga(deps, historicas.slice(0, MAX_HISTORICO_POR_RODADA).map(c => c.id), { backoff: true });
      resultados.push(...lr.resultados);
      // terminou de mandar todo o histórico: nada sobrou além do lote e todos foram aceitos
      historicoConcluido = completa && historicas.length <= MAX_HISTORICO_POR_RODADA && lr.resultados.length === historicas.length && lr.resultados.every(x => x.resultado === 'enviada');
    }
    // Sem carga manual, o laço é quem manda o histórico. Quando não resta nenhuma em negociação anterior ao corte sem
    // envio, registra carga_inicial_em (só se ainda vazio) para o aviso do card Admin não ficar aceso para sempre.
    if (historicoConcluido) await marcarCargaInicialFeita(deps, agora);
    return { resultados };
  } finally { emExecucao = false; }
}

// ---------- Carga inicial ----------
// Formato do CRM: POST { tipo: 'carga_inicial', itens: [...] } (até 500 por chamada). Entra como histórica,
// sem aviso de "recebida", e vincula por CNPJ/CPF. Resposta { ok, recebidos, vinculados, repetidos, ignorados }.
// SÓ as já aceitas (negotiating) ainda não enviadas, criadas ANTES do corte (carga_inicial_em, gravado no primeiro
// clique, ou ativo_desde). Pending e triagem NÃO entram: vão pelo laço como indicação nova, com triagem no CRM.
// As VENDIDAS também não: já estão faturadas no Indica e não são lead.
export const MAX_ITENS_CARGA = 500;

async function corteDaCarga(deps: DepsEntradaCrm, gravar: boolean): Promise<string | null> {
  const ref = deps.db.collection('settings').doc(DOC_CONFIG_CRM);
  const agora = (deps.agora ? deps.agora() : new Date()).toISOString();
  if (deps.config().ativoDesde && valida(deps.config().ativoDesde)) return new Date(deps.config().ativoDesde).toISOString();
  if (!gravar) {
    const d = (await ref.get()).data() || {};
    return valida(d.ativo_desde) ? new Date(d.ativo_desde).toISOString() : valida(d.carga_inicial_em) ? new Date(d.carga_inicial_em).toISOString() : null;
  }
  return deps.db.runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    const d = snap.exists ? (snap.data() || {}) : {};
    if (valida(d.ativo_desde)) return new Date(d.ativo_desde).toISOString();
    if (valida(d.carga_inicial_em)) return new Date(d.carga_inicial_em).toISOString();
    tx.set(ref, { carga_inicial_em: agora }, { merge: true });
    return agora;
  });
}

export type ResumoCarga = { recebidos: number; vinculados: number; repetidos: number; ignorados: number };

export async function cargaInicialCrm(deps: DepsEntradaCrm, o: { simulacao?: boolean; limite?: number } = {}) {
  const cfg = deps.config();
  if (!o.simulacao && !podeCargaAoCrm(cfg)) return { ok: false as const, status: 409, error: 'Configure CRM_CHAVE (e confira CRM_URL) antes de enviar. Use a simulação para só contar.' };
  const agora = deps.agora ? deps.agora() : new Date();
  const log = deps.log || console.log;
  const corte = await corteDaCarga(deps, !o.simulacao);
  const s = await deps.db.collection('indications').where('status', 'in', STATUS_DA_CARGA).get();
  const elegiveis: { id: string; status: string; criada: string }[] = [];
  const porMotivo: Record<string, number> = {};
  for (const d of s.docs) {
    const data = d.data() || {};
    let m = motivoNaoEnviarNaCarga(data, { agora });
    if (!m && corte && data.status === 'negotiating' && valida(data.created_at) && new Date(data.created_at).getTime() >= new Date(corte).getTime()) m = 'depois_do_corte';
    if (m) { porMotivo[m] = (porMotivo[m] || 0) + 1; continue; }
    elegiveis.push({ id: d.id, status: String(data.status), criada: String(data.created_at || '') });
  }
  elegiveis.sort((a, b) => a.criada.localeCompare(b.criada));
  const porStatus: Record<string, number> = {};
  elegiveis.forEach(e => { porStatus[e.status] = (porStatus[e.status] || 0) + 1; });
  if (o.simulacao) return { ok: true as const, simulacao: true, elegiveis: elegiveis.length, por_status: porStatus, descartadas: porMotivo, corte, pendentes_novas: porMotivo.vai_como_nova || 0, em_negociacao: porStatus.negotiating || 0, vendidas: porStatus.sold || 0, total_carga: elegiveis.length, proximo_lote: Math.min(elegiveis.length, Math.min(Math.max(Math.floor(o.limite || 200), 1), MAX_ITENS_CARGA)), vendas_diretas_fora: porMotivo.venda_direta || 0 };

  const limite = Math.min(Math.max(Math.floor(o.limite || 200), 1), MAX_ITENS_CARGA);
  const lote = elegiveis.slice(0, limite);

  const lr = await enviarLoteComoCarga(deps, lote.map(e => e.id), { backoff: false });
  if (!lr.tentadas) return { ok: true as const, simulacao: false, elegiveis: elegiveis.length, tentadas: 0, enviadas: 0, falhas: 0, restantes: elegiveis.length, resumo: lr.resumo };
  if ('erro' in lr && lr.erro !== undefined) return { ok: true as const, simulacao: false, elegiveis: elegiveis.length, tentadas: lr.tentadas, enviadas: 0, falhas: lr.tentadas, restantes: elegiveis.length, erro: lr.erro, resumo: lr.resumo };
  return { ok: true as const, simulacao: false, elegiveis: elegiveis.length, tentadas: lr.tentadas, enviadas: lr.enviadas, falhas: lr.tentadas - lr.enviadas, restantes: Math.max(elegiveis.length - lr.enviadas, 0), resumo: lr.resumo };
}

// Envia um lote no formato { tipo: 'carga_inicial', itens } (histórico: sem aviso de "recebida" no CRM, sem
// notificar_email, com a nota "[Já estava em negociação...]"). Usado pela carga manual e pelo laço, para as
// em negociação anteriores à virada. `backoff`: no laço, a falha de transporte reagenda (crm_proxima_tentativa_em).
export async function enviarLoteComoCarga(deps: DepsEntradaCrm, ids: string[], o: { backoff: boolean }) {
  const agora = deps.agora ? deps.agora() : new Date();
  const log = deps.log || console.log;
  const itens: any[] = []; const reservadas: { id: string; ind: any }[] = [];
  const parceiros = new Map<string, any>();
  for (const id of ids) {
    const ref = deps.db.collection('indications').doc(id);
    const r = await deps.db.runTransaction(async (tx: any) => {
      const sn = await tx.get(ref);
      if (!sn.exists) return null;
      const ind = sn.data();
      if (motivoNaoEnviarNaCarga(ind, { agora })) return null;
      tx.update(ref, { crm_reservado_ate: new Date(agora.getTime() + RESERVA_ENVIO_MS).toISOString() });
      return ind;
    });
    if (!r) continue;
    const uid = String(r.external_seller_uid || '');
    if (uid && !parceiros.has(uid)) { try { parceiros.set(uid, (await deps.db.collection('users').doc(uid).get()).data() || null); } catch { parceiros.set(uid, null); } }
    const item = montarPayloadIndicacao(r, id, parceiros.get(uid) || null, { jaEmNegociacao: r.status === 'negotiating' });
    if (r.status === 'sold') {
      // vendida: leva os dados da venda e da comissão. Nunca notificar_email. A fase 2 segue mandando comissao e
      // comissao_paga normalmente (o CRM trata por id_externo + pedido_numero, então não há duplicidade).
      let com: any = null;
      try { const q = await deps.db.collection('commissions').where('indication_id', '==', id).get(); com = q.docs.length ? q.docs[0].data() : null; } catch { /* sem comissão */ }
      Object.assign(item, montarVendaParaCarga(r, com));
    }
    itens.push(item);
    reservadas.push({ id, ind: r });
  }
  const zero: ResumoCarga = { recebidos: 0, vinculados: 0, repetidos: 0, ignorados: 0 };
  if (!itens.length) return { tentadas: 0, enviadas: 0, resumo: zero, resultados: [] as ResultadoEnvio[] };

  const r = await postarCrm(deps, { tipo: 'carga_inicial', itens });
  const nowIso = agora.toISOString();
  const resultados: ResultadoEnvio[] = [];
  if (!r.ok) {
    // Falha de transporte, 401, 403, 429, 5xx ou 4xx do lote inteiro: não é culpa de nenhuma indicação.
    // Não conta tentativa nem desiste. Na carga manual só solta a reserva; no laço também reagenda com backoff.
    for (const x of reservadas) {
      const t = planoDeTransporte(Number(x.ind.crm_falhas_transporte) || 0, agora);
      await deps.db.collection('indications').doc(x.id).update({
        crm_reservado_ate: null,
        ...(o.backoff ? { crm_falhas_transporte: t.falhas, crm_proxima_tentativa_em: t.proxima, crm_ultimo_erro: r.erro, crm_ultima_tentativa_em: nowIso } : {}),
      });
      resultados.push({ id: x.id, resultado: 'falhou', motivo: r.erro, status: r.status });
    }
    if (r.status === 401 || r.status === 403) log('[CRM-CARGA] O CRM recusou a chave (CRM_CHAVE).');
    return { tentadas: reservadas.length, enviadas: 0, erro: r.erro, resumo: zero, resultados };
  }
  // Marca só o que o CRM confirmou. Se a resposta trouxer só contagens, o lote inteiro vale.
  // Só a recusa POR ITEM (ok:false na resposta do item) conta tentativa daquela indicação.
  const porItem: any[] | null = Array.isArray(r.json?.resultados) ? r.json.resultados : null;
  const recusados = new Set<string>(porItem ? porItem.filter(x => x && x.ok === false).map(x => String(x.id_externo)) : []);
  let enviadas = 0;
  for (const x of reservadas) {
    const ref = deps.db.collection('indications').doc(x.id);
    if (recusados.has(x.id)) {
      const f = planoDeFalha(Number(x.ind.crm_tentativas) || 0, agora);
      await ref.update({
        crm_tentativas: f.tentativas, crm_ultimo_erro: 'recusada pelo CRM na carga', crm_ultima_tentativa_em: nowIso, crm_reservado_ate: null,
        crm_proxima_tentativa_em: f.proxima,
        ...(f.desistiu ? { crm_desistiu_em: nowIso } : {}),
      });
      resultados.push({ id: x.id, resultado: f.desistiu ? 'desistiu' : 'falhou', motivo: 'recusada' });
      continue;
    }
    await ref.update({ crm_enviado_em: nowIso, crm_id: null, crm_carga_inicial: true, crm_reservado_ate: null, crm_ultimo_erro: null, crm_proxima_tentativa_em: null, crm_falhas_transporte: 0 });
    resultados.push({ id: x.id, resultado: 'enviada' });
    enviadas++;
  }
  const n = (v: any, padrao = 0) => (Number.isFinite(Number(v)) ? Number(v) : padrao);
  const resumo: ResumoCarga = { recebidos: n(r.json?.recebidos, reservadas.length), vinculados: n(r.json?.vinculados), repetidos: n(r.json?.repetidos), ignorados: n(r.json?.ignorados) };
  return { tentadas: reservadas.length, enviadas, resumo, resultados };
}

// ---------- POST ao CRM ----------
type RespostaPost = { ok: boolean; status: number; json: any; erro: string; transitorio: boolean };

// Falha que não é culpa do item enviado: rede, 401, 403, 408, 429 e 5xx. Não conta tentativa nem faz desistir.
export const falhaDeTransporte = (status: number, erroRede: boolean) => erroRede || status === 0 || [401, 403, 408, 429].includes(status) || status >= 500;

export function planoDeTransporte(falhasAntes: number, agora: Date): { falhas: number; proxima: string } {
  const falhas = (Number(falhasAntes) || 0) + 1;
  return { falhas, proxima: new Date(agora.getTime() + atrasoDaTentativa(falhas)).toISOString() };
}

// Saúde da conexão com o CRM, para o aviso do card Admin (sem segredo, só o código e o motivo).
const saude = new WeakMap<object, { seguidas: number; limpo: boolean }>();
async function registrarSaude(deps: DepsEntradaCrm, r: { ok: boolean; status: number; transitorio: boolean }) {
  try {
    const est = saude.get(deps.db) || { seguidas: 0, limpo: false };
    const ref = deps.db.collection('settings').doc(DOC_CONFIG_CRM);
    if (r.transitorio) {
      est.seguidas++; est.limpo = false; saude.set(deps.db, est);
      const motivo = r.status === 401 || r.status === 403 ? `CRM recusou a chave (${r.status}). Confira a CRM_CHAVE.` : r.status ? `CRM com problema (HTTP ${r.status}).` : 'Sem conexão com o CRM.';
      await ref.set({ alerta_transporte: { em: (deps.agora ? deps.agora() : new Date()).toISOString(), seguidas: est.seguidas, motivo } }, { merge: true });
    } else if (!est.limpo) {
      est.seguidas = 0; est.limpo = true; saude.set(deps.db, est);
      await ref.set({ alerta_transporte: null }, { merge: true });
    }
  } catch { /* o aviso nunca derruba o envio */ }
}

async function postarCrm(deps: DepsEntradaCrm, corpo: any, timeoutMs = 60000): Promise<RespostaPost> {
  const cfg = deps.config();
  let status = 0; let texto = ''; let erroRede = '';
  try {
    const f = deps.fetchFn || ((url: string, init: any) => fetch(url, init));
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await f(cfg.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-roder-chave': cfg.chave }, body: JSON.stringify(corpo), signal: ctrl.signal });
      status = r.status; texto = await r.text().catch(() => '');
    } finally { clearTimeout(t); }
  } catch (e: any) { erroRede = e?.name === 'AbortError' ? 'tempo esgotado' : String(e?.message || 'falha de rede').slice(0, 120); }
  let json: any = null;
  try { json = JSON.parse(texto); } catch { /* sem JSON */ }
  const ok = status >= 200 && status < 300 && json?.ok !== false;
  const transitorio = !ok && falhaDeTransporte(status, !!erroRede);
  const r = { ok, status, json, erro: ok ? '' : (erroRede || `HTTP ${status}`).slice(0, 160), transitorio };
  await registrarSaude(deps, r);
  return r;
}

// ---------- Fase 2: atualização do parceiro ----------
// Rotinas separadas da fila de indicações novas (que nunca esperam por elas): atualizações a cada 10 minutos, comissões a cada 5 (server.ts).
let atualizacoesEmExecucao = false;
const MAX_ATUALIZACOES_POR_RODADA = 30;
const MAX_COMISSOES_POR_RODADA = 30;

async function prepararAnexos(deps: DepsEntradaCrm, e: any): Promise<{ anexos: AnexoCrm[]; avisos: string[] }> {
  const anexos: AnexoCrm[] = []; const avisos: string[] = [];
  const lista: any[] = Array.isArray(e.attachments) ? e.attachments : [];
  for (const a of lista.slice(0, MAX_ANEXOS)) {
    const url = String(a?.url || '');
    const nome = String(a?.name || 'arquivo').slice(0, 160);
    if (!/^https:\/\//.test(url)) { avisos.push(`[Anexo "${nome}" não enviado: está guardado só no aparelho]`); continue; }
    // Só arquivo do Storage do PRÓPRIO projeto é assinado e enviado. Qualquer outro endereço fica de fora.
    const ref = referenciaStorage(url);
    if (!ref || !deps.bucketProprio || ref.bucket !== deps.bucketProprio || !deps.assinarAnexo) { avisos.push(`[Anexo "${nome}" não enviado: arquivo fora do armazenamento do Roder Indica]`); continue; }
    let r: { url?: string; tamanho?: number } | null = null;
    try { r = await deps.assinarAnexo(url); } catch { r = null; }
    if (!r || r.tamanho === undefined) { avisos.push(`[Anexo "${nome}" não enviado: não foi possível conferir o arquivo]`); continue; }
    if (r.tamanho > MAX_ANEXO_BYTES) { avisos.push(`[Anexo "${nome}" não enviado: passa de 20 MB]`); continue; }
    anexos.push({ url: r.url || url, tipo: tipoDoAnexo({ name: nome, url }), nome });
  }
  if (lista.length > MAX_ANEXOS) avisos.push(`[${lista.length - MAX_ANEXOS} anexo(s) além do limite de ${MAX_ANEXOS} não enviado(s)]`);
  return { anexos, avisos };
}

async function paginar(consultaBase: () => any, tamanho: number, paginas: number): Promise<any[]> {
  const docs: any[] = [];
  let q = consultaBase().limit(tamanho);
  for (let pg = 0; pg < paginas; pg++) {
    const s = await q.get();
    docs.push(...s.docs);
    if (s.docs.length < tamanho) break;
    q = consultaBase().startAfter(s.docs[s.docs.length - 1]).limit(tamanho);
  }
  return docs;
}

// Indicações abertas que já estão no CRM, com nota nova do parceiro. Roda a cada 10 minutos.
// Custo de leitura: a rodada normal só lê quem mudou (updated_at >= última rodada menos 30 min; toda nota da
// Central grava updated_at). A cada 6 horas, e na primeira rodada depois de reiniciar, faz a varredura completa
// (indicações com crm_enviado_em, teto das 2000 mais recentes) para pegar retentativas em backoff e qualquer
// nota que tenha entrado sem mexer em updated_at. LIMITE: a varredura completa só alcança as 2000 mais recentes
// (por crm_enviado_em); uma nota que não mexa em updated_at numa indicação mais antiga que isso não seria vista.
// Documentado em docs/integracao-crm.md.
export const TETO_VARREDURA_COMPLETA = 2000;
const VARREDURA_ATUALIZACOES_MS = 6 * 60 * 60 * 1000;
const SOBREPOSICAO_MS = 30 * 60 * 1000;
const ultimaVarreduraAtu = new WeakMap<object, { completa: number; rodada: number }>();

export async function rodarAtualizacoesCrm(deps: DepsEntradaCrm): Promise<{ pulado?: string; enviadas: number; falhas: number }> {
  const cfg = deps.config();
  if (!podeEnviarAoCrm(cfg)) return { pulado: 'integracao_desligada', enviadas: 0, falhas: 0 };
  if (atualizacoesEmExecucao) return { pulado: 'rodada_anterior_em_andamento', enviadas: 0, falhas: 0 };
  atualizacoesEmExecucao = true;
  try {
    const agora = deps.agora ? deps.agora() : new Date();
    const uniao = deps.arrayUnion || ((...v: any[]) => v);
    const est = ultimaVarreduraAtu.get(deps.db) || { completa: 0, rodada: 0 };
    const completa = agora.getTime() - est.completa >= VARREDURA_ATUALIZACOES_MS;
    let docs: any[];
    if (completa) {
      docs = await paginar(() => deps.db.collection('indications').where('crm_enviado_em', '>', '').orderBy('crm_enviado_em', 'desc'), 500, TETO_VARREDURA_COMPLETA / 500);
    } else {
      const desde = new Date(est.rodada - SOBREPOSICAO_MS).toISOString();
      docs = await paginar(() => deps.db.collection('indications').where('updated_at', '>=', desde).orderBy('updated_at'), 500, 4);
      // retentativas em backoff não mexem em updated_at: têm marca própria
      const retentar = await deps.db.collection('indications').where('crm_atu_retry', '>', '').get();
      const ja = new Set(docs.map((x: any) => x.id));
      for (const x of retentar.docs) if (!ja.has(x.id)) docs.push(x);
    }
    let enviadas = 0; let falhas = 0; let feitas = 0;
    for (const d of docs) {
      const ind = d.data() || {};
      if (!ind.crm_enviado_em || !STATUS_ENVIAVEIS.includes(String(ind.status))) continue;
      const ref = deps.db.collection('indications').doc(d.id);
      const ignorar = entradasParaIgnorar(ind);
      if (ignorar.length) await ref.update({ crm_atualizacoes_ignoradas: uniao(...ignorar) });
      let proximaRetentativa: string | null = null;
      for (const e of entradasPendentesDoParceiro(ind)) {
        const falha = ind[`crm_atu_falha_${e.id}`];
        if (falha?.proxima && new Date(falha.proxima).getTime() > agora.getTime()) { proximaRetentativa = proximaRetentativa && proximaRetentativa < falha.proxima ? proximaRetentativa : falha.proxima; continue; }
        // parou pelo teto: NÃO avança o marcador, a próxima rodada relê a mesma janela e pega as sobras
        if (feitas >= MAX_ATUALIZACOES_POR_RODADA) return { enviadas, falhas };
        feitas++;
        const { anexos, avisos } = await prepararAnexos(deps, e);
        const r = await postarCrm(deps, montarAtualizacao(ind, d.id, e, anexos, avisos));
        if (r.ok) {
          await ref.update({ crm_atualizacoes_enviadas: uniao(String(e.id)) });
          enviadas++;
        } else if (r.transitorio) {
          // rede, 401, 403, 429, 5xx: só reagenda; não conta tentativa nem desiste
          const t = planoDeTransporte(Number(falha?.t) || 0, agora);
          await ref.update({ [`crm_atu_falha_${e.id}`]: { n: Number(falha?.n) || 0, t: t.falhas, proxima: t.proxima, erro: r.erro }, crm_atu_retry: t.proxima });
          proximaRetentativa = t.proxima;
          falhas++;
        } else {
          const f = planoDeFalha(Number(falha?.n) || 0, agora);
          await ref.update({
            [`crm_atu_falha_${e.id}`]: { n: f.tentativas, t: Number(falha?.t) || 0, proxima: f.proxima, erro: r.erro },
            ...(f.desistiu ? { crm_atualizacoes_desistiu: uniao(String(e.id)) } : { crm_atu_retry: f.proxima }),
          });
          if (!f.desistiu) proximaRetentativa = f.proxima;
          falhas++;
        }
      }
      if (ind.crm_atu_retry && !proximaRetentativa) await ref.update({ crm_atu_retry: null });
    }
    // só depois de processar tudo: o marcador novo vale a partir do INÍCIO desta rodada
    ultimaVarreduraAtu.set(deps.db, { completa: completa ? agora.getTime() : est.completa, rodada: agora.getTime() });
    return { enviadas, falhas };
  } finally { atualizacoesEmExecucao = false; }
}

// ---------- Fase 2: comissão ----------
let comissoesEmExecucao = false;
const JANELA_COMISSOES_MS = 14 * 24 * 60 * 60 * 1000;
const camposDaComissao = (c: any) => `${Number(c.value) || 0}|${Number(c.base_value_used) || 0}|${Number(c.rate_applied) || 0}|${Number(c.commissionable_value) || 0}|${Number(c.base_commission_value) || 0}`;

// Fontes de leitura, sem índice composto:
//  - crm_aguardando_paga == true: comissão já enviada que ainda espera o pagamento (qualquer idade: a "paga" nunca se perde);
//  - as 100 mais novas por created_at (pegam a recém-congelada ainda não enviada);
//  - criadas ou atualizadas nos últimos 14 dias (até 300 de cada).
// Comissão já concluída (enviada, sem "paga" pendente e sem mudança nos valores) é pulada ANTES de ler a indicação.
// Comissão de indicação que nunca foi ao CRM recebe crm_nao_aplica_em e deixa de custar leitura.
export async function rodarComissoesCrm(deps: DepsEntradaCrm): Promise<{ pulado?: string; enviadas: number; falhas: number }> {
  const cfg = deps.config();
  if (!podeEnviarAoCrm(cfg)) return { pulado: 'integracao_desligada', enviadas: 0, falhas: 0 };
  if (comissoesEmExecucao) return { pulado: 'rodada_anterior_em_andamento', enviadas: 0, falhas: 0 };
  comissoesEmExecucao = true;
  try {
    const agora = deps.agora ? deps.agora() : new Date();
    const desde = new Date(agora.getTime() - JANELA_COMISSOES_MS).toISOString();
    const col = () => deps.db.collection('commissions');
    const fontes = await Promise.all([
      col().where('crm_aguardando_paga', '==', true).get(),
      col().orderBy('created_at', 'desc').limit(100).get(),
      col().where('created_at', '>=', desde).orderBy('created_at', 'desc').limit(300).get(),
      col().where('updated_at', '>=', desde).orderBy('updated_at', 'desc').limit(300).get(),
    ]);
    const vistos = new Set<string>(); const docs: any[] = [];
    for (const f of fontes) for (const d of f.docs) if (!vistos.has(d.id)) { vistos.add(d.id); docs.push(d); }
    let enviadas = 0; let falhas = 0;
    const inds = new Map<string, any>();
    for (const d of docs) {
      const c = d.data() || {};
      if (c.crm_nao_aplica_em || c.crm_desistiu_em) continue;
      if (c.crm_comissao_enviada_em && (c.status !== 'paid' || c.crm_paga_enviada_em) && c.crm_comissao_campos === camposDaComissao(c)) continue;
      const ref = deps.db.collection('commissions').doc(d.id);
      const idInd = String(c.indication_id || d.id);
      if (!inds.has(idInd)) inds.set(idInd, (await deps.db.collection('indications').doc(idInd).get()).data() || null);
      const ind = inds.get(idInd);
      if (!ind || (!ind.crm_enviado_em && !STATUS_ENVIAVEIS.includes(String(ind.status)))) {
        await ref.update({ crm_nao_aplica_em: agora.toISOString() });
        continue;
      }
      if (!ind.crm_enviado_em) continue; // ainda vai ao CRM como indicação: espera
      // O número do pedido do PRIMEIRO envio é o que o CRM conhece (ele trata por id_externo + pedido_numero): se mudar
      // depois, os reenvios seguem com o número antigo e a divergência é registrada no histórico interno.
      const pedidoEnviado = String(c.crm_comissao_pedido_numero || '').trim() || undefined;
      const pedidoAtual = String(ind.sale_order_number ?? '').trim();
      if (pedidoEnviado && pedidoAtual && pedidoAtual !== pedidoEnviado && c.crm_pedido_divergente_registrado !== pedidoAtual) {
        await deps.db.collection('indications').doc(idInd).update({
          negotiation_history: (deps.arrayUnion || ((...v: any[]) => v))({
            id: `crm-pedido-divergiu-${d.id}-${pedidoAtual}`.replace(/[^A-Za-z0-9_-]/g, '_'), type: 'system', author_name: 'Sistema', created_at: agora.toISOString(),
            content: `O número do pedido mudou para ${pedidoAtual} depois de a comissão ir ao CRM. O CRM segue com o número ${pedidoEnviado}.`,
          }),
        });
        await ref.update({ crm_pedido_divergente_registrado: pedidoAtual });
        c.crm_pedido_divergente_registrado = pedidoAtual;
      }
      const pComissao = montarComissao(c, d.id, ind, pedidoEnviado);
      const assinatura = pComissao ? assinaturaDaComissao(pComissao) : '';
      const comissaoPendente = !!pComissao && (!c.crm_comissao_enviada_em || (!!c.crm_comissao_assinatura && c.crm_comissao_assinatura !== assinatura));
      const pPaga = c.status === 'paid' && !c.crm_paga_enviada_em ? montarComissaoPaga(c, d.id, ind, pedidoEnviado) : null;
      const passos: { corpo: any; ok: Record<string, any>; tent: string; prox: string; trans: string }[] = [];
      // crm_aguardando_paga fica true mesmo se a comissão já nasceu paga: a "paga" nunca depende só das 300 mais novas
      if (comissaoPendente) passos.push({ corpo: pComissao, tent: 'crm_comissao_tentativas', trans: 'crm_comissao_transporte', prox: 'crm_comissao_proxima', ok: { crm_comissao_enviada_em: agora.toISOString(), crm_comissao_assinatura: assinatura, crm_comissao_campos: camposDaComissao(c), crm_comissao_pedido_numero: pedidoEnviado || pComissao!.pedido_numero, crm_comissao_proxima: null, crm_aguardando_paga: true } });
      if (pPaga && (c.crm_comissao_enviada_em || comissaoPendente)) passos.push({ corpo: pPaga, tent: 'crm_paga_tentativas', trans: 'crm_paga_transporte', prox: 'crm_paga_proxima', ok: { crm_paga_enviada_em: agora.toISOString(), crm_paga_proxima: null, crm_aguardando_paga: false } });
      if (!passos.length && c.crm_comissao_enviada_em && pComissao && c.crm_comissao_campos !== camposDaComissao(c)) await ref.update({ crm_comissao_campos: camposDaComissao(c) }); // comissão enviada antes desta marca
      for (const p of passos) {
        if (enviadas + falhas >= MAX_COMISSOES_POR_RODADA) return { enviadas, falhas };
        if (c[p.prox] && new Date(c[p.prox]).getTime() > agora.getTime()) break;
        const r = await postarCrm(deps, p.corpo);
        if (r.ok) { await ref.update(p.ok); enviadas++; }
        else if (r.transitorio) {
          // rede, 401, 403, 429, 5xx: só reagenda; não conta tentativa nem desiste
          const t = planoDeTransporte(Number(c[p.trans]) || 0, agora);
          await ref.update({ [p.trans]: t.falhas, [p.prox]: t.proxima, crm_ultimo_erro: r.erro });
          falhas++;
          break;
        } else {
          const f = planoDeFalha(Number(c[p.tent]) || 0, agora);
          await ref.update({ [p.tent]: f.tentativas, [p.prox]: f.proxima, crm_ultimo_erro: r.erro, ...(f.desistiu ? { crm_desistiu_em: agora.toISOString() } : {}) });
          falhas++;
          break; // a "paga" só vai depois da "comissao"
        }
      }
    }
    return { enviadas, falhas };
  } finally { comissoesEmExecucao = false; }
}

// ---------- Reativar o que desistiu ----------
// Ação de admin: depois de 10 falhas o laço desiste; isto zera a desistência para tentar de novo.
export async function reativarDesistidasCrm(deps: DepsEntradaCrm): Promise<{ indicacoes: number; comissoes: number }> {
  const ind = await deps.db.collection('indications').where('crm_desistiu_em', '>', '').get();
  for (const d of ind.docs) {
    const x = d.data() || {};
    const limpar: Record<string, any> = {
      crm_desistiu_em: null, crm_tentativas: 0, crm_proxima_tentativa_em: null, crm_ultimo_erro: null, crm_reservado_ate: null,
    };
    if (Array.isArray(x.crm_atualizacoes_desistiu)) limpar.crm_atualizacoes_desistiu = [];
    for (const k of Object.keys(x)) if (k.startsWith('crm_atu_falha_')) limpar[k] = null;
    await deps.db.collection('indications').doc(d.id).update(limpar);
  }
  const com = await deps.db.collection('commissions').where('crm_desistiu_em', '>', '').get();
  for (const d of com.docs) {
    await deps.db.collection('commissions').doc(d.id).update({
      crm_desistiu_em: null, crm_comissao_tentativas: 0, crm_comissao_transporte: 0, crm_comissao_proxima: null, crm_paga_tentativas: 0, crm_paga_transporte: 0, crm_paga_proxima: null, crm_ultimo_erro: null,
    });
  }
  return { indicacoes: ind.docs.length, comissoes: com.docs.length };
}

// ---------- Rotas de administração ----------
export function registrarRotasAdminCrm(app: any, deps: DepsEntradaCrm & { exigirAdmin: (req: any, res: any) => Promise<any> }) {
  app.get('/api/admin/crm/estado', async (req: any, res: any) => {
    if (!(await deps.exigirAdmin(req, res))) return;
    try {
      const cfg = deps.config();
      const desde = (await lerDataDaVirada(deps.db)) || cfg.ativoDesde;
      let host = '';
      try { host = new URL(cfg.url).host; } catch { /* url inválida */ }
      const sim = await cargaInicialCrm(deps, { simulacao: true });
      const cfgDoc = (await deps.db.collection('settings').doc(DOC_CONFIG_CRM).get()).data() || {};
      const desistiram = (await deps.db.collection('indications').where('crm_desistiu_em', '>', '').get()).docs.length;
      return res.json({
        ok: true, ativo: cfg.ativo, tem_chave: !!cfg.chave, tem_segredo: !!cfg.segredo, destino: host, url_valida: cfg.urlValida,
        ativo_desde: desde, pode_carga: podeCargaAoCrm(cfg), pendentes_da_carga: sim && sim.ok ? sim.elegiveis : null,
        pendentes_como_novas: sim && sim.ok ? (sim as any).pendentes_novas : null, desistiram,
        carga_em_negociacao: sim && sim.ok ? (sim as any).em_negociacao : null, carga_vendidas: sim && sim.ok ? (sim as any).vendidas : null, carga_total: sim && sim.ok ? (sim as any).total_carga : null,
        alerta_transporte: cfgDoc.alerta_transporte || null, carga_inicial_em: cfgDoc.carga_inicial_em || null,
      });
    } catch (e: any) { return res.status(500).json({ ok: false, error: e?.message || 'Erro.' }); }
  });

  app.post('/api/admin/crm/carga-inicial', async (req: any, res: any) => {
    if (!(await deps.exigirAdmin(req, res))) return;
    try {
      const r = await cargaInicialCrm(deps, { simulacao: req.body?.simulacao === true, limite: Number(req.body?.limite) || undefined });
      return res.status(r.ok ? 200 : (r as any).status).json(r);
    } catch (e: any) {
      (deps.log || console.error)('[CRM-CARGA] Erro:', e?.message);
      return res.status(500).json({ ok: false, error: 'Não consegui concluir a carga. Tente de novo.' });
    }
  });

  app.post('/api/admin/crm/reativar', async (req: any, res: any) => {
    if (!(await deps.exigirAdmin(req, res))) return;
    try { return res.json({ ok: true, ...(await reativarDesistidasCrm(deps)) }); }
    catch (e: any) { (deps.log || console.error)('[CRM-REATIVAR] Erro:', e?.message); return res.status(500).json({ ok: false, error: 'Não consegui reativar. Tente de novo.' }); }
  });
}
