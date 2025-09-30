-- Migration: 0013_whatsapp_message_queue.sql
-- Cria tabela para fila de mensagens WhatsApp

-- Tabela principal para fila de mensagens
CREATE TABLE IF NOT EXISTS whatsapp_message_queue (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES contact_messages(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  template_id INTEGER REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),

  -- Agendamento e controle de retry
  scheduled_for TIMESTAMP NOT NULL DEFAULT NOW(),
  max_retries INTEGER DEFAULT 3,
  current_retries INTEGER DEFAULT 0,

  -- Timestamps de controle
  created_at TIMESTAMP DEFAULT NOW(),
  processing_started_at TIMESTAMP,
  sent_at TIMESTAMP,
  failed_at TIMESTAMP,
  cancelled_at TIMESTAMP,

  -- Informações de envio
  zapi_message_id TEXT,
  last_error TEXT,

  -- Metadados e auditoria
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  metadata JSON,

  -- Índices compostos otimizados
  CONSTRAINT chk_retry_logic CHECK (current_retries <= max_retries)
);

-- Tabela para estatísticas e métricas da fila
CREATE TABLE IF NOT EXISTS whatsapp_queue_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Contadores diários
  messages_queued INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  messages_cancelled INTEGER DEFAULT 0,

  -- Métricas de performance
  avg_processing_time_seconds DECIMAL(10,2),
  avg_queue_wait_time_seconds DECIMAL(10,2),
  max_queue_size INTEGER DEFAULT 0,

  -- Compliance metrics
  compliance_blocks_business_hours INTEGER DEFAULT 0,
  compliance_blocks_daily_limit INTEGER DEFAULT 0,
  compliance_blocks_interval INTEGER DEFAULT 0,
  opt_outs_processed INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraint para garantir uma linha por dia
  CONSTRAINT unique_queue_metrics_date UNIQUE (date)
);

-- Índices para otimização da fila de mensagens
CREATE INDEX IF NOT EXISTS idx_queue_processing_order ON whatsapp_message_queue(
  status, scheduled_for, priority DESC
) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_queue_phone_recent ON whatsapp_message_queue(
  phone_number, created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_queue_lead_status ON whatsapp_message_queue(
  lead_id, status
);

CREATE INDEX IF NOT EXISTS idx_queue_created_date ON whatsapp_message_queue(
  DATE(created_at)
);

CREATE INDEX IF NOT EXISTS idx_queue_priority_status ON whatsapp_message_queue(
  priority, status
);

-- Índices para métricas
CREATE INDEX IF NOT EXISTS idx_queue_metrics_date ON whatsapp_queue_metrics(date DESC);

-- Trigger para atualizar métricas automaticamente
CREATE OR REPLACE FUNCTION update_queue_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar métricas do dia
  INSERT INTO whatsapp_queue_metrics (
    date,
    messages_queued,
    messages_sent,
    messages_failed,
    messages_cancelled
  )
  SELECT
    CURRENT_DATE,
    COUNT(CASE WHEN status = 'pending' OR OLD.status != 'pending' THEN 1 END),
    COUNT(CASE WHEN status = 'sent' THEN 1 END),
    COUNT(CASE WHEN status = 'failed' THEN 1 END),
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END)
  FROM whatsapp_message_queue
  WHERE DATE(created_at) = CURRENT_DATE
  ON CONFLICT (date) DO UPDATE SET
    messages_sent = EXCLUDED.messages_sent,
    messages_failed = EXCLUDED.messages_failed,
    messages_cancelled = EXCLUDED.messages_cancelled,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT na fila
CREATE TRIGGER queue_metrics_insert
  AFTER INSERT ON whatsapp_message_queue
  FOR EACH ROW EXECUTE FUNCTION update_queue_metrics();

-- Trigger para UPDATE na fila
CREATE TRIGGER queue_metrics_update
  AFTER UPDATE OF status ON whatsapp_message_queue
  FOR EACH ROW EXECUTE FUNCTION update_queue_metrics();

