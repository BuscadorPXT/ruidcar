-- Análise completa de Leads e Mensagens WhatsApp
-- ================================================

-- 1. Verificar estrutura da tabela whatsapp_messages
\d whatsapp_messages;

-- 2. Total de mensagens enviadas
SELECT
    COUNT(*) as total_messages,
    COUNT(DISTINCT lead_id) as unique_leads,
    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_success,
    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM whatsapp_messages;

-- 3. Listar leads que receberam mensagens mas ainda estão com status "new"
SELECT
    cm.id,
    cm.full_name,
    cm.whatsapp,
    cm.status as current_status,
    cm.interaction_count,
    cm.last_interaction,
    COUNT(wm.id) as messages_sent,
    MAX(wm.sent_at) as last_message_sent
FROM contact_messages cm
INNER JOIN whatsapp_messages wm ON cm.id = wm.lead_id
WHERE wm.status IN ('sent', 'delivered', 'read')
GROUP BY cm.id, cm.full_name, cm.whatsapp, cm.status, cm.interaction_count, cm.last_interaction
ORDER BY cm.status, messages_sent DESC;

-- 4. Leads com status incorreto (receberam mensagem mas status ainda é 'new')
SELECT
    cm.id,
    cm.full_name,
    cm.status,
    COUNT(wm.id) as total_messages
FROM contact_messages cm
INNER JOIN whatsapp_messages wm ON cm.id = wm.lead_id
WHERE cm.status = 'new'
AND wm.status IN ('sent', 'delivered', 'read')
GROUP BY cm.id, cm.full_name, cm.status;

-- 5. Histórico de mensagens por lead
SELECT
    wm.lead_id,
    cm.full_name,
    cm.status as lead_status,
    wm.status as message_status,
    wm.sent_at,
    wm.delivered_at,
    wm.read_at,
    substring(wm.message_content, 1, 50) as message_preview
FROM whatsapp_messages wm
JOIN contact_messages cm ON cm.id = wm.lead_id
ORDER BY wm.sent_at DESC
LIMIT 20;

-- 6. Estatísticas por status de lead
SELECT
    cm.status,
    COUNT(DISTINCT cm.id) as lead_count,
    COUNT(wm.id) as messages_sent,
    AVG(cm.interaction_count) as avg_interactions
FROM contact_messages cm
LEFT JOIN whatsapp_messages wm ON cm.id = wm.lead_id
GROUP BY cm.status
ORDER BY lead_count DESC;

-- 7. Leads que deveriam ter status "contato efetuado" mas não têm
SELECT
    cm.id,
    cm.full_name,
    cm.whatsapp,
    cm.status as current_status,
    'contato efetuado' as should_be_status,
    COUNT(wm.id) as messages_sent,
    MAX(wm.sent_at) as last_message
FROM contact_messages cm
INNER JOIN whatsapp_messages wm ON cm.id = wm.lead_id
WHERE wm.status IN ('sent', 'delivered', 'read')
AND cm.status NOT IN ('contato efetuado', 'closed_won', 'closed_lost')
GROUP BY cm.id, cm.full_name, cm.whatsapp, cm.status
ORDER BY messages_sent DESC;