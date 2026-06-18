import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EndomarketingAction } from '../../types/endomarketing';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { FileText, Download, Filter, FileSpreadsheet, FileBox } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';

export default function EndoReports() {
  const [actions, setActions] = useState<EndomarketingAction[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'endomarketing_actions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const actionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EndomarketingAction[];
      setActions(actionsData);
    });

    return () => unsubscribe();
  }, []);

  const exportActionsToCSV = () => {
    const data = actions.map(action => ({
      'Nome da Ação': action.name,
      'Categoria': action.category,
      'Objetivo': action.objective,
      'Responsável': action.responsible_name,
      'Área': action.responsible_area,
      'Data Planejada': action.date_planned,
      'Data Realizada': action.date_realized || 'N/A',
      'Status': action.status,
      'Partic. Previstos': action.participants_planned,
      'Partic. Reais': action.participants_actual,
      'Budget Previsto': action.budget_planned,
      'Budget Real': action.budget_actual,
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_endomarketing_${new Date().getFullYear()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Relatório Geral (Excel)
            </CardTitle>
            <CardDescription>Lista completa de todas as ações cadastradas e seus custos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportActionsToCSV} className="w-full bg-slate-900 border-none">
              <Download className="h-4 w-4 mr-2" />
              Baixar .CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              Relatório Anual (PDF)
            </CardTitle>
            <CardDescription>Resumo anual consolidado por categorias e mès.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Gerar PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileBox className="h-5 w-5 text-blue-600" />
              Relatório por Evento
            </CardTitle>
            <CardDescription>Dossiê completo de uma ação específica incluindo evidências.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Selecionar Ação
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Histórico Recente</CardTitle>
            <CardDescription>Últimas 5 ações cadastradas para conferência rápida.</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            Ver tudo
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ação</TableHead>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Budget Real</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.slice(0, 5).map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="font-medium">{action.name}</TableCell>
                  <TableCell>
                    {action.date_planned ? new Date(action.date_planned).toLocaleString('pt-BR', { month: 'long' }) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {action.budget_actual?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
