# RuidCar - Plataforma de Redução de Ruído Automotivo

Sistema completo de vendas de equipamentos de redução de ruído automotivo e gerenciamento de oficinas.

## 🚀 Quick Start

```bash
# Desenvolvimento
npm run dev                    # Iniciar servidor de desenvolvimento

# Produção
npm run build                  # Build para produção
npm run start                  # Iniciar servidor de produção

# Verificações
npm run check                  # Verificação TypeScript
npm run check:layouts          # Verificar layouts obrigatórios
```

## 📁 Estrutura do Projeto

```
├── client/                    # Frontend React + TypeScript
├── server/                    # Backend Express + TypeScript
├── shared/                    # Código compartilhado (schemas, types)
├── docs/                      # Documentação organizada
├── tests/                     # Testes organizados por categoria
├── scripts/                   # Scripts de automação
├── migrations/                # Migrações do banco de dados
└── public/                    # Assets públicos
```

## 📚 Documentação

### 🔧 Configuração e Deployment
- [CLAUDE.md](./CLAUDE.md) - Instruções para Claude Code
- [ESTRUTURA.md](./ESTRUTURA.md) - Análise da estrutura do projeto
- [Deployment](./docs/deployment/) - Guias de deployment

### ⚡ Funcionalidades
- [Agendamentos](./docs/features/AGENDAMENTOS.md) - Sistema de agendamentos
- [Formulários](./docs/features/FORM.md) - Sistema de formulários
- [Oficinas](./docs/features/OFICINAS1.md) - Gestão de oficinas

### 🔧 Backend
- [API Diagnóstico](./docs/backend/API_DIAGNOSTIC.md) - API de diagnóstico
- [Updates Backend](./docs/backend/BACKEND-UPDATES.md) - Atualizações do backend
- [Automação](./docs/backend/AUTOMACAO.md) - Sistemas de automação
- [WhatsApp](./docs/backend/WHATSAPP_SPRINT1_COMPLETO.md) - Integração WhatsApp
- [IA](./docs/backend/INTELIGENCIARTIFICIAL.md) - Integração com IA

### 🎨 Frontend
- [Mapa Mobile](./docs/frontend/MAPAMOBILE.md) - Implementação do mapa mobile
- [Otimização](./docs/frontend/OTIMIZACAO.md) - Otimizações de performance

### 🚨 Troubleshooting
- [Erros](./docs/troubleshooting/ERROS.md) - Soluções para erros comuns
- [Lógica](./docs/troubleshooting/LOGICA.md) - Análise de problemas de lógica
- [Login Chrome](./docs/troubleshooting/SOLUCAO_CHROME_LOGIN.md) - Soluções para login no Chrome

## 🧪 Testes

```bash
# Testes por categoria
tests/api/                     # Testes de API
tests/auth/                    # Testes de autenticação
tests/whatsapp/                # Testes do WhatsApp
tests/ai/                      # Testes de IA

# Scripts de análise
scripts/analysis/              # Scripts de análise de dados
scripts/maintenance/           # Scripts de manutenção
```

## 🗄️ Banco de Dados

```bash
npm run db:push                # Aplicar schema ao banco
npm run db:migrate             # Executar migrações
```

## 🛠️ Oficinas

```bash
npm run list:workshops         # Listar todas as oficinas
npm run activate:workshop      # Ativar uma oficina
npm run create:test-workshop   # Criar oficina de teste
```

## 📱 WhatsApp

```bash
npm run whatsapp:migrate       # Migração do sistema WhatsApp
npm run whatsapp:test          # Testar conexão Z-API
```

## 🤖 IA

Sistema integrado com Google Gemini AI para:
- Análise inteligente de leads
- Processamento de mensagens WhatsApp
- Geolocalização inteligente

## 🔐 Autenticação

Sistema multi-role com suporte a:
- **ADMIN** - Administradores do sistema
- **OFICINA_OWNER** - Proprietários de oficinas
- **CLIENTE** - Clientes finais

## 🏗️ Arquitetura

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express + TypeScript + Drizzle ORM
- **Database:** PostgreSQL (Neon)
- **UI:** Radix UI + shadcn/ui
- **Maps:** React Leaflet
- **Real-time:** Socket.io
- **WhatsApp:** Z-API
- **AI:** Google Gemini

## 📄 Licença

MIT License