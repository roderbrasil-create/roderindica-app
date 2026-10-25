import { useEffect, useState } from 'react';
import { Search, Loader2, Link2, BadgePlus, AlertTriangle, CheckCircle2, Info, Stethoscope, Wand2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { maskCurrency, unmaskCurrency } from '../../lib/masks';

// Diagnóstico de comissão do parceiro (só o administrador). Procura o parceiro e mostra, venda por
// venda, por que a comissão não aparece no painel dele. Comissão em nome de outro código não tem
// botão: a correção automática do servidor (server/conciliacaoComissao.ts) leva a comissão para o
// parceiro da indicação sozinha, e "Correções automáticas" mostra o que ela fez e o que ficou travado.

type Falta = { codigo: string; texto: string; acao?: 'ligar' | 'gerar'; tipo?: 'info' | 'problema' };
type ItemCorrecao = { tipo?: 'movida' | 'criada'; em?: string; indicacao_id: string | null; cliente: string; parceiro: string; valor?: number; de_nome?: string | null; de_uid?: string | null; month?: number; year?: number; motivo?: string };
type Correcoes = { ultima: { rodada_em: string; origem: string; movidas: ItemCorrecao[]; criadas: ItemCorrecao[]; travadas: ItemCorrecao[]; erros: string[] } | null; historico: ItemCorrecao[] };
type Usuario = { uid: string; name: string; email: string; role: string; status: string; commission_rate: number | null; comissionavel: boolean; repetido?: boolean };
type Comissao = { id: string; indication_id: string | null; external_seller_uid: string | null; external_seller_name: string | null; value: number; status: string | null; month: number | null; year: number | null; conta_nome?: string | null };
type Indicacao = {
  id: string; client_name: string; status: string | null; ligado_por: string[];
  conta: string | null; conta_nome: string | null; fora_da_conta: boolean;
  external_seller_uid: string | null; external_seller_name: string | null; external_seller_email: string | null; indicator_name: string | null;
  sale_value: number; base_commission_value: number; commission_value: number; discount_amount: number;
  produtos: { total: number; comissionaveis: number; base_bruta: number; itens: { code: string; name: string; quantity: number; base_value: number; conta: boolean }[] };
  sale_date: string | null; sale_order_number: string | null; updated_at: string | null;
  finance_notice_pending: boolean; finance_notice_sent_at: string | null;
  calculo_previsto: { base: number; valor: number; desconto: number } | null;
  comissoes: Comissao[]; falta: Falta[];
};
type Resultado = {
  termo: string; usuarios: Usuario[]; duplicados: { motivo: string; uids: string[] }[]; indicacoes: Indicacao[];
  varias_contas: boolean; conta_escolhida: string | null;
  comissoes: Comissao[]; extratos: { id: string; month: number; year: number; status: string | null; total_value: number; nf_enviada: boolean }[];
  avisos: { existe: boolean; monthly_report_partners: boolean; monthly_report_directors: boolean; payment_reminder_finance: boolean };
  avisos_gerais: string[];
};

const STATUS_COMISSAO: Record<string, string> = { waiting_nf: 'aguardando NF', waiting_payment: 'aguardando pagamento', paid: 'paga' };
const STATUS_IND: Record<string, string> = { pending: 'Pendente', negotiating: 'Em negociação', sold: 'Faturada', cancelled: 'Cancelada', lost: 'Perdida' };
const PAPEL: Record<string, string> = { external_seller: 'Parceiro indicador', vendedor_padrao: 'Vendedor regional', admin: 'Administrador', manager: 'Gerente', internal_seller: 'Vendedor interno', triagem: 'Triagem', financial: 'Financeiro' };
const data = (v: string | null) => v ? String(v).slice(0, 10).split('-').reverse().join('/') : '-';
const mes = (m: number | null, a: number | null) => m && a ? `${String(m).padStart(2, '0')}/${a}` : '-';

async function chamar(url: string, corpo?: any) {
  const r = await fetch(url, corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) } : undefined);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(j.error || 'Não deu certo.');
  return j;
}

