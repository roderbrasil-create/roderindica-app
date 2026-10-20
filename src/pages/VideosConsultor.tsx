import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, writeBatch,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ArrowDown, ArrowUp, Loader2, Pencil, Play, Plus, Trash2, Video, X } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '../components/layout/Layout';
import { EnvioDeVideo } from '../components/catalog/EnvioDeVideo';
import { PlayerVideo } from '../components/video/VideoEquipamento';
import { carregarVideosConsultor } from '../components/video/VideosConsultor';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../lib/firebase';
import { cn } from '../lib/utils';
import { lerVideoLocal } from '../lib/quadroDoVideo';
import { tituloFicha } from '../lib/tituloFicha';
import {
  capaDoVideo, formatarDuracao, lerVideoDoBanco, MAX_CONTEXTO, MAX_TITULO, ROTULO_TIPO, TIPOS_VIDEO,
  videosDoCatalogo, type TipoVideo, type VideoConsultor,
} from '../lib/videosConsultor';
import type { Product } from '../types';

// Vídeos do consultor (pedido do Jeferson em 19/10/2026): admin, gerência e marketing cadastram.
// Cada vídeo tem equipamento, modelo (opcional), título curto e o CONTEXTO, que é o que o consultor
// lê para escolher o vídeo certo da pergunta. Os vídeos do catálogo entram sozinhos (lista de baixo).

type Linha = VideoConsultor & { ativo: boolean };
type Rascunho = {
  id?: string;
  produto_id: string;
  modelo_id: string;
  titulo: string;
  contexto: string;
  tipo: Exclude<TipoVideo, 'catalogo'>;
  video_url: string;
  thumb_url: string;
  duracao_s: number;
  no_carrossel: boolean;
  ativo: boolean;
};
const vazio = (): Rascunho => ({ produto_id: '', modelo_id: '', titulo: '', contexto: '', tipo: 'campo', video_url: '', thumb_url: '', duracao_s: 0, no_carrossel: false, ativo: true });

const PASTA = 'consultor_videos';
const LIMITE_MB = 80;

function Chave({ ligada, onMudar, rotulo, desligada = false }: { ligada: boolean; onMudar: (v: boolean) => void; rotulo: string; desligada?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      aria-label={rotulo}
      disabled={desligada}
      onClick={() => onMudar(!ligada)}
      // 34x20 de desenho, 44px de toque
      className="relative h-11 w-12 shrink-0 p-0 bg-transparent flex items-center justify-center disabled:opacity-40"
    >
      <span className={cn('relative block h-5 w-[34px] rounded-full transition-colors', ligada ? 'bg-[#1FA855]' : 'bg-[#C9CED4]')}>
        <span className={cn('absolute top-[3px] h-[14px] w-[14px] rounded-full bg-white transition-all', ligada ? 'left-[17px]' : 'left-[3px]')} />
      </span>
    </button>
  );
}

function Miniatura({ v, foto }: { v: Pick<VideoConsultor, 'thumb_url' | 'video_url' | 'duracao_s'>; foto?: string }) {
  const [falhou, setFalhou] = useState(false);
  const capa = capaDoVideo(v);
  const src = !falhou && capa ? capa : foto;
  return (
    <div className="relative h-[54px] w-[88px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#3A4048] to-[#1B1E22] flex items-center justify-center">
      {src && <img src={src} alt="" loading="lazy" onError={() => setFalhou(true)} className={cn('absolute inset-0 h-full w-full', capa && !falhou ? 'object-cover' : 'object-contain bg-[#F1F2F4] p-1')} />}
      <Play className="relative h-4 w-4 fill-white text-white drop-shadow" />
      {v.duracao_s ? <span className="absolute right-1 bottom-1 rounded bg-[rgba(0,0,0,0.72)] px-1 text-[10px] font-bold text-white">{formatarDuracao(v.duracao_s)}</span> : null}
    </div>
  );
}

function SeloTipo({ tipo }: { tipo: TipoVideo }) {
  return (
    <span className={cn('inline-block rounded-md px-2 py-[3px] text-[11px] font-extrabold leading-none',
      tipo === 'campo' ? 'bg-[#DCFCE7] text-[#14532D]' : tipo === 'catalogo' ? 'bg-[#F1F2F4] text-[#3E444B]' : 'bg-[#FFF7D1] text-[#7A5F00]')}>
      {ROTULO_TIPO[tipo]}
    </span>
  );
}

