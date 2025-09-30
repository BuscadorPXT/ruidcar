-- Migration: Migrate workshop_admins to users table and link workshops
-- Date: 2025-09-28
-- Description: Creates users for workshop_admins and links workshops via owner_id

-- First, create the OFICINA_OWNER role if it doesn't exist
INSERT INTO roles (name, description, permissions)
SELECT 'OFICINA_OWNER', 'Proprietário de Oficina', '["manage_workshop", "view_reports", "manage_appointments"]'::json
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE name = 'OFICINA_OWNER'
);

-- Create users from workshop_admins (avoiding duplicates)
INSERT INTO users (username, email, name, password, created_at)
SELECT
  LOWER(REPLACE(wa.email, '@', '_')), -- Generate username from email
  LOWER(wa.email),
  wa.name,
  wa.password,
  wa.created_at
FROM workshop_admins wa
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(wa.email)
)
ON CONFLICT (email) DO NOTHING;

-- Add OFICINA_OWNER role to migrated users
INSERT INTO user_roles (user_id, role_id, organization_id, is_active)
SELECT DISTINCT
  u.id,
  r.id,
  wap.workshop_id,
  true
FROM workshop_admins wa
INNER JOIN users u ON LOWER(u.email) = LOWER(wa.email)
INNER JOIN workshop_admin_permissions wap ON wa.id = wap.admin_id
CROSS JOIN roles r
WHERE r.name = 'OFICINA_OWNER'
  AND wap.can_edit = true
ON CONFLICT DO NOTHING;

-- Update workshops with owner_id based on workshop_admin_permissions
UPDATE workshops w
SET owner_id = subq.user_id
FROM (
  SELECT DISTINCT ON (wap.workshop_id)
    wap.workshop_id,
    u.id as user_id
  FROM workshop_admin_permissions wap
  INNER JOIN workshop_admins wa ON wap.admin_id = wa.id
  INNER JOIN users u ON LOWER(wa.email) = LOWER(u.email)
  WHERE wap.can_edit = true
  ORDER BY wap.workshop_id, wap.created_at ASC
) subq
WHERE w.id = subq.workshop_id
  AND w.owner_id IS NULL;

-- Log the results
DO $$
DECLARE
  migrated_users INTEGER;
  updated_workshops INTEGER;
  total_workshops INTEGER;
BEGIN
  -- Count migrated users
  SELECT COUNT(*) INTO migrated_users
  FROM users u
  WHERE EXISTS (
    SELECT 1 FROM workshop_admins wa
    WHERE LOWER(wa.email) = LOWER(u.email)
  );

  -- Count workshops with owner_id
  SELECT COUNT(*) INTO updated_workshops
  FROM workshops
  WHERE owner_id IS NOT NULL;

  -- Total workshops
  SELECT COUNT(*) INTO total_workshops
  FROM workshops;

  RAISE NOTICE '=====================================';
  RAISE NOTICE 'Migração concluída:';
  RAISE NOTICE 'Usuários migrados: %', migrated_users;
  RAISE NOTICE 'Oficinas com proprietário: %', updated_workshops;
  RAISE NOTICE 'Total de oficinas: %', total_workshops;
  RAISE NOTICE '=====================================';
END $$;