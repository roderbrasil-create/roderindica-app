import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, getDoc, doc, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { frasePara, perfilInstalacao, type TipoMaquina } from '../../lib/instalacao';
import { Package, Loader2 } from 'lucide-react';
import { cn, getApiBaseUrl } from '../../lib/utils';

// Tela inicial do PARCEIRO (indicador, vendedor parceiro, operador, dono de oficina).
// Aprovada pelo Jeferson em 18/10/2026: vitrine que dá vontade de indicar, e não central de controle.
// Versão 2 (aprovada na mesma noite): sem botões grandes no topo (Indicar fica na barra de baixo),
// foto maior na pronta entrega com "Enviar ao cliente", e desenhos das máquinas.
// Versão 3 (aprovada em 19/10/2026): versão mais limpa. Sem a faixa preta do "Olá", ganhos numa linha só,
// foto menor na pronta entrega, máquinas em 2 colunas, só as 2 últimas indicações e sem o quadro do Consultor.
// Versão 4 (aprovada em 19/10/2026, "mais presença"): faixa grafite com o nome e o valor a receber em amarelo,
// a pronta entrega em destaque sobreposta à faixa (desliza para o lado), máquinas numa linha só e
// indicações com uma barra de cor da situação. Títulos em Archivo larga.

type Etapa = 0 | 1 | 2 | 3;
// uma etiqueta só por indicação, com a cor da situação
// a cor vai na barra do lado do cartão: azul com orçamento, amarelo em atendimento, verde vendida, cinza não fechou
const ETIQUETAS: Record<Etapa, { texto: string; cor: string }> = {
  0: { texto: 'Recebida', cor: '#F6C400' },
  1: { texto: 'Em atendimento', cor: '#F6C400' },
  2: { texto: 'Orçamento enviado', cor: '#2F6FED' },
  3: { texto: 'Vendida', cor: '#1FA855' },
};
const NAO_FECHOU = { texto: 'Não fechou', cor: '#BFC4CA' };

