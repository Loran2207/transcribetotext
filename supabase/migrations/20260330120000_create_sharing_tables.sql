-- =============================================================================
-- Migration: create_sharing_tables
-- Description: Create shares, share_links, and share_invitations tables for
--              Google Docs-style sharing of transcriptions and folders.
-- =============================================================================

-- =============================================================================
-- 1. SHARES TABLE — per-user sharing (email-based)
-- =============================================================================

CREATE TABLE shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL CHECK (resource_type IN ('transcription', 'folder')),
  resource_id text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email text NOT NULL,
  owner_email text,
  access_level text NOT NULL DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'editor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(resource_type, resource_id, shared_with_email)
);

-- Indexes for shares
CREATE INDEX idx_shares_owner ON shares (owner_id);
CREATE INDEX idx_shares_shared_with_user ON shares (shared_with_user_id);
CREATE INDEX idx_shares_shared_with_email ON shares (shared_with_email);
CREATE INDEX idx_shares_resource ON shares (resource_type, resource_id);

-- Auto-update updated_at on shares
CREATE TRIGGER set_shares_updated_at
  BEFORE UPDATE ON shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS for shares
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Owner can do everything with their own shares
CREATE POLICY "Owner can manage their shares"
  ON shares FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Users who have been shared with can view the share record
CREATE POLICY "Shared-with user can view shares"
  ON shares FOR SELECT
  USING (auth.uid() = shared_with_user_id);

-- =============================================================================
-- 2. SHARE_LINKS TABLE — link-based sharing with tokens
-- =============================================================================

CREATE TABLE share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL CHECK (resource_type IN ('transcription', 'folder')),
  resource_id text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  access_level text NOT NULL DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'editor')),
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(resource_type, resource_id)
);

-- Indexes for share_links
CREATE INDEX idx_share_links_owner ON share_links (owner_id);
CREATE INDEX idx_share_links_token ON share_links (token);
CREATE INDEX idx_share_links_resource ON share_links (resource_type, resource_id);

-- Auto-update updated_at on share_links
CREATE TRIGGER set_share_links_updated_at
  BEFORE UPDATE ON share_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS for share_links
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Owner can do everything with their own share links
CREATE POLICY "Owner can manage their share links"
  ON share_links FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Anyone (authenticated) can look up an active, non-expired share link for token validation.
-- The actual resource access check happens in application logic after validating the token.
CREATE POLICY "Anyone can validate active share link tokens"
  ON share_links FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- =============================================================================
-- 3. SHARE_INVITATIONS TABLE — pending email invitations
-- =============================================================================

CREATE TABLE share_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  accept_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  responded_at timestamptz
);

-- Indexes for share_invitations
CREATE INDEX idx_share_invitations_share ON share_invitations (share_id);
CREATE INDEX idx_share_invitations_email ON share_invitations (invited_email);
CREATE INDEX idx_share_invitations_invited_by ON share_invitations (invited_by);
CREATE INDEX idx_share_invitations_token ON share_invitations (accept_token);
CREATE INDEX idx_share_invitations_status ON share_invitations (status) WHERE status = 'pending';

-- RLS for share_invitations
ALTER TABLE share_invitations ENABLE ROW LEVEL SECURITY;

-- The person who created the invitation can manage it fully
CREATE POLICY "Inviter can manage their invitations"
  ON share_invitations FOR ALL
  USING (auth.uid() = invited_by)
  WITH CHECK (auth.uid() = invited_by);

-- The invitee can view invitations sent to their email.
-- We match on email via auth.jwt() since the user may not have an account yet at invite time.
CREATE POLICY "Invitee can view their invitations"
  ON share_invitations FOR SELECT
  USING (invited_email = (auth.jwt() ->> 'email'));

-- The invitee can update (accept/decline) their own pending invitations
CREATE POLICY "Invitee can respond to their invitations"
  ON share_invitations FOR UPDATE
  USING (invited_email = (auth.jwt() ->> 'email') AND status = 'pending')
  WITH CHECK (invited_email = (auth.jwt() ->> 'email'));

-- =============================================================================
-- 4. VERIFICATION
-- =============================================================================

-- Verify RLS is enabled on all new tables
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('shares', 'share_links', 'share_invitations')
  LOOP
    IF NOT tbl.rowsecurity THEN
      RAISE EXCEPTION 'RLS is NOT enabled on table: %', tbl.tablename;
    END IF;
  END LOOP;
END
$$;
