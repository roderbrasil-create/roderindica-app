# RODER Indica V2 - Project Instructions

## Key Personnel
- **Gislene**: Gerente Comercial.
- **Luana**: Responsável pela triagem e gestão de leads.

## Business Rules
- **Negotiation Validity**: Proposals are valid for 60 days starting from when the budget is uploaded.
- **Commission Calculation**: 
  - Commission is calculated on the `base_commission_value`.
  - If a discount is applied, it must be deducted from the `base_commission_value` before applying the commission rate.
  - Commission rate is fixed based on the indicator's profile and cannot be changed during negotiation.
- **Lead Protection**: 60-day protection starts when the budget is sent. If no sale occurs, the lead is cancelled but can be renewed if interest is proven.
- **Manager Warnings**: A warning should be displayed to Gislene and Luana (Managers/Admins) if an indication is in 'negotiating' status but lacks a `base_commission_value`.

## Technical & Compatibility Rules
- **Cabeçote CMF 500 em Retroescavadeira**:
  - **Recomendação**: A Roder **NÃO** realiza ou recomenda a instalação de cabeçote multifuncional (como o CMF 500) em retroescavadeiras.
  - **Motivo Hidráulico**: Hidraulicamente funciona (fluxo/pressão compatíveis), mas operacionalmente e em termos de segurança é inviável.
  - **Inviabilidade Operacional**: Alcance muito curto e limitado do braço (curso de apenas 2,5 metros) e falta de giro da cabine (apenas o braço gira traseiramente), gerando movimentos rústicos e baixíssima produtividade.
  - **Inviabilidade de Segurança**: Em caso de queda de árvore na direção da cabine (vento contra ou erro), o operador não consegue desviar ou girar a cabine para evitar o acidente, ao contrário de uma escavadeira de esteira com giro central de 360°.
  - **Alternativa Recomendada**: Indique a aquisição de uma **escavadeira de esteira pequena (7 a 8 toneladas)**. Essas escavadeiras são ágeis, fáceis de transportar, têm excelente alcance/movimentos superiores e alta economia de combustível por hora de trabalho.

- **Garfo Paleteiro - Dimensionamento por Porte de Máquina**:
  - **Regra de Ouro**: O dimensionamento do garfo paleteiro deve ser feito **SEMPRE de acordo com o tamanho/porte da pá carregadeira, e NUNCA de acordo com o peso da carga** a ser transportada.
  - **Uso do GPR 4500 em Máquinas Maiores (> 8 Ton.)**: É **estritamente PROIBIDO** utilizar o garfo paleteiro GPR 4500 (capacidade de carga de 4.500 kg) em pás carregadeiras acima de 8 toneladas, mesmo que o cliente alegue que a carga real a ser levantada pese menos do que 4.500 kg.
  - **Justificativa Técnica (Risco de Danos)**: Pás carregadeiras maiores (acima de 8 toneladas) possuem uma força bruta imensa na cilindrada hidráulica e no empuxo de braço. Caso o operador realize força sobre um único garfo ou pegue o peso de forma errada/descentralizada, a força bruta da máquina grande vai **entortar o garfo** com facilidade, tanto na ponta (que é a parte estruturalmente mais fraca) quanto próximo ao "pé" (base) do garfo. Se o peso da carga cair ou se concentrar em apenas um dos lados, o garfo não aguentará e cederá sob a força da máquina base pesada.
  - **Recomendação de Modelos**:
    - Pás Carregadeiras de **6 a 9 toneladas**: Indique o **GPR 4500**.
    - Pás Carregadeiras de **8 a 12 toneladas**: Indique o **GPR 7000**.

