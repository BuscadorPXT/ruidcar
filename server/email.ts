import nodemailer from 'nodemailer';

// Endereço de email do Trello para onde enviar os leads
export const TRELLO_EMAIL = 'eduardo91134297+zsq4kvnmdkew6xesqnve@boards.trello.com';

// Formatação de dados de contato
interface ContactData {
  nome: string;
  empresa: string;
  email: string;
  whatsapp: string;
  cidade: string;
  estado: string;
  tipoEmpresa: string;
  mensagem: string;
  dataEnvio: string;
  origem: string;
}

// Interface para parâmetros de email
interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Formata os dados do formulário no formato padrão do sistema
 * @param formData Dados do formulário em qualquer formato
 * @returns Objeto com dados formatados
 */
export function formatContactData(formData: any): ContactData {
  // Unificamos a nomenclatura para garantir compatibilidade
  return {
    nome: formData.nome || formData.fullName || '',
    empresa: formData.empresa || formData.company || '',
    email: formData.email || '',
    whatsapp: formData.whatsapp || '',
    cidade: formData.cidade || formData.city || '',
    estado: formData.estado || formData.state || '',
    tipoEmpresa: formatBusinessType(formData.tipoEmpresa || formData.businessType || ''),
    mensagem: formData.mensagem || formData.message || '',
    dataEnvio: formData.dataEnvio || new Date().toLocaleString('pt-BR'),
    origem: formData.origem || 'Site RuidCar - Formulário de Contato'
  };
}

/**
 * Formata o tipo de negócio para exibição
 */
function formatBusinessType(businessType: string): string {
  if (businessType === 'officina') return 'Oficina Mecânica';
  if (businessType === 'blindadora') return 'Blindadora';
  if (businessType === 'auto-center') return 'Auto Center';
  return businessType;
}

/**
 * Criar um transportador de email com Nodemailer
 * Usando uma conta de serviço Gmail configurada
 */
function createEmailTransporter() {
  // Configuração para Gmail
  // Nota: Em produção, essa configuração deve ser substituída por valores
  // das variáveis de ambiente ou configurações seguras
  const transporter = nodemailer.createTransport({
    service: 'gmail',  // Use o serviço pré-configurado do Gmail
    auth: {
      user: process.env.GMAIL_USER || 'seu-email@gmail.com', // Email remetente
      pass: process.env.GMAIL_PASS || 'sua-senha-ou-app-password', // Senha ou senha de app
    },
    secure: true, // Usa TLS
  });

  return transporter;
}

/**
 * Enviar email usando Nodemailer
 * @param params Parâmetros do email
 * @returns Boolean indicando sucesso/falha
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Verificar se temos as credenciais configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.log('⚠️ Credenciais de email não configuradas. Configure GMAIL_USER e GMAIL_PASS nas variáveis de ambiente do Replit.');
      console.log('📧 Simulando envio de email:');
      console.log('- Para:', params.to);
      console.log('- Assunto:', params.subject);
      console.log('- Conteúdo HTML:', params.html?.substring(0, 100) + '...');
      return false;
    }
    
    // Criamos o transportador de email
    const transporter = createEmailTransporter();
    
    // Configurando as opções de email
    const mailOptions = {
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    };
    
    // Enviando o email (com as credenciais reais)
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado com sucesso para: ${params.to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Formatar os dados do formulário de contato para email do Trello
 * @param formData Dados do formulário
 * @returns HTML formatado para o email
 */
export function formatContactDataForEmail(formData: any): string {
  const data = formatContactData(formData);
  
  // Formatamos o título do cartão do Trello
  const title = `Lead: ${data.nome} - ${data.empresa}`;
  
  // Formatamos o conteúdo do cartão
  const content = `
<strong>Nome:</strong> ${data.nome}<br>
<strong>Empresa:</strong> ${data.empresa}<br>
<strong>Email:</strong> ${data.email}<br>
<strong>WhatsApp:</strong> ${data.whatsapp}<br>
<strong>Cidade:</strong> ${data.cidade}<br>
<strong>Estado:</strong> ${data.estado}<br>
<strong>Tipo de Empresa:</strong> ${data.tipoEmpresa}<br>
<strong>Mensagem:</strong> ${data.mensagem}<br>
<strong>Data de Envio:</strong> ${data.dataEnvio}<br>
<strong>Origem:</strong> ${data.origem}<br>
  `;
  
  return `<h1>${title}</h1>${content}`;
}

/**
 * Enviar dados do formulário para o Trello via email
 * @param formData Dados do formulário
 * @returns Boolean indicando sucesso/falha
 */
export async function sendContactToTrello(formData: any): Promise<boolean> {
  try {
    console.log('Dados do formulário processados:', formData);
    
    const data = formatContactData(formData);
    
    // Formatamos o assunto do email que se tornará o título do cartão
    const emailSubject = `Novo lead: ${data.nome} - ${data.empresa}`;
    
    // Formatamos o conteúdo HTML do email
    const emailContent = formatContactDataForEmail(formData);
    
    // Configuramos o remetente do email - em produção deve ser atualizado para um email real
    // Idealmente, use um email do seu domínio, como contato@seudominio.com.br
    const fromEmail = process.env.EMAIL_USER || 'seu-email@gmail.com';
    
    // Parâmetros do email
    const emailParams: EmailParams = {
      to: TRELLO_EMAIL,
      from: fromEmail,
      subject: emailSubject,
      html: emailContent
    };
    
    // Enviamos o email
    const result = await sendEmail(emailParams);
    
    if (result) {
      console.log('Email enviado com sucesso para o Trello');
    } else {
      console.log('Falha ao enviar email para o Trello. Os dados foram salvos no banco de dados.');
    }
    
    return result;
  } catch (error) {
    console.error('Erro ao enviar contato para o Trello:', error);
    return false;
  }
}