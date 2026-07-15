-- =============================================================================
-- ADD DELETED_AT COLUMN TO MEMORIES TABLE FOR SOFT-DELETE SUPPORT
-- =============================================================================

ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
