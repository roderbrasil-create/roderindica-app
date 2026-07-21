import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNegotiation } from '../contexts/NegotiationContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  or,
  doc, 
  getDoc,
  getDocs,
  getDocsFromCache,
  updateDoc, 
  addDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { Indication, IndicationStatus, StockItem, RegisteredProduct, IndicationItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  Clock, 
  ChevronLeft,
  ArrowLeft,
  CheckCircle2, 
  XCircle, 
  FileText, 
  ExternalLink, 
  MessageSquare, 
  MessageCircle,
  DollarSign,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Play,
  Image as ImageIcon,
  Download,
  Loader2,
  Package,
  Search,
  Trash2,
  Eye,
  User,
  UserCheck,
  X,
  Save,
  RotateCw,
  Shield,
  MapPin,
  Printer,
  History,
  FileSearch,
  Pencil,
  FilePlus,
  Upload,
  Camera,
  Headset,
  Mic,
  MicOff,
  GripHorizontal,
  Maximize2,
  Minimize2,
  Undo
} from 'lucide-react';
import { transcribeAudio, generateAISummary, analyzeDetailedBudget, analyzePDFDocument } from '../services/geminiService';
import { notifyManagers, notifyInternalSeller, notifyExternalSeller, createNotification } from '../services/notificationService';
import { notifyClosedOrder } from '../services/emailService';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { HelpTooltip } from '../components/base/HelpTooltip';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatDistanceToNow, isAfter, parseISO, format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { compressImage } from '../lib/imageUtils';
import { maskCurrency, unmaskCurrency } from '../lib/masks';

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
];

