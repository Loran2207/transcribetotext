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
   at the top of the Home column on the phone and tablet.

   Review 27 (Kirill, 26.09): the card gets a face. Its top is the same navy
   as the desktop-app banner, with a house-glass illustration, so it reads
   as one family with the rest of the panel; the lessons sit below on white.
   Folded, the same navy row keeps the picture, the count and the next
   lesson. No "Pro" in the promise: a free month, said once. */

const NAVY = "#0A1630"; /* the desktop-app banner's colour, see desktop/desktop-app-banner.tsx */
const ART = "/images/onboarding-start.png";

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
            <div className="relative overflow-hidden px-[18px] pt-[16px] pb-[18px]" style={{ background: NAVY }}>
              <img src={ART} alt="" aria-hidden className="pointer-events-none absolute -right-[14px] -top-[6px] h-[124px] w-[124px] select-none object-contain" />
              <div className="relative max-w-[62%]">
                <p className="text-white" style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px", lineHeight: "22px" }}>Get started</p>
                <p className="mt-[6px] text-[13px] leading-[18px] text-white/70">Six short lessons. Finish them and your first month is on us.</p>
              </div>
              <button type="button" onClick={() => ob.setExpanded(false)} data-onboarding-collapse="" aria-label="Collapse" className="absolute right-[10px] bottom-[10px] flex size-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                <Icon icon={ArrowUp01Icon} size={14} />
              </button>
            </div>
            <ul className="flex flex-col gap-[2px] px-[8px] pt-[10px] pb-[8px]">
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
            <div className="flex items-center gap-[8px] border-t border-border px-[18px] py-[10px]">
              <Icon icon={GiftIcon} size={15} className="shrink-0 text-destructive" />
              <span className="text-[12.5px] text-muted-foreground"><span className="font-medium text-foreground">{doneCount} of {total}</span> done</span>
              <span className="ml-auto text-[12px] font-medium text-destructive">Free month at the end</span>
            </div>
          </motion.div>
        ) : (
          <motion.button key="closed" type="button" data-onboarding-pill="" onClick={() => ob.setExpanded(true)} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18 }} className="relative flex w-full items-center gap-[12px] overflow-hidden px-[14px] py-[10px] text-left" style={{ background: NAVY }}>
            <img src={ART} alt="" aria-hidden className="pointer-events-none size-[44px] shrink-0 select-none object-contain" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold text-white">Get started <span className="font-medium text-white/50">{doneCount} of {total}</span></span>
              <span className="block truncate text-[12px] leading-[16px] text-white/70">Next: {next?.title}</span>
            </span>
            <Icon icon={ArrowDown01Icon} size={16} className="shrink-0 text-white/60" />
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
