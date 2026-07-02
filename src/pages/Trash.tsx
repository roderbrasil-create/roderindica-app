import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, addDoc, getDoc, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Trash2, RotateCcw, Shield, Calendar, User, Search, History, Eye, Activity, X } from 'lucide-react';
import { Input } from '../components/ui/input';
import { CryptoService } from '../lib/CryptoService';
import { AuditService, AuditAction } from '../lib/AuditService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";

interface TrashItem {
  id: string;
  original_id: string;
  collection: string;
  data_encrypted: string;
  deleted_at: string;
  deleted_by_name: string;
  deleted_by_uid: string;
  entity_type: string;
  entity_name: string;
}

export default function Trash() {
  const { isAdmin, isManager } = useAuth();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [decrypting, setDecrypting] = useState<string | null>(null);
  const [activeNodes, setActiveNodes] = useState(1);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    // Listen to active nodes (seen in the last 30 minutes to tolerate clock-skews)
    const thirtyMinsAgo = new Date();
    thirtyMinsAgo.setMinutes(thirtyMinsAgo.getMinutes() - 30);
    const tsThreshold = Timestamp.fromDate(thirtyMinsAgo);

    const q = query(collection(db, 'edge_nodes'), where('last_seen', '>=', tsThreshold));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      let activeCount = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let lastSeenDate: Date | null = null;
        const lastSeenRaw = data.last_seen;
        
        if (lastSeenRaw) {
          if (typeof lastSeenRaw.toDate === 'function') {
            lastSeenDate = lastSeenRaw.toDate();
          } else if (lastSeenRaw.seconds !== undefined) {
            lastSeenDate = new Date(lastSeenRaw.seconds * 1000);
          } else if (lastSeenRaw instanceof Date) {
            lastSeenDate = lastSeenRaw;
          } else {
            const parsed = new Date(lastSeenRaw);
            if (!isNaN(parsed.getTime())) {
              lastSeenDate = parsed;
            }
          }
        }

        if (lastSeenDate) {
          const diffMins = Math.abs(now.getTime() - lastSeenDate.getTime()) / 60000;
          if (diffMins <= 10) {
            activeCount++;
          }
        }
      });
      setActiveNodes(activeCount > 0 ? activeCount : 1);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin && !isManager) return;

    const q = query(collection(db, 'trash_bin'), orderBy('deleted_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrashItem)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin, isManager]);

  const handleRestore = async (item: TrashItem) => {
    setDecrypting(item.id);
    const toastId = toast.loading('Restaurando item...');
    
    try {
      const decryptedData = await CryptoService.decrypt(item.data_encrypted);
      if (!decryptedData) throw new Error('Falha na decriptografia');

      // Restore to original collection
      await addDoc(collection(db, item.collection), {
        ...decryptedData,
        restored_at: new Date().toISOString(),
        restored_by: item.deleted_by_name
      });

      // Remove from trash
      await deleteDoc(doc(db, 'trash_bin', item.id));
      
      await AuditService.log(AuditAction.RESTORE_PRODUCT, `Restaurou ${item.entity_type}: ${item.entity_name}`);
      toast.success(`${item.entity_name} restaurado com sucesso!`, { id: toastId });
    } catch (error: any) {
      toast.error('Erro ao restaurar: ' + error.message, { id: toastId });
    } finally {
      setDecrypting(null);
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    if (!confirm('Deseja excluir permanentemente? Esta ação não pode ser desfeita.')) return;
    
    try {
      await deleteDoc(doc(db, 'trash_bin', item.id));
      await AuditService.log(AuditAction.DELETE_PRODUCT, `Excluiu PERMANENTEMENTE ${item.entity_type}: ${item.entity_name}`);
      toast.success('Item removido permanentemente.');
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  if (!isAdmin && !isManager) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
          <Shield className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
          <h2 className="text-xl font-bold">Acesso Restrito</h2>
          <p className="text-muted-foreground">Somente administradores podem acessar a Lixeira Segura.</p>
        </div>
      </Layout>
    );
  }

  const handlePreview = async (item: TrashItem) => {
    setDecrypting(item.id);
    try {
      const decryptedData = await CryptoService.decrypt(item.data_encrypted);
      setPreviewData(decryptedData);
      setIsPreviewOpen(true);
    } catch (error: any) {
      toast.error('Erro ao decriptar: ' + error.message);
    } finally {
      setDecrypting(null);
    }
  };

  const filteredItems = items.filter(item => 
    item.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-orange-500" /> Lixeira Segura (Distributed Recycle Bin)
            </h1>
            <p className="text-muted-foreground text-sm">
              Itens "deletados" ficam guardados aqui de forma encriptada para segurança e governança.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Nós Online: {activeNodes} Ativos</span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou tipo de entidade..." 
            className="pl-10 pr-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 opacity-50">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest">Carregando Auditoria...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center p-12 bg-muted/20 border border-dashed rounded-xl">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground">Nenhum item encontrado na lixeira.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="border-border hover:border-orange-500/30 transition-all overflow-hidden group">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="bg-muted/50 p-4 sm:w-48 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-border">
                      <Badge className="w-fit mb-1 bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                        {item.entity_type}
                      </Badge>
                      <span className="text-xs font-bold truncate">{item.entity_name}</span>
                    </div>

                    <div className="p-4 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> Excluído por
                        </p>
                        <p className="text-sm font-medium">{item.deleted_by_name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Data da Ação
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(item.deleted_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/10 sm:w-48 flex flex-row sm:flex-col gap-2 justify-center border-t sm:border-t-0 sm:border-l border-border">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => handlePreview(item)}
                        disabled={decrypting === item.id}
                        className="flex-1 sm:w-full"
                      >
                        {decrypting === item.id ? (
                          <span className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5 mr-1.5" /> Detalhes
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleRestore(item)}
                        disabled={decrypting === item.id}
                        className="flex-1 sm:w-full border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                      >
                        {decrypting === item.id ? (
                          <span className="animate-spin h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restaurar
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handlePermanentDelete(item)}
                        className="flex-1 sm:w-full text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="bg-card border-border text-card-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Payload Decriptado
              </DialogTitle>
              <DialogDescription className="text-xs uppercase font-bold tracking-tight">Dados técnicos recuperados do cofre encriptado.</DialogDescription>
            </DialogHeader>
            <div className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-[60vh]">
              <pre className="text-[10px] font-mono leading-relaxed">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsPreviewOpen(false)} className="bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px]">
                Fechar Auditoria
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
