-- Rollback Migration: Sistema de Diagnóstico RuidCar
-- Use este script para reverter as alterações caso necessário

-- ========================================
-- 1. REMOVER TRIGGERS
-- ========================================

DROP TRIGGER IF EXISTS update_diagnostic_service_config_updated_at ON diagnostic_service_config;
DROP TRIGGER IF EXISTS update_vehicle_pricing_updated_at ON vehicle_pricing;
DROP TRIGGER IF EXISTS update_appointment_slots_updated_at ON appointment_slots;
DROP TRIGGER IF EXISTS update_appointment_settings_updated_at ON appointment_settings;

-- ========================================
-- 2. REMOVER TABELAS (ordem reversa de dependências)
-- ========================================

DROP TABLE IF EXISTS appointment_settings CASCADE;
DROP TABLE IF EXISTS appointment_exceptions CASCADE;
DROP TABLE IF EXISTS appointment_slots CASCADE;
DROP TABLE IF EXISTS vehicle_pricing CASCADE;
DROP TABLE IF EXISTS diagnostic_service_config CASCADE;

-- ========================================
-- 3. REMOVER COLUNAS ADICIONADAS EM APPOINTMENTS
-- ========================================

ALTER TABLE appointments
DROP COLUMN IF EXISTS vehicle_category,
DROP COLUMN IF EXISTS final_price,
DROP COLUMN IF EXISTS check_in_time,
DROP COLUMN IF EXISTS check_out_time,
DROP COLUMN IF EXISTS service_rating,
DROP COLUMN IF EXISTS customer_consent,
DROP COLUMN IF EXISTS reminder_sent_at,
DROP COLUMN IF EXISTS cancelled_by,
DROP COLUMN IF EXISTS cancellation_reason;

-- ========================================
-- 4. REMOVER ÍNDICES
-- ========================================

DROP INDEX IF EXISTS idx_appointments_vehicle_category;
DROP INDEX IF EXISTS idx_appointments_status_workshop;
DROP INDEX IF EXISTS idx_appointments_date;