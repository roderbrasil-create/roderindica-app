import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  collection,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Star, ChevronLeft, ChevronRight, MessageSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendEmail } from '../services/emailService';

export default function PublicEvaluation() {
  const [searchParams] = useSearchParams();
  const evaluationId = searchParams.get('id'); // ID of the pre-scheduled evaluation or indication
  
  const [clientName, setClientName] = useState<string>('');
  const [equipmentName, setEquipmentName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState<boolean>(false);

  // Wizard active step: 
  // 0 = Identification (only if no evaluationId provided)
  // 1 = Question 1 (Qualidade do Equipamento Roder)
  // 2 = Question 2 (Atendimento Comercial e Vendedor)
  // 3 = Question 3 (Prazo e Data de Entrega)
  // 4 = Question 4 (Entrega Técnica / Instalador)
  // 5 = Feedback text & Finalize
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Form ratings
  const [ratingProduct, setRatingProduct] = useState<number>(0);
  const [ratingService, setRatingService] = useState<number>(0);
  const [ratingDelivery, setRatingDelivery] = useState<number>(0);
  const [ratingTechnical, setRatingTechnical] = useState<number>(0);

  // Hovers
  const [hoverProduct, setHoverProduct] = useState<number>(0);
  const [hoverService, setHoverService] = useState<number>(0);
  const [hoverDelivery, setHoverDelivery] = useState<number>(0);
  const [hoverTechnical, setHoverTechnical] = useState<number>(0);

  const [comments, setComments] = useState<string>('');

  // Fallback identification fields (for step 0 general access)
  const [manualClientName, setManualClientName] = useState('');
  const [manualEquipment, setManualEquipment] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  const catalogEquipmentList = [
    'Cabeçote Multifuncional',
    'Garra Traçadora',
    'Feller Tesoura',
    'Mini Skidder',
    'Feller de Disco',
    'Destocador Tipo Broca',
    'Carregador frontal'
  ];

  useEffect(() => {
    async function fetchPreloadedData() {
      if (!evaluationId) {
        setLoading(false);
        setCurrentStep(0);
        return;
      }

      try {
        // 1. Try to fetch from pre-created customer_evaluations
        const evalRef = doc(db, 'customer_evaluations', evaluationId);
        const evalSnap = await getDoc(evalRef);
        
        if (evalSnap.exists()) {
          const evalData = evalSnap.data();
          if (evalData.status === 'completed' || evalData.completed === true) {
            setAlreadyCompleted(true);
            setClientName(evalData.client_name || '');
            setEquipmentName(evalData.equipment_name || '');
            return;
          }
          setClientName(evalData.client_name || '');
          setEquipmentName(evalData.equipment_name || '');
          setClientPhone(evalData.client_phone || '');
          setCurrentStep(1); // Go straight to Question 1
        } else {
          // 2. Fallback to fetch from indications using the evaluationId
          const indRef = doc(db, 'indications', evaluationId);
          const indSnap = await getDoc(indRef);
          
          if (indSnap.exists()) {
            const data = indSnap.data();
            setClientName(data.client_name || '');
            setClientPhone(data.client_phone || '');
            
            // Extract clean equipment
            let equip = data.base_machine || '';
            if (data.items && data.items.length > 0) {
              equip = data.items.map((i: any) => i.product_name).join(', ');
            }
            setEquipmentName(equip);
            setCurrentStep(1); // Go straight to Question 1
          } else {
            // General fallback
            setCurrentStep(0); 
          }
        }
      } catch (err) {
        console.error('Error fetching evaluation data:', err);
        setCurrentStep(0);
      } finally {
        setLoading(false);
      }
    }

    fetchPreloadedData();
  }, [evaluationId]);

  // Helper to fetch recipient emails configured on settings or default
  const getRecipientEmails = async () => {
    let emails = ['jeferson@roderbrasil.com.br', 'gislene@roderbrasil.com.br', 'contato@roderbrasil.com.br'];
    try {
      const snap = await getDoc(doc(db, 'settings', 'comercial_config'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.recipient_emails && Array.isArray(data.recipient_emails) && data.recipient_emails.length > 0) {
          emails = data.recipient_emails.map((e: string) => e.trim()).filter((eStr: string) => eStr !== '');
        }
      }
    } catch (err) {
      console.error('Error reading emails from settings:', err);
    }
    return emails;
  };

  const handleSelectRatingProduct = (val: number) => {
    setRatingProduct(val);
    setTimeout(() => {
      setCurrentStep(2);
    }, 380);
  };

  const handleSelectRatingService = (val: number) => {
    setRatingService(val);
    setTimeout(() => {
      setCurrentStep(3);
    }, 380);
  };

  const handleSelectRatingDelivery = (val: number) => {
    setRatingDelivery(val);
    setTimeout(() => {
      setCurrentStep(4);
    }, 380);
  };

  const handleSelectRatingTechnical = (val: number) => {
    setRatingTechnical(val);
    setTimeout(() => {
      setCurrentStep(5);
    }, 380);
  };

  const handleStepZeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClientName || !manualEquipment) {
      toast.error('Por favor, preencha o seu nome e selecione/digite o seu equipamento.');
      return;
    }
    setClientName(manualClientName);
    setEquipmentName(manualEquipment);
    setClientPhone(manualPhone);
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ratingProduct === 0 || ratingService === 0 || ratingDelivery === 0 || ratingTechnical === 0) {
      toast.error('Por favor, responda todas as perguntas avaliando de 1 a 5 estrelas.');
      return;
    }

    try {
      setSubmitting(true);

      const clientName_val = clientName || manualClientName || 'Cliente Geral';
      const equipment_val = equipmentName || manualEquipment || 'Equipamento Roder';
      const phone_val = clientPhone || manualPhone || '';

      const payload = {
        indication_id: evaluationId || 'general',
        client_name: clientName_val,
        equipment_name: equipment_val,
        client_phone: phone_val,
        rating_product: ratingProduct,
        rating_service: ratingService, // Atendimento Comercial e Vendedor
        rating_delivery: ratingDelivery, // Prazo e Data de Entrega
        rating_technical: ratingTechnical, // Técnico e instruções de uso
        comments: comments,
        status: 'completed', // Explicitly mark status as completed for correct admin list render
        completed: true,
        evaluated_at: serverTimestamp(),
        created_at: serverTimestamp()
      };

      if (evaluationId) {
        // Save using the evaluationId as document reference
        await setDoc(doc(db, 'customer_evaluations', evaluationId), payload, { merge: true });
      } else {
        // Save as a new general evaluation
        await addDoc(collection(db, 'customer_evaluations'), payload);
      }

      // ─── IMMEDIATELY DESPATCH NOTIFICATION EMAIL ───
      try {
        const emailRecipients = await getRecipientEmails();
        const subject = `COMPLETA: Pesquisa de Satisfação NPS - ${clientName_val}`;
        
        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-top: 5px solid #ea580c; border-radius: 10px; overflow: hidden; color: #1f2937;">
            <div style="background-color: #fcfcfc; padding: 24px; text-align: center; border-bottom: 1px solid #f3f4f6;">
              <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png" alt="Roder Logo" style="height: 55px; margin-bottom: 8px; referrer-policy: no-referrer;" />
              <h2 style="margin: 0; color: #111827; font-size: 21px; font-weight: 800; tracking-tight">Nova Resposta Recebida</h2>
              <p style="margin: 3px 0 0; color: #ea580c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Pesquisa de Qualidade e NPS</p>
            </div>
            
            <div style="padding: 24px; background-color: #ffffff;">
              <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-top: 0;">Olá Gerência / Equipe Roder, o cliente respondeu com sucesso ao questionário de qualidade sobre sua última aquisição.</p>
              
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #f3f4f6;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Cliente:</strong> ${clientName_val}</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Equipamento:</strong> <span style="color: #ea580c; font-weight: 700;">${equipment_val}</span></p>
                <p style="margin: 0; font-size: 14px; color: #374151;"><strong>WhatsApp:</strong> ${phone_val || 'Não informado'}</p>
              </div>

              <h4 style="color: #111827; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #ea580c; padding-bottom: 6px; margin: 24px 0 12px 0;">Notas Avaliadas:</h4>
              
              <div style="margin: 12px 0; border: 1px solid #f3f4f6; border-radius: 6px; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; padding: 12px; background-color: #fafafa; border-bottom: 1px solid #f3f4f6;">
                  <span style="font-size: 13px; color: #4b5563; font-weight: 500;">1. Qualidade do Equipamento Roder:</span>
                  <strong style="font-size: 13px; color: #ea580c;">${ratingProduct} de 5 ⭐</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #f3f4f6;">
                  <span style="font-size: 13px; color: #4b5563; font-weight: 500;">2. Atendimento Comercial e Vendedor:</span>
                  <strong style="font-size: 13px; color: #ea580c;">${ratingService} de 5 ⭐</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px; background-color: #fafafa; border-bottom: 1px solid #f3f4f6;">
                  <span style="font-size: 13px; color: #4b5563; font-weight: 500;">3. Prazo e Data de Entrega:</span>
                  <strong style="font-size: 13px; color: #ea580c;">${ratingDelivery} de 5 ⭐</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px;">
                  <span style="font-size: 13px; color: #4b5563; font-weight: 500;">4. Instalação e Entrega Técnica:</span>
                  <strong style="font-size: 13px; color: #ea580c;">${ratingTechnical} de 5 ⭐</strong>
                </div>
              </div>

              ${comments ? `
                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0; font-style: italic; font-size: 13.5px; color: #78350f; line-height: 1.5;">
                  &ldquo; ${comments} &rdquo;
                </div>
              ` : ''}

            </div>
            <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af;">
              <p style="margin: 0;">Este email foi emitido automaticamente pelo portal Roder Indica V2.</p>
            </div>
          </div>
        `;

        for (const recipient of emailRecipients) {
          await sendEmail({
            to: recipient,
            subject,
            html: htmlContent,
            fromName: "Roder Avaliações"
          });
        }
      } catch (mailErr) {
        console.error('Failed to notify recipient commercial emails:', mailErr);
      }

      setSubmitted(true);
      toast.success('Sua avaliação foi salva! Muito obrigado!');
    } catch (err) {
      console.error('Error saving evaluation:', err);
      toast.error('Erro ao salvar avaliação. Por favor, tente enviar novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-neutral-100 p-4 select-none">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
        <p className="text-sm tracking-wide font-medium text-neutral-400">Carregando pesquisa de qualidade...</p>
      </div>
    );
  }

  // Calculate Progress Percentages for Star Steps
  const totalSteps = 5;
  const progressPercent = currentStep > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col justify-between selection:bg-orange-600/30">
      {/* Header with Roder Logo */}
      <header className="p-4 bg-neutral-900/40 backdrop-blur-md border-b border-neutral-800 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1 shadow-inner overflow-hidden">
              <img 
                src="https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png" 
                alt="Logo Roder" 
                className="object-contain w-10 h-10"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-tight">Roder Máquinas</h1>
              <p className="text-[10px] text-orange-500 font-extrabold uppercase tracking-wider">Qualidade e Compromisso</p>
            </div>
          </div>
          {currentStep > 0 && (
            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono font-bold bg-neutral-900 border px-2.5 py-1 rounded-full text-neutral-400">
                {currentStep === 5 ? 'Finalização' : `Etapa ${currentStep} de 4`}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {alreadyCompleted ? (
            <motion.div
              key="already-completed-anim"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <Card className="bg-neutral-900/60 border-neutral-800 text-center py-8 px-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                <div className="space-y-6 pt-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full flex items-center justify-center border border-amber-500/30 text-amber-500">
                    <Sparkles className="h-10 w-10 animate-pulse text-amber-500" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-xl font-extrabold text-white tracking-tight">Pesquisa Já Respondida!</h2>
                    <p className="text-amber-500 font-bold text-xs uppercase tracking-widest leading-none">Agradecemos Sua Participação</p>
                  </div>

                  <p className="text-neutral-300 text-sm leading-relaxed text-center">
                    Olá, <strong className="text-white">{clientName || 'Cliente'}</strong>!<br />
                    Identificamos que esta pesquisa de qualidade referente ao equipamento <strong className="text-orange-400">{equipmentName || 'adquirido'}</strong> já foi respondida e enviada com sucesso.
                  </p>

                  <p className="text-neutral-400 text-xs leading-relaxed text-center">
                    Para evitar respostas duplicadas, o acesso ao formulário está encerrado. Seu feedback precioso já está registrado com nossa equipe de controle de qualidade!
                  </p>

                  <div className="pt-5 border-t border-neutral-800/85">
                    <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">Roder do Brasil S/A</p>
                    <p className="text-xs text-neutral-400">Tecnologia e robustez a serviço do campo.</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : submitted ? (
            (() => {
              const avgScore = (ratingProduct + ratingService + ratingDelivery + ratingTechnical) / 4;
              const isPromoter = avgScore >= 4.0;
              return (
                <motion.div
                  key="success-anim"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full animate-in fade-in zoom-in duration-300"
                >
                  <Card className="bg-neutral-900/60 border-neutral-800 text-center py-8 px-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                    <div className="space-y-6 pt-4">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-full flex items-center justify-center border border-orange-500/30 text-orange-500 animate-bounce">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white tracking-tight">Muito Obrigado!</h2>
                        <p className="text-orange-500 font-bold text-xs uppercase tracking-widest leading-none">Avaliação Concluída</p>
                      </div>

                      <p className="text-neutral-300 text-sm leading-relaxed text-justify">
                        Sua opinião sincera nos permite guiar o aprimoramento dos nossos equipamentos Roder e otimizar nosso atendimento operacional. Agradecemos imensamente o seu tempo dedicado a responder esta pesquisa!
                      </p>

                      {/* Promoters Call to Action - Google Maps Reviews Booster */}
                      {isPromoter && (
                        <div className="mt-6 p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-neutral-900 border border-amber-500/30 rounded-xl text-center space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                          <div className="flex items-center justify-center gap-1 text-amber-500">
                            <Sparkles className="h-4.5 w-4.5 animate-pulse text-amber-400" />
                            <span className="text-[10px] uppercase tracking-widest font-black text-amber-300">Convite Especial</span>
                            <Sparkles className="h-4.5 w-4.5 animate-pulse text-amber-400" />
                          </div>
                          
                          <div className="space-y-2">
                            <h3 className="text-sm font-extrabold text-white text-left flex items-center gap-1.5 justify-center">
                              Sua satisfação nos move! 🌟
                            </h3>
                            <p className="text-[11.5px] text-neutral-305 text-left leading-relaxed">
                              Como você teve uma excelente experiência com seu equipamento e equipe Roder, gostaríamos de convidá-lo a compartilhar sua avaliação rápida no nosso perfil oficial do <strong className="text-white">Google Maps da Roder Máquinas</strong>!
                            </p>
                            <p className="text-[9.5px] text-neutral-400 text-left leading-relaxed italic border-t border-neutral-800/65 pt-2">
                              Leva menos de 30 segundos e ajuda a impulsionar o reconhecimento da fabricação de tecnologia nacional florestal.
                            </p>
                          </div>

                          <a 
                            href="https://www.google.com/search?sca_esv=ab1b6b27cad31560&rlz=1C1GCEB_enBR887BR889&sxsrf=ANbL-n5xA-GvK2TPtxfXtzqFnWMT5QadjQ:1780357372738&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOSwhpMSWIzd6EXm9JMKaqfFz59EbC7OqklciF3bVhDgkwNNN1pgvHkV6RT6FXdtTZ6BmbuIzsZgpD4XTJkrfHgHRbVyybuf4OJwDwDfPFrBLNC-p0KbyvjlXL9XBk7hcWi9Q3Ts%3D&q=RODER+M%C3%A1quinas+e+Equipamentos+Coment%C3%A1rios&sa=X&ved=2ahUKEwjIw5mGnOeUAxUPppUCHfBCGh8Q0bkNegQIMhAH&biw=1396&bih=670&dpr=1.38#lrd=0x94c6ea1d4dc79535:0xe775091a12bf9c7f,3,,,,"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10 group transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              Avaliar no Google Maps 5★ 
                              <span className="group-hover:translate-x-1 transition-transform">🚀</span>
                            </span>
                          </a>
                        </div>
                      )}

                      <div className="pt-5 border-t border-neutral-800/85">
                        <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">Roder do Brasil S/A</p>
                        <p className="text-xs text-neutral-400">Tecnologia e robustez a serviço do campo.</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })()
          ) : (
            <div className="space-y-4">
              {/* Informative Step Indicator Progress Bar */}
              {currentStep > 0 && (
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* STAGE CONTAINER WIZARD */}
              <div className="relative">
                {/* Step 0: User identification form (Fallback when no query id is configured) */}
                {currentStep === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1 mt-2">
                      <h2 className="text-2xl font-black text-white tracking-tight">Pesquisa de Satisfação</h2>
                      <p className="text-sm font-semibold text-neutral-400 leading-relaxed max-w-xs mx-auto">
                        Sua opinião sincera nos orienta a construir e aprimorar equipamentos cada vez melhores para você.
                      </p>
                    </div>

                    <Card className="bg-neutral-900 border-neutral-800 shadow-xl">
                      <CardContent className="p-5">
                        <form onSubmit={handleStepZeroSubmit} className="space-y-4">
                          <p className="text-xs text-neutral-400 mb-2">Para iniciar o questionário, confirme seus dados básicos abaixo:</p>
                          
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Nome Completo ou Empresa *</label>
                            <input 
                              type="text"
                              required
                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                              placeholder="Ex: Fazenda Santa Cruz ou João Silva"
                              value={manualClientName}
                              onChange={(e) => setManualClientName(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Equipamento Adquirido *</label>
                            <select 
                              required
                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                              value={manualEquipment}
                              onChange={(e) => setManualEquipment(e.target.value)}
                            >
                              <option value="">Selecione seu equipamento...</option>
                              {catalogEquipmentList.map((eq) => (
                                <option key={eq} value={eq}>{eq}</option>
                              ))}
                              <option value="Outros">Outro equipamento manual...</option>
                            </select>

                            {manualEquipment === 'Outros' && (
                              <input 
                                type="text"
                                required
                                placeholder="Digite o nome do seu equipamento..."
                                className="w-full mt-2 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                onChange={(e) => setManualEquipment(e.target.value)}
                              />
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Seu WhatsApp / Telefone</label>
                            <input 
                              type="text"
                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                              placeholder="Ex: (43) 99999-9999"
                              value={manualPhone}
                              onChange={(e) => setManualPhone(e.target.value)}
                            />
                          </div>

                          <Button
                            type="submit"
                            className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-bold"
                          >
                            Iniciar Pesquisa <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 1: Question 1 (Qualidade do Equipamento Rôder) */}
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1 mt-2">
                      <h3 className="text-xs text-orange-500 uppercase font-black tracking-widest">Avaliação de Qualidade</h3>
                      <h2 className="text-xl font-bold text-white tracking-tight leading-relaxed">
                        Sua opinião sincera nos orienta a construir equipamentos cada vez melhores para você.
                      </h2>
                    </div>

                    <Card className="bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden relative">
                      <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                      <CardContent className="p-6 space-y-5 text-center">
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-widest bg-orange-600/10 text-orange-500 font-extrabold px-2.5 py-0.5 rounded-full">
                            Questão 1
                          </span>
                          <h3 className="text-xl font-extrabold text-white tracking-tight">1. Qualidade do Equipamento Roder</h3>
                          <p className="text-base text-neutral-300 font-medium leading-relaxed max-w-sm mx-auto">
                            Como você avalia o desempenho prático, durabilidade e engenharia do produto que adquiriu?
                          </p>
                        </div>

                        {/* Star Group */}
                        <div className="flex justify-center gap-3 py-4 bg-neutral-950/40 rounded-xl border border-neutral-800/40 w-full max-w-xs mx-auto">
                          {[1, 2, 3, 4, 5].map((index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSelectRatingProduct(index)}
                              onMouseEnter={() => setHoverProduct(index)}
                              onMouseLeave={() => setHoverProduct(0)}
                              className="p-1 hover:scale-130 transition-all outline-none"
                            >
                              <Star
                                className="h-9 w-9 transition-colors stroke-[1.25]"
                                fill={index <= (hoverProduct || ratingProduct) ? '#ea580c' : 'none'}
                                color={index <= (hoverProduct || ratingProduct) ? '#ea580c' : '#404040'}
                              />
                            </button>
                          ))}
                        </div>

                        {ratingProduct > 0 && (
                          <div className="text-sm font-extrabold text-orange-500 animate-pulse">
                            {ratingProduct === 5 && 'Satisfeito / Excelente (5/5) ★'}
                            {ratingProduct === 4 && 'Muito Bom (4/5) ★'}
                            {ratingProduct === 3 && 'Apropriado / Regular (3/5) ★'}
                            {ratingProduct === 2 && 'Insatisfatório / Ruim (2/5) ★'}
                            {ratingProduct === 1 && 'Crítico / Decepcionante (1/5) ★'}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[10px] text-neutral-500 font-black tracking-widest">PRODUTO: RODER S/A</span>
                          {ratingProduct > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentStep(2)}
                              className="text-orange-500 font-extrabold"
                            >
                              Próximo <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 2: Question 2 (Atendimento Comercial e Vendedor) */}
                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1 mt-2">
                      <h3 className="text-xs text-orange-500 uppercase font-black tracking-widest">Avaliação Comercial</h3>
                      <h2 className="text-xl font-bold text-white tracking-tight leading-relaxed">
                        Sua opinião nos ajuda a dar o melhor suporte comercial.
                      </h2>
                    </div>

                    <Card className="bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden relative">
                      <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                      <CardContent className="p-6 space-y-5 text-center">
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-widest bg-orange-600/10 text-orange-500 font-extrabold px-2.5 py-0.5 rounded-full">
                            Questão 2
                          </span>
                          <h3 className="text-xl font-extrabold text-white tracking-tight">2. Atendimento Comercial e Vendedor</h3>
                          <p className="text-base text-neutral-300 font-medium leading-relaxed max-w-sm mx-auto">
                            Como foi sua experiência com os vendedores e o atendimento comercial recebido?
                          </p>
                        </div>

                        {/* Star Group */}
                        <div className="flex justify-center gap-3 py-4 bg-neutral-950/40 rounded-xl border border-neutral-800/40 w-full max-w-xs mx-auto">
                          {[1, 2, 3, 4, 5].map((index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSelectRatingService(index)}
                              onMouseEnter={() => setHoverService(index)}
                              onMouseLeave={() => setHoverService(0)}
                              className="p-1 hover:scale-130 transition-all outline-none"
                            >
                              <Star
                                className="h-9 w-9 transition-colors stroke-[1.25]"
                                fill={index <= (hoverService || ratingService) ? '#ea580c' : 'none'}
                                color={index <= (hoverService || ratingService) ? '#ea580c' : '#404040'}
                              />
                            </button>
                          ))}
                        </div>

                        {ratingService > 0 && (
                          <div className="text-sm font-extrabold text-orange-500 animate-pulse">
                            {ratingService === 5 && 'Satisfeito / Excelente (5/5) ★'}
                            {ratingService === 4 && 'Muito Bom (4/5) ★'}
                            {ratingService === 3 && 'Apropriado / Regular (3/5) ★'}
                            {ratingService === 2 && 'Insatisfatório / Ruim (2/5) ★'}
                            {ratingService === 1 && 'Crítico / Decepcionante (1/5) ★'}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(1)}
                            className="text-neutral-400 font-bold"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                          </Button>
                          {ratingService > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentStep(3)}
                              className="text-orange-500 font-extrabold"
                            >
                              Próximo <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 3: Question 3 (Prazo e Data de Entrega) */}
                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1 mt-2">
                      <h3 className="text-xs text-orange-500 uppercase font-black tracking-widest">Cumprimento de Prazo</h3>
                      <h2 className="text-xl font-bold text-white tracking-tight leading-relaxed">
                        A pontualidade é primordial para nós.
                      </h2>
                    </div>

                    <Card className="bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden relative">
                      <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                      <CardContent className="p-6 space-y-5 text-center">
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-widest bg-orange-600/10 text-orange-500 font-extrabold px-2.5 py-0.5 rounded-full">
                            Questão 3
                          </span>
                          <h3 className="text-xl font-extrabold text-white tracking-tight">3. Prazo e Data de Entrega</h3>
                          <p className="text-base text-neutral-300 font-medium leading-relaxed max-w-sm mx-auto">
                            A data de entrega foi cumprida ou foi como o esperado e combinado entre as partes?
                          </p>
                        </div>

                        {/* Star Group */}
                        <div className="flex justify-center gap-3 py-4 bg-neutral-950/40 rounded-xl border border-neutral-800/40 w-full max-w-xs mx-auto">
                          {[1, 2, 3, 4, 5].map((index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSelectRatingDelivery(index)}
                              onMouseEnter={() => setHoverDelivery(index)}
                              onMouseLeave={() => setHoverDelivery(0)}
                              className="p-1 hover:scale-130 transition-all outline-none"
                            >
                              <Star
                                className="h-9 w-9 transition-colors stroke-[1.25]"
                                fill={index <= (hoverDelivery || ratingDelivery) ? '#ea580c' : 'none'}
                                color={index <= (hoverDelivery || ratingDelivery) ? '#ea580c' : '#404040'}
                              />
                            </button>
                          ))}
                        </div>

                        {ratingDelivery > 0 && (
                          <div className="text-sm font-extrabold text-orange-500 animate-pulse">
                            {ratingDelivery === 5 && 'Satisfeito / Excelente (5/5) ★'}
                            {ratingDelivery === 4 && 'Muito Bom (4/5) ★'}
                            {ratingDelivery === 3 && 'Apropriado / Regular (3/5) ★'}
                            {ratingDelivery === 2 && 'Insatisfatório / Ruim (2/5) ★'}
                            {ratingDelivery === 1 && 'Crítico / Decepcionante (1/5) ★'}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(2)}
                            className="text-neutral-400 font-bold"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                          </Button>
                          {ratingDelivery > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentStep(4)}
                              className="text-orange-500 font-extrabold"
                            >
                              Próximo <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 4: Question 4 (Instalação e Entrega Técnica) */}
                {currentStep === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1 mt-2">
                      <h3 className="text-xs text-orange-500 uppercase font-black tracking-widest">Instalação e Instrução</h3>
                      <h2 className="text-xl font-bold text-white tracking-tight leading-relaxed">
                        A assistência técnica faz a diferença no início operacional.
                      </h2>
                    </div>

                    <Card className="bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden relative">
                      <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                      <CardContent className="p-6 space-y-5 text-center">
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-widest bg-orange-600/10 text-orange-500 font-extrabold px-2.5 py-0.5 rounded-full">
                            Questão 4
                          </span>
                          <h3 className="text-xl font-extrabold text-white tracking-tight">4. Entrega Técnica e Instruções de Uso</h3>
                          <p className="text-base text-neutral-300 font-medium leading-relaxed max-w-sm mx-auto">
                            Qual a sua nota para o técnico que fez a instalação do equipamento e passou as instruções de uso do equipamento?
                          </p>
                        </div>

                        {/* Star Group */}
                        <div className="flex justify-center gap-3 py-4 bg-neutral-950/40 rounded-xl border border-neutral-800/40 w-full max-w-xs mx-auto">
                          {[1, 2, 3, 4, 5].map((index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSelectRatingTechnical(index)}
                              onMouseEnter={() => setHoverTechnical(index)}
                              onMouseLeave={() => setHoverTechnical(0)}
                              className="p-1 hover:scale-130 transition-all outline-none"
                            >
                              <Star
                                className="h-9 w-9 transition-colors stroke-[1.25]"
                                fill={index <= (hoverTechnical || ratingTechnical) ? '#ea580c' : 'none'}
                                color={index <= (hoverTechnical || ratingTechnical) ? '#ea580c' : '#404040'}
                              />
                            </button>
                          ))}
                        </div>

                        {ratingTechnical > 0 && (
                          <div className="text-sm font-extrabold text-orange-500 animate-pulse">
                            {ratingTechnical === 5 && 'Satisfeito / Excelente (5/5) ★'}
                            {ratingTechnical === 4 && 'Muito Bom (4/5) ★'}
                            {ratingTechnical === 3 && 'Apropriado / Regular (3/5) ★'}
                            {ratingTechnical === 2 && 'Insatisfatório / Ruim (2/5) ★'}
                            {ratingTechnical === 1 && 'Crítico / Decepcionante (1/5) ★'}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(3)}
                            className="text-neutral-400 font-bold"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                          </Button>
                          {ratingTechnical > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentStep(5)}
                              className="text-orange-500 font-extrabold"
                            >
                              Próximo <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 5: Comments box & Finalize */}
                {currentStep === 5 && (
                  <motion.div
                    key="step-5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1 mt-2">
                      <h3 className="text-xs text-orange-500 uppercase font-black tracking-widest">Palavras Finais</h3>
                      <h2 className="text-xl font-bold text-white tracking-tight leading-relaxed">
                        Gostaria de deixar um comentário adicional? (Opcional)
                      </h2>
                    </div>

                    <Card className="bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden relative">
                      <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-white mt-1 border-b border-neutral-800 pb-2">
                          <MessageSquare className="h-4.5 w-4.5 text-orange-500 block" />
                          <span>Escreva suas sugestões ou elogios abaixo</span>
                        </div>

                        <Textarea
                          placeholder="Fale um pouco sobre o técnico, entrega, ou o comportamento operacional do equipamento..."
                          rows={4}
                          className="bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 leading-relaxed"
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                        />

                        {/* Customer preloaded badge review */}
                        {clientName && (
                          <div className="bg-neutral-950/50 rounded-lg p-3 border border-neutral-800/60 text-xs text-neutral-400">
                            <span className="font-extrabold text-[10px] text-neutral-500 uppercase tracking-widest block">Autor da Pesquisa</span>
                            <span className="font-bold text-white text-xs">{clientName}</span> | {equipmentName || 'Equipamento'}
                          </div>
                        )}

                        <div className="flex justify-between items-center gap-3 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(4)}
                            className="text-neutral-400 font-bold"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                          </Button>

                          <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold h-11 px-5 shadow-lg shadow-orange-600/10"
                          >
                            {submitting ? (
                              <div className="flex items-center gap-1.5">
                                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                                <span>Salvando...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span>Enviar Pesquisa</span>
                                <Sparkles className="h-4 w-4 ml-1.5" />
                              </div>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-neutral-900 bg-neutral-950/80">
        <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-black">Roder do Brasil S/A</p>
        <p className="text-[9px] text-neutral-700 mt-1">© 2026 Roder do Brasil. Alta tecnologia de faturamento florestal.</p>
      </footer>
    </div>
  );
}