-- Função para limpar mensagens antigas automaticamente
CREATE OR REPLACE FUNCTION cleanup_old_queue_messages()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM whatsapp_message_queue
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND status IN ('sent', 'failed', 'cancelled');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- View para dashboard da fila em tempo real
CREATE OR REPLACE VIEW whatsapp_queue_dashboard AS
SELECT
  -- Status counts
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,

  -- Priority breakdown
  COUNT(*) FILTER (WHERE priority = 'urgent' AND status = 'pending') as urgent_pending,
  COUNT(*) FILTER (WHERE priority = 'high' AND status = 'pending') as high_pending,
  COUNT(*) FILTER (WHERE priority = 'normal' AND status = 'pending') as normal_pending,
  COUNT(*) FILTER (WHERE priority = 'low' AND status = 'pending') as low_pending,

  -- Next scheduled message
  MIN(scheduled_for) FILTER (WHERE status = 'pending') as next_scheduled,

  -- Messages by time periods
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as last_hour,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as last_day,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 week') as last_week,

  -- Average processing times
  AVG(EXTRACT(EPOCH FROM (sent_at - processing_started_at))) FILTER (
    WHERE status = 'sent' AND processing_started_at IS NOT NULL
  ) as avg_processing_seconds,

  -- Retry statistics
  AVG(current_retries) FILTER (WHERE status IN ('sent', 'failed')) as avg_retries,
  COUNT(*) FILTER (WHERE current_retries > 0) as messages_with_retries,

  -- Current time for reference
  NOW() as snapshot_time

FROM whatsapp_message_queue;

-- View para análise de performance por dia
CREATE OR REPLACE VIEW whatsapp_queue_performance AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_messages,
  COUNT(*) FILTER (WHERE status = 'sent') as successful_sends,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_sends,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'sent') * 100.0 / COUNT(*),
    2
  ) as success_rate_percent,

  -- Tempo médio na fila (criação até envio)
  AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) FILTER (
    WHERE status = 'sent'
  ) as avg_queue_time_seconds,

  -- Tempo médio de processamento
  AVG(EXTRACT(EPOCH FROM (sent_at - processing_started_at))) FILTER (
    WHERE status = 'sent' AND processing_started_at IS NOT NULL
  ) as avg_processing_time_seconds,

  -- Distribuição por prioridade
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_messages,
  COUNT(*) FILTER (WHERE priority = 'high') as high_messages,
  COUNT(*) FILTER (WHERE priority = 'normal') as normal_messages,
  COUNT(*) FILTER (WHERE priority = 'low') as low_messages,

  -- Retry statistics
  AVG(current_retries) as avg_retries,
  MAX(current_retries) as max_retries,
  COUNT(*) FILTER (WHERE current_retries > 0) as messages_with_retries

FROM whatsapp_message_queue
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Comentários para documentação
COMMENT ON TABLE whatsapp_message_queue IS 'Fila de mensagens WhatsApp com sistema de retry e compliance';
COMMENT ON TABLE whatsapp_queue_metrics IS 'Métricas diárias da fila de mensagens para dashboard';

COMMENT ON COLUMN whatsapp_message_queue.priority IS 'Prioridade: urgent > high > normal > low';
COMMENT ON COLUMN whatsapp_message_queue.scheduled_for IS 'Quando a mensagem deve ser processada (considera compliance)';
COMMENT ON COLUMN whatsapp_message_queue.current_retries IS 'Número atual de tentativas de envio';
COMMENT ON COLUMN whatsapp_message_queue.metadata IS 'Dados adicionais em JSON (campanha, origem, etc)';

COMMENT ON VIEW whatsapp_queue_dashboard IS 'Dashboard em tempo real da fila de mensagens';
COMMENT ON VIEW whatsapp_queue_performance IS 'Análise de performance da fila por dia';

-- Inserir métricas iniciais para hoje
INSERT INTO whatsapp_queue_metrics (date) VALUES (CURRENT_DATE) ON CONFLICT (date) DO NOTHING;