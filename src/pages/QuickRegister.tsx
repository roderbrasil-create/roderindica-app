import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  setDoc,
  where,
  or,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage, auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { Fair, RegisteredProduct, FairLead } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  LayoutDashboard,
  ArrowLeft,
  UserPlus,
  Users,
  Building2, 
  Truck, 
  Handshake, 
  MapPin, 
  Share2, 
  ChevronLeft,
  CheckCircle2,
  Check,
  CheckCheck,
  Loader2,
  Phone,
  User,
  Plus,
  History,
  Pencil,
  Trash2,
  Mic,
  MicOff,
  Sparkles,
  MessageCircle,
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { maskPhone } from '../lib/masks';
import { refineTranscription } from '../services/geminiService';
import { sendThankYouEmail, notifyLuanaNewFairLead } from '../services/emailService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Speech recognition type definitions
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// International phone data
const countries = [
  { name: 'Brasil', code: '+55', flag: '🇧🇷', mask: '(99) 99999-9999' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷', mask: '9 99 9999-9999' },
  { name: 'Paraguai', code: '+595', flag: '🇵🇾', mask: '999 999-999' },
  { name: 'Uruguai', code: '+598', flag: '🇺🇾', mask: '9 999 99 99' },
  { name: 'Chile', code: '+56', flag: '🇨🇱', mask: '9 9999 9999' },
  { name: 'Bolívia', code: '+591', flag: '🇧🇴', mask: '9999-9999' },
  { name: 'EUA', code: '+1', flag: '🇺🇸', mask: '(999) 999-9999' },
  { name: 'Outro', code: '', flag: '🌐', mask: '' },
];

export default function QuickRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fairIdFromUrl = searchParams.get('fairId');
  const sellerNameFromUrl = searchParams.get('sellerName');
  const sellerEmailFromUrl = searchParams.get('sellerEmail');
  const { profile, user } = useAuth();
  
  const [fairs, setFairs] = useState<Fair[]>([]);
  const [selectedFairId, setSelectedFairId] = useState<string>(fairIdFromUrl || '');
  const [selectedFairName, setSelectedFairName] = useState<string>('');
  const [products, setProducts] = useState<RegisteredProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingIA, setProcessingIA] = useState(false);
  const [view, setView] = useState<'form' | 'history'>('form');
  const [sellerLeads, setSellerLeads] = useState<any[]>([]);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  
  // Offline State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<any[]>([]);

    // One-off force cache refresh to display Cidade/Estado fields immediately
  useEffect(() => {
    const cacheKey = 'roder_quick_register_city_state_v3';
    if (!localStorage.getItem(cacheKey)) {
      localStorage.setItem(cacheKey, 'true');
      if (typeof caches !== 'undefined' && caches.keys) {
        caches.keys().then((names) => {
          Promise.all(names.map(name => caches.delete(name))).then(() => {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const reg of registrations) {
                  reg.update();
                }
              });
            }
            window.location.reload();
          });
        });
      } else {
        window.location.reload();
      }
    }
  }, []);

  // Connectivity Listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restabelecida! Sincronizando registros pendentes...');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Você está offline. Os registros serão salvos no celular e sincronizados depois.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Logic
  useEffect(() => {
    const storedPending = localStorage.getItem('roder_pending_leads');
    if (storedPending) {
      setPendingSync(JSON.parse(storedPending));
    }
  }, []);

  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      const syncLeads = async () => {
        const remaining = [...pendingSync];
        const processedIds: string[] = [];

        for (const lead of pendingSync) {
          try {
            // Text data first
            const leadDoc = await addDoc(collection(db, 'fair_leads'), {
              ...lead,
              created_at: lead.created_at || new Date().toISOString(),
              synced_at: new Date().toISOString()
            });

            // Send thank you email if possible
            const fair = fairs.find(f => f.id === lead.fair_id);
            const fairName = fair?.name || 'Evento Roder';

            if (lead.email) {
              sendThankYouEmail(lead.name, lead.email, fairName).catch(e => console.error('Email sync error:', e));
            }

            // Notify Luana (somente para clientes)
            if (lead.type === 'client' || !lead.type) {
              notifyLuanaNewFairLead(lead, fairName).catch(e => console.error('Luana notification sync error:', e));
            }

            processedIds.push(lead.tempId);
          } catch (err) {
            console.error('Error syncing individual lead:', err);
          }
        }

        const newPending = remaining.filter(l => !processedIds.includes(l.tempId));
        setPendingSync(newPending);
        localStorage.setItem('roder_pending_leads', JSON.stringify(newPending));
        
        if (processedIds.length > 0) {
          toast.success(`${processedIds.length} registros sincronizados com sucesso!`);
        }
      };

      syncLeads();
    }
  }, [isOnline, pendingSync.length, fairs]);

  // Seller Info (for unauthenticated or persistent identification)
  const [sellerInfo, setSellerInfo] = useState({
    name: sellerNameFromUrl || localStorage.getItem('roder_seller_name') || '',
    email: sellerEmailFromUrl || localStorage.getItem('roder_seller_email') || ''
  });
  const [showSellerModal, setShowSellerModal] = useState(false);

  // Persistence of seller info from URL
  useEffect(() => {
    if (sellerNameFromUrl) {
      localStorage.setItem('roder_seller_name', sellerNameFromUrl);
      if (sellerEmailFromUrl) localStorage.setItem('roder_seller_email', sellerEmailFromUrl);
    }
    if (fairIdFromUrl) {
      localStorage.setItem('roder_last_fair_id', fairIdFromUrl);
    }
  }, [sellerNameFromUrl, sellerEmailFromUrl, fairIdFromUrl]);

  // Auth consistency for anonymous sellers
  useEffect(() => {
    if (!loading && !user && !profile) {
      console.log("Authenticating anonymously for quick register...");
      signInAnonymously(auth).catch(err => {
        console.error("Anonymous auth failed:", err);
      });
    }
  }, [loading, user, profile]);

  // Consolidate PWA title and Apple meta tag logic
  useEffect(() => {
    const updatePWAMeta = (title: string) => {
      document.title = title;
      
      // Inject a custom manifest for this specific fair to ensure correct name when saving to home screen
      // Use unique IDs to avoid conflicting with the main 'Roder Gestão' app
      const manifestLink = document.querySelector('link[rel="manifest"]');
      const customManifest = JSON.stringify({
        id: `/fair_${fairIdFromUrl || 'default'}`,
        name: title,
        short_name: title,
        description: `Registro de Leads - ${title}`,
        display: "standalone",
        start_url: window.location.href, // This helps saving specific fair links
        scope: "/",
        icons: [
          {
            src: "https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png",
            sizes: "192x192",
            type: "image/png"
          }
        ]
      });
      
      if (manifestLink) {
        manifestLink.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(customManifest)}`);
      } else {
        const newManifest = document.createElement('link');
        newManifest.rel = 'manifest';
        newManifest.href = `data:application/json;charset=utf-8,${encodeURIComponent(customManifest)}`;
        document.head.appendChild(newManifest);
      }

      let meta = document.getElementById('apple-app-title') as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.id = 'apple-app-title';
        meta.name = 'apple-mobile-web-app-title';
        document.getElementsByTagName('head')[0].appendChild(meta);
      }
      meta.setAttribute('content', title);
    };

    if (selectedFairName) {
      updatePWAMeta(selectedFairName.toUpperCase());
    } else if (fairIdFromUrl) {
      updatePWAMeta("CADASTRO FEIRA");
    } else {
      updatePWAMeta("RODER LEADS");
    }
  }, [selectedFairName, fairIdFromUrl]);

  // Determine modal visibility
  useEffect(() => {
    // Only show the modal automatically on mount if no identification is found
    // We don't use sellerInfo.name here to prevent it from closing prematurely while the user is typing
    if (!profile && !localStorage.getItem('roder_seller_name') && !loading) {
      setShowSellerModal(true);
    }
  }, [profile, loading]);

  // Form State
  const [leadType, setLeadType] = useState<'client' | 'partner' | 'supplier'>('client');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    company: '',
    city: '',
    state: '',
    interest_products: [] as string[],
    observations: '',
  });

  const [leadTemperature, setLeadTemperature] = useState<'cold' | 'warm' | 'hot'>('warm');

  const [photos, setPhotos] = useState<{ url: string; file: File; type: 'card' | 'customer' | 'booth' }[]>([]);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [refiningVoice, setRefiningVoice] = useState(false);
  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    if (!isListening) {
      accumulatedTranscriptRef.current = '';
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        // IA somente escuta (não descreve live no state)
        accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + transcript;
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
      setIsListening(true);
      toast.info('IA está ouvindo...', { 
        duration: 3000,
        icon: <Mic className="h-4 w-4 animate-pulse text-red-500" />
      });
    } else {
      stopListening();
    }
  };

  const stopListening = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      const transcript = accumulatedTranscriptRef.current.trim();
      if (transcript.length > 0) {
        setRefiningVoice(true);
        const toastId = toast.loading('IA organizando sua fala...');
        try {
          const refined = await refineTranscription(transcript);
          setFormData(prev => ({ 
            ...prev, 
            observations: prev.observations ? `${prev.observations}\n\n${refined}` : refined 
          }));
          toast.success('Notas organizadas!', { id: toastId });
        } catch (err) {
          setFormData(prev => ({ 
            ...prev, 
            observations: prev.observations ? `${prev.observations}\n\n${transcript}` : transcript 
          }));
          toast.dismiss(toastId);
        } finally {
          setRefiningVoice(false);
        }
      }
    }
  };

  const finalizeTranscription = () => {
    // This is now handled inside stopListening for one-shot processing
  };

  // Initialize Gemini
  // Remove local ai instantiation to use the exported one from firebase.ts
  // const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }), []);

  useEffect(() => {
    // Load active fairs
    const qFairs = query(collection(db, 'fairs'), where('status', '==', 'active'));
    const unsubscribeFairs = onSnapshot(qFairs, (snapshot) => {
      const fairsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fair));
      setFairs(fairsData);
      
      const now = new Date();
      const currentFairId = fairIdFromUrl || selectedFairId;
      
      // Auto-select fair if none selected and not in URL
      if (!currentFairId && fairsData.length > 0) {
        // Try to find the "best" fair based on date logic
        const activeFairs = fairsData.filter(fair => {
          const start = new Date(fair.start_date);
          const end = new Date(fair.end_date);
          const activeStart = new Date(start);
          activeStart.setDate(start.getDate() - 3);
          const activeEnd = new Date(end);
          activeEnd.setDate(end.getDate() + 3);
          return now >= activeStart && now <= activeEnd;
        });

        if (activeFairs.length > 0) {
          // Priority logic (same as Dashboard)
          const happeningNow = activeFairs.find(f => {
            const s = new Date(f.start_date);
            const e = new Date(f.end_date);
            return now >= s && now <= e;
          });
          
          if (happeningNow) {
            setSelectedFairId(happeningNow.id);
          } else {
            const upcoming = activeFairs
              .filter(f => now < new Date(f.start_date))
              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
            
            if (upcoming) {
              setSelectedFairId(upcoming.id);
            } else {
              const finished = activeFairs
                .filter(f => now > new Date(f.end_date))
                .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
              if (finished) setSelectedFairId(finished.id);
            }
          }
        } else if (fairsData.length === 1) {
          setSelectedFairId(fairsData[0].id);
        }
      } else if (fairIdFromUrl) {
        setSelectedFairId(fairIdFromUrl);
      }

      if (currentFairId) {
        const fair = fairsData.find(f => f.id === currentFairId);
        if (fair) {
          setSelectedFairName(fair.name);
          document.title = `${fair.name} Leads`;
        }
      }
      
      setLoading(false);
    }, (error) => {
      console.error("Error loading fairs:", error);
      setLoading(false);
      toast.error("Erro ao conectar com as feiras.");
    });

    // If we have a specific fairId, fetch it even if it's not "active" as a fallback
    if (fairIdFromUrl) {
      getDoc(doc(db, 'fairs', fairIdFromUrl)).then(docSnap => {
        if (docSnap.exists()) {
          const fairData = { id: docSnap.id, ...docSnap.data() } as Fair;
          if (!fairs.some(f => f.id === fairIdFromUrl)) {
            setFairs(prev => [...prev, fairData]);
          }
          if (fairData) {
            setSelectedFairName(fairData.name);
          }
        }
      });
    }

    // Load products for selection
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProducts(productsData);
    });

    return () => {
      unsubscribeFairs();
      unsubscribeProducts();
    };
  }, [fairIdFromUrl]);

  // Load leads from the current seller
  useEffect(() => {
    if (!sellerInfo.name && !profile && !user) return;
    
    // We filter by salesperson_uid OR salesperson_email if logged in
    const salespersonUid = profile?.uid || user?.uid || 'anonymous';
    const salespersonEmail = profile?.email || user?.email || sellerInfo.email;
    
    // Fetch all leads for this fair to be resilient to indexing issues with complex OR queries
    // Filtering in memory is fine for fair lead volumes
    const qFairLeads = query(
      collection(db, 'fair_leads'), 
      where('fair_id', '==', selectedFairId),
      orderBy('created_at', 'desc')
    );

    const unsubscribeLeads = onSnapshot(qFairLeads, (snapshot) => {
      let leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Filter by the current performer
      const filteredLeads = leads.filter(l => {
        // 1. Match by UID if both have real IDs
        if (l.salesperson_uid === salespersonUid && salespersonUid !== 'anonymous') return true;
        
        // 2. Match by Email (case insensitive) - very reliable
        if (salespersonEmail && l.salesperson_email?.toLowerCase() === salespersonEmail.toLowerCase()) return true;
        
        // 3. Match by Name (case insensitive) - fallback for legacy or anonymous
        if (sellerInfo.name && l.salesperson_name?.toLowerCase() === sellerInfo.name.toLowerCase()) return true;
        
        // 4. Special case: if I saved it as 'anonymous' but now I'm logged in or have a name, 
        // match by name to recover the lead I just saved
        if (l.salesperson_uid === 'anonymous' && l.salesperson_name?.toLowerCase() === sellerInfo.name?.toLowerCase()) return true;

        return false;
      });
      
      setSellerLeads(filteredLeads);
    }, (error) => {
      console.error("Error loading leads:", error);
    });

    return () => unsubscribeLeads();
  }, [sellerInfo.name, profile, user, selectedFairId]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Apply Brazilian mask if it's Brazil
    if (selectedCountry.code === '+55') {
      value = maskPhone(value);
    } else {
      value = value.replace(/\D/g, '');
    }
    
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
      // CPF: 000.000.000-00
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0000-00
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    // Limit to CNPJ length
    if (value.length > 18) value = value.substring(0, 18);
    
    setFormData(prev => ({ ...prev, cnpj: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'card' | 'customer' | 'booth') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const url = URL.createObjectURL(compressedFile);
      
      setPhotos(prev => [...prev.filter(p => p.type !== type || type === 'booth'), { url, file: compressedFile, type }]);

      if (type === 'card') {
        processCardWithAI(compressedFile);
      }
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Erro ao processar imagem.');
    }
  };

  const processCardWithAI = async (file: File) => {
    // Feature disabled
  };

  const handleSaveSellerInfo = () => {
    if (!sellerInfo.name || !sellerInfo.email) {
      toast.error('Informe seu nome e e-mail para continuar.');
      return;
    }
    localStorage.setItem('roder_seller_name', sellerInfo.name);
    localStorage.setItem('roder_seller_email', sellerInfo.email);
    setShowSellerModal(false);
    toast.success(`Bem-vindo, ${sellerInfo.name.split(' ')[0]}!`);
  };

  const handleSave = async () => {
    if (!selectedFairId) {
      toast.error('Selecione a feira.');
      return;
    }
    if (!formData.name || (!formData.phone && !formData.email)) {
      toast.error('Preencha ao menos Nome e um contato (Telefone ou E-mail).');
      return;
    }

    // Capture current state for background processing
    const capturedData = { ...formData };
    const capturedPhotos = [...photos];
    const capturedLeadType = leadType;
    const capturedFairId = selectedFairId;
    const capturedCountry = { ...selectedCountry };
    const capturedEditingId = editingLeadId;
    const capturedTemperature = leadTemperature;
    const salespersonInfo = {
      uid: profile?.uid || user?.uid || 'anonymous',
      name: profile?.name || sellerInfo.name || 'Vendedor Autônomo',
      email: profile?.email || sellerInfo.email || ''
    };

    // Reset UI immediately for next registration
    if (capturedEditingId) {
      setView('history');
    }
    resetForm();

    // IF OFFLINE: Save to localStorage and finish
    if (!isOnline) {
      const tempId = `temp_${Date.now()}`;
      const offlineLead = {
        tempId,
        fair_id: capturedFairId,
        type: capturedLeadType,
        ...capturedData,
        city: capturedData.city || '',
        state: capturedData.state || '',
        phone: capturedData.phone.startsWith('+') ? capturedData.phone : `${capturedCountry.code}${capturedData.phone.replace(/\D/g, '')}`,
        country_code: capturedCountry.code,
        salesperson_uid: salespersonInfo.uid,
        salesperson_name: salespersonInfo.name,
        salesperson_email: salespersonInfo.email,
        created_at: new Date().toISOString(),
        status: 'pending',
        ai_score: 'pending',
        offline: true
      };

      const newPending = [...pendingSync, offlineLead];
      setPendingSync(newPending);
      localStorage.setItem('roder_pending_leads', JSON.stringify(newPending));
      
      toast.success('Salvo no celular (Modo Offline)', {
        description: 'Será enviado ao sistema assim que a internet voltar.'
      });
      return;
    }

    toast.info('Salvando lead... (Aguarde confirmação)', { id: 'save-lead-task' });

    // Background Process
    const processSave = async () => {
      let leadDocRef: any = null;
      try {
        // Step 1: CREATE OR UPDATE DOC FIRST (Text data only) 
        // This ensures the contact is NOT LOST even if photos fail
        const initialLeadData: any = {
          fair_id: capturedFairId,
          type: capturedLeadType,
          ...capturedData,
          phone: capturedData.phone.startsWith('+') ? capturedData.phone : `${capturedCountry.code}${capturedData.phone.replace(/\D/g, '')}`,
          country_code: capturedCountry.code,
          salesperson_uid: salespersonInfo.uid,
          salesperson_name: salespersonInfo.name,
          salesperson_email: salespersonInfo.email,
          ai_score: capturedTemperature,
          updated_at: new Date().toISOString(),
          status: 'pending' // Force status back to pending if edited, unless we want to keep processed status
        };

        if (capturedEditingId) {
          leadDocRef = doc(db, 'fair_leads', capturedEditingId);
          await updateDoc(leadDocRef, initialLeadData);
        } else {
          initialLeadData.created_at = new Date().toISOString();
          initialLeadData.photos = []; // Empty for now
          leadDocRef = await addDoc(collection(db, 'fair_leads'), initialLeadData);

          // ALSO SAVE TO MAIN INDICATIONS COLLECTION FOR IMMEDIATE TRIAGE
          if (capturedLeadType === 'client') {
            try {
              const fair = fairs.find(f => f.id === capturedFairId);
              const fairName = fair?.name || 'Evento Roder';
              
              await addDoc(collection(db, 'indications'), {
                external_seller_uid: salespersonInfo.uid,
                external_seller_name: salespersonInfo.name,
                client_name: capturedData.name,
                client_phone: initialLeadData.phone,
                client_email: capturedData.email,
                client_cnpj: capturedData.cnpj,
                client_location: `${capturedData.company || ''} (${fairName})`,
                description: `[ORIGEM: FEIRA ${fairName}]\n\n${capturedData.observations}`,
                status: 'pending',
                created_at: new Date().toISOString(),
                source: 'fair',
                fair_id: capturedFairId,
                fair_lead_id: leadDocRef.id,
                ai_score: capturedTemperature,
                base_machine: 'Solicitado em Feira',
                items: capturedData.interest_products.map(p => ({
                  product_name: p,
                  quantity: 1
                }))
              });
              console.log("Registered lead in main indications triage.");
            } catch (indicationErr) {
              console.error("Error creating companion indication:", indicationErr);
            }
          }
        }

        // Notify user that contact is safe
        toast.info('Info de contato salva! Subindo fotos...', { id: 'save-lead-task' });

        // Notifications
        const fair = fairs.find(f => f.id === capturedFairId);
        const fairName = fair?.name || 'Evento Roder';

        // Step 1.5: Send Thank You Email to Client
        if (capturedData.email) {
          sendThankYouEmail(
            capturedData.name, 
            capturedData.email, 
            fairName
          ).catch(err => console.error('Error sending thank you email:', err));
        }

        // Step 1.6: Notify Luana (Triage Manager) (somente para clientes)
        const fullLeadData = {
          ...initialLeadData,
          id: leadDocRef.id
        };
        if (fullLeadData.type === 'client' || !fullLeadData.type) {
          notifyLuanaNewFairLead(fullLeadData, fairName).catch(err => 
            console.error('Error notifying Luana:', err)
          );
        }

        // Step 2: PROCESS AND UPLOAD PHOTOS
        const uploadedPhotos: string[] = [];
        const compressionOptions = {
          maxSizeMB: 0.15, // Reduzido ainda mais para 150KB para máxima velocidade
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };
        
        for (const photo of capturedPhotos) {
          try {
            // Keep existing URLs
            if (typeof photo.url === 'string' && !photo.url.startsWith('blob:') && !photo.url.startsWith('data:')) {
              uploadedPhotos.push(photo.url);
              continue;
            }

            if (!photo.file) continue;

            // Compress
            let fileToUpload = photo.file;
            try {
              fileToUpload = await imageCompression(photo.file, compressionOptions);
            } catch (compErr) {
              console.error('Compression failed:', compErr);
            }

            const fileName = `${leadDocRef.id}_${Date.now()}_${photo.type}.jpg`;
            const storageRef = ref(storage, `fair_leads/${capturedFairId}/${fileName}`);
            
            await uploadBytes(storageRef, fileToUpload);
            const downloadUrl = await getDownloadURL(storageRef);
            uploadedPhotos.push(downloadUrl);
            
            // Incremental update for better resilience
            await updateDoc(leadDocRef, { 
              photos: uploadedPhotos,
              updated_at: new Date().toISOString()
            });
          } catch (individualErr) {
            console.error('Photo step fail:', individualErr);
          }
        }

        toast.success('Lead salvo com sucesso!', { 
          id: 'save-lead-task',
          description: 'Todos os dados e fotos foram processados.'
        });
      } catch (error) {
        console.error('Error in resilient saving:', error);
        toast.error('Erro ao salvar algumas partes. A equipe de triagem verificará.', { id: 'save-lead-task' });
      }
    };

    // Start background process without awaiting
    processSave();
  };

  const handleDeleteLead = async (id: string, name: string) => {
    // Using sonner for confirmation on mobile is tricky, so keep confirm but make it cleaner
    if (!window.confirm(`Tem certeza que deseja excluir o cadastro de "${name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    const toastId = toast.loading('Excluindo cadastro...');
    try {
      await deleteDoc(doc(db, 'fair_leads', id));
      toast.success('Cadastro excluído com sucesso!', { id: toastId });
      if (editingLeadId === id) {
        resetForm();
        setView('history');
      }
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      const authStatus = auth.currentUser ? `UID: ${auth.currentUser.uid}, Anon: ${auth.currentUser.isAnonymous}` : 'Deslogado';
      const isPermissionError = error.message?.includes('permission') || error.message?.includes('insufficient');
      toast.error(isPermissionError ? `Sem permissão para excluir (Status: ${authStatus})` : 'Erro ao excluir cadastro.', { id: toastId });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cnpj: '',
      company: '',
      city: '',
      state: '',
      interest_products: [],
      observations: '',
    });
    setPhotos([]);
    setLeadType('client');
    setEditingLeadId(null);
  };

  const handleEditLead = (lead: any) => {
    setEditingLeadId(lead.id);
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone?.replace(lead.country_code || '', '') || '',
      cnpj: lead.cnpj || '',
      company: lead.company || '',
      city: lead.city || '',
      state: lead.state || '',
      interest_products: lead.interest_products || [],
      observations: lead.observations || '',
    });
    
    // Set photos as objects with dummy files for existing ones
    setPhotos(lead.photos?.map((url: string) => ({ url, file: null as any, type: 'booth' })) || []);
    
    setLeadType(lead.type || 'client');
    setSelectedFairId(lead.fair_id);
    const country = countries.find(c => c.code === lead.country_code) || countries[0];
    setSelectedCountry(country);
    setView('form');
  };

  const safeFormatDate = (dateStr: any) => {
    try {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return '-';
    }
  };

  const generatePersonalPDF = () => {
    if (sellerLeads.length === 0) {
      toast.error('Nenhum lead para exportar.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const sellerName = profile?.name || sellerInfo.name || 'Vendedor';
    const fairName = selectedFair?.name || 'Evento Roder';

    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.text(`RELATÓRIO DE ATENDIMENTOS - ${sellerName.toUpperCase()}`, 14, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Feira: ${fairName}`, 14, 27);
    doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 32);
    
    const customers = sellerLeads.filter(l => l.type === 'client' || !l.type);
    const partners = sellerLeads.filter(l => l.type === 'partner');
    const suppliers = sellerLeads.filter(l => l.type === 'supplier');

    doc.text(`Total de Clientes: ${customers.length} | Parceiros: ${partners.length} | Fornecedores: ${suppliers.length}`, 14, 37);

    let currentY = 43;

    const sections = [
      { title: '1. CLIENTES', data: customers, color: [34, 197, 94] as [number, number, number] },
      { title: '2. PARCEIROS', data: partners, color: [245, 158, 11] as [number, number, number] },
      { title: '3. FORNECEDORES', data: suppliers, color: [59, 130, 246] as [number, number, number] }
    ];

    sections.forEach((section) => {
      if (section.data.length > 0) {
        // Add Section Header
        doc.setFontSize(12);
        doc.setTextColor(section.color[0], section.color[1], section.color[2]);
        doc.text(section.title, 14, currentY);
        currentY += 5;

        const tableData = section.data.map(lead => [
          safeFormatDate(lead.created_at),
          `${lead.name}${lead.company ? '\n' + lead.company.toUpperCase() : ''}`,
          `${lead.phone || '-'}\n${lead.email || '-'}`,
          (lead.interest_products || []).join(', ') || 'Geral',
          lead.observations || '-',
          lead.salesperson_name || 'Anônimo',
          lead.ai_score === 'hot' ? 'QUENTE' : 'MORNO'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Data', 'Lead / Empresa', 'Contato', 'Produtos', 'Observações', 'Vendedor', 'Status']],
          body: tableData,
          theme: 'grid',
          headStyles: { 
            fillColor: section.color,
            fontSize: 8,
            halign: 'center',
            valign: 'middle'
          },
          styles: { 
            fontSize: 7,
            cellPadding: 1.5,
            overflow: 'linebreak'
          },
          columnStyles: {
            0: { cellWidth: 16 }, // Data
            1: { cellWidth: 32, fontStyle: 'bold' }, // Lead / Empresa
            2: { cellWidth: 26 }, // Contato
            3: { cellWidth: 22 }, // Produtos
            4: { cellWidth: 50 }, // Observações
            5: { cellWidth: 22 }, // Vendedor
            6: { cellWidth: 14, halign: 'center' }  // Status
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 6) {
              const val = data.cell.raw as string;
              if (val === 'QUENTE') {
                data.cell.styles.textColor = [220, 38, 38]; // Red-600
                data.cell.styles.fontStyle = 'bold';
              } else {
                data.cell.styles.textColor = [217, 119, 6]; // Amber-600
              }
            }
          }
        });

        // @ts-ignore - finalY is available in autoTable result
        currentY = doc.lastAutoTable.finalY + 10;

        // Check if we need a new page for the next section if space is tight
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
      }
    });

    const fileName = `meus_atendimentos_${sellerName.toLowerCase().replace(/\s+/g, '_')}.pdf`;
    
    if (navigator.share) {
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      navigator.share({
        files: [pdfFile],
        title: 'Meus Leads Roder',
        text: `Relatório de atendimentos na feira ${fairName}`
      }).catch(() => {
        doc.save(fileName);
        toast.info('PDF baixado!');
      });
    } else {
      doc.save(fileName);
      toast.info('PDF exportado com sucesso!');
    }
  };

  const selectedFair = fairs.find(f => f.id === selectedFairId);

  useEffect(() => {
    // Edge Node Heartbeat for Fair Registration
    const updateHeartbeat = async () => {
      try {
        let deviceId = localStorage.getItem('roder_device_id');
        if (!deviceId) {
          deviceId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
          localStorage.setItem('roder_device_id', deviceId);
        }

        const nodeId = profile ? `${profile.uid}_${deviceId}` : `anonymous_fair_${deviceId}`;
        const nodeRef = doc(db, 'edge_nodes', nodeId);
        
        await setDoc(nodeRef, {
          last_seen: serverTimestamp(),
          uid: profile?.uid || 'anonymous',
          email: profile?.email || 'vendedor@feira.roder',
          name: profile?.name || sellerInfo.name || 'Vendedor na Feira',
          role: profile?.role || 'vendedor_feira',
          app_version: '2.5.0-fair',
          is_pwa: window.matchMedia('(display-mode: standalone)').matches,
          device_info: navigator.userAgent.substring(0, 50) + ' (Fair Screen)',
          active_fair: selectedFairId
        }, { merge: true });
      } catch (e) {
        console.error("Heartbeat error in Fair Register", e);
      }
    };

    updateHeartbeat();
    const interval = setInterval(updateHeartbeat, 60000); // Every minute
    return () => clearInterval(interval);
  }, [profile, sellerInfo.name, selectedFairId]);

  useEffect(() => {
    if (!sellerInfo.name) return;

    // Real-time listener for current seller's leads in the selected fair
    // This ensures that as soon as a lead is saved, it appears in the "Meus Atendimentos" view
    const q = query(
      collection(db, 'fair_leads'),
      where('fair_id', '==', selectedFairId),
      where('salesperson_name', '==', sellerInfo.name),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FairLead));
      setSellerLeads(leads);
    }, (error) => {
      console.error("Error listening to fair leads:", error);
    });

    return () => unsubscribe();
  }, [selectedFairId, sellerInfo.name]);

  const handleShareMap = () => {
    // Generate a clean and specific fair link
    const fairId = searchParams.get('fairId') || selectedFairId;
    const shareUrl = `${window.location.origin}/expo?fairId=${fairId || ''}`;
    
    // Simple, direct message with ONLY ONE link as requested
    const message = `RODER INDICA - CADASTRO DE LEADS\n\nCadastre aqui seus atendimentos na feira:\n${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Registro Rápido Roder',
        text: message
      }).catch(() => {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
      });
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-10 overflow-x-hidden w-full">
      {/* Header Mobile Otimizado */}
      <div className="px-3 py-2.5 bg-slate-900 border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center justify-between gap-2 max-w-sm mx-auto">
          {view === 'form' ? (
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png" 
                className="h-5 w-5 object-contain invert grayscale opacity-20" 
                alt="R"
              />
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setView('form')} className="text-white/60 h-8 w-8">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex-grow flex items-center gap-2 overflow-hidden">
            <div className="text-left overflow-hidden">
              <h1 className="text-[14px] font-black uppercase tracking-tighter truncate leading-tight">
                {view === 'history' ? 'MEUS REGISTROS' : (selectedFair ? selectedFair.name : 'RODER EXPO MINAS')}
              </h1>
              <p className="text-[8px] font-bold text-slate-500 flex items-center gap-1 uppercase">
                {view === 'history' ? (
                  <><Users className="h-2 w-2" /> {sellerLeads.length + pendingSync.length} leads</>
                ) : (
                   <><MapPin className="h-2 w-2 text-primary" /> Sete Lagoas - MG</>
                )}
                {!isOnline && (
                  <span className="flex items-center gap-1 text-amber-500 font-black animate-pulse ml-1">
                    • OFFLINE
                  </span>
                )}
                {pendingSync.length > 0 && (
                  <span className="flex items-center gap-1 text-primary font-black ml-1">
                    • {pendingSync.length} PENDENTES
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-1">
            {view === 'form' ? (
              <Button variant="ghost" size="icon" onClick={() => setView('history')} className="text-primary h-8 w-8 relative">
                <History className="h-4 w-4" />
                {sellerLeads.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-slate-900" />
                )}
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setView('form')} className="text-primary h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            )}
            
            {view === 'history' && (
              <Button variant="ghost" size="icon" onClick={generatePersonalPDF} className="text-[#22c55e] h-8 w-8" title="Exportar PDF">
                <FileDown className="h-4 w-4" />
              </Button>
            )}

            <Button variant="ghost" size="icon" onClick={handleShareMap} className="text-primary group h-8 w-8" title="Compartilhar Link">
              <Share2 className="h-4 w-4 group-active:scale-125 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-2 py-0.5 max-w-sm mx-auto flex flex-col min-h-[500px]">
        <div className="flex-grow">
          <AnimatePresence mode="wait">
            {view === 'form' ? (
              <motion.div 
                key="view-form" 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5"
              >
                {/* Logo Roder Compacta */}
                {!editingLeadId && (
                  <div className="py-1 flex flex-col items-center justify-center space-y-1">
                    <div className="w-full h-14 bg-black rounded-xl shadow-lg flex items-center justify-center p-2 border border-white/5">
                      <img 
                        src="https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/05/logo-roderbrasil.png.webp" 
                        className="h-5 w-auto object-contain invert brightness-0 invert" 
                        referrerPolicy="no-referrer" 
                        alt="Roder Brasil"
                      />
                    </div>
                    <div className="text-center">
                      <h2 className="text-[9px] font-black tracking-[0.2em] text-primary uppercase">{selectedFair?.name || 'Expo Minas 2026'}</h2>
                    </div>
                  </div>
                )}

              {editingLeadId && (
                <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Pencil className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Editando</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteLead(editingLeadId, formData.name)} 
                      className="h-5 px-2 text-[8px] uppercase font-black text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      Excluir
                    </Button>
                    <Button variant="ghost" size="sm" onClick={resetForm} className="h-5 px-2 text-[8px] uppercase font-black">Sair</Button>
                  </div>
                </div>
              )}
              {/* Seletor de Tipo de Cadastro */}
              <div className="grid grid-cols-3 p-0.5 bg-white/5 rounded-lg border border-white/10">
            <button 
              onClick={() => setLeadType('client')}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 rounded-md transition-all",
                leadType === 'client' ? "bg-primary text-primary-foreground shadow-md" : "text-white/40 hover:text-white/60"
              )}
            >
              <User className="h-3 w-3" />
              <span className="text-[7px] font-black uppercase tracking-widest">Cliente</span>
            </button>
            <button 
              onClick={() => setLeadType('partner')}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 rounded-md transition-all",
                leadType === 'partner' ? "bg-amber-500 text-white shadow-md" : "text-white/40 hover:text-white/60"
              )}
            >
              <Handshake className="h-3 w-3" />
              <span className="text-[7px] font-black uppercase tracking-widest">Parceiro</span>
            </button>
            <button 
              onClick={() => setLeadType('supplier')}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 rounded-md transition-all",
                leadType === 'supplier' ? "bg-blue-500 text-white shadow-md" : "text-white/40 hover:text-white/60"
              )}
            >
              <Truck className="h-3 w-3" />
              <span className="text-[7px] font-black uppercase tracking-widest">Fon-cedor</span>
            </button>
          </div>

          {/* Formulário Principal */}
          <div className="space-y-1.5 bg-white/5 p-2 rounded-xl border border-white/10 shadow-lg relative overflow-hidden">
             {/* Discrete Temperature Score Dots */}
             <div className="absolute top-2 right-2 flex gap-1.5 p-1 bg-black/40 rounded-full border border-white/5 backdrop-blur-sm">
               <button 
                 onClick={() => setLeadTemperature('hot')}
                 className={cn("w-3 h-3 rounded-full transition-all ring-offset-2 ring-offset-slate-900", leadTemperature === 'hot' ? "bg-red-500 scale-125 ring-2 ring-red-500/50" : "bg-red-900/40")} 
                 title="Quente"
               />
               <button 
                 onClick={() => setLeadTemperature('warm')}
                 className={cn("w-3 h-3 rounded-full transition-all ring-offset-2 ring-offset-slate-900", leadTemperature === 'warm' ? "bg-amber-500 scale-125 ring-2 ring-amber-500/50" : "bg-amber-900/40")} 
                 title="Morno"
               />
               <button 
                 onClick={() => setLeadTemperature('cold')}
                 className={cn("w-3 h-3 rounded-full transition-all ring-offset-2 ring-offset-slate-900", leadTemperature === 'cold' ? "bg-blue-500 scale-125 ring-2 ring-blue-500/50" : "bg-blue-900/40")} 
                 title="Frio"
               />
             </div>

             <div className="space-y-0.5">
               <Label htmlFor="q_name" className="text-[12px] font-black uppercase tracking-widest text-white/40 ml-1">Nome Completo*</Label>
               <Input 
                 id="q_name" 
                 className="bg-white/5 border-white/10 h-10 rounded-md text-[17px] font-medium focus:ring-primary px-3" 
                 placeholder="Nome do cliente"
                 value={formData.name}
                 onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
               />
             </div>

             <div className="grid grid-cols-2 gap-1.5">
               <div className="space-y-0.5">
                 <Label htmlFor="q_phone" className="text-[12px] font-black uppercase tracking-widest text-white/40 ml-1">WhatsApp*</Label>
                 <div className="flex gap-1">
                    <button 
                      type="button"
                      onClick={() => setShowCountrySelector(!showCountrySelector)}
                      className="flex items-center gap-0.5 px-1 border border-white/10 rounded-md h-10 hover:bg-white/10 transition-colors shrink-0"
                    >
                      <span className="text-base">{selectedCountry.flag}</span>
                    </button>
                    <Input 
                      id="q_phone" 
                      className="bg-white/5 border-white/10 h-10 rounded-md text-[16px] font-medium flex-grow px-2" 
                      placeholder="Número"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                    />
                 </div>
                 
                 <AnimatePresence>
                   {showCountrySelector && (
                     <motion.div 
                       initial={{ opacity: 0, y: -5 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -5 }}
                       className="absolute left-4 right-4 z-[60] grid grid-cols-4 gap-1.5 p-2 bg-slate-900 rounded-xl border border-white/20 shadow-2xl"
                     >
                       {countries.map(c => (
                         <button
                           key={c.name}
                           onClick={() => { setSelectedCountry(c); setShowCountrySelector(false); }}
                           className={cn(
                             "flex flex-col items-center gap-0.5 p-1 rounded transition-colors",
                             selectedCountry.name === c.name ? "bg-primary text-white" : "hover:bg-white/5"
                           )}
                         >
                           <span className="text-xl">{c.flag}</span>
                           <span className="text-[6px] font-black uppercase opacity-60 truncate w-full text-center">{c.name}</span>
                         </button>
                       ))}
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>

               <div className="space-y-0.5">
                 <Label htmlFor="q_cnpj" className="text-[12px] font-black uppercase tracking-widest text-white/40 ml-1">CNPJ / CPF</Label>
                 <Input 
                   id="q_cnpj" 
                   className="bg-white/5 border-white/10 h-10 rounded-md text-[16px] font-medium px-2" 
                   placeholder="00.000.000/0000-00"
                   value={formData.cnpj}
                   onChange={handleCnpjChange}
                 />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-1.5">
               <div className="space-y-0.5">
                 <Label htmlFor="q_company" className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Empresa</Label>
                 <Input 
                   id="q_company" 
                   className="bg-white/5 border-white/10 h-7 rounded-md text-[13px] font-medium px-2" 
                   placeholder="Empresa"
                   value={formData.company}
                   onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))}
                 />
               </div>

               <div className="space-y-0.5">
                 <Label htmlFor="q_email" className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">E-mail</Label>
                 <Input 
                   id="q_email" 
                   type="email"
                   className="bg-white/5 border-white/10 h-7 rounded-md text-[13px] font-medium px-2" 
                   placeholder="E-mail"
                   value={formData.email}
                   onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                 />
               </div>
             </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <Label htmlFor="q_city" className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Cidade</Label>
                  <Input 
                    id="q_city" 
                    className="bg-white/5 border-white/10 h-7 rounded-md text-[13px] font-medium px-2 text-white" 
                    placeholder="Cidade"
                    value={formData.city}
                    onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                  />
                </div>

                <div className="space-y-0.5">
                  <Label htmlFor="q_state" className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Estado</Label>
                  <select 
                    id="q_state"
                    className="flex h-7 w-full rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-[13px] text-white focus-visible:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.state || ''}
                    onChange={(e) => setFormData(p => ({ ...p, state: e.target.value }))}
                  >
                    <option value="">Selecione</option>
                    {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                      <option key={uf} value={uf} className="bg-slate-900 text-white">{uf}</option>
                    ))}
                  </select>
                </div>
              </div>

             <div className="flex flex-wrap gap-1 pt-0.5">
               {['Multifuncional', 'Garra', 'Triturador', 'Feller Tesoura', 'Feller Disc', 'Mini skidder', 'Traçadora', 'Concha'].map(tag => (
                   <button
                     key={tag}
                     onClick={() => {
                       setFormData(prev => ({
                         ...prev,
                         interest_products: prev.interest_products.includes(tag)
                           ? prev.interest_products.filter(t => t !== tag)
                           : [...prev.interest_products, tag]
                       }))
                     }}
                     className={cn(
                       "px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all",
                       formData.interest_products.includes(tag) 
                         ? "bg-primary border-primary text-white" 
                         : "bg-white/5 border-white/10 text-white/40"
                     )}
                   >
                     {tag}
                   </button>
                 ))}
                 <button className="px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/40">
                   Outro
                 </button>
               </div>

             <div className="space-y-0.5 pt-1">
               <div className="flex items-center justify-between ml-1 mb-0.5">
                 <Label htmlFor="q_obs" className="text-[9px] font-black uppercase tracking-widest text-white/40">Observações / Operação</Label>
                 <div className="flex items-center gap-2">
                   {refiningVoice && <Sparkles className="h-3 w-3 text-primary animate-pulse" />}
                   <button
                     type="button"
                     onClick={startListening}
                     className={cn(
                       "flex items-center gap-1 px-2 py-0.5 rounded-full transition-all border",
                       isListening 
                         ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" 
                         : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                     )}
                   >
                     {isListening ? <MicOff className="h-2.5 w-2.5" /> : <Mic className="h-2.5 w-2.5" />}
                     <span className="text-[9px] font-black uppercase tracking-tight">
                       {isListening ? 'Gravando...' : 'Falar'}
                     </span>
                   </button>
                 </div>
               </div>
               <Textarea 
                 id="q_obs" 
                 className="bg-white/5 border-white/10 rounded-md min-h-[115px] text-[16px] py-1.5 px-3 leading-tight" 
                 placeholder="Microfone ativo para gravar detalhes da operação..."
                 value={formData.observations}
                 onChange={(e) => setFormData(p => ({ ...p, observations: e.target.value }))}
                />
              </div>
            </div>

            {/* Botão Salvar */}
                <Button 
                  disabled={saving || processingIA}
                  onClick={handleSave}
                  className={cn(
                    "w-full h-12 rounded-xl active:scale-98 transition-all shadow-lg mt-2",
                    editingLeadId ? "bg-primary hover:bg-primary/90" : "bg-green-500 hover:bg-green-600 shadow-[0_8px_30px_rgb(34,197,94,0.3)]"
                  )}
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-black uppercase tracking-widest">
                        {editingLeadId ? 'Atualizar' : 'Salvar Registro'}
                      </span>
                    </div>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="view-history" 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 px-1"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40">Meus Atendimentos</h2>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={generatePersonalPDF}
                      className="h-7 border-primary/30 text-primary text-[8px] uppercase font-black gap-1"
                    >
                      <MessageCircle className="h-3 w-3" /> WhatsApp PDF
                    </Button>
                    <Button onClick={() => setView('form')} variant="link" className="text-[#22c55e] text-[10px] uppercase font-black">Novo Lead</Button>
                  </div>
                </div>
                
                {sellerLeads.length === 0 && pendingSync.length === 0 ? (
                  <div className="p-12 text-center text-white/20 space-y-4">
                    <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto ring-1 ring-white/10">
                      <History className="h-8 w-8 opacity-20" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest">Nenhum registro ainda</p>
                      <p className="text-[8px] font-medium opacity-50 uppercase leading-relaxed">Os leads que você cadastrar aparecerão aqui.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {/* Show Pending Offline Leads */}
                    {pendingSync.map(lead => (
                      <Card 
                        key={lead.tempId} 
                        className="bg-slate-900 border-amber-500/20 overflow-hidden opacity-80"
                      >
                        <div className="flex h-24">
                          <div className="w-24 h-full shrink-0 bg-slate-950 flex flex-col items-center justify-center p-2 border-r border-white/5">
                            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                            <span className="text-[6px] font-black mt-2 uppercase text-amber-500 text-center">Aguardando Conexão</span>
                          </div>
                          <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between">
                             <div className="space-y-0.5">
                               <h4 className="text-[11px] font-black uppercase truncate text-white">{lead.name}</h4>
                               <div className="flex items-center gap-1">
                                 <Badge variant="outline" className="text-[6px] h-3 border-amber-500 text-amber-500 uppercase font-black">Offline</Badge>
                               </div>
                               <p className="text-[9px] text-white/40 truncate font-bold uppercase">{lead.company || lead.interest_products?.join(', ')}</p>
                             </div>
                             <div className="flex items-center justify-between">
                               <p className="text-[7px] text-amber-500/60 font-medium uppercase tracking-tight">Sincronização pendente</p>
                               <div className="flex items-center gap-1">
                                 <span className="text-[8px] font-black text-white/20 uppercase">Aguardando</span>
                                 <Check className="h-3 w-3 text-white/20" />
                               </div>
                             </div>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {sellerLeads.map(lead => (
                      <Card 
                        key={`lead-${lead.id}`} 
                        id={`lead-card-${lead.id}`}
                        className="bg-slate-900 border-white/5 overflow-hidden active:scale-[0.98] transition-all cursor-pointer hover:border-primary/30" 
                        onClick={() => handleEditLead(lead)}
                      >
                        <div className="flex h-24">
                          {/* Left: Image like Catalog */}
                          <div className="w-24 h-full shrink-0 bg-slate-950 relative overflow-hidden flex items-center justify-center border-r border-white/5">
                            {lead.photos && lead.photos.length > 0 ? (
                              <img src={lead.photos[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 opacity-20">
                                <User className="h-5 w-5" />
                                <span className="text-[6px] font-black mt-1 uppercase">Sem Foto</span>
                              </div>
                            )}
                            
                            {/* Status Indicators (WhatsApp Style + OK Badge) */}
                            <div className="absolute bottom-1 right-1 flex flex-col items-end gap-1 scale-75 origin-bottom-right">
                              {lead.status === 'pending' ? (
                                <Badge className="bg-green-500 text-[8px] px-1 hover:bg-green-500 font-black animate-pulse">NA TRIAGEM OK</Badge>
                              ) : (
                                <Badge className="bg-blue-500 text-[8px] px-1 hover:bg-blue-500 font-black">ENCAMINHADO</Badge>
                              )}
                              <div className="flex items-center gap-0.5">
                                {lead.offline ? (
                                  <Check className="h-4 w-4 text-white/20" /> 
                                ) : lead.status === 'pending' ? (
                                  <CheckCheck className="h-4 w-4 text-green-500" /> 
                                ) : (
                                  <CheckCheck className="h-4 w-4 text-blue-400" />
                                )}
                              </div>
                            </div>

                            <Badge className={cn(
                              "absolute top-1 left-1 text-[6px] px-1 h-3 font-black uppercase",
                              lead.ai_score === 'hot' ? "bg-red-500" : lead.ai_score === 'cold' ? "bg-blue-500" : "bg-amber-500"
                            )}>
                              {lead.ai_score === 'hot' ? 'Quente' : lead.ai_score === 'cold' ? 'Frio' : 'Morno'}
                            </Badge>
                          </div>

                          {/* Right: Info Section */}
                          <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-start justify-between gap-1">
                                 <h4 className="text-[11px] font-black uppercase tracking-tight truncate text-white leading-tight flex-1">{lead.name}</h4>
                                 <span className="text-[8px] text-white/30 font-bold shrink-0">
                                   {new Date(lead.created_at).toLocaleDateString()}
                                 </span>
                              </div>
                              
                              <div className="flex items-center gap-1 opacity-60">
                                <Building2 className="h-2 w-2 text-primary" />
                                <p className="text-[9px] text-white/60 truncate font-bold uppercase tracking-tighter">
                                  {lead.company || lead.interest_products?.join(', ') || 'Registro Rápido'}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 opacity-40">
                                <MapPin className="h-2 w-2" />
                                <p className="text-[8px] text-white/60 truncate font-medium uppercase tracking-tighter">
                                  {lead.city ? `${lead.city}${lead.state ? ` - ${lead.state}` : ''}` : 'Localização não inf.'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-1.5 mt-1.5">
                              <div className="flex items-center gap-3">
                                <span className="text-[8px] text-primary font-black uppercase tracking-widest flex items-center gap-1">
                                  <Pencil className="h-2 w-2" /> Editar
                                </span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLead(lead.id, lead.name);
                                  }}
                                  className="text-[8px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1 hover:text-red-400"
                                >
                                  <Trash2 className="h-2 w-2" /> Excluir
                                </button>
                              </div>
                              
                              {lead.phone && (
                                 <div className="flex items-center gap-1 opacity-40">
                                    <Phone className="h-2 w-2" />
                                    <span className="text-[8px] font-mono">{lead.phone}</span>
                                 </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest pt-4">
          RODER INDICA V2 • Módulo Feiras 2026
        </p>
      </div>

      {/* Seller Recognition Modal */}
      <AnimatePresence>
        {showSellerModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Identificação</h2>
                <p className="text-sm text-white/40">Olá! Informe quem está fazendo os atendimentos nesta feira.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Seu Nome*</Label>
                  <Input 
                    placeholder="Ex: João Silva" 
                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                    value={sellerInfo.name}
                    onChange={e => setSellerInfo(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Seu E-mail*</Label>
                  <Input 
                    type="email"
                    placeholder="joao@vendas.com" 
                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                    value={sellerInfo.email}
                    onChange={e => setSellerInfo(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest" onClick={handleSaveSellerInfo}>
                  Começar Atendimentos
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recognized Seller Greeting */}
      {!showSellerModal && (sellerInfo.name || profile?.name) && (
        <div className="fixed bottom-4 left-4 right-4 z-[60] pointer-events-none">
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-[10px] font-black flex items-center justify-center">
                {(profile?.name || sellerInfo.name).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-white/40">Vendedor Ativo</p>
                <p className="text-xs font-bold text-white truncate max-w-[150px]">
                  {profile?.name || sellerInfo.name}
                </p>
              </div>
            </div>
            {!profile && (
              <button 
                onClick={() => setShowSellerModal(true)}
                className="text-[10px] font-black uppercase text-primary pointer-events-auto px-3 py-1.5 hover:bg-white/5 rounded-lg"
              >
                Trocar
              </button>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}
