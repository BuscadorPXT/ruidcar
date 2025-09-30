-- Migration: 0011_whatsapp_zapi_integration.sql
-- Cria tabelas para integração WhatsApp via Z-API

-- Tabela principal para armazenar mensagens WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES contact_messages(id) ON DELETE CASCADE,
  template_id INTEGER, -- Será adicionada foreign key após criação da tabela whatsapp_templates
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  zapi_message_id TEXT, -- ID da mensagem retornado pela Z-API
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para templates de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  variables JSON DEFAULT '[]', -- Array de variáveis disponíveis: ["nome", "empresa", "cidade"]
  business_type TEXT, -- null = todos os tipos, ou específico como "Montadora"
  lead_status TEXT[] DEFAULT '{}', -- Array de status de leads que podem usar este template
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para configuração da instância Z-API
CREATE TABLE IF NOT EXISTS zapi_instances (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'RuidCar Main',
  instance_id TEXT UNIQUE NOT NULL DEFAULT '3E3EFBCA3E13C17E04F83E61E96978DB',
  token TEXT NOT NULL DEFAULT '91D06F6734B2549D951518BE',
  phone_number TEXT,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error')),
  last_seen TIMESTAMP DEFAULT NOW(),
  daily_limit INTEGER DEFAULT 999999, -- Z-API sem limites diários
  daily_sent INTEGER DEFAULT 0,
  webhook_url TEXT,
  webhook_status_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para logs de webhooks recebidos da Z-API
CREATE TABLE IF NOT EXISTS zapi_webhooks (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'message_status', 'message_received', 'instance_status'
  webhook_data JSON NOT NULL, -- Dados completos do webhook
  message_id TEXT, -- ID da mensagem relacionada (se aplicável)
  phone_number TEXT, -- Número relacionado (se aplicável)
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lead_id ON whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_zapi_id ON whatsapp_messages(zapi_message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_business_type ON whatsapp_templates(business_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_active ON whatsapp_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_zapi_webhooks_event_type ON zapi_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_zapi_webhooks_message_id ON zapi_webhooks(message_id);
CREATE INDEX IF NOT EXISTS idx_zapi_webhooks_processed ON zapi_webhooks(processed);

-- Inserir instância padrão Z-API já configurada
INSERT INTO zapi_instances (
  name,
  instance_id,
  token,
  status,
  is_active,
  daily_limit
) VALUES (
  'RuidCar Main',
  '3E3EFBCA3E13C17E04F83E61E96978DB',
  '91D06F6734B2549D951518BE',
  'connected',
  true,
  999999
) ON CONFLICT (instance_id) DO NOTHING;

-- Templates padrão por tipo de negócio
INSERT INTO whatsapp_templates (name, content, variables, business_type, is_active) VALUES

-- Template 1: Primeiro Contato
('Primeiro Contato',
'Olá {nome}! 👋

Vi que você se interessou pelos nossos equipamentos de isolamento acústico para {empresa}.

Como especialistas no segmento automotivo em {cidade}, temos soluções específicas para {businessType}.

Gostaria de agendar uma conversa de 15 minutos para entender melhor suas necessidades?

Atenciosamente,
Equipe RuidCar',
'["nome", "empresa", "cidade", "businessType"]',
NULL,
true),

-- Template 2: Follow-up Qualificado
('Follow-up Qualificado',
'Oi {nome}, tudo bem?

Notei que você demonstrou interesse em nossos produtos para {empresa}.

Preparei uma proposta específica para {businessType} que pode reduzir em até 70% o ruído em seus projetos.

Quando seria um bom momento para conversarmos? Posso ligar hoje mesmo!

Abraços,
{vendedor}',
'["nome", "empresa", "businessType", "vendedor"]',
NULL,
true),

-- Template 3: Proposta Enviada
('Proposta Enviada',
'{nome}, boa tarde!

Acabei de enviar a proposta personalizada para {empresa} no seu email.

A solução que preparamos para vocês inclui:
✅ Produto específico para {businessType}
✅ Instalação em {cidade}
✅ Garantia estendida
✅ Suporte técnico especializado

Alguma dúvida? Estou online agora! 📞',
'["nome", "empresa", "businessType", "cidade"]',
NULL,
true),

-- Template 4: Reativação de Lead
('Reativação de Lead',
'Olá {nome}!

Percebi que não conseguimos finalizar nossa conversa sobre os equipamentos para {empresa}.

Temos novidades interessantes para {businessType} e gostaria de compartilhar com você.

Que tal retomarmos nossa conversa? 😊',
'["nome", "empresa", "businessType"]',
NULL,
true),

-- Template específico para Montadoras
('Montadora - Especializado',
'Olá {nome}!

Somos especialistas em soluções acústicas para montadoras como {empresa}.

Nossos produtos para {businessType} já reduziram significativamente o ruído em linhas de produção similares.

Gostaria de apresentar nosso case de sucesso específico para montadoras?

Atenciosamente,
Equipe Técnica RuidCar',
'["nome", "empresa", "businessType"]',
'Montadora',
true),

-- Template específico para Oficinas
('Oficina - Especializado',
'Oi {nome}!

Vi que sua oficina {empresa} está em {cidade}.

Temos soluções específicas para {businessType} que podem melhorar significativamente o ambiente de trabalho da sua equipe.

Quer saber como outras oficinas reduziram o ruído em 80%?

Abraços,
Equipe RuidCar',
'["nome", "empresa", "cidade", "businessType"]',
'Oficina Mecânica',
true);

-- Adicionar foreign key constraint após todas as tabelas serem criadas
ALTER TABLE whatsapp_messages
ADD CONSTRAINT fk_whatsapp_messages_template_id
FOREIGN KEY (template_id) REFERENCES whatsapp_templates(id) ON DELETE SET NULL;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas
CREATE TRIGGER update_whatsapp_messages_updated_at BEFORE UPDATE ON whatsapp_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_zapi_instances_updated_at BEFORE UPDATE ON zapi_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE whatsapp_messages IS 'Armazena todas as mensagens WhatsApp enviadas via Z-API';
COMMENT ON TABLE whatsapp_templates IS 'Templates de mensagens WhatsApp com variáveis dinâmicas';
COMMENT ON TABLE zapi_instances IS 'Configuração das instâncias Z-API conectadas';
COMMENT ON TABLE zapi_webhooks IS 'Log de todos os webhooks recebidos da Z-API';

COMMENT ON COLUMN whatsapp_messages.zapi_message_id IS 'ID único da mensagem retornado pela Z-API';
COMMENT ON COLUMN whatsapp_templates.variables IS 'Array JSON com nomes das variáveis disponíveis no template';
COMMENT ON COLUMN whatsapp_templates.business_type IS 'Tipo específico de negócio ou NULL para todos';
COMMENT ON COLUMN zapi_instances.daily_limit IS 'Limite diário de mensagens (Z-API = ilimitado)';

-- Validação: pelo menos uma instância deve estar ativa
CREATE OR REPLACE FUNCTION check_at_least_one_active_instance()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM zapi_instances WHERE is_active = true AND id != COALESCE(OLD.id, 0))
       AND (NEW.is_active = false OR TG_OP = 'DELETE') THEN
        RAISE EXCEPTION 'Deve existir pelo menos uma instância Z-API ativa';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_active_instance
    BEFORE UPDATE OR DELETE ON zapi_instances
    FOR EACH ROW EXECUTE FUNCTION check_at_least_one_active_instance();