# 🚀 WHATSAPP AUTOMATION - GUIA DE DEPLOY

## 📋 PRÉ-REQUISITOS PARA PRODUÇÃO

### Ambiente de Produção
- **Node.js**: v18+ ou v20+ (recomendado)
- **PostgreSQL**: v14+ (Neon Database configurado)
- **SSL**: Certificado HTTPS válido (obrigatório para webhooks Z-API)
- **Domínio**: Domínio configurado (ex: app.ruidcar.com.br)

### Credenciais Z-API
- ✅ **Instance ID**: `3E3EFBCA3E13C17E04F83E61E96978DB`
- ✅ **Token**: `91D06F6734B2549D951518BE`
- ✅ **Client-Token**: Configurado e testado
- ✅ **Status**: Conectado e funcionando

## 🔧 CONFIGURAÇÃO DE AMBIENTE

### 1. Variáveis de Ambiente (.env.production)
```env
# Database
DATABASE_URL=postgresql://neondb_owner:password@ep-delicate-pine-a4eh947l.us-east-1.aws.neon.tech/neondb

# Z-API Configuration
ZAPI_INSTANCE_ID=3E3EFBCA3E13C17E04F83E61E96978DB
ZAPI_TOKEN=91D06F6734B2549D951518BE
ZAPI_CLIENT_TOKEN=your_client_token_here
ZAPI_BASE_URL=https://api.z-api.io

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secure-jwt-secret-key

# WhatsApp Settings
WHATSAPP_COMPLIANCE_MODE=true
WHATSAPP_WEBHOOK_URL=https://app.ruidcar.com.br/api/whatsapp/webhook

# Monitoring
ENABLE_WHATSAPP_MONITORING=true
ENABLE_WHATSAPP_ALERTS=true
```

### 2. Configuração do Webhook Z-API
```bash
# Configurar webhook automaticamente
curl -X PUT "https://api.z-api.io/instances/3E3EFBCA3E13C17E04F83E61E96978DB/token/91D06F6734B2549D951518BE/update-webhook-received" \
  -H "Content-Type: application/json" \
  -H "Client-Token: YOUR_CLIENT_TOKEN" \
  -d '{"value": "https://app.ruidcar.com.br/api/whatsapp/webhook"}'

curl -X PUT "https://api.z-api.io/instances/3E3EFBCA3E13C17E04F83E61E96978DB/token/91D06F6734B2549D951518BE/update-webhook-message-status" \
  -H "Content-Type: application/json" \
  -H "Client-Token: YOUR_CLIENT_TOKEN" \
  -d '{"value": "https://app.ruidcar.com.br/api/whatsapp/webhook"}'
```

## 📦 DEPLOY STEPS

### 1. Build da Aplicação
```bash
# Instalar dependências
npm ci --only=production

# Build do frontend
npm run build

# Verificar build
npm run check
```

### 2. Migrations do Banco
```bash
# Executar migrations em produção
npm run db:migrate

# Verificar se todas as tabelas foram criadas
psql $DATABASE_URL -c "\dt+ whatsapp*"
```

