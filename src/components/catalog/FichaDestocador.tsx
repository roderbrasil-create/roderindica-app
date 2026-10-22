import React, { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck, Download, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useVoltarFecha } from '../../lib/useVoltarFecha';
import { ZoomRolagem } from '../documento/ZoomRolagem';
import { baixarBlob, enviarArquivoPdf, usePodeEnviarFicha } from './fichaPdf';
import { NOME_ARQUIVO_FICHA_DESTOCADOR, PAGINAS_FICHA_DESTOCADOR, PDF_FICHA_DESTOCADOR, TITULO_FICHA_DESTOCADOR } from '../../lib/fichaDestocador';

// Ficha Destocador DTH-240B: 1 página A4 pronta (imagens) com o PDF aprovado. Sem Firestore, sem montar nada em React.
let pdfEmMemoria: Promise<Blob> | null = null;
// O PDF (1 MB) é buscado uma vez e guardado: o "compartilhar" do iPhone só abre dentro do toque, então o arquivo precisa estar pronto
export function pdfFichaDestocador(): Promise<Blob> {
  if (!pdfEmMemoria) {
    pdfEmMemoria = fetch(PDF_FICHA_DESTOCADOR)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
      .then(b => new Blob([b], { type: 'application/pdf' }))
      .catch(e => { pdfEmMemoria = null; throw e; });
  }
  return pdfEmMemoria;
}

export async function baixarFichaDestocador() {
  try { baixarBlob(await pdfFichaDestocador(), NOME_ARQUIVO_FICHA_DESTOCADOR); toast.success('PDF baixado.'); }
  catch { toast.error('Não consegui baixar o PDF. Tente de novo.'); }
}

// "Enviar ficha" de fora da tela e o botão Compartilhar: abre o compartilhar do sistema com o PDF (ou baixa e abre o WhatsApp Web)
export async function compartilharFichaDestocador() {
  try { await enviarArquivoPdf(await pdfFichaDestocador(), NOME_ARQUIVO_FICHA_DESTOCADOR, TITULO_FICHA_DESTOCADOR); }
  catch { toast.error('Não consegui preparar o PDF. Tente de novo.'); }
}

interface Props {
  onClose: () => void;
  // aberta pelo "Enviar ficha": destaca o botão Compartilhar
  enviar?: boolean;
}

export function FichaDestocador({ onClose, enviar = false }: Props) {
  useVoltarFecha(true, onClose);
  const podeEnviar = usePodeEnviarFicha();
  const [ocupado, setOcupado] = useState<null | 'baixar' | 'enviar'>(null);
  const ativo = useRef(true);

  useEffect(() => {
    ativo.current = true;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (podeEnviar) pdfFichaDestocador().catch(() => {}); // deixa o PDF pronto para o toque em Compartilhar
    return () => { ativo.current = false; document.body.style.overflow = original; };
  }, [podeEnviar]);

  const acao = async (modo: 'baixar' | 'enviar') => {
    if (ocupado) return;
    setOcupado(modo);
    try { await (modo === 'baixar' ? baixarFichaDestocador() : compartilharFichaDestocador()); }
    finally { if (ativo.current) setOcupado(null); }
  };

  return (
    <div data-ficha-destocador="dth240b" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)' }} className="fixed inset-0 z-[99999] overflow-hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-card text-card-foreground w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col h-[96vh]">
        <div className="bg-muted px-3 sm:px-6 py-3 flex items-center justify-between gap-2 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-lg bg-amber-400/15 text-amber-600 shrink-0"><ShieldCheck className="h-5 w-5" /></span>
            <span className="font-extrabold text-sm tracking-tight text-foreground truncate">{TITULO_FICHA_DESTOCADOR}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {podeEnviar && (
              <>
                <button
                  onClick={() => acao('baixar')}
                  disabled={!!ocupado}
                  className="flex items-center gap-1.5 h-11 min-h-[44px] min-w-[44px] px-3 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-black text-xs disabled:opacity-60"
                >
                  {ocupado === 'baixar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Baixar PDF</span>
                </button>
                <button
                  onClick={() => acao('enviar')}
                  disabled={!!ocupado}
                  className={`flex items-center gap-1.5 h-11 min-h-[44px] px-3 rounded-lg bg-[#1FA855] hover:bg-[#178a45] text-white font-black text-xs disabled:opacity-60 ${enviar ? 'ring-2 ring-offset-2 ring-[#1FA855] animate-pulse' : ''}`}
                >
                  {ocupado === 'enviar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Compartilhar
                </button>
              </>
            )}
            <button onClick={onClose} aria-label="Fechar" className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 shrink-0 flex items-center justify-center rounded-lg hover:bg-muted-foreground/10 text-muted-foreground">
              <X className="h-5 w-5 shrink-0" />
            </button>
          </div>
        </div>

        <ZoomRolagem
          className="flex-1 min-h-0 bg-neutral-100"
          interiorClassName="p-2 sm:p-6 flex flex-col items-center gap-3 sm:gap-5"
          reiniciarCom="destocador-dth240b"
        >
          {PAGINAS_FICHA_DESTOCADOR.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`${TITULO_FICHA_DESTOCADOR}, página ${i + 1} de ${PAGINAS_FICHA_DESTOCADOR.length}`}
              width={1588}
              height={2246}
              decoding="async"
              draggable={false}
              className="w-full max-w-[794px] h-auto bg-white shadow-md select-none"
            />
          ))}
        </ZoomRolagem>
      </div>
    </div>
  );
}
