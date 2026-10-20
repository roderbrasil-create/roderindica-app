import React, { useEffect, useMemo, useState } from 'react';
import { Play, Search, Video, X } from 'lucide-react';
import { cn, getApiBaseUrl } from '../../lib/utils';
import {
  agruparPorEquipamento, capaDoVideo, filtrarVideos, formatarDuracao, nomeDoVideo, ROTULO_TIPO, type VideoConsultor,
} from '../../lib/videosConsultor';
import { AcoesVideo, PlayerVideo } from './VideoEquipamento';

// Vídeos do consultor no navegador (pedido do Jeferson em 19/10/2026): cartões embaixo da resposta,
// folha "Vídeos" com busca e os cartões extras do carrossel. A lista vem do servidor
// (GET /api/consultor/videos), porque o parceiro pelo link e o visitante não têm login para ler o banco.
// Nada toca sozinho: o player só nasce depois do toque em "Ver vídeo".

let cacheLista: { ate: number; lista: VideoConsultor[] } | null = null;
let pedido: Promise<VideoConsultor[]> | null = null;

export function carregarVideosConsultor(fresco = false): Promise<VideoConsultor[]> {
  if (!fresco && cacheLista && cacheLista.ate > Date.now()) return Promise.resolve(cacheLista.lista);
  if (!pedido || fresco) {
    pedido = fetch(`${getApiBaseUrl()}/api/consultor/videos${fresco ? '?fresco=1' : ''}`)
      .then(r => (r.ok ? r.json() : { videos: [] }))
      .then(j => {
        const lista: VideoConsultor[] = Array.isArray(j?.videos) ? j.videos : [];
        cacheLista = { ate: Date.now() + 5 * 60 * 1000, lista };
        return lista;
      })
      .catch(() => cacheLista?.lista || [])
      .finally(() => { pedido = null; });
  }
  return pedido;
}

export function useVideosConsultor(ativo = true): VideoConsultor[] {
  const [lista, setLista] = useState<VideoConsultor[]>(() => cacheLista?.lista || []);
  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    carregarVideosConsultor().then(l => { if (vivo) setLista(l); });
    return () => { vivo = false; };
  }, [ativo]);
  return lista;
}

// Capa do vídeo: a gravada no cadastro, a do YouTube, ou a foto do equipamento
function Capa({ v, fotoReserva, className }: { v: VideoConsultor; fotoReserva?: string; className?: string }) {
  const [falhou, setFalhou] = useState(false);
  const capa = capaDoVideo(v);
  const src = !falhou && capa ? capa : fotoReserva;
  return (
    <div className={cn('relative w-full overflow-hidden bg-gradient-to-br from-[#3A4048] to-[#1B1E22] flex items-center justify-center', className)}>
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFalhou(true)}
          className={cn('absolute inset-0 h-full w-full', capa && !falhou ? 'object-cover' : 'object-contain p-3 bg-gradient-to-b from-[#F4F5F6] to-[#E3E6E9]')}
        />
      ) : <Video className="h-8 w-8 text-[#9AA1A9]" />}
      <span className="relative z-[1] h-12 w-12 rounded-full bg-[rgba(255,255,255,0.92)] flex items-center justify-center shadow">
        <Play className="h-5 w-5 fill-[#1B1E22] text-[#1B1E22] ml-0.5" />
      </span>
      {v.duracao_s ? (
        <span className="absolute right-2 bottom-2 rounded-[5px] bg-[rgba(0,0,0,0.72)] px-1.5 py-0.5 text-[11.5px] font-bold text-[#fff]">{formatarDuracao(v.duracao_s)}</span>
      ) : null}
    </div>
  );
}

