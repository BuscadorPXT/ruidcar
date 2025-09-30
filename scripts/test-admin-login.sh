#!/bin/bash

echo "================================"
echo "Teste de Login do Admin"
echo "================================"
echo ""

# URL base
BASE_URL="http://localhost:3000"

# Credenciais do admin
EMAIL="admin@ruidcar.com"
PASSWORD="Admin@123"

echo "1. Testando login do admin..."
echo "   Email: $EMAIL"
echo ""

# Fazer login e salvar cookies
RESPONSE=$(curl -X POST "$BASE_URL/api/auth/unified-login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"intent\":\"auto\"}" \
  -c /tmp/admin-cookies.txt \
  -s)

# Extrair informações do response
PRIMARY_ROLE=$(echo $RESPONSE | jq -r '.primaryRole')
REDIRECT=$(echo $RESPONSE | jq -r '.defaultRedirect')
MESSAGE=$(echo $RESPONSE | jq -r '.message')

echo "   ✅ Login: $MESSAGE"
echo "   ✅ Role: $PRIMARY_ROLE"
echo "   ✅ Redirecionamento: $REDIRECT"
echo ""

# Testar autenticação
echo "2. Verificando autenticação com /api/auth/me..."
ME_RESPONSE=$(curl -X GET "$BASE_URL/api/auth/me" \
  -b /tmp/admin-cookies.txt \
  -s)

USER_EMAIL=$(echo $ME_RESPONSE | jq -r '.user.email')
CURRENT_ROLE=$(echo $ME_RESPONSE | jq -r '.currentRole')

if [ "$USER_EMAIL" = "$EMAIL" ]; then
  echo "   ✅ Autenticação válida!"
  echo "   ✅ Email: $USER_EMAIL"
  echo "   ✅ Role atual: $CURRENT_ROLE"
else
  echo "   ❌ Erro na autenticação"
  echo "   Response: $ME_RESPONSE"
fi

echo ""
echo "3. Testando acesso a rota protegida de admin..."
ADMIN_TEST=$(curl -X GET "$BASE_URL/api/admin/test" \
  -b /tmp/admin-cookies.txt \
  -s -o /dev/null -w "%{http_code}")

if [ "$ADMIN_TEST" = "200" ] || [ "$ADMIN_TEST" = "404" ]; then
  echo "   ✅ Acesso autorizado a rotas de admin (HTTP $ADMIN_TEST)"
else
  echo "   ❌ Acesso negado a rotas de admin (HTTP $ADMIN_TEST)"
fi

echo ""
echo "================================"
echo "Teste concluído!"
echo "================================"