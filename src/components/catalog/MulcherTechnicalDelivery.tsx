import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { 
  FileText, 
  Wrench, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Printer, 
  Download, 
  User, 
  Calendar, 
  Settings, 
  Truck, 
  RotateCw, 
  Eye, 
  HelpCircle,
  TrendingDown,
  Info,
  Share2
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { EditableImage } from './EditableImage';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface MulcherTechnicalDeliveryProps {
  modelId: string;
  modelName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MulcherTechnicalDelivery({ modelId, modelName, isOpen, onClose }: MulcherTechnicalDeliveryProps) {
  // Form state
  const [clientName, setClientName] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [mechanicName, setMechanicName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().substring(0, 10));
  const [serialNumber, setSerialNumber] = useState('');
  const [excavatorModel, setExcavatorModel] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [resolvedImages, setResolvedImages] = useState<string[]>([]);
  const [headerLogo, setHeaderLogo] = useState<string>(RODER_LOGO_BASE64);
  const [couplingImg, setCouplingImg] = useState<string>('');
  const [lubricationImg, setLubricationImg] = useState<string>('');
  const [teethC3TypesImg, setTeethC3TypesImg] = useState<string>('');
  const [wearLimitImg, setWearLimitImg] = useState<string>('');
  const [opsImg, setOpsImg] = useState<string>('');

  // Zoom state
  const [headerLogoZoom, setHeaderLogoZoom] = useState(100);
  const [couplingImgZoom, setCouplingImgZoom] = useState(100);
  const [lubricationImgZoom, setLubricationImgZoom] = useState(100);
  const [teethC3TypesImgZoom, setTeethC3TypesImgZoom] = useState(100);
  const [wearLimitImgZoom, setWearLimitImgZoom] = useState(100);
  const [opsImgZoom, setOpsImgZoom] = useState(100);

  // Auto-saves images to Firestore
  const handleImageChange = async (fileId: string, base64: string, setter: (val: string) => void, zoomVal?: number) => {
    setter(base64);
    
    const savePromise = setDoc(doc(db, 'app_files', fileId), {
      data: base64,
      zoom: zoomVal !== undefined ? zoomVal : 100,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    toast.promise(savePromise, {
      loading: 'Salvando imagem...',
      success: 'Imagem salva automaticamente!',
      error: 'Erro ao salvar imagem no banco de dados.'
    });
  };

  const handleZoomChange = async (fileId: string, zoomVal: number, setZoomState: (val: number) => void) => {
    setZoomState(zoomVal);
    try {
      await setDoc(doc(db, 'app_files', fileId), {
        zoom: zoomVal,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Error auto-saving zoom:", err);
    }
  };

  // Handles manual saving of form field changes
  const handleSaveChanges = async () => {
    const savePromise = setDoc(doc(db, 'fae_technical_delivery_form', modelId), {
      clientName,
      operatorName,
      mechanicName,
      deliveryDate,
      serialNumber,
      excavatorModel,
      technicianName,
      updatedAt: new Date().toISOString()
    });

    toast.promise(savePromise, {
      loading: 'Salvando alterações da ficha...',
      success: 'Alterações da ficha salvas com sucesso!',
      error: 'Erro ao salvar alterações da ficha.'
    });
  };

  // Copies the public shareable link to the clipboard
  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/entrega-tecnica-fae?modelId=${modelId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success("Link copiado! Envie por WhatsApp para o técnico.");
      })
      .catch(() => {
        toast.error("Erro ao copiar o link.");
      });
  };

  useEffect(() => {
    if (!isOpen || !modelId) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, modelId]);

  useEffect(() => {
    if (!isOpen || !modelId) return;

    // Fetch saved form data
    const fetchFormData = async () => {
      try {
        const snap = await getDoc(doc(db, 'fae_technical_delivery_form', modelId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.clientName) setClientName(data.clientName);
          if (data.operatorName) setOperatorName(data.operatorName);
          if (data.mechanicName) setMechanicName(data.mechanicName);
          if (data.deliveryDate) setDeliveryDate(data.deliveryDate);
          if (data.serialNumber) setSerialNumber(data.serialNumber);
          if (data.excavatorModel) setExcavatorModel(data.excavatorModel);
          if (data.technicianName) setTechnicianName(data.technicianName);
        }
      } catch (err) {
        console.error("Error fetching saved form data:", err);
      }
    };
    fetchFormData();

    // Fetch master/customized images uploaded by the user
    const fetchFile = (fileId: string) => {
      return getDoc(doc(db, 'app_files', fileId))
        .then(snap => snap.exists() ? snap.data() : null)
        .catch(() => null);
    };

    fetchFile('8CAE9I4CBrxRz1zxjkcL').then(res => { 
      if (res) {
        if (res.data) setCouplingImg(res.data); 
        if (res.zoom) setCouplingImgZoom(res.zoom);
      }
    });
    fetchFile('h8BPNDU2C2dxMSERgCot').then(res => { 
      if (res) {
        if (res.data) setLubricationImg(res.data); 
        if (res.zoom) setLubricationImgZoom(res.zoom);
      }
    });
    fetchFile('fae_header_logo').then(res => { 
      if (res) {
        if (res.data) setHeaderLogo(res.data); 
        if (res.zoom) setHeaderLogoZoom(res.zoom);
      }
    });
    fetchFile('fae_teeth_c3_types').then(res => { 
      if (res) {
        if (res.data) setTeethC3TypesImg(res.data); 
        if (res.zoom) setTeethC3TypesImgZoom(res.zoom);
      }
    });
    fetchFile('fae_wear_limit').then(res => { 
      if (res) {
        if (res.data) setWearLimitImg(res.data); 
        if (res.zoom) setWearLimitImgZoom(res.zoom);
      }
    });
    fetchFile('fae_ops_img').then(res => { 
      if (res) {
        if (res.data) setOpsImg(res.data); 
        if (res.zoom) setOpsImgZoom(res.zoom);
      }
    });

    const getModelImages = () => {
      const lowerId = modelId.toLowerCase();
      if (lowerId === 'fae-uml-ex-vt') return ['db-file://xH5C0o7qHCXgbPllI8hv', 'db-file://qtpHqn2BHOj2zaCRycbm', 'db-file://dxqB2PrQ4wcl6eUie2Zp', 'db-file://GuwOnI3DutvvG4fZn1h5', 'db-file://L8gy9gjs9CSUcIf2M6mA', 'db-file://Dwtp2CuoZNYB5bBIUzG4'];
      if (lowerId === 'fae-uml-s-ex-vt') return ['db-file://YMeLIo2amVNuUgto0c3G', 'db-file://rorAafjsU30y9P9W2g9o', 'db-file://EueQzUxvKuDIiEwQmdpK'];
      if (lowerId === 'fae-umm-ex-vt') return ['db-file://SLdlo717yZP2smStzcnJ', 'db-file://En5ZqIOVmzb1uoBm9JCn', 'db-file://tvABksEedUjzZdNWqzcr'];
      return [];
    };

    const imageIds = getModelImages();
    if (imageIds.length === 0) return;

    const promises = imageIds.map(img => {
      if (img.startsWith('db-file://')) {
        const fileId = img.replace('db-file://', '');
        return getDoc(doc(db, 'app_files', fileId))
          .then(snap => snap.exists() ? snap.data().data : '')
          .catch(() => '');
      }
      return Promise.resolve(img);
    });

    Promise.all(promises).then(results => {
      setResolvedImages(results.filter(Boolean));
    }).catch(err => {
      console.error("Error resolving technical delivery images:", err);
    });
  }, [modelId, isOpen]);

  // Page Refs for High-Fidelity PDF generation
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);

  // Dynamic preview scale for mobile devices
  const [previewScale, setPreviewScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updateScale = () => {
      if (previewContainerRef.current) {
        // We measure the container's width, subtracting padding
        const parentWidth = previewContainerRef.current.clientWidth - 32;
        if (parentWidth < 794) {
          setPreviewScale(parentWidth / 794);
        } else {
          setPreviewScale(1);
        }
      }
    };

    updateScale();
    // Use a small timeout to let the DOM settle, especially on mount/load
    const timeoutId = setTimeout(updateScale, 100);

    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateScale);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    toast.info("Iniciando geração do PDF de Entrega Técnica...", { duration: 3000 });

    try {
      // Small delay to ensure all DOM updates are processed
      await new Promise((resolve) => setTimeout(resolve, 500));

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pages = [page1Ref.current, page2Ref.current, page3Ref.current];
      
      for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i];
        if (!pageElement) continue;

        // Custom styling for pristine rendering
        const canvasDataUrl = await toPng(pageElement, {
          quality: 1.0,
          pixelRatio: 2.5, // Enhances text clarity immensely
          backgroundColor: '#ffffff',
          style: {
            transformOrigin: 'top left',
            width: '794px', // Standard pixel dimensions for A4 at 96 DPI
            height: '1123px',
          }
        });

        if (i > 0) {
          pdf.addPage();
        }

        // Add page image to PDF fitting exactly the A4 dimensions (210mm x 297mm)
        pdf.addImage(canvasDataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      }

      pdf.save(`Entrega_Tecnica_Roder_${modelName.replace(/[\/\s]/g, '_')}.pdf`);
      toast.success("Ficha de Entrega Técnica exportada com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 md:p-10">
      <div className="relative bg-slate-50 text-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Controls - Hidden during Printing */}
        <div className="bg-white border-b border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-10 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Ficha de Entrega Técnica e Instruções</h2>
              <p className="text-xs text-slate-500 font-medium">Preencha os dados abaixo e salve a ficha operacional em formato PDF A4.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyShareLink}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-200"
              title="Copiar link público para enviar ao técnico via WhatsApp"
            >
              <Share2 className="h-4 w-4 text-slate-500" /> Compartilhar Link
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10"
              title="Salvar dados preenchidos da entrega técnica"
            >
              Salvar Alterações
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/10"
            >
              {isGeneratingPdf ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" /> Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Exportar PDF A4
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-200"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Input Fields / Interactive panel (Form for Technician) - Hidden in print */}
        <div className="bg-white border-b border-slate-200 p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <User className="h-3 w-3" /> Cliente
            </label>
            <input 
              type="text" 
              placeholder="Nome do Cliente"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/45 bg-slate-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <User className="h-3 w-3" /> Operador do Cliente
            </label>
            <input 
              type="text" 
              placeholder="Nome do Operador"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/45 bg-slate-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <User className="h-3 w-3" /> Mecânico do Cliente
            </label>
            <input 
              type="text" 
              placeholder="Nome do Mecânico"
              value={mechanicName}
              onChange={(e) => setMechanicName(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/45 bg-slate-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Data de Entrega
            </label>
            <input 
              type="date" 
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/45 bg-slate-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <Settings className="h-3 w-3" /> N° Série Triturador
            </label>
            <input 
              type="text" 
              placeholder="Ex: FAE-UML-001"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/45 bg-slate-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <Truck className="h-3 w-3" /> Escavadeira Hidráulica
            </label>
            <input 
              type="text" 
              placeholder="Ex: CAT 320 / Case CX220"
              value={excavatorModel}
              onChange={(e) => setExcavatorModel(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/45 bg-slate-50"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <User className="h-3 w-3" /> Técnico Responsável Roder
            </label>
            <input 
              type="text" 
              placeholder="Nome do Técnico da Entrega"
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/45 bg-slate-50"
            />
          </div>
        </div>

        {/* Scrollable Container with exact A4 pages rendered visually */}
        <div 
          ref={previewContainerRef}
          className="p-4 md:p-8 flex-1 overflow-y-auto max-h-[650px] bg-slate-100 flex flex-col items-center gap-6 shadow-inner select-text w-full overflow-x-hidden"
        >
          
          {/* PAGE 1: Cabeçalho & Acoplamento */}
          <div 
            style={{ 
              width: `${794 * previewScale}px`, 
              height: `${1123 * previewScale}px`
            }}
            className="relative flex items-start justify-center shrink-0"
          >
            <div
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                width: '794px',
                height: '1123px',
              }}
              className="absolute top-0 left-0"
            >
              <div 
                ref={page1Ref}
                className="w-[794px] h-[1123px] bg-white text-slate-900 p-[40px] shadow-lg flex flex-col justify-between overflow-hidden border border-slate-200 select-text"
                style={{ 
                  boxSizing: 'border-box'
                }}
              >
            {/* Background watermark/design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            
            <div className="flex flex-col flex-1">
              {/* Header block */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-[180px] h-[65px] flex items-center justify-center">
                    <EditableImage 
                      src={headerLogo || RODER_LOGO_BASE64} 
                      onChange={(base64) => handleImageChange('fae_header_logo', base64, setHeaderLogo, headerLogoZoom)} 
                      zoom={headerLogoZoom}
                      onZoomChange={(zoom) => handleZoomChange('fae_header_logo', zoom, setHeaderLogoZoom)}
                      alt="Roder Logo"
                      maxHeightClass="max-h-[55px]"
                      aspectRatioClass="w-full h-full border border-dashed border-slate-300 rounded-lg hover:border-primary/50 bg-slate-50/50 p-1.5 shadow-sm min-h-0"
                      outerMinHeightClass="min-h-0"
                      innerMinHeightClass="min-h-0"
                    />
                  </div>
                  <div className="h-8 w-[1px] bg-slate-200"></div>
                  <div>
                    <span className="text-[8px] tracking-[0.2em] font-black uppercase text-slate-400 block">ENTREGA TÉCNICA</span>
                    <span className="text-sm font-black text-slate-900 tracking-tight">MANUAL DE INSTRUÇÕES</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-slate-900 text-white px-2.5 py-1 rounded-md font-black uppercase tracking-wider text-[9px]">REGISTRO DE INSTRUÇÕES</span>
                  <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Trituradores Florestais FAE</p>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center my-6">
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Ficha de Entrega Técnica e Instruções Operacionais</h1>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Modelos de Trituradores FAE: <span className="text-primary font-black">UML/EX/VT, UML/S/EX/VT, UMM/EX/VT</span>
                </p>
              </div>

              {/* General Technical Information Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
                <div className="bg-slate-100 text-[10px] font-black uppercase text-slate-700 px-3.5 py-1.5 border-b border-slate-300 tracking-wider">
                  Dados Gerais da Entrega Técnica
                </div>
                <div className="grid grid-cols-2 text-xs">
                  <div className="p-2.5 border-r border-b border-slate-200">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Cliente:</span>
                    <span className="font-extrabold text-slate-800 uppercase block truncate h-4">{clientName || '__________________________'}</span>
                  </div>
                  <div className="p-2.5 border-b border-slate-200">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Operador Treinado:</span>
                    <span className="font-extrabold text-slate-800 uppercase block truncate h-4">{operatorName || '__________________________'}</span>
                  </div>
                  <div className="p-2.5 border-r border-slate-200">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Mecânico Treinado:</span>
                    <span className="font-extrabold text-slate-800 uppercase block truncate h-4">{mechanicName || '__________________________'}</span>
                  </div>
                  <div className="p-2.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Data da Entrega Técnica:</span>
                    <span className="font-extrabold text-slate-800 block truncate h-4">
                      {deliveryDate ? new Date(deliveryDate + 'T12:00:00').toLocaleDateString('pt-BR') : '____/____/______'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 text-xs border-t border-slate-200 bg-slate-50">
                  <div className="p-2.5 border-r border-slate-200">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">N° Série Triturador:</span>
                    <span className="font-extrabold text-slate-800 uppercase block truncate h-4">{serialNumber || '__________________________'}</span>
                  </div>
                  <div className="p-2.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Escavadeira Hidráulica:</span>
                    <span className="font-extrabold text-slate-800 uppercase block truncate h-4">{excavatorModel || '__________________________'}</span>
                  </div>
                </div>
                <div className="bg-slate-100/60 p-2.5 text-xs border-t border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Técnico Roder Responsável:</span>
                  <span className="font-extrabold text-slate-800 uppercase block truncate h-4">{technicianName || '__________________________'}</span>
                </div>
              </div>

              {/* SECTION 1: COUPLING PROCEDURES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1.5">
                  <Wrench className="h-4.5 w-4.5 text-primary" />
                  <h2 className="text-[13px] font-bold uppercase text-slate-900 tracking-tight">
                    1. Esquema de Acoplamento Mecânico e Hidráulico na Escavadeira
                  </h2>
                </div>

                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-7 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Siga rigorosamente as instruções abaixo para garantir o correto funcionamento mecânico e vazão de fluxo hidráulico ideal ao triturador florestal.
                    </p>

                    {/* Steps vertically stacked for better fit */}
                    <div className="space-y-2.5">
                      <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">01</div>
                        <div>
                          <h4 className="text-[10.5px] font-bold uppercase text-slate-800 tracking-tight">Acoplamento Físico</h4>
                          <p className="text-[9.5px] text-slate-500 leading-relaxed">
                            Utilize os <strong className="text-slate-800 font-bold">2 pinos originais</strong> do sistema de engate da concha da escavadeira hidráulica para fixar com segurança a estrutura do triturador florestal.
                          </p>
                        </div>
                      </div>
                      <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">02</div>
                        <div>
                          <h4 className="text-[10.5px] font-bold uppercase text-slate-800 tracking-tight">Conexão do Sistema</h4>
                          <p className="text-[9.5px] text-slate-500 leading-relaxed">
                            Conecte firmemente as <strong className="text-slate-800 font-bold">mangueiras hidráulicas</strong> de pressão e de retorno às conexões rápidas. Em seguida, conecte com atenção o <strong className="text-slate-800 font-bold">chicote elétrico</strong> da máquina.
                          </p>
                        </div>
                      </div>
                      <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">03</div>
                        <div>
                          <h4 className="text-[10.5px] font-bold uppercase text-slate-800 tracking-tight">Liberação de Fluxo</h4>
                          <p className="text-[9.5px] text-slate-500 leading-relaxed">
                            Abra totalmente o <strong className="text-slate-800 font-bold">registro da linha hidráulica</strong> na posição de fluxo máximo (indicado pela marcação de seta) para liberar o curso completo do óleo hidráulico.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-5 flex flex-col justify-between">
                    <EditableImage 
                      src={couplingImg || resolvedImages[0]} 
                      onChange={(base64) => handleImageChange('8CAE9I4CBrxRz1zxjkcL', base64, setCouplingImg, couplingImgZoom)} 
                      zoom={couplingImgZoom}
                      onZoomChange={(zoom) => handleZoomChange('8CAE9I4CBrxRz1zxjkcL', zoom, setCouplingImgZoom)}
                      alt="Acoplamento Triturador"
                      maxHeightClass="max-h-[180px]"
                      aspectRatioClass="w-full"
                      outerMinHeightClass="min-h-[190px]"
                      innerMinHeightClass="min-h-[170px]"
                    />
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 block text-center">EQUIPAMENTO MULTIPLICADOR RODER</span>
                  </div>
                </div>

                {/* Attention and Uncoupling Notes */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="border-l-4 border-amber-500 bg-amber-500/5 p-3 rounded-r-xl">
                    <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Atenção de Operação Hidráulica
                    </span>
                    <p className="text-[9.5px] text-slate-600 leading-relaxed mt-1">
                      Antes de dar partida na escavadeira hidráulica, certifique-se de que os engates das mangueiras estejam 100% encaixados para prevenir qualquer restrição ou vazamentos, e <strong>nunca se esqueça de abrir totalmente o registro hidráulico</strong>.
                    </p>
                  </div>

                  <div className="border-l-4 border-slate-900 bg-slate-50 p-3 rounded-r-xl">
                    <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" /> Notas Importantes de Desacoplamento
                    </span>
                    <ul className="text-[9px] text-slate-500 leading-relaxed mt-1 list-disc pl-3.5 space-y-1">
                      <li>Para desacoplar o Triturador e colocar novamente a concha tradicional da escavadeira, execute rigorosamente o <strong>reverso do procedimento</strong> (do passo 3 ao 1).</li>
                      <li>Na retirada das linhas, é obrigatório rosquear os <strong>tampões de vedação</strong> nas mangueiras e no chicote elétrico (estão armazenados na cabine) para impossibilitar a entrada de contaminantes no circuito.</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer with branding & page counter */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Roder Máquinas e Equipamentos Ltda.</span>
              <span>Página 1 de 3</span>
            </div>
          </div>
          </div>
        </div>


          {/* PAGE 2: Manutenção de Ferramentas & Lubrificação */}
          <div 
            style={{ 
              width: `${794 * previewScale}px`, 
              height: `${1123 * previewScale}px`
            }}
            className="relative flex items-start justify-center shrink-0"
          >
            <div
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                width: '794px',
                height: '1123px',
              }}
              className="absolute top-0 left-0"
            >
              <div 
                ref={page2Ref}
                className="w-[794px] h-[1123px] bg-white text-slate-900 p-[40px] shadow-lg flex flex-col justify-between overflow-hidden border border-slate-200 select-text"
                style={{ 
                  boxSizing: 'border-box'
                }}
              >
            <div className="flex flex-col flex-1">
              
              {/* SECTION 2: LUBRICATION & DAILY CARE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1.5">
                  <Clock className="h-4.5 w-4.5 text-primary" />
                  <h2 className="text-base font-bold uppercase text-slate-900 tracking-tight">
                    2. Lubrificação e Rotina de Cuidados Diários
                  </h2>
                </div>

                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-8 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                      A durabilidade mecânica dos rolamentos e componentes rotativos está diretamente ligada à rigidez do cronograma de lubrificação periódica.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-primary tracking-wider block">Rotor</span>
                          <h4 className="text-xs md:text-sm font-bold text-slate-800 tracking-tight mb-1">Rolamentos (Cada 8h)</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Utilize <strong className="text-slate-800 font-bold">Graxa de Alta Performance</strong> nos 2 pontos específicos do rotor a cada 8 horas de operação contínua.
                          </p>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-primary tracking-wider block">Acoplamento</span>
                          <h4 className="text-xs md:text-sm font-bold text-slate-800 tracking-tight mb-1">Pinos e Articulações</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Sempre que realizar a lubrificação geral do Triturador, <strong className="text-slate-800 font-bold">lubrifique com graxa os pinos de fixação</strong> articulados.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4">
                    <EditableImage 
                      src={lubricationImg || resolvedImages[3] || resolvedImages[2]} 
                      onChange={(base64) => handleImageChange('h8BPNDU2C2dxMSERgCot', base64, setLubricationImg, lubricationImgZoom)} 
                      zoom={lubricationImgZoom}
                      onZoomChange={(zoom) => handleZoomChange('h8BPNDU2C2dxMSERgCot', zoom, setLubricationImgZoom)}
                      alt="Pontos de Lubrificação"
                      maxHeightClass="max-h-[140px]"
                      aspectRatioClass="w-full"
                      outerMinHeightClass="min-h-[160px]"
                      innerMinHeightClass="min-h-[140px]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: CARBIDE TEETH (DENTES DE VÍDIA) MAINTENANCE */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1.5">
                  <Settings className="h-4.5 w-4.5 text-primary" />
                  <h2 className="text-base font-bold uppercase text-slate-900 tracking-tight">
                    3. Manutenção das Ferramentas (Dentes) de Vídia e Limite de Desgaste
                  </h2>
                </div>

                <div className="grid grid-cols-12 gap-5 mt-2">
                  
                  {/* Left Column - General Rules & Life span */}
                  <div className="col-span-6 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                      O rotor dos modelos FAE conta com ferramentas fixas reforçadas de Vídea para cortes de alta resistência. Siga as orientações:
                    </p>

                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5 shadow-sm">
                      <span className="text-xs font-bold uppercase text-slate-800 block border-b border-slate-200 pb-1">Inspeção Diária Pré-Operação</span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Diariamente, antes de iniciar o turno, verifique visualmente se todas as ferramentas estão devidamente posicionadas no lugar e se não há dentes quebrados ou soltos.
                      </p>
                      <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold leading-relaxed shadow-sm">
                        AVISO CRÍTICO: Dentes quebrados ou ausentes causam desbalanceamento dinâmico severo no rotor do triturador, gerando forte vibração que destrói rolamentos, mancais e a carcaça. Substitua imediatamente ferramentas avariadas!
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 shadow-sm space-y-2">
                      <span className="text-xs font-bold uppercase text-slate-800 block border-b border-slate-200 pb-1">Durabilidade Estrita pelo Tipo de Solo</span>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        A vida útil da ferramenta de vídia depende imensamente da <strong>abrasividade do solo</strong> onde atua, muito mais do que da rigidez da própria madeira a ser triturada.
                      </p>
                      <div className="grid grid-cols-2 gap-3.5 mt-2 text-xs">
                        <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-lg">
                          <span className="font-bold text-amber-600 block">Solo Arenoso</span>
                          <span className="text-[10.5px] text-slate-500 block leading-tight mt-0.5">Substituição completa em até <strong>200 horas</strong>.</span>
                        </div>
                        <div className="bg-green-500/5 border border-green-500/20 p-3 rounded-lg">
                          <span className="font-bold text-green-600 block">Solo Argiloso</span>
                          <span className="text-[10.5px] text-slate-500 block leading-tight mt-0.5">Trabalha com segurança até <strong>700 horas</strong>.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Tooth Types (with auto-saving C3 upload) & Wear limits (with auto-saving wear limit upload) */}
                  <div className="col-span-6 space-y-4">
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 shadow-sm space-y-3">
                      <span className="text-xs font-bold uppercase text-slate-800 block border-b border-slate-200 pb-1">Tipos de Ferramentas no Rotor</span>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                          <div>
                            <span className="font-bold text-slate-800 block">Dente Central BSD (C/3 BSD)</span>
                            <span className="text-slate-500 text-[11px]">Múltiplas ferramentas centrais</span>
                          </div>
                          <span className="text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">6000.2010.0001</span>
                        </div>
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                          <div>
                            <span className="font-bold text-slate-800 block">Dente Lateral Esquerdo (C/3)</span>
                            <span className="text-slate-500 text-[11px]">02 peças nas extremidades</span>
                          </div>
                          <span className="text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">6000.2001.0018</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-800 block">Dente Lateral Direito (C/3)</span>
                            <span className="text-slate-500 text-[11px]">02 peças nas extremidades</span>
                          </div>
                          <span className="text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">6000.2001.0017</span>
                        </div>
                      </div>

                      {/* Upload area for the 3 C3 tools image (Central and two lateral ones) inside this card */}
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5 text-center">Foto dos 3 Dentes de Vídia C3 (Central e Laterais)</span>
                        <EditableImage 
                          src={teethC3TypesImg} 
                          onChange={(base64) => handleImageChange('fae_teeth_c3_types', base64, setTeethC3TypesImg, teethC3TypesImgZoom)} 
                          zoom={teethC3TypesImgZoom}
                          onZoomChange={(zoom) => handleZoomChange('fae_teeth_c3_types', zoom, setTeethC3TypesImgZoom)}
                          alt="Três dentes de vídea C3"
                          maxHeightClass="max-h-[120px]"
                          aspectRatioClass="w-full"
                          outerMinHeightClass="min-h-[135px]"
                          innerMinHeightClass="min-h-[115px]"
                        />
                      </div>
                    </div>

                    {/* Desgaste card with explanation and upload slot */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 shadow-sm space-y-3">
                      <div>
                        <span className="text-xs font-bold uppercase text-slate-800 block border-b border-slate-200 pb-1 mb-1.5">Limite de Desgaste das Ferramentas</span>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          O limite de desbaste se dá exatamente ao final da ponta triangular desenhada atrás da vídia.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5 text-center">Foto do Limite de Desgaste da Ferramenta</span>
                        <EditableImage 
                          src={wearLimitImg} 
                          onChange={(base64) => handleImageChange('fae_wear_limit', base64, setWearLimitImg, wearLimitImgZoom)} 
                          zoom={wearLimitImgZoom}
                          onZoomChange={(zoom) => handleZoomChange('fae_wear_limit', zoom, setWearLimitImgZoom)}
                          alt="Limite de desgaste da ferramenta"
                          maxHeightClass="max-h-[120px]"
                          aspectRatioClass="w-full"
                          outerMinHeightClass="min-h-[135px]"
                          innerMinHeightClass="min-h-[115px]"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Roder Máquinas e Equipamentos Ltda.</span>
              <span>Página 2 de 3</span>
            </div>
          </div>
          </div>
        </div>


          {/* PAGE 3: Instruções Operacionais & Assinaturas */}
          <div 
            style={{ 
              width: `${794 * previewScale}px`, 
              height: `${1123 * previewScale}px`
            }}
            className="relative flex items-start justify-center shrink-0"
          >
            <div
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                width: '794px',
                height: '1123px',
              }}
              className="absolute top-0 left-0"
            >
              <div 
                ref={page3Ref}
                className="w-[794px] h-[1123px] bg-white text-slate-900 p-[40px] shadow-lg flex flex-col justify-between overflow-hidden border border-slate-200 select-text"
                style={{ 
                  boxSizing: 'border-box'
                }}
              >
            <div className="flex flex-col flex-1">
              
              {/* SECTION 4: OPERATIONAL INSTRUCTIONS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1.5">
                  <RotateCw className="h-4.5 w-4.5 text-primary" />
                  <h2 className="text-base font-bold uppercase text-slate-900 tracking-tight">
                    4. Diretrizes Operacionais e Técnicas de Condução em Trabalho
                  </h2>
                </div>

                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-8 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                      A operação correta do triturador florestal no campo previne o superaquecimento do óleo, maximiza a vida útil do rotor e potencializa o rendimento.
                    </p>

                    <div className="space-y-3.5 text-sm">
                      <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex gap-3 shadow-sm">
                        <div className="bg-slate-900 text-white rounded-lg h-6 w-6 flex items-center justify-center font-bold shrink-0 text-xs shadow-sm">A</div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-tight">Giro da Escavadeira</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                            Mantenha a movimentação de giro horizontal da escavadeira sempre constante e suave.
                          </p>
                        </div>
                      </div>

                      <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex gap-3 shadow-sm">
                        <div className="bg-slate-900 text-white rounded-lg h-6 w-6 flex items-center justify-center font-bold shrink-0 text-xs shadow-sm">B</div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-tight">Trabalho Vertical</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                            Para árvores na vertical, desça de forma controlada. Levante levemente se a rotação cair.
                          </p>
                        </div>
                      </div>

                      <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex gap-3 shadow-sm">
                        <div className="bg-slate-900 text-white rounded-lg h-6 w-6 flex items-center justify-center font-bold shrink-0 text-xs shadow-sm">C</div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-tight">Rebaixamento de Tocos</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                            Não desça diretamente no centro. Trabalhe, ralando, a superfície no toco lateralmente, passando por cima do toco, retirando de 5 a 10 centímetros por passada.
                          </p>
                        </div>
                      </div>

                      <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex gap-3 shadow-sm">
                        <div className="bg-slate-900 text-white rounded-lg h-6 w-6 flex items-center justify-center font-bold shrink-0 text-xs shadow-sm">D</div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-tight">Sensibilidade no Painel</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                            Cada escavadeira possui vazão diferente. Sinta as reações do conjunto nas primeiras horas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4 flex flex-col justify-between">
                    <EditableImage 
                      src={opsImg || resolvedImages[2] || resolvedImages[0]} 
                      onChange={(base64) => handleImageChange('fae_ops_img', base64, setOpsImg, opsImgZoom)} 
                      zoom={opsImgZoom}
                      onZoomChange={(zoom) => handleZoomChange('fae_ops_img', zoom, setOpsImgZoom)}
                      alt="Instruções Operacionais"
                      maxHeightClass="max-h-[250px]"
                      aspectRatioClass="w-full"
                      outerMinHeightClass="min-h-[260px]"
                      innerMinHeightClass="min-h-[240px]"
                    />
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 block text-center">SEGURANÇA EM PRIMEIRO LUGAR</span>
                  </div>
                </div>
              </div>

              {/* SECTION 5: SIGNATURES AND COMPLIANCE */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1.5">
                  <CheckCircle className="h-4.5 w-4.5 text-primary" />
                  <h2 className="text-base font-bold uppercase text-slate-900 tracking-tight">
                    5. Termo de Instrução Técnica e Assinaturas de Conformidade
                  </h2>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Declaro para os devidos fins que o equipamento Roder listado na página 1 foi entregue em perfeitas condições operacionais, tendo o operador e o mecânico do cliente recebido todo o treinamento técnico presencial referente ao acoplamento hidráulico, lubrificação diária, inspeção e substituição periódica de ferramentas e diretrizes operacionais em campo.
                </p>

                <div className="grid grid-cols-3 gap-6 pt-12 text-sm">
                  <div className="text-center flex flex-col items-center justify-between">
                    <div className="w-full border-b border-slate-400 pb-1.5 h-6 text-xs font-bold text-slate-800 uppercase truncate">
                      {clientName || ''}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 mt-2 block">CLIENTE / RESPONSÁVEL</span>
                  </div>

                  <div className="text-center flex flex-col items-center justify-between">
                    <div className="w-full border-b border-slate-400 pb-1.5 h-6 text-xs font-bold text-slate-800 uppercase truncate">
                      {operatorName || ''}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 mt-2 block">OPERADOR TREINADO</span>
                  </div>

                  <div className="text-center flex flex-col items-center justify-between">
                    <div className="w-full border-b border-slate-400 pb-1.5 h-6 text-xs font-bold text-slate-800 uppercase truncate">
                      {technicianName || ''}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 mt-2 block">TÉCNICO RODER</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Roder Máquinas e Equipamentos Ltda.</span>
              <span>Página 3 de 3</span>
            </div>
          </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
