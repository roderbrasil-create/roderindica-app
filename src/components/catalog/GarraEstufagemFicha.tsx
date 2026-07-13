import React, { useRef, useState, useEffect } from 'react';
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
  Truck
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
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

interface TechnicalSpec {
  maquina_base: string;
  peso_operacional: string;
  area_da_garra: string;
  peso: string;
  capacidade_de_carga: string;
  giro_360?: string;
}

interface ModelData {
  id: string;
  name: string;
  specs: TechnicalSpec;
  tag?: string;
}

const MODELS: ModelData[] = [
  {
    id: 'af-360',
    name: 'AF - 360',
    tag: 'Especial para Empilhadeira',
    specs: {
      maquina_base: 'Empilhadeira',
      peso_operacional: '2,4 a 4,0 t',
      area_da_garra: '0,36 m³',
      peso: '680 kg',
      capacidade_de_carga: '800 kg',
      giro_360: 'Não (Fixo)'
    }
  },
  {
    id: 'af-400',
    name: 'AF - 400',
    specs: {
      maquina_base: 'Pá Carregadeira',
      peso_operacional: '6,0 a 10,0 t',
      area_da_garra: '0,36 m³',
      peso: '680 kg',
      capacidade_de_carga: '800 kg',
      giro_360: 'Não (Fixo)'
    }
  },
  {
    id: 'af-600',
    name: 'AF - 600',
    specs: {
      maquina_base: 'Pá Carregadeira',
      peso_operacional: '10,0 a 14,0 t',
      area_da_garra: '0,60 m³',
      peso: '1300 kg',
      capacidade_de_carga: '1200 kg',
      giro_360: 'Não (Fixo)'
    }
  },
  {
    id: 'af-800',
    name: 'AF - 800',
    specs: {
      maquina_base: 'Pá Carregadeira',
      peso_operacional: '12,0 a 17,0 t',
      area_da_garra: '0,80 m³',
      peso: '1500 kg',
      capacidade_de_carga: '1600 kg',
      giro_360: 'Não (Fixo)'
    }
  },
  {
    id: 'afg-600',
    name: 'AFG - 600',
    tag: 'Rotativa com Giro 360°',
    specs: {
      maquina_base: 'Pá Carregadeira',
      peso_operacional: '10,0 a 17,0 t',
      area_da_garra: '0,60 m³',
      peso: '1550 kg',
      capacidade_de_carga: '1200 kg',
      giro_360: 'Sim (360° Contínuo)'
    }
  },
  {
    id: 'afg-800',
    name: 'AFG - 800',
    tag: 'Rotativa com Giro 360°',
    specs: {
      maquina_base: 'Pá Carregadeira',
      peso_operacional: '12,0 a 17,0 t',
      area_da_garra: '0,80 m³',
      peso: '1820 kg',
      capacidade_de_carga: '1600 kg',
      giro_360: 'Sim (360° Contínuo)'
    }
  }
];

