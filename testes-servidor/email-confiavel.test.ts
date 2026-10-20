// E-mail só vale confirmado. Rodar: node --import tsx --test testes-servidor/email-confiavel.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { emailConfiavelDoToken, ehDiretoriaPeloToken, papelDeQuemChama, deveMarcarEmailConfirmado, classificarConta, podeConfirmarPrimeiroAcesso, podeDefinirSenha, ehIdDePreCadastro, papeisDaContaAlvo, escolherPreCadastros } from '../server/emailConfiavel.ts';
import { hostDeFotoAgendor, urlDeFotoAgendor } from '../server/fotoAgendor.ts';

const token = (email: string, confirmado: boolean, provedor = 'password') =>
  ({ uid: 'u1', email, email_verified: confirmado, firebase: { sign_in_provider: provedor } });

test('conta com senha criada por fora (e-mail não confirmado) não vale como e-mail confiável', () => {
  assert.equal(emailConfiavelDoToken(token('qualquer@roderbrasil.com.br', false)), '');
  assert.equal(emailConfiavelDoToken(token('Qualquer@RoderBrasil.com.br', true)), 'qualquer@roderbrasil.com.br');
  assert.equal(emailConfiavelDoToken({ email: 'x@roderbrasil.com.br', email_verified: true, firebase: { sign_in_provider: 'anonymous' } }), '');
  assert.equal(emailConfiavelDoToken(null), '');
});

test('diretoria pelo e-mail só confirmada: senha sem confirmação não vira admin', () => {
  assert.equal(ehDiretoriaPeloToken(token('jeferson@roderbrasil.com.br', false)), false);
  assert.equal(papelDeQuemChama(token('jeferson@roderbrasil.com.br', false), ''), '');
  assert.equal(papelDeQuemChama(token('roderbrasil@gmail.com', false), 'external_seller'), 'external_seller');
  assert.equal(papelDeQuemChama(token('jeferson@roderbrasil.com.br', true, 'google.com'), ''), 'admin');
});

test('equipe vem do papel do cadastro, nunca do domínio do e-mail', () => {
  assert.equal(papelDeQuemChama(token('qualquer@roderbrasil.com.br', true), ''), '');
  assert.equal(papelDeQuemChama(token('heloisa@gmail.com', false), 'internal_seller'), 'internal_seller');
});

test('marcação única: só conta com senha, não confirmada, com cadastro ATIVO do mesmo e-mail', () => {
  const conta = { uid: 'u1', email: 'gislene@roderbrasil.com.br', emailVerified: false, providerData: [{ providerId: 'password' }] };
  assert.equal(deveMarcarEmailConfirmado(conta, { status: 'active', role: 'manager', email: 'gislene@roderbrasil.com.br' }), true);
  assert.equal(deveMarcarEmailConfirmado(conta, { status: 'active', role: 'external_seller' }), true);
  // conta criada por fora: sem cadastro, ou cadastro próprio (nasce pending pelas regras)
  assert.equal(deveMarcarEmailConfirmado(conta, undefined), false);
  assert.equal(deveMarcarEmailConfirmado(conta, { status: 'pending', role: 'external_seller' }), false);
  assert.equal(deveMarcarEmailConfirmado(conta, { status: 'inactive', role: 'manager' }), false);
  // cadastro de outro e-mail no mesmo uid: não mexe
  assert.equal(deveMarcarEmailConfirmado(conta, { status: 'active', email: 'outra@roderbrasil.com.br' }), false);
  // já confirmada, ou só Google: nada a fazer
  assert.equal(deveMarcarEmailConfirmado({ ...conta, emailVerified: true }, { status: 'active' }), false);
  assert.equal(deveMarcarEmailConfirmado({ ...conta, providerData: [{ providerId: 'google.com' }] }, { status: 'active' }), false);
});

