// Regras da indicação feita pela conversa do Consultor Roder.
// Usado no navegador (EngineerHelper) e no servidor (server/consultorParceiro.ts), para os dois
// lados validarem o telefone, a cidade e o CNPJ do mesmo jeito.

export const WHATS_COMERCIAL = '5514998115111';
export const WHATS_COMERCIAL_TEXTO = '(14) 99811-5111';

// Onde o parceiro guarda o link pessoal dele no aparelho (sobrevive a fechar o app instalado)
export const CHAVE_PARCEIRO_LINK = 'roder_consultor_parceiro';

// Papéis que criam indicação no app (mesma lista da rota /indicacoes/nova)
export const PAPEIS_QUE_INDICAM = ['external_seller', 'admin', 'manager', 'internal_seller', 'vendedor_padrao', 'triagem'];

// Token do link pessoal: só letras, números, "-" e "_" (base64url)
export const TOKEN_LINK_VALIDO = /^[A-Za-z0-9_-]{24,64}$/;

export function primeiroNome(nome?: string | null): string {
  return String(nome || '').replace('Jefferson', 'Jeferson').trim().split(/\s+/)[0] || '';
}

// DDDs que existem no Brasil
const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

// Telefone brasileiro com DDD. Aceita "+55", zero na frente, espaços e traços.
export function validarTelefoneBR(texto: string): { ok: true; digitos: string; formatado: string } | { ok: false } {
  let d = String(texto || '').replace(/\D/g, '');
  d = d.replace(/^0+/, '');
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return { ok: false };
  if (!DDDS.has(Number(d.slice(0, 2)))) return { ok: false };
  if (d.length === 11 && d[2] !== '9') return { ok: false };
  if (d.length === 10 && !/[2-8]/.test(d[2])) return { ok: false };
  if (/^(\d)\1+$/.test(d.slice(2))) return { ok: false };
  const formatado = d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return { ok: true, digitos: d, formatado };
}

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const NOMES_UF: Record<string, string> = {
  'acre': 'AC', 'alagoas': 'AL', 'amapa': 'AP', 'amazonas': 'AM', 'bahia': 'BA', 'ceara': 'CE',
  'distrito federal': 'DF', 'espirito santo': 'ES', 'goias': 'GO', 'maranhao': 'MA', 'mato grosso': 'MT',
  'mato grosso do sul': 'MS', 'minas gerais': 'MG', 'para': 'PA', 'paraiba': 'PB', 'parana': 'PR',
  'pernambuco': 'PE', 'piaui': 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN',
  'rio grande do sul': 'RS', 'rondonia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC',
  'sao paulo': 'SP', 'sergipe': 'SE', 'tocantins': 'TO',
};

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');

// "Sorriso MT", "Sorriso - MT", "Sorriso/mt", "Sorriso, Mato Grosso". Sem estado, não aceita.
export function lerCidadeUf(texto: string): { cidade: string; uf: string } | null {
  const t = String(texto || '').trim().replace(/\s+/g, ' ').replace(/[.]+$/, '');
  if (!t) return null;
  const limpaCidade = (c: string) => c.replace(/[\s,/-]+$/, '').trim();
  // estado por extenso no fim (o nome mais longo primeiro: "mato grosso do sul" antes de "mato grosso")
  const base = semAcento(t).toLowerCase();
  const nomes = Object.keys(NOMES_UF).sort((a, b) => b.length - a.length);
  for (const n of nomes) {
    if (base.endsWith(n) && base.length > n.length) {
      const cidade = limpaCidade(t.slice(0, t.length - n.length));
      if (cidade.length >= 2 && /[\s,/-]$/.test(t.slice(0, t.length - n.length))) return { cidade, uf: NOMES_UF[n] };
    }
  }
  const m = t.match(/^(.*?)[\s,/-]+([A-Za-z]{2})$/);
  if (!m) return null;
  const uf = m[2].toUpperCase();
  const cidade = limpaCidade(m[1]);
  if (!UFS.includes(uf) || cidade.length < 2) return null;
  return { cidade, uf };
}

export function validarCnpj(texto: string): { ok: true; digitos: string; formatado: string } | { ok: false } {
  const d = String(texto || '').replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return { ok: false };
  const calc = (base: string, pesos: number[]) => {
    const s = base.split('').reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(d.slice(0, 12) + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(d[12]) || d2 !== Number(d[13])) return { ok: false };
  return { ok: true, digitos: d, formatado: `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` };
}

// "quero fazer uma indicação", "indicar", "vou mandar uma indicação de cabeçote".
// Pergunta técnica ("qual garra você indica?", "o que indicar para picador?") não conta.
export function querIndicar(texto: string): boolean {
  const t = semAcento(String(texto || '').toLowerCase()).trim();
  if (!t) return false;
  if (/^indicar\b/.test(t) && !/\?\s*$/.test(t) && !/^indicar (para|pra|qual|que|o que)\b/.test(t)) return true;
  if (/\b(quero|queria|gostaria de|vou|preciso|posso|desejo)\s+(fazer\s+|mandar\s+|enviar\s+|passar\s+|lancar\s+|cadastrar\s+|registrar\s+)?(uma\s+|a\s+)?(nova\s+)?indica(r|cao)\b/.test(t)) return true;
  if (/\b(fazer|mandar|enviar|passar|lancar|cadastrar|registrar)\s+(uma\s+|a\s+)?(nova\s+)?indicacao\b/.test(t)) return true;
  if (/^(nova\s+)?indicacao\b/.test(t) && !/\?\s*$/.test(t)) return true;
  return false;
}

// Texto que o parceiro recebe com o link pessoal dele
export function textoLinkParceiro(nome: string, url: string): string {
  const pn = primeiroNome(nome) || 'parceiro';
  return `Olá, ${pn}! Este é o seu link do Consultor Roder. Abra para tirar dúvidas sobre os equipamentos e fazer indicações: ${url}\n\nEste link é exclusivo seu. Não compartilhe com outra pessoa.`;
}

export function textoLinkCliente(equipamento: string, link: string): string {
  return `Olá! Segue o link para pedir o orçamento do ${equipamento} direto com a Roder: ${link}`;
}