export function GarraEstufagemFicha({ onClose, defaultModelId = 'af-360' }: GarraEstufagemFichaProps) {
  const { isAdmin, isManager, isTriagem, isMarketing, isInternalSeller } = useAuth();
  const canEdit = isAdmin || isManager || isTriagem || isMarketing || isInternalSeller;
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>(defaultModelId);
  const [customMainImageUrl, setCustomMainImageUrl] = useState<string | null>(null);
  const [customDrawingUrl, setCustomDrawingUrl] = useState<string | null>(null);
  const [customMountedImageUrl, setCustomMountedImageUrl] = useState<string | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const selectedModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0];

  useEffect(() => {
    const fetchFichaImages = async () => {
      try {
        // Fetch separate documents for each image type to avoid Firestore document limits
        const [mainSnap, drawingSnap, mountedSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'garra_estufagem_ficha_main')),
          getDoc(doc(db, 'settings', 'garra_estufagem_ficha_drawing')),
          getDoc(doc(db, 'settings', 'garra_estufagem_ficha_mounted')),
        ]);

        let mainImg = mainSnap.exists() ? mainSnap.data().image_url : null;
        let drawingImg = drawingSnap.exists() ? drawingSnap.data().image_url : null;
        let mountedImg = mountedSnap.exists() ? mountedSnap.data().image_url : null;

        // Fall back to old monolithic document if any is missing
        if (!mainImg || !drawingImg || !mountedImg) {
          const docRef = doc(db, 'settings', 'garra_estufagem_ficha_images');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (!mainImg) mainImg = data.main_image_url || null;
            if (!drawingImg) drawingImg = data.drawing_url || null;
            if (!mountedImg) mountedImg = data.mounted_image_url || null;
          }
        }

        setCustomMainImageUrl(mainImg);
        setCustomDrawingUrl(drawingImg);
        setCustomMountedImageUrl(mountedImg);
      } catch (err) {
        console.error('Erro ao buscar imagens customizadas da ficha de estufagem:', err);
      }
    };
    fetchFichaImages();
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'drawing' | 'mounted') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      toast.error("O arquivo de imagem deve ter no máximo 30MB.");
      return;
    }

    const labels = {
      main: "Foto Principal",
      drawing: "Desenho Técnico 3D",
      mounted: "Foto de Operação Real"
    };

    setLoadingMedia(true);
    const toastId = toast.loading(`Enviando ${labels[type]}...`);

    const docNameMap = {
      main: 'garra_estufagem_ficha_main',
      drawing: 'garra_estufagem_ficha_drawing',
      mounted: 'garra_estufagem_ficha_mounted'
    };
    const docName = docNameMap[type];

    try {
      // Compress the image before uploading to avoid Firestore 1MB document size limit
      const base64Data = await compressFileToDataURL(file, 800, 0.7);
      
      // Upload via server-side API to store in Firebase Storage or local uploads fallback
      const baseUrl = getApiBaseUrl();
      const uploadRes = await fetch(`${baseUrl}/api/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64Data,
          fileName: `garra_estufagem_ficha_${type}_${Date.now()}.jpg`,
          contentType: "image/jpeg",
          folder: "garra_estufagem",
          docName: docName
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
      
      if (type === 'main') {
        setCustomMainImageUrl(imageUrlToSave);
      } else if (type === 'drawing') {
        setCustomDrawingUrl(imageUrlToSave);
      } else if (type === 'mounted') {
        setCustomMountedImageUrl(imageUrlToSave);
      }

      if (docName) {
        const docRef = doc(db, 'settings', docName);
        setDoc(docRef, {
          image_url: imageUrlToSave,
          updated_at: new Date().toISOString()
        }).catch(err => {
          console.warn("Erro não bloqueante ao salvar no Firestore (sincronização em segundo plano):", err);
        });
      }

      toast.success(`${labels[type]} atualizado com sucesso!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(`Erro ao fazer upload da imagem de ${labels[type]}.`, { id: toastId });
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleResetImages = async () => {
    if (!window.confirm("Deseja realmente restaurar as imagens oficiais padrão?")) return;

    setLoadingMedia(true);
    const toastId = toast.loading("Restaurando imagens oficiais...");

    try {
      // Clear all separate documents and the old monolithic one in parallel
      await Promise.all([
        setDoc(doc(db, 'settings', 'garra_estufagem_ficha_main'), { image_url: null, updated_at: new Date().toISOString() }),
        setDoc(doc(db, 'settings', 'garra_estufagem_ficha_drawing'), { image_url: null, updated_at: new Date().toISOString() }),
        setDoc(doc(db, 'settings', 'garra_estufagem_ficha_mounted'), { image_url: null, updated_at: new Date().toISOString() }),
        setDoc(doc(db, 'settings', 'garra_estufagem_ficha_images'), {
          main_image_url: null,
          drawing_url: null,
          mounted_image_url: null,
          updated_at: new Date().toISOString()
        })
      ]);

      setCustomMainImageUrl(null);
      setCustomDrawingUrl(null);
      setCustomMountedImageUrl(null);
      toast.success("Imagens originais restauradas com sucesso!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao restaurar imagens padrão.", { id: toastId });
    } finally {
      setLoadingMedia(false);
    }
  };

  const exportPDF = async () => {
    if (!printRef.current) return;
    setIsPrinting(true);
    const toastId = toast.loading("Gerando ficha técnica em PDF de alta qualidade...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const dataUrl = await toPng(printRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '794px',
        },
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      
      const tempImg = new Image();
      tempImg.src = dataUrl;
      
      await new Promise<void>((resolve, reject) => {
        tempImg.onload = () => resolve();
        tempImg.onerror = () => reject(new Error("Erro ao carregar imagem gerada"));
      });

      const imgHeight = (tempImg.height * imgWidth) / tempImg.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`Ficha_Tecnica_Garra_Estufagem_${selectedModel.name.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF gerado com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao exportar PDF. Tente imprimir direto pelo navegador.", { id: toastId });
    } finally {
      setIsPrinting(false);
    }
  };

  const triggerSystemPrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const defaultMainImage = "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-para-Estufagem-giratoria.jpg.webp";
  const defaultMountedImage = "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-para-Estufagem-giratoria.jpg.webp";
  const defaultDrawingImage = "https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-para-Estufagem-giratoria.jpg.webp";

  const mainImgToRender = customMainImageUrl || defaultMainImage;
  const drawingImgToRender = customDrawingUrl || defaultDrawingImage;
  const mountedImgToRender = customMountedImageUrl || defaultMountedImage;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-center items-start overflow-y-auto p-4 md:p-8 antialiased">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[90vh]">
        
        {/* Sidebar Controls */}
        <div className="p-6 md:w-80 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center border border-red-500/20">
                <Truck className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-100 text-sm tracking-tight leading-none uppercase">Roder Brasil</h3>
                <span className="text-[10px] text-red-400 font-mono">Garra para Estufagem</span>
              </div>
            </div>

            {/* Model Selector in Sidebar */}
            <div className="mb-6">
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">Selecione o Modelo para a Ficha:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModelId(m.id)}
                    className={`text-left p-2.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                      selectedModelId === m.id 
                        ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950/40' 
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold">{m.name}</div>
                    <div className="text-[9px] opacity-75 truncate">{m.specs.maquina_base}</div>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Ficha técnica oficial para Garras de Estufagem de toras e vagões. Ideal para envio rápido para clientes e parceiros.
            </p>

            <div className="space-y-3">
              <button 
                onClick={exportPDF}
                disabled={loadingMedia}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition duration-200 shadow-lg shadow-red-950/40 disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Baixar PDF Oficial
              </button>
              
              <button 
                onClick={triggerSystemPrint}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-2.5 px-4 rounded-lg text-xs transition duration-200 border border-slate-700"
              >
                <FileText className="h-4 w-4" /> Imprimir Documento
              </button>
            </div>

            {canEdit && (
              <div className="mt-6 border-t border-slate-800 pt-5">
                <span className="text-[10px] uppercase tracking-wider text-red-500 font-extrabold block mb-3">Painel de Administração</span>
                <div className="space-y-2">
                  <label className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 px-3 rounded-lg text-[11px] cursor-pointer border border-slate-700 transition">
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>Upload Foto Principal</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} className="hidden" />
                  </label>

                  <label className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 px-3 rounded-lg text-[11px] cursor-pointer border border-slate-700 transition">
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>Upload Foto Operação</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'mounted')} className="hidden" />
                  </label>

                  <label className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 px-3 rounded-lg text-[11px] cursor-pointer border border-slate-700 transition">
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>Upload Desenho 3D</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'drawing')} className="hidden" />
                  </label>

                  {(customMainImageUrl || customDrawingUrl || customMountedImageUrl) && (
                    <button 
                      onClick={handleResetImages}
                      className="w-full flex items-center justify-center gap-1.5 bg-red-950/40 text-red-400 hover:bg-red-900/40 font-semibold py-1.5 px-3 rounded-lg text-[11px] border border-red-900/30 transition"
                    >
                      <RotateCcw className="h-3 w-3" /> Restaurar Padrões
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Roder Indica V2</span>
            <button 
              onClick={onClose}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition uppercase font-bold"
            >
              <X className="h-3 w-3" /> Fechar
            </button>
          </div>
        </div>

        {/* Technical Sheet Viewer (A4 Canvas Wrapper) */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 flex justify-center">
          <div className="w-full max-w-[794px]">
            <div 
              ref={printRef}
              id="print-container"
              className="bg-white text-slate-900 shadow-xl border border-slate-200 leading-normal font-sans"
              style={{
                width: '100%',
                minHeight: '1000px',
                padding: '35px',
                boxSizing: 'border-box'
              }}
            >
              {/* PDF Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5 mb-6">
                <div>
                  <img 
                    src={RODER_LOGO_BASE64} 
                    alt="Logo Roder" 
                    className="h-10 object-contain mb-2" 
                    referrerPolicy="no-referrer"
                  />
                  <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Tecnologia Florestal & Agroindustrial</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-red-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-1">
                    Ficha Técnica Comercial
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Validade: 60 Dias (Regra Comercial)</p>
                </div>
              </div>

              {/* Title Section */}
              <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                  Garra para Estufagem e Vagões
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
                  <p className="text-xs text-red-600 font-bold uppercase tracking-wider">
                    Série AF e AFG • Modelo Selecionado: {selectedModel.name}
                  </p>
                </div>
              </div>

              {/* Top Section: Main Photo & Basic Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 h-[240px] flex items-center justify-center p-2 relative shadow-inner">
                  <img 
                    src={mainImgToRender} 
                    alt="Garra para Estufagem" 
                    className="max-h-full max-w-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[9px] px-2 py-0.5 rounded-md font-mono">
                    Foto Principal Oficial
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] uppercase tracking-wider text-slate-500 font-extrabold mb-1">Destaque do Equipamento</h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      A Garra para Estufagem Roder é projetada especificamente para operações severas de carregamento e descarregamento de toras em containers fechados (estufagem) ou vagões ferroviários. Seu desenho compacto e mandíbulas otimizadas permitem aproveitar ao máximo o espaço interno, garantindo produtividade inigualável na sua logística de madeira.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mt-4">
                    <h4 className="text-[10px] uppercase tracking-wider text-red-600 font-extrabold mb-2 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      Especificações Principais - {selectedModel.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                      <div className="border-b border-slate-100 pb-1">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Máquina Base</span>
                        <span className="font-extrabold text-slate-900">{selectedModel.specs.maquina_base}</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Peso Operacional</span>
                        <span className="font-extrabold text-slate-900">{selectedModel.specs.peso_operacional}</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Área Útil da Garra</span>
                        <span className="font-extrabold text-slate-900">{selectedModel.specs.area_da_garra}</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Peso do Equipamento</span>
                        <span className="font-extrabold text-slate-900">{selectedModel.specs.peso}</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Capacidade de Carga</span>
                        <span className="font-extrabold text-slate-900">{selectedModel.specs.capacidade_de_carga}</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Sistema Rotativo</span>
                        <span className={`font-extrabold ${selectedModel.specs.giro_360?.includes('Sim') ? 'text-red-600' : 'text-slate-900'}`}>
                          {selectedModel.specs.giro_360}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Comparison Grid */}
              <div className="mb-8">
                <h3 className="text-xs uppercase tracking-wider text-slate-900 font-extrabold mb-3 border-b-2 border-slate-200 pb-1">
                  Matriz Comparativa da Linha de Garras de Estufagem (Série AF / AFG)
                </h3>
                <div className="overflow-hidden border border-slate-200 rounded-xl">
                  <table className="w-full border-collapse text-left text-xs bg-white">
                    <thead className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                      <tr>
                        <th className="p-2.5">Modelo</th>
                        <th className="p-2.5">Máquina Indicada</th>
                        <th className="p-2.5">Peso Base Mínimo</th>
                        <th className="p-2.5">Área Útil</th>
                        <th className="p-2.5">Peso Próprio</th>
                        <th className="p-2.5">Capacidade Máx.</th>
                        <th className="p-2.5 text-center">Giro 360°</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {MODELS.map((m) => (
                        <tr 
                          key={m.id} 
                          className={`transition-colors ${
                            selectedModelId === m.id 
                              ? 'bg-red-500/10 font-bold text-slate-900 border-l-4 border-l-red-600' 
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <td className="p-2.5 font-extrabold">{m.name}</td>
                          <td className="p-2.5">{m.specs.maquina_base}</td>
                          <td className="p-2.5">{m.specs.peso_operacional}</td>
                          <td className="p-2.5">{m.specs.area_da_garra}</td>
                          <td className="p-2.5">{m.specs.peso}</td>
                          <td className="p-2.5">{m.specs.capacidade_de_carga}</td>
                          <td className="p-2.5 text-center">
                            <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              m.specs.giro_360?.includes('Sim') 
                                ? 'bg-red-600 text-white' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {m.specs.giro_360?.includes('Sim') ? 'Sim' : 'Fixo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Operational & Hydraulic Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-900 font-extrabold mb-3 border-b-2 border-slate-200 pb-1">
                    Requisitos de Instalação Hidráulica
                  </h3>
                  <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
                    <p>
                      Para que a garra funcione com total performance, sua máquina (Empilhadeira ou Pá Carregadeira) necessita de preparação hidráulica específica fornecida pela Roder:
                    </p>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>
                        <strong>Garras Fixas (Série AF):</strong> Utilizam <strong>3ª Função Padrão (2 vias)</strong>. Atua exclusivamente no acionamento de abertura e fechamento das garras. Indicada para operações lineares e seguras.
                      </li>
                      <li>
                        <strong>Garras com Giro (Série AFG):</strong> Exigem obrigatoriamente a instalação de <strong>3ª e 4ª Funções Extras (4 vias)</strong>. A 3ª função aciona o abre/fecha e a 4ª função aciona o giro contínuo de 360°, permitindo posicionar feixes de madeira em qualquer ângulo para enchimento otimizado de fornos e containers.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-red-600 font-extrabold mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      Atenção para o Dimensionamento
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      O modelo <strong>AF - 360</strong> é especialmente customizado para montagem em <strong>Empilhadeiras operacionais de 2,4 a 4,0 Toneladas</strong>. Ele assegura excelente centro de gravidade e estabilidade lateral da empilhadeira durante a movimentação intensa de madeira em pátios. Para máquinas maiores, as garras da série AFG / AF-600/800 suspensas em pás carregadeiras garantem maior produtividade física por ciclo operacional.
                    </p>
                  </div>
                  <div className="mt-3 bg-white p-3 border border-slate-200 rounded-lg text-[11px] text-slate-600 font-medium">
                    A Roder Brasil fabrica e comercializa o kit de instalação hidráulica de 3ª e 4ª funções extras para todo o mercado nacional, com engenharia homologada.
                  </div>
                </div>
              </div>

              {/* Technical Drawing & Real-operation Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-slate-500 font-extrabold mb-2">Estrutura Física & Dimensões</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 h-[180px] flex items-center justify-center p-2 relative shadow-inner">
                    <img 
                      src={drawingImgToRender} 
                      alt="Desenho Técnico 3D" 
                      className="max-h-full max-w-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[9px] px-2 py-0.5 rounded-md font-mono">
                      Desenho 3D / Diagrama Técnico
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-slate-500 font-extrabold mb-2">Operação Real em Campo</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 h-[180px] flex items-center justify-center p-2 relative shadow-inner">
                    <img 
                      src={mountedImgToRender} 
                      alt="Montado em Máquina" 
                      className="max-h-full max-w-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[9px] px-2 py-0.5 rounded-md font-mono">
                      Garra de Estufagem em Atividade
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Footer */}
              <div className="flex justify-between items-center border-t-2 border-slate-800 pt-5 mt-6 text-slate-500 text-[10px] font-mono">
                <div>
                  <p className="font-bold text-slate-800">RODER BRASIL INDUSTRIAL LTDA</p>
                  <p>Fone: (15) 3524-1111 • comercial@roderbrasil.com.br</p>
                </div>
                <div className="text-right">
                  <p>Ficha de Engenharia Técnica • Ref: FT-EST-2026</p>
                  <p>Todos os direitos reservados • Orgulho de ser 100% Nacional</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
