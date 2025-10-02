-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  is_timed_out BOOLEAN DEFAULT false,
  timeout_until TIMESTAMPTZ,
  reported_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video')),
  image_url TEXT,
  is_private BOOLEAN DEFAULT false,
  recipient_id UUID,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  reaction JSONB DEFAULT '{}',
  read_by TEXT DEFAULT '[]',
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table (public read for online users, authenticated write)
CREATE POLICY "Users are viewable by everyone"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own user"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own account"
  ON public.users
  FOR DELETE
  USING (true);

-- RLS Policies for messages table
CREATE POLICY "Messages are viewable by everyone"
  ON public.messages
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own messages"
  ON public.messages
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own messages"
  ON public.messages
  FOR DELETE
  USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Set replica identity for real-time updates
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;