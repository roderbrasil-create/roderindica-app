import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EndomarketingAction, FinancialItem } from '../../types/endomarketing';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { FileText, Download, FileSpreadsheet, FileBox } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../contexts/AuthContext';

// Helper to draw horizontal budget bar chart
const drawBudgetCategoryChart = (actions: EndomarketingAction[]): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(2, 2);
  const w = 500;
  const h = 200;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Group budgets
  const catData: Record<string, { planned: number; actual: number }> = {};
  actions.forEach(a => {
    const cat = a.category || 'Outros';
    if (!catData[cat]) catData[cat] = { planned: 0, actual: 0 };
    catData[cat].planned += Number(a.budget_planned) || 0;
    catData[cat].actual += Number(a.budget_actual) || 0;
  });

  const active = Object.entries(catData).filter(([_, b]) => b.planned > 0 || b.actual > 0);
  if (active.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados de orçamento para exibir', w / 2, h / 2);
    return canvas.toDataURL('image/png');
  }

  // Draw Title & Legend
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Orçamento Geral das Ações por Categoria (R$)', 20, 20);

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(320, 11, 10, 6);
  ctx.fillStyle = '#334155';
  ctx.font = '9px Arial';
  ctx.fillText('Previsto', 334, 17);

  ctx.fillStyle = '#ea580c';
  ctx.fillRect(400, 11, 10, 6);
  ctx.fillStyle = '#334155';
  ctx.fillText('Investido', 414, 17);

  const left = 130;
  const right = 40;
  const top = 35;
  const bot = 15;
  const cW = w - left - right;
  const cH = h - top - bot;

  const maxVal = Math.max(...active.map(([_, b]) => Math.max(b.planned, b.actual)), 100);

  // Draw horizontal rows
  const rowH = cH / active.length;
  const bH = Math.min(8, rowH * 0.35);

  active.forEach(([cat, b], idx) => {
    const y = top + (idx * rowH) + (rowH / 2);

    ctx.fillStyle = '#1e293b';
    ctx.font = '9px Arial';
    ctx.textAlign = 'right';
    const label = cat.length > 20 ? cat.substring(0, 18) + '...' : cat;
    ctx.fillText(label, left - 10, y + 3);

    const prevW = (b.planned / maxVal) * cW;
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(left, y - bH - 1, prevW, bH);

    const realW = (b.actual / maxVal) * cW;
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(left, y + 1, realW, bH);
  });

  return canvas.toDataURL('image/png');
};

// Helper for status doughnut chart
const drawStatusDoughnutChart = (actions: EndomarketingAction[]): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(2, 2);
  const w = 500;
  const h = 200;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const counts: Record<string, number> = { 'Concluída': 0, 'Planejada': 0, 'Em andamento': 0, 'Cancelada': 0 };
  actions.forEach(a => { if (a.status in counts) counts[a.status]++; });

  const total = actions.length;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Distribuição das Ações por Status', 20, 20);

  const colors: Record<string, string> = { 'Concluída': '#16a34a', 'Planejada': '#0284c7', 'Em andamento': '#d97706', 'Cancelada': '#dc2626' };
  const cX = 120, cY = 110, oR = 60, iR = 35;
  let startAngle = -Math.PI / 2;

  Object.entries(counts).forEach(([status, count]) => {
    if (count === 0) return;
    const slice = (count / total) * (Math.PI * 2);
    const endAngle = startAngle + slice;

    ctx.beginPath();
    ctx.arc(cX, cY, oR, startAngle, endAngle);
    ctx.arc(cX, cY, iR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = colors[status];
    ctx.fill();

    startAngle = endAngle;
  });

  // White center hole
  ctx.beginPath();
  ctx.arc(cX, cY, iR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total.toString(), cX, cY - 4);
  ctx.font = '8px Arial';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Ações', cX, cY + 8);

  // Legend
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let legY = 50;

  Object.entries(counts).forEach(([status, count]) => {
    if (count === 0) return;
    ctx.fillStyle = colors[status];
    ctx.fillRect(250, legY - 5, 10, 10);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 10px Arial';
    ctx.fillText(`${status}: ${count} (${((count/total)*100).toFixed(0)}%)`, 268, legY);
    legY += 22;
  });

  return canvas.toDataURL('image/png');
};

