-- Migration: Add lead management fields to contact_messages table
-- Date: 2025-09-29
-- Purpose: Support internal lead management system

-- First add status column if it doesn't exist
ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Add other new columns for lead management
ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS next_action_date DATE,
ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_interaction TIMESTAMP,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Create index for assigned_to for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_assigned_to ON contact_messages(assigned_to);

-- Create index for status for pipeline queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- Create index for created_at for date-based queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);

-- Create index for lead_score for sorting
CREATE INDEX IF NOT EXISTS idx_contact_messages_lead_score ON contact_messages(lead_score DESC);

-- Update existing records to have default status
UPDATE contact_messages
SET status = 'new'
WHERE status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN contact_messages.status IS 'Lead status in the pipeline';
COMMENT ON COLUMN contact_messages.assigned_to IS 'User ID of the person responsible for this lead';
COMMENT ON COLUMN contact_messages.lead_score IS 'Calculated score based on lead quality (0-100)';
COMMENT ON COLUMN contact_messages.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN contact_messages.next_action_date IS 'Date for next scheduled action';
COMMENT ON COLUMN contact_messages.conversion_date IS 'Date when lead was converted to customer';
COMMENT ON COLUMN contact_messages.rejection_reason IS 'Reason if lead was rejected or lost';
COMMENT ON COLUMN contact_messages.internal_notes IS 'Internal notes not visible to customer';
COMMENT ON COLUMN contact_messages.interaction_count IS 'Total number of interactions with this lead';
COMMENT ON COLUMN contact_messages.last_interaction IS 'Timestamp of last interaction';
COMMENT ON COLUMN contact_messages.city IS 'Lead city location';
COMMENT ON COLUMN contact_messages.state IS 'Lead state/province location';