// Percentual de comissão que o CONTRATO DO PARCEIRO mostra na cláusula 2.1.
// Vem sempre do cadastro do parceiro (users/{uid}.commission_rate), o mesmo campo que a
// comissão usa (taxaDoParceiro), então contrato e cálculo nunca divergem. Sem taxa válida, 2%.

export const TAXA_PADRAO_CONTRATO = 2;

const UNIDADES = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze',
  'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];

function inteiroPorExtenso(n: number): string {
  if (n < 20) return UNIDADES[n];
  if (n < 100) {
    const d = Math.floor(n / 10), u = n % 10;
    return u ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d];
  }
  return n === 100 ? 'cem' : String(n);
}

/** Taxa que o contrato exibe: a do perfil quando é um número válido (> 0 e <= 100); senão 2. */
export function taxaDoContrato(taxaDoPerfil: unknown): number {
  const n = typeof taxaDoPerfil === 'string' ? parseFloat(taxaDoPerfil.replace(',', '.')) : taxaDoPerfil;
  return typeof n === 'number' && isFinite(n) && n > 0 && n <= 100 ? n : TAXA_PADRAO_CONTRATO;
}

/** "2" -> "dois"; "2,5" -> "dois vírgula cinco". */
export function percentualPorExtenso(taxa: number): string {
  const [inteira, fracao] = String(taxa).split('.');
  const base = inteiroPorExtenso(parseInt(inteira, 10));
  if (!fracao) return base;
  return `${base} vírgula ${fracao.split('').map(c => UNIDADES[parseInt(c, 10)]).join(' ')}`;
}

/** Texto da cláusula 2.1: "2% (dois por cento)". */
export function textoPercentualContrato(taxaDoPerfil: unknown): string {
  const t = taxaDoContrato(taxaDoPerfil);
  return `${String(t).replace('.', ',')}% (${percentualPorExtenso(t)} por cento)`;
}

// Correção única do contrato do parceiro Rafael (MAQLOC), assinado em 15/09/2026 com 1% digitado por
// engano; o correto é 2%. Como o percentual SOBE, o aceite existente continua valendo.
export const EMAIL_PARCEIRO_CORRIGIDO = 'rafaelcrafael413@yahoo.com';
export const TAXA_CORRETA_PARCEIRO = 2;
const TAXA_ERRADA_PARCEIRO = 1;

/** Alteração a gravar no cadastro, ou null. Só mexe no parceiro-alvo e só quando a taxa ainda é a
 *  errada (1): se alguém já acertou (ou pôs outro valor de propósito), não toca. Nunca devolve
 *  nenhum outro campo, então contract_accepted e a data do aceite ficam intactos. */
export function ajusteDeTaxaDoParceiro(perfil: { email?: string; commission_rate?: unknown } | null | undefined): { commission_rate: number } | null {
  if (!perfil) return null;
  if (String(perfil.email || '').trim().toLowerCase() !== EMAIL_PARCEIRO_CORRIGIDO) return null;
  if (Number(perfil.commission_rate) !== TAXA_ERRADA_PARCEIRO) return null;
  return { commission_rate: TAXA_CORRETA_PARCEIRO };
}
