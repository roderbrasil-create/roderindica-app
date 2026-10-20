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
import { Play, Loader2, CheckCircle2, ChevronLeft, ChevronRight, Package, User, Building, Phone, Mail, FileText, MapPin, Briefcase, Settings } from 'lucide-react';
import { cn, getApiBaseUrl } from '../lib/utils';
import { abrirDocumento } from '../lib/abrirDocumento';
import { perfilInstalacao, TEXTOS_INSTALACAO, frasePara } from '../lib/instalacao';
import { ImageLightbox } from '../components/ui/ImageLightbox';
import { PlayerVideo } from '../components/video/VideoEquipamento';
import { tituloFicha } from '../lib/tituloFicha';
import { videoDoEquipamento } from '../lib/videoEquipamento';

// Faixa preta com a logo horizontal da Roder, abaixo da hora e da bateria do celular
function Cabecalho() {
  return (
    <header className="bg-[#090909] flex items-center justify-center" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="h-[54px] flex items-center"><img src="/marca/roder-horizontal.png" alt="Roder Máquinas e Equipamentos" className="h-[34px]" /></div>
    </header>
  );
}

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
  // vídeo do equipamento no alto da página: toca só depois do toque (nada de gastar o 4G do cliente)
  const [videoAberto, setVideoAberto] = useState(false);
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
  // foto guardada no banco (db-file://) vem pelo servidor como imagem normal
  const urlDaFoto = (u: string) => u.startsWith('db-file://') ? `/api/foto/${encodeURIComponent(u.slice(10))}` : u;
  const fotosModelo = (activeModel?.images || []).filter(fotoValida).map(urlDaFoto);
  const images = fotosModelo.length ? fotosModelo : (fotoValida(product?.image_url) ? [urlDaFoto(product!.image_url)] : []);

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
    if (e.key !== 'Enter' || alvo.tagName === 'TEXTAREA' || alvo.tagName === 'BUTTON') return;
    e.preventDefault();
    if (alvo.id === 'client_location' && sugestoes.length && cidadeFoco) {
      setFormData(f => ({ ...f, client_location: sugestoes[cidadeIndice] || sugestoes[0] }));
    }
    const campos = Array.from(formRef.current?.querySelectorAll<HTMLElement>('input, textarea') || []);
    const i = campos.indexOf(alvo);
    if (i >= 0 && campos[i + 1]) campos[i + 1].focus();
  };

  // Cliente de fora do Brasil vai direto para o consultor de exportação.
  // Antes qualquer telefone começando com 1 (DDD 11 a 19) e cidades como Limeira (lima),
  // Peruíbe (peru), Eldorado e Santiago caíam como exportação. Agora: telefone só conta
  // quando vem com + e código de outro país, e texto só pelo nome inteiro do país.
  const detectExportLead = (location: string, phone: string, obs: string) => {
    const tel = phone.replace(/\s/g, '');
    const porDdi: [string, string][] = [['+54', 'Argentina'], ['+595', 'Paraguai'], ['+598', 'Uruguai'], ['+56', 'Chile'], ['+591', 'Bolívia'], ['+51', 'Peru'], ['+57', 'Colômbia'], ['+52', 'México'], ['+1', 'Internacional / EUA']];
    if (tel.startsWith('+') && !tel.startsWith('+55')) {
      const achado = porDdi.find(([ddi]) => tel.startsWith(ddi));
      return { isExport: true, country: achado ? achado[1] : 'Internacional' };
    }
    const texto = ` ${`${location} ${obs}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')} `;
    const paises: [RegExp, string][] = [
      [/\bargentina\b/, 'Argentina'], [/\bparagua[iy]\b/, 'Paraguai'], [/\burugua[iy]\b/, 'Uruguai'],
      [/\bchile\b/, 'Chile'], [/\bbolivia\b/, 'Bolívia'], [/\bperu\b/, 'Peru'], [/\bcolombia\b/, 'Colômbia'],
      [/\bmexico\b/, 'México'], [/\bestados unidos\b|\bunited states\b/, 'Estados Unidos'],
    ];
    for (const [r, pais] of paises) if (r.test(texto)) return { isExport: true, country: pais };
    if (/\bpodrias cotizar\b|\bexcavadora\b|\bgracias\b|\bbuenos dias\b/.test(texto)) return { isExport: true, country: 'Internacional / América Latina' };
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
        // "Ji-Paraná - RO": separa pelo último " - ", senão a cidade virava "Ji"
        const corte = locationStr.lastIndexOf(' - ');
        const locationParts = corte > 0 ? [locationStr.slice(0, corte), locationStr.slice(corte + 3)] : [locationStr, ''];

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

        // o aviso ao parceiro agora sai pelo servidor (/api/orcamento/registrar-link)
      } catch (notifyErr) {
        console.warn('Silent notification failure (likely unauthenticated client):', notifyErr);
      }

      // o servidor avisa o parceiro, grava o nome dele e o link usado
      try {
        await fetch(`${getApiBaseUrl()}/api/orcamento/registrar-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ indicationId: novaRef.id, codigo: searchParams.get('c') || '' }),
        });
      } catch { /* o pedido já está salvo */ }

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
              perfil,
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

  // título no singular com o modelo, igual à ficha: "Garras Florestais" + "R400" vira "Garra Florestal R400"
  const tituloEquip = tituloFicha({ name: displayProductName }, { name: displayModelName }) || 'Equipamento Roder';
  const specs: Record<string, any> = (activeModel as any)?.technical_specs || {};
  const nomeCompleto = `${displayProductName} ${displayModelName}`;
  const perfil = perfilInstalacao(nomeCompleto, specs);
  const textoInstalacao = TEXTOS_INSTALACAO[perfil];
  const paraMaquina = frasePara(perfil, nomeCompleto, specs.maquina_base);
  const ehPa = /pá carregadeira/.test(paraMaquina) || /engate|carregadeira/i.test(nomeCompleto);
  const destaques = ([
    ['diametro_max_tora', 'Tora'], ['diametro_rachamento', 'Racha até'], ['diametro_corte', 'Corte'], ['diametro_max_corte', 'Corte'],
    ['abertura_maxima', 'Abertura'], ['volume', 'Volume'], ['capacidade_carga', 'Carga'], ['peso', 'Peso'], ['peso_do_equipamento', 'Peso'], ['peso_sem_rotator', 'Peso'],
  ] as [string, string][]).filter(([k]) => specs[k]).reduce<string[]>((acc, [k, rot]) => {
    if (acc.length < 2 && !acc.some(a => a.startsWith(rot))) acc.push(`${rot} ${specs[k]}`);
    return acc;
  }, []);
  // o mesmo vídeo que o parceiro viu no Consultor (catálogo, ou o mapa fixo por nome)
  const videoUrl = videoDoEquipamento(product, activeModel);
  const fichaUrl = (activeModel as any)?.pdf_url || product?.pdf_url || '';
  const primeiroNome = formData.client_name.trim().split(/\s+/)[0] || '';

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
            <p className="font-extrabold mb-1.5">Seu orçamento inclui</p>
            {textoInstalacao.itens.map(i => <p key={i}>✔ {i}</p>)}
            <p className="mt-2.5 text-slate-600">
              Para fechar os valores certos, um consultor Roder vai falar com você pelo WhatsApp <b className="text-slate-900">{formData.client_phone}</b>. {textoInstalacao.consultor}
            </p>
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
        {/* Vídeo do equipamento, acima de tudo: o cliente chegou pelo "veja o vídeo" do WhatsApp */}
        {videoUrl && (
          <div id="video-equipamento" className="mb-2.5 rounded-2xl overflow-hidden bg-[#000] border border-slate-200">
            {videoAberto ? (
              <PlayerVideo url={videoUrl} titulo={tituloEquip} onFechar={() => setVideoAberto(false)} comAcoes={false} />
            ) : (
              <div className="relative w-full aspect-video bg-gradient-to-b from-[#F4F5F6] to-[#DCE0E4]">
                {images.length > 0 && <img src={images[0]} alt="" className="absolute inset-0 m-auto max-h-[88%] max-w-[88%] object-contain" referrerPolicy="no-referrer" />}
                <span className="absolute inset-0 bg-black/25" />
                {/* botão cobrindo a área toda (o estilo global de botão fixa a altura) */}
                <button type="button" onClick={() => setVideoAberto(true)} aria-label={`Ver o vídeo da ${tituloEquip}`} className="absolute inset-0 h-full w-full p-0 bg-transparent border-0">
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-[#FF0000] flex items-center justify-center shadow-lg">
                    <Play className="h-8 w-8 text-white fill-white ml-1" />
                  </span>
                  <span className="absolute left-3 bottom-3 rounded-full bg-black/75 text-white text-[13px] font-extrabold px-3 py-1.5">▶ Veja trabalhando</span>
                </button>
              </div>
            )}
          </div>
        )}
        {/* Equipamento */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2.5 flex gap-3 items-center">
          <button type="button" onClick={() => images.length && setFotoAberta(true)} className="w-[154px] h-[154px] shrink-0 flex items-center justify-center bg-white rounded-xl">
            {images.length > 0
              ? <img src={images[0]} alt={tituloEquip} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              : <Package className="h-10 w-10 text-slate-300" />}
          </button>
          <div className="min-w-0">
            <p className="text-[10.5px] font-extrabold text-slate-500 tracking-[0.12em]">ORÇAMENTO</p>
            <h1 className="text-lg font-black leading-tight">{tituloEquip}</h1>
            {paraMaquina && (
              <span className="inline-block mt-1.5 bg-[#111] text-yellow-400 text-xs font-extrabold px-2 py-1 rounded-md">
                {paraMaquina}
              </span>
            )}
            {destaques.length > 0 && <p className="text-xs text-slate-600 mt-1.5">{destaques.join(' · ')}</p>}
            {(videoUrl || fichaUrl) && (
              <div className="flex gap-1.5 mt-2">
                {videoUrl && <button type="button" onClick={() => { setVideoAberto(true); document.getElementById('video-equipamento')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="px-3 py-1.5 rounded-full bg-[#FF0000] text-white text-xs font-bold flex items-center gap-1"><Play className="h-3.5 w-3.5 fill-white" /> Vídeo</button>}
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
