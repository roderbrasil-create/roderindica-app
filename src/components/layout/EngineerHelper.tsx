import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, Calculator, Wrench, HelpCircle, AlertTriangle, Play, RefreshCw, Trash2, ChevronLeft, ChevronRight, CheckCircle, Package, Layers, Tractor, FileText, Mic, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { askEngineerHelper, transcribeAudio } from '../../services/geminiService';
import { useAuth } from '../../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Product, ProductModel, StockItem } from '../../types';
import { MACHINES, MATERIALS, getRecommendedBucket, calculateDischargeHeights, getHighTipBucketWeight } from '../catalog/HighTipData';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function EngineerHelper() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loadingExplorer, setLoadingExplorer] = useState(false);

  // Explorer states for interactive navigation
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedWeightBand, setSelectedWeightBand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ProductModel | null>(null);

  // States for Caçamba guided steps
  const [cacambaStep, setCacambaStep] = useState<'material' | 'brand' | 'model' | 'result' | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedCacambaBrand, setSelectedCacambaBrand] = useState<string>('');
  const [selectedCacambaModel, setSelectedCacambaModel] = useState<any>(null);
  const [recommendedCacambaCap, setRecommendedCacambaCap] = useState<string>('');

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o **Consultor Técnico RODER** 🛠️. Estou aqui para ajudar você a dimensionar e indicar o equipamento Roder ideal para a sua máquina base (escavadeira, pá carregadeira ou trator), além de realizar cálculos de produtividade de garras florestais. Como posso te ajudar hoje?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('audio/webm');
  const [detailTab, setDetailTab] = useState<'specs' | 'productivity'>('specs');
  const [explorerMinimized, setExplorerMinimized] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Custom calculator state inside the helper
  const [calcOpen, setCalcOpen] = useState(false);
  const [grappleArea, setGrappleArea] = useState('0.4');
  const [woodLength, setWoodLength] = useState('3.0');
  const [cycleTime, setCycleTime] = useState('40');
  const [calcResult, setCalcResult] = useState<{
    weightPerCycle: number;
    cyclesPerHour: number;
    hourlyProductivity: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];

    if (loading) {
      // While loading, scroll to bottom to show the loading indicator
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (lastMsg.role === 'user') {
      // User sent a message, scroll to bottom so they see their query and loading status
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (lastMsg.role === 'assistant') {
      // Assistant replied. Let's scroll to the user's question (second-to-last message)
      // so the user's question and the beginning of the assistant's response are visible.
      const questionIndex = messages.length - 2;
      const questionElement = document.getElementById(`chat-message-${questionIndex}`);
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, loading]);

  // Fetch catalog and stock data on mount or open
  useEffect(() => {
    if (isOpen) {
      setLoadingExplorer(true);
      const fetchCatalogAndStock = async () => {
        try {
          const qProd = query(collection(db, 'products'), orderBy('name', 'asc'));
          const prodSnap = await getDocs(qProd);
          const prods = prodSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Product))
            .filter(p => !p.is_blocked);
          setCatalogProducts(prods);

          const qStock = query(collection(db, 'stock_items'));
          const stockSnap = await getDocs(qStock);
          const stock = stockSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
          setStockItems(stock);
        } catch (err) {
          console.error("Erro ao carregar dados do catálogo/estoque no consultor técnico:", err);
        } finally {
          setLoadingExplorer(false);
        }
      };
      fetchCatalogAndStock();
    }
  }, [isOpen]);

  const handleClearConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Olá! Conversa limpa. Sou o **Consultor Técnico RODER** 🛠️. Como posso te ajudar hoje?'
      }
    ]);
    setSelectedProduct(null);
    setSelectedWeightBand(null);
    setSelectedModel(null);
    setCalcResult(null);
    setCacambaStep(null);
    setSelectedMaterial(null);
    setSelectedCacambaBrand('');
    setSelectedCacambaModel(null);
    setRecommendedCacambaCap('');
  };

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || inputValue).trim();
    if (!queryText) return;

    if (!textToSend) {
      setInputValue('');
    }

    // Auto minimize compatibility explorer when typing/submitting text
    setExplorerMinimized(true);

    // Add user message
    const updatedMessages = [...messages, { role: 'user', content: queryText } as Message];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Ask backend Gemini
      const response = await askEngineerHelper(
        queryText,
        updatedMessages.slice(1, -1),
        {
          uid: user?.uid,
          name: profile?.name || user?.displayName || user?.email || 'Anônimo',
          email: profile?.email || user?.email || '',
          role: profile?.role || ''
        }
      );
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err: any) {
      console.error('Error in Engineer Helper:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Ops, ocorreu um erro ao conectar com o consultor técnico:** ${err.message || 'Por favor, tente novamente.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Seu navegador não suporta gravação de áudio ou a conexão não é segura (HTTPS).');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const types = [
        'audio/webm;codecs=opus', 
        'audio/webm', 
        'audio/mp4', 
        'audio/mpeg', 
        'audio/ogg;codecs=opus', 
        'audio/ogg', 
        'audio/wav', 
        'audio/aac'
      ];
      let mimeType = '';
      
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const typeToUse = mimeType || '';
      setRecordedMimeType(typeToUse);

      const options = typeToUse ? { mimeType: typeToUse } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          toast.error('Nenhum áudio capturado.');
          setTranscribing(false);
          return;
        }

        const finalType = typeToUse || audioChunksRef.current[0].type || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        setTranscribing(true);
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const resultStr = reader.result?.toString() || '';
          const base64data = resultStr.split(',')[1];
          
          if (base64data) {
            try {
              toast.loading('Processando seu áudio...', { id: 'voice-transcribe' });
              const transcription = await transcribeAudio(base64data, finalType, 'chat');
              toast.dismiss('voice-transcribe');
              
              if (transcription && !transcription.startsWith("Erro na transcrição")) {
                toast.success('Áudio transcrito com sucesso!');
                // Automatically send transcribed text to the assistant
                handleSend(transcription);
              } else {
                toast.error(transcription || 'A IA não conseguiu entender o áudio.');
              }
            } catch (error: any) {
              toast.dismiss('voice-transcribe');
              console.error("Transcription error:", error);
              toast.error('Erro de rede na transcrição.');
            }
          }
          setTranscribing(false);
        };
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      toast.success('Gravando áudio...');
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      toast.error('Permissão de microfone negada ou erro ao iniciar áudio.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const runCalculation = () => {
    const area = parseFloat(grappleArea);
    const length = parseFloat(woodLength);
    const cycle = parseFloat(cycleTime);

    if (isNaN(area) || isNaN(length) || isNaN(cycle) || cycle <= 0) {
      return;
    }

    // Roder rule of thumb: 1m³ of wood = 800kg
    // weight per cycle = Area (m²) * Length (m) * 800 kg/m³
    const weightPerCycle = area * length * 800;
    const cyclesPerHour = 3600 / cycle;
    const hourlyProductivity = (cyclesPerHour * weightPerCycle) / 1000; // in tons

    setCalcResult({
      weightPerCycle,
      cyclesPerHour,
      hourlyProductivity
    });
  };

  const applyCalcToChat = () => {
    if (!calcResult) return;
    const calcText = `Gostaria de analisar este cenário de produtividade:
- Área da Garra: **${grappleArea} m²**
- Comprimento da Madeira: **${woodLength} m**
- Tempo de Ciclo: **${cycleTime} s**

O cálculo simplificado indica:
- Carga por ciclo: **${calcResult.weightPerCycle.toFixed(0)} kg** (${(calcResult.weightPerCycle / 1000).toFixed(2)} t)
- Ciclos por hora: **${calcResult.cyclesPerHour.toFixed(0)} ciclos**
- Produtividade horária estimada: **${calcResult.hourlyProductivity.toFixed(2)} t/h**

Você poderia detalhar se esta produtividade é ideal e qual modelo Roder/FAE se adequa a esse ciclo?`;
    
    setCalcOpen(false);
    handleSend(calcText);
  };

  // Helper to extract distinct weight bands from product models
  const getWeightBands = (prod: Product) => {
    if (!prod.models) return [];
    const bands = new Set<string>();
    prod.models.forEach(m => {
      const mb = m.technical_specs?.maquina_base || m.technical_specs?.peso_operacional;
      if (mb) bands.add(mb.trim());
    });
    return Array.from(bands);
  };

  // Helper to filter models compatible with a selected band
  const getCompatibleModels = (prod: Product, band: string) => {
    if (!prod.models) return [];
    return prod.models.filter(m => {
      const mb = m.technical_specs?.maquina_base || m.technical_specs?.peso_operacional;
      return mb && mb.trim().toLowerCase() === band.toLowerCase();
    });
  };

  // Helper to check if model has physical stock available
  const checkModelStock = (model: ProductModel) => {
    const cleanModelName = (model.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const inStock = stockItems.some(item => {
      if (item.quantity <= 0) return false;
      const cleanStockDesc = (item.description || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanStockDesc.includes(cleanModelName) || cleanModelName.includes(cleanStockDesc);
    });
    return inStock;
  };

  // Handle equipment redirection
  const handleMakeIndication = (prod: Product, model: ProductModel) => {
    const productFullName = `${prod.name} - ${model.name}`;
    setIsOpen(false);
    navigate('/indicacoes/nova', { state: { product_name: productFullName } });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-[100] font-sans">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex items-center gap-2 p-2.5 px-3 sm:p-3.5 sm:px-5 rounded-full shadow-2xl text-white ${
            isOpen ? 'bg-slate-700 hover:bg-slate-800' : 'bg-primary hover:bg-primary/90'
          }`}
          style={{ boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)' }}
        >
          {isOpen ? (
            <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          ) : (
            <Wrench className="h-4.5 w-4.5 sm:h-5 sm:w-5 animate-bounce" />
          )}
          
          <div className="flex flex-col items-start leading-none text-left">
            <span className="text-[7.5px] sm:text-[9px] opacity-80 font-medium uppercase tracking-wider">
              {isOpen ? 'Assistente' : 'Consultor Técnico'}
            </span>
            <span className="text-[9.5px] sm:text-xs font-black tracking-tight uppercase">
              {isOpen ? 'Fechar ✕' : 'Roder IA'}
            </span>
          </div>

          <div className="absolute -top-1.5 -right-1 bg-amber-500 text-slate-950 font-black text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse border border-white">
            IA
          </div>
        </motion.button>
      </div>

      {/* Floating Chat Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-22 right-4 sm:right-6 w-[94vw] sm:w-[480px] h-[86vh] sm:h-[80vh] max-h-[820px] sm:max-h-[720px] bg-slate-900 border border-slate-800 rounded-2xl shadow-3xl flex flex-col overflow-hidden z-[99] text-white font-sans"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-primary to-slate-850 border-b border-slate-800 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Wrench className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1">
                    Consultor Técnico Roder
                    <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded uppercase tracking-widest">IA</span>
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium font-mono">DIMENSIONAMENTO E COMPATIBILIDADE</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs gap-1.5"
                  onClick={handleClearConversation}
                  title="Limpar Conversa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Limpar</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-slate-300 hover:text-white text-xs gap-1 hover:bg-white/15"
                  onClick={() => setCalcOpen(!calcOpen)}
                >
                  <Calculator className="h-4 w-4" />
                  <span className="hidden xs:inline">Calculadora</span>
                </Button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors flex items-center justify-center"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Timber Grab Calculator Panel overlay */}
            <AnimatePresence>
              {calcOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-slate-950 border-b border-slate-800 space-y-3 z-10"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="h-3.5 w-3.5" /> Simulador de Produtividade de Garra
                    </h4>
                    <button onClick={() => setCalcOpen(false)} className="text-slate-400 hover:text-white text-xs">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Área Garra (m²)</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="3.0"
                        value={grappleArea}
                        onChange={(e) => setGrappleArea(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 p-1.5 rounded text-white text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Mad. Compr. (m)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="10"
                        value={woodLength}
                        onChange={(e) => setWoodLength(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 p-1.5 rounded text-white text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Tempo Ciclo (s)</label>
                      <input
                        type="number"
                        step="5"
                        min="5"
                        max="300"
                        value={cycleTime}
                        onChange={(e) => setCycleTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 p-1.5 rounded text-white text-center font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold uppercase text-[10px]"
                      onClick={runCalculation}
                    >
                      Calcular Produtividade
                    </Button>
                    {calcResult && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-700 hover:bg-white/10 text-white font-extrabold uppercase text-[10px]"
                        onClick={applyCalcToChat}
                      >
                        Enviar p/ Consultar IA
                      </Button>
                    )}
                  </div>

                  {calcResult && (
                    <div className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase">Carga/Ciclo</p>
                        <p className="text-xs font-black text-white">{calcResult.weightPerCycle.toFixed(0)} kg</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase">Ciclos/Hora</p>
                        <p className="text-xs font-black text-white">{calcResult.cyclesPerHour.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-amber-400 uppercase">Produtividade</p>
                        <p className="text-xs font-black text-amber-400">{calcResult.hourlyProductivity.toFixed(1)} t/h</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  id={`chat-message-${idx}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-slate-850 text-slate-100 border border-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert max-w-none text-xs text-slate-200 space-y-2 markdown-body">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-slate-850 border border-slate-800 text-slate-300 rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span>Consultor Técnico analisando dados...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Dynamic Interactive Catalog Explorer Panel */}
            <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3 shadow-inner">
              {explorerMinimized ? (
                <div className="flex items-center justify-between py-1 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg">
                      <Layers className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider leading-none">Explorador de Compatibilidade</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">Catálogo de equipamentos e modelos compatíveis</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExplorerMinimized(false)}
                    className="h-7 px-3 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition duration-150 flex items-center gap-1 shadow"
                  >
                    <ChevronRight className="h-3 w-3 rotate-270" /> Abrir Catálogo
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" /> Explorador de Compatibilidade
                    </p>
                    <div className="flex items-center gap-2">
                      {(selectedProduct || selectedWeightBand || selectedModel || cacambaStep) && (
                        <button 
                          onClick={() => {
                            setSelectedProduct(null);
                            setSelectedWeightBand(null);
                            setSelectedModel(null);
                            setCacambaStep(null);
                            setSelectedMaterial(null);
                            setSelectedCacambaBrand('');
                            setSelectedCacambaModel(null);
                            setRecommendedCacambaCap('');
                          }}
                          className="text-[10px] text-slate-400 hover:text-white uppercase font-black tracking-tight"
                        >
                          Reiniciar Guia ✕
                        </button>
                      )}
                      <button
                        onClick={() => setExplorerMinimized(true)}
                        className="text-[10px] text-slate-400 hover:text-amber-400 uppercase font-black tracking-tight border border-slate-800 hover:border-slate-750 px-2 py-0.5 rounded transition"
                        title="Minimizar Explorador"
                      >
                        Minimizar ─
                      </button>
                    </div>
                  </div>

                  {loadingExplorer ? (
                    <div className="py-6 flex justify-center items-center gap-2 text-xs text-slate-400">
                      <RefreshCw className="h-4 w-4 animate-spin text-amber-500" /> Carregando catálogo...
                    </div>
                  ) : !selectedProduct ? (
                /* Step 1: Show list of all available catalog products */
                <div className="space-y-2">
                  <div className="text-slate-300 text-xs font-semibold pb-1 font-mono">
                    • Descreva o que você precisa no chat acima OU clique no equipamento abaixo para consultar:
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {catalogProducts.map(prod => (
                      <button
                        key={prod.id}
                        onClick={() => {
                          setSelectedProduct(prod);
                          setSelectedWeightBand(null);
                          setSelectedModel(null);
                          if (prod.name.toLowerCase().includes('caçamba')) {
                            setCacambaStep('material');
                          } else {
                            setCacambaStep(null);
                          }
                        }}
                        className="text-left text-[11px] font-bold bg-slate-850 hover:bg-primary/20 hover:border-primary/40 text-slate-200 border border-slate-800 py-2 px-2.5 rounded-xl transition-all duration-200 truncate shadow-sm flex items-center justify-between group"
                      >
                        <span className="truncate">{prod.name}</span>
                        <ChevronRight className="h-3 w-3 text-slate-500 group-hover:text-primary transition-colors flex-shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : selectedProduct && selectedProduct.name.toLowerCase().includes('caçamba') ? (
                /* Caçamba Guided Wizard Flow */
                <div className="space-y-3">
                  {cacambaStep === 'material' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setSelectedProduct(null)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[11px] font-black text-slate-200 uppercase truncate">
                          Caçamba: Escolher Material
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Qual é o tipo de material que o cliente irá manusear? (A escolha depende totalmente da densidade):
                      </p>
                      <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                        {MATERIALS.map(mat => (
                          <button
                            key={mat.name}
                            onClick={() => {
                              setSelectedMaterial(mat);
                              setCacambaStep('brand');
                            }}
                            className="text-left text-[10px] font-bold bg-slate-850 hover:bg-amber-500/20 hover:border-amber-500/40 text-slate-200 border border-slate-800 py-1.5 px-2 rounded-xl transition truncate shadow-sm flex flex-col"
                          >
                            <span className="truncate text-slate-100">{mat.name}</span>
                            <span className="text-[8px] text-slate-400 font-mono mt-0.5">{mat.density} kg/m³ ({mat.class})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {cacambaStep === 'brand' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setCacambaStep('material')}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[11px] font-black text-slate-200 uppercase truncate">
                          Material: {selectedMaterial?.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Selecione a marca da Pá Carregadeira do cliente:
                      </p>
                      <div className="grid grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {Array.from(new Set(MACHINES.map(m => m.brand))).sort().map(brand => (
                          <button
                            key={brand}
                            onClick={() => {
                              setSelectedCacambaBrand(brand);
                              setCacambaStep('model');
                            }}
                            className="bg-slate-850 hover:bg-primary/20 border border-slate-800 text-[10px] font-black py-2 px-1.5 rounded-xl text-center text-slate-200 transition"
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {cacambaStep === 'model' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setCacambaStep('brand')}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[11px] font-black text-slate-200 uppercase truncate">
                          Carregadeira {selectedCacambaBrand}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Selecione o modelo exato ou faixa de peso da carregadeira:
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {MACHINES.filter(m => m.brand === selectedCacambaBrand).map(machine => (
                          <button
                            key={machine.model}
                            onClick={() => {
                              setSelectedCacambaModel(machine);
                              const recCap = getRecommendedBucket(machine, selectedMaterial?.density || 350);
                              setRecommendedCacambaCap(recCap);
                              setCacambaStep('result');
                            }}
                            className="text-left bg-slate-850 hover:bg-primary/20 border border-slate-800 p-2 rounded-xl transition flex flex-col"
                          >
                            <span className="text-[10px] font-bold text-slate-100">{machine.model}</span>
                            <span className="text-[8px] text-slate-400 font-mono">Porte: {machine.operatingWeight} t • Original: {machine.originalBucket}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {cacambaStep === 'result' && selectedCacambaModel && selectedMaterial && (
                    <div className="space-y-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => setCacambaStep('model')}
                            className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[11px] font-black text-amber-400 uppercase truncate">
                            Caçamba Recomendada: {recommendedCacambaCap} m³
                          </span>
                        </div>
                        {stockItems.some(item => {
                          const desc = (item.description || '').toLowerCase();
                          const capClean = String(recommendedCacambaCap).replace(',', '.');
                          return (desc.includes('caçamba') || desc.includes('high tip') || desc.includes('cacamba')) && desc.includes(capClean);
                        }) ? (
                          <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] font-black px-1.5 py-0.5 rounded">
                            Disponível hoje! ✅
                          </span>
                        ) : (
                          <span className="text-[8px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">Sob Encomenda</span>
                        )}
                      </div>

                      <div className="text-[10px] space-y-1 font-mono text-slate-300 max-h-[110px] overflow-y-auto pr-1 border-b border-slate-850 pb-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500 uppercase font-bold">Material:</span>
                          <span className="text-slate-200 font-semibold">{selectedMaterial.name} ({selectedMaterial.density} kg/m³)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 uppercase font-bold">Carregadeira:</span>
                          <span className="text-slate-200 font-semibold">{selectedCacambaBrand} {selectedCacambaModel.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 uppercase font-bold">Porte Máquina Base:</span>
                          <span className="text-slate-200 font-semibold">{selectedCacambaModel.operatingWeight} t</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 uppercase font-bold">Caçamba Original:</span>
                          <span className="text-slate-200 font-semibold">{selectedCacambaModel.originalBucket}</span>
                        </div>
                        {calculateDischargeHeights(selectedCacambaModel, recommendedCacambaCap) && (() => {
                          const heights = calculateDischargeHeights(selectedCacambaModel, recommendedCacambaCap);
                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500 uppercase font-bold">Alt. Descarga Original:</span>
                                <span className="text-slate-200 font-semibold">{heights.standardDischargeHeight.toFixed(2)} m</span>
                              </div>
                              <div className="flex justify-between text-emerald-400">
                                <span className="uppercase font-bold">Alt. Descarga High Tip:</span>
                                <span className="font-extrabold">{heights.highTipDischargeHeight.toFixed(2)} m</span>
                              </div>
                              <div className="flex justify-between text-amber-400 font-bold">
                                <span className="uppercase">Ganho Real Altura:</span>
                                <span>+{heights.gainHeight.toFixed(2)} m 🚀</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Warnings Display as requested */}
                      <div className="p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[9px] text-slate-300 leading-normal space-y-1 font-sans">
                        <p className="font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Verificações de Instalação e Acessórios
                        </p>
                        <p>
                          <strong>Atenção:</strong> É necessário que o vendedor interno realize o orçamento oficial completo, verificando a disponibilidade de acessórios essenciais como ponteiras, dentes, suportes de acoplamento ou kits de instalação (mangueiras, comandos, conexões).
                        </p>
                        <p>
                          Mesmo havendo o equipamento principal em estoque, é necessário consultar a disponibilidade técnica dos acessórios e kits de instalação para agendamento correto da entrega do produto, montagem física na máquina do cliente e entrega técnica em campo. Se o cliente mesmo optar por realizar a instalação por conta própria, o equipamento entregue diretamente de fábrica é uma excelente solução!
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            // Find matching model inside selectedProduct.models
                            const matchedModel = ((selectedProduct.models || []).find(m => {
                              const modelCap = (m.technical_specs as any)?.capacidade || m.name || '';
                              return modelCap.includes(recommendedCacambaCap);
                            }) || {
                              id: `ht-${recommendedCacambaCap}`,
                              name: `Caçamba High Tip ${recommendedCacambaCap} m³`,
                              technical_specs: { capacidade: `${recommendedCacambaCap} m³`, peso_estimado: `${getHighTipBucketWeight(recommendedCacambaCap)} kg` } as any
                            }) as ProductModel;
                            handleMakeIndication(selectedProduct, matchedModel);
                          }}
                          className="flex-1 bg-primary hover:bg-primary/95 text-white font-extrabold text-[10px] uppercase py-2 rounded-xl"
                        >
                          Realizar Indicação / Orçamento
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Send beautiful Technical Report text to the chat
                            const heights = calculateDischargeHeights(selectedCacambaModel, recommendedCacambaCap);
                            const inStock = stockItems.some(item => {
                              const desc = (item.description || '').toLowerCase();
                              const capClean = String(recommendedCacambaCap).replace(',', '.');
                              return (desc.includes('caçamba') || desc.includes('high tip') || desc.includes('cacamba')) && desc.includes(capClean);
                            });
                            const reportText = `### 📋 RELATÓRIO TÉCNICO DE DIMENSIONAMENTO DE CAÇAMBA HIGH TIP

*   **Cliente Base**: Pá Carregadeira **${selectedCacambaBrand} ${selectedCacambaModel.model}** (Porte: ${selectedCacambaModel.operatingWeight} t)
*   **Material Carregado**: **${selectedMaterial.name}** (Densidade: ${selectedMaterial.density} kg/m³ - Classificação: ${selectedMaterial.class})
*   **Caçamba Original Padrão**: ${selectedCacambaModel.originalBucket}

#### 🛠️ EQUIPAMENTO RODER RECOMENDADO
👉 **CAÇAMBA HIGH TIP RODER ${recommendedCacambaCap} m³**

*   **Peso Estimado da Caçamba**: ${getHighTipBucketWeight(recommendedCacambaCap)} kg
*   **Disponibilidade em Estoque**: ${inStock ? 'Disponível para faturamento imediato! ✅' : 'Sob Encomenda (Consulte prazo de fabricação)'}

#### 📈 COMPARAÇÃO DE ALTURAS DE DESCARGA
*   **Altura de Descarga Livre Original**: ${heights.standardDischargeHeight.toFixed(2)} metros
*   **Altura de Descarga com High Tip Roder**: **${heights.highTipDischargeHeight.toFixed(2)} metros**
*   **🚀 GANHO REAL DE ALTURA LIVRE**: **+${heights.gainHeight.toFixed(2)} metros**

#### ⚠️ DIRETRIZES DE ORÇAMENTO E INSTALAÇÃO
*   **Validação de Acessórios**: Sempre consulte o vendedor interno para verificar e precificar dentes, suportes ou ponteiras.
*   **Kits de Instalação**: Verifique a necessidade de mangueiras adicionais, comandos ou conexões dedicadas na máquina base.
*   **Instalação**: Se houver necessidade de montagem especializada pela fábrica, agende previamente com o setor técnico. Caso o cliente instale por conta própria, a entrega é faturada e despachada de imediato!`;
                            setMessages(prev => [...prev, { role: 'user', content: `Gerar Relatório de Dimensionamento da Caçamba para ${selectedCacambaBrand} ${selectedCacambaModel.model}` }, { role: 'assistant', content: reportText }]);
                          }}
                          className="border-slate-700 hover:bg-white/10 text-white font-extrabold text-[10px] uppercase py-2 rounded-xl flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" /> Relatório
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : !selectedWeightBand ? (
                /* Step 2: Show weight bands for selected product */
                <div className="space-y-3.5">
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setSelectedProduct(null)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[11px] font-black text-slate-200 truncate uppercase">
                      Equipamento: {selectedProduct.name}
                    </span>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-2.5">
                    <p className="text-xs font-bold text-slate-200">
                      Selecione um modelo de equipamento que você deseja de acordo com o tamanho da máquina base:
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Você já sabe o tamanho ou o modelo da escavadeira do cliente? Clique em uma faixa de tamanho:
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {getWeightBands(selectedProduct).length > 0 ? (
                        getWeightBands(selectedProduct).map(band => (
                          <button
                            key={band}
                            onClick={() => {
                              setSelectedWeightBand(band);
                              setSelectedModel(null);
                            }}
                            className="bg-primary/10 hover:bg-primary/25 border border-primary/30 text-primary-foreground hover:border-primary/60 text-xs font-black py-2 px-3 rounded-xl transition duration-150 shadow-sm"
                          >
                            Máquinas de {band}
                          </button>
                        ))
                      ) : (
                        /* Fallback if product has no specific weight bands listed */
                        <button
                          onClick={() => {
                            setSelectedWeightBand("Geral");
                            setSelectedModel(null);
                          }}
                          className="bg-primary/15 hover:bg-primary/25 border border-primary/40 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition"
                        >
                          Ver todos os modelos
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : !selectedModel ? (
                /* Step 3: Show compatible models for selected band */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <button 
                        onClick={() => setSelectedWeightBand(null)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[11px] font-black text-slate-200 truncate uppercase">
                        {selectedProduct.name} (Faixa {selectedWeightBand})
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-300 font-mono">
                    • Modelos compatíveis encontrados:
                  </p>

                  <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto">
                    {getCompatibleModels(selectedProduct, selectedWeightBand).length > 0 ? (
                      getCompatibleModels(selectedProduct, selectedWeightBand).map(model => {
                        const inStock = checkModelStock(model);
                        return (
                          <button
                            key={model.id}
                            onClick={() => setSelectedModel(model)}
                            className="text-left bg-slate-850 hover:bg-slate-800 border border-slate-750 p-2.5 rounded-xl transition duration-150 flex flex-col gap-1 shadow group"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] font-bold text-slate-100 group-hover:text-primary transition-colors">
                                {model.name}
                              </span>
                              {inStock ? (
                                <span className="bg-green-500/10 border border-green-500/20 text-green-400 font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse flex items-center gap-1">
                                  Disponível em Estoque hoje! ✅
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-500 font-mono">Sob Encomenda</span>
                              )}
                            </div>
                            {model.technical_specs?.peso && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Peso do Equipamento: {model.technical_specs.peso}
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      /* Display all models if weight band is generic or none matched */
                      (selectedProduct.models || []).map(model => {
                        const inStock = checkModelStock(model);
                        return (
                          <button
                            key={model.id}
                            onClick={() => setSelectedModel(model)}
                            className="text-left bg-slate-850 hover:bg-slate-800 border border-slate-750 p-2.5 rounded-xl transition flex flex-col gap-1 shadow"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] font-bold text-slate-100">{model.name}</span>
                              {inStock ? (
                                <span className="bg-green-500/15 border border-green-500/20 text-green-400 font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                  Disponível em Estoque hoje! ✅
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-500 font-mono">Sob Encomenda</span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* Step 4: Show specific model specs, productivity & "Fazer Indicação" action */
                <div className="space-y-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => {
                          setSelectedModel(null);
                          setDetailTab('specs');
                        }}
                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                        title="Voltar"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[11px] font-black text-slate-200 uppercase truncate">
                        Modelo: {selectedModel.name}
                      </span>
                    </div>
                    {checkModelStock(selectedModel) ? (
                      <span className="bg-green-500/10 border border-green-500/25 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                        Em Estoque hoje! ✅
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono">
                        Sob encomenda
                      </span>
                    )}
                  </div>

                  {/* Beautiful Tabs for Specs vs Productivity */}
                  <div className="flex border-b border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDetailTab('specs')}
                      className={`flex-1 pb-2 text-[11px] font-black text-center border-b-2 transition duration-150 uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                        detailTab === 'specs'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="h-3 w-3" /> Ficha Técnica
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailTab('productivity')}
                      className={`flex-1 pb-2 text-[11px] font-black text-center border-b-2 transition duration-150 uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                        detailTab === 'productivity'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" /> Produtividade
                    </button>
                  </div>

                  {/* Content based on Tab */}
                  <div className="text-xs font-sans text-slate-300 max-h-[140px] overflow-y-auto pr-1">
                    {detailTab === 'specs' ? (
                      <div className="space-y-1.5 font-mono">
                        {selectedModel.technical_specs && Object.entries(selectedModel.technical_specs)
                          .filter(([_, val]) => val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim() !== '-')
                          .length > 0 ? (
                            Object.entries(selectedModel.technical_specs)
                              .filter(([_, val]) => val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim() !== '-')
                              .map(([key, val]) => (
                                <div key={key} className="flex justify-between border-b border-slate-850 pb-1 text-[10px]">
                                  <span className="text-slate-400 uppercase font-bold">{key.replace('_', ' ')}:</span>
                                  <span className="text-slate-200 font-semibold">{String(val)}</span>
                                </div>
                              ))
                          ) : (
                            <p className="text-[10px] text-slate-500 text-center py-4 font-sans">
                              Nenhuma característica técnica cadastrada para este modelo.
                            </p>
                          )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedModel.productivity_text ? (
                          <div className="p-2.5 bg-primary/5 border border-primary/10 rounded-xl leading-relaxed text-slate-300">
                            <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-1">Produtividade Estimada</p>
                            <p className="text-[11px] font-medium whitespace-pre-line">{selectedModel.productivity_text}</p>
                          </div>
                        ) : (
                          <div className="text-center py-4 space-y-1">
                            <p className="text-[11px] text-slate-400 font-bold">Nenhum texto de produtividade cadastrado ainda.</p>
                            <p className="text-[10px] text-slate-500 leading-normal max-w-[220px] mx-auto">
                              Como administrador/gestor, você pode cadastrar textos de produtividade em: 
                              <br />
                              <span className="text-primary font-bold">Cadastros &gt; Produtos Cadastrados &gt; Editar o Modelo</span>.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info helper tip for finding the folder/database location */}
                  <div className="p-2 bg-slate-900/60 border border-slate-850 rounded-xl text-[9px] text-slate-400 leading-normal">
                    <span className="font-bold text-slate-300 block mb-0.5">📂 Onde estas informações ficam salvas?</span>
                    Estes textos e especificações ficam salvos na coleção <code className="text-amber-500 font-mono text-[9px]">products</code> do banco de dados Firestore. Elas são vinculadas diretamente a cada modelo de equipamento na chave <code className="text-primary font-mono text-[9px]">productivity_text</code> e <code className="text-primary font-mono text-[9px]">technical_specs</code>.
                  </div>

                  <div className="pt-1">
                    <Button
                      onClick={() => handleMakeIndication(selectedProduct, selectedModel)}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" /> Realizar Orçamento / Indicação
                    </Button>
                  </div>
                </div>
              )}
                </>
              )}
            </div>

            {/* Input Footer for standard Chat */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 items-center">
              {isRecording ? (
                <div className="flex-1 flex items-center justify-between bg-red-950/30 border border-red-500/30 rounded-lg px-3 py-1.5 text-xs text-red-200">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="font-medium animate-pulse">Gravando áudio...</span>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={stopRecording}
                    className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-md flex items-center gap-1"
                  >
                    <Square className="h-3 w-3 fill-white" /> Parar e Enviar
                  </Button>
                </div>
              ) : transcribing ? (
                <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Transcrevendo áudio...</span>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Ou pergunte ao Consultor sobre modelos, escavadeiras..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  disabled={loading}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary disabled:opacity-50"
                />
              )}

              {!isRecording && !transcribing && (
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={startRecording}
                  disabled={loading}
                  className="h-9 px-3 border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white"
                  title="Gravar áudio"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}

              {!isRecording && !transcribing && (
                <Button
                  size="sm"
                  className="h-9 px-3 bg-primary hover:bg-primary/90 text-white font-bold"
                  onClick={() => handleSend()}
                  disabled={loading || !inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
