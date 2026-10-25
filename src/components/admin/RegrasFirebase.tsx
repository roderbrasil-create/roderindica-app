import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, ChevronDown, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  VERSAO_REGRAS_TEXTO, LINK_REGRAS_FIRESTORE, LINK_REGRAS_STORAGE, type ResultadoSonda,
} from '../../lib/sondaRegras';
import { Item, sondarFirestore, sondarStorage } from './SondaRegras';
import RegrasSeguranca from './RegrasSeguranca';

// Um card só para as regras de segurança do Firebase: o resultado da conferência fica à vista no
// cabeçalho e o que é para publicar ou voltar só abre quando alguém pede. Quem não é administrador
// vê a conferência, mas não os botões de publicar (o servidor também recusa).
export default function RegrasFirebase({ podePublicar }: { podePublicar: boolean }) {
  const [fs, setFs] = useState<ResultadoSonda | null>(null);
  const [st, setSt] = useState<ResultadoSonda | null>(null);
  const [aberto, setAberto] = useState(false);

  const conferir = useCallback(() => {
    setFs(null); setSt(null);
    sondarFirestore().then(setFs).catch(() => setFs('incerto'));
    sondarStorage().then(setSt).catch(() => setSt('incerto'));
  }, []);
  useEffect(() => { conferir(); }, [conferir]);

  const conferindo = fs === null || st === null;
  let chip = 'Conferindo...'; let cor = 'bg-muted text-muted-foreground';
  if (!conferindo) {
    if (fs === 'publicada' && st === 'publicada') { chip = `Banco e arquivos: publicadas, versão ${VERSAO_REGRAS_TEXTO}`; cor = 'bg-[#DCFCE7] text-[#14532D] dark:bg-emerald-950/40 dark:text-emerald-300'; }
    else if (fs === 'falta' || st === 'falta') { chip = 'Falta publicar'; cor = 'bg-[#FEE4E2] text-[#B42318] dark:bg-red-950/40 dark:text-red-300'; }
    else { chip = 'Não consegui conferir'; cor = 'bg-muted text-foreground'; }
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <button type="button" onClick={() => setAberto(v => !v)} aria-expanded={aberto}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 text-left">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Regras de segurança (Firebase)
          </CardTitle>
          <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </button>
        <div><span className={`inline-block rounded-md px-2 py-1 text-[12.5px] font-extrabold ${cor}`}>{chip}</span></div>
        <p className="m-0 text-[12.5px] text-muted-foreground">Se a conferência das contas da equipe tiver pendência, ela aparece ao abrir os detalhes. Confere se as regras publicadas no Firebase são as da versão {VERSAO_REGRAS_TEXTO} do app.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={conferir} disabled={conferindo} className="min-h-[44px] font-bold">
            <RefreshCw className="h-4 w-4 mr-2" /> Conferir de novo
          </Button>
          <Button type="button" variant="outline" onClick={() => setAberto(v => !v)} className="min-h-[44px] font-bold">
            {aberto ? 'Esconder detalhes' : (podePublicar ? 'Ver detalhes e publicar' : 'Ver detalhes')}
          </Button>
        </div>
        {aberto && (
          <div className="space-y-3 pt-1">
            <Item nome="Firestore (banco de dados)" arquivo="firestore.rules" link={LINK_REGRAS_FIRESTORE} r={fs} />
            <Item nome="Storage (arquivos)" arquivo="storage.rules" link={LINK_REGRAS_STORAGE} r={st} />
            {podePublicar && <RegrasSeguranca aoAgir={conferir} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
