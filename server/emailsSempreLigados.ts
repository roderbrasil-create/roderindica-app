// Os seis avisos por e-mail abaixo deixaram de ter interruptor na tela de Configurações: são regra
// do sistema e ficam sempre ligados. Como parte da leitura (relatoriosComissao, emailService) trata
// "chave ausente" como desligado, o servidor grava true ao iniciar se alguma estiver diferente.
// Os campos de e-mail da diretoria, do financeiro e da gestão não são tocados.
export const CHAVES_SEMPRE_LIGADAS = [
  'monthly_report_partners',
  'monthly_report_directors',
  'payment_reminder_finance',
  'confirmation_partner',
  'status_change_partner',
  'commission_approved_partner',
] as const;

export async function garantirEmailsLigados(db: any, agora: Date = new Date()): Promise<'ajustado' | 'ja_ligados' | 'erro'> {
  try {
    const ref = db.collection('settings').doc('notifications');
    const snap = await ref.get();
    const atual = (snap.exists ? snap.data() : {}) || {};
    const faltando = CHAVES_SEMPRE_LIGADAS.filter((k) => atual[k] !== true);
    if (!faltando.length) return 'ja_ligados';
    const ligar: Record<string, any> = { updated_at: agora.toISOString() };
    for (const k of faltando) ligar[k] = true;
    await ref.set(ligar, { merge: true });
    console.log('[EMAILS-LIGADOS] Ligados de novo: ' + faltando.join(', '));
    return 'ajustado';
  } catch (e: any) {
    console.error('[EMAILS-LIGADOS] Não consegui conferir os avisos por e-mail:', e?.message);
    return 'erro';
  }
}
