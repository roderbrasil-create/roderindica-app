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
// (gerarComissao, src/lib/calculoComissao.ts), mas SÓ quando o próprio faturamento gravou taxa de
// comissão e desconto: venda faturada sem parceiro (taxa 0) perderia o desconto real, e indicação
// estornada nunca é recriada. Esses casos vão para "travadas" com o motivo.
//
// Nunca mexe em comissão paga ou aguardando pagamento, nem quando o fechamento de um dos lados já
// está pago ou aguardando pagamento: aí a nota fiscal saiu em nome de uma conta, e mudar só o
// código deixaria fechamento e comissão discordando. Esses casos ficam no relatório ("travadas").
// Roda no início do servidor e todo dia; é idempotente: a segunda rodada não acha nada para fazer.
import { randomUUID } from 'node:crypto';
import { transferirIndicacao, gerarComissao, normalizar, nomeContido, temMarcaDeEstorno, temEstornoNoHistorico, UIDS_DE_SISTEMA } from './diagnosticoComissao';
import { calcularComissao, taxaDoParceiro, mesDaComissao } from '../src/lib/calculoComissao';

type Deps = { db: any; arrayUnion: (...v: any[]) => any; agora?: () => Date; log?: (...a: any[]) => void; renovarTrava?: () => Promise<void> };

export type Movida = { indicacao_id: string; cliente: string; parceiro: string; de_uid: string | null; de_nome: string | null; para_uid: string; comissoes: number; valor: number; motivo: string };
export type Criada = { indicacao_id: string; cliente: string; parceiro: string; valor: number; month: number; year: number };
export type Travada = { indicacao_id: string | null; cliente: string; parceiro: string; motivo: string };
export type ResultadoConciliacao = {
  rodada_em: string; terminou_em: string; origem: string;
  movidas: Movida[]; criadas: Criada[]; travadas: Travada[]; travadas_total: number; erros: string[];
  adiadas: Adiada[];
};
export type Adiada = { indicacao_id: string; cliente: string; parceiro: string };

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
// A lista "travadas" vai dentro de um documento do Firestore (limite de 1 MB): fica só com as mais recentes
export const MAX_TRAVADAS = 200;
// Teto de comissões CRIADAS por rodada: evita uma rajada de lançamentos no primeiro deploy. O que passar
// do teto fica em "adiadas" e é pego na rodada seguinte. Mover comissão fora do lugar não tem teto.
export const MAX_CRIADAS_POR_RODADA = 20;
// Mesmo teto para movidas, criadas e erros no documento gravado (o total fica ao lado)
export const MAX_LISTA_NO_DOC = 200;
const MAX_TEXTO_NO_DOC = 400;

const AUTOR = { uid: 'sistema', nome: 'Correção automática' };
const ORIGEM = 'correção automática de comissão';
const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const ehProvisorio = (id: string) => /^(temp_|phone_)/.test(id);
const statusQueRecebe = (st: any) => !st || st === 'active' || st === 'pending';
// Só parceiro indicador recebe por aqui (papel vazio é parceiro antigo, como em papelComissionavel)
const papelQueRecebe = (role: any) => !role || role === 'external_seller';
const recebe = (u: any) => !!u && papelQueRecebe(u.role) && statusQueRecebe(u.status);
// uids que o app grava para a gerência quando ela não tem cadastro de parceiro
const UID_SINTETICO_DA_EQUIPE = /_manager_direct$/;
const travadoPorStatus = (st: any) => st === 'paid' || st === 'waiting_payment';

export const CAMPOS_COMISSAO = ['indication_id', 'external_seller_uid', 'external_seller_name', 'value', 'status', 'transferencia_pendente', 'created_at', 'sale_date', 'month', 'year'];
const nomeDe = (u: any) => u?.name || 'Parceiro';
const ultimos9 = (t: any) => String(t || '').replace(/\D/g, '').slice(-9);

