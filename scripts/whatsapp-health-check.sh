#!/bin/bash

# 🔍 WHATSAPP HEALTH CHECK SCRIPT
# Verifica saúde do sistema WhatsApp automaticamente
# Autor: Sistema WhatsApp RuidCar
# Data: 29/09/2025

set -e

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
LOG_FILE="/var/log/whatsapp-health.log"
ALERT_LOG="/var/log/whatsapp-alerts.log"
BASE_URL="http://localhost:3001"
ADMIN_TOKEN="admin-simple-token-123"
WEBHOOK_SLACK="" # Configurar se necessário

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE" | tee -a "$ALERT_LOG"
}

# Função para enviar alerta
send_alert() {
    local message="$1"
    local severity="$2"

    # Log do alerta
    log_error "ALERTA [$severity]: $message"

    # Slack webhook (se configurado)
    if [[ -n "$WEBHOOK_SLACK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 WhatsApp Alert [$severity]: $message\"}" \
            "$WEBHOOK_SLACK" &>/dev/null || true
    fi

    # Email (se configurado)
    # echo "$message" | mail -s "WhatsApp Alert [$severity]" admin@ruidcar.com.br || true
}

# Função para verificar API endpoint
check_endpoint() {
    local endpoint="$1"
    local description="$2"
    local expected_status="$3"

    log_info "Verificando $description..."

    local response
    local status_code

    if [[ "$endpoint" == *"POST"* ]]; then
        local method="POST"
        endpoint="${endpoint#POST }"
        response=$(curl -s -w "%{http_code}" -X POST -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL$endpoint" -o /tmp/health_response.json 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL$endpoint" -o /tmp/health_response.json 2>/dev/null || echo "000")
    fi

    status_code="${response: -3}"

    if [[ "$status_code" == "$expected_status" ]]; then
        log_success "$description: OK (HTTP $status_code)"
        return 0
    else
        log_error "$description: FALHA (HTTP $status_code)"
        send_alert "$description retornou HTTP $status_code (esperado $expected_status)" "HIGH"
        return 1
    fi
}

# Função para verificar banco de dados
check_database() {
    log_info "Verificando conexão com banco de dados..."

    if command -v psql &> /dev/null; then
        if PGPASSWORD=npg_bdaE9x2yiYWL psql -h ep-delicate-pine-a4eh947l.us-east-1.aws.neon.tech -U neondb_owner -d neondb -c "SELECT 1;" &>/dev/null; then
            log_success "Banco de dados: OK"

            # Verificar tabelas WhatsApp
            local table_count
            table_count=$(PGPASSWORD=npg_bdaE9x2yiYWL psql -h ep-delicate-pine-a4eh947l.us-east-1.aws.neon.tech -U neondb_owner -d neondb -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'whatsapp%' OR table_name LIKE 'zapi%';" 2>/dev/null | xargs)

            if [[ "$table_count" -ge 20 ]]; then
                log_success "Tabelas WhatsApp: OK ($table_count tabelas)"
            else
                log_warning "Tabelas WhatsApp: Apenas $table_count encontradas (esperado >= 20)"
                send_alert "Apenas $table_count tabelas WhatsApp encontradas no banco" "MEDIUM"
            fi

            return 0
        else
            log_error "Banco de dados: FALHA NA CONEXÃO"
            send_alert "Falha na conexão com banco de dados PostgreSQL" "CRITICAL"
            return 1
        fi
    else
        log_warning "PostgreSQL client não encontrado, pulando verificação do banco"
        return 0
    fi
}

# Função para verificar Z-API
check_zapi() {
    log_info "Verificando status da instância Z-API..."

    local zapi_response
    zapi_response=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/api/whatsapp/instances" 2>/dev/null || echo '{"success":false}')

    if echo "$zapi_response" | jq -e '.success == true' &>/dev/null; then
        local connected
        connected=$(echo "$zapi_response" | jq -r '.instances[0].realTimeStatus.connected // false')

        if [[ "$connected" == "true" ]]; then
            log_success "Z-API: CONECTADA"

            # Verificar conexão do smartphone
            local smartphone_connected
            smartphone_connected=$(echo "$zapi_response" | jq -r '.instances[0].realTimeStatus.smartphoneConnected // false')

            if [[ "$smartphone_connected" == "true" ]]; then
                log_success "WhatsApp Smartphone: CONECTADO"
            else
                log_warning "WhatsApp Smartphone: DESCONECTADO"
                send_alert "Smartphone WhatsApp desconectado da instância Z-API" "HIGH"
            fi

            return 0
        else
            log_error "Z-API: DESCONECTADA"
            send_alert "Instância Z-API está desconectada" "CRITICAL"
            return 1
        fi
    else
        log_error "Z-API: ERRO NA VERIFICAÇÃO"
        send_alert "Erro ao verificar status da instância Z-API" "HIGH"
        return 1
    fi
}

# Função para verificar métricas
check_metrics() {
    log_info "Verificando métricas do sistema..."

    # Verificar se há mensagens na fila
    if command -v psql &> /dev/null; then
        local queue_count
        queue_count=$(PGPASSWORD=npg_bdaE9x2yiYWL psql -h ep-delicate-pine-a4eh947l.us-east-1.aws.neon.tech -U neondb_owner -d neondb -t -c "SELECT COUNT(*) FROM whatsapp_message_queue WHERE status = 'pending';" 2>/dev/null | xargs || echo "0")

        if [[ "$queue_count" -gt 100 ]]; then
            log_warning "Fila de mensagens: $queue_count mensagens pendentes (alto)"
            send_alert "$queue_count mensagens pendentes na fila (possível gargalo)" "MEDIUM"
        else
            log_success "Fila de mensagens: $queue_count mensagens pendentes"
        fi

        # Verificar taxa de falha nas últimas 24h
        local failed_count
        failed_count=$(PGPASSWORD=npg_bdaE9x2yiYWL psql -h ep-delicate-pine-a4eh947l.us-east-1.aws.neon.tech -U neondb_owner -d neondb -t -c "SELECT COUNT(*) FROM whatsapp_messages WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours';" 2>/dev/null | xargs || echo "0")

        local total_count
        total_count=$(PGPASSWORD=npg_bdaE9x2yiYWL psql -h ep-delicate-pine-a4eh947l.us-east-1.aws.neon.tech -U neondb_owner -d neondb -t -c "SELECT COUNT(*) FROM whatsapp_messages WHERE created_at > NOW() - INTERVAL '24 hours';" 2>/dev/null | xargs || echo "1")

        if [[ "$total_count" -gt 0 ]]; then
            local failure_rate
            failure_rate=$(echo "scale=2; $failed_count * 100 / $total_count" | bc 2>/dev/null || echo "0")

            if (( $(echo "$failure_rate > 10" | bc -l 2>/dev/null || echo 0) )); then
                log_warning "Taxa de falha 24h: ${failure_rate}% ($failed_count/$total_count)"
                send_alert "Alta taxa de falha nas últimas 24h: ${failure_rate}%" "MEDIUM"
            else
                log_success "Taxa de falha 24h: ${failure_rate}% ($failed_count/$total_count)"
            fi
        fi
    fi
}

# Função para verificar logs de erro
check_error_logs() {
    log_info "Verificando logs de erro recentes..."

    # Verificar se há muitos erros nos últimos 30 minutos
    if [[ -f "$LOG_FILE" ]]; then
        local recent_errors
        recent_errors=$(grep -c "ERROR" "$LOG_FILE" | tail -100 | grep "$(date '+%Y-%m-%d %H:')" | wc -l || echo "0")

        if [[ "$recent_errors" -gt 10 ]]; then
            log_warning "Muitos erros recentes: $recent_errors na última hora"
            send_alert "$recent_errors erros detectados na última hora" "MEDIUM"
        else
            log_success "Logs de erro: $recent_errors erros na última hora"
        fi
    fi
}

# Função principal
main() {
    log_info "=== INICIANDO HEALTH CHECK WHATSAPP ==="

    local failed_checks=0
    local total_checks=0

    # Verificações básicas da API
    endpoints=(
        "/api/whatsapp/templates|Templates WhatsApp|200"
        "/api/whatsapp/instances|Instâncias Z-API|200"
        "POST /api/whatsapp/test-connection|Teste de Conexão|200"
    )

    for endpoint_data in "${endpoints[@]}"; do
        IFS='|' read -r endpoint description expected_status <<< "$endpoint_data"
        ((total_checks++))
        if ! check_endpoint "$endpoint" "$description" "$expected_status"; then
            ((failed_checks++))
        fi
    done

    # Verificações específicas
    checks=(
        "check_database"
        "check_zapi"
        "check_metrics"
        "check_error_logs"
    )

    for check_func in "${checks[@]}"; do
        ((total_checks++))
        if ! $check_func; then
            ((failed_checks++))
        fi
    done

    # Resumo final
    log_info "=== RESUMO DO HEALTH CHECK ==="
    log_info "Total de verificações: $total_checks"
    log_info "Verificações com falha: $failed_checks"
    log_info "Verificações bem-sucedidas: $((total_checks - failed_checks))"

    if [[ "$failed_checks" -eq 0 ]]; then
        log_success "✅ SISTEMA WHATSAPP: SAUDÁVEL"
        exit 0
    elif [[ "$failed_checks" -le 2 ]]; then
        log_warning "⚠️ SISTEMA WHATSAPP: ATENÇÃO NECESSÁRIA"
        exit 1
    else
        log_error "🚨 SISTEMA WHATSAPP: PROBLEMAS CRÍTICOS"
        send_alert "Health check falhou em $failed_checks de $total_checks verificações" "CRITICAL"
        exit 2
    fi
}

# Verificar se bc está instalado (para cálculos)
if ! command -v bc &> /dev/null; then
    log_warning "Comando 'bc' não encontrado, alguns cálculos podem falhar"
fi

# Executar apenas se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi