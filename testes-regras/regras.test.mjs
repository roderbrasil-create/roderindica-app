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

// Contas de teste. "password" simula conta com senha. As da equipe valem pelo PAPEL gravado em
// users/{uid}, e não pelo e-mail: desde 19/10/2026 o e-mail de conta com senha só vale confirmado.
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

// =====================================================================
// CASOS DO CRÍTICO (19/10/2026): cada teste copia uma operação real do app
// (arquivo:linha no título), com a mesma coleção, os mesmos campos e a mesma consulta.
// =====================================================================
import {
  orderBy, arrayUnion, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { deleteObject } from 'firebase/storage';

const semRegras = (fn) => env.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore(), ctx.storage()));

// ---------------- LEGÍTIMO: tem de continuar funcionando ----------------

test('PARCEIRO cria indicação como a tela Nova Indicação (NewIndication.tsx:1301) e depois anexa as fotos (1244)', async () => {
  const db = fs_('parceiro');
  const r = doc(collection(db, 'indications'));
  await assertSucceeds(setDoc(r, {
    id: r.id, client_name: 'Fazenda X', items: [{ product_name: 'Garra R400', quantity: 1 }], options: [],
    origin_type: 'partner', is_client_referral: false, referring_client_name: null,
    external_seller_uid: 'u_par', external_seller_name: 'Parceiro',
    internal_seller_uid: null, internal_seller_name: null, internal_seller_email: null,
    created_by_uid: 'u_par', created_by_name: 'Parceiro', created_by_role: 'external_seller',
    standard_seller_uid: null, standard_seller_name: null, standard_seller_commission_rate: 2,
    standard_seller_commission_enabled: false, media_urls: [], media_upload_status: 'uploading',
    status: 'pending', negotiation_history: [{ id: 'h1', type: 'system', content: 'x' }],
    created_at: 'x', updated_at: 'x', protection_expires_at: 'x',
  }));
  await assertSucceeds(updateDoc(r, { media_urls: arrayUnion('https://x/foto.jpg'), updated_at: 'y' }));
  await assertSucceeds(updateDoc(r, { media_upload_status: 'completed' }));
  await assertSucceeds(uploadBytes(ref(st_('parceiro'), `indications/${r.id}/1_foto.jpg`), new Uint8Array([1])));
});

test('PARCEIRO grava o cliente indicador (NewIndication.tsx:1352/1360) e avisa a gestão (notificationService.ts:16)', async () => {
  const db = fs_('parceiro');
  await assertSucceeds(setDoc(doc(db, 'referring_clients', 'joao_da_silva'), {
    id: 'joao_da_silva', name: 'João da Silva', phone: '', company_or_city: '', referral_count: 1,
    created_at: 'x', last_referral_at: 'x', created_by_uid: 'u_par', created_by_name: 'Parceiro',
  }));
  await assertSucceeds(updateDoc(doc(db, 'referring_clients', 'joao_da_silva'), { referral_count: 2, last_referral_at: 'y', updated_at: 'y' }));
  await assertSucceeds(addDoc(collection(db, 'notifications'), {
    user_uid: 'u_gis', title: 'Nova Indicação Recebida', message: 'x', type: 'info', link: '/indicacoes', read: false, created_at: 'x',
  }));
});

// Mudou de caminho: agora o aviso à gestão e a busca do regional passam pelo servidor
// (/api/notificacoes/gestao e /api/usuarios/regionais), e o parceiro NÃO lê a lista de usuários.
test('PARCEIRO não lê a lista da gestão direto (o aviso vai pelo servidor)', async () => {
  await assertFails(getDocs(query(collection(fs_('parceiro'), 'users'), where('role', 'in', ['admin', 'manager', 'triagem']))));
});

test('PARCEIRO não lê os regionais direto (vai pelo servidor)', async () => {
  await assertFails(getDocs(query(collection(fs_('parceiro'), 'users'), where('role', '==', 'vendedor_padrao'), where('status', '==', 'active'))));
});

