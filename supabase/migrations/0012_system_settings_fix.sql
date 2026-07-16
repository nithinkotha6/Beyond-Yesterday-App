-- ---------------------------------------------------------------------------
-- TABLE: system_settings RLS Isolation & Access
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
  key   text PRIMARY KEY,
  value text NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existings to prevent duplication errors
DROP POLICY IF EXISTS "Allow read/write for authenticated users" ON public.system_settings;
DROP POLICY IF EXISTS "Allow select on system_settings to anonymous" ON public.system_settings;
DROP POLICY IF EXISTS "Allow service role full access on system_settings" ON public.system_settings;

-- Create policies
CREATE POLICY "Allow service role full access on system_settings"
  ON public.system_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow select on system_settings to anonymous"
  ON public.system_settings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow read/write for authenticated users"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
