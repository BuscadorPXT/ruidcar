import { pool } from '../db';
import { EventEmitter } from 'events';
import { zapiService } from './zapi-whatsapp';
import { ComplianceService } from './compliance';
import { messageQueue } from './message-queue';

export interface AlertConfig {
  id: string;
  name: string;
  description: string;
  condition: string; // SQL condition
  threshold?: number;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[]; // emails
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  components: {
    zapiConnection: ComponentHealth;
    messageQueue: ComponentHealth;
    compliance: ComponentHealth;
    database: ComponentHealth;
  };
  metrics: {
    dailyMessagesSent: number;
    queueSize: number;
    failureRate: number;
    averageResponseTime: number;
  };
  alerts: ActiveAlert[];
  lastChecked: Date;
}

export interface ComponentHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  details?: any;
  lastChecked: Date;
}

export interface ActiveAlert {
  id: string;
  alertConfigId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: number;
  acknowledgedAt?: Date;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: 'whatsapp' | 'compliance' | 'queue' | 'api' | 'webhook' | 'system';
  message: string;
  details?: any;
  userId?: number;
  leadId?: number;
  phone?: string;
  timestamp: Date;
}

export class WhatsAppMonitoringService extends EventEmitter {
  private static instance: WhatsAppMonitoringService;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly healthCheckIntervalMs = 60000; // 1 minuto

  private alertConfigs: AlertConfig[] = [
    {
      id: 'high_failure_rate',
      name: 'Alta Taxa de Falha',
      description: 'Taxa de falha de mensagens acima de 10% nas últimas 2 horas',
      condition: `
        SELECT COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) as failure_rate
        FROM whatsapp_messages
        WHERE created_at >= NOW() - INTERVAL '2 hours'
        HAVING COUNT(*) > 10 AND failure_rate > 10
      `,
      threshold: 10,
      enabled: true,
      severity: 'high',
      recipients: ['admin@ruidcar.com.br']
    },
    {
      id: 'queue_backlog',
      name: 'Fila com Backlog Alto',
      description: 'Mais de 100 mensagens pendentes na fila',
      condition: `
        SELECT COUNT(*) as pending_count
        FROM whatsapp_message_queue
        WHERE status = 'pending'
        HAVING pending_count > 100
      `,
      threshold: 100,
      enabled: true,
      severity: 'medium',
      recipients: ['admin@ruidcar.com.br']
    },
    {
      id: 'zapi_disconnected',
      name: 'Z-API Desconectado',
      description: 'Instância Z-API não está conectada',
      condition: 'MANUAL_CHECK',
      enabled: true,
      severity: 'critical',
      recipients: ['admin@ruidcar.com.br']
    },
    {
      id: 'daily_limit_approaching',
      name: 'Limite Diário Próximo',
      description: '90% do limite diário de mensagens atingido',
      condition: `
        SELECT COUNT(*) as daily_count
        FROM whatsapp_messages
        WHERE DATE(created_at) = CURRENT_DATE AND status = 'sent'
        HAVING daily_count > 900
      `,
      threshold: 900,
      enabled: true,
      severity: 'medium',
      recipients: ['admin@ruidcar.com.br']
    },
    {
      id: 'compliance_blocks_high',
      name: 'Muitos Bloqueios de Compliance',
      description: 'Mais de 50 bloqueios de compliance na última hora',
      condition: `
        SELECT COUNT(*) as blocks_count
        FROM whatsapp_compliance_logs
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        AND event_type LIKE 'blocked_%'
        HAVING blocks_count > 50
      `,
      threshold: 50,
      enabled: true,
      severity: 'medium',
      recipients: ['admin@ruidcar.com.br']
    }
  ];

  constructor() {
    super();
    this.startHealthChecks();
  }

  static getInstance(): WhatsAppMonitoringService {
    if (!WhatsAppMonitoringService.instance) {
      WhatsAppMonitoringService.instance = new WhatsAppMonitoringService();
    }
    return WhatsAppMonitoringService.instance;
  }

