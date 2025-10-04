-- Fix: Convert views to SECURITY INVOKER mode
-- This ensures views respect RLS policies of the querying user

-- 1) Recreate users_safe view with SECURITY INVOKER
DROP VIEW IF EXISTS public.users_safe CASCADE;
CREATE VIEW public.users_safe 
WITH (security_invoker=on) AS
SELECT 
  id,
  username,
  is_online,
  last_seen,
  created_at
FROM public.users;

-- 2) Recreate users_admin view with SECURITY INVOKER
DROP VIEW IF EXISTS public.users_admin CASCADE;
CREATE VIEW public.users_admin
WITH (security_invoker=on) AS
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