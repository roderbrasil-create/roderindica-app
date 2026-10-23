import React, { useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { maskPhone, maskCpfCnpj } from '../lib/masks';
import { enderecoDoContratoAssinado, dataDaAssinatura } from '../lib/contratoAssinado';
import { dadosDoPerfil, houveAlteracao, formularioAposPerfil } from '../lib/conta';
import { useEhParceiro } from '../components/parceiro/NavParceiro';

const cartao = 'bg-card border border-border rounded-2xl p-4 shadow-sm';
const titulo = 'text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-3';
const campo = 'h-11 text-base md:text-sm bg-background border-border';
const rotulo = 'text-xs font-bold text-foreground/80';

export default function Profile() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const ehParceiro = useEhParceiro();
  const [loading, setLoading] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [bancoAberto, setBancoAberto] = useState(false);

  // o que está gravado: base da comparação e do "Descartar"
  const original = useMemo(() => dadosDoPerfil(profile), [profile]);
  const [formData, setFormData] = useState(original);

  // perfil atualizado durante a edição não apaga o que a pessoa digitou
  const originalAnterior = React.useRef(original);
  React.useEffect(() => {
    if (!profile) return;
    const anterior = originalAnterior.current;
    originalAnterior.current = original;
    setFormData(atual => formularioAposPerfil(atual, anterior, original));
  }, [profile, original]);

  const alterado = houveAlteracao(formData, original);

  // enquanto a barra de salvar aparece, o botão flutuante do consultor sobe acima dela
  React.useEffect(() => {
    if (!alterado) return;
    document.body.setAttribute('data-barra-salvar', '1');
    return () => document.body.removeAttribute('data-barra-salvar');
  }, [alterado]);

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

  const descartar = () => setFormData(original);

  const mostraPagamento = profile?.role === 'external_seller' || profile?.is_commissionable !== false;
  const dataContrato = dataDaAssinatura(profile?.contract_accepted_at);

  return (
    <Layout>
      <div className={`max-w-3xl mx-auto space-y-3.5 ${alterado ? 'pb-40 md:pb-28' : ''}`}>
        {profile?.role === 'external_seller' && (
          profile?.contract_accepted ? (
            <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              {dataContrato ? `Contrato assinado em ${dataContrato}` : 'Contrato assinado'}
            </span>
          ) : (
            <button type="button" onClick={() => navigate('/contrato')} className="inline-flex items-center min-h-11 text-[11px] font-bold text-orange-700 bg-orange-100 px-3 rounded-full">
              Contrato pendente · Assinar agora
            </button>
          )
        )}

        <section className={cartao}>
          <h2 className={titulo}>Meus dados</h2>
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="name" className={rotulo}>Nome completo</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={campo} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="email" className={rotulo}>E-mail de login</Label>
              {/* o e-mail do cadastro é o do login: as regras só aceitam esse (ou vazio) no próprio cadastro */}
              <Input id="email" type="email" value={formData.email} readOnly={profile?.role !== 'admin'} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`${campo} ${profile?.role !== 'admin' ? 'bg-muted/50 text-muted-foreground' : ''}`} />
              {profile?.role !== 'admin' && <p className="text-[11px] text-muted-foreground">Para trocar, fale com a Roder.</p>}
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label htmlFor="phone" className={rotulo}>WhatsApp</Label>
              <Input id="phone" inputMode="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })} className={campo} />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label htmlFor="document" className={rotulo}>CPF / CNPJ</Label>
              <Input id="document" inputMode="numeric" value={formData.cpf_cnpj} onChange={(e) => setFormData({ ...formData, cpf_cnpj: maskCpfCnpj(e.target.value) })} className={campo} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="company" className={rotulo}>Empresa (razão social)</Label>
              <Input id="company" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className={campo} placeholder="Se tiver empresa aberta para receber" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city" className={rotulo}>Cidade</Label>
              <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className={campo} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state" className={rotulo}>Estado</Label>
              <Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className={campo} />
            </div>
          </div>
        </section>

        {mostraPagamento && (
          <section className={cartao}>
            <h2 className={titulo}>Como você recebe</h2>
            <div className="space-y-1.5">
              <Label htmlFor="pix" className={rotulo}>Chave PIX</Label>
              <Input id="pix" value={formData.pix_key} onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })} className={`${campo} bg-orange-50 border-orange-300 border-[1.5px] focus:border-primary`} />
            </div>
            {formData.company_name && (
              <p className="mt-2 text-xs text-orange-800 bg-orange-50 rounded-lg px-3 py-2 leading-snug">
                Como você usa dados de empresa, a chave PIX deve ser do mesmo CNPJ.
              </p>
            )}
            <button type="button" aria-expanded={bancoAberto} onClick={() => setBancoAberto(v => !v)} className="mt-3 w-full min-h-11 flex items-center justify-between text-[13px] font-bold text-foreground/80">
              <span>Dados bancários (opcional)</span>
              {bancoAberto ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
            {bancoAberto && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className={rotulo}>Banco</Label>
                  <Input value={formData.bank_info.bank} onChange={(e) => setFormData({ ...formData, bank_info: { ...formData.bank_info, bank: e.target.value } })} className={campo} />
                </div>
                <div className="space-y-1.5">
                  <Label className={rotulo}>Agência</Label>
                  <Input value={formData.bank_info.agency} onChange={(e) => setFormData({ ...formData, bank_info: { ...formData.bank_info, agency: e.target.value } })} className={campo} />
                </div>
                <div className="space-y-1.5">
                  <Label className={rotulo}>Conta</Label>
                  <Input value={formData.bank_info.account} onChange={(e) => setFormData({ ...formData, bank_info: { ...formData.bank_info, account: e.target.value } })} className={campo} />
                </div>
              </div>
            )}
          </section>
        )}

        {profile?.role === 'external_seller' && (
          <section className={cartao}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Contrato de parceria</p>
                <p className="text-[11px] text-muted-foreground">{profile?.contract_accepted ? (dataContrato ? `Assinado em ${dataContrato}` : 'Assinado') : 'Pendente de assinatura'}</p>
              </div>
              {profile?.contract_accepted ? (
                <button type="button" className="min-h-11 min-w-11 px-2 text-[13px] font-extrabold text-primary" onClick={() => navigate(enderecoDoContratoAssinado(profile.uid))}>Ver</button>
              ) : (
                <button type="button" className="min-h-11 min-w-11 px-2 text-[13px] font-extrabold text-primary" onClick={() => navigate('/contrato')}>Assinar</button>
              )}
            </div>
          </section>
        )}

        <section className={cartao}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Dúvidas sobre contrato ou comissões?</p>
              <p className="text-[11px] text-muted-foreground">Fale com o comercial da Roder</p>
            </div>
            <button type="button" className="min-h-11 min-w-11 px-2 text-[13px] font-extrabold text-primary" onClick={() => window.open('https://wa.me/551431615110', '_blank')}>Falar</button>
          </div>
        </section>
      </div>

      {/* barra de salvar: só com alteração. No celular fica acima da barra de baixo do parceiro e respeita a área segura */}
      {alterado && (
        <style>{`
          body[data-barra-salvar] .roder-botao-consultor { bottom: calc(88px + env(safe-area-inset-bottom, 0px)) !important; }
          @media (max-width: 767.98px) {
            body[data-barra-salvar] .roder-botao-consultor { bottom: calc(${ehParceiro ? 152 : 88}px + env(safe-area-inset-bottom, 0px)) !important; }
          }
        `}</style>
      )}
      {alterado && (
        <div
          className={`fixed left-0 right-0 md:left-56 z-[45] bg-card border-t border-border shadow-[0_-4px_14px_rgba(0,0,0,0.08)] px-4 pt-2.5 flex gap-2.5 md:pb-3 ${ehParceiro ? 'bottom-[calc(64px+env(safe-area-inset-bottom,0px))] pb-2.5 md:bottom-0' : 'bottom-0 pb-[calc(10px+env(safe-area-inset-bottom,0px))]'}`}
        >
          <div className="max-w-3xl mx-auto w-full flex gap-2.5">
            <Button type="button" variant="outline" className="h-12 px-5 font-bold" onClick={descartar} disabled={loading}>Descartar</Button>
            <Button type="button" className="h-12 flex-1 font-extrabold text-[15px]" onClick={handleUpdate} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
