import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, getDocs, deleteDoc, writeBatch, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { EndomarketingAction, FinancialItem, ActionStatus, ActionCategory, ResponsibleArea, AssetCategory, ActionEvidence } from '../../types/endomarketing';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import imageCompression from 'browser-image-compression';
import { Plus, Trash2, Save, X, Calculator, Paperclip, Info, Zap, ChevronLeft, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ActionFormProps {
  action: EndomarketingAction | null;
  onClose: () => void;
}

export default function ActionForm({ action, onClose }: ActionFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showHelp, setShowHelp] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<Partial<EndomarketingAction>>({
    name: '',
    category: 'Outros',
    objective: '',
    description: '',
    responsible_name: '',
    responsible_area: 'RH',
    date_planned: '',
    date_realized: '',
    status: 'Planejada',
    target_audience: '',
    participants_planned: undefined,
    participants_actual: undefined,
    budget_planned: undefined,
    budget_actual: 0,
  });

  const [financialItems, setFinancialItems] = useState<FinancialItem[]>([]);
  const [newItem, setNewItem] = useState<Partial<FinancialItem>>({
    description: '',
    category: 'Material',
    value: undefined
  });

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const parseCurrency = (val: string) => {
    const cleanValue = val.replace(/\D/g, '');
    return Number(cleanValue) / 100;
  };


  useEffect(() => {
    if (action) {
      setFormData(action);
      fetchFinancialItems(action.id!);
    }
  }, [action]);

  const fetchFinancialItems = async (actionId: string) => {
    const querySnapshot = await getDocs(collection(db, `endomarketing_actions/${actionId}/financial_items`));
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FinancialItem[];
    setFinancialItems(items);
  };

  const handleAddItem = () => {
    if (!newItem.description || !newItem.value) {
      toast.error('Preencha a descrição e o valor do item.');
      return;
    }
    const itemToAdd = { ...newItem, id: Math.random().toString(36).substr(2, 9) } as FinancialItem;
    setFinancialItems([...financialItems, itemToAdd]);
    setNewItem({ description: '', category: 'Material', value: 0 });
  };

  const handleRemoveItem = (id: string) => {
    setFinancialItems(financialItems.filter(item => item.id !== id));
  };

  const calculateTotalActual = () => {
    return financialItems.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  };

  const uploadEvidences = async (actionId: string): Promise<ActionEvidence[]> => {
    if (evidenceFiles.length === 0) return formData.evidences || [];

    const uploadedEvidences: ActionEvidence[] = [...(formData.evidences || [])];
    
    for (const file of evidenceFiles) {
      try {
        let fileToUpload = file;
        
        // Compress if it's an image
        if (file.type.startsWith('image/')) {
          try {
            const options = {
              maxSizeMB: 0.8, // Slightly more aggressive compression
              maxWidthOrHeight: 1280, // Better balance for viewing
              useWebWorker: true,
            };
            fileToUpload = await imageCompression(file, options);
          } catch (compressError) {
            console.error('Compression failed, using original file:', compressError);
            // If compression fails, we still try to upload the original
          }
        }

        const storageRef = ref(storage, `endomarketing/${actionId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, fileToUpload);
        const downloadURL = await getDownloadURL(snapshot.ref);

        uploadedEvidences.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          url: downloadURL,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        toast.error(`Erro ao subir ${file.name}: verifique as permissões de arquivo.`);
        // Note: we continue the loop for other files
      }
    }

    return uploadedEvidences;
  };

  const handleSave = async () => {
    if (!formData.name || !formData.date_planned) {
      toast.error('Preencha os campos obrigatórios (Nome e Data).');
      return;
    }

    setLoading(true);
    try {
      const budgetActual = calculateTotalActual();
      
      // Temporary ID for new actions to handle storage path
      // doc(collection(db, 'endomarketing_actions')).id is safer than 'temp'
      const actionDocRef = action?.id 
        ? doc(db, 'endomarketing_actions', action.id) 
        : doc(collection(db, 'endomarketing_actions'));
      
      const actionId = actionDocRef.id;
      
      // Upload evidences first
      const updatedEvidences = await uploadEvidences(actionId);
      
      // Explicitly clean data for Firestore (remove undefined, preserve created_at)
      const cleanData: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          cleanData[key] = value;
        }
      });

      // Ensure mandatory fields for security rules are present and valid
      const now = new Date().toISOString();
      const finalData = {
        ...cleanData,
        name: formData.name || '',
        category: formData.category || 'Outros',
        status: formData.status || 'Planejada',
        budget_actual: Number(budgetActual) || 0,
        evidences: updatedEvidences || [],
        budget_planned: Number(formData.budget_planned) || 0,
        participants_planned: Number(formData.participants_planned) || 0,
        participants_actual: Number(formData.participants_actual) || 0,
        updated_at: now,
        created_at: action?.created_at || now,
      };

      // Security rules require created_at for ALL writes (create and update)
      if (!action) {
        await setDoc(actionDocRef, finalData);
      } else {
        await updateDoc(actionDocRef, finalData);
      }

      // Sync financial items
      const itemsCollectionRef = collection(db, `endomarketing_actions/${actionId}/financial_items`);
      const existingItems = await getDocs(itemsCollectionRef);
      const batch = writeBatch(db);
      
      existingItems.forEach(d => batch.delete(d.ref));
      
      financialItems.forEach(item => {
        const { id, ...itemData } = item;
        const cleanItemData = {
          ...itemData,
          description: itemData.description || '',
          category: itemData.category || 'Outros',
          value: Number(itemData.value) || 0
        };
        const newRef = doc(itemsCollectionRef);
        batch.set(newRef, cleanItemData);
      });

      await batch.commit();

      toast.success('Ação salva com sucesso!');
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error: any) {
      console.error('Error saving action:', error);
      // More descriptive error for debugging
      const errorMessage = error?.message || 'Erro desconhecido';
      toast.error(`Erro ao salvar ação: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };


  const categories: ActionCategory[] = [
    "Dia da Cultura", "Aniversariantes", "Datas comemorativas", "Treinamentos", 
    "Campanhas internas", "Integração", "Reconhecimento", "Saúde e Bem-estar", "Outros"
  ];

  const assetCategories: AssetCategory[] = ["Material", "Alimentação", "Estrutura", "Serviços", "Diversos"];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-full h-full sm:h-auto sm:w-[98vw] sm:max-w-3xl p-0 overflow-hidden sm:rounded-xl flex flex-col">
        {/* Mobile Sticky Header */}
        <div className="lg:hidden sticky top-0 z-50 bg-white border-b px-4 h-11 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-bold text-sm truncate max-w-[200px]">
              {action ? 'Editar Ação' : 'Nova Ação'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-orange-600 animate-fluorescent border-2 border-orange-400 bg-orange-50/50 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)]" onClick={() => setShowHelp(true)}>
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>

        <DialogHeader className="hidden lg:block p-4 lg:p-6 pb-2 lg:pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg lg:text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              {action ? 'Editar Ação' : 'Nova Ação de Endomarketing'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowHelp(true)} className="text-orange-600 gap-1.5 animate-fluorescent border-2 border-orange-200 bg-orange-50/50 rounded-full px-4 font-black shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              <HelpCircle className="h-4 w-4" />
              COMO FUNCIONA?
            </Button>

          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
          <div className="px-4 lg:px-6 border-b bg-white sticky top-0 lg:top-0 z-40 shrink-0">
            <TabsList className="bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-xl flex gap-1.5 w-full max-w-xl mx-auto my-3 border border-slate-200/60 dark:border-slate-700/60 h-11 lg:h-13 shadow-none select-none">
              <TabsTrigger 
                value="general" 
                className="flex-1 flex items-center justify-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 dark:hover:bg-slate-700/40 rounded-lg py-1.5 lg:py-2.5 px-2 lg:px-4 focus-visible:outline-none focus-visible:none transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-orange-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200/80 cursor-pointer"
              >
                <Info className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                Informações
              </TabsTrigger>
              <TabsTrigger 
                value="financial" 
                className="flex-1 flex items-center justify-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 dark:hover:bg-slate-700/40 rounded-lg py-1.5 lg:py-2.5 px-2 lg:px-4 focus-visible:outline-none focus-visible:none transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-orange-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200/80 cursor-pointer"
              >
                <Calculator className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger 
                value="evidence" 
                className="flex-1 flex items-center justify-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 dark:hover:bg-slate-700/40 rounded-lg py-1.5 lg:py-2.5 px-2 lg:px-4 focus-visible:outline-none focus-visible:none transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-orange-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200/80 cursor-pointer"
              >
                <Paperclip className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                Evidências
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-3 lg:p-6 pb-20 lg:pb-6">
              <TabsContent value="general" className="m-0 space-y-2 lg:space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4">
                  <div className="lg:col-span-2 space-y-0.5">
                    <Label className="text-[10px] lg:text-xs uppercase text-slate-500 font-bold">Nome da Ação</Label>
                    <Input 
                      placeholder="Ex: Café com o Diretor"
                      className="h-8 lg:h-9 text-xs lg:text-sm"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] lg:text-xs uppercase text-slate-500 font-bold">Categoria</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={v => setFormData({ ...formData, category: v as ActionCategory })}
                      >
                        <SelectTrigger className="h-8 lg:h-9 text-xs lg:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-0.5">
                      <Label className="text-[10px] lg:text-xs uppercase text-slate-500 font-bold">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={v => setFormData({ ...formData, status: v as ActionStatus })}
                      >
                        <SelectTrigger className="h-8 lg:h-9 text-xs lg:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planejada">Planejada</SelectItem>
                          <SelectItem value="Em andamento">Em andamento</SelectItem>
                          <SelectItem value="Concluída">Concluída</SelectItem>
                          <SelectItem value="Cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] lg:text-xs uppercase text-slate-500 font-bold">Data Planejada</Label>
                      <Input 
                        type="date"
                        className="h-8 lg:h-9 text-xs lg:text-sm px-1.5 w-[95%]"
                        value={formData.date_planned}
                        onChange={e => setFormData({ ...formData, date_planned: e.target.value })}
                      />
                    </div>

                    <div className="space-y-0.5 flex flex-col items-end">
                      <Label className="text-[10px] lg:text-xs uppercase text-slate-500 font-bold whitespace-nowrap truncate w-full text-left">Data Realizada</Label>
                      <Input 
                        type="date"
                        className="h-8 lg:h-9 text-xs lg:text-sm px-1.5 w-[95%]"
                        value={formData.date_realized}
                        onChange={e => setFormData({ ...formData, date_realized: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] lg:text-xs uppercase text-slate-500 font-bold">Responsável</Label>
                      <Input 
                        placeholder="Nome"
                        className="h-8 lg:h-9 text-xs lg:text-sm"
                        value={formData.responsible_name}
                        onChange={e => setFormData({ ...formData, responsible_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-0.5">
                      <Label className="text-[10px] lg:text-xs uppercase text-slate-500 font-bold">Área</Label>
                      <Select 
                        value={formData.responsible_area} 
                        onValueChange={v => setFormData({ ...formData, responsible_area: v as ResponsibleArea })}
                      >
                        <SelectTrigger className="h-8 lg:h-9 text-xs lg:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RH">RH</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Compartilhado">Compartilhado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>


                  <div className="lg:col-span-2 space-y-0.5">
                    <Label className="text-[10px] lg:text-xs uppercase text-slate-500 font-bold">Objetivo</Label>
                    <Input 
                      placeholder="O que se espera atingir?"
                      className="h-8 lg:h-9 text-xs lg:text-sm"
                      value={formData.objective}
                      onChange={e => setFormData({ ...formData, objective: e.target.value })}
                    />
                  </div>

                  <div className="lg:col-span-2 space-y-0.5">
                    <Label className="text-[10px] lg:text-xs uppercase text-slate-500 font-bold">Resumo / Público</Label>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      <Input 
                        placeholder="Ex: Operacional, Lideranças..."
                        className="h-8 lg:h-9 text-xs lg:text-sm"
                        value={formData.target_audience}
                        onChange={e => setFormData({ ...formData, target_audience: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Input 
                            type="number"
                            className="h-8 lg:h-9 text-xs lg:text-sm pl-8"
                            title="Participantes Planejados"
                            value={formData.participants_planned ?? ''}
                            onChange={e => setFormData({ ...formData, participants_planned: e.target.value ? Number(e.target.value) : undefined })}
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400">PLAN.</span>
                        </div>
                        <div className="relative">
                          <Input 
                            type="number"
                            className="h-8 lg:h-9 text-xs lg:text-sm pl-8"
                            title="Participantes Reais"
                            value={formData.participants_actual ?? ''}
                            onChange={e => setFormData({ ...formData, participants_actual: e.target.value ? Number(e.target.value) : undefined })}
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-green-500">REAL</span>
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="lg:col-span-2 space-y-0.5">
                    <Label className="text-[10px] lg:text-xs uppercase text-slate-500 font-bold">Descrição Detalhada</Label>
                    <Textarea 
                      placeholder="Passo a passo da ação..."
                      className="min-h-[50px] text-xs lg:text-sm"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>


              <TabsContent value="financial" className="m-0 space-y-4 lg:space-y-6">
                <div className="grid grid-cols-2 gap-3 bg-orange-50 p-3 lg:p-4 rounded-lg border border-orange-100">
                  <div className="space-y-1">
                    <Label className="text-[10px] lg:text-xs text-orange-900 uppercase font-bold">Orçamento Previsto</Label>
                    <Input 
                      className="bg-white border-orange-200 h-9 lg:h-10 text-sm"
                      value={formatCurrency(formData.budget_planned)}
                      onChange={e => setFormData({ ...formData, budget_planned: parseCurrency(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] lg:text-xs text-orange-900 uppercase font-bold">Investido Total</Label>
                    <div className="h-9 lg:h-10 flex items-center px-3 font-black text-orange-600 bg-white rounded-md border border-orange-200 text-sm">
                      {calculateTotalActual().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 lg:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[11px] lg:text-sm uppercase flex items-center gap-2 text-slate-700">
                      <Calculator className="h-3.5 w-3.5 lg:h-4 w-4 text-orange-600 font-bold" />
                      Novo Lançamento
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 p-3 bg-muted/20 rounded-lg items-end border border-slate-200">
                    <div className="col-span-1 lg:col-span-5 space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground font-bold">Descrição</Label>
                      <Input 
                        placeholder="Ex: Coffee Break"
                        className="bg-white h-9 text-sm"
                        value={newItem.description}
                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 col-span-1 lg:col-span-6">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Categoria</Label>
                        <Select 
                          value={newItem.category}
                          onValueChange={v => setNewItem({ ...newItem, category: v as AssetCategory })}
                        >
                          <SelectTrigger className="bg-white h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {assetCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Valor</Label>
                        <Input 
                          className="bg-white h-9 text-sm"
                          value={formatCurrency(newItem.value)}
                          onChange={e => setNewItem({ ...newItem, value: parseCurrency(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="col-span-1 lg:col-span-1 mt-1 lg:mt-0">
                      <Button className="w-full h-9 bg-orange-600 hover:bg-orange-700 p-0" onClick={handleAddItem}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border overflow-hidden bg-white shadow-sm">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="text-[10px] lg:text-xs font-black uppercase text-slate-500 h-9">Item</TableHead>
                          <TableHead className="text-[10px] lg:text-xs font-black uppercase text-slate-500 h-9 text-right">Valor</TableHead>
                          <TableHead className="w-9 h-9"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-[10px] lg:text-xs italic">
                              Nenhum custo lançado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          financialItems.map((item) => (
                            <TableRow key={item.id} className="h-auto">
                              <TableCell className="py-2 px-3">
                                <div className="flex flex-col">
                                  <span className="text-[11px] lg:text-xs font-bold text-slate-900 leading-tight">{item.description}</span>
                                  <span className="text-[9px] lg:text-[10px] uppercase text-orange-600 font-bold opacity-70">{item.category}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-[11px] lg:text-xs font-black text-right p-2 whitespace-nowrap text-slate-700">
                                {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </TableCell>
                              <TableCell className="p-1 pr-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemoveItem(item.id!)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="evidence" className="m-0 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-3 bg-white rounded-full shadow-sm text-orange-600">
                    <Paperclip className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Anexar Evidências</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Fotos, vídeos e listas de presença</p>
                  </div>
                  <div className="relative group">
                    <Button variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 h-9 px-6 text-xs font-bold gap-2">
                      <Plus className="h-3.5 w-3.5" />
                      Selecionar Arquivos
                    </Button>
                    <input 
                      type="file" 
                      multiple 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setEvidenceFiles(prev => [...prev, ...files]);
                        toast.success(`${files.length} arquivo(s) selecionados.`);
                      }}
                    />
                  </div>
                </div>

                {evidenceFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {evidenceFiles.map((file, idx) => (
                      <div key={idx} className="relative group bg-white border p-2 rounded-lg flex items-center gap-2 overflow-hidden">
                        <Paperclip className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="text-[10px] truncate flex-1 font-medium">{file.name}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setEvidenceFiles(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {formData.evidences && formData.evidences.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase text-slate-500">Arquivos Salvos</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {formData.evidences.map((evidence) => (
                        <a 
                          key={evidence.id} 
                          href={evidence.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="relative group bg-orange-50 border border-orange-100 p-2 rounded-lg flex items-center gap-2 overflow-hidden hover:bg-orange-100 transition-colors"
                        >
                          <Paperclip className="h-3 w-3 text-orange-600 shrink-0" />
                          <span className="text-[10px] truncate flex-1 font-bold text-orange-800">{evidence.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-[11px] text-orange-800 leading-relaxed font-medium">
                    As evidências são essenciais para comprovar a execução da ação e medir o sucesso (pós-ação). 
                    As fotos também alimentam o nosso mural de cultura!
                  </p>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>

        {/* Action Bar - Fixed on mobile footer */}
        <div className="lg:relative fixed bottom-0 left-0 right-0 z-50 bg-white border-t px-4 py-3 lg:p-6 lg:bg-muted/20 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.05)] lg:shadow-none">
          <div className="hidden lg:flex text-[10px] lg:text-xs text-muted-foreground italic items-center gap-1.5 font-medium">
            <Info className="h-3.5 w-3.5 text-orange-400" />
            Dados restritos à RH e Marketing.
          </div>
          <div className="lg:hidden">
             <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Info className="h-3 w-3 text-orange-400" />
                Restrito
             </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={loading} className="text-slate-600 lg:text-sm text-xs font-bold">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-orange-600 hover:bg-orange-700 min-w-[100px] lg:w-32 shadow-sm font-bold text-xs lg:text-sm h-9 lg:h-10">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Salvando...</span>
                </div>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Module Help Guide Overlay */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-2xl sm:max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
            <button 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
              onClick={() => setShowHelp(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-orange-600 font-black uppercase tracking-tight mb-4 shrink-0">
              <Zap className="h-5 w-5" />
              Guia do Módulo Endomarketing
            </div>
            
            <div className="space-y-6 overflow-y-auto pr-1 flex-1">
              <div className="space-y-2">
                <h4 className="text-sm font-black text-slate-950 border-l-4 border-orange-500 pl-2">O QUE É?</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  É o espaço centralizado para planejar, gerenciar e avaliar todas as ações internas voltadas aos nossos colaboradores. O foco é fortalecer a cultura e o engajamento na RODER.
                </p>
              </div>

              <div className="space-y-4">
                 <div className="flex gap-3">
                   <div className="p-2 bg-blue-50 rounded-xl shrink-0 h-fit">
                      <Info className="h-4 w-4 text-blue-600" />
                   </div>
                   <div className="space-y-1">
                     <h5 className="text-[11px] font-black uppercase text-slate-800 font-bold">Informações</h5>
                     <p className="text-[10px] text-slate-500 leading-normal font-medium">Defina o "quem", "quando" e "onde". Aqui você registra os objetivos estratégicos e o público que será impactado pela ação.</p>
                   </div>
                 </div>

                 <div className="flex gap-3">
                   <div className="p-2 bg-green-50 rounded-xl shrink-0 h-fit">
                      <Calculator className="h-4 w-4 text-green-600" />
                   </div>
                   <div className="space-y-1">
                     <h5 className="text-[11px] font-black uppercase text-slate-800 font-bold">Financeiro</h5>
                     <p className="text-[10px] text-slate-500 leading-normal font-medium">Controle de investimentos. Lance gastos com materiais, alimentação e serviços para que o sistema calcule automaticamente o custo total e o valor investido por pessoa.</p>
                   </div>
                 </div>

                 <div className="flex gap-3">
                   <div className="p-2 bg-purple-50 rounded-xl shrink-0 h-fit">
                      <Paperclip className="h-4 w-4 text-purple-600" />
                   </div>
                   <div className="space-y-1">
                     <h5 className="text-[11px] font-black uppercase text-slate-800 font-bold">Evidências</h5>
                     <p className="text-[10px] text-slate-500 leading-normal font-medium">A memória da ação. Use para anexar fotos dos eventos, listas de presença e feedbacks recebidos. Essencial para retrospectivas e relatórios de diretoria.</p>
                   </div>
                 </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-[10px] text-slate-500 font-medium italic">
                  Dica: Mantenha os dados financeiros sempre atualizados para que o Financeiro possa acompanhar a saúde dos orçamentos da empresa.
                </p>
              </div>
            </div>
            
            <div className="pt-4 shrink-0">
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black h-11 rounded-xl" onClick={() => setShowHelp(false)}>
                ENTENDI
              </Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
