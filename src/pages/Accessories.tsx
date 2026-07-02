import React, { useState, useMemo, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Search, 
  Copy, 
  Check, 
  Package, 
  Settings, 
  ChevronRight, 
  Info,
  FileText,
  ExternalLink,
  List,
  Plus,
  Trash2,
  Edit2,
  X,
  Upload,
  FileJson,
  Loader2,
  Share2,
  Camera,
  FileDown,
  Eye,
  Image
} from 'lucide-react';
import { ACCESSORIES_DATA, INSTALLATION_KITS as DEFAULT_KITS } from '../constants';
import { Accessory, InstallationKit, InstallationKitItem } from '../types';
import { db, storage } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../lib/imageUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { cn, getApiBaseUrl } from '../lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const getDisplayImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  let cleanUrl = url.trim();
  
  if (cleanUrl.includes('/uploads/')) {
    const parts = cleanUrl.split('/uploads/');
    cleanUrl = `${getApiBaseUrl()}/uploads/${parts[parts.length - 1]}`;
  } else if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('/')) {
    cleanUrl = `${getApiBaseUrl()}/uploads/${cleanUrl}`;
  }
  
  if (cleanUrl.startsWith('https://firebasestorage.googleapis.com')) {
    return `${getApiBaseUrl()}/api/proxy-image?url=${encodeURIComponent(cleanUrl)}`;
  }
  return cleanUrl;
};

const getAbsoluteImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  const cleanUrl = getDisplayImageUrl(url);
  if (cleanUrl.startsWith('/')) {
    const baseUrl = getApiBaseUrl();
    return (baseUrl || window.location.origin) + cleanUrl;
  }
  return cleanUrl;
};

// Background Seeding Helpers
const seedMissingAccessories = async (existing: Accessory[]) => {
  if ((window as any).isSeedingAccessories) return;
  (window as any).isSeedingAccessories = true;

  try {
    const toSeed = ACCESSORIES_DATA.filter(defaultItem => {
      return !existing.some(firestoreItem => {
        if (firestoreItem.brand.toLowerCase() !== defaultItem.brand.toLowerCase()) return false;
        
        const cleanModel = (m: string) => m.toLowerCase().replace(/[\s\/-]/g, '');
        const dm = cleanModel(defaultItem.model);
        const fm = cleanModel(firestoreItem.model);
        
        return fm.includes(dm) || dm.includes(fm);
      });
    });

    if (toSeed.length > 0) {
      console.log(`Seeding ${toSeed.length} missing default accessories to Firestore...`);
      for (const item of toSeed) {
        await addDoc(collection(db, 'accessories'), {
          ...item,
          created_at: new Date().toISOString()
        });
      }
    }
  } catch (e) {
    console.error("Error seeding accessories:", e);
  } finally {
    (window as any).isSeedingAccessories = false;
  }
};

const seedMissingKits = async (existing: InstallationKit[]) => {
  if ((window as any).isSeedingKits) return;
  (window as any).isSeedingKits = true;

  try {
    const toSeed = DEFAULT_KITS.filter(defaultKit => {
      return !existing.some(fk => fk.code === defaultKit.code);
    });

    if (toSeed.length > 0) {
      console.log(`Seeding ${toSeed.length} missing default kits to Firestore...`);
      for (const kit of toSeed) {
        await addDoc(collection(db, 'installation_kits'), {
          ...kit,
          created_at: new Date().toISOString()
        });
      }
    }
  } catch (e) {
    console.error("Error seeding installation kits:", e);
  } finally {
    (window as any).isSeedingKits = false;
  }
};

