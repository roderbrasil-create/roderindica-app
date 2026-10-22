// Peças comuns das fichas técnicas em PDF: captura da folha (html-to-image + jsPDF),
// entrega do arquivo (baixar ou compartilhar) e a regra de quem pode baixar/enviar.
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getApiBaseUrl } from '../../lib/utils';

// Largura da folha na tela e altura de um A4 nessa largura (840 x 297 / 210)
export const LARGURA_FOLHA = 840;
export const ALTURA_FOLHA = 1188;

export const WHATSAPP_COMERCIAL = '5514998115111';

// Regra de quem pode baixar/enviar: módulo leve, também usado pelo leitor de documentos
export { usePodeEnviarFicha, equipeSemLogin } from '../../lib/podeEnviarFicha';

// "R400 / CA" vira "R400_CA"
export const nomeArquivoFicha = (modelo: string) =>
  `Ficha_Roder_${(modelo || 'Equipamento').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}.pdf`;

// Imagem externa passa pelo proxy do servidor: sem isso a captura da folha sai sem a foto (CORS)
export function urlParaCaptura(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.includes('/api/proxy-image')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (typeof window !== 'undefined' && url.startsWith(window.location.origin)) return url;
    return `${getApiBaseUrl()}/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

const cacheDb = new Map<string, string>();

// Também resolve as fotos guardadas no banco (db-file://id)
export async function resolverImagem(url?: string | null): Promise<string> {
  if (!url) return '';
  if (url.startsWith('db-file://')) {
    const id = url.replace('db-file://', '');
    if (cacheDb.has(id)) return cacheDb.get(id)!;
    try {
      const snap = await getDoc(doc(db, 'app_files', id));
      const dado = snap.exists() ? (snap.data() as any)?.data : '';
      if (dado) cacheDb.set(id, dado);
      return dado || '';
    } catch {
      return '';
    }
  }
  return urlParaCaptura(url);
}

import { LOGO_FAE_PADRAO } from '../../lib/logoFae';

// Sempre o logo FAE embutido. O que estava salvo no Firebase (app_files/fae_header_logo) era o logo da Roder,
// e as fichas mostravam "Roder" no bloco do distribuidor (visto em 20/10/2026).
export function carregarLogoFae(): Promise<string | null> {
  return Promise.resolve(LOGO_FAE_PADRAO);
}

// Foto do equipamento num tamanho que o iPhone aguenta dentro da captura da folha: a original pode ter
// vários MB em base64 e, no Safari, a imagem some da captura sem dar erro (caixa cinza vazia no PDF enviado
// pelo consultor). Reduz para no máximo 1400 px de lado, em JPEG, já decodificada. Sem conseguir, devolve a original.
export async function fotoLeveParaPdf(src: string, maxLado = 1400): Promise<string> {
  if (!src || typeof document === 'undefined') return src;
  try {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'anonymous';
    img.src = src;
    await img.decode();
    if (!img.naturalWidth || !img.naturalHeight) return src;
    const k = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * k));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * k));
    const ctx = canvas.getContext('2d');
    if (!ctx) return src;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const leve = canvas.toDataURL('image/jpeg', 0.88);
    return leve.length > 100 ? leve : src;
  } catch {
    return src;
  }
}

export async function esperarImagens(el: HTMLElement) {
  const imagens = Array.from(el.getElementsByTagName('img')) as HTMLImageElement[];
  await Promise.all(imagens.map(async img => {
    if (!img.complete) {
      await new Promise<void>(resolve => {
        const fim = () => resolve();
        img.addEventListener('load', fim, { once: true });
        img.addEventListener('error', fim, { once: true });
        setTimeout(fim, 8000);
      });
    }
    // decodificada de verdade: no Safari "complete" não garante que a imagem já entra na captura
    try { await img.decode(); } catch { /* imagem quebrada: segue sem ela */ }
  }));
  try { await (document as any).fonts?.ready; } catch { /* sem API de fontes */ }
}

// Cada folha vira uma página A4. Folha mais alta que o A4 é reduzida para caber inteira.
// opcoes: largura da folha em px (padrão 840), pixelRatio da captura (padrão 2) e quantas capturas
// descartáveis fazer antes da final (padrão 1; o iPhone às vezes precisa de duas) e fundo (padrão branco).
export async function pdfDasFolhas(folhas: HTMLElement[], opcoes: { largura?: number; pixelRatio?: number; aquecimentos?: number; fundo?: string } = {}): Promise<jsPDF> {
  const larguraFolha = opcoes.largura ?? LARGURA_FOLHA;
  const pixelRatio = opcoes.pixelRatio ?? 2;
  // a captura pinta esta cor por cima do fundo da folha: quem tem fundo próprio passa a mesma cor aqui
  const fundo = opcoes.fundo ?? '#ffffff';
  const pdf = new jsPDF('p', 'mm', 'a4');
  // Safari/iPhone: a primeira captura sai sem as imagens. Uma captura descartável antes aquece o motor.
  if (folhas[0]) {
    for (let k = 0; k < (opcoes.aquecimentos ?? 1); k++) {
      try {
        await toPng(folhas[0], { pixelRatio: 1, backgroundColor: fundo, width: larguraFolha, height: folhas[0].offsetHeight || folhas[0].scrollHeight, style: { transform: 'none', margin: '0', boxShadow: 'none', borderRadius: '0' } });
      } catch { /* o aquecimento é só um reforço */ }
    }
  }
  for (let i = 0; i < folhas.length; i++) {
    const folha = folhas[i];
    const altura = folha.offsetHeight || folha.scrollHeight;
    const dataUrl = await toPng(folha, {
      quality: 0.98,
      pixelRatio,
      backgroundColor: fundo,
      width: larguraFolha,
      height: altura,
      style: { transform: 'none', margin: '0', boxShadow: 'none', borderRadius: '0' },
      filter: (node: HTMLElement) => !(node.classList && node.classList.contains('no-print')),
    });
    let largura = 210;
    let alturaMm = (altura * largura) / larguraFolha;
    if (alturaMm > 297) {
      alturaMm = 297;
      largura = (larguraFolha * alturaMm) / altura;
    }
    if (i > 0) pdf.addPage();
    pdf.addImage(dataUrl, 'PNG', (210 - largura) / 2, 0, largura, alturaMm, undefined, 'FAST');
  }
  return pdf;
}

// Para as fichas que só tinham impressão (High Tip): uma cópia da tela, na largura da folha,
// vira páginas A4 cortadas na altura do A4.
export async function pdfDeElementoLongo(el: HTMLElement): Promise<jsPDF> {
  const caixa = document.createElement('div');
  caixa.style.cssText = `position:fixed;left:-10000px;top:0;width:${LARGURA_FOLHA}px;background:#fff;pointer-events:none;`;
  const copia = el.cloneNode(true) as HTMLElement;
  copia.style.maxWidth = 'none';
  copia.style.width = `${LARGURA_FOLHA}px`;
  copia.style.margin = '0';
  caixa.appendChild(copia);
  document.body.appendChild(caixa);
  let dataUrl = '';
  try {
    await esperarImagens(copia);
    dataUrl = await toPng(copia, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      width: LARGURA_FOLHA,
      height: copia.scrollHeight,
      style: { transform: 'none', margin: '0', boxShadow: 'none' },
      filter: (node: HTMLElement) => !(node.classList && node.classList.contains('no-print')),
    });
  } finally {
    caixa.remove();
  }
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((ok, erro) => { img.onload = () => ok(); img.onerror = () => erro(new Error('imagem')); });
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pxPorPagina = Math.floor((img.width * 297) / 210);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = img.width;
  for (let y = 0, p = 0; y < img.height; y += pxPorPagina, p++) {
    const h = Math.min(pxPorPagina, img.height - y);
    canvas.height = h;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, h);
    ctx.drawImage(img, 0, y, img.width, h, 0, 0, img.width, h);
    if (p > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, (h * 210) / img.width, undefined, 'FAST');
  }
  return pdf;
}

