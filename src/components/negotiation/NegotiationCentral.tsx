import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
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
  LayoutDashboard
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
  deleteDoc
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
  const { profile, isAdmin, isManager, isTriagem } = useAuth();
  const isInternalSeller = profile?.role === 'internal_seller';
  const isRegionalSeller = profile?.role === 'vendedor_padrao';
  const canInteract = isAdmin || isManager || isTriagem || isInternalSeller;
  const isSold = activeIndication?.status === 'sold';
  const isEditable = canInteract && !isSold;

  const dragControls = useDragControls();
  const [activeTab, setActiveTab] = useState<'commercial' | 'timeline'>('commercial');
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
  const [standardSellerEnabled, setStandardSellerEnabled] = useState(false);
  const [standardSellerRate, setStandardSellerRate] = useState(2);
  const [historyNote, setHistoryNote] = useState('');
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

  useEffect(() => {
    if (activeIndication) {
      const loadedProducts = (activeIndication.commissioned_products || []).map((p: any, idx: number) => ({
        ...p,
        uniqueId: p.uniqueId || `${p.code || 'item'}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
      }));
      setCommissionedProducts(loadedProducts);
      setGrossBudgetValue(activeIndication.gross_budget_value?.toString() || '');
      setStandardSellerEnabled(activeIndication.standard_seller_commission_enabled !== false);
      setStandardSellerRate(activeIndication.standard_seller_commission_rate || 2);
      setDeliveryDate(activeIndication.delivery_date || '');
      setOrderNumber(activeIndication.sale_order_number || '');
      setOrderDate(activeIndication.sale_order_date || '');
      setExtractedCnpj(activeIndication.client_cnpj || '');
      setExtractedEmail(activeIndication.client_email || '');
      setExtractedPhone(activeIndication.client_phone || '');
      setExtractedAddress(activeIndication.client_address || '');
      setCompanyName(activeIndication.client_company_name || '');
      setClientCode(activeIndication.client_code || '');
      
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

  const isInternalIndicator = indicatorProfile 
    ? ['admin', 'manager', 'internal_seller', 'triagem', 'financial', 'marketing', 'fiscal', 'vendedor_padrao'].includes(indicatorProfile.role)
    : false;

  const hasExternalSeller = !!activeIndication?.external_seller_uid && !isInternalIndicator;
  const totalCommissionable = hasExternalSeller
    ? commissionedProducts.reduce((acc, curr) => acc + ((curr.is_commissionable !== false ? curr.base_value : 0) * curr.quantity), 0)
    : 0;
  const grossValueNum = parseFloat(grossBudgetValue) || 0;
  const standardSellerCommission = (standardSellerEnabled && hasExternalSeller) ? (grossValueNum * (standardSellerRate / 100)) : 0;

  const handleUploadBudget = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeIndication) return;

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
      
      const result = await analyzeDetailedBudget(base64);
      setUploadProgress(80);
      
      if (result) {
        if (result.sale_value) {
          setGrossBudgetValue(result.sale_value.toString());
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
                console.log(`Cliente ${cleanedClientName} já cadastrado. Dados atualizados!`);
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
            
            const isKit = item.code.startsWith('9000');
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
              is_commissionable: !isKit
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
            toast.success(`${newProducts.length} itens do pedido identificados e sincronizados!`);
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

  const handleSaveNegotiation = async () => {
    if (!activeIndication) return;
    setLoading(true);
    try {
      const indicationRef = doc(db, 'indications', activeIndication.id);
      
      const updateData: any = {
        commissioned_products: commissionedProducts,
        gross_budget_value: grossValueNum,
        updated_at: new Date().toISOString(),
        base_commission_value: totalCommissionable,
        standard_seller_commission_enabled: standardSellerEnabled,
        standard_seller_commission_rate: standardSellerRate,
        standard_seller_commission_value: standardSellerCommission,
        delivery_date: deliveryDate,
        sale_order_number: orderNumber,
        sale_order_date: orderDate,
        client_cnpj: extractedCnpj || activeIndication.client_cnpj || '',
        client_email: extractedEmail || activeIndication.client_email || '',
        client_phone: extractedPhone || activeIndication.client_phone || '',
        client_address: extractedAddress || activeIndication.client_address || '',
        client_company_name: companyName || activeIndication.client_company_name || '',
        client_code: clientCode || activeIndication.client_code || ''
      };

      await updateDoc(indicationRef, updateData);

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
          
          await setDoc(doc(db, 'customer_evaluations', activeIndication.id), evalPayload);
          console.log(`Saved customer quality survey: scheduled for ${evalPayload.scheduled_date}`);
        } catch (evalErr) {
          console.error("Error creating customer evaluation sync:", evalErr);
        }
      }
      
      // Notify Indicator (External Seller) and Managers
      if (activeIndication.external_seller_uid) {
        await notifyExternalSeller(
          activeIndication.external_seller_uid,
          'Orçamento em Andamento',
          `Um orçamento foi cadastrado ou atualizado para o cliente ${activeIndication.client_name}.`,
          `/indicacoes`
        );
      }
      
      await notifyManagers(
        'Orçamento Atualizado',
        `${profile?.name} atualizou o orçamento de ${activeIndication.client_name}. Total: ${maskCurrency(parseFloat(grossBudgetValue) || 0)}`,
        `/indicacoes`
      );

      // Notify Standard Seller (Regional) if exists
      if (activeIndication.standard_seller_uid && profile?.uid !== activeIndication.standard_seller_uid) {
        await createNotification({
          user_uid: activeIndication.standard_seller_uid,
          title: 'Acompanhamento Regional',
          message: `${profile?.name} atualizou a negociação de ${activeIndication.client_name} na sua região.`,
          type: 'info',
          link: `/indicacoes`
        });
      }

      // Auto-add history if changes occurred (simplified logic)
      await updateDoc(indicationRef, {
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
        refreshIndication({ id: updatedSnap.id, ...updatedSnap.data() } as Indication);
      }
      
      // The user said: "closes automatically" after clicking save button
      closeNegotiation();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUndoInvoiceDirect = async () => {
    if (!activeIndication) return;
    if (!window.confirm(`Deseja realmente estornar o faturamento da venda de "${activeIndication.client_name}"? Isso moverá o status de volta para Negociação, reverterá a baixa de estoque automática e excluirá a comissão vinculada de forma definitiva.`)) return;
    
    setLoading(true);
    try {
      // 1. Delete associated commissions
      const commissionsRef = collection(db, 'commissions');
      const commQuery = query(commissionsRef, where('indication_id', '==', activeIndication.id));
      const commSnap = await getDocs(commQuery);
      for (const docSnap of commSnap.docs) {
        await deleteDoc(doc(db, 'commissions', docSnap.id));
      }

      // 2. Revert associated stock sales
      const stockSalesRef = collection(db, 'stock_sales');
      let salesQuery = query(stockSalesRef, where('indication_id', '==', activeIndication.id));
      let salesSnap = await getDocs(salesQuery);
      
      if (salesSnap.empty && activeIndication.client_name) {
        salesQuery = query(stockSalesRef, where('client_name', '==', activeIndication.client_name));
        salesSnap = await getDocs(salesQuery);
      }

      for (const docSnap of salesSnap.docs) {
        const saleData = docSnap.data();
        const stockItemId = saleData.stock_item_id;
        const qtySold = saleData.quantity_sold || 0;

        if (stockItemId && qtySold > 0) {
          const stockItemRef = doc(db, 'stock_items', stockItemId);
          const stockItemSnap = await getDoc(stockItemRef);
          if (stockItemSnap.exists()) {
            const currentQty = stockItemSnap.data().quantity || 0;
            await updateDoc(stockItemRef, {
              quantity: currentQty + qtySold,
              updated_at: new Date().toISOString()
            });
          }
        }
        await deleteDoc(doc(db, 'stock_sales', docSnap.id));
      }

      // 3. Move status back and clear values
      const leadRef = doc(db, 'indications', activeIndication.id);
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
      setLoading(false);
    }
  };

  const handleOpenFinalizeDialog = () => {
    if (!activeIndication) return;
    setInvoiceIndication(activeIndication);
    setIsInvoiceDialogOpen(true);
    closeNegotiation();
  };

  const handleAddHistory = async () => {
    if (!historyNote.trim() && historyImages.length === 0) return;
    if (!activeIndication) return;
    
    setLoading(true);
    try {
      const attachments: { name: string; url: string }[] = [];
      
      // Upload images if any
      for (const image of historyImages) {
        const fileRef = ref(storage, `indications/${activeIndication.id}/history/${Date.now()}_${image.name}`);
        await uploadBytes(fileRef, image);
        const url = await getDownloadURL(fileRef);
        attachments.push({ name: image.name, url });
      }

      const indicationRef = doc(db, 'indications', activeIndication.id);
      await updateDoc(indicationRef, {
        negotiation_history: arrayUnion({
          id: Math.random().toString(36).substring(2, 11),
          type: 'note',
          author_name: profile?.name || 'Sistema',
          created_at: new Date().toISOString(),
          content: historyNote,
          attachments
        }),
        updated_at: new Date().toISOString()
      });
      
      // Notify involved parties
      if (activeIndication.external_seller_uid && profile?.uid !== activeIndication.external_seller_uid) {
        await createNotification({
          user_uid: activeIndication.external_seller_uid,
          title: 'Novo Acompanhamento',
          message: `${profile?.name} adicionou uma observação na negociação de ${activeIndication.client_name}.`,
          type: 'info',
          link: `/indicacoes`
        });
      }
      
      if (activeIndication.internal_seller_uid && profile?.uid !== activeIndication.internal_seller_uid) {
        await createNotification({
          user_uid: activeIndication.internal_seller_uid,
          title: 'Novo Acompanhamento',
          message: `${profile?.name} adicionou uma observação na negociação de ${activeIndication.client_name}.`,
          type: 'info',
          link: `/indicacoes`
        });
      }

      await notifyManagers(
        'Novo Acompanhamento',
        `${profile?.name} registrou um novo histórico para ${activeIndication.client_name}.`,
        `/indicacoes`
      );

      setHistoryNote('');
      setHistoryImages([]);
      toast.success('Acompanhamento adicionado!');
      
      const updatedSnap = await getDoc(indicationRef);
      if (updatedSnap.exists()) {
        refreshIndication({ id: updatedSnap.id, ...updatedSnap.data() } as Indication);
      }
    } catch (error: any) {
      toast.error('Erro ao adicionar histórico: ' + error.message);
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
                ? "inset-0 w-full h-full rounded-none border-none" 
                : "border-2 border-primary/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] rounded-3xl min-w-[700px] min-h-[500px] max-w-[95vw] max-h-[95vh]"
            )}
            style={isMobile ? {
              touchAction: 'none'
            } : {
              width: '1200px',
              height: '800px',
              touchAction: 'none'
            }}
          >
            {/* Header */}
            <div 
              onPointerDown={(e) => !isMobile && dragControls.start(e)}
              className={cn(
                "bg-white flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 shrink-0",
                isMobile ? "h-14" : "h-16 cursor-move active:cursor-grabbing group/handle"
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
                    CENTRAL DE NEGOCIAÇÃO <Badge className="text-[8px] lg:text-[10px] bg-slate-100 text-slate-500 border-slate-200 py-0 h-4 lg:h-5 shrink-0">PLANILHA</Badge>
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
            <div className="bg-muted/30 px-4 lg:px-6 py-2 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 lg:h-8 lg:w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none">Cliente</p>
                      {activeIndication.ai_score && (
                        <Badge className={cn(
                          "text-[7px] lg:text-[8px] h-3 lg:h-3.5 font-bold uppercase border-none py-0 px-1",
                          activeIndication.ai_score === 'hot' ? "bg-red-500 text-white" : activeIndication.ai_score === 'cold' ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                        )}>
                          {activeIndication.ai_score === 'hot' ? '🔥 Quente' : activeIndication.ai_score === 'cold' ? '❄️ Frio' : '⚖️ Morno'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs lg:text-sm font-bold italic truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs">{activeIndication.client_name}</p>
                  </div>
                </div>
                <Separator orientation="vertical" className="hidden sm:block h-6" />
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-[10px] lg:text-xs font-semibold text-slate-600 truncate max-w-[130px] sm:max-w-xs">{activeIndication.client_location || 'Local não indicado'}</p>
                </div>
              </div>
              
              <div className="flex gap-1.5 justify-end shrink-0">
                <Button 
                  variant={activeTab === 'commercial' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('commercial')}
                  className={cn(
                    "gap-1 lg:gap-2 font-bold italic uppercase text-[8px] lg:text-[10px] tracking-wider h-7 lg:h-8 px-2 lg:px-4 rounded-full transition-all border",
                    activeTab === 'commercial' 
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/10" 
                      : "bg-white text-muted-foreground border-border hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  <Package className="h-3 w-3 shrink-0" />
                  <span>{isMobile ? "Comercial" : "Comercial & Produtos"}</span>
                </Button>
                <Button 
                  variant={activeTab === 'timeline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('timeline')}
                  className={cn(
                    "gap-1 lg:gap-2 font-bold italic uppercase text-[8px] lg:text-[10px] tracking-wider h-7 lg:h-8 px-2 lg:px-4 rounded-full transition-all border",
                    activeTab === 'timeline' 
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/10" 
                      : "bg-white text-muted-foreground border-border hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  <History className="h-3 w-3 shrink-0" />
                  <span>{isMobile ? "Histórico" : "Acompanhamento"}</span>
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto lg:overflow-hidden bg-slate-50/10 p-3 lg:p-6 flex flex-col gap-4">
            {isSold && (
              <div className="bg-emerald-50 border-2 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30 rounded-xl p-3 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase text-emerald-600 dark:text-emerald-400 leading-none mb-1">Pedido Faturado & Concluído 🚀</p>
                    <p className="text-xs font-normal text-slate-700 dark:text-slate-350 leading-tight">Este pedido já teve o faturamento finalizado e as comissões correspondentes foram devidamente liberadas na aba de comissões.</p>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white border-none font-black uppercase text-[8px] py-1 px-2.5 shrink-0">FATURADO</Badge>
              </div>
            )}

            {activeTab === 'commercial' && (
              <AnimatePresence>
                {(isAdmin || isManager) && commissionedProducts.some(p => p.base_value <= 0) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="shrink-0"
                  >
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                          <BadgeDollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase text-amber-600 leading-none mb-1">Ação Requerida</p>
                          <p className="text-xs font-normal text-amber-900 leading-tight">Existem itens sem valor base cadastrado. A comissão não será calculada corretamente.</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-500 text-white border-none text-[8px] font-black uppercase py-0.5 px-2">Atenção</Badge>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {activeTab === 'commercial' ? (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden min-h-0">
                {/* LEFT COLUMN: Order Details, Commissions & Standard Seller */}
                <div className="lg:col-span-5 flex flex-col gap-4 lg:overflow-y-auto pr-1">
                  
                  {/* Valores do Pedido de Venda */}
                  <div className="relative space-y-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {readingBudget && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-xl">
                        <div className="w-48 h-2 bg-muted rounded-full overflow-hidden mb-3">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-medium uppercase text-primary animate-pulse flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" /> Processando Pedido de Venda... {uploadProgress}%
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h4 className="text-[10px] font-bold italic uppercase text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <BadgeDollarSign className="h-3.5 w-3.5" /> Valores do Pedido de Venda
                      </h4>
                      {isEditable && (
                        <label className="cursor-pointer">
                          <Input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleUploadBudget}
                          />
                          <div className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90 transition-all shadow-sm active:scale-95 group/upload">
                            <Upload className="h-3 w-3 group-hover:animate-bounce" />
                            <span className="text-[9px] font-normal uppercase italic">Carregar</span>
                          </div>
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-muted-foreground dark:text-slate-400">Valor Total (R$)</Label>
                        <Input 
                          disabled={!isEditable}
                          value={grossBudgetValue ? maskCurrency(Number(grossBudgetValue)) : ''}
                          onChange={(e) => setGrossBudgetValue(unmaskCurrency(e.target.value).toString())}
                          placeholder="0,00"
                          className="bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-xs h-8 border-slate-200 focus:border-primary transition-all rounded-lg focus:ring-4 focus:ring-primary/10 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-950 focus:text-slate-950 dark:focus:text-white"
                        />
                        <p className="text-[8px] text-muted-foreground dark:text-slate-500 italic">* Bruto do pedido.</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-muted-foreground dark:text-slate-400">Nº do Pedido</Label>
                        <Input 
                          disabled={!isEditable}
                          value={orderNumber}
                          onChange={(e) => setOrderNumber(e.target.value)}
                          placeholder="Ex: 9414"
                          className="bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-xs h-8 border-slate-200 focus:border-primary transition-all rounded-lg focus:ring-4 focus:ring-primary/10 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-950 focus:text-slate-950 dark:focus:text-white"
                        />
                        <p className="text-[8px] text-muted-foreground dark:text-slate-500 italic">* Extraído.</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-muted-foreground dark:text-slate-400">Data do Pedido</Label>
                        <Input 
                          type="date"
                          disabled={!isEditable}
                          value={orderDate}
                          onChange={(e) => setOrderDate(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-xs h-8 border-slate-200 focus:border-primary transition-all rounded-lg focus:ring-4 focus:ring-primary/10 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-950 focus:text-slate-950 dark:focus:text-white"
                        />
                        <p className="text-[8px] text-muted-foreground dark:text-slate-500 italic">* Geração.</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-muted-foreground dark:text-slate-450">Data de Entrega</Label>
                        <Input 
                          type="date"
                          disabled={!isEditable}
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-xs h-8 border-slate-200 focus:border-primary transition-all rounded-lg focus:ring-4 focus:ring-primary/10 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-950 focus:text-slate-950 dark:focus:text-white"
                        />
                        <p className="text-[8px] text-muted-foreground dark:text-slate-500 italic">* Limite.</p>
                      </div>
                    </div>
                  </div>

                  {/* Resumo Financeiro & Comissão do Indicador */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col gap-3 justify-center shadow-sm shrink-0">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left: Commissionable Total */}
                      <div className="border-r border-slate-100 pr-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] font-bold uppercase text-muted-foreground/60 tracking-tight">Produtos Comissionáveis</span>
                          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-100 font-bold text-[7px] h-3 px-1 uppercase leading-none">Base</Badge>
                        </div>
                        <div className="text-sm font-bold italic text-slate-600 tracking-tighter">
                          {isInternalIndicator ? "Isento (Interno)" : maskCurrency(totalCommissionable)}
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
                        ) : (isAdmin || isManager || isTriagem) ? (
                          <>
                            <div className="flex items-center gap-1 mb-1 justify-between">
                              <span className="text-[8px] font-bold uppercase text-primary tracking-tight">Comissão</span>
                              <Badge className="bg-primary/10 text-primary border-none text-[8px] h-4 py-0 font-bold px-1.5">{hasExternalSeller ? (activeIndication.commission_rate_applied || 2) : 0}%</Badge>
                            </div>
                            <div className="text-sm font-bold italic text-primary tracking-tighter">
                              {maskCurrency(hasExternalSeller ? (totalCommissionable * ((activeIndication.commission_rate_applied || 2) / 100)) : 0)}
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

                  {/* Vendedor Região (opcional) */}
                  {activeIndication.standard_seller_uid && (
                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex flex-col gap-3 shadow-sm shrink-0">
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
                        <div className="flex gap-3">
                          <span>Tx: <b className="font-semibold text-slate-850">{standardSellerRate}%</b></span>
                          <span>Comissão: <b className="font-semibold text-orange-600">{maskCurrency(standardSellerCommission)}</b></span>
                        </div>
                        <p className="text-[8px] italic max-w-[160px] text-right leading-tight">
                          Incide sobre o valor bruto.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Products Spreadsheet */}
                <div className="lg:col-span-7 flex flex-col bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm h-full min-h-0 w-full">
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <h4 className="text-[10px] font-bold italic uppercase flex items-center gap-2 text-slate-600 dark:text-slate-350">
                      <Package className="h-3.5 w-3.5 text-primary" /> Planilha de Produtos Comissionáveis
                    </h4>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{commissionedProducts.length} itens</span>
                  </div>
                  
                  <div className="flex-1 overflow-auto dark:bg-slate-900 min-h-[320px] lg:min-h-0">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 backdrop-blur-sm z-10">
                        <tr>
                          <th className="px-4 py-1.5 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 w-28">Código</th>
                          <th className="px-4 py-1.5 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">Descrição</th>
                          <th className="px-4 py-1.5 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 w-16">Qtd</th>
                          <th className="px-4 py-1.5 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 w-28">Valor Base (R$)</th>
                          <th className="px-4 py-1.5 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {commissionedProducts.map((prod, index) => (
                          <tr key={prod.uniqueId || `${prod.code || 'item'}-${index}`} className={cn(
                            "hover:bg-muted/10 dark:hover:bg-slate-800/50 transition-colors",
                            prod.is_commissionable === false && "bg-slate-50/50 dark:bg-slate-800/10"
                          )}>
                            <td className="px-4 py-1.5 font-mono text-[10px] font-bold text-primary dark:text-orange-400">
                              <div className="flex items-center gap-1.5">
                                {prod.is_commissionable === false && (
                                  <Badge className="bg-slate-200 hover:bg-slate-200 text-black border-none text-[7px] font-normal uppercase py-0 px-1 shadow-none rounded-sm" title="Item não comissionável">
                                    NC
                                  </Badge>
                                )}
                                {prod.code}
                              </div>
                            </td>
                            <td className="px-4 py-1.5 text-[11px] text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-2 font-medium">
                                {prod.name}
                                {prod.is_commissionable === false && (
                                  <span title="Este item está marcado como NÃO COMISSIONÁVEL no catálogo. Ele não será somado ao valor base da comissão.">
                                    <Info className="h-3 w-3 text-slate-400" />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-1.5">
                              <Input 
                                type="number"
                                disabled={!isEditable}
                                value={prod.quantity}
                                onChange={(e) => handleUpdateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="h-7 py-0 px-1.5 text-[11px] border-transparent focus:border-primary/50 bg-transparent text-slate-900 dark:text-slate-100 disabled:opacity-75 w-12"
                              />
                            </td>
                            <td className="px-4 py-1.5">
                              {isEditable ? (
                                <div className="relative group/base">
                                  <Input 
                                    value={maskCurrency(Number(prod.base_value))}
                                    onChange={(e) => handleUpdateProduct(index, 'base_value', unmaskCurrency(e.target.value))}
                                    className={cn(
                                      "h-7 py-0 px-1.5 text-[11px] border-transparent focus:border-primary/50 bg-transparent text-slate-900 dark:text-slate-100 font-bold transition-all w-24",
                                      prod.is_commissionable === false && "text-red-500 dark:text-red-400",
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
                                </div>
                              ) : (
                                prod.base_value > 0 ? (
                                  <span className={cn(
                                    "px-2 text-[11px] font-bold text-slate-900 dark:text-slate-100",
                                    prod.is_commissionable === false && "text-red-500 dark:text-red-400"
                                  )}>{maskCurrency(Number(prod.base_value))}</span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[7px] font-normal bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-505 border-slate-205">PENDENTE</Badge>
                                  </div>
                                )
                              )}
                            </td>
                            <td className="px-4 py-1.5 text-center">
                              {isEditable && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-red-500 hover:bg-red-500/10"
                                  onClick={() => removeProduct(index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                        
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
                                        .map(p => (
                                          <div 
                                            key={p.id}
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
                </div>
              </div>
            ) : (
              <div className="flex-1 flex gap-6 overflow-hidden">
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  <div className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
                      <h4 className="text-xs font-black italic uppercase flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" /> Linha do Tempo de Atendimento
                      </h4>
                      <Badge variant="outline" className="text-[9px] font-bold uppercase border-primary/20 text-primary">
                        {activeIndication.negotiation_history?.length || 0} Registros
                      </Badge>
                    </div>
                    
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                        {activeIndication.negotiation_history?.slice().reverse().map((entry, idx) => (
                          <div key={idx} className="relative pl-10">
                            <div className={cn(
                              "absolute left-0 w-9 h-9 rounded-full border-2 border-background flex items-center justify-center z-10 shadow-sm",
                              entry.type === 'system' ? "bg-slate-100 text-slate-500" :
                              entry.type === 'note' ? "bg-primary/10 text-primary" :
                              "bg-blue-500 text-white"
                            )}>
                              {entry.type === 'system' ? <LayoutDashboard className="h-4 w-4" /> :
                               entry.type === 'note' ? <MessageSquare className="h-4 w-4" /> :
                               <Clock className="h-4 w-4" />}
                            </div>
                            
                              <div className="bg-white rounded-2xl p-4 border border-border/50 group hover:border-primary/20 transition-colors shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black italic uppercase text-primary tracking-wider">{entry.author_name}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> {format(new Date(entry.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">{entry.content}</p>
                                
                                {entry.attachments && entry.attachments.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                                    {entry.attachments.map((file, fIdx) => (
                                      <div key={fIdx} className="group/item relative">
                                        <div 
                                          className="w-20 h-20 rounded-xl overflow-hidden border border-border bg-muted cursor-pointer hover:border-primary/50 transition-all"
                                          onClick={() => setSelectedImage(file.url)}
                                        >
                                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 opacity-0 group-hover/item:opacity-100 transition-opacity flex gap-1">
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
                                    ))}
                                  </div>
                                )}
                              </div>
                          </div>
                        ))}
                        
                        {!activeIndication.negotiation_history?.length && (
                          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                            <History className="h-12 w-12 mb-4" />
                            <p className="text-sm font-bold uppercase tracking-wider">Nenhum histórico registrado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                  </div>
                </div>

                <div className="w-80 flex flex-col gap-4">
                  <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                    <h4 className="text-xs font-black italic uppercase text-primary flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Novo Acompanhamento
                    </h4>
                    {!canInteract ? (
                      <div className="bg-white/50 border border-orange-200 rounded-xl p-4 text-center">
                        <Info className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase text-orange-600 mb-1">Acesso de Observador</p>
                        <p className="text-[9px] text-muted-foreground leading-tight">Como esta indicação foi feita por um parceiro externo, você pode apenas observar o andamento na sua região.</p>
                      </div>
                    ) : (
                      <>
                        <textarea 
                          value={historyNote}
                          onChange={(e) => setHistoryNote(e.target.value)}
                          placeholder="Descreva o que foi conversado ou realizado..."
                          className="w-full bg-background border border-primary/20 rounded-xl p-3 text-xs min-h-[150px] resize-none focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                        
                        {/* Image Upload Area */}
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 px-4 py-2 bg-background border border-border border-dashed rounded-xl cursor-pointer hover:bg-muted/30 transition-all text-[10px] font-bold uppercase text-muted-foreground">
                            <Camera className="h-4 w-4 text-primary" />
                            <span>Anexar Fotos / Capturas</span>
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
                          
                          {historyImages.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {historyImages.map((img, i) => (
                                <div key={i} className="relative group">
                                  <div className="w-12 h-12 rounded-lg bg-muted border border-border overflow-hidden">
                                    <img src={URL.createObjectURL(img)} alt="preview" className="w-full h-full object-cover" />
                                  </div>
                                  <button 
                                    onClick={() => setHistoryImages(prev => prev.filter((_, idx) => idx !== i))}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-2 w-2" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button 
                          onClick={handleAddHistory}
                          disabled={loading || (!historyNote.trim() && historyImages.length === 0)}
                          className="w-full bg-primary hover:bg-primary/90 text-white font-black italic uppercase text-xs h-12 shadow-lg shadow-primary/20 rounded-xl"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Registrar Histórico <ChevronRight className="ml-2 h-4 w-4" /></>}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-auto p-4 bg-muted/30 rounded-2xl border border-border border-dashed">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed text-center">
                      Os acompanhamentos registrados aqui ficam visíveis para toda a equipe comercial e gestão.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div 
            onPointerDown={(e) => !isMobile && dragControls.start(e)}
            className={cn(
              "bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 gap-2",
              isMobile ? "p-3" : "p-6 cursor-move active:cursor-grabbing group/footer"
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
                canInteract && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button 
                      onClick={handleOpenFinalizeDialog}
                      disabled={loading}
                      className="h-9 px-3 lg:px-6 bg-green-600 hover:bg-green-700 text-white font-bold italic uppercase text-[9px] lg:text-xs tracking-wider shadow-md rounded-lg flex items-center gap-1.5 shrink-0"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{isMobile ? "Faturar" : "Finalizar Faturamento"}</span>
                    </Button>
                    <Button 
                      onClick={handleSaveNegotiation}
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
                )
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
