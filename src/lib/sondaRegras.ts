// Sondas de versão das regras de segurança (firestore.rules e storage.rules).
// Quem mexe numa regra SOBE a versão nos TRÊS lugares: esta constante, o doc/objeto sonda de
// firestore.rules e o de storage.rules (o teste testes-servidor/sonda-regras.test.ts confere).
export const VERSAO_REGRAS = '2026_10_25';
export const VERSAO_REGRAS_TEXTO = VERSAO_REGRAS.replace(/_/g, '-');
export const SONDA_FIRESTORE = ['_sonda_regras', `v_${VERSAO_REGRAS}`] as const;
export const SONDA_STORAGE = `_sonda_regras/v_${VERSAO_REGRAS}.txt`;

export const LINK_REGRAS_FIRESTORE = 'https://console.firebase.google.com/project/gen-lang-client-0708423613/firestore/databases/ai-studio-e7c58188-6deb-4a73-b6a5-1858f8dce981/rules';
export const LINK_REGRAS_STORAGE = 'https://console.firebase.google.com/project/gen-lang-client-0708423613/storage/gen-lang-client-0708423613.firebasestorage.app/rules';

export type ResultadoSonda = 'publicada' | 'falta' | 'incerto';

// Firestore: documento lido ou "not-found" = a regra de leitura da sonda existe; "permission-denied" = regras antigas.
export function interpretarFirestore(codigo: string | null): ResultadoSonda {
  if (codigo === null || codigo === 'not-found') return 'publicada';
  if (codigo === 'permission-denied') return 'falta';
  return 'incerto';
}

// Storage: a sonda é lida com um login ANÔNIMO. As regras antigas só deixam ler quem tem login de verdade
// (logado() exclui o anônimo), então "unauthorized" = regras antigas; a regra da sonda aceita qualquer login,
// então "object-not-found" (ou sucesso) = regras novas. Lida com o login da própria pessoa, a sonda daria
// sempre "ok", porque a regra geral de leitura já deixava passar.
export function interpretarStorage(codigo: string | null): ResultadoSonda {
  if (codigo === null || codigo === 'storage/object-not-found') return 'publicada';
  if (codigo === 'storage/unauthorized') return 'falta';
  return 'incerto';
}
