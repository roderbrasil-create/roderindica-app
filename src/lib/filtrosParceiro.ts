import { where, type QueryFieldFilterConstraint } from 'firebase/firestore';
import { auth } from './firebase';

// Filtros que o parceiro (external_seller / vendedor_padrao) pode mandar na busca de indicações.
// A regra do Firebase (firestore.rules, match /indications) só deixa ele ler o que é dele, pelo
// uid ou pelo e-mail do login, e recusa a consulta "ou" INTEIRA se um único filtro não tiver como
// ser provado pela regra. Por isso aqui não entra filtro por nome (external_seller_name,
// indicator_name), nem o e-mail como foi digitado no cadastro: com qualquer um deles a tela do
// parceiro viria vazia. As indicações antigas ligadas só pelo nome ganham o uid do dono pelo
// servidor (server.ts, backfill_dono_indicacoes_v1).
export function filtrosDoParceiro(
  perfil: { uid?: string; email?: string } | null | undefined,
  perfilReal?: { uid?: string } | null,
  incluirRegional = false,
): QueryFieldFilterConstraint[] {
  const f: QueryFieldFilterConstraint[] = [];
  if (!perfil?.uid) return f;
  f.push(where('external_seller_uid', '==', perfil.uid));
  f.push(where('created_by', '==', perfil.uid));
  f.push(where('user_id', '==', perfil.uid));
  f.push(where('indicator_uid', '==', perfil.uid));
  if (incluirRegional) f.push(where('standard_seller_uid', '==', perfil.uid));
  // E-mail do PRÓPRIO login, que é o que a regra confere. Quem está "vendo como" o parceiro é
  // admin e lê tudo, então ali vale o e-mail do cadastro do parceiro.
  const vendoComo = !!perfilReal?.uid && perfilReal.uid !== perfil.uid;
  // e-mail não confirmado (login Google raro) faria a regra recusar a busca inteira: aí fica só o uid
  const emailConfiavel = !!auth.currentUser && (auth.currentUser.emailVerified || auth.currentUser.providerData.some(p => p.providerId === 'password'));
  const email = vendoComo ? perfil.email : (emailConfiavel ? auth.currentUser?.email : null);
  if (email) f.push(where('external_seller_email', '==', email.toLowerCase()));
  return f;
}
