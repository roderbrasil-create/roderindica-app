import { maskPhone, maskCpfCnpj } from './masks';

// Dados editáveis da tela "Minha conta" e a conferência de alterações, para a barra de
// salvar só aparecer quando alguma coisa mudou de verdade.

export interface DadosConta {
  name: string;
  email: string;
  phone: string;
  company_name: string;
  cpf_cnpj: string;
  city: string;
  state: string;
  pix_key: string;
  bank_info: { bank: string; agency: string; account: string };
}

/** Valores do formulário a partir do perfil gravado (o "original" que o Descartar restaura). */
export function dadosDoPerfil(profile: any): DadosConta {
  const banco = profile?.bank_info || {};
  return {
    name: (profile?.name || '').replace('Jefferson', 'Jeferson'),
    email: profile?.email || '',
    phone: maskPhone(profile?.phone || ''),
    company_name: profile?.company_name || '',
    cpf_cnpj: maskCpfCnpj(profile?.cpf_cnpj || ''),
    city: profile?.city || '',
    state: profile?.state || '',
    pix_key: profile?.pix_key || '',
    bank_info: { bank: banco.bank || '', agency: banco.agency || '', account: banco.account || '' },
  };
}

/** Verdadeiro quando o formulário difere do original. Espaço nas pontas não conta. */
export function houveAlteracao(atual: DadosConta, original: DadosConta): boolean {
  const t = (v: unknown) => String(v ?? '').trim();
  const chaves: (keyof Omit<DadosConta, 'bank_info'>)[] = ['name', 'email', 'phone', 'company_name', 'cpf_cnpj', 'city', 'state', 'pix_key'];
  if (chaves.some(k => t(atual[k]) !== t(original[k]))) return true;
  const a = atual.bank_info || ({} as DadosConta['bank_info']);
  const o = original.bank_info || ({} as DadosConta['bank_info']);
  return (['bank', 'agency', 'account'] as const).some(k => t(a[k]) !== t(o[k]));
}

/** Nome do perfil mostrado no menu da conta. */
export function rotuloDoPerfil(f: { isAdmin?: boolean; isManager?: boolean; isTriagem?: boolean; isInternalSeller?: boolean; isExternalSeller?: boolean; isRegionalSeller?: boolean; isFinancial?: boolean }, role?: string): string {
  if (f.isAdmin) return 'Administrador';
  if (f.isManager) return 'Gerente';
  if (f.isTriagem) return 'Triagem';
  if (f.isInternalSeller) return 'Vendedor Interno';
  if (f.isExternalSeller) return 'Parceiro Roder';
  if (f.isRegionalSeller) return 'Vendedor Regional';
  if (f.isFinancial) return 'Financeiro';
  return (role || '').replace(/_/g, ' ');
}
