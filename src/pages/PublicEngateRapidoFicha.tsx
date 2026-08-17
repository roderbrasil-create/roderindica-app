import React, { useEffect, useState, useRef } from 'react';
import { 
  Download, 
  Share2, 
  MessageCircle, 
  Printer, 
  Wrench, 
  Camera, 
  Layers, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  HelpCircle,
  PhoneCall,
  ExternalLink
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from '../components/catalog/RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getApiBaseUrl } from '../lib/utils';

const formatFichaImageUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  const baseUrl = getApiBaseUrl();
  if (url.includes('/api/proxy-image')) {
    return url;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `${baseUrl}/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  const fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  return `${baseUrl}/api/proxy-image?url=${encodeURIComponent(fullUrl)}`;
};

export default function PublicEngateRapidoFicha() {
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const [customMainImageUrl, setCustomMainImageUrl] = useState<string | null>(null);
  const [customMountedImageUrl, setCustomMountedImageUrl] = useState<string | null>(null);
  const [customDrawingUrl, setCustomDrawingUrl] = useState<string | null>(null);
  const [customBucketAdapterImageUrl, setCustomBucketAdapterImageUrl] = useState<string | null>(null);
  const [customRearPrepImageUrl, setCustomRearPrepImageUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    document.title = 'Ficha Técnica Oficial • Engate Rápido Roder';

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
          } catch (_) {}
          try {
            const snap = await getDoc(doc(db, 'settings', docName));
            return snap.exists() ? snap.data() : null;
          } catch (_) {
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

        setCustomMainImageUrl(mainImg);
        setCustomMountedImageUrl(mountedImg);
        setCustomDrawingUrl(drawingImg);
        setCustomBucketAdapterImageUrl(bucketImg);
        setCustomRearPrepImageUrl(rearImg);
      } catch (err) {
        console.error('Erro ao buscar imagens:', err);
      }
    };
    fetchFichaImages();
  }, []);

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
      await new Promise((resolve) => setTimeout(resolve, 300));
      const { pdf } = await generatePdfBlob();
      pdf.save('Ficha_Tecnica_Engate_Rapido_Roder.pdf');
      toast.success("Ficha Técnica baixada com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao exportar PDF. Tente imprimir diretamente.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const shareViaWhatsApp = () => {
    const publicUrl = window.location.href;
    const message = `*RODER BRASIL - FICHA TÉCNICA OFICIAL*\n` +
      `*Equipamento:* Engate Rápido Hidráulico para Pás Carregadeiras\n\n` +
      `⚙️ *Principais Destaques:* \n` +
      `• Troca de implementos em menos de 30 segundos (sem sair da cabine).\n` +
      `• Fabricação sob medida para qualquer marca e modelo de pá carregadeira.\n` +
      `• Acionamento eletrônico 100% seguro via botão no painel.\n` +
      `• Instalação de 3ª Função Hidráulica inclusa no pacote Roder.\n` +
      `• Compatível com Caçamba, Garfo Pallet, Carregador Frontal, Garras AF/AFG e High Tip.\n\n` +
      `📄 *CLIQUE PARA ABRIR E BAIXAR A FICHA TÉCNICA EM PDF:*\n` +
      `👉 ${publicUrl}\n\n` +
      `⏱️ *Validade da Proposta:* 60 dias.\n` +
      `Consulte nossa equipe técnica comercial para o código exato da sua máquina!`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const contactConsultant = () => {
    const message = `Olá! Estou visualizando a Ficha Técnica Oficial do Engate Rápido Roder e gostaria de solicitar um orçamento para a minha pá carregadeira.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* Public Top Navbar */}
      <header className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
            <Wrench className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-slate-100 text-sm md:text-base tracking-tight uppercase">
                RODER Brasil
              </h1>
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Ficha Técnica Oficial
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Engate Rápido Hidráulico para Pás Carregadeiras
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={exportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold py-2 px-4 rounded-lg text-xs transition duration-200 shadow-lg shadow-orange-950/50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Baixar PDF Oficial</span>
          </button>

          <button 
            onClick={shareViaWhatsApp}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3.5 rounded-lg text-xs transition duration-200 shadow-md shadow-emerald-950/50"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Enviar no WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </button>

          <button 
            onClick={contactConsultant}
            className="hidden md:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-2 px-3 rounded-lg text-xs transition duration-200 border border-slate-700"
          >
            <PhoneCall className="h-4 w-4 text-orange-400" />
            <span>Falar com Consultor</span>
          </button>
        </div>
      </header>

      {/* Sheet Render Area */}
      <main className="w-full flex-1 p-4 md:p-8 flex flex-col items-center overflow-x-auto">
        <div className="space-y-8 w-full max-w-[794px]">
          
          {/* ================= PAGE 1 ================= */}
          <div 
            ref={page1Ref}
            className="bg-white text-slate-900 shadow-2xl border border-slate-200/80 leading-normal font-sans p-6 flex flex-col justify-between mx-auto"
            style={{
              width: '794px',
              minWidth: '794px',
              height: '1123px',
              boxSizing: 'border-box'
            }}
          >
            <div>
              {/* Header */}
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
                  <h2 className="text-lg font-black text-slate-950 tracking-tight leading-none uppercase">Ficha Técnica Oficial</h2>
                  <span className="text-[11px] font-mono text-orange-600 font-bold block mt-0.5">ENGATE RÁPIDO PARA PÁ CARREGADEIRA</span>
                  <span className="text-[8.5px] text-slate-500 block">Validade Comercial: 60 dias da data de envio</span>
                </div>
              </div>

              {/* Product Info Description */}
              <div className="space-y-2 mb-4">
                <h3 className="text-xl font-black text-slate-950 tracking-tight leading-none uppercase border-l-4 border-orange-500 pl-2">
                  Engate Rápido Roder
                </h3>
                <p className="text-[10px] text-slate-700 leading-relaxed text-justify">
                  O <strong>Engate Rápido Hidráulico Roder para Pás Carregadeiras</strong> é um equipamento fabricado sob encomenda e dimensionado sob medida para cada marca e modelo específico de máquina. Cada máquina possui dimensões exclusivas de pinos de acoplamento e largura interna de braço de elevação, tornando a personalização uma premissa fundamental para a garantia de perfeito funcionamento e segurança. Projetado para operações que necessitam realizar trocas dinâmicas e constantes de implementos (por exemplo, alternando rapidamente entre a caçamba original de terra e o garfo pallet de carregamento), o engate rápido reduz radicalmente os tempos de ciclo logísticos, elevando a produtividade operacional.
                </p>
              </div>

              {/* Main Visual Gallery */}
              <div className="grid grid-cols-3 gap-4 mb-4">
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
                        <span className="text-[9px] text-slate-400 italic">Esquema Roder 3D</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Technical Grid */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                  <div>
                    <h4 className="text-xs font-black text-slate-950 uppercase flex items-center gap-1.5 mb-2.5 border-b border-slate-200 pb-1.5">
                      <Settings className="h-4 w-4 text-orange-500" /> Funcionamento & Instalação
                    </h4>
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

                <div className="col-span-6 border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col justify-between shadow-sm">
                  <div>
                    <h4 className="text-xs font-black text-slate-950 uppercase flex items-center gap-1.5 mb-1.5 border-b border-slate-200 pb-1.5">
                      <Layers className="h-4 w-4 text-orange-500" /> Compatibilidade de Implementos
                    </h4>
                    <p className="text-[9px] text-slate-700 leading-relaxed text-justify mb-2.5">
                      Ao instalar o Engate Rápido, todos os implementos utilizados na máquina devem ser preparados com o adaptador correspondente (fornecido e instalado tipo gancho pela Roder), garantindo o travamento seguro direto da cabine.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between h-[155px]">
                      <span className="text-[8.5px] font-extrabold text-slate-900 block mb-1 leading-tight">
                        Adaptador Caçamba (Obrigatório)
                      </span>
                      <div className="flex-1 w-full border border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center p-1.5 relative overflow-hidden">
                        {customBucketAdapterImageUrl ? (
                          <img 
                            src={formatFichaImageUrl(customBucketAdapterImageUrl)} 
                            alt="Adaptador de Caçamba" 
                            className="max-h-[110px] max-w-full object-contain rounded"
                          />
                        ) : (
                          <span className="text-[8px] font-bold text-slate-500">Foto Adaptador</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between h-[155px]">
                      <span className="text-[8.5px] font-extrabold text-slate-900 block mb-1 leading-tight">
                        Preparação Traseira
                      </span>
                      <div className="flex-1 w-full border border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center p-1.5 relative overflow-hidden">
                        {customRearPrepImageUrl ? (
                          <img 
                            src={formatFichaImageUrl(customRearPrepImageUrl)} 
                            alt="Preparação Traseira" 
                            className="max-h-[110px] max-w-full object-contain rounded"
                          />
                        ) : (
                          <span className="text-[8px] font-bold text-slate-500">Foto Traseira</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-1.5 flex justify-between text-[7.5px] text-slate-400 font-mono">
              <span>RODER BRASIL • ENGATE RÁPIDO</span>
              <span>Página 1 de 2</span>
            </div>
          </div>

          {/* ================= PAGE 2 ================= */}
          <div 
            ref={page2Ref}
            className="bg-white text-slate-900 shadow-2xl border border-slate-200/80 leading-normal font-sans p-6 flex flex-col justify-between mx-auto"
            style={{
              width: '794px',
              minWidth: '794px',
              height: '1123px',
              boxSizing: 'border-box'
            }}
          >
            <div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5 mb-3.5">
                <img src={RODER_LOGO_BASE64} alt="Logo Roder" className="h-7 object-contain" />
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">Portfólio & Requisitos Hidráulicos • Ficha Técnica</span>
              </div>

              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-orange-500" /> Portfólio de Implementos Roder Compatíveis
              </h4>
              <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="text-[8.5px] font-black text-slate-900">Carregador Frontal</span>
                    <span className="text-[7px] bg-purple-100 text-purple-700 px-1 py-0.2 rounded font-bold uppercase">3ª + 4ª Função</span>
                  </div>
                  <p className="text-[8px] text-slate-600 leading-snug text-justify">
                    Equipamento dotado de garra com rotador pendulado. Necessita de 4 vias hidráulicas para acionamento simultâneo do abre/fecha e rotação do cabeçote.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="text-[8.5px] font-black text-slate-900">Garfo Pallet</span>
                    <span className="text-[7px] bg-slate-150 text-slate-600 px-1 py-0.2 rounded font-bold uppercase">Sem Cilindro</span>
                  </div>
                  <p className="text-[8px] text-slate-600 leading-snug text-justify">
                    Utilizado para cargas palletizadas. Não consome vias hidráulicas de acionamento em operação, necessitando apenas da 3ª função para travar/destravar o engate.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="text-[8.5px] font-black text-slate-900">Garra Frontal / Pinça</span>
                    <span className="text-[7px] bg-orange-100 text-orange-700 px-1 py-0.2 rounded font-bold uppercase">3ª Função Extra</span>
                  </div>
                  <p className="text-[8px] text-slate-600 leading-snug text-justify">
                    Utilizada na movimentação de toras de madeira e fardos. Exige a 3ª função para acionamento de abertura e fechamento da pinça (sistema clamp).
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="text-[8.5px] font-black text-slate-900">Caçamba High Tip</span>
                    <span className="text-[7px] bg-orange-100 text-orange-700 px-1 py-0.2 rounded font-bold uppercase">3ª Função Extra</span>
                  </div>
                  <p className="text-[8px] text-slate-600 leading-snug text-justify">
                    Caçamba basculante de alta descarga. Utiliza a 3ª função extra para acionar os cilindros de inclinação hidráulica que elevam a altura de descarregamento.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="text-[8.5px] font-black text-slate-900">Prolongador com Caçamba</span>
                    <span className="text-[7px] bg-orange-100 text-orange-700 px-1 py-0.2 rounded font-bold uppercase">3ª Função Extra</span>
                  </div>
                  <p className="text-[8px] text-slate-600 leading-snug text-justify">
                    Braço de extensão com concha e cilindro de atuação integrado para maior alcance. Exige a 3ª função extra para acionamento e controle do basculamento hidráulico da caçamba.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="text-[8.5px] font-black text-slate-900">Garfo Pallet com Clamp</span>
                    <span className="text-[7px] bg-orange-100 text-orange-700 px-1 py-0.2 rounded font-bold uppercase">3ª Função Extra</span>
                  </div>
                  <p className="text-[8px] text-slate-600 leading-snug text-justify">
                    Equipamento que une as funcionalidades de um garfo paleteiro robusto com uma garra superior (clamp) de fixação. Exige a 3ª função extra para controle do fechamento do clamp sobre a carga.
                  </p>
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

              {/* Requirements */}
              <div className="border border-slate-200 rounded-xl p-3 mb-2.5 bg-slate-50/50 shadow-sm">
                <h4 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5 mb-1.5 border-b border-slate-200 pb-1">
                  <Settings className="h-4 w-4 text-orange-500" /> Requisitos de Instalação Hidráulica (3ª e 4ª Funções Extra)
                </h4>
                
                <p className="text-[10px] text-slate-700 leading-relaxed mb-2 text-justify">
                  A Roder fornece, junto ao orçamento do engate rápido, a <strong>instalação completa da linha hidráulica extra</strong> necessária na pá carregadeira. O número de funções adicionais é dimensionado de acordo com a gama de implementos:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
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
                  </div>

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
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex gap-2 items-start">
                  <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[8.5px] font-extrabold text-blue-950 uppercase block">Análise de Orçamento Comercial</span>
                    <p className="text-[8px] text-blue-900 leading-normal text-justify">
                      A Roder verifica quais são os equipamentos que o cliente irá utilizar na máquina para fornecer o orçamento adequado. Se houver o uso de equipamentos rotativos (Carregador Frontal ou Garras AFG), o orçamento deve contemplar a instalação de <strong>terceira e quarta funções extras</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="border border-orange-200 rounded-xl p-3 bg-orange-50/30 shadow-sm">
                <h4 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5 mb-1.5">
                  <HelpCircle className="h-4 w-4 text-orange-600" /> Checklist de Qualificação
                </h4>
                <div className="space-y-1.5 text-[9px] text-slate-700">
                  <div className="flex items-start gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-slate-800 text-white text-[7.5px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                    <div className="leading-snug text-justify">
                      <strong>Identificação da Máquina:</strong> É obrigatório identificar a <strong>marca, modelo exato e ano de fabricação</strong> da pá carregadeira do cliente para que o comercial processe o código correspondente.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-slate-800 text-white text-[7.5px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                    <div className="leading-snug text-justify">
                      <strong>Imagens do Engate Atual (Se Houver):</strong> Caso o cliente já possua um engate de outra marca e vá comprar um implemento Roder, o vendedor deve solicitar fotos nítidas do engate existente.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-slate-800 text-white text-[7.5px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                    <div className="leading-snug text-justify">
                      <strong>Diferença de Padrões de Fabricantes:</strong> Cada fabricante adota medidas de pino e posições de acoplamento variadas para codificar as ganchiras necessárias.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[7.5px] text-slate-500 font-mono">
              <div>
                <p className="font-bold">RODER BRASIL EQUIPAMENTOS HIDRÁULICOS LTDA</p>
                <p>Contato Comercial: Gislene / Triagem de Leads: Luana</p>
              </div>
              <div className="text-right">
                <p>Ficha Técnica Oficial • Página 2 de 2</p>
                <p>© {new Date().getFullYear()} Roder Brasil. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Floating Bottom Quick Bar for Mobile */}
      <footer className="w-full bg-slate-900 border-t border-slate-800 py-3 px-4 flex justify-center items-center gap-3 md:hidden sticky bottom-0 z-20">
        <button 
          onClick={exportPDF}
          disabled={isExporting}
          className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-3 rounded-lg text-xs shadow-lg"
        >
          <Download className="h-4 w-4" />
          <span>Baixar PDF Oficial</span>
        </button>
        <button 
          onClick={shareViaWhatsApp}
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-lg text-xs shadow-lg"
        >
          <MessageCircle className="h-4 w-4" />
          <span>WhatsApp</span>
        </button>
      </footer>
    </div>
  );
}
