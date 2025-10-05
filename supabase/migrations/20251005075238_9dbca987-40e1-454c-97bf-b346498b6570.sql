-- Step 1: Add auth_user_id column to link Supabase Auth users (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
  END IF;
END $$;

-- Step 2: Drop ALL existing RLS policies on users and messages tables
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN ('users', 'messages')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, 
      (SELECT tablename FROM pg_policies WHERE policyname = pol.policyname AND schemaname = 'public' LIMIT 1));
  END LOOP;
END $$;

-- Step 3: Create secure RLS policies for users table
CREATE POLICY "Users can view their own full profile"
ON public.users FOR SELECT
USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = auth_user_id);

CREATE POLICY "Users cannot delete accounts"
ON public.users FOR DELETE
USING (false);

-- Step 4: Create secure RLS policies for messages table
CREATE POLICY "Users can view relevant messages"
ON public.messages FOR SELECT
USING (
  is_private = false OR 
  user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR
  recipient_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Authenticated users can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can update own messages"
ON public.messages FOR UPDATE
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete own messages"
ON public.messages FOR DELETE
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Step 5: Create user_roles table for admin functionality
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 7: Add RLS policies for user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Step 8: Update users_admin view with admin role check
DROP VIEW IF EXISTS public.users_admin CASCADE;
CREATE VIEW public.users_admin WITH (security_invoker=on) AS
SELECT u.id, u.username, u.is_online, u.last_seen, u.is_timed_out, 
       u.timeout_until, u.reported_by, u.created_at
FROM public.users u
WHERE public.has_role(auth.uid(), 'admin');

-- Step 9: Create trigger for auto-creating user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, username, is_online, last_seen)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    true,
    now()
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Grant permissions
GRANT SELECT ON public.users_safe TO anon, authenticated;
GRANT SELECT ON public.users_admin TO authenticated;