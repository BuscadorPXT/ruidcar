#!/bin/bash

echo "🔍 Verificando se todas as páginas Admin/Workshop usam os layouts corretos..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
total_issues=0

echo "📁 Verificando páginas Admin..."
echo "================================"

# Verificar páginas Admin
admin_pages=$(find client/src/pages -name "Admin*.tsx" -o -path "*/admin/*.tsx" 2>/dev/null)

if [ -z "$admin_pages" ]; then
    echo "Nenhuma página Admin encontrada"
else
    for page in $admin_pages; do
        if [ -f "$page" ]; then
            # Pular páginas de login/autenticação
            if [[ $(basename "$page") == *"Login"* ]] || [[ $(basename "$page") == *"Redirect"* ]]; then
                echo -e "${YELLOW}⚠${NC} $(basename $page) - Página de autenticação (não requer layout)"
                continue
            fi

            if grep -q "AdminLayout" "$page"; then
                echo -e "${GREEN}✓${NC} $(basename $page) - Usando AdminLayout"
            else
                echo -e "${RED}✗${NC} $(basename $page) - NÃO está usando AdminLayout!"
                ((total_issues++))
            fi
        fi
    done
fi

echo ""
echo "📁 Verificando páginas Workshop..."
echo "================================"

# Verificar páginas Workshop
workshop_pages=$(find client/src/pages -name "Workshop*.tsx" -o -path "*/workshop/*.tsx" 2>/dev/null)

if [ -z "$workshop_pages" ]; then
    echo "Nenhuma página Workshop encontrada"
else
    for page in $workshop_pages; do
        if [ -f "$page" ]; then
            # Pular páginas públicas e de autenticação
            if [[ $(basename "$page") == "WorkshopRegister.tsx" ]] || [[ $(basename "$page") == *"Login"* ]] || [[ $(basename "$page") == *"Redirect"* ]]; then
                echo -e "${YELLOW}⚠${NC} $(basename $page) - Página pública/autenticação (não requer layout)"
                continue
            fi

            if grep -q "WorkshopLayout" "$page"; then
                echo -e "${GREEN}✓${NC} $(basename $page) - Usando WorkshopLayout"
            else
                echo -e "${RED}✗${NC} $(basename $page) - NÃO está usando WorkshopLayout!"
                ((total_issues++))
            fi
        fi
    done
fi

echo ""
echo "================================"
if [ $total_issues -eq 0 ]; then
    echo -e "${GREEN}✓ Todas as páginas estão usando os layouts corretos!${NC}"
else
    echo -e "${RED}✗ Encontrados $total_issues problemas de layout!${NC}"
    echo -e "${YELLOW}Lembre-se: TODAS as páginas Admin devem usar AdminLayout e TODAS as páginas Workshop devem usar WorkshopLayout!${NC}"
    exit 1
fi