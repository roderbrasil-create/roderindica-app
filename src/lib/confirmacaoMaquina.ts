// Kit de instalação depende de COMO A MÁQUINA ESTÁ CONFIGURADA (regra do Jeferson, 20/10/2026).
// Modelo e número de série não bastam: o serial mostra como a máquina saiu de fábrica, e a
// concessionária pode ter acrescentado fatias extras no comando depois, sem isso entrar no serial.
// Este arquivo guarda: a regra que vai no prompt do consultor, o reconhecimento da pergunta de kit,
// e o texto pronto de WhatsApp que pede ao cliente o vídeo e as fotos da máquina.
// Sem dependência do navegador: o servidor e os testes importam este arquivo.
import type { VideoConsultor } from './videosConsultor';

// Frase curta repetida ao lado de cada kit citado no prompt. Regra do Jeferson (20/10/2026): sem a configuração AFIRMADA pelo vendedor, nenhum código de kit é citado.
export const RESSALVA_KIT = 'REGRA DE KIT: enquanto o vendedor não AFIRMAR a configuração da máquina (fatia extra com saída dupla, joystick eletrônico ou hidráulico, GC/NG sem fatia), NÃO cite código de kit, NÃO liste opções de kit e NÃO escreva "possível kit". "Acho que tem" ou falta de informação não vale como afirmação, e modelo ou número de série nunca decidem. Nesse caso responda em 1 ou 2 frases curtas: a configuração varia de máquina para máquina e o primeiro passo é pedir ao cliente o vídeo no modelo do vídeo de amostra; aponte o botão "Pedir confirmação da máquina ao cliente" logo abaixo (confirmar_maquina true). Na dúvida, peça sempre o vídeo (no modelo) OU o contato do vendedor da máquina, para o técnico especialista conversar com ele ou analisar o vídeo e definir os kits. Lembre também que o kit depende do modelo da máquina EM CONJUNTO com o tipo de suporte do implemento (link, ponteira, lança extensora) e do equipamento, então pergunte o suporte e nunca chute código: um código errado entra errado no pedido de venda. Só quando o vendedor afirmar a configuração você pode citar os kits cadastrados correspondentes, como resposta baseada no que ele informou, lembrando que o técnico Roder confirma na conferência final.';

// O que o kit de baixa (9003) é de verdade, conferido nos itens do cadastro (src/constants.ts). Sem linhas hidráulicas.
export const KIT_BAIXA_SEM_LINHAS = 'O kit de baixa 9000.9000.9003 sozinho NÃO tem tubulações nem mangueiras. Pelo cadastro ele é só: a bomba de engrenagem extra (48 cc), o comando elétrico de uma seção (80 L) que recebe o fluxo dessa bomba extra e a caixa elétrica de controle do comando, com a manopla de joystick, o botão pulsante, os conectores e os adaptadores de conexão. Ele SEMPRE precisa de outro kit com as linhas hidráulicas, que depende do equipamento a instalar (9000.9000.9035 para CMF; para garra, destocador, feller e outros, o kit de linhas correspondente do cadastro).';

