import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, ProductModel } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight, Package, User, Building, Phone, Mail, FileText, MapPin, Briefcase, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export default function PublicBudgetRequest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modelId = searchParams.get('mid');
  const productId = searchParams.get('pid');
  const indicatorId = searchParams.get('uid') || searchParams.get('indicatorId');
  const urlProductName = searchParams.get('pn') || searchParams.get('pName');
  const urlModelName = searchParams.get('mn') || searchParams.get('mName');
  const urlIndicatorName = searchParams.get('in') || searchParams.get('iName');

  const [product, setProduct] = useState<Product | null>(null);
  const [model, setModel] = useState<ProductModel | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(modelId);
  const [indicatorName, setIndicatorName] = useState<string | null>(urlIndicatorName ? decodeURIComponent(urlIndicatorName) : null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedModelId]);

  const displayProductName = product?.name || (urlProductName && urlProductName !== 'null' ? decodeURIComponent(urlProductName) : 'Equipamento Roder');
  
  // Model logic: prioritize selected model state
  const activeModel = product?.models?.find(m => m.id === selectedModelId) || model;
  const displayModelName = activeModel?.name || (urlModelName && urlModelName !== 'null' ? decodeURIComponent(urlModelName) : '');

  const images = activeModel?.images?.length ? activeModel.images : (product?.image_url ? [product.image_url] : []);

  const [formData, setFormData] = useState({
    client_name: '',
    client_cnpj: '',
    client_phone: '',
    client_email: '',
    company_name: '',
    client_location: '',
    base_machine: '',
    observations: ''
  });

  const maskPhone = (value: string) => {
    let raw = value.replace(/\D/g, '');
    if (raw.length >= 12 && raw.startsWith('55')) {
      raw = raw.substring(2);
    }
    if (raw.length <= 2) return raw;
    if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length <= 10) return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  };

  const maskDoc = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 11) {
      // CPF: 000.000.000-00
      if (raw.length <= 3) return raw;
      if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
      if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
      return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`;
    } else {
      // CNPJ: 00.000.000/0000-00
      const c = raw.slice(0, 14);
      if (c.length <= 2) return c;
      if (c.length <= 5) return `${c.slice(0, 2)}.${c.slice(2)}`;
      if (c.length <= 8) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5)}`;
      if (c.length <= 12) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8)}`;
      return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        if (productId && productId !== 'undefined' && productId !== 'null' && productId !== '') {
          const productSnap = await getDoc(doc(db, 'products', productId));
          if (productSnap.exists()) {
            const productData = { id: productSnap.id, ...productSnap.data() } as Product;
            setProduct(productData);
            
            const foundModel = productData.models?.find(m => m.id === modelId);
            if (foundModel) {
              setModel(foundModel);
            }
          }
        }

        if (indicatorId && indicatorId !== 'null' && indicatorId !== 'undefined' && indicatorId !== '') {
          const userSnap = await getDoc(doc(db, 'users', indicatorId));
          if (userSnap.exists()) {
            setIndicatorName(userSnap.data().name);
          }
        }
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [productId, modelId, indicatorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.client_phone || !formData.client_location) {
      toast.error('Por favor, preencha os campos obrigatórios (*)');
      return;
    }

    try {
      setSubmitting(true);
      
      const isPublic = !indicatorId || indicatorId === 'null' || indicatorId === 'undefined' || indicatorId === '';
      const finalIndicatorId = isPublic ? 'public_request' : indicatorId;
      
      const currentModelName = activeModel?.name || displayModelName;
      const finalProductName = `${displayProductName} ${currentModelName}`.trim();

      // Final attempt to get indicator name if it's still missing but we have an ID
      // We prioritize the URL name (indicatorName state) as it's what the seller sent
      let finalIndicatorName = indicatorName;
      if (!isPublic && !finalIndicatorName && indicatorId) {
        try {
          const userSnap = await getDoc(doc(db, 'users', indicatorId));
          if (userSnap.exists()) {
            finalIndicatorName = userSnap.data().name;
          }
        } catch (e) {
          console.error("Error on final indicator check:", e);
        }
      }
      
      const initialHistoryEntry = {
        id: Math.random().toString(36).substring(2, 11),
        type: 'system',
        author_name: 'Sistema (Catálogo)',
        created_at: new Date().toISOString(),
        content: `Solicitação inicial recebida via link do catálogo.\n\nEQUIPAMENTO: ${finalProductName}\n\nDESCRIÇÃO/DETALHES: ${formData.observations || 'Nenhum detalhe adicional informado pelo cliente.'}\n\nMÁQUINA BASE: ${formData.base_machine || 'Não informada'}`,
        attachments: []
      };

      const indicationData = {
        external_seller_uid: finalIndicatorId,
        external_seller_name: finalIndicatorName || (isPublic ? 'Solicitação Direta (Site)' : 'Vendedor Parceiro'),
        client_name: formData.client_name,
        client_cnpj: formData.client_cnpj,
        client_phone: formData.client_phone,
        client_email: formData.client_email,
        client_location: formData.client_location,
        company_name: formData.company_name,
        base_machine: formData.base_machine,
        items: [{
          product_name: finalProductName,
          quantity: 1
        }],
        description: formData.observations || `Solicitação de orçamento realizada diretamente pelo cliente via link do catálogo.\nEquipamento: ${finalProductName}`,
        status: 'pending',
        negotiation_history: [initialHistoryEntry],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_type: 'client'
      };

      await addDoc(collection(db, 'indications'), indicationData);
      
      // We set submitted immediately after the main record is created
      setSubmitted(true);
      toast.success('Solicitação enviada com sucesso!');

      // Notifications are secondary and might fail due to auth rules (unauthenticated clients)
      // This is expected and shouldn't affect the user experience
      try {
        await addDoc(collection(db, 'notifications'), {
          user_uid: 'luana_triagem_placeholder', 
          title: 'Novo Auto-Pedido de Orçamento',
          message: `Cliente ${formData.client_name} solicitou orçamento de ${finalProductName}`,
          type: 'info',
          read: false,
          link: '/triagem',
          created_at: new Date().toISOString()
        });

        if (!isPublic && indicatorId) {
          await addDoc(collection(db, 'notifications'), {
            user_uid: indicatorId,
            title: 'Pedido gerado pelo seu link!',
            message: `O cliente ${formData.client_name} acabou de pedir um orçamento para ${finalProductName} usando seu link.`,
            type: 'success',
            read: false,
            link: '/indicacoes',
            created_at: new Date().toISOString()
          });
        }
      } catch (notifyErr) {
        console.warn('Silent notification failure (likely unauthenticated client):', notifyErr);
      }
    } catch (err) {
      console.error('Error submitting budget request:', err);
      toast.error('Erro ao enviar solicitação. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 text-center text-white">
        <div className="bg-green-500/10 p-6 rounded-full mb-6">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-black mb-4 uppercase tracking-tight">Solicitação Recebida!</h1>
        <p className="text-slate-400 max-w-md mb-8">
          Obrigado, <span className="text-white font-bold">{formData.client_name}</span>! Nossa equipe entrará em contato em breve para apresentar a melhor solução.
        </p>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 w-full max-w-sm text-left">
          <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest text-center">Referência do Equipamento</p>
          <p className="text-white font-bold leading-tight text-center">{displayProductName}</p>
          <p className="text-primary font-black uppercase text-xs text-center">{displayModelName}</p>
        </div>
        <Button variant="ghost" className="text-slate-500" onClick={() => window.close()}>Fechar Janela</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-lg">
        {/* Roder Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative">
            <div className="absolute -inset-1 bg-primary rounded-full blur opacity-25"></div>
            <div className="relative w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border-2 border-primary shadow-2xl">
              <span className="text-white font-black text-4xl italic select-none">R</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">Roder Brasil</h1>
            <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em]">Indica V2 • Orçamentos</p>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
          {images.length > 0 && (
            <div className="relative h-48 sm:h-64 bg-slate-950 flex items-center justify-center p-4">
              <img 
                src={images[currentImageIndex]} 
                alt={displayProductName} 
                className="max-w-full max-h-full object-contain drop-shadow-2xl"
                referrerPolicy="no-referrer"
              />
              
              {images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                    className="pointer-events-auto h-8 w-8 rounded-full bg-slate-900/60 text-white border border-slate-700/50 backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                    className="pointer-events-auto h-8 w-8 rounded-full bg-slate-900/60 text-white border border-slate-700/50 backdrop-blur-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 bg-slate-900/40 rounded-full backdrop-blur-sm border border-slate-700/20">
                {images.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      currentImageIndex === i ? "w-4 bg-primary" : "w-1.5 bg-slate-500/50"
                    )} 
                  />
                ))}
              </div>
            </div>
          )}
          <div className="h-1.5 w-full bg-primary"></div>
          <CardHeader className="pb-6">
            <div className="bg-slate-800/40 p-4 rounded-xl mb-6 border border-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700/50 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Produto de Interesse</p>
                  <h2 className="text-lg font-black text-white uppercase leading-tight truncate">
                    {displayProductName}
                  </h2>
                  <p className="text-primary font-black text-xs uppercase tracking-wider">{displayModelName}</p>
                </div>
              </div>
            </div>
            <CardTitle className="text-xl font-black text-white uppercase flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Solicitar Orçamento
            </CardTitle>
            <CardDescription className="text-slate-400">
              Preencha os campos abaixo para que nossa equipe entre em contato.
            </CardDescription>
            {indicatorName && (
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <User className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Indicado por:</span>
                </div>
                <span className="text-white font-bold text-xs">{indicatorName}</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="client_name" className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    id="client_name"
                    placeholder="Seu nome aqui"
                    className="bg-slate-950/50 border-slate-800 pl-10 h-12 focus:ring-primary focus:border-primary text-white"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white">
                <div className="space-y-2">
                  <Label htmlFor="client_phone" className="text-[10px] uppercase font-black text-slate-500 tracking-wider">WhatsApp *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="client_phone"
                      placeholder="(00) 00000-0000"
                      className="bg-slate-950/50 border-slate-800 pl-10 h-12 focus:ring-primary focus:border-primary text-white"
                      value={formData.client_phone}
                      onChange={(e) => setFormData({ ...formData, client_phone: maskPhone(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_location" className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Cidade / Estado *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="client_location"
                      placeholder="Ex: São Paulo - SP"
                      className="bg-slate-950/50 border-slate-800 pl-10 h-12 focus:ring-primary focus:border-primary text-white"
                      value={formData.client_location}
                      onChange={(e) => setFormData({ ...formData, client_location: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Nome da Empresa</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    id="company_name"
                    placeholder="Opcional"
                    className="bg-slate-950/50 border-slate-800 pl-10 h-12 focus:ring-primary focus:border-primary text-white"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_cnpj" className="text-[10px] uppercase font-black text-slate-500 tracking-wider">CPF ou CNPJ (Opcional)</Label>
                <div className="relative text-white">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    id="client_cnpj"
                    placeholder="000.000.000-00 ou CNPJ"
                    className="bg-slate-950/50 border-slate-800 pl-10 h-12 focus:ring-primary focus:border-primary text-white font-mono"
                    value={formData.client_cnpj}
                    onChange={(e) => setFormData({ ...formData, client_cnpj: maskDoc(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_machine" className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Máquina Base (Marca/Modelo)</Label>
                <Input 
                  id="base_machine"
                  placeholder="Ex: Escavadeira CAT 320"
                  className="bg-slate-950/50 border-slate-800 h-12 focus:ring-primary focus:border-primary text-white"
                  value={formData.base_machine}
                  onChange={(e) => setFormData({ ...formData, base_machine: e.target.value })}
                />
              </div>

              {/* Model Selection for Product Family Shares */}
              {product?.models && product.models.length > 0 && !modelId && (
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-primary tracking-wider flex items-center gap-1.5">
                    <Settings className="h-3 w-3" /> Selecione o Modelo Desejado (Opcional)
                  </Label>
                  <Select 
                    value={selectedModelId || "none"} 
                    onValueChange={(val) => setSelectedModelId(val === "none" ? null : val)}
                  >
                    <SelectTrigger className="bg-slate-950/50 border-slate-800 h-12 focus:ring-primary focus:border-primary text-white">
                      <SelectValue placeholder="Selecione um modelo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="none" className="focus:bg-primary/20">Não tenho certeza / Ver depois</SelectItem>
                      {product.models.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="focus:bg-primary/20">
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[9px] text-slate-500 italic">Caso não saiba o modelo exato, fique tranquilo! Nossa equipe ajudará a identificar.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observations" className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Descreva sua solicitação</Label>
                <Textarea 
                  id="observations"
                  placeholder="Ex: Gostaria de saber o prazo de entrega para Sinop-MT. - O preço do equipamento - Mais o ponteiro - Mais o rotor. Ou seja, descreva os acessórios que você precisa para ir com sua máquina. Também indique se você deseja que a instalação seja feita por um técnico da Roder."
                  className="bg-slate-950/50 border-slate-800 min-h-[120px] focus:ring-primary focus:border-primary text-white resize-none"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-black uppercase tracking-widest bg-primary hover:bg-primary/90 mt-4 shadow-xl shadow-primary/20"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitação'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {indicatorName && (
          <div className="mt-8 text-center">
            <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest mb-2">
              Atendimento Vinculado
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full">
              <User className="h-3 w-3 text-primary" />
              <span className="text-slate-300 font-bold text-xs">{indicatorName}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
