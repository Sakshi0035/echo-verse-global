-- Drop the existing view
DROP VIEW IF EXISTS public.users_admin;

-- Create a security definer function that returns admin user data
CREATE OR REPLACE FUNCTION public.get_users_admin()
RETURNS TABLE (
  id uuid,
  username text,
  is_online boolean,
  last_seen timestamp with time zone,
  is_timed_out boolean,
  timeout_until timestamp with time zone,
  reported_by text[],
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    username,
    is_online,
    last_seen,
    is_timed_out,
    timeout_until,
    reported_by,
    created_at
  FROM public.users
  WHERE has_role(auth.uid(), 'admin');
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_users_admin() TO authenticated;

-- Revoke from public
REVOKE EXECUTE ON FUNCTION public.get_users_admin() FROM public;
