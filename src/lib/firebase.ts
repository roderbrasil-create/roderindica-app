import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Explicitly set persistence to local to handle iframe storage partitioning better
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error("Auth persistence error:", err);
});

// Initialize Firestore with modern persistence configuration
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);

export const storage = getStorage(app);

// Error Handling for Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
// testConnection();

// Primeiro acesso: o servidor passa o cadastro feito pelo admin para o uid desta pessoa.
// Falhar aqui não impede o login: o caminho antigo, no navegador, continua logo depois.
// motivo 'email_nao_confirmado': conta de senha sem e-mail confirmado e sem senha definida pela
// Roder depois de criada. entrar_de_novo: o servidor confirmou o e-mail e derrubou os logins
// antigos (inclusive este); quem tem a senha na mão entra de novo para pegar o token confirmado.
// motivo 'token_revogado': o login já tinha sido derrubado (o servidor responde 401).
//
// UM PEDIDO SÓ POR LOGIN. A tela de login e o AuthContext chamavam isto ao mesmo tempo: o primeiro
// pedido confirmava o e-mail e derrubava os logins, o segundo chegava com o token já derrubado e o
// AuthContext ainda ignorava o entrar_de_novo. Agora os dois recebem a MESMA resposta, e quem tem a
// senha na mão (a tela de login, marcada por loginComSenhaEmAndamento) entra de novo; sem senha na
// mão, o AuthContext sai e pede para entrar de novo.
export type ResultadoReivindicar = { merged: boolean; motivo?: string; entrar_de_novo?: boolean };
const pedidosReivindicar = new Map<string, { em: number; promessa: Promise<ResultadoReivindicar> }>();
let loginComSenha = 0;
export function marcarLoginComSenha(emAndamento: boolean) {
  loginComSenha = Math.max(0, loginComSenha + (emAndamento ? 1 : -1));
}
export function loginComSenhaEmAndamento(): boolean {
  return loginComSenha > 0;
}
async function pedirReivindicar(token: string): Promise<ResultadoReivindicar> {
  try {
    const r = await fetch('/api/auth/reivindicar-perfil', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && j.codigo === 'token_revogado') return { merged: false, motivo: 'token_revogado' };
    return { merged: !!j.merged, motivo: j.motivo, entrar_de_novo: !!j.entrar_de_novo };
  } catch { return { merged: false }; }
}
export async function reivindicarPerfilDetalhado(): Promise<ResultadoReivindicar> {
  try {
    const u = auth.currentUser;
    if (!u || u.isAnonymous || !u.email) return { merged: false };
    const token = await u.getIdToken();
    // mesma conta e mesmo momento de login: reaproveita o pedido (em andamento ou recém-respondido)
    const tk = await u.getIdTokenResult();
    const chave = `${u.uid}:${tk.authTime}`;
    const anterior = pedidosReivindicar.get(chave);
    if (anterior && Date.now() - anterior.em < 60_000) return anterior.promessa;
    const promessa = pedirReivindicar(token);
    pedidosReivindicar.set(chave, { em: Date.now(), promessa });
    return promessa;
  } catch { return { merged: false }; }
}
export async function reivindicarPerfil(): Promise<boolean> {
  return (await reivindicarPerfilDetalhado()).merged;
}
