// E-MAIL CONFIÁVEL (19/10/2026).
// Antes, conta com senha valia como e-mail confirmado, supondo que o cadastro público estivesse
// desligado no Firebase. Não está: o app usa login anônimo (estoque, cadastro rápido, visitante do
// Consultor), e com a criação de usuário ligada qualquer pessoa cria qualquer@roderbrasil.com.br
// com senha pela API do Firebase, sem nunca ter acesso à caixa daquele e-mail. Esse login passava
// por equipe nas regras e, se o e-mail da diretoria ainda não tivesse conta, por diretoria.
// Agora só vale o e-mail confirmado de verdade (email_verified). As contas com senha criadas pela
// tela de Usuários nascem confirmadas pelo servidor, e as antigas são marcadas uma vez só por
// marcarContasDaEquipe (só quem tem cadastro ativo no app).

export const EMAILS_DIRETORIA = ['roderbrasil@gmail.com', 'roderindica@gmail.com', 'jeferson@roderbrasil.com.br'];

// Token decodificado do Firebase: o e-mail dele só vale se estiver confirmado e não for anônimo.
export function emailConfiavelDoToken(dec: any): string {
  if (!dec || dec.firebase?.sign_in_provider === 'anonymous') return '';
  if (dec.email_verified !== true) return '';
  return String(dec.email || '').toLowerCase().trim();
}

export function ehDiretoriaPeloToken(dec: any): boolean {
  const email = emailConfiavelDoToken(dec);
  return !!email && EMAILS_DIRETORIA.includes(email);
}

// Papel de quem chama: vem do cadastro (users/{uid}.role), que a pessoa não troca sozinha.
// O e-mail só promove a admin quando é da diretoria E está confirmado.
export function papelDeQuemChama(dec: any, papelDoCadastro: string): string {
  if (ehDiretoriaPeloToken(dec)) return 'admin';
  return String(papelDoCadastro || '');
}

// Marcação única das contas antigas com senha: só quem tem cadastro ATIVO no app com o mesmo uid.
// O cadastro próprio nasce "pending" pelas regras, então quem criou a conta sozinho nunca entra.
export function deveMarcarEmailConfirmado(contaAuth: any, cadastro: any): boolean {
  if (!contaAuth || contaAuth.emailVerified === true) return false;
  const email = String(contaAuth.email || '').toLowerCase().trim();
  if (!email) return false;
  const temSenha = Array.isArray(contaAuth.providerData) && contaAuth.providerData.some((p: any) => p?.providerId === 'password');
  if (!temSenha) return false;
  if (!cadastro || cadastro.status !== 'active') return false;
  const emailCadastro = String(cadastro.email || '').toLowerCase().trim();
  if (emailCadastro && emailCadastro !== email) return false;
  return true;
}

// Por que uma conta com senha ficou SEM confirmar na rodada única. A tela de Regras mostra a lista
// para o dono decidir antes de publicar (cada uma passa a entrar como parceiro sem cadastro).
export type MotivoPendente = 'sem_cadastro' | 'cadastro_inativo' | 'email_diferente' | 'pre_cadastro_por_email' | 'diretoria';

// O que a rodada única faz com uma conta: 'pular' (não é conta com senha sem confirmar),
// 'marcar' (cadastro ativo do mesmo uid e e-mail) ou o motivo de ter ficado como está.
// A diretoria nunca é marcada aqui: ela vira admin pelo e-mail, então o e-mail dela tem de ser
// confirmado de verdade (Google ou "Esqueci a senha"), e não por dedução do servidor.
export function classificarConta(contaAuth: any, cadastro: any, temPreCadastroPorEmail: boolean): 'pular' | 'marcar' | MotivoPendente {
  if (!contaAuth || contaAuth.emailVerified === true) return 'pular';
  const email = String(contaAuth.email || '').toLowerCase().trim();
  if (!email) return 'pular';
  const temSenha = Array.isArray(contaAuth.providerData) && contaAuth.providerData.some((p: any) => p?.providerId === 'password');
  if (!temSenha) return 'pular';
  if (EMAILS_DIRETORIA.includes(email)) return 'diretoria';
  if (!cadastro) return temPreCadastroPorEmail ? 'pre_cadastro_por_email' : 'sem_cadastro';
  if (cadastro.status !== 'active') return 'cadastro_inativo';
  const emailCadastro = String(cadastro.email || '').toLowerCase().trim();
  if (emailCadastro && emailCadastro !== email) return 'email_diferente';
  return 'marcar';
}

// PRIMEIRO ACESSO DE PRÉ-CADASTRADO COM CONTA DE SENHA NÃO CONFIRMADA. Só vale quando dá para
// provar que quem entrou sabe a senha que a Roder definiu: login por senha, o cadastro provisório
// tem senha inicial, e o login aconteceu DEPOIS do momento em que o servidor gravou essa senha.
// Quem criou a conta por fora antes disso perdeu a senha dele na troca; cadastro antigo sem a data
// não passa (a Roder redefine a senha e aí passa).
//
// CADASTRO FORJADO (19/10/2026). O cadastro em users/ não basta como prova: qualquer login grava
// o próprio users/{uid} pelas regras, e antes podia gravar ali o e-mail de outra pessoa com
// initial_password e uma data antiga. A conta A, criada por fora com aquele e-mail, achava esse
// cadastro, passava aqui e o servidor confirmava o e-mail dela (leitura de equipe pelo domínio).
// Agora valem só, e todos juntos:
// - o código do cadastro é de pré-cadastro (temp_ ou phone_, como a tela de Usuários cria) e não
//   é o uid de uma conta de login (o servidor confere com getUser antes de chamar aqui);
// - existe a marca que SÓ o servidor grava (senhas_iniciais/{código}, coleção que as regras não
//   deixam ninguém ler nem gravar), feita em /api/admin/set-user-password por quem a gestão
//   conferida no servidor, com o mesmo código, o mesmo e-mail e a data da senha;
// - o login é posterior a essa data (a data que vale é a da marca, não a do cadastro).
export const PREFIXOS_PRE_CADASTRO = ['temp_', 'phone_'];
export function ehIdDePreCadastro(id: string): boolean {
  return PREFIXOS_PRE_CADASTRO.some(p => String(id || '').startsWith(p));
}

export type MarcaSenhaInicial = { cadastro_id?: string; email?: string; definida_em?: string; definida_por_uid?: string };

export function podeConfirmarPrimeiroAcesso(dec: any, provisorio: any, cadastroId: string, marca: MarcaSenhaInicial | null | undefined): boolean {
  if (!dec || dec.firebase?.sign_in_provider !== 'password') return false;
  if (!provisorio || !String(provisorio.initial_password || '')) return false;
  if (!marca || marca.cadastro_id !== cadastroId || !String(marca.definida_por_uid || '')) return false;
  const email = String(dec.email || '').toLowerCase().trim();
  if (!email || String(marca.email || '').toLowerCase().trim() !== email) return false;
  if (String(provisorio.email || '').toLowerCase().trim() !== email) return false;
  const definidaEm = Date.parse(String(marca.definida_em || ''));
  if (!Number.isFinite(definidaEm)) return false;
  const entrouEm = Number(dec.auth_time);
  if (!Number.isFinite(entrouEm) || entrouEm <= 0) return false;
  return entrouEm * 1000 > definidaEm;
}

// QUAIS CADASTROS O PRIMEIRO ACESSO PODE JUNTAR (20/10/2026). Vale para o e-mail confirmado e
// para o não confirmado. Antes o caminho do e-mail confirmado juntava QUALQUER users/ com o mesmo
// e-mail: o atacante dono do e-mail X criava uma segunda conta com senha (Q, sem confirmar), gravava
// em users/Q is_commissionable, commission_rate 50 e is_lead_receiver, entrava como X (confirmado,
// sem users/X) e o servidor juntava users/Q forçando "active".
// QUEM DECIDE É O AUTH, E NÃO O PREFIXO DO CÓDIGO. A tela de Usuários (e os botões de convite
// rápido, hoje removidos, mas com cadastros antigos em produção) cria o pré-cadastro com códigos
// como temp_, phone_, heloisa_, luana_. É pré-cadastro o users/{código} cujo código NÃO é uid de
// conta de login (getUser dá auth/user-not-found). Isso é seguro porque pelas regras só a gestão
// (ou o servidor) cria users/{código} que não seja o uid de quem escreve: o atacante só consegue
// criar users/{uid da própria conta}, e a conta dele existe no Auth. Cadastro de outra conta de
// login (como o Q) nunca é juntado nem apagado. Os campos de poder desse cadastro próprio também
// são barrados pelas regras na criação.
// SÓ CADASTRO "ACTIVE". Conta apagada no Auth deixa o users/{uid} órfão, e ele também passaria pelo
// teste do Auth: o atacante entra com Google, grava o próprio users/Q (pending, papel de parceiro),
// apaga a conta e entra de novo com outro uid; ou alguém desativado (inactive, blocked) apaga a
// conta para fugir da desativação. O convite da gestão e o do servidor nascem "active"; o cadastro
// próprio só pode ser pending ou sem status (regras), e desativado é inactive/blocked. Nenhum deles
// é juntado. Convite que a gestão deixou inativo de propósito também não, até ser ativado.
// No e-mail não confirmado vale também a prova da senha da Roder (marca do servidor).
// Campos que o pré-cadastro da gestão leva para o cadastro definitivo (a lista do UserProfile).
// O resto do documento não passa: campo estranho gravado ali não vira perfil.
export const CAMPOS_DO_PRE_CADASTRO = ['name', 'phone', 'role', 'commission_rate', 'assigned_regions', 'monthly_salary',
  'pix_key', 'bank_info', 'cpf_cnpj', 'company_name', 'city', 'state', 'is_icms_contributor', 'is_lead_receiver',
  'is_commissionable', 'vacation_start', 'vacation_end', 'contract_accepted', 'contract_accepted_at',
  'initial_password', 'initial_password_set_at', 'sidebar_order', 'created_at', 'permissions'];