// "hoje", "há 2 dias", "há 1 semana": o parceiro lê de relance, sem data cheia
function haQuanto(v: any): string {
  const d = v?.toDate ? v.toDate() : v?.seconds ? new Date(v.seconds * 1000) : v ? new Date(v) : null;
  if (!d || isNaN(d.getTime())) return '';
  const dias = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 7) return `há ${dias} dias`;
  if (dias < 30) { const s = Math.floor(dias / 7); return `há ${s} ${s === 1 ? 'semana' : 'semanas'}`; }
  if (dias < 365) { const m = Math.floor(dias / 30); return `há ${m} ${m === 1 ? 'mês' : 'meses'}`; }
  const a = Math.floor(dias / 365); return `há ${a} ${a === 1 ? 'ano' : 'anos'}`;
}

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
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
function DesenhoMaquina({ tipo, className }: { tipo: TipoMaquina; className?: string }) {
  const cls = className || 'w-16 h-10 mx-auto mb-1';
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

  const aReceber = useMemo(() => comissoes.filter(c => c.status !== 'paid').reduce((s, c) => s + (Number(c.value) || 0), 0), [comissoes]);
  // respeita o que o administrador desligou para este parceiro em Usuários (mesma regra do menu)
  const mostraGanhos = !isRegionalSeller && profile?.permissions?.sidebar?.comissoes_ext !== false;

  const ultimas = useMemo(() => [...indicacoes]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .slice(0, 2), [indicacoes]);

  // qual equipamento da pronta entrega está na tela (para os pontinhos e o "1 de N")
  const carrossel = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const aoRolar = () => {
    const el = carrossel.current;
    const primeiro = el?.firstElementChild as HTMLElement | null;
    if (!el || !primeiro) return;
    const passo = primeiro.offsetWidth + 16; // largura do cartão mais o espaço entre eles
    // chegou ao fim (no computador cabem vários): o último é o atual
    if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) { setAtual(prontaEntrega.length - 1); return; }
    setAtual(Math.max(0, Math.min(prontaEntrega.length - 1, Math.round(el.scrollLeft / passo))));
  };
  // pontinhos só quando há o que rolar (numa tela larga os cartões cabem todos)
  const [daPraRolar, setDaPraRolar] = useState(false);
  useEffect(() => {
    const medir = () => { const el = carrossel.current; setDaPraRolar(!!el && el.scrollWidth > el.clientWidth + 2); };
    medir();
    const t = setTimeout(medir, 300);
    window.addEventListener('resize', medir);
    return () => { clearTimeout(t); window.removeEventListener('resize', medir); };
  }, [prontaEntrega.length]);
  useEffect(() => { if (atual >= prontaEntrega.length) setAtual(0); }, [prontaEntrega.length]);

  const primeiroNome = String(profile?.name || '').trim().split(/\s+/)[0] || 'parceiro';
  const maquinas: { id: TipoMaquina; nome: string }[] = [
    { id: 'escavadeira', nome: 'Escavadeira' },
    { id: 'pa', nome: 'Pá carregadeira' },
    { id: 'trator', nome: 'Trator' },
    { id: 'guindaste', nome: 'Guindaste' },
  ];
  const tituloSecao = 'fonte-titulo text-[17px] font-extrabold leading-tight text-[#1B1E22]';
  const temPronta = prontaEntrega.length > 0;

  return (
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 pb-8 bg-[#ECEEF0] min-h-full text-[#1B1E22]">
      {/* Faixa grafite: só o "Olá" e o valor a receber. O logo e o sino já estão na barra do app */}
      <div className={cn('bg-[#1B1E22] text-white px-[18px] md:px-8 pt-[22px] md:pt-6', temPronta ? 'pb-[92px]' : 'pb-6')}>
        <div className="max-w-xl flex justify-between items-end gap-3">
          <div className="min-w-0">
            <span className="block text-[14px] text-[#AEB4BC] leading-snug">Olá,</span>
            <span className="block fonte-titulo-larga font-[850] text-[30px] leading-[1.05] tracking-[-0.3px] truncate">{primeiroNome}</span>
          </div>
          {mostraGanhos && (
            <button onClick={() => navigate('/comissoes')} className="h-auto p-0 shrink-0 text-right bg-transparent active:opacity-80">
              <span className="block text-[12px] text-[#AEB4BC]">A receber</span>
              <span className="block fonte-titulo font-extrabold text-[20px] leading-tight text-[#F6C400] whitespace-nowrap">{brl(aReceber)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Pronta entrega em destaque, sobre a faixa. Aparece sempre para o parceiro: é a vitrine para ele
          mandar ao cliente (o cadastro antigo de vários parceiros vinha com o estoque desligado) */}
      {temPronta && (
        <section className="relative -mt-[76px] max-w-xl md:max-w-none md:mx-4">
          <div ref={carrossel} onScroll={aoRolar} className="flex gap-4 overflow-x-auto snap-x snap-mandatory md:scroll-pl-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-8 -mb-8 pt-1 -mt-1">
            {prontaEntrega.map((it, i) => {
              const pronto = !!preparados[it.chave]?.codigo;
              return (
                <div key={it.chave} className="snap-center md:snap-start shrink-0 w-[calc(100%-32px)] md:w-[544px] first:ml-4 last:mr-4 bg-white rounded-[20px] overflow-hidden shadow-[0_10px_24px_rgba(20,24,28,0.18)]">
                  <button onClick={() => navigate('/catalogo', { state: { openProductId: it.produto.id } })} className="relative h-[168px] w-full p-0 bg-gradient-to-b from-[#F4F5F6] to-[#E3E6E9] flex items-center justify-center">
                    <Foto src={it.foto} alt={it.nome} className="h-[140px] max-w-[88%] object-contain mix-blend-multiply" />
                    <span className="absolute left-3 top-3 bg-[#F6C400] text-[#111] text-[12px] font-extrabold px-2.5 py-[5px] rounded-full leading-none">Pronta entrega</span>
                    {prontaEntrega.length > 1 && (
                      <span className="absolute right-3 top-3 bg-[rgba(27,30,34,0.85)] text-white text-[12px] font-bold px-[9px] py-[5px] rounded-full leading-none">{i + 1} de {prontaEntrega.length}</span>
                    )}
                  </button>
                  <div className="px-3.5 pt-3 pb-1">
                    <span className="block fonte-titulo text-[19px] font-extrabold leading-tight truncate" style={{ fontStretch: '108%' }}>{it.nome}</span>
                    {it.para && <span className="block text-[13px] text-[#5E6672] mt-0.5 line-clamp-2">{it.para}</span>}
                  </div>
                  <div className="flex gap-2 px-3.5 pt-3 pb-3.5">
                    <button onClick={() => enviarAoCliente(it)} disabled={!pronto} className="flex-[1.4] min-w-0 h-12 px-2 rounded-xl bg-[#1FA855] text-white text-[14.5px] font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-60 leading-tight">
                      {pronto
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" className="shrink-0"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg>
                        : <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                      <span className="truncate">Enviar ao cliente</span>
                    </button>
                    <button onClick={() => navigate('/indicacoes/nova', { state: { product_name: it.produto.name } })} className="flex-1 min-w-0 h-12 px-2 rounded-xl border-2 border-[#1B1E22] bg-white text-[#1B1E22] text-[14.5px] font-extrabold">Indicar</button>
                  </div>
                </div>
              );
            })}
          </div>
          {prontaEntrega.length > 1 && daPraRolar && (
            <div className="flex justify-center mt-1 md:max-w-[576px]">
              {/* pontinhos clicáveis: no computador é o único jeito de chegar ao próximo equipamento */}
              {prontaEntrega.map((it, i) => (
                <button key={it.chave} aria-label={`Ver equipamento ${i + 1}`} onClick={() => {
                  const el = carrossel.current; const primeiro = el?.firstElementChild as HTMLElement | null;
                  if (el && primeiro) el.scrollTo({ left: i * (primeiro.offsetWidth + 16), behavior: 'smooth' });
                }} className="h-6 min-w-6 w-auto px-[2.5px] p-0 bg-transparent flex items-center justify-center">
                  <i className={cn('block h-1.5 rounded-[3px] transition-all', i === atual ? 'w-[18px] bg-[#1B1E22]' : 'w-1.5 bg-[#BFC4CA]')} />
                </button>
              ))}
            </div>
          )}
          <div className="text-center mt-1 md:max-w-[576px]">
            <button onClick={() => navigate('/estoque')} className="h-auto p-1 bg-transparent text-[13px] font-bold text-[#1E5BD8]">Ver toda a pronta entrega</button>
          </div>
        </section>
      )}

      {/* Máquina do cliente: abre o catálogo só com o que serve, cada modelo com o botão de WhatsApp */}
      <section className="max-w-xl">
        <div className="px-[18px] md:px-8 pt-4 pb-[9px]"><h2 className={tituloSecao}>Máquina do cliente</h2></div>
        <div className="grid grid-cols-4 gap-2 px-4 md:px-8">
          {maquinas.map(m => (
            <button key={m.id} onClick={() => navigate('/catalogo', { state: { maquina: m.id } })} className="min-w-0 h-auto bg-white rounded-[14px] px-0.5 pt-2.5 pb-[9px] flex flex-col items-center text-center active:scale-95">
              <span className="w-[46px] h-[46px] rounded-xl bg-[#FFF4C2] flex items-center justify-center mb-1.5 shrink-0">
                <DesenhoMaquina tipo={m.id} className="w-9 h-6" />
              </span>
              <span className="block w-full text-[clamp(10.5px,3.05vw,11.5px)] tracking-[-0.1px] font-bold leading-[1.15] text-[#1B1E22] break-words">{m.nome}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Minhas indicações: só as 2 últimas, com uma barra da cor da situação */}
      <section className="max-w-xl">
        <div className="flex justify-between items-baseline px-[18px] md:px-8 pt-4 pb-[9px]">
          <h2 className={tituloSecao}>Minhas indicações</h2>
          <button onClick={() => navigate('/indicacoes')} className="h-auto p-0 bg-transparent text-[13.5px] font-bold text-[#1E5BD8]">Ver todas</button>
        </div>
        <div className="px-4 md:px-8">
          {ultimas.length === 0 ? (
            <div className="bg-white rounded-[14px] px-3.5 py-3 text-[13.5px] text-[#5E6672]">
              Você ainda não tem indicações. Toque em <b className="text-[#1B1E22]">Indicar</b> ou envie um equipamento pelo WhatsApp: o pedido do cliente fica no seu nome.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {ultimas.map(ind => {
                const { etapa, perdida } = etapaDa(ind);
                const etiqueta = perdida ? NAO_FECHOU : ETIQUETAS[etapa];
                const produto = ind.items?.[0]?.product_name || ind.product_name || ind.base_machine || '';
                const quando = haQuanto(ind.created_at);
                return (
                  <button key={ind.id} onClick={() => navigate('/indicacoes')} style={{ borderLeftColor: etiqueta.cor }} className="h-auto w-full text-left bg-white rounded-[14px] border-l-[5px] border-solid pl-3.5 pr-3 py-[11px] flex items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-bold truncate text-[#1B1E22] leading-snug">{ind.client_name || 'Cliente'}</span>
                      <span className="block text-[12.5px] text-[#5E6672] truncate leading-snug">{[produto, quando].filter(Boolean).join(', ')}</span>
                    </span>
                    <span className="shrink-0 w-[84px] text-right text-[12px] font-bold leading-tight text-[#5E6672]">{etiqueta.texto}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
