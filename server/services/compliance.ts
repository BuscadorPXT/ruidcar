import { pool } from '../db';
import { zapiService } from './zapi-whatsapp';

export interface ComplianceCheck {
  canSend: boolean;
  reason?: string;
  nextAvailableTime?: Date;
  dailyCount?: number;
  dailyLimit?: number;
}

export interface ComplianceConfig {
  businessHoursStart: number; // 8
  businessHoursEnd: number;   // 18
  workDays: number[];         // [1,2,3,4,5] = seg-sex
  minMessageInterval: number; // 24 horas em ms
  dailyLimitPerInstance: number; // 1000
  optOutKeywords: string[];   // ['SAIR', 'STOP', 'PARAR']
  blacklistedNumbers: string[];
}

export class ComplianceService {
  private static config: ComplianceConfig = {
    businessHoursStart: 8,
    businessHoursEnd: 18,
    workDays: [1, 2, 3, 4, 5], // Segunda a sexta
    minMessageInterval: 24 * 60 * 60 * 1000, // 24 horas
    dailyLimitPerInstance: 1000,
    optOutKeywords: ['SAIR', 'STOP', 'PARAR', 'CANCELAR', 'REMOVE'],
    blacklistedNumbers: []
  };

  /**
   * Verifica se está dentro do horário comercial
   */
  static isBusinessHours(date: Date = new Date()): boolean {
    const hour = date.getHours();
    const day = date.getDay(); // 0 = domingo, 1 = segunda

    return (
      this.config.workDays.includes(day) &&
      hour >= this.config.businessHoursStart &&
      hour <= this.config.businessHoursEnd
    );
  }

  /**
   * Verifica se pode enviar mensagem para um lead específico
   */
  static async canSendToLead(leadId: number): Promise<ComplianceCheck> {
    try {
      // Verificar última mensagem para este lead
      const lastMessageResult = await pool.query(`
        SELECT created_at, phone_number
        FROM whatsapp_messages
        WHERE lead_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [leadId]);

      if (lastMessageResult.rows.length > 0) {
        const lastMessage = lastMessageResult.rows[0];
        const lastSent = new Date(lastMessage.created_at);
        const now = new Date();
        const timeDiff = now.getTime() - lastSent.getTime();

        if (timeDiff < this.config.minMessageInterval) {
          const nextAvailable = new Date(lastSent.getTime() + this.config.minMessageInterval);
          return {
            canSend: false,
            reason: 'Intervalo mínimo de 24h entre mensagens não respeitado',
            nextAvailableTime: nextAvailable
          };
        }

        // Verificar se número está na blacklist
        const phone = lastMessage.phone_number;
        if (await this.isBlacklisted(phone)) {
          return {
            canSend: false,
            reason: 'Número está na lista de bloqueios (opt-out)'
          };
        }
      }

      return { canSend: true };
    } catch (error) {
      console.error('Erro ao verificar compliance do lead:', error);
      return {
        canSend: false,
        reason: 'Erro interno ao verificar regras de compliance'
      };
    }
  }

  /**
   * Verifica se pode enviar mensagem para um número específico
   */
  static async canSendToPhone(phone: string): Promise<ComplianceCheck> {
    try {
      const formattedPhone = this.formatPhone(phone);

      // Verificar se está na blacklist
      if (await this.isBlacklisted(formattedPhone)) {
        return {
          canSend: false,
          reason: 'Número está na lista de bloqueios (opt-out)'
        };
      }

      // Verificar última mensagem para este número
      const lastMessageResult = await pool.query(`
        SELECT created_at
        FROM whatsapp_messages
        WHERE phone_number = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [formattedPhone]);

      if (lastMessageResult.rows.length > 0) {
        const lastSent = new Date(lastMessageResult.rows[0].created_at);
        const now = new Date();
        const timeDiff = now.getTime() - lastSent.getTime();

        if (timeDiff < this.config.minMessageInterval) {
          const nextAvailable = new Date(lastSent.getTime() + this.config.minMessageInterval);
          return {
            canSend: false,
            reason: 'Intervalo mínimo de 24h entre mensagens não respeitado',
            nextAvailableTime: nextAvailable
          };
        }
      }

      return { canSend: true };
    } catch (error) {
      console.error('Erro ao verificar compliance do telefone:', error);
      return {
        canSend: false,
        reason: 'Erro interno ao verificar regras de compliance'
      };
    }
  }

