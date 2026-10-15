import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft01Icon, Cancel01Icon, ReplayIcon, VolumeHighIcon, VolumeOffIcon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { useIsMobile, useIsPhone } from "../ui/use-mobile";
import { calendarConnected } from "../calendar-accounts";
import { cn } from "../ui/utils";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useTranscriptionModals } from "../transcription-modals";
import { useOnboarding } from "./onboarding-context";
import { GUIDE_PERSON, NO_ANCHOR } from "./guides";
import { Orb } from "./orb/orb";
import { speak, stopSpeaking, voiceOn, setVoiceOn } from "@/lib/voice";

/* The guided tour: the page dims, the one element the step is about stays
   lit, and a small card beside it says what it is in two lines.

   How the light works: one div sits exactly over the anchor with a huge
   box-shadow, so everything else goes dark and the hole keeps its rounded
   corners. A transparent layer under it swallows clicks while the tour is
   on; the tour advances with its own buttons, the keyboard, or a click on
   the dark. On the phone the card is a fixed sheet at the bottom. */

const PAD = 8;
const RADIUS = 14;
const CARD_W = 300;
/* Mia's figure in the corner, web only */
const MIA_W = 240;
const MIA_H = 360;
const GAP = 14;
/* the narrowest the card gets when it must squeeze beside a control: a 500px
   dialog centred in a 1024px window leaves about 230px beside it after the gaps,
   the 526px meeting dialog about 210px */
const MIN_CARD_W = 200;

/* round: the control is a circle (the plus button), so the light is one too */
type Rect = { top: number; left: number; width: number; height: number; round?: boolean };
type Side = "top" | "bottom" | "left" | "right";
const SIDES: Side[] = ["bottom", "top", "right", "left"];
/* the dark around the light; the same shape in both so motion can ease between them */
const DIM = "0 0 0 9999px rgba(15, 23, 42, 0.55)";
const DIM_HANDOFF = "0 0 0 9999px rgba(15, 23, 42, 0.4)";
const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

/* "a|b": the first visible anchor wins, so a phone layout without the web
   control can light its own stand-in (the menu button, the "+" button).
   "a+b": one light around both, when the first is visible (the edit bar
   together with the text being edited); a missing second part is skipped. */
function visibleAnchor(name: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return all.find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; }) ?? null;
}
function findAnchor(names: string): HTMLElement[] | null {
  for (const alt of names.split("|")) {
    const parts = alt.split("+");
    const first = visibleAnchor(parts[0]);
    if (!first) continue;
    const rest = parts.slice(1).map(visibleAnchor).filter((el): el is HTMLElement => !!el);
    return [first, ...rest];
  }
  return null;
}

function measure(els: HTMLElement[]): Rect {
  let top = Infinity, left = Infinity, right = -Infinity, bottom = -Infinity;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    top = Math.min(top, r.top); left = Math.min(left, r.left); right = Math.max(right, r.right); bottom = Math.max(bottom, r.bottom);
  }
  const one = els.length === 1 ? els[0] : null;
  const round = !!one && (() => { const r = one.getBoundingClientRect(); return parseFloat(getComputedStyle(one).borderTopLeftRadius) >= Math.min(r.width, r.height) / 2 - 1; })();
  /* a window (dialog or sheet) is lit to its own edge: a pad would show the page behind it as a grey ring */
  const pad = one && one.matches("[role=dialog], .ttt-modal, [data-slot=dialog-content], [data-slot=drawer-content]") ? 0 : PAD;
  return { top: top - pad, left: left - pad, width: right - left + pad * 2, height: bottom - top + pad * 2, round };
}

/* A short burst from the bottom of the screen; the whole-guide one is wider and longer. */
function celebrate(big: boolean) {
  const base = { origin: { y: 0.85 }, colors: ["#2563eb", "#60a5fa", "#f59e0b", "#10b981", "#ec4899"], disableForReducedMotion: true, zIndex: 300 };
  confetti({ ...base, particleCount: big ? 160 : 70, spread: big ? 100 : 70, startVelocity: big ? 48 : 38 });
  if (big) window.setTimeout(() => confetti({ ...base, particleCount: 90, spread: 120, startVelocity: 40, origin: { x: 0.2, y: 0.9 } }), 220);
  if (big) window.setTimeout(() => confetti({ ...base, particleCount: 90, spread: 120, startVelocity: 40, origin: { x: 0.8, y: 0.9 } }), 380);
}

