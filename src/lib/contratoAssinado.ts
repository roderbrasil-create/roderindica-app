// O contrato assinado NAO e um arquivo: a tela /contrato desenha o texto na hora
// a partir do perfil (contract_accepted + contract_accepted_at). Por isso o botao
// "Visualizar Contrato" so precisa abrir /contrato em modo leitura.

/** Endereco do contrato em modo leitura para quem ja assinou. Sem `uid` o app
 *  manda quem ja assinou de volta para a tela inicial (era o defeito). */
export function enderecoDoContratoAssinado(uid?: string | null): string {
  return uid ? `/contrato?ver=1&uid=${encodeURIComponent(uid)}` : '/contrato?ver=1';
}

/** Data de assinatura legivel, aceitando os formatos que ja existiram:
 *  texto ISO, Timestamp do Firestore (toDate / seconds), numero em ms ou vazio. */
export function dataDaAssinatura(valor: unknown): string | null {
  if (valor == null || valor === '') return null;
  let d: Date;
  const v = valor as any;
  if (v instanceof Date) d = v;
  else if (typeof v === 'object' && typeof v.toDate === 'function') d = v.toDate();
  else if (typeof v === 'object' && typeof v.seconds === 'number') d = new Date(v.seconds * 1000);
  else if (typeof v === 'number' || typeof v === 'string') d = new Date(v);
  else return null;
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR');
}

const PENDENTE = 'A PREENCHER NO PERFIL';

export interface DadosContratoEntrada {
  isPreview: boolean;
  /** modo leitura (?ver=1 ou ?uid=): os dados vem SEMPRE do perfil que esta sendo visto */
  somenteLeitura: boolean;
  step: 'data' | 'contract';
  viewProfile?: { name?: string; email?: string; phone?: string; pix_key?: string } | null;
  formData: { name: string; email: string; phone: string; pix_key: string };
}

/** Nome, e-mail, telefone e PIX que o contrato mostra. No modo leitura nunca le o
 *  formulario (que fica vazio ali): era o que deixava o contrato em branco. */
export function dadosDeExibicaoDoContrato(e: DadosContratoEntrada) {
  if (e.isPreview) {
    return { nome: 'NOME DO PARCEIRO', pix: 'CHAVE PIX AQUI', email: 'EMAIL@EXEMPLO.COM', telefone: '(00) 00000-0000' };
  }
  const f = e.somenteLeitura || e.step !== 'contract' ? e.viewProfile : e.formData;
  return {
    nome: f?.name || '',
    pix: f?.pix_key || PENDENTE,
    email: f?.email || PENDENTE,
    telefone: f?.phone || '',
  };
}
