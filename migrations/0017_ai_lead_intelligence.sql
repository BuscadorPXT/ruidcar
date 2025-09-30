-- Migration: Adiciona campos de inteligência artificial para análise de leads
-- Data: 2025-01-30
-- Descrição: Adiciona campos para análise geográfica e IA nos leads

-- Adiciona campos de geolocalização
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS ddd VARCHAR(3);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS ddi VARCHAR(4);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS pais VARCHAR(100);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS continente VARCHAR(50);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS regiao VARCHAR(20);

-- Adiciona campos de análise de IA
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS lead_temperature VARCHAR(10); -- 'hot', 'warm', 'cold'
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS ai_suggestions TEXT[];
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS predicted_conversion_rate DECIMAL(3,2);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS last_ai_analysis TIMESTAMP;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS geo_data JSONB; -- Dados completos de geolocalização

-- Adiciona índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_ddd ON contact_messages(ddd);
CREATE INDEX IF NOT EXISTS idx_contact_messages_estado ON contact_messages(estado);
CREATE INDEX IF NOT EXISTS idx_contact_messages_pais ON contact_messages(pais);
CREATE INDEX IF NOT EXISTS idx_contact_messages_lead_score ON contact_messages(lead_score);
CREATE INDEX IF NOT EXISTS idx_contact_messages_lead_temperature ON contact_messages(lead_temperature);
CREATE INDEX IF NOT EXISTS idx_contact_messages_ai_analysis ON contact_messages USING GIN(ai_analysis);

-- Adiciona comentários nas colunas
COMMENT ON COLUMN contact_messages.ddd IS 'Código DDD brasileiro extraído do telefone';
COMMENT ON COLUMN contact_messages.ddi IS 'Código DDI internacional';
COMMENT ON COLUMN contact_messages.estado IS 'Sigla do estado brasileiro (UF)';
COMMENT ON COLUMN contact_messages.cidade IS 'Cidade principal baseada no DDD';
COMMENT ON COLUMN contact_messages.pais IS 'País identificado pelo DDI';
COMMENT ON COLUMN contact_messages.continente IS 'Continente do lead';
COMMENT ON COLUMN contact_messages.regiao IS 'Região do Brasil (Norte, Sul, etc)';
COMMENT ON COLUMN contact_messages.lead_score IS 'Score de qualidade do lead (0-100)';
COMMENT ON COLUMN contact_messages.lead_temperature IS 'Classificação de temperatura do lead';
COMMENT ON COLUMN contact_messages.ai_analysis IS 'Análise completa da IA em JSON';
COMMENT ON COLUMN contact_messages.ai_suggestions IS 'Sugestões de ação geradas pela IA';
COMMENT ON COLUMN contact_messages.predicted_conversion_rate IS 'Taxa de conversão prevista pela IA (0.00-1.00)';
COMMENT ON COLUMN contact_messages.last_ai_analysis IS 'Data/hora da última análise de IA';
COMMENT ON COLUMN contact_messages.geo_data IS 'Dados geográficos completos em JSON';

-- Cria tabela para armazenar histórico de análises de IA
CREATE TABLE IF NOT EXISTS lead_ai_history (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ai_model VARCHAR(50) DEFAULT 'gemini-pro',
    analysis_data JSONB NOT NULL,
    suggestions TEXT[],
    lead_score INTEGER,
    temperature VARCHAR(10),
    conversion_probability DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS idx_lead_ai_history_lead_id ON lead_ai_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_ai_history_analysis_date ON lead_ai_history(analysis_date);

-- Cria tabela para cache de análises geográficas
CREATE TABLE IF NOT EXISTS geo_cache (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    ddd VARCHAR(3),
    ddi VARCHAR(4),
    estado VARCHAR(2),
    cidade VARCHAR(100),
    pais VARCHAR(100),
    continente VARCHAR(50),
    regiao VARCHAR(20),
    timezone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_geo_cache_phone ON geo_cache(phone_number);

-- Cria view materializada para estatísticas geográficas
CREATE MATERIALIZED VIEW IF NOT EXISTS lead_geographic_stats AS
SELECT
    estado,
    COUNT(*) as total_leads,
    AVG(lead_score) as avg_score,
    SUM(CASE WHEN lead_temperature = 'hot' THEN 1 ELSE 0 END) as hot_leads,
    SUM(CASE WHEN lead_temperature = 'warm' THEN 1 ELSE 0 END) as warm_leads,
    SUM(CASE WHEN lead_temperature = 'cold' THEN 1 ELSE 0 END) as cold_leads,
    AVG(predicted_conversion_rate) as avg_conversion_rate,
    COUNT(DISTINCT cidade) as cities_count
FROM contact_messages
WHERE estado IS NOT NULL
GROUP BY estado;

-- Índice para a view materializada
CREATE INDEX IF NOT EXISTS idx_lead_geographic_stats_estado ON lead_geographic_stats(estado);

-- Função para atualizar automaticamente a análise geográfica
CREATE OR REPLACE FUNCTION update_lead_geo_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Esta função será chamada pelo trigger mas a lógica real
    -- será implementada no backend TypeScript
    -- Por enquanto, apenas retorna NEW sem modificações
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para análise automática de novos leads
CREATE TRIGGER trigger_update_lead_geo
    BEFORE INSERT OR UPDATE OF whatsapp
    ON contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_geo_data();

-- Adiciona configurações do sistema
CREATE TABLE IF NOT EXISTS ai_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insere configurações padrão
INSERT INTO ai_config (config_key, config_value, description) VALUES
    ('gemini_api_key', 'AIzaSyCDnx9BHDhMsUTjIg2gaqUnCKxmfEr2mOM', 'Chave da API do Google Gemini'),
    ('ai_enabled', 'true', 'Ativa/desativa análise de IA'),
    ('auto_analyze_new_leads', 'true', 'Analisa automaticamente novos leads'),
    ('ai_rate_limit_per_hour', '1000', 'Limite de requisições por hora'),
    ('ai_cache_ttl_seconds', '3600', 'Tempo de cache das análises em segundos')
ON CONFLICT (config_key) DO NOTHING;

-- Função para refresh da view materializada
CREATE OR REPLACE FUNCTION refresh_geographic_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY lead_geographic_stats;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE lead_ai_history IS 'Histórico de todas as análises de IA realizadas nos leads';
COMMENT ON TABLE geo_cache IS 'Cache de análises geográficas para evitar reprocessamento';
COMMENT ON TABLE ai_config IS 'Configurações do sistema de IA';
COMMENT ON MATERIALIZED VIEW lead_geographic_stats IS 'Estatísticas agregadas por localização geográfica';

-- Concede permissões (ajuste conforme necessário)
-- GRANT SELECT, INSERT, UPDATE ON contact_messages TO your_app_user;
-- GRANT SELECT, INSERT ON lead_ai_history TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON geo_cache TO your_app_user;
-- GRANT SELECT ON lead_geographic_stats TO your_app_user;
-- GRANT SELECT ON ai_config TO your_app_user;