test('PARCEIRO manda a NF única pelo extrato que o financeiro abriu (Commissions.tsx:815) e sobe o arquivo (809)', async () => {
  await semRegras((db) => setDoc(doc(db, 'monthly_statements', 'u_par_6_2026'), {
    seller_uid: 'u_par', seller_name: 'Parceiro', month: 6, year: 2026, total_value: 1000, status: 'waiting_nf', commission_ids: ['c1'], created_at: 'x',
  }));
  const db = fs_('parceiro');
  const atual = (await getDoc(doc(db, 'monthly_statements', 'u_par_6_2026'))).data();
  await assertSucceeds(uploadBytes(ref(st_('parceiro'), 'commissions_nf/monthly_u_par_6_2026_nf.pdf'), new Uint8Array([1])));
  await assertSucceeds(setDoc(doc(db, 'monthly_statements', 'u_par_6_2026'), {
    ...atual, id: 'u_par_6_2026', nf_url: 'https://x/nf.pdf', status: 'waiting_payment', updated_at: 'y',
  }, { merge: true }));
});

test('PARCEIRO manda a NF do mês pelo botão dele (Commissions.tsx:595 e 612), com a comissão em aguardando NF', async () => {
  await semRegras((db) => setDoc(doc(db, 'commissions', 'c5'), { external_seller_uid: 'u_par', status: 'waiting_nf', value: 300, month: 7, year: 2026 }));
  const db = fs_('parceiro');
  await assertSucceeds(uploadBytes(ref(st_('parceiro'), 'commissions_nf/monthly_u_par_7_2026_nf.pdf'), new Uint8Array([1])));
  await assertSucceeds(setDoc(doc(db, 'monthly_statements', 'u_par_7_2026'), {
    id: 'u_par_7_2026', seller_uid: 'u_par', seller_name: 'Parceiro', month: 7, year: 2026, total_value: 300,
    status: 'waiting_payment', nf_url: 'https://x', updated_at: 'x', created_at: 'x', commission_ids: [],
  }, { merge: true }));
  await assertSucceeds(updateDoc(doc(db, 'commissions', 'c5'), { status: 'waiting_payment', updated_at: 'x' }));
  // as consultas da tela do parceiro (Commissions.tsx:301, 322, 330)
  await assertSucceeds(getDocs(query(collection(db, 'commissions'), where('external_seller_uid', '==', 'u_par'), where('month', '==', 7), where('year', '==', 2026), orderBy('created_at', 'desc'))));
  await assertSucceeds(getDocs(query(collection(db, 'monthly_statements'), where('seller_uid', '==', 'u_par'), where('month', '==', 7), where('year', '==', 2026))));
  await assertSucceeds(getDocs(query(collection(db, 'indications'), where('external_seller_uid', '==', 'u_par'), where('status', '==', 'negotiating'))));
});

test('VENDEDORA fatura a venda como em Indications.tsx (690, 707, 747, 766) e cadastra cliente e produto (NegotiationCentral.tsx:855, 900, 1250)', async () => {
  const db = fs_('heloisa');
  await assertSucceeds(addDoc(collection(db, 'stock_sales'), {
    indication_id: 'ind2', stock_item_id: 's1', item_description: 'Garra', item_code: 'G1', quantity_sold: 1,
    seller_uid: 'u_hel', seller_name: 'Heloisa', client_name: 'C', client_cnpj: '', observation: 'x', branch: 'matriz', created_at: 'x',
  }));
  await assertSucceeds(updateDoc(doc(db, 'stock_items', 's1'), { quantity: 1, updated_at: 'x' }));
  await assertSucceeds(updateDoc(doc(db, 'indications', 'ind2'), {
    status: 'sold', sale_value: 100000, commission_value: 2000, commission_rate_applied: 2, updated_at: 'x',
    negotiation_history: arrayUnion({ id: 'h', type: 'status_change', content: 'VENDA FINALIZADA' }),
  }));
  await assertSucceeds(addDoc(collection(db, 'commissions'), {
    indication_id: 'ind2', external_seller_uid: 'u_par', external_seller_name: 'Parceiro', value: 2000,
    base_value_used: 100000, discount_applied: 0, discount_percentage: 0, rate_applied: 2, status: 'waiting_nf', month: 10, year: 2026, sale_date: '2026-10-19', created_at: 'x',
  }));
  await assertSucceeds(setDoc(doc(db, 'customers', '12345678000199'), { id: '12345678000199', cnpj: '12345678000199', name: 'C', updated_at: 'x', created_at: 'x' }));
  await assertSucceeds(addDoc(collection(db, 'registered_products'), { code: 'G1', name: 'Garra', base_price: 1, category: 'Equipamentos', is_commissionable: true, created_at: 'x', updated_at: 'x' }));
  await assertSucceeds(setDoc(doc(db, 'customer_evaluations', 'ind2'), { indication_id: 'ind2', client_name: 'C', status: 'pending', created_at: 'x' }));
  await assertSucceeds(addDoc(collection(db, 'notifications'), { user_uid: 'u_par', title: 'Venda Finalizada!', message: 'x', type: 'success', link: '/indicacoes', read: false, created_at: 'x' }));
  await assertSucceeds(uploadBytes(ref(st_('heloisa'), 'indications/ind2/invoices/nf.pdf'), new Uint8Array([1])));
});

