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
  FileText,
  ClipboardPaste
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { compressFileToDataURL } from '../../lib/imageUtils';
import { getApiBaseUrl } from '../../lib/utils';


interface EngateRapidoFichaProps {
  onClose: () => void;
}

const LABELS = {
  main: "Foto Principal",
  mounted: "Foto do Equipamento Montado",
  drawing: "Desenho Técnico 3D",
  bucket_adapter: "Foto do Adaptador da Caçamba",
  rear_prep: "Foto da Preparação Traseira"
};

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
  const { isAdmin, isManager, isTriagem, isMarketing, isInternalSeller } = useAuth();
  const canEdit = isAdmin || isManager || isTriagem || isMarketing || isInternalSeller;
  const printRef = useRef<HTMLDivElement>(null);
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const [customMainImageUrl, setCustomMainImageUrl] = useState<string | null>(null);
  const [customMountedImageUrl, setCustomMountedImageUrl] = useState<string | null>(null);
  const [customDrawingUrl, setCustomDrawingUrl] = useState<string | null>(null);
  const [customBucketAdapterImageUrl, setCustomBucketAdapterImageUrl] = useState<string | null>(null);
  const [customRearPrepImageUrl, setCustomRearPrepImageUrl] = useState<string | null>(null);
  const [loadingDrawing, setLoadingDrawing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const bucketInputRef = useRef<HTMLInputElement>(null);
  const rearInputRef = useRef<HTMLInputElement>(null);
  const drawingInputRef = useRef<HTMLInputElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const mountedInputRef = useRef<HTMLInputElement>(null);
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null);

  // States for Alternative Paste Option
  const [pasteUrlType, setPasteUrlType] = useState<'main' | 'mounted' | 'drawing' | 'bucket_adapter' | 'rear_prep'>('rear_prep');
  const [pasteUrlInput, setPasteUrlInput] = useState('');

  useEffect(() => {
    const fetchFichaImages = async () => {
      try {
        // Fetch setting documents helper that prefers server-side secure API, falling back to direct client getDoc
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
          // Direct Firestore fallback
          try {
            const snap = await getDoc(doc(db, 'settings', docName));
            return snap.exists() ? snap.data() : null;
          } catch (dbErr) {
            console.error(`[FETCH-DB] Falha geral ao obter ${docName}:`, dbErr);
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

        // If any image is missing, check the old monolithic document
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

        // Second fallback for drawing
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

    if (file.size > 30 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 30MB.");
      return;
    }

    setLoadingDrawing(true);
    const toastId = toast.loading(`Enviando ${LABELS[type]}...`);

    const docNameMap = {
      main: 'engate_rapido_ficha_main',
      mounted: 'engate_rapido_ficha_mounted',
      drawing: 'engate_rapido_ficha_drawing',
      bucket_adapter: 'engate_rapido_ficha_bucket_adapter',
      rear_prep: 'engate_rapido_ficha_rear_prep'
    };
    const docName = docNameMap[type];

    try {
      // Compress the image before uploading to avoid Firestore 1MB document size limit
      const base64Data = await compressFileToDataURL(file, 800, 0.7);
      
      // Upload via server-side API to store in Firebase Storage or local uploads fallback
      const baseUrl = getApiBaseUrl();
      const uploadRes = await fetch(`${baseUrl}/api/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64Data,
          fileName: `engate_rapido_ficha_${type}_${Date.now()}.jpg`,
          contentType: "image/jpeg",
          folder: "engate_rapido",
          docName: docName
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
      
      if (type === 'main') {
        setCustomMainImageUrl(imageUrlToSave);
      } else if (type === 'mounted') {
        setCustomMountedImageUrl(imageUrlToSave);
      } else if (type === 'drawing') {
        setCustomDrawingUrl(imageUrlToSave);
      } else if (type === 'bucket_adapter') {
        setCustomBucketAdapterImageUrl(imageUrlToSave);
      } else if (type === 'rear_prep') {
        setCustomRearPrepImageUrl(imageUrlToSave);
      }

      // No client-side setDoc write is needed because the backend `/api/upload-image` 
      // already safely writes the setting document using Admin SDK on the server side!

      toast.success(`${LABELS[type]} atualizado com sucesso!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao fazer upload do ${LABELS[type]}: ${err.message || err}`, { id: toastId });
    } finally {
      setLoadingDrawing(false);
      try {
        e.target.value = '';
      } catch (e) {}
    }
  };

  const convertUrlToCompressedBase64 = (url: string, maxDimension = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Não foi possível criar o contexto do Canvas."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => {
        reject(new Error("Falha ao carregar a imagem do link."));
      };
      // Format URL to go through our proxy to prevent CORS issues
      img.src = formatFichaImageUrl(url);
    });
  };

  const handleSaveViaUrl = async () => {
    const targetType = pasteUrlType;
    if (!pasteUrlInput.trim()) {
      toast.error("Por favor, cole um link de imagem válido.");
      return;
    }

    setLoadingDrawing(true);
    const toastId = toast.loading(`Processando e salvando imagem para ${LABELS[targetType]}...`);

    const docNameMap = {
      main: 'engate_rapido_ficha_main',
      mounted: 'engate_rapido_ficha_mounted',
      drawing: 'engate_rapido_ficha_drawing',
      bucket_adapter: 'engate_rapido_ficha_bucket_adapter',
      rear_prep: 'engate_rapido_ficha_rear_prep'
    };
    const docName = docNameMap[targetType];
    const urlToSave = pasteUrlInput.trim();

    try {
      let finalBase64 = '';
      let savedUrl = urlToSave;

      if (urlToSave.startsWith('data:')) {
        finalBase64 = urlToSave;
      } else {
        // Try to load and compress the URL to Base64 through our proxy
        try {
          finalBase64 = await convertUrlToCompressedBase64(urlToSave);
        } catch (convErr) {
          console.warn("[SAVE-URL] Não foi possível converter o link para Base64 local, salvando apenas o link como fallback:", convErr);
        }
      }

      if (finalBase64) {
        // If we have a base64 string, upload it to /api/upload-image so it gets saved on GCS/local file AND as inline base64 in Firestore!
        const baseUrl = getApiBaseUrl();
        const uploadRes = await fetch(`${baseUrl}/api/upload-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: finalBase64,
            fileName: `engate_rapido_ficha_pasted_${targetType}_${Date.now()}.jpg`,
            contentType: "image/jpeg",
            folder: "engate_rapido",
            docName: docName
          })
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.success && uploadData.url) {
            savedUrl = uploadData.url;
            // Update local state with the base64 for absolute instant offline-ready loading
            if (targetType === 'main') setCustomMainImageUrl(finalBase64);
            else if (targetType === 'mounted') setCustomMountedImageUrl(finalBase64);
            else if (targetType === 'drawing') setCustomDrawingUrl(finalBase64);
            else if (targetType === 'bucket_adapter') setCustomBucketAdapterImageUrl(finalBase64);
            else if (targetType === 'rear_prep') setCustomRearPrepImageUrl(finalBase64);

            toast.success(`${LABELS[targetType]} processado e salvo como imagem permanente!`, { id: toastId });
            setPasteUrlInput('');
            setLoadingDrawing(false);
            return;
          }
        }
      }

      // Fallback: If conversion failed or upload failed, save standard url config directly
      if (targetType === 'main') setCustomMainImageUrl(savedUrl);
      else if (targetType === 'mounted') setCustomMountedImageUrl(savedUrl);
      else if (targetType === 'drawing') setCustomDrawingUrl(savedUrl);
      else if (targetType === 'bucket_adapter') setCustomBucketAdapterImageUrl(savedUrl);
      else if (targetType === 'rear_prep') setCustomRearPrepImageUrl(savedUrl);

      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/settings/${docName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: savedUrl,
          image_data: savedUrl
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      toast.success(`${LABELS[targetType]} atualizado com sucesso via link!`, { id: toastId });
      setPasteUrlInput('');
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao salvar link: ${err.message}`, { id: toastId });
    } finally {
      setLoadingDrawing(false);
    }
  };

  const handleClipboardPaste = async (e: React.ClipboardEvent<any>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let imageFile: File | null = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFile = items[i].getAsFile();
        break;
      }
    }

    if (!imageFile) {
      toast.error("Nenhuma imagem detectada na área de transferência. Use Print Screen ou copie uma imagem antes de colar.");
      return;
    }

    const targetType = pasteUrlType;
    setLoadingDrawing(true);
    const toastId = toast.loading(`Enviando foto colada para ${LABELS[targetType]}...`);

    const docNameMap = {
      main: 'engate_rapido_ficha_main',
      mounted: 'engate_rapido_ficha_mounted',
      drawing: 'engate_rapido_ficha_drawing',
      bucket_adapter: 'engate_rapido_ficha_bucket_adapter',
      rear_prep: 'engate_rapido_ficha_rear_prep'
    };
    const docName = docNameMap[targetType];

    try {
      // Compress the pasted image before upload to fit within bounds
      const base64Data = await compressFileToDataURL(imageFile, 800, 0.7);
      
      // Upload via backend
      const baseUrl = getApiBaseUrl();
      const uploadRes = await fetch(`${baseUrl}/api/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64Data,
          fileName: `engate_rapido_ficha_pasted_${targetType}_${Date.now()}.jpg`,
          contentType: "image/jpeg",
          folder: "engate_rapido",
          docName: docName
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
      
      // Update state
      if (targetType === 'main') setCustomMainImageUrl(imageUrlToSave);
      else if (targetType === 'mounted') setCustomMountedImageUrl(imageUrlToSave);
      else if (targetType === 'drawing') setCustomDrawingUrl(imageUrlToSave);
      else if (targetType === 'bucket_adapter') setCustomBucketAdapterImageUrl(imageUrlToSave);
      else if (targetType === 'rear_prep') setCustomRearPrepImageUrl(imageUrlToSave);

      toast.success(`${LABELS[targetType]} atualizado com sucesso via colagem!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao salvar imagem colada: ${err.message}`, { id: toastId });
    } finally {
      setLoadingDrawing(false);
    }
  };

  const handleResetImages = async () => {
    if (!window.confirm("Deseja realmente restaurar as imagens padrão da ficha técnica?")) return;

    setLoadingDrawing(true);
    const toastId = toast.loading("Restaurando imagens padrão...");

    try {
      const baseUrl = getApiBaseUrl();
      const docsToReset = [
        'engate_rapido_ficha_main',
        'engate_rapido_ficha_mounted',
        'engate_rapido_ficha_drawing',
        'engate_rapido_ficha_bucket_adapter',
        'engate_rapido_ficha_rear_prep',
        'engate_rapido_ficha_images'
      ];

      // Save setting docs securely via POST backend API to bypass client-side rules
      await Promise.all(docsToReset.map(docName => 
        fetch(`${baseUrl}/api/settings/${docName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            docName === 'engate_rapido_ficha_images' 
            ? {
                main_image_url: null,
                mounted_image_url: null,
                drawing_url: null,
                bucket_adapter_image_url: null,
                rear_prep_image_url: null
              }
            : { image_url: null, image_data: null }
          )
        })
      ));

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
    setIsPrinting(true);
    const toastId = toast.loading("Gerando ficha técnica em PDF de alta qualidade...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = [page1Ref.current, page2Ref.current];
      
      for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i];
        if (!pageElement) continue;

        const dataUrl = await toPng(pageElement, {
          quality: 0.98,
          pixelRatio: 2.5, // Crisp high-res text
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

            {canEdit && (
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

                  {/* Copy & Paste Alternate Panel requested by user */}
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-left space-y-2 mt-4">
                    <span className="text-[10px] uppercase font-black text-orange-500 block">Área Alternativa de Colagem</span>
                    <p className="text-[9.5px] text-slate-400 leading-snug">
                      Se o upload falhar ou exceder limites, selecione o campo abaixo e cole (Ctrl+V) ou insira o link direto.
                    </p>
                    
                    <div className="space-y-2 pt-1">
                      <select 
                        value={pasteUrlType} 
                        onChange={(e) => setPasteUrlType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded text-xs px-2 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-orange-500"
                      >
                        <option value="main">Foto Principal</option>
                        <option value="mounted">Equipamento Montado</option>
                        <option value="drawing">Desenho Técnico 3D</option>
                        <option value="bucket_adapter">Adaptador da Caçamba</option>
                        <option value="rear_prep">Preparação Traseira</option>
                      </select>
                      
                      <div className="flex gap-1">
                        <input 
                          type="text" 
                          placeholder="Cole o link da foto (http://...)" 
                          value={pasteUrlInput}
                          onChange={(e) => setPasteUrlInput(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded text-[11px] px-2 py-1.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                        />
                        <button 
                          onClick={handleSaveViaUrl}
                          className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-2.5 py-1.5 rounded text-[11px] transition shrink-0"
                        >
                          Salvar Link
                        </button>
                      </div>

                      {/* Interactive Clipboard Paste Container */}
                      <div 
                        onClick={() => {
                          pasteAreaRef.current?.focus();
                          toast.info("Pronto para colar! Pressione Ctrl+V ou Cmd+V agora para salvar a imagem do campo selecionado.");
                        }}
                        className="border border-dashed border-slate-800 hover:border-orange-500/50 rounded-lg p-3 bg-slate-950 flex flex-col items-center justify-center gap-1 cursor-pointer text-center group transition focus-within:ring-1 focus-within:ring-orange-500 relative"
                      >
                        <textarea
                          ref={pasteAreaRef}
                          onPaste={handleClipboardPaste}
                          className="opacity-0 absolute w-0 h-0 pointer-events-none"
                          placeholder="Cole aqui"
                        />
                        <ClipboardPaste className="h-4 w-4 text-slate-500 group-hover:text-orange-500 transition" />
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">Clique aqui e aperte Ctrl+V</span>
                        <span className="text-[8px] text-slate-500">Colará foto para o campo selecionado acima</span>
                      </div>
                    </div>
                  </div>

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
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 flex flex-col items-center">
          <div id="print-container" className="space-y-8 w-full max-w-[794px] print:space-y-0 print:p-0">
            {/* Page 1 */}
            <div 
              ref={page1Ref}
              className="bg-white text-slate-900 shadow-xl border border-slate-200/60 leading-normal font-sans p-6 flex flex-col justify-between print:shadow-none print:border-0 print:p-0 mb-8"
              style={{
                width: '794px',
                height: '1123px',
                boxSizing: 'border-box',
                pageBreakAfter: 'always',
                breakAfter: 'page'
              }}
            >
              <div>
                {/* Hidden input triggers for Page 1 */}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={drawingInputRef} 
                  onChange={(e) => handleImageUpload(e, 'drawing')} 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={mainInputRef} 
                  onChange={(e) => handleImageUpload(e, 'main')} 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={mountedInputRef} 
                  onChange={(e) => handleImageUpload(e, 'mounted')} 
                  className="hidden" 
                />

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

                {/* Product Info Description (Full Width for elegant spacing and less vertical text height) */}
                <div className="space-y-2 mb-4">
                  <h2 className="text-xl font-black text-slate-950 tracking-tight leading-none uppercase border-l-4 border-orange-500 pl-2">
                    Engate Rápido Roder
                  </h2>
                  <p className="text-[10px] text-slate-700 leading-relaxed text-justify">
                    O <strong>Engate Rápido Hidráulico Roder para Pás Carregadeiras</strong> é um equipamento fabricado sob encomenda e dimensionado sob medida para cada marca e modelo específico de máquina. Cada máquina possui dimensões exclusivas de pinos de acoplamento e largura interna de braço de elevação, tornando a personalização uma premissa fundamental para a garantia de perfeito funcionamento e segurança. Projetado para operações que necessitam realizar trocas dinâmicas e constantes de implementos (por exemplo, alternando rapidamente entre a caçamba original de terra e o garfo pallet de carregamento), o engate rápido reduz radicalmente os tempos de ciclo logísticos, elevando a produtividade operacional.
                  </p>
                </div>

                {/* Main Visual Gallery (3 Perfect Square Cards of Equipment Views) */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {/* Main Photo Slot */}
                  <div 
                    onClick={() => canEdit && mainInputRef.current?.click()}
                    className={`border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col aspect-square relative ${canEdit ? 'cursor-pointer hover:border-orange-300 hover:bg-orange-50/10 transition-all' : ''}`}
                  >
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
                        className="max-h-[160px] max-w-full object-contain rounded transition hover:scale-105 duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {canEdit && (
                      <div className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[7.5px] px-1 py-0.2 rounded font-bold uppercase tracking-wider backdrop-blur-sm">
                        Alterar
                      </div>
                    )}
                  </div>

                  {/* Mounted Photo Slot */}
                  <div 
                    onClick={() => canEdit && mountedInputRef.current?.click()}
                    className={`border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col aspect-square relative ${canEdit ? 'cursor-pointer hover:border-orange-300 hover:bg-orange-50/10 transition-all' : ''}`}
                  >
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
                        className="max-h-[160px] max-w-full object-contain rounded transition hover:scale-105 duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {canEdit && (
                      <div className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[7.5px] px-1 py-0.2 rounded font-bold uppercase tracking-wider backdrop-blur-sm">
                        Alterar
                      </div>
                    )}
                  </div>

                  {/* Technical CAD / Scheme 3D Slot */}
                  <div 
                    onClick={() => canEdit && drawingInputRef.current?.click()}
                    className={`border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col aspect-square relative ${canEdit ? 'cursor-pointer hover:border-orange-300 hover:bg-orange-50/10 transition-all' : ''}`}
                  >
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
                          className="max-h-[160px] max-w-full object-contain rounded transition hover:scale-105 duration-300" 
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
                    {canEdit && (
                      <div className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[7.5px] px-1 py-0.2 rounded font-bold uppercase tracking-wider backdrop-blur-sm">
                        Alterar
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Technical & Compatibility Grid */}
                <div className="grid grid-cols-12 gap-4">
                  {/* Left Column: Funcionamento & Instalação Hidráulica */}
                  <div className="col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
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
                  <div className="col-span-6 border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-950 uppercase flex items-center gap-1.5 mb-1.5 border-b border-slate-200 pb-1.5">
                        <Layers className="h-4 w-4 text-orange-500" /> Compatibilidade de Implementos
                      </h3>
                      <p className="text-[9px] text-slate-700 leading-relaxed text-justify mb-2.5">
                        Ao instalar o Engate Rápido, todos os implementos utilizados na máquina devem ser preparados com o adaptador correspondente (fornecido e instalado tipo gancho pela Roder), garantindo o travamento seguro direto da cabine.
                      </p>
                    </div>

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

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Bucket Adapter Section */}
                      <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between h-[155px]">
                        <div>
                          <span className="text-[8.5px] font-extrabold text-slate-900 block mb-1 leading-tight">
                            Adaptador Caçamba (Obrigatório)
                          </span>
                        </div>
                        <div 
                          onClick={() => canEdit && bucketInputRef.current?.click()}
                          className={`flex-1 w-full border border-dashed rounded-lg bg-slate-50 flex flex-col items-center justify-center p-1.5 relative overflow-hidden ${canEdit ? 'cursor-pointer hover:bg-orange-50/30 hover:border-orange-300 transition-all' : 'border-slate-200'}`}
                        >
                          {customBucketAdapterImageUrl ? (
                            <img 
                              src={formatFichaImageUrl(customBucketAdapterImageUrl)} 
                              alt="Adaptador de Caçamba" 
                              className="max-h-[110px] max-w-full object-contain rounded transition hover:scale-105 duration-300"
                            />
                          ) : (
                            <div className="flex flex-col items-center text-center p-1">
                              <Upload className="h-4 w-4 text-slate-400 mb-0.5" />
                              <span className="text-[8px] font-bold text-slate-500">Adicionar Foto</span>
                            </div>
                          )}
                          {canEdit && (
                            <div className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[7.5px] px-1 py-0.2 rounded font-bold uppercase tracking-wider backdrop-blur-sm">
                              Alterar
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
                        <div 
                          onClick={() => canEdit && rearInputRef.current?.click()}
                          className={`flex-1 w-full border border-dashed rounded-lg bg-slate-50 flex flex-col items-center justify-center p-1.5 relative overflow-hidden ${canEdit ? 'cursor-pointer hover:bg-orange-50/30 hover:border-orange-300 transition-all' : 'border-slate-200'}`}
                        >
                          {customRearPrepImageUrl ? (
                            <img 
                              src={formatFichaImageUrl(customRearPrepImageUrl)} 
                              alt="Preparação Traseira" 
                              className="max-h-[110px] max-w-full object-contain rounded transition hover:scale-105 duration-300"
                            />
                          ) : (
                            <div className="flex flex-col items-center text-center p-1">
                              <Upload className="h-4 w-4 text-slate-400 mb-0.5" />
                              <span className="text-[8px] font-bold text-slate-500">Adicionar Foto</span>
                            </div>
                          )}
                          {canEdit && (
                            <div className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[7.5px] px-1 py-0.2 rounded font-bold uppercase tracking-wider backdrop-blur-sm">
                              Alterar
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini Footer for Brand Continuity */}
              <div className="border-t border-slate-100 pt-1.5 flex justify-between text-[7.5px] text-slate-400 font-mono">
                <span>RODER BRASIL • ENGATE RÁPIDO</span>
                <span>Página 1 de 2</span>
              </div>
            </div>

            {/* Page 2 */}
            <div 
              ref={page2Ref}
              className="bg-white text-slate-900 shadow-xl border border-slate-200/60 leading-normal font-sans p-6 flex flex-col justify-between print:shadow-none print:border-0 print:p-0 mb-8"
              style={{
                width: '794px',
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

                {/* New Segment: Compatible Roder Implements examples and requirements */}
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
                <div className="border border-slate-200 rounded-xl p-3 mb-2.5 bg-slate-50/50">
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
                          <li><strong>Garras de Estufagem Sem Giro:</strong> Modelos AF 360, AF 400.</li>
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
                          <li><strong>Garras de Estufagem com Giro:</strong> Modelos AFG 600 e AFG 800.</li>
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

                {/* Commercial Checklist for Salespeople */}
                <div className="border border-orange-200 rounded-xl p-3 bg-orange-50/30">
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
                  <p className="font-bold">RODER BRASIL EQUIPAMENTOS HIDRÁULICOS LTDA</p>
                  <p>Contato Comercial: Gislene / Triagem de Leads: Luana</p>
                </div>
                <div className="text-right">
                  <p>Documento gerado dinamicamente via RODER Indica V2 • Página 2 de 2</p>
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











