import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Minus, Plus, ExternalLink } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { getApiBaseUrl } from '../../lib/utils';
import { ouvirDocumentos, PedidoDocumento } from '../../lib/abrirDocumento';
import { useVoltarFecha } from '../../lib/useVoltarFecha';

// Leitor de PDF dentro do app, com "Voltar" sempre visível no alto.
// Desenha as páginas com o pdf.js: o leitor nativo do iPhone dentro de um quadro
// mostra só a primeira página, e abrir fora do app deixava a pessoa presa.

async function baixarBytes(url: string): Promise<ArrayBuffer> {
  const mesmaOrigem = url.startsWith('/') || url.startsWith(window.location.origin);
  if (url.startsWith('blob:') || url.startsWith('data:') || mesmaOrigem) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('Documento não encontrado');
    return r.arrayBuffer();
  }
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Entre no app para abrir este documento');
  const r = await fetch(`${getApiBaseUrl()}/api/documento?url=${encodeURIComponent(url)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error((await r.text()) || 'Não consegui abrir o documento');
  return r.arrayBuffer();
}

export default function LeitorDocumento() {
  const [pedido, setPedido] = useState<PedidoDocumento | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [erro, setErro] = useState('');
  const [zoom, setZoom] = useState(1);
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const paginasRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);

  useEffect(() => ouvirDocumentos(p => { setPedido(p); setZoom(1); }), []);

  const fechar = () => setPedido(null);
  useVoltarFecha(!!pedido, fechar);

  // Carrega o arquivo
  useEffect(() => {
    if (!pedido) return;
    let cancelado = false;
    setEstado('carregando');
    setErro('');
    setBytes(null);
    (async () => {
      try {
        const dados = await baixarBytes(pedido.url);
        if (cancelado) return;
        // pdf.js 4.10 servido de /pdfjs (fora do pacote principal, só baixa quando abre um documento).
        // Ajuste local: sombreado que o pdf.js não sabe desenhar saía rosa-choque (era o fundo
        // das fichas Roder); agora fica transparente, como o fundo branco da ficha.
        const caminho = `${window.location.origin}/pdfjs/pdf.min.mjs`;
        const pdfjs: any = await import(/* @vite-ignore */ caminho);
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        // o pdf.js consome o buffer: guarda uma cópia para o botão de baixar
        setBytes(dados.slice(0));
        const docPdf = await pdfjs.getDocument({ data: new Uint8Array(dados) }).promise;
        if (cancelado) return;
        docRef.current = docPdf;
        setEstado('pronto');
      } catch (e: any) {
        if (cancelado) return;
        setErro(e?.message || 'Não consegui abrir o documento');
        setEstado('erro');
      }
    })();
    return () => { cancelado = true; };
  }, [pedido]);

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

  const nomeArquivo = `${(pedido.titulo || 'documento').replace(/[^\w\- ]+/g, '').trim() || 'documento'}.pdf`;
  const baixar = async () => {
    if (!bytes) return;
    const arquivo = new File([bytes], nomeArquivo, { type: 'application/pdf' });
    const nav: any = navigator;
    if (nav.canShare && nav.canShare({ files: [arquivo] })) {
      try { await nav.share({ files: [arquivo], title: pedido.titulo || 'Documento' }); return; } catch { /* cancelou */ }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(arquivo);
    a.download = nomeArquivo;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-200 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <header className="bg-white border-b border-slate-200 shadow-sm flex items-center gap-2 px-2 h-14 shrink-0">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="h-11 px-3 rounded-lg bg-slate-900 text-white font-bold text-sm flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" /> Voltar
        </button>
        <p className="flex-1 min-w-0 truncate font-bold text-sm text-slate-800">{pedido.titulo || 'Documento'}</p>
        {estado === 'pronto' && (
          <>
            <button type="button" aria-label="Diminuir" onClick={() => setZoom(z => Math.max(1, +(z - 0.5).toFixed(1)))} className="h-11 w-11 rounded-lg border border-slate-300 text-slate-800 flex items-center justify-center shrink-0"><Minus className="h-4 w-4" /></button>
            <button type="button" aria-label="Aumentar" onClick={() => setZoom(z => Math.min(3, +(z + 0.5).toFixed(1)))} className="h-11 w-11 rounded-lg border border-slate-300 text-slate-800 flex items-center justify-center shrink-0"><Plus className="h-4 w-4" /></button>
            <button type="button" aria-label="Baixar ou compartilhar" onClick={baixar} className="h-11 w-11 rounded-lg border border-slate-300 text-slate-800 flex items-center justify-center shrink-0"><Download className="h-4 w-4" /></button>
          </>
        )}
      </header>
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
              onClick={() => window.open(pedido.url, '_blank', 'noopener,noreferrer')}
              className="h-11 px-4 rounded-lg border border-slate-300 bg-white font-bold text-sm flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" /> Abrir no navegador
            </button>
          </div>
        )}
        <div ref={paginasRef} className={estado === 'pronto' ? '' : 'hidden'} />
      </div>
    </div>
  );
}