test('TRIAGEM distribui lead e lead de feira (Triagem.tsx:335, FairLeadsTriagem.tsx:164) e lê a equipe ativa (Triagem.tsx:149)', async () => {
  const db = fs_('luana');
  await assertSucceeds(getDocs(query(collection(db, 'users'), where('status', '==', 'active'))));
  await assertSucceeds(updateDoc(doc(db, 'fair_leads', 'f1'), { assigned_to_uid: 'u_hel', status: 'assigned', updated_at: 'x' }));
  await assertSucceeds(addDoc(collection(db, 'notifications'), { user_uid: 'u_hel', title: 'Novo Lead Atribuído', message: 'x', type: 'info', read: false, created_at: 'x' }));
  await assertSucceeds(updateDoc(doc(db, 'users', 'u_lua'), { name: 'Luana Camargo', updated_at: 'x' })); // AuthContext.tsx:329
});

test('TRIAGEM liga a Gislene para receber lead e marca férias dela (Triagem.tsx:1031 e 532: a lista oferece gerente e admin)', async () => {
  await assertSucceeds(updateDoc(doc(fs_('luana'), 'users', 'u_gis'), { is_lead_receiver: true, updated_at: 'x' }));
  await assertSucceeds(updateDoc(doc(fs_('luana'), 'users', 'u_gis'), { vacation_start: '2026-12-20', vacation_end: '2027-01-05', updated_at: 'x' }));
});

test('GERENTE liga a si mesma para receber lead na Triagem (Triagem.tsx:1031)', async () => {
  await assertSucceeds(updateDoc(doc(fs_('gislene'), 'users', 'u_gis'), { is_lead_receiver: true, updated_at: 'x' }));
});

test('GERENTE e ADMIN cuidam de parceiro na tela de Usuários (Admin.tsx:1081, 2550) e da feira (Fairs.tsx:145)', async () => {
  await assertSucceeds(updateDoc(doc(fs_('gislene'), 'users', 'u_par'), { status: 'inactive', updated_at: 'x' }));
  await assertSucceeds(updateDoc(doc(fs_('gislene'), 'users', 'u_par'), { permissions: { sidebar: { dashboard: true }, dashboard_cards: {} }, updated_at: 'x' }));
  await assertSucceeds(addDoc(collection(fs_('gislene'), 'fairs'), { name: 'Agrishow', status: 'planning', created_at: 'x' }));
  await assertSucceeds(addDoc(collection(fs_('gislene'), 'fair_checklist'), { fair_id: 'x', label: 'y', completed: false, created_at: 'x' }));
  await assertSucceeds(setDoc(doc(fs_('jeferson'), 'settings', 'agendor'), { enabled: true, token: 't' }));
});

test('FINANCEIRO trabalha consulta de crédito, endomarketing e despesa de feira (FinancialConsultation, Endomarketing, FairDetails)', async () => {
  const db = fs_('vanessa');
  await assertSucceeds(addDoc(collection(db, 'financial_consultations'), { client_name: 'C', created_at: 'x' }));
  await assertSucceeds(addDoc(collection(db, 'credit_cleared_documents'), { cnpj: '1', created_at: 'x' }));
  await assertSucceeds(addDoc(collection(db, 'endomarketing_actions'), { title: 'x', created_at: 'x' }));
  await assertSucceeds(addDoc(collection(db, 'fair_expenses'), { fair_id: 'x', value: 10 }));
  await assertSucceeds(getDocs(query(collection(db, 'indications'), where('status', '==', 'sold'))));
  await assertSucceeds(uploadBytes(ref(st_('vanessa'), 'fairs/x/expenses/proof_1.pdf'), new Uint8Array([1])));
});

