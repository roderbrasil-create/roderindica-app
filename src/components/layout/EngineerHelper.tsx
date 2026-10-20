import React, { useState, useRef, useEffect } from 'react';
import { getGTProductivityData } from '../../lib/produtividadeGt';
import { Sparkles, MessageSquare, X, Minus, Send, Calculator, Wrench, HelpCircle, AlertTriangle, Play, RefreshCw, Trash2, ChevronLeft, ChevronRight, CheckCircle, Package, Layers, Tractor, FileText, Mic, Square, Loader2, Brain, BookOpen, ExternalLink, Share2, Video, Phone, QrCode, Bot, User, Briefcase, ChevronDown, EllipsisVertical, RotateCcw, Menu, Search, UserPlus, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn, getApiBaseUrl } from '../../lib/utils';
import { collection, getDocs, query, orderBy, addDoc, doc, getDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { askEngineerHelper, transcribeAudio, analyzeAndEnrichProductDossier } from '../../services/geminiService';
import { useAuth } from '../../contexts/AuthContext';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Product, ProductModel, StockItem } from '../../types';
import { MACHINES, MATERIALS, getRecommendedBucket, calculateDischargeHeights, getHighTipBucketWeight } from '../catalog/HighTipData';
import { RODER_LOGO_BASE64, RODER_LOGO_WHITE_BASE64 } from '../catalog/RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { HighTipFicha } from '../catalog/HighTipFicha';
import { FresaSshFicha } from '../catalog/FresaSshFicha';
import { EngateRapidoFicha } from '../catalog/EngateRapidoFicha';
import { GarraEstufagemFicha } from '../catalog/GarraEstufagemFicha';
import { TrituradorLoaderFaeFicha } from '../catalog/TrituradorLoaderFaeFicha';
import { SacadorSac500Ficha } from '../catalog/SacadorSac500Ficha';
import { CabecotePodaFicha } from '../catalog/CabecotePodaFicha';
import { CabecoteGmt035Ficha } from '../catalog/CabecoteGmt035Ficha';
import { FichaPadrao, enviarFichaPadrao, fotoDoModelo, tituloFicha } from '../catalog/FichaPadrao';
import { usePodeEnviarFicha, enviarArquivoPdf, nomeArquivoFicha } from '../catalog/fichaPdf';
import { ehFichaPropria } from '../../lib/fichaPropria';
import { decidirLinkFichaFae } from '../../lib/fichaEscavadeira';
import { CartaoFicha } from '../catalog/CartaoFicha';
import { useVoltarFecha } from '../../lib/useVoltarFecha';
import { useRolagemConversa } from '../../lib/useRolagemConversa';
import { montarProntaEntrega, itemProntoDe, type ItemProntaEntrega } from '../../lib/prontaEntrega';
import { faixaDoModelo } from '../../lib/faixaCmf';
import { CarrosselProntaEntrega, ListaProntaEntrega, AvisoProntaEntrega, FaixaProntaEntrega } from './ProntaEntregaConsultor';
import { abrirDocumento } from '../../lib/abrirDocumento';
import { videoDoEquipamento } from '../../lib/videoEquipamento';
import { ContextoVideo, PlayerVideo } from '../video/VideoEquipamento';
import { ListaVideos, VideosDaResposta, useVideosConsultor } from '../video/VideosConsultor';
import { nomeDoVideo, type VideoConsultor } from '../../lib/videosConsultor';
import { separarPainel, type PainelConversa } from '../../lib/painelConsultor';
export { separarPainel, type PainelConversa };
import {
  CHAVE_PARCEIRO_LINK, PAPEIS_QUE_INDICAM, TOKEN_LINK_VALIDO, WHATS_COMERCIAL, WHATS_COMERCIAL_TEXTO,
  lerCidadeUf, primeiroNome, querIndicar, textoLinkCliente, validarCnpj, validarTelefoneBR,
} from '../../lib/consultorIndicar';
import { linkWhatsSemNumero, textoEquipamentoCliente } from '../../lib/mensagemWhatsCliente';
import { AVISO_SEM_AMOSTRA, linkPublicoDoVideo, precisaConfirmarMaquina, textoPedirConfirmacaoMaquina, videoAmostraDe } from '../../lib/confirmacaoMaquina';

// Equipe Roder: exemplos de pergunta técnica na tela de início do Consultor
const PERGUNTAS_TECNICAS_EQUIPE = [
  'A garra R400 serve na CAT 320?',
  'Kit de instalação do CMF 600 na PC200',
  'Qual ponteira e biela para a ZX130?',
  'O trator do cliente serve na fresa SSH?',
];

const DEFAULT_PRODUCTIVITIES: Record<string, string> = {
  "CMF 600": `DERRUBADA (COLHEITA FLORESTAL):
- Produtividade Média: 4 a 5 árvores por minuto.
- Rendimento por Hora: Cerca de 40 m³ por hora (em floresta de 400 m³ por hectare).
- Rendimento por Hectare: Cerca de 10 horas de trabalho para derrubar 1 hectare completo.
- Consumo de Combustível: Média de 16 L/h.
- Custo de Derrubada: Cerca de R$ 4,50 por m³ (incluindo operador, alimentação e carro de apoio).

TRAÇAMENTO DE FEIXES PARA "METRINHO":
- Produtividade Média: 15 a 18 m³ por hora (média de 90 a 120 metros estéreos por turno de 8h).
- Consumo de Combustível: Cerca de 20 L/h (em escavadeira de 20 toneladas - PC 200).
- Custo de Traçamento: Cerca de R$ 5,15 por m³ (madeira já empilhada).

Vazão e Máquina Base:
- Compatível com escavadeiras de 13 a 22 toneladas (ideal em escavadeiras de 16 a 18 toneladas).

SISTEMA INTEGRADO (COMBO RODER):
Operando em conjunto (1 Cabeçote CMF 600 na derrubada + 1 Mini Skidder no arraste + 1 Garra Traçadora no traçamento de metrinho), a produção média combinada é de 165 a 170 metros estéreos por turno de 8h, totalmente traçado e empilhado.`,

  "CMF 500": `Derrubada/Colheita de Eucalipto (Felling):
- Média Geral: 150 a 180 árvores por hora.
- Indicado para escavadeiras menores de 8 a 12 toneladas ou cortes leves de menor diâmetro.

Traçamento de Feixes para "Metrinho":
- Produtividade Média: 15 a 20 m³ por hora.`,

  "CMF 800": `Derrubada/Colheita de Eucalipto/Mata Nativa:
- Média Geral (Corte de grande porte de até 80cm de diâmetro): 100 a 120 árvores por hora.
- Indicado para escavadeiras de 20 a 30 toneladas em operações pesadas. Produzido estritamente sob encomenda.

Traçamento de Grandes Volumes:
- Produtividade Média: 30 a 45 m³ por hora.`,

  "CFTA 50": `DESEMPENHO – FELLER TESOURA CFTA 50 (Dados de Campo Reais):
1. EM ESCAVADEIRA DE 20 A 22 TONELADAS (Ex: Cliente Rogério - CAT 320 FM 2012):
- Operação: Eucalipto de 5 a 7 anos (Diâmetro médio: 25 a 30 cm)
- Consumo Médio de Combustível: 18 Litros/hora
- Produtividade Média:
  • 200 árvores por hora
  • Aproximadamente 1 hectare por dia
  • Média de 1.600 árvores por turno de 8 horas

2. EM PÁ CARREGADEIRA (Ex: Cliente em Pá Carregadeira Volvo L60):
- Operação: Eucalipto (Diâmetro médio: 20 a 30 cm)
- Produtividade Média:
  • 160 árvores por hora
  • Aproximadamente 1.280 árvores por turno de 8 horas

COMPARATIVO ESCAVADEIRA vs PÁ CARREGADEIRA:
A escavadeira possui produção superior porque atinge até 3 linhas (linha central + 1 de cada lado) parada no mesmo ponto, cortando e acumulando de 3 a 5 árvores sem se locomover antes de tombar o feixe. A pá carregadeira precisa andar árvore por árvore na mesma linha e se deslocar/manobrar lateralmente para descarregar cada feixe, reduzindo o rendimento horário.

SEGURANÇA EM TERRENOS INCLINADOS / DECLIVE (> 10°):
- Não recomendado utilizar Feller Tesoura em inclinações superiores a 10° (o feller é rígido na lança e faz as árvores presas acompanharem a inclinação da máquina, gerando risco de tombamento). Para terrenos inclinados, indica-se o Cabeçote Multifuncional CMF (com link pendular articulado).`,

  "CFTA 60": `DESEMPENHO – FELLER TESOURA CFTA 60 (Dados de Campo Reais):
EM ESCAVADEIRA DE 20 A 22 TONELADAS (Ex: Cliente Victor - CAT 320DL 2007):
- Operação: Primeiro corte e rebrota (Diâmetro médio: 10 a 30 cm)
- Consumo Médio de Combustível: 22 Litros/hora
- Produtividade Média:
  • 4 a 6 árvores por minuto
  • 240 a 360 árvores por hora
  • Média de 1.920 a 3.600 árvores por turno de 8 a 10 horas

COMPARATIVO & TERRENOS INCLINADOS:
- Produção de 240 a 360 árvores/h em escavadeiras de 20-22t.
- Em terrenos com inclinação > 10°, não recomendamos o uso de Feller Tesoura devido à rigidez do acoplamento (a árvore acompanha a inclinação da máquina). Para áreas inclinadas, recomenda-se o Cabeçote Multifuncional CMF com link de suspensão pendular.`,

  "Feller Tesoura": `DESEMPENHO & PRODUTIVIDADE (FELLER TESOURA CFTA 50 / CFTA 60):
- Escavadeira de 20-22t com CFTA 50: 200 árvores/hora (~1.600 árvores/turno de 8h | Consumo: 18 L/h).
- Escavadeira de 20-22t com CFTA 60: 240 a 360 árvores/hora (4 a 6 árvores/min | 1.920 a 3.600 árvores/turno de 8-10h | Consumo: 22 L/h).
- Pá Carregadeira (Volvo L60 com CFTA 50): 160 árvores/hora (~1.280 árvores/turno de 8h).

DINÂMICA DE TRABALHO:
Escavadeiras são mais produtivas que pás carregadeiras pois cortam até 3 linhas (centro + laterais) e acumulam de 3 a 5 árvores sem se locomover do lugar. A carregadeira precisa andar árvore a árvore e manobrar lateralmente para descarregar o feixe.

DIRETRIZ DE SEGURANÇA EM ACLIVES / TERRENOS INCLINADOS:
Para declividades acima de 10°, o Feller Tesoura/Disco não é recomendado, pois seu acoplamento rígido faz com que as árvores mantidas no cabeçote sigam o ângulo do terreno, desequilibrando a máquina. Recomenda-se o Cabeçote Multifuncional CMF (com link pendular que compensa o terreno e mantém o equilíbrio da máquina base).`,

  "GT 360 vs GT 400X": `COMPARATIVO DE GARRAS TRAÇADORAS (GT 360 vs GT 400X):
1. GARRA TRAÇADORA GT 360:
   - Área útil de garra: 0,36 m²
   - Máquina Base Recomendada: Escavadeiras de 8 a 14 toneladas ou tratores pesados com grua florestal de grande porte.
   - Perfil de Operação: Ideal para traçar feixes médios e toras individuais com excelente agilidade.

2. GARRA TRAÇADORA GT 400X:
   - Área útil de garra: 0,40 m² (Linha X: Estrutura reforçada de alta durabilidade)
   - Máquina Base Recomendada: Escavadeiras de 12 a 18 toneladas.
   - Perfil de Operação: Maior abertura e capacidade de fechamento de feixe, permitindo maior volume traçado (m³/h) por ciclo.

REGRAS DE NOMENCLATURA & CONSULTORIA:
- Área útil (m²): "0.36" / "36" = R360; "0.60" / "60" = R600; "1.0" / "1000" = R1000; "traçadora 0.60" = GT 600X.
- Quando o cliente diz "GT 400", ele refere-se à GT 400X.
- Áudios/transcrições que indicarem "engate de reboque GT" referem-se à Garra Traçadora GT.
- Se o usuário perguntar de forma genérica ("garra 0.60" ou "diferença entre 360 e 400"), atue como consultor objetivo, responda diretamente e ofereça opções interativas para o usuário selecionar.`,


  "MSR 600": `DESEMPENHO & ARRASTE (MINI SKIDDER):
- Capacidade de Arraste: Arrasta de 1.000 a 1.500 árvores por turno (em distâncias curtas).
- Rendimento por Hora: Cerca de 20 m³ por hora (leva cerca de 20 horas de trabalho para arrastar todo o volume de 1 hectare de 400 m³).
- Trator Recomendado: Tratores de 110 a 160 HP (~150 CV).
- Consumo Médio de Combustível: Cerca de 8 L/h.
- Custo de Arraste: Cerca de R$ 3,15 por m³.

SISTEMA INTEGRADO (COMBO RODER):
Operando em conjunto (1 Cabeçote CMF 600 na derrubada + 1 Mini Skidder MSR 600 no arraste + 1 Garra Traçadora no traçamento de metrinho), a produção média combinada é de 165 a 170 metros estéreos por turno de 8h, totalmente traçado e empilhado.`,

  "MSR 1000": `DESEMPENHO & ARRASTE (MINI SKIDDER):
- Capacidade de Arraste: Arrasta de 1.000 a 1.500 árvores por turno (em distâncias curtas, com maior capacidade de volume por ciclo comparado ao MSR 600).
- Rendimento por Hora: Cerca de 25 m³ por hora.
- Trator Recomendado: Tratores de 145 a 200 CV.
- Consumo Médio de Combustível: Cerca de 10 L/h.
- Custo Estimado: R$ 3,15 por m³.

SISTEMA INTEGRADO (COMBO RODER):
Operando em conjunto (1 Cabeçote CMF 600 na derrubada + 1 Mini Skidder MSR 1000 no arraste + 1 Garra Traçadora no traçamento de metrinho), a produção média combinada é de 165 a 170 metros estéreos por turno de 8h, totalmente traçado e empilhado.`,

  "GT 600x": `TRAÇAMENTO & PRODUTIVIDADE (GARRA TRAÇADORA):
- Rendimento para Metrinho: De 150 a 180 metros estéreos por turno de 8h.
- Máquina Base Recomendada: Escavadeira hidráulica de 20 toneladas.
- Rendimento com Madeira de 6 metros: Até 12.000 m³ por mês (trabalhando em turno de 10 horas por dia).
- Operador qualificado e boa qualidade da madeira garantem máxima performance.

SISTEMA INTEGRADO (COMBO RODER):
Operando em conjunto (1 Cabeçote CMF 600 na derrubada + 1 Mini Skidder no arraste + 1 Garra Traçadora GT 600x no traçamento de metrinho), a produção média combinada é de 165 a 170 metros estéreos por turno de 8h, totalmente traçado e empilhado.`,

  "GT 360": `TRAÇAMENTO & PRODUTIVIDADE (GARRA TRAÇADORA):
- Rendimento para Metrinho: De 100 a 130 metros estéreos por turno de 8h.
- Máquina Base Recomendada: Escavadeiras de 8 a 16 toneladas.
- Ideal para operações de médio porte, garantindo excelente agilidade no traçamento.`,

  "GT 400X": `TRAÇAMENTO & PRODUTIVIDADE (GARRA TRAÇADORA GT 400X):
- Área de Carga: 0,40 m²
- Máquina Base Recomendada: Escavadeiras de 10 a 22 toneladas.
- Peso do Equipamento: 825 kg
- Especificações do Sistema de Corte: Corrente 3/4" 11H | Motor de Pistão Parker 60cc | Sabre 45"
- Parâmetros Hidráulicos: Pressão 240 bar | Vazão de 125 a 210 L/min
- Rendimento Estimado para Metrinho (1,10m): De 130 a 160 metros estéreos por turno de 8h.
- Equipamento de altíssima resistência estrutural para trabalho pesado e contínuo.`,

  "GT 400x": `TRAÇAMENTO & PRODUTIVIDADE (GARRA TRAÇADORA GT 400X):
- Área de Carga: 0,40 m²
- Máquina Base Recomendada: Escavadeiras de 10 a 22 toneladas.
- Peso do Equipamento: 825 kg
- Especificações do Sistema de Corte: Corrente 3/4" 11H | Motor de Pistão Parker 60cc | Sabre 45"
- Parâmetros Hidráulicos: Pressão 240 bar | Vazão de 125 a 210 L/min
- Rendimento Estimado para Metrinho (1,10m): De 130 a 160 metros estéreos por turno de 8h.`,

  "GT 800x": `TRAÇAMENTO & PRODUTIVIDADE (GARRA TRAÇADORA):
- Rendimento para Metrinho: De 180 a 220 metros estéreos por turno de 8h.
- Máquina Base Recomendada: Escavadeiras de 20 a 30 toneladas.
- Projetada para alta produção e troncos de maior diâmetro.`,

  "GT 1000x": `TRAÇAMENTO & PRODUTIVIDADE (GARRA TRAÇADORA):
- Rendimento para Metrinho: De 220 a 260 metros estéreos por turno de 8h.
- Máquina Base Recomendada: Escavadeiras pesadas de 25 a 35 toneladas.
- Equipamento de altíssima performance para grandes volumes florestais.`,

  "R250": `COMPATIBILIDADE & PRODUTIVIDADE (R250 - 0.25m³):
- Estrutura: Desenvolvida prioritariamente para aplicação em gruas de trator.
- Risco de Força Excessiva: NÃO recomendada para uso em escavadeiras (mesmo pequenas) ou retroescavadeiras, pois a força bruta de escavação, compressão ou apoio no solo dessas máquinas supera a resistência estrutural deste modelo, gerando desgaste prematuro ou quebras.
- Produtividade Estimada: Cerca de 108 toneladas por hora (ciclo de 20s em madeira de 3m).`,
  
  "R280": `COMPATIBILIDADE & PRODUTIVIDADE (R280 - 0.28m³):
- Estrutura: Desenvolvida prioritariamente para aplicação em gruas de trator, sendo uma boa opção de uso nessa categoria. É altamente recomendada para o manuseio convencional de madeira e também para alimentação de picador florestal com árvores inteiras (como eucalipto), arrastando feixes de árvores até a boca do picador.
- Risco de Força Excessiva: Assim como a R250, possui estrutura pensada para gruas de trator e NÃO deve ser instalada diretamente em escavadeiras de grande porte.
- Rotator & Ponteiras (7 a 10 Toneladas): Recomendado o uso de Rotator de 6 Toneladas e ponteiras/bielas de caçamba de 6t para garantida usabilidade e compatibilidade.
- Produtividade Estimada: Cerca de 121 toneladas por hora (ciclo de 20s em madeira de 3m).`,

  "R280L": `COMPATIBILIDADE & PRODUTIVIDADE (R280L - Linha Leve/Média):
- Aplicação Escavadeiras Pequenas: Indicação perfeita e ideal para escavadeiras pequenas (abaixo de 8 toneladas) que realizam trabalho leve a médio. Conta com engenharia de ponta e estrutura leve, sendo infinitamente mais adequada e segura para escavadeiras pequenas do que o modelo R250.
- Aplicação Gruas de Trator: Também é uma excelente opção recomendada para gruas em tratores.
- Segurança e Durabilidade: Evita fadiga estrutural ao suportar melhor as forças de movimentação e apoio características dessas escavadeiras menores.`,

  "R360": `COMPATIBILIDADE & PRODUTIVIDADE (R360 - 0.36m³ / R360G):
- Compatibilidade Máquina Base: Ideal para retroescavadeiras e escavadeiras a partir de aproximadamente 8 toneladas (até 13 toneladas). Oferece a resistência mecânica necessária para suportar a força bruta de escavação e pressão no solo de máquinas de médio porte.
- Escavadeiras de 7 a 10 Toneladas (R360 Padrão e R360G):
  • Viabilidade Física: É fisicamente possível e viável a instalação em máquinas de 7 a 10t.
  • Alerta de Instabilidade Operacional: O cliente deve estar ciente de que se o operador pegar madeira muito comprida ou feixes de árvores inteiras para arrastar ao picador, a máquina pode "levantar a bunda" (ficar instável) ou não ter força de giro suficiente para arrastar o feixe pesado.
- Rotator & Ponteiras (7 a 10 Toneladas): Recomendação oficial de utilizar Rotator de 6 Toneladas e ponteiras/bielas dimensionadas para a caçamba de 6t.
- Variações para Alimentação de Picador:
  • R360 Padrão (pinça fechada): Manuseio comum de madeira.
  • R360G (unha tipo garfo, aberta): Ideal para pegar galhadas, paletes, resíduos e restos de pomar (ex: pé de laranja).
- Produtividade Estimada: Cerca de 155 toneladas por hora.`,

  "R400": `Produtividade Estimada com base em ciclo de 20 segundos e madeira de 3m:
- Produtividade Horária: Cerca de 172 toneladas por hora.
- Indicada para escavadeiras de 12 a 18 toneladas (excelente para John Deere 160).
- Aplicação recomendada: Abastecimento e alimentação de picadores de biomassa/madeira devido à agilidade e tamanho ideal, evitando colisões físicas.`,

  "R600": `Produtividade Estimada com base em ciclo de 20 segundos e madeira de 3m:
- Produtividade Horária: Cerca de 259 toneladas por hora.
- Indicada para escavadeiras de 14 a 22 toneladas (excelente para John Deere 160).
- Aplicação recomendada: Carregamento de madeiras longas (ex: 6 metros de comprimento), garantindo excelente equilíbrio de carga e estabilidade.`,

  "R800": `Produtividade Estimada com base em ciclo de 20 segundos e madeira de 3m:
- Produtividade Horária: Cerca de 345 toneladas por hora.
- Indicada para escavadeiras de 18 a 25 toneladas (também viável para 16t).
- Aplicação recomendada: Carregamento de madeira curta (no máximo 3 metros de comprimento).`,

  "R1000": `Produtividade Estimada com base em ciclo de 20 segundos e madeira de 3m:
- Produtividade Horária: Cerca de 432 toneladas por hora.
- Indicada para escavadeiras de 22 a 30 toneladas in operações de alta densidade.`,

  "R1200": `Produtividade Estimada com base em ciclo de 20 segundos e madeira de 3m:
- Produtividade Horária: Cerca de 518 toneladas por hora.
- Indicada para escavadeiras de 24 a 35 toneladas.`,

  "R1400": `Produtividade Estimada com base em ciclo de 20 segundos e madeira de 3m:
- Produtividade Horária: Cerca de 604 toneladas por hora.
- Indicada para escavadeiras de 25 a 35 toneladas.`
};

// Cálculo da produtividade da Garra Traçadora: em src/lib/produtividadeGt.ts (também usado na ficha padrão)
export { getGTProductivityData };

const PRODUCT_PDFS: Record<string, string> = {
  "CMF 600": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Cabecote-Multifuncional-Roder.pdf",
  "CMF 500": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Cabecote-Multifuncional-Roder.pdf",
  "CMF 800": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Cabecote-Multifuncional-Roder.pdf",
  "GPR 4500": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Garfo-Paleteiro-Roder.pdf",
  "GPR 7000": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Garfo-Paleteiro-Roder.pdf",
  "R250": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf",
  "R280": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf",
  "R360": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf",
  "R360G": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf",
  "R400": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf",
  "R600": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf",
  "R800": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf",
  "R1000": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf",
  "R1200": "https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf",
  // Interactive Sheet Indicators (Handled by openTechnicalSheet)
  "SSH 150": "fresa-ssh",
  "SSH 200": "fresa-ssh",
  "SSH 225": "fresa-ssh",
  "SSH 250": "fresa-ssh",
  "SSH-150": "fresa-ssh",
  "SSH-200": "fresa-ssh",
  "SSH-225": "fresa-ssh",
  "SSH-250": "fresa-ssh",
  "Caçamba High Tip": "high-tip",
  "High Tip": "high-tip",
  "Engate Rápido": "engate-rapido",
  "Garra para Estufagem": "estufagem",
  "Garra Estufagem": "estufagem",
  "FAE UML SSL VT 175": "loader-fae",
  "FAE 140 U PM 200": "loader-fae",
  "UML/SSL/VT 175": "loader-fae",
  "140/U/PM 200": "loader-fae",
  "fae-uml-ssl-vt-175": "loader-fae",
  "fae-140-u-pm-200": "loader-fae",
  "Triturador / Desbastador FAE p/ Pá Carregadeira": "loader-fae",
  "Triturador / Desbastador FAE para Pá Carregadeira": "loader-fae"
};

// PRODUCT_VIDEOS mora em src/lib/videoEquipamento.ts (o mesmo mapa vale na página pública de orçamento)

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  // dados do painel "Nesta conversa" (computador), já separados do texto
  painel?: PainelConversa | null;
  // passo da indicação pela conversa (não vai para a IA)
  indicar?: PassoIndicar;
}

// ---- Indicação pela conversa: roteiro fixo, sem passar pela IA ----
interface OpcaoIndicar { rotulo: string; valor: string; destaque?: boolean }
interface EquipIndicar { nome: string; pid?: string; mid?: string }
interface ResumoIndicar { equipamento: string; cliente: string; telefone: string; cidade: string; cnpj: string }
interface PassoIndicar {
  opcoes?: OpcaoIndicar[];
  resumo?: ResumoIndicar;
  ok?: boolean;
  whats?: string;
}
type EtapaIndicar = 'equip_confirma' | 'equip_lista' | 'equip_modelo' | 'modo' | 'nome' | 'telefone' | 'cidade' | 'cnpj' | 'resumo' | 'corrigir' | 'enviando';
interface FluxoIndicar {
  etapa: EtapaIndicar;
  equip?: EquipIndicar;
  candidato?: EquipIndicar;
  familia?: string; // id do produto cujos modelos estão sendo oferecidos
  modo?: 'dados' | 'link';
  cliente?: string;
  telefone?: string;
  cidade?: string;
  cnpj?: string;
  voltarResumo?: boolean;
}

// Parceiro que abriu pelo link pessoal (gravado por PublicConsultant)
function lerParceiroLink(): { token: string; nome: string; primeiroNome: string } | null {
  try {
    const p = JSON.parse(localStorage.getItem(CHAVE_PARCEIRO_LINK) || 'null');
    // pendente: o servidor ainda não confirmou o link (internet caiu no primeiro acesso). Segue como visitante.
    if (!p || p.pendente || !TOKEN_LINK_VALIDO.test(String(p.token || ''))) return null;
    return { token: String(p.token), nome: String(p.nome || ''), primeiroNome: String(p.primeiroNome || primeiroNome(p.nome)) };
  } catch { return null; }
}

interface MarkdownImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  isLightReport?: boolean;
}

// O bloco <painel> e a leitura dele moram em src/lib/painelConsultor.ts (o teste do servidor importa)

// O consultor pode terminar a resposta com [[OPCOES: a | b | c]]: vira botões para o vendedor tocar
const parseConsultantOptions = (content: string): { text: string; options: string[] } => {
  const limpo = separarPainel(content).texto;
  const re = /\[\[\s*OP[CÇ][OÕ]ES\s*:\s*([^\]]+)\]\]/i;
  const m = limpo.match(re);
  if (!m) return { text: limpo, options: [] };
  const options = m[1].split('|').map(o => o.trim()).filter(Boolean).slice(0, 6);
  return { text: limpo.replace(re, '').trim(), options };
};

// Relatório: tira perguntas e frases de conversa, que não fazem sentido no papel
const cleanReportText = (text: string): string => {
  return parseConsultantOptions(text || '').text
    .split('\n')
    .filter(l => !/\?\s*\**\s*$/.test(l.trim()))
    .filter(l => !/^\s*\*?(você gostaria|quer que eu|se quiser|posso te|me avise|deseja saber)/i.test(l.trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Mostra a folha A4 (794px) inteira em qualquer tela, reduzindo só a visualização
const ReportScaler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / 794));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={boxRef} className="w-full max-w-[794px] mx-auto">
      <div style={{ zoom: scale } as any} className="shadow-lg">{children}</div>
    </div>
  );
};

const DB_IMAGE_CACHE = new Map<string, string>();

const normalizeProductImageUrl = (rawSrc?: string): string => {
  if (!rawSrc) return '';
  if (rawSrc.includes('garra-florestal-roder.jpg') || rawSrc.includes('garra-de-carregamento')) {
    return 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-florestal-1.jpg.webp';
  }
  if (rawSrc.includes('Cabecote-Multifuncional-Roder.jpg')) {
    return 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-cabecote-multifuncional.jpg.webp';
  }
  if (rawSrc.includes('triturador-florestal-fae.jpg')) {
    return 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-desbastador-florestal.jpg.webp';
  }
  return rawSrc;
};

const MarkdownImage: React.FC<MarkdownImageProps> = ({ src, isLightReport, ...props }) => {
  const normalizedSrc = normalizeProductImageUrl(src);

  const getInitialResolvedSrc = () => {
    if (!normalizedSrc) return '';
    if (normalizedSrc.startsWith('db-file://')) {
      const fileId = normalizedSrc.replace('db-file://', '');
      return DB_IMAGE_CACHE.get(fileId) || '';
    }
    if (normalizedSrc.startsWith('http://') || normalizedSrc.startsWith('https://')) {
      return `${getApiBaseUrl()}/api/proxy-image?url=${encodeURIComponent(normalizedSrc)}`;
    }
    return normalizedSrc;
  };

  const [resolvedSrc, setResolvedSrc] = useState<string>(getInitialResolvedSrc);
  const [loading, setLoading] = useState<boolean>(() => {
    if (!normalizedSrc) return false;
    if (normalizedSrc.startsWith('db-file://')) {
      const fileId = normalizedSrc.replace('db-file://', '');
      return !DB_IMAGE_CACHE.has(fileId);
    }
    return false; // NO ASYNC LOADING SKELETON FOR HTTP/HTTPS IMAGES -> PREVENTS FLICKER & LAYOUT SHIFTS!
  });
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const finalSrc = normalizeProductImageUrl(src);
    if (!finalSrc) {
      setLoading(false);
      return;
    }

    if (finalSrc.startsWith('db-file://')) {
      const fileId = finalSrc.replace('db-file://', '');
      if (DB_IMAGE_CACHE.has(fileId)) {
        setResolvedSrc(DB_IMAGE_CACHE.get(fileId)!);
        setLoading(false);
        return;
      }
      getDoc(doc(db, 'app_files', fileId))
        .then(docSnap => {
          if (active) {
            if (docSnap.exists()) {
              const val = docSnap.data().data || '';
              DB_IMAGE_CACHE.set(fileId, val);
              setResolvedSrc(val);
            }
            setLoading(false);
          }
        })
        .catch(err => {
          console.error("Erro ao carregar imagem de arquivo no Markdown:", err);
          if (active) {
            setLoading(false);
          }
        });
    } else {
      const proxied = (finalSrc.startsWith('http://') || finalSrc.startsWith('https://'))
        ? `${getApiBaseUrl()}/api/proxy-image?url=${encodeURIComponent(finalSrc)}`
        : finalSrc;
      if (active) {
        setResolvedSrc(proxied);
        setLoading(false);
      }
    }

    return () => {
      active = false;
    };
  }, [src]);

  const handleError = () => {
    console.warn("[MarkdownImage] Falha ao carregar imagem, aplicando fallback:", resolvedSrc);
    const finalSrc = normalizeProductImageUrl(src);
    // If proxy failed, try raw src directly
    if (resolvedSrc.includes('/api/proxy-image') && finalSrc) {
      setResolvedSrc(finalSrc);
    } else {
      setHasError(true);
    }
  };

  if (hasError || (!loading && !resolvedSrc)) {
    return null; // Gracefully hide broken image without leaving broken 404 boxes or jumping text
  }

  if (loading) {
    return (
      <div className={cn(
        "w-48 h-32 rounded-xl border flex items-center justify-center my-2 shrink-0 transition-all",
        isLightReport 
          ? "bg-slate-100/80 border-slate-200 text-slate-400" 
          : "bg-slate-800/40 border-slate-700/50 text-slate-400"
      )}>
        <span className="text-[9px] font-medium">Carregando imagem...</span>
      </div>
    );
  }

  if (isLightReport) {
    return (
      <img
        {...props}
        src={resolvedSrc}
        onError={handleError}
        referrerPolicy="no-referrer"
        decoding="async"
        className={cn(
          "float-left mr-4 mb-2 mt-1 max-w-[210px] sm:max-w-[230px] max-h-[185px] w-auto h-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs object-contain",
          props.className
        )}
      />
    );
  }

  return (
    <img
      {...props}
      src={resolvedSrc}
      onError={handleError}
      referrerPolicy="no-referrer"
      decoding="async"
      className={cn(
        "max-w-[100%] rounded-xl shadow-xl my-3 block object-contain p-1.5 sm:max-w-[320px] max-h-48 border border-slate-800 bg-slate-900/40 transition-transform hover:scale-105 duration-200",
        props.className
      )}
    />
  );
};

// Componentes do markdown da resposta do consultor. Ficam FORA do componente e criados uma vez só:
// definidos inline (como era), cada render do consultor (teclado, barra do Safari, digitação) criava
// funções novas, o React via "tipos" diferentes e desmontava e remontava a resposta inteira, com as
// imagens voltando a zero de altura (piscava e a conversa pulava enquanto o dono lia).
const criarComponentesMarkdown = (abrirFicha: (href: string) => void): Components => ({
  // Tudo no mesmo tamanho: título vira só uma linha em negrito
  h1: ({ children }) => <p className="font-bold text-amber-400 mt-2">{children}</p>,
  h2: ({ children }) => <p className="font-bold text-amber-400 mt-2">{children}</p>,
  h3: ({ children }) => <p className="font-bold text-amber-400 mt-2">{children}</p>,
  h4: ({ children }) => <p className="font-bold mt-2">{children}</p>,
  p: ({ children }) => <p className="my-1.5">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-1.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-1.5">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="not-italic text-slate-300">{children}</em>,
  hr: () => null,
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-slate-700 bg-slate-900/90 shadow-lg">
      <table className="w-full text-xs text-left text-slate-200 border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-800 text-amber-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-700">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2.5 border-r last:border-r-0 border-slate-700 font-extrabold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border-r last:border-r-0 border-b border-slate-800 text-slate-300 font-medium">{children}</td>
  ),
  tr: ({ children }) => (
    <tr className="even:bg-slate-850/60 hover:bg-slate-800/50 transition-colors">{children}</tr>
  ),
  img: ({ node, ...props }) => {
    return <MarkdownImage {...props} />;
  },
  a: ({ node, children, href, ...props }) => {
    if (!href) return <span className="text-slate-200 underline">{children}</span>;
    if (href.startsWith('http') || href.includes('run.app') || href.includes('roderindica') || href.includes('localhost')) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 underline font-extrabold inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded transition my-0.5"
        >
          <ExternalLink className="h-3 w-3 inline text-emerald-400" />
          {children}
        </a>
      );
    }
    return (
      <button
        type="button"
        onClick={() => abrirFicha(href)}
        className="text-amber-400 hover:text-amber-300 underline font-extrabold cursor-pointer inline-flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded transition my-0.5"
      >
        <FileText className="h-3 w-3 inline text-amber-400" />
        {children}
      </button>
    );
  }
});

// Texto da resposta memorizado: só refaz quando o texto muda
const TextoMarkdown = React.memo(function TextoMarkdown({ texto, componentes }: { texto: string; componentes: Components }) {
  return (
    <ReactMarkdown urlTransform={(url) => url} remarkPlugins={[remarkGfm]} components={componentes}>
      {texto}
    </ReactMarkdown>
  );
});

// Computador (mouse e tela larga): o consultor abre numa janela própria, reaproveitada pelo nome.
// O login do Roder Indica vale na janela nova (mesmo endereço), então a pessoa entra com o papel dela.
// Devolve false quando não deve (celular) ou não conseguiu (pop-up bloqueado): aí abre por cima, como sempre.
export function abrirConsultorEmJanela(pergunta?: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  if (!window.matchMedia('(pointer: fine)').matches || window.innerWidth < 1024) return false;
  const destino = `/consultor${pergunta ? `?pergunta=${encodeURIComponent(pergunta)}` : ''}`;
  try {
    // '' não recarrega a janela do consultor que já está aberta (a conversa continua)
    const janela = window.open('', 'roder-consultor');
    if (!janela) return false;
    let jaNoConsultor = false;
    try { jaNoConsultor = janela.location.pathname.startsWith('/consultor'); } catch { /* outra origem */ }
    // janela recém-aberta ainda carregando: ninguém escuta o evento, então navega com a pergunta
    let carregando = false;
    try { carregando = janela.document.readyState !== 'complete'; } catch { /* outra origem */ }
    if (!jaNoConsultor || (pergunta && carregando)) {
      janela.location.href = destino;
    } else if (pergunta) {
      const Evento = (janela as any).CustomEvent || CustomEvent;
      janela.dispatchEvent(new Evento('roder:abrir-consultor', { detail: { pergunta } }));
    }
    janela.focus();
    return true;
  } catch {
    return false;
  }
}

