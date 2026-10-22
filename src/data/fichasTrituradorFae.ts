// Dados das 4 fichas individuais aprovadas dos trituradores FAE de escavadeira que a Roder vende
// (aprovadas pelo Jeferson em 22/10/2026, valores conferidos nos catálogos FAE).
// O componente FichaTrituradorFae.tsx só desenha estes dados: para mudar um texto ou número, mude aqui.
// Este arquivo não importa imagem nem biblioteca de tela, para os testes de servidor poderem lê-lo.

export type ChaveFichaFae = 'uml-s-ex-vt' | 'uml-ex-vt' | 'bl2' | 'umm';

export interface DenteFichaFae {
  // arquivo dentro de public/fichas-fae/<chave>/
  imagem: 'dente-vidia.png' | 'dente-lamina.png' | 'rotor-bl.png';
  titulo: string;
  // trecho em laranja ao lado do título, ex.: "(C/3)"
  destaque?: string;
  texto: string;
  // o rotor é desenhado mais largo que os dentes (mm); sem isso a imagem cabe na caixa de 30 x 20 mm
  larguraMm?: number;
}

export interface LinhaFichaFae {
  // 4 células (rótulo, valor, rótulo, valor) ou 2 (rótulo e valor ocupando o resto da linha)
  celulas: [string, string, string, string] | [string, string];
}

export interface FichaFae {
  chave: ChaveFichaFae;
  // nome completo, como aparece no título e no nome do PDF
  nome: string;
  // código curto do cabeçalho da tabela
  codigoTabela: string;
  largura: string; // largura do rotor em mm, só para os textos de consultor e testes
  descricao: string;
  introDentes: string;
  dentes: DenteFichaFae[];
  vantagens: string[];
  // espaço entre as vantagens em mm (a lista do BL2 tem 6 itens com texto mais longo)
  espacoVantagensMm: number;
  linhas: LinhaFichaFae[];
}

export const TITULO_FICHA_FAE = 'Desbastador florestal.';
export const LINHA_FICHA_FAE = 'LINHA DE TRITURADORES FAE PARA ESCAVADEIRA';
export const SUBTITULO_FICHA_FAE = 'Triture mato, galhos e madeira direto na escavadeira.';
export const NOTA_FICHA_FAE = 'Dados do fabricante, sujeitos a alteração sem aviso.';
export const RODAPE_FICHA_FAE = 'Linha de colheita e movimentação florestal.';

const TEXTO_VIDEA = 'Indicado para muito contato com o solo. Vida útil muito maior e não precisa de afiação. Corta madeira com menos eficiência.';
const TEXTO_LAMINA = 'Indicado para cortar e triturar madeira com mais velocidade, como árvores grandes. Vida útil menor com muito contato com o solo. Afiação a cada 20 a 50 horas.';

const DENTES_UML: DenteFichaFae[] = [
  { imagem: 'dente-vidia.png', titulo: 'Dente de vídea', destaque: '(C/3)', texto: TEXTO_VIDEA },
  { imagem: 'dente-lamina.png', titulo: 'Dente de lâmina', destaque: '(BL, Bite Limiter)', texto: TEXTO_LAMINA },
  { imagem: 'rotor-bl.png', titulo: 'Rotor Bite Limiter', destaque: '(BL)', texto: 'Limita a mordida: mais produção com menos potência exigida da máquina.', larguraMm: 39 },
];

const INTRO_UML = 'O rotor sai de fábrica com um dos dois tipos. A Roder fornece o outro dente para troca, com suporte adaptador. O dente BL vale só para os dentes centrais: os das laterais são sempre C/3, com vídea na cabeça e na lateral, para limpar a lateral do rotor e não enroscar.';