export async function conciliarComissoes(deps: Deps, origem = 'diária'): Promise<ResultadoConciliacao> {
  const { db } = deps;
  const log = deps.log || console.log;
  const agora = deps.agora ? deps.agora() : new Date();
  const res: ResultadoConciliacao = { rodada_em: agora.toISOString(), terminou_em: '', origem, movidas: [], criadas: [], travadas: [], travadas_total: 0, erros: [], adiadas: [] };
  // quanto mais recente a venda, mais cedo na lista; no fim fica só o teto
  const todasTravadas: { t: Travada; ordem: number }[] = [];
  let quandoAtual: any = '';
  const travar = (t: Travada, quando?: any) => { const o = Date.parse(String(quando || quandoAtual || '')); todasTravadas.push({ t, ordem: Number.isFinite(o) ? o : 0 }); };

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
    .select('status', 'client_name', 'external_seller_uid', 'external_seller_name', 'external_seller_email', 'sale_date', 'updated_at', 'commissioned_products', 'discount_amount', 'delivery_date', 'commission_rate_applied', 'estornado_em', 'commission_value')
    .get();
  const indicacoes = new Map<string, any>();
  indSnap.docs.forEach((d: any) => indicacoes.set(d.id, d.data() || {}));

  const commSnap = await db.collection('commissions')
    // CAMPOS_COMISSAO: tudo o que o código abaixo lê de uma comissão (o teste confere esta lista contra o fonte)
    .select(...CAMPOS_COMISSAO)
    .get();
  const comissoesPorInd = new Map<string, any[]>();
  const semIndicacaoId: any[] = []; // comissões antigas, de antes do vínculo com a indicação
  for (const c of commSnap.docs) {
    const cd = c.data() || {};
    const indId = String(cd.indication_id || '');
    // sem vínculo, ou ligada a uma indicação que foi apagada: ambas podem ser a comissão de uma venda sem comissão
    if (!indId || !indicacoes.has(indId)) semIndicacaoId.push({ ...cd, _indicacao_apagada: !!indId });
    if (!indId || !indicacoes.has(indId)) {
      // sem indicação não há como saber quem recebe: só avisa se está num código que não existe
      const u = cd.external_seller_uid ? usuario(String(cd.external_seller_uid)) : null;
      if (!u && !travadoPorStatus(cd.status)) travar({ indicacao_id: indId || null, cliente: '', parceiro: cd.external_seller_name || cd.external_seller_uid || '-', motivo: `Comissão ${c.id} de ${brl(Number(cd.value) || 0)} sem indicação e num código que não existe mais no cadastro.` }, cd.created_at);
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

  let ultimaRenovacao = Date.now();
  for (const [indId, ind] of indicacoes) {
    // rodada longa: renova a trava para outro processo não achar que ela morreu
    if (deps.renovarTrava && Date.now() - ultimaRenovacao > 60000) {
      ultimaRenovacao = Date.now();
      try { await deps.renovarTrava(); } catch { /* a próxima renovação tenta de novo */ }
    }
    const comms = comissoesPorInd.get(indId) || [];
    const uidInd = String(ind.external_seller_uid || '');
    const cliente = String(ind.client_name || '');
    quandoAtual = ind.updated_at || ind.sale_date;
    if (!uidInd || UIDS_DE_SISTEMA.includes(uidInd)) continue;
    // Só venda faturada: indicação em andamento não tem comissão, e quem a trocou à mão não é desfeito
    if (ind.status !== 'sold') continue;
    // Destino da gerência sem cadastro (ex.: gislene_manager_direct) não é parceiro nenhum
    if (UID_SINTETICO_DA_EQUIPE.test(uidInd)) continue;

    // 1. Parceiro de destino. A comissão sempre vai para o parceiro da indicação. A própria indicação
    // só muda no caso estreito do código que sobrou (provisório ou apagado).
    let atual = usuario(uidInd);
    let destino = atual;
    let motivo = 'a comissão estava em outro código, e quem recebe é o parceiro da indicação';
    if (!atual || ehProvisorio(atual.doc_id)) {
      let achada: any = null;
      let porEmailOuNome: 'e-mail' | 'nome' = 'e-mail';
      if (atual) {
        // provisório: vale o e-mail (ou o nome) do PRÓPRIO provisório. O e-mail gravado na indicação
        // pode ser do dono anterior, que ficou lá quando alguém trocou o indicador.
        const email = String(atual.email || '').toLowerCase().trim();
        achada = porEmail(email);
        if (!achada && !email) {
          // só o nome em comum (nenhum e-mail): só move se o telefone também bate
          const pelaNomeUnica = porNome(normalizar(atual.name));
          if (pelaNomeUnica) {
            if (ultimos9(atual.phone) && ultimos9(atual.phone) === ultimos9(pelaNomeUnica.phone)) { achada = pelaNomeUnica; porEmailOuNome = 'nome'; }
            else { travar({ indicacao_id: indId, cliente, parceiro: nomeDe(atual), motivo: `A venda está num cadastro provisório (${atual.doc_id}) e só o nome bate com a conta ${pelaNomeUnica.doc_id} (sem e-mail e sem telefone em comum). Nome igual pode ser outra pessoa. Use "Trocar Indicador" para confirmar.` }); continue; }
          }
        }
      } else {
        // código apagado: o e-mail da indicação só vale se o nome gravado nela bate com o da conta
        const email = String(ind.external_seller_email || '').toLowerCase().trim();
        const nomeInd = normalizar(ind.external_seller_name);
        const candidata = porEmail(email);
        if (candidata) {
          const nomeConta = normalizar(candidata.name);
          if (nomeConta && nomeInd && (nomeConta === nomeInd || nomeContido(nomeConta, nomeInd))) achada = candidata;
          else travar({ indicacao_id: indId, cliente, parceiro: ind.external_seller_name || uidInd, motivo: `A venda está ligada a um código que não existe mais, e o e-mail ${email} da indicação é de ${candidata.name || 'outra conta'}, com nome diferente de ${ind.external_seller_name || 'o da indicação'}. Pode ser o e-mail de um parceiro anterior. Use "Trocar Indicador" na tela de Indicações.` });
          if (!achada) continue;
        } else if (!email) {
          // só o nome, sem e-mail nem telefone na indicação para confirmar: não adivinha
          const pelaNomeUnica = porNome(nomeInd);
          if (pelaNomeUnica) { travar({ indicacao_id: indId, cliente, parceiro: ind.external_seller_name || uidInd, motivo: `A venda está ligada a um código que não existe mais, e só o nome bate com a conta ${pelaNomeUnica.doc_id} (a indicação não tem e-mail nem telefone para confirmar). Nome igual pode ser outra pessoa. Use "Trocar Indicador" para confirmar.` }); continue; }
        }
      }
      if (achada) {
        destino = achada;
        motivo = `a venda estava num cadastro ${atual ? 'provisório' : 'apagado'} e foi para a conta definitiva com o mesmo ${porEmailOuNome}`;
      } else if (!atual) {
        // código que não existe e sem conta certa para onde ir: só avisa quando há dinheiro parado
        const email = String(ind.external_seller_email || '').trim();
        const porque = email
          ? `O e-mail ${email} da indicação não está em nenhuma conta (ou está em mais de uma), e o nome não é usado quando há e-mail, para não levar a venda a um homônimo.`
          : 'Não há uma conta só com o mesmo nome (zero contas ou mais de uma).';
        travar({ indicacao_id: indId, cliente, parceiro: ind.external_seller_name || uidInd, motivo: `A venda está ligada a um código que não existe mais. ${porque} Use "Trocar Indicador" na tela de Indicações.` });
        continue;
      }
    }
    const destUid = String(destino.uid || destino.doc_id);
    const nomeDest = destino.name || ind.external_seller_name || 'Parceiro';

    // 2. Indicação ou comissão fora do destino: tudo vai junto para ele
    const fora = comms.filter(c => c.external_seller_uid !== destUid);
    let mexiAgora = false;
    if (uidInd !== destUid || fora.length) {
      // Nunca leva comissão de uma conta definitiva para um cadastro provisório
      if (ehProvisorio(destino.doc_id)) {
        if (fora.length) travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: `A venda está num cadastro provisório (${destino.doc_id}) que não achou conta definitiva única, mas a comissão está em outra conta (${fora[0].external_seller_name || fora[0].external_seller_uid}). Não foi mexida: levá-la para um provisório faria o dinheiro sumir do painel do parceiro. Use "Trocar Indicador" e escolha a conta certa.` });
        continue;
      }
      if (!recebe(destino)) {
        if (fora.length) travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: `A comissão está em outro código, mas ${nomeDest} ${papelQueRecebe(destino.role) ? `está com o cadastro ${destino.status}` : 'é da equipe Roder'} e não recebe comissão.` });
        continue;
      }
      const presa = comms.find(c => travadoPorStatus(c.status));
      if (presa) {
        travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: `A comissão de ${brl(Number(presa.value) || 0)} já está ${presa.status === 'paid' ? 'paga' : 'aguardando pagamento'} na conta ${presa.external_seller_name || presa.external_seller_uid}. Não foi mexida: a nota fiscal e o pagamento são dessa conta. Acerte com o financeiro.` });
        continue;
      }
      try {
        await transferirIndicacao(deps, indId, destino.doc_id, AUTOR, ORIGEM, { uidEsperado: uidInd });
        const valor = Math.round(fora.reduce((a, c) => a + (Number(c.value) || 0), 0) * 100) / 100;
        const de = fora[0]?.external_seller_uid || uidInd;
        const deNome = fora[0]?.external_seller_name || (atual && atual.name) || ind.external_seller_name || null;
        res.movidas.push({ indicacao_id: indId, cliente, parceiro: nomeDest, de_uid: de || null, de_nome: deNome, para_uid: destUid, comissoes: fora.length, valor, motivo });
        log(`[CORRECAO-COMISSAO] ${cliente || indId}: ${fora.length} comissão(ões) de ${brl(valor)} de ${deNome || de} (${de}) para ${nomeDest} (${destUid}); ${motivo}.`);
        comms.forEach(c => { c.external_seller_uid = destUid; c.transferencia_pendente = null; });
        mexiAgora = true;
      } catch (e: any) {
        if (e?.status === 409) travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: e.message });
        else res.erros.push(`${cliente || indId}: ${e?.message || e}`);
        continue;
      }
    }

    // a marca do primeiro acesso que sobrou numa comissão que já está no lugar certo
    for (const c of comms) {
      if (c.transferencia_pendente && c.external_seller_uid === destUid) {
        try { await c.ref.update({ transferencia_pendente: null, updated_at: agora.toISOString() }); }
        catch (e: any) { res.erros.push(`${cliente || indId}: não limpei a marca de primeiro acesso: ${e?.message || e}`); }
      }
    }

    // Conta repetida: indicação e comissão estão na conta X e o parceiro pode entrar pela Y (mesmo
    // e-mail ou mesmo nome). Não há como saber qual ele usa: avisa em vez de não fazer nada calado.
    if (comms.length && comms.every(c => c.external_seller_uid === destUid)) {
      const emailD = String(destino.email || '').toLowerCase().trim();
      const nomeD = normalizar(destino.name);
      const repetida = definitivas.find(u => u.doc_id !== destino.doc_id && ((emailD && String(u.email || '').toLowerCase().trim() === emailD) || (nomeD && normalizar(u.name) === nomeD)));
      if (repetida) travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: `${nomeDest} tem duas contas (${destino.doc_id} e ${repetida.doc_id}, mesmo e-mail ou nome). A venda e a comissão estão em ${destino.doc_id}. Se ele entra pela outra, o painel mostra R$ 0,00: confirme com ele a conta certa e use "Trocar Indicador".` });
    }

    // 3. Venda faturada sem comissão nenhuma
    if (ind.status !== 'sold' || comms.length || !recebe(destino)) continue;
    // Indicação estornada: o estorno apaga a comissão de propósito. Recriar desfaria o estorno.
    // Estorno: marca gravada no começo do estorno, com a venda ainda faturada. Sem a linha do histórico
    // (que só entra no fim), o estorno ficou incompleto. O histórico só é lido para quem chegou aqui.
    let noHistorico = false;
    try { const f = await db.collection('indications').doc(indId).get(); noHistorico = temEstornoNoHistorico(f.exists ? f.data() : null); }
    catch (e: any) { res.erros.push(`${cliente || indId}: não consegui ler o histórico: ${e?.message || e}`); continue; }
    if (temMarcaDeEstorno(ind) || noHistorico) {
      travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: noHistorico
        ? 'Venda faturada sem comissão, mas esta indicação já foi estornada antes e a comissão foi apagada de propósito. Não é lançada sozinha. Se for devida, gere pelo Diagnóstico de comissão.'
        : 'Estorno incompleto: o estorno foi começado (a comissão pode ter sido apagada) mas a venda continua faturada. Refaça o estorno na tela de Indicações. Não é lançada comissão sozinha.' });
      continue;
    }
    // O limite de 90 dias vem antes de qualquer outra conta: venda antiga é sempre "antiga demais"
    const dataVenda = Date.parse(String(ind.sale_date || '').slice(0, 10) + 'T12:00:00-03:00');
    const dias = Number.isFinite(dataVenda) ? (agora.getTime() - dataVenda) / 86400000 : Infinity;
    if (dias > DIAS_PARA_GERAR) {
      travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: `Venda faturada sem comissão, com pedido de ${ind.sale_date ? String(ind.sale_date).slice(0, 10).split('-').reverse().join('/') : 'data desconhecida'}: antiga demais para lançar sozinha (mais de ${DIAS_PARA_GERAR} dias). Se a comissão é devida, gere pelo Diagnóstico de comissão.` });
      continue;
    }
    // Só lança quando o próprio faturamento gravou taxa de comissão (faturou COM parceiro que recebe)
    // e o desconto. Faturada sem parceiro grava taxa 0 e desconto 0, e o desconto real se perdeu:
    // a conta sairia errada para cima. Depois de "Trocar Indicador" é o caso típico.
    if (!(Number(ind.commission_rate_applied) > 0) || typeof ind.discount_amount !== 'number') {
      travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: 'Venda faturada sem comissão, e o faturamento não gravou taxa de comissão e desconto (foi faturada sem parceiro, ou o desconto é desconhecido). Não é lançada sozinha, para não pagar a mais. Confira o desconto e gere pelo Diagnóstico de comissão.' });
      continue;
    }
    const calc = calcularComissao(ind.commissioned_products || [], ind.discount_amount, Number(ind.commission_rate_applied));
    if (calc.valor <= 0) {
      travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: 'Venda faturada sem comissão, e os produtos da indicação não dão base de comissão (sem produto ou só kit, frete e instalação). Vincule os produtos vendidos.' });
      continue;
    }
    // Se a venda gravou o valor da comissão, o recálculo tem de bater. Diferença = dado mudou depois do
    // faturamento (produtos, desconto, taxa): criar sozinho pagaria um valor que ninguém conferiu.
    if (typeof ind.commission_value === 'number' && ind.commission_value > 0 && Math.abs(ind.commission_value - calc.valor) > 0.01) {
      travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: `valor recalculado difere do gravado no faturamento (recalculado ${brl(calc.valor)}, gravado ${brl(ind.commission_value)}). Não foi lançada sozinha. Confira e gere pelo Diagnóstico de comissão.` });
      continue;
    }
    // Comissão antiga sem indication_id (de antes do vínculo) do mesmo parceiro, no mesmo dia da venda
    // ou com o mesmo valor no mesmo mês: pode ser a desta venda. Criar outra pagaria duas vezes.
    // (A comissão não guarda o nome do cliente, então não dá para casar por ele.)
    const mesDela = mesDaComissao(ind.delivery_date, agora);
    const diaVenda = String(ind.sale_date || '').slice(0, 10);
    const nomesDoParceiro = [normalizar(nomeDest), normalizar(ind.external_seller_name)].filter(Boolean);
    const parecida = semIndicacaoId.find(c => {
      const doParceiro = [destUid, uidInd].includes(String(c.external_seller_uid || '')) || nomesDoParceiro.includes(normalizar(c.external_seller_name));
      const mesmoDia = !!diaVenda && String(c.sale_date || '').slice(0, 10) === diaVenda;
      const mesmoValor = Math.abs((Number(c.value) || 0) - calc.valor) < 0.01 && c.month === mesDela.month && c.year === mesDela.year;
      // ligada a indicação apagada: só parceiro + valor + mês (o dia da venda não é confiável)
      return doParceiro && (c._indicacao_apagada ? mesmoValor : (mesmoDia || mesmoValor));
    });
    if (parecida) {
      travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: `Venda faturada sem comissão ligada a ela, mas existe uma comissão antiga sem vínculo com indicação (${brl(Number(parecida.value) || 0)}, ${parecida.external_seller_name || parecida.external_seller_uid}) que pode ser desta venda. Não foi lançada outra, para não pagar duas vezes. Confira no Diagnóstico de comissão.` });
      continue;
    }
    // Indicação mexida há pouco fica para a próxima rodada
    const mexida = Date.parse(ind.updated_at || '');
    if (!mexiAgora && Number.isFinite(mexida) && agora.getTime() - mexida < MINUTOS_SEM_MEXER * 60 * 1000) continue;
    const mes = mesDaComissao(ind.delivery_date, agora);
    let fechTravado: any = null;
    try { fechTravado = await fechamentoTravado(destUid, mes.month, mes.year); }
    catch (e: any) { res.erros.push(`${cliente || indId}: não consegui ler o fechamento: ${e?.message || e}`); continue; }
    if (fechTravado) {
      travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: `Venda faturada sem comissão, mas o fechamento de ${String(mes.month).padStart(2, '0')}/${mes.year} de ${nomeDest} já está pago ou aguardando pagamento. Acerte com o financeiro.` });
      continue;
    }
    if (res.criadas.length >= MAX_CRIADAS_POR_RODADA) {
      res.adiadas.push({ indicacao_id: indId, cliente, parceiro: nomeDest });
      continue;
    }
    try {
      const r = await gerarComissao(deps, indId, AUTOR, undefined, { geradoPor: 'correcao_automatica', textoHistorico: 'COMISSÃO LANÇADA PELA CORREÇÃO AUTOMÁTICA', semAvisoFinanceiro: true, usarTaxaGravada: true, recusarEstornada: true });
      res.criadas.push({ indicacao_id: indId, cliente, parceiro: r.parceiro, valor: r.valor, month: r.month, year: r.year });
      log(`[CORRECAO-COMISSAO] ${cliente || indId}: comissão de ${brl(r.valor)} lançada para ${r.parceiro} (${destUid}), pagamento em ${String(r.month).padStart(2, '0')}/${r.year}.`);
    } catch (e: any) {
      if (e?.status === 409) travar({ indicacao_id: indId, cliente, parceiro: nomeDest, motivo: e.message });
      else res.erros.push(`${cliente || indId}: ${e?.message || e}`);
    }
  }

  res.travadas_total = todasTravadas.length;
  res.travadas = todasTravadas.sort((a, b) => b.ordem - a.ordem).slice(0, MAX_TRAVADAS).map(x => x.t);
  res.terminou_em = (deps.agora ? deps.agora() : new Date()).toISOString();
  return res;
}

