import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useNavigate, useLocation } from 'react-router-dom';
import { compressImage } from '../lib/imageUtils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { 
  Camera, 
  Video, 
  Mic, 
  Square, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search, 
  Loader2, 
  X, 
  CheckCircle2,
  MapPin,
  Plus,
  Minus,
  Trash2,
  Package,
  User,
  Sparkles,
  Check,
  Layers,
  Filter
} from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';
import { notifyManagers } from '../services/notificationService';
import { IndicationItem, IndicationOptions, RegisteredProduct, UserProfile, Product, ProductModel } from '../types';
import { fetchCnpjData } from '../lib/cnpj';
import { HelpTooltip } from '../components/base/HelpTooltip';
import { maskPhone, maskCpfCnpj } from '../lib/masks';
import { cn } from '../lib/utils';
import { ImageLightbox } from '../components/ui/ImageLightbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

import { getDraft, saveDraft, clearDraft } from '../lib/offlinePersistence';
import { Wifi, WifiOff } from 'lucide-react';
import { usePWA } from '../contexts/PWAContext';
import { addToSyncQueue, saveMediaLocally } from '../lib/pwaUtils';

function SmartImage({ src, alt, className, ...props }: { src: string; alt?: string; className?: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    if (src?.startsWith('db-file://')) {
      const fileId = src.replace('db-file://', '');
      import('firebase/firestore').then(({ doc, getDoc }) => {
        getDoc(doc(db, 'app_files', fileId)).then(docSnap => {
          if (docSnap.exists()) {
            setResolvedSrc(docSnap.data().data);
          }
        });
      });
    } else {
      setResolvedSrc(src);
    }
  }, [src]);

  if (!resolvedSrc) {
    return (
      <div className={cn("bg-muted flex items-center justify-center text-muted-foreground", className)}>
        <Package className="h-5 w-5 opacity-40" />
      </div>
    );
  }

  return (
    <img 
      src={resolvedSrc} 
      alt={alt || ""} 
      className={cn("object-cover", className)} 
      referrerPolicy="no-referrer"
      {...props}
    />
  );
}

const ESTADOS_BRASIL = [
  { co: 'AC', name: 'Acre' },
  { co: 'AL', name: 'Alagoas' },
  { co: 'AP', name: 'Amapá' },
  { co: 'AM', name: 'Amazonas' },
  { co: 'BA', name: 'Bahia' },
  { co: 'CE', name: 'Ceará' },
  { co: 'DF', name: 'Distrito Federal' },
  { co: 'ES', name: 'Espírito Santo' },
  { co: 'GO', name: 'Goiás' },
  { co: 'MA', name: 'Maranhão' },
  { co: 'MT', name: 'Mato Grosso' },
  { co: 'MS', name: 'Mato Grosso do Sul' },
  { co: 'MG', name: 'Minas Gerais' },
  { co: 'PA', name: 'Pará' },
  { co: 'PB', name: 'Paraíba' },
  { co: 'PR', name: 'Paraná' },
  { co: 'PE', name: 'Pernambuco' },
  { co: 'PI', name: 'Piauí' },
  { co: 'RJ', name: 'Rio de Janeiro' },
  { co: 'RN', name: 'Rio Grande do Norte' },
  { co: 'RS', name: 'Rio Grande do Sul' },
  { co: 'RO', name: 'Rondônia' },
  { co: 'RR', name: 'Roraima' },
  { co: 'SC', name: 'Santa Catarina' },
  { co: 'SP', name: 'São Paulo' },
  { co: 'SE', name: 'Sergipe' },
  { co: 'TO', name: 'Tocantins' }
];

