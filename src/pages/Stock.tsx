import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { CryptoService } from '../lib/CryptoService';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  writeBatch,
  getDocs,
  orderBy,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  Package, 
  Upload, 
  Plus, 
  Search, 
  ShoppingCart, 
  Trash2, 
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  History,
  RefreshCw,
  X,
  Save,
  Bookmark,
  Share2,
  ChevronUp,
  ChevronDown,
  Clock,
  MapPin,
  Mail,
  Warehouse,
  Globe,
  Edit,
  FileImage,
  Edit2
} from 'lucide-react';

import { HelpTooltip } from '../components/base/HelpTooltip';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '../components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { cn, safeFormatDate } from '../lib/utils';
import { StockItem, StockSale, StockReservation, RegisteredProduct, StockImportFAE } from '../types';
import { toPng } from 'html-to-image';
import { scanStockPDF } from '../services/geminiService';
import { notifyStockUpdate } from '../services/emailService';

const DEFAULT_FAE_IMPORTS = [
  {
    id: "default-1",
    description: "FAE UML/S/EX/VT-125",
    quantity: 2,
    embarque: "10 mai, 2026",
    chegada: "20 jun, 2026",
    created_at: "2026-06-09T00:00:01.000Z"
  },
  {
    id: "default-2",
    description: "FAE UML/S/EX/VT-125 - COM ROTOR BL",
    quantity: 2,
    embarque: "10 mai, 2026",
    chegada: "20 jun, 2026",
    created_at: "2026-06-09T00:00:02.000Z"
  },
  {
    id: "default-3",
    description: "FAE - PEÇAS ESTEIRA PT175",
    quantity: 1,
    embarque: "16 abr, 2026",
    chegada: "20 jun, 2026",
    created_at: "2026-06-09T00:00:03.000Z"
  },
  {
    id: "default-4",
    description: "FAE USA - CORRENTES PT 175",
    quantity: 1,
    embarque: "08 mai, 2026",
    chegada: "20 jun, 2026",
    created_at: "2026-06-09T00:00:04.000Z"
  },
  {
    id: "default-5",
    description: "FAE - ITENS DIVERSOS",
    quantity: 1,
    embarque: "21 mai, 2026",
    chegada: "29 jul, 2026",
    created_at: "2026-06-09T00:00:05.000Z"
  },
  {
    id: "default-6",
    description: "FAE - RODA BERÇO PT175",
    quantity: 1,
    embarque: "05 ago, 2026",
    chegada: "13 out, 2026",
    created_at: "2026-06-09T00:00:06.000Z"
  },
  {
    id: "default-7",
    description: "FAE RCU55 - Tier 4F + BL1/RCU55-125 Forestry",
    quantity: 1,
    embarque: "12 out, 2026",
    chegada: "19 dez, 2026",
    created_at: "2026-06-09T00:00:07.000Z"
  },
  {
    id: "default-8",
    description: "FAE UML/EX/VT-125",
    quantity: 1,
    embarque: "12 out, 2026",
    chegada: "19 dez, 2026",
    created_at: "2026-06-09T00:00:08.000Z"
  },
  {
    id: "default-9",
    description: "FAE UML/S/EX/VT-125",
    quantity: 1,
    embarque: "12 out, 2026",
    chegada: "19 dez, 2026",
    created_at: "2026-06-09T00:00:09.000Z"
  }
];