export const FICHAS_FAE: Record<ChaveFichaFae, FichaFae> = {
  'uml-s-ex-vt': {
    chave: 'uml-s-ex-vt',
    nome: 'FAE UML/S/EX/VT 125',
    codigoTabela: 'UML/S/EX/VT 125',
    largura: '1.250 mm',
    descricao: 'Equipamento robusto para o manejo florestal: limpeza de terreno, remoção de vegetação densa e preparação de áreas para plantio ou construção. Feito para as escavadeiras mais comuns, de 18 a 25 t, com motor VT Roder/FAE de torque variável. A Roder entrega, monta e faz a preparação hidráulica.',
    introDentes: INTRO_UML,
    dentes: DENTES_UML,
    vantagens: [
      'Motor VT Roder/FAE, de torque variável, integrado à estrutura e protegido contra impacto e sujeira',
      'Comporta hidráulica anti-poeira, com válvula diversificadora integrada para abrir e fechar',
      'Transmissão por correias Poly Chain',
      'Contra-facas intercambiáveis, de aço forjado e temperado',
      'Entrega, montagem na escavadeira e preparação hidráulica pela Roder',
      'Suporte (link de ligação) fabricado sob medida para a sua escavadeira',
      'Distribuição, serviços e garantia oficial FAE',
    ],
    espacoVantagensMm: 2,
    linhas: [
      { celulas: ['Largura do rotor', '1.250 mm', 'Largura total (com chapas laterais e mancais)', '1.347 mm'] },
      { celulas: ['Máquina base', '18 a 25 t', 'Peso', '1.450 kg'] },
      { celulas: ['Diâmetro do rotor', '450 mm', 'Trituração máxima', 'Ø 300 mm'] },
      { celulas: ['Pressão de trabalho', '220 a 350 bar', 'Vazão de óleo', '145 a 240 l/min'] },
      { celulas: ['Dentes (centrais + laterais)', '26 + 4', 'Transmissão', 'Correias Poly Chain'] },
      { celulas: ['Motor VT', 'Pistões de torque variável 110/60 cc (145 a 240 l/min), de série'] },
    ],
  },
  'uml-ex-vt': {
    chave: 'uml-ex-vt',
    nome: 'FAE UML/EX/VT 125',
    codigoTabela: 'UML/EX/VT 125',
    largura: '1.250 mm',
    descricao: 'Equipamento robusto para o manejo florestal: limpeza de terreno, remoção de vegetação densa e preparação de áreas para plantio ou construção. Feito para as escavadeiras mais comuns, de 14 a 20 t, com motor VT Roder/FAE de torque variável. A Roder entrega, monta e faz a preparação hidráulica.',
    introDentes: INTRO_UML,
    dentes: DENTES_UML,
    vantagens: [
      'Motor VT Roder/FAE, de torque variável, integrado à estrutura e protegido contra impacto e sujeira',
      'Comporta hidráulica anti-poeira, que protege os componentes internos',
      'Transmissão por correia sincronizada',
      'Contra-facas de aço que ajudam a triturar o material em tamanho menor',
      'Entrega, montagem na escavadeira e preparação hidráulica pela Roder',
      'Suporte (link de ligação) fabricado sob medida para a sua escavadeira',
      'Distribuição, serviços e garantia oficial FAE',
    ],
    espacoVantagensMm: 2,
    linhas: [
      { celulas: ['Largura do rotor', '1.250 mm', 'Largura total (com chapas laterais e mancais)', '1.342 mm'] },
      { celulas: ['Máquina base', '14 a 20 t', 'Peso', '1.170 kg'] },
      { celulas: ['Diâmetro do rotor', '425 mm', 'Trituração máxima', 'Ø 200 mm'] },
      { celulas: ['Pressão de trabalho', '220 a 350 bar', 'Vazão de óleo', '130 a 210 l/min'] },
      { celulas: ['Dentes (centrais + laterais)', '26 + 2', 'Transmissão', 'Correia sincronizada'] },
      { celulas: ['Motor VT', 'Pistões de torque variável 110/60 cc (130 a 210 l/min), de série'] },
    ],
  },
  bl2: {
    chave: 'bl2',
    nome: 'FAE BL2/EX/VT 100',
    codigoTabela: 'BL2/EX/VT 100',
    largura: '1.000 mm',
    descricao: 'Triturador com tecnologia Bite Limiter para escavadeiras pequenas e médias, de 8 a 14 t: tritura árvores de até 15 cm de diâmetro. Motor VT Roder/FAE de torque variável. A Roder entrega, monta e faz a preparação hidráulica.',
    introDentes: 'A lâmina BL/MINI sai de fábrica. O dente C/3/MINI, de vídea, está disponível como opcional.',
    dentes: [
      { imagem: 'dente-lamina.png', titulo: 'Lâmina', destaque: '(BL/MINI, de série)', texto: 'Corta e tritura madeira com mais velocidade. Vida útil menor com muito contato com o solo. Afiação a cada 20 a 50 horas, conforme o serviço.' },
      { imagem: 'dente-vidia.png', titulo: 'Dente de vídea', destaque: '(C/3/MINI, opcional)', texto: 'Indicado para mais contato com o solo. Vida útil maior e não precisa de afiação. Corta madeira com menos eficiência.' },
      { imagem: 'rotor-bl.png', titulo: 'Rotor Bite Limiter', texto: 'Anéis de aço limitam a profundidade de corte: menos potência exigida e mais velocidade.', larguraMm: 33 },
    ],
    vantagens: [
      'Motor VT Roder/FAE, de torque variável, embutido na estrutura',
      'Estrutura fechada, à prova de poeira',
      'Capô frontal hidráulico de série',
      'Transmissão por correias em V',
      'Capô traseiro defletor: controla a saída do material triturado, com mais segurança',
      'Válvulas de controle de fluxo, de desvio e de segurança de série',
      'Entrega, montagem na escavadeira e preparação hidráulica pela Roder',
      'Suporte (link de ligação) fabricado sob medida para a sua escavadeira',
      'Distribuição, serviços e garantia oficial FAE',
    ],
    espacoVantagensMm: 1.3,
    linhas: [
      { celulas: ['Largura de trabalho', '1.000 mm', 'Peso', '570 kg'] },
      { celulas: ['Máquina base', '8 a 14 t', 'Diâmetro do rotor', '370 mm'] },
      { celulas: ['Pressão de trabalho', '180 a 350 bar', 'Vazão de óleo', '100 a 140 l/min'] },
      { celulas: ['Trituração máxima', 'Ø 150 mm', 'Transmissão', 'Correias em V'] },
      { celulas: ['Lâminas BL/MINI', '18'] },
      { celulas: ['Motor VT', 'Pistões de torque variável 55/38 cc (100 a 140 l/min), de série'] },
    ],
  },
  umm: {
    chave: 'umm',
    nome: 'FAE UMM/EX/VT 150',
    codigoTabela: 'UMM/EX/VT 150',
    largura: '1.500 mm',
    descricao: 'Equipamento robusto para o manejo florestal e o controle de vegetação em áreas arborizadas. Feito para escavadeiras potentes, de 20 a 30 t, com motor VT Roder/FAE de torque variável. A Roder entrega, monta e faz a preparação hidráulica.',
    introDentes: 'A Roder sempre fornece este modelo com dentes de vídea (C/3). Quem preferir dentes de lâmina (BL) compra da Roder os dentes com o suporte adaptador, que é comprado uma só vez e serve para os dois dentes: troca-se só o dente de desgaste, e o parafuso é o mesmo. O dente BL vale só para os dentes centrais: os das laterais são sempre C/3, com vídea na cabeça e na lateral, para limpar a lateral do rotor e não enroscar.',
    dentes: [
      { imagem: 'dente-vidia.png', titulo: 'Dente de vídea', destaque: '(C/3)', texto: TEXTO_VIDEA },
      { imagem: 'dente-lamina.png', titulo: 'Dente de lâmina', destaque: '(BL, Bite Limiter)', texto: TEXTO_LAMINA },
    ],
    vantagens: [
      'Motor VT Roder/FAE, de torque variável, embutido na estrutura',
      'Chassi de aço resistente e estrutura fechada, à prova de poeira',
      'Transmissão por correia Poly Chain',
      'Contra-facas intercambiáveis, forjadas e endurecidas',
      'Capô traseiro hidráulico e válvulas de controle de fluxo e de segurança',
      'Entrega, montagem na escavadeira e preparação hidráulica pela Roder',
      'Suporte (link de ligação) fabricado sob medida para a sua escavadeira',
      'Distribuição, serviços e garantia oficial FAE',
    ],
    espacoVantagensMm: 2,
    linhas: [
      { celulas: ['Largura do rotor', '1.500 mm', 'Largura total (com chapas laterais e mancais)', '1.584 mm'] },
      { celulas: ['Máquina base', '20 a 30 t', 'Peso', '2.120 kg'] },
      { celulas: ['Diâmetro do rotor', '500 mm', 'Trituração máxima', 'Ø 300 mm'] },
      { celulas: ['Pressão de trabalho', '240 a 350 bar', 'Vazão de óleo', '130 a 210 l/min'] },
      { celulas: ['Dentes (centrais + laterais)', '32 + 2', 'Transmissão', 'Correia Poly Chain'] },
      { celulas: ['Motor VT', 'Pistões de torque variável 110/60 cc (130 a 210 l/min), de série'] },
    ],
  },
};

export const CHAVES_FICHA_FAE = Object.keys(FICHAS_FAE) as ChaveFichaFae[];
export const ehChaveFichaFae = (c: string | null | undefined): c is ChaveFichaFae => !!c && c in FICHAS_FAE;