// Cartão de um vídeo: capa, título, contexto e equipamento; o toque troca a capa pelo player
// (com "Enviar no WhatsApp" e "Enviar o vídeo" para quem pode compartilhar)
export function CartaoVideo({ v, fotoReserva, compacto = false, className }: { v: VideoConsultor; fotoReserva?: string; compacto?: boolean; className?: string }) {
  const [aberto, setAberto] = useState(false);
  const nome = nomeDoVideo(v);
  return (
    <div className={cn('w-full overflow-hidden rounded-[14px] border border-[#E2E5E8] bg-white', className)}>
      {aberto ? (
        <PlayerVideo
          url={v.video_url}
          titulo={nome}
          onFechar={() => setAberto(false)}
          pid={v.produto_id}
          mid={v.modelo_id}
          vid={v.tipo === 'catalogo' ? undefined : v.id}
          compacto={compacto}
          comAcoes={false}
        />
      ) : (
        <button type="button" onClick={() => setAberto(true)} aria-label={`Ver vídeo: ${v.titulo}`} className="block w-full h-auto p-0 m-0 rounded-none bg-transparent">
          <Capa v={v} fotoReserva={fotoReserva} className={compacto ? 'aspect-video' : 'aspect-video max-h-[190px]'} />
        </button>
      )}
      <div className="px-3 pt-2.5 pb-3">
        <p className="fonte-titulo m-0 text-[15px] font-extrabold leading-tight text-[#1B1E22] break-words">{v.titulo}</p>
        {v.contexto && v.tipo !== 'catalogo' && <p className="m-0 mt-0.5 text-[13px] leading-snug text-[#5E6672] line-clamp-2">{v.contexto}</p>}
        <p className="m-0 mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-[#6B7178]">
          <span className="font-bold text-[#3E444B]">{nome}</span>
          <span className={cn('rounded-[6px] px-1.5 py-[1px] text-[10.5px] font-extrabold',
            v.tipo === 'campo' ? 'bg-[#DCFCE7] text-[#14532D]' : v.tipo === 'catalogo' ? 'bg-[#F1F2F4] text-[#3E444B]' : 'bg-[#FFF7D1] text-[#7A5F00]')}>{ROTULO_TIPO[v.tipo]}</span>
        </p>
        {!aberto && (
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="mt-2 w-full h-11 rounded-xl bg-[#1B1E22] text-[#fff] text-[14px] font-extrabold flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
          >
            <Play className="h-4 w-4 fill-[#F6C400] text-[#F6C400]" /> Ver vídeo
          </button>
        )}
        {aberto && <AcoesDoCartao v={v} nome={nome} compacto={compacto} />}
      </div>
    </div>
  );
}

// As ações ficam embaixo do texto (e não grudadas no player), como no carrossel
function AcoesDoCartao({ v, nome, compacto }: { v: VideoConsultor; nome: string; compacto: boolean }) {
  return <AcoesVideo pid={v.produto_id} mid={v.modelo_id} vid={v.tipo === 'catalogo' ? undefined : v.id} titulo={nome} url={v.video_url} compacto={compacto} />;
}

// Cartões embaixo da resposta do consultor: só os ids que existem na lista
export function VideosDaResposta({ ids, lista, foto }: { ids: string[]; lista: VideoConsultor[]; foto?: (v: VideoConsultor) => string | undefined }) {
  const videos = useMemo(() => ids.map(id => lista.find(v => v.id === id)).filter(Boolean) as VideoConsultor[], [ids, lista]);
  if (!videos.length) return null;
  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[88%] sm:max-w-[420px] space-y-2">
        {videos.map(v => <CartaoVideo key={v.id} v={v} fotoReserva={foto?.(v)} />)}
      </div>
    </div>
  );
}

// Lista com busca, agrupada por equipamento (folha do celular e aba do computador)
export function ListaVideos({ lista, foto, vazio }: { lista: VideoConsultor[]; foto?: (v: VideoConsultor) => string | undefined; vazio?: string }) {
  const [busca, setBusca] = useState('');
  const grupos = useMemo(() => agruparPorEquipamento(filtrarVideos(lista, busca)), [lista, busca]);
  return (
    <div className="space-y-3">
      <label className="flex h-11 items-center gap-2 rounded-xl border border-[#DADDE1] bg-white px-3 focus-within:border-[#1B1E22]">
        <Search className="h-4 w-4 shrink-0 text-[#6B7178]" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar: equipamento, operação, máquina"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] text-[#1B1E22] placeholder-[#8A9097] outline-none shadow-none focus:ring-0"
        />
        {busca && (
          <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca" className="h-9 w-9 shrink-0 p-0 rounded-full bg-transparent text-[#5B6168] flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        )}
      </label>
      {!grupos.length && (
        <p className="py-6 text-center text-[14.5px] text-[#5B6168]">{lista.length ? 'Nenhum vídeo com esse texto.' : (vazio || 'Ainda não há vídeos cadastrados.')}</p>
      )}
      {grupos.map(g => (
        <section key={g.produto_id}>
          <p className="mb-1.5 px-0.5 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-[#6B7178]">{g.nome} ({g.videos.length})</p>
          <div className="space-y-2">
            {g.videos.map(v => <CartaoVideo key={v.id} v={v} fotoReserva={foto?.(v)} compacto />)}
          </div>
        </section>
      ))}
    </div>
  );
}