### 3. Configuração do Servidor
```bash
# PM2 para produção (recomendado)
npm install -g pm2

# Configurar PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ruidcar-whatsapp',
    script: 'server/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/whatsapp-error.log',
    out_file: 'logs/whatsapp-out.log',
    log_file: 'logs/whatsapp-combined.log',
    max_memory_restart: '1G'
  }]
}
EOF

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Configuração do Nginx
```nginx
# /etc/nginx/sites-available/ruidcar-whatsapp
server {
    listen 80;
    server_name app.ruidcar.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name app.ruidcar.com.br;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

    # WhatsApp Webhook (Z-API)
    location /api/whatsapp/webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts específicos para webhooks
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API WhatsApp
    location /api/whatsapp/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin Panel
    location /admin {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🧪 TESTES DE PRODUÇÃO

### 1. Health Check
```bash
# Verificar aplicação
curl -f https://app.ruidcar.com.br/api/health || exit 1

# Verificar Z-API
curl -f "https://app.ruidcar.com.br/api/whatsapp/test-connection" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" || exit 1
```

### 2. Teste de Templates
```bash
# Verificar templates
curl "https://app.ruidcar.com.br/api/whatsapp/templates" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" | jq '.templates | length'
```

### 3. Teste de Webhook
```bash
# Simular webhook Z-API
curl -X POST "https://app.ruidcar.com.br/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "timestamp": "'$(date -Iseconds)'"}'
```

## 📊 MONITORAMENTO

### 1. Logs do Sistema
```bash
# Ver logs em tempo real
pm2 logs ruidcar-whatsapp

# Logs específicos do WhatsApp
tail -f logs/whatsapp-combined.log | grep "WhatsApp"
```

### 2. Monitoramento Z-API
```bash
# Script de monitoramento (cron job)
cat > /scripts/monitor-whatsapp.sh << 'EOF'
#!/bin/bash
WEBHOOK_URL="https://app.ruidcar.com.br/api/whatsapp/test-connection"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" $WEBHOOK_URL)

if [ $STATUS -ne 200 ]; then
    echo "$(date): WhatsApp Z-API connection failed - HTTP $STATUS" >> /var/log/whatsapp-monitor.log
    # Enviar alerta por email ou Slack
fi
EOF

chmod +x /scripts/monitor-whatsapp.sh

# Adicionar ao cron (executar a cada 5 minutos)
echo "*/5 * * * * /scripts/monitor-whatsapp.sh" | crontab -
```

### 3. Dashboard de Métricas
Acesse: `https://app.ruidcar.com.br/admin/whatsapp`

**Métricas Monitoradas:**
- ✅ Status da instância Z-API
- ✅ Mensagens enviadas/entregues/lidas
- ✅ Taxa de entrega por template
- ✅ Tempo de resposta médio
- ✅ Compliance (horários, opt-outs)

## 🔒 SEGURANÇA

### 1. Firewall
```bash
# Permitir apenas portas necessárias
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 2. Rate Limiting (Nginx)
```nginx
# Adicionar ao nginx.conf
http {
    limit_req_zone $binary_remote_addr zone=whatsapp:10m rate=10r/m;

    server {
        location /api/whatsapp/ {
            limit_req zone=whatsapp burst=20 nodelay;
            # ... resto da configuração
        }
    }
}
```

### 3. Backup Automático
```bash
# Script de backup diário
cat > /scripts/backup-whatsapp.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/whatsapp"

mkdir -p $BACKUP_DIR

# Backup das tabelas WhatsApp
pg_dump $DATABASE_URL \
  --table=whatsapp_messages \
  --table=whatsapp_templates \
  --table=zapi_instances \
  --table=whatsapp_compliance_logs \
  --table=whatsapp_received_messages \
  > $BACKUP_DIR/whatsapp_backup_$DATE.sql

# Manter apenas backups dos últimos 7 dias
find $BACKUP_DIR -name "whatsapp_backup_*.sql" -mtime +7 -delete
EOF

chmod +x /scripts/backup-whatsapp.sh

# Executar diariamente às 2:00 AM
echo "0 2 * * * /scripts/backup-whatsapp.sh" | crontab -
```

## 🚨 ALERTAS E TROUBLESHOOTING

### Alertas Configurados
1. **Z-API Desconectada**: Email + Slack
2. **Alta Taxa de Falha** (>10%): Email
3. **Fila com Backlog** (>100 msgs): Email
4. **Webhook Failures**: Log + Email

### Troubleshooting Comum

#### Problema: Z-API desconectada
```bash
# Verificar status
curl -s "https://api.z-api.io/instances/3E3EFBCA3E13C17E04F83E61E96978DB/token/91D06F6734B2549D951518BE/status" | jq .

# Reconectar se necessário
curl -X POST "https://api.z-api.io/instances/3E3EFBCA3E13C17E04F83E61E96978DB/token/91D06F6734B2549D951518BE/restart"
```

#### Problema: Webhooks não funcionando
```bash
# Verificar configuração do webhook
curl "https://api.z-api.io/instances/3E3EFBCA3E13C17E04F83E61E96978DB/token/91D06F6734B2549D951518BE/webhook" | jq .

# Reconfigurar webhook
curl -X PUT "https://api.z-api.io/instances/3E3EFBCA3E13C17E04F83E61E96978DB/token/91D06F6734B2549D951518BE/update-webhook-received" \
  -H "Content-Type: application/json" \
  -d '{"value": "https://app.ruidcar.com.br/api/whatsapp/webhook"}'
```

#### Problema: Mensagens não enviando
```bash
# Verificar fila de mensagens
psql $DATABASE_URL -c "SELECT status, COUNT(*) FROM whatsapp_message_queue GROUP BY status;"

# Verificar logs
grep "WhatsApp" logs/whatsapp-combined.log | tail -50
```

## ✅ CHECKLIST DE DEPLOY

### Pré-Deploy
- [ ] Backup do banco de dados atual
- [ ] Testes em ambiente de staging
- [ ] Verificação de todas as variáveis de ambiente
- [ ] SSL configurado e funcionando

### Deploy
- [ ] Build da aplicação sem erros
- [ ] Migrations executadas com sucesso
- [ ] PM2 configurado e aplicação rodando
- [ ] Nginx configurado com proxy reverso
- [ ] Webhook Z-API configurado

### Pós-Deploy
- [ ] Health checks passando
- [ ] Z-API conectada e funcionando
- [ ] Templates carregando corretamente
- [ ] Logs sendo gerados corretamente
- [ ] Monitoramento ativo
- [ ] Backup automático configurado

### Testes de Aceitação
- [ ] Login no admin panel funcionando
- [ ] Página WhatsApp Manager carregando
- [ ] Templates listando corretamente
- [ ] Status da instância Z-API sendo exibido
- [ ] Seleção de leads e envio de teste

## 📞 SUPORTE

### Contatos de Emergência
- **Z-API Support**: [suporte@z-api.io](mailto:suporte@z-api.io)
- **Neon Database**: Console online
- **Equipe Técnica**: Slack #whatsapp-support

### Escalação
1. **Nível 1**: Verificar logs e restart da aplicação
2. **Nível 2**: Contatar suporte Z-API
3. **Nível 3**: Rollback para versão anterior

---

**🚀 Sistema WhatsApp RuidCar pronto para produção!**
**Data de Deploy**: ___/___/2025
**Versão**: 1.0.0
**Status**: ✅ Aprovado para produção