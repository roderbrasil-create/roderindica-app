import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Minus, Send, Calculator, Wrench, HelpCircle, AlertTriangle, Play, RefreshCw, Trash2, ChevronLeft, ChevronRight, CheckCircle, Package, Layers, Tractor, FileText, Mic, Square, Loader2, Brain, BookOpen, ExternalLink, Share2, Video, Phone, QrCode, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn, getApiBaseUrl } from '../../lib/utils';
import { collection, getDocs, query, orderBy, addDoc, doc, getDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { askEngineerHelper, transcribeAudio, analyzeAndEnrichProductDossier } from '../../services/geminiService';
import { useAuth } from '../../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Product, ProductModel, StockItem } from '../../types';
import { MACHINES, MATERIALS, getRecommendedBucket, calculateDischargeHeights, getHighTipBucketWeight } from '../catalog/HighTipData';
import { RODER_LOGO_BASE64, RODER_LOGO_WHITE_BASE64 } from '../catalog/RoderLogo';
import { toPng } from 'html-to-image';
import { HighTipFicha } from '../catalog/HighTipFicha';
import { FresaSshFicha } from '../catalog/FresaSshFicha';
import { EngateRapidoFicha } from '../catalog/EngateRapidoFicha';
import { GarraEstufagemFicha } from '../catalog/GarraEstufagemFicha';
import { TrituradorLoaderFaeFicha } from '../catalog/TrituradorLoaderFaeFicha';

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

  "GT 800x": `TRAÇAMENTO & PRODUTIVIDADE (GARRA TRAÇADORA):
- Rendimento para Metrinho: De 180 a 220 metros estéreos por turno de 8h.
- Máquina Base Recomendada: Escavadeiras de 20 a 30 toneladas.
- Projetada para alta produção e troncos de maior diâmetro.`,

  "GT 1000x": `TRAÇAMENTO & PRODUTIVIDADE (GARRA TRAÇADORA):
- Rendimento para Metrinho: De 220 a 260 metros estéreos por turno de 8h.
- Máquina Base Recomendada: Escavadeiras pesadas de 25 a 35 toneladas.
- Equipamento de altíssima performance para grandes volumes florestais.`,

  "R250": `Produtividade Estimada com base em ciclo de 20 segundos e madeira de 3m:
- Produtividade Horária: Cerca de 108 toneladas por hora.
- Indicada para escavadeiras de 5 a 8 toneladas.`,
  
  "R280": `Produtividade Estimada com base em ciclo de 20 segundos e madeira de 3m:
- Produtividade Horária: Cerca de 121 toneladas por hora.
- Recomendada para escavadeiras de 6 a 10 toneladas. Modelo ideal para alimentação de picador em máquinas de 8t, oferecendo máxima estabilidade e dimensionamento.`,

  "R360": `Produtividade Estimada com base em ciclo de 20 segundos e madeira de 3m:
- Produtividade Horária: Cerca de 155 toneladas por hora.
- Indicada para escavadeiras de 8 a 12 toneladas.`,

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

export const getGTProductivityData = (modelName: string, length: number) => {
  let area = 0.60; // default (GT 600)
  let machineBase = 'Escavadeira de 20 toneladas (PC 200)';
  let chainSpec = '3/4" 11H (Pesada/Reforçada)';
  
  const cleanName = (modelName || '').toUpperCase();
  if (cleanName.includes('280')) {
    area = 0.28;
    machineBase = 'Escavadeira de 6 a 10 toneladas';
    chainSpec = 'Harvester 0.404"';
  } else if (cleanName.includes('360')) {
    area = 0.36;
    machineBase = 'Escavadeira de 8 a 16 toneladas';
    chainSpec = 'Harvester 0.404"';
  } else if (cleanName.includes('400')) {
    area = 0.40;
    machineBase = 'Escavadeira de 14 a 18 toneladas';
    chainSpec = '3/4" 11H (Pesada/Reforçada)';
  } else if (cleanName.includes('600')) {
    area = 0.60;
    machineBase = 'Escavadeira de 20 toneladas (PC 200)';
    chainSpec = '3/4" 11H (Pesada/Reforçada)';
  } else if (cleanName.includes('800')) {
    area = 0.80;
    machineBase = 'Escavadeira de 20 a 30 toneladas';
    chainSpec = '3/4" 11H (Pesada/Reforçada)';
  } else if (cleanName.includes('1000')) {
    area = 1.00;
    machineBase = 'Escavadeira de 25 a 35 toneladas';
    chainSpec = '3/4" 11H (Pesada/Reforçada)';
  }

  // Load factor: 85% average capacity due to tapering/copa loss, offset by pulling extra trees
  const loadFactor = 0.85; 
  
  // Volume per cycle = Area * Length * Load Factor
  const volPerCycle = area * length * loadFactor;

  // Operational efficiency factor (fator de aproveitamento de pátio):
  // 1.0m (metrinho) allows more continuous feeding/piling (30% efficiency)
  // 2.4m and 3.0m require more handling (25% and 22%)
  // 6.0m requires careful positioning and is highly limited by felling/skidder flow (15% efficiency)
  let opEfficiency = 0.30;
  if (length === 6.0) {
    opEfficiency = 0.15;
  } else if (length === 3.0) {
    opEfficiency = 0.22;
  } else if (length === 2.4) {
    opEfficiency = 0.25;
  }

  // Active cycles per hour:
  // - Fast: 20 seconds per cycle = 180 cycles/hour (expert operator, perfect sharpening)
  // - Slow: 30 seconds per cycle = 120 cycles/hour (beginner operator, low sharpening maintenance)
  const hourlyMin = parseFloat((120 * volPerCycle * opEfficiency).toFixed(1));
  const hourlyMax = parseFloat((180 * volPerCycle * opEfficiency).toFixed(1));

  // 10-hour standard forest shift
  const shiftMin = Math.round(hourlyMin * 10);
  const shiftMax = Math.round(hourlyMax * 10);

  // Monthly estimate (22 working days, 10 hours per day)
  const monthlyMin = Math.round(hourlyMin * 10 * 22);
  const monthlyMax = Math.round(hourlyMax * 10 * 22);

  return {
    area,
    loadFactor,
    chainSpec,
    hourlyMin,
    hourlyMax,
    shiftMin,
    shiftMax,
    monthlyMin,
    monthlyMax,
    machineBase,
    cycleRange: '20s a 30s',
    opEfficiency: Math.round(opEfficiency * 100)
  };
};

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

const PRODUCT_VIDEOS: Record<string, string> = {
  "CMF 600": "https://www.youtube.com/watch?v=0_u6eJ6-YnQ",
  "CMF 500": "https://www.youtube.com/watch?v=Aof_7Q-fS1s",
  "CMF 800": "https://www.youtube.com/watch?v=t5A9Tj_C9n4",
  "GPR 4500": "https://www.youtube.com/watch?v=W0ybyuB9gB0",
  "GPR 7000": "https://www.youtube.com/watch?v=W0ybyuB9gB0",
  "R250": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R280": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R360": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R360G": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R400": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R600": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R800": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "SSH 150": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH 200": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH 225": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH 250": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH-150": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH-200": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH-225": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH-250": "https://www.youtube.com/watch?v=na5Z2tLWMgA"
};

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MarkdownImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  isLightReport?: boolean;
}

