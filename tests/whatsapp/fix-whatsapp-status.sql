-- Script para corrigir status de mensagens WhatsApp e leads
-- ===========================================================

-- 1. Primeiro, vamos verificar as mensagens que têm zapi_message_id mas estão como 'failed'
SELECT
    id,
    lead_id,
    status,
    zapi_message_id,
    error_message,
    created_at
FROM whatsapp_messages
WHERE zapi_message_id IS NOT NULL
AND status = 'failed';

-- 2. Atualizar status das mensagens que foram enviadas (têm zapi_message_id)
UPDATE whatsapp_messages
SET
    status = 'sent',
    sent_at = COALESCE(sent_at, created_at),
    updated_at = NOW()
WHERE zapi_message_id IS NOT NULL
AND status = 'failed'
RETURNING id, lead_id, status, zapi_message_id;

-- 3. Atualizar status dos leads que receberam mensagens
UPDATE contact_messages cm
SET
    status = 'contato efetuado',
    last_interaction = NOW(),
    interaction_count = COALESCE(interaction_count, 0) + 1
FROM (
    SELECT DISTINCT lead_id
    FROM whatsapp_messages
    WHERE status = 'sent'
) wm
WHERE cm.id = wm.lead_id
AND cm.status IN ('new', 'pendente', 'qualificado', 'interessado')
RETURNING cm.id, cm.full_name, cm.status, cm.interaction_count;

-- 4. Verificar resultados finais
SELECT
    cm.id,
    cm.full_name,
    cm.status as lead_status,
    cm.interaction_count,
    COUNT(wm.id) as total_messages,
    MAX(wm.sent_at) as last_message_sent
FROM contact_messages cm
JOIN whatsapp_messages wm ON cm.id = wm.lead_id
WHERE wm.lead_id IN (203, 204, 205, 206, 207, 226, 227, 228)
GROUP BY cm.id, cm.full_name, cm.status, cm.interaction_count
ORDER BY cm.id;