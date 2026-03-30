import { useState, useCallback, useMemo, useRef } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

import {
  Cancel01Icon,
  Copy01Icon,
  Globe02Icon,
  Link01Icon,
  Loading01Icon,
  LockIcon,
  MailSend01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

import { Icon } from "@/app/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

import { useAuth } from "@/app/components/auth-context";
import { useLanguage } from "@/app/components/language-context";
import { useShares } from "@/hooks/use-shares";
import { useIsMobile } from "@/app/components/ui/use-mobile";
import { getInitials } from "@/lib/format";
import { sendShareInvitationEmails } from "@/lib/shares";
import type { ResourceType } from "@/lib/shares";

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

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

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
  // All hooks MUST be called unconditionally (Rules of Hooks)
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    shares,
    shareLink,
    isLoading,
    addShareBatch,
    removeShare,
    enableLinkSharing,
    disableLinkSharing,
    copyLink,
  } = useShares(resourceType, resourceId);

  // -- Chip-based email input state --
  const [emailChips, setEmailChips] = useState<string[]>([]);
  const [chipInputValue, setChipInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // -- Link sharing state --
  const [isTogglingLink, setIsTogglingLink] = useState(false);

  const isDemoUser = user?.id.startsWith("demo-") ?? false;
  const ownerEmail = user?.email ?? "";
  const existingEmails = useMemo(
    () => new Set(shares.map((s) => s.shared_with_email.toLowerCase())),
    [shares],
  );

  // -- Validate a single email --
  const validateEmail = useCallback(
    (email: string): string | null => {
      if (!EMAIL_REGEX.test(email)) return t("share.invalidEmail");
      if (email === ownerEmail.toLowerCase()) return t("share.cantShareWithSelf");
      if (existingEmails.has(email)) return t("share.alreadyShared");
      if (emailChips.includes(email)) return t("share.alreadyShared");
      return null;
    },
    [ownerEmail, existingEmails, emailChips, t],
  );

  // -- Add chips from raw string --
  const addChipsFromInput = useCallback(
    (raw: string) => {
      const emails = parseEmails(raw);
      const newChips: string[] = [];
      let lastError: string | null = null;

      for (const email of emails) {
        const err = validateEmail(email);
        if (err) {
          lastError = err;
        } else {
          newChips.push(email);
        }
      }

      if (newChips.length > 0) {
        setEmailChips((prev) => [...prev, ...newChips]);
      }
      if (lastError && newChips.length === 0) {
        setEmailError(lastError);
      } else {
        setEmailError(null);
      }
      setChipInputValue("");
    },
    [validateEmail],
  );

  // -- Handle key events in chip input --
  const handleChipKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (chipInputValue.trim()) {
          addChipsFromInput(chipInputValue);
        }
      } else if (e.key === "Backspace" && chipInputValue === "") {
        setEmailChips((prev) => prev.slice(0, -1));
      }
    },
    [chipInputValue, addChipsFromInput],
  );

  // -- Handle paste --
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text");
      addChipsFromInput(pasted);
    },
    [addChipsFromInput],
  );

  // -- Handle blur: add current input as chip --
  const handleBlur = useCallback(() => {
    if (chipInputValue.trim()) {
      addChipsFromInput(chipInputValue);
    }
  }, [chipInputValue, addChipsFromInput]);

  // -- Remove a chip --
  const removeChip = useCallback((email: string) => {
    setEmailChips((prev) => prev.filter((e) => e !== email));
  }, []);

  // -- Send invitations --
  const handleSend = useCallback(async () => {
    if (emailChips.length === 0) return;

    setIsSending(true);
    setEmailError(null);

    const { succeeded, failed } = await addShareBatch(emailChips);

    if (succeeded.length > 0) {
      toast.success(
        t("share.invitationsSent").replace("{count}", String(succeeded.length)),
      );

      // Fire-and-forget: trigger email invitations via Edge Function
      sendShareInvitationEmails({
        emails: succeeded,
        resourceType,
        resourceId,
        resourceName,
        senderEmail: ownerEmail,
        shareLink: shareLink?.token
          ? `${window.location.origin}/share/${shareLink.token}`
          : undefined,
      }).catch(() => {
        // Email delivery is best-effort — share record is the source of truth
      });
    }

    if (failed.length > 0) {
      toast.error(`Failed to share with: ${failed.join(", ")}`);
    }

    // Clear only succeeded chips, keep failed ones for retry
    setEmailChips(failed);
    setIsSending(false);
  }, [emailChips, addShareBatch, resourceType, resourceId, resourceName, ownerEmail, shareLink, t]);

  // -- General access toggle --
  const linkAccessMode = shareLink?.is_active ? "anyone" : "restricted";

  const handleGeneralAccessChange = useCallback(
    async (value: string) => {
      setIsTogglingLink(true);
      if (value === "anyone") {
        await enableLinkSharing();
      } else {
        await disableLinkSharing();
      }
      setIsTogglingLink(false);
    },
    [enableLinkSharing, disableLinkSharing],
  );

  // -- Copy link --
  const handleCopyLink = useCallback(() => {
    copyLink();
    toast.success(t("share.linkCopied"));
  }, [copyLink, t]);

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

  // ── Demo mode: show sign-up prompt ──
  if (isDemoUser) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={isMobile ? "max-w-[calc(100%-1rem)]" : "sm:max-w-[420px]"}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon={UserGroupIcon} size={20} className="text-primary" />
              {t("share.demoTitle")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("share.demoDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <div className="size-16 rounded-2xl bg-primary/5 flex items-center justify-center">
              <Icon icon={LockIcon} size={32} className="text-primary/60" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-[300px]">
              {t("share.demoDesc")}
            </p>
            <Button
              className="rounded-full"
              onClick={() => {
                onOpenChange(false);
                navigate("/signup");
              }}
            >
              {t("share.signUpToShare")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Full share dialog ──
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

        {/* ── Section 1: Add People (chip-based input) ── */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {t("share.addPeople")}
          </p>

          {/* Chip input container */}
          <div
            className="flex flex-wrap items-center gap-1.5 rounded-[12px] border border-input bg-input-background min-h-[42px] px-3 py-2 cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            <AnimatePresence mode="popLayout">
              {emailChips.map((email) => (
                <motion.div
                  key={email}
                  initial={prefersReducedMotion ? undefined : { scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={prefersReducedMotion ? undefined : { scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Badge
                    variant="secondary"
                    className="rounded-full gap-1 pr-1 text-xs font-normal"
                  >
                    {email}
                    <button
                      type="button"
                      className="size-4 rounded-full inline-flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeChip(email);
                      }}
                    >
                      <Icon icon={Cancel01Icon} size={10} />
                    </button>
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>

            <input
              ref={inputRef}
              type="email"
              placeholder={
                emailChips.length === 0 ? t("share.emailPlaceholder") : ""
              }
              value={chipInputValue}
              onChange={(e) => {
                setChipInputValue(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onKeyDown={handleChipKeyDown}
              onPaste={handlePaste}
              onBlur={handleBlur}
              disabled={isSending}
              className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {emailError && (
            <p className="text-xs text-destructive">{emailError}</p>
          )}

          {/* Send button — only when chips exist */}
          <AnimatePresence>
            {emailChips.length > 0 && (
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={handleSend}
                  disabled={isSending}
                  className="rounded-full gap-2 w-full"
                >
                  {isSending ? (
                    <Icon icon={Loading01Icon} size={16} className="animate-spin" />
                  ) : (
                    <Icon icon={MailSend01Icon} size={16} />
                  )}
                  {t("share.send")}
                  {emailChips.length > 1 && (
                    <span className="text-primary-foreground/70">
                      ({emailChips.length})
                    </span>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Section 2: People with access (no owner, no access level) ── */}
        {(isLoading || shares.length > 0) && (
          <>
            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {t("share.peopleWithAccess")}
              </p>

              <ScrollArea className="max-h-[200px]">
                <div className="space-y-1">
                  {/* Loading skeleton */}
                  {isLoading && (
                    <>
                      {[0, 1].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-2 py-2">
                          <Skeleton className="size-8 rounded-full" />
                          <Skeleton className="h-4 flex-1" />
                          <Skeleton className="h-8 w-8" />
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

                          <p className="flex-1 min-w-0 text-sm text-foreground truncate">
                            {share.shared_with_email}
                          </p>

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
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        <Separator />

        {/* ── Section 3: General access (simplified) ── */}
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
                  ? t("share.anyoneWithLinkCanView")
                  : t("share.restrictedDesc")}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Footer: Copy link only ── */}
        <div className="flex justify-center">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
