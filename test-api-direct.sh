#!/bin/bash

# Script de teste direto da API WhatsApp

echo "🧪 Teste da API WhatsApp - Simulando envio pelo frontend"
echo ""

# 1. Buscar leads primeiro
echo "1️⃣  Buscando leads com WhatsApp..."
LEADS=$(PGPASSWORD=npg_bdaE9x2yiYWL psql -h ep-delicate-pine-a4eh947l.us-east-1.aws.neon.tech -U neondb_owner -d neondb -t -c "SELECT id, full_name, whatsapp FROM contact_messages WHERE whatsapp IS NOT NULL LIMIT 1")
echo "   Leads encontrados: $LEADS"
echo ""

# 2. Criar payload de teste
echo "2️⃣  Criando payload de teste..."
PAYLOAD='{
  "messages": [
    {
      "leadId": 1,
      "phone": "5511999999999",
      "message": "Teste de mensagem RuidCar - Enviado em: '"$(date)"'"
    }
  ],
  "templateId": 1
}'
echo "   Payload: $PAYLOAD"
echo ""

# 3. Enviar requisição sem autenticação (para testar erro)
echo "3️⃣  Testando envio SEM autenticação..."
curl -X POST http://localhost:3000/api/whatsapp/send-bulk \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" 2>/dev/null

echo ""
echo ""

# 4. Verificar logs do PM2
echo "4️⃣  Últimos logs do servidor:"
pm2 logs ruidcar-api --lines 20 --nostream | grep -E "\[WhatsApp|\[Z-API" || echo "   Nenhum log relevante encontrado"

echo ""
echo "✅ Teste concluído!"