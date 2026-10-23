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
