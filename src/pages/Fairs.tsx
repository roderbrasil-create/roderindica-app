import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Fair, FairChecklistItem } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../components/ui/dialog';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '../components/ui/card';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Trash2, 
  Edit, 
  ChevronRight, 
  Settings,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Building2,
  Share2,
  FileText,
  FileDown,
  MessageCircle,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, safeFormatDate, formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Fairs() {
  const navigate = useNavigate();
  const { profile, isAdmin, isManager, isFinancial, isMarketing } = useAuth();
  const [fairs, setFairs] = useState<Fair[]>([]);
  const [allChecklistItems, setAllChecklistItems] = useState<FairChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFair, setEditingFair] = useState<Fair | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    start_date: '',
    end_date: '',
    logo_url: '',
    map_info: ''
  });

  const canManage = isAdmin || isManager || isFinancial || isMarketing;

  const handleImageUpload = async (file: File) => {
    const toastId = toast.loading('Processando imagem...');
    try {
      const options = {
        maxSizeMB: 0.2, // 200kb is plenty for a logo
        maxWidthOrHeight: 800,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);
      const base64 = await imageCompression.getDataUrlFromFile(compressedFile);
      setFormData(prev => ({ ...prev, logo_url: base64 }));
      toast.success('Logo processada!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar imagem.', { id: toastId });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleImageUpload(file);
      }
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'fairs'), orderBy('start_date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fairsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fair));
      setFairs(fairsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'fair_checklist'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FairChecklistItem));
      setAllChecklistItems(items);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    try {
      if (editingFair) {
        await updateDoc(doc(db, 'fairs', editingFair.id), {
          ...formData,
          updated_at: new Date().toISOString()
        });
        toast.success('Feira atualizada com sucesso!');
      } else {
        const docRef = await addDoc(collection(db, 'fairs'), {
          ...formData,
          status: 'planning',
          created_at: new Date().toISOString()
        });
        
        // Fetch template
        const templateSnap = await getDocs(query(collection(db, 'fair_checklist_template'), orderBy('created_at', 'asc')));
        let labelsToUse = templateSnap.docs.map(doc => doc.data().label);

        // Fallback to defaults if template is empty
        if (labelsToUse.length === 0) {
          labelsToUse = [
            'Assinatura do contrato de locação do espaço',
            'Pagamento das parcelas/taxas da feira',
            'Contratação de seguro obrigatório do estande',
            'Aprovação do projeto do estande (montadora)',
            'Solicitação de ponto de energia e internet',
            'Contratação de serviço de limpeza e recepcionista',
            'Definição das máquinas que serão expostas',
            'Agendamento de transporte/frete das máquinas',
            'Limpeza e polimento dos equipamentos no local',
            'Impressão de catálogos e folders atualizados',
            'Preparação de brindes (bonés, facas, etc.)',
            'Confecção de banners e bandeiras (visual)',
            'Configuração de QR Codes para captação de leads',
            'Reserva de hotel para a equipe de vendas',
            'Compra de passagens/estipêndio de viagem',
            'Kit de uniformes da Roder para a feira',
            'Providenciar coffee break/catering para o estande'
          ];
          
          // Seed template if isMarketing
          if (isMarketing) {
            for (const label of labelsToUse) {
              await addDoc(collection(db, 'fair_checklist_template'), {
                label,
                created_at: new Date().toISOString()
              });
            }
          }
        }

        // Auto-populate checklist for this fair
        for (const label of labelsToUse) {
          await addDoc(collection(db, 'fair_checklist'), {
            fair_id: docRef.id,
            label,
            completed: false,
            created_at: new Date().toISOString()
          });
        }

        toast.success('Feira cadastrada com checklist!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving fair:', error);
      toast.error('Erro ao salvar feira.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      start_date: '',
      end_date: '',
      logo_url: '',
      map_info: ''
    });
    setEditingFair(null);
  };

  const generateFullFairReport = async (fair: Fair) => {
    const toastId = toast.loading(`Gerando relatório completo para ${fair.name}...`);
    try {
      // 1. Fetch ALL leads for this fair
      const leadsSnap = await getDocs(query(collection(db, 'fair_leads'), where('fair_id', '==', fair.id)));
      const leads = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      if (leads.length === 0) {
        toast.error('Não há leads captados nesta feira ainda.', { id: toastId });
        return;
      }

      // 2. Fetch expenses
      const expensesSnap = await getDocs(query(collection(db, 'fair_expenses'), where('fair_id', '==', fair.id)));
      const expenses = expensesSnap.docs.map(doc => doc.data());
      const totalInvestment = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(34, 197, 94);
      doc.text(`RODER INDICA - Relatório Geral de Feira`, 14, 20);
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(fair.name, 14, 28);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Local: ${fair.location}`, 14, 34);
      doc.text(`Período: ${safeFormatDate(fair.start_date)} - ${safeFormatDate(fair.end_date)}`, 14, 39);
      doc.text(`Relatório gerado em: ${new Date().toLocaleString()}`, 14, 44);

      // Section 1: Executive Summary
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Resumo Executivo", 14, 55);
      
      const summaryData = [
        ['Total de Leads Captados', leads.length.toString()],
        ['Leads Quentes (Hot)', leads.filter(l => l.ai_score === 'hot').length.toString()],
        ['Leads Mornos (Warm)', leads.filter(l => l.ai_score === 'warm').length.toString()],
        ['Leads Frios (Cold)', leads.filter(l => l.ai_score === 'cold').length.toString()],
        ['Investimento Total', formatCurrency(totalInvestment)],
        ['Custo por Lead', formatCurrency(leads.length > 0 ? totalInvestment / leads.length : 0)]
      ];

      autoTable(doc, {
        startY: 58,
        body: summaryData,
        theme: 'plain',
        styles: { fontSize: 11, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 80 } }
      });

      // Section 2: Performance per Salesperson
      const salesStats: Record<string, { count: number, hot: number }> = {};
      leads.forEach(l => {
        const name = l.salesperson_name || 'Desconhecido';
        if (!salesStats[name]) salesStats[name] = { count: 0, hot: 0 };
        salesStats[name].count++;
        if (l.ai_score === 'hot') salesStats[name].hot++;
      });

      const salesTableData = Object.entries(salesStats)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, stats]) => [
          name,
          stats.count.toString(),
          stats.hot.toString(),
          ((stats.hot / stats.count) * 100).toFixed(1) + '%'
        ]);

      doc.setFontSize(14);
      doc.text("Desempenho por Vendedor / Expositor", 14, (doc as any).lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Vendedor', 'Total Leads', 'Leads Hot', '% Qualificação']],
        body: salesTableData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] as [number, number, number] }
      });

      // Section 3: Detailed Leads Table
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Listagem Detalhada de Leads", 14, 20);

      const customers = leads.filter(l => l.type === 'client' || !l.type);
      const partners = leads.filter(l => l.type === 'partner');
      const suppliers = leads.filter(l => l.type === 'supplier');

      let currentY = 25;

      const subSections = [
        { title: 'Clientes', data: customers, color: [34, 197, 94] as [number, number, number] },
        { title: 'Parceiros', data: partners, color: [245, 158, 11] as [number, number, number] },
        { title: 'Fornecedores', data: suppliers, color: [59, 130, 246] as [number, number, number] }
      ];

      subSections.forEach((sub) => {
        if (sub.data.length > 0) {
          doc.setFontSize(11);
          doc.setTextColor(sub.color[0], sub.color[1], sub.color[2]);
          doc.text(sub.title, 14, currentY);
          currentY += 4;

          const leadDetailsData = sub.data.map(l => [
            l.name,
            l.company || '-',
            l.phone || l.email || '-',
            l.salesperson_name || '-',
            l.ai_score === 'hot' ? 'Quente' : l.ai_score === 'cold' ? 'Frio' : 'Morno',
            safeFormatDate(l.created_at)
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [['Nome', 'Empresa', 'Contato', 'Vendedor', 'Temp.', 'Data']],
            body: leadDetailsData,
            theme: 'grid',
            headStyles: { fillColor: sub.color },
            styles: { fontSize: 8 }
          });

          // @ts-ignore
          currentY = doc.lastAutoTable.finalY + 12;

          if (currentY > 250) {
            doc.addPage();
            currentY = 20;
          }
        }
      });

      // Footer / Sharing
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `relatorio_feira_${fair.name.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });

      if (navigator.share) {
        await navigator.share({
          files: [pdfFile],
          title: `Relatório ${fair.name}`,
          text: `Confira o relatório de leads da feira ${fair.name}`
        });
        toast.success('Relatório compartilhado com sucesso!', { id: toastId });
      } else {
        doc.save(`relatorio_${fair.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
        toast.success('Relatório baixado com sucesso!', { id: toastId });
      }

    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao gerar relatório: ' + err.message, { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin && !isManager && !isMarketing) return;
    if (!window.confirm('Tem certeza que deseja excluir esta feira? Todos os dados vinculados serão perdidos.')) return;

    try {
      // Cleanup associated data
      const collectionsToCleanup = ['fair_checklist', 'fair_expenses', 'fair_assets', 'fair_leads'];
      for (const coll of collectionsToCleanup) {
        const q = query(collection(db, coll), where('fair_id', '==', id));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, coll, d.id)));
        await Promise.all(deletePromises);
      }

      await deleteDoc(doc(db, 'fairs', id));
      toast.success('Feira e dados vinculados excluídos.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir feira.');
    }
  };

  const getStatusColor = (status: Fair['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'planning': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-slate-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getStatusLabel = (status: Fair['status']) => {
    switch (status) {
      case 'active': return 'Em Andamento';
      case 'planning': return 'Planejando';
      case 'completed': return 'Finalizada';
      default: return status;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Feiras</h1>
            <p className="text-muted-foreground">Gerencie eventos, orçamentos e captação de leads de feiras.</p>
          </div>
          {canManage && (
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Feira
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : fairs.length === 0 ? (
          <Card className="bg-slate-50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Nenhuma feira cadastrada.</p>
              {canManage && (
                <Button variant="link" onClick={() => setIsDialogOpen(true)}>Cadastrar primeira feira</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fairs.map((fair) => (
              <motion.div
                key={fair.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden border-border bg-card hover:shadow-lg transition-shadow h-full flex flex-col group">
                  <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center p-4">
                    {fair.logo_url ? (
                      <img 
                        src={fair.logo_url} 
                        alt={fair.name} 
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Building2 className="h-12 w-12 text-slate-300" />
                    )}
                    <div className={cn(
                      "absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                      getStatusColor(fair.status)
                    )}>
                      {getStatusLabel(fair.status)}
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold line-clamp-1">{fair.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-[11px] font-medium">
                      <MapPin className="h-3 w-3" /> {fair.location}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 py-2 flex-grow">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{safeFormatDate(fair.start_date)} - {safeFormatDate(fair.end_date)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                        <span>Checklist de Preparação</span>
                        <span>
                          {allChecklistItems.filter(i => i.fair_id === fair.id && i.completed).length}/
                          {allChecklistItems.filter(i => i.fair_id === fair.id).length}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all" 
                          style={{ 
                            width: `${
                              allChecklistItems.filter(i => i.fair_id === fair.id).length > 0 
                                ? (allChecklistItems.filter(i => i.fair_id === fair.id && i.completed).length / allChecklistItems.filter(i => i.fair_id === fair.id).length) * 100 
                                : 0
                            }%` 
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 border-t border-border flex flex-wrap justify-between gap-2">
                    <div className="flex gap-1">
                      {canManage && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setEditingFair(fair);
                              setFormData({
                                name: fair.name,
                                location: fair.location,
                                start_date: fair.start_date,
                                end_date: fair.end_date,
                                logo_url: fair.logo_url || '',
                                map_info: fair.map_info || ''
                              });
                              setIsDialogOpen(true);
                            }}
                            title="Editar Feira"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-green-500"
                            onClick={() => generateFullFairReport(fair)}
                            title="Gerar Relatório PDF & Compartilhar"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              onClick={() => handleDelete(fair.id)}
                              title="Excluir Feira"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/feiras/${fair.id}`)}
                      className="gap-2 font-bold uppercase text-[10px] tracking-widest h-8"
                    >
                      Acessar QG
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingFair ? 'Editar Feira' : 'Nova Feira'}</DialogTitle>
              <DialogDescription>
                Cadastre os dados principais do evento para começar a gestão.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Feira*</Label>
                  <Input 
                    id="name" 
                    required 
                    placeholder="Ex: Norte Show 2026" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Local*</Label>
                  <Input 
                    id="location" 
                    required 
                    placeholder="Ex: Sinop - MT" 
                    value={formData.location}
                    onChange={(prev) => setFormData(p => ({ ...p, location: prev.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Data Início*</Label>
                    <Input 
                      id="start_date" 
                      type="date" 
                      required 
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Data Fim*</Label>
                    <Input 
                      id="end_date" 
                      type="date" 
                      required 
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo da Feira (Upload ou Cole aqui)</Label>
                  <div 
                    className={cn(
                      "group relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-2xl p-4 transition-all hover:bg-muted/50 hover:border-primary/50 cursor-pointer text-center",
                      formData.logo_url && "border-primary/50 bg-primary/5"
                    )}
                    onPaste={handlePaste}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <input 
                      id="logo-upload"
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    />
                    
                    {formData.logo_url ? (
                      <div className="flex flex-col items-center gap-3 w-full">
                        <div className="relative group/img h-24 w-full flex items-center justify-center">
                          <img 
                            src={formData.logo_url} 
                            alt="Preview" 
                            className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(p => ({ ...p, logo_url: '' }));
                            }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Logo selecionada - Clique ou Cole para trocar</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 rounded-full bg-primary/10 text-primary mb-2 group-hover:scale-110 transition-transform text-center">
                          <Upload className="h-5 w-5 mx-auto" />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Clique para buscar ou Cole uma imagem (Ctrl+V)</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Formatos sugeridos: PNG, JPG ou WEBP</p>
                      </>
                    )}
                  </div>
                  
                  {/* Keep URL as fallback for power users */}
                  <div className="pt-2">
                    <Label htmlFor="logo-url" className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Ou cole um link direto da internet</Label>
                    <Input 
                      id="logo-url" 
                      placeholder="https://exemplo.com/logo.png" 
                      className="h-8 text-xs mt-1"
                      value={formData.logo_url.startsWith('data:') ? '' : formData.logo_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="map_info">Info. de Localização do Estande</Label>
                  <Input 
                    id="map_info" 
                    placeholder="Ex: Rua C, Esquina com Av. Central" 
                    value={formData.map_info}
                    onChange={(e) => setFormData(prev => ({ ...prev, map_info: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Feira</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
