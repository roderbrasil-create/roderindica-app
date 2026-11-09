// Aviso automático de estoque atualizado. O Rogério carrega UM arquivo no Roder Vision (normalmente
// toda segunda, ou na terça depois de feriado), o Vision manda um envio por origem e filial, e este
// módulo manda UM e-mail só, 15 minutos depois do ÚLTIMO envio recebido. Sem isso, o e-mail que antes
// saía por um clique na tela de Estoque deixava de sair, porque ninguém mais carrega o estoque lá.
// O estado fica em settings/estoque_vision (aviso_pendente), então reinício do servidor não perde o aviso.
import { ASSUNTO_ESTOQUE_ATUALIZADO, htmlEstoqueAtualizado } from '../src/services/emailService';

export const ESPERA_AVISO_ESTOQUE_MS = 15 * 60 * 1000;
// Correção no mesmo dia não gera segundo e-mail: o aviso é semanal.
export const INTERVALO_MINIMO_AVISO_MS = 12 * 60 * 60 * 1000;
export const PAPEIS_AVISO_ESTOQUE = ['external_seller', 'vendedor_padrao', 'internal_seller', 'manager', 'admin'];
export const EMAIL_ACOMPANHAMENTO_ESTOQUE = 'roderbrasil@gmail.com';

/** Chamado a cada envio de estoque do Vision aceito: reinicia a contagem dos 15 minutos. */
export async function marcarEnvioEstoque(db: any, agora: Date) {
  await db.collection('settings').doc('estoque_vision').set({ aviso_pendente: { ultimo_envio: agora.toISOString() } }, { merge: true });
}

export type DepsAvisoEstoque = {
  db: any;
  enviar: (to: string, subject: string, html: string, opts?: any) => Promise<any>;
  appOrigin: string;
  agora?: () => Date;
  log?: (...a: any[]) => void;
};

/** Roda de minuto em minuto. Devolve quantos e-mails saíram (0 se não era hora). */
export async function enviarAvisoEstoquePendente(deps: DepsAvisoEstoque): Promise<number> {
  const agora = (deps.agora ? deps.agora() : new Date());
  const log = deps.log || console.log;
  const ref = deps.db.collection('settings').doc('estoque_vision');
  const snap = await ref.get();
  const dados = snap.exists ? snap.data() : null;
  const ultimo = dados?.aviso_pendente?.ultimo_envio ? new Date(dados.aviso_pendente.ultimo_envio).getTime() : NaN;
  if (!Number.isFinite(ultimo)) return 0;
  if (agora.getTime() - ultimo < ESPERA_AVISO_ESTOQUE_MS) return 0;
  // Limpa ANTES de enviar: se o envio demorar e a rodada seguinte chegar, ela não manda de novo.
  const anterior = dados?.aviso_enviado_em ? new Date(dados.aviso_enviado_em).getTime() : NaN;
  const repetido = Number.isFinite(anterior) && agora.getTime() - anterior < INTERVALO_MINIMO_AVISO_MS;
  await ref.set({ aviso_pendente: null }, { merge: true });
  if (repetido) { log('[AVISO-ESTOQUE] já houve aviso nas últimas 12 horas, não repete.'); return 0; }

  const us = await deps.db.collection('users').get();
  const destinos = new Set<string>([EMAIL_ACOMPANHAMENTO_ESTOQUE]);
  for (const d of us.docs) {
    const u = d.data();
    if (u?.email && u?.status === 'active' && PAPEIS_AVISO_ESTOQUE.includes(u.role)) destinos.add(String(u.email).trim().toLowerCase());
  }
  const html = htmlEstoqueAtualizado(deps.appOrigin);
  let enviados = 0;
  for (const to of destinos) {
    try { await deps.enviar(to, ASSUNTO_ESTOQUE_ATUALIZADO, html, { fromName: 'Roder Brasil' }); enviados++; }
    catch (e: any) { log('[AVISO-ESTOQUE] falhou para', to, e?.message || e); }
  }
  await ref.set({ aviso_enviado_em: agora.toISOString(), aviso_enviados: enviados }, { merge: true });
  log(`[AVISO-ESTOQUE] e-mail de estoque atualizado enviado para ${enviados} de ${destinos.size}.`);
  return enviados;
}
