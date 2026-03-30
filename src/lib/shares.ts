import { supabase, supabaseMisconfigured } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResourceType = 'transcription' | 'folder';
export type AccessLevel = 'viewer' | 'editor';

export interface Share {
  id: string;
  resource_type: ResourceType;
  resource_id: string;
  owner_id: string;
  owner_email: string | null;
  shared_with_user_id: string | null;
  shared_with_email: string;
  access_level: AccessLevel;
  created_at: string;
  updated_at: string;
  last_viewed_at: string | null;
}

/** Derived status for UI display. */
export type ShareStatus = 'pending' | 'active' | 'viewed';

/** Derive a display status from a share record. */
export function getShareStatus(share: Share): ShareStatus {
  if (share.last_viewed_at) return 'viewed';
  if (share.shared_with_user_id) return 'active';
  return 'pending';
}

export interface ShareLink {
  id: string;
  resource_type: ResourceType;
  resource_id: string;
  owner_id: string;
  token: string;
  access_level: AccessLevel;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Queries — Shares (people-based)
// ---------------------------------------------------------------------------

/** Fetch all shares for a specific resource. */
export async function getSharesForResource(
  resourceType: ResourceType,
  resourceId: string,
): Promise<Share[]> {
  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Share[];
}

/** Create a new share (invite a person by email). Always viewer access. */
export async function createShare(
  resourceType: ResourceType,
  resourceId: string,
  email: string,
): Promise<Share> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('shares')
    .insert({
      resource_type: resourceType,
      resource_id: resourceId,
      owner_id: user.id,
      owner_email: user.email ?? null,
      shared_with_email: email.trim().toLowerCase(),
      access_level: 'viewer',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Share;
}

/** Record that the current user viewed a shared resource. */
export async function recordShareView(
  resourceType: ResourceType,
  resourceId: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return;

  await supabase
    .from('shares')
    .update({ last_viewed_at: new Date().toISOString() })
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .eq('shared_with_email', user.email.toLowerCase());
}

/** Remove a share (revoke access for a person). */
export async function removeShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from('shares')
    .delete()
    .eq('id', shareId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Queries — Share Links (link-based)
// ---------------------------------------------------------------------------

/** Get the active share link for a resource, or create one if it doesn't exist.
 *  If a link was previously deactivated, re-activate it instead of inserting a
 *  duplicate (the table has a UNIQUE(resource_type, resource_id) constraint). */
export async function getOrCreateShareLink(
  resourceType: ResourceType,
  resourceId: string,
): Promise<ShareLink> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Look for ANY existing link for this resource (active or inactive)
  const { data: existing, error: fetchError } = await supabase
    .from('share_links')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    if (!existing.is_active) {
      const { data: updated, error: updateError } = await supabase
        .from('share_links')
        .update({ is_active: true })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated as ShareLink;
    }

    return existing as ShareLink;
  }

  // No link exists yet — create a new one
  const token = crypto.randomUUID();
  const { data: created, error: createError } = await supabase
    .from('share_links')
    .insert({
      resource_type: resourceType,
      resource_id: resourceId,
      owner_id: user.id,
      token,
      access_level: 'viewer',
      is_active: true,
    })
    .select()
    .single();

  if (createError) throw createError;
  return created as ShareLink;
}

/** Deactivate all share links for a resource. */
export async function deactivateShareLink(
  resourceType: ResourceType,
  resourceId: string,
): Promise<void> {
  const { error } = await supabase
    .from('share_links')
    .update({ is_active: false })
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .eq('is_active', true);

  if (error) throw error;
}

/** Get the active share link for a resource (if any). */
export async function getShareLinkForResource(
  resourceType: ResourceType,
  resourceId: string,
): Promise<ShareLink | null> {
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return (data as ShareLink) ?? null;
}

/** Fetch all resources shared with the current user. */
export async function getSharedWithMe(): Promise<Share[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .eq('shared_with_email', user.email)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Share[];
}

/** Send email invitations via Edge Function (fire-and-forget, best-effort). */
export async function sendShareInvitationEmails(params: {
  emails: string[];
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string;
  senderEmail: string;
  shareLink?: string;
}): Promise<void> {
  if (supabaseMisconfigured) {
    console.warn('[shares] Supabase not configured — skipping email invitations');
    return;
  }

  const { error } = await supabase.functions.invoke('send-share-invitation', {
    body: params,
  });

  if (error) {
    console.error('[shares] Failed to send invitation emails:', error);
    throw error;
  }
}

/** Validate a share link token and return the link if valid. */
export async function validateShareToken(
  token: string,
): Promise<ShareLink | null> {
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  const link = data as ShareLink;
  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return null;
  }

  return link;
}
