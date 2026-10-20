import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Expand, Loader2, Play, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { cn, getApiBaseUrl } from '../../lib/utils';
import { abrirDocumento } from '../../lib/abrirDocumento';
import { comoTocar, textoVideoWhats, LIMITE_VIDEO_ARQUIVO_MB } from '../../lib/videoEquipamento';

// Vídeo do equipamento tocando DENTRO do cartão (pedido do Jeferson em 19/10/2026).
// Nada toca sozinho: o carrossel mostra a foto e o botão "Ver vídeo"; o player só é montado
// depois do toque, para não gastar o 4G de quem está no campo.

// Quem pode mandar o vídeo para o cliente: o parceiro (pelo link pessoal ou logado) e a equipe
// que indica. Sem este contexto (visitante, página pública) o vídeo toca e não há envio.
export type PermissaoVideo = { podeCompartilhar: boolean; token?: string };
export const ContextoVideo = createContext<PermissaoVideo | null>(null);

export function BotaoVerVideo({ onClick, compacto = false, className }: { onClick: () => void; compacto?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn('inline-flex w-auto items-center gap-1 rounded-full bg-[rgba(27,30,34,0.88)] text-[#fff] font-extrabold leading-none active:scale-95 transition',
        compacto ? 'h-7 px-2.5 text-[11.5px]' : 'h-9 px-3 text-[13px]', className)}
    >
      <Play className={cn('fill-[#F6C400] text-[#F6C400]', compacto ? 'h-3 w-3' : 'h-3.5 w-3.5')} /> Ver vídeo
    </button>
  );
}

// Arquivo guardado no banco (db-file://id) vira um endereço que o <video> sabe tocar
const CACHE_DB = new Map<string, string>();
function useFonte(src: string): { fonte: string; erro: boolean } {
  const doBanco = src.startsWith('db-file://');
  const [fonte, setFonte] = useState(() => doBanco ? (CACHE_DB.get(src.slice(10)) || '') : src);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    if (!doBanco) { setFonte(src); return; }
    const id = src.slice(10);
    if (CACHE_DB.has(id)) { setFonte(CACHE_DB.get(id)!); return; }
    let vivo = true;
    getDoc(doc(db, 'app_files', id)).then(s => {
      const d = String((s.exists() && (s.data() as any)?.data) || '');
      if (!vivo) return;
      if (/^data:video\//.test(d)) { CACHE_DB.set(id, d); setFonte(d); } else setErro(true);
    }).catch(() => { if (vivo) setErro(true); });
    return () => { vivo = false; };
  }, [src]);
  return { fonte, erro };
}

// o mesmo parceiro abrindo o mesmo vídeo várias vezes não pede outro link ao servidor
const CACHE_LINK = new Map<string, string>();

