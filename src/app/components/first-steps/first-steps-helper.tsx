import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, MoreHorizontalIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { useIsPhone } from "../ui/use-mobile";
import { cn } from "../ui/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useOnboarding } from "../onboarding/onboarding-context";
import { useTranscriptionModals } from "../transcription-modals";
import { useShell } from "../desktop/shell";
import { SETUP_REQUIRED, isSetupDone, stepTourId } from "../onboarding/guides";
import { ProgressRing, useRunStep } from "./first-steps-page";

/* The First steps helper (variant b, review 60): on every page, at the bottom
   centre, like Vektor's helper bar but round and in our banner language. Open,
   it is one dark capsule: the ring with the count, the step you are on, the one
   action that does it, and arrows through the list. Folded, it is just the
   ring. "Hide from every page" turns it off; it comes back from First steps,
   Customize. It steps aside while a tour runs and on the First steps page. */

const FOLD_KEY = "ttt_helper_folded";

export function FirstStepsHelper({ onFirstStepsPage, busyBottom }: { onFirstStepsPage: boolean; busyBottom: boolean }) {
  const ob = useOnboarding();
  const reduce = useReducedMotion();
  const run = useRunStep();
  const { openModal, recordingPhase } = useTranscriptionModals();
  const { shell } = useShell();
  const phone = useIsPhone();
  const bottomOffset = phone ? 22 : 20;
  const has = (id: string) => ob.actions.has(id);
  const open = useMemo(() => ob.setup.filter((x) => !isSetupDone(x, has)), [ob.actions]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pos, setPos] = useState(0);
  const [folded, setFolded] = useState(() => { try { return localStorage.getItem(FOLD_KEY) === "1"; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem(FOLD_KEY, folded ? "1" : "0"); } catch { /* private mode */ } }, [folded]);
  useEffect(() => { if (pos >= open.length) setPos(0); }, [open.length, pos]);

  /* it steps aside whenever the bottom of the screen is taken: a recording, a
     modal, the player of a recording page, the desktop app's own bar */
  if (!ob.showHelper || ob.hidden || ob.allDone || onFirstStepsPage || busyBottom || ob.tour || !open.length) return null;
  if (openModal || recordingPhase !== "idle" || shell === "desktop") return null;
  const total = SETUP_REQUIRED.length;
  const done = SETUP_REQUIRED.filter((x) => isSetupDone(x, has)).length;
  const step = open[Math.min(pos, open.length - 1)];

  const hide = () => {
    ob.setShowHelper(false);
    toast("First steps helper hidden", { description: "Turn it back on in First steps, Customize.", action: { label: "Undo", onClick: () => ob.setShowHelper(true) } });
  };

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 32 };

  return (
    <div data-first-steps-helper={folded ? "folded" : "open"} className={cn("pointer-events-none fixed inset-x-0 z-40 flex px-3", phone ? "justify-start" : "justify-center")} style={{ bottom: bottomOffset }}>
      <motion.div layout transition={spring} className="pointer-events-auto flex max-w-[calc(100vw-96px)] items-center rounded-full lg:max-w-none bg-[#0A1630]/95 text-white shadow-[0_12px_32px_rgba(10,22,48,0.35),0_2px_6px_rgba(10,22,48,0.2)] ring-1 ring-white/10 backdrop-blur-md">
        <button type="button" aria-label={folded ? "Open First steps helper" : "Fold"} onClick={() => setFolded(!folded)} className="relative m-[5px] flex size-[42px] shrink-0 items-center justify-center rounded-full">
          <ProgressRing done={done} total={total} size={42} stroke={4} light />
          <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold tabular-nums">{done}/{total}</span>
        </button>
        <AnimatePresence initial={false}>
          {!folded && (
            <motion.div key="body" initial={reduce ? false : { opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={reduce ? undefined : { opacity: 0, width: 0 }} transition={spring} className="flex items-center overflow-hidden">
              <button type="button" data-first-steps-open="" onClick={() => ob.navigate({ page: "first-steps" as never })} className="min-w-0 max-w-[min(300px,42vw)] pr-[10px] text-left max-[480px]:max-w-[120px]">
                <span className="block truncate text-[11px] font-semibold leading-[14px] text-white/55">First steps</span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={step.id} initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.16 }} className="block truncate text-[13.5px] font-semibold leading-[18px]">{step.title}</motion.span>
                </AnimatePresence>
              </button>
              <button type="button" data-first-steps-helper-do="" onClick={() => ob.startGuide(stepTourId(step.id))} className="mr-[4px] flex h-[32px] shrink-0 items-center gap-[5px] rounded-full bg-white pl-[11px] pr-[14px] text-[12.5px] font-semibold text-[#0A1630] transition-colors hover:bg-[#EEF2F7]"><Icon icon={PlayIcon} size={10} strokeWidth={2.8} />Guide me</button>
              <span className="flex shrink-0 items-center max-[480px]:hidden">
                <button type="button" aria-label="Previous step" disabled={open.length < 2} onClick={() => setPos((p) => (p - 1 + open.length) % open.length)} className="flex size-[32px] items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"><Icon icon={ArrowLeft01Icon} size={16} /></button>
                <button type="button" aria-label="Next step" disabled={open.length < 2} onClick={() => setPos((p) => (p + 1) % open.length)} className="flex size-[32px] items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"><Icon icon={ArrowRight01Icon} size={16} /></button>
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="More" data-first-steps-helper-menu="" className="mr-[6px] flex size-[32px] shrink-0 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white"><Icon icon={MoreHorizontalIcon} size={18} /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" sideOffset={10} className="w-[220px]">
                  <DropdownMenuItem onClick={() => ob.navigate({ page: "first-steps" as never })}>Open First steps</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFolded(true)}><Icon icon={ArrowDown01Icon} size={14} className="mr-2" />Fold to a circle</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-first-steps-helper-hide="" onClick={hide} className={cn("text-foreground")}>Hide from every page</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
