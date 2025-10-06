-- Clear all existing chat messages and reset the chat
TRUNCATE TABLE public.messages CASCADE;

-- Note: Keeping users table intact but clearing messages
-- Users will need to re-authenticate after auth changes