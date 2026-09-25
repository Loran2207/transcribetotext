import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ArrowDown01Icon, ArrowUp01Icon, CheckmarkCircle02Icon, Copy01Icon, GiftIcon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { REWARD } from "./guides";
import { useOnboarding } from "./onboarding-context";

/* "Get started": a fixed card at the top of the Home right panel (web) and
   at the top of the Home column on the phone and tablet. The same card
   language as the Free plan card next to it, and as few words as it can
   carry: the title, what you get, the six lessons, Start on the next one,
   and the gift in red. Folded: the next lesson and the gift in one row.
   It cannot be hidden until the six are done; then the reward takes its
   place until the code is used or closed. */

const card = "shrink-0 rounded-[14px] overflow-hidden bg-card border border-border shadow-sm";

export function OnboardingCard() {
  const ob = useOnboarding();
  const reduce = useReducedMotion();
  if (ob.hidden) return null;
  const doneCount = ob.done.size;
  const total = ob.guides.length;
  const next = ob.guides.find((g) => !ob.done.has(g.id));

  if (ob.allDone) return <RewardCard onClose={ob.claimReward} />;

  return (
    <div data-onboarding-card="" data-state={ob.expanded ? "open" : "closed"} className={card}>
      <AnimatePresence initial={false} mode="wait">
        {ob.expanded ? (
          <motion.div key="open" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }}>
            <div className="flex items-start justify-between gap-3 px-[18px] pt-[16px]">
              <div className="min-w-0">
                <p className="text-foreground" style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px" }}>Get started</p>
                <p className="mt-[2px] text-[13px] leading-[18px] text-muted-foreground">Learn the app, get <span className="font-semibold text-destructive">1 month of Pro free</span>.</p>
              </div>
              <button type="button" onClick={() => ob.setExpanded(false)} data-onboarding-collapse="" aria-label="Collapse" className="-mr-2 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Icon icon={ArrowUp01Icon} size={14} />
              </button>
            </div>
            <ul className="flex flex-col gap-[2px] px-[8px] pt-[12px] pb-[10px]">
              {ob.guides.map((g, i) => {
                const done = ob.done.has(g.id);
                const isNext = next?.id === g.id;
                return (
                  <li key={g.id}>
                    <button type="button" data-onboarding-guide={g.id} onClick={() => ob.startGuide(g.id)} className={cn("flex w-full items-center gap-[12px] rounded-[10px] px-[10px] py-[8px] text-left transition-colors", isNext ? "bg-primary/[0.06] hover:bg-primary/[0.09]" : "hover:bg-muted/60 active:bg-muted/60")}>
                      <span className={cn("flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", done ? "text-primary" : isNext ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground")}>
                        {done ? <Icon icon={CheckmarkCircle02Icon} size={22} /> : i + 1}
                      </span>
                      <span className={cn("min-w-0 flex-1 truncate text-[13.5px] font-medium", done ? "text-muted-foreground line-through decoration-border" : "text-foreground")}>{g.title}</span>
                      {isNext && <span className="flex h-[28px] shrink-0 items-center rounded-full bg-primary px-[12px] text-[12px] font-semibold text-primary-foreground">Start</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-[10px] border-t border-border px-[18px] py-[10px]">
              <Icon icon={GiftIcon} size={16} className="shrink-0 text-destructive" />
              <span className="text-[12.5px] font-medium text-foreground">{doneCount} of {total} done</span>
              <span className="ml-auto text-[12px] text-muted-foreground">Gift at 6</span>
            </div>
          </motion.div>
        ) : (
          <motion.button key="closed" type="button" data-onboarding-pill="" onClick={() => ob.setExpanded(true)} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }} className="flex w-full items-center gap-[12px] px-[14px] py-[11px] text-left transition-colors hover:bg-muted/40">
            <Ring done={doneCount} total={total} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold text-foreground">Next: {next?.title}</span>
              <span className="block truncate text-[12px] leading-[16px] text-muted-foreground"><span className="font-medium text-destructive">1 month of Pro free</span> after lesson 6</span>
            </span>
            <Icon icon={ArrowDown01Icon} size={16} className="shrink-0 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function Ring({ done, total }: { done: number; total: number }) {
  const r = 12, c = 2 * Math.PI * r;
  return (
    <span className="relative flex size-[36px] shrink-0 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle cx="16" cy="16" r={r} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - done / total)} />
      </svg>
      <span className="text-[11px] font-semibold text-foreground">{done}/{total}</span>
    </span>
  );
}

function RewardCard({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const copy = async () => { try { await navigator.clipboard.writeText(REWARD.code); toast.success("Code copied"); } catch { toast(REWARD.code); } };
  return (
    <motion.div data-onboarding-reward="" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className={card}>
      <div className="flex flex-col gap-[12px] px-[18px] pt-[16px] pb-[16px]">
        <div className="flex items-start gap-[12px]">
          <span className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"><Icon icon={GiftIcon} size={20} /></span>
          <div className="min-w-0">
            <p className="text-foreground" style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px" }}>{REWARD.title}</p>
            <p className="mt-[3px] text-[13px] leading-[19px] text-foreground/80">{REWARD.body}</p>
          </div>
        </div>
        <button type="button" onClick={copy} data-onboarding-code="" className="flex items-center justify-between gap-2 rounded-[10px] border border-dashed border-destructive/50 bg-destructive/[0.05] px-[12px] py-[9px] text-left transition-colors hover:bg-destructive/[0.09]">
          <span className="font-mono text-[14px] font-semibold tracking-wide text-destructive">{REWARD.code}</span>
          <span className="flex items-center gap-1 text-[12px] font-medium text-destructive"><Icon icon={Copy01Icon} size={13} />Copy</span>
        </button>
        <Button data-onboarding-redeem="" onClick={() => { onClose(); navigate(`/checkout?code=${REWARD.code}`); }} className="h-10 w-full text-[13px] font-semibold">Claim my free month</Button>
        <button type="button" onClick={onClose} className="self-center text-[12px] font-medium text-muted-foreground hover:text-foreground">Later</button>
      </div>
    </motion.div>
  );
}
