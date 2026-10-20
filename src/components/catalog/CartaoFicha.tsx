import React, { useState } from 'react';
import { PlayerVideo } from '../video/VideoEquipamento';
import { FileText, Send, CheckCircle, Video } from 'lucide-react';

interface CartaoFichaProps {
  titulo: string;
  imagem?: React.ReactNode;
  // parceiro/indicador e consultor público: só "Ver ficha"
  podeEnviar: boolean;
  onVer: () => void;
  onEnviar: () => void;
  onIndicar?: () => void;
  onVideo?: () => void;
  // vídeo cadastrado: toca dentro do cartão (com o envio para quem pode compartilhar)
  video?: string;
  pid?: string;
  mid?: string;
}

// Cartão do equipamento citado na resposta do consultor: foto, nome e a ficha em PDF
export function CartaoFicha({ titulo, imagem, podeEnviar, onVer, onEnviar, onIndicar, onVideo, video, pid, mid }: CartaoFichaProps) {
  const [tocando, setTocando] = useState(false);
  const abrirVideo = video ? () => setTocando(v => !v) : onVideo;
  return (
    <div className="w-full rounded-xl border border-slate-700/80 bg-slate-900/70 overflow-hidden text-left">
      <div className="flex gap-3 p-2.5 items-center">
        <div className="w-[76px] h-[60px] shrink-0 rounded-lg bg-gradient-to-b from-slate-100 to-slate-300 flex items-center justify-center overflow-hidden">
          {imagem || <FileText className="h-6 w-6 text-slate-500" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="fonte-titulo text-[15px] font-extrabold text-white leading-tight break-words">{titulo}</p>
          <p className="text-[12.5px] text-slate-400 mt-0.5">Ficha técnica em PDF</p>
        </div>
      </div>
      <div className="flex gap-2 px-2.5 pb-2.5">
        <button
          type="button"
          onClick={onVer}
          className="flex-1 h-10 px-2 whitespace-nowrap rounded-lg border-2 border-slate-200 text-white font-extrabold text-[13.5px] active:scale-95 transition"
        >
          Ver ficha
        </button>
        {podeEnviar && (
          <button
            type="button"
            onClick={onEnviar}
            className="flex-1 h-10 px-2 whitespace-nowrap rounded-lg bg-[#1FA855] hover:bg-[#178a45] text-white font-extrabold text-[13.5px] active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5 shrink-0" /> Enviar ficha
          </button>
        )}
      </div>
      {(onIndicar || abrirVideo) && (
        <div className="flex gap-1.5 px-2.5 pb-2.5 -mt-0.5">
          {onIndicar && (
            <button
              type="button"
              onClick={onIndicar}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase text-[10px] h-8 px-2.5 rounded-lg transition"
            >
              <CheckCircle className="h-3 w-3" /> Indicar
            </button>
          )}
          {abrirVideo && (
            <button
              type="button"
              onClick={abrirVideo}
              aria-expanded={video ? tocando : undefined}
              // 32px de desenho, 44px de toque: a área invisível (before:) sobe e desce 6px, dentro do respiro da fileira
              className="relative flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-black uppercase text-[10px] h-8 px-2.5 rounded-lg transition before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-['']"
            >
              <Video className="h-3 w-3 text-red-500" /> {tocando ? 'Fechar vídeo' : 'Ver vídeo'}
            </button>
          )}
        </div>
      )}
      {tocando && video && (
        <PlayerVideo url={video} titulo={titulo} onFechar={() => setTocando(false)} pid={pid} mid={mid} className="px-2.5 pb-2.5 [&>div:first-child]:rounded-lg" />
      )}
    </div>
  );
}
