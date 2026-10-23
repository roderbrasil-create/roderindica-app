// Entrega do PDF do contrato: decisões puras (testáveis) + as duas ações dos botões.
import { nomeArquivoContrato } from './contratoParceria';

export interface AmbienteEntrega {
  ios: boolean;
  /** PWA instalado (tela inicial) */
  standalone: boolean;
  /** navigator.share + canShare({files}) aceitam este arquivo */
  compartilhaArquivo: boolean;
}

/** Botão "Imprimir / PDF".
 *  - iOS instalado (PWA): abrir o PDF numa aba deixa a pessoa presa sem botão de voltar; a folha de
 *    compartilhar tem "Salvar em Arquivos", "Imprimir" e o WhatsApp. Sem ela, cai para abrir.
 *  - iOS no Safari: abrir o PDF em nova aba (visualizador nativo, com compartilhar e imprimir).
 *  - Demais (Android, computador): baixar. */
export function decidirAbrirPdf(a: AmbienteEntrega): 'compartilhar' | 'abrir' | 'baixar' {
  if (a.ios) return a.standalone && a.compartilhaArquivo ? 'compartilhar' : 'abrir';
  return 'baixar';
}

/** Botão "Compartilhar": arquivo pela folha do celular, ou baixar + WhatsApp com texto curto. */
export function decidirCompartilhar(a: Pick<AmbienteEntrega, 'compartilhaArquivo'>): 'arquivo' | 'baixar-e-whatsapp' {
  return a.compartilhaArquivo ? 'arquivo' : 'baixar-e-whatsapp';
}

export const TEXTO_WHATS_PDF_BAIXADO = 'Olá! Baixei o contrato de parceria da Roder em PDF. Vou anexar o arquivo aqui na conversa.';
export const TEXTO_COMPARTILHAR = 'Segue o contrato de parceria comercial da Roder Máquinas e Equipamentos (PDF).';

export function detectarAmbiente(nav: any, win: any, arquivo?: File): AmbienteEntrega {
  const ua = String(nav?.userAgent || '');
  const ios = /iPad|iPhone|iPod/.test(ua) || (nav?.platform === 'MacIntel' && (nav?.maxTouchPoints || 0) > 1);
  const standalone = !!(nav?.standalone || win?.matchMedia?.('(display-mode: standalone)')?.matches);
  let compartilhaArquivo = false;
  try {
    compartilhaArquivo = typeof nav?.share === 'function' && typeof nav?.canShare === 'function' && (arquivo ? !!nav.canShare({ files: [arquivo] }) : true);
  } catch { compartilhaArquivo = false; }
  return { ios, standalone, compartilhaArquivo };
}

// libera o blob depois; unref para não segurar o processo (testes em Node)
function soltarDepois(url: string, ms: number) {
  const t: any = setTimeout(() => URL.revokeObjectURL(url), ms);
  t?.unref?.();
}

export function baixarArquivo(blob: Blob, nome: string, doc: Document = document) {
  const url = URL.createObjectURL(blob);
  const a = doc.createElement('a');
  a.href = url; a.download = nome; a.rel = 'noopener';
  doc.body.appendChild(a); a.click(); a.remove();
  soltarDepois(url, 30000);
}

const ehCancelamento = (e: any) => e?.name === 'AbortError';

export interface Deps { nav: any; win: any; doc: Document }
const padrao = (): Deps => ({ nav: navigator, win: window, doc: document });

/** "Imprimir / PDF". Devolve o que foi feito (para a tela avisar). Deve ser chamado direto do toque. */
export async function abrirPdfContrato(blob: Blob, nomeParceiro: string, d: Deps = padrao()): Promise<'compartilhado' | 'cancelou' | 'aberto' | 'baixado'> {
  const nome = nomeArquivoContrato(nomeParceiro);
  const arquivo = new File([blob], nome, { type: 'application/pdf' });
  const amb = detectarAmbiente(d.nav, d.win, arquivo);
  const modo = decidirAbrirPdf(amb);
  if (modo === 'compartilhar') {
    try { await d.nav.share({ files: [arquivo], title: 'Contrato de Parceria Roder' }); return 'compartilhado'; }
    catch (e) { if (ehCancelamento(e)) return 'cancelou'; /* recusou: tenta abrir */ }
  }
  if (modo === 'compartilhar' || modo === 'abrir') {
    const url = URL.createObjectURL(blob);
    const janela = d.win.open(url, '_blank');
    soltarDepois(url, 120000);
    if (janela) return 'aberto';
  }
  baixarArquivo(blob, nome, d.doc);
  return 'baixado';
}

/** "Compartilhar": PDF pela folha do celular; sem isso, baixa e abre o WhatsApp com aviso curto. */
export async function compartilharPdfContrato(blob: Blob, nomeParceiro: string, d: Deps = padrao()): Promise<'compartilhado' | 'cancelou' | 'baixado-whatsapp'> {
  const nome = nomeArquivoContrato(nomeParceiro);
  const arquivo = new File([blob], nome, { type: 'application/pdf' });
  const amb = detectarAmbiente(d.nav, d.win, arquivo);
  if (decidirCompartilhar(amb) === 'arquivo') {
    try {
      await d.nav.share({ files: [arquivo], title: 'Contrato de Parceria Roder', text: TEXTO_COMPARTILHAR });
      return 'compartilhado';
    } catch (e) {
      if (ehCancelamento(e)) return 'cancelou';
      // recusou por outro motivo (ex.: gesto perdido): cai para baixar + WhatsApp
    }
  }
  baixarArquivo(blob, nome, d.doc);
  d.win.open(`https://wa.me/?text=${encodeURIComponent(TEXTO_WHATS_PDF_BAIXADO)}`, '_blank');
  return 'baixado-whatsapp';
}
