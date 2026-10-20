import test from 'node:test';
import assert from 'node:assert/strict';
import { garantirEmailsLigados, CHAVES_SEMPRE_LIGADAS } from '../server/emailsSempreLigados';

function bancoFalso(inicial: any) {
  const dados: any = { notifications: inicial };
  return {
    dados,
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: dados.notifications !== undefined, data: () => dados.notifications }),
        set: async (v: any, opc: any) => { dados.notifications = opc?.merge ? { ...(dados.notifications || {}), ...v } : v; },
      }),
    }),
  };
}

test('liga os seis avisos que estavam desligados ou ausentes e preserva os e-mails de destino', async () => {
  const db = bancoFalso({ monthly_report_partners: false, status_change_partner: false, director_emails: 'a@roder.com.br' });
  assert.equal(await garantirEmailsLigados(db), 'ajustado');
  for (const k of CHAVES_SEMPRE_LIGADAS) assert.equal(db.dados.notifications[k], true, k);
  assert.equal(db.dados.notifications.director_emails, 'a@roder.com.br');
});

test('não grava nada quando os seis já estão ligados', async () => {
  const ligados = Object.fromEntries(CHAVES_SEMPRE_LIGADAS.map((k) => [k, true]));
  const db = bancoFalso(ligados);
  assert.equal(await garantirEmailsLigados(db), 'ja_ligados');
});

test('sem o documento de notificações, cria com os seis ligados', async () => {
  const db = bancoFalso(undefined);
  assert.equal(await garantirEmailsLigados(db), 'ajustado');
  for (const k of CHAVES_SEMPRE_LIGADAS) assert.equal(db.dados.notifications[k], true, k);
});
