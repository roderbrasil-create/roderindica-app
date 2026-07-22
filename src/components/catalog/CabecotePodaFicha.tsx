import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  ShieldCheck, 
  AlertTriangle,
  Download,
  Video,
  ExternalLink,
  Wrench,
  RefreshCw,
  Truck,
  Zap,
  Maximize2,
  Droplets,
  RotateCw,
  Scissors,
  Play,
  Layers
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { EditableImage } from './EditableImage';
import { useAuth } from '../../contexts/AuthContext';

interface CabecotePodaFichaProps {
  onClose: () => void;
}

export function CabecotePodaFicha({ onClose }: CabecotePodaFichaProps) {
  const { isAdmin, isManager, isTriagem, isMarketing, isInternalSeller } = useAuth();
  const canEdit = isAdmin || isManager || isTriagem || isMarketing || isInternalSeller;
  
  const printRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState<number>(1);
  const [cardHeight, setCardHeight] = useState<number>(0);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Editable Images States
  const [mainImageUrl, setMainImageUrl] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [mainImageZoom, setMainImageZoom] = useState<number>(1);

  const [armRequirementImageUrl, setArmRequirementImageUrl] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [armRequirementImageZoom, setArmRequirementImageZoom] = useState<number>(1);

  const [couplersImageUrl, setCouplersImageUrl] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [couplersImageZoom, setCouplersImageZoom] = useState<number>(1);

  const [hydraulicDiagramUrl, setHydraulicDiagramUrl] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [hydraulicDiagramZoom, setHydraulicDiagramZoom] = useState<number>(1);

  const [capacityGraphicImageUrl, setCapacityGraphicImageUrl] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [capacityGraphicImageZoom, setCapacityGraphicImageZoom] = useState<number>(1);

  const [sharpeningStep1Url, setSharpeningStep1Url] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [sharpeningStep1Zoom, setSharpeningStep1Zoom] = useState<number>(1);

  const [sharpeningStep2Url, setSharpeningStep2Url] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [sharpeningStep2Zoom, setSharpeningStep2Zoom] = useState<number>(1);

  const [wearPartsImageUrl, setWearPartsImageUrl] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [wearPartsImageZoom, setWearPartsImageZoom] = useState<number>(1);

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current && printRef.current) {
        if (isPrinting) {
          setScale(1);
          setCardHeight(printRef.current.offsetHeight);
          return;
        }

        const parentWidth = wrapperRef.current.clientWidth;
        const targetWidth = 840; // Desktop standard printable width
        
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
  }, [isPrinting]);

  const handleDownloadPdf = async () => {
    if (!page1Ref.current || !page2Ref.current || !page3Ref.current) return;
    setIsPrinting(true);
    toast.loading('Gerando PDF Completo em 3 Páginas A4...', { id: 'pdf-toast' });

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Render Page 1
      const dataUrl1 = await toPng(page1Ref.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
      });
      pdf.addImage(dataUrl1, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Render Page 2
      pdf.addPage();
      const dataUrl2 = await toPng(page2Ref.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
      });
      pdf.addImage(dataUrl2, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Render Page 3
      pdf.addPage();
      const dataUrl3 = await toPng(page3Ref.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
      });
      pdf.addImage(dataUrl3, 'PNG', 0, 0, pdfWidth, pdfHeight);

      pdf.save('Ficha_Tecnica_e_Procedimentos_Poda_GP150_Roder.pdf');
      toast.success('PDF baixado com sucesso em 3 páginas A4!', { id: 'pdf-toast' });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Não foi possível gerar o PDF.', { id: 'pdf-toast' });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShareWhatsapp = () => {
    const text = `*RODER MÁQUINAS - Cabeçote de Poda GP 150*\n` +
      `*Indicado:* Exclusivo para caminhões com Braço Isolado em Poda de Linha Viva\n` +
      `*Nº FINAME:* 04072997\n` +
      `*Diâmetro de Corte Nominal:* 150 mm (capacidade até 200 mm)\n` +
      `*Peso:* 130 kg | *Carga Máxima:* 50 kg\n` +
      `*Giro:* Rotator 360° Infinito (Junta Rotativa)\n` +
      `*Segurança Total:* Risco zero de acidente para o operador em altura.\n\n` +
      `🔗 *Site Oficial:* https://roderbrasil.com.br/maquina-urbana/cabecote-florestal-poda-arvores/\n` +
      `📄 *Ficha em PDF:* https://roderbrasil.com.br/wp-content/uploads/2025/10/Cabecote-de-Poda-Roder.pdf`;
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 overflow-y-auto backdrop-blur-sm">
      <div className="relative w-full max-w-[920px] h-[90vh] sm:h-[92vh] max-h-[960px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Ficha Técnica & Guia Operacional - Cabeçote de Poda GP 150
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsapp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              title="Compartilhar no WhatsApp"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              title="Baixar PDF Completo (3 Páginas)"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Baixar PDF (3 Páginas A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Viewport Wrapper */}
        <div ref={wrapperRef} className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-950 flex justify-center">
          <div 
            style={{ 
              height: cardHeight ? `${cardHeight}px` : 'auto',
              width: scale < 1 ? '100%' : '840px' 
            }} 
            className="transition-all duration-150 ease-out flex justify-center"
          >
            <div
              ref={printRef}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                width: '840px'
              }}
              className="flex flex-col gap-8 shrink-0"
            >
              
              {/* ==================== PÁGINA 1 DE 3: FICHA TÉCNICA, REQUISITOS E ENGATES RÁPIDOS ==================== */}
              <div 
                ref={page1Ref}
                className="bg-white text-slate-900 p-8 shadow-2xl rounded-sm font-sans shrink-0 border border-slate-200 flex flex-col justify-between"
                style={{ width: '840px', minHeight: '1188px' }}
              >
                <div>
                  {/* Header Document */}
                  <div className="flex items-center justify-between border-b-2 border-amber-500 pb-3 mb-5">
                    <div className="flex items-center gap-4">
                      <img 
                        src={RODER_LOGO_BASE64} 
                        alt="RODER Logo" 
                        className="h-11 object-contain"
                      />
                      <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                          CABEÇOTE DE PODA GP 150
                        </h1>
                        <p className="text-[11px] font-bold text-amber-600 tracking-wider uppercase">
                          Exclusivo para Caminhões com Sistema de Braço Isolado • Poda em Linha Viva
                        </p>
                      </div>
                    </div>
                    <div className="text-right border-l-2 border-slate-200 pl-4">
                      <span className="inline-block bg-slate-900 text-white font-extrabold text-[10px] px-2.5 py-1 rounded tracking-wider uppercase mb-1">
                        Nº FINAME: 04072997
                      </span>
                      <p className="text-[10px] font-semibold text-slate-500">
                        Sistemas Florestais e Urbanos Roder
                      </p>
                    </div>
                  </div>

                  {/* Main Banner / Product Image & Highlight Callout */}
                  <div className="grid grid-cols-12 gap-5 mb-5">
                    <div className="col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center">
                      <EditableImage 
                        src={mainImageUrl}
                        onChange={(base64) => {
                          setMainImageUrl(base64);
                          toast.success('Imagem principal atualizada!');
                        }}
                        zoom={mainImageZoom}
                        onZoomChange={setMainImageZoom}
                        alt="Cabeçote de Poda GP 150 Roder"
                        maxHeightClass="max-h-[200px]"
                        aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                        disabled={!canEdit}
                      />
                      <div className="mt-2 text-center">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                          Cabeçote de Poda / Garra GP 150
                        </span>
                      </div>
                    </div>

                    <div className="col-span-7 flex flex-col justify-between">
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-lg mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-4 w-4 text-amber-600 shrink-0" />
                          <h3 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                            Principal Benefício: Segurança Operacional Absoluta
                          </h3>
                        </div>
                        <p className="text-[11px] text-amber-950 leading-relaxed font-medium">
                          Elimina o risco de morte e queda de operadores em altura. Permite cortar galhos grandes e compridos próximos a redes elétricas energizadas (Linha Viva), movimentando e retirando o galho da posição de risco de forma ágil, precisa e 100% segura.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-slate-100 p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Diâmetro Nominal de Corte</span>
                          <span className="font-black text-slate-900 text-sm">150 mm <span className="text-[10px] font-normal text-slate-600">(Agarra até 200 mm)</span></span>
                        </div>
                        <div className="bg-slate-100 p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Peso do Equipamento</span>
                          <span className="font-black text-slate-900 text-sm">130 kg</span>
                        </div>
                        <div className="bg-slate-100 p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Capacidade de Carga</span>
                          <span className="font-black text-slate-900 text-sm">Até 50 kg <span className="text-[10px] font-normal text-slate-600">(Proteção da Fibra)</span></span>
                        </div>
                        <div className="bg-slate-100 p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Giro Central</span>
                          <span className="font-black text-emerald-700 text-sm">Rotator 360° Infinito</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Specifications Grid */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 border-b border-slate-300 pb-1.5 mb-3">
                      <Wrench className="h-4 w-4 text-slate-700" />
                      <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        Especificações Técnicas e Hidráulicas do Produto
                      </h2>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                        <span className="font-bold text-slate-800 text-[11px] block border-b border-slate-200 pb-1 uppercase">
                          Dimensões e Capacidade
                        </span>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dimensões (C x A x L):</span>
                          <span className="font-semibold text-slate-900">620 x 550 x 430 mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Abertura da Garra:</span>
                          <span className="font-semibold text-slate-900">520 mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Peso Aproximado:</span>
                          <span className="font-semibold text-slate-900">130 kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Carga Máxima:</span>
                          <span className="font-semibold text-slate-900">50 kg</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                        <span className="font-bold text-slate-800 text-[11px] block border-b border-slate-200 pb-1 uppercase">
                          Parâmetros Hidráulicos
                        </span>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Vazão Hidráulica:</span>
                          <span className="font-semibold text-slate-900">25 a 40 L/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pressão da Serra (Corte):</span>
                          <span className="font-bold text-amber-700">200 a 230 Bar</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pressão Garra e Giro:</span>
                          <span className="font-semibold text-slate-900">150 a 220 Bar</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Linhas Requeridas:</span>
                          <span className="font-semibold text-slate-900">3 Linhas Bi-direcionais</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Engates Rápidos:</span>
                          <span className="font-semibold text-slate-900">Face Plana 3/8" (20mm)</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                        <span className="font-bold text-slate-800 text-[11px] block border-b border-slate-200 pb-1 uppercase">
                          Sistema de Corte e Giro
                        </span>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Conjunto de Corte:</span>
                          <span className="font-semibold text-slate-900">Sabre + Corrente .325</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Avanço da Serra:</span>
                          <span className="font-semibold text-slate-900">Cilindro Automático</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Giro da Cabeça:</span>
                          <span className="font-semibold text-slate-900">360° sem fim</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Junta Rotativa:</span>
                          <span className="font-semibold text-slate-900">Interna Integrada</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements for Isolated Arm Vehicle + Photo Container */}
                  <div className="mb-6 bg-slate-900 text-white p-4 rounded-lg">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-amber-400" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                          Requisitos do Braço Isolado (Giro 180° e Inclinação 90°)
                        </h2>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded border border-amber-400/30">
                        Foto Exclusiva do Suporte
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-7 space-y-2.5 text-xs">
                        <div className="flex items-start gap-2 bg-slate-800/80 p-2.5 rounded border border-slate-700">
                          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-slate-200 leading-snug">
                            <strong className="text-white block mb-0.5">Sistema Duplo no Suporte:</strong>
                            O braço isolado precisa possuir o suporte com sistema de giro de 180° e o cilindro de inclinação de 90° para acoplamento perfeito.
                          </p>
                        </div>

                        <div className="flex items-start gap-2 bg-slate-800/80 p-2.5 rounded border border-slate-700">
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-slate-200 leading-snug">
                            <strong className="text-amber-300">Trocador de Calor no Veículo:</strong>
                            Recomendado trocador de calor de óleo para garantir estabilidade térmica no trabalho contínuo.
                          </p>
                        </div>
                      </div>

                      {/* Single Photo slot for Giro 180 + Inclinação 90 */}
                      <div className="col-span-5 bg-slate-800 border border-slate-700 rounded p-2 flex flex-col items-center">
                        <EditableImage
                          src={armRequirementImageUrl}
                          onChange={(base64) => {
                            setArmRequirementImageUrl(base64);
                            toast.success('Imagem dos Requisitos do Braço Isolado atualizada!');
                          }}
                          zoom={armRequirementImageZoom}
                          onZoomChange={setArmRequirementImageZoom}
                          alt="Giro 180° e Inclinação 90° no Braço Isolado"
                          maxHeightClass="max-h-[150px]"
                          aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                          disabled={!canEdit}
                        />
                        <span className="text-[10px] text-amber-300 font-bold mt-1.5 text-center">
                          Giro 180° + Inclinação 90° no Braço Isolado
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 6 Quick Couplers Section */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                          Conexão Rápida: 06 Engates Rápidos e Troca pelo Cesto de Fibra
                        </h2>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Engates Face Plana
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-7 text-xs space-y-2">
                        <p className="text-slate-700 leading-relaxed font-medium">
                          O cabeçote GP 150 é acoplado no mesmo suporte original do cesto de fibra do caminhão. Para alternar entre o cesto e a cabeça de poda, basta <strong>desconectar as mangueiras através dos 06 engates rápidos</strong> e remover os parafusos de fixação do cesto.
                        </p>

                        <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] space-y-1">
                          <p className="font-bold text-slate-900 border-b pb-1">Conexão das 6 Linhas Hidráulicas:</p>
                          <p><strong className="text-blue-600">Linha 1:</strong> Serra Corte (3/8") | <strong className="text-blue-600">Linha 2:</strong> Retorno Serra (3/8")</p>
                          <p><strong className="text-emerald-600">Linha 3:</strong> Fecha Garra (1/4" ou 3/8") | <strong className="text-amber-600">Linha 4:</strong> Abre Garra / Dreno</p>
                          <p><strong className="text-purple-600">Linhas 5 e 6:</strong> Giro Horário e Anti-horário (Rotator 360°)</p>
                        </div>
                      </div>

                      {/* Photo slot for 6 Quick Couplers */}
                      <div className="col-span-5 bg-white p-2 border border-slate-200 rounded flex flex-col items-center">
                        <EditableImage
                          src={couplersImageUrl}
                          onChange={(base64) => {
                            setCouplersImageUrl(base64);
                            toast.success('Imagem dos 06 Engates Rápidos atualizada!');
                          }}
                          zoom={couplersImageZoom}
                          onZoomChange={setCouplersImageZoom}
                          alt="06 Engates Rápidos das Mangueiras Hidráulicas"
                          maxHeightClass="max-h-[140px]"
                          aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                          disabled={!canEdit}
                        />
                        <span className="text-[10px] text-slate-600 font-bold mt-1 text-center">
                          06 Conectores de Engate Rápido
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Page 1 */}
                <div className="pt-3 mt-4 border-t-2 border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <div>
                    <p><strong>RODER MÁQUINAS E EQUIPAMENTOS LTDA</strong> • Pardinho/SP</p>
                    <p>Página 1 de 3 • Especificações Técnicas e Requisitos do Braço</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700 font-extrabold uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      ✓ Documento Oficial Roder GP150
                    </span>
                  </div>
                </div>
              </div>


              {/* ==================== PÁGINA 2 DE 3: ESQUEMA HIDRÁULICO, DRENO E CAPACIDADE DE CARGA ==================== */}
              <div 
                ref={page2Ref}
                className="bg-white text-slate-900 p-8 shadow-2xl rounded-sm font-sans shrink-0 border border-slate-200 flex flex-col justify-between"
                style={{ width: '840px', minHeight: '1188px' }}
              >
                <div>
                  {/* Header Document Page 2 */}
                  <div className="flex items-center justify-between border-b-2 border-amber-500 pb-3 mb-5">
                    <div className="flex items-center gap-4">
                      <img 
                        src={RODER_LOGO_BASE64} 
                        alt="RODER Logo" 
                        className="h-11 object-contain"
                      />
                      <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                          ESQUEMA HIDRÁULICO & TABELA DE CAPACIDADE
                        </h2>
                        <p className="text-[11px] font-bold text-amber-600 tracking-wider uppercase">
                          Montagem do Dreno da Serra (Linha 4) • Gráfico de Carga em Operação
                        </p>
                      </div>
                    </div>
                    <div className="text-right border-l-2 border-slate-200 pl-4">
                      <span className="inline-block bg-slate-900 text-white font-extrabold text-[10px] px-2.5 py-1 rounded tracking-wider uppercase mb-1">
                        Nº FINAME: 04072997
                      </span>
                    </div>
                  </div>

                  {/* Hydraulic Diagram & Drain "T" Instruction */}
                  <div className="mb-6 border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                          Diagrama de Instalação do Dreno da Serra com "T" e Furo Restritor de 1mm
                        </h2>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">
                        Linha 4 (Abre Garra / Dreno)
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-5 items-center">
                      <div className="col-span-7 text-xs space-y-2.5">
                        <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r text-[11px] text-amber-950 leading-relaxed font-medium">
                          <strong>Regra Obrigatória do Dreno da Serra:</strong> Na linha "4" (Abre garra) deve ser montado um "T" metálico com furo restritor de 1mm na saída central. Conecte nesta saída uma mangueira de 1/4" que descarrega a pressão de dreno diretamente no retorno pós-comando hidráulico para o tanque. Isso impede sobrepressão na carcaça do motor da serra.
                        </div>

                        <div className="bg-white p-3 rounded border border-slate-200 text-[11px] space-y-1">
                          <p className="font-bold text-slate-900 border-b pb-1">Cuidados e Regulagens de Pressão na Instalação:</p>
                          <p>• <strong>Pressão da Serra (Corte de Madeira):</strong> Manter regulada estritamente entre <strong>200 e 230 Bar</strong> para o funcionamento da serra.</p>
                          <p>• <strong>Pressão do Giro (360° Infinito) e Garra (Abrir/Fechar):</strong> Manter regulada entre <strong>150 e 220 Bar</strong>.</p>
                          <p>• <strong>Vazão Recomendada:</strong> 25 a 40 L/min com mangueiras adequadas.</p>
                          <p>• Verifique o travamento total dos 06 engates rápidos de face plana.</p>
                        </div>
                      </div>

                      <div className="col-span-5 bg-white p-2 border border-slate-200 rounded flex flex-col items-center">
                        <EditableImage
                          src={hydraulicDiagramUrl}
                          onChange={(base64) => {
                            setHydraulicDiagramUrl(base64);
                            toast.success('Diagrama hidráulico atualizado!');
                          }}
                          zoom={hydraulicDiagramZoom}
                          onZoomChange={setHydraulicDiagramZoom}
                          alt="Diagrama Hidráulico GP150 com T e Furo de 1mm"
                          maxHeightClass="max-h-[170px]"
                          aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                          disabled={!canEdit}
                        />
                        <span className="text-[10px] text-slate-600 font-bold mt-1 text-center">
                          Esquema Conexão T com Furo Restritor 1mm
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Load Capacity Table vs Diameter & Length "A" */}
                  <div className="mb-6 bg-slate-100 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Maximize2 className="h-4 w-4 text-slate-800" />
                        <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                          Tabela de Capacidade de Carga vs. Diâmetro do Tronco e Comprimento ("A")
                        </h2>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">Referência do Manual</span>
                    </div>

                    <div className="grid grid-cols-12 gap-5 items-center">
                      <div className="col-span-7">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-800 text-white font-bold uppercase text-[10px]">
                              <th className="p-2 border border-slate-700">"Ø" Diâmetro do Tronco</th>
                              <th className="p-2 border border-slate-700 text-center">"A" Comprimento Máximo Recomendado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-900">
                            <tr>
                              <td className="p-2 border font-bold">15 cm</td>
                              <td className="p-2 border text-center font-bold text-amber-700">2,0 metros</td>
                            </tr>
                            <tr>
                              <td className="p-2 border font-bold">10 cm</td>
                              <td className="p-2 border text-center font-bold text-amber-700">2,5 metros</td>
                            </tr>
                            <tr>
                              <td className="p-2 border font-bold">8 cm</td>
                              <td className="p-2 border text-center font-bold text-amber-700">3,0 metros</td>
                            </tr>
                            <tr>
                              <td className="p-2 border font-bold">5 cm ou menos</td>
                              <td className="p-2 border text-center font-bold text-amber-700">4,0 metros ou mais</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="col-span-5 bg-white p-3 rounded border border-slate-200 text-center">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Carga Centralizada na Garra</span>
                        <span className="text-2xl font-black text-slate-900 block my-1">Até 50 Kg</span>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                          Parâmetro crucial para proteger a estrutura do braço de fibra isolado contra torção e risco de rompimento.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Image Container below the Capacity Table (Same width & height) */}
                  <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center">
                    <div className="w-full flex items-center justify-between mb-2 border-b border-slate-200 pb-1">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                        Demonstrativo de Operação Real: Carga e Medidas do Galho (Diâmetro x Comprimento)
                      </span>
                      <span className="text-[10px] text-amber-600 font-bold">Foto do Gráfico Real</span>
                    </div>

                    <EditableImage 
                      src={capacityGraphicImageUrl}
                      onChange={(base64) => {
                        setCapacityGraphicImageUrl(base64);
                        toast.success('Imagem da Operação com Medidas atualizada!');
                      }}
                      zoom={capacityGraphicImageZoom}
                      onZoomChange={setCapacityGraphicImageZoom}
                      alt="Operação de Poda com Medidas de Diâmetro e Comprimento"
                      maxHeightClass="max-h-[220px]"
                      aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                      disabled={!canEdit}
                    />
                    <span className="text-[10px] text-slate-500 font-medium mt-2 text-center">
                      Imagem ilustrativa marcando o diâmetro da madeira e o comprimento do galho respeitando a capacidade de 50 kg.
                    </span>
                  </div>
                </div>

                {/* Footer Page 2 */}
                <div className="pt-3 mt-4 border-t-2 border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <div>
                    <p><strong>RODER MÁQUINAS E EQUIPAMENTOS LTDA</strong> • Pardinho/SP</p>
                    <p>Página 2 de 3 • Diagrama Hidráulico e Tabela de Carga</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700 font-extrabold uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      ✓ Documento Oficial Roder GP150
                    </span>
                  </div>
                </div>
              </div>


              {/* ==================== PÁGINA 3 DE 3: PROCEDIMENTO OPERACIONAL, MANUTENÇÃO E PEÇAS DE REPOSIÇÃO ==================== */}
              <div 
                ref={page3Ref}
                className="bg-white text-slate-900 p-8 shadow-2xl rounded-sm font-sans shrink-0 border border-slate-200 flex flex-col justify-between"
                style={{ width: '840px', minHeight: '1188px' }}
              >
                <div>
                  {/* Header Document Page 3 */}
                  <div className="flex items-center justify-between border-b-2 border-amber-500 pb-2 mb-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={RODER_LOGO_BASE64} 
                        alt="RODER Logo" 
                        className="h-10 object-contain"
                      />
                      <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                          PROCEDIMENTO OPERACIONAL & PLANO DE MANUTENÇÃO
                        </h2>
                        <p className="text-[10px] font-bold text-amber-600 tracking-wider uppercase">
                          Cabeçote de Poda GP 150 • Guia de Operação, Afiação e Peças de Desgaste
                        </p>
                      </div>
                    </div>
                    <div className="text-right border-l-2 border-slate-200 pl-3">
                      <span className="inline-block bg-slate-900 text-white font-extrabold text-[9px] px-2 py-0.5 rounded tracking-wider uppercase">
                        Nº FINAME: 04072997
                      </span>
                    </div>
                  </div>

                  {/* Operational Procedure Steps (Based on Video Analysis & User Guidelines) */}
                  <div className="mb-4 bg-slate-900 text-white p-3.5 rounded-lg">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2.5">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-emerald-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Procedimento Operacional de Poda em Campo (Passo a Passo)
                        </h3>
                      </div>
                      <a 
                        href="https://roderbrasil.com.br/maquina-urbana/cabecote-florestal-poda-arvores/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] text-amber-300 font-bold underline flex items-center gap-1 hover:text-white"
                      >
                        <Video className="h-3 w-3" />
                        Assistir Vídeo Demonstrativo
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-[11px] leading-snug">
                      <div className="bg-slate-800/90 p-2 rounded border border-slate-700 space-y-1">
                        <span className="font-extrabold text-amber-400 block text-[11px]">1. Posicionamento e Encosto do Peito</span>
                        <p className="text-slate-200">
                          O operador posiciona o braço isolado no galho, encostando o peito da garra na madeira e posicionando o sabre <strong>SEMPRE voltado para o lado do tronco</strong>.
                        </p>
                      </div>

                      <div className="bg-slate-800/90 p-2 rounded border border-slate-700 space-y-1">
                        <span className="font-extrabold text-amber-400 block text-[11px]">2. Fixação e Alívio de Tensão</span>
                        <p className="text-slate-200">
                          Fecha a garra garantindo que não está tensionando. Aciona suavemente o giro/movimento do braço no sentido oposto ao tronco (leve força de puxada) para aliviar o corte.
                        </p>
                      </div>

                      <div className="bg-slate-800/90 p-2 rounded border border-slate-700 space-y-1">
                        <span className="font-extrabold text-amber-400 block text-[11px]">3. Corte sem Travar a Serra</span>
                        <p className="text-slate-200">
                          Aciona a serra. Como o galho foi levemente puxado, ao ser cortado ele se afasta da árvore, abrindo o corte naturalmente e <strong>impedindo que o sabre seja mordido ou travado</strong>.
                        </p>
                      </div>

                      <div className="bg-slate-800/90 p-2 rounded border border-slate-700 space-y-1">
                        <span className="font-extrabold text-amber-400 block text-[11px]">4. Liberação e Recorte do Toco</span>
                        <p className="text-slate-200">
                          Se a serra travar, para o corte, aciona o retorno e usa o giro do braço para soltar o galho até a área de segurança. Se necessário, faz o recorte final do toco rente ao tronco.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preventive Maintenance Plan Table */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2">
                      <RefreshCw className="h-4 w-4 text-slate-800" />
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        Plano de Manutenção Preventiva e Checklist Diário
                      </h3>
                    </div>

                    <table className="w-full text-xs text-left border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-slate-800 text-white font-bold uppercase text-[10px]">
                          <th className="p-1.5 border border-slate-700">Item de Verificação</th>
                          <th className="p-1.5 border border-slate-700 text-center">Diariamente</th>
                          <th className="p-1.5 border border-slate-700 text-center">A cada 2 Dias</th>
                          <th className="p-1.5 border border-slate-700 text-center">Troca / Período</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-[11px] font-medium bg-white">
                        <tr>
                          <td className="p-1 border font-semibold text-slate-900">Lubrificação dos Bicos de Graxa</td>
                          <td className="p-1 border text-center font-bold text-emerald-600">✓ Lubrificar</td>
                          <td className="p-1 border text-center text-slate-400">-</td>
                          <td className="p-1 border text-center text-slate-500">Conforme uso diário</td>
                        </tr>
                        <tr>
                          <td className="p-1 border font-semibold text-slate-900">Vazamentos em Conexões e Mangueiras</td>
                          <td className="p-1 border text-center font-bold text-emerald-600">✓ Reapertar</td>
                          <td className="p-1 border text-center text-slate-400">-</td>
                          <td className="p-1 border text-center text-slate-500">Substituir se danificado</td>
                        </tr>
                        <tr>
                          <td className="p-1 border font-semibold text-slate-900">Parafusos do Suporte do Cesto</td>
                          <td className="p-1 border text-center font-bold text-emerald-600">✓ Checar aperto</td>
                          <td className="p-1 border text-center text-slate-400">-</td>
                          <td className="p-1 border text-center text-slate-500">Manter torque original</td>
                        </tr>
                        <tr>
                          <td className="p-1 border font-semibold text-slate-900">Sabre de Corte (Empenamento e Borda)</td>
                          <td className="p-1 border text-center font-bold text-emerald-600">✓ Limpar canaleta</td>
                          <td className="p-1 border text-center text-slate-400">-</td>
                          <td className="p-1 border text-center font-bold text-amber-700">Até 60 dias ou avaria</td>
                        </tr>
                        <tr>
                          <td className="p-1 border font-semibold text-slate-900">Estado da Corrente e Afiação (.325)</td>
                          <td className="p-1 border text-center font-bold text-emerald-600">✓ Checar estado</td>
                          <td className="p-1 border text-center font-bold text-amber-600">✓ Afiar c/ Lima</td>
                          <td className="p-1 border text-center font-bold text-amber-700">30 a 60 dias (facas curtas)</td>
                        </tr>
                        <tr>
                          <td className="p-1 border font-semibold text-slate-900">Tensionamento da Corrente (Esticador)</td>
                          <td className="p-1 border text-center font-bold text-emerald-600">✓ Regular fenda</td>
                          <td className="p-1 border text-center text-slate-400">-</td>
                          <td className="p-1 border text-center text-slate-500">Ajustar antes de operar</td>
                        </tr>
                        <tr>
                          <td className="p-1 border font-semibold text-slate-900">Teste Pré-Operacional dos Movimentos</td>
                          <td className="p-1 border text-center font-bold text-emerald-600">✓ Testar tudo</td>
                          <td className="p-1 border text-center text-slate-400">-</td>
                          <td className="p-1 border text-center text-slate-500">Abre/Fecha, Giro, Serra</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-950 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>RECOMENDAÇÃO CRÍTICA DE CONTINUIDADE OPERACIONAL:</strong> Manter no veículo de operação <strong>1 corrente de reserva</strong> e <strong>1 sabre de reserva</strong> para troca imediata a qualquer momento sem interromper o trabalho de poda.
                      </span>
                    </div>
                  </div>

                  {/* Chain Sharpening Guide (.325) */}
                  <div className="mb-4 bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                    <div className="flex items-center gap-1.5 border-b border-slate-300 pb-1 mb-2">
                      <Scissors className="h-3.5 w-3.5 text-slate-700" />
                      <h4 className="text-[11px] font-extrabold text-slate-900 uppercase">
                        Procedimento de Afiação Manual da Corrente (.325)
                      </h4>
                    </div>

                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5 text-[9.5px] leading-tight space-y-1 pr-1">
                        <p>• <strong>Frequência:</strong> A cada 2 dias com lima .325.</p>
                        <p>• <strong>Passo 1:</strong> Posicione o cabeçote a 1,0m do solo.</p>
                        <p>• <strong>Passo 2:</strong> Desligue o veículo base, use luvas e afie a corrente montada.</p>
                        <p>• <strong>Troca:</strong> Substitua a corrente quando os dentes estiverem gastos.</p>
                      </div>

                      <div className="col-span-7 grid grid-cols-2 gap-2">
                        <div className="bg-white p-1.5 border border-slate-200 rounded flex flex-col items-center">
                          <EditableImage
                            src={sharpeningStep1Url}
                            onChange={(b) => setSharpeningStep1Url(b)}
                            zoom={sharpeningStep1Zoom}
                            onZoomChange={setSharpeningStep1Zoom}
                            alt="Posicionamento 1m do solo"
                            maxHeightClass="max-h-[115px]"
                            outerMinHeightClass="min-h-[120px]"
                            innerMinHeightClass="min-h-[110px]"
                            aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                            disabled={!canEdit}
                          />
                          <span className="font-bold text-slate-900 text-[9px] mt-1 text-center">P1: 1,0 Metro do Solo</span>
                        </div>

                        <div className="bg-white p-1.5 border border-slate-200 rounded flex flex-col items-center">
                          <EditableImage
                            src={sharpeningStep2Url}
                            onChange={(b) => setSharpeningStep2Url(b)}
                            zoom={sharpeningStep2Zoom}
                            onZoomChange={setSharpeningStep2Zoom}
                            alt="Afiação com lima e luvas"
                            maxHeightClass="max-h-[115px]"
                            outerMinHeightClass="min-h-[120px]"
                            innerMinHeightClass="min-h-[110px]"
                            aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                            disabled={!canEdit}
                          />
                          <span className="font-bold text-slate-900 text-[9px] mt-1 text-center">P2: Lima e Luvas (OFF)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Wear & Replacement Parts Catalog Table (Items 1, 2, 3 only) */}
                  <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-slate-800" />
                        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                          Material de Desgaste e Peças de Reposição Direta GP150 (Itens 1, 2 e 3)
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">Peças do Kit de Corte</span>
                    </div>

                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-7">
                        <table className="w-full text-xs text-left border-collapse bg-white border border-slate-200">
                          <thead>
                            <tr className="bg-slate-800 text-white font-bold uppercase text-[10px]">
                              <th className="p-1.5 border border-slate-700 text-center">Item</th>
                              <th className="p-1.5 border border-slate-700">Descrição do Componente</th>
                              <th className="p-1.5 border border-slate-700 text-center">Código Roder</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-[11px] font-medium">
                            <tr>
                              <td className="p-1.5 border text-center font-bold">1</td>
                              <td className="p-1.5 border">Coroa Pinhão de Corte</td>
                              <td className="p-1.5 border font-mono text-center font-bold text-blue-700">3000.4000.0064</td>
                            </tr>
                            <tr>
                              <td className="p-1.5 border text-center font-bold">2</td>
                              <td className="p-1.5 border">Sabre de Corte 33cm / 13"</td>
                              <td className="p-1.5 border font-mono text-center font-bold text-blue-700">3000.4000.0065</td>
                            </tr>
                            <tr>
                              <td className="p-1.5 border text-center font-bold">3</td>
                              <td className="p-1.5 border">Corrente de Corte 56 elos (Passo .325)</td>
                              <td className="p-1.5 border font-mono text-center font-bold text-blue-700">3000.4000.0093</td>
                            </tr>
                          </tbody>
                        </table>

                        <p className="text-[10px] text-slate-500 font-semibold italic mt-2">
                          * Observação: O Catálogo Geral e Completo de Peças do GP 150 é fornecido em um documento PDF separado.
                        </p>
                      </div>

                      {/* Photo slot for Wear Parts (Items 1, 2, 3) */}
                      <div className="col-span-5 bg-white p-2 border border-slate-200 rounded flex flex-col items-center">
                        <EditableImage
                          src={wearPartsImageUrl}
                          onChange={(base64) => {
                            setWearPartsImageUrl(base64);
                            toast.success('Imagem do Kit de Peças de Desgaste atualizada!');
                          }}
                          zoom={wearPartsImageZoom}
                          onZoomChange={setWearPartsImageZoom}
                          alt="Conjunto Sabre, Coroa e Corrente (Itens 1, 2 e 3)"
                          maxHeightClass="max-h-[120px]"
                          aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                          disabled={!canEdit}
                        />
                        <span className="text-[9px] text-slate-600 font-bold mt-1 text-center">
                          Imagem: Coroa (1), Sabre (2) e Corrente (3)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Page 3 */}
                <div className="pt-2 mt-3 border-t-2 border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <div>
                    <p><strong>RODER MÁQUINAS E EQUIPAMENTOS LTDA</strong> • Pardinho/SP</p>
                    <p>Página 3 de 3 • Procedimento Operacional, Manutenção e Peças de Desgaste</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700 font-extrabold uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      ✓ Documento Oficial Roder GP150
                    </span>
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
