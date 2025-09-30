-- Migration: Add workshop rejection fields
-- Date: 2025-09-27
-- Description: Adds fields to track workshop rejection status and reason

-- Add rejection tracking fields to workshops table
ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add index for faster queries on rejection status
CREATE INDEX IF NOT EXISTS idx_workshops_rejection_status
ON workshops(active, rejected_at);

-- Add index for pending workshops (active = false and rejected_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_workshops_pending
ON workshops(active)
WHERE active = false AND rejected_at IS NULL;

-- Comment on new columns
COMMENT ON COLUMN workshops.rejected_at IS 'Timestamp when the workshop was rejected';
COMMENT ON COLUMN workshops.rejection_reason IS 'Reason provided by admin for workshop rejection';