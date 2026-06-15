import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { db, auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  where,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { 
  Activity,
  Package, 
  Search, 
  History,
  RefreshCw,
  AlertCircle,
  Loader2,
  Bookmark,
  ChevronRight,
  LayoutDashboard,
  Clock,
  User,
  MapPin,
  Trash2,
  CheckCircle2,
  X,
  ClipboardEdit,
  ChevronLeft,
  Upload,
  Save,
  Share2,
  Warehouse,
  FileText,
  Globe,
  Smartphone
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
import { toast } from 'sonner';

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

import { cn, safeFormatDate } from '../lib/utils';
import { StockItem, StockReservation, StockSale, StockImportFAE } from '../types';
import { usePWA } from '../contexts/PWAContext';

export default function PublicStock() {
  const navigate = useNavigate();
  const { profile, isAdmin, isManager, isInternalSeller, isTriagem, user } = useAuth();
  const { canInstall, installApp } = usePWA();
  const [items, setItems] = useState<StockItem[]>([]);
  const [sales, setSales] = useState<StockSale[]>([]);
  const [reservations, setReservations] = useState<StockReservation[]>([]);
  const [importItems, setImportItems] = useState<StockImportFAE[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'fabrica' | 'sinop' | 'importacao_fae'>('fabrica');

  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(0);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [downloadImageUrl, setDownloadImageUrl] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const [showInstallPwa, setShowInstallPwa] = useState(true);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1. Instantly load from localStorage cache to make UI load instantly and support offline
    try {
      const cachedItems = localStorage.getItem('roder_cached_public_stock_items');
      if (cachedItems) {
        setItems(JSON.parse(cachedItems));
        setLoading(false);
      }
    } catch (e) {
      console.error("Local storage hydration error:", e);
    }

    try {
      const cachedReservations = localStorage.getItem('roder_cached_public_stock_reservations');
      if (cachedReservations) {
        setReservations(JSON.parse(cachedReservations));
      }
    } catch (e) {
      console.error("Local storage hydration error:", e);
    }

    try {
      const cachedImports = localStorage.getItem('roder_cached_public_stock_imports');
      if (cachedImports) {
        setImportItems(JSON.parse(cachedImports));
      }
    } catch (e) {
      console.error("Local storage hydration error:", e);
    }

    // 2. Explicitly blur the search input and other elements on mount to guarantee that 
    // the virtual keyboard does not automatically open on page load.
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowInstallPwa(false), 60000);
    return () => clearTimeout(timer);
  }, []);

  // Reservation Modal State
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reservingItem, setReservingItem] = useState<StockItem | null>(null);
  const [reserveFormData, setReserveFormData] = useState({
    seller_name: '',
    seller_state: '',
    client_name: '',
    client_location: '',
    quantity: 1,
    observation: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

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

      toast.info(`Limpando ${snapshot.size} reservas expiradas...`);
      
      for (const reservationDoc of snapshot.docs) {
        await updateDoc(reservationDoc.ref, {
          status: 'cancelled',
          cancellation_reason: 'Expirada automaticamente (5 dias)',
          updated_at: serverTimestamp()
        });
      }
      toast.success('Reservas expiradas canceladas com sucesso.');
    } catch (error) {
      console.error("Error cleaning up expired reservations:", error);
    }
  }, []);

  useEffect(() => {
    document.title = "Stock Roder";
    
    // Inject a custom manifest for this specific page to ensure correct name when saving to home screen
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const customManifest = JSON.stringify({
      name: "Stock Roder",
      short_name: "Stock Roder",
      display: "standalone",
      start_url: window.location.origin + window.location.pathname,
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
    meta.setAttribute('content', "Stock Roder");

    cleanupExpiredReservations();
    
    // Ensure user is at least anonymously authenticated to perform reservations
    if (!profile) {
      signInAnonymously(auth).catch(err => console.error("Anonymous auth error:", err));
    }
  }, [cleanupExpiredReservations, profile]);

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

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleReserveClick = (item: StockItem) => {
    setReservingItem(item);
    setReserveFormData({
      seller_name: profile?.name || '',
      seller_state: profile?.state || '',
      client_name: '',
      client_location: '',
      quantity: 1,
      observation: '',
      password: ''
    });
    setIsReserveModalOpen(true);
  };

  const handleConfirmReservation = async () => {
    if (!reservingItem) return;

    if (!reserveFormData.seller_name || !reserveFormData.client_name) {
      toast.error('Por favor, preencha o seu nome e o nome do cliente.');
      return;
    }

    // Password check for public users (no profile)
    if (!profile && reserveFormData.password !== 'roder1010') {
      toast.error('Senha de confirmação incorreta.');
      return;
    }

      setSubmitting(true);
      try {
        // Ensure auth is ready
        let currentUserId = user?.uid || profile?.uid;
        
        if (!currentUserId) {
          try {
            const result = await signInAnonymously(auth);
            currentUserId = result.user.uid;
          } catch (authError) {
            console.error("Anonymous auth failed, proceeding as generic public user:", authError);
            currentUserId = 'public_vendedor_' + Math.random().toString(36).substring(2, 9);
          }
        }

        const isImportFae = reservingItem.source === 'import';
        let reservedQty = 0;
        if (isImportFae) {
          reservedQty = reservations
            .filter(r => r.stock_imports_fae_id === reservingItem.id && r.status === 'active')
            .reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
        } else {
          reservedQty = reservations
            .filter(r => r.stock_item_id === reservingItem.id && r.status === 'active')
            .reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
        }
        
        const availableQty = reservingItem.quantity - reservedQty;

        if (reserveFormData.quantity > availableQty) {
          toast.error(`Quantidade indisponível. Disponível no momento: ${availableQty}`);
          setSubmitting(false);
          return;
        }

        // Calculate expiration date (80 years for FAE import, 5 days for typical)
        const expiresAt = new Date();
        if (isImportFae) {
          expiresAt.setFullYear(expiresAt.getFullYear() + 80);
        } else {
          expiresAt.setDate(expiresAt.getDate() + 5);
        }

        const reservationData: any = {
          quantity_reserved: reserveFormData.quantity,
          seller_uid: currentUserId,
          seller_name: reserveFormData.seller_name,
          seller_state: reserveFormData.seller_state,
          client_name: reserveFormData.client_name,
          client_location: reserveFormData.client_location,
          observation: reserveFormData.observation,
          status: 'active',
          expires_at: Timestamp.fromDate(expiresAt),
          created_at: serverTimestamp(),
          is_external: !profile
        };

        if (isImportFae) {
          reservationData.stock_imports_fae_id = reservingItem.id;
          reservationData.is_import_fae = true;
          reservationData.item_description = reservingItem.description;
          reservationData.item_code = reservingItem.code;
        } else {
          reservationData.stock_item_id = reservingItem.id;
          reservationData.item_code = reservingItem.code;
          reservationData.item_description = reservingItem.description;
        }

        await addDoc(collection(db, 'stock_reservations'), reservationData);

        if (isImportFae) {
          toast.success('Reserva do equipamento em importação realizada com sucesso!');
        } else {
          toast.success('Reserva realizada com sucesso por 5 dias!');
        }
        setIsReserveModalOpen(false);
      } catch (error) {
        console.error("Error creating reservation:", error);
        toast.error('Erro ao realizar reserva. Verifique sua conexão.');
      } finally {
        setSubmitting(false);
      }
  };

  const handleCancelReservation = async (reservation: StockReservation) => {
    if (!isAdmin && !isManager && profile?.email !== 'roderbrasil@gmail.com' && profile?.email !== 'roderindica@gmail.com') {
      toast.error('Apenas administradores podem cancelar reservas.');
      return;
    }

    if (!confirm(`Deseja realmente cancelar a reserva do cliente ${reservation.client_name}?`)) return;

    try {
      await updateDoc(doc(db, 'stock_reservations', reservation.id), {
        status: 'cancelled',
        cancelled_by_uid: profile?.uid,
        cancelled_by_name: profile?.name,
        updated_at: serverTimestamp()
      });
      toast.success('Reserva cancelada e item liberado para o estoque!');
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast.error('Erro ao cancelar reserva.');
    }
  };

  const getCountdown = (expiresAt: any) => {
    if (!expiresAt) return null;
    const now = new Date().getTime();
    const expiry = expiresAt.toDate ? expiresAt.toDate().getTime() : new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return 'Expirada';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
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

  const totals = {
    fabrica: (items || []).filter(i => {
      const b = (i?.branch || '').toLowerCase();
      return b !== 'sinop';
    }).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0),
    sinop: (items || []).filter(i => {
      const b = (i?.branch || '').toLowerCase();
      return b === 'sinop';
    }).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)
  };

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      toast.success(`Código ${code} copiado!`);
    }).catch(err => {
      console.error('Erro ao copiar:', err);
    });
  };

  const formatDate = (date: Date) => {
    return safeFormatDate(date, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    // Fetch all without server-side orderBy to prevent document exclusion if field is missing
    const q = query(collection(db, 'stock_items'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stockData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockItem[];
      
      // Sort in memory instead
      const sortedData = stockData.sort((a, b) => 
        (a.description || '').localeCompare(b.description || '')
      );
      
      setItems(sortedData);
      try {
        localStorage.setItem('roder_cached_public_stock_items', JSON.stringify(sortedData));
      } catch (e) {
        console.error("Cache persistence error:", e);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching stock items:", error);
      setLoading(false);
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
      try {
        localStorage.setItem('roder_cached_public_stock_reservations', JSON.stringify(reservationsData));
      } catch (e) {
        console.error("Cache persistence error:", e);
      }
    }, (error) => {
      console.error("Error fetching reservations:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'stock_imports_fae'), orderBy('created_at', 'asc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockImportFAE[];
      
      let toCache = DEFAULT_FAE_IMPORTS;
      if (snapshot.empty) {
        // Fall back directly to default FAE imports instead of failing to seed as anonymous
        setImportItems(DEFAULT_FAE_IMPORTS);
      } else {
        setImportItems(data);
        toCache = data;
      }
      
      try {
        localStorage.setItem('roder_cached_public_stock_imports', JSON.stringify(toCache));
      } catch (e) {
        console.error("Cache persistence error:", e);
      }
    }, (error) => {
      console.error("Error fetching stock imports:", error);
      setImportItems(DEFAULT_FAE_IMPORTS);
      try {
        localStorage.setItem('roder_cached_public_stock_imports', JSON.stringify(DEFAULT_FAE_IMPORTS));
      } catch (e) {
        console.error("Cache persistence error:", e);
      }
    });

    return () => unsubscribe();
  }, []);

  const findCodeForDescription = (desc: string, allItems: StockItem[] = []) => {
    if (!desc) return '';
    const norm = desc.toLowerCase().trim().replace(/[\/\-\s]/g, '');
    const found = allItems.find(i => {
      const iNorm = (i.description || '').toLowerCase().trim().replace(/[\/\-\s]/g, '');
      return iNorm && (iNorm.includes(norm) || norm.includes(iNorm));
    });
    return found ? found.code : '';
  };

  const isTeamMember = !!(profile && (
    isAdmin || 
    isManager || 
    isInternalSeller || 
    isTriagem || 
    profile.email === 'roderbrasil@gmail.com' || 
    profile.email === 'roderindica@gmail.com' ||
    profile.email === 'rogerio@roderbrasil.com.br' ||
    profile.email === 'luana@roderbrasil.com.br' ||
    profile.email === 'contato@roderbrasil.com.br'
  ));

  const canEditQuantity = !!(profile && (
    isAdmin || 
    isManager || 
    isInternalSeller || 
    isTriagem || 
    profile.email === 'roderbrasil@gmail.com' || 
    profile.email === 'roderindica@gmail.com' ||
    profile.email === 'rogerio@roderbrasil.com.br'
  ));

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

  const saveAsImage = async () => {
    setIsGeneratingImage(true);
    const toastId = toast.loading('Gerando imagem do estoque completo...');
    
    try {
      // Create a temporary container to render ALL items for the image
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1110px'; // A4 proportional width at nice size
      tempContainer.style.height = 'auto';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.zIndex = '-999';
      tempContainer.style.opacity = '1';
      tempContainer.style.visibility = 'visible';
      tempContainer.style.pointerEvents = 'none';
      
      const headerHeader = `
        <div style="font-family: Arial, sans-serif; padding: 45px; border: 1px solid #cbd5e1; background: #ffffff; width: 1110px; box-sizing: border-box; display: flex; flex-direction: column;">
          
          <!-- BRAND HEADER: Roder Brasil & Hapag-Lloyd -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 4px solid #ea580c; padding-bottom: 25px; margin-bottom: 30px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="45" height="45" rx="10" fill="#ea580c" />
                <path d="M12 14C12 12.8954 12.8954 12 14 12H31C32.1046 12 33 12.8954 33 14V31C33 32.1046 32.1046 33 31 33H14C12.8954 33 12 32.1046 12 31V14Z" fill="#f97316" />
                <path d="M22.5 15C18.3579 15 15 18.3579 15 22.5C15 26.6421 18.3579 30 22.5 30C26.6421 30 30 26.6421 30 22.5" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
                <path d="M22.5 15V22.5H30" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="22.5" cy="22.5" r="3" fill="#ffffff" />
              </svg>
              <div>
                <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; line-height: 1.1;">RODER BRASIL</h1>
                <p style="font-size: 11px; font-weight: bold; color: #ea580c; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Tecnologia Florestal & FAE Oficial</p>
              </div>
            </div>
            
            <!-- Hapag-Lloyd Logo -->
            <div style="display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span style="font-family: Arial, sans-serif; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase;">Parceiro de Logística:</span>
              <svg width="125" height="28" viewBox="0 0 150 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                <rect width="34" height="34" rx="4" fill="#002A54" />
                <path d="M7 7H14V14H7V7Z" fill="#FFFFFF" />
                <path d="M20 7H27V14H20V7Z" fill="#FFFFFF" />
                <path d="M7 20H14V27H7V20Z" fill="#FFFFFF" />
                <path d="M20 20H27V27H20V20Z" fill="#FFFFFF" />
                <path d="M11 11H23V23H11V11Z" fill="#FF5E00" />
                <circle cx="17" cy="17" r="4" fill="#FFFFFF" />
                <text x="42" y="24" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="#002A54" letter-spacing="-0.2px">Hapag-Lloyd</text>
              </svg>
            </div>
          </div>
          
          <!-- Title & Meta Metadata -->
          <div style="background: #f1f5f9; border-radius: 8px; padding: 18px; margin-bottom: 30px; border-left: 5px solid #ea580c;">
            <h2 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: -0.2px;">Relatório Consolidado de Equipamentos e Acessórios</h2>
            <p style="font-size: 11.5px; color: #475569; margin: 5px 0 0 0; font-weight: bold;">
              Consulta Oficial do Estoque Matriz/Fábrica, Filial Sinop e Planilha Especial de Importação FAE
            </p>
            <div style="display: flex; gap: 20px; margin-top: 10px; font-size: 10px; color: #64748b; font-family: monospace;">
              <span><strong>DATA DE ATUALIZAÇÃO:</strong> ${new Date().toLocaleDateString('pt-BR')}</span>
              <span><strong>HORÁRIO DE EMISSÃO:</strong> ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <span><strong>ORIGEM:</strong> SISTEMA DE GESTÃO RODER INDICA</span>
            </div>
          </div>
      `;
      
      let imageHtmlContent = headerHeader;
      
      const sources = [
        { id: 'roder', label: 'EQUIPAMENTOS RODER (MATRIZ / FÁBRICA)' },
        { id: 'fae', label: 'EQUIPAMENTOS FAE (MATRIZ / FÁBRICA)' },
        { id: 'accessories', label: 'ACESSÓRIOS E COMPONENTES (MATRIZ / FÁBRICA)' },
        { id: 'sinop', label: 'ESTOQUE FILIAL SINOP / MT' }
      ];
      
      sources.forEach(source => {
        const sourceItems = items.filter(i => {
          if (source.id === 'sinop') return i.branch === 'sinop';
          return i.source === source.id && i.branch !== 'sinop';
        });
        if (sourceItems.length > 0) {
          imageHtmlContent += `
            <div style="margin-top: 30px; margin-bottom: 12px; page-break-inside: avoid;">
              <h2 style="font-size: 16px; font-weight: 850; background: #e2e8f0; padding: 10px 14px; border-left: 5px solid #0f172a; color: #0f172a; margin: 0; font-family: Arial, sans-serif; text-transform: uppercase;">${source.label}</h2>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; border: 1px solid #cbd5e1; margin-bottom: 25px; page-break-inside: avoid;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #475569; text-align: left; border: 1px solid #cbd5e1; width: 180px;">CÓDIGO</th>
                  <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #475569; text-align: left; border: 1px solid #cbd5e1;">DESCRIÇÃO DO PRODUTO</th>
                  <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #475569; text-align: center; border: 1px solid #cbd5e1; width: 150px;">DISPONÍVEL</th>
                </tr>
              </thead>
              <tbody>
          `;
          
          sourceItems.forEach(item => {
            const reservedQty = (reservations || [])
              .filter(r => r && r.stock_item_id === item.id && r.status === 'active')
              .reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
            const available = (Number(item.quantity) || 0) - reservedQty;
            
            imageHtmlContent += `
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 9px 10px; font-size: 11.5px; font-family: monospace; font-weight: bold; color: #1e3a8a; border: 1px solid #cbd5e1; background-color: #f1f5f9; white-space: nowrap;">${item.code}</td>
                <td style="padding: 9px 10px; font-size: 11px; color: #1e293b; border: 1px solid #cbd5e1; font-weight: 600; text-transform: uppercase;">${item.description}</td>
                <td style="padding: 9px 10px; font-size: 13px; font-weight: 950; text-align: center; border: 1px solid #cbd5e1; background-color: ${available > 0 ? '#f0fdf4' : '#fafafa'}; color: ${available > 0 ? '#15803d' : '#888888'};">${available > 0 ? available : '0'}</td>
              </tr>
            `;
          });
          
          imageHtmlContent += `</tbody></table>`;
        }
      });

      // Add FAE Imports Section to the printed grid (sorted ascending by arrival date!)
      if (importItems && importItems.length > 0) {
        const sortedImageImports = [...importItems].sort((a, b) => {
          const dateA = parseChegadaDate(a.chegada);
          const dateB = parseChegadaDate(b.chegada);
          return dateA.getTime() - dateB.getTime();
        });

        imageHtmlContent += `
          <div style="margin-top: 30px; margin-bottom: 12px; page-break-inside: avoid;">
            <h2 style="font-size: 16px; font-weight: 850; background: #fff7ed; padding: 10px 14px; border-left: 5px solid #ea580c; color: #c2410c; margin: 0; font-family: Arial, sans-serif; text-transform: uppercase;">EQUIPAMENTOS EM IMPORTAÇÃO FAE</h2>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; border: 1px solid #cbd5e1; margin-bottom: 25px; page-break-inside: avoid;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #475569; text-align: left; border: 1px solid #cbd5e1; width: 180px;">CÓDIGO</th>
                <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #475569; text-align: left; border: 1px solid #cbd5e1;">PRODUTO EM IMPORTAÇÃO</th>
                <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #475569; text-align: center; border: 1px solid #cbd5e1; width: 120px;">QTD</th>
                <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #475569; text-align: center; border: 1px solid #cbd5e1; width: 150px;">EMBARQUE</th>
                <th style="padding: 10px; font-size: 11px; font-weight: 800; text-align: center; border: 1px solid #cbd5e1; width: 180px; background-color: #ea580c; color: white;">PREVISÃO CHEGADA</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        sortedImageImports.forEach(item => {
          const code = findCodeForDescription(item.description, items) || '-';
          const itemReservations = (reservations || [])
            .filter(r => r && r.stock_imports_fae_id === item.id && r.status === 'active');
          const reservedQty = itemReservations.reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
          const available = (Number(item.quantity) || 0) - reservedQty;

          imageHtmlContent += `
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 9px 10px; font-size: 11.5px; font-family: monospace; font-weight: bold; color: #1e3a8a; border: 1px solid #cbd5e1; background-color: #f1f5f9; white-space: nowrap;">${code}</td>
              <td style="padding: 9px 10px; font-size: 11px; color: #1e293b; border: 1px solid #cbd5e1; font-weight: 600; text-transform: uppercase;">${item.description}</td>
              <td style="padding: 9px 10px; font-size: 12.5px; font-weight: 950; text-align: center; border: 1px solid #cbd5e1; color: #0a0f1d;">${item.quantity}</td>
              <td style="padding: 9px 10px; font-size: 11px; text-align: center; border: 1px solid #cbd5e1; color: #475569; font-weight: bold;">${item.embarque || '-'}</td>
              <td style="padding: 9px 10px; font-size: 11.5px; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; background-color: #fff7ed; color: #c2410c;">${item.chegada || '-'}</td>
            </tr>
          `;
        });
        
        imageHtmlContent += `</tbody></table>`;
      }
      
      imageHtmlContent += `
          <div style="margin-top: 45px; border-top: 2px dashed #cbd5e1; padding-top: 25px; text-align: center; color: #64748b; font-size: 11px; font-weight: bold; line-height: 1.6;">
            Esta foto reproduz as disponibilidades físicas reais do estoque sob consulta e controle da central e filiais da Roder Brasil.<br>
            Consulte sempre em tempo real pelo link oficial: <span style="color: #ea580c; text-decoration: underline;">${window.location.origin}/stock_holder</span>
          </div>
        </div>
      `;
      
      tempContainer.innerHTML = imageHtmlContent;
      document.body.appendChild(tempContainer);
      
      // Let the browser perform full layout & paint calculations for WebKit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Pass 1: Warm-up WebKit / SVG-to-Canvas caching to prevent blank results in Safari
      try {
        await toPng(tempContainer, { quality: 0.95, backgroundColor: 'white' });
      } catch (e) {
        console.warn("First-pass rendering warm up warning (ignored):", e);
      }
      
      // Wait another tick
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Pass 2: The actual high-quality export block
      const dataUrl = await toPng(tempContainer, { 
        quality: 0.95, 
        backgroundColor: 'white',
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      setDownloadImageUrl(dataUrl);
      setIsDownloadModalOpen(true);
      
      const link = document.createElement('a');
      link.download = `Estoque_Roder_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      
      document.body.removeChild(tempContainer);
      toast.success('Imagem da planilha gerada com sucesso!', { id: toastId });
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Erro ao gerar imagem da planilha de estoque.', { id: toastId });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShareImage = async () => {
    if (!downloadImageUrl) {
      toast.error('Imagem ainda não foi gerada.');
      return;
    }
    const toastId = toast.loading('Abrindo salvamento...');
    try {
      const arr = downloadImageUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], `Estoque_Roder_${new Date().toISOString().split('T')[0]}.png`, { type: mime });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Estoque Roder',
          text: 'Confira a planilha de estoque atualizada da Roder Brasil'
        });
        toast.success('Menu de salvamento/compartilhamento aberto!', { id: toastId });
      } else {
        toast.error('O compartilhamento nativo não é suportado pelo seu navegador.', { id: toastId });
      }
    } catch (err) {
      console.error('Share error:', err);
      toast.error('Erro ao abrir o menu de salvamento.', { id: toastId });
    }
  };

  const filteredItems = (items || []).filter(item => {
    const searchLower = searchTerm.toLowerCase().replace(/\s/g, '');
    const code = (item?.code || '').toString().toLowerCase().replace(/\s/g, '');
    const description = (item?.description || '').toString().toLowerCase().replace(/\s/g, '');
    return code.includes(searchLower) || description.includes(searchLower);
  });

  const displayItems = (filteredItems || []).filter(i => {
    const b = (i?.branch || '').toLowerCase();
    const branchMatches = activeTab === 'sinop' ? b === 'sinop' : b !== 'sinop';
    if (!branchMatches) return false;

    const itemReservations = (reservations || [])
      .filter(r => r && r.stock_item_id === i.id && r.status === 'active');
    const reservedQtyCount = itemReservations.reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
    
    if (Number(i.quantity) <= 0 && reservedQtyCount <= 0) return false;

    return true;
  });

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

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-orange-500/30 pb-20" data-app-version="2.3.1">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-805 bg-black/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-orange-600 p-1.5 rounded-lg shadow-sm">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm md:text-base font-black uppercase tracking-tighter text-zinc-100 leading-none">Estoque Roder</h1>
                <span className="text-[9px] text-orange-500 font-black tracking-normal uppercase mt-0.5">Disponibilidade</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm"
              onClick={saveAsImage}
              disabled={isGeneratingImage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/30 font-black uppercase text-[9px] md:text-xs h-9 px-2 md:px-4 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
              title="Baixar planilha de estoque completa como imagem"
            >
              {isGeneratingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">BAIXAR EM FOTOS</span>
              <span className="inline sm:hidden">BAIXAR</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                window.location.href = 'https://roderbrasil.com.br';
              }} 
              className="text-zinc-300 hover:text-red-500 border-zinc-800 hover:border-red-950/40 hover:bg-red-950/20 font-black uppercase text-[9px] md:text-xs h-9 px-2 md:px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              title="Fechar consulta de estoque e ir para o site oficial"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">FECHAR</span>
              <span className="inline sm:hidden">FECHAR</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-6">
            {isTeamMember && (
              <div className="flex flex-col gap-2 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">Painel Administrativo de Estoque</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {activeTab === 'fabrica' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/estoque')} 
                      className="h-9 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-md font-black uppercase tracking-widest text-[9px] md:text-[10px] px-3 bg-zinc-950"
                      title="Subir novos PDFs de estoque na página interna"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5 text-orange-500" />
                      ATUALIZAR ESTOQUE (PDF)
                    </Button>
                  )}

                  {activeTab !== 'importacao_fae' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={saveAsImage}
                      disabled={isGeneratingImage}
                      className="h-9 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-md font-black uppercase tracking-widest text-[9px] md:text-[10px] px-3 bg-zinc-950"
                      title="Gera uma imagem do estoque atual para enviar pelo WhatsApp"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                      SALVAR EM FOTOS
                    </Button>
                  )}

                  {activeTab !== 'importacao_fae' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/estoque')} 
                      className="h-9 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-md font-black uppercase tracking-widest text-[9px] md:text-[10px] px-3 bg-zinc-950"
                      title="Abre todas as reservas do sistema na página interna"
                    >
                      <Bookmark className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                      RESERVAS
                    </Button>
                  )}

                  {activeTab !== 'importacao_fae' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-md font-black uppercase tracking-widest text-[9px] md:text-[10px] px-3 bg-zinc-950"
                      onClick={() => {
                        const url = `${window.location.origin}/stock_holder`;
                        const text = `Olá! Segue o link para consulta em tempo real dos equipamentos e acessórios em estoque na Roder Brasil (Fábrica e Sinop):\n\n${url}\n\n_Este link é atualizado automaticamente._`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      title="Compartilha o link público direto no WhatsApp"
                    >
                      <Share2 className="h-3.5 w-3.5 mr-1.5 text-orange-500" />
                      COMPARTILHAR LINK PÚBLICO
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100">Consulta de Disponibilidade</h2>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-805/80 shadow-sm">
              <div className="flex flex-col gap-3 w-full lg:w-auto">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                  Escolha o estoque
                </Label>
                <div className="hidden md:flex items-center gap-3">
                  <div className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer shadow-md w-[100px] h-[100px] shrink-0",
                    activeTab === 'fabrica' ? "bg-orange-600 border-orange-500 shadow-orange-600/20 text-white" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                  )} onClick={() => setActiveTab('fabrica')}>
                    <div className="text-center">
                      <p className="font-black uppercase tracking-wider text-[11px] md:text-[12px]">FÁBRICA</p>
                      <div className="flex flex-col items-center gap-0.5 mt-1">
                        <div className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-extrabold whitespace-nowrap",
                          activeTab === 'fabrica' ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
                        )}>
                          {lastUpdates.fabrica.getTime() === 0 ? '--/--/--' : formatDate(lastUpdates.fabrica)}
                        </div>
                        <span className="text-[9.5px] md:text-[10px] uppercase font-bold text-orange-400 mt-1">{totals.fabrica} itens</span>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer shadow-md w-[100px] h-[100px] shrink-0",
                    activeTab === 'sinop' ? "bg-orange-600 border-orange-500 shadow-orange-600/20 text-white" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                  )} onClick={() => setActiveTab('sinop')}>
                    <div className="text-center">
                      <p className="font-black uppercase tracking-wider text-[11px] md:text-[12px]">SINOP</p>
                      <div className="flex flex-col items-center gap-0.5 mt-1">
                        <div className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-extrabold whitespace-nowrap",
                          activeTab === 'sinop' ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
                        )}>
                          {lastUpdates.sinop.getTime() === 0 ? '--/--/--' : formatDate(lastUpdates.sinop)}
                        </div>
                        <span className="text-[9.5px] md:text-[10px] uppercase font-bold text-orange-400 mt-1">{totals.sinop} itens</span>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer shadow-md w-[100px] h-[100px] shrink-0",
                    activeTab === 'importacao_fae' ? "bg-orange-600 border-orange-500 shadow-orange-600/20 text-white" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                  )} onClick={() => setActiveTab('importacao_fae')}>
                    <div className="text-center">
                      <p className="font-black uppercase tracking-wider text-[10px] md:text-[11px] leading-tight">IMPORTAÇÃO</p>
                      <div className="flex flex-col items-center gap-0.5 mt-1">
                        <div className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-extrabold whitespace-nowrap",
                          activeTab === 'importacao_fae' ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
                        )}>
                          PREVISÃO
                        </div>
                        <span className="text-[9.5px] md:text-[10px] uppercase font-bold text-orange-400 mt-1">
                          {importItems.length} eq.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:max-w-[280px] flex flex-col gap-1 sm:gap-2 ml-auto">
                <Label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                  Busca rápida
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                  <Input 
                    ref={searchInputRef}
                    placeholder="Buscar por código ou descrição..." 
                    className="pl-8 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm bg-zinc-905 rounded-lg sm:rounded-xl border-zinc-800 focus:ring-orange-500 text-white placeholder:text-zinc-500 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg overflow-hidden animate-fade-in">
          <div className="overflow-x-auto w-full">
            {activeTab === 'importacao_fae' ? (
              <Table className="border-collapse w-full table-fixed">
                <TableHeader className="bg-zinc-900/60 border-b-2 border-zinc-800">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50px] md:w-[100px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-zinc-400 py-1 border-r border-zinc-800/40 px-1 md:px-2">Cód.</TableHead>
                    <TableHead className="w-[110px] md:w-[280px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-zinc-400 py-1 border-r border-zinc-800/40 px-1 md:px-2">Produto em Importação</TableHead>
                    <TableHead className="w-[35px] md:w-[80px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-zinc-400 py-1 text-center border-r border-zinc-800/40 px-0.5 md:px-1 bg-transparent">Qtd</TableHead>
                    <TableHead className="w-[75px] md:w-[130px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-zinc-400 py-1 text-center border-r border-zinc-800/40 px-0.5 md:px-1">Embarque</TableHead>
                    <TableHead className="w-[75px] md:w-[130px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-orange-500 py-1 text-center px-0.5 md:px-1">Chegada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow key="loading-import-row">
                      <TableCell colSpan={5} className="h-48 text-center bg-muted/10">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Carregando...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : sortedImportItems.length === 0 ? (
                    <TableRow key="empty-import-row">
                      <TableCell colSpan={5} className="h-48 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                          <AlertCircle className="h-8 w-8 text-zinc-500" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nenhum equipamento em importação encontrado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedImportItems.map((item) => {
                      const code = findCodeForDescription(item.description, items) || '-';
                      const itemReservations = (reservations || [])
                        .filter(r => r && r.stock_imports_fae_id === item.id && r.status === 'active');
                      const reservedQty = itemReservations.reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
                      const availableQty = (Number(item.quantity) || 0) - reservedQty;

                      return (
                        <TableRow key={`public-import-row-${item.id}`} className="hover:bg-zinc-800/40 transition-colors border-b border-zinc-800/45 group bg-[#242427]/10">
                          <TableCell 
                            className="font-mono text-[8.5px] md:text-[10px] font-normal text-orange-400/90 py-2.5 sm:py-3.5 border-r border-zinc-800/45 px-1 cursor-pointer hover:bg-zinc-800 transition-colors break-all leading-tight text-center"
                            onClick={() => handleCopyCode(code)}
                            title="Clique para copiar"
                          >
                            <span>{code}</span>
                          </TableCell>
                          
                          <TableCell className="text-[8.5px] md:text-[10.5px] font-semibold py-2.5 sm:py-3.5 border-r border-zinc-800/45 px-1.5 text-zinc-300 leading-tight">
                            <div className="flex flex-col gap-0.5">
                              <span 
                                className={cn(
                                  "transition-all cursor-pointer select-none truncate block uppercase",
                                  expandedDescriptions[item.id] && "whitespace-normal break-words"
                                )}
                                onClick={() => toggleDescription(item.id)}
                                title={item.description}
                              >
                                {item.description}
                              </span>
                              
                              {/* Display Active Reservations */}
                              {itemReservations.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                  {itemReservations.map(res => (
                                    <div key={`res-card-${res.id}`} className="bg-amber-950/20 border border-amber-900/35 rounded-lg p-2 mt-1 text-[8.5px] md:text-[9.5px] text-amber-200 shadow-sm">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1 font-black uppercase text-[7.5px] md:text-[9px] text-amber-400">
                                          <Bookmark className="h-2.5 w-2.5 fill-amber-500 text-amber-500 shadow-sm animate-pulse" />
                                          Reserva ({res.quantity_reserved} un)
                                        </div>
                                        <div className="flex items-center gap-1 font-mono font-bold bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40 text-[7.5px] md:text-[8.5px] text-amber-400 shadow-sm">
                                          <Clock className="h-1.5 w-1.5 text-amber-400" />
                                          {getCountdown(res.expires_at)}
                                        </div>
                                      </div>
                                      <div className="space-y-0.5 opacity-90 font-medium text-[7.5px] md:text-[8.5px]">
                                        <p className="flex items-center gap-1">
                                          <User className="h-1.5 w-1.5 text-amber-450" />
                                          <span className="font-black">{res.seller_name} {res.seller_state && `(${res.seller_state})`}</span>
                                        </p>
                                        <p className="flex items-center gap-1">
                                          <MapPin className="h-1.5 w-1.5 text-amber-450" />
                                          <span className="font-bold">{res.client_name}</span>
                                        </p>
                                      </div>
                                      
                                      {/* Admin/Manager Cancel Button */}
                                      {(isAdmin || isManager || profile?.email === 'roderbrasil@gmail.com' || profile?.email === 'roderindica@gmail.com') && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          onClick={() => handleCancelReservation(res)}
                                          className="h-4.5 w-full mt-1.5 text-[6.5px] font-black uppercase text-red-400 border border-red-900/40 bg-red-950/20 hover:bg-red-950/45 p-0 rounded"
                                        >
                                          REMOVER RESERVA
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-center font-black text-zinc-100 text-[10px] md:text-sm py-2.5 sm:py-3.5 border-r border-zinc-800/45 px-0.5">
                            <span>{item.quantity}</span>
                          </TableCell>

                          <TableCell className="text-center py-2.5 sm:py-3.5 border-r border-zinc-800/45 px-1 font-mono text-[8.5px] md:text-[10px] font-semibold text-zinc-350 leading-tight break-words">
                            {item.embarque || '-'}
                          </TableCell>

                          <TableCell className="text-center py-2.5 sm:py-3.5 px-1 md:px-2 font-mono text-[8.5px] md:text-[10px] font-normal text-orange-400/90 leading-tight break-words">
                            {item.chegada || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table className="border-collapse w-full table-fixed">
                <TableHeader className="bg-zinc-900/60 border-b-2 border-zinc-800">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[70px] md:w-[110px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-zinc-400 py-1 border-r border-zinc-805/40 px-1 md:px-2">Cód.</TableHead>
                    <TableHead className="w-[145px] md:w-[280px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-zinc-400 py-1 border-r border-zinc-805/40 px-1 md:px-2">Produto</TableHead>
                    <TableHead className="w-[45px] md:w-[65px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-zinc-400 py-1 text-center border-r border-zinc-805/40 px-0.5 md:px-1 bg-transparent">Fís.</TableHead>
                    <TableHead className="w-[50px] md:w-[85px] font-black uppercase text-[8px] md:text-[10px] tracking-tight text-zinc-400 py-1 text-center px-0.5 md:px-1 bg-transparent">Disp.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                  <TableRow key="loading-row">
                    <TableCell colSpan={4} className="h-48 text-center">
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
                    <TableCell colSpan={4} className="h-48 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                        <AlertCircle className="h-8 w-8" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum item encontrado</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  (displayItems || []).filter(item => item && item.id).map((item) => {
                      const itemReservations = (reservations || [])
                        .filter(r => r && r.stock_item_id === item.id);
                      
                      const reservedQty = itemReservations
                        .reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
                      
                      const availableQty = (Number(item.quantity) || 0) - reservedQty;

                      return (
                        <TableRow key={`public-row-${item.id}`} className="hover:bg-zinc-800/40 transition-colors border-b border-zinc-800/45 group bg-zinc-900">
                          <TableCell 
                            className="font-mono text-[8px] md:text-[9.5px] font-normal text-orange-400 py-1 sm:py-1.5 border-r border-zinc-800/45 px-1 hover:bg-zinc-800 transition-colors break-all leading-tight"
                            onClick={() => handleCopyCode(item.code)}
                            title="Clique para copiar"
                          >
                            <span key={`code-val-${item.id}`}>{item.code}</span>
                          </TableCell>
                          <TableCell className="text-[8px] md:text-[10px] font-semibold py-1 sm:py-1.5 border-r border-zinc-805/40 px-1.5 text-zinc-300 leading-tight">
                            <div className="flex flex-col gap-0.5" key={`info-box-${item.id}`}>
                              <span 
                                key={`name-val-${item.id}`}
                                className={cn(
                                  "transition-all cursor-pointer select-none truncate block uppercase",
                                  expandedDescriptions[item.id] && "whitespace-normal break-words"
                                )}
                                onClick={() => toggleDescription(item.id)}
                                title={normalizeDescription(item.description)}
                              >
                                {normalizeDescription(item.description)}
                              </span>
                              
                              {/* Display Active Reservations */}
                              {itemReservations.length > 0 && (
                                <div className="mt-2 space-y-1.5" key={`reservations-${item.id}`}>
                                  {itemReservations.map(res => (
                                    <div key={`res-card-${res.id}`} className="bg-amber-950/20 border border-amber-900/40 rounded-md p-1 mt-1 text-[8.5px] md:text-[9.5px] text-amber-200">
                                      <div className="flex items-center justify-between mb-1" key={`res-head-${res.id}`}>
                                        <div className="flex items-center gap-1 font-black uppercase text-[7.5px] md:text-[9px] text-amber-400" key={`res-qty-${res.id}`}>
                                          <Bookmark className="h-2 w-2 fill-amber-500 text-amber-500 shadow-sm" key={`res-icon-${res.id}`} />
                                          Reserva ({res.quantity_reserved} un)
                                        </div>
                                        <div className="flex items-center gap-1 font-mono font-bold bg-amber-950/50 px-1 py-0.5 rounded border border-amber-900/55 text-[7.5px] md:text-[8.5px] text-amber-400" key={`res-time-${res.id}`}>
                                          <Clock className="h-1.5 w-1.5" key={`res-clk-${res.id}`} />
                                          {getCountdown(res.expires_at)}
                                        </div>
                                      </div>
                                      <div className="space-y-0.5 opacity-90 font-medium text-[7.5px] md:text-[8.5px]" key={`res-body-${res.id}`}>
                                        <p className="flex items-center gap-1" key={`res-sel-${res.id}`}>
                                          <User className="h-1.5 w-1.5 text-amber-400" key={`res-sel-ic-${res.id}`} />
                                          <span className="font-black">{res.seller_name} {res.seller_state && `(${res.seller_state})`}</span>
                                        </p>
                                        <p className="flex items-center gap-1" key={`res-cli-${res.id}`}>
                                          <MapPin className="h-1.5 w-1.5 text-amber-400" key={`res-cli-ic-${res.id}`} />
                                          <span className="font-bold">{res.client_name}</span>
                                        </p>
                                      </div>
                                      
                                      {/* Admin/Manager Cancel Button */}
                                      {(isAdmin || isManager || profile?.email === 'roderbrasil@gmail.com' || profile?.email === 'roderindica@gmail.com') && (
                                        <Button 
                                          key={`res-del-${res.id}`}
                                          variant="ghost" 
                                          size="sm" 
                                          onClick={() => handleCancelReservation(res)}
                                          className="h-4 w-full mt-1 text-[6.5px] font-black uppercase text-red-400 border border-red-900/40 bg-red-955/20 hover:bg-red-950/40 p-0"
                                        >
                                          REMOVER RESERVA
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-black text-zinc-100 text-[9px] md:text-sm py-1 border-r border-zinc-805/40 px-0.5">
                            {editingQuantityId === item.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <Input 
                                  type="number" 
                                  className="w-12 h-6 text-center text-[10px] p-0 bg-zinc-900 border border-zinc-750 text-zinc-100 font-bold" 
                                  value={tempQuantity}
                                  onChange={(e) => setTempQuantity(Number(e.target.value))}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateQuantity(item.id, tempQuantity);
                                    if (e.key === 'Escape') setEditingQuantityId(null);
                                  }}
                                />
                                <Button size="icon" variant="ghost" className="h-5 w-5 text-emerald-400 hover:text-emerald-500 hover:bg-zinc-900/60" onClick={() => handleUpdateQuantity(item.id, tempQuantity)}>
                                  <Save className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                                <span key={`phy-qty-${item.id}`}>{item.quantity}</span>
                                {canEditQuantity && (
                                  <button 
                                    onClick={() => {
                                      setTempQuantity(item.quantity);
                                      setEditingQuantityId(item.id);
                                    }}
                                    className="text-[7px] text-orange-400 hover:underline font-black uppercase tracking-tighter"
                                  >
                                    [edit]
                                  </button>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell 
                            className={cn(
                              "text-center py-1 px-0.5 select-none",
                              availableQty > 0 && "cursor-pointer hover:bg-zinc-900/30 transition-colors"
                            )}
                            onClick={() => {
                              if (availableQty > 0) {
                                handleReserveClick(item);
                              }
                            }}
                          >
                            <div className="flex flex-col items-center justify-center gap-0.2" key={`action-box-${item.id}`}>
                              <span key={`avail-qty-${item.id}`} className={cn(
                                "font-black text-[11px] md:text-sm",
                                availableQty > 0 ? "text-emerald-400" : "text-zinc-500"
                              )}>
                                {availableQty}
                              </span>
                              
                              {availableQty > 0 && (
                                <span className="text-[7px] font-normal text-orange-400 uppercase tracking-tighter hover:underline leading-none">
                                  reservar
                                </span>
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando estoque...</p>
            </div>
          ) : activeTab === 'importacao_fae' ? (
            sortedImportItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2 bg-white rounded-xl border border-slate-100 p-4">
                <AlertCircle className="h-8 w-8 mx-auto opacity-55 text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-wider">Nenhum equipamento na importação</p>
              </div>
            ) : (
              sortedImportItems.map((item) => {
                const code = findCodeForDescription(item.description, items) || '-';
                const itemReservations = (reservations || [])
                  .filter(r => r && r.stock_imports_fae_id === item.id && r.status === 'active');
                const reservedQty = itemReservations.reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
                const availableQty = (Number(item.quantity) || 0) - reservedQty;

                return (
                  <div key={`mob-pub-imp-${item.id}`} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-slate-300 transition-all">
                    {/* Top Row: Code Badge & Status */}
                    <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-100">
                      <span 
                        onClick={() => handleCopyCode(code)}
                        className="font-mono text-[11px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md cursor-pointer active:scale-[0.98] transition-all"
                        title="Copiar Código"
                      >
                        {code}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-md text-white font-mono",
                          availableQty > 0 ? "bg-emerald-600 animate-pulse" : "bg-red-600"
                        )}>
                          {availableQty} Disp. ({item.quantity} un)
                        </span>
                      </div>
                    </div>

                    {/* Middle: Product Line */}
                    <div className="py-2">
                      <p 
                        className="text-xs font-black text-slate-800 leading-snug uppercase cursor-pointer"
                        onClick={() => toggleDescription(item.id)}
                      >
                        {item.description}
                      </p>

                      {/* Display Inline Editing of Quantity (for allowed members) */}
                      {editingQuantityId === item.id ? (
                        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-lg mt-2">
                          <Input 
                            type="number" 
                            className="w-16 h-7 text-center text-xs p-0 bg-white border border-slate-300 text-slate-900 font-bold" 
                            value={tempQuantity}
                            onChange={(e) => setTempQuantity(Number(e.target.value))}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateQuantity(item.id, tempQuantity);
                              if (e.key === 'Escape') setEditingQuantityId(null);
                            }}
                          />
                          <Button 
                            className="h-7 bg-emerald-600 px-2 text-white font-bold text-[10px] hover:bg-emerald-700"
                            onClick={() => handleUpdateQuantity(item.id, tempQuantity)}
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

                    {/* Active Reservations in Import list */}
                    {itemReservations.length > 0 && (
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 my-1.5 space-y-1.5">
                        <div className="flex items-center gap-1 font-black text-amber-800 text-[8.5px] uppercase border-b border-amber-200/50 pb-1">
                          <Bookmark className="h-3 w-3 text-amber-500 fill-amber-500" />
                          Reservas Ativas ({reservedQty} un)
                        </div>
                        {itemReservations.map(res => (
                          <div key={`res-mob-${res.id}`} className="space-y-0.5 text-[8px] text-amber-850 font-bold border-b border-amber-100/40 pb-1 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-[10px] font-black text-amber-900">Quant: {res.quantity_reserved} un</span>
                              <span className="bg-white border border-amber-200 rounded px-1 text-amber-600 flex items-center gap-0.5">
                                <Clock className="h-2 w-2" />
                                {getCountdown(res.expires_at)}
                              </span>
                            </div>
                            <p className="flex items-center gap-1 text-[8px] opacity-90">
                              <User className="h-2.5 w-2.5 shrink-0" />
                              <span>Responsável: {res.seller_name} {res.seller_state && `(${res.seller_state})`}</span>
                            </p>
                            <p className="flex items-center gap-1 text-[8px] opacity-90">
                              <MapPin className="h-2.5 w-2.5 shrink-0" />
                              <span>Cliente: {res.client_name}</span>
                            </p>

                            {/* Remove button if permitted */}
                            {(isAdmin || isManager || profile?.email === 'roderbrasil@gmail.com' || profile?.email === 'roderindica@gmail.com') && (
                              <button 
                                onClick={() => handleCancelReservation(res)}
                                className="w-full mt-1.5 text-[7px] font-extrabold uppercase text-red-600 bg-white border border-red-200 hover:bg-red-50 py-0.5 rounded shadow-sm"
                              >
                                REMOVER RESERVA
                              </button>
                            )}
                          </div>
                        ))}
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

                    {/* Reserve Button Row */}
                    {availableQty > 0 && (
                      <div className="pt-2">
                        <Button 
                          variant="default" 
                          size="xs" 
                          onClick={() => handleReserveClick({
                            id: item.id,
                            code,
                            description: item.description,
                            quantity: item.quantity,
                            source: 'import',
                            branch: 'importacao',
                            updated_at: new Date().toISOString()
                          })}
                          className="h-8 w-full text-[10px] font-black uppercase bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 rounded-lg active:scale-95 transition-all"
                        >
                          <ClipboardEdit className="h-3 w-3" />
                          <span>SOLICITAR RESERVA</span>
                        </Button>
                      </div>
                    )}
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
                const originalDescription = (item.description || 'Sem descrição').replace(/SHANFROL/g, 'FLORESTAL').replace(/Shanfrol/g, 'Florestal');
                const description = normalizeDescription(originalDescription);
                const code = item.code || '-';

                const itemReservations = (reservations || [])
                  .filter(r => r && r.stock_item_id === item.id);
                
                const reservedQty = itemReservations
                  .reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
                
                const availableQty = (Number(item.quantity) || 0) - reservedQty;

                return (
                  <div key={`mob-pub-std-${item.id}`} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-slate-300 transition-all">
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
                        availableQty > 0 ? "bg-emerald-600 animate-pulse" : "bg-red-600"
                      )}>
                        {availableQty} Disp. ({item.quantity} un)
                      </span>
                    </div>

                    {/* Middle: Product Line */}
                    <div className="py-2">
                      <p 
                        className="text-xs font-black text-slate-800 leading-snug uppercase cursor-pointer"
                        onClick={() => toggleDescription(item.id)}
                      >
                        {description}
                      </p>

                      {/* Display Inline Editing of Quantity (for allowed members) */}
                      {editingQuantityId === item.id ? (
                        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-lg mt-2">
                          <Input 
                            type="number" 
                            className="w-16 h-7 text-center text-xs p-0 bg-white border border-slate-300 text-slate-900 font-bold" 
                            value={tempQuantity}
                            onChange={(e) => setTempQuantity(Number(e.target.value))}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateQuantity(item.id, tempQuantity);
                              if (e.key === 'Escape') setEditingQuantityId(null);
                            }}
                          />
                          <Button 
                            className="h-7 bg-emerald-600 px-2 text-white font-bold text-[10px] hover:bg-emerald-700"
                            onClick={() => handleUpdateQuantity(item.id, tempQuantity)}
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

                    {/* Active Reservations in Standard list */}
                    {itemReservations.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 my-1.5 space-y-1.5">
                        <div className="flex items-center gap-1 font-black text-amber-800 text-[8.5px] uppercase border-b border-amber-200 pb-1">
                          <Bookmark className="h-3 w-3 text-amber-500 fill-amber-500" />
                          Reservas Ativas ({reservedQty} un)
                        </div>
                        {itemReservations.map(res => (
                          <div key={`res-mob-std-${res.id}`} className="space-y-0.5 text-[8px] text-amber-850 font-bold border-b border-amber-100 pb-1 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-[10px] font-black text-amber-900">Quant: {res.quantity_reserved} un</span>
                              <span className="bg-white border border-amber-200 rounded px-1 text-amber-600 flex items-center gap-0.5">
                                <Clock className="h-2 w-2" />
                                {getCountdown(res.expires_at)}
                              </span>
                            </div>
                            <p className="flex items-center gap-1 text-[8px] opacity-90">
                              <User className="h-2.5 w-2.5 shrink-0" />
                              <span>Responsável: {res.seller_name} {res.seller_state && `(${res.seller_state})`}</span>
                            </p>
                            <p className="flex items-center gap-1 text-[8px] opacity-90">
                              <MapPin className="h-2.5 w-2.5 shrink-0" />
                              <span>Cliente: {res.client_name}</span>
                            </p>

                            {/* Remove button if permitted */}
                            {(isAdmin || isManager || profile?.email === 'roderbrasil@gmail.com' || profile?.email === 'roderindica@gmail.com') && (
                              <button 
                                onClick={() => handleCancelReservation(res)}
                                className="w-full mt-1.5 text-[7px] font-extrabold uppercase text-red-600 bg-white border border-red-200 hover:bg-red-50 py-0.5 rounded shadow-sm"
                              >
                                REMOVER RESERVA
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reserve Button Row */}
                    {availableQty > 0 && (
                      <div className="pt-2 border-t border-dashed border-slate-100">
                        <Button 
                          variant="default" 
                          size="xs" 
                          onClick={() => handleReserveClick(item)}
                          className="h-8 w-full text-[10px] font-black uppercase bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 rounded-lg active:scale-95 transition-all"
                        >
                          <ClipboardEdit className="h-3 w-3" />
                          <span>SOLICITAR RESERVA</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>

        <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 opacity-40">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-900">
            <LayoutDashboard className="h-3 w-3" />
            Roder Brasil - Gestão de Estoque
          </div>
        </div>
      </main>

      {/* Reservation Modal */}
      <Dialog open={isReserveModalOpen} onOpenChange={setIsReserveModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-primary" />
              {reservingItem?.source === 'import' ? 'Solicitar Reserva (Equipamento em Importação)' : 'Solicitar Reserva por 5 Dias'}
            </DialogTitle>
            <DialogDescription>
              {reservingItem?.description} ({reservingItem?.code})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seller_name">Seu Nome *</Label>
                <Input 
                  id="seller_name" 
                  placeholder="Nome do Vendedor"
                  value={reserveFormData.seller_name}
                  onChange={(e) => setReserveFormData({...reserveFormData, seller_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller_state">Seu Estado</Label>
                <Input 
                  id="seller_state" 
                  placeholder="Ex: SP, MG..."
                  value={reserveFormData.seller_state}
                  onChange={(e) => setReserveFormData({...reserveFormData, seller_state: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Nome do Cliente *</Label>
                <Input 
                  id="client_name" 
                  placeholder="Empresa ou Nome do Produtor"
                  value={reserveFormData.client_name}
                  onChange={(e) => setReserveFormData({...reserveFormData, client_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_location">Cidade/Estado do Cliente</Label>
                <Input 
                  id="client_location" 
                  placeholder="Ex: Ribeirão Preto - SP"
                  value={reserveFormData.client_location}
                  onChange={(e) => setReserveFormData({...reserveFormData, client_location: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade para Reservar</Label>
              <div className="flex items-center gap-3">
                <Input 
                  id="quantity" 
                  type="number" 
                  min="1" 
                  max={reservingItem ? reservingItem.quantity - reservations.filter(r => r.stock_item_id === reservingItem.id).reduce((acc, r) => acc + r.quantity_reserved, 0) : 1}
                  value={reserveFormData.quantity}
                  onChange={(e) => setReserveFormData({...reserveFormData, quantity: parseInt(e.target.value) || 1})}
                />
                <span className="text-[10px] text-muted-foreground uppercase font-black">UN</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observation">Observações (Opcional)</Label>
              <Textarea 
                id="observation" 
                placeholder="Algum detalhe importante?"
                value={reserveFormData.observation}
                onChange={(e) => setReserveFormData({...reserveFormData, observation: e.target.value})}
              />
            </div>

            {!profile && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label htmlFor="password_confirm" className="text-primary font-bold">Senha de Confirmação *</Label>
                <Input 
                  id="password_confirm" 
                  type="password"
                  placeholder="Digite a senha para reservar"
                  value={reserveFormData.password}
                  onChange={(e) => setReserveFormData({...reserveFormData, password: e.target.value})}
                  className="border-primary/30 focus:border-primary"
                />
                <p className="text-[10px] text-muted-foreground italic">Solicite a senha ao responsável se não possuir.</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[10px] text-amber-800 leading-tight">
                <p className="font-black uppercase mb-1">Atenção!</p>
                A reserva tem validade de **5 dias**. Após esse período, o produto voltará automaticamente ao estoque se a venda não for confirmada.
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsReserveModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmReservation} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirmar Reserva
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

      {/* Photo Save Modal */}
      <Dialog open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white font-black text-lg">
              <Save className="h-5 w-5 text-emerald-400" />
              Estoque Completo em Imagem
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs font-semibold leading-relaxed">
              Planilha de estoque de fábrica, filial Sinop e importação gerada com sucesso! Você pode salvá-la em fotos no celular para abrir de qualquer lugar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-orange-600/10 border border-orange-500/20 rounded-xl p-3 text-center text-xs text-orange-200 w-full">
              <span className="font-extrabold text-orange-400 block uppercase tracking-wider text-[10px] mb-1">💡 DICA PARA CELULAR / WHATSAPP:</span>
              <p className="leading-relaxed text-[11px]">
                Toque e segure o dedo sobre a imagem abaixo e selecione <strong>"Salvar em Fotos"</strong> (ou "Salvar Imagem") para salvá-la no celular e abrir em campo mesmo sem internet!
              </p>
            </div>
            {downloadImageUrl ? (
              <div className="border border-zinc-800 rounded-lg overflow-hidden max-h-[45vh] w-full bg-white flex justify-center shadow-inner mt-1">
                <img 
                  src={downloadImageUrl} 
                  alt="Estoque Roder Completo" 
                  className="object-contain max-h-[45vh] w-auto h-auto max-w-full"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center w-full">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button variant="outline" className="border-zinc-800 hover:bg-zinc-900 text-zinc-350 rounded-xl justify-center h-10 uppercase text-[10px] font-black tracking-widest" onClick={() => setIsDownloadModalOpen(false)}>Fechar</Button>
            
            {downloadImageUrl && typeof navigator !== 'undefined' && navigator.share && (
              <Button 
                onClick={handleShareImage}
                className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black tracking-widest shadow-md transition-all uppercase h-10 border border-emerald-500/30"
              >
                <Share2 className="h-4 w-4 mr-2 text-white" />
                SALVAR NAS FOTOS / WHATSAPP
              </Button>
            )}

            {downloadImageUrl && (
              <a 
                href={downloadImageUrl} 
                download={`Estoque_Roder_${new Date().toISOString().split('T')[0]}.png`}
                className="inline-flex items-center justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black tracking-widest shadow-md transition-all uppercase h-10 border border-zinc-700"
                onClick={() => {
                  toast.success("Download iniciado!");
                }}
              >
                <Save className="h-4 w-4 mr-2 text-white" />
                BAIXAR IMAGEM (PC)
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showInstallPwa && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:hidden z-50">
          <div className="relative bg-slate-900/95 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl flex flex-col items-center gap-1 shadow-2xl border border-white/10 animate-bounce">
            <button 
              onClick={() => setShowInstallPwa(false)}
              className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 border border-white/20 shadow-lg"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3 rotate-90 text-primary" />
              Salvar no Celular
            </div>
            <span className="text-[8px] text-white/50 font-medium normal-case">Toque em compartilhar e "Adicionar à Tela de Início"</span>
          </div>
        </div>
      )}
    </div>
  );
}
