import { pool } from '../db';
import { ComplianceService } from './compliance';
import { whatsappMonitoring } from './whatsapp-monitoring';

export interface WebhookEvent {
  type: string;
  instanceId?: string;
  phone?: string;
  messageId?: string;
  status?: string;
  timestamp?: string;
  data?: any;
}

export interface ProcessedWebhook {
  id: number;
  eventType: string;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

export class WebhookProcessorService {
  private static instance: WebhookProcessorService;
  private processingQueue: WebhookEvent[] = [];
  private isProcessing = false;

  static getInstance(): WebhookProcessorService {
    if (!WebhookProcessorService.instance) {
      WebhookProcessorService.instance = new WebhookProcessorService();
    }
    return WebhookProcessorService.instance;
  }

  /**
   * Processa webhook recebido da Z-API
   */
  async processWebhook(webhookData: any): Promise<{ success: boolean; message?: string }> {
    try {
      // Log do webhook recebido
      await whatsappMonitoring.logEvent({
        level: 'info',
        category: 'webhook',
        message: 'Webhook recebido da Z-API',
        details: {
          type: webhookData.type || 'unknown',
          phone: webhookData.phone,
          messageId: webhookData.messageId
        },
        timestamp: new Date()
      });

      // Salvar webhook no banco para auditoria
      const webhookId = await this.saveWebhookData(webhookData);

      // Determinar tipo de webhook e processar
      const event = this.parseWebhookEvent(webhookData);

      if (event) {
        await this.processEvent(event, webhookId);

        // Marcar como processado
        await this.markWebhookAsProcessed(webhookId);

        return { success: true };
      } else {
        await whatsappMonitoring.logEvent({
          level: 'warn',
          category: 'webhook',
          message: 'Tipo de webhook não reconhecido',
          details: webhookData,
          timestamp: new Date()
        });

        return { success: true, message: 'Webhook tipo desconhecido, mas salvo para análise' };
      }

    } catch (error) {
      await whatsappMonitoring.logEvent({
        level: 'error',
        category: 'webhook',
        message: 'Erro ao processar webhook',
        details: { error: error instanceof Error ? error.message : 'Erro desconhecido', webhookData },
        timestamp: new Date()
      });

      return { success: false, message: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Salva dados do webhook para auditoria
   */
  private async saveWebhookData(webhookData: any): Promise<number> {
    const result = await pool.query(`
      INSERT INTO zapi_webhooks (
        event_type, webhook_data, message_id, phone_number, processed
      ) VALUES ($1, $2, $3, $4, false)
      RETURNING id
    `, [
      webhookData.type || 'unknown',
      JSON.stringify(webhookData),
      webhookData.messageId || null,
      webhookData.phone || null
    ]);

    return result.rows[0].id;
  }

  /**
   * Marca webhook como processado
   */
  private async markWebhookAsProcessed(webhookId: number, error?: string): Promise<void> {
    await pool.query(`
      UPDATE zapi_webhooks
      SET processed = true,
          processed_at = NOW(),
          processing_error = $2
      WHERE id = $1
    `, [webhookId, error || null]);
  }

  /**
   * Converte dados do webhook em evento estruturado
   */
  private parseWebhookEvent(webhookData: any): WebhookEvent | null {
    // Z-API pode enviar diferentes tipos de webhook
    if (webhookData.type) {
      return {
        type: webhookData.type,
        instanceId: webhookData.instanceId,
        phone: webhookData.phone,
        messageId: webhookData.messageId,
        status: webhookData.status,
        timestamp: webhookData.timestamp,
        data: webhookData
      };
    }

    // Tentar inferir tipo baseado nos campos presentes
    if (webhookData.messageId && webhookData.status) {
      return {
        type: 'message_status',
        messageId: webhookData.messageId,
        status: webhookData.status,
        phone: webhookData.phone,
        data: webhookData
      };
    }

    if (webhookData.phone && webhookData.message) {
      return {
        type: 'message_received',
        phone: webhookData.phone,
        data: webhookData
      };
    }

    if (webhookData.connected !== undefined) {
      return {
        type: 'instance_status',
        instanceId: webhookData.instanceId,
        data: webhookData
      };
    }

    return null;
  }

  /**
   * Processa evento específico baseado no tipo
   */
  private async processEvent(event: WebhookEvent, webhookId: number): Promise<void> {
    try {
      switch (event.type) {
        case 'message_status':
          await this.processMessageStatusEvent(event);
          break;

        case 'message_received':
          await this.processMessageReceivedEvent(event);
          break;

        case 'instance_status':
          await this.processInstanceStatusEvent(event);
          break;

        case 'qr_updated':
          await this.processQRUpdatedEvent(event);
          break;

        case 'connected':
        case 'disconnected':
          await this.processConnectionEvent(event);
          break;

        default:
          await whatsappMonitoring.logEvent({
            level: 'debug',
            category: 'webhook',
            message: `Tipo de evento não implementado: ${event.type}`,
            details: event,
            timestamp: new Date()
          });
      }
    } catch (error) {
      await this.markWebhookAsProcessed(webhookId, error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    }
  }

  /**
   * Processa atualização de status de mensagem
   */
  private async processMessageStatusEvent(event: WebhookEvent): Promise<void> {
    if (!event.messageId) {
      return;
    }

    try {
      let updateFields: any = { updated_at: 'NOW()' };
      let statusChange = false;

      // Mapear status da Z-API para nosso sistema
      switch (event.status?.toLowerCase()) {
        case 'delivered':
          updateFields.status = 'delivered';
          updateFields.delivered_at = 'NOW()';
          statusChange = true;
          break;

        case 'read':
          updateFields.status = 'read';
          updateFields.read_at = 'NOW()';
          statusChange = true;
          break;

        case 'failed':
        case 'error':
          updateFields.status = 'failed';
          updateFields.error_message = event.data?.error || 'Falha reportada pela Z-API';
          statusChange = true;
          break;

        case 'sent':
          // Apenas atualizar timestamp se ainda não foi definido
          updateFields.sent_at = 'COALESCE(sent_at, NOW())';
          break;

        default:
          // Status desconhecido, apenas logar
          await whatsappMonitoring.logEvent({
            level: 'debug',
            category: 'webhook',
            message: `Status desconhecido recebido: ${event.status}`,
            details: event,
            timestamp: new Date()
          });
          return;
      }

      // Atualizar mensagem na tabela principal
      const setClause = Object.keys(updateFields)
        .map((key, index) => `${key} = ${updateFields[key]}`)
        .join(', ');

      const updateResult = await pool.query(`
        UPDATE whatsapp_messages SET ${setClause}
        WHERE zapi_message_id = $1
        RETURNING id, lead_id, phone_number, status
      `, [event.messageId]);

      if (updateResult.rows.length > 0) {
        const message = updateResult.rows[0];

        // Também atualizar na fila se existir
        await pool.query(`
          UPDATE whatsapp_message_queue SET ${setClause}
          WHERE zapi_message_id = $1
        `, [event.messageId]);

        // Log da atualização
        if (statusChange) {
          await whatsappMonitoring.logEvent({
            level: 'info',
            category: 'whatsapp',
            message: `Status da mensagem atualizado para: ${event.status}`,
            details: {
              messageId: event.messageId,
              newStatus: event.status,
              phone: event.phone
            },
            leadId: message.lead_id,
            phone: message.phone_number,
            timestamp: new Date()
          });
        }

        // Atualizar métricas em tempo real
        await this.updateDeliveryMetrics(event.status);

      } else {
        // Mensagem não encontrada
        await whatsappMonitoring.logEvent({
          level: 'warn',
          category: 'webhook',
          message: 'Mensagem não encontrada para update de status',
          details: { messageId: event.messageId, status: event.status },
          timestamp: new Date()
        });
      }

    } catch (error) {
      await whatsappMonitoring.logEvent({
        level: 'error',
        category: 'webhook',
        message: 'Erro ao processar status de mensagem',
        details: { event, error: error instanceof Error ? error.message : 'Erro desconhecido' },
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Processa mensagem recebida (resposta de lead)
   */
  private async processMessageReceivedEvent(event: WebhookEvent): Promise<void> {
    if (!event.phone || !event.data?.message) {
      return;
    }

    try {
      const phone = event.phone;
      const message = event.data.message;

      // Processar possível comando de opt-out
      const isOptOut = await ComplianceService.processOptOut(phone, message);

      if (isOptOut) {
        await whatsappMonitoring.logEvent({
          level: 'info',
          category: 'compliance',
          message: 'Comando de opt-out processado',
          details: { phone, message },
          phone,
          timestamp: new Date()
        });

        // Log de compliance
        await pool.query(`
          INSERT INTO whatsapp_compliance_logs (
            event_type, phone_number, reason, metadata
          ) VALUES ($1, $2, $3, $4)
        `, [
          'opt_out_processed',
          phone,
          'Usuário solicitou remoção via WhatsApp',
          JSON.stringify({ originalMessage: message, processedAt: new Date() })
        ]);

        return;
      }

      // Buscar lead relacionado a este número
      const leadResult = await pool.query(`
        SELECT id, full_name, company
        FROM contact_messages
        WHERE whatsapp = $1
        OR whatsapp LIKE '%' || $2 || '%'
        ORDER BY created_at DESC
        LIMIT 1
      `, [phone, phone.replace(/\D/g, '')]);

      let leadId: number | undefined;
      if (leadResult.rows.length > 0) {
        leadId = leadResult.rows[0].id;
      }

      // Salvar mensagem recebida
      await pool.query(`
        INSERT INTO whatsapp_received_messages (
          phone_number, message_content, lead_id, received_at, webhook_data
        ) VALUES ($1, $2, $3, NOW(), $4)
      `, [
        phone,
        message,
        leadId || null,
        JSON.stringify(event.data)
      ]);

      // Log da mensagem recebida
      await whatsappMonitoring.logEvent({
        level: 'info',
        category: 'whatsapp',
        message: 'Mensagem recebida de lead',
        details: {
          phone,
          messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
          leadId,
          hasLead: !!leadId
        },
        leadId,
        phone,
        timestamp: new Date()
      });

      // Notificar sistema sobre nova mensagem
      // TODO: Implementar notificação em tempo real para admins

    } catch (error) {
      await whatsappMonitoring.logEvent({
        level: 'error',
        category: 'webhook',
        message: 'Erro ao processar mensagem recebida',
        details: { event, error: error instanceof Error ? error.message : 'Erro desconhecido' },
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Processa mudança de status da instância
   */
  private async processInstanceStatusEvent(event: WebhookEvent): Promise<void> {
    try {
      const connected = event.data?.connected;
      const instanceId = event.instanceId;

      if (instanceId) {
        // Atualizar status no banco
        await pool.query(`
          UPDATE zapi_instances
          SET status = $1, last_seen = NOW()
          WHERE instance_id = $2
        `, [
          connected ? 'connected' : 'disconnected',
          instanceId
        ]);
      }

      const statusMessage = connected ? 'Instância conectada' : 'Instância desconectada';
      const logLevel = connected ? 'info' : 'warn';

      await whatsappMonitoring.logEvent({
        level: logLevel,
        category: 'whatsapp',
        message: statusMessage,
        details: { instanceId, connected, eventData: event.data },
        timestamp: new Date()
      });

      // Se desconectou, disparar alerta
      if (!connected) {
        await whatsappMonitoring.triggerAlert('zapi_disconnected', {
          message: 'Instância Z-API foi desconectada',
          details: { instanceId, timestamp: new Date() }
        });
      }

    } catch (error) {
      await whatsappMonitoring.logEvent({
        level: 'error',
        category: 'webhook',
        message: 'Erro ao processar status da instância',
        details: { event, error: error instanceof Error ? error.message : 'Erro desconhecido' },
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Processa atualização de QR Code
   */
  private async processQRUpdatedEvent(event: WebhookEvent): Promise<void> {
    try {
      const qrCode = event.data?.qr;
      const instanceId = event.instanceId;

      if (instanceId && qrCode) {
        await pool.query(`
          UPDATE zapi_instances
          SET qr_code = $1, updated_at = NOW()
          WHERE instance_id = $2
        `, [qrCode, instanceId]);
      }

      await whatsappMonitoring.logEvent({
        level: 'info',
        category: 'whatsapp',
        message: 'QR Code atualizado',
        details: { instanceId, hasQRCode: !!qrCode },
        timestamp: new Date()
      });

    } catch (error) {
      await whatsappMonitoring.logEvent({
        level: 'error',
        category: 'webhook',
        message: 'Erro ao processar QR Code',
        details: { event, error: error instanceof Error ? error.message : 'Erro desconhecido' },
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Processa eventos de conexão/desconexão
   */
  private async processConnectionEvent(event: WebhookEvent): Promise<void> {
    try {
      const isConnected = event.type === 'connected';
      const instanceId = event.instanceId;

      if (instanceId) {
        await pool.query(`
          UPDATE zapi_instances
          SET status = $1, last_seen = NOW()
          WHERE instance_id = $2
        `, [
          isConnected ? 'connected' : 'disconnected',
          instanceId
        ]);
      }

      await whatsappMonitoring.logEvent({
        level: isConnected ? 'info' : 'warn',
        category: 'whatsapp',
        message: `Instância ${isConnected ? 'conectada' : 'desconectada'}`,
        details: { instanceId, connected: isConnected },
        timestamp: new Date()
      });

    } catch (error) {
      await whatsappMonitoring.logEvent({
        level: 'error',
        category: 'webhook',
        message: 'Erro ao processar evento de conexão',
        details: { event, error: error instanceof Error ? error.message : 'Erro desconhecido' },
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Atualiza métricas de entrega em tempo real
   */
  private async updateDeliveryMetrics(status: string): Promise<void> {
    try {
      const metricName = `messages_${status}`;

      // Contar mensagens hoje com este status
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM whatsapp_messages
        WHERE DATE(created_at) = CURRENT_DATE
        AND status = $1
      `, [status]);

      const count = parseInt(result.rows[0].count) || 0;

      // Salvar métrica
      await pool.query(`
        SELECT record_system_metric($1, $2, 'count', '{"period": "daily"}'::json)
      `, [metricName, count]);

    } catch (error) {
      // Falha na métrica não deve interromper o processamento
      console.error('Erro ao atualizar métricas:', error);
    }
  }

  /**
   * Processa webhooks pendentes (recovery)
   */
  async processUnprocessedWebhooks(): Promise<number> {
    try {
      const result = await pool.query(`
        SELECT * FROM zapi_webhooks
        WHERE processed = false
        AND created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at ASC
        LIMIT 50
      `);

      let processedCount = 0;

      for (const webhook of result.rows) {
        try {
          const webhookData = webhook.webhook_data;
          const event = this.parseWebhookEvent(webhookData);

          if (event) {
            await this.processEvent(event, webhook.id);
            await this.markWebhookAsProcessed(webhook.id);
            processedCount++;
          } else {
            await this.markWebhookAsProcessed(webhook.id, 'Tipo de evento não reconhecido');
          }

        } catch (error) {
          await this.markWebhookAsProcessed(webhook.id, error instanceof Error ? error.message : 'Erro desconhecido');

          await whatsappMonitoring.logEvent({
            level: 'error',
            category: 'webhook',
            message: 'Erro ao reprocessar webhook pendente',
            details: { webhookId: webhook.id, error: error instanceof Error ? error.message : 'Erro desconhecido' },
            timestamp: new Date()
          });
        }
      }

      if (processedCount > 0) {
        await whatsappMonitoring.logEvent({
          level: 'info',
          category: 'webhook',
          message: `Reprocessados ${processedCount} webhooks pendentes`,
          details: { processedCount },
          timestamp: new Date()
        });
      }

      return processedCount;

    } catch (error) {
      await whatsappMonitoring.logEvent({
        level: 'error',
        category: 'webhook',
        message: 'Erro ao processar webhooks pendentes',
        details: { error: error instanceof Error ? error.message : 'Erro desconhecido' },
        timestamp: new Date()
      });

      return 0;
    }
  }

  /**
   * Limpa webhooks antigos
   */
  async cleanupOldWebhooks(daysOld: number = 7): Promise<number> {
    try {
      const result = await pool.query(`
        DELETE FROM zapi_webhooks
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
        AND processed = true
        RETURNING id
      `);

      const deletedCount = result.rows.length;

      if (deletedCount > 0) {
        await whatsappMonitoring.logEvent({
          level: 'info',
          category: 'webhook',
          message: `${deletedCount} webhooks antigos removidos (>${daysOld} dias)`,
          details: { deletedCount, daysOld },
          timestamp: new Date()
        });
      }

      return deletedCount;

    } catch (error) {
      await whatsappMonitoring.logEvent({
        level: 'error',
        category: 'webhook',
        message: 'Erro ao limpar webhooks antigos',
        details: { error: error instanceof Error ? error.message : 'Erro desconhecido' },
        timestamp: new Date()
      });

      return 0;
    }
  }
}

// Singleton instance
export const webhookProcessor = WebhookProcessorService.getInstance();