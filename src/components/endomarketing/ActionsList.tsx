import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EndomarketingAction } from '../../types/endomarketing';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2, Calendar, Users, DollarSign, Search, Filter } from 'lucide-react';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { toast } from 'sonner';
import ActionForm from './ActionForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export default function ActionsList() {
  const { user } = useAuth();
  const [actions, setActions] = useState<EndomarketingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<EndomarketingAction | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'endomarketing_actions'), orderBy('date_planned', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const actionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EndomarketingAction[];
      setActions(actionsData);
      setLoading(false);
    }, (error) => {
      console.error("Error in ActionsList onSnapshot:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ação?')) {
      try {
        await deleteDoc(doc(db, 'endomarketing_actions', id));
        toast.success('Ação excluída com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir ação.');
      }
    }
  };

  const statusColors: Record<string, string> = {
    'Planejada': 'bg-blue-100 text-blue-700',
    'Em andamento': 'bg-yellow-100 text-yellow-700',
    'Concluída': 'bg-green-100 text-green-700',
    'Cancelada': 'bg-red-100 text-red-700',
  };

  const filteredActions = actions.filter(action =>
    action.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => { setEditingAction(null); setIsFormOpen(true); }} className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto shrink-0 shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Ação
        </Button>
      </div>

      <Card className="border-none sm:border shadow-none sm:shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Data Prevista</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Orçamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Carregando ações...</TableCell>
                  </TableRow>
                ) : filteredActions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground font-medium">Nenhuma ação encontrada.</TableCell>
                  </TableRow>
                ) : (
                  filteredActions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{action.name}</span>
                          <span className="text-xs text-muted-foreground">{action.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {action.date_planned ? format(new Date(action.date_planned), 'dd/MM/yyyy') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {action.responsible_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[action.status]} border-none shadow-none text-[10px] font-medium px-2 py-0.5`}>
                          {action.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium">
                            {action.budget_actual?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Prev: {action.budget_planned?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingAction(action); setIsFormOpen(true); }}
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(action.id!)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards - Shown only on small screens */}
          <div className="lg:hidden divide-y bg-white rounded-xl border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando ações...</div>
            ) : filteredActions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm font-medium">Nenhuma ação encontrada.</div>
            ) : (
              filteredActions.map((action) => (
                <div key={action.id} className="p-4 space-y-3 active:bg-slate-50 transition-colors" onClick={() => { setEditingAction(action); setIsFormOpen(true); }}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 leading-tight truncate">{action.name}</h4>
                      <span className="text-[10px] text-muted-foreground truncate">{action.category}</span>
                    </div>
                    <Badge className={cn("text-[8px] py-0 h-4 border-none uppercase font-black shrink-0 whitespace-nowrap", statusColors[action.status])}>
                      {action.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-slate-100 shrink-0">
                        <Calendar className="h-3 w-3 text-orange-600" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase">Data</span>
                        <span className="text-[11px] font-semibold truncate">
                          {action.date_planned ? format(new Date(action.date_planned), 'dd/MM/yy') : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-muted-foreground font-bold uppercase">Investimento</span>
                      <span className="text-xs font-black text-orange-600">
                        {action.budget_actual?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <ActionForm
          action={editingAction}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
