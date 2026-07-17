-- =============================================================================
-- MIGRATION: 0017_bot_persistent_state.sql
-- Create persistent bot mood storage table with group-scoped isolation.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bot_persistent_state (
  group_id UUID PRIMARY KEY REFERENCES public.groups(id) ON DELETE CASCADE,
  persistent_mood TEXT NOT NULL DEFAULT 'Normal' CHECK (persistent_mood IN ('Normal', 'Angry', 'Sad', 'Horny', 'Happy', 'Flirting', 'Romantic', 'Arrogant', 'Sarcastic')),
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bot_persistent_state ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS bot_persistent_state_group_isolation ON public.bot_persistent_state;
DROP POLICY IF EXISTS "Allow service role full access on bot_persistent_state" ON public.bot_persistent_state;

-- Create policies
CREATE POLICY bot_persistent_state_group_isolation ON public.bot_persistent_state
  FOR ALL
  TO anon, authenticated
  USING (group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid)
  WITH CHECK (group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid);

CREATE POLICY "Allow service role full access on bot_persistent_state"
  ON public.bot_persistent_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant privileges to postgres and service_role
GRANT ALL PRIVILEGES ON TABLE public.bot_persistent_state TO postgres, service_role;
