#!/bin/bash

# Deploy script for RuidCar
# Usage: ./deploy.sh

set -e

echo "🚀 Starting RuidCar deployment..."

# Configuration
VPS_IP="89.116.214.182"
VPS_USER="root"
APP_DIR="/var/www/ruidcar"
DOMAIN="ruidcar.com.br"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Build the application locally
print_status "Building the application..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

# Step 2: Create deployment package
print_status "Creating deployment package..."
tar -czf deploy.tar.gz \
    dist/ \
    package.json \
    package-lock.json \
    .env.production \
    ecosystem.config.cjs \
    --exclude=node_modules \
    --exclude=.git

# Step 3: Upload to VPS
print_status "Uploading to VPS..."
scp deploy.tar.gz ${VPS_USER}@${VPS_IP}:${APP_DIR}/

# Step 4: Deploy on VPS
print_status "Deploying on VPS..."
ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
cd /var/www/ruidcar

# Backup current version
if [ -d "dist" ]; then
    mv dist dist.backup.$(date +%Y%m%d_%H%M%S)
fi

# Extract new version
tar -xzf deploy.tar.gz

# Install production dependencies
npm ci --production

# Run database migrations
npm run db:migrate

# Restart application with PM2
pm2 restart ruidcar || pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Clean up
rm deploy.tar.gz

echo "✅ Deployment complete!"
ENDSSH

# Step 5: Clean up local files
print_status "Cleaning up..."
rm deploy.tar.gz

# Step 6: Health check
print_status "Running health check..."
sleep 5
curl -I https://${DOMAIN} > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_status "Application is running!"
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo "Visit: https://${DOMAIN}"
else
    print_warning "Health check failed. Please check the application manually."
fi