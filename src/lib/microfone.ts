// Gerenciador único do stream do microfone do Consultor.
// No iPhone o Safari pergunta "deseja ter acesso ao microfone" toda vez que o
// getUserMedia é chamado de novo depois de as tracks terem sido paradas. Aqui o
// stream é pedido UMA vez e reaproveitado em todas as gravações enquanto o
// consultor estiver aberto. Cada gravação cria um MediaRecorder novo sobre o
// mesmo stream. O microfone só é liberado (indicador apaga) quando o painel
// fecha, quando a aba fica oculta por mais de 3 segundos ou após 45 segundos sem uso.

// 04/11/2026: antes eram 10 min parado e 2 min com a aba oculta, e o ponto laranja do microfone ficava aceso
// muito depois de a pessoa parar de falar. Agora o microfone apaga 45 s depois do último uso (dá para ditar duas
// mensagens seguidas sem nova pergunta) e 3 s depois de a pessoa sair da tela do app.
export const OCIOSO_MS = 45 * 1000;
export const OCULTA_MS = 3 * 1000;

export interface DependenciasMicrofone {
  pedirStream: () => Promise<MediaStream>;
  agora?: () => number;
  setTimer?: (fn: () => void, ms: number) => any;
  limparTimer?: (id: any) => void;
}

export function criarGerenciadorMicrofone(dep: DependenciasMicrofone) {
  const agora = dep.agora ?? (() => Date.now());
  const setT = dep.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const limparT = dep.limparTimer ?? ((id) => clearTimeout(id));

  let stream: MediaStream | null = null;
  let pendente: Promise<MediaStream> | null = null;
  let emUso = 0;
  let timerOcioso: any = null;
  let timerOculta: any = null;

  const vivo = (s: MediaStream | null): s is MediaStream => {
    if (!s) return false;
    const trilhas = s.getAudioTracks ? s.getAudioTracks() : s.getTracks();
    return trilhas.length > 0 && trilhas.every(t => t.readyState !== 'ended');
  };

  const armarOcioso = () => {
    if (timerOcioso != null) limparT(timerOcioso);
    timerOcioso = setT(() => {
      timerOcioso = null;
      // gravando agora: não derruba, tenta de novo depois
      if (emUso > 0) armarOcioso();
      else liberar();
    }, OCIOSO_MS);
  };

  function liberar() {
    if (timerOcioso != null) { limparT(timerOcioso); timerOcioso = null; }
    if (timerOculta != null) { limparT(timerOculta); timerOculta = null; }
    const s = stream;
    stream = null;
    emUso = 0;
    if (s) s.getTracks().forEach(t => { try { t.stop(); } catch { /* já parada */ } });
  }

  // Devolve o stream vivo, pedindo permissão só se não houver um (ou se a track encerrou).
  async function obterStream(): Promise<MediaStream> {
    if (vivo(stream)) {
      armarOcioso();
      return stream;
    }
    if (stream) liberar();
    if (!pendente) {
      pendente = dep.pedirStream().then(s => {
        stream = s;
        return s;
      }).finally(() => { pendente = null; });
    }
    const s = await pendente;
    armarOcioso();
    return s;
  }

  // Marca o começo/fim de uma gravação (o fim NÃO para as tracks).
  function iniciarUso() { emUso++; }
  function terminarUso() { emUso = Math.max(0, emUso - 1); if (stream) armarOcioso(); }

  // Aba oculta: depois de OCULTA_MS sem voltar, libera o microfone.
  function aoMudarVisibilidade(oculta: boolean) {
    if (oculta) {
      if (timerOculta == null && stream) {
        timerOculta = setT(() => {
          timerOculta = null;
          if (emUso === 0) liberar();
        }, OCULTA_MS);
      }
    } else if (timerOculta != null) {
      limparT(timerOculta);
      timerOculta = null;
    }
  }

  return {
    obterStream,
    iniciarUso,
    terminarUso,
    liberar,
    aoMudarVisibilidade,
    temStream: () => vivo(stream),
    _agora: agora,
  };
}

const global = criarGerenciadorMicrofone({
  pedirStream: () => navigator.mediaDevices.getUserMedia({ audio: true }),
});

let ouvindo = false;
function ouvirVisibilidade() {
  if (ouvindo || typeof document === 'undefined') return;
  ouvindo = true;
  document.addEventListener('visibilitychange', () => {
    global.aoMudarVisibilidade(document.visibilityState === 'hidden');
  });
  // saindo da página (fechar, recarregar, trocar de app no iPhone): apaga o microfone na hora
  window.addEventListener('pagehide', () => { global.liberar(); });
}

export const microfone = {
  obterStream: () => { ouvirVisibilidade(); return global.obterStream(); },
  iniciarUso: global.iniciarUso,
  terminarUso: global.terminarUso,
  liberar: global.liberar,
  temStream: global.temStream,
};
