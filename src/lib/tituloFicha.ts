// Título da ficha no singular, com o modelo: "Garras Florestais" + "R400" vira "Garra Florestal R400".
// Fica aqui, e não na FichaPadrao, para quem só precisa do nome (pronta entrega, cartões da conversa)
// não puxar junto as bibliotecas de PDF (jsPDF e html-to-image) que a ficha usa.
import type { Product, ProductModel } from '../types';

// "Garra Florestal" + "R400" vira "Garra Florestal R400"; não repete quando o modelo já tem o nome
// Nome da linha no singular: "Garras Florestais" vira "Garra Florestal" (só palavras comuns, não siglas)
export function singular(palavra: string) {
  if (palavra.length < 4 || palavra === palavra.toUpperCase()) return palavra;
  if (/ais$/i.test(palavra)) return palavra.replace(/ais$/i, 'al');
  if (/ões$/i.test(palavra)) return palavra.replace(/ões$/i, 'ão');
  if (/[aeo]s$/i.test(palavra)) return palavra.slice(0, -1);
  return palavra;
}

export function tituloFicha(p: Partial<Product>, m: Partial<ProductModel>) {
  // "(trator)" e afins são só para separar a linha no catálogo
  const pn = (p.name || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const mn = (m.name || '').trim();
  if (!mn) return pn;
  if (!pn || mn.toLowerCase().includes(pn.toLowerCase()) || pn.toLowerCase().includes(mn.toLowerCase())) return mn.length >= pn.length ? mn : pn;
  let palavras = pn.split(' ');
  // "Fresas FAE SSH" + "SSH 150": a sigla do modelo já está no nome da linha, não repete
  const primeira = mn.split(/\s+/)[0].toLowerCase();
  const corte = palavras.findIndex(w => w.toLowerCase() === primeira);
  if (corte > 0) palavras = palavras.slice(0, corte);
  palavras = palavras.map((w, i) => (i < 2 ? singular(w) : w));
  return `${palavras.join(' ')} ${mn}`;
}
