import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { useIsPhone } from "../ui/use-mobile";
import { cn } from "../ui/utils";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useTranscriptionModals } from "../transcription-modals";
import { useOnboarding } from "./onboarding-context";
import { GUIDE_PERSON, NO_ANCHOR } from "./guides";

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

type Rect = { top: number; left: number; width: number; height: number };

/* "a|b": the first visible anchor wins, so a phone layout without the web
   control can light its own stand-in (the menu button, the "+" button). */
function findAnchor(names: string): HTMLElement | null {
  for (const name of names.split("|")) {
    const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
    const hit = all.find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; });
    if (hit) return hit;
  }
  return null;
}

function measure(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
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
  const reduce = useReducedMotion();

  /* the moment a lesson ends: confetti and a word; the sixth opens the reward dialog instead of a toast */
  useEffect(() => {
    if (!celebration) return;
    if (celebration === "all") { celebrate(true); return; }
    celebrate(false);
    /* the toast carries the way on: the next lesson that is not done yet */
    const next = guides.find((g) => g.id !== celebration.guide.id && !done.has(g.id));
    const left = guides.filter((g) => g.id !== celebration.guide.id && !done.has(g.id)).length;
    toast.success(`Lesson ${celebration.index + 1} done`, {
      description: left > 0 ? `${left} ${left === 1 ? "lesson" : "lessons"} to go. A free month is waiting at the end.` : undefined,
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
  useEffect(() => {
    const t = step?.trigger;
    if (t) { triggerUsed.current = true; window.dispatchEvent(new CustomEvent("ttt-tour", { detail: t })); return; }
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

  /* wait for the anchor: the step may have just navigated to another page */
  useLayoutEffect(() => {
    if (!anchorName) { setRect(null); return; }
    setMissing(false);
    let frame = 0; let tries = 0; let cancelled = false;
    const look = () => {
      if (cancelled) return;
      const el = findAnchor(anchorName);
      if (el) {
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
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
      if (tries++ < 90) frame = requestAnimationFrame(look); else setMissing(true);
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

  useEffect(() => {
    if (!tour) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour();
      if (e.key === "ArrowRight" || e.key === "Enter") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [tour, nextStep, prevStep, endTour]);

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
  if (rect && !phone) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const est = 150;
    let side = step.side ?? "bottom";
    if (side === "bottom" && rect.top + rect.height + GAP + est > vh) side = "top";
    if (side === "top" && rect.top - GAP - est < 0) side = "bottom";
    if (side === "right" && rect.left + rect.width + GAP + CARD_W > vw) side = "bottom";
    if (side === "left" && rect.left - GAP - CARD_W < 0) side = "bottom";
    const clampX = (x: number) => Math.max(12, Math.min(vw - CARD_W - 12, x));
    if (side === "bottom") { cardStyle = { top: rect.top + rect.height + GAP, left: clampX(rect.left) }; arrow = "top"; }
    if (side === "top") { cardStyle = { bottom: vh - rect.top + GAP, left: clampX(rect.left) }; arrow = "bottom"; }
    if (side === "right") { cardStyle = { top: Math.max(12, rect.top), left: rect.left + rect.width + GAP }; arrow = "left"; }
    if (side === "left") { cardStyle = { top: Math.max(12, rect.top), left: rect.left - GAP - CARD_W }; arrow = "right"; }
  }

  /* side "top" needs the card's real height so `top` can be animated like the other sides */
  if (rect && !phone && "bottom" in cardStyle && !speaking) {
    const h = cardRef.current?.offsetHeight ?? 150;
    cardStyle = { top: rect.top - GAP - h, left: cardStyle.left };
  }

  /* on the phone the card sits at the bottom, unless the lit element is down there too */
  const phoneTop = !!(phone && rect && rect.top + rect.height > window.innerHeight - 240);

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 30 };

  return createPortal(
    <div data-onboarding-tour="" className="pointer-events-auto fixed inset-0 z-[300]">
      {/* click catcher: a click on the dark goes to the next step */}
      <div className="absolute inset-0" onClick={nextStep} />
      <AnimatePresence>
        {rect && (
          <motion.div
            key="light"
            className="absolute pointer-events-none rounded-[14px] ring-2 ring-primary/70"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1, top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
            transition={spring}
            style={{ borderRadius: RADIUS, boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)" }}
          />
        )}
        {!rect && (
          <motion.div key="dark" className="absolute inset-0 pointer-events-none" style={{ background: "rgba(15, 23, 42, 0.55)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        )}
      </AnimatePresence>

      {/* Mia: she stands in the bottom-right corner for the whole lesson and the card is her line */}
      {!phone && (
        <motion.img
          key="mia"
          src={GUIDE_PERSON.figure}
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-[16px] select-none object-contain object-bottom"
          style={{ width: MIA_W, height: MIA_H, filter: "drop-shadow(0 18px 30px rgba(10,22,48,0.45))" }}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 26 }}
        />
      )}

      {placed && <motion.div
        key={tour.guide.id}
        ref={cardRef}
        role="dialog"
        aria-label={step.title}
        data-tour-card=""
        className={cn(
          "absolute flex flex-col gap-2 rounded-[16px] border border-border bg-popover p-4 text-popover-foreground shadow-[var(--elevation-md)]",
          phone && "left-3 right-3",
          phone && (phoneTop ? "top-[calc(12px+env(safe-area-inset-top))]" : "bottom-[calc(16px+env(safe-area-inset-bottom))]"),
        )}
        style={phone ? undefined : { width: CARD_W }}
        initial={reduce ? false : { opacity: 0, y: 8, ...(phone ? {} : cardStyle) }}
        animate={{ opacity: 1, y: 0, ...(phone ? {} : cardStyle) }}
        transition={spring}
        onClick={(e) => e.stopPropagation()}
      >
        {!phone && (rect || speaking) && (
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
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-[8px]">
            {phone && <img src={GUIDE_PERSON.avatar} alt="" aria-hidden className="size-[24px] shrink-0 select-none rounded-full object-cover" />}
            <span className="flex flex-col">
              <span className="text-[12px] font-semibold leading-[15px] text-foreground">{GUIDE_PERSON.name}<span className="font-medium text-muted-foreground"> · {GUIDE_PERSON.title}</span></span>
              <span className="text-[11px] font-medium leading-[14px] tabular-nums text-muted-foreground">{tour.step + 1} of {total}</span>
            </span>
          </span>
          <button type="button" onClick={endTour} aria-label="Close the guide" className="-mr-1 -mt-1 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Icon icon={Cancel01Icon} size={14} />
          </button>
        </div>
        <p className="text-[15px] font-semibold leading-[20px] text-foreground">{step.title}</p>
        <p className="text-[13px] leading-[19px] text-foreground/80">{missing ? "This part is not on the screen right now. Skip ahead." : step.body}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {tour.guide.steps.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all", i === tour.step ? "w-4 bg-primary" : "w-1.5 bg-border")} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {tour.step > 0 && (
              <Button variant="ghost" size="sm" onClick={prevStep} aria-label="Back" className="h-8 px-2.5 text-[13px]">
                <Icon icon={ArrowLeft01Icon} size={14} />
              </Button>
            )}
            <Button size="sm" data-tour-next="" onClick={() => { if (last && step.action?.kind === "upload") { nextStep(); setOpenModal("upload"); return; } nextStep(); }} className="h-8 px-4 text-[13px] font-semibold">{last ? (step.action?.label ?? "Done") : "Next"}</Button>
          </div>
        </div>
      </motion.div>}
    </div>,
    document.body,
  );
}
