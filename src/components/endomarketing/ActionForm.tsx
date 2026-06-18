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
import { Plus, Trash2, Save, X, Calculator, Paperclip, Info, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface ActionFormProps {
  action: EndomarketingAction | null;
  onClose: () => void;
}

export default function ActionForm({ action, onClose }: ActionFormProps) {
  const [loading, setLoading] = useState(false);
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
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              {action ? 'Editar Ação' : 'Nova Ação de Endomarketing'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <div className="px-6 border-b">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-4 p-0">
              <TabsTrigger value="general" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none h-full shadow-none border-b-2 border-transparent px-2">
                Informações Gerais
              </TabsTrigger>
              <TabsTrigger value="financial" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none h-full shadow-none border-b-2 border-transparent px-2">
                Controle Financeiro
              </TabsTrigger>
              <TabsTrigger value="evidence" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none h-full shadow-none border-b-2 border-transparent px-2 text-muted-foreground/60 cursor-not-allowed">
                Evidências & Anexos
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="max-h-[70vh]">
            <div className="p-6">
              <TabsContent value="general" className="m-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Nome da Ação</Label>
                    <Input 
                      placeholder="Ex: Café com o Diretor - Aniversariantes de Junho"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={v => setFormData({ ...formData, category: v as ActionCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={v => setFormData({ ...formData, status: v as ActionStatus })}
                    >
                      <SelectTrigger>
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

                  <div className="space-y-2">
                    <Label>Data Planejada</Label>
                    <Input 
                      type="date"
                      value={formData.date_planned}
                      onChange={e => setFormData({ ...formData, date_planned: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data Realizada (Opcional)</Label>
                    <Input 
                      type="date"
                      value={formData.date_realized}
                      onChange={e => setFormData({ ...formData, date_realized: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Responsável Principal</Label>
                    <Input 
                      placeholder="Nome do colaborador"
                      value={formData.responsible_name}
                      onChange={e => setFormData({ ...formData, responsible_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Área Responsável</Label>
                    <Select 
                      value={formData.responsible_area} 
                      onValueChange={v => setFormData({ ...formData, responsible_area: v as ResponsibleArea })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RH">RH</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Compartilhado">Compartilhado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Objetivo da Ação</Label>
                    <Input 
                      placeholder="Breve resumo do que se espera atingir"
                      value={formData.objective}
                      onChange={e => setFormData({ ...formData, objective: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Descrição Detalhada</Label>
                    <Textarea 
                      placeholder="Descreva o passo a passo da ação..."
                      className="min-h-[100px]"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Público-alvo</Label>
                    <Input 
                      placeholder="Ex: Todos os colaboradores, Operacional, etc."
                      value={formData.target_audience}
                      onChange={e => setFormData({ ...formData, target_audience: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Part. Previstos</Label>
                      <Input 
                        type="number"
                        value={formData.participants_planned}
                        onChange={e => setFormData({ ...formData, participants_planned: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Part. Reais</Label>
                      <Input 
                        type="number"
                        value={formData.participants_actual}
                        onChange={e => setFormData({ ...formData, participants_actual: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="m-0 space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <div className="space-y-2">
                    <Label className="text-orange-900">Orçamento Previsto (R$)</Label>
                    <Input 
                      type="number"
                      className="bg-white border-orange-200"
                      value={formData.budget_planned}
                      onChange={e => setFormData({ ...formData, budget_planned: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-orange-900">Custo Total Atual (Automático)</Label>
                    <div className="h-10 flex items-center px-3 font-bold text-orange-600 bg-white rounded-md border border-orange-200">
                      {calculateTotalActual().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-orange-600" />
                      Listagem de Itens de Custo
                    </h3>
                  </div>

                  <div className="grid grid-cols-12 gap-2 p-3 bg-muted/30 rounded-lg items-end border">
                    <div className="col-span-5 space-y-1.5">
                      <Label className="text-[10px] uppercase text-muted-foreground">Descrição</Label>
                      <Input 
                        placeholder="Ex: Kit Brindes"
                        className="bg-white"
                        value={newItem.description}
                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                      />
                    </div>
                    <div className="col-span-3 space-y-1.5">
                      <Label className="text-[10px] uppercase text-muted-foreground">Categoria</Label>
                      <Select 
                        value={newItem.category}
                        onValueChange={v => setNewItem({ ...newItem, category: v as AssetCategory })}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assetCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 space-y-1.5">
                      <Label className="text-[10px] uppercase text-muted-foreground">Valor (R$)</Label>
                      <Input 
                        type="number"
                        className="bg-white"
                        value={newItem.value}
                        onChange={e => setNewItem({ ...newItem, value: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button variant="outline" size="icon" onClick={handleAddItem} className="bg-white h-10 w-10">
                        <Plus className="h-4 w-4 text-orange-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-xs">Descrição</TableHead>
                          <TableHead className="text-xs">Categoria</TableHead>
                          <TableHead className="text-xs text-right">Valor</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs italic">
                              Nenhum item adicionado ainda.
                            </TableCell>
                          </TableRow>
                        ) : (
                          financialItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="text-sm">{item.description}</TableCell>
                              <TableCell className="text-sm font-medium text-orange-600/70">{item.category}</TableCell>
                              <TableCell className="text-sm font-semibold text-right">
                                {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id!)}>
                                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
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
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="p-6 bg-muted/20 border-t justify-between items-center sm:justify-between">
          <div className="text-xs text-muted-foreground italic flex items-center gap-1.5 font-medium">
            <Info className="h-3.5 w-3.5 text-orange-400" />
            Dados restritos à RH e Marketing.
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-orange-600 hover:bg-orange-700 w-32">
              {loading ? 'Salvando...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