export function camposDoPreCadastro(dados: any): Record<string, any> {
  const saida: Record<string, any> = {};
  for (const k of CAMPOS_DO_PRE_CADASTRO) if (dados && dados[k] !== undefined) saida[k] = dados[k];
  return saida;
}

export type CadastroParaJuntar = { id: string; dados: any };

export async function escolherPreCadastros(p: {
  cadastros: CadastroParaJuntar[];
  uidDoLogin: string;
  confirmado: boolean;
  dec: any;
  ehContaDeLogin: (id: string) => Promise<boolean>;
  marcaDe: (id: string) => Promise<MarcaSenhaInicial | null | undefined>;
}): Promise<CadastroParaJuntar[]> {
  const aceitos: CadastroParaJuntar[] = [];
  for (const c of p.cadastros) {
    if (c.id === p.uidDoLogin) continue;
    if (c.dados?.status !== 'active') continue;
    if (await p.ehContaDeLogin(c.id)) continue;
    if (!p.confirmado && !podeConfirmarPrimeiroAcesso(p.dec, c.dados, c.id, await p.marcaDe(c.id))) continue;
    aceitos.push(c);
  }
  return aceitos;
}

// QUEM PODE DEFINIR A SENHA DE QUEM (tela de Usuários). O admin (ou a diretoria confirmada) define
// de qualquer um. Gerente e triagem só dos papéis que eles também podem cadastrar pelas regras
// (papelQueGestaoDa em firestore.rules), tirando a própria triagem: trocar a senha de quem cuida da
// equipe é entrar como essa pessoa. Conta que entra com Google também fica só com o admin: senha
// nova numa conta Google abre um segundo jeito de entrar que o dono não pediu.
export const PAPEIS_QUE_GESTAO_DEFINE_SENHA = ['external_seller', 'vendedor_padrao', 'internal_seller', 'financial',
  'finance', 'fiscal', 'marketing', 'assistant', ''];

export function podeDefinirSenha(p: {
  papelQuemPede: string; diretoria: boolean; papeisAlvo: string[]; emailAlvo: string; temGoogle: boolean;
}): { ok: boolean; status?: number; erro?: string } {
  const admin = p.diretoria || p.papelQuemPede === 'admin';
  if (admin) return { ok: true };
  if (!['manager', 'triagem'].includes(p.papelQuemPede)) {
    return { ok: false, status: 403, erro: 'Acesso negado. Só administrador, gerente e triagem definem senhas.' };
  }
  const email = String(p.emailAlvo || '').toLowerCase().trim();
  if (EMAILS_DIRETORIA.includes(email) || p.papeisAlvo.some(r => !PAPEIS_QUE_GESTAO_DEFINE_SENHA.includes(String(r || '')))) {
    return { ok: false, status: 403, erro: 'Só o administrador troca a senha de contas de gestão (administrador, gerente e triagem).' };
  }
  if (p.temGoogle) {
    return { ok: false, status: 403, erro: 'Esta pessoa entra com o Google. Só o administrador pode pôr senha nessa conta.' };
  }
  return { ok: true };
}

// PAPÉIS DO ALVO DA SENHA (20/10/2026). A senha nova vai para a CONTA DE LOGIN do e-mail
// (getUserByEmail), e não para o cadastro escolhido na tela. Conferir só os cadastros com aquele
// e-mail deixava um buraco: a triagem criava users/temp_x sem papel com o e-mail de um gerente
// cujo próprio users/{uid} tem outro e-mail (ou nenhum), e trocava a senha do gerente. Agora entra
// também o papel de users/{uid da conta}. Sem esse cadastro, a conta só aceita senha nova quando o
// alvo é um pré-cadastro, que é o caso de quem criou a conta antes do primeiro acesso. Pré-cadastro
// se decide pelo Auth (o id do cadastro não é uma conta de login), e não pelo prefixo: os convites
// rápidos criam rogerio_, heloisa_ etc. Quem calcula é o server.ts (cadastroAlvoEhPreCadastro).
export function papeisDaContaAlvo(p: {
  cadastroAlvoId: string; cadastroAlvoEhPreCadastro: boolean; cadastroAlvoRole: string; papeisPorEmail: string[];
  contaUid: string | null; cadastroDaConta: { existe: boolean; role?: string } | null;
}): { ok: boolean; papeisAlvo: string[]; status?: number; erro?: string } {
  const papeisAlvo = [String(p.cadastroAlvoRole || ''), ...p.papeisPorEmail.map(r => String(r || ''))];
  if (!p.contaUid || p.contaUid === p.cadastroAlvoId) return { ok: true, papeisAlvo };
  if (p.cadastroDaConta?.existe) {
    papeisAlvo.push(String(p.cadastroDaConta.role || ''));
    return { ok: true, papeisAlvo };
  }
  if (p.cadastroAlvoEhPreCadastro) return { ok: true, papeisAlvo };
  return {
    ok: false, papeisAlvo, status: 409,
    erro: 'A conta de login deste e-mail não tem cadastro próprio na tela de Usuários. Só o pré-cadastro (primeiro acesso) recebe senha assim; fale com o administrador.',
  };
}
