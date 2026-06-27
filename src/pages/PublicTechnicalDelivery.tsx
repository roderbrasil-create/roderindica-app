import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { 
  FileText, 
  Wrench, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Download, 
  User, 
  Calendar, 
  Settings, 
  Truck, 
  RotateCw, 
  Info,
  ChevronRight,
  Send,
  PhoneCall,
  Check
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from '../components/catalog/RoderLogo';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
  title: string;
}

function SignaturePad({ onSave, onClose, title }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Clear canvas and fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">{title}</h3>
        <p className="text-xs text-slate-500 mb-4">Assine com o dedo ou caneta no espaço branco abaixo.</p>
        
        <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner">
          <canvas
            ref={canvasRef}
            width={450}
            height={200}
            className="w-full h-[200px] cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            Limpar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ml-auto"
          >
            Cancelar
          </button>
          <button
            onClick={saveSignature}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/15"
          >
            Confirmar Assinatura
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicTechnicalDelivery() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Model logic
  const initialModelId = searchParams.get('modelId') || 'fae-uml-ex-vt';
  const [selectedModelId, setSelectedModelId] = useState(initialModelId);
  const [modelName, setModelName] = useState('FAE UML/EX/VT');

  // Form states
  const [clientName, setClientName] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [mechanicName, setMechanicName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().substring(0, 10));
  const [serialNumber, setSerialNumber] = useState('');
  const [excavatorModel, setExcavatorModel] = useState('');
  const [technicianName, setTechnicianName] = useState('');

  // Signature states (base64 image URLs)
  const [clientSig, setClientSig] = useState('');
  const [operatorSig, setOperatorSig] = useState('');
  const [technicianSig, setTechnicianSig] = useState('');

  // Active signing pad target
  const [activeSigPad, setActiveSigPad] = useState<'client' | 'operator' | 'technician' | null>(null);

  // Layout image states (loaded matching master adjustments)
  const [resolvedImages, setResolvedImages] = useState<string[]>([]);
  const [headerLogo, setHeaderLogo] = useState<string>(RODER_LOGO_BASE64);
  const [couplingImg, setCouplingImg] = useState<string>('');
  const [lubricationImg, setLubricationImg] = useState<string>('');
  const [teethC3TypesImg, setTeethC3TypesImg] = useState<string>('');
  const [wearLimitImg, setWearLimitImg] = useState<string>('');
  const [opsImg, setOpsImg] = useState<string>('');

  // Zoom values mapping to administration overrides
  const [headerLogoZoom, setHeaderLogoZoom] = useState(100);
  const [couplingImgZoom, setCouplingImgZoom] = useState(100);
  const [lubricationImgZoom, setLubricationImgZoom] = useState(100);
  const [teethC3TypesImgZoom, setTeethC3TypesImgZoom] = useState(100);
  const [wearLimitImgZoom, setWearLimitImgZoom] = useState(100);
  const [opsImgZoom, setOpsImgZoom] = useState(100);

  // Progress/Status dialog
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendStatusMsg, setSendStatusMsg] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedPdfBase64, setGeneratedPdfBase64] = useState('');
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);

  // Document page refs for high-quality generation
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);

  // Map model name based on modelId selector
  useEffect(() => {
    const lid = selectedModelId.toLowerCase();
    if (lid === 'fae-uml-ex-vt') setModelName('FAE UML/EX/VT');
    else if (lid === 'fae-uml-s-ex-vt') setModelName('FAE UML/S/EX/VT');
    else if (lid === 'fae-umm-ex-vt') setModelName('FAE UMM/EX/VT');
  }, [selectedModelId]);

  // Load resources and zoom override mappings matching MulcherTechnicalDelivery
  useEffect(() => {
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

    // Resolve model specific template lines
    const getModelImages = () => {
      const lowerId = selectedModelId.toLowerCase();
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
  }, [selectedModelId]);

  // Save / Submit Ficha process
  const handleSubmitFicha = async () => {
    // Basic validation
    if (!clientName.trim()) {
      toast.warning('Por favor, preencha o Nome do Cliente.');
      return;
    }
    if (!serialNumber.trim()) {
      toast.warning('Por favor, digite o N° de Série do Triturador.');
      return;
    }
    if (!technicianName.trim()) {
      toast.warning('Por favor, preencha o Nome do Técnico Responsável.');
      return;
    }
    if (!clientSig && !operatorSig && !technicianSig) {
      toast.warning('Por favor, colete as assinaturas de conformidade na página 3.');
      return;
    }

    setIsSending(true);
    setSendProgress(10);
    setSendStatusMsg('Iniciando conformidade...');

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSendProgress(25);
      setSendStatusMsg('Renderizando páginas A4 de alta fidelidade...');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pages = [page1Ref.current, page2Ref.current, page3Ref.current];
      
      for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i];
        if (!pageElement) continue;

        const canvasDataUrl = await toPng(pageElement, {
          quality: 1.0,
          pixelRatio: 2.5, // Crisp rendering for printing/viewing on phones
          backgroundColor: '#ffffff',
          style: {
            transformOrigin: 'top left',
            width: '794px',
            height: '1123px',
          }
        });

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(canvasDataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      }

      setSendProgress(60);
      setSendStatusMsg('Empacotando documento PDF...');

      // Convert PDF to base64 for attachment
      const pdfBase64 = pdf.output('datauristring');
      const rawBase64 = pdfBase64.split(';base64,')[1];
      setGeneratedPdfBase64(pdfBase64);
      setGeneratedPdfBlob(pdf.output('blob'));

      setSendProgress(75);
      setSendStatusMsg('Transmitindo ficha de conformidade para a Roder...');

      // Post to the backend send-email endpoint
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: 'suporte@roderbrasil.com.br, jeferson@roderbrasil.com.br',
          subject: `Ficha de Entrega Técnica - FAE - Cliente: ${clientName.toUpperCase()} | Série: ${serialNumber}`,
          html: `
            <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
              <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">Ficha de Entrega Técnica Coletada em Campo</h2>
              <p>Uma nova entrega técnica de Triturador Florestal FAE foi preenchida e assinada com sucesso pelo técnico responsável.</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="background: #f8fafc;">
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Cliente:</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${clientName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Modelo:</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${modelName}</td>
                </tr>
                <tr style="background: #f8fafc;">
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">N° de Série:</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${serialNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Escavadeira:</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${excavatorModel || 'Não informada'}</td>
                </tr>
                <tr style="background: #f8fafc;">
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Técnico Roder:</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${technicianName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Data de Entrega:</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${new Date(deliveryDate + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                </tr>
              </table>
              <p style="margin-top: 20px; font-size: 11px; color: #64748b;">A Ficha de Entrega Técnica assinada e diagramada em formato oficial de alta resolução está anexada a este e-mail.</p>
            </div>
          `,
          replyTo: 'suporte@roderbrasil.com.br',
          fromName: 'Ficha de Entrega Campo',
          attachments: [
            {
              filename: `Ficha_Entrega_Roder_${serialNumber || 'FAE'}.pdf`,
              content: rawBase64,
              contentType: 'application/pdf'
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Falha no envio do e-mail de conformidade.');
      }

      setSendProgress(100);
      setSendStatusMsg('Ficha de entrega transmitida com sucesso!');
      await new Promise(resolve => setTimeout(resolve, 600));

      setIsSending(false);
      setShowSuccessModal(true);
      toast.success('Entrega técnica salva e transmitida com sucesso!');
    } catch (err: any) {
      console.error(err);
      setIsSending(false);
      toast.error('Erro ao enviar a ficha: ' + err.message);
    }
  };

  // Triggers local download of the generated PDF
  const handleLocalDownload = () => {
    if (!generatedPdfBlob) return;
    const url = window.URL.createObjectURL(generatedPdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Entrega_Tecnica_Roder_${serialNumber || 'FAE'}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('PDF baixado com sucesso!');
  };

  // Triggers sharing via WhatsApp
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Olá! A Ficha de Entrega Técnica e Instruções Operacionais do Triturador FAE de Série: ${serialNumber} realizada em ${new Date(deliveryDate + 'T12:00:00').toLocaleDateString('pt-BR')} foi salva e transmitida com sucesso para a Roder Máquinas.`);
    const url = `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Dynamic Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-5 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={RODER_LOGO_BASE64} alt="Roder Logo" className="h-9 brightness-110" />
            <div className="h-6 w-[1px] bg-slate-700"></div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase text-amber-500">RODER FIELD COMPLIANCE</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Entrega Técnica em Campo</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Modelo:</span>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs font-black text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="fae-uml-ex-vt">FAE UML/EX/VT</option>
                <option value="fae-uml-s-ex-vt">FAE UML/S/EX/VT</option>
                <option value="fae-umm-ex-vt">FAE UMM/EX/VT</option>
              </select>
            </div>

            <button
              onClick={handleSubmitFicha}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all w-full sm:w-auto"
            >
              <Send className="h-4 w-4" /> Enviar e-mail para Roder
            </button>
          </div>
        </div>
      </header>

      {/* Main content body */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Touch Inputs for mobile technicians in the field */}
        <section className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
              <FileText className="h-4 w-4" />
            </span>
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">Preenchimento Técnico</h3>
          </div>

          <div className="space-y-4 text-xs font-medium">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <User className="h-3 w-3 text-amber-500" /> Cliente
              </label>
              <input
                type="text"
                placeholder="Nome do Cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <User className="h-3 w-3 text-amber-500" /> Operador Treinado
              </label>
              <input
                type="text"
                placeholder="Nome do Operador"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <User className="h-3 w-3 text-amber-500" /> Mecânico Treinado
              </label>
              <input
                type="text"
                placeholder="Nome do Mecânico"
                value={mechanicName}
                onChange={(e) => setMechanicName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3 text-amber-500" /> Data de Entrega
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Settings className="h-3 w-3 text-amber-500" /> N° Série Triturador
              </label>
              <input
                type="text"
                placeholder="Ex: FAE-UML-001"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Truck className="h-3 w-3 text-amber-500" /> Escavadeira Hidráulica
              </label>
              <input
                type="text"
                placeholder="Ex: CAT 320 / Case CX220"
                value={excavatorModel}
                onChange={(e) => setExcavatorModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <User className="h-3 w-3 text-amber-500" /> Técnico Roder Responsável
              </label>
              <input
                type="text"
                placeholder="Nome do Técnico"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          {/* Quick signature links */}
          <div className="pt-4 border-t border-slate-800 text-xs">
            <span className="text-[10px] uppercase text-slate-400 font-bold block mb-3">Colete as Assinaturas</span>
            <div className="space-y-2.5">
              <button
                onClick={() => setActiveSigPad('client')}
                className={`w-full py-3 px-4 border rounded-xl flex items-center justify-between transition-all ${
                  clientSig ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300'
                }`}
              >
                <span>Responsável Cliente</span>
                {clientSig ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setActiveSigPad('operator')}
                className={`w-full py-3 px-4 border rounded-xl flex items-center justify-between transition-all ${
                  operatorSig ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300'
                }`}
              >
                <span>Operador Treinado</span>
                {operatorSig ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setActiveSigPad('technician')}
                className={`w-full py-3 px-4 border rounded-xl flex items-center justify-between transition-all ${
                  technicianSig ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300'
                }`}
              >
                <span>Técnico Roder</span>
                {technicianSig ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </section>

        {/* Right Side: A4 visual layout previews (Continuous flow) */}
        <section className="lg:col-span-8 flex flex-col items-center gap-8 overflow-x-auto bg-slate-950 p-4 rounded-3xl border border-slate-800/60 shadow-inner">
          
          <div className="text-center py-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-800">
              PRÉ-VISUALIZAÇÃO DE CONFORMIDADE A4
            </span>
          </div>

          {/* PAGE 1 */}
          <div 
            ref={page1Ref}
            className="w-[794px] h-[1123px] bg-white text-slate-900 p-[40px] relative flex flex-col justify-between overflow-hidden shrink-0 shadow-2xl select-text"
            style={{ boxSizing: 'border-box' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            
            <div className="flex flex-col flex-1">
              
              {/* Header block */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-[180px] h-[65px] flex items-center justify-center">
                    <img 
                      src={headerLogo} 
                      alt="Roder Logo"
                      style={{ transform: `scale(${headerLogoZoom / 100})`, transformOrigin: 'center' }}
                      className="max-h-[55px] max-w-full object-contain"
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
                  <h2 className="text-[13px] font-black uppercase text-slate-900 tracking-tight">
                    1. Esquema de Acoplamento Mecânico e Hidráulico na Escavadeira
                  </h2>
                </div>

                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-7 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Siga rigorosamente as instruções abaixo para garantir o correto funcionamento mecânico e vazão de fluxo hidráulico ideal ao triturador florestal.
                    </p>

                    <div className="space-y-2.5">
                      <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm">01</div>
                        <div>
                          <h4 className="text-[10.5px] font-black uppercase text-slate-800 tracking-tight">Acoplamento Físico</h4>
                          <p className="text-[9.5px] text-slate-500 leading-relaxed">
                            Utilize os <strong className="text-slate-800 font-extrabold">2 pinos originais</strong> do sistema de engate da concha da escavadeira hidráulica para fixar com segurança a estrutura do triturador florestal.
                          </p>
                        </div>
                      </div>
                      <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm">02</div>
                        <div>
                          <h4 className="text-[10.5px] font-black uppercase text-slate-800 tracking-tight">Conexão do Sistema</h4>
                          <p className="text-[9.5px] text-slate-500 leading-relaxed">
                            Conecte firmemente as <strong className="text-slate-800 font-extrabold">mangueiras hidráulicas</strong> de pressão e de retorno às conexões rápidas. Em seguida, conecte com atenção o <strong className="text-slate-800 font-extrabold">chicote elétrico</strong> da máquina.
                          </p>
                        </div>
                      </div>
                      <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm">03</div>
                        <div>
                          <h4 className="text-[10.5px] font-black uppercase text-slate-800 tracking-tight">Liberação de Fluxo</h4>
                          <p className="text-[9.5px] text-slate-500 leading-relaxed">
                            Abra totalmente o <strong className="text-slate-800 font-extrabold">registro da linha hidráulica</strong> na posição de fluxo máximo (indicado pela marcação de seta) para liberar o curso completo do óleo hidráulico.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-5 flex flex-col justify-between overflow-hidden">
                    <div className="w-full flex items-center justify-center overflow-hidden bg-white border border-slate-200 rounded-xl h-[180px]">
                      {couplingImg || resolvedImages[0] ? (
                        <img 
                          src={couplingImg || resolvedImages[0]} 
                          alt="Acoplamento" 
                          style={{ transform: `scale(${couplingImgZoom / 100})`, transformOrigin: 'center' }}
                          className="max-h-[170px] max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Carregando esquema...</span>
                      )}
                    </div>
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider mt-1.5 block text-center">EQUIPAMENTO MULTIPLICADOR RODER</span>
                  </div>
                </div>

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

            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Roder Máquinas e Equipamentos Ltda.</span>
              <span>Página 1 de 3</span>
            </div>
          </div>

          {/* PAGE 2 */}
          <div 
            ref={page2Ref}
            className="w-[794px] h-[1123px] bg-white text-slate-900 p-[40px] relative flex flex-col justify-between overflow-hidden shrink-0 shadow-2xl select-text"
            style={{ boxSizing: 'border-box' }}
          >
            <div className="flex flex-col flex-1">
              
              {/* SECTION 2: LUBRICATION & DAILY CARE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1.5">
                  <Clock className="h-4.5 w-4.5 text-primary" />
                  <h2 className="text-base font-black uppercase text-slate-900 tracking-tight">
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
                          <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Rotor</span>
                          <h4 className="text-xs md:text-sm font-black text-slate-800 tracking-tight mb-1">Rolamentos (Cada 8h)</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Utilize <strong className="text-slate-800 font-extrabold">Graxa de Alta Performance</strong> nos 2 pontos específicos do rotor a cada 8 horas de operação contínua.
                          </p>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Acoplamento</span>
                          <h4 className="text-xs md:text-sm font-black text-slate-800 tracking-tight mb-1">Pinos e Articulações</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Sempre que realizar a lubrificação geral do Triturador, <strong className="text-slate-800 font-extrabold">lubrifique com graxa os pinos de fixação</strong> articulados.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4 overflow-hidden">
                    <div className="w-full flex items-center justify-center overflow-hidden bg-white border border-slate-200 rounded-xl h-[140px]">
                      {lubricationImg || resolvedImages[3] || resolvedImages[2] ? (
                        <img 
                          src={lubricationImg || resolvedImages[3] || resolvedImages[2]} 
                          alt="Lubrificação" 
                          style={{ transform: `scale(${lubricationImgZoom / 100})`, transformOrigin: 'center' }}
                          className="max-h-[130px] max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Carregando lubrificação...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: CARBIDE TEETH */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1.5">
                  <Settings className="h-4.5 w-4.5 text-primary" />
                  <h2 className="text-base font-black uppercase text-slate-900 tracking-tight">
                    3. Manutenção das Ferramentas (Dentes) de Vídia e Limite de Desgaste
                  </h2>
                </div>

                <div className="grid grid-cols-12 gap-5 mt-2">
                  
                  <div className="col-span-6 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                      O rotor dos modelos FAE conta com ferramentas fixas reforçadas de Vídea para cortes de alta resistência. Siga as orientações:
                    </p>

                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5 shadow-sm">
                      <span className="text-xs font-black uppercase text-slate-800 block border-b border-slate-200 pb-1">Inspeção Diária Pré-Operação</span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Diariamente, antes de iniciar o turno, verifique visualmente se todas as ferramentas estão devidamente posicionadas no lugar e se não há dentes quebrados ou soltos.
                      </p>
                      <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-black leading-relaxed shadow-sm">
                        AVISO CRÍTICO: Dentes quebrados ou ausentes causam desbalanceamento dinâmico severo no rotor, gerando forte vibração que destrói rolamentos. Substitua imediatamente!
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 shadow-sm space-y-2">
                      <span className="text-xs font-black uppercase text-slate-800 block border-b border-slate-200 pb-1">Durabilidade Estrita pelo Tipo de Solo</span>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        A vida útil da ferramenta de vídia depende imensamente da abrasividade do solo onde atua.
                      </p>
                      <div className="grid grid-cols-2 gap-3.5 mt-2 text-xs">
                        <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-lg">
                          <span className="font-extrabold text-amber-600 block">Solo Arenoso</span>
                          <span className="text-[10.5px] text-slate-500 block leading-tight mt-0.5">Substituição em até <strong>200h</strong>.</span>
                        </div>
                        <div className="bg-green-500/5 border border-green-500/20 p-3 rounded-lg">
                          <span className="font-extrabold text-green-600 block">Solo Argiloso</span>
                          <span className="text-[10.5px] text-slate-500 block leading-tight mt-0.5">Trabalha com segurança até <strong>700h</strong>.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-6 space-y-4">
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 shadow-sm space-y-3">
                      <span className="text-xs font-black uppercase text-slate-800 block border-b border-slate-200 pb-1">Tipos de Ferramentas no Rotor</span>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                          <div>
                            <span className="font-extrabold text-slate-800 block">Dente Central BSD (C/3 BSD)</span>
                            <span className="text-slate-500 text-[11px]">Múltiplas ferramentas centrais</span>
                          </div>
                          <span className="text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">6000.2010.0001</span>
                        </div>
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                          <div>
                            <span className="font-extrabold text-slate-800 block">Dente Lateral Esquerdo (C/3)</span>
                            <span className="text-slate-500 text-[11px]">02 peças nas extremidades</span>
                          </div>
                          <span className="text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">6000.2001.0018</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-extrabold text-slate-800 block">Dente Lateral Direito (C/3)</span>
                            <span className="text-slate-500 text-[11px]">02 peças nas extremidades</span>
                          </div>
                          <span className="text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">6000.2001.0017</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 overflow-hidden">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5 text-center">Foto dos 3 Dentes de Vídia C3 (Central e Laterais)</span>
                        <div className="w-full flex items-center justify-center overflow-hidden bg-white border border-slate-200 rounded-xl h-[120px]">
                          {teethC3TypesImg ? (
                            <img 
                              src={teethC3TypesImg} 
                              alt="Dentes C3" 
                              style={{ transform: `scale(${teethC3TypesImgZoom / 100})`, transformOrigin: 'center' }}
                              className="max-h-[110px] max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">Sem imagem de referência</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 shadow-sm space-y-3">
                      <div>
                        <span className="text-xs font-black uppercase text-slate-800 block border-b border-slate-200 pb-1 mb-1.5">Limite de Desgaste das Ferramentas</span>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          O limite de desbaste se dá ao final da ponta triangular desenhada atrás da vídia.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 overflow-hidden">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5 text-center">Foto do Limite de Desgaste da Ferramenta</span>
                        <div className="w-full flex items-center justify-center overflow-hidden bg-white border border-slate-200 rounded-xl h-[120px]">
                          {wearLimitImg ? (
                            <img 
                              src={wearLimitImg} 
                              alt="Limite Desgaste" 
                              style={{ transform: `scale(${wearLimitImgZoom / 100})`, transformOrigin: 'center' }}
                              className="max-h-[110px] max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">Sem imagem de referência</span>
                          )}
                        </div>
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

          {/* PAGE 3 */}
          <div 
            ref={page3Ref}
            className="w-[794px] h-[1123px] bg-white text-slate-900 p-[40px] relative flex flex-col justify-between overflow-hidden shrink-0 shadow-2xl select-text"
            style={{ boxSizing: 'border-box' }}
          >
            <div className="flex flex-col flex-1">
              
              {/* SECTION 4: OPERATIONAL INSTRUCTIONS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1.5">
                  <RotateCw className="h-4.5 w-4.5 text-primary" />
                  <h2 className="text-base font-black uppercase text-slate-900 tracking-tight">
                    4. Diretrizes Operacionais e Técnicas de Condução em Trabalho
                  </h2>
                </div>

                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-8 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                      A operação correta do triturador florestal no campo previne superaquecimentos, estende rolamentos e amplia o rendimento.
                    </p>

                    <div className="space-y-3.5 text-sm">
                      <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex gap-3 shadow-sm">
                        <div className="bg-slate-900 text-white rounded-lg h-6 w-6 flex items-center justify-center font-black shrink-0 text-xs shadow-sm">A</div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-tight">Giro da Escavadeira</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                            Mantenha a movimentação de giro horizontal da escavadeira sempre constante e suave.
                          </p>
                        </div>
                      </div>

                      <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex gap-3 shadow-sm">
                        <div className="bg-slate-900 text-white rounded-lg h-6 w-6 flex items-center justify-center font-black shrink-0 text-xs shadow-sm">B</div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-tight">Trabalho Vertical</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                            Para árvores na vertical, desça de forma controlada. Levante levemente se a rotação cair.
                          </p>
                        </div>
                      </div>

                      <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex gap-3 shadow-sm">
                        <div className="bg-slate-900 text-white rounded-lg h-6 w-6 flex items-center justify-center font-black shrink-0 text-xs shadow-sm">C</div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-tight">Rebaixamento de Tocos</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                            Não desça diretamente no centro. Vá rando a superfície lateral de 5 a 10 cm por passada.
                          </p>
                        </div>
                      </div>

                      <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex gap-3 shadow-sm">
                        <div className="bg-slate-900 text-white rounded-lg h-6 w-6 flex items-center justify-center font-black shrink-0 text-xs shadow-sm">D</div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-tight">Sensibilidade no Painel</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                            Cada escavadeira possui vazão diferente. Sinta as reações do conjunto.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4 flex flex-col justify-between overflow-hidden">
                    <div className="w-full flex items-center justify-center overflow-hidden bg-white border border-slate-200 rounded-xl h-[250px]">
                      {opsImg || resolvedImages[2] || resolvedImages[0] ? (
                        <img 
                          src={opsImg || resolvedImages[2] || resolvedImages[0]} 
                          alt="Diretrizes" 
                          style={{ transform: `scale(${opsImgZoom / 100})`, transformOrigin: 'center' }}
                          className="max-h-[240px] max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">Sem imagem de referência</span>
                      )}
                    </div>
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider mt-1.5 block text-center">SEGURANÇA EM PRIMEIRO LUGAR</span>
                  </div>
                </div>
              </div>

              {/* SECTION 5: SIGNATURES AND COMPLIANCE */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1.5">
                  <CheckCircle className="h-4.5 w-4.5 text-primary" />
                  <h2 className="text-base font-black uppercase text-slate-900 tracking-tight">
                    5. Termo de Instrução Técnica e Assinaturas de Conformidade
                  </h2>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Declaro para os devidos fins que o equipamento Roder listado na página 1 foi entregue em perfeitas condições operacionais, tendo o operador e o mecânico do cliente recebido todo o treinamento técnico presencial referente ao acoplamento hidráulico, lubrificação diária, inspeção e substituição periódica de ferramentas e diretrizes operacionais em campo.
                </p>

                <div className="grid grid-cols-3 gap-6 pt-12 text-sm">
                  <div 
                    onClick={() => setActiveSigPad('client')} 
                    className="text-center flex flex-col items-center justify-between cursor-pointer group"
                  >
                    <div className="w-full border-b border-slate-400 pb-1.5 h-12 flex items-center justify-center bg-slate-50/50 rounded hover:bg-slate-100/80 transition-all border-dashed border">
                      {clientSig ? (
                        <img src={clientSig} alt="Assinatura Cliente" className="max-h-12 max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 uppercase font-bold group-hover:text-primary transition-colors">Clique para Assinar</span>
                      )}
                    </div>
                    <div className="h-6 text-xs font-extrabold text-slate-800 uppercase truncate mt-1">
                      {clientName || '________________'}
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 mt-1 block">CLIENTE / RESPONSÁVEL</span>
                  </div>

                  <div 
                    onClick={() => setActiveSigPad('operator')} 
                    className="text-center flex flex-col items-center justify-between cursor-pointer group"
                  >
                    <div className="w-full border-b border-slate-400 pb-1.5 h-12 flex items-center justify-center bg-slate-50/50 rounded hover:bg-slate-100/80 transition-all border-dashed border">
                      {operatorSig ? (
                        <img src={operatorSig} alt="Assinatura Operador" className="max-h-12 max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 uppercase font-bold group-hover:text-primary transition-colors">Clique para Assinar</span>
                      )}
                    </div>
                    <div className="h-6 text-xs font-extrabold text-slate-800 uppercase truncate mt-1">
                      {operatorName || '________________'}
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 mt-1 block">OPERADOR TREINADO</span>
                  </div>

                  <div 
                    onClick={() => setActiveSigPad('technician')} 
                    className="text-center flex flex-col items-center justify-between cursor-pointer group"
                  >
                    <div className="w-full border-b border-slate-400 pb-1.5 h-12 flex items-center justify-center bg-slate-50/50 rounded hover:bg-slate-100/80 transition-all border-dashed border">
                      {technicianSig ? (
                        <img src={technicianSig} alt="Assinatura Técnico" className="max-h-12 max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 uppercase font-bold group-hover:text-primary transition-colors">Clique para Assinar</span>
                      )}
                    </div>
                    <div className="h-6 text-xs font-extrabold text-slate-800 uppercase truncate mt-1">
                      {technicianName || '________________'}
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 mt-1 block">TÉCNICO RODER</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Roder Máquinas e Equipamentos Ltda.</span>
              <span>Página 3 de 3</span>
            </div>
          </div>

        </section>
      </main>

      {/* Signature Modal Overlay */}
      {activeSigPad && (
        <SignaturePad
          title={`Assinatura do ${
            activeSigPad === 'client' ? 'Cliente / Responsável' : activeSigPad === 'operator' ? 'Operador Treinado' : 'Técnico Roder'
          }`}
          onSave={(dataUrl) => {
            if (activeSigPad === 'client') setClientSig(dataUrl);
            else if (activeSigPad === 'operator') setOperatorSig(dataUrl);
            else if (activeSigPad === 'technician') setTechnicianSig(dataUrl);
          }}
          onClose={() => setActiveSigPad(null)}
        />
      )}

      {/* Progressive sending status overlay */}
      {isSending && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999999] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="flex justify-center">
              <RotateCw className="h-10 w-10 text-amber-500 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Transmitindo Ficha...</h3>
              <p className="text-xs text-slate-400 font-semibold">{sendStatusMsg}</p>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${sendProgress}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{sendProgress}% CONCLUÍDO</span>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-[99999999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/15">
              <CheckCircle className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-100 uppercase tracking-tight">Ficha Técnica Enviada!</h2>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                A ficha técnica de entrega e as instruções operacionais do Triturador FAE foram transmitidas com sucesso para a Roder.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={handleLocalDownload}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all border border-slate-700/50"
              >
                <Download className="h-4 w-4 text-slate-400" /> Baixar PDF
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/10"
              >
                <PhoneCall className="h-4 w-4" /> Enviar WhatsApp
              </button>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                // Redirect back to main page if desired or refresh state
                setClientSig('');
                setOperatorSig('');
                setTechnicianSig('');
                setClientName('');
                setOperatorName('');
                setMechanicName('');
                setSerialNumber('');
                setExcavatorModel('');
                setTechnicianName('');
              }}
              className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-800"
            >
              Preencher Nova Ficha
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
