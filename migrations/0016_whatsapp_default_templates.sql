-- Migration: 0016_whatsapp_default_templates.sql
-- Insere templates padrão para automação WhatsApp

-- Limpar templates existentes (se houver)
DELETE FROM whatsapp_templates WHERE name IN (
  'Primeiro Contato',
  'Follow-up Qualificado',
  'Proposta Enviada',
  'Reativação de Lead'
);

-- Template 1: Primeiro Contato
INSERT INTO whatsapp_templates (
  name,
  content,
  variables,
  business_type,
  lead_status,
  is_active,
  created_by
) VALUES (
  'Primeiro Contato',
  'Olá {nome}! 👋

Vi que você se interessou pelos nossos equipamentos de isolamento acústico para {empresa}.

Como especialistas no segmento automotivo em {cidade}, temos soluções específicas para {businessType}.

Gostaria de agendar uma conversa de 15 minutos para entender melhor suas necessidades?

Atenciosamente,
Equipe RuidCar

_Digite SAIR para não receber mais mensagens._',
  '["nome", "empresa", "cidade", "businessType"]'::JSON,
  NULL, -- Todos os tipos de negócio
  '{"new", "qualified"}'::TEXT[],
  true,
  1 -- Admin user
);

-- Template 2: Follow-up Qualificado
INSERT INTO whatsapp_templates (
  name,
  content,
  variables,
  business_type,
  lead_status,
  is_active,
  created_by
) VALUES (
  'Follow-up Qualificado',
  'Oi {nome}, tudo bem?

Notei que você demonstrou interesse em nossos produtos para {empresa}.

Preparei uma proposta específica para {businessType} que pode reduzir em até 70% o ruído em seus projetos.

Quando seria um bom momento para conversarmos? Posso ligar hoje mesmo!

Abraços,
Equipe RuidCar

_Digite SAIR para não receber mais mensagens._',
  '["nome", "empresa", "businessType"]'::JSON,
  NULL, -- Todos os tipos de negócio
  '{"qualified", "interested"}'::TEXT[],
  true,
  1 -- Admin user
);

-- Template 3: Proposta Enviada
INSERT INTO whatsapp_templates (
  name,
  content,
  variables,
  business_type,
  lead_status,
  is_active,
  created_by
) VALUES (
  'Proposta Enviada',
  '{nome}, boa tarde!

Acabei de enviar a proposta personalizada para {empresa} no seu email.

A solução que preparamos para vocês inclui:
✅ Produto específico para {businessType}
✅ Instalação em {cidade}
✅ Garantia estendida
✅ Suporte técnico especializado

Alguma dúvida? Estou online agora! 📞

_Digite SAIR para não receber mais mensagens._',
  '["nome", "empresa", "businessType", "cidade"]'::JSON,
  NULL, -- Todos os tipos de negócio
  '{"proposal_sent", "qualified"}'::TEXT[],
  true,
  1 -- Admin user
);

-- Template 4: Reativação de Lead
INSERT INTO whatsapp_templates (
  name,
  content,
  variables,
  business_type,
  lead_status,
  is_active,
  created_by
) VALUES (
  'Reativação de Lead',
  'Olá {nome}!

Percebi que não conseguimos finalizar nossa conversa sobre os equipamentos para {empresa}.

Temos novidades interessantes para {businessType} e gostaria de compartilhar com você.

Que tal retomarmos nossa conversa? 😊

Atenciosamente,
Equipe RuidCar

_Digite SAIR para não receber mais mensagens._',
  '["nome", "empresa", "businessType"]'::JSON,
  NULL, -- Todos os tipos de negócio
  '{"cold", "lost", "no_response"}'::TEXT[],
  true,
  1 -- Admin user
);

-- Template 5: Agendamento de Reunião
INSERT INTO whatsapp_templates (
  name,
  content,
  variables,
  business_type,
  lead_status,
  is_active,
  created_by
) VALUES (
  'Agendamento de Reunião',
  'Oi {nome}!

Que ótimo saber do seu interesse em nossos equipamentos para {empresa}!

Gostaria de agendar uma videochamada de 20 minutos para apresentar nossas soluções específicas para {businessType}?

Tenho disponibilidade:
📅 Hoje às 14h ou 16h
📅 Amanhã às 9h, 11h ou 15h

Qual horário funciona melhor para você?

Abraços,
Equipe RuidCar

_Digite SAIR para não receber mais mensagens._',
  '["nome", "empresa", "businessType"]'::JSON,
  NULL, -- Todos os tipos de negócio
  '{"interested", "qualified"}'::TEXT[],
  true,
  1 -- Admin user
);

