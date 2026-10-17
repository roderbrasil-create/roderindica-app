import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Minus, Plus, ExternalLink } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { getApiBaseUrl } from '../../lib/utils';
import { ouvirDocumentos, PedidoDocumento, instalarInterceptor, abrirForaDoApp, idYoutube, idVimeo, idDrive } from '../../lib/abrirDocumento';
import { useVoltarFecha } from '../../lib/useVoltarFecha';

// Leitor de PDF, foto e vídeo dentro do app, com "Voltar" sempre visível no alto.
// Desenha os PDFs com o pdf.js: o leitor nativo do iPhone dentro de um quadro mostra
// só a primeira página, e abrir fora do app deixava a pessoa presa.

type Arquivo = { dados: ArrayBuffer; tipo: string };

// Fichas e PDFs abertos ficam guardados no celular, para abrir sem internet
const CACHE_FICHAS = 'roder-fichas';
const chaveCache = (url: string) => new URL(`/__ficha__/${encodeURIComponent(url)}`, window.location.origin).toString();

async function baixarDaRede(url: string): Promise<Response> {
  const mesmaOrigem = url.startsWith('/') || url.startsWith(window.location.origin);
  if (url.startsWith('blob:') || url.startsWith('data:') || mesmaOrigem) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('Documento não encontrado.');
    return r;
  }
  // Fichas do site da Roder abrem sem login (cliente na tela de orçamento); o servidor decide
  const token = await auth.currentUser?.getIdToken().catch(() => '');
  const r = await fetch(`${getApiBaseUrl()}/api/documento?url=${encodeURIComponent(url)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!r.ok) throw new Error((await r.text()) || 'Não consegui abrir o documento.');
  return r;
}

async function baixarArquivo(url: string): Promise<Arquivo> {
  const podeGuardar = typeof caches !== 'undefined' && !url.startsWith('blob:') && !url.startsWith('data:');
  try {
    const r = await baixarDaRede(url);
    const dados = await r.arrayBuffer();
    const tipo = r.headers.get('content-type') || '';
    if (podeGuardar) {
      caches.open(CACHE_FICHAS).then(c => c.put(chaveCache(url), new Response(dados.slice(0), { headers: { 'Content-Type': tipo } }))).catch(() => {});
    }
    return { dados, tipo };
  } catch (e) {
    if (podeGuardar) {
      const salvo = await caches.open(CACHE_FICHAS).then(c => c.match(chaveCache(url))).catch(() => undefined);
      if (salvo) return { dados: await salvo.arrayBuffer(), tipo: salvo.headers.get('content-type') || '' };
    }
    if (navigator.onLine === false) throw new Error('Não tem internet e esta ficha ainda não foi baixada no celular.');
    throw e;
  }
}

// Usado pelo "Baixar conteúdo offline": guarda a ficha sem abrir a tela
export async function guardarDocumentoOffline(url: string): Promise<boolean> {
  if (!url || typeof caches === 'undefined' || /drive\.google\.com|youtube|youtu\.be|vimeo/.test(url) || url.startsWith('db-file://')) return false;
  try {
    const c = await caches.open(CACHE_FICHAS);
    if (await c.match(chaveCache(url))) return true;
    await baixarArquivo(url);
    return true;
  } catch { return false; }
}

const comecaCom = (buf: ArrayBuffer, txt: string) =>
  new TextDecoder('latin1').decode(new Uint8Array(buf, 0, Math.min(buf.byteLength, 1024))).includes(txt);

function tipoImagem(buf: ArrayBuffer, tipo: string) {
  const b = new Uint8Array(buf, 0, Math.min(buf.byteLength, 12));
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57) return 'image/webp';
  if (b[0] === 0x47 && b[1] === 0x49) return 'image/gif';
  return tipo.startsWith('image/') ? tipo : '';
}

export default function LeitorDocumento() {
  const [pedido, setPedido] = useState<PedidoDocumento | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [erro, setErro] = useState('');
  const [zoom, setZoom] = useState(1);
  const [arquivo, setArquivo] = useState<Arquivo | null>(null);
  const [imagemUrl, setImagemUrl] = useState('');
  // Link do Drive: tenta ler como PDF/foto; se não for (vídeo, planilha), usa a prévia do Drive
  const [drivePrevia, setDrivePrevia] = useState(false);
  const paginasRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);

  useEffect(() => {
    instalarInterceptor();
    return ouvirDocumentos(p => {
      // Vídeo do YouTube/Vimeo/Drive não abre sem internet: só avisa
      if (p.tipo !== 'pdf' && p.tipo !== 'video' && navigator.onLine === false) {
        window.dispatchEvent(new CustomEvent('roder:sem-internet', { detail: 'Não tem internet. O vídeo precisa de conexão.' }));
        return;
      }
      setPedido(p); setZoom(1);
    });
  }, []);

  const limpar = () => {
    try { docRef.current?.destroy?.(); } catch { /* já liberado */ }
    docRef.current = null;
    setArquivo(null);
    setImagemUrl('');
    setDrivePrevia(false);
    setEstado('carregando');
  };
  // Ao fechar, solta o PDF da memória (no iPhone, vários PDFs abertos recarregavam o app)
  const fechar = () => { limpar(); setPedido(null); };
  useVoltarFecha(!!pedido, fechar);

  const ehPlayer = !!pedido && (pedido.tipo === 'video' || pedido.tipo === 'youtube' || pedido.tipo === 'vimeo' || (pedido.tipo === 'drive' && drivePrevia));

  // Carrega o arquivo (PDF ou foto)
  useEffect(() => {
    if (!pedido) return;
    limpar();
    setErro('');
    if (pedido.tipo !== 'pdf' && pedido.tipo !== 'drive') return;
    let cancelado = false;
    (async () => {
      try {
        let arq: Arquivo;
        try {
          arq = await baixarArquivo(pedido.url);
        } catch (e) {
          if (pedido.tipo === 'drive') { if (!cancelado) setDrivePrevia(true); return; }
          throw e;
        }
        if (cancelado) return;
        const img = tipoImagem(arq.dados, arq.tipo);
        if (img) {
          setArquivo({ dados: arq.dados, tipo: img });
          setImagemUrl(URL.createObjectURL(new Blob([arq.dados], { type: img })));
          setEstado('pronto');
          return;
        }
        if (!comecaCom(arq.dados, '%PDF-') && pedido.tipo === 'drive') { setDrivePrevia(true); return; }
        if (!comecaCom(arq.dados, '%PDF-')) {
          throw new Error(comecaCom(arq.dados, '<html') || comecaCom(arq.dados, '<!DOCTYPE') || comecaCom(arq.dados, '<!doctype')
            ? 'Este documento não foi encontrado no endereço cadastrado.'
            : 'Este arquivo não é um PDF que o app consiga mostrar.');
        }
        // pdf.js 4.10 servido de /pdfjs (fora do pacote principal, só baixa quando abre um documento).
        // Ajuste local: sombreado que o pdf.js não sabe desenhar saía rosa-choque (era o fundo
        // das fichas Roder); agora fica transparente, como o fundo branco da ficha.
        const caminho = `${window.location.origin}/pdfjs/pdf.min.mjs`;
        const pdfjs: any = await import(/* @vite-ignore */ caminho);
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        // o pdf.js consome o buffer: guarda uma cópia para o botão de baixar
        setArquivo({ dados: arq.dados.slice(0), tipo: 'application/pdf' });
        const docPdf = await pdfjs.getDocument({ data: new Uint8Array(arq.dados) }).promise;
        if (cancelado) return;
        docRef.current = docPdf;
        setEstado('pronto');
      } catch (e: any) {
        if (cancelado) return;
        const msg = String(e?.message || '');
        setErro(/[a-z]/i.test(msg) && !/invalid|structure|failed|fetch/i.test(msg) ? msg : 'Não consegui abrir este documento.');
        setEstado('erro');
      }
    })();
    return () => { cancelado = true; };
  }, [pedido]);

  useEffect(() => () => { if (imagemUrl) URL.revokeObjectURL(imagemUrl); }, [imagemUrl]);

  // Desenha as páginas (e redesenha quando muda o zoom)
  useEffect(() => {
    if (estado !== 'pronto' || !docRef.current || !paginasRef.current) return;
    let cancelado = false;
    const alvo = paginasRef.current;
    alvo.innerHTML = '';
    (async () => {
      const docPdf = docRef.current;
      const largura = Math.min(alvo.clientWidth || window.innerWidth, 1000) * zoom;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (let n = 1; n <= docPdf.numPages; n++) {
        if (cancelado) return;
        const pagina = await docPdf.getPage(n);
        const base = pagina.getViewport({ scale: 1 });
        const escala = largura / base.width;
        const vp = pagina.getViewport({ scale: escala * dpr });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        canvas.style.width = `${Math.floor(largura)}px`;
        canvas.style.height = `${Math.floor(vp.height / dpr)}px`;
        canvas.className = 'block mx-auto bg-white shadow-md mb-3';
        alvo.appendChild(canvas);
        await pagina.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
      }
    })();
    return () => { cancelado = true; };
  }, [estado, zoom]);

  useEffect(() => {
    if (!pedido) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = antes; };
  }, [pedido]);

  if (!pedido) return null;

  const ehPdfPronto = estado === 'pronto' && !!docRef.current;
  const extensao = arquivo?.tipo === 'application/pdf' ? 'pdf' : (arquivo?.tipo.split('/')[1] || 'pdf').replace('jpeg', 'jpg');
  const nomeArquivo = `${(pedido.titulo || 'documento').replace(/[^\w\- ]+/g, '').trim() || 'documento'}.${extensao}`;
  const baixar = async () => {
    if (!arquivo) return;
    const f = new File([arquivo.dados], nomeArquivo, { type: arquivo.tipo });
    const nav: any = navigator;
    if (nav.canShare && nav.canShare({ files: [f] })) {
      try { await nav.share({ files: [f], title: pedido.titulo || 'Documento' }); return; } catch { /* cancelou */ }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f);
    a.download = nomeArquivo;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  let player: React.ReactNode = null;
  if (pedido.tipo === 'video') {
    player = <video src={pedido.url} controls autoPlay playsInline className="w-full max-h-full bg-black" />;
  } else if (pedido.tipo === 'youtube' || pedido.tipo === 'vimeo' || (pedido.tipo === 'drive' && drivePrevia)) {
    const src = pedido.tipo === 'youtube'
      ? `https://www.youtube.com/embed/${idYoutube(pedido.url)}?autoplay=1&playsinline=1&rel=0`
      : pedido.tipo === 'vimeo'
        ? `https://player.vimeo.com/video/${idVimeo(pedido.url)}?autoplay=1`
        : `https://drive.google.com/file/d/${idDrive(pedido.url)}/preview`;
    player = (
      <iframe
        src={src}
        title={pedido.titulo || 'Vídeo'}
        className={pedido.tipo === 'drive' ? 'w-full h-full bg-white' : 'w-full aspect-video bg-black'}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div className={`fixed inset-0 z-[2147483000] flex flex-col ${ehPlayer ? 'bg-black' : 'bg-slate-200'}`} style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <header className="bg-white border-b border-slate-200 shadow-sm flex items-center gap-2 px-2 h-14 shrink-0">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="h-11 px-3 rounded-lg bg-slate-900 text-white font-bold text-sm flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" /> Voltar
        </button>
        <p className="flex-1 min-w-0 truncate font-bold text-sm text-slate-800">{pedido.titulo || (ehPlayer ? 'Vídeo' : 'Documento')}</p>
        {ehPdfPronto && (
          <>
            <button type="button" aria-label="Diminuir" onClick={() => setZoom(z => Math.max(1, +(z - 0.5).toFixed(1)))} className="h-11 w-11 rounded-lg border border-slate-300 text-slate-800 flex items-center justify-center shrink-0"><Minus className="h-4 w-4" /></button>
            <button type="button" aria-label="Aumentar" onClick={() => setZoom(z => Math.min(3, +(z + 0.5).toFixed(1)))} className="h-11 w-11 rounded-lg border border-slate-300 text-slate-800 flex items-center justify-center shrink-0"><Plus className="h-4 w-4" /></button>
          </>
        )}
        {ehPlayer && (
          <button type="button" aria-label="Abrir no navegador" onClick={() => abrirForaDoApp(pedido.url)} className="h-11 w-11 rounded-lg border border-slate-300 text-slate-800 flex items-center justify-center shrink-0"><ExternalLink className="h-4 w-4" /></button>
        )}
        {estado === 'pronto' && arquivo && !ehPlayer && (
          <button type="button" aria-label="Baixar ou compartilhar" onClick={baixar} className="h-11 w-11 rounded-lg border border-slate-300 text-slate-800 flex items-center justify-center shrink-0"><Download className="h-4 w-4" /></button>
        )}
      </header>

      {ehPlayer ? (
        <div className="flex-1 flex items-center justify-center overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {player}
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-2 md:p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
          {estado === 'carregando' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600" />
              <p className="text-sm font-medium">Abrindo documento...</p>
            </div>
          )}
          {estado === 'erro' && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-6">
              <p className="text-sm font-semibold text-slate-700">{erro}</p>
              <button
                type="button"
                onClick={() => abrirForaDoApp(pedido.url)}
                className="h-11 px-4 rounded-lg border border-slate-300 bg-white font-bold text-sm flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" /> Abrir no navegador
              </button>
            </div>
          )}
          {estado === 'pronto' && imagemUrl && (
            <img src={imagemUrl} alt={pedido.titulo || ''} className="block mx-auto max-w-full bg-white shadow-md" style={{ width: `${zoom * 100}%`, maxWidth: zoom > 1 ? 'none' : '100%' }} />
          )}
          <div ref={paginasRef} className={ehPdfPronto ? '' : 'hidden'} />
        </div>
      )}
    </div>
  );
}
