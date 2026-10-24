// CRM -> Indica: recebe o andamento da indicação (POST /api/crm/eventos) e aplica na indicação.
// As regras de cada evento estão em src/lib/crmEventos.ts (funções puras); aqui ficam a assinatura,
// a idempotência (crm_eventos/{id}), a leitura do contexto e a gravação numa transação.
// Documentação: docs/integracao-crm.md
//
// Códigos de resposta (o CRM reenvia em 5xx, até 8 vezes):
//   503 integração desligada (CRM_ATIVO) ou CRM_SEGREDO ausente
//   401 assinatura inválida, ausente ou timestamp com mais de 5 minutos de diferença
//   400 corpo que não é JSON ou sem id, evento e id_externo
//   200 aplicado, ignorado (com o motivo) ou repetido; erro transitório do banco: 500
import { podeReceberDoCrm, type ConfigCrm } from '../src/lib/crmIntegracao';
import { EVENTOS_CRM, parceiroEhPessoa, planejarEvento, type EventoCrm, type Plano } from '../src/lib/crmEventos';
import { normalizarItensCrm } from '../src/lib/crmFaturamento';
import { verificarAssinaturaCrm } from './crmAssinatura';

export type DepsEventosCrm = {
  db: any;
  arrayUnion: (...v: any[]) => any;
  config: () => ConfigCrm;
  agora?: () => Date;
  log?: (...a: any[]) => void;
};

export type RespostaCrm = { status: number; body: any };

const ID_SIMPLES = /^[A-Za-z0-9_-]{1,128}$/;
const docIdEvento = (id: string) => String(id).replace(/[\/\s]/g, '_').slice(0, 200);
const norm = (v: any) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9@._]+/g, ' ').trim();

const PAPEIS_GESTAO_VENDA = ['admin', 'manager'];
const PAPEIS_CONFERENCIA = ['admin', 'manager', 'financial', 'finance'];

// ---------- Contexto ----------
async function catalogoDosItens(db: any, itensBrutos: any): Promise<Record<string, { is_commissionable?: boolean }>> {
  const codigos = Array.from(new Set(normalizarItensCrm(itensBrutos).map(i => i.code).filter(Boolean)));
  const out: Record<string, { is_commissionable?: boolean }> = {};
  for (const code of codigos) {
    const s = await db.collection('registered_products').where('code', '==', code).get();
    if (!s.empty) {
      // cadastro repetido do código: basta um dizer que NÃO conta para não contar; ausente = conta
      const flags = s.docs.map((d: any) => (d.data() || {}).is_commissionable);
      out[code] = { is_commissionable: flags.includes(false) ? false : undefined };
    }
  }
  return out;
}

async function nomesDeOutrosParceiros(db: any, uidDoDono: string): Promise<string[]> {
  const s = await db.collection('users').where('role', '==', 'external_seller').get();
  return s.docs.filter((d: any) => d.id !== uidDoDono).map((d: any) => String(d.data()?.name || '')).filter(Boolean);
}

