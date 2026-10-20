import { useState } from 'react';
import { ImageDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

// "Trazer fotos do site para o app": copia para o Storage do app as fotos do catálogo que ainda
// apontam para o site (roderbrasil.com.br) e troca o endereço no produto. Primeiro confere sem
// gravar e mostra o resumo; só grava no segundo botão. Só o administrador vê.
type Item = { url: string; usos: number; produtos: string[]; ok: boolean; motivo?: string; bytes?: number };
type Resultado = {
  aplicado: boolean; referencias: number; fotos_de_fora: number; nesta_rodada: number; copiaveis: number;
  com_problema: number; produtos_alterados: number; faltam_para_proxima_rodada: number; itens: Item[];
  limite_por_rodada?: number; erros_ao_trocar?: number;
};

export default function FotosExternas() {
  const [ocupado, setOcupado] = useState<'' | 'conferir' | 'aplicar'>('');
  const [r, setR] = useState<Resultado | null>(null);

  const rodar = async (aplicar: boolean) => {
    if (aplicar && !window.confirm(`Copiar ${r?.copiaveis || 0} foto(s) para o app e trocar o endereço no catálogo?`)) return;
    setOcupado(aplicar ? 'aplicar' : 'conferir');
    try {
      const resp = await fetch(`/api/admin/fotos-externas?aplicar=${aplicar ? 1 : 0}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok || !j.ok) { toast.error(j.error || 'Não deu certo.'); return; }
      setR(j);
      if (aplicar) toast.success(`${j.produtos_alterados} equipamento(s) atualizado(s).`);
    } catch {
      toast.error('Sem conexão com o servidor.');
    } finally {
      setOcupado('');
    }
  };

  const problemas = (r?.itens || []).filter(i => !i.ok);
  return (
    <Card className="bg-card border-border shadow-sm mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <ImageDown className="h-5 w-5 text-orange-500" /> Trazer fotos do site para o app
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Fotos do catálogo que ainda vêm do site da Roder passam a ficar guardadas no próprio app. Se o site mudar ou sair do ar, a foto continua aparecendo no app e no WhatsApp.
        </p>
        {r && (
          <div className="text-sm space-y-1 rounded-md border border-border p-3">
            {r.aplicado
              ? <p className="font-bold text-emerald-600">Feito: {r.produtos_alterados} equipamento(s) atualizado(s).</p>
              : <p className="font-bold">Conferido, nada foi gravado ainda.</p>}
            <p>Fotos de fora do app: <b>{r.fotos_de_fora}</b> (usadas {r.referencias} vez(es))</p>
            <p>Podem ser copiadas: <b>{r.copiaveis}</b>{r.com_problema ? <> · com problema: <b className="text-amber-600">{r.com_problema}</b></> : null}</p>
            {r.nesta_rodada < r.fotos_de_fora && <p className="text-xs text-muted-foreground">Cada rodada faz no máximo {r.limite_por_rodada || 60} fotos.</p>}
            {!!r.erros_ao_trocar && <p className="text-amber-600">{r.erros_ao_trocar} equipamento(s) não foram trocados (tente de novo).</p>}
            {r.faltam_para_proxima_rodada > 0 && (
              <p className="font-bold text-amber-600">
                Faltam {r.faltam_para_proxima_rodada} foto(s): {r.aplicado ? 'clique em Conferir e copie de novo.' : 'depois de copiar estas, rode de novo.'}
              </p>
            )}
            {problemas.length > 0 && (
              <ul className="text-xs text-muted-foreground list-disc pl-4 max-h-40 overflow-y-auto break-all">
                {problemas.slice(0, 30).map(i => <li key={i.url}>{i.produtos.join(', ')}: {i.motivo}</li>)}
              </ul>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" onClick={() => rodar(false)} disabled={!!ocupado}>
            {ocupado === 'conferir' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageDown className="h-4 w-4 mr-2" />}
            Conferir (sem gravar)
          </Button>
          <Button onClick={() => rodar(true)} disabled={!!ocupado || !r || r.aplicado || !r.copiaveis} className="bg-[#facc15] text-black hover:bg-[#eab308] font-bold">
            {ocupado === 'aplicar' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Copiar {r && !r.aplicado ? r.copiaveis : ''} foto(s) para o app
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
