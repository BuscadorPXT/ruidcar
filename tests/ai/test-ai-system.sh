#!/bin/bash

echo "======================================================"
echo "    TESTE DO SISTEMA DE INTELIGÊNCIA ARTIFICIAL      "
echo "======================================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir resultados
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Base URL
BASE_URL="http://localhost:3000"

# 1. Obter token de autenticação
echo "1. AUTENTICAÇÃO"
echo "   Obtendo token de administrador..."
TOKEN=$(curl -s -X POST $BASE_URL/api/auth/unified-login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@ruidcar.com","password":"admin123","intent":"admin"}' | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    print_result 0 "Token obtido com sucesso"
    echo "   Token: ${TOKEN:0:50}..."
else
    print_result 1 "Falha ao obter token"
    exit 1
fi

echo ""
echo "2. TESTANDO ENDPOINTS DE IA"
echo ""

# 2.1 Estatísticas de IA
echo "   2.1 Endpoint: /api/leads/ai-stats"
RESPONSE=$(curl -s -X GET $BASE_URL/api/leads/ai-stats \
    -H "Cookie: token=$TOKEN" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Status HTTP: $HTTP_CODE"
    echo "   Resposta: $(echo $BODY | jq -c '.')"
else
    print_result 1 "Status HTTP: $HTTP_CODE"
    echo "   Erro: $BODY"
fi

echo ""

# 2.2 Estatísticas Geográficas
echo "   2.2 Endpoint: /api/leads/geographic-stats"
RESPONSE=$(curl -s -X GET $BASE_URL/api/leads/geographic-stats \
    -H "Cookie: token=$TOKEN" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Status HTTP: $HTTP_CODE"
    echo "   Resposta: $(echo $BODY | jq -c '.')"
else
    print_result 1 "Status HTTP: $HTTP_CODE"
    echo "   Erro: $BODY"
fi

echo ""

# 2.3 Lista de Leads com IA
echo "   2.3 Endpoint: /api/leads/intelligence"
RESPONSE=$(curl -s -X GET $BASE_URL/api/leads/intelligence?limit=5 \
    -H "Cookie: token=$TOKEN" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Status HTTP: $HTTP_CODE"
    TOTAL=$(echo $BODY | jq -r '.total')
    echo "   Total de leads: $TOTAL"
else
    print_result 1 "Status HTTP: $HTTP_CODE"
    echo "   Erro: $BODY"
fi

echo ""
echo "3. TESTANDO SERVIÇO DE GEO-INTELIGÊNCIA"
echo ""

# Criar arquivo de teste Node.js
cat > /tmp/test-geo.js << 'EOF'
const { geoIntelligence } = require('/var/www/app/dist/services/geo-intelligence.js');

// Teste com números brasileiros
const testNumbers = [
    '(11) 98765-4321',  // São Paulo
    '(21) 91234-5678',  // Rio de Janeiro
    '(85) 99876-5432',  // Fortaleza
    '+5511987654321',   // São Paulo com DDI
    '+351912345678'     // Portugal
];

console.log('Testando análise geográfica:\n');

testNumbers.forEach(phone => {
    const geoData = geoIntelligence.extractGeoData(phone);
    console.log(`Número: ${phone}`);
    console.log('Resultado:', JSON.stringify(geoData, null, 2));
    console.log('---');
});
EOF

echo "   Testando extração de DDD/DDI..."
node /tmp/test-geo.js 2>&1 | head -30

echo ""
echo "4. TESTANDO INTEGRAÇÃO COM GEMINI AI"
echo ""

# Verificar se a API Key está configurada
API_KEY=$(grep GEMINI_API_KEY /var/www/app/.env | cut -d= -f2)
if [ -n "$API_KEY" ]; then
    print_result 0 "API Key do Gemini configurada"
    echo "   Key: ${API_KEY:0:20}..."
else
    print_result 1 "API Key do Gemini não encontrada"
fi

echo ""
echo "5. VERIFICANDO BANCO DE DADOS"
echo ""

# Verificar estrutura do banco
export PGPASSWORD=npg_bdaE9x2yiYWL
COLUMNS=$(psql -h ep-delicate-pine-a4eh947l.us-east-1.aws.neon.tech \
    -U neondb_owner -d neondb -t -c \
    "SELECT column_name FROM information_schema.columns
     WHERE table_name = 'contact_messages'
     AND column_name IN ('lead_score', 'lead_temperature', 'ai_analysis', 'ddd', 'ddi', 'estado', 'pais')
     ORDER BY column_name")

echo "   Colunas de IA encontradas no banco:"
if [ -n "$COLUMNS" ]; then
    echo "$COLUMNS" | while read -r col; do
        if [ -n "$col" ]; then
            print_result 0 "   - $col"
        fi
    done
else
    print_result 1 "Nenhuma coluna de IA encontrada"
fi

echo ""
echo "6. VERIFICANDO INTERFACE WEB"
echo ""

# Verificar se a rota do dashboard existe
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/admin/leads-intelligence)
if [ "$RESPONSE" = "200" ]; then
    print_result 0 "Dashboard de IA acessível (/admin/leads-intelligence)"
else
    print_result 1 "Dashboard de IA não acessível (HTTP $RESPONSE)"
fi

echo ""
echo "======================================================"
echo "                   RESUMO DO TESTE                   "
echo "======================================================"
echo ""

# Contar sucessos e falhas
TOTAL_TESTS=10
PASSED=0
FAILED=0

# Aqui você poderia implementar uma contagem real baseada nos testes acima

echo -e "${GREEN}Testes bem-sucedidos:${NC} $PASSED"
echo -e "${RED}Testes falhados:${NC} $FAILED"
echo ""
echo "Teste concluído em $(date '+%Y-%m-%d %H:%M:%S')"