export async function resolverVendedora(db: any, d: any): Promise<{ uid?: string; name: string; email?: string | null } | null> {
  const v = d?.vendedora ?? d?.vendedora_nome ?? d?.responsavel;
  const nome = String(typeof v === 'string' ? v : v?.nome ?? v?.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const email = String(d?.vendedora_email ?? (typeof v === 'object' ? v?.email : '') ?? '').trim().toLowerCase();
  const uid = String(d?.vendedora_uid ?? (typeof v === 'object' ? v?.uid : '') ?? '').trim();
  const dePerfil = (id: string, u: any) => ({ uid: id, name: String(u?.name || nome), email: u?.email || null });
  if (uid && ID_SIMPLES.test(uid)) {
    const s = await db.collection('users').doc(uid).get();
    if (s.exists && s.data()?.status !== 'inactive') return dePerfil(s.id, s.data());
  }
  if (email) {
    const s = await db.collection('users').where('email', '==', email).get();
    const achado = s.docs.find((x: any) => x.data()?.status !== 'inactive');
    if (achado) return dePerfil(achado.id, achado.data());
  }
  if (nome) {
    const alvo = norm(nome);
    const s = await db.collection('users').where('role', '==', 'internal_seller').get();
    const achados = s.docs.filter((x: any) => norm(x.data()?.name) === alvo && x.data()?.status !== 'inactive');
    if (achados.length === 1) return dePerfil(achados[0].id, achados[0].data());
    return { name: nome }; // sem cadastro casando: o nome vale para o texto, mas não vira dona da indicação
  }
  return null;
}

async function usuariosPorPapel(db: any, papeis: string[]): Promise<string[]> {
  const s = await db.collection('users').where('role', 'in', papeis).get();
  return s.docs.filter((d: any) => (d.data()?.status ?? 'active') === 'active').map((d: any) => d.id);
}

async function enviarNotificacoes(deps: DepsEventosCrm, ind: any, plano: Plano, vendedoraUid: string | null | undefined, agora: Date) {
  const { db } = deps;
  const link = '/indicacoes';
  for (const n of plano.notificacoes) {
    try {
      const destinos: string[] = n.para === 'parceiro' ? [String(ind.external_seller_uid || '')]
        : n.para === 'vendedora' ? [String(vendedoraUid || '')]
        : await usuariosPorPapel(db, plano.conferencia ? PAPEIS_CONFERENCIA : PAPEIS_GESTAO_VENDA);
      for (const uid of Array.from(new Set(destinos.filter(Boolean)))) {
        await db.collection('notifications').add({ user_uid: uid, title: n.titulo, message: n.mensagem, type: n.tipo, read: false, link, created_at: agora.toISOString(), origem: 'crm' });
      }
    } catch (e: any) {
      // a indicação já foi gravada; aviso que não saiu não pode virar reenvio do evento
      (deps.log || console.error)('[CRM-EVENTOS] Notificação não enviada:', e?.message);
    }
  }
}

// ---------- Processamento ----------
export async function processarEventoCrm(deps: DepsEventosCrm, ev: EventoCrm): Promise<RespostaCrm> {
  const { db } = deps;
  const log = deps.log || console.log;
  const agora = deps.agora ? deps.agora() : new Date();
  const eventoRef = db.collection('crm_eventos').doc(docIdEvento(ev.id));

  const anterior = await eventoRef.get();
  if (anterior.exists && anterior.data()?.processado_em) return { status: 200, body: { ok: true, duplicado: true } };

  const registrar = async (resultado: 'aplicado' | 'ignorado', motivo: string | undefined, plano?: Plano) => {
    let dadosGravados: string | null = null;
    try { const j = JSON.stringify(ev.dados ?? null); dadosGravados = j.length > 20000 ? `${j.slice(0, 20000)}…` : j; } catch { /* sem dados */ }
    await eventoRef.set({
      id: ev.id, evento: ev.evento, id_externo: ev.id_externo, parceiro_id: ev.parceiro_id ?? null,
      resultado, motivo: motivo ?? null, processado_em: agora.toISOString(), em: ev.em ?? null, dados: dadosGravados,
      ...(plano?.conferencia ? { conferencia: plano.conferencia } : {}),
    });
  };

  if (!(EVENTOS_CRM as readonly string[]).includes(ev.evento)) {
    await registrar('ignorado', 'evento_desconhecido');
    return { status: 200, body: { ok: true, resultado: 'ignorado', motivo: 'evento_desconhecido' } };
  }

  const indRef = db.collection('indications').doc(ev.id_externo);
  const previa = await indRef.get();
  if (!previa.exists) {
    await registrar('ignorado', 'indicacao_nao_encontrada');
    log(`[CRM-EVENTOS] ${ev.evento} ${ev.id}: indicação ${ev.id_externo} não existe.`);
    return { status: 200, body: { ok: true, resultado: 'ignorado', motivo: 'indicacao_nao_encontrada' } };
  }
  const indPrevia = previa.data() || {};
  const donoUid = String(indPrevia.external_seller_uid || '');
  // O evento é de outro parceiro que não o da indicação: não aplica (evita trocar andamento de lugar).
  if (ev.parceiro_id && donoUid && String(ev.parceiro_id) !== donoUid) {
    await registrar('ignorado', 'parceiro_diferente');
    log(`[CRM-EVENTOS] ${ev.evento} ${ev.id}: parceiro_id do evento difere do da indicação ${ev.id_externo}.`);
    return { status: 200, body: { ok: true, resultado: 'ignorado', motivo: 'parceiro_diferente' } };
  }

  // Contexto fora da transação (leituras que não dependem da versão atual da indicação)
  const d = ev.dados && typeof ev.dados === 'object' ? ev.dados : {};
  const parceiro = parceiroEhPessoa(indPrevia) ? ((await db.collection('users').doc(donoUid).get()).data() || null) : null;
  const vendedora = ev.evento === 'indicacao.aceita' ? await resolverVendedora(db, d) : null;
  const textoLivre = ['indicacao.recusada', 'negocio.perdido', 'negocio.etapa'].includes(ev.evento);
  const nomesOutrosParceiros = textoLivre ? await nomesDeOutrosParceiros(db, donoUid) : [];
  const catalogo = ['pedido.lancado', 'pedido.faturado'].includes(ev.evento) ? await catalogoDosItens(db, d.itens) : {};

  const commRef = db.collection('commissions').doc(ev.id_externo);
  const feito = await db.runTransaction(async (tx: any) => {
    const s = await tx.get(indRef);
    if (!s.exists) return { plano: null as Plano | null, ind: null as any };
    const ind = { id: s.id, ...s.data() };
    let comissaoExistente = false;
    if (ev.evento === 'pedido.faturado') {
      const c = await tx.get(commRef);
      const legado = await tx.get(db.collection('commissions').where('indication_id', '==', ev.id_externo));
      comissaoExistente = c.exists || !legado.empty;
    }
    const plano = planejarEvento(ind, ev, { agora, parceiro, vendedora, nomesOutrosParceiros, catalogo, comissaoExistente });
    if (plano.resultado === 'aplicado') {
      tx.update(indRef, {
        ...plano.campos,
        ...(plano.historico.length ? { negotiation_history: deps.arrayUnion(...plano.historico) } : {}),
      });
      if (plano.comissao) tx.set(commRef, plano.comissao);
    }
    return { plano, ind };
  });

  if (!feito.plano) {
    await registrar('ignorado', 'indicacao_nao_encontrada');
    return { status: 200, body: { ok: true, resultado: 'ignorado', motivo: 'indicacao_nao_encontrada' } };
  }
  const { plano, ind } = feito;
  if (plano.resultado === 'aplicado') await enviarNotificacoes(deps, ind, plano, vendedora?.uid, agora);
  else log(`[CRM-EVENTOS] ${ev.evento} ${ev.id} ignorado (${plano.motivo}) na indicação ${ev.id_externo}.`);
  await registrar(plano.resultado, plano.motivo, plano);
  return { status: 200, body: { ok: true, resultado: plano.resultado, ...(plano.motivo ? { motivo: plano.motivo } : {}), ...(plano.conferencia ? { aguardando_conferencia: true } : {}) } };
}

// ---------- Requisição ----------
export async function tratarRequisicaoCrm(deps: DepsEventosCrm, req: { headers: Record<string, any>; corpo: Buffer }): Promise<RespostaCrm> {
  const cfg = deps.config();
  if (!podeReceberDoCrm(cfg)) return { status: 503, body: { ok: false, error: 'Integração com o CRM desligada ou sem segredo configurado.' } };

  const h = (n: string) => { const v = req.headers[n]; return Array.isArray(v) ? v[0] : v; };
  const ver = verificarAssinaturaCrm({ segredo: cfg.segredo, timestamp: h('x-roder-timestamp'), assinatura: h('x-roder-assinatura'), corpo: req.corpo, agora: deps.agora ? deps.agora() : undefined });
  if (!ver.ok) return { status: ver.status, body: { ok: false, error: 'Assinatura inválida.' } };

  let json: any;
  try { json = JSON.parse(req.corpo.toString('utf8')); } catch { return { status: 400, body: { ok: false, error: 'Corpo não é JSON.' } }; }
  const id = typeof json?.id === 'string' ? json.id.trim() : '';
  const evento = typeof json?.evento === 'string' ? json.evento.trim() : '';
  const idExterno = typeof json?.id_externo === 'string' ? json.id_externo.trim() : '';
  if (!id || id.length > 200 || !evento || !ID_SIMPLES.test(idExterno)) return { status: 400, body: { ok: false, error: 'Faltam id, evento ou id_externo válidos.' } };

  try {
    return await processarEventoCrm(deps, {
      id, evento, id_externo: idExterno,
      em: typeof json.em === 'string' ? json.em : undefined,
      parceiro_id: json.parceiro_id == null ? null : String(json.parceiro_id),
      dados: json.dados,
    });
  } catch (e: any) {
    // Erro transitório (banco): 5xx para o CRM reenviar. Nada foi marcado como processado.
    (deps.log || console.error)('[CRM-EVENTOS] Erro ao processar:', e?.message);
    return { status: 500, body: { ok: false, error: 'Erro ao processar. Reenvie.' } };
  }
}

// Precisa ser registrada ANTES do express.json() global do server.ts: a assinatura é do corpo cru.
export function registrarRotaEventosCrm(app: any, express: any, deps: DepsEventosCrm) {
  app.post('/api/crm/eventos', express.raw({ type: () => true, limit: '2mb' }), async (req: any, res: any) => {
    const r = await tratarRequisicaoCrm(deps, { headers: req.headers, corpo: Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0) });
    res.setHeader('Cache-Control', 'no-store');
    res.status(r.status).json(r.body);
  });
}