  /**
   * Registra log de eventos do WhatsApp
   */
  async logEvent(entry: LogEntry): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO whatsapp_logs (
          level, category, message, details, user_id, lead_id, phone_number, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        entry.level,
        entry.category,
        entry.message,
        entry.details ? JSON.stringify(entry.details) : null,
        entry.userId || null,
        entry.leadId || null,
        entry.phone || null,
        entry.timestamp || new Date()
      ]);

      // Emitir evento para listeners
      this.emit('logEntry', entry);

      // Console log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}`, entry.details || '');
      }

      // Verificar se é um evento crítico que precisa de alerta
      if (entry.level === 'critical' || entry.level === 'error') {
        this.checkAlertsForLogEntry(entry);
      }

    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  }

  /**
   * Verifica saúde geral do sistema
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    try {
      const [zapiHealth, queueHealth, complianceHealth, dbHealth] = await Promise.all([
        this.checkZAPIHealth(),
        this.checkMessageQueueHealth(),
        this.checkComplianceHealth(),
        this.checkDatabaseHealth()
      ]);

      // Calcular métricas gerais
      const metrics = await this.getSystemMetrics();

      // Buscar alertas ativos
      const activeAlerts = await this.getActiveAlerts();

      // Determinar status geral
      let overallStatus: SystemHealth['status'] = 'healthy';
      const components = { zapiConnection: zapiHealth, messageQueue: queueHealth, compliance: complianceHealth, database: dbHealth };

      for (const component of Object.values(components)) {
        if (component.status === 'critical') {
          overallStatus = 'critical';
          break;
        } else if (component.status === 'warning' && overallStatus === 'healthy') {
          overallStatus = 'warning';
        }
      }

      const health: SystemHealth = {
        status: overallStatus,
        components,
        metrics,
        alerts: activeAlerts,
        lastChecked: new Date()
      };

      // Log mudanças de status
      if (overallStatus !== 'healthy') {
        await this.logEvent({
          level: overallStatus === 'critical' ? 'critical' : 'warn',
          category: 'system',
          message: `Sistema em status ${overallStatus}`,
          details: { health },
          timestamp: new Date()
        });
      }

      return health;
    } catch (error) {
      await this.logEvent({
        level: 'error',
        category: 'system',
        message: 'Erro ao verificar saúde do sistema',
        details: { error: error instanceof Error ? error.message : 'Erro desconhecido' },
        timestamp: new Date()
      });

      return {
        status: 'unknown',
        components: {
          zapiConnection: { status: 'unknown', message: 'Erro na verificação', lastChecked: new Date() },
          messageQueue: { status: 'unknown', message: 'Erro na verificação', lastChecked: new Date() },
          compliance: { status: 'unknown', message: 'Erro na verificação', lastChecked: new Date() },
          database: { status: 'unknown', message: 'Erro na verificação', lastChecked: new Date() }
        },
        metrics: {
          dailyMessagesSent: 0,
          queueSize: 0,
          failureRate: 0,
          averageResponseTime: 0
        },
        alerts: [],
        lastChecked: new Date()
      };
    }
  }

  /**
   * Verifica saúde da conexão Z-API
   */
  private async checkZAPIHealth(): Promise<ComponentHealth> {
    try {
      const connectionTest = await zapiService.testConnection();

      if (connectionTest.connected) {
        return {
          status: 'healthy',
          message: 'Z-API conectado e funcionando',
          details: connectionTest,
          lastChecked: new Date()
        };
      } else {
        return {
          status: 'critical',
          message: 'Z-API desconectado',
          details: connectionTest,
          lastChecked: new Date()
        };
      }
    } catch (error) {
      return {
        status: 'critical',
        message: `Erro na conexão Z-API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        details: { error: error instanceof Error ? error.message : 'Erro desconhecido' },
        lastChecked: new Date()
      };
    }
  }

  /**
   * Verifica saúde da fila de mensagens
   */
  private async checkMessageQueueHealth(): Promise<ComponentHealth> {
    try {
      const stats = await messageQueue.getQueueStats();

      let status: ComponentHealth['status'] = 'healthy';
      let message = 'Fila funcionando normalmente';

      if (stats.pending > 500) {
        status = 'warning';
        message = `Fila com ${stats.pending} mensagens pendentes`;
      }

      if (stats.pending > 1000) {
        status = 'critical';
        message = `Fila sobrecarregada com ${stats.pending} mensagens pendentes`;
      }

      if (stats.failed > stats.sent && stats.totalToday > 10) {
        status = 'warning';
        message = `Taxa de falha alta: ${stats.failed} falhas vs ${stats.sent} sucessos`;
      }

      return {
        status,
        message,
        details: stats,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Erro ao verificar fila: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        details: { error: error instanceof Error ? error.message : 'Erro desconhecido' },
        lastChecked: new Date()
      };
    }
  }

  /**
   * Verifica saúde do sistema de compliance
   */
  private async checkComplianceHealth(): Promise<ComponentHealth> {
    try {
      const stats = await ComplianceService.getComplianceStats();

      if (!stats) {
        return {
          status: 'warning',
          message: 'Não foi possível obter estatísticas de compliance',
          lastChecked: new Date()
        };
      }

      let status: ComponentHealth['status'] = 'healthy';
      let message = 'Compliance funcionando normalmente';

      if (stats.recentOptOuts > 10) {
        status = 'warning';
        message = `${stats.recentOptOuts} opt-outs recentes (últimos 7 dias)`;
      }

      const utilizacao = (stats.dailyMessageCount / stats.dailyLimit) * 100;
      if (utilizacao > 90) {
        status = 'warning';
        message = `Utilizando ${utilizacao.toFixed(1)}% do limite diário`;
      }

      return {
        status,
        message,
        details: stats,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        status: 'warning',
        message: `Erro ao verificar compliance: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        details: { error: error instanceof Error ? error.message : 'Erro desconhecido' },
        lastChecked: new Date()
      };
    }
  }

  /**
   * Verifica saúde do banco de dados
   */
  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
      const responseTime = Date.now() - start;

      let status: ComponentHealth['status'] = 'healthy';
      let message = `Banco funcionando (${responseTime}ms)`;

      if (responseTime > 1000) {
        status = 'warning';
        message = `Banco lento (${responseTime}ms)`;
      }

      if (responseTime > 5000) {
        status = 'critical';
        message = `Banco muito lento (${responseTime}ms)`;
      }

      return {
        status,
        message,
        details: { responseTimeMs: responseTime },
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Erro de conexão com banco: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        details: { error: error instanceof Error ? error.message : 'Erro desconhecido' },
        lastChecked: new Date()
      };
    }
  }

  /**
   * Obtém métricas gerais do sistema
   */
  private async getSystemMetrics(): Promise<SystemHealth['metrics']> {
    try {
      const [dailyMessages, queueStats, failureRate] = await Promise.all([
        pool.query(`
          SELECT COUNT(*) as count
          FROM whatsapp_messages
          WHERE DATE(created_at) = CURRENT_DATE AND status = 'sent'
        `),
        messageQueue.getQueueStats(),
        pool.query(`
          SELECT
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            COUNT(*) FILTER (WHERE status = 'sent') as sent
          FROM whatsapp_messages
          WHERE created_at >= NOW() - INTERVAL '24 hours'
        `)
      ]);

      const failedCount = parseInt(failureRate.rows[0].failed) || 0;
      const sentCount = parseInt(failureRate.rows[0].sent) || 0;
      const totalMessages = failedCount + sentCount;

      return {
        dailyMessagesSent: parseInt(dailyMessages.rows[0].count) || 0,
        queueSize: queueStats.pending + queueStats.processing,
        failureRate: totalMessages > 0 ? (failedCount / totalMessages) * 100 : 0,
        averageResponseTime: queueStats.averageProcessingTime || 0
      };
    } catch (error) {
      console.error('Erro ao obter métricas:', error);
      return {
        dailyMessagesSent: 0,
        queueSize: 0,
        failureRate: 0,
        averageResponseTime: 0
      };
    }
  }

  /**
   * Obtém alertas ativos
   */
  private async getActiveAlerts(): Promise<ActiveAlert[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM whatsapp_alerts
        WHERE acknowledged = false
        ORDER BY triggered_at DESC
        LIMIT 20
      `);

      return result.rows.map(row => ({
        id: row.id,
        alertConfigId: row.alert_config_id,
        severity: row.severity,
        message: row.message,
        details: row.details,
        triggeredAt: new Date(row.triggered_at),
        acknowledged: row.acknowledged,
        acknowledgedBy: row.acknowledged_by,
        acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined
      }));
    } catch (error) {
      console.error('Erro ao obter alertas ativos:', error);
      return [];
    }
  }

  /**
   * Verifica alertas baseados em entrada de log
   */
  private async checkAlertsForLogEntry(entry: LogEntry): Promise<void> {
    // Implementar lógica de alertas específicos baseados em logs
    if (entry.level === 'critical' && entry.category === 'whatsapp') {
      await this.triggerAlert('zapi_disconnected', {
        message: entry.message,
        details: entry.details
      });
    }
  }

  /**
   * Dispara um alerta
   */
  async triggerAlert(alertConfigId: string, data: { message: string; details?: any }): Promise<void> {
    try {
      const alertConfig = this.alertConfigs.find(config => config.id === alertConfigId);
      if (!alertConfig || !alertConfig.enabled) {
        return;
      }

      // Verificar se já existe alerta similar não reconhecido
      const existingAlert = await pool.query(`
        SELECT id FROM whatsapp_alerts
        WHERE alert_config_id = $1
        AND acknowledged = false
        AND triggered_at > NOW() - INTERVAL '1 hour'
        LIMIT 1
      `, [alertConfigId]);

      if (existingAlert.rows.length > 0) {
        // Já existe alerta similar recente, não duplicar
        return;
      }

      // Criar novo alerta
      await pool.query(`
        INSERT INTO whatsapp_alerts (
          alert_config_id, severity, message, details, triggered_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [
        alertConfigId,
        alertConfig.severity,
        data.message,
        data.details ? JSON.stringify(data.details) : null
      ]);

      // Log do alerta
      await this.logEvent({
        level: alertConfig.severity === 'critical' ? 'critical' : 'warn',
        category: 'system',
        message: `Alerta disparado: ${alertConfig.name}`,
        details: { alertConfig, alertData: data },
        timestamp: new Date()
      });

      // Emitir evento para notificações
      this.emit('alertTriggered', {
        alertConfigId,
        severity: alertConfig.severity,
        message: data.message,
        recipients: alertConfig.recipients
      });

    } catch (error) {
      console.error('Erro ao disparar alerta:', error);
    }
  }

  /**
   * Reconhece um alerta
   */
  async acknowledgeAlert(alertId: string, userId: number, note?: string): Promise<void> {
    try {
      await pool.query(`
        UPDATE whatsapp_alerts
        SET acknowledged = true,
            acknowledged_by = $2,
            acknowledged_at = NOW(),
            acknowledgment_note = $3
        WHERE id = $1
      `, [alertId, userId, note || null]);

      await this.logEvent({
        level: 'info',
        category: 'system',
        message: `Alerta ${alertId} reconhecido`,
        details: { alertId, userId, note },
        userId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error);
    }
  }

  /**
   * Inicia verificações automáticas de saúde
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.checkSystemHealth();

        // Verificar alertas baseados na saúde
        await this.checkHealthAlerts(health);

        this.emit('healthCheck', health);
      } catch (error) {
        console.error('Erro na verificação automática de saúde:', error);
      }
    }, this.healthCheckIntervalMs);

    console.log('[MONITORING] 🔍 Verificações de saúde automáticas iniciadas');
  }

  /**
   * Verifica alertas baseados na saúde do sistema
   */
  private async checkHealthAlerts(health: SystemHealth): Promise<void> {
    // Z-API desconectado
    if (health.components.zapiConnection.status === 'critical') {
      await this.triggerAlert('zapi_disconnected', {
        message: health.components.zapiConnection.message,
        details: health.components.zapiConnection.details
      });
    }

    // Fila com backlog
    if (health.metrics.queueSize > 100) {
      await this.triggerAlert('queue_backlog', {
        message: `Fila com ${health.metrics.queueSize} mensagens pendentes`,
        details: { queueSize: health.metrics.queueSize }
      });
    }

    // Taxa de falha alta
    if (health.metrics.failureRate > 10) {
      await this.triggerAlert('high_failure_rate', {
        message: `Taxa de falha: ${health.metrics.failureRate.toFixed(2)}%`,
        details: { failureRate: health.metrics.failureRate }
      });
    }

    // Limite diário se aproximando
    if (health.metrics.dailyMessagesSent > 900) {
      await this.triggerAlert('daily_limit_approaching', {
        message: `${health.metrics.dailyMessagesSent} mensagens enviadas hoje`,
        details: { dailyCount: health.metrics.dailyMessagesSent }
      });
    }
  }

  /**
   * Para verificações automáticas
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('[MONITORING] ⏹️ Verificações de saúde paradas');
    }
  }

  /**
   * Obtém logs recentes
   */
  async getRecentLogs(options: {
    limit?: number;
    level?: string;
    category?: string;
    since?: Date;
  } = {}): Promise<LogEntry[]> {
    try {
      const {
        limit = 100,
        level,
        category,
        since = new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
      } = options;

      let query = 'SELECT * FROM whatsapp_logs WHERE created_at >= $1';
      const params: any[] = [since];
      let paramIndex = 2;

      if (level) {
        query += ` AND level = $${paramIndex}`;
        params.push(level);
        paramIndex++;
      }

      if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
      params.push(limit);

      const result = await pool.query(query, params);

      return result.rows.map(row => ({
        level: row.level,
        category: row.category,
        message: row.message,
        details: row.details,
        userId: row.user_id,
        leadId: row.lead_id,
        phone: row.phone_number,
        timestamp: new Date(row.created_at)
      }));

    } catch (error) {
      console.error('Erro ao obter logs recentes:', error);
      return [];
    }
  }
}

// Singleton instance
export const whatsappMonitoring = WhatsAppMonitoringService.getInstance();