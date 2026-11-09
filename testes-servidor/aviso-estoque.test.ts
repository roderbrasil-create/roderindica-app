import test from 'node:test';
import assert from 'node:assert/strict';
import { enviarAvisoEstoquePendente, marcarEnvioEstoque } from '../server/avisoEstoque';

function dbFalso(users: any[]) {
  const settings: Record<string, any> = {};
  return {
    settings,
    collection: (nome: string) => nome === 'users'
      ? { get: async () => ({ docs: users.map(u => ({ data: () => u })) }) }
      : { doc: (id: string) => ({
          get: async () => ({ exists: !!settings[id], data: () => settings[id] }),
          set: async (d: any) => { settings[id] = { ...(settings[id] || {}), ...d }; },
        }) },
  } as any;
}
const equipe = [
  { email: 'Vendas@x.com', status: 'active', role: 'vendedor_padrao' },
  { email: 'gerente@x.com', status: 'active', role: 'manager' },
  { email: 'parceiro@x.com', status: 'active', role: 'partner' },
  { email: 'inativo@x.com', status: 'inactive', role: 'manager' },
];

test('AVISO DE ESTOQUE: um e-mail só, 15 min depois do último envio do Vision, só para a equipe ativa', async () => {
  const db = dbFalso(equipe);
  const enviados: string[] = [];
  const enviar = async (to: string) => { enviados.push(to); };
  const t0 = new Date('2026-11-09T14:00:00Z');
  // quatro envios (origens/filiais) em sequência: cada um reinicia a contagem
  for (let i = 0; i < 4; i++) await marcarEnvioEstoque(db, new Date(t0.getTime() + i * 60_000));
  const deps = (min: number) => ({ db, enviar, appOrigin: 'https://roderindica.com', agora: () => new Date(t0.getTime() + min * 60_000), log: () => {} });
  assert.equal(await enviarAvisoEstoquePendente(deps(10)), 0); // 7 min depois do último: cedo
  assert.equal(enviados.length, 0);
  const n = await enviarAvisoEstoquePendente(deps(19)); // 16 min depois do último
  assert.equal(n, 3);
  assert.deepEqual(enviados.sort(), ['gerente@x.com', 'roderbrasil@gmail.com', 'vendas@x.com']);
  assert.equal(await enviarAvisoEstoquePendente(deps(25)), 0); // já enviou, nada pendente
  assert.equal(enviados.length, 3);
});

test('AVISO DE ESTOQUE: correção no mesmo dia não gera segundo e-mail', async () => {
  const db = dbFalso(equipe);
  let total = 0;
  const enviar = async () => { total++; };
  const t0 = new Date('2026-11-09T14:00:00Z');
  await marcarEnvioEstoque(db, t0);
  await enviarAvisoEstoquePendente({ db, enviar, appOrigin: 'x', agora: () => new Date(t0.getTime() + 20 * 60_000), log: () => {} });
  const depois = total;
  await marcarEnvioEstoque(db, new Date(t0.getTime() + 3 * 3600_000));
  await enviarAvisoEstoquePendente({ db, enviar, appOrigin: 'x', agora: () => new Date(t0.getTime() + 3 * 3600_000 + 20 * 60_000), log: () => {} });
  assert.equal(total, depois);
  // na semana seguinte volta a avisar
  const prox = new Date('2026-11-16T14:00:00Z');
  await marcarEnvioEstoque(db, prox);
  await enviarAvisoEstoquePendente({ db, enviar, appOrigin: 'x', agora: () => new Date(prox.getTime() + 20 * 60_000), log: () => {} });
  assert.equal(total, depois * 2);
});