// Rodada com trava: dois processos do servidor (ou o início e o horário diário juntos) nunca
// rodam ao mesmo tempo. Trava velha (processo morto no meio) é retomada depois de 30 minutos.
// O resultado fica em cron_locks/conciliacao_comissao_resultado: a última rodada inteira e o
// histórico do que foi mexido, para a tela de Diagnóstico de comissão mostrar.
// Cópia do resultado para o documento do Firestore (limite de 1 MB): listas e textos com teto
function paraDocumento(r: ResultadoConciliacao): any {
  const corta = (t: any) => typeof t === 'string' && t.length > MAX_TEXTO_NO_DOC ? t.slice(0, MAX_TEXTO_NO_DOC) + '...' : t;
  const limita = (l: any[]) => l.slice(0, MAX_LISTA_NO_DOC).map(x => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, corta(v)])));
  return {
    ...r,
    movidas: limita(r.movidas), criadas: limita(r.criadas), travadas: limita(r.travadas),
    erros: r.erros.slice(0, MAX_LISTA_NO_DOC).map(corta),
    adiadas: limita(r.adiadas),
    movidas_total: r.movidas.length, criadas_total: r.criadas.length, adiadas_total: r.adiadas.length, erros_total: r.erros.length,
  };
}

export async function conciliarComTrava(deps: Deps, origem: string): Promise<ResultadoConciliacao | null> {
  const { db } = deps;
  const log = deps.log || console.log;
  const agora = () => (deps.agora ? deps.agora() : new Date());
  const trava = db.collection('cron_locks').doc(DOC_TRAVA);
  // Dono da trava: só quem a criou (ou a retomou) pode apagá-la. Sem isso, uma rodada lenta apagaria
  // a trava de quem a retomou depois dos 30 minutos.
  const dono = randomUUID();
  const dados = (extra: any = {}) => ({ job: 'conciliacao_comissao', origem, owner_id: dono, started_at: agora().toISOString(), ...extra });
  try {
    await trava.create(dados());
  } catch (e: any) {
    if (e?.code !== 6) { console.error('[CORRECAO-COMISSAO] Não consegui criar a trava:', e?.message); return null; }
    // retomada numa transação: duas rodadas que veem a trava velha ao mesmo tempo não passam as duas
    const retomou = await db.runTransaction(async (tx: any) => {
      const atual = await tx.get(trava);
      const t: any = atual.exists ? (atual.data() || {}) : {};
      const velha = !atual.exists || !t.started_at || agora().getTime() - new Date(t.started_at).getTime() > TRAVA_VELHA_MS;
      if (!velha) return false;
      tx.set(trava, dados({ retomada: true }));
      return true;
    }).catch(() => false);
    if (!retomou) { log('[CORRECAO-COMISSAO] Outra rodada em andamento; esta foi pulada.'); return null; }
  }
  try {
    const renovarTrava = async () => {
      await db.runTransaction(async (tx: any) => {
        const atual = await tx.get(trava);
        if (atual.exists && (atual.data() || {}).owner_id === dono) tx.update(trava, { started_at: agora().toISOString() });
      });
    };
    const r = await conciliarComissoes({ ...deps, renovarTrava }, origem);
    const docRes = db.collection('cron_locks').doc(DOC_RESULTADO);
    const antes: any = (await docRes.get()).data() || {};
    const novos = [
      ...r.movidas.slice(0, MAX_HISTORICO).map(m => ({ tipo: 'movida', em: r.rodada_em, ...m })),
      ...r.criadas.slice(0, MAX_HISTORICO).map(c => ({ tipo: 'criada', em: r.rodada_em, ...c })),
    ];
    const historico = [...novos, ...(Array.isArray(antes.historico) ? antes.historico : [])].slice(0, MAX_HISTORICO);
    await docRes.set({ ultima: paraDocumento(r), historico, atualizado_em: r.terminou_em });
    log(`[CORRECAO-COMISSAO] Rodada ${origem}: ${r.movidas.length} movida(s), ${r.criadas.length} criada(s), ${r.travadas.length} travada(s), ${r.adiadas.length} adiada(s), ${r.erros.length} erro(s).`);
    return r;
  } catch (e: any) {
    console.error('[CORRECAO-COMISSAO] Erro:', e?.message);
    return null;
  } finally {
    try {
      // só apaga se a trava ainda é nossa
      await db.runTransaction(async (tx: any) => {
        const atual = await tx.get(trava);
        if (atual.exists && (atual.data() || {}).owner_id === dono) tx.delete(trava);
      });
    } catch { /* a trava velha é retomada na próxima */ }
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
