import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { RegisteredProduct, Product } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Papa from 'papaparse';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Package, 
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrency, safeFormatDate } from '../lib/utils';
import { usePWA } from '../contexts/PWAContext';
import { addToSyncQueue, saveMediaLocally } from '../lib/pwaUtils';

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

export default function RegisteredProducts() {
  const navigate = useNavigate();
  const { auth, profile, isAdmin, isManager, isInternalSeller } = useAuth();
  const { isOffline } = usePWA();
  
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
  const [products, setProducts] = useState<RegisteredProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<RegisteredProduct | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [stockCounts, setStockCounts] = useState<Record<string, number>>({});
  const [expandedNameId, setExpandedNameId] = useState<string | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    base_price: 0,
    category: '',
    is_commissionable: true,
    image_url: ''
  });

  const normalizeDescription = (desc: string) => {
    if (!desc) return '';
    return desc.replace(/chanfrol/gi, 'FLORESTAL').replace(/chanfro/gi, 'FLORESTAL');
  };

  const truncate = (str: string, n: number) => {
    if (!str) return "";
    return str.length > n ? str.substring(0, n - 1) + "..." : str;
  };

  useEffect(() => {
    const handleClickOutside = () => setExpandedNameId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Permissions: Admin, Manager, and Luana (Internal/Triagem)
  const canManage = isAdmin || isManager || (isInternalSeller && (profile?.email === 'luana@roderbrasil.com.br' || profile?.email === 'contato@roderbrasil.com.br' || profile?.email === 'luana@roder.com.br'));

  useEffect(() => {
    const q = query(collection(db, 'registered_products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegisteredProduct));
      setProducts(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching registered products:", error);
      handleFirestoreError(error, OperationType.LIST, 'registered_products');
      setLoading(false);
    });

    // Also fetch stock counts for display
    const stockUnsubscribe = onSnapshot(collection(db, 'stock_items'), (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const item = doc.data();
        const code = (item.code || '').toLowerCase();
        if (code) {
          counts[code] = (counts[code] || 0) + (item.quantity || 0);
        }
      });
      setStockCounts(counts);
    }, (error) => {
      console.error("Error fetching stock counts:", error);
    });

    return () => {
      unsubscribe();
      stockUnsubscribe();
    };
  }, []);

  // Automatic sync on mount - more robust check
  useEffect(() => {
    if (!loading && profile && canManage) {
      console.log("Auto-syncing products from stock...");
      syncFromStock(true);
    }
  }, [loading, !!profile, canManage]);

  const handleSave = async () => {
    try {
      if (!formData.code || !formData.name) {
        toast.error('Código e Nome são obrigatórios');
        return;
      }

      const data = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'registered_products', editingProduct.id), data);
        
        // Back-sync photo to catalog if it was changed
        if (data.image_url && data.image_url !== editingProduct.image_url) {
          await syncPhotoToCatalog(data.name, data.image_url);
        }
        
        toast.success('Produto atualizado com sucesso');
      } else {
        await addDoc(collection(db, 'registered_products'), {
          ...data,
          created_at: new Date().toISOString()
        });
        toast.success('Produto cadastrado com sucesso');
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({ code: '', name: '', base_price: 0, category: '', is_commissionable: true, image_url: '' });
    } catch (error: any) {
      console.warn('Could not save product to Firebase server, falling back to local queue:', error);
      try {
        const itemData = {
          formData: {
            ...formData,
            updated_at: new Date().toISOString()
          },
          id: editingProduct?.id || null
        };

        await addToSyncQueue({
          id: crypto.randomUUID(),
          type: 'product',
          data: itemData
        });

        toast.warning('Produto salvo localmente!', {
          description: 'A cota diária ou limite de rede impediram a sincronização imediata. O produto foi armazenado com segurança localmente e distribuído via rede híbrida (P2P offline) para o campo. A sincronização com o Firebase ocorrerá de forma 100% automática assim que disponível.',
          duration: 12000
        });

        setIsDialogOpen(false);
        setEditingProduct(null);
        setFormData({ code: '', name: '', base_price: 0, category: '', is_commissionable: true, image_url: '' });
      } catch (fallbackErr) {
        console.error('Error saving product offline fallback:', fallbackErr);
        toast.error('Erro ao cadastrar produto localmente: ' + error.message);
      }
    }
  };

  const handleToggleCommission = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'registered_products', id), {
        is_commissionable: !currentStatus,
        updated_at: new Date().toISOString()
      });
      toast.success('Status comissionável atualizado');
    } catch (error) {
      console.error("Error toggling commission:", error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleUpdateStock = async (code: string, newQuantity: number) => {
    try {
      const stockSnap = await getDocs(query(collection(db, 'stock_items'), where('code', '==', code)));
      if (!stockSnap.empty) {
        const stockDoc = stockSnap.docs[0];
        await updateDoc(doc(db, 'stock_items', stockDoc.id), {
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'stock_items'), {
          code,
          description: products.find(p => p.code === code)?.name || 'Produto sem nome',
          quantity: newQuantity,
          source: 'roder',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      setEditingStockId(null);
      toast.success('Estoque atualizado');
    } catch (error: any) {
      console.warn("Could not sync stock database instantly, queueing offline update instead:", error);
      try {
        await addToSyncQueue({
          id: crypto.randomUUID(),
          type: 'stock_update',
          data: {
            code,
            quantity: newQuantity,
            description: products.find(p => p.code === code)?.name || 'Produto sem nome',
            source: 'roder'
          }
        });
        
        setEditingStockId(null);
        toast.warning('Estoque atualizado localmente!', {
          description: 'Não foi possível salvar online (cota ou rede baixa). A atualização de estoque foi mantida de forma segura no aparelho e será enviada ao Firebase automaticamente.',
          duration: 10000
        });
      } catch (fallbackErr) {
        console.error("Error saving stock update fallback:", fallbackErr);
        toast.error('Erro ao atualizar estoque: ' + error.message);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../lib/firebase');
      
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      setFormData(prev => ({ ...prev, image_url: url }));
      toast.success('Imagem carregada com sucesso');
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado para a área de transferência!`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto da base de cadastrados?')) return;
    try {
      await deleteDoc(doc(db, 'registered_products', id));
      toast.success('Produto removido');
    } catch (error) {
      toast.error('Erro ao remover produto');
    }
  };

  const syncFromStock = async (isSilent: boolean = false, newStockItems?: any[], source?: string) => {
    if (syncing && !newStockItems) return;
    setSyncing(true);
    try {
      const stockSnap = newStockItems ? { docs: newStockItems.map(item => ({ data: () => item })) } : await getDocs(collection(db, 'stock_items'));
      
      const registeredSnap = await getDocs(collection(db, 'registered_products'));
      const registeredProducts = registeredSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegisteredProduct));
      const existingCodes = new Set(registeredProducts.map(p => (p.code || '').toLowerCase()).filter(Boolean));
      
      // If we have new stock items from a specific source, zero out missing items for that source
      if (source && newStockItems) {
        const codesInNewStock = new Set(newStockItems.map(item => item.code?.toLowerCase()));
        
        for (const product of registeredProducts) {
          if (product.category.toLowerCase().includes(source.toLowerCase()) && !codesInNewStock.has(product.code.toLowerCase())) {
            const stockItemSnap = await getDocs(query(collection(db, 'stock_items'), where('code', '==', product.code)));
            if (!stockItemSnap.empty) {
              await updateDoc(doc(db, 'stock_items', stockItemSnap.docs[0].id), {
                quantity: 0,
                updated_at: new Date().toISOString()
              });
            }
          }
        }
      }

      let addedCount = 0;

      for (const stockDoc of (stockSnap as any).docs) {
        const stockData = stockDoc.data();
        const code = stockData.code || '';
        
        if (code && !existingCodes.has(code.toLowerCase())) {
          const lowerName = (stockData.description || '').toLowerCase();
          const lowerCode = code.toLowerCase();
          
          const nonCommissionableKeywords = [
            'suporte', 'adaptador', 'kit', 'componente', 'hidraulico', 'instalação', 
            'parafuso', 'mangueira', 'conector', 'valvula', 'reparo', 'mão de obra', 'mao de obra', 'serviço', 'frete', 'acessório', 'acessorio'
          ];

          const isNonCommissionable = nonCommissionableKeywords.some(kw => 
            lowerName.includes(kw) || lowerCode.includes(kw)
          );

          await addDoc(collection(db, 'registered_products'), {
            code: code,
            name: stockData.description || 'Produto sem nome',
            base_price: 0,
            category: stockData.source === 'roder' ? 'Equip. Roder' : stockData.source === 'fae' ? 'Equip. FAE' : 'Acessórios',
            is_commissionable: !isNonCommissionable,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          addedCount++;
          existingCodes.add(code.toLowerCase());
        }
      }

      if (addedCount > 0) {
        await syncPhotosFromCatalog();
        toast.success(`${addedCount} novos produtos sincronizados do estoque!`);
      } else if (!isSilent) {
        toast.info('Nenhum produto novo encontrado no estoque.');
      }
    } catch (error) {
      console.error('Error syncing stock:', error);
      toast.error('Erro ao sincronizar estoque');
    } finally {
      setSyncing(false);
    }
  };

  const syncFromGoogleSheet = async () => {
    if (syncing) return;
    setSyncing(true);
    const toastId = toast.loading('Sincronizando com planilha Google...');
    
    try {
      const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1zpHnh2TFxitkrGoyH15uISSX_K585cRGtyepEWfuQZQ/export?format=csv';
      
      const response = await fetch(SHEET_URL);
      if (!response.ok) throw new Error('Erro ao baixar planilha');
      
      const csvText = await response.text();
      
      // Standard Roder code format: 0000.0000.0000 (roughly digits and dots)
      const isValidStandardCode = (code: string) => {
        if (!code) return false;
        const clean = code.trim();
        if (clean.toLowerCase().includes('projeto')) return false;
        // Check if it matches a pattern of digits and dots, should be roughly 14 chars for 1000.2010.0000
        const regex = /^\d{4}\.\d{4}\.\d{4}$/;
        // Also allow the variant without dots or different spots if and only if it looks like a Roder code
        // For now, following the user's specific "0000.0000.0000" visual hint.
        return regex.test(clean) || (clean.length >= 10 && !isNaN(Number(clean.replace(/\./g, ''))));
      };
      
      Papa.parse(csvText, {
        complete: async (results) => {
          const rows = results.data as string[][];
          
          const registeredSnap = await getDocs(collection(db, 'registered_products'));
          let currentProducts = registeredSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegisteredProduct));
          
          let deletedCount = 0;
          let updatedCount = 0;
          let addedCount = 0;

          // CLEANUP STEP: Delete existing products that don't match the standard code or are marked as "projeto"
          for (const p of currentProducts) {
            if (!isValidStandardCode(p.code)) {
              await deleteDoc(doc(db, 'registered_products', p.id!));
              deletedCount++;
            }
          }
          
          // Refresh local list after cleanup
          const refreshedSnap = await getDocs(collection(db, 'registered_products'));
          currentProducts = refreshedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegisteredProduct));

          // Group products by code to identify duplicates
          const prodMapByCode = new Map<string, RegisteredProduct[]>();
          currentProducts.forEach(p => {
            const code = p.code.toLowerCase();
            if (!prodMapByCode.has(code)) prodMapByCode.set(code, []);
            prodMapByCode.get(code)?.push(p);
          });
          
          const startIdx = rows[0]?.[0]?.toLowerCase() === 'código' || rows[0]?.[0]?.toLowerCase().includes('item') ? 1 : 0;
          
          for (let i = startIdx; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 4) continue;
            
            const code = row[0]?.trim();
            const description = row[1]?.trim();
            const rawPrice = row[3]?.trim() || '';
            const priceStr = rawPrice.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
            const price = parseFloat(priceStr) || 0;
            
            // STRICT VALIDATION: Skip rows missing standard code or marked as "projeto"
            if (!isValidStandardCode(code)) continue;
            if (!description) continue;
            
            const existingList = prodMapByCode.get(code.toLowerCase());
            
            if (existingList && existingList.length > 0) {
              const primary = existingList[0];
              
              if (primary.base_price !== price || primary.name !== description) {
                await updateDoc(doc(db, 'registered_products', primary.id), {
                  name: description,
                  base_price: price,
                  updated_at: new Date().toISOString()
                });
                updatedCount++;
              }
              
              if (existingList.length > 1) {
                for (let j = 1; j < existingList.length; j++) {
                  await deleteDoc(doc(db, 'registered_products', existingList[j].id));
                  deletedCount++;
                }
              }
              
              prodMapByCode.delete(code.toLowerCase());
            } else {
              await addDoc(collection(db, 'registered_products'), {
                code,
                name: description,
                base_price: price,
                category: 'Equip. Roder',
                is_commissionable: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              addedCount++;
            }
          }
          
          toast.success(`Sincronização concluída! ${addedCount} novos, ${updatedCount} atualizados, ${deletedCount} excluídos.`, { id: toastId });
          setSyncing(false);
        },
        error: (err: any) => {
          console.error("CSV Parse Error:", err);
          toast.error("Erro ao processar dados da planilha.", { id: toastId });
          setSyncing(false);
        }
      });
    } catch (error: any) {
      console.error("Sheet Sync Error:", error);
      toast.error(`Erro: ${error.message}`, { id: toastId });
      setSyncing(false);
    }
  };

  const syncPhotosFromCatalog = async () => {
    try {
      const catalogSnap = await getDocs(collection(db, 'products'));
      const catalogProducts = catalogSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      const registeredSnap = await getDocs(collection(db, 'registered_products'));
      
      let updatedCount = 0;
      for (const regDoc of registeredSnap.docs) {
        const regData = regDoc.data() as RegisteredProduct;
        if (regData.image_url) continue;
        
        let foundPhoto = '';
        for (const catProd of catalogProducts) {
          if (regData.name.toLowerCase().includes(catProd.name.toLowerCase())) {
            foundPhoto = catProd.image_url;
          }
          if (catProd.models) {
            for (const model of catProd.models) {
              if (regData.name.toLowerCase().includes(model.name.toLowerCase())) {
                foundPhoto = model.images?.[0] || foundPhoto;
              }
            }
          }
        }
        
        if (foundPhoto) {
          await updateDoc(doc(db, 'registered_products', regDoc.id), {
            image_url: foundPhoto,
            updated_at: new Date().toISOString()
          });
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        toast.success(`${updatedCount} fotos sincronizadas do catálogo!`);
      }
    } catch (error) {
      console.error("Error syncing photos:", error);
    }
  };

  const syncPhotoToCatalog = async (productName: string, imageUrl: string) => {
    try {
      const catalogSnap = await getDocs(collection(db, 'products'));
      for (const catDoc of catalogSnap.docs) {
        const catData = catDoc.data() as Product;
        let updated = false;
        const newModels = catData.models ? [...catData.models] : [];
        
        if (catData.name.toLowerCase() === productName.toLowerCase()) {
          await updateDoc(doc(db, 'products', catDoc.id), { image_url: imageUrl });
          updated = true;
        }
        
        if (catData.models) {
          catData.models.forEach((model, idx) => {
            if (productName.toLowerCase().includes(model.name.toLowerCase()) || 
                model.name.toLowerCase().includes(productName.toLowerCase())) {
              if (!newModels[idx].images) newModels[idx].images = [];
              if (!newModels[idx].images.includes(imageUrl)) {
                newModels[idx].images = [imageUrl, ...newModels[idx].images];
                updated = true;
              }
            }
          });
        }
        
        if (updated && catData.models) {
          await updateDoc(doc(db, 'products', catDoc.id), { models: newModels });
        }
      }
    } catch (error) {
      console.error("Error back-syncing photo to catalog:", error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
              title="Voltar"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Produtos Cadastrados ({products.length})</h1>
              <p className="text-muted-foreground">Base de preços para cálculo de comissões.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => syncFromGoogleSheet()} 
                  disabled={syncing}
                  className="border-green-600 text-green-600 hover:bg-green-50 font-bold uppercase tracking-wider text-[10px] h-10"
                >
                  <FileSpreadsheet className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
                  Sincronizar Planilha
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => syncFromStock()} 
                  disabled={syncing}
                  className="border-primary text-primary hover:bg-primary/10 font-bold uppercase tracking-wider text-[10px] h-10"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
                  Sincronizar Estoque
                </Button>
                <Button onClick={() => {
                  setEditingProduct(null);
                  setFormData({ code: '', name: '', base_price: 0, category: '', is_commissionable: true, image_url: '' });
                  setIsDialogOpen(true);
                }} className="font-bold uppercase tracking-wider text-[10px] h-10">
                  <Plus className="h-4 w-4 mr-2" /> Novo Produto
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="h-10 w-10 text-muted-foreground hover:text-destructive"
              title="Sair"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por código ou nome..." 
            className="pl-10 pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
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

        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[50px] px-2">Foto</TableHead>
                <TableHead className="w-[90px] px-2">Código</TableHead>
                <TableHead className="min-w-[180px] px-2">Produto</TableHead>
                <TableHead className="w-[110px] px-2">Categoria</TableHead>
                <TableHead className="text-center w-[70px] px-2">Estoque</TableHead>
                <TableHead className="text-right w-[110px] px-2">Preço Base</TableHead>
                <TableHead className="text-center w-[90px] px-2">Atualizado</TableHead>
                <TableHead className="text-center w-[70px] px-2">Comiss.</TableHead>
                {canManage && <TableHead className="text-right w-[90px] px-2">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow key="loading-row">
                  <TableCell colSpan={9} className="text-center py-10">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow key="empty-row">
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-2 px-2">
                      <div className="h-8 w-8 rounded border border-border overflow-hidden bg-muted flex items-center justify-center">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground/30" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell 
                      className="font-mono text-[11px] font-black text-blue-600 py-2 px-2 border-r border-border/30 cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => handleCopy(product.code, 'Código')}
                      title="Clique para copiar código"
                    >
                      {product.code}
                    </TableCell>
                    <TableCell className="py-2 px-2">
                      <div className="relative group">
                        <div 
                          className="font-medium text-[11px] cursor-pointer sm:cursor-default leading-tight hover:text-primary transition-colors"
                          title="Clique para copiar nome (Desktop) / Ver completo (Mobile)"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.innerWidth > 640) {
                              handleCopy(product.name, 'Nome');
                            } else {
                              setExpandedNameId(expandedNameId === product.id ? null : product.id);
                            }
                          }}
                        >
                          {truncate(normalizeDescription(product.name), 50)}
                        </div>
                        {expandedNameId === product.id && (
                          <div className="absolute z-50 left-0 top-full mt-1 p-3 bg-popover border border-border rounded-md shadow-2xl text-xs min-w-[200px] sm:hidden animate-in fade-in slide-in-from-top-1">
                            <p className="font-bold mb-1 text-primary">Nome Completo:</p>
                            {product.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted border border-border uppercase font-bold whitespace-nowrap">
                        {product.category.replace('Equipamentos', 'Equip.').replace('Équipe.', 'Equip.')}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-2 px-2">
                      <div className="flex flex-col items-center">
                        {canManage ? (
                          <div className="relative flex items-center justify-center">
                            {editingStockId === product.id ? (
                              <div className="flex items-center gap-1 bg-background border border-primary rounded-md p-1 shadow-lg z-10">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => setTempStock(prev => Math.max(0, prev - 1))}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                                <Input 
                                  type="number" 
                                  className="h-6 w-12 text-center text-[10px] p-0" 
                                  value={tempStock}
                                  onChange={(e) => setTempStock(parseInt(e.target.value) || 0)}
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => setTempStock(prev => prev + 1)}
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-green-500"
                                  onClick={() => handleUpdateStock(product.code, tempStock)}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-red-500"
                                  onClick={() => setEditingStockId(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setEditingStockId(product.id);
                                  setTempStock(stockCounts[(product.code || '').toLowerCase()] || 0);
                                }}
                                className="hover:text-primary transition-all cursor-pointer flex flex-col items-center"
                                title="Clique para editar estoque"
                              >
                                <span className={cn(
                                  "text-base font-black",
                                  (stockCounts[(product.code || '').toLowerCase()] || 0) > 0 ? "text-green-500" : "text-muted-foreground/30"
                                )}>
                                  {stockCounts[(product.code || '').toLowerCase()] || 0}
                                </span>
                                <span className="text-[7px] uppercase font-bold text-muted-foreground">unid.</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            <span className={cn(
                              "text-base font-black",
                              (stockCounts[(product.code || '').toLowerCase()] || 0) > 0 ? "text-green-500" : "text-muted-foreground/30"
                            )}>
                              {stockCounts[(product.code || '').toLowerCase()] || 0}
                            </span>
                            <span className="text-[7px] uppercase font-bold text-muted-foreground">unid.</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-black text-primary text-base py-2 px-2">
                      {product.base_price > 0 ? (
                        formatCurrency(product.base_price)
                      ) : (
                        <span className="text-red-500 flex items-center justify-end gap-1 text-[9px] font-bold uppercase">
                          <AlertCircle className="h-3 w-3" /> S/ Preço
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-2 px-2">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Data</span>
                        <span className="text-[10px] font-black text-foreground">
                          {safeFormatDate(product.updated_at || product.created_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2 px-2">
                      <button 
                        onClick={() => handleToggleCommission(product.id, product.is_commissionable)}
                        className="hover:scale-110 transition-transform"
                        title="Clique para alternar status comissionável"
                      >
                        {product.is_commissionable ? (
                          <div className="flex flex-col items-center">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-[7px] font-bold text-green-500 uppercase">Sim</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/30" />
                            <span className="text-[7px] font-bold text-muted-foreground/30 uppercase">Não</span>
                          </div>
                        )}
                      </button>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right py-2 px-2">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setEditingProduct(product);
                              setFormData({
                                code: product.code,
                                name: product.name,
                                base_price: product.base_price,
                                category: product.category,
                                is_commissionable: product.is_commissionable,
                                image_url: product.image_url || ''
                              });
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>
              Defina o código e o preço base para o cálculo de comissões.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-center block">Foto do Produto</Label>
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="relative h-32 w-32 rounded-lg border-2 border-dashed border-border overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:border-primary transition-colors group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.image_url ? (
                    <div key="image-preview" className="w-full h-full relative">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <RefreshCw className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div key="upload-placeholder" className="flex flex-col items-center gap-2 text-muted-foreground">
                      {uploadingImage ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                      <span className="text-[10px] font-bold uppercase">Upload</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                />
                <div className="w-full space-y-1">
                  <Label htmlFor="image_url" className="text-[10px] uppercase font-bold text-muted-foreground">Ou cole a URL da imagem</Label>
                  <Input 
                    id="image_url" 
                    placeholder="https://exemplo.com/foto.jpg" 
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código (Padrão Roder)</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: oder-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input 
                  id="category" 
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Garras"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço Base (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="price" 
                  type="number"
                  className="pl-10"
                  value={formData.base_price} 
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="comm" 
                checked={formData.is_commissionable}
                onChange={(e) => setFormData({ ...formData, is_commissionable: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="comm" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Produto Comissionável
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </Layout>
);
}
