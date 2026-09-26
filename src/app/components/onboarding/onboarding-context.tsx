import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GUIDES, type Guide, type TourTarget } from "./guides";

/* State of the "Get started" widget and its tours.

   Storage: one key, `ttt_onboarding_v1`, holding the finished guide ids, the
   two dismiss states and whether the reward was taken. Real actions count as
   well: a component fires `window.dispatchEvent(new CustomEvent("ttt-onboarding",
   { detail: "<guide id>" }))` and the guide is marked done without a tour.

   Demo flags (capture and QA):
   - `ttt_demo_onboarding=fresh`  nothing done, widget expanded
   - `ttt_demo_onboarding=half`   three guides done
   - `ttt_demo_onboarding=done`   all six done, reward shown
   - `ttt_demo_onboarding=off`    widget hidden */

const KEY = "ttt_onboarding_v1";
const EVENT = "ttt-onboarding";

type Stored = { done: string[]; hidden: boolean; rewardClaimed: boolean; expanded: boolean };
const EMPTY: Stored = { done: [], hidden: false, rewardClaimed: false, expanded: true };

function load(): Stored {
  if (typeof window === "undefined") return EMPTY;
  const demo = window.localStorage.getItem("ttt_demo_onboarding");
  if (demo === "fresh") return { ...EMPTY };
  if (demo === "half") return { ...EMPTY, done: GUIDES.slice(0, 3).map((g) => g.id) };
  if (demo === "five") return { ...EMPTY, done: GUIDES.slice(0, 5).map((g) => g.id) };
  if (demo === "done") return { ...EMPTY, done: GUIDES.map((g) => g.id) };
  if (demo === "off") return { ...EMPTY, hidden: true };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    return { ...EMPTY, ...parsed, done: Array.isArray(parsed.done) ? parsed.done : [] };
  } catch {
    return EMPTY;
  }
}

function save(s: Stored) {
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ }
}

export type Tour = { guide: Guide; step: number };
/* what to celebrate right after a tour ends: one lesson, or the whole guide */
export type Celebration = { kind: "guide"; guide: Guide; index: number } | "all" | null;

type Ctx = {
  guides: Guide[];
  done: Set<string>;
  allDone: boolean;
  hidden: boolean;
  rewardClaimed: boolean;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  hide: () => void;
  markDone: (id: string) => void;
  claimReward: () => void;
  tour: Tour | null;
  celebration: Celebration;
  dismissCelebration: () => void;
  startGuide: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  /* the app shell registers how to reach a page or a path */
  registerNavigator: (fn: (t: TourTarget) => void) => void;
};

const OnboardingContext = createContext<Ctx | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored>(load);
  const [tour, setTour] = useState<Tour | null>(null);
  const [celebration, setCelebration] = useState<Celebration>(null);
  const navigator = useRef<((t: TourTarget) => void) | null>(null);

  useEffect(() => { save(stored); }, [stored]);

  const markDone = useCallback((id: string) => {
    setStored((s) => (s.done.includes(id) ? s : { ...s, done: [...s.done, id] }));
  }, []);

  /* real actions count: see the header comment */
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const guide = GUIDES.find((g) => g.id === id); if (!guide) return;
      setStored((s) => {
        if (s.done.includes(guide.id)) return s;
        const done = [...s.done, guide.id];
        const all = GUIDES.every((g) => done.includes(g.id));
        setCelebration(all ? "all" : { kind: "guide", guide, index: GUIDES.findIndex((g) => g.id === guide.id) });
        return { ...s, done, expanded: all ? true : s.expanded };
      });
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [markDone]);

  const go = useCallback((t: TourTarget) => { navigator.current?.(t); }, []);

  const startGuide = useCallback((id: string) => {
    const guide = GUIDES.find((g) => g.id === id); if (!guide) return;
    setStored((s) => ({ ...s, expanded: false }));
    go(guide.steps[0].go);
    setTour({ guide, step: 0 });
  }, [go]);

  const endTour = useCallback(() => setTour(null), []);

  const finishGuide = useCallback((guide: Guide) => {
    setStored((s) => {
      const done = s.done.includes(guide.id) ? s.done : [...s.done, guide.id];
      const all = GUIDES.every((g) => done.includes(g.id));
      setCelebration(all ? "all" : { kind: "guide", guide, index: GUIDES.findIndex((g) => g.id === guide.id) });
      return { ...s, done, expanded: all ? true : s.expanded };
    });
  }, []);

  const nextStep = useCallback(() => {
    setTour((t) => {
      if (!t) return t;
      const last = t.step >= t.guide.steps.length - 1;
      if (last) { if (t.guide.completeBy !== "action") finishGuide(t.guide); return null; }
      const next = t.guide.steps[t.step + 1];
      go(next.go);
      return { guide: t.guide, step: t.step + 1 };
    });
  }, [go, finishGuide]);

  const prevStep = useCallback(() => {
    setTour((t) => {
      if (!t || t.step === 0) return t;
      const prev = t.guide.steps[t.step - 1];
      go(prev.go);
      return { guide: t.guide, step: t.step - 1 };
    });
  }, [go]);

  const value = useMemo<Ctx>(() => {
    const done = new Set(stored.done);
    return {
      guides: GUIDES,
      done,
      allDone: GUIDES.every((g) => done.has(g.id)),
      hidden: stored.hidden,
      rewardClaimed: stored.rewardClaimed,
      expanded: stored.expanded,
      setExpanded: (v) => setStored((s) => ({ ...s, expanded: v })),
      hide: () => setStored((s) => ({ ...s, hidden: true })),
      markDone,
      claimReward: () => setStored((s) => ({ ...s, rewardClaimed: true, hidden: true })),
      tour,
      celebration,
      dismissCelebration: () => setCelebration(null),
      startGuide,
      nextStep,
      prevStep,
      endTour,
      registerNavigator: (fn) => { navigator.current = fn; },
    };
  }, [stored, tour, celebration, markDone, startGuide, nextStep, prevStep, endTour]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding outside OnboardingProvider");
  return ctx;
}

/* For components that want to give credit for a real action without pulling
   the whole context: fire and forget. */
export function creditOnboarding(guideId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: guideId }));
}
