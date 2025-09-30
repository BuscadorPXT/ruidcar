-- Migration: Create lead_status_history table
-- Date: 2025-09-29
-- Purpose: Track status changes history for leads

-- Create lead_status_history table
CREATE TABLE IF NOT EXISTS lead_status_history (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_lead_status_history_lead_id ON lead_status_history(lead_id);
CREATE INDEX idx_lead_status_history_changed_by ON lead_status_history(changed_by);
CREATE INDEX idx_lead_status_history_created_at ON lead_status_history(created_at DESC);
CREATE INDEX idx_lead_status_history_new_status ON lead_status_history(new_status);

-- Add comments for documentation
COMMENT ON TABLE lead_status_history IS 'Audit trail of all status changes for leads';
COMMENT ON COLUMN lead_status_history.lead_id IS 'Reference to the lead (contact_messages table)';
COMMENT ON COLUMN lead_status_history.old_status IS 'Previous status before the change';
COMMENT ON COLUMN lead_status_history.new_status IS 'New status after the change';
COMMENT ON COLUMN lead_status_history.changed_by IS 'User who made the status change';
COMMENT ON COLUMN lead_status_history.reason IS 'Reason for status change (especially for rejection/lost)';
COMMENT ON COLUMN lead_status_history.notes IS 'Additional notes about the status change';
COMMENT ON COLUMN lead_status_history.created_at IS 'When this status change occurred';

-- Create a trigger to automatically log status changes
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO lead_status_history (
            lead_id,
            old_status,
            new_status,
            changed_by,
            created_at
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.assigned_to, 1), -- Use assigned_to or default to 1 (admin)
            CURRENT_TIMESTAMP
        );

        -- Update interaction count and last interaction
        NEW.interaction_count = COALESCE(OLD.interaction_count, 0) + 1;
        NEW.last_interaction = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on contact_messages table to log status changes
CREATE TRIGGER trigger_log_lead_status_change
    AFTER UPDATE OF status ON contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_status_change();

-- Insert initial status history for existing records
INSERT INTO lead_status_history (lead_id, new_status, changed_by, reason, created_at)
SELECT
    id,
    COALESCE(status, 'new'),
    COALESCE(user_id, 1),
    'Initial import from existing data',
    COALESCE(created_at, CURRENT_TIMESTAMP)
FROM contact_messages
WHERE NOT EXISTS (
    SELECT 1 FROM lead_status_history
    WHERE lead_status_history.lead_id = contact_messages.id
);