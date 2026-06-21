import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Upload, 
  TrendingUp, 
  Building2, 
  Building, 
  FileCheck2, 
  AlertTriangle, 
  Loader2, 
  CheckSquare, 
  Square,
  CheckCircle2,
  HelpCircle,
  FolderOpen,
  Sparkles,
  Printer,
  FileText,
  Check,
  Calendar,
  TrendingDown,
  Award,
  AlertCircle,
  Activity,
  Download,
  MessageSquare
} from 'lucide-react';

interface KPIData {
  faturamento: number | null;
  receita_liquida: number | null;
  margem_liquida: number | null;
  resultado_liquido: number | null;
  lucro_bruto: number | null;
  rentabilidade: number | null;
  ponto_equilibrio: number | null;
  ebitda: number | null;
  margem_ebitda: number | null;
  lucro_liquido: number | null;
  margem_bruta: number | null;
  fluxo_caixa_operacional: number | null;
  saldo_caixa: number | null;
  geracao_caixa_ncc: number | null;
  capacidade_gerar_lucro: number | null;
  lucro_operacional: number | null;
  margem_contribuicao: number | null;
  capital_giro: number | null;
  pmr: number | null;
  pmp: number | null;
  indice_inadimplencia: number | null;
  liquidez_corrente: number | null;
}

interface MonthDocument {
  monthId: string;
  year: number;
  month: number;
  filesUploaded: string[];
  missingFiles: string[];
  matriz: KPIData;
  filial: KPIData;
  consolidado: KPIData;
  uploadedBy?: string;
  created_at?: string;
}

const KPI_METADATA: { 
  [key: string]: { 
    label: string; 
    suffix: string; 
    isPercent: boolean; 
    isDays: boolean; 
    description: string; 
    color: string; 
  } 
} = {
  faturamento: { label: 'Faturamento', suffix: 'R$', isPercent: false, isDays: false, description: 'Receita Operacional Bruta total', color: '#3b82f6' },
  receita_liquida: { label: 'Receita Líquida', suffix: 'R$', isPercent: false, isDays: false, description: 'Faturamento líquido de tributos e deduções', color: '#10b981' },
  margem_liquida: { label: 'Margem Líquida', suffix: '%', isPercent: true, isDays: false, description: 'Lucro líquido dividido pelo faturamento bruto', color: '#8b5cf6' },
  resultado_liquido: { label: 'Resultado Líquido', suffix: 'R$', isPercent: false, isDays: false, description: 'Resultado financeiro após todas as despesas e receitas', color: '#ec4899' },
  lucro_bruto: { label: 'Lucro Bruto', suffix: 'R$', isPercent: false, isDays: false, description: 'Diferença entre receita líquida e custo dos produtos vendidos', color: '#f59e0b' },
  rentabilidade: { label: 'Rentabilidade', suffix: '%', isPercent: true, isDays: false, description: 'Capacidade do negócio de gerar retorno no investimento', color: '#14b8a6' },
  ponto_equilibrio: { label: 'Ponto de Equilíbrio', suffix: 'R$', isPercent: false, isDays: false, description: 'Nível de faturamento mínimo para cobrir todos os custos', color: '#ef4444' },
  ebitda: { label: 'EBITDA', suffix: 'R$', isPercent: false, isDays: false, description: 'Lucro antes de juros, impostos, depreciação e amortização', color: '#06b6d4' },
  margem_ebitda: { label: 'Margem EBITDA', suffix: '%', isPercent: true, isDays: false, description: 'EBITDA dividido pela Receita Líquida', color: '#3b82f6' },
  lucro_liquido: { label: 'Lucro Líquido', suffix: 'R$', isPercent: false, isDays: false, description: 'Resultado final positivo líquido do período', color: '#22c55e' },
  margem_bruta: { label: 'Margem Bruta', suffix: '%', isPercent: true, isDays: false, description: 'Lucro bruto dividido pela Receita Líquida', color: '#a855f7' },
  fluxo_caixa_operacional: { label: 'Fluxo de Caixa Operacional', suffix: 'R$', isPercent: false, isDays: false, description: 'Recursos gerados apenas pelas atividades principais', color: '#6366f1' },
  saldo_caixa: { label: 'Saldo de Caixa', suffix: 'R$', isPercent: false, isDays: false, description: 'Recursos em caixa disponíveis no encerramento', color: '#0ea5e9' },
  geracao_caixa_ncc: { label: 'Geração de Caixa - NCC', suffix: 'R$', isPercent: false, isDays: false, description: 'Geração com ajuste da Necessidade de Capital de Giro', color: '#f43f5e' },
  capacidade_gerar_lucro: { label: 'Capacidade de Gerar Lucro', suffix: '%', isPercent: true, isDays: false, description: 'Percentual do faturamento convertido em lucro', color: '#eab308' },
  lucro_operacional: { label: 'Lucro Operacional', suffix: 'R$', isPercent: false, isDays: false, description: 'Lucro decorrente puramente das atividades operacionais', color: '#16a34a' },
  margem_contribuicao: { label: 'Margem de Contribuição', suffix: '%', isPercent: true, isDays: false, description: 'Percentual que sobra das vendas para pagar custos fixos', color: '#ea580c' },
  capital_giro: { label: 'Capital de Giro', suffix: 'R$', isPercent: false, isDays: false, description: 'Ativo circulante menos passivo circulante disponível', color: '#0284c7' },
  pmr: { label: 'PMR (Prazo Médio Recebimento)', suffix: ' dias', isPercent: false, isDays: true, description: 'Tempo médio para receber as vendas realizadas', color: '#4f46e5' },
  pmp: { label: 'PMP (Prazo Médio Pagamento)', suffix: ' dias', isPercent: false, isDays: true, description: 'Tempo médio concedido por fornecedores para pagamento', color: '#7c3aed' },
  indice_inadimplencia: { label: 'Índice de Inadimplência', suffix: '%', isPercent: true, isDays: false, description: 'Percentual de clientes com contas em atraso no período', color: '#dc2626' },
  liquidez_corrente: { label: 'Liquidez Corrente', suffix: '', isPercent: false, isDays: false, description: 'Capacidade de pagar contas de curto prazo (Ativo/Passivo)', color: '#2563eb' }
};

