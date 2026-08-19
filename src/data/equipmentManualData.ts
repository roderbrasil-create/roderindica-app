export interface EquipmentSpecTable {
  categoryTitle: string;
  categorySubtitle: string;
  headers: string[];
  columnWidthsPdf: number[]; // Widths in mm or percentage
  rows: string[][];
  notes?: string[];
}

export const EQUIPMENT_SPEC_TABLES: EquipmentSpecTable[] = [
  {
    categoryTitle: '5.1 Garras Florestais Convencionais (Linha R)',
    categorySubtitle: 'Garras para movimentação, carregamento e empilhamento de toras (R250 a R1400)',
    headers: ['Modelo', 'Área de Carga', 'Abertura Máx.', 'Diâm. Mínimo', 'Peso Próprio', 'Pressão Trabalho', 'Máquina Base Recomendada'],
    columnWidthsPdf: [20, 24, 25, 24, 22, 26, 41],
    rows: [
      ['R250', '0,25 m²', '1.190 mm', '100 mm', '160 kg', '180 bar', '5 a 8 Ton. / Gruas em Trator'],
      ['R280', '0,28 m²', '1.465 mm', '140 mm', '250 kg', '180 bar', '6 a 10 Ton. / Gruas em Trator'],
      ['R360', '0,36 m²', '1.830 mm', '170 mm', '330 kg', '180 bar', '8 a 12 Ton. / Retroescavadeiras'],
      ['R400', '0,40 m²', '1.905 mm', '180 mm', '360 kg', '180 bar', '12 a 18 Ton. / Picadores até 600 cv'],
      ['R600', '0,60 m²', '2.130 mm', '190 mm', '710 kg', '190 bar', '14 a 22 Ton. / Picadores até 1000 cv'],
      ['R800', '0,80 m²', '2.675 mm', '230 mm', '890 kg', '190 bar', '18 a 25 Ton. (Escavadeiras Pesadas)'],
      ['R1000', '1,00 m²', '3.015 mm', '400 mm', '1.125 kg', '220 bar', '22 a 30 Ton. (Pátios e Carregadeiras)'],
      ['R1200', '1,20 m²', '3.430 mm', '400 mm', '1.410 kg', '220 bar', '24 a 35 Ton. (Grande Porte)'],
      ['R1400', '1,40 m²', '3.450 mm', '400 mm', '1.500 kg', '220 bar', '25 a 35 Ton. (Alto Volume)']
    ],
    notes: [
      'Garras R280 e R280L: Estrutura projetada para gruas em tratores e escavadeiras de 7-8t. R280 é a mais indicada para puxar feixes de eucalipto e árvores inteiras até a boca do picador.',
      'Garras R360: A partir de 8t. Versão R360G (unhas tipo garfo aberta) é excelente para galhadas, resíduos e citrus.',
      'Alimentação de Picador: Até 600 cv indicar Garra R400; até 1.000 cv indicar Garra R600 (em escavadeiras >= 14t).'
    ]
  },
  {
    categoryTitle: '5.2 Garras Traçadoras Florestais (Linha GT)',
    categorySubtitle: 'Garras com traçador hidráulico incorporado para corte e traçamento contínuo de feixes de toras',
    headers: ['Modelo', 'Área de Garra', 'Compr. Sabre', 'Passo Corrente', 'Abertura Máx.', 'Peso Estimado', 'Vazão / Pressão', 'Máquina Base'],
    columnWidthsPdf: [20, 22, 23, 23, 24, 22, 28, 28],
    rows: [
      ['GT 280', '0,28 m²', '80 cm', '0,404"', '1.465 mm', '420 kg', '80-120 L/min | 180-210 bar', '7 a 10 Ton.'],
      ['GT 360', '0,36 m²', '90 cm', '0,404"', '1.830 mm', '520 kg', '90-140 L/min | 190-220 bar', '8 a 14 Ton.'],
      ['GT 400X', '0,40 m²', '100 cm', '0,404" ou 3/4"', '1.905 mm', '620 kg', '100-160 L/min | 200-240 bar', '12 a 18 Ton.'],
      ['GT 600X', '0,60 m²', '115 cm', '3/4" (Pesada)', '2.130 mm', '980 kg', '120-180 L/min | 210-250 bar', '14 a 22 Ton.'],
      ['GT 800X', '0,80 m²', '130 cm', '3/4" (Pesada)', '2.675 mm', '1.250 kg', '150-220 L/min | 220-260 bar', '18 a 28 Ton.'],
      ['GT 1000X', '1,00 m²', '150 cm', '3/4" (Pesada)', '3.015 mm', '1.650 kg', '180-250 L/min | 220-280 bar', '22 a 35 Ton.']
    ],
    notes: [
      'Sufixo "X" e Nomenclatura: Quando o usuário ou cliente falar "GT 400", "GT 600", "GT 800", "GT 1000", refere-se diretamente aos modelos de alta resistência GT 400X, GT 600X, GT 800X e GT 1000X.',
      'Rendimento da GT 600: Produção de 70 a 100 m³/h no traçamento padrão de 3,00m e ~68 m³/h contínuos em 3,60m (atinge 12.000 m³/mês em 176h úteis).'
    ]
  },
  {
    categoryTitle: '5.3 Garras para Estufagem de Contêiner (Linha AF e AFG)',
    categorySubtitle: 'Garras especiais com perfil rebaixado projetadas para carga e descarregamento de toras em contêineres marítimos',
    headers: ['Modelo', 'Tipo / Perfil', 'Área de Carga', 'Abertura Máx.', 'Peso Próprio', 'Pressão Trabalho', 'Aplicação Principal'],
    columnWidthsPdf: [22, 28, 22, 24, 22, 26, 38],
    rows: [
      ['AF - 360', 'Pinça Fechada Rebaixada', '0,36 m²', '1.830 mm', '350 kg', '180 bar', 'Estufagem de toras pequenas / médias em contêiner'],
      ['AF - 400', 'Pinça Fechada Rebaixada', '0,40 m²', '1.905 mm', '380 kg', '180 bar', 'Estufagem de toras em contêiner marítimo'],
      ['AF - 600', 'Pinça Fechada Rebaixada', '0,60 m²', '2.130 mm', '740 kg', '190 bar', 'Estufagem pesada de toras de grande diâmetro'],
      ['AF - 800', 'Pinça Fechada Rebaixada', '0,80 m²', '2.675 mm', '930 kg', '190 bar', 'Estufagem de alta capacidade volumétrica'],
      ['AFG-600', 'Unhas Abertas tipo Garfo', '0,60 m²', '2.130 mm', '720 kg', '190 bar', 'Estufagem e manuseio de pacotes de madeira serrada'],
      ['AFG-800', 'Unhas Abertas tipo Garfo', '0,80 m²', '2.675 mm', '910 kg', '190 bar', 'Estufagem e manuseio de feixes e pacotes industriais']
    ],
    notes: [
      'Geometria rebaixada: Permite que a garra entre no teto baixo do contêiner marítimo e deposite as toras uniformemente sem colidir nas laterais ou teto.'
    ]
  },
  {
    categoryTitle: '5.4 Cabeçotes Multifuncionais de Colheita e Poda (Linha CMF, GMT & GP)',
    categorySubtitle: 'Equipamentos para corte, desgalhe, traçamento e poda florestal mecanizada',
    headers: ['Modelo', 'Diâm. Corte', 'Sabre / Corrente', 'Vazão Hidráulica', 'Pressão Trab.', 'Motor Hidráulico', 'Peso Op. / Máquina Base'],
    columnWidthsPdf: [24, 22, 28, 28, 24, 25, 31],
    rows: [
      ['CMF 500', '500 mm', '88 cm | Passo .404"', '100 a 200 L/min', '200 a 220 bar', '24 cc', '8 a 14 Ton. (Suporta até 22t)'],
      ['CMF 600', '600 mm', '45" | Passo 3/4"', '150 a 200 L/min', '200 a 240 bar', '60 cc', '13 a 22 Ton. (Ideal p/ Rebrota)'],
      ['CMF 800', '800 mm', '48" | Passo 3/4"', '200 a 250 L/min', '200 a 240 bar', '60 cc', '20 a 30 Ton. (Madeiras Grossas)'],
      ['GMT 035 TTC', '40 a 60 cm', '52 cm (20") Lâmina', '35 a 65 L/min', '185 a 250 bar', 'Grapple Saw TTC', '275 kg | Munck / Grua / Escavadeira ≤ 8t'],
      ['GP 150', '150 mm', 'Sabre e Corrente Hidr.', '30 a 50 L/min', '160 a 200 bar', 'Motor Rápido', 'Guindastes Munck e Gruas de Poda Urbana']
    ],
    notes: [
      'CMF 500 em Retroescavadeira: PROIBIDO! Alcance curto (2.5m) e falta de giro da cabine criam altíssimo risco de queda de árvores na cabine.',
      'Rebrota: Para corte de rebrota pesada, a Roder recomenda o CMF 600 com sabre reforçado e corrente 3/4" (corrente .404 do CMF 500 entorta sabre se o operador não tiver extrema habilidade).',
      'Terrenos Inclinados (>10°): Indicar CMF com suspensão pendular livre, pois o cabeçote se auto-alinha com a árvore sem desequilibrar a máquina base.'
    ]
  },
  {
    categoryTitle: '5.5 Fellers de Corte e Acumulação (Linhas CFT, CFTA e CFD)',
    categorySubtitle: 'Feller Tesoura e Feller de Disco para corte ultrarrápido e formação de feixes em escavadeiras',
    headers: ['Modelo', 'Tipo de Corte', 'Diâm. Corte', 'Acumulador', 'Dentes / Facas', 'Vazão / Pressão', 'Peso', 'Máquina Base'],
    columnWidthsPdf: [20, 24, 22, 20, 24, 28, 19, 25],
    rows: [
      ['CFT 35', 'Tesoura Hidráulica', '350 mm', 'Opcional', 'Faca de aço usinado Hardox', '80-140 L/min | 210-250 bar', '950 kg', '8 a 14 Ton.'],
      ['CFT 50', 'Tesoura Hidráulica', '500 mm', 'Não (Corte único)', 'Faca usinada alta dureza', '150-220 L/min | 250-280 bar', '1.450 kg', '14 a 20 Ton.'],
      ['CFT 60', 'Tesoura Hidráulica', '600 mm', 'Não (Corte único)', 'Faca usinada alta dureza', '180-250 L/min | 250-280 bar', '1.850 kg', '20 a 25 Ton.'],
      ['CFTA 60', 'Tesoura c/ Acumulador', '600 mm', 'SIM (Feixes)', 'Braços acumuladores hidráulicos', '180-250 L/min | 250-280 bar', '2.100 kg', '20 a 25 Ton.'],
      ['CFD 40', 'Disco de Corte Contínuo', '400 mm', 'SIM (Feixes)', '18 dentes de metal duro intercambiáveis', '250-350 L/min | 280 bar', '2.150 kg', '20 a 35 Ton.']
    ],
    notes: [
      'Produção em Campo: CFTA 50 em escavadeira de 20t atinge 200 árvores/h (1.600 árv/turno 8h a 18 L/h diesel). CFTA 60 atinge 240 a 360 árvores/h (1.920 a 3.600 árv/turno a 22 L/h).',
      'Pá Carregadeira vs. Escavadeira: Na pá carregadeira L60 o CFTA 50 rende 160 árvores/h (manobra a cada feixe). Na escavadeira o giro central permite colher 3 a 5 árvores sem sair do lugar.',
      'Inclinação (>10°): PROIBIDO Feller Tesoura e Feller de Disco em áreas inclinadas >10° (cabeçote rígido desequilibra a máquina).'
    ]
  },
  {
    categoryTitle: '5.6 Garfos Paleteiros e Carregadores Frontais (Linhas GPR, Top Clamp, CFR e PCR)',
    categorySubtitle: 'Garfos forjados e carregadores para pás carregadeiras de 6 a 12 toneladas e tratores',
    headers: ['Modelo', 'Tipo de Implemento', 'Capacidade Carga', 'Peso Próprio', 'Máquina Base Compatível', 'Diretrizes Técnicas e Restrições'],
    columnWidthsPdf: [24, 28, 25, 20, 32, 53],
    rows: [
      ['GPR 4500', 'Garfo Paleteiro Forjado', '4.500 kg', '450 kg', 'Pás Carregadeiras de 6 a 9 Ton.', 'PROIBIDO em máquinas >8t! A força bruta da máquina grande entorta os garfos.'],
      ['GPR 7000', 'Garfo Paleteiro Reforçado', '7.000 kg', '680 kg', 'Pás Carregadeiras de 8 a 12 Ton.', 'Estrutura robusta para suportar o torque e cilindrada hidráulica de pás grandes.'],
      ['TOP CLAMP', 'Garfo com Garra Superior', '4.500 a 6.000 kg', '620 kg', 'Pás Carregadeiras de 8 a 14 Ton.', 'Garante fixação superior para toras soltas, fardos e paletes em terrenos irregulares.'],
      ['CFR 280', 'Carregador Frontal', '0,28 m³', '380 kg', 'Tratores Agrícolas e Pás Pequenas', 'Carregamento frontal de lenha, toras curtas e fardos.'],
      ['CFR 400', 'Carregador Frontal', '0,40 m³', '520 kg', 'Pás Carregadeiras de 6 a 8 Ton.', 'Movimentação ágil de madeira e biomassa.'],
      ['CRF 600', 'Carregador Frontal', '0,60 m³', '680 kg', 'Pás Carregadeiras de 8 a 10 Ton.', 'Excelente capacidade para pátios de madeira e celulose.'],
      ['CFR 800', 'Carregador Frontal', '0,80 m³', '890 kg', 'Pás Carregadeiras de 10 a 12 Ton.', 'Estrutura reforçada de alta capacidade volumétrica.'],
      ['CRF 1000', 'Carregador Frontal', '1,00 m³', '1.150 kg', 'Pás Carregadeiras de 12 a 15 Ton.', 'Carregamento de toras pesadas em pátio industrial.'],
      ['CRF 1200', 'Carregador Frontal', '1,20 m³', '1.380 kg', 'Pás Carregadeiras de 14 a 18 Ton.', 'Operações severas de alto volume em indústrias.'],
      ['CFR 1500', 'Carregador Frontal', '1,50 m³', '1.600 kg', 'Pás Carregadeiras de 16 a 22 Ton.', 'Máxima capacidade de carregamento frontal Roder.'],
      ['GRF 1200 / 2000', 'Garra Frontal de Pátio', '1,20 a 2,00 m²', '1.200-1.800 kg', 'Pás Carregadeiras 14 a 22 Ton.', 'Para descarregamento rápido de bitrens e carretas florestais.'],
      ['PCR 1400/1700/3000', 'Prolongador com Concha', '1,4 a 3,0 m³', '800 a 1.500 kg', 'Pás Carregadeiras 8 a 18 Ton.', 'Aumenta o alcance vertical e altura de despejo de materiais leves.'],
      ['Engate Rápido', 'Engate Hidráulico Sob Medida', 'Compatível c/ Implementos', '250 a 450 kg', 'Pás Carregadeiras de todas as marcas', 'Permite troca de implementos em menos de 1 minuto sem sair da cabine.']
    ],
    notes: [
      'Regra de Ouro do Garfo Paleteiro: Dimensionar SEMPRE pelo porte da pá carregadeira e NUNCA pelo peso da carga!'
    ]
  },
  {
    categoryTitle: '5.7 Caçambas High Tip / Despejo Alto (Linha CHT)',
    categorySubtitle: 'Caçambas com articulação hidráulica e altura de despejo elevada para carretas graneleiras, silos e moegas',
    headers: ['Modelo', 'Volume Útil', 'Peso Próprio', 'Altura A', 'Largura B', 'Profundidade C', 'Máquina Base', 'Tipo de Material Indicado'],
    columnWidthsPdf: [22, 20, 20, 18, 18, 18, 28, 40],
    rows: [
      ['CHT 2.0', '2,0 m³', '1.000 kg', '900 mm', '2.400 mm', '1.600 mm', '8 a 10 Ton.', 'Material leve e volumoso ou pesado em compactas'],
      ['CHT 2.5', '2,5 m³', '1.800 kg', '1.125 mm', '2.780 mm', '1.800 mm', '10 a 12 Ton.', 'Pesado / Médio em máquinas pequenas'],
      ['CHT 2.8', '2,8 m³', '1.800 kg', '1.210 mm', '2.786 mm', '1.800 mm', '12 a 14 Ton.', 'Pesado / Médio em máquinas médias'],
      ['CHT 3.0', '3,0 m³', '1.800 kg', '1.295 mm', '2.786 mm', '1.800 mm', '10-12t (Leve) / 14-18t', 'Leve (máq. pequenas) ou Pesado (máq. médias)'],
      ['CHT 4.0', '4,0 m³', '2.000 kg', '1.350 mm', '2.800 mm', '2.300 mm', '12 a 14 Ton. (Leve)', 'Leve / Volumoso em máquinas médias'],
      ['CHT 5.0', '5,0 m³', '2.200 kg', '1.360 mm', '2.950 mm', '2.700 mm', '14 a 18 Ton. (Leve)', 'Leve / Altamente volumoso (bagaço, cavaco)'],
      ['CHT 7.0', '7,0 m³', '2.500 kg', '1.500 mm', '2.950 mm', '2.800 mm', '16 a 18 Ton. (Leve)', 'Cavacos de madeira, serragem, casca de pinus'],
      ['CHT 8.0', '8,0 m³', '2.700 kg', '1.550 mm', '2.950 mm', '2.900 mm', '18 a 22 Ton. (Leve)', 'Grandes volumes de cavaco, serragem, bagaço'],
      ['CHT 10.0', '10,0 m³', '3.000 kg', '1.600 mm', '2.950 mm', '3.000 mm', '18 a 22 Ton. (Leve)', 'Ultra leves e megavolumes de biomassa']
    ],
    notes: [
      'Alcance Elevado: Projetada para descarregar em caçambas graneleiras de caminhões bi-trem (laterais altas) sem encostar na carroceria.'
    ]
  },
  {
    categoryTitle: '5.8 Desbastadores Florestais FAE para Escavadeiras e Retroescavadeiras',
    categorySubtitle: 'Trituradores hidráulicos de acoplamento na lança para limpeza florestal, faixas de servidão e aceiros',
    headers: ['Modelo', 'Diâm. Máx. Trituração', 'Peso Equipamento', 'Vazão Óleo', 'Pressão Trab.', 'Tipo de Dente / Rotor', 'Máquina Base'],
    columnWidthsPdf: [24, 26, 24, 25, 24, 33, 26],
    rows: [
      ['FAE BL0/EX', '80 mm (8 cm)', '290 a 325 kg', '50 a 90 L/min', '180 a 250 bar', 'Mini BL (Bite Limiter) / Lâmina ou Martelo', '2 a 4 Ton.'],
      ['FAE PML/EX', '50 mm (5 cm)', '190 a 210 kg', '20 a 90 L/min', '150 a 220 bar', 'Mini PML Lâminas Y ou Martelos PML', '1.5 a 5.5 Ton.'],
      ['FAE BL1/EX/VT', '120 mm (12 cm)', '350 a 410 kg', '50 a 140 L/min', '180 a 350 bar', 'Mini BL Dentes Fixos de Vídea (VT)', '4 a 8 Ton.'],
      ['FAE DML/HY', '120 mm (12 cm)', '490 a 590 kg', '50 a 160 L/min', '200 a 350 bar', 'Dentes cilíndricos tipo E com Vídea', '5 a 13 Ton.'],
      ['FAE BL2/EX/VT', '150 mm (15 cm)', '645 a 750 kg', '80 a 150 L/min', '200 a 350 bar', 'Dentes Fixos Planos de Vídea Bite Limiter', '8 a 14 Ton.'],
      ['FAE BL3/EX/VT', '200 mm (20 cm)', '1.050 a 1.250 kg', '100 a 200 L/min', '220 a 350 bar', 'Dentes Fixos BL3 de Vídea Bite Limiter', '14 a 20 Ton.'],
      ['FAE UML/EX/VT', '200 mm (20 cm)', '1.100 a 1.350 kg', '110 a 220 L/min', '220 a 350 bar', 'Dentes C/3/HD Planos de Vídea Reforçada', '14 a 20 Ton.'],
      ['FAE UML/S/EX/VT', '250 mm (25 cm)', '1.350 a 1.600 kg', '120 a 250 L/min', '220 a 350 bar', 'Dentes Fixos de Vídea C/3/HD ou Planos F', '18 a 25 Ton.'],
      ['FAE UMM/EX/VT', '300 mm (30 cm)', '1.700 a 1.950 kg', '150 a 300 L/min', '220 a 350 bar', 'Dentes Fixos Reforçados UMM/HD com Vídea', '20 a 30 Ton.']
    ],
    notes: [
      'Tecnologia Bite Limiter (BL): Perfil especial de rotor que limita a mordida dos dentes, mantendo a rotação constante e evitando travamentos do motor hidráulico.'
    ]
  },
  {
    categoryTitle: '5.9 Trituradores Florestais, Fresas de Solo e Autopropelidos FAE',
    categorySubtitle: 'Trituradores para pás carregadeiras, fresas de tocos pesadas para tratores (Linha SSH) e trituradores radiocontrolados',
    headers: ['Modelo / Equipamento', 'Tipo / Aplicação', 'Diâm. Máx. Corte', 'Profundidade Solo', 'Peso / Dentes', 'Potência / Vazão Requerida', 'Máquina Base'],
    columnWidthsPdf: [26, 26, 23, 23, 24, 32, 28],
    rows: [
      ['FAE UML SSL VT 175', 'Triturador Hidr. Frontal', '200 mm (20 cm)', 'Superficial', '1.250 kg | 36 dentes', '130 a 200 L/min | 200-350 bar', 'Minicarregadeiras e Pás Compactas'],
      ['FAE 140 U PM 200', 'Triturador Florestal Pá', '350 mm (35 cm)', 'Superficial / Rente', '2.960 kg | 42+2 dentes', '150 a 360 L/min | 250-415 bar', 'Pás Carregadeiras (ex: Cat 930K/938K)'],
      ['Fresa FAE SSH 150', 'Fresa de Solo e Tocos', '700 mm (70 cm)', 'Até 500 mm no solo', '4.250 kg | 62+4 dentes', '240 a 360 hp | PTO 1000 rpm', 'Tratores Agrícolas Pesados'],
      ['Fresa FAE SSH 200', 'Fresa de Solo e Tocos', '700 mm (70 cm)', 'Até 500 mm no solo', '4.700 kg | 74+4 dentes', '240 a 360 hp | PTO 1000 rpm', 'Tratores Agrícolas Pesados'],
      ['Fresa FAE SSH 225', 'Fresa de Solo e Tocos', '700 mm (70 cm)', 'Até 500 mm no solo', '5.150 kg | 86+4 dentes', '240 a 360 hp | PTO 1000 rpm', 'Tratores Agrícolas Pesados'],
      ['Fresa FAE SSH 250', 'Fresa de Solo e Tocos', '700 mm (70 cm)', 'Até 500 mm no solo', '5.600 kg | 98+4 dentes', '240 a 400 hp | PTO 1000 rpm', 'Tratores Agrícolas Pesados'],
      ['FAE RCU-55 / RCU-75', 'Triturador Autopropelido', '150 a 200 mm', 'Superficial', 'Esteiras de Borracha', '56 a 75 hp Kohler Diesel', 'Radiocontrolado (Áreas Inclinadas até 55°)'],
      ['FAE PT-200', 'Triturador Autopropelido', '350 mm (35 cm)', 'Superficial / Tocos', '10.500 kg', '200 hp Cummins Turbo', 'Veículo Rastreado Florestal Pesado']
    ],
    notes: [
      'Fresa SSH: Projetada para triturar tocos, raízes e pedras até 50 cm de profundidade no solo em uma única passada, deixando o solo preparado para replantio imediato.'
    ]
  },
  {
    categoryTitle: '5.10 Implementos Florestais de Preparação, Arraste e Plantio',
    categorySubtitle: 'Destocador de broca, sacador de mudas, mini skidders de arraste e rachadores de toras',
    headers: ['Equipamento / Modelo', 'Função Operacional', 'Diâm. de Trabalho', 'Peso', 'Vazão / Pressão', 'Máquina Base Recomendada'],
    columnWidthsPdf: [26, 38, 26, 20, 32, 40],
    rows: [
      ['Destocador DTH 240B', 'Perfuração e eliminação de tocos com torque contínuo', '240 mm (broca cônica)', '750 kg', '120 a 180 L/min | 210-250 bar', 'Escavadeiras de 14 a 25 Ton.'],
      ['Sacador SAC 500', 'Extração de árvores vivas com torrão de raiz intacto', '500 mm (torrão circular)', '920 kg', '80 a 140 L/min | 180-220 bar', 'Escavadeiras e Pás Carregadeiras'],
      ['Mini Skidder MSR 600', 'Arraste de toras em talhões acoplado no 3º ponto', 'Garra de arraste 0,60 m²', '340 kg', 'Acionamento remoto do trator', 'Tratores Agrícolas de 60 a 90 cv'],
      ['Mini Skidder MSR 1000', 'Arraste pesado de toras em talhões florestais', 'Garra de arraste 1,00 m²', '490 kg', 'Acionamento remoto do trator', 'Tratores Agrícolas de 90 a 140 cv'],
      ['Garra Rachadora de Toras', 'Rachamento longitudinal de toras de grande diâmetro', 'Toras até 1.200 mm', '680 kg', '100 a 160 L/min | 200-250 bar', 'Escavadeiras de 12 a 20 Ton.']
    ],
    notes: [
      'Destocador DTH 240B: Patenteado Roder, perfura o toco com baixo revolvimento do solo, preservando a microbiota e eliminando tocos em segundos.'
    ]
  },
  {
    categoryTitle: '5.11 Rotatores Hidráulicos Roder e Giro Infinito 360°',
    categorySubtitle: 'Componentes de giro contínuo infinito (360°) para garras florestais, traçadoras e cabeçotes',
    headers: ['Modelo / Componente', 'Capacidade Axial', 'Giro Contínuo', 'Furo Pino / Largura Biela', 'Pressão Máx. Giro', 'Aplicação Recomendada'],
    columnWidthsPdf: [28, 24, 22, 30, 26, 52],
    rows: [
      ['Rotator 3 Toneladas (R-3T)', '3.000 kg (30 kN)', 'Infinito 360°', 'Pino 35 mm | Biela 80 mm', '200 bar | 20 L/min', 'Gruas em tratores e escavadeiras compactas até 5t'],
      ['Rotator 6 Toneladas (R-6T)', '6.000 kg (60 kN)', 'Infinito 360°', 'Pino 45 mm | Biela 100 mm', '250 bar | 25 L/min', 'Escavadeiras de 7 a 13t, Garras R280/R360 e GT 280/360'],
      ['Rotator 10 Toneladas (R-10T)', '10.000 kg (100 kN)', 'Infinito 360°', 'Pino 45 mm | Biela 100 mm', '250 bar | 35 L/min', 'Escavadeiras de 14 a 22t, Garras R400/R600 e CMF 500/600'],
      ['Rotator 16 Toneladas (R-16T)', '16.000 kg (160 kN)', 'Infinito 360°', 'Pino 50 mm | Biela 120 mm', '280 bar | 45 L/min', 'Escavadeiras pesadas 22 a 35t, Garras R800 a R1400 e GT 800/1000']
    ],
    notes: [
      'Giro Infinito Obrigatório: Todos os rotatores fabricados ou distribuídos pela Roder possuem giro infinito 360° contínuo sem fim de curso.',
      'Terminologia Correta: Escreve-se sempre "Rotator" (com "t", nunca "rotador" com "d").'
    ]
  },
  {
    categoryTitle: '5.12 Quadro 1: Acessórios de Montagem por Porte de Máquina (Linha 1000.XXXX.XXXX)',
    categorySubtitle: 'Ponteiras de biela, suportes de destocador/triturador e links de garra com códigos oficiais de fábrica',
    headers: ['Código do Item', 'Componente / Descrição', 'Diâmetro Pino Máquina', 'Máquinas de Exemplo', 'Função / Aplicação'],
    columnWidthsPdf: [28, 38, 26, 36, 44],
    rows: [
      ['1000.0000.0072', 'PONTEIRA BIELA 4', 'PINO Ø65', 'Doosan DX140, Case CX130, CAT 312D, Sany 155, Volvo EC140', 'Ponteira soldável/parafusável para biela padrão 4 em escavadeiras de 12 a 15t'],
      ['1000.0000.0102', 'PONTEIRA BIELA 6', 'PINO Ø65', 'Doosan DX140, Case CX130, CAT 312D, Hyundai 140, SDLG 6150', 'Ponteira de acoplamento para rotator 6 Toneladas em escavadeiras de 12 a 15t'],
      ['1000.1256.0000', 'SUPORTE DESTOCADOR', 'PINO Ø65', 'Doosan DX140, Case CX130, CAT 312D, JCB 130LC, JD 130G', 'Suporte estrutural de acoplamento rápido do Destocador DTH 240B no braço'],
      ['1000.1400.0000', 'SUPORTE TRITURADOR', 'PINO Ø65', 'Doosan DX140, Case CX130, Sany 155, New Holland E145', 'Suporte reforçado para montagem de trituradores e desbastadores florestais'],
      ['1000.0000.0139', 'LINK GARRA BIELA 6', 'PINO Ø65', 'Doosan DX140, Case CX130, CAT 312D, Volvo EC140B', 'Link articulado pendular para suspensão de garra com rotator 6t'],
      ['1000.0000.0123', 'LINK GARRA BIELA 4', 'PINO Ø65', 'Doosan DX140, Case CX130, CAT 312D, Sany 155, XCMG XE150D', 'Link articulado pendular para garra biela 4 em máquinas pino Ø65'],
      ['1000.0000.0019', 'PONTEIRA BIELA 4 (Pino 80)', 'PINO Ø80', 'CAT 320D/FM, Komatsu PC200, Volvo EC210B, Case CX200, Sany 215C', 'Ponteira padrão para escavadeiras pesadas de 18 a 22 toneladas'],
      ['1000.1191.0000', 'SUPORTE DESTOCADOR (Pino 80)', 'PINO Ø80', 'CAT 320D, Komatsu PC200, John Deere 200G/210G, Volvo EC210B', 'Suporte reforçado para destocador DTH em escavadeiras de 20 a 22t'],
      ['1000.1295.0000', 'SUPORTE TRITURADOR (Pino 80)', 'PINO Ø80', 'CAT 320D, Komatsu PC200, Link Belt 210, JCB JS200, New Holland E215B', 'Suporte estrutural para trituradores FAE em escavadeiras de 20 a 22t'],
      ['1000.0000.0120', 'LINK GARRA BIELA 4 (Pino 80)', 'PINO Ø80', 'CAT 320D, Komatsu PC200, Volvo EC210B, Sany 215C, XCMG XE215BR', 'Link de suspensão pendular para garras biela 4 em máquinas pino Ø80'],
      ['1000.0000.0171', 'LINK GARRA BIELA 6 (Pino 80)', 'PINO Ø80', 'CAT 320D/320FM e escavadeiras pesadas pino Ø80', 'Link de suspensão pendular de alta capacidade para rotator 6t em escavadeira 20t'],
      ['1000.0000.0071', 'PONTEIRA BIELA 4 (Pino 70)', 'PINO Ø70', 'CAT 315/318D2L, Komatsu PC160, Hyundai 160/180/200G, NH E175B', 'Ponteira para escavadeiras médias de 15 a 18 toneladas com pino Ø70'],
      ['1000.0000.0098', 'PONTEIRA BIELA 4 (Pino 60)', 'PINO Ø60', 'Komatsu PC130, Liugong LG915, Sany 135/155H, Lonking 6150', 'Ponteira compacta para escavadeiras de 12 a 14 toneladas com pino Ø60'],
      ['1000.0000.0056', 'PONTEIRA BIELA 4 (Pino 90)', 'PINO Ø90', 'Hyundai 260LC9, Volvo 250 e escavadeiras pesadas de 25 a 30t', 'Ponteira extra-pesada para escavadeiras acima de 25 toneladas']
    ],
    notes: [
      'Padrão de Códigos de Acessórios: Todos os códigos de ponteiras, suportes de destocador, suportes de triturador e links de garra iniciam com o padrão 1000.XXXX.XXXX.',
      'Sincronização Dinâmica: A base de 43+ máquinas e seus respectivos códigos é sincronizada diretamente do banco de dados em tempo real.'
    ]
  },
  {
    categoryTitle: '5.13 Quadro 2: Kits Oficiais de Instalação Hidráulica (Linha 9000.9000.9000 a 9000.9000.9060)',
    categorySubtitle: 'Relação completa de kits de adaptação hidráulica com códigos e especificações de aplicação',
    headers: ['Código do Kit', 'Descrição Oficial do Kit de Instalação', 'Aplicação / Tipo de Circuito', 'Composição Resumida dos Componentes'],
    columnWidthsPdf: [28, 52, 42, 50],
    rows: [
      ['9000.9000.9000', 'KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - (MAQUINA COM FATIA EXTRA SEM LINHA)', 'Escavadeiras com carretel auxiliar disponível no comando', 'Caixa elétrica 24V, mangueiras 3/4 R12, tubos hidráulicos, abraçadeiras, pedais, válvulas esfera 3/4 BSP'],
      ['9000.9000.9001', 'KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - (MAQUINA COM LINHA ROMPEDOR)', 'Escavadeiras que já possuem tubulação de rompedor instalada', 'Caixa elétrica, kit acionamento 24V, mangueiras 5/8 R2, adaptadores para solda e painel 7/8 JIC, pedal mini TFS'],
      ['9000.9000.9002', 'KIT INSTALACAO DESTOCADOR EM ESCAVADEIRA - (MAQUINA COM FATIA EXTRA ACIONADA SEM LINHA)', 'Escavadeiras com piloto acionado na cabine mas sem tubos', 'Mangueiras 3/4 R12, tubos 1.1/16 JIC, abraçadeiras duplas, válvulas esfera 3/4, adaptadores macho/fêmea'],
      ['9000.9000.9003', 'KIT BAIXA PRESSAO 1 SECCAO DUPLA CAT320GC/NG 24V (80L/ 190BAR)', 'Caterpillar 320 GC / Next Gen para rotação contínua e baixa pressão', 'Caixa elétrica 2 funções 24V, comando elétrico 80L 24V, joystick padrão florestal 3 botões, bomba 48cc'],
      ['9000.9000.9004', 'KIT INSTALACAO CMF500/600 + LINCK EM ESCAVADEIRA - (MAQUINA COM LINHA ROMPEDOR)', 'Cabeçotes Multifuncionais CMF 500/600 em escavadeiras com linha de rompedor', 'Linhas de alta vazão, chicote de comando eletro-hidráulico, mangueiras de dreno e conexões especiais'],
      ['9000.9000.9015', 'KIT INSTALACAO GARRA + LINK EM ESCAVADEIRA - (MAQUINA COM FATIA EXTRA SEM LINHA)', 'Instalação direta de garra de carregamento e link pendular', 'Mangueiras, conexões de pressão, link garra biela para pino específico e abraçadeiras estruturais'],
      ['9000.9000.9016', 'KIT INSTALACAO DE GARRA EM ESCAVADEIRA SEM FATIA EXTRA (DERIVACAO DA BOMBA)', 'Máquinas sem comando auxiliar de fábrica (Komatsu PC200/210, Volvo 200)', 'Bloco manifold 2 solenoides baixo fluxo, mangueiras derivação bomba principal, botoeiras joystick e chicote']
    ],
    notes: [
      'Faixa de Numeração Oficial: Os kits de instalação hidráulica Roder são numerados sequencialmente na faixa 9000.9000.9000 até 9000.9000.9060 (totalizando mais de 56 kits homologados).',
      'Atualização Automática: Novos kits cadastrados ou modificados no sistema são automaticamente refletidos em tempo real na base de conhecimento da IA e nos manuais gerados.'
    ]
  }
];
