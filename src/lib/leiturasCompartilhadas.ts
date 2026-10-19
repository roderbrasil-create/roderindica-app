// Leituras do Firestore que sobrevivem à troca de tela.
//
// O problema real: o Layout é montado dentro de cada página (23 páginas), e cada
// página abre os seus próprios ouvintes. Ao trocar de tela, tudo é desmontado e
// remontado, e cada getDocs volta a baixar a coleção inteira do servidor. Foi isso
// que fez o app bater na cota de leitura ("Cota excedida"). Aqui ficam dois
// remédios pequenos, que não mudam o que as telas mostram:
//
// 1. ouvirCompartilhado: um onSnapshot por consulta, dividido entre todas as telas
//    que pedem a mesma coisa. Quando a última tela sai, o ouvinte continua vivo por
//    alguns minutos; se a pessoa voltar nesse tempo, recebe o último resultado na
//    hora, sem ler nada de novo. Ouvinte vivo só paga leitura do que MUDOU.
//
// 2. lerComCache: um getDocs que guarda o resultado por um tempo curto. Usado só
//    onde a tela já fazia uma leitura única (não ao vivo) da coleção inteira.
//
// Ao sair da conta, tudo é desligado e esquecido, para o próximo usuário do mesmo
// aparelho nunca receber dado guardado de outra pessoa.

import { onSnapshot, type Query, type DocumentReference, type FirestoreError, type SnapshotListenOptions } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Quanto tempo o ouvinte fica vivo depois que a última tela que usava ele saiu.
const TEMPO_VIVO_SEM_TELA_MS = 10 * 60 * 1000;

type Ouvinte = { proximo: (snap: any) => void; erro?: (e: FirestoreError) => void };
type Entrada = {
  cancelar: () => void;
  ultimo: any | null;
  ouvintes: Set<Ouvinte>;
  timer: ReturnType<typeof setTimeout> | null;
};

const entradas = new Map<string, Entrada>();
const caches = new Map<string, { em: number; promessa: Promise<any> }>();

function encerrarTudo() {
  entradas.forEach(e => {
    if (e.timer) clearTimeout(e.timer);
    try { e.cancelar(); } catch { /* já estava desligado */ }
  });
  entradas.clear();
  caches.clear();
}

try {
  onAuthStateChanged(auth, (u) => { if (!u) encerrarTudo(); });
} catch {
  // sem auth não há o que limpar
}

/**
 * Igual a onSnapshot(alvo, proximo, erro), mas um ouvinte só por `chave`.
 * A chave precisa identificar a consulta inteira (inclua o uid quando a consulta
 * depende do usuário). Devolve a função de desligar, como o onSnapshot.
 * `opcoes` vale para quem abre o ouvinte; use sempre as mesmas para a mesma chave.
 */
export function ouvirCompartilhado(
  chave: string,
  alvo: Query<any> | DocumentReference<any>,
  proximo: (snap: any) => void,
  erro?: (e: FirestoreError) => void,
  opcoes?: SnapshotListenOptions
): () => void {
  let entrada = entradas.get(chave);
  if (!entrada) {
    const nova: Entrada = { cancelar: () => {}, ultimo: null, ouvintes: new Set(), timer: null };
    nova.cancelar = onSnapshot(
      alvo as any,
      opcoes ?? {},
      (snap: any) => {
        nova.ultimo = snap;
        nova.ouvintes.forEach(o => o.proximo(snap));
      },
      (err: FirestoreError) => {
        // Ouvinte que deu erro morre: o próximo pedido abre outro do zero.
        if (entradas.get(chave) === nova) entradas.delete(chave);
        if (nova.timer) clearTimeout(nova.timer);
        nova.ouvintes.forEach(o => o.erro?.(err));
      }
    );
    entradas.set(chave, nova);
    entrada = nova;
  }

  if (entrada.timer) {
    clearTimeout(entrada.timer);
    entrada.timer = null;
  }

  const ouvinte: Ouvinte = { proximo, erro };
  entrada.ouvintes.add(ouvinte);

  // Quem chega depois recebe o último resultado na hora, sem nova leitura.
  if (entrada.ultimo) {
    const atual = entrada;
    queueMicrotask(() => {
      if (atual.ouvintes.has(ouvinte) && atual.ultimo) ouvinte.proximo(atual.ultimo);
    });
  }

  const dono = entrada;
  return () => {
    dono.ouvintes.delete(ouvinte);
    if (dono.ouvintes.size === 0 && entradas.get(chave) === dono && !dono.timer) {
      dono.timer = setTimeout(() => {
        dono.timer = null;
        if (dono.ouvintes.size > 0) return;
        try { dono.cancelar(); } catch { /* já estava desligado */ }
        if (entradas.get(chave) === dono) entradas.delete(chave);
      }, TEMPO_VIVO_SEM_TELA_MS);
    }
  };
}

/**
 * Faz a leitura única `ler()` e guarda o resultado por `validadeMs`. Duas telas
 * pedindo ao mesmo tempo dividem a mesma leitura. Erro não fica guardado.
 */
export function lerComCache<T>(chave: string, validadeMs: number, ler: () => Promise<T>): Promise<T> {
  const agora = Date.now();
  const guardado = caches.get(chave);
  if (guardado && agora - guardado.em < validadeMs) return guardado.promessa as Promise<T>;

  const promessa = ler().catch(err => {
    if (caches.get(chave)?.promessa === promessa) caches.delete(chave);
    throw err;
  });
  caches.set(chave, { em: agora, promessa });
  return promessa;
}

/** Esquece uma leitura guardada (use depois de gravar algo que a tela precisa ver na hora). */
export function esquecerCache(chave: string) {
  caches.delete(chave);
}
