// Indica -> CRM: envia cada indicação nova ao CRM do Roder Vision, com fila, backoff e reserva.
// Três entradas, todas pelo mesmo envio (enviarIndicacaoAoCrm):
//   - laço de 1 minuto (rodarFilaCrm), só indicações criadas depois da virada;
//   - carga inicial (cargaInicialCrm), uma vez, para as indicações abertas que já existiam;
//   - (futuro) atualizações do parceiro e comissão: ver GANCHOS no fim deste arquivo.
// Documentação: docs/integracao-crm.md
import {
  RESERVA_ENVIO_MS, STATUS_ENVIAVEIS, montarPayloadIndicacao, motivoNaoEnviarNaCarga, motivoNaoEnviarNoLaco, planoDeFalha, podeEnviarAoCrm,
  type ConfigCrm,
} from '../src/lib/crmIntegracao';

export type DepsEntradaCrm = {
  db: any;
  config: () => ConfigCrm;
  fetchFn?: (url: string, init: any) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;
  agora?: () => Date;
  log?: (...a: any[]) => void;
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
  try {
    await ref.create({ ativo_desde: agora, criado_em: agora });
    return agora;
  } catch (e: any) {
    if (e?.code === 6 || /ALREADY_EXISTS|already exists/i.test(String(e?.message))) {
      const s = await ref.get();
      const v = s.data()?.ativo_desde;
      if (v && !Number.isNaN(new Date(v).getTime())) return new Date(v).toISOString();
      // doc existe sem data: completa sem sobrescrever outras chaves
      await ref.set({ ativo_desde: agora }, { merge: true });
      return agora;
    }
    throw e;
  }
}

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
    notificarEmail: ctx.modo === 'laco' ? cfg.notificarEmail : null,
    jaEmNegociacao: ctx.modo === 'carga' && ind.status === 'negotiating',
  });

  // 3. POST
  let status = 0; let corpoResp = ''; let erroRede = '';
  try {
    const f = deps.fetchFn || ((url: string, init: any) => fetch(url, init));
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_ENVIO_MS);
    try {
      const r = await f(cfg.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-roder-chave': cfg.chave },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      status = r.status;
      corpoResp = await r.text().catch(() => '');
    } finally { clearTimeout(t); }
  } catch (e: any) {
    erroRede = e?.name === 'AbortError' ? 'tempo esgotado' : String(e?.message || 'falha de rede').slice(0, 120);
  }

  // 4. Resultado
  if (status >= 200 && status < 300) {
    let crmId: string | null = null;
    try { const j = JSON.parse(corpoResp); if (j && j.ok !== false && j.id != null) crmId = String(j.id); } catch { /* resposta sem JSON: segue */ }
    await ref.update({ crm_enviado_em: agora().toISOString(), crm_id: crmId, crm_reservado_ate: null, crm_ultimo_erro: null, crm_proxima_tentativa_em: null });
    return { id: indId, resultado: 'enviada', status };
  }
  const falha = planoDeFalha(Number(ind.crm_tentativas) || 0, agora());
  const erro = (erroRede || `HTTP ${status}`).slice(0, 160); // nunca grava o corpo da resposta nem o cabeçalho enviado
  await ref.update({
    crm_tentativas: falha.tentativas,
    crm_ultimo_erro: erro,
    crm_ultima_tentativa_em: agora().toISOString(),
    crm_reservado_ate: null,
    crm_proxima_tentativa_em: falha.proxima,
    ...(falha.desistiu ? { crm_desistiu_em: agora().toISOString() } : {}),
  });
  if (status === 401 || status === 403) log('[CRM-ENVIO] O CRM recusou a chave (CRM_CHAVE). Confira a chave configurada.');
  return { id: indId, resultado: falha.desistiu ? 'desistiu' : 'falhou', motivo: erro, status };
}

// ---------- Laço de 1 minuto ----------
let emExecucao = false;

