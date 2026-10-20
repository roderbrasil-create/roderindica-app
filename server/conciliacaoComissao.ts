// Correção automática de comissão (sem botão nenhum, pedido do Jeferson em 20/10/2026).
// Nasceu do caso "Rafael - MAQLOC": venda faturada no nome dele e o painel mostrando R$ 0,00,
// porque a comissão ficou num código antigo (cadastro provisório apagado no primeiro acesso, ou
// cadastro repetido). O painel soma commissions pelo uid do parceiro: comissão em outro uid some.
//
// A regra: QUEM RECEBE É QUEM ESTÁ NA INDICAÇÃO. Toda comissão cujo uid difere do parceiro da
// indicação vai para ele, pelo mesmo transferirIndicacao do "Trocar Indicador" (mesmas travas).
// Antes disso, indicação ligada a cadastro provisório (temp_, phone_) ou a código que não existe
// mais passa para a conta definitiva quando o e-mail (ou o nome exato) aponta para UMA conta só:
// é o mesmo que o primeiro acesso (reivindicar-perfil) faria se a pessoa entrasse de novo.
// Venda faturada recente sem comissão nenhuma ganha a comissão pela mesma conta do faturamento
// (gerarComissao, src/lib/calculoComissao.ts).
//
// Nunca mexe em comissão paga ou aguardando pagamento, nem quando o fechamento de um dos lados já
// está pago ou aguardando pagamento: aí a nota fiscal saiu em nome de uma conta, e mudar só o
// código deixaria fechamento e comissão discordando. Esses casos ficam no relatório ("travadas").
// Roda no início do servidor e todo dia; é idempotente: a segunda rodada não acha nada para fazer.
import { transferirIndicacao, gerarComissao, normalizar, UIDS_DE_SISTEMA } from './diagnosticoComissao';
import { calcularComissao, taxaDoParceiro, mesDaComissao } from '../src/lib/calculoComissao';

type Deps = { db: any; arrayUnion: (...v: any[]) => any; agora?: () => Date; log?: (...a: any[]) => void };

export type Movida = { indicacao_id: string; cliente: string; parceiro: string; de_uid: string | null; de_nome: string | null; para_uid: string; comissoes: number; valor: number; motivo: string };
export type Criada = { indicacao_id: string; cliente: string; parceiro: string; valor: number; month: number; year: number };
export type Travada = { indicacao_id: string | null; cliente: string; parceiro: string; motivo: string };
export type ResultadoConciliacao = {
  rodada_em: string; terminou_em: string; origem: string;
  movidas: Movida[]; criadas: Criada[]; travadas: Travada[]; erros: string[];
};

// Só o servidor lê e grava aqui (o navegador não tem regra para cron_locks)
export const DOC_TRAVA = 'conciliacao_comissao_rodando';
export const DOC_RESULTADO = 'conciliacao_comissao_resultado';
const TRAVA_VELHA_MS = 30 * 60 * 1000;
// Venda faturada há mais que isto sem comissão não ganha comissão sozinha: pode ser venda antiga,
// de antes do sistema de comissão, já acertada por fora. Aparece em "travadas" para alguém olhar.
export const DIAS_PARA_GERAR = 90;
// Indicação mexida há menos que isto fica para a próxima rodada: o estorno do faturamento apaga a
// comissão ANTES de tirar o status de faturada, e gerar ali desfaria o estorno.
const MINUTOS_SEM_MEXER = 30;
const MAX_HISTORICO = 100;

const AUTOR = { uid: 'sistema', nome: 'Correção automática' };
const ORIGEM = 'correção automática de comissão';
const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const ehProvisorio = (id: string) => /^(temp_|phone_)/.test(id);
const statusQueRecebe = (st: any) => !st || st === 'active' || st === 'pending';
// Só parceiro indicador recebe por aqui (papel vazio é parceiro antigo, como em papelComissionavel)
const papelQueRecebe = (role: any) => !role || role === 'external_seller';
const recebe = (u: any) => !!u && papelQueRecebe(u.role) && statusQueRecebe(u.status);
const travadoPorStatus = (st: any) => st === 'paid' || st === 'waiting_payment';

