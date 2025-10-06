-- Fix 1: Convert users_safe view to a secure function that requires authentication
DROP VIEW IF EXISTS public.users_safe;

CREATE OR REPLACE FUNCTION public.get_users_safe()
RETURNS TABLE (
  id uuid,
  username text,
  is_online boolean,
  last_seen timestamp with time zone,
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
    created_at
  FROM public.users
  WHERE auth.uid() IS NOT NULL;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_users_safe() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_users_safe() FROM public;

-- Fix 2: Require authentication for viewing messages
DROP POLICY IF EXISTS "Users can view relevant messages" ON public.messages;

CREATE POLICY "Authenticated users can view relevant messages"
ON public.messages
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    (is_private = false) OR 
    (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())) OR 
    (recipient_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  )
);
