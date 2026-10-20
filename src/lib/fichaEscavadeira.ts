// Fichas montadas pelo sistema dos trituradores FAE de escavadeira (UML/EX/VT, UML/S/EX/VT, UMM,
// BL0, PML, BL1, DML, BL2, BL3). O consultor manda o vendedor para a ficha certa do modelo
// por um link "ficha-fae:<modelo>", e a tela abre a ficha padrão desse modelo (a mesma da lista de equipamentos).
// Os modelos de pá carregadeira (UML SSL VT 175, 140 U PM 200) têm ficha própria e ficam de fora.

export const MODELOS_FICHA_ESCAVADEIRA = [
  { chave: 'bl0', nome: 'FAE BL0/EX' },
  { chave: 'pml', nome: 'FAE PML/EX' },
  { chave: 'bl1', nome: 'FAE BL1/EX/VT' },
  { chave: 'dml', nome: 'FAE DML/HY' },
  { chave: 'bl2', nome: 'FAE BL2/EX/VT' },
  { chave: 'bl3', nome: 'FAE BL3/EX/VT' },
  { chave: 'uml-ex-vt', nome: 'FAE UML/EX/VT' },
  { chave: 'uml-s-ex-vt', nome: 'FAE UML/S/EX/VT' },
  { chave: 'umm', nome: 'FAE UMM/EX/VT' },
] as const;

export const PREFIXO_LINK_FICHA_FAE = 'ficha-fae:';

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// Só letras e números, sem "fae": "FAE UML/S/EX/VT" e "uml-s-ex-vt" viram "umlsexvt"
const miolo = (s: string) => semAcento(String(s || '')).toLowerCase().replace(/\bfae\b/g, '').replace(/[^a-z0-9]/g, '');

// Qual dos nove modelos o texto cita (nulo = nenhum, inclusive os de pá carregadeira)
export function chaveFichaEscavadeira(texto: string): string | null {
  const t = miolo(texto);
  if (!t || /ssl|175|140upm|200/.test(t)) return null;
  for (const m of MODELOS_FICHA_ESCAVADEIRA) {
    const base = miolo(m.chave);
    if (t === base) return m.chave;
    if (t === miolo(m.nome)) return m.chave;
  }
  // forma curta usada no dia a dia: "UMM", "UML/EX", "BL2/EX"
  if (/^umm(exvt)?$/.test(t)) return 'umm';
  if (/^umls(exvt|ex)?$/.test(t)) return 'uml-s-ex-vt';
  if (/^uml(exvt|ex)?$/.test(t)) return 'uml-ex-vt';
  const curto = t.match(/^(bl0|pml|bl1|dml|bl2|bl3)(ex|exvt|hy)?$/);
  return curto ? curto[1] : null;
}

export function linkFichaEscavadeira(chave: string): string {
  return `${PREFIXO_LINK_FICHA_FAE}${chave}`;
}

export function chaveDoLinkFichaFae(href: string): string | null {
  const h = String(href || '').trim();
  if (!h.toLowerCase().startsWith(PREFIXO_LINK_FICHA_FAE)) return null;
  return chaveFichaEscavadeira(h.slice(PREFIXO_LINK_FICHA_FAE.length));
}

type ModeloLike = { id?: string; name?: string };
type ProdutoLike<M extends ModeloLike> = { name?: string; models?: M[] };

// Acha, na lista de produtos do catálogo, o produto e o modelo da ficha pedida
export function acharFichaEscavadeira<M extends ModeloLike, P extends ProdutoLike<M>>(
  produtos: P[], chave: string,
): { product: P; model: M } | null {
  for (const p of produtos || []) {
    for (const m of p.models || []) {
      if (chaveFichaEscavadeira(m.name || '') === chave || chaveFichaEscavadeira(m.id || '') === chave) return { product: p, model: m };
    }
  }
  return null;
}

// Decide o que fazer com um link do consultor. Tudo que começa com "ficha-fae:" é tratado aqui e
// nunca segue para as outras fichas (ex.: "ficha-fae:ssh-150" não pode abrir a ficha da SSH).
export type DecisaoLinkFichaFae<P, M> =
  | { acao: 'ignorar' }
  | { acao: 'abrir'; product: P; model: M }
  | { acao: 'avisar'; aviso: string };

export function decidirLinkFichaFae<M extends ModeloLike, P extends ProdutoLike<M>>(url: string, produtos: P[]): DecisaoLinkFichaFae<P, M> {
  if (!String(url || '').trim().toLowerCase().startsWith(PREFIXO_LINK_FICHA_FAE)) return { acao: 'ignorar' };
  const chave = chaveDoLinkFichaFae(url);
  if (!chave) return { acao: 'avisar', aviso: 'Não reconheci o modelo dessa ficha. Procure na lista de equipamentos.' };
  const achada = acharFichaEscavadeira<M, P>(produtos, chave);
  if (!achada) return { acao: 'avisar', aviso: 'Não achei essa ficha no catálogo agora. Procure o modelo na lista de equipamentos.' };
  return { acao: 'abrir', ...achada };
}
