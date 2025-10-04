-- Fresh reset migration: wipe existing app data and prevent duplicates
-- 1) Truncate data (messages first, then users)
TRUNCATE TABLE public.messages RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;

-- 2) Ensure unique usernames to avoid duplicates like "Democheck"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_username_key'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
END $$;