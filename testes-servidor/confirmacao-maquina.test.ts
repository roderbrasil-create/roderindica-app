// Kit depende da configuração da máquina. Rodar: node --import tsx --test testes-servidor/confirmacao-maquina.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  REGRA_KIT_CONFIRMACAO, RESSALVA_KIT, perguntaDeKit, textoPedirConfirmacaoMaquina, videoAmostraDe, linkPublicoDoVideo,
  precisaConfirmarMaquina, instrucaoAmostra, AVISO_SEM_AMOSTRA,
} from '../src/lib/confirmacaoMaquina.ts';
import { montarListaVideos, videosParaPrompt } from '../src/lib/videosConsultor.ts';
import { instrucaoVideos, sanitizarPainel } from '../server/videosConsultor.ts';
import { separarPainel } from '../src/lib/painelConsultor.ts';

const LINK = 'https://firebasestorage.googleapis.com/v0/b/b/o/consultor_videos%2Fa%2Famostra.mp4?alt=media&token=abc';
const docAmostra = (extra: any = {}) => ({ id: 'am1', data: { produto_id: 'geral', equipamento_nome: 'Todos os equipamentos', tipo: 'amostra', titulo: 'Como filmar a máquina', video_url: LINK, ativo: true, ...extra } });
const docCampo = { id: 'v1', data: { produto_id: 'p1', equipamento_nome: 'Garras', tipo: 'campo', titulo: 'Traçando', video_url: 'https://www.youtube.com/watch?v=AAAAAAAAAAA', ativo: true } };

