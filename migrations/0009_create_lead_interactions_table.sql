-- Migration: Create lead_interactions table
-- Date: 2025-09-29
-- Purpose: Track all interactions with leads

-- Create lead_interactions table
CREATE TABLE IF NOT EXISTS lead_interactions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('note', 'call', 'email', 'whatsapp', 'meeting', 'system')),
    content TEXT,
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_user_id ON lead_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_type ON lead_interactions(type);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_scheduled_at ON lead_interactions(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE lead_interactions IS 'Stores all interactions with leads including notes, calls, emails, etc.';
COMMENT ON COLUMN lead_interactions.lead_id IS 'Reference to the lead (contact_messages table)';
COMMENT ON COLUMN lead_interactions.user_id IS 'User who created this interaction';
COMMENT ON COLUMN lead_interactions.type IS 'Type of interaction: note, call, email, whatsapp, meeting, system';
COMMENT ON COLUMN lead_interactions.content IS 'Content or description of the interaction';
COMMENT ON COLUMN lead_interactions.scheduled_at IS 'When this interaction is/was scheduled for';
COMMENT ON COLUMN lead_interactions.completed_at IS 'When this interaction was completed';
COMMENT ON COLUMN lead_interactions.created_at IS 'When this record was created';
COMMENT ON COLUMN lead_interactions.updated_at IS 'When this record was last updated';

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_lead_interactions_updated_at ON lead_interactions;
CREATE TRIGGER update_lead_interactions_updated_at
    BEFORE UPDATE ON lead_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();