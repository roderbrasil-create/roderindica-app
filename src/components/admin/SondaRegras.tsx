import { useCallback, useEffect, useState } from 'react';
import { getDocFromServer, doc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, signInAnonymously, deleteUser } from 'firebase/auth';
import { getStorage, ref, getMetadata } from 'firebase/storage';
import { ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { db } from '../../lib/firebase';
import firebaseConfig from '../../../firebase-applet-config.json';
import {
  SONDA_FIRESTORE, SONDA_STORAGE, VERSAO_REGRAS_TEXTO, LINK_REGRAS_FIRESTORE, LINK_REGRAS_STORAGE,
  interpretarFirestore, interpretarStorage, type ResultadoSonda,
} from '../../lib/sondaRegras';

// Confirma, de dentro do app, se as regras do Firestore e do Storage publicadas no console do Firebase
// são as desta versão do código. Lê um documento e um arquivo "sonda" que só as regras novas deixam ler.
const codigoDe = (e: any): string => String(e?.code || '');

async function sondarFirestore(): Promise<ResultadoSonda> {
  try { await getDocFromServer(doc(db, SONDA_FIRESTORE[0], SONDA_FIRESTORE[1])); return interpretarFirestore(null); }
  catch (e) { return interpretarFirestore(codigoDe(e).replace('firestore/', '')); }
}

async function sondarStorage(): Promise<ResultadoSonda> {
  // app separado, só em memória, com login anônimo: não mexe na sessão de quem está conferindo
  const app = initializeApp(firebaseConfig, `sonda-${Date.now()}`);
  try {
    const auth = initializeAuth(app, { persistence: inMemoryPersistence });
    let cred;
    try { cred = await signInAnonymously(auth); } catch { return 'incerto'; }
    try { await getMetadata(ref(getStorage(app), SONDA_STORAGE)); return interpretarStorage(null); }
    catch (e) { return interpretarStorage(codigoDe(e)); }
    finally { await deleteUser(cred.user).catch(() => {}); }
  } finally {
    deleteApp(app).catch(() => {});
  }
}

function Selo({ r }: { r: ResultadoSonda | null }) {
  if (!r) return <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Conferindo...</span>;
  if (r === 'publicada') return <span className="rounded-md bg-[#DCFCE7] px-2 py-1 text-[12.5px] font-extrabold text-[#14532D]">Publicadas (versão {VERSAO_REGRAS_TEXTO})</span>;
  if (r === 'falta') return <span className="rounded-md bg-[#FEE4E2] px-2 py-1 text-[12.5px] font-extrabold text-[#B42318]">Falta publicar</span>;
  return <span className="rounded-md bg-[#F1F2F4] px-2 py-1 text-[12.5px] font-extrabold text-[#3E444B]">Não consegui conferir</span>;
}

function Item({ nome, arquivo, link, r }: { nome: string; arquivo: string; link: string; r: ResultadoSonda | null }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold">{nome}</span>
        <Selo r={r} />
      </div>
      {r === 'falta' && (
        <p className="m-0 mt-2 text-[13px] leading-snug text-muted-foreground">
          Abra o <a href={link} target="_blank" rel="noreferrer" className="font-bold underline">console do Firebase, aba Regras</a>,
          cole o conteúdo do arquivo <code>{arquivo}</code> e toque em Publicar. Depois volte aqui e toque em "Conferir de novo".
        </p>
      )}
      {r === 'incerto' && (
        <p className="m-0 mt-2 text-[13px] leading-snug text-muted-foreground">Sem resposta clara agora (conexão ou login anônimo desligado). Tente de novo.</p>
      )}
    </div>
  );
}

export default function SondaRegras() {
  const [fs, setFs] = useState<ResultadoSonda | null>(null);
  const [st, setSt] = useState<ResultadoSonda | null>(null);
  const conferir = useCallback(() => {
    setFs(null); setSt(null);
    sondarFirestore().then(setFs).catch(() => setFs('incerto'));
    sondarStorage().then(setSt).catch(() => setSt('incerto'));
  }, []);
  useEffect(() => { conferir(); }, [conferir]);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> Regras de segurança</CardTitle>
        <p className="m-0 text-[13px] text-muted-foreground">Confere se as regras publicadas no Firebase são as da versão {VERSAO_REGRAS_TEXTO} do app.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <Item nome="Firestore (banco de dados)" arquivo="firestore.rules" link={LINK_REGRAS_FIRESTORE} r={fs} />
        <Item nome="Storage (arquivos)" arquivo="storage.rules" link={LINK_REGRAS_STORAGE} r={st} />
        <Button type="button" variant="outline" onClick={conferir} disabled={fs === null || st === null} className="h-auto min-h-[44px] w-full sm:w-auto font-bold">
          <RefreshCw className="h-4 w-4 mr-2" /> Conferir de novo
        </Button>
      </CardContent>
    </Card>
  );
}
