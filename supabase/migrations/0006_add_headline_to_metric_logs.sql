-- =============================================================================
-- ADD HEADLINE COLUMN TO METRIC LOGS TABLE
-- =============================================================================

ALTER TABLE public.metric_logs ADD COLUMN IF NOT EXISTS headline text;
