import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ArrowDown01Icon, ArrowRight01Icon, ArrowUp01Icon, CheckmarkCircle02Icon, Copy01Icon, GiftIcon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { REWARD } from "./guides";
import { useOnboarding } from "./onboarding-context";

/* "Get started": a fixed card at the top of the Home right panel (web) and
   at the top of the Home column on the phone and tablet. The same card
   language as the Free plan card next to it: white, hairline, 14px corners,
   no picture.

   Open: title, one line that says what you get (six lessons, a month of
   Pro), the progress bar, the six lessons with their outcome, the next one
   lit with a Start button, and the reward line. Folded: one row that names
   the next lesson and the reward, so it is never a mystery why it is there.
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

  const bar = (
    <div className="h-[6px] w-full overflow-hidden rounded-full bg-muted">
      <motion.div className="h-full rounded-full bg-primary" initial={false} animate={{ width: `${Math.max(3, (doneCount / total) * 100)}%` }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 28 }} />
    </div>
  );

  return (
    <div data-onboarding-card="" data-state={ob.expanded ? "open" : "closed"} className={card}>
      <AnimatePresence initial={false} mode="wait">
        {ob.expanded ? (
          <motion.div key="open" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }}>
            <div className="px-[18px] pt-[16px] pb-[4px]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-foreground" style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px" }}>Get started</p>
                  <p className="mt-[3px] text-[12.5px] leading-[17px] text-muted-foreground">Six short lessons on a sample recording. Finish them and a month of Pro is on us.</p>
                </div>
                <button type="button" onClick={() => ob.setExpanded(false)} data-onboarding-collapse="" aria-label="Collapse" className="-mr-2 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Icon icon={ArrowUp01Icon} size={14} />
                </button>
              </div>
              <div className="mt-[12px] flex items-center gap-[10px]">
                {bar}
                <span className="shrink-0 text-[12px] font-medium text-muted-foreground">{doneCount} of {total}</span>
              </div>
            </div>
            <ul className="flex flex-col gap-[2px] px-[8px] pt-[8px] pb-[8px]">
              {ob.guides.map((g, i) => {
                const done = ob.done.has(g.id);
                const isNext = next?.id === g.id;
                return (
                  <li key={g.id}>
                    <button type="button" data-onboarding-guide={g.id} onClick={() => ob.startGuide(g.id)} className={cn("group/g flex w-full items-center gap-[12px] rounded-[10px] px-[10px] py-[8px] text-left transition-colors", isNext ? "bg-primary/[0.06] hover:bg-primary/[0.09]" : "hover:bg-muted/60 active:bg-muted/60")}>
                      <span className={cn("flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", done ? "text-primary" : isNext ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground")}>
                        {done ? <Icon icon={CheckmarkCircle02Icon} size={22} /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-[13.5px] font-medium", done ? "text-muted-foreground line-through decoration-border" : "text-foreground")}>{g.title}</span>
                        {!done && <span className="block truncate text-[12px] leading-[16px] text-muted-foreground">{g.outcome}</span>}
                      </span>
                      {isNext ? (
                        <span className="flex h-[28px] shrink-0 items-center rounded-full bg-primary px-[12px] text-[12px] font-semibold text-primary-foreground">Start</span>
                      ) : (
                        <Icon icon={ArrowRight01Icon} size={14} className={cn("shrink-0 text-muted-foreground/60 transition-opacity", !done && "opacity-0 group-hover/g:opacity-100 max-lg:opacity-100", done && "opacity-0")} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mx-[10px] mb-[10px] flex items-center gap-[10px] rounded-[10px] bg-muted/50 px-[12px] py-[9px]">
              <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon icon={GiftIcon} size={15} /></span>
              <p className="text-[12.5px] leading-[17px] text-foreground/80">{total - doneCount === 1 ? "One lesson left" : `${total - doneCount} lessons left`} until your <span className="font-semibold text-foreground">free month of Pro</span>.</p>
            </div>
          </motion.div>
        ) : (
          <motion.button key="closed" type="button" data-onboarding-pill="" onClick={() => ob.setExpanded(true)} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }} className="flex w-full items-center gap-[12px] px-[14px] py-[11px] text-left transition-colors hover:bg-muted/40">
            <Ring done={doneCount} total={total} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold text-foreground">Next: {next?.title}</span>
              <span className="block truncate text-[12px] leading-[16px] text-muted-foreground">{doneCount} of {total} done. A free month of Pro at the end.</span>
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
      <span className="text-[11px] font-semibold text-foreground">{done}</span>
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
          <span className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon icon={GiftIcon} size={20} /></span>
          <div className="min-w-0">
            <p className="text-foreground" style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px" }}>{REWARD.title}</p>
            <p className="mt-[3px] text-[13px] leading-[19px] text-foreground/80">{REWARD.body}</p>
          </div>
        </div>
        <button type="button" onClick={copy} data-onboarding-code="" className="flex items-center justify-between gap-2 rounded-[10px] border border-dashed border-primary/50 bg-primary/[0.05] px-[12px] py-[9px] text-left transition-colors hover:bg-primary/[0.09]">
          <span className="font-mono text-[14px] font-semibold tracking-wide text-primary">{REWARD.code}</span>
          <span className="flex items-center gap-1 text-[12px] font-medium text-primary"><Icon icon={Copy01Icon} size={13} />Copy</span>
        </button>
        <Button data-onboarding-redeem="" onClick={() => { onClose(); navigate(`/checkout?code=${REWARD.code}`); }} className="h-10 w-full text-[13px] font-semibold">Claim my free month</Button>
        <button type="button" onClick={onClose} className="self-center text-[12px] font-medium text-muted-foreground hover:text-foreground">Later</button>
      </div>
    </motion.div>
  );
}
