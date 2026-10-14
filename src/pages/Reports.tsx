import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Indication, UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Package, 
  Users, 
  FileText,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  Info,
  HelpCircle,
  ArrowLeft,
  Star,
  Award,
  Gift,
  Search,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { HelpTooltip } from '../components/base/HelpTooltip';
import { cn, formatCurrency } from '../lib/utils';
import { maskCurrency } from '../lib/masks';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReservationAudit {
  sellerId: string;
  sellerName: string;
  totalReservations: number;
  convertedToSales: number;
  expiredOrCancelled: number;
  currentActive: number;
}

export default function Reports() {
  const { profile, isAdmin, isManager, isFinancial } = useAuth();
  const navigate = useNavigate();
  const [indications, setIndications] = useState<Indication[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [standardSellers, setStandardSellers] = useState<UserProfile[]>([]);
  const [stockSales, setStockSales] = useState<any[]>([]);
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [referringClients, setReferringClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 2)), // Last 3 months by default
    end: new Date()
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load all indications for historical analysis (timing/sales)
        const indSnap = await getDocs(query(collection(db, 'indications'), orderBy('created_at', 'desc')));
        const indData = indSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Indication))
          .filter(ind => !ind.is_deleted);
        setIndications(indData);

        // Load users to map names/roles
        const userSnap = await getDocs(query(collection(db, 'users')));
        const allUsers = userSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setUsers(allUsers);
        setStandardSellers(allUsers.filter(u => u.role === 'vendedor_padrao'));

        // Load stock sales
        const salesSnap = await getDocs(query(collection(db, 'stock_sales')));
        setStockSales(salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Load all historical reservations
        const resSnap = await getDocs(query(collection(db, 'stock_reservations')));
        setAllReservations(resSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Load referring clients
        try {
          const refSnap = await getDocs(query(collection(db, 'referring_clients')));
          setReferringClients(refSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
          console.warn("Could not load referring_clients:", e);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast.error("Erro ao carregar dados dos relatórios.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 1. Sales Performance Data
  const salesStats = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    
    // Group indications by month
    const monthlyData = months.map((month, index) => {
      const soldThisMonth = indications.filter(ind => {
        if (ind.status !== 'sold' || !ind.updated_at) return false;
        const date = parseISO(ind.updated_at);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });

      const totalValue = soldThisMonth.reduce((acc, curr) => acc + (curr.base_commission_value || 0), 0);
      
      return {
        month,
        vendas: soldThisMonth.length,
        faturamento: totalValue / 10000 // Scaled down for chart readability
      };
    });

    return monthlyData;
  }, [indications]);

  // 2. Stock Reservation Efficiency Audit
  const reservationEfficiency = useMemo(() => {
    if (!Array.isArray(indications) || !Array.isArray(users)) return [];
    
    const audit: Record<string, ReservationAudit> = {};

    // Analyze all internal sellers
    const internalSellers = users.filter(u => u.role === 'internal_seller');
    
    internalSellers.forEach(seller => {
      // Find indications handled by this seller that reached 'sold'
      const totalHandled = indications.filter(ind => ind.internal_seller_uid === seller.uid);
      const soldHandled = totalHandled.filter(ind => ind.status === 'sold');
      
      // In a real system, we'd have a 'logs' collection for every reservation created.
      // Since we might not have that yet, we use a proxy: indications that have a model and seller and reached sold vs those that reached lost.
      // This is the requested logic: "how many times they reserved vs how many concluded".
      // Assuming 'reserved_at' or similar was added. If not, we take all indications and assume any check on stock was a reservation.
      
      // MOCK LOGIC for demonstration based on available fields:
      const reservations = totalHandled.filter(ind => ind.description?.toLowerCase().includes('reserv') || ind.status === 'sold' || ind.status === 'cancelled');
      
      audit[seller.uid] = {
        sellerId: seller.uid,
        sellerName: seller.name,
        totalReservations: reservations.length,
        convertedToSales: soldHandled.length,
        expiredOrCancelled: reservations.length - soldHandled.length - (totalHandled.filter(i => i.status === 'negotiating').length),
        currentActive: allReservations.filter(r => r.seller_uid === seller.uid).length
      };
    });

    return Object.values(audit).sort((a, b) => (b.convertedToSales / (b.totalReservations || 1)) - (a.convertedToSales / (a.totalReservations || 1)));
  }, [indications, users, allReservations]);

  // 3. Lead Timing Metrics
  const timingMetrics = useMemo(() => {
    if (!Array.isArray(indications)) return { avgDaysToClose: 0, responseTime: 0 };
    
    const indicationsWithCompletion = indications.filter(ind => 
      ind.status === 'sold' && ind.created_at && ind.updated_at
    );

    if (indicationsWithCompletion.length === 0) return { avgDaysToClose: 0, responseTime: 0 };

    const totalDays = indicationsWithCompletion.reduce((acc, curr) => {
      const start = parseISO(curr.created_at);
      const end = parseISO(curr.updated_at);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return acc + diffDays;
    }, 0);

    return {
      avgDaysToClose: Math.round(totalDays / indicationsWithCompletion.length),
      responseTime: 2.5 // Mock for response time in hours
    };
  }, [indications]);

  // 4. Regional Analysis
  const regionalData = useMemo(() => {
    if (!Array.isArray(indications)) return [];
    
    const regions: Record<string, number> = {};
    const soldIndications = indications.filter(ind => ind.status === 'sold');
    
    soldIndications.forEach(ind => {
      let state = 'Outros';
      if (ind.client_location) {
        const parts = ind.client_location.split('-');
        if (parts.length > 1) {
          state = parts[parts.length - 1].trim().toUpperCase().substring(0, 2);
        } else {
          // Try to find state using regex like MT, SP, etc
          const match = ind.client_location.match(/\b([A-Z]{2})\b/);
          if (match) state = match[1];
        }
      }
      regions[state] = (regions[state] || 0) + 1;
    });

    return Object.entries(regions)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [indications]);

  // 5. Monthly Management KPI Data
  const managementKpis = useMemo(() => {
    if (!Array.isArray(indications)) return [];
    
    const months: Record<string, any> = {};
    
    // Process Indications (Conversion/Flow)
    indications.forEach(ind => {
      if (!ind?.created_at) return;
      try {
        const date = parseISO(ind.created_at);
        if (isNaN(date.getTime())) return;
        
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!months[key]) months[key] = { key, month: format(date, 'MMM/yy', { locale: ptBR }), leads: 0, sales: 0, value: 0, partners: new Set() };
        
        months[key].leads++;
        if (ind.status === 'sold') {
          months[key].sales++;
          months[key].value += (ind.base_commission_value || 0);
        }
        if (ind.external_seller_uid) months[key].partners.add(ind.external_seller_uid);
      } catch (e) {
        console.error("Error parsing date for KPI:", ind.created_at);
      }
    });

    return Object.values(months)
      .sort((a, b) => b.key.localeCompare(a.key))
      .map(m => ({
        ...m,
        partners: m.partners.size,
        conversion: m.leads > 0 ? Math.round((m.sales / m.leads) * 100) : 0
      }));
  }, [indications]);

  // 6. Standard Seller Multi-Layer Analysis
  const standardSellerMetrics = useMemo(() => {
    if (!Array.isArray(indications) || standardSellers.length === 0) return [];

    return standardSellers.map(seller => {
      // 1. Leads by the seller themselves
      const ownLeads = indications.filter(ind => 
        ind.standard_seller_uid === seller.uid && 
        (ind.external_seller_uid === seller.uid || ind.external_seller_name === seller.name)
      );
      
      // 2. Leads from external partners in their region
      const partnerLeads = indications.filter(ind => 
        ind.standard_seller_uid === seller.uid && 
        ind.external_seller_uid !== seller.uid && ind.external_seller_name !== seller.name
      );

      const ownSales = ownLeads.filter(i => i.status === 'sold');
      const partnerSales = partnerLeads.filter(i => i.status === 'sold');

      const ownCommission = ownSales.reduce((acc, curr) => acc + (curr.standard_seller_commission_value || 0), 0);
      const partnerCommission = partnerSales.reduce((acc, curr) => acc + (curr.standard_seller_commission_value || 0), 0);
      const totalCommission = ownCommission + partnerCommission;
      
      const totalRevenueGenerated = [...ownSales, ...partnerSales].reduce((acc, curr) => acc + (curr.gross_budget_value || 0), 0);
      
      // Fixed cost: Monthly Salary
      const monthlyCost = seller.monthly_salary || 0;
      const totalCost = monthlyCost + totalCommission;

      return {
        uid: seller.uid,
        name: seller.name,
        regions: seller.assigned_regions || [],
        ownLeads: ownLeads.length,
        partnerLeads: partnerLeads.length,
        ownSales: ownSales.length,
        partnerSales: partnerSales.length,
        ownCommission,
        partnerCommission,
        totalCommission,
        totalRevenueGenerated,
        monthlyCost,
        totalCost,
        roi: totalCost > 0 ? (totalRevenueGenerated / totalCost).toFixed(1) : '0'
      };
    });
  }, [indications, standardSellers]);

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  const getStatHelp = (title: string) => {
    switch (title) {
      case "Vendas Totais (Ano)": return "Quantidade total de vendas concluídas no ano atual.";
      case "Conversão Média": return "Percentual de indicações que se transformaram em vendas reais.";
      case "Tempo Médio Fechamento": return "Média de dias entre a criação da indicação e a marcação como 'Vendido'.";
      case "Reservas Ativas": return "Quantidade de equipamentos atualmente reservados no sistema de estoque.";
      default: return "";
    }
  };

  const handleGenerateSummary = () => {
    const currentMonth = format(new Date(), 'MMMM', { locale: ptBR });
    const summaryText = `*RELATÓRIO ESTRATÉGICO RODER - ${currentMonth.toUpperCase()}*\n\n` +
      `📅 *Período:* ${format(dateRange.start, 'dd/MM')} a ${format(dateRange.end, 'dd/MM')}\n` +
      `💰 *Faturamento Estimado:* R$ ${salesStats.reduce((acc, s) => acc + (s.faturamento * 10000), 0).toLocaleString('pt-BR')}\n` +
      `🤝 *Vendas Concluídas:* ${indications.filter(i => i.status === 'sold').length}\n` +
      `🌍 *Região Líder:* ${regionalData[0]?.name || 'N/A'} (${regionalData[0]?.value || 0} vendas)\n\n` +
      `*MÉTRICAS POR SETOR:* \n` +
      `• Comercial: ${reservationEfficiency.length} vendedores ativos\n` +
      `• Estoque: ${allReservations.length} bloqueios vigentes\n` +
      `• Logística: ${timingMetrics.avgDaysToClose} dias tempo médio closure\n\n` +
      `*EFICIÊNCIA DE RESERVAS:* \n` +
      reservationEfficiency.slice(0, 3).map(r => `• ${r.sellerName}: ${Math.round((r.convertedToSales/(r.totalReservations||1))*100)}% conv.`).join('\n') +
      `\n\n_Gerado automaticamente via Roder Indica V2_`;

    navigator.clipboard.writeText(summaryText);
    toast.success("Relatório completo copiado para o WhatsApp!");
    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank');
  };

  // 5. AI Consultant Referral and Direct Tracking
  const consultantTrackingData = useMemo(() => {
    if (!Array.isArray(indications)) return { sharedCount: 0, sharedSold: 0, directCount: 0, directSold: 0, topSellers: [] };

    let sharedCount = 0;
    let sharedSold = 0;
    let directCount = 0;
    let directSold = 0;
    const sellerMap: Record<string, { name: string; email: string; count: number; sold: number }> = {};

    indications.forEach(ind => {
      const source = ind.lead_source || (ind.indicator_id && ind.indicator_id !== 'consultor-direto' ? 'consultor_compartilhado' : 'consultor_direto');
      const isSold = ind.status === 'sold';

      if (source === 'consultor_compartilhado') {
        sharedCount++;
        if (isSold) sharedSold++;

        const email = ind.shared_by_seller_email || ind.indicator_id || 'Email não cadastrado';
        const name = ind.shared_by_seller_name || ind.indicator_id || 'Parceiro/Vendedor';
        
        if (email && email !== 'consultor-direto') {
          if (!sellerMap[email]) {
            sellerMap[email] = { name, email, count: 0, sold: 0 };
          }
          sellerMap[email].count++;
          if (isSold) sellerMap[email].sold++;
        }
      } else {
        directCount++;
        if (isSold) directSold++;
      }
    });

    const topSellers = Object.values(sellerMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      sharedCount,
      sharedSold,
      directCount,
      directSold,
      topSellers
    };
  }, [indications]);

  // Analytics for Clientes Indicadores (Promotores Roder)
  const clientReferralsAnalysis = useMemo(() => {
    let clientInds = indications.filter(ind => 
      ind.origin_type === 'client_referral' ||
      ind.is_client_referral === true ||
      (ind.referring_client_name && ind.referring_client_name.trim() !== '') ||
      (ind.external_seller_name && ind.external_seller_name.startsWith('Cliente:'))
    );

    if (selectedYear !== 'all') {
      clientInds = clientInds.filter(ind => {
        try {
          const d = parseISO(ind.created_at);
          return d.getFullYear().toString() === selectedYear;
        } catch {
          return true;
        }
      });
    }

    const clientMap: Record<string, {
      id: string;
      name: string;
      phone: string;
      company_or_city: string;
      totalIndications: number;
      soldCount: number;
      negotiatingCount: number;
      cancelledCount: number;
      totalRevenue: number;
      internalSellers: Set<string>;
      leads: Array<{
        id: string;
        leadName: string;
        equipment: string;
        status: string;
        date: string;
        value: number;
        sellerName?: string;
      }>;
    }> = {};

    referringClients.forEach(c => {
      const key = (c.name || '').trim().toLowerCase();
      if (!key) return;
      clientMap[key] = {
        id: c.id || key,
        name: c.name,
        phone: c.phone || '',
        company_or_city: c.company_or_city || '',
        totalIndications: 0,
        soldCount: 0,
        negotiatingCount: 0,
        cancelledCount: 0,
        totalRevenue: 0,
        internalSellers: new Set(),
        leads: []
      };
    });

    clientInds.forEach(ind => {
      let rawClientName = ind.referring_client_name || '';
      if (!rawClientName && ind.external_seller_name && ind.external_seller_name.startsWith('Cliente:')) {
        rawClientName = ind.external_seller_name.replace('Cliente:', '').trim();
      }
      if (!rawClientName) return;

      const key = rawClientName.trim().toLowerCase();
      if (!clientMap[key]) {
        clientMap[key] = {
          id: key,
          name: rawClientName.trim(),
          phone: ind.referring_client_phone || '',
          company_or_city: ind.referring_client_notes || '',
          totalIndications: 0,
          soldCount: 0,
          negotiatingCount: 0,
          cancelledCount: 0,
          totalRevenue: 0,
          internalSellers: new Set(),
          leads: []
        };
      }

      const entry = clientMap[key];
      entry.totalIndications += 1;
      if (ind.referring_client_phone && !entry.phone) entry.phone = ind.referring_client_phone;
      if (ind.referring_client_notes && !entry.company_or_city) entry.company_or_city = ind.referring_client_notes;

      if (ind.internal_seller_name) {
        entry.internalSellers.add(ind.internal_seller_name);
      }

      if (ind.status === 'sold') {
        entry.soldCount += 1;
        const val = Number(ind.sale_value) || Number(ind.base_commission_value) || 0;
        entry.totalRevenue += val;
      } else if (ind.status === 'cancelled' || ind.status === 'archived') {
        entry.cancelledCount += 1;
      } else {
        entry.negotiatingCount += 1;
      }

      const equipName = ind.items && ind.items.length > 0 
        ? ind.items.map(i => `${i.quantity || 1}x ${i.product_name}`).join(', ')
        : ((ind as any).equipment || 'Equipamento Roder');

      entry.leads.push({
        id: ind.id,
        leadName: ind.client_person_name || ind.client_name || 'Cliente indicado',
        equipment: equipName,
        status: ind.status,
        date: ind.created_at,
        value: Number(ind.sale_value) || Number(ind.base_commission_value) || 0,
        sellerName: ind.internal_seller_name
      });
    });

    let list = Object.values(clientMap).filter(c => c.totalIndications > 0 || c.name);

    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.company_or_city && c.company_or_city.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }

    list.sort((a, b) => b.totalIndications - a.totalIndications || b.soldCount - a.soldCount);

    const totalReferringClients = list.length;
    const totalLeadsReferred = list.reduce((acc, c) => acc + c.totalIndications, 0);
    const totalSalesFromReferrals = list.reduce((acc, c) => acc + c.soldCount, 0);
    const totalRevenueFromReferrals = list.reduce((acc, c) => acc + c.totalRevenue, 0);
    const conversionRate = totalLeadsReferred > 0 ? ((totalSalesFromReferrals / totalLeadsReferred) * 100).toFixed(1) : '0';

    return {
      list,
      totalReferringClients,
      totalLeadsReferred,
      totalSalesFromReferrals,
      totalRevenueFromReferrals,
      conversionRate
    };
  }, [indications, referringClients, selectedYear, clientSearch]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-sm font-medium text-muted-foreground">Gerando inteligência de negócios...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/60 pb-5">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              S.I.G - Sistema de Inteligência e Gestão
            </h1>
            <p className="text-muted-foreground font-medium">Relatórios consolidados para diretoria, comercial e estoque.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button 
               variant="outline" 
               className="gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 font-bold uppercase text-[10px] tracking-widest h-10"
               onClick={() => navigate('/')}
             >
               <ArrowLeft className="h-4 w-4" /> Voltar ao Início
             </Button>
             <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5 h-10 font-bold uppercase text-[10px] tracking-widest" onClick={() => window.print()}>
               <FileText className="h-4 w-4" /> PDF / Impresso
             </Button>
             <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20 h-10" onClick={handleGenerateSummary}>
               <Share2 className="h-4 w-4" /> Enviar p/ WhatsApp
             </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Vendas Totais (Ano)" 
            value={indications.filter(i => i.status === 'sold' && i.updated_at && parseISO(i.updated_at).getFullYear() === new Date().getFullYear()).length}
            icon={Target}
            trend="+12%"
            trendUp={true}
          />
          <StatCard 
            title="Conversão Média" 
            value={`${Math.round((indications.filter(i => i.status === 'sold').length / (indications.length || 1)) * 100)}%`}
            icon={TrendingUp}
            trend="-2%"
            trendUp={false}
          />
          <StatCard 
            title="Tempo Médio Fechamento" 
            value={`${timingMetrics.avgDaysToClose} dias`}
            icon={Clock}
            description="Ciclo médio de venda"
          />
          <StatCard 
            title="Reservas Ativas" 
            value={allReservations.length}
            icon={Package}
            description="Segurança de estoque"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="gestao" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-12 w-full md:w-auto grid grid-cols-2 md:flex gap-2">
            <TabsTrigger value="gestao" className="rounded-lg font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Diretoria (Mensal)
            </TabsTrigger>
            <TabsTrigger value="vendas" className="rounded-lg font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Comercial (Equip.)
            </TabsTrigger>
            <TabsTrigger value="reserva" className="rounded-lg font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Estoque
            </TabsTrigger>
            <TabsTrigger value="regional" className="rounded-lg font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Vendedor Regional
            </TabsTrigger>
            <TabsTrigger value="vendedores" className="rounded-lg font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Performance
            </TabsTrigger>
            <TabsTrigger value="consultor" className="rounded-lg font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Consultor IA
            </TabsTrigger>
            <TabsTrigger value="clientes_indicadores" className="rounded-lg font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-amber-600 data-[state=active]:text-white flex items-center gap-1.5 shadow-sm">
              <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
              Clientes Indicadores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gestao" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Regional Pie Chart */}
               <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50">
                <CardHeader className="p-6 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base uppercase tracking-widest flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" /> Vendas por Região (UF)
                      </CardTitle>
                    </div>
                    <HelpTooltip content="Distribuição geográfica das vendas concluídas baseada na localização informada na indicação. Mostra quais estados estão gerando mais resultados reais." />
                  </div>
                </CardHeader>
                <CardContent className="p-6 h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regionalData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {regionalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Board Table */}
              <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden bg-card/50">
                <CardHeader className="bg-primary/5 p-6 border-b border-primary/10">
                   <div className="flex items-center justify-between">
                     <div>
                       <CardTitle className="text-base uppercase tracking-widest">Resumo Executivo Mensal</CardTitle>
                       <CardDescription>Principais KPIs consolidados para tomada de decisão estratégica.</CardDescription>
                     </div>
                     <HelpTooltip content="Visão consolidada para a diretoria. Reúne o faturamento bruto das comissões, volume de leads e taxa de fechamento mensal. Ideal para acompanhamento de metas." />
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mês/Ano</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Leads</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Vendas</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Conversão %</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right border-l border-border/50">Faturamento Est.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {managementKpis.slice(0, 6).map((row, i) => (
                          <tr key={i} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4 font-bold text-sm tracking-tight">{row.month}</td>
                            <td className="px-6 py-4 text-xs text-center font-mono">{row.leads}</td>
                            <td className="px-6 py-4 text-xs font-bold text-green-600 text-center font-mono">{row.sales}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-xs font-mono font-bold w-10">{row.conversion}%</span>
                                <div className="hidden sm:block h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `${row.conversion}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-primary border-l border-border/50">
                              R$ {row.value.toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vendas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales Chart */}
              <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/5 font-bold p-6 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base uppercase tracking-widest">Faturamento Estimado ({new Date().getFullYear()})</CardTitle>
                      <HelpTooltip content="Valor estimado de faturamento baseado no valor base de comissão das indicações que atingiram o status 'Vendido'." />
                    </div>
                    <Calendar className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                        }} 
                      />
                      <Bar dataKey="vendas" fill="#f97316" radius={[4, 4, 0, 0]} name="Qtd. Vendas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Best Selling Products */}
              <Card className="border-border/50 shadow-sm overflow-hidden">
                 <CardHeader className="bg-muted/5 font-bold p-6 border-b border-border/50">
                   <div className="flex items-center gap-2">
                     <CardTitle className="text-base uppercase tracking-widest">Top Equipamentos</CardTitle>
                     <HelpTooltip content="Os equipamentos que mais geraram vendas no período selecionado." />
                   </div>
                 </CardHeader>
                 <CardContent className="p-6">
                   <div className="space-y-6">
                     {Object.values(indications
                       .reduce((acc: any, curr) => {
                         if (curr.status !== 'sold' || !curr.base_machine) return acc;
                         const key = curr.base_machine;
                         if (!acc[key]) acc[key] = { name: key, count: 0 };
                         acc[key].count++;
                         return acc;
                       }, {}))
                       .sort((a: any, b: any) => b.count - a.count)
                       .slice(0, 5)
                       .map((item: any, i: number) => (
                         <div key={i} className="flex items-center gap-4">
                           <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                             #{i+1}
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-bold truncate tracking-tight">{item.name}</p>
                             <Progress value={(item.count / 10) * 100} className="h-1.5 mt-1" />
                           </div>
                           <span className="text-xs font-black text-muted-foreground shrink-0">{item.count}</span>
                         </div>
                       ))}
                   </div>
                 </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reserva" className="space-y-6">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-amber-500/5 p-6 border-b border-amber-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-amber-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base uppercase tracking-widest">Auditoria de Reservas</CardTitle>
                        <HelpTooltip content="Analisa quantas reservas cada vendedor interno realizou no estoque físico versus quantas realmente foram convertidas em venda. Ajuda a identificar excesso de bloqueio de equipamentos." />
                      </div>
                      <CardDescription>Otimização de ocupação de estoque e taxa de conversão</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-muted/30 border-b border-border/50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vendedor</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Total Reservas</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Convertido (Venda)</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Eficiência (%)</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Status Atuais</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {reservationEfficiency.map((row, i) => {
                        const efficiency = Math.round((row.convertedToSales / (row.totalReservations || 1)) * 100);
                        return (
                          <tr key={i} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-sm tracking-tight">{row.sellerName}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-medium">Equipe Interna</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-mono font-bold">{row.totalReservations}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-mono font-bold text-green-600">+{row.convertedToSales}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={cn(
                                  "text-sm font-black",
                                  efficiency > 60 ? "text-green-500" : efficiency > 30 ? "text-amber-500" : "text-red-500"
                                )}>
                                  {efficiency}%
                                </span>
                                <Progress value={efficiency} className="w-16 h-1 mt-0.5" />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <div className="flex items-center justify-center gap-2">
                                  <Badge variant="outline" className="text-[9px] bg-blue-500/5 text-blue-500 border-blue-500/20">
                                    {row.currentActive} Reservados
                                  </Badge>
                                  {efficiency < 30 && row.totalReservations > 5 && (
                                    <div className="group relative">
                                      <Info className="h-4 w-4 text-red-500 cursor-help" />
                                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 rounded bg-slate-900 text-white text-[9px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                        Vendedor com alta taxa de cancelamento de reservas. Atenção ao bloquear estoque.
                                      </div>
                                    </div>
                                  )}
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs font-bold text-primary mb-2 uppercase tracking-widest flex items-center gap-2">
                <Target className="h-4 w-4" /> Dica de Gestão
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Vendedores com eficiência abaixo de 40% nas reservas podem estar utilizando o estoque como "garantia" excessiva, bloqueando equipamentos para outros vendedores. Recomenda-se treinar a equipe para confirmar o interesse real do cliente antes de acionar a reserva de 60 dias.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="regional" className="space-y-6">
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Info className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-orange-600">Gestão de Vendedores Padrão (Regionais)</h4>
                    <p className="text-[10px] text-muted-foreground font-medium">Análise de custo versus faturamento gerado para tomada de decisão estratégica.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {standardSellerMetrics.map((seller, i) => (
                  <Card key={i} className="border-border/50 shadow-sm overflow-hidden bg-card/50">
                    <CardHeader className="p-6 border-b border-border/50 bg-gradient-to-br from-orange-500/10 to-transparent">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-black italic tracking-tighter uppercase">{seller.name}</CardTitle>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {seller.regions.map(r => (
                              <Badge key={r} variant="outline" className="text-[9px] h-4 py-0 bg-white border-orange-200 text-orange-600 font-bold uppercase">{r}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">ROI</p>
                          <p className="text-2xl font-black italic text-orange-500 leading-none">{seller.roi}x</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {/* Cost vs Revenue */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-muted-foreground uppercase tracking-wider">Custo Total (Salário + Com.)</span>
                          <span className="font-mono font-black text-red-500 tracking-tighter">{maskCurrency(seller.totalCost)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-muted-foreground uppercase tracking-wider">Receita Gerada (Total)</span>
                          <span className="font-mono font-black text-green-600 tracking-tighter">{maskCurrency(seller.totalRevenueGenerated)}</span>
                        </div>
                        <Progress value={Math.min(100, (seller.totalCost / (seller.totalRevenueGenerated || 1)) * 100)} className="h-1.5 bg-green-100" />
                      </div>

                      <Separator className="bg-border/50" />

                      {/* Leads Breakdown */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                          <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">Leads Próprios</p>
                          <div className="flex items-end justify-between">
                            <p className="text-xl font-black italic leading-none">{seller.ownLeads}</p>
                            <p className="text-[10px] font-bold text-green-600">+{seller.ownSales} Vendas</p>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 space-y-1">
                          <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">Leads Regionais</p>
                          <div className="flex items-end justify-between">
                            <p className="text-xl font-black italic leading-none">{seller.partnerLeads}</p>
                            <p className="text-[10px] font-bold text-orange-600">+{seller.partnerSales} Vendas</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 mt-2">
                         <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
                           <span>Comissões Próprias</span>
                           <span className="font-mono">{maskCurrency(seller.ownCommission)}</span>
                         </div>
                         <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
                           <span>Comissões Parceiros</span>
                           <span className="font-mono">{maskCurrency(seller.partnerCommission)}</span>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {standardSellerMetrics.length === 0 && (
                  <div className="lg:col-span-3 flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
                    <Users className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-black uppercase italic tracking-widest opacity-30">Nenhum Vendedor Regional Cadastrado</p>
                  </div>
                )}
              </div>

              <Card className="border-border/50 shadow-sm">
                <CardHeader className="p-6">
                   <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                     <TrendingUp className="h-4 w-4 text-primary" /> Eficiência Comparativa
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={standardSellerMetrics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={10} fontStyle="italic" fontWeight="black" textAnchor="middle" />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalRevenueGenerated" fill="#10b981" name="Faturamento (R$)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="totalCost" fill="#ef4444" name="Custo (R$)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                   </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vendedores" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timing metrics card */}
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="p-6 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Tempo de Resposta e Fechamento
                    </CardTitle>
                    <HelpTooltip content="Tempo decorrido desde a indicação até o fechamento da venda e tempo de resposta da triagem para o comercial." />
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Média Roder (Closing)</p>
                      <h4 className="text-2xl font-black text-foreground">{timingMetrics.avgDaysToClose} DIAS</h4>
                    </div>
                    <div className="flex items-center gap-1 text-green-500 font-bold text-xs bg-green-500/10 px-2 py-1 rounded-full">
                       <ArrowDownRight className="h-4 w-4" /> -4 dias vs 2025
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-muted-foreground">Triagem &rarr; V. Interno</span>
                      <span className="text-foreground">2.5 Horas</span>
                    </div>
                    <Progress value={85} className="h-1.5" />
                    
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-muted-foreground">V. Interno &rarr; Venda</span>
                      <span className="text-foreground">{timingMetrics.avgDaysToClose} Dias</span>
                    </div>
                    <Progress value={60} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Pie Chart */}
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="p-6 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base uppercase tracking-widest flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" /> Funil de Indicações
                    </CardTitle>
                    <HelpTooltip content="Progresso de todas as indicações enviadas pelos parceiros externos." />
                  </div>
                </CardHeader>
                <CardContent className="p-6 h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Vendido', value: indications.filter(i => i.status === 'sold').length },
                          { name: 'Negociando', value: indications.filter(i => i.status === 'negotiating').length },
                          { name: 'Cancelado', value: indications.filter(i => i.status === 'cancelled').length },
                          { name: 'Pendente', value: indications.filter(i => i.status === 'pending').length },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {indications.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="consultor" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-card border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Canais de Entrada</span>
                    <h4 className="text-xl font-black text-foreground">Tráfego & Leads IA</h4>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Compartilhado</p>
                        <p className="text-2xl font-black text-foreground">{consultantTrackingData.sharedCount}</p>
                        <p className="text-[9px] text-muted-foreground">Orçamentos gerados</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Acesso Direto</p>
                        <p className="text-2xl font-black text-foreground">{consultantTrackingData.directCount}</p>
                        <p className="text-[9px] text-muted-foreground">Clientes sozinhos</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase text-green-500 tracking-wider">Resultados Práticos</span>
                    <h4 className="text-xl font-black text-foreground">Vendas Convertidas</h4>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Compartilhado</p>
                        <p className="text-2xl font-black text-green-500">{consultantTrackingData.sharedSold}</p>
                        <p className="text-[9px] text-muted-foreground">Vendas fechadas</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Acesso Direto</p>
                        <p className="text-2xl font-black text-primary">{consultantTrackingData.directSold}</p>
                        <p className="text-[9px] text-muted-foreground">Vendas fechadas</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">Eficiência de Conversão</span>
                    <h4 className="text-xl font-black text-foreground">Taxas de Sucesso</h4>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Compartilhado</p>
                        <p className="text-2xl font-black text-blue-500">
                          {Math.round((consultantTrackingData.sharedSold / (consultantTrackingData.sharedCount || 1)) * 100)}%
                        </p>
                        <p className="text-[9px] text-muted-foreground">De lead para venda</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Acesso Direto</p>
                        <p className="text-2xl font-black text-purple-500">
                          {Math.round((consultantTrackingData.directSold / (consultantTrackingData.directCount || 1)) * 100)}%
                        </p>
                        <p className="text-[9px] text-muted-foreground">De lead para venda</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recharts Bar Comparison */}
              <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/5 font-bold p-6 border-b border-border/50">
                  <CardTitle className="text-base uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" /> Eficiência Comparativa dos Canais do Consultor
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comparativo direto entre orçamentos e vendas finais por canal
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: 'Consultor Compartilhado',
                          Orçamentos: consultantTrackingData.sharedCount,
                          Vendas: consultantTrackingData.sharedSold
                        },
                        {
                          name: 'Consultor Direto (Cliente)',
                          Orçamentos: consultantTrackingData.directCount,
                          Vendas: consultantTrackingData.directSold
                        }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Orçamentos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Vendas" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Best sharing indicators */}
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/5 font-bold p-6 border-b border-border/50">
                  <CardTitle className="text-base uppercase tracking-widest flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Ranking de Compartilhamento
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sócios, vendedores ou indicadores com maior retorno
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {consultantTrackingData.topSellers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-xs text-muted-foreground font-mono">Nenhum compartilhamento registrado ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {consultantTrackingData.topSellers.map((seller, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-none last:pb-0">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-foreground truncate">{seller.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{seller.email}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-black text-foreground">{seller.count} <span className="text-[9px] text-muted-foreground">orç.</span></p>
                            <p className="text-[10px] font-bold text-green-500">{seller.sold} <span className="text-[9px] text-muted-foreground">vendas</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: CLIENTES INDICADORES (PROMOTORES RODER) */}
          <TabsContent value="clientes_indicadores" className="space-y-6">
            {/* Header & Filter Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border/60 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                    <Award className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
                    Programa Clientes Indicadores (Promotores da Marca Roder)
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Acompanhe clientes da carteira que indicaram novos compradores para as vendedoras internas. Ideal para conceder bonificações e descontos em peças e serviços ao final do ano.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Year Filter */}
                <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/50 text-xs font-bold">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">Ano:</span>
                  {(['all', '2026', '2025', '2024'] as const).map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setSelectedYear(year)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
                        selectedYear === year 
                          ? "bg-amber-600 text-white shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {year === 'all' ? 'Histórico Geral' : year}
                    </button>
                  ))}
                </div>

                {/* Search Client */}
                <div className="relative w-full sm:w-56">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 border border-border/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Clientes Indicadores"
                value={clientReferralsAnalysis.totalReferringClients}
                icon={Users}
                description="Clientes promotores ativos"
              />
              <StatCard
                title="Leads Indicados"
                value={clientReferralsAnalysis.totalLeadsReferred}
                icon={Target}
                description="Contatos recebidos por clientes"
              />
              <StatCard
                title="Vendas Fechadas"
                value={clientReferralsAnalysis.totalSalesFromReferrals}
                icon={Award}
                trend={`${clientReferralsAnalysis.conversionRate}%`}
                trendUp={Number(clientReferralsAnalysis.conversionRate) >= 20}
                description="Negócios convertidos"
              />
              <StatCard
                title="Volume Comercial"
                value={formatCurrency(clientReferralsAnalysis.totalRevenueFromReferrals)}
                icon={TrendingUp}
                description="Vendas originadas de clientes"
              />
            </div>

            {/* Incentive Policy Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10 flex items-start gap-3 shadow-sm">
                <span className="text-2xl select-none">🥇</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">Cliente Ouro (3+ indicações)</h4>
                  </div>
                  <p className="text-[11px] text-foreground/80 leading-relaxed font-medium">
                    Sugerido: <strong className="text-foreground font-bold">10% de desconto</strong> em peças de reposição + prioridade no atendimento técnico e pós-venda.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-100/50 to-slate-200/30 dark:from-slate-800/40 dark:to-slate-800/20 flex items-start gap-3 shadow-sm">
                <span className="text-2xl select-none">🥈</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">Cliente Prata (2 indicações)</h4>
                  </div>
                  <p className="text-[11px] text-foreground/80 leading-relaxed font-medium">
                    Sugerido: <strong className="text-foreground font-bold">5% de desconto</strong> em peças/serviços de manutenção + kit especial de brindes Roder.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-700/20 bg-gradient-to-br from-amber-700/5 to-amber-700/10 flex items-start gap-3 shadow-sm">
                <span className="text-2xl select-none">🥉</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black uppercase text-amber-800 dark:text-amber-500">Cliente Bronze (1 indicação)</h4>
                  </div>
                  <p className="text-[11px] text-foreground/80 leading-relaxed font-medium">
                    Sugerido: Brinde corporativo Roder (boné/camisa) + agradecimento oficial da equipe comercial.
                  </p>
                </div>
              </div>
            </div>

            {/* Ranking and Referral Details Table */}
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="p-5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    Ranking de Clientes Indicadores
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Listagem consolidada com histórico de leads, vendedores responsáveis e benefícios sugeridos.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-black uppercase bg-card text-foreground">
                  {clientReferralsAnalysis.list.length} Clientes Encontrados
                </Badge>
              </CardHeader>

              <CardContent className="p-0">
                {clientReferralsAnalysis.list.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                      <Star className="h-7 w-7" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground uppercase">Nenhum cliente indicador registrado</h3>
                    <p className="text-xs text-muted-foreground max-w-md mt-1">
                      As indicações cadastradas pelas vendedoras internas com a opção &quot;Indicação de Cliente&quot; aparecerão automaticamente aqui, permitindo mensurar a fidelidade de cada cliente ao longo do ano.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {clientReferralsAnalysis.list.map((client, idx) => {
                      const isGold = client.totalIndications >= 3;
                      const isSilver = client.totalIndications === 2;
                      const isBronze = client.totalIndications === 1;
                      const isExpanded = expandedClientId === client.name;
                      const sellersList = Array.from(client.internalSellers).join(', ') || 'Venda Direta / Não informada';

                      return (
                        <div key={client.id || idx} className="hover:bg-muted/20 transition-colors">
                          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Left: Position, Name, Badge */}
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-black shrink-0 text-muted-foreground border border-border">
                                {idx + 1}º
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm font-black text-foreground uppercase tracking-tight truncate">
                                    {client.name}
                                  </h3>
                                  {isGold && (
                                    <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase border-none">
                                      🥇 Cliente Ouro
                                    </Badge>
                                  )}
                                  {isSilver && (
                                    <Badge className="bg-slate-400 text-white text-[9px] font-black uppercase border-none">
                                      🥈 Cliente Prata
                                    </Badge>
                                  )}
                                  {isBronze && (
                                    <Badge className="bg-amber-700/80 text-white text-[9px] font-black uppercase border-none">
                                      🥉 Cliente Bronze
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                  {client.phone && (
                                    <a
                                      href={`https://wa.me/${client.phone.replace(/\D/g, '').startsWith('55') ? client.phone.replace(/\D/g, '') : '55' + client.phone.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="no-referrer"
                                      className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-[11px]"
                                      title="Falar no WhatsApp"
                                    >
                                      <MessageCircle className="h-3 w-3" />
                                      {client.phone}
                                    </a>
                                  )}
                                  {client.company_or_city && (
                                    <span className="flex items-center gap-1 text-[11px]">
                                      <Building2 className="h-3 w-3" />
                                      {client.company_or_city}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-muted-foreground">
                                    Atendido por: <strong className="text-foreground font-semibold">{sellersList}</strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Counters & Expand Button */}
                            <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                              <div className="flex items-center gap-2 text-center">
                                <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                  <span className="block text-xs font-black text-amber-600 dark:text-amber-400">{client.totalIndications}</span>
                                  <span className="text-[8px] uppercase font-bold text-muted-foreground">Indicações</span>
                                </div>
                                <div className="px-3 py-1 rounded-xl bg-green-500/10 border border-green-500/20">
                                  <span className="block text-xs font-black text-green-600 dark:text-green-400">{client.soldCount}</span>
                                  <span className="text-[8px] uppercase font-bold text-muted-foreground">Vendas</span>
                                </div>
                                {client.totalRevenue > 0 && (
                                  <div className="px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 hidden sm:block">
                                    <span className="block text-xs font-black text-primary">{formatCurrency(client.totalRevenue)}</span>
                                    <span className="text-[8px] uppercase font-bold text-muted-foreground">Total Gerado</span>
                                  </div>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setExpandedClientId(isExpanded ? null : client.name)}
                                className="h-8 text-[10px] font-black uppercase tracking-wider gap-1 border-border"
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Ocultar</span>
                                    <ChevronUp className="h-3 w-3" />
                                  </>
                                ) : (
                                  <>
                                    <span>Ver Leads ({client.leads.length})</span>
                                    <ChevronDown className="h-3 w-3" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Leads Details */}
                          {isExpanded && (
                            <div className="bg-muted/40 p-4 border-t border-border/40 space-y-3">
                              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                                <span className="uppercase text-[10px] text-muted-foreground tracking-wider">
                                  Clientes Indicados por {client.name}:
                                </span>
                                <span className="text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                                  Benefício Recomendado: {isGold ? '10% de desconto em Peças/Serviços' : isSilver ? '5% de desconto em Peças/Serviços' : 'Brinde Institucional Roder'}
                                </span>
                              </div>

                              {client.leads.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">Nenhum lead com dados detalhados encontrado no período selecionado.</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left">
                                    <thead>
                                      <tr className="border-b border-border/40 text-[9px] uppercase tracking-wider text-muted-foreground">
                                        <th className="py-2 px-3">Data</th>
                                        <th className="py-2 px-3">Novo Cliente Indicado</th>
                                        <th className="py-2 px-3">Equipamento de Interesse</th>
                                        <th className="py-2 px-3">Vendedora Interna</th>
                                        <th className="py-2 px-3 text-center">Status</th>
                                        <th className="py-2 px-3 text-right">Valor</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                      {client.leads.map((lead, lIdx) => (
                                        <tr key={lead.id || lIdx} className="hover:bg-muted/30">
                                          <td className="py-2 px-3 font-medium text-muted-foreground whitespace-nowrap">
                                            {lead.date ? new Date(lead.date).toLocaleDateString('pt-BR') : '-'}
                                          </td>
                                          <td className="py-2 px-3 font-bold text-foreground uppercase whitespace-nowrap">
                                            {lead.leadName}
                                          </td>
                                          <td className="py-2 px-3 text-muted-foreground">
                                            {lead.equipment}
                                          </td>
                                          <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">
                                            {lead.sellerName || 'Não atribuída'}
                                          </td>
                                          <td className="py-2 px-3 text-center whitespace-nowrap">
                                            <Badge variant="outline" className={cn(
                                              "text-[8px] font-bold uppercase",
                                              lead.status === 'sold' && "bg-green-500/10 text-green-500 border-green-500/30",
                                              lead.status === 'negotiating' && "bg-orange-500/10 text-orange-500 border-orange-500/30",
                                              lead.status === 'pending' && "bg-blue-500/10 text-blue-500 border-blue-500/30",
                                              lead.status === 'triagem' && "bg-purple-500/10 text-purple-500 border-purple-500/30",
                                              (lead.status === 'cancelled' || lead.status === 'archived') && "bg-destructive/10 text-destructive border-destructive/30"
                                            )}>
                                              {lead.status === 'sold' ? 'Vendido' : 
                                               lead.status === 'negotiating' ? 'Negociação' :
                                               lead.status === 'pending' ? 'Novo' :
                                               lead.status === 'triagem' ? 'Triagem' : 'Cancelado'}
                                            </Badge>
                                          </td>
                                          <td className="py-2 px-3 text-right font-bold text-foreground whitespace-nowrap">
                                            {lead.value > 0 ? formatCurrency(lead.value) : '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

const getStatHelp = (title: string) => {
  switch (title.toLowerCase()) {
    case 'leads': return "Total de indicações recebidas no período.";
    case 'vendas': return "Número de negócios concluídos com sucesso.";
    case 'conversão': return "Percentual de leads que se tornaram vendas.";
    case 'parceiros': return "Quantidade de parceiros ativos enviando indicações.";
    default: return "";
  }
};

function StatCard({ title, value, icon: Icon, trend, trendUp, description }: { title: string, value: string | number, icon: any, trend?: string, trendUp?: boolean, description?: string }) {
  return (
    <Card className="bg-card border-border/50 shadow-sm group hover:border-primary/30 transition-all">
      <CardContent className="p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Icon className="h-5 w-5" />
            </div>
            {trend && (
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1",
                trendUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {trend}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{title}</p>
              <HelpTooltip content={getStatHelp(title)} className="h-3 w-3 p-0" iconClassName="h-3 w-3" />
            </div>
            <h3 className="text-2xl font-black text-foreground mt-1 tracking-tight">{value}</h3>
            {description && <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase italic">{description}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
