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
  const previewRate = searchParams.get('rate') ? parseFloat(searchParams.get('rate')!) : 2;

  useEffect(() => {
    // If impersonating, get out of here
    if (isImpersonating && !isPreview && !viewUid) {
      // Allow viewing when impersonating, but maybe some context is needed
      console.log('Viewing contract in simulation mode');
    }

    const loadProfile = async () => {
      if (viewUid) {
        const docRef = doc(db, 'users', viewUid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setViewProfile(data);
          setStep('contract'); // Admins go straight to contract
        }
      } else if (currentProfile) {
        setViewProfile(currentProfile);
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
        if (currentProfile.contract_accepted && !isPreview && !viewUid) {
          navigate('/');
        }
      }
    };
    loadProfile();
  }, [currentProfile, viewUid, isPreview, navigate]);

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

  const handleShareWhatsApp = () => {
    const text = `Olá! Segue o contrato de parceria da Roder Máquinas e Equipamentos.\n\nVisualize aqui: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const commissionRate = isPreview ? previewRate : (viewProfile?.commission_rate || 2);
  const displayName = isPreview ? 'NOME DO PARCEIRO' : (step === 'contract' ? formData.name : viewProfile?.name);
  const displayPix = isPreview ? 'CHAVE PIX AQUI' : (step === 'contract' ? (formData.pix_key || 'A PREENCHER NO PERFIL') : (viewProfile?.pix_key || 'A PREENCHER NO PERFIL'));
  const displayEmail = isPreview ? 'EMAIL@EXEMPLO.COM' : (step === 'contract' ? (formData.email || 'A PREENCHER NO PERFIL') : (viewProfile?.email || 'A PREENCHER NO PERFIL'));
  const displayPhone = isPreview ? '(00) 00000-0000' : (step === 'contract' ? formData.phone : viewProfile?.phone);

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12 print:p-0 print:bg-white">
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
          
          {(isPreview || viewUid) && (
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
                <h3 className="font-black uppercase text-xs tracking-widest text-primary print:text-black">Instrumento Particular de Parceria Comercial</h3>
                <p className="text-[10px] text-muted-foreground">Versão 2024.4 - Atualizado em 08/05/2026</p>
                <p>
                  Pelo presente instrumento particular, de um lado <strong>RODER MÁQUINAS E EQUIPAMENTOS</strong>, inscrita no CNPJ sob nº 05.420.841/0001-71, com sede em Pardinho/SP, doravante denominada <strong>RODER</strong>, 
                  e de outro lado o <strong>PARCEIRO INDICADOR</strong>, abaixo qualificado:
                </p>
                <div className="p-4 bg-muted/20 border border-border rounded space-y-1 text-xs">
                  <p><strong>NOME:</strong> {displayName}</p>
                  <p><strong>E-MAIL:</strong> {displayEmail}</p>
                  <p><strong>TELEFONE:</strong> {displayPhone}</p>
                  {currentProfile?.is_commissionable !== false && (
                    <p><strong>CHAVE PIX PARA PAGAMENTO:</strong> {displayPix}</p>
                  )}
                </div>
                <p>Resolvem celebrar o presente contrato de parceria comercial conforme as cláusulas abaixo:</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black uppercase text-xs tracking-widest text-primary print:text-black">CLÁUSULA 1ª – DO OBJETO</h3>
                <p>
                  1.1. O presente contrato tem por objeto a intermediação de vendas de equipamentos da <strong>RODER</strong> pelo <strong>PARCEIRO INDICADOR</strong>, através do sistema de indicações via aplicativo.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black uppercase text-xs tracking-widest text-primary print:text-black">CLÁUSULA 2ª – DAS COMISSÕES E BASE DE CÁLCULO</h3>
                <p>
                  2.1. O <strong>PARCEIRO INDICADOR</strong> fará jus a uma comissão de <strong>{commissionRate}% ({commissionRate === 1 ? 'um' : commissionRate === 2 ? 'dois' : commissionRate === 3 ? 'três' : commissionRate} por cento)</strong> sobre o <strong>VALOR BASE DE TABELA</strong> do equipamento vendido.
                </p>
                <p>
                  2.2. <strong>Base de Cálculo:</strong> A comissão incide exclusivamente sobre o valor bruto de tabela do equipamento (Roder ou FAE).
                </p>
                <p>
                  2.3. <strong>Exclusões:</strong> Estão expressamente excluídos da base de cálculo os valores de: kits de instalação, suportes, adaptadores, componentes hidráulicos, mão de obra, serviços técnicos, acessórios e frete.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black uppercase text-xs tracking-widest text-primary print:text-black">CLÁUSULA 3ª – DA VALIDADE DAS PROPOSTAS E RENOVAÇÃO</h3>
                <p>
                  3.1. <strong>Prazo de Validade:</strong> Cada orçamento terá validade de <strong>60 (sessenta) dias corridos</strong>, contados a partir do upload do orçamento no aplicativo.
                </p>
                <p>
                  3.2. <strong>Cancelamento Automático:</strong> Após 60 dias sem fechamento, a proposta é automaticamente cancelada pelo sistema.
                </p>
                <p>
                  3.3. <strong>Renovação:</strong> Para reativar uma proposta vencida, o <strong>PARCEIRO INDICADOR</strong> deve solicitar uma atualização de preços e anexar prova de interesse atual do cliente (print ou áudio).
                </p>
                <p>
                  3.4. <strong>Regra de Relacionamento (Bypass):</strong> Se o cliente procurar a <strong>RODER</strong> diretamente após o vencimento dos 60 dias para atualizar o orçamento, sem passar pelo indicador, a comissão deixará de ser devida ao <strong>PARCEIRO INDICADOR</strong>.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black uppercase text-xs tracking-widest text-primary print:text-black">CLÁUSULA 4ª – DOS CRITÉRIOS DE ELEGIBILIDADE (PROTEÇÃO DE LEADS)</h3>
                <p>
                  4.1. <strong>Regra de Oferta Aberta:</strong> A aceitação da indicação depende da inexistência de negociações ou orçamentos em aberto para o cliente na plataforma <strong>RODER INDICA</strong> ou no <strong>CRM AGENDOR</strong> da empresa.
                </p>
                <p>
                  4.2. <strong>Ineligibilidade por Negociação Ativa:</strong> Caso Luana verifique que já existe uma oferta ou negociação em aberto com o cliente nos últimos <strong>60 (sessenta) dias</strong>, a indicação não será aceita. O indicador receberá a mensagem de que o cliente já está em negociação direta com a empresa.
                </p>
                <p>
                  4.3. <strong>Elegibilidade por Inatividade ou Novo Produto:</strong> A indicação será aceita normalmente se: (a) Não houver oferta aberta nos últimos 60 dias; ou (b) Tratar-se de uma indicação para um equipamento significativamente diferente do que já está em negociação, <strong>desde que realizada pelo mesmo parceiro indicador</strong>.
                </p>
                <p>
                  4.4. <strong>Encaminhamento Preferencial:</strong> Caso o cliente já esteja cadastrado no CRM com uma vendedora interna responsável, a indicação aceita será obrigatoriamente encaminhada para a mesma vendedora, mantendo a continuidade do atendimento.
                </p>
                <p>
                  4.5. <strong>Proteção contra Multi-Indicadores:</strong> Caso outro parceiro indicador realize uma indicação para um cliente que já possua negociação ativa ou orçamento aberto (dentro do prazo de 60 dias), independentemente do equipamento indicado, a indicação deste segundo parceiro será recusada em favor do atendimento já iniciado e do primeiro indicador validado.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black uppercase text-xs tracking-widest text-primary print:text-black">CLÁUSULA 5ª – DA RECORRÊNCIA E RESPONSABILIDADE</h3>
                <p>
                  5.1. A primeira venda da indicação validada será integralmente comissionada ao <strong>PARCEIRO INDICADOR</strong>.
                </p>
                <p>
                  5.2. O <strong>PARCEIRO INDICADOR</strong> não é um vendedor fixo responsável pela conta do cliente.
                </p>
                <p>
                  5.3. <strong>Vendas Futuras:</strong> Para receber comissões em novas vendas para o mesmo cliente, o <strong>PARCEIRO INDICADOR</strong> deve abrir uma nova solicitação no aplicativo. Se o cliente procurar a <strong>RODER</strong> diretamente para novas compras, entende-se que ele deseja atendimento direto, e nenhuma comissão será devida ao indicador.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black uppercase text-xs tracking-widest text-primary print:text-black">CLÁUSULA 6ª – DO CICLO DE FATURAMENTO E PAGAMENTO</h3>
                <p>
                  6.1. <strong>Período de Apuração:</strong> As comissões serão somadas com base nas vendas efetivadas do dia 01 ao último dia do mês anterior.
                </p>
                <p>
                  6.2. <strong>Relatório Mensal:</strong> No dia 01 de cada mês, o <strong>PARCEIRO INDICADOR</strong> receberá via aplicativo um relatório com os valores das comissões apuradas.
                </p>
                <p>
                  6.3. <strong>Nota Fiscal:</strong> Com base no relatório, o <strong>PARCEIRO INDICADOR</strong> deverá emitir a Nota Fiscal de Prestação de Serviços e realizar o carregamento (upload) no aplicativo impreterivelmente até o dia <strong>05 do mês vigente</strong>.
                </p>
                <p>
                  6.4. <strong>Consequência de Atraso:</strong> Ao descumprir o prazo de envio da Nota Fiscal até o dia 05, o referido pagamento será automaticamente postergado para o ciclo de pagamento do mês subsequente, condicionado ao envio da mesma.
                </p>
                <p>
                  6.5. <strong>Pagamento:</strong> Após o recebimento e validação da Nota Fiscal via aplicativo, o financeiro da <strong>RODER</strong> realizará o pagamento via PIX na chave cadastrada até o dia 10 do mês, desde que o prazo da cláusula 6.3 tenha sido respeitado.
                </p>
                <p>
                  6.6. <strong>Comprovante:</strong> O financeiro anexará o comprovante de pagamento diretamente no aplicativo para consulta do <strong>PARCEIRO INDICADOR</strong>.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black uppercase text-xs tracking-widest text-primary print:text-black">CLÁUSULA 7ª – DISPOSIÇÕES GERAIS</h3>
                <p>
                  7.1. <strong>Confidencialidade:</strong> O <strong>PARCEIRO INDICADOR</strong> obriga-se a manter sigilo sobre tabelas de preços e dados estratégicos da <strong>RODER</strong>.
                </p>
                <p>
                  7.2. <strong>LGPD:</strong> As partes declaram conformidade com a Lei Geral de Proteção de Dados no tratamento das informações de clientes.
                </p>
              </section>

              <div className="pt-12 border-t border-border/50 text-center space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="border-b border-black h-12 flex items-end justify-center pb-1">
                      <span className="text-[9px] italic text-muted-foreground uppercase font-bold">Assinado Digitalmente via App</span>
                    </div>
                    <p className="text-[10px] font-black uppercase">RODER MÁQUINAS E EQUIPAMENTOS</p>
                    <p className="text-[8px] text-muted-foreground">CNPJ: 05.420.841/0001-71</p>
                  </div>
                  <div className="space-y-2">
                    <div className="border-b border-black h-12 flex items-end justify-center pb-1">
                      {viewProfile?.contract_accepted || accepted ? (
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] italic font-bold text-primary">ASSINADO DIGITALMENTE</span>
                          <span className="text-[8px] text-muted-foreground">EM {viewProfile?.contract_accepted_at ? new Date(viewProfile.contract_accepted_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">Aguardando Assinatura</span>
                      )}
                    </div>
                    <p className="text-[10px] font-black uppercase">{displayName}</p>
                    <p className="text-[8px] text-muted-foreground">PARCEIRO INDICADOR</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex flex-col gap-6 pt-6 print:hidden">
          {!viewProfile?.contract_accepted && !isPreview && (
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

          {(viewProfile?.contract_accepted || isPreview) && (
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
              Voltar para o App
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
