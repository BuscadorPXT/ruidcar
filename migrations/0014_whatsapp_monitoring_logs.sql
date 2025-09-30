-- Migration: 0014_whatsapp_monitoring_logs.sql
-- Cria sistema de logs e monitoramento para WhatsApp

-- Tabela principal para logs do sistema WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  category TEXT NOT NULL CHECK (category IN ('whatsapp', 'compliance', 'queue', 'api', 'webhook', 'system')),
  message TEXT NOT NULL,
  details JSON,

  -- Contexto opcional
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  lead_id INTEGER REFERENCES contact_messages(id) ON DELETE SET NULL,
  phone_number TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Índice para busca rápida por data
  CONSTRAINT chk_log_message_length CHECK (LENGTH(message) <= 1000)
);

-- Tabela para configuração de alertas
CREATE TABLE IF NOT EXISTS whatsapp_alert_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  condition_sql TEXT, -- SQL query ou 'MANUAL_CHECK'
  threshold_value DECIMAL(10,2),
  enabled BOOLEAN DEFAULT true,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  recipients TEXT[] DEFAULT '{}', -- emails para notificação

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para alertas disparados
CREATE TABLE IF NOT EXISTS whatsapp_alerts (
  id SERIAL PRIMARY KEY,
  alert_config_id TEXT REFERENCES whatsapp_alert_configs(id),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  details JSON,

  -- Status do alerta
  triggered_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  acknowledgment_note TEXT,

  -- Auto-resolve
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_reason TEXT
);

-- Tabela para métricas de sistema em tempo real
CREATE TABLE IF NOT EXISTS whatsapp_system_metrics (
  id SERIAL PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  metric_unit TEXT, -- 'count', 'percentage', 'milliseconds', 'bytes'
  tags JSON, -- Metadados adicionais

  recorded_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_metric_name_length CHECK (LENGTH(metric_name) <= 100)
);

-- Tabela para health checks
CREATE TABLE IF NOT EXISTS whatsapp_health_checks (
  id SERIAL PRIMARY KEY,
  component TEXT NOT NULL, -- 'zapi', 'queue', 'compliance', 'database'
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
  message TEXT NOT NULL,
  details JSON,
  response_time_ms INTEGER,

  checked_at TIMESTAMP DEFAULT NOW()
);

