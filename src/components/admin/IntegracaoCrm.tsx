import { useCallback, useEffect, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { auth } from '../../lib/firebase';
import { getApiBaseUrl } from '../../lib/utils';

// Integração com o CRM do Roder Vision. Só o administrador vê.
// A carga inicial manda ao CRM as indicações abertas que ainda não foram enviadas (cada uma uma só vez).
interface Estado { ativo: boolean; tem_chave: boolean; tem_segredo: boolean; destino: string; ativo_desde: string | null; pode_carga: boolean; pendentes_da_carga: number | null; pendentes_como_novas: number | null; desistiram: number; carga_inicial_em: string | null; alerta_transporte: { motivo: string; seguidas: number; em: string } | null }

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

export default function IntegracaoCrm() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try { setEstado(await chamar('/api/admin/crm/estado')); } catch { setEstado(null); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const carga = async (simulacao: boolean) => {
    if (!simulacao && !window.confirm('Enviar ao CRM as indicações abertas que ainda não foram enviadas? Cada uma vai uma vez só.')) return;
    setOcupado(true);
    try {
      const r = await chamar('/api/admin/crm/carga-inicial', { simulacao });
      if (simulacao) toast.info(`${r.elegiveis} em negociação na carga; ${r.pendentes_novas ?? 0} pendentes irão como novas na virada, sem aviso por e-mail.`, { duration: 8000 });
      else {
        const q = r.resumo || {};
        toast.success(`${r.enviadas} enviada(s), ${r.falhas} com falha. CRM: ${q.recebidos ?? 0} recebidas, ${q.vinculados ?? 0} vinculadas, ${q.repetidos ?? 0} repetidas, ${q.ignorados ?? 0} ignoradas. Faltam ${r.restantes}.`, { duration: 12000 });
      }
    } catch (e: any) {
      toast.error(e.message || 'Não deu certo.');
    } finally { setOcupado(false); carregar(); }
  };

  const reativar = async () => {
    if (!window.confirm('Tentar de novo as indicações e comissões em que o envio ao CRM desistiu?')) return;
    setOcupado(true);
    try {
      const r = await chamar('/api/admin/crm/reativar', {});
      toast.success(`${r.indicacoes} indicação(ões) e ${r.comissoes} comissão(ões) voltaram para a fila.`);
    } catch (e: any) { toast.error(e.message || 'Não deu certo.'); } finally { setOcupado(false); carregar(); }
  };

  if (!estado) return null;
  const pronto = estado.pode_carga;
  return (
    <Card className="max-w-5xl mb-6">
      <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4" /> CRM (Roder Vision)</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          {estado.ativo ? 'Ligado' : 'Desligado'}{estado.destino ? ` · destino ${estado.destino}` : ''}
          {!estado.tem_chave ? ' · falta a chave' : ''}{!estado.tem_segredo ? ' · falta o segredo' : ''}
          {estado.pendentes_da_carga !== null ? ` · ${estado.pendentes_da_carga} em negociação na carga` : ''}
          {estado.pendentes_como_novas ? ` · ${estado.pendentes_como_novas} pendentes irão como novas na virada, SEM aviso por e-mail` : ''}
        </p>
        {estado.ativo && (estado.pendentes_da_carga ?? 0) > 0 && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900">
            Carga inicial ainda não feita: {estado.pendentes_da_carga} em negociação ainda não enviadas irão como histórico pelo laço.
          </p>
        )}
        {estado.alerta_transporte && (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-800 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900">
            {estado.alerta_transporte.motivo} {estado.alerta_transporte.seguidas} falha(s) seguidas, a última em {new Date(estado.alerta_transporte.em).toLocaleString('pt-BR')}. Nada foi perdido: o envio tenta de novo sozinho.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={ocupado} onClick={() => carga(true)}>Simular carga</Button>
          <Button size="sm" disabled={ocupado || !pronto} onClick={() => carga(false)}>
            {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar indicações abertas ao CRM'}
          </Button>
          {estado.desistiram > 0 && (
            <Button size="sm" variant="outline" disabled={ocupado} onClick={reativar}>Tentar de novo as que desistiram ({estado.desistiram})</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