// CMF em CAT 320 nova (regra do Jeferson). Usado na regra e nas regras antigas do prompt, para não divergirem.
export const TEXTO_CMF_CAT320 = 'CMF em CAT 320 nova (GC, NG ou eletrônica, a partir de cerca de 2020, joystick eletrônico). SÓ quando o VENDEDOR AFIRMAR a configuração: (a) fatia extra dupla já acionada no joystick eletrônico, faltando só a tubulação: kit 9000.9000.9035 (KIT INSTALACAO CMF500/600 EM ESCAVADEIRA, MAQUINA COM FATIA EXTRA ACIONADA SEM LINHA), que traz toda a linha hidráulica do CMF e vale para CMF 500, 600 e 800. (b) GC ou NG SEM fatia extra: kit de baixa 9000.9000.9003 (KIT BAIXA PRESSAO 1 SECCAO DUPLA CAT320GC/NG 24V, 80L/190BAR) para o giro do rotator, MAIS o 9000.9000.9035 para as linhas. ' + KIT_BAIXA_SEM_LINHAS + ' CAT mais antiga de comando pilotado sem fatia extra: precisa de fatia ou bomba extra, e o técnico Roder define. Garra de carregamento usa o 9003 para o rotator, mais o kit de linhas da garra: o técnico informa o código. Em CAT 320 nova a fatia é instalada pela concessionária; nas outras máquinas, o técnico Roder define após o vídeo. Sem a afirmação do vendedor, NÃO cite nenhum desses códigos: peça o vídeo no modelo do vídeo de amostra e aponte o botão. Máquina nova e cliente sem a informação: peça o contato do vendedor ou da concessionária da máquina; a Roder fala com ele para saber como a máquina será fornecida e só então passa o valor do kit. Se for preciso instalar a fatia extra original pela concessionária, a Roder orienta o vendedor a repassar esse valor ao cliente. O técnico Roder confirma na conferência final. Não declare "perigoso" ou "inviável" só pelo modelo; bloco de pressão piloto para serra e tilt só se o técnico confirmar.';

// Sequência do vídeo que o cliente grava (a mesma do vídeo modelo). Usada no texto do WhatsApp e no prompt, para não divergirem.
export const SEQUENCIA_VIDEO_PROMPT = 'UM vídeo na mesma sequência do vídeo modelo: (1) braço e lança da máquina, mostrando as tubulações; (2) comando hidráulico, que fica atrás do motor de giro; (3) dentro da cabine, os joysticks e os pedais; (4) se possível, em Caterpillar de modelo novo, abrir e filmar a porta traseira para mostrar a bomba hidráulica. Fotos só como complemento.';