-- Índices otimizados para logs
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_level_category ON whatsapp_logs(level, category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON whatsapp_logs(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_lead_id ON whatsapp_logs(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_user_id ON whatsapp_logs(user_id) WHERE user_id IS NOT NULL;

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_whatsapp_alerts_config_id ON whatsapp_alerts(alert_config_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_alerts_triggered_at ON whatsapp_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_alerts_unacknowledged ON whatsapp_alerts(acknowledged, triggered_at DESC) WHERE acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_whatsapp_alerts_severity ON whatsapp_alerts(severity, triggered_at DESC);

-- Índices para métricas
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON whatsapp_system_metrics(metric_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON whatsapp_system_metrics(recorded_at DESC);

-- Índices para health checks
CREATE INDEX IF NOT EXISTS idx_health_checks_component_time ON whatsapp_health_checks(component, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON whatsapp_health_checks(status, checked_at DESC);

-- Trigger para limpeza automática de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_logs()
RETURNS TRIGGER AS $$
BEGIN
  -- Manter apenas logs dos últimos 30 dias
  DELETE FROM whatsapp_logs
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Manter apenas métricas dos últimos 7 dias
  DELETE FROM whatsapp_system_metrics
  WHERE recorded_at < NOW() - INTERVAL '7 days';

  -- Manter apenas health checks das últimas 24 horas
  DELETE FROM whatsapp_health_checks
  WHERE checked_at < NOW() - INTERVAL '1 day';

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpeza automática (executa a cada 1000 inserções)
CREATE TRIGGER trigger_cleanup_logs
  AFTER INSERT ON whatsapp_logs
  FOR EACH STATEMENT
  WHEN (random() < 0.001) -- 0.1% das vezes
  EXECUTE FUNCTION cleanup_old_whatsapp_logs();

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_alert_configs_updated_at
  BEFORE UPDATE ON whatsapp_alert_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View para dashboard de logs
CREATE OR REPLACE VIEW whatsapp_logs_summary AS
SELECT
  level,
  category,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM whatsapp_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY level, category
ORDER BY
  CASE level
    WHEN 'critical' THEN 1
    WHEN 'error' THEN 2
    WHEN 'warn' THEN 3
    WHEN 'info' THEN 4
    WHEN 'debug' THEN 5
  END,
  count DESC;

-- View para alertas ativos com contexto
CREATE OR REPLACE VIEW whatsapp_active_alerts AS
SELECT
  a.id,
  a.alert_config_id,
  c.name as alert_name,
  c.description,
  a.severity,
  a.message,
  a.details,
  a.triggered_at,
  a.acknowledged,
  u.full_name as acknowledged_by_name,
  a.acknowledged_at,
  a.acknowledgment_note,
  -- Tempo desde o disparo
  EXTRACT(EPOCH FROM (NOW() - a.triggered_at)) / 60 as minutes_since_triggered
FROM whatsapp_alerts a
LEFT JOIN whatsapp_alert_configs c ON a.alert_config_id = c.id
LEFT JOIN users u ON a.acknowledged_by = u.id
WHERE a.acknowledged = false
  AND a.resolved = false
ORDER BY
  CASE a.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  a.triggered_at DESC;

-- View para métricas recentes
CREATE OR REPLACE VIEW whatsapp_current_metrics AS
SELECT DISTINCT ON (metric_name)
  metric_name,
  metric_value,
  metric_unit,
  tags,
  recorded_at,
  EXTRACT(EPOCH FROM (NOW() - recorded_at)) / 60 as minutes_ago
FROM whatsapp_system_metrics
ORDER BY metric_name, recorded_at DESC;

-- View para health check dashboard
CREATE OR REPLACE VIEW whatsapp_health_dashboard AS
SELECT DISTINCT ON (component)
  component,
  status,
  message,
  details,
  response_time_ms,
  checked_at,
  EXTRACT(EPOCH FROM (NOW() - checked_at)) / 60 as minutes_ago
FROM whatsapp_health_checks
ORDER BY component, checked_at DESC;

-- Inserir configurações de alerta padrão
INSERT INTO whatsapp_alert_configs (id, name, description, condition_sql, threshold_value, severity, recipients) VALUES

-- Alerta de alta taxa de falha
('high_failure_rate', 'Alta Taxa de Falha', 'Taxa de falha de mensagens acima de 10% nas últimas 2 horas',
 'SELECT COUNT(*) FILTER (WHERE status = ''failed'') * 100.0 / NULLIF(COUNT(*), 0) as failure_rate FROM whatsapp_messages WHERE created_at >= NOW() - INTERVAL ''2 hours''',
 10.0, 'high', '{"admin@ruidcar.com.br"}'),

-- Alerta de fila com backlog
('queue_backlog', 'Fila com Backlog Alto', 'Mais de 100 mensagens pendentes na fila',
 'SELECT COUNT(*) FROM whatsapp_message_queue WHERE status = ''pending''',
 100.0, 'medium', '{"admin@ruidcar.com.br"}'),

-- Alerta de Z-API desconectado
('zapi_disconnected', 'Z-API Desconectado', 'Instância Z-API não está conectada',
 'MANUAL_CHECK',
 NULL, 'critical', '{"admin@ruidcar.com.br"}'),

-- Alerta de limite diário se aproximando
('daily_limit_approaching', 'Limite Diário Próximo', '90% do limite diário de mensagens atingido',
 'SELECT COUNT(*) FROM whatsapp_messages WHERE DATE(created_at) = CURRENT_DATE AND status = ''sent''',
 900.0, 'medium', '{"admin@ruidcar.com.br"}'),

-- Alerta de muitos bloqueios de compliance
('compliance_blocks_high', 'Muitos Bloqueios de Compliance', 'Mais de 50 bloqueios de compliance na última hora',
 'SELECT COUNT(*) FROM whatsapp_compliance_logs WHERE created_at >= NOW() - INTERVAL ''1 hour'' AND event_type LIKE ''blocked_%''',
 50.0, 'medium', '{"admin@ruidcar.com.br"}'),

-- Alerta de resposta lenta do banco
('database_slow_response', 'Banco de Dados Lento', 'Tempo de resposta do banco acima de 2 segundos',
 'MANUAL_CHECK',
 2000.0, 'medium', '{"admin@ruidcar.com.br"}'),

-- Alerta de webhook failures
('webhook_failures', 'Falhas em Webhooks', 'Muitas falhas no processamento de webhooks',
 'SELECT COUNT(*) FROM whatsapp_logs WHERE category = ''webhook'' AND level = ''error'' AND created_at >= NOW() - INTERVAL ''1 hour''',
 10.0, 'medium', '{"admin@ruidcar.com.br"}')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  condition_sql = EXCLUDED.condition_sql,
  threshold_value = EXCLUDED.threshold_value,
  severity = EXCLUDED.severity,
  updated_at = NOW();

-- Função para inserir métricas de sistema
CREATE OR REPLACE FUNCTION record_system_metric(
  p_metric_name TEXT,
  p_metric_value DECIMAL(15,4),
  p_metric_unit TEXT DEFAULT NULL,
  p_tags JSON DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO whatsapp_system_metrics (metric_name, metric_value, metric_unit, tags)
  VALUES (p_metric_name, p_metric_value, p_metric_unit, p_tags);
END;
$$ LANGUAGE plpgsql;

-- Função para registrar health check
CREATE OR REPLACE FUNCTION record_health_check(
  p_component TEXT,
  p_status TEXT,
  p_message TEXT,
  p_details JSON DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO whatsapp_health_checks (component, status, message, details, response_time_ms)
  VALUES (p_component, p_status, p_message, p_details, p_response_time_ms);
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE whatsapp_logs IS 'Sistema de logs estruturado para WhatsApp com níveis e categorias';
COMMENT ON TABLE whatsapp_alert_configs IS 'Configuração de alertas automáticos do sistema';
COMMENT ON TABLE whatsapp_alerts IS 'Alertas disparados e seu status de reconhecimento';
COMMENT ON TABLE whatsapp_system_metrics IS 'Métricas de sistema em tempo real';
COMMENT ON TABLE whatsapp_health_checks IS 'Histórico de verificações de saúde dos componentes';

COMMENT ON VIEW whatsapp_logs_summary IS 'Resumo de logs por nível e categoria nas últimas 24h';
COMMENT ON VIEW whatsapp_active_alerts IS 'Alertas ativos não reconhecidos com contexto';
COMMENT ON VIEW whatsapp_current_metrics IS 'Métricas mais recentes de cada tipo';
COMMENT ON VIEW whatsapp_health_dashboard IS 'Status atual de saúde de todos os componentes';