const MarkdownImage: React.FC<MarkdownImageProps> = ({ src, isLightReport, ...props }) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    if (!src) {
      setLoading(false);
      return;
    }

    if (src.startsWith('db-file://')) {
      const fileId = src.replace('db-file://', '');
      getDoc(doc(db, 'app_files', fileId))
        .then(docSnap => {
          if (active) {
            if (docSnap.exists()) {
              setResolvedSrc(docSnap.data().data || '');
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
      const proxied = (src.startsWith('http://') || src.startsWith('https://'))
        ? `${getApiBaseUrl()}/api/proxy-image?url=${encodeURIComponent(src)}`
        : src;
      if (active) {
        setResolvedSrc(proxied);
        setLoading(false);
      }
    }

    return () => {
      active = false;
    };
  }, [src]);

  if (loading) {
    return (
      <div className={cn(
        "w-32 h-24 sm:w-48 sm:h-36 animate-pulse rounded-xl border flex items-center justify-center my-3 mx-auto sm:mx-0",
        isLightReport 
          ? "bg-slate-100 border-slate-200 text-slate-400" 
          : "bg-slate-800/40 border-slate-700/50 text-slate-400"
      )}>
        <span className="text-[9px] font-medium">Carregando...</span>
      </div>
    );
  }

  if (!resolvedSrc) return null;

  return (
    <img
      {...props}
      src={resolvedSrc}
      referrerPolicy="no-referrer"
      className={cn(
        "max-w-[100%] rounded-xl shadow-xl my-3 block object-contain p-1.5",
        isLightReport
          ? "sm:max-w-[340px] max-h-56 border border-slate-200 bg-slate-50 mx-auto"
          : "sm:max-w-[320px] max-h-48 border border-slate-800 bg-slate-900/40 transition-transform hover:scale-105 duration-200",
        props.className
      )}
    />
  );
};

export default function EngineerHelper({ isFullPage = false }: { isFullPage?: boolean } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAdmin, isManager } = useAuth();
  
  // Only registered sellers/partners should have sharing access
  const isRegisteredUser = user && profile?.role && !['client', 'visitor'].includes(profile.role);
  
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
  const [fresaSshDefaultModel, setFresaSshDefaultModel] = useState<'ssh-150' | 'ssh-200' | 'ssh-225' | 'ssh-250'>('ssh-150');
  const [trituradorLoaderFaeDefaultModel, setTrituradorLoaderFaeDefaultModel] = useState<string>('fae-uml-ssl-vt-175');

  const openTechnicalSheet = (url: string, modelName?: string) => {
    if (!url) return;
    
    const lowerUrl = url.toLowerCase();
    
    // Check if the link is related to Triturador/Desbastador FAE p/ Pá Carregadeira
    if (lowerUrl.includes('loader-fae') || lowerUrl === 'loader-fae') {
      const targetModelName = modelName || '';
      const modelHint = targetModelName.toLowerCase();
      if (modelHint.includes('140') || modelHint.includes('pm') || modelHint.includes('200')) {
        setTrituradorLoaderFaeDefaultModel('fae-140-u-pm-200');
      } else {
        setTrituradorLoaderFaeDefaultModel('fae-uml-ssl-vt-175');
      }
      setIsTrituradorLoaderFaeFichaOpen(true);
      return;
    }

    // Check if the link is related to Caçamba High Tip or High Tip
    if (lowerUrl.includes('cacamba-high-tip') || lowerUrl.includes('high-tip')) {
      setIsHighTipFichaOpen(true);
      return;
    }

    // Check if the link is related to Engate Rapido
    if (lowerUrl.includes('engate-rapido') || lowerUrl === 'engate-rapido' || (modelName && modelName.toLowerCase().includes('engate'))) {
      setIsEngateRapidoFichaOpen(true);
      return;
    }

    // Check if the link is related to Garra para Estufagem
    if (lowerUrl.includes('estufagem') || lowerUrl === 'estufagem' || (modelName && modelName.toLowerCase().includes('estufagem'))) {
      setIsGarraEstufagemFichaOpen(true);
      return;
    }

    // Check if the link is related to Fresa FAE SSH
    if (
      lowerUrl.includes('catalogo-tratores') || 
      lowerUrl.includes('fresa-ssh') || 
      lowerUrl.includes('fresa-trituradora') || 
      lowerUrl.includes('ssh-') ||
      lowerUrl === 'fresa-ssh'
    ) {
      const targetModelName = modelName || '';
      const modelHint = targetModelName ? targetModelName.toLowerCase() : lowerUrl;
      
      if (modelHint.includes('150')) {
        setFresaSshDefaultModel('ssh-150');
      } else if (modelHint.includes('200')) {
        setFresaSshDefaultModel('ssh-200');
      } else if (modelHint.includes('225')) {
        setFresaSshDefaultModel('ssh-225');
      } else if (modelHint.includes('250')) {
        setFresaSshDefaultModel('ssh-250');
      } else {
        setFresaSshDefaultModel('ssh-150');
      }
      setIsFresaSshFichaOpen(true);
      return;
    }

    // Fallback: If it's a standard URL, open in a new tab safely
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
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
    return [
      {
        id: 'initial-welcome',
        role: 'assistant',
        content: 'Olá! Sou o **Consultor Técnico RODER** 🛠️. Estou aqui para ajudar você a dimensionar e indicar o equipamento ideal para a sua escavadeira ou pá carregadeira, além de calcular produtividade. Como posso ajudar hoje?'
      }
    ];
  });
  
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
  const [budgetContactName, setBudgetContactName] = useState('');
  const [budgetCNPJ, setBudgetCNPJ] = useState('');
  const [budgetPhone, setBudgetPhone] = useState('');
  const [budgetMachineBrand, setBudgetMachineBrand] = useState('');
  const [budgetMachineModel, setBudgetMachineModel] = useState('');
  const [budgetEquipName, setBudgetEquipName] = useState('');
  const [budgetSubmitLoading, setBudgetSubmitLoading] = useState(false);

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
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      };

      const dataUrl = await toPng(element, options);
      const link = document.createElement('a');
      link.download = `Relatorio_Tecnico_Roder_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Imagem do relatório salva com sucesso na sua galeria!", { id: toastId });
    } catch (error) {
      console.error("Error generating report image:", error);
      toast.error("Erro ao gerar imagem. Por favor, tente novamente.", { id: toastId });
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

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];

    if (loading) {
      // While loading, scroll to bottom to show the loading indicator
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (lastMsg.role === 'user') {
      // User sent a message, scroll to bottom so they see their query and loading status
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (lastMsg.role === 'assistant') {
      // Assistant replied. Let's scroll to the user's question (second-to-last message)
      // so the user's question and the beginning of the assistant's response are visible.
      const questionIndex = messages.length - 2;
      const questionElement = document.getElementById(`chat-message-${questionIndex}`);
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, loading]);

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
        content: 'Olá! Conversa limpa. Sou o **Consultor Técnico RODER** 🛠️. Como posso te ajudar hoje?'
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
        content: 'Olá! Sou o **Consultor Técnico RODER** 🛠️. Estou aqui para ajudar você a dimensionar e indicar o equipamento ideal para a sua escavadeira ou pá carregadeira, além de calcular produtividade. Como posso ajudar hoje?'
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
    toast.success('Conversa encerrada e limpa.');
  };

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || inputValue).trim();
    if (!queryText) return;

    if (!textToSend) {
      setInputValue('');
    }

    // Auto minimize compatibility explorer when typing/submitting text
    setExplorerMinimized(true);

    // Spy Protection / Usage Limits check
    const isVisitor = !user || !profile?.role || (profile.role as string) === 'client' || (profile.role as string) === 'visitor';
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
        updatedMessages.slice(1, -1).map(({ role, content }) => ({ role, content })),
        {
          uid: user?.uid,
          name: (profile?.name || user?.displayName || user?.email || 'Anônimo').replace('Jefferson', 'Jeferson'),
          email: profile?.email || user?.email || '',
          role: profile?.role || 'visitor',
          referredBy: localStorage.getItem('roder_consultant_ref') || ''
        }
      );
      const assistantMsgId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: response }]);
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
    const history = messages.slice(1, userMsgIdx).map(({ role, content }) => ({ role, content }));

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
          uid: user?.uid,
          name: (profile?.name || user?.displayName || user?.email || 'Anônimo').replace('Jefferson', 'Jeferson'),
          email: profile?.email || user?.email || '',
          role: profile?.role || 'visitor',
          referredBy: localStorage.getItem('roder_consultant_ref') || ''
        }
      );
      const assistantMsgId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: response }]);
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
              content: "Não foi possível transcrever o áudio. Tente novamente."
            }
          ]);
          toast.error("Não foi possível transcrever o áudio. Tente novamente.");
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
                    content: "Não foi possível transcrever o áudio. Tente novamente."
                  }
                ]);
                toast.error('Não foi possível transcrever o áudio. Tente novamente.');
              }
            } catch (error: any) {
              toast.dismiss('voice-transcribe');
              console.error("Transcription error:", error);
              setMessages(prev => [
                ...prev,
                {
                  id: `silence-${Date.now()}`,
                  role: 'assistant',
                  content: "Não foi possível transcrever o áudio. Tente novamente."
                }
              ]);
              toast.error('Não foi possível transcrever o áudio. Tente novamente.');
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
    handleSend(calcText);
  };

  // Helper to extract distinct weight bands from product models
  const getWeightBands = (prod: Product) => {
    if (!prod.models) return [];
    const bands = new Set<string>();
    prod.models.forEach(m => {
      const mb = m.technical_specs?.maquina_base || m.technical_specs?.peso_operacional;
      if (mb) bands.add(mb.trim());
    });
    return Array.from(bands);
  };

  // Helper to filter models compatible with a selected band
  const getCompatibleModels = (prod: Product, band: string) => {
    if (!prod.models) return [];
    return prod.models.filter(m => {
      const mb = m.technical_specs?.maquina_base || m.technical_specs?.peso_operacional;
      return mb && mb.trim().toLowerCase() === band.toLowerCase();
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
  const handleMakeIndication = (prod: Product, model: ProductModel) => {
    const productFullName = `${prod.name} - ${model.name}`;
    const isVisitor = !user || !profile?.role || (profile.role as string) === 'client' || (profile.role as string) === 'visitor';
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

      const docData = {
        client_name: budgetContactName,
        client_cnpj: budgetCNPJ || 'Não informado',
        client_phone: budgetPhone,
        client_email: 'contato@roderindica.com.br',
        company_name: budgetContactName,
        client_location: '',
        base_machine: `${budgetMachineBrand} ${budgetMachineModel}`.trim() || 'Não informado',
        observations: `Solicitação via Consultor Técnico Digital. Equipamento de interesse: ${budgetEquipName || 'Não especificado'}.`,
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
          company_name: budgetContactName,
          city: '',
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
      
      setBudgetContactName('');
      setBudgetCNPJ('');
      setBudgetPhone('');
      setBudgetMachineBrand('');
      setBudgetMachineModel('');
      setIsBudgetFormOpen(false);

      setMessages(prev => [
        ...prev,
        {
          id: `budget-success-${Date.now()}`,
          role: 'assistant',
          content: `✅ **Obrigado! Sua solicitação de orçamento foi enviada para o nosso setor comercial.**\n\nNossa equipe (Gislene e Luana) já recebeu os dados do contato **${budgetContactName}** para o equipamento **${budgetEquipName || 'Roder'}** e entrará em contato em breve via WhatsApp (**${budgetPhone}**).\n\nSe tiver mais alguma dúvida ou quiser simular outro produto, sinta-se à vontade para continuar!`
        }
      ]);
    } catch (error: any) {
      console.error('Error submitting public budget:', error);
      toast.error('Erro ao enviar solicitação de orçamento: ' + error.message);
    } finally {
      setBudgetSubmitLoading(false);
    }
  };

  // Download technical sheet document as .txt / .md
  const handleDownloadTechnicalSheet = () => {
    if (!selectedModel || !selectedProduct) return;
    
    const specsStr = Object.entries(selectedModel.technical_specs || {})
      .filter(([_, val]) => val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim() !== '-')
      .map(([key, val]) => `- ${key.replace(/_/g, ' ').toUpperCase()}: ${val}`)
      .join('\n');

    const imageUrl = selectedModel.images?.[0] || selectedProduct.image_url || '';

    const isGT = selectedModel.name.toUpperCase().includes('GT') || 
                 selectedProduct.category.toUpperCase().includes('TRAÇADORA') || 
                 selectedProduct.name.toUpperCase().includes('TRAÇADORA');

    let prodSection = effectiveProductivityText;
    if (isGT) {
      const gtData = getGTProductivityData(selectedModel.name, gtLength);
      prodSection = `PRODUTIVIDADE CALCULADA PARA MADEIRA DE ${gtLength.toFixed(1)} METROS:
