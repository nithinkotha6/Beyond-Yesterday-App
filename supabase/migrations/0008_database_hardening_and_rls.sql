-- =============================================================================
-- DATABASE HARDENING, INDEX OPTIMIZATIONS, & GROUP-SCOPED RLS POLICIES
-- =============================================================================

-- 1. Add whatsapp configuration columns to public.groups table
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS whatsapp_instance_id text DEFAULT NULL;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS whatsapp_token text DEFAULT NULL;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS whatsapp_group_id text DEFAULT NULL;

-- 2. Add group_id to metric_definitions table
ALTER TABLE public.metric_definitions ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS metric_definitions_group_id_idx ON public.metric_definitions (group_id);

-- 3. Create helper index on memories for optimization
CREATE INDEX IF NOT EXISTS memories_created_at_idx ON public.memories (created_at DESC);
CREATE INDEX IF NOT EXISTS memories_deleted_at_idx ON public.memories (deleted_at);

-- 4. Enable Row Level Security (RLS) on all dynamic tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_definitions ENABLE ROW LEVEL SECURITY;

-- 5. Drop any existing policies to avoid duplicates
DROP POLICY IF EXISTS profiles_group_isolation ON public.profiles;
DROP POLICY IF EXISTS group_members_group_isolation ON public.group_members;
DROP POLICY IF EXISTS metric_logs_group_isolation ON public.metric_logs;
DROP POLICY IF EXISTS log_votes_group_isolation ON public.log_votes;
DROP POLICY IF EXISTS memories_group_isolation ON public.memories;
DROP POLICY IF EXISTS memory_comments_group_isolation ON public.memory_comments;
DROP POLICY IF EXISTS metric_definitions_group_isolation ON public.metric_definitions;

-- 6. Re-create secure Group-Scoped RLS Policies using PostgREST Request Headers
CREATE POLICY profiles_group_isolation ON public.profiles
  FOR ALL
  TO anon, authenticated
  USING (
    id IN (
      SELECT user_id FROM public.group_members
      WHERE group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid
    )
  );

CREATE POLICY group_members_group_isolation ON public.group_members
  FOR ALL
  TO anon, authenticated
  USING (group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid)
  WITH CHECK (group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid);

CREATE POLICY metric_logs_group_isolation ON public.metric_logs
  FOR ALL
  TO anon, authenticated
  USING (group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid)
  WITH CHECK (group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid);

CREATE POLICY log_votes_group_isolation ON public.log_votes
  FOR ALL
  TO anon, authenticated
  USING (
    log_id IN (
      SELECT id FROM public.metric_logs
      WHERE group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid
    )
  )
  WITH CHECK (
    log_id IN (
      SELECT id FROM public.metric_logs
      WHERE group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid
    )
  );

CREATE POLICY memories_group_isolation ON public.memories
  FOR ALL
  TO anon, authenticated
  USING (group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid)
  WITH CHECK (group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid);

CREATE POLICY memory_comments_group_isolation ON public.memory_comments
  FOR ALL
  TO anon, authenticated
  USING (
    memory_id IN (
      SELECT id FROM public.memories
      WHERE group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid
    )
  )
  WITH CHECK (
    memory_id IN (
      SELECT id FROM public.memories
      WHERE group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid
    )
  );

CREATE POLICY metric_definitions_group_isolation ON public.metric_definitions
  FOR ALL
  TO anon, authenticated
  USING (group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid)
  WITH CHECK (group_id = nullif(current_setting('request.headers', true)::json->>'x-group-id', '')::uuid);

-- Ensure all privileges are granted to postgres, authenticated, anon, and service_role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
