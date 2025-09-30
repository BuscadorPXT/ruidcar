import { pool } from '../db';
import { zapiService } from './zapi-whatsapp';
import { ComplianceService } from './compliance';
import { EventEmitter } from 'events';

export interface QueuedMessage {
  id: number;
  leadId?: number;
  phone: string;
  message: string;
  templateId?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor: Date;
  maxRetries: number;
  currentRetries: number;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  createdBy: number;
  metadata?: any;
}

export interface QueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  cancelled: number;
  totalToday: number;
  averageProcessingTime: number;
}

export class MessageQueueService extends EventEmitter {
  private static instance: MessageQueueService;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly processIntervalMs = 30000; // 30 segundos

  constructor() {
    super();
    this.startProcessing();
  }

  static getInstance(): MessageQueueService {
    if (!MessageQueueService.instance) {
      MessageQueueService.instance = new MessageQueueService();
    }
    return MessageQueueService.instance;
  }

  /**
   * Adiciona mensagem à fila
   */
  async enqueueMessage(
    phone: string,
    message: string,
    options: {
      leadId?: number;
      templateId?: number;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      scheduledFor?: Date;
      maxRetries?: number;
      createdBy: number;
      metadata?: any;
    }
  ): Promise<number> {
    try {
      const {
        leadId,
        templateId,
        priority = 'normal',
        scheduledFor = new Date(),
        maxRetries = 3,
        createdBy,
        metadata
      } = options;

      // Se não tem agendamento específico, verificar compliance
      if (!options.scheduledFor) {
        const complianceCheck = await ComplianceService.checkFullCompliance(leadId, phone);

        if (!complianceCheck.canSend && complianceCheck.nextAvailableTime) {
          // Agendar para o próximo horário disponível
          scheduledFor.setTime(complianceCheck.nextAvailableTime.getTime());
        }
      }

      const result = await pool.query(`
        INSERT INTO whatsapp_message_queue (
          lead_id, phone_number, message_content, template_id,
          priority, scheduled_for, max_retries, created_by, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        leadId || null,
        phone,
        message,
        templateId || null,
        priority,
        scheduledFor,
        maxRetries,
        createdBy,
        metadata ? JSON.stringify(metadata) : null
      ]);

      const queueId = result.rows[0].id;

      this.emit('messageEnqueued', {
        queueId,
        phone,
        priority,
        scheduledFor
      });

      console.log(`[QUEUE] Mensagem enfileirada ID:${queueId} para ${phone} - Agendada para: ${scheduledFor.toISOString()}`);

      return queueId;
    } catch (error) {
      console.error('Erro ao enfileirar mensagem:', error);
      throw error;
    }
  }

  /**
   * Processa mensagens pendentes na fila
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return; // Já está processando
    }

    try {
      this.isProcessing = true;

      // Buscar mensagens prontas para processamento
      const result = await pool.query(`
        SELECT * FROM whatsapp_message_queue
        WHERE status = 'pending'
        AND scheduled_for <= NOW()
        AND current_retries < max_retries
        ORDER BY priority DESC, scheduled_for ASC
        LIMIT 10
      `);

      if (result.rows.length === 0) {
        return;
      }

      console.log(`[QUEUE] Processando ${result.rows.length} mensagens da fila`);

      for (const queuedMessage of result.rows) {
        await this.processMessage(queuedMessage);

        // Rate limiting entre mensagens (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error('Erro ao processar fila de mensagens:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Processa uma mensagem individual da fila
   */
  private async processMessage(queuedMessage: any): Promise<void> {
    try {
      // Marcar como processando
      await pool.query(`
        UPDATE whatsapp_message_queue
        SET status = 'processing', processing_started_at = NOW()
        WHERE id = $1
      `, [queuedMessage.id]);

      // Verificar compliance novamente antes de enviar
      const complianceCheck = await ComplianceService.checkFullCompliance(
        queuedMessage.lead_id,
        queuedMessage.phone_number
      );

      if (!complianceCheck.canSend) {
        await this.handleComplianceFailure(queuedMessage, complianceCheck);
        return;
      }

      // Adicionar opt-out footer se necessário
      const messageWithOptOut = ComplianceService.addOptOutFooter(queuedMessage.message_content);

      // Enviar mensagem via Z-API
      const sendResult = await zapiService.sendMessage(
        queuedMessage.phone_number,
        messageWithOptOut
      );

      if (sendResult.value) {
        // Sucesso
        await this.markMessageAsSent(queuedMessage, sendResult.messageId);

        this.emit('messageSent', {
          queueId: queuedMessage.id,
          phone: queuedMessage.phone_number,
          zapiMessageId: sendResult.messageId
        });

      } else {
        // Falha no envio
        await this.handleSendFailure(queuedMessage, sendResult.error || 'Falha desconhecida');
      }

    } catch (error) {
      console.error(`Erro ao processar mensagem ID:${queuedMessage.id}:`, error);
      await this.handleSendFailure(queuedMessage, error.message);
    }
  }

  /**
   * Marca mensagem como enviada com sucesso
   */
  private async markMessageAsSent(queuedMessage: any, zapiMessageId?: string): Promise<void> {
    try {
      await pool.query(`
        UPDATE whatsapp_message_queue
        SET status = 'sent',
            sent_at = NOW(),
            zapi_message_id = $2
        WHERE id = $1
      `, [queuedMessage.id, zapiMessageId]);

      console.log(`[QUEUE] ✅ Mensagem ID:${queuedMessage.id} enviada com sucesso`);
    } catch (error) {
      console.error('Erro ao marcar mensagem como enviada:', error);
    }
  }

  /**
   * Lida com falha de compliance (reagenda mensagem)
   */
  private async handleComplianceFailure(queuedMessage: any, complianceCheck: any): Promise<void> {
    try {
      let newScheduledTime: Date;

      if (complianceCheck.nextAvailableTime) {
        newScheduledTime = complianceCheck.nextAvailableTime;
      } else {
        // Reagendar para daqui a 1 hora como fallback
        newScheduledTime = new Date(Date.now() + 60 * 60 * 1000);
      }

      await pool.query(`
        UPDATE whatsapp_message_queue
        SET status = 'pending',
            scheduled_for = $2,
            current_retries = current_retries + 1,
            last_error = $3,
            processing_started_at = NULL
        WHERE id = $1
      `, [queuedMessage.id, newScheduledTime, complianceCheck.reason]);

      // Log de compliance
      await pool.query(`
        INSERT INTO whatsapp_compliance_logs (
          event_type, phone_number, lead_id, reason, metadata
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'message_rescheduled',
        queuedMessage.phone_number,
        queuedMessage.lead_id,
        complianceCheck.reason,
        JSON.stringify({
          queueId: queuedMessage.id,
          newScheduledTime: newScheduledTime.toISOString()
        })
      ]);

      console.log(`[QUEUE] ⏰ Mensagem ID:${queuedMessage.id} reagendada para ${newScheduledTime.toISOString()} - Motivo: ${complianceCheck.reason}`);

    } catch (error) {
      console.error('Erro ao reagendar mensagem:', error);
    }
  }