export function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// No celular abre o "compartilhar" com o PDF (escolhe WhatsApp e o contato).
// Sem compartilhamento de arquivo (computador): baixa o PDF e abre o WhatsApp Web.
export async function enviarArquivoPdf(blob: Blob, nome: string, titulo: string) {
  const arquivo = new File([blob], nome, { type: 'application/pdf' });
  const nav: any = typeof navigator !== 'undefined' ? navigator : null;
  if (nav?.canShare && nav.canShare({ files: [arquivo] })) {
    const compartilhar = () => nav.share({ files: [arquivo], title: titulo });
    try {
      await compartilhar();
      return;
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // a pessoa fechou o compartilhar
      // Gerar o PDF demora: alguns aparelhos perdem o "toque" e recusam. Um toque novo resolve.
      toast('Ficha pronta para enviar', {
        description: nome,
        duration: 20000,
        action: {
          label: 'Enviar agora',
          onClick: () => {
            compartilhar().catch((erro: any) => {
              if (erro?.name === 'AbortError') return; // fechou o compartilhar de novo: não baixa
              baixarEAbrirWhatsapp(blob, nome);
            });
          },
        },
      });
      return;
    }
  }
  baixarEAbrirWhatsapp(blob, nome);
}

function baixarEAbrirWhatsapp(blob: Blob, nome: string) {
  baixarBlob(blob, nome);
  // sem 'noopener' no open: com ele o navegador devolve null e não dá para saber se abriu
  const janela = window.open('https://web.whatsapp.com/', '_blank');
  if (janela) { try { janela.opener = null; } catch { /* outra origem */ } }
  toast.success('PDF baixado. Anexe no WhatsApp.', janela ? undefined : {
    action: { label: 'Abrir WhatsApp', onClick: () => window.open('https://web.whatsapp.com/', '_blank', 'noopener') },
  });
}

export async function entregarPdf(pdf: jsPDF, nome: string, modo: 'baixar' | 'enviar', titulo?: string) {
  if (modo === 'enviar') {
    await enviarArquivoPdf(pdf.output('blob'), nome, titulo || nome.replace(/\.pdf$/i, '').replace(/_/g, ' '));
  } else {
    pdf.save(nome);
  }
}
