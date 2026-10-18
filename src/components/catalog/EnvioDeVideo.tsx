import { useEffect, useRef, useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Video, Play, Trash2, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { abrirDocumento } from '../../lib/abrirDocumento';

// Vídeo do equipamento: link do YouTube ou arquivo da galeria do celular.
// O arquivo começa a subir assim que é escolhido, com a porcentagem na tela. Antes ele só subia
// ao tocar em Salvar, sem nenhum sinal: num vídeo grande pelo 4G o botão ficava girando
// minutos e parecia travado.
const LIMITE_MB = 500;

export function EnvioDeVideo({ valor, aoMudar, pasta, aoEnviando, titulo }: {
  valor: string;
  aoMudar: (url: string) => void;
  pasta: string;
  aoEnviando?: (enviando: boolean) => void;
  titulo?: string;
}) {
  const [progresso, setProgresso] = useState<{ pct: number; enviado: number; total: number; nome: string } | null>(null);
  const tarefa = useRef<UploadTask | null>(null);
  const [parado, setParado] = useState(false);

  // fechou a tela no meio do envio: cancela e libera o botão Salvar
  useEffect(() => () => { tarefa.current?.cancel(); aoEnviando?.(false); }, []);
  useEffect(() => { aoEnviando?.(!!progresso); }, [!!progresso]);

  const mb = (b: number) => (b / 1024 / 1024).toFixed(b > 100 * 1024 * 1024 ? 0 : 1);
  const ehArquivo = /firebasestorage\.googleapis\.com/.test(valor || '');

  const escolher = (arquivo: File) => {
    if (arquivo.size > LIMITE_MB * 1024 * 1024) {
      toast.error(`Vídeo grande demais (${mb(arquivo.size)} MB). O limite é ${LIMITE_MB} MB. Corte o vídeo no celular ou use um link do YouTube.`);
      return;
    }
    const nomeLimpo = arquivo.name.replace(/[^a-zA-Z0-9.]/g, '_').slice(-60);
    const destino = ref(storage, `${pasta}/${Date.now()}_${nomeLimpo}`);
    const t = uploadBytesResumable(destino, arquivo, { contentType: arquivo.type || 'video/mp4', cacheControl: 'public, max-age=31536000' });
    tarefa.current = t;
    setProgresso({ pct: 0, enviado: 0, total: arquivo.size, nome: arquivo.name });
    setParado(false);
    // nada saiu em 30 s: avisa, em vez de deixar a barra parada em 0% sem explicação
    const vigia = setTimeout(() => { if (tarefa.current === t && t.snapshot.bytesTransferred === 0) setParado(true); }, 30000);
    const fim = () => { clearTimeout(vigia); setParado(false); };
    t.on('state_changed',
      (s) => setProgresso({ pct: Math.floor((s.bytesTransferred / s.totalBytes) * 100), enviado: s.bytesTransferred, total: s.totalBytes, nome: arquivo.name }),
      (erro: any) => {
        fim();
        tarefa.current = null;
        setProgresso(null);
        if (erro?.code === 'storage/canceled') { toast('Envio do vídeo cancelado.'); return; }
        toast.error('O vídeo não subiu. Confira a internet e tente de novo.' + (erro?.code ? ` (${erro.code})` : ''));
      },
      async () => {
        fim();
        try {
          const url = await getDownloadURL(t.snapshot.ref);
          aoMudar(url);
          toast.success('Vídeo enviado! Toque em Salvar para gravar.');
        } catch {
          toast.error('O vídeo subiu, mas não consegui o link. Tente de novo.');
        } finally {
          tarefa.current = null;
          setProgresso(null);
        }
      });
  };

  return (
    <div className="flex flex-col gap-2">
      {!progresso && (
        <div className="flex items-center gap-2">
          <Input
            value={ehArquivo ? '' : (valor || '')}
            onChange={(e) => aoMudar(e.target.value)}
            placeholder={ehArquivo ? 'Vídeo da galeria (abaixo)' : 'Link do YouTube'}
            className="h-10 text-xs flex-1"
          />
          <label className="h-10 px-3 shrink-0 rounded-md border border-slate-300 bg-white flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer active:scale-95">
            <Video className="h-4 w-4" />
            Galeria
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) escolher(f);
              }}
            />
          </label>
        </div>
      )}

      {progresso && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-blue-900">
              Enviando vídeo {progresso.pct}%
            </span>
            <button
              type="button"
              onClick={() => tarefa.current?.cancel()}
              className="h-8 px-2 flex items-center gap-1 text-[11px] font-bold text-slate-600"
            >
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-blue-100 overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${Math.max(2, progresso.pct)}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-blue-900/80">
            {mb(progresso.enviado)} de {mb(progresso.total)} MB · não feche esta tela até terminar
          </p>
          {parado && (
            <p className="mt-1.5 text-[11px] font-bold text-red-700">
              O envio não começou. Pode ser a internet ou o armazenamento de vídeos do app. Cancele e tente de novo no Wi-Fi.
            </p>
          )}
        </div>
      )}

      {!progresso && ehArquivo && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 pl-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Vídeo da galeria pronto
          </span>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs font-bold" onClick={() => abrirDocumento(valor, titulo || 'Vídeo')}>
              <Play className="h-3.5 w-3.5 mr-1" /> Ver
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => aoMudar('')}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