export default function Accessories() {
  const { isManager, profile } = useAuth();
  
  // Data State
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [kits, setKits] = useState<InstallationKit[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [accessorySearch, setAccessorySearch] = useState('');
  const [kitSearch, setKitSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedKit, setSelectedKit] = useState<InstallationKit | null>(null);

  // Modal States
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'accessory' | 'kit'>('accessory');
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [editingKit, setEditingKit] = useState<InstallationKit | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Form States
    const [accessoryForm, setAccessoryForm] = useState<Partial<Accessory>>({
    brand: '', model: '', pin: '', 
    ponteira_biela_4: '', ponteira_biela_6: '', 
    suporte_destocador: '', suporte_triturador: '',
    link_garra_biela_6: '', link_garra_biela_4: '',
    photo_urls: { ponteira: '', suporte: '', link: '' }
  });
  const [kitForm, setKitForm] = useState<Partial<InstallationKit>>({
    code: '', description: '', items: []
  });

  useEffect(() => {
    const unsubAccessories = onSnapshot(
      query(collection(db, 'accessories'), orderBy('brand')), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Accessory));
        setAccessories(data.length > 0 ? data : ACCESSORIES_DATA as unknown as Accessory[]);
        setLoading(false);
        // Automatically seed/restore missing default accessories
        seedMissingAccessories(data);
      },
      (error) => {
        console.error("Error fetching accessories:", error);
        setAccessories(ACCESSORIES_DATA as unknown as Accessory[]);
        setLoading(false);
      }
    );

    const unsubKits = onSnapshot(
      query(collection(db, 'installation_kits'), orderBy('code')), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InstallationKit));
        setKits(data.length > 0 ? data : DEFAULT_KITS as unknown as InstallationKit[]);
        // Automatically seed/restore missing default installation kits
        seedMissingKits(data);
      },
      (error) => {
        console.error("Error fetching kits:", error);
        setKits(DEFAULT_KITS as unknown as InstallationKit[]);
      }
    );

    return () => {
      unsubAccessories();
      unsubKits();
    };
  }, []);

  const filteredAccessories = useMemo(() => {
    return accessories.filter(item => 
      (item.brand.toLowerCase().includes(accessorySearch.toLowerCase()) ||
      item.model.toLowerCase().includes(accessorySearch.toLowerCase()))
    );
  }, [accessories, accessorySearch]);

  const brands = useMemo(() => {
    const b = Array.from(new Set(accessories.map(a => a.brand))).sort();
    return b;
  }, [accessories]);

  const filteredKits = useMemo(() => {
    return kits.filter(kit => 
      kit.code.toLowerCase().includes(kitSearch.toLowerCase()) ||
      kit.description.toLowerCase().includes(kitSearch.toLowerCase())
    );
  }, [kits, kitSearch]);

  const handleCopy = (code: string, description?: string) => {
    const textToCopy = description ? `${code} - ${description}` : code;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCode(code);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const parseKitText = (text: string) => {
    // Split by "Item UN Versão" which seems to be the separator between kits
    const kitBlocks = text.split(/Item UN Versão/i);
    const parsedKits: any[] = [];

    kitBlocks.forEach(block => {
      if (!block.trim()) return;

      // Find kit header: Code + Description + UN 1
      // Example: 9000.9000.9000 KIT INSTALACAO... UN 1
      const kitHeaderMatch = block.match(/(\d{4}\.\d{4}\.\d{4})\s+(.+?)\s+UN\s+1/);
      if (kitHeaderMatch) {
        const kitCode = kitHeaderMatch[1];
        let kitDesc = kitHeaderMatch[2].trim();
        
        // Clean up description if it contains the table headers
        kitDesc = kitDesc.split(/Nível NºItem Descrição/i)[0].trim();

        const items: any[] = [];
        
        // Find items: Pattern seems to be [Nível] [NºItem][Code] [Description] UN [Quantity]
        // Example: 1 15000.1001.0016 CAIXA ELETRICA... UN 1,000000
        // We look for the code pattern 0000.0000.0000
        const itemRegex = /(\d{4,5}\.\d{4}\.\d{4})\s+(.+?)\s+UN\s+([\d,.]+)/g;
        let itemMatch;
        
        while ((itemMatch = itemRegex.exec(block)) !== null) {
          const fullCode = itemMatch[1];
          // If the code starts with the item number (e.g. 15000.1001.0016 where 1 is item number)
          // we need to extract the real code 5000.1001.0016
          let realCode = fullCode;
          if (fullCode.length > 12) {
            // Assuming the code is always the last 12 characters if it's in 0000.0000.0000 format
            // But wait, the format is 4.4.4 = 12 chars + 2 dots = 14 chars.
            // 0000.0000.0000 is 14 chars.
            // If we have 15000.1001.0016, that's 15 chars. The first '1' is the item number.
            realCode = fullCode.slice(-14);
          }

          if (realCode === kitCode) continue; // Skip if it matched the kit code again

          items.push({
            code: realCode,
            description: itemMatch[2].trim(),
            quantity: parseFloat(itemMatch[3].replace(',', '.'))
          });
        }

        if (items.length > 0) {
          parsedKits.push({
            code: kitCode,
            description: kitDesc,
            items
          });
        }
      }
    });

    return parsedKits;
  };

  const handleBulkImport = async () => {
    if (!pasteText.trim()) return;
    const parsed = parseKitText(pasteText);
    if (parsed.length === 0) {
      toast.error('Nenhum kit identificado no texto. Verifique o formato.');
      return;
    }

    setLoading(true);
    try {
      for (const kit of parsed) {
        await addDoc(collection(db, 'installation_kits'), {
          ...kit,
          created_at: new Date().toISOString()
        });
      }
      toast.success(`${parsed.length} kits importados com sucesso!`);
      setPasteText('');
      setIsKitModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro na importação.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccessory = async () => {
    if (!accessoryForm.brand || !accessoryForm.model || !accessoryForm.pin) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    try {
      if (editingAccessory?.id) {
        await updateDoc(doc(db, 'accessories', editingAccessory.id), accessoryForm);
        toast.success('Acessório atualizado!');
      } else {
        await addDoc(collection(db, 'accessories'), {
          ...accessoryForm,
          created_at: new Date().toISOString()
        });
        toast.success('Acessório cadastrado!');
      }
      setIsAccessoryModalOpen(false);
      setEditingAccessory(null);
      setAccessoryForm({ 
        brand: '', model: '', pin: '', 
        ponteira_biela_4: '', ponteira_biela_6: '', 
        suporte_destocador: '', suporte_triturador: '',
        link_garra_biela_6: '', link_garra_biela_4: '',
        photo_urls: { ponteira: '', suporte: '', link: '' }
      });
    } catch (error) {
      toast.error('Erro ao salvar.');
    }
  };

  const handleDeleteAccessory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este acessório?')) return;
    try {
      await deleteDoc(doc(db, 'accessories', id));
      toast.success('Excluído!');
    } catch (error) {
      toast.error('Erro ao excluir.');
    }
  };

  const handleDeleteKit = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este kit?')) return;
    try {
      await deleteDoc(doc(db, 'installation_kits', id));
      toast.success('Excluído!');
    } catch (error) {
      toast.error('Erro ao excluir.');
    }
  };

  const handleSaveKit = async () => {
    if (!kitForm.code || !kitForm.description) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    try {
      if (editingKit?.id) {
        await updateDoc(doc(db, 'installation_kits', editingKit.id), kitForm);
        toast.success('Kit atualizado!');
      } else {
        await addDoc(collection(db, 'installation_kits'), {
          ...kitForm,
          created_at: new Date().toISOString()
        });
        toast.success('Kit cadastrado!');
      }
      setIsKitModalOpen(false);
      setEditingKit(null);
      setKitForm({ code: '', description: '', items: [], photo_url: '' });
    } catch (error) {
      toast.error('Erro ao salvar.');
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'ponteira' | 'suporte' | 'link') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const loadingToast = toast.loading(`Compactando e enviando foto de ${type}...`);

    try {
      const compressedFile = await compressImage(file);
      const base64Data = await blobToBase64(compressedFile);

      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileBase64: base64Data,
          fileName: `${type}_${file.name}`,
          contentType: file.type,
          folder: 'accessories'
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha no upload do servidor');
      }

      const uploadResult = await res.json();
      const downloadURL = uploadResult.url;

      setAccessoryForm(prev => ({
        ...prev,
        photo_urls: {
          ...prev.photo_urls,
          [type]: downloadURL
        }
      }));

      toast.dismiss(loadingToast);
      toast.success('Foto enviada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error('Erro ao enviar foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleKitFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const loadingToast = toast.loading("Compactando e enviando foto do kit...");

    try {
      const compressedFile = await compressImage(file);
      const base64Data = await blobToBase64(compressedFile);

      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileBase64: base64Data,
          fileName: file.name,
          contentType: file.type,
          folder: 'installation_kits'
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha no upload do kit');
      }

      const uploadResult = await res.json();
      const downloadURL = uploadResult.url;

      setKitForm(prev => ({
        ...prev,
        photo_url: downloadURL
      }));

      toast.dismiss(loadingToast);
      toast.success('Foto do kit enviada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error('Erro ao enviar foto do kit.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleShareKitAsPdf = () => {
    if (!selectedKit) return;

    const loadingToast = toast.loading('Gerando PDF do kit...');
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(234, 88, 12); // Roder Orange
      doc.text('RODER - Equipamentos Florestais', 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Kit: ${selectedKit.description}`, 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('courier', 'bold');
      doc.text(`CÓDIGO: ${selectedKit.code}`, 105, 38, { align: 'center' });
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 45, 190, 45);

      // Table
      const tableData = selectedKit.items.map(item => [
        item.code,
        item.description,
        item.quantity.toString()
      ]);

      autoTable(doc, {
        startY: 50,
        head: [['Código Principal', 'Descrição do Item', 'Qtd']],
        body: tableData,
        headStyles: { fillColor: [234, 88, 12] },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          2: { cellWidth: 20, halign: 'center' }
        }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | www.roder.com.br`,
          105,
          285,
          { align: 'center' }
        );
      }

      // Save/Share
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `kit_${selectedKit.code}.pdf`, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: `Kit ${selectedKit.code}`,
          text: `Confira a composição do Kit ${selectedKit.code} - ${selectedKit.description}`
        });
      } else {
        doc.save(`kit_${selectedKit.code}.pdf`);
        toast.info('Compartilhamento direto não suportado. PDF baixado.');
      }
      toast.dismiss(loadingToast);
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error('Erro ao gerar PDF.');
    }
  };

  const handleManualKitEdit = (kit: InstallationKit) => {
    setEditingKit(kit);
    setKitForm(kit);
    setPasteText(''); // Clear paste text when editing manually
    setIsKitModalOpen(true);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Acessórios e Kits</h1>
            <p className="text-muted-foreground">Consulta técnica de códigos e componentes.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1">
              {accessories.length} Máquinas
            </Badge>
            <Badge variant="outline" className="bg-blue-500/5 text-blue-500 border-blue-500/20 px-3 py-1">
              {kits.length} Kits
            </Badge>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden w-full bg-muted/30 p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab('accessory')}
            className={cn(
              "flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              activeTab === 'accessory' ? "bg-primary text-white shadow-md" : "text-muted-foreground"
            )}
          >
            Acessório
          </button>
          <button 
            onClick={() => setActiveTab('kit')}
            className={cn(
              "flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              activeTab === 'kit' ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground"
            )}
          >
            Kit Hidráulico
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel 1: Accessories */}
          <Card className={cn(
            "bg-card border-border shadow-lg flex flex-col h-[750px]",
            activeTab === 'kit' && "hidden md:flex"
          )}>
            <CardHeader className="border-b border-border bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Quadro 1: Acessórios</CardTitle>
                </div>
                {isManager && (
                  <Button size="sm" onClick={() => {
                    setEditingAccessory(null);
                    setAccessoryForm({ brand: '', model: '', pin: '' });
                    setIsAccessoryModalOpen(true);
                  }} className="h-8 gap-1">
                    <Plus className="h-4 w-4" /> Novo
                  </Button>
                )}
              </div>
              <CardDescription>Busca por Marca/Modelo da Máquina</CardDescription>
              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Ex: Caterpillar 320D..." 
                    className="pl-10 bg-background border-border"
                    value={accessorySearch}
                    onChange={(e) => setAccessorySearch(e.target.value)}
                  />
                </div>
                <Dialog open={isBrandModalOpen} onOpenChange={setIsBrandModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
                      <List className="h-4 w-4" /> Máquinas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Marcas de Máquinas</DialogTitle>
                      <DialogDescription>Selecione uma marca para filtrar os acessórios.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-2 py-4">
                      {brands.map(brand => (
                        <Button 
                          key={brand} 
                          variant="outline" 
                          className="justify-start font-bold h-12"
                          onClick={() => {
                            setAccessorySearch(brand);
                            setIsBrandModalOpen(false);
                          }}
                        >
                          {brand}
                        </Button>
                      ))}
                      <Button 
                        variant="ghost" 
                        className="col-span-2 text-muted-foreground"
                        onClick={() => {
                          setAccessorySearch('');
                          setIsBrandModalOpen(false);
                        }}
                      >
                        Limpar Filtro
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="divide-y divide-border">
                  {loading ? (
                    <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                  ) : filteredAccessories.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">Nenhuma máquina encontrada.</div>
                  ) : (
                    filteredAccessories.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 md:p-4 hover:bg-muted/30 transition-colors group relative">
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                          <div className="flex flex-col gap-0.5 md:gap-1">
                            <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                              {item.brand}
                            </span>
                            <span className="text-base md:text-lg font-bold text-foreground">{item.model}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] md:text-xs font-mono py-0.5 md:py-1 px-1.5 md:px-2">{item.pin}</Badge>
                            {isManager && (
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => {
                                  setEditingAccessory(item);
                                  setAccessoryForm(item);
                                  setIsAccessoryModalOpen(true);
                                }}>
                                  <Edit2 className="h-3 w-3" /> Editar
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs text-red-500 hover:text-red-600" onClick={() => item.id && handleDeleteAccessory(item.id)}>
                                  <Trash2 className="h-3 w-3" /> Excluir
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {item.ponteira_biela_4 && <AccessoryItem label="Ponteira Biela 4" code={item.ponteira_biela_4} onCopy={() => handleCopy(item.ponteira_biela_4!)} isCopied={copiedCode === item.ponteira_biela_4} photoUrl={item.photo_urls?.ponteira} />}
                          {item.ponteira_biela_6 && <AccessoryItem label="Ponteira Biela 6" code={item.ponteira_biela_6} onCopy={() => handleCopy(item.ponteira_biela_6!)} isCopied={copiedCode === item.ponteira_biela_6} photoUrl={item.photo_urls?.ponteira} />}
                          {item.suporte_destocador && <AccessoryItem label="Suporte Destocador" code={item.suporte_destocador} onCopy={() => handleCopy(item.suporte_destocador!)} isCopied={copiedCode === item.suporte_destocador} photoUrl={item.photo_urls?.suporte} />}
                          {item.suporte_triturador && <AccessoryItem label="Suporte Triturador" code={item.suporte_triturador} onCopy={() => handleCopy(item.suporte_triturador!)} isCopied={copiedCode === item.suporte_triturador} photoUrl={item.photo_urls?.suporte} />}
                          {item.link_garra_biela_6 && <AccessoryItem label="Link Garra Biela 6" code={item.link_garra_biela_6} onCopy={() => handleCopy(item.link_garra_biela_6!)} isCopied={copiedCode === item.link_garra_biela_6} photoUrl={item.photo_urls?.link} />}
                          {item.link_garra_biela_4 && <AccessoryItem label="Link Garra Biela 4" code={item.link_garra_biela_4} onCopy={() => handleCopy(item.link_garra_biela_4!)} isCopied={copiedCode === item.link_garra_biela_4} photoUrl={item.photo_urls?.link} />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Panel 2: Installation Kits */}
          <Card className={cn(
            "bg-card border-border shadow-lg flex flex-col h-[750px]",
            activeTab === 'accessory' && "hidden md:flex"
          )}>
            <CardHeader className="border-b border-border bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Quadro 2: Kit de Instalação</CardTitle>
                </div>
                {isManager && (
                  <Button size="sm" onClick={() => {
                    setEditingKit(null);
                    setKitForm({ code: '', description: '', items: [], photo_url: '' });
                    setIsKitModalOpen(true);
                  }} className="h-8 gap-1 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> Novo Kit
                  </Button>
                )}
              </div>
              <CardDescription>Busca por Código ou Descrição do Kit</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Ex: 2000.0001 ou Garra 0.35..." 
                  className="pl-10 bg-background border-border"
                  value={kitSearch}
                  onChange={(e) => setKitSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="divide-y divide-border">
                  {filteredKits.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">Nenhum kit encontrado.</div>
                  ) : (
                    filteredKits.map((kit) => (
                      <div 
                        key={kit.id || kit.code} 
                        className={cn(
                          "p-3 md:p-4 hover:bg-muted/30 transition-colors cursor-pointer group relative",
                          selectedKit?.code === kit.code && "bg-blue-500/5 border-l-4 border-l-blue-500"
                        )}
                        onClick={() => setSelectedKit(kit)}
                      >
                        <div className="flex items-start justify-between gap-2 md:gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Photo Thumbnail */}
                            {kit.photo_url ? (
                              <Dialog>
                                <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer border border-border hover:border-blue-500/50 shadow-sm hover:shadow transition-all shrink-0 flex items-center justify-center relative group">
                                    <img src={getDisplayImageUrl(kit.photo_url)} alt={kit.description} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-[8px] text-white text-center font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                      Ver Foto
                                    </div>
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-card border-border">
                                  <DialogHeader className="p-4 border-b border-border bg-muted/20">
                                    <DialogTitle className="text-base font-bold text-foreground">{kit.description}</DialogTitle>
                                    <DialogDescription className="font-mono text-xs text-blue-500 font-semibold">{kit.code}</DialogDescription>
                                  </DialogHeader>
                                  <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                                    <img src={getDisplayImageUrl(kit.photo_url)} alt={kit.description} className="max-w-full max-h-full object-contain rounded-lg shadow-md" referrerPolicy="no-referrer" />
                                  </div>
                                  <div className="p-4 border-t border-border bg-muted/10 flex flex-col sm:flex-row gap-2 justify-end">
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs font-medium gap-1.5"
                                      onClick={() => {
                                        navigator.clipboard.writeText(getAbsoluteImageUrl(kit.photo_url) || '');
                                        toast.success('Link da foto copiado!');
                                      }}
                                    >
                                      <Copy className="h-3.5 w-3.5" /> Copiar Link
                                    </Button>
                                    <Button 
                                      type="button"
                                      variant="default" 
                                      size="sm" 
                                      className="text-xs font-bold bg-green-600 hover:bg-green-700 hover:text-white text-white gap-1.5"
                                      onClick={() => {
                                        const text = `Confira o Kit de Instalação da Roder: *${kit.description}* (Cód. ${kit.code})\n\nFoto do kit: ${getAbsoluteImageUrl(kit.photo_url)}`;
                                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                      }}
                                    >
                                      <Share2 className="h-3.5 w-3.5" /> Enviar pelo WhatsApp
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <div 
                                className="h-12 w-12 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 text-slate-400 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                                onClick={(e) => {
                                  if (isManager) {
                                    e.stopPropagation();
                                    handleManualKitEdit(kit);
                                  }
                                }}
                                title={isManager ? "Clique para adicionar uma foto" : undefined}
                              >
                                <Image className="h-5 w-5 opacity-40 hover:opacity-70 transition-opacity" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0" onClick={() => setSelectedKit(kit)}>
                              <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                                <span className="text-xs md:text-sm font-mono font-bold text-blue-500">{kit.code}</span>
                                {selectedKit?.code === kit.code && <Check className="h-3 w-3 text-blue-500" />}
                              </div>
                              <p className="text-xs md:text-sm font-bold text-foreground leading-tight">{kit.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isManager && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={(e) => {
                                  e.stopPropagation();
                                  handleManualKitEdit(kit);
                                }}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(kit.code, kit.description);
                                }}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                                {kit.id && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteKit(kit.id!);
                                  }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                            <ChevronRight className={cn(
                              "h-5 w-5 text-muted-foreground/30 group-hover:text-blue-500 transition-all",
                              selectedKit?.code === kit.code && "rotate-90 text-blue-500"
                            )} />
                          </div>
                        </div>
                        
                        {selectedKit?.code === kit.code && (
                          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Dialog onOpenChange={(open) => !open && setSelectedKit(null)}>
                              <DialogTrigger asChild>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 text-xs font-bold uppercase tracking-wider">
                                  <List className="h-4 w-4" /> Ver Composição do Kit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[800px] bg-card border-border p-0 overflow-hidden max-h-[90vh] flex flex-col">
                                <DialogHeader className="p-4 md:p-6 border-b border-border bg-muted/30 relative">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                      <Package className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                      <DialogTitle className="text-lg md:text-xl">{kit.description}</DialogTitle>
                                      <DialogDescription className="font-mono text-blue-500 font-bold text-sm md:text-base">
                                        CÓDIGO: {kit.code}
                                      </DialogDescription>
                                    </div>
                                  </div>
                                </DialogHeader>
                                
                                <ScrollArea className="flex-1 overflow-y-auto">
                                  <div className="p-0 bg-white">
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse">
                                        <thead>
                                          <tr className="bg-muted/50 border-b border-border">
                                            <th className="px-4 md:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Código Principal</th>
                                            <th className="px-4 md:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descrição do Item</th>
                                            <th className="px-4 md:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Qtd</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {kit.items.map((item, i) => (
                                            <tr 
                                              key={i} 
                                              className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer group"
                                              onClick={() => {
                                                const text = `${item.code} ${item.description} ${item.quantity}`;
                                                navigator.clipboard.writeText(text);
                                                toast.success('Linha copiada!');
                                              }}
                                            >
                                              <td className="px-4 md:px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm md:text-base font-mono font-bold text-blue-600">{item.code}</span>
                                                  <Copy className="h-3 w-3 text-muted-foreground/30 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                                                </div>
                                              </td>
                                              <td className="px-4 md:px-6 py-4">
                                                <p className="text-xs md:text-sm font-bold text-foreground leading-tight">{item.description}</p>
                                              </td>
                                              <td className="px-4 md:px-6 py-4 text-center">
                                                <Badge variant="outline" className="h-7 md:h-8 min-w-[28px] md:min-w-[32px] rounded-full flex items-center justify-center px-2 font-black border-primary/30 text-primary text-xs bg-primary/5">
                                                  {item.quantity}
                                                </Badge>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </ScrollArea>

                                <div className="p-4 border-t border-border bg-muted/10 flex flex-col md:flex-row items-center justify-between gap-4">
                                  <p className="text-[10px] text-muted-foreground italic text-center md:text-left">
                                    * Clique em qualquer linha para copiar Código + Descrição + Quantidade
                                  </p>
                                  <div className="flex gap-2 w-full md:w-auto">
                                    <Button variant="outline" size="sm" className="flex-1 md:flex-none text-xs gap-2" onClick={() => handleCopy(kit.code, kit.description)}>
                                      <Copy className="h-3 w-3" /> Copiar Texto
                                    </Button>
                                    <Button variant="default" size="sm" className="flex-1 md:flex-none text-xs gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleShareKitAsPdf}>
                                      <FileDown className="h-3 w-3" /> Compartilhar PDF (WhatsApp)
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Accessory Modal */}
      <Dialog open={isAccessoryModalOpen} onOpenChange={setIsAccessoryModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAccessory ? 'Editar Acessório' : 'Novo Acessório'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca *</Label>
                <Input value={accessoryForm.brand} onChange={e => setAccessoryForm({...accessoryForm, brand: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Input value={accessoryForm.model} onChange={e => setAccessoryForm({...accessoryForm, model: e.target.value.toUpperCase()})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Diâmetro do Pino *</Label>
              <Input value={accessoryForm.pin} placeholder="Ex: PINO Ø80" onChange={e => setAccessoryForm({...accessoryForm, pin: e.target.value.toUpperCase()})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ponteira Biela 4</Label>
                <Input value={accessoryForm.ponteira_biela_4} onChange={e => setAccessoryForm({...accessoryForm, ponteira_biela_4: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Ponteira Biela 6</Label>
                <Input value={accessoryForm.ponteira_biela_6} onChange={e => setAccessoryForm({...accessoryForm, ponteira_biela_6: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Suporte Destocador</Label>
              <Input value={accessoryForm.suporte_destocador} onChange={e => setAccessoryForm({...accessoryForm, suporte_destocador: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Suporte Triturador</Label>
              <Input value={accessoryForm.suporte_triturador} onChange={e => setAccessoryForm({...accessoryForm, suporte_triturador: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link Garra Biela 6</Label>
                <Input value={accessoryForm.link_garra_biela_6} onChange={e => setAccessoryForm({...accessoryForm, link_garra_biela_6: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Link Garra Biela 4</Label>
                <Input value={accessoryForm.link_garra_biela_4} onChange={e => setAccessoryForm({...accessoryForm, link_garra_biela_4: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fotos (Carregar do Celular ou URL)</Label>
              <div className="grid grid-cols-1 gap-4">
                {/* Ponteira */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Foto da Ponteira</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="URL da Foto" 
                      value={accessoryForm.photo_urls?.ponteira} 
                      onChange={e => setAccessoryForm({...accessoryForm, photo_urls: {...accessoryForm.photo_urls, ponteira: e.target.value}})} 
                      className="flex-1"
                    />
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={e => handleFileUpload(e, 'ponteira')}
                        disabled={isUploading}
                      />
                      <Button variant="outline" size="icon" disabled={isUploading}>
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Suporte */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Foto do Suporte</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="URL da Foto" 
                      value={accessoryForm.photo_urls?.suporte} 
                      onChange={e => setAccessoryForm({...accessoryForm, photo_urls: {...accessoryForm.photo_urls, suporte: e.target.value}})} 
                      className="flex-1"
                    />
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={e => handleFileUpload(e, 'suporte')}
                        disabled={isUploading}
                      />
                      <Button variant="outline" size="icon" disabled={isUploading}>
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Foto do Link</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="URL da Foto" 
                      value={accessoryForm.photo_urls?.link} 
                      onChange={e => setAccessoryForm({...accessoryForm, photo_urls: {...accessoryForm.photo_urls, link: e.target.value}})} 
                      className="flex-1"
                    />
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={e => handleFileUpload(e, 'link')}
                        disabled={isUploading}
                      />
                      <Button variant="outline" size="icon" disabled={isUploading}>
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessoryModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveAccessory}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kit Modal */}
      <Dialog open={isKitModalOpen} onOpenChange={setIsKitModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingKit ? 'Editar Kit' : 'Novo Kit'}</DialogTitle>
            <DialogDescription>
              {editingKit ? 'Altere as informações do kit abaixo.' : 'Cole o texto da planilha para importar automaticamente ou preencha manualmente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código do Kit *</Label>
                <Input 
                  value={kitForm.code} 
                  onChange={e => setKitForm({...kitForm, code: e.target.value})} 
                  placeholder="0000.0000.0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição do Kit *</Label>
                <Input 
                  value={kitForm.description} 
                  onChange={e => setKitForm({...kitForm, description: e.target.value})} 
                  placeholder="Descrição do kit"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Foto do Kit (Opcional)</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  placeholder="URL da Foto do Kit" 
                  value={kitForm.photo_url || ''} 
                  onChange={e => setKitForm({...kitForm, photo_url: e.target.value})} 
                  className="flex-1"
                />
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleKitFileUpload}
                    disabled={isUploading}
                  />
                  <Button variant="outline" size="icon" disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </Button>
                </div>
                {kitForm.photo_url && (
                  <div className="h-10 w-10 rounded border border-border overflow-hidden relative group shrink-0">
                    <img src={getDisplayImageUrl(kitForm.photo_url)} alt="Miniatura" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      type="button" 
                      onClick={() => setKitForm({...kitForm, photo_url: ''})}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Envie uma foto ou insira um link. A foto facilitará o envio pelo WhatsApp.</p>
            </div>

            {!editingKit && (
              <div className="space-y-2">
                <Label>Importação Rápida (Texto da Planilha / PDF)</Label>
                <Textarea 
                  placeholder="Cole aqui o texto contendo o código do kit e seus itens..." 
                  className="h-[150px] font-mono text-xs"
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    const parsed = parseKitText(pasteText);
                    if (parsed.length > 0) {
                      setKitForm(parsed[0]);
                      toast.success('Dados extraídos com sucesso!');
                    } else {
                      toast.error('Não foi possível extrair dados do texto.');
                    }
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" /> Extrair Dados do Texto
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label>Itens do Kit ({kitForm.items?.length || 0})</Label>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                <div className="space-y-2">
                  {kitForm.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-muted/30 p-2 rounded-md group">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input 
                          className="text-xs font-mono" 
                          value={item.code} 
                          onChange={e => {
                            const newItems = [...(kitForm.items || [])];
                            newItems[idx].code = e.target.value;
                            setKitForm({...kitForm, items: newItems});
                          }}
                        />
                        <Input 
                          className="text-xs" 
                          value={item.description} 
                          onChange={e => {
                            const newItems = [...(kitForm.items || [])];
                            newItems[idx].description = e.target.value;
                            setKitForm({...kitForm, items: newItems});
                          }}
                        />
                        <Input 
                          className="text-xs" 
                          type="number"
                          value={item.quantity} 
                          onChange={e => {
                            const newItems = [...(kitForm.items || [])];
                            newItems[idx].quantity = parseFloat(e.target.value);
                            setKitForm({...kitForm, items: newItems});
                          }}
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100"
                        onClick={() => {
                          const newItems = kitForm.items?.filter((_, i) => i !== idx);
                          setKitForm({...kitForm, items: newItems});
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-dashed"
                    onClick={() => {
                      setKitForm({
                        ...kitForm,
                        items: [...(kitForm.items || []), { code: '', description: '', quantity: 1 }]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                  </Button>
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsKitModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveKit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Salvar Kit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function AccessoryItem({ label, code, onCopy, isCopied, photoUrl }: { label: string, code: string, onCopy: () => void, isCopied: boolean, photoUrl?: string }) {
  return (
    <div className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-background border border-border group hover:border-primary/30 transition-all">
      <div className="flex items-center gap-2 md:gap-3">
        {photoUrl ? (
          <Dialog>
            <DialogTrigger asChild>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded bg-muted overflow-hidden cursor-pointer border border-border hover:border-primary/50 transition-all">
                <img src={getDisplayImageUrl(photoUrl)} alt={label} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
              <img src={getDisplayImageUrl(photoUrl)} alt={label} className="w-full h-auto" referrerPolicy="no-referrer" />
            </DialogContent>
          </Dialog>
        ) : (
          <div className="h-8 w-8 md:h-10 md:w-10 rounded bg-muted flex items-center justify-center border border-border">
            <Settings className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground/30" />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[9px] md:text-sm font-mono font-bold text-foreground leading-tight text-center md:text-left">
            {code} - <span className="font-sans font-bold uppercase">{label}</span>
          </span>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn(
          "h-8 w-8 md:h-10 md:w-10 transition-all",
          isCopied ? "text-green-500" : "text-muted-foreground group-hover:text-primary"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onCopy();
        }}
      >
        {isCopied ? <Check className="h-4 w-4 md:h-5 md:w-5" /> : <Copy className="h-4 w-4 md:h-5 md:w-5" />}
      </Button>
    </div>
  );
}
