import { useState, useCallback, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

import {
  UserAdd01Icon,
  Copy01Icon,
  Cancel01Icon,
  LockIcon,
  Globe02Icon,
  Loading01Icon,
  UserGroupIcon,
  Link01Icon,
  MailSend01Icon,
} from "@hugeicons/core-free-icons";

import { Icon } from "@/app/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Skeleton } from "@/app/components/ui/skeleton";

import { useAuth } from "@/app/components/auth-context";
import { useLanguage } from "@/app/components/language-context";
import { useShares } from "@/hooks/use-shares";
import { useIsMobile } from "@/app/components/ui/use-mobile";
import { getInitials } from "@/lib/format";
import type { ResourceType, AccessLevel } from "@/lib/shares";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShareDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  resourceName,
}: ShareDialogProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  const {
    shares,
    shareLink,
    isLoading,
    addShare,
    updateAccess,
    removeShare,
    enableLinkSharing,
    disableLinkSharing,
    copyLink,
  } = useShares(resourceType, resourceId);

  // -- Add people form state --
  const [emailInput, setEmailInput] = useState("");
  const [newAccessLevel, setNewAccessLevel] = useState<AccessLevel>("viewer");
  const [isSending, setIsSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // -- Link sharing state --
  const [isTogglingLink, setIsTogglingLink] = useState(false);

  const ownerEmail = user?.email ?? "";
  const existingEmails = useMemo(
    () => new Set(shares.map((s) => s.shared_with_email.toLowerCase())),
    [shares],
  );

  // -- Validate email --
  const validateEmail = useCallback(
    (email: string): string | null => {
      const trimmed = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(trimmed)) return t("share.invalidEmail");
      if (trimmed === ownerEmail.toLowerCase()) return t("share.cantShareWithSelf");
      if (existingEmails.has(trimmed)) return t("share.alreadyShared");
      return null;
    },
    [ownerEmail, existingEmails, t],
  );

  // -- Send invitation --
  const handleSend = useCallback(async () => {
    const error = validateEmail(emailInput);
    if (error) {
      setEmailError(error);
      return;
    }

    setIsSending(true);
    setEmailError(null);

    const result = await addShare(emailInput.trim().toLowerCase(), newAccessLevel);
    if (result) {
      toast.success(t("share.invitationSent").replace("{email}", emailInput.trim()));
      setEmailInput("");
      setNewAccessLevel("viewer");
    }

    setIsSending(false);
  }, [emailInput, newAccessLevel, validateEmail, addShare, t]);

  // -- Handle Enter key in email input --
  const handleEmailKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // -- General access toggle --
  const linkAccessMode = shareLink?.is_active ? "anyone" : "restricted";

  const handleGeneralAccessChange = useCallback(
    async (value: string) => {
      setIsTogglingLink(true);
      if (value === "anyone") {
        await enableLinkSharing("viewer");
      } else {
        await disableLinkSharing();
      }
      setIsTogglingLink(false);
    },
    [enableLinkSharing, disableLinkSharing],
  );

  const handleLinkAccessLevelChange = useCallback(
    async (level: AccessLevel) => {
      setIsTogglingLink(true);
      await enableLinkSharing(level);
      setIsTogglingLink(false);
    },
    [enableLinkSharing],
  );

  // -- Copy link --
  const handleCopyLink = useCallback(() => {
    copyLink();
    toast.success(t("share.linkCopied"));
  }, [copyLink, t]);

  // -- Update collaborator access --
  const handleUpdateAccess = useCallback(
    async (shareId: string, level: AccessLevel) => {
      const success = await updateAccess(shareId, level);
      if (success) toast.success(t("share.accessUpdated"));
    },
    [updateAccess, t],
  );

  // -- Remove collaborator --
  const handleRemove = useCallback(
    async (shareId: string) => {
      const success = await removeShare(shareId);
      if (success) toast.success(t("share.removed"));
    },
    [removeShare, t],
  );

  // -- Animation helpers --
  const listItemAnim = (index: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -8 },
          transition: { duration: 0.2, delay: index * 0.05 },
        };

  const dialogTitle = t("share.title").replace("{name}", resourceName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={isMobile ? "max-w-[calc(100%-1rem)]" : "sm:max-w-[520px]"}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon={UserGroupIcon} size={20} className="text-primary" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("share.addPeople")}
          </DialogDescription>
        </DialogHeader>

        {/* ── Section 1: Add People ── */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {t("share.addPeople")}
          </p>

          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Input
                type="email"
                placeholder={t("share.emailPlaceholder")}
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                onKeyDown={handleEmailKeyDown}
                disabled={isSending}
                className="rounded-[12px]"
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>

            <Select
              value={newAccessLevel}
              onValueChange={(v) => setNewAccessLevel(v as AccessLevel)}
              disabled={isSending}
            >
              <SelectTrigger className="w-[110px] rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">{t("share.viewer")}</SelectItem>
                <SelectItem value="editor">{t("share.editor")}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleSend}
              disabled={isSending || !emailInput.trim()}
              className="rounded-full"
            >
              {isSending ? (
                <Icon icon={Loading01Icon} size={16} className="animate-spin" />
              ) : (
                <Icon icon={MailSend01Icon} size={16} />
              )}
              <span className={isMobile ? "sr-only" : ""}>{t("share.send")}</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* ── Section 2: People with access ── */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {t("share.peopleWithAccess")}
          </p>

          <ScrollArea className="max-h-[200px]">
            <div className="space-y-1">
              {/* Owner row */}
              <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(ownerEmail)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {ownerEmail}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full text-xs">
                  {t("share.owner")}
                </Badge>
              </div>

              {/* Loading skeleton */}
              {isLoading && (
                <>
                  {[0, 1].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-2 py-2">
                      <Skeleton className="size-8 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-8 w-[100px]" />
                    </div>
                  ))}
                </>
              )}

              {/* Collaborator rows */}
              {!isLoading && (
                <AnimatePresence mode="popLayout">
                  {shares.map((share, index) => (
                    <motion.div
                      key={share.id}
                      {...listItemAnim(index)}
                      layout={!prefersReducedMotion}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors"
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {getInitials(share.shared_with_email)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {share.shared_with_email}
                        </p>
                      </div>

                      <Select
                        value={share.access_level}
                        onValueChange={(v) =>
                          handleUpdateAccess(share.id, v as AccessLevel)
                        }
                      >
                        <SelectTrigger className="w-[100px] h-8 rounded-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">
                            {t("share.viewer")}
                          </SelectItem>
                          <SelectItem value="editor">
                            {t("share.editor")}
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(share.id)}
                      >
                        <Icon icon={Cancel01Icon} size={16} />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {/* Empty state (no collaborators yet, not loading) */}
              {!isLoading && shares.length === 0 && (
                <div className="flex items-center justify-center py-3">
                  <p className="text-xs text-muted-foreground">
                    <Icon
                      icon={UserAdd01Icon}
                      size={14}
                      className="inline-block mr-1 align-text-bottom"
                    />
                    {t("share.addPeople")}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* ── Section 3: General access ── */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {t("share.generalAccess")}
          </p>

          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              {linkAccessMode === "anyone" ? (
                <Icon icon={Globe02Icon} size={18} className="text-primary" />
              ) : (
                <Icon icon={LockIcon} size={18} className="text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <Select
                value={linkAccessMode}
                onValueChange={handleGeneralAccessChange}
                disabled={isTogglingLink}
              >
                <SelectTrigger className="w-full h-8 rounded-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restricted">
                    {t("share.restricted")}
                  </SelectItem>
                  <SelectItem value="anyone">
                    {t("share.anyoneWithLink")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground px-1">
                {linkAccessMode === "anyone"
                  ? t("share.anyoneWithLinkDesc").replace(
                      "{access}",
                      shareLink?.access_level === "editor"
                        ? t("share.edit")
                        : t("share.view"),
                    )
                  : t("share.restrictedDesc")}
              </p>
            </div>

            {linkAccessMode === "anyone" && (
              <Select
                value={shareLink?.access_level ?? "viewer"}
                onValueChange={(v) =>
                  handleLinkAccessLevelChange(v as AccessLevel)
                }
                disabled={isTogglingLink}
              >
                <SelectTrigger className="w-[100px] h-8 rounded-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">{t("share.viewer")}</SelectItem>
                  <SelectItem value="editor">{t("share.editor")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <Separator />

        {/* ── Copy link button ── */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            className="rounded-full gap-2"
            onClick={handleCopyLink}
          >
            {shareLink ? (
              <Icon icon={Link01Icon} size={16} />
            ) : (
              <Icon icon={Copy01Icon} size={16} />
            )}
            {t("share.copyLink")}
          </Button>

          <Button
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            {t("common.done") || "Done"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
