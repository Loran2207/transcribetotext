import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

import {
  AlertCircleIcon,
  ArrowReloadHorizontalIcon,
  Cancel01Icon,
  Copy01Icon,
  Loading01Icon,
  MailSend01Icon,
} from "@hugeicons/core-free-icons";

import { Icon } from "@/app/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

import { useAuth } from "@/app/components/auth-context";
import { usePlan } from "@/app/components/use-plan";
import { UpgradeGateModal } from "@/app/components/upgrade-gate-modal";
import { useLanguage } from "@/app/components/language-context";
import { useUserProfile } from "@/app/components/user-profile-context";
import { useShares } from "@/hooks/use-shares";
import { useIsMobile, useIsPhone } from "@/app/components/ui/use-mobile";
import { getInitials } from "@/lib/format";
import { sendShareInvitationEmails, getShareStatus } from "@/lib/shares";
import type { ResourceType, Share } from "@/lib/shares";
import {
  readShareScene,
  OWNER,
  type SharePerson,
  type ShareMode,
} from "@/lib/share-demo";
import { toastAccessRemoved } from "./app-toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

/** A live share row, told in the words the spec uses. */
function toPerson(share: Share, index: number): SharePerson {
  const status = getShareStatus(share);
  const tints: Array<[string, string]> = [
    ["#DBEAFE", "#1D4ED8"],
    ["#DCFCE7", "#15803D"],
    ["#FEF3C7", "#B45309"],
    ["#FCE7F3", "#BE185D"],
  ];
  const [tint, ink] = tints[index % tints.length];
  return {
    id: share.id,
    email: share.shared_with_email,
    state: status === "pending" ? "pending" : "accepted",
    tint,
    ink,
  };
}

