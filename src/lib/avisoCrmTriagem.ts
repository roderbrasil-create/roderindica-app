// Faixa da Triagem avisando que a triagem também pode ser feita no CRM Roder Vision.
// Só aparece a partir de 26/10/2026, pelo dia de Brasília (e não o do aparelho de quem abre).
export const DIA_AVISO_CRM_TRIAGEM = '2026-10-26';
export const TEXTO_AVISO_CRM_TRIAGEM = 'Agora as indicações também chegam ao CRM Roder Vision, e a triagem já pode ser feita lá. Esta tela continua funcionando como reserva.';

export function avisoCrmTriagemVisivel(agora: Date = new Date()): boolean {
  // en-CA devolve AAAA-MM-DD, que compara certo como texto
  const dia = agora.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  return dia >= DIA_AVISO_CRM_TRIAGEM;
}
