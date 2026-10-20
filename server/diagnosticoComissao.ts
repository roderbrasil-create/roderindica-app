// Diagnóstico de comissão do parceiro (só o administrador).
// Nasceu do caso "Rafael - MAQLOC": venda de uns R$ 230 mil no mês e o painel dele mostrando
// R$ 0,00. O painel soma os documentos de commissions com external_seller_uid igual ao uid do
// parceiro, e esse documento só nasce no faturamento (handleFinishSale) se a indicação já estiver
// ligada ao uid dele e tiver produto comissionável. Qualquer elo solto (indicação ligada só pelo
// nome, uid de um cadastro antigo, produto não cadastrado) dava zero sem aviso nenhum.
// Aqui o administrador procura o parceiro e vê, venda por venda, qual elo está faltando, com o
// botão que conserta: ligar a indicação ao parceiro, ou gerar a comissão que ficou faltando.
// Separado do server.ts para o teste rodar com um Firestore em memória.
import {
  calcularComissao, mesDaComissao, papelComissionavel, taxaDoParceiro, baseBrutaDosProdutos, itemComissionavel, UIDS_DE_SISTEMA,
} from '../src/lib/calculoComissao';
export { UIDS_DE_SISTEMA };

export const normalizar = (v: any) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9@._]+/g, ' ').replace(/\s+/g, ' ').trim();

// "rafael maqloc" casa com "Rafael - MAQLOC" e com "Rafael Souza (MAQLOC)": toda palavra procurada
// precisa estar no nome, em qualquer ordem
export function nomeCasa(nome: any, termoNormalizado: string): boolean {
  const n = normalizar(nome);
  if (!n || !termoNormalizado) return false;
  const palavras = n.split(' ');
  return termoNormalizado.split(' ').every(t => palavras.some(p => p.startsWith(t)));
}

const CAMPOS_IND = [
  'status', 'client_name', 'external_seller_uid', 'external_seller_name', 'external_seller_email', 'indicator_name',
  'indicator_uid', 'created_by', 'user_id', 'sale_value', 'base_commission_value', 'commissioned_products',
  'commission_value', 'commissionable_value', 'discount_amount', 'sale_date', 'sale_order_number', 'delivery_date',
  'updated_at', 'created_at', 'finance_notice_pending', 'finance_notice_due_at', 'finance_notice_sent_at', 'base_machine',
];

const ROTULO_STATUS: Record<string, string> = {
  pending: 'pendente', negotiating: 'em negociação', sold: 'faturada', cancelled: 'cancelada', lost: 'perdida',
};

const chaveMes = (m: number, a: number) => a * 12 + (m - 1);

export type Falta = { codigo: string; texto: string; acao?: 'ligar' | 'gerar'; tipo?: 'info' | 'problema' };

type Deps = { db: any; agora?: () => Date };

