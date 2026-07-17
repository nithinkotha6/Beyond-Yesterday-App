-- =============================================================================
-- MIGRATION: 0016_profiles_strictness.sql
-- Enforce non-nullable fields on profiles: full_name (name), nickname, email, gender, and phone_number.
-- Implement uniqueness constraints on email and phone_number.
-- =============================================================================

-- 1. Ensure phone_number column exists (re-added if previously dropped)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;

-- 2. Backfill default non-null values for existing profiles to prevent migration crash
UPDATE public.profiles
   SET nickname = COALESCE(nickname, split_part(full_name, ' ', 1), 'Athlete')
 WHERE nickname IS NULL;

UPDATE public.profiles
   SET email = COALESCE(email, lower(full_name) || '@example.com')
 WHERE email IS NULL;

UPDATE public.profiles
   SET gender = COALESCE(gender, 'Male')
 WHERE gender IS NULL;

UPDATE public.profiles
   SET phone_number = COALESCE(phone_number, '+1999555' || substring(id::text from 1 for 8))
 WHERE phone_number IS NULL;

-- 3. Enforce columns as NOT NULL
ALTER TABLE public.profiles ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN nickname SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN gender SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN phone_number SET NOT NULL;

-- 4. Implement database uniqueness constraints for verified email or phone numbers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_phone_number_unique'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_number_unique UNIQUE (phone_number);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_unique'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
  END IF;
END $$;
