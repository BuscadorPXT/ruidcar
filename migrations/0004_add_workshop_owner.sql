-- Migration: Add workshop owner relationship
-- Date: 2025-09-28
-- Description: Adds owner_id field to workshops table to link workshops with users

-- Add owner_id field to workshops table
ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_workshops_owner
ON workshops(owner_id);

-- Comment on new column
COMMENT ON COLUMN workshops.owner_id IS 'User ID of the workshop owner from the users table';