- Rendimento por Hora: ${gtData.hourlyMin} a ${gtData.hourlyMax} m³ estéreo / hora
- Rendimento por Turno (10h): ${gtData.shiftMin} a ${gtData.shiftMax} m³ estéreo / turno
- Estimativa Mensal (Turno 10h/dia, 22 dias/mês): ${(gtData.monthlyMin / 1000).toFixed(1)}k a ${(gtData.monthlyMax / 1000).toFixed(1)}k m³ / mês

PARÂMETROS UTILIZADOS NO CÁLCULO:
• Área de Abertura Útil da Garra: ${gtData.area.toFixed(2)} m²
• Fator de Capacidade Útil (Carga Média): 85% (considera 15% a 20% de perda devido ao afunilamento das árvores em direção à copa, compensada pela habilidade do operador de agarrar troncos adicionais)
• Tempo de Ciclo de Corte: 20s (Operador de alto rendimento, corte super afiado) a 30s (Operador iniciante, falta de afiação correta)
• Fator de Aproveitamento de Pátio / Espera: ${gtData.opEfficiency}% (varia de 15% para toras de 6.0m devido à complexidade de manobras de pátio e abastecimento, até 30% para metrinho de 1.0m de fluxo contínuo)
• Máquina Escavadeira Base Recomendada: ${gtData.machineBase}
• Especificação de Corrente: Passo ${gtData.chainSpec}

