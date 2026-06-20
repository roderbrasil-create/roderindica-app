import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EndomarketingAction } from '../../types/endomarketing';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

export default function EndoDashboard() {
  const { user } = useAuth();
  const [actions, setActions] = useState<EndomarketingAction[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'endomarketing_actions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const actionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EndomarketingAction[];
      setActions(actionsData);
    }, (error) => {
      console.error("Error in EndoDashboard onSnapshot:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const totalActionCount = actions.length;
  const completedActions = actions.filter(a => a.status === 'Concluída').length;
  const plannedActions = actions.filter(a => a.status === 'Planejada').length;
  const totalInvestment = actions.reduce((acc, curr) => acc + (curr.budget_actual || 0), 0);
  const avgInvestment = totalActionCount > 0 ? totalInvestment / totalActionCount : 0;

  // Investment by Category
  const categoryData = actions.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) {
      existing.value += (curr.budget_actual || 0);
    } else {
      acc.push({ name: curr.category, value: (curr.budget_actual || 0) });
    }
    return acc;
  }, []);

  // Investment by Month
  const monthlyData = actions.reduce((acc: any[], curr) => {
    if (!curr.date_planned) return acc;
    const month = new Date(curr.date_planned).toLocaleString('pt-BR', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.invested += (curr.budget_actual || 0);
      existing.planned += (curr.budget_planned || 0);
    } else {
      acc.push({ month, invested: (curr.budget_actual || 0), planned: (curr.budget_planned || 0) });
    }
    return acc;
  }, []);

  // Sorting monthly data
  const monthOrder = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  monthlyData.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

  const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#6366f1'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-orange-900/60 uppercase tracking-wider">Total Investido</p>
                <h3 className="text-2xl font-bold text-orange-700">
                  {totalInvestment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
              </div>
              <div className="bg-white p-2 rounded-lg shadow-sm border border-orange-100">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-900/60 uppercase tracking-wider">Média por Ação</p>
                <h3 className="text-2xl font-bold text-blue-700">
                  {avgInvestment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
              </div>
              <div className="bg-white p-2 rounded-lg shadow-sm border border-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-green-900/60 uppercase tracking-wider">Ações Concluídas</p>
                <h3 className="text-2xl font-bold text-green-700">{completedActions}</h3>
              </div>
              <div className="bg-white p-2 rounded-lg shadow-sm border border-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-900/60 uppercase tracking-wider">Ações Planejadas</p>
                <h3 className="text-2xl font-bold text-slate-700">{plannedActions}</h3>
              </div>
              <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                <Calendar className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investimento por Categoria</CardTitle>
            <CardDescription>Distribuição dos custos reais nas categorias de ação.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investimento Mensal (Previsto vs Real)</CardTitle>
            <CardDescription>Acompanhamento de gastos por mês.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                   formatter={(value: any) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="planned" name="Previsto" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="invested" name="Real" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