export default function DiagnosticoComissao() {
  const [termo, setTermo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState('');
  const [res, setRes] = useState<Resultado | null>(null);
  // Ligar (só a indicação, sem comissão lançada). Começa sem conta marcada de propósito:
  // com cadastro repetido, a primeira da lista é tão provável quanto a errada.
  const [ligar, setLigar] = useState<{ ind: Indicacao; uid: string } | null>(null);
  const [correcoes, setCorrecoes] = useState<Correcoes | null>(null);
  // Recolhido por padrão: o resultado das correções já aparece na linha de status do cabeçalho.
  const [aberto, setAberto] = useState(false);
  const [erroCorrecoes, setErroCorrecoes] = useState('');

  useEffect(() => {
    chamar('/api/admin/diagnostico-comissao/correcoes').then(setCorrecoes).catch((e: any) => setErroCorrecoes(e.message));
  }, []);
  const [conta, setConta] = useState('');
  const [gerar, setGerar] = useState<{ ind: Indicacao; desconto: string; previa: any; erro: string; carregando: boolean } | null>(null);
  const [gravando, setGravando] = useState(false);

  const buscar = async (t = termo, c = conta) => {
    if (t.trim().length < 2) { setErro('Digite o nome, o e-mail ou o código do parceiro.'); return; }
    setBuscando(true); setErro(''); setAberto(true);
    try { setRes(await chamar(`/api/admin/diagnostico-comissao?parceiro=${encodeURIComponent(t.trim())}${c ? `&conta=${encodeURIComponent(c)}` : ''}`)); }
    catch (e: any) { setErro(e.message); setRes(null); }
    finally { setBuscando(false); }
  };

  const abrirGerar = async (ind: Indicacao, desconto?: string) => {
    const d = desconto ?? String(ind.discount_amount || 0);
    setGerar({ ind, desconto: d, previa: null, erro: '', carregando: true });
    try {
      const p = await chamar('/api/admin/diagnostico-comissao/previa', { indicacaoId: ind.id, desconto: Number(d) || 0 });
      setGerar({ ind, desconto: d, previa: p, erro: p.ja_existe ? 'Já existe comissão lançada para esta venda.' : '', carregando: false });
    } catch (e: any) { setGerar({ ind, desconto: d, previa: null, erro: e.message, carregando: false }); }
  };

  const confirmarGerar = async () => {
    if (!gerar?.previa) return;
    setGravando(true);
    try {
      const r = await chamar('/api/admin/diagnostico-comissao/gerar', { indicacaoId: gerar.ind.id, desconto: Number(gerar.desconto) || 0 });
      toast.success(`Comissão de ${maskCurrency(r.valor)} lançada para ${r.parceiro}, pagamento em ${mes(r.month, r.year)}.`);
      setGerar(null); buscar(res?.termo || termo);
    } catch (e: any) { toast.error(e.message); }
    finally { setGravando(false); }
  };

  const confirmarLigar = async () => {
    if (!ligar?.uid) return;
    setGravando(true);
    try {
      const r = await chamar('/api/admin/diagnostico-comissao/ligar', { indicacaoId: ligar.ind.id, uid: ligar.uid });
      toast.success(`Indicação ligada a ${r.nome}.`);
      setLigar(null); buscar(res?.termo || termo);
    } catch (e: any) { toast.error(e.message); }
    finally { setGravando(false); }
  };

  const parceiros = (res?.usuarios || []).filter(u => u.comissionavel);
  const nomeUsuario = (uid: string) => res?.usuarios.find(u => u.uid === uid)?.name || uid;

  return (
    <Card className="bg-card border-border shadow-sm mb-6">
      <CardHeader className="pb-2">
        {/* o título inteiro é o botão de abrir: alvo de toque grande no celular */}
        <button type="button" onClick={() => setAberto(v => !v)} aria-expanded={aberto}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 text-left">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" /> Diagnóstico de comissão
          </CardTitle>
          <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </button>
        <ResumoCorrecoes correcoes={correcoes} erro={erroCorrecoes} />
      </CardHeader>
      <CardContent className="space-y-4">
        {aberto && <CorrecoesAutomaticas correcoes={correcoes} erro={erroCorrecoes} />}

        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); setConta(''); buscar(termo, ''); }}>
          <Input value={termo} onChange={e => setTermo(e.target.value)} placeholder="Nome, e-mail ou código do parceiro" className="h-11 bg-background" aria-label="Parceiro" />
          <Button type="submit" disabled={buscando} className="h-11 min-w-[44px] px-4 bg-[#facc15] text-black hover:bg-[#eab308] font-bold shrink-0" aria-label="Procurar parceiro">
            {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-1.5 hidden sm:inline">Procurar</span>
          </Button>
        </form>
        {erro && <p className="text-sm font-bold text-red-600">{erro}</p>}

        {res && (
          <div className="space-y-4">
            {res.avisos_gerais.length > 0 && (
              <ul className="space-y-1.5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3">
                {res.avisos_gerais.map((a, i) => (
                  <li key={i} className="flex gap-2 text-[13px] text-amber-900 dark:text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{a}</li>
                ))}
              </ul>
            )}

            {res.usuarios.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Cadastro ({res.usuarios.length})</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {res.usuarios.map(u => (
                    <div key={u.uid} className="rounded-lg border border-border bg-background p-3 text-sm min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold truncate">{u.name || '(sem nome)'}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${u.comissionavel ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{PAPEL[u.role] || u.role || 'sem perfil'}</span>
                      </div>
                      <p className="text-muted-foreground text-[13px] truncate">{u.email || 'sem e-mail'}</p>
                      <p className="text-[11px] font-mono text-muted-foreground break-all">{u.uid}</p>
                      {u.repetido && <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Cadastro repetido do mesmo parceiro</p>}
                      <p className="text-[12px] mt-1">Taxa do cadastro: <strong>{u.commission_rate !== null && u.commission_rate !== undefined ? `${u.commission_rate}%` : 'não definida (vale a do sistema)'}</strong>{u.status && u.status !== 'active' ? <span className="text-red-600 font-bold"> · {u.status}</span> : null}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {res.varias_contas && (
              <fieldset className="space-y-2 rounded-lg border border-amber-300 dark:border-amber-800 p-3">
                <legend className="px-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">Conta em que o parceiro entra</legend>
                <p className="text-[12px] text-muted-foreground">Escolha a conta que o parceiro usa para entrar no Roder Indica. O que estiver nas outras aparece marcado em vermelho.</p>
                {parceiros.map(u => (
                  <label key={u.uid} className={`flex items-center gap-3 rounded-lg border p-3 min-h-[44px] cursor-pointer ${res.conta_escolhida === u.uid ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <input type="radio" name="conta-parceiro" className="h-4 w-4" checked={res.conta_escolhida === u.uid} disabled={buscando}
                      onChange={() => { setConta(u.uid); buscar(res.termo, u.uid); }} />
                    <span className="min-w-0"><span className="block font-bold text-sm truncate">{u.name || '(sem nome)'}</span><span className="block text-[12px] text-muted-foreground truncate">{u.email || 'sem e-mail'} · <span className="font-mono">{u.uid}</span></span></span>
                  </label>
                ))}
              </fieldset>
            )}

            <section className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Indicações ({res.indicacoes.length})</h3>
              {res.indicacoes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma indicação ligada a este parceiro pelo código, pelo e-mail ou pelo nome.</p>}
              {res.indicacoes.map(ind => {
                const problemas = ind.falta.filter(f => f.tipo !== 'info');
                return (
                  <div key={ind.id} className={`rounded-lg border p-3 space-y-2 min-w-0 ${problemas.length ? 'border-red-300 dark:border-red-900' : 'border-border'} bg-background`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-[15px] leading-tight truncate">{ind.client_name || '(sem cliente)'}</p>
                        <p className="text-[12px] text-muted-foreground">{STATUS_IND[ind.status || ''] || ind.status}{ind.sale_order_number ? ` · pedido ${ind.sale_order_number}` : ''}{ind.sale_date ? ` de ${data(ind.sale_date)}` : ''} · achada por {ind.ligado_por.join(', ')}</p>
                      </div>
                      {problemas.length === 0
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" aria-label="Sem problema" />
                        : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 shrink-0">{problemas.length} {problemas.length === 1 ? 'problema' : 'problemas'}</span>}
                    </div>
                    <p className="text-[12px]">Parceiro na indicação: <strong>{ind.external_seller_name || ind.indicator_name || '-'}</strong> <span className="font-mono text-muted-foreground break-all">({ind.external_seller_uid || 'sem código'})</span></p>
                    {res.varias_contas && (
                      <p className={`text-[12px] font-bold ${ind.fora_da_conta ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}>Conta: {ind.conta_nome || 'nenhuma'}{ind.conta ? <span className="font-mono font-normal"> ({ind.conta})</span> : null}</p>
                    )}
                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
                      <div className="rounded-md bg-muted/50 p-2"><dt className="text-muted-foreground">Venda</dt><dd className="font-bold">{maskCurrency(ind.sale_value)}</dd></div>
                      <div className="rounded-md bg-muted/50 p-2"><dt className="text-muted-foreground">Base dos produtos</dt><dd className="font-bold">{maskCurrency(ind.produtos.base_bruta)}</dd></div>
                      <div className="rounded-md bg-muted/50 p-2"><dt className="text-muted-foreground">Comissão gravada</dt><dd className="font-bold">{maskCurrency(ind.commission_value)}</dd></div>
                      <div className="rounded-md bg-muted/50 p-2"><dt className="text-muted-foreground">Comissão pela regra</dt><dd className="font-bold">{ind.calculo_previsto ? maskCurrency(ind.calculo_previsto.valor) : '-'}</dd></div>
                    </dl>
                    <p className="text-[12px] text-muted-foreground">Produtos: {ind.produtos.total} cadastrados, {ind.produtos.comissionaveis} contam para comissão{ind.base_commission_value ? ` · base do orçamento ${maskCurrency(ind.base_commission_value)}` : ''}</p>
                    {ind.comissoes.map(c => (
                      <p key={c.id} className="text-[12px] rounded-md border border-border px-2 py-1">
                        Comissão {maskCurrency(c.value)} · {STATUS_COMISSAO[c.status || ''] || c.status || '-'} · pagamento {mes(c.month, c.year)} · em nome de {c.external_seller_name || c.external_seller_uid || '-'}
                        {res.varias_contas && <> · conta <strong>{c.conta_nome || c.external_seller_uid || '-'}</strong></>}
                      </p>
                    ))}
                    <ul className="space-y-1.5">
                      {ind.falta.map((f, i) => (
                        <li key={i} className={`flex flex-col sm:flex-row sm:items-center gap-2 text-[13px] ${f.tipo === 'info' ? 'text-muted-foreground' : 'text-red-700 dark:text-red-300'}`}>
                          <span className="flex gap-2 flex-1 min-w-0">
                            {f.tipo === 'info' ? <Info className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
                            <span>{f.texto}</span>
                          </span>
                          {f.acao === 'ligar' && (
                            <Button size="sm" variant="outline" className="h-10 sm:h-8 shrink-0" disabled={!parceiros.length}
                              onClick={() => setLigar({ ind, uid: '' })}>
                              <Link2 className="h-4 w-4 mr-1.5" /> Ligar ao parceiro
                            </Button>
                          )}
                          {f.acao === 'gerar' && (
                            <Button size="sm" className="h-10 sm:h-8 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => abrirGerar(ind)}>
                              <BadgePlus className="h-4 w-4 mr-1.5" /> Gerar comissão desta venda
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>

            {res.extratos.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Fechamentos mensais</h3>
                <ul className="text-[13px] space-y-1">
                  {res.extratos.map(e => (
                    <li key={e.id} className="flex justify-between gap-2 border-b border-border py-1">
                      <span>{mes(e.month, e.year)} · {STATUS_COMISSAO[e.status || ''] || e.status || '-'}{e.nf_enviada ? ' · NF enviada' : ''}</span>
                      <strong>{maskCurrency(e.total_value)}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">E-mails automáticos</h3>
              {[
                ['Parceiro: comissão no dia 1 e lembrete da nota no dia 5', res.avisos.monthly_report_partners],
                ['Diretoria e financeiro: relatório do dia 1', res.avisos.monthly_report_directors],
                ['Financeiro: lembrete de pagamento no dia 7', res.avisos.payment_reminder_finance],
              ].map(([t, on]) => (
                <p key={String(t)} className="flex justify-between gap-2 text-[13px]"><span>{t}</span><strong className={on ? 'text-emerald-600' : 'text-red-600'}>{on ? 'ligado' : 'desligado'}</strong></p>
              ))}
            </section>
          </div>
        )}
      </CardContent>

      <Dialog open={!!ligar} onOpenChange={o => { if (!o) setLigar(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ligar ao parceiro</DialogTitle>
            <DialogDescription>
              {`A indicação de ${ligar?.ind.client_name} passa a ser do parceiro escolhido. Ela aparece no painel dele e a comissão sai em nome dele.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {parceiros.map(u => (
              <label key={u.uid} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${ligar?.uid === u.uid ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <input type="radio" name="parceiro" checked={ligar?.uid === u.uid} onChange={() => ligar && setLigar({ ...ligar, uid: u.uid })} className="h-4 w-4" />
                <span className="min-w-0"><span className="block font-bold text-sm truncate">{u.name}{res?.conta_escolhida === u.uid ? ' (conta em que ele entra)' : ''}</span><span className="block text-[12px] text-muted-foreground truncate">{u.email} · <span className="font-mono">{u.uid}</span></span></span>
              </label>
            ))}
            {ligar?.ind.external_seller_uid && <p className="text-[12px] text-muted-foreground">Hoje está ligada a {ligar.ind.external_seller_name || ligar.ind.external_seller_uid}.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLigar(null)}>Cancelar</Button>
            <Button onClick={confirmarLigar} disabled={gravando || !ligar?.uid} className="bg-[#facc15] text-black hover:bg-[#eab308] font-bold">
              {gravando && <Loader2 className="h-4 w-4 animate-spin mr-2" />} {!ligar?.uid ? 'Escolha a conta' : `Ligar a ${nomeUsuario(ligar.uid)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!gerar} onOpenChange={o => { if (!o) setGerar(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar comissão desta venda</DialogTitle>
            <DialogDescription>Mesma conta do faturamento: produtos comissionáveis, menos o desconto, na taxa do cadastro do parceiro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-muted-foreground" htmlFor="desc-diag">Desconto concedido na venda (R$)</label>
              <div className="flex gap-2">
                <Input id="desc-diag" inputMode="numeric" className="h-11 bg-background" value={maskCurrency(Number(gerar?.desconto) || 0)}
                  onChange={e => gerar && setGerar({ ...gerar, desconto: String(unmaskCurrency(e.target.value)), previa: null })} />
                <Button variant="outline" className="h-11 shrink-0" disabled={gerar?.carregando} onClick={() => gerar && abrirGerar(gerar.ind, gerar.desconto)}>Recalcular</Button>
              </div>
            </div>
            {gerar?.carregando && <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Calculando...</p>}
            {gerar?.erro && <p className="font-bold text-red-600">{gerar.erro}</p>}
            {gerar?.previa && (
              <dl className="rounded-lg border border-border divide-y divide-border">
                <div className="flex justify-between p-2"><dt>Parceiro</dt><dd className="font-bold text-right">{gerar.previa.parceiro}</dd></div>
                <div className="flex justify-between p-2"><dt>Base dos produtos</dt><dd>{maskCurrency(gerar.previa.base_bruta)}</dd></div>
                <div className="flex justify-between p-2"><dt>Desconto abatido</dt><dd>{maskCurrency(gerar.previa.desconto)}</dd></div>
                <div className="flex justify-between p-2"><dt>Base da comissão</dt><dd>{maskCurrency(gerar.previa.base)}</dd></div>
                <div className="flex justify-between p-2 bg-emerald-50 dark:bg-emerald-950/30"><dt className="font-bold">Comissão</dt><dd className="font-black text-emerald-700 dark:text-emerald-300">{maskCurrency(gerar.previa.valor)}</dd></div>
                <div className="flex justify-between p-2"><dt>Pagamento</dt><dd>{mes(gerar.previa.month, gerar.previa.year)}</dd></div>
              </dl>
            )}
            <p className="text-[12px] text-muted-foreground">A comissão entra como aguardando NF, aparece no painel do parceiro e o financeiro recebe o aviso em 2 dias.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGerar(null)}>Cancelar</Button>
            <Button onClick={confirmarGerar} disabled={gravando || !gerar?.previa || gerar.previa.ja_existe} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {gravando && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Lançar {gerar?.previa ? maskCurrency(gerar.previa.valor) : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Linha de status do cabeçalho: o resultado das correções automáticas à vista, sem abrir o card.
function ResumoCorrecoes({ correcoes, erro }: { correcoes: Correcoes | null; erro: string }) {
  const quando = (v?: string) => v ? new Date(v).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
  const ultima = correcoes?.ultima || null;
  let chip = 'Conferindo...'; let cor = 'bg-muted text-muted-foreground';
  if (erro) { chip = 'Não consegui ler as correções'; cor = 'bg-[#FEE4E2] text-[#B42318]'; }
  else if (correcoes && !ultima) { chip = 'Correção ainda não rodou'; cor = 'bg-muted text-muted-foreground'; }
  else if (ultima) {
    const travadas = ultima.travadas.length; const erros = ultima.erros.length;
    if (travadas > 0 || erros > 0) { chip = `${travadas} travada(s)${erros ? `, ${erros} erro(s)` : ''}: precisa de olhar`; cor = 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'; }
    else if ((correcoes?.historico || []).length === 0) { chip = 'Nenhuma comissão precisou de correção'; cor = 'bg-[#DCFCE7] text-[#14532D] dark:bg-emerald-950/40 dark:text-emerald-300'; }
    else { chip = `${(correcoes?.historico || []).length} comissão(ões) corrigida(s) sozinha(s)`; cor = 'bg-[#DCFCE7] text-[#14532D] dark:bg-emerald-950/40 dark:text-emerald-300'; }
  }
  return (
    <div className="space-y-1">
      <span className={`inline-block rounded-md px-2 py-1 text-[12.5px] font-extrabold ${cor}`}>{chip}</span>
      <p className="m-0 text-[12.5px] text-muted-foreground">{ultima ? `Última rodada: ${quando(ultima.rodada_em)}. ` : ''}Roda todo dia às 7h30. Procure o parceiro abaixo para ver por que a comissão não aparece no painel dele.</p>
    </div>
  );
}

// O que a correção automática de comissão fez, sem botão nenhum: comissões levadas para o parceiro
// da indicação, comissões lançadas em venda faturada sem elas, e o que ficou travado (pago,
// aguardando pagamento ou fechamento travado), que só o financeiro acerta.
function CorrecoesAutomaticas({ correcoes, erro }: { correcoes: Correcoes | null; erro: string }) {
  const quando = (v?: string) => v ? new Date(v).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  const ultima = correcoes?.ultima || null;
  const feitas = correcoes?.historico || [];
  const travadas = ultima?.travadas || [];
  return (
    <section className="space-y-2 rounded-lg border border-border bg-background p-3">
      <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Wand2 className="h-4 w-4" /> Correções automáticas</h3>
      {erro && <p className="text-[13px] font-bold text-red-600">{erro}</p>}
      {!erro && !correcoes && <p className="flex items-center gap-2 text-[13px] text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</p>}
      {correcoes && !ultima && <p className="text-[13px] text-muted-foreground">A correção ainda não rodou. Ela roda sozinha logo depois que o servidor liga e todo dia às 7h30.</p>}
      {ultima && (
        <p className="text-[12px] text-muted-foreground">Última rodada: {quando(ultima.rodada_em)} ({ultima.origem}) · {ultima.movidas.length} movida(s), {ultima.criadas.length} lançada(s), {travadas.length} travada(s). Roda sozinha todo dia às 7h30.</p>
      )}
      {feitas.length > 0 && (
        <ul className="space-y-1.5">
          {feitas.map((f, i) => (
            <li key={i} className="flex gap-2 text-[13px] rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 px-2 py-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="min-w-0">
                <strong>{f.parceiro}</strong> · {f.cliente || '(sem cliente)'} · {maskCurrency(Number(f.valor) || 0)}
                <span className="block text-[12px] text-muted-foreground">
                  {f.tipo === 'criada'
                    ? `Comissão lançada (venda faturada sem comissão), pagamento em ${mes(f.month ?? null, f.year ?? null)}.`
                    : `Comissão levada de ${f.de_nome || f.de_uid || 'outro código'} para ${f.parceiro}: ${f.motivo || 'quem recebe é o parceiro da indicação'}.`}
                  {' '}{quando(f.em)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {correcoes && ultima && !feitas.length && <p className="text-[13px] text-muted-foreground">Nenhuma comissão precisou ser corrigida até agora.</p>}
      {travadas.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[12px] font-bold text-amber-800 dark:text-amber-300">Não mexidas (precisam do financeiro ou de um cadastro):</p>
          <ul className="space-y-1.5">
            {travadas.map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="min-w-0"><strong>{t.parceiro}</strong>{t.cliente ? ` · ${t.cliente}` : ''}: {t.motivo}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(ultima?.erros || []).length > 0 && <p className="text-[12px] text-red-600">Erros na última rodada: {ultima!.erros.join(' · ')}</p>}
    </section>
  );
}
