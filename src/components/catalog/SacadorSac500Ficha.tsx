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
  Truck,
  Zap,
  Droplets,
  Layers,
  Share2,
  Trees,
  Check,
  FileText,
  Info,
  Maximize2
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { EditableImage } from './EditableImage';
import { useAuth } from '../../contexts/AuthContext';

interface SacadorSac500FichaProps {
  onClose: () => void;
}

export function SacadorSac500Ficha({ onClose }: SacadorSac500FichaProps) {
  const { isAdmin, isManager, isTriagem, isMarketing, isInternalSeller } = useAuth();
  const canEdit = isAdmin || isManager || isTriagem || isMarketing || isInternalSeller;
  
  const printRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [cardHeight, setCardHeight] = useState<number>(0);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Editable Images States with automatic localStorage persistence
  const LOCAL_STORAGE_KEYS = {
    main: 'roder_sacador_sac500_main_image',
    dentada: 'roder_sacador_sac500_dentada_image',
    vplate: 'roder_sacador_sac500_vplate_image',
  };

  const [mainImageUrl, setMainImageUrl] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.main) || '';
  });
  const [dentadaPlateImageUrl, setDentadaPlateImageUrl] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.dentada) || '';
  });
  const [vPlateImageUrl, setVPlateImageUrl] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.vplate) || '';
  });

  const handleUpdateMainImage = (url: string) => {
    setMainImageUrl(url);
    try {
      if (url) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.main, url);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.main);
      }
      toast.success('Foto do equipamento salva automaticamente!');
    } catch (err) {
      console.warn('Erro ao salvar no localStorage:', err);
    }
  };

  const handleUpdateDentadaImage = (url: string) => {
    setDentadaPlateImageUrl(url);
    try {
      if (url) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.dentada, url);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.dentada);
      }
      toast.success('Foto da Placa Dentada salva automaticamente!');
    } catch (err) {
      console.warn('Erro ao salvar no localStorage:', err);
    }
  };

  const handleUpdateVPlateImage = (url: string) => {
    setVPlateImageUrl(url);
    try {
      if (url) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.vplate, url);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.vplate);
      }
      toast.success('Foto da Placa em V salva automaticamente!');
    } catch (err) {
      console.warn('Erro ao salvar no localStorage:', err);
    }
  };

  const youtubeVideoUrl = "https://youtu.be/KzvgjsCeRf0?si=9l9Wf29rVg9NQ7db";

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const parentWidth = wrapperRef.current.clientWidth - 32;
        const targetWidth = 850;
        if (parentWidth < targetWidth) {
          const newScale = parentWidth / targetWidth;
          setScale(newScale);
          if (printRef.current) {
            setCardHeight(printRef.current.clientHeight * newScale);
          }
        } else {
          setScale(1);
          setCardHeight(0);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsPrinting(true);
    const toastId = toast.loading('Gerando PDF da Ficha Técnica SAC 500...');

    try {
      const dataUrl = await toPng(printRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        cacheBust: true
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Ficha_Tecnica_Sacador_SAC500_Roder.pdf');

      toast.success('PDF A4 baixado com sucesso!', { id: toastId });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao gerar PDF.', { id: toastId });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `*SACADOR FLORESTAL DE ÁRVORES SAC 500 - RODER* 🌳🚜

📌 *Especificações Técnicas:*
• *Código do Desenho:* 1000.1190.0000
• *Peso do Equipamento:* ~1.850 kg (~2.160 kg c/ acoplamento)
• *Máquina Base:* EXCLUSIVO para Escavadeiras de Esteira de 20 a 30 Toneladas
• *Linha Hidráulica:* 1 Linha Bidirecional (2 Mangueiras) c/ Sequência Automática
• *Dimensões:* 1.904 mm (A) x 1.600 mm (L) x 1.555 mm (P)
• *Capacidade Máx. Diâmetro:* Até 45 cm (Sacador / Seringueira) | 12 a 35 cm (Eucalipto)
• *Pressão / Vazão:* 320 a 350 bar | 180 a 250 L/min
• *Cilindros Hidráulicos:* 2 cilindros (1 garra + 1 torre) operados por 1 linha
• *Acumulador:* Não possui

⚙️ *Funcionamento Hidráulico:*
• 1 linha bidirecional com 2 mangueiras executa todo o trabalho.
• Ao acionar a linha, a garra fecha na árvore. Assim que prensa o tronco, a pressão se eleva no acionamento automático e o cilindro da torre avança para arrancar a árvore com toco e raízes.

🪵 *Placas Frontais de Série:*
• *Seringueira e Teca:* Ø 450 a 500 mm (Placa Dentada)
• *Eucalipto:* Ø 100 a 300/350 mm (Placa em V)

⚡ *Produtividade Estimada (Com Toco e Raízes):*
• Seringueira (com toco e raízes): 60 a 100 árvores/hora
• Eucalipto (com toco e raízes - tronco único): 120 a 150 árvores/hora

💡 *Informação de Campo:*
• O Sacador colhe a árvore por completo com o toco e as raízes mais estruturadas. Raízes finas secundárias que eventualmente se rompem no solo não atrapalham o cultivo do novo plantio.

⛔ *Restrições Críticas:*
• NÃO indicado para Pás Carregadeiras, Empilhadeiras ou Tratores.
• Indicado SOMENTE para Escavadeiras de Esteira (20 a 30 t).

▶️ *Vídeo de Operação no YouTube:* ${youtubeVideoUrl}

_Dúvidas ou orçamentos? Fale com a equipe técnica Roder!_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
      <div className="bg-slate-900 rounded-xl max-w-5xl w-full p-4 md:p-6 text-slate-100 shadow-2xl my-4 relative border border-slate-700">
        
        {/* Modal Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Trees className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Sacador SAC 500: Especificações Técnicas e Recomendações
              </h1>
              <p className="text-xs text-slate-400">
                Ficha Técnica Exclusiva Roder • Formato A4 Padrão de Mercado para Escavadeiras
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow"
              title="Compartilhar resumo via WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow disabled:opacity-50"
              title="Baixar Ficha Técnica em PDF A4"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PDF A4</span>
            </button>

            <a
              href={youtubeVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition shadow"
            >
              <Video className="w-4 h-4" />
              <span>Ver Vídeo</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition ml-2"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Outer Wrapper for scaling mobile views */}
        <div ref={wrapperRef} className="w-full overflow-hidden flex justify-center">
          <div 
            style={{
              height: cardHeight ? `${cardHeight}px` : 'auto',
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            {/* Printable Area - Standard Single Page A4 Format (Width 800px x Height 1130px) */}
            <div 
              ref={printRef}
              style={{
                transform: scale < 1 ? `scale(${scale})` : 'none',
                transformOrigin: 'top center',
                width: '800px',
                minHeight: '1120px',
                maxHeight: '1130px',
                boxSizing: 'border-box'
              }}
              className="bg-white text-slate-950 p-5 rounded-none shadow-xl font-sans border border-slate-300 flex flex-col justify-between"
            >
              
              <div>
                {/* 1. Standard Roder Corporate Header */}
                <div className="flex items-center justify-between border-b-2 border-amber-600 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-3">
                    <img 
                      src={RODER_LOGO_BASE64} 
                      alt="Roder Comercial" 
                      className="h-10 object-contain" 
                    />
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                        Sacador de Árvores SAC 500
                      </h2>
                      <p className="text-[11px] font-extrabold text-amber-800 tracking-wide uppercase">
                        Especificações Técnicas e Recomendações Operacionais
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block bg-slate-950 text-amber-400 font-extrabold text-xs px-2.5 py-1 rounded uppercase tracking-wider">
                      CÓDIGO: 1000.1190.0000
                    </span>
                    <p className="text-[9px] text-slate-800 font-bold mt-0.5">
                      Roder & Ibiguarim • Ficha Exclusiva
                    </p>
                  </div>
                </div>

                {/* 2. Quick Specs Summary Bar (Light Gray Cards with High Contrast Details) */}
                <div className="grid grid-cols-4 gap-2.5 mb-2.5">
                  <div className="bg-slate-50 p-2 rounded border border-slate-300 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-black text-slate-800 block">Máquina Base</span>
                      <span className="text-xs font-black text-slate-950 block mt-0.5">Escavadeira 20-30 t</span>
                    </div>
                    <span className="text-[8.5px] font-black text-amber-900 bg-amber-100 px-1 py-0.5 rounded mt-1">Uso Exclusivo Escavadeira</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded border border-slate-300 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-black text-slate-800 block">Peso do Equipamento</span>
                      <span className="text-xs font-black text-slate-950 block mt-0.5">1.850 kg (~2.160 kg)</span>
                    </div>
                    <span className="text-[8.5px] font-bold text-slate-800 mt-1">Com acoplamento</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded border border-slate-300 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-black text-slate-800 block">Linha Hidráulica</span>
                      <span className="text-xs font-black text-slate-950 block mt-0.5">1 Linha Bidirecional</span>
                    </div>
                    <span className="text-[8.5px] font-black text-slate-900 bg-slate-200 px-1 py-0.5 rounded mt-1">2 Mangueiras (Ciclo Total)</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded border border-slate-300 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-black text-slate-800 block">Funcionamento</span>
                      <span className="text-xs font-black text-slate-950 block mt-0.5">Sequencial Automático</span>
                    </div>
                    <span className="text-[8.5px] font-bold text-slate-800 mt-1">Sem Acumulador</span>
                  </div>
                </div>

                {/* 3. Visual Photo Box & Hydraulic Operation Principles (2 Columns) */}
                <div className="grid grid-cols-12 gap-3 mb-2.5">
                  
                  {/* Left Column: Expanded Product Photo Box */}
                  <div className="col-span-5 flex flex-col items-center justify-center bg-slate-50 rounded p-1.5 border border-slate-300 h-full min-h-[210px]">
                    <div className="w-full h-full min-h-[200px] bg-white rounded border border-slate-300 flex items-center justify-center relative overflow-hidden">
                      <EditableImage
                        src={mainImageUrl}
                        onChange={handleUpdateMainImage}
                        alt="Sacador SAC 500"
                        disabled={!canEdit}
                        maxHeightClass="max-h-[200px]"
                        outerMinHeightClass="min-h-[195px]"
                        innerMinHeightClass="min-h-[195px]"
                      />
                    </div>
                  </div>

                  {/* Right Column: Hydraulic Operation Principle */}
                  <div className="col-span-7 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-950 uppercase border-b border-slate-300 pb-1 mb-1.5 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        Funcionamento com 1 Linha e Sequência Automática
                      </h3>
                      <p className="text-[11px] text-slate-900 leading-snug mb-1.5 font-medium">
                        O <strong>Sacador SAC 500</strong> realiza a extração completa da árvore com <strong>toco e raízes</strong> operando com apenas <strong>1 linha hidráulica bidirecional (2 mangueiras)</strong>.
                      </p>
                      <ul className="text-[10.5px] text-slate-900 space-y-1.5">
                        <li className="flex items-start gap-1.5 bg-amber-50 p-1.5 rounded border border-amber-300">
                          <CheckCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-amber-950 block text-[10px] font-black">Sequência Automática por Elevação de Pressão:</strong>
                            <span className="text-slate-900 font-medium">Ao acionar a linha, a garra fecha na madeira. Assim que a garra prensa o tronco, a pressão hidráulica se eleva automaticamente, fazendo o cilindro da torre avançar imediatamente.</span>
                          </div>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span className="text-slate-900 font-medium"><strong className="font-black text-slate-950">Força Bruta Vertical:</strong> A sapata apoia no chão enquanto a torre exerce alavancagem para arrancar o toco e as raízes do solo.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-slate-950 text-white rounded p-1.5 mt-1 flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-amber-400">Vídeo de Operação em Campo:</span>
                      <a
                        href={youtubeVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:underline text-[9.5px] font-bold bg-red-600 px-2 py-0.5 rounded"
                      >
                        Assistir no YouTube
                      </a>
                    </div>
                  </div>

                </div>

                {/* 4. Technical Specifications Table (Market Standard) */}
                <div className="mb-2.5">
                  <h3 className="text-xs font-black text-slate-950 uppercase border-b border-slate-300 pb-1 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    Tabela de Especificações Técnicas (Padrão Escavadeiras)
                  </h3>

                  <div className="border border-slate-300 rounded overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-slate-950 text-amber-400 font-black text-[9.5px] uppercase">
                        <tr>
                          <th className="py-0.5 px-2.5 border-r border-slate-800 w-2/5">Parâmetro Técnico</th>
                          <th className="py-0.5 px-2.5 border-r border-slate-800 w-2/5">Especificação Nominal</th>
                          <th className="py-0.5 px-2.5 w-1/5">Observação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr className="bg-slate-50">
                          <td className="py-0.5 px-2.5 font-bold text-slate-950 border-r border-slate-200">Código do Desenho / Projeto</td>
                          <td className="py-0.5 px-2.5 font-black text-slate-950 border-r border-slate-200">1000.1190.0000</td>
                          <td className="py-0.5 px-2.5 text-slate-800 font-semibold text-[9.5px]">Exclusivo Roder / Ibiguarim</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 px-2.5 font-bold text-slate-950 border-r border-slate-200">Máquina Base Indicada</td>
                          <td className="py-0.5 px-2.5 font-black text-amber-900 border-r border-slate-200">Escavadeira de Esteiras 20 a 30 t</td>
                          <td className="py-0.5 px-2.5 text-slate-900 text-[9.5px]"><strong className="font-black text-slate-950">Exclusivo Escavadeiras</strong></td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="py-0.5 px-2.5 font-bold text-slate-950 border-r border-slate-200">Linha Hidráulica Requerida</td>
                          <td className="py-0.5 px-2.5 font-black text-slate-950 border-r border-slate-200">1 Linha Bidirecional (2 Mangueiras)</td>
                          <td className="py-0.5 px-2.5 text-slate-800 font-semibold text-[9.5px]">1 única linha faz todo o trabalho</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 px-2.5 font-bold text-slate-950 border-r border-slate-200">Funcionamento dos Cilindros</td>
                          <td className="py-0.5 px-2.5 font-black text-slate-950 border-r border-slate-200">Sequencial Automático por Pressão</td>
                          <td className="py-0.5 px-2.5 text-slate-800 font-semibold text-[9.5px]">Garra → Elevação Pressão → Torre</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="py-0.5 px-2.5 font-bold text-slate-950 border-r border-slate-200">Peso Total do Equipamento</td>
                          <td className="py-0.5 px-2.5 font-black text-slate-950 border-r border-slate-200">~1.850 kg (~2.160 kg c/ suporte)</td>
                          <td className="py-0.5 px-2.5 text-slate-800 font-semibold text-[9.5px]">Com acoplamento escavadeira</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 px-2.5 font-bold text-slate-950 border-r border-slate-200">Dimensões Físicas (A x L x P)</td>
                          <td className="py-0.5 px-2.5 font-black text-slate-950 border-r border-slate-200 text-[8.5px] leading-tight break-words whitespace-normal">1.904 mm x 1.600 mm x 1.555 mm</td>
                          <td className="py-0.5 px-2.5 text-slate-800 font-semibold text-[8.5px] leading-tight">Altura x Sapata x Profundidade</td>
                        </tr>
                        <tr className="bg-amber-50/70">
                          <td className="py-0.5 px-2.5 font-bold text-slate-950 border-r border-slate-200">Capacidade Máx. de Diâmetro</td>
                          <td className="py-0.5 px-2.5 font-black text-amber-950 border-r border-slate-200 text-[8.5px] leading-tight break-words whitespace-normal">Até 45 cm (Seringueira) | 12 a 35 cm (Eucalipto)</td>
                          <td className="py-0.5 px-2.5 text-slate-800 font-semibold text-[8px] leading-tight">Sacador: Placa Dentada 45 cm / Placa V: 12-35 cm</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="py-0.5 px-2.5 font-bold text-slate-950 border-r border-slate-200">Pressão de Trabalho / Vazão</td>
                          <td className="py-0.5 px-2.5 font-black text-slate-950 border-r border-slate-200">320 a 350 bar | 180 a 250 L/min</td>
                          <td className="py-0.5 px-2.5 text-slate-800 font-semibold text-[9.5px]">Fornecida pela escavadeira</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 px-2.5 font-bold text-slate-950 border-r border-slate-200">Possui Acumulador?</td>
                          <td className="py-0.5 px-2.5 font-black text-slate-950 border-r border-slate-200">NÃO possui acumulador</td>
                          <td className="py-0.5 px-2.5 text-slate-800 font-semibold text-[9.5px]">Inviável para extração pesada</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Placas Frontais Inclusas de Série (Square Photo Frames) */}
                <div className="mb-2.5">
                  <h3 className="text-xs font-black text-slate-950 uppercase border-b border-slate-300 pb-1 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    Placas Frontais Inclusas de Série (2 Modelos Intercambiáveis)
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5">
                    
                    {/* Placa Dentada */}
                    <div className="border border-slate-300 bg-slate-50 p-2 rounded flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="bg-amber-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase">
                            Placa Dentada (Tipo Cravo)
                          </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-950">Madeiras Não Fibrosas (Seringueira / Teca)</p>
                        <p className="text-[9.5px] text-slate-900 mt-0.5">
                          <strong>Diâmetro:</strong> Até <strong>450 a 500 mm (45 a 50 cm)</strong>.
                        </p>
                        <p className="text-[9px] text-slate-800 font-medium mt-0.5 leading-tight">
                          Os cravos perfuram a casca e travam o tronco sem deslizar.
                        </p>
                      </div>

                      {/* Square Photo Frame Box */}
                      <div className="w-24 h-24 bg-white border border-slate-300 rounded flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                        <EditableImage
                          src={dentadaPlateImageUrl}
                          onChange={handleUpdateDentadaImage}
                          alt="Placa Dentada SAC 500"
                          disabled={!canEdit}
                          maxHeightClass="max-h-[85px]"
                          outerMinHeightClass="min-h-[85px]"
                          innerMinHeightClass="min-h-[85px]"
                        />
                      </div>
                    </div>

                    {/* Placa em V */}
                    <div className="border border-slate-300 bg-slate-50 p-2 rounded flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="bg-slate-950 text-amber-400 font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase">
                            Placa em V (Lisa)
                          </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-950">Madeira Fibrosa (Eucalipto)</p>
                        <p className="text-[9.5px] text-slate-900 mt-0.5">
                          <strong>Diâmetro:</strong> De <strong>100 mm a 300/350 mm (10 a 35 cm)</strong>.
                        </p>
                        <p className="text-[9px] text-slate-800 font-medium mt-0.5 leading-tight">
                          Apoio plano em V que abraça o tronco sem rachar a madeira.
                        </p>
                      </div>

                      {/* Square Photo Frame Box */}
                      <div className="w-24 h-24 bg-white border border-slate-300 rounded flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                        <EditableImage
                          src={vPlateImageUrl}
                          onChange={handleUpdateVPlateImage}
                          alt="Placa em V SAC 500"
                          disabled={!canEdit}
                          maxHeightClass="max-h-[85px]"
                          outerMinHeightClass="min-h-[85px]"
                          innerMinHeightClass="min-h-[85px]"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* 6. Productivity & Explicit Restrictions Box */}
                <div className="grid grid-cols-2 gap-2.5 mb-2">
                  
                  {/* Productivity Column */}
                  <div className="bg-slate-950 text-white p-2 rounded border border-slate-800 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-amber-400 uppercase mb-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Produtividade Média Estimada (Com Toco e Raízes)
                      </h4>
                      <div className="text-[9.5px] space-y-0.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                          <span className="text-slate-200 font-bold">Seringueira (com toco e raízes):</span>
                          <span className="font-black text-amber-400">60 a 100 árv/h</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200 font-bold">Eucalipto (com toco e raízes - tronco único):</span>
                          <span className="font-black text-amber-400">120 a 150 árv/h</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Restrictions Column - Explicit Incompatibilities (Pás Carregadeiras, Empilhadeiras e Tratores) */}
                  <div className="bg-red-50 border border-red-300 p-2 rounded flex flex-col justify-between">
                    <div>
                      <h4 className="text-[9.5px] font-black text-red-950 uppercase mb-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        Restrições e Incompatibilidades
                      </h4>
                      <div className="text-[9px] text-red-950 space-y-0.5 font-bold">
                        <div className="flex items-start gap-1">
                          <span className="text-red-600 font-black">❌</span>
                          <span><strong>NÃO indicado para PÁS CARREGADEIRAS, EMPILHADEIRAS ou TRATORES.</strong></span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-red-600 font-black">❌</span>
                          <span><strong>NÃO serve para Rebrota de Eucalipto</strong> (Tronco único necessário).</span>
                        </div>
                        <div className="flex items-start gap-1 text-emerald-950 bg-emerald-100 px-1 py-0.5 rounded border border-emerald-300">
                          <span className="font-black">✅</span>
                          <span><strong>Indicado EXCLUSIVAMENTE para ESCAVADEIRAS DE ESTEIRA (20 a 30 t).</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 7. Explanatory Note on Root Removal & Soil Prep */}
                <div className="bg-amber-50/90 border border-amber-300 rounded p-1.5 mb-1.5 text-[9px] text-slate-950 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-950 font-black uppercase text-[8.5px] block">Detalhamento Técnico de Extração do Toco e Sistema Radicular:</strong>
                    <p className="leading-snug text-slate-900 font-medium">
                      O Sacador SAC 500 arranca a árvore colhendo por completo o <strong>toco e as raízes principais/estruturadas</strong> presas ao toco. Eventuais raízes finas secundárias que possam se romper e permanecer no solo não interferem no preparo ou cultivo do novo plantio.
                    </p>
                  </div>
                </div>

              </div>

              {/* 8. Roder Document Footer */}
              <div className="border-t-2 border-slate-300 pt-1.5 flex items-center justify-between text-[8.5px] text-slate-900 font-extrabold mt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-950">RODER COMERCIAL LTDA</span>
                  <span>•</span>
                  <span>Soluções Florestais de Alta Performance</span>
                </div>
                <div className="text-right text-slate-800 font-bold">
                  Ficha Técnica Exclusiva Sacador SAC 500 • Proposta válida por 60 dias
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
