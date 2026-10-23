// Convite de acesso por WhatsApp (Gestão de usuários). Lógica pura, testada em testes-servidor/.
// Causa do "botão não faz nada" no iPhone: o clique salvava a senha (await no Firestore e no
// servidor) e só depois chamava window.open. O Safari só deixa abrir janela dentro do toque; depois
// de um await ele bloqueia em silêncio. Por isso o fluxo agora abre a janela NO TOQUE, e só depois
// aponta para o link; se não der, copia a mensagem e o chamador avisa com um botão.
// A senha vai só dentro do texto da mensagem; nada aqui escreve em log.

export interface UsuarioConvite {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  initial_password?: string;
}

// Telefone brasileiro para o wa.me: só dígitos, com o 55 na frente. Devolve '' quando não dá
// para ser um número (o link então abre o WhatsApp sem destinatário, em vez de um número inexistente).
export function telefoneWhatsBR(telefone?: string | null): string {
  let d = String(telefone ?? '').replace(/\D/g, '');
  d = d.replace(/^0+/, ''); // "037..." e "0037..." (prefixo de operadora/discagem)
  if (d.length === 10 || d.length === 11) d = '55' + d;
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d;
  return '';
}

export function linkWhatsConvite(telefone: string | undefined | null, mensagem: string): string {
  return `https://wa.me/${telefoneWhatsBR(telefone)}?text=${encodeURIComponent(mensagem)}`;
}

const NOME_PAPEL: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente Comercial',
  internal_seller: 'Vendedora Interna',
  triagem: 'Triagem',
  financial: 'Financeiro',
  vendedor_padrao: 'Vendedor Padrão',
};

export function montarMensagemConvite(user: UsuarioConvite, appUrl: string, password?: string, includePassword?: boolean): string {
  const email = user.email || '';
  const roleName = NOME_PAPEL[user.role || ''] || 'Vendedor Externo';
  const isMobileOnly = email.endsWith('@mobile.roder.com.br');
  const isGoogle = email.endsWith('@gmail.com') || email.endsWith('@roderbrasil.com.br') || email.endsWith('@roder.com.br');

  const effectivePassword = (password !== undefined ? password : user.initial_password)?.trim();
  const hasRegisteredPassword = !!effectivePassword && includePassword !== false;

  let loginMethodInfo = '';
  let instructions = '';

  if (isMobileOnly) {
    loginMethodInfo = `📲 *Acesso via WhatsApp:*\n• *Número de Telefone:* ${user.phone}`;
    instructions = `1. Ao abrir o link do App, selecione a opção *"Acesso via WhatsApp"*.\n` +
                   `2. Digite o seu número (${user.phone}) e clique em entrar.`;
  } else if (hasRegisteredPassword) {
    loginMethodInfo = `🔑 *Dados de Acesso (Login e Senha):*\n• *E-mail:* ${email}\n• *Senha de Acesso:* ${effectivePassword}`;
    instructions = `1. Ao abrir o link do App, selecione a opção *"E-mail e Senha"*.\n` +
                   `2. Digite o seu e-mail (*${email}*) e a senha cadastrada informada acima (*${effectivePassword}*).\n` +
                   `3. Clique no botão *"Entrar"* para acessar o sistema.`;
    if (isGoogle) {
      instructions += `\n\n💡 *Opção alternativa:* Se preferir, você também pode clicar no botão *"Google"* usando sua conta ${email}.`;
    }
  } else if (isGoogle) {
    loginMethodInfo = `📧 *Acesso via Google:*\n• *Conta Google:* ${email}`;
    instructions = `1. Ao abrir o link do App, clique no botão *"Google"*.\n2. Entre com sua conta ${email}.`;
  } else {
    loginMethodInfo = `📧 *Acesso via E-mail:*\n• *E-mail:* ${email}`;
    instructions = `1. Ao abrir o link do App, selecione a opção *"E-mail e Senha"*.\n` +
                   `2. Digite o seu e-mail (*${email}*).\n` +
                   `3. Caso ainda não tenha uma senha cadastrada, clique no link *"Esqueci minha senha"* para criá-la.`;
  }

  return `Olá *${user.name}*!\n\n` +
    `Você foi cadastrado no sistema *RODER Indica V2* como *${roleName}*.\n\n` +
    `🔗 *Link do App:* ${appUrl}\n\n` +
    `${loginMethodInfo}\n\n` +
    `*Instruções para o seu acesso:* \n` +
    `${instructions}\n\n` +
    `📌 *Dica:* No celular, toque no ícone de compartilhar e selecione "Adicionar à Tela de Início" para instalar o App.\n\n` +
    `Qualquer dúvida, fale com a Luana!`;
}

export interface JanelaMin { closed?: boolean; location: { href: string }; close?: () => void }

// Entrega o convite depois do trabalho assíncrono. `janela` é a que foi aberta no toque (ou null se o
// navegador bloqueou). Devolve o que aconteceu para a tela avisar.
//  'aberto'  : a janela do toque foi apontada para o WhatsApp
//  'copiado' : sem janela utilizável; a mensagem foi copiada e a tela mostra um botão para abrir
//  'falhou'  : nem janela nem cópia; a tela mostra o texto para copiar na mão
export async function entregarConvite(opts: {
  janela: JanelaMin | null | undefined;
  url: string;
  mensagem: string;
  copiar: (texto: string) => Promise<void>;
}): Promise<'aberto' | 'copiado' | 'falhou'> {
  const { janela, url, mensagem, copiar } = opts;
  try {
    if (janela && !janela.closed) {
      janela.location.href = url;
      return 'aberto';
    }
  } catch { /* janela de outra origem ou já fechada: cai para a cópia */ }
  try {
    await copiar(mensagem);
    return 'copiado';
  } catch {
    return 'falhou';
  }
}
