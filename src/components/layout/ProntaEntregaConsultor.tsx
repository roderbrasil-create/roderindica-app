import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Package, Play, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ItemProntaEntrega } from '../../lib/prontaEntrega';
import { AcoesVideo, BotaoVerVideo, PlayerVideo } from '../video/VideoEquipamento';

// Pronta entrega dentro do Consultor (aprovado pelo Jeferson em 19/10/2026):
// carrossel que passa sozinho a cada 5 s na tela inicial do celular, cartão fixo que gira
// na coluna da esquerda do computador, folha com a lista inteira e o aviso amarelo
// quando o equipamento da conversa está no estoque.

type FotoFn = (src: string | undefined, className: string) => React.ReactNode;

const TEMPO_MS = 5000;

function usaMenosMovimento(): boolean {
  try { return !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

function Foto({ foto, src, className }: { foto: FotoFn; src?: string; className: string }) {
  return <>{src ? foto(src, className) : <Package className="h-10 w-10 text-[#9AA1A9]" />}</>;
}

export function CarrosselProntaEntrega({ itens, foto, onPerguntar, onIndicar, compacto = false }: {
  itens: ItemProntaEntrega[];
  foto: FotoFn;
  onPerguntar: (it: ItemProntaEntrega) => void;
  onIndicar?: (it: ItemProntaEntrega) => void;
  compacto?: boolean;
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const atualRef = useRef(0);
  atualRef.current = atual;
  // parado enquanto a pessoa encosta o dedo, passa o mouse ou está com o foco num botão
  const [parado, setParado] = useState(false);
  const soltar = useRef<ReturnType<typeof setTimeout> | null>(null);
  // mouse em cima ou foco dentro: enquanto um dos dois valer, nada volta a girar
  const mouseDentro = useRef(false);
  const focoDentro = useRef(false);
  const [menosMovimento, setMenosMovimento] = useState(usaMenosMovimento);
  // vídeo tocando num cartão: o carrossel para até a pessoa fechar o vídeo ou passar o cartão
  const [videoAberto, setVideoAberto] = useState<string | null>(null);
  // "reduzir movimento" ligado ou desligado com a tela aberta vale na hora
  useEffect(() => {
    let mq: MediaQueryList | null = null;
    try { mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null; } catch { mq = null; }
    if (!mq) return;
    const mudou = () => setMenosMovimento(mq!.matches);
    mudou();
    if (mq.addEventListener) mq.addEventListener('change', mudou); else mq.addListener?.(mudou);
    return () => { if (mq!.removeEventListener) mq!.removeEventListener('change', mudou); else mq!.removeListener?.(mudou); };
  }, []);
  const n = itens.length;

  const irPara = (i: number, suave = true) => {
    const el = trilho.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: suave && !menosMovimento ? 'smooth' : 'auto' });
  };

  const aoRolar = () => {
    const el = trilho.current;
    if (!el || !el.clientWidth) return;
    const i = Math.max(0, Math.min(n - 1, Math.round(el.scrollLeft / el.clientWidth)));
    if (i !== atualRef.current) { setAtual(i); setVideoAberto(null); }
  };

  useEffect(() => { if (atual >= n) setAtual(0); }, [n]);

  // passa sozinho: nunca com "reduzir movimento" ligado, nem parado, nem com 1 item só
  useEffect(() => {
    if (menosMovimento || parado || videoAberto || n < 2) return;
    const t = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      irPara((atualRef.current + 1) % n);
    }, TEMPO_MS);
    return () => clearInterval(t);
  }, [menosMovimento, parado, videoAberto, n]);

  useEffect(() => () => { if (soltar.current) clearTimeout(soltar.current); }, []);

  const parar = () => { if (soltar.current) clearTimeout(soltar.current); setParado(true); };
  // depois de soltar o dedo espera um pouco antes de voltar a girar
  const seguir = (depois = 0) => {
    if (soltar.current) clearTimeout(soltar.current);
    soltar.current = setTimeout(() => {
      if (mouseDentro.current || focoDentro.current) return;
      setParado(false);
    }, depois);
  };

  if (!n) return null;

  return (
    <div
      className="pe-carrossel"
      aria-roledescription="carrossel"
      aria-label="Equipamentos à pronta entrega"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') { mouseDentro.current = true; parar(); } }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') { mouseDentro.current = false; seguir(); } }}
      onTouchStart={parar}
      onTouchEnd={() => seguir(4000)}
      onTouchCancel={() => seguir(4000)}
      onFocusCapture={() => { focoDentro.current = true; parar(); }}
      onBlurCapture={(e) => {
        // o foco só passou de um botão do carrossel para outro: continua parado
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
        focoDentro.current = false;
        seguir(1500);
      }}
    >
      <div
        ref={trilho}
        onScroll={aoRolar}
        className={cn('flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', compacto ? 'rounded-xl' : 'rounded-[18px]')}
      >
        {itens.map((it, i) => (
          <div
            key={it.chave}
            role="group"
            aria-roledescription="item"
            aria-label={`${i + 1} de ${n}: ${it.nome}`}
            className={cn('snap-center shrink-0 w-full bg-white overflow-hidden border border-[#E2E5E8]', compacto ? 'rounded-xl' : 'rounded-[18px]')}
          >
            {videoAberto === it.chave && it.video ? (
              <PlayerVideo url={it.video} titulo={it.nome} onFechar={() => setVideoAberto(null)} comAcoes={false} compacto={compacto} />
            ) : (
              <div className={cn('relative w-full bg-gradient-to-b from-[#F4F5F6] to-[#E3E6E9] flex items-center justify-center', compacto ? 'h-[92px]' : 'h-[150px]')}>
                <Foto foto={foto} src={it.foto} className={cn('max-w-[86%] m-0 p-0 border-0 bg-transparent shadow-none hover:scale-100 object-contain mix-blend-multiply', compacto ? 'max-h-[80px]' : 'max-h-[130px]')} />
                <span className={cn('absolute left-2.5 top-2.5 bg-[#F6C400] text-[#111] font-extrabold rounded-full leading-none', compacto ? 'text-[10.5px] px-2 py-[4px]' : 'text-[12px] px-2.5 py-[5px]')}>Pronta entrega</span>
                {n > 1 && (
                  <span className={cn('absolute right-2.5 top-2.5 bg-[rgba(27,30,34,0.85)] text-[#fff] font-bold rounded-full leading-none', compacto ? 'text-[10.5px] px-[7px] py-[4px]' : 'text-[12px] px-[9px] py-[5px]')}>{i + 1} de {n}</span>
                )}
                {it.video && (
                  <BotaoVerVideo compacto={compacto} onClick={() => setVideoAberto(it.chave)} className={cn('absolute', compacto ? 'left-2 bottom-2' : 'left-2.5 bottom-2.5')} />
                )}
              </div>
            )}
            <div className={compacto ? 'px-2.5 pt-2' : 'px-3.5 pt-3'}>
              <p className={cn('fonte-titulo font-extrabold leading-tight text-[#1B1E22] truncate m-0', compacto ? 'text-[14.5px]' : 'text-[18px]')}>{it.nome}</p>
              {it.para && <p className={cn('text-[#5E6672] m-0 mt-0.5', compacto ? 'text-[12px] truncate' : 'text-[13px] line-clamp-2')}>{it.para}</p>}
              {videoAberto === it.chave && it.video && (
                <AcoesVideo pid={it.produto?.id} mid={it.modelo?.id} titulo={it.nome} url={it.video} compacto={compacto} />
              )}
            </div>
            <div className={cn('flex gap-2', compacto ? 'px-2.5 pt-2 pb-2.5' : 'px-3.5 pt-3 pb-3.5')}>
              <button
                type="button"
                onClick={() => onPerguntar(it)}
                className={cn('flex-1 min-w-0 rounded-xl border-2 border-[#1B1E22] bg-white text-[#1B1E22] font-extrabold active:scale-[0.98] transition', compacto ? 'h-9 text-[13px] rounded-[10px] border-[1.5px]' : 'h-12 text-[15px]')}
              >
                Perguntar
              </button>
              {onIndicar && (
                <button
                  type="button"
                  onClick={() => onIndicar(it)}
                  className={cn('flex-1 min-w-0 rounded-xl bg-[#F6C400] text-[#1B1E22] font-extrabold active:scale-[0.98] transition', compacto ? 'h-9 text-[13px] rounded-[10px]' : 'h-12 text-[15px]')}
                >
                  Indicar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {n > 1 && (
        <div className={cn('flex justify-center', compacto ? 'mt-0.5' : 'mt-1')}>
          {itens.map((it, i) => (
            <button
              key={it.chave}
              type="button"
              aria-label={`Ver equipamento ${i + 1}`}
              aria-current={i === atual ? 'true' : undefined}
              onClick={() => { irPara(i); parar(); seguir(TEMPO_MS); }}
              className={cn('w-auto p-0 px-[3px] bg-transparent flex items-center justify-center', compacto ? 'h-6 min-w-5' : 'h-8 min-w-6')}
            >
              <i className={cn('block h-1.5 rounded-[3px] transition-all', i === atual ? 'w-[18px] bg-[#1B1E22]' : 'w-1.5 bg-[#BFC4CA]')} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Faixa compacta da tela inicial do celular (pedido do Jeferson, 19/10/2026: o cartão grande
// tomava a tela e o consultor nem parecia um chat). Um cartão baixo (~96 px): foto à esquerda,
// nome e selo no meio, botões de ícone à direita. Gira sozinho a cada 5 s e passa com o dedo.
export function FaixaProntaEntrega({ itens, foto, onPerguntar, onIndicar }: {
  itens: ItemProntaEntrega[];
  foto: FotoFn;
  onPerguntar: (it: ItemProntaEntrega) => void;
  onIndicar?: (it: ItemProntaEntrega) => void;
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const atualRef = useRef(0);
  atualRef.current = atual;
  const [parado, setParado] = useState(false);
  const soltar = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menosMovimento] = useState(usaMenosMovimento);
  const [videoAberto, setVideoAberto] = useState<string | null>(null);
  const n = itens.length;

  const irPara = (i: number) => {
    const el = trilho.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: menosMovimento ? 'auto' : 'smooth' });
  };
  const aoRolar = () => {
    const el = trilho.current;
    if (!el || !el.clientWidth) return;
    const i = Math.max(0, Math.min(n - 1, Math.round(el.scrollLeft / el.clientWidth)));
    if (i !== atualRef.current) { setAtual(i); setVideoAberto(null); }
  };
  useEffect(() => { if (atual >= n) setAtual(0); }, [n]);
  useEffect(() => {
    if (menosMovimento || parado || videoAberto || n < 2) return;
    const t = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      irPara((atualRef.current + 1) % n);
    }, TEMPO_MS);
    return () => clearInterval(t);
  }, [menosMovimento, parado, videoAberto, n]);
  useEffect(() => () => { if (soltar.current) clearTimeout(soltar.current); }, []);
  const parar = () => { if (soltar.current) clearTimeout(soltar.current); setParado(true); };
  const seguir = (depois: number) => {
    if (soltar.current) clearTimeout(soltar.current);
    soltar.current = setTimeout(() => setParado(false), depois);
  };

  if (!n) return null;
  const itVideo = itens.find(it => it.chave === videoAberto && it.video);

  return (
    <div
      className="pe-faixa"
      aria-roledescription="carrossel"
      aria-label="Equipamentos à pronta entrega"
      onTouchStart={parar}
      onTouchEnd={() => seguir(4000)}
      onTouchCancel={() => seguir(4000)}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') parar(); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') seguir(0); }}
      onFocusCapture={parar}
      onBlurCapture={(e) => { if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return; seguir(1500); }}
    >
      <div ref={trilho} onScroll={aoRolar} className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {itens.map((it, i) => (
          <div
            key={it.chave}
            role="group"
            aria-roledescription="item"
            aria-label={`${i + 1} de ${n}: ${it.nome}`}
            className="snap-center shrink-0 w-full h-[104px] flex items-stretch gap-2 rounded-2xl border border-[#E2E5E8] bg-white p-1.5 pr-2"
          >
            <button
              type="button"
              onClick={() => onPerguntar(it)}
              aria-label={`Perguntar sobre ${it.nome}`}
              className="min-w-0 flex-1 h-auto p-0 flex items-center gap-2.5 bg-transparent text-left active:opacity-80"
            >
              <span className="h-[78px] w-[78px] shrink-0 rounded-xl bg-gradient-to-b from-[#F4F5F6] to-[#E3E6E9] flex items-center justify-center overflow-hidden">
                <Foto foto={foto} src={it.foto} className="max-w-full max-h-[72px] m-0 p-1 border-0 bg-transparent shadow-none hover:scale-100 object-contain mix-blend-multiply" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="bg-[#F6C400] text-[#111] text-[10.5px] font-extrabold px-2 py-[3px] rounded-full leading-none whitespace-nowrap">Pronta entrega</span>
                  {n > 1 && <span className="text-[11px] font-bold text-[#8A9097] whitespace-nowrap">{i + 1}/{n}</span>}
                </span>
                <span className="fonte-titulo block mt-1 text-[14.5px] font-extrabold leading-tight text-[#1B1E22] line-clamp-2 break-words">{it.nome}</span>
                {it.para && <span className="block mt-0.5 text-[12px] leading-tight text-[#5E6672] truncate">{it.para}</span>}
              </span>
            </button>
            <span className="shrink-0 flex flex-col justify-center gap-1">
              {it.video && (
                <button
                  type="button"
                  onClick={() => { parar(); setVideoAberto(videoAberto === it.chave ? null : it.chave); }}
                  aria-label={`Ver vídeo de ${it.nome}`}
                  title="Ver vídeo"
                  className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-full bg-[#1B1E22] text-[#fff] flex items-center justify-center active:scale-95 transition"
                >
                  <Play className="h-4 w-4 fill-[#F6C400] text-[#F6C400]" />
                </button>
              )}
              {onIndicar ? (
                <button
                  type="button"
                  onClick={() => onIndicar(it)}
                  aria-label={`Indicar ${it.nome}`}
                  title="Indicar"
                  className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-full bg-[#F6C400] text-[#1B1E22] flex items-center justify-center active:scale-95 transition"
                >
                  <UserPlus className="h-[18px] w-[18px]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onPerguntar(it)}
                  aria-label={`Perguntar sobre ${it.nome}`}
                  title="Perguntar"
                  className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-full border border-[#DADDE1] bg-white text-[#1B1E22] flex items-center justify-center active:scale-95 transition"
                >
                  <MessageCircle className="h-[18px] w-[18px]" />
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
      {itVideo && itVideo.video && (
        <PlayerVideo url={itVideo.video} titulo={itVideo.nome} onFechar={() => { setVideoAberto(null); seguir(TEMPO_MS); }} pid={itVideo.produto?.id} mid={itVideo.modelo?.id} className="mt-2 [&>div:first-child]:rounded-xl" />
      )}
    </div>
  );
}

// Folha "Pronta entrega" do celular: todos os itens, um embaixo do outro
export function ListaProntaEntrega({ itens, foto, onPerguntar, onIndicar }: {
  itens: ItemProntaEntrega[];
  foto: FotoFn;
  onPerguntar: (it: ItemProntaEntrega) => void;
  onIndicar?: (it: ItemProntaEntrega) => void;
}) {
  const [videoAberto, setVideoAberto] = useState<string | null>(null);
  if (!itens.length) {
    return <p className="px-1 py-6 text-center text-[14.5px] text-[#5B6168]">Nenhum equipamento à pronta entrega agora.</p>;
  }
  return (
    <div className="space-y-2.5">
      {itens.map(it => (
        <div key={it.chave} className="rounded-2xl border border-[#E2E5E8] bg-white p-3">
          <div className="flex items-center gap-3">
            <div className="relative h-[76px] w-[96px] shrink-0 rounded-xl bg-gradient-to-b from-[#F4F5F6] to-[#E3E6E9] flex items-center justify-center overflow-hidden">
              <Foto foto={foto} src={it.foto} className="max-w-full max-h-[70px] m-0 p-1 border-0 bg-transparent shadow-none hover:scale-100 object-contain mix-blend-multiply" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block bg-[#F6C400] text-[#111] text-[11px] font-extrabold px-2 py-[3px] rounded-full leading-none">Pronta entrega</span>
              <p className="fonte-titulo m-0 mt-1 text-[16px] font-extrabold leading-tight text-[#1B1E22] break-words">{it.nome}</p>
              {it.para && <p className="m-0 mt-0.5 text-[13px] text-[#5E6672] line-clamp-2">{it.para}</p>}
              {it.video && videoAberto !== it.chave && <BotaoVerVideo compacto onClick={() => setVideoAberto(it.chave)} className="mt-1.5" />}
            </div>
          </div>
          {videoAberto === it.chave && it.video && (
            <PlayerVideo url={it.video} titulo={it.nome} onFechar={() => setVideoAberto(null)} pid={it.produto?.id} mid={it.modelo?.id} className="mt-2.5 [&>div:first-child]:rounded-xl" />
          )}
          <div className="mt-2.5 flex gap-2">
            <button type="button" onClick={() => onPerguntar(it)} className="flex-1 h-11 rounded-xl border-2 border-[#1B1E22] bg-white text-[#1B1E22] text-[14.5px] font-extrabold active:scale-[0.98] transition">Perguntar</button>
            {onIndicar && (
              <button type="button" onClick={() => onIndicar(it)} className="flex-1 h-11 rounded-xl bg-[#F6C400] text-[#1B1E22] text-[14.5px] font-extrabold active:scale-[0.98] transition">Indicar</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Aviso amarelo na conversa: o equipamento indicado está no estoque
export function AvisoProntaEntrega({ item, foto, rotulo, onAcao, parceiro }: {
  item: ItemProntaEntrega;
  foto: FotoFn;
  rotulo: string;
  onAcao: () => void;
  parceiro: boolean;
}) {
  // título no singular com o modelo ("Garra Florestal R400"), o mesmo do carrossel e da folha
  const modelo = String(item.nome || item.modelo?.name || '');
  const [video, setVideo] = useState(false);
  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[88%] sm:max-w-[420px] rounded-2xl border-2 border-[#F6C400] bg-[#FFFBEA] p-2.5">
      <div className="flex items-center gap-3">
        <div className="h-14 w-16 shrink-0 rounded-xl bg-gradient-to-b from-[#F4F5F6] to-[#E3E6E9] flex items-center justify-center overflow-hidden">
          <Foto foto={foto} src={item.foto} className="max-w-full max-h-[52px] m-0 p-0.5 border-0 bg-transparent shadow-none hover:scale-100 object-contain mix-blend-multiply" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="fonte-titulo m-0 text-[15.5px] font-extrabold leading-tight text-[#1B1E22] break-words">{modelo} à pronta entrega</p>
          <p className="m-0 mt-0.5 text-[13px] leading-snug text-[#7A5F00]">{parceiro ? 'Entrega mais rápida para o seu cliente.' : 'Entrega mais rápida.'}</p>
          {item.video && !video && <BotaoVerVideo compacto onClick={() => setVideo(true)} className="mt-1.5" />}
        </div>
        <button type="button" onClick={onAcao} className="h-11 shrink-0 px-3.5 rounded-xl bg-[#F6C400] text-[#1B1E22] text-[14.5px] font-extrabold active:scale-[0.97] transition">{rotulo}</button>
      </div>
      {video && item.video && (
        <PlayerVideo url={item.video} titulo={modelo} onFechar={() => setVideo(false)} pid={item.produto?.id} mid={item.modelo?.id} className="mt-2.5 [&>div:first-child]:rounded-xl" />
      )}
      </div>
    </div>
  );
}