test('TABLET DA FEIRA (anônimo): cria indicação junto do lead (QuickRegister.tsx:726), apaga o próprio (846)', async () => {
  const db = fs_('anonimo');
  await assertSucceeds(addDoc(collection(db, 'indications'), {
    external_seller_uid: 'u_anon', external_seller_name: 'Vendedor Autônomo', client_name: 'V', status: 'pending',
    created_at: 'x', source: 'fair', fair_id: 'feira1', fair_lead_id: 'f1', ai_score: 'hot', base_machine: 'Solicitado em Feira', items: [],
  }));
  await assertSucceeds(deleteDoc(doc(db, 'fair_leads', 'f1')));
});

// A tela do tablet anônimo passou a buscar pelo próprio uid (teste seguinte); a busca pela feira inteira fica proibida.
test('TABLET DA FEIRA (anônimo): não lê os atendimentos da feira inteira', async () => {
  const db = fs_('anonimo');
  await semRegras((d) => setDoc(doc(d, 'fair_leads', 'f1'), { salesperson_uid: 'u_anon', salesperson_name: 'Visitante', fair_id: 'feira1', created_at: 'x' }));
  await assertFails(getDocs(query(collection(db, 'fair_leads'), where('fair_id', '==', 'feira1'), orderBy('created_at', 'desc'))));
});

test('TABLET DA FEIRA (anônimo): com o filtro do próprio uid a lista funciona (correção sugerida no código)', async () => {
  const db = fs_('anonimo');
  await semRegras((d) => setDoc(doc(d, 'fair_leads', 'f1'), { salesperson_uid: 'u_anon', salesperson_name: 'Visitante', fair_id: 'feira1', created_at: 'x' }));
  await assertSucceeds(getDocs(query(collection(db, 'fair_leads'), where('fair_id', '==', 'feira1'), where('salesperson_uid', '==', 'u_anon'), orderBy('created_at', 'desc'))));
});

test('ESTOQUE PÚBLICO (anônimo): reserva como a tela faz (PublicStock.tsx:520) e lê reservas e importação (690, 710)', async () => {
  const db = fs_('anonimo');
  await assertSucceeds(addDoc(collection(db, 'stock_reservations'), {
    quantity_reserved: 1, seller_uid: 'u_anon', seller_name: 'Zé', seller_state: 'SP', client_name: 'C', client_location: 'X',
    observation: '', status: 'active', expires_at: Timestamp.fromDate(new Date(Date.now() + 5 * 864e5)), created_at: serverTimestamp(),
    is_external: true, stock_item_id: 's1', item_code: 'G1', item_description: 'Garra',
  }));
  await assertSucceeds(getDocs(query(collection(db, 'stock_reservations'), where('status', '==', 'active'), orderBy('created_at', 'desc'))));
  await assertSucceeds(getDocs(query(collection(db, 'stock_imports_fae'), orderBy('created_at', 'asc'))));
});

test('PEDIDO DE ORÇAMENTO sem login: exportação já nasce em negociação com o Yury (PublicBudgetRequest.tsx:310)', async () => {
  await assertSucceeds(addDoc(collection(fs_(null), 'indications'), {
    external_seller_uid: 'public_request', external_seller_name: 'Solicitação Direta (Site)', client_name: 'Cliente', items: [{ product_name: 'Garra', quantity: 1 }],
    status: 'negotiating', negotiation_history: [], created_at: 'x', updated_at: 'x', creator_type: 'client', is_export: true, export_country: 'Paraguai',
    internal_seller_uid: 'QfWBeRvpreTskZZGQxmr8cK6BIR2', internal_seller_name: 'Yury Mello', internal_seller_email: 'pecas@roderbrasil.com.br', duplicate_reviewed: true,
  }));
});

test('CONSULTOR PÚBLICO sem login: o lead do visitante entra como "new" (EngineerHelper.tsx:1986)', async () => {
  await assertSucceeds(addDoc(collection(fs_(null), 'indications'), {
    client_name: 'V', status: 'new', indicator_id: 'consultor-direto', creator_type: 'visitor', lead_source: 'consultor_direto', created_at: 'x', updated_at: 'x',
  }));
});

