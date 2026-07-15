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
  Video,
  ExternalLink,
  Cpu,
  Bookmark,
  Sparkles,
  Layers,
  Wrench,
  RefreshCw,
  FileText,
  Share2,
  Maximize2
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { EditableImage } from './EditableImage';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface TrituradorLoaderFaeFichaProps {
  onClose: () => void;
  defaultModelId?: string;
}

interface ModelSpec {
  maquina_base: string;
  motor_hp: string;
  vazao_lmin: string;
  pressao_bar: string;
  largura_trabalho_mm: string;
  largura_total_mm: string;
  peso_kg: string;
  diametro_rotor_mm: string;
  diametro_max_trituracao_mm: string;
  dentes_c3: string;
  dentes_bl: string;
}

export function TrituradorLoaderFaeFicha({ onClose, defaultModelId = 'fae-uml-ssl-vt-175' }: TrituradorLoaderFaeFichaProps) {
  const { isAdmin, isManager, isTriagem, isMarketing, isInternalSeller } = useAuth();
  const canEdit = isAdmin || isManager || isTriagem || isMarketing || isInternalSeller;
  const printRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>(defaultModelId);
  const [faeLogo, setFaeLogo] = useState<string | null>(null);
  
  const [scale, setScale] = useState<number>(1);
  const [cardHeight, setCardHeight] = useState<number>(0);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current && printRef.current) {
        if (isPrinting) {
          setScale(1);
          setCardHeight(printRef.current.offsetHeight);
          return;
        }

        const parentWidth = wrapperRef.current.clientWidth;
        const targetWidth = 840; // Perfect standard A4 proportional desktop width
        
        const padding = window.innerWidth < 640 ? 16 : 32;
        const availableWidth = parentWidth - padding;

        const currentScale = availableWidth < targetWidth ? availableWidth / targetWidth : 1;
        setScale(currentScale);
        
        setCardHeight(printRef.current.offsetHeight * currentScale);
      }
    };

    handleResize();

    const observer = new ResizeObserver(handleResize);
    if (printRef.current) observer.observe(printRef.current);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    window.addEventListener('resize', handleResize);

    const timers = [100, 300, 600, 1200, 2500].map(delay => 
      setTimeout(handleResize, delay)
    );

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      timers.forEach(clearTimeout);
    };
  }, [selectedModelId, isPrinting]);

  // Load FAE logo from Firestore or fallback to a standard clean text representation
  useEffect(() => {
    const fetchFaeLogo = async () => {
      try {
        const snap = await getDoc(doc(db, 'system_files', 'fae_header_logo'));
        if (snap.exists()) {
          setFaeLogo(snap.data().data);
        }
      } catch (err) {
        console.error("Erro ao carregar logo FAE:", err);
      }
    };
    fetchFaeLogo();
  }, []);

  // Models technical specifications mapping
  const modelsData: Record<string, { name: string; specs: ModelSpec }> = {
    'fae-uml-ssl-vt-175': {
      name: 'FAE UML SSL VT 175',
      specs: {
        maquina_base: 'Caterpillar 924K',
        motor_hp: '75 - 120 hp',
        vazao_lmin: '120 - 200 L/min (High Flow)',
        pressao_bar: '200 - 350 bar',
        largura_trabalho_mm: '1.820 mm (1,82 m)',
        largura_total_mm: '2.120 mm (2,12 m)',
        peso_kg: '1.400 kg',
        diametro_rotor_mm: '425 mm',
        diametro_max_trituracao_mm: '200 mm (Madeira/Restos)',
        dentes_c3: '36 + 2 dentes tipo C/3 + C/3/SS',
        dentes_bl: '50 + 2 dentes tipo Lâmina BL + C/3/SS'
      }
    },
    'fae-140-u-pm-200': {
      name: 'FAE 140 U PM 200',
      specs: {
        maquina_base: 'Caterpillar 930K / 938K',
        motor_hp: '180 - 300 hp',
        vazao_lmin: '150 - 360 L/min (High Flow Dedicada)',
        pressao_bar: '250 - 415 bar',
        largura_trabalho_mm: '2.064 mm (2,06 m)',
        largura_total_mm: '2.464 mm (2,46 m)',
        peso_kg: '2.960 kg',
        diametro_rotor_mm: '500 mm',
        diametro_max_trituracao_mm: '350 mm (Troncos e Galhadas)',
        dentes_c3: '42 + 2 dentes tipo C/3 + C/3/SS',
        dentes_bl: 'A consultar'
      }
    }
  };

  const selectedModel = modelsData[selectedModelId] || modelsData['fae-uml-ssl-vt-175'];

  // Persistent custom loader images (Loader with shredder)
  const [customLoaderImages, setCustomLoaderImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('fae_loader_custom_loader_images_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'fae-uml-ssl-vt-175': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-fae-uml-ssl-vt.jpg.webp',
      'fae-140-u-pm-200': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-cat-930.jpg.webp'
    };
  });

  // Persistent custom shredder images (Shredder only)
  const [customShredderImages, setCustomShredderImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('fae_loader_custom_shredder_images_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'fae-uml-ssl-vt-175': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-fae-uml-ssl-vt.jpg.webp',
      'fae-140-u-pm-200': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-cat-930.jpg.webp'
    };
  });

  // Persistent custom tooth C3 images
  const [customToothC3Images, setCustomToothC3Images] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('fae_loader_custom_tooth_c3_images_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'fae-uml-ssl-vt-175': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-fae-uml-ssl-vt.jpg.webp',
      'fae-140-u-pm-200': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-cat-930.jpg.webp'
    };
  });

  // Persistent custom tooth BL images
  const [customToothBLImages, setCustomToothBLImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('fae_loader_custom_tooth_bl_images_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'fae-uml-ssl-vt-175': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-fae-uml-ssl-vt.jpg.webp',
      'fae-140-u-pm-200': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-cat-930.jpg.webp'
    };
  });

  // Zoom states for editable images
  const [loaderZoom, setLoaderZoom] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fae_loader_loader_zoom_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { 'fae-uml-ssl-vt-175': 100, 'fae-140-u-pm-200': 100 };
  });

  const [shredderZoom, setShredderZoom] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fae_loader_shredder_zoom_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { 'fae-uml-ssl-vt-175': 100, 'fae-140-u-pm-200': 100 };
  });

  const [toothC3Zoom, setToothC3Zoom] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fae_loader_tooth_c3_zoom_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { 'fae-uml-ssl-vt-175': 100, 'fae-140-u-pm-200': 100 };
  });

  const [toothBLZoom, setToothBLZoom] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fae_loader_tooth_bl_zoom_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { 'fae-uml-ssl-vt-175': 100, 'fae-140-u-pm-200': 100 };
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fae_loader_custom_loader_images_v2', JSON.stringify(customLoaderImages));
    } catch (e) {}
  }, [customLoaderImages]);

  useEffect(() => {
    try {
      localStorage.setItem('fae_loader_custom_shredder_images_v2', JSON.stringify(customShredderImages));
    } catch (e) {}
  }, [customShredderImages]);

  useEffect(() => {
    try {
      localStorage.setItem('fae_loader_custom_tooth_c3_images_v2', JSON.stringify(customToothC3Images));
    } catch (e) {}
  }, [customToothC3Images]);

  useEffect(() => {
    try {
      localStorage.setItem('fae_loader_custom_tooth_bl_images_v2', JSON.stringify(customToothBLImages));
    } catch (e) {}
  }, [customToothBLImages]);

  useEffect(() => {
    try {
      localStorage.setItem('fae_loader_loader_zoom_v2', JSON.stringify(loaderZoom));
    } catch (e) {}
  }, [loaderZoom]);

  useEffect(() => {
    try {
      localStorage.setItem('fae_loader_shredder_zoom_v2', JSON.stringify(shredderZoom));
    } catch (e) {}
  }, [shredderZoom]);

  useEffect(() => {
    try {
      localStorage.setItem('fae_loader_tooth_c3_zoom_v2', JSON.stringify(toothC3Zoom));
    } catch (e) {}
  }, [toothC3Zoom]);

  useEffect(() => {
    try {
      localStorage.setItem('fae_loader_tooth_bl_zoom_v2', JSON.stringify(toothBLZoom));
    } catch (e) {}
  }, [toothBLZoom]);

  const handleResetToDefault = () => {
    setCustomLoaderImages({
      'fae-uml-ssl-vt-175': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-fae-uml-ssl-vt.jpg.webp',
      'fae-140-u-pm-200': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-cat-930.jpg.webp'
    });
    setCustomShredderImages({
      'fae-uml-ssl-vt-175': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-fae-uml-ssl-vt.jpg.webp',
      'fae-140-u-pm-200': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-cat-930.jpg.webp'
    });
    setCustomToothC3Images({
      'fae-uml-ssl-vt-175': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-fae-uml-ssl-vt.jpg.webp',
      'fae-140-u-pm-200': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-cat-930.jpg.webp'
    });
    setCustomToothBLImages({
      'fae-uml-ssl-vt-175': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-fae-uml-ssl-vt.jpg.webp',
      'fae-140-u-pm-200': 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-cat-930.jpg.webp'
    });
    setLoaderZoom({ 'fae-uml-ssl-vt-175': 100, 'fae-140-u-pm-200': 100 });
    setShredderZoom({ 'fae-uml-ssl-vt-175': 100, 'fae-140-u-pm-200': 100 });
    setToothC3Zoom({ 'fae-uml-ssl-vt-175': 100, 'fae-140-u-pm-200': 100 });
    setToothBLZoom({ 'fae-uml-ssl-vt-175': 100, 'fae-140-u-pm-200': 100 });
    toast.success("Imagens redefinidas para o padrão original!");
  };  const exportToPdf = async () => {
    const toastId = toast.loading("Gerando ficha técnica em alta definição...");
    const element = printRef.current;

    if (!element) {
      toast.error("Ocorreu um erro: elemento não renderizado.");
      toast.dismiss(toastId);
      return;
    }

    try {
      setIsPrinting(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = element.querySelectorAll('.pdf-page');

      if (pages.length === 0) {
        throw new Error("Nenhuma página HTML foi encontrada para renderização.");
      }

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const options = {
          quality: 1.0,
          pixelRatio: 3.0, // High-DPI capture for super sharp crisp text!
          backgroundColor: '#ffffff',
          width: 840,
          height: 1188,
          style: {
            transform: 'none',
            transformOrigin: 'top center',
            width: '840px',
            height: '1188px',
          }
        };

        const pageDataUrl = await toPng(pageEl, options);

        if (i > 0) {
          pdf.addPage();
        }

        // Add to PDF page-by-page. Since dimensions are exact A4, it fits perfectly on 210 x 297 mm
        pdf.addImage(pageDataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      }

      setIsPrinting(false);
      const docName = `Ficha_Tecnica_FAE_Triturador_Loader_${selectedModel.name.replace(/\s+/g, '_')}.pdf`;
      pdf.save(docName);
      toast.success("Ficha técnica exportada com sucesso em altíssima qualidade!", { id: toastId });
    } catch (error) {
      console.error("Error generating PDF with html-to-image:", error);
      setIsPrinting(false);
      toast.error("Erro na conversão automática. Tentando método nativo de impressão...", { id: toastId });
      
      // Traditional browser print fallback
      try {
        window.print();
      } catch (e) {
        toast.error("Falha na impressão do navegador.", { id: toastId });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div 
        id="triturador-loader-ficha-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[90vh]"
      >
        {/* Modal Header Controls */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-orange-500 animate-pulse" />
            <div>
              <h2 className="text-white font-black text-sm tracking-wide uppercase">Ficha Técnica Digital Roder</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Trituradores FAE p/ Pá Carregadeira</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetToDefault}
                className="h-8 text-xs border-slate-700 hover:bg-slate-800 text-slate-300 font-bold gap-1.5"
              >
                <RefreshCw className="h-3 w-3" /> Padrão
              </Button>
            )}
            <Button 
              onClick={exportToPdf}
              className="h-8 px-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider gap-1.5 shrink-0"
            >
              <Download className="h-3 w-3" /> Exportar PDF
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Dynamic Model Switcher Controls */}
        <div className="bg-slate-950/80 p-2.5 border-b border-slate-800 flex flex-wrap gap-2 items-center justify-between px-4 no-print">
          <div className="flex gap-1.5">
            {Object.keys(modelsData).map((id) => (
              <button
                key={id}
                onClick={() => setSelectedModelId(id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  selectedModelId === id 
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-900/30 ring-1 ring-orange-500/30' 
                    : 'bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {modelsData[id].name}
              </button>
            ))}
          </div>
          <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase hidden md:inline">
            A4 Proporcional • Zoom Ajustado: {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-6" ref={wrapperRef}>
          <div 
            className="mx-auto text-slate-900 rounded-none shadow-xl origin-top transition-all duration-300"
            style={{
              width: '840px',
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              marginBottom: isPrinting ? '0px' : `-${2408 - (2408 * scale)}px`,
              height: isPrinting ? 'auto' : `${2408 * scale}px`
            }}
          >
            {/* The printable A4 Sheet starts here */}
            <div 
              ref={printRef}
              className="w-[840px] flex flex-col gap-8 bg-slate-950 no-print-bg pb-8"
            >
              {/* PAGE 1 */}
              <div 
                className="pdf-page bg-white p-8 w-[840px] h-[1188px] flex flex-col justify-between relative border border-neutral-100 shrink-0 select-none shadow-xl"
                style={{ boxSizing: 'border-box' }}
              >
                <div className="space-y-4">
                  {/* BRAND HEADER */}
                  <div className="flex justify-between items-center border-b-4 border-orange-500 pb-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={RODER_LOGO_BASE64} 
                        alt="Roder" 
                        className="h-10 w-auto"
                        referrerPolicy="no-referrer"
                      />
                      <div className="h-8 w-[2px] bg-neutral-300"></div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[15px] tracking-tight text-neutral-900 uppercase">Roder Florestal</span>
                        <span className="text-[8px] tracking-widest font-black uppercase text-neutral-500">Distribuidor Exclusivo FAE</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      {faeLogo ? (
                        <img 
                          src={faeLogo} 
                          alt="FAE logo" 
                          className="h-8 w-auto object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="font-black text-red-600 tracking-tighter text-xl uppercase">FAE</div>
                      )}
                      <span className="text-[8px] font-bold text-neutral-400 tracking-widest uppercase mt-0.5">Sistemas de Manejo de Solo e Florestal</span>
                    </div>
                  </div>

                  {/* FICHA TITLE BANNER */}
                  <div className="bg-slate-950 text-white p-5 rounded-xl relative overflow-hidden flex justify-between items-center shadow-md">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-orange-600/20 to-transparent pointer-events-none"></div>
                    <div className="space-y-1 z-10">
                      <div className="inline-flex items-center gap-1.5 bg-orange-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" /> Linha Loader Premium
                      </div>
                      <h1 className="text-2xl font-black tracking-tight leading-tight uppercase">
                        {selectedModel.name}
                      </h1>
                      <p className="text-xs text-neutral-300 font-medium max-w-xl leading-normal">
                        Triturador e Desbastador Florestal de alto rendimento (Mulcher) acoplável na dianteira de pás carregadeiras Caterpillar de médio porte com preparação hidráulica dedicada.
                      </p>
                    </div>
                    <div className="text-right shrink-0 z-10">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-orange-400">Máquina Base Compatível</div>
                      <div className="text-lg font-black text-white">{selectedModel.specs.maquina_base}</div>
                      <div className="text-[10px] text-neutral-400 font-medium">Original de Fábrica</div>
                    </div>
                  </div>

                  {/* COMPATIBILITY RECOMMENDATION & ATTENTION RULE */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                    <Info className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-slate-800 leading-normal">
                      <span className="font-extrabold text-slate-950 uppercase block mb-1">Recomendação Operacional Importante</span>
                      <p>
                        A Roder trabalha em conformidade direta com os padrões de engenharia florestal. A montagem dos trituradores FAE em pás carregadeiras Caterpillar (como 924K, 930K ou 938K) garante aceleração hidráulica constante por conta do <strong>recurso de bloqueio do acelerador de fábrica</strong>. Isso mantém a rotação máxima do rotor, independente da velocidade de deslocamento.
                      </p>
                    </div>
                  </div>

                  {/* IMAGES GRAPHIC GRID */}
                  <div className="grid grid-cols-2 gap-4 items-stretch">
                    {/* 1. Loader with shredder photo (Square format) */}
                    <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white flex flex-col justify-between relative h-[240px] shadow-sm">
                      <div className="absolute top-2 left-2 z-10 bg-black/75 text-white font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-widest border border-white/10 no-print">
                        Conjunto
                      </div>
                      <div className="flex-1 h-[185px] relative w-full flex items-center justify-center p-1">
                        <EditableImage
                          src={customLoaderImages[selectedModelId]}
                          onChange={(base64) => {
                            setCustomLoaderImages(prev => ({ ...prev, [selectedModelId]: base64 }));
                            toast.success(`Foto do conjunto pá carregadeira + mulcher updated!`);
                          }}
                          zoom={loaderZoom[selectedModelId]}
                          onZoomChange={(zoom) => {
                            setLoaderZoom(prev => ({ ...prev, [selectedModelId]: zoom }));
                          }}
                          alt={`Pá carregadeira com triturador FAE ${selectedModel.name}`}
                          maxHeightClass="max-h-[165px]"
                          aspectRatioClass="w-full h-full border-0 bg-transparent p-0 hover:shadow-none focus:ring-0 rounded-none"
                          outerMinHeightClass="min-h-full"
                          innerMinHeightClass="min-h-full"
                          disabled={!canEdit}
                        />
                      </div>
                      <div className="bg-slate-900 text-white p-2 text-[10px] text-center font-semibold border-t border-neutral-200 z-10">
                        {selectedModel.specs.maquina_base} com FAE {selectedModel.name}.
                      </div>
                    </div>

                    {/* 2. Shredder only photo */}
                    <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white flex flex-col justify-between relative h-[240px] shadow-sm">
                      <div className="absolute top-2 left-2 z-10 bg-black/75 text-white font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-widest border border-white/10 no-print">
                        Implemento Principal
                      </div>
                      <div className="flex-1 h-[185px] relative w-full flex items-center justify-center p-1">
                        <EditableImage
                          src={customShredderImages[selectedModelId]}
                          onChange={(base64) => {
                            setCustomShredderImages(prev => ({ ...prev, [selectedModelId]: base64 }));
                            toast.success(`Foto do implemento principal updated!`);
                          }}
                          zoom={shredderZoom[selectedModelId]}
                          onZoomChange={(zoom) => {
                            setShredderZoom(prev => ({ ...prev, [selectedModelId]: zoom }));
                          }}
                          alt={`Triturador Florestal FAE ${selectedModel.name}`}
                          maxHeightClass="max-h-[165px]"
                          aspectRatioClass="w-full h-full border-0 bg-transparent p-0 hover:shadow-none focus:ring-0 rounded-none"
                          outerMinHeightClass="min-h-full"
                          innerMinHeightClass="min-h-full"
                          disabled={!canEdit}
                        />
                      </div>
                      <div className="bg-slate-900 text-white p-2 text-[10px] text-center font-semibold border-t border-neutral-200 z-10">
                        Estrutura robusta com chassi reforçado.
                      </div>
                    </div>
                  </div>

                  {/* TECHNICAL DATA TABLE */}
                  <div className="space-y-2">
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-4 w-4 text-orange-500" /> Especificações Técnicas - {selectedModel.name}
                    </h3>
                    <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950 text-white font-extrabold uppercase text-[9px] tracking-wider">
                            <th className="p-2 border-r border-slate-800">Parâmetros de Engenharia</th>
                            <th className="p-2">Dados de Fábrica Recomendados</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 font-semibold text-neutral-800">
                          <tr>
                            <td className="p-2 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[9px] tracking-wider text-neutral-500">Máquina Base (Pá Carregadeira)</td>
                            <td className="p-2 font-extrabold text-neutral-900 uppercase text-[10px]">{selectedModel.specs.maquina_base}</td>
                          </tr>
                          <tr>
                            <td className="p-2 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[9px] tracking-wider text-neutral-500">Requisitos de Potência (Motor)</td>
                            <td className="p-2 font-extrabold text-neutral-900 text-[10px]">{selectedModel.specs.motor_hp}</td>
                          </tr>
                          <tr>
                            <td className="p-2 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[9px] tracking-wider text-neutral-500">Vazão Hidráulica Requerida</td>
                            <td className="p-2 font-extrabold text-orange-600 text-[10px]">{selectedModel.specs.vazao_lmin}</td>
                          </tr>
                          <tr>
                            <td className="p-2 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[9px] tracking-wider text-neutral-500">Pressão Operacional Hidráulica</td>
                            <td className="p-2 font-extrabold text-orange-600 text-[10px]">{selectedModel.specs.pressao_bar}</td>
                          </tr>
                          <tr>
                            <td className="p-2 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[9px] tracking-wider text-neutral-500">Largura Útil de Trabalho</td>
                            <td className="p-2 font-extrabold text-neutral-900 text-[10px]">{selectedModel.specs.largura_trabalho_mm}</td>
                          </tr>
                          <tr>
                            <td className="p-2 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[9px] tracking-wider text-neutral-500">Largura Total Externa</td>
                            <td className="p-2 font-extrabold text-neutral-900 text-[10px]">{selectedModel.specs.largura_total_mm}</td>
                          </tr>
                          <tr>
                            <td className="p-2 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[9px] tracking-wider text-neutral-500">Peso Líquido do Implemento</td>
                            <td className="p-2 font-extrabold text-neutral-900 text-[10px]">{selectedModel.specs.peso_kg}</td>
                          </tr>
                          <tr>
                            <td className="p-2 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[9px] tracking-wider text-neutral-500">Diâmetro do Rotor de Corte</td>
                            <td className="p-2 font-extrabold text-neutral-900 text-[10px]">{selectedModel.specs.diametro_rotor_mm}</td>
                          </tr>
                          <tr>
                            <td className="p-2 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[9px] tracking-wider text-neutral-500">Diâmetro Máximo de Trituração</td>
                            <td className="p-2 font-extrabold text-orange-600 text-[11px]">{selectedModel.specs.diametro_max_trituracao_mm}</td>
                          </tr>
                          <tr>
                            <td className="p-2 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[9px] tracking-wider text-neutral-500">Número de Ferramentas (Dentes C/3)</td>
                            <td className="p-2 font-extrabold text-neutral-900 text-[10px]">{selectedModel.specs.dentes_c3}</td>
                          </tr>
                          <tr>
                            <td className="p-2 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[9px] tracking-wider text-neutral-500">Número de Ferramentas (Dentes Lâmina BL)</td>
                            <td className="p-2 font-extrabold text-neutral-900 text-[10px]">{selectedModel.specs.dentes_bl}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                <div className="border-t border-neutral-200 pt-3 flex justify-between items-center text-[8px] text-neutral-400 font-bold uppercase tracking-wider">
                  <span>Página 1 de 2 • Especificações Técnicas</span>
                  <span>Roder Máquinas e Equipamentos Ltda.</span>
                </div>
              </div>

              {/* PAGE 2 */}
              <div 
                className="pdf-page bg-white p-8 w-[840px] h-[1188px] flex flex-col justify-between relative border border-neutral-100 shrink-0 select-none shadow-xl"
                style={{ boxSizing: 'border-box' }}
              >
                <div className="space-y-4">
                  {/* RE-HEADER */}
                  <div className="flex justify-between items-center border-b border-neutral-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <img 
                        src={RODER_LOGO_BASE64} 
                        alt="Roder" 
                        className="h-8 w-auto"
                        referrerPolicy="no-referrer"
                      />
                      <div className="h-6 w-[1px] bg-neutral-300"></div>
                      <span className="font-extrabold text-xs tracking-tight text-neutral-800 uppercase">Roder Florestal</span>
                    </div>
                    <div className="text-[9px] font-bold text-neutral-400 tracking-wider uppercase">
                      FICHA TÉCNICA DE MANEJO FLORESTAL • MODELO {selectedModel.name}
                    </div>
                  </div>

                  {/* RECOMMENDED TEETH (DENTES RECOMENDADOS NO BRASIL) */}
                  <div className="space-y-2.5">
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-orange-500" /> Dentes e Ferramentas Homologadas pela Roder no Brasil
                    </h3>
                    <p className="text-[10.5px] text-neutral-600 leading-normal font-semibold">
                      A Roder comercializa e indica duas soluções específicas de ferramentas de acordo com o tipo de operação, solo e produtividade demandada pelo cliente:
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Tooth 1: C3 Vídia */}
                      <div className="bg-slate-50 border border-neutral-200 rounded-xl p-4 flex flex-col justify-between space-y-2.5 relative overflow-hidden shadow-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-black text-slate-950 text-xs leading-tight">Dente Tipo C/3 (Vídea / Tungstênio)</div>
                              <span className="text-[8px] font-black tracking-widest text-emerald-600 uppercase block mt-0.5">Longa Vida Útil (200h - 500h)</span>
                            </div>
                            <span className="text-[8px] font-mono font-bold bg-neutral-200/80 px-1.5 py-0.5 rounded text-neutral-700">FAE</span>
                          </div>
                          
                          <div className="h-[110px] bg-white border border-neutral-200 rounded-lg overflow-hidden relative flex items-center justify-center p-1">
                            <EditableImage
                              src={customToothC3Images[selectedModelId]}
                              onChange={(base64) => {
                                setCustomToothC3Images(prev => ({ ...prev, [selectedModelId]: base64 }));
                                toast.success(`Foto do dente C3 atualizada!`);
                              }}
                              zoom={toothC3Zoom[selectedModelId]}
                              onZoomChange={(zoom) => {
                                setToothC3Zoom(prev => ({ ...prev, [selectedModelId]: zoom }));
                              }}
                              alt="Dente C3"
                              maxHeightClass="max-h-[95px]"
                              aspectRatioClass="w-full h-full border-0 bg-transparent p-0 hover:shadow-none focus:ring-0 rounded-none"
                              outerMinHeightClass="min-h-full"
                              innerMinHeightClass="min-h-full"
                              disabled={!canEdit}
                            />
                          </div>

                          <p className="text-[10px] text-neutral-600 leading-relaxed font-medium">
                            Dente plano revestido de carboneto de metal duro (Vídea). Projetado para alta abrasividade física, ideal para triturar arrastando perto do chão ou misturando restos florestais ao solo arenoso. <strong>Dispensa afiações constantes</strong>, mantendo excelente rendimento térmico.
                          </p>
                        </div>
                      </div>

                      {/* Tooth 2: Blade BL */}
                      <div className="bg-slate-50 border border-neutral-200 rounded-xl p-4 flex flex-col justify-between space-y-2.5 relative overflow-hidden shadow-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-black text-slate-950 text-xs leading-tight">Dente Lâmina BL (Bite Limiter)</div>
                              <span className="text-[8px] font-black tracking-widest text-orange-600 uppercase block mt-0.5">Altíssima Produtividade (200h)</span>
                            </div>
                            <span className="text-[8px] font-mono font-bold bg-neutral-200/80 px-1.5 py-0.5 rounded text-neutral-700">Aço Rápido</span>
                          </div>

                          <div className="h-[110px] bg-white border border-neutral-200 rounded-lg overflow-hidden relative flex items-center justify-center p-1">
                            <EditableImage
                              src={customToothBLImages[selectedModelId]}
                              onChange={(base64) => {
                                setCustomToothBLImages(prev => ({ ...prev, [selectedModelId]: base64 }));
                                toast.success(`Foto do dente BL atualizada!`);
                              }}
                              zoom={toothBLZoom[selectedModelId]}
                              onZoomChange={(zoom) => {
                                setToothBLZoom(prev => ({ ...prev, [selectedModelId]: zoom }));
                              }}
                              alt="Dente Lâmina BL"
                              maxHeightClass="max-h-[95px]"
                              aspectRatioClass="w-full h-full border-0 bg-transparent p-0 hover:shadow-none focus:ring-0 rounded-none"
                              outerMinHeightClass="min-h-full"
                              innerMinHeightClass="min-h-full"
                              disabled={!canEdit}
                            />
                          </div>

                          <p className="text-[10px] text-neutral-600 leading-relaxed font-medium">
                            Dente de aço rápido temperado e afiado. Oferece <strong>efetividade de corte agressiva e superior</strong> para triturar grandes troncos, galhadas compactas ou realizar rebaixamento de tocos. Exige afiação constante (a cada 10h ou 50h de uso).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CRITICAL HYDRAULIC PREPARATION REQUIREMENTS (CATERPILLAR SPECIFIC) */}
                  <div className="bg-amber-50/70 p-4.5 rounded-xl border border-amber-200/80 space-y-2.5 text-[10.5px] shadow-sm">
                    <h4 className="font-black text-amber-950 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                      <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" /> Requisitos de Preparação de Fábrica da Máquina Base (Caterpillar K-Series)
                    </h4>
                    <p className="text-[10.5px] text-slate-800 leading-relaxed font-semibold">
                      Para os modelos de portadoras <strong>Caterpillar 930K ou 938K</strong>, a máquina deve obrigatoriamente ser encomendada de fábrica com a <strong>Preparação Oficial de Fábrica para Mulcher</strong>. Isso assegura os seguintes itens críticos integrados:
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] leading-relaxed text-slate-800 font-medium">
                      <div className="space-y-1.5">
                        <p>
                          • <strong>Bomba Dedicada:</strong> Bomba hidráulica independente de pistões e exclusiva de alto fluxo para a alimentação constante do motor do triturador Mulcher.
                        </p>
                        <p>
                          • <strong>Dreno Direto ao Tanque:</strong> Linha de dreno de carcaça dedicada ligada de forma direta ao reservatório/tanque de óleo principal, prevenindo contra-pressão de retorno.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p>
                          • <strong>Resfriador Reversível (Reversible Cooler):</strong> Trocador de calor autolimpante com hélice reversível para refrigeração térmica constante sob alta exigência de trabalho.
                        </p>
                        <p>
                          • <strong>3ª e 4ª Função de Fábrica:</strong> Terceira função com vazão High Flow para ativação do rotor e quarta função bidirecional para controle da abertura e fechamento da porta traseira.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* DIRECTIVES AND COMPATIBILITY FOR OTHER BRANDS */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-2.5 text-[10.5px] shadow-sm">
                    <h4 className="font-black text-slate-950 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                      <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" /> Diretrizes de Compatibilidade e Restrições para Outras Marcas (Ex: Komatsu WA200, Case W20)
                    </h4>
                    <div className="text-[10px] text-slate-800 leading-relaxed space-y-2 font-medium">
                      <p>
                        As pás carregadeiras Caterpillar da série K (924K, 930K, 938K) são modelos compatíveis devido à presença das características técnicas exigidas para a alta eficiência e proteção do conjunto. Atualmente, estas são as principais opções no mercado brasileiro que apresentam essas especificações. No entanto, se surgir qualquer outra marca ou modelo de pá carregadeira que possua as mesmas características técnicas necessárias (como vazão constante de alta pressão, aceleração controlada e resfriamento ativo), a instalação será plenamente possível após uma criteriosa avaliação técnica realizada em conjunto com a área técnica do fabricante da máquina carregadeira.
                      </p>
                      <p>
                        🛠️ <strong>Instalação em Máquinas Sem Preparação de Fábrica (Linhas Extras):</strong>
                        <br />
                        Caso os modelos compatíveis Caterpillar (924K, 930K, 938K) não tenham vindo de fábrica com a preparação hidráulica e as linhas extras necessárias para o triturador, <strong>é sim totalmente possível realizar a instalação</strong>, desde que a máquina seja devidamente adequada. Essa preparação hidráulica crítica deve ser realizada diretamente pela concessionária ou representante autorizado Caterpillar, que dispõe das condições técnicas exigidas para executar a correta instalação de modo seguro.
                      </p>
                      <p>
                        📞 <strong>Suporte para Preparação Hidráulica:</strong>
                        <br />
                        Se a máquina do cliente não possuir a preparação necessária, o cliente ou consultor comercial pode consultar diretamente a equipe da <strong>Roder</strong> para avaliarmos se há algum parceiro especializado capaz de realizar a preparação hidráulica completa na máquina, instalando todos os componentes necessários para a perfeita implementação do triturador florestal.
                      </p>
                      <p>
                        🚫 <strong>Incompatibilidade Absoluta com Bombas de Engrenagem:</strong>
                        <br />
                        Portadoras com circuito hidráulico alimentado por <strong>bomba de engrenagens simples estão TOTALMENTE DESCARTADAS</strong> para o acoplamento de trituradores florestais Mulcher. Bombas de engrenagem simples não possuem a vazão constante e a altíssima pressão de trabalho exigidas sob esforço contínuo. Tentar instalar estes implementos em circuitos de engrenagem resulta em perda imediata de produtividade, superaquecimento severo do óleo e colapso mecânico prematuro de todo o sistema hidráulico da máquina base.
                      </p>
                      <p>
                        Esta diretriz técnica serve de base para que o consultor técnico responda às consultas de vendedores e clientes sobre portadoras alternativas. Sem os devidos requisitos de engenharia (bomba de pistões axiais dedicados, alta pressão hidrostática, dreno direto e trocador reversível), a instalação é inviável e não recomendada.
                      </p>
                    </div>
                  </div>

                  {/* COMMITED SUPPORT AND WARRANTY */}
                  <div className="bg-slate-950 text-white p-4.5 rounded-xl grid grid-cols-2 gap-4 items-center">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[11px] text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Wrench className="h-4 w-4" /> Suporte & Peças Originais Roder
                      </h4>
                      <p className="text-[10px] text-neutral-300 leading-relaxed font-medium">
                        Como canal oficial florestal, a <strong>Roder</strong> garante a disponibilidade imediata de peças críticas em nossas filiais: dentes centrais C/3, dentes laterais C/3/SS, blocos de válvulas solenoides e correias originais de transmissão de alta tração.
                      </p>
                    </div>
                    <div className="bg-neutral-900 p-3.5 rounded-lg border border-neutral-800 space-y-1.5 text-[11px]">
                      <div className="font-bold text-orange-400 flex items-center gap-1.5 uppercase tracking-wide text-[9.5px]">
                        <Sparkles className="h-4 w-4 text-orange-500" /> Vantagens de Acoplamento Roder
                      </div>
                      <ul className="space-y-1 text-neutral-300 font-semibold text-[9.5px]">
                        <li className="flex items-center gap-1.5">✔ Start técnico presencial conduzido por Engenharia de Campo</li>
                        <li className="flex items-center gap-1.5">✔ Monitoramento de pressão e vazão ideal da máquina base</li>
                        <li className="flex items-center gap-1.5">✔ Cobertura total de garantia nacional autorizada FAE</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* SHEET FOOTER */}
                <div className="border-t border-neutral-200 pt-3 flex justify-between items-center text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                  <span>Roder Máquinas e Equipamentos Ltda.</span>
                  <span>Distribuição, Serviços e Garantia Oficial FAE no Brasil</span>
                  <span>www.roderbrasil.com.br</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
