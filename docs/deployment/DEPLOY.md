# 🚀 Guia de Deploy RuidCar

Este guia detalha o processo completo de deploy do projeto RuidCar para sua VPS.

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04+ (IP: 89.116.214.182)
- Acesso root via SSH
- DNS configurado (A records para ruidcar.com.br e www.ruidcar.com.br)
- Banco de dados PostgreSQL no Neon configurado

## 🎯 Visão Geral do Deploy

O deploy consiste em 5 etapas principais:

1. **Preparação Local** - Configurar credenciais
2. **Setup da VPS** - Instalar dependências
3. **Deploy Inicial** - Enviar aplicação
4. **Configuração SSL** - Certificado HTTPS
5. **Verificação** - Testar aplicação

## 📝 Passo a Passo

### 1️⃣ Preparação Local

#### a) Configure o arquivo `.env.production`
```bash
# Edite o arquivo .env.production com suas credenciais
nano .env.production
```

**Campos obrigatórios:**
- `DATABASE_URL`: String de conexão do Neon
- `JWT_SECRET`: Gere com `openssl rand -base64 32`
- `SESSION_SECRET`: Gere com `openssl rand -base64 32`
- `SENDGRID_API_KEY`: Sua API key do SendGrid (ou configure SMTP)

#### b) Torne os scripts executáveis
```bash
chmod +x deploy.sh setup-vps.sh setup-ssl.sh
```

### 2️⃣ Setup Inicial da VPS

Execute o script de setup na VPS (apenas uma vez):

```bash
# Opção 1: Execute remotamente
ssh root@89.116.214.182 'bash -s' < setup-vps.sh

# Opção 2: Copie e execute na VPS
scp setup-vps.sh root@89.116.214.182:/tmp/
ssh root@89.116.214.182
bash /tmp/setup-vps.sh
```

Este script irá:
- Instalar Node.js 20, Nginx, PM2, Redis
- Configurar firewall e segurança
- Criar estrutura de diretórios
- Configurar backups automáticos

### 3️⃣ Configuração do Nginx

Na VPS, configure o Nginx:

```bash
# Conecte na VPS
ssh root@89.116.214.182

# Copie a configuração do Nginx
scp nginx/ruidcar.conf root@89.116.214.182:/etc/nginx/sites-available/

# Na VPS, habilite o site
ln -s /etc/nginx/sites-available/ruidcar.conf /etc/nginx/sites-enabled/

# Teste a configuração
nginx -t

# Recarregue o Nginx
systemctl reload nginx
```

### 4️⃣ Deploy da Aplicação

Execute o deploy do seu computador local:

```bash
# Certifique-se de que o .env.production está configurado
./deploy.sh
```

O script irá:
- Fazer build da aplicação
- Enviar para a VPS
- Instalar dependências
- Executar migrações
- Iniciar com PM2

### 5️⃣ Configuração do SSL

Após o deploy inicial, configure o certificado SSL:

```bash
# Na VPS
ssh root@89.116.214.182

# Execute o script de SSL
bash setup-ssl.sh
```

Ou remotamente:
```bash
ssh root@89.116.214.182 'bash -s' < setup-ssl.sh
```

### 6️⃣ Verificação Final

Verifique se tudo está funcionando:

```bash
# Status dos serviços
ssh root@89.116.214.182 << 'EOF'
pm2 status
systemctl status nginx
systemctl status redis-server
EOF

# Teste o site
curl -I https://ruidcar.com.br
```

## 🔧 Comandos Úteis

### Na VPS

```bash
# Logs da aplicação
pm2 logs ruidcar

# Monitorar aplicação
pm2 monit

# Reiniciar aplicação
pm2 restart ruidcar

# Status do PM2
pm2 status

# Logs do Nginx
tail -f /var/log/nginx/ruidcar_access.log
tail -f /var/log/nginx/ruidcar_error.log

# Verificar certificado SSL
certbot certificates

# Renovar SSL manualmente
certbot renew
```

### Deploy de Atualizações

Para fazer deploy de atualizações futuras:

```bash
# Do seu computador local
./deploy.sh
```

## 🐛 Troubleshooting

### Problema: Site não abre

1. Verifique o DNS:
```bash
nslookup ruidcar.com.br
# Deve retornar 89.116.214.182
```

2. Verifique os serviços:
```bash
ssh root@89.116.214.182
pm2 status
systemctl status nginx
```

3. Verifique os logs:
```bash
pm2 logs ruidcar
tail -f /var/log/nginx/ruidcar_error.log
```

### Problema: Erro 502 Bad Gateway

1. Verifique se a aplicação está rodando:
```bash
pm2 status ruidcar
```

2. Reinicie a aplicação:
```bash
pm2 restart ruidcar
```

3. Verifique a porta:
```bash
netstat -tlnp | grep 3000
```

### Problema: Erro de banco de dados

1. Verifique a conexão:
```bash
# Na VPS
cat /var/www/ruidcar/.env.production | grep DATABASE_URL
```

2. Teste a conexão:
```bash
npm run db:migrate
```

### Problema: SSL não funciona

1. Verifique o certificado:
```bash
certbot certificates
```

2. Renovar manualmente:
```bash
certbot renew --force-renewal
```

## 🔒 Segurança

### Configurações Recomendadas

1. **Configure chave SSH** (desabilite senha root):
```bash
# No seu computador
ssh-copy-id root@89.116.214.182

# Na VPS
nano /etc/ssh/sshd_config
# Mude: PasswordAuthentication no
systemctl restart ssh
```

2. **Configure backup automático do banco**:
- O Neon já faz backups automáticos
- Configure backup adicional se necessário

3. **Monitore logs regularmente**:
```bash
# Verificar tentativas de acesso
tail -f /var/log/auth.log
fail2ban-client status
```

## 📊 Monitoramento

### Netdata
Acesse o painel de monitoramento:
```
http://89.116.214.182:19999
```

### PM2 Monitoring
```bash
pm2 monit
pm2 web # Interface web em :9615
```

## 🔄 Atualizações Futuras

Para atualizar a aplicação:

1. Faça as alterações no código
2. Teste localmente
3. Execute: `./deploy.sh`

O script preserva backups das versões anteriores em `/var/www/ruidcar/dist.backup.*`

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs detalhados
2. Consulte a documentação em CLAUDE.md
3. Verifique issues conhecidas em LOGICA.md

## ✅ Checklist Final

- [ ] DNS configurado e propagado
- [ ] `.env.production` configurado com todas as variáveis
- [ ] VPS configurada com `setup-vps.sh`
- [ ] Nginx configurado e testado
- [ ] Aplicação deployada com `deploy.sh`
- [ ] SSL configurado com `setup-ssl.sh`
- [ ] Site acessível em https://ruidcar.com.br
- [ ] Backups automáticos configurados
- [ ] Monitoramento ativo

---

**Tempo estimado para deploy completo:** 30-45 minutos

**Nota:** Guarde este documento e os scripts para futuros deploys e manutenção.