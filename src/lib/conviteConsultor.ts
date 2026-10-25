import { primeiroNome } from './consultorIndicar';

// Convite do Consultor Técnico para o comercial interno (pedido do Jeferson, 20/10/2026).
// O comercial interno atende o cliente direto, então o e-mail NÃO fala de indicação de equipamento
// (isso é dos parceiros indicadores) nem de comissão.
// O link é o do consultor da equipe: a pessoa entra uma vez com o e-mail cadastrado e o aparelho fica liberado.
export const LINK_CONSULTOR_EQUIPE = 'https://roderbrasil.com.br/consultor-equipe';

// Quem recebe: gerência, diretoria, triagem e vendedores internos.
// Financeiro, marketing, fiscal e parceiros ficam de fora.
export const PAPEIS_CONVITE = ['internal_seller', 'manager', 'admin', 'triagem'] as const;

export const ROTULO_PAPEL_CONVITE: Record<string, string> = {
  internal_seller: 'Vendedor interno',
  manager: 'Gerência comercial',
  admin: 'Diretoria',
  triagem: 'Triagem',
};

export interface DestinatarioConvite {
  id: string;
  nome: string;
  email: string;
  papel: string;
  rotulo: string;
}

// Rogério não usa o Consultor: receber o convite só geraria dúvida, então fica fora da lista.
export const EMAILS_FORA_DO_CONVITE = ['rogerio@roderbrasil.com.br'] as const;

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Usuários ativos, com e-mail válido e papel do comercial interno. Um e-mail aparece uma vez só.
export function filtrarDestinatarios(usuarios: Array<{ id: string } & Record<string, any>>): DestinatarioConvite[] {
  const vistos = new Set<string>();
  const saida: DestinatarioConvite[] = [];
  for (const u of usuarios) {
    const email = String(u.email || '').trim().toLowerCase();
    const papel = String(u.role || '');
    if (u.status !== 'active' || !EMAIL_OK.test(email)) continue;
    if (!(PAPEIS_CONVITE as readonly string[]).includes(papel)) continue;
    if ((EMAILS_FORA_DO_CONVITE as readonly string[]).includes(email)) continue;
    if (vistos.has(email)) continue;
    vistos.add(email);
    saida.push({ id: u.id, nome: String(u.name || '').trim() || email, email, papel, rotulo: ROTULO_PAPEL_CONVITE[papel] || papel });
  }
  const ordem = (p: string) => (PAPEIS_CONVITE as readonly string[]).indexOf(p);
  return saida.sort((a, b) => ordem(a.papel) - ordem(b.papel) || a.nome.localeCompare(b.nome, 'pt-BR'));
}

const esc = (t: string) => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export const ASSUNTO_CONVITE = 'Consultor Técnico Roder no seu celular e no computador';

const USOS = [
  'Dúvidas técnicas e de compatibilidade: qual equipamento serve em qual máquina.',
  'Ponteiras, suportes e links: o que cada máquina aceita.',
  'Kits de instalação, com a confirmação da máquina antes de indicar o kit.',
  'Equipamentos à pronta entrega.',
  'Fichas técnicas e vídeos para mandar ao cliente.',
];

const PASSOS = [
  ['iPhone (Safari)', 'toque em Compartilhar e depois em "Adicionar à Tela de Início".'],
  ['Android (Chrome)', 'toque no menu dos três pontos e depois em "Instalar app" ou "Adicionar à tela inicial".'],
  ['Computador (Chrome ou Edge)', 'clique no ícone de instalar, na ponta direita da barra de endereço, e depois em "Instalar".'],
];

export function montarConvite(nome: string): { assunto: string; html: string; texto: string } {
  const pn = primeiroNome(nome);
  const saudacao = pn ? `Olá, ${pn}!` : 'Olá!';
  const abertura = 'O Consultor Técnico Roder está liberado para o comercial. Use no dia a dia, direto do celular ou do computador.';
  const entrada = 'Na primeira vez, entre com o seu e-mail cadastrado na Roder. Depois disso o aparelho fica liberado.';

  const texto = [
    saudacao,
    '',
    abertura,
    '',
    `Abrir: ${LINK_CONSULTOR_EQUIPE}`,
    entrada,
    '',
    'Para que serve:',
    ...USOS.map(u => `- ${u}`),
    '',
    'Como deixar como aplicativo:',
    ...PASSOS.map(([a, b]) => `- ${a}: ${b}`),
    '',
    'Dica: pergunte do jeito que falaria com um colega, citando a máquina do cliente. Se faltar dado, ele pergunta antes de responder.',
  ].join('\n');

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1B1E22;max-width:560px;line-height:1.5;font-size:15px">
<p style="font-size:17px;font-weight:bold;margin:0 0 10px">${esc(saudacao)}</p>
<p style="margin:0 0 14px">${esc(abertura)}</p>
<p style="margin:0 0 6px"><a href="${LINK_CONSULTOR_EQUIPE}" style="display:inline-block;background:#facc15;color:#000;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:8px">Abrir o Consultor</a></p>
<p style="margin:0 0 18px;font-size:13px;color:#555">${esc(entrada)}</p>
<p style="margin:0 0 6px;font-weight:bold">Para que serve</p>
<ul style="margin:0 0 18px;padding-left:20px">${USOS.map(u => `<li>${esc(u)}</li>`).join('')}</ul>
<p style="margin:0 0 6px;font-weight:bold">Como deixar como aplicativo</p>
<ul style="margin:0 0 18px;padding-left:20px">${PASSOS.map(([a, b]) => `<li><b>${esc(a)}:</b> ${esc(b)}</li>`).join('')}</ul>
<p style="margin:0;font-size:13px;color:#555">Dica: pergunte do jeito que falaria com um colega, citando a máquina do cliente. Se faltar dado, ele pergunta antes de responder.</p>
</div>`;

  return { assunto: ASSUNTO_CONVITE, html, texto };
}
