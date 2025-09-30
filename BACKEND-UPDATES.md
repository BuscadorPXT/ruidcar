# 🔄 ATUALIZAÇÕES DO BACKEND - SISTEMA UNIFICADO

## 📅 Data: 27/09/2025

## ✅ ENDPOINTS IMPLEMENTADOS

### 1. AUTENTICAÇÃO UNIFICADA
**Arquivo:** `/server/routes/auth.ts`

#### `/api/auth/unified-login` (POST)
- Login unificado para todos os tipos de usuário
- Suporta intent: admin, oficina, cliente
- Resposta padronizada com roles e permissões
- Token JWT em cookie HTTP-only seguro

**Request:**
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "intent": "admin|oficina|cliente",
  "selectedRole": "ADMIN|OFICINA_OWNER|CLIENTE" // opcional
}
```

**Response:**
```json
{
  "message": "Login realizado com sucesso",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nome do Usuário",
    "phone": "+5511999999999"
  },
  "roles": [{
    "roleId": 1,
    "roleName": "ADMIN",
    "organizationId": null,
    "permissions": ["admin:all"]
  }],
  "organizations": [],
  "primaryRole": "ADMIN",
  "defaultRedirect": "/admin",
  "multipleRoles": false
}
```

#### `/api/auth/me` (GET)
- Retorna dados do usuário autenticado
- Requer autenticação (cookie ou header)

#### `/api/auth/logout` (POST)
- Limpa cookie de autenticação
- Invalida sessão

#### `/api/auth/switch-role` (POST)
- Troca role ativa do usuário
- Gera novo token com role selecionada

**Request:**
```json
{
  "roleName": "OFICINA_OWNER",
  "organizationId": 1
}
```

### 2. SISTEMA DE NOTIFICAÇÕES
**Arquivo:** `/server/routes/notifications.ts`

#### `/api/notifications` (GET)
- Lista notificações do usuário autenticado
- Auto-gera notificações para admin (oficinas pendentes)
- Auto-gera notificações para oficina (aprovação/rejeição)

#### `/api/notifications/:id/read` (POST)
- Marca notificação específica como lida

#### `/api/notifications/read-all` (POST)
- Marca todas as notificações como lidas

#### `/api/notifications/:id` (DELETE)
- Remove notificação específica

#### `/api/notifications/create` (POST) - Admin Only
- Cria notificação manual

### 3. STATUS DE OFICINA
**Arquivo:** `/server/routes/workshopStatus.ts`

#### `/api/workshops/check-status` (POST)
- Verifica status de aprovação da oficina
- Busca por código ou email

**Request:**
```json
{
  "identifier": "RCW-1234 ou email@example.com"
}
```

**Response:**
```json
{
  "found": true,
  "workshop": {
    "id": 1,
    "name": "Oficina Central",
    "code": "RCW-1234",
    "status": "pending|approved|rejected",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "rejectionReason": "Motivo da rejeição",
    "adminEmail": "admin@oficina.com"
  }
}
```

#### `/api/workshops/search-by-code/:code` (GET)
- Busca oficina por código único

#### `/api/admin/workshops/pending` (GET)
- Lista oficinas pendentes de aprovação
- Inclui dias desde o cadastro

#### `/api/admin/workshops/:id/approve` (POST)
- Aprova oficina específica
- Atualiza status para ativo

#### `/api/admin/workshops/:id/reject` (POST)
- Rejeita oficina específica
- Registra motivo da rejeição

**Request:**
```json
{
  "reason": "Documentação incompleta"
}
```

## 🔐 MIDDLEWARE DE AUTENTICAÇÃO

### JWT Implementation
- Token seguro com expiração de 7 dias
- Armazenado em cookie HTTP-only
- Suporta múltiplas roles por usuário
- Verificação de permissões granulares

### Funções Helper
- `authenticateUser`: Middleware principal de autenticação
- `requireRole(role)`: Requer role específica
- `requirePermission(permission)`: Requer permissão específica
- `requireOrganization`: Verifica acesso à organização
- `hasRole(user, role)`: Verifica se usuário tem role
- `hasPermission(user, permission)`: Verifica se usuário tem permissão

## 📊 ALTERAÇÕES NO BANCO DE DADOS

### Tabela `workshops`
**Campos adicionados:**
- `rejectedAt` (timestamp) - Data da rejeição
- `rejectionReason` (text) - Motivo da rejeição

## 🔧 CONFIGURAÇÃO NECESSÁRIA

### Variáveis de Ambiente
```env
JWT_SECRET=sua-chave-secreta-segura
NODE_ENV=development|production
```

### Migrations Necessárias
Execute as migrations para adicionar os novos campos:
```sql
ALTER TABLE workshops
ADD COLUMN rejected_at TIMESTAMP,
ADD COLUMN rejection_reason TEXT;
```

## 📦 ESTRUTURA DE ARQUIVOS

```
server/
├── routes/
│   ├── index.ts          # Agregador de rotas
│   ├── auth.ts           # Rotas de autenticação unificada
│   ├── notifications.ts  # Sistema de notificações
│   └── workshopStatus.ts # Verificação de status
├── middleware/
│   └── auth.ts          # Middleware JWT existente (mantido)
└── index.ts             # Servidor principal (atualizado)
```

## 🚀 COMO USAR

### 1. Instalar dependências (se necessário)
```bash
npm install jsonwebtoken bcryptjs cookie-parser
```

### 2. Executar migrations
```bash
npm run db:migrate
```

### 3. Reiniciar o servidor
```bash
npm run dev
```

## ✅ CHECKLIST DE INTEGRAÇÃO

- [x] Endpoints de autenticação criados
- [x] Sistema de notificações implementado
- [x] Verificação de status de oficina
- [x] Middleware JWT configurado
- [x] Rotas integradas ao servidor
- [x] Schema do banco atualizado
- [ ] Migrations executadas
- [ ] Testes de integração realizados
- [ ] Deploy em produção

## 📝 NOTAS IMPORTANTES

1. **Segurança**: Todos os tokens são armazenados em cookies HTTP-only
2. **Compatibilidade**: Mantém compatibilidade com endpoints existentes
3. **Performance**: Notificações usam polling (pode migrar para WebSocket)
4. **Escalabilidade**: Notificações em memória (migrar para banco em produção)

## 🔍 PRÓXIMOS PASSOS

1. Implementar persistência de notificações no banco
2. Adicionar WebSocket para notificações real-time
3. Implementar sistema de email automático
4. Adicionar rate limiting nos endpoints
5. Implementar refresh token
6. Adicionar logs estruturados
7. Criar testes automatizados

---

*Documentação criada em 27/09/2025*
*Sistema de Backend Unificado RuidCar v2.0*