export const REGRA_KIT_CONFIRMACAO = `
REGRA PRIORITÁRIA DE KIT DE INSTALAÇÃO (vale acima de TODAS as regras de kit mais abaixo, que só valem depois de o vendedor afirmar a configuração):
   • PASSO 1, o padrão: quando o vendedor falar de uma máquina (escavadeira, qualquer marca, principalmente Caterpillar) e de kit, instalação, kit hidráulico ou mangueiras, e a configuração NÃO foi afirmada por ele, NUNCA cite código de kit, NUNCA liste opções de kit e NUNCA escreva "possível kit". Não decida por modelo nem por número de série: o serial mostra como a máquina saiu de fábrica, não o que foi acrescentado depois. Responda curto, em 1 ou 2 frases: a configuração varia de máquina para máquina e o primeiro passo é pedir ao cliente o vídeo no modelo do vídeo de amostra. Diga que o botão "Pedir confirmação da máquina ao cliente" está logo abaixo, com o texto pronto para enviar, e não escreva o texto do pedido por extenso. No JSON do <painel>, acrescente "confirmar_maquina": true.
   • O KIT NÃO DEPENDE SÓ DA FATIA NEM SÓ DA MÁQUINA: depende do modelo da máquina EM CONJUNTO com o tipo de suporte do implemento (link, ponteira, lança extensora etc.) e do equipamento (garra, garra traçadora, cabeçote multifuncional, destocador, feller, triturador). Exemplo: garra de carregamento com link e com ponteira usam kits hidráulicos diferentes, específicos para a máquina; o rotator com ou sem passagem extra e as máquinas de 20 ton também mudam o kit. Quando o vendedor perguntar de kit, diga isso em uma frase e peça também o tipo de suporte (link, ponteira ou lança extensora). Esse conhecimento serve para você explicar que as variações existem; NÃO liste códigos para o vendedor, para ele não colocar código errado em pedido de venda. Na dúvida, peça sempre ao cliente o vídeo (no modelo do vídeo de amostra) OU o contato do vendedor da máquina, para o técnico especialista conversar com o vendedor ou analisar o vídeo e definir os kits.
   • PASSO 2, a única exceção: se o vendedor AFIRMA a configuração (ex.: "é uma CAT 320 nova com joystick eletrônico e já tem fatia extra dupla" ou "é CAT 320 GC/NG sem fatia extra"), você pode insistir com resposta técnica e citar o(s) kit(s) cadastrados correspondentes, como afirmação baseada no que o vendedor informou (com fatia extra dupla acionada: 9000.9000.9035; GC/NG sem fatia: o kit de baixa 9000.9000.9003 para a linha do rotator mais o kit de linhas do equipamento), lembrando que o técnico Roder confirma na conferência final. "Acho que tem", "deve ter" ou ausência de informação NÃO valem: volte ao passo 1. Só cite código que esteja na lista de kits cadastrados do contexto; sem item cadastrado, diga que o técnico informa o código.
   • KIT DE BAIXA (9000.9000.9003): ${KIT_BAIXA_SEM_LINHAS}
   • REQUISITO GERAL: a máquina precisa ter, no comando hidráulico (bloco de válvulas), pelo menos a FATIA EXTRA COM SAÍDA DUPLA (duas saídas, com os dois tampões) disponível. Com ela, a Roder vende o kit de instalação completo (todas as linhas hidráulicas, válvulas, eletroválvulas e acionamento elétrico). Isso vale para a maioria das máquinas com joystick hidráulico pilotado (Komatsu, Hyundai, JCB, John Deere e outras). NÃO exija "linhas hidráulicas no braço": elas são só um complemento opcional do vídeo, nunca requisito.
   • CAT 320 tem várias configurações. Antigas (320C, 320D, 320FM): comando pilotado com joystick hidráulico, mesmo padrão das outras marcas. Novas (a partir de cerca de 2020: 320GC, 320NG nova geração, e "320" sem nomenclatura antiga): joystick ELETRÔNICO, de acionamento elétrico, não pilotado. Nelas, para os equipamentos que exigem fatia extra, a máquina JÁ deve ter a fatia extra no comando, ligada ao joystick eletrônico por chicote elétrico. Muitas saem sem fatia extra, e a Roder NÃO instala fatia extra em CAT nova: o cliente deve pedir à concessionária que instale a fatia extra e deixe a ligação elétrica/eletrônica pronta no joystick. Só diga isso depois de o vídeo mostrar o caso ou de o vendedor afirmá-lo; não presuma pelo modelo.
   • EXCEÇÃO na CAT 320 nova: garra de carregamento, garras florestais (de carregamento) e cabeçote multifuncional podem ser instalados MESMO SEM fatia extra, com o "kit de baixa" (9003; o técnico confirma a pressão; cadastro do 9003: 190 bar). ${TEXTO_CMF_CAT320} Esta exceção também só vale depois de o vendedor afirmar a configuração (passo 2).
   • PROPOSTA OU LISTA DE COMPONENTES (ex.: vendedor de peças ou exportação pergunta o que incluir na proposta de um CMF numa CAT 320, com série informada e "configuração padrão"): "padrão" e série não são afirmação. NÃO entregue lista de kit, válvulas e linhas, nem cite código. Explique em 2 frases que a CAT 320 tem configurações diferentes (antiga com joystick hidráulico, nova com joystick eletrônico; fatia extra com saída dupla já instalada ou não), peça o vídeo no modelo do vídeo de amostra e aponte o botão. O técnico Roder confirma os kits.
   • Melhor resposta: pedir o vídeo para passar ao técnico Roder responsável, que informa os kits e se o cliente precisa pedir a fatia extra à concessionária. Explique em 2 frases curtas por que a configuração é confirmada assim, sem afirmar kit nem fatia por serial ou modelo.
   • O pedido ao cliente é ${SEQUENCIA_VIDEO_PROMPT} Não dê a entender que a concessionária é obrigatória antes da análise: por ora é só coletar o vídeo.
   • No JSON do <painel>, sempre que aplicar esta regra sem a afirmação do vendedor, acrescente "confirmar_maquina": true.`;

