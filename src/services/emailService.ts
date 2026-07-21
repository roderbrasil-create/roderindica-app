import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getApiBaseUrl } from '../lib/utils';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  replyTo?: string;
  settings?: any;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const baseUrl = getApiBaseUrl();
    const payload = { ...options };

    // Auto-fetch email settings client-side if not already provided in options, to assist Node.js servers (like Hostinger) that lack Firebase Admin SDK configuration.
    if (!payload.settings) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'email'));
        if (snap.exists()) {
          payload.settings = snap.data();
        }
      } catch (clientDbErr) {
        console.warn('[EMAIL-SERVICE] Client-side email settings fetch failed (expected for public/unauthenticated routes):', clientDbErr);
      }
    }

    const response = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error('Error in sendEmail:', error);
    return { success: false, error: 'Network error or server unavailable' };
  }
}

export async function shouldSendNotification(type: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'notifications'));
    if (!snap.exists()) return true; // Default to true if doc not configured
    const data = snap.data();
    if (data[type] === undefined) return true; // Default to true if key not in doc
    return !!data[type];
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true;
  }
}

// v2.1.2 - Forced sync for Luana notification
export async function getManagerEmails(): Promise<string[]> {
  const mandatory = [
    'gislene@roderbrasil.com.br', 
    'contato@roderbrasil.com.br', 
    'roderbrasil@gmail.com',
    'luana@roderbrasil.com.br'
  ];
  try {
    const snap = await getDoc(doc(db, 'settings', 'notifications'));
    if (!snap.exists()) return mandatory;
    const data = snap.data();
    if (!data.manager_emails) return mandatory;
    const emailsStr = String(data.manager_emails || '');
    const list = emailsStr.split(',').map((e: string) => e.trim()).filter((e: string) => e !== '');
    
    // Ensure all mandatory ones are present
    mandatory.forEach(email => {
      if (!list.map(x => x.toLowerCase()).includes(email.toLowerCase())) {
        list.push(email);
      }
    });
    return list;
  } catch (error) {
    return mandatory;
  }
}