- **Garras R280, R360 e R360G para Escavadeiras Pequenas (7 a 13 Ton.)**:
  - **Uso Geral (Carregamento)**: Normalmente, para escavadeiras de **7 a 8 toneladas**, é indicada a garra **R280** para a operação de carregamento.
  - **Alimentação de Picador Florestal**:
    - Em operações de alimentação de picador, a garra **R360** pode ser utilizada e indicada em escavadeiras de **7 até 13 toneladas**.
    - **Variações da R360 para Alimentação de Picador**:
      - **R360 Padrão** (com pinça fechada): Indicada para o manuseio comum de madeira.
      - **R360G** (com unha tipo garfo, aberta): Especialmente recomendada para pegar com muito mais facilidade resíduos, paletes, madeiras trançadas, galhadas (ex: galhos, restos de pé de laranja) e resíduos florestais em geral para alimentar o picador.
    - **Árvores Inteiras e Eucalipto**: Para a alimentação de picador utilizando árvores inteiras (como eucalipto), a melhor indicação é a **R280**. Ela foi projetada para conseguir pegar os feixes de árvores e arrastá-las usando a força de giro da escavadeira para guiar os pés das árvores até a boca do picador. Devido a esse grande esforço de arrastar árvores inteiras, a **R280** é a mais recomendada para eucalipto e árvores inteiras.

- **Instalação de Garra em Escavadeiras Sem Fatia Extra de Comando**:
  - **Uso do Kit 9000.9000.9016**: Para escavadeiras de qualquer modelo que **não possuem a fatia extra original** de fábrica no comando hidráulico (como Komatsu PC200, Komatsu PC210, Volvo 200, etc.), deve-se utilizar o **Kit de Instalação de Garra para Máquinas sem Fatia Extra - Código 9000.9000.9016**.
  - **Funcionamento Técnico**: O kit deriva a pressão diretamente da bomba hidráulica principal para alimentar uma válvula de duas solenoides de baixo fluxo que realiza a rotação do rotator.
  - **Limitação de Operação (Importante)**: Como a vazão provém direto da bomba, quando a máquina está estática (idle/marcha lenta e sem realizar outras funções como erguer o braço ou girar a cabine), a bomba hidráulica fica em vazão mínima, tornando o giro da garra **extremamente lento**.
  - **Normalização do Fluxo**: A rotação se normalizará assim que o operador realizar qualquer outra função simultânea na escavadeira (como mover a lança, braço ou girar a cabine), pois isso eleva o deslocamento da bomba principal. É uma característica normal de projeto para máquinas sem fatia extra original e não um defeito.
  - **Alternativa de Instalação**: Se o cliente exigir velocidade de rotação 100% perfeita e constante sem essa oscilação, ele deve comprar/instalar uma fatia/seção extra de comando original na escavadeira, ou utilizar outra máquina que já possua essa fatia original disponível para puxar a linha dali.

- **Instalação de Cabeçote Multifuncional em Escavadeiras Sem Fatia Extra de Comando**:
  - **Viabilidade de Instalação**: Para o cabeçote multifuncional, é possível realizar a instalação das linhas em uma escavadeira que não possua a fatia extra de comando. Essa função instalada retira a pressão diretamente da bomba hidráulica principal (comportando-se de forma similar a um braço carregador / garra carregadora) e é suficiente/funcional para a operação do cabeçote multifuncional.
  - **Risco de Segurança (Altamente Perigoso)**: No entanto, para as operações de colheita florestal (forestry harvesting) com o cabeçote multifuncional, a falta da fatia extra original torna a operação extremamente perigosa.
  - **Recomendação Oficial (NÃO RECOMENDADO)**: Diante disso, para o cabeçote multifuncional, é altamente indicado ter a fatia extra original disponível. A Roder **NÃO recomenda** de forma alguma realizar a instalação para cabeçote multifuncional em máquinas sem fatia extra de comando. Embora a instalação física seja viável, ela não é recomendada por conta dos sérios riscos de segurança e das características operacionais exigidas na colheita florestal.