const EXPECTED_REPORTS_LIST = [
  "Receita Sintético - Matriz",
  "Receita Sintético - Filial",
  "Despesas Fixas - Matriz",
  "Despesas Fixas - Filial",
  "Despesas Variáveis - Matriz",
  "Despesas Variáveis - Filial",
  "EBITDA - Matriz",
  "EBITDA - Filial",
  "Geração de Caixa (NCC) - Matriz",
  "Geração de Caixa (NCC) - Filial",
  "Lucratividade Líquida - Matriz",
  "Lucratividade Líquida - Filial",
  "Margem de Contribuição - Matriz",
  "Margem de Contribuição - Filial",
  "Ponto de Equilíbrio - Matriz",
  "Ponto de Equilíbrio - Filial",
  "Resultado Líquido - Matriz",
  "Resultado Líquido - Filial",
  "Resultado Operacional de Caixa - Matriz",
  "Resultado Operacional de Caixa - Filial"
];

// Helper to format currency
const formatValue = (value: number | null | undefined, key: string) => {
  if (value === null || value === undefined) return 'N/A';
  const meta = KPI_METADATA[key];
  if (!meta) return value.toString();

  if (meta.suffix === 'R$') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  if (meta.isPercent) {
    return `${value.toFixed(2)}%`;
  }
  if (meta.isDays) {
    return `${Math.round(value)} dias`;
  }
  return value.toFixed(2);
};