// Lê as indicações mais recentes (janela de 72 h, sempre depois da virada) por created_at, que não
// exige índice composto, e filtra em memória: where('crm_enviado_em','==',null) NÃO casa campo
// inexistente, e é exatamente o caso das indicações novas.
export async function listarCandidatasDoLaco(db: any, ativoDesde: string, agora: Date): Promise<{ id: string; data: any }[]> {
  const limite = new Date(Math.max(new Date(ativoDesde).getTime(), agora.getTime() - JANELA_DO_LACO_MS)).toISOString();
  // Faixa e ordem no MESMO campo (created_at): não pede índice composto. Mais antigas primeiro, que é a
  // ordem em que os parceiros indicaram; o teto só pesa se houver mais de LIMITE_DO_LACO indicações em 72 h.
  const s = await db.collection('indications').where('created_at', '>=', limite).orderBy('created_at').limit(LIMITE_DO_LACO).get();
  const achadas: { id: string; data: any }[] = [];
  for (const d of s.docs) {
    const data = d.data() || {};
    if (!motivoNaoEnviarNoLaco(data, { ativoDesde, agora })) achadas.push({ id: d.id, data });
  }
  return achadas;
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
    const candidatas = await listarCandidatasDoLaco(deps.db, desde, agora);
    const resultados: ResultadoEnvio[] = [];
    for (const c of candidatas.slice(0, MAX_POR_RODADA)) {
      resultados.push(await enviarIndicacaoAoCrm(deps, c.id, { modo: 'laco', ativoDesde: desde }));
    }
    return { resultados };
  } finally { emExecucao = false; }
}

// ---------- Carga inicial ----------
// Indicações abertas (pending, triagem, negotiating) que ainda não foram enviadas. As VENDIDAS não vão:
// já estão fechadas e pagas/faturadas no Indica, e entrariam no CRM como lead novo para a triagem
// (ou como venda duplicada do que o CRM já tem por fora). Se um relatório precisar delas, é outra rotina.
export async function cargaInicialCrm(deps: DepsEntradaCrm, o: { simulacao?: boolean; limite?: number } = {}) {
  const cfg = deps.config();
  if (!o.simulacao && !podeEnviarAoCrm(cfg)) return { ok: false as const, status: 409, error: 'Ligue CRM_ATIVO=1 e configure CRM_CHAVE antes de enviar. Use a simulação para só contar.' };
  const agora = deps.agora ? deps.agora() : new Date();
  const s = await deps.db.collection('indications').where('status', 'in', STATUS_ENVIAVEIS).get();
  const elegiveis: { id: string; status: string; criada: string }[] = [];
  const porMotivo: Record<string, number> = {};
  for (const d of s.docs) {
    const data = d.data() || {};
    const m = motivoNaoEnviarNaCarga(data, { agora });
    if (m) { porMotivo[m] = (porMotivo[m] || 0) + 1; continue; }
    elegiveis.push({ id: d.id, status: String(data.status), criada: String(data.created_at || '') });
  }
  elegiveis.sort((a, b) => a.criada.localeCompare(b.criada));
  const porStatus: Record<string, number> = {};
  elegiveis.forEach(e => { porStatus[e.status] = (porStatus[e.status] || 0) + 1; });
  if (o.simulacao) return { ok: true as const, simulacao: true, elegiveis: elegiveis.length, por_status: porStatus, descartadas: porMotivo };

  const limite = Math.min(Math.max(Math.floor(o.limite || 40), 1), 100);
  const lote = elegiveis.slice(0, limite);
  const resultados: ResultadoEnvio[] = [];
  for (const e of lote) resultados.push(await enviarIndicacaoAoCrm(deps, e.id, { modo: 'carga', ativoDesde: null }));
  const enviadas = resultados.filter(r => r.resultado === 'enviada').length;
  return {
    ok: true as const, simulacao: false, elegiveis: elegiveis.length, tentadas: lote.length, enviadas,
    falhas: resultados.filter(r => r.resultado === 'falhou' || r.resultado === 'desistiu').length,
    // quantas ainda faltam: o botão pode ser apertado de novo até zerar
    restantes: Math.max(elegiveis.length - enviadas, 0),
  };
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
      const sim = cfg.ativo ? await cargaInicialCrm(deps, { simulacao: true }) : null;
      return res.json({
        ok: true, ativo: cfg.ativo, tem_chave: !!cfg.chave, tem_segredo: !!cfg.segredo, destino: host, url_valida: cfg.urlValida,
        ativo_desde: desde, pendentes_da_carga: sim && sim.ok ? sim.elegiveis : null,
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
}

// ---------- GANCHOS (próxima fase, NÃO implementados) ----------
// - tipo "atualizacao": o parceiro acrescenta texto, áudio ou fotos a uma indicação já enviada. Entraria
//   aqui como enviarAtualizacaoAoCrm(deps, indId, entradaDoHistorico), com fila própria (crm_fila).
// - tipo "comissao" / "comissao_paga": avisar o CRM do valor liberado e do pagamento. Sairia de
//   server/relatoriosComissao.ts e do fechamento mensal, reaproveitando enviarIndicacaoAoCrm() e a mesma reserva/backoff.
// Quando existirem, o corpo de cada um precisa do mesmo id_externo (id da indicação) e do parceiro.id.
