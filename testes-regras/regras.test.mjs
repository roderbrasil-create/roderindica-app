// Testes das regras do Firebase (Firestore e Storage), rodados no emulador oficial pelo
// GitHub Actions (.github/workflows/regras.yml). Cada teste descreve o que um tipo de
// usuário PRECISA conseguir fazer no app, ou o que NÃO pode fazer de jeito nenhum.
import { test, before, after, beforeEach } from 'node:test';
import fs from 'node:fs';
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where,
} from 'firebase/firestore';
import { ref, uploadBytes, getBytes } from 'firebase/storage';

let env;
const PROJ = 'demo-roder';

// Contas de teste. "password" simula conta criada pela tela de Usuários.
const contas = {
  jeferson: { uid: 'u_jef', token: { email: 'roderbrasil@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } } },
  gislene: { uid: 'u_gis', token: { email: 'gislene@roder.com.br', email_verified: false, firebase: { sign_in_provider: 'password' } } },
  luana: { uid: 'u_lua', token: { email: 'luana@roder.com.br', email_verified: false, firebase: { sign_in_provider: 'password' } } },
  heloisa: { uid: 'u_hel', token: { email: 'heloisa@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } } },
  vanessa: { uid: 'u_van', token: { email: 'financeiro2@roderbrasil.com.br', email_verified: false, firebase: { sign_in_provider: 'password' } } },
  parceiro: { uid: 'u_par', token: { email: 'parceiro@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } } },
  outroParceiro: { uid: 'u_par2', token: { email: 'outro@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } } },
  anonimo: { uid: 'u_anon', token: { firebase: { sign_in_provider: 'anonymous' } } },
};

const fs_ = (quem) => quem === null
  ? env.unauthenticatedContext().firestore()
  : env.authenticatedContext(contas[quem].uid, contas[quem].token).firestore();
const st_ = (quem) => quem === null
  ? env.unauthenticatedContext().storage()
  : env.authenticatedContext(contas[quem].uid, contas[quem].token).storage();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJ,
    firestore: { rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: fs.readFileSync(new URL('../storage.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9199 },
  });
});
after(async () => { await env?.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const u = (id, d) => setDoc(doc(db, 'users', id), { uid: id, status: 'active', ...d });
    await u('u_jef', { email: 'roderbrasil@gmail.com', role: 'admin', name: 'Jeferson' });
    await u('u_gis', { email: 'gislene@roder.com.br', role: 'manager', name: 'Gislene' });
    await u('u_lua', { email: 'luana@roder.com.br', role: 'triagem', name: 'Luana' });
    await u('u_hel', { email: 'heloisa@gmail.com', role: 'internal_seller', name: 'Heloisa' });
    await u('u_van', { email: 'financeiro2@roderbrasil.com.br', role: 'financial', name: 'Vanessa' });
    await u('u_par', { email: 'parceiro@gmail.com', role: 'external_seller', name: 'Parceiro' });
    await u('u_par2', { email: 'outro@gmail.com', role: 'external_seller', name: 'Outro' });
    await setDoc(doc(db, 'settings', 'email'), { user: 'x', pass: 'segredo' });
    await setDoc(doc(db, 'settings', 'notifications'), { manager_emails: [] });
    await setDoc(doc(db, 'settings', 'engate_rapido_ficha_a'), { image_url: 'x' });
    await setDoc(doc(db, 'indications', 'ind1'), { status: 'pending', external_seller_uid: 'u_par', client_name: 'Cliente' });
    await setDoc(doc(db, 'indications', 'ind2'), { status: 'negotiating', external_seller_uid: 'u_par', internal_seller_uid: 'u_hel' });
    await setDoc(doc(db, 'commissions', 'c1'), { external_seller_uid: 'u_par', status: 'pending', value: 1000 });
    await setDoc(doc(db, 'commissions', 'c2'), { external_seller_uid: 'u_par2', status: 'pending', value: 500 });
    await setDoc(doc(db, 'monthly_statements', 'u_par2_5_2026'), { seller_uid: 'u_par2', total_value: 500, status: 'waiting_nf' });
    await setDoc(doc(db, 'customer_evaluations', 'av1'), { status: 'pending', indication_id: 'ind2' });
    await setDoc(doc(db, 'fair_leads', 'f1'), { salesperson_uid: 'u_anon', name: 'Visitante' });
    await setDoc(doc(db, 'fair_leads', 'f2'), { salesperson_uid: 'u_hel', name: 'Outro' });
    await setDoc(doc(db, 'stock_items', 's1'), { quantity: 2, name: 'Garra' });
    await setDoc(doc(db, 'api_keys', 'k1'), { key: 'rod_live_x' });
  });
});

// ---------------- O QUE NÃO PODE ----------------

test('PARCEIRO não consegue se fazer admin', async () => {
  await assertFails(updateDoc(doc(fs_('parceiro'), 'users', 'u_par'), { role: 'admin' }));
});
test('VISITANTE ANÔNIMO não cria cadastro de admin para si', async () => {
  await assertFails(setDoc(doc(fs_('anonimo'), 'users', 'u_anon'), { role: 'admin', status: 'active', email: 'x' }));
});
test('CONTA NOVA sem papel não nasce com poder', async () => {
  const ctx = env.authenticatedContext('u_novo', { email: 'novo@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } });
  await assertFails(setDoc(doc(ctx.firestore(), 'users', 'u_novo'), { role: 'manager', status: 'active', email: 'novo@gmail.com' }));
  await assertSucceeds(setDoc(doc(ctx.firestore(), 'users', 'u_novo'), { role: 'external_seller', status: 'pending', email: 'novo@gmail.com' }));
});
test('A SENHA DO E-MAIL só o admin lê (nem gerente, nem parceiro, nem visitante)', async () => {
  await assertFails(getDoc(doc(fs_('parceiro'), 'settings', 'email')));
  await assertFails(getDoc(doc(fs_('anonimo'), 'settings', 'email')));
  await assertFails(getDoc(doc(fs_('gislene'), 'settings', 'email')));
  await assertSucceeds(getDoc(doc(fs_('jeferson'), 'settings', 'email')));
});
test('CHAVES DE API só o admin', async () => {
  await assertFails(getDocs(collection(fs_('gislene'), 'api_keys')));
  await assertSucceeds(getDocs(collection(fs_('jeferson'), 'api_keys')));
});
test('PARCEIRO não lê comissão de outro parceiro, nem o extrato dele', async () => {
  await assertFails(getDoc(doc(fs_('parceiro'), 'commissions', 'c2')));
  await assertFails(getDoc(doc(fs_('parceiro'), 'monthly_statements', 'u_par2_5_2026')));
});
test('PARCEIRO não muda o valor nem o status de pago da própria comissão', async () => {
  await assertFails(updateDoc(doc(fs_('parceiro'), 'commissions', 'c1'), { value: 99999 }));
  await assertFails(updateDoc(doc(fs_('parceiro'), 'commissions', 'c1'), { status: 'paid' }));
});
test('PARCEIRO não marca a própria indicação como vendida', async () => {
  await assertFails(updateDoc(doc(fs_('parceiro'), 'indications', 'ind1'), { status: 'sold' }));
});
test('VISITANTE não lê leads de feira de outros, nem a lista de usuários', async () => {
  await assertFails(getDoc(doc(fs_('anonimo'), 'fair_leads', 'f2')));
  await assertFails(getDocs(collection(fs_('anonimo'), 'users')));
  await assertFails(getDocs(collection(fs_('parceiro'), 'users')));
});
test('TRIAGEM não se promove a gerente nem cria admin', async () => {
  await assertFails(updateDoc(doc(fs_('luana'), 'users', 'u_lua'), { role: 'manager' }));
  await assertFails(setDoc(doc(fs_('luana'), 'users', 'u_x'), { role: 'admin', email: 'x@x.com' }));
});
test('GERENTE não mexe no cadastro do admin', async () => {
  await assertFails(updateDoc(doc(fs_('gislene'), 'users', 'u_jef'), { name: 'X' }));
});
test('VISITANTE não altera o estoque', async () => {
  await assertFails(updateDoc(doc(fs_('anonimo'), 'stock_items', 's1'), { quantity: 0 }));
  await assertFails(updateDoc(doc(fs_('parceiro'), 'stock_items', 's1'), { quantity: 0 }));
});
test('STORAGE: visitante anônimo não grava fora da feira', async () => {
  await assertFails(uploadBytes(ref(st_('anonimo'), 'videos/x.mp4'), new Uint8Array([1, 2, 3])));
});

// ---------------- O QUE PRECISA CONTINUAR FUNCIONANDO ----------------

test('ADMIN lê e edita tudo da equipe', async () => {
  await assertSucceeds(getDocs(collection(fs_('jeferson'), 'users')));
  await assertSucceeds(updateDoc(doc(fs_('jeferson'), 'users', 'u_par'), { role: 'internal_seller' }));
});
test('GERENTE e TRIAGEM cadastram e editam vendedor e parceiro', async () => {
  await assertSucceeds(setDoc(doc(fs_('gislene'), 'users', 'temp_1'), { role: 'internal_seller', email: 'nova@roder.com.br', status: 'active' }));
  await assertSucceeds(setDoc(doc(fs_('luana'), 'users', 'temp_2'), { role: 'external_seller', email: 'p@gmail.com', status: 'active' }));
  await assertSucceeds(updateDoc(doc(fs_('luana'), 'users', 'u_hel'), { is_lead_receiver: true, vacation_start: '2026-11-01' }));
  await assertSucceeds(deleteDoc(doc(fs_('gislene'), 'users', 'temp_1')));
});
test('CADA UM atualiza os próprios dados (nome, telefone)', async () => {
  await assertSucceeds(updateDoc(doc(fs_('parceiro'), 'users', 'u_par'), { phone: '14999999999' }));
  await assertSucceeds(updateDoc(doc(fs_('heloisa'), 'users', 'u_hel'), { phone: '14988888888' }));
});
test('PARCEIRO acha o próprio cadastro pelo e-mail (login)', async () => {
  await assertSucceeds(getDocs(query(collection(fs_('parceiro'), 'users'), where('email', '==', 'parceiro@gmail.com'))));
});
test('TRIAGEM e VENDEDORA trabalham as indicações', async () => {
  await assertSucceeds(getDocs(collection(fs_('luana'), 'indications')));
  await assertSucceeds(updateDoc(doc(fs_('luana'), 'indications', 'ind1'), { status: 'negotiating', internal_seller_uid: 'u_hel' }));
  await assertSucceeds(updateDoc(doc(fs_('heloisa'), 'indications', 'ind2'), { budget_loaded: true }));
});
test('VENDEDORA fatura: cria comissão e baixa estoque', async () => {
  await assertSucceeds(setDoc(doc(fs_('heloisa'), 'commissions', 'c3'), { external_seller_uid: 'u_par', value: 10 }));
  await assertSucceeds(updateDoc(doc(fs_('heloisa'), 'stock_items', 's1'), { quantity: 1 }));
});
test('PARCEIRO vê as próprias comissões e indicações', async () => {
  await assertSucceeds(getDocs(query(collection(fs_('parceiro'), 'commissions'), where('external_seller_uid', '==', 'u_par'))));
  await assertSucceeds(getDoc(doc(fs_('parceiro'), 'indications', 'ind1')));
});
test('PARCEIRO edita a própria indicação pendente (sem mexer em status)', async () => {
  await assertSucceeds(updateDoc(doc(fs_('parceiro'), 'indications', 'ind1'), { client_phone: '14999990000' }));
});
test('PARCEIRO manda a nota do mês: extrato próprio e comissão em aguardando pagamento', async () => {
  await assertSucceeds(setDoc(doc(fs_('parceiro'), 'monthly_statements', 'u_par_5_2026'),
    { id: 'u_par_5_2026', seller_uid: 'u_par', total_value: 1000, status: 'waiting_payment', nf_url: 'x' }, { merge: true }));
  await assertSucceeds(updateDoc(doc(fs_('parceiro'), 'commissions', 'c1'), { status: 'waiting_payment', updated_at: 'x' }));
  await assertSucceeds(updateDoc(doc(fs_('parceiro'), 'commissions', 'c1'), { nf_url: 'y' }));
  await assertSucceeds(getDocs(query(collection(fs_('parceiro'), 'monthly_statements'), where('seller_uid', '==', 'u_par'))));
});
test('FINANCEIRO lê extratos e paga comissão', async () => {
  await assertSucceeds(getDocs(collection(fs_('vanessa'), 'monthly_statements')));
  await assertSucceeds(updateDoc(doc(fs_('vanessa'), 'commissions', 'c1'), { status: 'paid' }));
});
test('PÁGINA PÚBLICA: pedido de orçamento cria indicação sem login', async () => {
  await assertSucceeds(addDoc(collection(fs_(null), 'indications'), { creator_type: 'client', status: 'pending' }));
});
test('TABLET DA FEIRA (anônimo): cria lead e completa o próprio atendimento', async () => {
  await assertSucceeds(addDoc(collection(fs_('anonimo'), 'fair_leads'), { salesperson_uid: 'u_anon', name: 'Novo' }));
  await assertSucceeds(updateDoc(doc(fs_('anonimo'), 'fair_leads', 'f1'), { photos: ['x'], salesperson_uid: 'u_anon' }));
});
test('CLIENTE responde a pesquisa de satisfação pelo link', async () => {
  await assertSucceeds(setDoc(doc(fs_(null), 'customer_evaluations', 'av1'), { status: 'completed', rating: 5 }, { merge: true }));
});
test('ESTOQUE PÚBLICO: visitante lê estoque e faz reserva', async () => {
  await assertSucceeds(getDocs(collection(fs_(null), 'stock_items')));
  await assertSucceeds(addDoc(collection(fs_('anonimo'), 'stock_reservations'), { status: 'active' }));
});
test('FICHAS PÚBLICAS: Engate Rápido lido sem login', async () => {
  await assertSucceeds(getDoc(doc(fs_(null), 'settings', 'engate_rapido_ficha_a')));
});
test('EQUIPE lê as configurações de aviso (e-mails da gestão)', async () => {
  await assertSucceeds(getDoc(doc(fs_('heloisa'), 'settings', 'notifications')));
});
test('E-MAIL @roderbrasil.com.br é equipe mesmo sem papel gravado', async () => {
  const ctx = env.authenticatedContext('u_rog', { email: 'rogerio@roderbrasil.com.br', email_verified: true, firebase: { sign_in_provider: 'google.com' } });
  await assertSucceeds(updateDoc(doc(ctx.firestore(), 'stock_items', 's1'), { quantity: 3 }));
});
test('STORAGE: equipe sobe vídeo; tablet da feira sobe foto', async () => {
  await assertSucceeds(uploadBytes(ref(st_('heloisa'), 'videos/x.mp4'), new Uint8Array([1, 2, 3])));
  await assertSucceeds(uploadBytes(ref(st_('anonimo'), 'fair_leads/feira1/foto.jpg'), new Uint8Array([1, 2, 3])));
  await assertSucceeds(getBytes(ref(st_('parceiro'), 'videos/x.mp4')));
});
