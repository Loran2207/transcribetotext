import type React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight01Icon, ArrowUp01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { cn } from "../ui/utils";
import { useOnboarding } from "./onboarding-context";
import { SETUP_GROUPS, SETUP_REQUIRED, isSetupDone, type SetupItem } from "./guides";
import { ONBOARDING_VARIANT } from "./variant";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { useTranscriptionModals } from "../transcription-modals";

/* "First steps": a fixed card at the top of the Home right panel (web) and a
   slide of the Home info carousel on the phone and tablet.

   The split (Artem + Kirill, 29.09): this card is the real actions a new
   account tries once, each done by doing it; the lessons that explain the
   product live on the Academy page. The gift rewards the first steps.
   Review 58: renamed from "Set up your account" (half of it is trying the
   product, not configuring it); the first step is the four ways in, one chip
   each; the photo is optional; every required step works on the Free plan.

   Built in the in-app banner language: navy laid over a dark photograph from
   the left, sentence-case type on it, the site's notch as a bite on each side.
   One grid for the whole card: 18px from the left, 14px from the right. */

const PHOTO = "/images/onboarding-start.jpg";
const GIFT = "/images/onboarding-gift.png";
const NAVY = "#0A1630";
const WASH = "linear-gradient(90deg, #0A1630 0%, #0A1630 40%, rgba(10,22,48,0.6) 70%, rgba(10,22,48,0.2) 100%)";

const card = "shrink-0 rounded-[14px] overflow-hidden bg-card border border-border shadow-sm";
const ROW = 38;
const focus = "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0";

function SideNotches() {
  const cls = "pointer-events-none absolute top-1/2 z-[3] block h-[52px] w-[9px] -translate-y-1/2";
  return (
    <>
      <svg aria-hidden className={cn(cls, "left-[-1px]")} viewBox="0 0 30 248" preserveAspectRatio="none"><path d="M0 44 C0 74 30 74 30 104 V144 C30 174 0 174 0 204 Z" fill="var(--background)" /></svg>
      <svg aria-hidden className={cn(cls, "right-[-1px]")} viewBox="0 0 30 248" preserveAspectRatio="none"><path d="M30 44 C30 74 0 74 0 104 V144 C0 174 30 174 30 204 Z" fill="var(--background)" /></svg>
    </>
  );
}

const iconButton = "flex size-[26px] shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white";

/* what "Do it" does for each setup item: the upload opens right here, the
   calendar page has the connect screen on a fresh account, the rest start the
   lesson that walks to the exact control and the real action ticks the item */
function useRunSetup() {
  const ob = useOnboarding();
  const { setOpenModal } = useTranscriptionModals();
  return (id: string) => {
    const item = ob.setup.find((x) => x.id === id); if (!item) return;
    if (item.run === "modal" && item.modal) { setOpenModal(item.modal); return; }
    /* review 59: Connect used to land on a calendar that looked connected already;
       now the Meetings lesson walks to the connect screen of a new account */
    if (item.run === "calendar") { ob.startGuide("meetings"); return; }
    if (item.run === "profile") { ob.navigate({ page: "settings" }); return; }
    ob.startGuide(item.how);
  };
}

export function OnboardingCard({ inAcademy = false }: { inAcademy?: boolean } = {}) {
  const ob = useOnboarding();
  const reduce = useReducedMotion();
  if (ob.hidden || ONBOARDING_VARIANT === "b") return null;
  const has = (id: string) => ob.actions.has(id);
  const doneCount = SETUP_REQUIRED.filter((x) => isSetupDone(x, has)).length;
  const total = SETUP_REQUIRED.length;
  const open = ob.expanded;

  /* all first steps done: the dialog handed the gift over and the code lives in Plan Management */
  if (ob.allDone) return null;

  const fade = { initial: reduce ? false : { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, exit: reduce ? undefined : { opacity: 0, y: -4 }, transition: { duration: 0.16 } } as const;

  return (
    <div data-onboarding-card="" data-state={open ? "open" : "closed"} className={card}>
      <div className="relative -mx-px -mt-px h-[67px] overflow-hidden rounded-t-[14px]" style={{ background: NAVY }}>
        <img src={PHOTO} alt="" aria-hidden className="absolute inset-y-0 right-0 h-full w-[72%] select-none object-cover" style={{ objectPosition: "72% 55%" }} />
        <span aria-hidden className="absolute inset-0" style={{ background: WASH }} />
        <button type="button" data-onboarding-pill={open ? undefined : ""} aria-label={open ? undefined : "Expand"} onClick={() => { if (!open) ob.setExpanded(true); }} className={cn("absolute inset-0 text-left", open && "cursor-default")}>
          <AnimatePresence initial={false} mode="wait">
            {open ? (
              <motion.span key="open" {...fade} className="absolute left-[19px] top-[15px] right-[52px]">
                <span className="block truncate text-[15px] font-bold leading-[20px] tracking-[-0.2px] text-white">First steps</span>
                <span className="block truncate text-[12px] font-medium leading-[16px] text-white/70">Try each once<span className="text-white/45"> · </span><span className="tabular-nums text-white/85">{doneCount} of {total} done</span></span>
              </motion.span>
            ) : (
              <motion.span key="closed" {...fade} className="absolute left-[19px] top-[15px] right-[52px]">
                <span className="block truncate text-[13px] font-semibold leading-[19.5px] text-white">First steps</span>
                <span className="mt-[1px] flex items-center gap-[5px] text-[11px] font-medium leading-[16.5px] text-white/80">
                  <img src={GIFT} alt="" aria-hidden className="size-[14px] shrink-0 select-none object-contain" />
                  <span className="truncate">{total - doneCount} to do, then 1 month free</span>
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
        <SideNotches />
      </div>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} transition={reduce ? { duration: 0 } : { height: { type: "spring", stiffness: 260, damping: 32 }, opacity: { duration: 0.18 } }} style={{ overflow: "hidden" }}>
        <SetupList compact={false} />
        {!inAcademy && <AcademyLink />}
      </motion.div>
    </div>
  );
}

/* the door to the lessons, under the list */
function AcademyLink() {
  const ob = useOnboarding();
  const watched = new Set([...ob.done, ...ob.seen]).size;
  return (
    <button type="button" data-onboarding-academy="" onClick={() => ob.navigate({ page: "academy" })} className={cn("group flex w-full items-center gap-[10px] border-t border-border px-[18px] py-[11px] text-left transition-colors hover:bg-muted/60", focus)}>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-[18px] text-foreground">Academy</span>
        <span className="block truncate text-[12px] leading-[16px] text-muted-foreground">Short lessons on every feature<span className="text-border"> · </span><span className="tabular-nums">{watched} watched</span></span>
      </span>
      <Icon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-[2px]" />
    </button>
  );
}

/* The first steps and the gift on one rail, in two groups: every way in, then
   the things that make the account yours. Shared by the web card and the
   compact-shell slide. The photo is marked optional and the gift does not wait
   for it. */
function SetupList({ compact }: { compact: boolean }) {
  const ob = useOnboarding();
  const run = useRunSetup();
  const has = (id: string) => ob.actions.has(id);
  const total = SETUP_REQUIRED.length;
  const next = SETUP_REQUIRED.find((x) => !isSetupDone(x, has));
  const ROW_H = compact ? 34 : ROW;
  let n = 0;
  return (
    <ol className="relative -mt-px flex flex-col bg-card px-[8px] pt-[4px] pb-[8px]">
      {SETUP_GROUPS.map((grp, gi) => (
        <li key={grp.id} className="flex flex-col">
          <p className={cn("px-[10px] pb-[2px] text-[11.5px] font-semibold text-muted-foreground", gi === 0 ? "pt-[6px]" : "pt-[10px]")}>{grp.title}</p>
          <ol className="flex flex-col">
            {ob.setup.filter((x) => x.group === grp.id).map((x, i, arr) => {
              n += 1;
              const done = isSetupDone(x, has);
              const isNext = next?.id === x.id;
              const last = i === arr.length - 1;
              return (
                <li key={x.id} className="relative">
                  {!last && <span aria-hidden className={cn("absolute left-[20px] top-[20px] z-[1] w-[2px] transition-colors duration-500", done ? "bg-primary" : "bg-border")} style={{ height: ROW_H }} />}
                  <div className="group flex w-full items-center gap-[12px] rounded-[10px] pl-[10px] pr-[6px] text-left transition-colors hover:bg-muted/70" style={{ height: ROW_H }}>
                    <span className={cn(
                      "relative z-[2] flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-colors",
                      done ? "bg-primary text-primary-foreground" : isNext ? "border-2 border-primary bg-card text-primary" : "border-2 border-border bg-card text-muted-foreground group-hover:border-foreground/25 group-hover:text-foreground",
                    )}>
                      {done ? <Icon icon={Tick02Icon} size={12} strokeWidth={3} /> : n}
                    </span>
                    <span className="flex min-w-0 flex-1 items-baseline gap-[6px]">
                      <span className={cn("truncate text-[13.5px] leading-[18px] transition-colors", done ? "font-medium text-muted-foreground" : isNext ? "font-semibold text-foreground" : "font-medium text-foreground/80 group-hover:text-foreground")}>{x.title}</span>
                      {x.optional && !done && <span className="shrink-0 text-[11.5px] font-medium text-muted-foreground">Optional</span>}
                    </span>
                    {!done && (
                      <button type="button" data-onboarding-setup={x.id} onClick={() => run(x.id)} className={cn("flex h-[26px] shrink-0 items-center rounded-full px-[12px] text-[12px] font-semibold transition-colors", isNext ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border bg-card text-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-muted", focus)}>{x.cta}</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </li>
      ))}
      <li className="relative mt-[6px]">
        <div data-onboarding-goal="" className="flex h-[54px] items-center gap-[12px] rounded-[12px] bg-primary/[0.06] pl-[7px] pr-[12px]">
          <span className="relative z-[2] flex size-[28px] shrink-0 items-center justify-center rounded-full bg-card ring-[3px] ring-card">
            <img src={GIFT} alt="" aria-hidden className="size-[26px] select-none object-contain" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold leading-[18px] text-foreground">Your gift: 1 month free</span>
            <span className="block truncate text-[12px] font-medium leading-[16px] text-muted-foreground">Unlocks when the {total} steps are done</span>
          </span>
        </div>
      </li>
    </ol>
  );
}

/* The compact shell (phone and tablet): the setup is one slide of the Home info
   carousel, the same 84px header row as Today's events and Analytics, the same
   shared expand state, the same bounded detail. */
export function OnboardingSlide({ expanded, onToggle, headCls, cardCls, detailCls }: { expanded: boolean; onToggle: () => void; headCls: string; cardCls: string; detailCls: string }) {
  const ob = useOnboarding();
  if (ob.hidden || ob.allDone || ONBOARDING_VARIANT === "b") return null;
  const has = (id: string) => ob.actions.has(id);
  const doneCount = SETUP_REQUIRED.filter((x) => isSetupDone(x, has)).length;
  const total = SETUP_REQUIRED.length;
  return (
    <div data-onboarding-card="" data-state={expanded ? "open" : "closed"} className={cardCls}>
      <button type="button" data-onboarding-collapse={expanded ? "" : undefined} data-onboarding-pill={expanded ? undefined : ""} onClick={onToggle} aria-expanded={expanded} className={headCls}>
        <span className="flex min-w-0 flex-col gap-[8px]">
          <span className="text-muted-foreground" style={{ fontWeight: 600, fontSize: "12px", lineHeight: "16px" }}>First steps</span>
          <span className="flex items-baseline gap-[8px] text-foreground">
            <span className="tabular-nums" style={{ fontWeight: 700, fontSize: "26px", letterSpacing: "-0.6px", lineHeight: 1 }}>{doneCount}</span>
            <span className="text-muted-foreground" style={{ fontWeight: 500, fontSize: "12px", lineHeight: "16px" }}>of {total} done</span>
            <span className="text-muted-foreground/40" style={{ fontWeight: 400, fontSize: "16px", lineHeight: 1 }}>{"·"}</span>
            <span className="flex min-w-0 items-center gap-[5px] truncate text-muted-foreground" style={{ fontWeight: 500, fontSize: "13px", lineHeight: "18px" }}>
              <img src={GIFT} alt="" aria-hidden className="size-[14px] shrink-0 select-none object-contain" />
              <span className="truncate">1 month free at the end</span>
            </span>
          </span>
        </span>
        <Icon icon={ArrowUp01Icon} size={18} strokeWidth={2} className="shrink-0 text-muted-foreground transition-transform duration-200" style={{ transform: expanded ? "rotate(0deg)" : "rotate(180deg)" }} />
      </button>
      {expanded && (
        <div className={cn(detailCls, "!max-h-[420px] px-[6px] py-[6px]")}>
          <SetupList compact />
          <AcademyLink />
        </div>
      )}
    </div>
  );
}

/* Variant b (branch academy-b, review 59-60): First steps lives in the sidebar,
   right above the Academy, as one row with a progress ring that opens the
   First steps page. It can be switched off from that page (Customize). */
function Ring({ done, total }: { done: number; total: number }) {
  const r = 8, c = 2 * Math.PI * r;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0 -rotate-90" aria-hidden>
      <circle cx="10" cy="10" r={r} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-border" />
      <circle cx="10" cy="10" r={r} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - done / Math.max(1, total))} className="text-primary transition-[stroke-dashoffset] duration-500" />
    </svg>
  );
}

export function FirstStepsLauncher({ active, onOpen }: { active: boolean; onOpen: () => void }) {
  const ob = useOnboarding();
  if (ONBOARDING_VARIANT !== "b" || ob.hidden || ob.allDone || !ob.showNav) return null;
  const has = (id: string) => ob.actions.has(id);
  const done = SETUP_REQUIRED.filter((x) => isSetupDone(x, has)).length;
  const total = SETUP_REQUIRED.length;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton data-tour="nav-first-steps" data-onboarding-launcher="" isActive={active} onClick={onOpen} tooltip="First steps">
        <Ring done={done} total={total} />
        <span className="flex min-w-0 flex-1 items-center gap-[6px]">
          <span className="truncate">First steps</span>
          <img src={GIFT} alt="" aria-hidden className="size-[14px] shrink-0 select-none object-contain group-data-[collapsible=icon]:hidden" />
        </span>
        <span className="ml-auto text-[12px] font-medium tabular-nums text-muted-foreground group-data-[collapsible=icon]:hidden">{done} of {total}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
