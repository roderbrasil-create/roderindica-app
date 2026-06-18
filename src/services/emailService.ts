import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
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

export async function notifyNewIndication(indication: any, partnerName: string) {
  try {
    const shouldSend = await shouldSendNotification('new_indication_admin');
    console.log('[NOTIFICATION] shouldSend notifyNewIndication:', shouldSend);
    if (!shouldSend) return;

    const managers = await getManagerEmails();
    console.log('[NOTIFICATION] Destinatários da triagem:', managers);

    const subject = `NOVA INDICAÇÃO: ${indication.client_name || indication.company_name} (via ${partnerName})`;
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f97316; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; text-transform: uppercase;">Nova Indicação Recebida</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Um novo negócio foi indicado por ${partnerName}</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="background-color: #fdf2f7; border-left: 4px solid #f97316; padding: 15px; margin-bottom: 20px;">
             <p style="margin: 0; font-weight: bold; color: #7c2d12;">CLIENTE: ${indication.client_name || indication.company_name}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; width: 120px;">WhatsApp:</td><td style="padding: 8px 0; font-weight: bold;">${indication.client_phone || indication.phone || 'Não informado'}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Empresa:</td><td style="padding: 8px 0;">${indication.company_name || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Cidade/UF:</td><td style="padding: 8px 0;">${indication.city || '-'}/${indication.state || '-'}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Equipamento:</td><td style="padding: 8px 0; color: #f97316; font-weight: bold;">${indication.product_name || 'Personalizado'}</td></tr>
          </table>

          <div style="margin-top: 30px; text-align: center;">
            <a href="${window.location.origin}/triagem" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">ACESSAR TRIAGEM NO SISTEMA</a>
          </div>
        </div>
      </div>
    `;

    // Send to all managers in parallel and catch individual errors
    const results = await Promise.allSettled(
      managers.map(email => 
        sendEmail({ to: email, subject, html }).then(res => {
          if (!res.success) throw new Error(`Failed to send to ${email}: ${res.error}`);
          return email;
        })
      )
    );
    
    console.log('[NOTIFICATION] Resultado do envio:', results);
    return results;
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

export async function notifyStatusChange(indication: any, partnerEmail: string, partnerName: string) {
  if (!(await shouldSendNotification('status_change_partner'))) return;
  if (!partnerEmail || partnerEmail.endsWith('@mobile.roder.com.br')) return;

  const statusMap: any = {
    'new': 'Nova',
    'triagem': 'Em Triagem',
    'negotiating': 'Em Negociação',
    'sold': 'Vendida ✅',
    'lost': 'Perdida ❌',
    'cancelled': 'Cancelada'
  };

  const subject = `Atualização da sua indicação: ${indication.client_name}`;
  const html = `
    <div style="font-family: sans-serif; color: #333;">
      <h2>Olá ${partnerName},</h2>
      <p>Sua indicação de <strong>${indication.client_name}</strong> teve uma atualização de status.</p>
      
      <p>O novo status é: <strong style="color: #eab308;">${statusMap[indication.status] || indication.status}</strong></p>
      
      <p>Acompanhe o progresso em tempo real através do painel do indicador no sistema Roder Indica.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">Obrigado por sua parceria com a Roder!</p>
    </div>
  `;

  await sendEmail({ to: partnerEmail, subject, html });
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

  // Send to all managers (which includes Luana, Gislene, and Admin)
  const results = await Promise.all(
    managers.map(email => sendEmail({ to: email, subject, html }))
  );
  return { success: true, count: results.length };
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

  const results = await Promise.all(
    recipients.map(async (email) => {
      try {
        return await sendEmail({
          to: email,
          subject,
          html,
          fromName: 'Roder Indica'
        });
      } catch (err) {
        console.error(`Failed to send order closed email to ${email}:`, err);
        return { success: false, error: err };
      }
    })
  );

  return { success: true, total: recipients.length };
}
