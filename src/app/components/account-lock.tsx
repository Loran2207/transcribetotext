import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Alert02Icon, Mail } from "@hugeicons/core-free-icons";
import { Button } from "@/app/components/ui/button";
import { Icon } from "@/app/components/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { ToastCard } from "./app-toast";
import { useAuth } from "./auth-context";

/* Demo flag: ttt_demo_locked=1 in localStorage shows the locked state to a
   signed-in account. The real verdict will come from the backend once the team
   decides what counts as suspicious; this file is the state the app shows.

   A locked account is not shut out: the person still reads their records.
   What stops is everything that costs the company money: adding files
   (upload, recording, meeting bot, link), applying templates, translating.
   Every such control stays where it is, greyed, with a tooltip that says why
   on hover and the same words as a toast on a press. The one way out is
   support. */
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

/* What a locked control would have done, in the words of its own label. */
export type LockedWhat = "files" | "recording" | "meetings" | "templates" | "translation";

const PAUSED: Record<LockedWhat, string> = {
  files: "Adding files is paused",
  recording: "Recording is paused",
  meetings: "Meeting recording is paused",
  templates: "Templates are paused",
  translation: "Translation is paused",
};

export const LOCKED_REASON = "Your account is locked. Write to support to unlock it.";

/* The one message a blocked action gives, wherever it was tried from. It names
   what is paused and hands over the way out. */
export function toastLocked(what: LockedWhat = "files", email = "") {
  toast.custom(
    (id) => (
      <ToastCard
        tone="error"
        title={PAUSED[what]}
        meta={LOCKED_REASON}
        action={{ label: "Write to support", onClick: () => { toast.dismiss(id); window.location.href = supportMailto(email); } }}
      />
    ),
    { duration: 6000 },
  );
}

/* Hover explanation for a greyed control. Wraps the trigger in a span so the
   tooltip still opens when the control itself is disabled. Does nothing while
   the account is not locked. */
export function LockedTooltip({ what, locked, children }: { what: LockedWhat; locked: boolean; children: ReactNode; className?: string }) {
  if (!locked) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[240px] text-center">
        {PAUSED[what]}. {LOCKED_REASON}
      </TooltipContent>
    </Tooltip>
  );
}

/* The classes a locked control wears: still in place, visibly inactive. */
export const LOCKED_CLASS = "grayscale opacity-45 cursor-not-allowed";

/* Sits at the top of the content area on every page while the lock holds. Not
   dismissible: it is the state, not a notice. One line says what happened and
   what still works; the one button is the one way out. */
export function AccountLockedBanner() {
  const locked = useAccountLock();
  const { user } = useAuth();
  if (!locked) return null;
  const email = user?.email ?? "";

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
            We noticed unusual activity{email ? <> on <span className="font-medium text-destructive">{email}</span></> : null}. You can still read your records. Adding files, templates and translation are paused until support unlocks the account.
          </span>
          <span className="md:hidden">Adding files, templates and translation are paused. Your records stay available.</span>
        </p>
      </div>
      <div className="flex items-center shrink-0">
        <Button asChild variant="destructive" className="h-[36px] px-[16px] text-[13px]">
          <a href={supportMailto(email)}>
            <Icon icon={Mail} className="size-[16px]" strokeWidth={2} />
            Write to support
          </a>
        </Button>
      </div>
    </div>
  );
}
