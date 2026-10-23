// ÚNICA fonte do texto do Contrato de Parceria Comercial. A tela (Contract.tsx) e o PDF
// (contratoPdf.ts) leem esta mesma estrutura, então nunca divergem.
import { textoPercentualContrato } from './percentualContrato';
import { dataDaAssinatura } from './contratoAssinado';

/** Trecho de texto; b = negrito */
export type Trecho = { t: string; b?: boolean };
export type Paragrafo = Trecho[];
export type Clausula = { titulo: string; paragrafos: Paragrafo[] };

export interface EntradaContrato {
  nome: string;
  email: string;
  telefone: string;
  pix: string;
  /** mostra a linha da chave PIX (parceiro comissionado) */
  mostrarPix: boolean;
  /** taxa do cadastro (ou a da prévia); sem valor válido vira 2% */
  taxa: unknown;
  /** parceiro já assinou ou acabou de marcar o aceite */
  aceito: boolean;
  /** contract_accepted_at em qualquer formato aceito por dataDaAssinatura */
  dataAceite?: unknown;
  /** data de hoje formatada, usada só enquanto o aceite é recente e sem data gravada */
  hoje?: string;
}

export interface ContratoMontado {
  titulo: string;
  empresa: string;
  cnpj: string;
  tituloInstrumento: string;
  versao: string;
  abertura: Paragrafo;
  qualificacao: { rotulo: string; valor: string }[];
  encerramentoAbertura: Paragrafo;
  clausulas: Clausula[];
  assinatura: {
    roder: { rotulo: string; nome: string; cnpj: string };
    parceiro: { assinado: boolean; linha1: string; linha2: string; nome: string; papel: string };
  };
}

const n = (t: string): Trecho => ({ t });
const b = (t: string): Trecho => ({ t, b: true });

export const CNPJ_RODER = '05.420.841/0001-71';

/** Texto da assinatura do parceiro: "ASSINADO DIGITALMENTE / EM dd/mm/aaaa" ou "Aguardando Assinatura" */
export function rotuloAssinaturaParceiro(e: { aceito: boolean; dataAceite?: unknown; hoje?: string; jaGravado?: boolean }) {
  if (!e.aceito) return { assinado: false, linha1: 'Aguardando Assinatura', linha2: '' };
  const data = dataDaAssinatura(e.dataAceite) ?? (e.jaGravado ? 'DATA NÃO REGISTRADA' : (e.hoje || new Date().toLocaleDateString('pt-BR')));
  return { assinado: true, linha1: 'ASSINADO DIGITALMENTE', linha2: `EM ${data}` };
}