export const AVISO_SEM_AMOSTRA = 'Ainda não há vídeo de amostra cadastrado.';

// Instrução curta do prompt sobre o vídeo de amostra (o consultor não inventa link)
export function instrucaoAmostra(temAmostra: boolean): string {
  return temAmostra
    ? '\n\nVÍDEO DE AMOSTRA DE FILMAGEM: já está cadastrado. O botão do pedido de confirmação leva o link sozinho; não escreva link nem id de vídeo no texto.'
    : `\n\nVÍDEO DE AMOSTRA DE FILMAGEM: ainda não há vídeo cadastrado. Quando aplicar a regra de confirmação da máquina, diga ao vendedor numa frase curta: "${AVISO_SEM_AMOSTRA}" O botão do pedido continua funcionando, só sem o link.`;
}

const semAcento = (t: string) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// A pergunta é sobre QUAL KIT usar? "kit" junto de instalação, hidráulico, mangueira, garra ou máquina
export function perguntaDeKit(texto: string): boolean {
  const t = semAcento(texto);
  if (!t.trim()) return false;
  if (/\bkits?\b/.test(t) && /(instala|hidraul|mangueira|garra|tracador|cabecote|destocador|cmf|escavadeira|maquina|cat\b|caterpillar|\b3\d\d\b|pc\d|volvo|komatsu|enviar|usar|indicar|serve|serv[ei])/.test(t)) return true;
  return /\bmangueiras?\b/.test(t) && /(qual|quais|que)\b.*(usar|enviar|precisa|instalar|kit)/.test(t);
}

// Link do vídeo de amostra que o cliente abre sem login: YouTube ou arquivo do Storage com token
// (os dois já são públicos por natureza). db-file:// só abre dentro do app, então não serve.
export function linkPublicoDoVideo(v: Pick<VideoConsultor, 'video_url'> | null | undefined): string {
  const u = String(v?.video_url || '').trim();
  return /^https:\/\/[^\s]+$/i.test(u) && u.length <= 2000 ? u : '';
}

// O vídeo marcado como amostra de filmagem (o primeiro pela ordem da biblioteca); ou nada
export function videoAmostraDe(lista: VideoConsultor[] | null | undefined): VideoConsultor | undefined {
  return (lista || []).find(v => v.tipo === 'amostra' && !!linkPublicoDoVideo(v));
}

// Texto pronto do WhatsApp. Curto, cordial, sem travessão. Com vídeo modelo leva o link; sem ele, avisa que o vendedor envia um de exemplo.
export function textoPedirConfirmacaoMaquina(linkAmostra = ''): string {
  const link = /^https:\/\/\S+$/i.test(String(linkAmostra || '').trim()) ? String(linkAmostra).trim() : '';
  const modelo = link
    ? `Segue um vídeo modelo para você seguir: ${link}`
    : 'Junto com esta mensagem, o vendedor envia um vídeo de exemplo para você seguir.';
  return `Olá! Para indicar o kit hidráulico certo para a sua máquina, preciso ver como ela está configurada. Pode me enviar UM vídeo, seguindo esta sequência?\n\n1) Filme o braço e a lança da máquina, mostrando as tubulações.\n2) Filme o comando hidráulico da máquina, que fica atrás do motor de giro.\n3) Filme dentro da cabine os joysticks e os pedais.\n4) Se possível, quando for Caterpillar de modelo novo, abra e filme a porta traseira para mostrar a bomba hidráulica.\n\n${modelo}\n\nPode enviar o vídeo por aqui mesmo. Se quiser, mande fotos também, como complemento. Obrigado!`;
}

// Mostra o botão: o consultor marcou no painel, ou a pergunta do vendedor era sobre kit
export function precisaConfirmarMaquina(painel: { confirmar_maquina?: boolean } | null | undefined, perguntaAnterior: string): boolean {
  return painel?.confirmar_maquina === true || perguntaDeKit(perguntaAnterior);
}
