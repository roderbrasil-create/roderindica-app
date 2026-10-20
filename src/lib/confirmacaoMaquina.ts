// Kit de instalação depende de COMO A MÁQUINA ESTÁ CONFIGURADA (regra do Jeferson, 20/10/2026).
// Modelo e número de série não bastam: o serial mostra como a máquina saiu de fábrica, e a
// concessionária pode ter acrescentado fatias extras no comando depois, sem isso entrar no serial.
// Este arquivo guarda: a regra que vai no prompt do consultor, o reconhecimento da pergunta de kit,
// e o texto pronto de WhatsApp que pede ao cliente o vídeo e as fotos da máquina.
// Sem dependência do navegador: o servidor e os testes importam este arquivo.
import type { VideoConsultor } from './videosConsultor';

// Frase curta repetida ao lado de cada kit citado no prompt: kit é possibilidade, nunca resposta por modelo
export const RESSALVA_KIT = 'Estes kits são POSSIBILIDADES, nunca afirme pelo modelo nem pelo serial. Só indique o kit depois que a configuração for confirmada por foto e vídeo, ou depois de o vendedor informar e confirmar essa configuração: fatia extra com saída dupla (duas saídas com os dois tampões) no comando hidráulico e, em CAT nova, a ligação ao joystick eletrônico. O técnico Roder responsável confirma.';

export const REGRA_KIT_CONFIRMACAO = `
REGRA PRIORITÁRIA DE KIT DE INSTALAÇÃO (vale acima das regras de kit mais abaixo, que continuam valendo como possibilidades):
   • Quando a pergunta for QUAL KIT de instalação, kit hidráulico ou mangueiras usar numa máquina (qualquer marca, e principalmente Caterpillar), NUNCA afirme kit nem fatia extra só pelo modelo ou pelo número de série. O serial mostra como a máquina saiu de fábrica, não o que foi acrescentado depois. A configuração é confirmada por foto e vídeo.
   • REQUISITO GERAL: a máquina precisa ter, no comando hidráulico (bloco de válvulas), pelo menos a FATIA EXTRA COM SAÍDA DUPLA (duas saídas, com os dois tampões) disponível. Com ela, a Roder vende o kit de instalação completo (todas as linhas hidráulicas, válvulas, eletroválvulas e acionamento elétrico). Isso vale para a maioria das máquinas com joystick hidráulico pilotado (Komatsu, Hyundai, JCB, John Deere e outras). NÃO exija "linhas hidráulicas no braço": elas são só um complemento opcional do vídeo, nunca requisito.
   • CAT 320 tem várias configurações. Antigas (320C, 320D, 320FM): comando pilotado com joystick hidráulico, mesmo padrão das outras marcas. Novas (a partir de cerca de 2020: 320GC, 320NG nova geração, e "320" sem nomenclatura antiga): joystick ELETRÔNICO, de acionamento elétrico, não pilotado. Nelas, para os equipamentos que exigem fatia extra, a máquina JÁ deve ter a fatia extra no comando, ligada ao joystick eletrônico por chicote elétrico. Muitas saem sem fatia extra, e a Roder NÃO instala fatia extra em CAT nova: o cliente deve pedir à concessionária que instale a fatia extra e deixe a ligação elétrica/eletrônica pronta no joystick. Só diga isso depois de a foto e o vídeo mostrarem o caso; não presuma pelo modelo.
   • EXCEÇÃO na CAT 320 nova: garra de carregamento, garras florestais (de carregamento) e cabeçote multifuncional podem ser instalados MESMO SEM fatia extra, com o "kit de baixa": bomba extra com comando hidráulico próprio, que dá pressão (o técnico confirma a pressão; cadastro do 9003: 190 bar) à linha do rotator (giro horário e anti-horário). A linha do pistão da caçamba original abre e fecha a garra; no cabeçote multifuncional a mesma função abre/fecha a garra e, com um bloquinho de pressão piloto com botão que a Roder adiciona, aciona serra e tilt. Podem ser DOIS kits: o kit de baixa e o kit de linhas e tubulações hidráulicas. Não invente código: o kit de baixa só pode ter o código citado se estiver na lista de kits cadastrados (ex.: 9000.9000.9003, KIT BAIXA PRESSAO CAT320GC/NG), sempre como possibilidade a confirmar pelo técnico; sem item cadastrado, diga que o técnico informa o código.
   • PROPOSTA OU LISTA DE COMPONENTES (ex.: vendedor de peças ou exportação pergunta o que incluir na proposta de um CMF numa CAT 320, com série informada e "configuração padrão"): NÃO entregue lista fechada de kit, válvulas e linhas como certa, e não use a série nem o "padrão" para decidir. Explique em 2 frases que a CAT 320 tem configurações diferentes (antiga com joystick hidráulico, nova com joystick eletrônico; fatia extra com saída dupla já instalada ou não), peça foto do comando, da bomba, dos dois joysticks e o vídeo, e diga que o técnico Roder confirma os kits. Sendo cabeçote multifuncional, informe que na CAT 320 nova sem fatia extra existe a opção do kit de baixa mais o kit de linhas. Só cite códigos de kit que apareçam na lista de kits cadastrados fornecida no contexto, sempre como possibilidades a confirmar pelo técnico; se o código não estiver na lista, diga que o técnico informa.
   • Melhor resposta: pedir foto e vídeo para passar ao técnico Roder responsável, que informa corretamente os kits e se o cliente precisa pedir a fatia extra à concessionária. Explique em 2 frases curtas por que a configuração é confirmada assim, sem afirmar kit nem fatia por serial ou modelo. Você pode citar os kits que costumam existir como POSSIBILIDADES, deixando claro que dependem da confirmação, usando só códigos cadastrados.
   • O pedido ao cliente é: fotos do comando hidráulico (bloco de válvulas, mostrando as fatias e as saídas), da bomba hidráulica e dos DOIS joysticks, mais um VÍDEO da cabine e do comando, no mesmo modelo do vídeo de amostra. Não dê a entender que a concessionária é obrigatória antes da análise: por ora é só coletar foto e vídeo. O app mostra abaixo da sua resposta o botão "Pedir confirmação da máquina ao cliente" com o texto pronto; diga ao vendedor que ele está logo abaixo e não escreva o texto do pedido por extenso.
   • Se o vendedor já informou e confirmou a configuração (fatia extra com saída dupla, joystick), pode indicar o kit, citando o que foi confirmado.
   • No JSON do <painel>, quando aplicar esta regra, acrescente "confirmar_maquina": true.`;

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

// Texto pronto do WhatsApp. Curto, cordial, sem travessão. Sem vídeo de amostra, o texto sai sem link.
export function textoPedirConfirmacaoMaquina(linkAmostra = ''): string {
  const link = /^https:\/\/\S+$/i.test(String(linkAmostra || '').trim()) ? String(linkAmostra).trim() : '';
  const video = link
    ? `1) Um vídeo curto da cabine e do comando, no mesmo modelo deste exemplo: ${link}`
    : '1) Um vídeo curto mostrando a cabine e o comando hidráulico da máquina.';
  return `Olá! Para indicar o kit hidráulico certo para a sua máquina, preciso ver como ela está configurada. Pode me enviar?\n\n${video}\n\n2) Fotos do comando hidráulico (bloco de válvulas, mostrando as fatias e as saídas), da bomba hidráulica e dos dois joysticks.\n\nCom isso a gente confirma o kit sem erro. Obrigado!`;
}

// Mostra o botão: o consultor marcou no painel, ou a pergunta do vendedor era sobre kit
export function precisaConfirmarMaquina(painel: { confirmar_maquina?: boolean } | null | undefined, perguntaAnterior: string): boolean {
  return painel?.confirmar_maquina === true || perguntaDeKit(perguntaAnterior);
}
