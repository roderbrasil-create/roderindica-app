import { useCallback, useEffect, useState } from 'react';
import { Mail, Loader2, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { auth } from '../../lib/firebase';
import { getApiBaseUrl } from '../../lib/utils';

// Convite do Consultor Técnico por e-mail ao comercial interno. O servidor decide a lista
// e só manda aos marcados; quem já recebeu fica desmarcado até pedir o reenvio.
interface Dest { id: string; nome: string; email: string; papel: string; rotulo: string; ultimo_convite: string | null }
interface Res { email: string; nome: string; status: 'enviado' | 'ja_enviado' | 'fora_da_lista' | 'erro'; detalhe?: string }

const dataBr = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('pt-BR') : '';

async function chamar(caminho: string, corpo?: unknown) {
  const token = await auth.currentUser?.getIdToken();
  const r = await fetch(`${getApiBaseUrl()}${caminho}`, {
    method: corpo ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(j.error || 'Erro no servidor.');
  return j;
}

export default function ConviteConsultor() {
  const [lista, setLista] = useState<Dest[] | null>(null);
  const [texto, setTexto] = useState('');
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const [resultados, setResultados] = useState<Res[]>([]);
  const [erro, setErro] = useState('');
  const [ver, setVer] = useState(false);
  // a lista de quem recebe fica recolhida: o resumo ("N pessoas marcadas") basta no dia a dia
  const [escolher, setEscolher] = useState(false);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const j = await chamar('/api/admin/convite-consultor');
      setLista(j.destinatarios);
      setTexto(j.texto);
      // quem ainda não recebeu vem marcado; quem já recebeu espera o reenvio ser pedido
      setMarcados(new Set((j.destinatarios as Dest[]).filter(d => !d.ultimo_convite).map(d => d.email)));
    } catch (e: any) { setErro(e.message); setLista([]); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const alternar = (email: string) => setMarcados(m => { const n = new Set(m); n.has(email) ? n.delete(email) : n.add(email); return n; });
  const reenvios = (lista || []).filter(d => marcados.has(d.email) && d.ultimo_convite).length;

  const enviar = async () => {
    if (!marcados.size || enviando) return;
    if (reenvios && !window.confirm(`${reenvios} pessoa(s) marcada(s) já receberam o convite. Enviar de novo?`)) return;
    setEnviando(true);
    try {
      const j = await chamar('/api/admin/convite-consultor/enviar', { emails: [...marcados], reenviar: reenvios > 0 });
      setResultados(j.resultados);
      const ok = (j.resultados as Res[]).filter(r => r.status === 'enviado').length;
      toast.success(`${ok} convite(s) enviado(s).`);
      carregar();
    } catch (e: any) { toast.error(e.message); }
    finally { setEnviando(false); }
  };

  return (
    <Card className="max-w-5xl mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-5 w-5" /> Convite do Consultor por e-mail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="m-0 text-[13px] text-muted-foreground">Envia a cada pessoa do comercial interno o link do Consultor Técnico e como instalar no celular e no computador. Cada e-mail vai só para uma pessoa.</p>
        {lista === null && <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</span>}
        {erro && <p className="m-0 text-sm font-bold text-[#B42318]">{erro}</p>}
        {lista && lista.length === 0 && !erro && <p className="m-0 text-sm">Nenhum usuário ativo do comercial interno encontrado.</p>}
        {lista && lista.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-md bg-amber-100 px-2 py-1 text-[12.5px] font-extrabold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                {marcados.size} {marcados.size === 1 ? 'pessoa marcada' : 'pessoas marcadas'}
              </span>
              <Button variant="outline" onClick={() => setEscolher(v => !v)} aria-expanded={escolher} className="h-11 min-h-[44px]">
                Escolher quem recebe <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${escolher ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            {!escolher && marcados.size > 0 && (
              <p className="m-0 text-[12.5px] text-muted-foreground">{lista.filter(d => marcados.has(d.email)).map(d => d.nome.split(' ')[0]).join(' · ')}</p>
            )}
            {escolher && (
              <div className="rounded-xl border border-border divide-y divide-border">
                {lista.map(d => (
                  <label key={d.id} className="flex min-h-[44px] items-center gap-3 px-3 py-2 cursor-pointer">
                    <input type="checkbox" className="h-5 w-5" checked={marcados.has(d.email)} onChange={() => alternar(d.email)} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold truncate">{d.nome}</span>
                      <span className="block text-[12.5px] text-muted-foreground truncate">{d.email}</span>
                    </span>
                    <span className="text-right text-[12.5px]">
                      <span className="block font-bold">{d.rotulo}</span>
                      {d.ultimo_convite && <span className="block text-muted-foreground">Enviado em {dataBr(d.ultimo_convite)}</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={enviar} disabled={!marcados.size || enviando} className="h-11 min-h-[44px]">
            {enviando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mail className="h-4 w-4 mr-1" />} Enviar convite ({marcados.size})
          </Button>
          <Button variant="outline" onClick={() => setVer(v => !v)} className="h-11 min-h-[44px]">{ver ? 'Esconder texto' : 'Ver o texto'}</Button>
          <Button variant="outline" onClick={carregar} className="h-11 min-h-[44px]"><RefreshCw className="h-4 w-4 mr-1" /> Atualizar</Button>
        </div>
        {ver && <pre className="m-0 whitespace-pre-wrap rounded-xl bg-muted p-3 text-[13px] leading-snug font-sans">{texto}</pre>}
        {resultados.length > 0 && (
          <div className="rounded-xl border border-border p-3 text-[13px] space-y-1">
            {resultados.map(r => (
              <div key={r.email} className="flex flex-wrap justify-between gap-2">
                <span>{r.nome || r.email}</span>
                <span className={r.status === 'enviado' ? 'font-bold text-[#14532D]' : 'font-bold text-[#B42318]'}>
                  {r.status === 'enviado' ? 'Enviado' : r.status === 'ja_enviado' ? `Já recebeu em ${dataBr(r.detalhe || null)}` : r.status === 'fora_da_lista' ? 'Fora da lista' : `Não saiu: ${r.detalhe}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
