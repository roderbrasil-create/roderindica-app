import React, { useRef, useState, useEffect } from 'react';
import { generateEstufagemPdfDirect } from '../../utils/generateEstufagemPdf';
import { 
  X, 
  CheckCircle, 
  ShieldCheck, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  Info,
  Download,
  Upload,
  RotateCcw,
  Camera,
  Layers,
  Wrench,
  HelpCircle,
  FileText,
  Truck,
  Check,
  Printer
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { compressFileToDataURL } from '../../lib/imageUtils';
import { getApiBaseUrl } from '../../lib/utils';

interface GarraEstufagemFichaProps {
  onClose: () => void;
  defaultModelId?: string;
}

const formatFichaImageUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  const baseUrl = getApiBaseUrl();
  
  // If already proxied, return as-is
  if (url.includes('/api/proxy-image')) {
    return url;
  }
  
  // For absolute http/https URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `${baseUrl}/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  
  // For relative paths (e.g. /uploads/...)
  const fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  return `${baseUrl}/api/proxy-image?url=${encodeURIComponent(fullUrl)}`;
};

interface TechnicalSpec {
  maquina_base: string;
  peso_operacional: string;
  area_da_garra: string;
  peso: string;
  capacidade_de_carga: string;
  pressao_trabalho?: string;
  vazao_oleo?: string;
  giro_360?: string;
  abertura_maxima?: string;
  diametro_minimo?: string;
}

interface ModelDetails {
  id: string;
  name: string;
  description: string;
  tag?: string;
  specs: TechnicalSpec;
}

const MODELS: ModelDetails[] = [
  {
    id: 'af_360',
    name: 'AF - 360',
    description: 'Garra fixa para empilhadeiras pequenas e médias (2,4 a 4,0t). Desenho compacto especial para estufagem de container marítimo.',
    tag: 'Especial Container (Fixa)',
    specs: {
      maquina_base: 'Empilhadeira / Carregadeira',
      peso_operacional: '2.4 a 4.0 Ton.',
      area_da_garra: '0,36 m²',
      peso: '290 kg',
      capacidade_de_carga: '1.500 kg',
      pressao_trabalho: '180 a 200 bar',
      vazao_oleo: '40 a 60 L/min',
      giro_360: 'Não (Estrutura Fixa)',
      abertura_maxima: '1.450 mm',
      diametro_minimo: '110 mm'
    }
  },
  {
    id: 'afg_360',
    name: 'AFG - 360',
    description: 'Garra giratória com rotator hidráulico 360° para empilhadeiras e pás carregadeiras compactas. Agilidade extrema em espaço confinado.',
    tag: 'Giratória 360°',
    specs: {
      maquina_base: 'Empilhadeira / Carregadeira',
      peso_operacional: '3.0 a 6.0 Ton.',
      area_da_garra: '0,36 m²',
      peso: '390 kg',
      capacidade_de_carga: '2.000 kg',
      pressao_trabalho: '200 a 230 bar',
      vazao_oleo: '50 a 80 L/min',
      giro_360: 'Sim (Rotator Contínuo)',
      abertura_maxima: '1.450 mm',
      diametro_minimo: '110 mm'
    }
  },
  {
    id: 'af_600',
    name: 'AF - 600',
    description: 'Garra para pá carregadeira e empilhadeiras pesadas. Elevada cubagem de feixes e toras longas em pátios industriais.',
    tag: 'Alta Cubagem',
    specs: {
      maquina_base: 'Pá Carregadeira / Empilhadeira Pesada',
      peso_operacional: '7.0 a 12.0 Ton.',
      area_da_garra: '0,60 m²',
      peso: '480 kg',
      capacidade_de_carga: '3.500 kg',
      pressao_trabalho: '210 a 250 bar',
      vazao_oleo: '70 a 110 L/min',
      giro_360: 'Não (Estrutura Fixa)',
      abertura_maxima: '1.820 mm',
      diametro_minimo: '140 mm'
    }
  },
  {
    id: 'afg_600',
    name: 'AFG - 600',
    description: 'Versão giratória com rotator de alto torque. Indicada para pá carregadeira em carregamento de vagões e containers.',
    tag: 'Giratória Pesada',
    specs: {
      maquina_base: 'Pá Carregadeira / Empilhadeira',
      peso_operacional: '8.0 a 14.0 Ton.',
      area_da_garra: '0,60 m²',
      peso: '590 kg',
      capacidade_de_carga: '4.000 kg',
      pressao_trabalho: '220 a 250 bar',
      vazao_oleo: '80 a 120 L/min',
      giro_360: 'Sim (Rotator Contínuo)',
      abertura_maxima: '1.820 mm',
      diametro_minimo: '140 mm'
    }
  },
  {
    id: 'af_800',
    name: 'AF - 800',
    description: 'Garra de estufagem pesada de 0,80 m² de área para carregadeiras de 10 a 16t em terminais portuários e retroportos.',
    tag: 'Terminal Portuário',
    specs: {
      maquina_base: 'Pá Carregadeira Grande',
      peso_operacional: '10.0 a 16.0 Ton.',
      area_da_garra: '0,80 m²',
      peso: '640 kg',
      capacidade_de_carga: '5.000 kg',
      pressao_trabalho: '220 a 260 bar',
      vazao_oleo: '90 a 140 L/min',
      giro_360: 'Não (Estrutura Fixa)',
      abertura_maxima: '2.100 mm',
      diametro_minimo: '160 mm'
    }
  },
  {
    id: 'afg_800',
    name: 'AFG - 800',
    description: 'Modelo topo de linha giratório com 0,80 m² de área para máxima vazão de estufagem e manobras precisas em composições ferroviárias.',
    tag: 'Máxima Performance',
    specs: {
      maquina_base: 'Pá Carregadeira Grande',
      peso_operacional: '12.0 a 18.0 Ton.',
      area_da_garra: '0,80 m²',
      peso: '780 kg',
      capacidade_de_carga: '6.000 kg',
      pressao_trabalho: '240 a 280 bar',
      vazao_oleo: '100 a 160 L/min',
      giro_360: 'Sim (Rotator Contínuo)',
      abertura_maxima: '2.100 mm',
      diametro_minimo: '160 mm'
    }
  }
];

