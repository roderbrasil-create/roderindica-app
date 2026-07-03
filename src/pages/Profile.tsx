import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { usePWA } from '../contexts/PWAContext';
import { User, Mail, Phone, MapPin, CreditCard, FileText, CheckCircle2, AlertCircle, Smartphone, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { maskPhone, maskCpfCnpj } from '../lib/masks';

export default function Profile() {
  const { profile, isAdmin, isExternalSeller } = useAuth();
  const { canInstall, installApp } = usePWA();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  
  const [formData, setFormData] = useState({
    name: (profile?.name || '').replace('Jefferson', 'Jeferson'),
    email: profile?.email || '',
    phone: maskPhone(profile?.phone || ''),
    company_name: profile?.company_name || '',
    cpf_cnpj: maskCpfCnpj(profile?.cpf_cnpj || ''),
    city: profile?.city || '',
    state: profile?.state || '',
    pix_key: profile?.pix_key || '',
    bank_info: profile?.bank_info || { bank: '', agency: '', account: '' }
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: (profile.name || '').replace('Jefferson', 'Jeferson'),
        email: profile.email || '',
        phone: maskPhone(profile.phone || ''),
        company_name: profile.company_name || '',
        cpf_cnpj: maskCpfCnpj(profile.cpf_cnpj || ''),
        city: profile.city || '',
        state: profile.state || '',
        pix_key: profile.pix_key || '',
        bank_info: profile.bank_info || { bank: '', agency: '', account: '' }
      });
    }
  }, [profile]);

  const [emailSettings, setEmailSettings] = useState({
    provider: 'resend',
    apiKey: '',
    senderEmail: 'vendas@roderbrasil.com.br'
  });

  React.useEffect(() => {
    if (!isAdmin) return;
    const loadEmailSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'email');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEmailSettings(docSnap.data() as any);
        }
      } catch (err) {
        console.error("Error loading email settings:", err);
      }
    };
    loadEmailSettings();
  }, [isAdmin]);

  const handleSaveEmailSettings = async () => {
    setSavingEmail(true);
    try {
      await setDoc(doc(db, 'settings', 'email'), {
        ...emailSettings,
        updated_at: new Date().toISOString(),
        updated_by: profile?.name
      });
      toast.success('Configurações de e-mail salvas!');
    } catch (err) {
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleAutoSave = async (field: string, value: string) => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        [field]: value,
        updated_at: new Date().toISOString()
      });
      console.log(`Auto-saved ${field}`);
    } catch (error) {
      console.error(`Error auto-saving ${field}:`, error);
    }
  };

  const handleUpdate = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        ...formData,
        updated_at: new Date().toISOString()
      });
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualInstall = () => {
    if (canInstall) {
      installApp();
    } else {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        toast.info('Para instalar no celular:', {
          description: 'iPhone: Compartilhar > Tela de Início. Android: Menu > Instalar.',
          duration: 10000
        });
      } else {
        toast.info('Para instalar no computador:', {
          description: 'Clique no ícone de instalação (computador com uma seta) no canto direito da barra de endereços do seu navegador.',
          duration: 10000
        });
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minha Conta</h1>
          <p className="text-muted-foreground">Gerencie seus dados pessoais e informações de pagamento.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2"><User className="h-3 w-3" /> Nome Completo</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      onBlur={(e) => handleAutoSave('name', e.target.value)}
                      className="bg-background border-border" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-3 w-3" /> E-mail</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="h-3 w-3" /> WhatsApp / Telefone</Label>
                    <Input 
                      id="phone" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} 
                      onBlur={(e) => handleAutoSave('phone', e.target.value)}
                      className="bg-background border-border" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document" className="flex items-center gap-2"><FileText className="h-3 w-3" /> CPF / CNPJ</Label>
                    <Input 
                      id="document" 
                      value={formData.cpf_cnpj} 
                      onChange={(e) => setFormData({...formData, cpf_cnpj: maskCpfCnpj(e.target.value)})} 
                      onBlur={(e) => handleAutoSave('cpf_cnpj', e.target.value)}
                      className="bg-background border-border" 
                      placeholder="000.000.000-00 ou 00.000.000/0000-00" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="company" className="flex items-center gap-2 font-bold text-primary"><MapPin className="h-3 w-3" /> Nome da Empresa (Razão Social)</Label>
                    <Input 
                      id="company" 
                      value={formData.company_name} 
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})} 
                      onBlur={(e) => handleAutoSave('company_name', e.target.value)}
                      className="bg-background border-border" 
                      placeholder="Caso possua empresa aberta para recebimento" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Cidade</Label>
                    <Input id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="flex items-center gap-2">Estado</Label>
                    <Input id="state" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="bg-background border-border" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {(profile?.role === 'external_seller' || profile?.is_commissionable !== false) && (
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Informações de Pagamento</CardTitle>
                  <CardDescription>Estes dados são utilizados para o pagamento de suas comissões.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="pix" className="flex items-center gap-2 text-primary font-bold"><CreditCard className="h-3 w-3" /> Chave PIX Principal</Label>
                    <Input id="pix" value={formData.pix_key} onChange={(e) => setFormData({...formData, pix_key: e.target.value})} className="bg-primary/5 border-primary/20 focus:border-primary" />
                    
                    {formData.company_name && (
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 mt-2 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-orange-700 font-medium leading-tight">
                          IMPORTANTE: Como você informou dados de empresa, a chave PIX vinculada deve ser obrigatoriamente da conta jurídica (CNPJ) para que o financeiro possa processar o pagamento.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Dados Bancários (OPCIONAL)</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Banco (Opcional)</Label>
                        <Input value={formData.bank_info.bank} onChange={(e) => setFormData({...formData, bank_info: {...formData.bank_info, bank: e.target.value}})} className="bg-background border-border" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Agência (Opcional)</Label>
                        <Input value={formData.bank_info.agency} onChange={(e) => setFormData({...formData, bank_info: {...formData.bank_info, agency: e.target.value}})} className="bg-background border-border" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Conta (Opcional)</Label>
                        <Input value={formData.bank_info.account} onChange={(e) => setFormData({...formData, bank_info: {...formData.bank_info, account: e.target.value}})} className="bg-background border-border" />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleUpdate} disabled={loading} className="w-full">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {(profile?.role !== 'external_seller' && profile?.is_commissionable === false) && (
              <Button onClick={handleUpdate} disabled={loading} className="w-full">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900 border-orange-500 shadow-xl overflow-hidden relative group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-700" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-white flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-orange-500" />
                  Aplicativo PWA
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Instale o sistema Roder Brasil no seu celular ou computador para acesso rápido e modo offline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <Download className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-widest">Acesso Instantâneo</p>
                      <p className="text-[10px] text-slate-400">Cria um ícone na sua tela inicial e barra de tarefas.</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleManualInstall}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-[10px] h-12 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                >
                  {canInstall ? "Instalar Agora" : "Como Instalar"}
                </Button>
              </CardContent>
            </Card>

            {profile?.role === 'external_seller' && (
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Contrato de Parceria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile?.contract_accepted ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-bold">Contrato Assinado</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Assinado em: {new Date(profile.contract_accepted_at!).toLocaleDateString()}
                      </p>
                      <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/contrato')}>
                        <FileText className="h-4 w-4" /> Visualizar Contrato
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-orange-500 bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                        <FileText className="h-5 w-5" />
                        <span className="text-sm font-bold">Contrato Pendente</span>
                      </div>
                      <Button className="w-full" onClick={() => navigate('/contrato')}>
                        Assinar Agora
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Suporte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Dúvidas sobre seu contrato ou comissões? Entre em contato com o comercial.</p>
                <Button variant="secondary" className="w-full" onClick={() => window.open('https://wa.me/551431615110', '_blank')}>
                  Falar com Roder
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
