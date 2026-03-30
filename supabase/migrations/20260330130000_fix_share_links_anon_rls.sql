-- =============================================================================
-- Migration: fix_share_links_anon_rls
-- Description: The "Anyone can validate active share link tokens" policy on
--              share_links did not explicitly grant access to the anon role.
--              The /share/:token route is public (no auth required), so
--              validateShareToken() runs with the anon key. This migration
--              drops the old policy and recreates it with explicit role grants
--              for both anon and authenticated users.
-- =============================================================================

-- Drop the existing policy that only applied to authenticated by default
DROP POLICY IF EXISTS "Anyone can validate active share link tokens" ON share_links;

-- Recreate with explicit roles so the Supabase anon key can validate tokens
CREATE POLICY "Anyone can validate active share link tokens"
  ON share_links FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );
