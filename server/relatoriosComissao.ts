// E-mails mensais de comissão: parceiro (dia 1 e lembrete do dia 5), diretoria e financeiro
// (dia 1) e lembrete de pagamento ao financeiro (dia 7).
// Antes eles liam as indicações vendidas pelo updated_at do mês anterior. updated_at muda a cada
// edição da indicação: uma venda de setembro editada em outubro sumia do relatório de outubro e
// aparecia no de novembro, e a venda faturada sem uid do parceiro nem entrava. Agora a fonte é o
// documento da comissão (commissions), pelo mês e ano DELA, que é o mês em que ela é paga
// (src/lib/calculoComissao.ts, mesDaComissao). O e-mail do dia 1 de novembro cobra as comissões de
// novembro, que são as das vendas de outubro: o mesmo recorte de antes, agora sem depender de edição.
// Também entra a comissão do mês anterior que ficou sem pagar (o lembrete do dia 5 diz que "o valor
// será acumulado para o pagamento do próximo mês"), a não ser que o extrato daquele mês já esteja pago.
// Cada envio tem trava em cron_locks por tarefa e mês: dois processos do servidor (ou um reinício
// no meio da manhã) mandavam o mesmo e-mail duas vezes.
// Separado do server.ts para o teste conferir o recorte e a trava sem subir o servidor.

export const FUSO_BR = 'America/Sao_Paulo';

export function mesEmBrasilia(agora: Date): { month: number; year: number } {
  const [y, m] = agora.toLocaleDateString('en-CA', { timeZone: FUSO_BR }).split('-').map(Number);
  return { month: m, year: y };
}
export const mesAnterior = (c: { month: number; year: number }) => c.month === 1 ? { month: 12, year: c.year - 1 } : { month: c.month - 1, year: c.year };

const pago = (st: any) => !!st && st.status === 'paid';

// Comissões a pagar no ciclo (mês/ano de pagamento) mais o que ficou do mês anterior sem pagar
export async function comissoesDoCiclo(db: any, ciclo: { month: number; year: number }) {
  const ant = mesAnterior(ciclo);
  const ler = async (c: { month: number; year: number }, acumulado: boolean) => {
    const s = await db.collection('commissions').where('month', '==', c.month).where('year', '==', c.year).get();
    return s.docs.map((d: any) => ({ id: d.id, ...d.data(), acumulado }));
  };
  const todas = [...await ler(ciclo, false), ...await ler(ant, true)]
    .filter((c: any) => c.status !== 'paid' && c.external_seller_uid && (Number(c.value) || 0) > 0);
  // extrato pago sem commission_ids: a comissão continua "waiting_payment" para sempre, mas foi paga
  const extratos = new Map<string, any>();
  for (const c of todas) {
    const id = `${c.external_seller_uid}_${c.month}_${c.year}`;
    if (!extratos.has(id)) { const st = await db.collection('monthly_statements').doc(id).get(); extratos.set(id, st.exists ? st.data() : null); }
  }
  return todas.filter((c: any) => !pago(extratos.get(`${c.external_seller_uid}_${c.month}_${c.year}`)));
}

export function agruparPorParceiro(comissoes: any[]) {
  const m = new Map<string, { uid: string; nome: string; itens: any[]; total: number }>();
  for (const c of comissoes) {
    const g = m.get(c.external_seller_uid) || { uid: c.external_seller_uid, nome: c.external_seller_name || '', itens: [], total: 0 };
    g.itens.push(c);
    g.total += Number(c.value) || 0;
    m.set(c.external_seller_uid, g);
  }
  return Array.from(m.values()).sort((a, b) => b.total - a.total);
}

// Trava por tarefa e mês. Devolve false (e não roda) se a tarefa daquele mês já foi pega.
export async function comTravaMensal(db: any, tarefa: string, ciclo: { month: number; year: number }, fn: () => Promise<any>): Promise<boolean> {
  const id = `${tarefa}_${ciclo.year}-${String(ciclo.month).padStart(2, '0')}`;
  const ref = db.collection('cron_locks').doc(id);
  try {
    await ref.create({ job: tarefa, month: ciclo.month, year: ciclo.year, started_at: new Date().toISOString() });
  } catch (e: any) {
    // ALREADY_EXISTS (código 6): outro processo já mandou, ou está mandando
    if (e?.code === 6) console.log(`[CRON] ${id}: já executado ou em execução.`);
    else console.error(`[CRON] ${id}: não consegui criar a trava:`, e?.message);
    return false;
  }
  try {
    const r = await fn();
    await ref.set({ finished_at: new Date().toISOString(), ...(r && typeof r === 'object' ? r : {}) }, { merge: true });
  } catch (e: any) {
    // a trava fica: repetir no automático mandaria de novo o que já saiu antes do erro
    await ref.set({ error: String(e?.message || e), failed_at: new Date().toISOString() }, { merge: true }).catch(() => {});
    console.error(`[CRON] ${id}: erro:`, e?.message);
  }
  return true;
}

async function lerIndicacoes(db: any, ids: string[]) {
  const m = new Map<string, any>();
  for (const id of Array.from(new Set(ids.filter(Boolean)))) {
    const s = await db.collection('indications').doc(id).get();
    if (s.exists) m.set(id, s.data());
  }
  return m;
}

export type DepsRelatorio = {
  db: any;
  enviar: (to: string, subject: string, html: string, opts?: any) => Promise<any>;
  formatCurrency: (v: number) => string;
  getFinanceReplyTo: (notif: any) => string[];
  agora?: () => Date;
  appUrl?: string;
};

async function lerAvisos(db: any) {
  const s = await db.collection('settings').doc('notifications').get();
  return (s.exists ? s.data() : null) || null;
}

const emailDeVerdade = (e: any) => !!e && String(e).includes('@') && !String(e).endsWith('@mobile.roder.com.br');

// ---------- Dia 1: parceiro (pedido da nota fiscal) ----------
export async function relatorioParceirosDia1(deps: DepsRelatorio) {
  const { db, formatCurrency } = deps;
  const notif = await lerAvisos(db);
  if (!notif?.monthly_report_partners) return 'desligado';
  const agora = deps.agora ? deps.agora() : new Date();
  const ciclo = mesEmBrasilia(agora);
  const ant = mesAnterior(ciclo);
  const lastMonth = new Date(ant.year, ant.month - 1, 1);
  return comTravaMensal(db, 'relatorio_parceiros_dia1', ciclo, async () => {
    const grupos = agruparPorParceiro(await comissoesDoCiclo(db, ciclo));
    const inds = await lerIndicacoes(db, grupos.flatMap(g => g.itens.map(c => c.indication_id)));
    let enviados = 0;
    for (const g of grupos) {
      const partnerData = await db.collection('users').doc(g.uid).get();
      if (!partnerData.exists) continue;
      const partner = partnerData.data() as any;
      if (!emailDeVerdade(partner.email)) continue;
      const totalCommissions = g.total;
      if (totalCommissions <= 0) continue;
      const monthName = lastMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      const financeReplyTo = deps.getFinanceReplyTo(notif);
      const firstName = String(partner.name || '').split(' ')[0] || 'parceiro';
      const linhas = g.itens.map(c => ({ c, x: inds.get(c.indication_id) || {} }));
      // comissão de mês anterior que não foi paga entra no total: aí não são só as vendas do mês
      const temAcumulado = g.itens.some(c => c.acumulado);

      const html = `
        <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 620px;">
          <p style="font-size: 16px;">Olá, ${firstName}!</p>
          <p style="font-size: 15px; line-height: 1.6;">${temAcumulado
            ? `Este é o resumo das suas <strong>comissões a receber</strong>: as de <strong>${monthName}</strong> e as de meses anteriores que ficaram acumuladas para este pagamento. Muito obrigado pela parceria e pela confiança na Roder.`
            : `É um prazer informar que as suas indicações geraram vendas em <strong>${monthName}</strong>. Muito obrigado pela parceria e pela confiança na Roder.`}</p>

          <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 18px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #9a3412; text-transform: uppercase; letter-spacing: .05em;">Sua comissão a receber</p>
            <p style="margin: 6px 0 0 0; font-size: 30px; font-weight: 800; color: #c2410c;">${formatCurrency(totalCommissions)}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="color: #6b7280; text-align: left;">
                <th style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Cliente</th>
                <th style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Equipamento</th>
                <th style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">Comissão</th>
              </tr>
            </thead>
            <tbody>
              ${linhas.map(({ c, x }) => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${x.client_name || x.client_person_name || ''}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${x.base_machine || x.product_name || ''}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: bold;">${formatCurrency(Number(c.value) || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; font-size: 14px; line-height: 1.6;">
            <p style="margin: 0;"><strong>Próximo passo: nota fiscal de serviço</strong></p>
            <p style="margin: 6px 0 0 0;">Nosso setor financeiro está aguardando a sua <strong>nota fiscal de serviço no valor de ${formatCurrency(totalCommissions)}</strong>.</p>
            <p style="margin: 6px 0 0 0;">Basta <strong>responder este e-mail com a nota fiscal anexada</strong> até o dia <strong>05</strong>. A resposta vai direto para o nosso financeiro, e o pagamento é feito até o dia <strong>07</strong> (se cair em fim de semana ou feriado, no próximo dia útil).</p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #6b7280;">Se preferir, você também pode carregar a nota no Roder Indica, na tela Comissões.</p>
          </div>

          <p style="font-size: 14px; margin-top: 24px;">Um abraço,<br><strong>Equipe Roder Máquinas e Equipamentos</strong></p>
        </div>
      `;

      await deps.enviar(partner.email, temAcumulado ? `Suas comissões Roder a receber: ${formatCurrency(totalCommissions)}` : `Sua comissão Roder de ${monthName}: ${formatCurrency(totalCommissions)}`, html, { replyTo: financeReplyTo, fromName: 'Roder Máquinas' });
      enviados++;
    }
    return { enviados };
  });
}

// ---------- Dia 5: lembrete da nota fiscal ao parceiro ----------
export async function lembreteNfDia5(deps: DepsRelatorio) {
  const { db } = deps;
  const notif = await lerAvisos(db);
  if (!notif?.monthly_report_partners) return 'desligado';
  const agora = deps.agora ? deps.agora() : new Date();
  const ciclo = mesEmBrasilia(agora);
  return comTravaMensal(db, 'lembrete_nf_dia5', ciclo, async () => {
    const grupos = agruparPorParceiro(await comissoesDoCiclo(db, ciclo));
    let enviados = 0;
    for (const g of grupos) {
      if (g.total <= 0) continue;
      // Já enviou a NF? (a NF fica em monthly_statements/{uid}_{mês}_{ano}, pelo mês da comissão)
      const candidatos = Array.from(new Set(g.itens.map(c => `${g.uid}_${c.month}_${c.year}`)));
      let alreadySent = false;
      for (const stId of candidatos) {
        const st = await db.collection('monthly_statements').doc(stId).get();
        const stData = st.exists ? (st.data() as any) : null;
        if (stData && (stData.nf_url || stData.status === 'waiting_payment' || stData.status === 'paid')) { alreadySent = true; break; }
      }
      if (alreadySent) continue;

      const partnerData = await db.collection('users').doc(g.uid).get();
      if (!partnerData.exists) continue;
      const partner = partnerData.data() as any;
      if (!emailDeVerdade(partner.email)) continue;

      const html = `
          <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #ef4444;">⚠️ AVISO: Último dia para envio da Nota Fiscal</h2>
            <p>Olá ${partner.name},</p>
            <p>Identificamos que a sua Nota Fiscal referente às comissões do mês passado ainda não foi carregada no sistema.</p>

            <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0; font-weight: bold; color: #991b1b;">PRAZO FINAL: HOJE</p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Conforme contrato, o não envio da NF até o dia 05 (hoje) impossibilita o pagamento neste ciclo. O valor será acumulado para o pagamento do próximo mês.</p>
            </div>

            <p>Para garantir seu recebimento, <strong>responda este e-mail com a nota fiscal anexada</strong> (vai direto para o nosso financeiro) ou carregue a nota no sistema.</p>
            <a href="${deps.appUrl || 'https://roder-indica.web.app'}/comissoes" style="display: inline-block; background: #eab308; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Minhas Comissões</a>
          </div>
        `;

      await deps.enviar(partner.email, `Último dia para enviar a nota fiscal da sua comissão Roder`, html, { replyTo: deps.getFinanceReplyTo(notif), fromName: 'Roder Máquinas' });
      enviados++;
    }
    return { enviados };
  });
}

function emailsDoFinanceiro(notif: any) {
  const financeEmails = ['financeiro@roderbrasil.com.br', 'financeiro2@roderbrasil.com.br', 'jeferson@roderbrasil.com.br'];
  if (notif?.finance_email) {
    String(notif.finance_email).split(',').map((e: string) => e.trim()).filter(Boolean).forEach((email: string) => {
      if (!financeEmails.map(x => x.toLowerCase()).includes(email.toLowerCase())) financeEmails.push(email);
    });
  }
  return financeEmails;
}

