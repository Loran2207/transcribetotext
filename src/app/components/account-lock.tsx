import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Alert02Icon, Mail } from "@hugeicons/core-free-icons";
import { Button } from "@/app/components/ui/button";
import { Icon } from "@/app/components/ui/icon";
import { ToastCard } from "./app-toast";
import { useAuth } from "./auth-context";

/* Demo flag: ttt_demo_locked=1 in localStorage shows the locked state to a
   signed-in account. The real verdict will come from the backend once the team
   decides what counts as suspicious; this file is the state the app shows.

   A locked account is not shut out. The person still reads their records and
   still reaches the plan, so a running subscription can be cancelled. What
   stops is adding anything new: upload, recording, meeting bot, link. */
const LOCK_FLAG = "ttt_demo_locked";
const SUPPORT = "support@transcribetotext.ai";

export function readDemoLock(): boolean {
  try { return window.localStorage.getItem(LOCK_FLAG) === "1"; } catch { return false; }
}

export function clearDemoLock() {
  try { window.localStorage.removeItem(LOCK_FLAG); } catch { /* demo flag only */ }
}

export function useAccountLock(): boolean {
  const [locked, setLocked] = useState(readDemoLock);
  useEffect(() => {
    const reread = () => setLocked(readDemoLock());
    window.addEventListener("storage", reread);
    window.addEventListener("ttt-banner-hidden", reread);
    return () => {
      window.removeEventListener("storage", reread);
      window.removeEventListener("ttt-banner-hidden", reread);
    };
  }, []);
  return locked;
}

function supportMailto(email: string) {
  const subject = encodeURIComponent("Unlock my account" + (email ? ": " + email : ""));
  const body = encodeURIComponent(
    "Hi,\n\nMy account" + (email ? " (" + email + ")" : "") + " is locked. Please check it and unlock it.\n\n",
  );
  return `mailto:${SUPPORT}?subject=${subject}&body=${body}`;
}

/* The one message a blocked action gives, wherever it was tried from: the
   cards, the phone tiles, the plus button, a dropped file, a keyboard shortcut.
   It names what is paused and hands over the way out. */
export function toastLocked(email = "") {
  toast.custom(
    (id) => (
      <ToastCard
        tone="error"
        title="Adding files is paused"
        meta="Your account is locked. Write to support to unlock it."
        action={{ label: "Write to support", onClick: () => { toast.dismiss(id); window.location.href = supportMailto(email); } }}
      />
    ),
    { duration: 6000 },
  );
}

/* Sits at the top of the content area on every page while the lock holds. Not
   dismissible: it is the state, not a notice. One line says what happened and
   what still works; the two buttons are the two things a locked person needs,
   the way out and the way to their subscription. */
export function AccountLockedBanner({ onNavigate }: { onNavigate: (page: string) => void }) {
  const locked = useAccountLock();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const variant = params.get("v");
  if (!locked) return null;
  const email = user?.email ?? "";

  const openPlan = () => {
    try { window.localStorage.setItem("ttt_demo_settings_section", "plan"); } catch { /* demo only */ }
    onNavigate("settings");
  };

  /* two renderings to choose from, as with the pictures before: the red tinted
     strip (a), or a quieter white card with the product's matte still life and
     red kept for the one word and the one button (b, ?v=b) */
  if (variant === "b") {
    return (
      <div
        data-account-locked-banner
        role="alert"
        className="mx-[16px] mt-[16px] md:mx-[24px] md:mt-[20px] lg:mx-[32px] lg:mt-[24px] flex items-center gap-[12px] md:gap-[16px] rounded-[16px] border border-border bg-card pl-[12px] pr-[14px] py-[12px] md:pl-[14px] shadow-[var(--elevation-sm)]"
      >
        <img src="/images/lock-badge.png" alt="" className="shrink-0 size-[56px] md:size-[72px] object-contain" />
        <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
          <p className="flex items-center gap-[8px] text-[15px] font-semibold leading-[20px] tracking-[-0.2px] text-foreground">
            <span className="size-[8px] rounded-full bg-destructive shrink-0" />
            Your account is locked
          </p>
          <p className="text-[13px] leading-[18px] text-muted-foreground">
            <span className="hidden md:inline">
              Unusual activity{email ? <> on <span className="font-medium text-foreground">{email}</span></> : null}. Your records and plan are still here; adding new files is paused until support unlocks the account.
            </span>
            <span className="md:hidden">Adding files is paused. Records and plan stay available.</span>
          </p>
          <div className="flex items-center gap-[6px] mt-[8px] md:hidden">
            <Button asChild variant="destructive" className="h-[34px] px-[14px] text-[13px]">
              <a href={supportMailto(email)}>Write to support</a>
            </Button>
            <Button variant="ghost" onClick={openPlan} className="h-[34px] px-[12px] text-[13px]">Manage plan</Button>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-[6px] shrink-0">
          <Button asChild variant="destructive" className="h-[36px] px-[16px] text-[13px]">
            <a href={supportMailto(email)}>
              <Icon icon={Mail} className="size-[16px]" strokeWidth={2} />
              Write to support
            </a>
          </Button>
          <Button variant="ghost" onClick={openPlan} className="h-[36px] px-[14px] text-[13px]">Manage plan</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-account-locked-banner
      role="alert"
      className="mx-[16px] mt-[16px] md:mx-[24px] md:mt-[20px] lg:mx-[32px] lg:mt-[24px] flex flex-col gap-[12px] md:flex-row md:items-center rounded-[16px] px-[16px] py-[14px] md:pr-[14px] bg-destructive/[0.07] text-destructive"
    >
      <span className="hidden md:flex shrink-0 items-center justify-center size-[40px] rounded-full bg-destructive/10">
        <Icon icon={Alert02Icon} className="size-[20px]" strokeWidth={2} />
      </span>
      <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
        <p className="text-[15px] font-semibold leading-[20px] tracking-[-0.2px]">Your account is locked</p>
        <p className="text-[13px] leading-[18px] text-destructive/85">
          <span className="hidden md:inline">
            We noticed unusual activity{email ? <> on <span className="font-medium text-destructive">{email}</span></> : null}. You can still read your records and manage your plan. Adding new files is paused until support unlocks the account.
          </span>
          <span className="md:hidden">Adding files is paused. Your records and plan stay available.</span>
        </p>
      </div>
      <div className="flex items-center gap-[6px] shrink-0">
        <Button asChild variant="destructive" className="h-[36px] px-[16px] text-[13px]">
          <a href={supportMailto(email)}>
            <Icon icon={Mail} className="size-[16px]" strokeWidth={2} />
            Write to support
          </a>
        </Button>
        <Button variant="ghost" onClick={openPlan} className="h-[36px] px-[14px] text-[13px] text-destructive hover:text-destructive hover:bg-destructive/10">
          Manage plan
        </Button>
      </div>
    </div>
  );
}
