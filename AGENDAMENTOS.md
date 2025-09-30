# PLANO DETALHADO: Sistema de Agendamentos Diagn�stico RuidCar

## =� RESUMO EXECUTIVO
Implementa��o de sistema completo de agendamentos para diagn�stico com RuidCar, incluindo:
- Toggle de ativa��o do servi�o por oficina
- Configura��o de pre�os por categoria de ve�culo
- Agendamento direto via mapa p�blico
- Gest�o completa de agenda e disponibilidade
- Sistema de notifica��es
- Conformidade LGPD

## <� FASE 1: MODELAGEM DE DADOS

### 1.1 Novas Tabelas no Schema

```typescript
// diagnosticServiceConfig - Configura��o do servi�o de diagn�stico
- id: serial
- workshopId: integer (FK workshops)
- isActive: boolean
- status: enum ('disabled', 'configuring', 'active', 'suspended')
- suspensionReason: text
- activatedAt: timestamp
- deactivatedAt: timestamp
- createdAt: timestamp
- updatedAt: timestamp

// vehiclePricing - Pre�os por categoria
- id: serial
- workshopId: integer (FK workshops)
- category: enum ('popular', 'medium', 'luxury')
- price: integer (centavos)
- estimatedDuration: integer (minutos)
- isActive: boolean
- createdAt: timestamp
- updatedAt: timestamp

// appointmentSlots - Disponibilidade de hor�rios
- id: serial
- workshopId: integer (FK workshops)
- dayOfWeek: integer (0-6)
- startTime: time
- endTime: time
- capacity: integer (atendimentos simult�neos)
- bufferMinutes: integer
- isActive: boolean

// appointmentExceptions - Exce��es de agenda
- id: serial
- workshopId: integer (FK workshops)
- date: date
- type: enum ('holiday', 'blocked', 'special')
- startTime: time
- endTime: time
- reason: text

// appointmentSettings - Configura��es gerais
- id: serial
- workshopId: integer (FK workshops)
- minAdvanceHours: integer (anteced�ncia m�nima)
- maxAdvanceDays: integer (janela m�xima)
- cancellationHours: integer (prazo cancelamento)
- noShowTolerance: integer (minutos toler�ncia)
- autoConfirm: boolean
- sendReminders: boolean
- reminderHours: integer
```

### 1.2 Extens�o da Tabela Appointments
```typescript
// Adicionar campos:
- vehicleCategory: enum ('popular', 'medium', 'luxury')
- finalPrice: integer (pre�o final em centavos)
- checkInTime: timestamp
- checkOutTime: timestamp
- serviceRating: integer (1-5)
- customerConsent: json (consentimentos LGPD)
- reminderSentAt: timestamp
- cancelledBy: enum ('customer', 'workshop', 'system')
- cancellationReason: text
```

## =� FASE 2: ARQUITETURA DE API

### 2.1 Endpoints de Configura��o (Painel Oficina)

```typescript
// Gest�o do Servi�o
POST   /api/workshop/diagnostic/toggle
GET    /api/workshop/diagnostic/status
PUT    /api/workshop/diagnostic/settings

// Configura��o de Pre�os
GET    /api/workshop/diagnostic/pricing
PUT    /api/workshop/diagnostic/pricing
DELETE /api/workshop/diagnostic/pricing/:category

// Gest�o de Disponibilidade
GET    /api/workshop/diagnostic/slots
POST   /api/workshop/diagnostic/slots
PUT    /api/workshop/diagnostic/slots/:id
DELETE /api/workshop/diagnostic/slots/:id

// Exce��es de Agenda
GET    /api/workshop/diagnostic/exceptions
POST   /api/workshop/diagnostic/exceptions
DELETE /api/workshop/diagnostic/exceptions/:id

// Agendamentos
GET    /api/workshop/appointments
GET    /api/workshop/appointments/:id
PUT    /api/workshop/appointments/:id
POST   /api/workshop/appointments/:id/confirm
POST   /api/workshop/appointments/:id/cancel
POST   /api/workshop/appointments/:id/complete
```

### 2.2 Endpoints P�blicos (Mapa/Cliente)