test('servidor e regras não aceitam mais conta com senha como e-mail confirmado', () => {
  const servidor = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.ok(!/sign_in_provider\s*!==\s*'password'/.test(servidor), 'reivindicar-perfil ainda aceita conta com senha');
  assert.ok(!/requesterData\?\.email === 'roder/.test(servidor), 'troca de senha ainda confia no e-mail gravado no cadastro');
  assert.match(servidor, /updateUser\(contaExistente.uid, { password, emailVerified: true }\)/);
  assert.match(servidor, /marcarContasDaEquipe\(\)/);
  const regras = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.ok(!/sign_in_provider == 'password'/.test(regras), "firestore.rules ainda aceita sign_in_provider == 'password'");
  const storage = fs.readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
  assert.ok(!/sign_in_provider == 'password'/.test(storage));
});

test('rodada única: diretoria nunca é marcada, e cada conta de fora sai com o motivo', () => {
  const conta = (email: string) => ({ uid: 'u1', email, emailVerified: false, providerData: [{ providerId: 'password' }] });
  assert.equal(classificarConta(conta('jeferson@roderbrasil.com.br'), { status: 'active', role: 'admin', email: 'jeferson@roderbrasil.com.br' }, false), 'diretoria');
  assert.equal(classificarConta(conta('a@x.com'), { status: 'active', email: 'a@x.com' }, false), 'marcar');
  assert.equal(classificarConta(conta('a@x.com'), undefined, false), 'sem_cadastro');
  assert.equal(classificarConta(conta('a@x.com'), undefined, true), 'pre_cadastro_por_email');
  assert.equal(classificarConta(conta('a@x.com'), { status: 'pending', email: 'a@x.com' }, false), 'cadastro_inativo');
  assert.equal(classificarConta(conta('a@x.com'), { status: 'active', email: 'b@x.com' }, false), 'email_diferente');
  assert.equal(classificarConta({ ...conta('a@x.com'), emailVerified: true }, undefined, false), 'pular');
  assert.equal(classificarConta({ ...conta('a@x.com'), providerData: [{ providerId: 'google.com' }] }, undefined, false), 'pular');
});

test('primeiro acesso sem e-mail confirmado: só com senha da Roder e login DEPOIS de ela ser definida', () => {
  const definida = '2026-10-19T12:00:00.000Z';
  const seg = Date.parse(definida) / 1000;
  const dec = (auth_time: number, provedor = 'password') => ({ auth_time, email: 'p@x.com', firebase: { sign_in_provider: provedor } });
  const prov = { email: 'p@x.com', initial_password: 'abc123', initial_password_set_at: definida };
  const marca = { cadastro_id: 'temp_1', email: 'p@x.com', definida_em: definida, definida_por_uid: 'u_gis' };
  assert.equal(podeConfirmarPrimeiroAcesso(dec(seg + 60), prov, 'temp_1', marca), true);
  assert.equal(podeConfirmarPrimeiroAcesso(dec(seg + 60), prov, 'phone_14999990000', { ...marca, cadastro_id: 'phone_14999990000' }), true);
  // conta criada por fora e logada ANTES da senha da Roder: não passa
  assert.equal(podeConfirmarPrimeiroAcesso(dec(seg - 60), prov, 'temp_1', marca), false);
  assert.equal(podeConfirmarPrimeiroAcesso(dec(seg + 60, 'google.com'), prov, 'temp_1', marca), false);
  assert.equal(podeConfirmarPrimeiroAcesso(dec(seg + 60), { ...prov, initial_password: '' }, 'temp_1', marca), false);
  // a data que vale é a da marca do servidor, e não a do cadastro
  assert.equal(podeConfirmarPrimeiroAcesso(dec(seg + 60), { ...prov, initial_password_set_at: '2000-01-01T00:00:00.000Z' }, 'temp_1', { ...marca, definida_em: '2026-10-19T13:00:00.000Z' }), false);
});

test('CADASTRO FORJADO: users/{B} com o e-mail de A, senha inicial e data antiga não confirma o e-mail de A', () => {
  // A: conta com senha criada por fora como x@roderbrasil.com.br, logada agora
  const decA = { uid: 'u_a', email: 'x@roderbrasil.com.br', email_verified: false, auth_time: Math.floor(Date.now() / 1000), firebase: { sign_in_provider: 'password' } };
  // o que a conta B gravou no próprio cadastro (o código do documento é o uid de B)
  const forjado = { email: 'x@roderbrasil.com.br', role: 'external_seller', status: 'pending', initial_password: 'x', initial_password_set_at: '2000-01-01T00:00:00.000Z' };
  // sem a marca do servidor: não passa
  assert.equal(podeConfirmarPrimeiroAcesso(decA, forjado, 'u_b_uid_do_atacante', undefined), false);
  assert.equal(podeConfirmarPrimeiroAcesso(decA, forjado, 'u_b_uid_do_atacante', null), false);
  // código que é uid de conta de login: não passa nem com marca (quem decide é o Auth)
  const marcaB = { cadastro_id: 'u_b_uid_do_atacante', email: 'x@roderbrasil.com.br', definida_em: '2000-01-01T00:00:00.000Z', definida_por_uid: 'u_jef' };
  assert.equal(podeConfirmarPrimeiroAcesso(decA, forjado, 'u_b_uid_do_atacante', undefined), false);
  // B chamando o próprio cadastro de temp_: ainda falta a marca do servidor
  assert.equal(podeConfirmarPrimeiroAcesso(decA, forjado, 'temp_123', undefined), false);
  // marca de outro cadastro, de outro e-mail, ou sem quem definiu: não passa
  const marca = { cadastro_id: 'temp_123', email: 'x@roderbrasil.com.br', definida_em: '2000-01-01T00:00:00.000Z', definida_por_uid: 'u_jef' };
  assert.equal(podeConfirmarPrimeiroAcesso(decA, forjado, 'temp_123', { ...marca, cadastro_id: 'temp_999' }), false);
  assert.equal(podeConfirmarPrimeiroAcesso(decA, forjado, 'temp_123', { ...marca, email: 'outro@roderbrasil.com.br' }), false);
  assert.equal(podeConfirmarPrimeiroAcesso(decA, forjado, 'temp_123', { ...marca, definida_por_uid: '' }), false);
  assert.equal(ehIdDePreCadastro('temp_1'), true);
  assert.equal(ehIdDePreCadastro('phone_1499'), true);
  assert.equal(ehIdDePreCadastro('u_b_uid_do_atacante'), false);
  assert.equal(ehIdDePreCadastro('xtemp_1'), false);
});

test('servidor: o primeiro acesso confere a marca do servidor e se o código não é conta de login, e a troca de senha grava a marca', () => {
  const fonte = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const i = fonte.indexOf('app.post("/api/auth/reivindicar-perfil"');
  const trecho = fonte.slice(i, fonte.indexOf('app.get("/api/settings/:docName"', i));
  // a escolha (prefixo de pré-cadastro, não ser conta de login, marca e login posterior) mora em
  // escolherPreCadastros e vale para o e-mail confirmado e o não confirmado
  assert.ok(trecho.includes('escolherPreCadastros({'));
  assert.ok(trecho.includes('admin.auth().getUser(id)'));
  assert.ok(trecho.includes("collection('senhas_iniciais').doc(id).get()"));
  // login derrubado responde 401 com código, e não 500
  assert.ok(trecho.includes("'auth/id-token-revoked' ? 'token_revogado'"));
  const j = fonte.indexOf('app.post("/api/admin/set-user-password"');
  const troca = fonte.slice(j, j + 9000);
  assert.ok(troca.includes("collection('senhas_iniciais').doc(cadastroAlvo.id)"));
  assert.ok(troca.includes('definida_por_uid: requesterUid'));
});

test('senha pela tela de Usuários: gestão não troca senha de gestão, de conta Google nem da diretoria', () => {
  const base = { papelQuemPede: 'manager', diretoria: false, papeisAlvo: ['external_seller'], emailAlvo: 'p@x.com', temGoogle: false };
  assert.equal(podeDefinirSenha(base).ok, true);
  assert.equal(podeDefinirSenha({ ...base, papeisAlvo: ['external_seller', 'manager'] }).ok, false);
  assert.equal(podeDefinirSenha({ ...base, papeisAlvo: ['triagem'] }).ok, false);
  assert.equal(podeDefinirSenha({ ...base, papeisAlvo: ['admin'] }).ok, false);
  assert.equal(podeDefinirSenha({ ...base, temGoogle: true }).ok, false);
  assert.equal(podeDefinirSenha({ ...base, emailAlvo: 'roderbrasil@gmail.com' }).ok, false);
  assert.equal(podeDefinirSenha({ ...base, papelQuemPede: 'internal_seller' }).ok, false);
  assert.equal(podeDefinirSenha({ ...base, papelQuemPede: 'admin', papeisAlvo: ['manager'], temGoogle: true }).ok, true);
  assert.equal(podeDefinirSenha({ ...base, papelQuemPede: '', diretoria: true, papeisAlvo: ['admin'] }).ok, true);
});

test('TRIAGEM E GERENTE DE OUTRO E-MAIL: users/temp_x sem papel com o e-mail da conta de um gerente não troca a senha dele', () => {
  // conta de login do gerente: uid u_ger, e o users/u_ger dele tem outro e-mail (ou vazio)
  for (const cadastroDaConta of [{ existe: true, role: 'manager' }, { existe: true, role: 'admin' }]) {
    const alvo = papeisDaContaAlvo({ cadastroAlvoId: 'temp_x', cadastroAlvoEhPreCadastro: true, cadastroAlvoRole: '', papeisPorEmail: [''], contaUid: 'u_ger', cadastroDaConta });
    assert.equal(alvo.ok, true);
    assert.ok(alvo.papeisAlvo.includes(cadastroDaConta.role));
    const r = podeDefinirSenha({ papelQuemPede: 'triagem', diretoria: false, papeisAlvo: alvo.papeisAlvo, emailAlvo: 'ger@x.com', temGoogle: false });
    assert.equal(r.ok, false);
    assert.equal(r.status, 403);
  }
  // o admin continua podendo
  const adm = papeisDaContaAlvo({ cadastroAlvoId: 'temp_x', cadastroAlvoEhPreCadastro: true, cadastroAlvoRole: '', papeisPorEmail: [''], contaUid: 'u_ger', cadastroDaConta: { existe: true, role: 'manager' } });
  assert.equal(podeDefinirSenha({ papelQuemPede: 'admin', diretoria: false, papeisAlvo: adm.papeisAlvo, emailAlvo: 'ger@x.com', temGoogle: false }).ok, true);
});

test('conta de login sem cadastro próprio: só pré-cadastro recebe senha; o mesmo uid não é conferido duas vezes', () => {
  assert.equal(papeisDaContaAlvo({ cadastroAlvoId: 'temp_x', cadastroAlvoEhPreCadastro: true, cadastroAlvoRole: '', papeisPorEmail: [''], contaUid: 'u_fora', cadastroDaConta: { existe: false } }).ok, true);
  assert.equal(papeisDaContaAlvo({ cadastroAlvoId: 'phone_1499', cadastroAlvoEhPreCadastro: true, cadastroAlvoRole: 'external_seller', papeisPorEmail: [], contaUid: 'u_fora', cadastroDaConta: { existe: false } }).ok, true);
  const recusa = papeisDaContaAlvo({ cadastroAlvoId: 'u_outro', cadastroAlvoEhPreCadastro: false, cadastroAlvoRole: 'external_seller', papeisPorEmail: ['external_seller'], contaUid: 'u_fora', cadastroDaConta: { existe: false } });
  assert.equal(recusa.ok, false);
  assert.equal(recusa.status, 409);
  // conta nova (sem login ainda) ou conta do próprio cadastro: só os papéis dos cadastros
  assert.deepEqual(papeisDaContaAlvo({ cadastroAlvoId: 'temp_x', cadastroAlvoEhPreCadastro: true, cadastroAlvoRole: 'external_seller', papeisPorEmail: ['external_seller'], contaUid: null, cadastroDaConta: null }), { ok: true, papeisAlvo: ['external_seller', 'external_seller'] });
  assert.equal(papeisDaContaAlvo({ cadastroAlvoId: 'u_1', cadastroAlvoEhPreCadastro: false, cadastroAlvoRole: 'internal_seller', papeisPorEmail: ['internal_seller'], contaUid: 'u_1', cadastroDaConta: null }).ok, true);
});

test('CONVITE RÁPIDO: heloisa_ com conta de login e sem users/{uid} recebe senha; o id que é uid real nunca é pré-cadastro', () => {
  const heloisa = papeisDaContaAlvo({ cadastroAlvoId: 'heloisa_1', cadastroAlvoEhPreCadastro: true, cadastroAlvoRole: 'internal_seller', papeisPorEmail: ['internal_seller'], contaUid: 'u_helo', cadastroDaConta: { existe: false } });
  assert.equal(heloisa.ok, true);
  assert.equal(podeDefinirSenha({ papelQuemPede: 'manager', diretoria: false, papeisAlvo: heloisa.papeisAlvo, emailAlvo: 'h@x.com', temGoogle: false }).ok, true);
  // o admin com convite rápido (sem users/{uid}) também não fica trancado
  assert.equal(papeisDaContaAlvo({ cadastroAlvoId: 'gislene_1', cadastroAlvoEhPreCadastro: true, cadastroAlvoRole: 'admin', papeisPorEmail: ['admin'], contaUid: 'u_g', cadastroDaConta: { existe: false } }).ok, true);
  // id com cara de pré-cadastro mas que é uid real de outra conta: o servidor manda false e vira 409
  const forjado = papeisDaContaAlvo({ cadastroAlvoId: 'temp_forjado', cadastroAlvoEhPreCadastro: false, cadastroAlvoRole: '', papeisPorEmail: [''], contaUid: 'u_ger', cadastroDaConta: { existe: false } });
  assert.equal(forjado.ok, false);
  assert.equal(forjado.status, 409);
  // takeover da triagem continua recusado quando a conta do gerente tem cadastro próprio
  const t = papeisDaContaAlvo({ cadastroAlvoId: 'temp_x', cadastroAlvoEhPreCadastro: true, cadastroAlvoRole: '', papeisPorEmail: [''], contaUid: 'u_ger', cadastroDaConta: { existe: true, role: 'manager' } });
  assert.equal(podeDefinirSenha({ papelQuemPede: 'triagem', diretoria: false, papeisAlvo: t.papeisAlvo, emailAlvo: 'ger@x.com', temGoogle: false }).ok, false);
});

test('servidor: pré-cadastro decidido pelo Auth, checkRevoked em quemChama, e-mail com maiúsculas e erro do registro', () => {
  const fonte = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.ok(fonte.includes('admin.auth().getUser(cadastroAlvo.id)'));
  assert.ok(fonte.includes('cadastroAlvoEhPreCadastro,'));
  const q = fonte.indexOf('async function quemChama(');
  assert.ok(fonte.slice(q, q + 900).includes('verifyIdToken(token, true)'));
  assert.ok(fonte.includes("codigo: 'token_revogado'"));
  assert.ok(fonte.includes("console.error(\"[AUTH-ADMIN] FALHA ao gravar o registro"));
});

test('servidor: a troca de senha confere o cadastro da conta de login, checkRevoked e registra o que a gestão fez', () => {
  const fonte = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const j = fonte.indexOf('app.post("/api/admin/set-user-password"');
  const troca = fonte.slice(j, fonte.indexOf('const __entryDir', j));
  assert.ok(troca.includes('verifyIdToken(token, true)'));
  assert.ok(troca.includes("'auth/id-token-revoked'"));
  assert.ok(troca.includes("collection('users').doc(contaExistente.uid).get()"));
  assert.ok(troca.includes('papeisDaContaAlvo({'));
  // a conferência vem ANTES de mexer na conta
  assert.ok(troca.indexOf('papeisDaContaAlvo({') < troca.indexOf('podeDefinirSenha({'));
  assert.ok(troca.indexOf('podeDefinirSenha({') < troca.indexOf('updateUser(contaExistente.uid'));
  assert.ok(troca.includes('collection(COLECAO_SENHAS_PELA_GESTAO).add({'));
  assert.ok(/quem_uid: requesterUid[\s\S]*email_alvo: emailAlvo[\s\S]*quando|quando:[\s\S]*quem_uid: requesterUid[\s\S]*email_alvo: emailAlvo/.test(troca));
  assert.ok(fonte.includes('out.senhas_pela_gestao = await ultimasSenhasPelaGestao()'));
});

test('servidor: no primeiro acesso a marca da senha inicial é apagada junto com o provisório, no fim do lote', () => {
  const fonte = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const i = fonte.indexOf('app.post("/api/auth/reivindicar-perfil"');
  const trecho = fonte.slice(i, fonte.indexOf('app.get("/api/settings/:docName"', i));
  const apaga = trecho.indexOf("lote.delete(db.collection('senhas_iniciais').doc(t.id))");
  assert.ok(apaga > 0, 'a marca senhas_iniciais/{código} não é mais apagada');
  // depois de mover a comissão e antes do commit, junto com o delete do provisório
  assert.ok(apaga > trecho.indexOf('moverComissoesDoProvisorio('));
  assert.ok(apaga < trecho.indexOf('await lote.commit()'));
  const bloco = trecho.slice(trecho.indexOf('temporarios.forEach((t: any) => {'), apaga);
  assert.ok(bloco.includes('lote.delete(t.ref)'));
});

test('foto do Agendor: só https de agendor.com.br, S3 ou CloudFront', () => {
  assert.equal(urlDeFotoAgendor('https://app.agendor.com.br/foto.jpg'), true);
  assert.equal(urlDeFotoAgendor('https://agendor-prod.s3.amazonaws.com/p/1.png'), true);
  assert.equal(urlDeFotoAgendor('https://d1234.cloudfront.net/1.png'), true);
  assert.equal(urlDeFotoAgendor('http://app.agendor.com.br/foto.jpg'), false);
  assert.equal(urlDeFotoAgendor('https://169.254.169.254/latest/meta-data'), false);
  assert.equal(urlDeFotoAgendor('https://agendor.com.br.evil.com/x.png'), false);
  assert.equal(urlDeFotoAgendor('https://evilagendor.com.br/x.png'), false);
  assert.equal(urlDeFotoAgendor('https://user:pw@app.agendor.com.br/x.png'), false);
  assert.equal(urlDeFotoAgendor('https://app.agendor.com.br:8443/x.png'), false);
  assert.equal(hostDeFotoAgendor('metadata.google.internal'), false);
});

test('servidor: a rota da foto do Agendor exige o dono e usa o download protegido', () => {
  const fonte = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const i = fonte.indexOf('app.get("/api/admin/agendor-foto"');
  const trecho = fonte.slice(i, fonte.indexOf('app.get("/api/documento"', i));
  assert.ok(trecho.includes("me.role !== 'admin'"));
  assert.ok(trecho.includes('urlDeFotoAgendor(url)'));
  assert.ok(trecho.includes('baixarExterna(url, 8000, 10 * 1024 * 1024, { hostPermitido: hostDeFotoAgendor })'));
  assert.ok(!/await fetch\(url/.test(trecho));
});

// PODER AUTO-CRIADO (20/10/2026). O dono do e-mail X cria uma segunda conta com senha (Q), grava
// users/Q com o e-mail X, comissão de 50% e "recebe lead", e entra como X (confirmado, sem users/X).
// O servidor juntava users/Q e forçava "active". Agora só entra pré-cadastro que não é conta de login.
test('PODER AUTO-CRIADO: no e-mail confirmado, o cadastro de outra conta de login (Q) nunca é juntado', async () => {
  const contasDeLogin = new Set(['uid_q']);
  const ehContaDeLogin = async (id: string) => contasDeLogin.has(id);
  const decX = { uid: 'uid_x', email: 'x@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } };
  const forjado = { id: 'uid_q', dados: { email: 'x@gmail.com', role: 'external_seller', status: 'pending', is_commissionable: true, commission_rate: 50, is_lead_receiver: true } };
  const r = await escolherPreCadastros({ cadastros: [forjado], uidDoLogin: 'uid_x', confirmado: true, dec: decX, ehContaDeLogin, marcaDe: async () => null });
  assert.deepEqual(r, []);
  // quem decide é o Auth: qualquer id que seja conta de login fica de fora, com ou sem prefixo
  const outro = { id: 'temp_parece_mas_e_conta', dados: forjado.dados };
  assert.deepEqual(await escolherPreCadastros({ cadastros: [outro], uidDoLogin: 'uid_x', confirmado: true, dec: decX, ehContaDeLogin: async () => true, marcaDe: async () => null }), []);
});

test('PODER AUTO-CRIADO: o pré-cadastro da gestão (temp_/phone_, sem conta de login) continua sendo juntado no e-mail confirmado', async () => {
  const decX = { uid: 'uid_x', email: 'x@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } };
  const prov = { id: 'temp_123', dados: { email: 'x@gmail.com', role: 'external_seller', is_commissionable: true, commission_rate: 3 } };
  const fone = { id: 'phone_14999990000', dados: { email: 'x@gmail.com', role: 'external_seller' } };
  const forjado = { id: 'uid_q', dados: { email: 'x@gmail.com', commission_rate: 50 } };
  const proprio = { id: 'uid_x', dados: { email: 'x@gmail.com' } };
  const r = await escolherPreCadastros({
    cadastros: [forjado, prov, fone, proprio], uidDoLogin: 'uid_x', confirmado: true, dec: decX,
    ehContaDeLogin: async (id) => id === 'uid_q', marcaDe: async () => null,
  });
  assert.deepEqual(r.map(c => c.id), ['temp_123', 'phone_14999990000']);
});

test('PODER AUTO-CRIADO: pré-cadastro cujo código já virou conta de login não é juntado', async () => {
  const decX = { uid: 'uid_x', email: 'x@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } };
  const r = await escolherPreCadastros({
    cadastros: [{ id: 'temp_999', dados: { email: 'x@gmail.com' } }], uidDoLogin: 'uid_x', confirmado: true, dec: decX,
    ehContaDeLogin: async () => true, marcaDe: async () => null,
  });
  assert.deepEqual(r, []);
});

test('PRIMEIRO ACESSO não confirmado: continua exigindo a marca da senha da Roder e o login posterior a ela', async () => {
  const seg = 1_800_000_000;
  const dec = (auth: number) => ({ uid: 'uid_x', email: 'x@gmail.com', email_verified: false, auth_time: auth, firebase: { sign_in_provider: 'password' } });
  const prov = { id: 'temp_1', dados: { email: 'x@gmail.com', initial_password: 'abc123' } };
  const marca = { cadastro_id: 'temp_1', email: 'x@gmail.com', definida_em: new Date(seg * 1000).toISOString(), definida_por_uid: 'u_jef' };
  const base = { cadastros: [prov], uidDoLogin: 'uid_x', confirmado: false, ehContaDeLogin: async () => false };
  assert.equal((await escolherPreCadastros({ ...base, dec: dec(seg + 60), marcaDe: async () => marca })).length, 1);
  assert.equal((await escolherPreCadastros({ ...base, dec: dec(seg + 60), marcaDe: async () => null })).length, 0);
  assert.equal((await escolherPreCadastros({ ...base, dec: dec(seg - 60), marcaDe: async () => marca })).length, 0);
});

test('PODER AUTO-CRIADO: o servidor usa escolherPreCadastros também no e-mail confirmado (sem filtro solto)', () => {
  const src = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const i = src.indexOf('app.post("/api/auth/reivindicar-perfil"');
  const trecho = src.slice(i, i + 6000);
  assert.match(trecho, /escolherPreCadastros\(/);
  assert.doesNotMatch(trecho, /achados\.docs\.filter\(d => d\.id !== dec\.uid\)/);
});

// PRÉ-CADASTRO COM CÓDIGO ANTIGO (20/10/2026): heloisa_1, luana_1 etc. criados pelos botões de convite
// rápido. Quem decide é o Auth (o código não é uid de conta de login), e não o prefixo.
test('CONVITE RÁPIDO: heloisa_1 é juntado no e-mail confirmado (Google) e o decoy Q continua de fora', async () => {
  const decH = { uid: 'uid_h', email: 'heloisa@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } };
  const heloisa = { id: 'heloisa_1', dados: { email: 'heloisa@gmail.com', role: 'internal_seller', status: 'active', is_lead_receiver: true } };
  const q = { id: 'uid_q', dados: { email: 'heloisa@gmail.com', role: 'external_seller', status: 'pending', commission_rate: 50, is_commissionable: true } };
  const r = await escolherPreCadastros({
    cadastros: [q, heloisa], uidDoLogin: 'uid_h', confirmado: true, dec: decH,
    ehContaDeLogin: async (id) => id === 'uid_q', marcaDe: async () => null,
  });
  assert.deepEqual(r.map(c => c.id), ['heloisa_1']);
});

test('CONVITE RÁPIDO: heloisa_1 no e-mail não confirmado exige a marca da senha da Roder, como qualquer pré-cadastro', async () => {
  const seg = 1_800_000_000;
  const dec = { uid: 'uid_h', email: 'heloisa@gmail.com', email_verified: false, auth_time: seg + 60, firebase: { sign_in_provider: 'password' } };
  const heloisa = { id: 'heloisa_1', dados: { email: 'heloisa@gmail.com', role: 'internal_seller', initial_password: 'abc123' } };
  const marca = { cadastro_id: 'heloisa_1', email: 'heloisa@gmail.com', definida_em: new Date(seg * 1000).toISOString(), definida_por_uid: 'u_jef' };
  const base = { cadastros: [heloisa], uidDoLogin: 'uid_h', confirmado: false, dec, ehContaDeLogin: async () => false };
  assert.deepEqual((await escolherPreCadastros({ ...base, marcaDe: async () => marca })).map(c => c.id), ['heloisa_1']);
  assert.equal((await escolherPreCadastros({ ...base, marcaDe: async () => null })).length, 0);
  // se o código virar conta de login, não vale nem com a marca
  assert.equal((await escolherPreCadastros({ ...base, ehContaDeLogin: async () => true, marcaDe: async () => marca })).length, 0);
});

test('PAPEL NO SERVIDOR: cadastro que não está "active" não conta como equipe em quemChama', () => {
  const src = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const i = src.indexOf('async function quemChama(');
  const trecho = src.slice(i, i + 2500);
  assert.match(trecho, /cad\?\.status === 'active'/);
});