test('PESQUISA DE SATISFAÇÃO criada pela venda: o cliente responde com o payload real (PublicEvaluation.tsx:218)', async () => {
  await semRegras((db) => setDoc(doc(db, 'customer_evaluations', 'ind9'), { indication_id: 'ind9', client_name: 'C', status: 'pending', created_at: 'x' }));
  await assertSucceeds(setDoc(doc(fs_(null), 'customer_evaluations', 'ind9'), {
    indication_id: 'ind9', client_name: 'C', equipment_name: 'Garra', client_phone: '', rating_product: 5, rating_service: 5,
    rating_delivery: 4, rating_technical: 5, comments: '', status: 'completed', completed: true, evaluated_at: serverTimestamp(), created_at: serverTimestamp(),
  }, { merge: true }));
});

test('PESQUISA DE SATISFAÇÃO MANUAL (ComercialAvaliacoes.tsx:472, indication_id "manual"): o cliente responde pelo link (PublicEvaluation.tsx:218)', async () => {
  await semRegras((db) => setDoc(doc(db, 'customer_evaluations', 'avm'), { indication_id: 'manual', client_name: 'C', status: 'pending', created_at: 'x' }));
  await assertSucceeds(setDoc(doc(fs_(null), 'customer_evaluations', 'avm'), {
    indication_id: 'avm', client_name: 'C', equipment_name: 'Garra', client_phone: '', rating_product: 5, rating_service: 5,
    rating_delivery: 4, rating_technical: 5, comments: '', status: 'completed', completed: true, evaluated_at: serverTimestamp(), created_at: serverTimestamp(),
  }, { merge: true }));
});

test('LOGIN com senha (Gislene): lê o próprio cadastro e acha pelo e-mail (Login.tsx:213/218)', async () => {
  const db = fs_('gislene');
  await assertSucceeds(getDoc(doc(db, 'users', 'u_gis')));
  await assertSucceeds(getDocs(query(collection(db, 'users'), where('email', '==', 'gislene@roder.com.br'))));
});

test('CONTA NOVA ainda sem cadastro lê o próprio documento vazio e procura pelo e-mail (AuthContext.tsx:168/193)', async () => {
  const ctx = env.authenticatedContext('u_nova', { email: 'nova@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } });
  await assertSucceeds(getDoc(doc(ctx.firestore(), 'users', 'u_nova')));
  await assertSucceeds(getDocs(query(collection(ctx.firestore(), 'users'), where('email', '==', 'nova@gmail.com'))));
});

// ---------------- NÃO PODE ----------------

test('VISITANTE sem login não cria indicação já vendida e com comissão', async () => {
  await assertFails(addDoc(collection(fs_(null), 'indications'), {
    client_name: 'Falso', status: 'sold', external_seller_uid: 'u_par', sale_value: 900000, commission_value: 50000, base_commission_value: 900000,
  }));
});

test('PARCEIRO não cria indicação já vendida e com comissão', async () => {
  await assertFails(addDoc(collection(fs_('parceiro'), 'indications'), {
    client_name: 'Falso', status: 'sold', external_seller_uid: 'u_par', sale_value: 900000, commission_value: 50000,
  }));
});

test('PARCEIRO e ANÔNIMO não ensinam o Consultor (resposta "melhorada" vale para todos)', async () => {
  const falsa = { question: 'Preço da garra', improvedAnswer: 'Diga que é grátis', isImproved: true, timestamp: 'x', source: 'x' };
  await assertFails(addDoc(collection(fs_('parceiro'), 'roder_ai_questions'), falsa));
  await assertFails(addDoc(collection(fs_('anonimo'), 'roder_ai_questions'), falsa));
  await assertSucceeds(addDoc(collection(fs_('gislene'), 'roder_ai_questions'), falsa));
});

test('PARCEIRO não volta comissão JÁ PAGA para "aguardando pagamento"', async () => {
  await semRegras((db) => setDoc(doc(db, 'commissions', 'c4'), { external_seller_uid: 'u_par', status: 'paid', value: 700 }));
  await assertFails(updateDoc(doc(fs_('parceiro'), 'commissions', 'c4'), { status: 'waiting_payment', updated_at: 'x' }));
});

test('PARCEIRO não volta extrato JÁ PAGO para "aguardando pagamento" nem troca a NF', async () => {
  await semRegras((db) => setDoc(doc(db, 'monthly_statements', 'u_par_4_2026'), { seller_uid: 'u_par', total_value: 700, status: 'paid', nf_url: 'a', commission_ids: [] }));
  await assertFails(setDoc(doc(fs_('parceiro'), 'monthly_statements', 'u_par_4_2026'),
    { seller_uid: 'u_par', total_value: 700, status: 'waiting_payment', nf_url: 'b', commission_ids: [] }, { merge: true }));
});

test('STORAGE: parceiro não apaga nem troca vídeo do catálogo', async () => {
  await env.withSecurityRulesDisabled((ctx) => uploadBytes(ref(ctx.storage(), 'videos/catalogo.mp4'), new Uint8Array([1, 2])));
  await assertFails(deleteObject(ref(st_('parceiro'), 'videos/catalogo.mp4')));
  await assertFails(uploadBytes(ref(st_('parceiro'), 'videos/catalogo.mp4'), new Uint8Array([9])));
});

test('STORAGE: tablet anônimo não lê NF de comissão nem nota de faturamento', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadBytes(ref(ctx.storage(), 'commissions_nf/monthly_u_par_5_2026_nf.pdf'), new Uint8Array([1]));
    await uploadBytes(ref(ctx.storage(), 'indications/ind2/invoices/nf.pdf'), new Uint8Array([1]));
  });
  await assertFails(getBytes(ref(st_('anonimo'), 'commissions_nf/monthly_u_par_5_2026_nf.pdf')));
  await assertFails(getBytes(ref(st_('anonimo'), 'indications/ind2/invoices/nf.pdf')));
});

