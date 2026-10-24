import { useCallback, useEffect, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { auth } from '../../lib/firebase';
import { getApiBaseUrl } from '../../lib/utils';

// Integração com o CRM do Roder Vision. Só o administrador vê.
// A carga inicial manda ao CRM as indicações abertas que ainda não foram enviadas (cada uma uma só vez).
interface Estado { ativo: boolean; tem_chave: boolean; tem_segredo: boolean; destino: string; ativo_desde: string | null; pendentes_da_carga: number | null }

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
      if (simulacao) toast.info(`${r.elegiveis} indicação(ões) abertas ainda não enviadas.`);
      else toast.success(`${r.enviadas} enviada(s), ${r.falhas} com falha. Faltam ${r.restantes}.`, { duration: 8000 });
    } catch (e: any) {
      toast.error(e.message || 'Não deu certo.');
    } finally { setOcupado(false); carregar(); }
  };

  if (!estado) return null;
  const pronto = estado.ativo && estado.tem_chave;
  return (
    <Card className="max-w-5xl mb-6">
      <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4" /> CRM (Roder Vision)</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          {estado.ativo ? 'Ligado' : 'Desligado'}{estado.destino ? ` · destino ${estado.destino}` : ''}
          {!estado.tem_chave ? ' · falta a chave' : ''}{!estado.tem_segredo ? ' · falta o segredo' : ''}
          {estado.pendentes_da_carga !== null ? ` · ${estado.pendentes_da_carga} aguardando a carga inicial` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={ocupado || !estado.ativo} onClick={() => carga(true)}>Simular carga</Button>
          <Button size="sm" disabled={ocupado || !pronto} onClick={() => carga(false)}>
            {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar indicações abertas ao CRM'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
