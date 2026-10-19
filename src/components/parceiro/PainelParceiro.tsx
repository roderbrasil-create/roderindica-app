import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, getDoc, doc, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { frasePara, perfilInstalacao, type TipoMaquina } from '../../lib/instalacao';
import { Bot, ChevronRight, Package, Loader2 } from 'lucide-react';
import { cn, getApiBaseUrl } from '../../lib/utils';
import { abrirConsultor } from './NavParceiro';

// Tela inicial do PARCEIRO (indicador, vendedor parceiro, operador, dono de oficina).
// Aprovada pelo Jeferson em 18/10/2026: vitrine que dá vontade de indicar, e não central de controle.
// Versão 2 (aprovada na mesma noite): sem botões grandes no topo (Indicar fica na barra de baixo),
// foto maior na pronta entrega com "Enviar ao cliente", e desenhos das máquinas.

type Etapa = 0 | 1 | 2 | 3;
const ETAPAS = ['Recebida', 'Em atendimento', 'Orçamento', 'Vendida'];

// O andamento sai do que a equipe já faz no app: ninguém marca nada a mais.
function etapaDa(ind: any): { etapa: Etapa; perdida: boolean } {
  if (ind.status === 'sold') return { etapa: 3, perdida: false };
  if (ind.status === 'cancelled' || ind.status === 'archived') return { etapa: 0, perdida: true };
  const temOrcamento = !!(ind.budget_loaded || ind.budget_pdf_url || (ind.budget_pdf_urls || []).length || ind.budget_sent_at);
  if (temOrcamento) return { etapa: 2, perdida: false };
  if (ind.status === 'negotiating' || ind.internal_seller_uid) return { etapa: 1, perdida: false };
  return { etapa: 0, perdida: false };
}

const so = (t: any) => String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function Foto({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let vivo = true;
    if (!src) { setUrl(''); return; }
    if (src.startsWith('db-file://')) {
      getDoc(doc(db, 'app_files', src.slice(10))).then(s => { if (vivo) setUrl(String(s.data()?.data || '')); }).catch(() => {});
    } else setUrl(src);
    return () => { vivo = false; };
  }, [src]);
  return url ? <img src={url} alt={alt} className={className} referrerPolicy="no-referrer" /> : <Package className="h-12 w-12 text-slate-300" />;
}

// Desenhos das máquinas (no lugar de emoji): escavadeira, pá carregadeira, trator e caminhão Munck
function DesenhoMaquina({ tipo }: { tipo: TipoMaquina }) {
  const cls = 'w-16 h-10 mx-auto mb-1';
  if (tipo === 'escavadeira') return (
    <svg viewBox="0 0 64 40" className={cls}><rect x="6" y="30" width="30" height="8" rx="4" fill="#111"/><circle cx="11" cy="34" r="2" fill="#555"/><circle cx="31" cy="34" r="2" fill="#555"/><rect x="8" y="20" width="26" height="9" rx="1.5" fill="#facc15"/><rect x="20" y="11" width="12" height="10" rx="1.5" fill="#facc15"/><rect x="22" y="13" width="8" height="5" fill="#cfe8ff"/><path d="M30 18 L46 6 L56 14" stroke="#e0b100" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M56 14 L58 26 L50 26 Z" fill="#111"/></svg>
  );
  if (tipo === 'pa') return (
    <svg viewBox="0 0 64 40" className={cls}><circle cx="16" cy="31" r="7" fill="#111"/><circle cx="16" cy="31" r="2.5" fill="#888"/><circle cx="40" cy="31" r="7" fill="#111"/><circle cx="40" cy="31" r="2.5" fill="#888"/><path d="M6 27 V18 H30 V10 H40 V18 H46 V27 Z" fill="#facc15"/><rect x="31" y="12" width="7" height="6" fill="#cfe8ff"/><path d="M44 18 L54 22" stroke="#e0b100" strokeWidth="4" strokeLinecap="round"/><path d="M52 16 L61 16 L60 30 L52 26 Z" fill="#111"/></svg>
  );
  if (tipo === 'trator') return (
    <svg viewBox="0 0 64 40" className={cls}><circle cx="20" cy="27" r="11" fill="#111"/><circle cx="20" cy="27" r="4" fill="#888"/><circle cx="48" cy="32" r="6" fill="#111"/><circle cx="48" cy="32" r="2" fill="#888"/><path d="M12 18 V6 H28 L30 18 H54 V27 H32 Z" fill="#16a34a"/><rect x="15" y="8" width="11" height="9" fill="#cfe8ff"/><rect x="44" y="12" width="2.5" height="7" fill="#333"/></svg>
  );
  return (
    <svg viewBox="0 0 64 40" className={cls}><rect x="4" y="22" width="44" height="8" rx="1" fill="#facc15"/><path d="M46 30 V16 H54 L60 22 V30 Z" fill="#facc15"/><rect x="51" y="18" width="6" height="5" fill="#cfe8ff"/><circle cx="12" cy="33" r="4.5" fill="#111"/><circle cx="24" cy="33" r="4.5" fill="#111"/><circle cx="52" cy="33" r="4.5" fill="#111"/><path d="M40 22 V12 L20 4 L10 10" stroke="#e0b100" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 10 V18" stroke="#111" strokeWidth="1.5"/><path d="M7 18 h6 l-1 3 h-4 z" fill="#111"/></svg>
  );
}