------------------------------------------------------------
RECOMENDAÇÕES IMPORTANTES DE ENGENHARIA (SABRES & CORRENTES):
------------------------------------------------------------
1. Manutenção do Conjunto de Corte:
   • É fundamental que o operador trabalhe sempre com a corrente super afiada e bem regulada.
   • Recomendamos a troca preventiva da corrente a cada 2 horas (ou no máximo 2,5 horas). Isso garante menor desgaste mecânico geral e exige apenas uma afiação muito leve (com pouca remoção de material), elevando significativamente a vida útil do conjunto de corte.
   • Sugerimos disponibilizar 5 correntes afiadas para cada turno de trabalho de 10h. Ao término do dia, o operador leva as 5 correntes e o sabre para manutenção/afiação para o dia seguinte.

2. Durabilidade e Vida Útil Estimada:
   • Consumo de Insumos: Em média, uma operação com boa afiação e manutenção consome de 4 a 5 correntes e 1 sabre por mês (baseado em turno de 8 a 10h diárias, 20 a 25 dias por mês).
   • Coroa / Pinhão de Arraste: Durabilidade média de 20 a 30 dias (equivalente a 100 a 400 horas). Em terrenos muito arenosos, onde a poeira e terra acumulam entre as cascas das madeiras, o desgaste do pinhão pode ocorrer mais rapidamente.