export async function notifyNewIndication(indication: any, partnerName: string, partnerEmail?: string) {
  try {
    console.log('[NOTIFICATION] notifyNewIndication force-enabled for partnerName:', partnerName);

    const managers = await getManagerEmails();
    
    // Add partner/seller email to notification recipient list if specified
    if (partnerEmail && partnerEmail.includes('@')) {
      const lowerPartnerEmail = partnerEmail.trim().toLowerCase();
      if (!managers.map(x => x.toLowerCase()).includes(lowerPartnerEmail)) {
        managers.push(partnerEmail.trim());
        console.log('[NOTIFICATION] Added partnerEmail to notifications list:', partnerEmail);
      }
    }
    
    console.log('[NOTIFICATION] notifyNewIndication: Recipient list =', managers);
    
    if (managers.length === 0) {
      console.warn('[NOTIFICATION] notifyNewIndication: No manager emails found!');
      return;
    }

    const subject = `🔥 NOVO LEAD CADASTRADO: ${indication.client_name || indication.company_name} (via ${partnerName})`;
    
    // Build tracking rows based on referral source
    let trackingHtml = '';
    if (indication.lead_source === 'consultor_compartilhado') {
      trackingHtml = `
        <tr>
          <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f3f4f6;">Canal de Venda:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #10b981; border-bottom: 1px solid #f3f4f6;">Consultor Técnico Compartilhado</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f3f4f6;">Compartilhado por:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #f97316; border-bottom: 1px solid #f3f4f6;">${indication.shared_by_seller_name || 'Parceiro/Vendedor'} (${indication.shared_by_seller_email || 'Email não cadastrado'})</td>
        </tr>
      `;
    } else if (indication.lead_source === 'consultor_direto') {
      trackingHtml = `
        <tr>
          <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f3f4f6;">Canal de Venda:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #3b82f6; border-bottom: 1px solid #f3f4f6;">Consultor Técnico Direto (Cliente)</td>
        </tr>
      `;
    }

    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f97316; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; text-transform: uppercase;">Nova Indicação Recebida</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Um novo negócio foi registrado no sistema por <strong>${partnerName}</strong></p>
        </div>
        
        <div style="padding: 24px;">
          <div style="background-color: #fdf2f7; border-left: 4px solid #f97316; padding: 15px; margin-bottom: 20px;">
             <p style="margin: 0; font-weight: bold; color: #7c2d12; font-size: 16px;">CLIENTE: ${indication.client_name || indication.company_name}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 140px; border-bottom: 1px solid #f3f4f6;">Origem / Indicador:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #f97316; border-bottom: 1px solid #f3f4f6;">${partnerName}</td>
            </tr>
            ${trackingHtml}
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f3f4f6;">WhatsApp Cliente:</td>
              <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f3f4f6;">${indication.client_phone || indication.phone || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f3f4f6;">Nome da Empresa:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${indication.company_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f3f4f6;">Cidade/UF:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${indication.city || '-'}/${indication.state || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f3f4f6;">Equipamento:</td>
              <td style="padding: 8px 0; color: #f97316; font-weight: bold; border-bottom: 1px solid #f3f4f6;">${indication.product_name || 'Personalizado'}</td>
            </tr>
          </table>

          <div style="margin-top: 30px; text-align: center;">
            <a href="https://roderindica.roderbrasil.com.br/triagem" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">ACESSAR TRIAGEM NO SISTEMA</a>
          </div>
        </div>
      </div>
    `;

    // Send to each manager individually to avoid Gmail rate/format limits and secure delivery for all valid recipients
    console.log('[NOTIFICATION] notifyNewIndication: Sending individual emails to:', managers);
    const results = await Promise.allSettled(
      managers.map(async (managerEmail) => {
        try {
          console.log(`[NOTIFICATION] Sending email to manager: ${managerEmail}`);
          const res = await sendEmail({ to: managerEmail, subject, html });
          return { email: managerEmail, success: res?.success || false, data: res };
        } catch (innerErr: any) {
          console.error(`[NOTIFICATION] Failed to send email to ${managerEmail}:`, innerErr);
          return { email: managerEmail, success: false, error: innerErr.message };
        }
      })
    );
    console.log('[NOTIFICATION] notifyNewIndication individual results:', results);
    return { success: true, results };
  } catch (err) {
    console.error('Erro crítico ao notificar nova indicação:', err);
  }
}

export async function notifyPartnerIndicationReceived(indication: any, partnerEmail: string, partnerName: string) {
  if (!(await shouldSendNotification('confirmation_partner'))) return;
  if (!partnerEmail || partnerEmail.endsWith('@mobile.roder.com.br')) return;

  const subject = `Confirmação de Recebimento: Sua indicação de ${indication.client_name}`;
  const html = `
    <div style="font-family: sans-serif; color: #333;">
      <h2 style="color: #eab308;">Olá ${partnerName},</h2>
      <p>Recebemos com sucesso a sua indicação para <strong>${indication.client_name}</strong>.</p>
      
      <p>Gostaríamos de informar que nossa equipe comercial já foi notificada. Em breve, um de nossos vendedores entrará em contato para dar continuidade ao atendimento e buscar o fechamento do negócio.</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eab308;">
        <p style="margin: 0;"><strong>Equipamento:</strong> ${indication.product_name}</p>
        <p style="margin: 5px 0 0 0;"><strong>Status Inicial:</strong> Em Triagem</p>
      </div>

      <p>Você pode acompanhar o andamento desta e de outras indicações diretamente no seu painel no sistema <strong>Roder Indica</strong>.</p>
      
      <p>Agradecemos pela confiança e pela parceria!</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">Atenciosamente,<br>Equipe Roder Máquinas</p>
    </div>
  `;

  await sendEmail({ to: partnerEmail, subject, html });
}

export async function notifyPartnerBudgetSent(indication: any, partnerEmail: string, partnerName: string, sellerName: string, sellerPhone?: string) {
  if (!partnerEmail || partnerEmail.endsWith('@mobile.roder.com.br')) return;
  
  const subject = `Orçamento Enviado: Sua indicação de ${indication.client_name}`;
  
  // Format WhatsApp link for the seller if they have phone number
  let contactSection = '';
  if (sellerPhone) {
    const cleanPhone = sellerPhone.replace(/\D/g, '');
    const waLink = `https://wa.me/55${cleanPhone}?text=Olá%20${encodeURIComponent(sellerName)},%20sou%20o%20parceiro%20${encodeURIComponent(partnerName)}%20e%20gostaria%20de%20saber%20da%20indicação%20de%20${encodeURIComponent(indication.client_name)}`;
    contactSection = `
      <p style="margin: 15px 0 5px 0;">Você pode falar diretamente com o vendedor responsável pelo WhatsApp:</p>
      <div style="margin: 10px 0;">
        <a href="${waLink}" style="background: #25d366; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Falar com ${sellerName} no WhatsApp</a>
      </div>
    `;
  } else {
    contactSection = `<p>O vendedor responsável pelo atendimento é <strong>${sellerName}</strong>.</p>`;
  }

  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f97316; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; text-transform: uppercase;">Orçamento Enviado ao Cliente!</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Sua indicação está avançando no comercial da RODER</p>
      </div>
      
      <div style="padding: 24px; line-height: 1.6;">
        <p>Olá <strong>${partnerName}</strong>,</p>
        
        <p>Temos ótimas notícias! O orçamento técnico-comercial foi enviado com sucesso para o cliente <strong>${indication.client_name}</strong> (empresa: <em>${indication.company_name || 'Não informada'}</em>) referente ao equipamento <strong>${indication.product_name || 'equipamento solicitado'}</strong>.</p>
        
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
          <p style="margin: 0; font-weight: bold; color: #b45309; font-size: 15px;">"Esperamos que esta venda seja concluída!"</p>
        </div>

        <p><strong>Acompanhamento da Negociação:</strong></p>
        <p>A plataforma <strong>RODER Indica</strong> é o seu canal oficial exclusivo para verificar o progresso, ver o status atualizado e acompanhar os seus ganhos em tempo real.</p>
        
        <div style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 15px;">
          ${contactSection}
        </div>
        
        <p style="font-size: 13px; color: #666; margin-top: 25px;">Qualquer alteração relevante de status na negociação (como andamento, faturamento ou encerramento) será enviada automaticamente para o seu e-mail.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">Roder Máquinas e Equipamentos Ltda.<br>Este é um e-mail automático de acompanhamento de parceria.</p>
      </div>
    </div>
  `;

  await sendEmail({ to: partnerEmail, subject, html, fromName: 'Roder Indica' });
}

export async function notifyStatusChange(indication: any, partnerEmail: string, partnerName: string, sellerName?: string) {
  if (!(await shouldSendNotification('status_change_partner'))) return;
  if (!partnerEmail || partnerEmail.endsWith('@mobile.roder.com.br')) return;

  const statusMap: any = {
    'new': 'Nova Indicação',
    'triagem': 'Em Triagem',
    'negotiating': 'Em Negociação',
    'sold': 'Venda Concluída! ✅',
    'lost': 'Negociação Encerrada (Perdida) ❌',
    'cancelled': 'Indicação Cancelada ❌',
    'archived': 'Arquivada (Duplicidade)'
  };

  const status = indication.status || 'negotiating';
  const statusLabel = statusMap[status] || status;

  let headerColor = '#f97316'; // orange
  let title = `Atualização da sua indicação: ${indication.client_name}`;
  let customMessage = '';

  if (status === 'sold') {
    headerColor = '#22c55e'; // green
    title = `🎉 PARABÉNS! Sua indicação de ${indication.client_name} foi CONCLUÍDA!`;
    customMessage = `
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-weight: bold; color: #15803d; font-size: 15px;">Faturamento Confirmado!</p>
        <p style="margin: 5px 0 0 0; color: #166534; font-size: 13px;">O negócio foi fechado com sucesso pela fábrica! A comissão correspondente à sua indicação já foi provisionada no sistema. Agradecemos imensamente pela excelente indicação!</p>
      </div>
    `;
  } else if (status === 'lost' || status === 'cancelled') {
    headerColor = '#ef4444'; // red
    title = `Atualização: Indicação de ${indication.client_name} finalizada`;
    customMessage = `
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-weight: bold; color: #991b1b; font-size: 14px;">Negociação Encerrada sem Venda</p>
        <p style="margin: 5px 0 0 0; color: #7f1d1d; font-size: 13px;">Infelizmente este lead não seguiu com a compra do equipamento neste momento. Continuamos à disposição do cliente para futuras oportunidades.</p>
      </div>
    `;
  } else if (status === 'negotiating') {
    headerColor = '#3b82f6'; // blue
    title = `Sua indicação de ${indication.client_name} está em Negociação`;
    customMessage = `
      <p>Nosso setor comercial de fábrica já está em contato ativo com o cliente, tirando dúvidas técnicas sobre a máquina base e elaborando as melhores condições técnicas para o fechamento.</p>
    `;
  }

  const subject = title;

  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${headerColor}; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; text-transform: uppercase;">Atualização de Status</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Acompanhe o progresso da sua indicação</p>
      </div>
      
      <div style="padding: 24px; line-height: 1.6;">
        <p>Olá <strong>${partnerName}</strong>,</p>
        
        <p>Gostaríamos de informar que a sua indicação para <strong>${indication.client_name}</strong> (referente ao equipamento: <em>${indication.product_name || 'Equipamento Roder'}</em>) mudou de status.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
          <span style="font-size: 13px; color: #64748b; text-transform: uppercase; display: block; font-weight: bold; letter-spacing: 0.5px;">Novo Status:</span>
          <span style="font-size: 18px; font-weight: bold; color: ${headerColor}; display: block; margin-top: 5px;">${statusLabel}</span>
        </div>

        ${customMessage}

        <p><strong>Canal de Acompanhamento:</strong></p>
        <p>Lembramos que a plataforma <strong>RODER Indica</strong> é o único canal de acompanhamento oficial onde você pode verificar o progresso detalhado de suas negociações, o histórico e os valores de comissões agendadas.</p>
        
        ${sellerName ? `<p style="font-size: 13px; color: #666; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">Vendedor responsável na fábrica: <strong>${sellerName}</strong></p>` : ''}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">Roder Máquinas e Equipamentos Ltda.<br>Informativo automático de parceria.</p>
      </div>
    </div>
  `;

  await sendEmail({ to: partnerEmail, subject, html, fromName: 'Roder Indica' });
}

export async function notifyCommissionApproved(commission: any, partnerEmail: string, partnerName: string) {
  if (!(await shouldSendNotification('commission_approved_partner'))) return;
  if (!partnerEmail || partnerEmail.endsWith('@mobile.roder.com.br')) return;

  const subject = `Comissão Aprovada! 💸`;
  const html = `
    <div style="font-family: sans-serif; color: #333;">
      <h2>Ótima notícia, ${partnerName}!</h2>
      <p>O seu pagamento de comissão no valor de <strong>R$ ${commission.value.toLocaleString('pt-BR')}</strong> foi aprovado e processado pelo nosso financeiro.</p>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
        <p style="margin: 0;"><strong>Status:</strong> Pago ✅</p>
        <p style="margin: 5px 0 0 0;"><strong>Valor:</strong> R$ ${commission.value.toLocaleString('pt-BR')}</p>
      </div>

      <p>Obrigado por sua parceria contínua com a Roder. Continue indicando para faturar ainda mais!</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">Equipe Financeira Roder.</p>
    </div>
  `;

  await sendEmail({ to: partnerEmail, subject, html });
}

export async function sendBudgetToClient(indication: any, clientEmail: string, budgetUrl: string, sellerName: string) {
  const subject = `Orçamento Equipamento Roder - ${indication.product_name}`;
  const html = `
    <div style="font-family: sans-serif; color: #333;">
      <h2>Olá ${indication.client_name},</h2>
      <p>É um prazer atendê-lo. Conforme solicitado, segue o orçamento para o equipamento <strong>${indication.product_name}</strong>.</p>
      
      <div style="margin: 30px 0;">
        <a href="${budgetUrl}" style="background: #eab308; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Visualizar Orçamento (PDF)</a>
      </div>

      <p>Em caso de dúvidas, fico à sua disposição.</p>
      
      <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
        <p>Atenciosamente,</p>
        <p><strong>${sellerName}</strong></p>
        <p>Comercial Roder</p>
        <p><img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder" style="height: 30px;"></p>
      </div>
    </div>
  `;

  return await sendEmail({ 
    to: clientEmail, 
    subject, 
    html,
    fromName: `${sellerName} - Roder`
  });
}

export async function sendThankYouEmail(clientName: string, clientEmail: string, fairName: string) {
  const subject = `Obrigado pela visita na ${fairName}! - Roder Brasil`;
  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 15px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder Brasil" style="height: 50px;">
      </div>
      
      <h2 style="color: #22c55e;">Olá ${clientName},</h2>
      
      <p style="font-size: 16px; line-height: 1.6;">Gostaríamos de agradecer imensamente pela sua visita ao nosso estande na <strong>${fairName}</strong>!</p>
      
      <p style="font-size: 16px; line-height: 1.6;">Foi um prazer conhecer você e entender melhor suas necessidades operacionais. Já registramos sua solicitação em nosso sistema.</p>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 10px; margin: 25px 0;">
        <p style="margin: 0; font-weight: bold; color: #166534;">Próximos Passos:</p>
        <p style="margin: 10px 0 0 0; color: #15803d;">Nossa equipe comercial já está analisando seu perfil e em breve um de nossos vendedores entrará em contato para dar continuidade ao atendimento e formalizar sua proposta.</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">Enquanto isso, você pode conhecer mais sobre nossas soluções em nosso site oficial.</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://roderbrasil.com.br" style="display: inline-block; background: #22c55e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Visitar Site da Roder</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #999; text-align: center;">
        Roder Brasil - Tecnologia em Equipamentos Florestais e Agrícolas<br>
        Este é um e-mail automático enviado após o seu cadastro em nosso estande.
      </p>
    </div>
  `;

  return await sendEmail({ 
    to: clientEmail, 
    subject, 
    html,
    fromName: 'Roder Brasil'
  });
}

export async function notifyLuanaNewFairLead(lead: any, fairName: string) {
  const managers = await getManagerEmails();
  const subject = `NOVO LEAD FEIRA: ${lead.name} (${fairName})`;
  const html = `
    <div style="font-family: sans-serif; color: #333;">
      <h2 style="color: #22c55e;">Roder Indica V2 - Novo Lead Feira</h2>
      <p>Um novo lead acaba de ser capturado na feira <strong>${fairName}</strong>!</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd;">
        <p><strong>Lead/Cliente:</strong> ${lead.name}</p>
        <p><strong>WhatsApp:</strong> ${lead.phone || 'N/A'}</p>
        <p><strong>E-mail:</strong> ${lead.email || 'N/A'}</p>
        <p><strong>Empresa:</strong> ${lead.company || 'N/A'}</p>
        <p><strong>Interesses:</strong> ${(lead.interest_products || []).join(', ')}</p>
        <p><strong>Vendedor:</strong> ${lead.salesperson_name}</p>
      </div>
  
      <p>Acesse o painel de triagem de feiras para gerenciar este lead.</p>
      <a href="${window.location.origin}/fairs/triagem" style="display: inline-block; background: #22c55e; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Triagem de Feiras</a>
    </div>
  `;

  // Send a single email with all manager recipients to avoid concurrent connection rate limits on Gmail SMTP
  const recipientString = managers.join(', ');
  console.log('[NOTIFICATION] notifyLuanaNewFairLead: Sending single combined email to:', recipientString);
  const result = await sendEmail({ to: recipientString, subject, html });
  return { success: result.success, count: managers.length };
}

export async function notifyStockUpdate(emails: string[], appOrigin: string) {
  const stockUrl = `${appOrigin}/stock_holder`;
  const subject = `Estoque de Pronta Entrega Atualizado! 📦 - Roder Brasil`;
  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 15px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder Brasil" style="height: 50px;">
      </div>
      
      <h2 style="color: #eab308; text-align: center; font-size: 22px; margin-bottom: 20px;">Estoque de Pronta Entrega Atualizado! 📦</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">Olá,</p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">Passando para informar que o nosso **estoque de produtos a pronta entrega** (Fábrica e Filial Sinop) foi atualizado!</p>
      
      <div style="background: #fef08a; border-left: 4px solid #eab308; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px; color: #854d0e; font-weight: bold; line-height: 1.6;">
          O estoque de Produtos a pronta entrega foi atualizado e está pronto para ser oferecido nos negócios para os clientes.
        </p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">Você pode consultar a lista e as quantidades atualizadas em tempo real clicando no botão abaixo:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${stockUrl}" style="display: inline-block; background-color: #eab308; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">Ver Estoque Público 🔍</a>
      </div>
      
      <p style="font-size: 14px; line-height: 1.5; color: #64748b; text-align: center;">
        Se o botão não funcionar, clique ou copie o link abaixo:<br>
        <a href="${stockUrl}" style="color: #3b82f6; text-decoration: underline;">${stockUrl}</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 35px 0;">
      
      <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.4;">
        Roder Brasil - Tecnologia em Equipamentos Florestais e Agrícolas<br>
        Este é um e-mail informativo do sistema Roder Indica V2.
      </p>
    </div>
  `;

  // Send emails using Promise.all
  const results = await Promise.all(
    emails.map(async (email) => {
      try {
        return await sendEmail({
          to: email,
          subject,
          html,
          fromName: 'Roder Brasil'
        });
      } catch (err) {
        console.error(`Failed to send stock update email to ${email}:`, err);
        return { success: false, error: err };
      }
    })
  );

  const successful = results.filter(r => r && r.success).length;
  return { success: true, total: emails.length, sent: successful };
}

export async function notifyClosedOrder(params: {
  indication: any;
  sellerName: string;
  sellerEmail: string;
  saleValue: number;
  saleDate: string;
}) {
  const { indication, sellerName, sellerEmail, saleValue, saleDate } = params;
  
  const formattedSaleDate = saleDate ? saleDate.split('-').reverse().join('/') : '-';
  
  const recipients = [
    'gislene@roderbrasil.com.br',
    'jeferson@roderbrasil.com.br',
    'financeiro@roderbrasil.com.br',
    'contato@roderbrasil.com.br'
  ];
  
  if (sellerEmail && !recipients.map(r => r.toLowerCase()).includes(sellerEmail.toLowerCase())) {
    recipients.push(sellerEmail);
  }

  const subject = `PEDIDO FECHADO: ${indication.client_name} - Pedido #${indication.sale_order_number || ''}`;

  let productsHtml = '';
  if (indication.commissioned_products && indication.commissioned_products.length > 0) {
    productsHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
            <th style="padding: 10px; font-weight: bold; color: #475569;">Equipamento/Produto</th>
            <th style="padding: 10px; font-weight: bold; color: #475569; text-align: center;">Qtd</th>
            <th style="padding: 10px; font-weight: bold; color: #475569; text-align: right;">Vlr Unitário</th>
            <th style="padding: 10px; font-weight: bold; color: #475569; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${indication.commissioned_products.map((p: any) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; color: #1e293b;">
                <strong style="display: block;">${p.name}</strong>
                <span style="font-size: 11px; color: #64748b; font-family: monospace;">${p.code}</span>
              </td>
              <td style="padding: 10px; text-align: center; color: #475569;">${p.quantity}</td>
              <td style="padding: 10px; text-align: right; color: #475569;">R$ ${(p.base_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; color: #0f172a;">R$ ${((p.base_value || 0) * p.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    productsHtml = `<p style="font-size: 14px; color: #64748b; font-style: italic;">Nenhum produto oficial vinculado.</p>`;
  }

  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
        <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder Brasil" style="height: 45px;">
        <h2 style="color: #16a34a; font-size: 22px; margin: 15px 0 5px 0; font-weight: bold; text-transform: uppercase;">A Negociação foi Concluída! 🚀</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Pedido de Venda fechado no sistema Roder Indica V2</p>
      </div>
      
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">Olá,</p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">Gostaríamos de informar que um novo pedido de venda foi finalizado com sucesso por <strong>${sellerName}</strong> (${sellerEmail}).</p>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: #14532d; font-size: 16px; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #bbf7d0; padding-bottom: 6px;">
          Dados do Pedido de Venda
        </h3>
        <table style="font-size: 14px; border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 4px 0; color: #15803d; font-weight: bold; width: 40%;">Nº Pedido de Venda:</td>
            <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">#${indication.sale_order_number || 'Não informado'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #15803d; font-weight: bold;">Data do Pedido:</td>
            <td style="padding: 4px 0; color: #1e293b;">${formattedSaleDate}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #15803d; font-weight: bold;">Previsão de Entrega:</td>
            <td style="padding: 4px 0; color: #1e293b;">${indication.delivery_date ? indication.delivery_date.split('-').reverse().join('/') : 'Não informada'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #15803d; font-weight: bold;">Valor Total:</td>
            <td style="padding: 4px 0; color: #16a34a; font-weight: 905; font-size: 16px;">R$ ${saleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #15803d; font-weight: bold;">Vendedor:</td>
            <td style="padding: 4px 0; color: #1e293b;">${sellerName}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 12px 0; color: #334155; font-size: 16px; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
          Informações do Cliente
        </h3>
        <table style="font-size: 14px; border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 4px 0; color: #475569; font-weight: bold; width: 30%;">Razão Social:</td>
            <td style="padding: 4px 0; color: #0f172a; font-weight: bold;">${indication.client_name || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #475569; font-weight: bold;">CNPJ/CPF:</td>
            <td style="padding: 4px 0; color: #334155; font-family: monospace;">${indication.client_cnpj || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #475569; font-weight: bold;">Código ERP:</td>
            <td style="padding: 4px 0; color: #334155; font-weight: bold;">${indication.client_code || 'Não cadastrado'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #475569; font-weight: bold;">Cidade/UF:</td>
            <td style="padding: 4px 0; color: #334155;">${indication.city || '-'}/${indication.state || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #475569; font-weight: bold;">E-mail:</td>
            <td style="padding: 4px 0; color: #334155;">${indication.client_email || 'Não informado'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #475569; font-weight: bold;">WhatsApp:</td>
            <td style="padding: 4px 0; color: #334155;">${indication.client_phone || 'Não informado'}</td>
          </tr>
        </table>
      </div>

      <div style="margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 15px; text-transform: uppercase; font-weight: bold;">Equipamentos no Pedido</h3>
        ${productsHtml}
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      
      <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.4; margin: 0;">
        Roder Brasil - Tecnologia em Equipamentos Florestais e Agrícolas<br>
        Este é um e-mail automático gerado pelo sistema Roder Indica V2 após a finalização de faturamento.
      </p>
    </div>
  `;

  // Send a single email with all recipients to avoid concurrent connection rate limits on Gmail SMTP
  const recipientString = recipients.join(', ');
  console.log('[NOTIFICATION] notifyClosedOrder: Sending single combined email to:', recipientString);
  const result = await sendEmail({
    to: recipientString,
    subject,
    html,
    fromName: 'Roder Indica'
  });

  return { success: result.success, total: recipients.length };
}

export async function notifyLeadAssignment(
  indication: any,
  seller: { name: string; email: string; phone?: string },
  partner: { name: string; email: string; phone?: string }
) {
  try {
    console.log('[NOTIFICATION] notifyLeadAssignment triggering for:', indication.client_name);

    // 1. Send email to the designated internal salesperson
    const sellerSubject = `🚀 NOVO LEAD COMERCIAL: ${indication.client_name || 'Cliente'} - Parceiro: ${partner.name}`;
    
    // Formatting items if any
    let itemsListHtml = '';
    if (indication.items && indication.items.length > 0) {
      itemsListHtml = `
        <div style="margin-top: 15px;">
          <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: bold; color: #475569; text-transform: uppercase;">Equipamentos Solicitados:</p>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${indication.items.map((item: any) => `
              <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: #1e293b; margin-right: 5px; margin-bottom: 5px;">
                ${item.quantity}x ${item.product_name}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }

    const sellerHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background-color: #ffffff;">
        <div style="background-color: #f97316; color: white; padding: 24px; text-align: center;">
          <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder" style="height: 35px; filter: brightness(0) invert(1); margin-bottom: 10px;">
          <h2 style="margin: 0; text-transform: uppercase; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">Novo Lead Atribuído</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Você foi designado(a) para realizar o atendimento desta indicação</p>
        </div>
        
        <div style="padding: 24px; line-height: 1.6;">
          <p style="font-size: 15px; margin-top: 0;">Olá <strong>${seller.name}</strong>,</p>
          <p style="font-size: 15px; color: #475569;">Um novo lead vindo do canal de indicações da RODER foi direcionado para você. Você deve dar continuidade ao atendimento técnico-comercial e registrar o progresso através do <strong>CRM Agendor</strong>.</p>
          
          <!-- Client Card -->
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 18px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #b45309; font-size: 15px; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #fef3c7; padding-bottom: 4px;">
              Informações do Cliente
            </h3>
            <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
              <tr>
                <td style="padding: 4px 0; color: #b45309; font-weight: bold; width: 35%;">Cliente:</td>
                <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${indication.client_name || indication.client_person_name || 'Não informado'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #b45309; font-weight: bold;">Localização:</td>
                <td style="padding: 4px 0; color: #1e293b;">${indication.client_location || 'Não informada'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #b45309; font-weight: bold;">WhatsApp / Contato:</td>
                <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${indication.client_phone || 'Não informado'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #b45309; font-weight: bold;">Máquina Base:</td>
                <td style="padding: 4px 0; color: #1e293b;">${indication.base_machine || 'Não informada'} ${indication.machine_details || ''}</td>
              </tr>
            </table>
            ${itemsListHtml}
            ${indication.description ? `
              <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #fef3c7;">
                <p style="margin: 0; font-size: 11px; font-weight: bold; color: #b45309; text-transform: uppercase;">Descrição da Necessidade:</p>
                <p style="margin: 3px 0 0 0; font-size: 12px; color: #475569; font-style: italic;">"${indication.description}"</p>
              </div>
            ` : ''}
          </div>

          <!-- Partner Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 15px; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              Parceiro Indicador Responsável
            </h3>
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #475569;">Este lead possui alto grau de confiança devido à recomendação do nosso parceiro credenciado. Entre em contato com ele para alinhar informações antes de ligar para o cliente!</p>
            <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-weight: bold; width: 35%;">Parceiro:</td>
                <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${partner.name}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-weight: bold;">WhatsApp / Celular:</td>
                <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">
                  <a href="https://wa.me/${(partner.phone || '').replace(/\D/g, '')}" style="color: #25d366; text-decoration: none; font-weight: bold;">
                    ${partner.phone || 'Não informado'} 💬
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-weight: bold;">E-mail:</td>
                <td style="padding: 4px 0; color: #1e293b;">${partner.email}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #1e40af;">
            <strong>💡 Dica de Ouro:</strong> Converse com o parceiro <strong>${partner.name}</strong> por WhatsApp! Ele pode possuir fotos ou vídeos da máquina do cliente, saber detalhes específicos da demanda, ou explicar como o cliente prefere ser atendido, garantindo um contato inicial muito mais assertivo e produtivo.
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://roderindica.roderbrasil.com.br/indicacoes" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">ACESSAR PAINEL DO VENDEDOR</a>
          </div>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;">
        <div style="padding: 20px; background-color: #f8fafc; text-align: center;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.4;">
            Roder Máquinas e Equipamentos Ltda.<br>
            Este é um e-mail automático gerado pelo sistema Roder Indica V2.
          </p>
        </div>
      </div>
    `;

    // Send to seller
    await sendEmail({
      to: seller.email,
      subject: sellerSubject,
      html: sellerHtml,
      fromName: 'Roder Indica'
    });
    console.log(`[NOTIFICATION] Lead assignment email sent successfully to seller: ${seller.email}`);

    // 2. Send email to the partner indicator (external seller)
    if (partner.email && !partner.email.endsWith('@mobile.roder.com.br')) {
      const partnerSubject = `🎉 Sua indicação de ${indication.client_name || 'Cliente'} já está com vendedor responsável!`;
      
      const partnerHtml = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background-color: #ffffff;">
          <div style="background-color: #10b981; color: white; padding: 24px; text-align: center;">
            <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder" style="height: 35px; filter: brightness(0) invert(1); margin-bottom: 10px;">
            <h2 style="margin: 0; text-transform: uppercase; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">Indicação em Atendimento!</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Seu lead já foi encaminhado para o setor comercial da fábrica</p>
          </div>
          
          <div style="padding: 24px; line-height: 1.6;">
            <p style="font-size: 15px; margin-top: 0;">Olá <strong>${partner.name}</strong>,</p>
            <p style="font-size: 15px; color: #475569;">Gostaríamos de informar que a sua indicação para o cliente <strong>${indication.client_name || 'Cliente'}</strong> já foi distribuída e está sob os cuidados de um de nossos vendedores internos da fábrica!</p>
            
            <!-- Seller Info Card -->
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 15px; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #bbf7d0; padding-bottom: 4px;">
                Vendedor Interno Designado
              </h3>
              <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
                <tr>
                  <td style="padding: 4px 0; color: #15803d; font-weight: bold; width: 35%;">Vendedor(a):</td>
                  <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">${seller.name}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #15803d; font-weight: bold;">WhatsApp / Celular:</td>
                  <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">
                    <a href="https://wa.me/55${(seller.phone || '').replace(/\D/g, '')}" style="color: #25d366; text-decoration: none; font-weight: bold;">
                      ${seller.phone || 'Não informado'} 💬
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #15803d; font-weight: bold;">E-mail:</td>
                  <td style="padding: 4px 0; color: #1e293b;">${seller.email}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #1e40af; line-height: 1.5;">
              <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">💡 Como você pode acelerar o fechamento e ajudar o seu cliente?</p>
              Se você possuir fotos ou vídeos da máquina do cliente, marca, modelo ou qualquer detalhe operacional específico sobre essa demanda, **compartilhe diretamente com o(a) vendedor(a) ${seller.name} por WhatsApp**!
              <br><br>
              Dessa forma, o(a) vendedor(a) poderá **gerar o orçamento correto diretamente baseado nas informações que você enviou**, reduzindo burocracias e otimizando o tempo. Após elaborar o orçamento, ele(a) enviará uma mensagem informando que a proposta foi feita com base nos detalhes precisos que você forneceu.
            </div>

            <p style="font-size: 14px; color: #475569;">Esta cooperação mútua garante que alinhemos as melhores expectativas, oferecendo o equipamento perfeitamente dimensionado para o trabalho do cliente.</p>
            
            <p style="font-size: 14px; color: #475569;">Você pode continuar acompanhando todo o histórico e a evolução deste atendimento diretamente no painel do <strong>RODER Indica</strong>.</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;">
          <div style="padding: 20px; background-color: #f8fafc; text-align: center;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.4;">
              Roder Máquinas e Equipamentos Ltda.<br>
              Este é um e-mail automático de acompanhamento de parceria.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: partner.email,
        subject: partnerSubject,
        html: partnerHtml,
        fromName: 'Roder Indica'
      });
      console.log(`[NOTIFICATION] Lead assignment email sent successfully to partner: ${partner.email}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erro crítico em notifyLeadAssignment:', err);
    return { success: false, error: err.message };
  }
}
