# 📚 TREINAMENTO WHATSAPP AUTOMATION - RUIDCAR

## 🎯 OBJETIVO DO TREINAMENTO

Este documento ensina como usar o sistema de automação WhatsApp integrado ao painel administrativo da RuidCar para enviar mensagens personalizadas para leads de forma eficiente e compliance.

---

## 📖 ÍNDICE

1. [Acesso ao Sistema](#acesso-ao-sistema)
2. [Visão Geral do Dashboard](#visão-geral-do-dashboard)
3. [Gerenciando Templates](#gerenciando-templates)
4. [Enviando Mensagens](#enviando-mensagens)
5. [Monitoramento e Métricas](#monitoramento-e-métricas)
6. [Compliance e Boas Práticas](#compliance-e-boas-práticas)
7. [Troubleshooting](#troubleshooting)

---

## 🔐 ACESSO AO SISTEMA

### Pré-requisitos
- Acesso de administrador ao painel RuidCar
- Usuário com permissões para WhatsApp
- WhatsApp Business conectado via Z-API

### Como Acessar
1. Faça login no painel administrativo
2. No menu lateral, clique em **"WhatsApp Manager"**
3. Aguarde o carregamento do dashboard

---

## 🖥️ VISÃO GERAL DO DASHBOARD

### Componentes Principais

#### 1. **Status da Instância Z-API**
- **🟢 Verde**: Conectado e funcionando
- **🟡 Amarelo**: Conectado mas com avisos
- **🔴 Vermelho**: Desconectado ou com erro

```
Status: Conectado ✅
Telefone: +55 11 9xxxx-xxxx
Última verificação: há 2 minutos
```

#### 2. **Métricas do Dia**
- Mensagens enviadas
- Taxa de entrega
- Taxa de leitura
- Mensagens com falha

#### 3. **Ações Rápidas**
- Testar conexão
- Enviar mensagem teste
- Ver histórico completo

---

## 📝 GERENCIANDO TEMPLATES

### O que são Templates?

Templates são modelos de mensagem pré-definidos com variáveis que são substituídas automaticamente com dados do lead.

### Templates Disponíveis

#### **Templates Genéricos** (Todos os tipos de negócio)
1. **Primeiro Contato** - Para leads novos
2. **Follow-up Qualificado** - Para leads interessados
3. **Proposta Enviada** - Após envio de proposta
4. **Reativação de Lead** - Para leads frios
5. **Agendamento de Reunião** - Para agendar calls
6. **Follow-up Pós Reunião** - Após reuniões

#### **Templates Específicos**
7. **Urgência Montadora** - Específico para montadoras
8. **Específico Auto Center** - Para auto centers

### Variáveis Disponíveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{nome}` | Nome do lead | "João Silva" |
| `{empresa}` | Nome da empresa | "AutoTech Ltda" |
| `{cidade}` | Cidade do lead | "São Paulo" |
| `{businessType}` | Tipo de negócio | "Montadora" |

### Como Criar um Novo Template

1. Acesse **Templates** no menu WhatsApp
2. Clique em **"+ Novo Template"**
3. Preencha os campos:
   - **Nome**: Nome identificador
   - **Conteúdo**: Texto com variáveis
   - **Variáveis**: Lista das variáveis usadas
   - **Tipo de Negócio**: Específico ou todos
   - **Status do Lead**: Quando usar este template

#### Exemplo de Template
```
Nome: Follow-up Personalizado
Conteúdo:
Oi {nome}!

Vi que {empresa} está em {cidade} e tenho uma proposta especial para {businessType}.

Que tal conversarmos hoje?

Abraços,
Equipe RuidCar
```

---

## 📤 ENVIANDO MENSAGENS

### Método 1: Envio Individual

1. Acesse **"Gerenciamento de Leads"**
2. Localize o lead desejado
3. Clique no ícone **WhatsApp** no card do lead
4. Selecione o template desejado
5. Revise a pré-visualização
6. Clique em **"Enviar Mensagem"**

### Método 2: Envio em Lote

1. Acesse **"Gerenciamento de Leads"**
2. Use os filtros para selecionar leads:
   - Status do lead
   - Tipo de negócio
   - Cidade
   - Data de criação
3. Marque os leads desejados
4. Clique em **"Ações em Lote"**
5. Selecione **"Enviar WhatsApp"**
6. Escolha o template apropriado
7. Revise e confirme o envio

### Pré-visualização de Mensagem

Antes do envio, o sistema mostra como ficará a mensagem final:

```
Para: João Silva - AutoTech Ltda
Template: Primeiro Contato
Status: Novo Lead

Mensagem Final:
---
Olá João Silva! 👋

Vi que você se interessou pelos nossos equipamentos de isolamento acústico para AutoTech Ltda.

Como especialistas no segmento automotivo em São Paulo, temos soluções específicas para Montadora.

Gostaria de agendar uma conversa de 15 minutos para entender melhor suas necessidades?

Atenciosamente,
Equipe RuidCar

_Digite SAIR para não receber mais mensagens._
---
```

### Validações Automáticas

O sistema verifica automaticamente:
- ✅ Número WhatsApp válido
- ✅ Lead não está na blacklist
- ✅ Compliance de horário (8h-18h, seg-sex)
- ✅ Intervalo mínimo entre mensagens (24h)
- ✅ Status da instância Z-API

---

## 📊 MONITORAMENTO E MÉTRICAS

### Dashboard de Métricas

#### **Métricas Hoje**
- **Enviadas**: 15 mensagens
- **Entregues**: 14 mensagens (93%)
- **Lidas**: 8 mensagens (57%)
- **Falharam**: 1 mensagem (7%)

#### **Métricas Semanais**
- Total de mensagens: 85
- Taxa de resposta: 12%
- Template mais usado: "Primeiro Contato"
- Melhor horário: 14h-16h

#### **Status dos Leads**
- Novos leads contatados: 12
- Leads reativados: 3
- Propostas enviadas: 5

### Histórico de Mensagens

Para ver o histórico de um lead específico:
1. Acesse o lead
2. Clique na aba **"Histórico WhatsApp"**
3. Visualize todas as mensagens enviadas e status

### Relatórios

#### Relatório Diário
- Resumo das atividades do dia
- Performance por template
- Leads que responderam

#### Relatório Semanal
- Tendências de engajamento
- ROI das campanhas
- Recomendações de otimização

---

## ⚖️ COMPLIANCE E BOAS PRÁTICAS

### Regras de Compliance

#### **Horários Permitidos**
- ⏰ Segunda a Sexta: 8h às 18h
- ❌ Fins de semana: Não enviar
- ❌ Feriados: Não enviar

#### **Frequência de Mensagens**
- 📅 Intervalo mínimo: 24 horas entre mensagens
- 📊 Máximo por lead: 3 mensagens por semana
- 🚫 Stop automático: Lead que responde "SAIR"

#### **Blacklist Automática**
Leads são automaticamente adicionados à blacklist se:
- Respondem "SAIR", "PARE", "REMOVER"
- Marcam como spam no WhatsApp
- Bloqueiam o número

### Boas Práticas

#### **Personalização**
- ✅ Use sempre o nome do lead
- ✅ Mencione a empresa
- ✅ Seja específico sobre o tipo de negócio
- ❌ Nunca envie mensagens genéricas

#### **Timing**
- 🕐 Melhor horário: 9h-11h e 14h-16h
- 📅 Terça a quinta: Melhores dias
- ⏰ Evite segunda de manhã e sexta à tarde

#### **Conteúdo**
- ✅ Mensagens concisas (máx. 160 caracteres)
- ✅ Call-to-action claro
- ✅ Sempre ofereça opt-out
- ❌ Evite muitos emojis
- ❌ Não use CAPS LOCK

### Exemplo de Sequência Recomendada

```
Dia 1: Primeiro Contato
↓ (aguardar 3 dias)
Dia 4: Follow-up se não respondeu
↓ (aguardar 1 semana)
Dia 11: Reativação final
```

---

## 🔧 TROUBLESHOOTING

### Problemas Comuns e Soluções

#### **Problema**: Mensagem não foi enviada
**Possíveis Causas**:
- WhatsApp desconectado
- Número inválido
- Lead na blacklist
- Fora do horário comercial

**Solução**:
1. Verificar status da instância
2. Validar número do lead
3. Conferir horário atual
4. Verificar blacklist

#### **Problema**: Taxa de entrega baixa
**Possíveis Causas**:
- Problemas na instância Z-API
- Números desatualizados
- Spam filtering

**Solução**:
1. Testar conexão Z-API
2. Atualizar base de leads
3. Revisar conteúdo das mensagens

#### **Problema**: Template não aparece
**Possíveis Causas**:
- Template inativo
- Restrição por tipo de negócio
- Restrição por status do lead

**Solução**:
1. Verificar se template está ativo
2. Conferir filtros de negócio
3. Validar status do lead

### Códigos de Status das Mensagens

| Status | Significado | Ação |
|--------|-------------|------|
| `pending` | Na fila para envio | Aguardar |
| `sent` | Enviada com sucesso | Monitorar entrega |
| `delivered` | Entregue ao destinatário | Aguardar leitura |
| `read` | Lida pelo destinatário | Aguardar resposta |
| `failed` | Falha no envio | Verificar erro |

### Contatos de Suporte

#### **Suporte Técnico**
- Email: suporte@ruidcar.com.br
- WhatsApp: (11) 9xxxx-xxxx
- Horário: Seg-Sex 8h às 18h

#### **Suporte Z-API**
- Email: suporte@z-api.io
- Documentação: docs.z-api.io
- Status: status.z-api.io

---

## 📈 OTIMIZAÇÃO E PERFORMANCE

### KPIs Importantes

#### **Taxa de Entrega** (Meta: >95%)
- Mede quantas mensagens chegaram ao destinatário
- Impacto: Problemas técnicos ou números inválidos

#### **Taxa de Leitura** (Meta: >60%)
- Mede quantas mensagens foram abertas
- Impacto: Qualidade do conteúdo e timing

#### **Taxa de Resposta** (Meta: >10%)
- Mede quantos leads responderam
- Impacto: Qualidade da mensagem e segmentação

#### **Taxa de Conversão** (Meta: >5%)
- Mede quantos leads viraram oportunidades
- Impacto: Qualidade dos leads e follow-up

### Dicas de Otimização

#### **Segmentação**
```
Auto Centers: Use linguagem informal, foque em ROI
Montadoras: Use tom profissional, destaque tecnologia
Oficinas: Foque em produtividade e ambiente
```

#### **A/B Testing**
- Teste diferentes templates
- Varie horários de envio
- Teste diferentes CTAs

#### **Análise de Dados**
- Acompanhe métricas semanalmente
- Identifique padrões de sucesso
- Ajuste estratégia baseada em dados

---

## 🎓 EXERCÍCIOS PRÁTICOS

### Exercício 1: Envio Individual
1. Localize um lead novo no sistema
2. Envie o template "Primeiro Contato"
3. Monitore o status da mensagem por 1 hora
4. Anote os resultados

### Exercício 2: Criação de Template
1. Crie um template específico para "Concessionárias"
2. Use as variáveis {nome}, {empresa}, {cidade}
3. Teste com um lead do tipo correto
4. Analise a taxa de resposta

### Exercício 3: Campanha em Lote
1. Filtre leads por status "qualified"
2. Selecione 5 leads
3. Envie template "Follow-up Qualificado"
4. Acompanhe métricas por 3 dias

### Exercício 4: Análise de Performance
1. Acesse relatório semanal
2. Identifique o template com melhor performance
3. Identifique o pior horário de envio
4. Proponha 3 melhorias

---

## 📚 RECURSOS ADICIONAIS

### Documentação Técnica
- [Deploy Guide](./WHATSAPP_DEPLOY.md)
- [Architecture Overview](../AUTOMACAO.md)
- [API Documentation](../server/routes/whatsapp.ts)

### Templates de Exemplo
- [Templates Padrão](../migrations/0016_whatsapp_default_templates.sql)
- [Melhores Práticas de Copy](./best-practices.md)

### Vídeo Tutoriais
- Setup Inicial (10 min)
- Envio de Mensagens (5 min)
- Análise de Métricas (8 min)
- Troubleshooting (12 min)

---

## ✅ CHECKLIST DE TREINAMENTO

### Básico ✅
- [ ] Acessar o dashboard WhatsApp
- [ ] Verificar status da instância Z-API
- [ ] Visualizar templates disponíveis
- [ ] Enviar mensagem individual
- [ ] Verificar histórico de mensagens

### Intermediário ✅
- [ ] Criar novo template
- [ ] Enviar mensagens em lote
- [ ] Filtrar leads adequadamente
- [ ] Interpretar métricas básicas
- [ ] Resolver problemas de envio

### Avançado ✅
- [ ] Otimizar templates baseado em dados
- [ ] Configurar campanhas automatizadas
- [ ] Analisar relatórios de performance
- [ ] Implementar A/B testing
- [ ] Treinar outros usuários

---

## 📞 CERTIFICAÇÃO

Após completar este treinamento, o usuário estará apto a:

1. **Operar** o sistema de automação WhatsApp com segurança
2. **Criar** templates personalizados eficazes
3. **Gerenciar** campanhas de mensagens em lote
4. **Monitorar** performance e métricas
5. **Resolver** problemas básicos de operação
6. **Manter** compliance com regulamentações WhatsApp

**Certificado válido por**: 12 meses
**Recertificação necessária**: Anual ou em atualizações major

---

**📋 Versão do Documento**: 1.0
**📅 Data de Criação**: 29/09/2025
**✍️ Criado por**: Sistema WhatsApp RuidCar
**🔄 Última Atualização**: 29/09/2025

---

*Para suporte adicional ou dúvidas sobre este treinamento, entre em contato com a equipe técnica através dos canais oficiais.*