- **Compatibilidade e Diretrizes de Escavadeiras com Harvester ou Linha F (Florestal) de Fábrica**:
  - **Incompatibilidade Direta com Outros Equipamentos**: Escavadeiras configuradas ou que já trabalham com Harvester florestal **NÃO** são compatíveis com outros acessórios florestais (garras de carregamento, garras traçadoras, cabeçotes multifuncionais, feller tesoura, feller de disco, desbastador, triturador, etc.) sem modificações profundas e irreversíveis.
  - **Funcionamento das Linhas do Harvester**: O Harvester utiliza uma linha de pressão de alto fluxo com união de fluxo das duas bombas hidráulicas da escavadeira. Essa única linha de pressão alimenta diretamente o cabeçote do Harvester, que possui no próprio corpo um bloco de comando interno com várias válvulas solenoides para distribuir o óleo para todas as funções do equipamento. Da escavadeira saem apenas: 1 linha de pressão de alto fluxo, 1 linha de retorno de alto fluxo (com filtro para o tanque), 1 linha de dreno de carcaça e 1 chicote elétrico de controle. O rotator (giro do cabeçote) é acionado por solenoides internas no cabeçote ou, em alguns modelos, derivado da linha de escavação da caçamba da escavadeira.
  - **Modificações Necessárias para Instalar Garra de Carregamento**: Instalar uma garra de carregamento convencional (que exige 4 mangueiras: 2 para rotator e 2 para abrir/fechar garra) requer alterações estruturais profundas:
    1. Desligar e remover por completo toda a parte elétrica e o sistema de controle original do Harvester.
    2. Modificar as linhas hidráulicas de saída do comando principal da escavadeira para que operem de forma bidirecional (fornecendo pressão nos dois sentidos, e não somente fluxo em um sentido com retorno livre no outro).
    3. Instalar um novo chicote elétrico com dois novos botões no joystick para fazer o acionamento da linha extra do rotator.
    4. **Aviso de Irreversibilidade**: Estas modificações profundas inviabilizam o uso futuro do Harvester. Não é possível alternar entre Harvester e garra sem refazer todas as modificações hidráulicas do comando.
  - **Escavadeiras com Linha F (Padrão Florestal) de Concessionária**: Saem de fábrica equipadas com proteções de segurança física (estrutura, cabine, vidros de Lexsan, etc.). No entanto, o vendedor deve **sempre confirmar com o fabricante/concessionária qual é a configuração exata de suas linhas hidráulicas** para verificar se a máquina possui linhas bidirecionais (tanto da caçamba quanto outra linha bidirecional para acessórios auxiliares).
  - **Ausência Crítica de Cilindro e Links da Caçamba**: Ponto de atenção crucial! Escavadeiras configuradas para Harvester ou com a letra F de fábrica normalmente **NÃO vêm equipadas com o cilindro da caçamba, bielas/links e pinos originais para montagem da caçamba**. Sem esses componentes originais instalados, é **estritamente IMPOSSÍVEL instalar equipamentos que necessitam do cilindro da caçamba**, como: **feller de disco, feller tesoura, desbastador, triturador e a própria caçamba/concha da escavadeira**.
  - **Compatibilidade de Ponteiras e Bielas**: Verifique se a ponteira e a biela para pendurar o rotator são fisicamente compatíveis. A biela para acoplar nos rotatores padrão RODER deve possuir um **furo para pino de 45 mm com largura de biela de exactly 100 mm**. Oriente o vendedor/fornecedor a fornecer um vídeo detalhado das linhas até a ponta e de como estão ligadas no comando da máquina base.
  - **Rotator - Terminologia e Giro Infinito**:
    - **Grafia**: O termo correto é estritamente **Rotator** (com "t", NUNCA use "rotador" com "d" ou termos derivados incorretamente em áudios e transcrições de clientes/parceiros). "Giro hidráulico da garra" refere-se exatamente ao mesmo componente.
    - **Giro Infinito**: Todos os rotatores fabricados ou fornecidos pela RODER possuem **giro infinito / ilimitado (360°)**.