export function ShareDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  resourceName,
}: ShareDialogProps) {
  const { user } = useAuth();
  const plan = usePlan();
  const { t } = useLanguage();
  const { displayName, avatarSrc } = useUserProfile();
  /* Sharing is a form, and the product already settled what a form does at each
     width: a tablet gets the centred card (its Delete forever confirmation is
     one), a phone gets the bottom sheet. Menus and pickers are the other case -
     they stay sheets on a tablet too - so this asks the phone question, not the
     layout one. */
  const isPhone = useIsPhone();
  const prefersReducedMotion = useReducedMotion();
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

  /* The staged world for a capture. Read once per opening so a frame holds
     still: a scene that re-read itself on every render would fight the
     interactions the same component still has to support. */
  const [scene, setScene] = useState(() => readShareScene());
  useEffect(() => {
    if (open) setScene(readShareScene());
  }, [open]);

  const [emailChips, setEmailChips] = useState<string[]>([]);
  const [chipInputValue, setChipInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState<ShareMode | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmailChips(scene ? scene.chips : []);
    setChipInputValue("");
    setEmailError(
      scene?.sendError === "already"
        ? t("share.alreadyHasAccess")
        : scene?.sendError === "self"
          ? t("share.youAlreadyHaveAccess")
          : null,
    );
    setLiveMode(null);
    setIsSending(Boolean(scene?.sending));
  }, [open, scene, t]);

  const ownerEmail = user?.email ?? "";

  const people: SharePerson[] = useMemo(() => {
    if (scene) return scene.people;
    return shares.map(toPerson);
  }, [scene, shares]);

  const existingEmails = useMemo(
    () => new Set(people.map((p) => p.email.toLowerCase())),
    [people],
  );

  const loading = scene ? Boolean(scene.loading) : isLoading;
  const listError = Boolean(scene?.listError);
  const linkError = Boolean(scene?.linkError);

  const mode: ShareMode =
    liveMode ?? (scene ? scene.mode : shareLink?.is_active ? "link" : "invited");

  const linkUrl = shareLink?.token
    ? `${window.location.origin}/share/${shareLink.token}`
    : "https://transcribetotext.com/share/8f3a2c41d9";

  const isFolder = resourceType === "folder";

  const validateEmail = useCallback(
    (email: string): string | null => {
      if (!EMAIL_REGEX.test(email)) return t("share.invalidEmail");
      if (email === ownerEmail.toLowerCase()) return t("share.youAlreadyHaveAccess");
      if (existingEmails.has(email)) return t("share.alreadyHasAccess");
      if (emailChips.includes(email)) return t("share.alreadyHasAccess");
      return null;
    },
    [ownerEmail, existingEmails, emailChips, t],
  );

  const addChipsFromInput = useCallback(
    (raw: string) => {
      const emails = parseEmails(raw);
      const newChips: string[] = [];
      let lastError: string | null = null;

      for (const email of emails) {
        const err = validateEmail(email);
        if (err) lastError = err;
        else newChips.push(email);
      }

      if (newChips.length > 0) setEmailChips((prev) => [...prev, ...newChips]);
      setEmailError(lastError && newChips.length === 0 ? lastError : null);
      setChipInputValue("");
    },
    [validateEmail],
  );

  const sendRef = useRef<() => void>(() => {});

  const handleChipKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!chipInputValue.trim() && emailChips.length > 0) {
          sendRef.current();
          return;
        }
        if (chipInputValue.trim()) addChipsFromInput(chipInputValue);
      } else if (e.key === "," || e.key === " ") {
        e.preventDefault();
        if (chipInputValue.trim()) addChipsFromInput(chipInputValue);
      } else if (e.key === "Backspace" && chipInputValue === "") {
        setEmailChips((prev) => prev.slice(0, -1));
      }
    },
    [chipInputValue, emailChips.length, addChipsFromInput],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      addChipsFromInput(e.clipboardData.getData("text"));
    },
    [addChipsFromInput],
  );

  const handleBlur = useCallback(() => {
    if (chipInputValue.trim()) addChipsFromInput(chipInputValue);
  }, [chipInputValue, addChipsFromInput]);

  const removeChip = useCallback((email: string) => {
    setEmailChips((prev) => prev.filter((e) => e !== email));
  }, []);

  const handleSend = useCallback(async () => {
    if (emailChips.length === 0) return;
    setIsSending(true);
    setEmailError(null);

    const { succeeded, failed } = await addShareBatch(emailChips);

    if (succeeded.length > 0) {
      toast.success(t("share.inviteSent"));
      sendShareInvitationEmails({
        emails: succeeded,
        resourceType,
        resourceId,
        resourceName,
        senderEmail: ownerEmail,
        shareLink: shareLink?.token ? linkUrl : undefined,
      }).catch(() => {});
    }
    if (failed.length > 0) setEmailError(t("share.deliveryFailedHint"));

    setEmailChips(failed);
    setIsSending(false);
  }, [emailChips, addShareBatch, resourceType, resourceId, resourceName, ownerEmail, shareLink, linkUrl, t]);

  sendRef.current = handleSend;

  const handleModeChange = useCallback(
    (value: string) => {
      const next = value === "link" ? "link" : "invited";
      setLiveMode(next);
      if (next === "link") void enableLinkSharing();
      else void disableLinkSharing();
    },
    [enableLinkSharing, disableLinkSharing],
  );

  const handleCopyLink = useCallback(() => {
    copyLink();
    toast.success(t("share.copied"));
  }, [copyLink, t]);

  const handleRemove = useCallback(
    async (person: SharePerson) => {
      setBusyId(person.id);
      const ok = scene ? true : await removeShare(person.id);
      setBusyId(null);
      if (ok) toastAccessRemoved(person.name ?? person.email);
    },
    [removeShare, scene],
  );

  const ownerRow: SharePerson = useMemo(
    () => ({
      ...OWNER,
      name: displayName || OWNER.name,
      email: ownerEmail || OWNER.email,
      avatar: avatarSrc || OWNER.avatar,
    }),
    [displayName, ownerEmail, avatarSrc],
  );

  const dialogTitle = t(isFolder ? "share.titleFolder" : "share.title").replace(
    "{name}",
    resourceName,
  );

  const listBusyId = scene?.busyId ?? busyId;
  const hoverId = scene?.hoverId;

  /* 4. A free account keeps the Share control everywhere a paid one has it, and
     pressing it lands on the plan the product already sells. The gate lives in
     the dialog rather than at each of the four entry points, so a new entry
     point cannot be built without it. */
  if (plan !== "pro") {
    return <UpgradeGateModal open={open} onOpenChange={onOpenChange} variant="share" />;
  }

  /* Everything under the title, so the phone and the desktop show the same
     dialog in the shell each platform actually uses. */
  const body = (
    <>
        {/* 2. Who this is open to. The default is the closed one, so nothing
            leaves the account until the owner says so. */}
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invited">{t("share.onlyInvited")}</TabsTrigger>
            <TabsTrigger value="link">{t("share.anyoneCanView")}</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "invited" ? (
          <InviteField
            chips={emailChips}
            value={chipInputValue}
            error={emailError}
            sending={isSending}
            stacked={isPhone}
            inputRef={inputRef}
            reduced={Boolean(prefersReducedMotion)}
            onChange={(v) => {
              setChipInputValue(v);
              if (emailError) setEmailError(null);
            }}
            onKeyDown={handleChipKeyDown}
            onPaste={handlePaste}
            onBlur={handleBlur}
            onRemoveChip={removeChip}
            onSend={handleSend}
          />
        ) : (
          <LinkField
            url={linkUrl}
            stacked={isPhone}
            error={linkError}
            onCopy={handleCopyLink}
          />
        )}

        {/* 2.4 Who can open it. The owner leads; everyone else is equal. */}
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-foreground">
            {t("share.peopleWithAccess")}
          </p>

          {/* The owner row is always here, so the list is never empty and the
              account reading the dialog is always named in it. There is no
              separate "only you have access" line: the list already says it. */}
          {loading ? (
            <ListSkeleton />
          ) : listError ? (
            <ListError />
          ) : (
            <ScrollArea
              /* The bar stays out rather than appearing on hover: a list that is
                 taller than its box has to say so without being touched first. */
              type={people.length > 5 ? "always" : "hover"}
              /* Radix wraps a scroll viewport's children in a display:table box,
                 which sizes to the widest row's min-content rather than to the
                 viewport. On a phone that pushed every row past the dialog's own
                 edge. This list scrolls up and down only, so the wrapper is made
                 a plain block. */
              className={`[&_[data-radix-scroll-area-viewport]>div]:!block ${
                people.length > 5 ? "h-[248px] pr-2" : "pr-2"
              }`}
            >
              <div className="space-y-0.5">
                <PersonRow person={ownerRow} owner />
                <AnimatePresence mode="popLayout">
                  {people.map((p, i) => (
                    <motion.div
                      key={p.id}
                      layout={!prefersReducedMotion}
                      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, delay: Math.min(i, 6) * 0.03 }}
                    >
                      <PersonRow
                        person={p}
                        forceHover={hoverId === p.id}
                        busy={listBusyId === p.id}
                        onRemove={() => handleRemove(p)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </div>
    </>
  );

  /* On a phone this is a sheet pinned to the bottom edge, the full width of the
     screen - the shape every other sheet in the product already has. A centred
     card floating in the middle of a phone is not how this app talks. */
  if (isPhone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="[&>div:first-child]:hidden">
          <div className="flex items-start gap-2 px-5 pt-5 pb-1">
            <DrawerTitle className="flex-1 text-left text-[16px] font-semibold leading-[22px]">
              {dialogTitle}
            </DrawerTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            >
              <Icon icon={Cancel01Icon} size={18} />
            </button>
          </div>
          <DrawerDescription className="sr-only">
            {t(isFolder ? "share.folderDesc" : "share.recordDesc")}
          </DrawerDescription>
          <div
            className="flex flex-col gap-4 px-5 pt-3"
            style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}
          >
            {body}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] gap-4">
        <DialogHeader>
          <DialogTitle className="pr-6 text-left">{dialogTitle}</DialogTitle>
          <DialogDescription className="sr-only">
            {t(isFolder ? "share.folderDesc" : "share.recordDesc")}
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

interface InviteFieldProps {
  chips: string[];
  value: string;
  error: string | null;
  sending: boolean;
  stacked: boolean;
  reduced: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onRemoveChip: (email: string) => void;
  onSend: () => void;
}

function InviteField({
  chips, value, error, sending, stacked, reduced, inputRef,
  onChange, onKeyDown, onPaste, onBlur, onRemoveChip, onSend,
}: InviteFieldProps) {
  const { t } = useLanguage();
  const empty = chips.length === 0 && value.trim().length === 0;

  /* The field grows with the addresses put into it. A phone has the height to
     spare, so a handful of people are all on screen at once rather than behind
     a scrollbar three rows down; the ceiling is six rows, and only past that
     does it scroll so the list of people underneath keeps its place. */
  const fieldClass =
    "flex-1 flex flex-wrap content-start items-center gap-1.5 overflow-y-auto rounded-[12px] border border-input bg-input-background min-h-[42px] max-h-[204px] px-2.5 py-2 cursor-text";

  return (
    <div className="space-y-1.5">
      <div className={stacked ? "space-y-2" : "flex items-start gap-2"}>
        <div className={fieldClass} onClick={() => inputRef.current?.focus()}>
          <AnimatePresence mode="popLayout">
            {chips.map((email) => (
              <motion.span
                key={email}
                layout={!reduced}
                initial={reduced ? undefined : { scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={reduced ? undefined : { scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="inline-flex h-6 max-w-full items-center gap-1 rounded-full bg-muted pl-2.5 pr-1 text-[12px] text-foreground"
              >
                <span className="truncate">{email}</span>
                <button
                  type="button"
                  aria-label={`Remove ${email}`}
                  className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveChip(email);
                  }}
                >
                  <Icon icon={Cancel01Icon} size={10} />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>

          <input
            ref={inputRef}
            type="email"
            placeholder={chips.length === 0 ? t("share.emailPlaceholder") : ""}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={onBlur}
            disabled={sending}
            className="min-w-[130px] flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <Button
          onClick={onSend}
          disabled={empty || sending}
          title={empty ? t("share.sendInviteGate") : undefined}
          /* Disabled has to look disabled. A primary at half opacity is still
             blue, and blue is what this product uses to say "press me". */
          className={`disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 ${
            stacked ? "h-10 w-full gap-2 rounded-full" : "h-[42px] shrink-0 gap-2 rounded-full px-4"
          }`}
        >
          <Icon
            icon={sending ? Loading01Icon : MailSend01Icon}
            size={16}
            className={sending ? "animate-spin" : undefined}
          />
          {t("share.sendInvite")}
        </Button>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 pl-1 text-[12px] text-destructive">
          <Icon icon={AlertCircleIcon} size={13} className="mt-[1px] shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function LinkField({
  url, stacked, error, onCopy,
}: {
  url: string;
  stacked: boolean;
  error: boolean;
  onCopy: () => void;
}) {
  const { t } = useLanguage();

  if (error) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-start gap-2 rounded-[12px] border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <Icon icon={AlertCircleIcon} size={15} className="mt-[1px] shrink-0 text-destructive" />
          <p className="text-[13px] leading-[1.5] text-foreground">
            {t("share.linkFailed")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className={stacked ? "space-y-2" : "flex items-center gap-2"}>
        <div className="flex h-[42px] flex-1 items-center overflow-hidden rounded-[12px] border border-input bg-input-background px-3">
          <span className="truncate text-sm text-foreground">{url}</span>
        </div>
        <Button
          variant="pill-outline"
          onClick={onCopy}
          className={
            stacked ? "h-10 w-full gap-2" : "h-[42px] shrink-0 gap-2 px-4"
          }
        >
          <Icon icon={Copy01Icon} size={15} />
          {t("share.copyLink")}
        </Button>
      </div>
      <p className="pl-1 text-[12px] text-muted-foreground">
        {t("share.linkCaption")}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PersonRow({
  person, owner, forceHover, busy, onRemove,
}: {
  person: SharePerson;
  owner?: boolean;
  forceHover?: boolean;
  busy?: boolean;
  onRemove?: () => void;
}) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const label = person.name ?? person.email;
  const badge =
    person.state === "pending"
      ? { text: t("share.pending"), tone: "muted" as const }
      : person.state === "link"
        ? { text: t("share.joinedViaLink"), tone: "muted" as const }
        : person.state === "failed"
          ? { text: t("share.deliveryFailed"), tone: "bad" as const }
          : null;

  /* A pointer can ask for the control by moving to the row; a finger cannot, so
     on touch widths it is simply there. */
  const revealed = forceHover || isMobile;

  return (
    <div
      className={`group flex items-center gap-3 rounded-[10px] px-2 py-2 transition-colors ${
        forceHover ? "bg-accent/60" : "hover:bg-accent/60"
      }`}
    >
      <Avatar className="size-8 shrink-0">
        {person.avatar && <AvatarImage src={person.avatar} alt="" />}
        <AvatarFallback
          className="text-[11px] font-medium"
          style={{ background: person.tint, color: person.ink }}
        >
          {getInitials(label)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* The account reading the dialog is named, so the first row is never a
            stranger with the same face as everyone else. */}
        <span className="min-w-0 truncate text-[13px] text-foreground">
          {label}
          {owner && <span className="text-muted-foreground"> (you)</span>}
        </span>
        {badge && (
          <span
            className={`shrink-0 rounded-full px-2 py-[2px] text-[11px] leading-[16px] ${
              badge.tone === "bad"
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {owner ? (
        <span className="shrink-0 pr-[7px] text-[12px] text-muted-foreground">
          {t("share.owner")}
        </span>
      ) : (
        /* Two slots on every row, both always reserved: remove is the last one,
           so it is at the same x whatever else the row carries, and resend
           always lands immediately to its left rather than sliding into the
           remove column on the one row that has it. */
        <div className="flex shrink-0 items-center gap-0.5">
          <span className="inline-flex size-7 shrink-0 items-center justify-center">
            {person.state === "failed" && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("share.resend")}
                title={t("share.resend")}
                className="size-7 rounded-full text-muted-foreground hover:text-foreground"
              >
                <Icon icon={ArrowReloadHorizontalIcon} size={14} />
              </Button>
            )}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("share.removeAccess")}
            title={t("share.removeAccess")}
            disabled={busy}
            onClick={onRemove}
            /* A bounced invite is the one row that carries a way out, so both
               of its controls stand without waiting to be hovered. */
            className={`size-7 rounded-full text-muted-foreground hover:text-destructive ${
              revealed || busy || person.state === "failed" ? "" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <Icon
              icon={busy ? Loading01Icon : Cancel01Icon}
              size={14}
              className={busy ? "animate-spin" : undefined}
            />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ListSkeleton() {
  return (
    <div className="space-y-0.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-3.5" style={{ width: `${52 - i * 9}%` }} />
        </div>
      ))}
    </div>
  );
}

function ListError() {
  const { t } = useLanguage();
  return (
    <div className="flex items-start gap-2 rounded-[12px] border border-destructive/30 bg-destructive/5 px-3 py-2.5">
      <Icon icon={AlertCircleIcon} size={15} className="mt-[1px] shrink-0 text-destructive" />
      <p className="text-[13px] leading-[1.5] text-foreground">
        {t("share.listFailed")}
      </p>
    </div>
  );
}
