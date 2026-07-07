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
  FileText
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface EngateRapidoFichaProps {
  onClose: () => void;
}

export function EngateRapidoFicha({ onClose }: EngateRapidoFichaProps) {
  const { isAdmin } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [customMainImageUrl, setCustomMainImageUrl] = useState<string | null>(null);
  const [customMountedImageUrl, setCustomMountedImageUrl] = useState<string | null>(null);
  const [customDrawingUrl, setCustomDrawingUrl] = useState<string | null>(null);
  const [customBucketAdapterImageUrl, setCustomBucketAdapterImageUrl] = useState<string | null>(null);
  const [customRearPrepImageUrl, setCustomRearPrepImageUrl] = useState<string | null>(null);
  const [loadingDrawing, setLoadingDrawing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const bucketInputRef = useRef<HTMLInputElement>(null);
  const rearInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchFichaImages = async () => {
      try {
        const docRef = doc(db, 'settings', 'engate_rapido_ficha_images');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCustomMainImageUrl(data.main_image_url || null);
          setCustomMountedImageUrl(data.mounted_image_url || null);
          setCustomDrawingUrl(data.drawing_url || null);
          setCustomBucketAdapterImageUrl(data.bucket_adapter_image_url || null);
          setCustomRearPrepImageUrl(data.rear_prep_image_url || null);
        } else {
          // Fallback to old single doc just in case
          const oldRef = doc(db, 'settings', 'engate_rapido_drawing');
          const oldSnap = await getDoc(oldRef);
          if (oldSnap.exists()) {
            setCustomDrawingUrl(oldSnap.data().image_data || null);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar imagens da ficha do engate rápido:', err);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'mounted' | 'drawing' | 'bucket_adapter' | 'rear_prep') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 2MB.");
      return;
    }

    const labels = {
      main: "Foto Principal",
      mounted: "Foto do Equipamento Montado",
      drawing: "Desenho Técnico 3D",
      bucket_adapter: "Foto do Adaptador da Caçamba",
      rear_prep: "Foto da Preparação Traseira"
    };

    setLoadingDrawing(true);
    const toastId = toast.loading(`Enviando ${labels[type]}...`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        const docRef = doc(db, 'settings', 'engate_rapido_ficha_images');
        const docSnap = await getDoc(docRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};
        
        let updateFields = {};
        if (type === 'main') {
          updateFields = { main_image_url: base64Data };
          setCustomMainImageUrl(base64Data);
        } else if (type === 'mounted') {
          updateFields = { mounted_image_url: base64Data };
          setCustomMountedImageUrl(base64Data);
        } else if (type === 'drawing') {
          updateFields = { drawing_url: base64Data };
          setCustomDrawingUrl(base64Data);
        } else if (type === 'bucket_adapter') {
          updateFields = { bucket_adapter_image_url: base64Data };
          setCustomBucketAdapterImageUrl(base64Data);
        } else if (type === 'rear_prep') {
          updateFields = { rear_prep_image_url: base64Data };
          setCustomRearPrepImageUrl(base64Data);
        }

        await setDoc(docRef, {
          ...currentData,
          ...updateFields,
          updated_at: new Date().toISOString()
        });

        toast.success(`${labels[type]} atualizado com sucesso!`, { id: toastId });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      toast.error(`Erro ao fazer upload do ${labels[type]}.`, { id: toastId });
    } finally {
      setLoadingDrawing(false);
    }
  };

  const handleResetImages = async () => {
    if (!window.confirm("Deseja realmente restaurar as imagens padrão da ficha técnica?")) return;

    setLoadingDrawing(true);
    const toastId = toast.loading("Restaurando imagens padrão...");

    try {
      const docRef = doc(db, 'settings', 'engate_rapido_ficha_images');
      await setDoc(docRef, {
        main_image_url: null,
        mounted_image_url: null,
        drawing_url: null,
        bucket_adapter_image_url: null,
        rear_prep_image_url: null,
        updated_at: new Date().toISOString()
      });
      setCustomMainImageUrl(null);
      setCustomMountedImageUrl(null);
      setCustomDrawingUrl(null);
      setCustomBucketAdapterImageUrl(null);
      setCustomRearPrepImageUrl(null);
      toast.success("Imagens padrão restauradas!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao restaurar as imagens padrão.", { id: toastId });
    } finally {
      setLoadingDrawing(false);
    }
  };

  const exportPDF = async () => {
    if (!printRef.current) return;
    setIsPrinting(true);
    const toastId = toast.loading("Gerando ficha técnica em PDF de alta qualidade...");

    try {
      // Delay to ensure rendering is stable and fonts are loaded
      await new Promise((resolve) => setTimeout(resolve, 800));

      const dataUrl = await toPng(printRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '794px', // Standard pixels for A4 width
        },
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // safe margin
      
      const tempImg = new Image();
      tempImg.src = dataUrl;
      
      await new Promise<void>((resolve, reject) => {
        tempImg.onload = () => resolve();
        tempImg.onerror = () => reject(new Error("Erro ao carregar imagem gerada"));
      });

      const imgHeight = (tempImg.height * imgWidth) / tempImg.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Multi-page splitting if height exceeds A4 limit
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save('Ficha_Tecnica_Engate_Rapido_Roder.pdf');
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-center items-start overflow-y-auto p-4 md:p-8 antialiased">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[90vh]">
        
        {/* Sidebar Controls (Responsive Layout) */}
        <div className="p-6 md:w-80 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-orange-600/10 flex items-center justify-center border border-orange-500/20">
                <Wrench className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-100 text-sm tracking-tight leading-none uppercase">Roder Brasil</h3>
                <span className="text-[10px] text-slate-400 font-mono">Engate Rápido</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Esta ficha técnica é dinâmica e pode ser exportada diretamente em PDF de alta qualidade para envio a parceiros e clientes finais.
            </p>

            <div className="space-y-3">
              <button 
                onClick={exportPDF}
                disabled={loadingDrawing}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition duration-200 shadow-lg shadow-orange-950/40 disabled:opacity-50"
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

            {isAdmin && (
              <div className="mt-8 border-t border-slate-800 pt-6">
                <span className="text-[10px] uppercase tracking-wider text-orange-500 font-extrabold block mb-3">Painel de Administração</span>
                <div className="space-y-3">
                  <label className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-lg text-xs cursor-pointer border border-slate-700 transition">
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>Upload Foto Principal</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'main')} 
                      className="hidden" 
                    />
                  </label>

                  <label className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-lg text-xs cursor-pointer border border-slate-700 transition">
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>Upload Equip. Montado</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'mounted')} 
                      className="hidden" 
                    />
                  </label>

                  <label className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-lg text-xs cursor-pointer border border-slate-700 transition">
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>Upload Desenho 3D</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'drawing')} 
                      className="hidden" 
                    />
                  </label>

                  <label className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-lg text-xs cursor-pointer border border-slate-700 transition">
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>Upload Adaptador Caçamba</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'bucket_adapter')} 
                      className="hidden" 
                    />
                  </label>

                  <label className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-lg text-xs cursor-pointer border border-slate-700 transition">
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>Upload Prep. Traseira Equip.</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'rear_prep')} 
                      className="hidden" 
                    />
                  </label>

                  {(customMainImageUrl || customMountedImageUrl || customDrawingUrl || customBucketAdapterImageUrl || customRearPrepImageUrl) && (
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

          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
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
                  />
                  <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Tecnologia em Equipamentos Hidráulicos</span>
                </div>
                <div className="text-right">
                  <h1 className="text-xl font-black text-slate-950 tracking-tight leading-none uppercase">Ficha Técnica Oficial</h1>
                  <span className="text-xs font-mono text-orange-600 font-bold block mt-1">ENGATE RÁPIDO PARA PÁ CARREGADEIRA</span>
                  <span className="text-[9px] text-slate-500 block">Validade Comercial: 60 dias da data de envio</span>
                </div>
              </div>

              {/* Grid Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                
                {/* Product Info Description */}
                <div className="md:col-span-7 space-y-4">
                  <h2 className="text-2xl font-black text-slate-950 tracking-tight leading-none uppercase border-l-4 border-orange-500 pl-2.5">
                    Engate Rápido Roder
                  </h2>
                  <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
                    O <strong>Engate Rápido Hidráulico Roder para Pás Carregadeiras</strong> é um equipamento fabricado sob encomenda e dimensionado sob medida para cada marca e modelo específico de máquina. Cada máquina possui dimensões exclusivas de pinos de acoplamento e largura interna de braço de elevação, tornando a personalização uma premissa fundamental para a garantia de perfeito funcionamento e segurança.
                  </p>
                  
                  <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
                    Projetado para operações que necessitam realizar trocas dinâmicas e constantes de implementos (por exemplo, alternando rapidamente entre a caçamba original de terra e o garfo pallet de carregamento), o engate rápido reduz radicalmente os tempos de ciclo logísticos, elevando a produtividade operacional.
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase flex items-center gap-1.5">
                      <Settings className="h-4 w-4 text-orange-500" /> Funcionamento & Instalação Hidráulica
                    </h3>
                    <ul className="space-y-2 text-[10.5px] text-slate-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Acionamento Direto da Cabine:</strong> O operador realiza o engate/desengate por meio de acionamento eletrônico via botão, sem necessidade de sair da cabine e sem esforço físico.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Necessidade de 3ª Via:</strong> Como a caçamba original e o garfo pallet não possuem cilindros hidráulicos próprios de abre/fecha, não há necessidade de vias exclusivas para os implementos. Porém, é requerida uma <strong>via hidráulica extra (terceira função)</strong> dedicada ao acionamento do cilindro do engate rápido.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Serviço de Instalação Roder:</strong> A Roder realiza a instalação hidráulica completa de terceira função nas pás carregadeiras do cliente para garantir o perfeito acionamento do sistema.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* CAD Scheme illustration */}
                <div className="md:col-span-5 flex flex-col justify-between">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center h-full relative min-h-[220px]">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-2">Esquema Técnico de Engate 3D</span>
                    {customDrawingUrl ? (
                      <img 
                        src={customDrawingUrl} 
                        alt="Desenho Técnico Engate Rápido" 
                        className="max-h-[190px] object-contain rounded" 
                      />
                    ) : (
                      <div className="flex flex-col items-center text-center p-4">
                        <svg className="w-24 h-24 text-slate-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18l-5-3-5 3-5-3Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="text-[10px] text-slate-400 italic">Esquema Roder 3D Personalizado</span>
                        <span className="text-[8px] text-slate-400/80 mt-1">Ganchiras de Acoplamento Sob Medida</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual Gallery Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Main Photo Slot */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col h-[200px]">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <span className="text-[9px] uppercase tracking-wider text-slate-700 font-extrabold flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5 text-orange-500" /> Foto Principal do Equipamento
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono">Vista Isolada</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-2 relative bg-white overflow-hidden">
                    <img 
                      src={customMainImageUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800"} 
                      alt="Foto Principal do Engate Rápido" 
                      className="max-h-[150px] max-w-full object-contain rounded transition hover:scale-105 duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Mounted Photo Slot */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col h-[200px]">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <span className="text-[9px] uppercase tracking-wider text-slate-700 font-extrabold flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-orange-500" /> Equipamento em Operação
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono">Montado na Pá Carregadeira</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-2 relative bg-white overflow-hidden">
                    <img 
                      src={customMountedImageUrl || "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=800"} 
                      alt="Engate Rápido Montado na Máquina" 
                      className="max-h-[150px] max-w-full object-contain rounded transition hover:scale-105 duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

              {/* Implement Compatibility Section */}
              <div className="border border-slate-200 rounded-xl p-4 mb-6 bg-slate-50/50">
                <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5 mb-3 border-b border-slate-200 pb-2">
                  <Layers className="h-4 w-4 text-orange-500" /> Compatibilidade & Adaptação de Implementos
                </h3>
                <p className="text-[10.5px] text-slate-700 leading-relaxed mb-4 text-justify">
                  Ao instalar o Engate Rápido Roder na carregadeira ou retroescavadeira, todos os implementos que serão utilizados na máquina devem ser preparados com o adaptador de engate correspondente. Veja as especificações para a caçamba original e a preparação traseira:
                </p>

                {/* Hidden Inputs for Direct Upload from Canvas */}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={bucketInputRef} 
                  onChange={(e) => handleImageUpload(e, 'bucket_adapter')} 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={rearInputRef} 
                  onChange={(e) => handleImageUpload(e, 'rear_prep')} 
                  className="hidden" 
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  {/* Bucket Adapter Section */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10.5px] font-bold text-slate-900 block mb-1 flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Adaptador da Caçamba Original (Obrigatório)
                      </span>
                      <p className="text-[10px] text-slate-600 leading-relaxed mb-3 text-justify">
                        <strong>O adaptador de caçamba sempre será necessário quando um engate rápido for instalado na máquina.</strong> A Roder fornece e instala um adaptador tipo gancho atrás da caçamba original da sua retroescavadeira ou pá carregadeira, transformando-a em uma ferramenta de acoplamento e desengate ágil.
                      </p>
                    </div>
                    <div 
                      onClick={() => isAdmin && bucketInputRef.current?.click()}
                      className={`h-[150px] w-full border border-dashed rounded-lg bg-slate-50 flex flex-col items-center justify-center p-2 relative overflow-hidden ${isAdmin ? 'cursor-pointer hover:bg-orange-50/30 hover:border-orange-300 transition-all' : 'border-slate-200'}`}
                    >
                      {customBucketAdapterImageUrl ? (
                        <img 
                          src={customBucketAdapterImageUrl} 
                          alt="Adaptador de Caçamba" 
                          className="max-h-[134px] max-w-full object-contain rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-center p-2">
                          <Upload className="h-6 w-6 text-slate-400 mb-1" />
                          <span className="text-[10px] font-bold text-slate-500">Adicionar Foto do Adaptador</span>
                          <span className="text-[8px] text-slate-400 mt-0.5">Obrigatório para a caçamba da retro/pá carregadeira</span>
                        </div>
                      )}
                      {isAdmin && (
                        <div className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider backdrop-blur-sm">
                          Alterar
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rear Preparation Section */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10.5px] font-bold text-slate-900 block mb-1 flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Preparação Traseira dos Equipamentos
                      </span>
                      <p className="text-[10px] text-slate-600 leading-relaxed mb-3 text-justify">
                        <strong>Qualquer equipamento a ser utilizado com o engate rápido exigirá um adaptador traseiro com ganchiras e engates na medida exata do engate rápido.</strong> Isso viabiliza o acoplamento seguro e o travamento hidráulico direto da cabine.
                      </p>
                    </div>
                    <div 
                      onClick={() => isAdmin && rearInputRef.current?.click()}
                      className={`h-[150px] w-full border border-dashed rounded-lg bg-slate-50 flex flex-col items-center justify-center p-2 relative overflow-hidden ${isAdmin ? 'cursor-pointer hover:bg-orange-50/30 hover:border-orange-300 transition-all' : 'border-slate-200'}`}
                    >
                      {customRearPrepImageUrl ? (
                        <img 
                          src={customRearPrepImageUrl} 
                          alt="Preparação Traseira" 
                          className="max-h-[134px] max-w-full object-contain rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-center p-2">
                          <Upload className="h-6 w-6 text-slate-400 mb-1" />
                          <span className="text-[10px] font-bold text-slate-500">Adicionar Foto da Preparação</span>
                          <span className="text-[8px] text-slate-400 mt-0.5">Medida padrão das ganchiras</span>
                        </div>
                      )}
                      {isAdmin && (
                        <div className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider backdrop-blur-sm">
                          Alterar
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* New Segment: Compatible Roder Implements examples and requirements */}
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1 border-t border-slate-200 pt-3">
                  <Wrench className="h-3.5 w-3.5 text-orange-600" /> Exemplos de Implementos Roder Compatíveis & Requisitos Hidráulicos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3">
                  <div className="bg-white border border-slate-150 rounded-lg p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9.5px] font-black text-slate-900">Carregador Frontal</span>
                        <span className="text-[8px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-bold uppercase">3ª + 4ª Função</span>
                      </div>
                      <p className="text-[9px] text-slate-600 leading-relaxed text-justify">
                        Equipamento dotado de garra com rotador pendulado. Necessita de 4 vias hidráulicas para acionamento simultâneo do abre/fecha e rotação do cabeçote.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-lg p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9.5px] font-black text-slate-900">Garfo Pallet</span>
                        <span className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold uppercase">Sem Cilindro</span>
                      </div>
                      <p className="text-[9px] text-slate-600 leading-relaxed text-justify">
                        Utilizado para cargas palletizadas. Não consome vias hidráulicas de acionamento em operação, necessitando apenas da 3ª função para travar/destravar o engate.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-lg p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9.5px] font-black text-slate-900">Garra Frontal / Pinça</span>
                        <span className="text-[8px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded font-bold uppercase">3ª Função Extra</span>
                      </div>
                      <p className="text-[9px] text-slate-600 leading-relaxed text-justify">
                        Utilizada na movimentação de toras de madeira e fardos. Exige a 3ª função para acionamento de abertura e fechamento da pinça (sistema clamp).
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-lg p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9.5px] font-black text-slate-900">Caçamba High Tip</span>
                        <span className="text-[8px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded font-bold uppercase">3ª Função Extra</span>
                      </div>
                      <p className="text-[9px] text-slate-600 leading-relaxed text-justify">
                        Caçamba basculante de alta descarga. Utiliza a 3ª função extra para acionar os cilindros de inclinação hidráulica que elevam a altura de descarregamento.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-lg p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9.5px] font-black text-slate-900">Prolongador com Caçamba</span>
                        <span className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold uppercase">Sem Cilindro / 3ª</span>
                      </div>
                      <p className="text-[9px] text-slate-600 leading-relaxed text-justify">
                        Braço de extensão com concha integrada para maior alcance. Caso seja articulada hidraulicamente, utiliza a 3ª função para basculamento.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-lg p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9.5px] font-black text-slate-900">Garra para Escavação</span>
                        <span className="text-[8px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded font-bold uppercase">3ª Função Extra</span>
                      </div>
                      <p className="text-[9px] text-slate-600 leading-relaxed text-justify">
                        Desenvolvida para trabalhos pesados de escavação e limpeza. Utiliza a 3ª função para abertura/fechamento das mandíbulas de escavação e entulho.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2.5 items-start">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-extrabold text-amber-950 uppercase block">Opção de Encaixe Direto nos Pinos (Sem Engate Rápido)</span>
                    <p className="text-[9.5px] text-amber-900 leading-relaxed text-justify">
                      Caso o cliente não tenha a necessidade de ficar alternando equipamentos de forma frequente, os implementos Roder são fabricados originalmente com as orelhas traseiras para fixação direta nos pinos da máquina. Nessa modalidade tradicional, o uso do engate rápido não é possível.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dimensionamento de Linhas Hidráulicas Section */}
              <div className="border border-slate-200 rounded-xl p-4 mb-6 bg-slate-50/50">
                <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5 mb-3 border-b border-slate-200 pb-2">
                  <Settings className="h-4 w-4 text-orange-500" /> Requisitos de Instalação Hidráulica (3ª e 4ª Funções Extra)
                </h3>
                
                <p className="text-[10.5px] text-slate-700 leading-relaxed mb-4 text-justify">
                  A Roder fornece, junto ao orçamento do engate rápido, a <strong>instalação completa da linha hidráulica extra</strong> necessária na pá carregadeira. O número de funções adicionais (vias de mangueiras) é dimensionado de acordo com a gama de implementos que o cliente utilizará na máquina:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 3ª Função Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-orange-100 text-orange-700 border border-orange-200">
                        3ª Função Extra
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">1 Linha / 2 Vias (Mangueiras)</span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed mb-2.5">
                      Instalação padrão fornecida junto no orçamento do engate rápido. Utilizada primariamente para o acionamento de <strong>abertura e fechamento dos pinos de travamento</strong> do engate rápido.
                    </p>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-[9.5px] text-slate-600 space-y-1.5">
                      <div className="font-semibold text-slate-800">Compartilhamento de Linha (Abre e Fecha):</div>
                      <p>
                        Para implementos com apenas função de abre/fecha, o cliente pode trabalhar com a <strong>mesma 3ª função</strong> sem custos de linhas adicionais:
                      </p>
                      <ul className="list-disc pl-3.5 space-y-1 text-[9px]">
                        <li><strong>Garra Frontal:</strong> Equipamento dotado de fechamento clamp simples (abre e fecha). Após realizar o acoplamento do engate rápido, o operador desce da máquina, desconecta as duas mangueiras que acionam os pinos do engate e as conecta para abertura e fechamento da garra frontal.</li>
                        <li><strong>Garras de Estufagem Sem Giro (AF 360, AF 400, AF 600, AF 800):</strong> São equipamentos que possuem apenas a função de abre e fecha, podendo utilizar perfeitamente somente a terceira função.</li>
                      </ul>
                    </div>
                  </div>

                  {/* 3ª e 4ª Funções Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">
                        3ª e 4ª Funções Extras
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">2 Linhas / 4 Vias (Mangueiras)</span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed mb-2.5">
                      Necessária quando o cliente adquire implementos que exigem <strong>sistema de rotação (giro)</strong> em adição ao movimento tradicional de abre/fecha.
                    </p>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-[9.5px] text-slate-600 space-y-1.5">
                      <div className="font-semibold text-slate-800">Implementos que exigem 4 Vias:</div>
                      <p>
                        A 3ª via aciona o abre/fecha (da pinça ou engate rápido) e a 4ª via realiza o giro horário e anti-horário do rotador:
                      </p>
                      <ul className="list-disc pl-3.5 space-y-1 text-[9px]">
                        <li><strong>Carregador Frontal:</strong> Equipamento dotado de garra com rotador pendurado para pá carregadeiras. Necessita das 4 mangueiras para acionamento simultâneo do abre/fecha e rotação.</li>
                        <li><strong>Garras de Estufagem com Giro (AFG 600 e AFG 800):</strong> A letra <strong>"G"</strong> no código do produto significa <strong>Giro</strong>. A 3ª função faz o abre e fecha da garra, e a 4ª função gira o equipamento para posicionar o feixe de madeira para cima, viabilizando o enchimento de fornos o mais alto possível.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2.5 items-start">
                  <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-extrabold text-blue-950 uppercase block">Análise de Orçamento Comercial</span>
                    <p className="text-[9.5px] text-blue-900 leading-relaxed">
                      A Roder verifica quais são os equipamentos que o cliente irá utilizar na máquina para fornecer o orçamento adequado. Se houver o uso de equipamentos rotativos (Carregador Frontal ou Garras AFG), o orçamento deve obrigatoriamente contemplar a instalação de <strong>terceira e quarta funções extras</strong>. Para garras fixas de estufagem ou garra frontal, a <strong>terceira função padrão</strong> é suficiente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Commercial Checklist for Salespeople */}
              <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/30">
                <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5 mb-2.5">
                  <HelpCircle className="h-4 w-4 text-orange-600" /> Checklist de Qualificação para o Vendedor / Parceiro
                </h3>
                <p className="text-[10px] text-slate-700 leading-relaxed mb-3">
                  Como cada carregadeira possui especificações técnicas distintas, as indicações comerciais desse equipamento devem seguir as etapas abaixo:
                </p>
                <div className="space-y-2.5 text-[10px] text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <div className="h-4 w-4 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                    <div>
                      <strong>Identificação da Máquina:</strong> É obrigatório identificar a <strong>marca, modelo exato e ano de fabricação</strong> da pá carregadeira do cliente para que o comercial interno processe o código de equipamento correspondente.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="h-4 w-4 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                    <div>
                      <strong>Imagens do Engate Atual (Se Houver):</strong> Caso o cliente já possua um engate rápido instalado de outra marca e vá comprar um implemento Roder, o vendedor deve solicitar e fornecer fotos nítidas do engate existente (com trena indicando a espessura de pinos e espaçamentos), permitindo à engenharia Roder fabricar os suportes compatíveis com o padrão do cliente.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="h-4 w-4 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                    <div>
                      <strong>Diferença de Padrões de Fabricantes:</strong> Cada fabricante adota medidas de pino e posições de acoplamento variadas. O comercial Roder passará estas especificidades ao departamento técnico para codificar perfeitamente as ganchiras necessárias para a adaptação correta.
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Footer */}
              <div className="mt-8 border-t border-slate-200 pt-4 flex justify-between items-center text-[8.5px] text-slate-500 font-mono">
                <div>
                  <p>RODER BRASIL EQUIPAMENTOS HIDRÁULICOS LTDA</p>
                  <p>Contato Comercial: Gislene / Triagem de Leads: Luana</p>
                </div>
                <div className="text-right">
                  <p>Documento gerado dinamicamente via RODER Indica V2</p>
                  <p>© {new Date().getFullYear()} Roder Brasil. Todos os direitos reservados.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
