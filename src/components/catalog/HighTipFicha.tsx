import React, { useRef } from 'react';
import { 
  X, 
  CheckCircle, 
  ShieldCheck, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  Info,
  Download
} from 'lucide-react';
import { MACHINES, MATERIALS, calculateDischargeHeights } from './HighTipData';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface HighTipFichaProps {
  onClose: () => void;
}

export function HighTipFicha({ onClose }: HighTipFichaProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element) return;

    const toastId = toast.loading("Gerando ficha técnica em PDF de alta definição...");

    try {
      const options = {
        quality: 1.0,
        pixelRatio: 2, // Enhances text clarity
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '850px', // Standard width for high-fidelity export
        }
      };

      const dataUrl = await toPng(element, options);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      
      const elementWidth = element.scrollWidth || element.clientWidth || 850;
      const elementHeight = element.scrollHeight || element.clientHeight;
      const imgHeight = (elementHeight * imgWidth) / elementWidth;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Multi-page export handling
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save('Ficha_Tecnica_Roder_High_Tip.pdf');

      try {
        const blob = pdf.output('blob');
        const blobURL = URL.createObjectURL(blob);
        window.open(blobURL, '_blank');
      } catch (e) {
        console.warn("Could not open PDF in new tab, but download started.", e);
      }

      toast.success("Ficha técnica salva com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF. Por favor, tente novamente.", { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print-backdrop">
      <div className="bg-card text-card-foreground w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[96vh]">
        
        {/* Header Controls */}
        <div className="bg-muted px-6 py-4 flex items-center justify-between border-b border-border no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="font-extrabold text-sm tracking-tight text-foreground">Ficha Técnica Oficial Roder</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition-all shadow-sm"
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-100">
          <div className="bg-white text-neutral-900 mx-auto max-w-4xl p-6 sm:p-12 shadow-md border border-neutral-200 rounded-lg print-container font-sans leading-relaxed text-sm" ref={printRef}>
            
            {/* SHEET PAGE 1: INTRODUCTION & REINFORCEMENTS */}
            <div className="space-y-6">
              
              {/* Logo & Header */}
              <div className="flex justify-between items-start border-b-2 border-amber-500 pb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={RODER_LOGO_BASE64} 
                    alt="Roder" 
                    className="h-11 object-contain brightness-100"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-none">Roder</h1>
                    <p className="text-[9px] font-black tracking-widest uppercase text-amber-600 mt-1">Equipamentos Florestais</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold">Ficha de Equipamento</span>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1">CATÁLOGO DE CONCHAS V2</p>
                </div>
              </div>

              {/* Title Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="md:col-span-2 space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 tracking-tight">Caçamba High Tip Roder</h2>
                  <p className="text-xs text-slate-600 font-medium">
                    A Caçamba High Tip Roder, também conhecida como Caçamba de Despejo Alto, é a escolha ideal para operações que exigem o despejo de materiais em pontos elevados, como caminhões basculantes, carretas graneleiras, silos, moegas ou contêineres altos.
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    Projetada para ser acoplada a carregadeiras de pneus, a caçamba High Tip da Roder proporciona maior alcance vertical e excelente capacidade volumétrica, garantindo eficiência logística e menor tempo de ciclo nas operações de carga e descarga.
                  </p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-xs text-amber-800 uppercase tracking-wider flex items-center gap-1">
                    <Settings className="h-3.5 w-3.5 text-amber-600" /> Modelos Padrão
                  </h4>
                  <ul className="text-xs text-slate-800 space-y-1 font-bold">
                    <li>• Caçamba Roder 2,0 m³ <span className="text-[10px] text-slate-500 font-medium">(Est. 1.000 kg)</span></li>
                    <li>• Caçamba Roder 2,5 m³ <span className="text-[10px] text-slate-500 font-medium">(Est. 1.800 kg)</span></li>
                    <li>• Caçamba Roder 2,8 m³ <span className="text-[10px] text-slate-500 font-medium">(Est. 1.800 kg)</span></li>
                    <li>• Caçamba Roder 3,0 m³ <span className="text-[10px] text-slate-500 font-medium">(Est. 1.800 kg)</span></li>
                    <li>• Caçamba Roder 4,0 m³ <span className="text-[10px] text-slate-500 font-medium">(Est. 2.000 kg)</span></li>
                    <li>• Caçamba Roder 5,0 m³ <span className="text-[10px] text-slate-500 font-medium">(Est. 2.200 kg)</span></li>
                    <li>• Caçamba Roder 7,0 m³ <span className="text-[10px] text-amber-600 font-semibold">(Est. 2.500 kg - Novo)</span></li>
                    <li className="text-[10px] text-slate-500 pt-1 font-normal">*Modelos sob medida disponíveis</li>
                  </ul>
                </div>
              </div>

              {/* Robustness & Materials */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm text-slate-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <ShieldCheck className="h-4 w-4 text-slate-700" /> Robustez de Alta Performance
                  </h3>
                  <p className="text-xs text-slate-600 leading-snug">
                    Fabricadas com aço estrutural certificado de altíssima resistência, as caçambas da Roder são dimensionadas para suportar as piores forças de fadiga operacional e atrito constante.
                  </p>
                  <ul className="text-xs text-slate-700 font-semibold space-y-1">
                    <li className="flex items-center gap-1">✔ Chapas de desgaste reforçadas na base</li>
                    <li className="flex items-center gap-1">✔ Sobre-lâminas em <span className="text-amber-600">Aço HARDOX</span></li>
                    <li className="flex items-center gap-1">✔ Soldagem robotizada de precisão estrutural</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm text-slate-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <TrendingUp className="h-4 w-4 text-slate-700" /> Aplicações Ideais
                  </h3>
                  <p className="text-xs text-slate-600 leading-snug">
                    Operações ágeis de movimentação de granéis sólidos e resíduos de baixa a altíssima densidade em pátios industriais, florestais ou portuários:
                  </p>
                  <ul className="text-xs text-slate-700 font-semibold space-y-1">
                    <li>• Cavaco de madeira, serragem e biomassa</li>
                    <li>• Bagaço de cana-de-açúcar, cascas e grãos</li>
                    <li>• Alimentação de moegas elevadas e silos</li>
                    <li>• Logística florestal de eucalipto ou pinus</li>
                  </ul>
                </div>
              </div>

              {/* Diferenciais */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Principais Diferenciais Técnicos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-black text-slate-900 text-xs">Uso Contínuo</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Estrutura blindada para 3 turnos</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-black text-slate-900 text-xs">Alcance Superior</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Alturas de despejo elevadas</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-black text-slate-900 text-xs">Segurança Ativa</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Design contra tombamento</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-black text-slate-900 text-xs">Suporte Técnico</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Reposição e peças 100% nacional</p>
                  </div>
                </div>
              </div>

              {/* Critical selection disclaimer */}
              <div className="p-4 bg-amber-500/5 border-l-4 border-amber-500 rounded-r-lg space-y-1.5">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Por que a seleção correta da concha é vital?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Uma caçamba subdimensionada reduz severamente a produtividade da máquina e aumenta o consumo de combustível devido ao excesso de ciclos. No entanto, uma caçamba superdimensionada com material denso pode exceder o limite de tombamento da carregadeira, causando acidentes operacionais gravíssimos, trincas estruturais no chassi da máquina e perda de controle de direção. Use sempre nossa tabela de compatibilidade.
                </p>
              </div>

            </div>

            {/* PAGE BREAK FOR PRINTING */}
            <div className="page-break my-8 border-t-2 border-dashed border-slate-300 pt-8" />

            {/* SHEET PAGE 2: COMPATIBILITY TABLE & MATERIALS */}
            <div className="space-y-6">
              
              {/* Header Page 2 */}
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-500">RODER BRASIL • GUIA COMERCIAL DE SELEÇÃO</span>
                <span className="text-xs font-bold text-slate-500">PÁGINA 2 / 2</span>
              </div>

              {/* Materials Densities Guide */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-amber-500" /> Tabela de Densidade de Materiais
                </h3>
                <p className="text-xs text-slate-500 mb-2">Classificação de referência para definição do tamanho ideal da concha.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-1">
                    <p className="text-[10px] uppercase font-black text-emerald-600 tracking-wider">Materiais Leves (200 - 600 kg/m³)</p>
                    <div className="text-[11px] text-slate-700 space-y-0.5 font-medium">
                      <p>• Cavaco de madeira: ~350 kg/m³</p>
                      <p>• Serragem de madeira: ~260 kg/m³</p>
                      <p>• Bagaço de cana: ~200 kg/m³</p>
                      <p>• Biomassa florestal: ~375 kg/m³</p>
                      <p>• Casca de arroz / pinus: ~150-375 kg/m³</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-sky-500/5 rounded-xl border border-sky-500/10 space-y-1">
                    <p className="text-[10px] uppercase font-black text-sky-600 tracking-wider">Materiais Médios (700 - 1000 kg/m³)</p>
                    <div className="text-[11px] text-slate-700 space-y-0.5 font-medium">
                      <p>• Milho, Soja e Trigo: ~730 - 770 kg/m³</p>
                      <p>• Cevada e Arroz em casca: ~720 - 760 kg/m³</p>
                      <p>• Ração / Silagem: ~780 - 850 kg/m³</p>
                      <p>• Gesso e Argila seca: ~900 - 950 kg/m³</p>
                      <p>• Fertilizante químico: ~1000 kg/m³</p>
                    </div>
                  </div>

                  <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 space-y-1 col-span-2 md:col-span-1">
                    <p className="text-[10px] uppercase font-black text-red-600 tracking-wider">Materiais Pesados (1200 - 2200+ kg/m³)</p>
                    <div className="text-[11px] text-slate-700 space-y-0.5 font-medium">
                      <p>• Terra seca: ~1200 kg/m³</p>
                      <p>• Calcário britado: ~1350 kg/m³</p>
                      <p>• Pedra britada / Areia: ~1600 kg/m³</p>
                      <p>• Areia úmida: ~1900 kg/m³</p>
                      <p>• Minério de ferro: ~2250 kg/m³</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loader Compatibility Table */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Tabela Oficial de Compatibilidade por Pás Carregadeiras</h3>
                <p className="text-xs text-slate-500">Mapeamento comercial com base na capacidade volumétrica original e peso operacional.</p>
                
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-white text-[9.5px] uppercase tracking-wider font-bold">
                        <th className="p-1.5 border-r border-slate-800">Fabricante</th>
                        <th className="p-1.5 border-r border-slate-800">Modelo</th>
                        <th className="p-1.5 border-r border-slate-800 text-center">Peso Op.</th>
                        <th className="p-1.5 border-r border-slate-800">Classe</th>
                        <th className="p-1.5 border-r border-slate-800 text-center">Concha Orig.</th>
                        <th className="p-1.5 border-r border-slate-800 text-center bg-emerald-900/40 text-emerald-100">C. Leve (≤600)</th>
                        <th className="p-1.5 border-r border-slate-800 text-center bg-sky-900/40 text-sky-100">C. Médio (700-1000)</th>
                        <th className="p-1.5 text-center bg-amber-900/40 text-amber-100">C. Pesado (&gt;1000)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {MACHINES.map((m, idx) => {
                        const lightH = calculateDischargeHeights(m, m.recommendedLight);
                        const mediumH = calculateDischargeHeights(m, m.recommendedMedium);
                        const heavyH = calculateDischargeHeights(m, m.recommendedHeavy);
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td translate="no" className="p-1 pl-1.5 font-bold border-r border-slate-100 text-[10.5px] notranslate">{m.brand}</td>
                            <td translate="no" className="p-1 font-black border-r border-slate-100 text-[10.5px] notranslate">{m.model}</td>
                            <td className="p-1 text-center border-r border-slate-100 text-[10px]">{m.operatingWeight.toFixed(1)}t</td>
                            <td className="p-1 border-r border-slate-100 text-slate-500 text-[9px]">{m.class}</td>
                            <td className="p-1 text-center border-r border-slate-100 text-slate-600 text-[9px]">
                              <div className="font-bold">{m.originalBucket}</div>
                              <div className="text-[8px] text-slate-400 font-normal">Pino: {lightH.originalPinHeight.toFixed(2)}m</div>
                            </td>
                            <td className="p-1 text-center border-r border-slate-100 bg-emerald-500/5 text-[9.5px]">
                              <div className="font-black text-emerald-700">{m.recommendedLight} m³</div>
                              <div className="text-[9px] text-emerald-600 font-black">Des.: {lightH.highTipDischargeHeight.toFixed(2)}m</div>
                              <div className="text-[7.5px] text-emerald-600 font-semibold">Ganho: +{lightH.gainHeight.toFixed(2)}m</div>
                            </td>
                            <td className="p-1 text-center border-r border-slate-100 bg-sky-500/5 text-[9.5px]">
                              <div className="font-black text-sky-700">{m.recommendedMedium} m³</div>
                              <div className="text-[9px] text-sky-600 font-black">Des.: {mediumH.highTipDischargeHeight.toFixed(2)}m</div>
                              <div className="text-[7.5px] text-sky-600 font-semibold">Ganho: +{mediumH.gainHeight.toFixed(2)}m</div>
                            </td>
                            <td className="p-1 text-center bg-amber-500/5 text-[9.5px]">
                              <div className="font-black text-amber-700">{m.recommendedHeavy} m³</div>
                              <div className="text-[9px] text-amber-600 font-black">Des.: {heavyH.highTipDischargeHeight.toFixed(2)}m</div>
                              <div className="text-[7.5px] text-amber-600 font-semibold">Ganho: +{heavyH.gainHeight.toFixed(2)}m</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[9px] text-slate-500 leading-relaxed italic mt-1.5">
                  * <strong>Nota sobre Alturas de Descarga Livre:</strong> Calculada com base no pino original e no ganho real obtido pela articulação suspensa da Caçamba High Tip, que rotaciona na extremidade superior eliminando a perda de altura por tombamento da concha padrão (despejo convencional a 45°). O ganho real de altura livre de descarga varia de +1,15 m a +1,27 m em relação à descarga livre convencional, utilizando braços de estrutura com comprimento de 1,50 m (para modelo 2,0 m³), 1,80 m (para modelos de 2,5 m³ a 3,0 m³) e 2,00 m (para modelos de 4,0 m³ a 7,0 m³).
                </p>
              </div>

              {/* Technical Specifications disclaimer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] text-slate-500 border-t border-slate-200 pt-4">
                <div>
                  <p className="font-bold uppercase text-slate-700">Responsável pelo Projeto Roder:</p>
                  <p>Engenharia de Aplicação e Desenvolvimento de Soluções Customizadas.</p>
                  <p className="mt-1">© 2026 Roder Brasil. Todos os direitos reservados.</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="font-bold uppercase text-slate-700">Contatos Oficiais:</p>
                  <p>Site: https://roderbrasil.com.br</p>
                  <p>E-mail: vendas@roderbrasil.com.br</p>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