test('STORAGE: parceiro não apaga a NF de outro parceiro', async () => {
  await env.withSecurityRulesDisabled((ctx) => uploadBytes(ref(ctx.storage(), 'commissions_nf/monthly_u_par2_5_2026_nf.pdf'), new Uint8Array([1])));
  await assertFails(deleteObject(ref(st_('parceiro'), 'commissions_nf/monthly_u_par2_5_2026_nf.pdf')));
});

test('STORAGE: equipe com e-mail @roderbrasil troca e apaga vídeo existente', async () => {
  await env.withSecurityRulesDisabled((ctx) => uploadBytes(ref(ctx.storage(), 'videos/trocar.mp4'), new Uint8Array([1])));
  const ctx = env.authenticatedContext('u_rog', { email: 'rogerio@roderbrasil.com.br', email_verified: true, firebase: { sign_in_provider: 'google.com' } });
  await assertSucceeds(uploadBytes(ref(ctx.storage(), 'videos/trocar.mp4'), new Uint8Array([2])));
  await assertSucceeds(deleteObject(ref(ctx.storage(), 'videos/trocar.mp4')));
});
test('FINANCEIRO pode faturar (cria comissão)', async () => {
  await assertSucceeds(setDoc(doc(fs_('vanessa'), 'commissions', 'c9'), { external_seller_uid: 'u_par', value: 10 }));
});

test('STORAGE: parceiro troca a própria foto de perfil, mas não a de outro', async () => {
  await env.withSecurityRulesDisabled((ctx) => uploadBytes(ref(ctx.storage(), 'profiles/u_par'), new Uint8Array([1])));
  await assertSucceeds(uploadBytes(ref(st_('parceiro'), 'profiles/u_par'), new Uint8Array([2])));
  await assertFails(uploadBytes(ref(st_('parceiro'), 'profiles/u_par2'), new Uint8Array([2])));
});
test('STORAGE: parceiro envia a própria NF com nome novo, e não a de outro', async () => {
  await assertSucceeds(uploadBytes(ref(st_('parceiro'), 'commissions_nf/monthly_u_par_5_2026_123_nf.pdf'), new Uint8Array([1])));
  await assertFails(uploadBytes(ref(st_('parceiro'), 'commissions_nf/monthly_u_par2_5_2026_123_nf.pdf'), new Uint8Array([1])));
});

// =====================================================================
// PRIVACIDADE DAS INDICAÇÕES (19/10/2026): o parceiro lê só as dele, também direto no Firestore.
// A consulta "ou" abaixo é a mesma que a tela monta (src/lib/filtrosParceiro.ts).
// =====================================================================
import { or } from 'firebase/firestore';

