import React from 'react';
import Layout from '../components/layout/Layout';
import FinanceDashboard from '../components/FinanceDashboard';

export default function Finance() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão Financeira e Fiscal</h1>
          <p className="text-muted-foreground">Controle de faturamento, receitas, despesas, margens e demonstrativos com IA.</p>
        </div>

        <FinanceDashboard />
      </div>
    </Layout>
  );
}