export async function conciliarComissoes(deps: Deps, origem = 'diária'): Promise<ResultadoConciliacao> {
  const { db } = deps;
  const log = deps.log || console.log;
  const agora = deps.agora ? deps.agora() : new Date();
  const res: ResultadoConciliacao = { rodada_em: agora.toISOString(), terminou_em: '', origem, movidas: [], criadas: [], travadas: [], erros: [] };

  const usersSnap = await db.collection('users').get();
  const porId = new Map<string, any>();
  const porUidCampo = new Map<string, any>();
  usersSnap.docs.forEach((d: any) => {
    const u = { ...(d.data() || {}), doc_id: d.id };
    porId.set(d.id, u);
    if (u.uid) porUidCampo.set(String(u.uid), u);
  });
  const usuario = (uid: string) => porId.get(uid) || porUidCampo.get(uid) || null;
  // contas definitivas que recebem comissão, por e-mail e por nome exato (sem acento, minúsculo)
  const definitivas = Array.from(porId.values()).filter(u => !ehProvisorio(u.doc_id) && recebe(u));
  const unica = (lista: any[]) => lista.length === 1 ? lista[0] : null;
  const porEmail = (e: string) => e ? unica(definitivas.filter(u => String(u.email || '').toLowerCase().trim() === e)) : null;
  const porNome = (n: string) => n ? unica(definitivas.filter(u => normalizar(u.name) === n)) : null;

  const indSnap = await db.collection('indications')
    .select('status', 'client_name', 'external_seller_uid', 'external_seller_name', 'external_seller_email', 'sale_date', 'updated_at', 'commissioned_products', 'discount_amount', 'delivery_date')
    .get();
  const indicacoes = new Map<string, any>();
  indSnap.docs.forEach((d: any) => indicacoes.set(d.id, d.data() || {}));

  const commSnap = await db.collection('commissions').get();
  const comissoesPorInd = new Map<string, any[]>();
  for (const c of commSnap.docs) {
    const cd = c.data() || {};
    const indId = String(cd.indication_id || '');
    if (!indId || !indicacoes.has(indId)) {
      // sem indicação não há como saber quem recebe: só avisa se está num código que não existe
      const u = cd.external_seller_uid ? usuario(String(cd.external_seller_uid)) : null;
      if (!u && !travadoPorStatus(cd.status)) res.travadas.push({ indicacao_id: indId || null, cliente: '', parceiro: cd.external_seller_name || cd.external_seller_uid || '-', motivo: `Comissão ${c.id} de ${brl(Number(cd.value) || 0)} sem indicação e num código que não existe mais no cadastro.` });
      continue;
    }
    if (!comissoesPorInd.has(indId)) comissoesPorInd.set(indId, []);
    comissoesPorInd.get(indId)!.push({ id: c.id, ref: c.ref, ...cd });
  }

  const fechamentoTravado = async (uid: string, m: any, a: any) => {
    if (!uid || !m || !a) return null;
    const f = await db.collection('monthly_statements').doc(`${uid}_${m}_${a}`).get();
    const fd = f.exists ? (f.data() || {}) : null;
    return fd && travadoPorStatus(fd.status) ? fd : null;
  };

  for (const [indId, ind] of indicacoes) {
    const comms = comissoesPorInd.get(indId) || [];
    const uidInd = String(ind.external_seller_uid || '');
    const cliente = String(ind.client_name || '');
    if (!uidInd || UIDS_DE_SISTEMA.includes(uidInd)) continue;

    // 1. Parceiro de destino: o da indicação, ou a conta definitiva de um provisório que sobrou
    let atual = usuario(uidInd);
    let destino = atual;
    let motivo = 'a comissão estava em outro código, e quem recebe é o parceiro da indicação';
    if (!atual || ehProvisorio(atual.doc_id)) {
      const email = String((atual && atual.email) || ind.external_seller_email || '').toLowerCase().trim();
      const nome = normalizar((atual && atual.name) || ind.external_seller_name);
      const pelaConta = porEmail(email);
      const pelaNome = pelaConta ? null : porNome(nome);
      const achada = pelaConta || pelaNome;
      if (achada) {
        destino = achada;
        motivo = `a venda estava num cadastro ${atual ? 'provisório' : 'apagado'} e foi para a conta definitiva com o mesmo ${pelaConta ? 'e-mail' : 'nome'}`;
      } else if (!atual) {
        // código que não existe e sem conta certa para onde ir: só avisa quando há dinheiro parado
        if (ind.status === 'sold' || comms.length) res.travadas.push({ indicacao_id: indId, cliente, parceiro: ind.external_seller_name || uidInd, motivo: 'A venda está ligada a um código que não existe mais, e não há uma conta só com o mesmo e-mail ou nome para onde levar. Use "Trocar Indicador" na tela de Indicações.' });
        continue;
      }
    }
    const destUid = String(destino.uid || destino.doc_id);
    const nomeDest = destino.name || ind.external_seller_name || 'Parceiro';

    // 2. Indicação ou comissão fora do destino: tudo vai junto para ele
    const fora = comms.filter(c => c.external_seller_uid !== destUid);
    let mexiAgora = false;
    if (uidInd !== destUid || fora.length) {
      if (!recebe(destino)) {
        if (fora.length) res.travadas.push({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: `A comissão está em outro código, mas ${nomeDest} ${papelQueRecebe(destino.role) ? `está com o cadastro ${destino.status}` : 'é da equipe Roder'} e não recebe comissão.` });
        continue;
      }
      const presa = comms.find(c => travadoPorStatus(c.status));
      if (presa) {
        res.travadas.push({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: `A comissão de ${brl(Number(presa.value) || 0)} já está ${presa.status === 'paid' ? 'paga' : 'aguardando pagamento'} na conta ${presa.external_seller_name || presa.external_seller_uid}. Não foi mexida: a nota fiscal e o pagamento são dessa conta. Acerte com o financeiro.` });
        continue;
      }
      try {
        await transferirIndicacao(deps, indId, destino.doc_id, AUTOR, ORIGEM);
        const valor = Math.round(fora.reduce((a, c) => a + (Number(c.value) || 0), 0) * 100) / 100;
        const de = fora[0]?.external_seller_uid || uidInd;
        const deNome = fora[0]?.external_seller_name || (atual && atual.name) || ind.external_seller_name || null;
        res.movidas.push({ indicacao_id: indId, cliente, parceiro: nomeDest, de_uid: de || null, de_nome: deNome, para_uid: destUid, comissoes: fora.length, valor, motivo });
        log(`[CORRECAO-COMISSAO] ${cliente || indId}: ${fora.length} comissão(ões) de ${brl(valor)} de ${deNome || de} (${de}) para ${nomeDest} (${destUid}); ${motivo}.`);
        comms.forEach(c => { c.external_seller_uid = destUid; c.transferencia_pendente = null; });
        mexiAgora = true;
      } catch (e: any) {
        if (e?.status === 409) res.travadas.push({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: e.message });
        else res.erros.push(`${cliente || indId}: ${e?.message || e}`);
        continue;
      }
    }

    // a marca do primeiro acesso que sobrou numa comissão que já está no lugar certo
    for (const c of comms) {
      if (c.transferencia_pendente && c.external_seller_uid === destUid) {
        await c.ref.update({ transferencia_pendente: null, updated_at: agora.toISOString() });
      }
    }

    // 3. Venda faturada sem comissão nenhuma
    if (ind.status !== 'sold' || comms.length || !recebe(destino)) continue;
    const calc = calcularComissao(ind.commissioned_products || [], Number(ind.discount_amount) || 0, taxaDoParceiro(destino));
    if (calc.valor <= 0) {
      res.travadas.push({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: 'Venda faturada sem comissão, e os produtos da indicação não dão base de comissão (sem produto ou só kit, frete e instalação). Vincule os produtos vendidos.' });
      continue;
    }
    const mexida = Date.parse(ind.updated_at || '');
    if (!mexiAgora && Number.isFinite(mexida) && agora.getTime() - mexida < MINUTOS_SEM_MEXER * 60 * 1000) continue; // próxima rodada
    const dataVenda = Date.parse(String(ind.sale_date || '').slice(0, 10) + 'T12:00:00-03:00');
    const dias = Number.isFinite(dataVenda) ? (agora.getTime() - dataVenda) / 86400000 : Infinity;
    if (dias > DIAS_PARA_GERAR) {
      res.travadas.push({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: `Venda faturada sem comissão, com pedido de ${ind.sale_date ? String(ind.sale_date).slice(0, 10).split('-').reverse().join('/') : 'data desconhecida'}: antiga demais para lançar sozinha (mais de ${DIAS_PARA_GERAR} dias). Se a comissão é devida, gere pelo Diagnóstico de comissão.` });
      continue;
    }
    const mes = mesDaComissao(ind.delivery_date, agora);
    if (await fechamentoTravado(destUid, mes.month, mes.year)) {
      res.travadas.push({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: `Venda faturada sem comissão, mas o fechamento de ${String(mes.month).padStart(2, '0')}/${mes.year} de ${nomeDest} já está pago ou aguardando pagamento. Acerte com o financeiro.` });
      continue;
    }
    try {
      const r = await gerarComissao(deps, indId, AUTOR, undefined, { geradoPor: 'correcao_automatica', textoHistorico: 'COMISSÃO LANÇADA PELA CORREÇÃO AUTOMÁTICA' });
      res.criadas.push({ indicacao_id: indId, cliente, parceiro: r.parceiro, valor: r.valor, month: r.month, year: r.year });
      log(`[CORRECAO-COMISSAO] ${cliente || indId}: comissão de ${brl(r.valor)} lançada para ${r.parceiro} (${destUid}), pagamento em ${String(r.month).padStart(2, '0')}/${r.year}.`);
    } catch (e: any) {
      if (e?.status === 409) res.travadas.push({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: e.message });
      else res.erros.push(`${cliente || indId}: ${e?.message || e}`);
    }
  }

  res.terminou_em = (deps.agora ? deps.agora() : new Date()).toISOString();
  return res;
}

