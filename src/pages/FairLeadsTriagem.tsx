import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { 
  collection, 
  query, 
  onSnapshot, 
  updateDoc, 
  doc, 
  orderBy,
  where,
  getDocs,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FairLead, UserProfile, Fair } from '../types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '../components/ui/card';
import { 
  Search, 
  Filter, 
  Users, 
  MessageCircle, 
  UserCheck, 
  XCircle, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Loader2,
  Trash2,
  MoreVertical,
  Flame,
  Snowflake,
  Zap,
  Building2,
  Clock,
  ArrowUpRight,
  PhoneCall,
  MapPin,
  FileDown,
  Smartphone,
  Sparkles,
  Award,
  ArrowLeft,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, safeFormatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../components/ui/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function FairLeadsTriagem() {
  const { profile, isAdmin, isManager, isTriagem } = useAuth();
  const canManageLeads = isAdmin || isManager || isTriagem;
  const [leads, setLeads] = useState<FairLead[]>([]);
  const [fairs, setFairs] = useState<Fair[]>([]);
  const [sellers, setSellers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFairId, setSelectedFairId] = useState<string>('all');
  
  const [selectedLead, setSelectedLead] = useState<FairLead | null>(null);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [expandedFairId, setExpandedFairId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    company: '',
    city: '',
    state: '',
    observations: ''
  });

  const openEditModal = (lead: FairLead) => {
    setSelectedLead(lead);
    setEditFormData({
      name: lead.name || '',
      company: lead.company || '',
      city: lead.city || '',
      state: lead.state || '',
      observations: lead.observations || ''
    });
    setEditModalOpen(true);
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;

    try {
      await updateDoc(doc(db, 'fair_leads', selectedLead.id), {
        ...editFormData,
        updated_at: new Date().toISOString()
      });
      toast.success('Lead atualizado com sucesso!');
      setEditModalOpen(false);
      setSelectedLead(null);
    } catch (error) {
      toast.error('Erro ao atualizar lead.');
    }
  };

  useEffect(() => {
    // Load Leads
    const qLeads = query(collection(db, 'fair_leads'), orderBy('created_at', 'desc'));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FairLead)));
      setLoading(false);
    });

    // Load Fairs for filter
    const unsubFairs = onSnapshot(collection(db, 'fairs'), (snapshot) => {
      setFairs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fair)));
    });

    // Load Sellers for forwarding
    const loadSellers = async () => {
      const q = query(collection(db, 'users'), where('role', 'in', ['internal_seller', 'external_seller']));
      const snap = await getDocs(q);
      setSellers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    };
    loadSellers();

    return () => {
      unsubLeads();
      unsubFairs();
    };
  }, []);

  const handleForwardLead = async (seller: UserProfile) => {
    if (!selectedLead) return;
    
    try {
      const prevSellerUid = selectedLead.assigned_to_uid;
      const prevSellerName = selectedLead.assigned_to_name;

      await updateDoc(doc(db, 'fair_leads', selectedLead.id), {
        status: 'forwarded',
        assigned_to_uid: seller.uid,
        assigned_to_name: seller.name,
        updated_at: new Date().toISOString()
      });

      // Notify the NEW seller who received the lead
      await addDoc(collection(db, 'notifications'), {
        user_uid: seller.uid,
        title: prevSellerUid ? 'Lead de Feira Redistribuído' : 'Novo Lead de Feira',
        message: prevSellerUid 
          ? `O lead de feira "${selectedLead.name}" (que estava com ${prevSellerName}) foi redistribuído para você.`
          : `Você recebeu o lead "${selectedLead.name}" captado no evento. Entre em contato o mais rápido possível!`,
        type: 'success',
        read: false,
        link: '/minhas-indicacoes', 
        created_at: new Date().toISOString()
      });

      // Notify the PREVIOUS seller if it was a redistribution
      if (prevSellerUid && prevSellerUid !== seller.uid) {
        await addDoc(collection(db, 'notifications'), {
          user_uid: prevSellerUid,
          title: 'Lead de Feira Removido',
          message: `O lead de feira "${selectedLead.name}" foi redistribuído para ${seller.name} pela triagem.`,
          type: 'warning',
          read: false,
          link: '/minhas-indicacoes',
          created_at: new Date().toISOString()
        });
      }

      // Notify the original salesperson who captured it if they are an indicator (external seller)
      if (selectedLead.salesperson_uid && selectedLead.salesperson_uid !== 'anonymous') {
        await addDoc(collection(db, 'notifications'), {
          user_uid: selectedLead.salesperson_uid,
          title: 'Lead em Atendimento',
          message: `Seu lead "${selectedLead.name}" foi encaminhado para triagem e agora está sendo atendido por ${seller.name}.`,
          type: 'info',
          read: false,
          link: '/meus-leads-feira', // If exists
          created_at: new Date().toISOString()
        });
      }
      
      toast.success(`Lead encaminhado para ${seller.name}`);
      setForwardModalOpen(false);
      setSelectedLead(null);
    } catch (error) {
      toast.error('Erro ao encaminhar lead.');
    }
  };

  const handleUpdateStatus = async (leadId: string, status: FairLead['status']) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      await updateDoc(doc(db, 'fair_leads', leadId), { 
        status,
        updated_at: new Date().toISOString()
      });

      // Notify the original capture person if discarded
      if (status === 'discarded' && lead && lead.salesperson_uid && lead.salesperson_uid !== 'anonymous') {
        await addDoc(collection(db, 'notifications'), {
          user_uid: lead.salesperson_uid,
          title: 'Lead Arquivado',
          message: `O lead "${lead.name}" foi analisado pela triagem e arquivado/descartado no momento.`,
          type: 'warning',
          read: false,
          created_at: new Date().toISOString()
        });
      }

      toast.success('Status atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const generateLeadsReport = (targetLeads: FairLead[]) => {
    if (targetLeads.length === 0) {
      toast.error('Não há leads para gerar relatório.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const fairName = targetLeads.length > 0 && selectedFairId !== 'all' 
      ? fairs.find(f => f.id === selectedFairId)?.name?.toUpperCase() || 'EVENTO'
      : 'TRIAGEM DE LEADS - FEIRAS';

    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94); // Primary color
    doc.text(`PLANILHA DE LEADS - ${fairName}`, 14, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 27);
    
    const customers = targetLeads.filter(l => l.type === 'client' || !l.type);
    const partners = targetLeads.filter(l => l.type === 'partner');
    const suppliers = targetLeads.filter(l => l.type === 'supplier');

    doc.text(`Total de Clientes: ${customers.length} | Parceiros: ${partners.length} | Fornecedores: ${suppliers.length}`, 14, 32);

    let currentY = 38;

    const sections = [
      { title: '1. CLIENTES', data: customers, color: [34, 197, 94] as [number, number, number] },
      { title: '2. PARCEIROS', data: partners, color: [245, 158, 11] as [number, number, number] },
      { title: '3. FORNECEDORES', data: suppliers, color: [59, 130, 246] as [number, number, number] }
    ];

    sections.forEach((section) => {
      if (section.data.length > 0) {
        // Add Section Header
        doc.setFontSize(12);
        doc.setTextColor(section.color[0], section.color[1], section.color[2]);
        doc.text(section.title, 14, currentY);
        currentY += 5;

        const tableData = section.data.map(lead => [
          safeFormatDate(lead.created_at),
          `${lead.name}${lead.company ? '\n' + lead.company.toUpperCase() : ''}`,
          `${lead.phone || '-'}\n${lead.email || '-'}`,
          (lead.interest_products || []).join(', ') || 'Geral',
          lead.observations || '-',
          lead.salesperson_name || 'Anônimo',
          lead.ai_score === 'hot' ? 'QUENTE' : 'MORNO'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Data', 'Lead / Empresa', 'Contato', 'Produtos', 'Observações', 'Vendedor', 'Status']],
          body: tableData,
          theme: 'grid',
          headStyles: { 
            fillColor: section.color,
            fontSize: 8,
            halign: 'center',
            valign: 'middle'
          },
          styles: { 
            fontSize: 7,
            cellPadding: 1.5,
            overflow: 'linebreak'
          },
          columnStyles: {
            0: { cellWidth: 16 }, // Data
            1: { cellWidth: 32, fontStyle: 'bold' }, // Lead / Empresa
            2: { cellWidth: 26 }, // Contato
            3: { cellWidth: 22 }, // Produtos
            4: { cellWidth: 50 }, // Observações
            5: { cellWidth: 22 }, // Vendedor
            6: { cellWidth: 14, halign: 'center' }  // Status
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 6) {
              const val = data.cell.raw as string;
              if (val === 'QUENTE') {
                data.cell.styles.textColor = [220, 38, 38]; // Red-600
                data.cell.styles.fontStyle = 'bold';
              } else {
                data.cell.styles.textColor = [217, 119, 6]; // Amber-600
              }
            }
          }
        });

        // @ts-ignore - finalY is available in autoTable result
        currentY = doc.lastAutoTable.finalY + 10;

        // Check if we need a new page for the next section if space is tight
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
      }
    });

    const fileName = `leads_triagem_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast.success('Relatório de leads exportado com sucesso!');
  };

  const shareLeadsWhatsApp = () => {
    if (filteredLeads.length === 0) return;
    
    const fairText = selectedFairId !== 'all' ? fairs.find(f => f.id === selectedFairId)?.name : 'Leads de Feiras';
    let message = `*RELATÓRIO DE TRIAGEM - ${fairText}*\n\n`;
    message += `Total: ${filteredLeads.length} leads\n`;
    message += `-------------------\n\n`;
    
    filteredLeads.slice(0, 5).forEach(lead => {
      message += `📌 *${lead.name}* (${lead.company || 'Pessoa Física'})\n`;
      message += `📞 Fone: ${lead.phone}\n`;
      message += `🔥 Qualif: ${lead.ai_score === 'hot' ? 'QUENTE' : 'MORNO'}\n`;
      message += `👤 Captado por: ${lead.salesperson_name || 'Anônimo'}\n`;
      message += `-------------------\n`;
    });
    
    if (filteredLeads.length > 5) {
      message += `\n_Exibindo os primeiros 5 de ${filteredLeads.length} leads._`;
    }
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDeleteLead = async (leadId: string, name: string) => {
    if (!window.confirm(`TEM CERTEZA? Deseja excluir permanentemente o lead de "${name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'fair_leads', leadId));
      toast.success('Lead excluído permanentemente.');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead.');
    }
  };

  const leadsFilteredBySearchAndFair = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    const matchesFair = selectedFairId === 'all' || lead.fair_id === selectedFairId;
    return matchesSearch && matchesFair;
  });

  // Somente clientes devem chegar para a triagem da Luana (type === 'client' ou sem type)
  const filteredLeads = leadsFilteredBySearchAndFair.filter(lead => lead.type === 'client' || !lead.type);

  const getScoreIcon = (score: FairLead['ai_score']) => {
    switch (score) {
      case 'hot': return <Flame className="h-4 w-4 text-red-500" />;
      case 'warm': return <Zap className="h-4 w-4 text-amber-500" />;
      case 'cold': return <Snowflake className="h-4 w-4 text-blue-400" />;
      default: return <Clock className="h-4 w-4 text-slate-300" />;
    }
  };

  const getScoreLabel = (score: FairLead['ai_score']) => {
    switch (score) {
      case 'hot': return 'Quente';
      case 'warm': return 'Morno';
      case 'cold': return 'Frio';
      default: return 'Analizando...';
    }
  };

