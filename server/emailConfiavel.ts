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
