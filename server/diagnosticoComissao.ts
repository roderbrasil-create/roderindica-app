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
  calcularComissao, mesDaComissao, diaEmBrasilia, papelComissionavel, taxaDoParceiro, baseBrutaDosProdutos, itemComissionavel, UIDS_DE_SISTEMA,
} from '../src/lib/calculoComissao';
export { UIDS_DE_SISTEMA };

export const normalizar = (v: any) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9@._]+/g, ' ').replace(/\s+/g, ' ').trim();

// um nome inteiro dentro do outro, palavra por palavra ("rafael" dentro de "rafael maqloc")
export function nomeContido(a: string, b: string): boolean {
  if (!a || !b || a === b) return false;
  const [curto, longo] = a.length <= b.length ? [a, b] : [b, a];
  if (curto.length < 3) return false;
  return ` ${longo} `.includes(` ${curto} `);
}

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

export type Falta = { codigo: string; texto: string; acao?: 'ligar' | 'gerar' | 'transferir'; tipo?: 'info' | 'problema' };

type Deps = { db: any; agora?: () => Date };

export async function diagnosticar(deps: Deps, termoBruto: string, opcoes: { conta?: string } = {}) {
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

  const achadosBusca = todos.filter((u: any) => u.uid === termo || u.doc_id === termo
    || (termoEmail && String(u.email || '').toLowerCase() === termoEmail)
    || (!termoEmail && nomeCasa(u.name, termoN)));

  // Cadastro repetido: mesmo e-mail, mesmo nome (sem acento, minúsculo), ou um nome dentro do
  // outro ("Rafael" e "Rafael - MAQLOC"), nos dois sentidos. O cadastro repetido entra na busca:
  // é justamente nele que costuma estar a venda que some do painel.
  const duplicados: { motivo: string; uids: string[] }[] = [];
  const vistos = new Set<string>();
  const extras = new Map<string, any>();
  for (const u of achadosBusca) {
    const nome = normalizar(u.name);
    const email = String(u.email || '').toLowerCase();
    const motivoDe = (o: any): string | null => {
      if (o.uid === u.uid) return 'mesmo';
      if (email && String(o.email || '').toLowerCase() === email) return 'mesmo e-mail';
      const on = normalizar(o.name);
      if (nome && on === nome) return 'mesmo nome';
      if (nome && on && papelComissionavel(u.role) && papelComissionavel(o.role) && nomeContido(nome, on)) return 'nome parecido';
      return null;
    };
    const iguais = todos.filter((o: any) => motivoDe(o));
    const chave = iguais.map((o: any) => o.uid).sort().join(',');
    if (iguais.length > 1 && !vistos.has(chave)) {
      vistos.add(chave);
      const motivos = new Set(iguais.map(motivoDe).filter(m => m && m !== 'mesmo'));
      const motivo = motivos.has('mesmo e-mail') ? 'mesmo e-mail' : motivos.has('mesmo nome') ? 'mesmo nome' : 'nome parecido';
      duplicados.push({ motivo, uids: iguais.map((o: any) => o.uid) });
      iguais.forEach((o: any) => { if (!achadosBusca.includes(o)) extras.set(o.uid, o); });
    }
  }
  const achados = [...achadosBusca, ...extras.values()];

  const uids = new Set<string>();
  achados.forEach((u: any) => { uids.add(u.uid); uids.add(u.doc_id); });
  if (!achados.length) uids.add(termo); // pode ser um uid antigo que não existe mais em users
  const emails = new Set<string>(achados.map((u: any) => String(u.email || '').toLowerCase()).filter(Boolean));
  if (termoEmail) emails.add(termoEmail);
  const nomesAchados = new Set<string>(achados.map((u: any) => normalizar(u.name)).filter(Boolean));

  // Mais de uma conta que recebe comissão: o administrador escolhe aquela em que o parceiro entra,
  // e tudo o que estiver nas outras aparece com o botão de transferir.
  const contasComissionaveis = achados.filter((u: any) => papelComissionavel(u.role));
  const variasContas = contasComissionaveis.length > 1;
  const contaEscolhida = variasContas && opcoes.conta
    ? contasComissionaveis.find((u: any) => u.uid === opcoes.conta || u.doc_id === opcoes.conta) || null
    : null;
  const nomeConta = (uid: string | null) => { const u = uid ? porUid.get(uid) : null; return u ? (u.name || u.uid) : (uid || 'nenhuma'); };

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
    conta_nome: c.external_seller_uid ? nomeConta(c.external_seller_uid) : null,
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

  const [anoBr, mesBr] = diaEmBrasilia(agora).split('-').map(Number);
  const mesAgora = chaveMes(mesBr, anoBr);
  const resultadoInd = limitadas.map(ind => {
    const uidInd = String(ind.external_seller_uid || '');
    const parceiro = uidInd ? porUid.get(uidInd) : null;
    const comms = listaComissoes.filter(c => c.indication_id === ind.id);
    const falta: Falta[] = [];
    let parceiroOk = false;
    // com comissão já lançada, trocar só a indicação deixaria a comissão no código antigo:
    // aí o conserto é transferir (indicação e comissões juntas)
    const troca: 'ligar' | 'transferir' = comms.length ? 'transferir' : 'ligar';
    if (!uidInd) falta.push({ codigo: 'sem_uid', texto: 'Indicação sem parceiro ligado. A comissão não nasce no faturamento e o painel do parceiro não enxerga a venda.', acao: troca });
    else if (UIDS_DE_SISTEMA.includes(uidInd)) falta.push({ codigo: 'uid_sistema', texto: `Ligada a "${uidInd}", que não é um parceiro.`, acao: troca });
    else if (!parceiro) falta.push({ codigo: 'uid_inexistente', texto: 'Ligada a um código de parceiro que não existe mais no cadastro (cadastro antigo ou apagado). O painel do parceiro não enxerga esta venda.', acao: troca });
    else if (!papelComissionavel(parceiro.role)) falta.push({ codigo: 'papel', texto: `Ligada a ${parceiro.name || uidInd}, com perfil ${parceiro.role}, que não recebe comissão.`, acao: troca });
    else {
      parceiroOk = true;
      if (achados.length && !uids.has(uidInd)) falta.push({ codigo: 'outro_parceiro', texto: `Ligada a outro cadastro: ${parceiro.name || uidInd}.`, acao: troca });
      else if (contaEscolhida && uidInd !== contaEscolhida.uid) {
        falta.push({ codigo: 'conta_repetida', texto: `Esta venda está na conta ${nomeConta(uidInd)}, mas o parceiro entra com a conta ${nomeConta(contaEscolhida.uid)}. O painel dele não mostra esta venda.`, acao: 'transferir' });
      }
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
          if (uidInd && c.external_seller_uid !== uidInd) falta.push({ codigo: 'comissao_outro_uid', texto: `A comissão está em nome de outro código (${c.external_seller_name || c.external_seller_uid || 'vazio'}): o painel do parceiro não soma ela.`, acao: 'transferir' });
          else if (contaEscolhida && c.external_seller_uid !== contaEscolhida.uid && uidInd === contaEscolhida.uid) {
            falta.push({ codigo: 'comissao_conta_repetida', texto: `A comissão de ${brl(c.value)} está na conta ${nomeConta(c.external_seller_uid)}, e o parceiro entra com a conta ${nomeConta(contaEscolhida.uid)}.`, acao: 'transferir' });
          }
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
      conta: uidInd || null, conta_nome: uidInd ? nomeConta(uidInd) : null,
      fora_da_conta: !!contaEscolhida && (uidInd !== contaEscolhida.uid || comms.some(c => c.external_seller_uid !== contaEscolhida.uid)),
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
  if (variasContas && !contaEscolhida) avisosGerais.push(`Há ${contasComissionaveis.length} contas que recebem comissão. Escolha abaixo a conta em que o parceiro entra para ver o que precisa ser transferido.`);
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
      repetido: extras.has(u.uid),
    })),
    duplicados,
    varias_contas: variasContas,
    conta_escolhida: contaEscolhida ? contaEscolhida.uid : null,
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
function exigirId(indId: string) {
  if (!String(indId || '').trim()) throw erro(400, 'Indicação não informada.');
}

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
  exigirId(indId);
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
  exigirId(indId);
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
  exigirId(indId);
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
    if (!papelComissionavel(user.role)) throw erro(409, `${user.name || 'Este usuário'} é da equipe Roder e não recebe comissão. Escolha o parceiro indicador.`);
    const novoUid = String(user.uid || u.id || uid);
    const outra = comms.docs.find((c: any) => (c.data() || {}).external_seller_uid !== novoUid);
    if (outra) throw erro(409, `Já existe comissão lançada para esta venda em nome de ${(outra.data() || {}).external_seller_name || 'outro código'}. Use "Transferir" para levar a indicação e a comissão juntas.`);
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

const ROTULO_STATUS_COMISSAO: Record<string, string> = { waiting_payment: 'aguardando pagamento (nota fiscal já enviada)', paid: 'paga' };

// Fechamento pago ou aguardando pagamento: a nota fiscal já saiu (ou o PIX já caiu). Comissão que
// entra num fechamento assim é lida como paga pelos e-mails do dia 1, 5 e 7 (comissoesDoCiclo,
// server/relatoriosComissao.ts) sem ninguém ter pago, e some deles sem aviso.
const fechamentoTravado = (st: any) => !!st && (st.status === 'paid' || st.status === 'waiting_payment');
const rotuloFechamento = (st: any) => st?.status === 'paid' ? 'pago' : 'aguardando pagamento';
const mmaa = (m: any, a: any) => `${String(m).padStart(2, '0')}/${a}`;

type OpcoesTransferir = {
  // "Trocar Indicador" da tela de Indicações: sem comissão lançada, a venda pode ir para quem não
  // recebe comissão (regional, gerente). Com comissão, só para quem recebe.
  semComissaoQualquerDestino?: boolean;
  nomeInformado?: string;
};

// Transferir: a indicação E todas as comissões dela passam para a conta escolhida, numa transação.
// Existe porque "ligar" só mexe na indicação: com a comissão já lançada no código antigo, o painel
// do parceiro (que soma commissions pelo uid dele) continuava sem a venda. Caso típico: parceiro
// com dois cadastros, a venda num e ele entrando com o outro.
// Não mexe em comissão paga nem em comissão que já está num fechamento aguardando pagamento ou
// pago: ali a nota fiscal saiu (ou o PIX caiu) em nome da conta antiga, e mudar só o código
// deixaria o fechamento dizendo uma coisa e a comissão outra. Pelo mesmo motivo recusa quando o
// fechamento do mês na conta NOVA já está pago ou aguardando pagamento.
export async function transferirIndicacao(deps: DepsEscrita, indId: string, uid: string, autor: { uid: string; nome: string }, origem = 'diagnóstico de comissão', opcoes: OpcoesTransferir = {}) {
  const { db, arrayUnion } = deps;
  const agora = deps.agora ? deps.agora() : new Date();
  exigirId(indId);
  if (!uid) throw erro(400, 'Escolha a conta para onde a venda vai.');
  const indRef = db.collection('indications').doc(indId);
  return db.runTransaction(async (tx: any) => {
    // leituras primeiro (regra da transação do Firestore)
    const s = await tx.get(indRef);
    if (!s.exists) throw erro(404, 'Indicação não encontrada.');
    const u = await tx.get(db.collection('users').doc(uid));
    const user = u.exists ? (u.data() || {}) : null;
    const ind = s.data() || {};
    const comms = (await tx.get(db.collection('commissions').where('indication_id', '==', indId))).docs;
    const livre = !!opcoes.semComissaoQualquerDestino && !comms.length;
    const nomeInformado = String(opcoes.nomeInformado || '').trim();
    if (!user && !(livre && nomeInformado)) throw erro(404, 'Usuário não encontrado.');
    if (!livre && !papelComissionavel(user.role)) {
      throw erro(409, `${user.name || 'Este usuário'} é da equipe Roder e não recebe comissão.` + (opcoes.semComissaoQualquerDestino
        ? ' Esta venda já tem comissão lançada: ela só pode ir para um parceiro que recebe comissão. Acerte a comissão no Diagnóstico de comissão (Configurações) antes.'
        : ' Escolha o parceiro indicador.'));
    }
    const novoUid = user ? String(user.uid || u.id || uid) : uid;

    const fechamentos = new Map<string, any>(); // id -> { ref, data, tirar }
    const destinos = new Map<string, any>(); // fechamento do mês na conta nova
    for (const c of comms) {
      const cd = c.data() || {};
      if (cd.status === 'paid' || cd.status === 'waiting_payment') {
        throw erro(409, `A comissão desta venda já está ${ROTULO_STATUS_COMISSAO[cd.status]} na conta ${cd.external_seller_name || cd.external_seller_uid}. Não dá para transferir: a nota fiscal e o pagamento são dessa conta. Acerte com o financeiro antes.`);
      }
      const lidos: any[] = [];
      if (cd.external_seller_uid && cd.month && cd.year) {
        const f = await tx.get(db.collection('monthly_statements').doc(`${cd.external_seller_uid}_${cd.month}_${cd.year}`));
        if (f.exists) lidos.push(f);
      }
      const q = await tx.get(db.collection('monthly_statements').where('commission_ids', 'array-contains', c.id));
      lidos.push(...q.docs);
      for (const f of lidos) {
        const fd = f.data() || {};
        const lista = fd.commission_ids || [];
        const contem = lista.includes(c.id);
        // fechamento do mesmo código e mês sem lista de comissões vale para todas daquele mês
        const doMesmoMes = fd.seller_uid === cd.external_seller_uid && fd.month === cd.month && fd.year === cd.year;
        if ((contem || doMesmoMes) && fechamentoTravado(fd)) {
          throw erro(409, `A comissão desta venda está no fechamento de ${mmaa(fd.month, fd.year)} da conta ${fd.seller_name || fd.seller_uid}, que está ${rotuloFechamento(fd)}. Não dá para transferir: a nota fiscal e o pagamento são dessa conta. Acerte com o financeiro antes.`);
        }
        // sem lista de comissões, o total do mês inteiro inclui esta: tira do total do mesmo jeito
        if (contem || (doMesmoMes && !lista.length)) {
          const atual = fechamentos.get(f.id) || { ref: f.ref, data: fd, tirar: [] as { id: string; valor: number }[] };
          if (!atual.tirar.some((t: any) => t.id === c.id)) atual.tirar.push({ id: c.id, valor: Number(cd.value) || 0 });
          fechamentos.set(f.id, atual);
        }
      }
      if (cd.external_seller_uid !== novoUid && cd.month && cd.year) {
        const idDestino = `${novoUid}_${cd.month}_${cd.year}`;
        if (!destinos.has(idDestino)) {
          const d = await tx.get(db.collection('monthly_statements').doc(idDestino));
          destinos.set(idDestino, d.exists ? (d.data() || {}) : null);
        }
        const dd = destinos.get(idDestino);
        if (fechamentoTravado(dd)) {
          throw erro(409, `O fechamento de ${mmaa(cd.month, cd.year)} da conta ${dd.seller_name || (user && user.name) || novoUid} já está ${rotuloFechamento(dd)}. A comissão desta venda entraria nele como paga sem ter sido paga. Acerte com o financeiro antes.`);
        }
      }
    }
    const jaNaConta = String(ind.external_seller_uid || '') === novoUid && comms.every((c: any) => (c.data() || {}).external_seller_uid === novoUid);
    if (jaNaConta) throw erro(409, `A venda e as comissões já estão na conta ${(user && user.name) || nomeInformado || novoUid}. Nada foi alterado.`);

    const nowIso = agora.toISOString();
    const nome = (user && user.name) || nomeInformado || ind.external_seller_name || 'Parceiro';
    const email = user ? String(user.email || '').toLowerCase() : '';
    const antes = ind.external_seller_name || ind.external_seller_uid || 'ninguém';
    const antesUid = ind.external_seller_uid || null;
    let somaComissoes = 0;
    for (const c of comms) {
      const cd = c.data() || {};
      somaComissoes += Number(cd.value) || 0;
      if (cd.external_seller_uid === novoUid) continue;
      tx.update(c.ref, {
        external_seller_uid: novoUid,
        external_seller_name: nome,
        ...('external_seller_email' in cd ? { external_seller_email: email } : {}),
        transferred_from_uid: cd.external_seller_uid || null,
        transferred_at: nowIso,
        updated_at: nowIso,
      });
    }
    // fechamento ainda aguardando NF na conta antiga: a comissão sai da lista e do total dele.
    // Se ficou vazio (sem comissão, sem valor e sem nota), é apagado: senão o parceiro antigo
    // continuaria vendo um fechamento de R$ 0,00 cobrando nota fiscal.
    for (const [, f] of fechamentos) {
      const ids = new Set(f.tirar.map((t: any) => t.id));
      const menos = f.tirar.reduce((a: number, t: any) => a + t.valor, 0);
      const restantes = (f.data.commission_ids || []).filter((x: string) => !ids.has(x));
      const total = Math.max(0, Math.round(((Number(f.data.total_value) || 0) - menos) * 100) / 100);
      if (!restantes.length && total <= 0 && !f.data.nf_url) tx.delete(f.ref);
      else tx.update(f.ref, { commission_ids: restantes, total_value: total, updated_at: nowIso });
    }
    tx.update(indRef, {
      external_seller_uid: novoUid,
      external_seller_name: nome,
      external_seller_email: email,
      updated_at: nowIso,
      negotiation_history: arrayUnion({
        id: idHist(), type: 'system', author_name: autor.nome || 'Administrador', created_at: nowIso,
        content: `Venda transferida pelo ${origem}: antes ${antes}${antesUid ? ` (${antesUid})` : ''}, agora ${nome} (${novoUid}).`
          + (comms.length ? ` ${comms.length === 1 ? 'A comissão de' : `As ${comms.length} comissões, somando`} ${brl(somaComissoes)} ${comms.length === 1 ? 'foi junto' : 'foram juntas'}.` : ''),
        attachments: [],
      }),
    });
    return { ok: true, uid: novoUid, nome, comissoes: comms.length };
  });
}

// Lote que passa de 500 escritas: o Firestore recusa um batch com mais de 500. Junta tudo e grava
// em partes de 450, na ordem em que entrou. Quem usa põe por último o que não pode repetir (apagar
// o cadastro provisório): se uma parte falhar no meio, o resto fica para a próxima tentativa.
export function loteEmPartes(db: any, limite = 450) {
  const ops: ((b: any) => void)[] = [];
  return {
    set: (r: any, v: any, o?: any) => { ops.push(b => o ? b.set(r, v, o) : b.set(r, v)); },
    update: (r: any, v: any) => { ops.push(b => b.update(r, v)); },
    delete: (r: any) => { ops.push(b => b.delete(r)); },
    get tamanho() { return ops.length; },
    commit: async () => {
      for (let i = 0; i < ops.length; i += limite) {
        const b = db.batch();
        ops.slice(i, i + limite).forEach(op => op(b));
        await b.commit();
      }
    },
  };
}

const PESO_STATUS: Record<string, number> = { paid: 3, waiting_payment: 2, waiting_nf: 1 };

// Conta provisória (pré-cadastro) virando a conta definitiva no primeiro login: as comissões e os
// fechamentos do código provisório vão junto com as indicações, no mesmo lote. Antes iam só as
// indicações: a venda aparecia para o parceiro e a comissão dela ficava presa no código que acabou
// de ser apagado. O id do fechamento leva o uid ({uid}_{mês}_{ano}): aí o documento é recriado
// com o id novo e o velho apagado. Fechamentos do mesmo mês (do definitivo e de um ou mais
// provisórios) são somados em memória, antes de gravar: lidos um a um, o segundo provisório
// sobrescrevia a soma do primeiro.
// Só junta fechamentos abertos. Se o do definitivo (ou um dos provisórios) já está pago ou
// aguardando pagamento, juntar faria a comissão aberta ser lida como paga (comissoesDoCiclo). Aí
// o fechamento provisório e as comissões daquele mês ficam onde estão, com log e com a marca
// transferencia_pendente na comissão, e o Diagnóstico de comissão mostra para acertar.
// O lote é passado de fora (loteEmPartes) e só recebe escritas aqui.
export async function moverComissoesDoProvisorio(db: any, lote: any, deUids: string | string[], paraUid: string, agoraIso: string, paraNome?: string) {
  const origens = Array.from(new Set((Array.isArray(deUids) ? deUids : [deUids]).filter(d => d && d !== paraUid)));
  const resultado = { comissoes: 0, fechamentos: 0, presos: [] as string[] };
  if (!paraUid || !origens.length) return resultado;

  type Grupo = { destino: { ref: any; data: any } | null; fontes: { de: string; ref: any; data: any }[] };
  const grupos = new Map<string, Grupo>();
  const comissoes: { de: string; ref: any; data: any }[] = [];
  for (const de of origens) {
    const cs = await db.collection('commissions').where('external_seller_uid', '==', de).get();
    cs.docs.forEach((c: any) => comissoes.push({ de, ref: c.ref, data: c.data() || {} }));
    const extratos = await db.collection('monthly_statements').where('seller_uid', '==', de).get();
    for (const e of extratos.docs) {
      const d = e.data() || {};
      const novoId = e.id.includes(de) ? e.id.split(de).join(paraUid) : e.id;
      if (novoId === e.id) { lote.update(e.ref, { seller_uid: paraUid, updated_at: agoraIso }); resultado.fechamentos++; continue; }
      let g = grupos.get(novoId);
      if (!g) {
        const ja = await db.collection('monthly_statements').doc(novoId).get();
        g = { destino: ja.exists ? { ref: ja.ref, data: ja.data() || {} } : null, fontes: [] };
        grupos.set(novoId, g);
      }
      g.fontes.push({ de, ref: e.ref, data: d });
    }
  }

  // mês (do provisório) cujas comissões NÃO podem ir: "{de}|{mês}|{ano}"
  const presos = new Set<string>();
  // mês da conta definitiva que acabou travado sem ter vindo do provisório
  const destinoTravado = new Set<string>();
  const chave = (de: string, m: any, a: any) => `${de}|${m}|${a}`;
  for (const [novoId, g] of grupos) {
    // a fonte travada vai na frente: se não há fechamento no definitivo, é ela que ocupa o id
    const fontes = [...g.fontes].sort((x, y) => (PESO_STATUS[y.data.status] || 0) - (PESO_STATUS[x.data.status] || 0));
    let base: any = g.destino ? { ...g.destino.data } : null;
    const juntadas: typeof fontes = [];
    for (const f of fontes) {
      if (!base) { base = { ...f.data, ...('id' in f.data ? { id: novoId } : {}), seller_uid: paraUid }; juntadas.push(f); continue; }
      if (fechamentoTravado(base) || fechamentoTravado(f.data)) {
        presos.add(chave(f.de, f.data.month, f.data.year));
        resultado.presos.push(f.ref.id);
        console.warn(`[AUTH] Fechamento ${f.ref.id} NÃO foi juntado a ${novoId}: um dos dois já está pago ou aguardando pagamento. Ficou no código provisório ${f.de}, com as comissões do mês. Acerte no Diagnóstico de comissão.`);
        continue;
      }
      // os dois abertos: soma, e fica o status mais adiantado
      const st = (PESO_STATUS[f.data.status] || 0) > (PESO_STATUS[base.status] || 0) ? f.data.status : base.status;
      base = {
        ...base,
        commission_ids: Array.from(new Set([...(base.commission_ids || []), ...(f.data.commission_ids || [])])),
        total_value: Math.round(((Number(base.total_value) || 0) + (Number(f.data.total_value) || 0)) * 100) / 100,
        nf_url: base.nf_url || f.data.nf_url || null,
        ...(st !== undefined ? { status: st } : {}),
      };
      juntadas.push(f);
    }
    if (g.destino && !juntadas.length && fechamentoTravado(g.destino.data)) destinoTravado.add(novoId);
    if (!juntadas.length) continue;
    const novoRef = g.destino ? g.destino.ref : db.collection('monthly_statements').doc(novoId);
    lote.set(novoRef, { ...base, updated_at: agoraIso });
    juntadas.forEach(f => { lote.delete(f.ref); resultado.fechamentos++; });
  }

  for (const c of comissoes) {
    const { month, year } = c.data;
    // sem fechamento no provisório, mas o do definitivo daquele mês já está pago ou aguardando
    let travadoNoDestino = false;
    if (month && year && !grupos.has(`${paraUid}_${month}_${year}`)) {
      const d = await db.collection('monthly_statements').doc(`${paraUid}_${month}_${year}`).get();
      travadoNoDestino = d.exists && fechamentoTravado(d.data());
    }
    if (month && year && (presos.has(chave(c.de, month, year)) || destinoTravado.has(`${paraUid}_${month}_${year}`) || travadoNoDestino)) {
      lote.update(c.ref, { transferencia_pendente: { para_uid: paraUid, motivo: `fechamento de ${mmaa(month, year)} já pago ou aguardando pagamento`, em: agoraIso } });
      console.warn(`[AUTH] Comissão ${c.ref.id} ficou no código provisório ${c.de}: o fechamento de ${mmaa(month, year)} não pôde ser juntado. Acerte no Diagnóstico de comissão.`);
      continue;
    }
    lote.update(c.ref, { external_seller_uid: paraUid, ...(paraNome ? { external_seller_name: paraNome } : {}), updated_at: agoraIso });
    resultado.comissoes++;
  }
  return resultado;
}

// Rotas. exigirAdmin responde 403 sozinho e devolve null quando não é o administrador.
export function registrarDiagnosticoComissao(app: any, deps: DepsEscrita & { exigirAdmin: (req: any, res: any) => Promise<any>; exigirGestao?: (req: any, res: any) => Promise<any> }) {
  const responderErro = (res: any, e: any) => res.status(e?.status || 500).json({ ok: false, error: e?.message || 'Erro.' });
  const nomeDe = async (q: any) => {
    try { return String((await deps.db.collection('users').doc(q.uid).get()).data()?.name || q.email || 'Administrador'); } catch { return 'Administrador'; }
  };

  app.get('/api/admin/diagnostico-comissao', async (req: any, res: any) => {
    if (!(await deps.exigirAdmin(req, res))) return;
    try { return res.json(await diagnosticar(deps, String(req.query?.parceiro || ''), { conta: String(req.query?.conta || '') || undefined })); } catch (e) { return responderErro(res, e); }
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
  app.post('/api/admin/diagnostico-comissao/transferir', async (req: any, res: any) => {
    const q = await deps.exigirAdmin(req, res); if (!q) return;
    try { return res.json(await transferirIndicacao(deps, String(req.body?.indicacaoId || ''), String(req.body?.uid || ''), { uid: q.uid, nome: await nomeDe(q) })); } catch (e) { return responderErro(res, e); }
  });
  // "Trocar Indicador" da tela de Indicações numa venda faturada: a comissão vai junto (admin e gerente)
  app.post('/api/indicacoes/trocar-indicador', async (req: any, res: any) => {
    const exigir = deps.exigirGestao || deps.exigirAdmin;
    const q = await exigir(req, res); if (!q) return;
    try { return res.json(await transferirIndicacao(deps, String(req.body?.indicacaoId || ''), String(req.body?.uid || ''), { uid: q.uid, nome: await nomeDe(q) }, 'Trocar Indicador',
      { semComissaoQualquerDestino: true, nomeInformado: String(req.body?.nome || '') })); } catch (e) { return responderErro(res, e); }
  });
}
