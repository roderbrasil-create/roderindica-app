import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { rolagemParaAncorar, pontoDoConteudo, limitarZoom } from '../../lib/zoomAncora';

// Área de leitura com zoom para fichas e documentos no celular (pedido do Jeferson, 20/10/2026:
// "não consigo dar zoom na ficha, o texto fica pequeno").
//
// Por que o zoom é nosso e não do navegador: o app trava o zoom da página inteira de propósito
// (viewport com maximum-scale=1 e user-scalable=no, e o Safari instalado como app respeita isso);
// destravar deixaria o app todo "zoomável" sem querer. Aqui o zoom vale SÓ dentro da área da ficha:
//  - pinça com dois dedos e toque duplo (ficha amplia em torno do ponto tocado);
//  - botões menos, mais e "ajustar à largura", com alvo de 44 px (o CSS global do celular força
//    button em h-10, por isso h-11 w-11 com min-h/min-w explícitos);
//  - a área rola nos dois sentidos quando ampliada (`touch-action: pan-x pan-y`: o gesto de pinça
//    não vira zoom da página, quem trata é este componente).
// Segunda rodada (20/10/2026, ficha aberta pelo consultor): a barra de modelos ampliava junto com a ficha, o
// arraste era solto (o iOS "estica" a borda da área) e a pinça não seguia o movimento dos dedos. Agora:
//  - `topo` é um cabeçalho FIXO, fora da área que amplia (barra de modelos, por exemplo);
//  - `overscroll-behavior: none` tira o efeito elástico: a borda da ficha é o limite do arraste;
//  - a pinça fixa o ponto do conteúdo que estava entre os dedos no INÍCIO do gesto e o mantém sob os dedos
//    o tempo todo, então ampliar e arrastar com dois dedos ao mesmo tempo funciona;
//  - ctrl + roda (pinça do trackpad no computador) amplia em torno do cursor.
// A ampliação é uma `transform: scale` num invólucro EXTERNO. A ficha por dentro não sabe de nada:
// a escala dela para caber na largura e a geração do PDF (que lê o próprio elemento, sem o zoom da
// tela) continuam exatamente como eram.

const MAX_PADRAO = 4;
const PASSO_BOTAO = 0.5;

export interface ZoomRolagemProps {
  children: React.ReactNode;
  // classes do quadro (ex.: "flex-1 min-h-0 bg-neutral-100")
  className?: string;
  // classes do miolo que contém a ficha (o que era o contêiner que rolava: padding, flex, centralização)
  interiorClassName?: string;
  interiorRef?: React.Ref<HTMLDivElement>;
  interiorStyle?: React.CSSProperties;
  // avisa o zoom atual (ex.: o leitor de PDF redesenha mais nítido quando amplia)
  onZoom?: (zoom: number) => void;
  max?: number;
  // muda quando o conteúdo é outro (ex.: troca de modelo): o zoom volta a 100%
  reiniciarCom?: unknown;
  // esconde os botões flutuantes (quando o cabeçalho já tem os seus)
  semBotoes?: boolean;
  // cabeçalho fixo, FORA da área que rola e amplia (ex.: a barra de modelos da ficha)
  topo?: React.ReactNode;
}

const pontoMedio = (a: Touch, b: Touch) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
const distancia = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
const ehInterativo = (alvo: EventTarget | null) => !!(alvo as HTMLElement | null)?.closest?.('a,button,input,select,textarea,summary,label,[role="button"]');