// Helper for monthly breakdown bar chart
const drawMonthlyTrendChart = (actions: EndomarketingAction[]): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(2, 2);
  const w = 500;
  const h = 200;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const monthly = Array.from({ length: 12 }, () => ({ planned: 0, actual: 0 }));
  actions.forEach(a => {
    if (!a.date_planned) return;
    const m = new Date(a.date_planned).getMonth();
    if (m >= 0 && m < 12) {
      monthly[m].planned += Number(a.budget_planned) || 0;
      monthly[m].actual += Number(a.budget_actual) || 0;
    }
  });

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Gráfico Mensal de Investimentos Previsto vs. Realizado', 20, 20);

  const left = 40, right = 20, top = 40, bot = 25;
  const cW = w - left - right;
  const cH = h - top - bot;
  const maxVal = Math.max(...monthly.map(m => Math.max(m.planned, m.actual)), 100);

  const step = cH / 4;
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = top + cH - (i * step);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(w - right, y);
    ctx.stroke();
  }

  const monthsAbbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const colW = cW / 12;
  const bW = Math.max(4, colW * 0.3);

  monthly.forEach((m, idx) => {
    const x = left + (idx * colW) + (colW / 2);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(monthsAbbr[idx], x, h - 12);

    const prevH = (m.planned / maxVal) * cH;
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x - bW - 1, h - bot - prevH, bW, prevH);

    const realH = (m.actual / maxVal) * cH;
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x + 1, h - bot - realH, bW, realH);
  });

  return canvas.toDataURL('image/png');
};

const loadImageAsBase64 = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // critical for CORS!
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
          return;
        }
      } catch (e) {
        console.error('Failed to convert image to base64:', e);
      }
      resolve(null);
    };
    img.onerror = () => {
      console.error('Failed to load image:', url);
      resolve(null);
    };
    img.src = url;
  });
};

