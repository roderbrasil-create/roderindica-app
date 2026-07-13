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
  RotateCcw
} from 'lucide-react';
import { MACHINES, MATERIALS, calculateDischargeHeights, getRecommendedBucket } from './HighTipData';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { compressFileToDataURL } from '../../lib/imageUtils';
import { getApiBaseUrl } from '../../lib/utils';


interface HighTipFichaProps {
  onClose: () => void;
}

export function HighTipFicha({ onClose }: HighTipFichaProps) {
  const { isAdmin, isManager, isTriagem, isMarketing, isInternalSeller } = useAuth();
  const canEdit = isAdmin || isManager || isTriagem || isMarketing || isInternalSeller;
  const printRef = useRef<HTMLDivElement>(null);
  const [customDrawingUrl, setCustomDrawingUrl] = useState<string | null>(null);
  const [loadingDrawing, setLoadingDrawing] = useState(false);

  useEffect(() => {
    const fetchCustomDrawing = async () => {
      try {
        const docRef = doc(db, 'settings', 'high_tip_drawing');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCustomDrawingUrl(docSnap.data().image_data || null);
        }
      } catch (err) {
        console.error('Erro ao buscar desenho técnico customizado:', err);
      }
    };
    fetchCustomDrawing();
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleDrawingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 30MB.");
      return;
    }

    setLoadingDrawing(true);
    const toastId = toast.loading("Enviando e processando desenho técnico...");

    try {
      // Compress the image before uploading to avoid Firestore size limit
      const base64Data = await compressFileToDataURL(file, 800, 0.7);
      
      // Upload via server-side API to store in Firebase Storage or local uploads fallback
      const baseUrl = getApiBaseUrl();
      const uploadRes = await fetch(`${baseUrl}/api/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64Data,
          fileName: `high_tip_drawing_${Date.now()}.jpg`,
          contentType: "image/jpeg",
          folder: "high_tip",
          docName: "high_tip_drawing"
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

      const docRef = doc(db, 'settings', 'high_tip_drawing');
      setDoc(docRef, {
        image_data: imageUrlToSave,
        created_at: new Date().toISOString()
      }).catch(err => {
        console.warn("Erro não bloqueante ao salvar no Firestore (sincronização em segundo plano):", err);
      });

      setCustomDrawingUrl(imageUrlToSave);
      toast.success("Desenho técnico atualizado com sucesso!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao fazer upload do desenho técnico.", { id: toastId });
    } finally {
      setLoadingDrawing(false);
    }
  };

  const handleResetDrawing = async () => {
    if (!window.confirm("Deseja realmente restaurar o desenho técnico padrão?")) return;

    setLoadingDrawing(true);
    const toastId = toast.loading("Restaurando desenho padrão...");

    try {
      const docRef = doc(db, 'settings', 'high_tip_drawing');
      await setDoc(docRef, {
        image_data: null,
        created_at: new Date().toISOString()
      });

      setCustomDrawingUrl(null);
      toast.success("Desenho padrão restaurado com sucesso!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao restaurar o desenho padrão.", { id: toastId });
    } finally {
      setLoadingDrawing(false);
    }
  };

  const handleDownloadPdf = () => {
    const element = printRef.current;
    if (!element) return;

    const toastId = toast.loading("Preparando impressão da Ficha Técnica...");

    try {
      // Create a temporary top-level div as a child of body
      const printDiv = document.createElement('div');
      printDiv.id = "print-temp-div";
      printDiv.className = "bg-white text-black p-6 sm:p-10";
      printDiv.innerHTML = element.innerHTML;

      // Create a custom style block to override styles for printing
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

      // Wait slightly for layout/image rendering, then call print
      setTimeout(() => {
        toast.dismiss(toastId);
        window.print();

        // Clean up after print dialog is closed
        setTimeout(() => {
          document.getElementById('print-temp-div')?.remove();
          document.getElementById('print-temp-style')?.remove();
        }, 1000);
      }, 500);

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar a ficha técnica. Por favor, tente novamente.", { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print-backdrop">
      <div className="bg-card text-card-foreground w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col h-[96vh]">
        
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
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 bg-neutral-100">
          <div className="bg-white text-neutral-900 mx-auto max-w-4xl p-6 sm:p-12 shadow-md border border-neutral-200 rounded-lg print-container font-sans leading-relaxed text-sm" ref={printRef}>
            
            {/* SHEET PAGE 1: INTRODUCTION & REINFORCEMENTS */}
            <div className="space-y-6">
              
              {/* Logo & Header */}
              <div className="flex justify-between items-start border-b-2 border-amber-500 pb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f59e0b', paddingBottom: '16px' }}>
                <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={RODER_LOGO_BASE64} 
                    onError={(e) => {
                      e.currentTarget.src = "https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png";
                    }}
                    alt="Roder" 
                    style={{ height: '44px', width: 'auto', display: 'block', maxHeight: '44px' }}
                    className="h-11 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-none" style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, lineHeight: '1' }}>Roder</h1>
                    <p className="text-[9px] font-black tracking-widest uppercase text-amber-600 mt-1" style={{ fontSize: '9px', fontWeight: '900', color: '#d97706', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '4px 0 0 0' }}>Equipamentos Florestais</p>
                  </div>
                </div>
                <div className="text-right" style={{ textAlign: 'right' }}>
                  <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold" style={{ fontSize: '12px', backgroundColor: '#0f172a', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>Ficha de Equipamento</span>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1" style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', margin: '4px 0 0 0' }}>CATÁLOGO DE CONCHAS V2</p>
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

              {/* Dimensionamento Técnico com Desenho */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Dimensionamento Técnico e Medidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 border border-slate-200 rounded-xl p-3">
                  {/* Col 1: Desenho Técnico */}
                  <div className="flex flex-col items-center justify-center bg-white border border-slate-100 rounded-lg p-2 h-[220px] relative group overflow-hidden shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Esquema de Dimensões (CAD)</span>
                    
                    {customDrawingUrl ? (
                      <div className="w-full h-[180px] flex items-center justify-center bg-white rounded overflow-hidden">
                        <img 
                          src={customDrawingUrl} 
                          alt="Dimensionamento Técnico High Tip" 
                          className="max-w-full max-h-[175px] object-contain select-none"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <svg viewBox="0 0 320 180" className="w-full h-[180px] max-w-[280px]">
                        {/* Grid lines background */}
                        <g stroke="#f1f5f9" strokeWidth="0.8">
                          <line x1="10" y1="20" x2="310" y2="20" />
                          <line x1="10" y1="50" x2="310" y2="50" />
                          <line x1="10" y1="80" x2="310" y2="80" />
                          <line x1="10" y1="110" x2="310" y2="110" />
                          <line x1="10" y1="140" x2="310" y2="140" />
                          <line x1="10" y1="170" x2="310" y2="170" />
                          <line x1="40" y1="10" x2="40" y2="170" />
                          <line x1="100" y1="10" x2="100" y2="170" />
                          <line x1="160" y1="10" x2="160" y2="170" />
                          <line x1="220" y1="10" x2="220" y2="170" />
                          <line x1="280" y1="10" x2="280" y2="170" />
                        </g>
                        
                        {/* Bucket outline */}
                        <path d="M 60 40 L 70 120 L 160 120 Q 200 120 220 80 L 160 30 Q 150 25 140 30 L 110 40 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="2" strokeLinejoin="round" />
                        {/* Pivot points / arm attachment */}
                        <circle cx="60" cy="50" r="6" fill="#64748b" stroke="#1e293b" strokeWidth="1.5" />
                        <circle cx="65" cy="100" r="6" fill="#64748b" stroke="#1e293b" strokeWidth="1.5" />
                        <path d="M 60 50 L 35 55 M 65 100 L 35 95" stroke="#475569" strokeWidth="2" strokeDasharray="2,2" />
                        {/* High Tip Cylinders / mechanism */}
                        <path d="M 70 120 L 100 130" stroke="#334155" strokeWidth="3" />
                        <path d="M 160 120 L 220 75" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="2,2" />
                        
                        {/* Roder Embossed Logo */}
                        <text x="120" y="80" fill="#475569" fontSize="12" fontWeight="900" letterSpacing="1" fontFamily="sans-serif">RODER</text>
                        
                        {/* DIMENSION LINES */}
                        {/* Height A (Vertical arrow) */}
                        <g stroke="#2563eb" strokeWidth="1.2">
                          {/* Upper helper line */}
                          <line x1="160" y1="30" x2="260" y2="30" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2,2" />
                          {/* Lower helper line */}
                          <line x1="160" y1="120" x2="260" y2="120" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2,2" />
                          {/* Dimension line */}
                          <line x1="250" y1="35" x2="250" y2="115" />
                          {/* Arrowheads */}
                          <polygon points="250,30 247,38 253,38" fill="#2563eb" stroke="none" />
                          <polygon points="250,120 247,112 253,112" fill="#2563eb" stroke="none" />
                        </g>
                        <text x="260" y="80" fill="#2563eb" fontSize="11" fontWeight="bold">A</text>
                        
                        {/* Width B (Indicated on 3D or separately represented) */}
                        {/* Front width B representation */}
                        <g transform="translate(190, 120)">
                          {/* Front view outline of bucket mouth */}
                          <rect x="0" y="10" width="60" height="25" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" rx="3" />
                          <line x1="0" y1="43" x2="60" y2="43" stroke="#2563eb" strokeWidth="1.2" />
                          <polygon points="0,43 7,40 7,46" fill="#2563eb" stroke="none" />
                          <polygon points="60,43 53,40 53,46" fill="#2563eb" stroke="none" />
                          <text x="26" y="53" fill="#2563eb" fontSize="9" fontWeight="bold">B</text>
                          <text x="14" y="25" fill="#64748b" fontSize="7" fontWeight="bold">VISTA FRONTAL</text>
                        </g>

                        {/* Length C (Pino até a faca/lâmina) */}
                        <g stroke="#2563eb" strokeWidth="1.2">
                          {/* Vertical helper line at pin */}
                          <line x1="60" y1="50" x2="60" y2="160" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2,2" />
                          {/* Vertical helper line at blade tip */}
                          <line x1="220" y1="80" x2="220" y2="160" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2,2" />
                          {/* Horizontal dimension line */}
                          <line x1="65" y1="150" x2="215" y2="150" />
                          {/* Arrowheads */}
                          <polygon points="60,150 68,147 68,153" fill="#2563eb" stroke="none" />
                          <polygon points="220,150 212,147 212,153" fill="#2563eb" stroke="none" />
                        </g>
                        <text x="135" y="145" fill="#2563eb" fontSize="11" fontWeight="bold">C</text>
                      </svg>
                    )}

                     {/* Controles de upload flutuantes (no-print) */}
                    {canEdit && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 no-print opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 bg-slate-900/90 backdrop-blur-sm p-1.5 rounded-lg border border-slate-700/50 shadow-md">
                        <label className="cursor-pointer text-[10px] font-extrabold text-white hover:text-orange-400 flex items-center gap-1 px-2 py-1 rounded transition-colors" title="Substituir por seu desenho CAD real">
                          <Upload className="h-3.5 w-3.5" />
                          <span>Substituir Desenho</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleDrawingUpload}
                            disabled={loadingDrawing}
                          />
                        </label>
                        {customDrawingUrl && (
                          <button 
                            onClick={handleResetDrawing}
                            disabled={loadingDrawing}
                            className="text-[10px] font-extrabold text-slate-300 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded transition-colors border-l border-slate-700/60"
                            title="Restaurar desenho vetorial padrão"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Padrão</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Col 2: Tabela de Medidas */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[9px] tracking-wider border-b border-slate-200">
                          <th className="p-2 pl-3">Modelo</th>
                          <th className="p-2 text-center">Altura A</th>
                          <th className="p-2 text-center">Largura B</th>
                          <th className="p-2 text-center">Comprimento C</th>
                          <th className="p-2 pr-3 text-right">Peso Est.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-1.5 pl-3 font-bold">2.0 m³</td>
                          <td className="p-1.5 text-center font-mono">900 mm</td>
                          <td className="p-1.5 text-center font-mono">2.400 mm</td>
                          <td className="p-1.5 text-center font-mono">1.600 mm</td>
                          <td className="p-1.5 pr-3 text-right font-bold text-slate-600">1.000 kg</td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-1.5 pl-3 font-bold">2.5 m³</td>
                          <td className="p-1.5 text-center font-mono">1.125 mm</td>
                          <td className="p-1.5 text-center font-mono">2.780 mm</td>
                          <td className="p-1.5 text-center font-mono">1.800 mm</td>
                          <td className="p-1.5 pr-3 text-right font-bold text-slate-600">1.800 kg</td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-1.5 pl-3 font-bold">2.8 m³</td>
                          <td className="p-1.5 text-center font-mono">1.210 mm</td>
                          <td className="p-1.5 text-center font-mono">2.786 mm</td>
                          <td className="p-1.5 text-center font-mono">1.800 mm</td>
                          <td className="p-1.5 pr-3 text-right font-bold text-slate-600">1.800 kg</td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-1.5 pl-3 font-bold">3.0 m³</td>
                          <td className="p-1.5 text-center font-mono">1.295 mm</td>
                          <td className="p-1.5 text-center font-mono">2.786 mm</td>
                          <td className="p-1.5 text-center font-mono">1.800 mm</td>
                          <td className="p-1.5 pr-3 text-right font-bold text-slate-600">1.800 kg</td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-1.5 pl-3 font-bold">4.0 m³</td>
                          <td className="p-1.5 text-center font-mono">1.350 mm</td>
                          <td className="p-1.5 text-center font-mono">2.800 mm</td>
                          <td className="p-1.5 text-center font-mono">2.300 mm</td>
                          <td className="p-1.5 pr-3 text-right font-bold text-slate-600">2.000 kg</td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-1.5 pl-3 font-bold">5.0 m³</td>
                          <td className="p-1.5 text-center font-mono">1.360 mm</td>
                          <td className="p-1.5 text-center font-mono">2.950 mm</td>
                          <td className="p-1.5 text-center font-mono">2.700 mm</td>
                          <td className="p-1.5 pr-3 text-right font-bold text-slate-600">2.200 kg</td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-1.5 pl-3 font-bold">7.0 m³</td>
                          <td className="p-1.5 text-center font-mono">1.500 mm</td>
                          <td className="p-1.5 text-center font-mono">2.950 mm</td>
                          <td className="p-1.5 text-center font-mono">2.800 mm</td>
                          <td className="p-1.5 pr-3 text-right font-bold text-slate-600">2.500 kg</td>
                        </tr>
                      </tbody>
                    </table>
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
                
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-950 leading-relaxed space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" /> Nota de Segurança e Estabilidade Comercial (Cálculo de Esterço Ativo)
                  </p>
                  <p>
                    Esta tabela oficial contempla o cálculo rigoroso de <strong>esterçamento ativo (segurança de manobra com redução de 15%)</strong>, capacidade limite de carga e limite de tombamento da máquina. Por conta disso, as recomendações abaixo representam a configuração <strong>mais segura e estável</strong> para cada modelo de pá carregadeira operando com cada classe de material.
                  </p>
                  <p className="text-slate-600 font-medium text-[10px]">
                    * Para realizar simulações flexíveis ou cálculos de alta performance sem a restrição automática de esterço de segurança, utilize o <strong>Guia de Seleção Digital</strong> no painel interativo do aplicativo.
                  </p>
                </div>
                
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
                        const recLight = getRecommendedBucket(m, 375, true);
                        const recMedium = getRecommendedBucket(m, 800, true);
                        const recHeavy = getRecommendedBucket(m, 1400, true);

                        const lightH = calculateDischargeHeights(m, recLight);
                        const mediumH = calculateDischargeHeights(m, recMedium);
                        const heavyH = calculateDischargeHeights(m, recHeavy);
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
                              <div className="font-black text-emerald-700">{recLight.replace('.', ',')} m³</div>
                              <div className="text-[9px] text-emerald-600 font-black">Des.: {lightH.highTipDischargeHeight.toFixed(2)}m</div>
                              <div className="text-[7.5px] text-emerald-600 font-semibold">Ganho: +{lightH.gainHeight.toFixed(2)}m</div>
                            </td>
                            <td className="p-1 text-center border-r border-slate-100 bg-sky-500/5 text-[9.5px]">
                              <div className="font-black text-sky-700">{recMedium.replace('.', ',')} m³</div>
                              <div className="text-[9px] text-sky-600 font-black">Des.: {mediumH.highTipDischargeHeight.toFixed(2)}m</div>
                              <div className="text-[7.5px] text-sky-600 font-semibold">Ganho: +{mediumH.gainHeight.toFixed(2)}m</div>
                            </td>
                            <td className="p-1 text-center bg-amber-500/5 text-[9.5px]">
                              <div className="font-black text-amber-700">{recHeavy.replace('.', ',')} m³</div>
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
