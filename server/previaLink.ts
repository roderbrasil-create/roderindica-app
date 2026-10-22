// Prévia do link curto /o/:codigo no WhatsApp (foto, nome e descrição do equipamento).
// O WhatsApp não roda o app: ele lê só as etiquetas og: do HTML que o servidor devolve. Por isso
// a página do link curto é o index.html do app com estas etiquetas encaixadas no <head>.
// Separado do server.ts para o teste conferir o escape e a prévia padrão sem subir o servidor.
import { videoDoEquipamento } from '../src/lib/videoEquipamento';
import { OG_LARGURA, OG_ALTURA, urlImagemPrevia } from './previaImagem';

// Endereço público do app (sempre https). SITE_PUBLICO no ambiente troca, se um dia mudar o domínio.
// Não sai do cabeçalho Host da requisição: quem chama poderia pôr outro domínio na prévia.
export const SITE_PREVIA = (/^https:\/\/[a-z0-9.-]+$/i.test(String(process.env.SITE_PUBLICO || '')) ? String(process.env.SITE_PUBLICO) : 'https://roderindica.com').replace(/\/$/, '');

// A foto da prévia é a arte JPEG 1200x630 do próprio servidor (server/previaImagem.ts)
const ehArteOg = (u: string) => /\/og\/[A-Za-z0-9]{1,12}-[a-f0-9]{4,16}\.jpg$/.test(String(u || ''));

export type DadosPrevia = { titulo: string; descricao: string; imagem: string; url: string; temVideo?: boolean };

export const urlPreviaPadrao = () => urlImagemPrevia(SITE_PREVIA, '', []);

export const escHtml = (t: string) => String(t ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const codigoLimpo = (c: any) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

// Código que não existe (ou equipamento apagado): a prévia da Roder, nunca uma página quebrada
export function previaPadrao(codigo: string): DadosPrevia {
  return {
    titulo: 'Roder Máquinas e Equipamentos',
    descricao: 'Fotos, vídeo, ficha técnica e orçamento.',
    imagem: urlPreviaPadrao(),
    url: `${SITE_PREVIA}/o/${codigoLimpo(codigo)}`,
  };
}

// Título e descrição a partir do produto e do modelo do link (a foto é escolhida no servidor,
// que confere se ela abre de verdade)
export function previaDoEquipamento(codigo: string, p: any, m: any, imagem: string): DadosPrevia {
  const nome = String(p?.name || '').trim();
  if (!nome) return previaPadrao(codigo);
  const titulo = `${nome}${m?.name && !nome.includes(String(m.name)) ? ` ${m.name}` : ''} | Roder`;
  // dois perfis no mesmo texto ("14 a 22 t (escavadeira) | 6 a 10 t (retro)"): a prévia fala do primeiro
  const base = String(m?.technical_specs?.maquina_base || '').split('|')[0].replace(/\s*\([^)]*\)\s*$/, '').trim();
  const temVideo = !!videoDoEquipamento(p, m);
  const fim = temVideo ? 'Veja o vídeo trabalhando e peça o orçamento.' : 'Fotos, vídeo, ficha e orçamento.';
  const descricao = base
    ? `Para ${/carregadeira|engate/i.test(nome) ? 'pá carregadeira' : 'escavadeiras'} de ${base.replace(/\s*ton\.?$/i, ' t')}. ${fim}`
    : (temVideo ? fim : previaPadrao(codigo).descricao);
  return { titulo, descricao, imagem: imagem || previaPadrao(codigo).imagem, url: `${SITE_PREVIA}/o/${codigoLimpo(codigo)}`, temVideo };
}

export function metaPrevia(d: DadosPrevia): string {
  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Roder Máquinas e Equipamentos" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:title" content="${escHtml(d.titulo)}" />`,
    `<meta property="og:description" content="${escHtml(d.descricao)}" />`,
    `<meta property="og:image" content="${escHtml(d.imagem)}" />`,
    ...(d.imagem.startsWith('https://') ? [`<meta property="og:image:secure_url" content="${escHtml(d.imagem)}" />`] : []),
    // largura, altura e tipo deixam o WhatsApp montar a prévia grande sem baixar a imagem antes
    ...(ehArteOg(d.imagem) ? [
      `<meta property="og:image:type" content="image/jpeg" />`,
      `<meta property="og:image:width" content="${OG_LARGURA}" />`,
      `<meta property="og:image:height" content="${OG_ALTURA}" />`,
    ] : []),
    `<meta property="og:image:alt" content="${escHtml(d.titulo)}" />`,
    `<meta property="og:url" content="${escHtml(d.url)}" />`,
    `<meta name="description" content="${escHtml(d.descricao)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${escHtml(d.imagem)}" />`,
  ].join('\n    ');
}

// Troca o <title> do index.html e põe as etiquetas logo depois. As og: que já existirem no
// index.html saem antes (duas og:image deixam o WhatsApp escolher a errada).
export function injetarPrevia(html: string, d: DadosPrevia): string {
  let saida = String(html || '')
    .replace(/\s*<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*"|name="description")[^>]*>/gi, '');
  const bloco = `<title>${escHtml(d.titulo)}</title>\n    ${metaPrevia(d)}`;
  // função na troca: um "$&" no nome do equipamento não vira texto do HTML original
  if (/<title>[\s\S]*?<\/title>/i.test(saida)) return saida.replace(/<title>[\s\S]*?<\/title>/i, () => bloco);
  if (/<\/head>/i.test(saida)) return saida.replace(/<\/head>/i, () => `${bloco}\n  </head>`);
  return `${bloco}\n${saida}`;
}
