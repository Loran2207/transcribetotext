import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  type Share,
  type ShareLink,
  type ResourceType,
  type AccessLevel,
  getSharesForResource,
  createShare,
  updateShareAccessLevel,
  removeShare as removeShareApi,
  getOrCreateShareLink,
  deactivateShareLink,
  getShareLinkForResource,
} from '@/lib/shares';

interface UseSharesReturn {
  shares: Share[];
  shareLink: ShareLink | null;
  isLoading: boolean;
  error: Error | null;
  addShare: (email: string, accessLevel: AccessLevel) => Promise<Share | null>;
  updateAccess: (shareId: string, accessLevel: AccessLevel) => Promise<boolean>;
  removeShare: (shareId: string) => Promise<boolean>;
  enableLinkSharing: (accessLevel: AccessLevel) => Promise<ShareLink | null>;
  disableLinkSharing: () => Promise<boolean>;
  copyLink: () => void;
  refresh: () => Promise<void>;
}

export function useShares(
  resourceType: ResourceType,
  resourceId: string,
): UseSharesReturn {
  const [shares, setShares] = useState<Share[]>([]);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [sharesData, linkData] = await Promise.all([
        getSharesForResource(resourceType, resourceId),
        getShareLinkForResource(resourceType, resourceId),
      ]);
      setShares(sharesData);
      setShareLink(linkData);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [resourceType, resourceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addShare = useCallback(
    async (email: string, accessLevel: AccessLevel): Promise<Share | null> => {
      try {
        const created = await createShare(resourceType, resourceId, email, accessLevel);
        await refresh();
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send invitation';
        toast.error(message);
        return null;
      }
    },
    [resourceType, resourceId, refresh],
  );

  const updateAccess = useCallback(
    async (shareId: string, accessLevel: AccessLevel): Promise<boolean> => {
      try {
        await updateShareAccessLevel(shareId, accessLevel);
        await refresh();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update access';
        toast.error(message);
        return false;
      }
    },
    [refresh],
  );

  const removeShareFn = useCallback(
    async (shareId: string): Promise<boolean> => {
      try {
        await removeShareApi(shareId);
        await refresh();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove access';
        toast.error(message);
        return false;
      }
    },
    [refresh],
  );

  const enableLinkSharing = useCallback(
    async (accessLevel: AccessLevel): Promise<ShareLink | null> => {
      try {
        const link = await getOrCreateShareLink(resourceType, resourceId, accessLevel);
        setShareLink(link);
        return link;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to enable link sharing';
        toast.error(message);
        return null;
      }
    },
    [resourceType, resourceId],
  );

  const disableLinkSharing = useCallback(async (): Promise<boolean> => {
    try {
      await deactivateShareLink(resourceType, resourceId);
      setShareLink(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable link sharing';
      toast.error(message);
      return false;
    }
  }, [resourceType, resourceId]);

  const copyLink = useCallback(() => {
    const url = shareLink
      ? `${window.location.origin}/share/${shareLink.token}`
      : window.location.href;

    navigator.clipboard.writeText(url).catch(() => {
      // Fallback: noop — toast is still shown
    });
  }, [shareLink]);

  return {
    shares,
    shareLink,
    isLoading,
    error,
    addShare,
    updateAccess,
    removeShare: removeShareFn,
    enableLinkSharing,
    disableLinkSharing,
    copyLink,
    refresh,
  };
}
