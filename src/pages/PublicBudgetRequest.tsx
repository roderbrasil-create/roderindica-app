import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { cn, getApiBaseUrl } from '../lib/utils';
import { abrirDocumento } from '../lib/abrirDocumento';
import { precisaInstalacao } from '../lib/instalacao';
import { ImageLightbox } from '../components/ui/ImageLightbox';

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
  const [submissionStep, setSubmissionStep] = useState<'saving' | 'notifying'>('saving');
  const [submitted, setSubmitted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const [mostrarExtras, setMostrarExtras] = useState(false);
  const [fotoAberta, setFotoAberta] = useState(false);
  const [cidades, setCidades] = useState<string[] | null>(null);
  const [cidadeFoco, setCidadeFoco] = useState(false);
  const [cidadeIndice, setCidadeIndice] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedModelId]);

  const displayProductName = product?.name || (urlProductName && urlProductName !== 'null' ? decodeURIComponent(urlProductName) : 'Equipamento Roder');
  
  // Model logic: prioritize selected model state
  const activeModel = product?.models?.find(m => m.id === selectedModelId) || model;
  const displayModelName = activeModel?.name || (urlModelName && urlModelName !== 'null' ? decodeURIComponent(urlModelName) : '');

  // fotos do endereço antigo do AI Studio (run.app) não abrem mais: ficam de fora
  const fotoValida = (u?: string) => !!u && !/\.run\.app\//.test(u);
  const fotosModelo = (activeModel?.images || []).filter(fotoValida);
  const images = fotosModelo.length ? fotosModelo : (fotoValida(product?.image_url) ? [product!.image_url] : []);

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
    // número de fora do Brasil (+54, +595...): fica como a pessoa digitou
    if (value.trim().startsWith('+')) return value;
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

  // A barra anda sozinha enquanto espera, para a pessoa ver que está enviando e não fechar
  useEffect(() => {
    if (!submitting) return;
    const t = setInterval(() => setProgresso(p => (p < 92 ? p + 1 : p)), 120);
    return () => clearInterval(t);
  }, [submitting]);

  // Lista de cidades (IBGE, 5.570 municípios), baixada só quando a pessoa toca no campo
  const carregarCidades = async () => {
    if (cidades) return;
    try {
      const txt = await (await fetch('/cidades-br.txt')).text();
      const lista: string[] = [];
      txt.split('\n').forEach(linha => {
        const [uf, nomes] = linha.split(':');
        (nomes || '').split('|').forEach(n => n && lista.push(`${n} - ${uf}`));
      });
      setCidades(lista);
    } catch { setCidades([]); }
  };
  const semAcento = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const sugestoes = useMemo(() => {
    const q = semAcento(formData.client_location.trim());
    if (!cidades || q.length < 2 || / - [A-Z]{2}$/.test(formData.client_location)) return [];
    const comeca: string[] = [], contem: string[] = [];
    for (const c of cidades) {
      const n = semAcento(c);
      if (n.startsWith(q)) comeca.push(c); else if (n.includes(q)) contem.push(c);
      if (comeca.length >= 6) break;
    }
    return [...comeca, ...contem].slice(0, 6);
  }, [cidades, formData.client_location]);

  // Enter passa para o próximo campo. Em Observações (último), o Enter pula linha.
  const aoTeclar = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const alvo = e.target as HTMLElement;
    if (e.key !== 'Enter' || alvo.tagName === 'TEXTAREA') return;
    e.preventDefault();
    if (alvo.id === 'client_location' && sugestoes.length && cidadeFoco) {
      setFormData(f => ({ ...f, client_location: sugestoes[cidadeIndice] || sugestoes[0] }));
    }
    const campos = Array.from(formRef.current?.querySelectorAll<HTMLElement>('input, textarea') || []);
    const i = campos.indexOf(alvo);
    if (i >= 0 && campos[i + 1]) campos[i + 1].focus();
  };

  const detectExportLead = (location: string, phone: string, obs: string) => {
    const combined = `${location} ${phone} ${obs}`.toLowerCase();
    
    if (combined.includes('argentina') || combined.includes('misiones') || combined.includes('buenos aires') || combined.includes('eldorado') || combined.includes('posadas') || combined.includes('corrientes') || combined.includes('córdoba') || combined.includes('rosario')) {
      return { isExport: true, country: 'Argentina' };
    }
    if (combined.includes('paraguai') || combined.includes('paraguay') || combined.includes('asuncion') || combined.includes('asunción') || combined.includes('ciudad del este')) {
      return { isExport: true, country: 'Paraguai' };
    }
    if (combined.includes('uruguai') || combined.includes('uruguay') || combined.includes('montevideo')) {
      return { isExport: true, country: 'Uruguai' };
    }
    if (combined.includes('chile') || combined.includes('santiago')) {
      return { isExport: true, country: 'Chile' };
    }
    if (combined.includes('bolivia') || combined.includes('bolívia') || combined.includes('santa cruz de la sierra')) {
      return { isExport: true, country: 'Bolívia' };
    }
    if (combined.includes('peru') || combined.includes('perú') || combined.includes('lima')) {
      return { isExport: true, country: 'Peru' };
    }
    if (combined.includes('colombia') || combined.includes('colômbia') || combined.includes('bogota') || combined.includes('bogotá') || combined.includes('medellin') || combined.includes('medellín')) {
      return { isExport: true, country: 'Colômbia' };
    }
    if (combined.includes('mexico') || combined.includes('méxico')) {
      return { isExport: true, country: 'México' };
    }
    if (combined.includes('estados unidos') || combined.includes('usa') || combined.includes('united states') || combined.includes('miami') || combined.includes('florida')) {
      return { isExport: true, country: 'Estados Unidos' };
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (phone.includes('+54') || (cleanPhone.length >= 10 && cleanPhone.startsWith('54')) || cleanPhone.startsWith('03751') || cleanPhone.startsWith('3751')) {
      return { isExport: true, country: 'Argentina' };
    }
    if (phone.includes('+595') || (cleanPhone.length >= 10 && cleanPhone.startsWith('595'))) {
      return { isExport: true, country: 'Paraguai' };
    }
    if (phone.includes('+598') || (cleanPhone.length >= 10 && cleanPhone.startsWith('598'))) {
      return { isExport: true, country: 'Uruguai' };
    }
    if (phone.includes('+56') || (cleanPhone.length >= 10 && cleanPhone.startsWith('56'))) {
      return { isExport: true, country: 'Chile' };
    }
    if (phone.includes('+1') || cleanPhone.startsWith('1')) {
      return { isExport: true, country: 'Internacional / EUA' };
    }
    
    if (combined.includes('buenos dias') || combined.includes('bueno dias') || combined.includes('podrías cotizar') || combined.includes('podrias cotizar') || combined.includes('excavadora') || combined.includes('implementos') || combined.includes('gracias')) {
      return { isExport: true, country: 'Internacional / América Latina' };
    }

    return { isExport: false, country: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.client_phone || !formData.client_location) {
      toast.error('Por favor, preencha os campos obrigatórios (*)');
      return;
    }

    try {
      setSubmitting(true);
      setSubmissionStep('saving');
      setProgresso(8);
      
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

      // Detect export / international lead
      const exportCheck = detectExportLead(formData.client_location, formData.client_phone, formData.observations);
      const isExport = exportCheck.isExport;
      const exportCountry = exportCheck.country || 'Internacional';
      
      const yuryUid = "QfWBeRvpreTskZZGQxmr8cK6BIR2";
      const yuryName = "Yury Mello";
      const yuryEmail = "pecas@roderbrasil.com.br";
      
      const initialHistoryEntry = {
        id: Math.random().toString(36).substring(2, 11),
        type: 'system',
        author_name: isExport ? 'Sistema (Exportação)' : 'Sistema (Catálogo)',
        created_at: new Date().toISOString(),
        content: isExport 
          ? `🌎 SOLICITAÇÃO DE EXPORTAÇÃO (${exportCountry})\nAtendimento direcionado automaticamente para o consultor de exportação: ${yuryName}.\n\nEQUIPAMENTO: ${finalProductName}\n\nDESCRIÇÃO/DETALHES: ${formData.observations || 'Nenhum detalhe adicional informado pelo cliente.'}\n\nMÁQUINA BASE: ${formData.base_machine || 'Não informada'}`
          : `Solicitação inicial recebida via link do catálogo.\n\nEQUIPAMENTO: ${finalProductName}\n\nDESCRIÇÃO/DETALHES: ${formData.observations || 'Nenhum detalhe adicional informado pelo cliente.'}\n\nMÁQUINA BASE: ${formData.base_machine || 'Não informada'}`,
        attachments: []
      };

      const indicationData: any = {
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
        status: isExport ? 'negotiating' : 'pending',
        negotiation_history: [initialHistoryEntry],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_type: 'client',
        is_export: isExport,
        export_country: isExport ? exportCountry : undefined
      };

      if (isExport) {
        indicationData.internal_seller_uid = yuryUid;
        indicationData.internal_seller_name = yuryName;
        indicationData.internal_seller_email = yuryEmail;
        indicationData.duplicate_reviewed = true;
      }

      const novaRef = await addDoc(collection(db, 'indications'), indicationData);
      setProgresso(55);
      
      setSubmissionStep('notifying');
      // Send email notifications to managers (Admin, Gislene, and Luana)
      try {
        const { notifyNewIndication } = await import('../services/emailService');
        const primaryItem = finalProductName || 'Equipamento';
        const locationStr = formData.client_location || '';
        const locationParts = locationStr.includes('-') ? locationStr.split('-') : [locationStr, ''];

        const emailIndicationData = {
          client_name: formData.client_name,
          client_phone: formData.client_phone || 'Não informado',
          company_name: formData.company_name || formData.client_name,
          city: (locationParts[0] || '').trim(),
          state: (locationParts[1] || '').trim(),
          product_name: primaryItem
        };

        const creatorLabel = isPublic ? 'Solicitação Direta (Site)' : `Link de WhatsApp (${finalIndicatorName || 'Indicador'})`;
        await notifyNewIndication(emailIndicationData, creatorLabel);
      } catch (emailErr) {
        console.warn('Silent email notification failure:', emailErr);
      }

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

      setProgresso(85);
      // E-mail de confirmação para o cliente, quando ele deixou o e-mail
      if (formData.client_email.trim()) {
        try {
          await fetch(`${getApiBaseUrl()}/api/orcamento/confirmacao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              indicationId: novaRef.id,
              foto: images[0] || '',
              link: window.location.href,
              instalacao: comInstalacao,
            }),
          });
        } catch (e) { console.warn('Confirmação por e-mail não enviada:', e); }
      }
      setProgresso(100);
      await new Promise(r => setTimeout(r, 450));
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error submitting budget request:', err);
      toast.error('Erro ao enviar solicitação. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const palavrasNome = displayProductName.trim().split(/\s+/);
  const ultimaPalavra = palavrasNome[palavrasNome.length - 1] || '';
  const nomeBase = ultimaPalavra.length <= 4 && displayModelName.toUpperCase().startsWith(ultimaPalavra.toUpperCase()) ? palavrasNome.slice(0, -1).join(' ') : displayProductName;
  const tituloEquip = !displayModelName || nomeBase.toLowerCase().includes(displayModelName.toLowerCase()) ? nomeBase : `${nomeBase} ${displayModelName}`;
  const specs: Record<string, any> = (activeModel as any)?.technical_specs || {};
  const maquinaBase = String(specs.maquina_base || '').trim().replace(/\s*ton\.?$/i, ' t');
  const ehPa = /engate|carregadeira/i.test(`${displayProductName} ${displayModelName}`);
  const comInstalacao = precisaInstalacao(displayProductName, displayModelName, product?.category);
  const destaques = ([
    ['diametro_max_tora', 'Tora'], ['diametro_rachamento', 'Racha até'], ['diametro_corte', 'Corte'], ['diametro_max_corte', 'Corte'],
    ['abertura_maxima', 'Abertura'], ['volume', 'Volume'], ['capacidade_carga', 'Carga'], ['peso', 'Peso'], ['peso_do_equipamento', 'Peso'], ['peso_sem_rotator', 'Peso'],
  ] as [string, string][]).filter(([k]) => specs[k]).reduce<string[]>((acc, [k, rot]) => {
    if (acc.length < 2 && !acc.some(a => a.startsWith(rot))) acc.push(`${rot} ${specs[k]}`);
    return acc;
  }, []);
  const videoUrl = (activeModel as any)?.video_url || product?.video_url || '';
  const fichaUrl = (activeModel as any)?.pdf_url || product?.pdf_url || '';
  const primeiroNome = formData.client_name.trim().split(/\s+/)[0] || '';

  const Cabecalho = () => (
    <header className="bg-[#090909] flex items-center justify-center" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="h-[54px] flex items-center"><img src="/marca/roder-horizontal.png" alt="Roder Máquinas e Equipamentos" className="h-[34px]" /></div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9]">
        <Cabecalho />
        <div className="flex items-center justify-center py-24"><Loader2 className="h-9 w-9 animate-spin text-slate-500" /></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] text-slate-900">
        <Cabecalho />
        <div className="max-w-md mx-auto px-5 py-6 text-center">
          <div className="w-[70px] h-[70px] rounded-full bg-green-600 text-white flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-[22px] font-black">Solicitação enviada!</h1>
          <p className="text-[15px] text-slate-600 mt-2 leading-relaxed">
            Obrigado{primeiroNome ? `, ${primeiroNome}` : ''}. Recebemos seu pedido da <b className="text-slate-900">{tituloEquip}</b>.
          </p>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mt-4 text-left text-[14px] leading-relaxed">
            {comInstalacao ? (
              <>
                <p className="font-extrabold mb-1.5">Seu orçamento completo inclui</p>
                <p>✔ Equipamento</p>
                <p>✔ Frete até a sua cidade</p>
                <p>✔ Instalação na sua máquina por técnico Roder</p>
                <p>✔ Regulagem e orientação ao operador</p>
                <p className="mt-2.5 text-slate-600">
                  Para fechar os valores certos, um consultor Roder vai falar com você pelo WhatsApp <b className="text-slate-900">{formData.client_phone}</b>. Ele vai pedir a marca e o modelo da sua máquina e fotos do comando hidráulico, para confirmar se ela tem fatia extra e válvula de regulagem de pressão.
                </p>
              </>
            ) : (
              <p className="text-slate-600">
                Este equipamento vai pronto para você acoplar na sua máquina. Um consultor Roder vai falar com você pelo WhatsApp <b className="text-slate-900">{formData.client_phone}</b> para confirmar o modelo da sua máquina e fechar frete e prazo.
              </p>
            )}
            {formData.client_email.trim() && <p className="mt-2.5 text-slate-600">O orçamento também chega no e-mail <b className="text-slate-900">{formData.client_email.trim()}</b>.</p>}
          </div>
          {(videoUrl || fichaUrl) && (
            <div className="flex gap-2.5 mt-4">
              {videoUrl && <button type="button" onClick={() => abrirDocumento(videoUrl, tituloEquip)} className="flex-1 h-12 rounded-xl border border-slate-300 bg-white font-extrabold text-sm">▶ Ver vídeo</button>}
              {fichaUrl && <button type="button" onClick={() => abrirDocumento(fichaUrl, `Ficha ${tituloEquip}`)} className="flex-1 h-12 rounded-xl border border-slate-300 bg-white font-extrabold text-sm flex items-center justify-center gap-1.5"><FileText className="h-4 w-4" /> Ver ficha</button>}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-6">Roder Máquinas e Equipamentos · desde 2002</p>
        </div>
      </div>
    );
  }

  const campo = "w-full h-11 rounded-[11px] border border-slate-200 bg-white px-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/15";
  const rotulo = "block text-[11.5px] font-bold text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900">
      <Cabecalho />

      {submitting && (
        <div className="fixed inset-0 z-[100] bg-slate-900/75 flex items-center justify-center p-6">
          <div className="bg-white rounded-[20px] w-full max-w-[320px] px-6 py-7 text-center">
            <Loader2 className="h-11 w-11 animate-spin text-slate-900 mx-auto mb-3.5" />
            <p className="text-lg font-black">Enviando sua solicitação</p>
            <p className="text-[13.5px] text-slate-600 mt-1.5">Aguarde, não feche esta tela.</p>
            <div className="h-3 bg-slate-100 rounded-full mt-5 overflow-hidden">
              <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${progresso}%` }} />
            </div>
            <p className="text-[13px] font-extrabold mt-2">{progresso}%</p>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-3.5 pt-2.5 pb-6">
        {/* Equipamento */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2.5 flex gap-3 items-center">
          <button type="button" onClick={() => images.length && setFotoAberta(true)} className="w-32 h-32 shrink-0 flex items-center justify-center bg-white rounded-xl">
            {images.length > 0
              ? <img src={images[0]} alt={tituloEquip} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              : <Package className="h-10 w-10 text-slate-300" />}
          </button>
          <div className="min-w-0">
            <p className="text-[10.5px] font-extrabold text-slate-500 tracking-[0.12em]">ORÇAMENTO</p>
            <h1 className="text-lg font-black leading-tight">{tituloEquip}</h1>
            {maquinaBase && (
              <span className="inline-block mt-1.5 bg-[#111] text-yellow-400 text-xs font-extrabold px-2 py-1 rounded-md">
                {ehPa ? 'Pá carregadeira' : 'Escavadeira'} {maquinaBase}
              </span>
            )}
            {destaques.length > 0 && <p className="text-xs text-slate-600 mt-1.5">{destaques.join(' · ')}</p>}
            {(videoUrl || fichaUrl) && (
              <div className="flex gap-1.5 mt-2">
                {videoUrl && <button type="button" onClick={() => abrirDocumento(videoUrl, tituloEquip)} className="px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">▶ Vídeo</button>}
                {fichaUrl && <button type="button" onClick={() => abrirDocumento(fichaUrl, `Ficha ${tituloEquip}`)} className="px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Ficha</button>}
              </div>
            )}
          </div>
        </div>

        {/* Escolha do modelo, quando o link é da família inteira */}
        {product?.models && product.models.length > 1 && !modelId && (
          <div className="mt-2.5">
            <p className={rotulo}>Modelo</p>
            <div className="flex flex-wrap gap-1.5">
              {product.models.map(m => (
                <button type="button" key={m.id} onClick={() => setSelectedModelId(m.id)}
                  className={cn("px-3 h-9 rounded-full border text-sm font-bold", selectedModelId === m.id ? "bg-[#111] text-yellow-400 border-[#111]" : "bg-white border-slate-200 text-slate-700")}>
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} onKeyDown={aoTeclar} className="mt-3" noValidate>
          <div className="mb-2.5">
            <label htmlFor="client_name" className={rotulo}>Nome <span className="text-red-600">*</span></label>
            <input id="client_name" className={campo} placeholder="Seu nome" autoComplete="name" enterKeyHint="next"
              value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <div>
              <label htmlFor="client_phone" className={rotulo}>WhatsApp <span className="text-red-600">*</span></label>
              <input id="client_phone" className={campo} placeholder="(00) 00000-0000" inputMode="tel" autoComplete="tel-national" enterKeyHint="next"
                value={formData.client_phone} onChange={e => setFormData({ ...formData, client_phone: maskPhone(e.target.value) })} />
            </div>
            <div className="relative">
              <label htmlFor="client_location" className={rotulo}>Cidade <span className="text-red-600">*</span></label>
              <input id="client_location" className={campo} placeholder="Digite a cidade" autoComplete="off" enterKeyHint="next"
                value={formData.client_location}
                onFocus={() => { setCidadeFoco(true); carregarCidades(); }}
                onBlur={() => setTimeout(() => setCidadeFoco(false), 150)}
                onChange={e => { setCidadeIndice(0); setFormData({ ...formData, client_location: e.target.value }); }} />
              {cidadeFoco && sugestoes.length > 0 && (
                <div className="absolute right-0 top-[68px] w-[calc(100%+40px)] min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden">
                  {sugestoes.map((c, i) => (
                    <button type="button" key={c} onMouseDown={e => e.preventDefault()}
                      onClick={() => { setFormData(f => ({ ...f, client_location: c })); setCidadeFoco(false); document.getElementById('base_machine')?.focus(); }}
                      className={cn("block w-full text-left px-3 py-2.5 text-sm border-t border-slate-100 first:border-t-0", i === cidadeIndice ? "bg-blue-50" : "bg-white")}>
                      {c.split(' - ')[0]} <span className="text-slate-500">· {c.split(' - ')[1]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mb-2.5">
            <label htmlFor="base_machine" className={rotulo}>Sua máquina</label>
            <input id="base_machine" className={campo} placeholder={ehPa ? 'Ex: Pá carregadeira Volvo L60' : 'Ex: Escavadeira CAT 320'} enterKeyHint="next"
              value={formData.base_machine} onChange={e => setFormData({ ...formData, base_machine: e.target.value })} />
          </div>

          {mostrarExtras ? (
            <div className="grid grid-cols-1 gap-2.5 mb-2.5">
              <div>
                <label htmlFor="client_email" className={rotulo}>Seu melhor e-mail para receber o orçamento</label>
                <input id="client_email" className={campo} placeholder="nome@empresa.com.br" type="email" inputMode="email" autoComplete="email" enterKeyHint="next"
                  value={formData.client_email} onChange={e => setFormData({ ...formData, client_email: e.target.value.trim() })} />
              </div>
              <div>
                <label htmlFor="client_cnpj" className={rotulo}>CPF ou CNPJ</label>
                <input id="client_cnpj" className={campo} placeholder="Somente números" inputMode="numeric" enterKeyHint="next"
                  value={formData.client_cnpj} onChange={e => setFormData({ ...formData, client_cnpj: maskDoc(e.target.value) })} />
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => { setMostrarExtras(true); setTimeout(() => document.getElementById('client_email')?.focus(), 50); }}
              className="text-blue-700 font-bold text-[13.5px] mb-2.5 px-0.5">
              ＋ E-mail e CPF/CNPJ para receber o orçamento
            </button>
          )}

          <div className="mb-3">
            <label htmlFor="observations" className={rotulo}>Observações (opcional)</label>
            <textarea id="observations" rows={2} className={cn(campo, "h-auto min-h-[52px] py-2.5 resize-none")}
              placeholder="Prazo, instalação, acessórios..."
              value={formData.observations} onChange={e => setFormData({ ...formData, observations: e.target.value })} />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full h-[52px] rounded-[14px] bg-yellow-400 hover:bg-yellow-300 active:scale-[0.99] text-[#111] font-black text-base tracking-wide disabled:opacity-60">
            SOLICITAR ORÇAMENTO
          </button>
        </form>
      </div>

      <ImageLightbox isOpen={fotoAberta} onClose={() => setFotoAberta(false)} images={images} title={tituloEquip} />
    </div>
  );
}