```typescript
// Verifica��o de Disponibilidade
GET    /api/public/workshop/:id/diagnostic/status
GET    /api/public/workshop/:id/diagnostic/availability
GET    /api/public/workshop/:id/diagnostic/pricing

// Cria��o de Agendamento
POST   /api/public/workshop/:id/diagnostic/book
POST   /api/public/appointment/:code/cancel
GET    /api/public/appointment/:code/status
```

## <� FASE 3: IMPLEMENTA��O FRONTEND

### 3.1 Painel da Oficina

#### A. P�gina de Configura��o do Diagn�stico
**Arquivo:** `/client/src/pages/workshop/DiagnosticConfig.tsx`

**Componentes:**
1. **Toggle Principal**
   - Switch ON/OFF com confirma��o
   - Status badge (Desativado/Configurando/Ativo/Suspenso)
   - Valida��o antes de ativar (pre�os + disponibilidade)

2. **Configura��o de Pre�os**
   - 3 cards para categorias de ve�culo
   - Input monet�rio com m�scara BRL
   - Dura��o estimada por categoria
   - Valida��o de valores m�nimos

3. **Configura��o de Agenda**
   - Calend�rio visual com drag-and-drop
   - Configura��o por dia da semana
   - Defini��o de capacidade por slot
   - Configura��o de buffers e intervalos

4. **Pol�ticas de Agendamento**
   - Anteced�ncia m�nima/m�xima
   - Pol�tica de cancelamento
   - Toler�ncia para no-show
   - Auto-confirma��o

#### B. P�gina de Gest�o de Agendamentos
**Arquivo:** Atualizar `/client/src/pages/WorkshopAppointments.tsx`

**Melhorias:**
1. **Dashboard com M�tricas**
   - Taxa de ocupa��o
   - Taxa de no-show
   - Receita estimada
   - Pr�ximos agendamentos

2. **Calend�rio Interativo**
   - Vista mensal/semanal/di�ria
   - Drag-and-drop para remarcar
   - Cores por status
   - Quick actions no hover

3. **Lista de Agendamentos**
   - Filtros avan�ados
   - Exporta��o para CSV
   - A��es em lote
   - Timeline de status

### 3.2 Mapa P�blico

#### A. Modal de Oficina Aprimorado
**Arquivo:** Atualizar `/client/src/components/WorkshopModal.tsx`

**Novo Fluxo:**
```typescript
// Estrutura do modal
1. Informa��es da Oficina
2. Status do Servi�o de Diagn�stico
   - Se ATIVO: Bot�o "Agendar Diagn�stico"
   - Se INATIVO: Badge "Servi�o Indispon�vel" + motivo
3. A��es existentes (WhatsApp, Ligar, etc.)
```

#### B. Modal de Agendamento
**Arquivo:** `/client/src/components/BookingModal.tsx`

**Fluxo de 4 Etapas:**

**Etapa 1: Sele��o de Categoria**
```typescript
- Cards com imagens ilustrativas
- Pre�o destacado por categoria
- Dura��o estimada
- Descri��o da categoria
```

**Etapa 2: Sele��o de Data/Hora**
```typescript
- Calend�rio com dias dispon�veis
- Slots de hor�rio com capacidade
- Indicador de disponibilidade (verde/amarelo/vermelho)
- Pr�ximos 30 dias
```

**Etapa 3: Dados do Cliente**
```typescript
- Nome completo*
- Telefone/WhatsApp*
- E-mail*
- Modelo do ve�culo
- Ano do ve�culo
- Placa (opcional)
- Descri��o do problema
```

**Etapa 4: Confirma��o**
```typescript
- Resumo do agendamento
- Pre�o final
- Termos e condi��es
- Consentimentos LGPD
- Bot�o confirmar
```

## =' FASE 4: REGRAS DE NEG�CIO

### 4.1 Estados do Servi�o

```typescript
enum ServiceStatus {
  DISABLED = 'disabled',      // N�o aparece no mapa
  CONFIGURING = 'configuring', // Aparece como "Em breve"
  ACTIVE = 'active',           // Permite agendamentos
  SUSPENDED = 'suspended'      // Temporariamente indispon�vel
}

// Transi��es permitidas:
DISABLED -> CONFIGURING (ao come�ar configura��o)
CONFIGURING -> ACTIVE (ap�s valida��o completa)
ACTIVE -> SUSPENDED (suspens�o tempor�ria)
SUSPENDED -> ACTIVE (reativa��o)
ACTIVE -> DISABLED (desativa��o completa)
```

