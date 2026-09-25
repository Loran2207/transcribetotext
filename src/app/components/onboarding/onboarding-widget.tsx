import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ArrowDown01Icon, ArrowRight01Icon, ArrowUp01Icon, Cancel01Icon, CheckmarkCircle02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { REWARD } from "./guides";
import { useOnboarding } from "./onboarding-context";

/* "Get started": a fixed card at the top of the Home right panel (web) and at
   the top of the Home column on the phone and tablet.

   It is a card like the Free plan card next to it, not a floating thing, and
   it never disappears until the six guides are done: it folds into a compact
   row (illustration, title, progress, chevron) and unfolds from the same row.
   When everything is done the card becomes the reward. Closing the reward is
   the one action that removes it (the code is in the toast and at checkout). */

const COMPASS = "/images/onboarding-compass.png";
const HERO = "/images/onboarding-hero.png";
const GIFT = "/images/gift-box.png";

const card = "shrink-0 rounded-[14px] overflow-hidden bg-card border border-border shadow-sm";

export function OnboardingCard() {
  const ob = useOnboarding();
  const reduce = useReducedMotion();
  if (ob.hidden) return null;
  const doneCount = ob.done.size;
  const total = ob.guides.length;

  if (ob.allDone) return <RewardCard onClose={ob.claimReward} />;

  const bar = (
    <div className="h-[6px] w-full overflow-hidden rounded-full bg-muted">
      <motion.div className="h-full rounded-full bg-primary" initial={false} animate={{ width: `${Math.max(4, (doneCount / total) * 100)}%` }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 28 }} />
    </div>
  );

  return (
    <div data-onboarding-card="" data-state={ob.expanded ? "open" : "closed"} className={card}>
      <AnimatePresence initial={false} mode="wait">
        {ob.expanded ? (
          <motion.div key="open" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }}>
            {/* the picture: a soft blue field with the glass still-life */}
            {/* the picture: the glass still-life glowing on the same night blue as the desktop app card */}
            <div className="relative h-[136px] overflow-hidden bg-[#061a4d] md:max-lg:h-[220px]">
              <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover object-center md:max-lg:object-contain md:max-lg:scale-[1.15]" draggable={false} />
              <button type="button" onClick={() => ob.setExpanded(false)} data-onboarding-collapse="" aria-label="Collapse" className="absolute right-[10px] top-[10px] flex size-7 items-center justify-center rounded-full bg-white/15 text-white/90 backdrop-blur transition-colors hover:bg-white/25">
                <Icon icon={ArrowUp01Icon} size={14} />
              </button>
            </div>
            <div className="px-[18px] pt-[14px] pb-[6px]">
              <div className="flex items-baseline justify-between">
                <span className="text-foreground" style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px" }}>Get started</span>
                <span className="text-[12px] font-medium text-muted-foreground">{doneCount} of {total} done</span>
              </div>
              <div className="mt-[10px]">{bar}</div>
            </div>
            <ul className="flex flex-col px-[8px] pb-[6px]">
              {ob.guides.map((g, i) => {
                const done = ob.done.has(g.id);
                return (
                  <li key={g.id}>
                    <button type="button" data-onboarding-guide={g.id} onClick={() => ob.startGuide(g.id)} className="group/g flex w-full items-center gap-[12px] rounded-[10px] px-[10px] py-[9px] text-left transition-colors hover:bg-muted/60 active:bg-muted/60">
                      <span className={cn("flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", done ? "text-primary" : "border border-border text-muted-foreground")}>
                        {done ? <Icon icon={CheckmarkCircle02Icon} size={22} /> : i + 1}
                      </span>
                      <span className={cn("min-w-0 flex-1 truncate text-[13.5px] font-medium", done ? "text-muted-foreground line-through decoration-border" : "text-foreground")}>{g.title}</span>
                      <Icon icon={ArrowRight01Icon} size={14} className="shrink-0 text-muted-foreground/60 opacity-0 transition-opacity group-hover/g:opacity-100 max-lg:opacity-100" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mx-[10px] mb-[10px] flex items-center gap-[10px] rounded-[10px] bg-primary/[0.06] px-[12px] py-[9px]">
              <img src={GIFT} alt="" className="size-[26px] shrink-0 object-contain" draggable={false} />
              <p className="text-[12.5px] leading-[17px] text-foreground/80">Finish all {total} and get <span className="font-semibold text-foreground">1 month of Pro</span> free.</p>
            </div>
          </motion.div>
        ) : (
          <motion.button key="closed" type="button" data-onboarding-pill="" onClick={() => ob.setExpanded(true)} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }} className="flex w-full items-center gap-[12px] px-[14px] py-[12px] text-left transition-colors hover:bg-muted/40">
            <img src={COMPASS} alt="" className="size-[38px] shrink-0 object-contain" draggable={false} />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between">
                <span className="text-[14px] font-semibold text-foreground">Get started</span>
                <span className="text-[12px] font-medium text-muted-foreground">{doneCount} of {total}</span>
              </span>
              <span className="mt-[7px] block">{bar}</span>
            </span>
            <Icon icon={ArrowDown01Icon} size={16} className="shrink-0 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function RewardCard({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const copy = async () => { try { await navigator.clipboard.writeText(REWARD.code); toast.success("Code copied"); } catch { toast(REWARD.code); } };
  return (
    <motion.div data-onboarding-reward="" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className={card}>
      <div className="relative flex h-[136px] items-center justify-center overflow-hidden bg-[#061a4d] md:max-lg:h-[220px]">
        <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-40" draggable={false} />
        <img src={GIFT} alt="" className="relative h-[96px] w-auto object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)]" draggable={false} />
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-[10px] top-[10px] flex size-7 items-center justify-center rounded-full bg-white/15 text-white/90 backdrop-blur hover:bg-white/25"><Icon icon={Cancel01Icon} size={14} /></button>
      </div>
      <div className="flex flex-col gap-[12px] px-[18px] pt-[14px] pb-[16px]">
        <div>
          <p className="text-foreground" style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px" }}>{REWARD.title}</p>
          <p className="mt-[4px] text-[13px] leading-[19px] text-foreground/80">{REWARD.body}</p>
        </div>
        <button type="button" onClick={copy} data-onboarding-code="" className="flex items-center justify-between gap-2 rounded-[10px] border border-dashed border-primary/50 bg-primary/[0.05] px-[12px] py-[9px] text-left transition-colors hover:bg-primary/[0.09]">
          <span className="font-mono text-[14px] font-semibold tracking-wide text-primary">{REWARD.code}</span>
          <span className="flex items-center gap-1 text-[12px] font-medium text-primary"><Icon icon={Copy01Icon} size={13} />Copy</span>
        </button>
        <Button data-onboarding-redeem="" onClick={() => { onClose(); navigate("/checkout"); }} className="h-10 w-full text-[13px] font-semibold">Use it at checkout</Button>
      </div>
    </motion.div>
  );
}