export default function Indications() {
  const { profile, isExternalSeller, isInternalSeller, isManager, isAdmin, isTriagem, isRegionalSeller } = useAuth();
  const { 
    openNegotiation, 
    isInvoiceDialogOpen, 
    setIsInvoiceDialogOpen, 
    invoiceIndication: selectedIndication, 
    setInvoiceIndication: setSelectedIndication 
  } = useNegotiation();
  const isPureExternalSeller = isExternalSeller && !isManager && !isAdmin && !isInternalSeller && !isTriagem;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [indications, setIndications] = useState<Indication[]>([]);
  const [registeredProducts, setRegisteredProducts] = useState<RegisteredProduct[]>([]);
  const [userRolesMap, setUserRolesMap] = useState<Record<string, string>>({});

  const getSellerName = (sellerUid: string, sellerName: string) => {
    const seller = externalSellers.find(s => s.uid === sellerUid);
    if (seller?.name) return seller.name;
    if (sellerName && !sellerName.toLowerCase().includes('temp') && !sellerName.includes('@') && !/^\d+$/.test(sellerName)) return sellerName;
    return seller?.email || seller?.phone || sellerName || 'Vendedor Parceiro';
  };

  const getSellerSymbol = (role: string) => {
    if (role === 'manager' || role === 'admin') return '👑';
    if (role === 'vendedor_padrao') return '💼';
    return '🤝';
  };

  const getEffectiveHistory = (ind: Indication | null) => {
    if (!ind) return [];
    const history = ind.negotiation_history || [];
    
    const hasInitial = history.some(e => 
      e.type === 'system' && 
      (e.content.toLowerCase().includes('inicial') || e.content.toLowerCase().includes('solicitação'))
    );
    
    if (!hasInitial && ind.created_at) {
      const itemsList = (ind.items || [])
        .map(i => `${i.quantity}x ${i.product_name}`)
        .join(', ');

      const virtualInitial = {
        id: 'initial_virtual',
        type: 'system' as const,
        author_name: ind.external_seller_name || 'Sistema',
        created_at: ind.created_at,
        content: `Indicação inicial enviada pelo parceiro.\n\nSOLICITAÇÃO: ${itemsList || 'Não especificada'}\n\nDESCRIÇÃO: ${ind.description || 'Sem descrição adicional.'}\n\nMÁQUINA BASE: ${ind.base_machine || 'Não informada'} ${ind.machine_details || ''}`,
        attachments: []
      };
      return [virtualInitial, ...history];
    }
    
    return history;
  };

  const groupHistoryByDate = (history: any[]) => {
    const groups: { [key: string]: any[] } = {};
    history.forEach(entry => {
      try {
        const date = format(new Date(entry.created_at), 'yyyy-MM-dd');
        if (!groups[date]) groups[date] = [];
        groups[date].push(entry);
      } catch (e) {
        if (!groups['no-date']) groups['no-date'] = [];
        groups['no-date'].push(entry);
      }
    });

    return Object.keys(groups).sort().reverse().map(date => ({
      date,
      entries: groups[date].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }));
  };
  const [loading, setLoading] = useState(true);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [externalSellers, setExternalSellers] = useState<{uid: string, name: string, email: string, phone?: string, role?: string}[]>([]);
  const [internalSellers, setInternalSellers] = useState<{uid: string, name: string}[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [internalSellerFilter, setInternalSellerFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [missingBaseFilter, setMissingBaseFilter] = useState(false);
  const [coldFilter, setColdFilter] = useState(false);
  const [budgetFilter, setBudgetFilter] = useState<'all' | 'with_budget'>('all');

  // Missing States restored
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDetails, setCancelDetails] = useState('');
  const [invoiceType, setInvoiceType] = useState<'order' | 'invoice'>('order');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [saleValue, setSaleValue] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('0');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState('none');
  const [autoDeductStock, setAutoDeductStock] = useState(true);
  const [updatingProductName, setUpdatingProductName] = useState('');
  const [newBaseValue, setNewBaseValue] = useState('');
  const [currentIndicatorUid, setCurrentIndicatorUid] = useState('');
  const [readingBudget, setReadingBudget] = useState(false);
  const [isSavingBaseValue, setIsSavingBaseValue] = useState(false);
  const [isLinkingDialogOpen, setIsLinkingDialogOpen] = useState(false);
  const [productBeingLinked, setProductBeingLinked] = useState<{name: string, code: string} | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const handleQuickUpdate = async (id: string, data: any) => {
    try {
      const docRef = doc(db, 'indications', id);
      const prevInd = indications.find(i => i.id === id);
      
      await updateDoc(docRef, {
        ...data,
        updated_at: new Date().toISOString()
      });
      
      // Notify if assigned to internal seller
      if (data.internal_seller_uid && data.internal_seller_uid !== prevInd?.internal_seller_uid) {
        await notifyInternalSeller(
          data.internal_seller_uid,
          'Nova Negociação Atribuída',
          `Você recebeu a negociação de ${prevInd?.client_name || 'um cliente'}.`,
          `/indicacoes`
        );
        
        await notifyManagers(
          'Negociação Atribuída',
          `${profile?.name} atribuiu ${prevInd?.client_name} para ${data.internal_seller_name}.`,
          `/indicacoes`
        );
      }
      
      // Notify if indicator changed
      if (data.external_seller_uid && data.external_seller_uid !== prevInd?.external_seller_uid) {
        await notifyManagers(
          'Indicador Alterado',
          `${profile?.name} alterou o indicador de ${prevInd?.client_name} para ${data.external_seller_name}.`,
          `/indicacoes`
        );
      }

      setIndications(prev => prev.map(ind => ind.id === id ? { ...ind, ...data } : ind));
      toast.success('Alteração realizada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  };

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'missing_base') {
      setStatusFilter('negotiating');
      setMissingBaseFilter(true);
    } else if (filter === 'cold') {
      setStatusFilter('negotiating');
      setColdFilter(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isInvoiceDialogOpen && selectedIndication) {
      setInvoiceType('order');
      setSaleDate(selectedIndication.sale_order_date || selectedIndication.sale_date || new Date().toISOString().split('T')[0]);
      setInvoiceFile(null);
      
      const productSum = (selectedIndication.commissioned_products || []).reduce(
        (acc, curr) => acc + (curr.base_value * curr.quantity), 
        0
      );

      const initialValue = selectedIndication.gross_budget_value 
        ? selectedIndication.gross_budget_value 
        : (productSum > 0 ? productSum : (selectedIndication.base_commission_value || 0));

      setSaleValue(initialValue > 0 ? initialValue.toString() : '');
      setDiscountPercentage('0');
      setHasDiscount(false);
      setSelectedStockItem('none');
      setAutoDeductStock(true);
    }
  }, [isInvoiceDialogOpen, selectedIndication]);

  const [submitting, setSubmitting] = useState(false);


  const handleInvoiceFileUpload = async (file: File) => {
    setInvoiceFile(file);
    try {
      setReadingBudget(true);
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });
      
      const base64 = await base64Promise;
      const result = await analyzeDetailedBudget(base64);
      
      if (result && result.sale_value) {
         setSaleValue(result.sale_value.toString());
         toast.success('Valor detectado no documento!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReadingBudget(false);
    }
  };

  const handleUndoInvoice = async (ind: Indication) => {
    if (!window.confirm(`Deseja realmente estornar o faturamento da venda de "${ind.client_name}"? Isso moverá o status de volta para Negociação, reverterá a baixa de estoque automática e excluirá a comissão vinculada de forma definitiva.`)) return;
    
    try {
      const toastId = toast.loading('Processando estorno/reversão...');
      
      // 1. Delete associated commissions
      const commissionsRef = collection(db, 'commissions');
      const commQuery = query(commissionsRef, where('indication_id', '==', ind.id));
      const commSnap = await getDocs(commQuery);
      for (const docSnap of commSnap.docs) {
        await deleteDoc(doc(db, 'commissions', docSnap.id));
      }

      // 2. Revert associated stock sales
      const stockSalesRef = collection(db, 'stock_sales');
      // Search by indication_id matching the field we are introducing
      let salesQuery = query(stockSalesRef, where('indication_id', '==', ind.id));
      let salesSnap = await getDocs(salesQuery);
      
      // Fallback: search by client_name if indication_id query yielded nothing (for older entries)
      if (salesSnap.empty && ind.client_name) {
        salesQuery = query(stockSalesRef, where('client_name', '==', ind.client_name));
        salesSnap = await getDocs(salesQuery);
      }

      for (const docSnap of salesSnap.docs) {
        const saleData = docSnap.data();
        const stockItemId = saleData.stock_item_id;
        const qtySold = saleData.quantity_sold || 0;

        if (stockItemId && qtySold > 0) {
          // Increment the stock_item quantity back
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
        // Delete the stock sale record
        await deleteDoc(doc(db, 'stock_sales', docSnap.id));
      }

      // 3. Move status of indication back to 'negotiating' and clear sales value/commission variables
      const leadRef = doc(db, 'indications', ind.id);
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
          content: `ESTORNO DE FATURAMENTO: O faturamento foi desfeito por ${profile?.name}. O status retornou para Negociação e as comissões e baixas de estoque foram devidamente revertidas.`
        })
      });

      toast.dismiss(toastId);
      toast.success('Faturamento estornado e retornado para negociação com sucesso!');
    } catch (err: any) {
      console.error("Error reversing invoice:", err);
      toast.error('Erro ao estornar faturamento: ' + err.message);
    }
  };

  const handleFinishSale = async () => {
    if (!selectedIndication) return;
    try {
      setSubmitting(true);

      // 1. Calculate commission based on Business Rules and Indicator Profile
      let commissionRate = 2; // Default rate
      let partnerName = selectedIndication.external_seller_name || 'Indicador';
      let partnerEmail = '';
      let isPartnerCommissionable = true;

      if (selectedIndication.external_seller_uid) {
        try {
          const partnerDoc = await getDoc(doc(db, 'users', selectedIndication.external_seller_uid));
          if (partnerDoc.exists()) {
            const partnerData = partnerDoc.data();
            partnerName = partnerData.name || partnerName;
            partnerEmail = partnerData.email || '';
            const pRole = partnerData.role || 'external_seller';
            if (['admin', 'manager', 'internal_seller', 'triagem', 'financial', 'marketing', 'fiscal', 'vendedor_padrao'].includes(pRole)) {
              isPartnerCommissionable = false;
            }
            if (partnerData.commission_rate !== undefined && partnerData.commission_rate !== null) {
              commissionRate = partnerData.commission_rate;
            }
          }
        } catch (err) {
          console.error("Error fetching partner profile for commission calculations:", err);
        }
      }

      const totalSalesValue = unmaskCurrency(saleValue) || 0;
      const baseValue = totalSalesValue; 
      const discPct = 0;
      const discountAmount = 0;

      const hasExternalSeller = !!selectedIndication.external_seller_uid && isPartnerCommissionable;

      let commissionableValue = 0;
      let finalCommissionValue = 0;
      let finalStandardSellerCommissionValue = 0;

      if (hasExternalSeller) {
        // A comissão do parceiro indicador deve ser calculada sempre somente sobre os produtos comissionaveis, desconsiderando também kits de instalação (código iniciando em 9000).
        commissionableValue = (selectedIndication.commissioned_products || []).reduce(
          (acc, p) => {
            const is9000 = p.code && p.code.trim().startsWith('9000');
            const isCommissionable = p.is_commissionable !== false && !is9000;
            return acc + (isCommissionable ? (p.base_value || 0) * (p.quantity || 0) : 0);
          }, 
          0
        );
        finalCommissionValue = commissionableValue * (commissionRate / 100);

        // When a sale is registered for a standard seller, the commission calculated is on the total sale value.
        if (selectedIndication.standard_seller_uid && selectedIndication.standard_seller_commission_enabled !== false) {
          const standardSellerRate = selectedIndication.standard_seller_commission_rate !== undefined 
            ? selectedIndication.standard_seller_commission_rate 
            : 2;
          finalStandardSellerCommissionValue = totalSalesValue * (standardSellerRate / 100);
        }
      } else {
        // When there is no external seller registered, or only an internal seller is registered, there will be no commission processing for any seller.
        commissionRate = 0;
        commissionableValue = 0;
        finalCommissionValue = 0;
        finalStandardSellerCommissionValue = 0;
      }

      // 2. Resolve retroactive date components
      const [sYear, sMonthStr, sDayStr] = saleDate.split('-').map(Number);
      const saleMonth = sMonthStr;
      const saleYear = sYear;

      const currentDateObj = new Date();
      const currentMonth = currentDateObj.getMonth() + 1;
      const currentYear = currentDateObj.getFullYear();

      // Projeção: próximo mês para faturamento novo, ou mês corrente caso a entrega seja retroativa (já realizada)
      let isRetroactiveDelivery = false;
      const dDateStr = selectedIndication.delivery_date || '';
      if (dDateStr) {
        const dDateObj = new Date(dDateStr + 'T23:59:59');
        if (dDateObj <= currentDateObj) {
          isRetroactiveDelivery = true;
        }
      }

      let commissionMonth: number;
      let commissionYear: number;

      if (isRetroactiveDelivery) {
        commissionMonth = currentMonth;
        commissionYear = currentYear;
      } else {
        let forecastMonth = currentMonth + 1;
        let forecastYear = currentYear;
        if (forecastMonth > 12) {
          forecastMonth = 1;
          forecastYear += 1;
        }
        commissionMonth = forecastMonth;
        commissionYear = forecastYear;
      }

      // 3. Upload Invoice Document to Storage if present
      let fileUrl = '';
      if (invoiceFile) {
        const fileRef = ref(storage, `indications/${selectedIndication.id}/invoices/${invoiceFile.name}`);
        await uploadBytes(fileRef, invoiceFile);
        fileUrl = await getDownloadURL(fileRef);
      }
      
      const leadRef = doc(db, 'indications', selectedIndication.id);
      const updateData: any = {
        status: 'sold',
        sale_value: totalSalesValue,
        discount_percentage: discPct,
        discount_amount: discountAmount,
        commission_value: finalCommissionValue,
        commission_rate_applied: commissionRate,
        commissionable_value: commissionableValue,
        standard_seller_commission_value: finalStandardSellerCommissionValue,
        sale_date: saleDate, // Store the physical retroactive date of the sale
        updated_at: new Date().toISOString(),
        negotiation_history: arrayUnion({
          id: Math.random().toString(36).substring(2, 11),
          type: 'status_change',
          author_name: profile?.name || 'Sistema',
          created_at: new Date().toISOString(),
          content: hasExternalSeller 
            ? `VENDA FINALIZADA! Data do Pedido: ${saleDate.split('-').reverse().join('/')}. Comissão de ${commissionRate}% aplicada sobre o valor de produtos comissionáveis de R$ ${commissionableValue.toLocaleString('pt-BR')}.` + (invoiceFile ? ' Documento de faturamento anexado.' : '')
            : `VENDA FINALIZADA! Data do Pedido: ${saleDate.split('-').reverse().join('/')}. Venda finalizada sem processamento de comissão (sem parceiro indicador cadastrado).` + (invoiceFile ? ' Documento de faturamento anexado.' : ''),
          attachments: invoiceFile ? [{ name: invoiceFile.name, url: fileUrl }] : []
        })
      };

      // Replace the indicated items/equipment with the actual sold products inside commissioned_products
      const commissionedProducts = selectedIndication.commissioned_products || [];
      if (commissionedProducts.length > 0) {
        const newItems: IndicationItem[] = commissionedProducts.map((p: any) => ({
          product_name: p.name,
          quantity: p.quantity,
          price: p.base_value || 0,
          code: p.code || ""
        }));
        updateData.items = newItems;

        // Auto-detect is_installation, is_hydraulic, with_freight flags from final sold products
        const hasInstallation = commissionedProducts.some((p: any) => 
          /instalacao|instalação|montagem|entrega/i.test(p.name || "")
        );
        const hasHydraulicKit = commissionedProducts.some((p: any) => 
          /kit|hidraulico|hidráulico|funcao|função|valvula|válvula/i.test(p.name || "") || (p.code && p.code.trim().startsWith('9000'))
        );
        const hasFreight = commissionedProducts.some((p: any) => 
          /frete|transporte|deslocamento/i.test(p.name || "")
        );

        const currentOptions = selectedIndication.options || { complete_installation: false, kit_hydraulic: false, with_freight: false };
        updateData.options = {
          complete_installation: currentOptions.complete_installation || hasInstallation,
          kit_hydraulic: currentOptions.kit_hydraulic || hasHydraulicKit,
          with_freight: currentOptions.with_freight || hasFreight
        };

        // If coupling/base machine of original indication is empty, undefined or "A DEFINIR", update to the main product sold
        if (!selectedIndication.base_machine || selectedIndication.base_machine === "A DEFINIR" || selectedIndication.base_machine.trim() === "") {
          const firstNonKitProduct = commissionedProducts.find((p: any) => {
            const is9000 = p.code && p.code.trim().startsWith('9000');
            const isService = /instalacao|instalação|montagem|entrega|frete|transporte/i.test(p.name || "");
            return !is9000 && !isService;
          }) || commissionedProducts[0];

          if (firstNonKitProduct) {
            updateData.base_machine = firstNonKitProduct.name;
          }
        }
      }

      if (fileUrl) {
        updateData.invoice_url = fileUrl;
      }

      // 4. Update Stock items automatically (Deduct from Stock)
      if (autoDeductStock && selectedIndication.commissioned_products && selectedIndication.commissioned_products.length > 0) {
        for (const p of selectedIndication.commissioned_products) {
          const match = stockItems.find(item => item.code.trim() === p.code.trim());
          if (match && match.quantity > 0) {
            const deductQty = Math.min(match.quantity, p.quantity);
            if (deductQty > 0) {
              // Create stock sale record
              const saleRef = doc(collection(db, 'stock_sales'));
              await addDoc(collection(db, 'stock_sales'), {
                indication_id: selectedIndication.id,
                stock_item_id: match.id,
                item_description: match.description,
                item_code: match.code,
                quantity_sold: deductQty,
                seller_uid: profile?.uid || '',
                seller_name: profile?.name || 'Sistema',
                client_name: selectedIndication.client_name || '',
                client_cnpj: selectedIndication.client_cnpj || '',
                observation: `Baixa automática de faturamento (Pedido #${selectedIndication.sale_order_number || ''})`,
                branch: match.branch || 'matriz',
                created_at: new Date().toISOString()
              });

              // Update stock item quantity
              const itemRef = doc(db, 'stock_items', match.id);
              await updateDoc(itemRef, {
                quantity: match.quantity - deductQty,
                updated_at: new Date().toISOString()
              });
              
              toast.success(`Estoque do item ${match.code} baixado em ${deductQty} unidades!`);
            }
          }
        }
      } else if (!autoDeductStock && selectedStockItem !== 'none') {
        const stockRef = doc(db, 'stock_items', selectedStockItem);
        const stockSnap = await getDoc(stockRef);
        if (stockSnap.exists() && stockSnap.data().quantity > 0) {
          const match = { id: stockSnap.id, ...stockSnap.data() } as StockItem;
          // Create stock sale record
          await addDoc(collection(db, 'stock_sales'), {
            indication_id: selectedIndication.id,
            stock_item_id: match.id,
            item_description: match.description,
            item_code: match.code,
            quantity_sold: 1,
            seller_uid: profile?.uid || '',
            seller_name: profile?.name || 'Sistema',
            client_name: selectedIndication.client_name || '',
            client_cnpj: selectedIndication.client_cnpj || '',
            observation: `Baixa manual via finalização de faturamento (Pedido #${selectedIndication.sale_order_number || ''})`,
            branch: match.branch || 'matriz',
            created_at: new Date().toISOString()
          });

          await updateDoc(stockRef, {
            quantity: match.quantity - 1,
            updated_at: new Date().toISOString()
          });
          
          toast.success(`Baixa manual concluída para ${match.code}`);
        }
      }

      // 5. Update Indication Document
      await updateDoc(leadRef, updateData);

      // 6. Create Commission Document in the commissions collection
      if (selectedIndication.external_seller_uid && isPartnerCommissionable) {
        const commissionDocData = {
          indication_id: selectedIndication.id,
          external_seller_uid: selectedIndication.external_seller_uid,
          external_seller_name: partnerName,
          value: finalCommissionValue,
          base_value_used: commissionableValue,
          discount_applied: discountAmount,
          discount_percentage: discPct,
          rate_applied: commissionRate,
          status: 'waiting_nf', // Initial status is waiting for NF
          month: commissionMonth,
          year: commissionYear,
          sale_date: saleDate, // Keep track of the actual sale date
          created_at: new Date().toISOString()
        };
        await addDoc(collection(db, 'commissions'), commissionDocData);
      }

      // Notify Indicator and Managers
      if (selectedIndication.external_seller_uid && isPartnerCommissionable) {
        await notifyExternalSeller(
          selectedIndication.external_seller_uid,
          'Venda Finalizada! 🚀',
          `A negociação com ${selectedIndication.client_name} foi concluída com sucesso! Parabéns!`,
          `/indicacoes`
        );

        // Notify partner via email of status change (sold)
        try {
          const userSnap = await getDoc(doc(db, 'users', selectedIndication.external_seller_uid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.email) {
              const { notifyStatusChange } = await import('../services/emailService');
              await notifyStatusChange(
                { ...selectedIndication, status: 'sold' },
                userData.email,
                userData.name || 'Parceiro',
                selectedIndication.internal_seller_name || profile?.name
              );
            }
          }
        } catch (emailErr) {
          console.error("Error sending sold email to partner:", emailErr);
        }
      }
      
      await notifyManagers(
        'Venda Realizada',
        `${profile?.name} finalizou a venda de ${selectedIndication.client_name}. Valor: ${maskCurrency(unmaskCurrency(saleValue))}`,
        `/indicacoes`,
        'success'
      );

      // Notify via email for closed order
      try {
        await notifyClosedOrder({
          indication: selectedIndication,
          sellerName: profile?.name || 'Vendedor Interno',
          sellerEmail: profile?.email || '',
          saleValue: totalSalesValue,
          saleDate: saleDate
        });
      } catch (emailErr) {
        console.error("Error sending order closed email notification:", emailErr);
      }

      toast.success('Congratulations on the sale! 🎉 Venda finalizada com sucesso!');
      setIsInvoiceDialogOpen(false);
      setInvoiceFile(null);
    } catch (error: any) {
      toast.error('Erro ao finalizar venda: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLead = async () => {
    if (!selectedIndication || !cancelReason || !cancelDetails) return;
    try {
      setSubmitting(true);
      const leadRef = doc(db, 'indications', selectedIndication.id);
      await updateDoc(leadRef, {
        status: 'cancelled',
        cancellation_reason: cancelReason,
        cancellation_details: cancelDetails,
        updated_at: new Date().toISOString(),
        negotiation_history: arrayUnion({
          id: Math.random().toString(36).substring(2, 11),
          type: 'status_change',
          author_name: profile?.name || 'Sistema',
          created_at: new Date().toISOString(),
          content: `Lead Cancelado: ${cancelReason}. Detalhes: ${cancelDetails}`,
          attachments: []
        })
      });

      // Notify Indicator and Managers
      if (selectedIndication.external_seller_uid) {
        await createNotification({
          user_uid: selectedIndication.external_seller_uid,
          title: 'Indicação Cancelada',
          message: `A negociação com ${selectedIndication.client_name} foi cancelada. Motivo: ${cancelReason}`,
          type: 'warning',
          link: `/indicacoes`
        });

        // Notify partner via email of status change (cancelled)
        try {
          const userSnap = await getDoc(doc(db, 'users', selectedIndication.external_seller_uid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.email) {
              const { notifyStatusChange } = await import('../services/emailService');
              await notifyStatusChange(
                { ...selectedIndication, status: 'cancelled' },
                userData.email,
                userData.name || 'Parceiro',
                selectedIndication.internal_seller_name || profile?.name
              );
            }
          }
        } catch (emailErr) {
          console.error("Error sending cancellation email to partner:", emailErr);
        }
      }

      await notifyManagers(
        'Lead Cancelado',
        `${profile?.name} cancelou o lead de ${selectedIndication.client_name}. Motivo: ${cancelReason}`,
        `/indicacoes`,
        'warning'
      );

      toast.success('Lead cancelado com sucesso.');
      setIsCancelDialogOpen(false);
      setCancelReason('');
      setCancelDetails('');
    } catch (error: any) {
      toast.error('Erro ao cancelar: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIndication = async () => {
    if (!selectedIndication) return;
    try {
      setDeleting(true);
      const indicationId = selectedIndication.id;
      setIsDeleteDialogOpen(false);
      
      // Delay deletion slightly so the dialog closing transitions can settle
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      await deleteDoc(doc(db, 'indications', indicationId));
      toast.success('Indicação excluída permanentemente de todos os registros.');
    } catch (error: any) {
      toast.error('Erro ao excluir indicação: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };


  useEffect(() => {
    const fetchRegisteredProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'registered_products'));
        setRegisteredProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegisteredProduct)));
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchRegisteredProducts();

    const unsubscribeStock = onSnapshot(collection(db, 'stock_items'), (snapshot) => {
      setStockItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem)));
    });

    const fetchExternalSellers = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', 'in', ['external_seller', 'vendedor_padrao', 'manager']));
        const snapshot = await getDocs(q);
        const sellersList = snapshot.docs.map(d => ({ 
          uid: d.id, 
          name: d.data().name || 'Sem Nome',
          email: d.data().email || '',
          phone: d.data().phone || '',
          role: d.data().role || 'external_seller'
        }));
        sellersList.sort((a, b) => a.name.localeCompare(b.name));
        setExternalSellers(sellersList);
      } catch (err) {
        console.error("Error fetching external sellers:", err);
      }
    };
    fetchExternalSellers();

    const fetchUserRoles = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const roles: Record<string, string> = {};
        snap.docs.forEach(d => {
          roles[d.id] = d.data().role || 'external_seller';
        });
        setUserRolesMap(roles);
      } catch (err) {
        console.error("Error fetching user roles for Indications:", err);
      }
    };
    fetchUserRoles();

    const fetchInternalSellers = async () => {
      try {
        const q = query(collection(db, 'users'), where('profile', '==', 'internal_seller'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        setInternalSellers(snapshot.docs.map(d => ({ 
          uid: d.id, 
          name: d.data().name || 'Sem Nome'
        })));
      } catch (err) {
        console.error("Error fetching internal sellers:", err);
      }
    };
    fetchInternalSellers();

    return () => {
      unsubscribeStock();
    };
  }, []);

  useEffect(() => {
    if (!profile) return;

    const indicationsRef = collection(db, 'indications');
    let q;

    if (isAdmin || isManager) {
      // Admins and Managers see everything
      q = query(indicationsRef);
    } else if (profile?.role === 'financial') {
      // Financial team only sees sold (faturados) leads
      q = query(indicationsRef, where('status', '==', 'sold'));
    } else {
      // Combine filters based on user roles
      const queryFilters: any[] = [];
      
      if (isExternalSeller) {
        queryFilters.push(where('external_seller_uid', '==', profile.uid));
        if (profile.email) {
          queryFilters.push(where('external_seller_email', '==', profile.email.toLowerCase()));
        }
      }
      
      if (isRegionalSeller) {
        queryFilters.push(where('standard_seller_uid', '==', profile.uid));
      }
      
      if (isInternalSeller) {
        queryFilters.push(where('internal_seller_uid', '==', profile.uid));
        if (profile.email) {
          queryFilters.push(where('internal_seller_email', '==', profile.email.toLowerCase()));
        }
        if (profile.name) {
          queryFilters.push(where('internal_seller_name', '==', profile.name));
        }
      }
      
      if (isTriagem) {
        queryFilters.push(where('status', '==', 'pending'));
        queryFilters.push(where('status', '==', 'triagem'));
      }

      if (queryFilters.length > 0) {
        q = query(indicationsRef, or(...queryFilters));
      } else {
        // Fallback for unexpected cases
        q = query(indicationsRef, limit(100));
      }
    }

    const processSnapshot = (snapshot: any, isFromCache = false) => {
      const data = snapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() } as Indication))
        .filter((ind: any) => !ind.is_deleted);
        
      data.sort((a: any, b: any) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
      
      setIndications(prev => {
        // When loading from cache then live, merge and avoid duplicates
        if (isFromCache) return data;
        const existingIds = new Set(data.map(i => i.id));
        const keptFromPrev = prev.filter(p => !existingIds.has(p.id));
        const merged = [...data, ...keptFromPrev];
        merged.sort((a: any, b: any) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        return merged;
      });
      setLoading(false);
    };

    // Proactive Local Loading: Try cache first (User decentralized vision)
    getDocsFromCache(q).then(snapshot => {
      if (!snapshot.empty) {
        console.log("Proactive cache load successful");
        processSnapshot(snapshot, true);
      }
    }).catch(() => {
      // Ignore cache errors on proactive load
    });

    const unsubscribe = onSnapshot(q, (snapshot) => {
      processSnapshot(snapshot);
    }, (error) => {
      console.error("Error in indications snapshot:", error);
      
      // Fallback 1: Try cache if quota exceeded or offline
      if (error.message.includes('quota') || error.message.includes('Quota')) {
        toast.warning("Limite de cotas atingido. Exibindo dados salvos no seu computador.", {
          duration: 10000
        });
        getDocsFromCache(q).then(processSnapshot).catch(err => {
          console.error("Cache fetch failed:", err);
          setLoading(false);
        });
        return;
      }

      // Fallback 2: if OR query fails due to missing index, try a simpler query
      if (isInternalSeller && error.message.includes('index')) {
        const fallbackQuery = query(
          collection(db, 'indications'),
          where('internal_seller_uid', '==', profile.uid)
        );
        onSnapshot(fallbackQuery, processSnapshot);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [profile?.uid, profile?.role, isInternalSeller, isExternalSeller, isManager, isAdmin, isTriagem, isRegionalSeller]);

  const [activeTab, setActiveTab] = useState<'novos' | 'andamento' | 'vendidos' | 'cancelados' | 'perdidos'>('andamento');

  // Check for expired leads with a throttled approach
  const lastCheckRef = useRef<number>(0);
  useEffect(() => {
    if (indications.length === 0) return;
    
    // Only check every 5 minutes to avoid hitting write limits during rapid updates
    const now = Date.now();
    if (now - lastCheckRef.current < 5 * 60 * 1000) return;
    lastCheckRef.current = now;

    const checkExpirations = async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60);

      const expiredLeads = indications.filter(ind => 
        ind.status === 'negotiating' && 
        ind.budget_sent_at && 
        new Date(ind.budget_sent_at) < thirtyDaysAgo
      );

      for (const lead of expiredLeads) {
        try {
          const leadRef = doc(db, 'indications', lead.id);
          await updateDoc(leadRef, {
            status: 'cancelled',
            cancellation_reason: 'Prazo expirado',
            cancellation_details: 'Lead cancelado automaticamente após 60 dias de validade da proposta.',
            updated_at: new Date().toISOString(),
            negotiation_history: arrayUnion({
              id: Math.random().toString(36).substring(2, 11),
              type: 'status_change',
              author_name: 'Sistema',
              created_at: new Date().toISOString(),
              content: 'Cancelamento automático: Proposta expirou após 60 dias.',
              attachments: []
            })
          });
          
          await addDoc(collection(db, 'notifications'), {
            user_uid: lead.internal_seller_uid,
            title: 'Lead Expirado',
            message: `A negociação com ${lead.client_name} expirou após 60 dias.`,
            type: 'warning',
            read: false,
            link: '/indicacoes',
            created_at: new Date().toISOString()
          });
        } catch (err) {
          console.error("Error auto-cancelling lead:", err);
        }
      }
    };

    checkExpirations();
  }, [indications.length]);

  useEffect(() => {
    if (isInternalSeller || isManager || isAdmin || isTriagem) {
      setActiveTab('andamento');
    }
  }, [isInternalSeller, isManager, isAdmin, isTriagem]);

  useEffect(() => {
    setBudgetFilter('all');
  }, [activeTab]);

  const filteredIndications = indications.filter(ind => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = ind.client_name.toLowerCase().includes(searchLower) || 
                          ind.base_machine.toLowerCase().includes(searchLower) ||
                          ind.external_seller_name?.toLowerCase().includes(searchLower) ||
                          ind.items?.some(i => i.product_name.toLowerCase().includes(searchLower));

    if (profile?.role === 'financial') {
      return matchesSearch && ind.status === 'sold';
    }

    const matchesStatus = statusFilter === 'all' || 
                        (statusFilter === 'negotiating' && (ind.status === 'negotiating' || ind.status === 'pending' || ind.status === 'triagem')) ||
                        ind.status === statusFilter;
    
    // Check search term matches
    if (!matchesSearch) return false;

    // Check status matches based on the active tab (PRIMARY FILTER)
    if (activeTab === 'andamento') {
      if (ind.status !== 'pending' && ind.status !== 'triagem' && ind.status !== 'negotiating') return false;
    } else if (activeTab === 'vendidos') {
      if (ind.status !== 'sold') return false;
    } else if (activeTab === 'cancelados') {
      if (ind.status !== 'cancelled') return false;
    } else if (activeTab === 'perdidos') {
      if (ind.status !== 'archived') return false;
    }

    if (budgetFilter === 'with_budget') {
      const hasBudget = ind.budget_loaded || ind.gross_budget_value > 0 || ind.budget_pdf_url || (ind.budget_pdf_urls && ind.budget_pdf_urls.length > 0) || ind.budget_number;
      if (!hasBudget) return false;
    }
    
    // Internal seller ownership logic
    if (isInternalSeller && !isPureExternalSeller && !isManager && !isAdmin) {
      const isOwnerByUid = ind.internal_seller_uid === profile?.uid;
      const isOwnerByName = ind.internal_seller_name && profile?.name && 
                           ind.internal_seller_name.toLowerCase().trim() === profile.name.toLowerCase().trim();
      const isOwnerByEmail = ind.internal_seller_email && profile?.email &&
                            ind.internal_seller_email.toLowerCase().trim() === profile.email.toLowerCase().trim();
      if (!isOwnerByUid && !isOwnerByName && !isOwnerByEmail) return false;
    }

    if (isPureExternalSeller) {
      if (ind.source === 'fair' && ind.lead_type && ind.lead_type !== 'client') return false;
      return !ind.is_deleted;
    }

    // Dropdown filters (SECONDARY FILTERS - only apply if not 'all')
    const matchesInternalSeller = internalSellerFilter === 'all' || ind.internal_seller_name?.includes(internalSellerFilter);
    if (!matchesInternalSeller) return false;
    if (statusFilter !== 'all' && !matchesStatus) return false;

    // Conforme conversamos, cadastros em feiras que não são clientes não devem aparecer no Centro de Negócios
    if (ind.source === 'fair' && ind.lead_type && ind.lead_type !== 'client') return false;
    
    let matchesMissingBase = true;
    if (missingBaseFilter && (isManager || isInternalSeller || isAdmin || isTriagem)) {
      const isInternalR = ind.external_seller_uid && userRolesMap[ind.external_seller_uid] && userRolesMap[ind.external_seller_uid] !== 'external_seller';
      matchesMissingBase = !isInternalR && ind.status === 'negotiating' && (!ind.base_commission_value || ind.base_commission_value <= 0);
    }

    let matchesCold = true;
    if (coldFilter) {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      matchesCold = ind.status === 'negotiating' && isAfter(fiveDaysAgo, parseISO(ind.updated_at || ind.created_at));
    }
    
    return matchesStatus && matchesInternalSeller && matchesSearch && matchesMissingBase && matchesCold && !ind.is_deleted;
  });

  const missingBaseIndicationsCount = indications.filter(
    i => {
      if (!i || i.is_deleted || i.status !== 'negotiating') return false;
      const isInternalR = i.external_seller_uid && userRolesMap[i.external_seller_uid] && userRolesMap[i.external_seller_uid] !== 'external_seller';
      if (isInternalR) return false;
      return !i.base_commission_value || i.base_commission_value <= 0;
    }
  ).length;

  const getGroupedReferralsByMonth = () => {
    const partnerReferrals = indications.filter(ind => {
      if (ind.is_deleted) return false;
      const isOwnerByUid = ind.external_seller_uid === profile?.uid;
      const matchesOwner = isOwnerByUid;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
                            ind.client_name.toLowerCase().includes(searchLower) || 
                            ind.base_machine.toLowerCase().includes(searchLower) ||
                            ind.items?.some(i => i.product_name.toLowerCase().includes(searchLower));

      const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'negotiating' && (ind.status === 'negotiating' || ind.status === 'pending' || ind.status === 'triagem')) ||
                          ind.status === statusFilter;

      return matchesOwner && matchesSearch && matchesStatus;
    });

    const groups: Record<string, { label: string; year: number; monthVal: number; items: Indication[] }> = {};
    
    partnerReferrals.forEach(ind => {
      const date = ind.created_at ? new Date(ind.created_at) : new Date();
      const year = date.getFullYear();
      const monthVal = date.getMonth() + 1;
      const key = `${year}-${monthVal}`;
      const monthLabel = months.find(m => m.value === monthVal)?.label || 'Outro';

      if (!groups[key]) {
        groups[key] = {
          label: `${monthLabel} de ${year}`,
          year,
          monthVal,
          items: []
        };
      }
      groups[key].items.push(ind);
    });

    return Object.values(groups).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthVal - a.monthVal;
    });
  };

  if (profile?.role === 'financial') {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="h-8 w-8"
              id="financial-back-btn"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight" id="financial-title">
                  Faturamento e Vendas
                </h1>
                <HelpTooltip content="Relatório de faturamento e vendas consolidadas da Roder Brasil." />
              </div>
              <p className="text-muted-foreground text-xs md:text-sm">
                Acompanhe relatórios das vendas finalizadas. O acesso a negociações em andamento, perdidas ou canceladas é restrito.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="financial-search-input"
                placeholder="Buscar por cliente, máquina ou indicador..." 
                className="pl-10 pr-10 bg-card border-border text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredIndications.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-border text-muted-foreground text-xs">
                Nenhuma venda finalizada encontrada com os filtros aplicados.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-border" id="financial-sales-table">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-[10px] sm:text-[11px] font-black uppercase text-slate-500">
                        <th className="p-3 border-r border-border text-center w-[12%]">Data do Pedido</th>
                        <th className="p-3 border-r border-border text-center w-[12%]">Nº do Pedido</th>
                        <th className="p-3 border-r border-border w-[22%]">Cliente</th>
                        <th className="p-3 border-r border-border w-[18%] font-black text-slate-600">Parceiro Indicador</th>
                        <th className="p-3 border-r border-border w-[18%]">Equipamento Vendido</th>
                        <th className="p-3 border-r border-border text-right w-[12%]">Valor Total</th>
                        <th className="p-3 border-r border-border text-center w-[12%]">Previsão Entrega</th>
                        <th className="p-3 text-center w-[8%]">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs text-foreground font-medium">
                      {filteredIndications.map((ind) => {
                        return (
                          <tr key={ind.id} className="hover:bg-muted/30 transition-colors">
                            {/* Data do Pedido */}
                            <td className="p-3 border-r border border-border text-center font-mono select-none">
                              {ind.created_at ? new Date(ind.created_at).toLocaleDateString('pt-BR') : '-'}
                            </td>
                            {/* Nº do Pedido */}
                            <td className="p-3 border-r border border-border text-center font-bold font-mono">
                              {ind.sale_order_number || 'PED-S/N'}
                            </td>
                            {/* Cliente */}
                            <td className="p-3 border-r border border-border font-bold uppercase truncate max-w-[150px]">
                              {ind.client_name}
                            </td>
                            {/* Parceiro Indicador */}
                            <td className="p-3 border-r border border-border font-medium text-slate-700 dark:text-slate-300">
                              {ind.external_seller_name || 'Venda Direta'}
                            </td>
                            {/* Equipamento Vendido */}
                            <td className="p-3 border-r border border-border italic text-slate-600 dark:text-slate-300">
                              {ind.base_machine || (ind.items && ind.items[0]?.product_name) || 'CMF 600'}
                            </td>
                            {/* Valor Total */}
                            <td className="p-3 border-r border border-border text-right font-black text-slate-700 dark:text-slate-200 font-mono">
                              R$ {(ind.sale_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            {/* Previsão de Entrega */}
                            <td className="p-3 border-r border border-border text-center font-mono text-muted-foreground select-none">
                              {ind.delivery_date ? ind.delivery_date.split('-').reverse().join('/') : 'Não cadastrada'}
                            </td>
                            {/* Ações */}
                            <td className="p-3 border border-border text-center">
                              <Button
                                id={`btn-acompanhar-${ind.id}`}
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedIndication(ind);
                                  setIsInvoiceDialogOpen(true);
                                }}
                                className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-bold text-[10px] uppercase h-7 px-2.5 rounded"
                              >
                                Acompanhar
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice / Sales Order Dialog for Finance tracking details */}
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl md:p-6 lg:p-8 p-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-primary flex items-center gap-2">
                <FileText className="h-5 w-5" /> Detalhes do Pedido de Venda
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Dados do fechamento salvos para <strong>{selectedIndication?.client_name}</strong>.
              </DialogDescription>
            </DialogHeader>

            {selectedIndication && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-border pb-4">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">Nº do Pedido</span>
                    <span className="font-black text-sm text-foreground">{selectedIndication.sale_order_number || 'Sem Número'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">Valor Total</span>
                    <span className="font-black text-sm text-primary">R$ {(selectedIndication.sale_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block text-center md:text-left">Previsão de Entrega</span>
                    <span className="font-medium text-xs text-foreground block text-center md:text-left font-mono">
                      {selectedIndication.delivery_date ? selectedIndication.delivery_date.split('-').reverse().join('/') : 'Não cadastrada'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-border">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Informações de Envio e Logística</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase">Prazo de Entrega</span>
                        <span className="font-bold text-foreground">{(selectedIndication as any).delivery_term_days ? `${(selectedIndication as any).delivery_term_days} dias` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase">Frete CIF/FOB</span>
                        <span className="font-bold text-foreground">{(selectedIndication as any).shipping_type || 'FOB'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Parceiro Indicador</h4>
                    <div className="text-xs">
                      <span className="text-muted-foreground block text-[9px] uppercase">Nome</span>
                      <span className="font-bold text-foreground">{selectedIndication.external_seller_name || 'Sem Indicador / Canal Direto'}</span>
                    </div>
                  </div>
                </div>

                {selectedIndication.items && selectedIndication.items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Itens do Pedido</h4>
                    <div className="overflow-hidden rounded-lg border border-border">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-muted/40 text-[9px] font-mono uppercase text-muted-foreground border-b border-border">
                            <th className="p-2">Equipamento / Produto</th>
                            <th className="p-2 text-center">Quantidade</th>
                            <th className="p-2 text-right">Preço</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {selectedIndication.items.map((item, id) => (
                            <tr key={id}>
                              <td className="p-2 font-bold">{item.product_name}</td>
                              <td className="p-2 text-center font-mono">{item.quantity}</td>
                              <td className="p-2 text-right font-mono text-emerald-600 dark:text-emerald-400">R$ {item.price ? item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setIsInvoiceDialogOpen(false)} className="bg-primary text-xs uppercase tracking-wider font-extrabold h-9">
                Fechar Detalhes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="h-8 w-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {isExternalSeller && !isInternalSeller ? 'Minhas Indicações' : 'Central de Negócios'}
              </h1>
              <HelpTooltip content="Central de acompanhamento e gestão de todas as indicações enviadas para a Roder." />
            </div>
            <p className="text-muted-foreground">
              {isExternalSeller && !isInternalSeller 
                ? 'Acompanhe suas indicações e o progresso das negociações.' 
                : 'Acompanhe e gerencie o ciclo de vida das indicações.'}
            </p>
          </div>
        </div>



        {/* Status Filter Buttons - Top of Dashboard */}
        {(isInternalSeller || isManager || isAdmin || isTriagem) && !isExternalSeller && (() => {
          const isInternalMatch = (i: any) => {
            if (!isInternalSeller || isManager || isAdmin) return true;
            const isOwnerByUid = i.internal_seller_uid === profile?.uid;
            const isOwnerByName = i.internal_seller_name && profile?.name && 
                                 i.internal_seller_name.toLowerCase().trim() === profile.name.toLowerCase().trim();
            const isOwnerByEmail = i.internal_seller_email && profile?.email &&
                                  i.internal_seller_email.toLowerCase().trim() === profile.email.toLowerCase().trim();
            return isOwnerByUid || isOwnerByName || isOwnerByEmail;
          };

          return (
            <div className="flex gap-2 w-full max-w-7xl mx-auto mb-10 overflow-x-auto scrollbar-hide p-1">
              <button 
                onClick={() => setActiveTab('andamento')}
                className={cn(
                  "flex-1 py-3 px-4 text-[10px] md:text-sm font-medium rounded-xl border-2 transition-all flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap shadow-sm",
                  activeTab === 'andamento' ? "bg-white text-primary border-primary" : "bg-slate-100 text-slate-500 border-slate-200 hover:border-primary/50 hover:bg-slate-200 hover:text-primary"
                )}
              >
                <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                Em Andamento
                <Badge variant="secondary" className={cn(
                  "ml-1 h-4 md:h-5 min-w-4 md:min-w-5 flex items-center justify-center p-0 rounded-full text-[9px] md:text-[10px]",
                  activeTab === 'andamento' ? "bg-slate-800 text-white border-none" : "bg-slate-300 text-slate-700 border-none"
                )}>
                  {indications.filter(i => (i.status === 'negotiating' || i.status === 'pending' || i.status === 'triagem') && isInternalMatch(i)).length}
                </Badge>
              </button>
              <button 
                onClick={() => setActiveTab('vendidos')}
                className={cn(
                  "flex-1 py-3 px-4 text-[10px] md:text-sm font-medium rounded-xl border-2 transition-all flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap shadow-sm",
                  activeTab === 'vendidos' ? "bg-white text-primary border-primary" : "bg-slate-100 text-slate-500 border-slate-200 hover:border-primary/50 hover:bg-slate-200 hover:text-primary"
                )}
              >
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                Vendidos
                <Badge variant="secondary" className={cn(
                  "ml-1 h-4 md:h-5 min-w-4 md:min-w-5 flex items-center justify-center p-0 rounded-full text-[9px] md:text-[10px]",
                  activeTab === 'vendidos' ? "bg-slate-800 text-white border-none" : "bg-slate-300 text-slate-700 border-none"
                )}>
                  {indications.filter(i => i.status === 'sold' && isInternalMatch(i)).length}
                </Badge>
              </button>
              <button 
                onClick={() => setActiveTab('perdidos')}
                className={cn(
                  "flex-1 py-3 px-4 text-[10px] md:text-sm font-medium rounded-xl border-2 transition-all flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap shadow-sm",
                  activeTab === 'perdidos' ? "bg-white text-primary border-primary" : "bg-slate-100 text-slate-500 border-slate-200 hover:border-primary/50 hover:bg-slate-200 hover:text-primary"
                )}
              >
                <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                Perdidos
                <Badge variant="secondary" className={cn(
                  "ml-1 h-4 md:h-5 min-w-4 md:min-w-5 flex items-center justify-center p-0 rounded-full text-[9px] md:text-[10px]",
                  activeTab === 'perdidos' ? "bg-slate-800 text-white border-none" : "bg-slate-300 text-slate-700 border-none"
                )}>
                  {indications.filter(i => i.status === 'archived' && isInternalMatch(i)).length}
                </Badge>
              </button>
              <button 
                onClick={() => setActiveTab('cancelados')}
                className={cn(
                  "flex-1 py-3 px-4 text-[10px] md:text-sm font-medium rounded-xl border-2 transition-all flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap shadow-sm",
                  activeTab === 'cancelados' ? "bg-white text-primary border-primary" : "bg-slate-100 text-slate-500 border-slate-200 hover:border-primary/50 hover:bg-slate-200 hover:text-primary"
                )}
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
                Cancelados
                <Badge variant="secondary" className={cn(
                  "ml-1 h-4 md:h-5 min-w-4 md:min-w-5 flex items-center justify-center p-0 rounded-full text-[9px] md:text-[10px]",
                  activeTab === 'cancelados' ? "bg-slate-800 text-white border-none" : "bg-slate-300 text-slate-700 border-none"
                )}>
                  {indications.filter(i => i.status === 'cancelled' && isInternalMatch(i)).length}
                </Badge>
              </button>
            </div>
          );
        })()}

        {/* Sub-filtro Orçamento para as abas Em Andamento e Vendidos */}
        {['andamento', 'vendidos'].includes(activeTab) && (() => {
          const isMatchForUser = (i: any) => {
            if (isPureExternalSeller) {
              return i.external_seller_uid === profile?.uid;
            }
            if (isInternalSeller && !isManager && !isAdmin) {
              const isOwnerByUid = i.internal_seller_uid === profile?.uid;
              const isOwnerByName = i.internal_seller_name && profile?.name && 
                                   i.internal_seller_name.toLowerCase().trim() === profile.name.toLowerCase().trim();
              const isOwnerByEmail = i.internal_seller_email && profile?.email &&
                                    i.internal_seller_email.toLowerCase().trim() === profile.email.toLowerCase().trim();
              return isOwnerByUid || isOwnerByName || isOwnerByEmail;
            }
            return true;
          };

          const totalBudgetCount = indications.filter(i => {
            if (activeTab === 'andamento' && !['pending', 'triagem', 'negotiating'].includes(i.status)) return false;
            if (activeTab === 'vendidos' && i.status !== 'sold') return false;
            if (!isMatchForUser(i)) return false;
            return i.budget_loaded || i.gross_budget_value > 0 || i.budget_pdf_url || (i.budget_pdf_urls && i.budget_pdf_urls.length > 0) || i.budget_number;
          }).length;

          return (
            <div className="flex items-center gap-2 w-full max-w-7xl mx-auto mb-6 px-1 flex-wrap">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mr-2 font-mono">Status do Orçamento:</span>
              <button
                onClick={() => setBudgetFilter('all')}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-extrabold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm uppercase tracking-wide",
                  budgetFilter === 'all' 
                    ? "bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-750" 
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setBudgetFilter('with_budget')}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-extrabold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm uppercase tracking-wide",
                  budgetFilter === 'with_budget' 
                    ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20" 
                    : "bg-card text-orange-500 border-orange-500/20 hover:bg-orange-500/5 select-none"
                )}
              >
                <FileText className="h-4 w-4" />
                Orçamento
                <Badge className={cn(
                  "ml-1 h-5 min-w-5 px-1.5 flex items-center justify-center p-0 rounded-full text-[10px] font-bold border-none",
                  budgetFilter === 'with_budget' ? "bg-white text-orange-600" : "bg-orange-100 text-orange-600"
                )}>
                  {totalBudgetCount}
                </Badge>
              </button>
            </div>
          );
        })()}

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente, máquina ou indicador..." 
              className="pl-10 pr-10 bg-card border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {!isInternalSeller && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Selecionar Status</Label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as IndicationStatus | 'all')}>
                    <SelectTrigger className="w-[180px] bg-card border-border">
                      <SelectValue placeholder="Filtrar Status">
                        {statusFilter === 'all' && 'Todos Status'}
                        {statusFilter === 'negotiating' && 'Em Andamento / Triagem'}
                        {statusFilter === 'sold' && 'Vendidos'}
                        {statusFilter === 'cancelled' && 'Cancelados'}
                        {statusFilter === 'archived' && 'Perdidos / Arquivados'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="negotiating">Em Andamento / Triagem</SelectItem>
                      <SelectItem value="sold">Vendidos</SelectItem>
                      <SelectItem value="cancelled">Cancelados</SelectItem>
                      <SelectItem value="archived">Perdidos / Arquivados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(isManager || isTriagem || isAdmin) && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Selecionar Vendedor</Label>
                    <Select value={internalSellerFilter} onValueChange={setInternalSellerFilter}>
                      <SelectTrigger className="w-[180px] bg-card border-border border-primary/30">
                        <SelectValue placeholder="Vendedor Interno" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="all">Todos Vendedores</SelectItem>
                        <SelectItem value="Heloisa">Heloisa</SelectItem>
                        <SelectItem value="Monali">Monali</SelectItem>
                        <SelectItem value="Yury">Yury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isPureExternalSeller ? (() => {
            const groupedReferrals = getGroupedReferralsByMonth();
            if (groupedReferrals.length === 0) {
              return (
                <div className="text-center py-20 bg-card rounded-xl border border-border text-muted-foreground">
                  Nenhuma indicação encontrada com os filtros aplicados.
                </div>
              );
            }
            return (
              <div className="space-y-8">
                {groupedReferrals.map((group) => (
                  <div key={group.label} className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/65">
                      <Calendar className="h-4.5 w-4.5 text-primary shrink-0" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{group.label}</h3>
                      <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                        {group.items.length} {group.items.length === 1 ? 'indicação' : 'indicações'}
                      </Badge>
                    </div>

                    {/* DESKTOP LAYOUT (MONTH TABLE) */}
                    <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                              <th className="p-4 w-[15%]">Data da Indicação</th>
                              <th className="p-4 w-[25%]">Cliente / Contato</th>
                              <th className="p-4 w-[35%]">Equipamento / Opcionais</th>
                              <th className="p-4 w-[15%]">Status</th>
                              <th className="p-4 text-right pr-6 w-[10%]">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {group.items.map((ind) => (
                              <tr key={ind.id} className="hover:bg-muted/30 transition-colors group">
                                <td className="p-4 align-middle text-xs font-bold text-foreground">
                                  {new Date(ind.created_at).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="p-4 align-middle">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                      {(ind.client_person_name || ind.client_name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 max-w-[220px]">
                                      <h4 className="font-extrabold text-xs text-foreground uppercase tracking-tight" title={ind.client_person_name ? `${ind.client_person_name}${ind.client_name ? ` (${ind.client_name})` : ''}` : ind.client_name || 'Nome não informado'}>
                                        {ind.client_person_name ? (
                                          <div className="flex flex-col">
                                            <span className="font-extrabold text-xs text-foreground uppercase truncate">{ind.client_person_name}</span>
                                            {ind.client_name && ind.client_name.trim() !== '' && (
                                              <span className="text-[10px] text-muted-foreground truncate uppercase font-semibold mt-0.5">
                                                {ind.client_name}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          ind.client_name || 'Nome não informado'
                                        )}
                                      </h4>
                                      {ind.client_phone ? (
                                        <div className="flex items-center gap-1 mt-1 mr-1" onClick={(e) => e.stopPropagation()}>
                                          <a
                                            href={`https://wa.me/${ind.client_phone.replace(/\D/g, '').startsWith('55') ? ind.client_phone.replace(/\D/g, '') : '55' + ind.client_phone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="no-referrer"
                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] transition-all border border-emerald-500/15"
                                            title="Chamar no WhatsApp"
                                          >
                                            <MessageCircle className="h-3 w-3 fill-emerald-500 text-emerald-500 shrink-0" />
                                            <span>{ind.client_phone}</span>
                                          </a>
                                        </div>
                                      ) : (
                                        <p className="text-[10px] text-muted-foreground">Sem fone</p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 align-middle">
                                  <div className="space-y-1">
                                    <p className="text-xs font-black text-foreground uppercase tracking-tight">
                                      {ind.base_machine}
                                    </p>
                                    {ind.items && ind.items.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {ind.items.map((item, idx) => (
                                          <span key={idx} className="text-[9px] font-bold bg-primary/5 text-primary border border-primary/20 px-1 py-0.5 rounded uppercase">
                                            {item.quantity}x {item.product_name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 align-middle">
                                  <Badge variant="outline" className={cn(
                                    "font-bold tracking-wider uppercase text-[8px] h-4.5 px-1.5 shrink-0 block text-center w-fit",
                                    ind.status === 'sold' && "border-green-500/50 text-green-400 bg-green-500/10",
                                    ind.status === 'negotiating' && "border-orange-500/50 text-orange-400 bg-orange-500/10",
                                    ind.status === 'pending' && "border-blue-500/50 text-blue-400 bg-blue-500/10",
                                    ind.status === 'triagem' && "border-purple-500/50 text-purple-400 bg-purple-500/10",
                                    ind.status === 'archived' && "border-yellow-500/50 text-yellow-400 bg-yellow-500/10",
                                    ind.status === 'cancelled' && "border-destructive/50 text-destructive bg-destructive/10"
                                  )}>
                                    {ind.status === 'sold' ? 'Vendido' : 
                                     ind.status === 'negotiating' ? 'Andamento' :
                                     ind.status === 'pending' ? 'Novo' : 
                                     ind.status === 'triagem' ? 'Triagem' :
                                     ind.status === 'archived' ? 'Perdido' : 'Cancelado'}
                                  </Badge>
                                </td>
                                <td className="p-4 align-middle text-right pr-6">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 px-3 text-[10px] font-black uppercase text-primary border-primary/20 hover:bg-primary/10 gap-1.5"
                                      onClick={() => openNegotiation(ind)}
                                    >
                                      <MessageSquare className="h-3.5 w-3.5" />
                                      <span>Acompanhar</span>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* MOBILE LAYOUT (MONTH LIST) */}
                    <div className="block md:hidden space-y-2">
                      {group.items.map((ind) => (
                        <div 
                          key={ind.id} 
                          className={cn(
                            "bg-card border border-border rounded-xl p-3 shadow-xs flex items-center justify-between gap-2 border-l-4 transition-colors",
                            ind.status === 'sold' && "border-l-green-500",
                            ind.status === 'negotiating' && "border-l-orange-500",
                            ind.status === 'pending' && "border-l-blue-500",
                            ind.status === 'triagem' && "border-l-purple-500",
                            ind.status === 'archived' && "border-l-yellow-500",
                            ind.status === 'cancelled' && "border-l-destructive"
                          )}
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-1 leading-none">
                              <span className="font-extrabold text-xs text-foreground uppercase truncate" title={ind.client_person_name ? `${ind.client_person_name}${ind.client_name ? ` (${ind.client_name})` : ''}` : ind.client_name || 'Nome não informado'}>
                                {ind.client_person_name || ind.client_name || 'Nome não informado'}
                              </span>
                              <span className="text-[9px] text-muted-foreground shrink-0 font-medium">
                                {new Date(ind.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            <div className="flex items-center flex-wrap gap-1 leading-none">
                              <span className="text-[12px] font-bold text-foreground bg-primary/5 px-1 rounded truncate max-w-[150px]">
                                {ind.base_machine}
                              </span>
                              
                              <Badge variant="outline" className={cn(
                                "font-bold tracking-tight uppercase text-[7px] h-3.5 px-1 shrink-0",
                                ind.status === 'sold' && "border-green-500/30 text-green-400 bg-green-500/5",
                                ind.status === 'negotiating' && "border-orange-500/30 text-orange-400 bg-orange-500/5",
                                ind.status === 'pending' && "border-blue-500/30 text-blue-400 bg-blue-500/5",
                                ind.status === 'triagem' && "border-purple-500/30 text-purple-400 bg-purple-500/5",
                                ind.status === 'archived' && "border-yellow-500/30 text-yellow-400 bg-yellow-500/5",
                                ind.status === 'cancelled' && "border-destructive/30 text-destructive bg-destructive/5"
                              )}>
                                {ind.status === 'sold' ? 'Vendido' : 
                                 ind.status === 'negotiating' ? 'Andamento' :
                                 ind.status === 'pending' ? 'Novo' : 
                                 ind.status === 'triagem' ? 'Triagem' :
                                 ind.status === 'archived' ? 'Perdido' : 'Cancelado'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button 
                              size="xs" 
                              variant="outline" 
                              className="h-8 w-8 p-0 border-primary/20 hover:bg-primary/10 text-primary"
                              onClick={() => openNegotiation(ind)}
                              title="Acompanhar"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })() : filteredIndications.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl border border-border text-muted-foreground">
              Nenhuma indicação encontrada com os filtros aplicados.
            </div>
          ) : (
            <>
              {/* DESKTOP LAYOUT: Tabular Spreadsheet */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <th className="p-4 w-[12%]">Data / Status</th>
                        <th className="p-4 w-[24%]">Cliente / Contato</th>
                        <th className="p-4 w-[20%]">Indicador / Consultor</th>
                        <th className="p-4 w-[26%]">Equipamento / Opcionais</th>
                        <th className="p-4 w-[10%]">Valor / Cota</th>
                        <th className="p-4 text-right pr-6 w-[8%]">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredIndications.map((ind) => {
                        const expired = ind.protection_expires_at && isAfter(new Date(), parseISO(ind.protection_expires_at));
                        const isInternalInd = ind.external_seller_uid && userRolesMap[ind.external_seller_uid] && userRolesMap[ind.external_seller_uid] !== 'external_seller';
                        const missingBaseVal = !isInternalInd && ind.status === 'negotiating' && (!ind.base_commission_value || ind.base_commission_value <= 0);
                        
                        return (
                          <tr 
                            key={ind.id} 
                            id={`indication-row-${ind.id}`} 
                            className="hover:bg-muted/30 transition-colors group"
                          >
                            {/* 1. DATA / STATUS */}
                            <td className="p-4 align-middle">
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-foreground">
                                  {new Date(ind.created_at).toLocaleDateString('pt-BR')}
                                </p>
                                <Badge variant="outline" className={cn(
                                  "font-bold tracking-wider uppercase text-[8px] h-4.5 px-1.5 shrink-0 block text-center w-fit",
                                  ind.status === 'sold' && "border-green-500/50 text-green-400 bg-green-500/10",
                                  ind.status === 'negotiating' && "border-orange-500/50 text-orange-400 bg-orange-500/10",
                                  ind.status === 'pending' && "border-blue-500/50 text-blue-400 bg-blue-500/10",
                                  ind.status === 'triagem' && "border-purple-500/50 text-purple-400 bg-purple-500/10",
                                  ind.status === 'archived' && "border-yellow-500/50 text-yellow-400 bg-yellow-500/10",
                                  ind.status === 'cancelled' && "border-destructive/50 text-destructive bg-destructive/10"
                                )}>
                                  {ind.status === 'sold' ? 'Vendido' : 
                                   ind.status === 'negotiating' ? 'Andamento' :
                                   ind.status === 'pending' ? 'Novo' : 
                                   ind.status === 'triagem' ? 'Triagem' :
                                   ind.status === 'archived' ? 'Perdido' : 'Cancelado'}
                                </Badge>
                                {ind.ai_score && (
                                  <Badge className={cn(
                                    "text-[8px] h-4 font-black uppercase border-none block w-fit mt-1",
                                    ind.ai_score === 'hot' ? "bg-red-500 text-white" : ind.ai_score === 'cold' ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                                  )}>
                                    {ind.ai_score === 'hot' ? '🔥 Quente' : ind.ai_score === 'cold' ? '❄️ Frio' : '⚖️ Morno'}
                                  </Badge>
                                )}
                              </div>
                            </td>

                            {/* 2. CLIENTE / CONTATO */}
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                  {(ind.client_person_name || ind.client_name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 max-w-[200px]">
                                  <h4 className="font-extrabold text-xs text-foreground uppercase tracking-tight" title={ind.client_person_name ? `${ind.client_person_name}${ind.client_name ? ` (${ind.client_name})` : ''}` : ind.client_name || 'Nome não informado'}>
                                    {ind.client_person_name ? (
                                      <div className="flex flex-col">
                                        <span className="font-extrabold text-xs text-foreground uppercase truncate">{ind.client_person_name}</span>
                                        {ind.client_name && ind.client_name.trim() !== '' && (
                                          <span className="text-[10px] text-muted-foreground truncate uppercase font-semibold mt-0.5">
                                            {ind.client_name}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      ind.client_name || 'Nome não informado'
                                    )}
                                  </h4>
                                  {ind.client_phone ? (
                                    <div className="flex items-center gap-1 mt-1 mr-1" onClick={(e) => e.stopPropagation()}>
                                      <a
                                        href={`https://wa.me/${ind.client_phone.replace(/\D/g, '').startsWith('55') ? ind.client_phone.replace(/\D/g, '') : '55' + ind.client_phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="no-referrer"
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] transition-all border border-emerald-500/15"
                                        title="Chamar no WhatsApp"
                                      >
                                        <MessageCircle className="h-3 w-3 fill-emerald-500 text-emerald-500 shrink-0" />
                                        <span>{ind.client_phone}</span>
                                      </a>
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      Sem telefone
                                    </p>
                                  )}
                                  {ind.client_email && (
                                    <p className="text-[9px] text-muted-foreground/80 truncate">
                                      {ind.client_email}
                                    </p>
                                  )}
                                  {ind.cancellation_reason?.includes('Duplicidade') && (
                                    <span className="inline-block mt-0.5 border border-yellow-500/50 text-yellow-500 text-[8px] px-1 py-0.5 rounded font-black animate-pulse uppercase">DUPLICADO</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 3. INDICADOR / CONSULTOR */}
                            <td className="p-4 align-middle">
                              <div className="space-y-1 text-xs max-w-[160px]">
                                <div className="flex items-center gap-1.5 text-primary font-bold uppercase truncate group/edit" title="Indicador">
                                  <span className="text-sm shrink-0 select-none">
                                    {getSellerSymbol(userRolesMap[ind.external_seller_uid || ''] || 'external_seller')}
                                  </span>
                                  <span className="truncate">
                                    {getSellerName(ind.external_seller_uid || '', ind.external_seller_name || '')}
                                  </span>
                                  {(isAdmin || isManager || isTriagem) && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-4 w-4 text-primary hover:bg-primary/20 rounded-full opacity-0 group-hover/edit:opacity-100 shrink-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Pencil className="h-2 w-2" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start" className="bg-card border-border w-56 shadow-lg">
                                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">Trocar Indicador</DropdownMenuLabel>
                                        <div className="px-2 py-1 text-[8px] font-bold text-muted-foreground border-b border-border/50 mb-1 flex flex-col gap-0.5 bg-muted/30">
                                          <div>🤝 Parceiro Indicador</div>
                                          <div>💼 Vendedor Padrão (Regional)</div>
                                          <div>👑 Gerente Comercial</div>
                                        </div>
                                        <ScrollArea className="h-48">
                                          {externalSellers.map((seller) => (
                                            <DropdownMenuItem 
                                              key={seller.uid}
                                              onClick={() => handleQuickUpdate(ind.id, { 
                                                external_seller_uid: seller.uid, 
                                                external_seller_name: seller.name 
                                              })}
                                              className="text-xs font-bold flex items-center gap-1.5 py-1.5"
                                            >
                                              <span className="text-sm shrink-0">
                                                {getSellerSymbol(seller.role || '')}
                                              </span>
                                              <span className="truncate">{seller.name}</span>
                                            </DropdownMenuItem>
                                          ))}
                                        </ScrollArea>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>

                                {ind.internal_seller_name ? (
                                  <div className="flex items-center gap-1 text-muted-foreground text-[10px] uppercase tracking-wider group/edit-internal" title="Consultor">
                                    <Headset className="h-3 w-3 shrink-0" />
                                    <span className="truncate">Cons: {ind.internal_seller_name}</span>
                                    {(isAdmin || isManager || isTriagem) && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-3 w-3 text-muted-foreground hover:bg-muted rounded-full opacity-0 group-hover/edit-internal:opacity-100 shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Pencil className="h-1.5 w-1.5" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="bg-card border-border w-48">
                                          <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">Trocar Consultor</DropdownMenuLabel>
                                          {internalSellers.map((seller) => (
                                            <DropdownMenuItem 
                                              key={seller.uid}
                                              onClick={() => handleQuickUpdate(ind.id, { 
                                                internal_seller_uid: seller.uid, 
                                                internal_seller_name: seller.name 
                                              })}
                                              className="text-xs font-bold"
                                            >
                                              {seller.name}
                                            </DropdownMenuItem>
                                          ))}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-[9px] text-muted-foreground/60 italic lowercase">SEM CONSULTOR</div>
                                )}
                              </div>
                            </td>

                            {/* 4. EQUIPAMENTO / OPCIONAIS */}
                            <td className="p-4 align-middle">
                              <div className="space-y-1.5 max-w-[260px]">
                                <div className="flex items-center gap-1.5 text-foreground font-black text-[14px] uppercase" title="Máquina Base">
                                  <Package className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                  <span className="truncate">{ind.base_machine}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 leading-none">
                                  {ind.items && ind.items.map((item, idx) => (
                                    <span key={idx} className="text-[11px] font-bold bg-primary/5 text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase">
                                      {item.quantity}x {item.product_name}
                                    </span>
                                  ))}
                                  {ind.options?.complete_installation && (
                                    <span className="bg-green-500/5 text-green-400 border border-green-500/10 text-[8px] px-1 py-0.5 rounded uppercase">Montagem</span>
                                  )}
                                  {ind.options?.kit_hydraulic && (
                                    <span className="bg-blue-500/5 text-blue-400 border border-blue-500/10 text-[8px] px-1 py-0.5 rounded uppercase">Hidráulico</span>
                                  )}
                                  {ind.options?.with_freight && (
                                    <span className="bg-orange-500/5 text-orange-400 border border-orange-500/10 text-[8px] px-1 py-0.5 rounded uppercase">Frete</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 5. VALOR / COTA */}
                            <td className="p-4 align-middle">
                              <div className="space-y-1 text-xs">
                                {ind.sale_value ? (
                                  <p className="font-bold text-foreground">
                                    R$ {ind.sale_value.toLocaleString('pt-BR')}
                                    {ind.discount_percentage ? (
                                      <span className="block text-[9px] text-green-500">-{ind.discount_percentage}% desc.</span>
                                    ) : null}
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-muted-foreground italic">S/ Valor</p>
                                )}
                                
                                {missingBaseVal && (isManager || isInternalSeller || isAdmin || isTriagem) && (
                                  <Badge 
                                    className="bg-amber-500/15 text-amber-600 border border-amber-500/20 text-[9px] px-1 cursor-pointer font-black hover:bg-amber-500/25 block w-fit mt-1"
                                    onClick={() => openNegotiation(ind, 'commercial')}
                                    title="Clique para definir o valor base"
                                  >
                                    VALOR PENDENTE
                                  </Badge>
                                )}
                                
                                {ind.status !== 'sold' && ind.status !== 'cancelled' && ind.status !== 'archived' && (
                                  <div className="mt-1">
                                    {expired ? (
                                      <span className="text-[8px] font-black uppercase text-red-500 bg-red-500/10 border border-red-500/20 px-1 py-0.5 rounded">EXPIRADO</span>
                                    ) : ind.budget_sent_at && ind.protection_expires_at ? (
                                      <span className="text-[8px] font-black uppercase text-green-500 bg-green-500/10 border border-green-500/20 px-1 py-0.5 rounded">
                                        {formatDistanceToNow(parseISO(ind.protection_expires_at), { locale: ptBR })}
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-medium text-muted-foreground">Aguardando orç.</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* 6. AÇÕES */}
                            <td className="p-4 text-right align-middle pr-6">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 text-xs gap-1 py-1 font-bold border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                                  onClick={() => openNegotiation(ind)}
                                  title="Acompanhar Atendimento"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  Acompanhar
                                </Button>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-8 w-8 text-muted-foreground hover:bg-muted"
                                    >
                                      <GripHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-card border-border w-56">
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">Ações Gerais</DropdownMenuLabel>
                                    
                                    <DropdownMenuItem onClick={() => openNegotiation(ind)} className="text-xs font-semibold gap-2">
                                      <MessageSquare className="h-3.5 w-3.5" />
                                      {(!isInternalSeller && !isManager && !isAdmin && !isTriagem) ? 'Acompanhar Negociação' : 'Iniciar Negociação'}
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem onClick={() => openNegotiation(ind, 'timeline')} className="text-xs font-semibold gap-2">
                                      <History className="h-3.5 w-3.5" />
                                      Ver Linha do Tempo
                                    </DropdownMenuItem>
                                    
                                    {ind.status === 'negotiating' && (isInternalSeller || isManager || isAdmin || isTriagem) && (
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setSelectedIndication(ind);
                                          setIsInvoiceDialogOpen(true);
                                        }}
                                        className="text-xs font-bold text-green-500 hover:text-green-600 gap-2 focus:text-green-500"
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                         Fechar Negócio (Pedido)
                                       </DropdownMenuItem>
                                     )}

                                     {ind.status === 'sold' && (isInternalSeller || isManager || isAdmin || isTriagem) && (
                                       <DropdownMenuItem 
                                         onClick={() => handleUndoInvoice(ind)}
                                         className="text-xs font-bold text-red-500 hover:text-red-400 gap-2 focus:text-red-500"
                                       >
                                         <Undo className="h-3.5 w-3.5" />
                                         Estornar Faturamento
                                       </DropdownMenuItem>
                                     )}

                                     {ind.status === 'negotiating' && (isInternalSeller || isManager || isAdmin || isTriagem) && (
                                       <DropdownMenuItem 
                                         onClick={() => {
                                           setSelectedIndication(ind);
                                           setIsInvoiceDialogOpen(true);
                                         }}
                                         className="hidden"
                                       >
                                         <CheckCircle2 className="h-3.5 w-3.5" />
                                         Fechar Negócio (Pedido)
                                      </DropdownMenuItem>
                                    )}

                                    {(isInternalSeller || isManager || isAdmin || isTriagem) && (
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setSelectedIndication(ind);
                                          setIsCancelDialogOpen(true);
                                        }}
                                        className="text-xs font-bold text-destructive hover:text-destructive gap-2 focus:text-destructive"
                                      >
                                        <XCircle className="h-3.5 w-3.5" />
                                        Cancelar Negociação
                                      </DropdownMenuItem>
                                    )}

                                    {(isAdmin || isManager) && (
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setSelectedIndication(ind);
                                          setIsDeleteDialogOpen(true);
                                        }}
                                        className="text-xs font-semibold text-muted-foreground hover:bg-muted gap-2 focus:bg-muted"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Excluir Registro
                                      </DropdownMenuItem>
                                    )}


                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE LAYOUT: Compact spreadsheet-like rows, zero horizontal scroll, ultra responsive */}
              <div className="block md:hidden space-y-2">
                {filteredIndications.map((ind) => {
                  const expired = ind.protection_expires_at && isAfter(new Date(), parseISO(ind.protection_expires_at));
                  const isInternalInd = ind.external_seller_uid && userRolesMap[ind.external_seller_uid] && userRolesMap[ind.external_seller_uid] !== 'external_seller';
                  const missingBaseVal = !isInternalInd && ind.status === 'negotiating' && (!ind.base_commission_value || ind.base_commission_value <= 0);
                  
                  return (
                    <div 
                      key={ind.id} 
                      className={cn(
                        "bg-card border border-border rounded-xl p-3 shadow-xs flex items-center justify-between gap-2 border-l-4 transition-colors",
                        ind.status === 'sold' && "border-l-green-500",
                        ind.status === 'negotiating' && "border-l-orange-500",
                        ind.status === 'pending' && "border-l-blue-500",
                        ind.status === 'triagem' && "border-l-purple-500",
                        ind.status === 'archived' && "border-l-yellow-500",
                        ind.status === 'cancelled' && "border-l-destructive"
                      )}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Row 1: Client Name & Date */}
                        <div className="flex items-center justify-between gap-1 leading-none">
                          <div className="flex items-center gap-1 flex-wrap min-w-0" onClick={(e) => e.stopPropagation()}>
                            <span className="font-extrabold text-xs text-foreground uppercase truncate" title={ind.client_person_name ? `${ind.client_person_name}${ind.client_name ? ` (${ind.client_name})` : ''}` : ind.client_name || 'Nome não informado'}>
                              {ind.client_person_name || ind.client_name || 'Nome não informado'}
                            </span>
                            {ind.client_phone && (
                              <a
                                href={`https://wa.me/${ind.client_phone.replace(/\D/g, '').startsWith('55') ? ind.client_phone.replace(/\D/g, '') : '55' + ind.client_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="no-referrer"
                                className="inline-flex items-center gap-1 px-1 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] transition-all border border-emerald-500/15"
                                title="Falar no WhatsApp"
                              >
                                <MessageCircle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500 shrink-0" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                          <span className="text-[9px] text-muted-foreground shrink-0 font-medium">
                            {new Date(ind.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        
                        {/* Row 2: Equipment model name & badges */}
                        <div className="flex items-center flex-wrap gap-1 leading-none">
                          <span className="text-[12px] font-bold text-foreground bg-primary/5 px-1 rounded truncate max-w-[150px]">
                            {ind.base_machine}
                          </span>
                          {ind.items && ind.items.map((item, idx) => (
                            <span key={idx} className="text-[11px] font-bold bg-primary/5 text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase">
                              {item.quantity}x {item.product_name}
                            </span>
                          ))}
                          
                          <Badge variant="outline" className={cn(
                            "font-bold tracking-tight uppercase text-[7px] h-3.5 px-1 shrink-0",
                            ind.status === 'sold' && "border-green-500/30 text-green-400 bg-green-500/5",
                            ind.status === 'negotiating' && "border-orange-500/30 text-orange-400 bg-orange-500/5",
                            ind.status === 'pending' && "border-blue-500/30 text-blue-400 bg-blue-500/5",
                            ind.status === 'triagem' && "border-purple-500/30 text-purple-400 bg-purple-500/5",
                            ind.status === 'archived' && "border-yellow-500/30 text-yellow-400 bg-yellow-500/5",
                            ind.status === 'cancelled' && "border-destructive/30 text-destructive bg-destructive/5"
                          )}>
                            {ind.status === 'sold' ? 'Vendido' : 
                             ind.status === 'negotiating' ? 'Andamento' :
                             ind.status === 'pending' ? 'Novo' : 
                             ind.status === 'triagem' ? 'Triagem' :
                             ind.status === 'archived' ? 'Perdido' : 'Cancelado'}
                          </Badge>

                          {ind.ai_score && (
                            <span className={cn(
                              "text-[7px] font-black uppercase px-0.5 py-0.5 rounded shrink-0 leading-none",
                              ind.ai_score === 'hot' ? "text-red-500" : ind.ai_score === 'cold' ? "text-blue-500" : "text-amber-500"
                            )}>
                              {ind.ai_score === 'hot' ? '🔥' : ind.ai_score === 'cold' ? '❄️' : '⚖️'}
                            </span>
                          )}

                          {missingBaseVal && (isManager || isInternalSeller || isAdmin || isTriagem) && (
                            <span className="text-[7px] font-black uppercase tracking-tighter text-amber-600 bg-amber-500/10 border border-amber-500/25 px-1 rounded shrink-0">
                              v. pendente
                            </span>
                          )}
                        </div>

                        {/* Row 3: Indicator and Consultant */}
                        <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground truncate leading-none">
                          <span className="truncate flex items-center gap-1">
                            <span>Ind:</span>
                            <span className="text-[10px] select-none">
                              {getSellerSymbol(userRolesMap[ind.external_seller_uid || ''] || 'external_seller')}
                            </span>
                            <span>{getSellerName(ind.external_seller_uid || '', ind.external_seller_name || '')}</span>
                          </span>
                          {ind.internal_seller_name && <span className="opacity-80">| Cons: {ind.internal_seller_name}</span>}
                        </div>
                      </div>

                      {/* Action cell: 1 quick follow-up icon + 1 general action dropdown */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="h-7 w-7 p-0 border-orange-500/20 hover:bg-orange-500/10 text-orange-500"
                          onClick={() => openNegotiation(ind)}
                          title="Acompanhar"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="xs" variant="ghost" className="h-7 w-7 p-0 hover:bg-muted">
                              <GripHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border w-52">
                            <DropdownMenuLabel className="text-[9px] font-black uppercase text-muted-foreground">Ações de Atendimento</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => openNegotiation(ind)} className="text-xs font-semibold gap-1.5 py-2">
                              <MessageSquare className="h-3.5 w-3.5" />
                              Continuar Negociação
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => openNegotiation(ind, 'timeline')} className="text-xs font-semibold gap-1.5 py-2">
                              <History className="h-3.5 w-3.5" />
                              Ver Linha do Tempo
                            </DropdownMenuItem>
                            
                            {ind.status === 'negotiating' && (isInternalSeller || isManager || isAdmin || isTriagem) && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedIndication(ind);
                                  setIsInvoiceDialogOpen(true);
                                }}
                                className="text-xs font-bold text-green-500 hover:text-green-600 gap-1.5 py-2 focus:text-green-500"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Fechar Negócio (Pedido)
                              </DropdownMenuItem>
                            )}

                            {ind.status === 'sold' && (isInternalSeller || isManager || isAdmin || isTriagem) && (
                              <DropdownMenuItem 
                                onClick={() => handleUndoInvoice(ind)}
                                className="text-xs font-bold text-red-500 hover:text-red-400 gap-1.5 py-2 focus:text-red-500"
                              >
                                <Undo className="h-3.5 w-3.5" />
                                Estornar Faturamento
                              </DropdownMenuItem>
                            )}

                            {ind.status === 'negotiating' && (isInternalSeller || isManager || isAdmin || isTriagem) && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedIndication(ind);
                                  setIsInvoiceDialogOpen(true);
                                }}
                                className="hidden"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Fechar Negócio (Pedido)
                              </DropdownMenuItem>
                            )}

                            {(isInternalSeller || isManager || isAdmin || isTriagem) && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedIndication(ind);
                                  setIsCancelDialogOpen(true);
                                }}
                                className="text-xs font-bold text-destructive hover:text-destructive gap-1.5 py-2 focus:text-destructive"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Cancelar Negociação
                              </DropdownMenuItem>
                            )}

                            {(isAdmin || isManager) && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedIndication(ind);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-xs font-semibold text-muted-foreground hover:bg-muted gap-1.5 py-2 focus:bg-muted"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Excluir Registro
                              </DropdownMenuItem>
                            )}


                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Cancel Indication Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive font-black uppercase italic tracking-tighter">
                <Trash2 className="h-5 w-5" /> Cancelar Lead
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Deseja realmente cancelar a negociação com <strong>{selectedIndication?.client_name}</strong>? 
                Esta ação liberará a reserva do cliente e registrará o motivo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cancel_reason" className="text-xs font-bold uppercase">Motivo Principal</Label>
                <Select value={cancelReason} onValueChange={setCancelReason}>
                  <SelectTrigger id="cancel_reason" className="bg-background border-border h-11">
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-card-foreground min-w-[450px]">
                    <SelectItem value="Cliente desistiu">Cliente desistiu da compra / Fechou negócio</SelectItem>
                    <SelectItem value="Preço alto">Preço muito elevado / Acima do esperado</SelectItem>
                    <SelectItem value="Prazo de entrega">Prazo de entrega longo / Inviável</SelectItem>
                    <SelectItem value="Comprou concorrente">Comprou do concorrente</SelectItem>
                    <SelectItem value="Lead sem contato">Não conseguimos contato com o potencial cliente</SelectItem>
                    <SelectItem value="Indicação improcedente">Indicação improcedente / SPAM / Teste</SelectItem>
                    <SelectItem value="Prazo expirado">Prazo de orçamento expirado (Cancelamento Automático)</SelectItem>
                    <SelectItem value="Outro">Outro motivo específico...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancel_details" className="text-xs font-bold uppercase">Detalhes Adicionais (Obrigatório)</Label>
                <Textarea 
                  id="cancel_details"
                  placeholder="Explique detalhadamente o que aconteceu durante a negociação para fins de relatório..."
                  className="min-h-[100px] bg-background border-border"
                  value={cancelDetails}
                  onChange={(e) => setCancelDetails(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsCancelDialogOpen(false)}>Voltar</Button>
              <Button 
                variant="destructive" 
                className="font-bold uppercase tracking-wide gap-2 px-6"
                onClick={handleCancelLead}
                disabled={submitting || !cancelReason || !cancelDetails}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Confirmar Cancelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Indication Permanent Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground sm:max-w-lg w-full max-w-[calc(100%-2rem)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive font-black uppercase italic tracking-tighter text-lg">
                <AlertTriangle className="h-5 w-5 animate-pulse text-red-500" /> Excluir Registro Permanentemente
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed mt-1">
                Deseja realmente excluir permanentemente a indicação de <strong>{selectedIndication?.client_name || selectedIndication?.client_person_name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-red-800 dark:text-red-400">Atenção: Ação Irreversível</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      Se você excluir este registro, não haverá mais nenhuma possibilidade de ele aparecer novamente no sistema. Ele será excluído completamente de todos os relatórios, históricos e painéis do RODER Indica.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>
                Voltar
              </Button>
              <Button 
                variant="destructive" 
                className="font-bold uppercase tracking-wide gap-2 px-6 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteIndication}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Confirmar Exclusão Definitiva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Invoice / Sales Order Dialog */}
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl md:p-6 lg:p-8 p-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-primary flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" /> Finalizar Faturamento
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Conclua a venda do lead de <strong>{selectedIndication?.client_name}</strong>. Confirme os dados finais extraídos do Pedido de Venda.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
              {/* Left Column: Sales Order Details & Stock Control Box */}
              <div className="space-y-4">
                {/* Sales Order Identification Info */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 border-b border-slate-250 dark:border-slate-750 pb-1.5 mb-1">
                    <FileText className="h-3.5 w-3.5" /> Identificação do Pedido de Venda
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Nº Pedido de Venda</span>
                      <span className="font-mono font-black text-slate-800 dark:text-slate-200 uppercase text-sm">
                        {selectedIndication?.sale_order_number ? `#${selectedIndication.sale_order_number}` : 'NÃO INFORMADO'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Data do Pedido</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {selectedIndication?.sale_order_date ? selectedIndication.sale_order_date.split('-').reverse().join('/') : '-'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Previsão de Entrega</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedIndication?.delivery_date ? selectedIndication.delivery_date.split('-').reverse().join('/') : 'Não informada'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client Info extracted */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 border-b border-slate-250 dark:border-slate-750 pb-1.5 mb-1">
                    <UserCheck className="h-3.5 w-3.5" /> Informações do Cliente extraídas
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Nome Completo / Razão Social</span>
                        <span className="font-black text-slate-800 dark:text-slate-200 uppercase">
                          {selectedIndication?.client_name || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">CNPJ / CPF</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {selectedIndication?.client_cnpj ? selectedIndication.client_cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Código de Cliente (ERP)</span>
                        <span className="font-black text-primary uppercase bg-primary/5 px-1 py-0.5 rounded text-[10px] inline-block">
                          {selectedIndication?.client_code || 'Não cadastrado'}
                        </span>
                      </div>
                      {selectedIndication?.client_company_name && (
                        <div className="col-span-2">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Nome Fantasia / Apelido</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                            {selectedIndication.client_company_name}
                          </span>
                        </div>
                      )}
                      {selectedIndication?.client_email && (
                        <div className="col-span-2">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Email</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {selectedIndication.client_email}
                          </span>
                        </div>
                      )}
                      {selectedIndication?.client_phone && (
                        <div>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Telefone</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {selectedIndication.client_phone}
                          </span>
                        </div>
                      )}
                      {selectedIndication?.client_address && (
                        <div className="col-span-2">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Endereço Completo</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate block" title={selectedIndication.client_address}>
                            {selectedIndication.client_address}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Automatic Stock deduction selector - MOVED BELOW CLIENT BOX */}
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 border-b border-blue-500/10 pb-1.5 mb-1">
                    <Package className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Controle Físico de Estoque</span>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold block text-slate-700 dark:text-slate-300">
                      Deseja baixar do estoque automaticamente os itens disponíveis?
                    </Label>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={autoDeductStock ? 'default' : 'outline'}
                        className={`flex-1 text-xs font-black uppercase h-10 ${autoDeductStock ? 'bg-blue-600 hover:bg-blue-700 text-white border-none' : 'border-slate-200'}`}
                        onClick={() => setAutoDeductStock(true)}
                      >
                        SIM, BAIXAR ESTOQUE DISPONÍVEL
                      </Button>
                      <Button
                        type="button"
                        variant={!autoDeductStock ? 'default' : 'outline'}
                        className={`flex-1 text-xs font-black uppercase h-10 ${!autoDeductStock ? 'bg-slate-700 hover:bg-slate-850 text-white border-none' : 'border-slate-200'}`}
                        onClick={() => {
                          setAutoDeductStock(false);
                          setSelectedStockItem('none');
                        }}
                      >
                        NÃO, FINALIZAR DIRETAMENTE
                      </Button>
                    </div>
                    {autoDeductStock ? (
                      <div className="p-3 bg-blue-500/10 rounded-lg text-[10px] text-blue-800 dark:text-blue-300 leading-relaxed font-semibold">
                        * O sistema dará baixa automática nas quantidades correspondentes de cada item do pedido que já estiver disponível no estoque físico. Os produtos que não estão em estoque poderão ser fabricados posteriormente.
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <Label className="text-[10px] font-black uppercase text-slate-500 block">Opção Manual de Baixa Simples (Fallback)</Label>
                        <Select value={selectedStockItem} onValueChange={setSelectedStockItem}>
                          <SelectTrigger className="bg-background border-border h-10 text-xs">
                            <SelectValue placeholder="Selecione um único item do estoque (opcional)" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border text-card-foreground max-h-[225px]">
                            <SelectItem value="none">Não dar baixa (Ignorar estoque)</SelectItem>
                            {stockItems.filter(i => i.quantity > 0).map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.code} - {item.description} ({item.quantity} UN)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Unified Equipment Display and Final Total Values Box */}
              <div className="space-y-4">
                <div className="p-5 md:p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 space-y-6 shadow-sm flex flex-col justify-between h-full">
                  {/* Equipments Section (Expanded without ScrollArea) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-primary" /> Equipamentos no Faturamento
                      </span>
                      <Badge variant="outline" className="text-[9px] bg-background border-border font-black px-2 py-0.5">
                        {(selectedIndication?.commissioned_products || []).length} Itens
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedIndication?.commissioned_products && selectedIndication.commissioned_products.length > 0 ? (
                        selectedIndication.commissioned_products.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-3 bg-background hover:bg-muted/50 transition-colors rounded-lg border border-border">
                            <div className="min-w-0 pr-3">
                              <p className="font-extrabold text-foreground leading-snug truncate text-sm">{p.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{p.code} • Qtd: {p.quantity}</p>
                            </div>
                            <span className="font-mono font-black text-primary text-sm shrink-0">
                              {maskCurrency(p.base_value * p.quantity)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-75">
                          <Package className="h-8 w-8 stroke-1 mb-2 text-muted-foreground" />
                          <p className="text-[11px] uppercase font-black text-center tracking-wider">Sem produtos cadastrados na central</p>
                          <p className="text-[10px] text-center italic mt-0.5">A comissão será baseada no valor final da venda</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clean Visual Divider */}
                  <div className="border-t border-slate-200 dark:border-slate-800" />

                  {/* Consolidated Invoice Totals */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-orange-600 border-b border-orange-500/10 pb-2">
                      <DollarSign className="h-4 w-4 text-orange-500" />
                      <span className="text-xs font-black uppercase tracking-wider">Dados Consolidados do Faturamento</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground block">Valor Total do Faturamento / Venda</Label>
                      <div className="relative">
                        <Input 
                          value={maskCurrency(Number(saleValue) || 0)}
                          onChange={(e) => setSaleValue(unmaskCurrency(e.target.value).toString())}
                          className="bg-background border-border font-black text-xl h-12 pl-10 text-primary focus:ring-primary"
                          placeholder="R$ 0,00"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">R$</span>
                      </div>
                    </div>
                    <div className="p-3.5 bg-orange-500/10 dark:bg-orange-950/20 rounded-lg text-[10px] text-orange-800 dark:text-orange-300 leading-normal font-semibold space-y-1">
                      <p>✓ Os valores já foram negociados e validados no corpo do Pedido de Venda.</p>
                      <p>✓ Cupom de desconto ou abatimento percentual não é aplicável nesta tela.</p>
                      <p>✓ A comissão final será calculada diretamente sobre o valor total do faturamento.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-4 mt-2">
              <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)} className="border-border">
                Cancelar
              </Button>
              <Button 
                onClick={handleFinishSale} 
                disabled={submitting} 
                className="bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-wider text-xs h-10 px-6 rounded-md shadow-md"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Confirmar Faturamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Vincular Produto Dialog */}
        <Dialog open={isLinkingDialogOpen} onOpenChange={setIsLinkingDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground max-w-2xl max-h-[70vh] flex flex-col p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-6 border-b border-border bg-primary/5">
              <DialogTitle className="flex items-center gap-2 text-primary font-black uppercase italic tracking-tighter">
                <FileSearch className="h-6 w-6" /> Vincular Produto Cadastrado
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Selecione o produto oficial para importar o valor base automaticamente para <span className="text-foreground font-bold">{productBeingLinked?.name}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 border-b border-border bg-muted/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou código..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-background border-border focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-2">
                {registeredProducts
                  .filter(p => 
                    p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
                    (p.code && p.code.toLowerCase().includes(productSearchTerm.toLowerCase()))
                  )
                  .map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        if (productBeingLinked) {
                          setUpdatingProductName(productBeingLinked.name);
                          setNewBaseValue(product.base_price.toString());
                          setIsLinkingDialogOpen(false);
                          toast.success(`Valor de R$ ${maskCurrency(product.base_price)} importado!`);
                        }
                      }}
                      className="w-full text-left p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-black uppercase">{product.code || 'S/C'}</span>
                          <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{product.category || 'Geral'}</span>
                        </div>
                        <h4 className="font-black italic text-sm uppercase text-foreground leading-tight">{product.name}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-muted-foreground mb-0.5">Valor Base</p>
                        <p className="font-mono font-bold text-primary group-hover:scale-110 transition-transform">
                          {maskCurrency(product.base_price)}
                        </p>
                      </div>
                    </button>
                  ))}
                
                {registeredProducts.filter(p => 
                   p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
                   (p.code && p.code.toLowerCase().includes(productSearchTerm.toLowerCase()))
                ).length === 0 && (
                  <div className="py-12 text-center grayscale opacity-50">
                    <Search className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="p-4 border-t border-border bg-muted/10">
              <Button variant="ghost" onClick={() => setIsLinkingDialogOpen(false)} className="w-full font-black uppercase text-[10px] tracking-widest h-10">
                Cancelar Vinculação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}
