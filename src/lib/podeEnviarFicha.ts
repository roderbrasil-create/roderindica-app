import { useAuthOpcional } from '../contexts/AuthContext';

// Equipe que entrou sem login pelo link /consultor-equipe (e-mail conferido no servidor)
export function equipeSemLogin(): boolean {
  try {
    const p = JSON.parse(localStorage.getItem('roder_public_user_profile') || 'null');
    return !!(p && p.equipe === true && p.userType === 'vendedor');
  } catch {
    return false;
  }
}

// Regra do Jeferson: parceiro/indicador (e o consultor público) só VÊ a ficha.
// Baixar, salvar PDF e enviar ficam só para a equipe Roder.
export function usePodeEnviarFicha(): boolean {
  const auth = useAuthOpcional() as any;
  if (auth?.user) return !!auth.isEquipeRoder;
  return equipeSemLogin();
}

// Leitor de documentos: logado, vale a regra acima. Sem login, só o consultor público
// (/consultor...) fica sem baixar; o cliente que abre a ficha pela tela de orçamento continua baixando.
export function usePodeBaixarDocumento(): boolean {
  const auth = useAuthOpcional() as any;
  if (auth?.user) return !!auth.isEquipeRoder;
  const rota = typeof window !== 'undefined' ? window.location.pathname : '';
  if (rota.startsWith('/consultor')) return equipeSemLogin();
  return true;
}
