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
  RefreshCw
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { EditableImage } from './EditableImage';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface FresaSshFichaProps {
  onClose: () => void;
  defaultModelId?: string;
}

interface ModelSpec {
  trator_hp: string;
  pto_rpm: string;
  largura_trabalho_mm: string;
  largura_total_mm: string;
  peso_kg: string;
  diametro_rotor_mm: string;
  diametro_max_trituracao_mm: string;
  profundidade_max_trabalho_mm: string;
  dentes_tipo: string;
}

export function FresaSshFicha({ onClose, defaultModelId = 'ssh-150' }: FresaSshFichaProps) {
  const { isAdmin } = useAuth();
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
        
        // On mobile we want some padding (e.g., 16px on each side)
        const padding = window.innerWidth < 640 ? 16 : 32;
        const availableWidth = parentWidth - padding;

        const currentScale = availableWidth < targetWidth ? availableWidth / targetWidth : 1;
        setScale(currentScale);
        
        // Keep the scaled height in sync to prevent extra blank vertical scroll area
        setCardHeight(printRef.current.offsetHeight * currentScale);
      }
    };

    handleResize();

    const observer = new ResizeObserver(handleResize);
    if (printRef.current) observer.observe(printRef.current);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    window.addEventListener('resize', handleResize);

    // Dynamic scheduling to ensure height calculations are completely accurate as dynamic content & images finish loading
    const timers = [100, 300, 600, 1200, 2500].map(delay => 
      setTimeout(handleResize, delay)
    );

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      timers.forEach(clearTimeout);
    };
  }, [selectedModelId, isPrinting]);

  useEffect(() => {
    if (defaultModelId) {
      setSelectedModelId(defaultModelId);
    }
  }, [defaultModelId]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const fetchFaeLogo = async () => {
      try {
        const snap = await getDoc(doc(db, 'app_files', 'fae_header_logo'));
        if (snap.exists() && snap.data()?.data) {
          setFaeLogo(snap.data().data);
        }
      } catch (err) {
        console.error("Erro ao carregar logo FAE:", err);
      }
    };
    fetchFaeLogo();
  }, []);

  // Persistent custom image states for each model
  const [customPrimaryImages, setCustomPrimaryImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('fresa_ssh_custom_primary_images_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'ssh-150': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      'ssh-200': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      'ssh-225': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      'ssh-250': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
    };
  });

  const [customSecondaryImages, setCustomSecondaryImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('fresa_ssh_custom_secondary_images_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'ssh-150': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
      'ssh-200': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
      'ssh-225': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
      'ssh-250': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
    };
  });

  // Zooms states for editable images
  const [primaryZoom, setPrimaryZoom] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fresa_ssh_primary_zoom_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { 'ssh-150': 100, 'ssh-200': 100, 'ssh-225': 100, 'ssh-250': 100 };
  });

  const [secondaryZoom, setSecondaryZoom] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fresa_ssh_secondary_zoom_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { 'ssh-150': 100, 'ssh-200': 100, 'ssh-225': 100, 'ssh-250': 100 };
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fresa_ssh_custom_primary_images_v2', JSON.stringify(customPrimaryImages));
    } catch (e) {
      console.warn('Falha ao persistir foto principal no localStorage:', e);
    }
  }, [customPrimaryImages]);

  useEffect(() => {
    try {
      localStorage.setItem('fresa_ssh_custom_secondary_images_v2', JSON.stringify(customSecondaryImages));
    } catch (e) {
      console.warn('Falha ao persistir segunda foto no localStorage:', e);
    }
  }, [customSecondaryImages]);

  useEffect(() => {
    try {
      localStorage.setItem('fresa_ssh_primary_zoom_v2', JSON.stringify(primaryZoom));
    } catch (e) {}
  }, [primaryZoom]);

  useEffect(() => {
    try {
      localStorage.setItem('fresa_ssh_secondary_zoom_v2', JSON.stringify(secondaryZoom));
    } catch (e) {}
  }, [secondaryZoom]);

  const handleResetToDefault = () => {
    setCustomPrimaryImages({
      'ssh-150': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      'ssh-200': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      'ssh-225': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      'ssh-250': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
    });
    setCustomSecondaryImages({
      'ssh-150': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
      'ssh-200': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
      'ssh-225': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
      'ssh-250': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
    });
    setPrimaryZoom({ 'ssh-150': 100, 'ssh-200': 100, 'ssh-225': 100, 'ssh-250': 100 });
    setSecondaryZoom({ 'ssh-150': 100, 'ssh-200': 100, 'ssh-225': 100, 'ssh-250': 100 });
    toast.success('Imagens e ajustes restaurados para os padrões originais!');
  };

  const models = [
    {
      id: 'ssh-150',
      name: 'SSH 150',
      video_url: 'https://youtu.be/1nEPwzt8K4k',
      image_url: 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      specs: {
        trator_hp: '160 - 280 HP (CVT)',
        pto_rpm: '1000 rpm',
        largura_trabalho_mm: '1600 mm',
        largura_total_mm: '1980 mm',
        peso_kg: '3690 kg',
        diametro_rotor_mm: '900 mm',
        diametro_max_trituracao_mm: '700 mm (70 cm)',
        profundidade_max_trabalho_mm: '500 mm (50 cm)',
        dentes_tipo: '58 + 4 dentes (Tipo A/3 + MH)'
      } as ModelSpec
    },
    {
      id: 'ssh-200',
      name: 'SSH 200',
      video_url: 'https://youtu.be/1nEPwzt8K4k',
      image_url: 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      specs: {
        trator_hp: '200 - 360 (400) HP (CVT)',
        pto_rpm: '1000 rpm',
        largura_trabalho_mm: '2080 mm',
        largura_total_mm: '2472 mm',
        peso_kg: '4850 kg',
        diametro_rotor_mm: '900 mm',
        diametro_max_trituracao_mm: '700 mm (70 cm)',
        profundidade_max_trabalho_mm: '500 mm (50 cm)',
        dentes_tipo: '78 + 4 dentes (Tipo A/3 + MH)'
      } as ModelSpec
    },
    {
      id: 'ssh-225',
      name: 'SSH 225',
      video_url: 'https://youtu.be/1nEPwzt8K4k',
      image_url: 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      specs: {
        trator_hp: '200 - 360 (400) HP (CVT)',
        pto_rpm: '1000 rpm',
        largura_trabalho_mm: '2320 mm',
        largura_total_mm: '2712 mm',
        peso_kg: '5200 kg',
        diametro_rotor_mm: '900 mm',
        diametro_max_trituracao_mm: '700 mm (70 cm)',
        profundidade_max_trabalho_mm: '500 mm (50 cm)',
        dentes_tipo: '88 + 4 dentes (Tipo A/3 + MH)'
      } as ModelSpec
    },
    {
      id: 'ssh-250',
      name: 'SSH 250',
      video_url: 'https://www.youtube.com/watch?v=na5Z2tLWMgA',
      image_url: 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      specs: {
        trator_hp: '240 - 360 (400) HP (CVT)',
        pto_rpm: '1000 rpm',
        largura_trabalho_mm: '2560 mm',
        largura_total_mm: '2950 mm',
        peso_kg: '5600 kg',
        diametro_rotor_mm: '900 mm',
        diametro_max_trituracao_mm: '700 mm (70 cm)',
        profundidade_max_trabalho_mm: '500 mm (50 cm)',
        dentes_tipo: '98 + 4 dentes (Tipo A/3 + MH)'
      } as ModelSpec
    }
  ];

  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element) return;

    const toastId = toast.loading("Gerando arquivo PDF da Ficha Técnica...");

    try {
      // 1. Scroll the container to the top to avoid scrolled-related clipping in html-to-image
      if (wrapperRef.current) {
        wrapperRef.current.scrollTop = 0;
      }

      // 2. Force scale = 1 temporarily by setting isPrinting to true so that it renders fully and unscaled
      setIsPrinting(true);
      
      // 3. Wait for React to apply state change and browser to repaint
      await new Promise((resolve) => setTimeout(resolve, 400));

      // 4. Explicitly wait for all image components inside the element to decode and load
      const images = Array.from(element.getElementsByTagName('img'));
      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // continue even if there is an error
          });
        })
      );

      // Get precise unscaled height of the element
      const unscaledHeight = element.offsetHeight || element.scrollHeight;

      // 5. Use html-to-image to generate the PNG of the perfectly rendered live element
      const options = {
        quality: 0.98,
        pixelRatio: 2.0, // High quality, crisp text
        backgroundColor: '#ffffff',
        width: 840,
        height: unscaledHeight,
        style: {
          transform: 'none',
          transformOrigin: 'top center',
          width: '840px',
          height: `${unscaledHeight}px`,
        }
      };

      const dataUrl = await toPng(element, options);

      // Restore printing state immediately
      setIsPrinting(false);

      // Create image object to get natural dimensions
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load generated image"));
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // Slightly less than 297 to leave a tiny safe margin
      const imgHeight = (img.height * imgWidth) / img.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add remaining pages if they overflow
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const docName = `Ficha_Tecnica_FAE_SSH_${selectedModel.name.replace(/\s+/g, '_')}.pdf`;
      pdf.save(docName);
      toast.success("PDF gerado e baixado com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Error generating PDF with html-to-image:", error);
      
      // Make sure we reset printing state
      setIsPrinting(false);

      // Fallback to traditional browser print if html-to-image fails (e.g. CORS)
      toast.loading("Iniciando método de impressão alternativo...", { id: toastId });
      
      try {
        const printDiv = document.createElement('div');
        printDiv.id = "print-temp-div";
        printDiv.className = "bg-white text-black p-6 sm:p-10";
        printDiv.innerHTML = element.innerHTML;

        const style = document.createElement('style');
        style.id = "print-temp-style";
        style.innerHTML = `
          @media print {
            body > *:not(#print-temp-div) {
              display: none !important;
            }
            #print-temp-div {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: white !important;
              color: black !important;
              padding: 20px !important;
              margin: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print, [class*="no-print"] {
              display: none !important;
            }
          }
          @media screen {
            #print-temp-div {
              display: none !important;
            }
          }
        `;

        document.head.appendChild(style);
        document.body.appendChild(printDiv);

        setTimeout(() => {
          toast.dismiss(toastId);
          window.print();

          setTimeout(() => {
            document.getElementById('print-temp-div')?.remove();
            document.getElementById('print-temp-style')?.remove();
          }, 1000);
        }, 500);
      } catch (printErr) {
        console.error("Print fallback failed:", printErr);
        toast.error("Erro ao gerar PDF. Por favor, tente novamente ou use um navegador moderno.", { id: toastId });
      }
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print-backdrop">
      <div className="bg-card text-card-foreground w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col h-[96vh]">
        
        {/* Header Controls */}
        <div className="bg-muted px-6 py-4 flex items-center justify-between border-b border-border no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-orange-500/10 text-orange-500">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="font-extrabold text-sm tracking-tight text-foreground">Ficha Técnica Oficial - FRESA FAE SSH</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition-all shadow-sm"
            >
              <Download className="h-3.5 w-3.5" /> Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Area */}
        <div ref={wrapperRef} className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-8 bg-neutral-100 flex flex-col items-center">
          
          {/* Tabs inside app but hidden in print */}
          <div className="w-full max-w-4xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-2 bg-white p-1.5 rounded-xl border border-neutral-200 no-print shrink-0">
            <div className="flex flex-wrap gap-1 flex-1">
              {models.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModelId(m.id)}
                  className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                    selectedModelId === m.id 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
            
            {isAdmin && (
              <button
                onClick={handleResetToDefault}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-red-200 hover:bg-red-50 text-neutral-600 hover:text-red-600 text-xs font-semibold transition-all"
                title="Restaurar todas as fotos e zooms para as originais de fábrica"
              >
                <RefreshCw className="h-3 w-3 animate-none hover:rotate-180 transition-transform duration-300" />
                Restaurar Fotos Originais
              </button>
            )}
          </div>

          <div 
            className="w-full flex justify-center"
            style={{
              height: isPrinting ? 'auto' : (cardHeight ? `${cardHeight}px` : 'auto'),
              overflow: 'visible',
            }}
          >
            <div 
              className="bg-white text-neutral-900 p-6 sm:p-10 shadow-md border border-neutral-200 rounded-lg print-container font-sans leading-relaxed text-sm origin-top" 
              style={{
                width: '840px',
                minWidth: '840px',
                transform: isPrinting ? 'none' : `scale(${scale})`,
                transformOrigin: 'top center',
              }}
              ref={printRef}
            >
            {/* SHEET PAGE 1: INTRODUCTION & REINFORCEMENTS */}
            <div className="space-y-6">
              
              {/* Logo & Header */}
              <div className="flex justify-between items-center border-b-2 border-orange-500 pb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f97316', paddingBottom: '16px' }}>
                <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img 
                    src={RODER_LOGO_BASE64} 
                    onError={(e) => {
                      e.currentTarget.src = "/api/proxy-image?url=" + encodeURIComponent("https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png");
                    }}
                    alt="Roder" 
                    style={{ height: '44px', width: 'auto', display: 'block', maxHeight: '44px' }}
                    className="h-11 object-contain"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-none" style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, lineHeight: '1' }}>Roder</h1>
                    <p className="text-[9px] font-black tracking-widest uppercase text-orange-600 mt-1" style={{ fontSize: '9px', fontWeight: '900', color: '#ea580c', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '4px 0 0 0' }}>Distribuidor Oficial FAE no Brasil</p>
                  </div>
                </div>
                
                {/* Right Area: FAE Logo & Document Info */}
                <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {faeLogo ? (
                    <img 
                      src={faeLogo && faeLogo.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(faeLogo)}` : faeLogo} 
                      alt="FAE Logo" 
                      style={{ height: '36px', width: 'auto', display: 'block', maxHeight: '36px' }}
                      className="h-9 object-contain"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f97316', letterSpacing: '0.15em' }}>FAE</span>
                  )}
                  <div className="text-right" style={{ textAlign: 'right' }}>
                    <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-md font-bold" style={{ fontSize: '12px', backgroundColor: '#f97316', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>Ficha Técnica Oficial</span>
                    <p className="text-[9px] text-muted-foreground font-semibold mt-1" style={{ fontSize: '9px', color: '#64748b', fontWeight: '600', margin: '4px 0 0 0' }}>FRESAS FLORESTAIS FAE</p>
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="md:col-span-2 space-y-3">
                  <h2 className="text-3xl font-black text-slate-950 tracking-tight">FRESA FAE SSH - {selectedModel.name}</h2>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    A <strong className="text-slate-900">Fresa FAE SSH - {selectedModel.name}</strong> é uma fresa florestal profissional de alto rendimento projetada especificamente para a destoca em linha profunda, fresagem de tocos, raízes subterrâneas e pedras em solos agrícolas e florestais. 
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    A Roder, como distribuidora oficial da FAE no Brasil, garante o fornecimento deste implemento líder mundial, acompanhado de <strong>entrega técnica especializada</strong>, suporte de engenharia no campo e estoque completo de ferramentas de reposição de altíssima durabilidade.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 no-print">
                    <a 
                      href="https://roderbrasil.com.br/triturador-florestal/fresa-trituradora-tocos-pedras/fresa-ssh-trituradora-tocos/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-black rounded-md border border-neutral-200 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver no Site Roder
                    </a>
                    <a 
                      href={selectedModel.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-black rounded-md border border-red-200 transition-colors"
                    >
                      <Video className="h-3 w-3" /> Ver Vídeo de Operação ({selectedModel.name})
                    </a>
                  </div>
                </div>
                
                {/* Visual Model Preview Cards */}
                <div className="bg-orange-500/5 border border-orange-500/15 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[11px] text-orange-800 uppercase tracking-wider flex items-center gap-1">
                      <Settings className="h-3.5 w-3.5 text-orange-600" /> Modelos FAE SSH
                    </h4>
                    <p className="text-[10px] text-slate-500 mb-2 font-medium">Variação principal pela largura operacional:</p>
                    <ul className="text-xs text-slate-800 space-y-1.5 font-bold">
                      <li className={selectedModelId === 'ssh-150' ? 'text-orange-600' : 'text-slate-700'}>
                        • SSH 150 <span className="text-[9px] text-neutral-500 font-normal">(1.600 mm trab.)</span>
                      </li>
                      <li className={selectedModelId === 'ssh-200' ? 'text-orange-600' : 'text-slate-700'}>
                        • SSH 200 <span className="text-[9px] text-neutral-500 font-normal">(2.080 mm trab.)</span>
                      </li>
                      <li className={selectedModelId === 'ssh-225' ? 'text-orange-600' : 'text-slate-700'}>
                        • SSH 225 <span className="text-[9px] text-neutral-500 font-normal">(2.320 mm trab.)</span>
                      </li>
                      <li className={selectedModelId === 'ssh-250' ? 'text-orange-600' : 'text-slate-700'}>
                        • SSH 250 <span className="text-[9px] text-orange-600 font-bold">(2.560 mm trab. - Premium)</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-orange-500/10 text-[9px] text-neutral-500">
                    * Todos os modelos exigem trator de alta potência e sistema de transmissão CVT.
                  </div>
                </div>
              </div>

              {/* Product Visual Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {/* Equipment Image */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white flex flex-col justify-between relative h-[260px] shadow-sm">
                  <div className="absolute top-2 left-2 z-10 bg-black/70 text-white font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold tracking-widest border border-white/10 no-print">
                    Implemento Principal FAE
                  </div>
                  <div className="flex-1 h-[210px] relative w-full flex items-center justify-center p-1">
                    <EditableImage
                      src={customPrimaryImages[selectedModelId]}
                      onChange={(base64) => {
                        setCustomPrimaryImages(prev => ({
                          ...prev,
                          [selectedModelId]: base64
                        }));
                        toast.success(`Foto do implemento principal atualizada para ${selectedModel.name}!`);
                      }}
                      zoom={primaryZoom[selectedModelId]}
                      onZoomChange={(zoom) => {
                        setPrimaryZoom(prev => ({
                          ...prev,
                          [selectedModelId]: zoom
                        }));
                      }}
                      alt={`Fresa FAE SSH ${selectedModel.name}`}
                      maxHeightClass="max-h-[190px]"
                      aspectRatioClass="w-full h-full border-0 bg-transparent p-0 hover:shadow-none focus:ring-0 rounded-none"
                      outerMinHeightClass="min-h-full"
                      innerMinHeightClass="min-h-full"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="bg-slate-900 text-white p-2 text-[10px] text-center font-medium border-t border-neutral-200 z-10">
                    Fresa Trituradora de Tocos e Pedras FAE SSH em ação profunda.
                  </div>
                </div>

                {/* Field of Application / Result */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white flex flex-col justify-between relative h-[260px] shadow-sm">
                  <div className="absolute top-2 left-2 z-10 bg-black/70 text-white font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold tracking-widest border border-white/10 no-print">
                    Área Fresada / Imagem Auxiliar
                  </div>
                  <div className="flex-1 h-[210px] relative w-full flex items-center justify-center p-1">
                    <EditableImage
                      src={customSecondaryImages[selectedModelId]}
                      onChange={(base64) => {
                        setCustomSecondaryImages(prev => ({
                          ...prev,
                          [selectedModelId]: base64
                        }));
                        toast.success(`Segunda imagem (área/operação) atualizada para ${selectedModel.name}!`);
                      }}
                      zoom={secondaryZoom[selectedModelId]}
                      onZoomChange={(zoom) => {
                        setSecondaryZoom(prev => ({
                          ...prev,
                          [selectedModelId]: zoom
                        }));
                      }}
                      alt={`Fresa FAE SSH Operação/Área`}
                      maxHeightClass="max-h-[190px]"
                      aspectRatioClass="w-full h-full border-0 bg-transparent p-0 hover:shadow-none focus:ring-0 rounded-none"
                      outerMinHeightClass="min-h-full"
                      innerMinHeightClass="min-h-full"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="bg-slate-900 text-white p-2 text-[10px] text-center font-medium border-t border-neutral-200 z-10">
                    Resultado da destoca profunda ou registro do conjunto em atividade no campo.
                  </div>
                </div>
              </div>

              {/* SECTION: CVT COMPATIBILITY - HIGH PRIORITY SELLER/CLIENT CLARITY */}
              <div className="bg-orange-50 p-5 rounded-2xl border border-orange-200 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-500 rounded-xl text-white mt-0.5 shrink-0">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">
                      Compatibilidade Exclusiva com Tratores CVT (Obrigatório)
                    </h3>
                    <p className="text-xs text-orange-950 font-semibold leading-relaxed">
                      Nossa fresa foi desenvolvida, testada e homologada para operar <span className="underline">exclusivamente com tratores equipados com transmissão CVT</span> (Continuously Variable Transmission). O vendedor deve esclarecer esta necessidade indispensável para assegurar a integridade e produtividade do conjunto.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="bg-white p-3.5 rounded-xl border border-orange-200/60 space-y-2">
                    <h4 className="font-extrabold text-orange-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" /> Por que o Sistema CVT é Essencial?
                    </h4>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      Na fresagem e destoca profunda, a resistência do solo varia segundo a presença instantânea de tocos, raízes grossas e pedras. O sistema <strong>CVT ajusta continuamente e de forma eletrônica a velocidade de avanço do trator (de 0 a 1 km/h)</strong> mantendo a rotação do motor estável e na faixa ideal de torque.
                    </p>
                    <ul className="text-slate-800 font-bold space-y-1 text-[11px]">
                      <li className="flex items-center gap-1 text-emerald-700">✔ Avanço preciso e constante</li>
                      <li className="flex items-center gap-1 text-emerald-700">✔ Máxima preservação da potência do motor</li>
                      <li className="flex items-center gap-1 text-emerald-700">✔ Redução expressiva no consumo de combustível</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-orange-200/60 space-y-2">
                    <h4 className="font-extrabold text-amber-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" /> Super Redutor (Creeper) Não é Suficiente
                    </h4>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      O Creeper reduz mecanicamente a velocidade por engrenagens fixas. Embora atinja baixas velocidades, ele <strong>não realiza o gerenciamento dinâmico automático</strong> de rotação, torque e velocidade durante as oscilações violentas de carga da fresa.
                    </p>
                    <ul className="text-slate-800 font-bold space-y-1 text-[11px]">
                      <li className="flex items-center gap-1 text-red-700">❌ Risco de sobrecarga extrema e quebras na transmissão</li>
                      <li className="flex items-center gap-1 text-red-700">❌ Constantes oscilações de rotação e perda de eficiência</li>
                      <li className="flex items-center gap-1 text-red-700">❌ Alto índice de paradas de máquina no campo</li>
                    </ul>
                  </div>
                </div>

                {/* Consequences Warning Banner */}
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-950 font-medium text-xs leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>ALERTA DE SEGURANÇA E GARANTIA:</strong> A utilização da Fresa FAE SSH em tratores mecânicos comuns ou sem transmissão CVT ocasiona perda imediata de produtividade, aumento drástico do consumo de diesel, sobrecarga térmica de embreagem e transmissão, além de poder anular a garantia de fábrica do implemento.
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
                      <tr className="bg-slate-950 text-white font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="p-3 border-r border-slate-800">Parâmetro de Engenharia</th>
                        <th className="p-3">Valor Especificado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-medium text-neutral-800">
                      <tr>
                        <td className="p-3 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[10px] tracking-wider text-neutral-500">Potência Recomendada do Trator</td>
                        <td className="p-3 font-extrabold text-neutral-900">{selectedModel.specs.trator_hp}</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[10px] tracking-wider text-neutral-500">Rotação da Tomada de Força (PTO)</td>
                        <td className="p-3 font-extrabold text-neutral-900">{selectedModel.specs.pto_rpm}</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[10px] tracking-wider text-neutral-500">Largura de Trabalho Útil</td>
                        <td className="p-3 font-extrabold text-neutral-900">{selectedModel.specs.largura_trabalho_mm}</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[10px] tracking-wider text-neutral-500">Largura Total Externa</td>
                        <td className="p-3 font-extrabold text-neutral-900">{selectedModel.specs.largura_total_mm}</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[10px] tracking-wider text-neutral-500">Peso do Implemento Padrão</td>
                        <td className="p-3 font-extrabold text-neutral-900">{selectedModel.specs.peso_kg}</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[10px] tracking-wider text-neutral-500">Diâmetro do Rotor de Fresagem</td>
                        <td className="p-3 font-extrabold text-neutral-900">{selectedModel.specs.diametro_rotor_mm}</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[10px] tracking-wider text-neutral-500">Diâmetro Máximo de Trituração</td>
                        <td className="p-3 font-extrabold text-neutral-900 text-orange-600">{selectedModel.specs.diametro_max_trituracao_mm}</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[10px] tracking-wider text-neutral-500">Profundidade Máxima de Trabalho</td>
                        <td className="p-3 font-extrabold text-neutral-900 text-orange-600">{selectedModel.specs.profundidade_max_trabalho_mm}</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-neutral-50/50 font-bold border-r border-neutral-200 uppercase text-[10px] tracking-wider text-neutral-500">Número de Dentes Tipo A/3+MH</td>
                        <td className="p-3 font-extrabold text-neutral-900">{selectedModel.specs.dentes_tipo}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-500 font-medium italic">
                  Os dados técnicos referem-se à máquina no padrão de fábrica. Os dados podem ser alterados pelo fabricante sem aviso prévio.
                </p>
              </div>

              {/* OBSERVATION ON WORKING DEPTH & SOIL RESISTANCE */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-2 text-xs">
                <h4 className="font-extrabold text-amber-950 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <Info className="h-4 w-4 text-amber-700 shrink-0" /> Observações sobre Profundidade de Trabalho & Potência
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] leading-relaxed text-slate-800 font-medium">
                  <div className="space-y-1.5">
                    <p>
                      • <strong>Dependência da Resistência do Solo:</strong> A profundidade máxima de trabalho de até 50 cm e a profundidade total alcançada em uma única passada dependem diretamente da resistência e compactação do solo.
                    </p>
                    <p>
                      • <strong>Múltiplas Passadas:</strong> Em solos muito compactos, pode ser necessário realizar mais de uma passada para atingir a profundidade máxima de 50 cm. O equipamento não garante atingir os 50 cm em uma única passada.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p>
                      • <strong>Dependência da Potência do Trator:</strong> Para alcançar a profundidade máxima, o trator deve operar em sua máxima potência exigida pelo equipamento, e não na potência mínima especificada.
                    </p>
                    <p>
                      • <strong>Compactação Extrema:</strong> Solos de altíssima compactação podem limitar fisicamente a profundidade máxima alcançável, mesmo realizando passadas consecutivas, devido aos limites de resistência física do terreno.
                    </p>
                  </div>
                </div>
              </div>

              {/* PAGE BREAK FOR PDF EXPORT GENTLY HANDLED */}
              <div className="pt-4 border-t border-dashed border-neutral-300"></div>

              {/* SECTION: TRACTORS IN BRAZIL WITH CVT */}
              <div className="space-y-3">
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-orange-500" /> Tratores CVT Homologados e Disponíveis no Brasil
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                  Para facilitar a triagem de vendas e o alinhamento com os produtores, estas são as principais marcas e frotas de tratores de alta potência equipados com a tecnologia CVT nacionalmente homologados:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Massey Ferguson */}
                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="font-extrabold text-red-600 text-xs tracking-wider uppercase">MASSEY FERGUSON</div>
                      <div className="font-black text-neutral-900 text-sm">Transmissão Dyna-VT</div>
                      <p className="text-[11px] text-neutral-600 leading-snug">
                        Série de tratores de alta potência integrados à famosa caixa Dyna-VT. Proporciona controle total da velocidade milimétrica, crucial para a fresagem pesada.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-800 bg-red-100/50 border border-red-200 rounded px-2 py-0.5 w-max">
                      Tecnologia Dyna-VT
                    </span>
                  </div>

                  {/* Valtra */}
                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="font-extrabold text-yellow-600 text-xs tracking-wider uppercase">VALTRA</div>
                      <div className="font-black text-neutral-900 text-sm">Séries T CVT & Q</div>
                      <p className="text-[11px] text-neutral-600 leading-snug">
                        Modelos equipados com transmissão CVT que variam a velocidade milimetricamente de forma suave, sem degraus de marcha, protegendo os eixos PTO.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-800 bg-yellow-100/50 border border-yellow-200 rounded px-2 py-0.5 w-max">
                      Séries T CVT / Série Q
                    </span>
                  </div>

                  {/* Fendt */}
                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="font-extrabold text-emerald-700 text-xs tracking-wider uppercase">FENDT</div>
                      <div className="font-black text-neutral-900 text-sm">Transmissão Vario</div>
                      <p className="text-[11px] text-neutral-600 leading-snug">
                        Pioneira mundial em CVT, a transmissão Fendt Vario realiza a coordenação eletrônica perfeita entre implemento e motor de alta potência.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-800 bg-emerald-100/50 border border-emerald-200 rounded px-2 py-0.5 w-max">
                      Transmissão Vario
                    </span>
                  </div>
                </div>
              </div>

              {/* COMMITED STOCK AND SPARE PARTS */}
              <div className="bg-neutral-950 text-white p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <h4 className="font-extrabold text-xs text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Wrench className="h-4 w-4" /> Peças de Reposição & Suporte Nacional
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                    A Roder assegura ao produtor o fornecimento contínuo de <strong>ferramentas de corte FAE originais (Dentes tipo A/3 e dentes tipo MH)</strong> que possuem pastilhas de carboneto de tungstênio (Vídea) de altíssima resistência a impactos e abrasividade.
                  </p>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                    Mantemos um estoque robusto em nossas filiais (incluindo Sinop-MT e Matriz) com eixos, correias de transmissão, rolamentos e dentes de reposição imediatos.
                  </p>
                </div>
                <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
                  <div className="font-bold text-orange-400 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                    <Sparkles className="h-4 w-4 text-orange-500" /> Diferenciais Roder na Entrega Técnica
                  </div>
                  <ul className="space-y-1.5 text-neutral-300 font-bold">
                    <li className="flex items-center gap-1.5 text-[11px]">✔ Acoplamento inicial supervisionado por Engenharia</li>
                    <li className="flex items-center gap-1.5 text-[11px]">✔ Calibração ideal do sistema hidráulico e PTO</li>
                    <li className="flex items-center gap-1.5 text-[11px]">✔ Treinamento prático de CVT de avanço para os operadores</li>
                  </ul>
                </div>
              </div>

              {/* FOOTER OF TECHNICAL SHEET */}
              <div className="border-t border-neutral-200 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                <span>Roder Máquinas e Equipamentos Ltda.</span>
                <span>Distribuição, Serviços e Garantia Oficial FAE</span>
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
