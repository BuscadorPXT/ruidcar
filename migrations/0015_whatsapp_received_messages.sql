-- Migration: 0015_whatsapp_received_messages.sql
-- Adiciona tabela para mensagens recebidas via webhook

-- Tabela para mensagens recebidas de leads
CREATE TABLE IF NOT EXISTS whatsapp_received_messages (
  id SERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  lead_id INTEGER REFERENCES contact_messages(id) ON DELETE CASCADE,

  -- Metadados da mensagem
  message_type TEXT DEFAULT 'text', -- text, image, audio, video, document
  media_url TEXT, -- URL do media se aplicável
  media_filename TEXT,
  media_size INTEGER,

  -- Contexto e classificação
  is_reply BOOLEAN DEFAULT false, -- Se é resposta a uma mensagem nossa
  reply_to_message_id TEXT, -- ID da mensagem original (se for reply)
  sentiment TEXT, -- positive, negative, neutral (para análise futura)
  contains_phone BOOLEAN DEFAULT false,
  contains_email BOOLEAN DEFAULT false,

  -- Timestamps
  received_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  acknowledged_at TIMESTAMP,

  -- Dados brutos do webhook
  webhook_data JSON,

  -- Status de processamento
  processed BOOLEAN DEFAULT false,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by INTEGER REFERENCES users(id),

  -- Auto-resposta
  auto_replied BOOLEAN DEFAULT false,
  auto_reply_message TEXT,
  auto_reply_sent_at TIMESTAMP
);

