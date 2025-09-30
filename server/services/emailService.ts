import sgMail from '@sendgrid/mail';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Configurar SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ruidcar.com.br';
const FROM_NAME = process.env.FROM_NAME || 'RuidCar';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Tipos
interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface AppointmentEmailData {
  customerName: string;
  customerEmail: string;
  workshopName: string;
  workshopAddress: string;
  workshopPhone?: string;
  date: string;
  time: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleCategory: string;
  problemDescription?: string;
  confirmationCode: string;
  price: number;
  workshopEmail?: string;
}

interface ReminderEmailData {
  customerName: string;
  customerEmail: string;
  workshopName: string;
  workshopAddress: string;
  date: string;
  time: string;
  confirmationCode: string;
}

interface WorkshopNotificationData {
  workshopEmail: string;
  workshopName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  time: string;
  vehicleInfo: string;
  problemDescription?: string;
}

// Templates de Email
const templates = {
  // Template de confirmação para cliente
  customerConfirmation: (data: AppointmentEmailData) => {
    const formattedDate = format(parseISO(data.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    const formattedPrice = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(data.price / 100);

    return {
      subject: `✅ Agendamento Confirmado - Diagnóstico RuidCar`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .confirmation-code { background: #667eea; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 Agendamento Confirmado!</h1>
              <p>Diagnóstico RuidCar</p>
            </div>

            <div class="content">
              <p>Olá <strong>${data.customerName}</strong>,</p>

              <p>Seu agendamento para diagnóstico com RuidCar foi confirmado com sucesso!</p>

              <div class="confirmation-code">
                Código: ${data.confirmationCode}
              </div>

              <div class="info-box">
                <h3>📍 Local do Atendimento</h3>
                <p><strong>${data.workshopName}</strong></p>
                <p>${data.workshopAddress}</p>
                ${data.workshopPhone ? `<p>📞 ${data.workshopPhone}</p>` : ''}
              </div>

              <div class="info-box">
                <h3>📅 Data e Horário</h3>
                <div class="info-row">
                  <span class="label">Data:</span>
                  <span class="value">${formattedDate}</span>
                </div>
                <div class="info-row">
                  <span class="label">Horário:</span>
                  <span class="value">${data.time}</span>
                </div>
              </div>

              <div class="info-box">
                <h3>🚗 Veículo</h3>
                <div class="info-row">
                  <span class="label">Modelo:</span>
                  <span class="value">${data.vehicleModel} ${data.vehicleYear}</span>
                </div>
                <div class="info-row">
                  <span class="label">Categoria:</span>
                  <span class="value">${data.vehicleCategory}</span>
                </div>
                ${data.problemDescription ? `
                <div style="margin-top: 10px;">
                  <span class="label">Descrição do problema:</span>
                  <p>${data.problemDescription}</p>
                </div>
                ` : ''}
              </div>

              <div class="info-box">
                <h3>💰 Valor do Serviço</h3>
                <div class="info-row">
                  <span class="label">Total:</span>
                  <span class="value" style="font-size: 20px; font-weight: bold; color: #667eea;">
                    ${formattedPrice}
                  </span>
                </div>
              </div>

              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Chegue com 10 minutos de antecedência</li>
                  <li>Leve este código de confirmação</li>
                  <li>Em caso de cancelamento, entre em contato com antecedência</li>
                </ul>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <p><strong>Precisa de ajuda?</strong></p>
                <p>Entre em contato com a oficina ou responda este email</p>
              </div>
            </div>

            <div class="footer">
              <p>© 2025 RuidCar - Diagnóstico Automotivo Avançado</p>
              <p>Este é um email automático, por favor não responda</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Agendamento Confirmado - Diagnóstico RuidCar

        Olá ${data.customerName},

        Seu agendamento foi confirmado!

        CÓDIGO DE CONFIRMAÇÃO: ${data.confirmationCode}

        LOCAL:
        ${data.workshopName}
        ${data.workshopAddress}
        ${data.workshopPhone || ''}

        DATA E HORÁRIO:
        ${formattedDate}
        Às ${data.time}

        VEÍCULO:
        ${data.vehicleModel} ${data.vehicleYear}

        VALOR: ${formattedPrice}

        Importante:
        - Chegue com 10 minutos de antecedência
        - Leve este código de confirmação

        Atenciosamente,
        Equipe RuidCar
      `
    };
  },

  // Template de lembrete para cliente
  customerReminder: (data: ReminderEmailData) => {
    const formattedDate = format(parseISO(data.date), "EEEE, d 'de' MMMM", { locale: ptBR });

    return {
      subject: `⏰ Lembrete: Diagnóstico RuidCar Amanhã - ${data.time}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .code { background: #667eea; color: white; padding: 10px 20px; border-radius: 6px; display: inline-block; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Lembrete de Agendamento</h1>
            </div>

            <div class="content">
              <p>Olá <strong>${data.customerName}</strong>,</p>

              <p>Lembramos que você tem um diagnóstico RuidCar agendado para <strong>amanhã</strong>!</p>

              <div class="info-box">
                <h3>📅 Detalhes do Agendamento</h3>
                <p><strong>Data:</strong> ${formattedDate}</p>
                <p><strong>Horário:</strong> ${data.time}</p>
                <p><strong>Local:</strong> ${data.workshopName}</p>
                <p><strong>Endereço:</strong> ${data.workshopAddress}</p>
                <p><strong>Código:</strong> <span class="code">${data.confirmationCode}</span></p>
              </div>

              <div class="info-box" style="background: #fff3cd;">
                <p><strong>📌 Não esqueça:</strong></p>
                <ul>
                  <li>Chegue com 10 minutos de antecedência</li>
                  <li>Leve seu código de confirmação</li>
                  <li>O diagnóstico leva aproximadamente 1 hora</li>
                </ul>
              </div>

              <p style="text-align: center; margin-top: 30px;">
                <strong>Até amanhã! 👋</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Lembrete: Diagnóstico RuidCar Amanhã

        Olá ${data.customerName},

        Seu diagnóstico RuidCar está agendado para amanhã!

        DATA: ${formattedDate}
        HORÁRIO: ${data.time}
        LOCAL: ${data.workshopName}
        ENDEREÇO: ${data.workshopAddress}
        CÓDIGO: ${data.confirmationCode}

        Não esqueça:
        - Chegue com 10 minutos de antecedência
        - Leve seu código de confirmação

        Até amanhã!
        Equipe RuidCar
      `
    };
  },

  // Template de notificação para oficina
  workshopNotification: (data: WorkshopNotificationData) => {
    const formattedDate = format(parseISO(data.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

    return {
      subject: `🆕 Novo Agendamento de Diagnóstico - ${data.customerName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
            .action-button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🆕 Novo Agendamento!</h1>
              <p>Diagnóstico RuidCar</p>
            </div>

            <div class="content">
              <p>Olá <strong>${data.workshopName}</strong>,</p>

              <p>Você recebeu um novo agendamento de diagnóstico RuidCar!</p>

              <div class="info-box">
                <h3>👤 Dados do Cliente</h3>
                <p><strong>Nome:</strong> ${data.customerName}</p>
                <p><strong>Telefone:</strong> ${data.customerPhone}</p>
                <p><strong>Email:</strong> ${data.customerEmail}</p>
              </div>

              <div class="info-box">
                <h3>📅 Agendamento</h3>
                <p><strong>Data:</strong> ${formattedDate}</p>
                <p><strong>Horário:</strong> ${data.time}</p>
              </div>

              <div class="info-box">
                <h3>🚗 Veículo</h3>
                <p>${data.vehicleInfo}</p>
                ${data.problemDescription ? `
                <p style="margin-top: 10px;"><strong>Problema relatado:</strong></p>
                <p>${data.problemDescription}</p>
                ` : ''}
              </div>

              <div style="text-align: center;">
                <a href="${process.env.APP_URL}/workshop/appointments" class="action-button">
                  Ver no Painel
                </a>
              </div>

              <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                Acesse seu painel para gerenciar este agendamento
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Novo Agendamento de Diagnóstico RuidCar

        Olá ${data.workshopName},

        Novo agendamento recebido!

        CLIENTE:
        Nome: ${data.customerName}
        Telefone: ${data.customerPhone}
        Email: ${data.customerEmail}

        AGENDAMENTO:
        Data: ${formattedDate}
        Horário: ${data.time}

        VEÍCULO: ${data.vehicleInfo}
        ${data.problemDescription ? `Problema: ${data.problemDescription}` : ''}

        Acesse seu painel para mais detalhes.

        Equipe RuidCar
      `
    };
  }
};

// Função principal de envio
export async function sendEmail(data: EmailData): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured, email not sent');
    return false;
  }

  try {
    const msg = {
      to: data.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: data.subject,
      text: data.text || data.html.replace(/<[^>]*>/g, ''), // Fallback para texto simples
      html: data.html
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${data.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Funções específicas para cada tipo de email
export async function sendAppointmentConfirmation(data: AppointmentEmailData): Promise<boolean> {
  const emailContent = templates.customerConfirmation(data);
  const sent = await sendEmail({
    to: data.customerEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text
  });

  // Também enviar notificação para oficina se email disponível
  if (sent && data.workshopEmail) {
    await sendWorkshopNotification({
      workshopEmail: data.workshopEmail,
      workshopName: data.workshopName,
      customerName: data.customerName,
      customerPhone: data.customerEmail, // Usando email como fallback
      customerEmail: data.customerEmail,
      date: data.date,
      time: data.time,
      vehicleInfo: `${data.vehicleModel} ${data.vehicleYear} - ${data.vehicleCategory}`,
      problemDescription: data.problemDescription
    });
  }

  return sent;
}

export async function sendAppointmentReminder(data: ReminderEmailData): Promise<boolean> {
  const emailContent = templates.customerReminder(data);
  return await sendEmail({
    to: data.customerEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text
  });
}

export async function sendWorkshopNotification(data: WorkshopNotificationData): Promise<boolean> {
  const emailContent = templates.workshopNotification(data);
  return await sendEmail({
    to: data.workshopEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text
  });
}

// Função para enviar email de cancelamento
export async function sendCancellationEmail(
  customerEmail: string,
  customerName: string,
  workshopName: string,
  date: string,
  time: string,
  reason?: string
): Promise<boolean> {
  const formattedDate = format(parseISO(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return await sendEmail({
    to: customerEmail,
    subject: '❌ Agendamento Cancelado - Diagnóstico RuidCar',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Agendamento Cancelado</h1>
          </div>

          <div class="content">
            <p>Olá <strong>${customerName}</strong>,</p>

            <p>Informamos que seu agendamento de diagnóstico RuidCar foi cancelado.</p>

            <div class="info-box">
              <p><strong>Oficina:</strong> ${workshopName}</p>
              <p><strong>Data:</strong> ${formattedDate}</p>
              <p><strong>Horário:</strong> ${time}</p>
              ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
            </div>

            <p>Para reagendar, entre em contato com a oficina ou acesse nosso site.</p>

            <p>Atenciosamente,<br>Equipe RuidCar</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Agendamento Cancelado - Diagnóstico RuidCar

      Olá ${customerName},

      Seu agendamento foi cancelado:

      Oficina: ${workshopName}
      Data: ${formattedDate}
      Horário: ${time}
      ${reason ? `Motivo: ${reason}` : ''}

      Para reagendar, entre em contato com a oficina.

      Atenciosamente,
      Equipe RuidCar
    `
  });
}

export default {
  sendEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendWorkshopNotification,
  sendCancellationEmail
};