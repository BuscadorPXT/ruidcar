# Guia de Deploy - RUIDCAR

Este documento descreve como configurar e realizar deploy automático do projeto RUIDCAR no servidor VPS da Hostinger.

## Informações do Servidor

- **IP:** 89.116.214.182
- **Usuário:** root
- **Senha:** yB-&(,JmWI6Nx.TM2r#8
- **Diretório do projeto:** `/var/www/ruidcar`

> ⚠️ **IMPORTANTE:** Altere a senha SSH após configurar tudo!

## Configuração Inicial

### 1. No Servidor VPS

Conecte-se ao servidor via SSH:

```bash
ssh root@89.116.214.182
```

#### 1.1 Instalar dependências básicas

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js (versão 20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Instalar Git
sudo apt install -y git
```

#### 1.2 Criar estrutura de diretórios

```bash
# Criar diretório do projeto
sudo mkdir -p /var/www/ruidcar
cd /var/www/ruidcar

# Clonar repositório
git clone https://github.com/BuscadorPXT/ruidcar.git .

# Configurar permissões
sudo chown -R $USER:$USER /var/www/ruidcar
```

#### 1.3 Configurar variáveis de ambiente

```bash
# Criar arquivo .env
nano .env
```

Adicione suas variáveis de ambiente (banco de dados, APIs, etc.):

```env
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3000
# Adicione outras variáveis conforme necessário
```

#### 1.4 Copiar script de deploy para o servidor

```bash
# O script server-deploy.sh já está no repositório
# Dar permissão de execução
chmod +x server-deploy.sh
```

#### 1.5 Configurar PM2

```bash
# Instalar dependências
npm install --production

# Build inicial
npm run build

# Iniciar aplicação com PM2
pm2 start npm --name "ruidcar" -- start

# Salvar configuração PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

### 2. Configurar GitHub Secrets

Para o GitHub Actions funcionar, você precisa configurar as secrets no repositório:

1. Acesse: https://github.com/BuscadorPXT/ruidcar/settings/secrets/actions
2. Clique em "New repository secret"
3. Adicione as seguintes secrets:

| Nome | Valor |
|------|-------|
| `VPS_HOST` | `89.116.214.182` |
| `VPS_USERNAME` | `root` |
| `VPS_PASSWORD` | `yB-&(,JmWI6Nx.TM2r#8` |

> 💡 **Dica:** Após configurar, crie um usuário SSH específico para deploys (não use root em produção).

## Métodos de Deploy

### Método 1: Deploy Automático (Recomendado)

O deploy automático é disparado sempre que você faz push para a branch `main`:

```bash
# Fazer alterações no código
git add .
git commit -m "Descrição das alterações"
git push origin main
```

O GitHub Actions irá:
1. Fazer build da aplicação
2. Conectar no servidor via SSH
3. Executar o script `server-deploy.sh`
4. Reiniciar a aplicação

### Método 2: Deploy Manual via GitHub Actions

1. Acesse: https://github.com/BuscadorPXT/ruidcar/actions
2. Clique em "Deploy para Produção"
3. Clique em "Run workflow"
4. Selecione a branch `main`
5. Clique em "Run workflow"

### Método 3: Deploy Manual Direto no Servidor

Conecte-se ao servidor e execute:

```bash
ssh root@89.116.214.182
cd /var/www/ruidcar
./server-deploy.sh
```

### Método 4: Deploy Local via SSH

Execute o script de deploy local:

```bash
# No seu computador, na pasta do projeto
./deploy.sh
```

## Estrutura dos Scripts

### `server-deploy.sh` (No Servidor)

Este script é executado no servidor VPS e realiza:
- Backup das variáveis de ambiente
- Pull das últimas alterações do GitHub
- Instalação de dependências
- Build da aplicação
- Execução de migrações
- Reinício da aplicação via PM2

### `deploy.yml` (GitHub Actions)

Workflow que automatiza o deploy:
- Dispara em push para `main`
- Faz build local para validar
- Conecta no servidor via SSH
- Executa `server-deploy.sh`
- Verifica saúde da aplicação

## Monitoramento

### Verificar status da aplicação

```bash
# Status do PM2
pm2 status

# Logs em tempo real
pm2 logs ruidcar

# Últimas 100 linhas de log
pm2 logs ruidcar --lines 100

# Usar recursos da aplicação
pm2 monit
```

### Comandos úteis PM2

```bash
# Reiniciar aplicação
pm2 restart ruidcar

# Parar aplicação
pm2 stop ruidcar

# Iniciar aplicação
pm2 start ruidcar

# Deletar aplicação do PM2
pm2 delete ruidcar
```

## Rollback (Reverter Deploy)

Se algo der errado, você pode reverter para uma versão anterior:

```bash
ssh root@89.116.214.182
cd /var/www/ruidcar

# Ver commits recentes
git log --oneline -10

# Reverter para um commit específico
git reset --hard COMMIT_HASH

# Reinstalar e rebuild
npm install --production
npm run build

# Reiniciar aplicação
pm2 restart ruidcar
```

## Configuração de Nginx (Se aplicável)

Se estiver usando Nginx como proxy reverso:

```nginx
server {
    listen 80;
    server_name ruidcar.com.br www.ruidcar.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Recarregar Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS com Certbot

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d ruidcar.com.br -d www.ruidcar.com.br

# Renovação automática
sudo certbot renew --dry-run
```

## Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs ruidcar --err

# Verificar porta em uso
sudo lsof -i :3000

# Matar processo na porta
sudo kill -9 $(sudo lsof -t -i:3000)
```

### Erro de permissões

```bash
# Corrigir permissões
sudo chown -R $USER:$USER /var/www/ruidcar
chmod -R 755 /var/www/ruidcar
```

### Deploy não atualiza código

```bash
# Forçar pull
cd /var/www/ruidcar
git fetch --all
git reset --hard origin/main
./server-deploy.sh
```

## Segurança

### Recomendações importantes:

1. **Altere a senha SSH imediatamente:**
   ```bash
   passwd
   ```

2. **Crie um usuário dedicado para deploys:**
   ```bash
   sudo adduser deploy
   sudo usermod -aG sudo deploy
   ```

3. **Configure autenticação por chave SSH:**
   ```bash
   ssh-keygen -t rsa -b 4096
   ssh-copy-id deploy@89.116.214.182
   ```

4. **Desabilite login root via SSH:**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Altere: PermitRootLogin no
   sudo systemctl restart sshd
   ```

5. **Configure firewall:**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

## Backup

### Script de backup automático

```bash
#!/bin/bash
BACKUP_DIR="/backup/ruidcar"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do código
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /var/www/ruidcar

# Backup do banco (ajuste conforme seu banco)
pg_dump -U usuario -d ruidcar > $BACKUP_DIR/db_$DATE.sql

# Manter apenas últimos 7 dias
find $BACKUP_DIR -type f -mtime +7 -delete
```

Configure no crontab:
```bash
crontab -e
# Adicione:
0 2 * * * /path/to/backup-script.sh
```

## Suporte

Para problemas ou dúvidas:
- Verifique os logs: `pm2 logs ruidcar`
- Verifique o GitHub Actions: https://github.com/BuscadorPXT/ruidcar/actions
- Contate o administrador do sistema

---

**Última atualização:** $(date +%Y-%m-%d)
