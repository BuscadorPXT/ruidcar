-- Adicionar campo confirmation_code na tabela appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS confirmation_code TEXT;

-- Criar índice para busca rápida por código
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_code
ON appointments(confirmation_code)
WHERE confirmation_code IS NOT NULL;