import React, { useEffect, useRef, useState } from 'react';
import { Package } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ItemProntaEntrega } from '../../lib/prontaEntrega';
import { AcoesVideo, BotaoVerVideo, PlayerVideo } from '../video/VideoEquipamento';
import { capaDoVideo, formatarDuracao, nomeDoVideo, type VideoConsultor } from '../../lib/videosConsultor';

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

// Cartão extra do carrossel: vídeo da biblioteca marcado "no carrossel" (capa + "Ver vídeo", sem tocar sozinho)
type Cartao = { chave: string; it?: ItemProntaEntrega; v?: VideoConsultor };

export function CarrosselProntaEntrega({ itens, foto, onPerguntar, onIndicar, compacto = false, videos = [], fotoDoVideo, onPerguntarVideo, onIndicarVideo }: {
  itens: ItemProntaEntrega[];
  foto: FotoFn;
  onPerguntar: (it: ItemProntaEntrega) => void;
  onIndicar?: (it: ItemProntaEntrega) => void;
  compacto?: boolean;
  videos?: VideoConsultor[];
  fotoDoVideo?: (v: VideoConsultor) => string | undefined;
  onPerguntarVideo?: (v: VideoConsultor) => void;
  onIndicarVideo?: (v: VideoConsultor) => void;
}) {
  const cartoes: Cartao[] = React.useMemo(() => [
    ...itens.map(it => ({ chave: it.chave, it })),
    ...videos.map(v => ({ chave: `video:${v.id}`, v })),
  ], [itens, videos]);
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
  const n = cartoes.length;

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
      aria-label={itens.length ? 'Equipamentos à pronta entrega' : 'Vídeos da Roder em campo'}
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
        {cartoes.map((c, i) => c.v ? (
          <CartaoVideoCarrossel
            key={c.chave}
            v={c.v}
            i={i}
            n={n}
            compacto={compacto}
            foto={foto}
            fotoReserva={fotoDoVideo?.(c.v)}
            aberto={videoAberto === c.chave}
            onAbrir={() => setVideoAberto(c.chave)}
            onFechar={() => setVideoAberto(null)}
            onPerguntar={onPerguntarVideo}
            onIndicar={onIndicarVideo}
          />
        ) : (() => { const it = c.it!; return (
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
        ); })())}
      </div>
      {n > 1 && (
        <div className={cn('flex justify-center', compacto ? 'mt-0.5' : 'mt-1')}>
          {cartoes.map((it, i) => (
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

function CartaoVideoCarrossel({ v, i, n, compacto, foto, fotoReserva, aberto, onAbrir, onFechar, onPerguntar, onIndicar }: {
  v: VideoConsultor; i: number; n: number; compacto: boolean; foto: FotoFn; fotoReserva?: string;
  aberto: boolean; onAbrir: () => void; onFechar: () => void;
  onPerguntar?: (v: VideoConsultor) => void; onIndicar?: (v: VideoConsultor) => void;
}) {
  const nome = nomeDoVideo(v);
  const capa = capaDoVideo(v);
  const [capaFalhou, setCapaFalhou] = useState(false);
  const vid = v.tipo === 'catalogo' ? undefined : v.id;
  return (
    <div
      role="group"
      aria-roledescription="item"
      aria-label={`${i + 1} de ${n}: vídeo ${v.titulo}`}
      className={cn('snap-center shrink-0 w-full bg-white overflow-hidden border border-[#E2E5E8]', compacto ? 'rounded-xl' : 'rounded-[18px]')}
    >
      {aberto ? (
        <PlayerVideo url={v.video_url} titulo={nome} onFechar={onFechar} comAcoes={false} compacto={compacto} vid={vid} pid={v.produto_id} mid={v.modelo_id} />
      ) : (
        <div className={cn('relative w-full flex items-center justify-center overflow-hidden', capa && !capaFalhou ? 'bg-[#1B1E22]' : 'bg-gradient-to-b from-[#F4F5F6] to-[#E3E6E9]', compacto ? 'h-[92px]' : 'h-[150px]')}>
          {capa && !capaFalhou
            ? <img src={capa} alt="" loading="lazy" onError={() => setCapaFalhou(true)} className="absolute inset-0 h-full w-full object-cover opacity-90" />
            : <Foto foto={foto} src={fotoReserva} className={cn('max-w-[86%] m-0 p-0 border-0 bg-transparent shadow-none hover:scale-100 object-contain mix-blend-multiply', compacto ? 'max-h-[80px]' : 'max-h-[130px]')} />}
          <span className={cn('absolute left-2.5 top-2.5 bg-[#F6C400] text-[#111] font-extrabold rounded-full leading-none', compacto ? 'text-[10.5px] px-2 py-[4px]' : 'text-[12px] px-2.5 py-[5px]')}>Roder em campo</span>
          {n > 1 && (
            <span className={cn('absolute right-2.5 top-2.5 bg-[rgba(27,30,34,0.85)] text-[#fff] font-bold rounded-full leading-none', compacto ? 'text-[10.5px] px-[7px] py-[4px]' : 'text-[12px] px-[9px] py-[5px]')}>{i + 1} de {n}</span>
          )}
          {v.duracao_s ? (
            <span className={cn('absolute right-2.5 bg-[rgba(0,0,0,0.72)] text-[#fff] font-bold rounded-[5px] leading-none', compacto ? 'bottom-2 text-[10.5px] px-1.5 py-[3px]' : 'bottom-2.5 text-[11.5px] px-1.5 py-[4px]')}>{formatarDuracao(v.duracao_s)}</span>
          ) : null}
          <BotaoVerVideo compacto={compacto} onClick={onAbrir} className={cn('absolute', compacto ? 'left-2 bottom-2' : 'left-2.5 bottom-2.5')} />
        </div>
      )}
      <div className={compacto ? 'px-2.5 pt-2' : 'px-3.5 pt-3'}>
        <p className={cn('fonte-titulo font-extrabold leading-tight text-[#1B1E22] truncate m-0', compacto ? 'text-[14.5px]' : 'text-[18px]')}>{nome}</p>
        <p className={cn('text-[#5E6672] m-0 mt-0.5', compacto ? 'text-[12px] truncate' : 'text-[13px] line-clamp-2')}>{v.titulo}{v.contexto && v.tipo !== 'catalogo' ? ` · ${v.contexto}` : ''}</p>
        {aberto && <AcoesVideo pid={v.produto_id} mid={v.modelo_id} vid={vid} titulo={nome} url={v.video_url} compacto={compacto} />}
      </div>
      {(onPerguntar || onIndicar) && (
        <div className={cn('flex gap-2', compacto ? 'px-2.5 pt-2 pb-2.5' : 'px-3.5 pt-3 pb-3.5')}>
          {onPerguntar && (
            <button type="button" onClick={() => onPerguntar(v)} className={cn('flex-1 min-w-0 rounded-xl border-2 border-[#1B1E22] bg-white text-[#1B1E22] font-extrabold active:scale-[0.98] transition', compacto ? 'h-9 text-[13px] rounded-[10px] border-[1.5px]' : 'h-12 text-[15px]')}>
              Perguntar
            </button>
          )}
          {onIndicar && (
            <button type="button" onClick={() => onIndicar(v)} className={cn('flex-1 min-w-0 rounded-xl bg-[#F6C400] text-[#1B1E22] font-extrabold active:scale-[0.98] transition', compacto ? 'h-9 text-[13px] rounded-[10px]' : 'h-12 text-[15px]')}>
              Indicar
            </button>
          )}
        </div>
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