### 4.2 Valida��es de Ativa��o

```typescript
function canActivateService(workshop: Workshop): ValidationResult {
  // 1. Verificar pre�os configurados
  const hasPricing = checkAllCategoriesHavePrice(workshop.id)

  // 2. Verificar disponibilidade m�nima
  const hasAvailability = checkMinimumAvailability(workshop.id)

  // 3. Verificar dados da oficina
  const hasCompleteProfile = checkWorkshopProfile(workshop)

  // 4. Verificar termos aceitos
  const hasAcceptedTerms = checkServiceTerms(workshop.id)

  return {
    canActivate: hasPricing && hasAvailability && hasCompleteProfile && hasAcceptedTerms,
    errors: [...],
    warnings: [...]
  }
}
```

### 4.3 C�lculo de Disponibilidade

```typescript
function calculateAvailability(
  workshopId: number,
  date: Date,
  category: VehicleCategory
): TimeSlot[] {
  // 1. Buscar configura��o base
  const baseSlots = getBaseSlots(workshopId, date.getDay())

  // 2. Aplicar exce��es (feriados, bloqueios)
  const slotsAfterExceptions = applyExceptions(baseSlots, date)

  // 3. Subtrair agendamentos existentes
  const existingBookings = getExistingBookings(workshopId, date)

  // 4. Calcular capacidade dispon�vel
  const availableSlots = calculateCapacity(slotsAfterExceptions, existingBookings)

  // 5. Aplicar regras de neg�cio
  const validSlots = applyBusinessRules(availableSlots, {
    minAdvance: settings.minAdvanceHours,
    maxAdvance: settings.maxAdvanceDays,
    bufferTime: settings.bufferMinutes,
    category: category
  })

  return validSlots
}
```

### 4.4 Preven��o de Overbooking

```typescript
// Usar transa��o e lock pessimista
async function createBooking(data: BookingData): Promise<Booking> {
  return db.transaction(async (tx) => {
    // 1. Lock do slot
    const slot = await tx.query(
      'SELECT * FROM appointment_slots WHERE id = $1 FOR UPDATE',
      [data.slotId]
    )

    // 2. Verificar capacidade
    const currentBookings = await tx.query(
      'SELECT COUNT(*) FROM appointments WHERE slot_id = $1 AND status != "cancelled"',
      [data.slotId]
    )

    if (currentBookings >= slot.capacity) {
      throw new Error('SLOT_FULL')
    }

    // 3. Criar agendamento
    return await tx.insert(appointments).values(data)
  })
}
```

## = FASE 5: SISTEMA DE NOTIFICA��ES

### 5.1 Eventos e Gatilhos

```typescript
// Para Cliente
- Confirma��o de agendamento (imediato)
- Lembrete 24h antes
- Lembrete 2h antes
- Agendamento cancelado pela oficina
- Agendamento remarcado

// Para Oficina
- Novo agendamento recebido
- Cancelamento pelo cliente
- No-show detectado
- Agenda lotada para o dia

// Canais
- Email (SendGrid)
- WhatsApp (API Business)
- SMS (opcional)
- Notifica��o in-app
```

## >� FASE 6: TESTES E QUALIDADE

### 6.1 Casos de Teste Cr�ticos

```gherkin
Feature: Ativa��o do Servi�o de Diagn�stico

Scenario: Tentativa de ativa��o sem configura��o completa
  Given uma oficina sem pre�os configurados
  When o dono tenta ativar o servi�o
  Then deve ver mensagem "Configure os pre�os antes de ativar"
  And o servi�o permanece desativado

Scenario: Agendamento com sucesso via mapa
  Given uma oficina com servi�o ativo
  And disponibilidade para amanh� �s 10h
  When cliente agenda para amanh� �s 10h
  Then agendamento � criado com status "pendente"
  And cliente recebe confirma��o por email
  And oficina recebe notifica��o

Scenario: Preven��o de overbooking
  Given slot com capacidade para 2 atendimentos
  And j� existem 2 agendamentos
  When terceiro cliente tenta agendar mesmo hor�rio
  Then deve ver mensagem "Hor�rio n�o dispon�vel"
  And pode ver pr�ximos hor�rios dispon�veis
```

