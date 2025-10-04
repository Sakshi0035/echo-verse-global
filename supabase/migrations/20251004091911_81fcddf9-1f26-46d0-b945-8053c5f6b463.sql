-- Remove password storage since Clerk handles authentication
-- and improve data security

-- 1) Remove password_hash column entirely (not needed with Clerk)
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- 2) Update the safe view to be more restrictive
DROP VIEW IF EXISTS public.users_safe CASCADE;
CREATE VIEW public.users_safe AS
SELECT 
  id,
  username,
  is_online,
  last_seen,
  created_at
  -- Excluded: is_timed_out, timeout_until, reported_by (admin-only data)
FROM public.users;

-- 3) Create admin view for moderation data (separate access)
CREATE VIEW public.users_admin AS
SELECT 
  id,
  username,
  is_online,
  last_seen,
  is_timed_out,
  timeout_until,
  reported_by,
  created_at
FROM public.users;

-- Grant appropriate access
GRANT SELECT ON public.users_safe TO anon, authenticated;
-- users_admin view has no grants (admin access only via service role)