// Status of Triagem
const getStatusLabel = (status: FairLead['status']) => {
  switch (status) {
    case 'pending': return 'Aguardando Triagem';
    case 'forwarded': return 'Encaminhado';
    case 'discarded': return 'Descartado';
    default: return status;
  }
};

  const openWhatsApp = (phone: string, name: string) => {
    const message = `Olá ${name}! Sou da RODER e nos conhecemos na feira. Tudo bem?`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Triagem de Feiras</h1>
            <p className="text-muted-foreground font-medium">Qualificação e encaminhamento de leads captados em eventos.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => generateLeadsReport(leadsFilteredBySearchAndFair)}
              className="gap-2 font-bold h-10 border-primary text-primary hover:bg-primary hover:text-white"
            >
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={shareLeadsWhatsApp}
              className="gap-2 font-bold h-10 border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
            <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 flex items-center gap-2">
               <Users className="h-5 w-5 text-primary" />
               <span className="text-lg font-black">{filteredLeads.length}</span>
               <span className="text-[10px] font-bold uppercase text-muted-foreground">Leads</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-2xl border border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, empresa ou fone..." 
              className="pl-10 h-10 rounded-xl"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="h-10 px-3 bg-background border border-input rounded-xl text-sm font-medium"
            value={selectedFairId}
            onChange={e => setSelectedFairId(e.target.value)}
          >
            <option value="all">Todas as Feiras</option>
            {fairs.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
             <Button variant="outline" className="flex-grow rounded-xl gap-2 h-10">
               <Filter className="h-4 w-4" /> Qualificação
             </Button>
          </div>
        </div>

        {/* Main Content Area */}
        {expandedFairId === null ? (
          /* View 1: List of Fairs */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fairs.map(fair => {
              // Somente clientes contam para a triagem comercial de feiras (clientes mesmo ou sem tipo definido)
              const fairLeads = leads.filter(l => l.fair_id === fair.id && (l.type === 'client' || !l.type));
              const pendingCount = fairLeads.filter(l => l.status === 'pending').length;
              
              return (
                <motion.div
                  key={fair.id}
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card 
                    className={cn(
                      "cursor-pointer border-2 transition-all h-full",
                      pendingCount > 0 ? "border-orange-500 shadow-lg shadow-orange-500/10" : "border-border shadow-sm hover:border-primary/50"
                    )}
                    onClick={() => setExpandedFairId(fair.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                          {fair.logo_url ? (
                            <img src={fair.logo_url} alt="" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <Building2 className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        {pendingCount > 0 && (
                          <Badge className="bg-orange-600 animate-pulse text-white font-black text-[10px] uppercase">
                            {pendingCount} Pendentes
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl font-black uppercase tracking-tight">{fair.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5 font-bold">
                        <MapPin className="h-3 w-3" /> {fair.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">Total de Leads</span>
                          <span className="text-xl font-black">{fairLeads.length}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">Conversão Hot</span>
                          <span className="text-xl font-black text-red-500">
                            {fairLeads.filter(l => l.ai_score === 'hot').length}
                          </span>
                        </div>
                      </div>
                      
                      <Button className="w-full mt-4 gap-2 font-black uppercase text-xs h-10 group">
                        Ver Leads da Feira
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {fairs.length === 0 && !loading && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-3xl">
                <Building2 className="h-12 w-12 opacity-10 mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs">Nenhuma feira cadastrada.</p>
              </div>
            )}
          </div>
        ) : (
          /* View 2: Leads of a specific Fair */
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setExpandedFairId(null)}
                className="rounded-full hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-grow">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">
                    Leads: {fairs.find(f => f.id === expandedFairId)?.name}
                  </h2>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black">
                    {filteredLeads.filter(l => l.fair_id === expandedFairId).length} ENCONTRADOS
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm font-medium">Qualifique e direcione os contatos captados nesta feira.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 font-black uppercase text-[10px]"
                onClick={() => generateLeadsReport(leadsFilteredBySearchAndFair.filter(l => l.fair_id === expandedFairId))}
              >
                <FileDown className="h-4 w-4" /> PDF desta Feira
              </Button>
            </div>

            {/* Content List */}
            <div className="grid grid-cols-1 gap-4">
              {filteredLeads.filter(l => l.fair_id === expandedFairId).length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border text-muted-foreground">
                   <Users className="h-12 w-12 opacity-20 mb-4" />
                   <p className="font-bold uppercase tracking-widest text-xs">Nenhum lead encontrado para esta feira.</p>
                 </div>
              ) : (
                filteredLeads.filter(l => l.fair_id === expandedFairId).map(lead => (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group"
                  >
                    <Card className={cn(
                      "overflow-hidden border-border transition-all hover:shadow-xl hover:border-primary/50",
                      lead.status === 'forwarded' && "opacity-80 grayscale-[0.5]"
                    )}>
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {/* Lado Esquerdo - Info Principal */}
                          <div className="p-6 flex-grow flex flex-col md:flex-row gap-6">
                            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                               <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden flex items-center justify-center shadow-inner">
                                  {lead.photos && lead.photos[0] ? (
                                    <img src={lead.photos[0]} alt={lead.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <Building2 className="h-8 w-8 text-muted-foreground/30" />
                                  )}
                               </div>
                               <div className={cn(
                                 "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                                 lead.ai_score === 'hot' ? 'bg-red-500/10 text-red-500' :
                                 lead.ai_score === 'warm' ? 'bg-amber-500/10 text-amber-500' :
                                 lead.ai_score === 'cold' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'
                               )}>
                                 {getScoreIcon(lead.ai_score)}
                                 {getScoreLabel(lead.ai_score)}
                               </div>
                            </div>

                            <div className="space-y-4 flex-grow">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                   <h3 className="text-xl font-black uppercase tracking-tight">{lead.name}</h3>
                                   {lead.type === 'partner' && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] font-black uppercase">Parceiro</Badge>}
                                   {lead.type === 'supplier' && <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[8px] font-black uppercase">Fornecedor</Badge>}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground">
                                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {lead.company || '--'}</span>
                                  <span className="flex items-center gap-1 text-primary"><Search className="h-3 w-3" /> {lead.cnpj || 'Sem CNPJ/CPF'}</span>
                                  <span className="flex items-center gap-1 text-slate-500 font-bold"><MapPin className="h-3 w-3" /> {lead.city || '-'}{lead.state ? ` (${lead.state})` : ''}</span>
                                  <span className="flex items-center gap-1 text-blue-500"><UserCheck className="h-3 w-3" /> Captado por: <strong className="uppercase">{lead.salesperson_name || 'Anônimo'}</strong></span>
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {safeFormatDate(lead.created_at)}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                 {lead.interest_products.map(p => (
                                   <span key={p} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold uppercase text-slate-600 dark:text-slate-400">
                                     {p}
                                   </span>
                                 ))}
                              </div>

                              <div className="p-3 bg-muted/30 rounded-xl border border-border/50 text-xs text-muted-foreground italic line-clamp-2">
                                "{lead.observations || 'Nenhuma observação informada.'}"
                              </div>
                            </div>
                          </div>

                          {/* Lado Direito - Ações */}
                          <div className="bg-muted/30 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border min-w-[240px] space-y-3">
                             <div className="space-y-1 mb-2">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Status de Triagem</p>
                                <div className={cn(
                                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs",
                                  lead.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                  lead.status === 'forwarded' ? 'bg-green-500/10 text-green-500' :
                                  lead.status === 'discarded' ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500'
                                )}>
                                   {lead.status === 'pending' ? <Clock className="h-4 w-4" /> :
                                    lead.status === 'forwarded' ? <UserCheck className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                   {lead.status === 'pending' ? 'Aguardando Triagem' :
                                    lead.status === 'forwarded' ? `Destinado a ${lead.assigned_to_name}` : 'Descartado'}
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-2">
                               <Button 
                                 disabled={lead.status === 'discarded'}
                                 onClick={() => { setSelectedLead(lead); setForwardModalOpen(true); }}
                                 className={cn(
                                   "gap-2 font-bold uppercase text-[10px] h-12 flex-1",
                                   lead.status === 'forwarded' ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                 )}
                               >
                                 <ArrowUpRight className="h-4 w-4" /> 
                                 {lead.status === 'forwarded' ? 'Trocar Vendedor' : 'Encaminhar'}
                               </Button>
                               <Button 
                                 variant="outline" 
                                 onClick={() => openWhatsApp(lead.phone, lead.name)}
                                 className="gap-2 font-bold h-12 text-green-500 hover:text-green-600 hover:bg-green-50"
                               >
                                 <PhoneCall className="h-4 w-4" /> WhatsApp
                               </Button>
                             </div>
                             
                             <div className="flex gap-1">
                               <Button 
                                 variant="ghost" 
                                 className="flex-1 text-primary hover:text-primary hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest gap-2 h-10"
                                 onClick={() => openEditModal(lead)}
                               >
                                 <Pencil className="h-3 w-3" /> Editar
                               </Button>
                               {lead.status === 'pending' && (
                                 <Button variant="ghost" className="flex-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 text-[10px] font-black uppercase tracking-widest gap-2 h-10"
                                   onClick={() => handleUpdateStatus(lead.id, 'discarded')}>
                                   <XCircle className="h-3 w-3" /> Descartar
                                 </Button>
                               )}
                             </div>
                             <div className="flex gap-1">
                               {(isAdmin || isManager) && (
                                <Button variant="ghost" className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest gap-2 h-10"
                                  onClick={() => handleDeleteLead(lead.id, lead.name)}>
                                  <Trash2 className="h-3 w-3" /> Excluir Final
                                </Button>
                               )}
                             </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Forward Modal */}
        <Dialog open={forwardModalOpen} onOpenChange={setForwardModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{selectedLead?.status === 'forwarded' ? 'Redistribuir Lead / Trocar Vendedor' : 'Encaminhar Lead'}</DialogTitle>
                    <DialogDescription>
                        {selectedLead?.status === 'forwarded'
                          ? `Deseja trocar o responsável atual (${selectedLead.assigned_to_name}) por outro vendedor?`
                          : "Selecione para qual vendedor este lead de feira deve ser enviado."
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-4 max-h-[450px] overflow-y-auto pr-2">
                    {/* Prioritized Internal Sellers */}
                    {sellers
                      .filter(s => ['Eloísa Laira', 'Monalisa Souza', 'Yury Melo', 'Yuri Melo'].some(name => s.name.toLowerCase().includes(name.toLowerCase())))
                      .sort((a, b) => {
                        const priorities = ['eloísa', 'monalisa', 'yur'];
                        const aIdx = priorities.findIndex(p => a.name.toLowerCase().includes(p));
                        const bIdx = priorities.findIndex(p => b.name.toLowerCase().includes(p));
                        return aIdx - bIdx;
                      })
                      .map(seller => (
                        <button
                            key={seller.uid}
                            onClick={() => handleForwardLead(seller)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary/5 hover:bg-primary/20 border-2 border-primary/30 hover:border-primary transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-1">
                              <Sparkles className="h-4 w-4 text-primary/30" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-primary/10 border border-primary/20 group-hover:bg-primary/20">
                                    <Award className="h-5 w-5 text-primary transition-colors" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-black uppercase text-primary leading-none mb-1">{seller.name}</p>
                                    <Badge className="bg-primary text-white text-[7px] font-black uppercase py-0 h-4">RESPONSÁVEL DIRETO</Badge>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}

                    <div className="py-2 flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Outros Vendedores</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {sellers
                      .filter(s => !['Eloísa Laira', 'Monalisa Souza', 'Yury Melo', 'Yuri Melo'].some(name => s.name.toLowerCase().includes(name.toLowerCase())))
                      .map(seller => (
                        <button
                            key={seller.uid}
                            onClick={() => handleForwardLead(seller)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-primary/10 border border-border hover:border-primary/50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-white border border-border group-hover:border-primary/30">
                                    <UserCheck className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-black uppercase text-foreground">{seller.name}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest">
                                        {seller.role === 'internal_seller' ? 'INTERNO / MATRIZ' : 'VENDEDOR EXTERNO'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>

        {/* Edit Lead Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Lead</DialogTitle>
              <DialogDescription>Atualize os dados básicos do lead captado na feira.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_name">Nome Completo</Label>
                <Input 
                  id="edit_name" 
                  value={editFormData.name} 
                  onChange={e => setEditFormData(p => ({ ...p, name: e.target.value }))} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_company">Empresa</Label>
                <Input 
                  id="edit_company" 
                  value={editFormData.company} 
                  onChange={e => setEditFormData(p => ({ ...p, company: e.target.value }))} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_city">Cidade</Label>
                  <Input 
                    id="edit_city" 
                    value={editFormData.city} 
                    onChange={e => setEditFormData(p => ({ ...p, city: e.target.value }))} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_state">Estado</Label>
                  <select 
                    id="edit_state"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editFormData.state}
                    onChange={e => setEditFormData(p => ({ ...p, state: e.target.value }))}
                  >
                    <option value="">Selecione</option>
                    {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_obs">Observações</Label>
                <Textarea 
                  id="edit_obs" 
                  value={editFormData.observations} 
                  onChange={e => setEditFormData(p => ({ ...p, observations: e.target.value }))} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateLead} className="font-bold">Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
