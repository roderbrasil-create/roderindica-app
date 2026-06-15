import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { Commission } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  DollarSign, 
  CheckCircle2, 
  FileText, 
  Download, 
  Upload, 
  Copy,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Input } from '../components/ui/input';
import { compressImage } from '../lib/imageUtils';

export default function Finance() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'commissions'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCommissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleConfirmPayment = async (commission: Commission) => {
    try {
      await updateDoc(doc(db, 'commissions', commission.id), {
        status: 'paid',
        paid_at: new Date().toISOString()
      });

      // NOTIFY PARTNER
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const partnerDoc = await getDoc(doc(db, 'users', commission.external_seller_uid));
        if (partnerDoc.exists()) {
          const partner = partnerDoc.data();
          const { notifyCommissionApproved } = await import('../services/emailService');
          
          await notifyCommissionApproved(
            commission,
            partner.email,
            partner.name
          );
        }
      } catch (err) {
        console.error("Error sending commission email:", err);
      }

      toast.success('Pagamento confirmado! O vendedor será notificado.');
    } catch (error: any) {
      toast.error('Erro ao confirmar pagamento: ' + error.message);
    }
  };

  const handleUploadReceipt = async (commissionId: string, file: File) => {
    setUploadingId(commissionId);
    try {
      const storageRef = ref(storage, `receipts/${commissionId}_${file.name}`);
      
      // Compress if it's an image
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file);
      }
      
      await uploadBytes(storageRef, fileToUpload);
      const url = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'commissions', commissionId), {
        payment_receipt_url: url
      });
      toast.success('Comprovante enviado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar comprovante: ' + error.message);
    } finally {
      setUploadingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info('Copiado para a área de transferência!');
  };

  const stats = {
    pending: commissions.filter(c => c.status === 'pending').reduce((acc, c) => acc + c.value, 0),
    paid: commissions.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.value, 0),
    waiting_nf: commissions.filter(c => c.status === 'waiting_nf').reduce((acc, c) => acc + c.value, 0),
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão Financeira</h1>
          <p className="text-muted-foreground">Controle de pagamentos de comissões e validação de NFs.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground font-bold uppercase">Aguardando Pagamento</p>
              <h3 className="text-2xl font-bold text-orange-400 mt-1">R$ {stats.pending.toLocaleString('pt-BR')}</h3>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground font-bold uppercase">Total Pago</p>
              <h3 className="text-2xl font-bold text-green-400 mt-1">R$ {stats.paid.toLocaleString('pt-BR')}</h3>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground font-bold uppercase">Aguardando NF</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1">R$ {stats.waiting_nf.toLocaleString('pt-BR')}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Commissions Table */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Fila de Pagamentos</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-border">
                <Filter className="h-4 w-4 mr-2" /> Filtrar
              </Button>
              <Button variant="outline" size="sm" className="border-border">
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 font-bold">Vendedor</th>
                    <th className="px-6 py-3 font-bold">Valor</th>
                    <th className="px-6 py-3 font-bold">Status</th>
                    <th className="px-6 py-3 font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Nenhum pagamento pendente.</td>
                    </tr>
                  ) : (
                    commissions.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{c.external_seller_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-foreground">
                            R$ {c.value.toLocaleString('pt-BR')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={cn(
                            "capitalize",
                            c.status === 'paid' && "border-green-500/50 text-green-400 bg-green-500/10",
                            c.status === 'pending' && "border-orange-500/50 text-orange-400 bg-orange-500/10",
                            c.status === 'waiting_nf' && "border-blue-500/50 text-blue-400 bg-blue-500/10"
                          )}>
                            {c.status === 'paid' ? 'Pago' : c.status === 'pending' ? 'Pendente' : 'Aguardando NF'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {c.status !== 'paid' && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleConfirmPayment(c)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Confirmar
                              </Button>
                            )}
                            
                            <label className="cursor-pointer">
                              <Button variant="outline" size="sm" className="border-border pointer-events-none" disabled={uploadingId === c.id}>
                                <Upload className="h-4 w-4 mr-2" /> 
                                {uploadingId === c.id ? 'Enviando...' : 'Comprovante'}
                              </Button>
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => e.target.files?.[0] && handleUploadReceipt(c.id, e.target.files[0])} 
                              />
                            </label>

                            {c.payment_receipt_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={c.payment_receipt_url} target="_blank" rel="noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
