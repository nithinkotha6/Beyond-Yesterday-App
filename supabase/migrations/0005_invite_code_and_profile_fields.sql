-- =============================================================================
-- Migration: 0005_invite_code_and_profile_fields.sql
-- Purpose:   Add invite_code to groups table (for signup) and email + nickname
--            to profiles table. Ensure pin (4 chars) is on profiles table.
-- =============================================================================

-- Add invite_code to groups table (must be unique)
alter table public.groups add column if not exists invite_code text unique;

-- Add email and nickname to profiles table
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists nickname text;

-- Ensure pin is present and at most 4 characters on profiles table
alter table public.profiles add column if not exists pin varchar(4);

-- Explicitly regrant permissions on altered tables to ensure roles have access
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
