#!/bin/bash

echo "🔐 Fazendo login como admin..."

# Login e capturar cookies
COOKIE_JAR="/tmp/cookies.txt"

# Fazer login
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST http://localhost:3000/api/auth/unified-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ruidcar.com","password":"admin123","intent":"admin"}')

echo "Login response: $LOGIN_RESPONSE"
echo ""

# Extrair o token JWT
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

# Verificar se o login foi bem-sucedido
if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo "✅ Login bem-sucedido!"
  echo "📝 Token obtido: ${TOKEN:0:50}..."
  echo ""

  echo "📋 Buscando lista de usuários com cookies..."
  # Fazer requisição autenticada com cookies
  USERS_RESPONSE=$(curl -s -b "$COOKIE_JAR" http://localhost:3000/api/admin/users)
  echo "Response com cookies: $USERS_RESPONSE"
  echo ""

  echo "📋 Buscando lista de usuários com Authorization header..."
  # Fazer requisição autenticada com Authorization header
  USERS_RESPONSE2=$(curl -s -X GET http://localhost:3000/api/admin/users \
    -H "Authorization: Bearer $TOKEN")

  echo "Response com Authorization: "
  echo "$USERS_RESPONSE2" | jq . 2>/dev/null || echo "$USERS_RESPONSE2"

  echo ""
  echo "🍪 Conteúdo dos cookies:"
  cat "$COOKIE_JAR" 2>/dev/null || echo "Sem cookies"

else
  echo "❌ Falha no login!"
  echo "$LOGIN_RESPONSE"
fi

# Limpar cookies
rm -f "$COOKIE_JAR"