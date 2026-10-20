// Fichas (PDF) que o site da Roder publica por modelo. Só entram aqui links vistos de verdade
// nas páginas de produto de roderbrasil.com.br; nada inventado.
// Regra: o link do site só PREENCHE modelo sem ficha. Nunca troca link já salvo e nunca
// substitui a ficha própria do app (as fichas próprias abrem por outra rota, sem olhar este campo).

export type ModeloFicha = { id?: string; name?: string; pdf_url?: string };
export type ProdutoFicha = { id?: string; name?: string; pdf_url?: string; models?: ModeloFicha[] };

const SITE = 'https://roderbrasil.com.br/wp-content/uploads/2025/09';

// chave = id do modelo (minúsculo) ou nome sem espaços/símbolos
const FICHAS_POR_MODELO: Record<string, string> = {
  // Página: /triturador-florestal/triturador-pa-carregadeira/triturador-florestal-fae-uml-ssl-vt/
  'fae-uml-ssl-vt-175': `${SITE}/FAE-UML-SSL.pdf`,
  // Página: /triturador-florestal/triturador-pa-carregadeira/triturador-florestal-cat-930/ (CAT 930K/938K)
  'fae-140-u-pm-200': `${SITE}/FAE-140U_200U.pdf`,
};

export const chaveModelo = (m: ModeloFicha): string => String(m?.id || '').trim().toLowerCase();

const vazio = (v?: string) => !String(v || '').trim();

/** Link do site para o modelo, ou '' quando o modelo já tem ficha ou o site não tem uma inequívoca. */
export function fichaDoSiteParaModelo(produto: ProdutoFicha, modelo: ModeloFicha): string {
  if (!modelo || !vazio(modelo.pdf_url)) return '';
  // produto com PDF de linha já mostra uma ficha para o modelo: não mexe
  if (!vazio(produto?.pdf_url)) return '';
  return FICHAS_POR_MODELO[chaveModelo(modelo)] || '';
}

/** Lista de modelos a preencher em um produto; vazio = nada a fazer (idempotente). */
export function modelosComFichaDoSite(produto: ProdutoFicha): ModeloFicha[] | null {
  const modelos = produto?.models || [];
  let mudou = false;
  const novos = modelos.map(m => {
    const url = fichaDoSiteParaModelo(produto, m);
    if (!url) return m;
    mudou = true;
    return { ...m, pdf_url: url };
  });
  return mudou ? novos : null;
}