export default function VideosConsultor() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [docs, setDocs] = useState<{ id: string; data: any }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState<Rascunho | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [capaLocal, setCapaLocal] = useState<{ blob: Blob; url: string } | null>(null);
  const [tocando, setTocando] = useState<string | null>(null);

  useEffect(() => {
    getDocs(query(collection(db, 'products'), orderBy('name', 'asc')))
      .then(s => setProdutos(s.docs.map(d => ({ id: d.id, ...d.data() } as Product)).filter(p => !p.is_blocked)))
      .catch(() => toast.error('Não consegui carregar o catálogo.'));
    const pare = onSnapshot(collection(db, 'consultor_videos'), s => {
      setDocs(s.docs.map(d => ({ id: d.id, data: d.data() })));
      setCarregando(false);
    }, () => { setCarregando(false); toast.error('Não consegui carregar os vídeos.'); });
    return pare;
  }, []);

  // inativos também aparecem aqui (com a chave desligada); o consultor só vê os ativos
  const linhas: Linha[] = useMemo(() => docs
    .map(d => { const v = lerVideoDoBanco(d.id, { ...d.data, ativo: true }); return v ? { ...v, ativo: d.data?.ativo !== false } : null; })
    .filter(Boolean)
    .sort((a, b) => (a!.ordem || 0) - (b!.ordem || 0)) as Linha[], [docs]);
  const doCatalogo = useMemo(() => videosDoCatalogo(produtos, new Set(linhas.map(l => l.video_url))), [produtos, linhas]);

  const prodDe = (pid: string) => produtos.find(p => p.id === pid);
  const fotoDe = (v: Pick<VideoConsultor, 'produto_id' | 'modelo_id'>) => {
    const p = prodDe(v.produto_id);
    const m = p && v.modelo_id ? (p.models || []).find(x => x.id === v.modelo_id) : undefined;
    return (m?.images || []).find(Boolean) || m?.image_url || p?.image_url || undefined;
  };
  const nomeDe = (v: Pick<VideoConsultor, 'equipamento_nome' | 'modelo_nome'>) => tituloFicha({ name: v.equipamento_nome }, { name: v.modelo_nome || '' });

  const avisarServidor = () => { carregarVideosConsultor(true).catch(() => {}); };

  const abrirNovo = (base?: Partial<Rascunho>) => { setCapaLocal(null); setForm({ ...vazio(), ...base }); };
  const editar = (l: Linha) => {
    setCapaLocal(null);
    setForm({
      id: l.id, produto_id: l.produto_id, modelo_id: l.modelo_id || '', titulo: l.titulo, contexto: l.contexto,
      tipo: (l.tipo === 'catalogo' ? 'campo' : l.tipo), video_url: l.video_url, thumb_url: l.thumb_url || '',
      duracao_s: l.duracao_s || 0, no_carrossel: !!l.no_carrossel, ativo: l.ativo,
    });
  };
  const fechar = () => { if (salvando || enviando) return; if (capaLocal) URL.revokeObjectURL(capaLocal.url); setCapaLocal(null); setForm(null); };

  const mudarCampo = async (l: Linha, campos: Record<string, any>) => {
    try {
      await updateDoc(doc(db, 'consultor_videos', l.id), { ...campos, atualizado_em: new Date().toISOString() });
      avisarServidor();
    } catch (e: any) {
      toast.error('Não consegui gravar. ' + (e?.code === 'permission-denied' ? 'Seu acesso não permite.' : 'Tente de novo.'));
    }
  };

  const mover = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= linhas.length) return;
    const lote = writeBatch(db);
    const agora = new Date().toISOString();
    // regrava a ordem de todos (0, 1, 2...) com os dois trocados: a ordem antiga podia ter repetidos
    const nova = [...linhas];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    nova.forEach((l, k) => { if (l.ordem !== k) lote.update(doc(db, 'consultor_videos', l.id), { ordem: k, atualizado_em: agora }); });
    try { await lote.commit(); avisarServidor(); } catch { toast.error('Não consegui mudar a ordem.'); }
  };

  const apagarArquivo = async (url?: string) => {
    if (!url || !/firebasestorage\.googleapis\.com/.test(url) || !/consultor_videos%2F/.test(url)) return;
    try { await deleteObject(ref(storage, url)); } catch { /* o cadastro já saiu; o arquivo fica */ }
  };

  const apagar = async (l: Linha) => {
    if (!window.confirm(`Apagar o vídeo "${l.titulo}"? Ele sai do consultor na hora.`)) return;
    try {
      await deleteDoc(doc(db, 'consultor_videos', l.id));
      avisarServidor();
      toast.success('Vídeo apagado.');
      await apagarArquivo(l.video_url);
      await apagarArquivo(l.thumb_url);
    } catch {
      toast.error('Não consegui apagar.');
    }
  };

  // arquivo escolhido (já compactado): duração e capa tiradas no próprio celular
  const aoArquivo = async (arquivo: File) => {
    const { duracao, capa } = await lerVideoLocal(arquivo);
    setForm(f => f ? { ...f, duracao_s: Math.round(duracao) || f.duracao_s, thumb_url: capa ? '' : f.thumb_url } : f);
    if (capa) setCapaLocal(c => { if (c) URL.revokeObjectURL(c.url); return { blob: capa, url: URL.createObjectURL(capa) }; });
  };

  const salvar = async () => {
    if (!form) return;
    const p = prodDe(form.produto_id);
    const m = p && form.modelo_id ? (p.models || []).find(x => x.id === form.modelo_id) : undefined;
    if (!p) { toast.error('Escolha o equipamento.'); return; }
    if (!form.titulo.trim()) { toast.error('Escreva um título curto.'); return; }
    if (!form.video_url.trim()) { toast.error('Envie o vídeo ou cole o link do YouTube.'); return; }
    if (!/^https:\/\//i.test(form.video_url.trim())) { toast.error('O link do vídeo tem de começar com https://'); return; }
    setSalvando(true);
    try {
      let thumb = form.thumb_url;
      if (capaLocal) {
        try {
          const r = ref(storage, `${PASTA}/capas/${Date.now()}.jpg`);
          await uploadBytes(r, capaLocal.blob, { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' });
          thumb = await getDownloadURL(r);
        } catch { /* sem capa o cartão usa a foto do equipamento */ }
      }
      const agora = new Date().toISOString();
      const id = form.id || doc(collection(db, 'consultor_videos')).id;
      const dados: any = {
        produto_id: p.id,
        modelo_id: m?.id || '',
        equipamento_nome: p.name || '',
        modelo_nome: m?.name || '',
        tipo: form.tipo,
        contexto: form.contexto.trim().slice(0, MAX_CONTEXTO),
        titulo: form.titulo.trim().slice(0, MAX_TITULO),
        video_url: form.video_url.trim(),
        thumb_url: thumb || '',
        duracao_s: Math.round(form.duracao_s || 0),
        no_carrossel: form.no_carrossel,
        ativo: form.ativo,
        atualizado_em: agora,
      };
      if (!form.id) {
        dados.ordem = linhas.length ? Math.max(...linhas.map(l => l.ordem || 0)) + 1 : 0;
        dados.criado_por = user?.uid || '';
        dados.criado_em = agora;
      }
      await setDoc(doc(db, 'consultor_videos', id), dados, { merge: true });
      avisarServidor();
      toast.success(form.id ? 'Vídeo atualizado.' : 'Vídeo cadastrado. Já aparece no consultor.');
      if (capaLocal) URL.revokeObjectURL(capaLocal.url);
      setCapaLocal(null);
      setForm(null);
    } catch (e: any) {
      toast.error(e?.code === 'permission-denied' ? 'Seu acesso não permite cadastrar vídeo.' : 'Não consegui salvar. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  };

  const produtoForm = form ? prodDe(form.produto_id) : undefined;

  return (
    <Layout>
      <div className="vc-pagina mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-6 text-[#1B1E22]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="fonte-titulo m-0 text-[22px] sm:text-[26px] font-extrabold leading-tight text-foreground">Vídeos do consultor</h1>
            <p className="m-0 mt-1 text-[14px] text-muted-foreground">Cada vídeo ligado a um equipamento. O consultor mostra quando perguntam, e os marcados passam no carrossel.</p>
          </div>
          <button type="button" onClick={() => abrirNovo()} className="h-11 shrink-0 rounded-xl bg-[#F6C400] px-4 text-[14.5px] font-extrabold text-[#1B1E22] flex items-center gap-1.5 active:scale-[0.98] transition">
            <Plus className="h-4 w-4" /> <span className="hidden min-[400px]:inline">Novo vídeo</span><span className="min-[400px]:hidden">Novo</span>
          </button>
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E2E5E8] bg-white">
          <div className="hidden md:grid grid-cols-[96px_minmax(0,1fr)_110px_90px_70px_96px_96px] items-center gap-3 border-b border-[#E2E5E8] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#5E6672]">
            <span /><span>Equipamento / vídeo</span><span>Tipo</span><span>Carrossel</span><span>Ativo</span><span>Ordem</span><span />
          </div>
          {carregando ? (
            <p className="flex items-center justify-center gap-2 p-8 text-[14px] text-[#5E6672]"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</p>
          ) : !linhas.length ? (
            <div className="p-8 text-center">
              <Video className="mx-auto h-8 w-8 text-[#9AA1A9]" />
              <p className="m-0 mt-2 text-[14.5px] text-[#5E6672]">Nenhum vídeo cadastrado ainda. Toque em "Novo vídeo".</p>
            </div>
          ) : linhas.map((l, i) => (
            <div key={l.id} className={cn('border-b border-[#EEF0F2] last:border-b-0 px-3 py-3 md:px-4', !l.ativo && 'bg-[#FAFAFB]')}>
              <div className="grid grid-cols-[88px_minmax(0,1fr)_44px] md:grid-cols-[96px_minmax(0,1fr)_110px_90px_70px_96px_96px] items-center gap-x-3 gap-y-2">
                <button type="button" onClick={() => setTocando(tocando === l.id ? null : l.id)} aria-label={`Ver o vídeo ${l.titulo}`} className="h-auto w-auto p-0 bg-transparent">
                  <Miniatura v={l} foto={fotoDe(l)} />
                </button>
                <div className={cn('min-w-0', !l.ativo && 'opacity-60')}>
                  <p className="m-0 text-[14.5px] font-extrabold leading-tight break-words">{nomeDe(l)}</p>
                  <p className="m-0 mt-0.5 text-[13.5px] font-semibold text-[#3E444B] break-words">{l.titulo}</p>
                  {l.contexto && <p className="m-0 mt-0.5 text-[12.5px] text-[#5E6672] line-clamp-2">{l.contexto}</p>}
                  <div className="mt-1 md:hidden"><SeloTipo tipo={l.tipo} /></div>
                </div>
                <div className="hidden md:block"><SeloTipo tipo={l.tipo} /></div>
                {/* celular: chaves e ordem numa linha embaixo; editar e apagar à direita do título */}
                <div className="col-span-3 md:col-span-1 md:contents flex items-center justify-between gap-1 border-t border-[#F1F2F4] pt-1 md:border-0 md:pt-0">
                  <label className="flex items-center text-[12.5px] font-bold text-[#3E444B] md:block">
                    <span className="md:hidden">Carrossel</span>
                    <Chave ligada={!!l.no_carrossel} rotulo="Passa no carrossel" onMudar={(v) => mudarCampo(l, { no_carrossel: v })} />
                  </label>
                  <label className="flex items-center text-[12.5px] font-bold text-[#3E444B] md:block">
                    <span className="md:hidden">Ativo</span>
                    <Chave ligada={l.ativo} rotulo="Ativo no consultor" onMudar={(v) => mudarCampo(l, { ativo: v })} />
                  </label>
                  <div className="flex items-center">
                    <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir" className="h-11 w-11 p-0 rounded-lg bg-transparent text-[#1B1E22] flex items-center justify-center disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => mover(i, 1)} disabled={i === linhas.length - 1} aria-label="Descer" className="h-11 w-11 p-0 rounded-lg bg-transparent text-[#1B1E22] flex items-center justify-center disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="col-start-3 row-start-1 flex flex-col items-center md:col-auto md:row-auto md:flex-row">
                    <button type="button" onClick={() => editar(l)} aria-label="Editar" className="h-11 w-11 p-0 rounded-lg bg-transparent text-[#1B1E22] flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => apagar(l)} aria-label="Apagar" className="h-11 w-11 p-0 rounded-lg bg-transparent text-[#B42318] flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {tocando === l.id && (
                <PlayerVideo url={l.video_url} titulo={l.titulo} onFechar={() => setTocando(null)} comAcoes={false} className="mt-2.5 max-w-[560px] [&>div:first-child]:rounded-xl" />
              )}
            </div>
          ))}
        </section>

        {doCatalogo.length > 0 && (
          <section className="mt-6">
            <h2 className="fonte-titulo m-0 text-[17px] font-extrabold text-foreground">Do catálogo ({doCatalogo.length})</h2>
            <p className="m-0 mt-0.5 text-[13.5px] text-muted-foreground">Entram sozinhos no consultor. Para escrever o contexto ou pôr no carrossel, toque em "Usar aqui".</p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#E2E5E8] bg-white">
              {doCatalogo.map(v => (
                <div key={v.id} className="flex items-center gap-3 border-b border-[#EEF0F2] last:border-b-0 px-3 py-2.5 md:px-4">
                  <button type="button" onClick={() => setTocando(tocando === v.id ? null : v.id)} aria-label={`Ver o vídeo ${v.titulo}`} className="h-auto w-auto p-0 bg-transparent">
                    <Miniatura v={v} foto={fotoDe(v)} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[14px] font-extrabold leading-tight break-words">{v.titulo}</p>
                    <div className="mt-1"><SeloTipo tipo="catalogo" /></div>
                    {tocando === v.id && <PlayerVideo url={v.video_url} titulo={v.titulo} onFechar={() => setTocando(null)} comAcoes={false} className="mt-2 max-w-[560px] [&>div:first-child]:rounded-xl" />}
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirNovo({ produto_id: v.produto_id, modelo_id: v.modelo_id || '', titulo: v.titulo, video_url: v.video_url, tipo: 'campo' })}
                    className="h-11 shrink-0 rounded-xl border-[1.5px] border-[#1B1E22] bg-white px-3 text-[13.5px] font-extrabold text-[#1B1E22]"
                  >
                    Usar aqui
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center">
          <button type="button" aria-label="Fechar" onClick={fechar} className="absolute inset-0 h-auto w-auto p-0 rounded-none bg-black/45 cursor-default" />
          <div role="dialog" aria-label={form.id ? 'Editar vídeo' : 'Novo vídeo'} className="relative flex max-h-[92dvh] w-full flex-col rounded-t-[22px] bg-white text-[#1B1E22] shadow-2xl md:max-w-[620px] md:rounded-2xl pb-[env(safe-area-inset-bottom,0px)]">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#E2E5E8] pl-5 pr-2 py-1.5">
              <p className="fonte-titulo m-0 text-[18px] font-extrabold">{form.id ? 'Editar vídeo' : 'Novo vídeo'}</p>
              <button type="button" onClick={fechar} aria-label="Fechar" className="h-11 w-11 p-0 rounded-xl bg-transparent text-[#1B1E22] flex items-center justify-center"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[13px] font-bold text-[#3E444B]">Equipamento</span>
                  <select
                    value={form.produto_id}
                    onChange={(e) => setForm({ ...form, produto_id: e.target.value, modelo_id: '' })}
                    className="mt-1 h-11 w-full rounded-xl border border-[#C9CED4] bg-white px-3 text-[16px] text-[#1B1E22]"
                  >
                    <option value="">Escolha...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-[#3E444B]">Modelo <span className="font-medium text-[#6B7178]">(opcional)</span></span>
                  <select
                    value={form.modelo_id}
                    disabled={!produtoForm || !(produtoForm.models || []).length}
                    onChange={(e) => setForm({ ...form, modelo_id: e.target.value })}
                    className="mt-1 h-11 w-full rounded-xl border border-[#C9CED4] bg-white px-3 text-[16px] text-[#1B1E22] disabled:bg-[#F3F4F6]"
                  >
                    <option value="">Todos os modelos</option>
                    {(produtoForm?.models || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-[13px] font-bold text-[#3E444B]">Título</span>
                <input
                  value={form.titulo}
                  maxLength={MAX_TITULO}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex.: Traçando eucalipto de 3 m"
                  className="mt-1 h-11 w-full rounded-xl border border-[#C9CED4] bg-white px-3 text-[16px] text-[#1B1E22] placeholder-[#8A9097]"
                />
              </label>

              <label className="block">
                <span className="text-[13px] font-bold text-[#3E444B]">Contexto</span>
                <textarea
                  value={form.contexto}
                  maxLength={MAX_CONTEXTO}
                  rows={3}
                  onChange={(e) => setForm({ ...form, contexto: e.target.value })}
                  placeholder="Ex.: CMF 600 derrubando e traçando metrinho, eucalipto, em PC200"
                  className="mt-1 w-full rounded-xl border border-[#C9CED4] bg-white px-3 py-2.5 text-[16px] leading-snug text-[#1B1E22] placeholder-[#8A9097]"
                />
                <span className="mt-1 block text-[12.5px] leading-snug text-[#5E6672]">
                  O consultor lê este texto para escolher o vídeo. Diga a operação, o material ou a madeira, e a máquina base.
                </span>
              </label>

              <div>
                <span className="text-[13px] font-bold text-[#3E444B]">Tipo</span>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {TIPOS_VIDEO.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm({ ...form, tipo: t.id })}
                      aria-pressed={form.tipo === t.id}
                      className={cn('h-11 rounded-xl border-[1.5px] text-[14px] font-extrabold transition',
                        form.tipo === t.id ? 'border-[#1B1E22] bg-[#1B1E22] text-white' : 'border-[#C9CED4] bg-white text-[#1B1E22]')}
                    >
                      {t.rotulo}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[13px] font-bold text-[#3E444B]">Vídeo</span>
                <p className="m-0 mb-1.5 text-[12.5px] text-[#5E6672]">MP4 da galeria (até {LIMITE_MB} MB, compactado no celular) ou link do YouTube.</p>
                <EnvioDeVideo
                  valor={form.video_url}
                  aoMudar={(url) => setForm(f => f ? { ...f, video_url: url, ...(url ? {} : { duracao_s: 0, thumb_url: '' }) } : f)}
                  pasta={PASTA}
                  aoEnviando={setEnviando}
                  titulo={form.titulo || 'Vídeo'}
                  limiteMb={LIMITE_MB}
                  aoArquivoPronto={aoArquivo}
                />
                {(capaLocal || capaDoVideo({ thumb_url: form.thumb_url, video_url: form.video_url })) && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={capaLocal?.url || capaDoVideo({ thumb_url: form.thumb_url, video_url: form.video_url })} alt="Capa do vídeo" className="h-[63px] w-[112px] rounded-lg object-cover bg-[#1B1E22]" />
                    <p className="m-0 text-[12.5px] text-[#5E6672]">
                      Capa{form.duracao_s ? ` · ${formatarDuracao(form.duracao_s)}` : ''}
                      {capaLocal ? ' (tirada do vídeo)' : ''}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#E2E5E8] divide-y divide-[#EEF0F2]">
                <label className="flex items-center justify-between gap-3 pl-3.5 pr-1">
                  <span className="py-2">
                    <span className="block text-[14.5px] font-bold">Passa no carrossel</span>
                    <span className="block text-[12.5px] text-[#5E6672]">Junto da pronta entrega, na tela inicial do consultor</span>
                  </span>
                  <Chave ligada={form.no_carrossel} rotulo="Passa no carrossel" onMudar={(v) => setForm({ ...form, no_carrossel: v })} />
                </label>
                <label className="flex items-center justify-between gap-3 pl-3.5 pr-1">
                  <span className="py-2">
                    <span className="block text-[14.5px] font-bold">Ativo</span>
                    <span className="block text-[12.5px] text-[#5E6672]">Desligado, o consultor não mostra</span>
                  </span>
                  <Chave ligada={form.ativo} rotulo="Ativo no consultor" onMudar={(v) => setForm({ ...form, ativo: v })} />
                </label>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 border-t border-[#E2E5E8] px-5 py-3">
              <button type="button" onClick={fechar} disabled={salvando || enviando} className="h-12 flex-1 rounded-xl border-[1.5px] border-[#1B1E22] bg-white text-[15px] font-extrabold text-[#1B1E22] disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={salvar} disabled={salvando || enviando} className="h-12 flex-[2] rounded-xl bg-[#F6C400] text-[15px] font-extrabold text-[#1B1E22] flex items-center justify-center gap-2 disabled:opacity-60">
                {salvando ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : enviando ? 'Aguarde o envio...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