const semearDonos = () => semRegras(async (db) => {
  await setDoc(doc(db, 'indications', 'ind_outro'), { status: 'pending', external_seller_uid: 'u_par2', external_seller_email: 'outro@gmail.com', client_name: 'Do outro' });
  await setDoc(doc(db, 'indications', 'ind_criada'), { status: 'pending', created_by: 'u_par', client_name: 'Criada por ele' });
  await setDoc(doc(db, 'indications', 'ind_email'), { status: 'pending', external_seller_email: 'parceiro@gmail.com', client_name: 'Só pelo e-mail' });
  await setDoc(doc(db, 'indications', 'ind_nome'), { status: 'pending', external_seller_name: 'Parceiro', client_name: 'Só pelo nome' });
  await setDoc(doc(db, 'indications', 'ind_regional'), { status: 'negotiating', standard_seller_uid: 'u_par', client_name: 'Regional' });
});

const consultaDoParceiro = (db, uid, email, regional = false) => query(collection(db, 'indications'), or(
  where('external_seller_uid', '==', uid),
  where('created_by', '==', uid),
  where('user_id', '==', uid),
  where('indicator_uid', '==', uid),
  ...(regional ? [where('standard_seller_uid', '==', uid)] : []),
  where('external_seller_email', '==', email),
));

test('PARCEIRO lê a própria indicação pelo uid, pelo created_by e pelo e-mail do login', async () => {
  await semearDonos();
  const db = fs_('parceiro');
  await assertSucceeds(getDoc(doc(db, 'indications', 'ind1')));
  await assertSucceeds(getDoc(doc(db, 'indications', 'ind_criada')));
  await assertSucceeds(getDoc(doc(db, 'indications', 'ind_email')));
  await assertSucceeds(getDoc(doc(db, 'indications', 'ind_regional')));
});

test('PARCEIRO NÃO lê a indicação de outro parceiro, nem a lista inteira', async () => {
  await semearDonos();
  const db = fs_('parceiro');
  await assertFails(getDoc(doc(db, 'indications', 'ind_outro')));
  await assertFails(getDocs(collection(db, 'indications')));
  await assertFails(getDocs(query(collection(db, 'indications'), where('status', '==', 'pending'))));
  await assertFails(getDocs(query(collection(db, 'indications'), where('external_seller_uid', '==', 'u_par2'))));
});

test('PARCEIRO: a busca "ou" que a tela manda (Indications.tsx, filtrosParceiro.ts) passa e traz só as dele', async () => {
  await semearDonos();
  const snap = await assertSucceeds(getDocs(consultaDoParceiro(fs_('parceiro'), 'u_par', 'parceiro@gmail.com')));
  const ids = snap.docs.map(d => d.id).sort();
  if (ids.includes('ind_outro')) throw new Error('veio indicação de outro parceiro: ' + ids.join(','));
  for (const id of ['ind1', 'ind2', 'ind_criada', 'ind_email']) {
    if (!ids.includes(id)) throw new Error(`faltou ${id}: ${ids.join(',')}`);
  }
});

test('REGIONAL (vendedor_padrao): a busca com standard_seller_uid passa', async () => {
  await semearDonos();
  await semRegras((db) => updateDoc(doc(db, 'users', 'u_par'), { role: 'vendedor_padrao' }));
  await assertSucceeds(getDocs(consultaDoParceiro(fs_('parceiro'), 'u_par', 'parceiro@gmail.com', true)));
});

test('PARCEIRO: busca por NOME é recusada inteira (por isso saiu da tela; o servidor grava o uid)', async () => {
  await semearDonos();
  await assertFails(getDocs(query(collection(fs_('parceiro'), 'indications'), or(
    where('external_seller_uid', '==', 'u_par'),
    where('external_seller_name', '==', 'Parceiro'),
  ))));
});

test('PARCEIRO não lê pelo e-mail de OUTRO (a busca tem de ser com o e-mail do próprio login)', async () => {
  await semearDonos();
  await assertFails(getDocs(consultaDoParceiro(fs_('parceiro'), 'u_par', 'outro@gmail.com')));
});

test('EQUIPE lê todas as indicações (gerente, triagem, vendedora interna, financeiro só o que já lia)', async () => {
  await semearDonos();
  await assertSucceeds(getDocs(collection(fs_('gislene'), 'indications')));
  await assertSucceeds(getDocs(collection(fs_('luana'), 'indications')));
  await assertSucceeds(getDoc(doc(fs_('heloisa'), 'indications', 'ind_outro')));
  await assertSucceeds(getDocs(query(collection(fs_('vanessa'), 'indications'), where('status', '==', 'sold'))));
});