export function OnboardingTour() {
  const { tour, nextStep, prevStep, endTour, celebration, dismissCelebration, guides, done, startGuide } = useOnboarding();
  const { setOpenModal } = useTranscriptionModals();
  const phone = useIsPhone();
  const compact = useIsMobile();
  const reduce = useReducedMotion();

  /* the moment a lesson ends: confetti and a word; the last first step opens the reward dialog instead of a toast */
  useEffect(() => {
    if (!celebration) return;
    if (celebration === "all") { celebrate(true); return; }
    if (celebration.kind === "academy") {
      celebrate(true);
      toast.success("You finished the Academy", { description: "That was every lesson. The app is yours now.", duration: 6000 });
      dismissCelebration();
      return;
    }
    celebrate(false);
    /* the toast carries the way on: the next lesson that is not done yet */
    const next = guides.find((g) => g.id !== celebration.guide.id && !done.has(g.id));
    const left = guides.filter((g) => g.id !== celebration.guide.id && !done.has(g.id)).length;
    toast.success(`Lesson ${celebration.index + 1} done`, {
      description: left > 0 ? `${left} ${left === 1 ? "lesson" : "lessons"} left in the Academy.` : undefined,
      action: next ? { label: "Next lesson", onClick: () => startGuide(next.id) } : undefined,
      duration: 6000,
    });
    dismissCelebration();
  }, [celebration, dismissCelebration, guides, done, startGuide]);
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [missing, setMissing] = useState(false);

  const step = tour ? tour.guide.steps[tour.step] : null;

  /* a step may open a real dialog of the page; when the lesson ends, everything it opened closes */
  const triggerUsed = useRef(false);
  const handedOver = useRef(false);
  useEffect(() => {
    const t = step?.trigger;
    if (step) handedOver.current = !!step.handoff;
    if (t) { triggerUsed.current = true; window.dispatchEvent(new CustomEvent("ttt-tour", { detail: t })); return; }
    /* a First steps tour ends on the real thing, open: it stays for the person */
    if (!step && handedOver.current) { triggerUsed.current = false; handedOver.current = false; return; }
    if (triggerUsed.current) { triggerUsed.current = false; window.dispatchEvent(new CustomEvent("ttt-tour", { detail: "close-all" })); }
  }, [step]);

  /* a step may drive Quick Find; when the lesson that used it ends, the modal closes */
  const quickFindUsed = useRef(false);
  useEffect(() => {
    const qf = step?.quickFind;
    if (qf) { quickFindUsed.current = true; window.dispatchEvent(new CustomEvent("ttt-quick-find", { detail: qf })); return; }
    if (quickFindUsed.current) { quickFindUsed.current = false; window.dispatchEvent(new CustomEvent("ttt-quick-find", { detail: { open: false, query: "" } })); }
  }, [step]);
  const anchorName = step?.anchor && step.anchor !== NO_ANCHOR ? step.anchor : null;
  const speaking = step?.anchor === NO_ANCHOR;
  const handoff = !!step?.handoff;
  /* a step that waits for the person (connect a calendar): live page, no Next, moves on by itself */
  const [waitDone, setWaitDone] = useState(false);
  const waiting = step?.waitFor === "calendar" && !waitDone && !calendarConnected();
  const live = handoff || waiting;
  /* a step about the calendar says other words when one is already connected */
  const spoken = step ? (step.connected && calendarConnected() ? { title: step.connected.title ?? step.title, body: step.connected.body ?? step.body, phoneBody: step.connected.phoneBody ?? step.connected.body ?? step.phoneBody } : { title: step.title, body: step.body, phoneBody: step.phoneBody }) : { title: "", body: "", phoneBody: undefined };

  /* wait for the anchor: the step may have just navigated to another page */
  useLayoutEffect(() => {
    if (!anchorName) { setRect(null); return; }
    setMissing(false);
    let frame = 0; let tries = 0; let cancelled = false;
    const look = () => {
      if (cancelled) return;
      const el = findAnchor(anchorName);
      if (el) {
        el[0].scrollIntoView({ block: "center", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
        /* measure after the scroll settles; the page may have re-rendered the
           anchor meanwhile, so look it up again and retry on an empty box */
        let settles = 0;
        const settle = () => {
          if (cancelled) return;
          const cur = findAnchor(anchorName) ?? el;
          const box = measure(cur);
          if (box.width <= PAD * 2 && settles++ < 10) { window.setTimeout(settle, 120); return; }
          setRect(box);
          if (settles++ < 2) window.setTimeout(settle, 400);
        };
        window.setTimeout(settle, reduce ? 0 : 320);
        return;
      }
      if (tries++ < 90) frame = requestAnimationFrame(look); else { setMissing(true); setRect(null); }
    };
    look();
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [anchorName, tour?.step, reduce]);

  /* follow the anchor on resize and scroll */
  useEffect(() => {
    if (!anchorName) return;
    const update = () => { const el = findAnchor(anchorName); if (el) setRect(measure(el)); };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [anchorName]);

  /* While the page is handed over, the control the person uses may change
     under the card (Start becomes the recording pill's Stop, Edit becomes the
     edit bar): follow it. If it is gone for good, the person closed what the
     step opened, so the card goes too. A trigger fired before the page under
     it had mounted is fired again. */
  useEffect(() => {
    if (!handoff || !anchorName) return;
    let seen = false; let gone = 0; let retries = 0;
    const id = window.setInterval(() => {
      const el = findAnchor(anchorName);
      if (el) {
        seen = true; gone = 0;
        const box = measure(el);
        setRect((r) => (r && Math.abs(r.top - box.top) < 1 && Math.abs(r.left - box.left) < 1 && Math.abs(r.width - box.width) < 1 && Math.abs(r.height - box.height) < 1 ? r : box));
        setMissing(false);
        return;
      }
      if (!seen) { if (step?.trigger && retries++ < 3) window.dispatchEvent(new CustomEvent("ttt-tour", { detail: step.trigger })); return; }
      if (++gone >= 5) endTour();
    }, 300);
    return () => window.clearInterval(id);
  }, [handoff, anchorName, step, endTour]);

  useEffect(() => {
    if (!tour) return;
    const key = (e: KeyboardEvent) => {
      /* handed over: the person types in the real form, so only Escape is ours, and it
         closes this card alone; the dialog under it waits for its own Escape */
      if (handoff) { if (e.key === "Escape") { e.stopPropagation(); endTour(); } return; }
      if (e.key === "Escape") endTour();
      if (e.key === "ArrowRight" || e.key === "Enter") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    };
    /* handed over, the card listens first (capture), so the dialog under it does not also close */
    window.addEventListener("keydown", key, handoff);
    return () => window.removeEventListener("keydown", key, handoff);
  }, [tour, handoff, nextStep, prevStep, endTour]);

  /* what the card says is what the voice says: the same title and body, the
     same phone or connected variant. A missing line (a hand-off with no file) is silent. */
  const spokenTitle = (phone && step?.phoneTitle) || spoken?.title;
  const spokenBody = missing ? undefined : (phone && spoken?.phoneBody) || (compact && step?.compactBody) || spoken?.body;
  const [sound, setSound] = useState(() => voiceOn());
  const shown = rect !== null || missing || speaking;
  const spokenKey = tour ? `${tour.guide.id}:${tour.step}:${spokenTitle ?? ""}:${spokenBody ?? ""}` : "";
  const saidRef = useRef("");
  useEffect(() => {
    if (!shown || !spokenBody || !spokenKey) return;
    if (saidRef.current === spokenKey) return;
    saidRef.current = spokenKey;
    void speak(spokenTitle, spokenBody);
  }, [shown, spokenKey, spokenTitle, spokenBody]);
  useEffect(() => () => { saidRef.current = ""; stopSpeaking(); }, [tour?.guide.id]);
  const sayAgain = () => { if (!spokenBody) return; if (!sound) { setVoiceOn(true); setSound(true); } void speak(spokenTitle, spokenBody); };


  useEffect(() => {
    setWaitDone(false);
    if (step?.waitFor !== "calendar" || calendarConnected()) return;
    const id = window.setInterval(() => {
      if (!calendarConnected()) return;
      window.clearInterval(id);
      setWaitDone(true);
      /* the toast "connected" first, then the next step */
      window.setTimeout(() => nextStep(), 900);
    }, 400);
    return () => window.clearInterval(id);
  }, [step, nextStep]);

  if (!tour || !step) return null;
  /* the card waits for its place: nothing is drawn top-left and then moved */
  const placed = rect !== null || missing || speaking;
  const total = tour.guide.steps.length;
  const last = tour.step === total - 1;

  /* card placement on web: preferred side, flipped when it would leave the window */
  let cardStyle: React.CSSProperties = {};
  let arrow: "top" | "bottom" | "left" | "right" = "top";
  if (speaking && !phone) {
    /* beside Mia, who stands in the bottom-right corner */
    cardStyle = { right: MIA_W + 28, bottom: 40 };
    arrow = "right";
  }
  /* a whole-page anchor: the card floats top-centre inside the lit area, no arrow */
  /* a "page-*" anchor is the whole content area: the card floats inside it, near the top, no arrow */
  const pageWide = !!(rect && !phone && (anchorName?.startsWith("page-") || (rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.7)));
  if (pageWide && rect) {
    const left = Math.round(Math.max(12, Math.min(window.innerWidth - CARD_W - 12, rect.left + Math.min(rect.width, window.innerWidth - rect.left) / 2 - CARD_W / 2)));
    const est = cardRef.current?.offsetHeight ?? 200;
    if (rect.top >= est) {
      /* room above the lit area (the edit bar with the text under it on a tablet): the card
         sits over the header rather than on the words being edited; a few pixels of its
         foot may rest on the light's own padding */
      cardStyle = { top: Math.max(8, rect.top - GAP - est), left };
      arrow = "bottom";
    } else {
      /* the whole page is lit: the card keeps to the bottom-right corner of the visible
         part, where the guide stood at the hello, out of the way of what it talks about */
      const vh = window.innerHeight;
      const bottom = Math.min(vh, rect.top + rect.height);
      cardStyle = { top: Math.max(24, bottom - est - 24), left: Math.max(12, Math.min(window.innerWidth - CARD_W - 12, rect.left + Math.min(rect.width, window.innerWidth - rect.left) - CARD_W - 24)) };
      arrow = "top";
    }
  }
  /* review 05.10: the card never sits on the control it points at. The preferred
     side first, then the opposite one, then the other two; when no side has room
     for the full card, a narrower card beside the control (a dialog filling a
     1024px window leaves about 250px each side) beats one on top of it */
  let cardW = CARD_W;
  if (rect && !phone && !pageWide) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const est = cardRef.current?.offsetHeight ?? 200;
    const pref = step.side ?? "bottom";
    const room: Record<Side, number> = { bottom: vh - (rect.top + rect.height + GAP) - 12, top: rect.top - GAP - 12, right: vw - (rect.left + rect.width + GAP) - 12, left: rect.left - GAP - 12 };
    const fits = (s: Side) => room[s] >= (s === "top" || s === "bottom" ? est : CARD_W);
    const squeeze = (sides: Side[]) => sides.filter((s) => (s === "left" || s === "right") && room[s] >= MIN_CARD_W).sort((a, b) => room[b] - room[a])[0];
    const own: Side[] = [pref, OPPOSITE[pref]];
    let side = own.find(fits);
    /* asked for beside: a narrower card beside still beats one over the dialog's other fields */
    if (!side && (pref === "left" || pref === "right")) { side = squeeze(own); if (side) cardW = Math.floor(room[side]); }
    if (!side) side = SIDES.filter((s) => !own.includes(s)).find(fits);
    if (!side) { side = squeeze(SIDES); if (side) cardW = Math.floor(room[side]); }
    if (!side) side = room.bottom >= room.top ? "bottom" : "top";
    const clampX = (x: number) => Math.max(12, Math.min(vw - cardW - 12, x));
    if (side === "bottom") { cardStyle = { top: rect.top + rect.height + GAP, left: clampX(rect.left) }; arrow = "top"; }
    if (side === "top") { cardStyle = { bottom: vh - rect.top + GAP, left: clampX(rect.left) }; arrow = "bottom"; }
    if (side === "right") { cardStyle = { top: Math.max(12, rect.top), left: rect.left + rect.width + GAP }; arrow = "left"; }
    if (side === "left") { cardStyle = { top: Math.max(12, rect.top), left: rect.left - GAP - cardW }; arrow = "right"; }
  }

  /* side "top" needs the card's real height so `top` can be animated like the other sides */
  if (rect && !phone && "bottom" in cardStyle && !speaking) {
    const h = cardRef.current?.offsetHeight ?? 150;
    cardStyle = { top: rect.top - GAP - h, left: cardStyle.left };
  }

  /* review 60: whatever the side, the card stays on the screen (1024x768 ran it off the bottom) */
  if (rect && !phone && typeof cardStyle.top === "number" && !speaking) {
    const h = cardRef.current?.offsetHeight ?? 200;
    cardStyle = { ...cardStyle, top: Math.max(12, Math.min(window.innerHeight - h - 12, cardStyle.top)) };
  }

  /* on the phone the card sits at the bottom, unless the lit element is down there too;
     handed over, it goes to the top whenever it fits above the control, because the
     bottom of a phone is where a sheet keeps its Start or Save button. A whole
     page lit stays at the bottom: its title and tabs, which the card talks
     about, are at the top. A lit bottom sheet that has grown too tall for the
     card to fit above it (the meeting sheet after a link is pasted) still takes
     the card at the top: over its title, never over its Transcribe now */
  const phoneCardH = cardRef.current?.offsetHeight ?? 190;
  const phonePage = !!(rect && (anchorName?.startsWith("page-") || rect.height > window.innerHeight * 0.7));
  const phoneSheet = !!(rect && rect.top > 0 && rect.top + rect.height >= window.innerHeight - 4);
  const phoneLow = !!(phone && rect && !handoff && !phonePage && rect.top + rect.height > window.innerHeight - 240);
  /* a lit control low on the screen (the + button) takes the card right above itself, so the
     words sit next to what they are about; only when there is no room above does the card go to the top */
  const phoneAbove = phoneLow && rect!.top >= phoneCardH + 28;
  /* handed over, the card goes to the top only when the light reaches into the bottom of the screen (a sheet's own buttons live there) */
  const handLow = !!(rect && rect.top + rect.height > window.innerHeight - phoneCardH - 40);
  const phoneTop = !!(phone && rect && (handoff ? (handLow && rect.top >= phoneCardH + 24) || phoneSheet : phoneLow && !phoneAbove));

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 30 };

  return createPortal(
    <div data-onboarding-tour="" data-handoff={live ? "" : undefined} className={cn("fixed inset-0 z-[300]", live ? "pointer-events-none" : "pointer-events-auto")}>
      {/* click catcher: a click on the dark goes to the next step; handed over, the page is live and nothing is dark */}
      {!live && <div className="absolute inset-0" onClick={nextStep} />}
      <AnimatePresence>
        {rect && (
          <motion.div
            key="light"
            className={cn("absolute pointer-events-none ring-2 ring-primary/70", rect.round ? "rounded-full" : "rounded-[14px]")}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1, top: rect.top, left: rect.left, width: rect.width, height: rect.height, boxShadow: live ? DIM_HANDOFF : DIM }}
            transition={spring}
            style={{ borderRadius: rect.round ? 9999 : RADIUS, boxShadow: live ? DIM_HANDOFF : DIM }}
          />
        )}
        {/* handed over, the page is live: the dark stays, lighter, and lets clicks through
            (the light and its shadow take no pointer events); the change is eased, not a jump */}
        {!rect && !live && (
          <motion.div key="dark" className="absolute inset-0 pointer-events-none" style={{ background: "rgba(15, 23, 42, 0.55)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        )}
      </AnimatePresence>

      {/* Mia: she steps in from the corner only to say hello; afterwards she stays on the cards */}
      {!phone && speaking && (
        <motion.div
          key="orb"
          className="pointer-events-none absolute flex items-center justify-center"
          style={{ right: 16, bottom: 0, width: MIA_W, height: MIA_H }}
          initial={reduce ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 26 }}
        >
          <Orb size={168} className="shadow-[0_24px_60px_rgba(37,99,235,0.45)] ring-0" />
        </motion.div>
      )}

      {placed && <motion.div
        key={tour.guide.id}
        ref={cardRef}
        role="dialog"
        aria-label={(phone && step.phoneTitle) || step.title}
        data-tour-card=""
        className={cn(
          "pointer-events-auto absolute flex flex-col gap-2 rounded-[16px] border border-border bg-popover p-4 text-popover-foreground shadow-[var(--elevation-md)]",
          phone && "left-3 right-3",
          phone && (phoneTop ? "top-[calc(12px+env(safe-area-inset-top))]" : phoneAbove ? "" : "bottom-[calc(16px+env(safe-area-inset-bottom))]"),
        )}
        style={phone ? (phoneAbove && rect ? { bottom: window.innerHeight - rect.top + 12 } : undefined) : { width: cardW }}
        initial={reduce ? false : { opacity: 0, y: 8, ...(phone ? {} : cardStyle) }}
        animate={{ opacity: 1, y: 0, ...(phone ? {} : cardStyle) }}
        transition={spring}
        onClick={(e) => e.stopPropagation()}
      >
        {!phone && (rect || speaking) && !pageWide && (
          <span
            aria-hidden
            className={cn(
              "absolute size-3 rotate-45 border border-border bg-popover",
              arrow === "top" && "-top-[7px] left-6 border-b-0 border-r-0",
              arrow === "bottom" && "-bottom-[7px] left-6 border-t-0 border-l-0",
              arrow === "left" && "-left-[7px] top-5 border-t-0 border-r-0",
              arrow === "right" && "-right-[7px] top-5 border-b-0 border-l-0",
            )}
          />
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-[10px]">
            {!(speaking && !phone) && <Orb size={32} className="block" />}
            <span className="flex min-w-0 flex-col justify-center">
              <span className="text-[13px] font-semibold leading-[17px] text-foreground">{GUIDE_PERSON.name}</span>
              <span className="text-[11.5px] font-medium leading-[15px] text-muted-foreground">{GUIDE_PERSON.title}</span>
            </span>
          </span>
          <span className="-mr-1 flex shrink-0 items-center">
            {/* say the line again: the guide may have spoken while the person looked elsewhere */}
            <button type="button" onClick={sayAgain} disabled={!spokenBody} aria-label="Play again" title="Play again" className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 pointer-coarse:size-9">
              <Icon icon={ReplayIcon} size={14} />
            </button>
            {/* the voice switch: off stays off for every later card */}
            <button type="button" onClick={() => { const next = !sound; setVoiceOn(next); setSound(next); }} aria-label={sound ? "Turn the voice off" : "Turn the voice on"} aria-pressed={sound} className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground pointer-coarse:size-9">
              <Icon icon={sound ? VolumeHighIcon : VolumeOffIcon} size={14} />
            </button>
            <button type="button" onClick={endTour} aria-label="Close the guide" className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground pointer-coarse:size-9">
              <Icon icon={Cancel01Icon} size={14} />
            </button>
          </span>
        </div>
        <p className="text-[15px] font-semibold leading-[20px] text-foreground">{(phone && step.phoneTitle) || spoken.title}</p>
        <p className="text-[13px] leading-[19px] text-pretty text-foreground/80">{missing ? (handoff ? "This part is not on the screen right now. Close me and press the step again." : "This part is not on the screen right now. Skip ahead.") : (phone && spoken.phoneBody) || (compact && step.compactBody) || spoken.body}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {tour.guide.steps.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all", i === tour.step ? "w-4 bg-primary" : "w-1.5 bg-border")} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {tour.step > 0 && (
              <Button variant="ghost" size="sm" onClick={prevStep} aria-label="Back" className="h-8 px-2.5 text-[13px] pointer-coarse:h-9 pointer-coarse:px-3">
                <Icon icon={ArrowLeft01Icon} size={14} />
              </Button>
            )}
            {/* handed over or waiting, there is nothing to press here: the real action moves it on */}
            {!live && <Button size="sm" data-tour-next="" onClick={() => { if (last && step.action?.kind === "upload") { nextStep(); setOpenModal("upload"); return; } nextStep(); }} className="h-8 pl-4 pr-3 text-[13px] font-semibold pointer-coarse:h-9">{last ? (step.action?.label ?? "Done") : <>Next<span className="ml-2 rounded-full bg-primary-foreground/20 px-[7px] text-[11px] font-semibold tabular-nums leading-[18px]">{tour.step + 1}/{total}</span></>}</Button>}
          </div>
        </div>
      </motion.div>}
    </div>,
    document.body,
  );
}
