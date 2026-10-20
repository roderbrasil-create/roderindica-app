import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';

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
}

const pontoMedio = (a: Touch, b: Touch) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
const distancia = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
const ehInterativo = (alvo: EventTarget | null) => !!(alvo as HTMLElement | null)?.closest?.('a,button,input,select,textarea,summary,label,[role="button"]');

export function ZoomRolagem({ children, className, interiorClassName, interiorRef, interiorStyle, onZoom, max = MAX_PADRAO, reiniciarCom, semBotoes }: ZoomRolagemProps) {
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
      const w = r.offsetWidth, h = i.offsetHeight;
      setBase(b => (b.w === w && b.h === h) ? b : { w, h });
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(r); obs.observe(i);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { setZoom(1); }, [reiniciarCom]);
  const onZoomRef = useRef(onZoom);
  onZoomRef.current = onZoom;
  useEffect(() => { onZoomRef.current?.(zoom); }, [zoom]);

  // Troca de zoom: o ponto sob o dedo (ou o centro, nos botões) fica no mesmo lugar da tela
  useLayoutEffect(() => {
    const f = foco.current, r = rolavelRef.current;
    if (!f || !r) return;
    foco.current = null;
    r.scrollLeft = f.cx * zoom - f.px;
    r.scrollTop = f.cy * zoom - f.py;
  }, [zoom]);

  const mudarZoom = useCallback((novo: number, px?: number, py?: number) => {
    const r = rolavelRef.current;
    if (!r) return;
    const z0 = zoomRef.current;
    const z1 = Math.min(max, Math.max(1, novo));
    if (Math.abs(z1 - z0) < 0.001) return;
    const caixa = r.getBoundingClientRect();
    const x = px ?? caixa.width / 2, y = py ?? caixa.height / 2; // relativos ao quadro
    foco.current = { cx: (r.scrollLeft + x) / z0, cy: (r.scrollTop + y) / z0, px: x, py: y };
    zoomRef.current = z1;
    setZoom(z1);
  }, [max]);

  // Gestos: pinça e toque duplo (ouvintes nativos, porque precisam de preventDefault)
  useEffect(() => {
    const r = rolavelRef.current;
    if (!r) return;
    let pinca: { d0: number; z0: number } | null = null;
    let quadroPend = 0;
    let alvoPend: { z: number; x: number; y: number } | null = null;
    let toque: { t: number; x: number; y: number; moveu: boolean } | null = null;
    let ultimo: { t: number; x: number; y: number } | null = null;
    let pincouAgora = false;

    const aplicarPend = () => {
      quadroPend = 0;
      if (!alvoPend) return;
      const a = alvoPend; alvoPend = null;
      mudarZoom(a.z, a.x, a.y);
    };
    const aoIniciar = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinca = { d0: distancia(e.touches[0], e.touches[1]) || 1, z0: zoomRef.current };
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

    r.addEventListener('touchstart', aoIniciar, { passive: true });
    r.addEventListener('touchmove', aoMover, { passive: false });
    r.addEventListener('touchend', aoTerminar, { passive: false });
    r.addEventListener('touchcancel', aoTerminar, { passive: false });
    r.addEventListener('gesturestart', travarGesto);
    r.addEventListener('gesturechange', travarGesto);
    return () => {
      r.removeEventListener('touchstart', aoIniciar);
      r.removeEventListener('touchmove', aoMover);
      r.removeEventListener('touchend', aoTerminar);
      r.removeEventListener('touchcancel', aoTerminar);
      r.removeEventListener('gesturestart', travarGesto);
      r.removeEventListener('gesturechange', travarGesto);
      if (quadroPend) cancelAnimationFrame(quadroPend);
    };
  }, [mudarZoom, max]);

  const ampliado = zoom > 1.001 && base.w > 0;
  return (
    <div className={cn('relative', className)}>
      <div
        ref={rolavelRef}
        data-zoom-rolagem=""
        className="absolute inset-0 overflow-auto overscroll-contain"
        style={{ touchAction: 'pan-x pan-y', overflowAnchor: 'none' }}
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
  );
}
