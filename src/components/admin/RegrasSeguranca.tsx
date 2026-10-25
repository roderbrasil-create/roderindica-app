import { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';

// Publica as regras de segurança do Firebase pelo servidor, sem abrir o console.
// Só o administrador vê e usa. "Voltar" põe de volta exatamente a regra que estava no ar antes.
type EstadoAlvo = { no_ar: string | null; atualizada_em: string | null; erro: string | null; ja_e_a_nova: boolean; pode_voltar: boolean };
// Resultado da conferência única das contas com senha da equipe (marcarContasDaEquipe no servidor).
// As regras novas só confiam em e-mail confirmado: publicar antes dela tira o acesso da equipe.
type EmailConfirmado = {
  terminou: boolean; iniciada_em?: string | null; finished_at?: string | null; erro?: string;
  contas?: number | null; com_senha_sem_confirmar?: number | null; marcadas?: number | null; deixadas?: number; erros?: number;
  marcadas_emails?: { email: string; role?: string; doc_id?: string }[]; pendentes?: { email: string; motivo: string }[];
};

// Senhas definidas por gerente ou triagem na tela de Usuários (registro só do servidor), para o admin revisar.
type SenhaPelaGestao = { quando: string; quem_email: string; quem_papel: string; email_alvo: string; cadastro_id: string; tipo: string };

const MOTIVO: Record<string, string> = {
  sem_cadastro: 'não tem cadastro na tela de Usuários',
  cadastro_inativo: 'o cadastro está inativo',
  email_diferente: 'o e-mail do cadastro é outro',
  pre_cadastro_por_email: 'pré-cadastro ainda não usado (entra no primeiro acesso com a senha da Roder)',
  diretoria: 'diretoria: confirme entrando com o Google ou pelo "Esqueci a senha"',
  erro: 'deu erro ao conferir; redefina a senha pela tela de Usuários',
};
const PAPEL: Record<string, string> = {
  admin: 'administrador', manager: 'gerente', triagem: 'triagem', internal_seller: 'vendedora interna',
  financial: 'financeiro', finance: 'financeiro', fiscal: 'fiscal', marketing: 'marketing', assistant: 'assistente',
  external_seller: 'parceiro', vendedor_padrao: 'vendedor padrão',
};
const dataHora = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR') : '');

// `aoAgir` avisa o card pai para conferir de novo as regras publicadas depois de publicar ou voltar.
export default function RegrasSeguranca({ aoAgir }: { aoAgir?: () => void }) {
  const [estado, setEstado] = useState<{ firestore?: EstadoAlvo; storage?: EstadoAlvo; email_confirmado?: EmailConfirmado; senhas_pela_gestao?: SenhaPelaGestao[] | { erro: string } } | null>(null);
  const [verLista, setVerLista] = useState(false);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState<'' | 'publicar' | 'voltar'>('');

  const carregar = async () => {
    setErro('');
    try {
      const r = await fetch('/api/admin/regras/estado');
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setErro(j.error || 'Não consegui ler o estado das regras.'); return; }
      setEstado(j);
    } catch {
      setErro('Sem conexão com o servidor.');
    }
  };
  useEffect(() => { carregar(); }, []);

  const agir = async (acao: 'publicar' | 'voltar') => {
    const errosConferencia = estado?.email_confirmado?.erros || 0;
    const pergunta = acao === 'publicar'
      ? `${errosConferencia > 0 ? `ATENÇÃO: ${errosConferencia} conta(s) deram erro na conferência e podem perder o acesso de equipe. ` : ''}Publicar as regras novas de segurança agora? Depois, entre no app e peça para alguém da equipe e um parceiro entrarem também.`
      : 'Voltar para as regras que estavam no ar antes?';
    if (!window.confirm(pergunta)) return;
    setOcupado(acao);
    try {
      const r = await fetch(`/api/admin/regras/${acao}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const j = await r.json().catch(() => ({}));
      const mudou = j.feito && Object.keys(j.feito).length ? ` Já alterado: ${Object.keys(j.feito).join(' e ')}.` : ' Nada foi alterado.';
      if (!r.ok || !j.ok) toast.error(`${j.error || 'Não deu certo.'}${mudou}`, { duration: 10000 });
      else toast.success(acao === 'publicar' ? 'Regras novas publicadas.' : 'Regras anteriores de volta.');
    } catch {
      toast.error('Sem conexão com o servidor.');
    } finally {
      setOcupado('');
      carregar();
      aoAgir?.();
    }
  };

  const linha = (nome: string, e?: EstadoAlvo) => (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="font-semibold">{nome}</span>
      <span className={e?.ja_e_a_nova ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
        {!e ? '...' : e.erro ? 'não consegui ler' : e.ja_e_a_nova ? 'regras novas no ar' : 'regras antigas no ar'}
      </span>
    </div>
  );

  const tudoNovo = !!estado?.firestore?.ja_e_a_nova && !!estado?.storage?.ja_e_a_nova;
  const podeVoltar = !!estado?.firestore?.pode_voltar || !!estado?.storage?.pode_voltar;
  const ec = estado?.email_confirmado;
  const conferido = !!ec?.terminou;
  const pendentes = ec?.pendentes || [];
  // rodada antiga gravava só o e-mail; o servidor já devolve como objeto, mas a tela aceita os dois
  const marcadas = (ec?.marcadas_emails || []).map((m: any) => (typeof m === 'string' ? { email: m } : m)) as { email: string; role?: string; doc_id?: string }[];
  const comErros = conferido && (ec?.erros || 0) > 0;
  const sg = estado?.senhas_pela_gestao;
  const senhasGestao = Array.isArray(sg) ? sg : [];
  const erroSenhasGestao = sg && !Array.isArray(sg) ? sg.erro : '';

  // só mostra a conferência quando há algo a fazer: não terminou, tem pendência ou deu erro
  const mostrarConferencia = !conferido || pendentes.length > 0 || (ec?.erros || 0) > 0;
  const mostrarSenhas = !!erroSenhasGestao || senhasGestao.length > 0;

  return (
    <div className="space-y-3">
        {erro && <p className="text-sm font-bold text-red-600">{erro}</p>}
        {linha('Banco de dados', estado?.firestore)}
        {linha('Arquivos (fotos, vídeos, notas)', estado?.storage)}
        {mostrarConferencia && <div className="rounded-md border border-border p-3 text-sm space-y-1">
          <p className="font-semibold">Conferência das contas da equipe</p>
          {!estado ? <p className="text-muted-foreground">...</p> : !conferido ? (
            <p className="text-amber-600 font-bold">
              {ec?.erro ? `Não consegui ler o resultado: ${ec.erro}` : ec?.iniciada_em
                ? `Em andamento desde ${dataHora(ec.iniciada_em)}. Recarregue em alguns segundos.`
                : 'Ainda não rodou. Ela roda sozinha uns 15 segundos depois de o servidor subir.'}
              {' '}Publicar fica bloqueado até ela terminar.
            </p>
          ) : (
            <>
              <p className="text-emerald-600 font-bold">Terminou em {dataHora(ec?.finished_at)}.</p>
              <p>{ec?.marcadas ?? 0} conta(s) da equipe com senha passaram a valer como e-mail confirmado.</p>
              <p>{pendentes.length} conta(s) com senha ficaram como estavam: depois de publicar, elas entram como parceiro sem cadastro.{ec?.erros ? ` ${ec.erros} deram erro.` : ''}</p>
              {(pendentes.length > 0 || marcadas.length > 0) && (
                <button type="button" className="text-xs font-bold underline" onClick={() => setVerLista(v => !v)}>
                  {verLista ? 'Esconder a lista' : 'Ver quem é'}
                </button>
              )}
              {verLista && (
                <div className="text-xs space-y-2 pt-1 break-words">
                  {pendentes.length > 0 && (
                    <div>
                      <p className="font-semibold">Ficaram como estavam (se for alguém da equipe, redefina a senha na tela de Usuários):</p>
                      <ul className="list-disc pl-4">
                        {pendentes.map((p) => <li key={p.email + p.motivo}>{p.email}: {MOTIVO[p.motivo] || p.motivo}</li>)}
                      </ul>
                    </div>
                  )}
                  {marcadas.length > 0 && (
                    <div>
                      <p className="font-semibold">Confirmadas (confira se o papel de cada uma está certo antes de publicar):</p>
                      <ul className="list-disc pl-4">
                        {marcadas.map((m) => (
                          <li key={m.email + (m.doc_id || '')}>
                            {m.email}: {m.role ? (PAPEL[m.role] || m.role) : 'sem papel'}
                            {m.doc_id && <span className="text-muted-foreground"> (cadastro {m.doc_id})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>}
        {mostrarSenhas && <div className="rounded-md border border-border p-3 text-sm space-y-1">
          <p className="font-semibold">Senhas definidas por gerente ou triagem</p>
          {!estado ? <p className="text-muted-foreground">...</p> : erroSenhasGestao ? (
            <p className="text-amber-600 font-bold">Não consegui ler o registro: {erroSenhasGestao}</p>
          ) : senhasGestao.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma até agora.</p>
          ) : (
            <ul className="text-xs space-y-1 break-words">
              {senhasGestao.map((x) => (
                <li key={x.quando + x.email_alvo}>
                  <span className="font-semibold">{dataHora(x.quando)}</span>: {x.quem_email || 'sem e-mail'} ({PAPEL[x.quem_papel] || x.quem_papel})
                  {x.tipo === 'conta_criada' ? ' criou a conta de ' : ' trocou a senha de '}{x.email_alvo}
                  {x.cadastro_id && <span className="text-muted-foreground"> (cadastro {x.cadastro_id})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>}
        {comErros && (
          <p className="text-sm font-bold text-amber-700 rounded-md border border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2">
            Atenção: {ec?.erros} conta(s) deram erro na conferência e ficaram sem confirmar. Se for alguém da equipe com senha,
            essa pessoa perde o acesso de equipe quando as regras novas forem publicadas. Redefina a senha dela na tela de
            Usuários antes de publicar, ou publique sabendo disso.
          </p>
        )}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-1">
          <Button onClick={() => agir('publicar')} disabled={!!ocupado || tudoNovo || !estado || !conferido} className="min-h-[44px] bg-[#facc15] text-black hover:bg-[#eab308] font-bold">
            {ocupado === 'publicar' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Publicar regras novas
          </Button>
          <Button variant="outline" onClick={() => agir('voltar')} disabled={!!ocupado || !podeVoltar} className="min-h-[44px]">
            {ocupado === 'voltar' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Undo2 className="h-4 w-4 mr-2" />}
            Voltar regras anteriores
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Se depois de publicar alguém não conseguir entrar ou salvar, aperte "Voltar regras anteriores".</p>
    </div>
  );
}
