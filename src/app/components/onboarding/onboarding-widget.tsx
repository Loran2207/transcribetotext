import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ArrowDown01Icon, ArrowUp01Icon, Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { REWARD } from "./guides";
import { useOnboarding } from "./onboarding-context";

/* "Get started": a fixed card at the top of the Home right panel (web) and
   at the top of the Home column on the phone and tablet.

   Review 28 (Kirill, 26.09): built in the marketing site's language. The
   top is a photograph generated DARK in the site's blue-night grade, type on
   it is small and heavy, and the site's transition notch is bitten into the
   photograph's bottom edge. Below, the six lessons run on one line, a
   pipeline, and the line ends in the gift. As few words as it can carry. */

const PHOTO = "/images/onboarding-start.jpg";
const GIFT = "/images/onboarding-gift.png";

const card = "shrink-0 rounded-[14px] overflow-hidden bg-card border border-border shadow-sm";

/* the site's notch (SectionCutout), turned to bite the photograph from below */
function Notch() {
  return (
    <svg aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 block h-[16px] w-[132px] -translate-x-1/2" viewBox="0 0 248 30" preserveAspectRatio="xMidYMax meet">
      <path d="M44 30 C74 30 74 0 104 0 H144 C174 0 174 30 204 30 Z" fill="var(--card)" />
    </svg>
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

  return (
    <div data-onboarding-card="" data-state={ob.expanded ? "open" : "closed"} className={card}>
      <AnimatePresence initial={false} mode="wait">
        {ob.expanded ? (
          <motion.div key="open" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }}>
            <div className="relative h-[128px] overflow-hidden">
              <img src={PHOTO} alt="" aria-hidden className="absolute inset-0 h-full w-full select-none object-cover" />
              <div className="absolute left-[16px] top-[14px]">
                <p className="text-[11px] font-bold uppercase leading-[14px] tracking-[0.08em] text-white/70">Get started</p>
                <p className="mt-[4px] text-[15px] font-semibold leading-[20px] tracking-[-0.2px] text-white">Six lessons, one free month</p>
              </div>
              <span className="absolute right-[44px] top-[12px] rounded-full bg-white/[0.14] px-[8px] py-[3px] text-[11px] font-bold leading-[14px] text-white ring-1 ring-inset ring-white/20">{doneCount}/{total}</span>
              <button type="button" onClick={() => ob.setExpanded(false)} data-onboarding-collapse="" aria-label="Collapse" className="absolute right-[10px] top-[9px] flex size-7 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                <Icon icon={ArrowUp01Icon} size={14} />
              </button>
              <Notch />
            </div>
            {/* the pipeline: one rail, six stops, the gift at the end */}
            <ol className="relative flex flex-col px-[16px] pt-[8px] pb-[14px]">
              <span aria-hidden className="absolute left-[26px] top-[24px] bottom-[34px] w-[2px] rounded-full bg-border" />
              <span aria-hidden className="absolute left-[26px] top-[24px] w-[2px] rounded-full bg-primary transition-[height] duration-500" style={{ height: `calc((100% - 58px) * ${doneCount / total})` }} />
              {ob.guides.map((g, i) => {
                const done = ob.done.has(g.id);
                const isNext = next?.id === g.id;
                return (
                  <li key={g.id} className="relative">
                    <button type="button" data-onboarding-guide={g.id} onClick={() => ob.startGuide(g.id)} className={cn("group flex w-full items-center gap-[12px] rounded-[10px] py-[7px] pl-0 pr-[4px] text-left", isNext ? "" : "hover:bg-transparent")}>
                      <span className={cn("relative z-10 flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-[3px] ring-card transition-colors", done ? "bg-primary text-primary-foreground" : isNext ? "bg-primary text-primary-foreground" : "border-2 border-border bg-card text-muted-foreground group-hover:border-primary/40")}>
                        {done ? <Icon icon={Tick02Icon} size={13} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={cn("min-w-0 flex-1 truncate text-[13.5px] transition-colors", done ? "font-medium text-muted-foreground" : isNext ? "font-semibold text-foreground" : "font-medium text-foreground/80 group-hover:text-foreground")}>{g.title}</span>
                      {isNext && <span className="flex h-[26px] shrink-0 items-center rounded-full bg-primary px-[11px] text-[12px] font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">Start</span>}
                    </button>
                  </li>
                );
              })}
              <li className="relative mt-[2px] flex items-center gap-[12px] pt-[4px]">
                <span className="relative z-10 flex size-[22px] shrink-0 items-center justify-center rounded-full ring-[3px] ring-card">
                  <img src={GIFT} alt="" aria-hidden className="size-[30px] max-w-none select-none rounded-full object-cover" />
                </span>
                <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-foreground">Free month <span className="font-medium text-muted-foreground">when all six are done</span></span>
              </li>
            </ol>
          </motion.div>
        ) : (
          <motion.button key="closed" type="button" data-onboarding-pill="" onClick={() => ob.setExpanded(true)} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }} className="relative flex h-[62px] w-full items-center gap-[12px] overflow-hidden px-[16px] text-left">
            <img src={PHOTO} alt="" aria-hidden className="absolute inset-0 h-full w-full select-none object-cover" />
            <span className="relative min-w-0 flex-1">
              <span className="flex items-center gap-[8px]">
                <span className="text-[11px] font-bold uppercase leading-[14px] tracking-[0.08em] text-white/70">Get started</span>
                <span className="rounded-full bg-white/[0.14] px-[7px] py-[1px] text-[10.5px] font-bold leading-[14px] text-white ring-1 ring-inset ring-white/20">{doneCount}/{total}</span>
              </span>
              <span className="mt-[3px] block truncate text-[13px] font-semibold leading-[18px] text-white">Next: {next?.title}</span>
            </span>
            <Icon icon={ArrowDown01Icon} size={16} className="relative shrink-0 text-white/70" />
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
      <div className="flex flex-col gap-[12px] px-[18px] pt-[16px] pb-[16px]">
        <div className="flex items-start gap-[12px]">
          <img src={GIFT} alt="" aria-hidden className="size-[44px] shrink-0 select-none rounded-[12px] object-cover" />
          <div className="min-w-0">
            <p className="text-foreground" style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px" }}>{REWARD.title}</p>
            <p className="mt-[3px] text-[13px] leading-[19px] text-foreground/80">{REWARD.body}</p>
          </div>
        </div>
        <button type="button" onClick={copy} data-onboarding-code="" className="flex items-center justify-between gap-2 rounded-[10px] border border-dashed border-primary/40 bg-primary/[0.05] px-[12px] py-[9px] text-left transition-colors hover:bg-primary/[0.09]">
          <span className="font-mono text-[14px] font-semibold tracking-wide text-primary">{REWARD.code}</span>
          <span className="flex items-center gap-1 text-[12px] font-medium text-primary"><Icon icon={Copy01Icon} size={13} />Copy</span>
        </button>
        <Button data-onboarding-redeem="" onClick={() => { onClose(); navigate(`/checkout?code=${REWARD.code}`); }} className="h-10 w-full text-[13px] font-semibold">Claim my free month</Button>
        <button type="button" onClick={onClose} className="self-center text-[12px] font-medium text-muted-foreground hover:text-foreground">Later</button>
      </div>
    </motion.div>
  );
}
