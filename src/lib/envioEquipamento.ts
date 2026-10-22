// ÚNICA fonte da verdade do envio de um modelo ao cliente pelo WhatsApp (card do catálogo e Consultor).
// Dado o produto e o modelo, aplica as correções de cadastro (DTH 240B), escolhe as fotos e monta o texto.
// Quem envia só chama estas funções: o texto e a foto saem iguais em qualquer ponto, mesmo que o documento
// do Firestore ainda esteja com o valor antigo.
import { comDestocadorDthCorrigido, modeloParaEnvio } from './destocadorDth';
import { textoCatalogoWhats, arquivoDeFoto, compartilharFotoETexto } from './compartilharEquipamento';

type Modelo = { id?: string; name?: string; images?: string[]; image_url?: string; technical_specs?: any; [k: string]: any };
type Produto = { id?: string; name?: string; image_url?: string; models?: Modelo[]; [k: string]: any };

// Fotos candidatas, na ordem: as do modelo, a do modelo, a do produto (sem repetir)
export function imagensParaEnvio(prod: Produto | null | undefined, model: Modelo): string[] {
  const todas = [...(model.images || []), model.image_url, prod?.image_url];
  return todas.filter((u, i): u is string => typeof u === 'string' && !!u && todas.indexOf(u) === i);
}

// O texto do WhatsApp: o mesmo para o card e para o Consultor
export function textoEnvioModelo(prod: Produto | null | undefined, model: Modelo, link: string, nomeProduto?: string): string {
  return textoCatalogoWhats(nomeProduto || prod?.name || '', modeloParaEnvio(model), link);
}

// Foto como arquivo, guardada por modelo: a preparação roda antes do toque e o envio só a lê
const fotos = new Map<string, Promise<File | null>>();
const chaveFoto = (prod: Produto | null | undefined, model: Modelo) => `${prod?.id || ''}:${model.id || model.name || ''}`;

export function prepararFotoEnvio(prod: Produto | null | undefined, model: Modelo): Promise<File | null> {
  const chave = chaveFoto(prod, model);
  let p = fotos.get(chave);
  if (!p) {
    p = arquivoDeFoto(imagensParaEnvio(prod, model), `${prod?.name || ''} ${model.name || ''}`);
    fotos.set(chave, p);
    // foto que não abriu não fica guardada: a próxima tentativa busca de novo
    p.then(f => { if (!f) fotos.delete(chave); }).catch(() => fotos.delete(chave));
  }
  return p;
}

// Foto + texto pelo menu de compartilhar. Espera a foto (até `esperaMs`) se ainda não estiver pronta.
// 'ok' enviou, 'cancelou' fechou o menu, 'indisponivel' o aparelho não aceita: quem chama cai no WhatsApp só com texto.
export async function compartilharModeloComFoto(prod: Produto | null | undefined, model: Modelo, texto: string, esperaMs = 6000): Promise<'ok' | 'cancelou' | 'indisponivel'> {
  const foto = await Promise.race([prepararFotoEnvio(prod, model), new Promise<null>(r => setTimeout(() => r(null), esperaMs))]).catch(() => null);
  return compartilharFotoETexto(foto, texto);
}

export { comDestocadorDthCorrigido, modeloParaEnvio };