-- Template 6: Follow-up Pós Reunião
INSERT INTO whatsapp_templates (
  name,
  content,
  variables,
  business_type,
  lead_status,
  is_active,
  created_by
) VALUES (
  'Follow-up Pós Reunião',
  'Oi {nome}!

Foi um prazer conversar com você sobre as soluções para {empresa}.

Como combinamos, segue o resumo do que discutimos:
• Redução de ruído específica para {businessType}
• Prazo de instalação: 15 dias úteis
• Garantia de 3 anos
• ROI estimado em 8 meses

Tem alguma dúvida sobre a proposta? Posso esclarecer tudo! 😊

Abraços,
Equipe RuidCar

_Digite SAIR para não receber mais mensagens._',
  '["nome", "empresa", "businessType"]'::JSON,
  NULL, -- Todos os tipos de negócio
  '{"meeting_done", "proposal_sent"}'::TEXT[],
  true,
  1 -- Admin user
);

-- Template 7: Urgência (Para Montadoras)
INSERT INTO whatsapp_templates (
  name,
  content,
  variables,
  business_type,
  lead_status,
  is_active,
  created_by
) VALUES (
  'Urgência Montadora',
  '{nome}, situação especial para {empresa}!

Acabamos de receber um lote especial de equipamentos que seria PERFEITO para montadoras como vocês.

✨ Desconto de 15% (válido só até sexta)
🚀 Instalação expressa em 7 dias
🔧 Tecnologia alemã de última geração

Como {empresa} é uma conta prioritária, queria te dar essa oportunidade primeiro.

Posso te ligar hoje para detalhar? Só demora 10 minutos! 📞

Abraços,
Equipe RuidCar

_Digite SAIR para não receber mais mensagens._',
  '["nome", "empresa"]'::JSON,
  'Montadora', -- Específico para montadoras
  '{"interested", "qualified", "proposal_sent"}'::TEXT[],
  true,
  1 -- Admin user
);

-- Template 8: Específico Auto Center
INSERT INTO whatsapp_templates (
  name,
  content,
  variables,
  business_type,
  lead_status,
  is_active,
  created_by
) VALUES (
  'Específico Auto Center',
  'E aí {nome}!

Vi que você tem um Auto Center em {cidade} e queria compartilhar algo interessante.

Nossos equipamentos são IDEAIS para Auto Centers porque:
🔧 Instala em qualquer box de trabalho
💰 ROI médio de 6 meses (comprovado)
📈 Clientes valorizam o ambiente silencioso (+30% satisfação)

Temos cases incríveis em {cidade} que posso te mostrar.

Bora trocar uma ideia? 😎

Abraços,
Equipe RuidCar

_Digite SAIR para não receber mais mensagens._',
  '["nome", "cidade"]'::JSON,
  'Auto Center', -- Específico para Auto Centers
  '{"new", "qualified", "interested"}'::TEXT[],
  true,
  1 -- Admin user
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_templates_business_type ON whatsapp_templates(business_type) WHERE business_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_templates_lead_status ON whatsapp_templates USING GIN(lead_status);
CREATE INDEX IF NOT EXISTS idx_templates_active ON whatsapp_templates(is_active) WHERE is_active = true;

-- Inserir métricas de templates
INSERT INTO whatsapp_system_metrics (metric_name, metric_value, metric_unit, tags) VALUES
('templates_total', 8, 'count', '{"type": "default_templates"}'::json),
('templates_business_specific', 2, 'count', '{"type": "business_specific"}'::json),
('templates_generic', 6, 'count', '{"type": "generic"}'::json);

-- Log da operação
INSERT INTO whatsapp_logs (level, category, message, details) VALUES
('info', 'system', 'Templates padrão inseridos com sucesso',
 '{"templates_count": 8, "migration": "0016_whatsapp_default_templates"}'::json);

-- Comentários para documentação
COMMENT ON COLUMN whatsapp_templates.variables IS 'Array JSON com as variáveis disponíveis: nome, empresa, cidade, businessType, vendedor';
COMMENT ON COLUMN whatsapp_templates.business_type IS 'Tipo específico de negócio ou NULL para todos os tipos';
COMMENT ON COLUMN whatsapp_templates.lead_status IS 'Array de status de leads que podem usar este template';

-- Verificar se inserção funcionou
DO $$
DECLARE
    template_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM whatsapp_templates WHERE is_active = true;
    RAISE NOTICE 'Templates ativos inseridos: %', template_count;

    IF template_count < 8 THEN
        RAISE EXCEPTION 'Falha na inserção dos templates. Esperado: 8, Encontrado: %', template_count;
    END IF;
END $$;