3. Sistema de Lubrificação Automática:
   • Vital para a operação. A falta de óleo gera atrito excessivo e aquecimento imediato da corrente e do sabre. O calor excessivo destempera o aço do sabre, causa desalinhamento, empenamento e reduz drasticamente a vida útil de todos os componentes de corte.

4. Especificações de Correntes por Modelo:
   • Modelos GT 280 e GT 360: Utilizam corrente com passo 0.404" (mesmo modelo usado em cabeçotes Harvester).
   • Modelos GT 400X, GT 600X, GT 800X e GT 1000X: Utilizam corrente com passo 3/4" 11H (corrente extremamente robusta e reforçada para trabalho super pesado de traçamento florestal contínuo).

------------------------------------------------------------
TEXTO DE REFERÊNCIA GERAL DO EQUIPAMENTO:
------------------------------------------------------------
${effectiveProductivityText}`;
    }

    const docContent = `============================================================
FICHA TÉCNICA OFICIAL - RODER MÁQUINAS E EQUIPAMENTOS
============================================================

EQUIPAMENTO: ${selectedProduct.name}
MODELO: ${selectedModel.name}
CATEGORIA: ${selectedProduct.category}

------------------------------------------------------------
CARACTERÍSTICAS & ESPECIFICAÇÕES TÉCNICAS
------------------------------------------------------------
${specsStr || 'Nenhuma especificação técnica cadastrada.'}

------------------------------------------------------------
PRODUTIVIDADE ESTIMADA & PERFORMANCE
------------------------------------------------------------
${prodSection || 'Texto de produtividade em processo de homologação técnica.'}

------------------------------------------------------------
SOBRE O EQUIPAMENTO & INDICAÇÕES
------------------------------------------------------------
- Para que serve: ${selectedProduct.description || 'Equipamento de alta robustez e precisão para colheita, traçamento ou movimentação florestal.'}
- Imagem de Referência: ${imageUrl || 'Consulte o catálogo online'}

