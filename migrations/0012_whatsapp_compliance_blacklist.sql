-- Migration: 0012_whatsapp_compliance_blacklist.sql
-- Cria tabela de blacklist para compliance WhatsApp

-- Tabela para números bloqueados (opt-out)
CREATE TABLE IF NOT EXISTS whatsapp_blacklist (
  id SERIAL PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL, -- 'opt-out-request', 'manual', 'spam', 'invalid'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela para configurações de compliance por instância
CREATE TABLE IF NOT EXISTS whatsapp_compliance_config (
  id SERIAL PRIMARY KEY,
  instance_id TEXT REFERENCES zapi_instances(instance_id),
  business_hours_start INTEGER DEFAULT 8,
  business_hours_end INTEGER DEFAULT 18,
  work_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- Segunda a sexta
  min_message_interval INTEGER DEFAULT 86400000, -- 24h em milissegundos
  daily_limit INTEGER DEFAULT 1000,
  opt_out_keywords TEXT[] DEFAULT '{SAIR,STOP,PARAR,CANCELAR,REMOVE}',
  auto_add_opt_out BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para logs de compliance
CREATE TABLE IF NOT EXISTS whatsapp_compliance_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'blocked_business_hours', 'blocked_daily_limit', 'blocked_interval', 'opt_out_processed'
  phone_number TEXT,
  lead_id INTEGER REFERENCES contact_messages(id),
  reason TEXT NOT NULL,
  metadata JSON, -- Dados extras como próximo horário disponível, etc
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_blacklist_phone ON whatsapp_blacklist(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_blacklist_created_at ON whatsapp_blacklist(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_blacklist_reason ON whatsapp_blacklist(reason);

CREATE INDEX IF NOT EXISTS idx_compliance_config_instance ON whatsapp_compliance_config(instance_id);

CREATE INDEX IF NOT EXISTS idx_compliance_logs_event_type ON whatsapp_compliance_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_phone ON whatsapp_compliance_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_created_at ON whatsapp_compliance_logs(created_at);

-- Trigger para updated_at na blacklist
CREATE TRIGGER update_whatsapp_blacklist_updated_at
  BEFORE UPDATE ON whatsapp_blacklist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at na config
CREATE TRIGGER update_whatsapp_compliance_config_updated_at
  BEFORE UPDATE ON whatsapp_compliance_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão para a instância principal
INSERT INTO whatsapp_compliance_config (
  instance_id,
  business_hours_start,
  business_hours_end,
  work_days,
  min_message_interval,
  daily_limit,
  opt_out_keywords,
  auto_add_opt_out,
  is_active
) VALUES (
  '3E3EFBCA3E13C17E04F83E61E96978DB',
  8,  -- 8h
  18, -- 18h
  '{1,2,3,4,5}', -- Segunda a sexta
  86400000, -- 24h em milissegundos
  999999, -- Z-API sem limites, mas controle interno
  '{SAIR,STOP,PARAR,CANCELAR,REMOVE,UNSUBSCRIBE}',
  true,
  true
) ON CONFLICT (instance_id) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE whatsapp_blacklist IS 'Números de telefone bloqueados por opt-out ou outras razões';
COMMENT ON TABLE whatsapp_compliance_config IS 'Configurações de compliance por instância Z-API';
COMMENT ON TABLE whatsapp_compliance_logs IS 'Log de eventos relacionados a compliance WhatsApp';

COMMENT ON COLUMN whatsapp_blacklist.reason IS 'Motivo do bloqueio: opt-out-request, manual, spam, invalid';
COMMENT ON COLUMN whatsapp_compliance_config.min_message_interval IS 'Intervalo mínimo entre mensagens em milissegundos (padrão 24h)';
COMMENT ON COLUMN whatsapp_compliance_config.work_days IS 'Dias da semana permitidos (1=segunda, 7=domingo)';
COMMENT ON COLUMN whatsapp_compliance_logs.metadata IS 'Dados adicionais do evento em formato JSON';

-- View para estatísticas rápidas de compliance
CREATE OR REPLACE VIEW whatsapp_compliance_stats AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_events,
  COUNT(CASE WHEN event_type = 'blocked_business_hours' THEN 1 END) as blocked_business_hours,
  COUNT(CASE WHEN event_type = 'blocked_daily_limit' THEN 1 END) as blocked_daily_limit,
  COUNT(CASE WHEN event_type = 'blocked_interval' THEN 1 END) as blocked_interval,
  COUNT(CASE WHEN event_type = 'opt_out_processed' THEN 1 END) as opt_outs_processed
FROM whatsapp_compliance_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;