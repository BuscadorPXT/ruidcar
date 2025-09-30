-- Migration: Update remaining workshops without owner_id
-- Date: 2025-09-28
-- Description: Links remaining active workshops to their owners based on workshop_admin_permissions

-- First, ensure all workshop_admins have corresponding users
INSERT INTO users (username, email, name, password, created_at)
SELECT
  LOWER(REPLACE(wa.email, '@', '_')),
  LOWER(wa.email),
  wa.name,
  wa.password,
  wa.created_at
FROM workshop_admins wa
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(wa.email)
)
ON CONFLICT (email) DO NOTHING;

-- Ensure OFICINA_OWNER role exists
INSERT INTO roles (name, description, permissions)
SELECT 'OFICINA_OWNER', 'Proprietário de Oficina', '["manage_workshop", "view_reports", "manage_appointments"]'::json
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE name = 'OFICINA_OWNER'
);

-- Add OFICINA_OWNER role to workshop admins
INSERT INTO user_roles (user_id, role_id, organization_id, is_active)
SELECT DISTINCT
  u.id,
  r.id,
  wap.workshop_id,
  true
FROM workshop_admin_permissions wap
INNER JOIN workshop_admins wa ON wap.admin_id = wa.id
INNER JOIN users u ON LOWER(u.email) = LOWER(wa.email)
CROSS JOIN roles r
WHERE r.name = 'OFICINA_OWNER'
  AND wap.can_edit = true
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id
      AND ur.role_id = r.id
      AND ur.organization_id = wap.workshop_id
  );

-- Update workshops with owner_id for active workshops without owner
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
  AND w.owner_id IS NULL
  AND w.active = true;

-- Log the results
DO $$
DECLARE
  workshops_with_owner INTEGER;
  workshops_without_owner INTEGER;
  active_without_owner INTEGER;
BEGIN
  -- Count workshops with owner_id
  SELECT COUNT(*) INTO workshops_with_owner
  FROM workshops
  WHERE owner_id IS NOT NULL;

  -- Count workshops without owner_id
  SELECT COUNT(*) INTO workshops_without_owner
  FROM workshops
  WHERE owner_id IS NULL;

  -- Count active workshops without owner_id
  SELECT COUNT(*) INTO active_without_owner
  FROM workshops
  WHERE owner_id IS NULL AND active = true;

  RAISE NOTICE '=====================================';
  RAISE NOTICE 'Atualização concluída:';
  RAISE NOTICE 'Oficinas com proprietário: %', workshops_with_owner;
  RAISE NOTICE 'Oficinas sem proprietário: %', workshops_without_owner;
  RAISE NOTICE 'Oficinas ativas sem proprietário: %', active_without_owner;
  RAISE NOTICE '=====================================';
END $$;