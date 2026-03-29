-- =============================================================================
-- Migration: confirm_existing_users
-- Description: Confirm all existing unconfirmed users by setting
--              email_confirmed_at and confirmed_at to now().
-- Note: Email confirmation should also be disabled in the Supabase Dashboard.
-- =============================================================================

UPDATE auth.users
SET email_confirmed_at = now(),
    confirmed_at = now()
WHERE email_confirmed_at IS NULL;