const semDefeito = (t: string) => {
  assert.ok(!/undefined|null|NaN|\[object/.test(t), t);
  assert.ok(!/[—–]/.test(t), 'sem travessão');
  assert.ok(!/\d\s*%/.test(t), 'sem percentual');
  assert.ok(!/comiss/i.test(t), 'sem comissão');
};

test('mensagem pronta COM vídeo de amostra: leva o link, o vídeo do braço, a cabine e as três fotos', () => {
  const t = textoPedirConfirmacaoMaquina(LINK);
  semDefeito(t);
  assert.ok(t.includes(LINK));
  assert.match(t, /vídeo curto da cabine e do comando/);
  assert.match(t, /comando hidráulico \(bloco de válvulas, mostrando as fatias e as saídas\)/);
  assert.ok(!/braço|concession/i.test(t), 'linhas do braço não são requisito e a concessionária não entra no pedido');
  assert.match(t, /bomba hidráulica/);
  assert.match(t, /dois joysticks/);
  assert.ok(t.length < 700, 'texto curto');
});

test('mensagem pronta SEM vídeo de amostra: sai igual, só que sem link e sem "exemplo"', () => {
  for (const vazio of ['', undefined as any, null as any, '  ', 'db-file://x', 'javascript:alert(1)']) {
    const t = textoPedirConfirmacaoMaquina(vazio);
    semDefeito(t);
    assert.ok(!/https?:/.test(t) && !/db-file|javascript/.test(t));
    assert.ok(!/exemplo/.test(t));
    assert.match(t, /vídeo curto mostrando a cabine e o comando/);
    assert.ok(!/braço|concession/i.test(t));
    assert.match(t, /dois joysticks/);
  }
});

test('o vídeo de amostra vem da biblioteca: só tipo amostra, ativo e com link https público', () => {
  const lista = montarListaVideos([docCampo, docAmostra()], []);
  assert.equal(videoAmostraDe(lista)?.id, 'am1');
  assert.equal(linkPublicoDoVideo(videoAmostraDe(lista)), LINK);
  assert.equal(videoAmostraDe(montarListaVideos([docCampo], [])), undefined);
  assert.equal(videoAmostraDe(montarListaVideos([docAmostra({ ativo: false })], [])), undefined);
  // db-file:// só abre dentro do app: o cliente não conseguiria ver, então não conta como amostra
  assert.equal(videoAmostraDe(montarListaVideos([docAmostra({ video_url: 'db-file://abc123' })], [])), undefined);
  assert.equal(videoAmostraDe(null), undefined);
});

test('a amostra NÃO entra no prompt de vídeos nem nos ids que o consultor pode citar', () => {
  const lista = montarListaVideos([docCampo, docAmostra()], []);
  assert.ok(!videosParaPrompt(lista).includes('am1'));
  assert.ok(!instrucaoVideos(lista).includes('am1'));
  assert.ok(instrucaoVideos(lista).includes('v1'));
  assert.equal(instrucaoVideos(montarListaVideos([docAmostra()], [])), '');
  assert.equal(sanitizarPainel('{"confirmar_maquina":true}', new Set(['v1'])), '{"confirmar_maquina":true}');
});

test('regra de prompt: não afirma kit por modelo nem serial, pede confirmação e não inventa código', () => {
  const r = REGRA_KIT_CONFIRMACAO;
  assert.match(r, /NUNCA afirme kit nem fatia extra só pelo modelo ou pelo número de série/);
  assert.match(r, /FATIA EXTRA COM SAÍDA DUPLA \(duas saídas, com os dois tampões\)/);
  assert.match(r, /NÃO exija "linhas hidráulicas no braço"/);
  assert.match(r, /Komatsu, Hyundai, JCB, John Deere/);
  assert.match(r, /320C, 320D, 320FM/);
  assert.match(r, /320GC, 320NG/);
  assert.match(r, /joystick ELETRÔNICO/);
  assert.match(r, /a Roder NÃO instala fatia extra em CAT nova/);
  assert.match(r, /pedir à concessionária que instale a fatia extra/);
  assert.match(r, /EXCEÇÃO na CAT 320 nova/);
  assert.match(r, /kit de baixa/);
  assert.match(r, /até 200 bar/);
  assert.match(r, /DOIS kits/);
  assert.match(r, /o técnico Roder informa o código/);
  assert.match(r, /Não dê a entender que a concessionária é obrigatória antes da análise/);
  assert.match(r, /técnico Roder responsável/);
  assert.match(r, /Não invente código/);
  assert.match(r, /bloco de válvulas, mostrando as fatias e as saídas/);
  assert.match(r, /DOIS joysticks/);
  assert.ok(!/\d\s*%|comiss/i.test(r));
  assert.match(r, /confirmar_maquina/);
  assert.ok(!/[—–]/.test(r));
  // e está de fato dentro do prompt do consultor, sem apagar a regra antiga do kit sem fatia extra
  const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.ok(server.includes('${REGRA_KIT_CONFIRMACAO}'));
  assert.ok(server.includes('DIRETRIZ CRÍTICA PARA INSTALAÇÃO DE GARRA EM ESCAVADEIRAS SEM FATIA EXTRA'));
  assert.ok(server.includes('9000.9000.9016'));
  assert.match(r, /já informou e confirmou a configuração/);
  // nada de código novo: o kit de baixa não tem código cadastrado e a regra não inventa um
  assert.ok(!/9000\.9000\.(9015|9016|9018)/.test(r));
});

test('prompt inteiro: nenhuma regra antiga afirma fatia, bujão ou kit só pelo modelo', () => {
  const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const ini = server.indexOf('const systemInstruction = PRIORITY_RULES');
  const fim = server.indexOf('const finalSystemInstruction');
  assert.ok(ini > 0 && fim > ini);
  const prompt = server.slice(ini, fim);
  const linhas = prompt.split('\n');
  // afirmações por modelo, que o Jeferson mandou trocar
  assert.ok(!/possuem os tamp/i.test(server), 'CAT "possuem os tampões" voltou');
  assert.ok(!/saem de fábrica com o espaço e os tamp/i.test(server));
  assert.ok(!/\*\*NÃO possuem a fatia extra original\*\* de fábrica no comando \(como PC200/.test(server));
  assert.ok(!/que \*\*NÃO\*\* possuem a fatia extra de comando original \(como Komatsu/.test(server));
  assert.ok(server.includes('NUNCA devem ser dados como certos pelo modelo'));
  // todo kit 9015, 9016 ou 9018 e o kit "com fatia extra, sem linha" tem a ressalva por perto
  let achados = 0;
  linhas.forEach((l, i) => {
    if (!/9000\.9000\.90(15|16|18)|máquina com fatia extra, sem linha/.test(l)) return;
    achados++;
    const perto = linhas.slice(Math.max(0, i - 2), i + 3).join('\n');
    assert.ok(perto.includes('RESSALVA_KIT'), `kit sem ressalva: ${l.trim().slice(0, 90)}`);
  });
  assert.ok(achados >= 5, 'a conferência precisa achar os kits do prompt');
  // lista de kits cadastrados e correções aprovadas também levam a ressalva
  assert.match(server, /kits de instalação cadastrados para referência\. \$\{RESSALVA_KIT\}/);
  assert.match(server, /só pelo modelo ou pelo número de série, trate como possibilidade/);
  assert.match(RESSALVA_KIT, /POSSIBILIDADES, nunca afirme pelo modelo nem pelo serial/);
  assert.match(RESSALVA_KIT, /saída dupla/);
  assert.ok(!/linhas do braço/.test(RESSALVA_KIT));
  // vídeo das linhas do braço é complemento opcional, nunca requisito, também nas regras antigas
  assert.match(server, /COMPLEMENTO OPCIONAL \(nunca requisito\)/);
  assert.ok(!/é fundamental que o cliente mostre/.test(server));
});

test('o consultor avisa o vendedor quando não há amostra cadastrada', () => {
  assert.ok(instrucaoAmostra(false).includes(AVISO_SEM_AMOSTRA));
  assert.ok(!instrucaoAmostra(true).includes(AVISO_SEM_AMOSTRA));
  assert.equal(AVISO_SEM_AMOSTRA, 'Ainda não há vídeo de amostra cadastrado.');
});

test('reconhece a pergunta de kit (o caso do Yuri) e não confunde com outras', () => {
  assert.equal(perguntaDeKit('Quais kits hidráulicos enviar com garra traçadora para uma CAT 320?'), true);
  assert.equal(perguntaDeKit('qual kit de instalação uso na PC200?'), true);
  assert.equal(perguntaDeKit('Que mangueiras preciso enviar para instalar o cabeçote?'), true);
  assert.equal(perguntaDeKit('Qual o peso da garra R400?'), false);
  assert.equal(perguntaDeKit(''), false);
  assert.equal(precisaConfirmarMaquina({ confirmar_maquina: true }, ''), true);
  assert.equal(precisaConfirmarMaquina(null, 'qual kit uso na CAT 320 com tracadora'), true);
  assert.equal(precisaConfirmarMaquina({}, 'oi'), false);
});

test('o <painel> com confirmar_maquina chega ao app e some do texto', () => {
  const { texto, painel } = separarPainel('Preciso confirmar.\n\n<painel>{"confirmar_maquina":true,"produto":"GT 600X"}</painel>');
  assert.equal(texto, 'Preciso confirmar.');
  assert.equal(painel?.confirmar_maquina, true);
  assert.equal(separarPainel('<painel>{"confirmar_maquina":"sim"}</painel>').painel, null);
});

test('caso real do Yuri: CMF 600 na CAT 320 com série e "configuração padrão" não vira lista fechada', () => {
  const pergunta = 'proposta de Cabeçote Multifuncional CMF 600 para cliente no exterior, escavadeira CAT 320, série BR630653, configuração padrão e sem função hidráulica adicional. Quais componentes incluir (kit hidráulico, linhas auxiliares, dreno, comandos, suporte, outro)?';
  // o botão de pedir confirmação aparece, mesmo sem o consultor marcar o painel
  assert.equal(perguntaDeKit(pergunta), true);
  assert.equal(precisaConfirmarMaquina(null, pergunta), true);
  assert.equal(perguntaDeKit('CAT 320 série BR630653 configuração padrão, o que incluir na proposta do CMF 600? kit completo?'), true);
  const r = REGRA_KIT_CONFIRMACAO;
  assert.match(r, /PROPOSTA OU LISTA DE COMPONENTES/);
  assert.match(r, /NÃO entregue lista fechada/);
  assert.match(r, /não use a série nem o "padrão"/);
  assert.match(r, /joystick hidráulico, nova com joystick eletrônico/);
  assert.match(r, /foto do comando, da bomba, dos dois joysticks e o vídeo/);
  assert.match(r, /técnico Roder confirma os kits/);
  assert.match(r, /cabeçote multifuncional, informe que na CAT 320 nova sem fatia extra existe a opção do kit de baixa mais o kit de linhas/);
  assert.match(r, /9000\.9000\.9053 e 9000\.9000\.9026\) só podem aparecer como possibilidades/);
  assert.match(r, /técnico informa/);
  // os únicos códigos da regra são esses dois, já cadastrados na Roder, e a válvula 3000.5003.0194 fica nas regras antigas
  assert.deepEqual([...new Set(r.match(/\d{4}\.\d{4}\.\d{4}/g) || [])].sort(), ['9000.9000.9026', '9000.9000.9053']);
  const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.ok(server.includes('${REGRA_KIT_CONFIRMACAO}'));
});