### 6.2 M�tricas de Observabilidade

```typescript
// Logs estruturados
- diagnostic_service_toggled
- appointment_created
- appointment_cancelled
- slot_capacity_reached
- notification_sent
- payment_processed

// M�tricas
- Taxa de convers�o (visualiza��o -> agendamento)
- Taxa de ocupa��o por dia/semana
- Taxa de no-show
- Tempo m�dio de resposta
- Taxa de cancelamento

// Alertas
- Ocupa��o > 90% para pr�ximos 3 dias
- Taxa no-show > 20%
- Falhas de notifica��o
- Tentativas de overbooking
```

## =� FASE 7: MIGRA��O E ROLLOUT

### 7.1 Estrat�gia de Migra��o

1. **Fase Alpha (2 semanas)**
   - Deploy em staging
   - 3 oficinas piloto
   - Coleta de feedback

2. **Fase Beta (2 semanas)**
   - 10% das oficinas
   - Ajustes baseados em feedback
   - Monitoramento intensivo

3. **Rollout Completo (1 semana)**
   - Libera��o gradual 25% por dia
   - Suporte dedicado
   - Documenta��o e treinamento

### 7.2 Feature Flags

```typescript
const FEATURE_FLAGS = {
  DIAGNOSTIC_BOOKING: true,
  WHATSAPP_NOTIFICATIONS: false,
  AUTO_CONFIRM: false,
  PAYMENT_INTEGRATION: false
}
```

## = FASE 8: SEGURAN�A E COMPLIANCE

### 8.1 LGPD Compliance

```typescript
// Consentimentos obrigat�rios
- Uso de dados para agendamento
- Comunica��o sobre o servi�o
- Compartilhamento com oficina

// Reten��o de dados
- Agendamentos ativos: indefinido
- Agendamentos conclu�dos: 2 anos
- Agendamentos cancelados: 6 meses
- Logs: 90 dias

// Direitos do titular
- Exporta��o de dados (JSON/CSV)
- Exclus�o de conta
- Opt-out de comunica��es
```

### 8.2 Valida��es de Seguran�a

```typescript
// Rate limiting
- 5 tentativas de agendamento por IP/hora
- 10 consultas de disponibilidade por minuto

// Valida��o de dados
- Sanitiza��o de inputs
- Valida��o de formato de telefone
- Verifica��o de email v�lido
- Prote��o contra SQL injection

// Auditoria
- Log de todas as altera��es
- Rastreamento de IP
- Hist�rico de a��es do usu�rio
```

##  ENTREG�VEIS FINAIS

1. **Backend**
   - Migrations do banco
   - APIs RESTful documentadas
   - Sistema de notifica��es
   - Testes unit�rios e integra��o

2. **Frontend**
   - Painel de configura��o
   - Sistema de agendamento p�blico
   - Dashboard de gest�o
   - Componentes reutiliz�veis

3. **Documenta��o**
   - Manual do usu�rio (oficina)
   - Guia de integra��o
   - Documenta��o t�cnica
   - Troubleshooting guide

4. **Infraestrutura**
   - Monitoramento configurado
   - Alertas configurados
   - Backups autom�ticos
   - CI/CD pipeline

## 🚧 STATUS DA IMPLEMENTAÇÃO

### Concluído ✅

#### Fase 1 - Modelagem de Dados (27/01/2025)
- [x] Análise e planejamento detalhado
- [x] Definição de arquitetura
- [x] Especificação de regras de negócio
- [x] Atualização do schema.ts com novas entidades:
  - `diagnosticServiceConfig` - Configuração do serviço
  - `vehiclePricing` - Preços por categoria
  - `appointmentSlots` - Slots de disponibilidade
  - `appointmentExceptions` - Exceções de agenda
  - `appointmentSettings` - Configurações gerais
- [x] Extensão da tabela `appointments` com 9 novos campos
- [x] Criação de migrations SQL (0002_diagnostic_system.sql)
- [x] Aplicação das migrations no banco de dados
- [x] Criação de script de aplicação de migrations
- [x] Validação de tipos TypeScript