// Link curto do parceiro (o pedido do cliente fica no nome dele) e a foto pronta para mandar junto
async function linkCurtoDe(pid: string, mid: string): Promise<string | null> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return null;
    const r = await fetch(`${getApiBaseUrl()}/api/link-curto`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ pid, mid }) });
    const j = await r.json().catch(() => ({}));
    return r.ok && j.codigo ? j.codigo : null;
  } catch { return null; }
}
async function fotoParaEnviar(src: string | undefined, nome: string): Promise<File | null> {
  if (!src) return null;
  try {
    let blob: Blob | null = null;
    if (src.startsWith('db-file://')) {
      const d = String((await getDoc(doc(db, 'app_files', src.slice(10)))).data()?.data || '');
      if (d.startsWith('data:image/')) blob = await (await fetch(d)).blob();
    } else {
      const abs = new URL(src, window.location.origin).href;
      const r = await fetch(abs.startsWith(window.location.origin) ? abs : `/api/documento?url=${encodeURIComponent(abs)}`);
      if (r.ok) blob = await r.blob();
    }
    if (!blob || !blob.type.startsWith('image/')) return null;
    const ext = blob.type.includes('png') ? 'png' : 'jpg';
    return new File([blob], `${nome.replace(/[^a-zA-Z0-9]+/g, '-')}-RODER.${ext}`, { type: blob.type });
  } catch { return null; }
}