export default function EngineerHelper({ isFullPage = false }: { isFullPage?: boolean } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAdmin, isManager, isTriagem, isImpersonating, stopImpersonation } = useAuth();
  // Sessão anônima do Firebase (estoque público, cadastro rápido) NÃO é uma pessoa logada:
  // sem isto o parceiro do link e o visitante perdiam o fluxo deles nesse mesmo navegador.
  const logado = !!user && !user.isAnonymous;
  
  // Only registered sellers/partners should have sharing access
  const isRegisteredUser = logado && profile?.role && !['client', 'visitor'].includes(profile.role);
  // "Compartilhar consultor": só Jeferson, Gislene e Luana (admin e gerentes)
  const podeCompartilhar = logado && !!(isAdmin || isManager);

  // Parceiro pelo link pessoal (sem senha). Se houver login no app, o login vale mais.
  const [parceiroLink] = useState(lerParceiroLink);
  const parceiroViaLink = !logado ? parceiroLink : null;
  // Quem pode indicar pela conversa: o parceiro do link e quem cria indicação no app
  const podeIndicar = !!parceiroViaLink || (logado && !!profile && !isImpersonating && PAPEIS_QUE_INDICAM.includes(String(profile.role)));
  // Vídeo do equipamento: quem indica também manda o vídeo e o link de orçamento (decisão do
  // Jeferson em 19/10/2026: parceiro NÃO manda ficha, mas manda vídeo e link)
  const permissaoVideo = React.useMemo(() => ({ podeCompartilhar: podeIndicar, token: parceiroViaLink?.token || undefined }), [podeIndicar, parceiroViaLink?.token]);
  const saudacaoParceiro = (nome: string) => `Olá, **${primeiroNome(nome) || 'parceiro'}**! Tire dúvidas ou indique um cliente.`;
  
  // If a registered seller or partner logged in, clear any external referral code
  useEffect(() => {
    if (isRegisteredUser) {
      const existingRef = localStorage.getItem('roder_consultant_ref');
      if (existingRef) {
        console.log("[EngineerHelper] Registered seller/partner logged in. Clearing referral link:", existingRef);
        localStorage.removeItem('roder_consultant_ref');
      }
    }
  }, [isRegisteredUser]);
  
  // Technical sheet interactive states
  const [isHighTipFichaOpen, setIsHighTipFichaOpen] = useState(false);
  const [isFresaSshFichaOpen, setIsFresaSshFichaOpen] = useState(false);
  const [isEngateRapidoFichaOpen, setIsEngateRapidoFichaOpen] = useState(false);
  const [isGarraEstufagemFichaOpen, setIsGarraEstufagemFichaOpen] = useState(false);
  const [isTrituradorLoaderFaeFichaOpen, setIsTrituradorLoaderFaeFichaOpen] = useState(false);
  const [isSacadorSac500FichaOpen, setIsSacadorSac500FichaOpen] = useState(false);
  const [fresaSshDefaultModel, setFresaSshDefaultModel] = useState<'ssh-150' | 'ssh-200' | 'ssh-225' | 'ssh-250'>('ssh-150');
  const [trituradorLoaderFaeDefaultModel, setTrituradorLoaderFaeDefaultModel] = useState<string>('fae-uml-ssl-vt-175');

  const [isCabecotePodaFichaOpen, setIsCabecotePodaFichaOpen] = useState(false);
  const [isCabecoteGmt035FichaOpen, setIsCabecoteGmt035FichaOpen] = useState(false);
  // Ficha especial aberta pelo "Enviar ficha": o botão Enviar dela fica em destaque
  const [fichaParaEnviar, setFichaParaEnviar] = useState(false);
  // vídeo aberto no painel de fotos do computador (toca ali mesmo, sem abrir outra aba)
  const [videoPainel, setVideoPainel] = useState('');
  // Ficha padrão (todo equipamento sem ficha própria)
  const [fichaPadrao, setFichaPadrao] = useState<{ product: Product; model: ProductModel } | null>(null);
  // Regra do Jeferson: parceiro/indicador e consultor público só veem a ficha
  const podeEnviarFicha = usePodeEnviarFicha();
  // Uma tela para cada perfil (aprovado pelo Jeferson em 19/10/2026):
  // equipe Roder vê só o técnico; parceiro vê o que ajuda a vender; visitante continua como era.
  const perfilConsultor: 'equipe' | 'parceiro' | 'visitante' = podeEnviarFicha
    ? 'equipe'
    : (parceiroViaLink || (logado && String(profile?.role || '') === 'external_seller')) ? 'parceiro' : 'visitante';
  const ehEquipeConsultor = perfilConsultor === 'equipe';
  const ehParceiroConsultor = perfilConsultor === 'parceiro';

  type FichaEspecial = 'sac500' | 'loader-fae' | 'high-tip' | 'engate' | 'estufagem' | 'fresa-ssh' | 'gmt035' | 'poda';

  // Qual ficha própria atende este link/equipamento (nulo = usa a ficha padrão).
  // Regras presas aos nomes, ids e links reais de cada ficha, para um equipamento parecido
  // (ex.: "garra com engate rápido", um cabeçote qualquer com "poda" no link) não abrir a ficha errada.
  // `u` também pode ser o marcador do PRODUCT_PDFS ("fresa-ssh", "engate-rapido"...).
  const fichaEspecialDe = (url: string, nome = ''): FichaEspecial | null => {
    const u = (url || '').toLowerCase().trim();
    const n = (nome || '').toLowerCase();
    // SAC500: "Sacador de Árvores SAC500"
    if (/sac[-_ ]?500/.test(u) || u.includes('sacador') || /sac[-_ ]?500/.test(n) || n.includes('sacador')) return 'sac500';
    // Triturador FAE para pá carregadeira: UML/SSL/VT 175 e 140/U/PM 200
    if (u === 'loader-fae' || u.includes('loader-fae') || /uml[-_ /]?ssl|140[-_ /]?u[-_ /]?pm/.test(u) ||
        (n.includes('triturador') && (n.includes('carregadeira') || n.includes('loader'))) || /uml[-_ /]?ssl|140[-_ /]?u[-_ /]?pm/.test(n)) return 'loader-fae';
    // Caçamba High Tip (prolongador e destocador ficam fora)
    if (!/prolongador|destocador/.test(n) && (u === 'high-tip' || u.includes('cacamba-high-tip') || /high[-_ ]?tip/.test(n))) return 'high-tip';
    // Engate Rápido para pá carregadeira: só o próprio produto ("Engate Rápido ..."), nunca outro item que cite engate
    if (u === 'engate-rapido' || u.includes('/engate-rapido') || /^engate r[aá]pido/.test(n.trim()) || (/engate r[aá]pido/.test(n) && /carregadeira/.test(n))) return 'engate';
    // Garra para Estufagem (AF/AFG)
    if (u === 'estufagem' || u.includes('estufagem') || n.includes('estufagem')) return 'estufagem';
    // Fresa FAE SSH: o nome tem "SSH" (o catálogo de tratores da FAE só conta quando não veio nome)
    if (u === 'fresa-ssh' || u.includes('fresa-ssh') || /\bssh[-_ ]?\d{3}\b/.test(u) || /\bssh\b/.test(n) ||
        (!n.trim() && u.includes('catalogo-tratores'))) return 'fresa-ssh';
    // Cabeçote GMT 035 (id gmt-035)
    if (/\bgmt[-_ ]?035\b/.test(u) || /\bgmt\b/.test(n)) return 'gmt035';
    // Cabeçote de Poda GP 150 (id gp-150; links "cabecote-de-poda" e "cabecote-florestal-poda")
    if (/\bgp[-_ ]?150\b/.test(u) || u.includes('cabecote-de-poda') || u.includes('cabecote-florestal-poda') ||
        /\bgp[-_ ]?150\b/.test(n) || (n.includes('poda') && (n.includes('cabeçote') || n.includes('cabecote')))) return 'poda';
    return null;
  };

  const abrirFichaEspecial = (tipo: FichaEspecial, modelName?: string, enviar = false) => {
    const dica = (modelName || '').toLowerCase();
    setFichaParaEnviar(enviar);
    switch (tipo) {
      case 'sac500': setIsSacadorSac500FichaOpen(true); break;
      case 'loader-fae':
        setTrituradorLoaderFaeDefaultModel(dica.includes('140') || dica.includes('pm') || dica.includes('200') ? 'fae-140-u-pm-200' : 'fae-uml-ssl-vt-175');
        setIsTrituradorLoaderFaeFichaOpen(true);
        break;
      case 'high-tip': setIsHighTipFichaOpen(true); break;
      case 'engate': setIsEngateRapidoFichaOpen(true); break;
      case 'estufagem': setIsGarraEstufagemFichaOpen(true); break;
      case 'gmt035': setIsCabecoteGmt035FichaOpen(true); break;
      case 'poda': setIsCabecotePodaFichaOpen(true); break;
      case 'fresa-ssh':
        setFresaSshDefaultModel(dica.includes('250') ? 'ssh-250' : dica.includes('225') ? 'ssh-225' : dica.includes('200') ? 'ssh-200' : 'ssh-150');
        setIsFresaSshFichaOpen(true);
        break;
    }
  };

  // Links de ficha dentro das respostas do consultor
  const abrirFichaDoLinkRef = useRef<(href: string) => void>(() => {});
  const componentesMd = React.useMemo(() => criarComponentesMarkdown((href) => abrirFichaDoLinkRef.current(href)), []);
  const openTechnicalSheet = (url: string, modelName?: string) => {
    if (!url) return;
    // Trituradores FAE de escavadeira: abre a ficha montada do modelo (link "ficha-fae:<modelo>")
    const decisaoFae = decidirLinkFichaFae<ProductModel, Product>(url, catalogProducts);
    if (decisaoFae.acao === 'abrir') { setFichaPadrao({ product: decisaoFae.product, model: decisaoFae.model }); return; }
    if (decisaoFae.acao === 'avisar') { toast.error(decisaoFae.aviso); return; }
    const tipo = fichaEspecialDe(url, modelName);
    if (tipo) {
      // na URL da SSH o modelo vem no próprio link (ssh-200)
      abrirFichaEspecial(tipo, modelName || url);
      return;
    }
    // Abre dentro do app, com botão de voltar (fichas em /catalogo/... antes nem abriam aqui)
    abrirDocumento(url, 'Ficha técnica');
  };
  abrirFichaDoLinkRef.current = (href) => openTechnicalSheet(href);

  const linkFichaDe = (prod: Product, model: ProductModel) =>
    model.pdf_url || prod.pdf_url || PRODUCT_PDFS[model.name || ''] || PRODUCT_PDFS[prod.name || ''] || '';

  // "Ver ficha": a ficha própria quando existe; senão a ficha padrão em PDF
  // Ficha própria da Roder em PDF (ex.: GR600/GR800, GCR): abre o PDF dela, nunca a padrão
  // Ficha original carregada no MODELO (o link do produto costuma ser o catálogo da linha)
  const linkProprioDe = (prod: Product, model: ProductModel) => {
    if (ehFichaPropria(model.pdf_url)) return model.pdf_url as string;
    if (!(prod.models || []).length && ehFichaPropria(prod.pdf_url)) return prod.pdf_url;
    return '';
  };

  const verFicha = (prod: Product, model: ProductModel) => {
    const link = linkProprioDe(prod, model);
    if (link && !fichaEspecialDe(linkFichaDe(prod, model), `${model.name} ${prod.name}`)) { openTechnicalSheet(link, model.name); return; }
    const tipo = fichaEspecialDe(linkFichaDe(prod, model), `${model.name} ${prod.name}`);
    if (tipo) abrirFichaEspecial(tipo, model.name);
    else setFichaPadrao({ product: prod, model });
  };

  // "Enviar ficha" (só equipe): a padrão gera o PDF direto; a especial abre com o Enviar em destaque
  const enviarFicha = (prod: Product, model: ProductModel) => {
    if (!podeEnviarFicha) return;
    const link = linkProprioDe(prod, model);
    if (link && !fichaEspecialDe(linkFichaDe(prod, model), `${model.name} ${prod.name}`)) {
      const titulo = `Ficha ${model.name || prod.name}`;
      if (link.startsWith('/catalogo/')) {
        fetch(link).then(r => { if (!r.ok) throw new Error(); return r.blob(); })
          .then(b => enviarArquivoPdf(b, nomeArquivoFicha(model.name || prod.name || 'Roder'), titulo))
          .catch(() => toast.error('Não consegui preparar o PDF. Tente de novo.'));
      } else if (/^https?:\/\//i.test(link)) {
        // Link externo (ex.: Drive): o arquivo não pode ser baixado daqui, então vai o link
        const nav: any = navigator;
        if (nav.share) nav.share({ title: titulo, text: titulo, url: link }).catch(() => {});
        else window.open(`https://wa.me/?text=${encodeURIComponent(`${titulo}: ${link}`)}`, '_blank', 'noopener');
      } else {
        openTechnicalSheet(link, model.name);
        toast.info('Use o botão de compartilhar do documento para enviar.');
      }
      return;
    }
    const tipo = fichaEspecialDe(linkFichaDe(prod, model), `${model.name} ${prod.name}`);
    if (tipo) {
      abrirFichaEspecial(tipo, model.name, true);
      toast.info('Toque em "Enviar" na ficha para mandar o PDF.');
    } else {
      enviarFichaPadrao(prod, model);
    }
  };

  // Only accessible to administrators and commercial managers
  const canTeach = isAdmin || isManager;
  
  // Persistent state - always starts closed when the application opens/loads, but can be toggled by the user
  const [isOpenState, setIsOpenState] = useState(() => {
    if (isFullPage) return true;
    return false;
  });
  
  const isOpen = isOpenState;
  const setIsOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsOpenState(val);
  };
  
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  // Pronta entrega: a mesma lista da tela inicial do parceiro (estoque com quantidade, casado com o catálogo)
  const prontaEntrega = React.useMemo(() => montarProntaEntrega(stockItems, catalogProducts), [stockItems, catalogProducts]);
  // Biblioteca de vídeos do consultor (lista pública do servidor): cartões na resposta, folha "Vídeos"
  // e os marcados "no carrossel" entram no carrossel da pronta entrega
  const videosTodos = useVideosConsultor(isOpen);
  // o vídeo de amostra de filmagem não é de equipamento: fica fora de cartões, folha e carrossel
  const videosConsultor = React.useMemo(() => videosTodos.filter(v => v.tipo !== 'amostra'), [videosTodos]);
  const videoAmostra = React.useMemo(() => videoAmostraDe(videosTodos), [videosTodos]);
  // Kit de instalação depende de como a máquina está configurada: abre o WhatsApp (sem número, o vendedor
  // escolhe o contato) com o pedido de vídeo e fotos. Sem vídeo de amostra cadastrado, o texto sai sem link.
  const pedirConfirmacaoMaquina = () => {
    const url = linkWhatsSemNumero(textoPedirConfirmacaoMaquina(linkPublicoDoVideo(videoAmostra)));
    let janela: Window | null = null;
    try { janela = window.open(url, '_blank'); if (janela) janela.opener = null; } catch { janela = null; }
    if (!janela) toast('Toque para abrir o WhatsApp', { duration: 15000, action: { label: 'Abrir WhatsApp', onClick: () => { window.open(url, '_blank', 'noopener'); } } });
  };
  const videosCarrossel = React.useMemo(() => videosConsultor.filter(v => v.no_carrossel), [videosConsultor]);
  const temCarrossel = prontaEntrega.length > 0 || videosCarrossel.length > 0;
  const equipDoVideo = (v: VideoConsultor) => {
    const prod = catalogProducts.find(p => p.id === v.produto_id);
    const model = prod && v.modelo_id ? (prod.models || []).find(m => m.id === v.modelo_id) : undefined;
    return { prod, model };
  };
  // vídeo sem capa: a foto do equipamento no lugar
  const fotoDoVideo = (v: VideoConsultor): string | undefined => {
    const { prod, model } = equipDoVideo(v);
    if (!prod) return undefined;
    return (model ? fotoDoModelo(prod, model) : '') || prod.image_url || undefined;
  };
  const [loadingExplorer, setLoadingExplorer] = useState(false);

  // Explorer states for interactive navigation
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    try {
      const saved = sessionStorage.getItem('roder_helper_selectedProduct');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [selectedWeightBand, setSelectedWeightBand] = useState<string | null>(() => {
    try {
      const saved = sessionStorage.getItem('roder_helper_selectedWeightBand');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [selectedModel, setSelectedModel] = useState<ProductModel | null>(() => {
    try {
      const saved = sessionStorage.getItem('roder_helper_selectedModel');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // States for Caçamba guided steps
  const [cacambaStep, setCacambaStep] = useState<'material' | 'brand' | 'model' | 'result' | null>(() => {
    try {
      const saved = sessionStorage.getItem('roder_helper_cacambaStep');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [selectedMaterial, setSelectedMaterial] = useState<any>(() => {
    try {
      const saved = sessionStorage.getItem('roder_helper_selectedMaterial');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [selectedCacambaBrand, setSelectedCacambaBrand] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('roder_helper_selectedCacambaBrand');
      return saved ? JSON.parse(saved) : '';
    } catch {
      return '';
    }
  });
  
  const [selectedCacambaModel, setSelectedCacambaModel] = useState<any>(() => {
    try {
      const saved = sessionStorage.getItem('roder_helper_selectedCacambaModel');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [recommendedCacambaCap, setRecommendedCacambaCap] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('roder_helper_recommendedCacambaCap');
      return saved ? JSON.parse(saved) : '';
    } catch {
      return '';
    }
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateProgress, setUpdateProgress] = useState(0);

  // --- PUBLIC ONBOARDING STATES ---
  const [publicUser, setPublicUser] = useState<{
    userType: 'cliente' | 'vendedor' | null;
    name?: string;
    phone?: string;
    cityState?: string;
    baseMachine?: string;
    email?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('roder_public_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [onboardingStep, setOnboardingStep] = useState<
    'SELECT_ROLE' | 'CLIENT_NAME' | 'CLIENT_PHONE' | 'CLIENT_CITY' | 'CLIENT_MACHINE' | 'SELLER_EMAIL' | 'SELLER_PHONE' | 'SELLER_NOT_FOUND' | 'COMPLETED'
  >(() => {
    if (parceiroViaLink) return 'COMPLETED';
    try {
      const saved = localStorage.getItem('roder_public_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userType) return 'COMPLETED';
      }
    } catch {}
    return 'SELECT_ROLE';
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem('roder_helper_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: any, idx: number) => ({
            ...m,
            id: m.id || `restored-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
          }));
        }
      }
    } catch {}

    if (parceiroViaLink) return [{ id: 'initial-welcome', role: 'assistant', content: saudacaoParceiro(parceiroViaLink.nome) }];

    // Dynamic initial message based on saved profile
    try {
      const savedProfile = localStorage.getItem('roder_public_user_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.userType === 'vendedor') {
          return [
            {
              id: 'initial-welcome',
              role: 'assistant',
              content: `Olá, **${parsed.name || 'Parceiro'}**! Sou o **Consultor Técnico RODER** 🛠️. Fico muito feliz em ter você aqui como Vendedor/Parceiro. Estou de prontidão para ajudar você com especificações, dimensionamento de equipamentos ou estoque. Como posso te apoiar nas suas vendas hoje?`
            }
          ];
        } else if (parsed.userType === 'cliente') {
          return [
            {
              id: 'initial-welcome',
              role: 'assistant',
              content: `Olá, **${parsed.name || 'Cliente'}**! Sou o **Consultor Técnico RODER** 🛠️. Estou aqui para ajudar você a dimensionar e escolher o equipamento ideal para a sua máquina **${parsed.baseMachine || 'escavadeira'}**. Como posso ajudar você hoje?`
            }
          ];
        }
      }
    } catch {}

    return [
      {
        id: 'initial-welcome',
        role: 'assistant',
        content: 'Olá! Sou o **Consultor Técnico RODER** 🛠️.\n\nPara que eu possa te dar o melhor atendimento personalizado e registrar seu contato, por favor, me informe:\n\n**Quem é você?**'
      }
    ];
  });

  // Indicação pela conversa em andamento (guardada na aba: recarregar não perde o que foi digitado)
  const [fluxoInd, setFluxoInd] = useState<FluxoIndicar | null>(() => {
    try { return JSON.parse(sessionStorage.getItem('roder_helper_fluxo_ind') || 'null'); } catch { return null; }
  });
  useEffect(() => {
    try {
      if (fluxoInd) sessionStorage.setItem('roder_helper_fluxo_ind', JSON.stringify(fluxoInd));
      else sessionStorage.removeItem('roder_helper_fluxo_ind');
    } catch { /* sem armazenamento */ }
  }, [fluxoInd]);

  // Skip onboarding if user is logged in
  useEffect(() => {
    if (logado && profile) {
      setOnboardingStep('COMPLETED');
    }
  }, [logado, profile]);
  
  // --- SPY PROTECTION, SHARING & LEAD/BUDGET CAPTURE STATES ---
  const [askedTopics, setAskedTopics] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('roder_consultant_asked_topics');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  
  // Persisted state variables for client budget form
  const [budgetContactName, setBudgetContactName] = useState(() => {
    const direct = localStorage.getItem('roder_budget_contact_name');
    if (direct) return direct;
    try {
      const saved = localStorage.getItem('roder_public_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.name || '';
      }
    } catch {}
    return '';
  });

  const [budgetCompanyName, setBudgetCompanyName] = useState(() => {
    const direct = localStorage.getItem('roder_budget_company_name');
    if (direct) return direct;
    try {
      const saved = localStorage.getItem('roder_public_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.companyName || parsed.name || '';
      }
    } catch {}
    return '';
  });

  const [budgetPhone, setBudgetPhone] = useState(() => {
    const direct = localStorage.getItem('roder_budget_phone');
    if (direct) return direct;
    try {
      const saved = localStorage.getItem('roder_public_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.phone || '';
      }
    } catch {}
    return '';
  });

  const [budgetCNPJ, setBudgetCNPJ] = useState(() => {
    return localStorage.getItem('roder_budget_cnpj') || '';
  });

  const [budgetMachineBrand, setBudgetMachineBrand] = useState(() => {
    const direct = localStorage.getItem('roder_budget_machine_brand');
    if (direct) return direct;
    try {
      const saved = localStorage.getItem('roder_public_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.baseMachine || '';
      }
    } catch {}
    return '';
  });

  const [budgetMachineModel, setBudgetMachineModel] = useState(() => {
    return localStorage.getItem('roder_budget_machine_model') || '';
  });

  const [budgetLocation, setBudgetLocation] = useState(() => {
    const direct = localStorage.getItem('roder_budget_location');
    if (direct) return direct;
    try {
      const saved = localStorage.getItem('roder_public_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.cityState || '';
      }
    } catch {}
    return '';
  });

  const [budgetObservations, setBudgetObservations] = useState('');
  const [budgetEquipName, setBudgetEquipName] = useState('');
  const [budgetSubmitLoading, setBudgetSubmitLoading] = useState(false);

  // Audio transcription & microphone recording states
  const [isBudgetRecording, setIsBudgetRecording] = useState(false);
  const [budgetRecordingMode, setBudgetRecordingMode] = useState<'click' | 'hold' | null>(null);
  const pressTimer = useRef<any>(null);
  const isPressing = useRef(false);
  const pressStartTime = useRef<number>(0);
  const recognitionRef = useRef<any>(null);

  // Pre-fill states from publicUser when budget form is opened
  useEffect(() => {
    if (isBudgetFormOpen) {
      try {
        const saved = localStorage.getItem('roder_public_user_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!budgetContactName && parsed.name) setBudgetContactName(parsed.name);
          if (!budgetPhone && parsed.phone) setBudgetPhone(parsed.phone);
          if (!budgetLocation && parsed.cityState) setBudgetLocation(parsed.cityState);
          if (!budgetMachineBrand && parsed.baseMachine) setBudgetMachineBrand(parsed.baseMachine);
          if (!budgetCompanyName && parsed.name) setBudgetCompanyName(parsed.name);
        }
      } catch {}
    }
  }, [isBudgetFormOpen]);

  const startSpeechRecording = (mode: 'click' | 'hold') => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("O reconhecimento de voz não é suportado neste navegador.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'pt-BR';

      rec.onstart = () => {
        setIsBudgetRecording(true);
        setBudgetRecordingMode(mode);
      };

      rec.onresult = (event: any) => {
        const resultIndex = event.resultIndex;
        const transcript = event.results[resultIndex][0].transcript;
        if (transcript) {
          setBudgetObservations(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech error:", event.error);
        if (event.error === 'not-allowed') {
          toast.error("Permissão de microfone negada.");
        }
      };

      rec.onend = () => {
        setIsBudgetRecording(false);
        setBudgetRecordingMode(null);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
    }
  };

  const stopSpeechRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsBudgetRecording(false);
    setBudgetRecordingMode(null);
  };

  const handleMicPressStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isPressing.current = true;
    pressStartTime.current = Date.now();

    if (pressTimer.current) clearTimeout(pressTimer.current);

    pressTimer.current = setTimeout(() => {
      if (isPressing.current) {
        if (!isBudgetRecording) {
          startSpeechRecording('hold');
          toast.info("Gravando por retenção (solte para parar)...");
        }
      }
    }, 2000);
  };

  const handleMicPressEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isPressing.current) return;
    isPressing.current = false;

    if (pressTimer.current) clearTimeout(pressTimer.current);

    const duration = Date.now() - pressStartTime.current;

    if (duration >= 2000) {
      if (isBudgetRecording && budgetRecordingMode === 'hold') {
        stopSpeechRecording();
        toast.success("Áudio gravado com sucesso!");
      }
    } else {
      if (isBudgetRecording) {
        stopSpeechRecording();
        toast.success("Gravação encerrada!");
      } else {
        startSpeechRecording('click');
        toast.info("Gravando... clique novamente para parar.");
      }
    }
  };

  // Sharing links / Whatsapp dialog states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareClientPhone, setShareClientPhone] = useState('');
  const [shareRefName, setShareRefName] = useState(() => {
    return profile?.name || profile?.email || user?.email || '';
  });
  const [shareCustomMessage, setShareCustomMessage] = useState(() => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://roderindica.web.app';
    const sellerRef = user?.email || profile?.email || '';
    const shareUrl = `${currentOrigin}/consultor?ref=${encodeURIComponent(sellerRef)}`;
    return `Olá! Sou da equipe Roder e gostaria de compartilhar com você o nosso *Consultor Técnico Digital com Inteligência Artificial*! 🛠️🤖\n\nCom ele, você pode dimensionar equipamentos, calcular produtividade de garras e cabeçotes em tempo real, e tirar qualquer dúvida técnica sobre nossos produtos diretamente do seu celular.\n\nToque no link abaixo para começar a usar agora mesmo:\n👉 ${shareUrl}`;
  });
  const [shareText, setShareText] = useState(() => shareCustomMessage);

  // Keep shareText updated when shareRefName changes
  useEffect(() => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://roderindica.web.app';
    const ref = shareRefName || user?.email || 'direto';
    const shareUrl = `${currentOrigin}/consultor?ref=${encodeURIComponent(ref)}`;
    setShareText(`Olá! Sou da equipe Roder e gostaria de compartilhar com você o nosso *Consultor Técnico Digital com Inteligência Artificial*! 🛠️🤖\n\nCom ele, você pode dimensionar equipamentos, calcular produtividade de garras e cabeçotes em tempo real, e tirar qualquer dúvida técnica sobre nossos produtos diretamente do seu celular.\n\nToque no link abaixo para começar a usar agora mesmo:\n👉 ${shareUrl}`);
  }, [shareRefName, user?.email]);

  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [arrasteCalcDiameter, setArrasteCalcDiameter] = useState<number>(20);
  const [arrasteCalcEquip, setArrasteCalcEquip] = useState<'msr600' | 'msr1000' | 'clambunk10' | 'clambunk15'>('msr1000');
  const [isArrasteCalcOpen, setIsArrasteCalcOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('audio/webm');
  const [detailTab, setDetailTab] = useState<'specs' | 'productivity'>('specs');
  const [effectiveProductivityText, setEffectiveProductivityText] = useState<string>('');
  const [gtLength, setGtLength] = useState<number>(1.0);

  useEffect(() => {
    if (selectedModel && selectedProduct) {
      if (selectedModel.productivity_text && selectedModel.productivity_text.trim() !== '') {
        setEffectiveProductivityText(selectedModel.productivity_text);
      } else {
        const defaultText = DEFAULT_PRODUCTIVITIES[selectedModel.name];
        if (defaultText) {
          setEffectiveProductivityText(defaultText);
          // Update in local catalog list to display instantly
          setCatalogProducts(prev => prev.map(p => {
            if (p.id === selectedProduct.id) {
              const updatedModels = (p.models || []).map(m => {
                if (m.id === selectedModel.id) {
                  return { ...m, productivity_text: defaultText };
                }
                return m;
              });
              return { ...p, models: updatedModels };
            }
            return p;
          }));
          // Background update in Firestore to save permanently
          const updateFirestore = async () => {
            try {
              const productRef = doc(db, 'products', selectedProduct.id);
              const prodSnap = await getDocs(query(collection(db, 'products')));
              // Find the correct product document by checking id matching or doc id
              const matchingDoc = prodSnap.docs.find(d => d.id === selectedProduct.id);
              if (matchingDoc) {
                const prodData = matchingDoc.data() as Product;
                const updatedModels = (prodData.models || []).map(m => {
                  if (m.id === selectedModel.id) {
                    return { ...m, productivity_text: defaultText };
                  }
                  return m;
                });
                await updateDoc(matchingDoc.ref, { models: updatedModels });
                console.log(`[FIRESTORE] Auto-saved productivity text for model ${selectedModel.id}`);
              }
            } catch (err) {
              console.error("[FIRESTORE] Failed to auto-save productivity:", err);
            }
          };
          updateFirestore();
        } else {
          setEffectiveProductivityText('');
        }
      }
    } else {
      setEffectiveProductivityText('');
    }
  }, [selectedModel, selectedProduct]);

  const [explorerMinimized, setExplorerMinimized] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  
  // Custom calculator state inside the helper
  const [calcOpen, setCalcOpen] = useState(false);
  const [grappleArea, setGrappleArea] = useState('0.4');
  const [woodLength, setWoodLength] = useState('3.0');
  const [cycleTime, setCycleTime] = useState('40');
  const [calcResult, setCalcResult] = useState<{
    weightPerCycle: number;
    cyclesPerHour: number;
    hourlyProductivity: number;
  } | null>(null);

  // States for report modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  // "Voltar" do celular fecha primeiro o relatório e depois o consultor, em vez de sair da tela
  useVoltarFecha(isOpen && !isFullPage, () => setIsOpenState(false));
  useVoltarFecha(isReportOpen, () => setIsReportOpen(false));
  useVoltarFecha(isShareModalOpen, () => setIsShareModalOpen(false));
  useVoltarFecha(isBudgetFormOpen, () => setIsBudgetFormOpen(false));
  const [reportContent, setReportContent] = useState('');
  const [reportTitle, setReportTitle] = useState('Relatório de Dimensionamento Técnico');
  const reportRef = useRef<HTMLDivElement>(null);
  const dragContainerRef = useRef<HTMLDivElement>(null);

  // States and Handlers for Knowledge Base ("Ensinar Roder IA")
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [knowledgeTitle, setKnowledgeTitle] = useState('');
  const [knowledgeText, setKnowledgeText] = useState('');
  const [recentTeachings, setRecentTeachings] = useState<any[]>([]);
  const [loadingTeachings, setLoadingTeachings] = useState(false);
  const [isTeachingRecording, setIsTeachingRecording] = useState(false);
  const [isTeachingTranscribing, setIsTeachingTranscribing] = useState(false);
  const teachingMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const teachingAudioChunksRef = useRef<Blob[]>([]);

  const fetchRecentTeachings = async () => {
    setLoadingTeachings(true);
    try {
      const qSnap = await getDocs(
        query(collection(db, 'roder_ai_questions'), orderBy('timestamp', 'desc'))
      );
      const items: any[] = [];
      qSnap.forEach(doc => {
        const data = doc.data();
        if (data.isImproved) {
          items.push({ id: doc.id, ...data });
        }
      });
      setRecentTeachings(items.slice(0, 5));
    } catch (err) {
      console.error("Error fetching teachings:", err);
    } finally {
      setLoadingTeachings(false);
    }
  };

  const startTeachingRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const types = [
        'audio/webm', 
        'audio/mp4', 
        'audio/mpeg', 
        'audio/ogg;codecs=opus', 
        'audio/ogg', 
        'audio/wav', 
        'audio/aac'
      ];
      let mimeType = '';
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const typeToUse = mimeType || '';
      const options: MediaRecorderOptions = {
        ...(typeToUse ? { mimeType: typeToUse } : {}),
        audioBitsPerSecond: 16000 // Compressed 16kbps for tiny, fast network transfers
      };
      const mediaRecorder = new MediaRecorder(stream, options);
      teachingMediaRecorderRef.current = mediaRecorder;
      teachingAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) teachingAudioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (teachingAudioChunksRef.current.length === 0) {
          toast.error('Nenhum áudio capturado.');
          setIsTeachingTranscribing(false);
          return;
        }

        const finalType = typeToUse || teachingAudioChunksRef.current[0].type || 'audio/webm';
        const audioBlob = new Blob(teachingAudioChunksRef.current, { type: finalType });
        setIsTeachingTranscribing(true);
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const resultStr = reader.result?.toString() || '';
          const base64data = resultStr.split(',')[1];
          
          if (base64data) {
            try {
              toast.loading('Convertendo sua fala em conhecimento escrito...', { id: 'teaching-transcribe' });
              const transcription = await transcribeAudio(base64data, finalType, 'chat');
              toast.dismiss('teaching-transcribe');
              
              if (transcription && !transcription.startsWith("Erro na transcrição")) {
                toast.success('Fala convertida com sucesso!');
                setKnowledgeText(prev => prev ? prev + '\n' + transcription : transcription);
              } else {
                toast.error(transcription || 'A IA não conseguiu entender a fala.');
              }
            } catch (error: any) {
              toast.dismiss('teaching-transcribe');
              console.error("Transcription error:", error);
              toast.error('Erro de rede na transcrição.');
            }
          }
          setIsTeachingTranscribing(false);
        };
      };

      mediaRecorder.start(1000);
      setIsTeachingRecording(true);
      toast.success('Gravando sua voz para ensinar a IA...');
    } catch (err: any) {
      console.error("Error accessing microphone for teaching:", err);
      toast.error('Permissão de microfone negada ou erro ao iniciar áudio.');
    }
  };

  const stopTeachingRecording = () => {
    if (teachingMediaRecorderRef.current && isTeachingRecording) {
      teachingMediaRecorderRef.current.stop();
      setIsTeachingRecording(false);
      teachingMediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSaveKnowledge = async () => {
    if (!knowledgeTitle.trim()) {
      toast.error('Por favor, informe o título do tópico ou pergunta relacionada.');
      return;
    }
    if (!knowledgeText.trim()) {
      toast.error('Por favor, digite ou grave a explicação técnica correspondente.');
      return;
    }

    const savedTitle = knowledgeTitle.trim();
    const savedText = knowledgeText.trim();

    const toastId = toast.loading('Salvando e ensinando o Consultor Roder IA...');
    try {
      // 1. Add to roder_ai_questions (Immediate saving)
      await addDoc(collection(db, 'roder_ai_questions'), {
        question: savedTitle,
        improvedAnswer: savedText,
        isImproved: true,
        timestamp: new Date().toISOString(),
        source: 'Base de Conhecimento Direta',
        author: user?.email || 'Consultor Técnico'
      });

      // Show success toast and clear fields immediately
      toast.success('Conhecimento salvo com sucesso! O Consultor Roder IA já aprendeu essa instrução.', { id: toastId });
      setKnowledgeTitle('');
      setKnowledgeText('');
      fetchRecentTeachings();

      // 2. Perform intelligent auto-enrichment of product dossiers (Asynchronously in background to avoid any blocking/hanging on mobile)
      analyzeAndEnrichProductDossier(savedTitle, savedText)
        .then((enrichResult) => {
          if (enrichResult && enrichResult.matched) {
            toast.success(`Incrível! Detectei que este ensino refere-se ao equipamento "${enrichResult.productName}" (Modelo ${enrichResult.modelName}) e atualizei automaticamente o dossiê técnico na categoria "${enrichResult.classifiedField === 'compatibility_notes' ? 'Compatibilidade' : enrichResult.classifiedField === 'choice_reason' ? 'Motivos de Escolha' : enrichResult.classifiedField === 'productivity_info' ? 'Produtividade' : 'Descrição do Dossiê'}"!`, {
              duration: 10000
            });
          }
        })
        .catch((enrichErr) => {
          console.error("Auto-enrichment background error (non-blocking):", enrichErr);
        });

    } catch (error) {
      console.error("Error saving knowledge to Firebase:", error);
      toast.error('Erro ao salvar no banco de dados. Verifique a conexão.', { id: toastId });
    }
  };

  const handleOpenReport = (content?: string, title?: string) => {
    let finalContent = content;
    if (!finalContent) {
      // Find the last assistant message in the list
      const assistantMsgs = messages.filter(m => m.role === 'assistant');
      if (assistantMsgs.length > 0) {
        finalContent = assistantMsgs[assistantMsgs.length - 1].content;
      } else {
        finalContent = "Olá! Realize uma consulta com o Consultor Técnico RODER acima para gerar um relatório completo de compatibilidade e dimensionamento de equipamentos.";
      }
    }
    setReportContent(finalContent);
    setReportTitle(title || 'Relatório de Dimensionamento Técnico');
    setIsReportOpen(true);
  };

  const handleDownloadReportPng = async () => {
    const element = reportRef.current;
    if (!element) return;

    const toastId = toast.loading("Gerando imagem do relatório técnico de alta definição...");

    try {
      const options = {
        quality: 1.0,
        pixelRatio: 2, // Enhances text clarity
        backgroundColor: '#ffffff',
        style: {
          width: '794px',
          maxWidth: 'none',
          zoom: '1',
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      };

      const dataUrl = await toPng(element, options);
      const fileName = `Relatorio_Tecnico_Roder_${new Date().toISOString().slice(0, 10)}.png`;

      // Web Share API support for iOS Safari / Android Chrome (allows native "Salvar em Fotos" / "Salvar Imagem")
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Relatório Técnico Roder',
            text: 'Relatório de Análise Técnica Roder'
          });
          toast.success("Opção de compartilhamento aberta! Escolha 'Salvar Imagem' ou 'Salvar em Fotos'.", { id: toastId });
          return;
        }
      } catch (shareErr) {
        console.log("Web Share API cancelled or unavailable:", shareErr);
      }

      // Fallback for desktop or standard web browsers
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      toast.success("Imagem do relatório baixada com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Error generating report image:", error);
      toast.error("Erro ao gerar imagem. Por favor, tente novamente.", { id: toastId });
    }
  };

  const handleSharePdfWhatsapp = async () => {
    const element = reportRef.current;
    if (!element) return;

    const toastId = toast.loading("Gerando PDF e preparando envio para WhatsApp...");

    try {
      const options = {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          width: '794px',
          maxWidth: 'none',
          zoom: '1',
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      };

      const dataUrl = await toPng(element, options);
      const fileName = `Relatorio_Tecnico_Roder_${new Date().toISOString().slice(0, 10)}.pdf`;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = 210;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (pdfHeight > 297) {
        let heightLeft = pdfHeight;
        let position = 0;
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= 297;

        while (heightLeft > 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
          heightLeft -= 297;
        }
      } else {
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // If mobile supports native file sharing
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: 'Relatório Técnico Roder',
            text: 'Segue em anexo o Relatório de Análise Técnica Roder em PDF.'
          });
          toast.success("Escolha o WhatsApp para enviar o arquivo PDF diretamente ao cliente!", { id: toastId });
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            toast.dismiss(toastId);
            return;
          }
          console.warn("Web Share API failed, falling back to download + WhatsApp link:", shareErr);
        }
      }

      // Fallback for Desktop: Save PDF and open WhatsApp Web with formatted text
      pdf.save(fileName);
      const cleanSummary = reportContent.replace(/[*#]/g, '').slice(0, 300);
      const waText = `*RELATÓRIO DE ANÁLISE TÉCNICA - RODER BRASIL*\n\n*(Anexei o relatório completo em PDF nesta conversa)*\n\n${cleanSummary}...`;
      const encodedWaText = encodeURIComponent(waText);
      window.open(`https://api.whatsapp.com/send?text=${encodedWaText}`, '_blank');

      toast.success("PDF baixado! Abrindo o WhatsApp Web para você selecionar o contato e anexar o PDF.", { id: toastId, duration: 6000 });
    } catch (error) {
      console.error("Error generating PDF for WhatsApp:", error);
      toast.error("Erro ao gerar PDF do relatório. Por favor, tente novamente.", { id: toastId });
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronize state changes to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('roder_helper_isOpen', JSON.stringify(isOpen));
      window.dispatchEvent(new CustomEvent('roder_helper_isOpen_changed', { detail: isOpen }));
    } catch (e) {}
  }, [isOpen]);

  useEffect(() => {
    try {
      sessionStorage.setItem('roder_helper_messages', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Outras telas abrem o consultor já com uma pergunta (perguntas prontas da tela inicial do parceiro)
  const [perguntaPendente, setPerguntaPendente] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    const abrir = (e: Event) => {
      const pergunta = String((e as CustomEvent).detail?.pergunta || '').trim();
      // no computador, dentro do Roder Indica, o consultor abre na janela própria
      if (!isFullPage && abrirConsultorEmJanela(pergunta)) return;
      setIsOpen(true);
      if (pergunta) setPerguntaPendente({ texto: pergunta, n: Date.now() });
    };
    window.addEventListener('roder:abrir-consultor', abrir);
    return () => window.removeEventListener('roder:abrir-consultor', abrir);
  }, []);

  // Janela própria do consultor: pergunta pronta vem no endereço (?pergunta=...) e sai dele em seguida
  useEffect(() => {
    if (!isFullPage) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const pergunta = (params.get('pergunta') || '').trim();
      if (!pergunta) return;
      params.delete('pergunta');
      const qs = params.toString();
      window.history.replaceState(window.history.state, document.title, window.location.pathname + (qs ? `?${qs}` : ''));
      setPerguntaPendente({ texto: pergunta.slice(0, 500), n: Date.now() });
    } catch { /* endereço inválido: ignora */ }
  }, []);

  // Tela grande (computador): o consultor de página inteira vira o ambiente de 3 colunas.
  // Abaixo de 1024 px fica exatamente a tela de sempre.
  const [telaGrande, setTelaGrande] = useState(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const mudou = () => setTelaGrande(mq.matches);
    mudou();
    mq.addEventListener?.('change', mudou);
    return () => mq.removeEventListener?.('change', mudou);
  }, []);
  const layoutPc = isFullPage && telaGrande;
  const [abaPainel, setAbaPainel] = useState<'conversa' | 'ficha' | 'fotos'>('conversa');
  const [buscaEquip, setBuscaEquip] = useState('');

  // ===================== Consultor no celular (e janela flutuante) =====================
  const [menuCel, setMenuCel] = useState(false);
  const [folhaEquip, setFolhaEquip] = useState(false);
  // "Voltar" do celular fecha primeiro o menu e a lista de equipamentos
  useVoltarFecha(menuCel, () => setMenuCel(false));
  useVoltarFecha(folhaEquip, () => setFolhaEquip(false));
  const [folhaPronta, setFolhaPronta] = useState(false);
  useVoltarFecha(folhaPronta, () => setFolhaPronta(false));
  const [folhaVideos, setFolhaVideos] = useState(false);
  useVoltarFecha(folhaVideos, () => setFolhaVideos(false));
  const campoCelRef = useRef<HTMLTextAreaElement>(null);
  const listaCelRef = useRef<HTMLDivElement>(null);
  // Altura visível de verdade no celular, SÓ com o teclado aberto: a caixa de texto fica sempre acima dele.
  // Antes o painel seguia o visualViewport o tempo todo. No iPhone a barra do Safari encolhe e volta
  // enquanto a pessoa rola a conversa (varia 50 a 80 px), cada variação reposicionava o painel e o
  // efeito de teclado puxava a conversa para o fim: era a "tela que mexe sozinha". Barra do navegador
  // não é teclado: só vale diferença grande (teclado tem mais de 200 px).
  const [vvCel, setVvCel] = useState<{ h: number; top: number } | null>(null);
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!isOpen || layoutPc || !vv) { setVvCel(null); return; }
    const ajustar = () => {
      if (window.innerWidth >= 640) { setVvCel(null); return; }
      const tecladoAberto = window.innerHeight - vv.height > 150;
      if (!tecladoAberto) { setVvCel(prev => (prev === null ? prev : null)); return; }
      const h = Math.round(vv.height), top = Math.round(vv.offsetTop);
      setVvCel(prev => (prev && prev.h === h && prev.top === top) ? prev : { h, top });
    };
    ajustar();
    vv.addEventListener('resize', ajustar);
    vv.addEventListener('scroll', ajustar);
    return () => { vv.removeEventListener('resize', ajustar); vv.removeEventListener('scroll', ajustar); };
  }, [isOpen, layoutPc]);
  // Celular com o consultor aberto: a página de trás não rola (nem pelo encadeamento da rolagem do iOS)
  useEffect(() => {
    if (!isOpen || layoutPc || typeof window === 'undefined' || window.innerWidth >= 640) return;
    const html = document.documentElement, body = document.body;
    const antes = { h: html.style.overflow, b: body.style.overflow, hb: html.style.overscrollBehavior };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    return () => { html.style.overflow = antes.h; body.style.overflow = antes.b; html.style.overscrollBehavior = antes.hb; };
  }, [isOpen, layoutPc]);
  // Rolagem da conversa: só gruda no fim quem já está perto dele, e a posição de leitura é preservada
  // quando algo cresce acima (ver useRolagemConversa)
  const { pertoDoFim, rolarAoFim, rolarAoElemento } = useRolagemConversa(
    messagesEndRef,
    `${isOpen}|${layoutPc}|${knowledgeOpen}|${messages.some(m => m.role === 'user')}`,
  );
  const rolarListaCelAoFim = () => rolarAoFim(false);
  // Teclado abriu ou fechou: se a pessoa estava no fim, a conversa continua no fim; senão fica onde está
  // (na tela de início não: a saudação fica no topo)
  const tecladoCel = !!vvCel;
  const tecladoAntes = useRef(false);
  useEffect(() => {
    if (tecladoAntes.current === tecladoCel) return;
    tecladoAntes.current = tecladoCel;
    if (messages.some(m => m.role === 'user') && pertoDoFim.current) rolarAoFim(false);
  }, [tecladoCel]);
  // Caixa de texto que cresce com o texto (digitado ou ditado): de 1 até 6 linhas, depois rola por dentro
  React.useLayoutEffect(() => {
    const el = campoCelRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const alturaTela = (typeof window !== 'undefined' && (window.visualViewport?.height || window.innerHeight)) || 800;
    const maximo = Math.min(6 * 22 + 22, Math.round(alturaTela * 0.4));
    const alvo = Math.max(44, Math.min(el.scrollHeight, maximo));
    el.style.height = `${alvo}px`;
    el.style.overflowY = el.scrollHeight > maximo ? 'auto' : 'hidden';
  }, [inputValue, isOpen, layoutPc, vvCel?.h, isRecording, transcribing, knowledgeOpen]);
  // explorador minimizado (ou pergunta enviada): a folha de equipamentos fecha
  useEffect(() => { if (explorerMinimized) setFolhaEquip(false); }, [explorerMinimized]);

  // Parceiro do link também não passa pelo "Quem é você?"
  useEffect(() => {
    if (!parceiroViaLink) return;
    setOnboardingStep('COMPLETED');
    setMessages(prev => (prev.length === 1 && prev[0].role === 'assistant' && /Quem é você\?/.test(prev[0].content))
      ? [{ id: prev[0].id, role: 'assistant', content: saudacaoParceiro(parceiroViaLink.nome) }]
      : prev);
  }, [parceiroViaLink?.token]);

  // Quem está logado não passa pelo "Quem é você?": troca a saudação de visitante pela de sempre
  useEffect(() => {
    if (!logado || !profile) return;
    setMessages(prev => (prev.length === 1 && prev[0].role === 'assistant' && /Quem é você\?/.test(prev[0].content))
      ? [{ id: prev[0].id, role: 'assistant', content: 'Olá! Sou o **Consultor Técnico RODER** 🛠️. Como posso te ajudar hoje?' }]
      : prev);
  }, [logado, profile]);

  useEffect(() => {
    try {
      sessionStorage.setItem('roder_helper_selectedProduct', JSON.stringify(selectedProduct));
    } catch (e) {}
  }, [selectedProduct]);

  useEffect(() => {
    try {
      sessionStorage.setItem('roder_helper_selectedWeightBand', JSON.stringify(selectedWeightBand));
    } catch (e) {}
  }, [selectedWeightBand]);

  useEffect(() => {
    try {
      sessionStorage.setItem('roder_helper_selectedModel', JSON.stringify(selectedModel));
    } catch (e) {}
  }, [selectedModel]);

  useEffect(() => {
    try {
      sessionStorage.setItem('roder_helper_cacambaStep', JSON.stringify(cacambaStep));
    } catch (e) {}
  }, [cacambaStep]);

  useEffect(() => {
    try {
      sessionStorage.setItem('roder_helper_selectedMaterial', JSON.stringify(selectedMaterial));
    } catch (e) {}
  }, [selectedMaterial]);

  useEffect(() => {
    try {
      sessionStorage.setItem('roder_helper_selectedCacambaBrand', JSON.stringify(selectedCacambaBrand));
    } catch (e) {}
  }, [selectedCacambaBrand]);

  useEffect(() => {
    try {
      sessionStorage.setItem('roder_helper_selectedCacambaModel', JSON.stringify(selectedCacambaModel));
    } catch (e) {}
  }, [selectedCacambaModel]);

  useEffect(() => {
    try {
      sessionStorage.setItem('roder_helper_recommendedCacambaCap', JSON.stringify(recommendedCacambaCap));
    } catch (e) {}
  }, [recommendedCacambaCap]);

  // Rolagem quando chega mensagem ou o consultor começa/termina de pensar. Só reage à CHEGADA de
  // mensagem (muda a quantidade) ou ao "carregando"; antes rodava a cada troca da lista `messages`
  // e rolava com `scrollIntoView` até com a pessoa lendo lá em cima.
  const rolagemVista = useRef({ n: 0, loading: false });
  React.useLayoutEffect(() => {
    if (messages.length === 0) return;
    const ant = rolagemVista.current;
    rolagemVista.current = { n: messages.length, loading };
    const chegouMensagem = messages.length !== ant.n;
    if (!chegouMensagem && loading === ant.loading) return;
    const lastMsg = messages[messages.length - 1];
    const primeira = ant.n === 0; // conversa restaurada ao abrir
    const estavaNoFim = pertoDoFim.current;

    if (lastMsg.role === 'user' && chegouMensagem) {
      // a pessoa acabou de enviar: volta a regra de grudar no fim e mostra a pergunta
      rolarAoFim(false);
    } else if (loading) {
      // consultor pensando: mostra o indicador, mas só para quem já está no fim
      if (estavaNoFim) rolarAoFim(false);
    } else if (lastMsg.role === 'assistant' && chegouMensagem) {
      // Resposta chegou: mostra a pergunta e o começo dela. Quem subiu para ler outra coisa não é movido.
      if (primeira || estavaNoFim) {
        const pergunta = document.getElementById(`chat-message-${messages.length - 2}`);
        if (pergunta) rolarAoElemento(pergunta, !primeira);
        else rolarAoFim(false);
      }
    }
  }, [messages.length, loading]);

  // Fetch catalog and stock data on mount or open
  useEffect(() => {
    if (isOpen) {
      setLoadingExplorer(true);
      const fetchCatalogAndStock = async () => {
        try {
          const qProd = query(collection(db, 'products'), orderBy('name', 'asc'));
          const prodSnap = await getDocs(qProd);
          const prods = prodSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Product))
            .filter(p => !p.is_blocked);
          setCatalogProducts(prods);

          const qStock = query(collection(db, 'stock_items'));
          const stockSnap = await getDocs(qStock);
          const stock = stockSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
          setStockItems(stock);
        } catch (err) {
          console.error("Erro ao carregar dados do catálogo/estoque no consultor técnico:", err);
        } finally {
          setLoadingExplorer(false);
        }
      };
      fetchCatalogAndStock();
    }
  }, [isOpen]);

  useEffect(() => {
    if (knowledgeOpen) {
      fetchRecentTeachings();
    }
  }, [knowledgeOpen]);

  const handleClearConversation = () => {
    const defaultMsg: Message[] = [
      {
        id: `clear-${Date.now()}`,
        role: 'assistant',
        content: parceiroViaLink
          ? saudacaoParceiro(parceiroViaLink.nome)
          : !logado
          ? 'Olá! Conversa limpa. Sou o **Consultor Técnico RODER** 🛠️.\n\nPara que eu possa te dar o melhor atendimento personalizado e registrar seu contato, por favor, me informe:\n\n**Quem é você?**'
          : 'Olá! Conversa limpa. Sou o **Consultor Técnico RODER** 🛠️. Como posso te ajudar hoje?'
      }
    ];
    setMessages(defaultMsg);
    setSelectedProduct(null);
    setSelectedWeightBand(null);
    setSelectedModel(null);
    setCalcResult(null);
    setCacambaStep(null);
    setSelectedMaterial(null);
    setSelectedCacambaBrand('');
    setSelectedCacambaModel(null);
    setRecommendedCacambaCap('');
    setFluxoInd(null);

    // equipe Roder do link /consultor-equipe (e o parceiro do link pessoal) continua liberada ao limpar a conversa
    if (!logado && !(publicUser as any)?.equipe && !parceiroViaLink) {
      localStorage.removeItem('roder_public_user_profile');
      setPublicUser(null);
      setOnboardingStep('SELECT_ROLE');
    }

    try {
      sessionStorage.setItem('roder_helper_messages', JSON.stringify(defaultMsg));
      sessionStorage.removeItem('roder_helper_selectedProduct');
      sessionStorage.removeItem('roder_helper_selectedWeightBand');
      sessionStorage.removeItem('roder_helper_selectedModel');
      sessionStorage.removeItem('roder_helper_cacambaStep');
      sessionStorage.removeItem('roder_helper_selectedMaterial');
      sessionStorage.removeItem('roder_helper_selectedCacambaBrand');
      sessionStorage.removeItem('roder_helper_selectedCacambaModel');
      sessionStorage.removeItem('roder_helper_recommendedCacambaCap');
    } catch (e) {}
  };

  // Check for updates on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('update')) {
      // Clear the query parameter from the URL bar without reloading the page
      setTimeout(() => {
        const cleanUrl = window.location.origin + window.location.pathname;
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.delete('update');
        const qs = currentParams.toString();
        const finalUrl = cleanUrl + (qs ? '?' + qs : '');
        window.history.replaceState({}, document.title, finalUrl);
        toast.success("Consultor Técnico atualizado com sucesso para a versão mais recente!", {
          duration: 6000,
          icon: '✅'
        });
      }, 500);
    }
  }, []);

  const handleForceUpdate = () => {
    setIsUpdating(true);
    setUpdateProgress(10);
    setUpdateStatus("Conectando ao servidor RODER...");
    
    // Animate a smooth premium progress bar
    const progressInterval = setInterval(() => {
      setUpdateProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 250);

    setTimeout(() => {
      setUpdateStatus("Limpando cache do navegador e dados antigos...");
    }, 600);

    setTimeout(() => {
      setUpdateStatus("Carregando o código de produção mais recente...");
    }, 1200);

    setTimeout(async () => {
      setUpdateProgress(100);
      try {
        if (window.caches) {
          const keys = await window.caches.keys();
          for (const key of keys) {
            await window.caches.delete(key);
          }
        }
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        }
      } catch (e) {
        console.error("Erro ao limpar caches:", e);
      }

      clearInterval(progressInterval);

      // Force a full update reload by adding a fresh cache-buster timestamp
      const cleanUrl = window.location.origin + window.location.pathname;
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('update', Date.now().toString());
      window.location.href = cleanUrl + '?' + currentParams.toString();
    }, 2200);
  };

  const handleEndConversation = () => {
    try {
      sessionStorage.removeItem('roder_helper_isOpen');
      sessionStorage.removeItem('roder_helper_messages');
      sessionStorage.removeItem('roder_helper_selectedProduct');
      sessionStorage.removeItem('roder_helper_selectedWeightBand');
      sessionStorage.removeItem('roder_helper_selectedModel');
      sessionStorage.removeItem('roder_helper_cacambaStep');
      sessionStorage.removeItem('roder_helper_selectedMaterial');
      sessionStorage.removeItem('roder_helper_selectedCacambaBrand');
      sessionStorage.removeItem('roder_helper_selectedCacambaModel');
      sessionStorage.removeItem('roder_helper_recommendedCacambaCap');
    } catch (e) {
      console.warn("Could not clear sessionStorage:", e);
    }

    setMessages([
      {
        id: `end-${Date.now()}`,
        role: 'assistant',
        content: parceiroViaLink
          ? saudacaoParceiro(parceiroViaLink.nome)
          : !logado
          ? 'Olá! Sou o **Consultor Técnico RODER** 🛠️.\n\nPara que eu possa te dar o melhor atendimento personalizado e registrar seu contato, por favor, me informe:\n\n**Quem é você?**'
          : 'Olá! Sou o **Consultor Técnico RODER** 🛠️. Estou aqui para ajudar você a dimensionar e indicar o equipamento ideal para a sua escavadeira ou pá carregadeira, além de calcular produtividade. Como posso ajudar hoje?'
      }
    ]);
    setSelectedProduct(null);
    setSelectedWeightBand(null);
    setSelectedModel(null);
    setCalcResult(null);
    setCacambaStep(null);
    setSelectedMaterial(null);
    setSelectedCacambaBrand('');
    setSelectedCacambaModel(null);
    setRecommendedCacambaCap('');
    setIsOpen(false);
    setFluxoInd(null);

    // equipe Roder do link /consultor-equipe (e o parceiro do link pessoal) continua liberada ao limpar a conversa
    if (!logado && !(publicUser as any)?.equipe && !parceiroViaLink) {
      localStorage.removeItem('roder_public_user_profile');
      setPublicUser(null);
      setOnboardingStep('SELECT_ROLE');
    }

    toast.success('Conversa encerrada e limpa.');
  };

  const handleSelectRole = (role: 'cliente' | 'vendedor') => {
    if (role === 'cliente') {
      const userMsgId = `user-role-client-${Date.now()}`;
      const updated = [
        ...messages,
        { id: userMsgId, role: 'user', content: 'Sou Cliente (Quero Equipamento / Orçamento)' } as Message
      ];
      setMessages(updated);
      setOnboardingStep('CLIENT_NAME');
      setPublicUser({ userType: 'cliente' });

      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-client-name-${Date.now()}`,
            role: 'assistant',
            content: 'Excelente! Vamos realizar o seu cadastro rápido para registrar o seu atendimento. Por favor, me informe o seu **Nome Completo**:'
          }
        ]);
      }, 300);
    } else {
      const userMsgId = `user-role-seller-${Date.now()}`;
      const updated = [
        ...messages,
        { id: userMsgId, role: 'user', content: 'Sou Vendedor / Parceiro Cadastrado' } as Message
      ];
      setMessages(updated);
      // A conferência por e-mail e telefone lia o cadastro de usuários direto do navegador, sem
      // login, e a regra do Firebase recusa (users só é lido pela equipe ou pelo próprio dono):
      // o parceiro recebia "Erro ao verificar cadastro". Agora o parceiro entra pelo link pessoal.
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `assistant-seller-link-${Date.now()}`, role: 'assistant', content: msgParceiroUseLink }]);
      }, 300);
    }
  };

  const msgParceiroUseLink = `Parceiros entram pelo **link exclusivo** do Consultor Roder, que já abre com o seu nome, sem senha.\n\nAinda não tem o seu? Peça ao comercial da Roder no WhatsApp: [${WHATS_COMERCIAL_TEXTO}](https://wa.me/${WHATS_COMERCIAL}?text=${encodeURIComponent('Olá! Sou parceiro da Roder e quero o meu link do Consultor Roder.')}).\n\nSe você é cliente, toque em **Sou Cliente**.`;

  const handleRetrySellerEmail = () => {
    setOnboardingStep('SELLER_EMAIL');
    setMessages(prev => [
      ...prev,
      {
        id: `assistant-retry-email-${Date.now()}`,
        role: 'assistant',
        content: 'Perfeito! Por favor, informe o seu **E-mail cadastrado** correto para nova verificação:'
      }
    ]);
  };

  const handleOnboardingInput = async (text: string) => {
    // Add user message to screen
    const userMsgId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: text } as Message]);

    if (onboardingStep === 'CLIENT_NAME') {
      const updatedUser = { ...publicUser, name: text, userType: 'cliente' as const };
      setPublicUser(updatedUser);
      setOnboardingStep('CLIENT_PHONE');
      
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-phone-${Date.now()}`,
            role: 'assistant',
            content: `Muito prazer, **${text}**! Agora, por favor, me informe o seu **Telefone de contato com WhatsApp (com DDD)** para registrarmos em seu atendimento:`
          }
        ]);
      }, 300);
    } 
    else if (onboardingStep === 'CLIENT_PHONE') {
      const updatedUser = { ...publicUser, phone: text };
      setPublicUser(updatedUser);
      setOnboardingStep('CLIENT_CITY');
      
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-city-${Date.now()}`,
            role: 'assistant',
            content: `Obrigado! E de qual **Cidade e Estado** você está falando?`
          }
        ]);
      }, 300);
    } 
    else if (onboardingStep === 'CLIENT_CITY') {
      const updatedUser = { ...publicUser, cityState: text };
      setPublicUser(updatedUser);
      setOnboardingStep('CLIENT_MACHINE');
      
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-machine-${Date.now()}`,
            role: 'assistant',
            content: `Excelente! Para podermos dimensionar o equipamento ideal com precisão técnica para o seu cenário, qual é a sua **Máquina Base (Marca e Modelo)**? (Ex: CAT 320, JCB 3CX, escavadeira de 8 toneladas... Caso não possua, digite 'Não tenho'):`
          }
        ]);
      }, 300);
    } 
    else if (onboardingStep === 'CLIENT_MACHINE') {
      const finalUser = { ...publicUser, baseMachine: text };
      setPublicUser(finalUser);
      localStorage.setItem('roder_public_user_profile', JSON.stringify(finalUser));
      setOnboardingStep('COMPLETED');
      
      setLoading(true);
      try {
        // Create an Indication/Lead in Firestore!
        const sellerRef = localStorage.getItem('roder_consultant_ref') || '';
        let partnerEmail = '';
        let partnerNameFound = sellerRef;

        if (sellerRef) {
          try {
            let q = query(collection(db, 'users'), where('email', '==', sellerRef));
            let snap = await getDocs(q);
            if (snap.empty) {
              q = query(collection(db, 'users'), where('name', '==', sellerRef));
              snap = await getDocs(q);
            }
            if (!snap.empty) {
              const uData = snap.docs[0].data();
              partnerEmail = uData.email || '';
              partnerNameFound = uData.name || sellerRef;
            }
          } catch (err) {
            console.warn('Error fetching referral partner details:', err);
          }
        }

        const docData = {
          client_name: finalUser.name || 'Cliente Sem Nome',
          client_cnpj: 'Não informado',
          client_phone: finalUser.phone || 'Não informado',
          client_email: 'contato@roderindica.com.br',
          company_name: finalUser.name || 'Cliente Sem Nome',
          client_location: finalUser.cityState || 'Não informado',
          base_machine: finalUser.baseMachine || 'Não especificada',
          observations: `Início de atendimento pelo Consultor Técnico Digital. Cliente: ${finalUser.name}.`,
          product_name: 'Atendimento Consultor Técnico',
          status: 'new',
          indicator_id: sellerRef || 'consultor-direto',
          creator_type: 'visitor',
          lead_source: sellerRef ? 'consultor_compartilhado' : 'consultor_direto',
          shared_by_seller_email: partnerEmail || '',
          shared_by_seller_name: partnerNameFound || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await addDoc(collection(db, 'indications'), docData);

        // Notify commercial team (Gislene & Luana) via Email!
        try {
          const { notifyNewIndication } = await import('../../services/emailService');
          await notifyNewIndication({
            client_name: finalUser.name || 'Cliente Sem Nome',
            client_phone: finalUser.phone || 'Não informado',
            company_name: finalUser.name || 'Cliente Sem Nome',
            city: finalUser.cityState || '',
            state: '',
            product_name: 'Consultor Técnico Digital',
            lead_source: sellerRef ? 'consultor_compartilhado' : 'consultor_direto',
            shared_by_seller_name: partnerNameFound || sellerRef || 'Nenhum (Direto)',
            shared_by_seller_email: partnerEmail || ''
          }, sellerRef ? `Consultor Compartilhado por ${partnerNameFound || sellerRef}` : 'Consultor Direto (Cliente)', partnerEmail || undefined);
        } catch (err) {
          console.warn('Failed to send lead email notification:', err);
        }

        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: `assistant-welcome-complete-${Date.now()}`,
              role: 'assistant',
              content: `Cadastro rápido concluído com sucesso! 🎉\n\nOlá, **${finalUser.name}**! Seu contato foi associado à nossa equipe comercial${partnerNameFound ? ` via recomendação do vendedor ${partnerNameFound}` : ''}. \n\nAgora você tem acesso total às minhas simulações, cálculos e respostas com Inteligência Artificial. Como posso ajudar você hoje a escolher ou calcular produtividade para a sua **${finalUser.baseMachine}**?`
            }
          ]);
        }, 300);

      } catch (error: any) {
        console.error('Error registering public user lead:', error);
        toast.error('Erro ao registrar atendimento.');
        setOnboardingStep('CLIENT_MACHINE'); // roll back if save failed
      } finally {
        setLoading(false);
      }
    } 
    else if (onboardingStep === 'SELLER_EMAIL' || onboardingStep === 'SELLER_PHONE' || onboardingStep === 'SELLER_NOT_FOUND') {
      setOnboardingStep('SELECT_ROLE');
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `assistant-seller-link-${Date.now()}`, role: 'assistant', content: msgParceiroUseLink }]);
      }, 300);
    }
  };


  // ---------------------------------------------------------------------------------------
  // INDICAÇÃO PELA CONVERSA. Roteiro fixo, decidido aqui (nunca pela IA): equipamento, como
  // prefere (dados ou link para o cliente), dados do cliente, conferência e envio.
  // ---------------------------------------------------------------------------------------
  const CANCELAR_IND: OpcaoIndicar = { rotulo: 'Cancelar indicação', valor: 'cancelar' };
  const novoIdInd = () => `ind-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const falaInd = (content: string, passo: PassoIndicar = {}) =>
    setMessages(prev => [...prev, { id: novoIdInd(), role: 'assistant', content, indicar: passo }]);
  const usuarioInd = (content: string) =>
    setMessages(prev => [...prev, { id: novoIdInd(), role: 'user', content, indicar: {} }]);

  const nomeEquip = (prod: Product, model?: ProductModel | null): EquipIndicar =>
    model ? { nome: `${prod.name} - ${model.name}`, pid: prod.id, mid: model.id } : { nome: prod.name, pid: prod.id };
  const semAcentoInd = (t: string) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // "cabeçote" acha "Cabeçotes Multifuncionais"; "fresa" acha "Fresas FAE SSH". Só vale se for uma família só.
  const familiaNoTexto = (texto: string): Product | null => {
    const t = semAcentoInd(texto);
    const achados = catalogProducts.filter(p => {
      const primeira = semAcentoInd(p.name || '').split(/\s+/)[0] || '';
      const raiz = primeira.replace(/(oes|aes|es|s)$/, '');
      return raiz.length >= 4 && new RegExp(`\\b${raiz.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t);
    });
    return achados.length === 1 ? achados[0] : null;
  };
  const rotuloModelo = (m: ProductModel) => {
    const base = String((m as any).technical_specs?.maquina_base || '').trim();
    return base && base.length <= 22 ? `${m.name} (${base})` : m.name;
  };

  const perguntarModelo = (prod: Product, fluxo: FluxoIndicar) => {
    setFluxoInd({ ...fluxo, etapa: 'equip_modelo', familia: prod.id });
    falaInd(`Certo! Qual modelo de **${prod.name}**?`, {
      opcoes: [
        ...(prod.models || []).map(m => ({ rotulo: rotuloModelo(m), valor: `m:${prod.id}:${m.id}` })),
        { rotulo: 'Não sei, a Roder ajuda a escolher', valor: `nm:${prod.id}` },
        CANCELAR_IND,
      ],
    });
  };
  const perguntarListaEquip = (fluxo: FluxoIndicar, texto = 'Qual equipamento?') => {
    setFluxoInd({ ...fluxo, etapa: 'equip_lista' });
    falaInd(`${texto} Toque numa opção ou escreva o nome.`, {
      opcoes: [...catalogProducts.map(p => ({ rotulo: p.name, valor: `p:${p.id}` })), CANCELAR_IND],
    });
  };
  const perguntaDado: Record<'nome' | 'telefone' | 'cidade' | 'cnpj', [string, OpcaoIndicar[]]> = {
    nome: ['Qual o **nome do cliente** ou da fazenda?', [CANCELAR_IND]],
    telefone: ['**Telefone** (WhatsApp) do cliente, com DDD?', [CANCELAR_IND]],
    cidade: ['**Cidade** e estado do cliente? (ex.: Sorriso MT)', [CANCELAR_IND]],
    cnpj: ['**CNPJ** do cliente, se souber.', [{ rotulo: 'Pular', valor: 'pular' }, CANCELAR_IND]],
  };
  const perguntarDado = (etapa: 'nome' | 'telefone' | 'cidade' | 'cnpj', fluxo: FluxoIndicar, aviso = '') => {
    setFluxoInd({ ...fluxo, etapa });
    const [texto, opcoes] = perguntaDado[etapa];
    falaInd(aviso ? `${aviso}\n\n${texto}` : texto, { opcoes });
  };
  const mostrarResumo = (fluxo: FluxoIndicar) => {
    setFluxoInd({ ...fluxo, etapa: 'resumo', voltarResumo: true });
    falaInd('Tudo certo? Confira antes de enviar.', {
      resumo: {
        equipamento: fluxo.equip?.nome || '',
        cliente: fluxo.cliente || '',
        telefone: fluxo.telefone || '',
        cidade: fluxo.cidade || '',
        cnpj: fluxo.cnpj || '',
      },
    });
  };

  // Equipamento definido: segue para "como prefere" (ou volta ao resumo, ou já gera o link)
  const equipEscolhido = (equip: EquipIndicar, fluxo: FluxoIndicar) => {
    const f: FluxoIndicar = { ...fluxo, equip, candidato: undefined, familia: undefined };
    if (f.modo === 'link') { gerarLinkClienteInd(f); return; }
    if (f.voltarResumo) { mostrarResumo(f); return; }
    setFluxoInd({ ...f, etapa: 'modo' });
    falaInd('Ótimo. Como prefere?', {
      opcoes: [
        { rotulo: 'Eu passo os dados do cliente', valor: 'dados', destaque: true },
        { rotulo: 'Mandar um link para o cliente preencher', valor: 'link' },
        CANCELAR_IND,
      ],
    });
  };

  const iniciarIndicacao = (texto = '', direto?: { prod: Product; model: ProductModel }) => {
    setExplorerMinimized(true);
    setFolhaEquip(false);
    setFolhaPronta(false);
    setMenuCel(false);
    if (!podeIndicar) {
      falaInd(logado
        ? 'Para fazer uma indicação, use a tela **Nova indicação** do app Roder Indica.'
        : `As indicações são feitas por parceiros cadastrados, pelo link exclusivo de cada um.\n\nSe você quer um orçamento, me diga o equipamento ou fale com o comercial da Roder no WhatsApp: [${WHATS_COMERCIAL_TEXTO}](https://wa.me/${WHATS_COMERCIAL}).`);
      return;
    }
    const inicio: FluxoIndicar = { etapa: 'equip_lista' };
    // tocou "Indicar" num equipamento da pronta entrega: ele já está escolhido
    if (direto) { equipEscolhido(nomeEquip(direto.prod, direto.model), inicio); return; }
    // 1) equipamento citado no próprio pedido; 2) família citada; 3) o equipamento desta conversa
    const citado = texto ? detectEquipmentInMessage(texto)[0] : undefined;
    const familia = !citado && texto ? familiaNoTexto(texto) : null;
    const candidato = citado ? nomeEquip(citado.prod, citado.model)
      : !familia && equipAtual ? nomeEquip(equipAtual.prod, equipAtual.model) : null;
    if (candidato) {
      setFluxoInd({ ...inicio, etapa: 'equip_confirma', candidato });
      falaInd(`Vamos indicar. É o **${candidato.nome.replace(/^.* - /, '')}**?`, {
        opcoes: [{ rotulo: 'Sim', valor: 'sim', destaque: true }, { rotulo: 'Outro equipamento', valor: 'outro' }, CANCELAR_IND],
      });
      return;
    }
    if (familia && (familia.models || []).length > 1) { perguntarModelo(familia, inicio); return; }
    if (familia) { equipEscolhido(nomeEquip(familia, (familia.models || [])[0]), inicio); return; }
    perguntarListaEquip(inicio, 'Vamos indicar! Qual equipamento?');
  };

  const cancelarInd = () => {
    setFluxoInd(null);
    falaInd('Indicação cancelada. Pode continuar perguntando.');
  };

  const gerarLinkClienteInd = async (f: FluxoIndicar) => {
    if (!f.equip?.pid) {
      perguntarListaEquip({ ...f, modo: 'link' }, 'Para mandar o link, escolha o equipamento do catálogo.');
      return;
    }
    setFluxoInd({ ...f, etapa: 'enviando' });
    setLoading(true);
    try {
      const r = await fetch(`${getApiBaseUrl()}/api/consultor/link-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p: parceiroViaLink?.token || undefined, pid: f.equip.pid, mid: f.equip.mid || '' }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.codigo) throw new Error(j.error || 'Não consegui gerar o link.');
      const link = `${window.location.origin}/o/${j.codigo}`;
      const nome = f.equip.nome.replace(/^.* - /, '');
      setFluxoInd(null);
      falaInd(`Link do **${nome}** pronto para o cliente.`, { whats: textoLinkCliente(nome, link) });
      falaInd('Quando o cliente preencher, a indicação fica no seu nome.');
    } catch (e: any) {
      setFluxoInd({ ...f, etapa: 'modo' });
      falaInd(`${e?.message || 'Não consegui gerar o link.'} Quer tentar de novo?`, {
        opcoes: [{ rotulo: 'Mandar um link para o cliente preencher', valor: 'link', destaque: true }, { rotulo: 'Eu passo os dados do cliente', valor: 'dados' }, CANCELAR_IND],
      });
    } finally {
      setLoading(false);
    }
  };

  const enviarIndicacaoInd = async (f: FluxoIndicar) => {
    setFluxoInd({ ...f, etapa: 'enviando' });
    setLoading(true);
    try {
      const r = await fetch(`${getApiBaseUrl()}/api/consultor/indicacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p: parceiroViaLink?.token || undefined,
          equipamento: f.equip,
          cliente: f.cliente,
          telefone: f.telefone,
          cidade: f.cidade,
          cnpj: f.cnpj || '',
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || 'Não consegui enviar a indicação.');
      setFluxoInd(null);
      falaInd(`A equipe Roder vai entrar em contato com ${f.cliente}. Ela fica no seu nome.`, { ok: true });
      falaInd('Quer indicar outro equipamento ou tirar alguma dúvida?', {
        opcoes: [{ rotulo: 'Indicar outro', valor: 'nova' }],
      });
    } catch (e: any) {
      setFluxoInd({ ...f, etapa: 'resumo' });
      falaInd(`${e?.message || 'Não consegui enviar a indicação.'}`, {
        opcoes: [{ rotulo: 'Tentar de novo', valor: 'enviar', destaque: true }, { rotulo: 'Corrigir', valor: 'corrigir' }, CANCELAR_IND],
      });
    } finally {
      setLoading(false);
    }
  };

  // Uma resposta (opção tocada ou texto digitado) para o passo atual
  const responderInd = (texto: string, valor?: string) => {
    const f = fluxoInd;
    if (!f) {
      if (valor === 'nova') iniciarIndicacao();
      return;
    }
    const t = texto.trim();
    if (valor === 'cancelar' || (!valor && /^(cancelar|cancela|parar|sair)( indica[cç][aã]o)?\.?$/i.test(t))) { cancelarInd(); return; }
    if (f.etapa === 'enviando') return;

    switch (f.etapa) {
      case 'equip_confirma': {
        if (valor === 'sim' || (!valor && /^(sim|s|isso|é|e esse|esse mesmo|correto)\b/i.test(t))) { equipEscolhido(f.candidato!, f); return; }
        if (valor === 'outro' || (!valor && /^(n[aã]o|outro)/i.test(t))) { perguntarListaEquip(f); return; }
        // escreveu outro equipamento direto
        const achado = detectEquipmentInMessage(t)[0];
        if (achado) { equipEscolhido(nomeEquip(achado.prod, achado.model), f); return; }
        perguntarListaEquip(f);
        return;
      }
      case 'equip_lista': {
        if (valor?.startsWith('p:')) {
          const prod = catalogProducts.find(p => p.id === valor.slice(2));
          if (!prod) { perguntarListaEquip(f); return; }
          const modelos = prod.models || [];
          if (modelos.length > 1) perguntarModelo(prod, f);
          else equipEscolhido(nomeEquip(prod, modelos[0]), f);
          return;
        }
        const achado = detectEquipmentInMessage(t)[0];
        if (achado) { equipEscolhido(nomeEquip(achado.prod, achado.model), f); return; }
        const fam = familiaNoTexto(t) || catalogProducts.find(p => semAcentoInd(p.name) === semAcentoInd(t)) || null;
        if (fam && (fam.models || []).length > 1) { perguntarModelo(fam, f); return; }
        if (fam) { equipEscolhido(nomeEquip(fam, (fam.models || [])[0]), f); return; }
        if (t.length >= 2 && f.modo !== 'link') { equipEscolhido({ nome: t.slice(0, 120) }, f); return; }
        perguntarListaEquip(f);
        return;
      }
      case 'equip_modelo': {
        const prod = catalogProducts.find(p => p.id === f.familia);
        if (valor?.startsWith('m:') && prod) {
          const mid = valor.split(':')[2];
          const m = (prod.models || []).find(x => x.id === mid);
          if (m) { equipEscolhido(nomeEquip(prod, m), f); return; }
        }
        if ((valor?.startsWith('nm:') || (!valor && /n[aã]o sei/i.test(t))) && prod) { equipEscolhido(nomeEquip(prod), f); return; }
        const achado = detectEquipmentInMessage(t)[0];
        if (achado) { equipEscolhido(nomeEquip(achado.prod, achado.model), f); return; }
        if (prod) { perguntarModelo(prod, f); return; }
        perguntarListaEquip(f);
        return;
      }
      case 'modo': {
        const modo = valor === 'link' || (!valor && /link/i.test(t)) ? 'link'
          : valor === 'dados' || (!valor && /dados|eu passo/i.test(t)) ? 'dados' : null;
        if (modo === 'link') { gerarLinkClienteInd({ ...f, modo: 'link' }); return; }
        if (modo === 'dados') { perguntarDado('nome', { ...f, modo: 'dados' }); return; }
        equipEscolhido(f.equip!, f);
        return;
      }
      case 'nome': {
        if (t.length < 2) { perguntarDado('nome', f, 'Preciso do nome do cliente ou da fazenda.'); return; }
        const g = { ...f, cliente: t.slice(0, 120) };
        if (f.voltarResumo) mostrarResumo(g); else perguntarDado('telefone', g);
        return;
      }
      case 'telefone': {
        const tel = validarTelefoneBR(t);
        if (!tel.ok) { perguntarDado('telefone', f, 'Esse telefone não parece válido. Escreva com DDD, ex.: (66) 99999-1234.'); return; }
        const g = { ...f, telefone: tel.formatado };
        if (f.voltarResumo) mostrarResumo(g); else perguntarDado('cidade', g);
        return;
      }
      case 'cidade': {
        const local = lerCidadeUf(t);
        if (!local) { perguntarDado('cidade', f, 'Não entendi o estado. Escreva a cidade e a sigla do estado.'); return; }
        const g = { ...f, cidade: `${local.cidade}, ${local.uf}` };
        if (f.voltarResumo) mostrarResumo(g); else perguntarDado('cnpj', g);
        return;
      }
      case 'cnpj': {
        if (valor === 'pular' || (!valor && /^(pular|pula|n[aã]o sei|n[aã]o tenho|sem cnpj|n[aã]o)\b/i.test(t))) { mostrarResumo({ ...f, cnpj: '' }); return; }
        const c = validarCnpj(t);
        if (!c.ok) { perguntarDado('cnpj', f, 'Esse CNPJ não confere. Confira os números ou toque em Pular.'); return; }
        mostrarResumo({ ...f, cnpj: c.formatado });
        return;
      }
      case 'resumo': {
        if (valor === 'enviar' || (!valor && /^(enviar|envia|sim|ok|pode enviar)\b/i.test(t))) { enviarIndicacaoInd(f); return; }
        if (valor === 'corrigir' || (!valor && /corrig/i.test(t))) {
          setFluxoInd({ ...f, etapa: 'corrigir' });
          falaInd('O que você quer corrigir?', {
            opcoes: [
              { rotulo: 'Equipamento', valor: 'c:equip' }, { rotulo: 'Cliente', valor: 'c:nome' },
              { rotulo: 'Telefone', valor: 'c:telefone' }, { rotulo: 'Cidade', valor: 'c:cidade' },
              { rotulo: 'CNPJ', valor: 'c:cnpj' }, CANCELAR_IND,
            ],
          });
          return;
        }
        mostrarResumo(f);
        return;
      }
      case 'corrigir': {
        const alvo = valor?.slice(2) || (/equip/i.test(t) ? 'equip' : /tel/i.test(t) ? 'telefone' : /cidade|estado/i.test(t) ? 'cidade' : /cnpj/i.test(t) ? 'cnpj' : /cliente|nome|fazenda/i.test(t) ? 'nome' : '');
        if (alvo === 'equip') { perguntarListaEquip(f); return; }
        if (alvo === 'nome' || alvo === 'telefone' || alvo === 'cidade' || alvo === 'cnpj') { perguntarDado(alvo, f); return; }
        mostrarResumo(f);
        return;
      }
    }
  };

  // Toque numa opção: aparece como resposta do usuário e segue o roteiro
  const escolherOpcaoInd = (op: OpcaoIndicar) => {
    if (loading) return;
    usuarioInd(op.rotulo);
    responderInd(op.rotulo, op.valor);
  };
  const tocarIndicar = () => {
    if (loading) return;
    if (fluxoInd) { falaInd('Já estamos fazendo uma indicação. Responda a pergunta acima ou cancele.', { opcoes: [CANCELAR_IND] }); return; }
    usuarioInd('Quero fazer uma indicação');
    iniciarIndicacao();
  };
  // Pronta entrega: "Indicar" já leva o equipamento; "Perguntar" manda a pergunta pronta
  const indicarProntaEntrega = (it: ItemProntaEntrega) => {
    if (loading) return;
    setFolhaPronta(false);
    if (fluxoInd) { falaInd('Já estamos fazendo uma indicação. Responda a pergunta acima ou cancele.', { opcoes: [CANCELAR_IND] }); return; }
    usuarioInd(`Quero indicar ${it.nome}`);
    iniciarIndicacao('', { prod: it.produto, model: it.modelo });
  };
  // Vídeo do carrossel: "Perguntar" fala do equipamento do vídeo; "Indicar" já leva o equipamento
  const perguntarVideo = (v: VideoConsultor) => {
    if (loading) return;
    if (fluxoInd) { falaInd('Já estamos fazendo uma indicação. Responda a pergunta acima ou cancele.', { opcoes: [CANCELAR_IND] }); return; }
    handleSend(`Me fale sobre ${nomeDoVideo(v)}`);
  };
  const indicarVideo = (v: VideoConsultor) => {
    if (loading) return;
    if (fluxoInd) { falaInd('Já estamos fazendo uma indicação. Responda a pergunta acima ou cancele.', { opcoes: [CANCELAR_IND] }); return; }
    const { prod, model } = equipDoVideo(v);
    usuarioInd(`Quero indicar ${nomeDoVideo(v)}`);
    if (prod && model) iniciarIndicacao('', { prod, model });
    else iniciarIndicacao(`Quero indicar ${nomeDoVideo(v)}`);
  };
  // Pergunta pronta (atalho, sugestão, opção, calculadora): com a indicação aberta ela viraria a
  // resposta do passo atual (o nome do cliente virava "Me fale sobre..."), então avisa e não manda
  const avisarIndAberta = () => falaInd('Já estamos fazendo uma indicação. Responda a pergunta acima ou cancele.', { opcoes: [CANCELAR_IND] });
  const enviarPronto = (texto: string) => {
    if (fluxoInd) { avisarIndAberta(); return; }
    handleSend(texto);
  };
  const perguntarProntaEntrega = (it: ItemProntaEntrega) => {
    if (loading) return;
    setFolhaPronta(false);
    if (fluxoInd) { avisarIndAberta(); return; }
    handleSend(`Me fale sobre ${it.nome} à pronta entrega`);
  };
  // Indicar um equipamento pela conversa (equipe que indica, no cartão compacto)
  const indicarEquipamento = (prod: Product, model: ProductModel) => {
    if (loading) return;
    if (fluxoInd) { avisarIndAberta(); return; }
    usuarioInd(`Quero indicar ${model.name || prod.name}`);
    iniciarIndicacao('', { prod, model });
  };

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || inputValue).trim();
    if (!queryText) return;

    if (!textToSend) {
      setInputValue('');
    }

    // Auto minimize compatibility explorer when typing/submitting text
    setExplorerMinimized(true);

    if (onboardingStep !== 'COMPLETED') {
      await handleOnboardingInput(queryText);
      return;
    }

    // Indicação pela conversa: com o roteiro aberto, o texto responde o passo atual
    if (fluxoInd) {
      usuarioInd(queryText);
      responderInd(queryText);
      return;
    }
    if (querIndicar(queryText)) {
      usuarioInd(queryText);
      iniciarIndicacao(queryText);
      return;
    }

    // Spy Protection / Usage Limits check
    // equipe Roder que entrou pelo link /consultor-equipe (e-mail conferido no servidor) não tem limite
    const equipePeloLink = publicUser?.userType === 'vendedor' && (publicUser as any)?.equipe === true;
    const isVisitor = !equipePeloLink && !parceiroViaLink && (!logado || !profile?.role || (profile.role as string) === 'client' || (profile.role as string) === 'visitor');
    if (isVisitor) {
      const textUpper = queryText.toUpperCase();
      const categoriesMatched: string[] = [];
      if (textUpper.includes('CMF') || textUpper.includes('CABECOTE') || textUpper.includes('HARVESTER') || textUpper.includes('CABEÇOTE')) {
        categoriesMatched.push('CABECOTE_CMF');
      }
      if (textUpper.includes('MSR') || textUpper.includes('SKIDDER') || textUpper.includes('ARRASTE')) {
        categoriesMatched.push('MINI_SKIDDER');
      }
      if (textUpper.includes('GT') || textUpper.includes('TRACADORA') || textUpper.includes('TRAÇADORA')) {
        categoriesMatched.push('GARRA_TRACADORA');
      }
      if (textUpper.includes('R250') || textUpper.includes('R280') || textUpper.includes('R360') || textUpper.includes('R400') || textUpper.includes('R600') || textUpper.includes('R800') || textUpper.includes('R1000') || textUpper.includes('R1200') || textUpper.includes('R1400') || (textUpper.includes('GARRA') && !textUpper.includes('TRACADORA') && !textUpper.includes('TRAÇADORA'))) {
        categoriesMatched.push('GARRA_FLORESTAL');
      }
      if (textUpper.includes('CACAMBA') || textUpper.includes('CAÇAMBA') || textUpper.includes('HIGH') || textUpper.includes('TIP')) {
        categoriesMatched.push('CACAMBA_HIGH_TIP');
      }
      if (textUpper.includes('FRESA') || textUpper.includes('TRITURAD') || textUpper.includes('SSH') || textUpper.includes('FAE')) {
        categoriesMatched.push('FRESA_TRITURADORA');
      }
      if (textUpper.includes('SOPRAD') || textUpper.includes('SOPRO')) {
        categoriesMatched.push('SOPRADOR');
      }
      if (textUpper.includes('ENGATE') || textUpper.includes('ACOPLAM')) {
        categoriesMatched.push('ENGATE_RAPIDO');
      }

      const uniqueTopics = Array.from(new Set([...askedTopics, ...categoriesMatched]));
      if (uniqueTopics.length > 5) {
        setMessages(prev => [
          ...prev,
          {
            id: `spy-protect-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ **Limite de Assuntos Excedido (Proteção de Engenharia)**\n\nOlá! Notamos que as suas consultas abrangem mais de 5 linhas de produtos ou especialidades diferentes da RODER.\n\nPara proteger nossas especificações técnicas e garantir um atendimento seguro, as consultas adicionais estão temporariamente limitadas nesta sessão.\n\nPor favor, **preencha o formulário de identificação/orçamento** para que nossa equipe comercial e o vendedor responsável possam te atender diretamente com todos os detalhes técnicos e preços oficiais! Obrigado pela compreensão.`
          }
        ]);
        setIsBudgetFormOpen(true);
        toast.error('Limite de assuntos excedido (máximo 5). Identifique-se para continuar.');
        return;
      } else if (categoriesMatched.length > 0) {
        setAskedTopics(uniqueTopics);
        localStorage.setItem('roder_consultant_asked_topics', JSON.stringify(uniqueTopics));
      }
    }

    // Add user message
    const userMsgId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const updatedMessages = [...messages, { id: userMsgId, role: 'user', content: queryText } as Message];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Ask backend Gemini
      const response = await askEngineerHelper(
        queryText,
        updatedMessages.slice(1, -1).filter(m => !m.indicar).map(({ role, content }) => ({ role, content })),
        {
          uid: logado ? user?.uid : undefined,
          name: (profile?.name || parceiroViaLink?.nome || publicUser?.name || user?.displayName || user?.email || 'Anônimo').replace('Jefferson', 'Jeferson'),
          email: profile?.email || publicUser?.email || user?.email || '',
          role: profile?.role || (parceiroViaLink ? 'external_seller' : publicUser?.userType) || 'visitor',
          // equipe Roder: resposta técnica (veredito primeiro, kit, ponteira/biela, suporte, códigos)
          equipe: ehEquipeConsultor,
          baseMachine: publicUser?.baseMachine || '',
          referredBy: localStorage.getItem('roder_consultant_ref') || ''
        }
      );
      const assistantMsgId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      // o bloco <painel> sai do texto aqui: a conversa guardada e o histórico mandado ao servidor ficam limpos
      const { texto, painel } = separarPainel(String(response || ''));
      setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: texto, ...(painel ? { painel } : {}) }]);
    } catch (err: any) {
      console.error('Error in Engineer Helper:', err);
      const errMsgId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      let errorMsgDetail = err.message || 'Por favor, tente novamente.';
      const isIframe = typeof window !== 'undefined' && window.self !== window.top;
      const isAIStudioPreview = typeof window !== 'undefined' && (
        window.location.hostname.endsWith('run.app') ||
        window.location.hostname.includes('aistudio') ||
        window.location.hostname.includes('preview') ||
        window.location.hostname.includes('google')
      );
      if (isIframe && isAIStudioPreview) {
        errorMsgDetail += '\n\n💡 **Nota do AI Studio:** O seu navegador pode estar bloqueando cookies de terceiros para este visualizador embutido. Para resolver isso e utilizar o assistente de IA, por favor **clique no botão "Abrir em Nova Aba"** abaixo ou no topo direito do visualizador!';
      }

      setMessages(prev => [
        ...prev,
        {
          id: errMsgId,
          role: 'assistant',
          content: `⚠️ **Ops, ocorreu um erro ao conectar com o consultor técnico:** ${errorMsgDetail}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (errorMsgIndex: number) => {
    // Encontra a mensagem do usuário anterior ao erro
    let userMsgIdx = -1;
    for (let i = errorMsgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMsgIdx = i;
        break;
      }
    }

    if (userMsgIdx === -1) {
      toast.error("Não foi possível identificar a pergunta para retransmitir.");
      return;
    }

    const queryText = messages[userMsgIdx].content;
    
    // O histórico é composto por todas as mensagens anteriores à pergunta do usuário (pulando o primeiro item se for saudação)
    const history = messages.slice(1, userMsgIdx).filter(m => !m.indicar).map(({ role, content }) => ({ role, content }));

    // Remove a mensagem de erro e as mensagens seguintes do chat para manter a interface limpa
    const cleanedMessages = messages.slice(0, errorMsgIndex);
    setMessages(cleanedMessages);
    setLoading(true);
    setExplorerMinimized(true);

    try {
      const response = await askEngineerHelper(
        queryText,
        history,
        {
          uid: logado ? user?.uid : undefined,
          name: (profile?.name || parceiroViaLink?.nome || publicUser?.name || user?.displayName || user?.email || 'Anônimo').replace('Jefferson', 'Jeferson'),
          email: profile?.email || publicUser?.email || user?.email || '',
          role: profile?.role || (parceiroViaLink ? 'external_seller' : publicUser?.userType) || 'visitor',
          // equipe Roder: resposta técnica (veredito primeiro, kit, ponteira/biela, suporte, códigos)
          equipe: ehEquipeConsultor,
          baseMachine: publicUser?.baseMachine || '',
          referredBy: localStorage.getItem('roder_consultant_ref') || ''
        }
      );
      const assistantMsgId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      // o bloco <painel> sai do texto aqui: a conversa guardada e o histórico mandado ao servidor ficam limpos
      const { texto, painel } = separarPainel(String(response || ''));
      setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: texto, ...(painel ? { painel } : {}) }]);
    } catch (err: any) {
      console.error('Error in Engineer Helper Retry:', err);
      const errMsgId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      let errorMsgDetail = err.message || 'Por favor, tente novamente.';
      const isIframe = typeof window !== 'undefined' && window.self !== window.top;
      const isAIStudioPreview = typeof window !== 'undefined' && (
        window.location.hostname.endsWith('run.app') ||
        window.location.hostname.includes('aistudio') ||
        window.location.hostname.includes('preview') ||
        window.location.hostname.includes('google')
      );
      if (isIframe && isAIStudioPreview) {
        errorMsgDetail += '\n\n💡 **Nota do AI Studio:** O seu navegador pode estar bloqueando cookies de terceiros para este visualizador embutido. Para resolver isso e utilizar o assistente de IA, por favor **clique no botão "Abrir em Nova Aba"** abaixo ou no topo direito do visualizador!';
      }

      setMessages(prev => [
        ...prev,
        {
          id: errMsgId,
          role: 'assistant',
          content: `⚠️ **Ops, ocorreu um erro ao conectar com o consultor técnico:** ${errorMsgDetail}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setExplorerMinimized(true);
    recordingStartTimeRef.current = Date.now();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Seu navegador não suporta gravação de áudio ou a conexão não é segura (HTTPS).');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const types = [
        'audio/webm;codecs=opus', 
        'audio/webm', 
        'audio/mp4', 
        'audio/mpeg', 
        'audio/ogg;codecs=opus', 
        'audio/ogg', 
        'audio/wav', 
        'audio/aac'
      ];
      let mimeType = '';
      
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const typeToUse = mimeType || '';
      setRecordedMimeType(typeToUse);

      const options: MediaRecorderOptions = {
        ...(typeToUse ? { mimeType: typeToUse } : {}),
        audioBitsPerSecond: 16000 // Compressed 16kbps for tiny, fast network transfers
      };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const duration = Date.now() - recordingStartTimeRef.current;
        if (audioChunksRef.current.length === 0 || duration < 1200) {
          setTranscribing(false);
          setMessages(prev => [
            ...prev,
            {
              id: `silence-${Date.now()}`,
              role: 'assistant',
              content: "Não foi possível transcrever o áudio."
            }
          ]);
          toast.error("Não foi possível transcrever o áudio.");

          // Think for a moment, then write the follow-up text without problems
          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              {
                id: `silence-followup-${Date.now()}`,
                role: 'assistant',
                content: "Não se preocupe, isso pode acontecer! Sinta-se à vontade para digitar a sua mensagem ou pergunta no campo abaixo, e eu lhe ajudarei sem problemas."
              }
            ]);
          }, 1500);
          return;
        }

        const finalType = typeToUse || audioChunksRef.current[0].type || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        setTranscribing(true);
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const resultStr = reader.result?.toString() || '';
          const base64data = resultStr.split(',')[1];
          
          if (base64data) {
            try {
              toast.loading('Processando seu áudio...', { id: 'voice-transcribe' });
              const transcription = await transcribeAudio(base64data, finalType, 'chat');
              toast.dismiss('voice-transcribe');
              
              if (
                transcription && 
                !transcription.startsWith("Erro na transcrição") && 
                transcription.trim() !== "" && 
                transcription !== "Não foi possível transcrever o áudio." &&
                !transcription.toLowerCase().includes("erro na transcrição")
              ) {
                toast.success('Áudio transcrito com sucesso!');
                // Automatically send transcribed text to the assistant
                handleSend(transcription);
              } else {
                setMessages(prev => [
                  ...prev,
                  {
                    id: `silence-${Date.now()}`,
                    role: 'assistant',
                    content: "Não foi possível transcrever o áudio."
                  }
                ]);
                toast.error('Não foi possível transcrever o áudio.');

                // Think for a moment, then write the follow-up text without problems
                setTimeout(() => {
                  setMessages(prev => [
                    ...prev,
                    {
                      id: `silence-failed-followup-${Date.now()}`,
                      role: 'assistant',
                      content: "Não se preocupe, isso pode acontecer! Sinta-se à vontade para digitar a sua mensagem ou pergunta no campo abaixo, e eu lhe ajudarei sem problemas."
                    }
                  ]);
                }, 1500);
              }
            } catch (error: any) {
              toast.dismiss('voice-transcribe');
              console.error("Transcription error:", error);
              setMessages(prev => [
                ...prev,
                {
                  id: `silence-${Date.now()}`,
                  role: 'assistant',
                  content: "Não foi possível transcrever o áudio."
                }
              ]);
              toast.error('Não foi possível transcrever o áudio.');

              // Think for a moment, then write the follow-up text without problems
              setTimeout(() => {
                setMessages(prev => [
                  ...prev,
                  {
                    id: `silence-err-followup-${Date.now()}`,
                    role: 'assistant',
                    content: "Não se preocupe, isso pode acontecer! Sinta-se à vontade para digitar a sua mensagem ou pergunta no campo abaixo, e eu lhe ajudarei sem problemas."
                  }
                ]);
              }, 1500);
            }
          }
          setTranscribing(false);
        };
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      toast.success('Gravando áudio...');
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      toast.error('Permissão de microfone negada ou erro ao iniciar áudio.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const runCalculation = () => {
    const area = parseFloat(grappleArea);
    const length = parseFloat(woodLength);
    const cycle = parseFloat(cycleTime);

    if (isNaN(area) || isNaN(length) || isNaN(cycle) || cycle <= 0) {
      return;
    }

    // Roder rule of thumb: 1m³ of wood = 800kg
    // weight per cycle = Area (m²) * Length (m) * 800 kg/m³
    const weightPerCycle = area * length * 800;
    const cyclesPerHour = 3600 / cycle;
    const hourlyProductivity = (cyclesPerHour * weightPerCycle) / 1000; // in tons

    setCalcResult({
      weightPerCycle,
      cyclesPerHour,
      hourlyProductivity
    });
  };

  const applyCalcToChat = () => {
    if (!calcResult) return;
    const calcText = `Gostaria de analisar este cenário de produtividade:
- Área da Garra: **${grappleArea} m²**
- Comprimento da Madeira: **${woodLength} m**
- Tempo de Ciclo: **${cycleTime} s**

O cálculo simplificado indica:
- Carga por ciclo: **${calcResult.weightPerCycle.toFixed(0)} kg** (${(calcResult.weightPerCycle / 1000).toFixed(2)} t)
- Ciclos por hora: **${calcResult.cyclesPerHour.toFixed(0)} ciclos**
- Produtividade horária estimada: **${calcResult.hourlyProductivity.toFixed(2)} t/h**

Você poderia detalhar se esta produtividade é ideal e qual modelo Roder/FAE se adequa a esse ciclo?`;
    
    setCalcOpen(false);
    enviarPronto(calcText);
  };

  // Helper to extract distinct weight bands from product models
  const getWeightBands = (prod: Product) => {
    if (!prod.models) return [];
    const bands = new Set<string>();
    prod.models.forEach(m => {
      const mb = faixaDoModelo(m);
      if (mb) bands.add(mb);
    });
    return Array.from(bands);
  };

  // Helper to filter models compatible with a selected band
  const getCompatibleModels = (prod: Product, band: string) => {
    if (!prod.models) return [];
    return prod.models.filter(m => {
      const mb = faixaDoModelo(m);
      return mb && mb.toLowerCase() === band.toLowerCase();
    });
  };

  // Helper to check if model has physical stock available
  const checkModelStock = (model: ProductModel) => {
    const cleanModelName = (model.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const inStock = stockItems.some(item => {
      if (item.quantity <= 0) return false;
      const cleanStockDesc = (item.description || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanStockDesc.includes(cleanModelName) || cleanModelName.includes(cleanStockDesc);
    });
    return inStock;
  };

  // Handle equipment redirection
  // "Link para o cliente": gera o link público /o/código do modelo e abre o WhatsApp só com o texto
  // (sem número: o parceiro escolhe o contato). O celular só deixa abrir janela DENTRO do toque,
  // então ela abre em branco na hora e recebe o endereço quando o link chega do servidor.
  const [gerandoLinkCliente, setGerandoLinkCliente] = useState<string | null>(null);
  const linksClienteRef = React.useRef<Map<string, string>>(new Map());
  const mandarAoClienteWhats = async (prod: Product, model: ProductModel) => {
    if (gerandoLinkCliente) return;
    const chave = `${parceiroViaLink?.token || user?.uid || 'x'}:${prod.id}:${model.id}`;
    const abrir = (link: string, janela: Window | null) => {
      const url = linkWhatsSemNumero(textoEquipamentoCliente(prod, model, link));
      if (janela && !janela.closed) {
        try { janela.location.href = url; return; } catch { try { janela.close(); } catch { /* nada */ } }
      }
      toast('Toque para abrir o WhatsApp', { duration: 15000, action: { label: 'Abrir WhatsApp', onClick: () => { window.open(url, '_blank', 'noopener'); } } });
    };
    const guardado = linksClienteRef.current.get(chave);
    if (guardado) { abrir(guardado, window.open('', '_blank')); return; }
    let janela: Window | null = null;
    try { janela = window.open('', '_blank'); } catch { janela = null; }
    try { if (janela) janela.opener = null; } catch { /* nada */ }
    setGerandoLinkCliente(model.id);
    try {
      const r = await fetch(`${getApiBaseUrl()}/api/consultor/link-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p: parceiroViaLink?.token || undefined, pid: prod.id, mid: model.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.codigo) throw new Error(j.error || 'Não consegui gerar o link.');
      const link = `${window.location.origin}/o/${j.codigo}`;
      linksClienteRef.current.set(chave, link);
      abrir(link, janela);
    } catch (e: any) {
      try { janela?.close(); } catch { /* nada */ }
      toast.error(e?.message || 'Não consegui gerar o link. Tente de novo.');
    } finally {
      setGerandoLinkCliente(null);
    }
  };

  const handleMakeIndication = (prod: Product, model: ProductModel) => {
    const productFullName = `${prod.name} - ${model.name}`;
    // parceiro do link pessoal: indica pela própria conversa, já com este equipamento
    if (parceiroViaLink) {
      if (loading) return;
      setExplorerMinimized(true);
      setFolhaEquip(false);
      usuarioInd(`Indicar ${model.name}`);
      equipEscolhido(nomeEquip(prod, model), { etapa: 'equip_lista' });
      return;
    }
    const isVisitor = !logado || !profile?.role || (profile.role as string) === 'client' || (profile.role as string) === 'visitor';
    if (isVisitor) {
      setBudgetEquipName(productFullName);
      setIsBudgetFormOpen(true);
    } else {
      setIsOpen(false);
      navigate('/indicacoes/nova', { state: { product_name: productFullName } });
    }
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetContactName || !budgetPhone) {
      toast.error('Por favor, preencha o Nome e o WhatsApp/Telefone.');
      return;
    }

    setBudgetSubmitLoading(true);
    try {
      const sellerRef = localStorage.getItem('roder_consultant_ref') || '';
      
      let partnerEmail = '';
      let partnerNameFound = sellerRef;

      if (sellerRef) {
        try {
          // Search by email first in registered users
          let q = query(collection(db, 'users'), where('email', '==', sellerRef));
          let snap = await getDocs(q);
          if (snap.empty) {
            // Search by name
            q = query(collection(db, 'users'), where('name', '==', sellerRef));
            snap = await getDocs(q);
          }
          if (!snap.empty) {
            const userData = snap.docs[0].data();
            partnerEmail = userData.email || '';
            partnerNameFound = userData.name || sellerRef;
          }
        } catch (err) {
          console.warn('Error querying user for referral email:', err);
        }
      }

      // Save user profile locally so the user is remembered permanently
      localStorage.setItem('roder_budget_contact_name', budgetContactName);
      localStorage.setItem('roder_budget_company_name', budgetCompanyName);
      localStorage.setItem('roder_budget_phone', budgetPhone);
      localStorage.setItem('roder_budget_cnpj', budgetCNPJ);
      localStorage.setItem('roder_budget_machine_brand', budgetMachineBrand);
      localStorage.setItem('roder_budget_machine_model', budgetMachineModel);
      localStorage.setItem('roder_budget_location', budgetLocation);

      // Also ensure publicUser state/localStorage profile matches this data
      const updatedProfile = {
        userType: 'cliente' as const,
        name: budgetContactName,
        phone: budgetPhone,
        cityState: budgetLocation,
        baseMachine: `${budgetMachineBrand} ${budgetMachineModel}`.trim(),
        companyName: budgetCompanyName
      };
      localStorage.setItem('roder_public_user_profile', JSON.stringify(updatedProfile));
      setPublicUser(updatedProfile);

      const finalObservations = `Solicitação via Consultor Técnico Digital. Equipamento de interesse: ${budgetEquipName || 'Não especificado'}.${budgetObservations ? `\n\nObservações Adicionais:\n${budgetObservations}` : ''}`;

      const docData = {
        client_name: budgetContactName,
        client_cnpj: budgetCNPJ || 'Não informado',
        client_phone: budgetPhone,
        client_email: 'contato@roderindica.com.br',
        company_name: budgetCompanyName || budgetContactName,
        client_location: budgetLocation || 'Não informado',
        base_machine: `${budgetMachineBrand} ${budgetMachineModel}`.trim() || 'Não informado',
        observations: finalObservations,
        product_name: budgetEquipName || 'Equipamento Roder',
        status: 'new',
        indicator_id: sellerRef || 'consultor-direto',
        creator_type: 'visitor',
        // Lead tracking fields for sales reporting
        lead_source: sellerRef ? 'consultor_compartilhado' : 'consultor_direto',
        shared_by_seller_email: partnerEmail || '',
        shared_by_seller_name: partnerNameFound || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'indications'), docData);

      try {
        const { notifyNewIndication } = await import('../../services/emailService');
        await notifyNewIndication({
          client_name: budgetContactName,
          client_phone: budgetPhone,
          company_name: budgetCompanyName || budgetContactName,
          city: budgetLocation || '',
          state: '',
          product_name: budgetEquipName || 'Equipamento Roder',
          lead_source: sellerRef ? 'consultor_compartilhado' : 'consultor_direto',
          shared_by_seller_name: partnerNameFound || sellerRef || 'Nenhum (Direto)',
          shared_by_seller_email: partnerEmail || ''
        }, sellerRef ? `Consultor Compartilhado por ${partnerNameFound || sellerRef}` : 'Consultor Direto (Cliente)', partnerEmail || undefined);
      } catch (err) {
        console.warn('Error sending notification email:', err);
      }

      toast.success('Solicitação de Orçamento enviada com sucesso! Nossos consultores entrarão em contato em breve.');
      
      // Do NOT clear user data fields (to keep user remembered permanently). 
      // Only reset observations.
      setBudgetObservations('');
      setIsBudgetFormOpen(false);

      setMessages(prev => [
        ...prev,
        {
          id: `budget-success-${Date.now()}`,
          role: 'assistant',
          content: `✅ **Obrigado! Sua solicitação de orçamento foi enviada para o nosso setor comercial.**\n\nNossa equipe de vendas internas da fábrica já recebeu os dados do contato **${budgetContactName}** para o equipamento **${budgetEquipName || 'Roder'}** e elaborará a proposta e o orçamento oficial direto da fábrica em breve via WhatsApp (**${budgetPhone}**).\n\nSe tiver mais alguma dúvida ou quiser simular outro produto, sinta-se à vontade para continuar!`
        }
      ]);
    } catch (error: any) {
      console.error('Error submitting public budget:', error);
      toast.error('Erro ao enviar solicitação de orçamento: ' + error.message);
    } finally {
      setBudgetSubmitLoading(false);
    }
  };

  // Parse assistant text to find matched catalog products & models
  const detectEquipmentInMessage = (content: string) => {
    const detected: { prod: Product; model: ProductModel; pos?: number }[] = [];
    if (!content || !catalogProducts || catalogProducts.length === 0) return detected;
    
    // To prevent duplicate detections of the same model in a single message
    const matchedModelIds = new Set<string>();

    catalogProducts.forEach(prod => {
      if (prod.models && Array.isArray(prod.models)) {
        prod.models.forEach(model => {
          if (!model.name) return;
          
          // Use word boundary regex to avoid partial matches
          const escapedName = model.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedName}\\b`, 'i');
          
          const found = content.search(regex);
          if (found >= 0 && !matchedModelIds.has(model.id)) {
            matchedModelIds.add(model.id);
            detected.push({ prod, model, pos: found });
          }
        });
      }
    });

    // Filtering logic to respect user intent:
    // If the message is specifically about Cabeçote/Caçamba Multifuncional (CMF),
    // and CMF 600 is matched, we only show CMF 600 to prevent user confusion.
    // Mostra só os equipamentos citados primeiro (o recomendado), no máximo 2, para não aparecer foto de equipamento errado
    detected.sort((x, y) => (x.pos ?? 0) - (y.pos ?? 0));
    const hasCmf600 = detected.some(item => (item.model.name || '').toUpperCase().includes('CMF 600'));
    if (hasCmf600) {
      return detected.filter(item => {
        const nameUpper = (item.model.name || '').toUpperCase();
        if (nameUpper.includes('CMF') && !nameUpper.includes('CMF 600')) {
          return false;
        }
        return true;
      }).slice(0, 2);
    }

    return detected.slice(0, 2);
  };

  // pergunta pronta vinda de outra tela: manda assim que o consultor abre
  // handleSend pela referência da última renderização (sem conversa velha por cima da nova)
  const handleSendRef = useRef(enviarPronto);
  handleSendRef.current = enviarPronto;
  useEffect(() => {
    if (!isOpen || !perguntaPendente || loading) return;
    const p = perguntaPendente.texto;
    setPerguntaPendente(null);
    const t = setTimeout(() => handleSendRef.current(p), 300);
    return () => clearTimeout(t);
  }, [isOpen, perguntaPendente, loading]);

  // Escolher um equipamento no Explorador de Compatibilidade (celular e coluna da esquerda no computador)
  const escolherProdutoExplorador = (prod: Product) => {
    setSelectedProduct(prod);
    setSelectedWeightBand(null);
    setSelectedModel(null);
    if (prod.name.toLowerCase().includes('caçamba')) {
      setCacambaStep('material');
    } else {
      setCacambaStep(null);
    }
  };

  const isCatalog = location.pathname === '/catalogo';
  const hasRightDock = isCatalog && isOpen;

  // Partes da tela do consultor: as mesmas no celular e no computador (layout de 3 colunas)
  const blocoCalculadora = (<>
                {/* Quick Timber Grab Calculator Panel overlay */}
            <AnimatePresence>
              {calcOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-slate-950 border-b border-slate-800 space-y-3 z-10"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="h-3.5 w-3.5" /> Simulador de Produtividade de Garra
                    </h4>
                    <button onClick={() => setCalcOpen(false)} className="text-slate-400 hover:text-white text-xs">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Área Garra (m²)</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="3.0"
                        value={grappleArea}
                        onChange={(e) => setGrappleArea(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 p-1.5 rounded text-white text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Mad. Compr. (m)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="10"
                        value={woodLength}
                        onChange={(e) => setWoodLength(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 p-1.5 rounded text-white text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Tempo Ciclo (s)</label>
                      <input
                        type="number"
                        step="5"
                        min="5"
                        max="300"
                        value={cycleTime}
                        onChange={(e) => setCycleTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 p-1.5 rounded text-white text-center font-bold"
                      />
                    </div>
                  </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold uppercase text-[10px]"
                          onClick={runCalculation}
                        >
                          Calcular Produtividade
                        </Button>
                        {calcResult && (
                          <button
                            onClick={applyCalcToChat}
                            className="flex-1 flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-extrabold uppercase text-[10px] py-1.5 px-3 rounded-lg transition"
                            title="Enviar este cálculo para análise técnica detalhada no chat da IA"
                          >
                            Enviar p/ Consultar IA
                          </button>
                        )}
                      </div>

                  {calcResult && (
                    <div className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase">Carga/Ciclo</p>
                        <p className="text-xs font-black text-white">{calcResult.weightPerCycle.toFixed(0)} kg</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase">Ciclos/Hora</p>
                        <p className="text-xs font-black text-white">{calcResult.cyclesPerHour.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-amber-400 uppercase">Produtividade</p>
                        <p className="text-xs font-black text-amber-400">{calcResult.hourlyProductivity.toFixed(1)} t/h</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
  </>);
  const rotuloSpec = (k: string) => {
    const t = k.replace(/_/g, ' ').trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const specsDoModelo = (model: ProductModel): [string, string][] =>
    Object.entries(model.technical_specs || {})
      .filter(([k, v]) => v !== undefined && v !== null && String(v).trim() !== '' && !/c[oó]digo|^id$/i.test(k))
      .map(([k, v]) => [rotuloSpec(k), String(v).trim()] as [string, string]);
  const specsChave = (model: ProductModel): [string, string][] => {
    const todas = specsDoModelo(model);
    const prioridade = ['máquina base', 'maquina base', 'trator', 'potência', 'potencia', 'peso operacional', 'largura', 'profundidade', 'peso', 'vazão', 'vazao', 'pressão', 'pressao', 'abertura', 'área', 'area'];
    const nota = (rot: string) => {
      const r = rot.toLowerCase();
      const i = prioridade.findIndex(p => r.includes(p));
      return i < 0 ? 99 : i;
    };
    return [...todas].sort((a, b) => nota(a[0]) - nota(b[0])).slice(0, 3);
  };
  const corServe = (serve?: string) => serve === 'nao'
    ? { caixa: 'border-[#F3C9C9] bg-[#FDF3F3]', titulo: 'text-[#B42318]', valor: 'text-[#B42318]', texto: 'Não' }
    : serve === 'sim'
      ? { caixa: 'border-[#BFE3CB] bg-[#F2FAF4]', titulo: 'text-[#157F3C]', valor: 'text-[#157F3C]', texto: 'Sim' }
      : { caixa: 'border-[#F1DFA6] bg-[#FFFBEB]', titulo: 'text-[#8A6500]', valor: 'text-[#8A6500]', texto: serve === 'verificar' ? 'Verificar' : '' };
  const fotoPe = (src: string | undefined, className: string) => <MarkdownImage src={src} className={className} />;
  // Indicar na pronta entrega: só para quem indica (parceiro e a equipe que cria indicação no app)
  const onIndicarPe = podeIndicar ? indicarProntaEntrega : undefined;
  // Aviso de pronta entrega: só parceiro e equipe, só em resposta do consultor (não no roteiro de indicação
  // nem enquanto ele pergunta com opções), e só uma vez por equipamento na conversa
  const avisoProntaDe = (msg: Message, idx: number): ItemProntaEntrega | null => {
    if (perfilConsultor === 'visitante' || !prontaEntrega.length) return null;
    if (msg.role !== 'assistant' || idx === 0 || msg.indicar || msg.content.includes('Ops, ocorreu um erro')) return null;
    if (parseConsultantOptions(msg.content).options.length > 0) return null;
    // a máquina do cliente não serve: oferecer o equipamento do estoque contradiz a resposta
    if (msg.painel?.maquina?.serve === 'nao') return null;
    // com painel, o equipamento é o do painel; o texto só vale quando não há painel
    const achado = msg.painel
      ? (msg.painel.produto ? detectEquipmentInMessage(msg.painel.produto)[0] : undefined)
      : detectEquipmentInMessage(parseConsultantOptions(msg.content).text)[0];
    const it = achado ? itemProntoDe(prontaEntrega, achado.prod.id, achado.model.id) : null;
    if (!it) return null;
    // equipe que acabou de perguntar deste item ("Me fale sobre ...") não precisa do aviso repetindo
    if (ehEquipeConsultor) {
      const anterior = messages[idx - 1];
      if (anterior?.role === 'user' && anterior.content.trim().toLowerCase().startsWith(`me fale sobre ${it.nome}`.toLowerCase())) return null;
    }
    // já avisou deste equipamento numa resposta anterior
    for (let i = 1; i < idx; i++) {
      const m = messages[i];
      if (m.role !== 'assistant' || m.indicar || parseConsultantOptions(m.content).options.length > 0) continue;
      const a = m.painel
        ? (m.painel.produto ? detectEquipmentInMessage(m.painel.produto)[0] : undefined)
        : detectEquipmentInMessage(parseConsultantOptions(m.content).text)[0];
      if (a && a.prod.id === achado!.prod.id && a.model.id === achado!.model.id) return null;
    }
    return it;
  };
  const copiarResposta = async (conteudo: string) => {
    const texto = parseConsultantOptions(conteudo).text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[*#]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    try {
      await navigator.clipboard.writeText(texto);
      toast.success('Resposta copiada.');
    } catch {
      toast.error('Não consegui copiar. Selecione o texto e copie.');
    }
  };
  // Celular: os dados do painel da resposta viram cartões compactos dentro da conversa
  const cartoesPainelCel = (painel: PainelConversa, perguntandoOpcoes = false) => {
    const mq = painel.maquina && painel.maquina.nome ? painel.maquina : null;
    // Consultor perguntando com opções: ainda não há equipamento escolhido
    const equip = painel.produto && !perguntandoOpcoes ? detectEquipmentInMessage(painel.produto)[0] : undefined;
    const perguntas = (painel.perguntas || []).filter(Boolean);
    const alternativas = (painel.alternativas || []).filter(a => a && a.nome);
    if (!mq && !equip && !perguntas.length && !alternativas.length) return null;
    return (
      <div className="flex justify-start">
        <div className="w-full max-w-[88%] space-y-2.5">
          {mq && (() => {
            const cor = corServe(mq.serve);
            // não repete o que o título já diz ("Escavadeira 14 t" com "14 t" embaixo)
            const normaliza = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
            const tituloMq = normaliza(String(mq.nome));
            const detalhe = [mq.transmissao || mq.tipo, mq.potencia]
              .filter((d): d is string => !!d && !!String(d).trim() && !tituloMq.includes(normaliza(String(d))))
              .join(', ');
            const serveTxt = mq.serve === 'nao' ? 'não serve' : mq.serve === 'sim' ? 'serve' : mq.serve === 'verificar' ? 'verificar' : '';
            return (
              <div className={cn('rounded-2xl border px-4 py-3', cor.caixa)}>
                <p className={cn('text-[11px] font-extrabold uppercase tracking-[0.12em]', cor.titulo)}>Máquina do cliente</p>
                <p className="fonte-titulo text-[17px] font-extrabold leading-tight mt-0.5 text-[#1B1E22] break-words">{mq.nome}</p>
                {(detalhe || serveTxt) && (
                  <p className="mt-0.5 text-[14px] text-[#3E444B]">
                    {detalhe}{detalhe && serveTxt ? ' · ' : ''}{serveTxt && <span className={cn('font-bold', cor.valor)}>{serveTxt}</span>}
                  </p>
                )}
                {mq.motivo && <p className="mt-1 text-[13px] leading-snug text-[#5B6168]">{mq.motivo}</p>}
              </div>
            );
          })()}

          {equip && (() => {
            const { prod, model } = equip;
            const foto = fotoDoModelo(prod, model);
            // Equipe: o equipamento numa linha só (foto, nome, Ver ficha e Enviar)
            if (ehEquipeConsultor) return (
              <div className="rounded-2xl border border-[#E2E5E8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="py-2 pl-2 pr-2.5 flex items-center gap-2.5">
                <div className="h-11 w-12 shrink-0 rounded-[10px] bg-gradient-to-b from-[#F4F5F6] to-[#DCE0E4] flex items-center justify-center overflow-hidden">
                  {foto
                    ? <MarkdownImage src={foto} className="max-w-full max-h-full m-0 p-0.5 border-0 bg-transparent shadow-none hover:scale-100 object-contain" />
                    : <Package className="h-5 w-5 text-[#9AA1A9]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 fonte-titulo text-[15.5px] font-extrabold leading-tight text-[#1B1E22] truncate">{tituloFicha(prod, model)}</p>
                </div>
                <button type="button" onClick={() => verFicha(prod, model)} className="h-10 shrink-0 px-2.5 whitespace-nowrap rounded-[10px] border-[1.5px] border-[#1B1E22] bg-white text-[#1B1E22] font-extrabold text-[13.5px] active:scale-95 transition">Ver ficha</button>
                {podeEnviarFicha && (
                  <button type="button" onClick={() => enviarFicha(prod, model)} title="Enviar ficha" aria-label="Enviar ficha" className="h-10 w-10 shrink-0 p-0 rounded-[10px] bg-[#1FA855] text-[#fff] flex items-center justify-center active:scale-95 transition"><Send className="h-4 w-4" /></button>
                )}
              </div>
              {/* equipe que indica: Indicar discreto, em texto, embaixo da linha */}
              {podeIndicar && (
                <div className="border-t border-[#EEF0F2] px-2.5 flex justify-end">
                  <button type="button" onClick={() => indicarEquipamento(prod, model)} disabled={loading || !!fluxoInd} className="min-h-[36px] px-1 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#3E444B] underline-offset-2 hover:underline disabled:opacity-45">
                    <UserPlus className="h-3.5 w-3.5" /> Indicar este equipamento
                  </button>
                </div>
              )}
              </div>
            );
            const linhaSpecs = specsChave(model).map(([, v]) => v).join(' · ');
            return (
              <div className="rounded-2xl border border-[#E2E5E8] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-b from-[#F4F5F6] to-[#DCE0E4] flex items-center justify-center overflow-hidden">
                    {foto
                      ? <MarkdownImage src={foto} className="max-w-full max-h-full m-0 p-1 border-0 bg-transparent shadow-none hover:scale-100 object-contain" />
                      : <Package className="h-7 w-7 text-[#9AA1A9]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="fonte-titulo text-[16.5px] font-extrabold leading-tight text-[#1B1E22] break-words">{tituloFicha(prod, model)}</p>
                    {linhaSpecs && <p className="mt-0.5 text-[13px] text-[#5B6168] truncate">{linhaSpecs}</p>}
                  </div>
                </div>
                <div className={cn('mt-3 grid gap-2', podeEnviarFicha ? 'grid-cols-3' : 'grid-cols-2')}>
                  <button type="button" onClick={() => verFicha(prod, model)} className="h-11 px-1 whitespace-nowrap rounded-xl border-2 border-[#1B1E22] bg-white text-[#1B1E22] font-extrabold text-[14px] active:scale-95 transition">Ver ficha</button>
                  {podeEnviarFicha && (
                    <button type="button" onClick={() => enviarFicha(prod, model)} className="h-11 px-1 whitespace-nowrap rounded-xl bg-[#1FA855] text-[#fff] font-extrabold text-[14px] active:scale-95 transition">Enviar</button>
                  )}
                  <button type="button" onClick={() => handleMakeIndication(prod, model)} className="h-11 px-1 whitespace-nowrap rounded-xl bg-[#F6C400] text-[#1B1E22] font-extrabold text-[14px] active:scale-95 transition">Indicar</button>
                </div>
              </div>
            );
          })()}

          {alternativas.length > 0 && (
            <div className="rounded-2xl border border-[#E2E5E8] bg-white px-4 py-2.5">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#5B6168]">Alternativas que servem</p>
              <div className="mt-1 divide-y divide-[#E2E5E8]">
                {alternativas.map((a, i) => (
                  <div key={`${i}-${a.nome}`} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-[14.5px] font-bold text-[#1B1E22] min-w-0 break-words">{a.nome}</span>
                    {a.obs && <span className="shrink-0 max-w-[50%] truncate rounded-md bg-[#E3F5E8] px-2 py-0.5 text-[12px] font-extrabold text-[#157F3C]">{a.obs}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {perguntas.length > 0 && (
            <details className="group rounded-2xl border border-[#F1DFA6] bg-[#FFF8DB]">
              <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none min-h-11 px-4 flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-extrabold uppercase tracking-[0.12em] text-[#8A6500]">Pergunte ao cliente ({perguntas.length})</span>
                <ChevronDown className="h-5 w-5 text-[#8A6500] transition-transform group-open:rotate-180" />
              </summary>
              <ul className="px-4 pb-3 -mt-1 space-y-1.5 list-disc pl-8 text-[14.5px] leading-snug text-[#1B1E22]">
                {perguntas.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </details>
          )}
        </div>
      </div>
    );
  };
  const listaMensagens = (<>
              {messages.map((msg, idx) => (
                <React.Fragment key={msg.id || `msg-${idx}`}>
                <div
                  id={`chat-message-${idx}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  <div
                    style={msg.indicar?.ok ? { background: '#EAF7EE', borderColor: '#A7DDB7', borderWidth: 1.5 } : undefined}
                    className={`${msg.role === 'user' ? 'msg-usuario' : 'msg-consultor'} max-w-[88%] rounded-2xl p-3 text-[15.5px] sm:text-[14px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-slate-850 text-slate-100 border border-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="space-y-3">
                        {msg.indicar?.ok && <p className="fonte-titulo m-0 text-[16px] font-extrabold text-[#15803D]">Indicação enviada!</p>}
                        <div className="max-w-none text-[15.5px] sm:text-[14px] leading-relaxed text-slate-200 space-y-2 markdown-body">
                          <TextoMarkdown texto={parseConsultantOptions(msg.content).text} componentes={componentesMd} />
                        </div>

                        {/* Indicação pela conversa: opções, conferência e mensagem para o cliente */}
                        {msg.indicar && (() => {
                          const passo = msg.indicar!;
                          const ultima = idx === messages.length - 1;
                          const ativo = ultima && !loading;
                          return (
                            <>
                              {passo.opcoes && passo.opcoes.length > 0 && (
                                <div className={cn('pt-1 gap-2', passo.opcoes.length > 6 ? 'flex flex-wrap' : 'flex flex-col')}>
                                  {passo.opcoes.map(op => (
                                    <button
                                      key={op.valor}
                                      type="button"
                                      disabled={!ativo}
                                      onClick={() => escolherOpcaoInd(op)}
                                      className={cn('min-h-[44px] h-auto px-3.5 py-2 rounded-xl border-[1.5px] text-[14.5px] font-bold leading-snug transition active:scale-[0.98] disabled:opacity-45',
                                        passo.opcoes!.length > 6 ? 'text-left' : 'w-full text-center',
                                        op.valor === 'cancelar' ? 'border-[#DADDE1] bg-white text-[#5B6168] font-semibold'
                                          : op.destaque ? 'border-[#F6C400] bg-[#F6C400] text-[#1B1E22]' : 'border-[#1B1E22] bg-white text-[#1B1E22]')}
                                    >
                                      {op.rotulo}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {passo.resumo && (
                                <div className="rounded-[14px] border-2 border-[#F6C400] bg-white px-3.5 py-3">
                                  <p className="m-0 mb-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#7A5F00]">Confira a indicação</p>
                                  {([['Equipamento', passo.resumo.equipamento], ['Cliente', passo.resumo.cliente], ['Telefone', passo.resumo.telefone], ['Cidade', passo.resumo.cidade], ['CNPJ', passo.resumo.cnpj || 'Não informado']] as const).map(([rot, val]) => (
                                    <div key={rot} className="flex items-start justify-between gap-3 py-1.5 border-b border-[#F1F2F4] last:border-b-0 text-[14px]">
                                      <span className="text-[#5E6672] shrink-0">{rot}</span>
                                      <b className="font-extrabold text-right break-words min-w-0 text-[#1B1E22]">{val}</b>
                                    </div>
                                  ))}
                                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                                    <button type="button" disabled={!ativo || fluxoInd?.etapa !== 'resumo'} onClick={() => escolherOpcaoInd({ rotulo: 'Corrigir', valor: 'corrigir' })} className="min-h-[44px] rounded-[10px] border-[1.5px] border-[#1B1E22] bg-white text-[14.5px] font-extrabold text-[#1B1E22] disabled:opacity-45">
                                      Corrigir
                                    </button>
                                    <button type="button" disabled={!ativo || fluxoInd?.etapa !== 'resumo'} onClick={() => escolherOpcaoInd({ rotulo: 'Enviar indicação', valor: 'enviar' })} className="min-h-[44px] rounded-[10px] bg-[#F6C400] text-[14.5px] font-extrabold text-[#1B1E22] flex items-center justify-center gap-1.5 disabled:opacity-45">
                                      {loading && ultima ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Enviar indicação
                                    </button>
                                  </div>
                                  {ultima && fluxoInd?.etapa === 'resumo' && (
                                    <button type="button" disabled={loading} onClick={() => escolherOpcaoInd(CANCELAR_IND)} className="mt-1.5 w-full min-h-[44px] text-[14px] font-semibold text-[#5B6168] underline-offset-2 hover:underline">
                                      Cancelar indicação
                                    </button>
                                  )}
                                </div>
                              )}
                              {passo.whats && (
                                <div className="rounded-[14px] border border-[#E2E5E8] bg-white px-3 py-2.5">
                                  <p className="m-0 mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#5E6672]">Mensagem para o cliente</p>
                                  <p className="m-0 mb-2.5 rounded-[10px] bg-[#E7F8DE] px-3 py-2 text-[14px] leading-snug text-[#1B1E22] break-words">{passo.whats}</p>
                                  <p className="m-0 mb-2 text-[13.5px] leading-snug text-[#5B6168]">Toque no botão, escolha o cliente no seu WhatsApp e envie a mensagem pronta.</p>
                                  <a
                                    href={`https://wa.me/?text=${encodeURIComponent(passo.whats)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#1FA855] text-[15px] font-extrabold text-[#fff] no-underline"
                                  >
                                    <Phone className="h-4 w-4" /> Enviar no WhatsApp
                                  </a>
                                </div>
                              )}
                            </>
                          );
                        })()}

                        {/* Opções para tocar quando o consultor pergunta algo */}
                        {(() => {
                          const { options } = parseConsultantOptions(msg.content);
                          if (!options.length) return null;
                          const isLast = idx === messages.length - 1;
                          return (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {options.map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  disabled={!isLast || loading}
                                  onClick={() => enviarPronto(opt)}
                                  className="px-3.5 py-2 rounded-full border border-amber-500/60 bg-amber-500/10 text-amber-300 text-[14px] font-semibold active:scale-95 transition disabled:opacity-40"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                        
                        {/* Dynamic Quick Action Buttons */}
                        {(() => {
                          if (onboardingStep === 'SELECT_ROLE' && msg.id === 'initial-welcome') {
                            return (
                              <div className="mt-3 pt-2 border-t border-slate-800 flex flex-col gap-2">
                                <p className="text-[10.5px] text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                                  Selecione uma opção para continuar:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                  <button
                                    onClick={() => handleSelectRole('cliente')}
                                    className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black uppercase text-xs py-3 px-4 rounded-xl transition shadow-md cursor-pointer duration-150"
                                  >
                                    <User className="h-4 w-4" />
                                    Sou Cliente
                                  </button>
                                  <button
                                    onClick={() => handleSelectRole('vendedor')}
                                    className="flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-black uppercase text-xs py-3 px-4 rounded-xl transition border border-slate-600 shadow-md cursor-pointer duration-150"
                                  >
                                    <Briefcase className="h-4 w-4" />
                                    Sou Vendedor / Parceiro
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          if (onboardingStep === 'SELLER_NOT_FOUND' && msg.id === messages[messages.length - 1]?.id) {
                            return (
                              <div className="mt-3 pt-2 border-t border-slate-800 flex flex-col gap-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                  <button
                                    onClick={() => handleRetrySellerEmail()}
                                    className="flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-black uppercase text-xs py-3 px-4 rounded-xl transition border border-slate-600 shadow-md cursor-pointer duration-150"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    Tentar Outro E-mail
                                  </button>
                                  <button
                                    onClick={() => handleSelectRole('cliente')}
                                    className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black uppercase text-xs py-3 px-4 rounded-xl transition shadow-md cursor-pointer duration-150"
                                  >
                                    <User className="h-4 w-4" />
                                    Entrar como Cliente
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          if (onboardingStep !== 'COMPLETED' || msg.indicar) {
                            return null;
                          }

                          const isErrorMsg = msg.content.includes('Ops, ocorreu um erro');
                          if (isErrorMsg) {
                            return (
                              <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex flex-col gap-2">
                                <p className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-rose-400" /> Falha de Conexão com a IA
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <button
                                    onClick={() => handleRetry(idx)}
                                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-black uppercase text-[10px] py-2 px-4 rounded-lg transition shadow-md cursor-pointer duration-150 animate-pulse hover:animate-none"
                                    title="Clique aqui para tentar novamente. O consultor lerá sua última pergunta e gerará uma nova resposta automaticamente."
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Tentar Novamente (Reenviar Pergunta)
                                  </button>
                                  {typeof window !== 'undefined' && window.self !== window.top && (
                                    <a
                                      href={window.location.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-black uppercase text-[10px] py-2 px-4 rounded-lg transition shadow-md cursor-pointer duration-150"
                                      title="Abre o aplicativo em uma nova aba para resolver problemas de cookies de terceiros no AI Studio."
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                      Abrir em Nova Aba (Recomendado)
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          // Enquanto está perguntando (com opções), não mostra cartões de equipamento
                          // no celular o equipamento do painel já tem cartão próprio logo abaixo: não repete aqui
                          const modeloPainelCel = !layoutPc && msg.painel?.produto ? detectEquipmentInMessage(msg.painel.produto)[0]?.model.id : undefined;
                          const matchedEquip = (parseConsultantOptions(msg.content).options.length ? [] : detectEquipmentInMessage(msg.content))
                            .filter(e => !modeloPainelCel || e.model.id !== modeloPainelCel);
                          const isArraste = 
                            msg.content.toLowerCase().includes('arraste') ||
                            msg.content.toLowerCase().includes('pinça') ||
                            msg.content.toLowerCase().includes('pinca') ||
                            msg.content.toLowerCase().includes('miniskid') ||
                            msg.content.toLowerCase().includes('msr ') ||
                            msg.content.toLowerCase().includes('clambunk') ||
                            msg.content.toLowerCase().includes('clambank') ||
                            msg.content.toLowerCase().includes('clamp');

                          const hasActions = matchedEquip.length > 0 || isArraste || idx > 0;
                          if (!hasActions) return null;

                          return (
                            <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex flex-col gap-2">
                              {/* 1. Normal Equipment Matches */}
                              {matchedEquip.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                  <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-amber-400" /> Indicações Rápidas Disponíveis:
                                  </p>
                                  <div className="flex flex-col gap-2 w-full">
                                    {matchedEquip.map(({ prod, model }) => {
                                      const videoUrl = videoDoEquipamento(prod, model);
                                      const foto = fotoDoModelo(prod, model);
                                      return (
                                        <CartaoFicha
                                          key={`${prod.id}-${model.id}`}
                                          titulo={tituloFicha(prod, model)}
                                          imagem={foto ? <MarkdownImage src={foto} className="max-w-full max-h-full object-contain m-0 p-1 mix-blend-multiply" /> : undefined}
                                          podeEnviar={podeEnviarFicha}
                                          onVer={() => verFicha(prod, model)}
                                          onEnviar={() => enviarFicha(prod, model)}
                                          onIndicar={() => handleMakeIndication(prod, model)}
                                          video={videoUrl || undefined}
                                          pid={prod.id}
                                          mid={model.id}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* 2. Arraste / Clambunk Panel */}
                              {(() => {
                                if (!isArraste) return null;

                                const getEquipDetails = (eq: string) => {
                                  switch (eq) {
                                    case 'msr600':
                                      return { name: 'Mini Skidder MSR 600', area: 0.60, factor: 0.42, maxD: 60 };
                                    case 'msr1000':
                                      return { name: 'Mini Skidder MSR 1000', area: 1.00, factor: 0.45, maxD: 100 };
                                    case 'clambunk10':
                                      return { name: 'Carreta Clambunk 1.0', area: 1.00, factor: 0.62, maxD: 100 };
                                    case 'clambunk15':
                                      return { name: 'Carreta Clambunk 1.5', area: 1.50, factor: 0.72, maxD: 100 };
                                    default:
                                      return { name: 'Mini Skidder MSR 1000', area: 1.00, factor: 0.45, maxD: 100 };
                                  }
                                };

                                const eqDetails = getEquipDetails(arrasteCalcEquip);
                                const dMeters = arrasteCalcDiameter / 100;
                                const treeArea = Math.PI * Math.pow(dMeters / 2, 2);
                                const totalWoodArea = eqDetails.area * eqDetails.factor;
                                let treeCount = Math.floor(totalWoodArea / treeArea);
                                if (treeCount === 0 && arrasteCalcDiameter <= eqDetails.maxD) {
                                  treeCount = 1;
                                }
                                if (arrasteCalcDiameter > eqDetails.maxD) {
                                  treeCount = 0;
                                }

                                const handleSendSimulation = () => {
                                  const calcText = `Gostaria de analisar este dimensionamento de arraste:
- Equipamento: **${eqDetails.name} (Capacidade física: ${eqDetails.maxD} cm)**
- Diâmetro Médio das Árvores: **${arrasteCalcDiameter} cm**
- Capacidade Estimada: **~${treeCount} árvores inteiras** por feixe (compatível com a área física da garra)
- Fator de Empilhamento Aplicado: **${(eqDetails.factor * 100).toFixed(0)}%**

Você poderia me detalhar os requisitos de acoplamento no trator e o funcionamento operacional dessa solução?`;
                                  setIsArrasteCalcOpen(false);
                                  enviarPronto(calcText);
                                };

                                return (
                                  <div className="space-y-3 pt-2 border-t border-slate-800/60 mt-1">
                                    <div className="space-y-2">
                                      <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                                        <Tractor className="h-3.5 w-3.5 text-amber-400" /> Triagem e Dimensionamento de Arraste:
                                      </p>
                                      <div className="flex flex-col gap-1.5">
                                        <p className="text-[9.5px] text-slate-400 leading-normal">Escolha o tipo de equipamento de arraste para direcionar a conversa técnica de forma rápida e prática:</p>
                                        <div className="flex flex-wrap gap-2">
                                          <button
                                            onClick={() => enviarPronto("Me fale sobre as Garras de Arraste (Mini Skids) Roder de acoplamento nos 3 pontos, modelos MSR 600 e MSR 1000")}
                                            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 text-[10px] font-black uppercase py-2 px-3 rounded-xl transition cursor-pointer shadow-sm"
                                          >
                                            🚜 Mini Skids (MSR 600/1000)
                                          </button>
                                          <button
                                            onClick={() => enviarPronto("Me fale sobre as Carretas de Arraste Clambunk Roder de engate traseiro, modelos Clambunk 1.0 e Clambunk 1.5")}
                                            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 text-[10px] font-black uppercase py-2 px-3 rounded-xl transition cursor-pointer shadow-sm"
                                          >
                                            🚛 Carretas Clambunk
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 space-y-2.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-amber-400/90 flex items-center gap-1">
                                          <Calculator className="h-3 w-3" />
                                          Calculadora de Capacidade de Feixes
                                        </span>
                                        <button
                                          onClick={() => setIsArrasteCalcOpen(!isArrasteCalcOpen)}
                                          className="text-[9.5px] font-black uppercase tracking-tight text-slate-300 hover:text-white px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                                        >
                                          {isArrasteCalcOpen ? 'Fechar ✕' : 'Calcular Capacidade ⚙️'}
                                        </button>
                                      </div>

                                      {isArrasteCalcOpen && (
                                        <div className="space-y-3.5 pt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                          <div className="space-y-1">
                                            <label className="text-[9px] uppercase font-bold text-slate-400">Selecione o Modelo:</label>
                                            <div className="grid grid-cols-2 gap-1.5">
                                              {(['msr600', 'msr1000', 'clambunk10', 'clambunk15'] as const).map(opt => {
                                                const nameMap = {
                                                  msr600: 'MSR 600 (Garra 60 cm)',
                                                  msr1000: 'MSR 1000 (Garra 1.0 m)',
                                                  clambunk10: 'Clambunk 1.0 (Carreta 1.0m²)',
                                                  clambunk15: 'Clambunk 1.5 (Carreta 1.5m²)'
                                                };
                                                return (
                                                  <button
                                                    key={opt}
                                                    onClick={() => setArrasteCalcEquip(opt)}
                                                    className={`py-1.5 px-2 rounded-lg text-[9px] font-bold border text-center transition ${
                                                      arrasteCalcEquip === opt
                                                        ? 'bg-amber-500 border-amber-500 text-slate-950 font-black'
                                                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                                                    }`}
                                                  >
                                                    {nameMap[opt]}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                              <label className="text-[9px] uppercase font-bold text-slate-400">Diâmetro Médio das Árvores:</label>
                                              <span className="text-xs font-mono font-black text-amber-400">{arrasteCalcDiameter} cm</span>
                                            </div>
                                            <input
                                              type="range"
                                              min={8}
                                              max={45}
                                              value={arrasteCalcDiameter}
                                              onChange={(e) => setArrasteCalcDiameter(Number(e.target.value))}
                                              className="w-full accent-amber-500 cursor-pointer"
                                            />
                                            <div className="flex gap-1.5 pt-0.5 justify-between">
                                              {[12, 15, 20, 25].map(val => (
                                                <button
                                                  key={val}
                                                  onClick={() => setArrasteCalcDiameter(val)}
                                                  className={`flex-1 py-1 rounded text-[8.5px] font-bold border transition ${
                                                    arrasteCalcDiameter === val
                                                      ? 'bg-amber-500 border-amber-500 text-slate-950 font-black'
                                                      : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800'
                                                  }`}
                                                >
                                                  {val} cm
                                                </button>
                                              ))}
                                            </div>
                                          </div>

                                          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-2">
                                            <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-1.5">
                                              <span className="text-[9.5px] font-bold text-slate-400 uppercase">Capacidade do Feixe:</span>
                                              <span className="text-sm font-black text-emerald-400 animate-pulse">
                                                {treeCount > 0 ? `~${treeCount} Árvores` : 'Excede o limite único'}
                                              </span>
                                            </div>

                                            <div className="text-[9px] text-slate-300 space-y-1 leading-normal font-medium">
                                              <p>• **Capacidade Máxima**: {eqDetails.maxD === 60 ? 'Tora de até 60 cm de diâmetro' : 'Tora de até 1,0 metro de diâmetro'}</p>
                                              <p>• **Área Útil da Garra**: {eqDetails.area.toFixed(2)} m² (Fator empilhamento: {(eqDetails.factor*100).toFixed(0)}%)</p>
                                              {arrasteCalcEquip.startsWith('msr') ? (
                                                <>
                                                  <p>• **Acoplamento**: 3 pontos do hidráulico traseiro do trator.</p>
                                                  <p>• **Kit Hidráulico**: Cilindro hidráulico do terceiro ponto incluso.</p>
                                                  <p>• **Requisito do Trator**: <strong className="text-amber-400 font-semibold">2 comandos duplos extras</strong> (4 vias de engate rápido) para abrir/fechar e inclinar.</p>
                                                </>
                                              ) : (
                                                <>
                                                  <p>• **Acoplamento**: Reboque via pino de tração.</p>
                                                  <p>• **Rodado**: {arrasteCalcEquip === 'clambunk15' ? 'Eixo Tandem (4 pneus 1000x20 ultra resistentes)' : 'Eixo simples (2 pneus de alta resistência)'}</p>
                                                  <p>• **Operação**: Garras invertidas abertas para cima no chassi (tipo clambunk) para carregar de forma super prática.</p>
                                                </>
                                              )}
                                            </div>
                                          </div>

                                          <button
                                            onClick={handleSendSimulation}
                                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-lg transition shadow flex items-center justify-center gap-1 cursor-pointer border-0"
                                          >
                                            <Send className="h-3 w-3" /> Enviar Dimensionamento no Chat
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* 3. Generate Report button: só em respostas técnicas completas (não em perguntas e respostas curtas) */}
                              {idx > 0 && (() => {
                                const c = msg.content || '';
                                const specLines = (c.match(/^\s*[-•*]\s+.+:\s*.+$/gm) || []).length;
                                const asksQuestion = parseConsultantOptions(c).options.length > 0 || (/\?\s*$/.test(c.trim()) && c.length < 700);
                                return !asksQuestion && c.length >= 600 && (matchedEquip.length > 0 || specLines >= 4);
                              })() && (
                                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/40">
                                  <button
                                    onClick={() => handleOpenReport(parseConsultantOptions(msg.content).text, `Relatório de Análise Técnica - ${matchedEquip.length > 0 ? matchedEquip[0].model.name : 'Dimensionamento'}`)}
                                    className="flex items-center gap-1 text-green-400 hover:text-green-300 font-extrabold text-[9.5px] uppercase tracking-wide transition hover:underline cursor-pointer"
                                    title="Gerar e salvar imagem do relatório técnico oficial"
                                  >
                                    <FileText className="h-3 w-3" /> Gerar Relatório em Imagem
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                          return null;
                        })()}

                        {/* Equipe: copia a resposta limpa para colar no WhatsApp do cliente */}
                        {ehEquipeConsultor && idx > 0 && !msg.indicar && onboardingStep === 'COMPLETED' && !msg.content.includes('Ops, ocorreu um erro') && (
                          <button
                            type="button"
                            onClick={() => copiarResposta(msg.content)}
                            className="w-full min-h-[40px] h-auto rounded-xl border-[1.5px] border-[#1B1E22] bg-white text-[#1B1E22] text-[14px] font-extrabold flex items-center justify-center gap-1.5 active:scale-[0.99] transition"
                          >
                            Copiar resposta
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
                {/* Celular: o painel da resposta (máquina, equipamento, perguntas) vem logo abaixo dela */}
                {!layoutPc && msg.role === 'assistant' && msg.painel && cartoesPainelCel(msg.painel, parseConsultantOptions(msg.content).options.length > 0)}
                {/* Vídeos que o consultor escolheu para esta resposta (ids conferidos contra a lista) */}
                {msg.role === 'assistant' && msg.painel?.videos && msg.painel.videos.length > 0 && (
                  <VideosDaResposta ids={msg.painel.videos} lista={videosConsultor} foto={fotoDoVideo} />
                )}
                {/* Pergunta de kit: o kit depende da configuração da máquina, então o pedido de vídeo e fotos ao cliente */}
                {msg.role === 'assistant' && perfilConsultor !== 'visitante' && idx > 0 && !(loading && idx === messages.length - 1) && precisaConfirmarMaquina(msg.painel, messages[idx - 1]?.role === 'user' ? messages[idx - 1].content : '') && (
                  <div className="flex justify-start">
                    <div className="w-full max-w-[88%] rounded-2xl border border-[#F1DFA6] bg-[#FFF8DB] px-4 py-3">
                      <p className="m-0 text-[11.5px] font-extrabold uppercase tracking-[0.12em] text-[#8A6500]">Confirmar a máquina</p>
                      <p className="m-0 mt-1 text-[14.5px] leading-snug text-[#1B1E22]">O kit depende de como a máquina está configurada. Peça ao cliente o vídeo e as fotos.</p>
                      <button
                        type="button"
                        onClick={pedirConfirmacaoMaquina}
                        className="mt-2.5 h-auto min-h-[44px] w-full rounded-xl bg-[#1FA855] px-3 py-2 text-[14.5px] font-extrabold leading-tight text-[#fff] flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
                      >
                        <Phone className="h-4 w-4 shrink-0" /> Pedir confirmação da máquina ao cliente
                      </button>
                      {!videoAmostra && <p className="m-0 mt-2 text-[13px] leading-snug text-[#8A6500]">{AVISO_SEM_AMOSTRA} O texto vai sem o link do vídeo.</p>}
                    </div>
                  </div>
                )}
                {/* Equipamento da resposta está no estoque: aviso amarelo (parceiro indica, equipe pergunta) */}
                {(() => {
                  const it = avisoProntaDe(msg, idx);
                  if (!it) return null;
                  const acao = ehParceiroConsultor && onIndicarPe
                    ? { rotulo: 'Indicar', fn: () => indicarProntaEntrega(it) }
                    : { rotulo: 'Perguntar', fn: () => perguntarProntaEntrega(it) };
                  return <AvisoProntaEntrega item={it} foto={fotoPe} rotulo={acao.rotulo} onAcao={acao.fn} parceiro={ehParceiroConsultor} />;
                })()}
                </React.Fragment>
              ))}

              {loading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-slate-850 border border-slate-800 text-slate-300 rounded-2xl rounded-tl-none p-3 text-[14.5px] sm:text-xs flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span>Consultor Técnico analisando dados...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
  </>);
  const blocoExplorador = (<>
            {/* Dynamic Interactive Catalog Explorer Panel */}
            <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3 shadow-inner">
              {explorerMinimized ? (
                <div className="flex items-center justify-between py-1 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg">
                      <Layers className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider leading-none">Explorador de Compatibilidade</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">Catálogo de equipamentos e modelos compatíveis</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExplorerMinimized(false)}
                    className="h-7 px-3 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition duration-150 flex items-center gap-1 shadow"
                  >
                    <ChevronRight className="h-3 w-3 rotate-270" /> Abrir Catálogo
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" /> Explorador de Compatibilidade
                    </p>
                    <div className="flex items-center gap-2">
                      {(selectedProduct || selectedWeightBand || selectedModel || cacambaStep) && (
                        <button 
                          onClick={() => {
                            setSelectedProduct(null);
                            setSelectedWeightBand(null);
                            setSelectedModel(null);
                            setCacambaStep(null);
                            setSelectedMaterial(null);
                            setSelectedCacambaBrand('');
                            setSelectedCacambaModel(null);
                            setRecommendedCacambaCap('');
                          }}
                          className="text-[10px] text-slate-400 hover:text-white uppercase font-black tracking-tight"
                        >
                          Reiniciar Guia ✕
                        </button>
                      )}
                      <button
                        onClick={() => setExplorerMinimized(true)}
                        className="text-[10px] text-amber-400 hover:text-slate-950 bg-amber-500/10 hover:bg-amber-400 border border-amber-500/30 px-2.5 py-1 rounded transition font-black tracking-wider shadow"
                        title="Minimizar Explorador"
                      >
                        MINIMIZAR ─
                      </button>
                    </div>
                  </div>

                  {loadingExplorer ? (
                    <div className="py-6 flex justify-center items-center gap-2 text-xs text-slate-400">
                      <RefreshCw className="h-4 w-4 animate-spin text-amber-500" /> Carregando catálogo...
                    </div>
                  ) : !selectedProduct ? (
                /* Step 1: Show list of all available catalog products */
                <div className="space-y-2">
                  <div className="text-slate-300 text-xs font-semibold pb-1 font-mono">
                    • Descreva o que você precisa no chat acima OU clique no equipamento abaixo para consultar:
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {catalogProducts.map(prod => (
                      <button
                        key={prod.id}
                        onClick={() => escolherProdutoExplorador(prod)}
                        className="text-left text-[11px] font-bold bg-slate-850 hover:bg-primary/20 hover:border-primary/40 text-slate-200 border border-slate-800 py-2 px-2.5 rounded-xl transition-all duration-200 truncate shadow-sm flex items-center justify-between group"
                      >
                        <span className="truncate">{prod.name}</span>
                        <ChevronRight className="h-3 w-3 text-slate-500 group-hover:text-primary transition-colors flex-shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : selectedProduct && selectedProduct.name.toLowerCase().includes('caçamba') ? (
                /* Caçamba Guided Wizard Flow */
                <div className="space-y-3">
                  {cacambaStep === 'material' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setSelectedProduct(null)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[11px] font-black text-slate-200 uppercase truncate">
                          Caçamba: Escolher Material
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Qual é o tipo de material que o cliente irá manusear? (A escolha depende totalmente da densidade):
                      </p>
                      <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                        {MATERIALS.map(mat => (
                          <button
                            key={mat.name}
                            onClick={() => {
                              setSelectedMaterial(mat);
                              setCacambaStep('brand');
                            }}
                            className="text-left text-[10px] font-bold bg-slate-850 hover:bg-amber-500/20 hover:border-amber-500/40 text-slate-200 border border-slate-800 py-1.5 px-2 rounded-xl transition truncate shadow-sm flex flex-col"
                          >
                            <span className="truncate text-slate-100">{mat.name}</span>
                            <span className="text-[8px] text-slate-400 font-mono mt-0.5">{mat.density} kg/m³ ({mat.class})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {cacambaStep === 'brand' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setCacambaStep('material')}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[11px] font-black text-slate-200 uppercase truncate">
                          Material: {selectedMaterial?.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Selecione a marca da Pá Carregadeira do cliente:
                      </p>
                      <div className="grid grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {Array.from(new Set(MACHINES.map(m => m.brand))).sort().map(brand => (
                          <button
                            key={brand}
                            onClick={() => {
                              setSelectedCacambaBrand(brand);
                              setCacambaStep('model');
                            }}
                            className="bg-slate-850 hover:bg-primary/20 border border-slate-800 text-[10px] font-black py-2 px-1.5 rounded-xl text-center text-slate-200 transition"
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {cacambaStep === 'model' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setCacambaStep('brand')}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[11px] font-black text-slate-200 uppercase truncate">
                          Carregadeira {selectedCacambaBrand}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Selecione o modelo exato ou faixa de peso da carregadeira:
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {MACHINES.filter(m => m.brand === selectedCacambaBrand).map(machine => (
                          <button
                            key={machine.model}
                            onClick={() => {
                              setSelectedCacambaModel(machine);
                              const recCap = getRecommendedBucket(machine, selectedMaterial?.density || 350);
                              setRecommendedCacambaCap(recCap);
                              setCacambaStep('result');
                            }}
                            className="text-left bg-slate-850 hover:bg-primary/20 border border-slate-800 p-2 rounded-xl transition flex flex-col"
                          >
                            <span className="text-[10px] font-bold text-slate-100">{machine.model}</span>
                            <span className="text-[8px] text-slate-400 font-mono">Porte: {machine.operatingWeight} t • Original: {machine.originalBucket}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {cacambaStep === 'result' && selectedCacambaModel && selectedMaterial && (
                    <div className="space-y-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => setCacambaStep('model')}
                            className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[11px] font-black text-amber-400 uppercase truncate">
                            Caçamba Recomendada: {recommendedCacambaCap} m³
                          </span>
                        </div>
                        {stockItems.some(item => {
                          const desc = (item.description || '').toLowerCase();
                          const capClean = String(recommendedCacambaCap).replace(',', '.');
                          return (desc.includes('caçamba') || desc.includes('high tip') || desc.includes('cacamba')) && desc.includes(capClean);
                        }) ? (
                          <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] font-black px-1.5 py-0.5 rounded">
                            Disponível hoje! ✅
                          </span>
                        ) : (
                          <span className="text-[8px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">Sob Encomenda</span>
                        )}
                      </div>

                      <div className="text-[10px] space-y-1 font-mono text-slate-300 max-h-[110px] overflow-y-auto pr-1 border-b border-slate-850 pb-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500 uppercase font-bold">Material:</span>
                          <span className="text-slate-200 font-semibold">{selectedMaterial.name} ({selectedMaterial.density} kg/m³)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 uppercase font-bold">Carregadeira:</span>
                          <span className="text-slate-200 font-semibold">{selectedCacambaBrand} {selectedCacambaModel.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 uppercase font-bold">Porte Máquina Base:</span>
                          <span className="text-slate-200 font-semibold">{selectedCacambaModel.operatingWeight} t</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 uppercase font-bold">Caçamba Original:</span>
                          <span className="text-slate-200 font-semibold">{selectedCacambaModel.originalBucket}</span>
                        </div>
                        {calculateDischargeHeights(selectedCacambaModel, recommendedCacambaCap) && (() => {
                          const heights = calculateDischargeHeights(selectedCacambaModel, recommendedCacambaCap);
                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500 uppercase font-bold">Alt. Descarga Original:</span>
                                <span className="text-slate-200 font-semibold">{heights.standardDischargeHeight.toFixed(2)} m</span>
                              </div>
                              <div className="flex justify-between text-emerald-400">
                                <span className="uppercase font-bold">Alt. Descarga High Tip:</span>
                                <span className="font-extrabold">{heights.highTipDischargeHeight.toFixed(2)} m</span>
                              </div>
                              <div className="flex justify-between text-amber-400 font-bold">
                                <span className="uppercase">Ganho Real Altura:</span>
                                <span>+{heights.gainHeight.toFixed(2)} m 🚀</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Warnings Display as requested */}
                      <div className="p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[9px] text-slate-300 leading-normal space-y-1 font-sans">
                        <p className="font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Verificações de Instalação e Acessórios
                        </p>
                        <p>
                          <strong>Atenção:</strong> É necessário que o vendedor interno realize o orçamento oficial completo, verificando a disponibilidade de acessórios essenciais como ponteiras, dentes, suportes de acoplamento ou kits de instalação (mangueiras, comandos, conexões).
                        </p>
                        <p>
                          Mesmo havendo o equipamento principal em estoque, é necessário consultar a disponibilidade técnica dos acessórios e kits de instalação para agendamento correto da entrega do produto, montagem física na máquina do cliente e entrega técnica em campo. Recomendamos sempre que os produtos Roder tenham a montagem física e entrega técnica contratadas diretamente com técnicos da própria Roder ou técnicos autorizados, assegurando o perfeito funcionamento, máxima durabilidade e cobertura de garantia do equipamento.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Find matching model inside selectedProduct.models
                            const matchedModel = ((selectedProduct.models || []).find(m => {
                              const modelCap = (m.technical_specs as any)?.capacidade || m.name || '';
                              return modelCap.includes(recommendedCacambaCap);
                            }) || {
                              id: `ht-${recommendedCacambaCap}`,
                              name: `Caçamba High Tip ${recommendedCacambaCap} m³`,
                              technical_specs: { capacidade: `${recommendedCacambaCap} m³`, peso_estimado: `${getHighTipBucketWeight(recommendedCacambaCap)} kg` } as any
                            }) as ProductModel;
                            handleMakeIndication(selectedProduct, matchedModel);
                          }}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase py-2 px-3 rounded-xl transition duration-150 flex items-center justify-center gap-1 cursor-pointer border-0 shadow"
                          title="Realizar orçamento e preencher automaticamente os dados do equipamento no formulário de Nova Indicação"
                        >
                          <CheckCircle className="h-3 w-3" /> Indicar Equipamento
                        </button>
                        <button
                          onClick={() => {
                            // Send beautiful Technical Report text to the chat
                            const heights = calculateDischargeHeights(selectedCacambaModel, recommendedCacambaCap);
                            const inStock = stockItems.some(item => {
                              const desc = (item.description || '').toLowerCase();
                              const capClean = String(recommendedCacambaCap).replace(',', '.');
                              return (desc.includes('caçamba') || desc.includes('high tip') || desc.includes('cacamba')) && desc.includes(capClean);
                            });
                            const reportText = `### 📋 RELATÓRIO TÉCNICO DE DIMENSIONAMENTO DE CAÇAMBA HIGH TIP

*   **Cliente Base**: Pá Carregadeira **${selectedCacambaBrand} ${selectedCacambaModel.model}** (Porte: ${selectedCacambaModel.operatingWeight} t)
*   **Material Carregado**: **${selectedMaterial.name}** (Densidade: ${selectedMaterial.density} kg/m³ - Classificação: ${selectedMaterial.class})
*   **Caçamba Original Padrão**: ${selectedCacambaModel.originalBucket}

#### 🛠️ EQUIPAMENTO RODER RECOMENDADO
👉 **CAÇAMBA HIGH TIP RODER ${recommendedCacambaCap} m³**

*   **Peso Estimado da Caçamba**: ${getHighTipBucketWeight(recommendedCacambaCap)} kg
*   **Disponibilidade em Estoque**: ${inStock ? 'Disponível para faturamento imediato! ✅' : 'Sob Encomenda (Consulte prazo de fabricação)'}

#### 📈 COMPARAÇÃO DE ALTURAS DE DESCARGA
*   **Altura de Descarga Livre Original**: ${heights.standardDischargeHeight.toFixed(2)} metros
*   **Altura de Descarga com High Tip Roder**: **${heights.highTipDischargeHeight.toFixed(2)} metros**
*   **🚀 GANHO REAL DE ALTURA LIVRE**: **+${heights.gainHeight.toFixed(2)} metros**

#### ⚠️ DIRETRIZES DE ORÇAMENTO E INSTALAÇÃO
*   **Validação de Acessórios**: Sempre consulte o vendedor interno para verificar e precificar dentes, suportes ou ponteiras.
*   **Kits de Instalação**: Verifique a necessidade de mangueiras adicionais, comandos ou conexões dedicadas na máquina base.
*   **Instalação**: Se houver necessidade de montagem especializada pela fábrica, agende previamente com o setor técnico. Caso o cliente instale por conta própria, a entrega é faturada e despachada de imediato!`;
                            const userMsgId = `report-user-${Date.now()}`;
                            const assistantMsgId = `report-assistant-${Date.now()}`;
                            setMessages(prev => [
                              ...prev,
                              { id: userMsgId, role: 'user', content: `Gerar Relatório de Dimensionamento da Caçamba para ${selectedCacambaBrand} ${selectedCacambaModel.model}` },
                              { id: assistantMsgId, role: 'assistant', content: reportText }
                            ]);
                          }}
                          className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-100 hover:text-white border border-slate-700 font-extrabold text-[10px] uppercase py-2 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Clique para gerar e enviar o relatório técnico completo de dimensionamento e ganho de altura de descarga para o chat da IA"
                        >
                          <FileText className="h-3.5 w-3.5 text-amber-500" /> Gerar Relatório
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : !selectedWeightBand ? (
                /* Step 2: Show weight bands for selected product */
                <div className="space-y-3.5">
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setSelectedProduct(null)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[11px] font-black text-slate-200 truncate uppercase">
                      Equipamento: {selectedProduct.name}
                    </span>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-2.5">
                    <p className="text-xs font-bold text-slate-200">
                      Selecione um modelo de equipamento que você deseja de acordo com o tamanho da máquina base:
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Você já sabe o tamanho ou o modelo da escavadeira do cliente? Clique em uma faixa de tamanho:
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {getWeightBands(selectedProduct).length > 0 ? (
                        getWeightBands(selectedProduct).map(band => (
                          <button
                            key={band}
                            onClick={() => {
                              setSelectedWeightBand(band);
                              setSelectedModel(null);
                            }}
                            className="bg-primary/10 hover:bg-primary/25 border border-primary/30 text-primary-foreground hover:border-primary/60 text-xs font-black py-2 px-3 rounded-xl transition duration-150 shadow-sm"
                          >
                            Máquinas de {band}
                          </button>
                        ))
                      ) : (
                        /* Fallback if product has no specific weight bands listed */
                        <button
                          onClick={() => {
                            setSelectedWeightBand("Geral");
                            setSelectedModel(null);
                          }}
                          className="bg-primary/15 hover:bg-primary/25 border border-primary/40 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition"
                        >
                          Ver todos os modelos
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : !selectedModel ? (
                /* Step 3: Show compatible models for selected band */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <button 
                        onClick={() => setSelectedWeightBand(null)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[11px] font-black text-slate-200 truncate uppercase">
                        {selectedProduct.name} (Faixa {selectedWeightBand})
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-300 font-mono">
                    • Modelos compatíveis encontrados:
                  </p>

                  <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto">
                    {getCompatibleModels(selectedProduct, selectedWeightBand).length > 0 ? (
                      getCompatibleModels(selectedProduct, selectedWeightBand).map(model => {
                        const inStock = checkModelStock(model);
                        return (
                          <button
                            key={model.id}
                            onClick={() => setSelectedModel(model)}
                            className="text-left bg-slate-850 hover:bg-slate-800 border border-slate-750 p-2.5 rounded-xl transition duration-150 flex flex-col gap-1 shadow group"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] font-bold text-slate-100 group-hover:text-primary transition-colors">
                                {model.name}
                              </span>
                              {inStock ? (
                                <span className="bg-green-500/10 border border-green-500/20 text-green-400 font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse flex items-center gap-1">
                                  Disponível em Estoque hoje! ✅
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-500 font-mono">Sob Encomenda</span>
                              )}
                            </div>
                            {model.technical_specs?.peso && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Peso do Equipamento: {model.technical_specs.peso}
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      /* Display all models if weight band is generic or none matched */
                      (selectedProduct.models || []).map(model => {
                        const inStock = checkModelStock(model);
                        return (
                          <button
                            key={model.id}
                            onClick={() => setSelectedModel(model)}
                            className="text-left bg-slate-850 hover:bg-slate-800 border border-slate-750 p-2.5 rounded-xl transition flex flex-col gap-1 shadow"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] font-bold text-slate-100">{model.name}</span>
                              {inStock ? (
                                <span className="bg-green-500/15 border border-green-500/20 text-green-400 font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                  Disponível em Estoque hoje! ✅
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-500 font-mono">Sob Encomenda</span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* Step 4: Show specific model specs, productivity & "Fazer Indicação" action */
                <div className="space-y-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => {
                          setSelectedModel(null);
                          setDetailTab('specs');
                        }}
                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                        title="Voltar"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[11px] font-black text-slate-200 uppercase truncate">
                        Modelo: {selectedModel.name}
                      </span>
                    </div>
                    {checkModelStock(selectedModel) ? (
                      <span className="bg-green-500/10 border border-green-500/25 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                        Em Estoque hoje! ✅
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono">
                        Sob encomenda
                      </span>
                    )}
                  </div>

                  {/* Beautiful Tabs for Specs vs Productivity */}
                  <div className="flex border-b border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDetailTab('specs')}
                      className={`flex-1 pb-2 text-[11px] font-black text-center border-b-2 transition duration-150 uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                        detailTab === 'specs'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="h-3 w-3" /> Ficha Técnica
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailTab('productivity')}
                      className={`flex-1 pb-2 text-[11px] font-black text-center border-b-2 transition duration-150 uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                        detailTab === 'productivity'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" /> Produtividade
                    </button>
                  </div>

                  {/* Content based on Tab */}
                  <div className="text-xs font-sans text-slate-300 max-h-[260px] overflow-y-auto pr-1">
                    {detailTab === 'specs' ? (
                      <div className="space-y-1.5 font-mono">
                        {selectedModel.technical_specs && Object.entries(selectedModel.technical_specs)
                          .filter(([_, val]) => val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim() !== '-')
                          .length > 0 ? (
                            Object.entries(selectedModel.technical_specs)
                              .filter(([_, val]) => val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim() !== '-')
                              .map(([key, val]) => (
                                <div key={key} className="flex justify-between border-b border-slate-850 pb-1 text-[10px]">
                                  <span className="text-slate-400 uppercase font-bold">{key.replace('_', ' ')}:</span>
                                  <span className="text-slate-200 font-semibold">{String(val)}</span>
                                </div>
                              ))
                          ) : (
                            <p className="text-[10px] text-slate-500 text-center py-4 font-sans">
                              Nenhuma característica técnica cadastrada para este modelo.
                            </p>
                          )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {effectiveProductivityText ? (
                          <div className="space-y-2">
                            {(() => {
                              const isGT = selectedModel.name.toUpperCase().includes('GT') || 
                                           selectedProduct.category.toUpperCase().includes('TRAÇADORA') || 
                                           selectedProduct.name.toUpperCase().includes('TRAÇADORA');
                              if (!isGT) return null;

                              const gtData = getGTProductivityData(selectedModel.name, gtLength);
                              return (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 mb-1.5 leading-relaxed text-slate-300">
                                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" /> Calculador por Comprimento (GT)
                                  </p>
                                  <p className="text-[9.5px] text-slate-400 leading-normal">
                                    A produtividade da Garra Traçadora depende diretamente do comprimento da madeira. Selecione o comprimento abaixo para recalcular com base física:
                                  </p>

                                  {/* Selector */}
                                  <div className="grid grid-cols-4 gap-1 pt-1">
                                    {[
                                      { label: '1.0m (Metrinho)', val: 1.0 },
                                      { label: '2.4m', val: 2.4 },
                                      { label: '3.0m', val: 3.0 },
                                      { label: '6.0m', val: 6.0 },
                                    ].map((opt) => (
                                      <button
                                        key={opt.val}
                                        type="button"
                                        onClick={() => setGtLength(opt.val)}
                                        className={`py-1.5 text-[9px] font-bold rounded transition text-center border ${
                                          gtLength === opt.val
                                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow font-black'
                                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Math formula explanation */}
                                  <div className="text-[9px] bg-slate-950/60 p-2 rounded border border-slate-800/40 text-slate-350 font-mono space-y-1">
                                    <span className="text-amber-400/90 font-black block text-[8.5px] uppercase tracking-wider">Parâmetros de Cálculo Utilizados:</span>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px]">
                                      <div>• Área Útil da Garra: <strong className="text-slate-200">{gtData.area.toFixed(2)} m²</strong></div>
                                      <div>• Fator de Capacidade: <strong className="text-slate-200">{gtData.loadFactor * 100}%</strong></div>
                                      <div>• Tempo de Ciclo: <strong className="text-slate-200">{gtData.cycleRange}</strong></div>
                                      <div>• Fator Aproveit.: <strong className="text-slate-200">{gtData.opEfficiency}%</strong></div>
                                    </div>
                                    <p className="text-[8px] text-slate-450 italic leading-snug mt-1">
                                      * Fator de Capacidade (85%) compensa o afunilamento das copas das árvores. Fator de Aproveitamento (15%-30%) reflete a logística de pátio/esperas por arraste.
                                    </p>
                                  </div>

                                  {/* Result display */}
                                  <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                                    <div className="p-1.5 bg-slate-950/80 rounded border border-slate-850">
                                      <span className="text-[7px] uppercase font-bold text-slate-500 block">Por Hora</span>
                                      <span className="text-[10px] font-black text-amber-300 font-mono">{gtData.hourlyMin} - {gtData.hourlyMax} m³st</span>
                                    </div>
                                    <div className="p-1.5 bg-slate-950/80 rounded border border-slate-850">
                                      <span className="text-[7px] uppercase font-bold text-slate-500 block">Turno (10h)</span>
                                      <span className="text-[10px] font-black text-amber-300 font-mono">{gtData.shiftMin} - {gtData.shiftMax} m³st</span>
                                    </div>
                                    <div className="p-1.5 bg-slate-950/80 rounded border border-slate-850">
                                      <span className="text-[7px] uppercase font-bold text-slate-500 block">Mês (22d/10h)</span>
                                      <span className="text-[10px] font-black text-amber-300 font-mono">{(gtData.monthlyMin / 1000).toFixed(1)}k - {(gtData.monthlyMax / 1000).toFixed(1)}k m³</span>
                                    </div>
                                  </div>

                                  {/* Chain Specification Badge */}
                                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850 text-[9px] space-y-1">
                                    <div className="flex justify-between items-center text-[8.5px] uppercase font-bold tracking-wider border-b border-slate-800 pb-1">
                                      <span className="text-slate-400">Especificação da Corrente:</span>
                                      <span className="text-amber-300 font-mono">{gtData.chainSpec}</span>
                                    </div>
                                    <div className="text-[8.5px] text-slate-400 leading-relaxed space-y-1 pt-1">
                                      <p className="font-semibold text-slate-300">💡 Instruções de Engenharia para Sabres & Correntes:</p>
                                      <ul className="list-disc list-inside space-y-0.5 text-[8px]">
                                        <li><strong className="text-slate-300">Troca Preventiva:</strong> Substituir a corrente a cada <strong className="text-amber-400">2 a 2.5 horas</strong> de trabalho. Mantém a corrente super afiada, exige apenas afiação leve e eleva muito a vida útil do sabre.</li>
                                        <li><strong className="text-slate-300">Turno de 10h:</strong> Disponibilizar <strong className="text-amber-400">5 correntes afiadas</strong> por turno. No fim do turno, realizam a afiação do lote.</li>
                                        <li><strong className="text-slate-300">Vida Útil Estimada:</strong> Cerca de <strong className="text-slate-300">4 a 5 correntes</strong> e <strong className="text-slate-300">1 sabre</strong> por mês (trabalho de 10h/dia, 20-25 dias).</li>
                                        <li><strong className="text-slate-300">Coroa de Arraste (Pinhão):</strong> Dura de <strong className="text-slate-300">100 a 400 horas</strong> (20-30 dias). Desgasta mais rápido em terrenos arenosos/madeira com terra.</li>
                                        <li><strong className="text-slate-300">Lubrificação Automática:</strong> Fundamental! A falta de óleo destempera o sabre, causa desalinhamento e desgaste prematuro de todos os componentes de corte.</li>
                                      </ul>
                                    </div>
                                  </div>

                                  {gtLength === 6.0 && selectedModel.name.includes('600') && (
                                    <div className="text-[8.5px] text-amber-300 font-medium bg-amber-500/5 p-1.5 rounded border border-amber-500/10 mt-1">
                                      💡 Validado operacionalmente por especialistas: Cerca de <strong>12.000 m³ mensais</strong> em turno de 10 horas diárias de trabalho!
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="p-2.5 bg-primary/5 border border-primary/10 rounded-xl leading-relaxed text-slate-300">
                              <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-1">Referência Operacional</p>
                              <p className="text-[11px] font-medium whitespace-pre-line">{effectiveProductivityText}</p>
                            </div>

                            {['CMF 600', 'MSR 600', 'MSR 1000', 'GT 600x'].includes(selectedModel.name) && (
                              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl leading-relaxed text-slate-300">
                                <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" /> Operação Conjunta (Combo Roder)
                                </p>
                                <p className="text-[10.5px] leading-normal text-slate-300 font-semibold">
                                  Como funciona a sinergia dos 3 equipamentos juntos:
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  O <strong className="text-slate-300">Cabeçote CMF 600</strong> realiza a derrubada florestal, organizando os feixes de árvores perfeitamente alinhados.
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Em seguida, o <strong className="text-slate-300">Mini Skidder</strong> faz o arraste rápido desses feixes para as margens/pátio (rendimento de 1.000 a 1.500 árvores por turno).
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Por fim, a <strong className="text-slate-300">Garra Traçadora GT 600x</strong> realiza o traçamento (metrinho) e empilhamento contínuo.
                                </p>
                                <div className="mt-2 p-1.5 bg-amber-500/5 rounded border border-amber-500/10 text-[10px] font-bold text-amber-300 text-center">
                                  📊 Produção Estimada do Combo: 165 a 170 metros estéreos por turno de 8h (traçado e empilhado)!
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 space-y-1">
                            <p className="text-[11px] text-slate-400 font-bold">Nenhum texto de produtividade cadastrado ainda.</p>
                            <p className="text-[10px] text-slate-500 leading-normal max-w-[220px] mx-auto">
                              Como administrador/gestor, você pode cadastrar textos de produtividade em: 
                              <br />
                              <span className="text-primary font-bold">Cadastros &gt; Produtos Cadastrados &gt; Editar o Modelo</span>.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-1 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => verFicha(selectedProduct, selectedModel)}
                        className="flex-1 h-11 bg-transparent hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-200 flex items-center justify-center gap-2"
                      >
                        <FileText className="h-4 w-4" /> Ver ficha
                      </Button>
                      {podeEnviarFicha && (
                        <Button
                          onClick={() => enviarFicha(selectedProduct, selectedModel)}
                          className="flex-1 h-11 bg-[#1FA855] hover:bg-[#178a45] text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
                        >
                          <Send className="h-4 w-4" /> Enviar ficha
                        </Button>
                      )}
                    </div>

                    <Button
                      onClick={() => handleMakeIndication(selectedProduct, selectedModel)}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" /> Realizar Orçamento / Indicação
                    </Button>
                  </div>
                </div>
              )}
                </>
              )}
            </div>
  </>);
  const blocoEntrada = (<>
            {/* Input Footer for standard Chat */}
            <div className="p-2 sm:p-2.5 bg-slate-900 border-t border-slate-800 flex gap-1.5 sm:gap-2 items-center">
              {isRecording ? (
                <div className="flex-1 flex items-center justify-between bg-red-950/30 border border-red-500/30 rounded-lg px-2.5 py-1 text-xs text-red-200">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="font-medium animate-pulse">Gravando...</span>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={stopRecording}
                    className="h-6 px-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-md flex items-center gap-1"
                  >
                    <Square className="h-2.5 w-2.5 fill-white" /> Enviar
                  </Button>
                </div>
              ) : transcribing ? (
                <div className="flex-1 flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Transcrevendo...</span>
                </div>
              ) : (
                <textarea
                  placeholder="Ou pergunte ao Consultor sobre modelos, escavadeiras..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => {
                    setExplorerMinimized(true);
                    setIsInputFocused(true);
                  }}
                  onClick={() => {
                    setExplorerMinimized(true);
                    setIsInputFocused(true);
                  }}
                  onBlur={() => {
                    // Small delay to let any button click process first
                    setTimeout(() => setIsInputFocused(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={loading}
                  rows={isInputFocused ? 2 : 1}
                  className={cn(
                    "flex-1 bg-white border-2 border-slate-300 rounded-lg px-3 text-[17.5px] sm:text-[16px] text-slate-950 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 font-semibold transition-all duration-200 shadow-sm resize-none",
                    isInputFocused ? "h-16 py-1.5" : "h-[38px] py-2"
                  )}
                />
              )}

              {!isRecording && !transcribing && (
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={startRecording}
                  disabled={loading}
                  className="h-[38px] px-3 border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center"
                  title="Gravar áudio"
                >
                  <Mic className="h-[22px] w-[22px]" />
                </Button>
              )}

              {!isRecording && !transcribing && (
                <Button
                  size="sm"
                  className="h-[38px] px-3 bg-primary hover:bg-primary/90 text-white font-bold flex items-center justify-center"
                  onClick={() => handleSend()}
                  disabled={loading || !inputValue.trim()}
                >
                  <Send className="h-4.5 w-4.5" />
                </Button>
              )}
            </div>
  </>);
  const blocoEnsinar = (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden animate-in fade-in duration-200">
            {/* Scrollable container for the form and recent list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div className="p-3.5 bg-gradient-to-r from-purple-950/25 to-slate-900 border border-purple-500/20 rounded-xl space-y-1">
                <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="h-4 w-4 animate-pulse text-purple-400" /> Central de Conhecimento do Consultor IA
                </h4>
                <p className="text-[10px] text-slate-300 leading-normal font-medium">
                  Ensine novos dados de produtos, medidas, ponteiras ou regras específicas diretamente para a IA por voz ou colando textos.
                </p>
              </div>

              {/* Form Section */}
              <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                    Título do Tópico / Pergunta Relacionada
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Qual a ponteira para John Deere 180 com CMF?"
                    value={knowledgeTitle}
                    onChange={(e) => setKnowledgeTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider flex items-center justify-between">
                    <span>Explicação Técnica / Conhecimento</span>
                    <span className="text-[8px] font-mono text-purple-400 lowercase">use termos corretos: rotator / rotatores</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Escreva ou grave aqui a sua explicação detalhada para este assunto. O correto para CMF é utilizar biela de 4 polegadas com o pino correspondente..."
                    value={knowledgeText}
                    onChange={(e) => setKnowledgeText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-sans resize-none"
                  />
                </div>

                {/* Microphone Section for Knowledge Base */}
                <div className="pt-1">
                  {isTeachingRecording ? (
                    <div className="flex items-center justify-between bg-red-950/40 border border-red-500/30 rounded-xl p-2.5 text-xs text-red-200">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="font-bold animate-pulse uppercase text-[10px] tracking-wider">Gravando sua explicação por voz...</span>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={stopTeachingRecording}
                        className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1 border-0"
                      >
                        <Square className="h-3 w-3 fill-white" /> Concluir e Transcrever
                      </Button>
                    </div>
                  ) : isTeachingTranscribing ? (
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                      <span className="font-medium">Processando áudio e gerando texto técnico de alta fidelidade...</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startTeachingRecording}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/20 hover:border-purple-500/40 text-purple-300 font-extrabold uppercase text-[10px] tracking-wider rounded-lg transition duration-150 cursor-pointer border-0"
                    >
                      <Mic className="h-4 w-4 text-purple-400" />
                      Falar por Áudio (Gravar Voz)
                    </button>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveKnowledge}
                disabled={isTeachingRecording || isTeachingTranscribing}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer border-0"
              >
                <CheckCircle className="h-4 w-4" /> Ensinar ao Consultor Roder IA
              </Button>

              {/* Recent List */}
              <div className="space-y-2 pt-2">
                <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" /> Conhecimentos Adicionados Recentemente
                </h5>

                {loadingTeachings ? (
                  <div className="flex items-center gap-2 py-4 justify-center text-xs text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando ensinamentos...</span>
                  </div>
                ) : recentTeachings.length === 0 ? (
                  <p className="text-[10px] text-slate-500 font-medium italic text-center py-3 bg-slate-900/20 border border-slate-850 rounded-lg">
                    Nenhum ensinamento personalizado cadastrado ainda.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {recentTeachings.map((item, idx) => (
                      <div key={item.id || idx} className="p-2.5 bg-slate-900/40 border border-slate-850 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-purple-400 truncate max-w-[280px]">
                            {item.question}
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono">
                            {item.timestamp ? new Date(item.timestamp).toLocaleDateString('pt-BR') : 'Data n/d'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-normal line-clamp-2">
                          {item.improvedAnswer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
  );

  // ===================== Consultor no computador (tela grande, página inteira) =====================
  // Painel "Nesta conversa": o último bloco <painel> que o servidor mandou e o equipamento citado por último
  const painelAtual: PainelConversa | null = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'assistant' && m.painel) return m.painel;
    }
    return null;
  })();
  const equipAtual: { prod: Product; model: ProductModel } | null = (() => {
    if (painelAtual?.produto) {
      const achado = detectEquipmentInMessage(painelAtual.produto)[0];
      if (achado) return { prod: achado.prod, model: achado.model };
    }
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.id === 'initial-welcome' || m.content.includes('Ops, ocorreu um erro')) continue;
      const achado = detectEquipmentInMessage(parseConsultantOptions(m.content).text)[0];
      if (achado) return { prod: achado.prod, model: achado.model };
    }
    // nada citado ainda: mostra o modelo escolhido no explorador
    if (selectedProduct && selectedModel) return { prod: selectedProduct, model: selectedModel };
    return null;
  })();
  const videoDe = (prod: Product, model: ProductModel) => videoDoEquipamento(prod, model);
  const nomeUsuario = (profile?.name || (logado ? '' : (parceiroViaLink?.nome || publicUser?.name)) || '').replace('Jefferson', 'Jeferson').split(' ').slice(0, 2).join(' ');
  const papelUsuario = logado && profile
    ? (podeEnviarFicha ? 'Equipe' : (profile.role as string) === 'external_seller' ? 'Parceiro' : '')
    : parceiroViaLink ? 'Parceiro'
    : (publicUser as any)?.equipe ? 'Equipe'
      : publicUser?.userType === 'vendedor' ? 'Parceiro'
        : publicUser?.userType === 'cliente' ? 'Cliente' : '';
  const primeiraPergunta = messages.find(m => m.role === 'user' && onboardingStep === 'COMPLETED' && !/^Sou (Cliente|Vendedor)/.test(m.content))?.content || '';
  const tituloConversa = primeiraPergunta ? (primeiraPergunta.length > 70 ? `${primeiraPergunta.slice(0, 70).trim()}...` : primeiraPergunta) : 'Nova conversa';
  const termoBusca = buscaEquip.trim().toLowerCase();
  const equipamentosFiltrados = catalogProducts.filter(p => !termoBusca ||
    (p.name || '').toLowerCase().includes(termoBusca) ||
    (p.models || []).some(m => (m.name || '').toLowerCase().includes(termoBusca)));
  const sugestoesPc = [
    'Que garra para picador de 600 cv?',
    'Produção da GT 600X com tora de 3 m',
    'CMF 500 em escavadeira de 20 t',
  ];
  const conversaVazia = messages.filter(m => m.role === 'user').length === 0;

  const painelNestaConversa = (
    <div className="p-4 space-y-4">
      {!painelAtual && !equipAtual && (
        <div className="mt-6 rounded-2xl border border-dashed border-[#CDD2D7] bg-[#F7F8F9] px-5 py-8 text-center">
          <Layers className="h-7 w-7 mx-auto text-[#9AA1A9]" />
          <p className="mt-3 text-[14px] leading-relaxed text-[#5B6168]">Pergunte sobre um equipamento ou a máquina do cliente e as informações aparecem aqui.</p>
        </div>
      )}

      {painelAtual?.maquina && (() => {
        const mq = painelAtual.maquina!;
        const cor = corServe(mq.serve);
        const linhas: [string, string, boolean][] = [];
        if (mq.transmissao) linhas.push(['Transmissão', mq.transmissao, mq.serve === 'nao']);
        if (mq.tipo && mq.tipo !== mq.transmissao) linhas.push(['Tipo', mq.tipo, false]);
        if (mq.potencia) linhas.push(['Potência', mq.potencia, false]);
        if (cor.texto) linhas.push([equipAtual ? `Serve para ${equipAtual.model.name}?` : 'Serve?', cor.texto, true]);
        return (
          <div className={cn('rounded-2xl border px-4 py-3.5', cor.caixa)}>
            <p className={cn('text-[11px] font-extrabold uppercase tracking-[0.12em]', cor.titulo)}>Máquina do cliente</p>
            <p className="fonte-titulo text-[19px] font-extrabold leading-tight mt-1 text-[#1B1E22]">{mq.nome}</p>
            {linhas.length > 0 && (
              <div className="mt-2.5 divide-y divide-dashed divide-black/10 border-t border-dashed border-black/10">
                {linhas.map(([rot, val, destaque]) => (
                  <div key={rot} className="flex items-baseline justify-between gap-3 py-1.5 text-[14px]">
                    <span className="text-[#5B6168]">{rot}</span>
                    <span className={cn('font-bold text-right', destaque ? cor.valor : 'text-[#1B1E22]')}>{val}</span>
                  </div>
                ))}
              </div>
            )}
            {mq.motivo && <p className="mt-2 text-[13px] text-[#3E444B]">{mq.motivo}</p>}
          </div>
        );
      })()}

      {equipAtual && (() => {
        const { prod, model } = equipAtual;
        const foto = fotoDoModelo(prod, model);
        const specs = specsChave(model);
        return (
          <div className="rounded-2xl border border-[#E1E4E8] bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="relative h-[170px] bg-gradient-to-b from-[#F4F5F6] to-[#DCE0E4] flex items-center justify-center">
              {foto
                ? <MarkdownImage src={foto} className="max-w-[90%] max-h-[150px] m-0 p-0 border-0 bg-transparent shadow-none hover:scale-100 object-contain" />
                : <Package className="h-10 w-10 text-[#9AA1A9]" />}
              {prod.name && <span className="absolute left-3 top-3 max-w-[70%] truncate rounded-md bg-[#1B1E22] px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#fff]">{prod.name}</span>}
            </div>
            <div className="p-4">
              <p className="fonte-titulo text-[19px] font-extrabold leading-tight text-[#1B1E22]">{tituloFicha(prod, model)}</p>
              {specs.length > 0 && (
                <div className={cn('mt-3 grid gap-2', specs.length === 1 ? 'grid-cols-1' : specs.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                  {specs.map(([rot, val]) => (
                    <div key={rot} className="rounded-lg bg-[#F3F4F6] px-2.5 py-2 min-w-0">
                      <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#6B7178] truncate">{rot}</p>
                      <p className="text-[13.5px] font-extrabold text-[#1B1E22] leading-snug break-words">{val}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className={cn('mt-3.5 grid gap-2', podeEnviarFicha ? 'grid-cols-3' : 'grid-cols-2')}>
                <button type="button" onClick={() => verFicha(prod, model)} className="h-11 px-1 whitespace-nowrap rounded-xl border-2 border-[#1B1E22] bg-white text-[#1B1E22] font-extrabold text-[13.5px] hover:bg-[#F3F4F6] transition">Ver ficha</button>
                {podeEnviarFicha && (
                  <button type="button" onClick={() => enviarFicha(prod, model)} className="h-11 px-1 whitespace-nowrap rounded-xl bg-[#1FA855] hover:bg-[#178a45] text-[#fff] font-extrabold text-[13.5px] transition">Enviar PDF</button>
                )}
                <button type="button" onClick={() => handleMakeIndication(prod, model)} className="h-11 px-1 whitespace-nowrap rounded-xl bg-[#F6C400] hover:bg-[#e2b400] text-[#1B1E22] font-extrabold text-[13.5px] transition">Indicar</button>
              </div>
              {podeIndicar && (
                <button type="button" onClick={() => mandarAoClienteWhats(prod, model)} disabled={gerandoLinkCliente === model.id} className="mt-2 h-auto min-h-[44px] w-full rounded-xl border-2 border-[#1FA855] bg-[#E7F8DE] py-2 text-[#0F5E2C] font-extrabold text-[13.5px] leading-tight flex items-center justify-center gap-2 transition disabled:opacity-60">
                  {gerandoLinkCliente === model.id ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Phone className="h-4 w-4 shrink-0" />} Enviar para o WhatsApp do cliente
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {painelAtual?.perguntas && painelAtual.perguntas.length > 0 && ehEquipeConsultor && (
        <details className="group rounded-2xl border border-[#F1DFA6] bg-[#FFF8DB]">
          <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none min-h-11 px-4 flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8A6500]">Pergunte ao cliente ({painelAtual.perguntas.length})</span>
            <ChevronDown className="h-5 w-5 text-[#8A6500] transition-transform group-open:rotate-180" />
          </summary>
          <ul className="px-4 pb-3 -mt-1 space-y-1.5 list-disc pl-9 text-[14px] leading-snug text-[#1B1E22]">
            {painelAtual.perguntas.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </details>
      )}

      {painelAtual?.perguntas && painelAtual.perguntas.length > 0 && !ehEquipeConsultor && (
        <div className="rounded-2xl border border-[#F1DFA6] bg-[#FFF8DB] px-4 py-3.5">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8A6500]">Pergunte ao cliente</p>
          <ul className="mt-2 space-y-1.5 list-disc pl-5 text-[14px] leading-snug text-[#1B1E22]">
            {painelAtual.perguntas.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {painelAtual?.alternativas && painelAtual.alternativas.length > 0 && (
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#5B6168]">Alternativas que servem</p>
          <div className="mt-1.5 divide-y divide-[#E1E4E8] border-y border-[#E1E4E8]">
            {painelAtual.alternativas.map((a, i) => (
              <div key={`${i}-${a.nome}`} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-[14.5px] font-bold text-[#1B1E22]">{a.nome}</span>
                {a.obs && <span className="shrink-0 rounded-md bg-[#E3F5E8] px-2 py-0.5 text-[11.5px] font-extrabold text-[#157F3C]">{a.obs}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const painelFicha = equipAtual ? (
    <div className="p-4 space-y-3">
      <p className="fonte-titulo text-[18px] font-extrabold text-[#1B1E22]">{tituloFicha(equipAtual.prod, equipAtual.model)}</p>
      {specsDoModelo(equipAtual.model).length > 0 ? (
        <div className="rounded-xl border border-[#E1E4E8] divide-y divide-[#E1E4E8] bg-white">
          {specsDoModelo(equipAtual.model).map(([rot, val]) => (
            <div key={rot} className="flex items-baseline justify-between gap-3 px-3 py-2 text-[13.5px]">
              <span className="text-[#5B6168]">{rot}</span>
              <span className="font-bold text-right text-[#1B1E22]">{val}</span>
            </div>
          ))}
        </div>
      ) : <p className="text-[13.5px] text-[#5B6168]">A ficha completa está no PDF.</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => verFicha(equipAtual.prod, equipAtual.model)} className="flex-1 h-11 rounded-xl border-2 border-[#1B1E22] bg-white text-[#1B1E22] font-extrabold text-[14px] hover:bg-[#F3F4F6] transition">Abrir ficha</button>
        {podeEnviarFicha && (
          <button type="button" onClick={() => enviarFicha(equipAtual.prod, equipAtual.model)} className="flex-1 h-11 rounded-xl bg-[#1FA855] hover:bg-[#178a45] text-[#fff] font-extrabold text-[14px] transition flex items-center justify-center gap-1.5"><Send className="h-4 w-4" /> Enviar ficha</button>
        )}
      </div>
    </div>
  ) : (
    <p className="p-6 text-center text-[14px] text-[#5B6168]">A ficha do equipamento da conversa aparece aqui.</p>
  );

  // Biblioteca de vídeos no computador: os do equipamento da conversa primeiro, depois todos com busca
  const blocoVideosPc = videosConsultor.length > 0 ? (() => {
    const pid = equipAtual?.prod.id;
    const ordenados = pid ? [...videosConsultor.filter(v => v.produto_id === pid), ...videosConsultor.filter(v => v.produto_id !== pid)] : videosConsultor;
    return (
      <div className="pt-1">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#6B7178]">Vídeos ({videosConsultor.length})</p>
        <ListaVideos lista={ordenados} foto={fotoDoVideo} />
      </div>
    );
  })() : null;

  const painelFotos = equipAtual ? (() => {
    const { prod, model } = equipAtual;
    const fotos = Array.from(new Set([...(model.images || []), ...(model.images?.length ? [] : [fotoDoModelo(prod, model)])].filter(Boolean))).slice(0, 8) as string[];
    const video = videoDe(prod, model);
    return (
      <div className="p-4 space-y-3">
        {fotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {fotos.map(f => (
              <div key={f} className="aspect-[4/3] rounded-xl bg-gradient-to-b from-[#F4F5F6] to-[#DCE0E4] flex items-center justify-center overflow-hidden">
                <MarkdownImage src={f} className="max-w-full max-h-full m-0 p-1 border-0 bg-transparent shadow-none hover:scale-100 object-contain" />
              </div>
            ))}
          </div>
        ) : <p className="text-[13.5px] text-[#5B6168]">Sem fotos cadastradas para este modelo.</p>}
        {video && (videoPainel === video ? (
          <PlayerVideo url={video} titulo={tituloFicha(prod, model)} onFechar={() => setVideoPainel('')} pid={prod.id} mid={model.id} className="[&>div:first-child]:rounded-xl" />
        ) : (
          <button type="button" onClick={() => setVideoPainel(video)} className="w-full h-11 rounded-xl bg-[#1B1E22] hover:bg-black text-[#fff] font-extrabold text-[14px] flex items-center justify-center gap-2 transition">
            <Video className="h-4 w-4 text-red-500" /> Ver vídeo
          </button>
        ))}
        {blocoVideosPc}
      </div>
    );
  })() : (
    <div>
      <p className="p-6 pb-2 text-center text-[14px] text-[#5B6168]">As fotos e o vídeo do equipamento da conversa aparecem aqui.</p>
      <div className="p-4 pt-2">{blocoVideosPc}</div>
    </div>
  );

  // Tema claro do computador: o mesmo conteúdo da conversa, com a paleta escura trocada só aqui dentro
  const estiloPc = `
.cpc-claro{--color-slate-950:#ECEEF0;--color-slate-900:#FFFFFF;--color-slate-800:#E3E6E9;--color-slate-700:#D3D7DC;--color-slate-600:#B8BEC5;--color-slate-500:#6B7178;--color-slate-400:#5B6168;--color-slate-300:#3E444B;--color-slate-200:#2A2F35;--color-slate-100:#1B1E22;--color-slate-50:#111316;
--color-amber-400:#8A6500;--color-amber-300:#7A5800;--color-emerald-400:#157F3C;--color-emerald-300:#116632;--color-green-400:#157F3C;--color-green-300:#116632;--color-rose-400:#B42318;--color-sky-400:#0369A1;--color-sky-300:#075985;--color-purple-400:#7E22CE;--color-purple-300:#6B21A8;--color-red-950:#FEE2E2;--color-red-200:#991B1B;}
.cpc-claro .text-white{color:#1B1E22}
.cpc-claro .text-white:is(.bg-primary,.bg-red-600,.bg-sky-600,.bg-emerald-500,.msg-usuario,[class*="bg-[#1FA855]"],[class*="bg-[#1B1E22]"]){color:#fff}
.cpc-claro .hover\\:text-white:hover{color:#1B1E22}
.cpc-claro .text-primary-foreground:not(.bg-primary){color:#1B1E22}
.cpc-claro .bg-slate-850{background-color:#fff}
.cpc-claro .from-slate-100{--tw-gradient-from:#F1F5F9}
.cpc-claro .to-slate-300{--tw-gradient-to:#CBD5E1}
.cpc-claro .msg-usuario{background:#1B1E22 !important;color:#fff;border-radius:16px;border-top-right-radius:4px;padding:12px 16px}
.cpc-claro .msg-usuario *{color:#fff}
.cpc-claro .msg-consultor{background:#fff;border-color:#E1E4E8;box-shadow:0 1px 2px rgba(0,0,0,.04);border-radius:16px;border-top-left-radius:4px;padding:14px 18px;max-width:min(88%,720px)}
.cpc-claro .msg-consultor,.cpc-claro .msg-usuario{font-size:15.5px}
.cpc-claro .msg-consultor .markdown-body{font-size:15.5px;color:#1B1E22}
.cpc-claro .msg-consultor strong{color:#1B1E22;font-weight:700}
.cpc-claro .cpc-entrada > div{border:1px solid #DADDE1;border-radius:16px;padding:10px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.cpc-claro .cpc-entrada textarea{border:0;box-shadow:none;font-weight:500;font-size:15.5px;max-height:160px}
@layer base{.cpc-claro .cpc-entrada textarea{min-height:46px !important;height:auto !important}}
.cpc-claro .msg-consultor .border-t:empty{display:none}
.cpc-claro .cpc-entrada textarea:focus{box-shadow:none}
.cpc-claro .cpc-entrada .bg-primary{background:#F6C400;color:#1B1E22}
.cpc-claro .cpc-entrada button{height:42px;min-width:44px;border-radius:12px}
.cpc-claro .cpc-explorador > div{border:1px solid #E1E4E8;border-radius:16px}
`;

  // Celular e janela flutuante: tema claro igual ao do computador, com peças próprias de toque (44 px)
  const estiloCel = `
@layer components{
.ccel .ccel-icone{height:44px;width:44px;padding:0;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;transition:background-color .15s}
.ccel .ccel-icone:active{background-color:rgba(255,255,255,.14)}
.ccel header .ccel-icone{position:relative}
.ccel .ccel-nome{display:block;max-width:min(110px,calc(50% - 170px))}
@media (max-width:459px){.ccel .ccel-nome{display:none}}
@media (max-width:419px){.ccel .ccel-minimizar{display:none}}
.ccel .ccel-rotulo{font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#5B6168;margin:0 2px 8px}
.ccel .ccel-chip{height:44px;padding:0 16px;border-radius:999px;border:1px solid #DADDE1;background-color:#fff;color:#1B1E22;font-size:14.5px;font-weight:700;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;flex-shrink:0}
.ccel .ccel-chip:active{background-color:#F3F4F6}
.ccel .ccel-atalhos{scrollbar-width:none}
.ccel .ccel-atalhos::-webkit-scrollbar{display:none}
}
/* na folha de equipamentos o cabeçalho do explorador sai: a folha já tem título, "Ver todos" e fechar */
.ccel .ccel-folha > div > div:first-child{display:none}
.ccel .ccel-folha > div{border:0;box-shadow:none;background:transparent;padding-top:4px}
.ccel .ccel-folha .font-mono{font-family:inherit}
.ccel .ccel-folha [class*="max-h-[1"]{max-height:none}
.ccel .msg-consultor{max-width:88%;padding:12px 15px}
.ccel .msg-usuario{padding:11px 15px}
.ccel .msg-consultor,.ccel .msg-usuario,.ccel .msg-consultor .markdown-body{font-size:15.5px}
@layer base{.ccel textarea.ccel-campo{min-height:44px !important}}
`;
  // admin em "ver como" com o consultor aberto pelo app (no link público não há simulação)
  const simulandoCel = !!isImpersonating && logado;
  const toqueCel = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const primeiroNomeCel = nomeUsuario.split(' ')[0] || '';
  const saudacaoPerfil = ehParceiroConsultor ? 'Tire dúvidas ou indique um cliente.' : 'Informe a máquina do cliente e o equipamento.';
  const fotoProdutoCel = (prod: Product) =>
    prod.image_url || ((prod as any).images || []).find(Boolean) || (prod.models || []).map(m => fotoDoModelo(prod, m)).find(Boolean) || '';
  // Abre a folha de equipamentos; com um equipamento, já entra no guia dele (igual ao explorador)
  const abrirEquipamentoCel = (prod?: Product) => {
    if (prod) escolherProdutoExplorador(prod);
    setMenuCel(false);
    setExplorerMinimized(false);
    setFolhaEquip(true);
  };

  // Guia de equipamentos dentro da folha do celular, no desenho claro (pedido do Jeferson, 19/10/2026:
  // a versão do computador aparecia com letra de máquina de escrever, cartão apertado e "Ver ficha"
  // difícil de tocar). Faixa de máquina, depois os modelos com "Ver ficha" e "Perguntar" de 44 px.
  const pesoComUnidade = (m: ProductModel) => {
    const sp: any = m.technical_specs || {};
    const bruto = String(sp.peso ?? sp.peso_do_equipamento ?? sp.peso_kg ?? sp.peso_estimado ?? '').trim();
    if (!bruto || bruto === '-') return '';
    return /^[\d.,\s]+$/.test(bruto) ? `${bruto} kg` : bruto;
  };
  const faixaLegivel = (f: string) => String(f || '').replace(/\s*ton\.?$/i, ' t').replace(/\s+t$/i, ' t');
  const voltarGuiaCel = () => {
    if (selectedWeightBand) { setSelectedWeightBand(null); setSelectedModel(null); return; }
    setSelectedProduct(null);
    setSelectedModel(null);
  };
  const perguntarModeloCel = (prod: Product, model: ProductModel) => {
    setFolhaEquip(false);
    enviarPronto(`Me fale sobre o ${tituloFicha(prod, model)}`);
  };
  // Produtividade aparece quando o modelo tem texto de produtividade (cadastro ou padrão) ou é garra traçadora
  const temProdutividadeCel = (prod: Product, model: ProductModel) =>
    !!(String((model as any).productivity_text || '').trim() || DEFAULT_PRODUCTIVITIES[model.name]) ||
    model.name.toUpperCase().includes('GT') ||
    String(prod.category || '').toUpperCase().includes('TRAÇADORA') ||
    prod.name.toUpperCase().includes('TRAÇADORA');
  const blocoExploradorCel = selectedProduct ? (() => {
    const prod = selectedProduct;
    const faixas = getWeightBands(prod);
    const modelos = selectedWeightBand
      ? (getCompatibleModels(prod, selectedWeightBand).length ? getCompatibleModels(prod, selectedWeightBand) : (prod.models || []))
      : [];
    const mostrarModelos = !!selectedWeightBand || faixas.length === 0;
    const lista = selectedWeightBand ? modelos : (prod.models || []);
    return (
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2">
          <button type="button" onClick={voltarGuiaCel} aria-label="Voltar" className="h-11 w-11 shrink-0 p-0 rounded-xl bg-white border border-[#E2E5E8] text-[#1B1E22] flex items-center justify-center active:scale-95 transition">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="m-0 fonte-titulo text-[16px] font-extrabold leading-tight text-[#1B1E22] break-words">{prod.name}</p>
            {selectedWeightBand && selectedWeightBand !== 'Geral' && (
              <p className="m-0 mt-0.5 text-[13px] text-[#5B6168]">Escavadeiras de {faixaLegivel(selectedWeightBand)}</p>
            )}
          </div>
        </div>
        {!mostrarModelos ? (
          <div className="space-y-2">
            <p className="m-0 px-0.5 text-[14.5px] font-semibold text-[#3E444B]">Qual o tamanho da máquina do cliente?</p>
            {faixas.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => { setSelectedWeightBand(f); setSelectedModel(null); }}
                className="w-full h-auto min-h-[52px] px-4 py-2.5 rounded-2xl border border-[#E2E5E8] bg-white flex items-center justify-between gap-3 text-left active:scale-[0.99] transition"
              >
                <span className="text-[15.5px] font-bold text-[#1B1E22]">Máquinas de {faixaLegivel(f)}</span>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#9AA1A9]" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="m-0 px-0.5 text-[14.5px] font-semibold text-[#3E444B]">{lista.length === 1 ? 'Modelo indicado' : 'Modelos indicados'}</p>
            {lista.map(model => {
              const pronto = checkModelStock(model);
              const faixa = faixaDoModelo(model);
              const peso = pesoComUnidade(model);
              const resumo = [faixa ? `Escavadeiras de ${faixaLegivel(faixa)}` : '', peso ? `Peso ${peso}` : ''].filter(Boolean).join(' · ');
              const foto = fotoDoModelo(prod, model);
              return (
                <div key={model.id} className={cn('rounded-2xl border bg-white p-3', selectedModel?.id === model.id ? 'border-[#F6C400]' : 'border-[#E2E5E8]')}>
                  <div className="flex items-center gap-3">
                    <span className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-b from-[#F4F5F6] to-[#E3E6E9] flex items-center justify-center overflow-hidden">
                      {foto
                        ? <MarkdownImage src={foto} className="max-w-full max-h-full m-0 p-1 border-0 bg-transparent shadow-none hover:scale-100 object-contain mix-blend-multiply" />
                        : <Package className="h-6 w-6 text-[#9AA1A9]" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="m-0 fonte-titulo text-[16.5px] font-extrabold leading-tight text-[#1B1E22] break-words">{model.name}</p>
                        <span className={cn('shrink-0 rounded-full px-2 py-[3px] text-[11px] font-extrabold leading-none whitespace-nowrap', pronto ? 'bg-[#F6C400] text-[#111]' : 'bg-[#ECEEF0] text-[#5B6168]')}>
                          {pronto ? 'Pronta entrega' : 'Sob encomenda'}
                        </span>
                      </div>
                      {resumo && <p className="m-0 mt-1 text-[13px] leading-snug text-[#5B6168]">{resumo}</p>}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => verFicha(prod, model)} className="h-11 min-h-[44px] w-full rounded-xl border-2 border-[#1B1E22] bg-white text-[#1B1E22] font-extrabold text-[14.5px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition">
                      <FileText className="h-4 w-4" /> Ver ficha
                    </button>
                    <button type="button" onClick={() => perguntarModeloCel(prod, model)} disabled={loading} className="h-11 min-h-[44px] w-full rounded-xl bg-[#F6C400] text-[#1B1E22] font-extrabold text-[14.5px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50">
                      <MessageSquare className="h-4 w-4" /> Perguntar
                    </button>
                    {/* o explorador antigo sempre oferecia indicar: parceiro indica, visitante pede orçamento */}
                    {(podeIndicar || perfilConsultor === 'visitante') && (
                      <button type="button" onClick={() => handleMakeIndication(prod, model)} className={cn(!podeEnviarFicha && 'col-span-2', "h-11 min-h-[44px] w-full rounded-xl bg-[#1B1E22] text-[#fff] font-extrabold text-[14.5px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition")}>
                        <UserPlus className="h-4 w-4" /> Indicar
                      </button>
                    )}
                    {podeEnviarFicha && (
                      <button type="button" onClick={() => enviarFicha(prod, model)} className={cn(!(podeIndicar || perfilConsultor === 'visitante') && 'col-span-2', "h-auto min-h-[44px] w-full rounded-xl bg-[#1FA855] text-white font-extrabold text-[14.5px] leading-tight flex items-center justify-center gap-1.5 active:scale-[0.98] transition")}>
                        <Send className="h-4 w-4 shrink-0" /> Enviar PDF
                      </button>
                    )}
                    {/* o link público do equipamento: o cliente pede orçamento, vê o vídeo e a ficha sem login */}
                    {podeIndicar && (
                      <button type="button" onClick={() => mandarAoClienteWhats(prod, model)} disabled={gerandoLinkCliente === model.id} className="col-span-2 h-auto min-h-[44px] w-full rounded-xl border-2 border-[#1FA855] bg-[#E7F8DE] text-[#0F5E2C] font-extrabold text-[14.5px] leading-tight py-2 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60">
                        {gerandoLinkCliente === model.id ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Phone className="h-4 w-4 shrink-0" />} Enviar para o WhatsApp do cliente
                      </button>
                    )}
                    {temProdutividadeCel(prod, model) && (
                      <button type="button" onClick={() => { setFolhaEquip(false); enviarPronto(`Produtividade do ${tituloFicha(prod, model)}`); }} disabled={loading} className="h-11 min-h-[44px] w-full rounded-xl border-2 border-[#E2E5E8] bg-white text-[#1B1E22] font-extrabold text-[14.5px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50">
                        <Sparkles className="h-4 w-4" /> Produtividade
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {lista.length === 0 && <p className="py-3 text-[14px] text-[#6B7178]">Nenhum modelo cadastrado.</p>}
          </div>
        )}
      </div>
    );
  })() : null;

  const blocoPc = (
    <div className="cpc-claro fixed inset-0 z-[45] flex flex-col bg-[#ECEEF0] text-[#1B1E22] font-sans notranslate" translate="no">
      <style>{estiloPc}</style>
      {/* Barra do topo */}
      <header className="h-[60px] shrink-0 bg-[#1B1E22] flex items-center justify-between px-5 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <img src="/marca/roder-horizontal.png" alt="Roder" className="h-8 w-auto shrink-0 mix-blend-lighten" />
          <span className="h-6 w-px bg-white/20 shrink-0" />
          <span className="fonte-titulo text-[17px] font-extrabold tracking-[0.06em] text-[#F6C400] truncate">CONSULTOR TÉCNICO</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {[
            { mostra: true, rotulo: 'Calculadora', icone: Calculator, ativo: calcOpen, acao: () => setCalcOpen(!calcOpen) },
            { mostra: true, rotulo: 'Relatório', icone: FileText, ativo: false, acao: () => handleOpenReport() },
            { mostra: podeCompartilhar, rotulo: 'Compartilhar', icone: Share2, ativo: false, acao: () => setIsShareModalOpen(true) },
            { mostra: canTeach, rotulo: knowledgeOpen ? 'Ver conversa' : 'Ensinar IA', icone: Brain, ativo: knowledgeOpen, acao: () => setKnowledgeOpen(!knowledgeOpen) },
          ].filter(b => b.mostra).map(b => (
            <button
              key={b.rotulo}
              type="button"
              onClick={b.acao}
              title={b.rotulo}
              className={cn('h-9 px-2.5 min-[1360px]:px-3.5 rounded-full border text-[13.5px] font-semibold flex items-center gap-1.5 transition',
                b.ativo ? 'border-[#F6C400] bg-[#F6C400] text-[#1B1E22]' : 'border-white/25 text-[#fff]/90 hover:bg-white/10')}
            >
              <b.icone className="h-4 w-4" /> <span className="hidden min-[1360px]:inline">{b.rotulo}</span>
            </button>
          ))}
          {nomeUsuario && (
            <span className="ml-1 h-9 px-3.5 rounded-full border border-white/25 text-[#fff] text-[13.5px] font-semibold flex items-center gap-1.5 max-w-[260px]">
              <User className="h-4 w-4 text-[#F6C400] shrink-0" />
              <span className="truncate">{nomeUsuario}{papelUsuario ? ` · ${papelUsuario}` : ''}</span>
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-[240px_minmax(0,1fr)_340px] min-[1360px]:grid-cols-[260px_minmax(0,1fr)_420px]">
        {/* Coluna da esquerda: nova conversa e equipamentos */}
        <aside className="min-h-0 flex flex-col bg-white border-r border-[#E1E4E8]">
          <div className="p-4 pb-3 space-y-3 shrink-0">
            <button type="button" onClick={handleClearConversation} className="w-full h-11 rounded-xl bg-[#F6C400] hover:bg-[#e2b400] text-[#1B1E22] font-extrabold text-[15px] transition">
              + Nova conversa
            </button>
            {podeIndicar && (
              <button type="button" onClick={tocarIndicar} disabled={loading || !!fluxoInd} className="w-full h-11 rounded-xl border-[1.5px] border-[#1B1E22] bg-white hover:bg-[#FFF6D1] text-[#1B1E22] font-extrabold text-[15px] flex items-center justify-center gap-2 transition disabled:opacity-50">
                <UserPlus className="h-4 w-4" /> Indicar cliente
              </button>
            )}
            <input
              type="search"
              value={buscaEquip}
              onChange={(e) => setBuscaEquip(e.target.value)}
              placeholder="Buscar equipamento..."
              className="w-full h-10 rounded-xl border border-[#DADDE1] bg-white px-3.5 text-[14px] text-[#1B1E22] placeholder-[#8A9097] outline-none focus:border-[#1B1E22]"
            />
          </div>
          <p className="px-4 pb-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#6B7178] shrink-0">Equipamentos</p>
          <nav className="flex-1 min-h-0 overflow-y-auto px-2.5 pb-4">
            {loadingExplorer ? (
              <p className="px-2 py-4 text-[13.5px] text-[#6B7178] flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Carregando catálogo...</p>
            ) : equipamentosFiltrados.length === 0 ? (
              <p className="px-2 py-4 text-[13.5px] text-[#6B7178]">Nenhum equipamento encontrado.</p>
            ) : equipamentosFiltrados.map(prod => {
              const ativo = selectedProduct?.id === prod.id;
              const n = (prod.models || []).length;
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => { escolherProdutoExplorador(prod); setExplorerMinimized(false); }}
                  className={cn('w-full h-auto min-h-10 py-2 px-2.5 rounded-lg text-left flex items-center justify-between gap-2 text-[14.5px] transition',
                    ativo ? 'bg-[#FFF3C2] font-bold text-[#1B1E22]' : 'font-medium text-[#2A2F35] hover:bg-[#F3F4F6]')}
                >
                  <span className="min-w-0 break-words leading-snug">{prod.name}</span>
                  {n > 0 && <span className="shrink-0 text-[12.5px] text-[#8A9097]">{n}</span>}
                </button>
              );
            })}
          </nav>
          {/* Pronta entrega fixa no pé da coluna: gira sozinha e fica visível durante a conversa,
              sem empurrar o que importa (a conversa no centro e o veredito da máquina na direita) */}
          {perfilConsultor !== 'visitante' && temCarrossel && (
            <div className="shrink-0 border-t border-[#E1E4E8] bg-[#F7F8F9] px-3 pt-2.5 pb-2">
              <p className="mb-1.5 px-0.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#6B7178]">{prontaEntrega.length ? 'Pronta entrega' : 'Roder em campo'}</p>
              <CarrosselProntaEntrega compacto itens={prontaEntrega} foto={fotoPe} onPerguntar={perguntarProntaEntrega} onIndicar={onIndicarPe} videos={videosCarrossel} fotoDoVideo={fotoDoVideo} onPerguntarVideo={perguntarVideo} onIndicarVideo={onIndicarPe ? indicarVideo : undefined} />
            </div>
          )}
        </aside>

        {/* Centro: a conversa */}
        <main className="min-h-0 min-w-0 flex flex-col">
          <div className="shrink-0 bg-white border-b border-[#E1E4E8] px-7 py-3.5">
            <p className="fonte-titulo text-[17px] font-extrabold text-[#1B1E22] truncate">{tituloConversa}</p>
            <p className="text-[13px] text-[#6B7178] mt-0.5">Consultor Técnico Roder</p>
          </div>
          {knowledgeOpen ? (
            <div className="flex-1 min-h-0 flex flex-col">{blocoEnsinar}</div>
          ) : (
            <>
              {blocoCalculadora}
              <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
                <div className="max-w-[880px] mx-auto space-y-4">
                  {conversaVazia && onboardingStep === 'COMPLETED' && perfilConsultor !== 'visitante' ? (
                    <div className="space-y-5">
                      <div className="flex justify-start">
                        <div className="msg-consultor border">
                          <p className="m-0 leading-relaxed text-[#1B1E22]">{primeiroNomeCel ? `Olá, ${primeiroNomeCel}! ` : 'Olá! '}{saudacaoPerfil}</p>
                        </div>
                      </div>
                      {ehParceiroConsultor && podeIndicar && (
                        <button type="button" onClick={tocarIndicar} className="w-full max-w-[520px] min-h-[60px] h-auto px-5 py-3 rounded-2xl bg-[#F6C400] hover:bg-[#e2b400] text-[#1B1E22] flex items-center gap-3 text-left transition">
                          <UserPlus className="h-6 w-6 shrink-0" />
                          <span className="min-w-0">
                            <span className="block text-[16px] font-extrabold leading-tight">Indicar um cliente</span>
                            <span className="block text-[13.5px] font-medium leading-snug text-[#3E444B]">Passe os dados ou mande um link para ele</span>
                          </span>
                        </button>
                      )}
                      {ehEquipeConsultor && (
                        <section className="max-w-[640px]">
                          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#6B7178]">Perguntas técnicas</p>
                          <div className="grid grid-cols-2 gap-2.5">
                            {PERGUNTAS_TECNICAS_EQUIPE.map(q => (
                              <button key={q} type="button" onClick={() => enviarPronto(q)} className="h-auto min-h-12 px-4 py-2.5 rounded-2xl border border-[#DADDE1] bg-white text-left text-[14px] font-semibold text-[#2A2F35] hover:border-[#1B1E22] transition leading-snug">
                                {q}
                              </button>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  ) : listaMensagens}
                </div>
              </div>
              <div className="shrink-0 px-7 pb-5 pt-1">
                <div className="max-w-[880px] mx-auto space-y-3">
                  {selectedProduct && !explorerMinimized && (
                    <div className="cpc-explorador max-h-[42vh] overflow-y-auto rounded-2xl">{blocoExplorador}</div>
                  )}
                  {conversaVazia && onboardingStep === 'COMPLETED' && !loading && perfilConsultor === 'visitante' && (
                    <div className="grid grid-cols-3 gap-2.5">
                      {sugestoesPc.map(s => (
                        <button key={s} type="button" onClick={() => enviarPronto(s)} className="h-auto min-h-12 px-4 py-2.5 rounded-2xl border border-[#DADDE1] bg-white text-left text-[14px] font-semibold text-[#2A2F35] hover:border-[#1B1E22] transition leading-snug">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="cpc-entrada">{blocoEntrada}</div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Coluna da direita: o que importa da conversa */}
        <aside className="min-h-0 flex flex-col bg-white border-l border-[#E1E4E8]">
          <div className="shrink-0 flex gap-1 px-3 border-b border-[#E1E4E8]">
            {([['conversa', 'Nesta conversa'], ['ficha', 'Ficha'], ['fotos', 'Fotos e vídeo']] as const).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                onClick={() => setAbaPainel(id)}
                className={cn('h-12 px-2 min-[1360px]:px-3 whitespace-nowrap text-[14px] min-[1360px]:text-[14.5px] border-b-[3px] -mb-px transition',
                  abaPainel === id ? 'border-[#F6C400] font-bold text-[#1B1E22]' : 'border-transparent font-medium text-[#5B6168] hover:text-[#1B1E22]')}
              >
                {rotulo}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {abaPainel === 'conversa' ? painelNestaConversa : abaPainel === 'ficha' ? painelFicha : painelFotos}
          </div>
        </aside>
      </div>
    </div>
  );


  return (
    <ContextoVideo.Provider value={permissaoVideo}>
      {/* Viewport container to keep the draggable floating button fully inside the screen boundaries */}
      <div ref={dragContainerRef} className="fixed inset-0 pointer-events-none z-[44]" />

      {/* Floating Toggle Button */}
      {(!isFullPage || !isOpen) && (
        <motion.div
          drag={!isOpen}
          dragConstraints={dragContainerRef}
          dragMomentum={false}
          dragElastic={0.15}
          className={cn(
            "roder-botao-consultor fixed bottom-6 right-6 z-[45] font-sans notranslate transition-all duration-300 touch-none",
            hasRightDock && "lg:hidden",
            // no celular o consultor aberto ocupa a tela toda e tem minimizar e fechar no topo
            isOpen && "max-sm:hidden"
          )}
          translate="no"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // no computador o consultor abre numa janela própria; no celular continua por cima da tela
              if (!isOpen && !isFullPage && abrirConsultorEmJanela()) return;
              setIsOpen(!isOpen);
            }}
            className={`relative flex items-center justify-center rounded-full shadow-2xl text-[#fff] transition-all duration-300 ${
              isOpen 
                ? 'p-2.5 px-3 sm:p-3.5 sm:px-5 bg-slate-700 hover:bg-slate-800' 
                : 'w-20 h-20 sm:w-auto sm:h-auto p-2 sm:p-3.5 sm:px-5 bg-black hover:bg-neutral-900 border-2 border-amber-500/50'
            }`}
            style={{ boxShadow: isOpen ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(245, 158, 11, 0.35)' }}
          >
            {isOpen ? (
              <div className="flex items-center gap-2">
                <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                <div className="flex flex-col items-start leading-none text-left">
                  <span className="text-[7.5px] sm:text-[9px] opacity-80 font-medium uppercase tracking-wider">
                    Assistente
                  </span>
                  <span className="text-[9.5px] sm:text-xs font-black tracking-tight uppercase">
                    Fechar ✕
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile "Bolinha" (Roder Consultor) - Text Only, Elegant Typography */}
                <div className="sm:hidden flex flex-col items-center justify-center text-center w-full h-full p-1 leading-tight select-none">
                  <span className="text-[8.5px] font-medium tracking-wider text-[#fff]/80 uppercase">
                    Consultor
                  </span>
                  <span className="text-[14px] font-black tracking-widest text-[#fff] uppercase my-0.5 animate-pulse drop-shadow-sm">
                    RODER
                  </span>
                  <span className="text-[8.5px] font-bold tracking-wider text-[#fff]/90 uppercase">
                    Técnico
                  </span>
                </div>

                {/* Desktop standard pill */}
                <div className="hidden sm:flex items-center gap-2">
                  <Wrench className="h-4.5 w-4.5 sm:h-5 sm:w-5 animate-bounce" />
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[7.5px] sm:text-[9px] opacity-80 font-medium uppercase tracking-wider">
                      Consultor Técnico
                    </span>
                    <span className="text-[9.5px] sm:text-xs font-black tracking-tight uppercase">
                      Roder IA
                    </span>
                  </div>
                </div>
              </>
            )}

            {messages.length > 1 && !isOpen && (
              <span className="absolute -top-1 -left-1 flex h-3.5 w-3.5 z-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white"></span>
              </span>
            )}

            {!isOpen && (
              <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse border border-white shadow z-10">
                IA
              </div>
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Computador, página inteira: ambiente de 3 colunas (tema claro) */}
      {isOpen && layoutPc && blocoPc}

      {/* Floating Chat Container */}
      <AnimatePresence>
        {isOpen && !layoutPc && (
          <motion.div
            initial={hasRightDock ? { opacity: 0, x: 50 } : { opacity: 0, y: 50, scale: 0.95 }}
            animate={hasRightDock ? { opacity: 1, x: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={hasRightDock ? { opacity: 0, x: 50 } : { opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "cpc-claro ccel fixed bg-[#ECEEF0] border-[#D3D7DC] flex flex-col overflow-hidden z-[90] sm:z-[45] text-[#1B1E22] font-sans notranslate",
              isFullPage
                ? "inset-0 w-full h-full max-h-none rounded-none border-0 sm:top-auto sm:left-auto sm:bottom-6 sm:right-6 sm:w-[480px] sm:h-[85vh] sm:max-h-[800px] sm:border sm:rounded-2xl sm:shadow-3xl"
                : hasRightDock
                  ? "inset-0 sm:inset-auto sm:bottom-22 sm:right-6 sm:w-[480px] sm:h-[80vh] sm:max-h-[720px] sm:border sm:rounded-2xl sm:shadow-3xl lg:top-[65px] lg:bottom-0 lg:right-0 lg:w-[480px] lg:h-[calc(100vh-65px)] lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-b-0 lg:border-r-0 lg:border-l lg:shadow-none"
                  : "inset-0 sm:inset-auto sm:bottom-22 sm:right-6 sm:w-[480px] sm:h-[80vh] sm:max-h-[720px] sm:border sm:rounded-2xl sm:shadow-3xl"
            )}
            style={vvCel ? { top: vvCel.top, height: vvCel.h, bottom: 'auto' } : undefined}
            translate="no"
          >
            <style>{estiloPc + estiloCel}</style>

            {/* "Ver como" no celular: o consultor cobre a tela toda (inclusive a barra laranja do app),
                então a barra da simulação vem aqui dentro, para o admin saber de quem é a tela e poder sair */}
            {simulandoCel && (
              <div className="ccel-simulacao sm:hidden relative z-20 shrink-0 bg-[#EA580C] text-[#fff] flex items-center justify-between gap-2 pl-3 pr-2 pb-1 pt-[calc(env(safe-area-inset-top,0px)+4px)]">
                <span className="min-w-0 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{profile?.name}</span>
                </span>
                <button type="button" onClick={stopImpersonation} className="h-11 min-h-[44px] shrink-0 px-3 rounded-lg bg-white text-[#C2410C] text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1">
                  <EyeOff className="h-3.5 w-3.5" /> Sair da simulação
                </button>
              </div>
            )}
            {/* Barra do topo: logo, nova conversa e o menu com todas as ações */}
            {/* "CONSULTOR" fica no centro exato da barra, qualquer que seja a largura da logo e dos
                botões da direita (pedido do Jeferson em 19/10/2026). Para não encostar nele em tela
                estreita: o nome some abaixo de 460px e, no painel flutuante, o "Minimizar" (que
                também está no menu) some abaixo de 420px. */}
            <header className={cn("relative z-20 shrink-0 bg-[#1B1E22] flex items-center gap-1 pl-3 pr-1.5 pb-1.5", simulandoCel ? "pt-1.5 sm:pt-1.5" : "pt-[calc(env(safe-area-inset-top,0px)+6px)] sm:pt-1.5")}>
              <span className="ccel-titulo pointer-events-none absolute inset-x-0 bottom-1.5 h-11 flex items-center justify-center">
                <span className="fonte-titulo text-[16px] font-extrabold tracking-[0.06em] text-[#F6C400] whitespace-nowrap">CONSULTOR</span>
              </span>
              <img src="/marca/roder-horizontal.png" alt="Roder" className="relative h-7 max-[359px]:h-6 w-auto shrink-0 mix-blend-lighten" />
              <span className="min-w-0 flex-1" />
              {isFullPage && primeiroNomeCel && (
                <span className="ccel-nome relative truncate pr-1 text-[13px] font-medium text-[#C9CED4]" title={nomeUsuario}>{primeiroNomeCel}</span>
              )}
              {isFullPage && (
                <button type="button" onClick={handleClearConversation} title="Nova conversa" aria-label="Nova conversa" className="ccel-icone">
                  <RotateCcw className="h-5 w-5" />
                </button>
              )}
              <button type="button" onClick={() => setMenuCel(v => !v)} title="Mais opções" aria-label="Mais opções" aria-expanded={menuCel} className={cn('ccel-icone', menuCel && 'bg-white/15')}>
                <EllipsisVertical className="h-5 w-5" />
              </button>
              {!isFullPage && (
                <>
                  <button type="button" onClick={() => setIsOpen(false)} title="Minimizar (mantém a conversa)" aria-label="Minimizar" className="ccel-icone ccel-minimizar">
                    <ChevronDown className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={handleEndConversation} title="Encerrar conversa" aria-label="Encerrar conversa" className="ccel-icone">
                    <X className="h-5 w-5" />
                  </button>
                </>
              )}
            </header>

            {menuCel && (
              <>
                <button type="button" aria-label="Fechar menu" onClick={() => setMenuCel(false)} className="absolute inset-0 z-30 h-auto w-auto p-0 bg-black/20 cursor-default" />
                <div role="menu" className={cn("absolute right-2 z-40 w-[250px] max-w-[calc(100%-16px)] rounded-2xl bg-white border border-[#E2E5E8] shadow-[0_12px_32px_rgba(0,0,0,0.18)] py-1.5 overflow-hidden", simulandoCel ? "top-[calc(env(safe-area-inset-top,0px)+106px)] sm:top-[54px]" : "top-[calc(env(safe-area-inset-top,0px)+54px)] sm:top-[54px]")}>
                  {nomeUsuario && (
                    <p className="m-0 px-4 pt-1.5 pb-2 mb-1 border-b border-[#ECEEF0] text-[13px] text-[#5B6168] truncate">
                      <User className="inline h-4 w-4 -mt-0.5 mr-1.5 text-[#8A6500]" />{nomeUsuario}{papelUsuario ? ` · ${papelUsuario}` : ''}
                    </p>
                  )}
                  {[
                    { mostra: true, rotulo: 'Nova conversa', icone: RotateCcw, acao: handleClearConversation },
                    { mostra: true, rotulo: calcOpen ? 'Fechar calculadora' : 'Calculadora', icone: Calculator, acao: () => setCalcOpen(!calcOpen) },
                    { mostra: true, rotulo: 'Relatório em imagem', icone: FileText, acao: () => handleOpenReport() },
                    { mostra: podeCompartilhar, rotulo: 'Compartilhar consultor', icone: Share2, acao: () => setIsShareModalOpen(true) },
                    { mostra: canTeach, rotulo: knowledgeOpen ? 'Voltar à conversa' : 'Ensinar IA', icone: Brain, acao: () => setKnowledgeOpen(!knowledgeOpen) },
                    { mostra: true, rotulo: 'Buscar atualizações', icone: RefreshCw, acao: handleForceUpdate },
                    { mostra: !isFullPage, rotulo: 'Minimizar', icone: ChevronDown, acao: () => setIsOpen(false) },
                    { mostra: !isFullPage, rotulo: 'Encerrar conversa', icone: X, acao: handleEndConversation },
                  ].filter(b => b.mostra).map(b => (
                    <button
                      key={b.rotulo}
                      type="button"
                      role="menuitem"
                      onClick={() => { setMenuCel(false); b.acao(); }}
                      className="w-full h-12 px-4 flex items-center gap-3 text-left text-[15px] font-semibold text-[#1B1E22] hover:bg-[#F3F4F6] active:bg-[#ECEEF0] transition"
                    >
                      <b.icone className="h-5 w-5 shrink-0 text-[#5B6168]" />
                      <span className="truncate">{b.rotulo}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {knowledgeOpen ? (
              blocoEnsinar
            ) : (
              <>
                {blocoCalculadora}

                {/* Conversa (ou a tela de início) */}
                <div ref={listaCelRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 pt-4 pb-3">
                  {conversaVazia && onboardingStep === 'COMPLETED' ? (
                    /* Tela de início com cara de chat (pedido do Jeferson, 19/10/2026): a saudação e uma
                       faixa baixa da pronta entrega. As sugestões ficam em chips logo acima da caixa de texto. */
                    <div className="space-y-3">
                      <div className="msg-consultor border">
                        <p className="text-[15.5px] leading-relaxed text-[#1B1E22] m-0">
                          {primeiroNomeCel ? `Olá, ${primeiroNomeCel}! ` : 'Olá! '}
                          {perfilConsultor !== 'visitante' ? saudacaoPerfil : (podeIndicar ? 'Pergunte sobre um equipamento ou faça uma indicação.' : 'Pergunte sobre um equipamento ou a máquina do cliente.')}
                        </p>
                      </div>
                      {perfilConsultor !== 'visitante' && prontaEntrega.length > 0 && !inputValue.trim() && (
                        <FaixaProntaEntrega itens={prontaEntrega} foto={fotoPe} onPerguntar={perguntarProntaEntrega} onIndicar={onIndicarPe} />
                      )}
                      {/* sem pronta entrega, a faixa mostra os vídeos da biblioteca marcados para o carrossel */}
                      {perfilConsultor !== 'visitante' && prontaEntrega.length === 0 && videosCarrossel.length > 0 && !inputValue.trim() && (
                        <CarrosselProntaEntrega compacto itens={[]} foto={fotoPe} onPerguntar={perguntarProntaEntrega} onIndicar={onIndicarPe} videos={videosCarrossel} fotoDoVideo={fotoDoVideo} onPerguntarVideo={perguntarVideo} onIndicarVideo={onIndicarPe ? indicarVideo : undefined} />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">{listaMensagens}</div>
                  )}
                </div>

                {/* Caixa de texto, com os atalhos logo acima durante a conversa */}
                <div className="shrink-0 px-3 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]">
                  {conversaVazia && onboardingStep === 'COMPLETED' && !inputValue.trim() && (
                    <div className="ccel-atalhos flex gap-2 overflow-x-auto pb-2 -mx-3 px-3">
                      {podeIndicar && !fluxoInd && (ehParceiroConsultor || perfilConsultor === 'visitante') && (
                        <button type="button" onClick={tocarIndicar} disabled={loading} className="ccel-chip border-[#F6C400] bg-[#F6C400] font-extrabold">
                          <UserPlus className="h-4 w-4" /> Indicar um cliente
                        </button>
                      )}
                      {/* Equipamentos logo no começo: é curto e substitui a grade que saiu da tela de início */}
                      <button type="button" onClick={() => abrirEquipamentoCel()} className="ccel-chip">
                        <Menu className="h-4 w-4" /> Equipamentos
                      </button>
                      {(ehEquipeConsultor ? PERGUNTAS_TECNICAS_EQUIPE.slice(0, 2) : sugestoesPc.slice(0, ehParceiroConsultor || podeIndicar ? 1 : 2)).map(q => (
                        <button key={q} type="button" onClick={() => enviarPronto(q)} className="ccel-chip font-semibold">{q}</button>
                      ))}
                    </div>
                  )}
                  {!conversaVazia && onboardingStep === 'COMPLETED' && perfilConsultor !== 'visitante' && (
                    <div className="ccel-atalhos flex gap-2 overflow-x-auto pb-2 -mx-3 px-3">
                      {ehParceiroConsultor ? (<>
                        {podeIndicar && !fluxoInd && (
                          <button type="button" onClick={tocarIndicar} disabled={loading} className="ccel-chip border-[#F6C400] bg-[#F6C400] font-extrabold">
                            <UserPlus className="h-4 w-4" /> Indicar
                          </button>
                        )}
                        {prontaEntrega.length > 0 && (
                          <button type="button" onClick={() => { setMenuCel(false); setFolhaPronta(true); }} className="ccel-chip">Pronta entrega</button>
                        )}
                        {videosConsultor.length > 0 && (
                          <button type="button" onClick={() => { setMenuCel(false); setFolhaVideos(true); }} className="ccel-chip"><Video className="h-4 w-4" /> Vídeos</button>
                        )}
                        <button type="button" onClick={() => abrirEquipamentoCel()} className="ccel-chip">
                          <Menu className="h-4 w-4" /> Equipamentos
                        </button>
                      </>) : (<>
                        <button type="button" onClick={() => abrirEquipamentoCel()} className="ccel-chip">
                          <Menu className="h-4 w-4" /> Equipamentos
                        </button>
                        <button type="button" onClick={() => setCalcOpen(!calcOpen)} className={cn('ccel-chip', calcOpen && 'border-[#F6C400] bg-[#FFF6D1]')}>
                          <Calculator className="h-4 w-4" /> Calculadora
                        </button>
                        {prontaEntrega.length > 0 && (
                          <button type="button" onClick={() => { setMenuCel(false); setFolhaPronta(true); }} className="ccel-chip">Pronta entrega</button>
                        )}
                        {videosConsultor.length > 0 && (
                          <button type="button" onClick={() => { setMenuCel(false); setFolhaVideos(true); }} className="ccel-chip"><Video className="h-4 w-4" /> Vídeos</button>
                        )}
                        {/* equipe que indica: Indicar fica no fim da fila, sem destaque (o técnico vem primeiro) */}
                        {podeIndicar && !fluxoInd && (
                          <button type="button" onClick={tocarIndicar} disabled={loading} className="ccel-chip">
                            <UserPlus className="h-4 w-4" /> Indicar
                          </button>
                        )}
                      </>)}
                    </div>
                  )}
                  {!conversaVazia && onboardingStep === 'COMPLETED' && perfilConsultor === 'visitante' && (
                    <div className="ccel-atalhos flex gap-2 overflow-x-auto pb-2 -mx-3 px-3">
                      {podeIndicar && !fluxoInd && (
                        <button type="button" onClick={tocarIndicar} disabled={loading} className="ccel-chip border-[#F6C400] bg-[#F6C400] font-extrabold">
                          <UserPlus className="h-4 w-4" /> Indicar
                        </button>
                      )}
                      <button type="button" onClick={() => abrirEquipamentoCel()} className="ccel-chip">
                        <Menu className="h-4 w-4" /> Equipamentos
                      </button>
                      <button type="button" onClick={() => setCalcOpen(!calcOpen)} className={cn('ccel-chip', calcOpen && 'border-[#F6C400] bg-[#FFF6D1]')}>
                        <Calculator className="h-4 w-4" /> Calculadora
                      </button>
                      {videosConsultor.length > 0 && (
                        <button type="button" onClick={() => { setMenuCel(false); setFolhaVideos(true); }} className="ccel-chip"><Video className="h-4 w-4" /> Vídeos</button>
                      )}
                    </div>
                  )}
                  {isRecording ? (
                    <div className="min-h-[56px] flex items-center justify-between gap-2 rounded-[28px] border border-[#F3C9C9] bg-[#FDF3F3] pl-4 pr-1.5 py-1.5">
                      <span className="flex items-center gap-2 text-[15px] font-semibold text-[#B42318]">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                        Gravando...
                      </span>
                      <button type="button" onClick={stopRecording} className="h-11 px-4 rounded-full bg-[#B42318] text-[#fff] font-extrabold text-[14px] flex items-center gap-1.5">
                        <Square className="h-3.5 w-3.5 fill-white" /> Enviar
                      </button>
                    </div>
                  ) : transcribing ? (
                    <div className="min-h-[56px] flex items-center gap-2 rounded-[28px] border border-[#DADDE1] bg-white px-4 text-[15px] text-[#5B6168]">
                      <Loader2 className="h-4 w-4 animate-spin" /> Transcrevendo...
                    </div>
                  ) : (
                    <div className="flex items-end gap-1.5 rounded-[24px] border border-[#DADDE1] bg-white pl-4 pr-1.5 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus-within:border-[#1B1E22] transition-colors">
                      <textarea
                        ref={campoCelRef}
                        rows={1}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => { setIsInputFocused(true); const noFim = pertoDoFim.current; setTimeout(() => { if (noFim) rolarListaCelAoFim(); }, 300); }}
                        onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
                        onKeyDown={(e) => {
                          // teclado de computador: Enter envia (Shift+Enter quebra linha); no celular o Enter quebra linha e envia pelo botão
                          if (e.key === 'Enter' && !e.shiftKey && !toqueCel && !(e.nativeEvent as any).isComposing) {
                            e.preventDefault();
                            if (!loading) handleSend();
                          }
                        }}
                        placeholder={onboardingStep === 'COMPLETED' ? 'Escreva sua pergunta...' : 'Digite sua resposta...'}
                        enterKeyHint={toqueCel ? 'enter' : 'send'}
                        className="ccel-campo flex-1 min-w-0 resize-none border-0 bg-transparent p-0 py-[11px] text-[16px] leading-[22px] font-medium text-[#1B1E22] placeholder-[#8A9097] outline-none shadow-none focus:ring-0"
                      />
                      <button type="button" onClick={startRecording} disabled={loading} title="Gravar áudio" aria-label="Gravar áudio" className="h-11 w-11 shrink-0 p-0 rounded-full bg-[#F1F2F4] text-[#1B1E22] flex items-center justify-center active:scale-95 transition disabled:opacity-50">
                        <Mic className="h-5 w-5" />
                      </button>
                      <button type="button" onClick={() => handleSend()} disabled={loading || !inputValue.trim()} title="Enviar" aria-label="Enviar" className="h-11 w-11 shrink-0 p-0 rounded-full bg-[#F6C400] text-[#1B1E22] flex items-center justify-center active:scale-95 transition disabled:opacity-45">
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Folha da pronta entrega: todos os equipamentos em estoque, um embaixo do outro */}
            {folhaPronta && !knowledgeOpen && (
              <div className="absolute inset-0 z-30 flex flex-col justify-end">
                <button type="button" aria-label="Fechar pronta entrega" onClick={() => setFolhaPronta(false)} className="absolute inset-0 h-auto w-auto p-0 bg-black/40 cursor-default" />
                <div role="dialog" aria-label="Pronta entrega" className="relative flex max-h-[85%] flex-col rounded-t-[22px] bg-[#ECEEF0] shadow-[0_-8px_30px_rgba(0,0,0,0.2)] pb-[env(safe-area-inset-bottom,0px)]">
                  <div className="shrink-0 flex items-center justify-between gap-2 pl-4 pr-1.5 pt-2">
                    <p className="fonte-titulo text-[17px] font-extrabold text-[#1B1E22]">Pronta entrega</p>
                    <button type="button" onClick={() => setFolhaPronta(false)} aria-label="Fechar" className="h-11 w-11 p-0 rounded-xl bg-transparent text-[#1B1E22] flex items-center justify-center">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 pb-4 pt-1">
                    <ListaProntaEntrega itens={prontaEntrega} foto={fotoPe} onPerguntar={perguntarProntaEntrega} onIndicar={onIndicarPe} />
                  </div>
                </div>
              </div>
            )}

            {/* Folha dos vídeos: todos, por equipamento, com busca */}
            {folhaVideos && !knowledgeOpen && (
              <div className="absolute inset-0 z-30 flex flex-col justify-end">
                <button type="button" aria-label="Fechar vídeos" onClick={() => setFolhaVideos(false)} className="absolute inset-0 h-auto w-auto p-0 bg-black/40 cursor-default" />
                <div role="dialog" aria-label="Vídeos" className="relative flex max-h-[85%] flex-col rounded-t-[22px] bg-[#ECEEF0] shadow-[0_-8px_30px_rgba(0,0,0,0.2)] pb-[env(safe-area-inset-bottom,0px)]">
                  <div className="shrink-0 flex items-center justify-between gap-2 pl-4 pr-1.5 pt-2">
                    <p className="fonte-titulo text-[17px] font-extrabold text-[#1B1E22]">Vídeos</p>
                    <button type="button" onClick={() => setFolhaVideos(false)} aria-label="Fechar" className="h-11 w-11 p-0 rounded-xl bg-transparent text-[#1B1E22] flex items-center justify-center">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 pb-4 pt-1">
                    <ListaVideos lista={videosConsultor} foto={fotoDoVideo} />
                  </div>
                </div>
              </div>
            )}

            {/* Folha de equipamentos: a mesma lista e o mesmo guia do explorador */}
            {folhaEquip && !knowledgeOpen && (
              <div className="absolute inset-0 z-30 flex flex-col justify-end">
                <button type="button" aria-label="Fechar equipamentos" onClick={() => setFolhaEquip(false)} className="absolute inset-0 h-auto w-auto p-0 bg-black/40 cursor-default" />
                <div className="relative flex max-h-[85%] flex-col rounded-t-[22px] bg-[#ECEEF0] shadow-[0_-8px_30px_rgba(0,0,0,0.2)] pb-[env(safe-area-inset-bottom,0px)]">
                  <div className="shrink-0 flex items-center justify-between gap-2 pl-4 pr-1.5 pt-2">
                    <p className="fonte-titulo text-[17px] font-extrabold text-[#1B1E22]">Equipamentos</p>
                    <div className="flex items-center gap-1">
                      {selectedProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(null);
                            setSelectedWeightBand(null);
                            setSelectedModel(null);
                            setCacambaStep(null);
                            setSelectedMaterial(null);
                            setSelectedCacambaBrand('');
                            setSelectedCacambaModel(null);
                            setRecommendedCacambaCap('');
                          }}
                          className="h-11 px-3 rounded-full text-[14px] font-bold text-[#5B6168] active:bg-black/5"
                        >
                          Ver todos
                        </button>
                      )}
                      <button type="button" onClick={() => setFolhaEquip(false)} aria-label="Fechar" className="h-11 w-11 p-0 rounded-full flex items-center justify-center text-[#5B6168] active:bg-black/5">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  {!selectedProduct ? (
                    <>
                      <div className="shrink-0 px-4 pb-3">
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[#8A9097] pointer-events-none" />
                          <input
                            type="search"
                            value={buscaEquip}
                            onChange={(e) => setBuscaEquip(e.target.value)}
                            placeholder="Buscar equipamento ou modelo..."
                            className="w-full h-11 rounded-xl border border-[#DADDE1] bg-white pl-10 pr-3 text-[16px] text-[#1B1E22] placeholder-[#8A9097] outline-none focus:border-[#1B1E22]"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
                        {loadingExplorer ? (
                          <p className="py-3 text-[14px] text-[#6B7178] flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Carregando catálogo...</p>
                        ) : equipamentosFiltrados.length === 0 ? (
                          <p className="py-3 text-[14px] text-[#6B7178]">Nenhum equipamento encontrado.</p>
                        ) : (
                          <div className="space-y-2">
                            {equipamentosFiltrados.map(prod => {
                              const foto = fotoProdutoCel(prod);
                              const n = (prod.models || []).length;
                              return (
                                <button key={prod.id} type="button" onClick={() => abrirEquipamentoCel(prod)} className="w-full h-auto min-h-[60px] p-2.5 rounded-2xl border border-[#E2E5E8] bg-white flex items-center gap-3 text-left active:scale-[0.99] transition">
                                  <span className="h-10 w-10 shrink-0 rounded-[10px] bg-[#FFF6D1] flex items-center justify-center overflow-hidden">
                                    {foto
                                      ? <MarkdownImage src={foto} className="max-w-full max-h-full m-0 p-0.5 border-0 bg-transparent shadow-none hover:scale-100 object-contain mix-blend-multiply" />
                                      : <Package className="h-5 w-5 text-[#B08A00]" />}
                                  </span>
                                  <span className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-[#1B1E22] break-words">{prod.name}</span>
                                  {n > 0 && <span className="shrink-0 text-[13px] text-[#8A9097]">{n}</span>}
                                  <ChevronRight className="h-4.5 w-4.5 shrink-0 text-[#9AA1A9]" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    selectedProduct.name.toLowerCase().includes('caçamba') ? (
                      <div className="cpc-explorador ccel-folha flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-4">{blocoExplorador}</div>
                    ) : (
                      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">{blocoExploradorCel}</div>
                    )
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real Roder Image Report Modal */}
      <AnimatePresence>
        {isReportOpen && (
          <div style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)' }} className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-start md:items-center justify-center p-2 sm:p-4 md:p-6 no-print-backdrop">
            <div className="bg-slate-900 border border-slate-880 text-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header Controls */}
              <div className="bg-slate-950 px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1 rounded-lg bg-primary/10 text-primary shrink-0">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white uppercase truncate">{reportTitle}</span>
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-wrap sm:flex-nowrap justify-end">
                  {/* parceiro do link pessoal só vê: sem PDF e sem salvar */}
                  {!parceiroViaLink && (<>
                  <button
                    onClick={handleSharePdfWhatsapp}
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold uppercase text-[9px] sm:text-[10px] tracking-wider rounded-lg transition shadow cursor-pointer border-0 shrink-0"
                    title="Gerar PDF e abrir no WhatsApp para enviar diretamente ao cliente"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Compartilhar PDF no WhatsApp
                  </button>

                  <button
                    onClick={handleDownloadReportPng}
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold uppercase text-[9px] sm:text-[10px] tracking-wider rounded-lg transition cursor-pointer shrink-0"
                    title="Salvar imagem no celular ou enviar direto para Fotos"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-green-400" /> Salvar em Fotos
                  </button>
                  </>)}

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(reportContent.replace(/[*#]/g, ''));
                      toast.success("Texto do relatório copiado para a área de transferência!");
                    }}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-extrabold uppercase text-[9px] sm:text-[10px] tracking-wider rounded-lg transition cursor-pointer shrink-0"
                    title="Copiar texto limpo para colar no WhatsApp"
                  >
                    Copiar Texto
                  </button>

                  <button 
                    onClick={() => setIsReportOpen(false)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border-0 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body with Preview */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 bg-slate-950/40 flex justify-center items-start w-full overflow-x-hidden">
                
                {/* Visual Report Container - Responsive on mobile, full 800px max width on desktop */}
                <ReportScaler>
                  <div
                    ref={reportRef}
                    className="bg-white text-[#111] box-border flex flex-col"
                    style={{ width: '794px', minHeight: '1123px', padding: '40px 48px 28px', fontFamily: 'Arial, "Liberation Sans", Helvetica, sans-serif' }}
                  >
                    {/* Cabeçalho padrão Roder (igual às fichas técnicas) */}
                    <div className="flex justify-end">
                      <img src="/roder-logo-ficha.png" alt="Roder" style={{ height: '46px' }} />
                    </div>
                    <div className="mt-4 bg-black text-white text-center font-bold uppercase" style={{ fontSize: '17px', padding: '9px 12px', letterSpacing: '0.02em' }}>
                      {reportTitle.replace(/^Relatório de Análise Técnica\s*-\s*/i, 'Relatório Técnico · ')}
                    </div>
                    <p className="text-right text-[#666]" style={{ fontSize: '11px', marginTop: '6px' }}>Emitido em {new Date().toLocaleDateString('pt-BR')}</p>

                    <div className="flex-1" style={{ fontSize: '13px', lineHeight: 1.6, marginTop: '10px' }}>
                      <ReactMarkdown
                        urlTransform={(url) => url}
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h3 className="font-bold flex items-center gap-2" style={{ fontSize: '15px', margin: '18px 0 8px' }}><span style={{ width: 4, height: 16, background: '#F5B400', display: 'inline-block' }} />{children}</h3>,
                          h2: ({ children }) => <h3 className="font-bold flex items-center gap-2" style={{ fontSize: '15px', margin: '18px 0 8px' }}><span style={{ width: 4, height: 16, background: '#F5B400', display: 'inline-block' }} />{children}</h3>,
                          h3: ({ children }) => <h3 className="font-bold flex items-center gap-2" style={{ fontSize: '14px', margin: '16px 0 6px' }}><span style={{ width: 4, height: 14, background: '#F5B400', display: 'inline-block' }} />{children}</h3>,
                          h4: ({ children }) => <p className="font-bold" style={{ margin: '10px 0 4px' }}>{children}</p>,
                          p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
                          ul: ({ children }) => <ul style={{ listStyle: 'disc', paddingLeft: 20, margin: '0 0 8px' }}>{children}</ul>,
                          ol: ({ children }) => <ol style={{ listStyle: 'decimal', paddingLeft: 20, margin: '0 0 8px' }}>{children}</ol>,
                          li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                          em: ({ children }) => <span>{children}</span>,
                          hr: () => null,
                          table: ({ children }) => <table className="w-full border-collapse" style={{ fontSize: '12px', margin: '8px 0 12px' }}>{children}</table>,
                          thead: ({ children }) => <thead style={{ background: '#111', color: '#fff' }}>{children}</thead>,
                          th: ({ children }) => <th className="text-left font-bold" style={{ padding: '6px 8px' }}>{children}</th>,
                          td: ({ children }) => <td style={{ padding: '6px 8px', borderBottom: '1px solid #ddd' }}>{children}</td>,
                          tr: ({ children }) => <tr className="even:bg-[#f3f3f3]">{children}</tr>,
                          img: ({ node, ...props }) => <span className="block my-3 text-center"><MarkdownImage isLightReport {...props} /></span>,
                          a: ({ node, children }) => <span className="font-bold">{children}</span>
                        }}
                      >
                        {cleanReportText(reportContent)}
                      </ReactMarkdown>
                    </div>

                    {/* Rodapé padrão Roder */}
                    <div className="mt-6 pt-2 flex items-center justify-between text-[#444]" style={{ borderTop: '1px solid #999', fontSize: '11px' }}>
                      <span style={{ width: 20 }} />
                      <span>www.roderbrasil.com.br</span>
                      <span>1</span>
                    </div>
                  </div>
                </ReportScaler>
              </div>

              {/* Informative Help Footer inside Modal */}
              <div className="bg-slate-950 p-4 border-t border-slate-800 text-center text-xs text-slate-400 shrink-0">
                Pressione o botão <span className="text-green-400 font-bold">Salvar em Fotos</span> para fazer o download direto da imagem de alta definição. Você também pode copiar o texto limpo para colá-lo diretamente no WhatsApp do cliente.
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Fichas acima do consultor: no celular ele cobre a tela toda (z 90, acima do topo do app),
          e várias fichas usam z-50, que ficariam escondidas atrás dele */}
      <div className="relative z-[100]">
        {isHighTipFichaOpen && (
          <HighTipFicha onClose={() => setIsHighTipFichaOpen(false)} enviar={fichaParaEnviar} />
        )}

        {isFresaSshFichaOpen && (
          <FresaSshFicha onClose={() => setIsFresaSshFichaOpen(false)} defaultModelId={fresaSshDefaultModel} enviar={fichaParaEnviar} />
        )}

        {isEngateRapidoFichaOpen && (
          <EngateRapidoFicha onClose={() => setIsEngateRapidoFichaOpen(false)} enviar={fichaParaEnviar} />
        )}

        {isGarraEstufagemFichaOpen && (
          <GarraEstufagemFicha onClose={() => setIsGarraEstufagemFichaOpen(false)} enviar={fichaParaEnviar} />
        )}

        {isTrituradorLoaderFaeFichaOpen && (
          <TrituradorLoaderFaeFicha
            onClose={() => setIsTrituradorLoaderFaeFichaOpen(false)}
            defaultModelId={trituradorLoaderFaeDefaultModel}
            enviar={fichaParaEnviar}
          />
        )}

        {isSacadorSac500FichaOpen && (
          <SacadorSac500Ficha onClose={() => setIsSacadorSac500FichaOpen(false)} enviar={fichaParaEnviar} />
        )}

        {isCabecotePodaFichaOpen && (
          <CabecotePodaFicha onClose={() => setIsCabecotePodaFichaOpen(false)} enviar={fichaParaEnviar} />
        )}

        {isCabecoteGmt035FichaOpen && (
          <CabecoteGmt035Ficha onClose={() => setIsCabecoteGmt035FichaOpen(false)} enviar={fichaParaEnviar} />
        )}

        {fichaPadrao && (
          <FichaPadrao product={fichaPadrao.product} model={fichaPadrao.model} onClose={() => setFichaPadrao(null)} />
        )}
      </div>

      {/* 1. Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden text-white shadow-2xl"
            >
              <div className="p-4 bg-gradient-to-r from-primary to-slate-850 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-amber-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider">Compartilhar Consultor</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Gere um link personalizado do **Consultor Técnico Roder** para enviar aos seus clientes. Quando eles acessarem o link, suas consultas serão associadas ao seu perfil de vendedor/indicador.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold text-amber-400/90 tracking-wider">Seu Nome / Referência de Vendas:</label>
                  <input
                    type="text"
                    value={shareRefName}
                    onChange={(e) => setShareRefName(e.target.value)}
                    placeholder="Seu nome ou email"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold text-amber-400/90 tracking-wider font-mono">Link Gerado:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/consultor?ref=${encodeURIComponent(shareRefName || user?.email || 'direto')}`}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 select-all font-mono focus:outline-none"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs px-3"
                      onClick={() => {
                        const url = `${window.location.origin}/consultor?ref=${encodeURIComponent(shareRefName || user?.email || 'direto')}`;
                        navigator.clipboard.writeText(url);
                        toast.success('Link copiado para a área de transferência!');
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-extrabold text-amber-400/90 tracking-wider">Mensagem para o Cliente:</label>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultMsg = `Olá! Sou da equipe Roder e gostaria de compartilhar com você o nosso Consultor Técnico Digital com Inteligência Artificial! 🛠️🤖\n\nCom ele, você pode dimensionar equipamentos, calcular produtividade de garras e cabeçotes em tempo real, e tirar qualquer dúvida técnica sobre nossos produtos diretamente do seu celular.\n\nToque no link abaixo para começar a usar agora mesmo:\n👉 ${window.location.origin}/consultor?ref=${encodeURIComponent(shareRefName || user?.email || 'direto')}`;
                        setShareText(defaultMsg);
                      }}
                      className="text-[9px] font-black text-amber-500 hover:underline uppercase"
                    >
                      Restaurar Padrão
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white leading-relaxed resize-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800/60 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-slate-800 bg-slate-900 text-xs hover:bg-slate-800"
                  onClick={() => setIsShareModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-black text-xs gap-1.5 border-0"
                  onClick={() => {
                    const finalUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                    window.open(finalUrl, '_blank');
                    setIsShareModalOpen(false);
                    toast.success('WhatsApp aberto para compartilhamento!');
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Enviar no WhatsApp
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Budget Request Lead Capture Modal */}
      <AnimatePresence>
        {isBudgetFormOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden text-white shadow-2xl"
            >
              <div className="p-4 bg-gradient-to-r from-primary to-slate-850 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider">Solicitar Orçamento</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBudgetFormOpen(false)}
                  className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleBudgetSubmit}>
                <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                  <div className="bg-slate-950 p-3.5 border border-slate-800 rounded-xl space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">Equipamento Selecionado:</p>
                    <p className="text-xs font-semibold text-white">{budgetEquipName || 'Equipamento Roder (Dimensionamento)'}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Nome do Cliente *</label>
                      <input
                        type="text"
                        required
                        value={budgetContactName}
                        onChange={(e) => setBudgetContactName(e.target.value)}
                        placeholder="Ex: João Silva"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Nome da Empresa</label>
                      <input
                        type="text"
                        value={budgetCompanyName}
                        onChange={(e) => setBudgetCompanyName(e.target.value)}
                        placeholder="Ex: Madeiras Silva Ltda"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">WhatsApp / Celular *</label>
                      <input
                        type="tel"
                        required
                        value={budgetPhone}
                        onChange={(e) => setBudgetPhone(e.target.value)}
                        placeholder="Ex: (19) 99999-9999"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">CNPJ (Não Obrigatório)</label>
                      <input
                        type="text"
                        value={budgetCNPJ}
                        onChange={(e) => setBudgetCNPJ(e.target.value)}
                        placeholder="Ex: 00.000.000/0001-00"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Cidade / Estado *</label>
                      <input
                        type="text"
                        required
                        value={budgetLocation}
                        onChange={(e) => setBudgetLocation(e.target.value)}
                        placeholder="Ex: Sorocaba / SP"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Qual é a Máquina / Escavadeira</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={budgetMachineBrand}
                          onChange={(e) => setBudgetMachineBrand(e.target.value)}
                          placeholder="Ex: Komatsu"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] focus:outline-none focus:border-amber-400 text-white font-medium"
                        />
                        <input
                          type="text"
                          value={budgetMachineModel}
                          onChange={(e) => setBudgetMachineModel(e.target.value)}
                          placeholder="Ex: PC200"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] focus:outline-none focus:border-amber-400 text-white font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Observações / Detalhes</label>
                      <div className="flex items-center gap-1.5">
                        {isBudgetRecording && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}
                        <p className="text-[9px] text-slate-400 italic font-bold">
                          {isBudgetRecording 
                            ? (budgetRecordingMode === 'hold' ? "Gravando (solte para parar)..." : "Gravando (clique para parar)...") 
                            : "Pressione ou clique no 🎤 para ditar"}
                        </p>
                      </div>
                    </div>
                    <div className="relative flex items-center">
                      <textarea
                        rows={3}
                        value={budgetObservations}
                        onChange={(e) => setBudgetObservations(e.target.value)}
                        placeholder="Diga ou digite observações (ex: diâmetro da madeira, tipo de serviço, local de instalação, etc...)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-12 py-2.5 text-xs focus:outline-none focus:border-amber-400 text-white font-medium resize-none leading-relaxed"
                      />
                      <button
                        type="button"
                        onMouseDown={handleMicPressStart}
                        onMouseUp={handleMicPressEnd}
                        onTouchStart={handleMicPressStart}
                        onTouchEnd={handleMicPressEnd}
                        className={`absolute right-2.5 bottom-2.5 p-2 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${
                          isBudgetRecording 
                            ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white scale-110 shadow-lg shadow-red-500/20' 
                            : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-650 text-amber-400 border border-slate-700 hover:border-amber-500/30'
                        }`}
                        title="Segure para gravar ou clique para iniciar/parar"
                      >
                        <Mic className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border-t border-slate-800/60 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-slate-800 bg-slate-900 text-xs hover:bg-slate-800"
                    onClick={() => setIsBudgetFormOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={budgetSubmitLoading}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black text-xs gap-1.5 border-0 animate-pulse hover:animate-none"
                  >
                    {budgetSubmitLoading ? 'Enviando...' : 'Solicitar Orçamento'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. System Sincronização / Update Screen Overlay */}
      {isUpdating && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center font-sans">
          <div className="flex flex-col items-center max-w-sm text-center px-6">
            <div className="relative">
              <RefreshCw className="h-12 w-12 text-amber-500 animate-spin" />
              <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-amber-500/20 animate-pulse" />
            </div>
            <h3 className="text-white font-black text-lg mt-6 tracking-wide">Sincronizando Sistema</h3>
            <p className="text-slate-400 text-xs mt-2 min-h-[32px]">
              {updateStatus || "Baixando a versão mais recente diretamente do servidor..."}
            </p>
            
            <div className="w-48 bg-slate-800 h-2 rounded-full mt-6 overflow-hidden relative">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${updateProgress}%` }}
              />
            </div>
            
            <div className="text-[10px] text-slate-500 font-mono mt-4 uppercase tracking-widest animate-pulse">
              RODER DIGITAL LABS
            </div>
          </div>
        </div>
      )}
    </ContextoVideo.Provider>
  );
}