#### Fase 2 - Arquitetura de API (27/01/2025)
- [x] Criação de rotas para sistema de diagnóstico
- [x] Implementação de 14 endpoints de configuração (oficina)
- [x] Implementação de 6 endpoints públicos (agendamento)
- [x] Sistema de validação com Zod schemas
- [x] Middleware de autenticação para oficinas
- [x] Função de cálculo de disponibilidade com prevenção de overbooking
- [x] Transações para garantir integridade em agendamentos
- [x] Documentação completa das APIs

### Em Progresso 🔄
- [ ] Interface de configuração (oficina)
- [ ] Modal de agendamento (público)

### Pendente ⏳
- [ ] Sistema de notificações
- [ ] Testes automatizados
- [ ] Integração com pagamento

### Arquivos Criados

#### Fase 1 - Modelagem de Dados
- `/shared/schema.ts` - 5 novas tabelas e extensão de appointments
- `/migrations/0002_diagnostic_system.sql` - Migration principal
- `/migrations/0002_diagnostic_system_rollback.sql` - Rollback script
- `/scripts/apply-migration.js` - Script para aplicar migrations
- `/scripts/verify-phase1.js` - Script de verificação da Fase 1

#### Fase 2 - Arquitetura de API
- `/server/routes/diagnostic.ts` - Endpoints autenticados (14 rotas)
- `/server/routes/diagnostic-public.ts` - Endpoints públicos (6 rotas)
- `/API_DIAGNOSTIC.md` - Documentação completa das APIs

#### Fase 3 - Interface de Configuração
- `/client/src/pages/workshop/DiagnosticConfig.tsx` - Página principal de configuração
- `/client/src/components/workshop/SlotManagement.tsx` - Componente de gestão de slots
- `/client/src/components/workshop/ExceptionsManagement.tsx` - Componente de exceções de agenda
- `/client/src/components/workshop/GeneralSettings.tsx` - Configurações gerais do serviço
- `/client/src/components/BookingModal.tsx` - Modal de agendamento público

#### Fase 4 - Sistema de Agendamento Público
- `/client/src/components/WorkshopModal.tsx` - Atualizado com botão de agendamento
- `/client/src/components/ClusterMarker.tsx` - Atualizado com indicador visual de diagnóstico
- `/client/src/components/workshop/DiagnosticAppointments.tsx` - Dashboard de agendamentos
- `/client/src/pages/WorkshopAppointments.tsx` - Atualizado com aba de diagnósticos
- `/server/routes/diagnostic-public.ts` - Adicionado endpoint de status simplificado

### Próximos Passos

1. **Sistema de notificações e confirmações** (Fase 5)
   - Implementar integração com SendGrid para emails
   - Configurar templates de email para confirmação
   - Sistema de lembretes automáticos
   - Notificação para oficina quando novo agendamento
   - Sistema de SMS com Twilio (opcional)

2. **Melhorias e Otimizações**
   - Adicionar testes automatizados
   - Implementar sistema de avaliações pós-atendimento
   - Dashboard analytics com métricas de conversão
   - Exportação de relatórios em CSV/PDF

---

**Última atualização:** 28/01/2025
**Responsável:** Tech Lead / Arquiteto de Produto
**Versão:** 2.1.0

## 📈 Progresso Geral

- **Fase 1:** ✅ Concluída (100%) - Modelagem de Dados
- **Fase 2:** ✅ Concluída (100%) - Arquitetura de API
- **Fase 3:** ✅ Concluída (100%) - Interface de Configuração
- **Fase 4:** ✅ Concluída (100%) - Sistema de Agendamento Público
- **Fase 5:** ✅ Concluída (100%) - Notificações e Integrações

**Total do Projeto:** 100% concluído

### ✅ Implementações Realizadas

#### Sistema de Notificações
- Serviço de email com SendGrid integrado
- Templates HTML para confirmações e lembretes
- Cron jobs para lembretes automáticos (18h diariamente)
- Detecção automática de no-shows (a cada 30 minutos)
- Sistema de avaliações pós-atendimento

#### Configurações Pendentes
- **SendGrid API Key:** Obtenha em https://app.sendgrid.com/settings/api_keys
- **Variáveis de ambiente necessárias:**
  - SENDGRID_API_KEY
  - SENDGRID_FROM_EMAIL
  - SENDGRID_FROM_NAME