test('ANÔNIMO e SEM LOGIN não listam indicações (as páginas públicas só criam)', async () => {
  await semearDonos();
  await assertFails(getDocs(collection(fs_('anonimo'), 'indications')));
  await assertFails(getDocs(collection(fs_(null), 'indications')));
  await assertFails(getDoc(doc(fs_(null), 'indications', 'ind1')));
});

// =====================================================================
// E-MAIL SÓ VALE CONFIRMADO (19/10/2026). O cadastro de usuário fica ligado no Firebase (o app
// usa login anônimo), então qualquer um cria qualquer@roderbrasil.com.br com senha pela API, sem
// acesso à caixa daquele e-mail. Essa conta não pode passar por equipe nem por diretoria.
// =====================================================================
const contaSenha = (uid, email, confirmado) => env.authenticatedContext(uid,
  { email, email_verified: confirmado, firebase: { sign_in_provider: 'password' } }).firestore();

test('CONTA COM SENHA criada por fora (@roderbrasil, e-mail NÃO confirmado) não é equipe', async () => {
  const db = contaSenha('u_falso', 'qualquer@roderbrasil.com.br', false);
  await assertFails(getDoc(doc(db, 'settings', 'notifications')));
  await assertFails(updateDoc(doc(db, 'stock_items', 's1'), { quantity: 99 }));
  await assertFails(getDoc(doc(db, 'users', 'u_gis')));
  await assertFails(getDocs(collection(db, 'users')));
  await assertFails(getDocs(collection(db, 'indications')));
});

test('CONTA COM SENHA da equipe com e-mail CONFIRMADO pelo servidor continua equipe', async () => {
  const db = contaSenha('u_rog2', 'rogerio2@roderbrasil.com.br', true);
  await assertSucceeds(getDoc(doc(db, 'settings', 'notifications')));
  await assertSucceeds(updateDoc(doc(db, 'stock_items', 's1'), { quantity: 3 }));
});

test('DIRETORIA: conta com senha do e-mail do Jeferson SEM confirmação não é admin', async () => {
  const db = contaSenha('u_falso_dir', 'jeferson@roderbrasil.com.br', false);
  await assertFails(getDoc(doc(db, 'settings', 'email')));
  await assertFails(getDoc(doc(db, 'api_keys', 'k1')));
  await assertFails(setDoc(doc(db, 'users', 'u_falso_dir'), { role: 'admin', status: 'active', email: 'jeferson@roderbrasil.com.br' }));
});

test('DIRETORIA: o mesmo e-mail CONFIRMADO é admin', async () => {
  const db = contaSenha('u_dir', 'jeferson@roderbrasil.com.br', true);
  await assertSucceeds(getDoc(doc(db, 'settings', 'email')));
});

test('PRÉ-CADASTRO: conta com senha sem confirmação não lê o cadastro pelo e-mail (telefone, PIX, senha inicial)', async () => {
  await semRegras((db) => setDoc(doc(db, 'users', 'temp_pre'), { email: 'precadastro@gmail.com', role: 'external_seller', status: 'pending', pix: '123', initial_password: 'x' }));
  const falso = contaSenha('u_pre_falso', 'precadastro@gmail.com', false);
  await assertFails(getDocs(query(collection(falso, 'users'), where('email', '==', 'precadastro@gmail.com'))));
  const real = contaSenha('u_pre', 'precadastro@gmail.com', true);
  await assertSucceeds(getDocs(query(collection(real, 'users'), where('email', '==', 'precadastro@gmail.com'))));
});

test('PARCEIRO com senha e e-mail NÃO confirmado não lê indicação pelo e-mail gravado nela', async () => {
  await semRegras((db) => setDoc(doc(db, 'indications', 'ind_mail'), { status: 'pending', external_seller_email: 'parceiro@gmail.com' }));
  const falso = contaSenha('u_par_falso', 'parceiro@gmail.com', false);
  await assertFails(getDoc(doc(falso, 'indications', 'ind_mail')));
  await assertSucceeds(getDoc(doc(fs_('parceiro'), 'indications', 'ind_mail')));
});