export function GarraEstufagemFicha({ onClose, defaultModelId = 'af_360' }: GarraEstufagemFichaProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>(defaultModelId);
  const [customMainImageUrl, setCustomMainImageUrl] = useState<string | null>(null);
  const [loadingMedia, setLoadingMedia] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  const selectedModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0];

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const mainSnap = await getDoc(doc(db, 'settings', 'garra_estufagem_ficha_main'));
        if (mainSnap.exists() && mainSnap.data()?.image_url) {
          setCustomMainImageUrl(mainSnap.data().image_url);
        } else {
          const generalSnap = await getDoc(doc(db, 'settings', 'garra_estufagem_ficha_images'));
          if (generalSnap.exists()) {
            const data = generalSnap.data();
            if (data.main_image_url) setCustomMainImageUrl(data.main_image_url);
          }
        }
      } catch (err) {
        console.warn("Could not load custom images from Firestore:", err);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      toast.error("O arquivo de imagem deve ter no máximo 30MB.");
      return;
    }

    setLoadingMedia(true);
    const toastId = toast.loading("Enviando Foto Oficial com qualidade AA...");

    try {
      // High resolution compress for AA print rendering (up to 1600px width with high quality 0.92)
      const base64Data = await compressFileToDataURL(file, 1600, 0.92);
      const baseUrl = getApiBaseUrl();
      const uploadRes = await fetch(`${baseUrl}/api/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64Data,
          fileName: `garra_estufagem_ficha_main_${Date.now()}.jpg`,
          contentType: "image/jpeg",
          folder: "garra_estufagem",
          docName: 'garra_estufagem_ficha_main'
        })
      });

      if (!uploadRes.ok) {
        throw new Error(`Server returned status ${uploadRes.status}`);
      }

      const uploadData = await uploadRes.json();
      if (!uploadData.success || !uploadData.url) {
        throw new Error(uploadData.error || "Failed to retrieve upload URL");
      }

      const imageUrlToSave = uploadData.url;
      setCustomMainImageUrl(imageUrlToSave);

      const docRef = doc(db, 'settings', 'garra_estufagem_ficha_main');
      setDoc(docRef, {
        image_url: imageUrlToSave,
        updated_at: new Date().toISOString()
      }).catch(err => {
        console.warn("Erro não bloqueante ao salvar no Firestore:", err);
      });

      toast.success("Foto Oficial atualizada com qualidade AA!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao fazer upload da imagem.", { id: toastId });
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleResetImages = async () => {
    if (!window.confirm("Deseja realmente restaurar a imagem oficial padrão?")) return;

    setLoadingMedia(true);
    const toastId = toast.loading("Restaurando imagem oficial...");

    try {
      await Promise.all([
        setDoc(doc(db, 'settings', 'garra_estufagem_ficha_main'), { image_url: null, updated_at: new Date().toISOString() }),
        setDoc(doc(db, 'settings', 'garra_estufagem_ficha_images'), {
          main_image_url: null,
          updated_at: new Date().toISOString()
        })
      ]);

      setCustomMainImageUrl(null);
      toast.success("Imagem original restaurada com sucesso!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao restaurar imagem padrão.", { id: toastId });
    } finally {
      setLoadingMedia(false);
    }
  };

  // Direct vector PDF download strictly in 1 single page with crisp AA typography and tables
  const exportPDF = async () => {
    setIsPrinting(true);
    const toastId = toast.loading("Gerando arquivo PDF da Ficha Técnica (Página Única)...");

    try {
      await generateEstufagemPdfDirect({
        selectedModel,
        allModels: MODELS,
        mainImageUrl: mainImgToRender
      });

      toast.success("PDF salvo com sucesso! Verifique sua pasta de downloads.", { id: toastId });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Abrindo modo de impressão como alternativa...", { id: toastId });
      handlePrintDialog();
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintDialog = () => {
    const element = printRef.current;
    if (!element) return;

    try {
      const printDiv = document.createElement('div');
      printDiv.id = "print-garra-estufagem-temp-div";
      printDiv.className = "bg-white text-black";
      printDiv.innerHTML = element.innerHTML;

      const style = document.createElement('style');
      style.id = "print-garra-estufagem-temp-style";
      style.innerHTML = `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > *:not(#print-garra-estufagem-temp-div) {
            display: none !important;
          }
          #print-garra-estufagem-temp-div {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .page-container {
            min-height: 275mm !important;
            max-height: 285mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            padding-bottom: 2mm !important;
          }
          .no-print, [class*="no-print"] {
            display: none !important;
          }
          img {
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: high-quality !important;
            max-width: 100% !important;
          }
        }
        @media screen {
          #print-garra-estufagem-temp-div {
            display: none !important;
          }
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(printDiv);

      setTimeout(() => {
        window.print();

        setTimeout(() => {
          document.getElementById('print-garra-estufagem-temp-div')?.remove();
          document.getElementById('print-garra-estufagem-temp-style')?.remove();
        }, 1000);
      }, 300);
    } catch (err) {
      console.error("Print dialog error:", err);
    }
  };

  const defaultMainImage = "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-para-Estufagem-giratoria.jpg.webp";
  const mainImgToRender = formatFichaImageUrl(customMainImageUrl || defaultMainImage);

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print-backdrop">
      <div className="bg-card text-card-foreground w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col h-[96vh]">
        
        {/* Modal Topbar Controls */}
        <div className="bg-slate-900 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-red-600/20 p-2 rounded-lg border border-red-600/30">
              <Truck className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white">
                  Ficha Técnica Comercial: Garra para Estufagem e Vagões
                </span>
                <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                  Página Única • Qualidade AA
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Série Especial AF (Fixa) & AFG (Giro 360°) • Modelo: {selectedModel.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportPDF}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Salvar o arquivo PDF oficial com página única na sua pasta de Downloads"
            >
              <Download className="h-4 w-4" />
              <span>{isPrinting ? "Gerando..." : "Salvar PDF"}</span>
            </button>

            <button
              onClick={handlePrintDialog}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 cursor-pointer"
              title="Imprimir direto ou salvar via diálogo do navegador"
            >
              <Printer className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all ml-1"
              title="Fechar Ficha Técnica"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Model Selection and Admin Upload Controls */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">Modelos:</span>
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModelId(model.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedModelId === model.id
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md cursor-pointer border border-slate-700 font-medium">
                <Camera className="h-3 w-3 text-red-400" />
                <span>Foto Oficial HD</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={loadingMedia}
                />
              </label>

              {customMainImageUrl && (
                <button
                  onClick={handleResetImages}
                  disabled={loadingMedia}
                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                  title="Restaurar imagem padrão de fábrica"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Technical Sheet Viewer (Print Container Wrapper) */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 flex justify-center">
          <div className="w-full max-w-[794px]">
            <div 
              ref={printRef}
              id="print-container"
              className="bg-white text-slate-900 shadow-xl border border-slate-200 leading-normal font-sans"
              style={{
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              
              {/* ========================================================================= */}
              {/* PÁGINA ÚNICA: APRESENTAÇÃO, IMAGEM OFICIAL, ESPECIFICAÇÕES, MATRIZ E TEXTOS */}
              {/* ========================================================================= */}
              <div className="page-container p-6 sm:p-7 space-y-3.5">
                
                {/* PDF Header */}
                <div className="flex justify-between items-start border-b-2 border-red-600 pb-2.5">
                  <div>
                    <img 
                      src={RODER_LOGO_BASE64} 
                      alt="Logo Roder" 
                      className="h-8 object-contain mb-0.5" 
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">
                      Tecnologia Florestal & Logística de Madeira • Roder Brasil
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-red-600 text-white text-[8.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider mb-0.5">
                      Ficha Técnica Comercial Oficial
                    </span>
                    <p className="text-[8.5px] text-slate-500 font-mono">Emissão: {new Date().toLocaleDateString('pt-BR')} • Página 1 de 1</p>
                    <p className="text-[8.5px] text-slate-500 font-mono">Validade: 60 Dias • 100% Nacional</p>
                  </div>
                </div>

                {/* Title Section */}
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tight">
                      Garra para Estufagem e Vagões
                    </h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-red-600"></span>
                      <p className="text-[10.5px] text-red-600 font-bold uppercase tracking-wider">
                        Série Especial AF (Fixa) & AFG (Giratória) • Modelo em Destaque: {selectedModel.name}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9.5px] font-bold text-slate-700">
                      {selectedModel.tag || 'Engenharia Homologada'}
                    </span>
                  </div>
                </div>

                {/* Top Section: Main Photo (Natural Height) & Compact Specs */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
                  {/* Photo Column - Natural Height and Proportions with Balanced Zoom */}
                  <div className="md:col-span-5 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 min-h-[195px] flex items-center justify-center relative shadow-inner p-1.5">
                    <div className="w-full h-[185px] flex items-center justify-center overflow-hidden">
                      <img 
                        src={mainImgToRender} 
                        alt="Garra para Estufagem" 
                        className="max-h-full max-w-full object-contain scale-125 rounded-lg shadow-sm transition-transform duration-300"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 bg-slate-900/85 text-white text-[7.5px] font-bold px-1.5 py-0.5 rounded font-mono z-10">
                      Foto Oficial • Qualidade AA
                    </div>
                  </div>

                  {/* Highlights and Specs Column */}
                  <div className="md:col-span-7 flex flex-col justify-between space-y-2">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <h4 className="text-[8.5px] uppercase tracking-wider text-slate-500 font-extrabold mb-0.5">Aplicação do Equipamento</h4>
                      <p className="text-[9.5px] text-slate-700 leading-snug font-medium">
                        Projetada para operações severas de carregamento e descarregamento de toras em containers marítimos fechados (estufagem) e vagões ferroviários. O perfil compacto e mandíbulas de alta penetração maximizam a cubagem nos cantos internos com total agilidade e segurança.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                      <div className="flex items-center justify-between mb-1 border-b border-slate-200 pb-0.5">
                        <span className="text-[8.5px] uppercase tracking-wider text-red-600 font-extrabold flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-red-600 shrink-0" />
                          Especificações Técnicas - {selectedModel.name}
                        </span>
                        <span className="text-[7.5px] font-bold text-slate-500 bg-white px-1 rounded border border-slate-200">
                          Dados de Engenharia
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1 text-[9px]">
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-slate-400 block text-[7px] uppercase font-bold">Máquina Base</span>
                          <span className="font-bold text-slate-900 truncate block">{selectedModel.specs.maquina_base}</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-slate-400 block text-[7px] uppercase font-bold">Peso Máquina</span>
                          <span className="font-bold text-slate-900 block">{selectedModel.specs.peso_operacional}</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-slate-400 block text-[7px] uppercase font-bold">Área da Garra</span>
                          <span className="font-bold text-red-600 block">{selectedModel.specs.area_da_garra}</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-slate-400 block text-[7px] uppercase font-bold">Peso Garra</span>
                          <span className="font-bold text-slate-900 block">{selectedModel.specs.peso}</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-slate-400 block text-[7px] uppercase font-bold">Capacidade Máx.</span>
                          <span className="font-bold text-slate-900 block">{selectedModel.specs.capacidade_de_carga}</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-slate-400 block text-[7px] uppercase font-bold">Sistema Giro</span>
                          <span className={`font-bold block ${selectedModel.specs.giro_360?.includes('Sim') ? 'text-red-600' : 'text-slate-700'}`}>
                            {selectedModel.specs.giro_360?.includes('Sim') ? '360° Contínuo' : 'Fixo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complete Comparison Grid (All 6 Models) */}
                <div>
                  <div className="flex justify-between items-center mb-1 border-b border-slate-200 pb-0.5">
                    <h3 className="text-[9.5px] uppercase tracking-wider text-slate-900 font-extrabold">
                      Matriz Comparativa da Linha de Garras de Estufagem (Série AF / AFG)
                    </h3>
                    <span className="text-[8px] text-slate-500 font-medium italic">
                      Modelos homologados pela Roder Brasil
                    </span>
                  </div>

                  <div className="overflow-hidden border border-slate-200 rounded-lg shadow-2xs">
                    <table className="w-full border-collapse text-left text-[8.5px] bg-white">
                      <thead className="bg-slate-900 text-white text-[7.5px] uppercase font-bold tracking-wider">
                        <tr>
                          <th className="py-1 px-2">Modelo</th>
                          <th className="py-1 px-2">Máquina Indicada</th>
                          <th className="py-1 px-2 text-center">Peso Base</th>
                          <th className="py-1 px-2 text-center">Área Útil</th>
                          <th className="py-1 px-2 text-center">Peso Próprio</th>
                          <th className="py-1 px-2 text-center">Capacidade</th>
                          <th className="py-1 px-2 text-center">Rotator 360°</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {MODELS.map((m) => {
                          const isSelected = selectedModelId === m.id;
                          return (
                            <tr 
                              key={m.id} 
                              className={`transition-colors ${
                                isSelected 
                                  ? 'bg-red-500/10 font-bold text-slate-950 border-l-4 border-l-red-600' 
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <td className="py-1 px-2 font-black text-slate-900">
                                {m.name}
                                {isSelected && <span className="ml-1 text-[7px] text-red-600 font-extrabold uppercase">(Ativo)</span>}
                              </td>
                              <td className="py-1 px-2">{m.specs.maquina_base}</td>
                              <td className="py-1 px-2 text-center font-mono">{m.specs.peso_operacional}</td>
                              <td className="py-1 px-2 text-center font-bold text-red-600">{m.specs.area_da_garra}</td>
                              <td className="py-1 px-2 text-center font-mono">{m.specs.peso}</td>
                              <td className="py-1 px-2 text-center font-bold">{m.specs.capacidade_de_carga}</td>
                              <td className="py-1 px-2 text-center">
                                <span className={`inline-block text-[7px] font-extrabold px-1.5 py-0.5 rounded ${
                                  m.specs.giro_360?.includes('Sim') 
                                    ? 'bg-red-600 text-white' 
                                    : 'bg-slate-150 text-slate-600'
                                }`}>
                                  {m.specs.giro_360?.includes('Sim') ? 'SIM (360°)' : 'FIXO'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Complete Technical Texts: Hydraulic Requirements & Sizing Notice */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Hydraulic Requirements */}
                  <div className="bg-slate-50 p-2.5 border border-slate-200 rounded-xl space-y-1.5">
                    <h3 className="text-[9px] uppercase tracking-wider text-slate-900 font-extrabold flex items-center gap-1 border-b border-slate-200 pb-0.5">
                      <Wrench className="h-3 w-3 text-red-600" /> Requisitos de Instalação Hidráulica
                    </h3>
                    <div className="space-y-1 text-[8.5px] text-slate-700 leading-relaxed">
                      <p>
                        A máquina base (Empilhadeira ou Pá Carregadeira) deve possuir linhas hidráulicas conforme a configuração:
                      </p>
                      <div className="p-1.5 bg-white rounded border border-slate-150">
                        <strong className="text-slate-900 block">• Garras Fixas (Série AF): 3ª Função Padrão (2 vias)</strong>
                        <span className="text-slate-600 text-[8px]">Aciona abertura e fechamento. Indicada para movimentação e estufagem linear.</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-slate-150">
                        <strong className="text-red-600 block">• Garras Giratórias (Série AFG): 3ª e 4ª Funções (4 vias)</strong>
                        <span className="text-slate-600 text-[8px]">A 3ª aciona o fechamento e a 4ª o rotator 360° contínuo para manobras de alinhamento.</span>
                      </div>
                    </div>
                  </div>

                  {/* Sizing & Operational Notice */}
                  <div className="bg-red-50/50 p-2.5 border border-red-200 rounded-xl flex flex-col justify-between space-y-1.5">
                    <div>
                      <h4 className="text-[9px] uppercase tracking-wider text-red-700 font-extrabold flex items-center gap-1 border-b border-red-200 pb-0.5 mb-1">
                        <AlertTriangle className="h-3 w-3 text-red-600 shrink-0" />
                        Diretriz Crítica de Dimensionamento & Segurança
                      </h4>
                      <p className="text-[8.5px] text-slate-700 leading-relaxed">
                        O modelo <strong>AF-360</strong> é calibrado para <strong>Empilhadeiras de 2,4t a 4,0t</strong>, mantendo a estabilidade do centro de gravidade. Para carregadeiras médias e pesadas, os modelos <strong>AF-600</strong> e <strong>AFG-800</strong> garantem produtividade contínua em 3 turnos.
                      </p>
                    </div>
                    
                    <div className="bg-white p-1.5 border border-red-100 rounded-lg text-[8px] text-slate-600 font-medium">
                      A Roder fornece o <strong>Kit Hidráulico Completo de 3ª e 4ª Funções</strong> com bloco de comando e joystick para todas as marcas.
                    </div>
                  </div>
                </div>

                {/* 4 Feature Badges Bottom */}
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <p className="font-extrabold text-slate-900 text-[8.5px]">Aço de Alta Resistência</p>
                    <p className="text-[7px] text-slate-500 mt-0.5">Estrutura reforçada contínua</p>
                  </div>
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <p className="font-extrabold text-slate-900 text-[8.5px]">Pinos Termotratados</p>
                    <p className="text-[7px] text-slate-500 mt-0.5">Buchas de longa vida útil</p>
                  </div>
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <p className="font-extrabold text-slate-900 text-[8.5px]">Cilindros Blindados</p>
                    <p className="text-[7px] text-slate-500 mt-0.5">Protegidos contra impacto</p>
                  </div>
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <p className="font-extrabold text-slate-900 text-[8.5px]">100% Nacional</p>
                    <p className="text-[7px] text-slate-500 mt-0.5">Peças e assistência pronta</p>
                  </div>
                </div>

                {/* Footer Page */}
                <div className="flex justify-between items-center border-t-2 border-slate-800 pt-2 text-slate-500 text-[7.5px] font-mono mt-auto">
                  <div>
                    <span className="font-bold text-slate-800">RODER BRASIL INDUSTRIAL LTDA</span> • (15) 3524-1111 • comercial@roderbrasil.com.br
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">Ref: FT-EST-2026 • Página 1 de 1</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