// data da venda (pedido) da indicação, AAAA-MM-DD; sem ela, o updated_at antigo
function dataDaVenda(ind: any): string {
  return String(ind.sale_date || ind.sale_order_date || '').slice(0, 10) || (ind.updated_at ? new Date(ind.updated_at).toLocaleDateString('en-CA', { timeZone: FUSO_BR }) : '');
}

// ---------- Dia 1: diretoria/gestão e resumo do financeiro ----------
export async function relatorioDiretoriaDia1(deps: DepsRelatorio) {
  const { db, formatCurrency } = deps;
  const notif = await lerAvisos(db);
  if (!notif?.monthly_report_directors) return 'desligado';
  const now = deps.agora ? deps.agora() : new Date();
  const ciclo = mesEmBrasilia(now);
  const ant = mesAnterior(ciclo);
  const lastMonth = new Date(ant.year, ant.month - 1, 1);
  const prefixoMes = `${ant.year}-${String(ant.month).padStart(2, '0')}`;

  return comTravaMensal(db, 'relatorio_diretoria_dia1', ciclo, async () => {
    const indicationsSnap = await db.collection('indications').where('status', '==', 'sold').get();
    const negotiatingSnap = await db.collection('indications').where('status', '==', 'negotiating').get();

    // Vendas do mês anterior pela data do pedido (e não pela última edição)
    const monthlySales = indicationsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any))
      .filter((d: any) => dataDaVenda(d).startsWith(prefixoMes));

    const activeNegotiations = negotiatingSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any))
      .filter((d: any) => {
        if (!d.budget_date) return false;
        const daysOld = (now.getTime() - new Date(d.budget_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysOld <= 60; // Proteção de 60 dias
      });

    // Comissões a pagar neste mês, pelo documento da comissão
    const comissoes = await comissoesDoCiclo(db, ciclo);
    const grupos = agruparPorParceiro(comissoes);
    const indsComissao = await lerIndicacoes(db, comissoes.map((c: any) => c.indication_id));

    if (monthlySales.length === 0 && activeNegotiations.length === 0 && comissoes.length === 0) return { enviados: 0 };

    const totalSalesValue = monthlySales.reduce((acc: number, curr: any) => acc + (curr.sale_value || 0), 0);
    const totalCommissions = grupos.reduce((acc, g) => acc + g.total, 0);
    const totalNegotiatingValue = activeNegotiations.reduce((acc: number, curr: any) => acc + (curr.sale_value || 0), 0);

    // Ranking por vendedor (vendas do mês)
    const sellersMap: any = {};
    monthlySales.forEach((sale: any) => {
      const sid = sale.external_seller_uid || `nome:${sale.external_seller_name || ''}`;
      if (!sellersMap[sid]) sellersMap[sid] = { name: sale.external_seller_name, count: 0, total: 0, saleTimes: [] };
      sellersMap[sid].count++;
      sellersMap[sid].total += (sale.sale_value || 0);
      if (sale.created_at && sale.updated_at) {
        const t = (new Date(sale.updated_at).getTime() - new Date(sale.created_at).getTime()) / (1000 * 60 * 60 * 24);
        sellersMap[sid].saleTimes.push(t);
      }
    });
    const sellersRanking = Object.values(sellersMap).sort((a: any, b: any) => b.total - a.total);

    const monthName = lastMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 900px;">
        <h1 style="color: #eab308; border-bottom: 2px solid #eab308; padding-bottom: 10px;">Relatório de Vendas - ${monthName}</h1>

        <div style="display: flex; gap: 20px; margin: 20px 0;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">VENDAS TOTAIS (NF)</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #eab308;">${formatCurrency(totalSalesValue)}</p>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">EM NEGOCIAÇÃO (ABERTO)</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #3b82f6;">${formatCurrency(totalNegotiatingValue)}</p>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">COMISSÕES À PAGAR</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #0f172a;">${formatCurrency(totalCommissions)}</p>
          </div>
        </div>

        <h2 style="font-size: 18px; margin-top: 30px;">Destaques por Vendedor</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Vendedor</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Vendas</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">T. Médio (Dias)</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Valor Total (NF)</th>
            </tr>
          </thead>
          <tbody>
            ${sellersRanking.map((s: any) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${s.name}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${s.count}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${s.saleTimes.length > 0 ? (s.saleTimes.reduce((a: any, b: any) => a + b, 0) / s.saleTimes.length).toFixed(1) : 'N/A'}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${formatCurrency(s.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2 style="font-size: 18px; margin-top: 40px;">Listagem Detalhada de Vendas</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Cliente</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Equipamento</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Indicador</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Vendedor Interno</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Valor Venda</th>
            </tr>
          </thead>
          <tbody>
            ${monthlySales.map((sale: any) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.client_name}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.product_name}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.external_seller_name || '-'}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.internal_seller_name || '-'}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatCurrency(sale.sale_value || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2 style="font-size: 18px; margin-top: 40px; color: #3b82f6;">Orçamentos em Aberto (Válidos)</h2>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">Estas negociações ainda estão dentro do prazo de 60 dias e são prioridade para reuniões de acompanhamento.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
          <thead>
            <tr style="background: #eff6ff; text-align: left;">
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Cliente</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Equipamento</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Interno</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Enviado em</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Validade</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Previsão</th>
            </tr>
          </thead>
          <tbody>
            ${activeNegotiations.map((neg: any) => {
              const bDate = new Date(neg.budget_date);
              const daysLeft = 60 - Math.floor((now.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
              return `
                <tr>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${neg.client_name}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${neg.product_name}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${neg.internal_seller_name || '-'}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${bDate.toLocaleDateString('pt-BR')}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; color: ${daysLeft <= 5 ? '#ef4444' : '#64748b'}; font-weight: bold;">
                    ${daysLeft} dias
                  </td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatCurrency(neg.sale_value || 0)}</td>
                </tr>
              `;
            }).join('')}
            ${activeNegotiations.length === 0 ? '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #94a3b8;">Nenhuma negociação ativa no momento.</td></tr>' : ''}
          </tbody>
        </table>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Este relatório contém valores reais de nota fiscal para fins gerenciais.
        </p>
      </div>
    `;

    const recipients = [
      ...(notif.manager_emails ? String(notif.manager_emails).split(',').map((e: string) => e.trim()) : []),
      ...(notif.director_emails ? String(notif.director_emails).split(',').map((e: string) => e.trim()) : []),
    ].filter(e => e !== '');
    let enviados = 0;
    for (const email of recipients) { await deps.enviar(email, `Relatório de Vendas Roder - ${monthName}`, html); enviados++; }

    // Dados bancários de cada parceiro com comissão a pagar
    const detailedSellers = await Promise.all(grupos.map(async (g) => {
      const userDoc = await db.collection('users').doc(g.uid).get();
      const userData = userDoc.exists ? (userDoc.data() || {}) : null;
      return {
        name: (userData && userData.name) || g.nome,
        commissions: g.total,
        pix_key: userData ? (userData.pix_key || 'Não informado') : '-',
        bank_info: (userData && userData.bank_info) || { bank: '-', agency: '-', account: '-' },
      };
    }));

    const financeHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 900px;">
        <h1 style="color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">Previsão de Pagamentos - ${monthName}</h1>
        <p>O valor total de comissões para as vendas de <strong>${monthName}</strong> é de: <strong style="font-size: 18px; color: #eab308;">${formatCurrency(totalCommissions)}</strong>.</p>
        <p>Abaixo seguem os detalhes de cada vendedor e suas respectivas informações bancárias para processamento do pagamento.</p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Vendedor</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Comissão</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Chave PIX</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Dados Bancários</th>
            </tr>
          </thead>
          <tbody>
            ${detailedSellers.map((s: any) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${s.name}</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${formatCurrency(s.commissions)}</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #666;">${s.pix_key}</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-size: 11px; color: #666;">
                  ${s.bank_info?.bank ? `Bco: ${s.bank_info.bank}<br>Ag: ${s.bank_info.agency}<br>Cc: ${s.bank_info.account}` : 'N/A'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2 style="font-size: 16px; margin-top: 35px; border-bottom: 2px solid #0f172a; padding-bottom: 5px; color: #0f172a; font-weight: bold;">Detalhamento das Indicações Faturadas no Mês (Roder Indica)</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Cliente</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Parceiro Indicador</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Equipamento(s)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Valor Venda (R$)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Base Comissionável (R$)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Alíquota (%)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Comissão (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${comissoes.map((c: any) => { const sale = indsComissao.get(c.indication_id) || {}; return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.client_name || "Não informado"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${c.external_seller_name || sale.external_seller_name || "-"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${sale.product_name || sale.base_machine || "-"}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(sale.sale_value || 0)}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatCurrency(Number(c.base_value_used) || 0)}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${c.rate_applied !== undefined && c.rate_applied !== null ? `${c.rate_applied}%` : '-'}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #16a34a;">${formatCurrency(Number(c.value) || 0)}</td>
              </tr>
            `; }).join('')}
            ${comissoes.length === 0 ? '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #64748b;">Nenhum faturamento registrado no mês anterior.</td></tr>' : ''}
          </tbody>
        </table>

        <p style="margin-top: 25px; font-size: 12px; color: #666; font-style: italic;">
          * Por favor, verifique se os vendedores enviaram as Notas Fiscais no sistema antes de efetivar o pagamento.
        </p>
      </div>
    `;

    for (const email of emailsDoFinanceiro(notif)) { await deps.enviar(email, `Financeiro: Relatório de Pagamentos - ${monthName}`, financeHtml); enviados++; }
    return { enviados };
  });
}

// ---------- Dia 7: lembrete de pagamento ao financeiro ----------
export async function lembreteFinanceiroDia7(deps: DepsRelatorio) {
  const { db, formatCurrency } = deps;
  const notif = await lerAvisos(db);
  if (!notif?.payment_reminder_finance) return 'desligado';
  const agora = deps.agora ? deps.agora() : new Date();
  const ciclo = mesEmBrasilia(agora);
  return comTravaMensal(db, 'lembrete_financeiro_dia7', ciclo, async () => {
    const monthlyCommissions = (await comissoesDoCiclo(db, ciclo)).reduce((acc: number, c: any) => acc + (Number(c.value) || 0), 0);
    if (monthlyCommissions === 0) return { enviados: 0 };

    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #0f172a;">Lembrete de Pagamento de Comissões</h2>
        <p>Olá Setor Financeiro / Jeferson,</p>
        <p>Hoje é dia 7. Lembramos que o valor total de comissões calculadas para o fechamento do mês anterior é de:</p>
        <div style="font-size: 36px; font-weight: 900; color: #eab308; margin: 20px 0;">${formatCurrency(monthlyCommissions)}</div>
        <p>Após realizar os pagamentos, por favor, certifique que as notas fiscais foram enviadas no sistema e carregue os respectivos comprovantes para notificar os parceiros.</p>
      </div>
    `;
    let enviados = 0;
    for (const email of emailsDoFinanceiro(notif)) { await deps.enviar(email, `URGENTE: Pagamento de Comissões do Mês`, html); enviados++; }
    return { enviados };
  });
}

// ---------- Liga os três e-mails de comissão, uma vez só (pedido do Jeferson, 19/10/2026) ----------
// Os três interruptores nasceram desligados e ninguém ligou: o parceiro não recebia o aviso do dia 1
// nem o lembrete da nota, e o financeiro não recebia o do dia 7. Liga os três UMA vez, com trava em
// cron_locks: se depois alguém desligar na tela, o servidor não liga de novo a cada reinício.
export const TRAVA_LIGAR_EMAILS = 'ligar_emails_comissao_v1';
export async function ligarEmailsComissaoUmaVez(db: any, agora: Date = new Date()): Promise<'ligado' | 'ja_rodou' | 'erro'> {
  const trava = db.collection('cron_locks').doc(TRAVA_LIGAR_EMAILS);
  try {
    await trava.create({ job: TRAVA_LIGAR_EMAILS, started_at: agora.toISOString() });
  } catch (e: any) {
    if (e?.code === 6) return 'ja_rodou';
    console.error('[EMAILS-COMISSAO] Não consegui criar a trava:', e?.message);
    return 'erro';
  }
  try {
    const flags = { monthly_report_partners: true, monthly_report_directors: true, payment_reminder_finance: true };
    await db.collection('settings').doc('notifications').set({ ...flags, updated_at: agora.toISOString() }, { merge: true });
    await trava.set({ finished_at: new Date().toISOString(), ...flags }, { merge: true });
    console.log('[EMAILS-COMISSAO] Ligados: e-mail do parceiro (dia 1 e dia 5), relatório da diretoria (dia 1) e lembrete ao financeiro (dia 7).');
    return 'ligado';
  } catch (e: any) {
    // apaga a trava para tentar de novo no próximo início: um erro passageiro não pode deixar os e-mails desligados
    await trava.delete().catch(() => {});
    console.error('[EMAILS-COMISSAO] Erro ao ligar:', e?.message);
    return 'erro';
  }
}