  /**
   * Verifica limite diário de mensagens
   */
  static async checkDailyLimit(instanceId?: string): Promise<ComplianceCheck> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM whatsapp_messages
        WHERE DATE(created_at) = $1
        AND status = 'sent'
      `, [today]);

      const dailyCount = parseInt(result.rows[0].count);
      const dailyLimit = this.config.dailyLimitPerInstance;

      return {
        canSend: dailyCount < dailyLimit,
        reason: dailyCount >= dailyLimit ? 'Limite diário de mensagens atingido' : undefined,
        dailyCount,
        dailyLimit
      };
    } catch (error) {
      console.error('Erro ao verificar limite diário:', error);
      return {
        canSend: false,
        reason: 'Erro interno ao verificar limite diário'
      };
    }
  }

  /**
   * Verificação completa de compliance
   */
  static async checkFullCompliance(
    leadId?: number,
    phone?: string
  ): Promise<ComplianceCheck> {
    try {
      // 1. Verificar horário comercial
      if (!this.isBusinessHours()) {
        const nextBusinessHour = this.getNextBusinessHour();
        return {
          canSend: false,
          reason: 'Fora do horário comercial (8h-18h, seg-sex)',
          nextAvailableTime: nextBusinessHour
        };
      }

      // 2. Verificar limite diário
      const dailyCheck = await this.checkDailyLimit();
      if (!dailyCheck.canSend) {
        return dailyCheck;
      }

      // 3. Verificar regras específicas do lead/telefone
      if (leadId) {
        const leadCheck = await this.canSendToLead(leadId);
        if (!leadCheck.canSend) {
          return leadCheck;
        }
      } else if (phone) {
        const phoneCheck = await this.canSendToPhone(phone);
        if (!phoneCheck.canSend) {
          return phoneCheck;
        }
      }

      return {
        canSend: true,
        dailyCount: dailyCheck.dailyCount,
        dailyLimit: dailyCheck.dailyLimit
      };
    } catch (error) {
      console.error('Erro na verificação completa de compliance:', error);
      return {
        canSend: false,
        reason: 'Erro interno na verificação de compliance'
      };
    }
  }

  /**
   * Adiciona opt-out footer na mensagem
   */
  static addOptOutFooter(message: string): string {
    const footer = '\n\n_Digite SAIR para não receber mais mensagens._';

    if (message.includes('Digite SAIR') || message.includes('digite sair')) {
      return message; // Já tem opt-out
    }

    return message + footer;
  }

  /**
   * Processa comando de opt-out
   */
  static async processOptOut(phone: string, message: string): Promise<boolean> {
    const normalizedMessage = message.toUpperCase().trim();

    if (this.config.optOutKeywords.some(keyword =>
      normalizedMessage.includes(keyword.toUpperCase())
    )) {
      await this.addToBlacklist(phone, 'opt-out-request');
      return true;
    }

    return false;
  }

  /**
   * Adiciona número à blacklist
   */
  static async addToBlacklist(phone: string, reason: string = 'manual'): Promise<void> {
    try {
      const formattedPhone = this.formatPhone(phone);

      await pool.query(`
        INSERT INTO whatsapp_blacklist (phone_number, reason, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (phone_number) DO UPDATE SET
          reason = $2,
          updated_at = NOW()
      `, [formattedPhone, reason]);

      // Log da ação
      console.log(`[COMPLIANCE] Número ${formattedPhone} adicionado à blacklist. Motivo: ${reason}`);
    } catch (error) {
      console.error('Erro ao adicionar à blacklist:', error);
    }
  }

  /**
   * Remove número da blacklist
   */
  static async removeFromBlacklist(phone: string): Promise<void> {
    try {
      const formattedPhone = this.formatPhone(phone);

      await pool.query('DELETE FROM whatsapp_blacklist WHERE phone_number = $1', [formattedPhone]);

      console.log(`[COMPLIANCE] Número ${formattedPhone} removido da blacklist`);
    } catch (error) {
      console.error('Erro ao remover da blacklist:', error);
    }
  }

  /**
   * Verifica se número está na blacklist
   */
  static async isBlacklisted(phone: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhone(phone);

      const result = await pool.query(
        'SELECT 1 FROM whatsapp_blacklist WHERE phone_number = $1 LIMIT 1',
        [formattedPhone]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Erro ao verificar blacklist:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas de compliance
   */
  static async getComplianceStats(): Promise<any> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [dailyCount, blacklistCount, recentOptOuts] = await Promise.all([
        pool.query(`
          SELECT COUNT(*) as count
          FROM whatsapp_messages
          WHERE DATE(created_at) = $1 AND status = 'sent'
        `, [today]),

        pool.query('SELECT COUNT(*) as count FROM whatsapp_blacklist'),

        pool.query(`
          SELECT COUNT(*) as count
          FROM whatsapp_blacklist
          WHERE reason = 'opt-out-request'
          AND created_at >= NOW() - INTERVAL '7 days'
        `)
      ]);

      return {
        dailyMessageCount: parseInt(dailyCount.rows[0].count),
        dailyLimit: this.config.dailyLimitPerInstance,
        blacklistCount: parseInt(blacklistCount.rows[0].count),
        recentOptOuts: parseInt(recentOptOuts.rows[0].count),
        businessHours: this.isBusinessHours(),
        nextBusinessHour: this.getNextBusinessHour()
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de compliance:', error);
      return null;
    }
  }

  /**
   * Atualiza configuração de compliance
   */
  static updateConfig(newConfig: Partial<ComplianceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[COMPLIANCE] Configuração atualizada:', this.config);
  }

  /**
   * Obtém configuração atual
   */
  static getConfig(): ComplianceConfig {
    return { ...this.config };
  }

  // Métodos auxiliares privados
  private static formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      return cleaned;
    }
    if (cleaned.startsWith('0')) {
      return '55' + cleaned.substring(1);
    }
    if (cleaned.length <= 11) {
      return '55' + cleaned;
    }
    return cleaned;
  }

  private static getNextBusinessHour(): Date {
    const now = new Date();
    const nextDay = new Date(now);

    // Se é final de semana, vai para segunda-feira
    if (now.getDay() === 0) { // Domingo
      nextDay.setDate(now.getDate() + 1);
    } else if (now.getDay() === 6) { // Sábado
      nextDay.setDate(now.getDate() + 2);
    } else if (now.getHours() >= this.config.businessHoursEnd) {
      // Se passou do horário comercial, vai para o próximo dia útil
      nextDay.setDate(now.getDate() + 1);
      if (nextDay.getDay() === 6) { // Se cair no sábado
        nextDay.setDate(nextDay.getDate() + 2); // Vai para segunda
      } else if (nextDay.getDay() === 0) { // Se cair no domingo
        nextDay.setDate(nextDay.getDate() + 1); // Vai para segunda
      }
    }

    nextDay.setHours(this.config.businessHoursStart, 0, 0, 0);
    return nextDay;
  }
}