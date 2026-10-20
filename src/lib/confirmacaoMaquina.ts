// Kit de instalação depende de COMO A MÁQUINA ESTÁ CONFIGURADA (regra do Jeferson, 20/10/2026).
// Modelo e número de série não bastam: o serial mostra como a máquina saiu de fábrica, e a
// concessionária pode ter acrescentado fatias extras no comando depois, sem isso entrar no serial.
// Este arquivo guarda: a regra que vai no prompt do consultor, o reconhecimento da pergunta de kit,
// e o texto pronto de WhatsApp que pede ao cliente o vídeo e as fotos da máquina.
// Sem dependência do navegador: o servidor e os testes importam este arquivo.
import type { VideoConsultor } from './videosConsultor';

// Frase curta repetida ao lado de cada kit citado no prompt: kit é possibilidade, nunca resposta por modelo
export const RESSALVA_KIT = 'Estes kits são POSSIBILIDADES, nunca afirme pelo modelo nem pelo serial. Só indique o kit depois que a fatia extra, a função dupla com duas saídas tampadas (garra traçadora) e as linhas do braço forem confirmadas.';

export const REGRA_KIT_CONFIRMACAO = `
REGRA PRIORITÁRIA DE KIT DE INSTALAÇÃO (vale acima das regras de kit mais abaixo, que continuam valendo como possibilidades):
   • Quando a pergunta for QUAL KIT de instalação, kit hidráulico ou mangueiras usar numa máquina (qualquer marca, e principalmente Caterpillar, que tem muitas configurações no 320 e nos outros), NUNCA afirme um kit só pelo modelo ou pelo número de série. Não escreva "o kit é tal" como resposta final.
   • Explique em 2 frases curtas o porquê: o kit depende de como a máquina está configurada (fatia extra no comando, linhas no braço), e o número de série mostra só como ela saiu de fábrica, não o que a concessionária acrescentou depois.
   • Diga o que precisa ser confirmado: se existe fatia extra no comando; no caso da GARRA TRAÇADORA, se a fatia extra é de FUNÇÃO DUPLA com as duas saídas tampadas (é o que o kit completo normalmente exige); e quais linhas hidráulicas já existem no braço.
   • Você pode citar os kits que costumam existir como POSSIBILIDADES (ex.: máquina com fatia extra sem linha, máquina sem fatia extra, máquina com linha de rompedor), sempre deixando claro que dependem da confirmação. Use só códigos que estejam na lista de kits cadastrados ou nas regras acima; NUNCA invente código de kit.
   • Termine oferecendo o pedido de confirmação ao cliente: fotos do comando hidráulico (bloco de válvulas), da bomba hidráulica e dos DOIS joysticks, mais um VÍDEO mostrando as linhas hidráulicas do braço. O app mostra abaixo da sua resposta o botão "Pedir confirmação da máquina ao cliente" com o texto pronto; diga ao vendedor que ele está logo abaixo. Não escreva o texto do pedido por extenso.
   • Se o vendedor já informou e confirmou a configuração (fatia extra, linhas do braço), pode indicar o kit, citando o que foi confirmado.
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
    ? `1) Um vídeo curto, no mesmo modelo deste exemplo: ${link}\nMostre as linhas hidráulicas que existem no braço da máquina e a cabine por dentro.`
    : '1) Um vídeo curto mostrando as linhas hidráulicas que existem no braço da máquina e a cabine por dentro.';
  return `Olá! Para indicar o kit hidráulico certo para a sua máquina, preciso ver como ela está configurada. Pode me enviar?\n\n${video}\n\n2) Fotos do comando hidráulico (bloco de válvulas), da bomba hidráulica e dos dois joysticks.\n\nCom isso a gente confirma o kit sem erro. Obrigado!`;
}

// Mostra o botão: o consultor marcou no painel, ou a pergunta do vendedor era sobre kit
export function precisaConfirmarMaquina(painel: { confirmar_maquina?: boolean } | null | undefined, perguntaAnterior: string): boolean {
  return painel?.confirmar_maquina === true || perguntaDeKit(perguntaAnterior);
}
