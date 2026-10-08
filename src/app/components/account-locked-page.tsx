import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { Mail, LogOut } from "@hugeicons/core-free-icons";
import { Button } from "@/app/components/ui/button";
import { Icon } from "@/app/components/ui/icon";
import { DesktopWindowFrame } from "./desktop/shell";
import { useAuth } from "./auth-context";
import svgPaths from "../../imports/svg-i3wf63n6gj";

/* Demo flag: ttt_demo_locked=1 in localStorage shows the locked state to a
   signed-in account. The real lock will come from the backend once the team
   decides what counts as suspicious; this page is the state it shows. */
const LOCK_FLAG = "ttt_demo_locked";
const SUPPORT = "support@transcribetotext.ai";

export function readDemoLock(): boolean {
  try { return window.localStorage.getItem(LOCK_FLAG) === "1"; } catch { return false; }
}

export function clearDemoLock() {
  try { window.localStorage.removeItem(LOCK_FLAG); } catch { /* demo flag only */ }
}

/* The page an account meets while it is locked. The same composition as the
   404: the logo, one picture from the product's own glossy set, a headline,
   two sentences (what happened, what is safe), one way out. Sign out stays so
   the person can switch to another account; nothing else of the app is
   reachable until support unlocks this one. */
export function AccountLockedPage() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? "";
  const prefersReducedMotion = useReducedMotion();
  const animProps = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { type: "spring" as const, stiffness: 400, damping: 28, delay },
        };
  const subject = encodeURIComponent("Unlock my account" + (email ? ": " + email : ""));
  const body = encodeURIComponent(
    "Hi,\n\nMy account" + (email ? " (" + email + ")" : "") + " is locked. Please check it and unlock it.\n\n",
  );
  return (
    <DesktopWindowFrame>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex h-[64px] shrink-0 items-center px-5 md:px-8">
          <Link to="/" aria-label="TranscribeToText home" className="block h-[30px] w-[180px]">
            <svg className="block size-full" fill="none" viewBox="0 0 180 30">
              <path d={svgPaths.p2badec00} fill="var(--primary)" />
              <path d={svgPaths.p1a0b7800} fill="var(--primary)" />
              <path clipRule="evenodd" d={svgPaths.p27195800} fill="var(--primary)" fillRule="evenodd" />
              {[svgPaths.p13614280, svgPaths.p11015500, svgPaths.p1f84c200, svgPaths.p3c365b00, svgPaths.p10e82600, svgPaths.pc3be80, svgPaths.p1b650100, svgPaths.p2868a650, svgPaths.p284dfb60, svgPaths.p1bf24200, svgPaths.p3f098bc0, svgPaths.p27b8300, svgPaths.p2a7a24b0, svgPaths.p13ca3e70, svgPaths.padf6a00, svgPaths.p4d43600, svgPaths.p81b6100].map((d, i) => (
                <path key={i} d={d} fill="var(--foreground)" />
              ))}
            </svg>
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center" data-account-locked>
          <motion.div {...animProps(0)} className="relative mb-2 flex size-[200px] items-center justify-center md:size-[240px]">
            <div className="absolute inset-6 rounded-full bg-primary/10 blur-3xl" />
            <img src="/images/locked-padlock.png" alt="" className="relative size-full object-contain" />
          </motion.div>

          <motion.h1 {...animProps(0.06)} className="mt-2 text-[22px] font-semibold text-foreground md:text-[26px]">
            Your account is temporarily locked
          </motion.h1>
          <motion.p {...animProps(0.1)} className="mt-2 max-w-[420px] text-[15px] leading-relaxed text-muted-foreground">
            We noticed unusual activity on {email ? <span className="font-medium text-foreground">{email}</span> : "this account"} and paused it as a precaution.
            Nothing was deleted: your recordings and notes are kept.
          </motion.p>
          <motion.p {...animProps(0.14)} className="mt-3 max-w-[420px] text-[15px] leading-relaxed text-muted-foreground">
            To unlock it, write to support. A person checks the account and replies to your email.
          </motion.p>

          <motion.div {...animProps(0.2)} className="mt-8 flex w-full max-w-[360px] flex-col items-center gap-3 sm:w-auto">
            <Button asChild size="lg" className="w-full gap-2 sm:w-auto sm:px-8">
              <a href={`mailto:${SUPPORT}?subject=${subject}&body=${body}`}><Icon icon={Mail} size={16} />Write to support</a>
            </Button>
            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground"
              onClick={() => { clearDemoLock(); signOut(); }}
            >
              <Icon icon={LogOut} size={16} />Sign out
            </Button>
          </motion.div>

          <motion.p {...animProps(0.26)} className="mt-8 text-[13px] text-muted-foreground">
            Support: <a href={`mailto:${SUPPORT}`} className="font-medium text-primary hover:underline">{SUPPORT}</a>
          </motion.p>
        </main>
      </div>
    </DesktopWindowFrame>
  );
}
