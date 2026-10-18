import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, getDoc, doc, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { frasePara, perfilInstalacao, type TipoMaquina } from '../../lib/instalacao';
import { Plus, Send, Bot, ChevronRight, Package } from 'lucide-react';
import { cn } from '../../lib/utils';

// Tela inicial do PARCEIRO (indicador, vendedor parceiro, operador, dono de oficina).
// Aprovada pelo Jeferson em 18/10/2026: vitrine que dá vontade de indicar, e não central de controle.
// Ordem: indicar/enviar, pronta entrega, máquina do cliente, ganhos, indicações, consultor.

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

export default function PainelParceiro() {
  const { profile, isRegionalSeller } = useAuth();
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [indicacoes, setIndicacoes] = useState<any[]>([]);
  const [comissoes, setComissoes] = useState<any[]>([]);

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
  const abrirConsultor = (pergunta?: string) => window.dispatchEvent(new CustomEvent('roder:abrir-consultor', { detail: { pergunta } }));
  const maquinas: { id: TipoMaquina; nome: string; emoji: string }[] = [
    { id: 'escavadeira', nome: 'Escavadeira', emoji: '🚜' },
    { id: 'pa', nome: 'Pá carregadeira', emoji: '🏗️' },
    { id: 'trator', nome: 'Trator', emoji: '🚜' },
    { id: 'guindaste', nome: 'Guindaste', emoji: '🏗️' },
  ];
  const tituloSecao = 'text-[12px] font-black tracking-[0.12em] uppercase text-slate-500';

  return (
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 pb-8 bg-[#f1f3f6] min-h-full">
      {/* Topo */}
      <div className="bg-[#0b0b0b] text-white px-4 pt-4 pb-5 md:px-8">
        <p className="text-sm text-slate-400">Olá,</p>
        <p className="text-xl font-extrabold leading-tight">{primeiroNome}</p>
        <div className="grid grid-cols-2 gap-2 mt-4 max-w-xl">
          <button onClick={() => navigate('/indicacoes/nova')} className="h-14 rounded-xl bg-[#facc15] text-black font-black text-[15px] flex items-center justify-center gap-1.5 active:scale-95">
            <Plus className="h-5 w-5" /> Indicar cliente
          </button>
          <button onClick={() => navigate('/catalogo')} className="h-14 rounded-xl bg-[#1f1f1f] border border-[#333] text-white font-bold text-[14px] flex items-center justify-center gap-1.5 active:scale-95">
            <Send className="h-4 w-4" /> Enviar equipamento
          </button>
        </div>
      </div>

      {/* Pronta entrega */}
      {prontaEntrega.length > 0 && (
        <section className="pt-4">
          <div className="flex justify-between items-center px-4 md:px-8 mb-2.5">
            <h2 className={tituloSecao}>🔥 Pronta entrega</h2>
            <button onClick={() => navigate('/estoque')} className="text-sm font-bold text-blue-600">ver estoque</button>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 md:px-8 pb-1 [scrollbar-width:none]">
            {prontaEntrega.map(it => (
              <div key={it.chave} className="snap-start shrink-0 w-[78%] max-w-[320px] bg-white rounded-2xl overflow-hidden shadow-sm">
                <button onClick={() => navigate('/catalogo', { state: { openProductId: it.produto.id } })} className="relative h-40 w-full bg-white flex items-center justify-center">
                  <Foto src={it.foto} alt={it.nome} className="max-h-36 max-w-[90%] object-contain" />
                  <span className="absolute top-2.5 left-2.5 bg-green-600 text-white text-[11px] font-black px-2 py-1 rounded-md">PRONTA ENTREGA</span>
                </button>
                <div className="px-3 pb-3 pt-2">
                  <p className="font-black text-[16px] leading-tight">{it.nome}</p>
                  {it.para && <p className="text-xs text-slate-500 mt-0.5">{it.para}</p>}
                  <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                    <button onClick={() => navigate('/catalogo', { state: { openProductId: it.produto.id } })} className="h-10 rounded-lg bg-[#e9f8ef] border border-[#bfe7cc] text-[#075e54] text-[13px] font-extrabold">WhatsApp</button>
                    <button onClick={() => navigate('/indicacoes/nova', { state: { product_name: it.produto.name } })} className="h-10 rounded-lg bg-[#22c55e] text-white text-[13px] font-black">INDICAR</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Máquina do cliente */}
      <section className="px-4 md:px-8 pt-5">
        <h2 className={cn(tituloSecao, 'mb-2.5')}>Qual a máquina do seu cliente?</h2>
        <div className="grid grid-cols-4 gap-2 max-w-xl">
          {maquinas.map(m => (
            <button key={m.id} onClick={() => navigate('/catalogo', { state: { maquina: m.id } })} className="bg-white rounded-xl py-2.5 px-1 text-center shadow-sm active:scale-95">
              <span className="block text-2xl">{m.emoji}</span>
              <span className="block text-[11px] font-extrabold leading-tight mt-1">{m.nome}</span>
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
            <div className="bg-white rounded-xl p-2.5 shadow-sm"><p className="text-[10.5px] font-bold text-slate-500">Já recebi</p><p className="text-[15px] font-black mt-0.5">{brl(ganhos.recebido)}</p></div>
            <div className="bg-white rounded-xl p-2.5 shadow-sm"><p className="text-[10.5px] font-bold text-slate-500">A receber</p><p className="text-[15px] font-black mt-0.5 text-green-600">{brl(ganhos.aReceber)}</p></div>
            <div className="bg-white rounded-xl p-2.5 shadow-sm"><p className="text-[10.5px] font-bold text-slate-500">Em negociação</p><p className="text-[15px] font-black mt-0.5 text-blue-600">{ganhos.emNegociacao}</p></div>
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
          <div className="bg-white rounded-xl p-4 shadow-sm text-sm text-slate-600 max-w-xl">
            Você ainda não tem indicações. Toque em <b>Indicar cliente</b> ou envie um equipamento pelo WhatsApp: o pedido do cliente fica no seu nome.
          </div>
        ) : (
          <div className="space-y-2 max-w-xl">
            {ultimas.map(ind => {
              const { etapa, perdida } = etapaDa(ind);
              const produto = ind.items?.[0]?.product_name || ind.product_name || ind.base_machine || '';
              return (
                <button key={ind.id} onClick={() => navigate('/indicacoes')} className="w-full text-left bg-white rounded-xl p-3 shadow-sm">
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
