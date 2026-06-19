import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EndomarketingAction, FinancialItem, ActionStatus, ActionCategory, ResponsibleArea, AssetCategory } from '../../types/endomarketing';
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
import { Plus, Trash2, Save, X, Calculator, Paperclip, Info, Zap, ChevronLeft, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ActionFormProps {
  action: EndomarketingAction | null;
  onClose: () => void;
}

export default function ActionForm({ action, onClose }: ActionFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showHelp, setShowHelp] = useState(false);
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
    participants_planned: 0,
    participants_actual: 0,
    budget_planned: 0,
    budget_actual: 0,
  });

  const [financialItems, setFinancialItems] = useState<FinancialItem[]>([]);
  const [newItem, setNewItem] = useState<Partial<FinancialItem>>({
    description: '',
    category: 'Material',
    value: 0
  });

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

  const handleSave = async () => {
    if (!formData.name || !formData.date_planned) {
      toast.error('Preencha os campos obrigatórios (Nome e Data).');
      return;
    }

    setLoading(true);
    try {
      const budgetActual = calculateTotalActual();
      const finalData = {
        ...formData,
        budget_actual: budgetActual,
        updated_at: new Date().toISOString(),
      };

      let actionId = action?.id;

      if (actionId) {
        await updateDoc(doc(db, 'endomarketing_actions', actionId), finalData);
      } else {
        const docRef = await addDoc(collection(db, 'endomarketing_actions'), {
          ...finalData,
          created_at: new Date().toISOString(),
        });
        actionId = docRef.id;
      }

      // Sync financial items (Naive implementation: delete all and re-add for simplicity in this demo)
      // For production, a more granular sync would be better.
      const itemsCollectionRef = collection(db, `endomarketing_actions/${actionId}/financial_items`);
      const existingItems = await getDocs(itemsCollectionRef);
      const batch = writeBatch(db);
      
      existingItems.forEach(d => batch.delete(d.ref));
      financialItems.forEach(item => {
        const { id, ...itemData } = item;
        const newRef = doc(itemsCollectionRef);
        batch.set(newRef, itemData);
      });

      await batch.commit();

      toast.success('Ação salva com sucesso!');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar ação.');
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
      <DialogContent className="w-full h-full sm:h-auto sm:w-[98vw] sm:max-w-4xl p-0 overflow-hidden sm:rounded-xl flex flex-col">
        {/* Mobile Sticky Header */}
        <div className="lg:hidden sticky top-0 z-50 bg-white border-b px-4 h-14 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-bold text-sm truncate max-w-[200px]">
              {action ? 'Editar Ação' : 'Nova Ação'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-orange-600" onClick={() => setShowHelp(true)}>
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>

        <DialogHeader className="hidden lg:block p-4 lg:p-6 pb-2 lg:pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg lg:text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              {action ? 'Editar Ação' : 'Nova Ação de Endomarketing'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowHelp(true)} className="text-orange-600 gap-1.5">
              <HelpCircle className="h-4 w-4" />
              Como funciona?
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
          <div className="px-4 lg:px-6 border-b overflow-x-auto scrollbar-hide bg-white sticky top-14 lg:top-0 z-40 shrink-0">
            <TabsList className="bg-transparent h-12 lg:h-14 w-fit lg:w-full justify-start gap-4 lg:gap-6 p-0 border-none">
              <TabsTrigger value="general" className="data-[state=active]:bg-transparent data-[state=active]:text-orange-600 data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none h-full shadow-none border-b-2 border-transparent px-2 text-[11px] lg:text-sm whitespace-nowrap font-bold uppercase tracking-tight">
                Informações
              </TabsTrigger>
              <TabsTrigger value="financial" className="data-[state=active]:bg-transparent data-[state=active]:text-orange-600 data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none h-full shadow-none border-b-2 border-transparent px-2 text-[11px] lg:text-sm whitespace-nowrap font-bold uppercase tracking-tight">
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="evidence" className="data-[state=active]:bg-transparent data-[state=active]:text-orange-600 data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none h-full shadow-none border-b-2 border-transparent px-2 text-[11px] lg:text-sm whitespace-nowrap font-bold uppercase tracking-tight text-muted-foreground/60 cursor-not-allowed">
                Evidências
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6 pb-24 lg:pb-6">
              <TabsContent value="general" className="m-0 space-y-4 lg:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                  <div className="lg:col-span-2 space-y-1.5">
                    <Label className="text-[11px] lg:text-sm uppercase text-slate-500 font-bold">Nome da Ação</Label>
                    <Input 
                      placeholder="Ex: Café com o Diretor"
                      className="h-9 lg:h-10 text-sm"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 lg:col-span-2 lg:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] lg:text-sm uppercase text-slate-500 font-bold">Categoria</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={v => setFormData({ ...formData, category: v as ActionCategory })}
                      >
                        <SelectTrigger className="h-9 lg:h-10 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] lg:text-sm uppercase text-slate-500 font-bold">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={v => setFormData({ ...formData, status: v as ActionStatus })}
                      >
                        <SelectTrigger className="h-9 lg:h-10 text-sm">
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

                  <div className="grid grid-cols-2 gap-3 lg:col-span-2 lg:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] lg:text-sm uppercase text-slate-500 font-bold">Data Planejada</Label>
                      <Input 
                        type="date"
                        className="h-9 lg:h-10 text-sm"
                        value={formData.date_planned}
                        onChange={e => setFormData({ ...formData, date_planned: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] lg:text-sm uppercase text-slate-500 font-bold whitespace-nowrap truncate">Data Realizada</Label>
                      <Input 
                        type="date"
                        className="h-9 lg:h-10 text-sm"
                        value={formData.date_realized}
                        onChange={e => setFormData({ ...formData, date_realized: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:col-span-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] lg:text-sm uppercase text-slate-500 font-bold">Responsável</Label>
                      <Input 
                        placeholder="Nome do colaborador"
                        className="h-9 lg:h-10 text-sm"
                        value={formData.responsible_name}
                        onChange={e => setFormData({ ...formData, responsible_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] lg:text-sm uppercase text-slate-500 font-bold">Área</Label>
                      <Select 
                        value={formData.responsible_area} 
                        onValueChange={v => setFormData({ ...formData, responsible_area: v as ResponsibleArea })}
                      >
                        <SelectTrigger className="h-9 lg:h-10 text-sm">
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

                  <div className="lg:col-span-2 space-y-1.5">
                    <Label className="text-[11px] lg:text-sm uppercase text-slate-500 font-bold">Objetivo</Label>
                    <Input 
                      placeholder="O que se espera atingir?"
                      className="h-9 lg:h-10 text-sm"
                      value={formData.objective}
                      onChange={e => setFormData({ ...formData, objective: e.target.value })}
                    />
                  </div>

                  <div className="lg:col-span-2 space-y-1.5">
                    <Label className="text-[11px] lg:text-sm uppercase text-slate-500 font-bold">Resumo / Público</Label>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <Input 
                        placeholder="Ex: Operacional, Lideranças..."
                        className="h-9 lg:h-10 text-sm"
                        value={formData.target_audience}
                        onChange={e => setFormData({ ...formData, target_audience: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Input 
                            type="number"
                            className="h-9 lg:h-10 text-sm pl-7"
                            value={formData.participants_planned}
                            onChange={e => setFormData({ ...formData, participants_planned: Number(e.target.value) })}
                          />
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">P.</span>
                        </div>
                        <div className="relative">
                          <Input 
                            type="number"
                            className="h-9 lg:h-10 text-sm pl-7"
                            value={formData.participants_actual}
                            onChange={e => setFormData({ ...formData, participants_actual: Number(e.target.value) })}
                          />
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-green-500">R.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-1.5">
                    <Label className="text-[11px] lg:text-sm uppercase text-slate-500 font-bold">Descrição Detalhada</Label>
                    <Textarea 
                      placeholder="Passo a passo da ação..."
                      className="min-h-[80px] text-sm"
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
                      type="number"
                      className="bg-white border-orange-200 h-9 lg:h-10 text-sm"
                      value={formData.budget_planned}
                      onChange={e => setFormData({ ...formData, budget_planned: Number(e.target.value) })}
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
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Valor (R$)</Label>
                        <Input 
                          type="number"
                          className="bg-white h-9 text-sm"
                          value={newItem.value}
                          onChange={e => setNewItem({ ...newItem, value: Number(e.target.value) })}
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

              <TabsContent value="evidence" className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                 <div className="p-4 bg-orange-100 rounded-full">
                   <Paperclip className="h-8 w-8 text-orange-600" />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-lg font-bold">O que são as Evidências?</h3>
                   <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                     Esta aba serve para o <strong>pós-ação</strong>. Use para carregar fotos, vídeos, listas de presenças assinadas e relatórios de feedback. 
                     As evidências comprovam a execução e o sucesso das suas iniciativas.
                   </p>
                   <div className="pt-4">
                     <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Funcionalidade em breve</Badge>
                   </div>
                 </div>
              </TabsContent>
            </div>
          </ScrollArea>
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
              {loading ? 'Salvando...' : (
                <>
                  <Save className="h-3.5 w-3.5 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Module Help Guide Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600 font-black uppercase tracking-tight">
              <Zap className="h-5 w-5" />
              Guia do Módulo Endomarketing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <h4 className="text-sm font-black text-slate-900 border-l-4 border-orange-500 pl-2">O QUE É?</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                É o espaço centralizado para planejar, gerenciar e avaliar todas as ações internas voltadas aos nossos colaboradores. O foco é fortalecer a cultura e o engajamento na RODER.
              </p>
            </div>

            <div className="space-y-4">
               <div className="flex gap-3">
                 <div className="p-2 bg-blue-50 rounded-xl shrink-0 h-fit">
                    <Info className="h-4 w-4 text-blue-600" />
                 </div>
                 <div className="space-y-1">
                   <h5 className="text-[11px] font-black uppercase">Informações</h5>
                   <p className="text-[10px] text-slate-500 leading-normal">Defina o "quem", "quando" e "onde". Aqui você registra os objetivos estratégicos e o público que será impactado pela ação.</p>
                 </div>
               </div>

               <div className="flex gap-3">
                 <div className="p-2 bg-green-50 rounded-xl shrink-0 h-fit">
                    <Calculator className="h-4 w-4 text-green-600" />
                 </div>
                 <div className="space-y-1">
                   <h5 className="text-[11px] font-black uppercase">Financeiro</h5>
                   <p className="text-[10px] text-slate-500 leading-normal">Controle de investimentos. Lance gastos com materiais, alimentação e serviços para que o sistema calcule automaticamente o custo total e o valor investido por pessoa.</p>
                 </div>
               </div>

               <div className="flex gap-3">
                 <div className="p-2 bg-purple-50 rounded-xl shrink-0 h-fit">
                    <Paperclip className="h-4 w-4 text-purple-600" />
                 </div>
                 <div className="space-y-1">
                   <h5 className="text-[11px] font-black uppercase">Evidências</h5>
                   <p className="text-[10px] text-slate-500 leading-normal">A memória da ação. Use para anexar fotos dos eventos, listas de presença e feedbacks recebidos. Essencial para retrospectivas e relatórios de diretoria.</p>
                 </div>
               </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-[10px] text-slate-500 font-medium italic">
                Dica: Mantenha os dados financeiros sempre atualizados para que a Luana e a Gislene possam acompanhar a saúde dos orçamentos do RH e Marketing.
              </p>
            </div>
          </div>
          <div className="pt-4">
            <Button className="w-full bg-slate-900 font-black h-11 rounded-xl" onClick={() => setShowHelp(false)}>
              ENTENDI
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
