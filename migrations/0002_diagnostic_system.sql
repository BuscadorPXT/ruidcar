-- Migration: Sistema de Diagnóstico RuidCar
-- Criado em: 2025-01-27
-- Descrição: Adiciona tabelas e campos para o sistema de agendamentos de diagnóstico

-- ========================================
-- 1. ALTERAR TABELA DE AGENDAMENTOS
-- ========================================

-- Adicionar novos campos à tabela appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS vehicle_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS final_price INTEGER,
ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
ADD COLUMN IF NOT EXISTS customer_consent JSONB,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(50) CHECK (cancelled_by IN ('customer', 'workshop', 'system', NULL)),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointments_vehicle_category ON appointments(vehicle_category);
CREATE INDEX IF NOT EXISTS idx_appointments_status_workshop ON appointments(workshop_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- ========================================
-- 2. CONFIGURAÇÃO DO SERVIÇO DE DIAGNÓSTICO
-- ========================================

CREATE TABLE IF NOT EXISTS diagnostic_service_config (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER NOT NULL UNIQUE REFERENCES workshops(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'disabled' CHECK (status IN ('disabled', 'configuring', 'active', 'suspended')),
    suspension_reason TEXT,
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diagnostic_config_workshop ON diagnostic_service_config(workshop_id);
CREATE INDEX idx_diagnostic_config_status ON diagnostic_service_config(status);

-- ========================================
-- 3. PREÇOS POR CATEGORIA DE VEÍCULO
-- ========================================

CREATE TABLE IF NOT EXISTS vehicle_pricing (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('popular', 'medium', 'luxury')),
    price INTEGER NOT NULL CHECK (price > 0),
    estimated_duration INTEGER DEFAULT 60 CHECK (estimated_duration > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Garantir apenas um preço ativo por categoria por oficina
    UNIQUE(workshop_id, category)
);

CREATE INDEX idx_vehicle_pricing_workshop ON vehicle_pricing(workshop_id);
CREATE INDEX idx_vehicle_pricing_category ON vehicle_pricing(category);

-- ========================================
-- 4. SLOTS DE DISPONIBILIDADE
-- ========================================

CREATE TABLE IF NOT EXISTS appointment_slots (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER DEFAULT 1 CHECK (capacity > 0),
    buffer_minutes INTEGER DEFAULT 15 CHECK (buffer_minutes >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Garantir horários válidos
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_appointment_slots_workshop ON appointment_slots(workshop_id);
CREATE INDEX idx_appointment_slots_day ON appointment_slots(day_of_week);
CREATE INDEX idx_appointment_slots_active ON appointment_slots(is_active);

-- ========================================
-- 5. EXCEÇÕES DE AGENDA
-- ========================================

CREATE TABLE IF NOT EXISTS appointment_exceptions (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('holiday', 'blocked', 'special')),
    start_time TIME,
    end_time TIME,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Garantir horários válidos quando especificados
    CONSTRAINT valid_exception_time CHECK (
        (start_time IS NULL AND end_time IS NULL) OR
        (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
    )
);

CREATE INDEX idx_appointment_exceptions_workshop ON appointment_exceptions(workshop_id);
CREATE INDEX idx_appointment_exceptions_date ON appointment_exceptions(date);

-- ========================================
-- 6. CONFIGURAÇÕES GERAIS DE AGENDAMENTO
-- ========================================

CREATE TABLE IF NOT EXISTS appointment_settings (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER NOT NULL UNIQUE REFERENCES workshops(id) ON DELETE CASCADE,
    min_advance_hours INTEGER DEFAULT 2 CHECK (min_advance_hours >= 0),
    max_advance_days INTEGER DEFAULT 30 CHECK (max_advance_days > 0),
    cancellation_hours INTEGER DEFAULT 24 CHECK (cancellation_hours >= 0),
    no_show_tolerance INTEGER DEFAULT 15 CHECK (no_show_tolerance >= 0),
    auto_confirm BOOLEAN DEFAULT false,
    send_reminders BOOLEAN DEFAULT true,
    reminder_hours INTEGER DEFAULT 24 CHECK (reminder_hours > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointment_settings_workshop ON appointment_settings(workshop_id);

-- ========================================
-- 7. TRIGGER PARA ATUALIZAR UPDATED_AT
-- ========================================

-- Função para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas que precisam
DROP TRIGGER IF EXISTS update_diagnostic_service_config_updated_at ON diagnostic_service_config;
CREATE TRIGGER update_diagnostic_service_config_updated_at
    BEFORE UPDATE ON diagnostic_service_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_pricing_updated_at ON vehicle_pricing;
CREATE TRIGGER update_vehicle_pricing_updated_at
    BEFORE UPDATE ON vehicle_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointment_slots_updated_at ON appointment_slots;
CREATE TRIGGER update_appointment_slots_updated_at
    BEFORE UPDATE ON appointment_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointment_settings_updated_at ON appointment_settings;
CREATE TRIGGER update_appointment_settings_updated_at
    BEFORE UPDATE ON appointment_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 8. DADOS INICIAIS (OPCIONAL)
-- ========================================

-- Inserir configurações padrão para oficinas existentes
INSERT INTO diagnostic_service_config (workshop_id, is_active, status)
SELECT id, false, 'disabled' FROM workshops
WHERE NOT EXISTS (
    SELECT 1 FROM diagnostic_service_config
    WHERE diagnostic_service_config.workshop_id = workshops.id
);

-- Inserir configurações de agendamento padrão para oficinas existentes
INSERT INTO appointment_settings (workshop_id)
SELECT id FROM workshops
WHERE NOT EXISTS (
    SELECT 1 FROM appointment_settings
    WHERE appointment_settings.workshop_id = workshops.id
);

-- ========================================
-- 9. COMENTÁRIOS NAS TABELAS
-- ========================================

COMMENT ON TABLE diagnostic_service_config IS 'Configuração do serviço de diagnóstico por oficina';
COMMENT ON TABLE vehicle_pricing IS 'Preços por categoria de veículo para cada oficina';
COMMENT ON TABLE appointment_slots IS 'Slots de disponibilidade recorrentes por dia da semana';
COMMENT ON TABLE appointment_exceptions IS 'Exceções de agenda (feriados, bloqueios especiais)';
COMMENT ON TABLE appointment_settings IS 'Configurações gerais de agendamento por oficina';

COMMENT ON COLUMN diagnostic_service_config.status IS 'Status do serviço: disabled, configuring, active, suspended';
COMMENT ON COLUMN vehicle_pricing.category IS 'Categoria do veículo: popular, medium, luxury';
COMMENT ON COLUMN appointment_slots.day_of_week IS 'Dia da semana: 0=Domingo, 6=Sábado';
COMMENT ON COLUMN appointment_exceptions.type IS 'Tipo de exceção: holiday, blocked, special';

-- ========================================
-- 10. GRANTS (se necessário)
-- ========================================

-- Ajustar conforme necessário para seu ambiente de produção
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO seu_usuario_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO seu_usuario_app;