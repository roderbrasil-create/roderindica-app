import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Product, ProductModel } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { getApiBaseUrl } from '../lib/utils';
import { toast } from 'sonner';
import { structureDossierAudio, transcribeAudio } from '../services/geminiService';
import { 
  Printer, 
  Copy, 
  Save, 
  Upload, 
  FileText, 
  Mic, 
  Square, 
  Trash2, 
  Play, 
  Pause, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  Activity, 
  Clock, 
  FileCheck,
  Volume2,
  FileUp,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Wrench,
  Settings,
  Brain,
  Search,
  Plus,
  Edit2,
  Check,
  Loader2,
  X
} from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: db ? 'active' : 'inactive',
    },
    operationType,
    path
  };
  console.error('Firestore Error in Dossier: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface DossierAttachment {
  name: string;
  url: string;
  contentType: string;
  uploadedAt: string;
}

interface DossierAudio {
  name: string;
  url: string;
  uploadedAt: string;
}

interface DossierData {
  id: string; // productId_modelId
  productId: string;
  productName: string;
  modelId: string;
  modelName: string;
  dossier_text: string;
  compatibility_notes: string;
  choice_reason: string;
  productivity_info: string;
  attachments: DossierAttachment[];
  audios: DossierAudio[];
  created_at: string;
  updated_at: string;
}

export default function ProductDossier() {
  const { user, profile, isAdmin, isManager } = useAuth();
  
  // Guard access - only admin or manager (or owner email roderbrasil@gmail.com)
  const isAuthorized = isAdmin || isManager || user?.email === 'roderbrasil@gmail.com';

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedModel, setSelectedModel] = useState<ProductModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  // Dossier editable content
  const [dossierText, setDossierText] = useState('');
  const [compatibilityNotes, setCompatibilityNotes] = useState('');
  const [choiceReason, setChoiceReason] = useState('');
  const [productivityInfo, setProductivityInfo] = useState('');
  const [attachments, setAttachments] = useState<DossierAttachment[]>([]);
  const [audios, setAudios] = useState<DossierAudio[]>([]);
  const [createdAt, setCreatedAt] = useState('');

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // File drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Main Tab State
  const [mainTab, setMainTab] = useState<'tecnico' | 'comercial'>('tecnico');

  // Commercial Guidelines Dossier States
  interface Guideline {
    id: string;
    question: string; // Title / Subject
    improvedAnswer: string; // Technical explanation / Directives
    timestamp: any;
    author?: string;
    source?: string;
    isImproved?: boolean;
  }

  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loadingGuidelines, setLoadingGuidelines] = useState(false);
  const [guidelineSearch, setGuidelineSearch] = useState('');
  const [editingGuidelineId, setEditingGuidelineId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState('');
  const [editingAnswer, setEditingAnswer] = useState('');
  
  // Create Guideline States
  const [isAddingGuideline, setIsAddingGuideline] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isGuidelineRecording, setIsGuidelineRecording] = useState(false);
  const [isGuidelineTranscribing, setIsGuidelineTranscribing] = useState(false);
  const [guidelineRecordingTime, setGuidelineRecordingTime] = useState(0);
  const [guidelineMediaRecorder, setGuidelineMediaRecorder] = useState<MediaRecorder | null>(null);
  const [guidelineAudioStream, setGuidelineAudioStream] = useState<MediaStream | null>(null);
  const guidelineTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Full Printable Commercial Report Modal
  const [isCommercialReportOpen, setIsCommercialReportOpen] = useState(false);

  // Fetch commercial guidelines
  useEffect(() => {
    if (!isAuthorized) return;
    setLoadingGuidelines(true);
    const q = query(collection(db, 'roder_comercial_guidelines'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as Guideline));
      setGuidelines(items);
      setLoadingGuidelines(false);
    }, (error) => {
      console.error("Error fetching guidelines:", error);
      setLoadingGuidelines(false);
    });

    return () => unsubscribe();
  }, [isAuthorized]);

  // Guideline recording timer
  useEffect(() => {
    if (isGuidelineRecording) {
      guidelineTimerRef.current = setInterval(() => {
        setGuidelineRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (guidelineTimerRef.current) {
        clearInterval(guidelineTimerRef.current);
        guidelineTimerRef.current = null;
      }
    }
    return () => {
      if (guidelineTimerRef.current) clearInterval(guidelineTimerRef.current);
    };
  }, [isGuidelineRecording]);

  const startGuidelineRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const pureBase64 = base64data.split(',')[1];
          try {
            setIsGuidelineTranscribing(true);
            toast.loading("Roder IA: Processando áudio e transcrevendo diretriz comercial...", { id: "guideline-transcribe" });
            const transcription = await transcribeAudio(pureBase64, 'audio/webm');
            if (transcription) {
              setNewAnswer(prev => prev ? `${prev}\n${transcription}` : transcription);
              toast.success("Diretriz comercial transcrita com sucesso!", { id: "guideline-transcribe" });
            } else {
              toast.error("Roder IA não detectou fala clara no áudio.", { id: "guideline-transcribe" });
            }
          } catch (err) {
            console.error("Transcription error:", err);
            toast.error("Erro ao transcrever diretriz comercial com Roder IA.", { id: "guideline-transcribe" });
          } finally {
            setIsGuidelineTranscribing(false);
          }
        };
      };

      recorder.start();
      setGuidelineMediaRecorder(recorder);
      setGuidelineAudioStream(stream);
      setIsGuidelineRecording(true);
      setGuidelineRecordingTime(0);
      toast.info("Gravando sua instrução comercial por voz...");
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Não foi possível acessar o microfone.");
    }
  };

  const stopGuidelineRecording = () => {
    if (guidelineMediaRecorder && isGuidelineRecording) {
      guidelineMediaRecorder.stop();
      if (guidelineAudioStream) {
        guidelineAudioStream.getTracks().forEach(track => track.stop());
      }
      setIsGuidelineRecording(false);
      setGuidelineMediaRecorder(null);
      setGuidelineAudioStream(null);
    }
  };

  const handleAddGuideline = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error("Por favor, preencha o assunto/título e a diretriz.");
      return;
    }

    try {
      toast.loading("Salvando diretriz na Base de Conhecimento...", { id: "add-g" });
      await addDoc(collection(db, 'roder_comercial_guidelines'), {
        question: newQuestion,
        improvedAnswer: newAnswer,
        timestamp: new Date().toISOString(),
        author: user?.email || 'Gerência Comercial',
        source: 'Base de Conhecimento Direta',
        isImproved: true
      });
      setNewQuestion('');
      setNewAnswer('');
      setIsAddingGuideline(false);
      toast.success("Diretriz comercial salva e anexada ao Dossiê com sucesso!", { id: "add-g" });
    } catch (err) {
      console.error("Error adding guideline:", err);
      toast.error("Erro ao salvar diretriz comercial.", { id: "add-g" });
    }
  };

  const handleUpdateGuideline = async (id: string) => {
    if (!editingQuestion.trim() || !editingAnswer.trim()) {
      toast.error("Título e instrução não podem ser vazios.");
      return;
    }

    try {
      toast.loading("Atualizando diretriz...", { id: "up-g" });
      await updateDoc(doc(db, 'roder_comercial_guidelines', id), {
        question: editingQuestion,
        improvedAnswer: editingAnswer,
        updatedAt: new Date().toISOString()
      });
      setEditingGuidelineId(null);
      toast.success("Diretriz comercial atualizada com sucesso!", { id: "up-g" });
    } catch (err) {
      console.error("Error updating guideline:", err);
      toast.error("Erro ao atualizar diretriz.", { id: "up-g" });
    }
  };

  const handleDeleteGuideline = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta diretriz comercial? Ela deixará de fazer parte do Dossiê e do cérebro da Roder IA.")) return;

    try {
      toast.loading("Removendo diretriz...", { id: "del-g" });
      await deleteDoc(doc(db, 'roder_comercial_guidelines', id));
      toast.success("Diretriz comercial removida permanentemente.", { id: "del-g" });
    } catch (err) {
      console.error("Error deleting guideline:", err);
      toast.error("Erro ao remover diretriz.", { id: "del-g" });
    }
  };

  const copyGuidelineToClipboard = (g: Guideline) => {
    const text = `*DIRETRIZ COMERCIAL - RODER BRASIL*\n*Assunto:* ${g.question}\n*Data:* ${g.timestamp ? new Date(g.timestamp).toLocaleDateString('pt-BR') : 'n/d'}\n\n${g.improvedAnswer}`;
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Diretriz comercial copiada para o WhatsApp!"))
      .catch(() => toast.error("Falha ao copiar."));
  };

  // Fetch products catalog
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch custom dossier or populate fallbacks when selection changes
  useEffect(() => {
    if (!selectedProduct || !selectedModel) {
      // Clear fields
      setDossierText('');
      setCompatibilityNotes('');
      setChoiceReason('');
      setProductivityInfo('');
      setAttachments([]);
      setAudios([]);
      setCreatedAt('');
      return;
    }

    const dossierId = `${selectedProduct.id}_${selectedModel.id}`;
    setLoading(true);

    const docRef = doc(db, 'equipment_dossiers', dossierId);
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DossierData;
        setDossierText(data.dossier_text || '');
        setCompatibilityNotes(data.compatibility_notes || '');
        setChoiceReason(data.choice_reason || '');
        setProductivityInfo(data.productivity_info || '');
        setAttachments(data.attachments || []);
        setAudios(data.audios || []);
        setCreatedAt(data.created_at || new Date().toISOString());
      } else {
        // Populate fallbacks using existing catalog details
        const baseMachine = selectedModel.technical_specs?.maquina_base || 'Escavadeira hidráulica de tonelagem correspondente';
        const modelWeight = selectedModel.technical_specs?.peso || selectedModel.technical_specs?.peso_operacional || 'Sob consulta';
        
        let initialDossierText = `O equipamento ${selectedProduct.name} - Modelo ${selectedModel.name} representa o mais alto padrão em engenharia florestal desenvolvida pela Roder. Construído com materiais de alta resistência, este equipamento foi projetado para operar nos ambientes mais severos, entregando produtividade constante e reduzindo o tempo de inatividade da máquina base.`;
        
        let initialCompatibilityNotes = `Compatível com ${baseMachine}. Peso estimado de trabalho de ${modelWeight}. Recomenda-se aferir a vazão hidráulica (${selectedModel.technical_specs?.vazao || 'vazão sob consulta'}) e pressão de trabalho (${selectedModel.technical_specs?.pressao || selectedModel.technical_specs?.pressao_trabalho || 'pressão sob consulta'}) da máquina base para acoplamento perfeito.`;

        if (selectedModel.id === 'r280') {
          initialDossierText += `\n\n[Recomendação Técnica Roder]: Recomendada oficialmente para escavadeiras de 8 toneladas operando em alimentação de picador, oferecendo o melhor dimensionamento e estabilidade para esta aplicação.`;
          initialCompatibilityNotes += `\n\nEspecificação de Estabilidade: Para escavadeiras de 8 toneladas, este é o modelo ideal e mais compatível para alimentação de picador, garantindo ótima distribuição de carga.`;
        } else if (selectedModel.id === 'r360') {
          initialDossierText += `\n\n[Recomendação Técnica Roder]: Indicada para escavadeiras de 8 toneladas em operações de carregamento ou descarregamento de madeiras de até 3 metros de comprimento. Contudo, para máxima estabilidade do conjunto, a Garra R280 continua sendo a mais recomendada.`;
          initialCompatibilityNotes += `\n\nEspecificação de Estabilidade: Pode ser utilizada em escavadeiras de 8 toneladas para movimentação de toras de até 3 metros, mas o modelo R280 é preferido se a prioridade for a estabilidade máxima da escavadeira base.`;
        }

        setDossierText(initialDossierText);
        setCompatibilityNotes(initialCompatibilityNotes);
        setChoiceReason(
          `Escolhido para operações que priorizam rendimento e alta resistência mecânica. Este modelo destaca-se pelo design robusto, facilidade na reposição de peças originais Roder e excelente custo-benefício por metro cúbico processado ou arrastado.`
        );
        setProductivityInfo(
          selectedModel.productivity_text || 
          `Informações de Produtividade: Ciclo operacional ágil com alta velocidade de pinçamento/corte. Produtividade média estimada varia de acordo com a habilidade do operador, floresta e máquina portadora base.`
        );
        setAttachments([]);
        setAudios([]);
        setCreatedAt(new Date().toISOString());
      }
      setLoading(false);
    }).catch(error => {
      handleFirestoreError(error, OperationType.GET, `equipment_dossiers/${dossierId}`);
      setLoading(false);
    });

  }, [selectedProduct, selectedModel]);

  // Audio Timer Hook
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const pureBase64 = base64data.split(',')[1];

          // 1. First upload the file to secure storage (GCS/local) as a technical media attachment
          try {
            toast.loading("Enviando gravação de áudio...", { id: "audio-process" });
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/api/upload-image`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileBase64: base64data,
                fileName: `audio_${selectedModel?.id || 'model'}_${Date.now()}.webm`,
                contentType: 'audio/webm',
                folder: 'dossier_audios'
              })
            });
            const data = await res.json();
            if (data.success && data.url) {
              const newAudio: DossierAudio = {
                name: `Áudio Explicativo - ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                url: data.url,
                uploadedAt: new Date().toISOString()
              };
              setAudios(prev => [...prev, newAudio]);
            } else {
              console.warn("Storage upload failed or returned invalid response, but proceeding with AI Structuring...");
            }
          } catch (err) {
            console.error("Audio storage upload error:", err);
          }

          // 2. Transcribe and structure the content using Roder AI
          try {
            toast.loading("Roder IA analisando áudio e estruturando campos...", { id: "audio-process" });
            const aiResult = await structureDossierAudio({
              audioBase64: pureBase64,
              mimeType: 'audio/webm',
              currentDossierText: dossierText,
              currentCompatibilityNotes: compatibilityNotes,
              currentChoiceReason: choiceReason,
              currentProductivityInfo: productivityInfo,
              productName: selectedProduct?.name || '',
              modelName: selectedModel?.name || ''
            });

            if (aiResult) {
              setDossierText(aiResult.dossier_text);
              setCompatibilityNotes(aiResult.compatibility_notes);
              setChoiceReason(aiResult.choice_reason);
              setProductivityInfo(aiResult.productivity_info);

              toast.success("Roder IA: Áudio transcrito e categorizado com sucesso nos campos!", { 
                id: "audio-process", 
                duration: 5000 
              });
              
              // Move the user to the edit tab to view and adjust the enriched fields
              setActiveTab('edit');
            } else {
              toast.error("Roder IA não conseguiu estruturar as informações.", { id: "audio-process" });
            }
          } catch (err) {
            console.error("AI Dossier Structuring Error:", err);
            toast.error("Falha ao analisar o áudio com a Roder IA.", { id: "audio-process" });
          }
        };
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioStream(stream);
      setIsRecording(true);
      setRecordingTime(0);
      toast.info("Microfone ativado! Gravando nota técnica...");
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Não foi possível acessar o microfone do navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      setMediaRecorder(null);
      setAudioStream(null);
    }
  };

  // Document Upload Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: FileList | null = null;
    if ('dataTransfer' in e) {
      e.preventDefault();
      setIsDragging(false);
      files = e.dataTransfer.files;
    } else if ('target' in e) {
      files = e.target.files;
    }

    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Limite máximo de arquivo é de 15MB.");
      return;
    }

    toast.loading(`Enviando documento ${file.name}...`, { id: "file-upload" });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64data,
            fileName: file.name,
            contentType: file.type,
            folder: 'dossier_documents'
          })
        });
        const data = await res.json();
        if (data.success && data.url) {
          const newAttachment: DossierAttachment = {
            name: file.name,
            url: data.url,
            contentType: file.type || 'application/octet-stream',
            uploadedAt: new Date().toISOString()
          };
          setAttachments(prev => [...prev, newAttachment]);
          toast.success("Documento anexado com sucesso!", { id: "file-upload" });
        } else {
          toast.error("Erro ao processar arquivo no servidor.", { id: "file-upload" });
        }
      } catch (err) {
        console.error("File upload error:", err);
        toast.error("Falha ao anexar documento.", { id: "file-upload" });
      }
    };
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
    toast.success("Documento removido.");
  };

  const removeAudio = (indexToRemove: number) => {
    setAudios(prev => prev.filter((_, idx) => idx !== indexToRemove));
    toast.success("Áudio técnico removido.");
  };

  // Save Dossier to Firestore
  const saveDossier = async () => {
    if (!selectedProduct || !selectedModel) return;

    setSaving(true);
    const dossierId = `${selectedProduct.id}_${selectedModel.id}`;

    const dossierPayload: DossierData = {
      id: dossierId,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      dossier_text: dossierText,
      compatibility_notes: compatibilityNotes,
      choice_reason: choiceReason,
      productivity_info: productivityInfo,
      attachments,
      audios,
      created_at: createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'equipment_dossiers', dossierId), dossierPayload);
      toast.success("Dossiê técnico salvo e arquivado com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `equipment_dossiers/${dossierId}`);
      toast.error("Erro ao salvar dossiê técnico.");
    } finally {
      setSaving(false);
    }
  };

  // Copy Dossier text to share (WhatsApp, email, etc.)
  const copyDossierToClipboard = () => {
    if (!selectedProduct || !selectedModel) return;

    const textToCopy = `
*DOSSIÊ TÉCNICO OFICIAL - RODER INDICA V2*
=========================================
*Equipamento:* ${selectedProduct.name}
*Modelo:* ${selectedModel.name}
*Categoria:* ${selectedProduct.category || 'Equipamento Florestal'}
*Data de Atualização:* ${new Date().toLocaleDateString('pt-BR')}

-----------------------------------------
*1. RELATÓRIO DO DOSSIÊ*
${dossierText}

-----------------------------------------
*2. COMPATIBILIDADE DE MÁQUINA*
${compatibilityNotes}

-----------------------------------------
*3. MOTIVO DA ESCOLHA / TIPO DE SELEÇÃO*
${choiceReason}

-----------------------------------------
*4. INFORMAÇÕES DE PRODUTIVIDADE*
${productivityInfo}

-----------------------------------------
*5. ESPECIFICAÇÕES TÉCNICAS*
${Object.entries(selectedModel.technical_specs || {})
  .map(([key, value]) => `• ${key.replace(/_/g, ' ').toUpperCase()}: ${value}`)
  .join('\n')}

-----------------------------------------
*Link Oficial do Catálogo:* ${selectedProduct.pdf_url || 'https://roderbrasil.com.br'}
*Enviado via Roder Indica V2*
    `.trim();

    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success("Dossiê técnico copiado em formato de mensagem! Pronto para colar no WhatsApp."))
      .catch(() => toast.error("Falha ao copiar texto para a área de transferência."));
  };

  // Print Dossier
  const handlePrint = () => {
    window.print();
  };

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4 animate-bounce" />
          <h2 className="text-2xl font-black tracking-tight text-foreground uppercase mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground text-sm max-w-md mb-6 leading-relaxed">
            Olá! O Dossiê Técnico de Produtos está disponível atualmente apenas para administradores e gerentes comerciais da Roder Brasil.
          </p>
          <Button onClick={() => window.history.back()} className="bg-primary hover:bg-primary/95 text-white gap-2 font-bold px-6">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Dynamic Style injection for custom print page formatting */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background-color: white !important;
            color: black !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" /> Consultor Técnico & Dossiês
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Consulte, arquive e enriqueça as especificações e relatórios de inteligência de todos os equipamentos Roder.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="font-bold text-xs uppercase"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Voltar
            </Button>
            
            {selectedModel && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyDossierToClipboard}
                  className="font-bold text-xs uppercase border-primary/20 hover:bg-primary/5 text-primary gap-1"
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar para WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="font-bold text-xs uppercase border-slate-300 gap-1"
                >
                  <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={saving}
                  onClick={saveDossier}
                  className="font-bold text-xs uppercase bg-green-600 hover:bg-green-700 text-white gap-1"
                >
                  <Save className="h-3.5 w-3.5" /> {saving ? 'Salvando...' : 'Salvar Dossiê'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl max-w-sm no-print border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setMainTab('tecnico')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-black uppercase tracking-wider rounded-lg transition duration-150 cursor-pointer border-0 ${
              mainTab === 'tecnico'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-transparent'
            }`}
          >
            <Wrench className="h-4 w-4" /> Dossiê de Produtos
          </button>
          <button
            onClick={() => setMainTab('comercial')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-black uppercase tracking-wider rounded-lg transition duration-150 cursor-pointer border-0 ${
              mainTab === 'comercial'
                ? 'bg-purple-650 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 bg-transparent'
            }`}
          >
            <Brain className="h-4 w-4" /> Diretrizes Comerciais
          </button>
        </div>

        {mainTab === 'tecnico' ? (
          <>
            {/* Selection Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
          {/* Select Product */}
          <Card className="shadow-xs border-border">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> 1. Escolher Equipamento
              </CardTitle>
              <CardDescription className="text-[11px]">Selecione a categoria de produto do catálogo Roder</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto">
                {products.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">Carregando catálogo Roder...</div>
                ) : (
                  products.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setSelectedModel(null);
                      }}
                      className={`flex items-center justify-between p-2 px-3 text-left rounded-xl border text-xs font-bold transition duration-150 ${
                        selectedProduct?.id === prod.id
                          ? 'bg-primary/10 border-primary text-primary shadow-xs'
                          : 'border-border hover:bg-muted/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{prod.name}</span>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold py-0">{prod.category}</Badge>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Select Model */}
          <Card className={`shadow-xs border-border transition-opacity ${!selectedProduct ? 'opacity-45 pointer-events-none' : ''}`}>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" /> 2. Selecionar Modelo
              </CardTitle>
              <CardDescription className="text-[11px]">Escolha um modelo específico para ver seu dossiê técnico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto">
                {selectedProduct ? (
                  selectedProduct.models && selectedProduct.models.length > 0 ? (
                    selectedProduct.models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model)}
                        className={`flex items-center justify-between p-2 px-3 text-left rounded-xl border text-xs font-bold transition duration-150 ${
                          selectedModel?.id === model.id
                            ? 'bg-primary/10 border-primary text-primary shadow-xs'
                            : 'border-border hover:bg-muted/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{model.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">Este produto não possui modelos cadastrados.</div>
                  )
                ) : (
                  <div className="text-center py-4 text-xs text-muted-foreground">Por favor, selecione primeiro um equipamento à esquerda.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dossier Workspace Container */}
        {selectedProduct && selectedModel ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT SIDE: Input & Enrichment (No print) */}
            <div className="lg:col-span-5 space-y-4 no-print">
              
              {/* Tab Selector */}
              <div className="flex bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                    activeTab === 'preview' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Ver Dossiê Consolidado
                </button>
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                    activeTab === 'edit' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Editar & Enriquecer Dados
                </button>
              </div>

              {activeTab === 'edit' ? (
                /* Enrichment Editors */
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <Card className="border-border">
                    <CardHeader className="py-4">
                      <CardTitle className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                        Campos Estruturados do Dossiê
                      </CardTitle>
                      <CardDescription className="text-[10px]">Edite e separe as informações do dossiê por categoria</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-4">
                      
                      {/* 1. Technical Report */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                          <span>1. Relatório do Dossiê</span>
                          <span className="text-[9px] text-primary lowercase">Geral / Introdução</span>
                        </Label>
                        <Textarea
                          value={dossierText}
                          onChange={(e) => setDossierText(e.target.value)}
                          placeholder="Texto técnico introdutório que detalha o equipamento no dossiê..."
                          className="min-h-[110px] text-xs resize-y"
                        />
                      </div>

                      {/* 2. Compatibility */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                          <span>2. Compatibilidade de Máquina</span>
                          <span className="text-[9px] text-orange-500 lowercase">Escavadeiras, Tratores, Peso</span>
                        </Label>
                        <Textarea
                          value={compatibilityNotes}
                          onChange={(e) => setCompatibilityNotes(e.target.value)}
                          placeholder="Detalhe a compatibilidade do modelo com as máquinas bases e seus pesos sugeridos..."
                          className="min-h-[80px] text-xs resize-y"
                        />
                      </div>

                      {/* 3. Reason of Choice */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                          <span>3. Motivo da Escolha / Tipo de Seleção</span>
                          <span className="text-[9px] text-amber-500 lowercase">Diferenciais e Aplicações</span>
                        </Label>
                        <Textarea
                          value={choiceReason}
                          onChange={(e) => setChoiceReason(e.target.value)}
                          placeholder="Indique por que escolher este modelo em relação aos outros..."
                          className="min-h-[80px] text-xs resize-y"
                        />
                      </div>

                      {/* 4. Productivity */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                          <span>4. Dados de Produtividade</span>
                          <span className="text-[9px] text-green-500 lowercase">Métricas de rendimento operacional</span>
                        </Label>
                        <Textarea
                          value={productivityInfo}
                          onChange={(e) => setProductivityInfo(e.target.value)}
                          placeholder="Informações de capacidade de arraste, corte ou m³ por hora..."
                          className="min-h-[80px] text-xs resize-y"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Audio & Documents Attachment Panel */}
                  <Card className="border-border">
                    <CardHeader className="py-4">
                      <CardTitle className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                        Gravação Técnica & Anexos
                      </CardTitle>
                      <CardDescription className="text-[10px]">Grave áudios explicativos ou faça upload de manuais/documentos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-4">
                      
                      {/* Audio Recording UI */}
                      <div className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <Label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Volume2 className="h-3.5 w-3.5 text-primary" /> Gravador Roder IA
                        </Label>
                        
                        {isRecording ? (
                          <div className="space-y-3 flex flex-col items-center">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                              <span className="text-xs font-mono font-black text-red-500 uppercase">GRAVANDO NOTA TÉCNICA...</span>
                            </div>
                            <p className="text-xl font-mono font-black text-slate-900 dark:text-white leading-none">{formatTime(recordingTime)}</p>
                            <Button
                              type="button"
                              onClick={stopRecording}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase px-4 h-8 rounded-full gap-1"
                            >
                              <Square className="h-3 w-3 fill-white" /> Finalizar & Carregar
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2 text-center flex flex-col items-center">
                            <p className="text-[10px] text-muted-foreground leading-relaxed max-w-xs">
                              Clique para falar sobre este modelo. O áudio será salvo no dossiê para consulta dos vendedores da Roder.
                            </p>
                            <Button
                              type="button"
                              onClick={startRecording}
                              className="bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase px-5 h-8.5 rounded-full gap-1.5 shadow-sm"
                            >
                              <Mic className="h-3.5 w-3.5" /> Gravar Áudio Técnico
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Support Documents Upload (Drag & Drop) */}
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleFileUpload}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                          isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-slate-400 dark:border-slate-700'
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden" 
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        />
                        <FileUp className="h-8 w-8 text-muted-foreground mx-auto mb-1.5" />
                        <span className="text-xs font-bold block text-slate-700 dark:text-slate-300">Anexar Documento</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">Arraste aqui ou clique para selecionar (PDF, DOCX, XLS, Imagens de até 15MB)</span>
                      </div>

                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* Quick info preview helper cards at the left when preview tab is selected */
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <Card className="border-border">
                    <CardHeader className="py-3">
                      <CardTitle className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">Modelo em Foco</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5 pb-4 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Categoria do Produto:</span>
                        <span className="font-bold text-foreground uppercase">{selectedProduct.category}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Código do Modelo:</span>
                        <span className="font-bold text-foreground font-mono">{selectedModel.id.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Média Base Sugerida:</span>
                        <span className="font-bold text-foreground uppercase truncate max-w-[200px]">{selectedModel.technical_specs?.maquina_base || 'Não informada'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Document & Audio lists when in quick preview tab */}
                  {(attachments.length > 0 || audios.length > 0) && (
                    <Card className="border-border">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">Arquivos de Inteligência</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pb-3">
                        {audios.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">Áudios Gravados</span>
                            <div className="space-y-1">
                              {audios.map((audio, idx) => (
                                <div key={idx} className="flex items-center justify-between p-1.5 border border-border bg-muted/30 rounded-lg text-xs">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Volume2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span className="truncate font-medium text-slate-700 dark:text-slate-300 text-[11px]">{audio.name}</span>
                                  </div>
                                  <a
                                    href={audio.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-primary text-white rounded hover:bg-primary/95 shrink-0"
                                    title="Tocar / Baixar"
                                  >
                                    <Play className="h-3 w-3 fill-white" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {attachments.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">Manuais e Documentos</span>
                            <div className="space-y-1">
                              {attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-1.5 border border-border bg-muted/30 rounded-lg text-xs">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <FileText className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                    <span className="truncate font-medium text-slate-700 dark:text-slate-300 text-[11px]">{file.name}</span>
                                  </div>
                                  <a
                                    href={file.url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-300 shrink-0"
                                    title="Baixar Arquivo"
                                  >
                                    <Download className="h-3 w-3" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT SIDE: Beautiful PDF-Style Dossier Preview (Print targets this area) */}
            <div className="lg:col-span-7" id="print-area">
              <Card className="border border-slate-300 dark:border-slate-850 shadow-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden relative">
                
                {/* Visual Accent */}
                <div className="h-2 w-full bg-linear-to-r from-orange-500 via-primary to-amber-500" />
                
                <CardContent className="p-6 md:p-8 space-y-6">
                  
                  {/* Document Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-5 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Badge variant="default" className="bg-primary hover:bg-primary text-white font-extrabold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm">
                          Dossiê Técnico Autorizado
                        </Badge>
                        <Badge variant="outline" className="text-[9px] uppercase border-slate-300 text-slate-500 dark:border-slate-800 dark:text-slate-400 font-mono">
                          ID: {selectedProduct.id.substring(0, 5).toUpperCase()}_{selectedModel.id.toUpperCase()}
                        </Badge>
                      </div>
                      <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white leading-tight">
                        {selectedProduct.name}
                      </h2>
                      <p className="text-md font-bold text-primary tracking-tight">
                        Modelo de Performance: {selectedModel.name}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Criado: {createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</span>
                        <span className="mx-1">•</span>
                        <span>Última mod: {new Date().toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Logo Roder */}
                    <div className="flex flex-col items-center sm:items-end justify-center shrink-0 self-center sm:self-start">
                      <div className="w-24 h-11 bg-white flex items-center justify-center p-1 rounded-sm border border-slate-200 shadow-xs">
                        <img 
                          src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" 
                          alt="Roder Brasil Logo" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) parent.innerHTML = '<span class="text-sm font-black text-primary tracking-tight">RODER</span>';
                          }}
                        />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">Roder Indica V2</span>
                    </div>
                  </div>

                  {/* 1. Technical Report */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-900 pb-1">
                      <FileCheck className="h-4 w-4 text-primary shrink-0" /> 1. Descrição & Relatório Técnico
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-justify whitespace-pre-wrap">
                      {dossierText || "Sem relatório descritivo cadastrado. Preencha este campo na aba 'Editar'."}
                    </p>
                  </div>

                  {/* 2. Compatibility Notes */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-orange-500 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-900 pb-1">
                      <Layers className="h-4 w-4 text-orange-500 shrink-0" /> 2. Compatibilidade & Máquinas Portadoras
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-justify whitespace-pre-wrap">
                      {compatibilityNotes || "Sem especificações de compatibilidade cadastradas."}
                    </p>
                  </div>

                  {/* 3. Reason for Choice / Application */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-900 pb-1">
                      <Activity className="h-4 w-4 text-amber-500 shrink-0" /> 3. Motivo da Escolha & Campo de Aplicação
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-justify whitespace-pre-wrap">
                      {choiceReason || "Nenhum motivo ou justificativa de escolha inserida ainda."}
                    </p>
                  </div>

                  {/* 4. Productivity metrics */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-green-500 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-900 pb-1">
                      <Volume2 className="h-4 w-4 text-green-500 shrink-0" /> 4. Produtividade & Rendimento Estimado
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-justify whitespace-pre-wrap">
                      {productivityInfo || "Sem dados de produtividade cadastrados."}
                    </p>
                  </div>

                  {/* 5. Model technical specs */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-900 pb-1">
                      <Settings className="h-4 w-4 text-slate-500 shrink-0" /> 5. Ficha Técnica de Especificações
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {selectedModel.technical_specs && Object.keys(selectedModel.technical_specs).length > 0 ? (
                        Object.entries(selectedModel.technical_specs).map(([key, val]) => (
                          <div 
                            key={key} 
                            className="flex items-center justify-between p-2 border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/40 rounded"
                          >
                            <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider truncate max-w-[120px]">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">
                              {val ? String(val) : '-'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center text-xs text-muted-foreground py-2">Ficha técnica vazia ou não preenchida.</div>
                      )}
                    </div>
                  </div>

                  {/* Attachment Document indicators inside print preview if present */}
                  {attachments.length > 0 && (
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-border/45 text-[11px] leading-relaxed">
                      <p className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[9px]">Documentos de Apoio Disponíveis:</p>
                      <ul className="list-disc list-inside space-y-0.5 font-medium text-slate-600 dark:text-slate-400">
                        {attachments.map((file, idx) => (
                          <li key={idx} className="truncate">
                            {file.name} <span className="text-[9px] text-muted-foreground font-mono">({new Date(file.uploadedAt).toLocaleDateString('pt-BR')})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Document Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-5 gap-3">
                    <p className="text-[10px] font-mono text-muted-foreground text-center sm:text-left">
                      Dossiê gerado e sincronizado pelo sistema Roder Indica V2. Todos os direitos reservados.
                    </p>
                    {selectedProduct.pdf_url && (
                      <a 
                        href={selectedProduct.pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-extrabold uppercase text-primary tracking-wider hover:underline flex items-center gap-1 no-print"
                      >
                        Ver Catálogo Completo <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                </CardContent>
              </Card>
            </div>

          </div>
        ) : (
          /* Empty selection state */
          <div className="flex flex-col items-center justify-center min-h-[40vh] border border-dashed rounded-2xl bg-muted/20 p-8 text-center no-print">
            <BookOpen className="h-12 w-12 text-muted-foreground/60 mb-2 animate-pulse" />
            <h3 className="text-sm font-black uppercase text-slate-700 dark:text-slate-300">Escolha um Equipamento</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
              Utilize os seletores no painel superior para escolher uma categoria e depois o modelo desejado. O sistema carregará ou preencherá o dossiê técnico completo.
            </p>
          </div>
        )}
          </>
        ) : (
          /* --- BRAND NEW COMMERCIAL GUIDELINES WORKSPACE --- */
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            
            {/* Header Control Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-purple-650/5 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 p-4 rounded-2xl no-print">
              <div className="space-y-1">
                <h2 className="text-base font-black uppercase text-purple-900 dark:text-purple-400 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" /> Dossiê de Diretrizes Comerciais & Negociações
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  Este dossiê compila todas as diretrizes de vendas, formas de pagamento, regras de comissão e propostas comerciais que guiam a equipe comercial Roder.
                </p>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => setIsAddingGuideline(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2 flex items-center gap-1 border-0 cursor-pointer rounded-xl"
                >
                  <Plus className="h-4 w-4" /> Adicionar Diretriz
                </Button>
                
                <Button
                  onClick={() => setIsCommercialReportOpen(true)}
                  variant="outline"
                  className="border-purple-300 dark:border-purple-900 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs font-black uppercase tracking-wider px-4 py-2 flex items-center gap-1 cursor-pointer rounded-xl"
                >
                  <Printer className="h-4 w-4" /> Imprimir Dossiê Completo
                </Button>
              </div>
            </div>

            {/* Search and Quick Filters */}
            <div className="flex items-center gap-2 max-w-md no-print">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Pesquisar por assunto ou instrução comercial..."
                  value={guidelineSearch}
                  onChange={(e) => setGuidelineSearch(e.target.value)}
                  className="pl-9 pr-9 text-xs py-2 h-9 bg-background"
                />
                {guidelineSearch && (
                  <button
                    type="button"
                    onClick={() => setGuidelineSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Add Guideline Card */}
            {isAddingGuideline && (
              <Card className="border-2 border-purple-500/30 dark:border-purple-500/20 shadow-lg no-print animate-in slide-in-from-top-4 duration-200 rounded-2xl">
                <CardHeader className="py-4 bg-purple-500/5 border-b border-purple-100 dark:border-purple-950/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase text-purple-950 dark:text-purple-400 flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Cadastrar Nova Diretriz / Regra Comercial
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsAddingGuideline(false)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-[11px] text-slate-500">
                    A nova diretriz será adicionada instantaneamente ao dossiê de diretrizes e integrada ao cérebro da Roder IA para responder aos vendedores.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Assunto / Título da Diretriz</Label>
                    <Input
                      type="text"
                      placeholder="Ex: Formas de Pagamento e Prazos de Validade de Propostas"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-slate-500 tracking-wider flex items-center justify-between">
                      <span>Instrução de Venda / Diretriz Detalhada</span>
                      <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400">Texto formatado</span>
                    </Label>
                    <Textarea
                      rows={6}
                      placeholder="Escreva ou grave por voz a diretriz comercial correspondente..."
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      className="text-xs font-medium"
                    />
                  </div>

                  {/* Audio recording for commercial directives */}
                  <div className="pt-2">
                    {isGuidelineRecording ? (
                      <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 border border-red-500/30 rounded-xl p-3 text-xs text-red-900 dark:text-red-200">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          </span>
                          <span className="font-bold animate-pulse uppercase text-[10px] tracking-wider">Gravando instrução por voz... {formatTime(guidelineRecordingTime)}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={stopGuidelineRecording}
                          className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1 border-0 cursor-pointer"
                        >
                          <Square className="h-3.5 w-3.5 fill-white" /> Transcrever
                        </Button>
                      </div>
                    ) : isGuidelineTranscribing ? (
                      <div className="flex items-center gap-2 bg-slate-150 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        <span className="font-semibold">Roder IA transcrevendo áudio com precisão técnica...</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startGuidelineRecording}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 text-purple-700 dark:text-purple-400 font-extrabold uppercase text-[10px] tracking-wider rounded-xl transition duration-150 cursor-pointer border-0"
                      >
                        <Mic className="h-4 w-4 text-purple-650" />
                        Falar por Áudio (Gravar Voz para Transcrever)
                      </button>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="py-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-950/20 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingGuideline(false)}
                    className="text-xs uppercase font-extrabold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddGuideline}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs uppercase font-black px-4 border-0 cursor-pointer rounded-lg"
                  >
                    Anexar ao Dossiê Comercial
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Guidelines List Grid */}
            {loadingGuidelines ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <p className="text-xs text-slate-500 font-medium">Carregando diretrizes e diretivas comerciais...</p>
              </div>
            ) : guidelines.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-2xl bg-muted/20 p-8">
                <Brain className="h-10 w-10 text-muted-foreground/60 mb-2" />
                <h3 className="text-sm font-black uppercase text-slate-700">Nenhuma Diretriz Encontrada</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
                  Cadastre a sua primeira diretriz comercial utilizando o botão no topo direito. Elas serão arquivadas e ensinadas à IA da Roder.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guidelines
                  .filter(g => 
                    !guidelineSearch || 
                    g.question?.toLowerCase().includes(guidelineSearch.toLowerCase()) || 
                    g.improvedAnswer?.toLowerCase().includes(guidelineSearch.toLowerCase())
                  )
                  .map((g, idx) => (
                    <Card 
                      key={g.id || idx} 
                      className={`border border-slate-200 dark:border-slate-850 shadow-xs relative overflow-hidden transition duration-150 hover:shadow-md ${
                        editingGuidelineId === g.id ? 'ring-2 ring-purple-600/30' : ''
                      }`}
                    >
                      {/* Left colored bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-650" />

                      {editingGuidelineId === g.id ? (
                        /* Inline Edit Mode */
                        <div className="p-4 space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-black text-slate-500">Título / Assunto</Label>
                            <Input
                              type="text"
                              value={editingQuestion}
                              onChange={(e) => setEditingQuestion(e.target.value)}
                              className="text-xs font-bold"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-black text-slate-500">Diretriz</Label>
                            <Textarea
                              rows={5}
                              value={editingAnswer}
                              onChange={(e) => setEditingAnswer(e.target.value)}
                              className="text-xs font-medium"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setEditingGuidelineId(null)}
                               className="h-8 text-[10px] uppercase font-bold"
                             >
                               Cancelar
                             </Button>
                             <Button
                               onClick={() => handleUpdateGuideline(g.id)}
                               size="sm"
                               className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-[10px] uppercase font-black border-0 cursor-pointer"
                             >
                               Salvar Alteração
                             </Button>
                          </div>
                        </div>
                      ) : (
                        /* Regular Card View */
                        <div className="p-5 flex flex-col justify-between h-full space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <Badge className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-[9px] uppercase font-extrabold px-2 py-0.5 border-0 rounded">
                                Diretriz Comercial
                              </Badge>
                              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 font-semibold">
                                {g.timestamp ? new Date(g.timestamp).toLocaleDateString('pt-BR') : 'Sem data'}
                              </span>
                            </div>

                            <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wide leading-tight line-clamp-1">
                              {g.question}
                            </h3>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify whitespace-pre-wrap break-words line-clamp-6 font-medium">
                              {g.improvedAnswer}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-900/60 flex items-center justify-between">
                            <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[120px]" title={g.author || 'Gerência'}>
                              Autor: {g.author?.split('@')[0] || 'Gerente'}
                            </span>

                            <div className="flex items-center gap-1.5 no-print">
                              <button
                                onClick={() => copyGuidelineToClipboard(g)}
                                className="p-1.5 rounded bg-purple-500/5 hover:bg-purple-500/15 text-purple-600 hover:text-purple-700 border-0 cursor-pointer transition"
                                title="Copiar para WhatsApp"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingGuidelineId(g.id);
                                  setEditingQuestion(g.question);
                                  setEditingAnswer(g.improvedAnswer);
                                }}
                                className="p-1.5 rounded bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-0 cursor-pointer transition"
                                title="Editar Diretriz"
                              >
                                  <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGuideline(g.id)}
                                className="p-1.5 rounded bg-red-50 dark:bg-red-950/20 hover:bg-red-100 text-red-600 border-0 cursor-pointer transition"
                                title="Excluir Diretriz"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Printable Full Commercial Guidelines Dossier Modal */}
        {isCommercialReportOpen && (
          <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
              {/* Header */}
              <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <span className="font-extrabold text-sm tracking-tight text-white uppercase">Dossiê de Diretrizes Comerciais</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => window.print()}
                    className="bg-purple-650 hover:bg-purple-700 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-lg px-3 py-1.5 border-0 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir Dossiê
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => setIsCommercialReportOpen(false)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-0 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Printable Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 flex items-center justify-center">
                <div 
                  id="print-area-comercial" 
                  className="bg-white text-slate-900 w-full max-w-[800px] p-10 rounded-xl shadow-lg border border-slate-200 flex flex-col font-sans"
                  style={{ width: '800px', minHeight: '1000px' }}
                >
                  {/* Roder Logo Section */}
                  <div className="flex items-center justify-between border-b-2 border-purple-500 pb-5 mb-8">
                    <div className="flex items-center gap-4">
                      <img 
                        src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" 
                        alt="Roder Logo" 
                        className="h-10 object-contain" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="border-l-2 border-slate-300 pl-4">
                        <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">Roder Brasil</h1>
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest font-mono">Dossiê de Diretrizes Comerciais & Negociações</p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] font-mono text-slate-500 font-semibold space-y-0.5">
                      <p className="uppercase">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                      <p className="uppercase text-purple-600">Sistema: Roder Indica V2</p>
                      <p className="uppercase">Uso Interno e Confidencial</p>
                    </div>
                  </div>

                  {/* Summary / Metadata Cover */}
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-8 space-y-2">
                    <h3 className="text-xs font-black uppercase text-purple-900 tracking-wider">Apresentação do Dossiê</h3>
                    <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
                      Este documento reúne o conjunto consolidado de instruções comerciais, formas de pagamento, regras de validação de propostas e políticas de comissionamento da Roder Brasil. Ele é projetado para instrução de novos vendedores e para conferência de regras de negócio em negociações ativas.
                    </p>
                  </div>

                  {/* Guidelines Loop */}
                  <div className="space-y-8 flex-1">
                    {guidelines.map((g, index) => (
                      <div key={g.id || index} className="space-y-2 break-inside-avoid">
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-purple-200 pb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="h-4 w-4 bg-purple-650 text-white rounded-full flex items-center justify-center text-[10px] font-black">{index + 1}</span>
                            {g.question}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 font-semibold">
                            {g.timestamp ? new Date(g.timestamp).toLocaleDateString('pt-BR') : 'n/d'}
                          </span>
                        </h2>
                        <p className="text-xs text-slate-850 leading-relaxed text-justify whitespace-pre-wrap pl-5 font-medium">
                          {g.improvedAnswer}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="mt-12 pt-5 border-t border-slate-200 flex items-center justify-between shrink-0">
                    <p className="text-[9px] font-mono text-slate-400 font-semibold">
                      © {new Date().getFullYear()} Roder Brasil • Equipamentos Florestais e Industriais
                    </p>
                    <div className="bg-purple-50 border border-purple-150 text-purple-700 text-[9px] font-black px-3 py-1 rounded uppercase tracking-wider font-mono">
                      Confidencial - Diretoria Comercial
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer info */}
              <div className="bg-slate-950 p-4 border-t border-slate-800 text-center text-xs text-slate-400">
                O dossiê está pronto para impressão. Pressione <span className="text-purple-400 font-bold">Imprimir Dossiê</span> para salvar como PDF ou enviar para sua impressora.
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
