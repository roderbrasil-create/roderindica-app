// Kit depende da configuração da máquina. Rodar: node --import tsx --test testes-servidor/confirmacao-maquina.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  REGRA_KIT_CONFIRMACAO, RESSALVA_KIT, perguntaDeKit, textoPedirConfirmacaoMaquina, videoAmostraDe, linkPublicoDoVideo,
  precisaConfirmarMaquina, instrucaoAmostra, AVISO_SEM_AMOSTRA, TEXTO_CMF_CAT320,
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

const passos = (t: string) => {
  assert.match(t, /UM vídeo/);
  assert.match(t, /1\) Filme o braço e a lança da máquina, mostrando as tubulações/);
  assert.match(t, /2\) Filme o comando hidráulico da máquina, que fica atrás do motor de giro/);
  assert.match(t, /3\) Filme dentro da cabine os joysticks e os pedais/);
  assert.match(t, /4\) Se possível, quando for Caterpillar de modelo novo, abra e filme a porta traseira para mostrar a bomba hidráulica/);
  assert.ok(t.indexOf('1)') < t.indexOf('2)') && t.indexOf('2)') < t.indexOf('3)') && t.indexOf('3)') < t.indexOf('4)'));
  assert.match(t, /fotos também, como complemento/);
  assert.ok(!/concession/i.test(t), 'a concessionária não entra no pedido');
  assert.ok(t.length < 900, 'texto curto');
};

test('mensagem pronta COM vídeo modelo: um vídeo em 4 passos numerados e o link do modelo', () => {
  const t = textoPedirConfirmacaoMaquina(LINK);
  semDefeito(t);
  passos(t);
  assert.ok(t.includes(LINK));
  assert.match(t, /vídeo modelo para você seguir/);
});

