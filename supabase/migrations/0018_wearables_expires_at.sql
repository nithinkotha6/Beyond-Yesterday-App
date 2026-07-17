-- =============================================================================
-- MIGRATION: 0018_wearables_expires_at.sql
-- Rename token_expires_at column to expires_at on wearable_connections.
-- =============================================================================

ALTER TABLE public.wearable_connections RENAME COLUMN token_expires_at TO expires_at;
