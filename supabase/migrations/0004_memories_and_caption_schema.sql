-- =============================================================================
-- MEMORIES, MEMORY COMMENTS, AND LOG CAPTIONS MIGRATION
-- =============================================================================

-- 1. Add caption and duration_seconds columns to metric_logs if they do not exist
ALTER TABLE public.metric_logs ADD COLUMN IF NOT EXISTS caption text;
ALTER TABLE public.metric_logs ADD COLUMN IF NOT EXISTS duration_seconds integer;

-- 2. Create memories table
CREATE TABLE IF NOT EXISTS public.memories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memories_group_id_idx ON public.memories (group_id);
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON public.memories (user_id);

-- 3. Create memory_comments table
CREATE TABLE IF NOT EXISTS public.memory_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id uuid NOT NULL REFERENCES public.memories (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memory_comments_memory_id_idx ON public.memory_comments (memory_id);
CREATE INDEX IF NOT EXISTS memory_comments_user_id_idx ON public.memory_comments (user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_comments ENABLE ROW LEVEL SECURITY;

-- Grant privileges to postgres and service_role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
