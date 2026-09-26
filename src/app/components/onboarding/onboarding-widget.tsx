import type React from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ArrowUp01Icon, Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { cn } from "../ui/utils";
import { REWARD } from "./guides";
import { useOnboarding } from "./onboarding-context";

/* "Get started": a fixed card at the top of the Home right panel (web) and
   at the top of the Home column on the phone and tablet.

   Built in the in-app banner language (Kirill, reviews 28-30, 26.09): navy
   laid over a dark photograph from the left, sentence-case type on it, small
   and heavy, one bordered family of chips and buttons. The site's notch is a
   clean bite between the photograph and the list, it carries nothing. Below,
   the six lessons run on one rail; a whole row lights on hover.

   One grid for the whole card: 18px from the left (the title, the chip, the
   rail's stops), 14px from the right (the buttons, the Start pill). */

const PHOTO = "/images/onboarding-start.jpg";
const GIFT = "/images/onboarding-gift.png";
/* the in-app banner language (desktop-app-banner.tsx): the photograph on the
   right, the navy laid over it from the left so the type sits on solid colour */
const NAVY = "#0A1630";
const WASH = "linear-gradient(90deg, #0A1630 0%, #0A1630 40%, rgba(10,22,48,0.6) 70%, rgba(10,22,48,0.2) 100%)";

const card = "shrink-0 rounded-[14px] overflow-hidden bg-card border border-border shadow-sm";
const ROW = 38; /* one lesson row, px */
const focus = "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0";

/* the site's notch, twice and small: one bite at each side of the bottom edge,
   so the header reads like the promo ticket next to it and the chevron sits
   on the card's centre line */
function Notches() {
  const path = "M44 30 C74 30 74 0 104 0 H144 C174 0 174 30 204 30 Z";
  const cls = "pointer-events-none absolute bottom-[-1px] block h-[10px] w-[72px]";
  return (
    <>
      <svg aria-hidden className={cn(cls, "left-[22px]")} viewBox="0 0 248 30" preserveAspectRatio="none"><path d={path} fill="var(--card)" /></svg>
      <svg aria-hidden className={cn(cls, "right-[22px]")} viewBox="0 0 248 30" preserveAspectRatio="none"><path d={path} fill="var(--card)" /></svg>
    </>
  );
}

const iconButton = "flex size-[26px] shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white";

