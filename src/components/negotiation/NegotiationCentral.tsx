import React, { useState, useEffect, useRef } from 'react';
import { historicoComObservacao, ROTULO_OBSERVACAO_PARCEIRO } from '../../lib/observacaoParceiro';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import {
  ChevronDown, 
  X, 
  MessageSquare, 
  DollarSign, 
  Package, 
  History, 
  Headset, 
  Camera,
  Share2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Download,
  GripHorizontal,
  Plus,
  Trash2,
  Save,
  Upload,
  Loader2,
  ChevronRight,
  ChevronLeft,
  FileText,
  BadgeDollarSign,
  Info,
  Calendar,
  Clock,
  User,
  MapPin,
  ExternalLink,
  MessageCircle,
  Phone,
  LayoutDashboard,
  Settings,
  RotateCw,
  Search,
  Crown,
  Headphones,
  Sparkles,
  Paperclip,
  Mail
} from 'lucide-react';
import { useNegotiation } from '../../contexts/NegotiationContext';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../lib/firebase';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  collection, 
  getDocs, 
  getDocsFromCache,
  query, 
  where,
  serverTimestamp,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
  increment,
  runTransaction
} from 'firebase/firestore';
import { transcribeAudio, generateAISummary, analyzeDetailedBudget, analyzePDFDocument } from '../../services/geminiService';
import { notifyManagers, notifyExternalSeller, createNotification } from '../../services/notificationService';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from '../ui/dialog';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Indication, RegisteredProduct, UserProfile } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { maskCurrency, unmaskCurrency } from '../../lib/masks';
import { notifyFinanceCommissionScheduled } from '../../services/emailService';
import { compressFileToDataURL, compressImage } from '../../lib/imageUtils';
import { abrirDocumento } from '../../lib/abrirDocumento';


// Itens que não entram na comissão do indicador (além dos kits com código 9000)
const NON_COMMISSIONABLE_RE = /m[ãa]o\s*de\s*obra|frete|transporte|instala[çc][ãa]o|montagem|entrega\s*t[ée]cnica|deslocamento|kit\s+de\s+instala/i;

