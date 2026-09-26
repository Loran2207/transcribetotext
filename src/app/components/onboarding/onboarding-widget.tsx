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

   Built in the marketing site's language (Kirill, reviews 28-29, 26.09):
   a photograph generated dark in the site's blue-night grade, sentence-case
   type on it, small and heavy. The site's transition notch is a TAB on the
   border between the photograph and the list, and the tab carries the one
   thing worth promising: the free month. Below, the six lessons run on one
   rail; a whole row lights on hover. */

const PHOTO = "/images/onboarding-start.jpg";
const GIFT = "/images/onboarding-gift.png";

const card = "shrink-0 rounded-[14px] overflow-hidden bg-card border border-border shadow-sm";
const ROW = 38; /* one lesson row, px: 22px stop + 8px padding above and below */

/* the site's notch, widened so its flat top holds the gift tab */
function Tab() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
      <div className="relative h-[28px] w-[296px]">
        <svg aria-hidden className="absolute inset-0 block h-full w-full" viewBox="0 0 248 30" preserveAspectRatio="none">
          <path d="M0 30 C30 30 30 0 60 0 H188 C218 0 218 30 248 30 Z" fill="var(--card)" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex h-[26px] items-center justify-center gap-[6px]">
          <img src={GIFT} alt="" aria-hidden className="size-[20px] select-none rounded-full object-cover" />
          <span className="text-[12px] font-semibold leading-[16px] text-foreground">Free month at the end</span>
        </div>
      </div>
    </div>
  );
}

const glassButton = "flex size-[28px] shrink-0 items-center justify-center rounded-full bg-white/[0.14] text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/[0.24]";

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
            <div className="relative h-[124px] overflow-hidden">
              <img src={PHOTO} alt="" aria-hidden className="absolute inset-0 h-full w-full select-none object-cover" />
              <div className="absolute left-[16px] top-[14px] right-[92px]">
                <p className="text-[16px] font-semibold leading-[20px] tracking-[-0.2px] text-white">Get started</p>
                <p className="mt-[3px] text-[12.5px] font-medium leading-[17px] text-white/75">Six lessons, about a minute each</p>
              </div>
              <div className="absolute right-[12px] top-[12px] flex items-center gap-[6px]">
                <span className="flex h-[28px] items-center rounded-full bg-white/[0.14] px-[10px] text-[12px] font-semibold text-white ring-1 ring-inset ring-white/25">{doneCount} of {total}</span>
                <button type="button" onClick={() => ob.setExpanded(false)} data-onboarding-collapse="" aria-label="Collapse" className={glassButton}>
                  <Icon icon={ArrowUp01Icon} size={15} />
                </button>
              </div>
              <Tab />
            </div>
            {/* the pipeline: one rail, six stops; a whole row lights on hover */}
            <ol className="relative flex flex-col px-[8px] pt-[10px] pb-[10px]">
              <span aria-hidden className="absolute left-[29px] top-[29px] z-[1] w-[2px] rounded-full bg-border" style={{ height: ROW * (total - 1) }} />
              <span aria-hidden className="absolute left-[29px] top-[29px] z-[1] w-[2px] rounded-full bg-primary transition-[height] duration-500" style={{ height: ROW * Math.min(doneCount, total - 1) }} />
              {ob.guides.map((g, i) => {
                const done = ob.done.has(g.id);
                const isNext = next?.id === g.id;
                return (
                  <li key={g.id} className="relative">
                    <button type="button" data-onboarding-guide={g.id} onClick={() => ob.startGuide(g.id)} className="group flex h-[38px] w-full items-center gap-[12px] rounded-[10px] pl-[10px] pr-[6px] text-left transition-colors hover:bg-muted/70 active:bg-muted">
                      <span className={cn("relative z-[2] flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-[3px] ring-card transition-colors group-hover:ring-muted", done || isNext ? "bg-primary text-primary-foreground" : "border-2 border-border bg-card text-muted-foreground group-hover:border-primary/50 group-hover:text-foreground")}>
                        {done ? <Icon icon={Tick02Icon} size={13} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={cn("min-w-0 flex-1 truncate text-[13.5px] transition-colors", done ? "font-medium text-muted-foreground" : isNext ? "font-semibold text-foreground" : "font-medium text-foreground/80 group-hover:text-foreground")}>{g.title}</span>
                      {isNext ? (
                        <span className="flex h-[26px] shrink-0 items-center rounded-full bg-primary px-[11px] text-[12px] font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">Start</span>
                      ) : (
                        <span className={cn("shrink-0 text-[12px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100", done && "hidden")}>Open</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        ) : (
          <motion.button key="closed" type="button" data-onboarding-pill="" onClick={() => ob.setExpanded(true)} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }} className="group relative flex h-[64px] w-full items-center gap-[12px] overflow-hidden px-[16px] pr-[12px] text-left">
            <img src={PHOTO} alt="" aria-hidden className="absolute inset-0 h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            <span className="relative min-w-0 flex-1">
              <span className="flex items-center gap-[8px]">
                <span className="text-[13.5px] font-semibold leading-[18px] text-white">Get started</span>
                <span className="rounded-full bg-white/[0.14] px-[7px] py-[1px] text-[11px] font-semibold leading-[15px] text-white ring-1 ring-inset ring-white/25">{doneCount} of {total}</span>
              </span>
              <span className="mt-[2px] block truncate text-[12.5px] font-medium leading-[17px] text-white/75">Next: {next?.title}</span>
            </span>
            <span className={cn(glassButton, "relative group-hover:bg-white/[0.24]")}><Icon icon={ArrowDown01Icon} size={15} /></span>
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
