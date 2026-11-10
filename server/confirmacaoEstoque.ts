// E-mail de confirmação quando o estoque chega do Roder Vision.
// Cada Salvar no Vision gera vários envios (um por origem). O Vision manda "lote" (id do salvamento),
// "lote_parte", "lote_total", "enviado_por" {nome, email} e "arquivo". Aqui cada parte é guardada por lote
// (estoque_lotes_partes) e, quando todas chegam (ou 3 minutos depois da última), sai UM e-mail só.
// Envio sem "lote" (automático ou antigo) não gera e-mail. Não muda a resposta do endpoint.

export const ESPERA_LOTE_MS = 3 * 60 * 1000;
export const EMAIL_ACOMPANHAMENTO = 'roderbrasil@gmail.com';
export const DOMINIO_RODER = '@roderbrasil.com.br';

const txt = (v: unknown, max = 200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const idSeguro = (v: string) => v.replace(/[^\w.-]/g, '_').slice(0, 120);

export type DadosLote = { lote: string; parte: number; total: number; arquivo: string; enviadoPorNome: string; enviadoPorEmail: string };

/** Lê os campos de lote do corpo. Devolve null se o envio não tem lote (nada de e-mail). */
export function lerLote(corpo: any): DadosLote | null {
  const lote = txt(corpo?.lote, 120);
  if (!lote) return null;
  const parte = Math.floor(Number(corpo?.lote_parte));
  const total = Math.floor(Number(corpo?.lote_total));
  return {
    lote,
    parte: Number.isFinite(parte) && parte > 0 ? parte : 0,
    total: Number.isFinite(total) && total > 0 ? total : 0,
    arquivo: txt(corpo?.arquivo, 200),
    enviadoPorNome: txt(corpo?.enviado_por?.nome, 120),
    enviadoPorEmail: txt(corpo?.enviado_por?.email, 200).toLowerCase(),
  };
}

export type ResultadoParte = { ok: boolean; status: number; origem: string; filial: string; criados?: number; atualizados?: number; removidos?: number; ignorados?: number; reservas_preservadas?: number; erro?: string };

/** Guarda o resultado de UMA parte do lote. Repetir a mesma parte sobrescreve (reenvio). */
export async function registrarParteLote(db: any, d: DadosLote, r: ResultadoParte, agora: Date) {
  const iso = agora.toISOString();
  await db.collection('estoque_lotes_partes').doc(`${idSeguro(d.lote)}__${d.parte}`).set({ lote: d.lote, parte: d.parte, ...r, em: iso }, { merge: true });
  await db.collection('estoque_lotes').doc(idSeguro(d.lote)).set({
    lote: d.lote, total: d.total, arquivo: d.arquivo, enviado_por_nome: d.enviadoPorNome, enviado_por_email: d.enviadoPorEmail,
    ultima_parte_em: iso, pendente: true,
  }, { merge: true });
}

export type DepsConfirmacao = {
  db: any;
  enviar: (to: string, subject: string, html: string, opts?: any) => Promise<any>;
  agora?: () => Date;
  log?: (...a: any[]) => void;
};

const dataBr = (d: Date) => {
  const p = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const g = (t: string) => p.find(x => x.type === t)?.value || '';
  return { curta: `${g('day')}/${g('month')} ${g('hour')}:${g('minute')}`, longa: `${g('day')}/${g('month')}/${g('year')} às ${g('hour')}:${g('minute')}` };
};

export function montarEmailLote(lote: any, partes: any[], itensNoIndica: number, agora: Date) {
  const ordenadas = [...partes].sort((a, b) => a.parte - b.parte);
  const falhas = ordenadas.filter(p => !p.ok);
  const total = Number(lote.total) || 0;
  const recebidas = new Set(ordenadas.map(p => p.parte));
  const faltando: number[] = [];
  for (let i = 1; i <= total; i++) if (!recebidas.has(i)) faltando.push(i);
  const incompleto = falhas.length > 0 || faltando.length > 0;
  const quando = dataBr(agora);
  const assunto = incompleto ? '⚠ Estoque NÃO foi atualizado por completo' : `Estoque atualizado no Roder Indica · ${quando.curta}`;
  const quem = lote.enviado_por_nome || lote.enviado_por_email || 'envio automático';
  const nomeParte = (p: any) => `${esc(txt(p.origem))} (${esc(txt(p.filial))})`;
  const linhas = ordenadas.map(p => p.ok
    ? `<tr><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${nomeParte(p)}</td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${p.criados ?? 0} criados · ${p.atualizados ?? 0} atualizados · ${p.removidos ?? 0} removidos · ${p.ignorados ?? 0} ignorados · ${p.reservas_preservadas ?? 0} reservas preservadas</td></tr>`
    : `<tr><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;color:#b91c1c"><b>${nomeParte(p)}</b></td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;color:#b91c1c">FALHOU (parte ${p.parte}): ${esc(txt(p.erro || `erro ${p.status}`, 300))}</td></tr>`).join('');
  const avisos = [
    ...faltando.map(n => `<li>A parte ${n} de ${total} não chegou em 3 minutos. Essa origem NÃO foi atualizada.</li>`),
    ...falhas.map(p => `<li>A parte ${p.parte} (${nomeParte(p)}) falhou: ${esc(txt(p.erro || `erro ${p.status}`, 300))}</li>`),
  ].join('');
  const html = `<div style="font-family:sans-serif;color:#333;max-width:640px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px">
<h2 style="margin:0 0 12px;color:${incompleto ? '#b91c1c' : '#166534'}">${incompleto ? '⚠ Estoque NÃO foi atualizado por completo' : 'Estoque atualizado no Roder Indica'}</h2>
<p style="margin:4px 0"><b>Enviado por:</b> ${esc(quem)}</p>
<p style="margin:4px 0"><b>Arquivo:</b> ${esc(lote.arquivo || 'não informado')}</p>
<p style="margin:4px 0 14px"><b>Data e hora:</b> ${quando.longa}</p>
${incompleto ? `<ul style="color:#b91c1c;margin:0 0 14px">${avisos}</ul>` : ''}
<table style="width:100%;border-collapse:collapse;font-size:14px">${linhas}</table>
<p style="margin:14px 0 0"><b>Total de itens com estoque no Indica depois da atualização:</b> ${itensNoIndica}</p>
<p style="font-size:12px;color:#94a3b8;margin-top:18px">E-mail automático do Roder Indica. Lote ${esc(lote.lote)}.</p></div>`;
  return { assunto, html, incompleto };
}

export function destinatariosLote(lote: any): string[] {
  const out = new Set<string>([EMAIL_ACOMPANHAMENTO]);
  const e = txt(lote.enviado_por_email, 200).toLowerCase();
  if (e.endsWith(DOMINIO_RODER)) out.add(e);
  return [...out];
}

/** Roda de minuto em minuto: manda o e-mail dos lotes completos ou parados há 3 minutos. */
export async function enviarConfirmacoesPendentes(deps: DepsConfirmacao): Promise<number> {
  const agora = deps.agora ? deps.agora() : new Date();
  const log = deps.log || console.log;
  const s = await deps.db.collection('estoque_lotes').where('pendente', '==', true).get();
  let enviados = 0;
  for (const d of s.docs) {
    const lote = d.data();
    const ps = await deps.db.collection('estoque_lotes_partes').where('lote', '==', lote.lote).get();
    const partes = ps.docs.map((x: any) => x.data());
    const distintas = new Set(partes.map((p: any) => p.parte)).size;
    const completo = Number(lote.total) > 0 && distintas >= Number(lote.total);
    const parado = agora.getTime() - new Date(lote.ultima_parte_em).getTime() >= ESPERA_LOTE_MS;
    if (!completo && !parado) continue;
    // Marca antes de enviar: a rodada seguinte não repete o e-mail.
    await deps.db.collection('estoque_lotes').doc(idSeguro(lote.lote)).set({ pendente: false, email_em: agora.toISOString() }, { merge: true });
    const itens = await deps.db.collection('stock_items').get();
    const comEstoque = itens.docs.filter((x: any) => (Number(x.data()?.quantity) || 0) > 0).length;
    const m = montarEmailLote(lote, partes, comEstoque, agora);
    for (const to of destinatariosLote(lote)) {
      try { await deps.enviar(to, m.assunto, m.html, { fromName: 'Roder Indica' }); enviados++; }
      catch (e: any) { log('[CONFIRMACAO-ESTOQUE] falhou para', to, e?.message || e); }
    }
    log(`[CONFIRMACAO-ESTOQUE] lote ${lote.lote}: ${m.incompleto ? 'INCOMPLETO' : 'ok'}`);
  }
  return enviados;
}
