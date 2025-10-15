#!/bin/bash

# Script de Deploy para execução no Servidor VPS
# Este script deve ser colocado no servidor em /var/www/ruidcar/server-deploy.sh
# E executado sempre que houver uma nova atualização no GitHub

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do RUIDCAR..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do projeto no servidor
PROJECT_DIR="/var/www/ruidcar"

# Navegar para o diretório do projeto
cd $PROJECT_DIR

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   RUIDCAR - Deploy Automático${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Backup do .env antes de fazer pull
echo -e "${YELLOW}💾 Fazendo backup das variáveis de ambiente...${NC}"
if [ -f ".env" ]; then
    cp .env .env.backup
    echo -e "${GREEN}✅ Backup criado${NC}\n"
fi

# Verificar branch atual
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Branch atual: ${CURRENT_BRANCH}${NC}\n"

# Fazer stash de mudanças locais
echo -e "${YELLOW}📦 Salvando mudanças locais temporariamente...${NC}"
git stash
echo -e "${GREEN}✅ Stash criado${NC}\n"

# Fazer pull das últimas alterações
echo -e "${YELLOW}📥 Baixando últimas alterações do GitHub...${NC}"
git pull origin main
echo -e "${GREEN}✅ Código atualizado${NC}\n"

# Restaurar .env
if [ -f ".env.backup" ]; then
    echo -e "${YELLOW}🔄 Restaurando variáveis de ambiente...${NC}"
    cp .env.backup .env
    echo -e "${GREEN}✅ Variáveis restauradas${NC}\n"
fi

# Instalar/atualizar dependências
echo -e "${YELLOW}📦 Instalando/atualizando dependências...${NC}"
npm install --production
echo -e "${GREEN}✅ Dependências instaladas${NC}\n"

# Executar build
echo -e "${YELLOW}🔨 Compilando aplicação...${NC}"
npm run build
echo -e "${GREEN}✅ Build concluído${NC}\n"

# Executar migrações do banco de dados (se existirem)
if [ -d "migrations" ]; then
    echo -e "${YELLOW}🗄️  Executando migrações do banco...${NC}"
    npm run db:migrate 2>/dev/null || echo -e "${YELLOW}⚠️  Sem migrações pendentes${NC}"
    echo ""
fi

# Reiniciar aplicação
echo -e "${YELLOW}🔄 Reiniciando aplicação...${NC}"

# Tentar PM2 primeiro
if command -v pm2 &> /dev/null; then
    pm2 restart ruidcar
    echo -e "${GREEN}✅ Aplicação reiniciada via PM2${NC}\n"
# Se estiver usando systemd
elif systemctl is-active --quiet ruidcar; then
    sudo systemctl restart ruidcar
    echo -e "${GREEN}✅ Aplicação reiniciada via systemd${NC}\n"
# Ou nginx
else
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx recarregado${NC}\n"
fi

# Mostrar status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}📊 Status da aplicação:${NC}"

# Verificar status
if command -v pm2 &> /dev/null; then
    pm2 status ruidcar
    echo ""
    pm2 logs ruidcar --lines 10 --nostream
elif systemctl is-active --quiet ruidcar; then
    sudo systemctl status ruidcar --no-pager -l
fi

echo ""
echo -e "${GREEN}🎉 Tudo pronto! Aplicação atualizada e rodando.${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