export async function diagnosticar(deps: Deps, termoBruto: string) {
  const { db } = deps;
  const agora = deps.agora ? deps.agora() : new Date();
  const termo = String(termoBruto || '').trim();
  if (termo.length < 2) throw Object.assign(new Error('Digite o nome, o e-mail ou o código do parceiro.'), { status: 400 });
  const termoN = normalizar(termo);
  const termoEmail = termo.includes('@') ? termo.toLowerCase() : '';

  const usersSnap = await db.collection('users').get();
  const todos = usersSnap.docs.map((d: any) => { const u = d.data() || {}; return { ...u, uid: String(u.uid || d.id), doc_id: d.id }; });
  const porUid = new Map<string, any>();
  todos.forEach((u: any) => { porUid.set(u.uid, u); porUid.set(u.doc_id, u); });

  const achados = todos.filter((u: any) => u.uid === termo || u.doc_id === termo
    || (termoEmail && String(u.email || '').toLowerCase() === termoEmail)
    || (!termoEmail && nomeCasa(u.name, termoN)));
  const uids = new Set<string>();
  achados.forEach((u: any) => { uids.add(u.uid); uids.add(u.doc_id); });
  if (!achados.length) uids.add(termo); // pode ser um uid antigo que não existe mais em users
  const emails = new Set<string>(achados.map((u: any) => String(u.email || '').toLowerCase()).filter(Boolean));
  if (termoEmail) emails.add(termoEmail);
  const nomesAchados = new Set<string>(achados.map((u: any) => normalizar(u.name)).filter(Boolean));

  // cadastro repetido: mesmo nome (sem acento, minúsculo) ou mesmo e-mail em mais de um uid
  const duplicados: { motivo: string; uids: string[] }[] = [];
  const vistos = new Set<string>();
  for (const u of achados) {
    const nome = normalizar(u.name);
    const email = String(u.email || '').toLowerCase();
    const iguais = todos.filter((o: any) => (nome && normalizar(o.name) === nome) || (email && String(o.email || '').toLowerCase() === email));
    const chave = iguais.map((o: any) => o.uid).sort().join(',');
    if (iguais.length > 1 && !vistos.has(chave)) {
      vistos.add(chave);
      duplicados.push({ motivo: email && iguais.every((o: any) => String(o.email || '').toLowerCase() === email) ? 'mesmo e-mail' : 'mesmo nome', uids: iguais.map((o: any) => o.uid) });
    }
  }

  // Indicações: lê tudo (só os campos usados) porque o nome não tem busca no Firestore
  const indSnap = await db.collection('indications').select(...CAMPOS_IND).get();
  const indicacoes: any[] = [];
  for (const d of indSnap.docs) {
    const ind = d.data() || {};
    const por: string[] = [];
    if (['external_seller_uid', 'indicator_uid', 'created_by', 'user_id'].some(c => ind[c] && uids.has(String(ind[c])))) por.push('uid');
    if (ind.external_seller_email && emails.has(String(ind.external_seller_email).toLowerCase())) por.push('e-mail');
    const nomeBate = (v: any) => !!v && (nomesAchados.has(normalizar(v)) || (!termoEmail && nomeCasa(v, termoN)));
    if (nomeBate(ind.external_seller_name) || nomeBate(ind.indicator_name)) por.push('nome');
    if (por.length) indicacoes.push({ id: d.id, ...ind, ligado_por: por });
  }
  indicacoes.sort((a, b) => String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')));
  const limitadas = indicacoes.slice(0, 150);

  // Comissões pelo uid do parceiro e pela indicação
  const comissoes = new Map<string, any>();
  for (const uid of uids) {
    const s = await db.collection('commissions').where('external_seller_uid', '==', uid).get();
    s.docs.forEach((c: any) => comissoes.set(c.id, { id: c.id, ...c.data(), achada_por: 'uid' }));
  }
  const ids = limitadas.map(i => i.id);
  for (let i = 0; i < ids.length; i += 10) {
    const s = await db.collection('commissions').where('indication_id', 'in', ids.slice(i, i + 10)).get();
    s.docs.forEach((c: any) => { if (!comissoes.has(c.id)) comissoes.set(c.id, { id: c.id, ...c.data(), achada_por: 'indicação' }); });
  }
  const listaComissoes = Array.from(comissoes.values()).map((c: any) => ({
    id: c.id, indication_id: c.indication_id || null, external_seller_uid: c.external_seller_uid || null,
    external_seller_name: c.external_seller_name || null, value: Number(c.value) || 0, base_value_used: Number(c.base_value_used) || 0,
    status: c.status || null, month: c.month ?? null, year: c.year ?? null, sale_date: c.sale_date || null,
    created_at: c.created_at || null, achada_por: c.achada_por,
  }));

  const extratos: any[] = [];
  for (const uid of uids) {
    const s = await db.collection('monthly_statements').where('seller_uid', '==', uid).get();
    s.docs.forEach((e: any) => { const x = e.data() || {}; extratos.push({ id: e.id, seller_uid: x.seller_uid, month: x.month, year: x.year, status: x.status || null, total_value: Number(x.total_value) || 0, nf_enviada: !!x.nf_url, commission_ids: (x.commission_ids || []).length }); });
  }

  const notifSnap = await db.collection('settings').doc('notifications').get();
  const notif = notifSnap.exists ? (notifSnap.data() || {}) : {};
  const avisos = {
    existe: !!notifSnap.exists,
    monthly_report_partners: notif.monthly_report_partners === true,
    monthly_report_directors: notif.monthly_report_directors === true,
    payment_reminder_finance: notif.payment_reminder_finance === true,
  };

  const mesAgora = chaveMes(agora.getMonth() + 1, agora.getFullYear());
  const resultadoInd = limitadas.map(ind => {
    const uidInd = String(ind.external_seller_uid || '');
    const parceiro = uidInd ? porUid.get(uidInd) : null;
    const comms = listaComissoes.filter(c => c.indication_id === ind.id);
    const falta: Falta[] = [];
    let parceiroOk = false;
    if (!uidInd) falta.push({ codigo: 'sem_uid', texto: 'Indicação sem parceiro ligado. A comissão não nasce no faturamento e o painel do parceiro não enxerga a venda.', acao: 'ligar' });
    else if (UIDS_DE_SISTEMA.includes(uidInd)) falta.push({ codigo: 'uid_sistema', texto: `Ligada a "${uidInd}", que não é um parceiro.`, acao: 'ligar' });
    else if (!parceiro) falta.push({ codigo: 'uid_inexistente', texto: 'Ligada a um código de parceiro que não existe mais no cadastro (cadastro antigo ou apagado). O painel do parceiro não enxerga esta venda.', acao: 'ligar' });
    else if (!papelComissionavel(parceiro.role)) falta.push({ codigo: 'papel', texto: `Ligada a ${parceiro.name || uidInd}, com perfil ${parceiro.role}, que não recebe comissão.`, acao: 'ligar' });
    else {
      parceiroOk = true;
      if (achados.length && !uids.has(uidInd)) falta.push({ codigo: 'outro_parceiro', texto: `Ligada a outro cadastro: ${parceiro.name || uidInd}.`, acao: 'ligar' });
    }

    const produtos = ind.commissioned_products || [];
    const calc = calcularComissao(produtos, Number(ind.discount_amount) || 0, taxaDoParceiro(parceiro));
    if (calc.baseBruta <= 0) {
      falta.push({ codigo: 'base_zero', texto: produtos.length
        ? 'Nenhum produto da indicação conta para comissão (só kit 9000, frete, instalação ou item marcado como não comissionável). A base fica zerada.'
        : 'Sem produtos cadastrados na indicação: a base da comissão fica zerada. Vincule os produtos vendidos na indicação.' });
    }

    if (ind.status === 'sold') {
      if (!comms.length) {
        falta.push(parceiroOk && calc.valor > 0
          ? { codigo: 'sem_comissao', texto: 'Venda faturada sem comissão lançada.', acao: 'gerar' }
          : { codigo: 'sem_comissao', texto: 'Venda faturada sem comissão lançada. Resolva os itens acima para poder gerar.' });
      } else {
        for (const c of comms) {
          if (c.value <= 0) falta.push({ codigo: 'comissao_zero', texto: `Comissão lançada com valor zero (${c.id}).` });
          if (uidInd && c.external_seller_uid !== uidInd) falta.push({ codigo: 'comissao_outro_uid', texto: `A comissão está em nome de outro código (${c.external_seller_name || c.external_seller_uid || 'vazio'}): o painel do parceiro não soma ela.` });
          if (c.status !== 'paid' && c.month && c.year && chaveMes(c.month, c.year) < mesAgora) {
            falta.push({ codigo: 'comissao_atrasada', texto: `Comissão de ${String(c.month).padStart(2, '0')}/${c.year} ainda não está como paga.` });
          }
        }
        if (comms.length > 1) falta.push({ codigo: 'comissao_duplicada', texto: `${comms.length} comissões para a mesma venda.` });
      }
      if (ind.finance_notice_pending && !ind.finance_notice_sent_at) falta.push({ codigo: 'aviso_financeiro', texto: `Aviso ao financeiro programado para ${String(ind.finance_notice_due_at || '').slice(0, 10).split('-').reverse().join('/')}.`, tipo: 'info' });
    } else {
      falta.push({ codigo: 'nao_faturada', texto: `Ainda não faturada (${ROTULO_STATUS[ind.status] || ind.status || 'sem status'}).`, tipo: 'info' });
    }

    return {
      id: ind.id, client_name: ind.client_name || '', status: ind.status || null, ligado_por: ind.ligado_por,
      external_seller_uid: ind.external_seller_uid || null, external_seller_name: ind.external_seller_name || null,
      external_seller_email: ind.external_seller_email || null, indicator_name: ind.indicator_name || null,
      indicator_uid: ind.indicator_uid || null, created_by: ind.created_by || null,
      sale_value: Number(ind.sale_value) || 0, base_commission_value: Number(ind.base_commission_value) || 0,
      produtos: {
        total: produtos.length,
        comissionaveis: produtos.filter(itemComissionavel).length,
        base_bruta: baseBrutaDosProdutos(produtos),
        itens: produtos.slice(0, 12).map((p: any) => ({ code: p.code || '', name: p.name || '', quantity: Number(p.quantity) || 0, base_value: Number(p.base_value) || 0, conta: itemComissionavel(p) })),
      },
      commission_value: Number(ind.commission_value) || 0,
      discount_amount: Number(ind.discount_amount) || 0,
      sale_date: ind.sale_date || null, sale_order_number: ind.sale_order_number || null, updated_at: ind.updated_at || null,
      finance_notice_pending: !!ind.finance_notice_pending, finance_notice_due_at: ind.finance_notice_due_at || null,
      finance_notice_sent_at: ind.finance_notice_sent_at || null,
      calculo_previsto: parceiroOk ? { base: calc.base, valor: calc.valor, desconto: calc.desconto } : null,
      comissoes: comms,
      falta,
    };
  });

  const avisosGerais: string[] = [];
  if (!achados.length) avisosGerais.push('Nenhum usuário encontrado com esse nome, e-mail ou código.');
  duplicados.forEach(d => avisosGerais.push(`Cadastro repetido (${d.motivo}): ${d.uids.length} usuários. A venda pode estar ligada a um e o parceiro entrando com o outro.`));
  if (!avisos.monthly_report_partners) avisosGerais.push('E-mail mensal ao parceiro (dia 1 e lembrete do dia 5) está desligado em Configurações > Central de Notificações.');
  if (!avisos.monthly_report_directors) avisosGerais.push('Relatório mensal da diretoria e do financeiro (dia 1) está desligado.');
  if (!avisos.payment_reminder_finance) avisosGerais.push('Lembrete de pagamento ao financeiro (dia 7) está desligado.');
  if (indicacoes.length > limitadas.length) avisosGerais.push(`Mostrando as ${limitadas.length} indicações mais recentes de ${indicacoes.length}.`);

  return {
    ok: true,
    termo,
    usuarios: achados.map((u: any) => ({
      uid: u.uid, doc_id: u.doc_id, name: u.name || '', email: u.email || '', role: u.role || '', status: u.status || '',
      commission_rate: u.commission_rate ?? null, // só o administrador chega aqui
      comissionavel: papelComissionavel(u.role),
    })),
    duplicados,
    indicacoes: resultadoInd,
    comissoes: listaComissoes,
    extratos,
    avisos,
    avisos_gerais: avisosGerais,
  };
}

function erro(status: number, msg: string) { return Object.assign(new Error(msg), { status }); }
const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const idHist = () => Math.random().toString(36).substring(2, 11);

type DepsEscrita = Deps & { arrayUnion: (...v: any[]) => any };

// Confere tudo o que a geração precisa. Usada pela prévia (sem gravar) e dentro da transação.
function conferirGeracao(indId: string, ind: any, parceiro: any, descontoInformado: number | undefined, agora: Date) {
  if (!ind) throw erro(404, 'Indicação não encontrada.');
  if (ind.status !== 'sold') throw erro(409, 'A venda ainda não foi faturada. A comissão nasce no faturamento.');
  const uid = String(ind.external_seller_uid || '');
  if (!uid || UIDS_DE_SISTEMA.includes(uid)) throw erro(409, 'Ligue a indicação ao parceiro antes de gerar a comissão.');
  if (!parceiro) throw erro(409, 'O parceiro ligado a esta indicação não existe no cadastro. Ligue ao parceiro certo antes.');
  if (!papelComissionavel(parceiro.role)) throw erro(409, `O perfil de ${parceiro.name || 'quem está ligado'} não recebe comissão.`);
  const desconto = descontoInformado !== undefined && descontoInformado !== null && Number.isFinite(Number(descontoInformado))
    ? Number(descontoInformado) : (Number(ind.discount_amount) || 0);
  const calc = calcularComissao(ind.commissioned_products || [], desconto, taxaDoParceiro(parceiro));
  if (calc.baseBruta <= 0) throw erro(409, 'Sem produtos comissionáveis na indicação: a comissão daria zero. Vincule os produtos vendidos antes.');
  if (calc.valor <= 0) throw erro(409, 'O desconto zera a base da comissão. Confira o desconto informado.');
  const mes = mesDaComissao(ind.delivery_date, agora);
  return { uid, calc, mes, nomeParceiro: parceiro.name || ind.external_seller_name || 'Parceiro' };
}

export async function previaGeracao(deps: Deps, indId: string, desconto?: number) {
  const { db } = deps;
  const agora = deps.agora ? deps.agora() : new Date();
  const s = await db.collection('indications').doc(indId).get();
  const ind = s.exists ? s.data() : null;
  const uid = String(ind?.external_seller_uid || '');
  const p = uid && !UIDS_DE_SISTEMA.includes(uid) ? await db.collection('users').doc(uid).get() : null;
  const r = conferirGeracao(indId, ind, p?.exists ? p.data() : null, desconto, agora);
  const ja = await db.collection('commissions').doc(indId).get();
  const legado = await db.collection('commissions').where('indication_id', '==', indId).get();
  return {
    ok: true, ja_existe: ja.exists || !legado.empty, parceiro: r.nomeParceiro, cliente: ind.client_name || '',
    base_bruta: r.calc.baseBruta, desconto: r.calc.desconto, base: r.calc.base, valor: r.calc.valor, month: r.mes.month, year: r.mes.year,
  };
}

// Cria commissions/{id da indicação} exatamente como o faturamento cria. Nunca sobrescreve.
export async function gerarComissao(deps: DepsEscrita, indId: string, autor: { uid: string; nome: string }, desconto?: number) {
  const { db, arrayUnion } = deps;
  const agora = deps.agora ? deps.agora() : new Date();
  const indRef = db.collection('indications').doc(indId);
  const commRef = db.collection('commissions').doc(indId);
  return db.runTransaction(async (tx: any) => {
    const s = await tx.get(indRef);
    const ind = s.exists ? s.data() : null;
    const uid = String(ind?.external_seller_uid || '');
    const p = uid && !UIDS_DE_SISTEMA.includes(uid) ? await tx.get(db.collection('users').doc(uid)) : null;
    const ja = await tx.get(commRef);
    const legado = await tx.get(db.collection('commissions').where('indication_id', '==', indId));
    const r = conferirGeracao(indId, ind, p?.exists ? p.data() : null, desconto, agora);
    if (ja.exists || !legado.empty) throw erro(409, 'Já existe comissão lançada para esta venda. Nada foi alterado.');
    const nowIso = agora.toISOString();
    tx.set(commRef, {
      indication_id: indId,
      external_seller_uid: r.uid,
      external_seller_name: r.nomeParceiro,
      value: r.calc.valor,
      base_value_used: r.calc.base,
      gross_commissionable_value: r.calc.baseBruta,
      discount_applied: r.calc.desconto,
      discount_percentage: r.calc.descontoPct,
      rate_applied: r.calc.taxa,
      status: 'waiting_nf',
      month: r.mes.month,
      year: r.mes.year,
      sale_date: ind.sale_date || null,
      created_at: nowIso,
      generated_by: 'diagnostico_admin',
      generated_by_uid: autor.uid,
    });
    tx.update(indRef, {
      commission_value: r.calc.valor,
      commission_rate_applied: r.calc.taxa,
      commissionable_value: r.calc.base,
      discount_amount: r.calc.desconto,
      discount_percentage: r.calc.descontoPct,
      updated_at: nowIso,
      // mesmo aviso ao financeiro do faturamento: sai 2 dias depois, se ainda não saiu
      ...(ind.finance_notice_sent_at ? {} : { finance_notice_pending: true, finance_notice_due_at: new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() }),
      negotiation_history: arrayUnion({
        id: idHist(), type: 'status_change', author_name: autor.nome || 'Administrador', created_at: nowIso,
        content: `COMISSÃO LANÇADA PELO DIAGNÓSTICO: a venda estava faturada sem comissão. Comissão de ${brl(r.calc.valor)} sobre a base comissionável de ${brl(r.calc.base)}` + (r.calc.desconto > 0 ? `, já com o desconto de ${brl(r.calc.desconto)} abatido` : '') + `, para pagamento em ${String(r.mes.month).padStart(2, '0')}/${r.mes.year}.`,
        attachments: [],
      }),
    });
    return { ok: true, valor: r.calc.valor, base: r.calc.base, month: r.mes.month, year: r.mes.year, parceiro: r.nomeParceiro };
  });
}

export async function ligarParceiro(deps: DepsEscrita, indId: string, uid: string, autor: { uid: string; nome: string }) {
  const { db, arrayUnion } = deps;
  const agora = deps.agora ? deps.agora() : new Date();
  if (!uid) throw erro(400, 'Escolha o parceiro.');
  const indRef = db.collection('indications').doc(indId);
  return db.runTransaction(async (tx: any) => {
    const s = await tx.get(indRef);
    if (!s.exists) throw erro(404, 'Indicação não encontrada.');
    const u = await tx.get(db.collection('users').doc(uid));
    if (!u.exists) throw erro(404, 'Usuário não encontrado.');
    const comms = await tx.get(db.collection('commissions').where('indication_id', '==', indId));
    const ind = s.data() || {};
    const user = u.data() || {};
    const novoUid = String(user.uid || u.id || uid);
    const outra = comms.docs.find((c: any) => (c.data() || {}).external_seller_uid !== novoUid);
    if (outra) throw erro(409, `Já existe comissão lançada para esta venda em nome de ${(outra.data() || {}).external_seller_name || 'outro código'}. Estorne o faturamento antes de trocar o parceiro.`);
    const nowIso = agora.toISOString();
    const antes = ind.external_seller_name || ind.external_seller_uid || 'ninguém';
    tx.update(indRef, {
      external_seller_uid: novoUid,
      external_seller_name: user.name || ind.external_seller_name || 'Parceiro',
      external_seller_email: String(user.email || '').toLowerCase(),
      updated_at: nowIso,
      negotiation_history: arrayUnion({
        id: idHist(), type: 'system', author_name: autor.nome || 'Administrador', created_at: nowIso,
        content: `Parceiro indicador ligado pelo diagnóstico de comissão: antes ${antes}, agora ${user.name || novoUid}.`,
        attachments: [],
      }),
    });
    return { ok: true, uid: novoUid, nome: user.name || '' };
  });
}

// Rotas. exigirAdmin responde 403 sozinho e devolve null quando não é o administrador.
export function registrarDiagnosticoComissao(app: any, deps: DepsEscrita & { exigirAdmin: (req: any, res: any) => Promise<any> }) {
  const responderErro = (res: any, e: any) => res.status(e?.status || 500).json({ ok: false, error: e?.message || 'Erro.' });
  const nomeDe = async (q: any) => {
    try { return String((await deps.db.collection('users').doc(q.uid).get()).data()?.name || q.email || 'Administrador'); } catch { return 'Administrador'; }
  };

  app.get('/api/admin/diagnostico-comissao', async (req: any, res: any) => {
    if (!(await deps.exigirAdmin(req, res))) return;
    try { return res.json(await diagnosticar(deps, String(req.query?.parceiro || ''))); } catch (e) { return responderErro(res, e); }
  });
  app.post('/api/admin/diagnostico-comissao/previa', async (req: any, res: any) => {
    if (!(await deps.exigirAdmin(req, res))) return;
    try { return res.json(await previaGeracao(deps, String(req.body?.indicacaoId || ''), req.body?.desconto)); } catch (e) { return responderErro(res, e); }
  });
  app.post('/api/admin/diagnostico-comissao/gerar', async (req: any, res: any) => {
    const q = await deps.exigirAdmin(req, res); if (!q) return;
    try { return res.json(await gerarComissao(deps, String(req.body?.indicacaoId || ''), { uid: q.uid, nome: await nomeDe(q) }, req.body?.desconto)); } catch (e) { return responderErro(res, e); }
  });
  app.post('/api/admin/diagnostico-comissao/ligar', async (req: any, res: any) => {
    const q = await deps.exigirAdmin(req, res); if (!q) return;
    try { return res.json(await ligarParceiro(deps, String(req.body?.indicacaoId || ''), String(req.body?.uid || ''), { uid: q.uid, nome: await nomeDe(q) })); } catch (e) { return responderErro(res, e); }
  });
}
