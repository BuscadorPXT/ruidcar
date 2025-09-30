#!/bin/bash

# Setup inicial da VPS para RuidCar
# Execute este script como root na VPS uma única vez
# ssh root@89.116.214.182 'bash -s' < setup-vps.sh

set -e

echo "🚀 Iniciando configuração da VPS para RuidCar..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Update system
print_status "Atualizando sistema..."
apt update && apt upgrade -y

# Install essential packages
print_status "Instalando pacotes essenciais..."
apt install -y \
    curl \
    wget \
    git \
    build-essential \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    htop \
    vim \
    redis-server

# Install Node.js 20.x
print_status "Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js installation
node_version=$(node -v)
npm_version=$(npm -v)
print_status "Node.js instalado: $node_version"
print_status "NPM instalado: $npm_version"

# Install PM2 globally
print_status "Instalando PM2..."
npm install -g pm2

# Setup PM2 to start on system boot
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

# Create application directory
print_status "Criando diretório da aplicação..."
mkdir -p /var/www/ruidcar
mkdir -p /var/www/ruidcar/uploads
mkdir -p /var/log/ruidcar
mkdir -p /var/log/nginx

# Set permissions
chown -R www-data:www-data /var/www/ruidcar/uploads
chmod 755 /var/www/ruidcar
chmod 755 /var/www/ruidcar/uploads

# Configure UFW firewall
print_status "Configurando firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000
echo "y" | ufw enable

# Configure Fail2ban
print_status "Configurando Fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/*error.log

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/*access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/*access.log
maxretry = 2

[nginx-noproxy]
enabled = true
port = http,https
filter = nginx-noproxy
logpath = /var/log/nginx/*error.log
maxretry = 2
EOF

systemctl restart fail2ban

# Configure Redis
print_status "Configurando Redis..."
sed -i 's/# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
systemctl restart redis-server
systemctl enable redis-server

# Configure Nginx
print_status "Configurando Nginx..."

# Backup default config
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Optimize Nginx
cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    client_max_body_size 10M;

    # MIME Types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Logging
    access_log /var/log/nginx/access.log;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml application/atom+xml image/svg+xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_status 429;

    # Virtual Host Configs
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

# Setup swap (if not exists)
if [ ! -f /swapfile ]; then
    print_status "Criando swap de 2GB..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
fi

# Configure sysctl for better performance
print_status "Otimizando configurações do kernel..."
cat >> /etc/sysctl.conf << EOF

# RuidCar Optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_tw_buckets = 1440000
net.ipv4.ip_local_port_range = 1024 65000
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_tw_reuse = 1
fs.file-max = 2097152
fs.nr_open = 2097152
EOF

sysctl -p

# Create deployment user (optional)
print_status "Criando usuário deploy..."
if ! id -u deploy > /dev/null 2>&1; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    usermod -aG www-data deploy

    # Setup SSH for deploy user
    mkdir -p /home/deploy/.ssh
    touch /home/deploy/.ssh/authorized_keys
    chown -R deploy:deploy /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    chmod 600 /home/deploy/.ssh/authorized_keys

    print_warning "Usuário 'deploy' criado. Configure as chaves SSH manualmente."
fi

# Create backup script
print_status "Criando script de backup..."
cat > /usr/local/bin/backup-ruidcar.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/ruidcar"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database (configure with your credentials)
# pg_dump $DATABASE_URL > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/ruidcar/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-ruidcar.sh

# Add backup to crontab (daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-ruidcar.sh >> /var/log/ruidcar/backup.log 2>&1") | crontab -

# Install monitoring (optional)
print_status "Instalando monitoramento básico..."
apt install -y netdata

# Final checks
print_status "Verificando serviços..."
systemctl status nginx --no-pager
systemctl status redis-server --no-pager
systemctl status fail2ban --no-pager

print_status "Setup inicial concluído!"
echo ""
echo "======================================="
echo "✅ VPS configurada com sucesso!"
echo "======================================="
echo ""
echo "📝 Próximos passos:"
echo "1. Configure o arquivo .env.production com suas credenciais"
echo "2. Copie o arquivo nginx/ruidcar.conf para /etc/nginx/sites-available/"
echo "3. Execute: ln -s /etc/nginx/sites-available/ruidcar.conf /etc/nginx/sites-enabled/"
echo "4. Execute o script de deploy: ./deploy.sh"
echo "5. Configure o SSL com: certbot --nginx -d ruidcar.com.br -d www.ruidcar.com.br"
echo ""
echo "🔐 Segurança:"
echo "- Firewall UFW configurado e ativo"
echo "- Fail2ban configurado para proteção contra ataques"
echo "- Considere configurar chaves SSH e desabilitar login por senha"
echo ""
echo "📊 Monitoramento:"
echo "- Netdata instalado em http://89.116.214.182:19999"
echo "- Logs em /var/log/ruidcar/"
echo ""