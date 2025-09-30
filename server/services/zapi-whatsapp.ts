import { db, pool } from '../db';

export interface WhatsAppMessage {
  phone: string;
  message: string;
  leadId?: number;
  templateId?: number;
}

export interface BulkMessageResult {
  phone: string;
  message: string;
  status: 'sent' | 'failed';
  zapiId?: string;
  error?: string;
  leadId?: number;
}

export interface ZAPIResponse {
  value: boolean;
  messageId?: string;
  error?: string;
}

export class ZAPIWhatsAppService {
  private readonly instanceId = process.env.ZAPI_INSTANCE_ID || '3E3EFBCA3E13C17E04F83E61E96978DB';
  private readonly token = process.env.ZAPI_TOKEN || '91D06F6734B2549D951518BE';
  private readonly baseUrl = process.env.ZAPI_BASE_URL || 'https://api.z-api.io';
  private readonly clientToken = process.env.ZAPI_CLIENT_TOKEN;

  private getUrl(endpoint: string): string {
    return `${this.baseUrl}/instances/${this.instanceId}/token/${this.token}/${endpoint}`;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Adiciona Client-Token se estiver configurado
    if (this.clientToken) {
      headers['Client-Token'] = this.clientToken;
    }

    return headers;
  }

  /**
   * Envia uma mensagem individual via Z-API
   */
  async sendMessage(phone: string, message: string): Promise<ZAPIResponse> {
    try {
      const formattedPhone = this.formatPhone(phone);
      const url = this.getUrl('send-text');

      console.log('[Z-API] Enviando mensagem para:', formattedPhone);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          phone: formattedPhone,
          message: message
        })
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        const errorText = await response.text();
        throw new Error(`Z-API Error: ${response.status} - ${errorText}`);
      }

      if (!response.ok) {
        console.error('[Z-API] Erro na resposta:', result);
        throw new Error(`Z-API Error: ${response.status} - ${JSON.stringify(result)}`);
      }

      console.log('[Z-API] Mensagem enviada com sucesso:', {
        phone: formattedPhone,
        messageId: result.messageId,
        value: result.value,
        fullResult: result
      });

      // Garantir que sempre retornamos um objeto com a estrutura esperada
      return {
        value: result.zaapId ? true : result.value,  // Z-API retorna zaapId quando sucesso
        messageId: result.messageId || result.id,
        error: result.error || null
      };
    } catch (error) {
      console.error('[Z-API] Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Envia mensagens em lote com rate limiting
   */
  async sendBulkMessages(messages: WhatsAppMessage[]): Promise<BulkMessageResult[]> {
    const results: BulkMessageResult[] = [];

    for (const msg of messages) {
      try {
        const result = await this.sendMessage(msg.phone, msg.message);

        const bulkResult: BulkMessageResult = {
          phone: msg.phone,
          message: msg.message,
          status: (result.value === true || result.messageId) ? 'sent' : 'failed',
          zapiId: result.messageId,
          leadId: msg.leadId
        };

        results.push(bulkResult);

        // Salvar no banco de dados
        if (msg.leadId) {
          await this.saveMessageToDatabase({
            leadId: msg.leadId,
            phone: msg.phone,
            message: msg.message,
            status: bulkResult.status,
            zapiMessageId: result.messageId,
            templateId: msg.templateId,
            error: result.error
          });
        }

        // Rate limiting: 500ms entre mensagens para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        const errorResult: BulkMessageResult = {
          phone: msg.phone,
          message: msg.message,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          leadId: msg.leadId
        };

        results.push(errorResult);

        // Salvar erro no banco também
        if (msg.leadId) {
          await this.saveMessageToDatabase({
            leadId: msg.leadId,
            phone: msg.phone,
            message: msg.message,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            templateId: msg.templateId
          });
        }
      }
    }

    return results;
  }

  /**
   * Verifica o status da instância Z-API
   */
  async getInstanceStatus(): Promise<any> {
    try {
      const response = await fetch(this.getUrl('status'), {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao verificar status: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao verificar status da instância:', error);
      throw error;
    }
  }

  /**
   * Configura webhooks para receber status de mensagens
   */
  async setupWebhook(webhookUrl: string): Promise<any> {
    try {
      // Configurar webhook para status de mensagens
      const statusResponse = await fetch(this.getUrl('update-webhook-message-status'), {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ value: webhookUrl })
      });

      // Configurar webhook para mensagens recebidas
      const receivedResponse = await fetch(this.getUrl('update-webhook-received'), {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ value: webhookUrl })
      });

      return {
        status: await statusResponse.json(),
        received: await receivedResponse.json()
      };
    } catch (error) {
      console.error('Erro ao configurar webhooks:', error);
      throw error;
    }
  }

  /**
   * Formata número de telefone para padrão brasileiro
   */
  private formatPhone(phone: string): string {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');

    // Se já tem código do país, retorna como está
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      return cleaned;
    }

    // Se começa com 0, remove e adiciona 55
    if (cleaned.startsWith('0')) {
      return '55' + cleaned.substring(1);
    }

    // Se não tem código do país, adiciona 55 (Brasil)
    if (cleaned.length <= 11) {
      return '55' + cleaned;
    }

    return cleaned;
  }

  /**
   * Salva mensagem no banco de dados
   */
  private async saveMessageToDatabase({
    leadId,
    phone,
    message,
    status,
    zapiMessageId,
    templateId,
    error
  }: {
    leadId: number;
    phone: string;
    message: string;
    status: string;
    zapiMessageId?: string;
    templateId?: number;
    error?: string;
  }): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO whatsapp_messages (
          lead_id,
          phone_number,
          message_content,
          status,
          zapi_message_id,
          template_id,
          error_message,
          sent_at,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        leadId,
        phone,
        message,
        status,
        zapiMessageId || null,
        templateId || null,
        error || null,
        status === 'sent' ? new Date() : null,
        1 // TODO: pegar user_id do contexto da requisição
      ]);
    } catch (dbError) {
      console.error('Erro ao salvar mensagem no banco:', dbError);
      // Não re-throw para não interromper o fluxo principal
    }
  }

  /**
   * Testa conectividade com Z-API
   */
  async testConnection(): Promise<{ connected: boolean; phone?: string; error?: string }> {
    try {
      const status = await this.getInstanceStatus();

      return {
        connected: status.connected === true,
        phone: status.phone || null,
        error: status.error || null
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Envia mensagem de teste
   */
  async sendTestMessage(phone: string): Promise<boolean> {
    try {
      const testMessage = `🚀 *Teste RuidCar WhatsApp*\n\nSua automação Z-API está funcionando perfeitamente!\n\nData: ${new Date().toLocaleString('pt-BR')}\nInstância: ${this.instanceId.substring(0, 8)}...`;

      const result = await this.sendMessage(phone, testMessage);
      return result.value === true;
    } catch (error) {
      console.error('Erro no teste de envio:', error);
      return false;
    }
  }
}

// Singleton instance
export const zapiService = new ZAPIWhatsAppService();