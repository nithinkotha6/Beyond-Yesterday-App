-- 1. Ensure user_id and source columns exist on wearable_steps
ALTER TABLE public.wearable_steps ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.wearable_steps ADD COLUMN IF NOT EXISTS source text DEFAULT 'wearable_sync';

-- 2. Ensure user_id and source columns exist on wearable_sleep
ALTER TABLE public.wearable_sleep ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.wearable_sleep ADD COLUMN IF NOT EXISTS source text DEFAULT 'wearable_sync';

-- 3. Ensure user_id and source columns exist on wearable_resting_hr
ALTER TABLE public.wearable_resting_hr ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.wearable_resting_hr ADD COLUMN IF NOT EXISTS source text DEFAULT 'wearable_sync';

-- 4. Migrate any existing records to populate user_id using parent connections
UPDATE public.wearable_steps s
SET user_id = c.user_id
FROM public.wearable_connections c
WHERE s.connection_id = c.id AND s.user_id IS NULL;

UPDATE public.wearable_sleep s
SET user_id = c.user_id
FROM public.wearable_connections c
WHERE s.connection_id = c.id AND s.user_id IS NULL;

UPDATE public.wearable_resting_hr s
SET user_id = c.user_id
FROM public.wearable_connections c
WHERE s.connection_id = c.id AND s.user_id IS NULL;

-- 5. Add UNIQUE constraints for user_id and logged_date
ALTER TABLE public.wearable_steps DROP CONSTRAINT IF EXISTS wearable_steps_user_date_unique;
ALTER TABLE public.wearable_steps ADD CONSTRAINT wearable_steps_user_date_unique UNIQUE (user_id, logged_date);

ALTER TABLE public.wearable_sleep DROP CONSTRAINT IF EXISTS wearable_sleep_user_date_unique;
ALTER TABLE public.wearable_sleep ADD CONSTRAINT wearable_sleep_user_date_unique UNIQUE (user_id, logged_date);

ALTER TABLE public.wearable_resting_hr DROP CONSTRAINT IF EXISTS wearable_resting_hr_user_date_unique;
ALTER TABLE public.wearable_resting_hr ADD CONSTRAINT wearable_resting_hr_user_date_unique UNIQUE (user_id, logged_date);
