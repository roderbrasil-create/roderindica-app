import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { brl, periodoEmFoco, proximoPassoComissao } from '../../lib/proximoPassoComissao';
import { abrirDocumento } from '../../lib/abrirDocumento';

// Tela "Meus ganhos" do parceiro indicador. Só mostra: quanto tem a receber, o que fazer agora,
// os meses e as vendas de cada mês. Pedido, datas e detalhes da venda ficam em "Minhas indicações".
export interface PeriodoGanho {
  key: string;
  month: number;
  year: number;
  label: string;
  total: number;
  status?: string | null;
  paid_at?: string | null;
  nf_url?: string | null;
  commissions: { id: string; indication_id: string; value: number }[];
}

interface Props {
  periodos: PeriodoGanho[];
  indicacoes: Record<string, any>;
  hoje?: Date;
  onEnviarNota: (p: PeriodoGanho) => void;
}

const equipamentoDe = (ind: any): string => {
  if (ind?.items?.length) return ind.items.map((i: any) => i.product_name).filter(Boolean).join(', ');
  return ind?.base_machine || ind?.product_name || '';
};

const selo = {
  laranja: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
  verde: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  neutro: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300',
};

export default function MeusGanhos({ periodos, indicacoes, hoje, onEnviarNota }: Props) {
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});
  const [historicoAberto, setHistoricoAberto] = useState(false);

  const lista = periodos
    .filter(p => p.total > 0 || p.status === 'paid')
    .sort((a, b) => (a.year - b.year) || (a.month - b.month));
  const passoDe = (p: PeriodoGanho) => proximoPassoComissao({
    hoje, month: p.month, year: p.year, total: p.total, status: p.status, temNota: !!p.nf_url, paidAt: p.paid_at,
  });
  const pagos = lista.filter(p => p.status === 'paid');
  const abertosLista = lista.filter(p => p.status !== 'paid');
  const jaRecebi = pagos.reduce((s, p) => s + p.total, 0);
  const aReceber = abertosLista.reduce((s, p) => s + p.total, 0);

  const foco = periodoEmFoco(lista.map(p => ({ ...p, temNota: !!p.nf_url, paidAt: p.paid_at })));
  const passo = foco ? passoDe(foco) : proximoPassoComissao({ hoje, month: 1, year: 2000, total: 0 });
  const verde = passo.tom === 'verde';

  const cartao = (p: PeriodoGanho) => {
    const s = passoDe(p);
    const aberto = !!abertos[p.key];
    return (
      <div key={p.key}>
        <button
          type="button"
          onClick={() => setAbertos(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
          aria-expanded={aberto}
          className="w-full min-h-[64px] flex items-center justify-between gap-3 text-left bg-card border border-border rounded-2xl p-3.5 active:bg-muted/50"
        >
          <div className="min-w-0">
            <div className="font-extrabold text-base text-foreground">{p.label}</div>
            <span className={cn('inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1.5', selo[s.tom])}>{s.selo}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">{brl(p.total)}</span>
            {aberto ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
          </div>
        </button>
        {aberto && (
          <div className="bg-card border border-border rounded-2xl mt-2 p-3.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground mb-2">Vendas deste mês</div>
            {p.commissions.length === 0 ? (
              <p className="text-xs text-muted-foreground">As vendas deste mês aparecem aqui assim que forem carregadas.</p>
            ) : (
              <div className="divide-y divide-border">
                {p.commissions.map(c => {
                  const ind = indicacoes[c.indication_id];
                  const cliente = ind?.client_name || ind?.client_person_name || 'Cliente';
                  const equip = equipamentoDe(ind);
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <b className="block text-sm text-foreground truncate">{cliente}</b>
                        {equip && <span className="block text-xs text-muted-foreground truncate">{equip}</span>}
                      </div>
                      <em className="not-italic font-extrabold text-sm text-emerald-600 dark:text-emerald-400 shrink-0">{brl(c.value)}</em>
                    </div>
                  );
                })}
              </div>
            )}
            {p.nf_url && (
              <button
                type="button"
                onClick={() => abrirDocumento(p.nf_url as string, 'Nota fiscal')}
                className="mt-3 inline-flex items-center gap-1.5 min-h-[44px] text-sm font-bold text-primary"
              >
                <Eye className="h-4 w-4" /> Ver nota fiscal enviada
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto w-full space-y-3">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Meus ganhos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Suas comissões das indicações vendidas</p>
      </div>

      <div className="bg-[#111] text-white rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
        <small className="text-xs font-bold text-gray-300">A RECEBER</small>
        <div className="text-right">
          <b className="block text-xl">{brl(aReceber)}</b>
          {foco && aReceber > 0 && <span className="block text-[11px] font-bold text-amber-400">{passo.legenda}</span>}
        </div>
      </div>

      <div className={cn(
        'rounded-2xl p-3.5 text-sm leading-snug border-[1.5px]',
        verde
          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-emerald-200'
          : 'bg-orange-50 border-orange-300 text-orange-900 dark:bg-orange-500/10 dark:border-orange-500/40 dark:text-orange-200'
      )}>
        <b className="block text-[13px] uppercase tracking-wide mb-1">Próximo passo</b>
        {passo.valorFormatado && passo.texto.includes(passo.valorFormatado) ? (
          <>
            {passo.texto.split(passo.valorFormatado)[0]}
            <b>{passo.valorFormatado}</b>
            {passo.texto.split(passo.valorFormatado)[1]}
          </>
        ) : passo.texto}
      </div>

      {foco && passo.botaoNota && (
        <button
          type="button"
          onClick={() => onEnviarNota(foco)}
          className="w-full min-h-[56px] bg-primary text-primary-foreground font-extrabold text-base rounded-2xl active:opacity-90"
        >
          Enviar nota fiscal
        </button>
      )}

      {abertosLista.length > 0 && (
        <>
          <div className="text-xs font-extrabold tracking-wide text-muted-foreground pt-3">POR MÊS</div>
          <div className="space-y-2">{abertosLista.map(cartao)}</div>
        </>
      )}

      <div className="flex gap-2.5 pt-1">
        <div className="flex-1 bg-card border border-border rounded-2xl px-3 py-2.5 text-[11px] font-semibold text-muted-foreground">
          Já recebi<b className="block text-[15px] text-foreground mt-0.5">{brl(jaRecebi)}</b>
        </div>
        <div className="flex-1 bg-card border border-border rounded-2xl px-3 py-2.5 text-[11px] font-semibold text-muted-foreground">
          A receber<b className="block text-[15px] text-foreground mt-0.5">{brl(aReceber)}</b>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setHistoricoAberto(v => !v)}
        aria-expanded={historicoAberto}
        className="w-full min-h-[44px] flex items-center justify-between pt-3 text-xs font-extrabold tracking-wide text-muted-foreground"
      >
        <span>HISTÓRICO</span>
        {historicoAberto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {historicoAberto && (
        pagos.length === 0
          ? <p className="text-xs text-muted-foreground px-1">Meses já pagos aparecem aqui.</p>
          : <div className="space-y-2">{[...pagos].reverse().map(cartao)}</div>
      )}
    </div>
  );
}