export function ZoomRolagem({ children, className, interiorClassName, interiorRef, interiorStyle, onZoom, max = MAX_PADRAO, reiniciarCom, semBotoes, topo }: ZoomRolagemProps) {
  const rolavelRef = useRef<HTMLDivElement>(null);
  const interiorLocal = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;
  const [base, setBase] = useState({ w: 0, h: 0 }); // tamanho do miolo a 100%
  // ponto do conteúdo que deve ficar sob o dedo depois da troca de zoom
  const foco = useRef<{ cx: number; cy: number; px: number; py: number } | null>(null);

  const prenderInterior = useCallback((el: HTMLDivElement | null) => {
    interiorLocal.current = el;
    if (typeof interiorRef === 'function') interiorRef(el);
    else if (interiorRef) (interiorRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [interiorRef]);

  // Tamanho natural: largura = a do quadro; altura = a do miolo (offsetHeight não sofre transform)
  useEffect(() => {
    const r = rolavelRef.current, i = interiorLocal.current;
    if (!r || !i) return;
    const medir = () => {
      const w = r.clientWidth, h = i.offsetHeight; // clientWidth: sem a barra de rolagem, para a ficha ampliada não ganhar rolagem lateral a mais
      setBase(b => (b.w === w && b.h === h) ? b : { w, h });
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(r); obs.observe(i);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setZoom(1);
    const r = rolavelRef.current;
    if (r) { r.scrollLeft = 0; r.scrollTop = 0; }
  }, [reiniciarCom]);
  const onZoomRef = useRef(onZoom);
  onZoomRef.current = onZoom;
  useEffect(() => { onZoomRef.current?.(zoom); }, [zoom]);

  // Troca de zoom: o ponto sob o dedo (ou o centro, nos botões) fica no mesmo lugar da tela
  useLayoutEffect(() => {
    const f = foco.current, r = rolavelRef.current;
    if (!f || !r) return;
    foco.current = null;
    r.scrollLeft = rolagemParaAncorar(f.cx, zoom, f.px);
    r.scrollTop = rolagemParaAncorar(f.cy, zoom, f.py);
  }, [zoom]);

  // Põe o ponto (cx, cy) do conteúdo a 100% sob o ponto (px, py) do quadro, no zoom pedido
  const ancorar = useCallback((novo: number, cx: number, cy: number, px: number, py: number) => {
    const r = rolavelRef.current;
    if (!r) return;
    const z1 = limitarZoom(novo, max);
    if (Math.abs(z1 - zoomRef.current) < 0.001) {
      // mesmo zoom: só os dedos andaram (arraste com dois dedos)
      r.scrollLeft = rolagemParaAncorar(cx, z1, px);
      r.scrollTop = rolagemParaAncorar(cy, z1, py);
      return;
    }
    foco.current = { cx, cy, px, py };
    zoomRef.current = z1;
    setZoom(z1);
  }, [max]);

  const mudarZoom = useCallback((novo: number, px?: number, py?: number) => {
    const r = rolavelRef.current;
    if (!r) return;
    const z0 = zoomRef.current;
    const caixa = r.getBoundingClientRect();
    const x = px ?? caixa.width / 2, y = py ?? caixa.height / 2; // relativos ao quadro
    ancorar(novo, pontoDoConteudo(r.scrollLeft, x, z0), pontoDoConteudo(r.scrollTop, y, z0), x, y);
  }, [ancorar]);

  // Gestos: pinça e toque duplo (ouvintes nativos, porque precisam de preventDefault)
  useEffect(() => {
    const r = rolavelRef.current;
    if (!r) return;
    let pinca: { d0: number; z0: number; cx: number; cy: number } | null = null;
    let quadroPend = 0;
    let alvoPend: { z: number; x: number; y: number } | null = null;
    let toque: { t: number; x: number; y: number; moveu: boolean } | null = null;
    let ultimo: { t: number; x: number; y: number } | null = null;
    let pincouAgora = false;

    const aplicarPend = () => {
      quadroPend = 0;
      if (!alvoPend) return;
      const a = alvoPend; alvoPend = null;
      if (pinca) ancorar(a.z, pinca.cx, pinca.cy, a.x, a.y);
      else mudarZoom(a.z, a.x, a.y);
    };
    const aoIniciar = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // ponto do conteúdo (a 100%) que está entre os dedos agora: é ele que acompanha os dedos até o fim
        const m = pontoMedio(e.touches[0], e.touches[1]);
        const caixa = r.getBoundingClientRect();
        const z0 = zoomRef.current;
        pinca = {
          d0: distancia(e.touches[0], e.touches[1]) || 1, z0,
          cx: pontoDoConteudo(r.scrollLeft, m.x - caixa.left, z0), cy: pontoDoConteudo(r.scrollTop, m.y - caixa.top, z0),
        };
        toque = null; ultimo = null; pincouAgora = true;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        toque = { t: performance.now(), x: t.clientX, y: t.clientY, moveu: false };
      }
    };
    const aoMover = (e: TouchEvent) => {
      if (pinca && e.touches.length === 2) {
        e.preventDefault(); // sem isto o Safari amplia a página inteira
        const m = pontoMedio(e.touches[0], e.touches[1]);
        const caixa = r.getBoundingClientRect();
        alvoPend = { z: pinca.z0 * (distancia(e.touches[0], e.touches[1]) / pinca.d0), x: m.x - caixa.left, y: m.y - caixa.top };
        if (!quadroPend) quadroPend = requestAnimationFrame(aplicarPend);
      } else if (toque && e.touches.length === 1) {
        const t = e.touches[0];
        if (Math.hypot(t.clientX - toque.x, t.clientY - toque.y) > 10) toque.moveu = true;
      }
    };
    const aoTerminar = (e: TouchEvent) => {
      if (pinca && e.touches.length < 2) {
        pinca = null;
        if (quadroPend) { cancelAnimationFrame(quadroPend); aplicarPend(); }
        if (zoomRef.current < 1.04) mudarZoom(1);
        // o dedo que sobra não pode virar "toque" de toque duplo
        setTimeout(() => { pincouAgora = false; }, 350);
        return;
      }
      if (pincouAgora || !toque || e.changedTouches.length !== 1) { toque = null; return; }
      const t = e.changedTouches[0];
      const agora = performance.now();
      const foiToque = !toque.moveu && agora - toque.t < 300;
      toque = null;
      if (!foiToque || ehInterativo(e.target)) { ultimo = null; return; }
      if (ultimo && agora - ultimo.t < 320 && Math.hypot(t.clientX - ultimo.x, t.clientY - ultimo.y) < 40) {
        e.preventDefault(); // não deixa o segundo toque virar clique
        const caixa = r.getBoundingClientRect();
        mudarZoom(zoomRef.current > 1.05 ? 1 : Math.min(max, 2.5), t.clientX - caixa.left, t.clientY - caixa.top);
        ultimo = null;
      } else {
        ultimo = { t: agora, x: t.clientX, y: t.clientY };
      }
    };
    // Safari: gesto de pinça próprio, que também precisa ser contido
    const travarGesto = (e: Event) => e.preventDefault();
    // Computador: ctrl + roda (e a pinça do trackpad, que chega assim) amplia em torno do cursor
    const aoRodar = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const caixa = r.getBoundingClientRect();
      mudarZoom(zoomRef.current * Math.exp(-e.deltaY * 0.01), e.clientX - caixa.left, e.clientY - caixa.top);
    };

    r.addEventListener('touchstart', aoIniciar, { passive: true });
    r.addEventListener('touchmove', aoMover, { passive: false });
    r.addEventListener('touchend', aoTerminar, { passive: false });
    r.addEventListener('touchcancel', aoTerminar, { passive: false });
    r.addEventListener('gesturestart', travarGesto);
    r.addEventListener('gesturechange', travarGesto);
    r.addEventListener('wheel', aoRodar, { passive: false });
    return () => {
      r.removeEventListener('wheel', aoRodar);
      r.removeEventListener('touchstart', aoIniciar);
      r.removeEventListener('touchmove', aoMover);
      r.removeEventListener('touchend', aoTerminar);
      r.removeEventListener('touchcancel', aoTerminar);
      r.removeEventListener('gesturestart', travarGesto);
      r.removeEventListener('gesturechange', travarGesto);
      if (quadroPend) cancelAnimationFrame(quadroPend);
    };
  }, [mudarZoom, ancorar, max]);

  const ampliado = zoom > 1.001 && base.w > 0;
  return (
    <div className={cn('relative flex flex-col', className)}>
      {topo && <div className="shrink-0" data-zoom-topo="">{topo}</div>}
      <div className="relative flex-1 min-h-0">
        <div
          ref={rolavelRef}
          data-zoom-rolagem=""
          className="absolute inset-0 overflow-auto"
          style={{ touchAction: 'pan-x pan-y', overflowAnchor: 'none', overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div style={ampliado ? { width: base.w * zoom, height: base.h * zoom, position: 'relative' } : { height: '100%' }}>
            <div
              ref={prenderInterior}
              className={interiorClassName}
              style={ampliado
                ? { ...interiorStyle, width: base.w, position: 'absolute', left: 0, top: 0, transform: `scale(${zoom})`, transformOrigin: '0 0' }
                : { minHeight: '100%', ...interiorStyle }}
            >
              {children}
            </div>
          </div>
        </div>
      {!semBotoes && (
        <div
          className="absolute right-3 z-10 flex items-center gap-1 rounded-2xl bg-white/95 p-1 shadow-lg ring-1 ring-black/10 backdrop-blur"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
          data-zoom-controles=""
        >
          <button type="button" aria-label="Diminuir zoom" disabled={zoom <= 1.001} onClick={() => mudarZoom(zoom - PASSO_BOTAO)} className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-xl border border-slate-300 bg-white text-slate-800 flex items-center justify-center disabled:opacity-40">
            <Minus className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Ajustar à largura" onClick={() => mudarZoom(1)} className="h-11 min-h-[44px] min-w-[52px] px-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-extrabold tabular-nums flex items-center justify-center gap-1">
            {zoom > 1.001 ? `${Math.round(zoom * 100)}%` : <Maximize2 className="h-4 w-4" />}
          </button>
          <button type="button" aria-label="Aumentar zoom" disabled={zoom >= max - 0.001} onClick={() => mudarZoom(zoom + PASSO_BOTAO)} className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-xl border border-slate-300 bg-white text-slate-800 flex items-center justify-center disabled:opacity-40">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