export default function NegotiationCentral() {
  const { 
    activeIndication, 
    isOpen, 
    activeTab: contextTab, 
    closeNegotiation, 
    refreshIndication,
    setIsInvoiceDialogOpen,
    setInvoiceIndication
  } = useNegotiation();
  const { user, profile, isAdmin, isManager, isTriagem } = useAuth();
  const isInternalSeller = profile?.role === 'internal_seller';
  const isRegionalSeller = profile?.role === 'vendedor_padrao';
  const canInteract = isAdmin || isManager || isTriagem || isInternalSeller;
  const isSold = activeIndication?.status === 'sold';
  const isEditable = canInteract && !isSold;

  const dragControls = useDragControls();
  const [activeTab, setActiveTab] = useState<'commercial' | 'timeline'>('commercial');
  const [fixingValue, setFixingValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (contextTab === 'timeline' || contextTab === 'commercial') {
      setActiveTab(contextTab as 'commercial' | 'timeline');
    }
  }, [contextTab, isOpen]);
  
  // Negotiation Form State
  const [commissionedProducts, setCommissionedProducts] = useState<{
    code: string;
    name: string;
    quantity: number;
    base_value: number;
    is_commissionable?: boolean;
    uniqueId?: string;
  }[]>([]);
  const [grossBudgetValue, setGrossBudgetValue] = useState('');
  const [budgetLoaded, setBudgetLoaded] = useState(false);
  const [budgetNumber, setBudgetNumber] = useState('');
  const [budgetDate, setBudgetDate] = useState('');
  const [readingBudgetFile, setReadingBudgetFile] = useState(false);
  const [saleValue, setSaleValue] = useState('');
  const [standardSellerEnabled, setStandardSellerEnabled] = useState(false);
  const [standardSellerRate, setStandardSellerRate] = useState(2);
  const [historyNote, setHistoryNote] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState<'nota' | 'ligacao' | 'whatsapp' | 'email' | 'proposta' | 'reuniao' | 'visita'>('nota');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'agendor' | 'roder'>('all');
  const [historyImages, setHistoryImages] = useState<File[]>([]);
  const [budgetFiles, setBudgetFiles] = useState<File[]>([]);
  const [registeredProducts, setRegisteredProducts] = useState<RegisteredProduct[]>([]);
  const [readingBudget, setReadingBudget] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [indicatorProfile, setIndicatorProfile] = useState<UserProfile | null>(null);
  // Momento em que um orçamento novo foi carregado nesta sessão (ainda não salvo).
  // É dele que conta a proteção de 60 dias, e não da data impressa no orçamento.
  const [budgetUploadedAt, setBudgetUploadedAt] = useState<string | null>(null);
  // Última versão da indicação que já foi copiada para o formulário (ver o efeito de carga)
  const formSourceRef = useRef<Indication | null>(null);
  const [extractedCnpj, setExtractedCnpj] = useState('');
  const [extractedEmail, setExtractedEmail] = useState('');
  const [extractedPhone, setExtractedPhone] = useState('');
  const [extractedAddress, setExtractedAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientCode, setClientCode] = useState('');
  

  const convertDMYtoYMD = (dmy: string): string => {
    if (!dmy) return '';
    const match = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return dmy;
  };
  
  // New line for spreadsheet
  const [newLine, setNewLine] = useState<{
    code: string;
    name: string;
    quantity: number;
    base_value: number;
    is_commissionable?: boolean;
  }>({ code: '', name: '', quantity: 1, base_value: 0, is_commissionable: true });
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fechar a central zera a referência, para que reabrir a mesma indicação recarregue tudo do banco
  useEffect(() => {
    if (!isOpen) formSourceRef.current = null;
  }, [isOpen]);

  useEffect(() => {
    if (activeIndication) {
      // O formulário era zerado a cada refreshIndication (ao registrar histórico, ao puxar do
      // Agendor ao abrir, etc.), e a leitura de orçamento ou pedido ainda não salva sumia.
      // Agora: indicação nova (ou central reaberta) carrega tudo; a MESMA indicação atualizada
      // só copia para a tela os campos que mudaram no banco, e mantém o que foi digitado ou lido.
      const prev = formSourceRef.current;
      const sameIndication = !!prev && prev.id === activeIndication.id;
      formSourceRef.current = activeIndication;
      const changed = (key: string) =>
        !sameIndication || JSON.stringify((prev as any)?.[key]) !== JSON.stringify((activeIndication as any)[key]);
      if (!sameIndication) setBudgetUploadedAt(null);

      if (changed('commissioned_products') || changed('items')) {
        let loadedProducts = (activeIndication.commissioned_products || []).map((p: any, idx: number) => ({
          ...p,
          uniqueId: p.uniqueId || `${p.code || 'item'}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
        }));

        if (loadedProducts.length === 0 && activeIndication.items && activeIndication.items.length > 0) {
          loadedProducts = activeIndication.items.map((item: any, idx: number) => ({
            code: item.code || '',
            name: item.product_name || item.name || 'Equipamento Roder',
            quantity: item.quantity || 1,
            base_value: item.price || 0,
            is_commissionable: true,
            uniqueId: `init-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
          }));
        }
        setCommissionedProducts(loadedProducts);
      }
      if (changed('gross_budget_value')) setGrossBudgetValue(activeIndication.gross_budget_value?.toString() || '');
      if (changed('budget_loaded')) setBudgetLoaded(activeIndication.budget_loaded || false);
      if (changed('budget_number')) setBudgetNumber(activeIndication.budget_number || '');
      if (changed('budget_date')) setBudgetDate(activeIndication.budget_date || '');
      if (changed('sale_value')) setSaleValue(activeIndication.sale_value?.toString() || '');
      if (changed('standard_seller_commission_enabled')) setStandardSellerEnabled(activeIndication.standard_seller_commission_enabled !== false);
      if (changed('standard_seller_commission_rate')) setStandardSellerRate(activeIndication.standard_seller_commission_rate || 2);
      if (changed('delivery_date')) setDeliveryDate(activeIndication.delivery_date || '');
      if (changed('sale_order_number')) setOrderNumber(activeIndication.sale_order_number || '');
      if (changed('sale_order_date')) setOrderDate(activeIndication.sale_order_date || '');
      if (changed('client_cnpj')) setExtractedCnpj(activeIndication.client_cnpj || '');
      if (changed('client_email')) setExtractedEmail(activeIndication.client_email || '');
      if (changed('client_phone')) setExtractedPhone(activeIndication.client_phone || '');
      if (changed('client_address')) setExtractedAddress(activeIndication.client_address || '');
      if (changed('client_company_name')) setCompanyName(activeIndication.client_company_name || '');
      if (changed('client_code')) setClientCode(activeIndication.client_code || '');

      // Mesma indicação só atualizada: perfil do parceiro e catálogo já estão carregados
      if (sameIndication && !changed('external_seller_uid')) return;

      const fetchIndicator = async () => {
        if (!activeIndication.external_seller_uid) {
          setIndicatorProfile(null);
          return;
        }
        try {
          const docSnap = await getDoc(doc(db, 'users', activeIndication.external_seller_uid));
          if (docSnap.exists()) {
            setIndicatorProfile(docSnap.data() as UserProfile);
          } else {
            setIndicatorProfile(null);
          }
        } catch (err) {
          console.error("Error fetching indicator inside NegotiationCentral:", err);
          setIndicatorProfile(null);
        }
      };
      fetchIndicator();
      
      const fetchRegisteredProducts = async () => {
        try {
          const colRef = collection(db, 'registered_products');
          
          // Proactive Cache First: Load local data instantly
          try {
            const cacheSnapshot = await getDocsFromCache(colRef);
            if (!cacheSnapshot.empty) {
              setRegisteredProducts(cacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegisteredProduct)));
            }
          } catch (e) {
            console.warn("No local products cache found, will fetch from server.");
          }

          // Fetch from server in background to sync
          const snapshot = await getDocs(colRef);
          if (!snapshot.empty) {
            setRegisteredProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegisteredProduct)));
          }
        } catch (error: any) {
          console.error("Error fetching registered products:", error);
          if (!error.message?.includes('quota')) {
            // Only toast if it's not a common quota error we already handle via cache
            toast.error("Erro ao sincronizar catálogo de produtos.");
          }
        }
      };
      fetchRegisteredProducts();
    }
  }, [activeIndication]);

  // Sync spreadsheet items' is_commissionable status with the global database catalog on mount or when registeredProducts loads
  useEffect(() => {
    if (isOpen && registeredProducts.length > 0 && commissionedProducts.length > 0) {
      let isChanged = false;
      const updated = commissionedProducts.map(p => {
        if (!p.code) return p;
        const matched = registeredProducts.find(rp => rp.code === p.code);
        if (matched) {
          const expectedIsCommissionable = matched.is_commissionable !== false;
          if (p.is_commissionable !== expectedIsCommissionable) {
            isChanged = true;
            return {
              ...p,
              is_commissionable: expectedIsCommissionable
            };
          }
        }
        return p;
      });
      if (isChanged) {
        setCommissionedProducts(updated);
      }
    }
  }, [isOpen, registeredProducts, activeIndication?.id]);

  // Hook ANTES do retorno antecipado abaixo: depois dele, abrir a venda mudava o número de hooks
  // entre renders e derrubava a tela (React #310).
  // Trava síncrona contra dois cliques no estorno (o estado loading só vale no próximo render)
  const estornandoRef = useRef(false);

  if (!isOpen || !activeIndication) return null;

  const handleAddProductByCode = (code: string) => {
    const product = registeredProducts.find(p => p.code === code);
    if (product) {
      const newProd = {
        code: product.code || '',
        name: product.name,
        quantity: 1,
        base_value: product.base_price || 0,
        is_commissionable: product.is_commissionable !== false,
        uniqueId: `${product.code || 'item'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      };
      setCommissionedProducts(prev => [...prev, newProd]);
      setNewLine({ code: '', name: '', quantity: 1, base_value: 0 });
      setSearchQuery('');
      toast.success('Produto adicionado!');
    } else {
      // Allow adding even if not in catalog, but warn
      const newProd = {
        code: code,
        name: searchQuery || 'Equipamento não cadastrado',
        quantity: 1,
        base_value: 0,
        is_commissionable: true,
        uniqueId: `${code || 'item'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      };
      setCommissionedProducts(prev => [...prev, newProd]);
      setNewLine({ code: '', name: '', quantity: 1, base_value: 0 });
      setSearchQuery('');
      toast.warning('Produto adicionado, mas não possui preço base cadastrado.');
    }
  };

  const handleUpdateProduct = (index: number, field: string, value: any) => {
    const updated = [...commissionedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setCommissionedProducts(updated);
  };

  const removeProduct = (index: number) => {
    setCommissionedProducts(prev => prev.filter((_, i) => i !== index));
    toast.info('Produto removido.');
  };

  const toggleProductCommissionable = async (index: number) => {
    const updated = [...commissionedProducts];
    const current = updated[index];
    if (!current) return;
    
    const nextStatus = current.is_commissionable === false; // Toggle
    updated[index] = { ...current, is_commissionable: nextStatus };
    setCommissionedProducts(updated);
    
    const toastId = `sync-${current.code}-${index}`;
    toast.loading("Sincronizando alteração no catálogo...", { id: toastId });
    
    if (current.code) {
      try {
        const q = query(collection(db, 'registered_products'), where('code', '==', current.code));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const promises = qSnap.docs.map(d => updateDoc(d.ref, { is_commissionable: nextStatus }));
          await Promise.all(promises);
          
          setRegisteredProducts(prev => prev.map(rp => rp.code === current.code ? { ...rp, is_commissionable: nextStatus } : rp));
          toast.success(`Catálogo atualizado: ${current.code} agora está marcado como ${nextStatus ? 'comissionável' : 'NÃO comissionável'}.`, { id: toastId });
        } else {
          toast.warning(`Produto ${current.code} atualizado localmente, mas não existe no catálogo institucional.`, { id: toastId });
        }
      } catch (err) {
        console.error("Erro na sincronização:", err);
        toast.error("Erro ao sincronizar alteração com o catálogo central.", { id: toastId });
      }
    } else {
      toast.info(`Status alterado localmente (item sem código cadastrado)`, { id: toastId });
    }
  };

  const isInternalIndicator = indicatorProfile 
    ? ['admin', 'manager', 'internal_seller', 'triagem', 'financial', 'marketing', 'fiscal', 'vendedor_padrao'].includes(indicatorProfile.role)
    : false;

  // Taxa mostrada na central. Antes era "commission_rate_applied || 2": transformava 0% em 2%
  // e mostrava 2% antes da venda para qualquer parceiro. Agora: vendida, a taxa gravada no
  // faturamento; antes disso, a taxa do perfil do parceiro; sem nenhuma das duas, "a definir".
  const partnerProfileRate: number | null = typeof (indicatorProfile as any)?.commission_rate === 'number'
    ? (indicatorProfile as any).commission_rate
    : null;
  const displayCommissionRate: number | null = activeIndication?.status === 'sold'
    ? ((activeIndication as any)?.commission_rate_applied ?? partnerProfileRate)
    : partnerProfileRate;

  const isOwnerIndicator = user?.uid && activeIndication?.external_seller_uid
    ? activeIndication.external_seller_uid === user.uid 
    : false;

  const isOwnerStandardSeller = user?.uid && activeIndication?.standard_seller_uid 
    ? activeIndication.standard_seller_uid === user.uid 
    : false;

  const cleanHistoryContent = (content: string) => {
    if (!content) return '';
    if (isAdmin || isManager || isTriagem) return content;
    
    let masked = content;
    // o valor inteiro, com ponto de milhar: "[^\s.]*" parava no ponto e deixava ".456,78" à mostra
    masked = masked.replace(/Comissão de [^%]*% aplicada sobre o valor de produtos comissionáveis de R\$\s?[\d.,]+/g, "Comissão aplicada [Acesso Restrito]");
    masked = masked.replace(/Comissão: R\$\s?[\d.,]+/ig, "Comissão: [Acesso Restrito]");
    masked = masked.replace(/Valor da comissão: R\$\s?[\d.,]+/ig, "Valor da comissão: [Acesso Restrito]");
    return masked;
  };

  // histórico gravado + a observação do parceiro derivada da própria indicação (não escreve no banco)
  const historicoExibido = historicoComObservacao(activeIndication as any) as NonNullable<typeof activeIndication>['negotiation_history'] & any[];

  const hasExternalSeller = !!activeIndication?.external_seller_uid && !isInternalIndicator;
  const totalCommissionable = commissionedProducts.reduce((acc, curr) => acc + ((curr.is_commissionable !== false ? curr.base_value : 0) * curr.quantity), 0);
  const grossValueNum = parseFloat(grossBudgetValue) || 0;
  const saleValueNum = parseFloat(saleValue) || 0;
  const standardSellerCommission = (standardSellerEnabled && hasExternalSeller) 
    ? ((saleValueNum || grossValueNum) * (standardSellerRate / 100)) 
    : 0;

  // Guarda o PDF/foto enviado. Antes o arquivo ia só para a leitura da IA e era descartado:
  // não ficava nenhuma prova do orçamento ou do pedido na indicação. Roda em paralelo com a
  // leitura e, se falhar, só avisa: a leitura da IA continua valendo.
  const storeNegotiationFile = async (file: File, kind: 'budget' | 'sales_order') => {
    if (!activeIndication) return;
    const indicationId = activeIndication.id;
    try {
      const safeName = (file.name || 'arquivo').replace(/[^\w.\-]+/g, '_');
      const fileRef = ref(storage, `orcamentos/${indicationId}/${Date.now()}_${safeName}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      const nowIso = new Date().toISOString();
      const label = kind === 'budget' ? 'Orçamento' : 'Pedido de venda';
      await updateDoc(doc(db, 'indications', indicationId), {
        [kind === 'budget' ? 'budget_pdf_urls' : 'sales_order_pdf_urls']: arrayUnion(url),
        updated_at: nowIso,
        negotiation_history: arrayUnion({
          id: Math.random().toString(36).substring(2, 11),
          type: 'system',
          author_name: profile?.name || 'Sistema',
          created_at: nowIso,
          content: `${label} anexado: ${file.name}`,
          attachments: [{ name: file.name, url }]
        })
      });
      // Atualiza a central com o anexo no histórico; o formulário não é zerado (só campos que mudaram no banco)
      const snap = await getDoc(doc(db, 'indications', indicationId));
      if (snap.exists() && formSourceRef.current?.id === indicationId) {
        refreshIndication({ id: snap.id, ...snap.data() } as Indication);
      }
    } catch (err: any) {
      console.error('Erro ao guardar o arquivo enviado:', err);
      toast.warning('A leitura continua, mas o arquivo não foi guardado na indicação. Anexe de novo pelo histórico se precisar.');
    }
  };

  const handleUploadBudgetDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeIndication) return;
    void storeNegotiationFile(file, 'budget');

    try {
      setReadingBudgetFile(true);
      setUploadProgress(10);
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });
      
      const base64 = await base64Promise;
      setUploadProgress(40);
      
      const result = await analyzeDetailedBudget(base64, file.type || 'application/pdf');
      setUploadProgress(80);
      
      if (result) {
        setBudgetLoaded(true);
        setBudgetUploadedAt(new Date().toISOString());
        if (result.sale_value) {
          setGrossBudgetValue(result.sale_value.toString());
        } else {
          const sumAllItems = result.items?.reduce((acc: number, item: any) => acc + ((item.unit_price || 0) * (item.quantity || 1)), 0) || 0;
          setGrossBudgetValue(sumAllItems.toString());
        }
        
        if (result.order_number) {
          setBudgetNumber(result.order_number.toString());
          toast.success(`Número do orçamento identificado: ${result.order_number}`);
        } else {
          setBudgetNumber('');
        }

        if (result.order_date) {
          const formattedDate = convertDMYtoYMD(result.order_date);
          if (formattedDate) {
            setBudgetDate(formattedDate);
            toast.success(`Data do orçamento identificada: ${result.order_date}`);
          }
        } else {
          setBudgetDate('');
        }

        // Auto register client in the 'customers' collection
        setExtractedCnpj(result.client_cnpj || '');
        setExtractedEmail(result.client_email || '');
        setExtractedPhone(result.client_phone || '');
        setExtractedAddress(result.client_address || '');
        setCompanyName(result.company_name || '');
        setClientCode(result.client_code || '');

        if (result.client_cnpj || result.client_name) {
          try {
            const clientDocId = result.client_cnpj 
              ? result.client_cnpj.replace(/\D/g, '')
              : result.client_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            
            if (clientDocId) {
              const customerRef = doc(db, 'customers', clientDocId);
              const customerSnap = await getDoc(customerRef);
              
              const cleanedClientName = result.client_name.replace(/^\d+\s*-\s*/, '').trim();

              // campo que a IA não achou NÃO entra: antes um orçamento sem telefone apagava o telefone do cadastro
              const customerData: any = Object.fromEntries(Object.entries({
                id: clientDocId,
                cnpj: result.client_cnpj || '',
                name: cleanedClientName || result.client_name,
                company_name: result.company_name || cleanedClientName || result.client_name,
                email: result.client_email || '',
                phone: result.client_phone || '',
                client_code: result.client_code || '',
                address: result.client_address || '',
              }).filter(([, v]) => v));
              customerData.updated_at = new Date().toISOString();

              if (customerSnap.exists()) {
                await updateDoc(customerRef, customerData);
              } else {
                await setDoc(customerRef, {
                  ...customerData,
                  created_at: new Date().toISOString()
                });
                toast.success(`Cliente cadastrado automaticamente: ${cleanedClientName}`);
              }
            }
          } catch (custErr) {
            console.error('Erro ao cadastrar cliente no Firestore:', custErr);
          }
        }
        
        if (result.items && result.items.length > 0) {
          const newProducts: any[] = [];
          for (const item of result.items) {
            if (!item.code) continue;
            
            // Comissão só sobre equipamento: fora kit (9000), mão de obra, frete e instalação
            const isKit = item.code.startsWith('9000') || NON_COMMISSIONABLE_RE.test(item.name || '');
            const registered = registeredProducts.find(p => p.code === item.code);
            
            if (registered) {
              try {
                const productRef = doc(db, 'registered_products', registered.id);
                await updateDoc(productRef, {
                  name: item.name,
                  base_price: item.unit_price,
                  updated_at: new Date().toISOString()
                });
                registered.name = item.name;
                registered.base_price = item.unit_price;
              } catch (catalogErr) {
                console.error(`Error updating catalog for ${item.code}:`, catalogErr);
              }
            } else {
              try {
                const newDoc = {
                  code: item.code,
                  name: item.name,
                  base_price: item.unit_price,
                  category: isKit ? 'Kits de Instalação' : 'Equipamentos',
                  is_commissionable: !isKit,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                const docRef = await addDoc(collection(db, 'registered_products'), newDoc);
                const newRegisteredProd = { id: docRef.id, ...newDoc } as any;
                setRegisteredProducts(prev => [...prev, newRegisteredProd]);
              } catch (regErr) {
                console.error(`Error auto-registering new item ${item.code}:`, regErr);
              }
            }

            newProducts.push({
              code: item.code,
              name: item.name,
              quantity: item.quantity || 1,
              base_value: item.unit_price || 0,
              is_commissionable: registered ? registered.is_commissionable !== false : !isKit
            });
          }
          
          if (newProducts.length > 0) {
            setCommissionedProducts(prev => {
              const prevMap = new Map(prev.map(p => [p.code, {
                ...p,
                uniqueId: p.uniqueId || `${p.code || 'item'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
              }]));
              newProducts.forEach((newP, idx) => {
                const itemWithId = {
                  ...newP,
                  uniqueId: newP.uniqueId || `${newP.code || 'item'}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
                };
                prevMap.set(itemWithId.code, itemWithId);
               });
              return Array.from(prevMap.values());
            });
            toast.success(`${newProducts.length} itens do orçamento identificados e sincronizados!`);
          }
        }
        
        setUploadProgress(100);
        setTimeout(() => {
          setReadingBudgetFile(false);
          setUploadProgress(0);
          toast.success('Orçamento processado com sucesso');
        }, 500);
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Erro na leitura do orçamento: ' + error.message);
      setReadingBudgetFile(false);
      setUploadProgress(0);
    }
  };

  const handleUploadSalesOrder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeIndication) return;
    void storeNegotiationFile(file, 'sales_order');

    try {
      setReadingBudget(true);
      setUploadProgress(10);
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });
      
      const base64 = await base64Promise;
      setUploadProgress(40);
      
      const result = await analyzeDetailedBudget(base64, file.type || 'application/pdf');
      setUploadProgress(80);
      
      if (result) {
        if (result.sale_value) {
          setSaleValue(result.sale_value.toString());
        } else {
          const sumAllItems = result.items?.reduce((acc: number, item: any) => acc + ((item.unit_price || 0) * (item.quantity || 1)), 0) || 0;
          setSaleValue(sumAllItems.toString());
        }
        
        if (result.order_number) {
          setOrderNumber(result.order_number.toString());
          toast.success(`Número do pedido identificado: ${result.order_number}`);
        } else {
          setOrderNumber('');
        }

        if (result.order_date) {
          const formattedDate = convertDMYtoYMD(result.order_date);
          if (formattedDate) {
            setOrderDate(formattedDate);
            toast.success(`Data do pedido identificada: ${result.order_date}`);
          }
        } else {
          setOrderDate('');
        }

        if (result.delivery_date) {
          const formattedDate = convertDMYtoYMD(result.delivery_date);
          if (formattedDate) {
            setDeliveryDate(formattedDate);
            toast.success(`Data de entrega sugerida do pedido: ${result.delivery_date}`);
          }
        } else {
          setDeliveryDate('');
        }

        // Store extracted customer info in state
        setExtractedCnpj(result.client_cnpj || '');
        setExtractedEmail(result.client_email || '');
        setExtractedPhone(result.client_phone || '');
        setExtractedAddress(result.client_address || '');
        setCompanyName(result.company_name || '');
        setClientCode(result.client_code || '');

        // Auto register client in the 'customers' collection
        if (result.client_cnpj || result.client_name) {
          try {
            const clientDocId = result.client_cnpj 
              ? result.client_cnpj.replace(/\D/g, '')
              : result.client_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            
            if (clientDocId) {
              const customerRef = doc(db, 'customers', clientDocId);
              const customerSnap = await getDoc(customerRef);
              
              const cleanedClientName = result.client_name.replace(/^\d+\s*-\s*/, '').trim();

              const customerData = {
                id: clientDocId,
                cnpj: result.client_cnpj || '',
                name: cleanedClientName || result.client_name,
                company_name: result.company_name || cleanedClientName || result.client_name,
                email: result.client_email || '',
                phone: result.client_phone || '',
                client_code: result.client_code || '',
                address: result.client_address || '',
                updated_at: new Date().toISOString()
              };

              if (customerSnap.exists()) {
                await updateDoc(customerRef, customerData);
              } else {
                await setDoc(customerRef, {
                  ...customerData,
                  created_at: new Date().toISOString()
                });
                toast.success(`Cliente cadastrado automaticamente: ${cleanedClientName}`);
              }
            }
          } catch (custErr) {
            console.error('Erro ao cadastrar cliente no Firestore:', custErr);
          }
        }
        
        if (result.items && result.items.length > 0) {
          const newProducts: any[] = [];
          for (const item of result.items) {
            if (!item.code) continue;
            
            // Comissão só sobre equipamento: fora kit (9000), mão de obra, frete e instalação
            const isKit = item.code.startsWith('9000') || NON_COMMISSIONABLE_RE.test(item.name || '');
            const registered = registeredProducts.find(p => p.code === item.code);
            
            if (registered) {
              // Rule: If exists, update price and name in our registered catalog
              try {
                const productRef = doc(db, 'registered_products', registered.id);
                await updateDoc(productRef, {
                  name: item.name,
                  base_price: item.unit_price,
                  updated_at: new Date().toISOString()
                });
                registered.name = item.name;
                registered.base_price = item.unit_price;
              } catch (catalogErr) {
                console.error(`Error updating catalog for ${item.code}:`, catalogErr);
              }
            } else {
              // Rule: Register as a NEW product if code not found in our catalog
              try {
                const newDoc = {
                   code: item.code,
                  name: item.name,
                  base_price: item.unit_price,
                  category: isKit ? 'Kits de Instalação' : 'Equipamentos',
                  is_commissionable: !isKit,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                const docRef = await addDoc(collection(db, 'registered_products'), newDoc);
                const newRegisteredProd = { id: docRef.id, ...newDoc } as any;
                setRegisteredProducts(prev => [...prev, newRegisteredProd]);
              } catch (regErr) {
                console.error(`Error auto-registering new item ${item.code}:`, regErr);
              }
            }

            // Always add/use the sales order data for Negotiation Central
            newProducts.push({
              code: item.code,
              name: item.name,
              quantity: item.quantity || 1,
              base_value: item.unit_price || 0,
              is_commissionable: registered ? registered.is_commissionable !== false : !isKit
            });
          }
          
          if (newProducts.length > 0) {
            const finalProducts = newProducts.map((newP, idx) => ({
              ...newP,
              uniqueId: `${newP.code || 'item'}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
            }));
            setCommissionedProducts(finalProducts);
            toast.success(`${newProducts.length} itens do pedido de venda identificados e sincronizados (substituindo orçamento)`);
          }
        }
        
        setUploadProgress(100);
        setTimeout(() => {
          setReadingBudget(false);
          setUploadProgress(0);
          toast.success('Pedido de Venda processado com sucesso');
        }, 500);
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Erro na leitura do pedido: ' + error.message);
      setReadingBudget(false);
      setUploadProgress(0);
    }
  };

  // closeAfter=false é usado pelo Faturar: salva o que está na tela e devolve a indicação
  // atualizada do banco, sem fechar a central.
  // silent: salvar por dentro do Faturar, sem avisar parceiro e gestão e sem linha no histórico
  // (antes cada clique em Faturar mandava "Orçamento atualizado" de novo para todo mundo)
  const handleSaveNegotiation = async (opts: { closeAfter?: boolean; silent?: boolean } = {}): Promise<Indication | null> => {
    const closeAfter = opts.closeAfter !== false;
    const silent = !!opts.silent;
    if (!activeIndication) return null;
    let saved: Indication | null = null;
    setLoading(true);
    try {
      const indicationRef = doc(db, 'indications', activeIndication.id);
      
      const updateData: any = {
        commissioned_products: commissionedProducts,
        gross_budget_value: grossValueNum,
        budget_loaded: budgetLoaded,
        budget_number: budgetNumber,
        budget_date: budgetDate,
        sale_value: parseFloat(saleValue) || 0,
        updated_at: new Date().toISOString(),
        base_commission_value: totalCommissionable,
        standard_seller_commission_enabled: standardSellerEnabled,
        standard_seller_commission_rate: standardSellerRate,
        standard_seller_commission_value: standardSellerCommission,
        delivery_date: deliveryDate,
        sale_order_number: orderNumber,
        sale_order_date: orderDate,
        client_cnpj: extractedCnpj || '',
        client_email: extractedEmail || '',
        client_phone: extractedPhone || '',
        client_address: extractedAddress || '',
        client_company_name: companyName || '',
        client_code: clientCode || ''
      };

      // Proteção de 60 dias conta da data em que o orçamento foi CARREGADO aqui, e não da data
      // impressa no papel: antes um orçamento antigo subido hoje já nascia vencido ou quase, e
      // cada "salvar" recalculava o prazo. Também não encurta uma proteção que já vai mais longe
      // (renovação manual): fica sempre o prazo mais tarde.
      if (budgetLoaded) {
        const SESSENTA_DIAS = 60 * 24 * 60 * 60 * 1000;
        const existingExpiry = activeIndication.protection_expires_at ? new Date(activeIndication.protection_expires_at).getTime() : 0;
        if (budgetUploadedAt) {
          const candidateExpiry = new Date(budgetUploadedAt).getTime() + SESSENTA_DIAS;
          if (!(existingExpiry > candidateExpiry)) {
            updateData.budget_sent_at = budgetUploadedAt;
            updateData.protection_expires_at = new Date(candidateExpiry).toISOString();
          }
        } else if (!activeIndication.budget_sent_at) {
          // Orçamento marcado à mão, sem arquivo: começa a contar de agora
          const nowMs = Date.now();
          updateData.budget_sent_at = new Date(nowMs).toISOString();
          if (!(existingExpiry > nowMs + SESSENTA_DIAS)) {
            updateData.protection_expires_at = new Date(nowMs + SESSENTA_DIAS).toISOString();
          }
        }
      }

      const wasBudgetJustSent = budgetLoaded && !activeIndication.budget_loaded;

      await updateDoc(indicationRef, updateData);

      // Notify partner via email that budget has been sent (first contact / quote sent)
      if (wasBudgetJustSent && activeIndication.external_seller_uid) {
        try {
          const userSnap = await getDoc(doc(db, 'users', activeIndication.external_seller_uid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.email) {
              const { notifyPartnerBudgetSent } = await import('../../services/emailService');
              const sellerName = profile?.name || activeIndication.internal_seller_name || 'Vendedor Roder';
              const sellerPhone = profile?.phone || '';
              await notifyPartnerBudgetSent(
                { ...activeIndication, company_name: companyName || activeIndication.client_company_name || '' },
                userData.email,
                userData.name || 'Parceiro',
                sellerName,
                sellerPhone
              );
            }
          }
        } catch (emailErr) {
          console.error("Error sending budget sent email to partner:", emailErr);
        }
      }

      // Sync updated base values to registered_products catalog
      if (canInteract) {
        for (const prod of commissionedProducts) {
          if (prod.base_value > 0 && prod.code) {
            // Find if catalog value is different or zero
            const catalogProd = registeredProducts.find(rp => rp.code === prod.code);
            if (catalogProd && (catalogProd.base_price !== prod.base_value || catalogProd.name !== prod.name)) {
              try {
                const productRef = doc(db, 'registered_products', catalogProd.id);
                await updateDoc(productRef, {
                  base_price: prod.base_value,
                  name: prod.name,
                  updated_at: new Date().toISOString()
                });
                console.log(`Updated catalog for ${prod.code}: ${prod.name} (R$ ${prod.base_value})`);
              } catch (err) {
                console.error(`Error updating catalog for ${prod.code}:`, err);
              }
            }
          }
        }
      }

      // Schedule customer quality evaluation for 15 days after delivery date
      if (deliveryDate) {
        try {
          const delDateObj = new Date(deliveryDate + 'T12:00:00');
          const schedDateObj = new Date(delDateObj);
          schedDateObj.setDate(delDateObj.getDate() + 15);
          
          const firstProductName = commissionedProducts[0]?.name || 'Equipamento Roder';
          
          const evalPayload = {
            indication_id: activeIndication.id,
            client_name: activeIndication.client_name || 'Sem Nome',
            client_phone: activeIndication.client_phone || '',
            client_email: activeIndication.client_email || '',
            equipment_name: firstProductName,
            sale_value: grossValueNum || 0,
            sale_date: deliveryDate,
            days_offset: 15,
            scheduled_date: schedDateObj.toISOString().substring(0, 10),
            status: 'pending',
            rating_product: 0,
            rating_service: 0,
            rating_delivery: 0,
            rating_technical: 0,
            comments: '',
            created_at: new Date().toISOString()
          };
          
          // pesquisa já respondida não volta a "pendente" com notas zeradas
          const evalRef = doc(db, 'customer_evaluations', activeIndication.id);
          const evalAtual = await getDoc(evalRef).catch(() => null);
          if (!evalAtual?.exists() || evalAtual.data()?.status === 'pending') {
            await setDoc(evalRef, evalPayload, { merge: true });
          }
          console.log(`Saved customer quality survey: scheduled for ${evalPayload.scheduled_date}`);
        } catch (evalErr) {
          console.error("Error creating customer evaluation sync:", evalErr);
        }
      }
      
      // Notify Indicator (External Seller) and Managers
      if (!silent && activeIndication.external_seller_uid) {
        await notifyExternalSeller(
          activeIndication.external_seller_uid,
          'Orçamento em Andamento',
          `Um orçamento foi cadastrado ou atualizado para o cliente ${activeIndication.client_name}.`,
          `/indicacoes`
        );
      }
      
      if (!silent) await notifyManagers(
        'Orçamento Atualizado',
        `${profile?.name} atualizou o orçamento de ${activeIndication.client_name}. Total: ${maskCurrency(parseFloat(grossBudgetValue) || 0)}`,
        `/indicacoes`
      );

      // Notify Standard Seller (Regional) if exists
      if (!silent && activeIndication.standard_seller_uid && profile?.uid !== activeIndication.standard_seller_uid) {
        await createNotification({
          user_uid: activeIndication.standard_seller_uid,
          title: 'Acompanhamento Regional',
          message: `${profile?.name} atualizou a negociação de ${activeIndication.client_name} na sua região.`,
          type: 'info',
          link: `/indicacoes`
        });
      }

      // Auto-add history if changes occurred (simplified logic)
      if (!silent) await updateDoc(indicationRef, {
        negotiation_history: arrayUnion({
          id: Math.random().toString(36).substring(2, 11),
          type: 'system',
          author_name: profile?.name || 'Sistema',
          created_at: new Date().toISOString(),
          content: 'Dados da negociação atualizados via Central Flutuante.',
          attachments: []
        })
      });

      toast.success('Progresso salvo com sucesso!');
      
      // Refresh local state in context
      const updatedSnap = await getDoc(indicationRef);
      if (updatedSnap.exists()) {
        saved = { id: updatedSnap.id, ...updatedSnap.data() } as Indication;
        refreshIndication(saved);
      }
      // O upload já foi gravado: o próximo salvar não deve empurrar o prazo de novo
      setBudgetUploadedAt(null);

      // The user said: "closes automatically" after clicking save button
      if (closeAfter) closeNegotiation();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
      saved = null;
    } finally {
      setLoading(false);
    }
    return saved;
  };

  const handleUndoInvoiceDirect = async () => {
    if (!activeIndication || estornandoRef.current) return;
    if (!window.confirm(`Deseja realmente estornar o faturamento da venda de "${activeIndication.client_name}"? Isso moverá o status de volta para Negociação, reverterá a baixa de estoque automática e excluirá a comissão vinculada de forma definitiva.`)) return;
    
    estornandoRef.current = true;
    setLoading(true);
    try {
      // 1. Primeiro só a marca do estorno e o updated_at, com a venda ainda faturada. A correção
      // automática de comissão nunca recria comissão de indicação com estornado_em, então apagar a
      // comissão depois é seguro. O status só muda no FIM: se a devolução do estoque falhar no meio,
      // a venda continua faturada e o botão de estorno continua disponível para tentar de novo
      // (cada baixa devolvida é apagada junto, então a nova tentativa só faz o que faltou).
      const leadRef = doc(db, 'indications', activeIndication.id);
      await updateDoc(leadRef, { estornado_em: new Date().toISOString(), updated_at: new Date().toISOString() });

      // 2. Delete associated commissions
      const commissionsRef = collection(db, 'commissions');
      const commQuery = query(commissionsRef, where('indication_id', '==', activeIndication.id));
      const commSnap = await getDocs(commQuery);
      for (const docSnap of commSnap.docs) {
        await deleteDoc(doc(db, 'commissions', docSnap.id));
      }

      // 3. Revert associated stock sales
      const stockSalesRef = collection(db, 'stock_sales');
      // Só pelo id da indicação. A busca de reserva pelo nome do cliente foi tirada: ela pegava
      // baixas de OUTRAS vendas do mesmo cliente e devolvia ao estoque peças que já tinham saído.
      const salesQuery = query(stockSalesRef, where('indication_id', '==', activeIndication.id));
      const salesSnap = await getDocs(salesQuery);

      for (const docSnap of salesSnap.docs) {
        // Lê a baixa, devolve ao estoque e apaga a baixa na MESMA transação: um segundo clique ou uma
        // nova tentativa não devolve duas vezes (a baixa já apagada é pulada).
        await runTransaction(db, async (tx) => {
          const baixaRef = doc(db, 'stock_sales', docSnap.id);
          const baixa = await tx.get(baixaRef);
          if (!baixa.exists()) return;
          const dados: any = baixa.data();
          const qtd = Number(dados.quantity_sold) || 0;
          const itemRef = dados.stock_item_id && qtd > 0 ? doc(db, 'stock_items', dados.stock_item_id) : null;
          const item = itemRef ? await tx.get(itemRef) : null;
          // increment no servidor: somar ao número lido antes perdia baixas feitas no meio tempo
          if (itemRef && item && item.exists()) tx.update(itemRef, { quantity: increment(qtd), updated_at: new Date().toISOString() });
          tx.delete(baixaRef);
        });
      }

      // 4. Só agora a venda sai de faturada
      await updateDoc(leadRef, {
        status: 'negotiating',
        sale_value: 0,
        commission_value: 0,
        commissionable_value: 0,
        standard_seller_commission_value: 0,
        invoice_url: "",
        updated_at: new Date().toISOString(),
        negotiation_history: arrayUnion({
          id: Math.random().toString(36).substring(2, 11),
          type: 'status_change',
          author_name: profile?.name || 'Sistema',
          created_at: new Date().toISOString(),
          content: `ESTORNO DE FATURAMENTO: O faturamento foi desfeito por ${profile?.name || 'Sistema'}. O status retornou para Negociação e as comissões e baixas de estoque foram devidamente revertidas.`
        })
      });

      toast.success('Faturamento estornado e retornado para negociação com sucesso!');
      
      // Refresh local state in context
      const updatedSnap = await getDoc(leadRef);
      if (updatedSnap.exists()) {
        refreshIndication({ id: updatedSnap.id, ...updatedSnap.data() } as Indication);
      }
      closeNegotiation(); // Close central modal
    } catch (err: any) {
      console.error("Error reversing invoice in central:", err);
      toast.error('Erro ao estornar faturamento: ' + err.message);
    } finally {
      estornandoRef.current = false;
      setLoading(false);
    }
  };

  const handleOpenFinalizeDialog = async () => {
    if (!activeIndication) return;
    const isSalesOrderLoaded = !!orderNumber && orderNumber.trim() !== '';
    if (!isSalesOrderLoaded) {
      toast.error('O faturamento só pode ser finalizado após o carregamento do Pedido de Venda.');
      return;
    }
    // O botão habilita com o número do pedido que está só na tela, mas o diálogo de faturamento
    // lê a indicação do banco. Antes, faturar logo depois de ler o pedido (sem salvar) gravava a
    // venda com valor, produtos e pedido antigos. Agora salva primeiro e abre com o dado fresco.
    const fresh = await handleSaveNegotiation({ closeAfter: false, silent: true });
    if (!fresh) {
      toast.error('Salve o pedido antes de faturar.');
      return;
    }
    if (!fresh.sale_order_number || !String(fresh.sale_order_number).trim()) {
      toast.error('Salve o pedido antes de faturar.');
      return;
    }
    setInvoiceIndication(fresh);
    setIsInvoiceDialogOpen(true);
    closeNegotiation();
  };

  const handleAddHistory = async () => {
    if (!historyNote.trim() && historyImages.length === 0) return;
    if (!activeIndication) return;
    
    setLoading(true);
    try {
      const attachments: { name: string; url: string }[] = [];
      
      // Upload images if any with compression and 4s timeout race so it NEVER hangs
      for (const image of historyImages) {
        try {
          // Step 1: Compress image if it's large
          let fileToUpload: File | Blob = image;
          try {
            fileToUpload = await compressImage(image, 0.5, 1200);
          } catch (cErr) {
            console.warn("[HISTORY] Image compression warning:", cErr);
          }

          // Step 2: Try Firebase Storage with a strict 4-second timeout race
          const fileRef = ref(storage, `indications/${activeIndication.id}/history/${Date.now()}_${image.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
          
          const uploadTask = uploadBytes(fileRef, fileToUpload).then(async (snap) => {
            return await getDownloadURL(snap.ref);
          });

          const timeoutTask = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error("Storage upload timeout")), 4000);
          });

          const url = await Promise.race([uploadTask, timeoutTask]);
          attachments.push({ name: image.name, url });
        } catch (storageErr) {
          console.warn("[HISTORY] Storage upload skipped/failed, using compressed base64 fallback:", storageErr);
          try {
            const base64Url = await compressFileToDataURL(image, 900, 0.7);
            attachments.push({ name: image.name, url: base64Url });
          } catch (b64Err) {
            console.error("[HISTORY] Base64 fallback error:", b64Err);
          }
        }
      }

      const categoryTags: Record<string, string> = {
        nota: '[NOTA]',
        ligacao: '[LIGAÇÃO]',
        whatsapp: '[WHATSAPP]',
        email: '[E-MAIL]',
        proposta: '[PROPOSTA]',
        reuniao: '[REUNIÃO]',
        visita: '[VISITA]'
      };
      const catTag = categoryTags[selectedActivityType] || '[NOTA]';
      const formattedNote = historyNote.trim().startsWith('[') ? historyNote.trim() : `${catTag} ${historyNote.trim()}`;

      const indicationRef = doc(db, 'indications', activeIndication.id);
      const newHistoryEntry = {
        id: Math.random().toString(36).substring(2, 11),
        type: 'note' as const,
        author_name: profile?.name || 'Sistema',
        created_at: new Date().toISOString(),
        content: formattedNote,
        attachments
      };

      await updateDoc(indicationRef, {
        negotiation_history: arrayUnion(newHistoryEntry),
        updated_at: new Date().toISOString()
      });

      // Update local state immediately so UI updates without waiting
      const updatedHistory = [...(activeIndication.negotiation_history || []), newHistoryEntry];
      const updatedIndication = {
        ...activeIndication,
        negotiation_history: updatedHistory
      };
      refreshIndication(updatedIndication);

      // Clear input state and show toast notification right away
      setHistoryNote('');
      setHistoryImages([]);
      toast.success('Acompanhamento adicionado com sucesso!');

      // Asynchronously trigger notifications without blocking UI
      try {
        if (activeIndication.external_seller_uid && profile?.uid !== activeIndication.external_seller_uid) {
          createNotification({
            user_uid: activeIndication.external_seller_uid,
            title: 'Novo Acompanhamento',
            message: `${profile?.name} adicionou uma observação na negociação de ${activeIndication.client_name}.`,
            type: 'info',
            link: `/indicacoes`
          }).catch(console.error);
        }
        if (activeIndication.internal_seller_uid && profile?.uid !== activeIndication.internal_seller_uid) {
          createNotification({
            user_uid: activeIndication.internal_seller_uid,
            title: 'Novo Acompanhamento',
            message: `${profile?.name} adicionou uma observação na negociação de ${activeIndication.client_name}.`,
            type: 'info',
            link: `/indicacoes`
          }).catch(console.error);
        }
        notifyManagers(
          'Novo Acompanhamento',
          `${profile?.name} registrou um novo histórico para ${activeIndication.client_name}.`,
          `/indicacoes`
        ).catch(console.error);
      } catch (notifErr) {
        console.warn("Error sending notifications:", notifErr);
      }

    } catch (error: any) {
      console.error("Erro ao adicionar histórico:", error);
      toast.error('Erro ao adicionar histórico: ' + (error.message || 'Falha inesperada'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99]" 
            onClick={closeNegotiation}
          />

          <motion.div
            drag={!isMobile}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={isMobile ? { 
              opacity: 0, 
              scale: 0.95,
              y: 20
            } : { 
              opacity: 0, 
              scale: 0.9, 
              x: "-50%", 
              y: "-50%",
              left: "50%",
              top: "50%"
            }}
            animate={isMobile ? {
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { duration: 0.3 }
            } : { 
              opacity: 1, 
              scale: 1,
              transition: { type: "spring", duration: 0.5 }
            }}
            onWheel={(e) => e.stopPropagation()}
            className={cn(
              "fixed z-[100] bg-card overflow-hidden flex flex-col",
              isMobile 
                ? "inset-0 w-full h-full rounded-none border-none pt-[max(16px,env(safe-area-inset-top))]" 
                : "border-2 border-primary/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] rounded-3xl min-w-[700px] min-h-[500px] max-w-[95vw] max-h-[95vh]"
            )}
            style={isMobile ? {
              touchAction: 'pan-y'
            } : {
              width: '96vw',
              maxWidth: '1680px',
              height: '92vh',
              touchAction: 'none'
            }}
          >
            {/* Header */}
            <div 
              onPointerDown={(e) => !isMobile && dragControls.start(e)}
              className={cn(
                "bg-white flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 shrink-0",
                isMobile ? "min-h-[56px] py-2" : "h-16 cursor-move active:cursor-grabbing group/handle"
              )}
            >
              <div className="flex items-center gap-2 lg:gap-4 min-w-0">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full flex items-center justify-center p-1 border border-slate-100 shadow-sm overflow-hidden shrink-0">
                  <img 
                    src="https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png" 
                    alt="Roder Logo" 
                    referrerPolicy="no-referrer" 
                    className="max-w-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) parent.innerHTML = '<span class="text-[8px] font-bold text-primary tracking-tighter">RODER</span>';
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold italic text-sm lg:text-lg leading-tight uppercase flex items-center gap-1.5 text-slate-800 truncate">
                    Negociação
                  </h3>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                {!isMobile && <GripHorizontal className="h-5 w-5 text-muted-foreground/30 mr-4" />}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:bg-red-500/10 hover:text-red-500"
                  onClick={closeNegotiation}
                >
                  <X className="h-4.5 w-4.5 lg:h-5 lg:w-5" />
                </Button>
              </div>
            </div>

            {/* User Info Bar */}
            {(() => {
              const clientDisplayName = activeIndication?.client_person_name || activeIndication?.client_name || (activeIndication as any)?.company_name || 'Cliente Indicação';
              const indicatorDisplayName = activeIndication?.external_seller_name || indicatorProfile?.name || 'Gislene Roder';
              const consultantDisplayName = activeIndication?.internal_seller_name || 'Não atribuído';
              const equipmentRequestedText = activeIndication?.base_machine 
                || (activeIndication?.items && activeIndication.items.length > 0 
                    ? activeIndication.items.map((i: any) => `${i.quantity || 1}x ${i.product_name || i.name}`).join(', ')
                    : (commissionedProducts && commissionedProducts.length > 0 
                        ? commissionedProducts.map((p: any) => `${p.quantity || 1}x ${p.name}`).join(', ')
                        : 'Equipamento Roder'));

              const tempLabel = activeIndication.ai_score === 'hot' ? 'Quente' : activeIndication.ai_score === 'cold' ? 'Frio' : activeIndication.ai_score ? 'Morno' : null;
              const tempClass = activeIndication.ai_score === 'hot' ? 'bg-red-500' : activeIndication.ai_score === 'cold' ? 'bg-blue-500' : 'bg-amber-500';
              return (
                <div className="bg-slate-50 dark:bg-slate-900/50 px-4 lg:px-6 py-2 border-b border-border shrink-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm lg:text-base font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 truncate min-w-0" title={clientDisplayName}>
                      {clientDisplayName}
                    </p>
                    {tempLabel && (
                      <span className={cn("text-[9px] font-bold uppercase text-white rounded px-1.5 py-0.5 shrink-0", tempClass)}>{tempLabel}</span>
                    )}
                    {activeIndication.is_export && (
                      <span className="text-[9px] font-bold uppercase text-white bg-sky-600 rounded px-1.5 py-0.5 shrink-0">Exportação</span>
                    )}
                    {activeIndication.client_phone && (
                      <a
                        href={`https://wa.me/55${activeIndication.client_phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto lg:ml-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1 shrink-0"
                      >
                        <Phone className="h-3 w-3" />
                        <span className="hidden sm:inline">{activeIndication.client_phone}</span>
                        <span className="sm:hidden">WhatsApp</span>
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground min-w-0">
                    <span className="truncate max-w-full">Indicador: <b className="font-semibold text-amber-600 dark:text-amber-400">{indicatorDisplayName}</b></span>
                    <span className="truncate max-w-full">Consultor: <b className="font-semibold text-slate-700 dark:text-slate-200">{consultantDisplayName}</b></span>
                    <span className="truncate max-w-full" title={equipmentRequestedText}>Equipamento: <b className="font-semibold text-slate-700 dark:text-slate-200">{equipmentRequestedText}</b></span>
                    <span className="flex items-center gap-0.5 truncate max-w-full" title={activeIndication.client_location}><MapPin className="h-3 w-3 shrink-0" />{activeIndication.client_location || 'Local não indicado'}</span>
                  </div>
                </div>
              );
            })()}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto lg:overflow-hidden bg-slate-50/10 p-3 lg:p-6 flex flex-col gap-4 touch-pan-y overscroll-contain">
            
            {isSold && (
              <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30 rounded-lg px-3 py-2 flex items-center gap-2 shrink-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 leading-tight">
                  Pedido faturado{orderDate ? ` em ${orderDate.split('-').reverse().join('/')}` : ''}. Comissões liberadas na aba Comissões.
                </p>
              </div>
            )}


            {/* DESKTOP SPLIT SCREEN / MOBILE SINGLE TAB CONTAINER */}
            <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
              <div className="lg:h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-0">
                
                {/* RIGHT PANEL: COMERCIAL & PRODUTOS (5 SPANS, RIGHT SIDE) */}
                <div className={cn(
                  "lg:col-span-5 order-1 lg:order-2 flex flex-col gap-3 lg:overflow-y-auto lg:border-l border-slate-200/80 dark:border-slate-800 lg:pl-5 lg:h-full min-h-0"
                )}>
                  {/* Aviso único para gestão: falta base de comissão */}
                  {(isAdmin || isManager) && !isSold && (
                    (activeIndication?.status === 'negotiating' && (!activeIndication.base_commission_value || activeIndication.base_commission_value <= 0)) ||
                    commissionedProducts.some(p => p.base_value <= 0)
                  ) && (
                    <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-900/50 rounded-lg flex items-start gap-2 shrink-0">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 leading-snug">
                        Falta valor base de comissão. Carregue o orçamento ou o pedido de venda, ou preencha o valor dos itens.
                      </p>
                    </div>
                  )}

                  {/* Valores do Orçamento / Pedido de Venda */}
                  {/* Resumo somente leitura (faturado ou observador): ocupa pouco espaço */}
                  {!isEditable ? (() => {
                    const fixSaleValue = async () => {
                      const num = Number(fixingValue) || 0;
                      if (!num || num <= 0) { toast.error('Valor inválido.'); return; }
                      if (!window.confirm(`Corrigir o valor do pedido para ${maskCurrency(num)}?`)) return;
                      try {
                        const ind: any = activeIndication;
                        const upd: any = { sale_value: num, updated_at: new Date().toISOString() };
                        upd.negotiation_history = arrayUnion({
                          id: Math.random().toString(36).substring(2, 11),
                          type: 'status_change',
                          author_name: profile?.name || 'Sistema',
                          created_at: new Date().toISOString(),
                          content: `Valor do pedido corrigido de ${maskCurrency(Number(ind.sale_value) || 0)} para ${maskCurrency(num)}.`
                        });
                        await updateDoc(doc(db, 'indications', ind.id), upd);
                        setSaleValue(String(num));
                        setFixingValue(null);
                        toast.success('Valor do pedido corrigido.');
                      } catch (e: any) {
                        toast.error('Erro ao corrigir: ' + (e?.message || e));
                      }
                    };
                    const fmtD = (d: string) => d ? d.split('-').reverse().join('/') : '';
                    const money = (v: string) => v && Number(v) > 0 ? maskCurrency(Number(v)) : '';
                    const saleLooksWrong = isSold && Number(saleValue) > 0 && Number(grossBudgetValue) > 0 && Number(saleValue) * 20 < Number(grossBudgetValue);
                    return (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 grid gap-2 text-[12px]">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold uppercase text-muted-foreground">Orçamento enviado ao cliente</p>
                            {grossBudgetValue || budgetNumber || budgetDate ? (
                              <p className="font-semibold text-slate-800 dark:text-slate-100">
                                {[budgetNumber && `Nº ${budgetNumber}`, fmtD(budgetDate), money(grossBudgetValue)].filter(Boolean).join(' · ')}
                              </p>
                            ) : <p className="text-muted-foreground">Ainda não enviado</p>}
                          </div>
                        </div>
                        <div className="flex items-start gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                          <BadgeDollarSign className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold uppercase text-muted-foreground">Pedido de venda</p>
                            {saleValue && Number(saleValue) > 0 || orderNumber ? (
                              <p className="font-semibold text-slate-800 dark:text-slate-100">
                                {[orderNumber && `Nº ${orderNumber}`, fmtD(orderDate), money(saleValue)].filter(Boolean).join(' · ')}
                                {deliveryDate && <span className="block text-[11px] font-normal text-muted-foreground">Entrega prevista: {fmtD(deliveryDate)}</span>}
                              </p>
                            ) : <p className="text-muted-foreground">Ainda não fechado</p>}
                            {saleLooksWrong && (isAdmin || isManager) && (
                              <p className="mt-1 text-[11px] font-semibold text-red-600">Valor do pedido parece errado (muito menor que o orçamento).</p>
                            )}
                            {isSold && isAdmin && (fixingValue === null ? (
                              <button type="button" onClick={() => setFixingValue('')} className="mt-1 text-[11px] font-bold text-orange-600 underline">Corrigir valor</button>
                            ) : (
                              <div className="mt-1 flex items-center gap-1.5">
                                <Input
                                  autoFocus
                                  inputMode="numeric"
                                  value={fixingValue ? maskCurrency(Number(fixingValue)) : ''}
                                  onChange={(e) => setFixingValue(String(unmaskCurrency(e.target.value)))}
                                  placeholder="R$ 0,00"
                                  className="h-8 text-[16px] lg:text-[13px] font-bold flex-1"
                                />
                                <Button type="button" size="sm" className="h-8 px-3 text-[11px] font-bold" onClick={fixSaleValue}>Salvar</Button>
                                <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-[11px]" onClick={() => setFixingValue(null)}>Cancelar</Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                  <div className="relative space-y-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {(readingBudget || readingBudgetFile) && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-xl">
                        <div className="w-48 h-2 bg-muted rounded-full overflow-hidden mb-3">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-medium uppercase text-primary animate-pulse flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" /> Processando {readingBudgetFile ? 'Orçamento' : 'Pedido de Venda'}... {uploadProgress}%
                        </p>
                      </div>
                    )}

                    {/* Section 1: Orçamento */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h4 className="text-[10px] font-extrabold italic uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-orange-500" /> 1. Orçamento enviado ao cliente
                        </h4>
                        {isEditable && (
                          <label className="cursor-pointer">
                            <Input 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleUploadBudgetDocument}
                            />
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-all shadow-sm active:scale-95 text-[9px] font-black uppercase italic">
                              <Upload className="h-3 w-3" />
                              <span>Carregar</span>
                            </div>
                          </label>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[8px] font-bold uppercase text-muted-foreground">Valor Orçamento (R$)</Label>
                          <Input 
                            disabled={!isEditable}
                            inputMode="numeric"
                            value={grossBudgetValue ? maskCurrency(Number(grossBudgetValue)) : ''}
                            onChange={(e) => setGrossBudgetValue(unmaskCurrency(e.target.value).toString())}
                            placeholder="0,00"
                            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-[11px] h-7 px-1.5"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[8px] font-bold uppercase text-muted-foreground">Nº Orçamento</Label>
                          <Input 
                            disabled={!isEditable}
                            value={budgetNumber}
                            onChange={(e) => setBudgetNumber(e.target.value)}
                            placeholder="Ex: 0338_26"
                            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium text-[11px] h-7 px-1.5"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[8px] font-bold uppercase text-muted-foreground">Data Orçamento</Label>
                          <Input 
                            type="date"
                            disabled={!isEditable}
                            value={budgetDate}
                            onChange={(e) => setBudgetDate(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium text-[11px] h-7 px-1.5"
                          />
                        </div>
                      </div>

                      {budgetLoaded && (
                        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-md flex items-center justify-between text-[9px] text-green-700 font-semibold uppercase leading-none">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> Orçamento enviado ao cliente{budgetDate ? ` em ${budgetDate.split('-').reverse().join('/')}` : ''}
                          </span>
                          <span className="text-[8px] italic">
                            Validade: 60 dias de proteção
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Pedido de Venda */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-150 dark:border-slate-850">
                      <div className="flex items-center justify-between pb-1">
                        <h4 className="text-[10px] font-extrabold italic uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <BadgeDollarSign className="h-3.5 w-3.5 text-primary" /> 2. Pedido de venda (base da comissão)
                        </h4>
                        {isEditable && (
                          <label className="cursor-pointer">
                            <Input 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleUploadSalesOrder}
                            />
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary hover:bg-primary/95 text-white rounded-md transition-all shadow-sm active:scale-95 text-[9px] font-black uppercase italic">
                              <Upload className="h-3 w-3" />
                              <span>Carregar</span>
                            </div>
                          </label>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1 col-span-2">
                          <Label className="text-[8px] font-bold uppercase text-muted-foreground">Valor do pedido (R$)</Label>
                          <Input 
                            disabled={!isEditable}
                            inputMode="numeric"
                            value={saleValue ? maskCurrency(Number(saleValue)) : ''}
                            onChange={(e) => setSaleValue(unmaskCurrency(e.target.value).toString())}
                            placeholder="0,00"
                            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs h-8 px-1.5 border-dashed"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[8px] font-bold uppercase text-muted-foreground">Nº do pedido</Label>
                          <Input 
                            disabled={!isEditable}
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            placeholder="Ex: 9414"
                            className="bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-[11px] h-7 px-1.5 border-slate-200 focus:border-primary transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[8px] font-bold uppercase text-muted-foreground">Data do pedido</Label>
                          <Input 
                            type="date"
                            disabled={!isEditable}
                            value={orderDate}
                            onChange={(e) => setOrderDate(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-[11px] h-7 px-1.5 border-slate-200 focus:border-primary transition-all"
                          />
                        </div>

                        <div className="space-y-1 col-span-2">
                          <Label className="text-[8px] font-bold uppercase text-muted-foreground">Data coleta / entrega</Label>
                          <Input 
                            type="date"
                            disabled={!isEditable}
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-[11px] h-7 px-1.5 border-slate-200 focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Resumo Financeiro & Comissão do Indicador */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 justify-center shadow-sm shrink-0">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left: Commissionable Total */}
                      <div className="border-r border-slate-100 pr-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] font-bold uppercase text-muted-foreground/60 tracking-tight">Produtos Comissionáveis</span>
                          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-100 font-bold text-[7px] h-3 px-1 uppercase leading-none">Base</Badge>
                        </div>
                        <div className="text-sm font-bold italic text-slate-600 tracking-tighter">
                          {maskCurrency(totalCommissionable)}
                        </div>
                      </div>

                      {/* Right: Commission to Pay */}
                      <div className="pl-1">
                        {isInternalIndicator ? (
                          <div className="flex flex-col justify-center h-full">
                            <span className="text-[8px] font-bold uppercase text-slate-400 tracking-tight">Comissão</span>
                            <div className="text-[10px] uppercase font-bold italic text-slate-400 mt-1">
                              Não Aplicável
                            </div>
                          </div>
                        ) : (isAdmin || isManager || isTriagem || isOwnerIndicator) ? (
                          <>
                            <div className="flex items-center gap-1 mb-1 justify-between">
                              <span className="text-[8px] font-bold uppercase text-primary tracking-tight">Comissão</span>
                              <Badge className="bg-primary/10 text-primary border-none text-[8px] h-4 py-0 font-bold px-1.5">{!hasExternalSeller ? '0%' : displayCommissionRate === null ? 'a definir' : `${displayCommissionRate}%`}</Badge>
                            </div>
                            <div className="text-sm font-bold italic text-primary tracking-tighter">
                              {!hasExternalSeller
                                ? maskCurrency(0)
                                // vendida: o valor gravado no faturamento, que já tirou o desconto
                                : activeIndication.status === 'sold' && typeof (activeIndication as any).commission_value === 'number'
                                  ? maskCurrency((activeIndication as any).commission_value)
                                : displayCommissionRate === null
                                  ? 'a definir'
                                  : maskCurrency(totalCommissionable * (displayCommissionRate / 100))}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full">
                            <Badge className="bg-muted text-muted-foreground border-none text-[8px] font-bold uppercase">Acesso Restrito</Badge>
                            <span className="text-[8px] text-muted-foreground/50 mt-1 uppercase">Comissões ocultas</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-2.5 w-2.5 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[7px] font-bold text-muted-foreground uppercase leading-none">Indicador Beneficiário</span>
                          <span className="text-[9px] font-bold italic text-slate-500 uppercase tracking-tight truncate max-w-[120px]">{activeIndication.external_seller_name || 'Rodiney'}</span>
                        </div>
                      </div>
                      
                      <div className="text-[7px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                        <img 
                          src="https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png" 
                          alt="Logo Small" 
                          className="h-4 w-4"
                        />
                        RODER BRASIL
                      </div>
                    </div>
                  </div>

                  {isSold && (isAdmin || isManager) && activeIndication.external_seller_uid && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm('Enviar aviso desta comissão para financeiro@ e financeiro2@?')) return;
                        const t = toast.loading('Enviando aviso ao financeiro...');
                        try {
                          const r: any = await notifyFinanceCommissionScheduled(activeIndication, { orderNumber: orderNumber, orderDate: orderDate });
                          if (r && r.success === false) throw new Error(r.error || 'falha no envio');
                          await updateDoc(doc(db, 'indications', activeIndication.id), { finance_notice_pending: false, finance_notice_sent_at: new Date().toISOString() }).catch(() => {});
                          toast.success('Aviso enviado ao financeiro.', { id: t });
                        } catch (e: any) {
                          toast.error('Não foi possível enviar: ' + (e?.message || e), { id: t });
                        }
                      }}
                      className="self-start flex items-center gap-1.5 h-8 px-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-700 dark:text-slate-200 shrink-0"
                    >
                      <Mail className="h-3.5 w-3.5 text-primary" /> Avisar financeiro
                    </button>
                  )}

                  {/* Vendedor padrão: comissão dele não aparece no Roder Indica (app só de parceiros indicadores) */}
                  {false && activeIndication.standard_seller_uid && (
                    <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex flex-col gap-2 shadow-sm shrink-0">
                      <div className="flex items-start justify-between min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                            <User className="h-4.5 w-4.5 text-orange-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                              <p className="text-[8px] font-bold uppercase text-orange-600 leading-none">Vendedor Padrão</p>
                              <Badge className="bg-orange-500 text-white text-[7px] h-3.5 py-0 px-1 font-bold uppercase shrink-0">Região: {activeIndication.client_location?.split('-')[1]?.trim() || 'Desconhecida'}</Badge>
                            </div>
                            <p className="text-[11px] font-bold italic text-foreground tracking-tight truncate max-w-[150px]">{activeIndication.standard_seller_name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white p-1 px-2 rounded-lg border border-orange-500/10 shrink-0">
                          <Label className="text-[8px] font-bold uppercase text-muted-foreground cursor-pointer" htmlFor="toggle-std">Ativo</Label>
                          <Switch 
                            id="toggle-std"
                            disabled={!isEditable}
                            checked={standardSellerEnabled}
                            onCheckedChange={setStandardSellerEnabled}
                            className="scale-75"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-orange-500/10 pt-2 text-[9px] text-muted-foreground font-medium">
                        {(isAdmin || isManager || isTriagem || isOwnerStandardSeller) ? (
                          <div className="flex gap-3">
                            <span>Tx: <b className="font-semibold text-slate-850">{standardSellerRate}%</b></span>
                            <span>Comissão: <b className="font-semibold text-orange-600">{maskCurrency(standardSellerCommission)}</b></span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Badge className="bg-muted text-muted-foreground border-none text-[8px] font-bold uppercase py-0 px-1 shadow-none">Acesso Restrito</Badge>
                            <span className="text-[8px] text-muted-foreground/50 uppercase font-bold">Comissões ocultas</span>
                          </div>
                        )}
                        <p className="text-[8px] italic max-w-[160px] text-right leading-tight">
                          Incide sobre o valor bruto.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Planilha de Produtos Comissionáveis (recolhível) */}
                  <details className="group shrink-0 w-full" open={!isMobile}>
                  <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2 bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 group-open:rounded-b-none">
                    <span>Itens do pedido ({commissionedProducts.length})</span>
                    <span className="text-primary normal-case">{maskCurrency(Number(totalCommissionable))} comissionável <ChevronDown className="inline h-3.5 w-3.5 transition-transform group-open:rotate-180" /></span>
                  </summary>
                  <div className="flex flex-col bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm shrink-0 w-full">
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                      <h4 className="text-[10px] font-bold italic uppercase flex items-center gap-2 text-slate-600 dark:text-slate-350">
                        <Package className="h-3.5 w-3.5 text-primary" /> Planilha de Produtos Comissionáveis
                      </h4>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{commissionedProducts.length} itens</span>
                  </div>
                  
                  {!isEditable ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 dark:bg-slate-900">
                      {commissionedProducts.map((prod, index) => {
                        const isNonComm = prod.is_commissionable === false;
                        const qty = Number(prod.quantity) || 1;
                        return (
                          <div key={`${prod.uniqueId || prod.code || 'item'}-ro-${index}`} className="px-3 py-1.5 flex items-start gap-2 text-[12px]">
                            <div className="flex-1 min-w-0">
                              <p className={cn("leading-snug", isNonComm ? "text-red-500" : "text-slate-800 dark:text-slate-100")}>{prod.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{prod.code}{qty > 1 ? ` · ${qty} un` : ''}{isNonComm ? ' · não comissionável' : ''}</p>
                            </div>
                            <span className={cn("font-bold whitespace-nowrap", isNonComm ? "text-red-500" : "text-slate-900 dark:text-slate-100")}>{Number(prod.base_value) > 0 ? maskCurrency(Number(prod.base_value) * qty) : '—'}</span>
                          </div>
                        );
                      })}
                      <div className="px-3 py-1.5 flex justify-between text-[12px] font-bold bg-slate-50 dark:bg-slate-800/50">
                        <span>Total comissionável</span>
                        <span className="text-primary">{maskCurrency(Number(totalCommissionable))}</span>
                      </div>
                    </div>
                  ) : (
                  <div className="flex-1 overflow-auto dark:bg-slate-900 min-h-[320px] lg:min-h-0">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 backdrop-blur-sm z-10">
                        <tr>
                          <th className="px-4 py-1.5 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 w-28">Código</th>
                          <th className="px-4 py-1.5 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">Descrição</th>
                          <th className="px-4 py-1.5 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 w-14">Qtd</th>
                          <th className="px-4 py-1.5 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 w-44">Valor Base (R$)</th>
                          <th className="px-4 py-1.5 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 w-20 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {commissionedProducts.map((prod, index) => {
                          const isNonComm = prod.is_commissionable === false;
                          const rowTextColor = isNonComm 
                            ? "text-red-500 dark:text-red-400" 
                            : "text-slate-900 dark:text-slate-100";
                          
                          return (
                            <tr key={`${prod.uniqueId || prod.code || 'item'}-${index}`} className={cn(
                              "hover:bg-muted/10 dark:hover:bg-slate-800/50 transition-colors",
                              isNonComm ? "bg-red-50/30 dark:bg-red-950/10" : ""
                            )}>
                              <td className="px-4 py-1.5 font-mono text-[10px] font-bold">
                                <div className="flex items-center gap-1.5">
                                  {isNonComm ? (
                                    <Badge className="bg-red-100 hover:bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-none text-[7px] font-bold uppercase py-0 px-1 shadow-none rounded-sm animate-pulse" title="Item não comissionável">
                                      NC
                                    </Badge>
                                  ) : null}
                                  <span className={cn(isNonComm ? "text-red-500 dark:text-red-400 font-bold" : "text-primary dark:text-orange-400")}>
                                    {prod.code}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-1.5 text-[11px]">
                                <div className={cn("flex flex-col gap-0.5", rowTextColor)}>
                                  <span className="font-medium leading-tight">{prod.name}</span>
                                  {isNonComm && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[7.5px] uppercase tracking-wide font-extrabold text-red-500 bg-red-100/60 dark:bg-red-950/40 px-1 rounded whitespace-nowrap">Item Não Comissionável</span>
                                      <Info className="h-2.5 w-2.5 text-red-400" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-1.5">
                                <Input 
                                  type="number"
                                  disabled={!isEditable}
                                  value={prod.quantity}
                                  onChange={(e) => handleUpdateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                                  className={cn(
                                    "h-7 py-0 px-1.5 text-[11px] border-transparent focus:border-primary/50 bg-transparent disabled:opacity-75 w-12 font-bold",
                                    rowTextColor
                                  )}
                                />
                              </td>
                              <td className="px-4 py-1.5">
                                <div className="flex flex-col justify-center leading-normal py-0.5 min-w-[140px]">
                                  {isEditable ? (
                                    <div className="relative group/base w-full">
                                      <Input 
                                        inputMode="numeric"
                                        value={maskCurrency(Number(prod.base_value))}
                                        onChange={(e) => handleUpdateProduct(index, 'base_value', unmaskCurrency(e.target.value))}
                                        className={cn(
                                          "h-7 py-0 px-1.5 text-[11px] border-transparent focus:border-primary/50 bg-transparent font-black transition-all w-full",
                                          isNonComm 
                                            ? "text-red-500 dark:text-red-400 font-extrabold" 
                                            : "text-slate-900 dark:text-slate-100",
                                          prod.base_value <= 0 && "bg-destructive/5 border-destructive/20 text-destructive dark:text-destructive-foreground animate-pulse"
                                        )}
                                        placeholder="Definir"
                                      />
                                      {prod.base_value <= 0 && (
                                        <div className="absolute -right-1 -top-1">
                                          <span className="flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                                          </span>
                                        </div>
                                      )}
                                      {prod.quantity > 1 && prod.base_value > 0 && (
                                        <div className="px-1.5 mt-0.5 flex flex-col leading-none border-l-2 border-slate-200 dark:border-slate-800 pl-1">
                                          <span className="text-[7.5px] font-bold text-muted-foreground uppercase tracking-tight">
                                            Un: {maskCurrency(Number(prod.base_value))}
                                          </span>
                                          <span className={cn(
                                            "text-[10px] font-black tracking-tight mt-0.5",
                                            isNonComm ? "text-red-400 dark:text-red-500" : "text-primary dark:text-orange-400"
                                          )}>
                                            Total: {maskCurrency(Number(prod.base_value) * prod.quantity)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    prod.base_value > 0 ? (
                                      prod.quantity > 1 ? (
                                        <div className="flex flex-col leading-none border-l-2 border-slate-200 dark:border-slate-800 pl-1.5">
                                          <span className="text-[7.5px] font-bold text-muted-foreground uppercase tracking-tight">
                                            Un: {maskCurrency(Number(prod.base_value))}
                                          </span>
                                          <span className={cn(
                                            "text-[11px] font-extrabold tracking-tight mt-1",
                                            isNonComm ? "text-red-505 dark:text-red-450" : "text-slate-900 dark:text-slate-100"
                                          )}>
                                            Total: {maskCurrency(Number(prod.base_value) * prod.quantity)}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className={cn(
                                          "px-0 ml-1 text-[11px] font-extrabold block",
                                          isNonComm ? "text-red-500 dark:text-red-450" : "text-slate-900 dark:text-slate-100"
                                        )}>
                                          {maskCurrency(Number(prod.base_value))}
                                        </span>
                                      )
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[7px] font-normal bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-505 border-slate-205">PENDENTE</Badge>
                                      </div>
                                    )
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-1.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {isEditable && (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={cn(
                                          "h-6 w-6 rounded-md transition-all active:scale-95",
                                          !isNonComm 
                                            ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" 
                                            : "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        )}
                                        onClick={() => toggleProductCommissionable(index)}
                                        title={!isNonComm ? "Tornar NÃO comissionável" : "Tornar comissionável"}
                                      >
                                        <BadgeDollarSign className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-md transition-all active:scale-95"
                                        onClick={() => removeProduct(index)}
                                        title="Remover item"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* New Line */}
                        {isEditable && (
                          <tr className="bg-primary/5 dark:bg-slate-800/20">
                            <td className="px-4 py-2 min-w-[150px] relative">
                              <div className="space-y-0.5">
                                <Label className="text-[8px] font-bold uppercase text-primary/60">Código ou Nome</Label>
                                <div className="relative">
                                  <Input 
                                    placeholder="BUSCAR EQUIPAMENTO..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                      setSearchQuery(e.target.value);
                                      setShowProductSuggestions(true);
                                    }}
                                    onFocus={() => setShowProductSuggestions(true)}
                                    className="h-7 text-[10px] font-bold uppercase bg-background text-foreground border-primary/20 focus:border-primary shadow-sm"
                                  />
                                  {showProductSuggestions && searchQuery.length >= 2 && (
                                    <div className="absolute z-50 w-[300px] mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-[220px] overflow-y-auto">
                                      <div className="p-2 border-b border-slate-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between sticky top-0">
                                        <span className="text-[8px] font-bold uppercase text-slate-400">Sugestões</span>
                                        <X className="h-3 w-3 cursor-pointer text-slate-400" onClick={() => setShowProductSuggestions(false)} />
                                      </div>
                                      {registeredProducts
                                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .reduce((acc: RegisteredProduct[], current) => {
                                          if (!acc.some(p => p.code === current.code || p.id === current.id)) {
                                            acc.push(current);
                                          }
                                          return acc;
                                        }, [])
                                        .map((p, index) => (
                                          <div 
                                            key={`${p.id || p.code}-${index}`}
                                            className="px-3 py-2 hover:bg-primary/5 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-2 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0"
                                            onClick={() => {
                                              handleAddProductByCode(p.code);
                                              setShowProductSuggestions(false);
                                            }}
                                          >
                                            <div className="h-8 w-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center p-1 border border-slate-200 dark:border-slate-600 shrink-0">
                                              {p.image_url ? (
                                                <img src={p.image_url} alt={p.name} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                                              ) : (
                                                <Package className="h-4 w-4 text-slate-300 dark:text-slate-500" />
                                              )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                              <span className="text-[10px] font-bold truncate leading-tight text-slate-900 dark:text-slate-100">{p.name}</span>
                                              <span className="text-[8px] font-mono text-slate-400 dark:text-slate-505 mt-0.5">{p.code}</span>
                                            </div>
                                          </div>
                                        ))}
                                      {searchQuery && (
                                        <div 
                                          className="p-2 text-center bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 transition-colors cursor-pointer"
                                          onClick={() => {
                                            handleAddProductByCode(searchQuery);
                                            setShowProductSuggestions(false);
                                          }}
                                        >
                                          <span className="text-[9px] font-bold uppercase text-primary">Usar "{searchQuery}" como código</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-[9px] text-muted-foreground italic h-10 flex items-center">
                              Escolha na lista para preenchimento
                            </td>
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2 text-center">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={searchQuery.length < 2}
                                onClick={() => handleAddProductByCode(searchQuery)}
                                className="h-7 w-7 text-primary hover:bg-primary/10 rounded-full"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">
                          <td colSpan={3} className="px-4 py-2 text-right text-[9px] font-bold uppercase text-slate-500 dark:text-slate-450">Subtotal Comissionável</td>
                          <td className="px-4 py-2 text-primary dark:text-orange-400 text-xs italic font-bold">{maskCurrency(Number(totalCommissionable))}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  )}
                </div>
                  </details>
              </div>

                {/* LEFT PANEL: ACOMPANHAMENTO & LINHA DO TEMPO (7 SPANS, LEFT SIDE - AGENDOR CRM STYLE) */}
                <div className={cn(
                  "lg:col-span-7 order-2 lg:order-1 flex flex-col gap-3 lg:overflow-y-auto lg:pr-4 lg:h-full min-h-0"
                )}>
                {/* On Mobile & Desktop: Novo Acompanhamento Form goes at top of right panel */}
                <div className="w-full flex flex-col gap-3 shrink-0">
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 space-y-2">
                    {!canInteract ? (
                      <p className="text-[11px] text-muted-foreground leading-snug flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-orange-500 shrink-0" /> Você acompanha esta negociação. As anotações são feitas pela equipe Roder.</p>
                    ) : (
                      <>
                        {/* Seletor Rápido de Tipo de Atividade / Categoria */}
                        <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
                          {[
                            { id: 'nota', label: 'Nota', icon: MessageSquare, color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                            { id: 'ligacao', label: 'Ligação', icon: Phone, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                            { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                            { id: 'email', label: 'E-mail', icon: FileText, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                            { id: 'proposta', label: 'Proposta', icon: BadgeDollarSign, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                            { id: 'reuniao', label: 'Reunião', icon: User, color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
                            { id: 'visita', label: 'Visita', icon: MapPin, color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
                          ].map((cat) => {
                            const IconComp = cat.icon;
                            const isSel = selectedActivityType === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedActivityType(cat.id as any)}
                                className={cn(
                                  "px-2 h-7 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 border shrink-0",
                                  isSel 
                                    ? "bg-primary text-white border-primary" 
                                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                                )}
                              >
                                <IconComp className="h-3 w-3" />
                                <span>{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        <textarea 
                          value={historyNote}
                          onChange={(e) => setHistoryNote(e.target.value)}
                          placeholder="O que foi conversado com o cliente? (o indicador também vê)"
                          rows={2}
                          className="w-full bg-background border border-primary/20 rounded-lg p-2 text-[16px] lg:text-xs min-h-[56px] resize-y focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                        
                        {/* Image Upload Area */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                          <label className="flex items-center justify-center gap-1.5 h-9 px-3 bg-background border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-all text-[10px] font-bold uppercase text-muted-foreground shrink-0">
                            <Camera className="h-4 w-4 text-primary shrink-0" />
                            <span>Foto</span>
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                if (e.target.files) {
                                  setHistoryImages(prev => [...prev, ...Array.from(e.target.files!)]);
                                }
                              }}
                            />
                          </label>
                          <Button 
                            onClick={handleAddHistory}
                            disabled={loading || (!historyNote.trim() && historyImages.length === 0)}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold uppercase text-[11px] h-9 rounded-lg"
                          >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar no histórico'}
                          </Button>
                          </div>
                          
                          {historyImages.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {historyImages.map((img, i) => (
                                <div key={i} className="relative group">
                                  <div className="w-12 h-12 rounded-lg bg-muted border border-border overflow-hidden">
                                    <img src={URL.createObjectURL(img)} alt="preview" className="w-full h-full object-cover" />
                                  </div>
                                  <button 
                                    onClick={() => setHistoryImages(prev => prev.filter((_, idx) => idx !== i))}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </>
                    )}
                  </div>
                  

                </div>

                {/* Timeline List (Linha do Tempo de Atendimento) */}
                <div className="w-full flex-1 flex flex-col gap-4 shrink-0 min-h-[300px]">
                  <div className="flex flex-col h-auto lg:h-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex flex-wrap items-center justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-black italic uppercase">
                          Linha do Tempo de Atendimento
                        </h4>
                        <Badge variant="outline" className="text-[8px] font-bold uppercase border-primary/20 text-primary">
                          {historicoExibido.length} Registros
                        </Badge>
                      </div>

                      {/* Timeline Filter */}
                      <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[9px] font-bold uppercase">
                        <button
                          type="button"
                          onClick={() => setTimelineFilter('all')}
                          className={cn(
                            "px-2 py-0.5 rounded-md transition-all",
                            timelineFilter === 'all' ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          Todos
                        </button>
                        {false && (<button
                          type="button"
                          onClick={() => setTimelineFilter('agendor')}
                          className={cn(
                            "px-2 py-0.5 rounded-md transition-all",
                            timelineFilter === 'agendor' ? "bg-emerald-600 text-white shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          Agendor CRM
                        </button>)}
                        <button
                          type="button"
                          onClick={() => setTimelineFilter('roder')}
                          className={cn(
                            "px-2 py-0.5 rounded-md transition-all",
                            timelineFilter === 'roder' ? "bg-primary text-white shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          Roder Indica
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-2 lg:p-3 overflow-y-auto flex-1">
                      <div className="space-y-1.5">
                        {historicoExibido
                          .slice()
                          .reverse()
                          .filter((entry) => {
                            if (timelineFilter === 'agendor') return entry.author_name?.toLowerCase().includes('agendor') || entry.content?.includes('[AGENDOR]');
                            if (timelineFilter === 'roder') return !entry.author_name?.toLowerCase().includes('agendor') && !entry.content?.includes('[AGENDOR]');
                            return true;
                          })
                          .map((entry, idx) => {
                            const txt = cleanHistoryContent(entry.content) || '';
                            const firstLine = txt.split('\n').find((l: string) => l.trim()) || '';
                            const nAtt = entry.attachments?.length || 0;
                            return (
                          <details key={entry.id || `hist-${idx}-${entry.created_at || ''}`} className="group bg-white dark:bg-slate-900 rounded-lg border border-border/60 open:border-primary/30">
                            <summary className="list-none cursor-pointer px-2.5 py-2 flex items-center gap-2 min-w-0">
                              <span className={cn("h-2 w-2 rounded-full shrink-0", entry.type === 'partner_note' ? "bg-amber-500" : entry.type === 'system' || entry.type === 'status_change' ? "bg-slate-400" : entry.type === 'note' ? "bg-primary" : "bg-blue-500")} />
                              <span className="flex-1 min-w-0 truncate text-[12px] text-slate-800 dark:text-slate-200 group-open:whitespace-normal">{entry.type === 'partner_note' && <strong className="mr-1 text-amber-700 dark:text-amber-400">{ROTULO_OBSERVACAO_PARCEIRO}:</strong>}{firstLine}</span>
                              {nAtt > 0 && <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />}
                              <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">{entry.created_at ? format(new Date(entry.created_at), "dd/MM", { locale: ptBR }) : ''} · {(entry.author_name || '').split(' ')[0]}</span>
                            </summary>
                            <div className="px-3 pb-3 pt-1 border-t border-border/40">
                              <p className="text-[10px] text-muted-foreground mb-1">{entry.author_name} · {entry.created_at ? format(new Date(entry.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR }) : ''}</p>
                              <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-2">{txt}</p>
                              {entry.attachments && entry.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                                  {entry.attachments.map((file, fIdx) => {
                                    const isPdf = file.name?.toLowerCase().endsWith('.pdf') || file.url?.toLowerCase().includes('.pdf');
                                    const isDoc = !isPdf && (file.name?.toLowerCase().match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip)$/) || !file.url?.match(/\.(jpeg|jpg|gif|png|webp)/i));

                                    if (isPdf || isDoc) {
                                      return (
                                        <div key={fIdx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border/50 hover:border-primary/50 transition-all">
                                          <FileText className="h-5 w-5 text-red-500 shrink-0" />
                                          <div className="min-w-0 max-w-[160px] lg:max-w-[200px]">
                                            <p className="text-xs font-bold truncate text-foreground">{file.name || 'Documento PDF'}</p>
                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Anexo CRM</span>
                                          </div>
                                          <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-7 px-2 text-xs text-primary hover:text-primary"
                                            onClick={() => abrirDocumento(file.url, file.name || 'Documento')}
                                          >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={fIdx} className="group/item relative">
                                        <div 
                                          className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden border border-border bg-muted cursor-pointer hover:border-primary/50 transition-all"
                                          onClick={() => setSelectedImage(file.url)}
                                        >
                                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 opacity-100 lg:opacity-0 group-hover/item:opacity-100 transition-opacity flex gap-1">
                                          <Button 
                                            size="icon" 
                                            variant="secondary" 
                                            className="h-6 w-6 rounded-full shadow-lg"
                                            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Veja esta foto da negociação: ${file.url}`)}`, '_blank')}
                                          >
                                            <Share2 className="h-3 w-3 text-green-600" />
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                            </div>
                          </details>
                            );
                          })}
                        
                        {!historicoExibido.length && (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-50">
                            <History className="h-10 w-10 mb-2" />
                            <p className="text-xs font-bold uppercase tracking-wider">Nenhum histórico registrado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
          <div 
            onPointerDown={(e) => !isMobile && dragControls.start(e)}
            className={cn(
              "bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 gap-2",
              isMobile ? "p-3 pb-[max(12px,env(safe-area-inset-bottom))]" : "p-6 cursor-move active:cursor-grabbing group/footer"
            )}
          >
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="outline" 
                onClick={closeNegotiation}
                className="h-9 px-3 lg:px-6 rounded-lg font-bold uppercase text-[9px] lg:text-[10px] tracking-wider border-slate-200 shrink-0"
              >
                {isMobile ? "Sair" : "Cancelar Alterações"}
              </Button>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4 ml-auto" onClick={(e) => e.stopPropagation()}>
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Total Negociação</p>
                <p className="text-base font-black italic tracking-tighter text-slate-700">
                  {maskCurrency(Number(grossBudgetValue) || 0)}
                </p>
              </div>
              
              {isSold ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20 uppercase font-bold tracking-wider text-[8px] lg:text-[9px] h-9 px-2 lg:px-3">
                     {isMobile ? "Faturado" : "Acompanhamento Ativo"}
                  </Badge>
                  {(isAdmin || isManager) && (
                    <Button 
                      onClick={handleUndoInvoiceDirect}
                      disabled={loading}
                      variant="outline"
                      className="h-9 px-3 lg:px-6 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-bold italic uppercase text-[9px] lg:text-xs tracking-wider shadow-sm rounded-lg flex items-center gap-1.5 shrink-0"
                    >
                      {isMobile ? "Desfazer" : "Desfazer Faturamento"}
                    </Button>
                  )}
                </div>
              ) : (
                canInteract && (() => {
                  const isSalesOrderLoaded = !!orderNumber && orderNumber.trim() !== '';
                  return (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button 
                        onClick={handleOpenFinalizeDialog}
                        disabled={loading || !isSalesOrderLoaded}
                        className={cn(
                          "h-9 px-3 lg:px-6 font-bold italic uppercase text-[9px] lg:text-xs tracking-wider shadow-sm rounded-lg flex items-center gap-1.5 shrink-0 transition-all",
                          isSalesOrderLoaded 
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-md active:scale-95" 
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border-none shadow-none pointer-events-none"
                        )}
                        title={!isSalesOrderLoaded ? "Faturamento disponível apenas após carregar o Pedido de Venda" : "Clique para finalizar faturamento"}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{isMobile ? "Faturar" : "Finalizar Faturamento"}</span>
                      </Button>
                      <Button 
                        onClick={() => handleSaveNegotiation()}
                        disabled={loading}
                        className="h-9 px-3 lg:px-8 bg-primary hover:bg-primary/90 text-white font-bold italic uppercase text-[9px] lg:text-xs tracking-wider shadow-sm rounded-lg shrink-0"
                      >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                          <span className="flex items-center gap-1.5">
                            <Save className="h-3.5 w-3.5" />
                            <span>{isMobile ? "Salvar" : "Salvar Progresso"}</span>
                          </span>
                        )}
                      </Button>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </motion.div>
        </>
      )}

      {/* Image Zoom Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl bg-transparent border-none p-0 outline-none">
          {selectedImage && (
            <div className="relative w-full h-[80vh] flex items-center justify-center">
              <img 
                src={selectedImage} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                alt="Enlarged" 
                referrerPolicy="no-referrer"
              />
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute top-4 right-4 rounded-full"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                <Button 
                  onClick={() => window.open(selectedImage, '_blank')}
                  className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 gap-2"
                >
                  <ExternalLink className="h-4 w-4" /> Ver Original
                </Button>
                <Button 
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Olha esta imagem da negociação: ${selectedImage}`)}`, '_blank')}
                  className="bg-green-500 hover:bg-green-600 font-bold gap-2"
                >
                  <MessageCircle className="h-4 w-4" /> Enviar WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </AnimatePresence>
  );
}
