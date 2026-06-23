import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Indication, UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { cn, safeFormatDate } from '../lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  UserPlus, 
  AlertTriangle, 
  History,
  Search,
  ArrowRight,
  MapPin,
  BookOpen,
  MessageCircle,
  Trash2,
  Loader2,
  Building2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { HelpTooltip } from '../components/base/HelpTooltip';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';

export default function Triagem() {
  const [indications, setIndications] = useState<Indication[]>([]);
  const [internalSellers, setInternalSellers] = useState<UserProfile[]>([]);
  const [selectedIndication, setSelectedIndication] = useState<Indication | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateReason, setDuplicateReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [duplicateAlert, setDuplicateAlert] = useState<{ sellerName: string, sellerUid: string } | null>(null);
  const [externalSellers, setExternalSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRulesDialogOpen, setIsRulesDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [pendingFairLeadsCount, setPendingFairLeadsCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'negotiating'>('pending');
  const [indicationToDelete, setIndicationToDelete] = useState<Indication | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Count pending records from fairs
    const q = query(
      collection(db, 'fair_leads'),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Filtrar apenas clientes pendentes (partners e suppliers não entram para a triagem da Luana)
      const pendingClients = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.type === 'client' || !data.type;
      });
      setPendingFairLeadsCount(pendingClients.length);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = (indication: Indication) => {
    setIndicationToDelete(indication);
  };

  const confirmDelete = async () => {
    if (!indicationToDelete) return;
    setDeleting(true);
    try {
      await updateDoc(doc(db, 'indications', indicationToDelete.id), {
        status: 'cancelled',
        cancellation_reason: 'Excluído pelo Administrador (Teste/Outros)',
        updated_at: new Date().toISOString(),
        is_test: true,
        is_deleted: true
      });
      toast.success('Solicitação excluída com sucesso.');
      setIndicationToDelete(null);
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    // Definir consulta baseada no filtro de status
    const q = query(
      collection(db, 'indications'),
      where('status', '==', statusFilter)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Indication))
        .filter(ind => !ind.is_deleted);
      
      // Ordenar na memória: mais recentes primeiro
      docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Se estiver visualizando "negotiating", limitar aos mais recentes ou apenas os de interesse da triagem
      // mas por enquanto mostramos todos os de negociação para permitir a redistribuição
      setIndications(docs);
      setLoading(false);
    }, (error) => {
      console.error("Erro na triagem:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [statusFilter]);

  useEffect(() => {
    // Buscar todos os usuários internos/admin/manager para garantir que Heloisa, Monali e Yury apareçam
    const q = query(
      collection(db, 'users'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      const filtered = users.filter(u => 
        ['internal_seller', 'admin', 'manager', 'triagem', 'marketing', 'vendedor_padrao'].includes(u.role || '') ||
        ['heloisa', 'monali', 'yury'].some(name => u.name?.toLowerCase().includes(name))
      );
      setInternalSellers(filtered);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['external_seller', 'internal_seller', 'vendedor_padrao', 'admin', 'manager'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExternalSellers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  const getSellerName = (uid: string, fallbackName: string) => {
    if (!uid) return fallbackName || 'N/A';
    const seller = externalSellers.find(s => s.uid === uid) || internalSellers.find(s => s.uid === uid);
    if (seller?.name) return seller.name;
    
    // Clean up temporary names
    if (fallbackName && (fallbackName.toLowerCase().includes('temp') || fallbackName.toLowerCase().includes('vendedor'))) {
      if (seller?.email) return seller.email;
      if (seller?.phone) return seller.phone;
    }
    
    return fallbackName || 'Vendedor';
  };

  const checkIntegrity = async (indication: Indication) => {
    // Se já está em negociação, estamos apenas redistribuindo, então não precisa validar duplicidade de novo
    if (indication.status === 'negotiating') return true;

    // Check for duplicate CNPJ or client name in the last 60 days
    try {
      const q = query(
        collection(db, 'indications'),
        where('client_name', '==', indication.client_name),
        where('status', '==', 'negotiating')
      );

      const snapshot = await getDocs(q);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      
      const existingNegotiations = snapshot.docs
        .filter(doc => doc.id !== indication.id)
        .filter(doc => {
          const data = doc.data() as any;
          return data.created_at > sixtyDaysAgo;
        });

      if (existingNegotiations.length > 0) {
        const existing = existingNegotiations[0].data() as Indication;
        setDuplicateAlert({
          sellerName: existing.internal_seller_name || 'Vendedor não identificado',
          sellerUid: existing.internal_seller_uid || ''
        });
        return false;
      }

      setDuplicateAlert(null);
      return true;
    } catch (error) {
      console.error("Integrity check failed", error);
      return true;
    }
  };

  const handleAssign = async (sellerUid?: string, sellerName?: string) => {
    const targetUid = sellerUid || selectedSeller;
    const targetName = sellerName || internalSellers.find(s => s.uid === targetUid)?.name;

    if (!selectedIndication) {
       toast.error('Nenhum lead selecionado.');
       return;
    }
    
    if (!targetUid) {
       toast.error('Selecione um vendedor para encaminhar.');
       return;
    }

    setAssigning(true);
    try {
      const prevSellerUid = selectedIndication.internal_seller_uid;
      const prevSellerName = selectedIndication.internal_seller_name;

      await updateDoc(doc(db, 'indications', selectedIndication.id), {
        internal_seller_uid: targetUid,
        internal_seller_name: targetName,
        status: 'negotiating',
        updated_at: new Date().toISOString(),
        duplicate_reviewed: true
      });

      // Also update Fair Lead if exists
      if (selectedIndication.fair_lead_id) {
        try {
          await updateDoc(doc(db, 'fair_leads', selectedIndication.fair_lead_id), {
            status: 'forwarded', // Use 'forwarded' to match FairLeadsTriagem status
            updated_at: new Date().toISOString(),
            assigned_to_uid: targetUid,
            assigned_to_name: targetName
          });
        } catch (fairErr) {
          console.error("Error updating fair lead:", fairErr);
        }
      }

      // Notify the NOVO internal seller
      await addDoc(collection(db, 'notifications'), {
        user_uid: targetUid,
        title: prevSellerUid ? 'Lead Redistribuído para Você' : 'Novo Lead Atribuído',
        message: prevSellerUid 
          ? `O lead ${selectedIndication.client_name} (que estava com ${prevSellerName}) foi redistribuído para você.`
          : `Você recebeu um novo lead: ${selectedIndication.client_name}`,
        type: 'info',
        read: false,
        link: '/indicacoes?filter=negotiating',
        created_at: new Date().toISOString()
      });

      // Notify the PREVIOUS internal seller if it was a redistribution
      if (prevSellerUid && prevSellerUid !== targetUid) {
        await addDoc(collection(db, 'notifications'), {
          user_uid: prevSellerUid,
          title: 'Lead Removido / Redistribuído',
          message: `O lead ${selectedIndication.client_name} foi movido da sua carteira para ${targetName} pela triagem.`,
          type: 'warning',
          read: false,
          link: '/indicacoes',
          created_at: new Date().toISOString()
        });
      }

      // Notify the indicator (external seller)
      if (selectedIndication.external_seller_uid) {
        await addDoc(collection(db, 'notifications'), {
          user_uid: selectedIndication.external_seller_uid,
          title: 'Lead em Atendimento',
          message: `Sua indicação para ${selectedIndication.client_name} foi encaminhada para o setor comercial e já está em atendimento.`,
          type: 'success',
          read: false,
          link: '/indicacoes',
          created_at: new Date().toISOString()
        });
      }

      toast.success(`Lead encaminhado para ${targetName}`);
      setIsAssignDialogOpen(false);
      setDuplicateAlert(null);
      setSelectedIndication(null);
      setSelectedSeller('');
    } catch (error: any) {
      toast.error('Erro ao encaminhar lead: ' + error.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedIndication) return;
    
    const finalReason = duplicateReason === 'others' ? customReason : duplicateReason;
    
    if (!finalReason) {
      toast.error('Por favor, informe o motivo.');
      return;
    }

    try {
      await updateDoc(doc(db, 'indications', selectedIndication.id), {
        status: 'archived',
        cancellation_reason: 'Duplicidade / Já em atendimento',
        cancellation_details: finalReason,
        updated_at: new Date().toISOString()
      });

      // Also update Fair Lead if exists
      if (selectedIndication.fair_lead_id) {
        try {
          await updateDoc(doc(db, 'fair_leads', selectedIndication.fair_lead_id), {
            status: 'archived',
            processed_at: new Date().toISOString()
          });
        } catch (fairErr) {
          console.error("Error updating fair lead:", fairErr);
        }
      }

      // Notify the indicator (external seller) about the archive
      if (selectedIndication.external_seller_uid) {
        await addDoc(collection(db, 'notifications'), {
          user_uid: selectedIndication.external_seller_uid,
          title: 'Lead Arquivado',
          message: `Sua indicação para ${selectedIndication.client_name} foi arquivada por: Duplicidade / Já em atendimento.`,
          type: 'warning',
          read: false,
          link: '/indicacoes',
          created_at: new Date().toISOString()
        });
      }

      toast.info('Indicação arquivada por duplicidade.');
      setIsDuplicateDialogOpen(false);
      setDuplicateReason('');
      setCustomReason('');
      setSelectedIndication(null);
    } catch (error: any) {
      toast.error('Erro ao arquivar: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Triagem de Leads</h1>
              <HelpTooltip content="Fila de aprovação de novas indicações. Aqui você deve verificar se o lead já existe e direcionar para o vendedor interno correto." />
            </div>
            <p className="text-muted-foreground">Luana, valide e distribua as novas indicações para os vendedores internos.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              asChild
              variant="outline" 
              className={cn(
                "border-primary text-primary hover:bg-primary hover:text-white font-bold relative transition-all duration-500",
                pendingFairLeadsCount > 0 && "shadow-[0_0_20px_rgba(234,88,12,0.3)] border-orange-500 text-orange-600 animate-pulse"
              )}
            >
              <Link to="/feiras/triagem">
                <Building2 className="h-4 w-4 mr-2" />
                FEIRAS (LEADS)
                {pendingFairLeadsCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-orange-600 text-[10px] text-white items-center justify-center font-black">
                      {pendingFairLeadsCount}
                    </span>
                  </span>
                )}
              </Link>
            </Button>

            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-white font-bold"
              onClick={() => setIsRulesDialogOpen(true)}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Regras de Atendimento
            </Button>
          </div>
        </div>

        <div className="flex bg-muted p-1 rounded-xl w-fit mb-6">
          <Button 
            variant={statusFilter === 'pending' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setStatusFilter('pending')}
            className="text-xs font-black uppercase rounded-lg px-6"
          >
            Aguardando Triagem
          </Button>
          <Button 
            variant={statusFilter === 'negotiating' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setStatusFilter('negotiating')}
            className="text-xs font-black uppercase rounded-lg px-6"
          >
            Já Distribuídos (Redistribuir)
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {indications.length === 0 ? (
            <Card className="bg-card border-border shadow-sm md:col-span-2 lg:col-span-3">
              <CardContent className="p-12 text-center text-muted-foreground">
                Nenhum novo lead aguardando triagem.
              </CardContent>
            </Card>
          ) : (
            indications.map((ind) => (
              <Card key={ind.id} className="bg-card border-border shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all text-xs">
                <div className="p-4 space-y-3 flex-1">
                  {/* Header row: Title and Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-foreground truncate uppercase" title={ind.client_name}>
                        {ind.client_name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <History className="h-3 w-3 inline" /> Recebido em {safeFormatDate(ind.created_at, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {ind.ai_score && (
                        <Badge className={cn(
                          "text-[8px] font-black uppercase py-0 px-1.5 h-4.5 rounded",
                          ind.ai_score === 'hot' ? "bg-red-500 text-white" : ind.ai_score === 'cold' ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                        )}>
                          {ind.ai_score === 'hot' ? '🔥 Quente' : ind.ai_score === 'cold' ? '❄️ Frio' : '⚖️ Morno'}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[8px] py-0 px-1.5 h-4.5 font-bold">
                        Novo Lead
                      </Badge>
                    </div>
                  </div>

                  {/* Contact and Indicator */}
                  <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-2 text-[11px]">
                    <div>
                      <p className="text-muted-foreground uppercase text-[9px] font-extrabold tracking-wider">Contato</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-foreground truncate max-w-[120px]">{ind.client_phone || 'Não informado'}</span>
                        {ind.client_phone && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-5 w-5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 shrink-0"
                            onClick={() => window.open(`https://wa.me/${ind.client_phone.replace(/\D/g, '')}`, '_blank')}
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground uppercase text-[9px] font-extrabold tracking-wider">Indicador</p>
                      <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                        <span className="font-bold text-primary truncate max-w-[110px]" title={getSellerName(ind.external_seller_uid || '', ind.external_seller_name || '')}>
                          {getSellerName(ind.external_seller_uid || '', ind.external_seller_name || '')}
                        </span>
                        {ind.source === 'fair' && (
                          <Badge className="text-[7px] py-0 px-0.5 h-3.5 bg-primary text-primary-foreground border-none font-black scale-90 shrink-0">
                            FEIRA
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location & Machine Info */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-border/30 pt-2">
                    <div>
                      <p className="text-muted-foreground uppercase text-[9px] font-extrabold tracking-wider">Localização</p>
                      <p className="font-semibold text-foreground truncate mt-0.5 flex items-center gap-1" title={ind.client_location}>
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{ind.client_location || 'Não informada'}</span>
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground uppercase text-[9px] font-extrabold tracking-wider">Máquina / Demanda</p>
                      <p className="font-semibold text-foreground truncate mt-0.5" title={`${ind.base_machine || ''} ${ind.machine_details || ''}`}>
                        {ind.base_machine || 'Solicitado'} {ind.machine_details || ''}
                      </p>
                    </div>
                  </div>

                  {/* Show CNPJ ONLY if filled & not 'Não informado' */}
                  {ind.client_cnpj && ind.client_cnpj.trim() !== '' && !ind.client_cnpj.toLowerCase().includes('não') && !ind.client_cnpj.toLowerCase().includes('nao') && (
                    <div className="text-[11px] border-t border-border/30 pt-1.5 flex justify-between">
                      <span className="text-muted-foreground uppercase text-[9px] font-extrabold">CNPJ:</span>
                      <span className="font-mono text-foreground font-semibold">{ind.client_cnpj}</span>
                    </div>
                  )}

                  {/* Requested items (Equip. Solicitados) and Options */}
                  {((ind.items && ind.items.length > 0) || ind.options) && (
                    <div className="border-t border-border/40 pt-2 space-y-1.5 text-[11px]">
                      {ind.items && ind.items.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {ind.items.map((item, i) => (
                            <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[9px] py-0 px-1 h-4 font-bold">
                              {item.quantity}x {item.product_name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {ind.options && (
                        <div className="flex flex-wrap gap-1">
                          {ind.options.complete_installation && <Badge variant="outline" className="border-green-500/20 text-green-500 bg-green-500/5 text-[8px] py-0 px-1 h-3.5">Instalação Completa</Badge>}
                          {ind.options.kit_hydraulic && <Badge variant="outline" className="border-blue-500/20 text-blue-500 bg-blue-500/5 text-[8px] py-0 px-1 h-3.5">Kit Hidráulico</Badge>}
                          {ind.options.only_equipment && <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground bg-muted/5 text-[8px] py-0 px-1 h-3.5">Somente Equipamento</Badge>}
                          {ind.options.with_freight && <Badge variant="outline" className="border-orange-500/20 text-orange-500 bg-orange-500/5 text-[8px] py-0 px-1 h-3.5">Com Frete</Badge>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description Box - clamped to 2 lines to look super compact */}
                  {ind.description && (
                    <div className="bg-muted/40 border border-border/40 rounded p-2 text-[10px] text-muted-foreground relative group/desc">
                      <p className="font-extrabold uppercase text-[8px] text-muted-foreground/80 mb-0.5">Descrição do Campo</p>
                      <p className="italic line-clamp-2 text-foreground/90 group-hover/desc:line-clamp-none transition-all duration-300">
                        "{ind.description}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer with action buttons */}
                <div className="px-3 py-2 bg-muted/30 border-t border-border flex items-center gap-1.5 justify-between shrink-0">
                  <Button 
                    size="sm"
                    className={cn(
                      "flex-1 text-[11px] font-black py-1 h-7.5 uppercase shadow-sm",
                      ind.status === 'negotiating' ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-primary hover:bg-primary/95 text-primary-foreground"
                    )}
                    onClick={async () => {
                      setSelectedIndication(ind);
                      const isValid = await checkIntegrity(ind);
                      if (isValid) {
                        setIsAssignDialogOpen(true);
                      }
                    }}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    {ind.status === 'negotiating' ? 'Redistribuir Lead' : 'Encaminhar'}
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline" 
                    className="border-border text-foreground hover:bg-muted font-bold text-[11px] py-1 h-7.5 uppercase px-2 shrink-0"
                    onClick={() => {
                      setSelectedIndication(ind);
                      setIsDuplicateDialogOpen(true);
                    }}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1 text-yellow-500" />
                    Duplicidade
                  </Button>
                  <Button 
                    size="icon"
                    variant="ghost" 
                    className="h-7.5 w-7.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDelete(ind)}
                    title="Excluir Lead"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Deletion Confirmation Dialog */}
        <Dialog open={!!indicationToDelete} onOpenChange={(open) => !open && setIndicationToDelete(null)}>
          <DialogContent className="bg-card border-border text-card-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" /> Confirmar Exclusão de Lead
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Tem certeza que deseja excluir permanentemente o lead de <strong>{indicationToDelete?.client_name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 rounded-lg bg-muted text-sm space-y-3">
              <p>Esta ação é <strong>irreversível</strong> e o lead será cancelado sem gerar relatórios ou métricas comerciais.</p>
              <p className="text-[10px] text-muted-foreground italic">* Recomendado apenas para leads de teste ou enviados por engano.</p>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIndicationToDelete(null)} 
                className="border-border"
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Sim, Excluir Lead
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Duplicate/Integrity Warning Dialog */}
        <Dialog open={!!duplicateAlert} onOpenChange={() => setDuplicateAlert(null)}>
          <DialogContent className="bg-card border-border text-card-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-5 w-5" /> ALERTA DE CLIENTE ATIVO
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                O cliente <strong>{selectedIndication?.client_name}</strong> já possui um orçamento em aberto e está em atendimento com o(a) vendedor(a) <strong>{duplicateAlert?.sellerName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 rounded-lg bg-muted text-sm space-y-3">
              <p>Deseja encaminhar esta nova indicação para o(a) mesmo(a) vendedor(a)?</p>
              <p className="text-[10px] text-muted-foreground italic">* Recomendado para centralizar o atendimento caso seja um novo equipamento para o mesmo cliente.</p>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setDuplicateAlert(null)} className="border-border">
                Avaliar Depois
              </Button>
              <Button 
                onClick={() => handleAssign(duplicateAlert?.sellerUid, duplicateAlert?.sellerName)} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Sim, enviar para {duplicateAlert?.sellerName}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual Duplicate/Archive Dialog */}
        <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground">
            <DialogHeader>
              <DialogTitle>Marcar como Duplicidade</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Por que este lead está sendo marcado como duplicado?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Motivo da Duplicidade</Label>
                <Select onValueChange={setDuplicateReason} value={duplicateReason}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-card-foreground">
                    <SelectItem value="Já temos um orçamento em aberto e em andamento para este cliente no CRM Agendor (Menos de 60 dias)">
                      Já existe oferta aberta no CRM Agendor (Menos de 60 dias)
                    </SelectItem>
                    <SelectItem value="Cliente já possui negociação ativa na plataforma RODER Indica com outro parceiro">
                      Já indicado por outro parceiro (Menos de 60 dias)
                    </SelectItem>
                    <SelectItem value="others">Outros (Descrever abaixo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {duplicateReason === 'others' && (
                <div className="space-y-2">
                  <Label>Descreva o motivo</Label>
                  <textarea 
                    className="w-full min-h-[100px] p-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Explique o motivo da rejeição..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)} className="border-border">
                Cancelar
              </Button>
              <Button onClick={handleArchive} className="bg-destructive hover:bg-destructive/90 text-white">
                Confirmar Arquivamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Standard Assign Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground">
            <DialogHeader>
              <DialogTitle>{selectedIndication?.status === 'negotiating' ? 'Redistribuir Lead / Trocar Vendedor' : 'Encaminhar Lead'}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {selectedIndication?.status === 'negotiating' 
                  ? `Selecione o novo vendedor interno para assumir este lead. O vendedor anterior (${selectedIndication.internal_seller_name}) será notificado.`
                  : `Selecione o vendedor interno que assumirá a negociação com ${selectedIndication?.client_name}.`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="seller" className="mb-2 block">Vendedor Interno</Label>
              <Select onValueChange={setSelectedSeller} value={selectedSeller}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Selecione um vendedor..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-card-foreground">
                  {internalSellers
                    .sort((a, b) => {
                      const names = ['heloisa', 'monali', 'yury'];
                      const aName = a.name.toLowerCase();
                      const bName = b.name.toLowerCase();
                      const aSpecial = names.some(n => aName.includes(n));
                      const bSpecial = names.some(n => bName.includes(n));
                      if (aSpecial && !bSpecial) return -1;
                      if (!aSpecial && bSpecial) return 1;
                      // Fallback for sorting Monali and Heloisa specifically if needed
                      if (aName.includes('heloisa') && bName.includes('monali')) return -1;
                      if (aName.includes('monali') && bName.includes('heloisa')) return 1;
                      return aName.localeCompare(bName);
                    })
                    .map((seller) => (
                    <SelectItem key={seller.uid} value={seller.uid}>
                      {seller.name} {seller.is_lead_receiver && "(Preferencial)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} className="border-border">
                Cancelar
              </Button>
              <Button 
                disabled={assigning}
                onClick={() => handleAssign()} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar Envio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Service Rules Dialog */}
        <Dialog open={isRulesDialogOpen} onOpenChange={setIsRulesDialogOpen}>
          <DialogContent className="max-w-2xl bg-card border-border text-card-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Regras de Atendimento RODER
              </DialogTitle>
              <DialogDescription>
                Guia rápido para Luana realizar a triagem de forma eficiente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
              <section className="space-y-2">
                <h4 className="font-bold text-primary uppercase text-xs">1. Critérios de Aceitação</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li><strong>Aceitar se:</strong> Não houver oferta aberta nos últimos 60 dias (mesmo que o cliente exista no CRM).</li>
                  <li><strong>Aceitar se:</strong> O <strong>MESMO</strong> indicador indicar um <strong>equipamento diferente</strong> para um cliente já em negociação.</li>
                  <li><strong>Arquivar se:</strong> Houver oferta aberta para o <strong>mesmo produto</strong> com menos de 60 dias.</li>
                  <li><strong>Arquivar se:</strong> Um <strong>OUTRO</strong> indicador indicar o cliente que já possui negociação ativa (mesmo se for outro equipamento).</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-primary uppercase text-xs">2. Distribuição (Encaminhamento)</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Se o cliente já tem histórico com uma vendedora específica, <strong>sempre</strong> encaminhar para a mesma pessoa.</li>
                  <li>Novos clientes devem ser distribuídos seguindo a fila de vendas ou conforme necessidade.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-primary uppercase text-xs">3. Vendedoras Internas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="font-bold">Monalí Souza</p>
                    <p className="text-muted-foreground">monali@roderbrasil.com.br</p>
                    <p className="text-muted-foreground">(14) 99811-5111</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="font-bold">Heloisa Laira</p>
                    <p className="text-muted-foreground">heloisa@roderbrasil.com.br</p>
                    <p className="text-muted-foreground">(14) 99630-5110</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="font-bold">Yury</p>
                    <p className="text-muted-foreground">yury@roderbrasil.com.br</p>
                  </div>
                </div>
              </section>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Dica Importante:</p>
                <p className="text-[10px] text-amber-700/80 leading-relaxed italic">
                  "Se houver dúvida sobre se a oferta é a mesma ou sobre os 60 dias, priorize o bom senso. O objetivo é proteger o canal de vendas mas incentivar novas oportunidades."
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsRulesDialogOpen(false)} className="w-full">Entendido</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