export function OnboardingCard() {
  const ob = useOnboarding();
  const reduce = useReducedMotion();
  if (ob.hidden) return null;
  const doneCount = ob.done.size;
  const total = ob.guides.length;
  const next = ob.guides.find((g) => !ob.done.has(g.id));
  const open = ob.expanded;

  if (ob.allDone) return <RewardCard onClose={ob.claimReward} />;

  const fade = { initial: reduce ? false : { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, exit: reduce ? undefined : { opacity: 0, y: -4 }, transition: { duration: 0.16 } } as const;

  return (
    <div data-onboarding-card="" data-state={open ? "open" : "closed"} className={cn(card, !open && "border-0")}>
      {/* the header: folded, it is the promo ticket's size (63px, 13/11 type); open, it grows
          to 78px with the larger type. The two texts crossfade, nothing scales. */}
      <motion.div initial={false} animate={{ height: open ? 78 : 63 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }} className="relative overflow-hidden" style={{ background: NAVY }}>
        <img src={PHOTO} alt="" aria-hidden className="absolute inset-y-0 right-0 h-full w-[72%] select-none object-cover" style={{ objectPosition: "72% 55%" }} />
        <span aria-hidden className="absolute inset-0" style={{ background: WASH }} />
        <button type="button" data-onboarding-pill={open ? undefined : ""} aria-label={open ? undefined : "Expand"} onClick={() => { if (!open) ob.setExpanded(true); }} className={cn("absolute inset-0 text-left", open && "cursor-default")}>
          <AnimatePresence initial={false} mode="wait">
            {open ? (
              <motion.span key="open" {...fade} className="absolute left-[18px] top-[15px] right-[52px]">
                <span className="block truncate text-[15.5px] font-bold leading-[20px] tracking-[-0.2px] text-white">Learn Transcribe To Text AI</span>
                <span className="mt-[2px] block truncate text-[12.5px] font-medium leading-[17px] text-white/70">Six short lessons<span className="text-white/45"> · </span><span className="tabular-nums text-white/85">{doneCount} of {total} done</span></span>
              </motion.span>
            ) : (
              <motion.span key="closed" {...fade} className="absolute left-[19px] top-[12px] right-[52px]">
                <span className="block truncate text-[13px] font-semibold leading-[19.5px] text-white">Learn Transcribe To Text AI</span>
                <span className="mt-[1px] flex items-center gap-[5px] text-[11px] font-medium leading-[16.5px] text-white/80">
                  <img src={GIFT} alt="" aria-hidden className="size-[14px] shrink-0 select-none object-contain" />
                  <span className="truncate">Finish {total} lessons, get 1 month free</span>
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button type="button" onClick={() => ob.setExpanded(!open)} data-onboarding-collapse={open ? "" : undefined} aria-label={open ? "Collapse" : "Expand"} className={cn(iconButton, "absolute right-[12px] top-1/2 -translate-y-1/2", focus)}>
          <motion.span animate={{ rotate: open ? 0 : 180 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 26 }} className="flex">
            <Icon icon={ArrowUp01Icon} size={14} strokeWidth={2.2} />
          </motion.span>
        </button>
        <Notches />
      </motion.div>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} transition={reduce ? { duration: 0 } : { height: { type: "spring", stiffness: 260, damping: 32 }, opacity: { duration: 0.18 } }} style={{ overflow: "hidden" }}>
        {/* the pipeline: one rail, six stops, and the gift where the rail ends */}
        <ol className="relative -mt-px flex flex-col bg-card px-[8px] pt-[7px] pb-[8px]">
          {ob.guides.map((g, i) => {
            const done = ob.done.has(g.id);
            const isNext = next?.id === g.id;
            return (
              <li key={g.id} className="relative">
                {/* the rail segment down to the next stop (or to the gift): blue once this lesson is done */}
                <span aria-hidden className={cn("absolute left-[20px] top-[19px] z-[1] w-[2px] transition-colors duration-500", done ? "bg-primary" : "bg-border")} style={{ height: ROW }} />
                <button type="button" tabIndex={open ? 0 : -1} data-onboarding-guide={g.id} onClick={() => ob.startGuide(g.id)} className={cn("group flex w-full items-center gap-[12px] rounded-[10px] pl-[10px] pr-[6px] text-left transition-colors hover:bg-muted/70 active:bg-muted", focus)} style={{ height: ROW }}>
                  <span className={cn(
                    "relative z-[2] flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-colors",
                    done ? "bg-primary text-primary-foreground"
                      : isNext ? "border-2 border-primary bg-card text-primary"
                      : "border-2 border-border bg-card text-muted-foreground group-hover:border-foreground/25 group-hover:text-foreground",
                  )}>
                    {done ? <Icon icon={Tick02Icon} size={12} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn("min-w-0 flex-1 truncate text-[13.5px] leading-[18px] transition-colors", done ? "font-medium text-muted-foreground group-hover:text-foreground/80" : isNext ? "font-semibold text-foreground" : "font-medium text-foreground/80 group-hover:text-foreground")}>{g.title}</span>
                  {isNext ? (
                    <span className="flex h-[26px] shrink-0 items-center rounded-full bg-primary px-[12px] text-[12px] font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">Start</span>
                  ) : (
                    <span className="flex h-[26px] shrink-0 items-center rounded-full border border-border bg-card px-[12px] text-[12px] font-semibold text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{done ? "Again" : "Start"}</span>
                  )}
                </button>
              </li>
            );
          })}
          {/* the destination: the gift, on the same rail, in the same column */}
          <li className="relative mt-[4px]">
            <div data-onboarding-goal="" className="flex h-[54px] items-center gap-[12px] rounded-[12px] bg-primary/[0.06] pl-[7px] pr-[12px]">
              <span className="relative z-[2] flex size-[28px] shrink-0 items-center justify-center rounded-full bg-card ring-[3px] ring-card">
                <img src={GIFT} alt="" aria-hidden className="size-[26px] select-none object-contain" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold leading-[18px] text-foreground">Your gift: 1 month free</span>
                <span className="block truncate text-[12px] font-medium leading-[16px] text-muted-foreground">Unlocks after lesson {total}</span>
              </span>
            </div>
          </li>
        </ol>
      </motion.div>
    </div>
  );
}

function RewardCard({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const hide = () => { onClose(); toast("Your code is saved", { description: "Settings, Plan Management, whenever you want it." }); };
  return (
    <motion.div data-onboarding-reward="" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className={card}>
      {/* the promo card's language: the same ticket tint, the open gift, the code in colour */}
      <div className="relative flex h-[84px] items-center bg-primary/[0.06] pl-[18px] pr-[104px]">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-[18px] text-foreground">Your free month</p>
          <p className="font-mono text-[13px] font-bold leading-[18px] tracking-wide text-primary">{REWARD.code}</p>
          <button type="button" data-onboarding-redeem="" onClick={() => { onClose(); navigate(`/checkout?code=${REWARD.code}`); }} className="mt-[3px] flex items-center gap-[2px] text-[12px] font-medium text-primary hover:underline">Claim now <span aria-hidden>›</span></button>
        </div>
        <img src="/images/discount-gift.png" alt="" aria-hidden className="pointer-events-none absolute right-[34px] top-1/2 size-[78px] -translate-y-1/2 select-none object-contain" />
        <button type="button" onClick={hide} aria-label="Hide" className="absolute right-[8px] top-[8px] flex size-[22px] items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground transition-colors hover:bg-foreground/[0.12] hover:text-foreground">
          <Icon icon={Cancel01Icon} size={12} strokeWidth={2.4} />
        </button>
      </div>
    </motion.div>
  );
}