test('mensagem pronta SEM vídeo modelo: mesmos passos, sem link, e diz que o vendedor envia o vídeo de exemplo', () => {
  for (const vazio of ['', undefined as any, null as any, '  ', 'db-file://x', 'javascript:alert(1)']) {
    const t = textoPedirConfirmacaoMaquina(vazio);
    semDefeito(t);
    passos(t);
    assert.ok(!/https?:/.test(t) && !/db-file|javascript/.test(t));
    assert.match(t, /o vendedor envia um vídeo de exemplo/);
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
  assert.match(r, /o técnico confirma a pressão; cadastro do 9003: 190 bar/);
  assert.ok(!/200 bar/.test(r));
  assert.match(r, /possibilidade do kit 9000\.9000\.9035/);
  assert.match(r, /mais o 9000\.9000\.9003/);
  assert.match(r, /sem item cadastrado, diga que o técnico informa o código/);
  assert.match(r, /Não dê a entender que a concessionária é obrigatória antes da análise/);
  assert.match(r, /técnico Roder responsável/);
  assert.match(r, /Não invente código/);
  assert.match(r, /braço e lança da máquina, mostrando as tubulações/);
  assert.match(r, /comando hidráulico, que fica atrás do motor de giro/);
  assert.match(r, /os joysticks e os pedais/);
  assert.match(r, /porta traseira para mostrar a bomba hidráulica/);
  assert.ok(!/\d\s*%|comiss/i.test(r));
  assert.match(r, /confirmar_maquina/);
  assert.ok(!/[—–]/.test(r));
  // e está de fato dentro do prompt do consultor, sem apagar a regra antiga do kit sem fatia extra
  const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.ok(server.includes('${REGRA_KIT_CONFIRMACAO}'));
  assert.ok(server.includes('DIRETRIZ CRÍTICA PARA INSTALAÇÃO DE GARRA EM ESCAVADEIRAS SEM FATIA EXTRA'));
  assert.ok(server.includes('9000.9000.9016'));
  assert.match(r, /já informou e confirmou a configuração/);
  // a regra só cita o código do kit de baixa que está cadastrado; nenhum outro
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
  assert.match(r, /peça o vídeo na sequência \(braço e lança com as tubulações, comando atrás do motor de giro, joysticks e pedais, porta traseira e bomba em CAT nova\)/);
  assert.match(r, /técnico Roder confirma os kits/);
  assert.match(r, /cabeçote multifuncional, informe que na CAT 320 nova sem fatia extra existe a opção do kit 9035 mais o kit de baixa 9003, a confirmar pelo técnico/);
  assert.match(r, /Só cite códigos de kit que apareçam na lista de kits cadastrados fornecida no contexto/);
  assert.ok(!/já cadastrados|9053|9026/.test(r), 'a regra não afirma que códigos fora do repositório estão cadastrados');
  assert.match(r, /técnico informa/);
  // o único código da regra é o do kit de baixa que existe no repositório (constants.ts e manual), citado como exemplo
  assert.deepEqual([...new Set(r.match(/\d{4}\.\d{4}\.\d{4}/g) || [])].sort(), ['9000.9000.9003', '9000.9000.9035']);
  assert.match(readFileSync(new URL('../src/constants.ts', import.meta.url), 'utf8'), /9000\.9000\.9003/);
  assert.match(r, /ex.: 9000\.9000\.9035 e 9000\.9000\.9003/);
  const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.ok(server.includes('${REGRA_KIT_CONFIRMACAO}'));
});

test('regras antigas não contradizem a regra nova (CMF sem fatia extra, requisito geral, concessionária, kit por modelo)', () => {
  const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const modal = readFileSync(new URL('../src/components/catalog/EstudosComparativosModal.tsx', import.meta.url), 'utf8');
  const manual = readFileSync(new URL('../src/data/equipmentManualData.ts', import.meta.url), 'utf8');
  const agents = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');
  for (const proibido of [/NÃO recomenda\*{0,2} de forma alguma/, /Altamente Perigoso/, /Komatsu PC200, Komatsu PC210, Volvo 200, etc/, /comprar\/instalar uma fatia/, /9000\.9000\.9018/, /200 bar/]) assert.ok(!proibido.test(agents), `AGENTS.md: ${proibido}`);
  assert.ok(agents.includes('nunca por modelo ou número de série'));
  assert.ok(agents.includes('O 9016 NÃO é o kit de baixa'));
  assert.ok(agents.includes('Em CAT 320 nova a fatia é instalada pela concessionária'));
  assert.ok(!/9000\.9000\.9018/.test(server) && !/200 bar/.test(server), 'server.ts: 9018 e 200 bar');
  assert.ok(!/comprar\/instalar a fatia|adquirir e mandar instalar/.test(server));
  assert.ok(!/Nas demais máquinas sem fatia extra, a Roder recomenda/.test(server + modal));
  const iaManual = readFileSync(new URL('../src/pages/IAManual.tsx', import.meta.url), 'utf8');
  assert.ok(!/Komatsu PC200\/210, Volvo 200/.test(iaManual), 'IAManual');
  assert.ok(!/pelo vídeo do braço/.test(server));
  for (const proibido of [
    /NÃO recomenda\*{0,2} de forma alguma/,
    /indispensável para qualquer instalação/,
    /requisito obrigatório e indispensável que a máquina/i,
    /Altamente Perigoso/,
    /possuem os tamp/i,
    /Komatsu PC200\/210, Volvo 200/,
  ]) {
    assert.ok(!proibido.test(server), `server.ts: ${proibido}`);
    assert.ok(!proibido.test(modal), `modal: ${proibido}`);
    assert.ok(!proibido.test(manual), `manual: ${proibido}`);
  }
  assert.ok(!/NÃO recomenda<\/strong> instalar cabeçotes/.test(modal));
  // concessionária só com a ressalva de foto e vídeo
  for (const l of server.split('\n').filter(x => /confirmar com a concessionária/.test(x))) assert.ok(/foto e vídeo/.test(l), l.slice(0, 80));
  assert.ok(!/confirme com a concessionária ou forneça/.test(modal));
  // PC200, PC210 e Volvo 200 só junto de "confirmado"
  server.split('\n').filter(x => /PC200, PC210, Volvo 200/.test(x)).forEach(l => assert.ok(/confirmad/.test(l), l.slice(0, 90)));
  const i = modal.indexOf("id: 'kit-sem-fatia-extra'");
  assert.ok(i > 0 && !/komatsu|volvo/i.test(modal.slice(i, i + 400)));
  assert.ok(!/PC200, PC210, Volvo 200/.test(modal));
  // texto novo presente
  assert.ok(server.includes('${TEXTO_CMF_CAT320}'));
  assert.ok(server.includes('A fatia extra com saída dupla é o requisito geral. Exceções: garra de carregamento, garras florestais e CMF na CAT 320 nova (kit de baixa).'));
  assert.ok(server.includes('Requisito geral: fatia extra com saída dupla, confirmada por foto e vídeo, exceto o kit de baixa em CAT 320 nova para garra e CMF.'));
  assert.ok(server.includes('(a concessionária só entra se faltar fatia extra em CAT nova)'));
  assert.equal((server.match(/O 9016 deriva da bomba principal e NÃO é o kit de baixa/g) || []).length, 2);
  assert.match(RESSALVA_KIT, /ou depois de o vendedor informar e confirmar essa configuração/);
});

test('últimas sobras: viabilidade do 9016, pedido de foto e vídeo, e títulos de kit nos documentos', () => {
  const ler = (c: string) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8');
  const server = ler('server.ts');
  assert.ok(!/instalação da garra é totalmente viável/.test(server));
  assert.ok(server.includes('o kit possível, a confirmar pelo técnico Roder'));
  assert.ok(!/algumas marcas\/modelos não possuem/.test(server));
  assert.ok(!/solicitar uma foto ou vídeo do comando/.test(server));
  assert.ok(!/pedir fotos ou vídeos do comando hidráulico do cliente/.test(server));
  assert.ok(!/pede marca, modelo e fotos do comando/.test(server));
  assert.ok(!/pedir a marca e o modelo da sua máquina e fotos do comando/.test(server));
  assert.equal((server.match(/um vídeo \(braço e lança com as tubulações, comando atrás do motor de giro, joysticks e pedais e, em CAT nova, porta traseira com a bomba; fotos só como complemento\)/g) || []).length, 2);
  // todo título ou linha de documento que cita o 9016 ligado a "sem fatia extra" leva a ressalva
  for (const f of ['src/utils/manualExportUtils.ts', 'src/pages/IAManual.tsx', 'src/utils/generateTechnicalPdf.ts', 'src/utils/generateTechnicalDocx.ts', 'src/utils/generateGoogleDocsHtml.ts', 'src/components/catalog/EstudosComparativosModal.tsx']) {
    const linhas = ler(f).split('\n').filter(l => /sem fatia extra/i.test(l) && /9000\.9000\.9016/.test(l));
    assert.ok(linhas.length > 0, f);
    for (const l of linhas) assert.ok(/quando confirmado por foto e vídeo/.test(l), `${f}: ${l.trim().slice(0, 90)}`);
  }
});

test('CMF em CAT 320 nova: kits 9035 e 9003, confirmação sempre e contato da concessionária', () => {
  const ler = (c: string) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8');
  const t = TEXTO_CMF_CAT320;
  assert.ok(!/[—–]/.test(t));
  assert.match(t, /COM fatia extra dupla já acionada no joystick eletrônico, faltando só a tubulação: possibilidade do kit 9000\.9000\.9035/);
  assert.match(t, /toda a linha hidráulica do CMF e vale para CMF 500, 600 e 800/);
  assert.match(t, /SEM fatia extra: possibilidade do 9000\.9000\.9035 mais o 9000\.9000\.9003/);
  assert.match(t, /bomba extra na tampa da bomba original, que alimenta um comando hidráulico duplo para a linha de giro do rotator/);
  assert.match(t, /CAT mais antiga de comando pilotado sem fatia extra: precisa de fatia ou bomba extra, e o técnico Roder define/);
  assert.match(t, /Garra de carregamento usa o 9003 para o rotator, mas outro kit para a garra: o técnico informa/);
  assert.match(t, /Sempre confirmar por foto e vídeo, no modelo do vídeo de amostra, mesmo que o cliente diga que a máquina não tem preparação nenhuma/);
  assert.match(t, /peça o contato do vendedor ou da concessionária da máquina; a Roder fala com ele .* só então passa o valor do kit/);
  assert.match(t, /a Roder orienta o vendedor a repassar esse valor ao cliente/);
  assert.deepEqual([...new Set(t.match(/\d{4}\.\d{4}\.\d{4}/g) || [])].sort(), ['9000.9000.9003', '9000.9000.9035']);
  // 9035 e 9003 estão cadastrados (a regra só cita código cadastrado), nas duas fontes
  const constants = ler('src/constants.ts');
  assert.match(constants, /code: .9000\.9000\.9035.,\s*description: .KIT INSTALACAO CMF500\/600 EM ESCAVADEIRA - \( MAQUINA COM FATIA EXTRA "ACIONADA" SEM LINHA\)./);
  assert.match(constants, /code: '9000\.9000\.9003'/);
  assert.match(ler('src/data/equipmentManualData.ts'), /'9000\.9000\.9035', 'KIT INSTALACAO CMF500\/600 EM ESCAVADEIRA/);
  // o prompt usa o texto único, e AGENTS, estudo e manuais falam o mesmo
  const server = ler('server.ts');
  assert.equal((server.match(/\$\{TEXTO_CMF_CAT320\}/g) || []).length, 2);
  for (const f of ['AGENTS.md', 'src/components/catalog/EstudosComparativosModal.tsx', 'src/utils/manualExportUtils.ts', 'src/pages/IAManual.tsx']) {
    const c = ler(f);
    assert.ok(c.includes('9000.9000.9035') && c.includes('9003'), `${f}: 9035 e 9003`);
    assert.ok(/contato do vendedor ou da concessionária/.test(c), `${f}: contato da concessionária`);
    assert.ok(!/bloquinho de pressão piloto com botão que a Roder adiciona/.test(c), f);
  }
  assert.ok(!/bloquinho de pressão piloto com botão que a Roder adiciona/.test(server + REGRA_KIT_CONFIRMACAO));
  assert.ok(!/o CMF pode ir sem fatia extra com o kit de baixa \(bomba extra com comando próprio/.test(server + ler('AGENTS.md')));
});