export default function NewIndication() {
  const { profile } = useAuth();
  const { isOffline: isPWAOffline } = usePWA();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { product_name?: string };
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    client_name: '',
    client_person_name: '',
    client_phone: '',
    client_email: '',
    client_cnpj: '',
    client_location: '',
    base_machine: '',
    machine_details: '',
    description: '',
    is_icms_contributor: false,
    ai_score: 'hot' as 'cold' | 'warm' | 'hot',
  });

  const [selectedItems, setSelectedItems] = useState<IndicationItem[]>([]);

  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Sync city and stateUf when client_location changes
  useEffect(() => {
    if (formData.client_location) {
      const parts = formData.client_location.split(' - ');
      if (parts.length >= 2) {
        setCity(parts[0]);
        setStateUf(parts[1].trim().toUpperCase().substring(0, 2));
      } else {
        setCity(formData.client_location);
        setStateUf('');
      }
    } else {
      setCity('');
      setStateUf('');
    }
  }, [formData.client_location]);

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCity(val);
    setFormData(prev => ({
      ...prev,
      client_location: stateUf ? `${val} - ${stateUf}` : val
    }));
    if (validationErrors.client_city) {
      setValidationErrors(prev => ({ ...prev, client_city: false }));
    }
  };

  const handleStateChange = (newUf: string) => {
    setStateUf(newUf);
    setFormData(prev => ({
      ...prev,
      client_location: city ? `${city} - ${newUf}` : ` - ${newUf}`
    }));
    if (validationErrors.client_uf) {
      setValidationErrors(prev => ({ ...prev, client_uf: false }));
    }
  };

  const [options, setOptions] = useState<IndicationOptions>({
    complete_installation: false,
    kit_hydraulic: false,
    only_equipment: false,
    with_freight: false
  });

  const [onlineStatus, setOnlineStatus] = useState(!isPWAOffline);
  const initializedRef = useRef(false);

  // Equipment Search & Custom Addition State
  const [productSearch, setProductSearch] = useState('');
  const [isEquipSelectorOpen, setIsEquipSelectorOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isAddEquipOpen, setIsAddEquipOpen] = useState(false);
  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipCode, setNewEquipCode] = useState('');

  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string>('');
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  useEffect(() => {
    setOnlineStatus(!isPWAOffline);
  }, [isPWAOffline]);

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';
  const isInternalSeller = profile?.role === 'internal_seller';
  const isExternalSeller = profile?.role === 'external_seller';
  
  const canSeeIcms = isAdmin || isManager || isInternalSeller;

  const [registeredProducts, setRegisteredProducts] = useState<RegisteredProduct[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [externalSellers, setExternalSellers] = useState<{uid: string, name: string}[]>([]);
  const [standardSellers, setStandardSellers] = useState<UserProfile[]>([]);
  const [selectedExternalSeller, setSelectedExternalSeller] = useState<{uid: string, name: string} | null>(null);
  const [autoStandardSeller, setAutoStandardSeller] = useState<UserProfile | null>(null);
  const [showMachineSuggestions, setShowMachineSuggestions] = useState(false);

  const machineTypeOptions = [
    'Escavadeira',
    'Pá Carregadeira',
    'Retro Escavadeira',
    'Trator'
  ];

  // Load draft or incoming router state on mount
  useEffect(() => {
    if (initializedRef.current) return;

    const draft = getDraft();
    if (draft && !state?.product_name) {
      setFormData(draft.data.formData);
      setSelectedItems(draft.data.selectedItems || []);
      setOptions(draft.data.options);
      toast.info('Rascunho restaurado automaticamente.');
      initializedRef.current = true;
    } else if (state?.product_name && (catalogProducts.length > 0 || registeredProducts.length > 0)) {
      const matchedCat = catalogProducts.find(p => p.name.toLowerCase() === state.product_name?.toLowerCase());
      if (matchedCat) {
        setSelectedItems([{ id: matchedCat.id, product_name: matchedCat.name, quantity: 1 }]);
        setExpandedProducts({ [matchedCat.id]: true });
      } else {
        let foundModel = false;
        for (const catProd of catalogProducts) {
          if (catProd.models) {
            const m = catProd.models.find(model => `${catProd.name} - ${model.name}`.toLowerCase() === state.product_name?.toLowerCase());
            if (m) {
              setSelectedItems([{ id: `model-${m.id}`, product_name: `${catProd.name} - ${m.name}`, quantity: 1 }]);
              setExpandedProducts({ [catProd.id]: true });
              foundModel = true;
              break;
            }
          }
        }
        if (!foundModel) {
          const matchedReg = registeredProducts.find(p => p.name.toLowerCase() === state.product_name?.toLowerCase());
          if (matchedReg) {
            setSelectedItems([{ id: matchedReg.id || 'initial-item', product_name: matchedReg.name, code: matchedReg.code, quantity: 1 }]);
          } else {
            setSelectedItems([{ id: 'custom-item', product_name: state.product_name, quantity: 1 }]);
          }
        }
      }
      initializedRef.current = true;
    } else if (!state?.product_name && !draft) {
      setSelectedItems([]);
      initializedRef.current = true;
    }
  }, [catalogProducts, registeredProducts, state?.product_name]);

  // Save draft on changes
  useEffect(() => {
    if (formData.client_name || formData.client_person_name || selectedItems.length > 0) {
      saveDraft({ formData, selectedItems, options });
    }
  }, [formData, selectedItems, options]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'registered_products'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegisteredProduct));
        setRegisteredProducts(products);
      } catch (error) {
        console.error("Error fetching registered products:", error);
      }
    };

    const fetchCatalogProducts = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const products = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(p => !p.is_blocked);
        setCatalogProducts(products);
      } catch (error) {
        console.error("Error fetching catalog products:", error);
      }
    };

    const fetchExternalSellers = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'external_seller'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const sellers = snapshot.docs.map(doc => ({ 
          uid: doc.id, 
          name: doc.data().name || 'Sem Nome'
        }));
        setExternalSellers(sellers);
      } catch (error) {
        console.error("Error fetching external sellers:", error);
      }
    };

    const fetchStandardSellers = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'vendedor_padrao'), where('status', '==', 'active'));
        const snapshot = await getDocs(q);
        const sellers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setStandardSellers(sellers);
      } catch (error) {
        console.error("Error fetching standard sellers:", error);
      }
    };

    fetchProducts();
    fetchCatalogProducts();
    fetchExternalSellers();
    fetchStandardSellers();
  }, [isExternalSeller]);

  // Logic to auto-assign standard seller based on state
  useEffect(() => {
    if (!formData.client_location) {
      setAutoStandardSeller(null);
      return;
    }

    const stateMatch = formData.client_location.match(/\b([A-Z]{2})\b/);
    if (stateMatch) {
      const state = stateMatch[1];
      const match = standardSellers.find(s => s.assigned_regions?.includes(state));
      if (match) {
        setAutoStandardSeller(match);
        console.log(`[AUTO-ASSIGN] Found standard seller ${match.name} for state ${state}`);
      } else {
        setAutoStandardSeller(null);
      }
    }
  }, [formData.client_location, standardSellers]);

  const toggleProductSelection = (p: RegisteredProduct) => {
    const isSelected = selectedItems.some(item => item.product_name.toLowerCase() === p.name.toLowerCase());
    if (isSelected) {
      setSelectedItems(prev => prev.filter(item => item.product_name.toLowerCase() !== p.name.toLowerCase()));
    } else {
      setSelectedItems(prev => [
        ...prev,
        { id: p.id || Math.random().toString(36).substring(2, 9), product_name: p.name, code: p.code, quantity: 1 }
      ]);
    }
  };

  const handleProductCardClick = (p: Product) => {
    const hasModels = p.models && p.models.length > 0;
    
    if (!hasModels) {
      const isSelected = selectedItems.some(item => item.product_name.toLowerCase() === p.name.toLowerCase());
      if (isSelected) {
        setSelectedItems(prev => prev.filter(item => item.product_name.toLowerCase() !== p.name.toLowerCase()));
      } else {
        setSelectedItems(prev => [
          ...prev,
          { id: p.id, product_name: p.name, quantity: 1 }
        ]);
      }
    } else {
      const nowExpanded = !expandedProducts[p.id];
      setExpandedProducts(prev => ({
        ...prev,
        [p.id]: nowExpanded
      }));
      
      if (nowExpanded) {
        const alreadyHasSelection = selectedItems.some(item => 
          item.product_name.toLowerCase() === p.name.toLowerCase() || 
          item.product_name.toLowerCase().startsWith(`${p.name.toLowerCase()} - `)
        );
        if (!alreadyHasSelection) {
          setSelectedItems(prev => [
            ...prev,
            { id: p.id, product_name: p.name, quantity: 1 }
          ]);
        }
      }
    }
  };

  const handleSelectGeneral = (p: Product) => {
    const isSelected = selectedItems.some(item => item.product_name.toLowerCase() === p.name.toLowerCase());
    if (isSelected) {
      const hasModelSelected = selectedItems.some(item => item.product_name.toLowerCase().startsWith(`${p.name.toLowerCase()} - `));
      if (!hasModelSelected) {
        setSelectedItems(prev => prev.filter(item => item.product_name.toLowerCase() !== p.name.toLowerCase()));
        setExpandedProducts(prev => ({ ...prev, [p.id]: false }));
      } else {
        setSelectedItems(prev => prev.filter(item => item.product_name.toLowerCase() !== p.name.toLowerCase()));
      }
    } else {
      setSelectedItems(prev => [
        ...prev.filter(item => !item.product_name.toLowerCase().startsWith(`${p.name.toLowerCase()} - `)),
        { id: p.id, product_name: p.name, quantity: 1 }
      ]);
      setExpandedProducts(prev => ({ ...prev, [p.id]: false })); // Auto close family card on general selection
    }
  };

  const handleSelectModel = (p: Product, model: ProductModel) => {
    const modelName = `${p.name} - ${model.name}`;
    const isModelSelected = selectedItems.some(item => item.product_name.toLowerCase() === modelName.toLowerCase());
    
    if (isModelSelected) {
      setSelectedItems(prev => {
        const remaining = prev.filter(item => item.product_name.toLowerCase() !== modelName.toLowerCase());
        const hasOtherSelection = remaining.some(item => 
          item.product_name.toLowerCase() === p.name.toLowerCase() || 
          item.product_name.toLowerCase().startsWith(`${p.name.toLowerCase()} - `)
        );
        if (!hasOtherSelection) {
          return [...remaining, { id: p.id, product_name: p.name, quantity: 1 }];
        }
        return remaining;
      });
    } else {
      setSelectedItems(prev => {
        const updated = [
          ...prev.filter(item => item.product_name.toLowerCase() !== p.name.toLowerCase()),
          { id: `model-${model.id}`, product_name: modelName, quantity: 1 }
        ];
        return updated;
      });
      setExpandedProducts(prev => ({ ...prev, [p.id]: false })); // Auto close family card on model selection
    }
  };

  const toggleCustomProductSelection = (p: RegisteredProduct) => {
    const isSelected = selectedItems.some(item => item.product_name.toLowerCase() === p.name.toLowerCase());
    if (isSelected) {
      setSelectedItems(prev => prev.filter(item => item.product_name.toLowerCase() !== p.name.toLowerCase()));
    } else {
      setSelectedItems(prev => [
        ...prev,
        { id: p.id || Math.random().toString(36).substring(2, 9), product_name: p.name, code: p.code, quantity: 1 }
      ]);
    }
  };

  const handleProductQtyChange = (productName: string, delta: number) => {
    setSelectedItems(prev => 
      prev.map(item => {
        if (item.product_name.toLowerCase() === productName.toLowerCase()) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleAddEquipment = async () => {
    if (!newEquipName.trim()) {
      toast.error('Informe o nome do equipamento.');
      return;
    }
    const codeToUse = newEquipCode.trim().toUpperCase() || 'RD-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    try {
      const newDoc = {
        name: newEquipName.trim(),
        code: codeToUse,
        base_price: 0,
        category: 'Geral',
        is_commissionable: true,
        image_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'registered_products'), newDoc);
      
      const newlyCreated = { id: docRef.id, ...newDoc };
      setRegisteredProducts(prev => {
        const updated = [...prev, newlyCreated];
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });
      
      // Select the newly added product automatically
      setSelectedItems(prev => [
        ...prev,
        { id: docRef.id, product_name: newlyCreated.name, code: newlyCreated.code, quantity: 1 }
      ]);
      
      toast.success('Novo equipamento cadastrado com sucesso!');
      setNewEquipName('');
      setNewEquipCode('');
      setIsAddEquipOpen(false);
    } catch (error: any) {
      toast.error('Erro ao cadastrar equipamento: ' + error.message);
    }
  };

  const handleOptionChange = (field: keyof IndicationOptions, value: boolean) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  };

  // Media State
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('audio/webm');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let maskedValue = value;
    
    if (name === 'client_cnpj') maskedValue = maskCpfCnpj(value);
    if (name === 'client_phone') maskedValue = maskPhone(value);
    
    setFormData(prev => ({ ...prev, [name]: maskedValue }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleCnpjLookup = async () => {
    const rawCnpj = formData.client_cnpj.replace(/\D/g, '');
    if (rawCnpj.length !== 14) {
      toast.error('CNPJ inválido para busca (deve ter 14 dígitos).');
      return;
    }
    
    setLoading(true);
    toast.info('Buscando dados do CNPJ...');
    
    try {
      const data = await fetchCnpjData(rawCnpj);
      if (!data) throw new Error('CNPJ não encontrado nas bases públicas.');
      
      setFormData(prev => ({
        ...prev,
        client_name: data.razao_social || data.nome_fantasia,
        client_location: `${data.municipio} - ${data.uf}`,
      }));
      toast.success('Dados preenchidos automaticamente!');
    } catch (error: any) {
      console.error("CNPJ lookup error:", error);
      toast.error('CNPJ não localizado. Preencha manualmente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 13) {
        toast.error('Limite máximo de 10 fotos e 3 vídeos excedido.');
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
          console.log("[AudioRecorder] Recognized supported type:", mimeType);
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
        console.log("[AudioRecorder] Final Blob type:", finalType);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        setTranscribing(true);
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const resultStr = reader.result?.toString() || '';
          const base64data = resultStr.split(',')[1];
          
          if (base64data) {
            try {
              const transcription = await transcribeAudio(base64data, finalType);
              if (transcription && !transcription.startsWith("Erro na transcrição")) {
                setFormData(prev => ({
                  ...prev,
                  description: prev.description ? `${prev.description}\n\n${transcription}` : transcription
                }));
                toast.success('Transcrição concluída!');
              } else {
                toast.error(transcription || 'A IA não conseguiu entender o áudio.');
              }
            } catch (error: any) {
              console.error("Transcription error:", error);
              toast.error('Erro de rede na transcrição.');
            }
          }
          setTranscribing(false);
        };
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'saving' | 'uploading' | 'notifying' | 'done'>('saving');

  const handleSubmit = async () => {
    // Validate fields
    const newErrors: Record<string, boolean> = {};
    const missingFields: string[] = [];
    const scrollTargets: { field: string; label: string; elementId: string }[] = [];

    if ((isAdmin || isManager) && !selectedExternalSeller) {
      newErrors.partner = true;
      missingFields.push('Parceiro Indicador (Responsável)');
      scrollTargets.push({ field: 'partner', label: 'Parceiro Indicador (Responsável)', elementId: 'partner-wrapper' });
    }

    if (!formData.client_person_name) {
      newErrors.client_person_name = true;
      missingFields.push('Nome do Contato Principal');
      scrollTargets.push({ field: 'client_person_name', label: 'Nome do Contato Principal', elementId: 'client_person_name' });
    }

    if (!formData.client_phone) {
      newErrors.client_phone = true;
      missingFields.push('WhatsApp de Contato');
      scrollTargets.push({ field: 'client_phone', label: 'WhatsApp de Contato', elementId: 'client_phone' });
    }

    if (!city) {
      newErrors.client_city = true;
      missingFields.push('Cidade');
      scrollTargets.push({ field: 'client_city', label: 'Cidade', elementId: 'client_city' });
    }

    if (!stateUf) {
      newErrors.client_uf = true;
      missingFields.push('Estado (UF)');
      scrollTargets.push({ field: 'client_uf', label: 'Estado (UF)', elementId: 'client_uf-wrapper' });
    }

    setValidationErrors(newErrors);

    if (missingFields.length > 0) {
      toast.error(`Informações obrigatórias faltando: ${missingFields.join(', ')}`, {
        description: 'Por favor, preencha os campos destacados em vermelho antes de enviar.',
        duration: 8000
      });

      // Scroll to the first missing field in a clean, smooth way
      setTimeout(() => {
        const firstTarget = scrollTargets[0];
        if (firstTarget) {
          const element = document.getElementById(firstTarget.elementId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add custom visual shake effect
            element.classList.add('animate-shake');
            setTimeout(() => {
              element.classList.remove('animate-shake');
            }, 1000);

            // Attempt to focus the input inside
            const input = element.tagName === 'INPUT' ? element : element.querySelector('input');
            if (input) {
              (input as HTMLInputElement).focus();
            }
          }
        }
      }, 100);

      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Selecione pelo menos um equipamento clicando nas opções abaixo.');
      return;
    }

    if (!onlineStatus) {
      setIsSubmitting(true);
      setSubmissionStatus('saving');
      try {
        const tempId = crypto.randomUUID();
        const mediaIds: string[] = [];

        for (const file of files) {
          const mediaId = crypto.randomUUID();
          await saveMediaLocally({
            id: mediaId,
            blob: file,
            fileName: file.name,
            mimeType: file.type
          });
          mediaIds.push(mediaId);
        }

        const itemsList = selectedItems
          .map(i => `${i.quantity}x ${i.product_name}`)
          .join(', ');

        const initialHistoryEntry = {
          id: Math.random().toString(36).substring(2, 11),
          type: 'system',
          author_name: profile?.name || 'Sistema',
          created_at: new Date().toISOString(),
          content: `Indicação inicial enviada OFFLINE.\n\nSOLICITAÇÃO: ${itemsList}\n\nDESCRIÇÃO: ${formData.description}\n\nMÁQUINA BASE: ${formData.base_machine} ${formData.machine_details}`,
          attachments: []
        };

        const indicationData = {
          ...formData,
          is_icms_contributor: formData.is_icms_contributor,
          items: selectedItems,
          options,
          external_seller_uid: selectedExternalSeller?.uid || profile?.uid,
          external_seller_name: selectedExternalSeller?.name || profile?.name,
          standard_seller_uid: autoStandardSeller?.uid || null,
          standard_seller_name: autoStandardSeller?.name || null,
          standard_seller_commission_rate: autoStandardSeller?.commission_rate || 2,
          standard_seller_commission_enabled: !!autoStandardSeller,
          media_urls: [],
          media_upload_status: files.length > 0 ? 'queued' : 'none',
          status: 'pending',
          negotiation_history: [initialHistoryEntry],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          protection_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          isOfflineSaved: true
        };

        await addToSyncQueue({
          id: tempId,
          type: 'indication',
          data: { data: indicationData, mediaIds }
        });

        clearDraft();
        toast.success('Salvo no dispositivo!', { 
          description: 'Aparelho offline. Os dados sincronizarão em segundo plano assim que a rede retornar.',
          duration: 10000 
        });
        navigate('/indicacoes');
      } catch (err) {
        console.error("Error saving offline:", err);
        toast.error('Erro ao guardar indicação localmente.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus('saving');
    try {
      const indicationRef = doc(collection(db, 'indications'));
      const indicationId = indicationRef.id;

      // Start asynchronous uploads
      let completedUploads = 0;
      files.forEach(async (file) => {
        try {
          const storageRef = ref(storage, `indications/${indicationId}/${Date.now()}_${file.name}`);
          
          let fileToUpload = file;
          if (file.type.startsWith('image/')) {
            fileToUpload = await compressImage(file);
          }
          
          const uploadTask = uploadBytesResumable(storageRef, fileToUpload);
          
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: Math.round(progress)
              }));
            },
            (error) => console.error(`Upload error for ${file.name}:`, error),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              await updateDoc(indicationRef, {
                media_urls: arrayUnion(url),
                updated_at: new Date().toISOString()
              });
              
              completedUploads++;
              if (completedUploads === files.length) {
                await updateDoc(indicationRef, {
                  media_upload_status: 'completed'
                });
              }
            }
          );
        } catch (uploadError) {
          console.error(`Error starting upload for ${file.name}:`, uploadError);
        }
      });

      const itemsList = selectedItems
        .map(i => `${i.quantity}x ${i.product_name}`)
        .join(', ');

      const initialHistoryEntry = {
        id: Math.random().toString(36).substring(2, 11),
        type: 'system',
        author_name: profile?.name || 'Sistema',
        created_at: new Date().toISOString(),
        content: `Indicação inicial enviada.\n\nSOLICITAÇÃO: ${itemsList}\n\nDESCRIÇÃO: ${formData.description}\n\nMÁQUINA BASE: ${formData.base_machine} ${formData.machine_details}`,
        attachments: []
      };

      await setDoc(indicationRef, {
        ...formData,
        is_icms_contributor: formData.is_icms_contributor,
        items: selectedItems,
        options,
        external_seller_uid: selectedExternalSeller?.uid || profile?.uid,
        external_seller_name: selectedExternalSeller?.name || profile?.name,
        
        // Standard Seller Auto-Assignment
        standard_seller_uid: autoStandardSeller?.uid || null,
        standard_seller_name: autoStandardSeller?.name || null,
        standard_seller_commission_rate: autoStandardSeller?.commission_rate || 2,
        standard_seller_commission_enabled: !!autoStandardSeller,
        
        media_urls: [], 
        media_upload_status: files.length > 0 ? 'uploading' : 'none',
        status: 'pending',
        negotiation_history: [initialHistoryEntry],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        protection_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      });

      setSubmissionStatus('notifying');
      // Notify Triagem Luana and Managers and send template emails
      const notifyTriagem = async () => {
        try {
          await notifyManagers(
            'Nova Indicação Recebida',
            `${profile?.name} enviou uma nova indicação para ${formData.client_name || formData.client_person_name}.`,
            `/indicacoes`,
            'info'
          );

          try {
            const { notifyNewIndication, notifyPartnerIndicationReceived } = await import('../services/emailService');
            const primaryItem = selectedItems[0]?.product_name || 'Equipamento';
            
            const locationStr = formData.client_location || '';
            const locationParts = locationStr.includes('-') ? locationStr.split('-') : [locationStr, ''];

            const indicationDataForEmail = {
              client_name: formData.client_person_name || formData.client_name,
              client_phone: formData.client_phone,
              company_name: formData.client_name,
              city: (locationParts[0] || '').trim(),
              state: (locationParts[1] || '').trim(),
              product_name: primaryItem
            };

            await notifyNewIndication(indicationDataForEmail, profile?.name || 'Parceiro');

            if (profile?.email) {
              await notifyPartnerIndicationReceived(indicationDataForEmail, profile.email, profile.name || 'Parceiro');
            }
          } catch (e) {
            console.warn("Emails ignored:", e);
          }
        } catch (notifyError) {
          console.error("Notifications err:", notifyError);
        }
      };
      
      await notifyTriagem();
      setSubmissionStatus('done');
      clearDraft();
      toast.success('Indicação enviada com sucesso!');
      
      // Delay slightly for user to see success state
      setTimeout(() => navigate('/indicacoes'), 1500);
    } catch (saveError: any) {
      console.warn("Save failed, writing offline:", saveError);
      toast.error('Erro de envio. Gravado no rascunho temporário.');
      setIsSubmitting(false);
    }
  };

  // Group elements matching search query
  const filteredCatalogProducts = catalogProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.models || []).some(m => m.name.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const customProducts = registeredProducts.filter(p => 
    p.category === 'Geral' && (
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.code || '').toLowerCase().includes(productSearch.toLowerCase())
    )
  );

  const categories = Array.from(new Set(filteredCatalogProducts.map(p => p.category || 'Geral'))).sort();

  const getStatusText = () => {
    switch(submissionStatus) {
      case 'saving': return 'Salvando dados da indicação...';
      case 'uploading': return 'Fazendo upload das mídias...';
      case 'notifying': return 'Enviando e-mail de aviso para a RODER...';
      case 'done': return 'Indicação enviada com sucesso!';
      default: return 'Processando...';
    }
  };

  return (
    <Layout>
      {/* Submission Feedback Dialog */}
      <Dialog open={isSubmitting} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-white border-2 border-primary/20 shadow-2xl rounded-3xl" showCloseButton={false}>
          <DialogHeader className="flex flex-col items-center gap-4 py-4">
            {submissionStatus !== 'done' ? (
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 rounded-full border-4 border-primary/10 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-t-4 border-l-4 border-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-primary animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            )}
            <div className="text-center space-y-2">
              <DialogTitle className="text-xl font-black uppercase text-slate-900 tracking-tight">
                {submissionStatus === 'done' ? 'Sucesso!' : 'Enviando Indicação'}
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium pb-2">
                {getStatusText()}
              </DialogDescription>
            </div>
          </DialogHeader>
          
          {submissionStatus !== 'done' && (
            <div className="px-6 py-4 space-y-4">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className={cn(
                    "h-full bg-primary transition-all duration-1000",
                    submissionStatus === 'saving' ? "w-1/3" : 
                    submissionStatus === 'uploading' ? "w-2/3" : "w-[90%]"
                  )} 
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <div className="p-1 bg-amber-100 rounded-full mt-0.5">
                   <Wifi className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Aviso Importante</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    Por favor, <strong>não feche esta aba</strong> e mantenha sua conexão ativa até que os e-mails de confirmação sejam disparados para a equipe da RODER.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="hidden sm:flex" />
        </DialogContent>
      </Dialog>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="h-9 w-9 -ml-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Nova Indicação</h1>
              <p className="text-xs text-muted-foreground">Registre os dados do comprador e equipamentos solicitados em uma única tela rápida.</p>
            </div>
          </div>
          <div className="flex self-start sm:self-center">
            {!onlineStatus ? (
              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 gap-1 px-3 py-1.5 text-xs font-bold shadow-sm">
                <WifiOff className="h-4 w-4" /> Offline
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1 px-3 py-1.5 text-xs font-bold shadow-sm">
                <Wifi className="h-4 w-4" /> Online
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Card 1: Compact Chosen Roder Equipment List */}
          <Card className="bg-slate-300 dark:bg-zinc-900 border-slate-450 dark:border-zinc-800 shadow-sm text-slate-900 dark:text-zinc-100">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between gap-4 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-black uppercase text-foreground">
                  Equipamentos de Interesse *
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] bg-slate-250 text-slate-700 hover:bg-slate-250 border-slate-350 py-0.5 font-bold uppercase tracking-wider">
                Obrigatório
              </Badge>
            </CardHeader>
            <CardContent className="p-3.5 space-y-3">
              {/* Selected Items List with Images & Controls */}
              {selectedItems.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-primary tracking-wider pl-1 font-mono">Equipamentos Selecionados ({selectedItems.length})</p>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedItems.map((item, id) => {
                      let nameToCheck = item.product_name;
                      if (item.product_name.includes(' - ')) {
                        nameToCheck = item.product_name.split(' - ')[0];
                      }
                      const matchedCat = catalogProducts.find(p => p.name.toLowerCase() === nameToCheck.toLowerCase());
                      const productPhoto = matchedCat?.image_url || '';
                      const isCustom = item.id === 'custom-item' || item.id === 'initial-item' || !matchedCat;

                      return (
                        <div 
                          key={id}
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl border-2 transition-all gap-3",
                            isCustom 
                              ? "bg-amber-600/5 border-amber-500/30 dark:border-amber-500/20" 
                              : "bg-primary/5 border-primary/20 dark:border-primary/10"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div 
                              onClick={(e) => {
                                  if (productPhoto) {
                                    e.stopPropagation();
                                    setLightboxImage(productPhoto);
                                    setLightboxTitle(item.product_name);
                                    setIsLightboxOpen(true);
                                  }
                                }}
                              className={cn(
                                "h-9 w-9 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center bg-background select-none",
                                productPhoto ? "cursor-pointer hover:scale-110 active:scale-95 transition-transform" : "",
                                isCustom ? "text-amber-500 border-amber-200 dark:border-amber-950/40" : "text-primary border-primary/20 dark:border-primary/10"
                              )}
                              title={productPhoto ? "Clique para expandir a foto" : ""}
                            >
                              {productPhoto ? (
                                <SmartImage src={productPhoto} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-4 w-4 opacity-60" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-xs text-foreground truncate">{item.product_name}</p>
                              {item.code ? (
                                <p className="text-[9px] font-mono uppercase text-muted-foreground tracking-tight mt-0.5">{item.code}</p>
                              ) : (
                                <p className="text-[9px] font-mono uppercase text-muted-foreground/80 tracking-tight mt-0.5">
                                  {isCustom ? "Equipamento Personalizado" : "Equipamento do Catálogo"}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold uppercase text-muted-foreground/80 font-mono">Qtd:</span>
                              <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 border border-border/80 p-0.5 rounded-lg shadow-xs">
                                <button 
                                  type="button"
                                  onClick={() => handleProductQtyChange(item.product_name, -1)}
                                  className="h-6 w-6 rounded-md bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3 stroke-[2.5]" />
                                </button>
                                <span className="font-extrabold text-[11px] text-foreground w-5 text-center select-none">{item.quantity}</span>
                                <button 
                                  type="button"
                                  onClick={() => handleProductQtyChange(item.product_name, 1)}
                                  className="h-6 w-6 rounded-md bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-all cursor-pointer"
                                >
                                  <Plus className="h-3 w-3 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>

                            <button 
                              type="button" 
                              onClick={() => setSelectedItems(prev => prev.filter((_, idx) => idx !== id))}
                              className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                              title="Remover"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-5 px-3 text-center border-2 border-dashed border-border/60 rounded-xl bg-background/50 dark:bg-zinc-950/20">
                  <Package className="h-5 w-5 text-primary/40 mb-1.5 animate-pulse" />
                  <p className="text-xs font-bold text-foreground">Nenhum equipamento de interesse selecionado</p>
                  <p className="text-[10px] text-muted-foreground max-w-sm mt-0.5 font-medium">Selecione pelo menos um equipamento no catálogo para prosseguir.</p>
                </div>
              )}

              {/* Action trigger to select equipment */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button 
                  type="button"
                  onClick={() => {
                    setProductSearch('');
                    setIsEquipSelectorOpen(true);
                  }}
                  className={cn(
                    "flex-1 h-11 text-xs font-black uppercase tracking-wider gap-2 shadow-md rounded-xl cursor-pointer mr-0 transition-all duration-300",
                    selectedItems.length === 0 
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground animate-pulse shadow-[0_0_20px_rgba(224,90,16,0.65)] ring-4 ring-primary/30 border-2 border-primary-foreground/10" 
                      : "bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 text-muted-foreground border border-border hover:text-foreground"
                  )}
                >
                  <Layers className={cn("h-4 w-4 shrink-0", selectedItems.length === 0 && "animate-bounce")} /> 
                  {selectedItems.length === 0 ? (
                    <>
                      <span className="sm:hidden">👉 SELECIONAR EQUIPAMENTO</span>
                      <span className="hidden sm:inline">👉 CLIQUE AQUI PARA SELECIONAR EQUIPAMENTO 👈</span>
                    </>
                  ) : (
                    "Selecionar Equipamento"
                  )}
                </Button>
                
                {(isAdmin || isManager) && (
                  <Button 
                    type="button" 
                    onClick={() => setIsAddEquipOpen(true)}
                    variant="outline"
                    className="h-10 border-dashed border-2 px-4 gap-2 text-xs font-black uppercase text-primary border-primary/40 hover:bg-primary/5 rounded-xl cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Cadastrar Outro Equipamento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Customer Details */}
          <Card className="bg-slate-300 dark:bg-zinc-900 border-slate-450 dark:border-zinc-800 shadow-sm text-slate-900 dark:text-zinc-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados do Cliente
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Preencha quem é o comprador de interesse para proteção do lead comercial.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Partner selection for admin/manager/triagem roles */}
              {(isAdmin || isManager) && (
                <div 
                  id="partner-wrapper"
                  className={cn(
                    "space-y-2 p-4 rounded-xl border-2 shadow-inner transition-all duration-300",
                    validationErrors.partner 
                      ? "bg-red-50 dark:bg-red-950/20 border-red-500 shadow-md ring-2 ring-red-500/20" 
                      : "bg-orange-600/10 border-orange-600/25"
                  )}
                >
                  <Label className={cn(
                    "text-xs font-black uppercase flex items-center gap-2 transition-colors",
                    validationErrors.partner ? "text-red-500 font-extrabold animate-pulse" : "text-orange-600"
                  )}>
                    Parceiro Indicador (Responsável) *
                  </Label>
                  <Select 
                    onValueChange={(val) => {
                      const seller = externalSellers.find(s => s.uid === val);
                      if (seller) setSelectedExternalSeller(seller);
                      if (validationErrors.partner) {
                        setValidationErrors(prev => ({ ...prev, partner: false }));
                      }
                    }}
                    value={selectedExternalSeller?.uid || ""}
                  >
                    <SelectTrigger className="bg-white dark:bg-zinc-950 border-input h-11 font-semibold text-foreground">
                      <SelectValue placeholder="Selecione quem indicou este cliente..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-[300px]">
                      {externalSellers.map(seller => (
                        <SelectItem key={seller.uid} value={seller.uid} className="py-2">
                          {seller.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-orange-600/70 font-medium">
                    O lead ficará cadastrado de forma protegida sob o nome do parceiro selecionado.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_cnpj" className="text-xs font-bold uppercase text-muted-foreground/80">CNPJ (Opcional)</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="client_cnpj" 
                      name="client_cnpj"
                      placeholder="00.000.000/0000-00" 
                      value={formData.client_cnpj}
                      onChange={handleInputChange}
                      onBlur={() => {
                        const masked = maskCpfCnpj(formData.client_cnpj);
                        setFormData(p => ({ ...p, client_cnpj: masked }));
                        if (masked.replace(/\D/g, '').length === 14) {
                          handleCnpjLookup();
                        }
                      }}
                      className="bg-white dark:bg-zinc-950 border-input h-11 font-semibold text-foreground placeholder:text-muted-foreground/60 w-full"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="border-border h-11 px-3 shadow-sm bg-white dark:bg-zinc-950 hover:bg-muted" 
                      onClick={handleCnpjLookup} 
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                {canSeeIcms && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground/80">Contribuinte de ICMS?</Label>
                    <div className="grid grid-cols-2 gap-2 h-11">
                      <Button 
                        type="button"
                        variant={formData.is_icms_contributor === true ? "default" : "outline"}
                        className={cn(
                          "font-black text-xs uppercase h-full transition-all border-2 px-1 sm:px-4 flex items-center justify-center",
                          formData.is_icms_contributor === true ? "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-md shadow-green-600/10" : "border-slate-200 bg-white dark:bg-zinc-950 text-muted-foreground"
                        )}
                        onClick={() => setFormData(prev => ({ ...prev, is_icms_contributor: true }))}
                      >
                        <span className="block sm:hidden">SIM (Insc. Est.)</span>
                        <span className="hidden sm:block">SIM (Insc. Estadual)</span>
                      </Button>
                      <Button 
                        type="button"
                        variant={formData.is_icms_contributor === false ? "default" : "outline"}
                        className={cn(
                          "font-black text-xs uppercase h-full transition-all border-2 px-1 sm:px-4 flex items-center justify-center",
                          formData.is_icms_contributor === false ? "bg-slate-700 hover:bg-slate-800 text-white border-slate-700 shadow-md" : "border-slate-200 bg-white dark:bg-zinc-950 text-muted-foreground"
                        )}
                        onClick={() => setFormData(prev => ({ ...prev, is_icms_contributor: false }))}
                      >
                        <span className="block sm:hidden">NÃO (CPF/Rural)</span>
                        <span className="hidden sm:block">NÃO (Produtor Rural/CPF)</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name" className="text-xs font-bold uppercase text-muted-foreground/80">Nome da Empresa / Nome Fantasia (Opcional)</Label>
                  <Input 
                    id="client_name" 
                    name="client_name"
                    placeholder="Ex: Agropecuária Primavera LTDA" 
                    value={formData.client_name}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-zinc-950 border-input h-11 font-semibold text-foreground placeholder:text-muted-foreground/60 w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label 
                    htmlFor="client_person_name" 
                    className={cn(
                      "text-xs font-bold uppercase tracking-tight transition-colors",
                      validationErrors.client_person_name ? "text-red-500 font-extrabold animate-pulse" : "text-muted-foreground/80"
                    )}
                  >
                    Nome do Contato Principal *
                  </Label>
                  <Input 
                    id="client_person_name" 
                    name="client_person_name"
                    placeholder="Ex: João da Silva" 
                    value={formData.client_person_name}
                    onChange={handleInputChange}
                    className={cn(
                      "bg-white dark:bg-zinc-950 border-input h-11 transition-all duration-300 font-semibold text-foreground placeholder:text-muted-foreground/60 w-full",
                      validationErrors.client_person_name && "border-red-500 bg-red-50/80 dark:bg-red-950/20 focus-visible:ring-red-500 shadow-md ring-2 ring-red-500/10"
                    )}
                  />
                </div>
              </div>

              {autoStandardSeller && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-primary leading-none mb-1">Vendedor Padrão Interno Atribuído</p>
                      <p className="text-xs font-bold text-foreground">{autoStandardSeller.name}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-black uppercase">
                    UF Atendido
                  </Badge>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label 
                    htmlFor="client_phone" 
                    className={cn(
                      "text-xs font-bold uppercase tracking-tight transition-colors",
                      validationErrors.client_phone ? "text-red-500 font-extrabold animate-pulse" : "text-muted-foreground/80"
                    )}
                  >
                    WhatsApp de Contato *
                  </Label>
                  <Input 
                    id="client_phone" 
                    name="client_phone"
                    placeholder="(00) 00000-0000" 
                    value={formData.client_phone}
                    onChange={handleInputChange}
                    className={cn(
                      "bg-white dark:bg-zinc-950 border-input h-11 font-semibold transition-all duration-300 text-foreground placeholder:text-muted-foreground/60 w-full",
                      validationErrors.client_phone && "border-red-500 bg-red-50/80 dark:bg-red-950/20 focus-visible:ring-red-500 shadow-md ring-2 ring-red-500/10"
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-2">
                    <Label 
                      htmlFor="client_city" 
                      className={cn(
                        "text-xs font-bold uppercase tracking-tight transition-colors",
                        validationErrors.client_city ? "text-red-500 font-extrabold animate-pulse" : "text-muted-foreground/80"
                      )}
                    >
                      Cidade *
                    </Label>
                    <Input 
                      id="client_city" 
                      name="client_city"
                      placeholder="Ex: Chapecó" 
                      value={city}
                      onChange={handleCityChange}
                      className={cn(
                        "bg-white dark:bg-zinc-950 border-input h-11 font-semibold transition-all duration-300 text-foreground placeholder:text-muted-foreground/60 w-full",
                        validationErrors.client_city && "border-red-500 bg-red-50/80 dark:bg-red-950/20 focus-visible:ring-red-500 shadow-md ring-2 ring-red-500/10"
                      )}
                    />
                  </div>
                  <div id="client_uf-wrapper" className="sm:col-span-1 space-y-2">
                    <Label 
                      className={cn(
                        "text-xs font-bold uppercase tracking-tight transition-colors-all",
                        validationErrors.client_uf ? "text-red-500 font-extrabold animate-pulse" : "text-muted-foreground/80"
                      )}
                    >
                      Estado (UF) *
                    </Label>
                    <Select 
                      onValueChange={handleStateChange}
                      value={stateUf || ""}
                    >
                      <SelectTrigger 
                        id="client_uf"
                        className={cn(
                          "bg-white dark:bg-zinc-950 border-input h-11 font-extrabold uppercase text-center flex items-center justify-between transition-all duration-300 text-foreground shadow-xs w-full",
                          validationErrors.client_uf && "border-red-500 bg-red-50/80 dark:bg-red-950/20 focus-visible:ring-red-500 shadow-md ring-2 ring-red-500/10"
                        )}
                      >
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border max-h-[250px] overflow-y-auto">
                        {ESTADOS_BRASIL.map(est => (
                          <SelectItem key={est.co} value={est.co} className="py-1.5 font-bold">
                            {est.co} - {est.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_email" className="text-xs font-bold uppercase text-muted-foreground/80">E-mail para Envio de Orçamentos (Opcional)</Label>
                <Input 
                  id="client_email" 
                  name="client_email"
                  type="email"
                  placeholder="cliente@email.com" 
                  value={formData.client_email}
                  onChange={handleInputChange}
                  className="bg-white dark:bg-zinc-950 border-input h-11 font-semibold text-foreground placeholder:text-muted-foreground/60 w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: proposal parameters & host machine */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Options of Proposal */}
            <Card className="bg-slate-300 dark:bg-zinc-900 border-slate-450 dark:border-zinc-800 shadow-sm text-slate-900 dark:text-zinc-100 flex flex-col justify-between">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Opcionais da Indicação</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Marque o que está incluso no interesse comercial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col justify-center">
                <div 
                  className="flex items-center space-x-3 p-3 border border-border rounded-lg bg-white dark:bg-zinc-950 hover:bg-muted/25 transition-colors cursor-pointer shadow-xs" 
                  onClick={() => handleOptionChange('complete_installation', !options.complete_installation)}
                >
                  <Checkbox 
                    id="complete_installation" 
                    checked={options.complete_installation}
                    onCheckedChange={(checked) => handleOptionChange('complete_installation', !!checked)}
                  />
                  <Label htmlFor="complete_installation" className="text-xs font-bold leading-tight cursor-pointer">
                    Completo com Instalação Comercial (Instalação Roder)
                  </Label>
                </div>

                <div 
                  className="flex items-center space-x-3 p-3 border border-border rounded-lg bg-white dark:bg-zinc-950 hover:bg-muted/25 transition-colors cursor-pointer shadow-xs" 
                  onClick={() => handleOptionChange('kit_hydraulic', !options.kit_hydraulic)}
                >
                  <Checkbox 
                    id="kit_hydraulic" 
                    checked={options.kit_hydraulic}
                    onCheckedChange={(checked) => handleOptionChange('kit_hydraulic', !!checked)}
                  />
                  <Label htmlFor="kit_hydraulic" className="text-xs font-bold leading-tight cursor-pointer">
                    Equip. + Kit Hidráulico p/ Máquina (sem técnico Roder)
                  </Label>
                </div>

                <div 
                  className="flex items-center space-x-3 p-3 border border-border rounded-lg bg-white dark:bg-zinc-950 hover:bg-muted/25 transition-colors cursor-pointer shadow-xs" 
                  onClick={() => handleOptionChange('only_equipment', !options.only_equipment)}
                >
                  <Checkbox 
                    id="only_equipment" 
                    checked={options.only_equipment}
                    onCheckedChange={(checked) => handleOptionChange('only_equipment', !!checked)}
                  />
                  <Label htmlFor="only_equipment" className="text-xs font-bold leading-tight cursor-pointer">
                    Somente Equipamento Solto
                  </Label>
                </div>

                <div 
                  className="flex items-center space-x-3 p-3 border border-border rounded-lg bg-white dark:bg-zinc-950 hover:bg-muted/25 transition-colors cursor-pointer shadow-xs" 
                  onClick={() => handleOptionChange('with_freight', !options.with_freight)}
                >
                  <Checkbox 
                    id="with_freight" 
                    checked={options.with_freight}
                    onCheckedChange={(checked) => handleOptionChange('with_freight', !!checked)}
                  />
                  <Label htmlFor="with_freight" className="text-xs font-bold leading-tight cursor-pointer">
                    Incluso Frete Roder de Fábrica
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Base Machine details */}
            <Card className="bg-slate-300 dark:bg-zinc-900 border-slate-450 dark:border-zinc-800 shadow-sm text-slate-900 dark:text-zinc-100 flex flex-col justify-between">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Máquina Base Acoplamento</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Informe dados da máquina que receberá o equipamento Roder.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="space-y-2 relative">
                  <Label htmlFor="base_machine" className="text-xs font-bold uppercase text-muted-foreground/80">Tipo da Máquina (ex: Escavadeira, Trator...)</Label>
                  <Input 
                    id="base_machine" 
                    name="base_machine"
                    placeholder="Ex: Escavadeira Hidráulica" 
                    value={formData.base_machine}
                    onChange={handleInputChange}
                    onFocus={() => setShowMachineSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowMachineSuggestions(false), 200)}
                    className="bg-white dark:bg-zinc-950 border-input h-11 font-semibold text-foreground placeholder:text-muted-foreground/60 w-full"
                    autoComplete="off"
                  />
                  {showMachineSuggestions && (
                    <div className="absolute z-[100] w-full mt-1 bg-card border border-border rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 text-foreground">
                      <div className="max-h-60 overflow-y-auto">
                        {machineTypeOptions
                          .filter(opt => opt.toLowerCase().includes(formData.base_machine.toLowerCase()))
                          .map(opt => (
                            <div 
                              key={opt}
                              className="px-4 py-2 text-xs font-bold hover:bg-primary/5 hover:text-primary cursor-pointer transition-colors border-b border-border/15 last:border-0"
                              onMouseDown={() => {
                                setFormData(prev => ({ ...prev, base_machine: opt }));
                                setShowMachineSuggestions(false);
                              }}
                            >
                              {opt}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="machine_details" className="text-xs font-bold uppercase text-muted-foreground/80">Marca e Modelo da Máquina</Label>
                  <Input 
                    id="machine_details" 
                    name="machine_details"
                    placeholder="Ex: Komatsu PC200 / CAT 320" 
                    value={formData.machine_details}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-zinc-950 border-input h-11 font-semibold text-foreground placeholder:text-muted-foreground/60 w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card 4: Audio recording, detailed descriptions and media attachments */}
          <Card className="bg-slate-300 dark:bg-zinc-900 border-slate-450 dark:border-zinc-800 shadow-sm text-slate-900 dark:text-zinc-100">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Descrição de Negócios e Mídias
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Adicione notas de operação relevantes e anexe fotos ou vídeos de campo.</CardDescription>
                </div>
                
                {/* Microfone recording with AI Speech-To-Text transcription */}
                <div className="self-start sm:self-center">
                  <Button 
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={transcribing}
                    className={cn(
                      "h-9 font-black uppercase text-[10px] tracking-wide gap-2 border-2 bg-white dark:bg-zinc-950 text-foreground",
                      isRecording && "animate-pulse bg-red-650 hover:bg-red-700 text-white"
                    )}
                  >
                    {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5 text-primary" />}
                    {isRecording ? 'Parar Gravação' : 'Gravar Áudio (IA Transcreve)'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 relative">
                <Textarea 
                  id="description" 
                  name="description"
                  placeholder="Informe observações comerciais, detalhes do acoplamento, ou clique acima para falar que a IA fará a transcrição de áudio automática para você..." 
                  value={formData.description}
                  onChange={handleInputChange}
                  className="bg-white dark:bg-zinc-950 border-input min-h-[160px] text-base leading-relaxed font-semibold text-foreground placeholder:text-muted-foreground/60 w-full"
                />

                {/* Loading state indicator for speech to text */}
                {(transcribing || isRecording) && (
                  <div className="absolute inset-0 pointer-events-none z-10 rounded-md">
                    {transcribing && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center rounded-md border border-primary/20 pointer-events-auto">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <span className="text-xs font-black text-primary uppercase tracking-widest">IA Roder Transcrevendo...</span>
                      </div>
                    )}
                    {isRecording && !transcribing && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-widest animate-pulse pointer-events-auto border-2 border-white/20 shadow-lg">
                        <Mic className="h-3.5 w-3.5" />
                        Capturando Voz...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Photos and videos of host machine or operations */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase text-muted-foreground/80">Fotos e Vídeos Úteis (Máx 10 fotos, 3 vídeos)</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {files.map((file, i) => (
                    <div key={i} className="relative aspect-square rounded-xl bg-muted border border-border overflow-hidden group shadow-sm">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 relative">
                          <video 
                            src={URL.createObjectURL(file)} 
                            className="w-full h-full object-cover"
                            onClick={e => {
                              const v = e.target as HTMLVideoElement;
                              v.paused ? v.play() : v.pause();
                            }}
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                            <Video className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1.5 right-1.5 p-1 bg-destructive rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {uploadProgress[file.name] !== undefined && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                          <div 
                            className="h-full bg-primary transition-all" 
                            style={{ width: `${uploadProgress[file.name]}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-primary bg-white dark:bg-zinc-950 shadow-xs">
                    <Camera className="h-6 w-6 mb-1 text-muted-foreground/60" />
                    <span className="text-[10px] font-black uppercase text-center">Adicionar</span>
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions footer */}
          <div className="pt-4 pb-12 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => navigate(-1)} 
              className="w-full sm:w-auto h-12 px-6 font-bold border-border"
              disabled={loading}
            >
              Cancelar
            </Button>
            <div className="w-full sm:w-auto flex items-center gap-1.5">
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/10 flex items-center justify-center"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                {loading ? 'Processando envio...' : 'Enviar Nova Indicação'}
              </Button>
              <HelpTooltip content="Finaliza o cadastro da indicação comercial. Luana e Gislene receberão alertas instantâneos de negócios no ERP." />
            </div>
          </div>
        </div>
      </div>

      {/* Equipment creation dialog (Admin/Manager exclusive) */}
      <Dialog open={isAddEquipOpen} onOpenChange={setIsAddEquipOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Cadastrar Novo Equipamento</h2>
              <p className="text-xs text-muted-foreground mt-1">Este equipamento será salvo no banco de dados e aparecerá instantaneamente como botão de clique.</p>
            </div>
            
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="new_equip_name">Nome do Produto *</Label>
                <Input 
                  id="new_equip_name" 
                  value={newEquipName} 
                  onChange={(e) => setNewEquipName(e.target.value)} 
                  placeholder="Ex: Garra Traçadora GT30" 
                  className="bg-white dark:bg-zinc-950 border-input h-11 font-semibold text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new_equip_code">Código Comercial / SKU (Opcional)</Label>
                <Input 
                  id="new_equip_code" 
                  value={newEquipCode} 
                  onChange={(e) => setNewEquipCode(e.target.value)} 
                  placeholder="Ex: COG-GT30" 
                  className="bg-white dark:bg-zinc-950 border-input h-11 font-semibold text-foreground"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2 border-t border-border/15">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsAddEquipOpen(false)} 
                className="border-border h-10 px-4 font-bold text-xs"
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={handleAddEquipment} 
                className="bg-primary hover:bg-primary/95 text-primary-foreground h-10 px-5 font-black text-xs uppercase"
              >
                Cadastrar e Selecionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modern Equipment Dialog Selector (Space-saving & Collapsible families) */}
      <Dialog open={isEquipSelectorOpen} onOpenChange={setIsEquipSelectorOpen}>
        <DialogContent className="sm:max-w-[650px] w-full bg-card border-border text-foreground max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <div className="space-y-1 pb-3 border-b">
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Package className="h-5.5 w-5.5 text-primary" />
              Catálogo de Equipamentos RODER
            </h2>
            <p className="text-xs text-muted-foreground">Selecione ou clique nas famílias técnicas abaixo para adicionar os modelos desejados.</p>
          </div>

          <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-1">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou modelo comercial..." 
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10 bg-white dark:bg-zinc-950 border-input h-11 rounded-xl font-semibold text-foreground"
              />
            </div>

            {/* Wrapped Category Buttons (No scroll bar, comfortable wrapping small buttons) */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {['Todos', ...Array.from(new Set(catalogProducts.map(p => p.category || 'Geral'))).sort()].map(cat => (
                <Badge 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  variant={selectedCategory === cat ? 'default' : 'secondary'}
                  className={cn(
                    "px-3 py-1.5 cursor-pointer font-bold rounded-lg text-xs whitespace-nowrap transition-all select-none border",
                    selectedCategory === cat 
                      ? "bg-primary text-primary-foreground border-primary shadow" 
                      : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                  )}
                >
                  {cat}
                </Badge>
              ))}
            </div>

            {/* List block */}
            <div className="space-y-3.5">
              {catalogProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary mb-2 opacity-50" />
                  <p className="text-xs">Carregando catálogo de equipamentos RODER...</p>
                </div>
              ) : (() => {
                const filtered = catalogProducts.filter(p => {
                  const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                                        p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
                                        (p.models || []).some(m => m.name.toLowerCase().includes(productSearch.toLowerCase()));
                  if (!matchesSearch) return false;
                  if (selectedCategory === 'Todos') return true;
                  return (p.category || 'Geral') === selectedCategory;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 border border-dashed rounded-xl bg-muted/10">
                      <p className="text-xs text-muted-foreground">Nenhum equipamento corresponde aos filtros selecionados.</p>
                    </div>
                  );
                }

                return filtered.map(p => {
                  const isAnySelected = selectedItems.some(item => 
                    item.product_name.toLowerCase() === p.name.toLowerCase() || 
                    item.product_name.toLowerCase().startsWith(`${p.name.toLowerCase()} - `)
                  );
                  const hasModels = p.models && p.models.length > 0;
                  const isExpanded = !!expandedProducts[p.id];
                  const isGeneralSelected = selectedItems.some(item => item.product_name.toLowerCase() === p.name.toLowerCase());

                  return (
                    <div 
                      key={p.id}
                      className={cn(
                        "border border-border rounded-xl p-3.5 transition-all",
                        isAnySelected ? "bg-primary/5 border-primary/40 shadow-xs" : "bg-muted/10 hover:bg-muted/20"
                      )}
                    >
                      <div 
                        onClick={() => {
                          if (!hasModels) {
                            handleProductCardClick(p);
                          } else {
                            setExpandedProducts(prev => ({ ...prev, [p.id]: !prev[p.id] }));
                          }
                        }}
                        className="flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {p.image_url && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxImage(p.image_url);
                                setLightboxTitle(p.name);
                                setIsLightboxOpen(true);
                              }}
                              className="h-10 w-10 rounded-lg overflow-hidden border shrink-0 bg-background flex items-center justify-center cursor-pointer hover:scale-110 transition-transform active:scale-95"
                              title="Clique para expandir"
                            >
                              <SmartImage src={p.image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-extrabold text-sm text-foreground leading-tight">{p.name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight mt-0.5">{p.category || 'Catálogo'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {hasModels && (
                            <Badge variant="outline" className="text-[9px] bg-background border-border font-bold">
                              {p.models.length} Modelos
                            </Badge>
                          )}
                          <div className={cn(
                            "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors bg-background",
                            isAnySelected ? "bg-primary border-primary text-primary-foreground" : "border-slate-300"
                          )}>
                            {isAnySelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>

                      {/* Models dropdown inline selection */}
                      {hasModels && (isExpanded || isAnySelected) && (
                        <div className="mt-3.5 pt-3 border-t border-dashed border-border/80 pl-2 space-y-2.5 animate-in fade-in duration-200">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Modelos Disponíveis:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Option Geral */}
                            <div 
                              onClick={() => handleSelectGeneral(p)}
                              className={cn(
                                "p-2.5 rounded-lg border-2 flex items-center justify-between cursor-pointer transition-colors text-xs font-semibold select-none",
                                isGeneralSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted/10 text-muted-foreground"
                              )}
                            >
                              <span>Geral (A definir)</span>
                              <div className={cn(
                                "h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-all bg-background",
                                isGeneralSelected ? "bg-white border-white text-primary" : "border-slate-300"
                              )}>
                                {isGeneralSelected && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                            </div>

                            {/* Models options */}
                            {p.models.map(m => {
                              const modelName = `${p.name} - ${m.name}`;
                              const isModelSelected = selectedItems.some(item => item.product_name.toLowerCase() === modelName.toLowerCase());
                              return (
                                <div 
                                  key={m.id}
                                  onClick={() => handleSelectModel(p, m)}
                                  className={cn(
                                    "p-2.5 rounded-lg border-2 flex items-center justify-between cursor-pointer transition-colors text-xs font-semibold select-none",
                                    isModelSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted/10 text-muted-foreground"
                                  )}
                                >
                                  <span className="truncate">{m.name}</span>
                                  <div className={cn(
                                    "h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-all bg-background",
                                    isModelSelected ? "bg-white border-white text-primary" : "border-slate-300"
                                  )}>
                                    {isModelSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="pt-3 border-t flex justify-end">
            <Button 
              type="button"
              onClick={() => setIsEquipSelectorOpen(false)}
              className="bg-primary hover:bg-primary/95 text-primary-foreground h-10 px-6 font-black text-xs uppercase rounded-xl"
            >
              Concluir Seleção ({selectedItems.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ImageLightbox 
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={lightboxImage}
        title={lightboxTitle}
      />
    </Layout>
  );
}