  /**
   * Lida com falha no envio (retry ou marcar como failed)
   */
  private async handleSendFailure(queuedMessage: any, errorMessage: string): Promise<void> {
    try {
      const newRetryCount = queuedMessage.current_retries + 1;

      if (newRetryCount >= queuedMessage.max_retries) {
        // Excedeu tentativas, marcar como failed
        await pool.query(`
          UPDATE whatsapp_message_queue
          SET status = 'failed',
              failed_at = NOW(),
              last_error = $2,
              processing_started_at = NULL
          WHERE id = $1
        `, [queuedMessage.id, errorMessage]);

        this.emit('messageFailed', {
          queueId: queuedMessage.id,
          phone: queuedMessage.phone_number,
          error: errorMessage,
          retries: newRetryCount
        });

        console.log(`[QUEUE] ❌ Mensagem ID:${queuedMessage.id} falhou definitivamente após ${newRetryCount} tentativas`);

      } else {
        // Agendar nova tentativa (backoff exponencial: 5min, 15min, 30min)
        const backoffMinutes = Math.pow(3, newRetryCount) * 5;
        const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);

        await pool.query(`
          UPDATE whatsapp_message_queue
          SET status = 'pending',
              scheduled_for = $2,
              current_retries = $3,
              last_error = $4,
              processing_started_at = NULL
          WHERE id = $1
        `, [queuedMessage.id, nextRetry, newRetryCount, errorMessage]);

        console.log(`[QUEUE] 🔄 Mensagem ID:${queuedMessage.id} agendada para nova tentativa (${newRetryCount}/${queuedMessage.max_retries}) em ${backoffMinutes} minutos`);
      }

    } catch (error) {
      console.error('Erro ao lidar com falha de envio:', error);
    }
  }

  /**
   * Obtém estatísticas da fila
   */
  async getQueueStats(): Promise<QueueStats> {
    try {
      const [statusCounts, todayCount, avgProcessingTime] = await Promise.all([
        // Contagem por status
        pool.query(`
          SELECT status, COUNT(*) as count
          FROM whatsapp_message_queue
          GROUP BY status
        `),

        // Total de hoje
        pool.query(`
          SELECT COUNT(*) as count
          FROM whatsapp_message_queue
          WHERE DATE(created_at) = CURRENT_DATE
        `),

        // Tempo médio de processamento
        pool.query(`
          SELECT AVG(EXTRACT(EPOCH FROM (sent_at - processing_started_at))) as avg_seconds
          FROM whatsapp_message_queue
          WHERE status = 'sent'
          AND processing_started_at IS NOT NULL
          AND sent_at IS NOT NULL
          AND sent_at >= NOW() - INTERVAL '7 days'
        `)
      ]);

      const stats: QueueStats = {
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        cancelled: 0,
        totalToday: parseInt(todayCount.rows[0].count) || 0,
        averageProcessingTime: parseFloat(avgProcessingTime.rows[0].avg_seconds) || 0
      };

      // Preencher contagens por status
      statusCounts.rows.forEach(row => {
        stats[row.status as keyof QueueStats] = parseInt(row.count);
      });

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas da fila:', error);
      throw error;
    }
  }

  /**
   * Cancela mensagens na fila
   */
  async cancelMessages(criteria: {
    queueIds?: number[];
    leadIds?: number[];
    phones?: string[];
    status?: string[];
  }): Promise<number> {
    try {
      let whereConditions: string[] = [];
      let params: any[] = [];
      let paramIndex = 1;

      if (criteria.queueIds && criteria.queueIds.length > 0) {
        whereConditions.push(`id = ANY($${paramIndex})`);
        params.push(criteria.queueIds);
        paramIndex++;
      }

      if (criteria.leadIds && criteria.leadIds.length > 0) {
        whereConditions.push(`lead_id = ANY($${paramIndex})`);
        params.push(criteria.leadIds);
        paramIndex++;
      }

      if (criteria.phones && criteria.phones.length > 0) {
        whereConditions.push(`phone_number = ANY($${paramIndex})`);
        params.push(criteria.phones);
        paramIndex++;
      }

      if (criteria.status && criteria.status.length > 0) {
        whereConditions.push(`status = ANY($${paramIndex})`);
        params.push(criteria.status);
        paramIndex++;
      } else {
        // Por padrão, só cancela pendentes
        whereConditions.push(`status IN ('pending', 'processing')`);
      }

      if (whereConditions.length === 0) {
        throw new Error('Critérios de cancelamento não especificados');
      }

      const result = await pool.query(`
        UPDATE whatsapp_message_queue
        SET status = 'cancelled', cancelled_at = NOW()
        WHERE ${whereConditions.join(' AND ')}
        RETURNING id
      `, params);

      const cancelledCount = result.rows.length;
      console.log(`[QUEUE] 🚫 ${cancelledCount} mensagens canceladas`);

      this.emit('messagesCancelled', {
        count: cancelledCount,
        criteria
      });

      return cancelledCount;
    } catch (error) {
      console.error('Erro ao cancelar mensagens:', error);
      throw error;
    }
  }

  /**
   * Inicia o processamento automático da fila
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return; // Já está rodando
    }

    this.processingInterval = setInterval(() => {
      this.processQueue().catch(error => {
        console.error('Erro no processamento automático da fila:', error);
      });
    }, this.processIntervalMs);

    console.log(`[QUEUE] 🚀 Processamento automático iniciado (intervalo: ${this.processIntervalMs}ms)`);
  }

  /**
   * Para o processamento automático da fila
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('[QUEUE] ⏹️ Processamento automático parado');
    }
  }

  /**
   * Limpa mensagens antigas da fila
   */
  async cleanupOldMessages(daysOld: number = 30): Promise<number> {
    try {
      const result = await pool.query(`
        DELETE FROM whatsapp_message_queue
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
        AND status IN ('sent', 'failed', 'cancelled')
        RETURNING id
      `);

      const deletedCount = result.rows.length;
      console.log(`[QUEUE] 🧹 ${deletedCount} mensagens antigas removidas (>${daysOld} dias)`);

      return deletedCount;
    } catch (error) {
      console.error('Erro ao limpar mensagens antigas:', error);
      throw error;
    }
  }
}

// Singleton instance
export const messageQueue = MessageQueueService.getInstance();