// Rodada com trava: dois processos do servidor (ou o início e o horário diário juntos) nunca
// rodam ao mesmo tempo. Trava velha (processo morto no meio) é retomada depois de 30 minutos.
// O resultado fica em cron_locks/conciliacao_comissao_resultado: a última rodada inteira e o
// histórico do que foi mexido, para a tela de Diagnóstico de comissão mostrar.
export async function conciliarComTrava(deps: Deps, origem: string): Promise<ResultadoConciliacao | null> {
  const { db } = deps;
  const log = deps.log || console.log;
  const agora = () => (deps.agora ? deps.agora() : new Date());
  const trava = db.collection('cron_locks').doc(DOC_TRAVA);
  try {
    await trava.create({ job: 'conciliacao_comissao', origem, started_at: agora().toISOString() });
  } catch (e: any) {
    if (e?.code !== 6) { console.error('[CORRECAO-COMISSAO] Não consegui criar a trava:', e?.message); return null; }
    const t: any = (await trava.get()).data() || {};
    const velha = t.started_at && agora().getTime() - new Date(t.started_at).getTime() > TRAVA_VELHA_MS;
    if (!velha) { log('[CORRECAO-COMISSAO] Outra rodada em andamento; esta foi pulada.'); return null; }
    await trava.set({ job: 'conciliacao_comissao', origem, started_at: agora().toISOString(), retomada: true });
  }
  try {
    const r = await conciliarComissoes(deps, origem);
    const docRes = db.collection('cron_locks').doc(DOC_RESULTADO);
    const antes: any = (await docRes.get()).data() || {};
    const novos = [
      ...r.movidas.map(m => ({ tipo: 'movida', em: r.rodada_em, ...m })),
      ...r.criadas.map(c => ({ tipo: 'criada', em: r.rodada_em, ...c })),
    ];
    const historico = [...novos, ...(Array.isArray(antes.historico) ? antes.historico : [])].slice(0, MAX_HISTORICO);
    await docRes.set({ ultima: r, historico, atualizado_em: r.terminou_em });
    log(`[CORRECAO-COMISSAO] Rodada ${origem}: ${r.movidas.length} movida(s), ${r.criadas.length} criada(s), ${r.travadas.length} travada(s), ${r.erros.length} erro(s).`);
    return r;
  } catch (e: any) {
    console.error('[CORRECAO-COMISSAO] Erro:', e?.message);
    return null;
  } finally {
    try { await trava.delete(); } catch { /* a trava velha é retomada na próxima */ }
  }
}

export async function lerCorrecoes(db: any) {
  const d = await db.collection('cron_locks').doc(DOC_RESULTADO).get();
  const x: any = d.exists ? (d.data() || {}) : {};
  return { ok: true, ultima: x.ultima || null, historico: Array.isArray(x.historico) ? x.historico : [] };
}

export function registrarCorrecoesAutomaticas(app: any, deps: { db: any; exigirAdmin: (req: any, res: any) => Promise<any> }) {
  app.get('/api/admin/diagnostico-comissao/correcoes', async (req: any, res: any) => {
    if (!(await deps.exigirAdmin(req, res))) return;
    try { return res.json(await lerCorrecoes(deps.db)); } catch (e: any) { return res.status(500).json({ ok: false, error: e?.message || 'Erro.' }); }
  });
}
