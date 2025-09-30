#!/bin/bash

# Script para configurar SSL com Let's Encrypt para RuidCar
# Execute este script na VPS após o deploy inicial

set -e

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
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "🔐 Configurando SSL para RuidCar..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Este script deve ser executado como root"
    exit 1
fi

# Configuration
DOMAIN="ruidcar.com.br"
WWW_DOMAIN="www.ruidcar.com.br"
EMAIL="contato@ruidcar.com.br"

print_status "Verificando configuração do Nginx..."

# Check if Nginx config exists
if [ ! -f /etc/nginx/sites-available/ruidcar.conf ]; then
    print_error "Configuração do Nginx não encontrada!"
    echo "Execute primeiro:"
    echo "  cp nginx/ruidcar.conf /etc/nginx/sites-available/"
    echo "  ln -s /etc/nginx/sites-available/ruidcar.conf /etc/nginx/sites-enabled/"
    echo "  nginx -t && systemctl reload nginx"
    exit 1
fi

# Check if site is enabled
if [ ! -L /etc/nginx/sites-enabled/ruidcar.conf ]; then
    print_warning "Habilitando site no Nginx..."
    ln -s /etc/nginx/sites-available/ruidcar.conf /etc/nginx/sites-enabled/
fi

# Test Nginx configuration
print_status "Testando configuração do Nginx..."
nginx -t
if [ $? -ne 0 ]; then
    print_error "Configuração do Nginx inválida!"
    exit 1
fi

# Reload Nginx
systemctl reload nginx

# Create temporary Nginx config for Certbot validation
print_status "Criando configuração temporária para validação..."

cat > /etc/nginx/sites-available/ruidcar-temp.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $WWW_DOMAIN;

    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF

# Temporarily use the temp config
rm -f /etc/nginx/sites-enabled/ruidcar.conf
ln -s /etc/nginx/sites-available/ruidcar-temp.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

print_status "Obtendo certificado SSL..."

# Run Certbot
certbot certonly \
    --webroot \
    -w /var/www/html \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN \
    -d $WWW_DOMAIN

if [ $? -eq 0 ]; then
    print_status "Certificado SSL obtido com sucesso!"

    # Restore original config
    rm -f /etc/nginx/sites-enabled/ruidcar-temp.conf
    ln -s /etc/nginx/sites-available/ruidcar.conf /etc/nginx/sites-enabled/

    # Generate DH parameters if not exists
    if [ ! -f /etc/ssl/certs/dhparam.pem ]; then
        print_status "Gerando parâmetros Diffie-Hellman (pode demorar alguns minutos)..."
        openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
    fi

    # Update Nginx config to include DH params
    if ! grep -q "ssl_dhparam" /etc/nginx/sites-available/ruidcar.conf; then
        sed -i '/ssl_stapling_verify on;/a\    ssl_dhparam /etc/ssl/certs/dhparam.pem;' /etc/nginx/sites-available/ruidcar.conf
    fi

    # Test and reload Nginx
    nginx -t
    if [ $? -eq 0 ]; then
        systemctl reload nginx
        print_status "Nginx recarregado com SSL!"
    else
        print_error "Erro na configuração do Nginx!"
        exit 1
    fi

    # Setup auto-renewal
    print_status "Configurando renovação automática..."

    # Add renewal cron job
    (crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

    # Test renewal
    print_status "Testando renovação..."
    certbot renew --dry-run

    if [ $? -eq 0 ]; then
        print_status "Renovação automática configurada!"
    else
        print_warning "Teste de renovação falhou. Verifique manualmente."
    fi

    # Clean up temp config
    rm -f /etc/nginx/sites-available/ruidcar-temp.conf

    echo ""
    echo "======================================="
    echo "✅ SSL configurado com sucesso!"
    echo "======================================="
    echo ""
    echo "🔐 Certificados instalados para:"
    echo "   - https://$DOMAIN"
    echo "   - https://$WWW_DOMAIN"
    echo ""
    echo "📅 Renovação automática configurada"
    echo "   - Executa diariamente às 3:00 AM"
    echo "   - Certificados válidos por 90 dias"
    echo ""
    echo "🔍 Para verificar o status do certificado:"
    echo "   certbot certificates"
    echo ""
    echo "🔄 Para renovar manualmente:"
    echo "   certbot renew"
    echo ""
    echo "📝 Para verificar SSL online:"
    echo "   https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
    echo ""

else
    print_error "Falha ao obter certificado SSL!"

    # Restore original config
    rm -f /etc/nginx/sites-enabled/ruidcar-temp.conf
    ln -s /etc/nginx/sites-available/ruidcar.conf /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx

    echo ""
    echo "Possíveis problemas:"
    echo "1. DNS não está apontando corretamente para 89.116.214.182"
    echo "2. Portas 80/443 bloqueadas no firewall"
    echo "3. Rate limit do Let's Encrypt atingido"
    echo ""
    echo "Verifique o DNS com:"
    echo "  nslookup $DOMAIN"
    echo "  nslookup $WWW_DOMAIN"
    echo ""
    echo "Tente novamente mais tarde ou use o modo interativo:"
    echo "  certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"

    exit 1
fi