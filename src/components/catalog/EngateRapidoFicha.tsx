import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  Settings, 
  AlertTriangle,
  Info,
  Download,
  Camera,
  Layers,
  Wrench,
  HelpCircle,
  FileText,
  MessageCircle,
  Share2,
  Printer
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getApiBaseUrl } from '../../lib/utils';
import { useVoltarFecha } from '../../lib/useVoltarFecha';

interface EngateRapidoFichaProps {
  onClose: () => void;
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

export function EngateRapidoFicha({ onClose }: EngateRapidoFichaProps) {
  // "Voltar" do celular fecha a ficha e volta para a tela de onde ela foi aberta
  useVoltarFecha(true, onClose);
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const [customMainImageUrl, setCustomMainImageUrl] = useState<string | null>(null);
  const [customMountedImageUrl, setCustomMountedImageUrl] = useState<string | null>(null);
  const [customDrawingUrl, setCustomDrawingUrl] = useState<string | null>(null);
  const [customBucketAdapterImageUrl, setCustomBucketAdapterImageUrl] = useState<string | null>(null);
  const [customRearPrepImageUrl, setCustomRearPrepImageUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchFichaImages = async () => {
      try {
        const fetchSettingDoc = async (docName: string) => {
          try {
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/api/settings/${docName}`);
            if (res.ok) {
              const resData = await res.json();
              if (resData.success && resData.exists && resData.data) {
                return resData.data;
              }
            }
          } catch (apiErr) {
            console.warn(`[FETCH-API] Falha ao obter ${docName} via API, tentando Firestore direto:`, apiErr);
          }
          try {
            const snap = await getDoc(doc(db, 'settings', docName));
            return snap.exists() ? snap.data() : null;
          } catch (dbErr) {
            console.error(`[FETCH-DB] Falha ao obter ${docName}:`, dbErr);
            return null;
          }
        };

        const [mainData, mountedData, drawingData, bucketData, rearData] = await Promise.all([
          fetchSettingDoc('engate_rapido_ficha_main'),
          fetchSettingDoc('engate_rapido_ficha_mounted'),
          fetchSettingDoc('engate_rapido_ficha_drawing'),
          fetchSettingDoc('engate_rapido_ficha_bucket_adapter'),
          fetchSettingDoc('engate_rapido_ficha_rear_prep'),
        ]);

        let mainImg = mainData ? (mainData.image_data || mainData.image_url) : null;
        let mountedImg = mountedData ? (mountedData.image_data || mountedData.image_url) : null;
        let drawingImg = drawingData ? (drawingData.image_data || drawingData.image_url) : null;
        let bucketImg = bucketData ? (bucketData.image_data || bucketData.image_url) : null;
        let rearImg = rearData ? (rearData.image_data || rearData.image_url) : null;

        // Check monolithic document fallback
        if (!mainImg || !mountedImg || !drawingImg || !bucketImg || !rearImg) {
          const oldMonolithicData = await fetchSettingDoc('engate_rapido_ficha_images');
          if (oldMonolithicData) {
            if (!mainImg) mainImg = oldMonolithicData.main_image_url || null;
            if (!mountedImg) mountedImg = oldMonolithicData.mounted_image_url || null;
            if (!drawingImg) drawingImg = oldMonolithicData.drawing_url || null;
            if (!bucketImg) bucketImg = oldMonolithicData.bucket_adapter_image_url || null;
            if (!rearImg) rearImg = oldMonolithicData.rear_prep_image_url || null;
          }
        }

        if (!drawingImg) {
          const oldDrawingData = await fetchSettingDoc('engate_rapido_drawing');
          if (oldDrawingData) {
            drawingImg = oldDrawingData.image_data || null;
          }
        }

        setCustomMainImageUrl(mainImg);
        setCustomMountedImageUrl(mountedImg);
        setCustomDrawingUrl(drawingImg);
        setCustomBucketAdapterImageUrl(bucketImg);
        setCustomRearPrepImageUrl(rearImg);
      } catch (err) {
        console.error('Erro ao buscar imagens da ficha do engate rápido:', err);
      }
    };
    fetchFichaImages();
  }, []);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const generatePdfBlob = async (): Promise<{ pdf: jsPDF; blob: Blob }> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pages = [page1Ref.current, page2Ref.current];
    
    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i];
      if (!pageElement) continue;

      const dataUrl = await toPng(pageElement, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '794px',
          height: '1123px',
        }
      });

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
    }

    const blob = pdf.output('blob');
    return { pdf, blob };
  };

  const exportPDF = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Gerando Ficha Técnica Oficial em PDF de alta qualidade...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const { pdf } = await generatePdfBlob();
      pdf.save('Ficha_Tecnica_Engate_Rapido_Roder.pdf');
      toast.success("Ficha Técnica em PDF baixada com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao exportar PDF. Tente imprimir diretamente pelo navegador.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const shareViaWhatsApp = () => {
    const publicPdfUrl = `${window.location.origin}/ficha/engate-rapido`;
    const message = `*RODER BRASIL - FICHA TÉCNICA OFICIAL*\n` +
      `*Equipamento:* Engate Rápido Hidráulico para Pás Carregadeiras\n\n` +
      `⚙️ *Principais Destaques:* \n` +
      `• Troca de implementos em menos de 30 segundos (sem sair da cabine).\n` +
      `• Fabricação sob medida para qualquer marca e modelo de pá carregadeira.\n` +
      `• Acionamento eletrônico 100% seguro via botão no painel.\n` +
      `• Instalação de 3ª Função Hidráulica inclusa no pacote Roder.\n` +
      `• Compatível com Caçamba, Garfo Pallet, Carregador Frontal, Garras AF/AFG e High Tip.\n\n` +
      `📄 *CLIQUE NO LINK ABAIXO PARA ABRIR A FICHA TÉCNICA EM PDF:*\n` +
      `👉 ${publicPdfUrl}\n\n` +
      `⏱️ *Validade da Proposta:* 60 dias.\n` +
      `Consulte nossa equipe técnica comercial para o código exato da sua máquina!`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success("Mensagem formatada com link do PDF aberta no WhatsApp!");
  };

  const sharePdf = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Preparando documento para compartilhamento...");

    try {
      const { blob } = await generatePdfBlob();
      const file = new File([blob], 'Ficha_Tecnica_Engate_Rapido_Roder.pdf', { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Ficha Técnica - Engate Rápido Roder',
          text: `Confira a Ficha Técnica Oficial do Engate Rápido Hidráulico Roder para Pás Carregadeiras: ${window.location.origin}/ficha/engate-rapido`,
          files: [file]
        });
        toast.success("Documento compartilhado com sucesso!", { id: toastId });
      } else {
        // Fallback: download the file and open WhatsApp
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Ficha_Tecnica_Engate_Rapido_Roder.pdf';
        a.click();
        URL.revokeObjectURL(url);

        shareViaWhatsApp();
        toast.info("PDF baixado no dispositivo! Você pode anexá-lo diretamente na conversa do WhatsApp.", { id: toastId });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Erro ao compartilhar:", error);
        toast.error("Não foi possível compartilhar automaticamente. O download em PDF foi iniciado.", { id: toastId });
        exportPDF();
      } else {
        toast.dismiss(toastId);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const triggerSystemPrint = () => {
    window.print();
  };

  return (
    <div style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)' }} className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center overflow-hidden antialiased">
      
      {/* Top Navbar / Header Controls */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-xl z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
            <Wrench className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-slate-100 text-sm md:text-base tracking-tight uppercase">
                Ficha Técnica Oficial
              </h2>
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Engate Rápido
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              RODER Brasil • Pá Carregadeira (2 Páginas A4)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={exportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-3.5 rounded-lg text-xs transition duration-200 shadow-md shadow-orange-950/50 disabled:opacity-50"
            title="Baixar Ficha Técnica Oficial em PDF"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Baixar PDF Oficial</span>
            <span className="sm:hidden">Baixar PDF</span>
          </button>

          <button 
            onClick={shareViaWhatsApp}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3.5 rounded-lg text-xs transition duration-200 shadow-md shadow-emerald-950/50"
            title="Compartilhar resumo e proposta no WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden md:inline">Enviar no WhatsApp</span>
            <span className="md:hidden">WhatsApp</span>
          </button>

          <button 
            onClick={sharePdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-2 px-3 rounded-lg text-xs transition duration-200 border border-slate-700 disabled:opacity-50"
            title="Compartilhar arquivo PDF"
          >
            <Share2 className="h-4 w-4 text-slate-300" />
            <span className="hidden md:inline">Compartilhar</span>
          </button>

          <button 
            onClick={triggerSystemPrint}
            className="hidden lg:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-2 px-3 rounded-lg text-xs transition duration-200 border border-slate-700"
            title="Imprimir Documento"
          >
            <Printer className="h-4 w-4 text-slate-300" />
            <span>Imprimir</span>
          </button>

          {/* Prominent High-Contrast Close Button */}
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-600 text-white font-bold py-2 px-3.5 rounded-lg text-xs transition duration-200 shadow-md border border-red-500 ml-1"
            title="Fechar Visualização (Esc)"
          >
            <X className="h-4 w-4" />
            <span className="font-extrabold">Fechar</span>
          </button>
        </div>
      </header>

      {/* Main Sheet Viewport (Clean, Centered, Edge-to-Edge) */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-auto p-4 md:p-8 flex flex-col items-center bg-slate-950">
        <div id="print-container" className="space-y-8 w-full max-w-[794px] print:space-y-0 print:p-0">
          
          {/* ================= PAGE 1 ================= */}
          <div 
            ref={page1Ref}
            className="bg-white text-slate-900 shadow-2xl border border-slate-200/80 leading-normal font-sans p-6 flex flex-col justify-between print:shadow-none print:border-0 print:p-0 mx-auto"
            style={{
              width: '794px',
              minWidth: '794px',
              height: '1123px',
              boxSizing: 'border-box',
              pageBreakAfter: 'always',
              breakAfter: 'page'
            }}
          >
            <div>
              {/* PDF Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-2.5 mb-4">
                <div>
                  <img 
                    src={RODER_LOGO_BASE64} 
                    alt="Logo Roder" 
                    className="h-8 object-contain mb-1" 
                  />
                  <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase">Tecnologia em Equipamentos Hidráulicos</span>
                </div>
                <div className="text-right">
                  <h1 className="text-lg font-black text-slate-950 tracking-tight leading-none uppercase">Ficha Técnica Oficial</h1>
                  <span className="text-[11px] font-mono text-orange-600 font-bold block mt-0.5">ENGATE RÁPIDO PARA PÁ CARREGADEIRA</span>
                  <span className="text-[8.5px] text-slate-500 block">Validade Comercial: 60 dias da data de envio</span>
                </div>
              </div>

              {/* Product Info Description */}
              <div className="space-y-2 mb-4">
                <h2 className="text-xl font-black text-slate-950 tracking-tight leading-none uppercase border-l-4 border-orange-500 pl-2">
                  Engate Rápido Roder
                </h2>
                <p className="text-[10px] text-slate-700 leading-relaxed text-justify">
                  O <strong>Engate Rápido Hidráulico Roder para Pás Carregadeiras</strong> é um equipamento fabricado sob encomenda e dimensionado sob medida para cada marca e modelo específico de máquina. Cada máquina possui dimensões exclusivas de pinos de acoplamento e largura interna de braço de elevação, tornando a personalização uma premissa fundamental para a garantia de perfeito funcionamento e segurança. Projetado para operações que necessitam realizar trocas dinâmicas e constantes de implementos (por exemplo, alternando rapidamente entre a caçamba original de terra e o garfo pallet de carregamento), o engate rápido reduz radicalmente os tempos de ciclo logísticos, elevando a produtividade operacional.
                </p>
              </div>

              {/* Main Visual Gallery (3 Perfect Square Cards) */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Main Photo Slot */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col aspect-square relative shadow-sm">
                  <div className="bg-slate-100 px-2.5 py-1.5 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <span className="text-[8px] uppercase tracking-wider text-slate-700 font-extrabold flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5 text-orange-500" /> Foto Principal
                    </span>
                    <span className="text-[7.5px] text-slate-400 font-mono">Vista Isolada</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-2.5 bg-white overflow-hidden relative">
                    <img 
                      src={formatFichaImageUrl(customMainImageUrl) || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800"} 
                      alt="Foto Principal do Engate Rápido" 
                      className="max-h-[160px] max-w-full object-contain rounded"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Mounted Photo Slot */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col aspect-square relative shadow-sm">
                  <div className="bg-slate-100 px-2.5 py-1.5 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <span className="text-[8px] uppercase tracking-wider text-slate-700 font-extrabold flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-orange-500" /> Em Operação
                    </span>
                    <span className="text-[7.5px] text-slate-400 font-mono">Montado na Pá</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-2.5 bg-white overflow-hidden relative">
                    <img 
                      src={formatFichaImageUrl(customMountedImageUrl) || "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=800"} 
                      alt="Engate Rápido Montado na Máquina" 
                      className="max-h-[160px] max-w-full object-contain rounded"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Technical CAD / Scheme 3D Slot */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col aspect-square relative shadow-sm">
                  <div className="bg-slate-100 px-2.5 py-1.5 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <span className="text-[8px] uppercase tracking-wider text-slate-700 font-extrabold flex items-center gap-1">
                      <Settings className="h-3.5 w-3.5 text-orange-500" /> Esquema 3D
                    </span>
                    <span className="text-[7.5px] text-slate-400 font-mono">Modelo CAD</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-2.5 bg-white overflow-hidden relative">
                    {customDrawingUrl ? (
                      <img 
                        src={formatFichaImageUrl(customDrawingUrl)} 
                        alt="Desenho Técnico Engate Rápido" 
                        className="max-h-[160px] max-w-full object-contain rounded" 
                      />
                    ) : (
                      <div className="flex flex-col items-center text-center p-3">
                        <svg className="w-16 h-16 text-slate-300 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18l-5-3-5 3-5-3Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="text-[9px] text-slate-400 italic">Esquema Roder 3D</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Technical & Compatibility Grid */}
              <div className="grid grid-cols-12 gap-4">
                {/* Left Column: Funcionamento & Instalação Hidráulica */}
                <div className="col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                  <div>
                    <h3 className="text-xs font-black text-slate-950 uppercase flex items-center gap-1.5 mb-2.5 border-b border-slate-200 pb-1.5">
                      <Settings className="h-4 w-4 text-orange-500" /> Funcionamento & Instalação
                    </h3>
                    <ul className="space-y-3 text-[9.5px] text-slate-700 font-medium">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Acionamento Direto da Cabine:</strong> O operador realiza o engate/desengate por acionamento eletrônico via botão, sem necessidade de sair da cabine e sem esforço físico.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Necessidade de 3ª Via:</strong> Requer uma <strong>via hidráulica extra (terceira função)</strong> dedicada ao acionamento do cilindro do engate rápido para travar/destravar implementos.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Serviço de Instalação Roder:</strong> A Roder realiza a instalação hidráulica completa de terceira função nas pás carregadeiras do cliente para garantir perfeito funcionamento.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right Column: Compatibilidade & Adaptação de Implementos */}
                <div className="col-span-6 border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col justify-between shadow-sm">
                  <div>
                    <h3 className="text-xs font-black text-slate-950 uppercase flex items-center gap-1.5 mb-1.5 border-b border-slate-200 pb-1.5">
                      <Layers className="h-4 w-4 text-orange-500" /> Compatibilidade de Implementos
                    </h3>
                    <p className="text-[9px] text-slate-700 leading-relaxed text-justify mb-2.5">
                      Ao instalar o Engate Rápido, todos os implementos utilizados na máquina devem ser preparados com o adaptador correspondente (fornecido e instalado tipo gancho pela Roder), garantindo o travamento seguro direto da cabine.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Bucket Adapter Section */}
                    <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between h-[155px]">
                      <div>
                        <span className="text-[8.5px] font-extrabold text-slate-900 block mb-1 leading-tight">
                          Adaptador Caçamba (Obrigatório)
                        </span>
                      </div>
                      <div className="flex-1 w-full border border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center p-1.5 relative overflow-hidden">
                        {customBucketAdapterImageUrl ? (
                          <img 
                            src={formatFichaImageUrl(customBucketAdapterImageUrl)} 
                            alt="Adaptador de Caçamba" 
                            className="max-h-[110px] max-w-full object-contain rounded"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-center p-1">
                            <span className="text-[8px] font-bold text-slate-500">Foto Adaptador</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rear Preparation Section */}
                    <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between h-[155px]">
                      <div>
                        <span className="text-[8.5px] font-extrabold text-slate-900 block mb-1 leading-tight">
                          Preparação Traseira
                        </span>
                      </div>
                      <div className="flex-1 w-full border border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center p-1.5 relative overflow-hidden">
                        {customRearPrepImageUrl ? (
                          <img 
                            src={formatFichaImageUrl(customRearPrepImageUrl)} 
                            alt="Preparação Traseira" 
                            className="max-h-[110px] max-w-full object-contain rounded"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-center p-1">
                            <span className="text-[8px] font-bold text-slate-500">Foto Traseira</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini Footer */}
            <div className="border-t border-slate-100 pt-1.5 flex justify-between text-[7.5px] text-slate-400 font-mono">
              <span>RODER BRASIL • ENGATE RÁPIDO</span>
              <span>Página 1 de 2</span>
            </div>
          </div>

          {/* ================= PAGE 2 ================= */}
          <div 
            ref={page2Ref}
            className="bg-white text-slate-900 shadow-2xl border border-slate-200/80 leading-normal font-sans p-6 flex flex-col justify-between print:shadow-none print:border-0 print:p-0 mx-auto"
            style={{
              width: '794px',
              minWidth: '794px',
              height: '1123px',
              boxSizing: 'border-box'
            }}
          >
            <div>
              {/* Header Page 2 */}
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5 mb-3.5">
                <img src={RODER_LOGO_BASE64} alt="Logo Roder" className="h-7 object-contain" />
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">Portfólio & Requisitos Hidráulicos • Ficha Técnica</span>
              </div>

              {/* Compatible Roder Implements */}
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-orange-500" /> Portfólio de Implementos Roder Compatíveis
              </h4>
              <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="text-[8.5px] font-black text-slate-900">Carregador Frontal</span>
                      <span className="text-[7px] bg-purple-100 text-purple-700 px-1 py-0.2 rounded font-bold uppercase">3ª + 4ª Função</span>
                    </div>
                    <p className="text-[8px] text-slate-600 leading-snug text-justify">
                      Equipamento dotado de garra com rotador pendulado. Necessita de 4 vias hidráulicas para acionamento simultâneo do abre/fecha e rotação do cabeçote.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="text-[8.5px] font-black text-slate-900">Garfo Pallet</span>
                      <span className="text-[7px] bg-slate-150 text-slate-600 px-1 py-0.2 rounded font-bold uppercase">Sem Cilindro</span>
                    </div>
                    <p className="text-[8px] text-slate-600 leading-snug text-justify">
                      Utilizado para cargas palletizadas. Não consome vias hidráulicas de acionamento em operação, necessitando apenas da 3ª função para travar/destravar o engate.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="text-[8.5px] font-black text-slate-900">Garra Frontal / Pinça</span>
                      <span className="text-[7px] bg-orange-100 text-orange-700 px-1 py-0.2 rounded font-bold uppercase">3ª Função Extra</span>
                    </div>
                    <p className="text-[8px] text-slate-600 leading-snug text-justify">
                      Utilizada na movimentação de toras de madeira e fardos. Exige a 3ª função para acionamento de abertura e fechamento da pinça (sistema clamp).
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="text-[8.5px] font-black text-slate-900">Caçamba High Tip</span>
                      <span className="text-[7px] bg-orange-100 text-orange-700 px-1 py-0.2 rounded font-bold uppercase">3ª Função Extra</span>
                    </div>
                    <p className="text-[8px] text-slate-600 leading-snug text-justify">
                      Caçamba basculante de alta descarga. Utiliza a 3ª função extra para acionar os cilindros de inclinação hidráulica que elevam a altura de descarregamento.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="text-[8.5px] font-black text-slate-900">Prolongador com Caçamba</span>
                      <span className="text-[7px] bg-orange-100 text-orange-700 px-1 py-0.2 rounded font-bold uppercase">3ª Função Extra</span>
                    </div>
                    <p className="text-[8px] text-slate-600 leading-snug text-justify">
                      Braço de extensão com concha e cilindro de atuação integrado para maior alcance. Exige a 3ª função extra para acionamento e controle do basculamento hidráulico da caçamba.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="text-[8.5px] font-black text-slate-900">Garfo Pallet com Clamp</span>
                      <span className="text-[7px] bg-orange-100 text-orange-700 px-1 py-0.2 rounded font-bold uppercase">3ª Função Extra</span>
                    </div>
                    <p className="text-[8px] text-slate-600 leading-snug text-justify">
                      Equipamento que une as funcionalidades de um garfo paleteiro robusto com uma garra superior (clamp) de fixação. Exige a 3ª função extra para controle do fechamento do clamp sobre a carga.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-2 flex gap-2 items-start">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[8.5px] font-extrabold text-amber-950 uppercase block">Opção de Encaixe Direto nos Pinos (Sem Engate Rápido)</span>
                  <p className="text-[8px] text-amber-900 leading-normal text-justify">
                    Caso o cliente não tenha a necessidade de ficar alternando equipamentos de forma frequente, os implementos Roder são fabricados originalmente com as orelhas traseiras para fixação direta nos pinos da máquina. Nessa modalidade tradicional, o uso do engate rápido não é possível.
                  </p>
                </div>
              </div>

              {/* Dimensionamento de Linhas Hidráulicas Section */}
              <div className="border border-slate-200 rounded-xl p-3 mb-2.5 bg-slate-50/50 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5 mb-1.5 border-b border-slate-200 pb-1">
                  <Settings className="h-4 w-4 text-orange-500" /> Requisitos de Instalação Hidráulica (3ª e 4ª Funções Extra)
                </h3>
                
                <p className="text-[10px] text-slate-700 leading-relaxed mb-2 text-justify">
                  A Roder fornece, junto ao orçamento do engate rápido, a <strong>instalação completa da linha hidráulica extra</strong> necessária na pá carregadeira. O número de funções adicionais (vias de mangueiras) é dimensionado de acordo com a gama de implementos que o cliente utilizará na máquina:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                  {/* 3ª Função Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase bg-orange-100 text-orange-700 border border-orange-200">
                          3ª Função Extra
                        </span>
                        <span className="text-[8.5px] text-slate-500 font-mono font-bold">1 Linha / 2 Vias (Mangueiras)</span>
                      </div>
                      <p className="text-[8.5px] text-slate-600 leading-relaxed mb-1 text-justify">
                        Instalação padrão fornecida junto no orçamento do engate rápido. Utilizada primariamente para o acionamento de <strong>abertura e fechamento dos pinos de travamento</strong> do engate rápido.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-[8px] text-slate-600 space-y-0.5 mt-1">
                      <div className="font-semibold text-slate-800">Compartilhamento de Linha:</div>
                      <ul className="list-disc pl-3 space-y-0.5 text-[8px]">
                        <li><strong>Garra Frontal:</strong> Com fechamento clamp simples.</li>
                        <li><strong>Garras de Estufagem Sem Giro:</strong> Modelos AF 360, AF 600 e AF 800.</li>
                      </ul>
                    </div>
                  </div>

                  {/* 3ª e 4ª Funções Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">
                          3ª e 4ª Funções Extras
                        </span>
                        <span className="text-[8.5px] text-slate-500 font-mono font-bold">2 Linhas / 4 Vias (Mangueiras)</span>
                      </div>
                      <p className="text-[8.5px] text-slate-600 leading-relaxed mb-1 text-justify">
                        Necessária quando o cliente adquire implementos que exigem <strong>sistema de rotação (giro)</strong> em adição ao movimento de abre/fecha.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-[8px] text-slate-600 space-y-0.5 mt-1">
                      <div className="font-semibold text-slate-800">Implementos que exigem 4 Vias:</div>
                      <ul className="list-disc pl-3 space-y-0.5 text-[8px]">
                        <li><strong>Carregador Frontal:</strong> Com rotador pendulado.</li>
                        <li><strong>Garras de Estufagem com Giro:</strong> Modelos AFG 360, AFG 600 e AFG 800.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex gap-2 items-start">
                  <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[8.5px] font-extrabold text-blue-950 uppercase block">Análise de Orçamento Comercial</span>
                    <p className="text-[8px] text-blue-900 leading-normal text-justify">
                      A Roder verifica quais são os equipamentos que o cliente irá utilizar na máquina para fornecer o orçamento adequado. Se houver o uso de equipamentos rotativos (Carregador Frontal ou Garras AFG), o orçamento deve contemplar a instalação de <strong>terceira e quarta funções extras</strong>. Para garras de estufagem sem giro, a <strong>terceira função padrão</strong> é suficiente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Commercial Checklist */}
              <div className="border border-orange-200 rounded-xl p-3 bg-orange-50/30 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5 mb-1.5">
                  <HelpCircle className="h-4 w-4 text-orange-600" /> Checklist de Qualificação para o Vendedor / Parceiro
                </h3>
                <p className="text-[9px] text-slate-700 leading-relaxed mb-1.5">
                  Como cada carregadeira possui especificações técnicas distintas, as indicações comerciais desse equipamento devem seguir as etapas abaixo:
                </p>
                <div className="space-y-1.5 text-[9px] text-slate-700">
                  <div className="flex items-start gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-slate-800 text-white text-[7.5px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                    <div className="leading-snug text-justify">
                      <strong>Identificação da Máquina:</strong> É obrigatório identificar a <strong>marca, modelo exato e ano de fabricação</strong> da pá carregadeira do cliente para que o comercial interno processe o código de equipamento correspondente.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-slate-800 text-white text-[7.5px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                    <div className="leading-snug text-justify">
                      <strong>Imagens do Engate Atual (Se Houver):</strong> Caso o cliente já possua um engate de outra marca e vá comprar um implemento Roder, o vendedor deve solicitar fotos nítidas do engate existente (com trena indicando a espessura de pinos e espaçamentos) para compatibilização.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-slate-800 text-white text-[7.5px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                    <div className="leading-snug text-justify">
                      <strong>Diferença de Padrões de Fabricantes:</strong> Cada fabricante adota medidas de pino e posições de acoplamento variadas. O comercial Roder passará estas especificidades ao departamento técnico para codificar perfeitamente as ganchiras necessárias para a adaptação correta.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Footer */}
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[7.5px] text-slate-500 font-mono">
              <div>
                <p className="font-bold">RODER MÁQUINAS E EQUIPAMENTOS LTDA</p>
                <p>Contato Comercial: Gislene / Triagem de Leads: Luana</p>
              </div>
              <div className="text-right">
                <p>Documento gerado dinamicamente via RODER Indica V2 • Página 2 de 2</p>
                <p>© {new Date().getFullYear()} Roder Brasil. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
