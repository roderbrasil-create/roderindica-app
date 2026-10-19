import { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

// Publica as regras de segurança do Firebase pelo servidor, sem abrir o console.
// Só o administrador vê e usa. "Voltar" põe de volta exatamente a regra que estava no ar antes.
type EstadoAlvo = { no_ar: string | null; atualizada_em: string | null; erro: string | null; ja_e_a_nova: boolean; pode_voltar: boolean };

export default function RegrasSeguranca() {
  const [estado, setEstado] = useState<{ firestore?: EstadoAlvo; storage?: EstadoAlvo } | null>(null);
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
    const pergunta = acao === 'publicar'
      ? 'Publicar as regras novas de segurança agora? Depois, entre no app e peça para alguém da equipe e um parceiro entrarem também.'
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

  return (
    <Card className="bg-card border-border shadow-sm mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" /> Regras de segurança do Firebase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {erro && <p className="text-sm font-bold text-red-600">{erro}</p>}
        {linha('Banco de dados', estado?.firestore)}
        {linha('Arquivos (fotos, vídeos, notas)', estado?.storage)}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={() => agir('publicar')} disabled={!!ocupado || tudoNovo || !estado} className="bg-[#facc15] text-black hover:bg-[#eab308] font-bold">
            {ocupado === 'publicar' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Publicar regras novas
          </Button>
          <Button variant="outline" onClick={() => agir('voltar')} disabled={!!ocupado || !podeVoltar}>
            {ocupado === 'voltar' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Undo2 className="h-4 w-4 mr-2" />}
            Voltar regras anteriores
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Se depois de publicar alguém não conseguir entrar ou salvar, aperte "Voltar regras anteriores".</p>
      </CardContent>
    </Card>
  );
}