export default function FinanceDashboard() {
  const [history, setHistory] = useState<MonthDocument[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<'matriz' | 'filial' | 'consolidado'>('consolidado');
  const [activeKPIs, setActiveKPIs] = useState<string[]>(['faturamento', 'receita_liquida', 'resultado_liquido', 'ebitda']);
  
  // Upload and ingestion states
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<MonthDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // AI diagnosis report states
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnoseResult, setDiagnoseResult] = useState<any | null>(null);
  const [showPresentationMode, setShowPresentationMode] = useState(false);

  // Helper to calculate delta percentage change
  const calculateChange = (currentVal: number | null, previousVal: number | null) => {
    if (currentVal === null || previousVal === null || previousVal === 0) return null;
    return ((currentVal - previousVal) / Math.abs(previousVal)) * 100;
  };

  useEffect(() => {
    setDiagnoseResult(null);
    setShowPresentationMode(false);
  }, [selectedMonth, selectedEntity]);

  const handleGenerateDiagnosis = async () => {
    const selectedMonthDoc = history.find(m => m.monthId === selectedMonth);
    if (!selectedMonthDoc) {
      toast.error("Por favor, selecione um período com dados já salvos.");
      return;
    }
    
    setIsDiagnosing(true);
    try {
      const res = await fetch("/api/financeiro/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          current: selectedMonthDoc,
          history: history,
          entity: selectedEntity
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao consultar a IA para o diagnóstico.");
      }
      
      const result = await res.json();
      if (result.success && result.data) {
        setDiagnoseResult(result.data);
        setShowPresentationMode(true);
        toast.success("Apresentação e diagnóstico financeiro geradores com sucesso!");
      } else {
        throw new Error("Formato de resposta inválido.");
      }
    } catch (error: any) {
      console.error("Error generating finance diagnose:", error);
      toast.error(`Falha ao gerar diagnóstico: ${error.message}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleDownloadPDF = async () => {
    const p1 = document.getElementById('cfo-report-page-1');
    const p2 = document.getElementById('cfo-report-page-2');
    const p3 = document.getElementById('cfo-report-page-3');

    if (!p1 || !p2 || !p3) {
      toast.error("Erro: Estrutura do relatório não encontrada na tela.");
      return;
    }

    const toastId = toast.loading("Gerando PDF executivo (3 páginas)...", {
      description: "Por favor, aguarde enquanto renderizamos os gráficos e consolidações em alta resolução.",
    });

    try {
      // Generate clean PNGs with dark presentation styling, matching the live preview
      const opts = {
        quality: 0.98,
        pixelRatio: 2, // High resolution retina rendering
        backgroundColor: '#09090b', // Deep dark solid background
        style: {
          padding: '24px',
          margin: '0',
          width: '1200px', // Uniform high-width rendering for beautiful proportions
          borderRadius: '16px'
        }
      };

      // Generate all pages in parallel for ultra-high speed performance
      const [img1, img2, img3] = await Promise.all([
        toPng(p1, opts),
        toPng(p2, opts),
        toPng(p3, opts)
      ]);

      // Initialize a multi-page A4 PDF (Portrait, Pixels)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // PAGE 1
      const props1 = pdf.getImageProperties(img1);
      const h1 = (props1.height * pdfWidth) / props1.width;
      pdf.addImage(img1, 'PNG', 0, 0, pdfWidth, Math.min(h1, pdfHeight));

      // PAGE 2
      pdf.addPage();
      const props2 = pdf.getImageProperties(img2);
      const h2 = (props2.height * pdfWidth) / props2.width;
      pdf.addImage(img2, 'PNG', 0, 0, pdfWidth, Math.min(h2, pdfHeight));

      // PAGE 3
      pdf.addPage();
      const props3 = pdf.getImageProperties(img3);
      const h3 = (props3.height * pdfWidth) / props3.width;
      pdf.addImage(img3, 'PNG', 0, 0, pdfWidth, Math.min(h3, pdfHeight));

      // Save PDF directly to user download folder without manual window intervention
      pdf.save(`Relatorio_CFO_RODER_${selectedEntity.toUpperCase()}_${selectedMonth}.pdf`);

      toast.dismiss(toastId);
      toast.success("PDF baixado com sucesso!");
    } catch (err: any) {
      console.error("PDF generation failure:", err);
      toast.dismiss(toastId);
      toast.error(`Falha ao exportar PDF diretamente: ${err.message}.`);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!diagnoseResult || !selectedMonth) {
      toast.error("Nenhum diagnóstico pronto para compartilhar.");
      return;
    }

    // First trigger PDF generation so it downloads to their device automatically
    handleDownloadPDF();

    const compFaturamento = comparisonIndicators?.find(c => c.key === 'faturamento');
    const compReceita = comparisonIndicators?.find(c => c.key === 'receita_liquida');
    const compEbitda = comparisonIndicators?.find(c => c.key === 'ebitda');
    const compLucro = comparisonIndicators?.find(c => c.key === 'resultado_liquido');

    const faturamentoStr = compFaturamento ? formatValue(compFaturamento.currentVal, 'faturamento') : 'N/D';
    const receitaStr = compReceita ? formatValue(compReceita.currentVal, 'receita_liquida') : 'N/D';
    const ebitdaStr = compEbitda ? formatValue(compEbitda.currentVal, 'ebitda') : 'N/D';
    const lucroStr = compLucro ? formatValue(compLucro.currentVal, 'resultado_liquido') : 'N/D';

    const healthStatus = diagnoseResult.financialHealth === 'Saudável' ? '🟢 Saudável' : 
                         diagnoseResult.financialHealth === 'Atenção' ? '🟡 Em Alerta' : '🔴 Crítico';

    const text = `📊 *RODER BRASIL - Relatório CFO (${selectedEntity.toUpperCase()})* 📊\n` +
                 `• Competência: *${selectedMonth}*\n\n` +
                 `🩺 *Status de Saúde:* ${healthStatus}\n` +
                 `📌 *"${diagnoseResult.healthCheckTitle}"*\n\n` +
                 `📈 *KPIs Principais:* \n` +
                 `  - Faturamento: *${faturamentoStr}*\n` +
                 `  - Receita Líquida: *${receitaStr}*\n` +
                 `  - EBITDA: *${ebitdaStr}*\n` +
                 `  - Resultado Líquido: *${lucroStr}*\n\n` +
                 `📝 *Resumo CFO:* ${diagnoseResult.summary.substring(0, 250)}...\n\n` +
                 `📎 *Aviso:* O PDF executivo oficial de 3 páginas foi gerado e baixado automaticamente no seu dispositivo. Basta anexar o arquivo na conversa do WhatsApp que abrimos para você!`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      toast.success("Resumo copiado e painel do WhatsApp aberto!");
    }, 1200);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const q = query(collection(db, 'financial_dashboard_months'));
      const snapshot = await getDocs(q);
      const monthsData = snapshot.docs.map(doc => doc.data() as MonthDocument);
      // Sort chronologically
      monthsData.sort((a, b) => a.monthId.localeCompare(b.monthId));
      setHistory(monthsData);
      
      if (monthsData.length > 0 && !selectedMonth) {
        setSelectedMonth(monthsData[monthsData.length - 1].monthId);
      }
    } catch (err: any) {
      console.error("Error fetching financial history:", err);
      toast.error("Erro ao carregar dados históricos do demonstrativo.");
    }
  };

  const currentMonthData = history.find(m => m.monthId === selectedMonth) || parsedData;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setParsedData(null);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('/api/financeiro/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar relatórios.');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setParsedData(result.data);
        toast.success(`Arquivos analisados com sucesso para ${result.data.monthId}!`);
        
        // Switch view automatically to consolidated
        setSelectedEntity('consolidado');
      } else {
        throw new Error('Falha no formato de resposta do analisador backend.');
      }
    } catch (error: any) {
      console.error("PDF upload error:", error);
      toast.error(`Erro na análise: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!parsedData) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'financial_dashboard_months', parsedData.monthId);
      const docToSave = {
        ...parsedData,
        uploadedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      await setDoc(docRef, docToSave);
      toast.success(`Demonstrativo mensal para ${parsedData.monthId} persistido com sucesso!`);
      
      // Update local history and current views
      await fetchHistory();
      setSelectedMonth(parsedData.monthId);
      setParsedData(null); // Clear temporary staging upload
    } catch (error: any) {
      console.error("Error saving month data:", error);
      toast.error(`Erro ao salvar demonstrativo: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleKPI = (key: string) => {
    if (activeKPIs.includes(key)) {
      setActiveKPIs(activeKPIs.filter(k => k !== key));
    } else {
      setActiveKPIs([...activeKPIs, key]);
    }
  };

  // Preset Filters
  const setPreset = (presetType: 'operational' | 'profitability' | 'efficiency' | 'all') => {
    if (presetType === 'operational') {
      setActiveKPIs(['faturamento', 'receita_liquida', 'lucro_bruto', 'ebitda', 'lucro_operacional']);
    } else if (presetType === 'profitability') {
      setActiveKPIs(['margem_liquida', 'margem_ebitda', 'margem_bruta', 'rentabilidade', 'capacidade_gerar_lucro']);
    } else if (presetType === 'efficiency') {
      setActiveKPIs(['capital_giro', 'ponto_equilibrio', 'pmr', 'pmp', 'indice_inadimplencia', 'liquidez_corrente']);
    } else {
      setActiveKPIs(Object.keys(KPI_METADATA));
    }
  };

  // Chart data preparing
  const chartData = history.map(item => {
    const entityData = item[selectedEntity] || {};
    const formattedObj: any = { monthId: item.monthId };
    
    Object.keys(KPI_METADATA).forEach(key => {
      formattedObj[key] = (entityData as any)[key] || 0;
    });
    
    return formattedObj;
  });

  const comparisonIndicators = React.useMemo(() => {
    if (!selectedMonth || history.length === 0) return [];
    
    const currentIndex = history.findIndex(m => m.monthId === selectedMonth);
    const currentDoc = history[currentIndex];
    if (!currentDoc) return [];
    
    const previousMonthDoc = currentIndex > 0 ? history[currentIndex - 1] : null;
    const prevYearMonthDoc = history.find(m => m.year === currentDoc.year - 1 && m.month === currentDoc.month);
    
    const currEntityData = currentDoc[selectedEntity] || {};
    const prevEntityData = previousMonthDoc ? previousMonthDoc[selectedEntity] || {} : null;
    const prevYearEntityData = prevYearMonthDoc ? prevYearMonthDoc[selectedEntity] || {} : null;

    return Object.keys(KPI_METADATA).map(key => {
      const meta = KPI_METADATA[key];
      const currentVal = (currEntityData as any)[key] ?? null;
      const prevVal = prevEntityData ? (prevEntityData as any)[key] ?? null : null;
      const prevYearVal = prevYearEntityData ? (prevYearEntityData as any)[key] ?? null : null;
      
      const deltaPrev = calculateChange(currentVal, prevVal);
      const deltaYear = calculateChange(currentVal, prevYearVal);
      
      return {
        key,
        label: meta.label,
        suffix: meta.suffix,
        isPercent: meta.isPercent,
        isDays: meta.isDays,
        currentVal,
        prevVal,
        prevYearVal,
        deltaPrev,
        deltaYear,
        previousMonthId: previousMonthDoc?.monthId || null,
        prevYearMonthId: prevYearMonthDoc?.monthId || null,
      };
    });
  }, [selectedMonth, selectedEntity, history]);

  const presentationChartData = React.useMemo(() => {
    if (history.length === 0 || !selectedMonth) return [];
    
    // Find chronological position of selected competency
    const targetIdx = history.findIndex(m => m.monthId === selectedMonth);
    if (targetIdx === -1) return [];
    
    // Extract up to 6 months leading to selectedMonth
    const startIdx = Math.max(0, targetIdx - 5);
    const subset = history.slice(startIdx, targetIdx + 1);
    
    return subset.map(doc => {
      const entityData = (doc[selectedEntity] || {}) as any;
      return {
        monthId: doc.monthId,
        Faturamento: entityData.faturamento || 0,
        EBITDA: entityData.ebitda || 0,
        "Resultado Líquido": entityData.resultado_liquido || 0,
        "Receita Líquida": entityData.receita_liquida || 0,
      };
    });
  }, [history, selectedMonth, selectedEntity]);

  return (
    <div className="space-y-6">
      
      {/* Upper Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-sky-500/10 text-sky-400 border border-sky-500/20 py-1 px-3 flex gap-2 items-center">
            <TrendingUp className="h-4 w-4" /> Demonstrativo Financeiro
          </Badge>
          
          <select 
            className="bg-muted text-foreground border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={history.length === 0}
          >
            {history.length === 0 ? (
              <option>Sem Meses Salvos</option>
            ) : (
              history.map(m => (
                <option key={m.monthId} value={m.monthId}>Periodo: {m.monthId}</option>
              ))
            )}
          </select>

          <div className="flex bg-muted p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => setSelectedEntity('matriz')}
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all ${selectedEntity === 'matriz' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Building2 className="h-3.5 w-3.5 text-blue-400" /> Matriz
            </button>
            <button
              onClick={() => setSelectedEntity('filial')}
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all ${selectedEntity === 'filial' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Building className="h-3.5 w-3.5 text-amber-500" /> Filial Sinop
            </button>
            <button
              onClick={() => setSelectedEntity('consolidado')}
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all ${selectedEntity === 'consolidado' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" /> Consolidado
            </button>
          </div>
        </div>

        {/* Actions layout (AI Diagnosis + Ingestion Uploader) */}
        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto w-full md:w-auto md:justify-end">
          {history.find(m => m.monthId === selectedMonth) && (
            <Button
              onClick={handleGenerateDiagnosis}
              disabled={isDiagnosing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9"
            >
              {isDiagnosing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin animate-pulse" /> Analisando Fechamento...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2 text-emerald-200" /> Relatório CFO & Diagnóstico AI
                </>
              )}
            </Button>
          )}

          <label className="relative cursor-pointer">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Button 
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold h-9 pointer-events-none" 
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ingerindo PDFs...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" /> Ingestão Mensal PDF
                </>
              )}
            </Button>
          </label>
        </div>
      </div>

      {/* Unsaved Uploaded Status Stage */}
      {parsedData && (
        <Card className="border-2 border-emerald-500/20 bg-emerald-500/5 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-base font-bold text-foreground">
                  Demonstrativo Carregado em Memória: <span className="text-emerald-400 font-extrabold">{parsedData.monthId}</span>
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-border text-muted-foreground"
                  onClick={() => setParsedData(null)}
                >
                  Descartar
                </Button>
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                  onClick={handleSaveToDatabase}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      Salvar no Banco Roder
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <p className="text-muted-foreground leading-relaxed text-xs">
              Para salvar esse período permanentemente na base de dados e plotar nas linhas históricas, confirme o salvamento após auditar as presenças dos relatórios solicitados abaixo.
            </p>

            {/* Checklists for Packages uploaded and warning if files are missing */}
            <div className="p-4 bg-card rounded-xl border border-border/80 text-xs">
              <h4 className="font-bold mb-3 text-foreground flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-sky-400" /> Auditoria de Pacote de Relatórios do Mês ({parsedData.filesUploaded.length}/{EXPECTED_REPORTS_LIST.length})
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {EXPECTED_REPORTS_LIST.map((desc) => {
                  const wasFound = parsedData.filesUploaded.some(f => f.toLowerCase().includes(desc.toLowerCase()));
                  return (
                    <div key={desc} className="flex items-center gap-2 py-1.5 px-2 bg-muted/40 rounded-lg">
                      <span className={`h-2 w-2 rounded-full ${wasFound ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      <span className={`font-medium ${wasFound ? 'text-foreground' : 'text-muted-foreground line-through decoration-muted-foreground/40'}`}>
                        {desc}
                      </span>
                    </div>
                  );
                })}
              </div>

              {parsedData.missingFiles.length > 0 && (
                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-rose-300">Atenção: Relatórios Faltantes Diagnosticados</h5>
                    <p className="text-[11px] text-rose-200 mt-1 leading-relaxed">
                      O sistema detectou que os seguintes relatórios em PDF estão faltando no lote carregado: <strong className="text-white">{parsedData.missingFiles.join(', ')}</strong>.
                      A ausência destes relatórios pode fazer com que os indicadores consolidados fiquem incompletos ou divergentes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid: Checklist & Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Checkbox Selector Column */}
        <Card className="bg-card border border-border shadow-sm lg:col-span-1">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="h-4.5 w-4.5 text-sky-500" /> Selecionar KPIs
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">Escolha os indicadores e veja a correlação no gráfico.</p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            
            {/* Quick Presets */}
            <div className="flex flex-col gap-1.5 pb-3 border-b border-border/50 text-[11px]">
              <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Filtros Rápidos</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={() => setPreset('operational')}
                  className="bg-muted hover:bg-muted-hover border border-border px-2 py-1 rounded text-left font-semibold text-foreground transition-colors hover:border-sky-500/30"
                >
                  🎯 Operacional
                </button>
                <button 
                  onClick={() => setPreset('profitability')}
                  className="bg-muted hover:bg-muted-hover border border-border px-2 py-1 rounded text-left font-semibold text-foreground transition-colors hover:border-sky-500/30"
                >
                  📈 Margens
                </button>
                <button 
                  onClick={() => setPreset('efficiency')}
                  className="bg-muted hover:bg-muted-hover border border-border px-2 py-1 rounded text-left font-semibold text-foreground transition-colors hover:border-sky-500/30"
                >
                  ⌛ Caixa e Ciclo
                </button>
                <button 
                  onClick={() => setPreset('all')}
                  className="bg-muted hover:bg-muted-hover border border-border px-2 py-1 rounded text-left font-semibold text-foreground transition-colors hover:border-sky-500/30"
                >
                  ✨ Todos
                </button>
              </div>
            </div>

            {/* Checkbox List */}
            <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
              {Object.keys(KPI_METADATA).map((key) => {
                const meta = KPI_METADATA[key];
                const isActive = activeKPIs.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleKPI(key)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
                  >
                    {isActive ? (
                      <CheckSquare className="h-4 w-4 shrink-0" style={{ color: meta.color }} />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground/65 shrink-0" />
                    )}
                    <span className="truncate">{meta.label}</span>
                    <span className="ml-auto text-[9px] px-1 px-1.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                      {meta.suffix}
                    </span>
                  </button>
                );
              })}
            </div>
            
          </CardContent>
        </Card>

        {/* Historic Multi-Axis Graphical Chart Card */}
        <Card className="bg-card border border-border shadow-sm lg:col-span-3">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold text-foreground">Evolutivo Histórico e Tendências</CardTitle>
            <p className="text-xs text-muted-foreground">Eixo esquerdo para valores monetários absolutos (R$) • Eixo direito para Margens (%), Prazos (dias) ou Índices.</p>
          </CardHeader>
          <CardContent className="p-4">
            {chartData.length < 1 ? (
              <div className="h-[360px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border/80 rounded-xl bg-muted/10">
                <AlertTriangle className="h-9 w-9 text-sky-500/50 mb-3" />
                <h4 className="font-bold text-sm text-foreground">Nenhum Demonstrativo Salvo</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                  Por favor, envie um demonstrativo mensal usando o botão "Ingestão Mensal PDF" acima e salve-o para visualizar os dados no gráfico.
                </p>
              </div>
            ) : (
              <div className="h-[360px] w-full min-w-0 flex flex-col justify-between">
                {chartData.length === 1 && (
                  <div className="mb-2 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-400 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                    <span>Exibindo os indicadores selecionados como <strong>pontos</strong> para o período de <strong>{chartData[0].monthId}</strong>. Ao salvar mais meses, as linhas de tendência e evolução entre os períodos serão traçadas automaticamente.</span>
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" opacity={0.3} />
                      <XAxis 
                        dataKey="monthId" 
                        stroke="#71717a" 
                        fontSize={11} 
                        tickLine={false}
                        padding={chartData.length === 1 ? { left: 100, right: 100 } : { left: 10, right: 10 }}
                      />
                    
                    {/* Left Axis for Monetarist values */}
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      stroke="#71717a"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => {
                        if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
                        if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
                        return `R$ ${v}`;
                      }}
                    />

                    {/* Right Axis for percentages and ratio indices */}
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#71717a"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}`}
                    />

                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }}
                      labelClassName="text-foreground font-bold"
                      formatter={(value: any, name: any) => {
                        const meta = KPI_METADATA[name];
                        const label = meta?.label || name;
                        const formatted = formatValue(value, name);
                        return [formatted, label];
                      }}
                    />
                    
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={6}
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    />

                    {activeKPIs.map((key) => {
                      const meta = KPI_METADATA[key];
                      if (!meta) return null;
                      
                      // Decide Y-Axis assignment
                      const yId = (meta.isPercent || meta.isDays || key === 'liquidez_corrente') ? 'right' : 'left';
                      
                      return (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          yAxisId={yId}
                          stroke={meta.color}
                          activeDot={{ r: 5 }}
                          strokeWidth={2.5}
                          dot={{ r: 3, strokeWidth: 1.5 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Grid displays for active KPIs of Selected Period */}
      {currentMonthData ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h3 className="text-sm font-bold text-foreground">Resultados Detalhados para o Período: <span className="text-sky-400 font-extrabold">{currentMonthData.monthId}</span></h3>
            <Badge className="bg-muted text-muted-foreground border-border text-[10px] font-semibold">
              Unidade Visualizada: {selectedEntity === 'matriz' ? 'Matriz' : selectedEntity === 'filial' ? 'Filial Sinop' : 'Consolidado Roder'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.keys(KPI_METADATA).map((key) => {
              const meta = KPI_METADATA[key];
              const entityValues = currentMonthData[selectedEntity] || {};
              const rawVal = (entityValues as any)[key];
              
              return (
                <Card 
                  key={key} 
                  className={`bg-card/45 border transition-all ${activeKPIs.includes(key) ? 'border-sky-500/30 bg-sky-500/[0.015]' : 'border-border hover:border-zinc-700/60'}`}
                >
                  <CardContent className="p-4 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-muted-foreground truncate" title={meta.label}>
                          {meta.label}
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: meta.color }} />
                      </div>
                      <h4 className="text-lg font-bold text-foreground mt-2 font-mono">
                        {formatValue(rawVal, key)}
                      </h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-2 line-clamp-2 border-t border-border/20 pt-1.5">
                      {meta.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="bg-muted/10 border-2 border-dashed border-border p-12 text-center rounded-xl">
          <FolderOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <h4 className="font-bold text-sm text-foreground">Sem Dados Carregados para este Período</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
            Nenhuma informação financeira consolidada foi persistida até o momento. Utilize o botão de Ingestão Mensal para ler PDFs com suporte de IA.
          </p>
        </Card>
      )}

      {/* CFO Presentation & AI Diagnosis Dialog (Optimized for Screen & Vectorized Printing) */}
      <Dialog open={showPresentationMode} onOpenChange={setShowPresentationMode}>
        <DialogContent className="w-[98vw] max-w-none md:max-w-5xl lg:max-w-6xl xl:max-w-[1350px] 2xl:max-w-[1450px] max-h-[92vh] overflow-y-auto bg-[#0a0a0c] border border-zinc-800 p-0 shadow-2xl rounded-2xl">
          {/* Header Actions Panel (Self-Hidden on Printing) */}
          <div className="no-print flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50 rounded-t-2xl gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-zinc-100">Apresentação CFO & Análise Inteligente de Fechamento</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                onClick={handleWhatsAppShare}
                className="bg-emerald-600 hover:bg-emerald-700 text-zinc-100 font-extrabold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-sm shadow-emerald-950"
              >
                <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
              </Button>
              <Button 
                onClick={handleDownloadPDF}
                className="bg-sky-600 hover:bg-sky-700 text-zinc-100 font-extrabold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-sm shadow-sky-950"
              >
                <Download className="h-3.5 w-3.5" /> Baixar PDF
              </Button>
              <Button 
                onClick={() => window.print()} 
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-extrabold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimir
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPresentationMode(false)}
                className="border-zinc-800 text-zinc-400 hover:text-zinc-200 h-8 text-xs font-bold"
              >
                Fechar
              </Button>
            </div>
          </div>

          {diagnoseResult && (
            <div className="print-report-container p-6 md:p-12 space-y-12 bg-[#09090b] text-zinc-100 min-h-full">
              
              {/* PAGE 1: Capa e Sumário de Fechamento */}
              <div id="cfo-report-page-1" className="print-page-break space-y-8 bg-[#09090b] text-zinc-100 p-6 md:p-8 rounded-2xl border border-zinc-800/80 shadow-2xl">
                {/* Header branding */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-emerald-500/20 pb-4 gap-4">
                  <div>
                    <h1 className="text-lg font-black tracking-widest text-emerald-400 font-sans uppercase">RODER BRASIL</h1>
                    <p className="text-xs font-bold text-zinc-400 tracking-wider">DEMONSTRATIVO DE FECHAMENTO FINANCEIRO E FISCAL</p>
                  </div>
                  <div className="text-left md:text-right">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-1 px-3 text-xs font-extrabold">
                      Unidade: {selectedEntity.toUpperCase()}
                    </Badge>
                    <p className="text-[10px] text-zinc-500 mt-1 font-mono">Competência: {selectedMonth} • Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {/* Cover title banner */}
                <div className="text-center py-6 border-b border-zinc-800/60 max-w-2xl mx-auto">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Apresentação Estratégica do CFO</span>
                  <h2 className="text-2xl font-black tracking-tight text-white mt-1 leading-tight">
                    Análise Consolidada do Fechamento de Caixa e KPIs
                  </h2>
                </div>

                {/* AI HEALTH BANNER */}
                <div className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <Award className="h-5.5 w-5.5 text-emerald-400" />
                      <h3 className="font-extrabold text-sm text-zinc-100">Avaliação Geral de Saúde Econômica</h3>
                    </div>
                    <div>
                      {diagnoseResult.financialHealth === 'Saudável' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-extrabold text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" /> Saúde Financeira: Saudável
                        </div>
                      )}
                      {diagnoseResult.financialHealth === 'Atenção' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-extrabold text-amber-500">
                          <AlertTriangle className="h-4 w-4" /> Saúde Financeira: Em Alerta
                        </div>
                      )}
                      {diagnoseResult.financialHealth === 'Crítico' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs font-extrabold text-rose-400">
                          <AlertCircle className="h-4 w-4" /> Saúde Financeira: Crítico
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-black text-white text-base leading-snug">
                      "{diagnoseResult.healthCheckTitle}"
                    </h4>
                    <p className="text-zinc-300 text-xs leading-relaxed font-medium">
                      {diagnoseResult.summary}
                    </p>
                  </div>
                </div>

                {/* Primary 4 Card Grid for High Impact Presentation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {['faturamento', 'receita_liquida', 'ebitda', 'resultado_liquido'].map(key => {
                    const compMeta = comparisonIndicators.find(c => c.key === key);
                    if (!compMeta) return null;
                    const meta = KPI_METADATA[key];
                    
                    return (
                      <div key={key} className="p-5 bg-[#121214] border border-zinc-800 rounded-xl flex flex-col justify-between space-y-3 shadow-md">
                        <div className="flex items-center justify-between border-b border-zinc-800/30 pb-1.5">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none shrink-0">{meta.label}</span>
                          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                        </div>
                        <div>
                          <h5 className="text-base sm:text-md md:text-lg font-extrabold md:font-black text-white font-mono leading-snug tracking-tight break-all mt-1">
                            {formatValue(compMeta.currentVal, key)}
                          </h5>
                          {compMeta.deltaPrev !== null && (
                            <div className="flex items-center gap-1 text-[10px] mt-1 text-zinc-400">
                              {compMeta.deltaPrev >= 0 ? (
                                <span className="font-extrabold text-emerald-400">▲ +{compMeta.deltaPrev.toFixed(1)}%</span>
                              ) : (
                                <span className="font-extrabold text-rose-400">▼ {compMeta.deltaPrev.toFixed(1)}%</span>
                              )}
                              <span>vs mês anterior</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGE 1 GRAPH: Chronological Evolution of Key CFO metrics */}
                {presentationChartData.length > 0 && (
                  <div className="p-5 bg-zinc-950 border border-zinc-805/80 rounded-2xl space-y-4 mt-6 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/40 pb-2.5 gap-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
                        <h4 className="font-extrabold text-xs text-zinc-100 tracking-wide uppercase">Tendência de Desempenho (Últimos 6 Meses)</h4>
                      </div>
                      <span className="text-[10px] text-zinc-400">Evolução do Faturamento, Receita, EBITDA e Lucro</span>
                    </div>
                    <div className="h-80 w-full pr-4 text-zinc-300">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={presentationChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" strokeOpacity={0.4} vertical={false} />
                          <XAxis 
                            dataKey="monthId" 
                            stroke="#71717a" 
                            fontSize={11}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#71717a" 
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#09090b', 
                              borderColor: '#27272a',
                              color: '#ffffff',
                              borderRadius: '8px',
                              fontSize: '11px'
                            }}
                            formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                          <Line 
                            type="monotone" 
                            dataKey="Faturamento" 
                            name="Faturamento"
                            stroke="#10b981" 
                            strokeWidth={3} 
                            dot={{ r: 4, strokeWidth: 2 }} 
                            activeDot={{ r: 6 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Receita Líquida" 
                            name="Receita Líquida"
                            stroke="#0ea5e9" 
                            strokeWidth={2.5} 
                            dot={{ r: 3 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="EBITDA" 
                            name="EBITDA"
                            stroke="#f59e0b" 
                            strokeWidth={2.5} 
                            dot={{ r: 3 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Resultado Líquido" 
                            name="Resultado Líquido"
                            stroke="#f43f5e" 
                            strokeWidth={3} 
                            strokeDasharray="4 4"
                            dot={{ r: 4 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* PAGE 2: Diagnóstico Detalhado & Recomendações */}
              <div id="cfo-report-page-2" className="print-page-break space-y-8 bg-[#09090b] text-zinc-100 p-6 md:p-8 rounded-2xl border border-zinc-800/80 shadow-2xl mt-8">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Activity className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-black text-sm text-white tracking-tight uppercase">Diagnóstico Analítico do CFO (RODER IA)</h3>
                </div>

                {/* Forces & Weaknesses columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Positive Points */}
                  <div className="p-6 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl space-y-4 shadow-sm">
                    <h4 className="font-extrabold text-xs text-emerald-400 tracking-wider flex items-center gap-1.5 uppercase border-b border-emerald-500/10 pb-2">
                      <Check className="h-4 w-4" /> Pontos Fortes e Alavancas
                    </h4>
                    <div className="space-y-3.5">
                      {diagnoseResult.strengths.map((item: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" /> {item.title}
                          </h5>
                          <p className="text-zinc-400 text-[11px] leading-relaxed pl-3 font-medium">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risks Alert Points */}
                  <div className="p-6 bg-rose-950/20 border border-rose-500/20 rounded-2xl space-y-4 shadow-sm">
                    <h4 className="font-extrabold text-xs text-rose-400 tracking-wider flex items-center gap-1.5 uppercase border-b border-rose-500/10 pb-2">
                      <AlertCircle className="h-4 w-4" /> Pontos de Atenção e Alertas
                    </h4>
                    <div className="space-y-3.5">
                      {diagnoseResult.alerts.map((item: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" /> {item.title}
                          </h5>
                          <p className="text-zinc-400 text-[11px] leading-relaxed pl-3 font-medium">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Strategic Roadmap Recommendations */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 border-b border-zinc-800/50 pb-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <h4 className="font-extrabold text-xs text-zinc-100 tracking-wide uppercase">Plano Estratégico & Sugestões de Ação Continuada</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {diagnoseResult.suggestions.map((item: any, idx: number) => (
                      <div key={idx} className="p-5 bg-[#121214] border border-zinc-800 rounded-xl space-y-2.5 flex flex-col justify-between shadow-md">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black tracking-widest text-emerald-500 uppercase">Sugestão #{idx+1}</span>
                          <h5 className="font-bold text-white text-xs">{item.action}</h5>
                        </div>
                        <p className="text-zinc-400 text-[11px] leading-relaxed border-t border-zinc-800 pt-1.5 mt-1 font-medium">
                          <strong className="text-emerald-400">Impacto Esperado:</strong> {item.impact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAGE 3: Tabela Comparativa Completa */}
              <div id="cfo-report-page-3" className="print-page-break space-y-6 bg-[#09090b] text-zinc-100 p-6 md:p-8 rounded-2xl border border-zinc-800/80 shadow-2xl mt-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-black text-sm text-white tracking-tight uppercase">Histórico Comparativo e Tendências</h3>
                  </div>
                  <p className="text-[10px] text-zinc-400">Comparações automáticas vs período anterior e base homóloga anterior</p>
                </div>

                <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-extrabold">
                        <th className="p-3">Indicador Financeiro / Fiscal</th>
                        <th className="p-3 text-right">Fechamento: {selectedMonth}</th>
                        <th className="p-3 text-right">Mês Anterior</th>
                        <th className="p-3 text-right">Ano Anterior</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {comparisonIndicators.map((row) => (
                        <tr key={row.key} className="hover:bg-zinc-900/20 transition-colors">
                          <td className="p-3 font-semibold text-zinc-100 flex items-center justify-between gap-2">
                            <span>{row.label}</span>
                            <span className="text-[9px] font-mono px-1 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 shrink-0">
                              {row.suffix}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold font-mono text-zinc-200">
                            {formatValue(row.currentVal, row.key)}
                          </td>
                          {/* Previous Month Compare */}
                          <td className="p-3 text-right font-mono">
                            <div className="flex flex-col items-end">
                              <span className="text-zinc-300 font-medium">{formatValue(row.prevVal, row.key)}</span>
                              {row.deltaPrev !== null ? (
                                <span className={`text-[10px] font-extrabold ${row.deltaPrev >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {row.deltaPrev >= 0 ? '▲ +' : '▼ '}{row.deltaPrev.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-500">-</span>
                              )}
                            </div>
                          </td>
                          {/* Year over Year Compare */}
                          <td className="p-3 text-right font-mono">
                            <div className="flex flex-col items-end">
                              <span className="text-zinc-300 font-medium">{formatValue(row.prevYearVal, row.key)}</span>
                              {row.deltaYear !== null ? (
                                <span className={`text-[10px] font-extrabold ${row.deltaYear >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {row.deltaYear >= 0 ? '▲ +' : '▼ '}{row.deltaYear.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-500">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-zinc-900/25 border border-zinc-800 rounded-xl">
                  <p className="text-[10px] text-zinc-400 leading-normal font-medium">
                    <strong className="text-emerald-400 font-black">Nota Metodológica:</strong> As variações percentuais são computadas de forma linear e em módulos absolutos para evitar erros de inversão de sinais em transações de saídas ou margens monetárias deficitárias consolidadas.
                  </p>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
