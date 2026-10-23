import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, CheckCircle2, User, MapPin, CreditCard, ArrowRight, Share2, Printer, LogOut, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { maskPhone } from '../lib/masks';
import { dadosDeExibicaoDoContrato } from '../lib/contratoAssinado';
import { montarContrato, type Paragrafo } from '../lib/contratoParceria';
import { gerarContratoPdf } from '../lib/contratoPdf';
import { abrirPdfContrato, compartilharPdfContrato } from '../lib/compartilharContrato';

// Trechos do contrato (texto + negrito) como JSX: a mesma estrutura que alimenta o PDF
const trechos = (p: Paragrafo) => p.map((x, i) => (x.b ? <strong key={i}>{x.t}</strong> : <React.Fragment key={i}>{x.t}</React.Fragment>));

export default function Contract() {
  const { profile: currentProfile, logout, isImpersonating } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'data' | 'contract'>('data');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewProfile, setViewProfile] = useState<UserProfile | null>(null);
  
  // Form State for onboarding
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    pix_key: '',
    bank_info: {
      bank: '',
      agency: '',
      account: '',
    }
  });

  const isPreview = searchParams.get('preview') === 'true';
  const viewUid = searchParams.get('uid');
  // Modo leitura do proprio parceiro (botao "Visualizar Contrato" do Minha Conta).
  // Sem isso a tela mandava quem ja assinou direto para a inicial.
  const modoLeitura = searchParams.get('ver') === '1';
  const previewRate = searchParams.get('rate') ? parseFloat(searchParams.get('rate')!) : 2;

  useEffect(() => {
    // If impersonating, get out of here
    if (isImpersonating && !isPreview && !viewUid) {
      // Allow viewing when impersonating, but maybe some context is needed
      console.log('Viewing contract in simulation mode');
    }

    const loadProfile = async () => {
      if (viewUid && currentProfile && viewUid === currentProfile.uid) {
        // o proprio perfil ja esta em memoria: nao depende de nova leitura nem de regra
        setViewProfile(currentProfile);
        setStep('contract');
      } else if (viewUid) {
        try {
          const docSnap = await getDoc(doc(db, 'users', viewUid));
          if (docSnap.exists()) {
            setViewProfile(docSnap.data() as UserProfile);
            setStep('contract'); // Admins go straight to contract
          } else {
            toast.error('Contrato não encontrado para este parceiro.');
            navigate('/');
          }
        } catch (err) {
          // sem permissao ou sem rede: nunca cair num contrato vazio com botao de assinar
          toast.error('Não foi possível abrir este contrato. Verifique a conexão ou a permissão.');
          navigate('/');
        }
      } else if (currentProfile) {
        setViewProfile(currentProfile);
        if (modoLeitura && currentProfile.contract_accepted) setStep('contract');
        setFormData({
          name: currentProfile.name || '',
          email: currentProfile.email || '',
          phone: currentProfile.phone || '',
          city: currentProfile.city || '',
          state: currentProfile.state || '',
          pix_key: currentProfile.pix_key || '',
          bank_info: currentProfile.bank_info || { bank: '', agency: '', account: '' }
        });
        
        // If already accepted and not a specific view, redirect
        if (currentProfile.contract_accepted && !isPreview && !viewUid && !modoLeitura) {
          navigate('/');
        }
      }
    };
    loadProfile();
  }, [currentProfile, viewUid, isPreview, modoLeitura, navigate]);

  const handleSaveData = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Por favor, preencha o Nome e WhatsApp.');
      return;
    }
    
    // PIX is optional for now, but recommended
    if (currentProfile?.is_commissionable !== false && !formData.pix_key) {
      toast.info('Lembre-se de preencher sua Chave PIX posteriormente no Perfil para receber comissões.');
    }
    
    setStep('contract');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao sair.');
    }
  };

  const handleAccept = async () => {
    if (!currentProfile) return;
    if (!accepted) {
      toast.error('Você precisa aceitar os termos para continuar.');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentProfile.uid), {
        ...formData,
        contract_accepted: true,
        contract_accepted_at: new Date().toISOString()
      });
      toast.success('Contrato assinado com sucesso!');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao salvar aceite do contrato.');
    } finally {
      setLoading(false);
    }
  };

  const gerarPdf = (): Blob => gerarContratoPdf(contrato).output('blob');

  // Os dois botões geram o PDF NA HORA do toque (síncrono) e entregam: o iPhone só deixa abrir/compartilhar
  // dentro do gesto do usuário.
  const handlePrint = async () => {
    try {
      const r = await abrirPdfContrato(gerarPdf(), contrato.assinatura.parceiro.nome);
      if (r === 'baixado') toast.success('PDF do contrato baixado.');
    } catch (e) {
      toast.error('Não foi possível gerar o PDF do contrato.');
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      const r = await compartilharPdfContrato(gerarPdf(), contrato.assinatura.parceiro.nome);
      if (r === 'baixado-whatsapp') toast.success('PDF baixado. Anexe o arquivo na conversa do WhatsApp.');
    } catch (e) {
      toast.error('Não foi possível gerar o PDF do contrato.');
    }
  };

  const somenteLeitura = modoLeitura || !!viewUid;
  const dadosContrato = dadosDeExibicaoDoContrato({ isPreview, somenteLeitura, step, viewProfile, formData });
  const displayName = dadosContrato.nome;
  const displayPix = dadosContrato.pix;
  const displayEmail = dadosContrato.email;
  const displayPhone = dadosContrato.telefone;
  const contrato = montarContrato({
    nome: displayName, email: displayEmail, telefone: displayPhone, pix: displayPix,
    mostrarPix: currentProfile?.is_commissionable !== false,
    taxa: isPreview ? previewRate : viewProfile?.commission_rate,
    aceito: !!(viewProfile?.contract_accepted || accepted),
    dataAceite: viewProfile?.contract_accepted_at,
    jaGravado: !!viewProfile?.contract_accepted,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Carregando Contrato...</p>
      </div>
    );
  }

  if (step === 'data' && !isPreview && !viewUid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-2xl border-border shadow-2xl">
          <CardHeader className="text-center space-y-2 relative">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="absolute right-4 top-4 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-2 shadow-sm overflow-hidden border border-border">
                <img 
                  src="https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png" 
                  alt="Roder Logo" 
                  referrerPolicy="no-referrer" 
                />
              </div>
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Confirmação de Dados</CardTitle>
            <p className="text-muted-foreground text-sm">Antes de visualizar o contrato, confirme seus dados cadastrais.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2"><User className="h-3 w-3" /> Nome Completo *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-muted/30 border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">Melhor E-mail *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-muted/30 border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">WhatsApp / Telefone *</Label>
                <Input 
                  id="phone" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} 
                  className="bg-muted/30 border-border" 
                />
              </div>
              
              {currentProfile?.is_commissionable !== false && (
                <div className="space-y-2">
                  <Label htmlFor="pix" className="flex items-center gap-2 text-primary font-bold"><CreditCard className="h-3 w-3" /> Chave PIX (Para Recebimento) *</Label>
                  <Input id="pix" value={formData.pix_key} onChange={(e) => setFormData({...formData, pix_key: e.target.value})} className="bg-primary/5 border-primary/20 focus:border-primary" placeholder="CPF, Celular ou Email" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Cidade</Label>
                <Input id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="bg-muted/30 border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="flex items-center gap-2">Estado</Label>
                <Input id="state" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="bg-muted/30 border-border" />
              </div>
            </div>

            {currentProfile?.is_commissionable !== false && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <p className="text-xs font-bold uppercase text-muted-foreground">Dados Bancários (Opcional)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Banco</Label>
                    <Input value={formData.bank_info.bank} onChange={(e) => setFormData({...formData, bank_info: {...formData.bank_info, bank: e.target.value}})} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Agência</Label>
                    <Input value={formData.bank_info.agency} onChange={(e) => setFormData({...formData, bank_info: {...formData.bank_info, agency: e.target.value}})} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Conta</Label>
                    <Input value={formData.bank_info.account} onChange={(e) => setFormData({...formData, bank_info: {...formData.bank_info, account: e.target.value}})} className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveData} className="w-full py-6 text-lg font-black uppercase tracking-widest">
              Prosseguir para o Contrato <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="contrato-impressao min-h-screen bg-background flex items-center justify-center p-4 py-12 print:p-0 print:bg-white">
      <Card className="w-full max-w-3xl border-border shadow-2xl print:shadow-none print:border-none">
        <CardHeader className="text-center space-y-4 print:space-y-2">
          <div className="flex justify-center print:hidden">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-2 shadow-md overflow-hidden border border-border">
              <img 
                src="https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png" 
                alt="Roder Logo" 
                referrerPolicy="no-referrer" 
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">
            Contrato de Parceria Comercial
          </CardTitle>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
            RODER MÁQUINAS E EQUIPAMENTOS
          </p>
          
          {(isPreview || viewUid || modoLeitura) && (
            <div className="flex justify-center gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs">
                <Printer className="h-3 w-3 mr-1" /> Imprimir / PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="text-xs">
                <Share2 className="h-3 w-3 mr-1" /> Compartilhar
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[500px] w-full rounded-md border border-border p-8 bg-white print:h-auto print:p-0 print:border-none">
            <div className="space-y-6 text-sm leading-relaxed text-black">
              <section className="space-y-2">
                <h3 className="font-black uppercase text-xs tracking-widest text-primary print:text-black">{contrato.tituloInstrumento}</h3>
                <p className="text-[10px] text-muted-foreground">{contrato.versao}</p>
                <p>{trechos(contrato.abertura)}</p>
                <div className="p-4 bg-muted/20 border border-border rounded space-y-1 text-xs">
                  {contrato.qualificacao.map(q => (
                    <p key={q.rotulo}><strong>{q.rotulo}:</strong> {q.valor}</p>
                  ))}
                </div>
                <p>{trechos(contrato.encerramentoAbertura)}</p>
              </section>

              {contrato.clausulas.map(cl => (
                <section key={cl.titulo} className="space-y-2">
                  <h3 className="font-black uppercase text-xs tracking-widest text-primary print:text-black">{cl.titulo}</h3>
                  {cl.paragrafos.map((p, i) => <p key={i}>{trechos(p)}</p>)}
                </section>
              ))}

              <div className="contrato-assinatura pt-12 border-t border-border/50 text-center space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="border-b border-black h-12 flex items-end justify-center pb-1">
                      <span className="text-[9px] italic text-muted-foreground uppercase font-bold">{contrato.assinatura.roder.rotulo}</span>
                    </div>
                    <p className="text-[10px] font-black uppercase">{contrato.assinatura.roder.nome}</p>
                    <p className="text-[8px] text-muted-foreground">{contrato.assinatura.roder.cnpj}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="border-b border-black h-12 flex items-end justify-center pb-1">
                      {contrato.assinatura.parceiro.assinado ? (
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] italic font-bold text-primary">{contrato.assinatura.parceiro.linha1}</span>
                          <span className="text-[8px] text-muted-foreground">{contrato.assinatura.parceiro.linha2}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">{contrato.assinatura.parceiro.linha1}</span>
                      )}
                    </div>
                    <p className="text-[10px] font-black uppercase">{contrato.assinatura.parceiro.nome}</p>
                    <p className="text-[8px] text-muted-foreground">{contrato.assinatura.parceiro.papel}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex flex-col gap-6 pt-6 print:hidden">
          {!viewProfile?.contract_accepted && !isPreview && !somenteLeitura && (
            <>
              <div className="flex items-start space-x-3 bg-primary/5 p-4 rounded-lg border border-primary/10 w-full">
                <Checkbox 
                  id="terms" 
                  checked={accepted} 
                  onCheckedChange={(checked) => setAccepted(checked as boolean)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor="terms"
                    className="text-sm font-bold leading-snug cursor-pointer"
                  >
                    Li e aceito todos os termos do contrato de parceria comercial da Roder Máquinas e Equipamentos.
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Ao assinar, você confirma que todos os seus dados (incluindo a Chave PIX) estão corretos.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => setStep('data')} className="flex-1">
                  Corrigir Dados
                </Button>
                <Button 
                  className="flex-[2] py-6 text-lg font-black uppercase tracking-widest" 
                  disabled={!accepted || loading}
                  onClick={handleAccept}
                >
                  {loading ? 'Processando...' : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Assinar Contrato
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {(viewProfile?.contract_accepted || isPreview || somenteLeitura) && (
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
              Voltar para o App
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