export default function PainelParceiro() {
  const { profile, isRegionalSeller } = useAuth();
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [indicacoes, setIndicacoes] = useState<any[]>([]);
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [preparados, setPreparados] = useState<Record<string, { codigo: string | null; foto: File | null }>>({});
  const [usuarioPronto, setUsuarioPronto] = useState(!!auth.currentUser);
  useEffect(() => auth.onAuthStateChanged(u => setUsuarioPronto(!!u)), []);
  // se algum link não saiu, tenta de novo a cada 20 s enquanto a tela estiver aberta
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => { const t = setInterval(() => setTentativa(n => n + 1), 20000); return () => clearInterval(t); }, []);

  useEffect(() => {
    getDocs(collection(db, 'products')).then(s => setProdutos(s.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {});
    getDocs(query(collection(db, 'stock_items'), where('quantity', '>', 0))).then(s => setEstoque(s.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile?.uid) return;
    const u1 = onSnapshot(query(collection(db, 'indications'), where('external_seller_uid', '==', profile.uid), limit(200)),
      s => setIndicacoes(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    const u2 = isRegionalSeller ? () => {} : onSnapshot(query(collection(db, 'commissions'), where('external_seller_uid', '==', profile.uid)),
      s => setComissoes(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    return () => { u1(); u2(); };
  }, [profile?.uid, isRegionalSeller]);

  // Pronta entrega: o código do estoque casa com o código Roder do modelo; sem código, o nome do modelo
  const prontaEntrega = useMemo(() => {
    const achados: any[] = [];
    const vistos = new Set<string>();
    for (const item of estoque) {
      const cod = so(item.code);
      const desc = ` ${String(item.description || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ')} `;
      for (const p of produtos) {
        if (p.is_blocked) continue;
        for (const m of (p.models || [])) {
          const codModelo = so(m.technical_specs?.codigo_roder || m.codigo_roder);
          // nome inteiro, com fronteira: "CMF 50" não casa com "CMF500", "R250" não casa com "R2500"
          const partes = String(m.name || '').toUpperCase().match(/[A-Z]+|\d+/g) || [];
          const nomeOk = partes.length > 0 && /\d/.test(partes.join('')) && partes.join('').length >= 4;
          const casouNome = nomeOk && new RegExp(`(^|[^A-Z0-9])${partes.join('\\s*')}([^A-Z0-9]|$)`).test(desc);
          const casou = (codModelo && cod && codModelo === cod) || casouNome;
          if (!casou) continue;
          const chave = `${p.id}:${m.id}`;
          if (vistos.has(chave)) continue;
          vistos.add(chave);
          const nome = `${p.name || ''}`.toLowerCase().includes(String(m.name || '').toLowerCase()) ? p.name : `${p.name} ${m.name}`;
          const foto = (m.images || []).find((i: string) => i && !/\.run\.app\//.test(i)) || p.image_url;
          const specs = m.technical_specs || {};
          achados.push({ chave, produto: p, modelo: m, nome, foto, para: frasePara(perfilInstalacao(`${p.name} ${m.name}`, specs), `${p.name} ${m.name}`, specs.maquina_base) });
        }
      }
    }
    return achados.slice(0, 10);
  }, [estoque, produtos]);

  // prepara link e foto de cada equipamento da pronta entrega, para o envio abrir na hora do toque
  useEffect(() => {
    let vivo = true;
    (async () => {
      for (const it of prontaEntrega) {
        if (!vivo || preparados[it.chave]) continue;
        const [codigo, foto] = await Promise.all([linkCurtoDe(it.produto.id, it.modelo.id), fotoParaEnviar(it.foto, it.nome)]);
        // sem link (login ainda carregando, internet caiu): não marca como pronto, tenta de novo depois
        if (vivo && codigo) setPreparados(p => ({ ...p, [it.chave]: { codigo, foto } }));
      }
    })();
    return () => { vivo = false; };
  }, [prontaEntrega.map(i => i.chave).join(','), usuarioPronto, tentativa]);

  const enviarAoCliente = async (it: any) => {
    const prep = preparados[it.chave];
    if (!prep?.codigo) return;
    const texto = `*${it.nome} - RODER*\n` + (it.para ? `${it.para}\n` : '') + `✅ Pronta entrega\n\nhttps://roderindica.com/o/${prep.codigo}\n👆 Fotos, vídeo, ficha e orçamento`;
    if (prep.foto && typeof navigator.share === 'function' && navigator.canShare?.({ files: [prep.foto] })) {
      try { await navigator.share({ files: [prep.foto], text: texto }); return; }
      catch (e: any) { if (e?.name === 'AbortError') return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const ganhos = useMemo(() => {
    const recebido = comissoes.filter(c => c.status === 'paid').reduce((s, c) => s + (Number(c.value) || 0), 0);
    const aReceber = comissoes.filter(c => c.status !== 'paid').reduce((s, c) => s + (Number(c.value) || 0), 0);
    const emNegociacao = indicacoes.filter(i => i.status === 'negotiating').length;
    return { recebido, aReceber, emNegociacao };
  }, [comissoes, indicacoes]);

  const ultimas = useMemo(() => [...indicacoes]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .slice(0, 4), [indicacoes]);

  const primeiroNome = String(profile?.name || '').trim().split(/\s+/)[0] || 'parceiro';
  const maquinas: { id: TipoMaquina; nome: string }[] = [
    { id: 'escavadeira', nome: 'Escavadeira' },
    { id: 'pa', nome: 'Pá carregadeira' },
    { id: 'trator', nome: 'Trator' },
    { id: 'guindaste', nome: 'Guindaste' },
  ];
  const tituloSecao = 'text-[12px] font-black tracking-[0.12em] uppercase text-slate-500 dark:text-zinc-400';

  return (
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 pb-8 bg-[#f1f3f6] dark:bg-[#0f0f10] min-h-full">
      {/* Topo: só o nome. Indicar fica na barra de baixo, sempre à mão */}
      <div className="bg-[#0b0b0b] text-white px-4 py-3 md:px-8">
        <p className="text-xs text-slate-400">Olá,</p>
        <p className="text-lg font-extrabold leading-tight">{primeiroNome}</p>
      </div>

      {/* Pronta entrega */}
      {prontaEntrega.length > 0 && (
        <section className="pt-4">
          <div className="flex justify-between items-baseline px-4 md:px-8">
            <h2 className={tituloSecao}>🔥 Pronta entrega</h2>
            <button onClick={() => navigate('/estoque')} className="text-sm font-bold text-blue-600">ver tudo</button>
          </div>
          <p className="px-4 md:px-8 text-[12.5px] text-slate-500 mt-0.5 mb-2.5">Equipamentos com entrega imediata. Envie para o seu cliente.</p>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 md:px-8 pb-1 [scrollbar-width:none]">
            {prontaEntrega.map(it => {
              const pronto = !!preparados[it.chave]?.codigo;
              return (
                <div key={it.chave} className="snap-start shrink-0 w-[84%] max-w-[340px] bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                  <button onClick={() => navigate('/catalogo', { state: { openProductId: it.produto.id } })} className="relative h-[205px] w-full bg-white flex items-center justify-center">
                    <Foto src={it.foto} alt={it.nome} className="max-h-[195px] max-w-[92%] object-contain" />
                    <span className="absolute top-2.5 left-2.5 bg-green-600 text-white text-[11px] font-black px-2 py-1 rounded-md">PRONTA ENTREGA</span>
                  </button>
                  <div className="px-3 pb-3 pt-2">
                    <p className="font-black text-[16px] leading-tight">{it.nome}</p>
                    {it.para && <p className="text-xs text-slate-500 mt-0.5">{it.para}</p>}
                    <div className="grid grid-cols-[1.25fr_1fr] gap-1.5 mt-2.5">
                      <button onClick={() => enviarAoCliente(it)} disabled={!pronto} className="h-11 rounded-lg bg-[#25d366] text-white text-[13px] font-black flex items-center justify-center gap-1.5 disabled:opacity-60">
                        {pronto
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg>
                          : <Loader2 className="h-4 w-4 animate-spin" />}
                        Enviar ao cliente
                      </button>
                      <button onClick={() => navigate('/indicacoes/nova', { state: { product_name: it.produto.name } })} className="h-11 rounded-lg border-[1.5px] border-[#111] dark:border-zinc-300 text-[#111] dark:text-zinc-100 text-[13px] font-black">Indicar</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Máquina do cliente: abre o catálogo só com o que serve, cada modelo com o botão de WhatsApp */}
      <section className="px-4 md:px-8 pt-5">
        <h2 className={tituloSecao}>Qual a máquina do seu cliente?</h2>
        <p className="text-[12.5px] text-slate-500 mt-0.5 mb-2.5">Veja o que serve e envie ao cliente pelo WhatsApp.</p>
        <div className="grid grid-cols-4 gap-2 max-w-xl">
          {maquinas.map(m => (
            <button key={m.id} onClick={() => navigate('/catalogo', { state: { maquina: m.id } })} className="bg-white dark:bg-zinc-900 rounded-xl pt-2 pb-2.5 px-0.5 text-center shadow-sm active:scale-95">
              <DesenhoMaquina tipo={m.id} />
              <span className="block text-[11px] font-extrabold leading-tight text-[#111] dark:text-zinc-100">{m.nome}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Ganhos (parceiro comissionado) */}
      {!isRegionalSeller && (
        <section className="px-4 md:px-8 pt-5">
          <div className="flex justify-between items-center mb-2.5">
            <h2 className={tituloSecao}>Meus ganhos</h2>
            <button onClick={() => navigate('/comissoes')} className="text-sm font-bold text-blue-600">detalhes</button>
          </div>
          <div className="grid grid-cols-3 gap-2 max-w-xl">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-2.5 shadow-sm"><p className="text-[10.5px] font-bold text-slate-500">Já recebi</p><p className="text-[15px] font-black mt-0.5">{brl(ganhos.recebido)}</p></div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-2.5 shadow-sm"><p className="text-[10.5px] font-bold text-slate-500">A receber</p><p className="text-[15px] font-black mt-0.5 text-green-600">{brl(ganhos.aReceber)}</p></div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-2.5 shadow-sm"><p className="text-[10.5px] font-bold text-slate-500">Em negociação</p><p className="text-[15px] font-black mt-0.5 text-blue-600">{ganhos.emNegociacao}</p></div>
          </div>
        </section>
      )}

      {/* Indicações com o andamento */}
      <section className="px-4 md:px-8 pt-5">
        <div className="flex justify-between items-center mb-2.5">
          <h2 className={tituloSecao}>Minhas indicações</h2>
          <button onClick={() => navigate('/indicacoes')} className="text-sm font-bold text-blue-600">ver todas</button>
        </div>
        {ultimas.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm text-sm text-slate-600 max-w-xl">
            Você ainda não tem indicações. Toque em <b>Indicar cliente</b> ou envie um equipamento pelo WhatsApp: o pedido do cliente fica no seu nome.
          </div>
        ) : (
          <div className="space-y-2 max-w-xl">
            {ultimas.map(ind => {
              const { etapa, perdida } = etapaDa(ind);
              const produto = ind.items?.[0]?.product_name || ind.product_name || ind.base_machine || '';
              return (
                <button key={ind.id} onClick={() => navigate('/indicacoes')} className="w-full text-left bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-[14px] font-extrabold truncate">{ind.client_name || 'Cliente'}</span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[45%] text-right">{produto}</span>
                  </div>
                  {perdida ? (
                    <p className="text-[12px] font-bold text-slate-500 mt-2">Não fechou desta vez</p>
                  ) : (
                    <>
                      <div className="flex items-center mt-2.5">
                        {ETAPAS.map((_, i) => (
                          <div key={i} className={cn('flex items-center', i < 3 && 'flex-1')}>
                            <span className={cn('h-3 w-3 rounded-full shrink-0', i <= etapa ? 'bg-green-600' : 'bg-zinc-300')} />
                            {i < 3 && <span className={cn('h-[3px] flex-1', i < etapa ? 'bg-green-600' : 'bg-zinc-300')} />}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[9.5px] font-bold text-slate-500 mt-1">
                        {ETAPAS.map((e, i) => <span key={e} className={cn(i === etapa && 'text-green-700')}>{e}</span>)}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Consultor */}
      <section className="px-4 md:px-8 pt-5">
        <div className="bg-[#111] text-white rounded-2xl p-4 max-w-xl">
          <button onClick={() => abrirConsultor()} className="w-full text-left flex items-start gap-2">
            <Bot className="h-6 w-6 text-[#facc15] shrink-0 mt-0.5" />
            <span>
              <span className="block font-bold text-[15px]">Dúvida técnica? Pergunte ao Consultor Roder</span>
              <span className="block text-xs text-slate-400 mt-0.5">Responde na hora qual equipamento serve na máquina do cliente.</span>
            </span>
            <ChevronRight className="h-5 w-5 ml-auto text-slate-500 shrink-0" />
          </button>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {['Qual garra para escavadeira de 20 t?', 'O que serve numa pá carregadeira?', 'Feller ou cabeçote multifuncional?'].map(q => (
              <button key={q} onClick={() => abrirConsultor(q)} className="text-[12px] bg-[#262626] border border-[#3a3a3a] rounded-full px-3 py-1.5 active:scale-95">{q}</button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