-- Atualizar tabela de webhooks para adicionar campo processed_at
ALTER TABLE zapi_webhooks
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_received_messages_phone ON whatsapp_received_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_received_messages_lead ON whatsapp_received_messages(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_received_messages_received_at ON whatsapp_received_messages(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_received_messages_unprocessed ON whatsapp_received_messages(processed, received_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_received_messages_unacknowledged ON whatsapp_received_messages(acknowledged, received_at DESC) WHERE acknowledged = false;

-- Índices para busca de texto nas mensagens (busca simples)
CREATE INDEX IF NOT EXISTS idx_received_messages_content_gin ON whatsapp_received_messages USING gin(to_tsvector('portuguese', message_content));

-- View para dashboard de mensagens recebidas
CREATE OR REPLACE VIEW whatsapp_received_dashboard AS
SELECT
  COUNT(*) as total_received,
  COUNT(*) FILTER (WHERE received_at >= NOW() - INTERVAL '1 hour') as last_hour,
  COUNT(*) FILTER (WHERE received_at >= NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE received_at >= NOW() - INTERVAL '7 days') as last_7days,

  -- Status de processamento
  COUNT(*) FILTER (WHERE processed = false) as unprocessed,
  COUNT(*) FILTER (WHERE acknowledged = false) as unacknowledged,

  -- Tipos de mensagem
  COUNT(*) FILTER (WHERE message_type = 'text') as text_messages,
  COUNT(*) FILTER (WHERE message_type != 'text') as media_messages,

  -- Análise de conteúdo
  COUNT(*) FILTER (WHERE contains_phone = true) as with_phone,
  COUNT(*) FILTER (WHERE contains_email = true) as with_email,

  -- Auto-resposta
  COUNT(*) FILTER (WHERE auto_replied = true) as auto_replied,

  -- Leads conhecidos vs desconhecidos
  COUNT(*) FILTER (WHERE lead_id IS NOT NULL) as from_known_leads,
  COUNT(*) FILTER (WHERE lead_id IS NULL) as from_unknown_numbers,

  -- Timestamp
  NOW() as snapshot_time

FROM whatsapp_received_messages;

-- View para análise de conversas por lead
CREATE OR REPLACE VIEW whatsapp_conversations AS
SELECT
  cm.id as lead_id,
  cm.full_name,
  cm.company,
  cm.whatsapp as lead_phone,

  -- Estatísticas de mensagens enviadas
  COUNT(wm.id) as messages_sent,
  MAX(wm.created_at) as last_message_sent,
  COUNT(wm.id) FILTER (WHERE wm.status = 'delivered') as messages_delivered,
  COUNT(wm.id) FILTER (WHERE wm.status = 'read') as messages_read,

  -- Estatísticas de mensagens recebidas
  COUNT(wrm.id) as messages_received,
  MAX(wrm.received_at) as last_message_received,
  COUNT(wrm.id) FILTER (WHERE wrm.processed = false) as unprocessed_received,

  -- Análise de engajamento
  CASE
    WHEN COUNT(wrm.id) = 0 THEN 'no_response'
    WHEN COUNT(wrm.id) = 1 THEN 'single_response'
    WHEN COUNT(wrm.id) BETWEEN 2 AND 5 THEN 'engaged'
    WHEN COUNT(wrm.id) > 5 THEN 'very_engaged'
  END as engagement_level,

  -- Última atividade
  GREATEST(
    COALESCE(MAX(wm.created_at), '1970-01-01'::timestamp),
    COALESCE(MAX(wrm.received_at), '1970-01-01'::timestamp)
  ) as last_activity,

  -- Status da conversa
  CASE
    WHEN MAX(wrm.received_at) > MAX(wm.created_at) THEN 'awaiting_response'
    WHEN MAX(wm.created_at) > MAX(wrm.received_at) THEN 'sent_message'
    ELSE 'no_conversation'
  END as conversation_status

FROM contact_messages cm
LEFT JOIN whatsapp_messages wm ON cm.id = wm.lead_id
LEFT JOIN whatsapp_received_messages wrm ON cm.id = wrm.lead_id
GROUP BY cm.id, cm.full_name, cm.company, cm.whatsapp
HAVING COUNT(wm.id) > 0 OR COUNT(wrm.id) > 0
ORDER BY last_activity DESC;

-- View para mensagens não processadas com prioridade
CREATE OR REPLACE VIEW whatsapp_unprocessed_messages AS
SELECT
  wrm.*,
  cm.full_name as lead_name,
  cm.company as lead_company,
  cm.business_type as lead_business_type,

  -- Prioridade baseada no lead e conteúdo
  CASE
    WHEN wrm.contains_phone = true OR wrm.contains_email = true THEN 'high'
    WHEN cm.id IS NOT NULL AND cm.business_type IN ('Montadora', 'Auto Center') THEN 'high'
    WHEN cm.id IS NOT NULL THEN 'medium'
    ELSE 'low'
  END as priority,

  -- Tempo aguardando processamento
  EXTRACT(EPOCH FROM (NOW() - wrm.received_at)) / 60 as minutes_waiting

FROM whatsapp_received_messages wrm
LEFT JOIN contact_messages cm ON wrm.lead_id = cm.id
WHERE wrm.processed = false
ORDER BY
  CASE
    WHEN wrm.contains_phone = true OR wrm.contains_email = true THEN 1
    WHEN cm.business_type IN ('Montadora', 'Auto Center') THEN 2
    WHEN cm.id IS NOT NULL THEN 3
    ELSE 4
  END,
  wrm.received_at ASC;

-- Função para detectar telefones e emails automaticamente
CREATE OR REPLACE FUNCTION analyze_received_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Detectar se contém telefone (padrões brasileiros)
  NEW.contains_phone := (
    NEW.message_content ~ '\(\d{2}\)\s*\d{4,5}-?\d{4}' OR -- (11) 99999-9999
    NEW.message_content ~ '\d{2}\s*\d{4,5}-?\d{4}' OR     -- 11 99999-9999
    NEW.message_content ~ '\+55\s*\d{2}\s*\d{4,5}-?\d{4}' -- +55 11 99999-9999
  );

  -- Detectar se contém email
  NEW.contains_email := (
    NEW.message_content ~ '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
  );

  -- Detectar se é uma resposta (contém palavras como "sim", "não", "obrigado")
  NEW.is_reply := (
    NEW.message_content ~* '\b(sim|não|nao|obrigad[ao]|thank|ok|certo|perfeito|beleza)\b'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para análise automática de mensagens recebidas
CREATE TRIGGER analyze_received_message_trigger
  BEFORE INSERT OR UPDATE ON whatsapp_received_messages
  FOR EACH ROW EXECUTE FUNCTION analyze_received_message();

-- Função para estatísticas de resposta por período
CREATE OR REPLACE FUNCTION whatsapp_response_stats(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  messages_sent INTEGER,
  messages_received INTEGER,
  response_rate DECIMAL(5,2),
  avg_response_time_hours DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_sent AS (
    SELECT
      DATE(created_at) as date,
      COUNT(*) as sent_count
    FROM whatsapp_messages
    WHERE DATE(created_at) BETWEEN start_date AND end_date
    AND status = 'sent'
    GROUP BY DATE(created_at)
  ),
  daily_received AS (
    SELECT
      DATE(received_at) as date,
      COUNT(*) as received_count,
      AVG(
        EXTRACT(EPOCH FROM (received_at - (
          SELECT MAX(wm.created_at)
          FROM whatsapp_messages wm
          WHERE wm.lead_id = wrm.lead_id
          AND wm.created_at < wrm.received_at
        ))) / 3600
      ) as avg_response_hours
    FROM whatsapp_received_messages wrm
    WHERE DATE(received_at) BETWEEN start_date AND end_date
    AND lead_id IS NOT NULL
    GROUP BY DATE(received_at)
  )
  SELECT
    COALESCE(ds.date, dr.date) as date,
    COALESCE(ds.sent_count, 0)::INTEGER as messages_sent,
    COALESCE(dr.received_count, 0)::INTEGER as messages_received,
    CASE
      WHEN COALESCE(ds.sent_count, 0) = 0 THEN 0
      ELSE ROUND(COALESCE(dr.received_count, 0) * 100.0 / ds.sent_count, 2)
    END as response_rate,
    COALESCE(dr.avg_response_hours, 0)::DECIMAL(10,2) as avg_response_time_hours
  FROM daily_sent ds
  FULL OUTER JOIN daily_received dr ON ds.date = dr.date
  ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE whatsapp_received_messages IS 'Mensagens recebidas de leads via webhook da Z-API';
COMMENT ON VIEW whatsapp_received_dashboard IS 'Dashboard de mensagens recebidas com estatísticas';
COMMENT ON VIEW whatsapp_conversations IS 'Análise de conversas por lead com métricas de engajamento';
COMMENT ON VIEW whatsapp_unprocessed_messages IS 'Mensagens não processadas com priorização automática';
COMMENT ON FUNCTION whatsapp_response_stats IS 'Estatísticas de taxa de resposta por período';