============================================================
Consultor Técnico Digital RODER - Dimensionamento e Compatibilidade
Engenharia e Criação: Jeferson Roder
Gerado em: ${new Date().toLocaleDateString('pt-BR')}
============================================================`;

    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ficha_Tecnica_Roder_${selectedModel.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Ficha técnica de ${selectedModel.name} baixada com sucesso!`);
  };

  // Parse assistant text to find matched catalog products & models
  const detectEquipmentInMessage = (content: string) => {
    const detected: { prod: Product; model: ProductModel }[] = [];
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
          
          if (regex.test(content) && !matchedModelIds.has(model.id)) {
            matchedModelIds.add(model.id);
            detected.push({ prod, model });
          }
        });
      }
    });

    // Filtering logic to respect user intent:
    // If the message is specifically about Cabeçote/Caçamba Multifuncional (CMF),
    // and CMF 600 is matched, we only show CMF 600 to prevent user confusion.
    const hasCmf600 = detected.some(item => (item.model.name || '').toUpperCase().includes('CMF 600'));
    if (hasCmf600) {
      return detected.filter(item => {
        const nameUpper = (item.model.name || '').toUpperCase();
        if (nameUpper.includes('CMF') && !nameUpper.includes('CMF 600')) {
          return false;
        }
        return true;
      });
    }

    return detected;
  };

  const isCatalog = location.pathname === '/catalogo';
  const hasRightDock = isCatalog && isOpen;

  return (
    <>
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
            "fixed bottom-6 right-6 z-[45] font-sans notranslate transition-all duration-300 touch-none",
            hasRightDock && "lg:hidden"
          )}
          translate="no"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`relative flex items-center justify-center rounded-full shadow-2xl text-white transition-all duration-300 ${
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
                  <span className="text-[8.5px] font-medium tracking-wider text-white/80 uppercase">
                    Consultor
                  </span>
                  <span className="text-[14px] font-black tracking-widest text-white uppercase my-0.5 animate-pulse drop-shadow-sm">
                    RODER
                  </span>
                  <span className="text-[8.5px] font-bold tracking-wider text-white/90 uppercase">
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

      {/* Floating Chat Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={hasRightDock ? { opacity: 0, x: 50 } : { opacity: 0, y: 50, scale: 0.95 }}
            animate={hasRightDock ? { opacity: 1, x: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={hasRightDock ? { opacity: 0, x: 50 } : { opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "fixed bg-slate-900 border-slate-800 flex flex-col overflow-hidden z-[45] text-white font-sans notranslate transition-all duration-300",
              isFullPage
                ? "bottom-0 right-0 w-full h-full max-h-none rounded-none border-0 sm:bottom-6 sm:right-6 sm:w-[480px] sm:h-[85vh] sm:max-h-[800px] sm:border sm:rounded-2xl sm:shadow-3xl"
                : hasRightDock
                  ? "bottom-22 right-4 sm:right-6 w-[94vw] sm:w-[480px] h-[86vh] sm:h-[80vh] max-h-[820px] sm:max-h-[720px] border rounded-2xl shadow-3xl lg:top-[65px] lg:bottom-0 lg:right-0 lg:w-[480px] lg:h-[calc(100vh-65px)] lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-b-0 lg:border-r-0 lg:border-l lg:shadow-none"
                  : "bottom-22 right-4 sm:right-6 w-[94vw] sm:w-[480px] h-[86vh] sm:h-[80vh] max-h-[820px] sm:max-h-[720px] border rounded-2xl shadow-3xl"
            )}
            translate="no"
          >
            {/* Header */}
            <div className={cn(
              "px-3 pb-2 sm:px-4 sm:py-2.5 bg-black border-b border-neutral-900 flex items-center justify-between shadow-md",
              isFullPage ? "pt-[calc(env(safe-area-inset-top,12px)+8px)]" : "pt-2 sm:pt-2.5"
            )}>
              <div className="flex flex-col items-start select-none">
                <span className="text-[7.5px] sm:text-[9px] font-semibold uppercase tracking-wider text-neutral-400 leading-none">
                  Consultor
                </span>
                <div className="flex items-center gap-1 leading-none mt-0.5">
                  <span className="text-xs sm:text-sm font-black tracking-widest text-white uppercase">
                    RODER
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wide">
                    Técnico
                  </span>
                  <span className="ml-1 text-[7px] sm:text-[8px] font-black bg-amber-500 text-slate-950 px-1 py-0.5 rounded uppercase tracking-widest animate-pulse leading-none">
                    IA
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-1.5 sm:px-2 text-slate-300 hover:text-white text-xs gap-1 hover:bg-white/15"
                  onClick={() => setCalcOpen(!calcOpen)}
                  title="Calculadora"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Calculadora</span>
                </Button>

                {canTeach && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-8 px-1.5 sm:px-2 text-xs gap-1 ${
                      knowledgeOpen 
                        ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' 
                        : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                    }`}
                    onClick={() => setKnowledgeOpen(!knowledgeOpen)}
                    title="Ensinar Roder IA (Adicionar Conhecimento por Voz ou Texto)"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">{knowledgeOpen ? 'Ver Chat' : 'Ensinar IA'}</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-1.5 sm:px-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 text-xs gap-1"
                  onClick={() => handleOpenReport()}
                  title="Gerar Relatório em Imagem"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Relatório</span>
                </Button>

                {isRegisteredUser && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-1.5 sm:px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs gap-1"
                    onClick={() => setIsShareModalOpen(true)}
                    title="Compartilhar Consultor via WhatsApp"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Compartilhar</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-1.5 sm:px-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 text-xs gap-1"
                  onClick={handleClearConversation}
                  title="Limpar Conversa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Limpar</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-1.5 sm:px-2 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 text-xs gap-1"
                  onClick={handleForceUpdate}
                  title="Buscar e carregar novas atualizações pendentes"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Atualizar</span>
                </Button>

                {/* Safe Separator */}
                <div className="h-6 w-[1px] bg-slate-800 mx-1" />

                {/* Minimize Button - hides the container but persists conversation */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition-colors flex items-center justify-center h-8 w-8"
                  title="Minimizar (Mantém Conversa)"
                >
                  <Bot className="h-4.5 w-4.5 animate-pulse" />
                </button>

                {/* Close/End Button - triggers handleEndConversation (clears conversation and closes) */}
                <button
                  onClick={handleEndConversation}
                  className="p-1.5 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-red-500/30 transition-colors flex items-center justify-center h-8 w-8 ml-2"
                  title="Encerrar Conversa"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>



            {!knowledgeOpen ? (
              <>
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

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <div
                  key={msg.id || `msg-${idx}`}
                  id={`chat-message-${idx}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-[14.5px] sm:text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-slate-850 text-slate-100 border border-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="space-y-3">
                        <div className="prose prose-invert max-w-none text-[14.5px] sm:text-xs text-slate-200 space-y-2 markdown-body">
                          <ReactMarkdown
                            urlTransform={(url) => url}
                            components={{
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
                                    onClick={() => openTechnicalSheet(href)}
                                    className="text-amber-400 hover:text-amber-300 underline font-extrabold cursor-pointer inline-flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded transition my-0.5"
                                  >
                                    <FileText className="h-3 w-3 inline text-amber-400" />
                                    {children}
                                  </button>
                                );
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        
                        {/* Dynamic Quick Action Buttons */}
                        {(() => {
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

                          const matchedEquip = detectEquipmentInMessage(msg.content);
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
                                      const mName = model.name || '';
                                      const pName = prod.name || '';
                                      const pdfUrl = model.pdf_url || prod.pdf_url || PRODUCT_PDFS[mName] || PRODUCT_PDFS[pName];
                                      const videoUrl = model.video_url || prod.video_url || PRODUCT_VIDEOS[mName] || PRODUCT_VIDEOS[pName];

                                      const isValidPdfUrl = (url?: string) => {
                                        if (!url) return false;
                                        const lower = url.toLowerCase();
                                        if (lower === 'fresa-ssh' || lower === 'high-tip' || lower === 'engate-rapido' || lower === 'estufagem' || lower === 'loader-fae' || lower.includes('loader-fae')) return true;
                                        return url.startsWith('http://') || url.startsWith('https://');
                                      };

                                      const isValidVideoUrl = (url?: string) => {
                                        if (!url) return false;
                                        const lower = url.toLowerCase();
                                        if (lower.includes('t_8n_nlf2xk')) return false; // dead video
                                        return url.startsWith('http://') || url.startsWith('https://');
                                      };

                                      const modelImg = (model.images && model.images.length > 0) ? model.images[0] : (prod.image_url || '');

                                      return (
                                        <div key={`${prod.id}-${model.id}`} className="flex gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80 w-full text-left">
                                          {(() => {
                                            const modelImg = (model.images && model.images.length > 0) ? model.images[0] : (prod.image_url || '');
                                            if (!modelImg) return null;
                                            return (
                                              <div className="flex-shrink-0 self-center">
                                                <MarkdownImage
                                                  src={modelImg}
                                                  className="w-16 h-12 sm:w-20 sm:h-16 rounded-lg border border-slate-800 bg-slate-950/50 object-contain p-1 m-0 shadow"
                                                />
                                              </div>
                                            );
                                          })()}
                                          <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-0">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[10px] font-black text-amber-400 uppercase tracking-tight truncate">
                                                {prod.name} - {model.name}
                                              </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                              <button
                                                onClick={() => handleMakeIndication(prod, model)}
                                                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black uppercase text-[8.5px] py-1 px-2 rounded-lg transition shadow-sm cursor-pointer duration-150"
                                                title={`Clique para realizar indicação/orçamento oficial de ${prod.name} ${model.name}`}
                                              >
                                                <CheckCircle className="h-2.5 w-2.5" />
                                                Indicar
                                              </button>

                                              {isValidPdfUrl(pdfUrl) && (
                                                <button
                                                  onClick={() => openTechnicalSheet(pdfUrl, model.name)}
                                                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-amber-400 font-black uppercase text-[8.5px] py-1 px-2 rounded-lg transition shadow-sm cursor-pointer duration-150"
                                                  title={`Abre a Ficha Técnica oficial em PDF de ${prod.name} ${model.name}`}
                                                >
                                                  <FileText className="h-2.5 w-2.5 text-amber-400" />
                                                  Ficha
                                                </button>
                                              )}

                                              {isValidVideoUrl(videoUrl) && (
                                                <button
                                                  onClick={() => window.open(videoUrl, '_blank')}
                                                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-red-400 font-black uppercase text-[8.5px] py-1 px-2 rounded-lg transition shadow-sm cursor-pointer duration-150"
                                                  title={`Assista ao vídeo de demonstração operacional de ${prod.name} ${model.name}`}
                                                >
                                                  <Video className="h-2.5 w-2.5 text-red-500" />
                                                  Vídeo
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
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
                                  handleSend(calcText);
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
                                            onClick={() => handleSend("Me fale sobre as Garras de Arraste (Mini Skids) Roder de acoplamento nos 3 pontos, modelos MSR 600 e MSR 1000")}
                                            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 text-[10px] font-black uppercase py-2 px-3 rounded-xl transition cursor-pointer shadow-sm"
                                          >
                                            🚜 Mini Skids (MSR 600/1000)
                                          </button>
                                          <button
                                            onClick={() => handleSend("Me fale sobre as Carretas de Arraste Clambunk Roder de engate traseiro, modelos Clambunk 1.0 e Clambunk 1.5")}
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

                              {/* 3. Generate Report button */}
                              {idx > 0 && (
                                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/40">
                                  <button
                                    onClick={() => handleOpenReport(msg.content, `Relatório de Análise Técnica - ${matchedEquip.length > 0 ? matchedEquip[0].model.name : 'Dimensionamento'}`)}
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
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
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
            </div>

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
                        onClick={() => {
                          setSelectedProduct(prod);
                          setSelectedWeightBand(null);
                          setSelectedModel(null);
                          if (prod.name.toLowerCase().includes('caçamba')) {
                            setCacambaStep('material');
                          } else {
                            setCacambaStep(null);
                          }
                        }}
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
                    {(selectedModel?.pdf_url || selectedProduct?.pdf_url || 
                      selectedProduct?.name?.toLowerCase().includes('ssh') || 
                      selectedProduct?.name?.toLowerCase().includes('caçamba') ||
                      selectedProduct?.name?.toLowerCase().includes('high tip') ||
                      selectedModel?.name?.toLowerCase().includes('ssh') ||
                      selectedModel?.name?.toLowerCase().includes('high tip')) && (
                      <Button
                        onClick={() => openTechnicalSheet(selectedModel?.pdf_url || selectedProduct?.pdf_url || 'fresa-ssh', selectedModel?.name)}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider py-2 rounded-xl shadow flex items-center justify-center gap-2 border border-rose-500"
                      >
                        <FileText className="h-4 w-4 text-white animate-pulse" /> Visualizar Ficha Técnica Oficial
                      </Button>
                    )}

                    <Button
                      onClick={handleDownloadTechnicalSheet}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider py-2 rounded-xl shadow flex items-center justify-center gap-2 border border-amber-400"
                    >
                      <FileText className="h-4 w-4" /> Baixar Ficha Técnica (Documento)
                    </Button>

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
                    "flex-1 bg-white border-2 border-slate-300 rounded-lg px-3 text-[14.5px] sm:text-sm text-slate-950 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 font-semibold transition-all duration-200 shadow-sm resize-none",
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
                  <Mic className="h-4.5 w-4.5" />
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
          </>
        ) : (
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
        )}
      </motion.div>
        )}
      </AnimatePresence>

      {/* Real Roder Image Report Modal */}
      <AnimatePresence>
        {isReportOpen && (
          <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print-backdrop">
            <div className="bg-slate-900 border border-slate-880 text-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header Controls */}
              <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="font-extrabold text-sm tracking-tight text-white uppercase">{reportTitle}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadReportPng}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-650 hover:bg-green-700 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-lg transition shadow cursor-pointer border-0"
                    title="Baixar imagem em formato PNG para a galeria de fotos do celular"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Salvar em Fotos (PNG)
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(reportContent.replace(/[*#]/g, ''));
                      toast.success("Texto do relatório copiado para a área de transferência!");
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-extrabold uppercase text-[10px] tracking-wider rounded-lg transition cursor-pointer"
                    title="Copiar texto limpo para colar no WhatsApp"
                  >
                    Copiar Texto
                  </button>

                  <button 
                    onClick={() => setIsReportOpen(false)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body with Preview */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-950/40 flex items-center justify-center">
                
                {/* Visual Report Container - This DOM element is converted to an image */}
                <div className="overflow-hidden rounded-xl shadow-lg border border-slate-200" style={{ width: '800px' }}>
                  <div 
                    ref={reportRef}
                    className="bg-white text-slate-900 w-full p-8 flex flex-col font-sans"
                    style={{ width: '800px', minHeight: '500px', boxSizing: 'border-box' }}
                  >
                    {/* Roder Logo Section */}
                    <div className="flex items-center justify-between border-b-2 border-amber-500 pb-3 mb-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={RODER_LOGO_BASE64} 
                          alt="Roder Logo" 
                          className="h-9 object-contain brightness-0 opacity-85" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="border-l-2 border-slate-300 pl-3">
                          <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase leading-none">Consultoria Técnica Roder</h1>
                          <p className="text-[8.5px] font-black text-amber-600 uppercase tracking-widest font-mono mt-1 leading-none">Relatório de Dimensionamento e Compatibilidade</p>
                        </div>
                      </div>
                      <div className="text-right text-[8px] font-mono text-slate-500 font-semibold space-y-0.5 leading-tight">
                        <p className="uppercase">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                        <p className="uppercase text-amber-600">Sistema: Roder Indica V2</p>
                        <p className="uppercase">Validade Proposta: 60 Dias</p>
                      </div>
                    </div>

                    {/* Report Main Content Area */}
                    <div className="flex-1 min-h-[300px]">
                      <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1 flex items-center gap-1.5 leading-none">
                        <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                        Especificações Técnicas & Recomendações
                      </h2>
                      
                      <div className="prose prose-slate text-xs max-w-none text-slate-800 leading-relaxed space-y-3 font-medium">
                        <ReactMarkdown
                          urlTransform={(url) => url}
                          components={{
                            img: ({ node, ...props }) => {
                              return <MarkdownImage isLightReport {...props} />;
                            },
                            a: ({ node, children, href, ...props }) => {
                              if (!href) return <span className="text-slate-700 underline font-semibold">{children}</span>;
                              return (
                                <button
                                  type="button"
                                  onClick={() => openTechnicalSheet(href)}
                                  className="text-amber-600 hover:text-amber-700 underline font-extrabold cursor-pointer inline-flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded transition my-0.5"
                                >
                                  <FileText className="h-3 w-3 inline text-amber-600" />
                                  {children}
                                </button>
                              );
                            }
                          }}
                        >
                          {reportContent}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Decorative stamp watermark and formal footer */}
                    <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[8px] font-mono text-slate-400 font-semibold">
                        <span>© {new Date().getFullYear()} Roder Brasil</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                        <span>Equipamentos Florestais e Industriais</span>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                        Equipamento Oficial Roder ✅
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Informative Help Footer inside Modal */}
              <div className="bg-slate-950 p-4 border-t border-slate-800 text-center text-xs text-slate-400 shrink-0">
                Pressione o botão <span className="text-green-400 font-bold">Salvar em Fotos</span> para fazer o download direto da imagem de alta definição. Você também pode copiar o texto limpo para colá-lo diretamente no WhatsApp do cliente.
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {isHighTipFichaOpen && (
        <HighTipFicha onClose={() => setIsHighTipFichaOpen(false)} />
      )}

      {isFresaSshFichaOpen && (
        <FresaSshFicha onClose={() => setIsFresaSshFichaOpen(false)} defaultModelId={fresaSshDefaultModel} />
      )}

      {isEngateRapidoFichaOpen && (
        <EngateRapidoFicha onClose={() => setIsEngateRapidoFichaOpen(false)} />
      )}

      {isGarraEstufagemFichaOpen && (
        <GarraEstufagemFicha onClose={() => setIsGarraEstufagemFichaOpen(false)} />
      )}

      {isTrituradorLoaderFaeFichaOpen && (
        <TrituradorLoaderFaeFicha
          onClose={() => setIsTrituradorLoaderFaeFichaOpen(false)}
          defaultModelId={trituradorLoaderFaeDefaultModel}
        />
      )}

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
                <div className="p-5 space-y-4">
                  <div className="bg-slate-950 p-3.5 border border-slate-800 rounded-xl space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">Equipamento Selecionado:</p>
                    <p className="text-xs font-semibold text-white">{budgetEquipName || 'Equipamento Roder (Dimensionamento)'}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Seu Nome / Contato *</label>
                    <input
                      type="text"
                      required
                      value={budgetContactName}
                      onChange={(e) => setBudgetContactName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">CNPJ (Opcional)</label>
                      <input
                        type="text"
                        value={budgetCNPJ}
                        onChange={(e) => setBudgetCNPJ(e.target.value)}
                        placeholder="Ex: 00.000.000/0001-00"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">WhatsApp / Telefone *</label>
                      <input
                        type="tel"
                        required
                        value={budgetPhone}
                        onChange={(e) => setBudgetPhone(e.target.value)}
                        placeholder="Ex: (19) 99999-9999"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Sua Escavadeira ou Pá Carregadeira (Opcional)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={budgetMachineBrand}
                        onChange={(e) => setBudgetMachineBrand(e.target.value)}
                        placeholder="Marca (Ex: Caterpillar)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white font-medium"
                      />
                      <input
                        type="text"
                        value={budgetMachineModel}
                        onChange={(e) => setBudgetMachineModel(e.target.value)}
                        placeholder="Modelo (Ex: 320D)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white font-medium"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal italic">Informar a máquina nos ajuda a validar a compatibilidade hidráulica do equipamento antes de enviar o orçamento.</p>
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
    </>
  );
}
