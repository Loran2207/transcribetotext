-- =============================================================================
-- Migration: add_share_view_tracking
-- Description: Add last_viewed_at to shares table to track when shared users
--              last viewed the resource. NULL = never viewed.
-- =============================================================================

ALTER TABLE shares ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz;

-- Index for quick lookup of unviewed shares
CREATE INDEX IF NOT EXISTS idx_shares_last_viewed ON shares (last_viewed_at) WHERE last_viewed_at IS NULL;
