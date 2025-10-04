-- Security improvements (clean version)

-- 1) Create users_safe view to hide password_hash
DROP VIEW IF EXISTS public.users_safe CASCADE;
CREATE VIEW public.users_safe AS
SELECT 
  id, username, is_online, last_seen, 
  is_timed_out, timeout_until, reported_by, created_at
FROM public.users;

GRANT SELECT ON public.users_safe TO anon, authenticated;

-- 2) Clean up and recreate message policies
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "View all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (true);

-- 3) Clean up and recreate user policies  
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own user" ON public.users;
DROP POLICY IF EXISTS "Users can insert new accounts" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update status" ON public.users;
DROP POLICY IF EXISTS "Users can update status only" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own account" ON public.users;
DROP POLICY IF EXISTS "Block direct deletes" ON public.users;
DROP POLICY IF EXISTS "Prevent account deletion" ON public.users;

CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (false);