export function montarContrato(e: EntradaContrato & { jaGravado?: boolean }): ContratoMontado {
  const comissao = textoPercentualContrato(e.taxa);
  const ass = rotuloAssinaturaParceiro(e);
  const qualificacao = [
    { rotulo: 'NOME', valor: e.nome },
    { rotulo: 'E-MAIL', valor: e.email },
    { rotulo: 'TELEFONE', valor: e.telefone },
  ];
  if (e.mostrarPix) qualificacao.push({ rotulo: 'CHAVE PIX PARA PAGAMENTO', valor: e.pix });

  return {
    titulo: 'Contrato de Parceria Comercial',
    empresa: 'RODER MÁQUINAS E EQUIPAMENTOS',
    cnpj: CNPJ_RODER,
    tituloInstrumento: 'Instrumento Particular de Parceria Comercial',
    versao: 'Versão 2024.4 - Atualizado em 08/05/2026',
    abertura: [
      n('Pelo presente instrumento particular, de um lado '), b('RODER MÁQUINAS E EQUIPAMENTOS'),
      n(`, inscrita no CNPJ sob nº ${CNPJ_RODER}, com sede em Pardinho/SP, doravante denominada `), b('RODER'),
      n(', e de outro lado o '), b('PARCEIRO INDICADOR'), n(', abaixo qualificado:'),
    ],
    qualificacao,
    encerramentoAbertura: [n('Resolvem celebrar o presente contrato de parceria comercial conforme as cláusulas abaixo:')],
    clausulas: [
      { titulo: 'CLÁUSULA 1ª – DO OBJETO', paragrafos: [
        [n('1.1. O presente contrato tem por objeto a intermediação de vendas de equipamentos da '), b('RODER'), n(' pelo '), b('PARCEIRO INDICADOR'), n(', através do sistema de indicações via aplicativo.')],
      ] },
      { titulo: 'CLÁUSULA 2ª – DAS COMISSÕES E BASE DE CÁLCULO', paragrafos: [
        [n('2.1. O '), b('PARCEIRO INDICADOR'), n(' fará jus a uma comissão de '), b(comissao), n(' sobre o '), b('VALOR BASE DE TABELA'), n(' do equipamento vendido.')],
        [n('2.2. '), b('Base de Cálculo:'), n(' A comissão incide exclusivamente sobre o valor bruto de tabela do equipamento (Roder ou FAE).')],
        [n('2.3. '), b('Exclusões:'), n(' Estão expressamente excluídos da base de cálculo os valores de: kits de instalação, suportes, adaptadores, componentes hidráulicos, mão de obra, serviços técnicos, acessórios e frete.')],
      ] },
      { titulo: 'CLÁUSULA 3ª – DA VALIDADE DAS PROPOSTAS E RENOVAÇÃO', paragrafos: [
        [n('3.1. '), b('Prazo de Validade:'), n(' Cada orçamento terá validade de '), b('60 (sessenta) dias corridos'), n(', contados a partir do upload do orçamento no aplicativo.')],
        [n('3.2. '), b('Cancelamento Automático:'), n(' Após 60 dias sem fechamento, a proposta é automaticamente cancelada pelo sistema.')],
        [n('3.3. '), b('Renovação:'), n(' Para reativar uma proposta vencida, o '), b('PARCEIRO INDICADOR'), n(' deve solicitar uma atualização de preços e anexar prova de interesse atual do cliente (print ou áudio).')],
        [n('3.4. '), b('Regra de Relacionamento (Bypass):'), n(' Se o cliente procurar a '), b('RODER'), n(' diretamente após o vencimento dos 60 dias para atualizar o orçamento, sem passar pelo indicador, a comissão deixará de ser devida ao '), b('PARCEIRO INDICADOR'), n('.')],
      ] },
      { titulo: 'CLÁUSULA 4ª – DOS CRITÉRIOS DE ELEGIBILIDADE (PROTEÇÃO DE LEADS)', paragrafos: [
        [n('4.1. '), b('Regra de Oferta Aberta:'), n(' A aceitação da indicação depende da inexistência de negociações ou orçamentos em aberto para o cliente na plataforma '), b('RODER INDICA'), n(' ou no '), b('CRM AGENDOR'), n(' da empresa.')],
        [n('4.2. '), b('Ineligibilidade por Negociação Ativa:'), n(' Caso Luana verifique que já existe uma oferta ou negociação em aberto com o cliente nos últimos '), b('60 (sessenta) dias'), n(', a indicação não será aceita. O indicador receberá a mensagem de que o cliente já está em negociação direta com a empresa.')],
        [n('4.3. '), b('Elegibilidade por Inatividade ou Novo Produto:'), n(' A indicação será aceita normalmente se: (a) Não houver oferta aberta nos últimos 60 dias; ou (b) Tratar-se de uma indicação para um equipamento significativamente diferente do que já está em negociação, '), b('desde que realizada pelo mesmo parceiro indicador'), n('.')],
        [n('4.4. '), b('Encaminhamento Preferencial:'), n(' Caso o cliente já esteja cadastrado no CRM com uma vendedora interna responsável, a indicação aceita será obrigatoriamente encaminhada para a mesma vendedora, mantendo a continuidade do atendimento.')],
        [n('4.5. '), b('Proteção contra Multi-Indicadores:'), n(' Caso outro parceiro indicador realize uma indicação para um cliente que já possua negociação ativa ou orçamento aberto (dentro do prazo de 60 dias), independentemente do equipamento indicado, a indicação deste segundo parceiro será recusada em favor do atendimento já iniciado e do primeiro indicador validado.')],
      ] },
      { titulo: 'CLÁUSULA 5ª – DA RECORRÊNCIA E RESPONSABILIDADE', paragrafos: [
        [n('5.1. A primeira venda da indicação validada será integralmente comissionada ao '), b('PARCEIRO INDICADOR'), n('.')],
        [n('5.2. O '), b('PARCEIRO INDICADOR'), n(' não é um vendedor fixo responsável pela conta do cliente.')],
        [n('5.3. '), b('Vendas Futuras:'), n(' Para receber comissões em novas vendas para o mesmo cliente, o '), b('PARCEIRO INDICADOR'), n(' deve abrir uma nova solicitação no aplicativo. Se o cliente procurar a '), b('RODER'), n(' diretamente para novas compras, entende-se que ele deseja atendimento direto, e nenhuma comissão será devida ao indicador.')],
      ] },
      { titulo: 'CLÁUSULA 6ª – DO CICLO DE FATURAMENTO E PAGAMENTO', paragrafos: [
        [n('6.1. '), b('Período de Apuração:'), n(' As comissões serão somadas com base nas vendas efetivadas do dia 01 ao último dia do mês anterior.')],
        [n('6.2. '), b('Relatório Mensal:'), n(' No dia 01 de cada mês, o '), b('PARCEIRO INDICADOR'), n(' receberá via aplicativo um relatório com os valores das comissões apuradas.')],
        [n('6.3. '), b('Nota Fiscal:'), n(' Com base no relatório, o '), b('PARCEIRO INDICADOR'), n(' deverá emitir a Nota Fiscal de Prestação de Serviços e realizar o carregamento (upload) no aplicativo impreterivelmente até o dia '), b('05 do mês vigente'), n('.')],
        [n('6.4. '), b('Consequência de Atraso:'), n(' Ao descumprir o prazo de envio da Nota Fiscal até o dia 05, o referido pagamento será automaticamente postergado para o ciclo de pagamento do mês subsequente, condicionado ao envio da mesma.')],
        [n('6.5. '), b('Pagamento:'), n(' Após o recebimento e validação da Nota Fiscal via aplicativo, o financeiro da '), b('RODER'), n(' realizará o pagamento via PIX na chave cadastrada até o dia '), b('07 do mês'), n(' (se o dia 07 cair em sábado, domingo ou feriado, o pagamento será feito no próximo dia útil), desde que o prazo da cláusula 6.3 tenha sido respeitado.')],
        [n('6.6. '), b('Comprovante:'), n(' O financeiro anexará o comprovante de pagamento diretamente no aplicativo para consulta do '), b('PARCEIRO INDICADOR'), n('.')],
      ] },
      { titulo: 'CLÁUSULA 7ª – DISPOSIÇÕES GERAIS', paragrafos: [
        [n('7.1. '), b('Confidencialidade:'), n(' O '), b('PARCEIRO INDICADOR'), n(' obriga-se a manter sigilo sobre tabelas de preços e dados estratégicos da '), b('RODER'), n('.')],
        [n('7.2. '), b('LGPD:'), n(' As partes declaram conformidade com a Lei Geral de Proteção de Dados no tratamento das informações de clientes.')],
      ] },
    ],
    assinatura: {
      roder: { rotulo: 'Assinado Digitalmente via App', nome: 'RODER MÁQUINAS E EQUIPAMENTOS', cnpj: `CNPJ: ${CNPJ_RODER}` },
      parceiro: { assinado: ass.assinado, linha1: ass.linha1, linha2: ass.linha2, nome: e.nome, papel: 'PARCEIRO INDICADOR' },
    },
  };
}

/** Texto corrido de um parágrafo (sem negrito), para teste e para o pdftotext */
export const textoDoParagrafo = (p: Paragrafo) => p.map(x => x.t).join('');

/** Nome de arquivo seguro: Contrato_Parceria_Roder_<nome>.pdf (sem acento, espaço ou caractere inválido) */
export function nomeArquivoContrato(nomeParceiro?: string | null): string {
  const limpo = String(nomeParceiro || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60).replace(/_+$/g, '');
  return `Contrato_Parceria_Roder_${limpo || 'Parceiro'}.pdf`;
}