export function AcoesVideo({ pid, mid, titulo, url, compacto }: { pid?: string; mid?: string; titulo: string; url: string; compacto: boolean }) {
  const perm = useContext(ContextoVideo);
  const chave = `${perm?.token || 'login'}:${pid}:${mid || ''}`;
  const [link, setLink] = useState(() => CACHE_LINK.get(chave) || '');
  const [estado, setEstado] = useState<'gerando' | 'pronto' | 'erro'>(() => CACHE_LINK.has(chave) ? 'pronto' : 'gerando');
  const [baixado, setBaixado] = useState<File | null>(null);
  const [baixando, setBaixando] = useState(false);
  const como = comoTocar(url);
  const arquivo = como?.tipo === 'arquivo';
  const ativo = !!perm?.podeCompartilhar && !!pid;

  const gerar = async () => {
    setEstado('gerando');
    try {
      const r = await fetch(`${getApiBaseUrl()}/api/consultor/link-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p: perm?.token || undefined, pid, mid: mid || '' }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.codigo) throw new Error(j.error || 'erro');
      const l = `${window.location.origin}/o/${j.codigo}`;
      CACHE_LINK.set(chave, l);
      setLink(l);
      setEstado('pronto');
    } catch {
      setEstado('erro');
    }
  };
  // o link nasce assim que o vídeo abre: o botão do WhatsApp já fica pronto para o toque
  // (abrir o WhatsApp depois de esperar o servidor é bloqueado em alguns celulares)
  useEffect(() => { if (ativo && !CACHE_LINK.has(chave)) gerar(); }, [ativo, chave]);

  // o celular só mostra a opção "Enviar o vídeo" se ele consegue mandar arquivo de vídeo
  const [mandaArquivo] = useState(() => {
    try {
      const nav: any = typeof navigator !== 'undefined' ? navigator : null;
      return !!nav?.canShare && nav.canShare({ files: [new File([new Blob([''], { type: 'video/mp4' })], 'video.mp4', { type: 'video/mp4' })] });
    } catch { return false; }
  });

  if (!ativo) return null;
  const texto = textoVideoWhats(titulo, link);

  const baixar = async () => {
    if (baixando) return;
    const id = `video-${pid}-${mid}`;
    setBaixando(true);
    const cap = LIMITE_VIDEO_ARQUIVO_MB * 1024 * 1024;
    const grande = () => toast.info(`Vídeo grande demais para mandar como arquivo (mais de ${LIMITE_VIDEO_ARQUIVO_MB} MB). Use "Enviar no WhatsApp", que manda o link.`, { id });
    try {
      let blob: Blob;
      if (url.startsWith('db-file://')) {
        toast.loading('Preparando o vídeo...', { id });
        const s = await getDoc(doc(db, 'app_files', url.slice(10)));
        const d = String((s.exists() && (s.data() as any)?.data) || '');
        blob = await (await fetch(d)).blob();
      } else {
        toast.loading('Baixando o vídeo 0%', { id });
        const r = await fetch(url);
        if (!r.ok || !r.body) throw new Error('falhou');
        const total = Number(r.headers.get('content-length') || 0);
        if (total > cap) { await r.body.cancel().catch(() => {}); grande(); return; }
        const leitor = r.body.getReader();
        const partes: Uint8Array[] = [];
        let lido = 0;
        for (;;) {
          const { done, value } = await leitor.read();
          if (done) break;
          lido += value.length;
          if (lido > cap) { await leitor.cancel().catch(() => {}); grande(); return; }
          partes.push(value);
          if (total) toast.loading(`Baixando o vídeo ${Math.round((lido / total) * 100)}%`, { id });
          else toast.loading(`Baixando o vídeo ${(lido / 1024 / 1024).toFixed(1)} MB`, { id });
        }
        blob = new Blob(partes as BlobPart[], { type: r.headers.get('content-type') || 'video/mp4' });
      }
      if (blob.size > cap) { grande(); return; }
      const tipo = /^video\//.test(blob.type) ? blob.type : 'video/mp4';
      const ext = tipo.includes('webm') ? 'webm' : tipo.includes('quicktime') ? 'mov' : 'mp4';
      const nome = `${titulo.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'video-roder'}.${ext}`;
      const f = new File([blob], nome, { type: tipo });
      const nav: any = navigator;
      if (!nav.canShare || !nav.canShare({ files: [f] })) { toast.info('Este celular não manda vídeo por aqui. Use "Enviar no WhatsApp".', { id }); return; }
      setBaixado(f);
      toast.success('Vídeo pronto. Toque em "Enviar agora".', { id });
    } catch {
      toast.error('Não consegui baixar o vídeo. Use "Enviar no WhatsApp", que manda o link.', { id });
    } finally {
      setBaixando(false);
    }
  };

  // O compartilhamento precisa de um toque recente: depois de baixar, um segundo toque manda.
  // Alguns celulares (e o WhatsApp em alguns Android) descartam o texto quando vai um arquivo
  // junto; por isso o "Enviar no WhatsApp" com o link continua sendo o caminho principal.
  const mandar = async () => {
    if (!baixado) return;
    try {
      await (navigator as any).share({ files: [baixado], text: link ? texto : undefined });
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error('Não consegui abrir o envio. Use "Enviar no WhatsApp".');
    }
  };

  const alto = compacto ? 'h-9 text-[12.5px] rounded-[10px]' : 'h-11 text-[14px] rounded-xl';
  return (
    <div className={cn('flex flex-col gap-1.5', compacto ? 'pt-1.5' : 'pt-2')}>
      {estado === 'pronto' ? (
        <a
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('w-full flex items-center justify-center gap-1.5 bg-[#1FA855] text-[#fff] font-extrabold no-underline active:scale-[0.98] transition', alto)}
        >
          <Send className="h-4 w-4 shrink-0" /> Enviar no WhatsApp
        </a>
      ) : (
        <button
          type="button"
          onClick={estado === 'erro' ? gerar : undefined}
          disabled={estado === 'gerando'}
          className={cn('w-full flex items-center justify-center gap-1.5 bg-[#1FA855] text-[#fff] font-extrabold disabled:opacity-70', alto)}
        >
          {estado === 'gerando' ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparando o link...</> : 'Não gerou o link. Tentar de novo'}
        </button>
      )}
      {arquivo && mandaArquivo && (
        <button
          type="button"
          onClick={baixado ? mandar : baixar}
          disabled={baixando}
          className={cn('w-full flex items-center justify-center gap-1.5 border-[1.5px] border-[#1B1E22] bg-white text-[#1B1E22] font-extrabold disabled:opacity-60 active:scale-[0.98] transition', alto)}
        >
          {baixando ? <><Loader2 className="h-4 w-4 animate-spin" /> Baixando...</> : baixado ? 'Enviar agora' : 'Enviar o vídeo'}
        </button>
      )}
    </div>
  );
}

// Player no lugar da foto, com fechar (volta para a foto) e tela cheia
export function PlayerVideo({ url, titulo, onFechar, pid, mid, compacto = false, comAcoes = true, className }: {
  url: string;
  titulo: string;
  onFechar: () => void;
  pid?: string;
  mid?: string;
  compacto?: boolean;
  comAcoes?: boolean;
  className?: string;
}) {
  const como = comoTocar(url);
  const caixa = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const { fonte, erro: erroBanco } = useFonte(como?.tipo === 'arquivo' ? como.src : '');
  const [falhou, setFalhou] = useState(false);

  const docAny: any = typeof document !== 'undefined' ? document : null;
  // iPhone não põe um <div> em tela cheia: lá o vídeo de arquivo usa a tela cheia própria dele,
  // e o YouTube o botão do próprio player (allowFullScreen)
  const temTelaCheia = !!(docAny?.fullscreenEnabled || docAny?.webkitFullscreenEnabled) || como?.tipo === 'arquivo';
  const telaCheia = () => {
    const el: any = caixa.current;
    const v: any = video.current;
    const doVideo = () => { try { v?.webkitEnterFullscreen?.(); } catch { /* nada */ } };
    if (el?.requestFullscreen && docAny?.fullscreenEnabled) { el.requestFullscreen().catch(doVideo); return; }
    if (el?.webkitRequestFullscreen && docAny?.webkitFullscreenEnabled) { el.webkitRequestFullscreen(); return; }
    doVideo();
  };
  const fechar = () => {
    try { if (docAny?.fullscreenElement) docAny.exitFullscreen?.(); } catch { /* nada */ }
    onFechar();
  };

  if (!como) return null;
  const naoToca = falhou || erroBanco;
  const botao = 'absolute top-1.5 z-10 h-9 w-9 rounded-full bg-[rgba(0,0,0,0.62)] text-[#fff] flex items-center justify-center p-0 active:scale-95';
  return (
    <div className={className}>
      <div ref={caixa} className="relative w-full aspect-video bg-[#000] overflow-hidden [&:fullscreen]:aspect-auto">
        {naoToca ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
            <p className="m-0 text-[13px] text-[#E5E7EB]">Não consegui tocar o vídeo aqui.</p>
            <button type="button" onClick={() => abrirDocumento(url, titulo)} className="h-9 w-auto px-3.5 rounded-full bg-[#F6C400] text-[#1B1E22] text-[13px] font-extrabold">Abrir o vídeo</button>
          </div>
        ) : como.tipo === 'iframe' ? (
          <iframe
            src={como.src}
            title={`Vídeo ${titulo}`}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : fonte ? (
          <video
            ref={video}
            src={fonte}
            controls
            playsInline
            autoPlay
            preload="auto"
            onError={() => setFalhou(true)}
            className="absolute inset-0 h-full w-full object-contain bg-[#000]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#fff]" /></div>
        )}
        {temTelaCheia && !naoToca && (
          <button type="button" onClick={telaCheia} aria-label="Tela cheia" title="Tela cheia" className={cn(botao, 'left-1.5')}>
            <Expand className="h-4 w-4" />
          </button>
        )}
        <button type="button" onClick={fechar} aria-label="Fechar o vídeo" title="Fechar o vídeo" className={cn(botao, 'right-1.5')}>
          <X className="h-5 w-5" />
        </button>
      </div>
      {comAcoes && <AcoesVideo pid={pid} mid={mid} titulo={titulo} url={url} compacto={compacto} />}
    </div>
  );
}