export default function EndoReports() {
  const { user } = useAuth();
  const [actions, setActions] = useState<EndomarketingAction[]>([]);
  const [selectedActionId, setSelectedActionId] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'endomarketing_actions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EndomarketingAction[];
      setActions(data);
    }, (error) => {
      console.error("Error in EndoReports snapshot:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getPageBaseDecorations = (doc: jsPDF, page: number, total: number, title: string) => {
    // Brand header
    doc.setFillColor(234, 88, 12);
    doc.rect(0, 0, 210, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`RODER INDICA V2 | ${title}`, 15, 10);
    
    doc.setFont('helvetica', 'normal');
    const now = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Emitido em: ${now}`, 195, 10, { align: 'right' });

    // Dividers
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 13, 195, 13);
    doc.line(15, 282, 195, 282);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('RODER - Gestão e Comunicação de Endomarketing', 15, 288);
    doc.text(`Página ${page} de ${total}`, 195, 288, { align: 'right' });
  };

  // 1. Relatório Geral (PDF)
  const generateGeneralPDF = () => {
    if (actions.length === 0) {
      toast.error("Não há ações cadastradas para reportar.");
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header banner
    doc.setFillColor(15, 23, 42);
    doc.rect(15, 18, 180, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RELATÓRIO GERAL DE ENDOMARKETING', 20, 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(226, 232, 240);
    doc.text('Tabelas consolidadas, cronogramas de investimento e gráficos analíticos', 20, 32);
    doc.setTextColor(234, 113, 0);
    doc.text('Roder Indica V2 - Relatório Corporativo de Execução', 20, 38);

    // KPIs Card Draw
    const totalP = actions.reduce((acc, a) => acc + (a.budget_planned || 0), 0);
    const totalR = actions.reduce((acc, a) => acc + (a.budget_actual || 0), 0);
    const totalPart = actions.reduce((acc, a) => acc + (a.participants_actual || 0), 0);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    
    // KPI 1
    doc.rect(15, 48, 56, 18, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('AÇÕES CADASTRADAS', 19, 53);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(actions.length.toString(), 19, 61);

    // KPI 2
    doc.rect(77, 48, 56, 18, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('INVESTIDO TOTAL (REAL)', 81, 53);
    doc.setFontSize(11);
    doc.setTextColor(234, 88, 12);
    doc.text(formatBRL(totalR), 81, 61);

    // KPI 3
    doc.rect(139, 48, 56, 18, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('PÚBLICO ALCANCE REAL', 143, 53);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(totalPart.toLocaleString('pt-BR'), 143, 61);

    // Table Spreadsheet Style
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Ações em Execução (Planilha Geral)', 15, 75);

    const rows = actions.map(a => [
      a.name,
      a.category,
      a.date_planned ? new Date(a.date_planned).toLocaleDateString('pt-BR') : '-',
      a.status,
      formatBRL(a.budget_planned || 0),
      formatBRL(a.budget_actual || 0)
    ]);

    autoTable(doc, {
      startY: 79,
      head: [['Ação de Endomarketing', 'Categoria', 'Data Prog.', 'Status', 'Verba Prevista', 'Verba Realizada']],
      body: rows,
      margin: { left: 15, right: 15 },
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' }
      }
    });

    // Page 2: Analytical Graphs
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(15, 18, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DEMONSTRATIVO FINANCEIRO E DE STATUS', 20, 23.5);

    const bChart = drawBudgetCategoryChart(actions);
    if (bChart) doc.addImage(bChart, 'PNG', 15, 30, 180, 80);

    const sChart = drawStatusDoughnutChart(actions);
    if (sChart) doc.addImage(sChart, 'PNG', 15, 120, 180, 80);

    // Insights box
    const variance = totalR - totalP;
    const isUnder = variance <= 0;
    
    const boxY = 208;
    const boxWidth = 180;
    const paddingX = 5;
    const textWidth = boxWidth - (paddingX * 2); // 170mm
    const textStartX = 15 + paddingX; // 20mm
    
    const insights = [
      `1. Planejamento Financeiro: Investimento real de ${formatBRL(totalR)} ante um previsto de ${formatBRL(totalP)}, operando com um desvio financeiro de (${formatBRL(variance)}) (${isUnder ? 'superavit econômico' : 'estouro orçamentário'}).`,
      `2. Execução Territorial: Foram atingidos ${totalPart} colaboradores com um total de ${actions.length} iniciativas coordenadas pelas áreas corporativas de RH e Marketing.`,
      `3. Controle de Conformidade: Recomenda-se realizar reuniões periódicas para fechamento financeiro de fornecedores em até 10 dias após a finalização de cada ação para evitar acúmulos e atrasos operacionais.`,
      `4. Ações Pendentes: Validar e certificar o carregamento de todas as evidências correspondentes às ações listadas com status "Concluída" para fechamento final de auditagem interna.`
    ];

    // Calculate height dynamically
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    const splitTexts = insights.map(text => {
      return doc.splitTextToSize(text, textWidth);
    });
    
    const titleH = 7;
    const lineSpacing = 3.5;
    const paragraphGap = 2.5;
    let totalTextHeight = 0;
    
    splitTexts.forEach(lines => {
      totalTextHeight += (lines.length * lineSpacing) + paragraphGap;
    });
    
    const boxH = titleH + totalTextHeight + 4; // safe padding

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, boxY, boxWidth, boxH, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Análise e Direcionamento do Gestor:', textStartX, boxY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    
    let currentY = boxY + 12;
    splitTexts.forEach(lines => {
      doc.text(lines, textStartX, currentY);
      currentY += (lines.length * lineSpacing) + paragraphGap;
    });

    // Set page decor
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      getPageBaseDecorations(doc, i, totalPages, 'Relatório Geral');
    }

    doc.save(`relatorio_endomarketing_geral_${new Date().getFullYear()}.pdf`);
    toast.success('Relatório Geral em PDF exportado!');
  };

  // 2. Relatório Anual (PDF)
  const generateAnnualPDF = () => {
    if (actions.length === 0) {
      toast.error("Não há registros corporativos para emissão anual.");
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    
    doc.setFillColor(15, 23, 42);
    doc.rect(15, 18, 180, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`CONSOLIDADO ANUAL DE ENDOMARKETING - ${new Date().getFullYear()}`, 20, 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(226, 232, 240);
    doc.text('Análise matricial de investimentos distribuídos mensalmente e por grupo de categoria', 20, 32);
    doc.setTextColor(234, 113, 0);
    doc.text('Roder Indica V2 - Balanço de Recursos Contábeis e Desempenho', 20, 38);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Análise Financeira Acumulada por Categoria', 15, 52);

    const catStats: Record<string, { count: number; planned: number; actual: number }> = {};
    actions.forEach(a => {
      const cat = a.category || 'Outros';
      if (!catStats[cat]) catStats[cat] = { count: 0, planned: 0, actual: 0 };
      catStats[cat].count++;
      catStats[cat].planned += Number(a.budget_planned) || 0;
      catStats[cat].actual += Number(a.budget_actual) || 0;
    });

    const catRows = Object.entries(catStats).map(([cat, stat]) => [
      cat,
      stat.count.toString(),
      formatBRL(stat.planned),
      formatBRL(stat.actual),
      formatBRL(stat.planned - stat.actual)
    ]);

    const totalP = actions.reduce((acc, a) => acc + (a.budget_planned || 0), 0);
    const totalR = actions.reduce((acc, a) => acc + (a.budget_actual || 0), 0);

    catRows.push([
      'TOTAL ACUMULADO',
      actions.length.toString(),
      formatBRL(totalP),
      formatBRL(totalR),
      formatBRL(totalP - totalR)
    ]);

    autoTable(doc, {
      startY: 56,
      head: [['Categoria das Ações', 'Qtd', 'Previsão Inicial (Pl.)', 'Investido Real (Act.)', 'Resultado (Diferença)']],
      body: catRows,
      margin: { left: 15, right: 15 },
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 40, halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.row.index === catRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      }
    });

    // Monthly breakdown table
    const table2Y = (doc as any).lastAutoTable.finalY + 10;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Atividades e Alocação Mensal Financeira', 15, table2Y);

    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthlyStats = months.map((name, i) => {
      const match = actions.filter(a => a.date_planned && new Date(a.date_planned).getMonth() === i);
      const planned = match.reduce((sum, a) => sum + (a.budget_planned || 0), 0);
      const actual = match.reduce((sum, a) => sum + (a.budget_actual || 0), 0);
      return [
        name,
        match.length.toString(),
        formatBRL(planned),
        formatBRL(actual),
        formatBRL(planned - actual)
      ];
    });

    autoTable(doc, {
      startY: table2Y + 4,
      head: [['Mês de Execução', 'Qtd Ações', 'Investimento Previsto', 'Investimento Real', 'Balanço (Saldo)']],
      body: monthlyStats,
      margin: { left: 15, right: 15 },
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 6.5, cellPadding: 1.8 },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 40, halign: 'right' }
      }
    });

    // Page 2: Monthly trend bar chart
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(15, 18, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ANÁLISE DE TENDÊNCIA DE DESEMBENHO ANUAL', 20, 23.5);

    const mChartImg = drawMonthlyTrendChart(actions);
    if (mChartImg) doc.addImage(mChartImg, 'PNG', 15, 30, 180, 85);

    // Annual executive note
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 130, 180, 36, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Sumário Executivo e Diretrizes:', 20, 137);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`- Distribuição Mensal: As ações estão alocadas conforme o plano anual divulgado pelo setor de marketing e de recursos humanos da Roder.`, 20, 144);
    doc.text(`- Desempenho e Liquidez: O balanço final anual consolida o fechamento físico e econômico de todas as campanhas gerenciais do período corrente.`, 20, 151);
    doc.text(`- Conclusões de Auditoria: Este documento serve de subsídio consolidado para planejamento orçamentário estratégico do próximo exercício fiscal.`, 20, 158);

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      getPageBaseDecorations(doc, i, totalPages, 'Balanço Anual');
    }

    doc.save(`consolidado_anual_endomarketing_${new Date().getFullYear()}.pdf`);
    toast.success('Balanço Anual em PDF exportado!');
  };

  // 3. Relatório por Evento (PDF)
  const generateEventPDF = async (actionId: string) => {
    if (!actionId) return;
    const action = actions.find(a => a.id === actionId);
    if (!action) {
      toast.error("Ação selecionada não foi encontrada.");
      return;
    }

    toast.info("Processando lançamentos e gerando dossiê...");

    try {
      const collRef = collection(db, `endomarketing_actions/${actionId}/financial_items`);
      const snapshot = await getDocs(collRef);
      const finItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FinancialItem[];

      const doc = new jsPDF('p', 'mm', 'a4');

      doc.setFillColor(15, 23, 42);
      doc.rect(15, 18, 180, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(action.name.toUpperCase().substring(0, 55), 20, 26);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(226, 232, 240);
      doc.text(`Dossiê Completo, Fechamento de Lançamentos e Comprovantes Internos`, 20, 32);
      doc.setTextColor(234, 113, 0);
      doc.text(`Categoria: ${action.category}  |  Área: ${action.responsible_area}`, 20, 38);

      // Info Table
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Dados de Controle do Evento:', 15, 52);

      const infoRows = [
        ['Status da Ação', action.status || 'Planejada', 'Responsável Líder', action.responsible_name || 'N/A'],
        ['Data Planejada', action.date_planned ? new Date(action.date_planned).toLocaleDateString('pt-BR') : '-', 'Data Realização', action.date_realized ? new Date(action.date_realized).toLocaleDateString('pt-BR') : 'Pendente'],
        ['Participantes Planejados', (action.participants_planned || 0).toString(), 'Participantes Reais', (action.participants_actual || 0).toString()],
        ['Orçamento Reservado', formatBRL(action.budget_planned || 0), 'Investimento Efetivado', formatBRL(action.budget_actual || 0)]
      ];

      autoTable(doc, {
        startY: 56,
        body: infoRows,
        margin: { left: 15, right: 15 },
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.8 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 },
          1: { cellWidth: 55 },
          2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 },
          3: { cellWidth: 55 }
        }
      });

      const nextY = (doc as any).lastAutoTable.finalY + 8;
      
      // Objective/Rationale panel
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, nextY, 180, 22, 'FD');

      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Objetivos e Público Destinatário da Ação:', 20, nextY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const objLines = doc.splitTextToSize(`Objetivo: ${action.objective || '-'}  |  Destinatários: ${action.target_audience || '-'}`, 170);
      doc.text(objLines, 20, nextY + 11);
      doc.text(`Descrição: ${action.description || 'Nenhuma descrição detalhada.'}`, 20, nextY + 17);

      const tableFinY = nextY + 28;

      // Expense table
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Detalhamento de Distribuição e Notas Fiscais (Comprovantes)', 15, tableFinY);

      if (finItems.length === 0) {
        doc.setFillColor(254, 254, 254);
        doc.rect(15, tableFinY + 4, 180, 18, 'F');
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text('Não há lançamentos financeiros detalhados registrados para esta ação no sistema.', 20, tableFinY + 11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Totais Globais: Planejado: ${formatBRL(action.budget_planned || 0)}  |  Realizado: ${formatBRL(action.budget_actual || 0)}`, 20, tableFinY + 17);
      } else {
        const itemRows = finItems.map(item => [
          item.description,
          item.category,
          item.supplier || '-',
          item.cost_center || '-',
          formatBRL(item.value || 0)
        ]);

        itemRows.push(['TOTAL DE FECHAMENTO', '', '', '', formatBRL(action.budget_actual || 0)]);

        autoTable(doc, {
          startY: tableFinY + 4,
          head: [['Lançamento / Produto', 'Grupo Despesa', 'Fornecedor', 'Centro de Custo', 'Valor do Item']],
          body: itemRows,
          margin: { left: 15, right: 15 },
          theme: 'striped',
          headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 8 },
          styles: { fontSize: 7.5, cellPadding: 2.2 },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 35 },
            2: { cellWidth: 35 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30, halign: 'right' }
          },
          didParseCell: (data) => {
            if (data.row.index === itemRows.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [241, 245, 249];
            }
          }
        });
      }

      // Filter image evidences and load them asynchronously in parallel
      const imageEvidences = (action.evidences || []).filter(e => e.type?.startsWith('image/') && e.url);
      const loadedImages: { name: string; base64: string }[] = [];
      if (imageEvidences.length > 0) {
        const promises = imageEvidences.map(async (ev) => {
          const b64 = await loadImageAsBase64(ev.url);
          if (b64) {
            loadedImages.push({ name: ev.name, base64: b64 });
          }
        });
        await Promise.all(promises);
      }

      // Evidence list if present
      const hasEvidences = action.evidences && action.evidences.length > 0;
      const finalFinY = (doc as any).lastAutoTable?.finalY || (tableFinY + 22);

      if (hasEvidences) {
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(15, 18, 180, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('COMPROVANTES E EVIDÊNCIAS DE EXECUÇÃO', 20, 23.5);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.text('Lista de Documentos Anexados:', 15, 33);

        const evRows = action.evidences!.map((e, idx) => [
          (idx + 1).toString(),
          e.name || 'Arquivo',
          e.type || 'Imagem/PDF',
          e.created_at ? new Date(e.created_at).toLocaleDateString('pt-BR') : '-',
          e.url ? 'Anexo em nuvem' : '-'
        ]);

        autoTable(doc, {
          startY: 37,
          head: [['Ref.', 'Nome do Comprovante de Despesa/Ação', 'Tipo', 'Data Homolog.', 'Disponibilidade']],
          body: evRows,
          theme: 'grid',
          headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255], fontSize: 8 },
          styles: { fontSize: 7.5, cellPadding: 2 }
        });
      }

      // Organized image gallery section
      if (loadedImages.length > 0) {
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(15, 18, 180, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('GALERIA DE FOTOS DO EVENTO', 20, 23.5);

        let imgIdx = 0;
        let col = 0; // 0 or 1
        let row = 0; // 0, 1, or 2
        let yStart = 32;

        for (const imgData of loadedImages) {
          if (imgIdx > 0 && imgIdx % 6 === 0) {
            doc.addPage();
            row = 0;
            col = 0;
            yStart = 20; // no banner on subsequent pages, start higher
          }

          const x = col === 0 ? 15 : 110;
          const y = yStart + (row * 78);

          // Organized photo card slot (gray outline box)
          doc.setDrawColor(226, 232, 240);
          doc.setFillColor(250, 250, 250);
          doc.rect(x, y, 85, 68, 'FD');

          try {
            // Place image padded inside card center
            doc.addImage(imgData.base64, 'JPEG', x + 4, y + 4, 77, 52);
          } catch (err) {
            console.error('Error rendering image in PDF:', err);
            doc.setFillColor(241, 245, 249);
            doc.rect(x + 4, y + 4, 77, 52, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text('Erro na renderização da imagem', x + 42.5, y + 30, { align: 'center' });
          }

          // File name caption underneath
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          const shortName = imgData.name.length > 40 ? imgData.name.substring(0, 37) + '...' : imgData.name;
          doc.text(shortName, x + 42.5, y + 62, { align: 'center' });

          col++;
          if (col > 1) {
            col = 0;
            row++;
          }
          imgIdx++;
        }
      }

      // Closing Success Panel
      const closureY = (doc as any).lastAutoTable?.finalY + 10 || finalFinY + 12;
      const room = 297 - closureY > 50;
      if (!room) doc.addPage();
      const pY = !room ? 20 : closureY;

      doc.setDrawColor(22, 163, 74);
      doc.setFillColor(240, 253, 244);
      doc.rect(15, pY, 180, 30, 'FD');

      doc.setTextColor(21, 128, 61);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('Conclusão Física e Financeira:', 20, pY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(22, 101, 52);
      const bal = (action.budget_planned || 0) - (action.budget_actual || 0);
      const isPost = bal >= 0;
      
      doc.text(`- Balanço de Recursos: ${isPost ? 'Executado dentro do orçamento previsto com um saldo retornado de ' + formatBRL(bal) : 'Teve acréscimo orçamentário de ' + formatBRL(Math.abs(bal)) + ' acima do previsto.'}`, 20, pY + 13);
      doc.text(`- Auditoria: Documentação homologada e fechada pelo gestor líder ${action.responsible_name} (${action.responsible_area}).`, 20, pY + 20);

      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        getPageBaseDecorations(doc, i, totalPages, 'Dossiê do Evento');
      }

      doc.save(`dossie_evento_${action.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);

      try {
        const pdfBlob = doc.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        window.open(blobUrl, '_blank');
      } catch (openErr) {
        console.warn('Popup blocker or sandbox prevented automatically opening the tab:', openErr);
      }

      toast.success('Dossiê do Evento em PDF exportado com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF do evento!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1 - Relatório Geral */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-orange-600" />
              Relatório Geral (PDF)
            </CardTitle>
            <CardDescription>Resumo planejado vs real com painéis demonstrativos e gráficos setoriais.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generateGeneralPDF} className="w-full bg-slate-900 border-none text-white hover:bg-slate-800">
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF Geral
            </Button>
          </CardContent>
        </Card>

        {/* Card 2 - Relatório Anual */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              Relatório Anual (PDF)
            </CardTitle>
            <CardDescription>Resumo anual consolidado por categorias e meses com curva de tendência.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generateAnnualPDF} className="w-full bg-slate-900 border-none text-white hover:bg-slate-800">
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF Anual
            </Button>
          </CardContent>
        </Card>

        {/* Card 3 - Dossie por Evento */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileBox className="h-5 w-5 text-blue-600" />
              Dossiê por Evento
            </CardTitle>
            <CardDescription>Planilha detalhada de investimentos e comprovantes de uma ação em foco.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              value={selectedActionId}
              onChange={(e) => setSelectedActionId(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium text-slate-800 h-9"
            >
              <option value="">-- Selecione um evento cadastrado --</option>
              {actions.map(a => (
                <option key={a.id} value={a.id || ''}>{a.name}</option>
              ))}
            </select>
            <Button
              onClick={() => generateEventPDF(selectedActionId)}
              className="w-full bg-slate-900 border-none text-white hover:bg-slate-800 h-9"
              disabled={!selectedActionId}
            >
              <Download className="h-4 w-4 mr-2" />
              Gerar Dossiê do Evento
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Recent History Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Histórico de Ações Recentes</CardTitle>
            <CardDescription>Últimas ações coordenadas no portal para auditoria dinâmica.</CardDescription>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Consolidado Ativo</span>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ação de Endomarketing</TableHead>
                <TableHead>Mês Referência</TableHead>
                <TableHead className="text-right">Budget Realizado (Investido)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-400 py-6 font-medium">Nenhum evento registrado no histórico.</TableCell>
                </TableRow>
              ) : (
                actions.slice(0, 5).map((action) => (
                  <TableRow key={action.id}>
                    <TableCell className="font-medium text-slate-800">{action.name}</TableCell>
                    <TableCell className="capitalize text-slate-600">
                      {action.date_planned ? new Date(action.date_planned).toLocaleString('pt-BR', { month: 'long' }) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-orange-600">
                      {action.budget_actual ? formatBRL(action.budget_actual) : 'R$ 0,00'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
