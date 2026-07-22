import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  ShieldCheck, 
  AlertTriangle,
  Download,
  ExternalLink,
  Wrench,
  Truck,
  Zap,
  Maximize2,
  Droplets,
  RotateCw,
  Scissors,
  Layers,
  HelpCircle,
  Check,
  FileText,
  Info,
  Package,
  Camera,
  Radio,
  Box
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { EditableImage } from './EditableImage';
import { useAuth } from '../../contexts/AuthContext';

interface CabecoteGmt035FichaProps {
  onClose: () => void;
}

export function CabecoteGmt035Ficha({ onClose }: CabecoteGmt035FichaProps) {
  const { isAdmin, isManager, isTriagem, isMarketing, isInternalSeller } = useAuth();
  const canEdit = isAdmin || isManager || isTriagem || isMarketing || isInternalSeller;
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState<number>(1);
  const [cardHeight, setCardHeight] = useState<number>(0);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'p1' | 'p2'>('all');

  // Image states with defaults and Ctrl+V paste support
  const [mainImageUrl, setMainImageUrl] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [mainImageZoom, setMainImageZoom] = useState<number>(1);

  const [ttcImageUrl, setTtcImageUrl] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [ttcImageZoom, setTtcImageZoom] = useState<number>(1);

  const [kitImageUrl, setKitImageUrl] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [kitImageZoom, setKitImageZoom] = useState<number>(1);

  const [operationalPhoto1Url, setOperationalPhoto1Url] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [operationalPhoto1Zoom, setOperationalPhoto1Zoom] = useState<number>(1);

  const [operationalPhoto2Url, setOperationalPhoto2Url] = useState<string>(
    'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-florestal-poda-arvores.jpg.webp'
  );
  const [operationalPhoto2Zoom, setOperationalPhoto2Zoom] = useState<number>(1);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current && printRef.current) {
        if (isPrinting) {
          setScale(1);
          setCardHeight(printRef.current.offsetHeight);
          return;
        }

        const parentWidth = wrapperRef.current.clientWidth || 840;
        const targetWidth = 840;
        
        const padding = window.innerWidth < 640 ? 16 : 32;
        const availableWidth = Math.max(parentWidth - padding, 300);

        const currentScale = availableWidth < targetWidth ? availableWidth / targetWidth : 1;
        setScale(currentScale);
        
        const measuredHeight = printRef.current.offsetHeight;
        if (measuredHeight > 0) {
          setCardHeight(measuredHeight * currentScale);
        }
      }
    };

    handleResize();

    const observer = new ResizeObserver(handleResize);
    if (printRef.current) observer.observe(printRef.current);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    window.addEventListener('resize', handleResize);

    const timers = [50, 150, 300, 600, 1200, 2500].map(delay => 
      setTimeout(handleResize, delay)
    );

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      timers.forEach(clearTimeout);
    };
  }, [isPrinting, activeTab]);

  const handleDownloadPdf = async () => {
    setActiveTab('all');
    setIsPrinting(true);
    toast.loading('Gerando PDF Completo GMT 035 em 2 Páginas A4...', { id: 'pdf-toast' });

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!page1Ref.current || !page2Ref.current) {
        toast.error('Não foi possível carregar as páginas do PDF.', { id: 'pdf-toast' });
        return;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Page 1
      const dataUrl1 = await toPng(page1Ref.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
      });
      pdf.addImage(dataUrl1, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Page 2
      pdf.addPage();
      const dataUrl2 = await toPng(page2Ref.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
      });
      pdf.addImage(dataUrl2, 'PNG', 0, 0, pdfWidth, pdfHeight);

      pdf.save('Ficha_Tecnica_Cabecote_GMT035_Roder.pdf');
      toast.success('PDF baixado com sucesso em 2 páginas A4!', { id: 'pdf-toast' });
    } catch (err) {
      console.error('Erro ao gerar PDF GMT 035:', err);
      toast.error('Não foi possível gerar o PDF.', { id: 'pdf-toast' });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShareWhatsapp = () => {
    const text = `*RODER MÁQUINAS - Cabeçote de Poda e Colheita GMT 035 TTC*\n` +
      `*Indicado:* Guindastes tipo Munck, Gruas Florestais, Caminhões com Garra e Miniescavadeiras a partir de 8t\n` +
      `*Capacidade de Corte:* Ø 40 cm (16") corte único | até Ø 60 cm (24") corte duplo\n` +
      `*Abertura Máxima:* 85 cm (33") | *Peso:* 245 kg / 275 kg (com TTC)\n` +
      `*Sistema Exclusivo TTC:* Trava hidráulica ativa do tilt e biela via controle sem fio (bloqueio de oscilação)\n` +
      `*Exigência Hidráulica:* 4 linhas na lança (2 garra/serra + 2 giro) com Válvula de Dreno Roder na linha de abrir\n` +
      `*Pressão:* 185 a 250 Bar | *Vazão:* 35 a 65 L/min\n` +
      `*Itens Inclusos:* Caixa de Transporte + Kit de Reposição (2 sabres, 4 correntes e chaves)\n\n` +
      `📌 *Atenção de Aplicação:* Não indicado para cesto aéreo de braço isolado (para braço isolado use o GP 150 Roder).\n` +
      `📄 *Ficha Técnica Oficial Roder em PDF disponível.*`;
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 overflow-y-auto backdrop-blur-sm">
      <div className="relative w-full max-w-[940px] h-[90vh] sm:h-[92vh] max-h-[960px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
            <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Cabeçote de Poda e Colheita GMT 035 TTC (40cm) • Ficha Técnica Oficial
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs mr-2">
              <button 
                onClick={() => setActiveTab('all')} 
                className={`px-2.5 py-1 rounded font-medium transition-colors ${activeTab === 'all' ? 'bg-amber-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
              >
                Todas (PDF)
              </button>
              <button 
                onClick={() => setActiveTab('p1')} 
                className={`px-2.5 py-1 rounded font-medium transition-colors ${activeTab === 'p1' ? 'bg-amber-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
              >
                Pág 1: Aplicação & Specs
              </button>
              <button 
                onClick={() => setActiveTab('p2')} 
                className={`px-2.5 py-1 rounded font-medium transition-colors ${activeTab === 'p2' ? 'bg-amber-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
              >
                Pág 2: Sistema TTC & Fotos
              </button>
            </div>

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
              title="Baixar PDF Completo (2 Páginas)"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-950/90 flex justify-center">
          <div ref={wrapperRef} className="w-full flex justify-center">
            <div 
              style={{ 
                height: isPrinting ? 'auto' : (cardHeight > 0 ? `${cardHeight}px` : 'auto'),
                minHeight: isPrinting ? 'auto' : `${(activeTab === 'all' ? 1188 * 2 + 48 : 1188) * scale}px`,
                width: scale < 1 ? '100%' : '840px'
              }} 
              className="relative transition-all duration-150 ease-out flex justify-center"
            >
              <div 
                ref={printRef}
                style={{ 
                  transform: isPrinting ? 'none' : `scale(${scale})`,
                  transformOrigin: 'top center',
                  width: '840px'
                }}
                className="space-y-8 bg-slate-900/50 p-2 rounded-xl"
              >

                {/* ==========================================
                    PÁGINA 1: FICHA TÉCNICA, APLICAÇÃO & ESPECIFICAÇÕES
                   ========================================== */}
                {(activeTab === 'all' || activeTab === 'p1') && (
                  <div 
                    ref={page1Ref}
                    className="w-[840px] h-[1188px] bg-white text-slate-900 p-8 flex flex-col justify-between shadow-2xl relative border border-slate-200 select-none overflow-hidden shrink-0 mx-auto"
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between border-b-2 border-amber-500 pb-3 mb-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={RODER_LOGO_BASE64} 
                            alt="RODER Logo" 
                            className="h-10 w-auto object-contain" 
                          />
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block leading-tight">
                              Equipamento Importado Comercializado pela Roder
                            </span>
                            <span className="text-base font-black text-slate-900 tracking-wide uppercase">
                              CABEÇOTE DE PODA E COLHEITA GMT 035 TTC
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-block px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-[11px] rounded uppercase tracking-wider">
                            Corte 40 cm (16")
                          </span>
                          <span className="block text-[9px] text-slate-500 font-bold mt-0.5">
                            Muncks, Gruas e Escavadeiras ≥ 8t
                          </span>
                        </div>
                      </div>

                      {/* Main Grid: Photo + Specs */}
                      <div className="grid grid-cols-12 gap-4 mb-3">
                        
                        {/* Column Left: Main Image + Paste Notice */}
                        <div className="col-span-5 flex flex-col gap-2">
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col items-center justify-center">
                            <EditableImage
                              src={mainImageUrl}
                              onChange={(b) => setMainImageUrl(b)}
                              zoom={mainImageZoom}
                              onZoomChange={setMainImageZoom}
                              alt="Cabeçote de Poda GMT 035"
                              maxHeightClass="max-h-[230px]"
                              outerMinHeightClass="min-h-[220px]"
                              innerMinHeightClass="min-h-[210px]"
                              aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                              disabled={!canEdit}
                            />
                            <div className="text-center mt-1.5">
                              <span className="font-bold text-slate-800 text-[11px] block">
                                GMT 035 TTC • Serra de Garra Florestal Compacta
                              </span>
                              <span className="text-[9px] text-slate-500 block">
                                Clique para alterar ou pressione <strong>Ctrl+V</strong> para colar foto
                              </span>
                            </div>
                          </div>

                          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-[10px] space-y-1">
                            <p className="font-bold text-amber-900 flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              Aviso Crítico de Aplicação:
                            </p>
                            <p className="text-amber-800 leading-tight">
                              Indicado para guindastes tipo Munck, gruas florestais e miniescavadeiras a partir de 8 toneladas. <strong>NÃO</strong> serve para braço isolado (linha viva) com cesto aéreo. Para braço isolado indicamos o <strong>GP 150 Roder</strong>.
                            </p>
                          </div>
                        </div>

                        {/* Column Right: Technical Specs Table */}
                        <div className="col-span-7 space-y-2">
                          <div className="bg-slate-900 text-white p-2 rounded-t-lg flex items-center justify-between">
                            <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                              <Maximize2 className="h-4 w-4 text-amber-400" />
                              Especificações Técnicas GMT 035
                            </span>
                            <span className="text-[10px] text-amber-300 font-bold">Standard & Pacote TTC</span>
                          </div>

                          <div className="border border-slate-200 rounded-b-lg overflow-hidden text-[10.5px]">
                            <table className="w-full text-left border-collapse">
                              <tbody>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                  <td className="py-1.5 px-3 font-semibold text-slate-600">Diâmetro de Corte Único:</td>
                                  <td className="py-1.5 px-3 font-bold text-slate-900">Ø 40 cm | 16"</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                  <td className="py-1.5 px-3 font-semibold text-slate-600">Diâmetro de Corte Duplo Máx.:</td>
                                  <td className="py-1.5 px-3 font-bold text-amber-700">Ø 60 cm | 24"</td>
                                </tr>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                  <td className="py-1.5 px-3 font-semibold text-slate-600">Abertura Máxima da Garra:</td>
                                  <td className="py-1.5 px-3 font-bold text-slate-900">85 cm | 33"</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                  <td className="py-1.5 px-3 font-semibold text-slate-600">Comprimento da Lâmina (Sabre):</td>
                                  <td className="py-1.5 px-3 font-bold text-slate-900">52 cm | 20"</td>
                                </tr>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                  <td className="py-1.5 px-3 font-semibold text-slate-600">Diâmetro Mínimo de Corte:</td>
                                  <td className="py-1.5 px-3 font-bold text-slate-900">Ø 5 cm | 2"</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                  <td className="py-1.5 px-3 font-semibold text-slate-600">Peso Versão Grapple (Padrão):</td>
                                  <td className="py-1.5 px-3 font-bold text-slate-900">245 kg | 540 lbs</td>
                                </tr>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                  <td className="py-1.5 px-3 font-semibold text-slate-600">Peso Versão Completa com TTC:</td>
                                  <td className="py-1.5 px-3 font-bold text-amber-700">275 kg | 605 lbs</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                  <td className="py-1.5 px-3 font-semibold text-slate-600">Carga Máxima de Trabalho:</td>
                                  <td className="py-1.5 px-3 font-bold text-slate-900">1.500 kg | 3.300 lbs</td>
                                </tr>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                  <td className="py-1.5 px-3 font-semibold text-slate-600">Vazão de Óleo Recomendada:</td>
                                  <td className="py-1.5 px-3 font-bold text-slate-900">35 a 65 L/min</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                  <td className="py-1.5 px-3 font-semibold text-slate-600">Pressão Mínima de Trabalho:</td>
                                  <td className="py-1.5 px-3 font-bold text-slate-900">185 bar | 2683 psi</td>
                                </tr>
                                <tr className="bg-slate-50">
                                  <td className="py-1.5 px-3 font-semibold text-slate-600">Pressão Operacional Máxima:</td>
                                  <td className="py-1.5 px-3 font-bold text-emerald-700">250 bar | 3626 psi</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Application Indications & Base Machine Compatibility */}
                      <div className="space-y-2 mb-3">
                        <div className="bg-slate-900 text-white p-2 rounded flex items-center justify-between">
                          <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Truck className="h-4 w-4 text-amber-400" />
                            Indicações de Aplicação & Compatibilidade de Máquinas Base
                          </span>
                          <span className="text-[10px] text-amber-300 font-bold">Padrão Garra Florestal</span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[10.5px] space-y-2">
                          <p className="text-slate-700 leading-relaxed">
                            O <strong>GMT 035 TTC</strong> é um cabeçote multifuncional de poda e abate projetado especificamente para ser acoplado em máquinas base que trabalham no padrão de suspensão por garra florestal ou garra de toras/sucata com rotator hidráulico.
                          </p>

                          <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                              <p className="font-bold text-slate-900 flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                Reboques & Caminhões Munck
                              </p>
                              <p className="text-slate-600 leading-snug">
                                Permite transformar o caminhão de manejo em uma unidade autônoma de poda, agarrando, cortando, abaixando e carregando troncos na própria caçamba.
                              </p>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                              <p className="font-bold text-slate-900 flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                Gruas Florestais & Carregadores
                              </p>
                              <p className="text-slate-600 leading-snug">
                                Instalação rápida em gruas florestais rodoviárias ou agrícolas que utilizem rotator e garra de madeira para corte e traçamento direto no pátio.
                              </p>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                              <p className="font-bold text-slate-900 flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                Miniescavadeiras a Partir de 8 Toneladas
                              </p>
                              <p className="text-slate-600 leading-snug">
                                Excelente simbiose em miniescavadeiras ou escavadeiras de pequeno porte (≥ 8t), combinando estabilidade, alcance do braço e agilidade no manejo vegetal.
                              </p>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                              <p className="font-bold text-slate-900 flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                Guindastes de Manejo & Sucata
                              </p>
                              <p className="text-slate-600 leading-snug">
                                Compatível com guindastes e reboques florestais que possuam linhas para garra e rotator, agregando corte por sabre hidráulico acoplado.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Operation Types, Work Volume & Productivity */}
                      <div className="space-y-2 mb-3">
                        <div className="bg-slate-900 text-white p-2 rounded flex items-center justify-between">
                          <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Scissors className="h-4 w-4 text-amber-400" />
                            Tipo de Trabalho, Operação & Produtividade no Campo
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 text-[10px]">
                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                            <p className="font-bold text-slate-900 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              Arborização e Poda Urbana de Risco
                            </p>
                            <p className="text-slate-600 leading-snug">
                              Corte e remoção controlada de galhos próximos a fiações elétricas energizadas, telhados, edifícios e calçadas sem risco de queda descontrolada.
                            </p>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                            <p className="font-bold text-slate-900 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              Limpeza de Rodovias e Ferrovias
                            </p>
                            <p className="text-slate-600 leading-snug">
                              Manutenção de faixas de domínio, eliminação de árvores caídas ou com risco de queda sobre pistas, operando diretamente do acostamento.
                            </p>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                            <p className="font-bold text-slate-900 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              Segurança Absoluta do Operador
                            </p>
                            <p className="text-slate-600 leading-snug">
                              Substitui escaladores e operadores de motosserra manual em situações perigosas. O operador comanda tudo de forma segura do solo ou da cabine.
                            </p>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                            <p className="font-bold text-slate-900 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              Rendimento Operacional Multiplicado
                            </p>
                            <p className="text-slate-600 leading-snug">
                              Reduz a equipe de campo necessária e elimina o tempo ocioso: corte, traçamento e carregamento são executados de forma sequencial contínua.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Required Hydraulic Lines Summary */}
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Droplets className="h-5 w-5 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-bold text-xs uppercase tracking-wider block leading-tight">
                              Requisito de Linhas Hidráulicas na Lança
                            </span>
                            <span className="text-[9.5px] text-slate-300">
                              Exige 4 mangueiras na ponta (2 Garra/Serra + 2 Giro). Inclui Válvula de Dreno Roder instalada na linha de abrir garra.
                            </span>
                          </div>
                        </div>
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded shrink-0">
                          Kit Dreno Incluso
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
                      <div>
                        <span className="font-bold text-slate-700">RODER MÁQUINAS E EQUIPAMENTOS LTDA.</span> • Rod. João Emilio Roder, Km 1 - Pardinho/SP
                      </div>
                      <div className="flex items-center gap-3">
                        <span>Tel: (14) 3161-5110</span>
                        <span>www.roderbrasil.com.br</span>
                        <span className="font-bold text-slate-700">Página 1 de 2</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==========================================
                    PÁGINA 2: DETALHAMENTO TTC, 4 LINHAS, REGISTROS DE COMPONENTES & FOTOS OPERACIONAIS
                   ========================================== */}
                {(activeTab === 'all' || activeTab === 'p2') && (
                  <div 
                    ref={page2Ref}
                    className="w-[840px] h-[1188px] bg-white text-slate-900 p-8 flex flex-col justify-between shadow-2xl relative border border-slate-200 select-none overflow-hidden shrink-0 mx-auto"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between border-b-2 border-amber-500 pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={RODER_LOGO_BASE64} 
                            alt="RODER Logo" 
                            className="h-10 w-auto object-contain" 
                          />
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block leading-tight">
                              Sistema Exclusivo TTC, Adequação de Frota e Galeria
                            </span>
                            <span className="text-base font-black text-slate-900 tracking-wide uppercase">
                              GMT 035 TTC • SISTEMA EXCLUSIVO & COMPONENTES
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-block px-2.5 py-1 bg-amber-500 text-slate-950 font-bold text-[11px] rounded uppercase tracking-wider">
                            Tecnologia Exclusiva TTC
                          </span>
                        </div>
                      </div>

                      {/* Detailed Exclusive TTC System Section */}
                      <div className="bg-amber-50/90 border border-amber-300 p-3 rounded-lg mb-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                          <div className="flex items-center gap-2">
                            <Radio className="h-5 w-5 text-amber-700 shrink-0" />
                            <span className="font-black text-xs text-amber-950 uppercase tracking-wider">
                              Sistema Exclusivo TTC (Total Tree Control) - Como Funciona & Vantagens
                            </span>
                          </div>
                          <span className="text-[9.5px] font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                            Tecnologia Patenteada sem Similar no Mercado
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-800 leading-relaxed space-y-1.5">
                          <p>
                            O <strong>Sistema TTC (Total Tree Control)</strong> é um desenvolvimento tecnológico exclusivo e patenteado mundialmente da série GMT. Enquanto as garras serra convencionais atuam em modo pêndulo livre (onde o galho cortado tomba e balança por gravidade), o pacote TTC introduz o <strong>bloqueio hidráulico ativo duplo</strong>.
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-[9.5px] pt-1">
                            <div className="bg-white p-2 rounded border border-amber-200 space-y-0.5">
                              <p className="font-bold text-amber-950 flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                Travamento por Controle Remoto Sem Fio:
                              </p>
                              <p className="text-slate-600 leading-snug">
                                Via transmissor sem fio compacto, o operador ativa o bloco de válvulas TTC que trava simultaneamente o <strong>cilindro de tilt</strong> e o <strong>elo cardan (biela de suspensão)</strong>.
                              </p>
                            </div>

                            <div className="bg-white p-2 rounded border border-amber-200 space-y-0.5">
                              <p className="font-bold text-amber-950 flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                Poda de Precisão em Locais Críticos:
                              </p>
                              <p className="text-slate-600 leading-snug">
                                Permite segurar o galho na posição vertical, realizar o corte com a serra de 40 cm e remover a seção ereta sem qualquer balanço ou contato com fiações elétricas e telhados.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Top Row: Linhas Hidráulicas + Ajuste Lanças */}
                      <div className="grid grid-cols-12 gap-3 mb-3">
                        {/* 4 Linhas Hidráulicas + Válvula Dreno */}
                        <div className="col-span-6 bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1.5 text-[10px]">
                          <div className="flex items-center gap-1.5 border-b pb-1">
                            <Droplets className="h-4 w-4 text-amber-600" />
                            <span className="font-black text-xs text-slate-900 uppercase">
                              4 Linhas Hidráulicas + Dreno Integrado
                            </span>
                          </div>
                          <p className="text-slate-700 leading-tight">
                            A instalação no caminhão Munck requer <strong>4 mangueiras na ponta da lança</strong>:
                          </p>
                          <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                            <li><strong>2 Linhas de Pressão/Retorno:</strong> Para fechar/abrir a garra e acionar a serra.</li>
                            <li><strong>2 Linhas Bidirecionais:</strong> Para o giro infinito 360° do rotator hidráulico.</li>
                          </ul>
                          <div className="bg-amber-50 border border-amber-200 p-2 rounded text-[9.5px] text-amber-900 leading-snug">
                            <strong>Instalação de Dreno sem 5ª Linha:</strong> A Roder instala uma válvula especial de alívio diretamente na linha de abrir garra. Isso dispensa a necessidade de puxar uma onerosa 5ª linha de dreno até a ponta da lança.
                          </div>
                        </div>

                        {/* Remoção das Lanças Manuais */}
                        <div className="col-span-6 bg-slate-900 text-white p-3 rounded-lg space-y-1.5 text-[10px]">
                          <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1">
                            <Wrench className="h-4 w-4 text-amber-400" />
                            <span className="font-black text-xs text-amber-400 uppercase tracking-wider">
                              Ajuste de Lanças Manuais do Guindaste
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            <strong>Equilíbrio Estrutural de Carga:</strong> Em caminhões Munck, recomenda-se <strong>remover as duas últimas extensões manuais</strong> e conectar o GMT 035 diretamente na ponta da última extensão hidráulica.
                          </p>
                          <p className="text-slate-400 text-[9.5px] leading-snug">
                            Isso reduz a alavanca de esforço sobre as lanças telescópicas, garantindo estabilidade e operabilidade segura durante o abate de galhos espessos.
                          </p>
                        </div>
                      </div>

                      {/* Dedicated Component Photos Grid: Attachment System (Grapple/Link/TTC) & Transport Box */}
                      <div className="space-y-1.5 mb-3">
                        <div className="bg-slate-900 text-white p-2 rounded flex items-center justify-between">
                          <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Box className="h-4 w-4 text-amber-400" />
                            Fotos dos Componentes Inclusos (Sistema de Engate TTC & Caixa de Transporte)
                          </span>
                          <span className="text-[9px] text-slate-400">Pressione Ctrl+V em cada caixa para colar a foto</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Box 1: Cabeçote Completo com Sistema de Engate na Garra (Biela TTC) */}
                          <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex flex-col items-center">
                            <EditableImage
                              src={ttcImageUrl}
                              onChange={(b) => setTtcImageUrl(b)}
                              zoom={ttcImageZoom}
                              onZoomChange={setTtcImageZoom}
                              alt="Cabeçote completo com sistema de engate na garra e biela TTC"
                              maxHeightClass="max-h-[175px]"
                              outerMinHeightClass="min-h-[165px]"
                              innerMinHeightClass="min-h-[155px]"
                              aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                              disabled={!canEdit}
                            />
                            <div className="text-center mt-1">
                              <span className="font-bold text-slate-800 text-[10px] block leading-tight">
                                Cabeçote Completo com Sistema de Engate & Biela TTC
                              </span>
                              <span className="text-[8.5px] text-slate-500 block">
                                Detalhe da suspensão por elo cardan e cilindro de travamento do pacote TTC
                              </span>
                            </div>
                          </div>

                          {/* Box 2: Caixa de Transporte Inclusa & Kit de Reposição */}
                          <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex flex-col items-center">
                            <EditableImage
                              src={kitImageUrl}
                              onChange={(b) => setKitImageUrl(b)}
                              zoom={kitImageZoom}
                              onZoomChange={setKitImageZoom}
                              alt="Caixa de transporte e kit de reposição inclusos"
                              maxHeightClass="max-h-[175px]"
                              outerMinHeightClass="min-h-[165px]"
                              innerMinHeightClass="min-h-[155px]"
                              aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                              disabled={!canEdit}
                            />
                            <div className="text-center mt-1">
                              <span className="font-bold text-slate-800 text-[10px] block leading-tight">
                                Caixa de Transporte Inclusa + Kit de Reposição
                              </span>
                              <span className="text-[8.5px] text-slate-500 block">
                                Acompanha caixa de proteção, 2 sabres reserva, 4 correntes de corte e chaves
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Operational Field Photos Section */}
                      <div className="space-y-1.5 mb-2">
                        <div className="bg-slate-900 text-white p-2 rounded flex items-center justify-between">
                          <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Camera className="h-4 w-4 text-amber-400" />
                            Fotos Operacionais do GMT 035 em Campo (Corte, Poda e Manejo Urbano)
                          </span>
                          <span className="text-[9px] text-slate-400">Clique para selecionar imagem local</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Photo 1 */}
                          <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex flex-col items-center">
                            <EditableImage
                              src={operationalPhoto1Url}
                              onChange={(b) => setOperationalPhoto1Url(b)}
                              zoom={operationalPhoto1Zoom}
                              onZoomChange={setOperationalPhoto1Zoom}
                              alt="GMT 035 em operação no guindaste"
                              maxHeightClass="max-h-[165px]"
                              outerMinHeightClass="min-h-[155px]"
                              innerMinHeightClass="min-h-[145px]"
                              aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                              disabled={!canEdit}
                            />
                            <span className="text-[9px] font-bold text-slate-700 mt-1">
                              Operação em Guindaste Munck • Poda Urbana & Vias
                            </span>
                          </div>

                          {/* Photo 2 */}
                          <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex flex-col items-center">
                            <EditableImage
                              src={operationalPhoto2Url}
                              onChange={(b) => setOperationalPhoto2Url(b)}
                              zoom={operationalPhoto2Zoom}
                              onZoomChange={setOperationalPhoto2Zoom}
                              alt="GMT 035 corte controlado de galhos"
                              maxHeightClass="max-h-[165px]"
                              outerMinHeightClass="min-h-[155px]"
                              innerMinHeightClass="min-h-[145px]"
                              aspectRatioClass="w-full h-full border-0 bg-transparent p-0"
                              disabled={!canEdit}
                            />
                            <span className="text-[9px] font-bold text-slate-700 mt-1">
                              Corte Controlado TTC e Remoção Segura de Troncos
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
                      <div>
                        <span className="font-bold text-slate-700">RODER MÁQUINAS E EQUIPAMENTOS LTDA.</span> • Rod. João Emilio Roder, Km 1 - Pardinho/SP
                      </div>
                      <div className="flex items-center gap-3">
                        <span>Tel: (14) 3161-5110</span>
                        <span>www.roderbrasil.com.br</span>
                        <span className="font-bold text-slate-700">Página 2 de 2</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
