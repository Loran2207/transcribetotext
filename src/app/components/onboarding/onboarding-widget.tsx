import { useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight01Icon, Cancel01Icon, CheckmarkCircle02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { useIsPhone } from "../ui/use-mobile";
import { cn } from "../ui/utils";
import { REWARD } from "./guides";
import { useOnboarding } from "./onboarding-context";

/* "Get started": the floating card at the bottom left of the app.

   Three states. A pill when collapsed (compass, "Get started", 2 of 6). A card
   when open: the six guides as rows, each one tap away, the finished ones
   ticked, and the reward line at the bottom. When all six are done the card
   becomes the reward: the code, Copy, and a button into checkout.

   It lives inside the app shell (not on the sidebar), so it moves with the
   sidebar and never covers the "+" button on the right. On the phone the pill
   sits at the bottom left and opens a bottom sheet with the same rows. */

const COMPASS = "/images/onboarding-compass.png";
const GIFT = "/images/gift-box.png";

export function OnboardingWidget() {
  const ob = useOnboarding();
  const phone = useIsPhone();
  const reduce = useReducedMotion();
  const [sheet, setSheet] = useState(false);

  if (ob.hidden || ob.tour) return null;
  const doneCount = ob.done.size;
  const total = ob.guides.length;

  const rows = (
    <ul className="flex flex-col">
      {ob.guides.map((g, i) => {
        const done = ob.done.has(g.id);
        return (
          <li key={g.id}>
            <button
              type="button"
              data-onboarding-guide={g.id}
              onClick={() => { setSheet(false); ob.startGuide(g.id); }}
              className={cn(
                "group/g flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/60 active:bg-muted/60",
                phone && "py-3",
              )}
            >
              <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", done ? "text-primary" : "border border-border text-muted-foreground")}>
                {done ? <Icon icon={CheckmarkCircle02Icon} size={22} /> : i + 1}
              </span>
              <span className={cn("min-w-0 flex-1 truncate text-[13px] font-medium", phone && "text-[14px]", done ? "text-muted-foreground line-through decoration-border" : "text-foreground")}>{g.title}</span>
              <Icon icon={ArrowRight01Icon} size={14} className={cn("shrink-0 text-muted-foreground/70", !phone && "opacity-0 transition-opacity group-hover/g:opacity-100")} />
            </button>
          </li>
        );
      })}
    </ul>
  );

  const progress = (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <motion.div className="h-full rounded-full bg-primary" initial={false} animate={{ width: `${(doneCount / total) * 100}%` }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 28 }} />
      </div>
      <span className="shrink-0 text-[12px] font-medium text-muted-foreground">{doneCount} of {total}</span>
    </div>
  );

  const rewardLine = (
    <div className="flex items-center gap-2.5 rounded-xl bg-primary/[0.06] px-3 py-2">
      <img src={GIFT} alt="" className="size-7 shrink-0 object-contain" draggable={false} />
      <p className="text-[12px] leading-[16px] text-foreground/80">Finish all {total} and get <span className="font-semibold text-foreground">1 month of Pro</span> free.</p>
    </div>
  );

  /* ── the reward, once everything is done ── */
  if (ob.allDone) {
    const copy = async () => { try { await navigator.clipboard.writeText(REWARD.code); toast.success("Code copied"); } catch { toast(REWARD.code); } };
    return (
      <Shell phone={phone}>
        <motion.div data-onboarding-reward="" initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className={cn("relative flex flex-col gap-3 rounded-[16px] border border-border bg-popover p-4 shadow-[var(--elevation-md)]", phone ? "w-full" : "w-[300px]")}>
          <button type="button" onClick={ob.claimReward} aria-label="Close" className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><Icon icon={Cancel01Icon} size={14} /></button>
          <img src={GIFT} alt="" className="size-14 object-contain" draggable={false} />
          <div>
            <p className="text-[15px] font-semibold leading-[20px] text-foreground">{REWARD.title}</p>
            <p className="mt-1 text-[13px] leading-[19px] text-foreground/80">{REWARD.body}</p>
          </div>
          <button type="button" onClick={copy} data-onboarding-code="" className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/[0.05] px-3 py-2 text-left transition-colors hover:bg-primary/[0.09]">
            <span className="font-mono text-[14px] font-semibold tracking-wide text-primary">{REWARD.code}</span>
            <span className="flex items-center gap-1 text-[12px] font-medium text-primary"><Icon icon={Copy01Icon} size={13} />Copy</span>
          </button>
          <RewardButton onDone={ob.claimReward} />
        </motion.div>
      </Shell>
    );
  }

  /* ── phone: pill + sheet ── */
  if (phone) {
    return (
      <>
        <Shell phone>
          <Pill doneCount={doneCount} total={total} onClick={() => setSheet(true)} />
        </Shell>
        <Drawer open={sheet} onOpenChange={setSheet}>
          <DrawerContent className="[&>div:first-child]:hidden">
            <DrawerHeader className="flex-row items-center justify-between pb-2 text-left">
              <DrawerTitle>Get started</DrawerTitle>
              <button type="button" onClick={() => setSheet(false)} aria-label="Close" className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60"><Icon icon={Cancel01Icon} size={16} /></button>
            </DrawerHeader>
            <div className="flex flex-col gap-3 px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
              {progress}
              {rows}
              {rewardLine}
              <button type="button" onClick={() => { setSheet(false); ob.hide(); }} className="self-start px-2 text-[12px] font-medium text-muted-foreground hover:text-foreground">Hide this</button>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  /* ── web: pill or card ── */
  return (
    <Shell phone={false}>
      <AnimatePresence mode="wait" initial={false}>
        {ob.expanded ? (
          <motion.div key="card" data-onboarding-card="" initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? undefined : { opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="flex w-[300px] flex-col gap-3 rounded-[16px] border border-border bg-popover p-3 shadow-[var(--elevation-md)]">
            <div className="flex items-center gap-3 px-1 pt-1">
              <img src={COMPASS} alt="" className="size-9 shrink-0 object-contain" draggable={false} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-[18px] text-foreground">Get started</p>
                <p className="text-[12px] text-muted-foreground">Six short guides, one minute each</p>
              </div>
              <button type="button" onClick={() => ob.setExpanded(false)} aria-label="Collapse" className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><Icon icon={Cancel01Icon} size={14} /></button>
            </div>
            <div className="px-1">{progress}</div>
            {rows}
            {rewardLine}
            <button type="button" onClick={ob.hide} className="self-start px-2 pb-1 text-[12px] font-medium text-muted-foreground hover:text-foreground">Hide this</button>
          </motion.div>
        ) : (
          <motion.div key="pill" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: 6 }} transition={{ duration: 0.18 }}>
            <Pill doneCount={doneCount} total={total} onClick={() => ob.setExpanded(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  );
}

function Pill({ doneCount, total, onClick }: { doneCount: number; total: number; onClick: () => void }) {
  const r = 9, c = 2 * Math.PI * r;
  return (
    <button type="button" data-onboarding-pill="" onClick={onClick} className="flex h-11 items-center gap-2.5 rounded-full border border-border bg-popover pl-2 pr-4 shadow-[var(--elevation-md)] transition-transform hover:-translate-y-px active:scale-[0.98]">
      <span className="relative flex size-8 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r={r} fill="none" stroke="var(--border)" strokeWidth="2" />
          <circle cx="12" cy="12" r={r} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - doneCount / total)} />
        </svg>
        <img src={COMPASS} alt="" className="size-5 object-contain" draggable={false} />
      </span>
      <span className="text-[13px] font-semibold text-foreground">Get started</span>
      <span className="text-[12px] font-medium text-muted-foreground">{doneCount} of {total}</span>
    </button>
  );
}

function RewardButton({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  return (
    <Button data-onboarding-redeem="" onClick={() => { onDone(); navigate("/checkout"); }} className="h-10 w-full text-[13px] font-semibold">Use it at checkout</Button>
  );
}

/* Where the widget sits: bottom left of the shell, above the phone's safe
   area, under dialogs (z 50) and the tour (z 200). */
function Shell({ phone, children }: { phone: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("pointer-events-none absolute z-[45]", phone ? "left-4 right-[88px] bottom-[calc(24px+env(safe-area-inset-bottom))]" : "left-6 bottom-6")}>
      <div className="pointer-events-auto">{children}</div>
    </div>
  );
}
