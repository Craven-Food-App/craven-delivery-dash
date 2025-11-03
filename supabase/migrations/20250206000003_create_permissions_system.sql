-- Permissions system: catalog, role-based mapping, user overrides, effective view, helper function, and RLS

-- 1) Permission catalog
CREATE TABLE IF NOT EXISTS public.permissions (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT
);

-- 2) Role (position) to permission mapping
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  allowed BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (position_id, permission_key)
);

-- 3) Per-user overrides (optional)
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  allowed BOOLEAN NOT NULL,
  UNIQUE (user_id, permission_key)
);

-- 4) Effective permissions materialized view
DROP MATERIALIZED VIEW IF EXISTS public.effective_permissions;
CREATE MATERIALIZED VIEW public.effective_permissions AS
SELECT
  u.id AS user_id,
  p.key AS permission_key,
  COALESCE(
    -- Per-user override takes precedence
    (
      SELECT upo.allowed
      FROM public.user_permission_overrides upo
      WHERE upo.user_id = u.id AND upo.permission_key = p.key
      LIMIT 1
    ),
    -- Role permission via employee's position
    (
      SELECT rp.allowed
      FROM public.employees e
      JOIN public.role_permissions rp ON rp.position_id = e.position_id
      WHERE e.user_id = u.id AND rp.permission_key = p.key
      LIMIT 1
    ),
    false
  ) AS allowed
FROM auth.users u
CROSS JOIN public.permissions p;

-- 5) Fast lookup function (CEO always allowed)
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  is_ceo BOOLEAN := false;
  eff_allowed BOOLEAN := false;
BEGIN
  -- CEO always has full access (exec_users.role contains 'ceo')
  SELECT EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = p_user_id AND eu.role ILIKE '%ceo%'
  ) INTO is_ceo;

  IF is_ceo THEN
    RETURN true;
  END IF;

  SELECT ep.allowed
    FROM public.effective_permissions ep
    WHERE ep.user_id = p_user_id AND ep.permission_key = p_permission
    LIMIT 1
    INTO eff_allowed;

  RETURN COALESCE(eff_allowed, false);
END;
$$;

-- 6) RLS enablement
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

-- CEO/Admin can manage mappings
DROP POLICY IF EXISTS "CEO/Admin manage role_permissions" ON public.role_permissions;
CREATE POLICY "CEO/Admin manage role_permissions"
ON public.role_permissions FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users eu WHERE eu.user_id = auth.uid() AND eu.role ILIKE '%ceo%')
  OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('admin','super_admin'))
);

DROP POLICY IF EXISTS "CEO/Admin manage user overrides" ON public.user_permission_overrides;
CREATE POLICY "CEO/Admin manage user overrides"
ON public.user_permission_overrides FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users eu WHERE eu.user_id = auth.uid() AND eu.role ILIKE '%ceo%')
  OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.role IN ('admin','super_admin'))
);

-- 7) Seed a starter set (idempotent)
INSERT INTO public.permissions (key, label, module, description) VALUES
  ('hub.view', 'View Main Hub', 'core', 'Access to Main Hub'),
  ('marketing.view', 'View Marketing Portal', 'marketing', 'Open Marketing Portal'),
  ('marketing.manage', 'Manage Marketing', 'marketing', 'Create campaigns, manage ads'),
  ('hr.view', 'View HR Portal', 'hr', 'Open HR Portal'),
  ('hr.employees.edit', 'Edit Employee Records', 'hr', 'Edit employee profiles'),
  ('hr.permissions.manage', 'Manage Permissions', 'hr', 'Edit role/user permissions'),
  ('finance.view', 'View CFO Portal', 'finance', 'Open CFO Portal'),
  ('finance.payouts.view', 'View Payouts', 'finance', 'View payout data'),
  ('admin.view', 'View Admin Portal', 'admin', 'Open Admin Portal')
ON CONFLICT (key) DO NOTHING;

-- 8) Helper to refresh effective view
CREATE OR REPLACE FUNCTION public.refresh_effective_permissions()
RETURNS void LANGUAGE sql AS $$
  REFRESH MATERIALIZED VIEW public.effective_permissions;
$$;

COMMENT ON FUNCTION public.has_permission IS 'Returns whether a user has a specific permission (CEO always allowed).';
COMMENT ON FUNCTION public.refresh_effective_permissions IS 'Refreshes the effective_permissions materialized view.';

-- 9) Seed role-to-permission mappings by position code (idempotent)
-- This makes it trivial: set a position and they get the right portal access
WITH role_perm_seed AS (
  SELECT * FROM (
    VALUES
      ('ceo', 'hub.view'),
      ('ceo', 'admin.view'),
      ('ceo', 'marketing.view'),
      ('ceo', 'marketing.manage'),
      ('ceo', 'hr.view'),
      ('ceo', 'hr.employees.edit'),
      ('ceo', 'hr.permissions.manage'),
      ('ceo', 'finance.view'),
      ('ceo', 'finance.payouts.view'),

      ('cfo', 'hub.view'),
      ('cfo', 'finance.view'),
      ('cfo', 'finance.payouts.view'),

      ('hr-manager', 'hub.view'),
      ('hr-manager', 'hr.view'),
      ('hr-manager', 'hr.employees.edit'),
      ('hr-manager', 'hr.permissions.manage'),

      ('marketing-manager', 'hub.view'),
      ('marketing-manager', 'marketing.view'),
      ('marketing-manager', 'marketing.manage')
  ) AS v(code, permission_key)
)
INSERT INTO public.role_permissions (position_id, permission_key, allowed)
SELECT p.id, rps.permission_key, true
FROM role_perm_seed rps
JOIN public.positions p ON p.code = rps.code AND p.is_active = true
JOIN public.permissions perm ON perm.key = rps.permission_key
LEFT JOIN public.role_permissions rp
  ON rp.position_id = p.id AND rp.permission_key = rps.permission_key
WHERE rp.id IS NULL;

-- Refresh effective permissions after seeding
SELECT public.refresh_effective_permissions();


