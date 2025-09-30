-- Migration: Link existing workshops to users based on workshop_admins
-- Date: 2025-09-28
-- Description: Updates workshops with owner_id based on workshop_admins emails

-- Update workshops with owner_id where there's a matching user email
UPDATE workshops w
SET owner_id = u.id
FROM workshop_admin_permissions wap
INNER JOIN workshop_admins wa ON wap.admin_id = wa.id
INNER JOIN users u ON LOWER(wa.email) = LOWER(u.email)
WHERE w.id = wap.workshop_id
  AND w.owner_id IS NULL
  AND wap.can_edit = true;

-- Log the results
DO $$
DECLARE
  updated_count INTEGER;
  workshops_without_owner INTEGER;
BEGIN
  -- Count workshops that were updated
  SELECT COUNT(*) INTO updated_count
  FROM workshops
  WHERE owner_id IS NOT NULL;

  -- Count workshops still without owner
  SELECT COUNT(*) INTO workshops_without_owner
  FROM workshops
  WHERE owner_id IS NULL;

  RAISE NOTICE 'Workshops com owner_id definido: %', updated_count;
  RAISE NOTICE 'Workshops sem owner_id: %', workshops_without_owner;
END $$;