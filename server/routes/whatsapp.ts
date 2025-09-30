import { Request, Response, Router } from 'express';
import { zapiService } from '../services/zapi-whatsapp';
import { authenticateUser } from '../middleware/auth';
import { pool } from '../db';

const router = Router();

// Middleware para logging de requests WhatsApp
const logWhatsAppRequest = (req: Request, res: Response, next: Function) => {
  console.log(`[WhatsApp API] ${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString()
  });
  next();
};

router.use(logWhatsAppRequest);

/**
 * Enviar mensagem para um lead específico
 */
router.post('/send-single', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { leadId, phone, message, templateId } = req.body;

    if (!leadId || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'leadId, phone e message são obrigatórios'
      });
    }

    // Verificar se o lead existe
    const leadResult = await pool.query('SELECT * FROM contact_messages WHERE id = $1', [leadId]);
    if (leadResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado'
      });
    }

    // Enviar mensagem via Z-API
    const result = await zapiService.sendMessage(phone, message);

    // Salvar no banco de dados
    await pool.query(`
      INSERT INTO whatsapp_messages (
        lead_id, phone_number, message_content, status,
        zapi_message_id, template_id, sent_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      leadId,
      phone,
      message,
      result.value ? 'sent' : 'failed',
      result.messageId || null,
      templateId || null,
      result.value ? new Date() : null,
      req.user?.id || 1
    ]);

    // Atualizar status do lead para "contato efetuado" se a mensagem foi enviada com sucesso
    if (result.value) {
      try {
        await pool.query(`
          UPDATE contact_messages
          SET status = 'contato efetuado',
              last_interaction = NOW(),
              interaction_count = interaction_count + 1
          WHERE id = $1 AND status IN ('new', 'qualificado', 'interessado')
        `, [leadId]);

        console.log(`[WhatsApp] Status do lead ${leadId} atualizado para "contato efetuado"`);
      } catch (statusUpdateError) {
        console.error('Erro ao atualizar status do lead:', statusUpdateError);
        // Não interrompe o fluxo, apenas registra o erro
      }
    }

    res.json({
      success: result.value,
      messageId: result.messageId,
      error: result.error || null
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem única:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Enviar mensagens em lote para múltiplos leads
 */
router.post('/send-bulk', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { messages, templateId } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array de mensagens é obrigatório'
      });
    }

    // Validar estrutura das mensagens
    for (const msg of messages) {
      if (!msg.leadId || !msg.phone || !msg.message) {
        return res.status(400).json({
          success: false,
          error: 'Cada mensagem deve conter leadId, phone e message'
        });
      }
    }

    console.log('[WhatsApp] Iniciando envio em lote para', messages.length, 'leads');

    // Enviar mensagens via Z-API
    const results = await zapiService.sendBulkMessages(messages.map(msg => ({
      ...msg,
      templateId
    })));

    console.log('[WhatsApp] Resultados do envio:', {
      total: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length
    });

    // Atualizar status dos leads para "contato efetuado" quando mensagem foi enviada com sucesso
    const successfulSends = results.filter(r => r.status === 'sent');
    if (successfulSends.length > 0) {
      try {
        const leadIds = successfulSends.map(result => {
          const originalMessage = messages.find(msg => msg.phone === result.phone);
          return originalMessage?.leadId;
        }).filter(Boolean);

        console.log('[WhatsApp] Lead IDs para atualizar status:', leadIds);

        if (leadIds.length > 0) {
          // Atualizar status para "contato efetuado" em batch
          const updateResult = await pool.query(`
            UPDATE contact_messages
            SET status = 'contato efetuado',
                last_interaction = NOW(),
                interaction_count = interaction_count + 1
            WHERE id = ANY($1) AND status IN ('new', 'qualificado', 'interessado', 'pendente')
            RETURNING id
          `, [leadIds]);

          console.log(`[WhatsApp] Status atualizado para "contato efetuado" em ${updateResult.rowCount} de ${leadIds.length} leads`);

          // Se alguns leads não foram atualizados, vamos verificar o motivo
          if (updateResult.rowCount < leadIds.length) {
            const updatedIds = updateResult.rows.map(r => r.id);
            const notUpdatedIds = leadIds.filter(id => !updatedIds.includes(id));

            // Verificar status atual dos leads não atualizados
            const checkResult = await pool.query(
              'SELECT id, status FROM contact_messages WHERE id = ANY($1)',
              [notUpdatedIds]
            );

            console.log('[WhatsApp] Leads não atualizados:', checkResult.rows);
          }
        }
      } catch (statusUpdateError) {
        console.error('[WhatsApp] Erro ao atualizar status dos leads:', statusUpdateError);
        // Não interrompe o fluxo, apenas registra o erro
      }
    }

    // Estatísticas
    const stats = {
      total: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length
    };

    console.log('[WhatsApp] Resposta final:', { success: true, stats });

    res.json({
      success: true,
      stats,
      results
    });

  } catch (error) {
    console.error('Erro ao enviar mensagens em lote:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Listar templates disponíveis
 */
router.get('/templates', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { businessType, isActive = true } = req.query;

    let query = 'SELECT * FROM whatsapp_templates WHERE is_active = $1';
    const params: any[] = [isActive];

    if (businessType) {
      query += ' AND (business_type IS NULL OR business_type = $2)';
      params.push(businessType);
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);

    // Parse variables JSON field to array
    const templatesWithParsedVariables = result.rows.map(template => ({
      ...template,
      variables: typeof template.variables === 'string'
        ? JSON.parse(template.variables || '[]')
        : (Array.isArray(template.variables) ? template.variables : [])
    }));

    res.json({
      success: true,
      templates: templatesWithParsedVariables
    });

  } catch (error) {
    console.error('Erro ao listar templates:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Criar novo template
 */
router.post('/templates', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { name, content, variables, business_type, lead_status } = req.body;

    if (!name || !content) {
      return res.status(400).json({
        success: false,
        error: 'Nome e conteúdo são obrigatórios'
      });
    }

    const result = await pool.query(`
      INSERT INTO whatsapp_templates (
        name, content, variables, business_type, lead_status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      name,
      content,
      JSON.stringify(variables || []),
      business_type || null,
      lead_status || [],
      req.user?.id || 1
    ]);

    res.json({
      success: true,
      template: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar template:', error);

    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'Já existe um template com este nome'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Atualizar template
 */
router.put('/templates/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, content, variables, business_type, lead_status, is_active } = req.body;

    const result = await pool.query(`
      UPDATE whatsapp_templates SET
        name = COALESCE($1, name),
        content = COALESCE($2, content),
        variables = COALESCE($3, variables),
        business_type = COALESCE($4, business_type),
        lead_status = COALESCE($5, lead_status),
        is_active = COALESCE($6, is_active),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [name, content, variables ? JSON.stringify(variables) : null, business_type, lead_status || null, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    res.json({
      success: true,
      template: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Verificar status da instância Z-API principal (para o componente ZAPIInstanceStatus)
 */
router.get('/instances', authenticateUser, async (req: Request, res: Response) => {
  try {
    // Buscar a instância principal
    const dbResult = await pool.query('SELECT * FROM zapi_instances WHERE is_active = true LIMIT 1');

    if (dbResult.rows.length === 0) {
      return res.status(404).json({
        connected: false,
        error: 'Nenhuma instância Z-API configurada'
      });
    }

    const instance = dbResult.rows[0];

    try {
      // Verificar status em tempo real na Z-API
      const status = await zapiService.getInstanceStatus();

      // Atualizar status no banco
      await pool.query(`
        UPDATE zapi_instances SET
          status = $1,
          phone_number = $2,
          last_seen = NOW()
        WHERE id = $3
      `, [
        status.connected ? 'connected' : 'disconnected',
        status.phone || instance.phone_number,
        instance.id
      ]);

      // Retornar no formato esperado pelo frontend
      res.json({
        connected: status.connected === true,
        phone: status.phone || instance.phone_number,
        instanceId: instance.instance_id,
        lastSeen: new Date().toISOString(),
        battery: status.battery || null,
        qrCode: status.qrCode || null
      });

    } catch (error) {
      console.error('Erro ao verificar status Z-API:', error);

      // Retornar instância como desconectada em caso de erro
      res.json({
        connected: false,
        phone: instance.phone_number,
        instanceId: instance.instance_id,
        lastSeen: instance.last_seen,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

  } catch (error) {
    console.error('Erro ao verificar instâncias:', error);
    res.status(500).json({
      connected: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Webhook para receber atualizações da Z-API
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;

    // Log do webhook recebido
    console.log('[Z-API Webhook] Recebido:', {
      type: webhookData.type || 'unknown',
      data: webhookData,
      timestamp: new Date().toISOString()
    });

    // Salvar webhook no banco para auditoria
    await pool.query(`
      INSERT INTO zapi_webhooks (
        event_type, webhook_data, message_id, phone_number
      ) VALUES ($1, $2, $3, $4)
    `, [
      webhookData.type || 'unknown',
      JSON.stringify(webhookData),
      webhookData.messageId || null,
      webhookData.phone || null
    ]);

    // Processar diferentes tipos de webhooks
    if (webhookData.type === 'message_status') {
      await processMessageStatusWebhook(webhookData);
    } else if (webhookData.type === 'message_received') {
      await processMessageReceivedWebhook(webhookData);
    } else if (webhookData.type === 'instance_status') {
      await processInstanceStatusWebhook(webhookData);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Erro ao processar webhook Z-API:', error);
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * Histórico de mensagens de um lead
 */
router.get('/messages/:leadId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(`
      SELECT wm.*, wt.name as template_name, u.full_name as sent_by_name
      FROM whatsapp_messages wm
      LEFT JOIN whatsapp_templates wt ON wm.template_id = wt.id
      LEFT JOIN users u ON wm.created_by = u.id
      WHERE wm.lead_id = $1
      ORDER BY wm.created_at DESC
      LIMIT $2 OFFSET $3
    `, [leadId, limit, offset]);

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM whatsapp_messages WHERE lead_id = $1',
      [leadId]
    );

    res.json({
      success: true,
      messages: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

  } catch (error) {
    console.error('Erro ao buscar histórico de mensagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * TESTE TEMPORÁRIO - Diagnóstico do sistema WhatsApp
 */
router.post('/test-diagnostic', async (req: Request, res: Response) => {
  try {
    console.log('[WhatsApp TEST] Iniciando diagnóstico do sistema...');

    // 1. Verificar conectividade com Z-API
    const connectionTest = await zapiService.testConnection();
    console.log('[WhatsApp TEST] Conexão Z-API:', connectionTest);

    // 2. Buscar um lead de teste
    const leadResult = await pool.query(`
      SELECT id, full_name as fullName, whatsapp, status
      FROM contact_messages
      WHERE whatsapp IS NOT NULL
      LIMIT 1
    `);

    if (leadResult.rows.length === 0) {
      return res.json({
        success: false,
        error: 'Nenhum lead com WhatsApp encontrado',
        connection: connectionTest
      });
    }

    const testLead = leadResult.rows[0];
    console.log('[WhatsApp TEST] Lead de teste:', testLead);

    // 3. Simular envio de mensagem
    const testMessage = `Teste diagnóstico RuidCar - ${new Date().toLocaleString('pt-BR')}`;

    try {
      const sendResult = await zapiService.sendMessage(testLead.whatsapp, testMessage);
      console.log('[WhatsApp TEST] Resultado do envio:', sendResult);

      // 4. Verificar atualização de status
      if (sendResult.value) {
        const updateResult = await pool.query(`
          UPDATE contact_messages
          SET status = 'contato efetuado',
              last_interaction = NOW(),
              interaction_count = interaction_count + 1
          WHERE id = $1
          RETURNING id, status
        `, [testLead.id]);

        console.log('[WhatsApp TEST] Lead atualizado:', updateResult.rows[0]);
      }

      res.json({
        success: true,
        diagnostic: {
          connection: connectionTest,
          lead: testLead,
          sendResult,
          statusUpdated: sendResult.value
        }
      });

    } catch (sendError) {
      console.error('[WhatsApp TEST] Erro no envio:', sendError);
      res.json({
        success: false,
        error: 'Erro ao enviar mensagem de teste',
        details: sendError instanceof Error ? sendError.message : 'Unknown error',
        connection: connectionTest,
        lead: testLead
      });
    }

  } catch (error) {
    console.error('[WhatsApp TEST] Erro no diagnóstico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no diagnóstico',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Testar conectividade com Z-API
 */
router.post('/test-connection', authenticateUser, async (req: Request, res: Response) => {
  try {
    const connectionTest = await zapiService.testConnection();

    res.json({
      success: true,
      connection: connectionTest
    });

  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Enviar mensagem de teste
 */
router.post('/test-message', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Número de telefone é obrigatório'
      });
    }

    const success = await zapiService.sendTestMessage(phone);

    res.json({
      success,
      message: success ? 'Mensagem de teste enviada com sucesso!' : 'Falha no envio da mensagem de teste'
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem de teste:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Funções auxiliares para processar webhooks
async function processMessageStatusWebhook(data: any) {
  try {
    if (data.messageId) {
      const updateData: any = { updated_at: new Date() };

      if (data.status === 'delivered') {
        updateData.status = 'delivered';
        updateData.delivered_at = new Date();
      } else if (data.status === 'read') {
        updateData.status = 'read';
        updateData.read_at = new Date();
      } else if (data.status === 'failed') {
        updateData.status = 'failed';
        updateData.error_message = data.error || 'Falha na entrega';
      }

      await pool.query(`
        UPDATE whatsapp_messages SET
          status = COALESCE($1, status),
          delivered_at = COALESCE($2, delivered_at),
          read_at = COALESCE($3, read_at),
          error_message = COALESCE($4, error_message),
          updated_at = NOW()
        WHERE zapi_message_id = $5
      `, [
        updateData.status,
        updateData.delivered_at,
        updateData.read_at,
        updateData.error_message,
        data.messageId
      ]);
    }
  } catch (error) {
    console.error('Erro ao processar webhook de status:', error);
  }
}

async function processMessageReceivedWebhook(data: any) {
  try {
    // Aqui você pode implementar lógica para mensagens recebidas
    // Por exemplo, resposta automática ou notificação para admins
    console.log('Mensagem recebida de:', data.phone, '- Conteúdo:', data.message);
  } catch (error) {
    console.error('Erro ao processar webhook de mensagem recebida:', error);
  }
}

async function processInstanceStatusWebhook(data: any) {
  try {
    // Atualizar status da instância no banco
    await pool.query(`
      UPDATE zapi_instances SET
        status = $1,
        last_seen = NOW()
      WHERE instance_id = $2
    `, [
      data.connected ? 'connected' : 'disconnected',
      data.instanceId
    ]);
  } catch (error) {
    console.error('Erro ao processar webhook de status da instância:', error);
  }
}

export default router;