export function parseChegadaDate(dateStr: string): Date {
  if (!dateStr) return new Date(9999, 11, 31); // Far future
  
  const cleanStr = dateStr.trim().toLowerCase();
  
  // Try matching DD/MM/YYYY or DD/MM/YY or DD/MM
  const dmyRegex = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/;
  let match = cleanStr.match(dmyRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed in JS
    let year = new Date().getFullYear(); // default to current year
    if (match[3]) {
      let yr = parseInt(match[3], 10);
      if (yr < 100) {
        year = yr + 2000; // 26 -> 2026
      } else {
        year = yr;
      }
    }
    return new Date(year, month, day);
  }

  // Try matching DD [month name] YYYY or DD [month name]
  // e.g. "10 mai, 2026" or "10 mai 2026" or "20 jun, 2026"
  const ptMonths: Record<string, number> = {
    'jan': 0, 'janeiro': 0,
    'fev': 1, 'fevereiro': 1,
    'mar': 2, 'marco': 2, 'março': 2,
    'abr': 3, 'abril': 3,
    'mai': 4, 'maio': 4,
    'jun': 5, 'junho': 5,
    'jul': 6, 'julho': 6,
    'ago': 7, 'agosto': 7,
    'set': 8, 'setembro': 8,
    'out': 9, 'outubro': 9,
    'nov': 10, 'novembro': 10,
    'dez': 11, 'dezembro': 11
  };

  const dMonthYRegex = /^(\d{1,2})\s+([a-zçáõíóú]+)(?:\s*,\s*|\s+)(\d{2,4})?/;
  match = cleanStr.match(dMonthYRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthName = match[2];
    const monthIndex = ptMonths[monthName] !== undefined ? ptMonths[monthName] : 0;
    let year = new Date().getFullYear();
    if (match[3]) {
      let yr = parseInt(match[3], 10);
      if (yr < 100) {
        year = yr + 2000;
      } else {
        year = yr;
      }
    }
    return new Date(year, monthIndex, day);
  }
  
  // Try matching MM/YYYY or MM/YY (no day specified, e.g. "07/2026" or "07/26")
  const myRegex = /^(\d{1,2})\/(\d{2,4})/;
  const matchMy = cleanStr.match(myRegex);
  if (matchMy) {
    const month = parseInt(matchMy[1], 10) - 1;
    let year = new Date().getFullYear();
    let yr = parseInt(matchMy[2], 10);
    if (yr < 100) {
      year = yr + 2000;
    } else {
      year = yr;
    }
    return new Date(year, month, 1);
  }

  for (const [name, index] of Object.entries(ptMonths)) {
    if (cleanStr.includes(name)) {
      const yearMatch = cleanStr.match(/\b(20\d{2}|\d{2})\b/);
      let year = new Date().getFullYear();
      if (yearMatch) {
        let yr = parseInt(yearMatch[1], 10);
        if (yr < 100) {
          year = yr + 2000;
        } else {
          year = yr;
        }
      }
      return new Date(year, index, 1);
    }
  }

  const yearOnlyMatch = cleanStr.match(/\b(20\d{2})\b/);
  if (yearOnlyMatch) {
    return new Date(parseInt(yearOnlyMatch[1], 10), 0, 1);
  }

  return new Date(9999, 11, 31); // Far future for unparseable dates
}


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
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export default function Stock() {
  const { auth, profile, isAdmin, isManager, isMarketing, isInternalSeller, isTriagem } = useAuth();
  
  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth?.currentUser?.uid,
        email: auth?.currentUser?.email || undefined,
        emailVerified: auth?.currentUser?.emailVerified,
        isAnonymous: auth?.currentUser?.isAnonymous,
        tenantId: auth?.currentUser?.tenantId,
        providerInfo: auth?.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };
  const [items, setItems] = useState<StockItem[]>([]);
  const [sales, setSales] = useState<StockSale[]>([]);
  const [reservations, setReservations] = useState<StockReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'fabrica' | 'sinop' | 'importacao_fae'>('fabrica');
  const [importItems, setImportItems] = useState<StockImportFAE[]>([]);
  const [isAddImportModalOpen, setIsAddImportModalOpen] = useState(false);
  const [newImportItem, setNewImportItem] = useState({
    code: '',
    description: '',
    quantity: 1,
    embarque: '',
    chegada: ''
  });
  
  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [notifyRoles, setNotifyRoles] = useState<Record<string, boolean>>({
    external_seller: true,
    vendedor_padrao: true,
    internal_seller: true,
    manager: true,
    admin: true,
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReservationDetailsModalOpen, setIsReservationDetailsModalOpen] = useState(false);
  const [isAllReservationsModalOpen, setIsAllReservationsModalOpen] = useState(false);
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(0);
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [tempCode, setTempCode] = useState<string>('');
  
  // FAE general edit item
  const [editingImportItem, setEditingImportItem] = useState<StockImportFAE | null>(null);
  const [isEditImportModalOpen, setIsEditImportModalOpen] = useState(false);

  // Monday spreadsheet OCR states
  const [parsedRows, setParsedRows] = useState<{ code?: string; description: string; quantity: number; embarque: string; chegada: string; }[]>([]);
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedDescItem, setSelectedDescItem] = useState<StockItem | null>(null);
  const [isDescDialogOpen, setIsDescDialogOpen] = useState(false);
  const [viewingDescription, setViewingDescription] = useState<StockItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [cancellingReservationId, setCancellingReservationId] = useState<string | null>(null);

  // Automatic Cleanup of expired reservations
  const cleanupExpiredReservations = useCallback(async () => {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, 'stock_reservations'),
        where('status', '==', 'active'),
        where('expires_at', '<=', now)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      toast.info(`Limpando ${snapshot.size} reservas expiradas no estoque...`);
      
      for (const reservationDoc of snapshot.docs) {
        await updateDoc(reservationDoc.ref, {
          status: 'cancelled',
          cancellation_reason: 'Expirada automaticamente (5 dias)',
          updated_at: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error cleaning up expired items:", error);
    }
  }, []);

  useEffect(() => {
    cleanupExpiredReservations();
  }, [cleanupExpiredReservations]);

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [newItem, setNewItem] = useState({
    code: '',
    description: '',
    quantity: 0
  });
  
  const [saleData, setSaleData] = useState({
    itemId: '',
    itemDescription: '',
    quantity: 1,
    clientName: '',
    clientCnpj: '',
    observation: ''
  });

  const [reserveData, setReserveData] = useState({
    itemId: '',
    itemDescription: '',
    quantity: 1,
    clientName: '',
    clientCnpj: '',
    observation: '',
    password: ''
  });

  const [selectedItemSales, setSelectedItemSales] = useState<StockSale[]>([]);
  const [selectedItemReservations, setSelectedItemReservations] = useState<StockReservation[]>([]);
  const stockRef = React.useRef<HTMLDivElement>(null);
  const seedingImportsRef = React.useRef(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const normalizeDescription = (desc: string) => {
    if (!desc) return '';
    return desc
      .replace(/shanfrol/gi, 'FLORESTAL')
      .replace(/chanfrol/gi, 'FLORESTAL')
      .replace(/chanfro/gi, 'FLORESTAL')
      .replace(/shanfro/gi, 'FLORESTAL')
      .replace(/shanf/gi, 'FLORESTAL')
      .replace(/chanf/gi, 'FLORESTAL');
  };

  const findCodeForDescription = (description: string, stockItems: StockItem[]) => {
    if (!description) return '';
    const cleanDesc = description.toLowerCase().replace(/[\/\s-]/g, '').trim();
    // Try to find a stock item with matching description or code details
    const matched = stockItems.find(item => {
      const itemClean = (item.description || '').toLowerCase().replace(/[\/\s-]/g, '').trim();
      return itemClean.includes(cleanDesc) || cleanDesc.includes(itemClean);
    });
    return matched ? matched.code : '';
  };

  const lastUpdates = {
    fabrica: (items || []).filter(i => {
      const s = (i?.source || '').toLowerCase();
      const b = (i?.branch || '').toLowerCase();
      return b !== 'sinop' && (s === 'roder' || s === 'fae' || s === 'accessories' || s.includes('roder') || s.includes('fae') || s.includes('acessórios') || s.includes('acessorios'));
    }).reduce((latest, item) => {
      const updatedAt = (item as any).updated_at;
      if (!updatedAt) return latest;
      let date: Date;
      try {
        if (updatedAt && typeof updatedAt.toDate === 'function') {
          date = updatedAt.toDate();
        } else if (updatedAt && (updatedAt as any).seconds) {
          date = new Date((updatedAt as any).seconds * 1000);
        } else if (typeof updatedAt === 'string') {
          date = new Date(updatedAt);
        } else {
          date = new Date(updatedAt);
        }
      } catch (e) {
        return latest;
      }
      return !isNaN(date.getTime()) && date > latest ? date : latest;
    }, new Date(0)),
    sinop: (items || []).filter(i => {
      const b = (i?.branch || '').toLowerCase();
      return b === 'sinop';
    }).reduce((latest, item) => {
      const updatedAt = (item as any).updated_at;
      if (!updatedAt) return latest;
      let date: Date;
      try {
        if (updatedAt && typeof updatedAt.toDate === 'function') {
          date = updatedAt.toDate();
        } else if (updatedAt && (updatedAt as any).seconds) {
          date = new Date((updatedAt as any).seconds * 1000);
        } else if (typeof updatedAt === 'string') {
          date = new Date(updatedAt);
        } else {
          date = new Date(updatedAt);
        }
      } catch (e) {
        return latest;
      }
      return !isNaN(date.getTime()) && date > latest ? date : latest;
    }, new Date(0))
  };

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      toast.success(`Código ${code} copiado!`);
    }).catch(err => {
      console.error('Erro ao copiar:', err);
    });
  };

  const totals = {
    fabrica: (items || []).filter(i => {
      const b = (i?.branch || '').toLowerCase();
      return b !== 'sinop';
    }).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0),
    sinop: (items || []).filter(i => {
      return i.branch === 'sinop';
    }).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)
  };

  const formatDate = (date: Date) => {
    return safeFormatDate(date, { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  useEffect(() => {
    // Fetch without property filter to avoid document omission if field is missing
    const q = query(collection(db, 'stock_items'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stockData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockItem[];
      
      // Sort in memory for better resilience
      const sortedData = stockData.sort((a, b) => 
        (a.description || '').localeCompare(b.description || '')
      );
      
      setItems(sortedData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching stock items:", error);
      setLoading(false);
      toast.error("Erro ao carregar itens de estoque. Verifique suas permissões.");
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'stock_sales'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockSale[];
      setSales(salesData);
    }, (error) => {
      console.error("Error fetching sales:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'stock_reservations'), where('status', '==', 'active'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reservationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockReservation[];
      setReservations(reservationsData);
    }, (error) => {
      console.error("Error fetching reservations:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'stock_imports_fae'), orderBy('created_at', 'asc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const importedData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockImportFAE[];
      
      const isPowerUser = isAdmin || isManager || profile?.email === 'roderbrasil@gmail.com';

      if (snapshot.empty) {
        // Seed default FAE imported items only when database is completely empty
        try {
          if (isPowerUser && !seedingImportsRef.current) {
            seedingImportsRef.current = true;
            const initialImports = [
              {
                description: "FAE UML/S/EX/VT-125",
                quantity: 2,
                embarque: "10 mai, 2026",
                chegada: "20 jun, 2026",
                created_at: new Date().toISOString()
              },
              {
                description: "FAE UML/S/EX/VT-125 - COM ROTOR BL",
                quantity: 2,
                embarque: "10 mai, 2026",
                chegada: "20 jun, 2026",
                created_at: new Date().toISOString()
              },
              {
                description: "FAE - PEÇAS ESTEIRA PT175",
                quantity: 1,
                embarque: "16 abr, 2026",
                chegada: "20 jun, 2026",
                created_at: new Date().toISOString()
              },
              {
                description: "FAE USA - CORRENTES PT 175",
                quantity: 1,
                embarque: "08 mai, 2026",
                chegada: "20 jun, 2026",
                created_at: new Date().toISOString()
              },
              {
                description: "FAE - ITENS DIVERSOS",
                quantity: 1,
                embarque: "21 mai, 2026",
                chegada: "29 jul, 2026",
                created_at: new Date().toISOString()
              },
              {
                description: "FAE - RODA BERÇO PT175",
                quantity: 1,
                embarque: "05 ago, 2026",
                chegada: "13 out, 2026",
                created_at: new Date().toISOString()
              },
              {
                description: "FAE RCU55 - Tier 4F + BL1/RCU55-125 Forestry",
                quantity: 1,
                embarque: "12 out, 2026",
                chegada: "19 dez, 2026",
                created_at: new Date().toISOString()
              },
              {
                description: "FAE UML/EX/VT-125",
                quantity: 1,
                embarque: "12 out, 2026",
                chegada: "19 dez, 2026",
                created_at: new Date().toISOString()
              },
              {
                description: "FAE UML/S/EX/VT-125",
                quantity: 1,
                embarque: "12 out, 2026",
                chegada: "19 dez, 2026",
                created_at: new Date().toISOString()
              }
            ];
            for (const item of initialImports) {
              await addDoc(collection(db, 'stock_imports_fae'), item);
            }
          }
        } catch (err) {
          console.error("Error seeding FAE imports:", err);
        }
        setImportItems(DEFAULT_FAE_IMPORTS);
      } else {
        setImportItems(importedData);
      }
    }, (error) => {
      console.error("Error fetching FAE imports:", error);
      setImportItems(DEFAULT_FAE_IMPORTS);
    });

    return () => unsubscribe();
  }, [isAdmin, isManager, profile?.email]);

  const extractItemsFromPDF = async (file: File): Promise<{ items: Partial<StockItem>[], source: string, branch: string }> => {
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
      });
    };

    const base64Data = await fileToBase64(file);

    try {
      console.log(`Starting AI extraction for file: ${file.name}`);
      const result = await scanStockPDF(base64Data);
      
      if (!result.items || result.items.length === 0) {
        console.warn(`No items found in file: ${file.name}`);
        return { items: [], source: result.source || 'unknown', branch: result.branch || 'matriz' };
      }

      const mappedItems = result.items.map((item: any) => ({
        code: (item.code || '').toString().trim(),
        description: (item.description || 'Sem descrição').toString(),
        quantity: Number(item.quantity) || 0,
        source: result.source === 'sinop' ? 'sinop_pdf' : result.source,
        branch: result.branch || (result.source === 'sinop' ? 'sinop' : 'matriz'),
        updated_at: new Date().toISOString()
      }));

      return {
        items: mappedItems,
        source: result.source === 'sinop' ? 'sinop_pdf' : result.source,
        branch: result.branch || (result.source === 'sinop' ? 'sinop' : 'matriz')
      };
    } catch (e: any) {
      console.error("Error during AI extraction:", e);
      const errorMsg = e.message || 'Falha na comunicação com o servidor de IA';
      toast.error(`Erro na IA (${file.name}): ${errorMsg}`);
      return { items: [], source: 'unknown', branch: 'matriz' };
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo PDF.');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('IA processando planilhas de estoque (isso pode levar alguns segundos)...');

    try {
      const extractionResults: any[] = [];
      for (const file of uploadFiles) {
        if (extractionResults.length > 0) {
          // Pequeno atraso de 600ms entre as chamadas de IA para evitar limite de requisições por minuto (burst rate limits)
          await new Promise(resolve => setTimeout(resolve, 600));
        }
        const result = await extractItemsFromPDF(file);
        extractionResults.push(result);
      }
      
      let allNewItems: Partial<StockItem>[] = [];
      const updatedCategories: { source: string, branch: string }[] = [];

      extractionResults.forEach(res => {
        if (res.items.length > 0) {
          allNewItems = [...allNewItems, ...res.items];
          updatedCategories.push({ source: res.source, branch: res.branch });
        }
      });

      if (allNewItems.length === 0) {
        throw new Error('Nenhum item encontrado nos arquivos pela IA. Verifique se os PDFs são relatórios de estoque válidos.');
      }

      // Deduplicate extracted items by code, source and branch
      const deduplicatedNewItems = allNewItems.reduce((acc, current) => {
        const key = `${current.code}_${current.source}_${current.branch}`;
        if (!acc[key] || (current.quantity || 0) > (acc[key].quantity || 0)) {
          acc[key] = current;
        }
        return acc;
      }, {} as Record<string, Partial<StockItem>>);

      const itemsToProcess = Object.values(deduplicatedNewItems);

      const existingDocs = await getDocs(collection(db, 'stock_items'));
      const allOps: any[] = [];
      const processedKeys = new Set<string>();

      // Deciding operation for existing items
      existingDocs.docs.forEach(docSnap => {
        const existingData = docSnap.data();
        const existingSource = (existingData.source || '').toLowerCase();
        const existingBranch = (existingData.branch || 'matriz').toLowerCase();
        
        const isBeingUpdated = updatedCategories.some(cat => 
          cat.source.toLowerCase() === existingSource && cat.branch.toLowerCase() === existingBranch
        );

        if (isBeingUpdated) {
          const matchKey = `${(existingData.code || '').toString().trim()}_${existingSource}_${existingBranch}`;
          const newItem = deduplicatedNewItems[matchKey];

          if (newItem) {
            // IGNORE if quantity is the same
            if (Number(newItem.quantity) === Number(existingData.quantity)) {
              processedKeys.add(matchKey);
              return;
            }

            const itemReservations = reservations.filter(r => r.stock_item_id === docSnap.id && r.status === 'active');
            const hasReservations = itemReservations.length > 0;

            if (Number(newItem.quantity) <= 0 && !hasReservations) {
              // Delete only if no active reservations exist
              allOps.push({ ref: docSnap.ref, type: 'delete' });
            } else {
              allOps.push({
                ref: docSnap.ref,
                type: 'update',
                data: {
                  quantity: Number(newItem.quantity) || 0,
                  description: (newItem.description || existingData.description).toString(),
                  source: existingSource,
                  branch: existingBranch,
                  last_list_match: true,
                  updated_at: serverTimestamp()
                }
              });
            }
            processedKeys.add(matchKey);
          } else {
            // Not in PDF but category was updated -> delete unless has reservations
            const itemReservations = reservations.filter(r => r.stock_item_id === docSnap.id && r.status === 'active');
            if (itemReservations.length === 0) {
              allOps.push({ ref: docSnap.ref, type: 'delete' });
            } else {
              // If it has reservations, keep it but set quantity to 0
              if (existingData.quantity !== 0) {
                allOps.push({
                  ref: docSnap.ref,
                  type: 'update',
                  data: {
                    quantity: 0,
                    updated_at: serverTimestamp()
                  }
                });
              }
            }
          }
        }
      });

      // Add new items
      itemsToProcess.forEach(item => {
        if (Number(item.quantity) <= 0) return;

        const itemSource = (item.source || '').toLowerCase();
        const itemBranch = (item.branch || 'matriz').toLowerCase();
        const matchKey = `${(item.code || '').toString().trim()}_${itemSource}_${itemBranch}`;
        if (!processedKeys.has(matchKey)) {
          allOps.push({
            ref: doc(collection(db, 'stock_items')),
            type: 'set',
            data: {
              code: (item.code || '').toString().trim(),
              description: (item.description || 'Sem descrição').toString(),
              quantity: Number(item.quantity) || 0,
              source: itemSource,
              branch: itemBranch,
              last_list_match: true,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp()
            }
          });
        }
      });

      // Execute batches sequentially and close modals with delay
      try {
        for (let i = 0; i < allOps.length; i += 400) {
          const chunk = allOps.slice(i, i + 400);
          const batch = writeBatch(db);
          chunk.forEach(op => {
            if (op.type === 'update') batch.update(op.ref, op.data);
            else if (op.type === 'delete') batch.delete(op.ref);
            else batch.set(op.ref, op.data);
          });
          await batch.commit();
        }

        toast.success(`${itemsToProcess.length} itens de estoque atualizados com sucesso!`, { id: toastId });
        
        // Pequeno atraso para permitir que o React processe as atualizações do banco de dados antes de trocar os modais
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadFiles([]);
          setIsNotifyModalOpen(true);
        }, 150);
      } catch (err: any) {
        console.error('Batch commit error:', err);
        toast.error(`Erro ao salvar no banco de dados: ${err.message}`, { id: toastId });
      }
    } catch (error: any) {
      console.error('Error uploading stock:', error);
      toast.error(error.message || 'Erro ao processar arquivos de estoque.', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSendStockEmail = async () => {
    setIsSendingEmails(true);
    try {
      const selectedRoles = Object.keys(notifyRoles).filter(role => notifyRoles[role]);
      if (selectedRoles.length === 0) {
        toast.error('Por favor, selecione ao menos uma categoria de destinatários.');
        setIsSendingEmails(false);
        return;
      }

      // Fetch active users from firestore
      const usersSnap = await getDocs(collection(db, 'users'));
      const recipientsSet = new Set<string>();

      usersSnap.forEach(uDoc => {
        const uData = uDoc.data();
        if (uData.email && uData.status === 'active' && selectedRoles.includes(uData.role)) {
          recipientsSet.add(uData.email.trim().toLowerCase());
        }
      });

      // Implement rule: Always include roderbrasil@gmail.com to track status
      recipientsSet.add('roderbrasil@gmail.com');

      const recipients = Array.from(recipientsSet);

      if (recipients.length === 0) {
        toast.error('Nenhum usuário ativo encontrado nas categorias selecionadas.');
        setIsSendingEmails(false);
        return;
      }

      const tId = toast.loading(`Enviando e-mail de atualização para ${recipients.length} usuários...`);
      const res = await notifyStockUpdate(recipients, window.location.origin);
      
      if (res.success) {
        toast.success(`Notificação enviada! E-mail disparado para ${res.sent} de ${res.total} usuários ativos.`, { id: tId });
        setIsNotifyModalOpen(false);
      } else {
        toast.error('Ocorreu um erro ao enviar e-mails de notificação.', { id: tId });
      }
    } catch (error) {
      console.error('Error sending stock notification emails:', error);
      toast.error('Falha ao enviar notificações.');
    } finally {
      setIsSendingEmails(false);
    }
  };

  const handleAddManual = async () => {
    if (!newItem.code || !newItem.description || newItem.quantity < 0) {
      toast.error('Preencha todos os campos corretamente.');
      return;
    }

    try {
      await addDoc(collection(db, 'stock_items'), {
        ...newItem,
        source: 'manual',
        branch: activeTab === 'sinop' ? 'sinop' : 'matriz',
        updated_at: new Date().toISOString()
      });
      toast.success('Item adicionado manualmente!');
      setIsAddModalOpen(false);
      setNewItem({ code: '', description: '', quantity: 0 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stock_items');
      toast.error('Erro ao adicionar item.');
    }
  };

  const handleAddFAEImport = async () => {
    if (!newImportItem.description || newImportItem.quantity < 0) {
      toast.error('Preencha os campos obrigatórios corretamente.');
      return;
    }

    try {
      await addDoc(collection(db, 'stock_imports_fae'), {
        code: newImportItem.code || '',
        description: newImportItem.description,
        quantity: newImportItem.quantity,
        embarque: newImportItem.embarque || '-',
        chegada: newImportItem.chegada || '-',
        created_at: new Date().toISOString()
      });
      toast.success('Equipamento em importação adicionado!');
      setIsAddImportModalOpen(false);
      setNewImportItem({ code: '', description: '', quantity: 1, embarque: '', chegada: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stock_imports_fae');
      toast.error('Erro ao adicionar equipamento de importação.');
    }
  };

  const [importSaveMode, setImportSaveMode] = useState<'append' | 'overwrite'>('append');

  const handleMondayImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Processando imagem do Monday...');
    setIsImageAnalyzing(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const response = await fetch('/api/ocr-monday', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Data,
          mimeType: file.type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na análise de imagem do servidor.');
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.items)) {
        toast.success(`Leitura concluída! ${result.items.length} itens detectados.`, { id: toastId });
        setParsedRows(result.items);
        setIsPreviewModalOpen(true);
      } else {
        throw new Error('Nenhum item válido pôde ser extraído da planilha.');
      }
    } catch (error: any) {
      console.error('[MONDAY-OCR-UPLOAD] Error:', error);
      toast.error(error.message || 'Erro ao processar imagem.', { id: toastId });
    } finally {
      setIsImageAnalyzing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveParsedImports = async () => {
    if (parsedRows.length === 0) {
      toast.error('Nenhum item para salvar.');
      return;
    }

    const toastId = toast.loading('Salvando novos itens de importação...');
    try {
      const q = query(collection(db, 'stock_imports_fae'));
      const querySnapshot = await getDocs(q);

      if (importSaveMode === 'overwrite') {
        const batch = writeBatch(db);
        querySnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }

      const addPromises = parsedRows.map(item => {
        return addDoc(collection(db, 'stock_imports_fae'), {
          code: item.code || '',
          description: item.description,
          quantity: Number(item.quantity) || 1,
          embarque: item.embarque || '-',
          chegada: item.chegada || '-',
          created_at: new Date().toISOString()
        });
      });

      await Promise.all(addPromises);
      toast.success('Lista de importações atualizada com sucesso!', { id: toastId });
      setIsPreviewModalOpen(false);
      setParsedRows([]);
    } catch (error) {
      console.error('[SAVE-PARSED-IMPORTS] Error:', error);
      toast.error('Erro ao salvar os itens importados.', { id: toastId });
    }
  };

  const handleUpdateFAEImport = async () => {
    if (!editingImportItem) return;
    if (!editingImportItem.description || editingImportItem.quantity < 0) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    const toastId = toast.loading('Salvando alterações...');
    try {
      if (editingImportItem.id.toLowerCase().startsWith('default')) {
        setImportItems(prev => prev.map(i => i.id === editingImportItem.id ? editingImportItem : i));
        toast.success('Alterações salvas localmente!', { id: toastId });
      } else {
        await updateDoc(doc(db, 'stock_imports_fae', editingImportItem.id), {
          code: editingImportItem.code || '',
          description: editingImportItem.description,
          quantity: editingImportItem.quantity,
          embarque: editingImportItem.embarque || '-',
          chegada: editingImportItem.chegada || '-',
          updated_at: new Date().toISOString()
        });
        toast.success('Alterações salvas com sucesso!', { id: toastId });
      }
      setIsEditImportModalOpen(false);
      setEditingImportItem(null);
    } catch (error) {
      console.error('[UPDATE-FAE-IMPORT] Error:', error);
      toast.error('Erro ao atualizar equipamento de importação.', { id: toastId });
    }
  };

  const handleRegisterSale = async () => {
    if (saleData.quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero.');
      return;
    }

    const isImportFae = importItems.some(i => i.id === saleData.itemId);

    if (isImportFae) {
      const item = importItems.find(i => i.id === saleData.itemId);
      if (!item) return;

      const itemReservations = reservations
        .filter(r => r.stock_imports_fae_id === item.id && r.status === 'active')
        .reduce((acc, r) => acc + r.quantity_reserved, 0);

      if (saleData.quantity > (item.quantity - itemReservations)) {
        toast.error('Quantidade vendida não pode ser maior que o estoque disponível (descontando reservas).');
        return;
      }

      try {
        const batch = writeBatch(db);

        // 1. Create sale record
        const saleRef = doc(collection(db, 'stock_sales'));
        batch.set(saleRef, {
          stock_imports_fae_id: saleData.itemId,
          item_description: item.description,
          item_code: findCodeForDescription(item.description, items),
          quantity_sold: saleData.quantity,
          seller_uid: profile?.uid,
          seller_name: profile?.name,
          client_name: saleData.clientName,
          client_cnpj: saleData.clientCnpj,
          observation: saleData.observation,
          branch: 'importacao_fae',
          is_import_fae: true,
          created_at: serverTimestamp()
        });

        // 2. Update import quantity
        const itemRef = doc(db, 'stock_imports_fae', saleData.itemId);
        batch.update(itemRef, {
          quantity: item.quantity - saleData.quantity,
          updated_at: new Date().toISOString()
        });

        await batch.commit();
        toast.success('Venda de equipamento importado registrada com sucesso!');
        setIsSaleModalOpen(false);
        setSaleData({ itemId: '', itemDescription: '', quantity: 1, clientName: '', clientCnpj: '', observation: '' });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'stock_sales/stock_imports_fae');
        toast.error('Erro ao registrar venda.');
      }
      return;
    }

    const item = items.find(i => i.id === saleData.itemId);
    if (!item) return;

    const reservedQty = reservations
      .filter(r => r.stock_item_id === item.id && r.status === 'active')
      .reduce((acc, r) => acc + r.quantity_reserved, 0);

    if (saleData.quantity > (item.quantity - reservedQty)) {
      toast.error('Quantidade vendida não pode ser maior que o estoque disponível (descontando reservas).');
      return;
    }

    try {
      const batch = writeBatch(db);

      // 1. Create sale record
      const saleRef = doc(collection(db, 'stock_sales'));
      batch.set(saleRef, {
        stock_item_id: saleData.itemId,
        item_description: item.description,
        item_code: item.code,
        quantity_sold: saleData.quantity,
        seller_uid: profile?.uid,
        seller_name: profile?.name,
        client_name: saleData.clientName,
        client_cnpj: saleData.clientCnpj,
        observation: saleData.observation,
        branch: activeTab === 'sinop' ? 'sinop' : 'matriz',
        created_at: serverTimestamp()
      });

      // 2. Update stock quantity
      const itemRef = doc(db, 'stock_items', saleData.itemId);
      batch.update(itemRef, {
        quantity: item.quantity - saleData.quantity,
        updated_at: new Date().toISOString()
      });

      await batch.commit();
      toast.success('Venda registrada e estoque atualizado!');
      setIsSaleModalOpen(false);
      setSaleData({ itemId: '', itemDescription: '', quantity: 1, clientName: '', clientCnpj: '', observation: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'stock_sales/stock_items');
      toast.error('Erro ao registrar venda.');
    }
  };

  const handleRegisterReservation = async () => {
    if (reserveData.quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero.');
      return;
    }

    if (!reserveData.clientCnpj || !reserveData.clientName) {
      toast.error('CNPJ e Nome do Cliente são obrigatórios para reserva.');
      return;
    }

    // Password check for public users (no profile)
    if (!profile && reserveData.password !== 'roder1010') {
      toast.error('Senha de confirmação incorreta.');
      return;
    }

    const isImportFae = importItems.some(i => i.id === reserveData.itemId);

    if (isImportFae) {
      const item = importItems.find(i => i.id === reserveData.itemId);
      if (!item) return;

      const itemReservations = reservations
        .filter(r => r.stock_imports_fae_id === item.id && r.status === 'active')
        .reduce((acc, r) => acc + r.quantity_reserved, 0);

      if (reserveData.quantity > (item.quantity - itemReservations)) {
        toast.error('Quantidade para reserva não pode ser maior que o estoque disponível.');
        return;
      }

      try {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 80); // 80 years from now

        await addDoc(collection(db, 'stock_reservations'), {
          stock_imports_fae_id: reserveData.itemId,
          item_description: item.description,
          item_code: findCodeForDescription(item.description, items),
          quantity_reserved: reserveData.quantity,
          seller_uid: profile?.uid || 'public',
          seller_name: profile?.name || 'Vendedor Externo',
          client_name: reserveData.clientName,
          client_cnpj: reserveData.clientCnpj,
          observation: reserveData.observation,
          status: 'active',
          branch: 'importacao_fae',
          expires_at: Timestamp.fromDate(expiresAt),
          is_import_fae: true,
          created_at: serverTimestamp()
        });

        toast.success('Reserva de equipamento importado registrada com sucesso!');
        setIsReserveModalOpen(false);
        setReserveData({ itemId: '', itemDescription: '', quantity: 1, clientName: '', clientCnpj: '', observation: '', password: '' });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'stock_reservations');
        toast.error('Erro ao registrar reserva.');
      }
      return;
    }

    const item = items.find(i => i.id === reserveData.itemId);
    if (!item) return;

    const reservedQty = reservations
      .filter(r => r.stock_item_id === item.id && r.status === 'active')
      .reduce((acc, r) => acc + r.quantity_reserved, 0);

    if (reserveData.quantity > (item.quantity - reservedQty)) {
      toast.error('Quantidade para reserva não pode ser maior que o estoque disponível.');
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 5);

      await addDoc(collection(db, 'stock_reservations'), {
        stock_item_id: reserveData.itemId,
        item_description: item.description,
        item_code: item.code,
        quantity_reserved: reserveData.quantity,
        seller_uid: profile?.uid,
        seller_name: profile?.name,
        client_name: reserveData.clientName,
        client_cnpj: reserveData.clientCnpj,
        observation: reserveData.observation,
        status: 'active',
        branch: activeTab === 'sinop' ? 'sinop' : 'matriz',
        expires_at: Timestamp.fromDate(expiresAt),
        created_at: serverTimestamp()
      });

      toast.success('Reserva registrada com sucesso!');
      setIsReserveModalOpen(false);
      setReserveData({ itemId: '', itemDescription: '', quantity: 1, clientName: '', clientCnpj: '', observation: '', password: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stock_reservations');
      toast.error('Erro ao registrar reserva.');
    }
  };

  const openHistory = (itemId: string) => {
    const itemSales = sales.filter(s => s.stock_item_id === itemId);
    setSelectedItemSales(itemSales);
    setIsHistoryModalOpen(true);
  };

  const openReservationDetails = (itemId: string) => {
    const itemReservations = reservations.filter(r => r.stock_item_id === itemId);
    setSelectedItemReservations(itemReservations);
    setIsReservationDetailsModalOpen(true);
  };

  const saveAsImage = async () => {
    if (!stockRef.current) return;
    
    setIsGeneratingImage(true);
    const toastId = toast.loading('Gerando imagem do estoque completo...');
    
    try {
      // Create a temporary container to render ALL items for the image
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1200px'; // Fixed width for better layout in image
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '40px';
      tempContainer.className = 'bg-white text-black p-10';
      
      const header = `
        <div style="margin-bottom: 30px; border-bottom: 4px solid #000; padding-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h1 style="font-size: 32px; font-weight: 900; margin: 0;">RODER BRASIL</h1>
            <p style="font-size: 14px; color: #666; margin: 5px 0 0 0;">Relatório de Equipamentos em Estoque - ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png" style="height: 60px;" />
        </div>
      `;
      
      let content = header;
      
      const sources = [
        { id: 'roder', label: 'EQUIPAMENTOS RODER (MATRIZ)' },
        { id: 'fae', label: 'EQUIPAMENTOS FAE (MATRIZ)' },
        { id: 'accessories', label: 'ACESSÓRIOS E COMPONENTES (MATRIZ)' },
        { id: 'sinop', label: 'ESTOQUE FILIAL SINOP / MT' }
      ];
      
      sources.forEach(source => {
        const sourceItems = items.filter(i => {
          if (source.id === 'sinop') return i.branch === 'sinop';
          return i.source === source.id && i.branch !== 'sinop';
        });
        if (sourceItems.length > 0) {
          content += `
            <div style="margin-top: 40px; margin-bottom: 15px;">
              <h2 style="font-size: 20px; font-weight: 900; background: #f3f4f6; padding: 10px 15px; border-radius: 8px; color: #111;">${source.label}</h2>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-family: sans-serif;">
              <thead>
                <tr style="border-bottom: 2px solid #eee; text-align: left;">
                  <th style="padding: 12px 8px; font-size: 12px; color: #666; width: 200px;">CÓDIGO</th>
                  <th style="padding: 12px 8px; font-size: 12px; color: #666;">DESCRIÇÃO</th>
                  <th style="padding: 12px 8px; font-size: 12px; color: #666; text-align: center; width: 100px;">DISPONÍVEL</th>
                </tr>
              </thead>
              <tbody>
          `;
          
          sourceItems.forEach(item => {
            const reservedQty = reservations
              .filter(r => r.stock_item_id === item.id)
              .reduce((acc, r) => acc + r.quantity_reserved, 0);
            const available = item.quantity - reservedQty;
            
            if (available > 0) {
              content += `
                <tr style="border-bottom: 1px solid #f9f9f9;">
                  <td style="padding: 10px 8px; font-size: 13px; font-family: monospace; font-weight: bold; color: #2563eb;">${item.code}</td>
                  <td style="padding: 10px 8px; font-size: 13px; color: #333;">${item.description}</td>
                  <td style="padding: 10px 8px; font-size: 14px; font-weight: 900; text-align: center; color: ${available > 0 ? '#10b981' : '#ef4444'}">${available}</td>
                </tr>
              `;
            }
          });
          
          content += `</tbody></table>`;
        }
      });
      
      content += `
        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 11px;">
          Este documento é uma consulta em tempo real gerada pelo sistema RODER Indica.
        </div>
      `;
      
      tempContainer.innerHTML = content;
      document.body.appendChild(tempContainer);
      
      const dataUrl = await toPng(tempContainer, { quality: 0.95, backgroundColor: 'white' });
      
      const link = document.createElement('a');
      link.download = `Estoque_Roder_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      
      document.body.removeChild(tempContainer);
      toast.success('Imagem salva com sucesso!', { id: toastId });
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Erro ao gerar imagem do estoque.', { id: toastId });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const filteredImportItems = (importItems || []).filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    const cleanDesc = (item.description || '').toLowerCase();
    const cleanCode = (findCodeForDescription(item.description, items) || '').toLowerCase();
    return cleanDesc.includes(term) || cleanCode.includes(term);
  });

  const sortedImportItems = [...filteredImportItems].sort((a, b) => {
    const dateA = parseChegadaDate(a.chegada);
    const dateB = parseChegadaDate(b.chegada);
    return dateA.getTime() - dateB.getTime();
  });

  const filteredItems = (items || []).filter(item => {
    if (!searchTerm) return true;
    
    const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/);
    const itemCode = (item?.code || '').toString().toLowerCase();
    const itemDesc = (item?.description || '').toString().toLowerCase();
    const searchableText = `${itemCode} ${itemDesc}`;
    
    // Check if ALL search terms match somewhere in the text
    // We also check without spaces to handle cases like "R1000" vs "R 1000"
    return searchTerms.every(term => 
      searchableText.includes(term) || 
      searchableText.replace(/\s/g, '').includes(term)
    );
  });

  // If searching, show all that match the search AND the branch.
  // Also filter out zero stock items (unless reserved).
  const displayItems = (filteredItems || []).filter(i => {
    // 1. Branch filtering (scoped by activeTab)
    const b = (i?.branch || '').toLowerCase();
    const branchMatches = activeTab === 'sinop' ? b === 'sinop' : b !== 'sinop';
    if (!branchMatches) return false;

    // 2. Zero-quantity filtering
    const itemReservations = (reservations || [])
      .filter(r => r && r.stock_item_id === i.id && r.status === 'active');
    const reservedQtyCount = itemReservations.reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
    const availableQty = (Number(i.quantity) || 0) - reservedQtyCount;
    
    // Hide if NO available units AND NO active reservations
    // We only keep if there's physical stock OR there's a reservation.
    // However, if physical stock is 0 but someone reserved 1 (which shouldn't happen unless sync issue),
    // we keep it because user asked: "Apenas mantenha o estoque zero, caso algum usuário vier a reservar o item."
    // If availableQty is negative (sync issue or same-moment reservation), we show it.
    
    if (i.quantity <= 0 && reservedQtyCount <= 0) return false;

    return true;
  });

  const canEditQuantity = isAdmin || isManager || isInternalSeller || isTriagem || profile?.email === 'roderbrasil@gmail.com' || profile?.email === 'rogerio@roderbrasil.com.br';

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      await updateDoc(doc(db, 'stock_items', itemId), {
        quantity: newQuantity,
        updated_at: serverTimestamp()
      });
      toast.success('Quantidade atualizada com sucesso!');
      setEditingQuantityId(null);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error('Erro ao atualizar quantidade.');
    }
  };

  return (
    <Layout data-app-version="2.0.5">
      <div className="p-2.5 md:p-8 pb-28 md:pb-8 max-w-7xl mx-auto space-y-3.5 md:space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 animate-fade-in">
              <Package className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
              <h1 className="text-base md:text-2xl font-black uppercase tracking-tight text-orange-600">
                Estoque Roder
              </h1>
              <HelpTooltip content="Visualize e gerencie o estoque físico. Você pode reservar produtos ou registrar vendas diretas." />
            </div>
            
            <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1 mt-0.5">
              <MapPin className="h-2 w-2" /> {activeTab === 'sinop' ? 'Filial Sinop - Mato Grosso' : 'Central - Roder Brasil'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 lg:mt-0">
            {activeTab === 'fabrica' && (isAdmin || isManager || isInternalSeller || isTriagem || isMarketing || profile?.email === 'roderbrasil@gmail.com' || profile?.email === 'rogerio@roderbrasil.com.br') && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setIsUploadModalOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tighter text-[8px] md:text-xs h-7.5 md:h-12 px-2.5 md:px-6 rounded-md md:rounded-xl shadow-md flex items-center gap-1 transition-all hover:scale-[1.02] border border-blue-400/20"
                title="Subir novos PDFs de estoque"
              >
                <Upload className="h-3 w-3 md:h-5 md:w-5" />
                ATUALIZAR ESTOQUE (PDF)
              </Button>
            )}

            {activeTab === 'fabrica' && (isAdmin || isManager || profile?.email === 'roderbrasil@gmail.com' || profile?.email === 'rogerio@roderbrasil.com.br' || profile?.email === 'gislene@roderbrasil.com.br') && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setIsNotifyModalOpen(true)} 
                className="bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-tighter text-[8px] md:text-xs h-7.5 md:h-12 px-2.5 md:px-6 rounded-md md:rounded-xl shadow-md flex items-center gap-1 transition-all hover:scale-[1.02] border border-amber-400/20"
                title="Disparar e-mail de estoque updated para a equipe comercial"
              >
                <Mail className="h-3 w-3 md:h-5 md:w-5" />
                NOTIFICAR ESTOQUE
              </Button>
            )}

            {activeTab === 'importacao_fae' && (isAdmin || isManager || profile?.email === 'roderbrasil@gmail.com' || profile?.email === 'rogerio@roderbrasil.com.br' || profile?.email === 'gislene@roderbrasil.com.br') && (
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleMondayImageUpload} 
                />
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImageAnalyzing}
                  className="border-blue-300 hover:bg-blue-50/50 hover:border-blue-400 text-blue-700 font-extrabold uppercase tracking-tighter text-[8px] md:text-xs h-7.5 md:h-12 px-2.5 md:px-4 rounded-md md:rounded-xl shadow-sm flex items-center gap-1 transition-all hover:scale-[1.02]"
                  title="Importar imagem de planilha do Monday.com para atualizar lista"
                >
                  {isImageAnalyzing ? (
                    <Loader2 className="h-3 w-3 md:h-5 md:w-5 animate-spin" />
                  ) : (
                    <FileImage className="h-3 w-3 md:h-5 md:w-5" />
                  )}
                  IMPORTAR IMAGEM MONDAY
                </Button>

                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setIsAddImportModalOpen(true)} 
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase tracking-tighter text-[8px] md:text-xs h-7.5 md:h-12 px-2.5 md:px-4 rounded-md md:rounded-xl shadow-md flex items-center gap-1 transition-all hover:scale-[1.02] border border-yellow-350"
                  title="Adicionar equipamento de importação manualmente"
                >
                  <Plus className="h-3 w-3 md:h-5 md:w-5 mt-0.5" />
                  ADICIONAR IMPORTAÇÃO
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex flex-col gap-1 w-full">
            <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Escolha o estoque e busque produtos
            </Label>
            <div className="flex flex-col gap-1 sm:gap-2 p-1.5 sm:p-2.5 bg-slate-200/50 rounded-xl sm:rounded-2xl border border-slate-300/50 shadow-inner">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                
                <div className="hidden md:flex flex-row gap-2 w-full lg:w-auto">
                  <Button 
                    variant={activeTab === 'fabrica' ? 'default' : 'outline'} 
                    size="default"
                    onClick={() => { setActiveTab('fabrica'); }}
                    className={cn(
                      "flex-1 lg:w-[105px] h-16 md:h-[92px] lg:h-[105px] p-1.5 md:p-2 font-black uppercase tracking-widest text-[9px] md:text-[10px] lg:text-[11px] shadow-sm transition-all border-2 rounded-xl flex flex-col items-center justify-center gap-0.5 md:gap-1 text-center shrink-0",
                      activeTab === 'fabrica'
                        ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-700" 
                        : "bg-white text-slate-600 border-slate-300 hover:bg-orange-50"
                    )}
                    title="Estoque unificado da fábrica (Matriz, FAE e Acessórios)"
                  >
                    <span className="font-black text-[10px] md:text-[11px]">FÁBRICA</span>
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        "px-1 py-0.5 rounded-full text-[7.5px] md:text-[8.5px] font-bold whitespace-nowrap",
                        activeTab === 'fabrica' ? "bg-orange-850/30 text-white" : "bg-slate-100 text-slate-500 border border-slate-200"
                      )}>
                        {lastUpdates.fabrica.getTime() === 0 ? '--/--/--' : formatDate(lastUpdates.fabrica)}
                      </div>
                      <span className={cn(
                        "text-[8px] md:text-[10px] font-bold tracking-tighter opacity-80",
                        activeTab === 'fabrica' ? "text-white" : "text-green-600"
                      )}>
                        {totals.fabrica} it.
                      </span>
                    </div>
                  </Button>

                  <Button 
                    variant={activeTab === 'sinop' ? 'default' : 'outline'} 
                    size="default"
                    onClick={() => { setActiveTab('sinop'); }}
                    className={cn(
                      "flex-1 lg:w-[105px] h-16 md:h-[92px] lg:h-[105px] p-1.5 md:p-2 font-black uppercase tracking-widest text-[9px] md:text-[10px] lg:text-[11px] shadow-sm transition-all border-2 rounded-xl flex flex-col items-center justify-center gap-0.5 md:gap-1 text-center shrink-0",
                      activeTab === 'sinop'
                        ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-700" 
                        : "bg-white text-slate-600 border-slate-300 hover:bg-orange-55"
                    )}
                    title="Estoque da filial Sinop / MT"
                  >
                    <span className="font-black text-[10px] md:text-[11px]">SINOP</span>
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        "px-1 py-0.5 rounded-full text-[7.5px] md:text-[8.5px] font-bold whitespace-nowrap",
                        activeTab === 'sinop' ? "bg-orange-850/30 text-white" : "bg-slate-100 text-slate-500 border border-slate-200"
                      )}>
                        {lastUpdates.sinop.getTime() === 0 ? '--/--/--' : formatDate(lastUpdates.sinop)}
                      </div>
                      <span className={cn(
                        "text-[8px] md:text-[10px] font-bold tracking-tighter opacity-80",
                        activeTab === 'sinop' ? "text-white" : "text-green-600"
                      )}>
                        {totals.sinop} it.
                      </span>
                    </div>
                  </Button>

                  <Button 
                    variant={activeTab === 'importacao_fae' ? 'default' : 'outline'} 
                    size="default"
                    onClick={() => { setActiveTab('importacao_fae'); }}
                    className={cn(
                      "flex-1 lg:w-[130px] h-16 md:h-[92px] lg:h-[105px] p-1.5 md:p-2 font-black uppercase tracking-widest text-[9px] md:text-[10px] lg:text-[11px] shadow-sm transition-all border-2 rounded-xl flex flex-col items-center justify-center gap-0.5 md:gap-1 text-center shrink-0",
                      activeTab === 'importacao_fae'
                        ? "bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500 hover:text-black font-extrabold shadow-md" 
                        : "bg-white text-slate-600 border-slate-300 hover:bg-orange-50/50 hover:border-yellow-300"
                    )}
                    title="Equipamentos em Importação FAE"
                  >
                    <span className="font-extrabold text-[10px] md:text-[11px]">IMPORTAÇÃO FAE</span>
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        "px-1 py-0.5 rounded-full text-[7.5px] md:text-[8.5px] font-bold whitespace-nowrap",
                        activeTab === 'importacao_fae' ? "bg-yellow-500/30 text-black border border-yellow-600/30" : "bg-slate-100 text-slate-500 border border-slate-200"
                      )}>
                        Previsão
                      </div>
                      <span className={cn(
                        "text-[8px] md:text-[10px] font-bold tracking-tighter opacity-80",
                        activeTab === 'importacao_fae' ? "text-black font-black" : "text-green-600"
                      )}>
                        {importItems.length} un.
                      </span>
                    </div>
                  </Button>
                </div>

                <div className="flex-1 w-full md:max-w-[400px]">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input 
                      placeholder={activeTab === 'importacao_fae' ? 'Buscar na Importação FAE...' : activeTab === 'sinop' ? 'Buscar no Estoque Sinop...' : 'Buscar no Estoque Fábrica...'}
                      className="pl-8 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm bg-white border-2 border-slate-300 focus:border-orange-500 rounded-lg sm:rounded-xl shadow-sm transition-all font-medium w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        <div className="flex flex-col items-stretch gap-2 w-full lg:w-auto mt-2 lg:mt-0">
          {activeTab !== 'importacao_fae' && (
            <div className="grid grid-cols-3 gap-1 md:gap-2 sm:flex sm:flex-wrap items-center w-full justify-center lg:justify-end">
              <div className="flex items-center gap-0.5 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 md:h-10 w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-600/10 shadow-md font-black uppercase tracking-widest text-[8px] md:text-[10px] px-1 md:px-3"
                  onClick={saveAsImage}
                  disabled={isGeneratingImage}
                  title="Salva uma imagem do estoque atual para enviar pelo WhatsApp"
                >
                  <Save className={cn("h-3.5 w-3.5 mr-1 md:mr-2", isGeneratingImage && "animate-spin")} />
                  <span className="truncate">SALVAR</span>
                </Button>
                <HelpTooltip content="Gera uma imagem (PNG) do estoque atualizado para você compartilhar com clientes no WhatsApp ou redes sociais." />
              </div>

              {(isAdmin || isManager || isInternalSeller || isTriagem) && (
                <div className="flex items-center gap-0.5 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={() => setIsAllReservationsModalOpen(true)} className="h-8 md:h-10 w-full sm:w-auto border-amber-500 text-amber-600 hover:bg-amber-500/10 shadow-md font-black uppercase tracking-widest text-[8px] md:text-[10px] px-1 md:px-3" title="Ver todas as reservas do sistema">
                    <Bookmark className="h-3.5 w-3.5 mr-1 md:mr-2" />
                    <span className="truncate">RESERVAS</span>
                  </Button>
                  <HelpTooltip content="Abre uma lista com todas as reservas ativas no sistema para conferência e cancelamento se necessário." />
                </div>
              )}

              <div className="flex items-center gap-0.5 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 md:h-10 w-full sm:w-auto border-primary text-primary hover:bg-primary/10 gap-1 md:gap-2 shadow-md font-black uppercase tracking-widest text-[8px] md:text-[10px] px-1 md:px-3"
                  onClick={() => {
                    const url = `${window.location.origin}/stock_holder`;
                    const text = `Olá! Segue o link para consulta em tempo real dos equipamentos e acessórios em estoque na Roder Brasil (Fábrica e Sinop):\n\n${url}\n\n_Este link é atualizado automaticamente._`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    toast.success('Abrindo WhatsApp...');
                  }}
                  title="Envia o link de consulta pública para o cliente ver o estoque sozinho"
                >
                  <Share2 className="h-3.5 w-3.5 mr-1 md:mr-2" />
                  <span className="truncate">PÚBLICO</span>
                </Button>
                <HelpTooltip content="Gera uma mensagem pronta com link de consulta pública para seus clientes consultarem o estoque sozinhos." />
              </div>
            </div>
          )}
        </div>
      </div>

      <div ref={stockRef} className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden animate-fade-in">
        <div className="overflow-x-auto w-full">
          {activeTab === 'importacao_fae' ? (
              <Table className="border-collapse w-full table-fixed" translate="no">
                <TableHeader className="bg-slate-100 border-b-2 border-border/80 text-sidebar-foreground">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[60px] md:w-[90px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-slate-600 py-1 border-r border-border/50 px-1 md:px-2">Código</TableHead>
                    <TableHead className="w-[120px] md:w-[240px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-slate-600 py-1 border-r border-border/50 px-1 md:px-2">Descrição</TableHead>
                    <TableHead className="w-[45px] md:w-[70px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-slate-600 py-1 text-center border-r border-border/50 px-0.5 md:px-1 bg-primary/5">Qtd</TableHead>
                    <TableHead className="w-[65px] md:w-[110px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-slate-600 py-1 text-center border-r border-border/50 px-0.5 md:px-1">Embarque</TableHead>
                    <TableHead className="w-[65px] md:w-[110px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-slate-600 py-1 text-center border-r border-border/50 px-0.5 md:px-1 text-orange-500">Previsão</TableHead>
                    <TableHead className="w-[65px] md:w-[100px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-slate-600 py-1 text-right px-1 md:px-2">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow key="loading-import">
                      <TableCell colSpan={6} className="h-48 text-center bg-muted/10">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Carregando...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : sortedImportItems.length === 0 ? (
                    <TableRow key="empty-import-row">
                      <TableCell colSpan={6} className="h-48 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                          <AlertCircle className="h-8 w-8" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum equipamento em importação encontrado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedImportItems.map((item) => {
                      const code = item.code || findCodeForDescription(item.description, items) || '-';
                      const itemReservations = (reservations || [])
                        .filter(r => r && r.stock_imports_fae_id === item.id && r.status === 'active');
                      const reservedQty = itemReservations.reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
                      const availableQty = (Number(item.quantity) || 0) - reservedQty;

                      const itemSales = sales.filter(s => s.stock_imports_fae_id === item.id);
                      const soldQty = itemSales.reduce((acc, s) => acc + (Number(s.quantity_sold) || 0), 0);

                      const canEditCode = isAdmin || isManager || profile?.email === 'gislene@roderbrasil.com.br' || profile?.email === 'rogerio@roderbrasil.com.br' || profile?.email === 'roderbrasil@gmail.com';

                      return (
                        <TableRow 
                          key={item.id} 
                          className="hover:bg-slate-50/50 transition-colors border-b border-border/40"
                        >
                          <TableCell 
                            className="font-mono text-[8px] md:text-[9.5px] font-bold text-blue-601 py-1 sm:py-1.5 border-r border-border/30 px-1 hover:bg-blue-50 transition-colors break-all leading-tight"
                            title={canEditCode ? "Clique para editar código" : "Clique para copiar código"}
                          >
                            {editingCodeId === item.id ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <Input 
                                  className="h-6 text-[9px] w-20 bg-white border border-slate-300 font-bold p-1"
                                  value={tempCode}
                                  onChange={(e) => setTempCode(e.target.value)}
                                  autoFocus
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                      try {
                                        await updateDoc(doc(db, 'stock_imports_fae', item.id), {
                                          code: tempCode,
                                          updated_at: new Date().toISOString()
                                        });
                                        toast.success('Código updated!');
                                        setEditingCodeId(null);
                                      } catch (err) {
                                        toast.error('Erro ao salvar código.');
                                      }
                                    }
                                    if (e.key === 'Escape') setEditingCodeId(null);
                                  }}
                                />
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-5 w-5 text-emerald-500"
                                  onClick={async () => {
                                    try {
                                      await updateDoc(doc(db, 'stock_imports_fae', item.id), {
                                        code: tempCode,
                                        updated_at: new Date().toISOString()
                                      });
                                      toast.success('Código atualizado!');
                                      setEditingCodeId(null);
                                    } catch (err) {
                                      toast.error('Erro ao salvar código.');
                                    }
                                  }}
                                >
                                  <Save className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            ) : (
                              <div 
                                className="flex items-center gap-0.5 cursor-pointer"
                                onClick={() => {
                                  if (canEditCode) {
                                    setTempCode(item.code || (code === '-' ? '' : code));
                                    setEditingCodeId(item.id);
                                  } else {
                                    handleCopyCode(code);
                                  }
                                }}
                              >
                                <span>{code}</span>
                                {canEditCode && <Edit2 className="h-2 w-2 text-blue-400 opacity-60 ml-0.5" />}
                              </div>
                            )}
                          </TableCell>

                          <TableCell 
                            className="text-[8px] md:text-[10px] font-semibold py-1 sm:py-1.5 border-r border-border/30 cursor-pointer hover:text-primary transition-colors leading-tight px-1.5 break-words whitespace-normal text-slate-705 uppercase"
                            onClick={() => {
                              setSelectedDescItem({ id: item.id, code, description: item.description, quantity: item.quantity, source: 'import', branch: 'importacao', updated_at: new Date().toISOString() });
                              setIsDescDialogOpen(true);
                            }}
                          >
                            {item.description}
                          </TableCell>

                          <TableCell className="text-center py-1 border-r border-border/30 px-0.5 bg-primary/5">
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              {editingQuantityId === item.id ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Input 
                                    type="number" 
                                    className="w-10 h-6 text-center text-[9px] p-0 bg-white" 
                                    value={tempQuantity}
                                    onChange={(e) => setTempQuantity(Number(e.target.value))}
                                    autoFocus
                                    onKeyDown={async (e) => {
                                      if (e.key === 'Enter') {
                                        try {
                                          await updateDoc(doc(db, 'stock_imports_fae', item.id), {
                                            quantity: tempQuantity,
                                            updated_at: new Date().toISOString()
                                          });
                                          toast.success('Quantidade atualizada!');
                                          setEditingQuantityId(null);
                                        } catch (error) {
                                          toast.error('Erro ao atualizar quantidade.');
                                        }
                                      }
                                      if (e.key === 'Escape') setEditingQuantityId(null);
                                    }}
                                  />
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-5 w-5 text-emerald-500" 
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, 'stock_imports_fae', item.id), {
                                          quantity: tempQuantity,
                                          updated_at: new Date().toISOString()
                                        });
                                        toast.success('Quantidade atualizada!');
                                        setEditingQuantityId(null);
                                      } catch (error) {
                                        toast.error('Erro ao atualizar quantidade.');
                                      }
                                    }}
                                  >
                                    <Save className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center leading-none py-0.5">
                                  <div className="flex items-center gap-0.5 text-[8.5px] md:text-[10px]">
                                    <span className="text-slate-505 font-bold">
                                      {item.quantity}
                                    </span>
                                    {canEditQuantity && (
                                      <button 
                                        onClick={() => {
                                          setTempQuantity(item.quantity);
                                          setEditingQuantityId(item.id);
                                        }}
                                        className="text-[7px] text-primary hover:underline font-black uppercase tracking-tighter"
                                      >
                                        [edit]
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                              {reservedQty > 0 && (
                                <button 
                                  onClick={() => {
                                    setSelectedItemReservations(itemReservations);
                                    setIsReservationDetailsModalOpen(true);
                                  }}
                                  className="text-[6.5px] md:text-[7.5px] font-semibold text-amber-700 bg-amber-500/10 px-1 py-0.5 rounded flex items-center gap-0.5 mt-0.5"
                                  title={`Reservados: ${reservedQty}`}
                                >
                                  <Bookmark className="h-2 w-2 text-amber-500 animate-pulse" /> {reservedQty} res.
                                </button>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-center py-1 sm:py-1.5 border-r border-border/30 px-1 font-mono text-[8px] md:text-[9.5px] font-semibold text-slate-600 leading-tight break-words">
                            {item.embarque || '-'}
                          </TableCell>

                          <TableCell className="text-center py-1 sm:py-1.5 px-1 font-mono text-[8px] md:text-[9.5px] font-black text-orange-600 leading-tight break-words">
                            {item.chegada || '-'}
                          </TableCell>

                          <TableCell className="text-right py-1 px-1">
                            <div className="flex items-center justify-end gap-1">
                              {(isAdmin || isManager) && (
                                <div className="flex items-center gap-1 justify-end">
                                  {deletingItemId === item.id ? (
                                    <>
                                      <Button
                                        variant="destructive"
                                        size="xs"
                                        className="h-7 py-0 px-2 text-[8px] font-black uppercase rounded bg-red-600 hover:bg-red-700 text-white"
                                        onClick={async () => {
                                          const toastId = toast.loading('Removendo...');
                                          try {
                                            if (item.id.toLowerCase().startsWith('default')) {
                                              setImportItems(prev => prev.filter(i => i.id !== item.id));
                                              toast.success('Removido!', { id: toastId });
                                            } else {
                                              await deleteDoc(doc(db, 'stock_imports_fae', item.id));
                                              toast.success('Removido!', { id: toastId });
                                            }
                                          } catch (error) {
                                            toast.error('Erro ao excluir.', { id: toastId });
                                          } finally {
                                            setDeletingItemId(null);
                                          }
                                        }}
                                      >
                                        Excluir
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="xs"
                                        className="h-7 py-0 px-1 text-[8px] font-black uppercase rounded border border-slate-200 hover:bg-slate-50 text-slate-500"
                                        onClick={() => setDeletingItemId(null)}
                                      >
                                        Não
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-slate-400 hover:text-blue-500 hover:bg-slate-50 rounded-lg border border-slate-200"
                                        onClick={() => {
                                          setEditingImportItem(item);
                                          setIsEditImportModalOpen(true);
                                        }}
                                        title="EDITAR LINHA"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg border border-slate-200"
                                        onClick={() => setDeletingItemId(item.id)}
                                        title="EXCLUIR LINHA"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table className="border-collapse w-full table-fixed" translate="no">
                <TableHeader className="bg-slate-100 border-b-2 border-border/80 text-sidebar-foreground">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[70px] md:w-[105px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-slate-600 py-1 border-r border-border/50 px-1 md:px-2">Código</TableHead>
                    <TableHead className="w-[125px] md:w-[325px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-slate-600 py-1 border-r border-border/50 px-1 md:px-2">Descrição</TableHead>
                    <TableHead className="w-[55px] md:w-[100px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-slate-600 py-1 text-center border-r border-border/50 px-0.5 md:px-1 bg-primary/5">Quant/Disp</TableHead>
                    <TableHead className="hidden md:table-cell lg:w-[50px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-slate-600 py-1 text-center border-r border-border/50 px-0.5 md:px-1">Vend.</TableHead>
                    <TableHead className="w-[65px] md:w-[140px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-slate-600 py-1 text-right px-1 md:px-2">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow key="loading-row">
                      <TableCell colSpan={5} className="h-48 text-center bg-muted/10">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Carregando...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (displayItems || []).length === 0 ? (
                    <TableRow key="empty-row">
                      <TableCell colSpan={5} className="h-48 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                          <AlertCircle className="h-8 w-8" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum item encontrado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (displayItems || []).filter(item => item && item.id).map((item) => {
                        const soldQty = sales
                          .filter(s => s && s.item_code === item.code)
                          .reduce((acc, s) => acc + (Number(s.quantity_sold) || 0), 0);
                        
                        const originalDescription = (item.description || 'Sem descrição').replace(/SHANFROL/g, 'FLORESTAL').replace(/Shanfrol/g, 'Florestal');
                        const description = normalizeDescription(originalDescription);
                        const code = item.code || '-';
      
                        const itemReservations = (reservations || [])
                          .filter(r => r && r.stock_item_id === item.id);
                        
                        const reservedQty = itemReservations
                          .reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
                        
                        const availableQty = (Number(item.quantity) || 0) - reservedQty;
      
                        return (
                          <TableRow 
                            key={item.id} 
                            className="hover:bg-slate-50/50 transition-colors border-b border-border/40"
                          >
                            <TableCell 
                              className="font-mono text-[8px] md:text-[9.5px] font-bold text-blue-601 py-1 sm:py-1.5 border-r border-border/30 px-1 cursor-pointer hover:bg-blue-50 transition-all break-all leading-tight"
                              onClick={() => handleCopyCode(code)}
                              title="Clique para copiar código"
                            >
                              <span>{code}</span>
                            </TableCell>
                            
                            <TableCell 
                              className="text-[8px] md:text-[10px] font-semibold py-1 sm:py-1.5 border-r border-border/30 cursor-pointer hover:text-primary transition-all leading-tight px-1.5 break-words whitespace-normal text-slate-705"
                              onClick={() => {
                                setSelectedDescItem({ ...item, code, description });
                                setIsDescDialogOpen(true);
                              }}
                            >
                              <span className="break-words whitespace-normal block uppercase" title={description}>{description}</span>
                            </TableCell>
                            
                            <TableCell className="text-center py-1 border-r border-border/30 px-0.5 bg-primary/5">
                              <div className="flex flex-col items-center justify-center gap-1">
                                {editingQuantityId === item.id ? (
                                  <div key={`edit-qty-wrapper-${item.id}`} className="flex items-center justify-center gap-1">
                                    <Input 
                                      type="number" 
                                      className="w-10 h-6 text-center text-[9px] p-0 bg-white" 
                                      value={tempQuantity}
                                      onChange={(e) => setTempQuantity(Number(e.target.value))}
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUpdateQuantity(item.id, tempQuantity);
                                        if (e.key === 'Escape') setEditingQuantityId(null);
                                      }}
                                    />
                                    <Button size="icon" variant="ghost" className="h-5 w-5 text-emerald-500" onClick={() => handleUpdateQuantity(item.id, tempQuantity)}>
                                      <Save className="h-2.5 w-2.5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center leading-none py-0.5">
                                    <div className="flex items-center gap-0.5 text-[8.5px] md:text-[10px]">
                                      <span className="text-slate-500 font-bold">
                                        {item.quantity}
                                      </span>
                                      {canEditQuantity && (
                                        <button 
                                          onClick={() => {
                                            setTempQuantity(item.quantity);
                                            setEditingQuantityId(item.id);
                                          }}
                                          className="text-[7.5px] text-primary hover:underline font-black uppercase tracking-tighter"
                                        >
                                          [edit]
                                        </button>
                                      )}
                                    </div>
                                    
                                    <span className={cn(
                                      "text-[8px] md:text-[10px] font-black px-1 py-0.5 rounded-md mt-0.5 shrink-0 inline-block",
                                      availableQty > 0 ? "bg-emerald-600 text-white" : "bg-red-100 text-red-600"
                                    )}>
                                      {availableQty} Disp.
                                    </span>
                                  </div>
                                )}
                                
                                {reservedQty > 0 && (
                                  <button 
                                    onClick={() => openReservationDetails(item.id)}
                                    className="text-[6.5px] font-semibold text-amber-700 bg-amber-500/10 px-1 py-0.5 rounded flex items-center gap-0.5 mt-0.5"
                                    title={`Reservados: ${reservedQty}`}
                                  >
                                    <Bookmark className="h-2 w-2 text-amber-500" /> {reservedQty} res.
                                  </button>
                                )}
                              </div>
                            </TableCell>
                            
                            <TableCell className="hidden md:table-cell text-center py-1 border-r border-border/30 px-0.5">
                              {soldQty > 0 ? (
                                <span className="text-amber-600 font-black text-[9px] md:text-[10px]">
                                  {soldQty}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/20">-</span>
                              )}
                            </TableCell>
                            
                            <TableCell className="text-right py-1 px-1">
                              <div className="flex flex-wrap items-center justify-end gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 border-amber-500/20 hover:bg-amber-500/10 text-amber-600"
                                  disabled={availableQty <= 0}
                                  onClick={() => {
                                    setReserveData({
                                      itemId: item.id,
                                      itemDescription: item.description,
                                      quantity: 1,
                                      clientName: '',
                                      clientCnpj: '',
                                      observation: '',
                                      password: ''
                                    });
                                    setIsReserveModalOpen(true);
                                  }}
                                  title="RESERVAR"
                                >
                                  <Bookmark className="h-3.5 w-3.5" />
                                </Button>
    
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 border-green-500/20 hover:bg-green-500/10 text-green-600"
                                  disabled={availableQty <= 0}
                                  onClick={() => {
                                    setSaleData({
                                      itemId: item.id,
                                      itemDescription: item.description,
                                      quantity: 1,
                                      clientName: '',
                                      clientCnpj: '',
                                      observation: ''
                                    });
                                    setIsSaleModalOpen(true);
                                  }}
                                  title="VENDER"
                                >
                                  <ShoppingCart className="h-3.5 w-3.5" />
                                </Button>
    
                                {(isAdmin || isManager) && (
                                  <div className="flex items-center gap-1 justify-end">
                                    {deletingItemId === item.id ? (
                                      <>
                                        <Button
                                          variant="destructive"
                                          size="xs"
                                          className="h-7 py-0 px-2 text-[8px] font-black uppercase rounded bg-red-600 hover:bg-red-700 text-white"
                                          onClick={async () => {
                                            const toastId = toast.loading('Removendo...');
                                            try {
                                              const itemRef = doc(db, 'stock_items', item.id);
                                              const itemSnap = await getDocs(query(collection(db, 'stock_items'), where('__name__', '==', item.id)));
                                              const itemData = itemSnap.docs[0]?.data();
                                              
                                              if (!itemData) throw new Error('Item não encontrado');
                          
                                              const encryptedData = await CryptoService.encrypt(itemData);
                          
                                              await addDoc(collection(db, 'trash_bin'), {
                                                original_id: item.id,
                                                collection: 'stock_items',
                                                entity_name: item.description,
                                                entity_type: 'Item de Estoque',
                                                data_encrypted: encryptedData,
                                                deleted_at: new Date().toISOString(),
                                                deleted_by_name: profile?.name || auth?.currentUser?.email || 'Sistema',
                                                deleted_by_uid: auth?.currentUser?.uid || ''
                                              });
                          
                                              await deleteDoc(itemRef);
                                              toast.success('Removido com sucesso.', { id: toastId });
                                            } catch (error: any) {
                                              toast.error('Erro ao excluir: ' + error.message, { id: toastId });
                                            } finally {
                                              setDeletingItemId(null);
                                            }
                                          }}
                                        >
                                          Excluir
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="xs"
                                          className="h-7 py-0 px-1 text-[8px] font-black uppercase rounded border border-slate-200 hover:bg-slate-50 text-slate-500"
                                          onClick={() => setDeletingItemId(null)}
                                        >
                                          Não
                                        </Button>
                                      </>
                                    ) : (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-slate-400 hover:text-red-500"
                                        onClick={() => setDeletingItemId(item.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Mobile-First Custom Cards View (scroll-free bento) - Hidden as requested */}
        <div className="hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-widest">Carregando estoque...</p>
            </div>
          ) : activeTab === 'importacao_fae' ? (
            sortedImportItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2 bg-white rounded-xl border border-slate-100 p-4">
                <AlertCircle className="h-8 w-8 mx-auto opacity-55 text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-wider">Nenhum equipamento na importação</p>
              </div>
            ) : (
              sortedImportItems.map((item) => {
                const code = item.code || findCodeForDescription(item.description, items) || '-';
                const itemReservations = (reservations || [])
                  .filter(r => r && r.stock_imports_fae_id === item.id && r.status === 'active');
                const reservedQty = itemReservations.reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
                const availableQty = (Number(item.quantity) || 0) - reservedQty;

                const canEditCode = isAdmin || isManager || profile?.email === 'gislene@roderbrasil.com.br' || profile?.email === 'rogerio@roderbrasil.com.br' || profile?.email === 'roderbrasil@gmail.com';

                return (
                  <div key={`mob-imp-${item.id}`} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-slate-300 transition-all">
                    {/* Top Row: Code Badge & Status */}
                    <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-100">
                      {editingCodeId === item.id ? (
                        <div className="flex items-center gap-1">
                          <Input 
                            className="h-6 text-[10px] w-28 bg-white border border-slate-300 font-bold"
                            value={tempCode}
                            onChange={(e) => setTempCode(e.target.value)}
                            autoFocus
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                try {
                                  await updateDoc(doc(db, 'stock_imports_fae', item.id), {
                                    code: tempCode,
                                    updated_at: new Date().toISOString()
                                  });
                                  toast.success('Código atualizado!');
                                  setEditingCodeId(null);
                                } catch (err) {
                                  toast.error('Erro ao salvar código.');
                                }
                              }
                              if (e.key === 'Escape') setEditingCodeId(null);
                            }}
                          />
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-5 w-5 text-emerald-500"
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'stock_imports_fae', item.id), {
                                  code: tempCode,
                                  updated_at: new Date().toISOString()
                                });
                                toast.success('Código atualizado!');
                                setEditingCodeId(null);
                              } catch (err) {
                                toast.error('Erro ao salvar código.');
                              }
                            }}
                          >
                            <Save className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ) : (
                        <span 
                          onClick={() => {
                            if (canEditCode) {
                              setTempCode(item.code || (code === '-' ? '' : code));
                              setEditingCodeId(item.id);
                            } else {
                              handleCopyCode(code);
                            }
                          }}
                          className={cn(
                            "font-mono text-[11px] font-black text-blue-600 bg-blue-50 border border-blue-105 px-2 py-0.5 rounded-md cursor-pointer active:scale-[0.98] transition-all flex items-center gap-0.5",
                            canEditCode && "hover:bg-blue-100"
                          )}
                          title={canEditCode ? "Clique para editar código" : "Copiar Código"}
                        >
                          {code}
                          {canEditCode && <Edit2 className="h-2 w-2 text-blue-400 opacity-60 ml-0.5" />}
                        </span>
                      )}
                      
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded-md text-white font-mono",
                        availableQty > 0 ? "bg-emerald-600" : "bg-red-600"
                      )}>
                        {availableQty} Disp. ({item.quantity} un)
                      </span>
                    </div>

                    {/* Middle: Product Line */}
                    <div className="py-2">
                      <p className="text-xs font-black text-slate-800 leading-snug uppercase">
                        {item.description}
                      </p>

                      {/* Editing Inline for Managers/Admins */}
                      {editingQuantityId === item.id ? (
                        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-lg mt-2">
                          <Input 
                            type="number" 
                            className="w-16 h-7 text-center text-xs p-0 bg-white border border-slate-300 text-slate-900 font-bold" 
                            value={tempQuantity}
                            onChange={(e) => setTempQuantity(Number(e.target.value))}
                            autoFocus
                          />
                          <Button 
                            className="h-7 bg-emerald-600 px-2 text-white font-bold text-[10px] hover:bg-emerald-700"
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'stock_imports_fae', item.id), { quantity: tempQuantity });
                                toast.success('Quantidade atualizada!');
                                setEditingQuantityId(null);
                              } catch (error) {
                                toast.error('Erro ao atualizar quantidade.');
                              }
                            }}
                          >
                            SALVAR
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-slate-400"
                            onClick={() => setEditingQuantityId(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : canEditQuantity && (
                        <button 
                          onClick={() => {
                            setTempQuantity(item.quantity);
                            setEditingQuantityId(item.id);
                          }}
                          className="text-[8.5px] text-primary hover:underline font-black uppercase mt-1 inline-block"
                        >
                          [Mudar Quantidade]
                        </button>
                      )}
                    </div>

                    {/* Pending Reservations List */}
                    {itemReservations.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 my-1.5 space-y-1">
                        <button 
                          onClick={() => {
                            setSelectedItemReservations(itemReservations);
                            setIsReservationDetailsModalOpen(true);
                          }}
                          className="text-[8.5px] font-black text-amber-800 flex items-center justify-between w-full hover:underline"
                        >
                          <span className="flex items-center gap-1">
                            <Bookmark className="h-3 w-3 fill-amber-500 text-amber-500" />
                            {reservedQty} Reservado{reservedQty > 1 ? 's' : ''} (Ativo)
                          </span>
                          <span className="text-[8px] uppercase font-bold text-amber-500 bg-white border border-amber-200 px-1 rounded">Ver todos ›</span>
                        </button>
                      </div>
                    )}

                    {/* Dates Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] py-2 border-t border-b border-dashed border-slate-100 bg-slate-50 -mx-3 px-3 my-1">
                      <div>
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Embarque</span>
                        <span className="font-mono font-bold text-slate-700">{item.embarque || '--/--/----'}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-orange-400 uppercase tracking-wider font-mono">Previsão</span>
                        <span className="font-mono font-black text-orange-600">{item.chegada || '--/--/----'}</span>
                      </div>
                    </div>

                    {/* Buttons Row */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="xs" 
                        className="h-8 flex-1 border-amber-400 text-amber-700 font-extrabold text-[10px] uppercase flex items-center justify-center gap-1 rounded-lg bg-amber-50/20 hover:bg-amber-100"
                        disabled={availableQty <= 0}
                        onClick={() => {
                          setReserveData({
                            itemId: item.id,
                            itemDescription: item.description,
                            quantity: 1,
                            clientName: '',
                            clientCnpj: '',
                            observation: '',
                            password: ''
                          });
                          setIsReserveModalOpen(true);
                        }}
                      >
                        <Bookmark className="h-3 w-3" /> RESERVAR
                      </Button>

                      <Button 
                        variant="outline" 
                        size="xs" 
                        className="h-8 flex-1 border-emerald-500 text-emerald-800 font-extrabold text-[10px] uppercase flex items-center justify-center gap-1 rounded-lg bg-emerald-50/20 hover:bg-emerald-100"
                        disabled={availableQty <= 0}
                        onClick={() => {
                          setSaleData({
                            itemId: item.id,
                            itemDescription: item.description,
                            quantity: 1,
                            clientName: '',
                            clientCnpj: '',
                            observation: ''
                          });
                          setIsSaleModalOpen(true);
                        }}
                      >
                        <ShoppingCart className="h-3 w-3" /> VENDER
                      </Button>

                      {(isAdmin || isManager) && (
                        <div className="flex items-center gap-1">
                          {deletingItemId === item.id ? (
                            <>
                              <Button
                                variant="destructive"
                                size="xs"
                                className="h-8 py-0 px-2 text-[9px] font-black uppercase rounded-lg bg-red-600 hover:bg-red-700 text-white"
                                onClick={async () => {
                                  const toastId = toast.loading('Removendo...');
                                  try {
                                    if (item.id.toLowerCase().startsWith('default')) {
                                      setImportItems(prev => prev.filter(i => i.id !== item.id));
                                      toast.success('Removido!', { id: toastId });
                                    } else {
                                      await deleteDoc(doc(db, 'stock_imports_fae', item.id));
                                      toast.success('Removido!', { id: toastId });
                                    }
                                  } catch (error) {
                                    toast.error('Erro ao excluir.', { id: toastId });
                                  } finally {
                                    setDeletingItemId(null);
                                  }
                                }}
                              >
                                Excluir
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                className="h-8 py-0 px-2 text-[9px] font-black uppercase rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
                                onClick={() => setDeletingItemId(null)}
                              >
                                Não
                              </Button>
                            </>
                          ) : (
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-slate-50 rounded-lg border border-slate-200"
                                onClick={() => {
                                  setEditingImportItem(item);
                                  setIsEditImportModalOpen(true);
                                }}
                                title="Editar"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg border border-slate-200"
                                onClick={() => setDeletingItemId(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            (displayItems || []).length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2 bg-white rounded-xl border border-slate-100 p-4">
                <AlertCircle className="h-8 w-8 mx-auto opacity-55 text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-wider">Nenhum equipamento em estoque</p>
              </div>
            ) : (
              (displayItems || []).filter(item => item && item.id).map((item) => {
                const soldQty = sales
                  .filter(s => s && s.item_code === item.code)
                  .reduce((acc, s) => acc + (Number(s.quantity_sold) || 0), 0);
                
                const originalDescription = (item.description || 'Sem descrição').replace(/SHANFROL/g, 'FLORESTAL').replace(/Shanfrol/g, 'Florestal');
                const description = normalizeDescription(originalDescription);
                const code = item.code || '-';

                const itemReservations = (reservations || [])
                  .filter(r => r && r.stock_item_id === item.id);
                
                const reservedQty = itemReservations
                  .reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
                
                const availableQty = (Number(item.quantity) || 0) - reservedQty;

                return (
                  <div key={`mob-std-${item.id}`} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-slate-300 transition-all">
                    {/* Top Row: Code Badge & Status */}
                    <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-100">
                      <span 
                        onClick={() => handleCopyCode(code)}
                        className="font-mono text-[11px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md cursor-pointer active:scale-[0.98] transition-all"
                        title="Copiar Código"
                      >
                        {code}
                      </span>
                      
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded-md text-white font-mono",
                        availableQty > 0 ? "bg-emerald-600" : "bg-red-600"
                      )}>
                        {availableQty} Disp. ({item.quantity} un)
                      </span>
                    </div>

                    {/* Middle: Product Line */}
                    <div className="py-2">
                      <p className="text-xs font-black text-slate-800 leading-snug uppercase">
                        {description}
                      </p>

                      {/* Sold indication */}
                      {soldQty > 0 && (
                        <p className="text-[9px] font-extrabold text-blue-500 uppercase mt-0.5">
                          ✓ {soldQty} vendida(s) registrada(s)
                        </p>
                      )}

                      {/* Editing Inline for Managers/Admins */}
                      {editingQuantityId === item.id ? (
                        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-lg mt-2">
                          <Input 
                            type="number" 
                            className="w-16 h-7 text-center text-xs p-0 bg-white border border-slate-300 text-slate-900 font-bold" 
                            value={tempQuantity}
                            onChange={(e) => setTempQuantity(Number(e.target.value))}
                            autoFocus
                          />
                          <Button 
                            className="h-7 bg-emerald-600 px-2 text-white font-bold text-[10px] hover:bg-emerald-700"
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'stock_items', item.id), { quantity: tempQuantity });
                                toast.success('Quantidade atualizada!');
                                setEditingQuantityId(null);
                              } catch (error) {
                                toast.error('Erro ao atualizar quantidade.');
                              }
                            }}
                          >
                            SALVAR
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-slate-400"
                            onClick={() => setEditingQuantityId(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : canEditQuantity && (
                        <button 
                          onClick={() => {
                            setTempQuantity(item.quantity);
                            setEditingQuantityId(item.id);
                          }}
                          className="text-[8.5px] text-primary hover:underline font-black uppercase mt-1 inline-block"
                        >
                          [Mudar Quantidade]
                        </button>
                      )}
                    </div>

                    {/* Pending Reservations List */}
                    {itemReservations.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 my-1.5 space-y-1">
                        <button 
                          onClick={() => {
                            setSelectedItemReservations(itemReservations);
                            setIsReservationDetailsModalOpen(true);
                          }}
                          className="text-[8.5px] font-black text-amber-800 flex items-center justify-between w-full hover:underline"
                        >
                          <span className="flex items-center gap-1">
                            <Bookmark className="h-3 w-3 fill-amber-500 text-amber-500" />
                            {reservedQty} Reservado{reservedQty > 1 ? 's' : ''} (Ativo)
                          </span>
                          <span className="text-[8px] uppercase font-bold text-amber-500 bg-white border border-amber-200 px-1 rounded">Ver todos ›</span>
                        </button>
                      </div>
                    )}

                    {/* Buttons Row */}
                    <div className="flex items-center gap-2 pt-2 border-t border-dashed border-slate-100">
                      <Button 
                        variant="outline" 
                        size="xs" 
                        className="h-8 flex-1 border-amber-400 text-amber-700 font-extrabold text-[10px] uppercase flex items-center justify-center gap-1 rounded-lg bg-amber-50/20 hover:bg-amber-100"
                        disabled={availableQty <= 0}
                        onClick={() => {
                          setReserveData({
                            itemId: item.id,
                            itemDescription: item.description,
                            quantity: 1,
                            clientName: '',
                            clientCnpj: '',
                            observation: '',
                            password: ''
                          });
                          setIsReserveModalOpen(true);
                        }}
                      >
                        <Bookmark className="h-3 w-3" /> RESERVAR
                      </Button>

                      <Button 
                        variant="outline" 
                        size="xs" 
                        className="h-8 flex-1 border-emerald-500 text-emerald-800 font-extrabold text-[10px] uppercase flex items-center justify-center gap-1 rounded-lg bg-emerald-50/20 hover:bg-emerald-100"
                        disabled={availableQty <= 0}
                        onClick={() => {
                          setSaleData({
                            itemId: item.id,
                            itemDescription: item.description,
                            quantity: 1,
                            clientName: '',
                            clientCnpj: '',
                            observation: ''
                          });
                          setIsSaleModalOpen(true);
                        }}
                      >
                        <ShoppingCart className="h-3 w-3" /> VENDER
                      </Button>

                      {(isAdmin || isManager) && (
                        <div className="flex items-center gap-1">
                          {deletingItemId === item.id ? (
                            <>
                              <Button
                                variant="destructive"
                                size="xs"
                                className="h-8 py-0 px-2 text-[9px] font-black uppercase rounded-lg bg-red-600 hover:bg-red-700 text-white"
                                onClick={async () => {
                                  const toastId = toast.loading('Removendo...');
                                  try {
                                    const itemRef = doc(db, 'stock_items', item.id);
                                    const itemSnap = await getDocs(query(collection(db, 'stock_items'), where('__name__', '==', item.id)));
                                    const itemData = itemSnap.docs[0]?.data();
                                    if (!itemData) throw new Error('Item não encontrado');
                                    const encryptedData = await CryptoService.encrypt(itemData);
                                    await addDoc(collection(db, 'trash_bin'), {
                                      original_id: item.id,
                                      collection: 'stock_items',
                                      entity_name: item.description,
                                      entity_type: 'Item de Estoque',
                                      data_encrypted: encryptedData,
                                      deleted_at: new Date().toISOString(),
                                      deleted_by_name: profile?.name || auth?.currentUser?.email || 'Sistema',
                                      deleted_by_uid: auth?.currentUser?.uid || ''
                                    });
                                    await deleteDoc(itemRef);
                                    toast.success('Removido com sucesso.', { id: toastId });
                                  } catch (error: any) {
                                    toast.error('Erro ao excluir: ' + error.message, { id: toastId });
                                  } finally {
                                    setDeletingItemId(null);
                                  }
                                }}
                              >
                                Excluir
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                className="h-8 py-0 px-2 text-[9px] font-black uppercase rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
                                onClick={() => setDeletingItemId(null)}
                              >
                                Não
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg border border-slate-200"
                              onClick={() => setDeletingItemId(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Atualizar Estoque Semanal
            </DialogTitle>
            <DialogDescription>
              Carregue os novos relatórios em PDF. Os dados anteriores serão substituídos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Relatórios de Estoque (PDFs)</Label>
              <div className="flex flex-col gap-3">
                <Input 
                  type="file" 
                  accept=".pdf" 
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setUploadFiles(prev => [...prev, ...files]);
                  }}
                  className="cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-3 file:py-2 file:mr-3 file:text-xs file:font-bold h-12"
                />
                
                {uploadFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {uploadFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs font-medium truncate">{file.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-red-500 hover:bg-red-500/10" 
                          onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-[10px] text-red-500 h-auto p-0" 
                      onClick={() => setUploadFiles([])}
                    >
                      Limpar todos
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="text-xs text-amber-700 leading-relaxed">
                <span className="font-bold block mb-1">Atenção:</span>
                Ao clicar em salvar, a IA identificará automaticamente se o relatório é da Roder, FAE, Acessórios ou Sinop. 
                Os itens dessas categorias serão substituídos pelos novos dados.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading || uploadFiles.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Salvar e Atualizar</span>
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Adicionar Item Manualmente</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Código (Padrão Roder)</Label>
              <Input 
                placeholder="0000.0000.0000.0000"
                value={newItem.code}
                onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input 
                placeholder="Nome do equipamento"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantidade Inicial</Label>
              <Input 
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddManual}>Salvar Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAE Import Manual Add Modal */}
      <Dialog open={isAddImportModalOpen} onOpenChange={setIsAddImportModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Adicionar Equipamento para Importação FAE</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Código do Equipamento (Opcional)</Label>
              <Input 
                placeholder="Ex CO.0152"
                value={newImportItem.code}
                onChange={(e) => setNewImportItem({ ...newImportItem, code: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição / Nome do Equipamento*</Label>
              <Input 
                placeholder="Ex FAE UML/S/EX/VT-125"
                value={newImportItem.description}
                onChange={(e) => setNewImportItem({ ...newImportItem, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Quantidade Física*</Label>
              <Input 
                type="number"
                min="1"
                value={newImportItem.quantity}
                onChange={(e) => setNewImportItem({ ...newImportItem, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Embarque</Label>
              <Input 
                placeholder="Ex: 12 out, 2026"
                value={newImportItem.embarque}
                onChange={(e) => setNewImportItem({ ...newImportItem, embarque: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Previsão de Chegada</Label>
              <Input 
                placeholder="Ex: 19 dez, 2026"
                value={newImportItem.chegada}
                onChange={(e) => setNewImportItem({ ...newImportItem, chegada: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddImportModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddFAEImport} className="bg-yellow-400 text-black hover:bg-yellow-500 font-extrabold">Salvar Importação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAE Import Line Edit Modal */}
      <Dialog open={isEditImportModalOpen} onOpenChange={setIsEditImportModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar Equipamento de Importação FAE</DialogTitle>
          </DialogHeader>
          
          {editingImportItem && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Código do Equipamento</Label>
                <Input 
                  placeholder="Ex CO.0152"
                  value={editingImportItem.code || ''}
                  onChange={(e) => setEditingImportItem({ ...editingImportItem, code: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição / Nome do Equipamento*</Label>
                <Input 
                  placeholder="Ex FAE UML/S/EX/VT-125"
                  value={editingImportItem.description}
                  onChange={(e) => setEditingImportItem({ ...editingImportItem, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Quantidade Física*</Label>
                <Input 
                  type="number"
                  min="0"
                  value={editingImportItem.quantity}
                  onChange={(e) => setEditingImportItem({ ...editingImportItem, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Embarque</Label>
                <Input 
                  placeholder="Ex: 12 out, 2026"
                  value={editingImportItem.embarque || ''}
                  onChange={(e) => setEditingImportItem({ ...editingImportItem, embarque: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Previsão de Chegada</Label>
                <Input 
                  placeholder="Ex: 19 dez, 2026"
                  value={editingImportItem.chegada || ''}
                  onChange={(e) => setEditingImportItem({ ...editingImportItem, chegada: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditImportModalOpen(false); setEditingImportItem(null); }}>Cancelar</Button>
            <Button onClick={handleUpdateFAEImport} className="bg-yellow-400 text-black hover:bg-yellow-500 font-extrabold">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OCR Preview Checklist Dialog */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <FileImage className="h-5 w-5" />
              Confirmação de Importação do Monday
            </DialogTitle>
            <DialogDescription>
              A IA analisou os itens da planilha com sucesso. Revise e edite os valores abaixo antes de salvar definitivamente no estoque de importação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <span className="text-[11px] font-bold text-blue-800 uppercase">Modo de Gravação:</span>
              <div className="flex gap-2">
                <Button
                  size="xs"
                  variant={importSaveMode === 'append' ? 'default' : 'outline'}
                  onClick={() => setImportSaveMode('append')}
                  className={cn(
                    "text-[10px] font-bold rounded-lg uppercase",
                    importSaveMode === 'append' && "bg-blue-600 hover:bg-blue-700 text-white"
                  )}
                >
                  Adicionar à lista atual
                </Button>
                <Button
                  size="xs"
                  variant={importSaveMode === 'overwrite' ? 'default' : 'outline'}
                  onClick={() => setImportSaveMode('overwrite')}
                  className={cn(
                    "text-[10px] font-bold rounded-lg uppercase",
                    importSaveMode === 'overwrite' && "bg-red-600 hover:bg-red-700 text-white"
                  )}
                >
                  Substituir lista atual
                </Button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[100px] font-bold text-[9px] uppercase">Código</TableHead>
                    <TableHead className="font-bold text-[9px] uppercase">Descrição / Equipamento</TableHead>
                    <TableHead className="w-[60px] text-center font-bold text-[9px] uppercase">Qtd</TableHead>
                    <TableHead className="w-[100px] text-center font-bold text-[9px] uppercase">Embarque</TableHead>
                    <TableHead className="w-[100px] text-center font-bold text-[9px] uppercase">Chegada</TableHead>
                    <TableHead className="w-[45px] text-right font-bold text-[9px] uppercase"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, idx) => (
                    <TableRow key={`ocr-row-${idx}`} className="hover:bg-slate-50/50">
                      <TableCell className="p-1 font-mono">
                        <Input 
                          className="h-7 text-[10px] p-1 font-semibold"
                          value={row.code || ''}
                          onChange={(e) => {
                            const updated = [...parsedRows];
                            updated[idx].code = e.target.value;
                            setParsedRows(updated);
                          }}
                          placeholder="EX: CO.0152"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input 
                          className="h-7 text-[10px] p-1 uppercase"
                          value={row.description || ''}
                          onChange={(e) => {
                            const updated = [...parsedRows];
                            updated[idx].description = e.target.value;
                            setParsedRows(updated);
                          }}
                          placeholder="Ex FAE UML..."
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input 
                          type="number"
                          className="h-7 text-[10px] p-1 text-center font-semibold"
                          value={row.quantity || 1}
                          onChange={(e) => {
                            const updated = [...parsedRows];
                            updated[idx].quantity = parseInt(e.target.value) || 1;
                            setParsedRows(updated);
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input 
                          className="h-7 text-[10px] p-1 text-center"
                          value={row.embarque || '-'}
                          onChange={(e) => {
                            const updated = [...parsedRows];
                            updated[idx].embarque = e.target.value;
                            setParsedRows(updated);
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input 
                          className="h-7 text-[10px] p-1 text-center"
                          value={row.chegada || '-'}
                          onChange={(e) => {
                            const updated = [...parsedRows];
                            updated[idx].chegada = e.target.value;
                            setParsedRows(updated);
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-1 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded"
                          onClick={() => {
                            setParsedRows(prev => prev.filter((_, i) => i !== idx));
                          }}
                          title="Remover este item coletado"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <p className="text-[10px] text-muted-foreground text-center italic">
              * Dica: Você pode alterar qualquer campo acima diretamente na tabela antes de confirmar.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsPreviewModalOpen(false); setParsedRows([]); }} className="rounded-lg text-[11px] font-bold uppercase">
              Descartar
            </Button>
            <Button onClick={handleSaveParsedImports} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold uppercase">
              Confirmar Importação ({parsedRows.length} itens)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sale Modal */}
      <Dialog open={isSaleModalOpen} onOpenChange={setIsSaleModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-500" />
              Registrar Venda
            </DialogTitle>
            <DialogDescription className="font-bold text-foreground">
              {saleData.itemDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase">Quantidade</Label>
                <Input 
                  type="number"
                  min="1"
                  value={saleData.quantity}
                  onChange={(e) => setSaleData({ ...saleData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase">CNPJ/CPF do Cliente *</Label>
                <Input 
                  placeholder="00.000.000/0000-00"
                  value={saleData.clientCnpj}
                  onChange={(e) => setSaleData({ ...saleData, clientCnpj: e.target.value })}
                  className={cn(!saleData.clientCnpj && "border-red-500/50")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase">Nome do Cliente / Razão Social</Label>
              <Input 
                placeholder="Nome completo do cliente"
                value={saleData.clientName}
                onChange={(e) => setSaleData({ ...saleData, clientName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase">Observações Adicionais</Label>
              <Input 
                placeholder="Ex: NF 1234, Entrega programada..."
                value={saleData.observation}
                onChange={(e) => setSaleData({ ...saleData, observation: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaleModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={handleRegisterSale}
              disabled={!saleData.clientCnpj}
            >
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Histórico de Vendas</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px] mt-4">
            {selectedItemSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma venda registrada para este item.
              </div>
            ) : (
              <div className="space-y-4">
                {selectedItemSales.map((sale: any) => (
                  <div key={sale.id} className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold">{sale.seller_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {sale.created_at?.toDate ? safeFormatDate(sale.created_at.toDate(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data não disponível'}
                        </p>
                      </div>
                      <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-black">
                        -{sale.quantity_sold} UN
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-background/50 p-2 rounded border border-border/30">
                      <div>
                        <span className="text-muted-foreground uppercase font-bold block">Cliente:</span>
                        <span className="font-medium">{sale.client_name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase font-bold block">CNPJ/CPF:</span>
                        <span className="font-medium">{sale.client_cnpj || '-'}</span>
                      </div>
                    </div>
                    {sale.observation && (
                      <p className="text-xs italic text-muted-foreground bg-background p-2 rounded border border-border/50">
                        "{sale.observation}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setIsHistoryModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Full Description Dialog */}
      <Dialog open={!!viewingDescription} onOpenChange={(open) => !open && setViewingDescription(null)}>
        <DialogContent className="bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-primary">Descrição do Produto</DialogTitle>
            <DialogDescription className="font-mono text-[10px]">{viewingDescription?.code}</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <p className="text-lg font-bold leading-tight">{viewingDescription?.description}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewingDescription(null)} className="bg-primary text-white">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reserve Modal */}
      <Dialog open={isReserveModalOpen} onOpenChange={setIsReserveModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-amber-500" />
              Reservar Equipamento
            </DialogTitle>
            <DialogDescription className="font-bold text-foreground">
              {reserveData.itemDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase">Quantidade</Label>
                <Input 
                  type="number"
                  min="1"
                  value={reserveData.quantity}
                  onChange={(e) => setReserveData({ ...reserveData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase">CNPJ/CPF do Cliente *</Label>
                <Input 
                  placeholder="00.000.000/0000-00"
                  value={reserveData.clientCnpj}
                  onChange={(e) => setReserveData({ ...reserveData, clientCnpj: e.target.value })}
                  className={cn(!reserveData.clientCnpj && "border-red-500/50")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase">Nome do Cliente / Razão Social *</Label>
              <Input 
                placeholder="Nome completo do cliente"
                value={reserveData.clientName}
                onChange={(e) => setReserveData({ ...reserveData, clientName: e.target.value })}
                className={cn(!reserveData.clientName && "border-red-500/50")}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase">Observações Adicionais</Label>
              <Input 
                placeholder="Ex: Aguardando aprovação de crédito..."
                value={reserveData.observation}
                onChange={(e) => setReserveData({ ...reserveData, observation: e.target.value })}
              />
            </div>

            {!profile && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="text-orange-600 font-bold uppercase text-[10px]">Senha de Confirmação *</Label>
                <Input 
                  type="password"
                  placeholder="Digite a senha para reservar"
                  value={reserveData.password}
                  onChange={(e) => setReserveData({...reserveData, password: e.target.value})}
                  className="border-orange-500/30 focus:border-orange-500"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReserveModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700" 
              onClick={handleRegisterReservation}
              disabled={!reserveData.clientCnpj || !reserveData.clientName}
            >
              Confirmar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reservation Details Modal */}
      <Dialog open={isReservationDetailsModalOpen} onOpenChange={setIsReservationDetailsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-amber-500" />
              Reservas Ativas
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px] mt-4">
            {selectedItemReservations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma reserva ativa para este item.
              </div>
            ) : (
              <div className="space-y-4">
                {selectedItemReservations.map((res: any) => (
                  <div key={res.id} className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold">{res.seller_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {res.created_at?.toDate ? res.created_at.toDate().toLocaleString() : 'Data não disponível'}
                        </p>
                        {res.expires_at && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-500/10 w-fit px-1.5 py-0.5 rounded">
                            <Clock className="h-2.5 w-2.5" />
                            Expira em: {(() => {
                              const now = new Date().getTime();
                              const expiry = res.expires_at.toDate ? res.expires_at.toDate().getTime() : new Date(res.expires_at).getTime();
                              const diff = expiry - now;
                              if (diff <= 0) return 'Expirada';
                              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                              return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="bg-amber-500/10 text-amber-600 px-2 py-1 rounded text-xs font-black">
                          {res.quantity_reserved} UN Reservado
                        </span>
                        {(isAdmin || isManager || res.seller_uid === profile?.uid) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-[9px] text-red-500 hover:bg-red-500/10"
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'stock_reservations', res.id), {
                                  status: 'cancelled',
                                  updated_at: serverTimestamp()
                                });
                                toast.success('Reserva cancelada.');
                                setIsReservationDetailsModalOpen(false);
                              } catch (error) {
                                handleFirestoreError(error, OperationType.UPDATE, `stock_reservations/${res.id}`);
                                toast.error('Erro ao cancelar reserva.');
                              }
                            }}
                          >
                            Cancelar Reserva
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-background/50 p-2 rounded border border-border/30">
                      <div>
                        <span className="text-muted-foreground uppercase font-bold block">Cliente:</span>
                        <span className="font-medium">{res.client_name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase font-bold block">CNPJ/CPF:</span>
                        <span className="font-medium">{res.client_cnpj}</span>
                      </div>
                    </div>
                    {res.observation && (
                      <p className="text-xs italic text-muted-foreground bg-background p-2 rounded border border-border/50">
                        "{res.observation}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setIsReservationDetailsModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* All Reservations Modal */}
      <Dialog open={isAllReservationsModalOpen} onOpenChange={setIsAllReservationsModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-amber-500" />
              Gestão Geral de Reservas
            </DialogTitle>
            <DialogDescription>
              Lista completa de todos os itens atualmente bloqueados no estoque.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[500px] mt-4">
            {reservations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic">
                Nenhuma reserva ativa no sistema.
              </div>
            ) : (
              <div className="space-y-4 pr-4">
                {reservations.map((res: any) => (
                  <div key={res.id} className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase text-primary">{res.item_description}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">Cód: {res.item_code}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-sm font-bold">{res.seller_name}</p>
                          <Badge variant="outline" className="text-[8px] font-black bg-amber-500/10 text-amber-600 border-amber-500/20">
                            {res.quantity_reserved} UN
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                        <div className="text-[10px] text-muted-foreground">
                          Criada em: {res.created_at?.toDate ? res.created_at.toDate().toLocaleString('pt-BR') : 'Data não disponível'}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[10px] text-red-500 hover:bg-red-500/10 font-bold"
                          onClick={async () => {
                            if (window.confirm(`Deseja realmente cancelar a reserva de ${res.seller_name}?`)) {
                              console.log("Attempting to cancel reservation ID:", res.id);
                              try {
                                const resRef = doc(db, 'stock_reservations', res.id);
                                await updateDoc(resRef, {
                                  status: 'cancelled',
                                  cancelled_at: serverTimestamp(),
                                  cancelled_by: profile?.name || 'Admin (Cleanup)',
                                  updated_at: serverTimestamp()
                                });
                                toast.success('Reserva cancelada com sucesso.');
                              } catch (error) {
                                console.error("Error cancelling reservation:", error);
                                handleFirestoreError(error, OperationType.UPDATE, `stock_reservations/${res.id}`);
                                toast.error('Erro ao cancelar reserva. Verifique o console.');
                              }
                            }
                          }}
                        >
                          <X className="h-3 w-3 mr-1" /> CANCELAR
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-border/30">
                       <div className="text-[10px]">
                         <span className="text-muted-foreground uppercase font-black block text-[8px]">Cliente:</span>
                         <span className="font-bold">{res.client_name}</span>
                       </div>
                       <div className="text-[10px]">
                         <span className="text-muted-foreground uppercase font-black block text-[8px]">CNPJ/CPF:</span>
                         <span className="font-bold">{res.client_cnpj}</span>
                       </div>
                       {res.expires_at && (
                         <div className="text-[10px]">
                           <span className="text-muted-foreground uppercase font-black block text-[8px]">Validade:</span>
                           <span className="font-bold text-amber-600 flex items-center gap-1">
                             <Clock className="h-2 w-2" />
                             {res.expires_at.toDate ? res.expires_at.toDate().toLocaleDateString('pt-BR') : 'Sem data'}
                           </span>
                         </div>
                       )}
                    </div>
                    {res.observation && (
                      <p className="text-[10px] italic text-muted-foreground bg-background/50 p-2 rounded border border-border/50">
                        "{res.observation}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setIsAllReservationsModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de envio de notificações de estoque */}
      <Dialog open={isNotifyModalOpen} onOpenChange={setIsNotifyModalOpen}>
        <DialogContent className="max-w-2xl sm:rounded-2xl border border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase text-amber-600">
              <Mail className="h-5 w-5" /> NOTIFICAR EQUIPE COMERCIAL
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
              Selecione as categorias de usuários que devem receber e-mail informando que o estoque de pronta entrega está atualizado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-amber-900">Mensagem que será enviada por E-mail:</p>
                <div className="text-xs text-amber-800 space-y-1">
                  <p><strong>Assunto:</strong> Estoque de Pronta Entrega Atualizado! 📦 - Roder Brasil</p>
                  <p className="italic bg-white/70 p-2.5 rounded-lg border border-amber-500/10 mt-1">
                    "O estoque de Produtos a pronta entrega foi atualizado e está pronto para ser oferecido nos negócios para os clientes. Acesse no botão abaixo para ver no celular em tempo real."
                  </p>
                </div>
              </div>
            </div>

            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Destinatários:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'external_seller', label: 'Vendedores Externos / Parceiros' },
                { id: 'vendedor_padrao', label: 'Vendedores Padrão' },
                { id: 'internal_seller', label: 'Vendedores Internos' },
                { id: 'manager', label: 'Gerência (Luana / Gislene)' },
                { id: 'admin', label: 'Administração / Rogério' },
              ].map((role) => (
                <label 
                  key={role.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50",
                    notifyRoles[role.id] 
                      ? "border-amber-500 bg-amber-500/5 text-amber-900" 
                      : "border-slate-200 bg-white text-slate-700"
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                    checked={notifyRoles[role.id] || false}
                    onChange={(e) => setNotifyRoles({
                      ...notifyRoles,
                      [role.id]: e.target.checked
                    })}
                  />
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm leading-tight text-slate-900">{role.label}</span>
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">{role.id}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setIsNotifyModalOpen(false)}
              disabled={isSendingEmails}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              className="bg-amber-500 hover:bg-amber-600 text-white font-black uppercase flex items-center gap-2"
              onClick={handleSendStockEmail}
              disabled={isSendingEmails}
            >
              {isSendingEmails ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enviando...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Enviar E-mail</span>
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fixed Bottom Navigation (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950 border-t border-slate-800 text-white md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.3)] pb-safe">
        <div className="grid grid-cols-3 max-w-md mx-auto gap-2 px-2.5 h-[76px] items-center">
          <button
            type="button"
            onClick={() => setActiveTab('fabrica')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-14 rounded-xl transition-all relative px-1 border",
              activeTab === 'fabrica' 
                ? "bg-slate-800/90 text-primary border-orange-500/80 shadow-[0_4px_12px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/50 scale-102" 
                : "bg-slate-900/50 text-slate-400 border-slate-800/40 hover:text-slate-200"
            )}
          >
            <Warehouse className={cn("h-5 w-5 transition-transform", activeTab === 'fabrica' ? "text-primary scale-110 stroke-[2.5]" : "text-slate-400")} />
            <span className="text-[8.5px] uppercase tracking-wide font-black text-center whitespace-normal leading-tight">Estoque Fábrica</span>
            {activeTab === 'fabrica' && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sinop')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-14 rounded-xl transition-all relative px-1 border",
              activeTab === 'sinop' 
                ? "bg-slate-800/90 text-primary border-orange-500/80 shadow-[0_4px_12px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/50 scale-102" 
                : "bg-slate-900/50 text-slate-400 border-slate-800/40 hover:text-slate-200"
            )}
          >
            <FileText className={cn("h-5 w-5 transition-transform", activeTab === 'sinop' ? "text-primary scale-110 stroke-[2.5]" : "text-slate-400")} />
            <span className="text-[8.5px] uppercase tracking-wide font-black text-center whitespace-normal leading-tight">Sinop</span>
            {activeTab === 'sinop' && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('importacao_fae')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-14 rounded-xl transition-all relative px-1 border",
              activeTab === 'importacao_fae' 
                ? "bg-slate-800/90 text-primary border-orange-500/80 shadow-[0_4px_12px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/50 scale-102" 
                : "bg-slate-900/50 text-slate-400 border-slate-800/40 hover:text-slate-200"
            )}
          >
            <Globe className={cn("h-5 w-5 transition-transform", activeTab === 'importacao_fae' ? "text-primary scale-110 stroke-[2.5]" : "text-slate-400")} />
            <span className="text-[8.5px] uppercase tracking-wide font-black text-center whitespace-normal leading-tight">Importação FAE</span>
            {activeTab === 'importacao_fae' && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </div>
    </div>
    </Layout>
  );
}
