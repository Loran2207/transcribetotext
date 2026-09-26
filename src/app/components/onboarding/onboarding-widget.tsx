import type React from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ArrowDown01Icon, ArrowRight01Icon, ArrowUp01Icon, Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
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

/* the site's notch, a clean transition from the photograph into the list */
function Notch() {
  return (
    <svg aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 block h-[14px] w-[116px] -translate-x-1/2" viewBox="0 0 248 30" preserveAspectRatio="none">
      <path d="M44 30 C74 30 74 0 104 0 H144 C174 0 174 30 204 30 Z" fill="var(--card)" />
    </svg>
  );
}

/* the bordered family on the photograph: the count, the buttons, the promise */
const lined = "border border-white/35 text-white";
const lineButton = `flex size-[26px] shrink-0 items-center justify-center rounded-full ${lined} transition-colors`;

function Photo({ children, className, zoom }: { children: React.ReactNode; className?: string; zoom?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: NAVY }}>
      <img src={PHOTO} alt="" aria-hidden className={cn("absolute inset-y-0 right-0 h-full w-[72%] select-none object-cover transition-transform duration-500 ease-out", zoom && "group-hover:scale-[1.04]")} style={{ objectPosition: "72% 55%" }} />
      <span aria-hidden className="absolute inset-0" style={{ background: WASH }} />
      {children}
    </div>
  );
}

export function OnboardingCard() {
  const ob = useOnboarding();
  const reduce = useReducedMotion();
  if (ob.hidden) return null;
  const doneCount = ob.done.size;
  const total = ob.guides.length;
  const next = ob.guides.find((g) => !ob.done.has(g.id));

  if (ob.allDone) return <RewardCard onClose={ob.claimReward} />;

  const count = <span className={cn("flex h-[26px] items-center rounded-full px-[10px] text-[12px] font-semibold tabular-nums", lined)}>{doneCount} of {total}</span>;

  return (
    <div data-onboarding-card="" data-state={ob.expanded ? "open" : "closed"} className={card}>
      <AnimatePresence initial={false} mode="wait">
        {ob.expanded ? (
          <motion.div key="open" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }}>
            <Photo className="h-[108px]">
              <p className="absolute left-[18px] top-[16px] text-[16px] font-bold leading-[20px] tracking-[-0.2px] text-white">Get started</p>
              <div className="absolute right-[14px] top-[13px] flex items-center gap-[6px]">
                {count}
                <button type="button" onClick={() => ob.setExpanded(false)} data-onboarding-collapse="" aria-label="Collapse" className={cn(lineButton, "hover:border-white/70 hover:bg-white/10", focus)}>
                  <Icon icon={ArrowUp01Icon} size={14} strokeWidth={2.2} />
                </button>
              </div>
              <span className={cn("absolute bottom-[24px] left-[18px] flex h-[26px] items-center gap-[7px] rounded-full pl-[4px] pr-[11px] text-[12px] font-semibold", lined)}>
                <img src={GIFT} alt="" aria-hidden className="size-[18px] select-none rounded-full object-cover" />
                Free month when you finish
              </span>
              <Notch />
            </Photo>
            {/* the pipeline: one rail, six stops; a whole row lights on hover */}
            <ol className="flex flex-col px-[8px] pt-[6px] pb-[8px]">
              {ob.guides.map((g, i) => {
                const done = ob.done.has(g.id);
                const isNext = next?.id === g.id;
                const last = i === total - 1;
                return (
                  <li key={g.id} className="relative">
                    {/* the rail segment down to the next stop: blue once this lesson is done */}
                    {!last && <span aria-hidden className={cn("absolute left-[20px] top-[19px] z-[1] w-[2px] transition-colors duration-500", done ? "bg-primary" : "bg-border")} style={{ height: ROW }} />}
                    <button type="button" data-onboarding-guide={g.id} onClick={() => ob.startGuide(g.id)} className={cn("group flex w-full items-center gap-[12px] rounded-[10px] pl-[10px] pr-[6px] text-left transition-colors hover:bg-muted/70 active:bg-muted", focus)} style={{ height: ROW }}>
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
                        <Icon icon={ArrowRight01Icon} size={14} strokeWidth={2.2} className="mr-[4px] shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        ) : (
          <motion.button key="closed" type="button" data-onboarding-pill="" onClick={() => ob.setExpanded(true)} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }} className={cn("group block w-full text-left", focus)}>
            <Photo zoom className="flex h-[64px] items-center gap-[12px] pl-[18px] pr-[14px]">
              <span className="relative min-w-0 flex-1">
                <span className="flex items-center gap-[8px]">
                  <span className="text-[14px] font-bold leading-[18px] tracking-[-0.1px] text-white">Get started</span>
                  <span className={cn("rounded-full px-[7px] text-[11px] font-semibold leading-[17px] tabular-nums", lined)}>{doneCount} of {total}</span>
                </span>
                <span className="mt-[3px] block truncate text-[12px] font-semibold leading-[16px] text-white/70">Next: {next?.title}</span>
              </span>
              <span className={cn(lineButton, "relative group-hover:border-white/70 group-hover:bg-white/10")}><Icon icon={ArrowDown01Icon} size={14} strokeWidth={2.2} /></span>
            </Photo>
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
      <div className="flex flex-col gap-[12px] px-[18px] pt-[16px] pb-[14px]">
        <div className="flex items-start gap-[12px]">
          <img src={GIFT} alt="" aria-hidden className="size-[44px] shrink-0 select-none rounded-[12px] object-cover" />
          <div className="min-w-0">
            <p className="text-foreground" style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px" }}>{REWARD.title}</p>
            <p className="mt-[3px] text-[13px] leading-[19px] text-foreground/80">{REWARD.body}</p>
          </div>
        </div>
        <button type="button" onClick={copy} data-onboarding-code="" className={cn("flex items-center justify-between gap-2 rounded-[10px] border border-dashed border-primary/40 bg-primary/[0.05] px-[12px] py-[9px] text-left transition-colors hover:bg-primary/[0.09]", focus)}>
          <span className="font-mono text-[14px] font-semibold tracking-wide text-primary">{REWARD.code}</span>
          <span className="flex items-center gap-1 text-[12px] font-medium text-primary"><Icon icon={Copy01Icon} size={13} />Copy</span>
        </button>
        <Button data-onboarding-redeem="" onClick={() => { onClose(); navigate(`/checkout?code=${REWARD.code}`); }} className="h-10 w-full text-[13px] font-semibold">Claim my free month</Button>
        <button type="button" onClick={onClose} className={cn("self-center rounded-full px-[8px] py-[2px] text-[12px] font-medium text-muted-foreground hover:text-foreground", focus)}>Later</button>
      </div>
    </motion.div>
  );
}
