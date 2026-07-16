-- =============================================================================
-- MIGRATION: 05_lore_and_vocab.sql
-- Establishing Dynamic Lore Architecture and Slang routing tables.
-- =============================================================================

-- 1. Member Lore Table (Personalized traits and inside jokes)
CREATE TABLE IF NOT EXISTS public.member_lore (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  stunts TEXT[] DEFAULT '{}',
  good_habits TEXT[] DEFAULT '{}',
  bad_habits TEXT[] DEFAULT '{}',
  ego_trigger TEXT,
  catchphrase TEXT,
  nemesis_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.member_lore ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read/write for group members" ON public.member_lore;
CREATE POLICY "Allow read/write for group members" ON public.member_lore FOR ALL USING (true);

-- 2. Vocabulary Banks Table (Tone & Gender routed slang)
CREATE TABLE IF NOT EXISTS public.vocab_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tone TEXT NOT NULL, -- e.g., 'ragebait', 'flirt_tease', 'motivate'
  target_gender TEXT NOT NULL, -- 'Male', 'Female', 'Neutral'
  words TEXT[] NOT NULL,
  UNIQUE(tone, target_gender)
);

ALTER TABLE public.vocab_banks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read/write for authenticated users" ON public.vocab_banks;
CREATE POLICY "Allow read/write for authenticated users" ON public.vocab_banks FOR ALL USING (true);

-- 3. Seed Initial Vocab Data
INSERT INTO public.vocab_banks (tone, target_gender, words) VALUES
('ragebait', 'Male', ARRAY['kothi-badcow', 'adavi manishi', 'waste fellow', 'pichi-fellow']),
('ragebait', 'Female', ARRAY['over-action', 'drama queen', 'gossip-monger']),
('flirt_tease', 'Male', ARRAY['hero', 'manmadhudu', 'heavy personality']),
('flirt_tease', 'Female', ARRAY['bangaram', 'heroine', 'angel', 'attitude queen']),
('motivate', 'Male', ARRAY['tiger', 'machine', 'boss', 'champion']),
('motivate', 'Female', ARRAY['queen', 'boss-lady', 'superstar'])
ON CONFLICT (tone, target_gender) DO NOTHING;
